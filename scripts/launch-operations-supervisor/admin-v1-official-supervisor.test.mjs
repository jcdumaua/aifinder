import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  validateOfficialAuthorizationForSupervisor,
} from "./nonproduction-qualification-supervisor.mjs";

const PUBLISHED_HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
const RUN_ID = "33333333-3333-4333-8333-333333333333";
const FAILED_SPENT_RUN_ID = "d331e3ef-ce63-47d7-b728-94db274d306e";
const sha = (character) => character.repeat(64);
const SUPPORT_PATHS = [
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
];
const ROUTE_PATHS = [
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
  "lib/admin-v1-launch-scope.ts",
  "proxy.ts",
];
const CONTRACT_KEYS = [
  "budgets",
  "deferred_routes",
  "environment_names",
  "official_ledger",
  "qualification_ledger",
  "target_routes",
];
const V2_CONTRACT_KEYS = ["action_costs", ...CONTRACT_KEYS];
const CREDENTIAL_POLICY = {
  GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
  VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
  SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
  SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
  ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
  ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
  NODE_ENV: "PROVIDER_PRODUCTION_SEMANTICS",
};

function repository(head = PUBLISHED_HEAD) {
  return {
    root: "/Users/jamescarlodumaua/aifinder",
    branch: "main",
    head,
    origin_main: head,
    remote_main: head,
    ahead: 0,
    behind: 0,
    index_empty: true,
    worktree_count: 1,
    status_sha256: sha("a"),
    remote_repository: "jcdumaua/aifinder",
  };
}

function policy() {
  return {
    candidate: {
      candidate_identity_sha256: sha("1"),
      manifest_sha256: sha("2"),
    },
    compatibility_support_sha256: Object.fromEntries(
      SUPPORT_PATHS.map((entry) => [entry, sha("3")]),
    ),
    official_runtime: {
      operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
      authorization_schema_path:
        "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json",
      authorization_schema_sha256: sha("4"),
      contract_sha256: Object.fromEntries(CONTRACT_KEYS.map((entry) => [entry, sha("5")])),
      contract_sha256_v2: {
        ...Object.fromEntries(CONTRACT_KEYS.map((entry) => [entry, sha("5")])),
        action_costs: sha("d"), budgets: sha("e"),
      },
      credential_source_policy: CREDENTIAL_POLICY,
      route_source_sha256: Object.fromEntries(ROUTE_PATHS.map((entry) => [entry, sha("6")])),
      repository_contract: {
        root: "/Users/jamescarlodumaua/aifinder",
        branch: "main",
        ahead: 0,
        behind: 0,
        index_empty: true,
        worktree_count: 1,
        remote_repository: "jcdumaua/aifinder",
        head_binding: "AUTHORIZATION_PUBLISHED_HEAD",
        origin_main_binding: "SAME_AS_HEAD",
        remote_main_binding: "SAME_AS_HEAD",
        status_binding: "AUTHORIZATION_STATUS_SHA256",
      },
      access_mode: "SELF_PROJECT_OIDC",
    },
  };
}

function authorization() {
  const reviewed = policy();
  return {
    schema_version: 1,
    operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
    authorization_id_sha256: sha("7"),
    one_use_authorization_sha256: sha("8"),
    review_approval_sha256: sha("c"),
    candidate_identity_sha256: reviewed.candidate.candidate_identity_sha256,
    manifest_sha256: reviewed.candidate.manifest_sha256,
    supervisor_sha256: sha("9"),
    supervisor_policy_sha256: sha("a"),
    authorization_schema_sha256:
      reviewed.official_runtime.authorization_schema_sha256,
    compatibility_support_sha256:
      reviewed.compatibility_support_sha256,
    route_source_sha256: reviewed.official_runtime.route_source_sha256,
    contract_sha256: reviewed.official_runtime.contract_sha256,
    created_at: "2026-08-21T12:00:00.000Z",
    expires_at: "2026-08-22T12:00:00.000Z",
    run_id: RUN_ID,
    repository: repository(),
    execution: {
      access_mode: "SELF_PROJECT_OIDC",
      branch_name: `aifinder-admin-v1-official-${RUN_ID}`,
      journal_directory:
        `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${RUN_ID}`,
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      storage_bucket: "tool-logos",
      storage_name: `admin/${RUN_ID}.png`,
      temporary_commit_sha: "b".repeat(40),
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    },
  };
}

