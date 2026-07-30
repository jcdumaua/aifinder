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
const RUNTIME_EVIDENCE_PATH =
  "testing/public-production-runtime-evidence.json";
const BROWSER_LIVE_EVIDENCE_PATH =
  "testing/public-browser-live-runtime-evidence.json";
const LIVE_ROUTE_EVIDENCE_PATH =
  "testing/public-live-route-runtime-evidence.json";
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
]);
const STATIC_CLASSES = new Set([
  "SAFE_STATIC_CORE",
  "SAFE_STATIC_POLICY",
  "SAFE_STATIC_SUPPORT",
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
  assert(matrix.matrix_version === 1, "MATRIX_VERSION");
  assert(matrix.repository_baseline === BASELINE, "MATRIX_BASELINE");
  assert(Array.isArray(matrix.entries), "MATRIX_ENTRIES");
  assert(
    typeof matrix.route_inventory_digest === "string" &&
      /^[0-9a-f]{64}$/.test(matrix.route_inventory_digest),
    "MATRIX_ROUTE_DIGEST",
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
  const authenticatedBrowserGapPaths = matrix.entries
    .filter(
      (entry) =>
        entry.gap_code_or_null ===
        "AUTHENTICATED_BROWSER_EVIDENCE_REQUIRED",
    )
    .map((entry) => entry.path);
  const authenticatedLiveRouteGapPaths = matrix.entries
    .filter(
      (entry) =>
        entry.gap_code_or_null ===
        "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED",
    )
    .map((entry) => entry.path);
  assert(
    PUBLIC_ROOTS.size > 0 && publicCount > 0 && adminCount > 0,
    "MATRIX_PARTITION",
  );
  assert(
    matrix.entries.length === 69 &&
      runtimeEvidenceIntegrated.length === 7 &&
      browserLiveEvidenceIntegrated.length === 13 &&
      liveRouteEvidenceIntegrated.length === 3 &&
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
      ]).equal &&
      compareExactPathSets(
        authenticatedBrowserGapPaths,
        AUTHENTICATED_BROWSER_PATHS,
      ).equal &&
      compareExactPathSets(
        authenticatedLiveRouteGapPaths,
        AUTHENTICATED_LIVE_ROUTE_PATHS,
      ).equal &&
      launchBlocking === 46,
    "MATRIX_RUNTIME_EVIDENCE_PARTITION",
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
  return {
    entries: matrix.entries.length,
    publicCount,
    adminCount,
    covered,
    runtimeEvidenceIntegrated: runtimeEvidenceIntegrated.length,
    browserLiveEvidenceIntegrated: browserLiveEvidenceIntegrated.length,
    liveRouteEvidenceIntegrated: liveRouteEvidenceIntegrated.length,
    launchBlocking,
    gaps,
  };
}

try {
  const result = validateMatrix();
  console.log(
    `PASS_READINESS_COVERAGE_MATRIX entries=${result.entries} public=${result.publicCount} admin=${result.adminCount} static_covered=${result.covered} runtime_evidence_integrated=${result.runtimeEvidenceIntegrated} browser_live_evidence_integrated=${result.browserLiveEvidenceIntegrated} live_route_evidence_integrated=${result.liveRouteEvidenceIntegrated} launch_blocking=${result.launchBlocking} gaps=${result.gaps} failures=0 internal_failures=0`,
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
