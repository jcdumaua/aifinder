import { createHash } from "node:crypto";
import { lstatSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  GovernanceError,
  categoricalFailure,
  compareExactPathSets,
  readStrictJson,
  repositoryRoot,
  stableSortedPaths,
  strictJsonParse,
} from "./static-governance-utils.mjs";

const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const RUNTIME_PLAN_PATH =
  "testing/public-production-runtime-planning-manifest.json";
const SOURCE_COMMIT = "7c369726fa5a4092b056d91f14ca6a61effef151";
const MATRIX_IDENTITY = {
  path: MATRIX_PATH,
  sha256: "048d0e59a3a9517a5b4d1e8f296d96fcd569a013fae1467150f2848392fc84f7",
  git_blob: "9273a1304f2007a56f31747ff6e4e74057843a32",
  bytes: 37735,
  lines: 985,
  mode: "0644",
  route_inventory_digest:
    "2ab892934273cef903d720dfcb7cdd351711eb2969a02e36f5b2a714e496b726",
  entry_count: 69,
  launch_blocking_count: 62,
};
const TOP_LEVEL_KEYS = [
  "registry_version",
  "source_commit",
  "source_matrix",
  "overall_decision",
  "current_authority",
  "execution_authorized",
  "blocked_capabilities",
  "planning_sequence_semantics",
  "planning_artifacts",
  "workstreams",
];
const PLANNING_ARTIFACT_KEYS = [
  "workstream_id",
  "path",
  "state",
  "execution_authorized",
];
const SOURCE_MATRIX_KEYS = [
  "path",
  "sha256",
  "git_blob",
  "bytes",
  "lines",
  "mode",
  "route_inventory_digest",
  "entry_count",
  "launch_blocking_count",
];
const WORKSTREAM_KEYS = [
  "id",
  "gap_code",
  "entry_count",
  "authority_class",
  "state",
  "execution_authorized",
  "planning_priority",
  "source_paths",
  "prerequisites",
  "prohibited_operations",
  "next_gate",
];
const BLOCKED_CAPABILITIES = [
  "AUTHENTICATED_RUNTIME",
  "DATABASE",
  "DEPLOYMENT_CONTROL",
  "DIRECT_VERCEL_WRITE",
  "MIGRATIONS_OR_GENERATED_TYPES",
  "OPERATIONAL_REACTIVATION",
  "PUBLIC_LAUNCH",
  "PUBLIC_OR_DEPLOYED_BROWSER",
  "PUBLIC_OR_DEPLOYED_HTTP",
  "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
  "SQL",
  "SUPABASE",
];
const COMMON_PREREQUISITES = [
  "EXACT_PATH_SCOPE_REQUIRED",
  "EXTERNAL_REVIEW_REQUIRED",
  "ROLLBACK_AND_STOP_BOUNDARY_REQUIRED",
  "SEPARATE_HUMAN_AUTHORITY_REQUIRED",
];
const WORKSTREAMS = [
  {
    id: "PUBLIC_PRODUCTION_RUNTIME",
    gap_code: "RUNTIME_EVIDENCE_INTEGRATED",
    entry_count: 7,
    authority_class: "PUBLIC_PRODUCTION_RUNTIME",
    state: "EVIDENCE_COMPLETE_PENDING_NEXT_WORKSTREAM",
    planning_priority: 1,
    next_gate: "SEPARATE_PLANNING_REVIEW_PUBLIC_BROWSER_OR_LIVE_RUNTIME",
  },
  {
    id: "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
    gap_code: "BROWSER_OR_LIVE_EVIDENCE_REQUIRED",
    entry_count: 13,
    authority_class: "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
    state: "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    planning_priority: 2,
    next_gate: "SEPARATE_PLANNING_REVIEW_PUBLIC_BROWSER_OR_LIVE_RUNTIME",
  },
  {
    id: "PUBLIC_LIVE_ROUTE_RUNTIME",
    gap_code: "LIVE_ROUTE_EVIDENCE_REQUIRED",
    entry_count: 3,
    authority_class: "PUBLIC_LIVE_ROUTE_RUNTIME",
    state: "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    planning_priority: 3,
    next_gate: "SEPARATE_PLANNING_REVIEW_PUBLIC_LIVE_ROUTE_RUNTIME",
  },
  {
    id: "AUTHENTICATED_BROWSER_RUNTIME",
    gap_code: "AUTHENTICATED_BROWSER_EVIDENCE_REQUIRED",
    entry_count: 18,
    authority_class: "AUTHENTICATED_BROWSER_RUNTIME",
    state: "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    planning_priority: 4,
    next_gate: "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_BROWSER_RUNTIME",
  },
  {
    id: "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
    gap_code: "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED",
    entry_count: 28,
    authority_class: "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
    state: "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    planning_priority: 5,
    next_gate: "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME",
  },
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

function exactKeys(value, expected) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    exactArray(Object.keys(value), expected)
  );
}

