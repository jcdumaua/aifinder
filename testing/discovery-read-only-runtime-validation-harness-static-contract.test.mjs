import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isGitVersionSupported,
  parseGitVersion,
} from "./discovery-read-only-runtime-validation-harness.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const harnessPath = path.join(testDirectory, "discovery-read-only-runtime-validation-harness.mjs");
const dependencyHarnessPath = path.join(
  testDirectory,
  "discovery-admin-route-read-only-dependency-inventory-source-harness.mjs",
);
const phase27GwPath = path.resolve(
  testDirectory,
  "../docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md",
);

const EXPECTED_GIT_ENVIRONMENT_FIELDS = Object.freeze([
  "GIT_CONFIG_GLOBAL",
  "GIT_CONFIG_NOSYSTEM",
  "GIT_OPTIONAL_LOCKS",
  "GIT_PAGER",
  "GIT_TERMINAL_PROMPT",
  "LANG",
  "LC_ALL",
  "PAGER",
]);

const EXPECTED_GIT_CONFIG_OVERRIDES = Object.freeze([
  "core.fsmonitor=false",
  "core.untrackedCache=false",
  "core.hooksPath=/dev/null",
  "credential.helper=",
  "credential.interactive=false",
  "diff.external=",
]);

const EXPECTED_PHASE_27GW_TOKENS = Object.freeze([
  "CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING=1",
  "UNRESOLVED_REQUIRES_TARGETED_INSPECTION=5",
  "BLOCKED_PENDING_SEPARATE_AUTHORIZATION=2",
  "DOWNSTREAM_NOT_YET_ELIGIBLE=1",
  "TOTAL_PREREQUISITE_DOMAINS=9",
  "PRIMARY_CLASSIFICATION_CONFLICTS=0",
  "PHASE_27GW_RECLASSIFICATION_OCCURRED=false",
]);

async function readHarness() {
  return readFile(harnessPath, "utf8");
}

function extractDeclaration(source, name) {
  const start = source.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `missing fixed declaration ${name}`);
  const end = source.indexOf(";", start);
  assert.notEqual(end, -1, `unterminated fixed declaration ${name}`);
  return source.slice(start, end + 1);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `unterminated function ${name}`);
  return source.slice(start, end + 2);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertParsedVersion(value, expected) {
  const parsed = parseGitVersion(value);
  assert.ok(Array.isArray(parsed), `${value} must parse to a version tuple`);
  assert.deepEqual([...parsed], expected);
  return parsed;
}

