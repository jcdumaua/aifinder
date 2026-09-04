import { canonicalJson } from "./canonical.mjs";
import { ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS } from "./admin-v1-official-first-environment-runtime.mjs";

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP = Object.freeze([
  Object.freeze({
    operation: "create_environment",
    capability: "environment_mutation",
    budget_counter: "environment_creates",
    effect: "CREATE_EXACT",
  }),
]);

const CONFLICT_CODES = new Set([
  "ENV_ALREADY_EXISTS",
  "ENV_CONFLICT",
  "EXISTING_KEY_AND_TARGET",
]);
const INVALID_REQUEST_CODES = new Set([
  "BAD_REQUEST",
  "INVALID_KEY",
  "INVALID_VALUE",
  "KEY_INVALID_CHARACTERS",
  "KEY_INVALID_LENGTH",
  "KEY_RESERVED",
  "RESERVED_ENV_VARIABLE",
  "MISSING_ID",
  "MISSING_KEY",
  "MISSING_TARGET",
  "MISSING_VALUE",
  "SYSTEM_ENV_WITH_VALUE",
  "VALUE_INVALID_LENGTH",
  "VALUE_INVALID_TYPE",
]);

export class AdminV1OfficialFirstEnvironmentPlatformError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentPlatformError";
    this.code = code;
    for (const key of ["classification", "provider_code", "http_status_class"]) {
      if (Object.hasOwn(details, key)) this[key] = details[key];
    }
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function boundedAscii(value, maximum = 512) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && /^[\x20-\x7e]+$/u.test(value);
}

function httpStatusClass(status) {
  if (!Number.isSafeInteger(status)) return null;
  if (status >= 200 && status < 300) return "2XX";
  if (status >= 400 && status < 500) return "4XX";
  if (status >= 500 && status < 600) return "5XX";
  return "OTHER";
}

function failure(classification, { providerCode = null, status = null } = {}) {
  return new AdminV1OfficialFirstEnvironmentPlatformError(
    `FIRST_ENVIRONMENT_${classification}`,
    {
      classification,
      provider_code: providerCode,
      http_status_class: status === null ? null : httpStatusClass(status),
    },
  );
}

function boundedTransportStatus(response) {
  return exactKeys(response, ["status", "body"]) &&
    Number.isSafeInteger(response.status) && response.status >= 100 &&
    response.status <= 599;
}

function boundedTransportBody(body) {
  let size = 0;
  const visit = (value, key = "") => {
    if (/(raw|authorization|cookie|token|secret)/iu.test(key)) {
      return false;
    }
    if (/message/iu.test(key)) return true;
    if (value === null || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") {
      size += Buffer.byteLength(value, "utf8");
      return size <= 64 * 1024 && !value.includes("\0");
    }
    if (Array.isArray(value)) {
      return value.length <= 100 && value.every((entry) => visit(entry));
    }
    if (!value || typeof value !== "object" ||
      Object.getPrototypeOf(value) !== Object.prototype) return false;
    return Object.keys(value).every((childKey) => {
      size += Buffer.byteLength(childKey, "utf8");
      return size <= 64 * 1024 &&
        (/message/iu.test(childKey) || visit(value[childKey], childKey));
    });
  };
  return visit(body);
}

function exactCreatedEnvironmentResponseId(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const hasDirectId = Object.hasOwn(body, "id");
  const hasEnvelope = Object.hasOwn(body, "created") ||
    Object.hasOwn(body, "failed");
  if (hasDirectId === hasEnvelope) return null;
  if (hasDirectId) return boundedAscii(body.id, 256) ? body.id : null;
  if (!Object.hasOwn(body, "created") || !Object.hasOwn(body, "failed") ||
    !Array.isArray(body.failed) || body.failed.length !== 0 ||
    !Array.isArray(body.created) || body.created.length !== 1 ||
    !body.created[0] || typeof body.created[0] !== "object" ||
    Array.isArray(body.created[0]) || !boundedAscii(body.created[0].id, 256)) {
    return null;
  }
  return body.created[0].id;
}

function providerCode(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (Object.hasOwn(body, "code")) {
    return boundedAscii(body.code, 128) ? body.code : null;
  }
  const nested = body.error;
  if (!nested || typeof nested !== "object" || Array.isArray(nested) ||
    !Object.hasOwn(nested, "code")) return null;
  return boundedAscii(nested.code, 128) ? nested.code : null;
}

function descriptor(input, authorization) {
  if (
    !exactKeys(input, ["key", "value"]) ||
    input.key !== authorization.execution.environment_key ||
    !(input.value instanceof Uint8Array) || input.value.byteLength < 1 ||
    input.value.byteLength > 16_384
  ) {
    throw failure("FAIL_INVALID_CREATE_REQUEST");
  }
  return {
    service: "VERCEL",
    method: "POST",
    path:
      "/v10/projects/prj_BPaQVKdElriAhxabhoTkg8LysQ5R/env?" +
      "teamId=team_9POJYxNnjIBbrQ19My8M5yG3",
    body: {
      key: "ADMIN_PASSWORD",
      value: Buffer.from(
        input.value.buffer,
        input.value.byteOffset,
        input.value.byteLength,
      ).toString("utf8"),
      type: "sensitive",
      target: ["production"],
    },
  };
}