function readRegistry() {
  if (process.argv.length > 3) fail("BLOCKER_REGISTRY_SEQUENCE");
  const supplied = process.argv[2];
  if (supplied === undefined) {
    try {
      return readStrictJson(REGISTRY_PATH);
    } catch (caught) {
      if (
        caught instanceof GovernanceError &&
        caught.stage === "REGULAR_FILE_ABSENT"
      ) {
        fail("PUBLIC_LAUNCH_BLOCKER_REGISTRY_ABSENT");
      }
      throw caught;
    }
  }

  const absolute = path.resolve(supplied);
  let info;
  try {
    info = lstatSync(absolute);
  } catch {
    fail("PUBLIC_LAUNCH_BLOCKER_REGISTRY_ABSENT");
  }
  assert(info.isFile() && !info.isSymbolicLink(), "BLOCKER_REGISTRY_SEQUENCE");
  assert(
    [0o600, 0o644].includes(info.mode & 0o777),
    "BLOCKER_REGISTRY_SEQUENCE",
  );
  return strictJsonParse(readFileSync(absolute, "utf8"));
}

function actualMatrixIdentity() {
  const absolute = path.resolve(repositoryRoot, MATRIX_PATH);
  const bytes = readFileSync(absolute);
  const source = bytes.toString("utf8");
  const mode = (statSync(absolute).mode & 0o777).toString(8).padStart(4, "0");
  const gitHeader = Buffer.from(`blob ${bytes.byteLength}\0`, "utf8");
  return {
    path: MATRIX_PATH,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    git_blob: createHash("sha1").update(gitHeader).update(bytes).digest("hex"),
    bytes: bytes.byteLength,
    lines: (source.match(/\n/g) ?? []).length,
    mode,
  };
}

function matrixModel() {
  const identity = actualMatrixIdentity();
  for (const key of [
    "path",
    "sha256",
    "git_blob",
    "bytes",
    "lines",
    "mode",
  ]) {
    assert(
      identity[key] === MATRIX_IDENTITY[key],
      "BLOCKER_REGISTRY_MATRIX_IDENTITY",
    );
  }

  const matrix = readStrictJson(MATRIX_PATH);
  assert(
    matrix.route_inventory_digest === MATRIX_IDENTITY.route_inventory_digest,
    "BLOCKER_REGISTRY_MATRIX_IDENTITY",
  );
  assert(
    Array.isArray(matrix.entries) &&
      matrix.entries.length === MATRIX_IDENTITY.entry_count,
    "BLOCKER_REGISTRY_ENTRY_COUNT",
  );
  const launchBlocking = matrix.entries.filter(
    (entry) => entry.launch_blocking === true,
  );
  assert(
    launchBlocking.length === MATRIX_IDENTITY.launch_blocking_count,
    "BLOCKER_REGISTRY_ENTRY_COUNT",
  );
  const completedPaths = matrix.entries
    .filter(
      (entry) =>
        entry.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED" &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null,
    )
    .map((entry) => entry.path);
  assert(
    completedPaths.length === 7,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );

  const paths = matrix.entries.map((entry) => entry.path);
  assert(
    paths.length === new Set(paths).size &&
      exactArray(paths, stableSortedPaths(paths)),
    "BLOCKER_REGISTRY_PATH_PARTITION",
  );

  const expectedGapSet = stableSortedPaths(
    WORKSTREAMS.filter(
      (workstream) => workstream.id !== "PUBLIC_PRODUCTION_RUNTIME",
    ).map((workstream) => workstream.gap_code),
  );
  const actualGapSet = stableSortedPaths([
    ...new Set(launchBlocking.map((entry) => entry.gap_code_or_null)),
  ]);
  assert(exactArray(actualGapSet, expectedGapSet), "BLOCKER_REGISTRY_GAP_SET");

  const pathsByGap = new Map();
  for (const workstream of WORKSTREAMS) {
    const sourcePaths =
      workstream.id === "PUBLIC_PRODUCTION_RUNTIME"
        ? completedPaths
        : matrix.entries
            .filter((entry) => entry.gap_code_or_null === workstream.gap_code)
            .map((entry) => entry.path);
    assert(
      sourcePaths.length === workstream.entry_count,
      "BLOCKER_REGISTRY_GAP_COUNT",
    );
    pathsByGap.set(workstream.gap_code, sourcePaths);
  }
  return { matrix, paths, pathsByGap, completedPaths, launchBlocking };
}

