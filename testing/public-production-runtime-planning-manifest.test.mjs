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
const BROWSER_LIVE_PLAN_PATH =
  "testing/public-browser-live-runtime-planning-manifest.json";
const BROWSER_LIVE_EVIDENCE_PATH =
  "testing/public-browser-live-runtime-evidence.json";
const PUBLIC_LIVE_ROUTE_PLAN_PATH =
  "testing/public-live-route-runtime-planning-manifest.json";
const PUBLIC_LIVE_ROUTE_EVIDENCE_PATH =
  "testing/public-live-route-runtime-evidence.json";
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
const BROWSER_LIVE_SOURCE_PHASE =
  "PHASE_31CU_31FN_CONSOLIDATED_EXACT_13_SURFACE_PUBLIC_BROWSER_OR_LIVE_RUNTIME_ERROR_LOADING_LAYOUT_MANIFEST_ROBOTS_SITEMAP_OPENGRAPH_TWITTER_ASSURANCE_EXACT_COMMITTED_SHADOW_SYNTHETIC_FAULT_INJECTION_COMPLETE_HISTORICAL_SIMULATOR_AND_BOUNDED_MAXIMUM_TWO_ATTEMPT_PUBLIC_METADATA_BROWSER_SESSION";
const BROWSER_LIVE_SUCCESS_MARKER =
  "PASSED_PHASE_31CU_31FN_EXACT_13_SURFACE_PUBLIC_BROWSER_OR_LIVE_RUNTIME_ASSURANCE_READY_FOR_STATIC_EVIDENCE_INTEGRATION";
const BROWSER_LIVE_EVIDENCE_KEYS = [
  "schema_version",
  "source_phase",
  "source_reporting_notes",
  "source_ccr",
  "controlling_package",
  "canonical_result",
  "authorization_session",
  "immutable_binding",
  "exact_surface_contract",
  "import_closure_contract",
  "committed_shadow_contract",
  "public_attempt_contract",
  "metadata_contract",
  "accessibility_responsive_contract",
  "simulator_mutation_review",
  "source_artifacts",
  "safety_boundary",
  "integration_decision",
];
const BROWSER_LIVE_PLAN_KEYS = [
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
  "last_runtime_result",
  "canonical_source_alignment",
  "runtime_evidence",
  "blocked_capabilities",
  "surfaces",
  "next_gate",
];
const BROWSER_LIVE_SURFACE_KEYS = [
  "source_path",
  "source_role",
  "source_identity",
  "evidence_mode",
  "required_evidence",
  "live_evidence_status",
  "mutation_prohibited",
  "execution_authorized",
];
const BROWSER_LIVE_SOURCE_ROLES = new Map([
  ["app/category/[slug]/error.tsx", "ERROR_CATEGORY"],
  ["app/compare/error.tsx", "ERROR_COMPARE"],
  ["app/error.tsx", "ERROR_ROOT"],
  ["app/global-error.tsx", "ERROR_GLOBAL"],
  ["app/loading.tsx", "LOADING"],
  ["app/manifest.ts", "METADATA_MANIFEST"],
  ["app/opengraph-image.tsx", "METADATA_OPENGRAPH_IMAGE"],
  ["app/robots.ts", "METADATA_ROBOTS"],
  ["app/sitemap.ts", "METADATA_SITEMAP"],
  ["app/submit/error.tsx", "ERROR_SUBMIT"],
  ["app/submit/layout.tsx", "LAYOUT_SUBMIT"],
  ["app/tool/[slug]/error.tsx", "ERROR_TOOL"],
  ["app/twitter-image.tsx", "METADATA_TWITTER_IMAGE"],
]);
const BROWSER_LIVE_IMPORT_PATHS = [
  "app/data/tools.ts",
  "components/public/public-route-error.tsx",
  "lib/public-canonical-origin.ts",
  "lib/public-diagnostics.ts",
  "lib/supabase-admin.ts",
  "lib/tool-categories.ts",
];
const BROWSER_LIVE_SOURCE_REGISTRY = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/public-launch-blocker-registry.json",
  sha256: "b145c551fb3c0b51dc5fd3f61c19f039c273cad2e3b6ce255159655bdd36f854",
  git_blob: "91df9efa96e117e47db90f28c212854df6e94f8e",
  bytes: 9754,
  lines: 272,
  mode: "0644",
};
const BROWSER_LIVE_SOURCE_MATRIX = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/readiness-coverage-matrix.json",
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
const PUBLIC_LIVE_ROUTE_SOURCE_PHASE =
  "PHASE_31KA_31LZ_CONSOLIDATED_EXACT_3_ROUTE_PUBLIC_LIVE_RUNTIME_QUALIFICATION_ONE_READ_ONLY_GET_TWO_PRE_PRIVILEGED_REJECTION_POSTS_SOURCE_BOUND_BRANCH_WITNESS_COMPLETE_SYNTHETIC_REQUALIFICATION_MUTATION_ASSURANCE_INDEPENDENT_REVIEW_BOUNDED_MAXIMUM_TWO_ATTEMPT_SESSION";
const PUBLIC_LIVE_ROUTE_SUCCESS_MARKER =
  "PASSED_PHASE_31KA_31LZ_EXACT_3_PUBLIC_LIVE_ROUTE_RUNTIME_QUALIFICATION_READY_FOR_STATIC_EVIDENCE_INTEGRATION";
const PUBLIC_LIVE_ROUTE_BRANCH_WITNESS =
  "25532a6e8a149b52b03b27cbccf33212af483772eb0314c973a70c69595c3cc7";