const reviewedPolicy = policy();
const valid = validateOfficialAuthorizationForSupervisor(
  authorization(),
  reviewedPolicy,
  Date.parse("2026-08-21T12:00:00.000Z"),
);
assert.equal(valid.operation_class, "ADMIN_V1_OFFICIAL_RUNTIME_V1");
assert.equal(valid.repository.head, PUBLISHED_HEAD);

assert.throws(
  () => validateOfficialAuthorizationForSupervisor(
    {
      ...authorization(),
      repository: { ...authorization().repository, head: "f".repeat(40) },
    },
    reviewedPolicy,
    Date.parse("2026-08-21T12:00:00.000Z"),
  ),
  (error) => error?.code === "SUPERVISOR_AUTHORIZATION_INVALID",
);

assert.throws(
  () => validateOfficialAuthorizationForSupervisor(
    {
      ...authorization(),
      contract_sha256: { ...authorization().contract_sha256, budgets: sha("f") },
    },
    reviewedPolicy,
    Date.parse("2026-08-21T12:00:00.000Z"),
  ),
  (error) => error?.code === "SUPERVISOR_AUTHORIZATION_INVALID",
);

const spentAuthorization = authorization();
spentAuthorization.run_id = FAILED_SPENT_RUN_ID;
spentAuthorization.execution.branch_name =
  `aifinder-admin-v1-official-${FAILED_SPENT_RUN_ID}`;
