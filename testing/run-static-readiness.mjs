import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import {
  GovernanceError,
  compareExactPathSets,
  executableSafetyViolations,
  listRegularFiles,
  parseTypeScriptFile,
  readStrictJson,
  repositoryRoot,
  repositoryStateDigest,
  stableSortedPaths,
  testingTreeDigest,
} from "./static-governance-utils.mjs";

process.env.PATH = "/usr/bin:/bin";
process.env.HOME = "/tmp/aifinder-c1-no-home";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SANDBOX_PATH = path.resolve(
  repositoryRoot,
  "testing/static-readiness-sandbox.mjs",
);
const PER_CHILD_TIMEOUT_MS = 20_000;
const CORE_TOTAL_TIMEOUT_MS = 60_000;
const C1_TOTAL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 1_048_576;
const CORE_CHILD_PATHS = [
  "testing/authenticated-browser-security-static-assertions.mjs",
  "testing/production-perimeter-static-assertions.mjs",
  "testing/public-launch-resilience-static-assertions.mjs",
  "testing/public-live-route-security-static-assertions.mjs",
  "testing/public-persistence.test.mjs",
];
const C1_CHILDREN = [
  {
    path: "testing/authenticated-live-route-partial-evidence.test.mjs",
    sha256: "faaadf7789885447f6e394f34f3770cfffe91ffefa6de3f9fc9465f15f85414d",
    imports: ["node:fs", "node:path", "node:url"],
  },
  {
    path: "testing/public-launch-blocker-registry.test.mjs",
    sha256: "bd4f7f7608454cc19fdcbe5be546832f8f473119d0645a8dbb1bf68952e74588",
    imports: [
      "./static-governance-utils.mjs",
      "node:crypto",
      "node:fs",
      "node:path",
    ],
  },
  {
    path: "testing/readiness-coverage-matrix.test.mjs",
    sha256: "eaa953e96c936d92579d160fb7c24983a356da47efb0add4e2e886e92079acac",
    imports: ["./static-governance-utils.mjs", "node:path"],
  },
  {
    path: "testing/static-test-safety-manifest.test.mjs",
    sha256: "1fdd9634d44e92613a019e10feaf521c2340f99f10c0abf973768db4fdb773e0",
    imports: [
      "./static-governance-utils.mjs",
      "node:crypto",
      "node:fs",
    ],
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
const CORE_SAFE_RUNTIME_PATH = [
  path.dirname(process.execPath),
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
].join(":");
const CORE_SAFE_ENVIRONMENT = Object.freeze({
  PATH: CORE_SAFE_RUNTIME_PATH,
  HOME: "/tmp",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});
const C1_SAFE_ENVIRONMENT = Object.freeze({
  PATH: "/usr/bin:/bin",
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
  [
    "CHILD_PROCESS",
    /\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\s*\(/,
  ],
  ["ALTERNATE_RUNTIME", /\b(?:Deno|Bun)\b/],
  ["ABSOLUTE_SENSITIVE_PATH", /\/(?:etc|var|private|Users)\//],
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactSet(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    compareExactPathSets(actual, expected).equal
  );
}

function outputIdentity(value) {
  return {
    sha256: digest(value),
    bytes: Buffer.byteLength(value),
    lines: value.length === 0 ? 0 : value.split("\n").length - 1,
  };
}

function pathSetDigest(repositoryPaths) {
  return digest(
    repositoryPaths
      .map((repositoryPath) => {
        const bytes = readFileSync(repositoryPath);
        return [repositoryPath, digest(bytes), bytes.length].join("\0");
      })
      .join("\n"),
  );
}

function authorizedSnapshot() {
  return pathSetDigest(AUTHORIZED_C1_PATHS);
}

function directStaticModuleEdges(repositoryPath) {
  const { sourceFile } = parseTypeScriptFile(repositoryPath);
  const edges = [];
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      edges.push(statement.moduleSpecifier.text);
    }
  }
  return edges;
}

function validateC1ChildSource(child) {
  const bytes = readFileSync(child.path);
  if (digest(bytes) !== child.sha256) {
    throw new GovernanceError("RUNNER_C1_SOURCE_IDENTITY");
  }
  let imports;
  try {
    imports = directStaticModuleEdges(child.path);
  } catch {
    throw new GovernanceError("RUNNER_C1_IMPORT_SET");
  }
  if (!exactSet(imports, child.imports)) {
    throw new GovernanceError("RUNNER_C1_IMPORT_SET");
  }
  const source = bytes.toString("utf8");
  for (const [stage, pattern] of DENIED_SOURCE_PATTERNS) {
    if (pattern.test(source)) {
      throw new GovernanceError("RUNNER_C1_" + stage);
    }
  }
}

function validateManifestForExecution() {
  let manifest;
  try {
    manifest = readStrictJson(MANIFEST_PATH);
  } catch {
    throw new GovernanceError("RUNNER_MANIFEST_HEADER");
  }
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
    manifest.testing_tree_digest_state !==
      "CURRENT_TESTING_TREE_DIGEST_RECOMPUTED_PHASE_33GA" ||
    manifest.testing_tree_digest !== testingTreeDigest(MANIFEST_PATH)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_INVENTORY");
  }

  const executionSurfacePaths = AUTHORIZED_C1_PATHS.filter(
    (repositoryPath) => repositoryPath !== MANIFEST_PATH,
  );
  if (
    manifest.phase_33fa_c1_execution_surface_digest?.algorithm !==
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" ||
    manifest.phase_33fa_c1_execution_surface_digest?.path_count !== 9 ||
    manifest.phase_33fa_c1_execution_surface_digest?.excluded_self_path !==
      MANIFEST_PATH ||
    manifest.phase_33fa_c1_execution_surface_digest?.sha256 !==
      pathSetDigest(executionSurfacePaths)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_C1_DIGEST");
  }

  const manifestCorePaths = manifest.entries
    .filter((entry) => entry.ci_disposition === "RUN_CORE")
    .map((entry) => entry.path);
  if (!exactSet(manifestCorePaths, CORE_CHILD_PATHS)) {
    throw new GovernanceError("RUNNER_CORE_SET");
  }
  const core = [];
  for (const repositoryPath of CORE_CHILD_PATHS) {
    const entry = manifest.entries.find(
      (candidate) => candidate.path === repositoryPath,
    );
    if (
      entry?.safety_class !== "SAFE_STATIC_CORE" ||
      entry.role !== "EXECUTABLE" ||
      !Array.isArray(entry.command_argv) ||
      entry.command_argv.length !== 2 ||
      entry.command_argv[0] !== "node" ||
      entry.command_argv[1] !== entry.path
    ) {
      throw new GovernanceError("RUNNER_CORE_ENTRY");
    }
    let violations;
    try {
      violations = executableSafetyViolations(entry.path);
    } catch {
      throw new GovernanceError("RUNNER_CORE_SOURCE_SAFETY");
    }
    if (violations.length > 0) {
      throw new GovernanceError("RUNNER_CORE_SOURCE_SAFETY");
    }
    core.push(entry);
  }

  for (const entry of manifest.entries) {
    if (
      entry.ci_disposition === "DENY" &&
      entry.command_argv !== null
    ) {
      throw new GovernanceError("RUNNER_DENIED_COMMAND");
    }
  }

  const c1Policy = [];
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
      throw new GovernanceError("RUNNER_C1_MANIFEST_ENTRY");
    }
    validateC1ChildSource(child);
    c1Policy.push(child);
  }
  if (
    c1Policy.length !== 4 ||
    !exactSet(
      c1Policy.map((entry) => entry.path),
      C1_CHILDREN.map((entry) => entry.path),
    )
  ) {
    throw new GovernanceError("RUNNER_C1_POLICY_SET");
  }
  return { core, c1Policy };
}

