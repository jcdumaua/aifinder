import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SCHEMA_PATH =
  "testing/authenticated-live-route-partial-evidence.schema.json";
const EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const POLICY_PATH =
  "testing/authenticated-live-route-partial-evidence.test.mjs";
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
const DENIED_CLASSES = new Set([
  "BROWSER_OR_PLAYWRIGHT",
  "LIVE_ROUTE_OR_SERVER",
  "DATABASE_OR_SUPABASE",
  "NETWORK_OR_EXTERNAL",
  "OPERATIONAL_MUTATION",
  "UNPROVEN_DENY",
]);

function assert(condition, stage) {
  if (!condition) throw new Error(stage);
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

function validateManifest() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  assert(manifest.manifest_version === 1, "MANIFEST_VERSION");
  assert(
    manifest.repository_baseline ===
      "01a5c779f3f47f9619a2cd4a913622e010145afc",
    "MANIFEST_BASELINE",
  );
  assert(
    typeof manifest.testing_tree_digest === "string" &&
      /^[0-9a-f]{64}$/.test(manifest.testing_tree_digest),
    "MANIFEST_DIGEST",
  );
  assert(
    manifest.testing_tree_digest ===
      "7c446a347640f7ef3e7008fdcd36ea83d21dc4a88fabcebd9b735d8267a59d36" &&
      manifest.testing_tree_digest_state ===
        "BASELINE_SNAPSHOT_PRESERVED_NOT_RECOMPUTED_OUTSIDE_EXACT_READ_SCOPE" &&
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
    Array.isArray(manifest.entries) &&
      manifest.entries.length === 118 &&
      new Set(manifest.entries.map((entry) => entry.path)).size === 118,
    "MANIFEST_ENTRY_SET",
  );
  const entryPaths = manifest.entries.map((entry) => entry.path);
  assert(
    exactArray(entryPaths, [...entryPaths].sort()),
    "MANIFEST_PATH_ORDER",
  );

  for (const entry of manifest.entries) {
    assert(
      entry &&
        typeof entry.path === "string" &&
        entry.path.startsWith("testing/") &&
        ROLES.has(entry.role) &&
        CLASSES.has(entry.safety_class) &&
        DISPOSITIONS.has(entry.ci_disposition) &&
        typeof entry.reason_code === "string" &&
        /^[A-Z0-9_]+$/.test(entry.reason_code),
      "MANIFEST_ENTRY_SHAPE",
    );
    if (["RUN_CORE", "RUN_POLICY"].includes(entry.ci_disposition)) {
      assert(
        entry.role === "EXECUTABLE" &&
          exactArray(entry.command_argv, ["node", entry.path]),
        "MANIFEST_EXECUTABLE_COMMAND",
      );
    } else {
      assert(entry.command_argv === null, "MANIFEST_NONEXECUTABLE_COMMAND");
    }
    if (DENIED_CLASSES.has(entry.safety_class)) {
      assert(
        entry.ci_disposition === "DENY" && entry.command_argv === null,
        "MANIFEST_DENIED_CLASS",
      );
    }
  }

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

  const core = manifest.entries.filter(
    (entry) => entry.ci_disposition === "RUN_CORE",
  ).length;
  const policyCount = manifest.entries.filter(
    (entry) => entry.ci_disposition === "RUN_POLICY",
  ).length;
  const validateOnly = manifest.entries.filter(
    (entry) => entry.ci_disposition === "VALIDATE_ONLY",
  ).length;
  const denied = manifest.entries.filter(
    (entry) => entry.ci_disposition === "DENY",
  ).length;
  assert(
    core === 5 && policyCount === 7 && validateOnly === 20 && denied === 86,
    "MANIFEST_CLASSIFICATION_COUNTS",
  );
  return { entries: manifest.entries.length, core, policyCount, validateOnly, denied };
}

try {
  const result = validateManifest();
  console.log(
    `PASS_STATIC_TEST_SAFETY_MANIFEST entries=${result.entries} core=${result.core} policy=${result.policyCount} validate_only=${result.validateOnly} denied=${result.denied} authenticated_live_route_partial_evidence_classifications=3 failures=0 internal_failures=0`,
  );
} catch (caught) {
  const stage =
    caught instanceof Error && /^[A-Z0-9_]+$/.test(caught.message)
      ? caught.message
      : "INTERNAL_MANIFEST_FAILURE";
  console.log(`EXPECTED_FAIL_${stage}`);
  console.log(
    "FAIL_STATIC_TEST_SAFETY_MANIFEST failures=1 internal_failures=0",
  );
  process.exitCode = 1;
}
