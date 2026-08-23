import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_JSON_RESPONSE_BYTES = 1024 * 1024;
const STORAGE_GRANT_TTL_SECONDS = 300;
const PREVIEW_READY_ATTEMPTS = 8;
const PREVIEW_READY_DELAY_MS = 15_000;
const PREVIEW_LIFECYCLE_STATES = new Set([
  "BUILDING",
  "CANCELED",
  "ERROR",
  "INITIALIZING",
  "QUEUED",
  "READY",
]);
const PREVIEW_TERMINAL_FAILURE_STATES = new Set(["CANCELED", "ERROR"]);
const PROVIDER_RESPONSE_CLASSES = new Set([
  "NOT_APPLICABLE",
  "NETWORK_FAILURE",
  "AUTHENTICATION_REJECTED",
  "AUTHORIZATION_DENIED",
  "RESOURCE_NOT_FOUND",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "CLIENT_ERROR",
  "REDIRECTED",
  "UNEXPECTED_STATUS",
]);
const STORAGE_CAS_PHASE = "34IA-34IZ";
const SYNTHETIC_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createFreshSyntheticPng(random_bytes) {
  const nonce = random_bytes(32);
  if (!(nonce instanceof Uint8Array) || nonce.byteLength !== 32) {
    throw new ConcreteLivePlatformError("CONCRETE_STORAGE_PAYLOAD_INVALID");
  }
  const nonceBytes = Buffer.from(nonce);
  let nonceText;
  try {
    nonceText = nonceBytes.toString("hex");
  } finally {
    nonceBytes.fill(0);
    if (typeof nonce.fill === "function") nonce.fill(0);
  }
  const base = Buffer.from(SYNTHETIC_PNG_BASE64, "base64");
  const type = Buffer.from("tEXt", "ascii");
  const data = Buffer.from(`aifinder-qualification\0${nonceText}`, "utf8");
  const chunk = Buffer.allocUnsafe(12 + data.byteLength);
  chunk.writeUInt32BE(data.byteLength, 0);
  type.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    pngCrc32(chunk.subarray(4, 8 + data.byteLength)),
    8 + data.byteLength,
  );
  return Buffer.concat([
    base.subarray(0, base.byteLength - 12),
    chunk,
    base.subarray(base.byteLength - 12),
  ]);
}

export class ConcreteLivePlatformError extends Error {
  constructor(code, providerResponseClass = "NOT_APPLICABLE") {
    super(code);
    this.name = "ConcreteLivePlatformError";
    this.code = code;
    this.provider_response_class = PROVIDER_RESPONSE_CLASSES.has(
      providerResponseClass,
    )
      ? providerResponseClass
      : "NOT_APPLICABLE";
  }
}

function classifyProviderResponseStatus(status) {
  if (status === 401) return "AUTHENTICATION_REJECTED";
  if (status === 403) return "AUTHORIZATION_DENIED";
  if (status === 404) return "RESOURCE_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (Number.isSafeInteger(status) && status >= 500 && status <= 599) {
    return "SERVER_ERROR";
  }
  if (Number.isSafeInteger(status) && status >= 400 && status <= 499) {
    return "CLIENT_ERROR";
  }
  if (Number.isSafeInteger(status) && status >= 300 && status <= 399) {
    return "REDIRECTED";
  }
  return "UNEXPECTED_STATUS";
}

function boundedText(value, maximum = 1024) {
  return typeof value === "string" && value.length >= 1 && value.length <= maximum;
}

const SAFE_RESPONSE_HEADERS = Object.freeze([
  ["allow", "allow"],
  ["cache-control", "cache_control"],
  ["content-security-policy", "content_security_policy"],
  ["content-type", "content_type"],
  ["cross-origin-opener-policy", "cross_origin_opener_policy"],
  ["permissions-policy", "permissions_policy"],
  ["referrer-policy", "referrer_policy"],
  ["strict-transport-security", "strict_transport_security"],
  ["x-content-type-options", "x_content_type_options"],
  ["x-dns-prefetch-control", "x_dns_prefetch_control"],
  ["x-frame-options", "x_frame_options"],
]);

function boundedResponseHeader(value, maximum = 4096) {
  return value === null ||
    (typeof value === "string" && value.length <= maximum && !/[\0\r\n]/u.test(value));
}

