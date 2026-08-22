import assert from "node:assert/strict";
import {
  validateOfficialAuthorizationForSupervisor,
} from "./nonproduction-qualification-supervisor.mjs";

const PUBLISHED_HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
const RUN_ID = "33333333-3333-4333-8333-333333333333";
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

process.stdout.write(
  "PASS_ADMIN_V1_OFFICIAL_SUPERVISOR assertions=6 current_baseline=true exact_class=true pre_import_node_primitives_only=true failures=0 internal_failures=0\n",
);
