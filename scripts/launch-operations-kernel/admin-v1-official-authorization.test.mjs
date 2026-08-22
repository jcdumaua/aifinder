import assert from "node:assert/strict";
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

console.log(
  "PASS_ADMIN_V1_OFFICIAL_AUTHORIZATION_GENERATOR assertions=5 published_head_bound=true moved_head_rejected=true live_records_created=0",
);
