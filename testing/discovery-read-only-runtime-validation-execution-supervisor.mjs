import { spawn as nodeSpawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  accessSync,
  closeSync,
  constants as fsConstants,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_PATH = "/Users/jamescarlodumaua/aifinder";
const EXPECTED_BRANCH = "main";
const EXPECTED_ORIGIN = "https://github.com/jcdumaua/aifinder.git";
const SUPERVISOR_RELATIVE_PATH =
  "testing/discovery-read-only-runtime-validation-execution-supervisor.mjs";
const SUPERVISOR_PATH = path.join(REPOSITORY_PATH, SUPERVISOR_RELATIVE_PATH);
const OUTPUT_DIRECTORY_PATTERN =
  /^\/private\/tmp\/aifinder-runtime-validation-[0-9]{8}T[0-9]{6}Z-[A-Za-z0-9_-]{6,64}-output$/;
const LOWERCASE_SHA40_PATTERN = /^[0-9a-f]{40}$/;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/;
const MINIMUM_GIT_VERSION = Object.freeze([2, 35, 2]);
const MAX_IDENTITY_FILE_BYTES = 16 * 1024 * 1024;
const MAX_GIT_METADATA_FILE_BYTES = 1024 * 1024;
const MAX_EVIDENCE_BYTES = 65_536;
const LEASE_RECORD_BYTES = 512;
const LEASE_FILENAME = "active-child.lease";
const CHILD_REAP_GRACE_MS = 1_000;
const EXACT_VALIDATOR_SUCCESS = Buffer.from(
  '{"valid":true,"result_class":"VALID"}\n',
  "utf8",
);

export const CHILD_LIMITS = Object.freeze({
  timeoutMs: 10_000,
  stdoutMaxBytes: 1_048_576,
  stderrMaxBytes: 1_048_576,
  combinedMaxBytes: 2_097_152,
});

export const FIXED_COMMAND_IDS = Object.freeze([
  "GIT_VERSION",
  "GIT_BRANCH",
  "GIT_HEAD",
  "GIT_STATUS",
  "HARNESS_SYNTAX",
  "STATIC_TEST_SYNTAX",
  "VALIDATOR_SYNTAX",
  "EXECUTION_TEST_SYNTAX",
  "SUPERVISOR_SYNTAX",
  "STATIC_TESTS",
  "HARNESS",
  "VALIDATOR",
  "PBCOPY",
  "PBPASTE",
]);

const FIXED_COMMAND_ID_SET = new Set(FIXED_COMMAND_IDS);

const ACTIVE_IDENTITY_ENTRIES = Object.freeze([
  Object.freeze({
    path: "testing/discovery-read-only-runtime-validation-harness.mjs",
    sha256: "3a8150985251345b149531c736dedf07519bbfc5a316f1de601fbc56c4f3a0ef",
    mode: 0o755,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs",
    sha256: "9c2d9fba93e8df32e4a04f8b24221c3ee5361026519e37d8d618f244aa33229c",
    mode: 0o644,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "testing/discovery-read-only-runtime-validation-evidence-validator.mjs",
    sha256: "61340d21c4a2d97cdcce439aeb85a16fd54bae9538724dff4df3d554a298b60c",
    mode: 0o644,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "testing/discovery-read-only-runtime-validation-execution-contract.test.mjs",
    sha256: "9bc2e42d10dfe651b431ed152600280d4abd8748bbdb03e84a8c06160ef74f43",
    mode: 0o644,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md",
    sha256: "53c75f950458739612c8f8d65dd3c9b875dd6f0c164c10d1024d0599dac88e8f",
    mode: 0o644,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs",
    sha256: "1c27b39909d8b50d4aa046abb271592c79fa56688eb704525713e119afe6c17e",
    mode: 0o755,
    regular_file_required: true,
    symlink_rejected: true,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md",
    sha256: "c3cc24f772c79db7f3d8cb68a588c705c09a2874283e87a084f9603db912dc1e",
    mode: 0o644,
    regular_file_required: true,
    symlink_rejected: true,
  }),
]);

export const ACTIVE_IDENTITY_PATHS = Object.freeze(
  ACTIVE_IDENTITY_ENTRIES.map((entry) => entry.path),
);

export const POST_RUN_REQUIRED_FIELDS = Object.freeze([
  "repository_path_match",
  "main_worktree_match",
  "branch_match",
  "head_match",
  "local_main_match",
  "local_origin_main_match",
  "origin_match",
  "tracked_tree_clean",
  "index_empty",
  "untracked_count",
  "expected_excluded_set_match",
  "expected_excluded_hash_match",
  "expected_excluded_mode_match",
  "active_identity_match",
  "unchanged_dependency_identity_match",
  "supervisor_identity_match",
  "active_child_count",
  "active_timer_count",
]);

const EXCLUDED_IDENTITIES = Object.freeze([
  Object.freeze({
    path: "docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md",
    sha256: "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12",
    mode: 0o644,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md",
    sha256: "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a",
    mode: 0o644,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md",
    sha256: "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723",
    mode: 0o644,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md",
    sha256: "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca",
    mode: 0o644,
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md",
    sha256: "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45",
    mode: 0o644,
  }),
]);

const GIT_CONFIG_OVERRIDE_ARGS = Object.freeze([
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.untrackedCache=false",
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "credential.helper=",
  "-c",
  "credential.interactive=false",
  "-c",
  "diff.external=",
]);

const NODE_CHILD_IDS = new Set([
  "HARNESS_SYNTAX",
  "STATIC_TEST_SYNTAX",
  "VALIDATOR_SYNTAX",
  "EXECUTION_TEST_SYNTAX",
  "SUPERVISOR_SYNTAX",
  "STATIC_TESTS",
  "HARNESS",
  "VALIDATOR",
]);

const SYNTAX_PATH_BY_ID = Object.freeze({
  HARNESS_SYNTAX: "testing/discovery-read-only-runtime-validation-harness.mjs",
  STATIC_TEST_SYNTAX:
    "testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs",
  VALIDATOR_SYNTAX:
    "testing/discovery-read-only-runtime-validation-evidence-validator.mjs",
  EXECUTION_TEST_SYNTAX:
    "testing/discovery-read-only-runtime-validation-execution-contract.test.mjs",
  SUPERVISOR_SYNTAX: SUPERVISOR_RELATIVE_PATH,
});

const RESULT_CLASS = Object.freeze({
  SUCCESS: "SUCCESS",
  NONZERO_EXIT: "NONZERO_EXIT",
  NO_EXIT_STATUS: "NO_EXIT_STATUS",
  SIGNAL_TERMINATION: "SIGNAL_TERMINATION",
  TIMEOUT: "TIMEOUT",
  STDOUT_LIMIT_EXCEEDED: "STDOUT_LIMIT_EXCEEDED",
  STDERR_LIMIT_EXCEEDED: "STDERR_LIMIT_EXCEEDED",
  COMBINED_LIMIT_EXCEEDED: "COMBINED_LIMIT_EXCEEDED",
  SPAWN_ERROR: "SPAWN_ERROR",
  PROCESS_GROUP_TERMINATION_FAILED: "PROCESS_GROUP_TERMINATION_FAILED",
  CHILD_REAP_FAILED: "CHILD_REAP_FAILED",
  OUTPUT_MALFORMED: "OUTPUT_MALFORMED",
  OUTPUT_MULTIPLE_RECORDS: "OUTPUT_MULTIPLE_RECORDS",
  OUTPUT_MISSING: "OUTPUT_MISSING",
  IDENTITY_MISMATCH: "IDENTITY_MISMATCH",
  REPOSITORY_STATE_MISMATCH: "REPOSITORY_STATE_MISMATCH",
  VERSION_UNSUPPORTED: "VERSION_UNSUPPORTED",
  VERSION_MALFORMED: "VERSION_MALFORMED",
  VALIDATION_REJECTED: "VALIDATION_REJECTED",
  CLIPBOARD_MISMATCH: "CLIPBOARD_MISMATCH",
  UNKNOWN_COMMAND: "UNKNOWN_COMMAND",
  ARGUMENTS_PROHIBITED: "ARGUMENTS_PROHIBITED",
  ENVIRONMENT_INVALID: "ENVIRONMENT_INVALID",
  OUTPUT_DIRECTORY_INVALID: "OUTPUT_DIRECTORY_INVALID",
  EVIDENCE_WRITE_FAILED: "EVIDENCE_WRITE_FAILED",
  ACTIVE_CHILD_LEASE_FAILED: "ACTIVE_CHILD_LEASE_FAILED",
  INTERNAL_CONTRACT_FAILURE: "INTERNAL_CONTRACT_FAILURE",
});

class ContractFailure extends Error {
  constructor(resultClass) {
    super(resultClass);
    this.name = "ContractFailure";
    this.result_class = resultClass;
    this.resultClass = resultClass;
  }
}

function fail(resultClass) {
  throw new ContractFailure(resultClass);
}

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeAbsoluteRepositoryPath(relativePath) {
  const absolutePath = path.resolve(REPOSITORY_PATH, relativePath);
  if (absolutePath !== REPOSITORY_PATH
    && !absolutePath.startsWith(`${REPOSITORY_PATH}${path.sep}`)) {
    fail(RESULT_CLASS.IDENTITY_MISMATCH);
  }
  return absolutePath;
}

function noFollowFlag() {
  return Number.isInteger(fsConstants.O_NOFOLLOW) ? fsConstants.O_NOFOLLOW : 0;
}

function writeAll(fd, bytes, position = null) {
  let offset = 0;
  while (offset < bytes.length) {
    const written = writeSync(
      fd,
      bytes,
      offset,
      bytes.length - offset,
      position === null ? null : position + offset,
    );
    if (!Number.isInteger(written) || written <= 0) {
      fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
    }
    offset += written;
  }
}

function readBoundedRegularFile(
  absolutePath,
  maximumBytes,
  expectedMode = null,
  failureClass = RESULT_CLASS.IDENTITY_MISMATCH,
) {
  let fd;
  try {
    const before = lstatSync(absolutePath);
    if (!before.isFile() || before.isSymbolicLink()) fail(failureClass);
    if (before.size < 0 || before.size > maximumBytes) fail(failureClass);
    if (expectedMode !== null && (before.mode & 0o777) !== expectedMode) fail(failureClass);
    fd = openSync(absolutePath, fsConstants.O_RDONLY | noFollowFlag());
    const opened = fstatSync(fd);
    if (!opened.isFile()
      || opened.dev !== before.dev
      || opened.ino !== before.ino
      || opened.size < 0
      || opened.size > maximumBytes) {
      fail(failureClass);
    }
    if (expectedMode !== null && (opened.mode & 0o777) !== expectedMode) fail(failureClass);
    const bytes = readFileSync(fd);
    if (bytes.length !== opened.size || bytes.length > maximumBytes) fail(failureClass);
    return bytes;
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    fail(failureClass);
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // The primary categorical failure, if any, remains authoritative.
      }
    }
  }
}

