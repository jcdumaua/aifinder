import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import { createAdminV1OfficialAuthorizationRecord } from "./admin-v1-official-authorization.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
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
  authorization = record() } = {}) {
  const calls = [];
  return {
    calls,
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
      return { status: "ABSENT" };
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

function v2Record() {
  const value = record();
  value.schema_version = 2;
  value.isolation_contract_sha256 =
    "700cf951450811b04a2e1ed43625fe326b74b3e329ea877548dc0d2dad3071fe";
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
    contract_sha256: v2Template.contract_sha256,
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
assert.deepEqual(isolatedResult, { exit_code: 0, code: "OFFICIAL_RUNTIME_COMPLETE" },
  "COMPLETE_V2_TRUST_AND_PREEFFECT_REACH_ISOLATED_CREDENTIAL_BRANCH");
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
console.log("PASS_PR4_V2_RUNNER full_trust=true pre_effect=true isolated_branch=true invalid_before_context=5 real_effects=0");

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
  "PASS_ADMIN_V1_OFFICIAL_RUNNER assertions=18 pre_effect_before_credentials=true operation_class_separate=true real_calls=0 failures=0 internal_failures=0",
);
