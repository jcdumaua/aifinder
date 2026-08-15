import path from "node:path";
import {
  GovernanceError,
  appSurfaceDigest,
  appSurfaceInventory,
  categoricalFailure,
  compareExactPathSets,
  readStrictJson,
  stableSortedPaths,
  worktreeGitIdentity,
} from "./static-governance-utils.mjs";

const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const PARTIAL_EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const HISTORICAL_GAP_CODE = "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED";
const V1_ADMIN_GAP_CODE =
  "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED";
const V1_SCOPE_LEDGER_PATH = "testing/admin-v1-launch-scope.json";
const V1_SCOPE_TEST_PATH = "testing/admin-v1-launch-scope.test.mjs";
const V1_HERMETIC_TEST_PATH =
  "testing/admin-v1-launch-critical-hermetic.test.mjs";
const V1_STAGING_SOURCE_POLICY_PATH =
  "testing/admin-v1-staging-readiness-source-policy.test.mjs";
const V1_STAGING_EVIDENCE_PATH =
  "testing/admin-v1-staging-readiness-evidence.json";
const V1_STAGING_EVIDENCE_TEST_PATH =
  "testing/admin-v1-staging-readiness-evidence.test.mjs";
const V1_RUNTIME_EVIDENCE_PATH =
  "testing/admin-v1-staging-runtime-evidence.json";
const V1_PRE_RUNTIME_STATE =
  "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED";
const V1_POST_RUNTIME_STATE =
  "V1_ADMIN_STAGING_AUTHENTICATED_RUNTIME_VALIDATED";
const RUNTIME_EVIDENCE_PATH =
  "testing/public-production-runtime-evidence.json";
const BROWSER_LIVE_EVIDENCE_PATH =
  "testing/public-browser-live-runtime-evidence.json";
const LIVE_ROUTE_EVIDENCE_PATH =
  "testing/public-live-route-runtime-evidence.json";
const AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH =
  "testing/authenticated-browser-security-static-assertions.mjs";
const AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH =
  "testing/authenticated-browser-static-evidence.json";
const AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH =
  "testing/authenticated-browser-runtime-evidence.json";
const AUTHENTICATED_BROWSER_INTEGRATED_EVIDENCE_PATHS = [
  AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
  AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH,
  AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
];
const AUTHENTICATED_BROWSER_FUTURE_EVIDENCE_PATHS = [
  "testing/accessibility-qa.spec.ts",
  "testing/responsive-qa.spec.ts",
];
const AUTHENTICATED_AUDIT_ROUTE_PATH =
  "app/api/admin/audit-logs/route.ts";
