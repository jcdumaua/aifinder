import * as brokerNativeFs from "node:fs";
import { createHash } from "node:crypto";
import {
  lstatSync,
  openSync,
  closeSync,
  fstatSync,
  constants,
  mkdtempSync,
  rmdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { encodedBytes, validateTrustedPlan } from "../scripts/c08-child-receipts.mjs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// BEGIN A20_FIXED_FD_BROKER_CLIENT

const BROKER_REQUEST_LIMIT = 16 * 1024;
const BROKER_RESPONSE_LIMIT = 8 * 1024 * 1024;
const BROKER_STREAM_LIMIT = 4 * 1024 * 1024;
const BROKER_DEADLINE_MS = 25_000;
const brokerPauseWord = new Int32Array(new SharedArrayBuffer(4));
const brokerPoisonedTransports = new WeakSet();
const BROKER_RESULT_KEYS = [
  "classification", "family", "git_pid", "id", "overflow", "schema",
  "signal", "status", "stderr_base64", "stdout_base64", "timeout",
];
const BROKER_CONTEXT_KEYS = ["git_dir", "object_directory", "repository_root", "work_tree_root"];
const BROKER_SIGNAL_NAMES = new Set([
  "SIGABRT", "SIGALRM", "SIGBUS", "SIGCHLD", "SIGCONT", "SIGEMT", "SIGFPE",
  "SIGHUP", "SIGILL", "SIGINFO", "SIGINT", "SIGIO", "SIGIOT", "SIGKILL",
  "SIGPIPE", "SIGPOLL", "SIGPROF", "SIGPWR", "SIGQUIT", "SIGSEGV", "SIGSTKFLT",
  "SIGSTOP", "SIGSYS", "SIGTERM", "SIGTRAP", "SIGTSTP", "SIGTTIN", "SIGTTOU",
  "SIGURG", "SIGUSR1", "SIGUSR2", "SIGVTALRM", "SIGWINCH", "SIGXCPU", "SIGXFSZ",
]);

class BrokerClientError extends Error {
  constructor() {
    super("A20_GIT_BROKER_CLIENT_FAILED");
    this.name = "BrokerClientError";
    this.code = "A20_GIT_BROKER_CLIENT_FAILED";
  }
}

function brokerFailure() { throw new BrokerClientError(); }
function brokerNow() { return Number(process.hrtime.bigint() / 1_000_000n); }
function brokerPause() { Atomics.wait(brokerPauseWord, 0, 0, 1); }
function brokerObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function brokerExactKeys(value, expected) {
  return brokerObject(value) && Object.keys(value).sort().join("\0") === expected.join("\0");
}
function brokerCanonical(value, depth = 0) {
  if (depth > 32) brokerFailure();
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) brokerFailure();
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map((item) => brokerCanonical(item, depth + 1)).join(",") + "]";
  if (!brokerObject(value)) brokerFailure();
  return "{" + Object.keys(value).sort().map((key) =>
    JSON.stringify(key) + ":" + brokerCanonical(value[key], depth + 1)).join(",") + "}";
}

export function brokerMode(env = process.env ?? {}) {
  const mode = env.AIFINDER_GIT_BROKER_MODE;
  if (mode === undefined) return false;
  if (mode !== "1") brokerFailure();
  return true;
}

export function brokerDescriptors(env = process.env ?? {}, fs = brokerNativeFs) {
  if (!brokerMode(env)) return null;
  if (env.AIFINDER_GIT_BROKER_REQUEST_FD !== "3" || env.AIFINDER_GIT_BROKER_RESPONSE_FD !== "4") brokerFailure();
  try {
    if (!fs.fstatSync(3).isFIFO() || !fs.fstatSync(4).isFIFO()) brokerFailure();
  } catch { brokerFailure(); }
  return { requestFd: 3, responseFd: 4 };
}

function brokerCheckDeadline(now, deadline) {
  const current = now();
  if (!Number.isFinite(current) || current >= deadline) brokerFailure();
}
function brokerWouldRetry(error) {
  return error?.code === "EAGAIN" || error?.code === "EWOULDBLOCK" || error?.code === "EINTR";
}
function brokerReadExact(fs, fd, length, now, pause, deadline) {
  if (!Number.isSafeInteger(length) || length <= 0 || length > BROKER_RESPONSE_LIMIT) brokerFailure();
  const bytes = Buffer.alloc(length);
  let offset = 0;
  while (offset < length) {
    brokerCheckDeadline(now, deadline);
    let count;
    try { count = fs.readSync(fd, bytes, offset, length - offset, null); }
    catch (error) {
      if (!brokerWouldRetry(error)) brokerFailure();
      pause();
      continue;
    }
    if (!Number.isSafeInteger(count) || count <= 0 || count > length - offset) brokerFailure();
    offset += count;
  }
  return bytes;
}
function brokerReadFrame(fs, fd, now, pause, deadline) {
  const header = brokerReadExact(fs, fd, 4, now, pause, deadline);
  const length = header.readUInt32BE(0);
  if (length <= 0 || length > BROKER_RESPONSE_LIMIT) brokerFailure();
  const bytes = brokerReadExact(fs, fd, length, now, pause, deadline);
  let text, value;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    value = JSON.parse(text);
  } catch { brokerFailure(); }
  if (!Buffer.from(text, "utf8").equals(bytes) || brokerCanonical(value) !== text) brokerFailure();
  return value;
}
function brokerWriteFrame(fs, fd, request, now, pause, deadline) {
  const body = Buffer.from(brokerCanonical(request), "utf8");
  if (body.length <= 0 || body.length > BROKER_REQUEST_LIMIT) brokerFailure();
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length);
  const bytes = Buffer.concat([header, body]);
  let offset = 0;
  while (offset < bytes.length) {
    brokerCheckDeadline(now, deadline);
    let count;
    try { count = fs.writeSync(fd, bytes, offset, bytes.length - offset, null); }
    catch (error) {
      if (!brokerWouldRetry(error)) brokerFailure();
      pause();
      continue;
    }
    if (!Number.isSafeInteger(count) || count <= 0 || count > bytes.length - offset) brokerFailure();
    offset += count;
  }
}
function brokerDecodeStream(value) {
  if (typeof value !== "string" || value.length > 4 * Math.ceil(BROKER_STREAM_LIMIT / 3)) brokerFailure();
  const bytes = Buffer.from(value, "base64");
  if (bytes.length > BROKER_STREAM_LIMIT || bytes.toString("base64") !== value) brokerFailure();
  return bytes;
}
function brokerResult(value, id, family) {
  if (!brokerExactKeys(value, BROKER_RESULT_KEYS) || value.schema !== "A20_GIT_RESPONSE_V1" || value.id !== id || value.family !== family) brokerFailure();
  if (!(value.status === null || (Number.isSafeInteger(value.status) && value.status >= 0 && value.status <= 255))) brokerFailure();
  if (!(value.signal === null || BROKER_SIGNAL_NAMES.has(value.signal))) brokerFailure();
  if (!((value.status !== null && value.signal === null) || (value.status === null && value.signal !== null))) brokerFailure();
  if (!Number.isSafeInteger(value.git_pid) || value.git_pid <= 0 || typeof value.timeout !== "boolean" || typeof value.overflow !== "boolean") brokerFailure();
  const cleanFlags = !value.timeout && !value.overflow;
  let coherent = false;
  switch (value.classification) {
    case "PASS": coherent = value.status === 0 && value.signal === null && cleanFlags; break;
    case "GIT_NONZERO": coherent = value.status !== null && value.status > 0 && value.signal === null && cleanFlags; break;
    case "GIT_SIGNAL": coherent = value.status === null && value.signal !== null && cleanFlags; break;
    case "GIT_TIMEOUT": coherent = value.timeout && !value.overflow && (value.status === null || value.signal === null); break;
    case "GIT_OUTPUT_OVERFLOW": coherent = value.overflow; break;
    default: brokerFailure();
  }
  if (!coherent) brokerFailure();
  const stdout = brokerDecodeStream(value.stdout_base64);
  const stderr = brokerDecodeStream(value.stderr_base64);
  let error = null;
  if (value.timeout || value.overflow) {
    error = new Error(value.overflow ? "A20_GIT_OUTPUT_OVERFLOW" : "A20_GIT_TIMEOUT");
    error.code = value.overflow ? "ENOBUFS" : "ETIMEDOUT";
  }
  return { status: value.status, signal: value.signal, pid: value.git_pid, stdout, stderr,
    error, timeout: value.timeout, overflow: value.overflow, classification: value.classification };
}

