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
const RUNTIME_EVIDENCE_PATH =
  "testing/public-production-runtime-evidence.json";
const SOURCE_COMMIT = "7c369726fa5a4092b056d91f14ca6a61effef151";
const SOURCE_REGISTRY = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/public-launch-blocker-registry.json",
  sha256: "6722c6605ff63076d0fddf39b1a46b3d5bc2845d841729be374039cdf2eb259a",
  git_blob: "8c58a34e4697a2264b6142343605f95b63073b70",
  bytes: 9780,
  lines: 272,
  mode: "0644",
};
const SOURCE_MATRIX = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/readiness-coverage-matrix.json",
  sha256: "5b20505312059376144fdfa0fa0f3a5ae3dbdddfca48bd1ba5bce74da6a6c240",
  git_blob: "2bc2d245ed2d01f496fc23f9b35a0ba844e400ec",
  bytes: 37616,
  lines: 978,
  mode: "0644",
  route_inventory_digest:
    "2ab892934273cef903d720dfcb7cdd351711eb2969a02e36f5b2a714e496b726",
  entry_count: 69,
  launch_blocking_count: 69,
};
const RUNTIME_EVIDENCE_IDENTITY = {
  path: RUNTIME_EVIDENCE_PATH,
  sha256: "dc9eb9878caf6a055ea7859ac2def9653161e82231e236fd5de0b6195ebd5c20",
  git_blob: "40d8e9e9d7235f7299092e9a0f3ccef9b7d0e387",
  bytes: 12315,
  lines: 335,
  mode: "0644",
};
const EXACT_SUCCESS_MARKER =
  "PASSED_PHASE_31AQ_31BP_TERMINAL_GUARD_REASON_VECTOR_AND_CDP_TAXONOMY_HARDENING_FINAL_SEVEN_SURFACE_RUNTIME_QUALIFICATION_READY_FOR_STATIC_EVIDENCE_INTEGRATION_AND_LAUNCH_READINESS_DECISION";
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
  "selected_canonical_origin",
  "last_runtime_result",
  "last_runtime_failure_code",
  "last_runtime_failure_message_sha256",
  "canonical_source_alignment",
  "runtime_evidence",
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
const SOURCE_BINDING_KEYS = ["binding_role", ...SOURCE_IDENTITY_KEYS];
const SOURCE_MATRIX_KEYS = [
  ...SOURCE_BINDING_KEYS,
  "route_inventory_digest",
  "entry_count",
  "launch_blocking_count",
];
const RUNTIME_EVIDENCE_MAJOR_KEYS = [
  "schema_version",
  "source_phase",
  "source_ccr",
  "controlling_package",
  "canonical_result",
  "source_reporting_defects",
  "immutable_binding",
  "runtime_contract",
  "public_data_contract",
  "terminal_contract",
  "private_harness_contract",
  "process_exit_contract",
  "safety_boundary",
  "integration_decision",
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
        "0b70d304cf324dc75c9b40d6e3d4c82f652d62db1f636f3195e7d8ce9c277bf7",
      git_blob: "5312bb78580caf37b7f043c66db28392bb7069c3",
      bytes: 9215,
      lines: 328,
      mode: "0644",
    },
  ],
  [
    "app/compare/page.tsx",
    {
      path: "app/compare/page.tsx",
      sha256:
        "51e2420b6a3dd358a060cad89f7de695d161687b5ee45fac04a95226d2950cab",
      git_blob: "b306ee21a7a7366d148af0be512b566d30e3b9e9",
      bytes: 3945,
      lines: 153,
      mode: "0644",
    },
  ],
  [
    "app/layout.tsx",
    {
      path: "app/layout.tsx",
      sha256:
        "7f17dbd43421293902651132faf22e57cb4e8d526d736e76f2e0d93ce92a3f4d",
      git_blob: "d1aa14c6399d10f60471b39334571a8e47f4185a",
      bytes: 3437,
      lines: 125,
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
        "d809c057bcca31d2426cf08c6bb63d7f65cf73358d8dffbf17e667c4834d275d",
      git_blob: "fe66392d3f5ba1cb04a289b1700016550400dcda",
      bytes: 7329,
      lines: 295,
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

function validateRuntimeEvidence() {
  const evidence = readStrictJson(RUNTIME_EVIDENCE_PATH);
  assert(
    exactObject(evidence, RUNTIME_EVIDENCE_MAJOR_KEYS),
    "RUNTIME_EVIDENCE_SCHEMA",
  );
  assert(
    exactValue(actualSourceIdentity(RUNTIME_EVIDENCE_PATH), RUNTIME_EVIDENCE_IDENTITY),
    "RUNTIME_EVIDENCE_IDENTITY",
  );
  assert(
    evidence.schema_version === 1 &&
      evidence.source_phase.startsWith("PHASE_31AQ_31BP_"),
    "RUNTIME_EVIDENCE_SCHEMA",
  );
  assert(
    exactValue(evidence.source_ccr, {
      reference: "EXTERNAL_PHASE_31AQ_31BP_CCR",
      sha256:
        "ca12bad25b89c161ca9e44f9776b7a9803231bd2dcae14539739cba5dd3c6874",
      bytes: 71384,
      lines: 1936,
      mode: "0600",
    }) &&
      exactValue(evidence.controlling_package, {
        reference: "EXTERNAL_PHASE_31AQ_31BP_CONTROLLING_PACKAGE",
        sha256:
          "62805fc50fd42bb33ea37521f12cb90d84f9767d1d4704a0699e54b2e85d29f1",
        bytes: 29498,
        lines: 729,
        mode: "0600",
      }),
    "RUNTIME_EVIDENCE_SOURCE_BINDING",
  );
  assert(
    evidence.canonical_result === EXACT_SUCCESS_MARKER,
    "RUNTIME_EVIDENCE_CANONICAL_RESULT",
  );
  const defects = evidence.source_reporting_defects;
  assert(
    defects.top_level_classification_alias.observed !== EXACT_SUCCESS_MARKER &&
      defects.top_level_classification_alias.canonical === EXACT_SUCCESS_MARKER &&
      defects.top_level_classification_alias.reconciliation_source ===
        "CONTROLLING_PACKAGE_AND_EXACT_SUCCESS_MARKER" &&
      defects.unresolved_remote_bindings.observed_deployment_binding ===
        "undefined" &&
      defects.unresolved_remote_bindings.observed_public_data_origin_binding ===
        "undefined" &&
      defects.unresolved_remote_bindings.reconciled_deployment_id ===
        "dpl_48RE7rYPfwJCK1ZKzpJ2eZoksMor" &&
      defects.unresolved_remote_bindings
        .reconciled_public_data_origin_sha256 ===
        "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777",
    "RUNTIME_EVIDENCE_SOURCE_RECONCILIATION",
  );
  const binding = evidence.immutable_binding;
  assert(
    binding.repository_commit === SOURCE_COMMIT &&
      binding.repository_tree ===
        "a6a3a1057355d61445ded239250ef7f7597bf077" &&
      binding.canonical_origin === "https://www.aifinder.to" &&
      binding.public_data_origin_sha256 ===
        "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777" &&
      binding.source_deployment_id === "dpl_48RE7rYPfwJCK1ZKzpJ2eZoksMor" &&
      binding.source_github_run_id === 30184205732 &&
      binding.authorization_state ===
        "CONSUMED_EXACTLY_ONCE_SPENT_NON_REUSABLE",
    "RUNTIME_EVIDENCE_IMMUTABLE_BINDING",
  );
  assert(
    binding.execution_gate.state === "CLOSED" &&
      binding.execution_gate.use_state === "SPENT" &&
      binding.execution_gate.result === "PASS" &&
      binding.execution_receipt.state === "SUCCESS" &&
      binding.execution_receipt.use_state === "SPENT" &&
      binding.execution_receipt.result === "PASS" &&
      binding.runner_checkpoint.state === "SUCCESS" &&
      binding.runner_checkpoint.stage === "COMPLETED" &&
      binding.runner_checkpoint.use_state === "SPENT" &&
      binding.runner_checkpoint.result === "PASS",
    "RUNTIME_EVIDENCE_FINALIZATION_STATE",
  );
  const runtime = evidence.runtime_contract;
  const expectedSurfaces = stableSortedPaths([...SURFACE_CONTRACTS.keys()]);
  assert(
    exactArray(runtime.surfaces, expectedSurfaces) &&
      runtime.surface_count === 7 &&
      runtime.target_count === 6 &&
      runtime.http.transactions === 6 &&
      runtime.http.status_200 === 5 &&
      runtime.http.status_404 === 1 &&
      runtime.http.status_5xx === 0 &&
      runtime.browser.desktop_passed === 6 &&
      runtime.browser.mobile_passed === 6 &&
      runtime.root_layout_passed === 12 &&
      runtime.submit_render_only_passed === 2 &&
      runtime.repository_unchanged === true,
    "RUNTIME_EVIDENCE_SURFACES",
  );
  const publicData = evidence.public_data_contract;
  assert(
    publicData.intent_count === 2 &&
      publicData.preflight_count === 2 &&
      publicData.preflight_before_get_observed_count === 2 &&
      publicData.get_count === 2 &&
      publicData.allowed_count === 2 &&
      publicData.completed_count === 2 &&
      publicData.failed_count === 0 &&
      publicData.rejected_preflight_count === 0 &&
      publicData.duplicate_or_replayed_accept_count === 0 &&
      publicData.unsafe_header_rejection_count === 0 &&
      publicData.context_terminal_intent_sum === 2 &&
      publicData.scope_relationship_valid === true,
    "RUNTIME_EVIDENCE_PUBLIC_DATA_COUNTS",
  );
  const terminal = evidence.terminal_contract;
  assert(
    terminal.predicate_passed === 20 &&
      terminal.predicate_total === 20 &&
      terminal.predicate_failed === 0 &&
      terminal.taxonomy_mutually_exclusive === true &&
      terminal.cross_channel_disagreement_count === 0 &&
      terminal.unresolved_terminal_count === 0 &&
      terminal.duplicate_terminal_count === 0 &&
      terminal.cleanup_late_terminal_count === 0,
    "RUNTIME_EVIDENCE_TERMINAL_CONTRACT",
  );
  assert(
    evidence.private_harness_contract.classification ===
      "FROZEN_EXACT_SIX_BYTE_IDENTICAL" &&
      evidence.private_harness_contract.files.length === 6 &&
      evidence.private_harness_contract.runtime_artifacts.length === 4 &&
      evidence.private_harness_contract.focused_finalization_test.result ===
        "PASS" &&
      evidence.private_harness_contract.focused_finalization_test.tests === 1 &&
      evidence.private_harness_contract.focused_finalization_test.failed === 0,
    "RUNTIME_EVIDENCE_PRIVATE_HARNESS",
  );
  const processExit = evidence.process_exit_contract;
  assert(
    processExit.source_observed_exit_code === 1 &&
      processExit.source_stdout.success_marker_exact === true &&
      processExit.source_stderr.empty === true &&
      Object.values(processExit.authoritative_atomic_success_state).every(
        (value) => value === true,
      ) &&
      processExit.offline_regression.result === "PASS" &&
      processExit.offline_regression.classification ===
        "EXTERNAL_EXEC_TOOL_STATUS_CAPTURE_ANOMALY_CONFIRMED" &&
      processExit.offline_regression.private_harness_repair_required === false &&
      processExit.offline_regression.success_child_exit_code === 0 &&
      processExit.offline_regression.success_marker_exact === true &&
      processExit.offline_regression.controlled_failure_child_exit_code === 1 &&
      processExit.offline_regression
        .controlled_failure_success_marker_absent === true,
    "RUNTIME_EVIDENCE_PROCESS_EXIT",
  );
  assert(
    Object.values(evidence.safety_boundary).every((value) => value === 0),
    "RUNTIME_EVIDENCE_SAFETY_BOUNDARY",
  );
  assert(
    exactValue(evidence.integration_decision, {
      static_evidence_integration_recommendation: "GO",
      public_production_runtime_workstream: "EVIDENCE_COMPLETE",
      public_launch_decision:
        "NO_GO_PENDING_REMAINING_WORKSTREAMS_AND_FINAL_LAUNCH_GATE",
      next_gate: "SEPARATE_PLANNING_REVIEW_PUBLIC_BROWSER_OR_LIVE_RUNTIME",
    }),
    "RUNTIME_EVIDENCE_DECISION",
  );
}

function validatePlan() {
  const plan = readPlan();
  validateRuntimeEvidence();
  assert(exactObject(plan, TOP_LEVEL_KEYS), "RUNTIME_PLAN_VERSION");
  assert(plan.planning_version === 1, "RUNTIME_PLAN_VERSION");
  assert(plan.source_commit === SOURCE_COMMIT, "RUNTIME_PLAN_SOURCE_IDENTITY");
  assert(
    exactObject(plan.source_registry, SOURCE_BINDING_KEYS) &&
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
      gap_code: "RUNTIME_EVIDENCE_INTEGRATED",
      entry_count: 7,
    }),
    "RUNTIME_PLAN_DECISION",
  );
  assert(
    plan.decision ===
      "FINAL_READ_ONLY_RUNTIME_QUALIFICATION_EVIDENCE_INTEGRATED" &&
      plan.current_authority === "STATIC_ONLY",
    "RUNTIME_PLAN_DECISION",
  );
  assert(
    plan.execution_authorized === false,
    "RUNTIME_PLAN_EXECUTION_AUTHORITY",
  );
  assert(
    plan.live_evidence_status ===
      "PASSED_FINAL_READ_ONLY_RUNTIME_QUALIFICATION",
    "RUNTIME_PLAN_EVIDENCE_PROMOTION",
  );
  assert(
    plan.target_origin === "https://www.aifinder.to",
    "RUNTIME_PLAN_TARGET_ORIGIN",
  );
  assert(
    plan.target_origin_resolution === "CONFIRMED_FINAL_PUBLIC_RUNTIME_QUALIFICATION",
    "RUNTIME_PLAN_TARGET_ORIGIN",
  );
  assert(
    plan.selected_canonical_origin === "https://www.aifinder.to" &&
      plan.last_runtime_result === EXACT_SUCCESS_MARKER &&
      plan.last_runtime_failure_code === null &&
      plan.last_runtime_failure_message_sha256 === null &&
      plan.canonical_source_alignment === "COMPLETE",
    "RUNTIME_PLAN_TARGET_ORIGIN",
  );
  assert(
    exactObject(plan.runtime_evidence, SOURCE_IDENTITY_KEYS) &&
      exactValue(plan.runtime_evidence, RUNTIME_EVIDENCE_IDENTITY),
    "RUNTIME_PLAN_EVIDENCE_PROMOTION",
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
      "SEPARATE_PLANNING_REVIEW_PUBLIC_BROWSER_OR_LIVE_RUNTIME",
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
      rawPlan.split("https://www.aifinder.to").join(""),
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
      surface.live_evidence_status ===
        "PASSED_FINAL_READ_ONLY_RUNTIME_QUALIFICATION",
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
    `PASS_PUBLIC_PRODUCTION_RUNTIME_PLANNING entries=${result.entries} import_graphs=${result.importGraphs} execution_authorized=false live_evidence=PASSED_FINAL_READ_ONLY_RUNTIME_QUALIFICATION failures=0 internal_failures=0`,
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