const PUBLIC_LIVE_ROUTE_EVIDENCE_KEYS = [
  "schema_version",
  "source_phase",
  "source_reporting_notes",
  "source_ccr",
  "controlling_package",
  "canonical_result",
  "authorization_session",
  "immutable_binding",
  "exact_route_contract",
  "branch_witness_contract",
  "private_requalification_contract",
  "public_attempt_contract",
  "data_operation_boundary",
  "source_artifacts",
  "safety_boundary",
  "integration_decision",
];
const PUBLIC_LIVE_ROUTE_PLAN_KEYS = [
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
  "last_runtime_result",
  "canonical_source_alignment",
  "runtime_evidence",
  "blocked_capabilities",
  "routes",
  "next_gate",
];
const PUBLIC_LIVE_ROUTE_SOURCE_IDENTITY_KEYS = [
  "path",
  "git_blob",
  "sha256",
  "bytes",
  "lines",
  "mode",
];
const PUBLIC_LIVE_ROUTE_EVIDENCE_ROUTE_KEYS = [
  "path",
  "runtime_role",
  "source_identity",
  "method",
  "status",
  "content_type_category",
  "response_bytes",
  "public_category",
  "errors",
  "warnings",
  "cache_no_store",
  "nosniff",
  "branch_witness_identity",
];
const PUBLIC_LIVE_ROUTE_REJECTION_EVIDENCE_ROUTE_KEYS = [
  "path",
  "runtime_role",
  "source_identity",
  "method",
  "status",
  "content_type_category",
  "response_bytes",
  "public_category",
  "cache_no_store",
  "nosniff",
  "branch_witness_identity",
];
const PUBLIC_LIVE_ROUTE_PLAN_ROUTE_KEYS = [
  "source_path",
  "runtime_role",
  "source_identity",
  "observed_method",
  "observed_status",
  "observed_category",
  "branch_witness_identity",
  "static_evidence",
  "runtime_evidence",
  "mutation_prohibited",
  "execution_authorized",
];
const PUBLIC_LIVE_ROUTE_SOURCE_REGISTRY = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/public-launch-blocker-registry.json",
  sha256: "571a15bd6dcf55faf90e60be84d04cc6c14b56c943a3d285104d6a2dc7ef6055",
  git_blob: "94645a12df49407fd1bd02fbbffc98af06c91f91",
  bytes: 10012,
  lines: 278,
  mode: "0644",
};
const PUBLIC_LIVE_ROUTE_SOURCE_MATRIX = {
  binding_role: "PRE_INTEGRATION_SOURCE_BINDING",
  path: "testing/readiness-coverage-matrix.json",
  sha256: "ed23a3d550d178780abdbaa3ae668de246587a9a13c31e9ccf59013ac77ccf6d",
  git_blob: "e62315dfcaacc20eb7260d83a7cd8289491f8f6b",
  bytes: 38588,
  lines: 1007,
  mode: "0644",
  route_inventory_digest:
    "40729ce2a17801c08cae008eb67eae3f297909f11a01e2685fb387a0bb7c2aab",
  entry_count: 69,
  launch_blocking_count: 49,
};
const PUBLIC_LIVE_ROUTE_SOURCE_IDENTITIES = [
  {
    path: "app/api/homepage-control/published/route.ts",
    git_blob: "29992ba9fbd88f65617573047eeb4a2b8f906a5a",
    sha256: "c7242b326a71eb54f14d72dc060f7d13709bafcb7cac753329cb42551dc05289",
    bytes: 983,
    lines: 34,
    mode: "0644",
  },
  {
    path: "app/api/submit-tool/route.ts",
    git_blob: "f3bcd74d5a2a7eba361486aedae06e7c806b1e93",
    sha256: "e296e8bc1f6aa32e2c5cadf4c5306aec9d91870cb98957574505668fa03b93d1",
    bytes: 8956,
    lines: 361,
    mode: "0644",
  },
  {
    path: "app/api/upload-logo/route.ts",
    git_blob: "5039bb86ff22aba50836e98676d079529ac6d093",
    sha256: "cfb3d3c7279120b1a094421ea11f36b54e93c6709993b8f7ed1d2d6c6556b274",
    bytes: 5901,
    lines: 232,
    mode: "0644",
  },
  {
    path: "lib/homepage-control-public.ts",
    git_blob: "29b741c29e22e85a3aaf4b48b78557481ef5aa5f",
    sha256: "9d6c1fa10f5fddec35376c40fd99991c096c924ca9dd11708b412883eaabbdd2",
    bytes: 7605,
    lines: 276,
    mode: "0644",
  },
  {
    path: "lib/public-live-route-safety.ts",
    git_blob: "002f8aa05ce033d050e0e196b0af82e3753999fc",
    sha256: "5dfe7542d377e90532869a3553a74a6a596bc72ccdb43cc78bc6ac05cf3b8680",
    bytes: 5832,
    lines: 241,
    mode: "0644",
  },
  {
    path: "testing/public-live-route-security-static-assertions.mjs",
    git_blob: "48f6e4ee05a1292b0ba6e06b95826db66414958f",
    sha256: "2d5409ddc565949a34f52e6e151f2be6bacaf34509a6c1981a686688d6e0eb12",
    bytes: 9619,
    lines: 336,
    mode: "0644",
  },
  {
    path: "testing/readiness-coverage-matrix.json",
    git_blob: "e62315dfcaacc20eb7260d83a7cd8289491f8f6b",
    sha256: "ed23a3d550d178780abdbaa3ae668de246587a9a13c31e9ccf59013ac77ccf6d",
    bytes: 38588,
    lines: 1007,
    mode: "0644",
  },
  {
    path: "testing/public-launch-blocker-registry.json",
    git_blob: "94645a12df49407fd1bd02fbbffc98af06c91f91",
    sha256: "571a15bd6dcf55faf90e60be84d04cc6c14b56c943a3d285104d6a2dc7ef6055",
    bytes: 10012,
    lines: 278,
    mode: "0644",
  },
  {
    path: "testing/static-test-safety-manifest.json",
    git_blob: "5e19833a7a933061f0209dfdd6fb77e073737b65",
    sha256: "47768a6c6f27bfd48fb4fe254b619f6563d13733af74ccd2ad86a98b7647e190",
    bytes: 28780,
    lines: 845,
    mode: "0644",
  },
];
const PUBLIC_LIVE_ROUTE_CONTRACTS = new Map([
  [
    "app/api/homepage-control/published/route.ts",
    {
      runtime_role: "READ_ONLY_PUBLIC_HOMEPAGE_CONTROL",
      method: "GET",
      status: 200,
      response_bytes: 703,
      public_category: "PUBLISHED_ACTIVE_OBJECT",
    },
  ],
  [
    "app/api/submit-tool/route.ts",
    {
      runtime_role: "PRE_PRIVILEGED_INVALID_SUBMISSION_REJECTION",
      method: "POST",
      status: 400,
      response_bytes: 31,
      public_category: "INVALID_SUBMISSION",
    },
  ],
  [
    "app/api/upload-logo/route.ts",
    {
      runtime_role: "PRE_PRIVILEGED_ONE_FILE_REQUIRED_REJECTION",
      method: "POST",
      status: 400,
      response_bytes: 45,
      public_category: "ONE_FILE_REQUIRED",
    },
  ],
]);
const PUBLIC_LIVE_ROUTE_SOURCE_ARTIFACTS = [
  ["01-preflight-source-deployment-and-session-budget.md", "38a631fc1e6a1d72862628065c7d218ad52b56c399b1b6b556ca59f8cf5ed42a", 2694, 57, "0600"],
  ["02-exact-three-route-source-and-branch-witness.json", "bca419e695659fa8cf14fb0068c3d0270537ed77d7c8ab7f0e97a121583851ee", 11512, 413, "0600"],
  ["03-private-shadow-and-complete-requalification.json", "ca561d5a4fda3165b47d374de25a18ae87263e7cd26d77c7de3a7f4db2b949bd", 13655, 360, "0600"],
  ["04-session-contract-mutations-and-independent-review.json", "a11f4ce0f653135989f7b1b4338c7c1712fb1252320b7ff8ce9b353b7c44a8f2", 6024, 149, "0600"],
  ["05-attempt-one-public-live-route-evidence.json", "4f9aabdcfb83f9c97f179b8dce61f546b548d8cadb0523afa60d6a34d6c0d56c", 5180, 158, "0600"],
  ["06-between-attempt-repair-and-final-attempt.json", "f5dedae9a63411d6f77390f4530df37184ab50be8b4a5f30bdd03fc774833b07", 646, 29, "0600"],
  ["07-final-three-route-static-integration-boundary.md", "4c8b47153f0b877d12a5712268f47e108bd1c711d8e4f69d1f71e626814da62f", 1441, 29, "0600"],
  ["08-preservation-topology-risk-and-next-action.md", "c988a9a7cfab74e991796246f1e9e7314bda6d392b1da8e89cf5135a765ba846", 2443, 57, "0600"],
];
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
    lines:
      text.length === 0
        ? 0
        : (text.match(/\n/g) ?? []).length + (text.endsWith("\n") ? 0 : 1),
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

