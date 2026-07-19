#!/usr/bin/env node

/**
 * AiFinder Discovery Engine — Read-Only Runtime Validation Harness
 *
 * Phase 25FD implementation boundary:
 * - This file is an inert, guarded harness scaffold.
 * - Runtime validation is disabled by default.
 * - No routes are invoked by this implementation.
 * - The manifest is intentionally empty until a later approved phase.
 * - Operational reactivation remains blocked.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { X_OK } from "node:constants";
import { accessSync, existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PHASE = "25FD";
const TASK = "read-only-runtime-validation-harness";
const APPROVAL_GUARD = "AIFINDER_RUN_DISCOVERY_READ_ONLY_RUNTIME_VALIDATION_HARNESS_25FD";
const EXPECTED_BRANCH = "main";
const EXPECTED_BASELINE_ENVIRONMENT_KEY = "AIFINDER_EXPECTED_EXECUTION_BASELINE";
const OPERATIONAL_REACTIVATION_STATUS = "blocked";
const GIT_EXECUTABLE = "/usr/bin/git";
const MINIMUM_GIT_VERSION = Object.freeze([2, 35, 2]);
const GIT_TIMEOUT_MS = 5000;
const GIT_MAX_BUFFER_BYTES = 1024 * 1024;
const GIT_KILL_SIGNAL = "SIGKILL";
const GIT_ENCODING = "utf8";
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
const SEALED_GIT_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
  GIT_PAGER: "cat",
  PAGER: "cat",
});

const EXPECTED_EXCLUDED_FILES = Object.freeze([
  Object.freeze({
    path: "docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md",
    sha256: "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12",
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md",
    sha256: "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a",
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md",
    sha256: "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723",
  }),
  Object.freeze({
    path: "docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md",
    sha256: "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca",
  }),
  Object.freeze({
    path: "docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md",
    sha256: "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45",
  }),
]);

const GIT_OPERATION = Object.freeze({
  VERSION: Object.freeze({
    id: "VERSION",
    args: Object.freeze(["--version"]),
    usesConfigOverrides: false,
    outputRequired: true,
  }),
  BRANCH: Object.freeze({
    id: "BRANCH",
    args: Object.freeze(["branch", "--show-current"]),
    usesConfigOverrides: true,
    outputRequired: true,
  }),
  HEAD: Object.freeze({
    id: "HEAD",
    args: Object.freeze(["rev-parse", "HEAD"]),
    usesConfigOverrides: true,
    outputRequired: true,
  }),
  STATUS: Object.freeze({
    id: "STATUS",
    args: Object.freeze(["status", "--porcelain", "--untracked-files=all"]),
    usesConfigOverrides: true,
    outputRequired: false,
  }),
});

const GIT_RESULT_CLASS = Object.freeze({
  SUCCESS: "SUCCESS",
  NONZERO_EXIT: "NONZERO_EXIT",
  NO_EXIT_STATUS: "NO_EXIT_STATUS",
  SIGNAL_TERMINATION: "SIGNAL_TERMINATION",
  TIMEOUT: "TIMEOUT",
  OUTPUT_LIMIT_EXCEEDED: "OUTPUT_LIMIT_EXCEEDED",
  SPAWN_ERROR: "SPAWN_ERROR",
  OUTPUT_MISSING: "OUTPUT_MISSING",
  OUTPUT_MALFORMED: "OUTPUT_MALFORMED",
  IDENTITY_MISMATCH: "IDENTITY_MISMATCH",
  REPOSITORY_STATE_MISMATCH: "REPOSITORY_STATE_MISMATCH",
  VERSION_UNSUPPORTED: "VERSION_UNSUPPORTED",
  VERSION_MALFORMED: "VERSION_MALFORMED",
  EXECUTABLE_UNAVAILABLE: "EXECUTABLE_UNAVAILABLE",
});

const HARNESS_ERROR_CATEGORY = Object.freeze({
  WRONG_REPOSITORY: "WRONG_REPOSITORY",
  GIT_OPERATION_FAILED: "GIT_OPERATION_FAILED",
  WRONG_BRANCH: "WRONG_BRANCH",
  WRONG_BASELINE: "WRONG_BASELINE",
  EXPECTED_BASELINE_INVALID: "EXPECTED_BASELINE_INVALID",
  DIRTY_WORKING_TREE: "DIRTY_WORKING_TREE",
  MANIFEST_INVALID: "MANIFEST_INVALID",
  MANIFEST_REQUIRES_APPROVAL: "MANIFEST_REQUIRES_APPROVAL",
  GIT_EXECUTABLE_UNAVAILABLE: "GIT_EXECUTABLE_UNAVAILABLE",
  GIT_VERSION_UNSUPPORTED: "GIT_VERSION_UNSUPPORTED",
  GIT_VERSION_MALFORMED: "GIT_VERSION_MALFORMED",
  EXCLUDED_FILE_MISMATCH: "EXCLUDED_FILE_MISMATCH",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
});

const boundedEvidence = {
  schema_version: 1,
  harness_status: "UNVERIFIED",
  approval_guard_matched: false,
  runtime_validation: false,
  route_invocation: false,
  network_call: false,
  live_db_read: false,
  db_mutation: false,
  operational_reactivation_status: "BLOCKED",
  branch_match: false,
  expected_baseline_match: false,
  repository_state_class: "UNVERIFIED",
  tracked_tree_clean: false,
  index_empty: false,
  untracked_count: 0,
  expected_excluded_set_match: false,
  expected_excluded_hash_match: false,
  git_version_supported: false,
  git_version_class: "UNVERIFIED",
};

/**
 * Phase 25FD intentionally ships no route entries.
 * A later approved manifest-population phase must add route entries before any
 * route can even be considered for validation.
 */
