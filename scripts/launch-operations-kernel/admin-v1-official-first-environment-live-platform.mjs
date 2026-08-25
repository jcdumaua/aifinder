import { canonicalJson } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS,
} from "./admin-v1-official-first-environment-runtime.mjs";

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP = Object.freeze([
  Object.freeze({
    operation: "create_environment",
    capability: "environment_mutation",
    budget_counter: "environment_creates",
    effect: "CREATE_EXACT",
  }),
  Object.freeze({
    operation: "verify_environment_identity",
    capability: "environment_identity_read",
    budget_counter: "environment_identity_reads",
    effect: "READ_EXACT",
  }),
  Object.freeze({
    operation: "delete_environment",
    capability: "environment_mutation",
    budget_counter: "environment_deletes",
    effect: "DELETE_EXACT",
  }),
]);

const ENVIRONMENT_FAILURE_CLASSES = new Set([
  "ENVIRONMENT_VALUE_SHAPE_INVALID",
  "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
  "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
]);
const HTTP_STATUS_CLASSES = new Set(["2XX", "4XX", "5XX", "OTHER"]);

export class AdminV1OfficialFirstEnvironmentPlatformError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentPlatformError";
    this.code = code;
    if (details.environment_create_failure_class !== undefined) {
      this.environment_create_failure_class =
        details.environment_create_failure_class;
    }
    if (details.http_status_class !== undefined) {
      this.http_status_class = details.http_status_class;
    }
  }
}

function boundedText(value, maximum = 1024) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && !value.includes("\0");
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function httpStatusClass(status) {
  if (!Number.isSafeInteger(status)) return null;
  if (status >= 200 && status < 300) return "2XX";
  if (status >= 400 && status < 500) return "4XX";
  if (status >= 500 && status < 600) return "5XX";
  return "OTHER";
}

function createFailure(code, failureClass, statusClass = null) {
  if (
    !ENVIRONMENT_FAILURE_CLASSES.has(failureClass) ||
    !(statusClass === null || HTTP_STATUS_CLASSES.has(statusClass))
  ) {
    throw new AdminV1OfficialFirstEnvironmentPlatformError(
      "FIRST_ENVIRONMENT_ADAPTER_INPUT",
    );
  }
  return new AdminV1OfficialFirstEnvironmentPlatformError(code, {
    environment_create_failure_class: failureClass,
    http_status_class: statusClass,
  });
}

function boundedTransportResponse(response) {
  if (!exactKeys(response, ["status", "body"]) ||
    !Number.isSafeInteger(response.status)) return false;
  let size = 0;
  const visit = (value, key = "") => {
    if (/(raw|authorization|cookie|token|secret)/iu.test(key)) return false;
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
    return Object.entries(value).every(([childKey, child]) => {
      size += Buffer.byteLength(childKey, "utf8");
      return size <= 64 * 1024 && visit(child, childKey);
    });
  };
  return visit(response.body);
}

function exactCreatedEnvironmentResponseId(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const hasDirectId = Object.hasOwn(body, "id");
  const hasEnvelope = Object.hasOwn(body, "created") ||
    Object.hasOwn(body, "failed");
  if (hasDirectId === hasEnvelope) return null;
  if (hasDirectId) return boundedText(body.id, 256) ? body.id : null;
  if (
    Object.hasOwn(body, "failed") &&
    (!Array.isArray(body.failed) || body.failed.length !== 0)
  ) return null;
  const created = Array.isArray(body.created) ? body.created : [body.created];
  if (
    created.length !== 1 || !created[0] ||
    typeof created[0] !== "object" || Array.isArray(created[0]) ||
    !boundedText(created[0].id, 256)
  ) return null;
  return created[0].id;
}

function exactReadback(body, authorization, recordId, key) {
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    body.id !== recordId || body.key !== key || body.type !== "encrypted" ||
    canonicalJson(body.target) !== '["preview"]' ||
    body.gitBranch !== authorization.execution.environment_git_branch
  ) return false;
  const projectFacts = [body.projectId, body.project?.id]
    .filter((value) => value !== undefined && value !== null);
  if (
    projectFacts.length < 1 ||
    !projectFacts.every((value) =>
      value === authorization.execution.preview_project_id
    )
  ) return false;
  const teamFacts = [
    body.accountId,
    body.teamId,
    body.project?.accountId,
    body.project?.teamId,
  ].filter((value) => value !== undefined && value !== null);
  return teamFacts.length >= 1 && teamFacts.every((value) =>
    value === authorization.execution.preview_team_id
  );
}

