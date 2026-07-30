import "server-only";

export type PublicLiveRouteSafetyErrorCode =
  | "content_length_malformed"
  | "content_length_negative"
  | "content_length_understated"
  | "content_length_overstated"
  | "request_body_too_large"
  | "request_body_aborted"
  | "request_body_read_failed"
  | "request_body_already_consumed"
  | "request_body_decode_failed"
  | "request_body_invalid_json"
  | "request_body_invalid_form_data";

export class PublicLiveRouteSafetyError extends Error {
  constructor(readonly code: PublicLiveRouteSafetyErrorCode) {
    super(code);
    this.name = "PublicLiveRouteSafetyError";
    this.stack = undefined;
  }
}

export type BoundedRequestBody = Readonly<{
  byteLength: number;
  consume: () => Uint8Array;
}>;

type StreamReadOutcome =
  | {
    kind: "read";
    result: ReadableStreamReadResult<Uint8Array>;
  }
  | {
    kind: "failed";
  }
  | {
    kind: "aborted";
  };

function parseDeclaredContentLength(
  request: Request,
  maximumByteLength: number
): number | null {
  const value = request.headers.get("content-length");

  if (value === null) {
    return null;
  }

  if (/^-\d+$/u.test(value)) {
    throw new PublicLiveRouteSafetyError("content_length_negative");
  }

  if (!/^\d+$/u.test(value)) {
    throw new PublicLiveRouteSafetyError("content_length_malformed");
  }

  const declaredLength = BigInt(value);

  if (declaredLength > BigInt(maximumByteLength)) {
    throw new PublicLiveRouteSafetyError("request_body_too_large");
  }

  return Number(declaredLength);
}

async function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
) {
  try {
    await reader.cancel();
  } catch {
    // Cancellation is best effort after a categorical terminal condition.
  }
}

export async function readBoundedRequestBody(
  request: Request,
  maximumByteLength: number
): Promise<BoundedRequestBody> {
  if (
    !Number.isSafeInteger(maximumByteLength) ||
    maximumByteLength < 0
  ) {
    throw new PublicLiveRouteSafetyError("request_body_read_failed");
  }

  const declaredLength = parseDeclaredContentLength(
    request,
    maximumByteLength
  );
  const body = request.body;

  if (!body) {
    if (declaredLength !== null && declaredLength > 0) {
      throw new PublicLiveRouteSafetyError("content_length_overstated");
    }

    return createBoundedRequestBody(new Uint8Array());
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let actualByteLength = 0;
  let abortListener: (() => void) | null = null;
  const abortOutcome = new Promise<StreamReadOutcome>((resolve) => {
    abortListener = () => resolve({ kind: "aborted" });
    request.signal.addEventListener("abort", abortListener, { once: true });
  });

  try {
    if (request.signal.aborted) {
      await cancelReader(reader);
      throw new PublicLiveRouteSafetyError("request_body_aborted");
    }

    while (true) {
      const outcome = await Promise.race<StreamReadOutcome>([
        reader.read().then<StreamReadOutcome, StreamReadOutcome>(
          (result) => ({ kind: "read", result }),
          () => ({ kind: "failed" })
        ),
        abortOutcome,
      ]);

      if (outcome.kind === "aborted") {
        await cancelReader(reader);
        throw new PublicLiveRouteSafetyError("request_body_aborted");
      }

      if (outcome.kind === "failed") {
        await cancelReader(reader);
        throw new PublicLiveRouteSafetyError("request_body_read_failed");
      }

      if (outcome.result.done) {
        break;
      }

      const chunk = outcome.result.value;
      actualByteLength += chunk.byteLength;

      if (actualByteLength > maximumByteLength) {
        await cancelReader(reader);
        throw new PublicLiveRouteSafetyError("request_body_too_large");
      }

      chunks.push(chunk);
    }
  } finally {
    if (abortListener) {
      request.signal.removeEventListener("abort", abortListener);
    }
    reader.releaseLock();
  }

  if (
    declaredLength !== null &&
    declaredLength < actualByteLength
  ) {
    throw new PublicLiveRouteSafetyError("content_length_understated");
  }

  if (
    declaredLength !== null &&
    declaredLength > actualByteLength
  ) {
    throw new PublicLiveRouteSafetyError("content_length_overstated");
  }

  const bytes = new Uint8Array(actualByteLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return createBoundedRequestBody(bytes);
}

function createBoundedRequestBody(
  initialBytes: Uint8Array
): BoundedRequestBody {
  let bytes: Uint8Array | null = initialBytes;
  const byteLength = initialBytes.byteLength;

  return Object.freeze({
    byteLength,
    consume() {
      if (!bytes) {
        throw new PublicLiveRouteSafetyError(
          "request_body_already_consumed"
        );
      }

      const consumed = bytes;
      bytes = null;
      return consumed;
    },
  });
}

export function parseBoundedJsonBody(body: BoundedRequestBody): unknown {
  const bytes = body.consume();
  let text: string;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PublicLiveRouteSafetyError("request_body_decode_failed");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new PublicLiveRouteSafetyError("request_body_invalid_json");
  }
}

export async function parseBoundedFormData(
  body: BoundedRequestBody,
  contentType: string
): Promise<FormData> {
  const bytes = body.consume();
  const bodyBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(bodyBuffer).set(bytes);

  try {
    return await new Response(bodyBuffer, {
      headers: {
        "content-type": contentType,
      },
    }).formData();
  } catch {
    throw new PublicLiveRouteSafetyError(
      "request_body_invalid_form_data"
    );
  }
}
