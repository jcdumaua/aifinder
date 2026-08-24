import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
} from "./admin-v1-official-runtime.mjs";
import {
  concreteTemporaryCommitBlobMatches,
  concreteTemporaryCommitMetadataMatches,
  concreteTemporaryCommitParentMatches,
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

function dependencies({ candidateMismatch = false, runtimeErrorCode = null } = {}) {
  const calls = [];
  const authorization = record();
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
        live_entrypoints: 1,
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
    readOfficialCredentials() {
      calls.push("readOfficialCredentials");
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