const BASELINE = "01a5c779f3f47f9619a2cd4a913622e010145afc";
const PUBLIC_ROOTS = new Set([
  "app/page.tsx",
  "app/layout.tsx",
  "app/error.tsx",
  "app/global-error.tsx",
  "app/loading.tsx",
  "app/not-found.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/manifest.ts",
  "app/opengraph-image.tsx",
  "app/twitter-image.tsx",
]);
const COVERAGE_STATES = new Set([
  "STATIC_COVERED",
  "PARTIAL_STATIC",
  "NO_STATIC_EVIDENCE",
  "RUNTIME_EVIDENCE_INTEGRATED",
  "BROWSER_LIVE_EVIDENCE_INTEGRATED",
  "LIVE_ROUTE_EVIDENCE_INTEGRATED",
  "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
  V1_PRE_RUNTIME_STATE,
  V1_POST_RUNTIME_STATE,
  "V1_ADMIN_DEFERRED_FAIL_CLOSED",
]);
const STATIC_CLASSES = new Set([
  "SAFE_STATIC_CORE",
  "SAFE_STATIC_POLICY",
  "SAFE_STATIC_SUPPORT",
  "SAFE_HERMETIC_POLICY",
]);
const RUNTIME_EVIDENCE_PATHS = [
  "app/category/[slug]/page.tsx",
  "app/compare/page.tsx",
  "app/layout.tsx",
  "app/not-found.tsx",
  "app/page.tsx",
  "app/submit/page.tsx",
  "app/tool/[slug]/page.tsx",
];
const BROWSER_LIVE_EVIDENCE_PATHS = [
  "app/category/[slug]/error.tsx",
  "app/compare/error.tsx",
  "app/error.tsx",
  "app/global-error.tsx",
  "app/loading.tsx",
  "app/manifest.ts",
  "app/opengraph-image.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/submit/error.tsx",
  "app/submit/layout.tsx",
  "app/tool/[slug]/error.tsx",
  "app/twitter-image.tsx",
];
const LIVE_ROUTE_EVIDENCE_PATHS = [
  "app/api/homepage-control/published/route.ts",
  "app/api/submit-tool/route.ts",
  "app/api/upload-logo/route.ts",
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
const V1_ADMIN_CRITICAL_PATHS = [
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
];
const V1_ADMIN_DEFERRED_PATHS = AUTHENTICATED_LIVE_ROUTE_PATHS.filter(
  (repositoryPath) => !V1_ADMIN_CRITICAL_PATHS.includes(repositoryPath),
);
const FUTURE_ONLY_CLASSES = new Set([
  "BROWSER_OR_PLAYWRIGHT",
  "LIVE_ROUTE_OR_SERVER",
  "DATABASE_OR_SUPABASE",
  "NETWORK_OR_EXTERNAL",
  "OPERATIONAL_MUTATION",
  "UNPROVEN_DENY",
]);

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

function exactSet(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    compareExactPathSets(actual, expected).equal
  );
}

function surfaceKind(repositoryPath) {
  return path.basename(repositoryPath, path.extname(repositoryPath));
}

function visibility(repositoryPath) {
  return repositoryPath.startsWith("app/admin/") ||
    repositoryPath.startsWith("app/api/admin/") ||
    repositoryPath === "app/admin-login/page.tsx" ||
    repositoryPath === "app/admin-login/layout.tsx"
    ? "ADMIN"
    : "PUBLIC";
}