spentAuthorization.execution.journal_directory =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${FAILED_SPENT_RUN_ID}`;
spentAuthorization.execution.storage_name = `admin/${FAILED_SPENT_RUN_ID}.png`;
assert.throws(
  () => validateOfficialAuthorizationForSupervisor(
    spentAuthorization,
    reviewedPolicy,
    Date.parse("2026-08-21T12:00:00.000Z"),
  ),
  (error) => error?.code === "SUPERVISOR_AUTHORIZATION_INVALID",
);

const v2CanonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(v2CanonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value)
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((key) => `${JSON.stringify(key)}:${v2CanonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const v2Sha256 = (value) => createHash("sha256").update(value).digest("hex");
const V2_ISOLATION_CONTRACT = {
  schema_version: 2,
  operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
  mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1",
  provider_cleanup_policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1",
  origin_relation: "HTTPS_PROJECT_REF_DOT_SUPABASE_DOT_CO_V1",
  allow_custom_origin: false,
  excluded_project_ref: "mtpisopvdxuvmpzbzqjw",
  excluded_origin: "https://mtpisopvdxuvmpzbzqjw.supabase.co",
  environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF"],
  credential_bundle_schema_version: 1,
  credential_bundle_provenance_source: "OWNER_BOUND_ISOLATED_BUNDLE_V1",
  credential_value_names: ["admin_password", "admin_session_secret", "github_token",
    "supabase_anon_key", "supabase_service_role_key", "supabase_url", "vercel_token"],
  credential_value_max_bytes: 16384,
  provisioning_receipt_schema_version: 1,
  provenance_receipt_schema_version: 1,
  expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
  expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
  preview_environment_plan: [
    ["ADMIN_PASSWORD", "credential:admin_password"],
    ["ADMIN_SESSION_SECRET", "credential:admin_session_secret"],
    ["NEXT_PUBLIC_SUPABASE_URL", "credential:supabase_url"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "credential:supabase_anon_key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "credential:supabase_service_role_key"],
    ["AIFINDER_VALIDATION_RUN_ID", "authorization:run_id"],
    ["AIFINDER_VALIDATION_PROJECT_REF", "authorization:isolation.project_ref"],
  ],
  retention_trigger: "SUCCESS_AFTER_OFFICIAL_LEDGER_AND_POSTSTATE_V1",
  pre_commit_failure_policy: "DELETE_EXACT_RUN_OWNED_EXTERNAL_RESOURCES_V1",
  post_commit_policy: "RETAIN_EXACT_RUN_OWNED_PREVIEW_AND_SEVEN_ENVIRONMENTS_V1",
  retention_complete_lifecycle: "RETENTION_COMPLETE",
  retention_pending_lifecycle: "RETENTION_PENDING",
  retained_preview_count: 1,
  retained_environment_count: 7,
  final_retention_verification: "REVERIFY_EXACT_IDS_AFTER_DATA_AND_EPHEMERAL_CLEANUP_V1",
  automatic_post_success_delete: false,
  later_destructive_cleanup_requires_owner_authority: true,
};
function oneUseV2(value) {
  const { one_use_authorization_sha256: ignored, ...fields } = value;
  void ignored;
  return v2Sha256(v2CanonicalJson({
    domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...fields,
  }));
}
function v2Authorization() {
  const value = authorization();
  value.schema_version = 2;
  value.contract_sha256 = structuredClone(policy().official_runtime.contract_sha256_v2);
  value.isolation_contract_sha256 = v2Sha256(v2CanonicalJson(V2_ISOLATION_CONTRACT));
  value.execution.environment_keys = [...V2_ISOLATION_CONTRACT.environment_keys];
  value.execution.provider_cleanup_policy = V2_ISOLATION_CONTRACT.provider_cleanup_policy;
  value.execution.isolation = {
    mode: V2_ISOLATION_CONTRACT.mode,
    project_ref: "offline-pr4-v2",
    origin: "https://offline-pr4-v2.supabase.co",
    provisioning_receipt_sha256: sha("1"),
    schema_contract_sha256: sha("2"),
    credential_bundle_path: `${value.execution.journal_directory}/isolated-credentials.json`,
    credential_bundle_provenance_sha256: sha("3"),
    validation_run_id: value.run_id,
    expected_preview_project_id: value.execution.preview_project_id,
    expected_preview_team_id: value.execution.preview_team_id,
  };
  value.one_use_authorization_sha256 = oneUseV2(value);
  return value;
}
const v2Policy = policy();
v2Policy.official_runtime.isolation_contract_sha256 =
  v2Sha256(v2CanonicalJson(V2_ISOLATION_CONTRACT));
assert.equal(validateOfficialAuthorizationForSupervisor(
  v2Authorization(), v2Policy, Date.parse("2026-08-21T12:00:00.000Z"),
).schema_version, 2, "COMPLETE_CLOSED_V2_PREIMPORT_ACCEPTED");
assert.deepEqual(Object.keys(valid.contract_sha256).sort(), CONTRACT_KEYS);
assert.deepEqual(Object.keys(v2Authorization().contract_sha256).sort(), V2_CONTRACT_KEYS);
const v1SevenKey = authorization();
v1SevenKey.contract_sha256.action_costs = sha("d");
const v1SevenKeyPolicy = policy();
v1SevenKeyPolicy.official_runtime.contract_sha256 = structuredClone(v1SevenKey.contract_sha256);
assert.throws(() => validateOfficialAuthorizationForSupervisor(
  v1SevenKey, v1SevenKeyPolicy, Date.parse("2026-08-21T12:00:00.000Z"),
), (error) => error?.code === "SUPERVISOR_AUTHORIZATION_INVALID");
let v2Negatives = 0;
function rejectV2(change, policyChange = () => {}, refreshDigest = true) {
  const value = v2Authorization(); const reviewed = structuredClone(v2Policy);
  change(value); policyChange(reviewed);
  // Refresh the semantic digest so structural/binding negatives test the actual admission.
  if (refreshDigest && value.one_use_authorization_sha256 !== sha("f")) {
    value.one_use_authorization_sha256 = oneUseV2(value);
  }
  assert.throws(() => validateOfficialAuthorizationForSupervisor(
    value, reviewed, Date.parse("2026-08-21T12:00:00.000Z"),
  ), (error) => error?.code === "SUPERVISOR_AUTHORIZATION_INVALID");
  v2Negatives++;
}
for (const field of ["isolation_contract_sha256", "supervisor_sha256",
  "supervisor_policy_sha256", "authorization_schema_sha256", "candidate_identity_sha256",
  "manifest_sha256", "compatibility_support_sha256", "route_source_sha256", "contract_sha256"]) {
  rejectV2((value) => { delete value[field]; });
}
rejectV2((value) => { value.extra = true; });
rejectV2((value) => { value.repository.extra = true; });
rejectV2((value) => { value.execution.extra = true; });
rejectV2((value) => { value.execution.isolation.extra = true; });
rejectV2((value) => { value.schema_version = 1; });
rejectV2((value) => { value.execution = authorization().execution; });
rejectV2((value) => { value.authorization_schema_sha256 = sha("f"); });
rejectV2((value) => { value.isolation_contract_sha256 = sha("f"); });
rejectV2((value) => { value.contract_sha256.budgets = sha("f"); });
rejectV2((value) => { value.candidate_identity_sha256 = sha("f"); });
rejectV2((value) => { value.manifest_sha256 = sha("f"); });
rejectV2((value) => { value.compatibility_support_sha256[SUPPORT_PATHS[0]] = sha("f"); });
rejectV2((value) => { value.route_source_sha256[ROUTE_PATHS[0]] = sha("f"); });
rejectV2((value) => { value.repository.root = "/private/tmp/aifinder"; });
rejectV2((value) => { value.repository.remote_main = "f".repeat(40); });
rejectV2((value) => { value.one_use_authorization_sha256 = sha("f"); });
rejectV2((value) => { value.created_at = "2026-08-21T12:00:00Z"; });
rejectV2((value) => { value.execution.isolation.origin = "https://other.supabase.co"; });
rejectV2((value) => { value.execution.isolation.origin = V2_ISOLATION_CONTRACT.excluded_origin; });
rejectV2((value) => {
  value.execution.isolation.project_ref = V2_ISOLATION_CONTRACT.excluded_project_ref;
  value.execution.isolation.origin = V2_ISOLATION_CONTRACT.excluded_origin;
});
rejectV2((value) => { value.execution.isolation.origin += "/"; });
rejectV2((value) => { value.execution.isolation.project_ref = "A"; });
rejectV2((value) => { value.execution.isolation.validation_run_id = "0".repeat(36); });
rejectV2((value) => { value.execution.provider_cleanup_policy = "DELETE"; });
rejectV2((value) => { value.execution.environment_keys.reverse(); });
rejectV2((value) => { value.execution.branch_name += "-other"; });
rejectV2((value) => { value.execution.journal_directory += "-other"; });
rejectV2((value) => { value.execution.storage_name = "admin/other.png"; });
rejectV2((value) => { value.execution.temporary_commit_sha = sha("f"); });
rejectV2((value) => { delete value.contract_sha256.action_costs; }, (reviewed) => {
  delete reviewed.official_runtime.contract_sha256_v2.action_costs;
});
rejectV2(() => {}, (reviewed) => { delete reviewed.official_runtime.contract_sha256_v2; });
rejectV2(() => {}, (reviewed) => {
  reviewed.official_runtime.contract_sha256_v2 =
    structuredClone(reviewed.official_runtime.contract_sha256);
});
rejectV2((value) => { value.contract_sha256.extra = sha("a"); }, (reviewed) => {
  reviewed.official_runtime.contract_sha256_v2.extra = sha("a");
});
rejectV2((value) => { value.contract_sha256.action_costs = sha("f"); });
rejectV2((value) => { value.contract_sha256.action_costs = "invalid"; }, (reviewed) => {
  reviewed.official_runtime.contract_sha256_v2.action_costs = "invalid";
});
rejectV2(() => {}, (reviewed) => {
  reviewed.official_runtime.contract_sha256 =
    structuredClone(reviewed.official_runtime.contract_sha256_v2);
  delete reviewed.official_runtime.contract_sha256_v2;
});
// Both maps agree after mutation; only the signed one-use binding rejects replay.
for (const key of ["action_costs", "budgets"]) {
  rejectV2((value) => { value.contract_sha256[key] = sha("f"); }, (reviewed) => {
    reviewed.official_runtime.contract_sha256_v2[key] = sha("f");
  }, false);
}
rejectV2((value) => { value.isolation_contract_sha256 = sha("f"); }, (reviewed) => {
  reviewed.official_runtime.isolation_contract_sha256 = sha("f");
}, false);
process.stdout.write(`PASS_PR4_V2_PREIMPORT closed19=true repository11=true execution13=true isolation10=true v1_contract_keys=6 v2_contract_keys=7 negatives=${v2Negatives} real_effects=0\n`);

process.stdout.write(
  "PASS_ADMIN_V1_OFFICIAL_SUPERVISOR assertions=7 current_baseline=true exact_class=true pre_import_node_primitives_only=true failures=0 internal_failures=0\n",
);
