import { sha256Hex, isSha256 } from "./canonical.mjs";

export const CONCRETE_OPERATION_CLASS = "NONPRODUCTION_QUALIFICATION";
export const CONCRETE_RETAINED_IDENTITY_SHA256 =
  "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0";
export const CONCRETE_APPROVAL_TOKEN =
  "APPROVE_LAUNCH_OPERATIONS_KERNEL_V6_GIT_PUSH_PORCELAIN_CONTRACT_RESEALED_AND_ONE_FRESH_REAL_NONPRODUCTION_QUALIFICATION_V1";
export const CONCRETE_APPROVAL_TOKEN_SHA256 = sha256Hex(
  CONCRETE_APPROVAL_TOKEN,
);
export const CONCRETE_SUPABASE_ORIGIN_SHA256 =
  "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777";
export const CONCRETE_SUPABASE_PROJECT_REF_SHA256 =
  "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914";
export const CONCRETE_SPENT_RUN_IDS = Object.freeze([
  "8c0d9e84-62e5-4658-9de0-c0121a302951",
  "e46a0d21-f0b4-4f7d-8a4f-e7f6e8a7eda0",
  "26199d3a-5bcd-4a48-9f31-c7a081195207",
  "f16a8383-a3ff-4c51-bec6-dc8beba5f4eb",
  "89336a0a-b67c-4ad6-99d2-b527ffdca9fd",
  "8e694077-7724-46b4-88ae-1e959d7c28de",
  "716fcb1b-7999-42b4-82f8-e5e8e65b644f",
  "a397fbe1-1107-40df-86b2-83b153d8b8cc",
]);

export const CONCRETE_RUNTIME_CREDENTIAL_SPEC = Object.freeze([
  Object.freeze({
    category: "GITHUB",
    accepted_names: Object.freeze(["GH_TOKEN", "GITHUB_TOKEN"]),
    adapter_slot: "github_token",
  }),
  Object.freeze({
    category: "VERCEL",
    accepted_names: Object.freeze(["VERCEL_TOKEN"]),
    adapter_slot: "vercel_token",
  }),
  Object.freeze({
    category: "SUPABASE_URL",
    accepted_names: Object.freeze(["NEXT_PUBLIC_SUPABASE_URL"]),
    adapter_slot: "supabase_url",
  }),
  Object.freeze({
    category: "SUPABASE_ANON",
    accepted_names: Object.freeze(["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
    adapter_slot: "supabase_anon_key",
  }),
  Object.freeze({
    category: "SUPABASE_SERVICE_ROLE",
    accepted_names: Object.freeze(["SUPABASE_SERVICE_ROLE_KEY"]),
    adapter_slot: "supabase_service_role_key",
  }),
  Object.freeze({
    category: "ADMIN_PASSWORD",
    accepted_names: Object.freeze(["ADMIN_PASSWORD"]),
    adapter_slot: "admin_password",
  }),
  Object.freeze({
    category: "ADMIN_SESSION",
    accepted_names: Object.freeze(["ADMIN_SESSION_SECRET"]),
    adapter_slot: "admin_session_secret",
  }),
]);
export const CONCRETE_CREDENTIAL_SOURCE_POLICY = Object.freeze({
  GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
  VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
  SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
  SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
  ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
  ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
});

const REQUIRED_HEAD = "ae614fa904e4c00d1dacec8493969fdce6fff3a3";
const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const SUPPORT_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
]);
const ROOT_KEYS = Object.freeze([
  "schema_version",
  "authorization_id_sha256",
  "candidate_identity_sha256",
  "manifest_sha256",
  "supervisor_sha256",
  "supervisor_policy_sha256",
  "compatibility_support_sha256",
  "retained_legacy_identity_sha256",
  "retained_legacy_classification",
  "preserve_ambiguous_legacy_resources",
  "operation_class",
  "attempt_limit",
  "request_budget",
  "mutation_budget",
  "success_retention_policy",
  "independent_review_approval_token_sha256",
  "created_at",
  "expires_at",
  "run_id",
  "repository",
  "execution",
]);
const REPOSITORY_KEYS = Object.freeze([
  "root",
  "branch",
  "head",
  "origin_main",
  "ahead",
  "behind",
  "index_empty",
  "worktree_count",
  "status_sha256",
  "remote_repository",
]);
const EXECUTION_KEYS = Object.freeze([
  "journal_directory",
  "branch_name",
  "temporary_commit_sha",
  "preview_project_id",
  "preview_project_name",
  "preview_team_id",
  "preview_team_slug",
  "fixture_website",
  "fixture_name",
  "supabase_origin_sha256",
  "supabase_project_ref_sha256",
  "storage_bucket",
  "storage_name",
  "environment_keys",
  "staging_checks",
]);

export class ConcreteAuthorizationError extends Error {
  constructor(code) {
    super(code);
    this.name = "ConcreteAuthorizationError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function validRunId(value) {
  return (
    typeof value === "string" &&
    !CONCRETE_SPENT_RUN_IDS.includes(value) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      value,
    )
  );
}

function exactIsoTimestamp(value) {
  if (typeof value !== "string") return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  return new Date(milliseconds).toISOString() === value ? milliseconds : null;
}

