import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const GAP_CODE = "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED";
const PARTIAL_STATE = "PARTIAL_ONLY_ALL_ROUTES_STILL_BLOCKED";
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

function assert(condition, stage) {
  if (!condition) throw new Error(stage);
}

function exactSet(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
  );
}

function fileIdentity(repositoryPath) {
  const bytes = readFileSync(repositoryPath);
  const gitHeader = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return {
    path: repositoryPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    git_blob: createHash("sha1").update(gitHeader).update(bytes).digest("hex"),
    bytes: bytes.length,
    lines: bytes.toString("utf8").split("\n").length - 1,
    mode: "0644",
  };
}

function validateRegistry() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const matrixBytes = readFileSync(MATRIX_PATH);
  const matrix = JSON.parse(matrixBytes.toString("utf8"));
  const evidence = JSON.parse(readFileSync(EVIDENCE_PATH, "utf8"));
  const identity = fileIdentity(MATRIX_PATH);

  assert(registry.registry_version === 1, "BLOCKER_REGISTRY_VERSION");
  assert(
    registry.source_commit ===
      "2570765ca0e769888286e42456d2f27d831f46df",
    "BLOCKER_REGISTRY_SOURCE_COMMIT",
  );
  for (const key of ["path", "sha256", "git_blob", "bytes", "lines", "mode"]) {
    assert(
      registry.source_matrix?.[key] === identity[key],
      "BLOCKER_REGISTRY_MATRIX_IDENTITY",
    );
  }
  assert(
    registry.source_matrix?.route_inventory_digest ===
      matrix.route_inventory_digest &&
      registry.source_matrix?.entry_count === 69 &&
      registry.source_matrix?.launch_blocking_count === 28,
    "BLOCKER_REGISTRY_MATRIX_SUMMARY",
  );
  assert(
    registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      registry.current_authority === "STATIC_ONLY" &&
      registry.execution_authorized === false,
    "BLOCKER_REGISTRY_AUTHORITY",
  );
  assert(
    Array.isArray(registry.blocked_capabilities) &&
      [
        "AUTHENTICATED_RUNTIME",
        "DATABASE",
        "DEPLOYMENT_CONTROL",
        "PUBLIC_LAUNCH",
        "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
        "SQL",
        "SUPABASE",
      ].every((value) => registry.blocked_capabilities.includes(value)),
    "BLOCKER_REGISTRY_BLOCKED_CAPABILITIES",
  );

  assert(
    Array.isArray(registry.planning_artifacts) &&
      registry.planning_artifacts.length === 4 &&
      registry.planning_artifacts.every(
        (entry) =>
          entry.execution_authorized === false &&
          typeof entry.path === "string" &&
          entry.path.startsWith("testing/"),
      ),
    "BLOCKER_REGISTRY_PLANNING_ARTIFACTS",
  );
  assert(
    Array.isArray(registry.workstreams) &&
      registry.workstreams.length === 5 &&
      JSON.stringify(registry.workstreams.map((entry) => entry.id)) ===
        JSON.stringify([
          "PUBLIC_PRODUCTION_RUNTIME",
          "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
          "PUBLIC_LIVE_ROUTE_RUNTIME",
          "AUTHENTICATED_BROWSER_RUNTIME",
          "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
        ]),
    "BLOCKER_REGISTRY_WORKSTREAM_SEQUENCE",
  );

  const workstream = registry.workstreams[4];
  assert(
    workstream.gap_code === GAP_CODE &&
      workstream.entry_count === 28 &&
      workstream.authority_class === "AUTHENTICATED_LIVE_ROUTE_RUNTIME" &&
      workstream.state === "BLOCKED_SEPARATE_AUTHORITY_REQUIRED" &&
      workstream.execution_authorized === false &&
      workstream.planning_priority === 5 &&
      workstream.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME" &&
      workstream.partial_static_count === 1 &&
      workstream.partial_evidence_path === EVIDENCE_PATH &&
      workstream.partial_evidence_state === PARTIAL_STATE &&
      exactSet(workstream.source_paths, AUTHENTICATED_LIVE_ROUTE_PATHS),
    "BLOCKER_REGISTRY_AUTHENTICATED_LIVE_ROUTE_WORKSTREAM",
  );

  const authenticatedEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_LIVE_ROUTE_PATHS.includes(entry.path),
  );
  const launchBlocking = matrix.entries.filter(
    (entry) => entry.launch_blocking === true,
  );
  assert(
    authenticatedEntries.length === 28 &&
      exactSet(
        authenticatedEntries.map((entry) => entry.path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ) &&
      launchBlocking.length === 28 &&
      exactSet(
        launchBlocking.map((entry) => entry.path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ) &&
      authenticatedEntries.filter(
        (entry) => entry.coverage_state === "PARTIAL_STATIC",
      ).length === 1 &&
      authenticatedEntries.filter(
        (entry) => entry.coverage_state === "NO_STATIC_EVIDENCE",
      ).length === 27 &&
      authenticatedEntries.every(
        (entry) =>
          entry.gap_code_or_null === GAP_CODE &&
          entry.partial_evidence_paths?.length === 1 &&
          entry.partial_evidence_paths[0] === EVIDENCE_PATH,
      ),
    "BLOCKER_REGISTRY_MATRIX_PARTITION",
  );

  assert(
    evidence.governance?.overall_decision ===
      "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      evidence.governance?.execution_authorized === false &&
      evidence.governance?.authenticated_live_route_workstream_state ===
        "BLOCKED_SEPARATE_AUTHORITY_REQUIRED" &&
      evidence.governance?.partial_evidence_state === PARTIAL_STATE &&
      evidence.summary?.launch_blocking_routes === 28 &&
      exactSet(
        evidence.routes?.map((route) => route.baseline_path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ),
    "BLOCKER_REGISTRY_EVIDENCE_CROSS_LINK",
  );

  const completed = matrix.entries.filter(
    (entry) => entry.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED",
  ).length;
  const completedBrowserLive = matrix.entries.filter(
    (entry) => entry.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED",
  ).length;
  const completedLiveRoute = matrix.entries.filter(
    (entry) => entry.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED",
  ).length;
  const completedAuthenticatedBrowser = matrix.entries.filter(
    (entry) =>
      entry.coverage_state ===
      "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
  ).length;
  assert(
    completed === 7 &&
      completedBrowserLive === 13 &&
      completedLiveRoute === 3 &&
      completedAuthenticatedBrowser === 18,
    "BLOCKER_REGISTRY_COMPLETED_WORKSTREAMS",
  );

  return {
    entries: matrix.entries.length,
    workstreams: registry.workstreams.length,
    completed,
    completedBrowserLive,
    completedLiveRoute,
    completedAuthenticatedBrowser,
    blocked: launchBlocking.length,
  };
}

try {
  const result = validateRegistry();
  console.log(
    `PASS_PUBLIC_LAUNCH_BLOCKER_REGISTRY entries=${result.entries} workstreams=${result.workstreams} completed_public_production=${result.completed} completed_public_browser_live=${result.completedBrowserLive} completed_public_live_routes=${result.completedLiveRoute} completed_authenticated_browser=${result.completedAuthenticatedBrowser} authenticated_live_route_partial_static=1 authenticated_live_route_no_static=27 authenticated_live_route_partial_evidence=28 authenticated_live_route_workstream_state=BLOCKED_SEPARATE_AUTHORITY_REQUIRED blocked=${result.blocked} planning_artifacts=4 next_active_workstream=AUTHENTICATED_LIVE_ROUTE_RUNTIME decision=NO_GO execution_authorized=false failures=0 internal_failures=0`,
  );
} catch (caught) {
  const stage =
    caught instanceof Error && /^[A-Z0-9_]+$/.test(caught.message)
      ? caught.message
      : "INTERNAL_BLOCKER_REGISTRY_FAILURE";
  console.log(`EXPECTED_FAIL_${stage}`);
  console.log(
    "FAIL_PUBLIC_LAUNCH_BLOCKER_REGISTRY failures=1 internal_failures=0",
  );
  process.exitCode = 1;
}