function verifyCreatedOutputFile(outputAuthority, outputPath, fd) {
  const opened = fstatSync(fd);
  const linked = lstatSync(outputPath);
  if (!opened.isFile()
    || !linked.isFile()
    || linked.isSymbolicLink()
    || opened.dev !== linked.dev
    || opened.ino !== linked.ino
    || (opened.mode & 0o777) !== 0o600
    || (linked.mode & 0o777) !== 0o600
    || opened.uid !== outputAuthority.uid
    || linked.uid !== outputAuthority.uid) {
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  }
}

function writeExclusiveOutputFile(outputAuthority, filename, bytes) {
  if (!/^[a-z0-9][a-z0-9.-]{0,127}$/.test(filename)) {
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  }
  if (!Buffer.isBuffer(bytes) || bytes.length > CHILD_LIMITS.combinedMaxBytes) {
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  }
  revalidateOutputDirectoryAuthority(outputAuthority);
  const outputPath = path.join(outputAuthority.path, filename);
  if (path.dirname(outputPath) !== outputAuthority.path) fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  // Node exposes no openat-style dirfd-relative create. The retained directory
  // descriptor plus before/after identity checks detects every observable
  // replacement, while a same-UID swap-and-restore between checks remains a
  // documented platform residual rather than a claimed dirfd-safety property.
  let fd;
  try {
    fd = openSync(
      outputPath,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | noFollowFlag(),
      0o600,
    );
    verifyCreatedOutputFile(outputAuthority, outputPath, fd);
    revalidateOutputDirectoryAuthority(outputAuthority);
    writeAll(fd, bytes);
    fsyncSync(fd);
    verifyCreatedOutputFile(outputAuthority, outputPath, fd);
    revalidateOutputDirectoryAuthority(outputAuthority);
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // The output is never accepted unless every preceding operation succeeded.
      }
    }
  }
}

export function parseGitVersion(value) {
  if (typeof value !== "string") return null;
  const match = /^git version ([0-9]+)\.([0-9]+)\.([0-9]+)(?: \(Apple Git-([0-9]+)\))?$/.exec(value);
  if (!match) return null;
  const numericStrings = match.slice(1).filter((entry) => entry !== undefined);
  const numbers = numericStrings.map((entry) => Number(entry));
  if (numbers.some((entry) => !Number.isSafeInteger(entry) || entry < 0)) return null;
  return Object.freeze(numbers.slice(0, 3));
}

export function isGitVersionSupported(version) {
  if (!Array.isArray(version) || version.length !== 3) return false;
  if (version.some((entry) => !Number.isSafeInteger(entry) || entry < 0)) return false;
  for (let index = 0; index < MINIMUM_GIT_VERSION.length; index += 1) {
    if (version[index] > MINIMUM_GIT_VERSION[index]) return true;
    if (version[index] < MINIMUM_GIT_VERSION[index]) return false;
  }
  return true;
}

export function validateCanonicalOutputDirectoryPath(value) {
  return typeof value === "string"
    && value.length <= 160
    && OUTPUT_DIRECTORY_PATTERN.test(value)
    && path.isAbsolute(value)
    && path.normalize(value) === value;
}

export function buildChildEnvironment(commandId, context) {
  if (!FIXED_COMMAND_ID_SET.has(commandId)) fail(RESULT_CLASS.UNKNOWN_COMMAND);
  if (["GIT_VERSION", "GIT_BRANCH", "GIT_HEAD", "GIT_STATUS"].includes(commandId)) {
    return Object.freeze({
      LANG: "C",
      LC_ALL: "C",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
      GIT_PAGER: "cat",
      PAGER: "cat",
    });
  }
  if (commandId === "HARNESS") {
    if (!LOWERCASE_SHA40_PATTERN.test(context?.expectedBaseline ?? "")) {
      fail(RESULT_CLASS.ENVIRONMENT_INVALID);
    }
    return Object.freeze({
      LANG: "C",
      LC_ALL: "C",
      AIFINDER_EXPECTED_EXECUTION_BASELINE: context.expectedBaseline,
    });
  }
  return Object.freeze({ LANG: "C", LC_ALL: "C" });
}

function fixedNodeExecutable(context) {
  const executable = context?.nodeExecutable ?? context?.expectedNodeExecutable;
  if (typeof executable !== "string" || !path.isAbsolute(executable)) {
    fail(RESULT_CLASS.ENVIRONMENT_INVALID);
  }
  return executable;
}

function fixedRepositoryPath(context) {
  const repositoryPath = context?.repositoryPath ?? REPOSITORY_PATH;
  if (repositoryPath !== REPOSITORY_PATH) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  return repositoryPath;
}

function commandArguments(commandId, context) {
  const repositoryPath = fixedRepositoryPath(context);
  if (commandId === "GIT_VERSION") return Object.freeze(["--version"]);
  if (commandId === "GIT_BRANCH") {
    return Object.freeze([...GIT_CONFIG_OVERRIDE_ARGS, "branch", "--show-current"]);
  }
  if (commandId === "GIT_HEAD") {
    return Object.freeze([
      ...GIT_CONFIG_OVERRIDE_ARGS,
      "rev-parse",
      "HEAD",
      "refs/heads/main",
      "refs/remotes/origin/main",
    ]);
  }
  if (commandId === "GIT_STATUS") {
    return Object.freeze([
      ...GIT_CONFIG_OVERRIDE_ARGS,
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]);
  }
  if (Object.hasOwn(SYNTAX_PATH_BY_ID, commandId)) {
    return Object.freeze(["--check", path.join(repositoryPath, SYNTAX_PATH_BY_ID[commandId])]);
  }
  if (commandId === "STATIC_TESTS") {
    return Object.freeze([
      "--test",
      path.join(
        repositoryPath,
        "testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs",
      ),
      path.join(
        repositoryPath,
        "testing/discovery-read-only-runtime-validation-execution-contract.test.mjs",
      ),
    ]);
  }
  if (commandId === "HARNESS") {
    return Object.freeze([
      path.join(repositoryPath, "testing/discovery-read-only-runtime-validation-harness.mjs"),
    ]);
  }
  if (commandId === "VALIDATOR") {
    return Object.freeze([
      path.join(
        repositoryPath,
        "testing/discovery-read-only-runtime-validation-evidence-validator.mjs",
      ),
      "DEFAULT_GUARD_SKIPPED",
    ]);
  }
  if (commandId === "PBCOPY" || commandId === "PBPASTE") return Object.freeze([]);
  fail(RESULT_CLASS.UNKNOWN_COMMAND);
}

export function getFixedCommandSpec(commandId, context) {
  if (!FIXED_COMMAND_ID_SET.has(commandId)) fail(RESULT_CLASS.UNKNOWN_COMMAND);
  const repositoryPath = fixedRepositoryPath(context);
  const outputDirectory = context?.outputDirectory;
  const clipboardCommand = commandId === "PBCOPY" || commandId === "PBPASTE";
  if (clipboardCommand && !validateCanonicalOutputDirectoryPath(outputDirectory)) {
    fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
  }
  const executable = commandId.startsWith("GIT_")
    ? "/usr/bin/git"
    : commandId === "PBCOPY"
      ? "/usr/bin/pbcopy"
      : commandId === "PBPASTE"
        ? "/usr/bin/pbpaste"
        : fixedNodeExecutable(context);
  const persistRaw = NODE_CHILD_IDS.has(commandId);
  return Object.freeze({
    id: commandId,
    executable,
    args: commandArguments(commandId, context),
    cwd: clipboardCommand ? outputDirectory : repositoryPath,
    environment: buildChildEnvironment(commandId, context),
    stdinPolicy: commandId === "VALIDATOR" || commandId === "PBCOPY" ? "pipe" : "ignore",
    expectedExitStatus: 0,
    timeoutMs: CHILD_LIMITS.timeoutMs,
    stdoutMaxBytes: CHILD_LIMITS.stdoutMaxBytes,
    stderrMaxBytes: CHILD_LIMITS.stderrMaxBytes,
    combinedMaxBytes: CHILD_LIMITS.combinedMaxBytes,
    authenticateStdout: [
      "GIT_VERSION",
      "GIT_BRANCH",
      "GIT_HEAD",
      "GIT_STATUS",
      "HARNESS",
      "VALIDATOR",
      "PBCOPY",
      "PBPASTE",
    ].includes(commandId),
    persistStdout: persistRaw,
    persistStderr: persistRaw,
  });
}

