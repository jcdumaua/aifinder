const ENVIRONMENT_SOURCE = Object.freeze({
  key_name: "ADMIN_PASSWORD",
  source_name: "PROCESS_ENV_EXACT_KEY",
});
const PROVIDER_SOURCE = Object.freeze({
  key_name: "token",
  source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
});
const ALLOWED_VERCEL_AUTH_KEYS = new Set([
  "// Docs",
  "// Note",
  "expiresAt",
  "refreshToken",
  "token",
  "userId",
]);
const MAX_CREDENTIAL_CHARACTERS = 16_384;
const MAX_METADATA_CHARACTERS = 4_096;

export class AdminV1OfficialFirstEnvironmentCredentialLoaderError
  extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentCredentialLoaderError";
    this.code = code;
  }
}

function exactSource(actual, expected) {
  return actual && typeof actual === "object" && !Array.isArray(actual) &&
    Object.keys(actual).length === 2 &&
    actual.key_name === expected.key_name &&
    actual.source_name === expected.source_name;
}

function unavailable() {
  throw new AdminV1OfficialFirstEnvironmentCredentialLoaderError(
    "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
  );
}

function exactCredentialBuffer(value) {
  if (
    !Buffer.isBuffer(value) || value.length < 1 ||
    value.length > MAX_CREDENTIAL_CHARACTERS
  ) {
    unavailable();
  }
  return value;
}

function validCredentialString(value) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= MAX_CREDENTIAL_CHARACTERS && !/[\0\r\n]/u.test(value);
}

function validMetadataString(value, { nonempty, rejectLineBreaks }) {
  return typeof value === "string" && (!nonempty || value.length >= 1) &&
    value.length <= MAX_METADATA_CHARACTERS && !value.includes("\0") &&
    (!rejectLineBreaks || !/[\r\n]/u.test(value));
}

function validateVercelAuth(parsed) {
  if (
    !parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
    Object.getPrototypeOf(parsed) !== Object.prototype
  ) unavailable();
  const keys = Object.keys(parsed);
  if (keys.some((key) => !ALLOWED_VERCEL_AUTH_KEYS.has(key))) unavailable();
  if (!validCredentialString(parsed.token)) unavailable();
  if (
    Object.hasOwn(parsed, "refreshToken") &&
    !validCredentialString(parsed.refreshToken)
  ) unavailable();
  if (
    Object.hasOwn(parsed, "expiresAt") &&
    (!Number.isSafeInteger(parsed.expiresAt) ||
      parsed.expiresAt <= Math.floor(Date.now() / 1000))
  ) unavailable();
  if (
    Object.hasOwn(parsed, "userId") &&
    !validMetadataString(parsed.userId, {
      nonempty: true,
      rejectLineBreaks: true,
    })
  ) unavailable();
  for (const key of ["// Note", "// Docs"]) {
    if (
      Object.hasOwn(parsed, key) &&
      !validMetadataString(parsed[key], {
        nonempty: false,
        rejectLineBreaks: false,
      })
    ) unavailable();
  }
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino &&
    left.size === right.size && left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs && left.nlink === 1 && right.nlink === 1;
}

export function readAdminV1OfficialFirstEnvironmentVercelCliAuth({
  repository_root,
}) {
  let descriptor;
  let bytes = null;
  try {
    if (
      typeof repository_root !== "string" || !path.isAbsolute(repository_root) ||
      realpathSync(repository_root) !== repository_root
    ) unavailable();
    const credentialPath = path.join(
      path.dirname(repository_root),
      "Library",
      "Application Support",
      "com.vercel.cli",
      "auth.json",
    );
    if (realpathSync(path.dirname(credentialPath)) !== path.dirname(credentialPath)) {
      unavailable();
    }
    descriptor = openSync(
      credentialPath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const before = fstatSync(descriptor);
    const pathnameBefore = statSync(credentialPath);
    if (
      !before.isFile() || !pathnameBefore.isFile() ||
      !sameIdentity(before, pathnameBefore) || before.size < 2 ||
      before.size > MAX_CREDENTIAL_FILE_BYTES ||
      realpathSync(credentialPath) !== credentialPath
    ) unavailable();
    bytes = readFileSync(descriptor);
    if (
      bytes.byteLength !== before.size ||
      !sameIdentity(before, fstatSync(descriptor)) ||
      !sameIdentity(before, statSync(credentialPath))
    ) unavailable();
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff") || text.includes("\0")) unavailable();
    const parsed = JSON.parse(text);
    validateVercelAuth(parsed);
    return Buffer.from(parsed.token, "utf8");
  } catch (error) {
    if (
      error instanceof AdminV1OfficialFirstEnvironmentCredentialLoaderError
    ) throw error;
    unavailable();
  } finally {
    if (bytes !== null) bytes.fill(0);
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

export function createAdminV1OfficialFirstEnvironmentCredentialLoader({
  environment,
  read_provider_auth,
}) {
  if (
    !environment || typeof environment !== "object" ||
    typeof read_provider_auth !== "function"
  ) unavailable();
  let providerAuth = null;
  return Object.freeze({
    async load_environment_value({ source_contract } = {}) {
      if (!exactSource(source_contract, ENVIRONMENT_SOURCE)) {
        throw new AdminV1OfficialFirstEnvironmentCredentialLoaderError(
          "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_DENIED",
        );
      }
      const value = environment.ADMIN_PASSWORD;
      if (
        !validCredentialString(value)
      ) unavailable();
      return Buffer.from(value, "utf8");
    },
    async load_provider_auth({ source_contract } = {}) {
      if (!exactSource(source_contract, PROVIDER_SOURCE)) {
        throw new AdminV1OfficialFirstEnvironmentCredentialLoaderError(
          "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_DENIED",
        );
      }
      if (providerAuth === null) {
        providerAuth = exactCredentialBuffer(await read_provider_auth());
      }
      return providerAuth;
    },
    clear_sensitive() {
      if (providerAuth !== null) {
        providerAuth.fill(0);
        providerAuth = null;
      }
    },
  });
}
import {
  closeSync,
  constants,
  fstatSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";

const MAX_CREDENTIAL_FILE_BYTES = 128 * 1024;