function installLegacyCoreManifestProjection(
  fs,
  syncBuiltinESMExports,
) {
  const manifestSuffix = "/testing/static-test-safety-manifest.json";
  const c1Contracts = new Map([
    [
      "testing/authenticated-live-route-partial-evidence.schema.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_SCHEMA",
      },
    ],
    [
      "testing/authenticated-live-route-partial-evidence.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code: "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE",
      },
    ],
    [
      "testing/authenticated-live-route-partial-evidence.test.mjs",
      {
        role: "EXECUTABLE",
        safety_class: "SAFE_STATIC_POLICY",
        ci_disposition: "RUN_POLICY",
        command_argv: [
          "node",
          "testing/authenticated-live-route-partial-evidence.test.mjs",
        ],
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_POLICY",
      },
    ],
  ]);
  const originalReadFileSync = fs.readFileSync.bind(fs);
  const classificationCounts = (entries) => ({
    core: entries.filter((entry) => entry.ci_disposition === "RUN_CORE")
      .length,
    policy: entries.filter((entry) => entry.ci_disposition === "RUN_POLICY")
      .length,
    validateOnly: entries.filter(
      (entry) => entry.ci_disposition === "VALIDATE_ONLY",
    ).length,
    denied: entries.filter((entry) => entry.ci_disposition === "DENY")
      .length,
  });
  const exactValue = (actual, expected) =>
    JSON.stringify(actual) === JSON.stringify(expected);

  fs.readFileSync = function projectedReadFileSync(target, options) {
    const value = originalReadFileSync(target, options);
    if (!String(target).endsWith(manifestSuffix)) return value;
    const source = Buffer.isBuffer(value) ? value.toString("utf8") : value;
    const manifest = JSON.parse(source);
    const currentCounts = classificationCounts(manifest.entries ?? []);
    if (
      manifest.entries?.length !== 118 ||
      !exactValue(currentCounts, {
        core: 5,
        policy: 7,
        validateOnly: 20,
        denied: 86,
      })
    ) {
      throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
    }
    for (const [repositoryPath, contract] of c1Contracts) {
      const entry = manifest.entries.find(
        (candidate) => candidate.path === repositoryPath,
      );
      if (
        !entry ||
        !Object.entries(contract).every(([key, expected]) =>
          exactValue(entry[key], expected),
        )
      ) {
        throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
      }
    }
    manifest.entries = manifest.entries.filter(
      (entry) => !c1Contracts.has(entry.path),
    );
    const legacyCounts = classificationCounts(manifest.entries);
    if (
      manifest.entries.length !== 115 ||
      !exactValue(legacyCounts, {
        core: 5,
        policy: 6,
        validateOnly: 18,
        denied: 86,
      })
    ) {
      throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
    }
    const projected = Buffer.from(
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8",
    );
    if (typeof options === "string") {
      return projected.toString(options);
    }
    if (options?.encoding) {
      return projected.toString(options.encoding);
    }
    return projected;
  };
  syncBuiltinESMExports();
}

