import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SOURCE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) {
    return realpathSync(DEFAULT_SOURCE_ROOT);
  }

  if (
    argv.length !== 2 ||
    argv[0] !== "--source-root" ||
    typeof argv[1] !== "string" ||
    argv[1].trim().length === 0
  ) {
    throw new Error("HOMEPAGE_ROUTE_TEST_SOURCE_ROOT_ARGUMENTS");
  }

  const requestedRoot = realpathSync(path.resolve(argv[1]));
  if (!lstatSync(requestedRoot).isDirectory()) {
    throw new Error("HOMEPAGE_ROUTE_TEST_SOURCE_ROOT_NOT_DIRECTORY");
  }

  return requestedRoot;
}

const SOURCE_ROOT = parseSourceRoot(process.argv.slice(2));

function resolveSourcePath(repositoryPath) {
  if (
    typeof repositoryPath !== "string" ||
    repositoryPath.length === 0 ||
    path.isAbsolute(repositoryPath) ||
    repositoryPath.split("/").includes("..")
  ) {
    throw new Error("HOMEPAGE_ROUTE_TEST_SOURCE_PATH_INVALID");
  }

  const candidate = path.resolve(SOURCE_ROOT, repositoryPath);
  const canonical = realpathSync(candidate);
  const relative = path.relative(SOURCE_ROOT, canonical);

  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("HOMEPAGE_ROUTE_TEST_SOURCE_PATH_ESCAPE");
  }

  if (!lstatSync(canonical).isFile()) {
    throw new Error("HOMEPAGE_ROUTE_TEST_SOURCE_NOT_FILE");
  }

  return canonical;
}

function readSource(repositoryPath) {
  return readFileSync(resolveSourcePath(repositoryPath), "utf8");
}

const ADMIN_PATH = "lib/homepage-control-admin.ts";
const BODY_SAFETY_PATH = "lib/public-live-route-safety.ts";

const ROUTES = [
  {
    label: "create-draft",
    path: "app/api/admin/homepage-control/drafts/route.ts",
    method: "POST",
    capability: "createHomepageControlDraft",
    hasBody: false,
    hasId: false,
  },
  {
    label: "update-draft",
    path: "app/api/admin/homepage-control/drafts/[id]/route.ts",
    method: "PATCH",
    capability: "updateHomepageControlDraft",
    hasBody: true,
    hasId: true,
  },
  {
    label: "mark-preview",
    path:
      "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
    method: "POST",
    capability: "markHomepageControlConfigAsPreview",
    hasBody: false,
    hasId: true,
  },
  {
    label: "preview-checklist",
    path:
      "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
    method: "PATCH",
    capability: "updateHomepageControlPreviewChecklist",
    hasBody: true,
    hasId: true,
  },
  {
    label: "publish",
    path: "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
    method: "POST",
    capability: "publishHomepageControlConfig",
    hasBody: false,
    hasId: true,
  },
];

const failures = [];

function fail(domain, label, detail) {
  failures.push(`${domain}:${label}:${detail}`);
}

function requireMarker(source, marker, domain, label) {
  if (!source.includes(marker)) {
    fail(domain, label, `missing=${JSON.stringify(marker)}`);
  }
}

function forbidPattern(source, pattern, domain, label) {
  if (pattern.test(source)) {
    fail(domain, label, `forbidden=${pattern}`);
  }
}

function requirePattern(source, pattern, domain, label) {
  if (!pattern.test(source)) {
    fail(domain, label, `missing_pattern=${pattern}`);
  }
}

function requireOrder(source, markers, domain, label) {
  const indexes = markers.map((marker) => source.indexOf(marker));
  const ordered = indexes.every(
    (index, position) =>
      index >= 0 && (position === 0 || indexes[position - 1] < index),
  );

  if (!ordered) {
    fail(domain, label, `order=${markers.join(" -> ")}`);
  }
}

