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
const PUBLIC_LIVE_ROUTE_STATIC_EVIDENCE_PATH =
  "testing/public-live-route-security-static-assertions.mjs";
const PUBLIC_LIVE_ROUTE_EVIDENCE_PATH =
  "testing/public-live-route-runtime-evidence.json";
const PUBLIC_LIVE_ROUTE_PATHS = [
  "app/api/homepage-control/published/route.ts",
  "app/api/submit-tool/route.ts",
  "app/api/upload-logo/route.ts",
];
const RUNTIME_PLAN_PATH =
  "testing/public-production-runtime-planning-manifest.json";
const BROWSER_LIVE_PLAN_PATH =
  "testing/public-browser-live-runtime-planning-manifest.json";
const PUBLIC_LIVE_ROUTE_PLAN_PATH =
  "testing/public-live-route-runtime-planning-manifest.json";
const AUTHENTICATED_BROWSER_PLAN_PATH =
  "testing/authenticated-browser-planning-manifest.json";
const AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH =
  "testing/authenticated-browser-security-static-assertions.mjs";
const AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH =
  "testing/authenticated-browser-static-evidence.json";
const AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH =
  "testing/authenticated-browser-runtime-evidence.json";
const AUTHENTICATED_AUDIT_ROUTE_PATH =
  "app/api/admin/audit-logs/route.ts";
