import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  GovernanceError,
  compareExactPathSets,
  executableSafetyViolations,
  listRegularFiles,
  readStrictJson,
  repositoryRoot,
  repositoryStateDigest,
  stableSortedPaths,
  testingTreeDigest,
} from "./static-governance-utils.mjs";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SANDBOX_PATH = path.resolve(
  repositoryRoot,
  "testing/static-readiness-sandbox.mjs",
);
const PER_COMMAND_TIMEOUT_MS = 20_000;
const TOTAL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 1_048_576;
const REQUIRED_CORE_PATHS = new Set([
  "testing/production-perimeter-static-assertions.mjs",
  "testing/public-launch-resilience-static-assertions.mjs",
  "testing/public-persistence.test.mjs",
]);
const SAFE_RUNTIME_PATH = [
  path.dirname(process.execPath),
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
].join(":");
const SAFE_ENVIRONMENT = Object.freeze({
  PATH: SAFE_RUNTIME_PATH,
  HOME: "/tmp",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function outputIdentity(value) {
  return {
    sha256: digest(value),
    bytes: Buffer.byteLength(value),
    lines: value.length === 0 ? 0 : value.split("\n").length - 1,
  };
}

function validateManifestForExecution() {
  const manifest = readStrictJson(MANIFEST_PATH);
  if (
    manifest.manifest_version !== 1 ||
    manifest.repository_baseline !==
      "01a5c779f3f47f9619a2cd4a913622e010145afc" ||
    !Array.isArray(manifest.entries)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_HEADER");
  }
  const inventory = listRegularFiles("testing");
  const paths = manifest.entries.map((entry) => entry.path);
  if (
    paths.length !== new Set(paths).size ||
    !paths.every(
      (entry, index) => entry === stableSortedPaths(paths)[index],
    ) ||
    !compareExactPathSets(paths, inventory).equal ||
    manifest.testing_tree_digest !== testingTreeDigest(MANIFEST_PATH)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_INVENTORY");
  }
  const core = [];
  for (const entry of manifest.entries) {
    if (entry.ci_disposition === "RUN_CORE") {
      if (
        entry.safety_class !== "SAFE_STATIC_CORE" ||
        entry.role !== "EXECUTABLE" ||
        !Array.isArray(entry.command_argv) ||
        entry.command_argv.length !== 2 ||
        entry.command_argv[0] !== "node" ||
        entry.command_argv[1] !== entry.path
      ) {
        throw new GovernanceError("RUNNER_CORE_ENTRY");
      }
      if (executableSafetyViolations(entry.path).length > 0) {
        throw new GovernanceError("RUNNER_CORE_SOURCE_SAFETY");
      }
      core.push(entry);
    } else if (
      entry.ci_disposition === "DENY" &&
      entry.command_argv !== null
    ) {
      throw new GovernanceError("RUNNER_DENIED_COMMAND");
    }
  }
  if (
    core.length < REQUIRED_CORE_PATHS.size ||
    ![...REQUIRED_CORE_PATHS].every((requiredPath) =>
      core.some((entry) => entry.path === requiredPath),
    )
  ) {
    throw new GovernanceError("RUNNER_CORE_MINIMUM");
  }
  return core;
}

function runNodeProcess(scriptPath, timeoutMs = PER_COMMAND_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(
      process.execPath,
      ["--import", SANDBOX_PATH, path.resolve(repositoryRoot, scriptPath)],
      {
        cwd: repositoryRoot,
        env: SAFE_ENVIRONMENT,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    let overflow = false;
    let timedOut = false;
    const append = (current, chunk) => {
      const next = current + chunk.toString("utf8");
      if (Buffer.byteLength(next) > MAX_OUTPUT_BYTES) {
        overflow = true;
        child.kill("SIGKILL");
      }
      return next.slice(0, MAX_OUTPUT_BYTES);
    };
    child.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.on("error", () => {
      clearTimeout(timer);
      resolve({
        exitCode: null,
        signal: null,
        durationMs: Math.round(performance.now() - started),
        stdout,
        stderr,
        overflow,
        timedOut,
        spawnError: true,
      });
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode,
        signal,
        durationMs: Math.round(performance.now() - started),
        stdout,
        stderr,
        overflow,
        timedOut,
        spawnError: false,
      });
    });
  });
}