function projectResponseHeaders(response) {
  const projection = Object.fromEntries(
    SAFE_RESPONSE_HEADERS.map(([, output]) => [output, null]),
  );
  projection.set_cookie = [];
  if (!response?.headers || typeof response.headers.get !== "function") {
    return projection;
  }
  try {
    for (const [header, output] of SAFE_RESPONSE_HEADERS) {
      const value = response.headers.get(header);
      if (!boundedResponseHeader(value)) {
        throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
      }
      projection[output] = value;
    }
    const setCookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (() => {
          const combined = response.headers.get("set-cookie");
          return combined === null ? [] : [combined];
        })();
    if (
      !Array.isArray(setCookies) || setCookies.length > 4 ||
      setCookies.some((value) => !boundedResponseHeader(value, 16_384))
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
    }
    projection.set_cookie = setCookies.map((value) => Buffer.from(value, "latin1"));
    return projection;
  } catch (error) {
    for (const value of projection.set_cookie) value.fill(0);
    if (error instanceof ConcreteLivePlatformError) throw error;
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function assertNoDuplicateJsonObjectKeys(text) {
  let index = 0;
  const whitespace = /[\u0009\u000a\u000d\u0020]/u;
  const skipWhitespace = () => {
    while (index < text.length && whitespace.test(text[index])) index += 1;
  };
  const scanString = () => {
    const start = index;
    if (text[index] !== '"') throw new Error("JSON_STRING");
    index += 1;
    while (index < text.length) {
      if (text[index] === "\\") {
        index += 2;
        continue;
      }
      if (text[index] === '"') {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      index += 1;
    }
    throw new Error("JSON_STRING");
  };
  const scanValue = () => {
    skipWhitespace();
    if (text[index] === "{") {
      scanObject();
      return;
    }
    if (text[index] === "[") {
      scanArray();
      return;
    }
    if (text[index] === '"') {
      scanString();
      return;
    }
    const start = index;
    while (
      index < text.length &&
      !whitespace.test(text[index]) &&
      ![",", "]", "}"].includes(text[index])
    ) index += 1;
    if (index === start) throw new Error("JSON_VALUE");
  };
  const scanObject = () => {
    index += 1;
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return;
    }
    const keys = new Set();
    while (index < text.length) {
      skipWhitespace();
      const key = scanString();
      if (keys.has(key)) throw new Error("JSON_DUPLICATE_KEY");
      keys.add(key);
      skipWhitespace();
      if (text[index] !== ":") throw new Error("JSON_COLON");
      index += 1;
      scanValue();
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      if (text[index] !== ",") throw new Error("JSON_OBJECT_SEPARATOR");
      index += 1;
    }
    throw new Error("JSON_OBJECT");
  };
  const scanArray = () => {
    index += 1;
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return;
    }
    while (index < text.length) {
      scanValue();
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      if (text[index] !== ",") throw new Error("JSON_ARRAY_SEPARATOR");
      index += 1;
    }
    throw new Error("JSON_ARRAY");
  };
  scanValue();
  skipWhitespace();
  if (index !== text.length) throw new Error("JSON_TRAILING_BYTES");
}

async function readBoundedJsonText(response) {
  const contentLength = response?.headers?.get?.("content-length") ?? null;
  if (
    contentLength !== null &&
    (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength) ||
      Number(contentLength) > MAX_JSON_RESPONSE_BYTES)
  ) {
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
  const reader = response?.body?.getReader?.();
  if (reader) {
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!(value instanceof Uint8Array)) {
          throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
        }
        size += value.byteLength;
        if (size > MAX_JSON_RESPONSE_BYTES) {
          value.fill(0);
          await reader.cancel().catch(() => {});
          throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
        }
        chunks.push(Buffer.from(value));
        value.fill(0);
      }
      const bytes = Buffer.concat(chunks, size);
      try {
        return {
          bytes: size,
          text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        };
      } finally {
        bytes.fill(0);
        for (const chunk of chunks) chunk.fill(0);
      }
    } catch (error) {
      for (const chunk of chunks) chunk.fill(0);
      if (error instanceof ConcreteLivePlatformError) throw error;
      throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
    }
  }
  if (typeof response?.text !== "function") {
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
  let text;
  try {
    text = await response.text();
  } catch {
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
  if (typeof text !== "string") {
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes > MAX_JSON_RESPONSE_BYTES) {
    throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
  }
  return { bytes, text };
}

function exactGitOutput(result, { allow_stderr = false } = {}) {
  if (
    !result ||
    result.status !== 0 ||
    typeof result.stdout !== "string" ||
    typeof result.stderr !== "string" ||
    (!allow_stderr && result.stderr !== "") ||
    result.stdout.length > 1024 * 1024 ||
    result.stderr.length > 1024 * 1024 ||
    result.stdout.includes("\0") ||
    result.stderr.includes("\0")
  ) {
    throw new ConcreteLivePlatformError("CONCRETE_GIT_OPERATION_FAILED");
  }
  return result.stdout;
}

function classifyRemoteRef(output, branch) {
  if (output === "") return { status: "ABSENT" };
  const expectedRef = `refs/heads/${branch}`;
  const lines = output.endsWith("\n")
    ? output.slice(0, -1).split("\n")
    : [];
  if (lines.length !== 1) {
    throw new ConcreteLivePlatformError("CONCRETE_GIT_REF_AMBIGUOUS");
  }
  const fields = lines[0].split("\t");
  if (
    fields.length !== 2 ||
    !/^[0-9a-f]{40}$/u.test(fields[0]) ||
    fields[1] !== expectedRef
  ) {
    throw new ConcreteLivePlatformError("CONCRETE_GIT_REF_AMBIGUOUS");
  }
  return { status: "PRESENT", commit_sha: fields[0] };
}

export function createConcreteLiveTransport({
  fetch_impl = globalThis.fetch,
  spawn_sync = spawnSync,
  git_execution_context = null,
} = {}) {
  if (typeof fetch_impl !== "function" || typeof spawn_sync !== "function") {
    throw new ConcreteLivePlatformError("CONCRETE_LIVE_TRANSPORT_INVALID");
  }
  const gitConfigurationEnvironment = Object.freeze({
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    LC_ALL: "C",
  });
  const runGit = (
    authorization,
    credentials,
    args,
    { allow_stderr = false } = {},
  ) => {
    if (
      !exactKeys(git_execution_context, ["git_dir", "object_directory"]) ||
      !boundedText(git_execution_context.git_dir, 4096) ||
      !boundedText(git_execution_context.object_directory, 4096) ||
      !git_execution_context.git_dir.startsWith("/") ||
      !git_execution_context.object_directory.startsWith("/") ||
      git_execution_context.git_dir.includes("\0") ||
      git_execution_context.object_directory.includes("\0")
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_GIT_CONTEXT_INVALID");
    }
    if (
      !boundedText(credentials?.github_token, 16 * 1024) ||
      /[\0\r\n]/u.test(credentials.github_token)
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_GIT_CREDENTIAL_INVALID");
    }
    const basicBytes = Buffer.from(
      `x-access-token:${credentials.github_token}`,
      "utf8",
    );
    const remoteUrl =
      `https://github.com/${authorization.repository.remote_repository}.git`;
    const childEnvironment = {
      AIFINDER_GIT_HTTP_AUTHORIZATION:
        `Authorization: Basic ${basicBytes.toString("base64")}`,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_DIR: git_execution_context.git_dir,
      GIT_OBJECT_DIRECTORY: git_execution_context.object_directory,
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
      LC_ALL: "C",
      GIT_ASKPASS: "/usr/bin/false",
      SSH_ASKPASS: "/usr/bin/false",
    };
    basicBytes.fill(0);
    try {
      const result = spawn_sync("/usr/bin/git", [
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "credential.helper=",
        "-c",
        "credential.interactive=false",
        "-c",
        "http.proxy=",
        "-c",
        `http.${remoteUrl}.proxy=`,
        "-c",
        "http.sslVerify=true",
        "-c",
        "http.followRedirects=false",
        "-c",
        "protocol.allow=never",
        "-c",
        "protocol.https.allow=always",
        "-c",
        `url.${remoteUrl}.insteadOf=${remoteUrl}`,
        "-c",
        `url.${remoteUrl}.pushInsteadOf=${remoteUrl}`,
        "--config-env=http.extraHeader=AIFINDER_GIT_HTTP_AUTHORIZATION",
        ...args,
      ], {
        cwd: "/",
        encoding: "utf8",
        env: childEnvironment,
        maxBuffer: 1024 * 1024,
        timeout: REQUEST_TIMEOUT_MS,
        windowsHide: true,
      });
      return exactGitOutput({
        status: result?.status,
        stdout: typeof result?.stdout === "string"
          ? result.stdout
          : Buffer.from(result?.stdout ?? []).toString("utf8"),
        stderr: typeof result?.stderr === "string"
          ? result.stderr
          : Buffer.from(result?.stderr ?? []).toString("utf8"),
      }, { allow_stderr });
    } finally {
      childEnvironment.AIFINDER_GIT_HTTP_AUTHORIZATION = "";
    }
  };
  const readRef = (authorization, credentials) => classifyRemoteRef(
    runGit(authorization, credentials, [
      "ls-remote",
      "--heads",
      `https://github.com/${authorization.repository.remote_repository}.git`,
      `refs/heads/${authorization.execution.branch_name}`,
    ]),
    authorization.execution.branch_name,
  );
  return Object.freeze({
    git: Object.freeze({
      async inspect({ authorization, credentials }) {
        return readRef(authorization, credentials);
      },
      async create({ authorization, credentials }) {
        const expectedRef = `refs/heads/${authorization.execution.branch_name}`;
        const remoteUrl =
          `https://github.com/${authorization.repository.remote_repository}.git`;
        if (readRef(authorization, credentials).status !== "ABSENT") {
          throw new ConcreteLivePlatformError("CONCRETE_GIT_BRANCH_PREEXISTING");
        }
        runGit(authorization, credentials, [
          "push",
          "--no-verify",
          "--porcelain",
          `--force-with-lease=${expectedRef}:`,
          remoteUrl,
          `${authorization.execution.temporary_commit_sha}:${expectedRef}`,
        ], { allow_stderr: true });
        const after = readRef(authorization, credentials);
        if (
          after.status !== "PRESENT" ||
          after.commit_sha !== authorization.execution.temporary_commit_sha
        ) {
          throw new ConcreteLivePlatformError("CONCRETE_GIT_CREATE_UNCONFIRMED");
        }
        return { status: "CREATED_EXACT", commit_sha: after.commit_sha };
      },
      async delete({ authorization, credentials, commit_sha }) {
        const expectedRef = `refs/heads/${authorization.execution.branch_name}`;
        const remoteUrl =
          `https://github.com/${authorization.repository.remote_repository}.git`;
        const before = readRef(authorization, credentials);
        if (before.status === "ABSENT") return { status: "DELETED_EXACT" };
        if (before.commit_sha !== commit_sha) {
          throw new ConcreteLivePlatformError("CONCRETE_GIT_BRANCH_OWNERSHIP_MISMATCH");
        }
        runGit(authorization, credentials, [
          "push",
          "--no-verify",
          "--porcelain",
          `--force-with-lease=${expectedRef}:${commit_sha}`,
          remoteUrl,
          `:${expectedRef}`,
        ], { allow_stderr: true });
        if (readRef(authorization, credentials).status !== "ABSENT") {
          throw new ConcreteLivePlatformError("CONCRETE_GIT_DELETE_UNCONFIRMED");
        }
        return { status: "DELETED_EXACT" };
      },
    }),
    async request({
      service,
      method,
      path,
      headers = {},
      body = null,
      credentials,
      operation,
      expected_fixture,
      response_kind = "JSON",
    }) {
      if (!["BYTES", "JSON"].includes(response_kind)) {
        throw new ConcreteLivePlatformError("CONCRETE_LIVE_RESPONSE_KIND_DENIED");
      }
      let base;
      let authorizationHeader;
      const serviceHeaders = {};
      if (service === "VERCEL") {
        base = "https://api.vercel.com";
        authorizationHeader = `Bearer ${credentials.vercel_token}`;
      } else if (service === "SUPABASE_SERVICE") {
        base = credentials.supabase_url;
        authorizationHeader = `Bearer ${credentials.supabase_service_role_key}`;
        serviceHeaders.apikey = credentials.supabase_service_role_key;
      } else if (service === "SUPABASE_ANON") {
        base = credentials.supabase_url;
        authorizationHeader = `Bearer ${credentials.supabase_anon_key}`;
        serviceHeaders.apikey = credentials.supabase_anon_key;
      } else if (service === "PREVIEW") {
        base = path;
        path = "";
      } else {
        throw new ConcreteLivePlatformError("CONCRETE_LIVE_SERVICE_DENIED");
      }
      const init = {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          accept: "application/json",
          ...serviceHeaders,
          ...(authorizationHeader ? { authorization: authorizationHeader } : {}),
          ...headers,
        },
      };
      if (body !== null) {
        if (
          Buffer.isBuffer(body) || body instanceof Uint8Array ||
          (typeof FormData !== "undefined" && body instanceof FormData)
        ) {
          init.body = body;
        } else {
          init.body = canonicalJson(body);
          init.headers["content-type"] ??= "application/json";
        }
      }
      let response;
      try {
        response = await fetch_impl(`${base}${path}`, init);
      } catch {
        throw new ConcreteLivePlatformError(
          "CONCRETE_NETWORK_REQUEST_FAILED",
          "NETWORK_FAILURE",
        );
      }
      let responseBody = null;
      let responseBytes = 0;
      let responseJson = "EMPTY";
      if (response.status !== 204 && response_kind === "BYTES") {
        if (typeof response.arrayBuffer !== "function") {
          throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
        }
        let bytes;
        try {
          bytes = Buffer.from(await response.arrayBuffer());
        } catch {
          throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
        }
        if (bytes.byteLength > 1024 * 1024) {
          bytes.fill(0);
          throw new ConcreteLivePlatformError("CONCRETE_NETWORK_RESPONSE_INVALID");
        }
        responseBody = bytes;
        responseBytes = bytes.byteLength;
        responseJson = "NOT_APPLICABLE";
      } else if (response.status !== 204) {
        const bounded = await readBoundedJsonText(response);
        const { text } = bounded;
        responseBytes = bounded.bytes;
        if (text.length > 0) {
          try {
            assertNoDuplicateJsonObjectKeys(text);
            responseBody = JSON.parse(text);
            responseJson = "EXACT_BOUNDED";
          } catch {
            responseBody = text;
            responseJson = "NON_JSON";
          }
        }
      }
      return {
        status: response.status,
        body: responseBody,
        operation,
        expected_fixture,
        response_bytes: responseBytes,
        response_json: responseJson,
        response_headers: projectResponseHeaders(response),
      };
    },
  });
}