const SOURCE_COMMIT = "2570765ca0e769888286e42456d2f27d831f46df";
const MATRIX_IDENTITY = {
  path: MATRIX_PATH,
  sha256: "3c7bffc1b8e833d8bf2772a329fc0a016ec3c14b63424b54d442b718d6c0d978",
  git_blob: "3ae5a67d8c6231720e246ca0f0f66f312da7314a",
  bytes: 42294,
  lines: 1085,
  mode: "0644",
  route_inventory_digest:
    "fa4f5aec336d66511f3811864961894a4132611a79c769bfb0635feca39139ed",
  entry_count: 69,
  launch_blocking_count: 28,
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
const AUTHENTICATED_LIVE_ROUTE_WORKSTREAM_KEYS = [
  ...WORKSTREAM_KEYS,
  "partial_static_count",
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
const AUTHENTICATED_BROWSER_PATHS = [
  "app/admin-login/layout.tsx",
  "app/admin-login/page.tsx",
  "app/admin/analytics/page.tsx",
  "app/admin/discovered-tools/page.tsx",
  "app/admin/discovery/page.tsx",
  "app/admin/discovery/tools/[id]/page.tsx",
  "app/admin/discovery/tools/page.tsx",
  "app/admin/homepage-control/[id]/edit/page.tsx",
  "app/admin/homepage-control/[id]/page.tsx",
  "app/admin/homepage-control/[id]/preview/page.tsx",
  "app/admin/homepage-control/page.tsx",
  "app/admin/layout.tsx",
  "app/admin/moderation/page.tsx",
  "app/admin/notifications/page.tsx",
  "app/admin/page.tsx",
  "app/admin/security/page.tsx",
  "app/admin/settings/page.tsx",
  "app/admin/tools/page.tsx",
];
const AUTHENTICATED_LIVE_ROUTE_PATHS = [
  "app/api/admin/audit-logs/route.ts",
  "app/api/admin/csrf/route.ts",
  "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/route.ts",
  "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
  "app/api/admin/discovery/discovered-tools/route.ts",
  "app/api/admin/discovery/intake/route.ts",
  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
  "app/api/admin/discovery/runs/manual/claim/route.ts",
  "app/api/admin/discovery/runs/manual/route.ts",
  "app/api/admin/discovery/runs/route.ts",
  "app/api/admin/discovery/sources/[id]/route.ts",
  "app/api/admin/discovery/sources/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/route.ts",
  "app/api/admin/homepage-control/drafts/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
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
    gap_code: "BROWSER_LIVE_EVIDENCE_INTEGRATED",
    entry_count: 13,
    authority_class: "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
    state: "EVIDENCE_COMPLETE_PENDING_NEXT_WORKSTREAM",
    planning_priority: 2,
    next_gate: "SEPARATE_PLANNING_REVIEW_PUBLIC_LIVE_ROUTE_RUNTIME",
  },
  {
    id: "PUBLIC_LIVE_ROUTE_RUNTIME",
    gap_code: "LIVE_ROUTE_EVIDENCE_INTEGRATED",
    entry_count: 3,
    authority_class: "PUBLIC_LIVE_ROUTE_RUNTIME",
    state: "EVIDENCE_COMPLETE_PENDING_NEXT_WORKSTREAM",
    planning_priority: 3,
    next_gate: "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_BROWSER_RUNTIME",
  },
  {
    id: "AUTHENTICATED_BROWSER_RUNTIME",
    gap_code: "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
    entry_count: 18,
    authority_class: "AUTHENTICATED_BROWSER_RUNTIME",
    state: "EVIDENCE_COMPLETE_PENDING_NEXT_WORKSTREAM",
    planning_priority: 4,
    next_gate: "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME",
  },
  {
    id: "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
    gap_code: "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED",
    entry_count: 28,
    authority_class: "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
    state: "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    planning_priority: 5,
    next_gate: "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME",
    partial_static_count: 1,
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
  const completedBrowserLivePaths = matrix.entries
    .filter(
      (entry) =>
        entry.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED" &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null,
    )
    .map((entry) => entry.path);
  assert(
    completedBrowserLivePaths.length === 13,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );
  const completedLiveRoutePaths = matrix.entries
    .filter(
      (entry) =>
        entry.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED" &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null,
    )
    .map((entry) => entry.path);
  assert(
    completedLiveRoutePaths.length === 3 &&
      compareExactPathSets(
        completedLiveRoutePaths,
        PUBLIC_LIVE_ROUTE_PATHS,
      ).equal,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );
  const completedLiveRouteEntries = matrix.entries.filter(
    (entry) =>
      completedLiveRoutePaths.includes(entry.path),
  );
  assert(
    completedLiveRouteEntries.every(
        (entry) =>
          exactArray(entry.static_evidence_paths, [
            PUBLIC_LIVE_ROUTE_STATIC_EVIDENCE_PATH,
            PUBLIC_LIVE_ROUTE_EVIDENCE_PATH,
          ]) && entry.future_evidence_paths.length === 0,
      ),
    "BLOCKER_REGISTRY_PUBLIC_LIVE_ROUTE_EVIDENCE",
  );
  const authenticatedBrowserEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_BROWSER_PATHS.includes(entry.path),
  );
  const completedAuthenticatedBrowserPaths = authenticatedBrowserEntries
    .filter(
      (entry) =>
        entry.coverage_state ===
          "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null,
    )
    .map((entry) => entry.path);
  assert(
    authenticatedBrowserEntries.length === 18 &&
      authenticatedBrowserEntries.every(
        (entry) =>
          entry.coverage_state ===
            "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null &&
          exactArray(entry.static_evidence_paths, [
            AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
            AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH,
            AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
          ]),
      ),
    "BLOCKER_REGISTRY_AUTHENTICATED_BROWSER_EVIDENCE",
  );
  const authenticatedLiveRouteEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_LIVE_ROUTE_PATHS.includes(entry.path),
  );
  const authenticatedAuditRoute = authenticatedLiveRouteEntries.find(
    (entry) => entry.path === AUTHENTICATED_AUDIT_ROUTE_PATH,
  );
  assert(
    authenticatedAuditRoute?.coverage_state === "PARTIAL_STATIC" &&
      authenticatedAuditRoute.launch_blocking === true &&
      authenticatedAuditRoute.gap_code_or_null ===
        "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED" &&
      exactArray(authenticatedAuditRoute.static_evidence_paths, [
        AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
        AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH,
      ]) &&
      authenticatedLiveRouteEntries.filter(
        (entry) => entry.path !== AUTHENTICATED_AUDIT_ROUTE_PATH,
      ).length === 27 &&
      authenticatedLiveRouteEntries
        .filter((entry) => entry.path !== AUTHENTICATED_AUDIT_ROUTE_PATH)
        .every(
          (entry) =>
            entry.coverage_state === "NO_STATIC_EVIDENCE" &&
            entry.static_evidence_paths.length === 0,
        ),
    "BLOCKER_REGISTRY_AUTHENTICATED_LIVE_ROUTE_EVIDENCE",
  );

  const paths = matrix.entries.map((entry) => entry.path);
  assert(
    paths.length === new Set(paths).size &&
      exactArray(paths, stableSortedPaths(paths)),
    "BLOCKER_REGISTRY_PATH_PARTITION",
  );

  const expectedGapSet = stableSortedPaths(
    WORKSTREAMS.filter(
      (workstream) =>
        ![
          "PUBLIC_PRODUCTION_RUNTIME",
          "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
          "PUBLIC_LIVE_ROUTE_RUNTIME",
          "AUTHENTICATED_BROWSER_RUNTIME",
        ].includes(workstream.id),
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
        : workstream.id === "PUBLIC_BROWSER_OR_LIVE_RUNTIME"
          ? completedBrowserLivePaths
          : workstream.id === "PUBLIC_LIVE_ROUTE_RUNTIME"
            ? completedLiveRoutePaths
            : workstream.id === "AUTHENTICATED_BROWSER_RUNTIME"
              ? completedAuthenticatedBrowserPaths
              : matrix.entries
                  .filter(
                    (entry) => entry.gap_code_or_null === workstream.gap_code,
                  )
                  .map((entry) => entry.path);
    assert(
      sourcePaths.length === workstream.entry_count,
      "BLOCKER_REGISTRY_GAP_COUNT",
    );
    pathsByGap.set(workstream.gap_code, sourcePaths);
  }
  return {
    matrix,
    paths,
    pathsByGap,
    completedPaths,
    completedBrowserLivePaths,
    completedLiveRoutePaths,
    completedAuthenticatedBrowserPaths,
    launchBlocking,
  };
}

function validateRegistry() {
  const registry = readRegistry();
  const {
    matrix,
    paths,
    pathsByGap,
    completedPaths,
    completedBrowserLivePaths,
    completedLiveRoutePaths,
    completedAuthenticatedBrowserPaths,
    launchBlocking,
  } = matrixModel();

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
      registry.planning_artifacts.length === 4 &&
      registry.planning_artifacts.every((entry) =>
        exactKeys(entry, PLANNING_ARTIFACT_KEYS),
      ),
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
  const publicLiveRoutePlanningArtifact = registry.planning_artifacts[2];
  const publicLiveRoutePlan = readStrictJson(PUBLIC_LIVE_ROUTE_PLAN_PATH);
  assert(
    publicLiveRoutePlanningArtifact.workstream_id ===
      "PUBLIC_LIVE_ROUTE_RUNTIME" &&
      publicLiveRoutePlanningArtifact.path === PUBLIC_LIVE_ROUTE_PLAN_PATH &&
      publicLiveRoutePlanningArtifact.state ===
        "FINAL_PUBLIC_LIVE_ROUTE_RUNTIME_EVIDENCE_INTEGRATED" &&
      publicLiveRoutePlanningArtifact.execution_authorized === false &&
      publicLiveRoutePlan.workstream?.id ===
        publicLiveRoutePlanningArtifact.workstream_id &&
      publicLiveRoutePlan.decision === publicLiveRoutePlanningArtifact.state &&
      publicLiveRoutePlan.execution_authorized === false &&
      publicLiveRoutePlan.live_evidence_status ===
        "PASSED_EXACT_3_PUBLIC_LIVE_ROUTE_RUNTIME_QUALIFICATION" &&
      publicLiveRoutePlan.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_BROWSER_RUNTIME",
    "BLOCKER_REGISTRY_EXECUTION_AUTHORITY",
  );
  const browserLivePlanningArtifact = registry.planning_artifacts[1];
  const browserLivePlan = readStrictJson(BROWSER_LIVE_PLAN_PATH);
  assert(
    browserLivePlanningArtifact.workstream_id ===
      "PUBLIC_BROWSER_OR_LIVE_RUNTIME" &&
      browserLivePlanningArtifact.path === BROWSER_LIVE_PLAN_PATH &&
      browserLivePlanningArtifact.state ===
        "FINAL_PUBLIC_BROWSER_OR_LIVE_RUNTIME_EVIDENCE_INTEGRATED" &&
      browserLivePlanningArtifact.execution_authorized === false &&
      browserLivePlan.workstream?.id ===
        browserLivePlanningArtifact.workstream_id &&
      browserLivePlan.decision === browserLivePlanningArtifact.state &&
      browserLivePlan.execution_authorized === false &&
      browserLivePlan.live_evidence_status ===
        "PASSED_EXACT_13_SURFACE_PUBLIC_BROWSER_OR_LIVE_RUNTIME_ASSURANCE",
    "BLOCKER_REGISTRY_EXECUTION_AUTHORITY",
  );
  const authenticatedBrowserPlanningArtifact =
    registry.planning_artifacts[3];
  const authenticatedBrowserPlan = readStrictJson(
    AUTHENTICATED_BROWSER_PLAN_PATH,
  );
  assert(
    authenticatedBrowserPlanningArtifact.workstream_id ===
      "AUTHENTICATED_BROWSER_RUNTIME" &&
      authenticatedBrowserPlanningArtifact.path ===
        AUTHENTICATED_BROWSER_PLAN_PATH &&
      authenticatedBrowserPlanningArtifact.state ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_INTEGRATED" &&
      authenticatedBrowserPlanningArtifact.execution_authorized === false &&
      authenticatedBrowserPlan.workstream?.id ===
        authenticatedBrowserPlanningArtifact.workstream_id &&
      authenticatedBrowserPlan.decision ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_INTEGRATED" &&
      authenticatedBrowserPlan.current_authority ===
        "STATIC_ONLY" &&
      authenticatedBrowserPlan.execution_authorized === false &&
      authenticatedBrowserPlan.authenticated_production_runtime_authorized ===
        false &&
      authenticatedBrowserPlan.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME",
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
      exactKeys(
        actual,
        expected.id === "AUTHENTICATED_LIVE_ROUTE_RUNTIME"
          ? AUTHENTICATED_LIVE_ROUTE_WORKSTREAM_KEYS
          : WORKSTREAM_KEYS,
      ),
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
    if (expected.id === "AUTHENTICATED_LIVE_ROUTE_RUNTIME") {
      assert(
        actual.partial_static_count === expected.partial_static_count,
        "BLOCKER_REGISTRY_AUTHENTICATED_LIVE_ROUTE_EVIDENCE",
      );
    }
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
          : expected.id === "PUBLIC_BROWSER_OR_LIVE_RUNTIME"
            ? entry?.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED" &&
                entry.launch_blocking === false &&
                entry.gap_code_or_null === null
            : expected.id === "PUBLIC_LIVE_ROUTE_RUNTIME"
              ? entry?.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED" &&
                  entry.launch_blocking === false &&
                  entry.gap_code_or_null === null &&
                  exactArray(entry.static_evidence_paths, [
                    PUBLIC_LIVE_ROUTE_STATIC_EVIDENCE_PATH,
                    PUBLIC_LIVE_ROUTE_EVIDENCE_PATH,
                  ]) &&
                  entry.future_evidence_paths.length === 0
              : expected.id === "AUTHENTICATED_BROWSER_RUNTIME"
                ? entry?.coverage_state ===
                    "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
                  entry.launch_blocking === false &&
                  entry.gap_code_or_null === null &&
                  exactArray(entry.static_evidence_paths, [
                    AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
                    AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH,
                    AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
                  ])
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
        (/^SEPARATE_(?:PLANNING|RUNTIME|RUNTIME_AUTHORITY)_REVIEW_/.test(
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
  assert(
    compareExactPathSets(
      registry.workstreams[3].source_paths,
      completedAuthenticatedBrowserPaths,
    ).equal,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );
  assert(
    compareExactPathSets(
      registry.workstreams[1].source_paths,
      completedBrowserLivePaths,
    ).equal,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );
  assert(
    compareExactPathSets(
      registry.workstreams[2].source_paths,
      completedLiveRoutePaths,
    ).equal,
    "BLOCKER_REGISTRY_COMPLETED_PATHS",
  );
  assert(
    exactArray(
      registry.workstreams[3].source_paths,
      AUTHENTICATED_BROWSER_PATHS,
    ) &&
      exactArray(
        registry.workstreams[4].source_paths,
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ),
    "BLOCKER_REGISTRY_PATH_PARTITION",
  );

  return {
    entries: paths.length,
    workstreams: registry.workstreams.length,
    completed: completedPaths.length,
    completedBrowserLive: completedBrowserLivePaths.length,
    completedLiveRoute: completedLiveRoutePaths.length,
    completedAuthenticatedBrowser: completedAuthenticatedBrowserPaths.length,
    blocked: launchBlocking.length,
  };
}

try {
  const result = validateRegistry();
  console.log(
    `PASS_PUBLIC_LAUNCH_BLOCKER_REGISTRY entries=${result.entries} workstreams=${result.workstreams} completed_public_production=${result.completed} completed_public_browser_live=${result.completedBrowserLive} completed_public_live_routes=${result.completedLiveRoute} completed_authenticated_browser=${result.completedAuthenticatedBrowser} authenticated_live_route_partial_static=1 authenticated_live_route_no_static=27 blocked=${result.blocked} planning_artifacts=4 next_active_workstream=AUTHENTICATED_LIVE_ROUTE_RUNTIME decision=NO_GO failures=0 internal_failures=0`,
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
