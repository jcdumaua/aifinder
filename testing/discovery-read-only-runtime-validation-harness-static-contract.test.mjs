import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const harnessPath = path.join(testDirectory, "discovery-read-only-runtime-validation-harness.mjs");
const dependencyHarnessPath = path.join(testDirectory, "discovery-admin-route-read-only-dependency-inventory-source-harness.mjs");
const phase27GwPath = path.resolve(testDirectory, "../docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md");

async function readHarness() {
  return readFile(harnessPath, "utf8");
}

test("runtime harness source exists", async () => {
  assert.match(await readHarness(), /^#!\/usr\/bin\/env node/m);
});

test("Git executable and local operation allowlist are fixed", async () => {
  const source = await readHarness();
  assert.match(source, /const GIT_COMMAND = "git";/);
  assert.match(source, /BRANCH:[\s\S]*?args: Object\.freeze\(\["branch", "--show-current"\]\)/);
  assert.match(source, /HEAD:[\s\S]*?args: Object\.freeze\(\["rev-parse", "HEAD"\]\)/);
  assert.match(source, /STATUS:[\s\S]*?args: Object\.freeze\(\["status", "--porcelain"\]\)/);
  assert.equal(source.match(/args: Object\.freeze\(/g)?.length, 3);
  assert.doesNotMatch(source, /Object\.freeze\(\["(?:add|commit|push|reset|restore|clean|checkout|switch|stash|rebase|merge|fetch|pull|ls-remote)"/);
});

test("subprocess limits and fixed options are explicit", async () => {
  const source = await readHarness();
  assert.match(source, /const GIT_TIMEOUT_MS = 5000;/);
  assert.match(source, /const GIT_MAX_BUFFER_BYTES = 1024 \* 1024;/);
  assert.match(source, /const GIT_KILL_SIGNAL = "SIGKILL";/);
  assert.match(source, /const GIT_ENCODING = "utf8";/);
  assert.match(source, /cwd: repositoryRoot/);
  assert.match(source, /encoding: GIT_ENCODING/);
  assert.match(source, /stdio: \["ignore", "pipe", "pipe"\]/);
  assert.match(source, /timeout: GIT_TIMEOUT_MS/);
  assert.match(source, /maxBuffer: GIT_MAX_BUFFER_BYTES/);
  assert.match(source, /killSignal: GIT_KILL_SIGNAL/);
  assert.match(source, /shell: false/);
  assert.match(source, /env: createGitChildEnvironment\(process\.env\)/);
});

test("child environment is narrow and fixed", async () => {
  const source = await readHarness();
  assert.match(source, /const SAFE_CHILD_ENV_NAMES = Object\.freeze\(\["PATH"\]\);/);
  assert.match(source, /LANG: "C"/);
  assert.match(source, /LC_ALL: "C"/);
  assert.match(source, /GIT_CONFIG_NOSYSTEM: "1"/);
  assert.match(source, /GIT_CONFIG_GLOBAL: "\/dev\/null"/);
  assert.match(source, /GIT_OPTIONAL_LOCKS: "0"/);
  assert.match(source, /sourceEnvironment\.PATH/);
  assert.doesNotMatch(source, /\.\.\.\s*process\.env|Object\.assign\([^\n]*process\.env/);
  assert.doesNotMatch(source, /childEnvironment\[APPROVAL_GUARD\]|APPROVAL_GUARD\s*:/);
});

test("results use categorical and bounded evidence", async () => {
  const source = await readHarness();
  for (const resultClass of [
    "SUCCESS", "NONZERO_EXIT", "NO_EXIT_STATUS", "SIGNAL_TERMINATION", "TIMEOUT",
    "OUTPUT_LIMIT_EXCEEDED", "SPAWN_ERROR", "OUTPUT_MISSING", "OUTPUT_MALFORMED",
    "IDENTITY_MISMATCH", "REPOSITORY_STATE_MISMATCH",
  ]) {
    assert.match(source, new RegExp(`${resultClass}: "${resultClass}"`));
  }
  for (const bucket of ["EMPTY", "UP_TO_64_BYTES", "UP_TO_1_KIB", "UP_TO_64_KIB", "OVER_64_KIB"]) {
    assert.match(source, new RegExp(`"${bucket}"`));
  }
  const evidenceBody = source.match(/function createGitEvidence\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(evidenceBody, /stdout\s*:/);
  assert.doesNotMatch(evidenceBody, /stderr\s*:/);
  assert.doesNotMatch(evidenceBody, /\.message|\.stack/);
});

test("source contains no retry, shell interpolation, network, database, or route execution", async () => {
  const source = await readHarness();
  assert.doesNotMatch(source, /\bfetch\s*\(|\b(?:createClient|createServerClient)\s*\(|\.(?:insert|update|upsert|delete|rpc)\s*\(|\.listen\s*\(/);
  assert.doesNotMatch(source, /for\s*\([^)]*(?:retry|attempt)|while\s*\([^)]*(?:retry|attempt)/i);
  assert.doesNotMatch(source, /spawnSync\(\s*[^G]|shell:\s*true/);
  assert.match(source, /const STATIC_ROUTE_MANIFEST = Object\.freeze\(\[\]\);/);
});

test("dependency harness and Phase 27GW remain external static identities", async () => {
  const dependencySource = await readFile(dependencyHarnessPath, "utf8");
  const phase27GwSource = await readFile(phase27GwPath, "utf8");
  assert.match(dependencySource, /const PHASE = "25EN";/);
  assert.match(phase27GwSource, /CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING=1/);
  assert.match(phase27GwSource, /UNRESOLVED_REQUIRES_TARGETED_INSPECTION=5/);
  assert.match(phase27GwSource, /BLOCKED_PENDING_SEPARATE_AUTHORIZATION=2/);
  assert.match(phase27GwSource, /DOWNSTREAM_NOT_YET_ELIGIBLE=1/);
  assert.doesNotMatch(await readHarness(), /PHASE_27GW_RECLASSIFICATION_OCCURRED=true/);
});
