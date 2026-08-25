const ENVIRONMENT_SOURCE = Object.freeze({
  key_name: "ADMIN_PASSWORD",
  source_name: "PROCESS_ENV_EXACT_KEY",
});
const PROVIDER_SOURCE = Object.freeze({
  key_name: "token",
  source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
});

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
  if (!Buffer.isBuffer(value) || value.length < 1 || value.length > 16_384) {
    unavailable();
  }
  return value;
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
    if (
      !parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.keys(parsed).length !== 1 ||
      typeof parsed.token !== "string" || parsed.token.length < 1 ||
      parsed.token.length > 16_384 || /[\0\r\n]/u.test(parsed.token)
    ) unavailable();
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
        typeof value !== "string" || value.length < 1 || value.length > 16_384 ||
        value.includes("\0") || value.includes("\r") || value.includes("\n")
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
