import * as brokerNativeFs from "node:fs";
import { spawnSync } from "node:child_process";
import {
  readFileSync,
  lstatSync,
  realpathSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  ACTIVATION_REVIEW_SHA256,
  recoverQualification,
  runQualification,
} from "./activation-bridge.mjs";
import {
  createConcreteQualificationBundle,
  loadConcreteLiveCredentials,
} from "./nonproduction-qualification-adapters.mjs";
import {
  readConcreteCredentialEnvironment,
  resolveConcreteCredentialEnvironment,
} from "./nonproduction-qualification-credential-loader.mjs";
import { createConcreteCheckpointStore } from "./nonproduction-qualification-checkpoint-store.mjs";
import {
  createConcreteLivePlatform,
  createConcreteLiveTransport,
} from "./nonproduction-qualification-live-platform.mjs";
import {
  assertLegacyFreezePolicy,
  classifyLegacySnapshot,
  loadCurrentLegacySnapshot,
} from "./legacy-classifier.mjs";
import {
  deriveIdentityReport,
  readStrictJsonFile,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";
import {
  CONCRETE_CREDENTIAL_SOURCE_POLICY,
  CONCRETE_RETAINED_IDENTITY_SHA256,
  CONCRETE_SUPPORT_PATHS,
  validateConcreteAuthorizationRecord,
} from "./nonproduction-qualification-authorization.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1,
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  validateAdminV1OfficialAuthorization,
  createAdminV1OfficialJournal,
  classifyAdminV1OfficialRecoveryState,
  readAdminV1OfficialIsolatedBundle,
  readAdminV1OfficialRecoveryFile,
  validateAdminV1OfficialRetentionRecoveryRecord,
} from "./admin-v1-official-runtime.mjs";
import {
  loadAdminV1OfficialCredentials,
  createAdminV1OfficialConcreteTransport,
  runConcreteAdminV1OfficialRuntime,
  recoverConcreteAdminV1OfficialRetention,
} from "./admin-v1-official-live-platform.mjs";
import {
  OFFICIAL_PREVIEW_ENVIRONMENT_KEYS,
  validateOfficialIsolationAuthorization,
} from "./admin-v1-official-isolation.mjs";

// BEGIN A20_FIXED_FD_BROKER_CLIENT

const BROKER_REQUEST_LIMIT = 16 * 1024;
const BROKER_RESPONSE_LIMIT = 8 * 1024 * 1024;
const BROKER_STREAM_LIMIT = 4 * 1024 * 1024;
const BROKER_DEADLINE_MS = 25_000;
const brokerPauseWord = new Int32Array(new SharedArrayBuffer(4));
const brokerPoisonedTransports = new WeakSet();
const brokerDescriptorHandles = new Map();
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

function brokerNativeNonblocking(fd) {
  if (fd !== 3 && fd !== 4) brokerFailure();
  let handle = brokerDescriptorHandles.get(fd);
  if (handle === undefined) {
    // Fixed inherited FIFOs only: no connect, listen, readStart, or process helper.
    const binding = process.binding("pipe_wrap");
    handle = new binding.Pipe(binding.constants.SOCKET);
    if (handle.open(fd) !== 0) brokerFailure();
    brokerDescriptorHandles.set(fd, handle);
  }
  if (handle.fd !== fd || handle.setBlocking(false) !== 0) brokerFailure();
}