function validateMatrix() {
  let matrix;
  try {
    matrix = readStrictJson(MATRIX_PATH);
  } catch (caught) {
    if (
      caught instanceof GovernanceError &&
      caught.stage === "REGULAR_FILE_ABSENT"
    ) {
      fail("READINESS_COVERAGE_MATRIX_ABSENT");
    }
    throw caught;
  }
  const manifest = readStrictJson(MANIFEST_PATH);
  const evidence = readStrictJson(PARTIAL_EVIDENCE_PATH);
  assert(matrix.matrix_version === 1, "MATRIX_VERSION");
  assert(matrix.repository_baseline === BASELINE, "MATRIX_BASELINE");
  assert(Array.isArray(matrix.entries), "MATRIX_ENTRIES");
  assert(
    typeof matrix.route_inventory_digest === "string" &&
      /^[0-9a-f]{64}$/.test(matrix.route_inventory_digest),
    "MATRIX_ROUTE_DIGEST",
  );
  assert(
    matrix.entries.length === 69 &&
      new Set(matrix.entries.map((entry) => entry.path)).size === 69,
    "MATRIX_ENTRY_SET",
  );

  const inventory = appSurfaceInventory();
  const paths = matrix.entries.map((entry) => entry.path);
  assert(paths.length === new Set(paths).size, "MATRIX_DUPLICATE_PATH");
  assert(
    paths.every((entry, index) => entry === stableSortedPaths(paths)[index]),
    "MATRIX_PATH_ORDER",
  );
  assert(compareExactPathSets(paths, inventory).equal, "MATRIX_INVENTORY");
  for (const repositoryPath of inventory) {
    assert(
      /^git:[0-9a-f]{40}$/.test(worktreeGitIdentity(repositoryPath)),
      "MATRIX_ROUTE_IDENTITY_FORMAT",
    );
  }
  assert(
    matrix.route_inventory_digest === appSurfaceDigest(),
    "MATRIX_ROUTE_DIGEST",
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

  const manifestByPath = new Map(
    manifest.entries.map((entry) => [entry.path, entry]),
  );
  for (const entry of matrix.entries) {
    assert(entry.surface_kind === surfaceKind(entry.path), "MATRIX_SURFACE_KIND");
    assert(
      entry.public_or_admin === visibility(entry.path),
      "MATRIX_VISIBILITY",
    );
    assert(
      typeof entry.url_pattern_or_special_role === "string" &&
        entry.url_pattern_or_special_role.length > 0,
      "MATRIX_ROLE",
    );
    assert(
      typeof entry.security_boundary_class === "string" &&
        /^[A-Z0-9_]+$/.test(entry.security_boundary_class),
      "MATRIX_SECURITY_BOUNDARY",
    );
    assert(Array.isArray(entry.static_evidence_paths), "MATRIX_STATIC_EVIDENCE");
    assert(Array.isArray(entry.future_evidence_paths), "MATRIX_FUTURE_EVIDENCE");
    assert(
      entry.static_evidence_paths.length ===
        new Set(entry.static_evidence_paths).size,
      "MATRIX_DUPLICATE_STATIC_EVIDENCE",
    );
    assert(
      entry.future_evidence_paths.length ===
        new Set(entry.future_evidence_paths).size,
      "MATRIX_DUPLICATE_FUTURE_EVIDENCE",
    );
    assert(COVERAGE_STATES.has(entry.coverage_state), "MATRIX_COVERAGE_STATE");
    assert(typeof entry.launch_blocking === "boolean", "MATRIX_LAUNCH_BLOCKING");
    assert(
      entry.gap_code_or_null === null ||
        (typeof entry.gap_code_or_null === "string" &&
          /^[A-Z0-9_]+$/.test(entry.gap_code_or_null)),
      "MATRIX_GAP_CODE",
    );

    for (const evidencePath of entry.static_evidence_paths) {
      const evidence = manifestByPath.get(evidencePath);
      assert(Boolean(evidence), "MATRIX_UNKNOWN_EVIDENCE");
      assert(
        STATIC_CLASSES.has(evidence.safety_class),
        "MATRIX_DENIED_STATIC_EVIDENCE",
      );
    }
    for (const evidencePath of entry.future_evidence_paths) {
      const evidence = manifestByPath.get(evidencePath);
      assert(Boolean(evidence), "MATRIX_UNKNOWN_FUTURE_EVIDENCE");
      assert(
        FUTURE_ONLY_CLASSES.has(evidence.safety_class) ||
          evidence.ci_disposition === "VALIDATE_ONLY",
        "MATRIX_FUTURE_EVIDENCE_CLASS",
      );
    }

    if (entry.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED") {
      assert(
        entry.static_evidence_paths.includes(RUNTIME_EVIDENCE_PATH),
        "MATRIX_RUNTIME_EVIDENCE_MISSING",
      );
      assert(
        entry.static_evidence_paths.length > 0,
        "MATRIX_COVERED_WITHOUT_EVIDENCE",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_RUNTIME_EVIDENCE_STILL_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_COVERED_WITH_GAP");
    } else if (
      entry.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED"
    ) {
      assert(
        entry.static_evidence_paths.includes(BROWSER_LIVE_EVIDENCE_PATH),
        "MATRIX_BROWSER_LIVE_EVIDENCE_MISSING",
      );
      assert(
        entry.static_evidence_paths.length > 0,
        "MATRIX_COVERED_WITHOUT_EVIDENCE",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_BROWSER_LIVE_EVIDENCE_STILL_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_COVERED_WITH_GAP");
    } else if (entry.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED") {
      assert(
        JSON.stringify(entry.static_evidence_paths) ===
          JSON.stringify([
            "testing/public-live-route-security-static-assertions.mjs",
            LIVE_ROUTE_EVIDENCE_PATH,
          ]),
        "MATRIX_LIVE_ROUTE_EVIDENCE_MISSING",
      );
      assert(
        entry.future_evidence_paths.length === 0,
        "MATRIX_LIVE_ROUTE_FUTURE_EVIDENCE",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_LIVE_ROUTE_EVIDENCE_STILL_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_COVERED_WITH_GAP");
    } else if (
      entry.coverage_state === "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED"
    ) {
      assert(
        exactArray(
          entry.static_evidence_paths,
          AUTHENTICATED_BROWSER_INTEGRATED_EVIDENCE_PATHS,
        ),
        "MATRIX_AUTHENTICATED_BROWSER_EVIDENCE_MISSING",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_AUTHENTICATED_BROWSER_EVIDENCE_STILL_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_COVERED_WITH_GAP");
    } else if (
      entry.coverage_state === V1_PRE_RUNTIME_STATE
    ) {
      assert(
        entry.static_evidence_paths.includes(V1_SCOPE_LEDGER_PATH) &&
          entry.static_evidence_paths.includes(V1_SCOPE_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_HERMETIC_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_SOURCE_POLICY_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_TEST_PATH),
        "MATRIX_V1_ADMIN_CRITICAL_EVIDENCE_MISSING",
      );
      assert(entry.launch_blocking, "MATRIX_V1_ADMIN_CRITICAL_NOT_BLOCKING");
      assert(
        entry.gap_code_or_null === V1_ADMIN_GAP_CODE,
        "MATRIX_V1_ADMIN_CRITICAL_GAP",
      );
    } else if (entry.coverage_state === V1_POST_RUNTIME_STATE) {
      assert(
        entry.static_evidence_paths.includes(V1_SCOPE_LEDGER_PATH) &&
          entry.static_evidence_paths.includes(V1_SCOPE_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_HERMETIC_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_SOURCE_POLICY_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_RUNTIME_EVIDENCE_PATH),
        "MATRIX_V1_ADMIN_RUNTIME_EVIDENCE_MISSING",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_V1_ADMIN_RUNTIME_STILL_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_V1_ADMIN_RUNTIME_GAP");
    } else if (entry.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED") {
      assert(
        entry.static_evidence_paths.includes(V1_SCOPE_LEDGER_PATH) &&
          entry.static_evidence_paths.includes(V1_SCOPE_TEST_PATH),
        "MATRIX_V1_ADMIN_DEFERRED_EVIDENCE_MISSING",
      );
      assert(
        entry.launch_blocking === false,
        "MATRIX_V1_ADMIN_DEFERRED_BLOCKING",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_V1_ADMIN_DEFERRED_GAP");
    } else if (entry.coverage_state === "STATIC_COVERED") {
      assert(
        entry.static_evidence_paths.length > 0,
        "MATRIX_COVERED_WITHOUT_EVIDENCE",
      );
      assert(entry.gap_code_or_null === null, "MATRIX_COVERED_WITH_GAP");
    } else if (entry.coverage_state === "PARTIAL_STATIC") {
      assert(
        entry.static_evidence_paths.length > 0,
        "MATRIX_PARTIAL_WITHOUT_EVIDENCE",
      );
      assert(entry.launch_blocking, "MATRIX_GAP_NOT_BLOCKING");
      assert(entry.gap_code_or_null !== null, "MATRIX_GAP_HIDDEN");
    } else {
      assert(
        entry.static_evidence_paths.length === 0,
        "MATRIX_NO_STATIC_WITH_EVIDENCE",
      );
      assert(entry.launch_blocking, "MATRIX_GAP_NOT_BLOCKING");
      assert(entry.gap_code_or_null !== null, "MATRIX_GAP_HIDDEN");
    }
  }

  for (const entry of authenticated) {
    assert(
      exactArray(entry.partial_evidence_paths, [PARTIAL_EVIDENCE_PATH]),
      "MATRIX_PARTIAL_EVIDENCE_LINK",
    );
    assert(
      Array.isArray(entry.static_evidence_paths) &&
        Array.isArray(entry.future_evidence_paths) &&
        entry.future_evidence_paths.length === 0,
      "MATRIX_EVIDENCE_ARRAYS",
    );
    if (V1_ADMIN_CRITICAL_PATHS.includes(entry.path)) {
      const preRuntime =
        entry.coverage_state === V1_PRE_RUNTIME_STATE &&
        entry.launch_blocking === true &&
        entry.gap_code_or_null === V1_ADMIN_GAP_CODE &&
        !entry.static_evidence_paths.includes(V1_RUNTIME_EVIDENCE_PATH);
      const postRuntime =
        entry.coverage_state === V1_POST_RUNTIME_STATE &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null &&
        entry.static_evidence_paths.includes(V1_RUNTIME_EVIDENCE_PATH);
      assert(
        preRuntime !== postRuntime &&
          entry.static_evidence_paths.includes(V1_HERMETIC_TEST_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_SOURCE_POLICY_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_PATH) &&
          entry.static_evidence_paths.includes(V1_STAGING_EVIDENCE_TEST_PATH),
        "MATRIX_V1_ADMIN_CRITICAL_ROUTE",
      );
    } else {
      assert(
        entry.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED" &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null,
        "MATRIX_V1_ADMIN_DEFERRED_ROUTE",
      );
    }
  }

  const publicCount = matrix.entries.filter(
    (entry) => entry.public_or_admin === "PUBLIC",
  ).length;
  const adminCount = matrix.entries.length - publicCount;
  const covered = matrix.entries.filter(
    (entry) => entry.coverage_state === "STATIC_COVERED",
  ).length;
  const runtimeEvidenceIntegrated = matrix.entries.filter(
    (entry) => entry.coverage_state === "RUNTIME_EVIDENCE_INTEGRATED",
  );
  const browserLiveEvidenceIntegrated = matrix.entries.filter(
    (entry) =>
      entry.coverage_state === "BROWSER_LIVE_EVIDENCE_INTEGRATED",
  );
  const liveRouteEvidenceIntegrated = matrix.entries.filter(
    (entry) => entry.coverage_state === "LIVE_ROUTE_EVIDENCE_INTEGRATED",
  );
  const authenticatedBrowserEvidenceIntegrated = matrix.entries.filter(
    (entry) =>
      entry.coverage_state ===
      "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
  );
  const unblockedPaths = matrix.entries
    .filter((entry) => entry.launch_blocking === false)
    .map((entry) => entry.path);
  const launchBlocking = matrix.entries.filter(
    (entry) => entry.launch_blocking === true,
  ).length;
  const gaps = launchBlocking;
  const evidenceManifestEntry = manifestByPath.get(RUNTIME_EVIDENCE_PATH);
  const browserLiveEvidenceManifestEntry = manifestByPath.get(
    BROWSER_LIVE_EVIDENCE_PATH,
  );
  const liveRouteEvidenceManifestEntry = manifestByPath.get(
    LIVE_ROUTE_EVIDENCE_PATH,
  );
  const authenticatedBrowserRuntimeEvidenceManifestEntry = manifestByPath.get(
    AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
  );
  const v1RuntimeEvidenceManifestEntry = manifestByPath.get(
    V1_RUNTIME_EVIDENCE_PATH,
  );
  const authenticatedBrowserGapPaths = matrix.entries
    .filter(
      (entry) =>
        entry.gap_code_or_null ===
        "AUTHENTICATED_BROWSER_EVIDENCE_REQUIRED",
    )
    .map((entry) => entry.path);
  const authenticatedBrowserEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_BROWSER_PATHS.includes(entry.path),
  );
  const authenticatedLiveRouteEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_LIVE_ROUTE_PATHS.includes(entry.path),
  );
  const v1AdminCriticalEntries = authenticatedLiveRouteEntries.filter(
    (entry) => V1_ADMIN_CRITICAL_PATHS.includes(entry.path),
  );
  const v1AdminDeferredEntries = authenticatedLiveRouteEntries.filter(
    (entry) => V1_ADMIN_DEFERRED_PATHS.includes(entry.path),
  );
  const v1AdminPreRuntime = v1AdminCriticalEntries.every(
    (entry) =>
      entry.coverage_state === V1_PRE_RUNTIME_STATE &&
      entry.launch_blocking === true &&
      entry.gap_code_or_null === V1_ADMIN_GAP_CODE &&
      !entry.static_evidence_paths.includes(V1_RUNTIME_EVIDENCE_PATH),
  );
  const v1AdminPostRuntime = v1AdminCriticalEntries.every(
    (entry) =>
      entry.coverage_state === V1_POST_RUNTIME_STATE &&
      entry.launch_blocking === false &&
      entry.gap_code_or_null === null &&
      entry.static_evidence_paths.includes(V1_RUNTIME_EVIDENCE_PATH),
  );
  const currentGovernance = v1AdminPostRuntime
    ? "POST_RUNTIME"
    : "PRE_RUNTIME";
  const partialStatic = matrix.entries.filter(
    (entry) => entry.coverage_state === "PARTIAL_STATIC",
  );
  assert(
    PUBLIC_ROOTS.size > 0 && publicCount > 0 && adminCount > 0,
    "MATRIX_PARTITION",
  );
  assert(
    matrix.entries.length === 69 &&
      runtimeEvidenceIntegrated.length === 7 &&
      browserLiveEvidenceIntegrated.length === 13 &&
      liveRouteEvidenceIntegrated.length === 3 &&
      authenticatedBrowserEvidenceIntegrated.length === 18 &&
      compareExactPathSets(
        runtimeEvidenceIntegrated.map((entry) => entry.path),
        RUNTIME_EVIDENCE_PATHS,
      ).equal &&
      compareExactPathSets(
        browserLiveEvidenceIntegrated.map((entry) => entry.path),
        BROWSER_LIVE_EVIDENCE_PATHS,
      ).equal &&
      compareExactPathSets(
        liveRouteEvidenceIntegrated.map((entry) => entry.path),
        LIVE_ROUTE_EVIDENCE_PATHS,
      ).equal &&
      compareExactPathSets(unblockedPaths, [
        ...RUNTIME_EVIDENCE_PATHS,
        ...BROWSER_LIVE_EVIDENCE_PATHS,
        ...LIVE_ROUTE_EVIDENCE_PATHS,
        ...AUTHENTICATED_BROWSER_PATHS,
        ...V1_ADMIN_DEFERRED_PATHS,
        ...(v1AdminPostRuntime ? V1_ADMIN_CRITICAL_PATHS : []),
      ]).equal &&
      authenticatedBrowserGapPaths.length === 0 &&
      authenticatedBrowserEntries.length === 18 &&
      authenticatedBrowserEntries.every(
        (entry) =>
          entry.coverage_state ===
            "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null &&
          exactArray(
            entry.static_evidence_paths,
            AUTHENTICATED_BROWSER_INTEGRATED_EVIDENCE_PATHS,
          ) &&
          exactArray(
            entry.future_evidence_paths,
            AUTHENTICATED_BROWSER_FUTURE_EVIDENCE_PATHS,
          ),
      ) &&
      v1AdminCriticalEntries.length === 7 &&
      exactSet(
        v1AdminCriticalEntries.map((entry) => entry.path),
        V1_ADMIN_CRITICAL_PATHS,
      ) &&
      v1AdminPreRuntime !== v1AdminPostRuntime &&
      v1AdminDeferredEntries.length === 21 &&
      exactSet(
        v1AdminDeferredEntries.map((entry) => entry.path),
        V1_ADMIN_DEFERRED_PATHS,
      ) &&
      v1AdminDeferredEntries.every(
        (entry) =>
          entry.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED" &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null,
      ) &&
      partialStatic.length === 0 &&
      launchBlocking === (v1AdminPostRuntime ? 0 : 7),
    "MATRIX_RUNTIME_EVIDENCE_PARTITION",
  );

  const launchBlockingEntries = matrix.entries.filter(
    (entry) => entry.launch_blocking === true,
  );
  assert(
    v1AdminPostRuntime
      ? launchBlockingEntries.length === 0
      : launchBlockingEntries.length === 7 &&
        exactSet(
          launchBlockingEntries.map((entry) => entry.path),
          V1_ADMIN_CRITICAL_PATHS,
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
    const historicalCoverageState =
      route.baseline_path === AUTHENTICATED_AUDIT_ROUTE_PATH
        ? "PARTIAL_STATIC"
        : "NO_STATIC_EVIDENCE";
    assert(
      entry &&
        route.matrix_link?.matrix_path === MATRIX_PATH &&
        route.matrix_link?.coverage_state === historicalCoverageState &&
        route.matrix_link?.partial_evidence_path === PARTIAL_EVIDENCE_PATH &&
        route.matrix_link?.gap_code === HISTORICAL_GAP_CODE &&
        route.blocker_state === HISTORICAL_GAP_CODE &&
        route.launch_blocking === true,
      "MATRIX_HISTORICAL_EVIDENCE_CROSS_LINK",
    );
  }
  assert(
    publicCount === 23 &&
      adminCount === 46 &&
      runtimeEvidenceIntegrated.length === 7 &&
      browserLiveEvidenceIntegrated.length === 13 &&
      liveRouteEvidenceIntegrated.length === 3 &&
      authenticatedBrowserEvidenceIntegrated.length === 18 &&
      v1AdminCriticalEntries.length === 7 &&
      v1AdminDeferredEntries.length === 21,
    "MATRIX_PRESERVED_PARTITIONS",
  );

  const authenticatedStaticAssertionManifestEntry = manifestByPath.get(
    AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
  );
  const authenticatedStaticEvidenceManifestEntry = manifestByPath.get(
    AUTHENTICATED_BROWSER_STATIC_EVIDENCE_PATH,
  );
  assert(
    authenticatedStaticAssertionManifestEntry?.role === "EXECUTABLE" &&
      authenticatedStaticAssertionManifestEntry.safety_class ===
        "SAFE_STATIC_CORE" &&
      authenticatedStaticAssertionManifestEntry.ci_disposition ===
        "RUN_CORE" &&
      exactArray(authenticatedStaticAssertionManifestEntry.command_argv, [
        "node",
        AUTHENTICATED_BROWSER_STATIC_ASSERTION_PATH,
      ]) &&
      authenticatedStaticEvidenceManifestEntry?.role === "CONFIG" &&
      authenticatedStaticEvidenceManifestEntry.safety_class ===
        "SAFE_STATIC_SUPPORT" &&
      authenticatedStaticEvidenceManifestEntry.ci_disposition ===
        "VALIDATE_ONLY" &&
      authenticatedStaticEvidenceManifestEntry.command_argv === null,
    "MATRIX_AUTHENTICATED_STATIC_EVIDENCE_SAFETY",
  );
  assert(
    evidenceManifestEntry?.role === "CONFIG" &&
      evidenceManifestEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      evidenceManifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      evidenceManifestEntry.command_argv === null &&
      evidenceManifestEntry.reason_code === "FINAL_PUBLIC_RUNTIME_EVIDENCE",
    "MATRIX_RUNTIME_EVIDENCE_SAFETY",
  );
  assert(
    browserLiveEvidenceManifestEntry?.role === "CONFIG" &&
      browserLiveEvidenceManifestEntry.safety_class ===
        "SAFE_STATIC_SUPPORT" &&
      browserLiveEvidenceManifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      browserLiveEvidenceManifestEntry.command_argv === null &&
      browserLiveEvidenceManifestEntry.reason_code ===
        "FINAL_PUBLIC_BROWSER_LIVE_RUNTIME_EVIDENCE",
    "MATRIX_BROWSER_LIVE_EVIDENCE_SAFETY",
  );
  assert(
    liveRouteEvidenceManifestEntry?.role === "CONFIG" &&
      liveRouteEvidenceManifestEntry.safety_class ===
        "SAFE_STATIC_SUPPORT" &&
      liveRouteEvidenceManifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      liveRouteEvidenceManifestEntry.command_argv === null &&
      liveRouteEvidenceManifestEntry.reason_code ===
        "FINAL_PUBLIC_LIVE_ROUTE_RUNTIME_EVIDENCE",
    "MATRIX_LIVE_ROUTE_EVIDENCE_SAFETY",
  );
  assert(
    authenticatedBrowserRuntimeEvidenceManifestEntry?.role === "CONFIG" &&
      authenticatedBrowserRuntimeEvidenceManifestEntry.safety_class ===
        "SAFE_STATIC_SUPPORT" &&
      authenticatedBrowserRuntimeEvidenceManifestEntry.ci_disposition ===
        "VALIDATE_ONLY" &&
      authenticatedBrowserRuntimeEvidenceManifestEntry.command_argv === null &&
      authenticatedBrowserRuntimeEvidenceManifestEntry.reason_code ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE",
    "MATRIX_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_SAFETY",
  );
  assert(
    v1RuntimeEvidenceManifestEntry?.role === "CONFIG" &&
      v1RuntimeEvidenceManifestEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      v1RuntimeEvidenceManifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      v1RuntimeEvidenceManifestEntry.command_argv === null &&
      v1RuntimeEvidenceManifestEntry.reason_code ===
        "ADMIN_V1_STAGING_RUNTIME_EVIDENCE",
    "MATRIX_V1_RUNTIME_EVIDENCE_SAFETY",
  );
  const partialEvidenceManifestEntry = manifestByPath.get(PARTIAL_EVIDENCE_PATH);
  assert(
    partialEvidenceManifestEntry?.role === "CONFIG" &&
      partialEvidenceManifestEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      partialEvidenceManifestEntry.ci_disposition === "VALIDATE_ONLY" &&
      partialEvidenceManifestEntry.command_argv === null &&
      partialEvidenceManifestEntry.reason_code ===
        "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE",
    "MATRIX_PARTIAL_EVIDENCE_CLASSIFICATION",
  );
  return {
    entries: matrix.entries.length,
    publicCount,
    adminCount,
    covered,
    runtimeEvidenceIntegrated: runtimeEvidenceIntegrated.length,
    browserLiveEvidenceIntegrated: browserLiveEvidenceIntegrated.length,
    liveRouteEvidenceIntegrated: liveRouteEvidenceIntegrated.length,
    authenticatedBrowserIntegrated:
      authenticatedBrowserEvidenceIntegrated.length,
    v1AdminHermetic: v1AdminCriticalEntries.length,
    v1AdminRuntimeValidated: v1AdminPostRuntime
      ? v1AdminCriticalEntries.length
      : 0,
    v1AdminDeferred: v1AdminDeferredEntries.length,
    currentGovernance,
    launchBlocking,
    gaps,
  };
}

try {
  const result = validateMatrix();
  console.log(
    `PASS_READINESS_COVERAGE_MATRIX entries=${result.entries} public=${result.publicCount} admin=${result.adminCount} current_governance=${result.currentGovernance} v1_admin_staging_dependency_ready=${result.v1AdminHermetic} v1_admin_runtime_validated=${result.v1AdminRuntimeValidated} v1_admin_deferred=${result.v1AdminDeferred} launch_blocking=${result.launchBlocking} unblocked=${result.entries - result.launchBlocking} gaps=${result.gaps} public_launch=NO_GO failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (caught instanceof GovernanceError) {
    categoricalFailure(caught.stage);
    console.log("FAIL_READINESS_COVERAGE_MATRIX failures=1 internal_failures=0");
  } else {
    console.log("INTERNAL_FAIL_READINESS_COVERAGE_MATRIX");
    console.log("FAIL_READINESS_COVERAGE_MATRIX failures=0 internal_failures=1");
  }
  process.exitCode = 1;
}