function lengthClass(byteCount) {
  if (!Number.isSafeInteger(byteCount) || byteCount < 0) {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  if (byteCount === 0) return "EMPTY";
  if (byteCount <= 64) return "UP_TO_64_BYTES";
  if (byteCount <= 1024) return "UP_TO_1_KIB";
  if (byteCount <= 65_536) return "UP_TO_64_KIB";
  return "UP_TO_1_MIB";
}

export function classifyCaptureMetadata(stdoutBytes, stderrBytes) {
  return Object.freeze({
    stdout_present: stdoutBytes > 0,
    stderr_present: stderrBytes > 0,
    stdout_length_class: lengthClass(stdoutBytes),
    stderr_length_class: lengthClass(stderrBytes),
  });
}

function decodeUtf8Strict(bytes, failureClass = RESULT_CLASS.OUTPUT_MALFORMED) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(failureClass);
  }
}

export function validateHarnessStdout(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) fail(RESULT_CLASS.OUTPUT_MISSING);
  if (bytes.length > CHILD_LIMITS.stdoutMaxBytes) fail(RESULT_CLASS.STDOUT_LIMIT_EXCEEDED);
  if (bytes[bytes.length - 1] !== 0x0a) fail(RESULT_CLASS.OUTPUT_MALFORMED);
  if (bytes.subarray(0, bytes.length - 1).includes(0x0a)) {
    fail(RESULT_CLASS.OUTPUT_MULTIPLE_RECORDS);
  }
  const text = decodeUtf8Strict(bytes.subarray(0, bytes.length - 1));
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  if (!isPlainObject(parsed)) fail(RESULT_CLASS.OUTPUT_MALFORMED);
  return Object.freeze({ ...parsed });
}

export function validateExactValidatorSuccess(bytes) {
  return Buffer.isBuffer(bytes)
    && bytes.length === EXACT_VALIDATOR_SUCCESS.length
    && timingSafeEqual(bytes, EXACT_VALIDATOR_SUCCESS);
}

const EVIDENCE_CONTEXT_VALUE_RULES = Object.freeze({
  result: (value, expectedResult) => value === expectedResult,
  harness_status: (value) => value === "SKIPPED_BY_DEFAULT",
  post_run_state: (value) => value === "VERIFIED",
  active_child_count: (value) => value === 0,
  active_timer_count: (value) => value === 0,
  execution_authorized: (value) => value === false,
});
const COMPLETE_EVIDENCE_CONTEXT_KEYS = Object.freeze(
  Object.keys(EVIDENCE_CONTEXT_VALUE_RULES),
);

