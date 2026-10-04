import { ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2, ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2 } from "./admin-v1-official-runtime.mjs";
import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import { createAdminV1OfficialAuthorizationRecord } from "./admin-v1-official-authorization.mjs";
import { ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256 } from "./admin-v1-official-isolation.mjs";
import * as officialRunnerModule from "./nonproduction-qualification-runner.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
} from "./admin-v1-official-runtime.mjs";
import {
  concreteTemporaryCommitBlobMatches,
  concreteTemporaryCommitMetadataMatches,
  concreteTemporaryCommitParentMatches,
  createConcreteRunnerDependencies,
  dispatchAdminV1OfficialRunner,
  dispatchConcreteQualificationRunner,
} from "./nonproduction-qualification-runner.mjs";

const RUN_ID = "22222222-2222-4222-8222-222222222222";
const PUBLISHED_HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
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
function record() {
  return {
    schema_version: 1,
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
    authorization_id_sha256: "1".repeat(64),
    one_use_authorization_sha256: "2".repeat(64),
    review_approval_sha256: "d".repeat(64),
    candidate_identity_sha256: "3".repeat(64),
    manifest_sha256: "4".repeat(64),
    supervisor_sha256: "5".repeat(64),
    supervisor_policy_sha256: "6".repeat(64),
    authorization_schema_sha256: "7".repeat(64),
    compatibility_support_sha256: Object.fromEntries(
      SUPPORT_PATHS.map((entry, index) => [entry, `${index + 8}`.repeat(64).slice(0, 64)]),
    ),
    route_source_sha256: Object.fromEntries(
      ROUTE_PATHS.map((entry) => [entry, "a".repeat(64)]),
    ),
    contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    created_at: "2026-08-21T12:00:00.000Z",
    expires_at: "2026-08-22T12:00:00.000Z",
    run_id: RUN_ID,
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: PUBLISHED_HEAD,
      origin_main: PUBLISHED_HEAD,
      remote_main: PUBLISHED_HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: "b".repeat(64),
      remote_repository: "jcdumaua/aifinder",
    },
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
      temporary_commit_sha: "c".repeat(40),
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    },
  };
}

function trust(authorization) {
  const bytes = Buffer.from(`${canonicalJson(authorization)}\n`, "utf8");
  return Object.freeze({
    verified: true,
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
    repository_observation: structuredClone(authorization.repository),
    authorization: structuredClone(authorization),
    authorization_bytes: bytes,
    authorization_sha256: sha256Hex(bytes),
    credential_source_policy: structuredClone(
      ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
    ),
    supervisor_sha256: authorization.supervisor_sha256,
    supervisor_policy_sha256: authorization.supervisor_policy_sha256,
  });
}

function dependencies({ candidateMismatch = false, runtimeErrorCode = null,
  authorization = record(), runtimeResult = null, priorStatus = "ABSENT" } = {}) {
  const calls = [];
  const outputs = [];
  return {
    calls,
    outputs,
    now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
    verifyCandidate() {
      calls.push("verifyCandidate");
      return {
        verified: true,
        source_policy_verified: true,
        activation_source_policy_verified: true,
        membership_exact: true,
        legacy_imports: 0,
        live_entrypoints: 4,
        candidate_identity_sha256: candidateMismatch
          ? "f".repeat(64)
          : authorization.candidate_identity_sha256,
        manifest_sha256: authorization.manifest_sha256,
        member_count: 35,
      };
    },
    inspectRepository() {
      calls.push("inspectRepository");
      return structuredClone(authorization.repository);
    },
    hashCompatibilitySupport(relativePath) {
      calls.push(`support:${relativePath}`);
      return authorization.compatibility_support_sha256[relativePath];
    },
    hashOfficialRouteSource(relativePath) {
      calls.push(`route:${relativePath}`);
      return authorization.route_source_sha256[relativePath];
    },
    hashOfficialAuthorizationSchema() {
      calls.push("authorizationSchema");
      return authorization.authorization_schema_sha256;
    },
    verifyTemporaryCommit() {
      calls.push("verifyTemporaryCommit");
      return { verified: true };
    },
    verifyNoPriorOfficialRecovery() {
      calls.push("verifyNoPriorOfficialRecovery");
      return { status: priorStatus };
    },
    prepareOfficialExecutionContext() {
      calls.push("prepareOfficialExecutionContext");
      return { journal: Object.freeze({}) };
    },
    readOfficialCredentials(boundAuthorization) {
      calls.push("readOfficialCredentials");
      if (boundAuthorization.schema_version === 2) {
        assert.equal(boundAuthorization.execution.isolation.project_ref, "offline-pr4-v2");
        assert.equal(boundAuthorization.execution.isolation.origin, "https://offline-pr4-v2.supabase.co");
        calls.push("readIsolatedCredentials");
      }
      return { admin_password: Buffer.from("synthetic"), admin_session_secret: Buffer.from("synthetic") };
    },
    runAuthorizedOfficialRuntime() {
      calls.push("runAuthorizedOfficialRuntime");
      if (runtimeErrorCode !== null) {
        const error = new Error("synthetic internal runtime failure");
        error.code = runtimeErrorCode;
        throw error;
      }
      if (runtimeResult !== null) return structuredClone(runtimeResult);
      if (authorization.schema_version === 2) return retainedRuntimeResult(authorization);
      return {
        classification: "OFFICIAL_RUNTIME_COMPLETE",
        official_requests: 20,
        qualification_requests: 6,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
        zero_residual_owned_state: true,
      };
    },
    writeOutput(value) {
      outputs.push(structuredClone(value));
      calls.push(`output:${value.code}`);
    },
  };
}