function validateBrowserLiveEvidenceAndPlan() {
  const evidence = readStrictJson(BROWSER_LIVE_EVIDENCE_PATH);
  const plan = readStrictJson(BROWSER_LIVE_PLAN_PATH);
  assert(
    exactObject(evidence, BROWSER_LIVE_EVIDENCE_KEYS),
    "BROWSER_LIVE_EVIDENCE_SCHEMA",
  );
  assert(
    evidence.schema_version === 1 &&
      evidence.source_phase === BROWSER_LIVE_SOURCE_PHASE &&
      evidence.canonical_result === BROWSER_LIVE_SUCCESS_MARKER,
    "BROWSER_LIVE_EVIDENCE_SOURCE_RECONCILIATION",
  );
  assert(
    exactValue(evidence.source_reporting_notes, {
      source_phase_field_observed: "PHASE_31CU_31FN",
      canonical_phase_from_controlling_package: BROWSER_LIVE_SOURCE_PHASE,
      source_authorization_state_observed: "CONSUMED_EXACTLY_ONCE_COMPLETED",
      canonical_terminal_interpretation: "CLOSED_SUCCESS_NON_REUSABLE",
    }),
    "BROWSER_LIVE_EVIDENCE_SOURCE_RECONCILIATION",
  );
  assert(
    exactValue(evidence.source_ccr, {
      reference: "EXTERNAL_PHASE_31CU_31FN_CCR",
      sha256:
        "44a9999ec9f5990898d115b49867fb62ef8d9ed647fa3d6d46a464f00b01b784",
      bytes: 80537,
      lines: 1876,
      mode: "0600",
    }) &&
      exactValue(evidence.controlling_package, {
        reference: "EXTERNAL_PHASE_31CU_31FN_CONTROLLING_PACKAGE",
        sha256:
          "e59c4cb4f8ab33b711ea636d7c0a1d508cda3c12106d0c4d798ebd42cbb2d9f3",
        bytes: 24048,
        lines: 617,
        mode: "0600",
      }),
    "BROWSER_LIVE_EVIDENCE_SOURCE_BINDING",
  );
  assert(
    exactValue(evidence.authorization_session, {
      source_authorization_state: "CONSUMED_EXACTLY_ONCE_COMPLETED",
      terminal_state: "CLOSED_SUCCESS_NON_REUSABLE",
      attempts_authorized_maximum: 2,
      attempts_consumed: 1,
      attempt_1: "PASS",
      attempt_2: "UNUSED_AND_FORBIDDEN_AFTER_PASS",
    }),
    "BROWSER_LIVE_EVIDENCE_AUTHORIZATION_SESSION",
  );
  assert(
    exactValue(evidence.immutable_binding, {
      repository_commit: "e4f221246abc4acfcda2ddeae852a5c7cd5b8c16",
      repository_tree: "a36a3f461a51577be89e8eb764eb4e9d1e9baf6c",
      canonical_origin: "https://www.aifinder.to",
      github_run_id: 30437575033,
      github_run_attempt: 1,
      vercel_deployment_id: "dpl_9KfszMm4Q3eJ1d8swTW71BnsaUkY",
      vercel_state: "READY",
    }),
    "BROWSER_LIVE_EVIDENCE_IMMUTABLE_BINDING",
  );

  const expectedPaths = stableSortedPaths([...BROWSER_LIVE_SOURCE_ROLES.keys()]);
  const sources = evidence.exact_surface_contract?.sources;
  assert(
    evidence.exact_surface_contract?.exact_13_surface_qualification ===
      "13/13" &&
      evidence.exact_surface_contract?.surface_count === 13 &&
      Array.isArray(sources) &&
      sources.length === 13 &&
      exactArray(
        sources.map((source) => source.path),
        expectedPaths,
      ),
    "BROWSER_LIVE_EVIDENCE_SURFACE_PARTITION",
  );
  for (const source of sources) {
    assert(
      exactObject(source, [
        "path",
        "role",
        "classification",
        "git_blob",
        "sha256",
        "bytes",
        "lines",
        "mode",
      ]) &&
        source.role === BROWSER_LIVE_SOURCE_ROLES.get(source.path) &&
        typeof source.classification === "string" &&
        source.classification.length > 0,
      "BROWSER_LIVE_EVIDENCE_SOURCE_IDENTITY",
    );
    const actual = actualSourceIdentity(source.path);
    assert(
      source.sha256 === actual.sha256 &&
        source.git_blob === actual.git_blob &&
        source.bytes === actual.bytes &&
        source.lines === actual.lines &&
        source.mode === actual.mode,
      "BROWSER_LIVE_EVIDENCE_SOURCE_IDENTITY",
    );
  }

  const imports = evidence.import_closure_contract?.imports;
  assert(
    evidence.import_closure_contract?.import_count === 6 &&
      Array.isArray(imports) &&
      imports.length === 6 &&
      exactArray(
        imports.map((entry) => entry.path),
        BROWSER_LIVE_IMPORT_PATHS,
      ),
    "BROWSER_LIVE_EVIDENCE_IMPORT_CLOSURE",
  );
  for (const entry of imports) {
    assert(
      exactObject(entry, [
        "path",
        "git_blob",
        "sha256",
        "bytes",
        "mode",
      ]),
      "BROWSER_LIVE_EVIDENCE_IMPORT_CLOSURE",
    );
    const actual = actualSourceIdentity(entry.path);
    assert(
      entry.sha256 === actual.sha256 &&
        entry.git_blob === actual.git_blob &&
        entry.bytes === actual.bytes &&
        entry.mode === actual.mode,
      "BROWSER_LIVE_EVIDENCE_IMPORT_CLOSURE",
    );
  }

  const shadow = evidence.committed_shadow_contract;
  assert(
    shadow.error_boundaries === "24/24" &&
      shadow.loading_profiles === "4/4" &&
      shadow.submit_layout_profiles === "4/4" &&
      shadow.metadata_route_method_cases === "10/10" &&
      shadow.committed_shadow_cases === "42/42" &&
      shadow.sitemap_success_sha256 ===
        "cd98a0fb0fc99286e0434e27b9a8373377276dedefd45c2677bfb9eca2829378" &&
      shadow.sitemap_error_fallback_sha256 ===
        "e980dc23f33c46f7f1d507d4d1737169f6981bc3c540f0901df0438ca4d6370d" &&
      shadow.public_sitemap_requests === 0 &&
      shadow.real_supabase_requests === 0,
    "BROWSER_LIVE_EVIDENCE_SHADOW_COUNTS",
  );
  assert(
    exactValue(evidence.public_attempt_contract, {
      public_targets: "5/5",
      public_sitemap_requests: 0,
      public_result_sha256:
        "936cf13c4c6fcba14180e0cc5a81bf9a8537fc33f364831d4b081fd6fe04d883",
      completion_receipt_sha256:
        "183c4329932751066fe47a6b251597aeec467751063a922ab3b6e6d173add1b1",
      attempts_consumed: 1,
      attempt_2: "UNUSED_AND_FORBIDDEN_AFTER_PASS",
    }),
    "BROWSER_LIVE_EVIDENCE_PUBLIC_ATTEMPT",
  );
  assert(
    exactValue(evidence.metadata_contract, {
      manifest_sha256:
        "41de116438070705ea0473326a2a93680d37ff17da157a3962c33b99af00935d",
      robots_sha256:
        "d5b70e16f3c6c065323ca9036abcfd566d08bfdb09ba20dcbc6edd1ff5acbb43",
      opengraph_sha256:
        "1eb3ec54c35fee3d55f2ee59c5b6b19b0f2752081f301079167885190a25bf2d",
      twitter_sha256:
        "1eb3ec54c35fee3d55f2ee59c5b6b19b0f2752081f301079167885190a25bf2d",
      public_targets: "5/5",
      public_sitemap_requests: 0,
    }),
    "BROWSER_LIVE_EVIDENCE_METADATA",
  );
  assert(
    exactValue(evidence.accessibility_responsive_contract, {
      accessibility_critical_serious: "0/0",
      overflow_overlap_clipping: "0/0/0",
    }) &&
      exactValue(evidence.simulator_mutation_review, {
        historical_portfolio: "400/400",
        historical_contracts: "28/28",
        mutations: "240/240",
        independent_review: "0/0/0",
      }),
    "BROWSER_LIVE_EVIDENCE_REVIEW",
  );
  const expectedArtifacts = [
    ["01-preflight-workstream-and-session-budget.md", "471806e23ba8c4243690d4378c7899c27107b16e90117d490267413cfc5aa2fd", 1507, 46],
    ["02-exact-13-source-and-import-closure.json", "57adf72ab1285e30e9ed889c1a51bf9bb72f1d282961ae99f4e65bd6c14e3b16", 6895, 200],
    ["03-error-loading-layout-shadow-assurance.json", "d598465102ba8bf72c4fe2ce679ea25d5b893aeb5f76a3d2d437dbd100db2a61", 6644, 255],
    ["04-metadata-sitemap-and-image-shadow-assurance.json", "f01eb88d9a7b67bb7056caab9ec820aca5328aac0f3c8c0c974c87c5a2c85737", 5508, 175],
    ["05-complete-simulator-mutations-and-review.json", "a071234c2d55fdcb4ee4a09401f5772ea7f8f58fd662c36ab7722e2a7d150745", 20225, 671],
    ["06-attempt-one-public-metadata-browser-evidence.json", "d51bc0c04797af029d204a345143161286d3b46fc3a7083e34be8f77bba77a04", 3556, 108],
    ["07-between-attempt-repair-and-final-attempt.json", "9aeb723dfb1adc9b972c9a0883e3bab04a836eab526e5d3fb55892df79ad625f", 1105, 26],
    ["08-final-13-surface-static-integration-boundary.md", "999f4074362585b236e1b97d13d3e0b56a8c902c6c18482579fe0bee3eec1982", 1597, 34],
  ];
  assert(
    exactValue(
      evidence.source_artifacts.map((entry) => [
        entry.path,
        entry.sha256,
        entry.bytes,
        entry.lines,
      ]),
      expectedArtifacts,
    ) &&
      evidence.source_artifacts.every((entry) => entry.mode === "0600"),
    "BROWSER_LIVE_EVIDENCE_SOURCE_ARTIFACTS",
  );
  assert(
    evidence.safety_boundary.real_supabase_sql_database === "0/0/0" &&
      evidence.safety_boundary.repository_writes_stages_commits_pushes ===
        "0/0/0/0" &&
      Object.entries(evidence.safety_boundary)
        .filter(
          ([key]) =>
            ![
              "real_supabase_sql_database",
              "repository_writes_stages_commits_pushes",
            ].includes(key),
        )
        .every(([, value]) => value === 0),
    "BROWSER_LIVE_EVIDENCE_SAFETY_BOUNDARY",
  );
  assert(
    exactValue(evidence.integration_decision, {
      PUBLIC_BROWSER_OR_LIVE_RUNTIME_WORKSTREAM: "EVIDENCE_COMPLETE",
      STATIC_EVIDENCE_INTEGRATION_RECOMMENDATION: "GO",
      PUBLIC_LAUNCH_DECISION:
        "NO_GO_PENDING_REMAINING_WORKSTREAMS_AND_FINAL_LAUNCH_GATE",
    }),
    "BROWSER_LIVE_EVIDENCE_DECISION",
  );
  const rawEvidence = readFileSync(
    path.resolve(repositoryRoot, BROWSER_LIVE_EVIDENCE_PATH),
    "utf8",
  ).split("https://www.aifinder.to").join("");
  assert(
    !/https?:\/\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|process\.env/i.test(
      rawEvidence,
    ),
    "BROWSER_LIVE_EVIDENCE_SAFETY_BOUNDARY",
  );

  assert(
    exactObject(plan, BROWSER_LIVE_PLAN_KEYS) &&
      plan.planning_version === 1 &&
      plan.source_commit === "e4f221246abc4acfcda2ddeae852a5c7cd5b8c16",
    "BROWSER_LIVE_PLAN_SCHEMA",
  );
  assert(
    exactValue(plan.source_registry, BROWSER_LIVE_SOURCE_REGISTRY) &&
      exactValue(plan.source_matrix, BROWSER_LIVE_SOURCE_MATRIX),
    "BROWSER_LIVE_PLAN_SOURCE_BINDING",
  );
  assert(
    exactValue(plan.workstream, {
      id: "PUBLIC_BROWSER_OR_LIVE_RUNTIME",
      gap_code: "BROWSER_LIVE_EVIDENCE_INTEGRATED",
      entry_count: 13,
    }) &&
      plan.decision ===
        "FINAL_PUBLIC_BROWSER_OR_LIVE_RUNTIME_EVIDENCE_INTEGRATED" &&
      plan.current_authority === "STATIC_ONLY" &&
      plan.execution_authorized === false &&
      plan.live_evidence_status ===
        "PASSED_EXACT_13_SURFACE_PUBLIC_BROWSER_OR_LIVE_RUNTIME_ASSURANCE" &&
      plan.target_origin === "https://www.aifinder.to" &&
      plan.last_runtime_result === BROWSER_LIVE_SUCCESS_MARKER &&
      plan.canonical_source_alignment === "COMPLETE" &&
      plan.next_gate === "SEPARATE_PLANNING_REVIEW_PUBLIC_LIVE_ROUTE_RUNTIME",
    "BROWSER_LIVE_PLAN_DECISION",
  );
  assert(
    exactObject(plan.runtime_evidence, SOURCE_IDENTITY_KEYS) &&
      exactValue(
        plan.runtime_evidence,
        actualSourceIdentity(BROWSER_LIVE_EVIDENCE_PATH),
      ),
    "BROWSER_LIVE_PLAN_EVIDENCE_IDENTITY",
  );
  assert(
    exactArray(plan.blocked_capabilities, [
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
    ]),
    "BROWSER_LIVE_PLAN_BLOCKED_CAPABILITIES",
  );
  assert(
    Array.isArray(plan.surfaces) &&
      plan.surfaces.length === 13 &&
      exactArray(
        plan.surfaces.map((surface) => surface.source_path),
        expectedPaths,
      ),
    "BROWSER_LIVE_PLAN_SURFACE_PARTITION",
  );
  const evidenceByPath = new Map(sources.map((source) => [source.path, source]));
  for (const surface of plan.surfaces) {
    const source = evidenceByPath.get(surface.source_path);
    assert(
      exactObject(surface, BROWSER_LIVE_SURFACE_KEYS) &&
        source !== undefined &&
        surface.source_role === source.role &&
        surface.evidence_mode === source.classification &&
        sortedUnique(surface.required_evidence) &&
        surface.required_evidence.length >= 1 &&
        ["PASSED", "PASSED_SHADOW_ONLY_PUBLIC_REQUESTS_ZERO"].includes(
          surface.live_evidence_status,
        ) &&
        surface.mutation_prohibited === true &&
        surface.execution_authorized === false &&
        exactValue(surface.source_identity, actualSourceIdentity(surface.source_path)),
      "BROWSER_LIVE_PLAN_SURFACE_PARTITION",
    );
  }
  return { surfaces: plan.surfaces.length, imports: imports.length };
}

