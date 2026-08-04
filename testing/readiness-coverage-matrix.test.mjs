import { readFileSync } from "node:fs";

const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const PARTIAL_EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const GAP_CODE = "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED";
const AUTHENTICATED_AUDIT_ROUTE_PATH =
  "app/api/admin/audit-logs/route.ts";
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

function readJson(repositoryPath) {
  return JSON.parse(readFileSync(repositoryPath, "utf8"));
}

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

function exactSet(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index])
  );
}

function validateMatrix() {
  const matrix = readJson(MATRIX_PATH);
  const manifest = readJson(MANIFEST_PATH);
  const evidence = readJson(PARTIAL_EVIDENCE_PATH);

  assert(matrix.matrix_version === 1, "MATRIX_VERSION");
  assert(
    matrix.repository_baseline ===
      "01a5c779f3f47f9619a2cd4a913622e010145afc",
    "MATRIX_BASELINE",
  );
  assert(
    matrix.route_inventory_digest ===
      "e21fd3656a4bc3157acd23017ee1b5f141535dc239a85365f9268594bc18a780",
    "MATRIX_ROUTE_DIGEST",
  );
  assert(
    Array.isArray(matrix.entries) &&
      matrix.entries.length === 69 &&
      new Set(matrix.entries.map((entry) => entry.path)).size === 69,
    "MATRIX_ENTRY_SET",
  );

  const authenticated = matrix.entries.filter((entry) =>
    AUTHENTICATED_LIVE_ROUTE_PATHS.includes(entry.path),
  );
  assert(
    authenticated.length === 28 &&
      exactSet(
        authenticated.map((entry) => entry.path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ),
    "MATRIX_AUTHENTICATED_ROUTE_SET",
  );
  assert(
    matrix.entries
      .filter((entry) => !AUTHENTICATED_LIVE_ROUTE_PATHS.includes(entry.path))
      .every((entry) => entry.partial_evidence_paths === undefined),
    "MATRIX_PARTIAL_PATH_EXPANSION",
  );

  for (const entry of authenticated) {
    assert(
      exactArray(entry.partial_evidence_paths, [PARTIAL_EVIDENCE_PATH]),
      "MATRIX_PARTIAL_EVIDENCE_LINK",
    );
    assert(entry.launch_blocking === true, "MATRIX_LAUNCH_BLOCKING");
    assert(entry.gap_code_or_null === GAP_CODE, "MATRIX_GAP");
    assert(
      Array.isArray(entry.static_evidence_paths) &&
        Array.isArray(entry.future_evidence_paths) &&
        entry.future_evidence_paths.length === 0,
      "MATRIX_EVIDENCE_ARRAYS",
    );
    if (entry.path === AUTHENTICATED_AUDIT_ROUTE_PATH) {
      assert(
        entry.coverage_state === "PARTIAL_STATIC" &&
          exactArray(entry.static_evidence_paths, [
            "testing/authenticated-browser-security-static-assertions.mjs",
            "testing/authenticated-browser-static-evidence.json",
          ]),
        "MATRIX_PARTIAL_STATIC_ROUTE",
      );
    } else {
      assert(
        entry.coverage_state === "NO_STATIC_EVIDENCE" &&
          entry.static_evidence_paths.length === 0,
        "MATRIX_NO_STATIC_EVIDENCE_ROUTE",
      );
    }
  }

  const launchBlocking = matrix.entries.filter(
    (entry) => entry.launch_blocking === true,
  );
  assert(
    launchBlocking.length === 28 &&
      exactSet(
        launchBlocking.map((entry) => entry.path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ),
    "MATRIX_BLOCKER_PARTITION",
  );

  assert(
    evidence.summary?.route_files === 28 &&
      evidence.summary?.partial_static_routes === 1 &&
      evidence.summary?.no_static_evidence_routes === 27 &&
      evidence.summary?.launch_blocking_routes === 28 &&
      Array.isArray(evidence.routes) &&
      evidence.routes.length === 28 &&
      exactSet(
        evidence.routes.map((route) => route.baseline_path),
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ),
    "MATRIX_PARTIAL_EVIDENCE_SUMMARY",
  );
  for (const route of evidence.routes) {
    const entry = authenticated.find(
      (candidate) => candidate.path === route.baseline_path,
    );
    assert(
      entry &&
        route.matrix_link?.matrix_path === MATRIX_PATH &&
        route.matrix_link?.coverage_state === entry.coverage_state &&
        route.matrix_link?.partial_evidence_path === PARTIAL_EVIDENCE_PATH &&
        route.matrix_link?.gap_code === GAP_CODE &&
        route.blocker_state === GAP_CODE &&
        route.launch_blocking === true,
      "MATRIX_EVIDENCE_CROSS_LINK",
    );
  }

  const manifestEntry = manifest.entries?.find(
    (entry) => entry.path === PARTIAL_EVIDENCE_PATH,
  );
  assert(
    manifestEntry?.role === "CONFIG" &&
      manifestEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      manifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      manifestEntry.command_argv === null &&
      manifestEntry.reason_code ===
        "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE",
    "MATRIX_PARTIAL_EVIDENCE_CLASSIFICATION",
  );

  const publicCount = matrix.entries.filter(
    (entry) => entry.public_or_admin === "PUBLIC",
  ).length;
  const adminCount = matrix.entries.length - publicCount;
  const runtimeEvidenceIntegrated = matrix.entries.filter(
    (entry) => entry.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED",
  ).length;
  const browserLiveEvidenceIntegrated = matrix.entries.filter(
    (entry) => entry.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED",
  ).length;
  const liveRouteEvidenceIntegrated = matrix.entries.filter(
    (entry) => entry.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED",
  ).length;
  const authenticatedBrowserIntegrated = matrix.entries.filter(
    (entry) =>
      entry.coverage_state ===
      "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
  ).length;
  assert(
    publicCount === 23 &&
      adminCount === 46 &&
      runtimeEvidenceIntegrated === 7 &&
      browserLiveEvidenceIntegrated === 13 &&
      liveRouteEvidenceIntegrated === 3 &&
      authenticatedBrowserIntegrated === 18,
    "MATRIX_PRESERVED_PARTITIONS",
  );

  return {
    entries: matrix.entries.length,
    publicCount,
    adminCount,
    runtimeEvidenceIntegrated,
    browserLiveEvidenceIntegrated,
    liveRouteEvidenceIntegrated,
    authenticatedBrowserIntegrated,
    partialStatic: authenticated.filter(
      (entry) => entry.coverage_state === "PARTIAL_STATIC",
    ).length,
    noStatic: authenticated.filter(
      (entry) => entry.coverage_state === "NO_STATIC_EVIDENCE",
    ).length,
    launchBlocking: launchBlocking.length,
  };
}

try {
  const result = validateMatrix();
  console.log(
    `PASS_READINESS_COVERAGE_MATRIX entries=${result.entries} public=${result.publicCount} admin=${result.adminCount} static_covered=0 runtime_evidence_integrated=${result.runtimeEvidenceIntegrated} browser_live_evidence_integrated=${result.browserLiveEvidenceIntegrated} live_route_evidence_integrated=${result.liveRouteEvidenceIntegrated} authenticated_browser_integrated=${result.authenticatedBrowserIntegrated} authenticated_live_route_partial_static=${result.partialStatic} authenticated_live_route_no_static=${result.noStatic} authenticated_live_route_partial_evidence=28 partial_static=${result.partialStatic} launch_blocking=${result.launchBlocking} unblocked=${result.entries - result.launchBlocking} gaps=${result.launchBlocking} failures=0 internal_failures=0`,
  );
} catch (caught) {
  const stage =
    caught instanceof Error && /^[A-Z0-9_]+$/.test(caught.message)
      ? caught.message
      : "INTERNAL_MATRIX_FAILURE";
  console.log(`EXPECTED_FAIL_${stage}`);
  console.log("FAIL_READINESS_COVERAGE_MATRIX failures=1 internal_failures=0");
  process.exitCode = 1;
}