function requireStatus(response, statuses, code) {
  if (!response || !statuses.includes(response.status)) {
    throw new ConcreteLivePlatformError(
      code,
      classifyProviderResponseStatus(response?.status),
    );
  }
  return response.body;
}

function postgrestPath(relation, query = "") {
  return `/rest/v1/${relation}${query}`;
}

function exactStorageInfo(body, authorization) {
  return body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    boundedText(body.id, 1024) &&
    body.bucket_id === authorization.execution.storage_bucket &&
    !Object.prototype.hasOwnProperty.call(body, "bucketId") &&
    body.name === authorization.execution.storage_name &&
    boundedText(body.version, 1024);
}

function exactStorageUpload(body, authorization) {
  return body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    boundedText(body.Id, 1024) &&
    body.Key ===
      `${authorization.execution.storage_bucket}/${authorization.execution.storage_name}`;
}

function exactStorageCreationEpoch(body) {
  return (
    boundedText(body?.created_at, 64) &&
    boundedText(body?.updated_at, 64) &&
    Number.isFinite(Date.parse(body.created_at)) &&
    Number.isFinite(Date.parse(body.updated_at)) &&
    body.created_at === body.updated_at
  );
}

function exactDatabaseRow(row, authorization) {
  return (
    exactKeys(row, ["id", "name", "status", "website"]) &&
    Number.isSafeInteger(row.id) &&
    row.name === authorization.execution.fixture_name &&
    row.website === authorization.execution.fixture_website &&
    row.status === "pending"
  );
}

function terminalInventory(body, collectionName) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !Object.prototype.hasOwnProperty.call(body, collectionName) ||
    !Array.isArray(body[collectionName]) ||
    body[collectionName].length > 100 ||
    !body.pagination ||
    typeof body.pagination !== "object" ||
    Array.isArray(body.pagination) ||
    !Object.prototype.hasOwnProperty.call(body.pagination, "count") ||
    !Object.prototype.hasOwnProperty.call(body.pagination, "next") ||
    !Number.isSafeInteger(body.pagination.count) ||
    body.pagination.count < 0 ||
    body.pagination.count > 100 ||
    body.pagination.count !== body[collectionName].length ||
    body.pagination.next !== null
  ) {
    return null;
  }
  return body[collectionName];
}

function terminalEnvironmentInventory(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !Object.prototype.hasOwnProperty.call(body, "envs") ||
    !Array.isArray(body.envs) ||
    body.envs.length > 100
  ) {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(body, "pagination")) {
    return body.envs;
  }
  const pagination = body.pagination;
  if (
    !pagination ||
    typeof pagination !== "object" ||
    Array.isArray(pagination) ||
    (!Object.prototype.hasOwnProperty.call(pagination, "count") &&
      !Object.prototype.hasOwnProperty.call(pagination, "next"))
  ) {
    return null;
  }
  if (
    Object.prototype.hasOwnProperty.call(pagination, "count") &&
    (!Number.isSafeInteger(pagination.count) ||
      pagination.count < 0 ||
      pagination.count > 100 ||
      pagination.count !== body.envs.length)
  ) {
    return null;
  }
  if (
    Object.prototype.hasOwnProperty.call(pagination, "next") &&
    pagination.next !== null
  ) {
    return null;
  }
  return body.envs;
}