function exactNativeDescriptor(value) {
  return exactKeys(value, ["service", "method", "path", "body"]) &&
    value.service === "VERCEL" && value.method === "POST" &&
    value.path ===
      "/v10/projects/prj_BPaQVKdElriAhxabhoTkg8LysQ5R/env?" +
        "teamId=team_9POJYxNnjIBbrQ19My8M5yG3" &&
    exactKeys(value.body, ["key", "target", "type", "value"]) &&
    value.body.key === "ADMIN_PASSWORD" && boundedAscii(value.body.value, 16_384) &&
    !/[\0\r\n]/u.test(value.body.value) && value.body.type === "sensitive" &&
    canonicalJson(value.body.target) === '["production"]';
}

export function createAdminV1OfficialFirstEnvironmentNativeTransport({
  provider_auth,
  fetch_impl = globalThis.fetch,
}) {
  if (!(provider_auth instanceof Uint8Array) || provider_auth.byteLength < 1 ||
    provider_auth.byteLength > 16_384 || typeof fetch_impl !== "function") {
    throw new AdminV1OfficialFirstEnvironmentPlatformError(
      "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_INPUT",
    );
  }
  let creates = 0;
  return Object.freeze({
    async execute(request) {
      if (!exactKeys(request, ["operation", "descriptor"]) ||
        request.operation !== "create_environment" ||
        !exactNativeDescriptor(request.descriptor)) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_DENIED",
        );
      }
      if (creates !== 0) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_CREATE_BUDGET_EXHAUSTED",
        );
      }
      creates += 1;
      const token = Buffer.from(
        provider_auth.buffer,
        provider_auth.byteOffset,
        provider_auth.byteLength,
      ).toString("utf8");
      if (!boundedAscii(token, 16_384) || /[\0\r\n]/u.test(token)) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_INPUT",
        );
      }
      let response;
      try {
        response = await fetch_impl(
          `https://api.vercel.com${request.descriptor.path}`,
          {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(20_000),
            headers: {
              accept: "application/json",
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: canonicalJson(request.descriptor.body),
          },
        );
      } catch {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_CREATE_TRANSPORT",
        );
      }
      if (!Number.isSafeInteger(response?.status) || response.status < 100 ||
        response.status > 599 || typeof response.text !== "function") {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_RESPONSE",
        );
      }
      const text = await response.text();
      if (typeof text !== "string" || Buffer.byteLength(text, "utf8") > 64 * 1024 ||
        text.includes("\0")) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_RESPONSE",
        );
      }
      let body;
      try {
        body = text.length === 0 ? null : JSON.parse(text);
      } catch {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_RESPONSE",
        );
      }
      return { status: response.status, body };
    },
  });
}

export function createAdminV1OfficialFirstEnvironmentAdapter({
  authorization,
  transport,
}) {
  if (authorization?.operation_class !==
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS ||
    typeof transport?.execute !== "function") {
    throw new AdminV1OfficialFirstEnvironmentPlatformError(
      "FIRST_ENVIRONMENT_ADAPTER_INPUT",
    );
  }
  return Object.freeze({
    async createEnvironment(input) {
      const requestDescriptor = descriptor(input, authorization);
      let response;
      try {
        response = await transport.execute(Object.freeze({
          operation: "create_environment",
          descriptor: structuredClone(requestDescriptor),
        }));
      } catch (error) {
        if (error?.code === "FIRST_ENVIRONMENT_CREATE_BUDGET_EXHAUSTED") {
          throw error;
        }
        throw failure("FAIL_CREATE_TRANSPORT");
      }
      if (!boundedTransportStatus(response)) {
        throw failure("FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE");
      }
      if (!boundedTransportBody(response.body)) {
        throw failure("FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE", {
          status: response.status,
        });
      }
      const statusClass = httpStatusClass(response.status);
      if (statusClass === "2XX") {
        const recordId = exactCreatedEnvironmentResponseId(response.body);
        if (recordId === null) {
          throw failure("FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE", {
            status: response.status,
          });
        }
        return { status: "CREATED_EXACT", record_id: recordId };
      }
      const code = providerCode(response.body);
      if (CONFLICT_CODES.has(code)) {
        throw failure("FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT", {
          providerCode: code,
          status: response.status,
        });
      }
      if (code === "NOT_AUTHORIZED") {
        throw failure("FAIL_PROVIDER_AUTHENTICATION_UNAVAILABLE", {
          providerCode: code,
          status: response.status,
        });
      }
      if (code === "FORBIDDEN") {
        throw failure("FAIL_PROVIDER_PERMISSION_DENIED", {
          providerCode: code,
          status: response.status,
        });
      }
      if (INVALID_REQUEST_CODES.has(code)) {
        throw failure("FAIL_INVALID_CREATE_REQUEST", {
          providerCode: code,
          status: response.status,
        });
      }
      if (response.status === 429) {
        throw failure("FAIL_PROVIDER_RATE_LIMITED", {
          providerCode: code,
          status: response.status,
        });
      }
      if (statusClass === "5XX") {
        throw failure("FAIL_PROVIDER_FAILURE", {
          providerCode: code,
          status: response.status,
        });
      }
      throw failure("FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE", {
        providerCode: code,
        status: response.status,
      });
    },
  });
}
