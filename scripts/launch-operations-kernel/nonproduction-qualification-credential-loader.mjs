import {
  closeSync,
  constants,
  fstatSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  CONCRETE_RUNTIME_CREDENTIAL_SPEC,
} from "./nonproduction-qualification-authorization.mjs";

export const CONCRETE_CREDENTIAL_NAMES = Object.freeze(
  CONCRETE_RUNTIME_CREDENTIAL_SPEC.flatMap((entry) => [...entry.accepted_names]),
);

export const ACTUAL_RUNTIME_CREDENTIAL_CATEGORIES = Object.freeze(
  CONCRETE_RUNTIME_CREDENTIAL_SPEC.map(({ category, accepted_names }) =>
    Object.freeze({ category, accepted_names })
  ),
);

const CREDENTIAL_NAME_SET = new Set(CONCRETE_CREDENTIAL_NAMES);
const MAX_CREDENTIAL_FILE_BYTES = 128 * 1024;
const MAX_CREDENTIAL_COMMAND_BYTES = 32 * 1024;
const CREDENTIAL_COMMAND_TIMEOUT_MS = 20_000;
const VERCEL_CLI_RELATIVE_PATH = path.join(".npm-global", "bin", "vercel");
const VERCEL_CLI_TARGET_RELATIVE_PATH = path.join(
  ".npm-global",
  "lib",
  "node_modules",
  "vercel",
  "dist",
  "vc.js",
);

export class ConcreteCredentialLoaderError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "ConcreteCredentialLoaderError";
    this.code = code;
    if (Array.isArray(details.missing_credentials)) {
      this.missing_credentials = Object.freeze([...details.missing_credentials]);
    }
    if (Array.isArray(details.invalid_credential_sources)) {
      this.invalid_credential_sources = Object.freeze([
        ...details.invalid_credential_sources,
      ]);
    }
  }
}

function invalidCredentialFile() {
  throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_FILE_INVALID");
}

function zeroMutableBytes(value) {
  if (value instanceof Uint8Array) value.fill(0);
}

function sameCredentialFileIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs &&
    left.nlink === 1 &&
    right.nlink === 1
  );
}

export function parseConcreteCredentialEnvironment(source) {
  if (
    typeof source !== "string" ||
    source.includes("\0") ||
    source.startsWith("\uFEFF")
  ) {
    invalidCredentialFile();
  }
  const environment = {};
  for (const rawLine of source.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (line.length === 0 || line.startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line);
    if (!match) invalidCredentialFile();
    const [, name, rawValue] = match;
    let value = rawValue;
    if (rawValue.startsWith("'") || rawValue.startsWith('"')) {
      const quote = rawValue[0];
      if (rawValue.length < 2 || rawValue.at(-1) !== quote) {
        invalidCredentialFile();
      }
      value = rawValue.slice(1, -1);
    } else if (rawValue.endsWith("'") || rawValue.endsWith('"')) {
      invalidCredentialFile();
    }
    if (!CREDENTIAL_NAME_SET.has(name)) continue;
    if (Object.hasOwn(environment, name)) invalidCredentialFile();
    environment[name] = value;
  }
  return Object.freeze(environment);
}

export function classifyConcreteCredentialEnvironment(source) {
  const environment = parseConcreteCredentialEnvironment(source);
  return Object.freeze(Object.fromEntries(CONCRETE_CREDENTIAL_NAMES.map((name) =>
    [name, Object.freeze({
      present: Object.hasOwn(environment, name),
      non_empty: typeof environment[name] === "string" && environment[name].length > 0,
      duplicate: false,
      parse_valid: true,
      allowlisted: true,
    })]
  )));
}

function readSecureCredentialFile(credentialPath, {
  onCredentialBytesAcquired,
} = {}) {
  let descriptor;
  let acquiredBytes = null;
  let failure = null;
  try {
    descriptor = openSync(
      credentialPath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const metadata = fstatSync(descriptor);
    const pathnameMetadata = statSync(credentialPath);
    if (
      !metadata.isFile() ||
      !pathnameMetadata.isFile() ||
      !sameCredentialFileIdentity(metadata, pathnameMetadata) ||
      metadata.size < 1 ||
      metadata.size > MAX_CREDENTIAL_FILE_BYTES ||
      realpathSync(credentialPath) !== credentialPath
    ) {
      throw new Error("INVALID");
    }
    const bytes = readFileSync(descriptor);
    acquiredBytes = bytes;
    if (typeof onCredentialBytesAcquired === "function") {
      onCredentialBytesAcquired(bytes);
    }
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== metadata.size ||
      !sameCredentialFileIdentity(metadata, fstatSync(descriptor)) ||
      !sameCredentialFileIdentity(metadata, statSync(credentialPath))
    ) throw new Error("CHANGED");
  } catch {
    failure = new ConcreteCredentialLoaderError(
      "CONCRETE_CREDENTIAL_SOURCE_INVALID",
    );
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor);
      } catch {
        failure = new ConcreteCredentialLoaderError(
          "CONCRETE_CREDENTIAL_SOURCE_INVALID",
        );
      }
    }
    if (failure !== null) zeroMutableBytes(acquiredBytes);
  }
  if (failure !== null) throw failure;
  return acquiredBytes;
}