export function brokerDescriptors(env = process.env ?? {}, fs = brokerNativeFs, nonblocking = brokerNativeNonblocking) {
  if (!brokerMode(env)) return null;
  if (env.AIFINDER_GIT_BROKER_REQUEST_FD !== "3" || env.AIFINDER_GIT_BROKER_RESPONSE_FD !== "4") brokerFailure();
  if (fs === brokerNativeFs && nonblocking !== brokerNativeNonblocking) brokerFailure();
  try {
    const before = [fs.fstatSync(3), fs.fstatSync(4)];
    if (!before.every((info) => info.isFIFO())) brokerFailure();
    if (typeof nonblocking !== "function") brokerFailure();
    nonblocking(3);
    nonblocking(4);
    for (const [index, fd] of [3, 4].entries()) {
      const after = fs.fstatSync(fd);
      if (!after.isFIFO() || ["dev", "ino", "mode"].some((key) => before[index][key] !== after[key])) brokerFailure();
    }
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
  env = process.env ?? {}, fs = brokerNativeFs, now = brokerNow, pause = brokerPause, nonblocking = brokerNativeNonblocking,
} = {}) {
  if (!brokerMode(env)) return null;
  try {
    if (brokerPoisonedTransports.has(fs)) brokerFailure();
    const descriptors = brokerDescriptors(env, fs, nonblocking);
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

export function readinessBrokerOptions(environment, { env = process.env ?? {}, fs = brokerNativeFs, nonblocking = brokerNativeNonblocking } = {}) {
  const childEnvironment = { ...environment };
  const descriptors = brokerDescriptors(env, fs, nonblocking);
  if (descriptors === null) return { env: childEnvironment, stdio: ["ignore", "pipe", "pipe"] };
  childEnvironment.AIFINDER_GIT_BROKER_MODE = "1";
  childEnvironment.AIFINDER_GIT_BROKER_REQUEST_FD = "3";
  childEnvironment.AIFINDER_GIT_BROKER_RESPONSE_FD = "4";
  return { env: childEnvironment, stdio: ["ignore", "pipe", "pipe", descriptors.requestFd, descriptors.responseFd] };
}
// END A20_FIXED_FD_BROKER_CLIENT

const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const MANIFEST_RELATIVE_PATH =
  "scripts/launch-operations-kernel/candidate-manifest.json";
const FREEZE_RELATIVE_PATH =
  "scripts/launch-operations-kernel/legacy-freeze.json";
const PROTECTED_DRAFT_PATHS = Object.freeze([
  "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-wrapper-candidate.sh",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-generator-candidate.py",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-schema.json",
]);
const GIT_TIMEOUT_MS = 20_000;
const OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json";
const PRE_EFFECT_GIT_SANDBOX_PROFILE = [
  "(version 1)",
  "(allow default)",
  "(deny network*)",
  "(deny file-write*)",
  '(allow file-write* (literal "/dev/null"))',
  "(deny process-exec*)",
  '(allow process-exec (literal "/usr/bin/git"))',
  '(allow process-exec (literal "/Library/Developer/CommandLineTools/usr/bin/git"))',
].join("");
export function createCommonGitControls() {
  return Object.freeze({
    configArgs: Object.freeze([
      "-c", "maintenance.auto=false",
      "-c", "maintenance.autoDetach=false",
      "-c", "gc.auto=0",
      "-c", "gc.autoPackLimit=0",
      "-c", "gc.autoDetach=false",
      "-c", "core.hooksPath=/dev/null",
      "-c", "core.fsmonitor=false",
      "-c", "credential.helper=",
      "-c", "credential.interactive=false",
    ]),
    environment: Object.freeze({
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
      GIT_ASKPASS: "/usr/bin/false",
      SSH_ASKPASS: "/usr/bin/false",
      GIT_OPTIONAL_LOCKS: "0",
      LC_ALL: "C",
    }),
  });
}

const PRE_EFFECT_GIT_ENVIRONMENT = Object.freeze({
  ...createCommonGitControls().environment,
  GIT_NO_REPLACE_OBJECTS: "1",
});
const PRE_EFFECT_GIT_CONFIG = Object.freeze([
  ...createCommonGitControls().configArgs,
  "-c",
  "diff.external=",
  "-c",
  "core.attributesFile=/dev/null",
  "-c",
  "core.pager=cat",
]);

export class ConcreteRunnerError extends Error {
  constructor(code) {
    super(code);
    this.name = "ConcreteRunnerError";
    this.code = code;
  }
}

function exactObject(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function exactAuthorizationPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/Users/jamescarlodumaua/Downloads/") &&
    value.endsWith(".json") &&
    !value.includes("\0") &&
    !value.includes("/.env") &&
    !value.split("/").includes("..")
  );
}

function exactRetainedClassification(value) {
  return (
    value?.schema_version === 1 &&
    value.classification === "FAIL_CLOSED_UNRESOLVED" &&
    value.authorization_state === "QUALIFICATION_ATTEMPT_STARTED" &&
    value.recovery_state === "EXECUTION_IN_PROGRESS" &&
    value.recovery_stage === "PRIOR_RECONCILIATION" &&
    value.guard?.owner_pid === 12605 &&
    value.guard?.status === "DEAD" &&
    value.guard?.recovery_root_binding_exact === true &&
    value.candidate_binding?.exact === true &&
    value.effects?.data_writes === 0 &&
    value.effects?.branch_commit_present === false &&
    value.effects?.preview_identity_present === false &&
    value.effects?.environment_resource_count === 0 &&
    value.effects?.environment_cleanup_intents?.ADMIN_PASSWORD === 0 &&
    value.effects?.environment_cleanup_intents?.ADMIN_SESSION_SECRET === 0 &&
    value.effects?.branch_cleanup_intents === 0 &&
    value.effects?.preview_cleanup_intents === 0 &&
    value.effects?.terminal_evidence_present === false &&
    exactObject(value.effects?.mutation_intents, [
      { kind: "PRIOR_RECONCILIATION", sequence: 1 },
    ]) &&
    value.ownership_ambiguity === true &&
    value.legacy_reconciliation_required === true &&
    value.clean === false &&
    value.qualified === false &&
    value.retained_identity_digest_sha256 ===
      CONCRETE_RETAINED_IDENTITY_SHA256
  );
}

export async function verifyConcretePreEffectAuthorization({
  authorization_record,
  dependencies,
  git_execution_context,
}) {
  const authorization = validateConcreteAuthorizationRecord(
    authorization_record,
    { now_epoch_ms: dependencies.now_epoch_ms },
  );
  const candidate = await dependencies.verifyCandidate();
  if (
    candidate?.verified !== true ||
    candidate.source_policy_verified !== true ||
    candidate.activation_source_policy_verified !== true ||
    candidate.membership_exact !== true ||
    candidate.legacy_imports !== 0 ||
    candidate.live_entrypoints !== 4 ||
    candidate.candidate_identity_sha256 !==
      authorization.candidate_identity_sha256 ||
    candidate.manifest_sha256 !== authorization.manifest_sha256 ||
    !Number.isSafeInteger(candidate.member_count) ||
    candidate.member_count < 1
  ) {
    throw new ConcreteRunnerError("CONCRETE_CANDIDATE_MISMATCH");
  }
  for (const supportPath of CONCRETE_SUPPORT_PATHS) {
    const actual = await dependencies.hashCompatibilitySupport(supportPath);
    if (actual !== authorization.compatibility_support_sha256[supportPath]) {
      throw new ConcreteRunnerError("CONCRETE_SUPPORT_MISMATCH");
    }
  }
  const repository = await dependencies.inspectRepository();
  if (!exactObject(repository, authorization.repository)) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const temporaryCommit = await dependencies.verifyTemporaryCommit(
    authorization,
    git_execution_context,
  );
  if (temporaryCommit?.verified !== true) {
    throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
  }
  const retainedResult = await dependencies.classifyRetainedLegacy();
  const retained =
    retainedResult?.classification &&
      typeof retainedResult.classification === "object" &&
      !Array.isArray(retainedResult.classification)
      ? retainedResult.classification
      : retainedResult;
  if (!exactRetainedClassification(retained)) {
    throw new ConcreteRunnerError("CONCRETE_RETAINED_STATE_MISMATCH");
  }
  return Object.freeze({
    verified: true,
    candidate_identity_sha256: candidate.candidate_identity_sha256,
    manifest_sha256: candidate.manifest_sha256,
    member_count: candidate.member_count,
    retained_legacy_identity_sha256:
      retained.retained_identity_digest_sha256,
    operation_class: authorization.operation_class,
    attempts_authorized: authorization.attempt_limit,
    request_budget: authorization.request_budget,
    mutation_budget: authorization.mutation_budget,
    retained_classification: structuredClone(retained),
    ...(retainedResult?.freeze_document_bytes instanceof Uint8Array
      ? {
          freeze_document_bytes: Buffer.from(
            retainedResult.freeze_document_bytes,
          ),
        }
      : {}),
  });
}

function safeCode(error) {
  const allowed = new Set([
    "CONCRETE_AUTHORIZATION_EXPIRED",
    "CONCRETE_AUTHORIZATION_INVALID",
    "CONCRETE_AUTHORIZATION_REQUIRED",
    "CONCRETE_CANDIDATE_MISMATCH",
    "CONCRETE_CREDENTIAL_MISSING",
    "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
    "CONCRETE_MODE_DENIED",
    "CONCRETE_REPOSITORY_MISMATCH",
    "CONCRETE_RETAINED_STATE_MISMATCH",
    "CONCRETE_SUPERVISOR_TRUST_REQUIRED",
    "CONCRETE_SUPPORT_MISMATCH",
    "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    "CONCRETE_QUALIFICATION_FAILED_CLOSED",
    "CONCRETE_QUALIFICATION_RECOVERED",
    "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
  ]);
  return allowed.has(error?.code) ? error.code : "CONCRETE_RUNNER_FAILED";
}

function emit(dependencies, value) {
  dependencies.writeOutput?.(structuredClone(value));
}

function safeCredentialDiagnostics(error) {
  const allowedMissing = new Set([
    "GH_TOKEN|GITHUB_TOKEN",
    "VERCEL_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
  ]);
  const allowedInvalid = new Set([
    "GITHUB",
    "VERCEL",
    "SUPABASE_URL",
    "SUPABASE_ANON",
    "SUPABASE_SERVICE_ROLE",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION",
    "ENV_LOCAL",
  ]);
  const missing = Array.isArray(error?.missing_credentials) &&
      error.missing_credentials.every((value) => allowedMissing.has(value))
    ? [...error.missing_credentials]
    : [];
  const invalid = Array.isArray(error?.invalid_credential_sources) &&
      error.invalid_credential_sources.every((value) => allowedInvalid.has(value))
    ? [...error.invalid_credential_sources]
    : [];
  return Object.freeze({
    ...(missing.length > 0 ? { missing_credentials: Object.freeze(missing) } : {}),
    ...(invalid.length > 0
      ? { invalid_credential_sources: Object.freeze(invalid) }
      : {}),
  });
}

function authorizationFromSupervisorTrust(supervisorTrust, nowEpochMs) {
  try {
    if (
      !supervisorTrust ||
      typeof supervisorTrust !== "object" ||
      Array.isArray(supervisorTrust) ||
      Object.keys(supervisorTrust).sort().join("\0") !== [
        "authorization",
        "authorization_bytes",
        "authorization_sha256",
        "credential_source_policy",
        "supervisor_policy_sha256",
        "supervisor_sha256",
        "verified",
      ].sort().join("\0") ||
      supervisorTrust.verified !== true ||
      !(supervisorTrust.authorization_bytes instanceof Uint8Array) ||
      supervisorTrust.authorization_bytes.byteLength < 2 ||
      supervisorTrust.authorization_bytes.byteLength > 128 * 1024 ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.authorization_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_policy_sha256)
    ) throw new Error("SHAPE");
    const authorizationBytes = Buffer.from(supervisorTrust.authorization_bytes);
    const authorizationText = new TextDecoder("utf-8", { fatal: true }).decode(
      authorizationBytes,
    );
    if (
      authorizationText.startsWith("\ufeff") ||
      authorizationText !== `${canonicalJson(supervisorTrust.authorization)}\n` ||
      sha256Hex(authorizationBytes) !== supervisorTrust.authorization_sha256 ||
      supervisorTrust.authorization.supervisor_sha256 !==
        supervisorTrust.supervisor_sha256 ||
      supervisorTrust.authorization.supervisor_policy_sha256 !==
        supervisorTrust.supervisor_policy_sha256 ||
      canonicalJson(supervisorTrust.credential_source_policy) !==
        canonicalJson(CONCRETE_CREDENTIAL_SOURCE_POLICY)
    ) throw new Error("BINDING");
    return Object.freeze({
      authorization: validateConcreteAuthorizationRecord(
        structuredClone(supervisorTrust.authorization),
        { now_epoch_ms: nowEpochMs },
      ),
      credential_source_policy: Object.freeze(
        structuredClone(supervisorTrust.credential_source_policy),
      ),
    });
  } catch (error) {
    if (
      error?.code === "CONCRETE_AUTHORIZATION_EXPIRED" ||
      error?.code === "CONCRETE_AUTHORIZATION_INVALID"
    ) throw error;
    throw new ConcreteRunnerError("CONCRETE_SUPERVISOR_TRUST_REQUIRED");
  }
}