async function runCore() {
  const core = validateManifestForExecution();
  const totalStarted = performance.now();
  const results = [];
  for (const entry of core) {
    const elapsed = performance.now() - totalStarted;
    const remaining = TOTAL_TIMEOUT_MS - elapsed;
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const before = repositoryStateDigest();
    const result = await runNodeProcess(
      entry.path,
      Math.min(PER_COMMAND_TIMEOUT_MS, remaining),
    );
    const after = repositoryStateDigest();
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      before === after;
    const bounded = {
      path: entry.path,
      exit_code: result.exitCode,
      duration_ms: result.durationMs,
      stdout,
      stderr,
      repository_state_unchanged: before === after,
      passed,
    };
    results.push(bounded);
    console.log(
      `STATIC_CORE path=${entry.path} exit=${result.exitCode ?? "null"} duration_ms=${result.durationMs} stdout_sha256=${stdout.sha256} stdout_bytes=${stdout.bytes} stdout_lines=${stdout.lines} stderr_sha256=${stderr.sha256} stderr_bytes=${stderr.bytes} stderr_lines=${stderr.lines} repository_state_unchanged=${before === after} result=${passed ? "PASS" : "FAIL"}`,
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_CORE_COMMAND_FAILED");
    }
  }
  console.log(
    `PASS_STATIC_READINESS_CORE commands=${results.length} pass=${results.length} fail=0 repository_mutations=0 total_duration_ms=${Math.round(performance.now() - totalStarted)}`,
  );
}

function selfTestSnippet(category, body) {
  return `
try {
  ${body}
  console.log("BYPASS_${category}");
  process.exitCode = 2;
} catch (caught) {
  if (caught && caught.code === "STATIC_READINESS_SANDBOX_DENIED_${category}") {
    console.log("DENIED_${category}");
  } else {
    console.log("WRONG_DENIAL_${category}");
    process.exitCode = 3;
  }
}
`.trimStart();
}

async function runSelfTest() {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "aifinder-static-readiness-"),
  );
  const fixtures = [
    [
      "GLOBAL_NETWORK",
      "await fetch('http://127.0.0.1/');",
    ],
    [
      "MODULE_NETWORK",
      "const http = await import('node:http'); http.get('http://127.0.0.1/');",
    ],
    [
      "CHILD_PROCESS",
      "const cp = await import('node:child_process'); cp.execFileSync('true');",
    ],
    [
      "FILESYSTEM_MUTATION",
      "const fs = await import('node:fs'); fs.writeFileSync(new URL('./blocked.txt', import.meta.url), 'blocked');",
    ],
  ];
  try {
    const results = [];
    for (const [category, body] of fixtures) {
      const fixture = path.join(
        temporaryDirectory,
        `${category.toLowerCase()}.mjs`,
      );
      writeFileSync(fixture, selfTestSnippet(category, body), { mode: 0o600 });
      const started = performance.now();
      const child = spawn(
        process.execPath,
        ["--import", SANDBOX_PATH, fixture],
        {
          cwd: temporaryDirectory,
          env: SAFE_ENVIRONMENT,
          shell: false,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      const stdoutChunks = [];
      const stderrChunks = [];
      child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
      const result = await new Promise((resolve) => {
        const timer = setTimeout(() => child.kill("SIGKILL"), 5_000);
        child.on("close", (exitCode, signal) => {
          clearTimeout(timer);
          resolve({ exitCode, signal });
        });
        child.on("error", () => {
          clearTimeout(timer);
          resolve({ exitCode: null, signal: null });
        });
      });
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      const passed =
        result.exitCode === 0 &&
        result.signal === null &&
        stdout === `DENIED_${category}\n` &&
        stderr === "";
      results.push({ category, passed });
      console.log(
        `SANDBOX_SELF_TEST family=${category} duration_ms=${Math.round(performance.now() - started)} result=${passed ? "PASS" : "FAIL"}`,
      );
    }
    if (!results.every((result) => result.passed)) {
      throw new GovernanceError("SANDBOX_SELF_TEST_FAILED");
    }
    console.log(
      `PASS_STATIC_READINESS_SANDBOX_SELF_TEST families=${results.length} pass=${results.length} fail=0`,
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function listCore() {
  const core = validateManifestForExecution();
  for (const entry of core) {
    console.log(`STATIC_CORE_LIST path=${entry.path} argv=node,${entry.path}`);
  }
  console.log(`PASS_STATIC_READINESS_LIST commands=${core.length}`);
}

try {
  const option = process.argv[2] ?? "";
  if (option === "--self-test") {
    await runSelfTest();
  } else if (option === "--list") {
    listCore();
  } else if (option === "") {
    await runCore();
  } else {
    throw new GovernanceError("RUNNER_ARGUMENT");
  }
} catch (caught) {
  const stage =
    caught instanceof GovernanceError ? caught.stage : "INTERNAL_RUNNER_FAILURE";
  console.log(`FAIL_STATIC_READINESS_RUNNER stage=${stage}`);
  process.exitCode = 1;
}