function safeCredential(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= 16384;
}

function expectedVercelCliPaths(repositoryRoot) {
  const homeDirectory = path.dirname(repositoryRoot);
  return {
    executablePath: path.join(homeDirectory, VERCEL_CLI_RELATIVE_PATH),
    homeDirectory,
    targetPath: path.join(homeDirectory, VERCEL_CLI_TARGET_RELATIVE_PATH),
  };
}

function resolveInstalledVercelCliExecutable({ repositoryRoot }) {
  const { executablePath, targetPath } = expectedVercelCliPaths(repositoryRoot);
  if (
    realpathSync(executablePath) !== targetPath ||
    realpathSync(targetPath) !== targetPath
  ) {
    throw new Error("VERCEL_CLI_IDENTITY");
  }
  return targetPath;
}

function validateExistingVercelCliSession({
  repositoryRoot,
  resolveVercelCliExecutable,
  spawnCredentialCommand,
}) {
  let result;
  try {
    const { homeDirectory, targetPath } = expectedVercelCliPaths(
      repositoryRoot,
    );
    const resolvedExecutable = resolveVercelCliExecutable({ repositoryRoot });
    if (resolvedExecutable !== targetPath) {
      throw new Error("VERCEL_CLI_EXECUTABLE");
    }
    result = spawnCredentialCommand(
      "/usr/local/bin/node",
      [resolvedExecutable, "whoami"],
      {
        cwd: repositoryRoot,
        encoding: null,
        env: {
          CI: "1",
          HOME: homeDirectory,
          NO_COLOR: "1",
          PATH: "/usr/local/bin:/usr/bin:/bin",
          VERCEL_TELEMETRY_DISABLED: "1",
        },
        maxBuffer: MAX_CREDENTIAL_COMMAND_BYTES,
        shell: false,
        timeout: CREDENTIAL_COMMAND_TIMEOUT_MS,
      },
    );
    if (
      result?.status !== 0 ||
      result.signal !== null ||
      result.error !== undefined ||
      !(result.stdout instanceof Uint8Array) ||
      !(result.stderr instanceof Uint8Array) ||
      result.stdout.byteLength < 2 ||
      result.stdout.byteLength > MAX_CREDENTIAL_COMMAND_BYTES ||
      result.stderr.byteLength > MAX_CREDENTIAL_COMMAND_BYTES
    ) {
      throw new Error("VERCEL_CLI_COMMAND");
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      result.stdout,
    );
    if (
      !text.endsWith("\n") ||
      text.slice(0, -1).includes("\n") ||
      text.includes("\0")
    ) {
      throw new Error("VERCEL_CLI_OUTPUT");
    }
  } finally {
    zeroMutableBytes(result?.stdout);
    zeroMutableBytes(result?.stderr);
  }
}

export function readExistingGitHubCliToken({
  repositoryRoot,
  spawnCredentialCommand = spawnSync,
}) {
  let result;
  try {
    if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
      throw new Error("ROOT");
    }
    result = spawnCredentialCommand(
      "/opt/homebrew/bin/gh",
      ["auth", "token"],
      {
        cwd: repositoryRoot,
        encoding: null,
        env: {
          GH_PROMPT_DISABLED: "1",
          HOME: path.dirname(repositoryRoot),
          NO_COLOR: "1",
          PATH: "/opt/homebrew/bin:/usr/bin:/bin",
        },
        maxBuffer: 32 * 1024,
        shell: false,
        timeout: 20_000,
      },
    );
    if (
      result?.status !== 0 ||
      !(result.stdout instanceof Uint8Array) ||
      result.stdout.byteLength < 2 ||
      result.stdout.byteLength > 16385
    ) throw new Error("COMMAND");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
    if (!text.endsWith("\n") || text.slice(0, -1).includes("\n") || text.includes("\0")) {
      throw new Error("OUTPUT");
    }
    const token = text.slice(0, -1);
    if (!safeCredential(token)) throw new Error("TOKEN");
    return token;
  } catch {
    throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_SOURCE_INVALID");
  } finally {
    zeroMutableBytes(result?.stdout);
    zeroMutableBytes(result?.stderr);
  }
}