function nonemptyAscii(value, maximum = 256) {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= maximum &&
    /^[\x20-\x7e]+$/u.test(value)
  );
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validExecution(execution, runId) {
  const expectedJournalDirectory =
    `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${runId}`;
  const expectedBranch = `aifinder-qualification-${runId}`;
  const expectedFixtureWebsite = `https://${runId}.invalid/`;
  const expectedStorageName = `admin/${runId}.png`;
  return (
    exactKeys(execution, EXECUTION_KEYS) &&
    execution.journal_directory === expectedJournalDirectory &&
    execution.branch_name === expectedBranch &&
    /^[a-f0-9]{40}$/u.test(execution.temporary_commit_sha) &&
    execution.fixture_website === expectedFixtureWebsite &&
    execution.storage_name === expectedStorageName &&
    execution.preview_project_id === "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" &&
    execution.preview_project_name === "aifinder" &&
    execution.preview_team_id === "team_9POJYxNnjIBbrQ19My8M5yG3" &&
    execution.preview_team_slug === "ai-finder-s-projects" &&
    execution.supabase_origin_sha256 === CONCRETE_SUPABASE_ORIGIN_SHA256 &&
    execution.supabase_project_ref_sha256 ===
      CONCRETE_SUPABASE_PROJECT_REF_SHA256 &&
    nonemptyAscii(execution.fixture_name, 160) &&
    execution.fixture_name.includes(runId) &&
    execution.storage_bucket === "tool-logos" &&
    Array.isArray(execution.environment_keys) &&
    execution.environment_keys.length === 2 &&
    execution.environment_keys[0] === "ADMIN_PASSWORD" &&
    execution.environment_keys[1] === "ADMIN_SESSION_SECRET" &&
    Array.isArray(execution.staging_checks) &&
    execution.staging_checks.length === 2 &&
    exactKeys(execution.staging_checks[0], ["method", "path", "status"]) &&
    exactKeys(execution.staging_checks[1], ["method", "path", "status"]) &&
    execution.staging_checks[0].method === "GET" &&
    execution.staging_checks[0].path === "/" &&
    execution.staging_checks[0].status === 200 &&
    execution.staging_checks[1].method === "GET" &&
    execution.staging_checks[1].path === "/api/admin/session" &&
    execution.staging_checks[1].status === 401
  );
}

export function validateConcreteAuthorizationRecord(
  record,
  { now_epoch_ms = Date.now() } = {},
) {
  let candidate;
  try {
    candidate = structuredClone(record);
  } catch {
    throw new ConcreteAuthorizationError("CONCRETE_AUTHORIZATION_INVALID");
  }
  const createdAt = exactIsoTimestamp(candidate?.created_at);
  const expiresAt = exactIsoTimestamp(candidate?.expires_at);
  if (
    !Number.isSafeInteger(now_epoch_ms) ||
    !exactKeys(candidate, ROOT_KEYS) ||
    candidate.schema_version !== 1 ||
    !isSha256(candidate.authorization_id_sha256) ||
    !isSha256(candidate.candidate_identity_sha256) ||
    !isSha256(candidate.manifest_sha256) ||
    !isSha256(candidate.supervisor_sha256) ||
    !isSha256(candidate.supervisor_policy_sha256) ||
    !exactKeys(candidate.compatibility_support_sha256, SUPPORT_PATHS) ||
    !Object.values(candidate.compatibility_support_sha256).every(isSha256) ||
    candidate.retained_legacy_identity_sha256 !==
      CONCRETE_RETAINED_IDENTITY_SHA256 ||
    candidate.retained_legacy_classification !== "FAIL_CLOSED_UNRESOLVED" ||
    candidate.preserve_ambiguous_legacy_resources !== true ||
    candidate.operation_class !== CONCRETE_OPERATION_CLASS ||
    candidate.attempt_limit !== 1 ||
    candidate.request_budget !== 16 ||
    candidate.mutation_budget !== 15 ||
    candidate.success_retention_policy !== "RETAIN_EXACTLY_ONE_PREVIEW" ||
    candidate.independent_review_approval_token_sha256 !==
      CONCRETE_APPROVAL_TOKEN_SHA256 ||
    createdAt === null ||
    expiresAt === null ||
    expiresAt <= createdAt ||
    expiresAt - createdAt > 24 * 60 * 60 * 1000 ||
    now_epoch_ms < createdAt ||
    !validRunId(candidate.run_id) ||
    !exactKeys(candidate.repository, REPOSITORY_KEYS) ||
    candidate.repository.root !== REPOSITORY_ROOT ||
    candidate.repository.branch !== "main" ||
    candidate.repository.head !== REQUIRED_HEAD ||
    candidate.repository.origin_main !== REQUIRED_HEAD ||
    candidate.repository.ahead !== 0 ||
    candidate.repository.behind !== 0 ||
    candidate.repository.index_empty !== true ||
    candidate.repository.worktree_count !== 1 ||
    !isSha256(candidate.repository.status_sha256) ||
    candidate.repository.remote_repository !== "jcdumaua/aifinder" ||
    !validExecution(candidate.execution, candidate.run_id)
  ) {
    throw new ConcreteAuthorizationError("CONCRETE_AUTHORIZATION_INVALID");
  }
  if (now_epoch_ms >= expiresAt) {
    throw new ConcreteAuthorizationError("CONCRETE_AUTHORIZATION_EXPIRED");
  }
  return deepFreeze(candidate);
}

export const CONCRETE_SUPPORT_PATHS = SUPPORT_PATHS;
