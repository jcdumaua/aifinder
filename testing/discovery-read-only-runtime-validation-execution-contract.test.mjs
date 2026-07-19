import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const paths = Object.freeze({
  harness: path.join(testDirectory, "discovery-read-only-runtime-validation-harness.mjs"),
  staticTest: path.join(testDirectory, "discovery-read-only-runtime-validation-harness-static-contract.test.mjs"),
  wrapper: path.join(testDirectory, "discovery-read-only-runtime-validation-execution-wrapper-candidate.sh"),
  validator: path.join(testDirectory, "discovery-read-only-runtime-validation-evidence-validator.mjs"),
  executionTest: fileURLToPath(import.meta.url),
  batchRecord: path.join(repositoryRoot, "docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md"),
});

async function sources() {
  const entries = await Promise.all(Object.entries(paths).map(async ([name, sourcePath]) => [name, await readFile(sourcePath, "utf8")]));
  return Object.freeze(Object.fromEntries(entries));
}

function extractDeclaration(source, name) {
  const start = source.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `missing fixed declaration ${name}`);
  const end = source.indexOf(";", start);
  assert.notEqual(end, -1, `unterminated fixed declaration ${name}`);
  return source.slice(start, end + 1);
}

test("harness binds absolute Git, minimum version, exact config, and sealed environment", async () => {
  const { harness } = await sources();
  assert.equal(extractDeclaration(harness, "GIT_EXECUTABLE"), 'const GIT_EXECUTABLE = "/usr/bin/git";');
  assert.equal(extractDeclaration(harness, "MINIMUM_GIT_VERSION"), "const MINIMUM_GIT_VERSION = Object.freeze([2, 35, 2]);");
  const config = extractDeclaration(harness, "GIT_CONFIG_OVERRIDE_ARGS");
  for (const value of ["core.fsmonitor=false", "core.untrackedCache=false", "core.hooksPath=/dev/null", "credential.helper=", "credential.interactive=false", "diff.external="]) {
    assert.match(config, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const environment = extractDeclaration(harness, "SEALED_GIT_ENVIRONMENT");
  for (const value of ['LANG: "C"', 'LC_ALL: "C"', 'GIT_CONFIG_NOSYSTEM: "1"', 'GIT_CONFIG_GLOBAL: "/dev/null"', 'GIT_OPTIONAL_LOCKS: "0"', 'GIT_TERMINAL_PROMPT: "0"', 'GIT_PAGER: "cat"', 'PAGER: "cat"']) {
    assert.match(environment, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(environment, /\bPATH\b|\bHOME\b|process\.env|\.\.\./);
});

test("harness operation allowlist has exactly four local fixed operations", async () => {
  const { harness } = await sources();
  const operationBlock = harness.slice(harness.indexOf("const GIT_OPERATION"), harness.indexOf("const GIT_RESULT_CLASS"));
  assert.equal(operationBlock.match(/args: Object\.freeze\(/g)?.length, 4);
  for (const operation of ['["--version"]', '["branch", "--show-current"]', '["rev-parse", "HEAD"]', '["status", "--porcelain", "--untracked-files=all"]']) {
    assert.ok(operationBlock.includes(operation));
  }
  assert.doesNotMatch(operationBlock, /fetch|pull|push|ls-remote|add|commit|reset|restore|clean|checkout|switch|stash|rebase|merge|submodule|remote/);
});

test("harness subprocess contract is fixed and non-shell", async () => {
  const { harness } = await sources();
  const invocation = harness.slice(harness.indexOf("function runGit"), harness.indexOf("function repoRoot"));
  assert.match(invocation, /spawnSync\(GIT_EXECUTABLE, buildGitArguments\(operation\)/);
  assert.match(invocation, /timeout: GIT_TIMEOUT_MS/);
  assert.match(invocation, /maxBuffer: GIT_MAX_BUFFER_BYTES/);
  assert.match(invocation, /killSignal: GIT_KILL_SIGNAL/);
  assert.match(invocation, /shell: false/);
  assert.match(invocation, /stdio: \["ignore", "pipe", "pipe"\]/);
  assert.match(invocation, /env: SEALED_GIT_ENVIRONMENT/);
  assert.doesNotMatch(invocation, /process\.env|retry|shell:\s*true/);
});

test("wrapper remains inert and binds only execution-gate placeholders", async () => {
  const { wrapper } = await sources();
  assert.match(wrapper, /^#!\/usr\/bin\/env bash/m);
  assert.match(wrapper, /EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"/);
  assert.match(wrapper, /NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"/);
  assert.match(wrapper, /OUTER_TIMEOUT_SECONDS=10/);
  assert.match(wrapper, /MAX_COMBINED_LOG_BYTES=2097152/);
  assert.match(wrapper, /MAX_VALIDATOR_INPUT_BYTES=1048576/);
  assert.match(wrapper, /MAX_CAPTURE_FILE_BYTES=1048576/);
  assert.match(wrapper, /MAX_CAPTURE_FILE_BLOCKS_1024=1024/);
  assert.doesNotMatch(wrapper, /MAX_CAPTURE_FILE_BLOCKS_512/);
  assert.match(wrapper, /umask 077/);
  assert.doesNotMatch(wrapper, /declare -A|mapfile|readarray|\[\[ -v |\$\{[^}]+,,\}|bash -c|sh -c/);
});

test("wrapper seals every future Node launch and never forwards approval", async () => {
  const { wrapper } = await sources();
  assert.match(wrapper, /HARNESS_SYNTAX\) exec \/usr\/bin\/env -i LANG=C LC_ALL=C "\$NODE_EXECUTABLE" --check/);
  assert.match(wrapper, /STATIC_TESTS\) exec \/usr\/bin\/env -i LANG=C LC_ALL=C "\$NODE_EXECUTABLE" --test/);
  assert.match(wrapper, /HARNESS\) exec \/usr\/bin\/env -i LANG=C LC_ALL=C AIFINDER_EXPECTED_EXECUTION_BASELINE="\$EXPECTED_EXECUTION_BASELINE"/);
  assert.match(wrapper, /VALIDATOR\) exec \/usr\/bin\/env -i LANG=C LC_ALL=C "\$NODE_EXECUTABLE"[^\n]*DEFAULT_GUARD_SKIPPED/);
  assert.doesNotMatch(wrapper, /AIFINDER_RUN_DISCOVERY_READ_ONLY_RUNTIME_VALIDATION_HARNESS_25FD|APPROVAL_GUARD/);
  assert.doesNotMatch(wrapper, /\bPATH=|\bHOME=|env -i[^\n]*(?:PATH|HOME)=/);
});

test("wrapper applies fail-closed resource bounds and watchdog to every child", async () => {
  const { wrapper } = await sources();
  const runner = wrapper.slice(wrapper.indexOf("run_fixed_child_with_watchdog()"), wrapper.indexOf("run_future_authorized_static_checks()"));
  assert.match(runner, /ulimit -f "\$MAX_CAPTURE_FILE_BLOCKS_1024" \|\| exit 96/);
  assert.match(runner, /exec \/usr\/bin\/env -i/g);
  assert.match(runner, /\/bin\/sleep "\$OUTER_TIMEOUT_SECONDS"/);
  assert.match(runner, /\/bin\/kill -KILL "\$child_pid"/);
  assert.match(runner, /RESOURCE_LIMIT_SETUP_FAILED/);
  assert.match(runner, /WATCHDOG_SETUP_FAILED/);
  assert.match(runner, /CHILD_FILE_LIMIT_EXCEEDED/);
  assert.match(runner, /check_capture_bounds/);
  assert.match(wrapper, /STDOUT_CAPTURE_LIMIT_EXCEEDED/);
  assert.match(wrapper, /STDERR_CAPTURE_LIMIT_EXCEEDED/);
  assert.match(wrapper, /COMBINED_OUTPUT_LIMIT_EXCEEDED/);
});

test("wrapper documents absolute future launch and exact two-line binding", async () => {
  const { wrapper } = await sources();
  assert.match(wrapper, /Future invocation: \/usr\/bin\/env -i \/bin\/bash \/tmp\/<exact-bound-wrapper-path>/);
  assert.equal(wrapper.match(/^EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"$/gm)?.length, 1);
  assert.equal(wrapper.match(/^NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"$/gm)?.length, 1);
  assert.equal(wrapper.match(/__BIND_AT_EXECUTION_GATE__/g)?.length, 2);
  assert.match(wrapper, /\[ "\$#" -eq 0 \]/);
});

test("validator is bounded, rejects duplicates and unknown fields, and has no active capabilities", async () => {
  const { validator } = await sources();
  assert.match(validator, /const MAX_VALIDATOR_INPUT_BYTES = 1024 \* 1024;/);
  assert.match(validator, /JSON_DUPLICATE_KEY/);
  assert.match(validator, /UNKNOWN_FIELD/);
  assert.match(validator, /NESTED_VALUE_FORBIDDEN/);
  assert.match(validator, /FIELD_TYPE_INVALID/);
  assert.match(validator, /NEGATIVE_EXACT_KEYS/);
  const imports = validator.split("\n").filter((line) => line.startsWith("import ")).join("\n");
  assert.doesNotMatch(imports, /child_process|http|https|net|tls|dns/);
  assert.doesNotMatch(validator, /process\.env|spawn\s*\(|spawnSync\s*\(|exec\s*\(|execFile\s*\(|eval\s*\(|new Function|import\s*\(/);
});

test("validator enforces the one exact default-guard semantic profile", async () => {
  const { validator } = await sources();
  assert.match(validator, /const DEFAULT_GUARD_SKIPPED_PROFILE = Object\.freeze\(\{/);
  assert.match(validator, /DEFAULT_GUARD_SKIPPED: DEFAULT_GUARD_SKIPPED_PROFILE/);
  for (const value of [
    'harness_status: "SKIPPED_BY_DEFAULT"', "approval_guard_matched: false", "runtime_validation: false",
    "route_invocation: false", "network_call: false", "live_db_read: false", "db_mutation: false",
    'repository_state_class: "EXPECTED_EXCLUDED_ONLY"', "untracked_count: 5", 'git_version_class: "SUPPORTED"',
  ]) assert.ok(validator.includes(value));
  assert.match(validator, /PROFILE_UNKNOWN/);
  assert.match(validator, /PROFILE_MISMATCH/);
  assert.match(validator, /process\.argv\.length !== 4/);
  assert.match(validator, /validateBoundedEvidenceFile\(process\.argv\[2\], process\.argv\[3\]\)/);
});

test("Apple Git parser contract is identical in intent across JavaScript and Bash", async () => {
  const { harness, wrapper } = await sources();
  assert.ok(harness.includes("^git version ([0-9]+)\\.([0-9]+)\\.([0-9]+)(?: \\(Apple Git-([0-9]+)\\))?$"));
  assert.ok(wrapper.includes("^git\\ version\\ ([0-9]+)\\.([0-9]+)\\.([0-9]+)(\\ \\(Apple\\ Git-([0-9]+)\\))?$"));
  assert.match(wrapper, /MINIMUM_GIT_VERSION="2\.35\.2"/);
});

test("sources contain no caller-controlled escape path or active prohibited command", async () => {
  const { harness, wrapper, validator } = await sources();
  const activeSources = `${harness}\n${wrapper}\n${validator}`;
  assert.doesNotMatch(activeSources, /\b(?:curl|wget|netcat|psql|supabase)\s+/);
  assert.doesNotMatch(activeSources, /\b(?:npm|npx|next)\s+(?:run|dev|start|build)|git\s+(?:push|reset|restore|clean|checkout|switch|stash|rebase)/);
  assert.doesNotMatch(activeSources, /\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/);
  const mainBody = wrapper.slice(wrapper.indexOf("main()"), wrapper.lastIndexOf("main"));
  assert.doesNotMatch(mainBody, /\$1|\$@|getopts|shift\b/);
  assert.match(wrapper, /\[ "\$#" -eq 0 \]/);
});

test("batch record preserves non-execution and Phase 27GW classifications", async () => {
  const { batchRecord } = await sources();
  assert.match(batchRecord, /PHASE_27GW_RECLASSIFICATION_OCCURRED=false/);
  assert.match(batchRecord, /CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING=1/);
  assert.match(batchRecord, /UNRESOLVED_REQUIRES_TARGETED_INSPECTION=5/);
  assert.match(batchRecord, /BLOCKED_PENDING_SEPARATE_AUTHORIZATION=2/);
  assert.match(batchRecord, /DOWNSTREAM_NOT_YET_ELIGIBLE=1/);
  assert.match(batchRecord, /HARNESS_EXECUTED=false/);
  assert.match(batchRecord, /STATIC_TESTS_EXECUTED=false/);
  assert.match(batchRecord, /WRAPPER_EXECUTED=false/);
  assert.match(batchRecord, /VALIDATOR_EXECUTED=false/);
});

test("existing static contract test remains source-only", async () => {
  const { staticTest, executionTest } = await sources();
  const imports = staticTest.split("\n").filter((line) => line.startsWith("import ")).join("\n");
  const selfImports = executionTest.split("\n").filter((line) => line.startsWith("import ")).join("\n");
  assert.doesNotMatch(imports, /child_process|http|https|net|tls|dns/);
  assert.doesNotMatch(selfImports, /child_process|http|https|net|tls|dns/);
  assert.doesNotMatch(staticTest, /process\.env|spawn\s*\(|spawnSync\s*\(|exec\s*\(|execFile\s*\(/);
  assert.match(executionTest, /const paths = Object\.freeze\(\{/);
});