function officialAuthorizationFromSupervisorTrust(supervisorTrust, nowEpochMs, recovery = false) {
  try {
    if (
      !supervisorTrust || typeof supervisorTrust !== "object" ||
      Array.isArray(supervisorTrust) ||
      Object.keys(supervisorTrust).sort().join("\0") !== [
        "authorization",
        "authorization_bytes",
        "authorization_sha256",
        "credential_source_policy",
        "operation_class",
        "repository_observation",
        ...(recovery ? ["retention_recovery"] : []),
        "supervisor_policy_sha256",
        "supervisor_sha256",
        "verified",
      ].sort().join("\0") ||
      supervisorTrust.verified !== true ||
      supervisorTrust.operation_class !== ADMIN_V1_OFFICIAL_OPERATION_CLASS ||
      !exactObject(
        supervisorTrust.repository_observation,
        supervisorTrust.authorization?.repository,
      ) ||
      !(supervisorTrust.authorization_bytes instanceof Uint8Array) ||
      supervisorTrust.authorization_bytes.byteLength < 2 ||
      supervisorTrust.authorization_bytes.byteLength > 128 * 1024 ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.authorization_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_policy_sha256)
    ) throw new Error("SHAPE");
    if (recovery && (supervisorTrust.authorization?.schema_version !== 2 ||
      !exactRecoveryMarker(supervisorTrust.retention_recovery))) throw new Error("RECOVERY_TRUST");
    const authorizationBytes = Buffer.from(supervisorTrust.authorization_bytes);
    const authorizationText = new TextDecoder("utf-8", { fatal: true }).decode(
      authorizationBytes,
    );
    if (
      authorizationText.startsWith("\ufeff") ||
      authorizationText !== `${canonicalJson(supervisorTrust.authorization)}\n` ||
      sha256Hex(authorizationBytes) !== supervisorTrust.authorization_sha256 ||
      supervisorTrust.authorization.supervisor_sha256 !==
        supervisorTrust.supervisor_sha256 ||
      supervisorTrust.authorization.supervisor_policy_sha256 !==
        supervisorTrust.supervisor_policy_sha256 ||
      canonicalJson(supervisorTrust.credential_source_policy) !==
        canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY)
    ) throw new Error("BINDING");
    return Object.freeze({
      authorization: validateAdminV1OfficialAuthorization(
        structuredClone(supervisorTrust.authorization),
        { now_epoch_ms: nowEpochMs },
      ),
      credential_source_policy: Object.freeze(
        structuredClone(supervisorTrust.credential_source_policy),
      ),
    });
  } catch (error) {
    if (
      error?.code === "OFFICIAL_AUTHORIZATION_INVALID" ||
      error?.code === "OFFICIAL_AUTHORIZATION_EXPIRED"
    ) throw error;
    throw new ConcreteRunnerError("OFFICIAL_SUPERVISOR_TRUST_REQUIRED");
  }
}

export async function verifyAdminV1OfficialPreEffectAuthorization({
  authorization_record,
  dependencies,
  git_execution_context,
  retention_recovery = false,
}) {
  const authorization = validateAdminV1OfficialAuthorization(
    authorization_record,
    { now_epoch_ms: dependencies.now_epoch_ms },
  );
  const candidate = await dependencies.verifyCandidate();
  if (
    candidate?.verified !== true ||
    candidate.source_policy_verified !== true ||
    candidate.activation_source_policy_verified !== true ||
    candidate.membership_exact !== true ||
    candidate.legacy_imports !== 0 ||
    candidate.live_entrypoints !== 4 ||
    candidate.candidate_identity_sha256 !==
      authorization.candidate_identity_sha256 ||
    candidate.manifest_sha256 !== authorization.manifest_sha256
  ) throw new ConcreteRunnerError("OFFICIAL_CANDIDATE_MISMATCH");
  for (const supportPath of Object.keys(
    authorization.compatibility_support_sha256,
  )) {
    if (
      await dependencies.hashCompatibilitySupport(supportPath) !==
        authorization.compatibility_support_sha256[supportPath]
    ) throw new ConcreteRunnerError("OFFICIAL_SUPPORT_MISMATCH");
  }
  const repository = await dependencies.inspectRepository();
  if (!exactObject(repository, authorization.repository)) {
    throw new ConcreteRunnerError("OFFICIAL_REPOSITORY_MISMATCH");
  }
  if (!retention_recovery) {
    const temporaryCommit = await dependencies.verifyTemporaryCommit(authorization, git_execution_context);
    if (temporaryCommit?.verified !== true) throw new ConcreteRunnerError("OFFICIAL_TEMPORARY_COMMIT_MISMATCH");
  }
  for (const routePath of Object.keys(authorization.route_source_sha256)) {
    if (
      await dependencies.hashOfficialRouteSource(routePath) !==
        authorization.route_source_sha256[routePath]
    ) throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  if (
    await dependencies.hashOfficialAuthorizationSchema() !==
      authorization.authorization_schema_sha256 ||
    canonicalJson(authorization.contract_sha256) !==
      canonicalJson(authorization.schema_version === 2
        ? ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2 : ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1)
  ) throw new ConcreteRunnerError("OFFICIAL_CONTRACT_MISMATCH");
  if (!retention_recovery) {
    const prior = await dependencies.verifyNoPriorOfficialRecovery(authorization);
    if (authorization.schema_version === 2 && prior?.status === "SPENT") throw new ConcreteRunnerError("OFFICIAL_AUTHORIZATION_SPENT");
    if (prior?.status !== "ABSENT") throw new ConcreteRunnerError("OFFICIAL_PRIOR_RECOVERY_PENDING");
  }
  return Object.freeze({
    verified: true,
    operation_class: authorization.operation_class,
    candidate_identity_sha256: authorization.candidate_identity_sha256,
    manifest_sha256: authorization.manifest_sha256,
    token_spent: retention_recovery,
  });
}

const OFFICIAL_RETENTION_RECEIPT_KEYS = Object.freeze([
  "policy", "phase", "deployment_id", "environment_record_ids", "environment_keys",
  "data_zero_residual", "external_retained_exact", "unrelated_preserved",
]);

function exactOfficialRetentionReceipt(receipt, authorization) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const descriptors = Object.getOwnPropertyDescriptors(receipt);
  if (Reflect.ownKeys(descriptors).length !== OFFICIAL_RETENTION_RECEIPT_KEYS.length ||
      !OFFICIAL_RETENTION_RECEIPT_KEYS.every((key) => Object.hasOwn(descriptors, key) &&
        Object.hasOwn(descriptors[key], "value") && descriptors[key].enumerable === true)) return false;
  const ids = receipt.environment_record_ids;
  return authorization.schema_version === 2 &&
    authorization.execution.provider_cleanup_policy === "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" &&
    receipt.policy === authorization.execution.provider_cleanup_policy &&
    receipt.phase === "COMPLETE" && /^dpl_[A-Za-z0-9]+$/u.test(receipt.deployment_id ?? "") &&
    Array.isArray(ids) && ids.length === 7 && ids.every((id) => typeof id === "string" &&
      id.length > 0 && id.length <= 128 && /^[\x21-\x7e]+$/u.test(id)) &&
    new Set(ids).size === 7 && Array.isArray(receipt.environment_keys) &&
    exactObject(receipt.environment_keys, OFFICIAL_PREVIEW_ENVIRONMENT_KEYS) &&
    exactObject(receipt.environment_keys, authorization.execution.environment_keys) &&
    receipt.data_zero_residual === true && receipt.external_retained_exact === true &&
    receipt.unrelated_preserved === true;
}

export function classifyAdminV1OfficialPriorJournal(existing, schemaVersion = 1) {
  if (existing === null) return { status: "ABSENT" };
  if (schemaVersion !== 1 && schemaVersion !== 2) return { status: "MISMATCH" };
  if (schemaVersion === 1 && existing?.retired === true) return { status: "RETIRED" };
  try {
    const classification = classifyAdminV1OfficialRecoveryState(existing);
    if (schemaVersion === 2 && classification === "RETENTION_COMPLETE") return { status: "SPENT" };
    if (existing?.retired === true) return { status: "RETIRED" };
    if (classification === "CLEANUP_COMPLETE") return { status: "SPENT" };
    return { status: "RECOVERY_PENDING" };
  } catch {
    return { status: "MISMATCH" };
  }
}

function safeOfficialCode(error) {
  const allowed = new Set([
    "OFFICIAL_AUTHORIZATION_INVALID",
    "OFFICIAL_AUTHORIZATION_REQUIRED",
    "OFFICIAL_AUTHORIZATION_SPENT",
    "OFFICIAL_BUDGET_EXHAUSTED",
    "OFFICIAL_CANDIDATE_MISMATCH",
    "OFFICIAL_CONTRACT_MISMATCH",
    "OFFICIAL_CREDENTIAL_MISSING",
    "OFFICIAL_CREDENTIAL_SOURCE_MISMATCH",
    "OFFICIAL_CONCRETE_TRANSPORT_MISSING",
    "OFFICIAL_PRIOR_RECOVERY_PENDING",
    "OFFICIAL_RECOVERY_STATE_INVALID",
    "OFFICIAL_RECOVERY_CONTEXT_INVALID",
    "OFFICIAL_RECOVERY_PENDING",
    "OFFICIAL_REPOSITORY_MISMATCH",
    "OFFICIAL_ROUTE_SOURCE_MISMATCH",
    "OFFICIAL_RUNTIME_FAILED_CLOSED",
    "OFFICIAL_SUPPORT_MISMATCH",
    "OFFICIAL_SUPERVISOR_TRUST_REQUIRED",
    "OFFICIAL_TEMPORARY_COMMIT_MISMATCH",
  ]);
  return allowed.has(error?.code) ? error.code : "OFFICIAL_RUNTIME_FAILED_CLOSED";
}