export function brokerRequest(family, params, context, {
  env = process.env ?? {}, fs = brokerNativeFs, now = brokerNow, pause = brokerPause,
} = {}) {
  if (!brokerMode(env)) return null;
  try {
    if (brokerPoisonedTransports.has(fs)) brokerFailure();
    const descriptors = brokerDescriptors(env, fs);
    if (typeof family !== "string" || !/^[A-Z][A-Z0-9_]{0,95}$/u.test(family) || !brokerObject(params) || !brokerExactKeys(context, BROKER_CONTEXT_KEYS)) brokerFailure();
    const started = now();
    if (!Number.isFinite(started) || typeof pause !== "function") brokerFailure();
    const deadline = started + BROKER_DEADLINE_MS;
    const grant = brokerReadFrame(fs, descriptors.responseFd, now, pause, deadline);
    if (!brokerExactKeys(grant, ["id", "schema"]) || grant.schema !== "A20_GIT_GRANT_V1" || !Number.isSafeInteger(grant.id) || grant.id <= 0 || grant.id > 512) brokerFailure();
    // Broker owns the session-monotonic counter across sequential processes.
    brokerWriteFrame(fs, descriptors.requestFd, { schema: "A20_GIT_REQUEST_V1", id: grant.id, family, params, context }, now, pause, deadline);
    const result = brokerReadFrame(fs, descriptors.responseFd, now, pause, deadline);
    const reconstructed = brokerResult(result, grant.id, family);
    brokerCheckDeadline(now, deadline);
    return reconstructed;
  } catch {
    if (fs !== null && (typeof fs === "object" || typeof fs === "function")) brokerPoisonedTransports.add(fs);
    brokerFailure();
  }
}

export function readinessBrokerOptions(environment, { env = process.env ?? {}, fs = brokerNativeFs } = {}) {
  const childEnvironment = { ...environment };
  const descriptors = brokerDescriptors(env, fs);
  if (descriptors === null) return { env: childEnvironment, stdio: ["ignore", "pipe", "pipe"] };
  childEnvironment.AIFINDER_GIT_BROKER_MODE = "1";
  childEnvironment.AIFINDER_GIT_BROKER_REQUEST_FD = "3";
  childEnvironment.AIFINDER_GIT_BROKER_RESPONSE_FD = "4";
  return { env: childEnvironment, stdio: ["ignore", "pipe", "pipe", descriptors.requestFd, descriptors.responseFd] };
}
// END A20_FIXED_FD_BROKER_CLIENT

export class GovernanceError extends Error {
  constructor(stage, message = stage) {
    super(message);
    this.name = "GovernanceError";
    this.stage = stage;
  }
}

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function toRepositoryPath(absolutePath) {
  const relative = path.relative(repositoryRoot, absolutePath);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new GovernanceError("PATH_OUTSIDE_REPOSITORY");
  }
  return relative.split(path.sep).join("/");
}

export function resolveRepositoryPath(repositoryPath) {
  if (
    typeof repositoryPath !== "string" ||
    repositoryPath.length === 0 ||
    path.isAbsolute(repositoryPath)
  ) {
    throw new GovernanceError("INVALID_REPOSITORY_PATH");
  }
  const absolute = path.resolve(repositoryRoot, repositoryPath);
  toRepositoryPath(absolute);
  return absolute;
}

export function assertRegularFile(repositoryPath, expectedMode = 0o644) {
  const absolute = resolveRepositoryPath(repositoryPath);
  let info;
  try {
    info = lstatSync(absolute);
  } catch {
    throw new GovernanceError("REGULAR_FILE_ABSENT");
  }
  if (info.isSymbolicLink()) {
    throw new GovernanceError("SYMLINK_REJECTED");
  }
  if (!info.isFile()) {
    throw new GovernanceError("NOT_REGULAR_FILE");
  }
  if (
    expectedMode !== null &&
    (info.mode & 0o777) !== expectedMode
  ) {
    throw new GovernanceError("FILE_MODE_MISMATCH");
  }
  return absolute;
}

export function fileIdentity(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath, null);
  const bytes = readFileSync(absolute);
  return {
    path: repositoryPath,
    sha256: sha256(bytes),
    bytes: bytes.byteLength,
    mode: (statSync(absolute).mode & 0o777)
      .toString(8)
      .padStart(4, "0"),
  };
}

class StrictJsonParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }

  fail(stage = "STRICT_JSON_SYNTAX") {
    throw new GovernanceError(stage);
  }

  skipWhitespace() {
    while (
      this.index < this.source.length &&
      /[\u0009\u000a\u000d\u0020]/.test(this.source[this.index])
    ) {
      this.index += 1;
    }
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.source.length) this.fail();
    return value;
  }

  parseValue() {
    this.skipWhitespace();
    const character = this.source[this.index];
    if (character === "{") return this.parseObject();
    if (character === "[") return this.parseArray();
    if (character === '"') return this.parseString();
    if (character === "t") return this.parseLiteral("true", true);
    if (character === "f") return this.parseLiteral("false", false);
    if (character === "n") return this.parseLiteral("null", null);
    return this.parseNumber();
  }

  parseString() {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.source.length) {
      const code = this.source.charCodeAt(this.index);
      const character = this.source[this.index];
      if (!escaped && character === '"') {
        this.index += 1;
        try {
          return JSON.parse(this.source.slice(start, this.index));
        } catch {
          this.fail();
        }
      }
      if (!escaped && code < 0x20) this.fail();
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.index += 1;
    }
    this.fail();
  }

  parseNumber() {
    const match = this.source
      .slice(this.index)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) this.fail();
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.fail();
    return value;
  }

  parseLiteral(literal, value) {
    if (this.source.slice(this.index, this.index + literal.length) !== literal) {
      this.fail();
    }
    this.index += literal.length;
    return value;
  }

  parseArray() {
    const result = [];
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      const character = this.source[this.index];
      if (character === "]") {
        this.index += 1;
        return result;
      }
      if (character !== ",") this.fail();
      this.index += 1;
    }
  }

  parseObject() {
    const result = Object.create(null);
    const keys = new Set();
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (true) {
      this.skipWhitespace();
      if (this.source[this.index] !== '"') this.fail();
      const key = this.parseString();
      if (keys.has(key)) this.fail("STRICT_JSON_DUPLICATE_KEY");
      keys.add(key);
      this.skipWhitespace();
      if (this.source[this.index] !== ":") this.fail();
      this.index += 1;
      result[key] = this.parseValue();
      this.skipWhitespace();
      const character = this.source[this.index];
      if (character === "}") {
        this.index += 1;
        return result;
      }
      if (character !== ",") this.fail();
      this.index += 1;
    }
  }
}