export function readExistingVercelCliToken({
  repositoryRoot,
  readCredentialFile = readSecureCredentialFile,
  resolveVercelCliExecutable = resolveInstalledVercelCliExecutable,
  secureCredentialFileDependencies,
  spawnCredentialCommand = spawnSync,
}) {
  let bytes = null;
  try {
    if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
      throw new Error("ROOT");
    }
    validateExistingVercelCliSession({
      repositoryRoot,
      resolveVercelCliExecutable,
      spawnCredentialCommand,
    });
    const credentialPath = path.join(
      path.dirname(repositoryRoot),
      "Library",
      "Application Support",
      "com.vercel.cli",
      "auth.json",
    );
    bytes = readCredentialFile(
      credentialPath,
      secureCredentialFileDependencies,
    );
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength < 2 ||
      bytes.byteLength > MAX_CREDENTIAL_FILE_BYTES
    ) throw new Error("BYTES");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff") || text.includes("\0")) throw new Error("TEXT");
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("ROOT");
    }
    if (!safeCredential(parsed.token)) throw new Error("TOKEN");
    return parsed.token;
  } catch {
    throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_SOURCE_INVALID");
  } finally {
    zeroMutableBytes(bytes);
  }
}

export function resolveConcreteCredentialEnvironment({
  environment,
  repositoryRoot,
  readGitHubCliToken = readExistingGitHubCliToken,
  readVercelCliToken = readExistingVercelCliToken,
}) {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) {
    throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_FILE_INVALID");
  }
  const resolved = { ...environment };
  const sources = {};
  const invalidSources = [];
  if (safeCredential(resolved.GH_TOKEN) || safeCredential(resolved.GITHUB_TOKEN)) {
    sources.GITHUB = "AVAILABLE_ENV_LOCAL";
  } else {
    try {
      resolved.GH_TOKEN = readGitHubCliToken({ repositoryRoot });
      if (!safeCredential(resolved.GH_TOKEN)) throw new Error("TOKEN");
      sources.GITHUB = "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE";
    } catch {
      invalidSources.push("GITHUB");
    }
  }
  if (safeCredential(resolved.VERCEL_TOKEN)) {
    sources.VERCEL = "AVAILABLE_ENV_LOCAL";
  } else {
    try {
      resolved.VERCEL_TOKEN = readVercelCliToken({ repositoryRoot });
      if (!safeCredential(resolved.VERCEL_TOKEN)) throw new Error("TOKEN");
      sources.VERCEL = "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE";
    } catch {
      invalidSources.push("VERCEL");
    }
  }
  for (const { category, accepted_names: [name] } of
    CONCRETE_RUNTIME_CREDENTIAL_SPEC.slice(2)) {
    if (safeCredential(resolved[name])) sources[category] = "AVAILABLE_ENV_LOCAL";
  }
  const missing = [];
  if (!sources.GITHUB) missing.push("GH_TOKEN|GITHUB_TOKEN");
  if (!sources.VERCEL) missing.push("VERCEL_TOKEN");
  for (const { category, accepted_names } of
    CONCRETE_RUNTIME_CREDENTIAL_SPEC.slice(2)) {
    if (!sources[category]) missing.push(accepted_names.join("|"));
  }
  if (missing.length > 0) {
    throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_MISSING", {
      missing_credentials: missing,
      invalid_credential_sources: invalidSources,
    });
  }
  return Object.freeze({
    environment: Object.freeze(resolved),
    sources: Object.freeze(sources),
  });
}

export function readConcreteCredentialEnvironment({
  repositoryRoot,
  onCredentialBytesAcquired,
}) {
  let descriptor;
  let acquiredBytes = null;
  try {
    if (
      typeof repositoryRoot !== "string" ||
      !path.isAbsolute(repositoryRoot) ||
      realpathSync(repositoryRoot) !== repositoryRoot
    ) {
      invalidCredentialFile();
    }
    const credentialPath = path.join(repositoryRoot, ".env.local");
    descriptor = openSync(
      credentialPath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const metadata = fstatSync(descriptor);
    if (
      !metadata.isFile() ||
      metadata.nlink !== 1 ||
      metadata.size < 1 ||
      metadata.size > MAX_CREDENTIAL_FILE_BYTES ||
      realpathSync(credentialPath) !== credentialPath
    ) {
      invalidCredentialFile();
    }
    const bytes = readFileSync(descriptor);
    acquiredBytes = bytes;
    if (typeof onCredentialBytesAcquired === "function") {
      onCredentialBytesAcquired(bytes);
    }
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== metadata.size ||
      (bytes.length >= 3 &&
        bytes[0] === 0xef &&
        bytes[1] === 0xbb &&
        bytes[2] === 0xbf)
    ) {
      invalidCredentialFile();
    }
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return parseConcreteCredentialEnvironment(source);
  } catch (error) {
    if (
      error instanceof ConcreteCredentialLoaderError &&
      error.code !== "CONCRETE_CREDENTIAL_FILE_INVALID"
    ) throw error;
    const missing = CONCRETE_RUNTIME_CREDENTIAL_SPEC.slice(2).map(
      ({ accepted_names }) => accepted_names.join("|"),
    );
    throw new ConcreteCredentialLoaderError("CONCRETE_CREDENTIAL_MISSING", {
      missing_credentials: missing,
      invalid_credential_sources: error?.code === "ENOENT" ? [] : ["ENV_LOCAL"],
    });
  } finally {
    zeroMutableBytes(acquiredBytes);
    if (descriptor !== undefined) closeSync(descriptor);
  }
}