const passing = dependencies();
const passingAuthorization = record();
const result = await dispatchAdminV1OfficialRunner(
  [
    "--run-admin-v1-official",
    "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ],
  passing,
  trust(passingAuthorization),
);
assert.deepEqual(result, { exit_code: 0, code: "OFFICIAL_RUNTIME_COMPLETE" });
assert.ok(
  passing.calls.indexOf("verifyNoPriorOfficialRecovery") <
    passing.calls.indexOf("readOfficialCredentials"),
);
assert.ok(
  passing.calls.indexOf("verifyTemporaryCommit") <
    passing.calls.indexOf("readOfficialCredentials"),
);
assert.equal(passing.calls.at(-1), "output:OFFICIAL_RUNTIME_COMPLETE");
assert.deepEqual(passing.outputs, [{
  status: "PASS", code: "OFFICIAL_RUNTIME_COMPLETE", qualification_requests: 6,
  official_requests: 20, runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0,
}]);

const mismatched = dependencies({ candidateMismatch: true });
const denied = await dispatchAdminV1OfficialRunner(
  [
    "--run-admin-v1-official",
    "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ],
  mismatched,
  trust(record()),
);
assert.deepEqual(denied, { exit_code: 1, code: "OFFICIAL_CANDIDATE_MISMATCH" });
assert.equal(mismatched.calls.includes("readOfficialCredentials"), false);
assert.equal(mismatched.calls.includes("runAuthorizedOfficialRuntime"), false);

const classifiedEnvironmentFailure = dependencies({
  runtimeErrorCode: "OFFICIAL_ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
});
const classifiedEnvironmentFailureResult = await dispatchAdminV1OfficialRunner(
  [
    "--run-admin-v1-official",
    "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ],
  classifiedEnvironmentFailure,
  trust(record()),
);
assert.deepEqual(classifiedEnvironmentFailureResult, {
  exit_code: 1,
  code: "OFFICIAL_RUNTIME_FAILED_CLOSED",
});
assert.equal(
  classifiedEnvironmentFailure.calls.at(-1),
  "output:OFFICIAL_RUNTIME_FAILED_CLOSED",
);

const routed = dependencies();
const routedResult = await dispatchConcreteQualificationRunner(
  [
    "--run-admin-v1-official",
    "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ],
  routed,
  trust(record()),
);
assert.equal(routedResult.code, "OFFICIAL_RUNTIME_COMPLETE");

const currentRoutePath = "app/api/admin/session/route.ts";
const currentRouteDigest = createConcreteRunnerDependencies({ repositoryRoot: new URL("../../", import.meta.url).pathname.replace(/\/$/u, "") })
  .hashOfficialRouteSource(currentRoutePath);
const reviewedRouteBinding = "a15caa4c0b9b586894a06af90e88f11ac1e99a70f6e1acb8b25f1ee77e4a30ce";
for (const variant of ["exact", "tampered", "historical_binding"]) {
  const auth = record();
  auth.route_source_sha256[currentRoutePath] = variant === "historical_binding"
    ? "ad22481088d2de333714c6d3d72330735ff759eea1aafaf937b713b817e68627" : reviewedRouteBinding;
  const deps = dependencies({ authorization: auth });
  const originalHash = deps.hashOfficialRouteSource;
  deps.hashOfficialRouteSource = relativePath => relativePath === currentRoutePath
    ? variant === "tampered" ? "f".repeat(64) : currentRouteDigest
    : originalHash(relativePath);
  const result = await dispatchAdminV1OfficialRunner(["--run-admin-v1-official", "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`], deps, trust(auth));
  assert.equal(result.code, variant === "exact" ? "OFFICIAL_RUNTIME_COMPLETE" : "OFFICIAL_ROUTE_SOURCE_MISMATCH");
  assert.equal(deps.calls.includes("readOfficialCredentials"), variant === "exact");
}

function v2Record() {
  const value = record();
  value.schema_version = 2;
  value.contract_sha256 = {
    ...structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    action_costs: "471fd0bf4977c76e784220275246f2f73632745494723bd158f7c246760a3e36",
    budgets: "55c557dec8fd8f7a54426bc2f8ac5647a2f3d7389c2239baef5b4efc076075d6",
  };
  value.isolation_contract_sha256 = ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256;
  value.execution.environment_keys = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF"];
  value.execution.provider_cleanup_policy = "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1";
  value.execution.isolation = {
    mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1", project_ref: "offline-pr4-v2",
    origin: "https://offline-pr4-v2.supabase.co", provisioning_receipt_sha256: "1".repeat(64),
    schema_contract_sha256: "2".repeat(64),
    credential_bundle_path: `${value.execution.journal_directory}/isolated-credentials.json`,
    credential_bundle_provenance_sha256: "3".repeat(64), validation_run_id: value.run_id,
    expected_preview_project_id: value.execution.preview_project_id,
    expected_preview_team_id: value.execution.preview_team_id,
  };
  const { one_use_authorization_sha256: ignored, ...fields } = value;
  void ignored;
  value.one_use_authorization_sha256 = sha256Hex(canonicalJson({
    domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...fields,
  }));
  return value;
}
const v2Template = v2Record();
const reviewedV2Policy = {
  candidate: { candidate_identity_sha256: v2Template.candidate_identity_sha256,
    manifest_sha256: v2Template.manifest_sha256 },
  compatibility_support_sha256: v2Template.compatibility_support_sha256,
  official_runtime: {
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
    authorization_schema_path: "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json",
    authorization_schema_sha256: v2Template.authorization_schema_sha256,
    isolation_contract_sha256: v2Template.isolation_contract_sha256,
    route_source_sha256: v2Template.route_source_sha256,
    contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    contract_sha256_v2: v2Template.contract_sha256,
    credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
    access_mode: "SELF_PROJECT_OIDC",
    repository_contract: {
      root: v2Template.repository.root, branch: "main", ahead: 0, behind: 0,
      index_empty: true, worktree_count: 1, remote_repository: "jcdumaua/aifinder",
      head_binding: "AUTHORIZATION_PUBLISHED_HEAD", origin_main_binding: "SAME_AS_HEAD",
      remote_main_binding: "SAME_AS_HEAD", status_binding: "AUTHORIZATION_STATUS_SHA256",
    },
  },
};
const isolatedV2 = await createAdminV1OfficialAuthorizationRecord({
  inspect_repository: () => structuredClone(v2Template.repository),
  inspect_temporary_commit: () => ({ commit_sha: v2Template.execution.temporary_commit_sha,
    parent_sha: v2Template.repository.head, tree_sha: "e".repeat(40) }),
  reviewed_policy: reviewedV2Policy,
  request: { ...v2Template, published_head: v2Template.repository.head },
  now_epoch_ms: Date.parse("2026-08-21T12:00:00.000Z"),
});
assert.equal(Object.keys(isolatedV2).length, 19);
const isolatedDependencies = dependencies({ authorization: isolatedV2 });
const isolatedResult = await dispatchAdminV1OfficialRunner([
  "--run-admin-v1-official", "--authorization",
  `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
], isolatedDependencies, trust(isolatedV2));
assert.deepEqual(isolatedResult, { exit_code: 0, code: "RETENTION_COMPLETE" },
  "COMPLETE_V2_TRUST_PREEFFECT_AND_EXACT_RETENTION_RECEIPT");
assert.deepEqual(isolatedDependencies.outputs, [{
  status: "PASS", code: "RETENTION_COMPLETE", qualification_requests: 6,
  official_requests: 20, runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0,
  zero_residual_owned_state: false, retention: retainedRuntimeResult(isolatedV2).retention,
}]);
assert(isolatedDependencies.calls.indexOf("verifyNoPriorOfficialRecovery") <
  isolatedDependencies.calls.indexOf("readIsolatedCredentials"));
assert(isolatedDependencies.calls.indexOf("prepareOfficialExecutionContext") <
  isolatedDependencies.calls.indexOf("verifyCandidate"));
for (const change of [
  (value) => { value.extra = true; },
  (value) => { value.execution.isolation.origin = "https://other.supabase.co"; },
  (value) => { value.one_use_authorization_sha256 = "f".repeat(64); },
  (value) => { value.isolation_contract_sha256 = "f".repeat(64); },
  (value) => { value.schema_version = 1; },
]) {
  const invalid = v2Record(); change(invalid);
  const blockedDependencies = dependencies({ authorization: invalid });
  const blocked = await dispatchAdminV1OfficialRunner([
    "--run-admin-v1-official", "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ], blockedDependencies, trust(invalid));
  assert.equal(blocked.exit_code, 1);
  assert.equal(blockedDependencies.calls.includes("prepareOfficialExecutionContext"), false);
  assert.equal(blockedDependencies.calls.includes("readOfficialCredentials"), false);
  assert.equal(blockedDependencies.calls.includes("runAuthorizedOfficialRuntime"), false);
}
function retainedRuntimeResult(authorization) {
  return {
    classification: "RETENTION_COMPLETE", official_requests: 20, qualification_requests: 6,
    runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0,
    zero_residual_owned_state: false,
    retention: {
      policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1", phase: "COMPLETE",
      deployment_id: "dpl_RetainedV2",
      environment_record_ids: ["env-retained-1", "env-retained-2", "env-retained-3",
        "env-retained-4", "env-retained-5", "env-retained-6", "env-retained-7"],
      environment_keys: [...authorization.execution.environment_keys],
      data_zero_residual: true, external_retained_exact: true, unrelated_preserved: true,
    },
  };
}
let retentionNegatives = 0;
for (const mutate of [
  (value) => { value.classification = "OFFICIAL_RUNTIME_COMPLETE"; },
  (value) => { value.zero_residual_owned_state = true; },
  (value) => { delete value.retention; },
  (value) => { value.retention.extra = true; },
  (value) => { value.retention.phase = "COMMITTED"; },
  (value) => { value.retention.policy = "DELETE"; },
  (value) => { value.retention.deployment_id = ""; },
  (value) => { value.retention.environment_record_ids[6] = value.retention.environment_record_ids[0]; },
  (value) => { value.retention.environment_record_ids.pop(); },
  (value) => { value.retention.environment_record_ids.push("env-retained-8"); },
  (value) => { value.retention.environment_record_ids[0] = ""; },
  (value) => { value.retention.environment_record_ids[0] = "invalid id"; },
  (value) => { value.retention.environment_record_ids[0] = "a".repeat(129); },
  (value) => { value.retention.environment_keys.reverse(); },
  (value) => { value.retention.environment_keys = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"]; },
  (value) => { value.retention.data_zero_residual = false; },
  (value) => { value.retention.external_retained_exact = false; },
  (value) => { value.retention.unrelated_preserved = false; },
  (value) => { value.official_requests = 19; },
  (value) => { value.qualification_requests = 5; },
  (value) => { value.runtime_sessions = 2; },
  (value) => { value.runtime_retries = 1; },
  (value) => { value.runtime_replays = 1; },
]) {
  const invalid = retainedRuntimeResult(isolatedV2);
  mutate(invalid);
  const bounded = dependencies({ authorization: isolatedV2, runtimeResult: invalid });
  assert.deepEqual(await dispatchAdminV1OfficialRunner([
    "--run-admin-v1-official", "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ], bounded, trust(isolatedV2)), { exit_code: 1, code: "OFFICIAL_RUNTIME_FAILED_CLOSED" });
  assert.equal(bounded.outputs.at(-1).status, "FAIL");
  retentionNegatives++;
}
const v1Retained = dependencies({ runtimeResult: retainedRuntimeResult(isolatedV2) });
assert.deepEqual(await dispatchAdminV1OfficialRunner([
  "--run-admin-v1-official", "--authorization",
  `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
], v1Retained, trust(record())), { exit_code: 1, code: "OFFICIAL_RUNTIME_FAILED_CLOSED" });
for (const [status, code] of [
  ["SPENT", "OFFICIAL_AUTHORIZATION_SPENT"],
  ["RECOVERY_PENDING", "OFFICIAL_PRIOR_RECOVERY_PENDING"],
]) {
  const prior = dependencies({ authorization: isolatedV2, priorStatus: status });
  assert.deepEqual(await dispatchAdminV1OfficialRunner([
    "--run-admin-v1-official", "--authorization",
    `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`,
  ], prior, trust(isolatedV2)), { exit_code: 1, code });
  assert.equal(prior.calls.includes("readOfficialCredentials"), false);
  assert.equal(prior.calls.includes("runAuthorizedOfficialRuntime"), false);
}
assert.equal(typeof officialRunnerModule.classifyAdminV1OfficialPriorJournal, "function");
const classifyPrior = officialRunnerModule.classifyAdminV1OfficialPriorJournal;
assert.deepEqual(classifyPrior(null, 1), { status: "ABSENT" });
assert.deepEqual(classifyPrior({ retired: true }, 1), { status: "RETIRED" });
assert.deepEqual(classifyPrior({ state: { lifecycle: "CLEANUP_COMPLETE", zero_residual: true } }, 1),
  { status: "SPENT" });
const completedState = {
  lifecycle: "RETENTION_COMPLETE", zero_residual: false, retired: true,
  token_spent: true, runtime_sessions: 1,
  last_completed_qualification_ordinal: 6, last_completed_official_ordinal: 20,
  cleanup: ["RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"],
  retention: retainedRuntimeResult(isolatedV2).retention,
  owned: {
    deployment_id: "dpl_RetainedV2",
    environment_record_ids: ["env-retained-1", "env-retained-2", "env-retained-3",
      "env-retained-4", "env-retained-5", "env-retained-6", "env-retained-7"],
  },
};
assert.deepEqual(classifyPrior({ retired: true, value: { state: completedState } }, 2),
  { status: "SPENT" });
const committedState = structuredClone(completedState);
committedState.retired = false;
committedState.lifecycle = "CLEANUP_PENDING";
committedState.retention.phase = "COMMITTED";
committedState.retention.data_zero_residual = false;
committedState.retention.external_retained_exact = false;
committedState.retention.unrelated_preserved = false;
assert.deepEqual(classifyPrior({ retired: false, value: { state: committedState } }, 2),
  { status: "RECOVERY_PENDING" });
const malformedState = structuredClone(completedState);
malformedState.zero_residual = true;
assert.deepEqual(classifyPrior({ retired: true, value: { state: malformedState } }, 2),
  { status: "MISMATCH" });
const unretiredState = structuredClone(completedState);
unretiredState.retired = false;
assert.deepEqual(classifyPrior({ retired: false, value: { state: unretiredState } }, 2),
  { status: "MISMATCH" });
console.log(`PASS_PR4_V2_RUNNER full_trust=true pre_effect=true isolated_branch=true invalid_before_context=5 retention_receipt_negatives=${retentionNegatives} prior_state_entry_denied=2 real_effects=0`);

const directInvalid = v2Record();
delete directInvalid.manifest_sha256;
let directBundleReads = 0;
const directDependencies = createConcreteRunnerDependencies({
  repositoryRoot: new URL("../../", import.meta.url).pathname.replace(/\/$/u, ""),
  nowEpochMs: Date.parse("2026-08-21T12:00:00.000Z"),
  readCredentialEnvironment() { throw new Error("LEGACY_CREDENTIAL_SOURCE_FORBIDDEN"); },
  async readOfficialBundle() { directBundleReads++; throw new Error("BUNDLE_READ_FORBIDDEN"); },
});
await assert.rejects(() => directDependencies.readOfficialCredentials(
  directInvalid, ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
), (error) => error?.code === "OFFICIAL_AUTHORIZATION_INVALID",
"INVALID_V2_REJECTED_BEFORE_DIRECTORY_AND_BUNDLE_READ");
assert.equal(directBundleReads, 0);

const commit = "1".repeat(40);
const publishedHead = "2".repeat(40);
const publishedHeadTree = "3".repeat(40);
const alteredTree = "4".repeat(40);

assert.equal(concreteTemporaryCommitMetadataMatches({
  changedPaths: [],
  expectedPaths: [],
  temporaryTreeSha: alteredTree,
  publishedHeadTreeSha: publishedHeadTree,
}), false);
console.log("ALTERED_TREE_EMPTY_CHILD_REJECTED=PASS");

assert.equal(concreteTemporaryCommitMetadataMatches({
  changedPaths: [
    "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-wrapper-candidate.sh",
  ],
  expectedPaths: [],
  temporaryTreeSha: alteredTree,
  publishedHeadTreeSha: publishedHeadTree,
}), false);
console.log("PROTECTED_DRAFT_COMMIT_REJECTED=PASS");

assert.equal(concreteTemporaryCommitMetadataMatches({
  changedPaths: ["a.txt"],
  expectedPaths: ["a.txt"],
  temporaryTreeSha: alteredTree,
  publishedHeadTreeSha: publishedHeadTree,
}), true);
assert.equal(
  concreteTemporaryCommitBlobMatches(
    Buffer.from("candidate\n"),
    Buffer.from("candidate\n"),
  ),
  true,
);
assert.equal(
  concreteTemporaryCommitBlobMatches(
    Buffer.from("candidate\n"),
    Buffer.from("different\n"),
  ),
  false,
);
console.log("NONEMPTY_EXACT_PATH_BLOB_BEHAVIOR_UNCHANGED=PASS");

assert.equal(
  concreteTemporaryCommitParentMatches(
    [commit, publishedHead, "5".repeat(40)],
    commit,
    publishedHead,
  ),
  false,
);
assert.equal(
  concreteTemporaryCommitParentMatches(
    [commit, publishedHead],
    commit,
    publishedHead,
  ),
  true,
);
console.log("SINGLE_PARENT_RULE_UNCHANGED=PASS");

assert.equal(concreteTemporaryCommitMetadataMatches({
  changedPaths: [],
  expectedPaths: [],
  temporaryTreeSha: publishedHeadTree,
  publishedHeadTreeSha: publishedHeadTree,
}), true);
console.log("EMPTY_CHILD_CLEAN_REPOSITORY=PASS");
console.log("EMPTY_CHILD_HEAD_TREE_EQUALITY=PASS");

console.log(
  "PASS_ADMIN_V1_OFFICIAL_RUNNER assertions=19 pre_effect_before_credentials=true operation_class_separate=true real_calls=0 failures=0 internal_failures=0",
);

function recoveryDocument(auth) {
  const ids = Array.from({ length: 7 }, (_, index) => `env-retained-${index + 1}`);
  return { schema_version: 1, identity: { authorization_id_sha256: auth.authorization_id_sha256, run_id: auth.run_id }, sequence: 4,
    state: { lifecycle: "RETENTION_PENDING", stage: "RETENTION_FINAL_VERIFICATION", token_spent: true,
      runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0,
      recovery_usage: Object.fromEntries(Object.keys(ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2).map(key => [key, 0])),
      last_attempted_qualification_ordinal: 6, last_completed_qualification_ordinal: 6,
      last_attempted_official_ordinal: 20, last_completed_official_ordinal: 20,
      owned: { local_temp_state: "local-historical-owned", remote_ref: `refs/heads/${auth.execution.branch_name}`, environment_record_ids: [...ids], deployment_id: "dpl_RetainedV2",
        submissions: [{ row_id: "submission-owned", version: "v1" }], tools: [{ row_id: "tool-owned", version: "v1" }],
        audit_rows: [{ row_id: "audit-owned", version: "v1" }], logo: { object_id: "logo-owned", version: "v1" } },
      effects: { submitted_tools: 3, tools: 2, audits: 9, approval_rpc: 1, logo_objects: 1, grant_prepare: 1, grant_revoke: 1 },
      evidence: [], failure: null, cleanup: ["RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"], zero_residual: false,
      retention: { policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1", phase: "COMMITTED", deployment_id: "dpl_RetainedV2",
        environment_record_ids: [...ids], environment_keys: [...auth.execution.environment_keys], data_zero_residual: true,
        external_retained_exact: false, unrelated_preserved: false } } };
}

function recoveryFilesystem(auth, document = recoveryDocument(auth)) {
  const root = auth.execution.journal_directory; const git = `${root}/.qualification-git-context`;
  const nodes = new Map(); const opened = new Map(); const operations = []; let next = 10;
  const directory = (name, names, mode) => nodes.set(name, { names, mode, inode: nodes.size + 1 });
  const file = (name, value, mode = 0o600) => nodes.set(name, { bytes: Buffer.from(value), mode, inode: nodes.size + 1 });
  directory(auth.repository.root, [".git"], 0o755);directory(`${auth.repository.root}/.git`, ["objects"], 0o755);
  directory(`${auth.repository.root}/.git/objects`, [], 0o755);directory(root, [], 0o700);
  file(`${root}/admin-v1-official-runtime-identity.json`, `${canonicalRecovery({schema_version:1,identity:document.identity})}\n`);
  file(`${root}/admin-v1-official-runtime-journal.json`, `${canonicalRecovery(document)}\n`);
  directory(git, ["HEAD", "config", "objects", "refs"], 0o500);directory(`${git}/objects`, [], 0o500);
  directory(`${git}/refs`, ["heads"], 0o500);directory(`${git}/refs/heads`, [], 0o500);
  file(`${git}/HEAD`, "ref: refs/heads/qualification-context\n", 0o400);
  file(`${git}/config`, "[core]\n\tbare = true\n\trepositoryformatversion = 0\n", 0o400);
  const metadata = (name) => {
    const node = nodes.get(name);if (!node) throw Object.assign(new Error("ABSENT"), { code: "ENOENT" });
    return { dev: 1, ino: node.inode, uid: node.uid ?? 501, gid: 20, nlink: node.nlink ?? 1, mode: node.mode,
      size: node.bytes?.length ?? 0, mtimeMs: 1, ctimeMs: node.ctime ?? 1, mtimeNs: "1", ctimeNs: String(node.ctime ?? 1),
      isFile: () => Boolean(node.bytes), isDirectory: () => Boolean(node.names), isSymbolicLink: () => node.symlink === true };
  };
  return { nodes, operations, filesystem: {
    constants: { O_RDONLY: 0, O_NOFOLLOW: 256 },
    lstatSync(name) { operations.push(["lstat", name]);return metadata(name); },
    realpathSync(name) { metadata(name);return nodes.get(name).realpath ?? name; },
    readdirSync(name) { return [...nodes.get(name).names]; },
    openSync(name, flags) { assert.equal(flags, 256);operations.push(["open", name]);metadata(name);const fd = next++;opened.set(fd, name);return fd; },
    fstatSync(fd) { return metadata(opened.get(fd)); },
    readFileSync(fd) { assert.equal(typeof fd, "number");return Buffer.from(nodes.get(opened.get(fd)).bytes); },
    closeSync(fd) { assert.equal(opened.delete(fd), true); },
  } };
}

const canonicalRecovery = canonicalJson;
const recoveryFlag = "--recover-admin-v1-official-retention";
const recoveryArgs = [recoveryFlag, "--authorization", `/Users/jamescarlodumaua/Downloads/admin-v1-official-${RUN_ID}.json`];
function recoveryTrust(auth, doc) {
  return { ...trust(auth), retention_recovery: { mode: "OFFICIAL_RETENTION_RECOVERY_V1",
    journal_sha256: sha256Hex(`${canonicalJson(doc)}\n`) } };
}
function recoveryDependencies(auth, doc = recoveryDocument(auth), { failedRead = false, drift = false, throwAfterCredentials = false, filesystemChange = null, forged = false, credentialDrift = false } = {}) {
  const deps = dependencies({ authorization: auth });let current = { retired: false, value: structuredClone(doc) };
  const sensitive = { github_token: Buffer.from("synthetic-github"), vercel_token: Buffer.from("synthetic-vercel"),
    admin_password: Buffer.from("synthetic-admin"), admin_session_secret: Buffer.from("synthetic-session") };
  let adapterCalls = 0, publishes = 0, retirements = 0;
  const journal = { load: () => structuredClone(current),
    publish(state) { publishes++;current = { retired: false, value: { ...current.value, sequence: current.value.sequence + 1, state: structuredClone(state) } }; },
    retire(state) { retirements++;current = { retired: true, value: { ...current.value, sequence: current.value.sequence + 1, state: { ...structuredClone(state), retired: true } } }; } };
  deps.openOfficialRecoveryExecutionContext = (bound, marker) => {
    deps.calls.push("openOfficialRecoveryExecutionContext");
    const probe = recoveryFilesystem(bound, doc);
    filesystemChange?.(probe, bound);
    const admitted = officialRunnerModule.readExistingOfficialRecoveryAdmission(bound, marker, probe.filesystem);
    return { journal, git_execution_context: officialRunnerModule.verifyOfficialRecoveryGitContext(bound, probe.filesystem), retention_recovery: admitted };
  };
  deps.verifyOfficialRecoveryAdmission = () => {
    deps.calls.push("verifyOfficialRecoveryAdmission");
    if (drift) throw Object.assign(new Error("DRIFT"), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  };
  deps.readOfficialCredentials = async () => {
    deps.calls.push("readOfficialCredentials");await Promise.resolve();
    if (credentialDrift) {
      current.value.sequence++;
      current.value.state.retention.deployment_id=current.value.state.owned.deployment_id="dpl_SubstitutedV2";
    }
    return sensitive;
  };
  deps.runAuthorizedOfficialRecovery = async (input) => {
    deps.calls.push("runAuthorizedOfficialRecovery");
    if (throwAfterCredentials) throw new Error("synthetic post-acquisition failure");
    if (forged) return retainedRuntimeResult(auth);
    const { recoverConcreteAdminV1OfficialRetention } = await import("./admin-v1-official-live-platform.mjs");
    return recoverConcreteAdminV1OfficialRetention({ ...input, now_epoch_ms: deps.now_epoch_ms,
      live_now_epoch_ms: () => deps.now_epoch_ms,
      transport: { async execute({ operation, input: request }) {
        adapterCalls++;
        if (failedRead) throw new Error("synthetic unproven readback");
        if (operation === "inspect_remote_ref") return { status: "ABSENT" };
        if (operation === "verify_preview_identity") return { status: "EXACT", deployment_id: request.deployment_id, unrelated_preserved: true };
        if (operation === "inspect_environment_contract") return { status: "EXACT", names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
        if (operation === "verify_zero_data_residual") return { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true };
        if (operation.startsWith("delete_") || operation === "cleanup_local_owned_temp_state") return { status: "DELETED_EXACT" };
        assert.match(operation, /^verify_environment_[1-7]$/u);
        return { status: "EXACT", ...request, project_id: auth.execution.preview_project_id,
          team_id: auth.execution.preview_team_id, git_branch: auth.execution.branch_name, unrelated_preserved: true };
      } } });
  };
  return { deps, sensitive, state: () => current, counts: () => ({ adapterCalls, publishes, retirements }) };
}
for (const lifecycle of ["RETENTION_PENDING", "RECOVERY_PENDING"]) {
  const auth = v2Record();const doc = recoveryDocument(auth);doc.state.lifecycle = lifecycle;
  const flow = recoveryDependencies(auth, doc);
  assert.deepEqual(await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc)),
    { exit_code: 0, code: "RETENTION_COMPLETE" });
  assert.deepEqual(flow.counts(), { adapterCalls: 10, publishes: 11, retirements: 1 });
  assert.equal(flow.state().retired, true);assert.equal(flow.deps.outputs.at(-1).zero_residual_owned_state, false);
  for (const denied of ["prepareOfficialExecutionContext", "verifyTemporaryCommit", "verifyNoPriorOfficialRecovery", "runAuthorizedOfficialRuntime"])
    assert.equal(flow.deps.calls.includes(denied), false);
  assert(flow.deps.calls.indexOf("verifyOfficialRecoveryAdmission") < flow.deps.calls.indexOf("readOfficialCredentials"));
  assert(Object.values(flow.sensitive).every((value) => value.every((byte) => byte === 0)));
  assert.deepEqual(await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc)),
    { exit_code: 1, code: "OFFICIAL_AUTHORIZATION_SPENT" });
  assert.deepEqual(flow.counts(), { adapterCalls: 10, publishes: 11, retirements: 1 });
}
for (const options of [{ failedRead: true }, { throwAfterCredentials: true }]) {
  const auth = v2Record();const doc = recoveryDocument(auth);const flow = recoveryDependencies(auth, doc, options);
  const output = await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc));
  assert.equal(output.exit_code, 1);assert.equal(flow.deps.outputs.at(-1).status, "FAIL");
  assert(Object.values(flow.sensitive).every((value) => value.every((byte) => byte === 0)));
  assert.equal(flow.counts().retirements, 0);
  if (options.failedRead) { assert.equal(flow.state().value.state.lifecycle, "RECOVERY_PENDING");assert.equal(flow.state().value.state.retention.phase, "COMMITTED"); }
}
const recoveryBadStates = [
  (d) => { d.extra = true; }, (d) => { delete d.sequence; }, (d) => { d.identity.run_id = "other"; },
  (d) => { d.state.extra = true; }, (d) => { delete d.state.runtime_retries; },
  (d) => { d.state.runtime_sessions = 2; }, (d) => { d.state.runtime_retries = 1; }, (d) => { d.state.runtime_replays = 1; },
  (d) => { d.state.token_spent = false; }, (d) => { d.state.last_completed_qualification_ordinal = 5; },
  (d) => { d.state.last_completed_official_ordinal = 19; }, (d) => { d.state.lifecycle = "CLEANUP_COMPLETE"; },
  (d) => { d.state.retention.phase = "ARMED"; }, (d) => { d.state.retention.phase = "UNARMED"; },
  (d) => { d.state.retention.extra = true; }, (d) => { d.state.retention.environment_record_ids.pop(); },
  (d) => { d.state.retention.environment_record_ids[6] = d.state.retention.environment_record_ids[0]; },
  (d) => { d.state.retention.environment_keys.reverse(); }, (d) => { d.state.retention.data_zero_residual = "false"; },
  (d) => { d.state.effects.grant_revoke = 0; }, (d) => { d.state.cleanup.push("DELETE_PREVIEW"); },
  (d) => { d.state.owned.deployment_id = "dpl_other"; },
];
for (const change of recoveryBadStates) {
  const auth = v2Record();const doc = recoveryDocument(auth);change(doc);const flow = recoveryDependencies(auth, doc);
  assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc))).exit_code, 1);
  assert.equal(flow.deps.calls.includes("readOfficialCredentials"), false);assert.equal(flow.counts().adapterCalls, 0);
}
for (const change of [
  (p, a) => { p.nodes.delete(`${a.execution.journal_directory}/.qualification-git-context`); },
  (p, a) => { p.nodes.get(`${a.execution.journal_directory}/.qualification-git-context`).mode = 0o700; },
  (p, a) => { p.nodes.get(`${a.execution.journal_directory}/.qualification-git-context/config`).bytes = Buffer.from("[include]\\npath=/private-env"); },
  (p, a) => { p.nodes.get(`${a.execution.journal_directory}/.qualification-git-context/refs/heads`).names.push("other"); },
  (p, a) => { p.nodes.get(`${a.repository.root}/.git/objects`).symlink = true; },
]) {
  const auth = v2Record();const p = recoveryFilesystem(auth);change(p, auth);
  assert.throws(() => officialRunnerModule.verifyOfficialRecoveryGitContext(auth, p.filesystem));
  assert(p.operations.every(([kind]) => ["lstat", "open"].includes(kind)));
}
for (const [args, marker] of [[recoveryArgs, null], [["--run-admin-v1-official", ...recoveryArgs.slice(1)], true]]) {
  const auth = v2Record();const doc = recoveryDocument(auth);const flow = recoveryDependencies(auth, doc);
  const trusted = marker ? recoveryTrust(auth, doc) : trust(auth);
  assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(args, flow.deps, trusted)).exit_code, 1);
  assert.equal(flow.deps.calls.includes("readOfficialCredentials"), false);
}
for (const change of [(a) => { a.expires_at = "2026-08-21T12:00:00.000Z"; }, (a) => { a.schema_version = 1; }]) {
  const auth = v2Record();change(auth);const doc = recoveryDocument(auth);const flow = recoveryDependencies(auth, doc);
  assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc))).exit_code, 1);
  assert.equal(flow.deps.calls.includes("openOfficialRecoveryExecutionContext"), false);
}
const driftAuth = v2Record();const driftDoc = recoveryDocument(driftAuth);const driftFlow = recoveryDependencies(driftAuth, driftDoc, { drift: true });
assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, driftFlow.deps, recoveryTrust(driftAuth, driftDoc))).exit_code, 1);
assert.equal(driftFlow.deps.calls.includes("readOfficialCredentials"), false);
console.log(`PASS_RETENTION_RECOVERY_RUNNER pending_routes=2 durable_ledgers=6/20 read_calls=10 zeroing=PASS invalid_journals=${recoveryBadStates.length} context_negatives=5 real_effects=0`);