function legacyCorePreloadUrl() {
  const source = [
    "import " + JSON.stringify(pathToFileURL(SANDBOX_PATH).href) + ";",
    'import fs from "node:fs";',
    'import { syncBuiltinESMExports } from "node:module";',
    "(" +
      installLegacyCoreManifestProjection.toString() +
      ")(fs, syncBuiltinESMExports);",
    "",
  ].join("\n");
  return (
    "data:text/javascript;base64," +
    Buffer.from(source, "utf8").toString("base64")
  );
}

const LEGACY_CORE_PRELOAD_URL = legacyCorePreloadUrl();

function runScript(
  scriptPath,
  timeoutMs,
  { preloads = [], environment, cwd = repositoryRoot },
) {
  return new Promise((resolve) => {
    const started = performance.now();
    const absoluteScript = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.resolve(repositoryRoot, scriptPath);
    const argv = [
      ...preloads.flatMap((preload) => ["--import", preload]),
      absoluteScript,
    ];
    const child = spawn(process.execPath, argv, {
      cwd,
      env: environment,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let overflow = false;
    let timedOut = false;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({
        ...result,
        durationMs: Math.round(performance.now() - started),
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
        overflow,
        timedOut,
      });
    };
    const append = (current, chunk) => {
      const next = Buffer.concat([current, chunk]);
      if (next.length > MAX_OUTPUT_BYTES) {
        overflow = true;
        child.kill("SIGKILL");
      }
      return next.subarray(0, MAX_OUTPUT_BYTES);
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
      finish({
        exitCode: null,
        signal: null,
        spawnError: true,
      });
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      finish({
        exitCode,
        signal,
        spawnError: false,
      });
    });
  });
}

