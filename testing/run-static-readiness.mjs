import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawn } from "node:child_process";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const PER_CHILD_TIMEOUT_MS = 20_000;
const TOTAL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 1_048_576;
const C1_CHILDREN = [
  {
    path: "testing/authenticated-live-route-partial-evidence.test.mjs",
    sha256: "faaadf7789885447f6e394f34f3770cfffe91ffefa6de3f9fc9465f15f85414d",
    imports: ["node:fs", "node:path", "node:url"],
  },
  {
    path: "testing/public-launch-blocker-registry.test.mjs",
    sha256: "9aa7a63260c91657c04610a482bddc1b213a721d12184af3da864c84a79b0548",
    imports: ["node:crypto", "node:fs"],
  },
  {
    path: "testing/readiness-coverage-matrix.test.mjs",
    sha256: "14e0fca1b00fb41c1b564938a00b53e8a5b9864ba1afc8be40e15f7e481fa586",
    imports: ["node:fs"],
  },
  {
    path: "testing/static-test-safety-manifest.test.mjs",
    sha256: "009b62b39715a8c03d3d97075cde7ba96f87d241de11bb93e2088ea8d102ff11",
    imports: ["node:crypto", "node:fs"],
  },
];
const AUTHORIZED_C1_PATHS = [
  "testing/authenticated-live-route-partial-evidence.schema.json",
  "testing/authenticated-live-route-partial-evidence.json",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/readiness-coverage-matrix.json",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.json",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const SAFE_ENVIRONMENT = Object.freeze({
  PATH: dirname(process.execPath),
  HOME: "/tmp/aifinder-c1-no-home",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});
const DENIED_SOURCE_PATTERNS = [
  ["DYNAMIC_IMPORT", /\bimport\s*\(/],
  ["COMMONJS_REQUIRE", /\brequire\s*\(/],
  ["DYNAMIC_CODE", /\b(?:eval|Function)\s*\(/],
  ["ENVIRONMENT_ACCESS", /process\s*(?:\.\s*env|\[\s*["']env["']\s*\])/],
  ["NETWORK_GLOBAL", /\b(?:fetch|WebSocket|EventSource|XMLHttpRequest)\b/],
  [
    "NETWORK_MODULE",
    /["']node:(?:http|https|net|tls|dns|dgram|worker_threads|vm|module)["']/,
  ],
  [
    "FILESYSTEM_MUTATION",
    /\b(?:writeFile|appendFile|truncate|unlink|rm|rename|mkdir|rmdir|chmod|chown|symlink|link|copyFile|createWriteStream|open)\w*\s*\(/,
  ],
  ["CHILD_PROCESS", /\b(?:spawn|exec|execFile|fork)\w*\s*\(/],
  ["ALTERNATE_RUNTIME", /\b(?:Deno|Bun)\b/],
  ["ABSOLUTE_SENSITIVE_PATH", /\/(?:etc|var|private|Users)\//],
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactSet(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
  );
}

function outputIdentity(value) {
  return {
    sha256: sha256(value),
    bytes: Buffer.byteLength(value),
    lines: value.length === 0 ? 0 : value.split("\n").length - 1,
  };
}

function pathSetDigest(repositoryPaths) {
  return sha256(
    repositoryPaths.map((repositoryPath) => {
      const bytes = readFileSync(repositoryPath);
      return [
        repositoryPath,
        sha256(bytes),
        bytes.length,
      ].join("\0");
    }).join("\n"),
  );
}

function authorizedSnapshot() {
  return pathSetDigest(AUTHORIZED_C1_PATHS);
}

function importedModules(source) {
  return [...source.matchAll(
    /^\s*import\s+(?:[^"'\n]*?\sfrom\s*)?["']([^"']+)["'];?\s*$/gm,
  )].map((match) => match[1]);
}

function validateChildSource(child) {
  const source = readFileSync(child.path, "utf8");
  if (sha256(source) !== child.sha256) {
    throw new Error("RUNNER_C1_SOURCE_IDENTITY");
  }
  if (!exactSet(importedModules(source), child.imports)) {
    throw new Error("RUNNER_C1_IMPORT_SET");
  }
  for (const [stage, pattern] of DENIED_SOURCE_PATTERNS) {
    if (pattern.test(source)) {
      throw new Error("RUNNER_C1_" + stage);
    }
  }
}

function validateManifest() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (
    manifest.manifest_version !== 1 ||
    manifest.repository_baseline !==
      "01a5c779f3f47f9619a2cd4a913622e010145afc" ||
    !Array.isArray(manifest.entries)
  ) {
    throw new Error("RUNNER_MANIFEST_HEADER");
  }
  const executionSurfacePaths = AUTHORIZED_C1_PATHS.filter(
    (repositoryPath) => repositoryPath !== MANIFEST_PATH,
  );
  if (
    manifest.testing_tree_digest !==
      "7c446a347640f7ef3e7008fdcd36ea83d21dc4a88fabcebd9b735d8267a59d36" ||
    manifest.testing_tree_digest_state !==
      "BASELINE_SNAPSHOT_PRESERVED_NOT_RECOMPUTED_OUTSIDE_EXACT_READ_SCOPE" ||
    manifest.phase_33fa_c1_execution_surface_digest?.algorithm !==
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" ||
    manifest.phase_33fa_c1_execution_surface_digest?.path_count !== 9 ||
    manifest.phase_33fa_c1_execution_surface_digest?.excluded_self_path !==
      MANIFEST_PATH ||
    manifest.phase_33fa_c1_execution_surface_digest?.sha256 !==
      pathSetDigest(executionSurfacePaths)
  ) {
    throw new Error("RUNNER_MANIFEST_C1_DIGEST");
  }
  const selected = [];
  for (const child of C1_CHILDREN) {
    const entry = manifest.entries.find(
      (candidate) => candidate.path === child.path,
    );
    if (
      entry?.role !== "EXECUTABLE" ||
      entry.safety_class !== "SAFE_STATIC_POLICY" ||
      entry.ci_disposition !== "RUN_POLICY" ||
      JSON.stringify(entry.command_argv) !==
        JSON.stringify(["node", child.path])
    ) {
      throw new Error("RUNNER_C1_MANIFEST_ENTRY");
    }
    validateChildSource(child);
    selected.push(child);
  }
  if (
    selected.length !== 4 ||
    !exactSet(
      selected.map((entry) => entry.path),
      C1_CHILDREN.map((entry) => entry.path),
    )
  ) {
    throw new Error("RUNNER_C1_POLICY_SET");
  }
  return selected;
}

function runChild(child, timeoutMs) {
  return new Promise((resolve) => {
    const started = performance.now();
    const before = authorizedSnapshot();
    const processHandle = spawn(process.execPath, [child.path], {
      cwd: process.cwd(),
      env: SAFE_ENVIRONMENT,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let overflow = false;
    let timedOut = false;
    const append = (current, chunk) => {
      const next = current + chunk.toString("utf8");
      if (Buffer.byteLength(next) > MAX_OUTPUT_BYTES) {
        overflow = true;
        processHandle.kill("SIGKILL");
      }
      return next.slice(0, MAX_OUTPUT_BYTES);
    };
    processHandle.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
    });
    processHandle.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      processHandle.kill("SIGKILL");
    }, timeoutMs);
    processHandle.on("error", () => {
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
        unchanged: before === authorizedSnapshot(),
      });
    });
    processHandle.on("close", (exitCode, signal) => {
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
        unchanged: before === authorizedSnapshot(),
      });
    });
  });
}

async function runC1Policy() {
  if (process.argv.length !== 2) {
    throw new Error("RUNNER_ARGUMENT");
  }
  const children = validateManifest();
  const totalStarted = performance.now();
  const results = [];
  for (const child of children) {
    const remaining = TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) throw new Error("RUNNER_TOTAL_TIMEOUT");
    const result = await runChild(
      child,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
    );
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      result.unchanged;
    results.push({ path: child.path, passed });
    console.log(
      `STATIC_C1_POLICY path=${child.path} exit=${result.exitCode ?? "null"} duration_ms=${result.durationMs} stdout_sha256=${stdout.sha256} stdout_bytes=${stdout.bytes} stdout_lines=${stdout.lines} stderr_sha256=${stderr.sha256} stderr_bytes=${stderr.bytes} stderr_lines=${stderr.lines} authorized_scope_unchanged=${result.unchanged} source_identity_verified=true source_policy_verified=true result=${passed ? "PASS" : "FAIL"}`,
    );
    if (!passed) throw new Error("RUNNER_C1_POLICY_COMMAND_FAILED");
  }
  console.log(
    `PASS_STATIC_READINESS_C1_POLICY children=${results.length} pass=${results.length} fail=0 authorized_scope_mutations=0 source_identities=4 source_policy_gates=4 total_duration_ms=${Math.round(performance.now() - totalStarted)}`,
  );
}

try {
  await runC1Policy();
} catch (caught) {
  const stage =
    caught instanceof Error && /^[A-Z0-9_]+$/.test(caught.message)
      ? caught.message
      : "INTERNAL_RUNNER_FAILURE";
  console.log(`FAIL_STATIC_READINESS_RUNNER stage=${stage}`);
  process.exitCode = 1;
}