export function strictJsonParse(source) {
  if (typeof source !== "string") {
    throw new GovernanceError("STRICT_JSON_INPUT_TYPE");
  }
  return new StrictJsonParser(source).parse();
}

export function readStrictJson(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath);
  return strictJsonParse(readFileSync(absolute, "utf8"));
}

export function stableSortedPaths(paths) {
  if (!Array.isArray(paths) || paths.some((item) => typeof item !== "string")) {
    throw new GovernanceError("PATH_SET_INPUT");
  }
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

export function canonicalRegularFileMode(mode) {
  const numericMode =
    typeof mode === "string" && /^[0-7]{4}$/.test(mode)
      ? Number.parseInt(mode, 8)
      : mode;
  if (!Number.isSafeInteger(numericMode) || numericMode < 0) {
    throw new GovernanceError("REGULAR_FILE_MODE_INVALID");
  }
  return (numericMode & 0o111) !== 0 ? "0755" : "0644";
}

export function testingTreeIdentityRow(identity) {
  if (
    !identity ||
    typeof identity.path !== "string" ||
    identity.path.length === 0 ||
    !/^[0-9a-f]{64}$/.test(identity.sha256) ||
    !Number.isSafeInteger(identity.bytes) ||
    identity.bytes < 0
  ) {
    throw new GovernanceError("TESTING_TREE_IDENTITY_INVALID");
  }
  return [
    identity.path,
    identity.sha256,
    identity.bytes,
    canonicalRegularFileMode(identity.mode),
  ].join("\0");
}

export function compareExactPathSets(actual, expected) {
  const sortedActual = stableSortedPaths(actual);
  const sortedExpected = stableSortedPaths(expected);
  return {
    equal:
      sortedActual.length === sortedExpected.length &&
      sortedActual.every((value, index) => value === sortedExpected[index]),
    missing: sortedExpected.filter((value) => !sortedActual.includes(value)),
    unexpected: sortedActual.filter((value) => !sortedExpected.includes(value)),
  };
}

function walkDirectory(absoluteDirectory, output) {
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, "en"),
  );
  for (const entry of entries) {
    const absolute = path.join(absoluteDirectory, entry.name);
    const info = lstatSync(absolute);
    if (info.isSymbolicLink()) {
      throw new GovernanceError("SYMLINK_REJECTED");
    }
    if (info.isDirectory()) {
      walkDirectory(absolute, output);
    } else if (info.isFile()) {
      output.push(toRepositoryPath(absolute));
    }
  }
}

export function listRegularFiles(repositoryDirectory) {
  const absolute = resolveRepositoryPath(repositoryDirectory);
  if (!lstatSync(absolute).isDirectory()) {
    throw new GovernanceError("INVENTORY_ROOT_NOT_DIRECTORY");
  }
  const output = [];
  walkDirectory(absolute, output);
  return stableSortedPaths(output);
}

const portableProtectedPaths = new Set([
  "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-wrapper-candidate.sh",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-generator-candidate.py",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-schema.json",
]);
function portableSensitive(value) {
  const comparison = value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
  const leaf = path.posix.basename(comparison);
  return portableProtectedPaths.has(comparison) || comparison.split("/").includes(".git") ||
    (leaf === ".env" || (leaf.startsWith(".env.") && path.posix.basename(value) !== ".env.example"));
}
const portableMetadataFields = ["dev", "ino", "mode", "uid", "gid", "nlink", "size", "mtimeNs", "ctimeNs"];
const portableCommonControls = [
  "--no-replace-objects", "--no-optional-locks", "--no-pager",
  ...["maintenance.auto=false", "maintenance.autoDetach=false", "gc.auto=0", "gc.autoPackLimit=0", "gc.autoDetach=false", "core.hooksPath=/dev/null", "core.fsmonitor=false", "credential.helper=", "credential.interactive=false", "core.attributesFile=/dev/null", "core.excludesFile=/dev/null", "diff.external="].flatMap((value) => ["-c", value]),
];

function portableFail(stage = "BLOCKED_PORTABLE_GIT_SURFACE") {
  throw new GovernanceError(stage);
}

function portablePath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 4096 &&
    !/[\u0000-\u001f\u007f\\]/.test(value) && !path.isAbsolute(value) &&
    value.split("/").every((part) => part && part !== "." && part !== "..");
}

function portableFamily(args) {
  if (!Array.isArray(args) || args.some((value) => typeof value !== "string")) portableFail("GIT_ARGV_INVALID");
  const fixed = [
    ["ls-files", "-z"],
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    ["diff", "--binary", "--no-ext-diff", "HEAD", "--"],
  ];
  if (fixed.some((family) => family.length === args.length && family.every((value, i) => args[i] === value))) return;
  if (args.length === 3 && args[0] === "hash-object" && args[1] === "--" && portablePath(args[2]) && !portableSensitive(args[2])) return;
  portableFail("GIT_FAMILY_NOT_ADMITTED");
}

function portableMetadata(info) {
  return portableMetadataFields.map((field) => String(info[field]));
}