function descriptor(operation, input, authorization) {
  const team = `teamId=${encodeURIComponent(
    authorization.execution.preview_team_id,
  )}`;
  const project = encodeURIComponent(authorization.execution.preview_project_id);
  if (operation === "create_environment") {
    if (
      input.key !== authorization.execution.environment_key ||
      !(input.value instanceof Uint8Array) || input.value.byteLength < 1 ||
      input.value.byteLength > 16_384
    ) {
      throw createFailure(
        "FIRST_ENVIRONMENT_VALUE_SHAPE_INVALID",
        "ENVIRONMENT_VALUE_SHAPE_INVALID",
      );
    }
    return {
      service: "VERCEL",
      method: "POST",
      path: `/v10/projects/${project}/env?${team}&upsert=false`,
      body: {
        key: input.key,
        value: Buffer.from(
          input.value.buffer,
          input.value.byteOffset,
          input.value.byteLength,
        ).toString("utf8"),
        type: "encrypted",
        target: ["preview"],
        gitBranch: authorization.execution.environment_git_branch,
      },
    };
  }
  if (operation === "verify_environment_identity") {
    if (
      input.key !== authorization.execution.environment_key ||
      !boundedText(input.record_id, 256)
    ) {
      throw new AdminV1OfficialFirstEnvironmentPlatformError(
        "FIRST_ENVIRONMENT_ADAPTER_INPUT",
      );
    }
    return {
      service: "VERCEL",
      method: "GET",
      path: `/v9/projects/${project}/env/${encodeURIComponent(
        input.record_id,
      )}?decrypt=false&${team}`,
    };
  }
  if (operation === "delete_environment") {
    if (!boundedText(input.record_id, 256)) {
      throw new AdminV1OfficialFirstEnvironmentPlatformError(
        "FIRST_ENVIRONMENT_ADAPTER_INPUT",
      );
    }
    return {
      service: "VERCEL",
      method: "DELETE",
      path: `/v9/projects/${project}/env/${encodeURIComponent(
        input.record_id,
      )}?${team}`,
    };
  }
  throw new AdminV1OfficialFirstEnvironmentPlatformError(
    "FIRST_ENVIRONMENT_ADAPTER_OPERATION_DENIED",
  );
}

const NATIVE_OPERATION_CONTRACT = Object.freeze({
  create_environment: Object.freeze({ method: "POST", maximum: 1 }),
  verify_environment_identity: Object.freeze({ method: "GET", maximum: 1 }),
  delete_environment: Object.freeze({ method: "DELETE", maximum: 1 }),
});

function exactNativeDescriptor(operation, value) {
  const contract = NATIVE_OPERATION_CONTRACT[operation];
  if (
    !contract || !exactKeys(value, ["service", "method", "path", "body"]) &&
      !exactKeys(value, ["service", "method", "path"]) ||
    value.service !== "VERCEL" || value.method !== contract.method ||
    !boundedText(value.path, 1024) || !value.path.startsWith("/") ||
    value.path.startsWith("//") || value.path.includes("\0") ||
    value.path.includes("#")
  ) return false;
  const project = "prj_BPaQVKdElriAhxabhoTkg8LysQ5R";
  const team = "teamId=team_9POJYxNnjIBbrQ19My8M5yG3";
  if (operation === "create_environment") {
    return value.path === `/v10/projects/${project}/env?${team}&upsert=false` &&
      exactKeys(value.body, ["gitBranch", "key", "target", "type", "value"]) &&
      value.body.key === "ADMIN_PASSWORD" &&
      boundedText(value.body.value, 16_384) && !/[\0\r\n]/u.test(value.body.value) &&
      value.body.type === "encrypted" &&
      canonicalJson(value.body.target) === '["preview"]' &&
      value.body.gitBranch === "main";
  }
  if (Object.hasOwn(value, "body")) return false;
  const prefix = `/v9/projects/${project}/env/`;
  const suffix = operation === "verify_environment_identity"
    ? `?decrypt=false&${team}`
    : `?${team}`;
  if (!value.path.startsWith(prefix) || !value.path.endsWith(suffix)) return false;
  const encodedId = value.path.slice(prefix.length, -suffix.length);
  if (
    encodedId.length < 1 || encodedId.length > 768 || encodedId.includes("/") ||
    encodedId.includes("?") || encodedId.includes("&") ||
    encodedId.includes("=")
  ) return false;
  try {
    const decoded = decodeURIComponent(encodedId);
    return boundedText(decoded, 256) && encodeURIComponent(decoded) === encodedId;
  } catch {
    return false;
  }
}