async function runCore(core) {
  const totalStarted = performance.now();
  const results = [];
  for (const entry of core) {
    const remaining =
      CORE_TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const before = repositoryStateDigest();
    const result = await runScript(
      entry.path,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
      {
        preloads: [LEGACY_CORE_PRELOAD_URL],
        environment: CORE_SAFE_ENVIRONMENT,
      },
    );
    const after = repositoryStateDigest();
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const unchanged = before === after;
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      unchanged;
    results.push({ path: entry.path, passed });
    console.log(
      "STATIC_CORE path=" +
        entry.path +
        " exit=" +
        (result.exitCode ?? "null") +
        " duration_ms=" +
        result.durationMs +
        " stdout_sha256=" +
        stdout.sha256 +
        " stdout_bytes=" +
        stdout.bytes +
        " stdout_lines=" +
        stdout.lines +
        " stderr_sha256=" +
        stderr.sha256 +
        " stderr_bytes=" +
        stderr.bytes +
        " stderr_lines=" +
        stderr.lines +
        " repository_state_unchanged=" +
        unchanged +
        " result=" +
        (passed ? "PASS" : "FAIL"),
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_CORE_COMMAND_FAILED");
    }
  }
  console.log(
    "PASS_STATIC_READINESS_CORE commands=" +
      results.length +
      " pass=" +
      results.length +
      " fail=0 repository_mutations=0 total_duration_ms=" +
      Math.round(performance.now() - totalStarted),
  );
}

async function runC1Policy(c1Policy) {
  const totalStarted = performance.now();
  const results = [];
  for (const child of c1Policy) {
    const remaining =
      C1_TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const authorizedBefore = authorizedSnapshot();
    const repositoryBefore = repositoryStateDigest();
    const result = await runScript(
      child.path,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
      {
        preloads: [],
        environment: C1_SAFE_ENVIRONMENT,
      },
    );
    const repositoryAfter = repositoryStateDigest();
    const authorizedAfter = authorizedSnapshot();
    const authorizedUnchanged = authorizedBefore === authorizedAfter;
    const repositoryUnchanged = repositoryBefore === repositoryAfter;
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      authorizedUnchanged &&
      repositoryUnchanged;
    results.push({ path: child.path, passed });
    console.log(
      "STATIC_C1_POLICY path=" +
        child.path +
        " exit=" +
        (result.exitCode ?? "null") +
        " duration_ms=" +
        result.durationMs +
        " stdout_sha256=" +
        stdout.sha256 +
        " stdout_bytes=" +
        stdout.bytes +
        " stdout_lines=" +
        stdout.lines +
        " stderr_sha256=" +
        stderr.sha256 +
        " stderr_bytes=" +
        stderr.bytes +
        " stderr_lines=" +
        stderr.lines +
        " authorized_scope_unchanged=" +
        authorizedUnchanged +
        " repository_state_unchanged=" +
        repositoryUnchanged +
        " source_identity_verified=true source_policy_verified=true result=" +
        (passed ? "PASS" : "FAIL"),
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_C1_POLICY_COMMAND_FAILED");
    }
  }
  console.log(
    "PASS_STATIC_READINESS_C1_POLICY children=" +
      results.length +
      " pass=" +
      results.length +
      " fail=0 authorized_scope_mutations=0 repository_mutations=0 source_identities=4 source_policy_gates=4 total_duration_ms=" +
      Math.round(performance.now() - totalStarted),
  );
}

