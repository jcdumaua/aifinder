import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  GovernanceError,
  categoricalFailure,
  compareExactPathSets,
  parseTypeScriptFile,
  readStrictJson,
  repositoryRoot,
  stableSortedPaths,
  strictJsonParse,
} from "./static-governance-utils.mjs";

const PLAN_PATH = "testing/public-production-runtime-planning-manifest.json";
const SOURCE_COMMIT = "05bcc50605809c6fb934d0bea914bf417758a457";
const SOURCE_REGISTRY = {
  path: "testing/public-launch-blocker-registry.json",
  sha256: "6808627391c8383924d72d2931cf36937b894edaab6da83d1bd04d481f612475",
  git_blob: "426cb7c8d51711474af99e0473dcf92bcc0cebef",
  bytes: 9489,
  lines: 264,
  mode: "0644",
};
const SOURCE_MATRIX = {
  path: "testing/readiness-coverage-matrix.json",
  sha256: "4a770a73b9b10bbcd8f4bd7931e1ca8b05f41e46395a23e92e1d82ad45b734fb",
  git_blob: "fcd1277d33aa1eb366c332fd14b396234550ac1a",
  bytes: 37588,
  lines: 978,
  mode: "0644",
  route_inventory_digest:
    "9409898f384e89f3a1cc99a87a154a3764d17edc450263b8e577d5533ecd6350",
  entry_count: 69,
  launch_blocking_count: 69,
};
const TOP_LEVEL_KEYS = [
  "planning_version",
  "source_commit",
  "source_registry",
  "source_matrix",
  "workstream",
  "decision",
  "current_authority",
  "execution_authorized",
  "live_evidence_status",
  "target_origin",
  "target_origin_resolution",
  "blocked_capabilities",
  "future_authority_classes",
  "surfaces",
  "next_gate",
];
const SOURCE_IDENTITY_KEYS = [
  "path",
  "sha256",
  "git_blob",
  "bytes",
  "lines",
  "mode",
];
const SOURCE_MATRIX_KEYS = [
  ...SOURCE_IDENTITY_KEYS,
  "route_inventory_digest",
  "entry_count",
  "launch_blocking_count",
];
const WORKSTREAM_KEYS = ["id", "gap_code", "entry_count"];
const SURFACE_KEYS = [
  "source_path",
  "surface_kind",
  "url_pattern_or_special_role",
  "source_identity",
  "local_import_closure",
  "direct_capability_signals",
  "transitive_capability_signals",
  "runtime_target_strategy",
  "future_authority_classes",
  "evidence_requirements",
  "failure_categories",
  "mutation_prohibited",
  "execution_authorized",
  "live_evidence_status",
];
const BLOCKED_CAPABILITIES = [
  "AUTHENTICATED_RUNTIME",
  "DATABASE",
  "DEPLOYMENT_CONTROL",
  "DIRECT_OR_INDIRECT_PRODUCTION_DATA_RETRIEVAL",
  "DIRECT_VERCEL_WRITE",
  "MIGRATIONS_OR_GENERATED_TYPES",
  "OPERATIONAL_REACTIVATION",
  "PUBLIC_LAUNCH",
  "PUBLIC_OR_DEPLOYED_BROWSER",
  "PUBLIC_OR_DEPLOYED_HTTP",
  "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
  "RUNTIME_TARGET_RESOLUTION",
  "SQL",
  "SUPABASE",
  "USER_VISIBLE_MUTATION",
];
const FUTURE_AUTHORITY_CLASSES = [
  "INDIRECT_PRODUCTION_DATA_READ",
  "PUBLIC_DYNAMIC_TARGET_RESOLUTION",
  "PUBLIC_FORM_NON_MUTATING_EVIDENCE",
  "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
  "PUBLIC_PRODUCTION_RUNTIME_HTTP",
];
const SOURCE_IDENTITIES = new Map([
  [
    "app/category/[slug]/page.tsx",
    {
      path: "app/category/[slug]/page.tsx",
      sha256:
        "1eb41ff12e344844adce52132054bcd52e1ce25b1fd4a0e9f4d283bb0053a156",
      git_blob: "d5bc48d2d28704f722b874ee1a056927f667c691",
      bytes: 9095,
      lines: 329,
      mode: "0644",
    },
  ],
  [
    "app/compare/page.tsx",
    {
      path: "app/compare/page.tsx",
      sha256:
        "2c4aaa4b8037bd8f677649564df3b74ddace7bf5e5d00ff679dd1bd7264cf7ad",
      git_blob: "bf0a18d6123a4f70e22c4d81e9ae19ee932aea9c",
      bytes: 3860,
      lines: 154,
      mode: "0644",
    },
  ],
  [
    "app/layout.tsx",
    {
      path: "app/layout.tsx",
      sha256:
        "b2a095d48d705cb95a364da0f73711bf6a1b199d37476af7656093d65a12469d",
      git_blob: "400c6c189c4a21c66a1905ff98f02664b297b103",
      bytes: 3339,
      lines: 126,
      mode: "0644",
    },
  ],
  [
    "app/not-found.tsx",
    {
      path: "app/not-found.tsx",
      sha256:
        "9847eb8ec32284f3d86980db33e656716aa0a695ccd3e2c10b65f717c67c7beb",
      git_blob: "c1c349187a8d4e00867e3f305fdee4380f8d4cf2",
      bytes: 165,
      lines: 5,
      mode: "0644",
    },
  ],
  [
    "app/page.tsx",
    {
      path: "app/page.tsx",
      sha256:
        "09ba81c12053a2a129cb55ff08e889144c41412edb7e8cdce84d36973a7ac3cb",
      git_blob: "6dd64e9320c822ae53a9c51d5457490f2c608b20",
      bytes: 58406,
      lines: 1726,
      mode: "0644",
    },
  ],
  [
    "app/submit/page.tsx",
    {
      path: "app/submit/page.tsx",
      sha256:
        "325073fd9aba0b9fd630a6f1604b0eff84ddd1033478fd244d8bce4884ae0519",
      git_blob: "025f7d8e4576b1a13117edf7d196a2b0abfdb50c",
      bytes: 32654,
      lines: 802,
      mode: "0644",
    },
  ],
  [
    "app/tool/[slug]/page.tsx",
    {
      path: "app/tool/[slug]/page.tsx",
      sha256:
        "92f4fe978a2e043363c1363945da9da65ba0bdf9a9b303c403fbc42755a3f395",
      git_blob: "4f1bcb9ef3660182a3592f2439e12a51d07fe8c7",
      bytes: 7225,
      lines: 296,
      mode: "0644",
    },
  ],
]);
const SURFACE_CONTRACTS = new Map([
  [
    "app/category/[slug]/page.tsx",
    {
      surface_kind: "DYNAMIC_CATEGORY_PAGE",
      url_pattern_or_special_role: "/category/[slug]",
      runtime_target_strategy:
        "DYNAMIC_CATEGORY_TARGET_REQUIRES_SEPARATE_RESOLUTION",
      future_authority_classes: [
        "INDIRECT_PRODUCTION_DATA_READ",
        "PUBLIC_DYNAMIC_TARGET_RESOLUTION",
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "DYNAMIC_TARGET_RESOLUTION_RECEIPT",
        "HTTP_RESPONSE_STATUS",
        "INDIRECT_PRODUCTION_DATA_READ_RECEIPT",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "RENDERED_PUBLIC_CONTENT",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "INDIRECT_DATA_READ_FAILED",
        "TARGET_RESOLUTION_FAILED",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/compare/page.tsx",
    {
      surface_kind: "FIXED_PUBLIC_PAGE",
      url_pattern_or_special_role: "/compare",
      runtime_target_strategy: "FIXED_PUBLIC_PATH",
      future_authority_classes: [
        "INDIRECT_PRODUCTION_DATA_READ",
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "HTTP_RESPONSE_STATUS",
        "INDIRECT_PRODUCTION_DATA_READ_RECEIPT",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "RENDERED_PUBLIC_CONTENT",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "INDIRECT_DATA_READ_FAILED",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/layout.tsx",
    {
      surface_kind: "ROOT_LAYOUT",
      url_pattern_or_special_role: "SHARED_ROOT_LAYOUT",
      runtime_target_strategy: "SHARED_LAYOUT_OBSERVED_THROUGH_PUBLIC_SURFACES",
      future_authority_classes: [
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "CANONICAL_METADATA",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "SHARED_LAYOUT_RENDERED",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "CANONICAL_METADATA_MISMATCH",
        "SHARED_LAYOUT_FAILURE",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/not-found.tsx",
    {
      surface_kind: "NOT_FOUND_PAGE",
      url_pattern_or_special_role: "UNRESOLVED_NOT_FOUND_PATH",
      runtime_target_strategy:
        "NOT_FOUND_RESPONSE_REQUIRES_SEPARATE_SYNTHETIC_PATH_AUTHORITY",
      future_authority_classes: [
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "HTTP_RESPONSE_STATUS",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "NOT_FOUND_RESPONSE_SEMANTICS",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "NOT_FOUND_SEMANTICS_MISMATCH",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/page.tsx",
    {
      surface_kind: "HOMEPAGE",
      url_pattern_or_special_role: "/",
      runtime_target_strategy: "FIXED_PUBLIC_PATH",
      future_authority_classes: [
        "INDIRECT_PRODUCTION_DATA_READ",
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "HTTP_RESPONSE_STATUS",
        "INDIRECT_PRODUCTION_DATA_READ_RECEIPT",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "RENDERED_PUBLIC_CONTENT",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "INDIRECT_DATA_READ_FAILED",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/submit/page.tsx",
    {
      surface_kind: "PUBLIC_FORM_PAGE",
      url_pattern_or_special_role: "/submit",
      runtime_target_strategy: "FIXED_PUBLIC_PATH_NON_MUTATING_ONLY",
      future_authority_classes: [
        "PUBLIC_FORM_NON_MUTATING_EVIDENCE",
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "FORM_RENDERED_WITHOUT_SUBMISSION",
        "HTTP_RESPONSE_STATUS",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "ZERO_MUTATION_ATTEMPTS",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "FORM_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "MUTATION_ATTEMPT_BLOCKED",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
  [
    "app/tool/[slug]/page.tsx",
    {
      surface_kind: "DYNAMIC_TOOL_PAGE",
      url_pattern_or_special_role: "/tool/[slug]",
      runtime_target_strategy:
        "DYNAMIC_TOOL_TARGET_REQUIRES_SEPARATE_RESOLUTION",
      future_authority_classes: [
        "INDIRECT_PRODUCTION_DATA_READ",
        "PUBLIC_DYNAMIC_TARGET_RESOLUTION",
        "PUBLIC_PRODUCTION_RUNTIME_BROWSER",
        "PUBLIC_PRODUCTION_RUNTIME_HTTP",
      ],
      evidence_requirements: [
        "BROWSER_RENDER_COMPLETION",
        "DYNAMIC_TARGET_RESOLUTION_RECEIPT",
        "HTTP_RESPONSE_STATUS",
        "INDIRECT_PRODUCTION_DATA_READ_RECEIPT",
        "NO_UNEXPECTED_RUNTIME_ERROR",
        "RENDERED_PUBLIC_CONTENT",
      ],
      failure_categories: [
        "BROWSER_RENDER_FAILURE",
        "HTTP_UNAVAILABLE",
        "INDIRECT_DATA_READ_FAILED",
        "TARGET_RESOLUTION_FAILED",
        "UNEXPECTED_RUNTIME_ERROR",
      ],
    },
  ],
]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const RESOLUTION_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
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

function exactObject(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    exactArray(Object.keys(value), keys)
  );
}

function exactValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function sortedUnique(values) {
  return (
    Array.isArray(values) &&
    values.every((value) => typeof value === "string") &&
    values.length === new Set(values).size &&
    exactArray(values, stableSortedPaths(values))
  );
}

function repositoryPath(absolute) {
  const relative = path.relative(repositoryRoot, absolute);
  assert(
    relative !== "" &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    "RUNTIME_PLAN_DEPENDENCY_GRAPH",
  );
  return relative.split(path.sep).join("/");
}

function resolvePlanningImport(fromPath, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    base = path.resolve(repositoryRoot, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = path.resolve(repositoryRoot, path.dirname(fromPath), specifier);
  } else {
    return null;
  }
  repositoryPath(base);
  const candidates = [
    base,
    ...RESOLUTION_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLUTION_EXTENSIONS.map((extension) =>
      path.join(base, `index${extension}`),
    ),
  ];
  for (const candidate of candidates) {
    try {
      const info = lstatSync(candidate);
      assert(!info.isSymbolicLink(), "RUNTIME_PLAN_DEPENDENCY_GRAPH");
      if (info.isFile()) return repositoryPath(candidate);
    } catch (caught) {
      if (caught instanceof GovernanceError) throw caught;
    }
  }
  fail("RUNTIME_PLAN_DEPENDENCY_GRAPH");
}

function importSpecifiers(repositoryPathValue) {
  if (!CODE_EXTENSIONS.has(path.extname(repositoryPathValue))) return [];
  const { sourceFile } = parseTypeScriptFile(repositoryPathValue);
  const specifiers = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === "require") ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return stableSortedPaths([...new Set(specifiers)]);
}

function localImportClosure(entryPath) {
  const visited = new Set();
  const pending = [entryPath];
  while (pending.length > 0) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    for (const specifier of importSpecifiers(current)) {
      const resolved = resolvePlanningImport(current, specifier);
      if (resolved !== null && !visited.has(resolved)) pending.push(resolved);
    }
  }
  return stableSortedPaths([...visited]);
}

function actualSourceIdentity(sourcePath) {
  const absolute = path.resolve(repositoryRoot, sourcePath);
  const info = lstatSync(absolute);
  assert(info.isFile() && !info.isSymbolicLink(), "RUNTIME_PLAN_SOURCE_IDENTITY");
  const bytes = readFileSync(absolute);
  const text = bytes.toString("utf8");
  const gitHeader = Buffer.from(`blob ${bytes.byteLength}\0`, "utf8");
  return {
    path: sourcePath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    git_blob: createHash("sha1").update(gitHeader).update(bytes).digest("hex"),
    bytes: bytes.byteLength,
    lines: (text.match(/\n/g) ?? []).length,
    mode: (statSync(absolute).mode & 0o777).toString(8).padStart(4, "0"),
  };
}

function directCapabilitySignals(sourcePath, closure) {
  const source = readFileSync(path.resolve(repositoryRoot, sourcePath), "utf8");
  const directImports = importSpecifiers(sourcePath);
  const directLocal = directImports
    .map((specifier) => resolvePlanningImport(sourcePath, specifier))
    .filter((value) => value !== null);
  const signals = [];
  if (/^\s*["']use client["'];/m.test(source)) signals.push("CLIENT_COMPONENT");
  if (sourcePath.includes("[")) signals.push("DYNAMIC_ROUTE_PARAMETER");
  if (/<form\b|\bonSubmit=/.test(source)) signals.push("FORM_SUBMISSION_SURFACE");
  if (/\bgenerateMetadata\b|\bmetadata\s*:/.test(source)) {
    signals.push("METADATA_GENERATION");
  }
  if (sourcePath === "app/layout.tsx") signals.push("ROOT_LAYOUT_BOUNDARY");
  if (sourcePath === "app/not-found.tsx") signals.push("NOT_FOUND_BOUNDARY");
  if (directImports.includes("next/navigation")) {
    signals.push("NEXT_NAVIGATION");
  }
  if (directLocal.some((entry) => entry.includes("public-diagnostics"))) {
    signals.push("PUBLIC_DIAGNOSTICS");
  }
  if (directLocal.some((entry) => entry.includes("public-persistence"))) {
    signals.push("PUBLIC_CLIENT_STORAGE");
  }
  if (
    directLocal.some(
      (entry) =>
        entry.includes("lib/supabase") || entry.includes("supabase-admin"),
    )
  ) {
    signals.push("SUPABASE_DATA_DEPENDENCY");
  }
  assert(closure.includes(sourcePath), "RUNTIME_PLAN_DEPENDENCY_GRAPH");
  return stableSortedPaths([...new Set(signals)]);
}

function transitiveCapabilitySignals(closure) {
  const sources = closure.map((repositoryPathValue) => {
    const extension = path.extname(repositoryPathValue);
    const source = CODE_EXTENSIONS.has(extension)
      ? readFileSync(path.resolve(repositoryRoot, repositoryPathValue), "utf8")
      : "";
    return { repositoryPathValue, source };
  });
  const signals = [];
  if (
    sources.some(
      ({ repositoryPathValue, source }) =>
        repositoryPathValue.includes("lib/supabase") ||
        repositoryPathValue.includes("supabase-admin") ||
        source.includes("@supabase/supabase-js"),
    )
  ) {
    signals.push("SUPABASE_DATA_DEPENDENCY");
  }
  if (
    sources.some(({ repositoryPathValue }) =>
      [
        "app/data/tools.ts",
        "lib/homepage-control-public.ts",
        "lib/public-tool-adapter.ts",
      ].includes(repositoryPathValue),
    )
  ) {
    signals.push("PUBLIC_DATA_ADAPTER_DEPENDENCY");
  }
  if (
    sources.some(({ repositoryPathValue }) =>
      repositoryPathValue.includes("public-diagnostics"),
    )
  ) {
    signals.push("PUBLIC_DIAGNOSTICS_DEPENDENCY");
  }
  if (
    sources.some(({ repositoryPathValue, source }) =>
      repositoryPathValue.includes("public-persistence") ||
      source.includes("localStorage"),
    )
  ) {
    signals.push("CLIENT_STORAGE_DEPENDENCY");
  }
  if (
    sources.some(({ source }) =>
      /["']use client["'];/.test(source),
    )
  ) {
    signals.push("CLIENT_RENDERING_DEPENDENCY");
  }
  if (
    sources.some(({ source }) =>
      /\/api\/(?:submit-tool|upload-logo)|method\s*:\s*["']POST["']/.test(
        source,
      ),
    )
  ) {
    signals.push("FORM_MUTATION_CODE_PRESENT");
  }
  return stableSortedPaths([...new Set(signals)]);
}

function readPlan() {
  assert(process.argv.length <= 3, "RUNTIME_PLAN_DECISION");
  const supplied = process.argv[2];
  if (supplied === undefined) {
    try {
      return readStrictJson(PLAN_PATH);
    } catch (caught) {
      if (
        caught instanceof GovernanceError &&
        caught.stage === "REGULAR_FILE_ABSENT"
      ) {
        fail("PUBLIC_PRODUCTION_RUNTIME_PLANNING_MANIFEST_ABSENT");
      }
      throw caught;
    }
  }
  const absolute = path.resolve(supplied);
  let info;
  try {
    info = lstatSync(absolute);
  } catch {
    fail("PUBLIC_PRODUCTION_RUNTIME_PLANNING_MANIFEST_ABSENT");
  }
  assert(
    info.isFile() &&
      !info.isSymbolicLink() &&
      [0o600, 0o644].includes(info.mode & 0o777),
    "RUNTIME_PLAN_SOURCE_IDENTITY",
  );
  return strictJsonParse(readFileSync(absolute, "utf8"));
}

function validateSourceMatrix() {
  const actual = actualSourceIdentity(SOURCE_MATRIX.path);
  for (const key of SOURCE_IDENTITY_KEYS) {
    assert(
      actual[key] === SOURCE_MATRIX[key],
      "RUNTIME_PLAN_SOURCE_IDENTITY",
    );
  }
  const matrix = readStrictJson(SOURCE_MATRIX.path);
  assert(
    matrix.route_inventory_digest === SOURCE_MATRIX.route_inventory_digest &&
      matrix.entries.length === SOURCE_MATRIX.entry_count &&
      matrix.entries.filter((entry) => entry.launch_blocking === true).length ===
        SOURCE_MATRIX.launch_blocking_count,
    "RUNTIME_PLAN_SOURCE_IDENTITY",
  );
}

function validatePlan() {
  const plan = readPlan();
  validateSourceMatrix();
  assert(exactObject(plan, TOP_LEVEL_KEYS), "RUNTIME_PLAN_VERSION");
  assert(plan.planning_version === 1, "RUNTIME_PLAN_VERSION");
  assert(plan.source_commit === SOURCE_COMMIT, "RUNTIME_PLAN_SOURCE_IDENTITY");
  assert(
    exactObject(plan.source_registry, SOURCE_IDENTITY_KEYS) &&
      exactValue(plan.source_registry, SOURCE_REGISTRY),
    "RUNTIME_PLAN_SOURCE_IDENTITY",
  );
  assert(
    exactObject(plan.source_matrix, SOURCE_MATRIX_KEYS) &&
      exactValue(plan.source_matrix, SOURCE_MATRIX),
    "RUNTIME_PLAN_SOURCE_IDENTITY",
  );
  assert(exactObject(plan.workstream, WORKSTREAM_KEYS), "RUNTIME_PLAN_DECISION");
  assert(
    exactValue(plan.workstream, {
      id: "PUBLIC_PRODUCTION_RUNTIME",
      gap_code: "SYNTHETIC_BROWSER_PASSED_PRODUCTION_RUNTIME_UNVERIFIED",
      entry_count: 7,
    }),
    "RUNTIME_PLAN_DECISION",
  );
  assert(
    plan.decision === "STATIC_PLANNING_COMPLETE_EXECUTION_UNAUTHORIZED" &&
      plan.current_authority === "STATIC_ONLY",
    "RUNTIME_PLAN_DECISION",
  );
  assert(
    plan.execution_authorized === false,
    "RUNTIME_PLAN_EXECUTION_AUTHORITY",
  );
  assert(
    plan.live_evidence_status === "NOT_EXECUTED",
    "RUNTIME_PLAN_EVIDENCE_PROMOTION",
  );
  assert(plan.target_origin === null, "RUNTIME_PLAN_TARGET_ORIGIN");
  assert(
    plan.target_origin_resolution === "NOT_PERFORMED",
    "RUNTIME_PLAN_TARGET_ORIGIN",
  );
  assert(
    exactArray(plan.blocked_capabilities, BLOCKED_CAPABILITIES),
    "RUNTIME_PLAN_BLOCKED_CAPABILITIES",
  );
  assert(
    exactArray(plan.future_authority_classes, FUTURE_AUTHORITY_CLASSES),
    "RUNTIME_PLAN_FUTURE_AUTHORITY",
  );
  assert(
    plan.next_gate ===
      "SEPARATE_RUNTIME_AUTHORITY_REVIEW_PUBLIC_PRODUCTION_RUNTIME",
    "RUNTIME_PLAN_DECISION",
  );
  const rawPlan = readFileSync(
    process.argv[2] === undefined
      ? path.resolve(repositoryRoot, PLAN_PATH)
      : path.resolve(process.argv[2]),
    "utf8",
  );
  assert(
    !/https?:\/\/|process\.env|BEGIN PRIVATE KEY|\.supabase\.(?:co|com)/i.test(
      rawPlan,
    ),
    "RUNTIME_PLAN_TARGET_ORIGIN",
  );
  const expectedPaths = stableSortedPaths([...SURFACE_CONTRACTS.keys()]);
  assert(
    Array.isArray(plan.surfaces) &&
      plan.surfaces.length === expectedPaths.length &&
      exactArray(
        plan.surfaces.map((surface) => surface.source_path),
        expectedPaths,
      ),
    "RUNTIME_PLAN_SURFACE_PARTITION",
  );
  for (const surface of plan.surfaces) {
    assert(
      exactObject(surface, SURFACE_KEYS),
      "RUNTIME_PLAN_SURFACE_PARTITION",
    );
    const contract = SURFACE_CONTRACTS.get(surface.source_path);
    assert(contract !== undefined, "RUNTIME_PLAN_SURFACE_PARTITION");
    assert(
      surface.surface_kind === contract.surface_kind &&
        surface.url_pattern_or_special_role ===
          contract.url_pattern_or_special_role,
      "RUNTIME_PLAN_SURFACE_PARTITION",
    );
    const expectedIdentity = SOURCE_IDENTITIES.get(surface.source_path);
    assert(
      exactObject(surface.source_identity, SOURCE_IDENTITY_KEYS) &&
        exactValue(surface.source_identity, expectedIdentity) &&
        exactValue(actualSourceIdentity(surface.source_path), expectedIdentity),
      "RUNTIME_PLAN_SOURCE_IDENTITY",
    );
    const closure = localImportClosure(surface.source_path);
    assert(
      sortedUnique(surface.local_import_closure) &&
        compareExactPathSets(surface.local_import_closure, closure).equal,
      "RUNTIME_PLAN_DEPENDENCY_GRAPH",
    );
    assert(
      sortedUnique(surface.direct_capability_signals) &&
        exactArray(
          surface.direct_capability_signals,
          directCapabilitySignals(surface.source_path, closure),
        ) &&
        sortedUnique(surface.transitive_capability_signals) &&
        exactArray(
          surface.transitive_capability_signals,
          transitiveCapabilitySignals(closure),
        ),
      "RUNTIME_PLAN_CAPABILITY_SIGNALS",
    );
    assert(
      surface.runtime_target_strategy === contract.runtime_target_strategy,
      "RUNTIME_PLAN_TARGET_STRATEGY",
    );
    assert(
      sortedUnique(surface.future_authority_classes) &&
        exactArray(
          surface.future_authority_classes,
          contract.future_authority_classes,
        ),
      "RUNTIME_PLAN_FUTURE_AUTHORITY",
    );
    assert(
      sortedUnique(surface.evidence_requirements) &&
        exactArray(
          surface.evidence_requirements,
          contract.evidence_requirements,
        ) &&
        sortedUnique(surface.failure_categories) &&
        exactArray(surface.failure_categories, contract.failure_categories),
      "RUNTIME_PLAN_DECISION",
    );
    assert(
      surface.mutation_prohibited === true &&
        surface.execution_authorized === false,
      "RUNTIME_PLAN_EXECUTION_AUTHORITY",
    );
    assert(
      surface.live_evidence_status === "NOT_EXECUTED",
      "RUNTIME_PLAN_EVIDENCE_PROMOTION",
    );
  }
  return {
    entries: plan.surfaces.length,
    importGraphs: plan.surfaces.filter(
      (surface) => surface.local_import_closure.length > 0,
    ).length,
  };
}

try {
  const result = validatePlan();
  console.log(
    `PASS_PUBLIC_PRODUCTION_RUNTIME_PLANNING entries=${result.entries} import_graphs=${result.importGraphs} execution_authorized=false live_evidence=NOT_EXECUTED failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (caught instanceof GovernanceError) {
    categoricalFailure(caught.stage);
    console.log(
      "FAIL_PUBLIC_PRODUCTION_RUNTIME_PLANNING failures=1 internal_failures=0",
    );
  } else {
    console.log("INTERNAL_FAIL_PUBLIC_PRODUCTION_RUNTIME_PLANNING");
    console.log(
      "FAIL_PUBLIC_PRODUCTION_RUNTIME_PLANNING failures=0 internal_failures=1",
    );
  }
  process.exitCode = 1;
}