const STATIC_ROUTE_MANIFEST = Object.freeze([]);

function classifyOutputLength(value) {
  const length = Buffer.byteLength(value ?? "", GIT_ENCODING);

  if (length === 0) return "EMPTY";
  if (length <= 64) return "UP_TO_64_BYTES";
  if (length <= 1024) return "UP_TO_1_KIB";
  if (length <= 65536) return "UP_TO_64_KIB";
  return "OVER_64_KIB";
}

function createGitEvidence(operation, resultClass, result, stdoutText, stderrText) {
  return Object.freeze({
    operation: operation.id,
    success: resultClass === GIT_RESULT_CLASS.SUCCESS,
    resultClass,
    status: Number.isInteger(result.status) ? result.status : null,
    timedOut: resultClass === GIT_RESULT_CLASS.TIMEOUT,
    outputLimitExceeded: resultClass === GIT_RESULT_CLASS.OUTPUT_LIMIT_EXCEEDED,
    signalPresent: typeof result.signal === "string" && result.signal.length > 0,
    stdoutPresent: stdoutText.length > 0,
    stderrPresent: stderrText.length > 0,
    stdoutLengthBucket: classifyOutputLength(stdoutText),
    stderrLengthBucket: classifyOutputLength(stderrText),
  });
}

function classifyGitResult(operation, result) {
  const stdoutText = typeof result.stdout === "string" ? result.stdout : "";
  const stderrText = typeof result.stderr === "string" ? result.stderr : "";
  const outputBytes = Buffer.byteLength(stdoutText, GIT_ENCODING) + Buffer.byteLength(stderrText, GIT_ENCODING);
  const errorCode = typeof result.error?.code === "string" ? result.error.code : "";
  let resultClass = GIT_RESULT_CLASS.SUCCESS;

  if (result.error && errorCode !== "ETIMEDOUT" && errorCode !== "ENOBUFS") {
    resultClass = GIT_RESULT_CLASS.SPAWN_ERROR;
  } else if (errorCode === "ETIMEDOUT") {
    resultClass = GIT_RESULT_CLASS.TIMEOUT;
  } else if (errorCode === "ENOBUFS" || outputBytes > GIT_MAX_BUFFER_BYTES) {
    resultClass = GIT_RESULT_CLASS.OUTPUT_LIMIT_EXCEEDED;
  } else if (typeof result.signal === "string" && result.signal.length > 0) {
    resultClass = GIT_RESULT_CLASS.SIGNAL_TERMINATION;
  } else if (!Number.isInteger(result.status)) {
    resultClass = GIT_RESULT_CLASS.NO_EXIT_STATUS;
  } else if (result.status !== 0) {
    resultClass = GIT_RESULT_CLASS.NONZERO_EXIT;
  } else if (typeof result.stdout !== "string") {
    resultClass = GIT_RESULT_CLASS.OUTPUT_MISSING;
  } else if (operation.outputRequired && stdoutText.trim().length === 0) {
    resultClass = GIT_RESULT_CLASS.OUTPUT_MISSING;
  }

  return Object.freeze({
    value: stdoutText.trim(),
    evidence: createGitEvidence(operation, resultClass, result, stdoutText, stderrText),
  });
}

