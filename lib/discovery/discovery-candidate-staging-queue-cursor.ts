import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type CandidateStagingQueueCursorSortKey =
  | "created_at"
  | "updated_at"
  | "confidence_bucket";

export type CandidateStagingQueueCursorSortDirection = "asc" | "desc";

export type CandidateStagingQueueCursorPayload = {
  version: 1;
  sortKey: CandidateStagingQueueCursorSortKey;
  sortDirection: CandidateStagingQueueCursorSortDirection;
  lastValue: string | number | null;
  lastCandidateId: string;
  filtersHash: string;
};

export type CandidateStagingQueueCursorDecodeResult =
  | { ok: true; payload: CandidateStagingQueueCursorPayload }
  | {
      ok: false;
      errorCode: "invalid_cursor" | "cursor_version_unsupported";
    };

export type CandidateStagingQueueFiltersHashInput = {
  statuses: readonly string[];
  search: string | null;
  duplicateCheckStatus: string | null;
  confidenceBucket: string | null;
  discoverySourceId: string | null;
  discoveryRunId: string | null;
  auditCorrelationId: string | null;
  limit: number;
  sortKey: CandidateStagingQueueCursorSortKey;
  sortDirection: CandidateStagingQueueCursorSortDirection;
};

export type CandidateStagingQueueNextCursorInput = {
  sortKey: CandidateStagingQueueCursorSortKey;
  sortDirection: CandidateStagingQueueCursorSortDirection;
  lastValue: string | number | null;
  lastCandidateId: string;
  filtersHash: string;
};

const CURSOR_VERSION = 1;
const CURSOR_PARTS = 2;
const HMAC_ALGORITHM = "sha256";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getCursorSigningSecret() {
  const configuredSecret =
    process.env.CANDIDATE_STAGING_QUEUE_CURSOR_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "";

  if (configuredSecret) return configuredSecret;

  // Development/test-only fallback. Production should provide a server-only
  // signing secret through CANDIDATE_STAGING_QUEUE_CURSOR_SECRET or the existing
  // ADMIN_SESSION_SECRET. The value is never exposed to client components.
  if (process.env.NODE_ENV !== "production") {
    return "aifinder-candidate-staging-queue-cursor-development-secret";
  }

  return "";
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function stableCursorPayloadJson(payload: CandidateStagingQueueCursorPayload) {
  return JSON.stringify({
    version: payload.version,
    sortKey: payload.sortKey,
    sortDirection: payload.sortDirection,
    lastValue: payload.lastValue,
    lastCandidateId: payload.lastCandidateId,
    filtersHash: payload.filtersHash,
  });
}

function signPayload(encodedPayload: string) {
  const secret = getCursorSigningSecret();

  if (!secret) return "";

  return createHmac(HMAC_ALGORITHM, secret).update(encodedPayload).digest("base64url");
}

function safeSignatureMatches(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

function isSupportedSortKey(
  value: unknown,
): value is CandidateStagingQueueCursorSortKey {
  return (
    value === "created_at" ||
    value === "updated_at" ||
    value === "confidence_bucket"
  );
}

function isSupportedSortDirection(
  value: unknown,
): value is CandidateStagingQueueCursorSortDirection {
  return value === "asc" || value === "desc";
}

function isValidPayload(value: unknown): value is CandidateStagingQueueCursorPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (payload.version !== CURSOR_VERSION) return false;
  if (!isSupportedSortKey(payload.sortKey)) return false;
  if (!isSupportedSortDirection(payload.sortDirection)) return false;
  if (
    payload.lastValue !== null &&
    typeof payload.lastValue !== "string" &&
    typeof payload.lastValue !== "number"
  ) {
    return false;
  }
  if (
    typeof payload.lastCandidateId !== "string" ||
    !UUID_PATTERN.test(payload.lastCandidateId)
  ) {
    return false;
  }
  if (typeof payload.filtersHash !== "string" || payload.filtersHash.length === 0) {
    return false;
  }

  return true;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || null;
}

export function createCandidateStagingQueueFiltersHash(
  input: CandidateStagingQueueFiltersHashInput,
) {
  const stableFilters = {
    statuses: [...input.statuses].map((status) => status.trim()).sort(),
    search: normalizeOptionalText(input.search),
    duplicateCheckStatus: normalizeOptionalText(input.duplicateCheckStatus),
    confidenceBucket: normalizeOptionalText(input.confidenceBucket),
    discoverySourceId: normalizeOptionalText(input.discoverySourceId),
    discoveryRunId: normalizeOptionalText(input.discoveryRunId),
    auditCorrelationId: normalizeOptionalText(input.auditCorrelationId),
    limit: input.limit,
    sortKey: input.sortKey,
    sortDirection: input.sortDirection,
  };

  return createHash("sha256")
    .update(JSON.stringify(stableFilters))
    .digest("base64url");
}

export function encodeCandidateStagingQueueCursor(
  payload: CandidateStagingQueueCursorPayload,
) {
  const encodedPayload = toBase64Url(stableCursorPayloadJson(payload));
  const signature = signPayload(encodedPayload);

  if (!signature) {
    throw new Error("Candidate staging queue cursor signing is not configured.");
  }

  return `${encodedPayload}.${signature}`;
}

export function decodeCandidateStagingQueueCursor(
  token: string,
): CandidateStagingQueueCursorDecodeResult {
  const trimmed = token.trim();
  const parts = trimmed.split(".");

  if (parts.length !== CURSOR_PARTS || !parts[0] || !parts[1]) {
    return { ok: false, errorCode: "invalid_cursor" };
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = signPayload(encodedPayload);

  if (!expectedSignature || !safeSignatureMatches(signature, expectedSignature)) {
    return { ok: false, errorCode: "invalid_cursor" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return { ok: false, errorCode: "invalid_cursor" };
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    (parsed as { version?: unknown }).version !== CURSOR_VERSION
  ) {
    return { ok: false, errorCode: "cursor_version_unsupported" };
  }

  if (!isValidPayload(parsed)) {
    return { ok: false, errorCode: "invalid_cursor" };
  }

  return { ok: true, payload: parsed };
}

export function createCandidateStagingQueueNextCursor(
  input: CandidateStagingQueueNextCursorInput,
) {
  if (!input.lastCandidateId || !UUID_PATTERN.test(input.lastCandidateId)) {
    return null;
  }

  return encodeCandidateStagingQueueCursor({
    version: CURSOR_VERSION,
    sortKey: input.sortKey,
    sortDirection: input.sortDirection,
    lastValue: input.lastValue,
    lastCandidateId: input.lastCandidateId.toLowerCase(),
    filtersHash: input.filtersHash,
  });
}