test("harness is import-inert and emits exactly one JSON stdout record synchronously", async () => {
  const source = await readHarness();
  const finalEvidenceHelper = extractFunction(source, "emitBoundedEvidence");
  const sourceOutsideFinalEvidenceHelper = source.replace(finalEvidenceHelper, "");
  const approvedFsImports = ["accessSync", "existsSync", "lstatSync", "readFileSync", "writeSync"];
  const fsSpecifiers = [...source.matchAll(/["'](?:node:)?fs(?:\/promises)?["']/g)];
  const namedFsImports = [...source.matchAll(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']node:fs["']\s*;?/g,
  )];
  const importedFsBindings = namedFsImports.length === 1
    ? namedFsImports[0][1].split(",").map((binding) => binding.trim()).filter(Boolean)
    : [];
  const forbiddenFsMutationApis = [
    "write" + "File",
    "write" + "FileSync",
    "append" + "File",
    "append" + "FileSync",
    "write" + "v",
    "write" + "vSync",
    "create" + "WriteStream",
    "Write" + "Stream",
  ];
  const writeSyncReferences = [...source.matchAll(/\bwriteSync\b/g)];
  const directWriteSyncCalls = [...source.matchAll(/\bwriteSync\s*\(\s*([0-9]+)\s*,/g)];
  const fdOneOperations = directWriteSyncCalls.filter((match) => match[1] === "1");
  const helperStart = source.indexOf(finalEvidenceHelper);
  const helperEnd = helperStart + finalEvidenceHelper.length;
  const prohibitedConsoleToken = "con" + "sole";

  assert.match(source, /^#!\/usr\/bin\/env node/m);
  assert.match(source, /const isCli = process\.argv\[1\][\s\S]*import\.meta\.url/);
  assert.equal(fsSpecifiers.length, 1, "harness must have exactly one direct fs module specifier");
  assert.equal(namedFsImports.length, 1, "harness must use one named node:fs import");
  assert.equal(
    importedFsBindings.every((binding) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(binding)),
    true,
    "harness node:fs imports must not use aliases",
  );
  assert.deepEqual([...importedFsBindings].sort(), [...approvedFsImports].sort());
  assert.equal(
    writeSyncReferences.length,
    directWriteSyncCalls.length + 1,
    "writeSync may appear only in its approved import and direct fixed-descriptor calls",
  );
  assert.equal(
    directWriteSyncCalls.every((match) => match[1] === "1" || match[1] === "2"),
    true,
    "writeSync descriptors must be statically fixed to stdout or stderr",
  );
  assert.equal(fdOneOperations.length, 1, "exactly one descriptor-1 operation is allowed");
  assert.equal(fdOneOperations[0].index >= helperStart && fdOneOperations[0].index < helperEnd, true);
  assert.match(finalEvidenceHelper, /writeSync\s*\(\s*1\s*,\s*`\$\{JSON\.stringify\([^`]+\)\}\\n`\s*\)/);
  assert.doesNotMatch(sourceOutsideFinalEvidenceHelper, /\bwriteSync\s*\(\s*1\s*,/);
  assert.equal(source.includes(prohibitedConsoleToken), false, "harness must contain no console token");
  for (const capability of forbiddenFsMutationApis) {
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${capability}\\b`),
      `harness gained forbidden fs output capability ${capability}`,
    );
  }
  assert.doesNotMatch(
    source,
    /console\s*(?:\.|\[)|process\s*(?:\.\s*stdout\b|\[\s*["']stdout["']\s*\])|\bstdout\s*(?:\.\s*write\b|\[\s*["']write["']\s*\])|new\s+(?:Console|Writable|Duplex|Transform|PassThrough)\b/,
  );
  assert.doesNotMatch(source, /process\.exit\s*\(/);
  assert.match(source, /process\.exitCode\s*=/);
});

test("harness emits exactly once on each mutually exclusive terminal CLI path", async () => {
  const source = await readHarness();
  const emitHelper = extractFunction(source, "emitBoundedEvidence");
  const mainBlock = extractFunction(source, "main");
  const cliStart = source.indexOf("const isCli =");
  assert.notEqual(cliStart, -1, "missing terminal CLI block");
  const cliBlock = source.slice(cliStart);
  const sourceOutsideEmitHelper = source.replace(emitHelper, "");
  const allEmitCalls = sourceOutsideEmitHelper.match(/\bemitBoundedEvidence\s*\(/g) ?? [];
  const terminalStatuses = ["SKIPPED_BY_DEFAULT", "ABORTED", "FAILED"];
  const loopPattern = /\b(?:for|while)\s*\(|\bdo\b/;

  assert.equal(allEmitCalls.length, 3, "harness must have exactly three terminal emit calls");
  for (const status of terminalStatuses) {
    const exactCall = `emitBoundedEvidence("${status}")`;
    assert.equal(
      sourceOutsideEmitHelper.split(exactCall).length - 1,
      1,
      `harness must have exactly one literal ${status} emit call`,
    );
  }

  assert.equal(mainBlock.match(/\bemitBoundedEvidence\s*\(/g)?.length, 2);
  assert.equal(cliBlock.match(/\bemitBoundedEvidence\s*\(/g)?.length, 1);
  assert.doesNotMatch(mainBlock, loopPattern, "main terminal emissions must not be looped");
  assert.doesNotMatch(cliBlock, loopPattern, "CLI failure emission must not be looped");
  assert.match(
    mainBlock,
    /if \(!approved\) \{[\s\S]*emitBoundedEvidence\("SKIPPED_BY_DEFAULT"\);[\s\S]*return 0;[\s\S]*\}[\s\S]*emitBoundedEvidence\("ABORTED"\);[\s\S]*return 2;/,
  );
  assert.match(
    cliBlock,
    /try \{[\s\S]*const exitCode = main\(\);[\s\S]*\} catch \(error\) \{[\s\S]*emitBoundedEvidence\("FAILED"\);[\s\S]*process\.exitCode = 1;/,
  );
});

test("harness diagnostics are stderr-only and categorical", async () => {
  const source = await readHarness();
  const diagnosticStart = source.indexOf("function writeDiagnosticLine");
  assert.notEqual(diagnosticStart, -1);
  const diagnosticEnd = source.indexOf("\n}", diagnosticStart);
  assert.notEqual(diagnosticEnd, -1);
  const diagnosticBody = source.slice(diagnosticStart, diagnosticEnd + 2);

  assert.match(diagnosticBody, /writeSync\(2,\s*`\$\{value\}\\n`\)/);
  assert.doesNotMatch(diagnosticBody, /writeSync\(1,|console\./);
  assert.doesNotMatch(source, /write(?:Sync)?\([^\n]*(?:\.stack|error\.message)|stdout\s*:|stderr\s*:/);
});

test("harness Git operation allowlist and sealed child environment are exact", async () => {
  const source = await readHarness();
  const operationBlock = source.slice(
    source.indexOf("const GIT_OPERATION"),
    source.indexOf("const GIT_RESULT_CLASS"),
  );
  const environment = extractDeclaration(source, "SEALED_GIT_ENVIRONMENT");
  const environmentFields = [...environment.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)]
    .map((match) => match[1])
    .sort();
  const config = extractDeclaration(source, "GIT_CONFIG_OVERRIDE_ARGS");

  assert.equal(extractDeclaration(source, "GIT_EXECUTABLE"), 'const GIT_EXECUTABLE = "/usr/bin/git";');
  assert.equal(
    extractDeclaration(source, "MINIMUM_GIT_VERSION"),
    "const MINIMUM_GIT_VERSION = Object.freeze([2, 35, 2]);",
  );
  assert.equal(operationBlock.match(/args: Object\.freeze\(/g)?.length, 4);
  for (const operation of [
    '["--version"]',
    '["branch", "--show-current"]',
    '["rev-parse", "HEAD"]',
    '["status", "--porcelain", "--untracked-files=all"]',
  ]) {
    assert.ok(operationBlock.includes(operation), `missing fixed Git operation ${operation}`);
  }
  assert.doesNotMatch(
    operationBlock,
    /fetch|pull|push|ls-remote|add|commit|reset|restore|clean|checkout|switch|stash|rebase|merge|submodule|remote/,
  );

  assert.deepEqual(environmentFields, [...EXPECTED_GIT_ENVIRONMENT_FIELDS]);
  for (const field of [
    'LANG: "C"',
    'LC_ALL: "C"',
    'GIT_CONFIG_NOSYSTEM: "1"',
    'GIT_CONFIG_GLOBAL: "/dev/null"',
    'GIT_OPTIONAL_LOCKS: "0"',
    'GIT_TERMINAL_PROMPT: "0"',
    'GIT_PAGER: "cat"',
    'PAGER: "cat"',
  ]) {
    assert.ok(environment.includes(field), `missing exact Git environment field ${field}`);
  }
  assert.doesNotMatch(environment, /\bPATH\b|\bHOME\b|process\.env|\.\.\.|AIFINDER_/);

  for (const override of EXPECTED_GIT_CONFIG_OVERRIDES) {
    assert.equal(config.split(`"${override}"`).length - 1, 1, `unexpected count for ${override}`);
  }
  assert.equal(config.match(/"-c"/g)?.length, EXPECTED_GIT_CONFIG_OVERRIDES.length);
});

test("runGit consumes the fixed executable, arguments, environment, timeout, and bounds", async () => {
  const source = await readHarness();
  const argumentBuilder = extractFunction(source, "buildGitArguments");
  const runGit = extractFunction(source, "runGit");

  assert.match(argumentBuilder, /return operation\.args;/);
  assert.match(argumentBuilder, /\.\.\.GIT_CONFIG_OVERRIDE_ARGS, \.\.\.operation\.args/);
  assert.match(runGit, /spawnSync\(GIT_EXECUTABLE, buildGitArguments\(operation\),\s*\{/);
  assert.match(runGit, /cwd: repositoryRoot/);
  assert.match(runGit, /encoding: GIT_ENCODING/);
  assert.match(runGit, /stdio: \["ignore", "pipe", "pipe"\]/);
  assert.match(runGit, /timeout: GIT_TIMEOUT_MS/);
  assert.match(runGit, /maxBuffer: GIT_MAX_BUFFER_BYTES/);
  assert.match(runGit, /killSignal: GIT_KILL_SIGNAL/);
  assert.match(runGit, /shell: false/);
  assert.match(runGit, /env: SEALED_GIT_ENVIRONMENT/);
  assert.equal(extractDeclaration(source, "GIT_TIMEOUT_MS"), "const GIT_TIMEOUT_MS = 5000;");
  assert.equal(
    extractDeclaration(source, "GIT_MAX_BUFFER_BYTES"),
    "const GIT_MAX_BUFFER_BYTES = 1024 * 1024;",
  );
});

test("harness baseline is dynamically bound and never disclosed", async () => {
  const source = await readHarness();
  const environment = extractDeclaration(source, "SEALED_GIT_ENVIRONMENT");

  assert.match(
    source,
    /const EXPECTED_BASELINE_ENVIRONMENT_KEY = "AIFINDER_EXPECTED_EXECUTION_BASELINE";/,
  );
  assert.match(source, /process\.env\[EXPECTED_BASELINE_ENVIRONMENT_KEY\]/);
  assert.match(source, /!\/\^\[0-9a-f\]\{40\}\$\/\.test\(expectedBaseline\)/);
  assert.match(source, /head\.value !== expectedBaseline/);
  assert.doesNotMatch(source, /const EXPECTED_BASELINE = "[0-9a-f]{40}";/);
  assert.doesNotMatch(source, /["']expected_baseline["']|expected_baseline\s*:/);
  assert.doesNotMatch(environment, /AIFINDER_EXPECTED_EXECUTION_BASELINE|EXPECTED_BASELINE/);
  assert.doesNotMatch(source, /write(?:Sync)?\([^\n]*expectedBaseline|JSON\.stringify\([^\n]*expectedBaseline/);
});

test("harness Git parser accepts only the exact safe-integer language", () => {
  assertParsedVersion("git version 2.35.2", [2, 35, 2]);
  assertParsedVersion("git version 2.44.0 (Apple Git-150)", [2, 44, 0]);

  for (const malformed of [
    "git version 2.44.0 (Apple Git-alpha)",
    "git version 2.44.0 (Apple Git-)",
    "git version 2.44.0 Apple Git-150",
    "git version 2.44.0 (Apple Git-150) extra",
    `git version ${Number.MAX_SAFE_INTEGER}0.35.2`,
    `git version 2.${Number.MAX_SAFE_INTEGER}0.2`,
    `git version 2.35.${Number.MAX_SAFE_INTEGER}0`,
    `git version 2.35.2 (Apple Git-${Number.MAX_SAFE_INTEGER}0)`,
  ]) {
    assert.equal(parseGitVersion(malformed), null, `${malformed} must be rejected`);
  }
});

test("harness Git minimum comparison rejects below-minimum versions", () => {
  assert.equal(isGitVersionSupported(assertParsedVersion("git version 2.35.1", [2, 35, 1])), false);
  assert.equal(isGitVersionSupported(assertParsedVersion("git version 2.35.2", [2, 35, 2])), true);
  assert.equal(isGitVersionSupported(assertParsedVersion("git version 2.36.0", [2, 36, 0])), true);
  assert.equal(isGitVersionSupported(assertParsedVersion("git version 3.0.0", [3, 0, 0])), true);
});

test("default guard evidence remains bounded and operationally blocked", async () => {
  const source = await readHarness();

  for (const field of [
    "approval_guard_matched: false",
    "runtime_validation: false",
    "route_invocation: false",
    "network_call: false",
    "live_db_read: false",
    "db_mutation: false",
    'operational_reactivation_status: "BLOCKED"',
  ]) {
    assert.ok(source.includes(field), `missing bounded default field ${field}`);
  }
  assert.match(source, /emitBoundedEvidence\("SKIPPED_BY_DEFAULT"\)/);
  assert.doesNotMatch(source, /\bfetch\s*\(|\b(?:createClient|createServerClient)\s*\(/);
  assert.match(source, /const STATIC_ROUTE_MANIFEST = Object\.freeze\(\[\]\);/);
});

test("unchanged dependency identities and Phase 27GW map remain exact", async () => {
  const [dependencyBytes, dependencyStat, phaseBytes, phaseStat] = await Promise.all([
    readFile(dependencyHarnessPath),
    lstat(dependencyHarnessPath),
    readFile(phase27GwPath),
    lstat(phase27GwPath),
  ]);
  const dependencySource = dependencyBytes.toString("utf8");
  const phaseSource = phaseBytes.toString("utf8");

  assert.equal(
    sha256(dependencyBytes),
    "1c27b39909d8b50d4aa046abb271592c79fa56688eb704525713e119afe6c17e",
  );
  assert.equal(dependencyStat.isFile(), true);
  assert.equal(dependencyStat.isSymbolicLink(), false);
  assert.equal(dependencyStat.mode & 0o777, 0o755);
  assert.match(dependencySource, /const PHASE = "25EN";/);

  assert.equal(
    sha256(phaseBytes),
    "c3cc24f772c79db7f3d8cb68a588c705c09a2874283e87a084f9603db912dc1e",
  );
  assert.equal(phaseStat.isFile(), true);
  assert.equal(phaseStat.isSymbolicLink(), false);
  assert.equal(phaseStat.mode & 0o777, 0o644);
  for (const token of EXPECTED_PHASE_27GW_TOKENS) {
    assert.equal(phaseSource.split(token).length - 1, 1, `unexpected count for ${token}`);
  }
  assert.doesNotMatch(phaseSource, /PHASE_27GW_RECLASSIFICATION_OCCURRED=true/);
});