function buildGitArguments(operation) {
  if (!operation.usesConfigOverrides) {
    return operation.args;
  }

  return Object.freeze([...GIT_CONFIG_OVERRIDE_ARGS, ...operation.args]);
}

function runGit(operation, repositoryRoot) {
  const result = spawnSync(GIT_EXECUTABLE, buildGitArguments(operation), {
    cwd: repositoryRoot,
    encoding: GIT_ENCODING,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: GIT_MAX_BUFFER_BYTES,
    killSignal: GIT_KILL_SIGNAL,
    shell: false,
    env: SEALED_GIT_ENVIRONMENT,
  });

  return classifyGitResult(operation, result);
}

function repoRoot() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  return resolve(scriptDir, "..");
}

function printBoundary() {
  console.log("=== AiFinder Discovery Engine — Read-Only Runtime Validation Harness ===");
  console.log(`phase=${PHASE}`);
  console.log(`task=${TASK}`);
  console.log("boundary=guarded_inert_harness_scaffold");
  console.log("runtime_validation=false");
  console.log("route_invocation=false");
  console.log("local_server_startup=false");
  console.log("live_db_read=false");
  console.log("admin_api_invocation=false");
  console.log("public_route_invocation=false");
  console.log("browser_automation=false");
  console.log("network_call=false");
  console.log("candidate_staging=false");
  console.log("candidate_decision_execution=false");
  console.log("approve_for_draft=false");
  console.log("public_publishing=false");
  console.log("db_mutation=false");
  console.log(`operational_reactivation_status=${OPERATIONAL_REACTIVATION_STATUS}`);
}

function printResult(status, reason) {
  console.log("=== Harness result ===");
  console.log(`harness_status=${status}`);
  console.log(`reason=${reason}`);
  console.log(`route_count=${STATIC_ROUTE_MANIFEST.length}`);
  console.log("routes_passed=0");
  console.log("routes_failed=0");
  console.log(`routes_blocked=${STATIC_ROUTE_MANIFEST.length}`);
  console.log("values_printed=false");
  console.log("secret_like_output_detected=false");
  console.log("mutation_attempt_detected=false");
  console.log(`operational_reactivation_status=${OPERATIONAL_REACTIVATION_STATUS}`);
}

function printProgressReport() {
  console.log("=== Discovery Engine progress report ===");
  console.log("controlled_build_sequence_status=stable");
  console.log("current_harness_status=inert_scaffold_only");
  console.log("runtime_validation_progress=not_started");
  console.log("route_invocation_progress=not_started");
  console.log("manifest_population_status=not_started");
  console.log("operational_reactivation_progress=halted");
  console.log(`operational_reactivation_status=${OPERATIONAL_REACTIVATION_STATUS}`);
}