function exactRecoveryMarker(marker) {
  return marker && typeof marker === "object" && !Array.isArray(marker) &&
    Object.keys(marker).sort().join("\0") === ["journal_sha256", "mode"].sort().join("\0") &&
    marker.mode === "OFFICIAL_RETENTION_RECOVERY_V1" && /^[0-9a-f]{64}$/u.test(marker.journal_sha256 ?? "");
}

const OFFICIAL_RECOVERY_READONLY_FS = Object.freeze({ lstatSync, realpathSync, readdirSync });

export function readExistingOfficialRecoveryAdmission(authorization, marker, filesystem = OFFICIAL_RECOVERY_READONLY_FS) {
  try {
    if (!exactRecoveryMarker(marker) || authorization.schema_version !== 2) throw new Error("MODE");
    const root = authorization.execution.journal_directory;
    const owner = filesystem.lstatSync(authorization.repository.root).uid;
    const metadata = filesystem.lstatSync(root);
    if (!metadata.isDirectory() || metadata.isSymbolicLink() || metadata.uid !== owner ||
        (metadata.mode & 0o777) !== 0o700 || filesystem.realpathSync(root) !== root) throw new Error("ROOT");
    try {
      filesystem.lstatSync(path.join(root, "admin-v1-official-runtime-retired.json"));
      throw new ConcreteRunnerError("OFFICIAL_AUTHORIZATION_SPENT");
    } catch (error) { if (error?.code !== "ENOENT") throw error; }
    const identityBytes = readAdminV1OfficialRecoveryFile({ target: path.join(root, "admin-v1-official-runtime-identity.json"), owner,
      ...(filesystem === OFFICIAL_RECOVERY_READONLY_FS ? {} : { filesystem }) });
    const identity = { schema_version: 1, identity: { authorization_id_sha256: authorization.authorization_id_sha256, run_id: authorization.run_id } };
    if (identityBytes.toString("utf8") !== `${canonicalJson(identity)}\n`) throw new Error("IDENTITY");
    const bytes = readAdminV1OfficialRecoveryFile({ target: path.join(root, "admin-v1-official-runtime-journal.json"), owner,
      ...(filesystem === OFFICIAL_RECOVERY_READONLY_FS ? {} : { filesystem }) });
    if (sha256Hex(bytes) !== marker.journal_sha256) throw new Error("CHANGED");
    const document = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (bytes.toString("utf8") !== `${canonicalJson(document)}\n`) throw new Error("CANONICAL");
    validateAdminV1OfficialRetentionRecoveryRecord({ retired: false, value: document }, authorization);
    return Object.freeze({ ...marker });
  } catch (error) {
    if (error?.code === "OFFICIAL_AUTHORIZATION_SPENT") throw error;
    throw new ConcreteRunnerError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
}

export function verifyOfficialRecoveryGitContext(authorization, filesystem = OFFICIAL_RECOVERY_READONLY_FS) {
  try {
    const root = authorization.execution.journal_directory;
    const owner = filesystem.lstatSync(authorization.repository.root).uid;
    const gitDirectory = path.join(authorization.repository.root, ".git");
    const objectDirectory = path.join(gitDirectory, "objects");
    for (const target of [authorization.repository.root, gitDirectory, objectDirectory]) {
      const metadata = filesystem.lstatSync(target);
      if (!metadata.isDirectory() || metadata.isSymbolicLink() || metadata.uid !== owner || filesystem.realpathSync(target) !== target) throw new Error("REPOSITORY");
    }
    const contextDirectory = path.join(root, ".qualification-git-context");
    for (const [relative, names] of [["", ["HEAD", "config", "objects", "refs"]], ["objects", []], ["refs", ["heads"]], ["refs/heads", []]]) {
      const target = path.join(contextDirectory, relative);const metadata = filesystem.lstatSync(target);
      if (!metadata.isDirectory() || metadata.isSymbolicLink() || metadata.uid !== owner || (metadata.mode & 0o777) !== 0o500 ||
          filesystem.realpathSync(target) !== target || !exactObject(filesystem.readdirSync(target).sort(), names)) throw new Error("DIRECTORY");
    }
    for (const [name, expected] of [["HEAD", "ref: refs/heads/qualification-context\n"], ["config", "[core]\n\tbare = true\n\trepositoryformatversion = 0\n"]]) {
      const bytes = readAdminV1OfficialRecoveryFile({ target: path.join(contextDirectory, name), owner, mode: 0o400, maximum_bytes: 256,
        ...(filesystem === OFFICIAL_RECOVERY_READONLY_FS ? {} : { filesystem }) });
      if (bytes.toString("utf8") !== expected) throw new Error("FILE");
    }
    return Object.freeze({ git_dir: contextDirectory, object_directory: objectDirectory });
  } catch { throw new ConcreteRunnerError("OFFICIAL_RECOVERY_CONTEXT_INVALID"); }
}

export async function dispatchAdminV1OfficialRetentionRecovery(argumentsList, dependencies = {}, supervisorTrust = dependencies.supervisor_trust) {
  let credentials;
  try {
    if (!Array.isArray(argumentsList) || argumentsList.length !== 3 || argumentsList[0] !== "--recover-admin-v1-official-retention" ||
        argumentsList[1] !== "--authorization" || !exactAuthorizationPath(argumentsList[2])) throw new ConcreteRunnerError("OFFICIAL_AUTHORIZATION_REQUIRED");
    const trusted = officialAuthorizationFromSupervisorTrust(supervisorTrust, dependencies.now_epoch_ms, true);
    const context = await dependencies.openOfficialRecoveryExecutionContext(trusted.authorization, supervisorTrust.retention_recovery);
    const assertPending = () => {
      const record = context?.journal?.load();
      if (record?.retired === true) throw new ConcreteRunnerError("OFFICIAL_AUTHORIZATION_SPENT");
      validateAdminV1OfficialRetentionRecoveryRecord(record, trusted.authorization);
    };
    assertPending();
    await verifyAdminV1OfficialPreEffectAuthorization({ authorization_record: trusted.authorization, dependencies,
      git_execution_context: context.git_execution_context, retention_recovery: true });
    await dependencies.verifyOfficialRecoveryAdmission(trusted.authorization, context);
    assertPending();
    credentials = await dependencies.readOfficialCredentials(trusted.authorization, trusted.credential_source_policy);
    const result = await dependencies.runAuthorizedOfficialRecovery({ authorization: trusted.authorization, credentials, execution_context: context });
    if (result?.classification !== "RETENTION_COMPLETE") throw new ConcreteRunnerError("OFFICIAL_RECOVERY_PENDING");
    const durable = context.journal.load();
    const completed = validateAdminV1OfficialRetentionRecoveryRecord(durable, trusted.authorization, { complete: true });
    if (classifyAdminV1OfficialRecoveryState(durable) !== "RETENTION_COMPLETE" || !exactOfficialRetentionReceipt(result.retention, trusted.authorization) ||
        !exactObject(result.retention, completed.state.retention) || result.qualification_requests !== completed.state.last_completed_qualification_ordinal ||
        result.official_requests !== completed.state.last_completed_official_ordinal || result.runtime_sessions !== completed.state.runtime_sessions ||
        result.runtime_retries !== completed.state.runtime_retries || result.runtime_replays !== completed.state.runtime_replays ||
        result.zero_residual_owned_state !== false) throw new ConcreteRunnerError("OFFICIAL_RECOVERY_STATE_INVALID");
    emit(dependencies, { status: "PASS", code: "RETENTION_COMPLETE", qualification_requests: result.qualification_requests,
      official_requests: result.official_requests, runtime_sessions: result.runtime_sessions, runtime_retries: result.runtime_retries,
      runtime_replays: result.runtime_replays, zero_residual_owned_state: false, retention: structuredClone(result.retention) });
    return { exit_code: 0, code: "RETENTION_COMPLETE" };
  } catch (error) {
    const code = safeOfficialCode(error);emit(dependencies, { status: "FAIL", code });return { exit_code: 1, code };
  } finally {
    for (const value of Object.values(credentials ?? {})) if (value instanceof Uint8Array) value.fill(0);
  }
}

export async function dispatchAdminV1OfficialRunner(
  argumentsList,
  dependencies = {},
  supervisorTrust = dependencies.supervisor_trust,
) {
  if (
    !Array.isArray(argumentsList) || argumentsList.length !== 3 ||
    argumentsList[0] !== "--run-admin-v1-official" ||
    argumentsList[1] !== "--authorization" ||
    !exactAuthorizationPath(argumentsList[2])
  ) {
    emit(dependencies, { status: "FAIL", code: "OFFICIAL_AUTHORIZATION_REQUIRED" });
    return { exit_code: 1, code: "OFFICIAL_AUTHORIZATION_REQUIRED" };
  }
  try {
    const trusted = officialAuthorizationFromSupervisorTrust(
      supervisorTrust,
      dependencies.now_epoch_ms,
    );
    const executionContext = await dependencies.prepareOfficialExecutionContext(
      trusted.authorization,
    );
    const closure = await verifyAdminV1OfficialPreEffectAuthorization({
      authorization_record: trusted.authorization,
      dependencies,
      git_execution_context: executionContext?.git_execution_context,
    });
    const credentials = await dependencies.readOfficialCredentials(
      trusted.authorization,
      trusted.credential_source_policy,
    );
    const result = await dependencies.runAuthorizedOfficialRuntime({
      authorization: trusted.authorization,
      authorization_closure: closure,
      credentials,
      execution_context: executionContext,
    });
    const isolated = trusted.authorization.schema_version === 2;
    const completionCode = isolated ? "RETENTION_COMPLETE" : "OFFICIAL_RUNTIME_COMPLETE";
    if (
      result?.classification === completionCode &&
      result.official_requests === 20 && result.qualification_requests === 6 &&
      result.runtime_sessions === 1 && result.runtime_retries === 0 &&
      result.runtime_replays === 0 && result.zero_residual_owned_state === !isolated &&
      (!isolated || exactOfficialRetentionReceipt(result.retention, trusted.authorization))
    ) {
      emit(dependencies, {
        status: "PASS",
        code: completionCode,
        qualification_requests: 6,
        official_requests: 20,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
        ...(isolated ? {
          zero_residual_owned_state: false,
          retention: structuredClone(result.retention),
        } : {}),
      });
      return { exit_code: 0, code: completionCode };
    }
    if (result?.classification === "RECOVERY_PENDING" ||
        isolated && result?.classification === "RETENTION_PENDING") {
      emit(dependencies, { status: "FAIL", code: "OFFICIAL_RECOVERY_PENDING" });
      return { exit_code: 1, code: "OFFICIAL_RECOVERY_PENDING" };
    }
    throw new ConcreteRunnerError("OFFICIAL_RUNTIME_FAILED_CLOSED");
  } catch (error) {
    const code = safeOfficialCode(error);
    emit(dependencies, { status: "FAIL", code });
    return { exit_code: 1, code };
  }
}

export async function dispatchConcreteQualificationRunner(
  argumentsList,
  dependencies = {},
  supervisorTrust = dependencies.supervisor_trust,
) {
  if (
    Array.isArray(argumentsList) &&
    argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) {
    emit(dependencies, {
      status: "PASS",
      code: "PASS_SELF_TEST",
      network: 0,
      credential_reads: 0,
      live_mutations: 0,
    });
    return { exit_code: 0, code: "PASS_SELF_TEST" };
  }
  if (Array.isArray(argumentsList) && argumentsList[0] === "--recover-admin-v1-official-retention") {
    return dispatchAdminV1OfficialRetentionRecovery(argumentsList, dependencies, supervisorTrust);
  }
  if (Array.isArray(argumentsList) &&
    argumentsList[0] === "--run-admin-v1-official") {
    return dispatchAdminV1OfficialRunner(
      argumentsList,
      dependencies,
      supervisorTrust,
    );
  }
  if (!Array.isArray(argumentsList) || argumentsList[0] !== "--qualify-nonproduction") {
    emit(dependencies, { status: "FAIL", code: "CONCRETE_MODE_DENIED" });
    return { exit_code: 1, code: "CONCRETE_MODE_DENIED" };
  }
  if (
    argumentsList.length !== 3 ||
    argumentsList[1] !== "--authorization" ||
    !exactAuthorizationPath(argumentsList[2])
  ) {
    emit(dependencies, {
      status: "FAIL",
      code: "CONCRETE_AUTHORIZATION_REQUIRED",
    });
    return { exit_code: 1, code: "CONCRETE_AUTHORIZATION_REQUIRED" };
  }
  try {
    const trusted = authorizationFromSupervisorTrust(
      supervisorTrust,
      dependencies.now_epoch_ms,
    );
    const authorization = trusted.authorization;
    const executionContext =
      await dependencies.prepareAuthorizedExecutionContext(authorization);
    const closure = await verifyConcretePreEffectAuthorization({
      authorization_record: authorization,
      dependencies,
      git_execution_context: executionContext.git_execution_context,
    });
    const lifecycleWriter =
      executionContext?.checkpoint_store?.withExclusiveWriter;
    if (typeof lifecycleWriter !== "function") {
      throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
    }
    const result = await lifecycleWriter.call(
      executionContext.checkpoint_store,
      async () => {
        const credentials = await dependencies.readLiveCredentials(
          authorization,
          trusted.credential_source_policy,
        );
        return dependencies.runAuthorizedQualification({
          authorization,
          authorization_closure: closure,
          credentials,
          execution_context: executionContext,
        });
      },
    );
    if (
      result?.classification === "QUALIFIED" &&
      result.attempts_used === 1 &&
      result.retained_preview_count === 1
    ) {
      emit(dependencies, {
        status: "PASS",
        code: "QUALIFIED",
        attempts_used: 1,
        retained_preview_count: 1,
      });
      return { exit_code: 0, code: "QUALIFIED" };
    }
    if (
      result?.attempts_used === 1 &&
      result.retained_preview_count === 0 &&
      [
        "CONCRETE_QUALIFICATION_FAILED_CLOSED",
        "CONCRETE_QUALIFICATION_RECOVERED",
        "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
      ].includes(result.classification)
    ) {
      emit(dependencies, {
        status: "FAIL",
        code: result.classification,
        attempts_used: 1,
        retained_preview_count: 0,
      });
      return { exit_code: 1, code: result.classification };
    }
    throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
  } catch (error) {
    const code = safeCode(error);
    emit(dependencies, {
      status: "FAIL",
      code,
      ...(["CONCRETE_CREDENTIAL_MISSING", "CONCRETE_CREDENTIAL_SOURCE_MISMATCH"].includes(code)
        ? safeCredentialDiagnostics(error)
        : {}),
    });
    return { exit_code: 1, code };
  }
}

function exactGitExecutionContext(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") ===
      ["git_dir", "object_directory"].join("\0") &&
    typeof value.git_dir === "string" &&
    typeof value.object_directory === "string" &&
    path.isAbsolute(value.git_dir) &&
    path.isAbsolute(value.object_directory) &&
    !value.git_dir.includes("\0") &&
    !value.object_directory.includes("\0") &&
    realpathSync(value.git_dir) === value.git_dir &&
    realpathSync(value.object_directory) === value.object_directory;
}

export function runnerBrokerOperation(args) {
  if (!Array.isArray(args) || args.some((value) => typeof value !== "string")) brokerFailure();
  const fixed = {"RUNNER_REMOTE_GET_URL_ORIGIN":["remote","get-url","origin"],"RUNNER_SYMBOLIC_REF_HEAD":["symbolic-ref","--quiet","--short","HEAD"],"RUNNER_REV_PARSE_HEAD":["rev-parse","HEAD"],"RUNNER_REV_PARSE_ORIGIN_MAIN":["rev-parse","refs/remotes/origin/main"],"RUNNER_REV_LIST_AHEAD_BEHIND":["rev-list","--left-right","--count","HEAD...refs/remotes/origin/main"],"RUNNER_DIFF_CACHED_QUIET":["diff","--cached","--quiet","--exit-code"],"RUNNER_WORKTREE_LIST":["worktree","list","--porcelain"],"RUNNER_STATUS_PORCELAIN":["status","--porcelain=v1","--untracked-files=all","-z"],"RUNNER_DIFF_FILES_NAMES":["diff-files","--name-only","-z","--"],"RUNNER_LS_FILES_OTHERS":["ls-files","--others","--exclude-standard","-z","--"]};
  for (const [family, operation] of Object.entries(fixed)) {
    if (args.length === operation.length && operation.every((value, index) => args[index] === value)) return { family, params: {} };
  }
  const shape = (operation, pattern, family) => {
    if (args.length !== operation.length + 1 || !operation.every((value, index) => args[index] === value)) return null;
    const match = pattern.exec(args.at(-1));
    return match ? { family, params: { commit: match[1] } } : null;
  };
  const selected = shape(["cat-file", "-e"], /^([0-9a-f]{40})\^\{commit\}$/u, "RUNNER_CAT_FILE_COMMIT") ??
    shape(["rev-list", "--parents", "-n", "1"], /^([0-9a-f]{40})$/u, "RUNNER_REV_LIST_SINGLE_PARENT") ??
    shape(["diff-tree", "--no-commit-id", "--name-only", "-r"], /^([0-9a-f]{40})$/u, "RUNNER_DIFF_TREE_NAMES") ??
    shape(["show", "-s", "--format=%T"], /^([0-9a-f]{40})$/u, "RUNNER_SHOW_TREE");
  if (selected) return selected;
  if (args.length === 2 && args[0] === "show") {
    const match = /^([0-9a-f]{40}):(.+)$/u.exec(args[1]);
    if (match) {
      const relative = match[2];
      const folded = relative.toLowerCase();
      const leaf = path.posix.basename(folded);
      if (relative.length > 4096 || /[\u0000-\u001f\u007f\\]/u.test(relative) ||
          relative.startsWith("/") || relative.split("/").some((part) => !part || part === "." || part === "..") ||
          path.posix.normalize(relative) !== relative || folded.split("/").includes(".git") ||
          PROTECTED_DRAFT_PATHS.includes(folded) || leaf === ".env" ||
          (leaf.startsWith(".env.") && path.posix.basename(relative) !== ".env.example")) brokerFailure();
      return { family: "RUNNER_SHOW_BLOB", params: { commit: match[1], path: relative } };
    }
  }
  brokerFailure();
}

function runGitReadOnly(
  repositoryRoot,
  args,
  {
    allowExitOne = false,
    gitExecutionContext = null,
    workTreeRoot = null,
  } = {},
) {
  if (gitExecutionContext !== null && !exactGitExecutionContext(gitExecutionContext)) {
    const error = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    error.detail = "GIT_CONTEXT_INVALID";
    throw error;
  }
  if (workTreeRoot !== null && gitExecutionContext === null) {
    const error = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    error.detail = "GIT_WORKTREE_CONTEXT_MISSING";
    throw error;
  }
  const environment = gitExecutionContext === null
    ? PRE_EFFECT_GIT_ENVIRONMENT
    : {
        ...PRE_EFFECT_GIT_ENVIRONMENT,
        GIT_DIR: gitExecutionContext.git_dir,
        GIT_NO_REPLACE_OBJECTS: "1",
        GIT_OBJECT_DIRECTORY: gitExecutionContext.object_directory,
        ...(workTreeRoot === null
          ? {}
          : {
              GIT_INDEX_FILE: path.join(workTreeRoot, ".git", "index"),
              GIT_WORK_TREE: workTreeRoot,
            }),
      };
  let result;
  if (brokerMode()) {
    const operation = runnerBrokerOperation(args);
    result = brokerRequest(operation.family, operation.params, {
      repository_root: repositoryRoot,
      git_dir: gitExecutionContext?.git_dir ?? null,
      object_directory: gitExecutionContext?.object_directory ?? null,
      work_tree_root: workTreeRoot,
    });
  } else {
    result = spawnSync("/usr/bin/sandbox-exec", [
    "-p",
    PRE_EFFECT_GIT_SANDBOX_PROFILE,
    "/Library/Developer/CommandLineTools/usr/bin/git",
    "--no-replace-objects",
    ...PRE_EFFECT_GIT_CONFIG,
    "--no-optional-locks",
    ...(workTreeRoot === null ? [] : ["-c", "core.bare=false"]),
    ...args,
  ], {
    cwd: workTreeRoot ?? (gitExecutionContext === null ? repositoryRoot : "/"),
    encoding: null,
    env: environment,
    maxBuffer: 4 * 1024 * 1024,
    timeout: GIT_TIMEOUT_MS,
    windowsHide: true,
  });
  }
  if (
    !result ||
    result.error ||
    result.signal ||
    result.timeout ||
    result.overflow ||
    !(result.status === 0 || (allowExitOne && result.status === 1)) ||
    !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.stderr.byteLength !== 0
  ) {
    const error = new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
    error.detail = Buffer.from(result?.stderr ?? []).toString("utf8").trim();
    throw error;
  }
  return {
    status: result.status,
    stdout: Buffer.from(result.stdout),
  };
}

function textOutput(result, code = "CONCRETE_REPOSITORY_MISMATCH") {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  } catch {
    throw new ConcreteRunnerError(code);
  }
  if (text.includes("\0")) throw new ConcreteRunnerError(code);
  return text;
}

