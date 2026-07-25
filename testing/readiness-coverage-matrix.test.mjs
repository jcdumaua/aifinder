import path from "node:path";
import {
  GovernanceError,
  appSurfaceDigest,
  appSurfaceInventory,
  categoricalFailure,
  compareExactPathSets,
  readStrictJson,
  stableSortedPaths,
} from "./static-governance-utils.mjs";

const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
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
]);
const STATIC_CLASSES = new Set(["SAFE_STATIC_CORE", "SAFE_STATIC_POLICY"]);
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

    if (entry.coverage_state === "STATIC_COVERED") {
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
  const gaps = matrix.entries.length - covered;
  assert(
    PUBLIC_ROOTS.size > 0 && publicCount > 0 && adminCount > 0,
    "MATRIX_PARTITION",
  );
  return {
    entries: matrix.entries.length,
    publicCount,
    adminCount,
    covered,
    gaps,
  };
}

try {
  const result = validateMatrix();
  console.log(
    `PASS_READINESS_COVERAGE_MATRIX entries=${result.entries} public=${result.publicCount} admin=${result.adminCount} static_covered=${result.covered} gaps=${result.gaps} failures=0 internal_failures=0`,
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