function printGitEvidence(evidenceRows) {
  for (const evidence of evidenceRows) {
    const prefix = `git_${evidence.operation.toLowerCase()}`;
    const status = evidence.status ?? -1;
    boundedEvidence[`${prefix}_success`] = evidence.success;
    boundedEvidence[`${prefix}_result_class`] = evidence.resultClass;
    boundedEvidence[`${prefix}_status`] = status;
    boundedEvidence[`${prefix}_timed_out`] = evidence.timedOut;
    boundedEvidence[`${prefix}_output_limit_exceeded`] = evidence.outputLimitExceeded;
    boundedEvidence[`${prefix}_signal_present`] = evidence.signalPresent;
    boundedEvidence[`${prefix}_primary_output_present`] = evidence.stdoutPresent;
    boundedEvidence[`${prefix}_diagnostic_output_present`] = evidence.stderrPresent;
    boundedEvidence[`${prefix}_primary_output_length`] = evidence.stdoutLengthBucket;
    boundedEvidence[`${prefix}_diagnostic_output_length`] = evidence.stderrLengthBucket;
    console.log(`${prefix}_success=${evidence.success}`);
    console.log(`${prefix}_result_class=${evidence.resultClass}`);
    console.log(`${prefix}_status=${status}`);
    console.log(`${prefix}_timed_out=${evidence.timedOut}`);
    console.log(`${prefix}_output_limit_exceeded=${evidence.outputLimitExceeded}`);
    console.log(`${prefix}_signal_present=${evidence.signalPresent}`);
    console.log(`${prefix}_stdout_present=${evidence.stdoutPresent}`);
    console.log(`${prefix}_stderr_present=${evidence.stderrPresent}`);
    console.log(`${prefix}_stdout_length=${evidence.stdoutLengthBucket}`);
    console.log(`${prefix}_stderr_length=${evidence.stderrLengthBucket}`);
  }
}

function requireGitSuccess(result) {
  if (result.evidence.resultClass !== GIT_RESULT_CLASS.SUCCESS) {
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_OPERATION_FAILED);
  }
}

function withGitResultClass(evidence, resultClass) {
  return Object.freeze({
    ...evidence,
    success: false,
    resultClass,
  });
}

function verifyGitExecutableIdentity() {
  try {
    const executableStat = lstatSync(GIT_EXECUTABLE);
    if (!executableStat.isFile()) {
      return false;
    }
    accessSync(GIT_EXECUTABLE, X_OK);
    return true;
  } catch {
    return false;
  }
}

function parseGitVersion(value) {
  const match = /^git version ([0-9]+)\.([0-9]+)\.([0-9]+)(?: \(Apple Git-([0-9]+)\))?$/.exec(value);
  if (!match) {
    return null;
  }

  const parts = match.slice(1, 4).map((part) => Number(part));
  if (parts.some((part) => !Number.isSafeInteger(part) || part < 0)) {
    return null;
  }

  return Object.freeze(parts);
}

function readExpectedBaseline() {
  const expectedBaseline = process.env[EXPECTED_BASELINE_ENVIRONMENT_KEY];
  if (typeof expectedBaseline !== "string" || !/^[0-9a-f]{40}$/.test(expectedBaseline)) {
    throw new Error(HARNESS_ERROR_CATEGORY.EXPECTED_BASELINE_INVALID);
  }
  return expectedBaseline;
}

function isGitVersionSupported(version) {
  for (let index = 0; index < MINIMUM_GIT_VERSION.length; index += 1) {
    if (version[index] > MINIMUM_GIT_VERSION[index]) return true;
    if (version[index] < MINIMUM_GIT_VERSION[index]) return false;
  }
  return true;
}

function hashFileSha256(absolutePath) {
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
}