function copyExactEvidenceContext(context, expectedResult) {
  if (!isPlainObject(context)) fail(RESULT_CLASS.OUTPUT_MALFORMED);
  const contextKeys = Object.keys(context);
  const isMinimalExportedHelperProfile = contextKeys.length === 1
    && contextKeys[0] === "result";
  const isCompleteRuntimeProfile = contextKeys.length === COMPLETE_EVIDENCE_CONTEXT_KEYS.length
    && COMPLETE_EVIDENCE_CONTEXT_KEYS.every((key) => Object.hasOwn(context, key));
  if (!isMinimalExportedHelperProfile && !isCompleteRuntimeProfile) {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  const copied = {};
  for (const [key, value] of Object.entries(context)) {
    const rule = EVIDENCE_CONTEXT_VALUE_RULES[key];
    if (typeof rule !== "function" || !rule(value, expectedResult)) {
      fail(RESULT_CLASS.OUTPUT_MALFORMED);
    }
    copied[key] = value;
  }
  if (copied.result !== expectedResult) fail(RESULT_CLASS.OUTPUT_MALFORMED);
  return copied;
}

export function buildPreliminaryEvidence(context) {
  return Object.freeze({
    ...copyExactEvidenceContext(context, "PENDING"),
    CLIPBOARD_COPY: "PENDING",
    CLIPBOARD_VERIFY: "PENDING",
    CLIPBOARD_ROUND_TRIP: false,
  });
}

export function buildFinalEvidence(context) {
  return Object.freeze({
    ...copyExactEvidenceContext(context, "PASSED"),
    CLIPBOARD_COPY: "SUCCESS",
    CLIPBOARD_VERIFY: "SUCCESS",
    CLIPBOARD_ROUND_TRIP: true,
  });
}

export function reverseNormalizeEphemeralWrapper(ephemeralText, bindings) {
  if (typeof ephemeralText !== "string" || !isPlainObject(bindings)) {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  const replacements = [
    ["EXPECTED_EXECUTION_BASELINE", bindings.expectedExecutionBaseline],
    ["NODE_EXECUTABLE", bindings.nodeExecutable],
    ["OUTPUT_DIRECTORY", bindings.outputDirectory],
  ];
  let normalized = ephemeralText;
  for (const [name, value] of replacements) {
    if (typeof value !== "string" || /[\r\n\u0000]/.test(value)) {
      fail(RESULT_CLASS.OUTPUT_MALFORMED);
    }
    const boundLine = `${name}="${value}"`;
    const sentinelLine = `${name}="__BIND_AT_EXECUTION_GATE__"`;
    if (normalized.split(boundLine).length - 1 !== 1) fail(RESULT_CLASS.OUTPUT_MALFORMED);
    normalized = normalized.replace(boundLine, sentinelLine);
  }
  return normalized;
}

export function getActiveIdentityTable() {
  return ACTIVE_IDENTITY_ENTRIES;
}

export function getIdentityAllocation() {
  return Object.freeze({
    active_source_identities: "SUPERVISOR_FIXED_TABLE",
    supervisor_identity: "WRAPPER_ENVIRONMENT_SHA256",
    wrapper_identity: "EXTERNAL_GATE",
  });
}

export function validatePostRunVerification(state) {
  if (!isPlainObject(state)) return false;
  for (const field of POST_RUN_REQUIRED_FIELDS) {
    if (!Object.hasOwn(state, field)) return false;
  }
  for (const field of POST_RUN_REQUIRED_FIELDS) {
    if (field === "untracked_count") {
      if (state[field] !== 5) return false;
    } else if (field === "active_child_count" || field === "active_timer_count") {
      if (state[field] !== 0) return false;
    } else if (state[field] !== true) {
      return false;
    }
  }
  return true;
}

export function buildClipboardSequence() {
  return Object.freeze(["PBCOPY", "PBPASTE", "PBCOPY", "PBPASTE"]);
}

function requireSuccessfulChildEnvelope(envelope, failureClass) {
  if (!isPlainObject(envelope)
    || !isPlainObject(envelope.result)
    || envelope.result.success !== true
    || envelope.result.result_class !== RESULT_CLASS.SUCCESS
    || !Buffer.isBuffer(envelope.stdout)
    || !Buffer.isBuffer(envelope.stderr)) {
    fail(failureClass);
  }
}

export async function performTwoPassClipboardRoundTrip(
  preliminaryBytes,
  finalBytes,
  dependencies,
) {
  if (!Buffer.isBuffer(preliminaryBytes)
    || !Buffer.isBuffer(finalBytes)
    || preliminaryBytes.length === 0
    || finalBytes.length === 0
    || preliminaryBytes.length > MAX_EVIDENCE_BYTES
    || finalBytes.length > MAX_EVIDENCE_BYTES
    || !dependencies
    || typeof dependencies.runChild !== "function"
    || typeof dependencies.persistFinalEvidence !== "function"
    || (dependencies.awaitSignalCheckpoint !== undefined
      && typeof dependencies.awaitSignalCheckpoint !== "function")) {
    fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  }
  const assertNotAborted = typeof dependencies.assertNotAborted === "function"
    ? dependencies.assertNotAborted
    : () => {};

  const preliminaryCopy = await dependencies.runChild("PBCOPY", {
    stdinBytes: preliminaryBytes,
  });
  assertNotAborted();
  requireSuccessfulChildEnvelope(preliminaryCopy, RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (preliminaryCopy.stdout.length !== 0 || preliminaryCopy.stderr.length !== 0) {
    fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  }
  const preliminaryPaste = await dependencies.runChild("PBPASTE");
  assertNotAborted();
  requireSuccessfulChildEnvelope(preliminaryPaste, RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (preliminaryPaste.stderr.length !== 0) fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (preliminaryPaste.stdout.length !== preliminaryBytes.length
    || !timingSafeEqual(preliminaryPaste.stdout, preliminaryBytes)) {
    fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  }

  const finalCopy = await dependencies.runChild("PBCOPY", { stdinBytes: finalBytes });
  assertNotAborted();
  requireSuccessfulChildEnvelope(finalCopy, RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (finalCopy.stdout.length !== 0 || finalCopy.stderr.length !== 0) {
    fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  }
  const finalPaste = await dependencies.runChild("PBPASTE");
  assertNotAborted();
  requireSuccessfulChildEnvelope(finalPaste, RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (finalPaste.stderr.length !== 0) fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  if (finalPaste.stdout.length !== finalBytes.length
    || !timingSafeEqual(finalPaste.stdout, finalBytes)) {
    fail(RESULT_CLASS.CLIPBOARD_MISMATCH);
  }

  if (typeof dependencies.awaitSignalCheckpoint === "function") {
    assertNotAborted();
    await dependencies.awaitSignalCheckpoint();
    assertNotAborted();
  }
  assertNotAborted();
  await dependencies.persistFinalEvidence(finalBytes);
  assertNotAborted();
  return Object.freeze({ success: true, result_class: RESULT_CLASS.SUCCESS });
}

function defaultTerminateProcessGroup(groupPid, signal) {
  try {
    process.kill(groupPid, signal);
    return true;
  } catch (error) {
    if (error && error.code === "ESRCH") return true;
    return false;
  }
}

function boundedCounterAdd(current, increment) {
  if (!Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(increment) || increment < 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  if (current > Number.MAX_SAFE_INTEGER - increment) return Number.MAX_SAFE_INTEGER;
  return current + increment;
}

function appendBounded(chunks, retainedBytes, chunk, maximumBytes) {
  const remaining = Math.max(0, maximumBytes - retainedBytes);
  if (remaining === 0) return retainedBytes;
  const retainedChunk = chunk.length <= remaining ? chunk : chunk.subarray(0, remaining);
  if (retainedChunk.length > 0) chunks.push(Buffer.from(retainedChunk));
  return retainedBytes + retainedChunk.length;
}

function emptyChildResult(commandId, resultClass, overrides = {}) {
  return Object.freeze({
    command_id: commandId,
    success: false,
    result_class: resultClass,
    exit_status: null,
    signal_present: false,
    timed_out: false,
    stdout_limit_exceeded: false,
    stderr_limit_exceeded: false,
    combined_limit_exceeded: false,
    stdout_bytes: 0,
    stderr_bytes: 0,
    stdout_present: false,
    stderr_present: false,
    stdout_length_class: "EMPTY",
    stderr_length_class: "EMPTY",
    process_group_termination_attempted: false,
    process_group_termination_succeeded: false,
    child_reaped: false,
    timer_cleared: true,
    settlement_count: 1,
    ...overrides,
  });
}

function markLease(runtimeState, record) {
  if (!runtimeState?.lease) return;
  try {
    runtimeState.lease.write(record);
  } catch {
    fail(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
  }
}

export async function runBoundedChild(commandId, context, dependencies = {}) {
  const spec = getFixedCommandSpec(commandId, context);
  const spawn = dependencies.spawn ?? nodeSpawn;
  const setTimer = dependencies.setTimeout ?? setTimeout;
  const clearTimer = dependencies.clearTimeout ?? clearTimeout;
  const setLifecycleTimer = dependencies.setLifecycleTimeout ?? setTimeout;
  const clearLifecycleTimer = dependencies.clearLifecycleTimeout ?? clearTimeout;
  const terminateProcessGroup = dependencies.terminateProcessGroup
    ?? defaultTerminateProcessGroup;
  const runtimeState = context?.runtimeState ?? null;

  markLease(runtimeState, {
    state: "STARTING",
    pgid: 0,
    sequence: runtimeState?.sequence ?? 0,
    command_id: commandId,
  });

  let child;
  try {
    child = spawn(spec.executable, [...spec.args], {
      cwd: spec.cwd,
      env: buildChildEnvironment(commandId, context),
      shell: false,
      detached: true,
      stdio: [spec.stdinPolicy === "pipe" ? "pipe" : "ignore", "pipe", "pipe"],
    });
  } catch {
    let resultClass = RESULT_CLASS.SPAWN_ERROR;
    try {
      markLease(runtimeState, {
        state: "INACTIVE",
        pgid: 0,
        sequence: runtimeState?.sequence ?? 0,
        command_id: commandId,
      });
    } catch {
      resultClass = RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED;
    }
    return Object.freeze({
      result: emptyChildResult(commandId, resultClass),
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0),
    });
  }

  return new Promise((resolve) => {
    const hasChildEvents = child !== null
      && typeof child === "object"
      && typeof child.on === "function"
      && typeof child.removeListener === "function";
    const hasValidPid = Number.isSafeInteger(child?.pid) && child.pid > 1;
    const hasStdout = child?.stdout
      && typeof child.stdout.on === "function"
      && typeof child.stdout.removeListener === "function";
    const hasStderr = child?.stderr
      && typeof child.stderr.on === "function"
      && typeof child.stderr.removeListener === "function";
    const completeChildShape = hasChildEvents && hasValidPid && hasStdout && hasStderr;
    const negativeGroupPid = hasValidPid ? -child.pid : null;
    const recordKey = hasValidPid ? child.pid : Symbol(commandId);
    let stdoutByteCount = 0;
    let stderrByteCount = 0;
    let stdoutRetainedBytes = 0;
    let stderrRetainedBytes = 0;
    const stdoutChunks = [];
    const stderrChunks = [];
    let terminalCause = null;
    let exitStatus = null;
    let exitSignal = null;
    let exitObserved = false;
    let settlementCount = 0;
    let settled = false;
    let settling = false;
    let timerHandle;
    let timerCleared = true;
    let reapTimerHandle;
    let terminationAttempted = false;
    let terminationSucceeded = false;
    let terminationPromise = null;
    let stdoutLimitExceeded = false;
    let stderrLimitExceeded = false;
    let combinedLimitExceeded = false;
    let resolveReap;
    const reapPromise = new Promise((resolveReapPromise) => { resolveReap = resolveReapPromise; });
    const activeRecord = {
      commandId,
      child,
      groupPid: negativeGroupPid,
      terminate: null,
      closed: false,
      closedPromise: reapPromise,
      awaitReap: () => reapPromise,
    };
    runtimeState?.activeChildren?.set(recordKey, activeRecord);

    const clearFixedTimer = () => {
      if (timerHandle === undefined) return;
      timerCleared = true;
      clearTimer(timerHandle);
      runtimeState?.activeTimers?.delete(timerHandle);
      timerHandle = undefined;
    };

    const clearReapTimer = () => {
      if (reapTimerHandle === undefined) return;
      clearLifecycleTimer(reapTimerHandle);
      runtimeState?.activeTimers?.delete(reapTimerHandle);
      reapTimerHandle = undefined;
    };

    const childExitObserved = () => exitObserved
      || Number.isInteger(child?.exitCode)
      || (typeof child?.signalCode === "string" && child.signalCode.length > 0);

    const terminateOnce = () => {
      if (terminationPromise) return terminationPromise;
      if (!hasValidPid) return Promise.resolve(false);
      if (childExitObserved()) return Promise.resolve(true);

      terminationAttempted = true;
      let resolveTerminationPromise;
      terminationPromise = new Promise((resolveTermination) => {
        resolveTerminationPromise = resolveTermination;
      });

      let completed = false;
      let terminationTimer;
      const finishTermination = (value) => {
        if (completed) return;
        completed = true;
        if (terminationTimer !== undefined) {
          clearLifecycleTimer(terminationTimer);
          runtimeState?.activeTimers?.delete(terminationTimer);
        }
        terminationSucceeded = value === true;
        resolveTerminationPromise(terminationSucceeded);
      };

      try {
        terminationTimer = setLifecycleTimer(
          () => finishTermination(false),
          CHILD_REAP_GRACE_MS,
        );
        runtimeState?.activeTimers?.add(terminationTimer);
      } catch {
        finishTermination(false);
        return terminationPromise;
      }

      let terminationResult;
      try {
        // Invoke in the current JavaScript turn. Do not add a microtask window
        // between authorizing termination and signaling the still-live group leader.
        terminationResult = terminateProcessGroup(negativeGroupPid, "SIGKILL");
      } catch {
        finishTermination(false);
        return terminationPromise;
      }
      Promise.resolve(terminationResult)
        .then((value) => finishTermination(value === true))
        .catch(() => finishTermination(false));
      return terminationPromise;
    };

    const onStdoutData = (value) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const nextStreamCount = boundedCounterAdd(stdoutByteCount, chunk.length);
      const nextCombinedCount = boundedCounterAdd(nextStreamCount, stderrByteCount);
      stdoutByteCount = nextStreamCount;
      const combinedRemaining = Math.max(
        0,
        spec.combinedMaxBytes - stdoutRetainedBytes - stderrRetainedBytes,
      );
      stdoutRetainedBytes = appendBounded(
        stdoutChunks,
        stdoutRetainedBytes,
        chunk.subarray(0, combinedRemaining),
        spec.stdoutMaxBytes,
      );
      stdoutLimitExceeded ||= nextStreamCount > spec.stdoutMaxBytes;
      combinedLimitExceeded ||= nextCombinedCount > spec.combinedMaxBytes;
      if (combinedLimitExceeded) requestTerminal(RESULT_CLASS.COMBINED_LIMIT_EXCEEDED);
      else if (stdoutLimitExceeded) requestTerminal(RESULT_CLASS.STDOUT_LIMIT_EXCEEDED);
    };

    const onStderrData = (value) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const nextStreamCount = boundedCounterAdd(stderrByteCount, chunk.length);
      const nextCombinedCount = boundedCounterAdd(stdoutByteCount, nextStreamCount);
      stderrByteCount = nextStreamCount;
      const combinedRemaining = Math.max(
        0,
        spec.combinedMaxBytes - stdoutRetainedBytes - stderrRetainedBytes,
      );
      stderrRetainedBytes = appendBounded(
        stderrChunks,
        stderrRetainedBytes,
        chunk.subarray(0, combinedRemaining),
        spec.stderrMaxBytes,
      );
      stderrLimitExceeded ||= nextStreamCount > spec.stderrMaxBytes;
      combinedLimitExceeded ||= nextCombinedCount > spec.combinedMaxBytes;
      if (combinedLimitExceeded) requestTerminal(RESULT_CLASS.COMBINED_LIMIT_EXCEEDED);
      else if (stderrLimitExceeded) requestTerminal(RESULT_CLASS.STDERR_LIMIT_EXCEEDED);
    };

    const onStreamError = () => requestTerminal(RESULT_CLASS.SPAWN_ERROR);
    const onChildError = () => requestTerminal(RESULT_CLASS.SPAWN_ERROR);
    const onStdinDrain = () => {
      try {
        child.stdin.end();
      } catch {
        requestTerminal(RESULT_CLASS.SPAWN_ERROR);
      }
    };
    const onExit = (status, signal) => {
      exitObserved = true;
      exitStatus = Number.isInteger(status) ? status : null;
      exitSignal = typeof signal === "string" && signal.length > 0 ? signal : null;
      clearFixedTimer();
      armReapDeadline();
    };

    const removeListenerSafely = (target, eventName, listener) => {
      try {
        target?.removeListener?.(eventName, listener);
      } catch {
        // Malformed spawn returns must still reach bounded categorical settlement.
      }
    };
    const removeListeners = () => {
      removeListenerSafely(child, "close", onClose);
      removeListenerSafely(child, "error", onChildError);
      removeListenerSafely(child, "exit", onExit);
      removeListenerSafely(child?.stdout, "data", onStdoutData);
      removeListenerSafely(child?.stdout, "error", onStreamError);
      removeListenerSafely(child?.stderr, "data", onStderrData);
      removeListenerSafely(child?.stderr, "error", onStreamError);
      removeListenerSafely(child?.stdin, "error", onStreamError);
      removeListenerSafely(child?.stdin, "drain", onStdinDrain);
    };

    const buildEnvelope = (resultClass, childReaped) => {
      const metadata = classifyCaptureMetadata(stdoutByteCount, stderrByteCount);
      const result = Object.freeze({
        command_id: commandId,
        success: resultClass === RESULT_CLASS.SUCCESS,
        result_class: resultClass,
        exit_status: exitStatus,
        signal_present: exitSignal !== null,
        timed_out: terminalCause === RESULT_CLASS.TIMEOUT,
        stdout_limit_exceeded: stdoutLimitExceeded,
        stderr_limit_exceeded: stderrLimitExceeded,
        combined_limit_exceeded: combinedLimitExceeded,
        stdout_bytes: stdoutByteCount,
        stderr_bytes: stderrByteCount,
        stdout_present: metadata.stdout_present,
        stderr_present: metadata.stderr_present,
        stdout_length_class: metadata.stdout_length_class,
        stderr_length_class: metadata.stderr_length_class,
        process_group_termination_attempted: terminationAttempted,
        process_group_termination_succeeded: terminationSucceeded,
        child_reaped: childReaped,
        timer_cleared: timerCleared,
        settlement_count: settlementCount,
      });
      return Object.freeze({
        result,
        stdout: Buffer.concat(stdoutChunks, stdoutRetainedBytes),
        stderr: Buffer.concat(stderrChunks, stderrRetainedBytes),
      });
    };

    const settleUnreaped = () => {
      if (settled || settling) return;
      settled = true;
      settlementCount += 1;
      removeListeners();
      clearFixedTimer();
      clearReapTimer();
      resolveReap(false);
      const resultClass = terminationAttempted && !terminationSucceeded
        ? RESULT_CLASS.PROCESS_GROUP_TERMINATION_FAILED
        : RESULT_CLASS.CHILD_REAP_FAILED;
      resolve(buildEnvelope(resultClass, false));
    };

    const armReapDeadline = () => {
      if (reapTimerHandle !== undefined || settled || settling) return;
      try {
        reapTimerHandle = setLifecycleTimer(settleUnreaped, CHILD_REAP_GRACE_MS);
        runtimeState?.activeTimers?.add(reapTimerHandle);
      } catch {
        settleUnreaped();
      }
    };

    const requestTerminal = (resultClass) => {
      if (resultClass === RESULT_CLASS.TIMEOUT && childExitObserved()) {
        armReapDeadline();
        return;
      }
      if (terminalCause === null) terminalCause = resultClass;
      if (!childExitObserved() && hasValidPid) void terminateOnce();
      armReapDeadline();
    };
    activeRecord.terminate = () => {
      requestTerminal(runtimeState?.abortClass ?? RESULT_CLASS.SIGNAL_TERMINATION);
      return terminateOnce();
    };

    const onClose = async (status, signal) => {
      if (settled || settling) return;
      settling = true;
      exitObserved = true;
      if (Number.isInteger(status)) exitStatus = status;
      if (typeof signal === "string" && signal.length > 0) exitSignal = signal;
      activeRecord.closed = true;
      removeListeners();
      clearFixedTimer();
      clearReapTimer();
      if (terminationPromise) await terminationPromise;

      try {
        markLease(runtimeState, {
          state: "INACTIVE",
          pgid: 0,
          sequence: runtimeState?.sequence ?? 0,
          command_id: commandId,
        });
      } catch {
        terminalCause = RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED;
      }

      let resultClass = terminalCause;
      if (terminationAttempted && !terminationSucceeded) {
        resultClass = RESULT_CLASS.PROCESS_GROUP_TERMINATION_FAILED;
      } else if (resultClass === null) {
        if (exitSignal !== null) resultClass = RESULT_CLASS.SIGNAL_TERMINATION;
        else if (!Number.isInteger(exitStatus)) resultClass = RESULT_CLASS.NO_EXIT_STATUS;
        else if (exitStatus !== spec.expectedExitStatus) resultClass = RESULT_CLASS.NONZERO_EXIT;
        else resultClass = RESULT_CLASS.SUCCESS;
      }

      settling = false;
      if (settled) return;
      settled = true;
      settlementCount += 1;
      runtimeState?.activeChildren?.delete(recordKey);
      resolveReap(true);
      resolve(buildEnvelope(resultClass, true));
    };

    let activeLeasePublished = false;
    if (hasValidPid) {
      try {
        markLease(runtimeState, {
          state: "ACTIVE",
          pgid: negativeGroupPid,
          sequence: runtimeState?.sequence ?? 0,
          command_id: commandId,
        });
        activeLeasePublished = true;
      } catch {
        requestTerminal(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
        return;
      }
    }

    let listenerRegistrationSucceeded = true;
    try {
      if (hasChildEvents) {
        child.on("close", onClose);
        child.on("error", onChildError);
        child.on("exit", onExit);
      }
      if (hasStdout) {
        child.stdout.on("data", onStdoutData);
        child.stdout.on("error", onStreamError);
      }
      if (hasStderr) {
        child.stderr.on("data", onStderrData);
        child.stderr.on("error", onStreamError);
      }
    } catch {
      listenerRegistrationSucceeded = false;
      requestTerminal(RESULT_CLASS.SPAWN_ERROR);
    }
    if (!listenerRegistrationSucceeded) return;

    if (!hasValidPid) {
      requestTerminal(RESULT_CLASS.SPAWN_ERROR);
      return;
    }
    if (!activeLeasePublished) return;

    if (!completeChildShape) {
      requestTerminal(RESULT_CLASS.SPAWN_ERROR);
      return;
    }

    try {
      timerCleared = false;
      timerHandle = setTimer(() => requestTerminal(RESULT_CLASS.TIMEOUT), spec.timeoutMs);
      runtimeState?.activeTimers?.add(timerHandle);
    } catch {
      timerCleared = true;
      requestTerminal(RESULT_CLASS.SPAWN_ERROR);
      return;
    }

    if (spec.stdinPolicy === "pipe") {
      const stdinBytes = context?.stdinBytes;
      if (!Buffer.isBuffer(stdinBytes)
        || !child.stdin
        || typeof child.stdin.once !== "function"
        || typeof child.stdin.write !== "function"
        || typeof child.stdin.end !== "function") {
        requestTerminal(RESULT_CLASS.SPAWN_ERROR);
      } else {
        try {
          child.stdin.once("error", onStreamError);
          if (child.stdin.write(stdinBytes) === false) {
            child.stdin.once("drain", onStdinDrain);
          } else {
            child.stdin.end();
          }
        } catch {
          requestTerminal(RESULT_CLASS.SPAWN_ERROR);
        }
      }
    }
  });
}

function serializeCategoricalJson(value, maximumBytes = MAX_EVIDENCE_BYTES) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
  if (bytes.length === 0 || bytes.length > maximumBytes) {
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  }
  return bytes;
}

function directoryOpenFlags() {
  const directoryFlag = Number.isInteger(fsConstants.O_DIRECTORY) ? fsConstants.O_DIRECTORY : 0;
  return fsConstants.O_RDONLY | directoryFlag | noFollowFlag();
}

function revalidateOutputDirectoryAuthority(outputAuthority) {
  if (!outputAuthority || outputAuthority.closed === true) {
    fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
  }
  try {
    const linked = lstatSync(outputAuthority.path);
    const anchored = fstatSync(outputAuthority.fd);
    if (!linked.isDirectory()
      || linked.isSymbolicLink()
      || !anchored.isDirectory()
      || linked.dev !== outputAuthority.dev
      || linked.ino !== outputAuthority.ino
      || anchored.dev !== outputAuthority.dev
      || anchored.ino !== outputAuthority.ino
      || (linked.mode & 0o7777) !== outputAuthority.mode
      || (anchored.mode & 0o7777) !== outputAuthority.mode
      || linked.uid !== outputAuthority.uid
      || anchored.uid !== outputAuthority.uid
      || realpathSync(outputAuthority.path) !== outputAuthority.realpath) {
      fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
    }
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
  }
  return true;
}

function authenticateOutputDirectory(outputDirectory) {
  if (!validateCanonicalOutputDirectoryPath(outputDirectory)) {
    fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
  }
  let fd;
  try {
    const linked = lstatSync(outputDirectory);
    if (!linked.isDirectory()
      || linked.isSymbolicLink()
      || (linked.mode & 0o7777) !== 0o700
      || typeof process.getuid !== "function"
      || linked.uid !== process.getuid()
      || realpathSync(outputDirectory) !== outputDirectory
      || readdirSync(outputDirectory).length !== 0
      || outputDirectory.startsWith(`${REPOSITORY_PATH}${path.sep}`)) {
      fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
    }
    fd = openSync(outputDirectory, directoryOpenFlags());
    const anchored = fstatSync(fd);
    if (!anchored.isDirectory()
      || anchored.dev !== linked.dev
      || anchored.ino !== linked.ino
      || (anchored.mode & 0o7777) !== 0o700
      || anchored.uid !== linked.uid) {
      fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
    }
    const authority = {
      path: outputDirectory,
      fd,
      dev: linked.dev,
      ino: linked.ino,
      mode: linked.mode & 0o7777,
      uid: linked.uid,
      realpath: outputDirectory,
      closed: false,
    };
    revalidateOutputDirectoryAuthority(authority);
    return authority;
  } catch (error) {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { /* preserve the authentication failure */ }
    }
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.OUTPUT_DIRECTORY_INVALID);
  }
}

function closeOutputDirectoryAuthority(outputAuthority) {
  if (!outputAuthority || outputAuthority.closed === true) return;
  closeSync(outputAuthority.fd);
  outputAuthority.closed = true;
}

function encodeLeaseRecord(payload, generation) {
  const body = Object.freeze({
    generation,
    state: payload.state,
    pgid: payload.pgid,
    sequence: payload.sequence,
    command_id: payload.command_id,
  });
  const bodyText = JSON.stringify(body);
  const recordText = JSON.stringify({ ...body, checksum: sha256(Buffer.from(bodyText, "utf8")) });
  const recordBytes = Buffer.from(recordText, "utf8");
  if (recordBytes.length >= LEASE_RECORD_BYTES) fail(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
  return Buffer.concat([
    recordBytes,
    Buffer.alloc(LEASE_RECORD_BYTES - recordBytes.length - 1, 0x20),
    Buffer.from("\n"),
  ]);
}

function createActiveChildLease(outputAuthority) {
  revalidateOutputDirectoryAuthority(outputAuthority);
  const leasePath = path.join(outputAuthority.path, LEASE_FILENAME);
  let fd;
  const verifyLeaseAnchor = () => {
    const stats = fstatSync(fd);
    const linked = lstatSync(leasePath);
    if (!stats.isFile()
      || !linked.isFile()
      || linked.isSymbolicLink()
      || stats.dev !== linked.dev
      || stats.ino !== linked.ino
      || (stats.mode & 0o777) !== 0o600
      || (linked.mode & 0o777) !== 0o600
      || stats.uid !== outputAuthority.uid
      || linked.uid !== outputAuthority.uid) {
      fail(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
    }
  };
  try {
    fd = openSync(
      leasePath,
      fsConstants.O_RDWR | fsConstants.O_CREAT | fsConstants.O_EXCL | noFollowFlag(),
      0o600,
    );
    verifyLeaseAnchor();
    revalidateOutputDirectoryAuthority(outputAuthority);
  } catch (error) {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { /* categorical failure below */ }
    }
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
  }
  let generation = 0;
  const write = (payload) => {
    revalidateOutputDirectoryAuthority(outputAuthority);
    verifyLeaseAnchor();
    generation += 1;
    const slot = generation % 2;
    const bytes = encodeLeaseRecord(payload, generation);
    writeAll(fd, bytes, slot * LEASE_RECORD_BYTES);
    fsyncSync(fd);
    verifyLeaseAnchor();
    revalidateOutputDirectoryAuthority(outputAuthority);
  };
  try {
    write({ state: "INACTIVE", pgid: 0, sequence: 0, command_id: "NONE" });
  } catch {
    try { closeSync(fd); } catch { /* preserve the initial lease failure */ }
    fail(RESULT_CLASS.ACTIVE_CHILD_LEASE_FAILED);
  }
  return Object.freeze({
    path: leasePath,
    write,
    close() {
      closeSync(fd);
    },
  });
}

function createRuntimeState(context) {
  const lease = createActiveChildLease(context.outputAuthority);
  return {
    activeChildren: new Map(),
    activeTimers: new Set(),
    lease,
    sequence: 0,
    interrupted: false,
    interruptClass: null,
    abortLatched: false,
    abortClass: null,
    abortExitCode: null,
    cleanupPromise: null,
    outputDirectory: context.outputDirectory,
    outputAuthority: context.outputAuthority,
  };
}

function latchAbort(runtimeState, resultClass, exitCode = null) {
  if (!runtimeState.abortLatched) {
    runtimeState.abortLatched = true;
    runtimeState.abortClass = resultClass;
    runtimeState.abortExitCode = Number.isInteger(exitCode) && exitCode > 0 ? exitCode : null;
    runtimeState.interrupted = true;
    runtimeState.interruptClass = resultClass;
  }
  if (runtimeState.abortExitCode !== null
    && (!Number.isInteger(process.exitCode) || process.exitCode === 0)) {
    process.exitCode = runtimeState.abortExitCode;
  }
  return runtimeState.abortClass;
}

function assertNotAborted(runtimeState) {
  if (runtimeState?.abortLatched) {
    fail(runtimeState.abortClass ?? RESULT_CLASS.INTERNAL_CONTRACT_FAILURE);
  }
}

function retainCleanupPromise(runtimeState) {
  if (!runtimeState.cleanupPromise) {
    runtimeState.cleanupPromise = cleanupActiveChildren(runtimeState);
    void runtimeState.cleanupPromise.catch(() => {});
  }
  return runtimeState.cleanupPromise;
}

function preserveNonzeroExitCode(preferredCode = 1) {
  if (!Number.isInteger(process.exitCode) || process.exitCode === 0) {
    process.exitCode = preferredCode;
  }
}

function waitForSignalDeliveryCheckpoint() {
  return new Promise((resolve) => setImmediate(resolve));
}

function verifyIdentityEntry(entry) {
  const absolutePath = safeAbsoluteRepositoryPath(entry.path);
  const bytes = readBoundedRegularFile(
    absolutePath,
    MAX_IDENTITY_FILE_BYTES,
    entry.mode,
    RESULT_CLASS.IDENTITY_MISMATCH,
  );
  if (sha256(bytes) !== entry.sha256) fail(RESULT_CLASS.IDENTITY_MISMATCH);
}

function verifyActiveIdentities() {
  for (const entry of ACTIVE_IDENTITY_ENTRIES) verifyIdentityEntry(entry);
  return true;
}

function verifyExcludedIdentities() {
  for (const entry of EXCLUDED_IDENTITIES) verifyIdentityEntry({
    ...entry,
    regular_file_required: true,
    symlink_rejected: true,
  });
  return true;
}

function verifySupervisorIdentity(expectedSha256) {
  if (!LOWERCASE_SHA256_PATTERN.test(expectedSha256)) fail(RESULT_CLASS.IDENTITY_MISMATCH);
  if (fileURLToPath(import.meta.url) !== SUPERVISOR_PATH) fail(RESULT_CLASS.IDENTITY_MISMATCH);
  const bytes = readBoundedRegularFile(
    SUPERVISOR_PATH,
    MAX_IDENTITY_FILE_BYTES,
    0o644,
    RESULT_CLASS.IDENTITY_MISMATCH,
  );
  if (sha256(bytes) !== expectedSha256) fail(RESULT_CLASS.IDENTITY_MISMATCH);
  return true;
}

function decodeExactSingleLine(bytes, failureClass = RESULT_CLASS.OUTPUT_MALFORMED) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 2 || bytes[bytes.length - 1] !== 0x0a) {
    fail(failureClass);
  }
  const content = bytes.subarray(0, bytes.length - 1);
  if (content.includes(0x0a) || content.includes(0x0d) || content.includes(0)) {
    fail(failureClass);
  }
  return decodeUtf8Strict(content, failureClass);
}

function parseThreeRefs(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes[bytes.length - 1] !== 0x0a) {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  const text = decodeUtf8Strict(bytes, RESULT_CLASS.OUTPUT_MALFORMED);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 3 || lines.some((line) => !LOWERCASE_SHA40_PATTERN.test(line))) {
    fail(RESULT_CLASS.OUTPUT_MALFORMED);
  }
  return Object.freeze(lines);
}

function parseRepositoryStatus(bytes) {
  const text = decodeUtf8Strict(bytes, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  if (/[\r\u0000]/.test(text)) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const normalized = text.endsWith("\n") ? text.slice(0, -1) : text;
  const lines = normalized.length === 0 ? [] : normalized.split("\n");
  const expectedLines = EXCLUDED_IDENTITIES.map((entry) => `?? ${entry.path}`).sort();
  const actualLines = [...lines].sort();
  const exactSet = actualLines.length === expectedLines.length
    && actualLines.every((line, index) => line === expectedLines[index]);
  return Object.freeze({
    tracked_tree_clean: lines.every((line) => line.startsWith("?? ")),
    index_empty: lines.every((line) => line.startsWith("?? ") || line[0] === " "),
    untracked_count: lines.filter((line) => line.startsWith("?? ")).length,
    expected_excluded_set_match: exactSet,
  });
}

function readMainWorktreeMetadata() {
  if (process.cwd() !== REPOSITORY_PATH) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const gitDirectory = path.join(REPOSITORY_PATH, ".git");
  try {
    const gitStats = lstatSync(gitDirectory);
    if (!gitStats.isDirectory() || gitStats.isSymbolicLink()) {
      fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
    }
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  }
  const headBytes = readBoundedRegularFile(
    path.join(gitDirectory, "HEAD"),
    4096,
    null,
    RESULT_CLASS.REPOSITORY_STATE_MISMATCH,
  );
  if (!headBytes.equals(Buffer.from("ref: refs/heads/main\n", "utf8"))) {
    fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  }
  const configBytes = readBoundedRegularFile(
    path.join(gitDirectory, "config"),
    MAX_GIT_METADATA_FILE_BYTES,
    null,
    RESULT_CLASS.REPOSITORY_STATE_MISMATCH,
  );
  const configText = decodeUtf8Strict(configBytes, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const lines = configText.split(/\n/);
  let inOrigin = false;
  const originValues = [];
  for (const line of lines) {
    if (/^\[remote "origin"\]$/.test(line)) {
      inOrigin = true;
      continue;
    }
    if (/^\[/.test(line)) inOrigin = false;
    if (inOrigin) {
      const match = /^[\t ]*url[\t ]*=[\t ]*(.+?)[\t ]*$/.exec(line);
      if (match) originValues.push(match[1]);
    }
  }
  if (originValues.length !== 1) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  return Object.freeze({ origin: originValues[0] });
}

function childArtifactStem(sequence, commandId) {
  return `${String(sequence).padStart(3, "0")}-${commandId.toLowerCase().replaceAll("_", "-")}`;
}

function persistChildArtifacts(runtimeState, sequence, commandId, envelope, spec) {
  const stem = childArtifactStem(sequence, commandId);
  writeExclusiveOutputFile(
    runtimeState.outputAuthority,
    `${stem}.result.json`,
    serializeCategoricalJson(envelope.result, MAX_EVIDENCE_BYTES),
  );
  if (spec.persistStdout) {
    writeExclusiveOutputFile(runtimeState.outputAuthority, `${stem}.stdout.capture`, envelope.stdout);
  }
  if (spec.persistStderr) {
    writeExclusiveOutputFile(runtimeState.outputAuthority, `${stem}.stderr.capture`, envelope.stderr);
  }
}

async function runRecordedChild(commandId, context, options = {}) {
  const runtimeState = context.runtimeState;
  assertNotAborted(runtimeState);
  runtimeState.sequence += 1;
  const childContext = Object.freeze({
    ...context,
    stdinBytes: options.stdinBytes,
  });
  const envelope = await runBoundedChild(commandId, childContext);
  assertNotAborted(runtimeState);
  persistChildArtifacts(
    runtimeState,
    runtimeState.sequence,
    commandId,
    envelope,
    getFixedCommandSpec(commandId, childContext),
  );
  return envelope;
}

function requireChildSuccess(envelope, failureClass = RESULT_CLASS.VALIDATION_REJECTED) {
  if (!envelope?.result?.success || envelope.result.result_class !== RESULT_CLASS.SUCCESS) {
    const childResultClass = typeof envelope?.result?.result_class === "string"
      && Object.values(RESULT_CLASS).includes(envelope.result.result_class)
      ? envelope.result.result_class
      : failureClass;
    fail(childResultClass);
  }
}

async function verifyLocalRepositoryState(context) {
  const metadata = readMainWorktreeMetadata();
  const versionEnvelope = await runRecordedChild("GIT_VERSION", context);
  assertNotAborted(context.runtimeState);
  requireChildSuccess(versionEnvelope, RESULT_CLASS.VERSION_MALFORMED);
  if (versionEnvelope.stderr.length !== 0) fail(RESULT_CLASS.VERSION_MALFORMED);
  const versionText = decodeExactSingleLine(versionEnvelope.stdout, RESULT_CLASS.VERSION_MALFORMED);
  const version = parseGitVersion(versionText);
  if (!version) fail(RESULT_CLASS.VERSION_MALFORMED);
  if (!isGitVersionSupported(version)) fail(RESULT_CLASS.VERSION_UNSUPPORTED);

  const branchEnvelope = await runRecordedChild("GIT_BRANCH", context);
  assertNotAborted(context.runtimeState);
  requireChildSuccess(branchEnvelope, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  if (branchEnvelope.stderr.length !== 0) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const branch = decodeExactSingleLine(branchEnvelope.stdout, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);

  const headEnvelope = await runRecordedChild("GIT_HEAD", context);
  assertNotAborted(context.runtimeState);
  requireChildSuccess(headEnvelope, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  if (headEnvelope.stderr.length !== 0) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const [head, localMain, localOriginMain] = parseThreeRefs(headEnvelope.stdout);

  const statusEnvelope = await runRecordedChild("GIT_STATUS", context);
  assertNotAborted(context.runtimeState);
  requireChildSuccess(statusEnvelope, RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  if (statusEnvelope.stderr.length !== 0) fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
  const repositoryStatus = parseRepositoryStatus(statusEnvelope.stdout);
  const excludedIdentityMatch = verifyExcludedIdentities();

  return Object.freeze({
    repository_path_match: process.cwd() === REPOSITORY_PATH,
    main_worktree_match: true,
    branch_match: branch === EXPECTED_BRANCH,
    head_match: head === context.expectedBaseline,
    local_main_match: localMain === context.expectedBaseline,
    local_origin_main_match: localOriginMain === context.expectedBaseline,
    origin_match: metadata.origin === EXPECTED_ORIGIN,
    tracked_tree_clean: repositoryStatus.tracked_tree_clean,
    index_empty: repositoryStatus.index_empty,
    untracked_count: repositoryStatus.untracked_count,
    expected_excluded_set_match: repositoryStatus.expected_excluded_set_match,
    expected_excluded_hash_match: excludedIdentityMatch,
    expected_excluded_mode_match: excludedIdentityMatch,
  });
}

function readApprovedEnvironment() {
  const context = {
    lang: process.env.LANG,
    lcAll: process.env.LC_ALL,
    expectedBaseline: process.env.AIFINDER_EXPECTED_EXECUTION_BASELINE,
    expectedNodeExecutable: process.env.AIFINDER_EXPECTED_NODE_EXECUTABLE,
    outputDirectory: process.env.AIFINDER_OUTPUT_DIRECTORY,
    expectedSupervisorSha256: process.env.AIFINDER_EXPECTED_SUPERVISOR_SHA256,
  };
  if (context.lang !== "C"
    || context.lcAll !== "C"
    || !LOWERCASE_SHA40_PATTERN.test(context.expectedBaseline ?? "")
    || typeof context.expectedNodeExecutable !== "string"
    || !path.isAbsolute(context.expectedNodeExecutable)
    || !validateCanonicalOutputDirectoryPath(context.outputDirectory)
    || !LOWERCASE_SHA256_PATTERN.test(context.expectedSupervisorSha256 ?? "")) {
    fail(RESULT_CLASS.ENVIRONMENT_INVALID);
  }
  if (process.execPath !== context.expectedNodeExecutable) {
    fail(RESULT_CLASS.IDENTITY_MISMATCH);
  }
  return Object.freeze({
    repositoryPath: REPOSITORY_PATH,
    expectedBaseline: context.expectedBaseline,
    expectedNodeExecutable: context.expectedNodeExecutable,
    nodeExecutable: context.expectedNodeExecutable,
    outputDirectory: context.outputDirectory,
    expectedSupervisorSha256: context.expectedSupervisorSha256,
  });
}

function verifyFixedExecutable(absolutePath) {
  try {
    const stats = lstatSync(absolutePath);
    if (!stats.isFile() || stats.isSymbolicLink()) fail(RESULT_CLASS.IDENTITY_MISMATCH);
    accessSync(absolutePath, fsConstants.X_OK);
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    fail(RESULT_CLASS.IDENTITY_MISMATCH);
  }
}

function settleCleanupStepWithinDeadline(runtimeState, operation) {
  return new Promise((resolve) => {
    let completed = false;
    let deadlineHandle;
    const finish = (value) => {
      if (completed) return;
      completed = true;
      if (deadlineHandle !== undefined) {
        clearTimeout(deadlineHandle);
        runtimeState.activeTimers.delete(deadlineHandle);
      }
      resolve(value === true);
    };
    try {
      deadlineHandle = setTimeout(() => finish(false), CHILD_REAP_GRACE_MS);
      runtimeState.activeTimers.add(deadlineHandle);
    } catch {
      finish(false);
      return;
    }
    Promise.resolve()
      .then(operation)
      .then(finish)
      .catch(() => finish(false));
  });
}

async function cleanupActiveChildren(runtimeState) {
  const records = [...runtimeState.activeChildren.values()];
  const outcomes = await Promise.all(records.map(async (record) => {
    const terminationSucceeded = await settleCleanupStepWithinDeadline(
      runtimeState,
      () => record.terminate?.(),
    );
    const childReaped = await settleCleanupStepWithinDeadline(runtimeState, () => (
      typeof record.awaitReap === "function"
        ? record.awaitReap()
        : record.closedPromise
    ));
    return Object.freeze({ terminationSucceeded, childReaped });
  }));
  if (outcomes.some((outcome) => !outcome.terminationSucceeded)) {
    fail(RESULT_CLASS.PROCESS_GROUP_TERMINATION_FAILED);
  }
  if (outcomes.some((outcome) => !outcome.childReaped)) {
    fail(RESULT_CLASS.CHILD_REAP_FAILED);
  }
  return true;
}

function installSignalCleanup(runtimeState) {
  const signalClasses = Object.freeze({
    SIGHUP: "SIGNAL_SIGHUP",
    SIGINT: "SIGNAL_SIGINT",
    SIGTERM: "SIGNAL_SIGTERM",
  });
  const handlers = new Map();
  for (const [signal, resultClass] of Object.entries(signalClasses)) {
    const handler = () => {
      const signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
      latchAbort(runtimeState, resultClass, signalExitCode);
      void retainCleanupPromise(runtimeState);
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
  return () => {
    for (const [signal, handler] of handlers) process.removeListener(signal, handler);
  };
}

function buildPostRunState(localState, context) {
  const activeIdentityMatch = verifyActiveIdentities();
  const supervisorIdentityMatch = verifySupervisorIdentity(context.expectedSupervisorSha256);
  return Object.freeze({
    ...localState,
    active_identity_match: activeIdentityMatch,
    unchanged_dependency_identity_match: activeIdentityMatch,
    supervisor_identity_match: supervisorIdentityMatch,
    active_child_count: context.runtimeState.activeChildren.size,
    active_timer_count: context.runtimeState.activeTimers.size,
  });
}

function serializeEvidenceObject(value) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
  if (bytes.length === 0 || bytes.length > MAX_EVIDENCE_BYTES) {
    fail(RESULT_CLASS.EVIDENCE_WRITE_FAILED);
  }
  return bytes;
}

async function runSupervisorCli() {
  let runtimeState = null;
  let removeSignalHandlers = null;
  let outputAuthority = null;
  try {
    if (process.argv.length !== 2) fail(RESULT_CLASS.ARGUMENTS_PROHIBITED);
    const approvedContext = readApprovedEnvironment();
    verifySupervisorIdentity(approvedContext.expectedSupervisorSha256);
    verifyFixedExecutable("/usr/bin/git");
    verifyFixedExecutable("/usr/bin/pbcopy");
    verifyFixedExecutable("/usr/bin/pbpaste");
    outputAuthority = authenticateOutputDirectory(approvedContext.outputDirectory);
    const authorityContext = Object.freeze({ ...approvedContext, outputAuthority });
    runtimeState = createRuntimeState(authorityContext);
    removeSignalHandlers = installSignalCleanup(runtimeState);
    const context = Object.freeze({ ...authorityContext, runtimeState });

    const initialState = await verifyLocalRepositoryState(context);
    assertNotAborted(runtimeState);
    if (!initialState.repository_path_match
      || !initialState.main_worktree_match
      || !initialState.branch_match
      || !initialState.head_match
      || !initialState.local_main_match
      || !initialState.local_origin_main_match
      || !initialState.origin_match
      || !initialState.tracked_tree_clean
      || !initialState.index_empty
      || initialState.untracked_count !== 5
      || !initialState.expected_excluded_set_match
      || !initialState.expected_excluded_hash_match
      || !initialState.expected_excluded_mode_match) {
      fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
    }
    verifyActiveIdentities();

    for (const commandId of [
      "HARNESS_SYNTAX",
      "STATIC_TEST_SYNTAX",
      "VALIDATOR_SYNTAX",
      "EXECUTION_TEST_SYNTAX",
      "SUPERVISOR_SYNTAX",
    ]) {
      const syntaxEnvelope = await runRecordedChild(commandId, context);
      assertNotAborted(runtimeState);
      requireChildSuccess(syntaxEnvelope);
    }
    const staticTestsEnvelope = await runRecordedChild("STATIC_TESTS", context);
    assertNotAborted(runtimeState);
    requireChildSuccess(staticTestsEnvelope);
    verifyActiveIdentities();

    const harnessEnvelope = await runRecordedChild("HARNESS", context);
    assertNotAborted(runtimeState);
    requireChildSuccess(harnessEnvelope);
    const harnessEvidence = validateHarnessStdout(harnessEnvelope.stdout);
    writeExclusiveOutputFile(
      context.outputAuthority,
      "harness-candidate.json",
      harnessEnvelope.stdout,
    );

    const validatorEnvelope = await runRecordedChild("VALIDATOR", context, {
      stdinBytes: harnessEnvelope.stdout,
    });
    assertNotAborted(runtimeState);
    requireChildSuccess(validatorEnvelope);
    if (!validateExactValidatorSuccess(validatorEnvelope.stdout)) {
      fail(RESULT_CLASS.VALIDATION_REJECTED);
    }
    verifyActiveIdentities();

    const finalLocalState = await verifyLocalRepositoryState(context);
    assertNotAborted(runtimeState);
    const postRunState = buildPostRunState(finalLocalState, context);
    if (!validatePostRunVerification(postRunState)) {
      fail(RESULT_CLASS.REPOSITORY_STATE_MISMATCH);
    }

    const evidenceContext = Object.freeze({
      harness_status: harnessEvidence.harness_status,
      post_run_state: "VERIFIED",
      active_child_count: runtimeState.activeChildren.size,
      active_timer_count: runtimeState.activeTimers.size,
      execution_authorized: false,
    });
    const preliminaryBytes = serializeEvidenceObject(buildPreliminaryEvidence(Object.freeze({
      result: "PENDING",
      ...evidenceContext,
    })));
    const finalBytes = serializeEvidenceObject(buildFinalEvidence(Object.freeze({
      result: "PASSED",
      ...evidenceContext,
    })));
    assertNotAborted(runtimeState);
    await performTwoPassClipboardRoundTrip(preliminaryBytes, finalBytes, {
      async runChild(commandId, options = {}) {
        return runRecordedChild(commandId, context, options);
      },
      async persistFinalEvidence(bytes) {
        assertNotAborted(runtimeState);
        writeExclusiveOutputFile(context.outputAuthority, "final-evidence.json", bytes);
        assertNotAborted(runtimeState);
      },
      assertNotAborted() {
        assertNotAborted(runtimeState);
      },
      async awaitSignalCheckpoint() {
        await waitForSignalDeliveryCheckpoint();
        assertNotAborted(runtimeState);
      },
    });
    assertNotAborted(runtimeState);

    if (runtimeState.activeChildren.size !== 0 || runtimeState.activeTimers.size !== 0) {
      fail(RESULT_CLASS.INTERNAL_CONTRACT_FAILURE);
    }
    assertNotAborted(runtimeState);
    if (Number.isInteger(process.exitCode) && process.exitCode !== 0) {
      fail(runtimeState.abortClass ?? RESULT_CLASS.INTERNAL_CONTRACT_FAILURE);
    }
    markLease(runtimeState, {
      state: "INACTIVE",
      pgid: 0,
      sequence: runtimeState.sequence,
      command_id: "COMPLETE",
    });
    assertNotAborted(runtimeState);
    runtimeState.lease.close();
    closeOutputDirectoryAuthority(outputAuthority);
    removeSignalHandlers();
    assertNotAborted(runtimeState);
    if (!Number.isInteger(process.exitCode) || process.exitCode === 0) {
      process.exitCode = 0;
    }
  } catch (error) {
    let resultClass = error instanceof ContractFailure
      ? error.result_class
      : RESULT_CLASS.INTERNAL_CONTRACT_FAILURE;
    let cleanupSucceeded = true;
    if (runtimeState) {
      latchAbort(runtimeState, resultClass);
      try {
        await retainCleanupPromise(runtimeState);
      } catch (cleanupError) {
        cleanupSucceeded = false;
        resultClass = cleanupError instanceof ContractFailure
          ? cleanupError.result_class
          : RESULT_CLASS.INTERNAL_CONTRACT_FAILURE;
      }
      if (cleanupSucceeded) {
        try {
          markLease(runtimeState, {
            state: "INACTIVE",
            pgid: 0,
            sequence: runtimeState.sequence,
            command_id: "FAILED",
          });
          writeExclusiveOutputFile(
            runtimeState.outputAuthority,
            "failure-evidence.json",
            serializeCategoricalJson(Object.freeze({ result: "FAILED", failure_class: resultClass })),
          );
        } catch {
          // stderr remains the only bounded failure channel when persistence fails.
        }
        try { runtimeState.lease.close(); } catch { /* failure remains categorical */ }
        try { closeOutputDirectoryAuthority(outputAuthority); } catch { /* categorical stderr below */ }
      }
    } else if (outputAuthority) {
      try { closeOutputDirectoryAuthority(outputAuthority); } catch { /* categorical stderr below */ }
    }
    removeSignalHandlers?.();
    try {
      writeSync(
        2,
        `${JSON.stringify(Object.freeze({ result: "FAILED", failure_class: resultClass }))}\n`,
      );
    } catch {
      // No arbitrary fallback output is permitted.
    }
    preserveNonzeroExitCode(1);
  }
}

const isCli = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  void runSupervisorCli();
}