function portableSame(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function portableInfo(absolute, optional = false) {
  try { return lstatSync(absolute, { bigint: true }); }
  catch (error) { if (optional && error.code === "ENOENT") return null; portableFail(); }
}

function portableParents(absolute, rootOwned = false, admitted = null, allowAbsent = false) {
  let current = path.dirname(absolute);
  while (true) {
    const info = portableInfo(current, allowAbsent);
    if (info && (!info.isDirectory() || info.isSymbolicLink() || (rootOwned && (Number(info.uid) !== 0 || (Number(info.mode) & 0o022))))) portableFail();
    if (admitted) admitted(current, info);
    if (current === path.dirname(current)) break;
    current = path.dirname(current);
  }
}

function portableRead(absolute, limit, executable = false) {
  const parentIdentities = [];
  portableParents(absolute, executable, (name, info) => parentIdentities.push([name, portableMetadata(info)]));
  const before = portableInfo(absolute);
  if (!before.isFile() || before.isSymbolicLink() || Number(before.nlink) !== 1 || Number(before.size) > limit ||
      (Number(before.mode) & 0o022) || (executable && (Number(before.uid) !== 0 || !(Number(before.mode) & 0o111)))) portableFail();
  let descriptor;
  try {
    descriptor = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const admitted = fstatSync(descriptor, { bigint: true });
    if (!portableSame(portableMetadata(before), portableMetadata(admitted))) portableFail();
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    if (bytes.length > limit || bytes.length !== Number(after.size) || !portableSame(portableMetadata(before), portableMetadata(after)) ||
        !portableSame(portableMetadata(before), portableMetadata(portableInfo(absolute)))) portableFail();
    for (const [name, identity] of parentIdentities) if (!portableSame(identity, portableMetadata(portableInfo(name)))) portableFail("GIT_SURFACE_CHANGED");
    return { bytes, identity: portableMetadata(before), sha256: sha256(bytes), parents: parentIdentities };
  } finally { if (descriptor !== undefined) closeSync(descriptor); }
}

function portableText(bytes, limit = 1048576) {
  const text = typeof bytes === "string" ? bytes : bytes.toString("utf8");
  if (text.includes("\ufffd") || encodedBytes(text) > limit) portableFail("GIT_PREFLIGHT_OUTPUT_INVALID");
  return text;
}

function portableKeys(raw) {
  const text = portableText(raw);
  if (text && !text.endsWith("\n")) portableFail("GIT_CONFIG_KEYS_INVALID");
  let extension = 0;
  for (const key of text ? text.slice(0, -1).split("\n") : []) {
    if (!key || /[\u0000-\u001f\u007f]/.test(key)) portableFail("GIT_CONFIG_KEYS_INVALID");
    const lower = key.toLowerCase();
    if (lower === "include.path" || (lower.startsWith("includeif.") && lower.endsWith(".path"))) portableFail("BLOCKED_PORTABLE_CONFIG_INCLUDE_PRESENT");
    if (/^filter\..*\.(clean|smudge|process)$/.test(lower) || /^diff\..*\.(command|textconv)$/.test(lower)) portableFail("BLOCKED_PORTABLE_EXTERNAL_DRIVER_PRESENT");
    if (lower === "extensions.worktreeconfig") extension++;
  }
  if (extension > 1) portableFail("GIT_CONFIG_WORKTREE_BOOL_INVALID");
  return extension === 1;
}

function portableStage(raw) {
  const text = portableText(raw);
  if (text && !text.endsWith("\0")) portableFail("GIT_INDEX_STAGE_INVALID");
  const rows = [], seen = new Set();
  for (const record of text ? text.slice(0, -1).split("\0") : []) {
    const match = /^(100644|100755|120000|160000) ([0-9a-f]{40}|[0-9a-f]{64}) (0|[1-9][0-9]{0,15})\t([^\0]+)$/.exec(record);
    if (!match || !portablePath(match[4]) || !Number.isSafeInteger(Number(match[3])) || seen.has(match[4])) portableFail("GIT_INDEX_STAGE_INVALID");
    if (match[3] !== "0") portableFail("GIT_INDEX_UNMERGED");
    if (match[1] === "160000") portableFail("BLOCKED_PORTABLE_GITLINK_PRESENT");
    if (portableSensitive(match[4])) portableFail("GIT_SENSITIVE_PATH_PRESENT");
    seen.add(match[4]); rows.push({ path: match[4], mode: match[1], stage: 0 });
    if (rows.length > 32768) portableFail("GIT_INDEX_STAGE_INVALID");
  }
  return rows;
}

function portableAttributes(raw) {
  for (const line of portableText(raw, 65536).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2 || tokens[0].startsWith("[attr]") || tokens[0].startsWith("!") || /["\\]/.test(tokens[0])) portableFail("GIT_ATTRIBUTES_UNADMITTED");
    for (const attribute of tokens.slice(1)) {
      if (!["text", "-text", "!text", "text=auto", "eol=lf", "eol=crlf", "binary", "diff", "-diff", "!diff"].includes(attribute)) portableFail("GIT_ATTRIBUTES_UNADMITTED");
    }
  }
}

export function staticBrokerOperation(args) {
  if (!Array.isArray(args) || args.some((value) => typeof value !== "string")) brokerFailure();
  const fixed = {"STATIC_CONFIG_LOCAL_NAMES":["config","--local","--no-includes","--name-only","--list"],"STATIC_CONFIG_WORKTREE_BOOL":["config","--local","--no-includes","--type=bool","--get","extensions.worktreeConfig"],"STATIC_CONFIG_WORKTREE_NAMES":["config","--worktree","--no-includes","--name-only","--list"],"STATIC_INDEX_STAGE":["ls-files","--stage","-z"],"STATIC_LS_FILES":["ls-files","-z"],"STATIC_STATUS":["status","--porcelain=v1","-z","--untracked-files=all"],"STATIC_DIFF":["diff","--binary","--no-ext-diff","HEAD","--"]};
  for (const [family, operation] of Object.entries(fixed)) {
    if (args.length === operation.length && operation.every((value, index) => args[index] === value)) return { family, params: {} };
  }
  portableFamily(args);
  if (args.length === 3 && args[0] === "hash-object" && args[1] === "--") return { family: "STATIC_HASH_OBJECT", params: { path: args[2] } };
  brokerFailure();
}

function portableGitContext(args, consume) {
  portableFamily(args);
  if (args[0] === "hash-object") assertRegularFile(args[2], null);
  const platform = process.platform;
  if (platform !== "darwin" && platform !== "linux") portableFail("GIT_PLATFORM_UNSUPPORTED");
  const binary = platform === "darwin" ? "/Library/Developer/CommandLineTools/usr/bin/git" : "/usr/bin/git";
  const backend = portableRead(binary, 67108864, true);
  const sandbox = platform === "darwin" ? portableRead("/usr/bin/sandbox-exec", 1048576, true) : null;
  const snapshots = new Map();
  function record(absolute, info) {
    if (info && (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory()))) portableFail();
    const identity = info ? portableMetadata(info) : null;
    const existing = snapshots.get(absolute);
    if (snapshots.has(absolute) && (existing === null ? identity !== null : identity === null || !portableSame(existing, identity))) portableFail("GIT_SURFACE_CHANGED");
    snapshots.set(absolute, identity);
    return info;
  }
  function observe(absolute, optional = false) {
    portableParents(absolute, false, record, optional);
    return record(absolute, portableInfo(absolute, optional));
  }
  function control(absolute) {
    observe(absolute);
    return portableText(portableRead(absolute, 4096).bytes, 4096).trim();
  }
  let gitDir = null, commonDir = null;
  let temporaryRoot = null, tempIdentity = null, primaryFailure = null, env;
  const profile = '(version 1)\n(allow default)\n(deny network*)\n(deny file-write*)\n(allow file-write* (literal "/dev/null"))\n(deny process-fork)\n(deny process-exec)\n(allow process-exec (literal "/Library/Developer/CommandLineTools/usr/bin/git"))\n';
  function stable() {
    for (const [absolute, identity] of snapshots) {
      const current = portableInfo(absolute, true);
      if (identity === null ? current !== null : current === null || !portableSame(identity, portableMetadata(current))) portableFail("GIT_SURFACE_CHANGED");
    }
    for (const [absolute, identity] of [[binary, backend.identity], ...(sandbox ? [["/usr/bin/sandbox-exec", sandbox.identity]] : [])]) {
      if (!portableSame(identity, portableMetadata(portableInfo(absolute)))) portableFail("GIT_BACKEND_CHANGED");
    }
    for (const [absolute, identity] of [...backend.parents, ...(sandbox ? sandbox.parents : [])]) {
      if (!portableSame(identity, portableMetadata(portableInfo(absolute)))) portableFail("GIT_SURFACE_CHANGED");
    }
  }
  function execute(operation, postflight = true) {
    stable();
    const gitArgv = [...portableCommonControls, `--git-dir=${gitDir}`, `--work-tree=${repositoryRoot}`, ...operation];
    let result;
    if (brokerMode()) {
      const selected = staticBrokerOperation(operation);
      const received = brokerRequest(selected.family, selected.params, {
        repository_root: repositoryRoot, git_dir: gitDir,
        object_directory: null, work_tree_root: null,
      });
      result = { ...received, stdout: received.stdout.toString("utf8"), stderr: received.stderr.toString("utf8") };
    } else {
      result = spawnSync(platform === "darwin" ? "/usr/bin/sandbox-exec" : binary,
      platform === "darwin" ? ["-p", profile, binary, ...gitArgv] : gitArgv,
      { cwd: repositoryRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: false, killSignal: "SIGKILL", timeout: 10000, maxBuffer: 33554432 });
    }
    if (postflight) stable();
    return result;
  }
  function preflight(operation) {
    const result = execute(operation);
    if (result.error || result.signal || result.status !== 0 || result.stderr !== "" || typeof result.stdout !== "string") portableFail("GIT_PREFLIGHT_FAILED");
    return portableText(result.stdout);
  }
  try {
  temporaryRoot = mkdtempSync((platform === "darwin" ? "/private/tmp/" : "/tmp/") + "aifinder-static-git-");
  const tempInfo = portableInfo(temporaryRoot);
  tempIdentity = portableMetadata(tempInfo);
  if (!tempInfo.isDirectory() || Number(tempInfo.uid) !== process.getuid() || (Number(tempInfo.mode) & 0o777) !== 0o700) portableFail("GIT_PRIVATE_TEMP_INVALID");
  env = {
    PATH: "/usr/bin:/bin", HOME: temporaryRoot, TMPDIR: temporaryRoot, LANG: "C", LC_ALL: "C",
    GIT_CONFIG_SYSTEM: "/dev/null", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "/usr/bin/false", SSH_ASKPASS: "/usr/bin/false", GIT_OPTIONAL_LOCKS: "0", GIT_ATTR_NOSYSTEM: "1", GIT_NO_LAZY_FETCH: "true", GIT_TRACE2: "0", GIT_TRACE2_PERF: "0", GIT_TRACE2_EVENT: "0",
  };
  const dotGit = path.join(repositoryRoot, ".git");
  const dotInfo = observe(dotGit);
  gitDir = dotGit;
  if (dotInfo.isFile()) {
    const match = /^gitdir: ([^\r\n\0]+)$/.exec(control(dotGit));
    if (!match) portableFail("GIT_ADMIN_LAYOUT_INVALID");
    gitDir = path.resolve(repositoryRoot, match[1]);
  } else if (!dotInfo.isDirectory()) portableFail("GIT_ADMIN_LAYOUT_INVALID");
  if (!observe(gitDir).isDirectory()) portableFail("GIT_ADMIN_LAYOUT_INVALID");
  commonDir = gitDir;
  const commonPath = path.join(gitDir, "commondir");
  if (observe(commonPath, true)) {
    const relative = control(commonPath);
    if (!relative || /[\r\n\0]/.test(relative)) portableFail("GIT_ADMIN_LAYOUT_INVALID");
    commonDir = path.resolve(gitDir, relative);
    if (!observe(commonDir).isDirectory()) portableFail("GIT_ADMIN_LAYOUT_INVALID");
  }
  observe(path.join(gitDir, "HEAD"));
  observe(path.join(gitDir, "index"));
  observe(path.join(commonDir, "config"));
  const infoDirectory = path.join(commonDir, "info");
  if (portableInfo(infoDirectory, true)) {
    if (!observe(infoDirectory).isDirectory()) portableFail();
    if (observe(path.join(infoDirectory, "attributes"), true)) portableFail("GIT_INFO_ATTRIBUTES_PRESENT_UNADMITTED");
  } else snapshots.set(infoDirectory, null);
    if (portableKeys(preflight(["config", "--local", "--no-includes", "--name-only", "--list"]))) {
      const enabled = preflight(["config", "--local", "--no-includes", "--type=bool", "--get", "extensions.worktreeConfig"]);
      if (enabled !== "true\n" && enabled !== "false\n") portableFail("GIT_CONFIG_WORKTREE_BOOL_INVALID");
      if (enabled === "true\n") {
        observe(path.join(gitDir, "config.worktree"));
        portableKeys(preflight(["config", "--worktree", "--no-includes", "--name-only", "--list"]));
      }
    }
    const rows = portableStage(preflight(["ls-files", "--stage", "-z"]));
    const attributes = new Set(rows.filter((row) => path.basename(row.path) === ".gitattributes").map((row) => row.path));
    const ancestors = new Set([".gitattributes"]);
    for (const operand of [...rows.map((row) => row.path), ...(args[0] === "hash-object" ? [args[2]] : [])]) {
      let parent = path.posix.dirname(operand);
      while (parent !== ".") { ancestors.add(`${parent}/.gitattributes`); parent = path.posix.dirname(parent); }
    }
    let attributeBytes = 0;
    for (const relative of ancestors) {
      const absolute = path.join(repositoryRoot, relative);
      if (attributes.has(relative)) {
        const info = observe(absolute);
        attributeBytes += Number(info.size);
        if (!Number.isSafeInteger(attributeBytes) || attributeBytes > 1048576) portableFail("GIT_ATTRIBUTES_TOTAL_OVERFLOW");
        portableAttributes(portableRead(absolute, 65536).bytes);
      } else if (observe(absolute, true)) portableFail("GIT_UNTRACKED_ATTRIBUTES_PRESENT_UNADMITTED");
    }
    let consumerFailure = null;
    try {
      return consume(() => execute(args, false));
    } catch (error) {
      consumerFailure = error;
      throw error;
    } finally {
      try { stable(); }
      catch (error) {
        if (consumerFailure instanceof GovernanceError) {
          consumerFailure.surface_stage = error instanceof GovernanceError ? error.stage : "GIT_SURFACE_CHANGED";
        } else throw error;
      }
    }
  } catch (error) {
    primaryFailure = error instanceof GovernanceError ? error : new GovernanceError("READ_ONLY_GIT_FAILED");
    throw primaryFailure;
  } finally {
    let cleanupStage = null, changed = false;
    if (temporaryRoot !== null) {
      let current = null;
      try { current = portableInfo(temporaryRoot, true); } catch { cleanupStage = "GIT_PRIVATE_TEMP_CHANGED"; }
      const owned = current && tempIdentity && current.isDirectory() && !current.isSymbolicLink() &&
        String(current.dev) === tempIdentity[0] && String(current.ino) === tempIdentity[1] &&
        Number(current.uid) === process.getuid() && String(current.uid) === tempIdentity[3];
      if (owned) {
        changed = !portableSame(tempIdentity, portableMetadata(current));
        try { rmdirSync(temporaryRoot); } catch { cleanupStage = "GIT_PRIVATE_TEMP_CLEANUP_FAILED"; }
      } else cleanupStage = "GIT_PRIVATE_TEMP_CHANGED";
    }
    if (cleanupStage || changed) {
      const stage = cleanupStage || "GIT_PRIVATE_TEMP_CHANGED";
      if (primaryFailure) primaryFailure.cleanup_stage = stage;
      else {
        throw new GovernanceError(stage);
      }
    }
  }
}

export function gitOutput(args) {
  return portableGitContext(args, (execute) => {
    const result = execute();
    if (result.error || result.signal || result.status !== 0 || result.stderr !== "" || typeof result.stdout !== "string") portableFail("READ_ONLY_GIT_FAILED");
    return result.stdout;
  });
}


export function repositoryPathUnion(authorizedUntracked = []) {
  const tracked = gitOutput(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
  const status = gitOutput([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  const untracked = status
    .split("\0")
    .filter(Boolean)
    .filter((entry) => entry.startsWith("?? "))
    .map((entry) => entry.slice(3));
  const comparison = compareExactPathSets(untracked, authorizedUntracked);
  if (!comparison.equal) {
    throw new GovernanceError("UNTRACKED_SCOPE_MISMATCH");
  }
  return stableSortedPaths([...new Set([...tracked, ...untracked])]);
}

export function repositoryStateDigest() {
  const trackedDiff = gitOutput(["diff", "--binary", "--no-ext-diff", "HEAD", "--"]);
  const status = gitOutput([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  const untracked = status
    .split("\0")
    .filter(Boolean)
    .filter((entry) => entry.startsWith("?? "))
    .map((entry) => entry.slice(3))
    .sort((left, right) => left.localeCompare(right, "en"));
  const untrackedRows = untracked.map((repositoryPath) => {
    const identity = fileIdentity(repositoryPath);
    return [
      identity.path,
      identity.sha256,
      identity.bytes,
      identity.mode,
    ].join("\0");
  });
  return sha256(
    ["TRACKED_DIFF", trackedDiff, "UNTRACKED", ...untrackedRows].join("\0"),
  );
}

export function parseTypeScriptFile(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath);
  const source = readFileSync(absolute, "utf8");
  const kind =
    repositoryPath.endsWith(".tsx") || repositoryPath.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : repositoryPath.endsWith(".mjs") || repositoryPath.endsWith(".js")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    repositoryPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new GovernanceError("TYPESCRIPT_PARSE_DIAGNOSTIC");
  }
  return { source, sourceFile };
}

export function walkExecutableNodes(sourceFile, visitor) {
  function visit(node) {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      return;
    }
    visitor(node);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function localSpecifiers(sourceFile) {
  const specifiers = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === "require") ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers.filter(
    (specifier) => specifier.startsWith("./") || specifier.startsWith("../"),
  );
}

export function resolveLocalImport(fromRepositoryPath, specifier) {
  const fromAbsolute = resolveRepositoryPath(fromRepositoryPath);
  const base = path.resolve(path.dirname(fromAbsolute), specifier);
  toRepositoryPath(base);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map(
      (extension) => `${base}${extension}`,
    ),
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map(
      (extension) => path.join(base, `index${extension}`),
    ),
  ];
  for (const candidate of candidates) {
    try {
      const info = lstatSync(candidate);
      if (info.isSymbolicLink()) {
        throw new GovernanceError("SYMLINK_REJECTED");
      }
      if (info.isFile()) return toRepositoryPath(candidate);
    } catch (caught) {
      if (caught instanceof GovernanceError) throw caught;
    }
  }
  throw new GovernanceError("LOCAL_IMPORT_UNRESOLVED");
}

export function collectLocalImportGraph(entryRepositoryPath) {
  const visited = new Set();
  const pending = [entryRepositoryPath];
  while (pending.length > 0) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const { sourceFile } = parseTypeScriptFile(current);
    for (const specifier of localSpecifiers(sourceFile)) {
      const resolved = resolveLocalImport(current, specifier);
      if (!visited.has(resolved)) pending.push(resolved);
    }
  }
  return stableSortedPaths([...visited]);
}

const FORBIDDEN_IMPORTS = new Set([
  "node:http",
  "http",
  "node:http2",
  "http2",
  "node:https",
  "https",
  "node:net",
  "net",
  "node:tls",
  "tls",
  "node:dns",
  "dns",
  "node:dns/promises",
  "dns/promises",
  "node:dgram",
  "dgram",
  "node:child_process",
  "child_process",
  "next",
  "next/server",
  "@supabase/supabase-js",
  "@playwright/test",
  "playwright",
  "undici",
]);
const FORBIDDEN_CALLS = new Set([
  "fetch",
  "WebSocket",
  "EventSource",
  "spawn",
  "spawnSync",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "fork",
  "eval",
  "Function",
  "createRequire",
  "getBuiltinModule",
]);
const FORBIDDEN_FS_METHODS = new Set([
  "writeFile",
  "writeFileSync",
  "write",
  "writeSync",
  "writev",
  "writevSync",
  "appendFile",
  "appendFileSync",
  "copyFile",
  "copyFileSync",
  "cp",
  "cpSync",
  "rename",
  "renameSync",
  "rm",
  "rmSync",
  "rmdir",
  "rmdirSync",
  "unlink",
  "unlinkSync",
  "chmod",
  "chmodSync",
  "chown",
  "chownSync",
  "truncate",
  "truncateSync",
  "symlink",
  "symlinkSync",
  "link",
  "linkSync",
  "mkdir",
  "mkdirSync",
  "mkdtemp",
  "mkdtempSync",
  "createWriteStream",
]);
const APPROVED_ADDITIONAL_SOURCE_ROOTS = new Map([
  [
    "testing/public-persistence.test.mjs",
    ["lib/public-persistence.ts"],
  ],
]);

const PORTABLE_DIGEST_SELF_TEST_ENTRY =
  "testing/authenticated-browser-security-static-assertions.mjs";
const PORTABLE_DIGEST_SELF_TEST_FUNCTION =
  "runPortableTestingTreeDigestSelfTest";

function enclosingFunctionDeclaration(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current)) return current;
    current = current.parent;
  }
  return null;
}