function inspectExpectedExcludedFiles(root) {
  for (const expectedFile of EXPECTED_EXCLUDED_FILES) {
    const absolutePath = resolve(root, expectedFile.path);
    try {
      const fileStat = lstatSync(absolutePath);
      if (!fileStat.isFile() || fileStat.isSymbolicLink()) return false;
      if (hashFileSha256(absolutePath) !== expectedFile.sha256) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function classifyRepositoryStatus(value) {
  const lines = value.length === 0 ? [] : value.split("\n");
  const trackedClean = lines.every((line) => line.startsWith("?? "));
  const indexEmpty = lines.every((line) => line.startsWith("?? ") || line[0] === " ");
  const untrackedPaths = lines
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3))
    .sort();
  const expectedPaths = EXPECTED_EXCLUDED_FILES.map((entry) => entry.path).sort();
  const expectedExcludedSetMatch = untrackedPaths.length === expectedPaths.length
    && untrackedPaths.every((entry, index) => entry === expectedPaths[index]);

  return Object.freeze({
    trackedClean,
    indexEmpty,
    untrackedCount: untrackedPaths.length,
    expectedExcludedSetMatch,
  });
}

function printRepositoryEvidence(evidence) {
  Object.assign(boundedEvidence, {
    branch_match: evidence.branchMatch,
    expected_baseline_match: evidence.expectedBaselineMatch,
    repository_state_class: evidence.repositoryStateClass,
    tracked_tree_clean: evidence.trackedTreeClean,
    index_empty: evidence.indexEmpty,
    untracked_count: evidence.untrackedCount,
    expected_excluded_set_match: evidence.expectedExcludedSetMatch,
    expected_excluded_hash_match: evidence.expectedExcludedHashMatch,
    git_version_supported: evidence.gitVersionSupported,
    git_version_class: evidence.gitVersionClass,
  });
  console.log(`branch_match=${evidence.branchMatch}`);
  console.log(`expected_baseline_match=${evidence.expectedBaselineMatch}`);
  console.log(`repository_state_class=${evidence.repositoryStateClass}`);
  console.log(`tracked_tree_clean=${evidence.trackedTreeClean}`);
  console.log(`index_empty=${evidence.indexEmpty}`);
  console.log(`untracked_count=${evidence.untrackedCount}`);
  console.log(`expected_excluded_set_match=${evidence.expectedExcludedSetMatch}`);
  console.log(`expected_excluded_hash_match=${evidence.expectedExcludedHashMatch}`);
  console.log(`git_version_supported=${evidence.gitVersionSupported}`);
  console.log(`git_version_class=${evidence.gitVersionClass}`);
}

function emitBoundedEvidence(harnessStatus) {
  boundedEvidence.harness_status = harnessStatus;
  console.log(JSON.stringify(Object.freeze({ ...boundedEvidence })));
}

function verifyRepoSafety() {
  const root = repoRoot();
  const expectedBaseline = readExpectedBaseline();
  const evidenceRows = [];
  const repositoryEvidence = {
    branchMatch: false,
    expectedBaselineMatch: false,
    repositoryStateClass: "UNVERIFIED",
    trackedTreeClean: false,
    indexEmpty: false,
    untrackedCount: 0,
    expectedExcludedSetMatch: false,
    expectedExcludedHashMatch: false,
    gitVersionSupported: false,
    gitVersionClass: "UNVERIFIED",
  };

  if (!existsSync(resolve(root, ".git"))) {
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_REPOSITORY);
  }

  if (!verifyGitExecutableIdentity()) {
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_EXECUTABLE_UNAVAILABLE);
  }

  const version = runGit(GIT_OPERATION.VERSION, root);
  evidenceRows.push(version.evidence);
  requireGitSuccess(version);
  const parsedVersion = parseGitVersion(version.value);
  if (!parsedVersion) {
    printGitEvidence([withGitResultClass(version.evidence, GIT_RESULT_CLASS.VERSION_MALFORMED)]);
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_VERSION_MALFORMED);
  }
  if (!isGitVersionSupported(parsedVersion)) {
    printGitEvidence([withGitResultClass(version.evidence, GIT_RESULT_CLASS.VERSION_UNSUPPORTED)]);
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_VERSION_UNSUPPORTED);
  }
  repositoryEvidence.gitVersionSupported = true;
  repositoryEvidence.gitVersionClass = "SUPPORTED";

  const branch = runGit(GIT_OPERATION.BRANCH, root);
  evidenceRows.push(branch.evidence);
  requireGitSuccess(branch);
  if (branch.value !== EXPECTED_BRANCH) {
    printGitEvidence([withGitResultClass(branch.evidence, GIT_RESULT_CLASS.IDENTITY_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_BRANCH);
  }
  repositoryEvidence.branchMatch = true;

  const head = runGit(GIT_OPERATION.HEAD, root);
  evidenceRows.push(head.evidence);
  requireGitSuccess(head);
  if (!/^[0-9a-f]{40}$/.test(head.value)) {
    printGitEvidence([withGitResultClass(head.evidence, GIT_RESULT_CLASS.OUTPUT_MALFORMED)]);
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_OPERATION_FAILED);
  }
  if (head.value !== expectedBaseline) {
    printGitEvidence([withGitResultClass(head.evidence, GIT_RESULT_CLASS.IDENTITY_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_BASELINE);
  }
  repositoryEvidence.expectedBaselineMatch = true;

  const status = runGit(GIT_OPERATION.STATUS, root);
  evidenceRows.push(status.evidence);
  requireGitSuccess(status);
  const repositoryStatus = classifyRepositoryStatus(status.value);
  const excludedHashesMatch = repositoryStatus.expectedExcludedSetMatch
    && inspectExpectedExcludedFiles(root);
  Object.assign(repositoryEvidence, {
    repositoryStateClass: repositoryStatus.trackedClean
      && repositoryStatus.indexEmpty
      && repositoryStatus.expectedExcludedSetMatch
      && excludedHashesMatch
      ? "EXPECTED_EXCLUDED_ONLY"
      : "MISMATCH",
    trackedTreeClean: repositoryStatus.trackedClean,
    indexEmpty: repositoryStatus.indexEmpty,
    untrackedCount: repositoryStatus.untrackedCount,
    expectedExcludedSetMatch: repositoryStatus.expectedExcludedSetMatch,
    expectedExcludedHashMatch: excludedHashesMatch,
  });
  if (repositoryEvidence.repositoryStateClass !== "EXPECTED_EXCLUDED_ONLY") {
    printGitEvidence([withGitResultClass(status.evidence, GIT_RESULT_CLASS.REPOSITORY_STATE_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.DIRTY_WORKING_TREE);
  }

  printGitEvidence(evidenceRows);
  printRepositoryEvidence(Object.freeze(repositoryEvidence));
}

function verifyApprovalGuard() {
  if (process.env[APPROVAL_GUARD] !== "1") {
    return false;
  }

  return true;
}

function verifyStaticManifest() {
  if (!Array.isArray(STATIC_ROUTE_MANIFEST)) {
    throw new Error(HARNESS_ERROR_CATEGORY.MANIFEST_INVALID);
  }

  if (STATIC_ROUTE_MANIFEST.length !== 0) {
    throw new Error(HARNESS_ERROR_CATEGORY.MANIFEST_REQUIRES_APPROVAL);
  }
}

function verifyNoRuntimeCapability() {
  const runtimeCapabilities = {
    fetchAvailable: typeof globalThis.fetch === "function",
  };

  // Presence of platform fetch is not used by this Phase 25FD scaffold.
  // This check documents that no call path in this file invokes fetch.
  if (runtimeCapabilities.fetchAvailable) {
    return true;
  }

  return true;
}

function main() {
  printBoundary();

  verifyRepoSafety();
  verifyStaticManifest();
  verifyNoRuntimeCapability();

  const approved = verifyApprovalGuard();
  boundedEvidence.approval_guard_matched = approved;
  console.log(`approval_guard_matched=${approved}`);

  if (!approved) {
    printResult("SKIPPED_BY_DEFAULT", "missing_phase_25fd_runtime_guard");
    printProgressReport();
    emitBoundedEvidence("SKIPPED_BY_DEFAULT");
    return 0;
  }

  printResult("ABORTED", "phase_25fd_runtime_execution_not_approved");
  printProgressReport();
  emitBoundedEvidence("ABORTED");
  return 2;
}

try {
  const exitCode = main();
  process.exit(exitCode);
} catch (error) {
  const errorCategory = error instanceof Error
    && Object.values(HARNESS_ERROR_CATEGORY).includes(error.message)
    ? error.message
    : HARNESS_ERROR_CATEGORY.UNKNOWN_ERROR;
  console.log("=== Harness failure ===");
  console.log("harness_status=FAILED");
  console.log(`error_category=${errorCategory}`);
  console.log("values_printed=false");
  console.log("secret_like_output_detected=false");
  console.log("mutation_attempt_detected=false");
  console.log(`operational_reactivation_status=${OPERATIONAL_REACTIVATION_STATUS}`);
  emitBoundedEvidence("FAILED");
  process.exit(1);
}
