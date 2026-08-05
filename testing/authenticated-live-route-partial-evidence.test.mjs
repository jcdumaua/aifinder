import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = "testing/authenticated-live-route-partial-evidence.schema.json";
const EVIDENCE_PATH = "testing/authenticated-live-route-partial-evidence.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const GAP_CODE = "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED";
const OUTSIDE_SCOPE = "NOT_INSPECTED_OUTSIDE_EXACT_41_PATH_SCOPE";
const REMAINING_AUTHORITY =
  "AUTHENTICATED_LIVE_ROUTE_RUNTIME_SEPARATE_AUTHORITY_REQUIRED";
const PARTIAL_STATE = "OBSERVED_PARTIAL_FILE_LEVEL_ONLY";
const UNOBSERVED_STATE = "UNOBSERVED";
const PARTIAL_LINK_STATE = "PARTIAL_ONLY_ALL_ROUTES_STILL_BLOCKED";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const RUNTIME_EVIDENCE_ID =
  "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573";
const STATE_ENUM = [
  "OBSERVED_PARTIAL_FILE_LEVEL_ONLY",
  "UNOBSERVED",
  "CONTRADICTED",
  "NOT_ASSESSED",
];
const TOP_LEVEL_KEYS = [
  "schema_version",
  "phase",
  "artifact_purpose",
  "baseline",
  "semantic_count_reconciliation",
  "summary",
  "privacy",
  "evidence_identities",
  "routes",
  "request_positions",
  "governance",
];
const ROUTE_KEYS = [
  "baseline_path",
  "git_object_identity",
  "sha256",
  "bytes",
  "lf_lines",
  "exported_methods",
  "source_visible_branch_groups",
  "evidence_tuple_sequences",
  "observed_status",
  "matrix_link",
  "blocker_state",
  "launch_blocking",
  "outside_scope_claims",
  "remaining_authority_class",
];
const POSITION_KEYS = [
  "sequence",
  "case_id",
  "method",
  "path_template",
  "status",
  "pair_position",
  "pre_post_equal",
  "route_file",
  "source_visible_branch_category",
  "observed_status",
  "evidence_identity",
  "what_is_proven",
  "what_is_not_proven",
];
const EXPECTED_ROUTES = [
  [
    "app/api/admin/audit-logs/route.ts",
    "11f8351e53e47803546715445f35ce9259435401",
    "366a5a1cf02a57e305d6d5da79bac4ff8cb958811cfff431b6f5c5042efa2cbd",
    772,
    26,
    [
      "GET",
      "POST"
    ],
    0,
    0,
    0,
    "PARTIAL_STATIC",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/csrf/route.ts",
    "5c0e077b712e58d1218f5aa071f61991bfe2020b",
    "f9842d8166f7406effe9a8a3eef94fb5beda762f828d851a44014a0ce24d4fce",
    1143,
    49,
    [
      "GET"
    ],
    2,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
    "c660e53f8786b66ba8bf78508e142a469b06efb9",
    "3ecfa9a4fcef05062d24f8e7c06493fd84e8b834824a4a68fc9ae742e5d01b84",
    226,
    6,
    [
      "POST"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
    "0bd8380181c0ca81d4dfa31bb059e61d88b084b1",
    "e5c59f39dd7395525728cbc282505832da6b1f822f862f0cd56015a445dc02fd",
    7565,
    284,
    [
      "POST"
    ],
    9,
    3,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/discovery/candidate-staging-queue/route.ts",
    "d9b3689224647fd1eae0aaac23da99eea3227d59",
    "088b8e51b73c9278508806523ae273235fbb6c5ec5d0b02c799f88578d0507e8",
    406,
    14,
    [
      "GET"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/discovery/discovered-tools/route.ts",
    "d6de0af1e87e5b9721c48c7019168e67e1c11143",
    "aedd49386666d12cdda85608d20d850de48c9614570c4965b2fb612f2cd48010",
    7042,
    258,
    [
      "GET"
    ],
    12,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
    "8bb834400171b9ac74f103696ecafb7ddc303d0c",
    "6a83a82881e47f1cb187f1ee29751a6d0536dc8dd966d61013135b4104b4bbaa",
    4148,
    158,
    [
      "POST"
    ],
    5,
    0,
    1,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
    "2f89ddbc194d3dbe33b5b0dd0eea59aa59772099",
    "655529adbbe9f56fd2e36cd24684306bdc66e17cf82e511f224d0bded5752c9c",
    5103,
    200,
    [
      "PATCH"
    ],
    8,
    1,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
    "c00c6c77855cd0e85b717de32574406436fe3f8d",
    "4ecea4a64249238a71932039b058e97a1ff958bbc1f96c76d94c97b4373d006e",
    3962,
    154,
    [
      "POST"
    ],
    5,
    0,
    1,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/homepage-control/drafts/[id]/route.ts",
    "787fce8ed3270bc52e4204b07943f793e275a776",
    "ff644d9defbfea154d10ae61f49e25c2f1c4e12d32c5e9d2e8d61a17fb8bd1d2",
    6956,
    268,
    [
      "PATCH"
    ],
    9,
    1,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/homepage-control/drafts/route.ts",
    "8dfd5919285f0f70cd662b33b0e6384a5b1f95ab",
    "436a66b11d1e0eb3b2bdbad0d46fd1bd568e8aa912218fb26d28b0f30f5af1b4",
    2268,
    94,
    [
      "POST"
    ],
    3,
    0,
    1,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/login/route.ts",
    "16bdeb300fe46da9b65c5d72ef334de7ebf56947",
    "b5e2c7908a26cfbbaab050436bd81943ae33c1201f8e5f92a9305efba0fe11e2",
    5308,
    186,
    [
      "POST"
    ],
    13,
    0,
    2,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/session/route.ts",
    "410e0f2f42c1b0c696dd49305704f1daa36e9ffa",
    "ad22481088d2de333714c6d3d72330735ff759eea1aafaf937b713b817e68627",
    749,
    36,
    [
      "GET"
    ],
    1,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/submissions/route.ts",
    "1657fc967e6ad8bb23e3b08a9d0b3c726b7145b8",
    "6bb67d9824c3ee4605fea5b16eb700d6bb76a5dc03ba938f4e71c7d75c8eab90",
    824,
    26,
    [
      "GET",
      "POST",
      "PUT",
      "PATCH"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/tools/route.ts",
    "9f97f4842e610e862a4568113fcb76550646ab05",
    "1b910eae4fa0d00c8c0bd0a576f8d3bebb7b4238ecfa4a58a22fcded4f94ec29",
    814,
    26,
    [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "OBSERVED_PARTIAL_FILE_LEVEL_ONLY"
  ],
  [
    "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts",
    "1c1307831fcc5b838dd64f0577e8b3b9a0a94f79",
    "d4a6ff1dfff91bdaaad6c9ffbcf6156a03c87c7150bf9fab6a51d4bf02da4403",
    2733,
    107,
    [
      "POST"
    ],
    5,
    0,
    1,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
    "04f1f0f11047f6a6f356d1b3232669fbb5d3c781",
    "bef1fdc692300da991097d5a886a1388375d6688cd1d0288f1d8d093e481ab6c",
    11384,
    394,
    [
      "POST"
    ],
    27,
    1,
    3,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/discovered-tools/[id]/route.ts",
    "cf360feaf08db2b7cc804eb3f871c7409407bca8",
    "03a63f160a212f23bbd0ad5105825bab6ac3589bc98d89c2cc6b3b7420fcae90",
    12745,
    436,
    [
      "GET",
      "PATCH"
    ],
    28,
    3,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
    "5091d53ae2d678a760419e40525c6ff616804885",
    "ebe4fe7e9e7db1269cff4f4a1fb6d1a0a39506b6d26b36b7ddef64ba62d96d8e",
    9052,
    313,
    [
      "POST"
    ],
    23,
    3,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/intake/route.ts",
    "14d3cf6bb4e2bf0dfecd7ac4b466b45bc35ef3a8",
    "5d2d479156b4d9a72d825ce07ecd9a2383d58b1070f9d09c3a95f0badb519ec8",
    18264,
    643,
    [
      "POST"
    ],
    40,
    4,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
    "8fb23a80f7ae8c49077ff9921ee765a1f5739f29",
    "d6c3fc81d96d9b25a95765f932db1069118576dc7154e6a6f5ae09287a88968e",
    322,
    12,
    [
      "GET"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/runs/manual/claim/route.ts",
    "701661fdf77dee2130c885cdae93e89ba9076a80",
    "7a183632e34b8ddb38f1433a8d1e02e22c54e0fd1093afa065d6f89d92790101",
    64477,
    2254,
    [
      "POST"
    ],
    76,
    5,
    2,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/runs/manual/route.ts",
    "064260ec939084610785d64a6c917bd04e3bfdc4",
    "18f71bd5cf175116d6b192d00fa5c0f1aba4b9d8d4962120ab5997198b2f43df",
    9448,
    330,
    [
      "POST"
    ],
    18,
    4,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/runs/route.ts",
    "ace39a99c6f7ca6534096b8ca0ade9af9851fd51",
    "1a5fdd31f95c7c9ac970effe0d5f39342f9f9105b1f4add975d0fd7ae43f7963",
    9462,
    283,
    [
      "GET"
    ],
    18,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/sources/[id]/route.ts",
    "b68d4b10f6fa54a25efb8b7cc1ff985dbd96087a",
    "bfa91eff513c5185cb1bd06f2d77dcefe3e307301a7cbe1b0b82db4e18ce2ba7",
    12620,
    466,
    [
      "PATCH"
    ],
    36,
    3,
    1,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/discovery/sources/route.ts",
    "bc2362372282deb204088a09215133041009a08f",
    "8c4ef729e82820add78f5a0a1db7a5f481bb17795f0de4752090baa45dc95ca6",
    10568,
    398,
    [
      "GET",
      "POST"
    ],
    28,
    3,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/logout/route.ts",
    "b6fa65aae98acfcaf1dc546e0595e194caa57d37",
    "1807102e5101dd5a5ef852a66dad9dfd2fa0ec87c61754923bdd18715bbed59c",
    1145,
    47,
    [
      "POST"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ],
  [
    "app/api/admin/upload-logo/route.ts",
    "b332f9089b326fe6f9f3b1e0f78eb4fa1ce194b9",
    "7f1cfbb2f996abff5f354d31ed746ee3b08744b36a085867887d15d7fdf005a7",
    870,
    27,
    [
      "POST"
    ],
    0,
    0,
    0,
    "NO_STATIC_EVIDENCE",
    "UNOBSERVED"
  ]
];
const EXPECTED_POSITIONS = [
  [
    1,
    "B2-CURRENT-002",
    "POST",
    "/api/admin/login",
    415,
    "single",
    null,
    "app/api/admin/login/route.ts",
    "UNSUPPORTED_CONTENT_TYPE_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    2,
    "B2-CURRENT-004",
    "POST",
    "/api/admin/login",
    401,
    "single",
    null,
    "app/api/admin/login/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    3,
    "B2-CURRENT-010",
    "GET",
    "/api/admin/session",
    401,
    "single",
    null,
    "app/api/admin/session/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    4,
    "B2-CURRENT-013",
    "GET",
    "/api/admin/csrf",
    401,
    "single",
    null,
    "app/api/admin/csrf/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    5,
    "B2-CURRENT-075",
    "GET",
    "/api/admin/discovery/candidate-staging-queue",
    401,
    "single",
    null,
    "app/api/admin/discovery/candidate-staging-queue/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    6,
    "B2-CURRENT-095",
    "POST",
    "/api/admin/discovery/candidate-extraction/invoke",
    401,
    "single",
    null,
    "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    7,
    "B2-CURRENT-099",
    "POST",
    "/api/admin/discovery/candidate-staging-queue/00000000-0000-0000-0000-000000000000/decision",
    401,
    "single",
    null,
    "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    8,
    "B2-CURRENT-124",
    "POST",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/mark-preview",
    401,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    9,
    "B2-CURRENT-128",
    "PATCH",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/preview-checklist",
    401,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    10,
    "B2-CURRENT-133",
    "POST",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/publish",
    401,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    11,
    "B2-CURRENT-137",
    "PATCH",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000",
    401,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    12,
    "B2-CURRENT-141",
    "POST",
    "/api/admin/homepage-control/drafts",
    401,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/route.ts",
    "UNAUTHENTICATED_SESSION_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    13,
    "B1-B005-LOGIN-SUCCESS",
    "POST",
    "/api/admin/login",
    200,
    "single",
    null,
    "app/api/admin/login/route.ts",
    "AUTHENTICATED_SESSION_ESTABLISHMENT",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    14,
    "B1-B012-SESSION-VALID",
    "GET",
    "/api/admin/session",
    200,
    "single",
    null,
    "app/api/admin/session/route.ts",
    "AUTHENTICATED_SESSION_READ",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    15,
    "B1-B015-CSRF-VALID",
    "GET",
    "/api/admin/csrf",
    200,
    "single",
    null,
    "app/api/admin/csrf/route.ts",
    "CSRF_ISSUANCE_AND_VALIDATION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    16,
    "B2-CURRENT-125",
    "POST",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/mark-preview",
    403,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
    "AUTHENTICATED_PRE_PRIVILEGED_OR_CSRF_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    17,
    "B2-CURRENT-129",
    "PATCH",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/preview-checklist",
    403,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
    "AUTHENTICATED_PRE_PRIVILEGED_OR_CSRF_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    18,
    "B2-CURRENT-134",
    "POST",
    "/api/admin/homepage-control/drafts/00000000-0000-0000-0000-000000000000/publish",
    403,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
    "AUTHENTICATED_PRE_PRIVILEGED_OR_CSRF_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    19,
    "B2-CURRENT-142",
    "POST",
    "/api/admin/homepage-control/drafts",
    403,
    "single",
    null,
    "app/api/admin/homepage-control/drafts/route.ts",
    "AUTHENTICATED_PRE_PRIVILEGED_OR_CSRF_REJECTION",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    20,
    "B1-B018-AUDIT-READ-SUCCESS",
    "GET",
    "/api/admin/audit-logs",
    200,
    "pre",
    true,
    "app/api/admin/audit-logs/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    21,
    "B1-B018-AUDIT-READ-SUCCESS",
    "GET",
    "/api/admin/audit-logs",
    200,
    "post",
    true,
    "app/api/admin/audit-logs/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    22,
    "B1-B029-SUBMISSIONS-READ-SUCCESS",
    "GET",
    "/api/admin/submissions",
    200,
    "pre",
    true,
    "app/api/admin/submissions/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    23,
    "B1-B029-SUBMISSIONS-READ-SUCCESS",
    "GET",
    "/api/admin/submissions",
    200,
    "post",
    true,
    "app/api/admin/submissions/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    24,
    "B1-B050-TOOLS-READ-SUCCESS",
    "GET",
    "/api/admin/tools",
    200,
    "pre",
    true,
    "app/api/admin/tools/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    25,
    "B1-B050-TOOLS-READ-SUCCESS",
    "GET",
    "/api/admin/tools",
    200,
    "post",
    true,
    "app/api/admin/tools/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    26,
    "B1-B084-DISCOVERY-QUEUE-SUCCESS",
    "GET",
    "/api/admin/discovery/discovered-tools?page=1&limit=1",
    200,
    "pre",
    true,
    "app/api/admin/discovery/discovered-tools/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ],
  [
    27,
    "B1-B084-DISCOVERY-QUEUE-SUCCESS",
    "GET",
    "/api/admin/discovery/discovered-tools?page=1&limit=1",
    200,
    "post",
    true,
    "app/api/admin/discovery/discovered-tools/route.ts",
    "PAIRED_AUTHENTICATED_READ_SUCCESS",
    "7303c8531defc7fd04baaad4ed97390062c2d7aed797a333e4eec82dd8249573"
  ]
];
const EXPECTED_EVIDENCE_IDENTITIES = {
  governance_disposition_closure_sha256:
    "c4a1ccc80bfd644503b90f33b73fbe06aabb332064217726e79db237cc8cd767",
  chatgpt_final_batch_b_audit_sha256:
    "275e3bc98202bd5ed4def0689974cf82c376ccd04e34f2e6ea74e71e1e6212db",
  phase_32py_32pz_final_live_ccr_sha256:
    "ee378c51000c08a8aafa1484b0cb66e8864726d6d5e708ad83cd457206eb34c5",
  complete_review_bundle_sha256:
    "4cd5931b1343e06e19adc1a4594cb63280546f509eb2daf38db2f1c328307f64",
  redacted_runtime_result_sha256: RUNTIME_EVIDENCE_ID,
  outer_operator_receipt_sha256:
    "8745e43f26b8344fbec87ac8faa22ded4269dbebaef263557548ad6cc85305d7",
  network_gate_receipt_sha256:
    "5bfba3ad0c6afcbf1dd9923c769b6ff5e29f50579b3cd680b1548c1dec9bf97a",
  sanitized_terminal_log_sha256:
    "53b9d3ddc481dff0d8dbd44c8d8ed337312593e40f301bea45cce1c555d19f20",
  route_partition_sha256:
    "129263489d773c6c3afeb6417d0c5f6dc3939cb7368e5ccc1a023d44cfe81598",
};

function loadJson(repositoryPath) {
  const absolutePath = path.resolve(repositoryRoot, repositoryPath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

const schema = loadJson(SCHEMA_PATH);
const evidence = loadJson(EVIDENCE_PATH);
const matrix = loadJson(MATRIX_PATH);
const registry = loadJson(REGISTRY_PATH);
const manifest = loadJson(MANIFEST_PATH);

function assert(condition) {
  if (!condition) throw new Error("POLICY_ASSERTION_FAILED");
}

function requireArtifacts() {
  assert(schema !== null && evidence !== null);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    exactArray(Object.keys(value).sort(), [...expected].sort())
  );
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function schemaReference(root, reference) {
  if (typeof reference !== "string" || !reference.startsWith("#/")) {
    return null;
  }
  return reference
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, part) => value?.[part], root);
}

function schemaTypeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function schemaValueValid(value, rule, root) {
  if (rule === true) return true;
  if (rule === false || rule === null || typeof rule !== "object") return false;
  if (rule.$ref) {
    const referenced = schemaReference(root, rule.$ref);
    return referenced !== null && schemaValueValid(value, referenced, root);
  }
  if (
    Array.isArray(rule.allOf) &&
    !rule.allOf.every((entry) => schemaValueValid(value, entry, root))
  ) {
    return false;
  }
  if (Object.hasOwn(rule, "const") && !same(value, rule.const)) return false;
  if (Array.isArray(rule.enum) && !rule.enum.some((entry) => same(value, entry))) {
    return false;
  }
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) return false;
  }
  if (typeof value === "string") {
    if (Number.isInteger(rule.minLength) && value.length < rule.minLength) {
      return false;
    }
    if (typeof rule.pattern === "string" && !new RegExp(rule.pattern).test(value)) {
      return false;
    }
  }
  if (typeof value === "number") {
    if (typeof rule.minimum === "number" && value < rule.minimum) return false;
    if (typeof rule.maximum === "number" && value > rule.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (Number.isInteger(rule.minItems) && value.length < rule.minItems) return false;
    if (Number.isInteger(rule.maxItems) && value.length > rule.maxItems) return false;
    if (
      rule.uniqueItems === true &&
      new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length
    ) {
      return false;
    }
    const prefixItems = Array.isArray(rule.prefixItems) ? rule.prefixItems : [];
    for (let index = 0; index < Math.min(value.length, prefixItems.length); index += 1) {
      if (!schemaValueValid(value[index], prefixItems[index], root)) return false;
    }
    if (rule.items === false && value.length > prefixItems.length) return false;
    if (rule.items && rule.items !== true) {
      for (let index = prefixItems.length; index < value.length; index += 1) {
        if (!schemaValueValid(value[index], rule.items, root)) return false;
      }
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (
      Array.isArray(rule.required) &&
      !rule.required.every((key) => Object.hasOwn(value, key))
    ) {
      return false;
    }
    if (rule.properties) {
      for (const [key, childRule] of Object.entries(rule.properties)) {
        if (Object.hasOwn(value, key) && !schemaValueValid(value[key], childRule, root)) {
          return false;
        }
      }
      if (
        rule.additionalProperties === false &&
        Object.keys(value).some((key) => !Object.hasOwn(rule.properties, key))
      ) {
        return false;
      }
    }
  }
  if (
    rule.if &&
    schemaValueValid(value, rule.if, root) &&
    rule.then &&
    !schemaValueValid(value, rule.then, root)
  ) {
    return false;
  }
  return true;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function expectedRoute(row) {
  return {
    path: row[0],
    objectId: row[1],
    sha256: row[2],
    bytes: row[3],
    lines: row[4],
    methods: row[5],
    ifs: row[6],
    parameterizedCatches: row[7],
    optionalCatches: row[8],
    matrixState: row[9],
    observedState: row[10],
  };
}

function expectedPosition(row) {
  return {
    sequence: row[0],
    caseId: row[1],
    method: row[2],
    pathTemplate: row[3],
    status: row[4],
    pairPosition: row[5],
    prePostEqual: row[6],
    routeFile: row[7],
    category: row[8],
    evidenceIdentity: row[9],
  };
}

const routeExpectations = EXPECTED_ROUTES.map(expectedRoute);
const positionExpectations = EXPECTED_POSITIONS.map(expectedPosition);
const expectedPaths = routeExpectations.map((entry) => entry.path);
const expectedPathSet = new Set(expectedPaths);
const V1_CRITICAL_PATHS = [
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
];
const V1_CRITICAL_PATH_SET = new Set(V1_CRITICAL_PATHS);
const V1_DEFERRED_PATHS = expectedPaths.filter(
  (entryPath) => !V1_CRITICAL_PATH_SET.has(entryPath),
);
const V1_CRITICAL_STATE =
  "V1_ADMIN_HERMETIC_EVIDENCE_INTEGRATED_STAGING_REQUIRED";
const V1_DEFERRED_STATE = "V1_ADMIN_DEFERRED_FAIL_CLOSED";
const V1_STAGING_GAP =
  "ADMIN_V1_STAGING_ENV_DATABASE_OR_STORAGE_EVIDENCE_REQUIRED";

function routeCoreMatches(route, expected) {
  const groups = route?.source_visible_branch_groups;
  return (
    exactKeys(route, ROUTE_KEYS) &&
    route.baseline_path === expected.path &&
    route.git_object_identity === expected.objectId &&
    route.sha256 === expected.sha256 &&
    route.bytes === expected.bytes &&
    route.lf_lines === expected.lines &&
    exactArray(route.exported_methods, expected.methods) &&
    groups?.if_statements === expected.ifs &&
    groups?.catch_clauses_with_binding === expected.parameterizedCatches &&
    groups?.catch_clauses_optional_binding === expected.optionalCatches &&
    groups?.catch_clauses_total ===
      expected.parameterizedCatches + expected.optionalCatches &&
    groups?.decision_catch_total ===
      expected.ifs +
        expected.parameterizedCatches +
        expected.optionalCatches &&
    route.observed_status === expected.observedState &&
    route.blocker_state === GAP_CODE &&
    route.launch_blocking === true &&
    route.outside_scope_claims === OUTSIDE_SCOPE &&
    route.remaining_authority_class === REMAINING_AUTHORITY
  );
}

function routesExactlyMatch(document) {
  return (
    Array.isArray(document?.routes) &&
    document.routes.length === routeExpectations.length &&
    document.routes.every((route, index) =>
      routeCoreMatches(route, routeExpectations[index]),
    )
  );
}

function positionCoreMatches(position, expected) {
  return (
    exactKeys(position, POSITION_KEYS) &&
    position.sequence === expected.sequence &&
    position.case_id === expected.caseId &&
    position.method === expected.method &&
    position.path_template === expected.pathTemplate &&
    position.status === expected.status &&
    position.pair_position === expected.pairPosition &&
    position.pre_post_equal === expected.prePostEqual &&
    position.route_file === expected.routeFile &&
    position.source_visible_branch_category === expected.category &&
    position.observed_status === PARTIAL_STATE &&
    position.evidence_identity === expected.evidenceIdentity &&
    Array.isArray(position.what_is_proven) &&
    position.what_is_proven.length > 0 &&
    Array.isArray(position.what_is_not_proven) &&
    position.what_is_not_proven.length === 7
  );
}

function positionsExactlyMatch(document) {
  return (
    Array.isArray(document?.request_positions) &&
    document.request_positions.length === positionExpectations.length &&
    document.request_positions.every((position, index) =>
      positionCoreMatches(position, positionExpectations[index]),
    )
  );
}

function tupleLinksExactlyMatch(document) {
  if (!positionsExactlyMatch(document) || !routesExactlyMatch(document)) {
    return false;
  }
  return document.routes.every((route) => {
    const expectedSequences = document.request_positions
      .filter((position) => position.route_file === route.baseline_path)
      .map((position) => position.sequence);
    return exactArray(route.evidence_tuple_sequences, expectedSequences);
  });
}

function strictEvidenceShape(document) {
  return (
    exactKeys(document, TOP_LEVEL_KEYS) &&
    exactKeys(document.baseline, ["commit", "parent", "tree", "subject"]) &&
    exactKeys(document.semantic_count_reconciliation, [
      "superseded_analyzer_total",
      "correct_source_total",
      "if_statements",
      "catch_clauses_with_binding",
      "catch_clauses_optional_binding",
      "catch_clauses_total",
      "false_member_call_in_superseded_scanner",
      "formula",
    ]) &&
    exactKeys(document.summary, [
      "route_files",
      "exported_methods",
      "if_statements",
      "catch_clauses",
      "decision_catch_points",
      "observed_files",
      "unobserved_files",
      "unique_case_ids",
      "request_positions",
      "passing_positions",
      "launch_blocking_routes",
      "partial_static_routes",
      "no_static_evidence_routes",
    ]) &&
    exactKeys(document.privacy, [
      "raw_production_values_retained",
      "sensitive_material_retained",
      "sentinel_uuid",
      "sentinel_uuid_is_fixed_nonproduction_value",
    ]) &&
    exactKeys(document.evidence_identities, Object.keys(EXPECTED_EVIDENCE_IDENTITIES)) &&
    same(document.evidence_identities, EXPECTED_EVIDENCE_IDENTITIES) &&
    exactKeys(document.governance, [
      "overall_decision",
      "execution_authorized",
      "authenticated_live_route_workstream_state",
      "current_authority",
      "partial_evidence_state",
      "outside_scope_claims",
    ]) &&
    Array.isArray(document.routes) &&
    document.routes.every((route) =>
      exactKeys(route?.source_visible_branch_groups, [
        "if_statements",
        "catch_clauses_with_binding",
        "catch_clauses_optional_binding",
        "catch_clauses_total",
        "decision_catch_total",
      ]) &&
      exactKeys(route?.matrix_link, [
        "matrix_path",
        "coverage_state",
        "partial_evidence_path",
        "gap_code",
      ]),
    )
  );
}

function semanticCountsValid(document) {
  if (!routesExactlyMatch(document)) return false;
  const groups = document.routes.map((route) => route.source_visible_branch_groups);
  return (
    sum(document.routes.map((route) => route.exported_methods.length)) === 37 &&
    sum(groups.map((group) => group.if_statements)) === 366 &&
    sum(groups.map((group) => group.catch_clauses_with_binding)) === 31 &&
    sum(groups.map((group) => group.catch_clauses_optional_binding)) === 12 &&
    sum(groups.map((group) => group.catch_clauses_total)) === 43 &&
    sum(groups.map((group) => group.decision_catch_total)) === 409
  );
}

function matrixLinksValid(matrixDocument, evidenceDocument) {
  if (!matrixDocument || !routesExactlyMatch(evidenceDocument)) return false;
  const linked = matrixDocument.entries?.filter((entry) =>
    entry.partial_evidence_paths?.includes(EVIDENCE_PATH),
  );
  if (
    !Array.isArray(linked) ||
    linked.length !== 28 ||
    !same(linked.map((entry) => entry.path).sort(), [...expectedPaths].sort())
  ) {
    return false;
  }
  return evidenceDocument.routes.every((route) => {
    const matrixEntry = matrixDocument.entries.find(
      (entry) => entry.path === route.baseline_path,
    );
    const isCritical = V1_CRITICAL_PATH_SET.has(route.baseline_path);
    return (
      matrixEntry &&
      exactArray(matrixEntry.partial_evidence_paths, [EVIDENCE_PATH]) &&
      matrixEntry.coverage_state ===
        (isCritical ? V1_CRITICAL_STATE : V1_DEFERRED_STATE) &&
      matrixEntry.launch_blocking === isCritical &&
      matrixEntry.gap_code_or_null === (isCritical ? V1_STAGING_GAP : null) &&
      route.matrix_link.matrix_path === MATRIX_PATH &&
      route.matrix_link.partial_evidence_path === EVIDENCE_PATH &&
      route.matrix_link.gap_code === GAP_CODE
    );
  });
}

function registryWorkstream(registryDocument, id) {
  return registryDocument?.workstreams?.find(
    (entry) => entry.id === id,
  );
}

function registryWorkstreamsValid(registryDocument) {
  const critical = registryWorkstream(
    registryDocument,
    "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  const deferred = registryWorkstream(
    registryDocument,
    "AUTHENTICATED_ADMIN_V1_DEFERRED",
  );
  return (
    critical?.entry_count === 7 &&
    critical.state === "HERMETIC_COMPLETE_STAGING_AUTHORITY_REQUIRED" &&
    critical.execution_authorized === false &&
    same([...critical.source_paths].sort(), [...V1_CRITICAL_PATHS].sort()) &&
    deferred?.entry_count === 21 &&
    deferred.state === "SAFELY_DISABLED_FOR_V1_LAUNCH" &&
    deferred.execution_authorized === false &&
    same([...deferred.source_paths].sort(), [...V1_DEFERRED_PATHS].sort())
  );
}

function schemaObjectsAreStrict(node) {
  if (node === null || typeof node !== "object") return true;
  if (
    node.type === "object" &&
    (node.additionalProperties !== false ||
      !Array.isArray(node.required) ||
      !node.properties)
  ) {
    return false;
  }
  return Object.values(node).every(schemaObjectsAreStrict);
}

function schemaValid(schemaDocument) {
  const stateDefinition = schemaDocument?.$defs?.evidenceState;
  return (
    schemaDocument?.$schema === "https://json-schema.org/draft/2020-12/schema" &&
    schemaDocument?.type === "object" &&
    schemaDocument?.additionalProperties === false &&
    exactArray(schemaDocument.required, TOP_LEVEL_KEYS) &&
    schemaObjectsAreStrict(schemaDocument) &&
    exactArray(stateDefinition?.enum, STATE_ENUM) &&
    schemaDocument?.$defs?.baseline?.properties?.commit?.const ===
      "b1a96eb855158687f548c65a1232456ed0342b91" &&
    schemaDocument?.properties?.routes?.minItems === 28 &&
    schemaDocument?.properties?.routes?.maxItems === 28 &&
    schemaDocument?.properties?.routes?.items === false &&
    schemaDocument?.properties?.routes?.prefixItems?.length === 28 &&
    schemaDocument.properties.routes.prefixItems.every(
      (item, index) =>
        item?.allOf?.[0]?.$ref === "#/$defs/route" &&
        same(item?.allOf?.[1]?.const, evidence.routes[index]),
    ) &&
    schemaDocument?.properties?.request_positions?.minItems === 27 &&
    schemaDocument?.properties?.request_positions?.maxItems === 27 &&
    schemaDocument?.properties?.request_positions?.items === false &&
    schemaDocument?.properties?.request_positions?.prefixItems?.length === 27 &&
    schemaDocument.properties.request_positions.prefixItems.every(
      (item, index) =>
        item?.allOf?.[0]?.$ref === "#/$defs/requestPosition" &&
        same(item?.allOf?.[1]?.const, evidence.request_positions[index]),
    ) &&
    schemaValueValid(evidence, schemaDocument, schemaDocument)
  );
}

function classificationsValid(manifestDocument) {
  const expected = [
    [SCHEMA_PATH, "CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY", null],
    [EVIDENCE_PATH, "CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY", null],
    [
      "testing/authenticated-live-route-partial-evidence.test.mjs",
      "EXECUTABLE",
      "SAFE_STATIC_POLICY",
      "RUN_POLICY",
      ["node", "testing/authenticated-live-route-partial-evidence.test.mjs"],
    ],
  ];
  return expected.every(([entryPath, role, safetyClass, disposition, argv]) => {
    const entry = manifestDocument?.entries?.find((candidate) => candidate.path === entryPath);
    return (
      entry?.role === role &&
      entry?.safety_class === safetyClass &&
      entry?.ci_disposition === disposition &&
      same(entry?.command_argv, argv)
    );
  });
}

function mutationRejected(mutator, predicate) {
  const changed = clone(evidence);
  mutator(changed);
  return predicate(changed) === false;
}

const assertions = [
  ["strict_schema_and_three_manifest_classifications", () => {
    requireArtifacts();
    assert(schemaValid(schema));
    assert(classificationsValid(manifest));
    const changed = clone(evidence);
    changed.unapproved = true;
    assert(!strictEvidenceShape(changed));
  }],
  ["exact_baseline_identity", () => {
    requireArtifacts();
    assert(
      same(evidence.baseline, {
        commit: "b1a96eb855158687f548c65a1232456ed0342b91",
        parent: "dbaa6374ff73cc7c32cdd5e21bfa6501a91ac0ad",
        tree: "ad14d618288314647c9b8c69050e25bb027cd30d",
        subject:
          "Harden authenticated live routes and synthetic transaction assurance",
      }),
    );
  }],
  ["exact_route_inventory_28", () => {
    requireArtifacts();
    assert(routesExactlyMatch(evidence));
    assert(mutationRejected((value) => value.routes.pop(), routesExactlyMatch));
    assert(
      mutationRejected(
        (value) => value.routes.push(clone(value.routes[0])),
        routesExactlyMatch,
      ),
    );
  }],
  ["exported_methods_37", () => {
    requireArtifacts();
    assert(semanticCountsValid(evidence));
    assert(
      mutationRejected(
        (value) => value.routes[0].exported_methods[0] = "PATCH",
        semanticCountsValid,
      ),
    );
  }],
  ["if_statements_366", () => {
    requireArtifacts();
    assert(semanticCountsValid(evidence));
    assert(
      mutationRejected(
        (value) => value.routes[1].source_visible_branch_groups.if_statements += 1,
        semanticCountsValid,
      ),
    );
  }],
  ["catch_clauses_43_parameterized_31_optional_12", () => {
    requireArtifacts();
    assert(semanticCountsValid(evidence));
    assert(
      mutationRejected((value) => {
        const groups = value.routes[6].source_visible_branch_groups;
        groups.catch_clauses_optional_binding = 0;
        groups.catch_clauses_total = 0;
        groups.decision_catch_total -= 1;
      }, semanticCountsValid),
    );
  }],
  ["decision_and_catch_total_409", () => {
    requireArtifacts();
    assert(semanticCountsValid(evidence));
    assert(
      mutationRejected(
        (value) => value.semantic_count_reconciliation.correct_source_total = 398,
        (value) =>
          semanticCountsValid(value) &&
          value.semantic_count_reconciliation.correct_source_total === 409,
      ),
    );
  }],
  ["observed_unobserved_partition_15_13", () => {
    requireArtifacts();
    assert(
      evidence.routes.filter((route) => route.observed_status === PARTIAL_STATE).length === 15 &&
      evidence.routes.filter((route) => route.observed_status === UNOBSERVED_STATE).length === 13 &&
      evidence.summary.observed_files === 15 &&
      evidence.summary.unobserved_files === 13
    );
    assert(
      mutationRejected(
        (value) => {
          for (const route of value.routes) {
            route.observed_status = PARTIAL_STATE;
          }
        },
        (value) =>
          value.routes.filter(
            (route) => route.observed_status === PARTIAL_STATE,
          ).length === 15 &&
          value.routes.filter(
            (route) => route.observed_status === UNOBSERVED_STATE,
          ).length === 13,
      ),
    );
  }],
  ["unique_case_ids_23", () => {
    requireArtifacts();
    assert(new Set(evidence.request_positions.map((entry) => entry.case_id)).size === 23);
    assert(evidence.summary.unique_case_ids === 23);
    assert(
      mutationRejected(
        (value) => {
          value.request_positions[0].case_id = value.request_positions[1].case_id;
        },
        (value) =>
          new Set(value.request_positions.map((entry) => entry.case_id)).size ===
            23 && value.summary.unique_case_ids === 23,
      ),
    );
    assert(
      mutationRejected(
        (value) => {
          value.evidence_identities.redacted_runtime_result_sha256 =
            "0".repeat(64);
        },
        strictEvidenceShape,
      ),
    );
  }],
  ["exact_request_positions_27_and_tuple_binding", () => {
    requireArtifacts();
    assert(positionsExactlyMatch(evidence) && tupleLinksExactlyMatch(evidence));
    assert(
      mutationRejected(
        (value) => value.request_positions.reverse(),
        positionsExactlyMatch,
      ),
    );
    assert(
      mutationRejected(
        (value) => value.request_positions.pop(),
        (value) =>
          value.request_positions.length === 27 &&
          value.summary.request_positions === 27,
      ),
    );
    assert(
      mutationRejected(
        (value) =>
          value.request_positions.push(clone(value.request_positions[0])),
        (value) =>
          value.request_positions.length === 27 &&
          new Set(
            value.request_positions.map((position) => position.sequence),
          ).size === 27,
      ),
    );
    assert(
      mutationRejected(
        (value) => value.request_positions[0].route_file = value.routes[0].baseline_path,
        tupleLinksExactlyMatch,
      ),
    );
  }],
  ["exact_git_object_identities_28", () => {
    requireArtifacts();
    assert(routesExactlyMatch(evidence));
    assert(
      mutationRejected(
        (value) => value.routes[0].git_object_identity = "0".repeat(40),
        routesExactlyMatch,
      ),
    );
  }],
  ["exact_sha256_content_identities_28", () => {
    requireArtifacts();
    assert(routesExactlyMatch(evidence));
    assert(
      mutationRejected(
        (value) => value.routes[0].sha256 = "0".repeat(64),
        routesExactlyMatch,
      ),
    );
  }],
  ["sanitized_privacy_and_single_sentinel_uuid", () => {
    requireArtifacts();
    const uuidValues = JSON.stringify(evidence).match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ) ?? [];
    assert(
      evidence.privacy.raw_production_values_retained === false &&
      evidence.privacy.sensitive_material_retained === false &&
      evidence.privacy.sentinel_uuid === ZERO_UUID &&
      evidence.privacy.sentinel_uuid_is_fixed_nonproduction_value === true &&
      uuidValues.length > 0 &&
      uuidValues.every((value) => value === ZERO_UUID)
    );
    assert(
      mutationRejected((value) => {
        value.privacy.raw_production_values_retained = true;
        value.privacy.raw_production_value = "forbidden";
      }, (value) =>
        strictEvidenceShape(value) &&
        value.privacy.raw_production_values_retained === false,
      ),
    );
  }],
  ["partial_only_observation_state", () => {
    requireArtifacts();
    assert(
      evidence.routes.every((route) =>
        [PARTIAL_STATE, UNOBSERVED_STATE].includes(route.observed_status),
      ) &&
      evidence.request_positions.every(
        (position) => position.observed_status === PARTIAL_STATE,
      ) &&
      evidence.governance.partial_evidence_state === PARTIAL_LINK_STATE
    );
    assert(
      mutationRejected(
        (value) => value.routes[0].observed_status = "QUALIFIED",
        routesExactlyMatch,
      ),
    );
  }],
  ["launch_blockers_28_of_28", () => {
    requireArtifacts();
    assert(
      evidence.routes.filter(
        (route) => route.launch_blocking && route.blocker_state === GAP_CODE,
      ).length === 28 &&
      evidence.summary.launch_blocking_routes === 28
    );
    assert(
      mutationRejected((value) => {
        value.routes[0].launch_blocking = false;
        value.routes[0].blocker_state = null;
      }, routesExactlyMatch),
    );
  }],
  ["matrix_partial_evidence_links_28", () => {
    requireArtifacts();
    assert(matrixLinksValid(matrix, evidence));
    const changedMatrix = clone(matrix);
    const linkedEntry = changedMatrix.entries.find(
      (entry) => expectedPathSet.has(entry.path),
    );
    linkedEntry.partial_evidence_paths = [];
    assert(!matrixLinksValid(changedMatrix, evidence));
  }],
  ["matrix_gap_and_coverage_partition_preserved", () => {
    requireArtifacts();
    const authenticated = matrix.entries.filter((entry) =>
      expectedPathSet.has(entry.path),
    );
    assert(
      authenticated.length === 28 &&
      authenticated.filter((entry) => entry.coverage_state === V1_CRITICAL_STATE).length === 7 &&
      authenticated.filter((entry) => entry.coverage_state === V1_DEFERRED_STATE).length === 21 &&
      authenticated.filter((entry) => entry.gap_code_or_null === V1_STAGING_GAP).length === 7 &&
      authenticated.filter((entry) => entry.launch_blocking === true).length === 7 &&
      authenticated.filter((entry) => entry.launch_blocking === false).length === 21
    );
    const blockerReversion = clone(matrix);
    for (const entry of blockerReversion.entries) {
      if (expectedPathSet.has(entry.path)) entry.launch_blocking = true;
    }
    assert(!matrixLinksValid(blockerReversion, evidence));
    const deferredPromotion = clone(matrix);
    const deferredEntry = deferredPromotion.entries.find(
      (entry) => V1_DEFERRED_PATHS.includes(entry.path),
    );
    deferredEntry.coverage_state = V1_CRITICAL_STATE;
    deferredEntry.launch_blocking = true;
    deferredEntry.gap_code_or_null = V1_STAGING_GAP;
    assert(!matrixLinksValid(deferredPromotion, evidence));
  }],
  ["registry_exact_authenticated_route_scope", () => {
    requireArtifacts();
    assert(registryWorkstreamsValid(registry));
    const missingWorkstream = clone(registry);
    missingWorkstream.workstreams = missingWorkstream.workstreams.filter(
      (entry) => entry.id !== "AUTHENTICATED_ADMIN_V1_DEFERRED",
    );
    assert(!registryWorkstreamsValid(missingWorkstream));
  }],
  ["registry_blocked_state_preserved", () => {
    requireArtifacts();
    assert(
      registryWorkstream(
        registry,
        "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
      )?.state === "HERMETIC_COMPLETE_STAGING_AUTHORITY_REQUIRED" &&
      registryWorkstream(
        registry,
        "AUTHENTICATED_ADMIN_V1_DEFERRED",
      )?.state === "SAFELY_DISABLED_FOR_V1_LAUNCH"
    );
  }],
  ["registry_no_go_preserved", () => {
    requireArtifacts();
    assert(registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES");
  }],
  ["execution_authority_remains_false", () => {
    requireArtifacts();
    const criticalWorkstream = registryWorkstream(
      registry,
      "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
    );
    const deferredWorkstream = registryWorkstream(
      registry,
      "AUTHENTICATED_ADMIN_V1_DEFERRED",
    );
    assert(
      registry.execution_authorized === false &&
      criticalWorkstream?.execution_authorized === false &&
      deferredWorkstream?.execution_authorized === false &&
      evidence.governance.execution_authorized === false &&
      evidence.governance.current_authority === "STATIC_ONLY"
    );
    const executionAuthorization = clone(registry);
    executionAuthorization.execution_authorized = true;
    assert(!(
      executionAuthorization.execution_authorized === false &&
      registryWorkstreamsValid(executionAuthorization)
    ));
    assert(
      mutationRejected((value) => {
        value.governance.execution_authorized = true;
        value.governance.current_authority = "AUTHENTICATED_RUNTIME";
      }, (value) =>
        value.governance.execution_authorized === false &&
        value.governance.current_authority === "STATIC_ONLY",
      ),
    );
  }],
  ["state_enum_exact_and_no_qualified_state", () => {
    requireArtifacts();
    assert(
      exactArray(schema.$defs.evidenceState.enum, STATE_ENUM) &&
      !schema.$defs.evidenceState.enum.includes("QUALIFIED")
    );
    assert(
      mutationRejected(
        (value) => value.routes[0].observed_status = "UNKNOWN_STATE",
        routesExactlyMatch,
      ),
    );
  }],
  ["outside_scope_labels_exact", () => {
    requireArtifacts();
    assert(
      evidence.routes.every((route) => route.outside_scope_claims === OUTSIDE_SCOPE) &&
      evidence.governance.outside_scope_claims === OUTSIDE_SCOPE
    );
    assert(
      mutationRejected(
        (value) => value.routes[0].baseline_path = "app/api/outside/route.ts",
        routesExactlyMatch,
      ),
    );
  }],
  ["analyzer_defect_provenance_preserved", () => {
    requireArtifacts();
    const reconciliation = evidence.semantic_count_reconciliation;
    assert(
      reconciliation.superseded_analyzer_total === 398 &&
      reconciliation.correct_source_total === 409 &&
      reconciliation.if_statements === 366 &&
      reconciliation.catch_clauses_with_binding === 31 &&
      reconciliation.catch_clauses_optional_binding === 12 &&
      reconciliation.catch_clauses_total === 43 &&
      reconciliation.false_member_call_in_superseded_scanner ===
        "app/api/admin/login/route.ts:114 request.text().catch" &&
      reconciliation.formula ===
        "398 - 1 false member-call match + 12 omitted optional-binding catches = 409"
    );
    assert(
      mutationRejected((value) => {
        value.semantic_count_reconciliation.catch_clauses_with_binding = 32;
        value.semantic_count_reconciliation.catch_clauses_total = 44;
        value.semantic_count_reconciliation.correct_source_total = 410;
      }, (value) => {
        const item = value.semantic_count_reconciliation;
        return (
          item.catch_clauses_with_binding === 31 &&
          item.catch_clauses_total === 43 &&
          item.correct_source_total === 409
        );
      }),
    );
  }],
];

const missingIntegration =
  schema === null &&
  evidence === null &&
  !manifest?.entries?.some((entry) =>
    [
      SCHEMA_PATH,
      EVIDENCE_PATH,
      "testing/authenticated-live-route-partial-evidence.test.mjs",
    ].includes(entry.path),
  );
let passed = 0;
let failed = 0;
for (const [name, assertion] of assertions) {
  try {
    assertion();
    passed += 1;
    console.log("POLICY_ASSERT name=" + name + " result=PASS");
  } catch {
    failed += 1;
    console.log(
      "POLICY_ASSERT name=" + name + " result=" +
        (missingIntegration ? "EXPECTED_FAIL" : "FAIL"),
    );
  }
}

if (missingIntegration && passed === 0 && failed === 24) {
  console.log(
    "RED_AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE named_assertions=24 pass=0 expected_fail=24 exit=1 cause=missing_schema_evidence_and_cross_governance_integration syntax_or_loader_failure=false",
  );
  process.exitCode = 1;
} else if (passed === 24 && failed === 0) {
  console.log(
    "PASS_AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE named_assertions=24 pass=24 fail=0 expected_fail=0",
  );
} else {
  console.log(
    "FAIL_AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE named_assertions=24 pass=" +
      passed + " fail=" + failed + " expected_fail=0",
  );
  process.exitCode = 1;
}