function validatePublicLiveRouteEvidenceAndPlan() {
  const evidence = readStrictJson(PUBLIC_LIVE_ROUTE_EVIDENCE_PATH);
  const plan = readStrictJson(PUBLIC_LIVE_ROUTE_PLAN_PATH);
  assert(
    exactObject(evidence, PUBLIC_LIVE_ROUTE_EVIDENCE_KEYS) &&
      evidence.schema_version === 1 &&
      evidence.source_phase === PUBLIC_LIVE_ROUTE_SOURCE_PHASE &&
      evidence.canonical_result === PUBLIC_LIVE_ROUTE_SUCCESS_MARKER,
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SCHEMA",
  );
  assert(
    exactValue(evidence.source_reporting_notes, {
      source_phase_field_observed: "31KA-31LZ",
      canonical_phase_from_controlling_package:
        PUBLIC_LIVE_ROUTE_SOURCE_PHASE,
      source_authorization_state_observed: "CONSUMED_EXACTLY_ONCE",
      canonical_terminal_state: "CLOSED_SUCCESS_NON_REUSABLE",
      historical_source_bytes_preserved: true,
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SOURCE_RECONCILIATION",
  );
  assert(
    exactValue(evidence.source_ccr, {
      reference: "EXTERNAL_PHASE_31KA_31LZ_CCR",
      sha256:
        "ca34fd27fcd4b302da360fb7e5c0633568743d4ca66217ed13f2439a654b35bd",
      bytes: 64245,
      lines: 1614,
      mode: "0600",
    }) &&
      exactValue(evidence.controlling_package, {
        reference: "EXTERNAL_PHASE_31KA_31LZ_CONTROLLING_PACKAGE",
        sha256:
          "558842e0dc47a71d4638f8b91f273cb0d7228193f2bcec0f57a59182a7a41d11",
        bytes: 24994,
        lines: 625,
        mode: "0600",
      }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SOURCE_BINDING",
  );
  assert(
    exactValue(evidence.authorization_session, {
      source_authorization_state_observed: "CONSUMED_EXACTLY_ONCE",
      canonical_terminal_state: "CLOSED_SUCCESS_NON_REUSABLE",
      attempts_consumed: 1,
      attempt_1: "PASS_TERMINAL_3_OF_3",
      attempt_2: "NOT_EXECUTED_PERMANENTLY_FORBIDDEN_AFTER_PASS",
      maximum_attempts: 2,
      public_requests: 3,
      session_closed: true,
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_AUTHORIZATION_SESSION",
  );

  const binding = evidence.immutable_binding;
  assert(
    exactObject(binding, [
      "repository_commit",
      "repository_tree",
      "repository_subject",
      "canonical_origin",
      "github_run_id",
      "vercel_deployment_id",
      "branch_witness_identity",
      "source_identities",
    ]) &&
      binding.repository_commit ===
        "7b50b5c173a7e26a27eb3ff3557c559049fd731c" &&
      binding.repository_tree ===
        "464bbece532b85ffbefd1c1bc8c948592a9d1461" &&
      binding.repository_subject === "Harden public live route boundaries" &&
      binding.canonical_origin === "https://www.aifinder.to" &&
      binding.github_run_id === 30510364231 &&
      binding.vercel_deployment_id === "dpl_FK867TsdKziEwvQ5pMufhD2KTrHk" &&
      binding.branch_witness_identity === PUBLIC_LIVE_ROUTE_BRANCH_WITNESS &&
      exactValue(
        binding.source_identities,
        PUBLIC_LIVE_ROUTE_SOURCE_IDENTITIES,
      ),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_IMMUTABLE_BINDING",
  );
  for (const expected of PUBLIC_LIVE_ROUTE_SOURCE_IDENTITIES.slice(0, 6)) {
    const actual = actualSourceIdentity(expected.path);
    assert(
      actual.path === expected.path &&
        actual.git_blob === expected.git_blob &&
        actual.sha256 === expected.sha256 &&
        actual.bytes === expected.bytes &&
        actual.lines === expected.lines &&
        actual.mode === expected.mode,
      "PUBLIC_LIVE_ROUTE_EVIDENCE_SOURCE_IDENTITY",
    );
  }

  const expectedRoutePaths = [
    "app/api/homepage-control/published/route.ts",
    "app/api/submit-tool/route.ts",
    "app/api/upload-logo/route.ts",
  ];
  const routes = evidence.exact_route_contract?.routes;
  assert(
    exactObject(evidence.exact_route_contract, [
      "route_count",
      "exact_route_qualification",
      "observed_methods",
      "routes",
    ]) &&
      evidence.exact_route_contract.route_count === 3 &&
      evidence.exact_route_contract.exact_route_qualification === "3/3" &&
      exactValue(evidence.exact_route_contract.observed_methods, {
        GET: 1,
        POST: 2,
        total: 3,
      }) &&
      Array.isArray(routes) &&
      routes.length === 3 &&
      exactArray(
        routes.map((route) => route.path),
        expectedRoutePaths,
      ),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_ROUTE_PARTITION",
  );
  const sourceIdentityByPath = new Map(
    PUBLIC_LIVE_ROUTE_SOURCE_IDENTITIES.map((identity) => [
      identity.path,
      identity,
    ]),
  );
  for (const route of routes) {
    const contract = PUBLIC_LIVE_ROUTE_CONTRACTS.get(route.path);
    const expectedIdentity = sourceIdentityByPath.get(route.path);
    const isHomepage =
      route.path === "app/api/homepage-control/published/route.ts";
    assert(
      exactObject(
        route,
        isHomepage
          ? PUBLIC_LIVE_ROUTE_EVIDENCE_ROUTE_KEYS
          : PUBLIC_LIVE_ROUTE_REJECTION_EVIDENCE_ROUTE_KEYS,
      ) &&
        contract !== undefined &&
        expectedIdentity !== undefined &&
        exactObject(
          route.source_identity,
          PUBLIC_LIVE_ROUTE_SOURCE_IDENTITY_KEYS,
        ) &&
        exactValue(route.source_identity, expectedIdentity) &&
        route.runtime_role === contract.runtime_role &&
        route.method === contract.method &&
        route.status === contract.status &&
        route.content_type_category === "APPLICATION_JSON" &&
        route.response_bytes === contract.response_bytes &&
        route.public_category === contract.public_category &&
        (!isHomepage || (route.errors === 0 && route.warnings === 0)) &&
        route.cache_no_store === true &&
        route.nosniff === true &&
        route.branch_witness_identity === PUBLIC_LIVE_ROUTE_BRANCH_WITNESS,
      "PUBLIC_LIVE_ROUTE_EVIDENCE_ROUTE_CONTRACT",
    );
  }

  assert(
    exactValue(evidence.branch_witness_contract, {
      identity: PUBLIC_LIVE_ROUTE_BRANCH_WITNESS,
      predicate_count: 55,
      false_predicate_ids: [],
      maximum_homepage_indirect_reads: 2,
      homepage_helper_mutation_calls: 0,
      submit_pre_create_client: true,
      upload_pre_storage: true,
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_BRANCH_WITNESS",
  );
  assert(
    exactValue(evidence.private_requalification_contract, {
      harness_contract: "100/100",
      private_route_shadow: "3/3",
      route_domain_matrix: "105/105",
      helper: "21/21",
      homepage: "18/18",
      submit: "36/36",
      upload: "30/30",
      static_readiness: "PASS",
      shadow_build: "PASS_31_OF_31",
      candidate_mutations: "83/83",
      governance_mutations: "14/14",
      predecessor_mutations: "97/97",
      current_session_mutations: "67/67",
      combined_mutations: "164/164",
      independent_review: "0/0/0",
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_PRIVATE_REQUALIFICATION",
  );
  assert(
    exactValue(evidence.public_attempt_contract, {
      attempts_consumed: 1,
      attempt_2: "UNUSED_AND_FORBIDDEN_AFTER_PASS",
      exact_route_qualification: "3/3",
      GET: 1,
      POST: 2,
      public_requests: 3,
      homepage_status: 200,
      homepage_response_bytes: 703,
      homepage_config_state: "PUBLISHED_ACTIVE_OBJECT",
      homepage_errors: 0,
      homepage_warnings: 0,
      submit_status: 400,
      submit_category: "INVALID_SUBMISSION",
      submit_response_bytes: 31,
      upload_status: 400,
      upload_category: "ONE_FILE_REQUIRED",
      upload_response_bytes: 45,
      no_store_nosniff: "3/3",
      set_cookie_redirect_query_auth_browser: "0/0/0/0/0",
      successful_submit_upload_real_file: "0/0/0",
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_PUBLIC_ATTEMPT",
  );
  assert(
    exactValue(evidence.data_operation_boundary, {
      observed_public_method_calls: {
        GET: 1,
        POST: 2,
        total: 3,
      },
      source_proven_pre_privileged_branches: {
        submit_privileged_branch_reached: false,
        upload_privileged_branch_reached: false,
      },
      authorized_indirect_read_only_route_behavior: {
        homepage_maximum_indirect_reads: 2,
        internal_database_call_counts_directly_observed: false,
      },
      direct_codex_data_operations: {
        supabase: 0,
        sql: 0,
        database: 0,
        storage: 0,
      },
      persistent_database_storage_mutations: {
        database: 0,
        storage: 0,
        evidence_basis: "SOURCE_BOUND_INFERENCE_NOT_DIRECT_INTERNAL_OBSERVATION",
      },
      ephemeral_rate_limit_increments: {
        observed: 2,
        minimum: 2,
        maximum: 2,
        evidence_basis: "SOURCE_BOUND_INFERENCE",
      },
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_DATA_OPERATION_BOUNDARY",
  );
  assert(
    Array.isArray(evidence.source_artifacts) &&
      evidence.source_artifacts.every((entry) =>
        exactObject(entry, ["path", "sha256", "bytes", "lines", "mode"]),
      ) &&
      exactValue(
        evidence.source_artifacts.map((entry) => [
          entry.path,
          entry.sha256,
          entry.bytes,
          entry.lines,
          entry.mode,
        ]),
        PUBLIC_LIVE_ROUTE_SOURCE_ARTIFACTS,
      ),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SOURCE_ARTIFACTS",
  );
  assert(
    exactObject(evidence.safety_boundary, [
      "source_repository_writes_stages_commits_pushes",
      "additional_public_runtime_observations",
      "additional_public_http_requests",
      "production_browser_runs",
      "real_environment_reads",
      "secret_reads",
      "raw_config_or_response_bodies_retained",
      "raw_urls_queries_or_operational_headers_retained",
      "cookies_sessions_credentials_or_field_values_retained",
      "production_upload_file_names_or_production_records_retained",
      "supabase_connector_calls",
      "real_supabase_requests",
      "sql_executions",
      "database_api_calls",
      "storage_api_calls",
      "authenticated_runtime_operations",
      "form_or_file_interactions",
      "direct_vercel_writes",
      "deployment_control_actions",
      "operational_reactivation_actions",
      "publishing_actions",
      "public_launch_actions",
    ]) &&
      evidence.safety_boundary
        .source_repository_writes_stages_commits_pushes === "0/0/0/0" &&
      Object.entries(evidence.safety_boundary)
        .filter(
          ([key]) =>
            key !== "source_repository_writes_stages_commits_pushes",
        )
        .every(([, value]) => value === 0),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SAFETY_BOUNDARY",
  );
  assert(
    exactValue(evidence.integration_decision, {
      PUBLIC_LIVE_ROUTE_RUNTIME_WORKSTREAM: "EVIDENCE_COMPLETE",
      STATIC_EVIDENCE_INTEGRATION_RECOMMENDATION: "GO",
      PUBLIC_LAUNCH_DECISION:
        "NO_GO_PENDING_AUTHENTICATED_WORKSTREAMS_AND_FINAL_LAUNCH_GATE",
    }),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_DECISION",
  );

  assert(
    exactObject(plan, PUBLIC_LIVE_ROUTE_PLAN_KEYS) &&
      plan.planning_version === 1 &&
      plan.source_commit ===
        "7b50b5c173a7e26a27eb3ff3557c559049fd731c",
    "PUBLIC_LIVE_ROUTE_PLAN_SCHEMA",
  );
  assert(
    exactObject(plan.source_registry, SOURCE_BINDING_KEYS) &&
      exactValue(
        plan.source_registry,
        PUBLIC_LIVE_ROUTE_SOURCE_REGISTRY,
      ) &&
      exactObject(plan.source_matrix, SOURCE_MATRIX_KEYS) &&
      exactValue(plan.source_matrix, PUBLIC_LIVE_ROUTE_SOURCE_MATRIX),
    "PUBLIC_LIVE_ROUTE_PLAN_SOURCE_BINDING",
  );
  assert(
    exactValue(plan.workstream, {
      id: "PUBLIC_LIVE_ROUTE_RUNTIME",
      gap_code: "LIVE_ROUTE_EVIDENCE_INTEGRATED",
      entry_count: 3,
    }) &&
      plan.decision ===
        "FINAL_PUBLIC_LIVE_ROUTE_RUNTIME_EVIDENCE_INTEGRATED" &&
      plan.current_authority === "STATIC_ONLY" &&
      plan.execution_authorized === false &&
      plan.live_evidence_status ===
        "PASSED_EXACT_3_PUBLIC_LIVE_ROUTE_RUNTIME_QUALIFICATION" &&
      plan.target_origin === "https://www.aifinder.to" &&
      plan.last_runtime_result === PUBLIC_LIVE_ROUTE_SUCCESS_MARKER &&
      plan.canonical_source_alignment === "COMPLETE" &&
      plan.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_BROWSER_RUNTIME",
    "PUBLIC_LIVE_ROUTE_PLAN_DECISION",
  );
  assert(
    exactObject(plan.runtime_evidence, SOURCE_IDENTITY_KEYS) &&
      exactValue(
        plan.runtime_evidence,
        actualSourceIdentity(PUBLIC_LIVE_ROUTE_EVIDENCE_PATH),
      ),
    "PUBLIC_LIVE_ROUTE_PLAN_EVIDENCE_IDENTITY",
  );
  assert(
    exactArray(plan.blocked_capabilities, [
      "AUTHENTICATED_RUNTIME",
      "DATABASE",
      "DEPLOYMENT_CONTROL",
      "DIRECT_VERCEL_WRITE",
      "FORM_OR_FILE_INTERACTION",
      "MIGRATIONS_OR_GENERATED_TYPES",
      "OPERATIONAL_REACTIVATION",
      "PUBLIC_LAUNCH",
      "PUBLIC_OR_DEPLOYED_BROWSER",
      "PUBLIC_OR_DEPLOYED_HTTP",
      "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
      "SQL",
      "STORAGE_API",
      "SUPABASE",
      "USER_VISIBLE_MUTATION",
    ]),
    "PUBLIC_LIVE_ROUTE_PLAN_BLOCKED_CAPABILITIES",
  );
  assert(
    Array.isArray(plan.routes) &&
      plan.routes.length === 3 &&
      exactArray(
        plan.routes.map((route) => route.source_path),
        expectedRoutePaths,
      ),
    "PUBLIC_LIVE_ROUTE_PLAN_ROUTE_PARTITION",
  );
  for (const route of plan.routes) {
    const contract = PUBLIC_LIVE_ROUTE_CONTRACTS.get(route.source_path);
    const expectedIdentity = sourceIdentityByPath.get(route.source_path);
    assert(
      exactObject(route, PUBLIC_LIVE_ROUTE_PLAN_ROUTE_KEYS) &&
        contract !== undefined &&
        expectedIdentity !== undefined &&
        exactObject(
          route.source_identity,
          PUBLIC_LIVE_ROUTE_SOURCE_IDENTITY_KEYS,
        ) &&
        exactValue(route.source_identity, expectedIdentity) &&
        route.runtime_role === contract.runtime_role &&
        route.observed_method === contract.method &&
        route.observed_status === contract.status &&
        route.observed_category === contract.public_category &&
        route.branch_witness_identity === PUBLIC_LIVE_ROUTE_BRANCH_WITNESS &&
        exactArray(route.static_evidence, [
          "testing/public-live-route-security-static-assertions.mjs",
        ]) &&
        exactArray(route.runtime_evidence, [
          PUBLIC_LIVE_ROUTE_EVIDENCE_PATH,
        ]) &&
        route.mutation_prohibited === true &&
        route.execution_authorized === false,
      "PUBLIC_LIVE_ROUTE_PLAN_ROUTE_CONTRACT",
    );
  }

  const rawEvidenceAndPlan = [
    readFileSync(
      path.resolve(repositoryRoot, PUBLIC_LIVE_ROUTE_EVIDENCE_PATH),
      "utf8",
    ),
    readFileSync(
      path.resolve(repositoryRoot, PUBLIC_LIVE_ROUTE_PLAN_PATH),
      "utf8",
    ),
  ]
    .join("\n")
    .split("https://www.aifinder.to")
    .join("");
  assert(
    !/https?:\/\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|process\.env|(?:^|[/"'])\.env(?:[/"'.]|$)/im.test(
      rawEvidenceAndPlan,
    ),
    "PUBLIC_LIVE_ROUTE_EVIDENCE_SAFETY_BOUNDARY",
  );
  return { routes: plan.routes.length };
}

function validatePlan() {
  const plan = readPlan();
  validateRuntimeEvidence();
  const browserLive = validateBrowserLiveEvidenceAndPlan();
  const publicLiveRoute = validatePublicLiveRouteEvidenceAndPlan();
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
    browserLiveSurfaces: browserLive.surfaces,
    browserLiveImports: browserLive.imports,
    publicLiveRoutes: publicLiveRoute.routes,
  };
}

try {
  const result = validatePlan();
  console.log(
    `PASS_PUBLIC_PRODUCTION_RUNTIME_PLANNING entries=${result.entries} import_graphs=${result.importGraphs} browser_live_surfaces=${result.browserLiveSurfaces} browser_live_imports=${result.browserLiveImports} public_live_routes=${result.publicLiveRoutes} execution_authorized=false live_evidence=PASSED_FINAL_READ_ONLY_RUNTIME_QUALIFICATION failures=0 internal_failures=0`,
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
