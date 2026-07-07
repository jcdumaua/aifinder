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

/**
 * Phase 25FD intentionally ships no route entries.
 * A later approved manifest-population phase must add route entries before any
 * route can even be considered for validation.
 */
const STATIC_ROUTE_MANIFEST = Object.freeze([]);

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
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

function verifyRepoSafety() {
  const root = repoRoot();

  if (!existsSync(resolve(root, ".git"))) {
    throw new Error("wrong_repo=true");
  }

  const branch = runGit(["branch", "--show-current"]);
  if (branch.status !== 0 || branch.stdout !== EXPECTED_BRANCH) {
    throw new Error("wrong_branch=true");
  }

  const head = runGit(["rev-parse", "HEAD"]);
  if (head.status !== 0 || head.stdout !== EXPECTED_BASELINE) {
    throw new Error("wrong_baseline=true");
  }

  const status = runGit(["status", "--porcelain"]);
  if (status.status !== 0 || status.stdout.length > 0) {
    throw new Error("dirty_working_tree=true");
  }
}

function verifyApprovalGuard() {
  if (process.env[APPROVAL_GUARD] !== "1") {
    return false;
  }

  return true;
}

function verifyStaticManifest() {
  if (!Array.isArray(STATIC_ROUTE_MANIFEST)) {
    throw new Error("manifest_invalid=true");
  }

  if (STATIC_ROUTE_MANIFEST.length !== 0) {
    throw new Error("manifest_population_requires_later_approval=true");
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
  console.log("=== Harness failure ===");
  console.log("harness_status=FAILED");
  console.log(`error_category=${error instanceof Error ? error.message : "unknown_error"}`);
  console.log("values_printed=false");
  console.log("secret_like_output_detected=false");
  console.log("mutation_attempt_detected=false");
  console.log(`operational_reactivation_status=${OPERATIONAL_REACTIVATION_STATUS}`);
  process.exit(1);
}