function inspectRoute(route) {
  const source = readSource(route.path);
  const label = route.label;

  requirePattern(
    source,
    /^import\s+["']server-only["'];/u,
    "HOMEPAGE_ROUTE_SERVER_ONLY",
    label,
  );
  forbidPattern(
    source,
    /["']use client["']/u,
    "HOMEPAGE_ROUTE_SERVER_ONLY",
    label,
  );
  requireMarker(
    source,
    'export const runtime = "nodejs";',
    "HOMEPAGE_ROUTE_RUNTIME",
    label,
  );
  requireMarker(
    source,
    'export const dynamic = "force-dynamic";',
    "HOMEPAGE_ROUTE_RUNTIME",
    label,
  );
  requirePattern(
    source,
    new RegExp(`export\\s+(?:async\\s+function|const)\\s+${route.method}\\b`, "u"),
    "HOMEPAGE_ROUTE_METHOD",
    label,
  );
  requireMarker(
    source,
    '"Cache-Control": "no-store"',
    "HOMEPAGE_ROUTE_RESPONSE_HEADERS",
    label,
  );
  requireMarker(
    source,
    '"X-Content-Type-Options": "nosniff"',
    "HOMEPAGE_ROUTE_RESPONSE_HEADERS",
    label,
  );

  requireOrder(
    source,
    [
      "verifyAdminSession(request)",
      "verifyAdminCsrfRequest(request)",
      `${route.capability}(`,
    ],
    "HOMEPAGE_ROUTE_AUTH_CSRF_ORDER",
    label,
  );

  if (route.hasId) {
    requireMarker(
      source,
      "UUID_PATTERN",
      "HOMEPAGE_ROUTE_ID_VALIDATION",
      label,
    );
    requireMarker(
      source,
      "UUID_PATTERN.test(id)",
      "HOMEPAGE_ROUTE_ID_VALIDATION",
      label,
    );

    const idCheck = source.indexOf("UUID_PATTERN.test(id)");
    const capabilityCall = source.lastIndexOf(`${route.capability}(`);
    if (idCheck < 0 || capabilityCall < 0 || idCheck >= capabilityCall) {
      fail(
        "HOMEPAGE_ROUTE_ID_VALIDATION",
        label,
        "uuid_check_must_precede_capability",
      );
    }
  }

  if (route.hasBody) {
    requireMarker(
      source,
      "readBoundedRequestBody",
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
    requireMarker(
      source,
      "parseBoundedJsonBody",
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
    requireMarker(
      source,
      "PublicLiveRouteSafetyError",
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
    requireMarker(
      source,
      "MAX_BODY_SIZE_BYTES",
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
    requireMarker(
      source,
      "application/json",
      "HOMEPAGE_ROUTE_CONTENT_TYPE",
      label,
    );
    forbidPattern(
      source,
      /\brequest\.json\s*\(/u,
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
    forbidPattern(
      source,
      /Number\s*\(\s*contentLengthHeader/u,
      "HOMEPAGE_ROUTE_ACTUAL_BYTE_BOUND",
      label,
    );
  } else {
    forbidPattern(
      source,
      /\brequest\.(?:json|text|arrayBuffer|formData)\s*\(/u,
      "HOMEPAGE_ROUTE_UNEXPECTED_BODY_READ",
      label,
    );
  }

  requirePattern(
    source,
    /\btry\s*\{/u,
    "HOMEPAGE_ROUTE_ERROR_BOUNDARY",
    label,
  );
  requirePattern(
    source,
    /\bcatch(?:\s*\([^)]*\))?\s*\{/u,
    "HOMEPAGE_ROUTE_ERROR_BOUNDARY",
    label,
  );
  requirePattern(
    source,
    /console\.(?:warn|error)\s*\(\s*["'][a-z0-9_]+["']\s*\)/u,
    "HOMEPAGE_ROUTE_FIXED_DIAGNOSTIC",
    label,
  );
  const diagnosticCalls = source.match(
    /console\.(?:log|warn|error|info)\s*\([^;]*?\)/gsu,
  ) ?? [];
  for (const diagnosticCall of diagnosticCalls) {
    if (
      !/^console\.(?:log|warn|error|info)\s*\(\s*["'][a-z0-9_]+["']\s*\)$/su.test(
        diagnosticCall,
      )
    ) {
      fail(
        "HOMEPAGE_ROUTE_FIXED_DIAGNOSTIC",
        label,
        `non_categorical_call=${JSON.stringify(diagnosticCall)}`,
      );
    }
  }
  forbidPattern(
    source,
    /console\.(?:log|warn|error|info)\s*\([^;]*?(?:adminSession\.errors|result\.errors|result\.warnings|\.message\b|\.stack\b|\.cause\b|request\b|body\b|actor\b)/su,
    "HOMEPAGE_ROUTE_FIXED_DIAGNOSTIC",
    label,
  );
  forbidPattern(
    source,
    /\berrors\s*:\s*result\.errors\b(?!\s*\.filter\s*\()/su,
    "HOMEPAGE_ROUTE_RESPONSE_PRIVACY",
    label,
  );
  forbidPattern(
    source,
    /\bwarnings\s*:\s*result\.warnings\b(?!\s*\.filter\s*\()/su,
    "HOMEPAGE_ROUTE_RESPONSE_PRIVACY",
    label,
  );
  forbidPattern(
    source,
    /\b(?:errors|warnings)\s*:\s*\[[^\]]*?(?:\.message|\.stack|\.cause)/su,
    "HOMEPAGE_ROUTE_RESPONSE_PRIVACY",
    label,
  );
  forbidPattern(
    source,
    /`[^`]*(?:\$\{[^}]*(?:\.message|\.stack|\.cause)[^}]*\})[^`]*`/su,
    "HOMEPAGE_ROUTE_RESPONSE_PRIVACY",
    label,
  );

  if (route.capability !== "createHomepageControlDraft") {
    requirePattern(
      source,
      /(?:trusted|bounded|allowlist|classif)/iu,
      "HOMEPAGE_ROUTE_TRUSTED_ALLOWLIST",
      label,
    );
  }
}

for (const route of ROUTES) {
  inspectRoute(route);
}

const adminSource = readSource(ADMIN_PATH);
const bodySafetySource = readSource(BODY_SAFETY_PATH);

requireMarker(
  adminSource,
  '"use server";',
  "HOMEPAGE_ADMIN_SERVER_ONLY",
  "homepage-control-admin",
);
requireMarker(
  adminSource,
  'import "server-only";',
  "HOMEPAGE_ADMIN_SERVER_ONLY",
  "homepage-control-admin",
);
forbidPattern(
  adminSource,
  /^import\s+\{\s*supabaseAdmin\s*\}\s+from\s+["']\.\/supabase-admin["'];/mu,
  "HOMEPAGE_ADMIN_FABRICATED_CLIENT_SEAM",
  "homepage-control-admin",
);
requirePattern(
  adminSource,
  /await\s+import\s*\(\s*["']\.\/supabase-admin["']\s*\)/u,
  "HOMEPAGE_ADMIN_FABRICATED_CLIENT_SEAM",
  "homepage-control-admin",
);
requireMarker(
  bodySafetySource,
  "actualByteLength += chunk.byteLength",
  "HOMEPAGE_SHARED_BODY_SAFETY",
  "public-live-route-safety",
);
requireMarker(
  bodySafetySource,
  'throw new PublicLiveRouteSafetyError("content_length_understated")',
  "HOMEPAGE_SHARED_BODY_SAFETY",
  "public-live-route-safety",
);
requireMarker(
  bodySafetySource,
  'throw new PublicLiveRouteSafetyError("content_length_overstated")',
  "HOMEPAGE_SHARED_BODY_SAFETY",
  "public-live-route-safety",
);

if (failures.length > 0) {
  for (const failure of failures.sort()) {
    console.log(`RED_HOMEPAGE_ROUTE_SECURITY ${failure}`);
  }
  console.log(
    `FAIL_HOMEPAGE_CONTROL_DRAFT_MUTATION_ROUTES_SECURITY failures=${failures.length}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "PASS_HOMEPAGE_CONTROL_DRAFT_MUTATION_ROUTES_SECURITY failures=0",
  );
}