function exactPortableDigestSelfTestDispatch(sourceFile) {
  let modeBinding = false;
  let guardedCall = false;
  let selfTestCallCount = 0;
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "portableTestingTreeArgumentModeResult" &&
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer) &&
          ts.isIdentifier(declaration.initializer.expression) &&
          declaration.initializer.expression.text ===
            "portableTestingTreeArgumentMode" &&
          declaration.initializer.arguments.length === 1 &&
          declaration.initializer.arguments[0].getText(sourceFile) ===
            "process.argv.slice(2)"
        ) {
          modeBinding = true;
        }
      }
    }
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === PORTABLE_DIGEST_SELF_TEST_FUNCTION
    ) {
      selfTestCallCount += 1;
      let current = node.parent;
      while (current && current.parent) {
        if (
          ts.isIfStatement(current) &&
          current.thenStatement.pos <= node.pos &&
          node.end <= current.thenStatement.end &&
          current.expression.getText(sourceFile) ===
            'portableTestingTreeArgumentModeResult === "SELF_TEST"'
        ) {
          guardedCall = true;
          break;
        }
        current = current.parent;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return modeBinding && guardedCall && selfTestCallCount === 1;
}

function approvedPortableDigestSelfTestMutation({
  entryRepositoryPath,
  repositoryPath,
  sourceFile,
  node,
}) {
  const owner = enclosingFunctionDeclaration(node);
  return (
    entryRepositoryPath === PORTABLE_DIGEST_SELF_TEST_ENTRY &&
    repositoryPath === PORTABLE_DIGEST_SELF_TEST_ENTRY &&
    owner?.name?.text === PORTABLE_DIGEST_SELF_TEST_FUNCTION &&
    exactPortableDigestSelfTestDispatch(sourceFile)
  );
}

function hasApprovedDataModuleUrl(sourceFile) {
  let approved = false;
  function visit(node) {
    if (ts.isVariableDeclarationList(node)) {
      for (const declaration of node.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "moduleUrl" &&
          declaration.initializer &&
          ((ts.isTemplateExpression(declaration.initializer) &&
            declaration.initializer.head.text ===
              "data:text/javascript;base64,") ||
            (ts.isNoSubstitutionTemplateLiteral(declaration.initializer) &&
              declaration.initializer.text.startsWith(
                "data:text/javascript;base64,",
              )))
        ) {
          approved = true;
        }
      }
    }
    if (!approved) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return approved;
}

export function executableSafetyViolations(entryRepositoryPath) {
  const violations = [];
  const sourcePaths = new Set(collectLocalImportGraph(entryRepositoryPath));
  for (const additionalRoot of
    APPROVED_ADDITIONAL_SOURCE_ROOTS.get(entryRepositoryPath) ?? []) {
    for (const repositoryPath of collectLocalImportGraph(additionalRoot)) {
      sourcePaths.add(repositoryPath);
    }
  }
  for (const repositoryPath of stableSortedPaths([...sourcePaths])) {
    const { sourceFile } = parseTypeScriptFile(repositoryPath);
    const filesystemNamespaces = new Set();
    const filesystemMutationBindings = new Set();
    for (const statement of sourceFile.statements) {
      if (
        (ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        FORBIDDEN_IMPORTS.has(statement.moduleSpecifier.text)
      ) {
        violations.push("FORBIDDEN_IMPORT");
      }
      if (
        ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        ["node:fs", "fs"].includes(statement.moduleSpecifier.text) &&
        statement.importClause
      ) {
        if (statement.importClause.name) {
          filesystemNamespaces.add(statement.importClause.name.text);
        }
        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
          filesystemNamespaces.add(bindings.name.text);
        } else if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            const imported = element.propertyName?.text ?? element.name.text;
            if (FORBIDDEN_FS_METHODS.has(imported)) {
              filesystemMutationBindings.add(element.name.text);
            }
          }
        }
      }
    }
    walkExecutableNodes(sourceFile, (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "process" &&
        node.name.text === "env"
      ) {
        violations.push("ENVIRONMENT_ACCESS");
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression;
        const name = ts.isIdentifier(expression)
          ? expression.text
          : ts.isPropertyAccessExpression(expression)
            ? expression.name.text
            : ts.isElementAccessExpression(expression) &&
                expression.argumentExpression &&
                ts.isStringLiteralLike(expression.argumentExpression)
              ? expression.argumentExpression.text
            : "";
        if (FORBIDDEN_CALLS.has(name)) {
          violations.push(`FORBIDDEN_CALL_${name}`);
        }
        if (
          (ts.isIdentifier(expression) &&
            filesystemMutationBindings.has(expression.text)) ||
          (ts.isPropertyAccessExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            filesystemNamespaces.has(expression.expression.text) &&
            FORBIDDEN_FS_METHODS.has(expression.name.text)) ||
          (ts.isElementAccessExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            filesystemNamespaces.has(expression.expression.text) &&
              expression.argumentExpression &&
              ts.isStringLiteralLike(expression.argumentExpression) &&
              FORBIDDEN_FS_METHODS.has(expression.argumentExpression.text))
        ) {
          if (
            !approvedPortableDigestSelfTestMutation({
              entryRepositoryPath,
              repositoryPath,
              sourceFile,
              node,
            })
          ) {
            violations.push("FILESYSTEM_MUTATION_CALL");
          }
        }
        if (
          ts.isCallExpression(node) &&
          (expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(expression) && expression.text === "require"))
        ) {
          const specifier = node.arguments[0];
          const approvedDataImport =
            repositoryPath === "testing/public-persistence.test.mjs" &&
            specifier &&
            ts.isIdentifier(specifier) &&
            specifier.text === "moduleUrl" &&
            hasApprovedDataModuleUrl(sourceFile);
          if (
            (!specifier || !ts.isStringLiteralLike(specifier)) &&
            !approvedDataImport
          ) {
            violations.push("DYNAMIC_MODULE_SPECIFIER");
          } else if (FORBIDDEN_IMPORTS.has(specifier.text)) {
            violations.push("FORBIDDEN_DYNAMIC_IMPORT");
          }
        }
      }
      if (
        ts.isElementAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "process" &&
        node.argumentExpression &&
        ts.isStringLiteralLike(node.argumentExpression) &&
        node.argumentExpression.text === "env"
      ) {
        violations.push("ENVIRONMENT_ACCESS");
      }
    });
  }
  return [...new Set(violations)].sort();
}