function singleLine(result, code = "CONCRETE_REPOSITORY_MISMATCH") {
  const text = textOutput(result, code);
  if (!text.endsWith("\n") || text.slice(0, -1).includes("\n")) {
    throw new ConcreteRunnerError(code);
  }
  return text.slice(0, -1);
}

function exactRemoteRepository(repositoryRoot) {
  const remote = singleLine(
    runGitReadOnly(repositoryRoot, ["remote", "get-url", "origin"]),
  );
  if (![
    "git@github.com:jcdumaua/aifinder.git",
    "https://github.com/jcdumaua/aifinder.git",
  ].includes(remote)) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  return "jcdumaua/aifinder";
}

function inspectConcreteRepository(repositoryRoot, officialRepositoryObservation = null) {
  if (realpathSync(repositoryRoot) !== repositoryRoot) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const branch = singleLine(
    runGitReadOnly(repositoryRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
  );
  const head = singleLine(runGitReadOnly(repositoryRoot, ["rev-parse", "HEAD"]));
  const originMain = singleLine(
    runGitReadOnly(repositoryRoot, ["rev-parse", "refs/remotes/origin/main"]),
  );
  const counts = singleLine(
    runGitReadOnly(repositoryRoot, [
      "rev-list",
      "--left-right",
      "--count",
      "HEAD...refs/remotes/origin/main",
    ]),
  ).split(/\s+/u);
  if (counts.length !== 2 || counts.some((entry) => !/^\d+$/u.test(entry))) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const index = runGitReadOnly(
    repositoryRoot,
    ["diff", "--cached", "--quiet", "--exit-code"],
    { allowExitOne: true },
  );
  const worktrees = textOutput(
    runGitReadOnly(repositoryRoot, ["worktree", "list", "--porcelain"]),
  ).split("\n").filter((entry) => entry.startsWith("worktree "));
  const statusBytes = runGitReadOnly(repositoryRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "-z",
  ]).stdout;
  const repository = {
    root: repositoryRoot,
    branch,
    head,
    origin_main: originMain,
    ...(officialRepositoryObservation === null
      ? {}
      : { remote_main: officialRepositoryObservation.remote_main }),
    ahead: Number(counts[0]),
    behind: Number(counts[1]),
    index_empty: index.status === 0,
    worktree_count: worktrees.length,
    status_sha256: sha256Hex(statusBytes),
    remote_repository: exactRemoteRepository(repositoryRoot),
  };
  if (
    officialRepositoryObservation !== null &&
    !exactObject(repository, officialRepositoryObservation)
  ) throw new ConcreteRunnerError("OFFICIAL_REPOSITORY_MISMATCH");
  return repository;
}

