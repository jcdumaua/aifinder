import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import * as isolationModule from "./admin-v1-official-isolation.mjs";
import {
  createAdminV1OfficialAuthorizationRecord,
} from "./admin-v1-official-authorization.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
} from "./admin-v1-official-runtime.mjs";

const HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
const RUN_ID = "44444444-4444-4444-8444-444444444444";
const sha = (value) => value.repeat(64);
const V1_CONTRACT_KEYS = [
  "budgets", "deferred_routes", "environment_names", "official_ledger",
  "qualification_ledger", "target_routes",
];
const V2_CONTRACT_KEYS = ["action_costs", ...V1_CONTRACT_KEYS];
// Independently derived from the approved amendment and preserved v1 objects.
const EXPECTED_V2_CONTRACT_SHA256 = {
  ...structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
  action_costs: "471fd0bf4977c76e784220275246f2f73632745494723bd158f7c246760a3e36",
  budgets: "55c557dec8fd8f7a54426bc2f8ac5647a2f3d7389c2239baef5b4efc076075d6",
};
const repository = {
  root: "/Users/jamescarlodumaua/aifinder",
  branch: "main",
  head: HEAD,
  origin_main: HEAD,
  remote_main: HEAD,
  ahead: 0,
  behind: 0,
  index_empty: true,
  worktree_count: 1,
  status_sha256: sha("a"),
  remote_repository: "jcdumaua/aifinder",
};
const support = Object.fromEntries([
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
].map((entry) => [entry, sha("b")]));
const routes = Object.fromEntries([
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
  "lib/admin-v1-launch-scope.ts",
  "proxy.ts",
].map((entry) => [entry, sha("c")]));
const reviewedPolicy = {
  candidate: {
    candidate_identity_sha256: sha("1"),
    manifest_sha256: sha("2"),
  },
  compatibility_support_sha256: support,
  official_runtime: {
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
    authorization_schema_sha256: sha("3"),
    route_source_sha256: routes,
    contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    repository_contract: {
      root: repository.root,
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
  },
};
const execution = {
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
  temporary_commit_sha: "d".repeat(40),
  environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
};
const request = {
  published_head: HEAD,
  authorization_id_sha256: sha("4"),
  one_use_authorization_sha256: sha("5"),
  review_approval_sha256: sha("6"),
  supervisor_sha256: sha("7"),
  supervisor_policy_sha256: sha("8"),
  created_at: "2026-08-21T12:00:00.000Z",
  expires_at: "2026-08-22T12:00:00.000Z",
  run_id: RUN_ID,
  execution,
};

const generated = await createAdminV1OfficialAuthorizationRecord({
  inspect_repository: async () => structuredClone(repository),
  inspect_temporary_commit: async () => ({
    commit_sha: execution.temporary_commit_sha,
    parent_sha: HEAD,
    tree_sha: "e".repeat(40),
  }),
  reviewed_policy: reviewedPolicy,
  request,
  now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
});
assert.equal(generated.repository.head, HEAD);
assert.equal(generated.repository.remote_main, HEAD);
assert.equal(generated.review_approval_sha256, request.review_approval_sha256);
assert.equal(generated.schema_version, 1);
assert.equal(Object.keys(generated).length, 18);
assert.equal(Object.keys(generated.execution).length, 11);
assert.deepEqual(Object.keys(generated.contract_sha256).sort(), V1_CONTRACT_KEYS);
assert.deepEqual(generated.contract_sha256, ADMIN_V1_OFFICIAL_CONTRACT_SHA256);

await assert.rejects(
  createAdminV1OfficialAuthorizationRecord({
    inspect_repository: async () => structuredClone(repository),
    inspect_temporary_commit: async () => ({
      commit_sha: execution.temporary_commit_sha,
      parent_sha: HEAD,
      tree_sha: "e".repeat(40),
    }),
    reviewed_policy: reviewedPolicy,
    request: { ...request, published_head: "f".repeat(40) },
    now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
  }),
  (error) =>
    error?.code === "OFFICIAL_AUTHORIZATION_GENERATOR_REPOSITORY_MISMATCH",
);

await assert.rejects(
  createAdminV1OfficialAuthorizationRecord({
    inspect_repository: async () => structuredClone(repository),
    inspect_temporary_commit: async () => ({
      commit_sha: execution.temporary_commit_sha,
      parent_sha: "f".repeat(40),
      tree_sha: "e".repeat(40),
    }),
    reviewed_policy: reviewedPolicy,
    request,
    now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
  }),
  (error) =>
    error?.code ===
      "OFFICIAL_AUTHORIZATION_GENERATOR_TEMPORARY_COMMIT_MISMATCH",
);

const v2Policy = structuredClone(reviewedPolicy);
v2Policy.official_runtime.contract_sha256_v2 =
  structuredClone(EXPECTED_V2_CONTRACT_SHA256);
v2Policy.official_runtime.authorization_schema_sha256 =
  "0c0abad46d6ac7e31d24d3c75b56765b52d8819a9ffd31a19200b67f3c22c3a4";
v2Policy.official_runtime.isolation_contract_sha256 =
  isolationModule.ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256 ?? sha("9");
const v2Request = structuredClone(request);
v2Request.schema_version = 2;
v2Request.one_use_authorization_sha256 = sha("f");
v2Request.execution.environment_keys = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF"];
v2Request.execution.provider_cleanup_policy = "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1";
v2Request.execution.isolation = { mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1",
  project_ref: "producer-synthetic-project", origin: "https://producer-synthetic-project.supabase.co",
  provisioning_receipt_sha256: sha("a"), schema_contract_sha256: sha("b"),
  credential_bundle_path: `${execution.journal_directory}/isolated-credentials.json`,
  credential_bundle_provenance_sha256: sha("c"), validation_run_id: RUN_ID,
  expected_preview_project_id: execution.preview_project_id, expected_preview_team_id: execution.preview_team_id };
const generateV2 = (overrides = {}) => createAdminV1OfficialAuthorizationRecord({
  inspect_repository: async () => structuredClone(repository),
  inspect_temporary_commit: async () => ({ commit_sha: execution.temporary_commit_sha,
    parent_sha: HEAD, tree_sha: "e".repeat(40) }),
  reviewed_policy: v2Policy, request: v2Request,
  now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"), ...overrides,
});
const v2 = await generateV2();
const currentSourcePolicy = structuredClone(v2Policy);
currentSourcePolicy.official_runtime.route_source_sha256["app/api/admin/session/route.ts"] =
  "a15caa4c0b9b586894a06af90e88f11ac1e99a70f6e1acb8b25f1ee77e4a30ce";
const currentSourceAuthorization = await generateV2({ reviewed_policy: currentSourcePolicy });
assert.equal(currentSourceAuthorization.route_source_sha256["app/api/admin/session/route.ts"],
  "a15caa4c0b9b586894a06af90e88f11ac1e99a70f6e1acb8b25f1ee77e4a30ce");
assert.notEqual(currentSourceAuthorization.one_use_authorization_sha256, v2.one_use_authorization_sha256);
assert.equal(v2.schema_version, 2);
assert.equal(Object.keys(v2).length, 19);
assert.equal(Object.keys(v2.repository).length, 11);
assert.equal(Object.keys(v2.execution).length, 13);
assert.equal(Object.keys(v2.execution.isolation).length, 10);
assert.equal(v2.isolation_contract_sha256, v2Policy.official_runtime.isolation_contract_sha256);
assert.deepEqual(Object.keys(v2.contract_sha256).sort(), V2_CONTRACT_KEYS);
assert.deepEqual(v2.contract_sha256, EXPECTED_V2_CONTRACT_SHA256);
const { one_use_authorization_sha256: ignored, ...unsigned } = v2;
assert.equal(v2.one_use_authorization_sha256, sha256Hex(canonicalJson({
  domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...unsigned,
})));
assert.notEqual(v2.one_use_authorization_sha256, v2Request.one_use_authorization_sha256);
for (const mutate of [
  (record) => { record.schema_version = 3; },
  (record) => { delete record.execution.isolation; },
  (record) => { record.execution.extra = true; },
  (record) => { record.execution.isolation.origin = "https://other-project.supabase.co"; },
]) {
  const invalid = structuredClone(v2Request); mutate(invalid);
  await assert.rejects(generateV2({ request: invalid }));
}
const unreviewedPolicy = structuredClone(v2Policy);
unreviewedPolicy.official_runtime.isolation_contract_sha256 = sha("f");
await assert.rejects(generateV2({ reviewed_policy: unreviewedPolicy }));
const generateV1 = (policyValue) => createAdminV1OfficialAuthorizationRecord({
  inspect_repository: async () => structuredClone(repository),
  inspect_temporary_commit: async () => ({
    commit_sha: execution.temporary_commit_sha, parent_sha: HEAD,
    tree_sha: "e".repeat(40),
  }),
  reviewed_policy: policyValue, request,
  now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
});
for (const mutate of [
  (policyValue) => { policyValue.official_runtime.contract_sha256.action_costs = sha("a"); },
  (policyValue) => { delete policyValue.official_runtime.contract_sha256.budgets; },
]) {
  const invalid = structuredClone(reviewedPolicy);
  mutate(invalid);
  await assert.rejects(generateV1(invalid),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_GENERATOR_REPOSITORY_MISMATCH");
}
for (const mutate of [
  (policyValue) => { delete policyValue.official_runtime.contract_sha256_v2; },
  (policyValue) => {
    policyValue.official_runtime.contract_sha256_v2 =
      structuredClone(policyValue.official_runtime.contract_sha256);
  },
  (policyValue) => { policyValue.official_runtime.contract_sha256_v2.extra = sha("a"); },
  (policyValue) => { policyValue.official_runtime.contract_sha256_v2.action_costs = sha("f"); },
  (policyValue) => { policyValue.official_runtime.contract_sha256_v2.budgets = sha("f"); },
]) {
  const invalid = structuredClone(v2Policy);
  mutate(invalid);
  await assert.rejects(generateV2({ reviewed_policy: invalid }), (error) =>
    error?.code === "OFFICIAL_AUTHORIZATION_GENERATOR_REPOSITORY_MISMATCH" ||
    error?.code === "OFFICIAL_AUTHORIZATION_INVALID");
}
for (const mutate of [
  (fields) => { fields.contract_sha256.action_costs = sha("f"); },
  (fields) => { fields.contract_sha256.budgets = sha("f"); },
  (fields) => { fields.isolation_contract_sha256 = sha("f"); },
]) {
  const changed = structuredClone(unsigned);
  mutate(changed);
  assert.notEqual(v2.one_use_authorization_sha256, sha256Hex(canonicalJson({
    domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...changed,
  })));
}
console.log("PASS_ADMIN_V1_OFFICIAL_AUTHORIZATION_GENERATOR assertions=35 v1_preserved=true v2_complete=true versioned_contracts=true published_head_bound=true moved_head_rejected=true live_records_created=0");