export function createAdminV1OfficialFirstEnvironmentNativeTransport({
  provider_auth,
  fetch_impl = globalThis.fetch,
}) {
  if (
    !(provider_auth instanceof Uint8Array) || provider_auth.byteLength < 1 ||
    provider_auth.byteLength > 16_384 || typeof fetch_impl !== "function"
  ) {
    throw new AdminV1OfficialFirstEnvironmentPlatformError(
      "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_INPUT",
    );
  }
  const counts = new Map(Object.keys(NATIVE_OPERATION_CONTRACT).map((key) =>
    [key, 0]
  ));
  return Object.freeze({
    async execute(request) {
      if (
        !exactKeys(request, ["operation", "descriptor"]) ||
        !exactNativeDescriptor(request.operation, request.descriptor)
      ) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_DENIED",
        );
      }
      const next = (counts.get(request.operation) ?? 0) + 1;
      if (next > NATIVE_OPERATION_CONTRACT[request.operation].maximum) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_BUDGET",
        );
      }
      counts.set(request.operation, next);
      const token = Buffer.from(
        provider_auth.buffer,
        provider_auth.byteOffset,
        provider_auth.byteLength,
      ).toString("utf8");
      if (!boundedText(token, 16_384) || /[\0\r\n]/u.test(token)) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_INPUT",
        );
      }
      const init = {
        method: request.descriptor.method,
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
      };
      if (Object.hasOwn(request.descriptor, "body")) {
        init.body = canonicalJson(request.descriptor.body);
        init.headers["content-type"] = "application/json";
      }
      let response;
      try {
        response = await fetch_impl(
          `https://api.vercel.com${request.descriptor.path}`,
          init,
        );
      } catch {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_TRANSPORT_OR_HTTP_FAILURE",
        );
      }
      if (
        !Number.isSafeInteger(response?.status) || response.status < 100 ||
        response.status > 599 || typeof response.text !== "function"
      ) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_RESPONSE",
        );
      }
      if (response.status === 204) return { status: 204, body: null };
      const text = await response.text();
      if (
        typeof text !== "string" || Buffer.byteLength(text, "utf8") > 64 * 1024 ||
        text.includes("\0")
      ) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_RESPONSE",
        );
      }
      let body;
      try {
        body = JSON.parse(text);
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
  if (
    authorization?.operation_class !==
      ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS ||
    typeof transport?.execute !== "function"
  ) {
    throw new AdminV1OfficialFirstEnvironmentPlatformError(
      "FIRST_ENVIRONMENT_ADAPTER_INPUT",
    );
  }

  const execute = async (operation, input) => {
    const requestDescriptor = descriptor(operation, input, authorization);
    let response;
    try {
      response = await transport.execute(Object.freeze({
        operation,
        descriptor: structuredClone(requestDescriptor),
      }));
    } catch {
      if (operation === "create_environment") {
        throw createFailure(
          "FIRST_ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
          "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
        );
      }
      throw new AdminV1OfficialFirstEnvironmentPlatformError(
        "FIRST_ENVIRONMENT_TRANSPORT_OR_HTTP_FAILURE",
      );
    }
    if (!boundedTransportResponse(response)) {
      if (operation === "create_environment") {
        throw createFailure(
          "FIRST_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
          "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
        );
      }
      throw new AdminV1OfficialFirstEnvironmentPlatformError(
        "FIRST_ENVIRONMENT_ADAPTER_RESULT",
      );
    }
    return response;
  };

  return Object.freeze({
    async createEnvironment(input) {
      const response = await execute("create_environment", input);
      const statusClass = httpStatusClass(response.status);
      if (statusClass !== "2XX") {
        throw createFailure(
          "FIRST_ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
          "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
          statusClass,
        );
      }
      const recordId = exactCreatedEnvironmentResponseId(response.body);
      if (recordId === null) {
        throw createFailure(
          "FIRST_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
          "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
          "2XX",
        );
      }
      return { status: "CREATED_EXACT", record_id: recordId };
    },
    async deleteEnvironment(input) {
      const response = await execute("delete_environment", input);
      const exactBody = response.body === null ||
        (exactKeys(response.body, ["id"]) &&
          response.body.id === input.record_id);
      if (![200, 204].includes(response.status) || !exactBody) {
        throw new AdminV1OfficialFirstEnvironmentPlatformError(
          "FIRST_ENVIRONMENT_DELETE_UNPROVEN",
        );
      }
      return { status: "DELETED_EXACT", record_id: input.record_id };
    },
    async verifyEnvironmentIdentity(input) {
      const response = await execute("verify_environment_identity", input);
      if (
        response.status !== 200 ||
        !exactReadback(
          response.body,
          authorization,
          input.record_id,
          input.key,
        )
      ) {
        throw createFailure(
          "FIRST_ENVIRONMENT_IDENTITY_UNPROVEN",
          "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
          httpStatusClass(response.status),
        );
      }
      return { status: "EXACT", record_id: input.record_id };
    },
  });
}