function validateRegistry() {
  const registry = readRegistry();
  const { matrix, paths, pathsByGap, completedPaths, launchBlocking } =
    matrixModel();

  assert(
    exactKeys(registry, TOP_LEVEL_KEYS),
    "BLOCKER_REGISTRY_SEQUENCE",
  );
  assert(registry.registry_version === 1, "BLOCKER_REGISTRY_VERSION");
  assert(
    registry.source_commit === SOURCE_COMMIT,
    "BLOCKER_REGISTRY_SOURCE_COMMIT",
  );
  assert(
    exactKeys(registry.source_matrix, SOURCE_MATRIX_KEYS),
    "BLOCKER_REGISTRY_MATRIX_IDENTITY",
  );
  for (const key of SOURCE_MATRIX_KEYS) {
    assert(
      registry.source_matrix[key] === MATRIX_IDENTITY[key],
      key === "entry_count" || key === "launch_blocking_count"
        ? "BLOCKER_REGISTRY_ENTRY_COUNT"
        : "BLOCKER_REGISTRY_MATRIX_IDENTITY",
    );
  }
  assert(
    registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES",
    "BLOCKER_REGISTRY_DECISION",
  );
  assert(registry.current_authority === "STATIC_ONLY", "BLOCKER_REGISTRY_STATE");
  assert(
    registry.execution_authorized === false,
    "BLOCKER_REGISTRY_EXECUTION_AUTHORITY",
  );
  assert(
    exactArray(registry.blocked_capabilities, BLOCKED_CAPABILITIES),
    "BLOCKER_REGISTRY_BLOCKED_CAPABILITIES",
  );
  assert(
    registry.planning_sequence_semantics ===
      "PLANNING_PRIORITY_ONLY_NOT_EXECUTION_AUTHORITY",
    "BLOCKER_REGISTRY_SEQUENCE",
  );
  assert(
    Array.isArray(registry.planning_artifacts) &&
      registry.planning_artifacts.length === 1 &&
      exactKeys(registry.planning_artifacts[0], PLANNING_ARTIFACT_KEYS),
    "BLOCKER_REGISTRY_SEQUENCE",
  );
  const planningArtifact = registry.planning_artifacts[0];
  const runtimePlan = readStrictJson(RUNTIME_PLAN_PATH);
  assert(
    planningArtifact.workstream_id === "PUBLIC_PRODUCTION_RUNTIME" &&
      planningArtifact.path === RUNTIME_PLAN_PATH &&
      planningArtifact.state ===
        "FINAL_READ_ONLY_RUNTIME_QUALIFICATION_EVIDENCE_INTEGRATED" &&
      planningArtifact.execution_authorized === false &&
      runtimePlan.workstream?.id === planningArtifact.workstream_id &&
      runtimePlan.decision === planningArtifact.state &&
      runtimePlan.execution_authorized === false &&
      runtimePlan.live_evidence_status ===
        "PASSED_FINAL_READ_ONLY_RUNTIME_QUALIFICATION",
    "BLOCKER_REGISTRY_EXECUTION_AUTHORITY",
  );
  assert(
    Array.isArray(registry.workstreams) &&
      registry.workstreams.length === WORKSTREAMS.length,
    "BLOCKER_REGISTRY_GAP_SET",
  );

  const registryPaths = [];
  for (const [index, expected] of WORKSTREAMS.entries()) {
    const actual = registry.workstreams[index];
    assert(
      exactKeys(actual, WORKSTREAM_KEYS),
      "BLOCKER_REGISTRY_SEQUENCE",
    );
    assert(
      actual.planning_priority === expected.planning_priority,
      "BLOCKER_REGISTRY_WORKSTREAM_ORDER",
    );
    assert(
      actual.id === expected.id && actual.gap_code === expected.gap_code,
      "BLOCKER_REGISTRY_GAP_SET",
    );
    assert(
      actual.entry_count === expected.entry_count,
      "BLOCKER_REGISTRY_GAP_COUNT",
    );
    assert(
      actual.authority_class === expected.authority_class,
      "BLOCKER_REGISTRY_AUTHORITY_CLASS",
    );
    assert(
      actual.state === expected.state,
      "BLOCKER_REGISTRY_STATE",
    );
    assert(
      actual.execution_authorized === false,
      "BLOCKER_REGISTRY_EXECUTION_AUTHORITY",
    );
    const expectedPaths = pathsByGap.get(expected.gap_code);
    assert(
      Array.isArray(actual.source_paths) &&
        actual.source_paths.length === expected.entry_count &&
        actual.source_paths.length === new Set(actual.source_paths).size &&
        exactArray(actual.source_paths, stableSortedPaths(actual.source_paths)),
      "BLOCKER_REGISTRY_PATH_PARTITION",
    );
    for (const sourcePath of actual.source_paths) {
      const entry = matrix.entries.find((candidate) => candidate.path === sourcePath);
      assert(
        expected.id === "PUBLIC_PRODUCTION_RUNTIME"
          ? entry?.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED" &&
              entry.launch_blocking === false &&
              entry.gap_code_or_null === null
          : entry?.launch_blocking === true &&
              entry.gap_code_or_null === actual.gap_code,
        "BLOCKER_REGISTRY_PATH_GAP_MISMATCH",
      );
    }
    assert(
      compareExactPathSets(actual.source_paths, expectedPaths).equal,
      "BLOCKER_REGISTRY_PATH_PARTITION",
    );
    registryPaths.push(...actual.source_paths);
    assert(
      exactArray(actual.prerequisites, COMMON_PREREQUISITES),
      "BLOCKER_REGISTRY_SEQUENCE",
    );
    assert(
      exactArray(actual.prohibited_operations, BLOCKED_CAPABILITIES),
      "BLOCKER_REGISTRY_BLOCKED_CAPABILITIES",
    );
    assert(
      actual.next_gate === expected.next_gate &&
        (/^SEPARATE_(?:PLANNING|RUNTIME_AUTHORITY)_REVIEW_/.test(
          actual.next_gate,
        ) ||
          actual.next_gate ===
            "SEPARATE_ONE_USE_PUBLIC_PRODUCTION_RUNTIME_RETEST_REVIEW") &&
        !actual.next_gate
          .split("_")
          .some((part) =>
            [
              "APPROVE",
              "AUTHORIZE",
              "RUN",
              "EXECUTE",
              "DEPLOY",
              "PUBLISH",
              "REACTIVATE",
              "LAUNCH",
              "READY",
              "PASSED",
            ].includes(part),
          ),
      "BLOCKER_REGISTRY_SEQUENCE",
    );
  }

  assert(
    registryPaths.length === paths.length &&
      registryPaths.length === new Set(registryPaths).size &&
      compareExactPathSets(registryPaths, paths).equal,
    "BLOCKER_REGISTRY_PATH_PARTITION",
  );
  assert(
    compareExactPathSets(
      registry.workstreams[0].source_paths,
      completedPaths,
    ).equal,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );

  return {
    entries: paths.length,
    workstreams: registry.workstreams.length,
    completed: completedPaths.length,
    blocked: launchBlocking.length,
  };
}

try {
  const result = validateRegistry();
  console.log(
    `PASS_PUBLIC_LAUNCH_BLOCKER_REGISTRY entries=${result.entries} workstreams=${result.workstreams} completed=${result.completed} blocked=${result.blocked} decision=NO_GO failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (caught instanceof GovernanceError) {
    categoricalFailure(caught.stage);
    console.log(
      "FAIL_PUBLIC_LAUNCH_BLOCKER_REGISTRY failures=1 internal_failures=0",
    );
  } else {
    console.log("INTERNAL_FAIL_PUBLIC_LAUNCH_BLOCKER_REGISTRY");
    console.log(
      "FAIL_PUBLIC_LAUNCH_BLOCKER_REGISTRY failures=0 internal_failures=1",
    );
  }
  process.exitCode = 1;
}