export function testingTreeDigest(manifestPath) {
  const rows = listRegularFiles("testing")
    .filter((repositoryPath) => repositoryPath !== manifestPath)
    .map((repositoryPath) => {
      const identity = fileIdentity(repositoryPath);
      return testingTreeIdentityRow(identity);
    });
  return sha256(rows.join("\n"));
}

export const APP_SURFACE_NAMES = new Set([
  "page",
  "layout",
  "template",
  "default",
  "route",
  "error",
  "global-error",
  "loading",
  "not-found",
  "robots",
  "sitemap",
  "manifest",
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
]);

export function appSurfaceInventory() {
  return listRegularFiles("app").filter((repositoryPath) => {
    const extension = path.extname(repositoryPath);
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extension)) {
      return false;
    }
    return APP_SURFACE_NAMES.has(path.basename(repositoryPath, extension));
  });
}


const hashCaptureBrand = new WeakSet();
const HASH_LIMIT = 33554432;
const hashSignals = new Set(["SIGTERM", "SIGKILL", "SIGABRT", "SIGSEGV", "SIGINT", "SIGPIPE"]);
const hashCodes = new Set(["EACCES", "EPERM", "ENOENT", "ENOBUFS", "ETIMEDOUT", "EIO"]);
const hashCaps = new Set(["API_RETURN_ONLY", "PARTIAL", "TRUNCATED", "OVERFLOW", "SHUTDOWN_UNCONFIRMED"]);
const hashOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function hashFailure(stage = "READ_ONLY_GIT_FAILED") { return new GovernanceError(stage); }
function cloneHashData(value) { return JSON.parse(JSON.stringify(value)); }
function freezeHashData(value) {
  if (value && typeof value === "object") { for (const v of Object.values(value)) freezeHashData(v); Object.freeze(value); }
  return value;
}
function hashResult(result, thrown, slot, plan, origin) {
  const reasons = [];
  const record = result !== null && typeof result === "object" && !Array.isArray(result) ? result : {};
  if (record !== result) reasons.push("RESULT_INVALID");
  const status = record.status;
  const statusValid = Number.isSafeInteger(status);
  if (!statusValid) reasons.push("STATUS_INVALID"); else if (status !== 0) reasons.push("STATUS_NONZERO");
  let signal = null;
  if (!hashOwn(record, "signal")) { reasons.push("SIGNAL_MISSING"); signal = "UNKNOWN"; }
  else if (record.signal !== null) { reasons.push("SIGNAL_PRESENT"); signal = hashSignals.has(record.signal) ? record.signal : "UNKNOWN"; }
  const pidValid = Number.isSafeInteger(record.pid) && record.pid > 0;
  if (!pidValid) reasons.push("PID_INVALID");
  const hasError = thrown || (hashOwn(record, "error") && record.error !== null);
  if (hasError) reasons.unshift(thrown ? "API_THROWN" : "API_ERROR");
  const error = hasError ? (hashCodes.has(record.error?.code) ? record.error.code : "OTHER") : null;
  function stream(name) {
    if (!hashOwn(record, name)) { reasons.push("STREAM_INVALID"); return ["ABSENT", null, "UNKNOWN", "UNKNOWN"]; }
    const value = record[name];
    if (typeof value !== "string") { reasons.push("STREAM_INVALID"); return [value === null ? "NULL" : "WRONG_TYPE", null, "UNKNOWN", "UNKNOWN"]; }
    let bytes;
    try { bytes = encodedBytes(value); } catch { reasons.push("ENCODING_UNCERTAIN"); return ["TEXT", null, "WITHHELD", "UNENCODABLE"]; }
    if (value.includes("\ufffd")) reasons.push("ENCODING_UNCERTAIN");
    if (bytes > HASH_LIMIT) reasons.push("CAPTURE_OVERFLOW");
    return ["TEXT", bytes, value === "" ? "EMPTY" : "WITHHELD", "TEXT_REENCODED_UTF8"];
  }
  const out = stream("stdout"), err = stream("stderr");
  let capture = hashOwn(record, "capture") ? record.capture : "API_RETURN_ONLY";
  if (!hashCaps.has(capture)) { reasons.push("CAPTURE_INVALID"); capture = "UNKNOWN"; }
  else if (capture !== "API_RETURN_ONLY") reasons.push("CAPTURE_" + capture);
  const empty = typeof record.stderr === "string" && record.stderr === "";
  if (typeof record.stderr === "string" && !empty) reasons.push("STDERR_NONEMPTY");
  let diag = empty ? "NONE" : "WITHHELD";
  if (typeof record.stderr === "string" && /^warning: unable to access '[^\r\n]*': Permission denied\n?$/.test(record.stderr)) diag = "PUBLIC_PERMISSION_WARNING";
  const blob = typeof record.stdout === "string" && /^[0-9a-f]{40}$/.test(record.stdout.trim());
  if (!blob) reasons.push("BLOB_INVALID");
  const unique = [...new Set(reasons)];
  const stage = unique.some((r) => r !== "BLOB_INVALID") ? "READ_ONLY_GIT_FAILED" : blob ? null : "GIT_BLOB_IDENTITY_INVALID";
  const row = { o: slot.ordinal, op: "HASH_OBJECT", role: slot.role, plan,
    status: statusValid ? status : null, signal, pid: [pidValid ? record.pid : null, origin],
    out, err, error, capture, diag, reasons: unique, clean: stage === null, lifecycle: "UNPROVEN", origin };
  if (encodedBytes(JSON.stringify(row)) > 768) throw hashFailure();
  return { row, stage, value: stage === null ? "git:" + record.stdout.trim() : null };
}
export function isHashCapture(value) { return value !== null && typeof value === "object" && hashCaptureBrand.has(value); }
export function createHashCapture(trustedPlan, trustedBindings, requiredSink) {
  if (!trustedBindings || !validateTrustedPlan(trustedPlan, trustedBindings.expectedPlan) ||
      !["SYNTHETIC", "NATIVE_API"].includes(trustedBindings.origin) ||
      !trustedBindings.binding || typeof trustedBindings.binding !== "object" || Array.isArray(trustedBindings.binding) ||
      !Object.keys(trustedBindings.binding).length || Object.values(trustedBindings.binding).some((v) => typeof v !== "string" || !v) ||
      !requiredSink || typeof requiredSink.put !== "function" || !Array.isArray(requiredSink.rows) || requiredSink.rows.length !== 0) throw hashFailure();
  const plan = freezeHashData(cloneHashData(trustedPlan));
  const binding = freezeHashData(cloneHashData(trustedBindings.binding));
  const origin = trustedBindings.origin, rows = [];
  let acknowledged = 0, failure = null, precall = null, busy = false, sealed = false;
  function envelope() {
    const complete = failure === null && rows.length === plan.slots.length && acknowledged === rows.length;
    return { v: 2, binding: cloneHashData(binding), origin, plan: plan.id, plan_kind: plan.kind,
      rows: cloneHashData(rows), attempted: rows.length, expected: plan.slots.length, acknowledged,
      complete, failure: complete ? null : failure || "INCOMPLETE", precall: cloneHashData(precall),
      native: origin === "NATIVE_API", ready: false };
  }
  const capture = {
    captureHash(operand, thunk, requestedRole, requestedOrdinal) {
      if (failure || sealed || busy) throw hashFailure();
      const index = rows.length, slot = plan.slots[index];
      const role = requestedRole === undefined ? slot?.role : requestedRole;
      const ordinal = requestedOrdinal === undefined ? index + 1 : requestedOrdinal;
      let rejection = !slot ? "PLAN_EXHAUSTED" :
        role !== slot.role || ordinal !== slot.ordinal ? "ROLE_MISMATCH" :
        typeof operand !== "string" ? "OPERAND_TYPE" : operand !== slot.operand ? "OPERAND_MISMATCH" : null;
      if (rejection) {
        failure = "BINDING_FAILED"; precall = { kind: "PRECALL_REJECTED", ordinal: index + 1, reason: rejection };
        throw hashFailure();
      }
      if (typeof thunk !== "function") { failure = "BINDING_FAILED"; precall = { kind: "PRECALL_REJECTED", ordinal: index + 1, reason: "ROLE_MISMATCH" }; throw hashFailure(); }
      busy = true;
      let result, thrown = false, classified;
      try { result = thunk(); } catch (error) { result = { error }; thrown = true; }
      try { classified = hashResult(result, thrown, slot, plan.id, origin); }
      catch { classified = hashResult({ error: { code: "OTHER" } }, true, slot, plan.id, origin); }
      // Retain only the sanitized projection before invoking the sink.
      rows.push(freezeHashData(classified.row));
      if (classified.stage) failure = "RESULT_REJECTED";
      try {
        const receipt = freezeHashData(cloneHashData(classified.row));
        const ack = requiredSink.put(receipt);
        if (ack !== true || (Array.isArray(requiredSink.rows) && JSON.stringify(requiredSink.rows) !== JSON.stringify(rows))) throw hashFailure();
        acknowledged++;
      } catch { failure = "SINK_FAILED"; busy = false; throw hashFailure(); }
      busy = false;
      if (classified.stage) throw hashFailure(classified.stage);
      return classified.value;
    },
    snapshot() { return freezeHashData(envelope()); },
    finishFrame() {
      if (sealed || busy) throw hashFailure();
      sealed = true;
      let serialized;
      try { serialized = JSON.stringify(envelope()); if (encodedBytes(serialized) > 114688) throw hashFailure(); }
      catch { failure = "SINK_FAILED"; throw hashFailure(); }
      return "C08_CHILD_RECEIPTS_V2 " + serialized;
    },
  };
  Object.freeze(capture); hashCaptureBrand.add(capture); return capture;
}

export function worktreeGitIdentity(repositoryPath, capture) {
  const args = ["hash-object", "--", repositoryPath];
  portableFamily(args);
  assertRegularFile(repositoryPath, null);
  if (!isHashCapture(capture)) throw new GovernanceError("READ_ONLY_GIT_FAILED");
  return portableGitContext(args, (execute) => capture.captureHash(repositoryPath, execute));
}

export function appSurfaceDigest(capture) {
  const rows = appSurfaceInventory().map((repositoryPath) =>
    [repositoryPath, worktreeGitIdentity(repositoryPath, capture)].join("\0"),
  );
  return sha256(rows.join("\n"));
}

export function categoricalFailure(stage) {
  const normalized =
    typeof stage === "string" && /^[A-Z0-9_]+$/.test(stage)
      ? stage
      : "INTERNAL_TEST_FAILURE";
  console.log(`EXPECTED_FAIL_${normalized}`);
}