export function createConcreteLivePlatform({
  authorization,
  credentials,
  transport = createConcreteLiveTransport(),
  random_bytes = randomBytes,
  random_uuid = randomUUID,
  wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  if (
    !authorization ||
    !credentials ||
    typeof transport?.request !== "function" ||
    typeof wait !== "function"
  ) {
    throw new ConcreteLivePlatformError("CONCRETE_LIVE_PLATFORM_INVALID");
  }
  const bindings = new Map();
  const request = (input) => transport.request({
    ...input,
    credentials,
  });
  const teamQuery = `teamId=${encodeURIComponent(authorization.execution.preview_team_id)}`;
  const runMeta = {
    aifinderRunId: authorization.run_id,
    aifinderCandidate: authorization.candidate_identity_sha256,
  };
  const expectedRepository = authorization.repository.remote_repository;
  const [expectedRepositoryOwner, expectedRepositoryName] =
    expectedRepository.split("/");

  function exactRunMeta(meta) {
    return (
      meta &&
      typeof meta === "object" &&
      !Array.isArray(meta) &&
      meta.aifinderRunId === runMeta.aifinderRunId &&
      meta.aifinderCandidate === runMeta.aifinderCandidate
    );
  }

  function normalizedPreviewHostname(value, code) {
    if (
      !boundedText(value, 512) ||
      value !== value.toLowerCase() ||
      !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(value) ||
      !value.endsWith(".vercel.app") ||
      value === `${authorization.execution.preview_project_name}.vercel.app`
    ) {
      throw new ConcreteLivePlatformError(code);
    }
    return value;
  }

  function exactPreviewProject(deployment) {
    const facts = [];
    if (Object.hasOwn(deployment, "project")) {
      if (
        !deployment.project ||
        typeof deployment.project !== "object" ||
        Array.isArray(deployment.project) ||
        !boundedText(deployment.project.id, 256) ||
        !boundedText(deployment.project.name, 256)
      ) return false;
      facts.push({
        id: deployment.project.id,
        name: deployment.project.name,
      });
    }
    if (
      Object.hasOwn(deployment, "projectId") ||
      Object.hasOwn(deployment, "name")
    ) {
      if (
        !boundedText(deployment.projectId, 256) ||
        !boundedText(deployment.name, 256)
      ) return false;
      facts.push({ id: deployment.projectId, name: deployment.name });
    }
    return facts.length >= 1 && facts.every((fact) =>
      fact.id === authorization.execution.preview_project_id &&
      fact.name === authorization.execution.preview_project_name
    );
  }

  function exactPreviewTeam(deployment) {
    const facts = [
      deployment.ownerId,
      deployment.teamId,
      deployment.project?.accountId,
    ].filter((value) => value !== undefined && value !== null);
    return facts.length >= 1 && facts.every(
      (value) => value === authorization.execution.preview_team_id,
    );
  }

  function exactPreviewGit(deployment) {
    let commitSeen = false;
    let refSeen = false;
    let repositorySeen = false;
    let ownerSeen = false;
    const sources = [
      deployment.gitSource,
      deployment.meta,
      deployment.gitMetadata,
    ].filter((value) => value && typeof value === "object" && !Array.isArray(value));
    for (const source of sources) {
      const commits = [source.sha, source.commitSha, source.githubCommitSha]
        .filter((value) => value !== undefined && value !== null && value !== "");
      const refs = [source.ref, source.commitRef, source.githubCommitRef]
        .filter((value) => value !== undefined && value !== null && value !== "");
      const repositories = [
        source.repo,
        source.repository,
        source.githubCommitRepo,
      ].filter((value) => value !== undefined && value !== null && value !== "");
      const owners = [source.org, source.owner, source.githubCommitOrg]
        .filter((value) => value !== undefined && value !== null && value !== "");
      if (
        !commits.every((value) => value === authorization.execution.temporary_commit_sha) ||
        !refs.every((value) => value === authorization.execution.branch_name) ||
        !repositories.every(
          (value) => value === expectedRepository || value === expectedRepositoryName,
        ) ||
        !owners.every((value) => value === expectedRepositoryOwner)
      ) return false;
      commitSeen ||= commits.length > 0;
      refSeen ||= refs.length > 0;
      repositorySeen ||= repositories.length > 0;
      ownerSeen ||= owners.length > 0;
    }
    return commitSeen && refSeen && repositorySeen &&
      (ownerSeen || sources.some((source) => source.repo === expectedRepository));
  }

  function validatePreviewDeployment(
    deployment,
    {
      code,
      expectedId = null,
      expectedUrl = null,
      requireReady = false,
    },
  ) {
    const identifiers = [deployment?.id, deployment?.uid]
      .filter((value) => value !== undefined && value !== null);
    const id = deployment?.id ?? deployment?.uid;
    const state = deployment?.readyState ?? deployment?.state;
    let hostname;
    try {
      hostname = normalizedPreviewHostname(deployment?.url, code);
    } catch {
      throw new ConcreteLivePlatformError(code);
    }
    if (
      !boundedText(id, 256) ||
      identifiers.length === 0 ||
      !identifiers.every((value) => value === id) ||
      (expectedId !== null && id !== expectedId) ||
      (expectedUrl !== null && hostname !== expectedUrl) ||
      deployment.target !== null ||
      (Object.hasOwn(deployment, "production") && deployment.production !== false) ||
      !exactRunMeta(deployment.meta) ||
      !exactPreviewProject(deployment) ||
      !exactPreviewTeam(deployment) ||
      !exactPreviewGit(deployment) ||
      !PREVIEW_LIFECYCLE_STATES.has(state)
    ) {
      throw new ConcreteLivePlatformError(code);
    }
    if (requireReady && state !== "READY") {
      throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_NOT_READY");
    }
    return { id, hostname, state };
  }

  function validatePreviewInventoryCandidate(candidate) {
    const identifiers = [candidate?.id, candidate?.uid]
      .filter((value) => value !== undefined && value !== null);
    const id = candidate?.id ?? candidate?.uid;
    const state = candidate?.readyState ?? candidate?.state;
    const meta = candidate?.meta;
    let hostname;
    try {
      hostname = normalizedPreviewHostname(
        candidate?.url,
        "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
      );
    } catch {
      throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_OWNERSHIP_MISMATCH");
    }
    if (
      !boundedText(id, 256) ||
      identifiers.length === 0 ||
      !identifiers.every((value) => value === id) ||
      candidate.target !== null ||
      (Object.hasOwn(candidate, "production") && candidate.production !== false) ||
      !exactRunMeta(meta) ||
      meta.githubCommitSha !== authorization.execution.temporary_commit_sha ||
      meta.githubCommitRef !== authorization.execution.branch_name ||
      meta.githubCommitRepo !== expectedRepositoryName ||
      meta.githubCommitOrg !== expectedRepositoryOwner ||
      !PREVIEW_LIFECYCLE_STATES.has(state)
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_OWNERSHIP_MISMATCH");
    }
    return { id, hostname, state };
  }

  function branchCompatibleEnvironmentCandidate(candidate) {
    return !Object.prototype.hasOwnProperty.call(candidate, "gitBranch") ||
      candidate.gitBranch === authorization.execution.branch_name;
  }

  function validEnvironmentInventoryCandidate(candidate) {
    return candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      boundedText(candidate.id, 256) &&
      boundedText(candidate.key, 256) &&
      canonicalJson(candidate.target) === '["preview"]' &&
      branchCompatibleEnvironmentCandidate(candidate);
  }

  function environmentNamespaceRecords(inventory) {
    if (!inventory.every(validEnvironmentInventoryCandidate)) return null;
    const matches = inventory.filter((entry) =>
      authorization.execution.environment_keys.includes(entry.key)
    );
    const keys = new Set();
    for (const record of matches) {
      if (keys.has(record.key)) return null;
      keys.add(record.key);
    }
    return matches;
  }

  function exactEnvironmentObservation(candidate, record) {
    return candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      candidate.id === record.id &&
      candidate.key === record.key &&
      (!Object.prototype.hasOwnProperty.call(candidate, "target") ||
        canonicalJson(candidate.target) === '["preview"]') &&
      branchCompatibleEnvironmentCandidate(candidate);
  }

  function exactEnvironmentCreateResult(body, key) {
    let candidate = body;
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      (Object.prototype.hasOwnProperty.call(body, "created") ||
        Object.prototype.hasOwnProperty.call(body, "failed"))
    ) {
      if (!Array.isArray(body.failed) || body.failed.length !== 0) return null;
      candidate = body.created;
    }
    return candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      boundedText(candidate.id, 256) &&
      candidate.key === key &&
      canonicalJson(candidate.target) === '["preview"]' &&
      branchCompatibleEnvironmentCandidate(candidate)
      ? candidate
      : null;
  }

  function expectedPreviewFixture(binding, readyState = "READY") {
    return {
      id: binding.deployment_id,
      url: binding.deployment_url,
      target: null,
      readyState,
      projectId: authorization.execution.preview_project_id,
      name: authorization.execution.preview_project_name,
      teamId: authorization.execution.preview_team_id,
      gitSource: {
        type: "github",
        repo: expectedRepository,
        ref: authorization.execution.branch_name,
        sha: authorization.execution.temporary_commit_sha,
      },
      meta: structuredClone(runMeta),
    };
  }

  function environmentRecords(binding, allowPartial = true) {
    if (
      !binding ||
      binding.resource_type !== "ENVIRONMENT_RECORD" ||
      !Array.isArray(binding.records) ||
      binding.records.length < 1 ||
      binding.records.length > authorization.execution.environment_keys.length
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_BINDING_INVALID");
    }
    const expectedOrder = authorization.execution.environment_keys;
    const seenKeys = new Set();
    const seenIds = new Set();
    let priorIndex = -1;
    for (const record of binding.records) {
      const index = expectedOrder.indexOf(record?.key);
      if (
        !exactKeys(record, ["id", "key"]) ||
        index < 0 ||
        index <= priorIndex ||
        !boundedText(record.id, 256) ||
        seenKeys.has(record.key) ||
        seenIds.has(record.id)
      ) {
        throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_BINDING_INVALID");
      }
      priorIndex = index;
      seenKeys.add(record.key);
      seenIds.add(record.id);
    }
    if (!allowPartial && binding.records.length !== expectedOrder.length) {
      throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_BINDING_INVALID");
    }
    return binding.records;
  }

  async function recordBindingProgress(resource, binding, context) {
    bindings.set(resource.resource_key, structuredClone(binding));
    if (context?.onBindingProgress !== undefined) {
      if (typeof context.onBindingProgress !== "function") {
        throw new ConcreteLivePlatformError(
          "CONCRETE_EXTERNAL_BINDING_CALLBACK_INVALID",
        );
      }
      await context.onBindingProgress(structuredClone(binding));
    }
  }

  async function readStorageExists() {
    return request({
      service: "SUPABASE_SERVICE",
      method: "HEAD",
      path: `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`,
      operation: "STORAGE_EXISTS",
    });
  }

  async function readStorageInfo() {
    return request({
      service: "SUPABASE_SERVICE",
      method: "GET",
      path: `/storage/v1/object/info/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`,
      operation: "STORAGE_INFO",
    });
  }

  async function readStorageBytes() {
    return request({
      service: "SUPABASE_SERVICE",
      method: "GET",
      path: `/storage/v1/object/authenticated/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`,
      operation: "STORAGE_DOWNLOAD",
      headers: { accept: "image/png" },
      response_kind: "BYTES",
    });
  }

  async function assertExactStorageContent(binding) {
    const response = await readStorageBytes();
    const body = requireStatus(
      response,
      [200],
      "CONCRETE_STORAGE_DOWNLOAD_FAILED",
    );
    if (!(Buffer.isBuffer(body) || body instanceof Uint8Array)) {
      throw new ConcreteLivePlatformError("CONCRETE_STORAGE_INFO_INVALID");
    }
    const bytes = Buffer.from(body);
    try {
      if (
        bytes.byteLength !== binding.expected_size ||
        sha256Hex(bytes) !== binding.content_sha256
      ) {
        throw new ConcreteLivePlatformError(
          "CONCRETE_STORAGE_REPLACEMENT_PRESENT",
        );
      }
    } finally {
      bytes.fill(0);
    }
  }

  function assertExactStorageInfoBinding(info, binding) {
    if (
      info.id !== binding.object_id ||
      info.version !== binding.expected_version ||
      info.created_at !== binding.created_at ||
      info.updated_at !== binding.created_at ||
      info.metadata?.eTag !== binding.expected_etag ||
      info.metadata?.mimetype !== "image/png" ||
      info.metadata?.size !== binding.expected_size
    ) {
      throw new ConcreteLivePlatformError("CONCRETE_STORAGE_REPLACEMENT_PRESENT");
    }
  }

  async function readDatabaseRows() {
    const fixture = [{
      id: 41,
      name: authorization.execution.fixture_name,
      website: authorization.execution.fixture_website,
      status: "pending",
    }];
    return request({
      service: "SUPABASE_SERVICE",
      method: "GET",
      path: postgrestPath(
        "submitted_tools",
        `?select=id,name,website,status&website=eq.${encodeURIComponent(authorization.execution.fixture_website)}`,
      ),
      operation: "DATABASE_READ",
      expected_fixture: fixture,
    });
  }

  async function boundResourcePresent(resource, binding) {
    if (!binding) return false;
    if (resource.resource_type === "GIT_BRANCH") {
      const observed = await transport.git.inspect({ authorization, credentials });
      if (observed.status === "ABSENT") return false;
      if (observed.commit_sha !== binding.commit_sha) {
        throw new ConcreteLivePlatformError("CONCRETE_GIT_BRANCH_OWNERSHIP_MISMATCH");
      }
      return true;
    }
    if (resource.resource_type === "PREVIEW_DEPLOYMENT") {
      const response = await request({
        service: "VERCEL",
        method: "GET",
        path: `/v13/deployments/${encodeURIComponent(binding.deployment_id)}?${teamQuery}&withGitRepoInfo=true`,
        operation: "PREVIEW_READ",
        expected_fixture: expectedPreviewFixture(binding),
      });
      if (response.status === 404) return false;
      const body = requireStatus(response, [200], "CONCRETE_PREVIEW_READ_FAILED");
      validatePreviewDeployment(body, {
        code: "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
        expectedId: binding.deployment_id,
        expectedUrl: binding.deployment_url,
      });
      return true;
    }
    if (resource.resource_type === "ENVIRONMENT_RECORD") {
      let present = 0;
      for (const record of environmentRecords(binding)) {
        const response = await request({
          service: "VERCEL",
          method: "GET",
          path: `/v1/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env/${encodeURIComponent(record.id)}?${teamQuery}`,
          operation: "ENVIRONMENT_READ",
        });
        if (response.status === 404) continue;
        const body = requireStatus(response, [200], "CONCRETE_ENVIRONMENT_READ_FAILED");
        if (!exactEnvironmentObservation(body, record)) {
          throw new ConcreteLivePlatformError(
            "CONCRETE_ENVIRONMENT_OWNERSHIP_MISMATCH",
          );
        }
        present += 1;
      }
      return present > 0;
    }
    if (resource.resource_type === "DATABASE_ROW") {
      const rows = requireStatus(
        await readDatabaseRows(),
        [200],
        "CONCRETE_DATABASE_READ_FAILED",
      );
      if (!Array.isArray(rows)) {
        throw new ConcreteLivePlatformError("CONCRETE_DATABASE_READ_FAILED");
      }
      if (rows.length === 0) return false;
      if (
        rows.length !== 1 ||
        binding.row_ids.length !== 1 ||
        !exactDatabaseRow(rows[0], authorization) ||
        String(rows[0].id) !== binding.row_ids[0]
      ) {
        throw new ConcreteLivePlatformError("CONCRETE_DATABASE_OWNERSHIP_MISMATCH");
      }
      return true;
    }
    const response = await readStorageInfo();
    if (response.status === 404) return false;
    const info = requireStatus(response, [200], "CONCRETE_STORAGE_INFO_FAILED");
    if (!exactStorageInfo(info, authorization)) {
      throw new ConcreteLivePlatformError("CONCRETE_STORAGE_INFO_INVALID");
    }
    assertExactStorageInfoBinding(info, binding);
    await assertExactStorageContent(binding);
    return true;
  }

  async function discoverEnvironmentBinding() {
    const body = requireStatus(await request({
      service: "VERCEL",
      method: "GET",
      path: `/v10/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env?target=preview&gitBranch=${encodeURIComponent(authorization.execution.branch_name)}&decrypt=false&${teamQuery}`,
      operation: "ENVIRONMENT_LIST",
    }), [200], "CONCRETE_ENVIRONMENT_INSPECTION_FAILED");
    const inventory = terminalEnvironmentInventory(body);
    if (inventory === null) {
      throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS");
    }
    const records = environmentNamespaceRecords(inventory);
    if (records === null) {
      throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS");
    }
    if (records.length === 0) return null;
    const byKey = new Map();
    for (const record of records) {
      if (
        !boundedText(record?.id, 256) ||
        canonicalJson(record.target) !== '["preview"]' ||
        byKey.has(record.key)
      ) {
        throw new ConcreteLivePlatformError(
          "CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS",
        );
      }
      byKey.set(record.key, record.id);
    }
    if (
      byKey.size !== records.length ||
      byKey.size > authorization.execution.environment_keys.length
    ) {
      throw new ConcreteLivePlatformError(
        "CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS",
      );
    }
    return {
      resource_type: "ENVIRONMENT_RECORD",
      records: authorization.execution.environment_keys
        .filter((key) => byKey.has(key))
        .map((key) => ({ key, id: byKey.get(key) })),
    };
  }

  const platform = {
    async inspectFresh(resource) {
      if (resource.resource_type === "GIT_BRANCH") {
        const observed = await transport.git.inspect({ authorization, credentials });
        return { status: observed.status === "ABSENT" ? "ABSENT" : "PRESENT" };
      }
      if (resource.resource_type === "PREVIEW_DEPLOYMENT") {
        const body = requireStatus(await request({
          service: "VERCEL",
          method: "GET",
          path: `/v6/deployments?projectId=${encodeURIComponent(authorization.execution.preview_project_id)}&${teamQuery}&limit=100&meta-aifinderRunId=${encodeURIComponent(authorization.run_id)}`,
          operation: "PREVIEW_LIST",
        }), [200], "CONCRETE_PREVIEW_INSPECTION_FAILED");
        const inventory = terminalInventory(body, "deployments");
        if (inventory === null) return { status: "AMBIGUOUS" };
        try {
          for (const candidate of inventory) validatePreviewInventoryCandidate(candidate);
        } catch {
          return { status: "AMBIGUOUS" };
        }
        const matches = inventory.filter(
          (entry) => entry?.meta?.aifinderRunId === authorization.run_id,
        );
        if (matches.length === 0) return { status: "ABSENT" };
        if (matches.length !== 1) return { status: "AMBIGUOUS" };
        try {
          validatePreviewInventoryCandidate(matches[0]);
          return { status: "PRESENT" };
        } catch {
          return { status: "AMBIGUOUS" };
        }
      }
      if (resource.resource_type === "ENVIRONMENT_RECORD") {
        const body = requireStatus(await request({
          service: "VERCEL",
          method: "GET",
          path: `/v10/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env?target=preview&gitBranch=${encodeURIComponent(authorization.execution.branch_name)}&decrypt=false&${teamQuery}`,
          operation: "ENVIRONMENT_LIST",
        }), [200], "CONCRETE_ENVIRONMENT_INSPECTION_FAILED");
        const inventory = terminalEnvironmentInventory(body);
        if (inventory === null) return { status: "AMBIGUOUS" };
        const matches = environmentNamespaceRecords(inventory);
        if (matches === null) return { status: "AMBIGUOUS" };
        return { status: matches.length === 0 ? "ABSENT" : "PRESENT" };
      }
      if (resource.resource_type === "DATABASE_ROW") {
        const body = requireStatus(
          await readDatabaseRows(),
          [200],
          "CONCRETE_DATABASE_INSPECTION_FAILED",
        );
        return { status: Array.isArray(body) && body.length === 0 ? "ABSENT" : Array.isArray(body) && body.length === 1 ? "PRESENT" : "AMBIGUOUS" };
      }
      const response = await readStorageExists();
      if ([400, 404].includes(response.status)) return { status: "ABSENT" };
      if (response.status === 200) return { status: "PRESENT" };
      throw new ConcreteLivePlatformError(
        "CONCRETE_STORAGE_INSPECTION_FAILED",
        classifyProviderResponseStatus(response.status),
      );
    },
    async inspectOwned(resource, binding) {
      if (binding !== null) {
        const present = await boundResourcePresent(resource, binding);
        if (!present) return { status: "ABSENT" };
        return {
          status: "PRESENT",
          ...(resource.resource_type === "STORAGE_OBJECT"
            ? { observed_version: binding.expected_version }
            : {}),
        };
      }
      const observation = await platform.inspectFresh(resource);
      if (
        resource.resource_type !== "STORAGE_OBJECT" ||
        observation.status !== "PRESENT"
      ) {
        return observation;
      }
      const info = requireStatus(
        await readStorageInfo(),
        [200],
        "CONCRETE_STORAGE_INFO_FAILED",
      );
      return {
        status: "PRESENT",
        observed_version: exactStorageInfo(info, authorization)
          ? info.version
          : "unbound-storage-observation",
      };
    },
    async resolveBinding(resource) {
      const inMemory = bindings.get(resource.resource_key);
      if (resource.resource_type === "ENVIRONMENT_RECORD") {
        const discovered = await discoverEnvironmentBinding();
        return discovered === null
          ? (inMemory ? structuredClone(inMemory) : null)
          : discovered;
      }
      if (inMemory) return structuredClone(inMemory);
      if (resource.resource_type === "GIT_BRANCH") {
        const observed = await transport.git.inspect({ authorization, credentials });
        if (
          observed.status !== "PRESENT" ||
          observed.commit_sha !== authorization.execution.temporary_commit_sha
        ) {
          return null;
        }
        return {
          resource_type: "GIT_BRANCH",
          commit_sha: observed.commit_sha,
          remote_ref: `refs/heads/${authorization.execution.branch_name}`,
        };
      }
      if (resource.resource_type === "PREVIEW_DEPLOYMENT") {
        const body = requireStatus(await request({
          service: "VERCEL",
          method: "GET",
          path: `/v6/deployments?projectId=${encodeURIComponent(authorization.execution.preview_project_id)}&${teamQuery}&limit=100&meta-aifinderRunId=${encodeURIComponent(authorization.run_id)}`,
          operation: "PREVIEW_LIST",
        }), [200], "CONCRETE_PREVIEW_INSPECTION_FAILED");
        const inventory = terminalInventory(body, "deployments");
        if (inventory === null) {
          throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_INSPECTION_AMBIGUOUS");
        }
        try {
          for (const candidate of inventory) validatePreviewInventoryCandidate(candidate);
        } catch {
          throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_INSPECTION_AMBIGUOUS");
        }
        const matches = inventory.filter((entry) =>
          entry?.meta?.aifinderRunId === authorization.run_id
        );
        if (matches.length === 0) return null;
        if (matches.length !== 1) {
          throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_INSPECTION_AMBIGUOUS");
        }
        const candidate = matches[0];
        const inventoryIdentity = validatePreviewInventoryCandidate(candidate);
        const deployment = requireStatus(await request({
          service: "VERCEL",
          method: "GET",
          path: `/v13/deployments/${encodeURIComponent(inventoryIdentity.id)}?${teamQuery}&withGitRepoInfo=true`,
          operation: "PREVIEW_READ",
          expected_fixture: expectedPreviewFixture({
            deployment_id: inventoryIdentity.id,
            deployment_url: inventoryIdentity.hostname,
          }, inventoryIdentity.state),
        }), [200], "CONCRETE_PREVIEW_READ_FAILED");
        const deploymentIdentity = validatePreviewDeployment(deployment, {
          code: "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
          expectedId: inventoryIdentity.id,
          expectedUrl: inventoryIdentity.hostname,
        });
        return {
          resource_type: "PREVIEW_DEPLOYMENT",
          deployment_id: deploymentIdentity.id,
          deployment_url: deploymentIdentity.hostname,
        };
      }
      if (resource.resource_type === "DATABASE_ROW") {
        const rows = requireStatus(
          await readDatabaseRows(),
          [200],
          "CONCRETE_DATABASE_READ_FAILED",
        );
        if (!Array.isArray(rows) || rows.length > 1) {
          throw new ConcreteLivePlatformError("CONCRETE_DATABASE_OWNERSHIP_MISMATCH");
        }
        if (rows.length === 0) return null;
        if (!exactDatabaseRow(rows[0], authorization)) {
          throw new ConcreteLivePlatformError("CONCRETE_DATABASE_OWNERSHIP_MISMATCH");
        }
        return {
          resource_type: "DATABASE_ROW",
          row_ids: [String(rows[0].id)],
        };
      }
      return null;
    },
    async createBranch(resource, context = {}) {
      const result = await transport.git.create({ authorization, credentials });
      if (result.status !== "CREATED_EXACT" || result.commit_sha !== authorization.execution.temporary_commit_sha) {
        throw new ConcreteLivePlatformError("CONCRETE_GIT_CREATE_UNCONFIRMED");
      }
      const binding = {
        resource_type: "GIT_BRANCH",
        commit_sha: result.commit_sha,
        remote_ref: `refs/heads/${authorization.execution.branch_name}`,
      };
      await recordBindingProgress(resource, binding, context);
      return binding;
    },
    async cleanupBranch(resource, binding) {
      const result = await transport.git.delete({
        authorization,
        credentials,
        commit_sha: binding.commit_sha,
      });
      return { status: result.status };
    },
    async createPreview(resource, context = {}) {
      const body = requireStatus(await request({
        service: "VERCEL",
        method: "POST",
        path: `/v13/deployments?${teamQuery}`,
        operation: "PREVIEW_CREATE",
        body: {
          name: authorization.execution.preview_project_name,
          project: authorization.execution.preview_project_id,
          target: null,
          gitSource: {
            type: "github",
            repo: "aifinder",
            ref: authorization.execution.branch_name,
            sha: authorization.execution.temporary_commit_sha,
          },
          meta: runMeta,
        },
      }), [200, 201], "CONCRETE_PREVIEW_CREATE_FAILED");
      const identity = validatePreviewDeployment(body, {
        code: "CONCRETE_PREVIEW_CREATE_UNCONFIRMED",
      });
      const binding = {
        resource_type: "PREVIEW_DEPLOYMENT",
        deployment_id: identity.id,
        deployment_url: identity.hostname,
      };
      await recordBindingProgress(resource, binding, context);
      return binding;
    },
    async cleanupPreview(resource, binding) {
      const observation = await request({
        service: "VERCEL",
        method: "GET",
        path: `/v13/deployments/${encodeURIComponent(binding.deployment_id)}?${teamQuery}&withGitRepoInfo=true`,
        operation: "PREVIEW_READ",
        expected_fixture: {
          ...expectedPreviewFixture(binding),
        },
      });
      if (observation.status === 404) return { status: "DELETED_EXACT" };
      const observed = requireStatus(
        observation,
        [200],
        "CONCRETE_PREVIEW_READ_FAILED",
      );
      validatePreviewDeployment(observed, {
        code: "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
        expectedId: binding.deployment_id,
        expectedUrl: binding.deployment_url,
      });
      requireStatus(await request({
        service: "VERCEL",
        method: "DELETE",
        path: `/v13/deployments/${encodeURIComponent(binding.deployment_id)}?${teamQuery}`,
        operation: "PREVIEW_DELETE",
      }), [200, 204], "CONCRETE_PREVIEW_DELETE_FAILED");
      return { status: "DELETED_EXACT" };
    },
    async createEnvironment(resource, context = {}) {
      const records = [];
      for (const key of authorization.execution.environment_keys) {
        const value = key === "ADMIN_PASSWORD"
          ? credentials.admin_password
          : credentials.admin_session_secret;
        const body = requireStatus(await request({
          service: "VERCEL",
          method: "POST",
          path: `/v10/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env?${teamQuery}`,
          operation: "ENVIRONMENT_CREATE",
          body: {
            key,
            value,
            type: "encrypted",
            target: ["preview"],
            gitBranch: authorization.execution.branch_name,
          },
        }), [200, 201], "CONCRETE_ENVIRONMENT_CREATE_FAILED");
        const created = exactEnvironmentCreateResult(body, key);
        if (created === null) {
          throw new ConcreteLivePlatformError("CONCRETE_ENVIRONMENT_CREATE_UNCONFIRMED");
        }
        records.push({ key, id: created.id });
        await recordBindingProgress(resource, {
          resource_type: "ENVIRONMENT_RECORD",
          records: structuredClone(records),
        }, context);
      }
      const binding = {
        resource_type: "ENVIRONMENT_RECORD",
        records: structuredClone(records),
      };
      return binding;
    },
    async cleanupEnvironment(resource, binding) {
      for (const record of environmentRecords(binding)) {
        const observation = await request({
          service: "VERCEL",
          method: "GET",
          path: `/v1/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env/${encodeURIComponent(record.id)}?${teamQuery}`,
          operation: "ENVIRONMENT_READ",
          expected_fixture: { id: record.id, key: record.key },
        });
        if (observation.status === 404) continue;
        const observed = requireStatus(
          observation,
          [200],
          "CONCRETE_ENVIRONMENT_READ_FAILED",
        );
        if (!exactEnvironmentObservation(observed, record)) {
          throw new ConcreteLivePlatformError(
            "CONCRETE_ENVIRONMENT_OWNERSHIP_MISMATCH",
          );
        }
        requireStatus(await request({
          service: "VERCEL",
          method: "DELETE",
          path: `/v9/projects/${encodeURIComponent(authorization.execution.preview_project_id)}/env/${encodeURIComponent(record.id)}?${teamQuery}`,
          operation: "ENVIRONMENT_DELETE",
        }), [200, 204], "CONCRETE_ENVIRONMENT_DELETE_FAILED");
      }
      return { status: "DELETED_EXACT" };
    },
    async createDatabaseFixture(resource, context = {}) {
      const body = requireStatus(await request({
        service: "SUPABASE_SERVICE",
        method: "POST",
        path: postgrestPath("submitted_tools", "?select=id,name,website,status"),
        operation: "DATABASE_CREATE",
        headers: { prefer: "return=representation" },
        body: {
          category: "Business",
          description: `Synthetic nonproduction qualification fixture ${authorization.run_id}`,
          logo_url: null,
          name: authorization.execution.fixture_name,
          pricing: "Free",
          status: "pending",
          submitter_email: `${authorization.run_id}@example.invalid`,
          submitter_name: "AiFinder qualification",
          website: authorization.execution.fixture_website,
        },
      }), [201], "CONCRETE_DATABASE_CREATE_FAILED");
      if (
        !Array.isArray(body) ||
        body.length !== 1 ||
        !Number.isSafeInteger(body[0]?.id) ||
        body[0].name !== authorization.execution.fixture_name ||
        body[0].website !== authorization.execution.fixture_website ||
        body[0].status !== "pending"
      ) {
        throw new ConcreteLivePlatformError("CONCRETE_DATABASE_CREATE_UNCONFIRMED");
      }
      const binding = { resource_type: "DATABASE_ROW", row_ids: [String(body[0].id)] };
      await recordBindingProgress(resource, binding, context);
      return binding;
    },
    async cleanupDatabaseFixture(resource, binding) {
      const body = requireStatus(await readDatabaseRows(), [200], "CONCRETE_DATABASE_READ_FAILED");
      if (Array.isArray(body) && body.length === 0) {
        return { status: "DELETED_EXACT" };
      }
      if (
        !Array.isArray(body) ||
        body.length !== 1 ||
        binding.row_ids.length !== 1 ||
        !exactDatabaseRow(body[0], authorization) ||
        String(body[0].id) !== binding.row_ids[0]
      ) {
        throw new ConcreteLivePlatformError("CONCRETE_DATABASE_OWNERSHIP_MISMATCH");
      }
      const deleted = requireStatus(await request({
        service: "SUPABASE_SERVICE",
        method: "DELETE",
        path: postgrestPath(
          "submitted_tools",
          `?select=id&id=in.(${binding.row_ids.join(",")})&website=eq.${encodeURIComponent(authorization.execution.fixture_website)}`,
        ),
        operation: "DATABASE_DELETE",
        expected_fixture: body,
        headers: { prefer: "return=representation" },
      }), [200], "CONCRETE_DATABASE_DELETE_FAILED");
      if (!Array.isArray(deleted) || deleted.length !== binding.row_ids.length) {
        throw new ConcreteLivePlatformError("CONCRETE_DATABASE_DELETE_UNCONFIRMED");
      }
      return { status: "DELETED_EXACT" };
    },
    async createStorageFixture(resource, context = {}) {
      const payload = createFreshSyntheticPng(random_bytes);
      try {
        if (
          payload.byteLength < 96 ||
          payload.byteLength > 512 ||
          payload.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
        ) {
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_PAYLOAD_INVALID");
        }
        const upload = requireStatus(await request({
          service: "SUPABASE_SERVICE",
          method: "POST",
          path: `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`,
          operation: "STORAGE_UPLOAD",
          headers: { "content-type": "image/png", "x-upsert": "false" },
          body: payload,
        }), [200], "CONCRETE_STORAGE_CREATE_FAILED");
        if (!exactStorageUpload(upload, authorization)) {
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CREATE_UNCONFIRMED");
        }
        const info = requireStatus(
          await readStorageInfo(),
          [200],
          "CONCRETE_STORAGE_INFO_FAILED",
        );
        if (
          !exactStorageInfo(info, authorization) ||
          info.id !== upload.Id ||
          !exactStorageCreationEpoch(info) ||
          info.metadata?.mimetype !== "image/png" ||
          info.metadata?.size !== payload.byteLength ||
          !boundedText(info.metadata?.eTag, 1024)
        ) {
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CREATE_UNCONFIRMED");
        }
        const downloadedBody = requireStatus(
          await readStorageBytes(),
          [200],
          "CONCRETE_STORAGE_DOWNLOAD_FAILED",
        );
        if (
          !(Buffer.isBuffer(downloadedBody) || downloadedBody instanceof Uint8Array)
        ) {
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CREATE_UNCONFIRMED");
        }
        const downloaded = Buffer.from(downloadedBody);
        let contentSha256;
        try {
          contentSha256 = sha256Hex(downloaded);
          if (
            downloaded.byteLength !== payload.byteLength ||
            contentSha256 !== sha256Hex(payload)
          ) {
            throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CREATE_UNCONFIRMED");
          }
        } finally {
          downloaded.fill(0);
        }
        const binding = {
          resource_type: "STORAGE_OBJECT",
          object_id: info.id,
          expected_version: info.version,
          expected_etag: info.metadata.eTag,
          expected_size: payload.byteLength,
          content_sha256: contentSha256,
          created_at: info.created_at,
        };
        await recordBindingProgress(resource, binding, context);
        return binding;
      } finally {
        payload.fill(0);
      }
    },
    async cleanupStorageExactVersion(resource, binding, cas) {
      if (
        cas?.expected_version !== binding.expected_version ||
        !isSha256(cas?.delete_capability_sha256)
      ) {
        throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CAS_MISMATCH");
      }
      const observed = await readStorageInfo();
      if (observed.status === 404) return { status: "DELETED_EXACT" };
      const info = requireStatus(observed, [200], "CONCRETE_STORAGE_INFO_FAILED");
      if (!exactStorageInfo(info, authorization)) {
        throw new ConcreteLivePlatformError("CONCRETE_STORAGE_INFO_INVALID");
      }
      if (info.version !== binding.expected_version) {
        return { status: "VERSION_MISMATCH", observed_version: info.version };
      }
      assertExactStorageInfoBinding(info, binding);
      await assertExactStorageContent(binding);
      const tokenBytes = random_bytes(32);
      if (!(tokenBytes instanceof Uint8Array) || tokenBytes.byteLength !== 32) {
        throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CAS_TOKEN_INVALID");
      }
      const rawToken = Buffer.from(tokenBytes).toString("hex");
      const tokenHash = sha256Hex(rawToken);
      const grantId = random_uuid();
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
          grantId,
        )
      ) {
        tokenBytes.fill(0);
        throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CAS_GRANT_INVALID");
      }
      try {
        const grant = requireStatus(await request({
          service: "SUPABASE_SERVICE",
          method: "POST",
          path: "/rest/v1/rpc/aifinder_prepare_storage_cleanup_grant",
          operation: "STORAGE_CAS_GRANT",
          body: {
            p_bucket_id: authorization.execution.storage_bucket,
            p_expected_etag: binding.expected_etag,
            p_expected_mime_type: "image/png",
            p_expected_size: binding.expected_size,
            p_expected_version: binding.expected_version,
            p_grant_id: grantId,
            p_object_name: authorization.execution.storage_name,
            p_phase_id: STORAGE_CAS_PHASE,
            p_runtime_session_id: authorization.run_id,
            p_token_hash: tokenHash,
            p_ttl_seconds: STORAGE_GRANT_TTL_SECONDS,
          },
        }), [200], "CONCRETE_STORAGE_CAS_GRANT_FAILED");
        const row = Array.isArray(grant) ? grant[0] : grant;
        if (
          !exactKeys(row, ["expected_version", "expires_at", "grant_id"]) ||
          row.grant_id !== grantId ||
          row.expected_version !== binding.expected_version ||
          !boundedText(row.expires_at, 64) ||
          !Number.isFinite(Date.parse(row.expires_at))
        ) {
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_CAS_GRANT_UNCONFIRMED");
        }
        requireStatus(await request({
          service: "SUPABASE_ANON",
          method: "DELETE",
          path: `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}`,
          operation: "STORAGE_CAS_DELETE",
          headers: { "x-aifinder-storage-cleanup-token": rawToken },
          body: { prefixes: [authorization.execution.storage_name] },
        }), [200], "CONCRETE_STORAGE_CAS_DELETE_FAILED");
        const after = await readStorageInfo();
        if (after.status !== 404) {
          if (after.status === 200 && exactStorageInfo(after.body, authorization) && after.body.version !== binding.expected_version) {
            return { status: "VERSION_MISMATCH", observed_version: after.body.version };
          }
          throw new ConcreteLivePlatformError("CONCRETE_STORAGE_DELETE_UNCONFIRMED");
        }
        return { status: "DELETED_EXACT" };
      } finally {
        try {
          requireStatus(await request({
            service: "SUPABASE_SERVICE",
            method: "POST",
            path: "/rest/v1/rpc/aifinder_revoke_storage_cleanup_grant",
            operation: "STORAGE_CAS_REVOKE",
            body: { p_grant_id: grantId, p_token_hash: tokenHash },
          }), [200], "CONCRETE_STORAGE_CAS_REVOKE_FAILED");
        } finally {
          tokenBytes.fill(0);
        }
      }
    },
    async verifyStaging({ staging_checks }) {
      const previewBinding = [...bindings.values()].find(
        (entry) => entry.resource_type === "PREVIEW_DEPLOYMENT",
      );
      if (!previewBinding) return { verified: false };
      let readyIdentity = null;
      for (let attempt = 1; attempt <= PREVIEW_READY_ATTEMPTS; attempt += 1) {
        const deployment = requireStatus(await request({
          service: "VERCEL",
          method: "GET",
          path: `/v13/deployments/${encodeURIComponent(previewBinding.deployment_id)}?${teamQuery}&withGitRepoInfo=true`,
          operation: "PREVIEW_READ",
          expected_fixture: expectedPreviewFixture(previewBinding),
        }), [200], "CONCRETE_PREVIEW_READ_FAILED");
        const identity = validatePreviewDeployment(deployment, {
          code: "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
          expectedId: previewBinding.deployment_id,
          expectedUrl: previewBinding.deployment_url,
        });
        if (identity.state === "READY") {
          readyIdentity = identity;
          break;
        }
        if (PREVIEW_TERMINAL_FAILURE_STATES.has(identity.state)) {
          throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_TERMINAL");
        }
        if (attempt < PREVIEW_READY_ATTEMPTS) {
          await wait(PREVIEW_READY_DELAY_MS);
        }
      }
      if (readyIdentity === null) {
        throw new ConcreteLivePlatformError("CONCRETE_PREVIEW_NOT_READY");
      }
      for (const check of staging_checks) {
        const response = await request({
          service: "PREVIEW",
          method: check.method,
          path: `https://${readyIdentity.hostname}${check.path}`,
          operation: "STAGING_VERIFY",
        });
        if (response.status !== check.status) return { verified: false };
      }
      return { verified: true };
    },
    async verifyFinal({ owned_resources }) {
      const present = [];
      for (const owned of owned_resources) {
        const binding = owned.resource_type === "ENVIRONMENT_RECORD"
          ? await discoverEnvironmentBinding()
          : bindings.get(owned.resource_key) ?? null;
        if (await boundResourcePresent(owned, binding)) {
          present.push(owned.resource_key);
        }
      }
      return {
        retained_preview_count: present.length,
        present,
      };
    },
  };
  return Object.freeze(platform);
}