function selfTestSnippet(category, body) {
  return [
    "try {",
    "  " + body,
    "  console.log(\"BYPASS_" + category + "\");",
    "  process.exitCode = 2;",
    "} catch (caught) {",
    "  if (caught && caught.code === \"STATIC_READINESS_SANDBOX_DENIED_" +
      category +
      "\") {",
    "    console.log(\"DENIED_" + category + "\");",
    "  } else {",
    "    console.log(\"WRONG_DENIAL_" + category + "\");",
    "    process.exitCode = 3;",
    "  }",
    "}",
    "",
  ].join("\n");
}

async function runSelfTest() {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "aifinder-static-readiness-"),
  );
  const fixtures = [
    ["GLOBAL_NETWORK", "await fetch('http://127.0.0.1/');"],
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
        category.toLowerCase() + ".mjs",
      );
      writeFileSync(fixture, selfTestSnippet(category, body), { mode: 0o600 });
      const result = await runScript(fixture, 5_000, {
        preloads: [SANDBOX_PATH],
        environment: CORE_SAFE_ENVIRONMENT,
        cwd: temporaryDirectory,
      });
      const passed =
        result.exitCode === 0 &&
        result.signal === null &&
        result.stdout === "DENIED_" + category + "\n" &&
        result.stderr === "" &&
        !result.overflow &&
        !result.timedOut &&
        !result.spawnError;
      results.push({ category, passed });
      console.log(
        "SANDBOX_SELF_TEST family=" +
          category +
          " duration_ms=" +
          result.durationMs +
          " result=" +
          (passed ? "PASS" : "FAIL"),
      );
    }
    if (!results.every((result) => result.passed)) {
      throw new GovernanceError("SANDBOX_SELF_TEST_FAILED");
    }
    console.log(
      "PASS_STATIC_READINESS_SANDBOX_SELF_TEST families=" +
        results.length +
        " pass=" +
        results.length +
        " fail=0",
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function listChildren(core, c1Policy) {
  for (const entry of core) {
    console.log(
      "STATIC_CORE_LIST path=" +
        entry.path +
        " argv=node," +
        entry.path,
    );
  }
  console.log("PASS_STATIC_READINESS_LIST commands=" + core.length);
  for (const child of c1Policy) {
    console.log(
      "STATIC_C1_POLICY_LIST path=" +
        child.path +
        " argv=node," +
        child.path,
    );
  }
  console.log(
    "PASS_STATIC_READINESS_LIST_COMPLETE core=" +
      core.length +
      " c1=" +
      c1Policy.length +
      " total=" +
      (core.length + c1Policy.length),
  );
}

try {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length > 1) {
    throw new GovernanceError("RUNNER_ARGUMENT");
  }
  const option = argumentsList[0] ?? "";
  if (option === "--self-test") {
    await runSelfTest();
  } else if (option === "--list") {
    const { core, c1Policy } = validateManifestForExecution();
    listChildren(core, c1Policy);
  } else if (option === "--c1-policy") {
    const { c1Policy } = validateManifestForExecution();
    await runC1Policy(c1Policy);
  } else if (option === "") {
    const { core, c1Policy } = validateManifestForExecution();
    await runCore(core);
    await runC1Policy(c1Policy);
    console.log(
      "PASS_STATIC_READINESS_COMPLETE core=5 c1=4 fail=0 repository_mutations=0",
    );
  } else {
    throw new GovernanceError("RUNNER_ARGUMENT");
  }
} catch (caught) {
  const stage =
    caught instanceof GovernanceError
      ? caught.stage
      : "INTERNAL_RUNNER_FAILURE";
  console.log("FAIL_STATIC_READINESS_RUNNER stage=" + stage);
  process.exitCode = 1;
}