function statusPaths(repositoryRoot, gitExecutionContext) {
  const readPaths = (args) => {
    const bytes = runGitReadOnly(repositoryRoot, args, {
      gitExecutionContext,
      workTreeRoot: repositoryRoot,
    }).stdout;
    if (bytes.byteLength === 0) return [];
    if (bytes.at(-1) !== 0) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    return bytes.subarray(0, -1).toString("utf8").split("\0").map((entry) => {
      if (
        entry.length < 1 ||
        entry.includes("\0") ||
        entry.includes("\\") ||
        path.isAbsolute(entry) ||
        entry.split("/").includes("..") ||
        path.posix.normalize(entry) !== entry
      ) {
        throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
      }
      return entry;
    });
  };
  const paths = [
    ...readPaths(["diff-files", "--name-only", "-z", "--"]),
    ...readPaths(["ls-files", "--others", "--exclude-standard", "-z", "--"]),
  ].sort((left, right) => left.localeCompare(right, "en"));
  if (new Set(paths).size !== paths.length) {
    throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
  }
  return paths;
}

export function concreteTemporaryCommitParentMatches(
  commitLine,
  commit,
  publishedHead,
) {
  return (
    Array.isArray(commitLine) &&
    commitLine.length === 2 &&
    /^[0-9a-f]{40}$/u.test(commit ?? "") &&
    /^[0-9a-f]{40}$/u.test(publishedHead ?? "") &&
    commitLine[0] === commit &&
    commitLine[1] === publishedHead
  );
}