let recoveryBindingNegatives = 0;
for (const change of [
  (deps, auth) => { deps.verifyCandidate = () => ({ verified: true, source_policy_verified: true,
    activation_source_policy_verified: true, membership_exact: true, legacy_imports: 0, live_entrypoints: 4,
    candidate_identity_sha256: "f".repeat(64), manifest_sha256: auth.manifest_sha256 }); },
  (deps, auth) => { deps.inspectRepository = () => ({ ...auth.repository, remote_main: "f".repeat(40) }); },
  (deps) => { deps.hashCompatibilitySupport = () => "f".repeat(64); },
  (deps) => { deps.hashOfficialRouteSource = () => "f".repeat(64); },
  (deps) => { deps.hashOfficialAuthorizationSchema = () => "f".repeat(64); },
]) {
  const auth = v2Record();const doc = recoveryDocument(auth);const flow = recoveryDependencies(auth, doc);
  change(flow.deps, auth);
  assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc))).exit_code, 1);
  assert.equal(flow.deps.calls.includes("readOfficialCredentials"), false);recoveryBindingNegatives++;
}
for (const filesystemChange of [
  (p, a) => p.nodes.delete(`${a.execution.journal_directory}/.qualification-git-context`),
  (p, a) => { const prior = p.filesystem.readFileSync;p.filesystem.readFileSync = (fd) => {
    const result = prior(fd);
    if (result.toString("utf8").includes('"state":')) p.nodes.get(`${a.execution.journal_directory}/admin-v1-official-runtime-journal.json`).ctime = 2;
    return result; }; },
]) {
  const auth = v2Record();const doc = recoveryDocument(auth);const flow = recoveryDependencies(auth, doc, { filesystemChange });
  assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, flow.deps, recoveryTrust(auth, doc))).exit_code, 1);
  assert.equal(flow.deps.calls.includes("readOfficialCredentials"), false);recoveryBindingNegatives++;
}
const hashAuth = v2Record();const hashDoc = recoveryDocument(hashAuth);const hashFlow = recoveryDependencies(hashAuth, hashDoc);
const hashTrust = recoveryTrust(hashAuth, hashDoc);hashTrust.retention_recovery.journal_sha256 = "f".repeat(64);
assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, hashFlow.deps, hashTrust)).exit_code, 1);
assert.equal(hashFlow.deps.calls.includes("readOfficialCredentials"), false);
const forgedFlow = recoveryDependencies(hashAuth, hashDoc, { forged: true });
assert.equal((await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs, forgedFlow.deps, recoveryTrust(hashAuth, hashDoc))).exit_code, 1);
assert.equal(forgedFlow.state().retired, false);
assert(Object.values(forgedFlow.sensitive).every((value) => value.every((byte) => byte === 0)));
console.log(`PASS_RETENTION_RECOVERY_BINDINGS pre_credentials_negatives=${recoveryBindingNegatives + 1} forged_terminal_denied=true owned_handles_preserved=true`);

const credentialDriftAuth=v2Record();const credentialDriftDoc=recoveryDocument(credentialDriftAuth);
const credentialDriftFlow=recoveryDependencies(credentialDriftAuth,credentialDriftDoc,{credentialDrift:true});
assert.deepEqual(await officialRunnerModule.dispatchConcreteQualificationRunner(recoveryArgs,credentialDriftFlow.deps,
  recoveryTrust(credentialDriftAuth,credentialDriftDoc)),{exit_code:1,code:"OFFICIAL_RECOVERY_STATE_INVALID"});
assert.equal(credentialDriftFlow.deps.calls.includes("readOfficialCredentials"),true);
assert.deepEqual(credentialDriftFlow.counts(),{adapterCalls:0,publishes:0,retirements:0});
assert.equal(credentialDriftFlow.state().value.state.retention.deployment_id,"dpl_SubstitutedV2");
assert.equal(credentialDriftFlow.state().retired,false);
assert(Object.values(credentialDriftFlow.sensitive).every(value=>value.every(byte=>byte===0)));
console.log("PASS_RETENTION_RECOVERY_CREDENTIAL_AWAIT_DRIFT denied=true substituted_ids_preserved=true adapter_calls=0 durable_writes=0 zeroing=PASS real_effects=0");
