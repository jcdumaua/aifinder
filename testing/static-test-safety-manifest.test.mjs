import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  GovernanceError,
  categoricalFailure,
  compareExactPathSets,
  executableSafetyViolations,
  listRegularFiles,
  readStrictJson,
  stableSortedPaths,
  testingTreeDigest,
} from "./static-governance-utils.mjs";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SCHEMA_PATH =
  "testing/authenticated-live-route-partial-evidence.schema.json";
const EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const POLICY_PATH =
  "testing/authenticated-live-route-partial-evidence.test.mjs";
const C2_ANALYZER_PATH =
  "testing/authenticated-live-route-semantic-analyzer.mjs";
const C2_ANALYZER_TEST_PATH =
  "testing/authenticated-live-route-semantic-analyzer.test.mjs";
const C2_SCHEMA_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.schema.json";
const C2_LEDGER_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.json";
const C2_LEDGER_TEST_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs";
const C2_CLASSIFICATION_PATHS = [
  C2_ANALYZER_PATH,
  C2_ANALYZER_TEST_PATH,
  C2_SCHEMA_PATH,
  C2_LEDGER_PATH,
  C2_LEDGER_TEST_PATH,
];
const C2_2_ANALYZER_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs";
const C2_2_ANALYZER_TEST_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.test.mjs";
const C2_2_SCHEMA_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.schema.json";
const C2_2_LEDGER_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.json";
const C2_2_LEDGER_TEST_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs";
const C2_2_CLASSIFICATION_PATHS = [
  C2_2_ANALYZER_PATH,
  C2_2_ANALYZER_TEST_PATH,
  C2_2_SCHEMA_PATH,
  C2_2_LEDGER_PATH,
  C2_2_LEDGER_TEST_PATH,
];
const C1_POLICY_PATHS = [
  POLICY_PATH,
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/static-test-safety-manifest.test.mjs",
];
const C1_EXECUTION_SURFACE_PATHS = [
  SCHEMA_PATH,
  EVIDENCE_PATH,
  POLICY_PATH,
  "testing/readiness-coverage-matrix.json",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.json",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const C2_EXECUTION_SURFACE_PATHS = [
  C2_ANALYZER_PATH,
  C2_ANALYZER_TEST_PATH,
  C2_SCHEMA_PATH,
  C2_LEDGER_PATH,
  C2_LEDGER_TEST_PATH,
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const C2_2_EXECUTION_SURFACE_PATHS = [
  C2_2_ANALYZER_PATH,
  C2_2_ANALYZER_TEST_PATH,
  C2_2_SCHEMA_PATH,
  C2_2_LEDGER_PATH,
  C2_2_LEDGER_TEST_PATH,
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const BASELINE = "01a5c779f3f47f9619a2cd4a913622e010145afc";
const ROLES = new Set(["EXECUTABLE", "SUPPORT", "FIXTURE", "CONFIG"]);
const CLASSES = new Set([
  "SAFE_STATIC_CORE",
  "SAFE_STATIC_POLICY",
  "SAFE_STATIC_SUPPORT",
  "STATIC_FIXTURE",
  "BROWSER_OR_PLAYWRIGHT",
  "LIVE_ROUTE_OR_SERVER",
  "DATABASE_OR_SUPABASE",
  "NETWORK_OR_EXTERNAL",
  "OPERATIONAL_MUTATION",
  "UNPROVEN_DENY",
]);
const DISPOSITIONS = new Set([
  "RUN_CORE",
  "RUN_POLICY",
  "VALIDATE_ONLY",
  "DENY",
]);
const REQUIRED_CORE = new Set([
  "testing/authenticated-browser-security-static-assertions.mjs",
  "testing/production-perimeter-static-assertions.mjs",
  "testing/public-launch-resilience-static-assertions.mjs",
  "testing/public-live-route-security-static-assertions.mjs",
  "testing/public-persistence.test.mjs",
]);
const REQUIRED_POLICY = new Set([
  "testing/accessibility-responsive-static-assertions.mjs",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/public-production-runtime-planning-manifest.test.mjs",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/static-readiness-workflow-static-assertions.mjs",
  "testing/static-test-safety-manifest.test.mjs",
  C2_ANALYZER_TEST_PATH,
  C2_LEDGER_TEST_PATH,
  C2_2_ANALYZER_TEST_PATH,
  C2_2_LEDGER_TEST_PATH,
]);
const DENIED_CLASSES = new Set([
  "BROWSER_OR_PLAYWRIGHT",
  "LIVE_ROUTE_OR_SERVER",
  "DATABASE_OR_SUPABASE",
  "NETWORK_OR_EXTERNAL",
  "OPERATIONAL_MUTATION",
  "UNPROVEN_DENY",
]);
const PROHIBITED_COMMAND_PARTS = [
  "npm",
  "npx",
  "bash",
  "sh",
  "playwright",
  "next",
  "supabase",
  "psql",
  "sql",
  "build",
  "dev",
  "start",
];

function fail(stage) {
  throw new GovernanceError(stage);
}

function assert(condition, stage) {
  if (!condition) fail(stage);
}

function exactArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function c1ExecutionSurfaceDigest() {
  return sha256(
    C1_EXECUTION_SURFACE_PATHS.map((repositoryPath) => {
      const bytes = readFileSync(repositoryPath);
      return [repositoryPath, sha256(bytes), bytes.length].join("\0");
    }).join("\n"),
  );
}

function c2ExecutionSurfaceDigest() {
  return sha256(
    C2_EXECUTION_SURFACE_PATHS.map((repositoryPath) => {
      const bytes = readFileSync(repositoryPath);
      return [repositoryPath, sha256(bytes), bytes.length].join("\0");
    }).join("\n"),
  );
}

function c2_2ExecutionSurfaceDigest() {
  return sha256(
    C2_2_EXECUTION_SURFACE_PATHS.map((repositoryPath) => {
      const bytes = readFileSync(repositoryPath);
      return [repositoryPath, sha256(bytes), bytes.length].join("\0");
    }).join("\n"),
  );
}

function validateManifest() {
  let manifest;
  try {
    manifest = readStrictJson(MANIFEST_PATH);
  } catch (caught) {
    if (
      caught instanceof GovernanceError &&
      caught.stage === "REGULAR_FILE_ABSENT"
    ) {
      fail("STATIC_TEST_SAFETY_MANIFEST_ABSENT");
    }
    throw caught;
  }

  if (
    C2_2_CLASSIFICATION_PATHS.every(
      (repositoryPath) =>
        !manifest.entries?.some((entry) => entry.path === repositoryPath),
    )
  ) {
    fail("MANIFEST_C2_2_EXPECTATIONS_MISSING");
  }

  if (
    C2_CLASSIFICATION_PATHS.every(
      (repositoryPath) =>
        !manifest.entries?.some((entry) => entry.path === repositoryPath),
    )
  ) {
    fail("MANIFEST_C2_1_EXPECTATIONS_MISSING");
  }

  assert(manifest.manifest_version === 1, "MANIFEST_VERSION");
  assert(manifest.repository_baseline === BASELINE, "MANIFEST_BASELINE");
  assert(Array.isArray(manifest.entries), "MANIFEST_ENTRIES");
  assert(
    typeof manifest.testing_tree_digest === "string" &&
      /^[0-9a-f]{64}$/.test(manifest.testing_tree_digest),
    "MANIFEST_TREE_DIGEST",
  );
  assert(
    typeof manifest.testing_tree_digest === "string" &&
      /^[0-9a-f]{64}$/.test(manifest.testing_tree_digest),
    "MANIFEST_DIGEST",
  );
  assert(
    manifest.testing_tree_digest_state ===
      "CURRENT_TESTING_TREE_DIGEST_RECOMPUTED_PHASE_33IA_C2_2",
    "MANIFEST_TREE_DIGEST",
  );
  assert(
    manifest.phase_33fa_c1_execution_surface_digest?.algorithm ===
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" &&
      manifest.phase_33fa_c1_execution_surface_digest?.path_count === 9 &&
      manifest.phase_33fa_c1_execution_surface_digest?.excluded_self_path ===
        MANIFEST_PATH &&
      manifest.phase_33fa_c1_execution_surface_digest?.sha256 ===
        c1ExecutionSurfaceDigest(),
    "MANIFEST_C1_EXECUTION_SURFACE_DIGEST",
  );
  assert(
    manifest.phase_c2_1_execution_surface_digest?.algorithm ===
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" &&
      manifest.phase_c2_1_execution_surface_digest?.path_count === 7 &&
      manifest.phase_c2_1_execution_surface_digest?.excluded_self_path ===
        MANIFEST_PATH &&
      manifest.phase_c2_1_execution_surface_digest?.sha256 ===
        c2ExecutionSurfaceDigest(),
    "MANIFEST_C2_1_EXECUTION_SURFACE_DIGEST",
  );
  assert(
    manifest.phase_c2_2_execution_surface_digest?.algorithm ===
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" &&
      manifest.phase_c2_2_execution_surface_digest?.path_count === 7 &&
      manifest.phase_c2_2_execution_surface_digest?.excluded_self_path ===
        MANIFEST_PATH &&
      manifest.phase_c2_2_execution_surface_digest?.sha256 ===
        c2_2ExecutionSurfaceDigest(),
    "MANIFEST_C2_2_EXECUTION_SURFACE_DIGEST",
  );

  const inventory = listRegularFiles("testing");
  const entryPaths = manifest.entries.map((entry) => entry.path);
  assert(
    manifest.entries.length === 128 &&
      entryPaths.length === new Set(entryPaths).size,
    "MANIFEST_ENTRY_SET",
  );
  assert(
    entryPaths.length === new Set(entryPaths).size,
    "MANIFEST_DUPLICATE_PATH",
  );
  assert(
    entryPaths.every((entry, index) => entry === stableSortedPaths(entryPaths)[index]),
    "MANIFEST_PATH_ORDER",
  );
  const inventoryComparison = compareExactPathSets(entryPaths, inventory);
  assert(inventoryComparison.equal, "MANIFEST_INVENTORY");
  assert(
    manifest.testing_tree_digest === testingTreeDigest(MANIFEST_PATH),
    "MANIFEST_TREE_DIGEST",
  );

  const corePaths = new Set();
  const policyPaths = new Set();
  for (const entry of manifest.entries) {
    assert(
      entry &&
        typeof entry === "object" &&
        typeof entry.path === "string" &&
        typeof entry.reason_code === "string" &&
        /^[A-Z0-9_]+$/.test(entry.reason_code),
      "MANIFEST_ENTRY_SHAPE",
    );
    assert(ROLES.has(entry.role), "MANIFEST_ROLE");
    assert(CLASSES.has(entry.safety_class), "MANIFEST_CLASS");
    assert(DISPOSITIONS.has(entry.ci_disposition), "MANIFEST_DISPOSITION");
    if (["RUN_CORE", "RUN_POLICY"].includes(entry.ci_disposition)) {
      assert(
        entry.role === "EXECUTABLE" &&
          exactArray(entry.command_argv, ["node", entry.path]),
        "MANIFEST_EXECUTABLE_COMMAND",
      );
    } else {
      assert(
        entry.command_argv === null,
        "MANIFEST_NONEXECUTABLE_COMMAND",
      );
    }
    if (entry.ci_disposition === "RUN_CORE") {
      corePaths.add(entry.path);
      assert(entry.safety_class === "SAFE_STATIC_CORE", "MANIFEST_CORE_CLASS");
      assert(entry.role === "EXECUTABLE", "MANIFEST_CORE_ROLE");
      assert(Array.isArray(entry.command_argv), "MANIFEST_COMMAND_ARGV");
      assert(
        entry.command_argv.length === 2 &&
          entry.command_argv[0] === "node" &&
          entry.command_argv[1] === entry.path,
        "MANIFEST_CORE_COMMAND",
      );
      assert(
        entry.command_argv.every(
          (argument) =>
            typeof argument === "string" &&
            !PROHIBITED_COMMAND_PARTS.some(
              (part) => argument.toLowerCase() === part,
            ),
        ),
        "MANIFEST_CORE_COMMAND",
      );
      assert(
        executableSafetyViolations(entry.path).length === 0,
        "MANIFEST_CORE_SOURCE_SAFETY",
      );
    } else if (entry.ci_disposition === "RUN_POLICY") {
      policyPaths.add(entry.path);
      assert(
        entry.safety_class === "SAFE_STATIC_POLICY",
        "MANIFEST_POLICY_CLASS",
      );
      assert(entry.role === "EXECUTABLE", "MANIFEST_POLICY_ROLE");
      assert(
        Array.isArray(entry.command_argv) &&
          entry.command_argv.length === 2 &&
          entry.command_argv[0] === "node" &&
          entry.command_argv[1] === entry.path,
        "MANIFEST_POLICY_COMMAND",
      );
    } else {
      assert(entry.command_argv === null, "MANIFEST_COMMAND_NULLABILITY");
    }

    if (DENIED_CLASSES.has(entry.safety_class)) {
      assert(entry.ci_disposition === "DENY", "MANIFEST_DENIED_DISPOSITION");
      assert(entry.command_argv === null, "MANIFEST_DENIED_COMMAND");
      assert(
        entry.ci_disposition === "DENY" && entry.command_argv === null,
        "MANIFEST_DENIED_CLASS",
      );
    }
    if (["SUPPORT", "FIXTURE", "CONFIG"].includes(entry.role)) {
      assert(entry.command_argv === null, "MANIFEST_NONEXECUTABLE_COMMAND");
    }
  }

  assert(
    compareExactPathSets([...corePaths], [...REQUIRED_CORE]).equal,
    "MANIFEST_REQUIRED_CORE",
  );
  assert(
    compareExactPathSets([...policyPaths], [...REQUIRED_POLICY]).equal,
    "MANIFEST_REQUIRED_POLICY",
  );

  const entriesByPath = new Map(
    manifest.entries.map((entry) => [entry.path, entry]),
  );
  const schema = entriesByPath.get(SCHEMA_PATH);
  const evidence = entriesByPath.get(EVIDENCE_PATH);
  const policy = entriesByPath.get(POLICY_PATH);
  assert(
    schema?.role === "CONFIG" &&
      schema.safety_class === "SAFE_STATIC_SUPPORT" &&
      schema.ci_disposition === "VALIDATE_ONLY" &&
      schema.command_argv === null &&
      schema.reason_code ===
        "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_SCHEMA" &&
      evidence?.role === "CONFIG" &&
      evidence.safety_class === "SAFE_STATIC_SUPPORT" &&
      evidence.ci_disposition === "VALIDATE_ONLY" &&
      evidence.command_argv === null &&
      evidence.reason_code ===
        "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE" &&
      policy?.role === "EXECUTABLE" &&
      policy.safety_class === "SAFE_STATIC_POLICY" &&
      policy.ci_disposition === "RUN_POLICY" &&
      exactArray(policy.command_argv, ["node", POLICY_PATH]) &&
      policy.reason_code ===
        "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_POLICY",
    "MANIFEST_C1_CLASSIFICATIONS",
  );
  assert(
    C1_POLICY_PATHS.every((repositoryPath) => {
      const entry = entriesByPath.get(repositoryPath);
      return (
        entry?.role === "EXECUTABLE" &&
        entry.safety_class === "SAFE_STATIC_POLICY" &&
        entry.ci_disposition === "RUN_POLICY" &&
        exactArray(entry.command_argv, ["node", repositoryPath])
      );
    }),
    "MANIFEST_C1_POLICY_SET",
  );
  const c2Contracts = new Map([
    [
      C2_ANALYZER_PATH,
      [
        "SUPPORT",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_ANALYZER",
      ],
    ],
    [
      C2_ANALYZER_TEST_PATH,
      [
        "EXECUTABLE",
        "SAFE_STATIC_POLICY",
        "RUN_POLICY",
        ["node", C2_ANALYZER_TEST_PATH],
        "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_ANALYZER_POLICY",
      ],
    ],
    [
      C2_SCHEMA_PATH,
      [
        "CONFIG",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER_SCHEMA",
      ],
    ],
    [
      C2_LEDGER_PATH,
      [
        "CONFIG",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER",
      ],
    ],
    [
      C2_LEDGER_TEST_PATH,
      [
        "EXECUTABLE",
        "SAFE_STATIC_POLICY",
        "RUN_POLICY",
        ["node", C2_LEDGER_TEST_PATH],
        "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER_POLICY",
      ],
    ],
  ]);
  for (const [repositoryPath, contract] of c2Contracts) {
    const entry = entriesByPath.get(repositoryPath);
    assert(
      entry?.role === contract[0] &&
        entry.safety_class === contract[1] &&
        entry.ci_disposition === contract[2] &&
        JSON.stringify(entry.command_argv) === JSON.stringify(contract[3]) &&
        entry.reason_code === contract[4],
      "MANIFEST_C2_1_CLASSIFICATIONS",
    );
  }
  const c2_2Contracts = new Map([
    [
      C2_2_ANALYZER_PATH,
      [
        "SUPPORT",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_ANALYZER",
      ],
    ],
    [
      C2_2_ANALYZER_TEST_PATH,
      [
        "EXECUTABLE",
        "SAFE_STATIC_POLICY",
        "RUN_POLICY",
        ["node", C2_2_ANALYZER_TEST_PATH],
        "AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_ANALYZER_POLICY",
      ],
    ],
    [
      C2_2_SCHEMA_PATH,
      [
        "CONFIG",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER_SCHEMA",
      ],
    ],
    [
      C2_2_LEDGER_PATH,
      [
        "CONFIG",
        "SAFE_STATIC_SUPPORT",
        "VALIDATE_ONLY",
        null,
        "AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER",
      ],
    ],
    [
      C2_2_LEDGER_TEST_PATH,
      [
        "EXECUTABLE",
        "SAFE_STATIC_POLICY",
        "RUN_POLICY",
        ["node", C2_2_LEDGER_TEST_PATH],
        "AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER_POLICY",
      ],
    ],
  ]);
  for (const [repositoryPath, contract] of c2_2Contracts) {
    const entry = entriesByPath.get(repositoryPath);
    assert(
      entry?.role === contract[0] &&
        entry.safety_class === contract[1] &&
        entry.ci_disposition === contract[2] &&
        JSON.stringify(entry.command_argv) === JSON.stringify(contract[3]) &&
        entry.reason_code === contract[4],
      "MANIFEST_C2_2_CLASSIFICATIONS",
    );
  }
  const core = corePaths.size;
  const policyCount = policyPaths.size;
  const validateOnly = manifest.entries.filter(
    (entry) => entry.ci_disposition === "VALIDATE_ONLY",
  ).length;
  const denied = manifest.entries.filter(
    (entry) => entry.ci_disposition === "DENY",
  ).length;
  assert(
    core === 5 && policyCount === 11 && validateOnly === 26 && denied === 86,
    "MANIFEST_CLASSIFICATION_COUNTS",
  );

  return {
    entries: manifest.entries.length,
    core,
    policy: policyCount,
    denied,
    validateOnly,
  };
}

try {
  const result = validateManifest();
  console.log(
    `PASS_STATIC_TEST_SAFETY_MANIFEST entries=${result.entries} core=${result.core} policy=${result.policy} validate_only=${result.validateOnly} denied=${result.denied} authenticated_live_route_partial_evidence_classifications=3 c2_1_semantic_classifications=5 c2_2_candidate_classifications=5 failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (
    caught instanceof GovernanceError &&
    caught.stage === "MANIFEST_C2_2_EXPECTATIONS_MISSING"
  ) {
    console.log(
      "EXPECTED_FAIL_STATIC_TEST_SAFETY_MANIFEST_C2_2 missing_classifications=5 total_contract=0 tree_digest=0 failures=1 internal_failures=0",
    );
  } else if (
    caught instanceof GovernanceError &&
    caught.stage === "MANIFEST_C2_1_EXPECTATIONS_MISSING"
  ) {
    console.log(
      "EXPECTED_FAIL_STATIC_TEST_SAFETY_MANIFEST_C2_1 missing_classifications=5 total_contract=0 tree_digest=0 failures=1 internal_failures=0",
    );
  } else if (caught instanceof GovernanceError) {
    categoricalFailure(caught.stage);
    console.log(
      "FAIL_STATIC_TEST_SAFETY_MANIFEST failures=1 internal_failures=0",
    );
  } else {
    console.log("INTERNAL_FAIL_STATIC_TEST_SAFETY_MANIFEST");
    console.log(
      "FAIL_STATIC_TEST_SAFETY_MANIFEST failures=0 internal_failures=1",
    );
  }
  process.exitCode = 1;
}