export function concreteTemporaryCommitMetadataMatches({
  changedPaths,
  expectedPaths,
  temporaryTreeSha,
  publishedHeadTreeSha,
}) {
  if (
    !Array.isArray(changedPaths) ||
    !Array.isArray(expectedPaths) ||
    changedPaths.some((entry) => typeof entry !== "string") ||
    expectedPaths.some((entry) => typeof entry !== "string") ||
    !/^[0-9a-f]{40}$/u.test(temporaryTreeSha ?? "") ||
    !/^[0-9a-f]{40}$/u.test(publishedHeadTreeSha ?? "") ||
    !exactObject(changedPaths, expectedPaths)
  ) return false;
  return expectedPaths.length > 0 ||
    (changedPaths.length === 0 && temporaryTreeSha === publishedHeadTreeSha);
}

export function concreteTemporaryCommitBlobMatches(current, committed) {
  return current instanceof Uint8Array &&
    committed instanceof Uint8Array &&
    Buffer.from(current).equals(Buffer.from(committed));
}

export function verifyConcreteTemporaryCommit(authorization, gitExecutionContext) {
  const repositoryRoot = authorization.repository.root;
  const commit = authorization.execution.temporary_commit_sha;
  let verificationStage = "CONTEXT";
  try {
    const rawGit = (args) => runGitReadOnly(repositoryRoot, args, {
      gitExecutionContext,
    });
    verificationStage = "COMMIT_EXISTS";
    rawGit(["cat-file", "-e", `${commit}^{commit}`]);
    verificationStage = "PARENT";
    const commitLine = singleLine(
      rawGit(["rev-list", "--parents", "-n", "1", commit]),
      "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    ).split(/\s+/u);
    if (
      commitLine.length !== 2 ||
      !concreteTemporaryCommitParentMatches(
        commitLine,
        commit,
        authorization.repository.head,
      )
    ) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    verificationStage = "CHANGED_PATHS";
    const changed = textOutput(rawGit([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
    ])).trimEnd().split("\n").filter(Boolean).sort();
    verificationStage = "STATUS_PATHS";
    const expected = statusPaths(repositoryRoot, gitExecutionContext)
      .filter((entry) => !PROTECTED_DRAFT_PATHS.includes(entry))
      .sort();
    verificationStage = "PATH_EQUIVALENCE";
    if (!exactObject(changed, expected)) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    verificationStage = "TREE";
    const treeSha = singleLine(
      rawGit(["show", "-s", "--format=%T", commit]),
      "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    );
    const publishedHeadTreeSha = singleLine(
      rawGit([
        "show",
        "-s",
        "--format=%T",
        authorization.repository.head,
      ]),
      "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    );
    if (!concreteTemporaryCommitMetadataMatches({
      changedPaths: changed,
      expectedPaths: expected,
      temporaryTreeSha: treeSha,
      publishedHeadTreeSha,
    })) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    if (expected.length > 0) {
      for (const relativePath of expected) {
        verificationStage = `BLOB:${relativePath}`;
        const current = readFileSync(path.join(repositoryRoot, relativePath));
        const committed = rawGit([
          "show",
          `${commit}:${relativePath}`,
        ]).stdout;
        if (!concreteTemporaryCommitBlobMatches(current, committed)) {
          throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
        }
      }
    }
    return {
      verified: true,
      changed_paths: expected.length,
      commit_sha: commit,
      tree_sha: treeSha,
      object_directory: gitExecutionContext.object_directory,
    };
  } catch (error) {
    if (error?.code === "CONCRETE_TEMPORARY_COMMIT_MISMATCH") {
      error.detail = error.detail || verificationStage;
      throw error;
    }
    const wrapped = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    wrapped.detail = error?.detail ?? error?.message ?? "";
    throw wrapped;
  }
}

function verifyConcreteCandidate(repositoryRoot) {
  const manifestPath = path.join(repositoryRoot, MANIFEST_RELATIVE_PATH);
  const verification = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath,
    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",
  });
  const identities = deriveIdentityReport({
    repositoryRoot,
    manifestPath,
    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",
  });
  return {
    ...verification,
    manifest_sha256: identities.manifest_sha256,
    membership_exact: true,
    live_entrypoints: verification.live_entrypoints,
  };
}

function hashExactOfficialFile(repositoryRoot, relativePath, allowlist) {
  if (!allowlist.has(relativePath)) {
    throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  const target = path.resolve(repositoryRoot, relativePath);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  const metadata = lstatSync(target);
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o644 || realpathSync(target) !== target
  ) throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  return sha256Hex(readFileSync(target));
}

function classifyConcreteRetainedLegacy(repositoryRoot) {
  const freezePath = path.join(repositoryRoot, FREEZE_RELATIVE_PATH);
  const freezeDocumentBytes = readFileSync(freezePath);
  const freeze = readStrictJsonFile(freezePath);
  assertLegacyFreezePolicy(freeze);
  const classification = classifyLegacySnapshot(
    loadCurrentLegacySnapshot({ freeze }),
  );
  return {
    classification,
    freeze_document_bytes: Buffer.from(freezeDocumentBytes),
  };
}

function normalizedConcreteResult(result) {
  const state = result?.state ?? result;
  const lifecycle = state?.lifecycle_state;
  const retained = Array.isArray(result?.retained_resources)
    ? result.retained_resources
    : [];
  if (
    lifecycle === "QUALIFIED" &&
    state?.outcome?.code === "QUALIFIED" &&
    retained.length === 1 &&
    retained[0]?.resource_type === "PREVIEW_DEPLOYMENT"
  ) {
    return {
      classification: "QUALIFIED",
      attempts_used: 1,
      retained_preview_count: 1,
    };
  }
  if (
    lifecycle === "READY" &&
    state?.recovery?.status === "COMPLETE"
  ) {
    return {
      classification: "CONCRETE_QUALIFICATION_RECOVERED",
      attempts_used: 1,
      retained_preview_count: 0,
    };
  }
  if (lifecycle === "FAILED_CLOSED") {
    return {
      classification: "CONCRETE_QUALIFICATION_FAILED_CLOSED",
      attempts_used: 1,
      retained_preview_count: 0,
    };
  }
  return {
    classification: "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
    attempts_used: 1,
    retained_preview_count: 0,
  };
}

async function runConcreteAuthorizedQualification({
  authorization,
  authorization_closure,
  credentials,
  execution_context,
}) {
  if (!(authorization_closure.freeze_document_bytes instanceof Uint8Array)) {
    throw new ConcreteRunnerError("CONCRETE_RETAINED_STATE_MISMATCH");
  }
  const checkpointStore = execution_context?.checkpoint_store;
  if (
    !checkpointStore ||
    typeof checkpointStore.loadState !== "function" ||
    !execution_context?.git_execution_context
  ) {
    throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
  }
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport: createConcreteLiveTransport({
      git_execution_context: execution_context.git_execution_context,
    }),
  });
  const bundle = createConcreteQualificationBundle({
    authorization,
    authorization_closure,
    credentials,
    freeze_closure: {
      freeze_document_bytes: Buffer.from(
        authorization_closure.freeze_document_bytes,
      ),
      legacy_classification: structuredClone(
        authorization_closure.retained_classification,
      ),
      approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
      policy: {
        preserve_ambiguous_legacy_resources: true,
        fresh_ownership_namespace: true,
        claim_legacy_resources: false,
      },
    },
    platform,
    checkpoint_store: checkpointStore,
    storage_delete_capability_sha256: sha256Hex(canonicalJson({
      schema_version: 1,
      authorization_id_sha256: authorization.authorization_id_sha256,
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      run_id: authorization.run_id,
      operation: "DELETE_EXACT_STORAGE_VERSION",
      storage_bucket: authorization.execution.storage_bucket,
      storage_name: authorization.execution.storage_name,
    })),
  });
  let result;
  try {
    await checkpointStore.loadState();
    result = await recoverQualification(bundle.create_recovery_input());
  } catch (error) {
    if (error?.code !== "CONCRETE_CHECKPOINT_STATE_ABSENT") throw error;
    result = await runQualification(bundle.qualification_input);
    if (result?.state?.lifecycle_state === "FAILED_RECOVERABLE") {
      result = await recoverQualification(bundle.create_recovery_input());
    }
  }
  return normalizedConcreteResult(result);
}

async function prepareConcreteAuthorizedExecutionContext(authorization) {
  const checkpointStore = createConcreteCheckpointStore({
    directory: authorization.execution.journal_directory,
    identity: {
      authorization_id_sha256: authorization.authorization_id_sha256,
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      manifest_sha256: authorization.manifest_sha256,
      run_id: authorization.run_id,
    },
  });
  const gitExecutionContext = await checkpointStore.prepareGitExecutionContext({
    repository_root: authorization.repository.root,
  });
  return Object.freeze({
    checkpoint_store: checkpointStore,
    git_execution_context: gitExecutionContext,
  });
}

