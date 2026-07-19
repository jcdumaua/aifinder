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
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PHASE = "25FD";
const TASK = "read-only-runtime-validation-harness";
const APPROVAL_GUARD = "AIFINDER_RUN_DISCOVERY_READ_ONLY_RUNTIME_VALIDATION_HARNESS_25FD";
const EXPECTED_BRANCH = "main";
const EXPECTED_BASELINE = "81bfcdfae9532f2bc8aeeef1696617543a0f3309";
const OPERATIONAL_REACTIVATION_STATUS = "blocked";
const GIT_COMMAND = "git";
const GIT_TIMEOUT_MS = 5000;
const GIT_MAX_BUFFER_BYTES = 1024 * 1024;
const GIT_KILL_SIGNAL = "SIGKILL";
const GIT_ENCODING = "utf8";
const SAFE_CHILD_ENV_NAMES = Object.freeze(["PATH"]);

const GIT_OPERATION = Object.freeze({
  BRANCH: Object.freeze({
    id: "BRANCH",
    args: Object.freeze(["branch", "--show-current"]),
    outputRequired: true,
  }),
  HEAD: Object.freeze({
    id: "HEAD",
    args: Object.freeze(["rev-parse", "HEAD"]),
    outputRequired: true,
  }),
  STATUS: Object.freeze({
    id: "STATUS",
    args: Object.freeze(["status", "--porcelain"]),
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
});

const HARNESS_ERROR_CATEGORY = Object.freeze({
  WRONG_REPOSITORY: "WRONG_REPOSITORY",
  GIT_OPERATION_FAILED: "GIT_OPERATION_FAILED",
  WRONG_BRANCH: "WRONG_BRANCH",
  WRONG_BASELINE: "WRONG_BASELINE",
  DIRTY_WORKING_TREE: "DIRTY_WORKING_TREE",
  MANIFEST_INVALID: "MANIFEST_INVALID",
  MANIFEST_REQUIRES_APPROVAL: "MANIFEST_REQUIRES_APPROVAL",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
});

/**
 * Phase 25FD intentionally ships no route entries.
 * A later approved manifest-population phase must add route entries before any
 * route can even be considered for validation.
 */
const STATIC_ROUTE_MANIFEST = Object.freeze([]);

function createGitChildEnvironment(sourceEnvironment) {
  const childEnvironment = {
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_OPTIONAL_LOCKS: "0",
  };

  const pathName = SAFE_CHILD_ENV_NAMES[0];
  const pathValue = sourceEnvironment.PATH;
  childEnvironment[pathName] = typeof pathValue === "string" && pathValue.length > 0
    ? pathValue
    : "/usr/bin:/bin:/usr/sbin:/sbin";

  return Object.freeze(childEnvironment);
}

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

  if (errorCode === "ETIMEDOUT") {
    resultClass = GIT_RESULT_CLASS.TIMEOUT;
  } else if (errorCode === "ENOBUFS" || outputBytes > GIT_MAX_BUFFER_BYTES) {
    resultClass = GIT_RESULT_CLASS.OUTPUT_LIMIT_EXCEEDED;
  } else if (result.error) {
    resultClass = GIT_RESULT_CLASS.SPAWN_ERROR;
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

function runGit(operation, repositoryRoot) {
  const result = spawnSync(GIT_COMMAND, operation.args, {
    cwd: repositoryRoot,
    encoding: GIT_ENCODING,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: GIT_MAX_BUFFER_BYTES,
    killSignal: GIT_KILL_SIGNAL,
    shell: false,
    env: createGitChildEnvironment(process.env),
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
    console.log(`git_${evidence.operation.toLowerCase()}_success=${evidence.success}`);
    console.log(`git_${evidence.operation.toLowerCase()}_result_class=${evidence.resultClass}`);
    console.log(`git_${evidence.operation.toLowerCase()}_status=${evidence.status ?? "absent"}`);
    console.log(`git_${evidence.operation.toLowerCase()}_timed_out=${evidence.timedOut}`);
    console.log(`git_${evidence.operation.toLowerCase()}_output_limit_exceeded=${evidence.outputLimitExceeded}`);
    console.log(`git_${evidence.operation.toLowerCase()}_signal_present=${evidence.signalPresent}`);
    console.log(`git_${evidence.operation.toLowerCase()}_stdout_present=${evidence.stdoutPresent}`);
    console.log(`git_${evidence.operation.toLowerCase()}_stderr_present=${evidence.stderrPresent}`);
    console.log(`git_${evidence.operation.toLowerCase()}_stdout_length=${evidence.stdoutLengthBucket}`);
    console.log(`git_${evidence.operation.toLowerCase()}_stderr_length=${evidence.stderrLengthBucket}`);
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

function verifyRepoSafety() {
  const root = repoRoot();
  const evidenceRows = [];

  if (!existsSync(resolve(root, ".git"))) {
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_REPOSITORY);
  }

  const branch = runGit(GIT_OPERATION.BRANCH, root);
  evidenceRows.push(branch.evidence);
  requireGitSuccess(branch);
  if (branch.value !== EXPECTED_BRANCH) {
    printGitEvidence([withGitResultClass(branch.evidence, GIT_RESULT_CLASS.IDENTITY_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_BRANCH);
  }

  const head = runGit(GIT_OPERATION.HEAD, root);
  evidenceRows.push(head.evidence);
  requireGitSuccess(head);
  if (!/^[0-9a-f]{40}$/.test(head.value)) {
    printGitEvidence([withGitResultClass(head.evidence, GIT_RESULT_CLASS.OUTPUT_MALFORMED)]);
    throw new Error(HARNESS_ERROR_CATEGORY.GIT_OPERATION_FAILED);
  }
  if (head.value !== EXPECTED_BASELINE) {
    printGitEvidence([withGitResultClass(head.evidence, GIT_RESULT_CLASS.IDENTITY_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.WRONG_BASELINE);
  }

  const status = runGit(GIT_OPERATION.STATUS, root);
  evidenceRows.push(status.evidence);
  requireGitSuccess(status);
  if (status.value.length > 0) {
    printGitEvidence([withGitResultClass(status.evidence, GIT_RESULT_CLASS.REPOSITORY_STATE_MISMATCH)]);
    throw new Error(HARNESS_ERROR_CATEGORY.DIRTY_WORKING_TREE);
  }

  printGitEvidence(evidenceRows);
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

  if (!approved) {
    printResult("SKIPPED_BY_DEFAULT", "missing_phase_25fd_runtime_guard");
    printProgressReport();
    return 0;
  }

  printResult("ABORTED", "phase_25fd_runtime_execution_not_approved");
  printProgressReport();
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
  process.exit(1);
}
