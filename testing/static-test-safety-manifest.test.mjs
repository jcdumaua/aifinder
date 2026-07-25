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
  "testing/public-launch-resilience-static-assertions.mjs",
  "testing/public-persistence.test.mjs",
  "testing/production-perimeter-static-assertions.mjs",
]);
const REQUIRED_POLICY = new Set([
  "testing/static-test-safety-manifest.test.mjs",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/static-readiness-workflow-static-assertions.mjs",
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

  assert(manifest.manifest_version === 1, "MANIFEST_VERSION");
  assert(manifest.repository_baseline === BASELINE, "MANIFEST_BASELINE");
  assert(Array.isArray(manifest.entries), "MANIFEST_ENTRIES");
  assert(
    typeof manifest.testing_tree_digest === "string" &&
      /^[0-9a-f]{64}$/.test(manifest.testing_tree_digest),
    "MANIFEST_TREE_DIGEST",
  );

  const inventory = listRegularFiles("testing");
  const entryPaths = manifest.entries.map((entry) => entry.path);
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
    }
    if (["SUPPORT", "FIXTURE", "CONFIG"].includes(entry.role)) {
      assert(entry.command_argv === null, "MANIFEST_NONEXECUTABLE_COMMAND");
    }
  }

  assert(
    [...REQUIRED_CORE].every((entry) => corePaths.has(entry)),
    "MANIFEST_REQUIRED_CORE",
  );
  assert(
    [...REQUIRED_POLICY].every((entry) => policyPaths.has(entry)),
    "MANIFEST_REQUIRED_POLICY",
  );

  return {
    entries: manifest.entries.length,
    core: corePaths.size,
    policy: policyPaths.size,
    denied: manifest.entries.filter((entry) => entry.ci_disposition === "DENY")
      .length,
    validateOnly: manifest.entries.filter(
      (entry) => entry.ci_disposition === "VALIDATE_ONLY",
    ).length,
  };
}

try {
  const result = validateManifest();
  console.log(
    `PASS_STATIC_TEST_SAFETY_MANIFEST entries=${result.entries} core=${result.core} policy=${result.policy} validate_only=${result.validateOnly} denied=${result.denied} failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (caught instanceof GovernanceError) {
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