export function createConcreteRunnerDependencies({
  repositoryRoot = REPOSITORY_ROOT,
  officialRepositoryObservation = null,
  officialTransport = null,
  readCredentialEnvironment = readConcreteCredentialEnvironment,
  resolveCredentialEnvironment = resolveConcreteCredentialEnvironment,
  readOfficialBundle = readAdminV1OfficialIsolatedBundle,
  nowEpochMs = Date.now(),
  writeOutput,
} = {}) {
  const officialContexts = new Map();
  const officialRoutePaths = new Set([
    "app/api/admin/csrf/route.ts",
    "app/api/admin/login/route.ts",
    "app/api/admin/logout/route.ts",
    "app/api/admin/session/route.ts",
    "app/api/admin/submissions/route.ts",
    "app/api/admin/tools/route.ts",
    "app/api/admin/upload-logo/route.ts",
    "lib/admin-v1-launch-scope.ts",
    "proxy.ts",
  ]);
  return {
    now_epoch_ms: nowEpochMs,
    verifyCandidate() {
      return verifyConcreteCandidate(repositoryRoot);
    },
    inspectRepository() {
      return inspectConcreteRepository(
        repositoryRoot,
        officialRepositoryObservation,
      );
    },
    hashCompatibilitySupport(relativePath) {
      return sha256Hex(readFileSync(path.join(repositoryRoot, relativePath)));
    },
    hashOfficialRouteSource(relativePath) {
      return hashExactOfficialFile(
        repositoryRoot,
        relativePath,
        officialRoutePaths,
      );
    },
    hashOfficialAuthorizationSchema() {
      return hashExactOfficialFile(
        repositoryRoot,
        OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH,
        new Set([OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH]),
      );
    },
    verifyTemporaryCommit: verifyConcreteTemporaryCommit,
    classifyRetainedLegacy() {
      return classifyConcreteRetainedLegacy(repositoryRoot);
    },
    prepareAuthorizedExecutionContext:
      prepareConcreteAuthorizedExecutionContext,
    async prepareOfficialExecutionContext(authorization) {
      const checkpointStore = createConcreteCheckpointStore({
        directory: authorization.execution.journal_directory,
        identity: {
          authorization_id_sha256: authorization.authorization_id_sha256,
          candidate_identity_sha256: authorization.candidate_identity_sha256,
          manifest_sha256: authorization.manifest_sha256,
          run_id: authorization.run_id,
        },
      });
      const journal = createAdminV1OfficialJournal({
        directory: authorization.execution.journal_directory,
        identity: {
          authorization_id_sha256: authorization.authorization_id_sha256,
          run_id: authorization.run_id,
        },
      });
      const gitExecutionContext = await checkpointStore.prepareGitExecutionContext({
        repository_root: authorization.repository.root,
      });
      const context = Object.freeze({
        journal,
        git_execution_context: gitExecutionContext,
      });
      officialContexts.set(authorization.authorization_id_sha256, context);
      return context;
    },
    openOfficialRecoveryExecutionContext(authorization, marker) {
      const admission = readExistingOfficialRecoveryAdmission(authorization, marker);
      const gitExecutionContext = verifyOfficialRecoveryGitContext(authorization);
      const journal = createAdminV1OfficialJournal({ directory: authorization.execution.journal_directory,
        identity: { authorization_id_sha256: authorization.authorization_id_sha256, run_id: authorization.run_id }, existing_only: true });
      return Object.freeze({ journal, git_execution_context: gitExecutionContext, retention_recovery: admission });
    },
    verifyOfficialRecoveryAdmission(authorization, context) {
      readExistingOfficialRecoveryAdmission(authorization, context.retention_recovery);
      if (!exactObject(verifyOfficialRecoveryGitContext(authorization), context.git_execution_context)) {
        throw new ConcreteRunnerError("OFFICIAL_RECOVERY_CONTEXT_INVALID");
      }
    },
    async runAuthorizedOfficialRecovery({ authorization, credentials, execution_context }) {
      try {
        const transport = officialTransport ?? createAdminV1OfficialConcreteTransport({ execution_context });
        return await recoverConcreteAdminV1OfficialRetention({ authorization, credentials, execution_context, transport, now_epoch_ms: nowEpochMs });
      } finally { for (const value of Object.values(credentials ?? {})) if (value instanceof Uint8Array) value.fill(0); }
    },
    verifyNoPriorOfficialRecovery(authorization) {
      const context = officialContexts.get(authorization.authorization_id_sha256);
      if (!context) return { status: "MISMATCH" };
      let existing;
      try {
        existing = context.journal.load();
      } catch {
        return { status: "MISMATCH" };
      }
      return classifyAdminV1OfficialPriorJournal(existing, authorization.schema_version);
    },
    async readLiveCredentials(authorization, credentialSourcePolicy) {
      const environment = readCredentialEnvironment({ repositoryRoot });
      const resolved = resolveCredentialEnvironment({
        environment,
        repositoryRoot,
      });
      if (
        canonicalJson(credentialSourcePolicy) !==
          canonicalJson(CONCRETE_CREDENTIAL_SOURCE_POLICY) ||
        canonicalJson(resolved.sources) !== canonicalJson(credentialSourcePolicy)
      ) {
        const mismatches = Object.keys(CONCRETE_CREDENTIAL_SOURCE_POLICY).filter(
          (category) => resolved.sources?.[category] !== credentialSourcePolicy?.[category],
        );
        const error = new ConcreteRunnerError(
          "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
        );
        error.invalid_credential_sources = Object.freeze(mismatches);
        throw error;
      }
      return loadConcreteLiveCredentials({
        environment: resolved.environment,
        authorization,
      });
    },
    async readOfficialCredentials(authorization, credentialSourcePolicy) {
      if (authorization?.schema_version === 2) {
        validateAdminV1OfficialAuthorization(authorization, { now_epoch_ms: nowEpochMs });
        validateOfficialIsolationAuthorization(authorization, nowEpochMs);
        const root = authorization.execution.journal_directory;
        const directory = lstatSync(root);
        if (!directory.isDirectory() || directory.isSymbolicLink() ||
          directory.uid !== lstatSync(authorization.repository.root).uid ||
          (directory.mode & 0o777) !== 0o700 || realpathSync(root) !== root) {
          throw new ConcreteRunnerError("OFFICIAL_ISOLATED_ROOT_INVALID");
        }
        let bundle;
        try {
          bundle = await readOfficialBundle({
            authorization, now_epoch_ms: nowEpochMs,
          });
          return loadAdminV1OfficialCredentials({
            authorization,
            credential_bundle: bundle,
            credential_source_policy: credentialSourcePolicy,
            now_epoch_ms: nowEpochMs,
          });
        } finally {
          for (const value of Object.values(bundle?.values ?? {})) {
            if (value instanceof Uint8Array) value.fill(0);
          }
        }
      }
      const environment = readCredentialEnvironment({ repositoryRoot });
      const resolved = resolveCredentialEnvironment({
        environment,
        repositoryRoot,
      });
      const officialSources = Object.freeze({
        ...resolved.sources,
        NODE_ENV: "PROVIDER_PRODUCTION_SEMANTICS",
      });
      if (
        canonicalJson(officialSources) !== canonicalJson(credentialSourcePolicy) ||
        canonicalJson(credentialSourcePolicy) !==
          canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY)
      ) throw new ConcreteRunnerError("OFFICIAL_CREDENTIAL_SOURCE_MISMATCH");
      return loadAdminV1OfficialCredentials({
        environment: { ...resolved.environment, NODE_ENV: "production" },
        credential_source_policy: officialSources,
      });
    },
    runAuthorizedQualification: runConcreteAuthorizedQualification,
    runAuthorizedOfficialRuntime({
      authorization,
      credentials,
      execution_context,
    }) {
      const concreteTransport = typeof officialTransport?.execute === "function"
        ? officialTransport
        : createAdminV1OfficialConcreteTransport({ execution_context });
      return runConcreteAdminV1OfficialRuntime({
        authorization,
        credentials,
        execution_context,
        transport: concreteTransport,
        now_epoch_ms: nowEpochMs,
      });
    },
    writeOutput,
  };
}

async function main() {
  const result = await dispatchConcreteQualificationRunner(
    process.argv.slice(2),
    createConcreteRunnerDependencies({
      writeOutput(value) {
        console.log(canonicalJson(value));
      },
    }),
  );
  process.exitCode = result.exit_code;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
