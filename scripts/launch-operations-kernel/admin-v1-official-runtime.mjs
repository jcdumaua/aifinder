import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";

export const ADMIN_V1_OFFICIAL_OPERATION_CLASS =
  "ADMIN_V1_OFFICIAL_RUNTIME_V1";

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze(row)));

export const ADMIN_V1_OFFICIAL_LEDGER = freezeRows([
  { ordinal: 1, method: "GET", path: "/api/admin/tools", status: 401 },
  { ordinal: 2, method: "POST", path: "/api/admin/login", status: 200 },
  { ordinal: 3, method: "GET", path: "/api/admin/session", status: 200 },
  { ordinal: 4, method: "GET", path: "/api/admin/csrf", status: 200 },
  { ordinal: 5, method: "POST", path: "/api/admin/tools", status: 403 },
  { ordinal: 6, method: "GET", path: "/api/admin/submissions", status: 200 },
  { ordinal: 7, method: "GET", path: "/api/admin/tools", status: 200 },
  { ordinal: 8, method: "POST", path: "/api/admin/tools", status: 200 },
  { ordinal: 9, method: "GET", path: "/api/admin/tools", status: 200 },
  { ordinal: 10, method: "PUT", path: "/api/admin/tools", status: 200 },
  { ordinal: 11, method: "DELETE", path: "/api/admin/tools", status: 200 },
  { ordinal: 12, method: "PUT", path: "/api/admin/submissions", status: 200 },
  { ordinal: 13, method: "PATCH", path: "/api/admin/submissions", status: 200 },
  { ordinal: 14, method: "POST", path: "/api/admin/submissions", status: 200 },
  { ordinal: 15, method: "POST", path: "/api/admin/upload-logo", status: 200 },
  { ordinal: 16, method: "PATCH", path: "/api/admin/tools", status: 405 },
  { ordinal: 17, method: "GET", path: "/api/admin/discovery/sources", status: 404 },
  { ordinal: 18, method: "GET", path: "/api/admin/unknown.map", status: 404 },
  { ordinal: 19, method: "POST", path: "/api/admin/logout", status: 200 },
  { ordinal: 20, method: "GET", path: "/api/admin/session", status: 401 },
]);

export const ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER = freezeRows(
  [1, 2, 3, 4, 19, 20].map((ordinal) =>
    structuredClone(ADMIN_V1_OFFICIAL_LEDGER[ordinal - 1])
  ),
);

export const ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES = Object.freeze([
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NODE_ENV",
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "VERCEL_TOKEN",
]);

export const ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY = Object.freeze({
  GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
  VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
  SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
  SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
  ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
  ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
  NODE_ENV: "PROVIDER_PRODUCTION_SEMANTICS",
});

export const ADMIN_V1_OFFICIAL_DEFERRED_ROUTES = Object.freeze([
  "/api/admin/audit-logs",
  "/api/admin/discovery/candidate-extraction/invoke",
  "/api/admin/discovery/candidate-staging-queue/[id]/decision",
  "/api/admin/discovery/candidate-staging-queue",
  "/api/admin/discovery/discovered-tools/[id]/approve",
  "/api/admin/discovery/discovered-tools/[id]/duplicate",
  "/api/admin/discovery/discovered-tools/[id]",
  "/api/admin/discovery/discovered-tools/bulk-status",
  "/api/admin/discovery/discovered-tools",
  "/api/admin/discovery/intake",
  "/api/admin/discovery/runs/[id]/candidate-preview",
  "/api/admin/discovery/runs/manual/claim",
  "/api/admin/discovery/runs/manual",
  "/api/admin/discovery/runs",
  "/api/admin/discovery/sources/[id]",
  "/api/admin/discovery/sources",
  "/api/admin/homepage-control/drafts/[id]/mark-preview",
  "/api/admin/homepage-control/drafts/[id]/preview-checklist",
  "/api/admin/homepage-control/drafts/[id]/publish",
  "/api/admin/homepage-control/drafts/[id]",
  "/api/admin/homepage-control/drafts",
]);

export const ADMIN_V1_OFFICIAL_TARGET_ROUTES = Object.freeze([
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
]);

export const ADMIN_V1_OFFICIAL_BUDGET_LIMITS = Object.freeze({
  git_remote_mutations: 4,
  git_remote_reads: 42,
  local_temporary_commits: 1,
  local_temporary_cleanups: 1,
  provider_control_invocations: 353,
  provider_inventory_traversals: 30,
  provider_inventory_pages: 118,
  provider_direct_mutations: 13,
  preview_creations: 1,
  protected_handshake_requests: 6,
  oidc_generations: 4,
  automation_bypass_cycles: 1,
  browser_requests: 0,
  application_requests: 26,
  qualification_application_requests: 6,
  official_application_requests: 20,
  database_rest_requests: 26,
  database_rest_successes: 14,
  approval_rpc_calls: 1,
  grant_prepare_rpc_calls: 1,
  grant_revoke_rpc_calls: 1,
  storage_reads: 7,
  storage_uploads: 1,
  storage_delete_attempts: 2,
  environment_metadata_controls: 64,
  environment_records_created: 2,
  environment_records_deleted: 4,
  runtime_sessions: 1,
  runtime_retries: 0,
  runtime_replays: 0,
  cleanup_reconciliation_requests: 2,
});

export const ADMIN_V1_OFFICIAL_CONTRACT_SHA256 = Object.freeze({
  budgets: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_BUDGET_LIMITS)),
  deferred_routes: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_DEFERRED_ROUTES)),
  environment_names: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES)),
  official_ledger: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_LEDGER)),
  qualification_ledger: sha256Hex(
    canonicalJson(ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER),
  ),
  target_routes: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_TARGET_ROUTES)),
});

export const ADMIN_V1_OFFICIAL_FAILURE_TRANSITIONS = Object.freeze({
  BASELINE_STATUS_IDENTITY_MISMATCH: "STOP_PRE_CREDENTIAL_NEW_AUTHORITY",
  CANDIDATE_MANIFEST_SUPERVISOR_AUTHORIZATION_MISMATCH:
    "STOP_PRE_CREDENTIAL_NEW_AUTHORITY",
  PRIOR_RESIDUE_OR_OWNERSHIP_AMBIGUITY: "RECOVERY_PENDING_NO_LIVE_ATTEMPT",
  CREDENTIAL_UNAVAILABLE_OR_INVALID: "CLEAR_VOLATILE_STOP_NO_RETRY",
  TEMPORARY_COMMIT_VERIFICATION_FAILURE: "PRESERVE_REAL_TREE_NEW_AUTHORITY",
  REMOTE_BRANCH_CREATE_OR_READBACK_FAILURE: "RECONCILE_EXACT_REF_ONLY",
  BRANCH_ENV_PARTIAL_FAILURE: "DELETE_CAPTURED_RECORD_ID_ONLY",
  UNEXPECTED_AUTOMATIC_PREVIEW: "STOP_AND_REQUIRE_OWNERSHIP_PROOF",
  PREVIEW_CREATE_BUILD_IDENTITY_FAILURE: "DELETE_EXACT_OWNED_RESOURCES",
  PROTECTED_ACCESS_HANDSHAKE_FAILURE: "CLEAR_TOKEN_RESTORE_EXACT_PRESTATE",
  FIXTURE_SETUP_PARTIAL_FAILURE: "DELETE_CAPTURED_ROW_IDS_ONLY",
  QUALIFICATION_FAILURE: "NO_OFFICIAL_START_EXACT_CLEANUP",
  OFFICIAL_REQUEST_FAILURE_OR_TIMEOUT: "TOKEN_SPENT_NO_REPLAY_EXACT_CLEANUP",
  UNEXPECTED_DATABASE_RPC_POSTSTATE: "RECOVERY_PENDING_PRESERVE_MISMATCH",
  STORAGE_UPLOAD_AMBIGUITY: "NO_SECOND_UPLOAD_BIND_VERSION_FIRST",
  STORAGE_CAS_MISMATCH_DENIAL_EXPIRY: "PRESERVE_REPLACEMENT_RECOVERY_PENDING",
  DATABASE_CLEANUP_MISMATCH: "RECOVERY_PENDING_NO_BROAD_PREDICATE",
  EXTERNAL_CLEANUP_FAILURE: "EXACT_ID_REF_RECONCILIATION_ONLY",
  PROJECTION_PUBLICATION_FAILURE: "RETAIN_ROOT_NO_RUNTIME_REPLAY",
  GOVERNED_EVIDENCE_UPDATE_FAILURE: "NO_COMMIT_PUSH_SEPARATE_AUTHORITY",
});

export function classifyAdminV1OfficialRecoveryState(record) {
  const state = record?.value?.state ?? record?.state ?? record;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
  if (state.lifecycle === "CLEANUP_COMPLETE" && state.zero_residual === true) {
    return "CLEANUP_COMPLETE";
  }
  if (state.lifecycle === "RECOVERY_PENDING") return "CLEANUP_PARTIAL";
  if (state.lifecycle === "CLEANUP_PENDING") return "CLEANUP_PENDING";
  if (state.token_spent === true || state.lifecycle === "OFFICIAL_RUNTIME") {
    return "TOKEN_SPENT_OFFICIAL_RUNTIME";
  }
  if (state.lifecycle === "QUALIFICATION") return "PRE_OFFICIAL_QUALIFICATION";
  const owned = state.owned;
  if (
    owned && typeof owned === "object" && !Array.isArray(owned) &&
    (owned.local_temp_state !== null || owned.remote_ref !== null ||
      owned.deployment_id !== null ||
      Array.isArray(owned.environment_record_ids) &&
        owned.environment_record_ids.length > 0 ||
      Array.isArray(owned.submissions) && owned.submissions.length > 0 ||
      Array.isArray(owned.tools) && owned.tools.length > 0 ||
      Array.isArray(owned.audit_rows) && owned.audit_rows.length > 0 ||
      owned.logo !== null)
  ) return "PARTIAL_SETUP";
  if (state.lifecycle === "PRE_EFFECT") return "PRE_EFFECT";
  throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
}

const SUPPORT_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
]);
const ROUTE_IDENTITY_PATHS = Object.freeze([
  ...ADMIN_V1_OFFICIAL_TARGET_ROUTES,
  "lib/admin-v1-launch-scope.ts",
  "proxy.ts",
]);
const CONTRACT_DIGEST_KEYS = Object.freeze([
  "budgets",
  "deferred_routes",
  "environment_names",
  "official_ledger",
  "qualification_ledger",
  "target_routes",
]);
const AUTHORIZATION_KEYS = Object.freeze([
  "schema_version",
  "operation_class",
  "authorization_id_sha256",
  "one_use_authorization_sha256",
  "review_approval_sha256",
  "candidate_identity_sha256",
  "manifest_sha256",
  "supervisor_sha256",
  "supervisor_policy_sha256",
  "authorization_schema_sha256",
  "compatibility_support_sha256",
  "route_source_sha256",
  "contract_sha256",
  "created_at",
  "expires_at",
  "run_id",
  "repository",
  "execution",
]);
const REPOSITORY_KEYS = Object.freeze([
  "root", "branch", "head", "origin_main", "remote_main", "ahead", "behind",
  "index_empty", "worktree_count", "status_sha256", "remote_repository",
]);
const EXECUTION_KEYS = Object.freeze([
  "access_mode", "branch_name", "journal_directory", "preview_project_id",
  "preview_project_name", "preview_team_id", "preview_team_slug",
  "storage_bucket", "storage_name", "temporary_commit_sha", "environment_keys",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class AdminV1OfficialRuntimeError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialRuntimeError";
    this.code = code;
  }
}

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort((left, right) => left.localeCompare(right, "en"));
  const expected = [...keys].sort((left, right) => left.localeCompare(right, "en"));
  return actual.length === expected.length &&
    actual.every((entry, index) => entry === expected[index]);
}

function exactDigestMap(value, keys) {
  return exactKeys(value, keys) && keys.every((key) => isSha256(value[key]));
}

function boundedAscii(value, maximum = 512) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && /^[\x20-\x7e]+$/u.test(value);
}

function exactTimestamp(value) {
  if (typeof value !== "string") return null;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value
    ? epoch
    : null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function validateAdminV1OfficialAuthorization(
  record,
  { now_epoch_ms = Date.now() } = {},
) {
  let value;
  try {
    value = structuredClone(record);
  } catch {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  }
  const created = exactTimestamp(value?.created_at);
  const expires = exactTimestamp(value?.expires_at);
  const repository = value?.repository;
  const execution = value?.execution;
  if (
    !Number.isSafeInteger(now_epoch_ms) ||
    !exactKeys(value, AUTHORIZATION_KEYS) ||
    value.schema_version !== 1 ||
    value.operation_class !== ADMIN_V1_OFFICIAL_OPERATION_CLASS ||
    ![
      value.authorization_id_sha256,
      value.one_use_authorization_sha256,
      value.review_approval_sha256,
      value.candidate_identity_sha256,
      value.manifest_sha256,
      value.supervisor_sha256,
      value.supervisor_policy_sha256,
      value.authorization_schema_sha256,
    ].every(isSha256) ||
    !exactDigestMap(value.compatibility_support_sha256, SUPPORT_PATHS) ||
    !exactDigestMap(value.route_source_sha256, ROUTE_IDENTITY_PATHS) ||
    !exactDigestMap(value.contract_sha256, CONTRACT_DIGEST_KEYS) ||
    canonicalJson(value.contract_sha256) !==
      canonicalJson(ADMIN_V1_OFFICIAL_CONTRACT_SHA256) ||
    created === null || expires === null || created >= expires ||
    now_epoch_ms < created || now_epoch_ms >= expires ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !UUID_PATTERN.test(value.run_id ?? "") ||
    !exactKeys(repository, REPOSITORY_KEYS) ||
    !path.isAbsolute(repository.root) ||
    realpathSync(repository.root) !== repository.root ||
    repository.branch !== "main" ||
    !/^[0-9a-f]{40}$/u.test(repository.head ?? "") ||
    repository.origin_main !== repository.head ||
    repository.remote_main !== repository.head ||
    repository.ahead !== 0 || repository.behind !== 0 ||
    repository.index_empty !== true || repository.worktree_count !== 1 ||
    !isSha256(repository.status_sha256) ||
    repository.remote_repository !== "jcdumaua/aifinder" ||
    !exactKeys(execution, EXECUTION_KEYS) ||
    execution.access_mode !== "SELF_PROJECT_OIDC" ||
    execution.branch_name !== `aifinder-admin-v1-official-${value.run_id}` ||
    execution.journal_directory !==
      `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${value.run_id}` ||
    execution.preview_project_id !== "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" ||
    execution.preview_project_name !== "aifinder" ||
    execution.preview_team_id !== "team_9POJYxNnjIBbrQ19My8M5yG3" ||
    execution.preview_team_slug !== "ai-finder-s-projects" ||
    execution.storage_bucket !== "tool-logos" ||
    execution.storage_name !== `admin/${value.run_id}.png` ||
    !/^[0-9a-f]{40}$/u.test(execution.temporary_commit_sha ?? "") ||
    canonicalJson(execution.environment_keys) !==
      canonicalJson(["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"])
  ) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  }
  return deepFreeze(value);
}

function exactJournalDirectory(directory) {
  return typeof directory === "string" && path.isAbsolute(directory) &&
    !directory.includes("\0") && !directory.split(path.sep).includes("..") &&
    (directory.startsWith("/tmp/aifinder-admin-v1-official-") ||
      directory.startsWith("/private/tmp/aifinder-admin-v1-official-") ||
      directory.startsWith(
        "/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-",
      ));
}

function regularIdentity(filePath, mode) {
  const metadata = lstatSync(filePath);
  return metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1 &&
    (metadata.mode & 0o777) === mode && realpathSync(filePath) === filePath;
}

function strictJournalObject(filePath) {
  if (!regularIdentity(filePath, 0o600)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
  }
  const bytes = readFileSync(filePath);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value = JSON.parse(text);
    if (text !== `${canonicalJson(value)}\n`) throw new Error("CANONICAL");
    return { value, sha256: sha256Hex(bytes) };
  } catch {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_INVALID");
  } finally {
    bytes.fill(0);
  }
}

function fsyncPath(filePath, flags = constants.O_RDONLY) {
  const descriptor = openSync(filePath, flags);
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function sanitizedJournalState(value) {
  let serialized;
  try {
    serialized = canonicalJson(value);
  } catch {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_INVALID");
  }
  const forbidden = [
    "password", "session_secret", "session_cookie", "csrf_token", "csrf_cookie",
    "authorization_header", "raw_headers", "raw_body", "raw_child", "secret_sha256",
    "provider_output", "sql_output",
  ];
  if (forbidden.some((entry) => serialized.toLowerCase().includes(entry))) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_EVIDENCE_SENSITIVE");
  }
  return serialized;
}

export function createAdminV1OfficialJournal({ directory, identity }) {
  if (
    !exactJournalDirectory(directory) ||
    !exactKeys(identity, ["authorization_id_sha256", "run_id"]) ||
    !isSha256(identity.authorization_id_sha256) ||
    !UUID_PATTERN.test(identity.run_id ?? "")
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_INPUT");
  if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
  const directoryIdentity = lstatSync(directory);
  const canonicalDirectory = realpathSync(directory);
  if (
    !directoryIdentity.isDirectory() || directoryIdentity.isSymbolicLink() ||
    (directoryIdentity.mode & 0o777) !== 0o700
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
  const activePath = path.join(
    canonicalDirectory,
    "admin-v1-official-runtime-journal.json",
  );
  const retiredPath = path.join(
    canonicalDirectory,
    "admin-v1-official-runtime-retired.json",
  );
  const identityPath = path.join(
    canonicalDirectory,
    "admin-v1-official-runtime-identity.json",
  );
  let sequence = 0;
  const exactIdentity = Object.freeze(structuredClone(identity));
  const identityDocument = {
    schema_version: 1,
    identity: structuredClone(exactIdentity),
  };
  if (!existsSync(identityPath)) {
    writeFileSync(identityPath, `${canonicalJson(identityDocument)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    fsyncPath(identityPath);
    fsyncPath(canonicalDirectory);
  }
  const persistedIdentity = strictJournalObject(identityPath);
  if (canonicalJson(persistedIdentity.value) !== canonicalJson(identityDocument)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
  }

  const load = () => {
    if (existsSync(retiredPath)) {
      const retired = strictJournalObject(retiredPath);
      if (canonicalJson(retired.value.identity) !== canonicalJson(exactIdentity)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
      }
      return { ...retired, retired: true };
    }
    if (!existsSync(activePath)) return null;
    const active = strictJournalObject(activePath);
    if (canonicalJson(active.value.identity) !== canonicalJson(exactIdentity)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
    }
    sequence = Math.max(sequence, active.value.sequence ?? 0);
    return { ...active, retired: false };
  };

  const persistTo = (targetPath, state) => {
    sequence += 1;
    const document = {
      schema_version: 1,
      identity: structuredClone(exactIdentity),
      sequence,
      state: structuredClone(state),
    };
    const text = `${sanitizedJournalState(document)}\n`;
    const temporaryPath = path.join(
      canonicalDirectory,
      `.admin-v1-official-runtime-${sequence}.tmp`,
    );
    writeFileSync(temporaryPath, text, { flag: "wx", mode: 0o600 });
    fsyncPath(temporaryPath);
    renameSync(temporaryPath, targetPath);
    fsyncPath(canonicalDirectory);
    const readback = strictJournalObject(targetPath);
    if (canonicalJson(readback.value) !== canonicalJson(document)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_READBACK");
    }
    return readback.sha256;
  };

  return Object.freeze({
    load,
    publish(state) {
      if (existsSync(retiredPath)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_SPENT");
      }
      return persistTo(activePath, state);
    },
    retire(state) {
      if (state?.lifecycle !== "CLEANUP_COMPLETE" || state?.zero_residual !== true) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_RETIREMENT_DENIED");
      }
      const sha256 = persistTo(retiredPath, { ...state, retired: true });
      if (existsSync(activePath)) unlinkSync(activePath);
      fsyncPath(canonicalDirectory);
      return sha256;
    },
  });
}

function blankCounts() {
  return Object.fromEntries(
    Object.keys(ADMIN_V1_OFFICIAL_BUDGET_LIMITS).map((key) => [key, 0]),
  );
}

function createBudget(overrides) {
  const limits = { ...ADMIN_V1_OFFICIAL_BUDGET_LIMITS };
  if (overrides !== undefined) {
    if (
      !overrides || typeof overrides !== "object" || Array.isArray(overrides) ||
      Object.entries(overrides).some(([key, value]) =>
        !Object.hasOwn(limits, key) || !Number.isSafeInteger(value) || value < 0 ||
        value > limits[key]
      )
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_BUDGET_INPUT");
    Object.assign(limits, overrides);
  }
  const used = blankCounts();
  return {
    used,
    take(cost) {
      for (const [key, amount] of Object.entries(cost)) {
        if (!Object.hasOwn(limits, key) || !Number.isSafeInteger(amount) || amount < 1) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_BUDGET_INPUT");
        }
        if (used[key] + amount > limits[key]) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_BUDGET_EXHAUSTED");
        }
      }
      for (const [key, amount] of Object.entries(cost)) used[key] += amount;
    },
  };
}

export const ADMIN_V1_OFFICIAL_ACTION_COSTS = Object.freeze({
  inspect_prior_residue: { provider_control_invocations: 1 },
  prepare_local_temporary_commit: { local_temporary_commits: 1 },
  inspect_github_metadata: { git_remote_reads: 1 },
  inspect_environment_contract: {
    provider_control_invocations: 1,
    environment_metadata_controls: 1,
  },
  inspect_remote_ref: { git_remote_reads: 1 },
  create_remote_ref: { git_remote_mutations: 1 },
  create_environment_1: {
    provider_direct_mutations: 1,
    environment_records_created: 1,
  },
  create_environment_2: {
    provider_direct_mutations: 1,
    environment_records_created: 1,
  },
  verify_environment_1: {
    provider_control_invocations: 1,
    environment_metadata_controls: 1,
  },
  verify_environment_2: {
    provider_control_invocations: 1,
    environment_metadata_controls: 1,
  },
  acquire_automatic_preview: {
    provider_control_invocations: 1,
    provider_inventory_traversals: 1,
    provider_inventory_pages: 1,
  },
  verify_preview_identity: { provider_control_invocations: 1 },
  generate_oidc: { oidc_generations: 1 },
  protected_access_handshake: { protected_handshake_requests: 1 },
  inspect_owned_database_residue: { database_rest_requests: 1, database_rest_successes: 1 },
  create_submitted_fixture: { database_rest_requests: 1, database_rest_successes: 1 },
  inspect_submissions_poststate: { database_rest_requests: 1, database_rest_successes: 1 },
  inspect_tools_poststate: { database_rest_requests: 1, database_rest_successes: 1 },
  inspect_audits_poststate: { database_rest_requests: 1, database_rest_successes: 1 },
  storage_read_owned_version: { storage_reads: 1 },
  prepare_storage_cleanup_grant: { grant_prepare_rpc_calls: 1 },
  delete_storage_exact_version: { storage_delete_attempts: 1 },
  revoke_storage_cleanup_grant: { grant_revoke_rpc_calls: 1 },
  delete_owned_audits: { database_rest_requests: 1, database_rest_successes: 1 },
  delete_submitted_fixture_1: { database_rest_requests: 1, database_rest_successes: 1 },
  delete_submitted_fixture_2: { database_rest_requests: 1, database_rest_successes: 1 },
  delete_submitted_fixture_3: { database_rest_requests: 1, database_rest_successes: 1 },
  delete_owned_tool_1: { database_rest_requests: 1, database_rest_successes: 1 },
  delete_owned_tool_2: { database_rest_requests: 1, database_rest_successes: 1 },
  retire_protected_access: { provider_control_invocations: 1 },
  delete_preview: { provider_direct_mutations: 1 },
  delete_environment_1: {
    provider_direct_mutations: 1,
    environment_records_deleted: 1,
  },
  delete_environment_2: {
    provider_direct_mutations: 1,
    environment_records_deleted: 1,
  },
  inspect_remote_ref_before_delete: { git_remote_reads: 1 },
  delete_remote_ref: { git_remote_mutations: 1 },
  verify_zero_data_residual: {
    database_rest_requests: 1,
    database_rest_successes: 1,
    storage_reads: 1,
  },
  verify_zero_external_residual: {
    provider_control_invocations: 1,
    git_remote_reads: 1,
  },
  cleanup_local_owned_temp_state: { local_temporary_cleanups: 1 },
});

function publicState(state) {
  return {
    lifecycle: state.lifecycle,
    stage: state.stage,
    token_spent: state.token_spent,
    runtime_sessions: state.runtime_sessions,
    runtime_retries: 0,
    runtime_replays: 0,
    last_attempted_qualification_ordinal: state.last_attempted_qualification_ordinal,
    last_completed_qualification_ordinal: state.last_completed_qualification_ordinal,
    last_attempted_official_ordinal: state.last_attempted_official_ordinal,
    last_completed_official_ordinal: state.last_completed_official_ordinal,
    owned: structuredClone(state.owned),
    effects: structuredClone(state.effects),
    evidence: structuredClone(state.evidence),
    failure: structuredClone(state.failure),
    cleanup: structuredClone(state.cleanup),
    zero_residual: state.zero_residual,
  };
}

const ENVIRONMENT_CREATE_FAILURE_CLASSES = new Set([
  "ENVIRONMENT_VALUE_SHAPE_INVALID",
  "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
  "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
]);
const ENVIRONMENT_CREATE_HTTP_STATUS_CLASSES = new Set([
  "2XX",
  "4XX",
  "5XX",
  "OTHER",
]);

function boundedEnvironmentCreateFailure(operation, error) {
  if (
    !["create_environment_1", "create_environment_2"].includes(operation) ||
    !ENVIRONMENT_CREATE_FAILURE_CLASSES.has(
      error?.environment_create_failure_class,
    ) ||
    !(
      error?.http_status_class === null ||
      ENVIRONMENT_CREATE_HTTP_STATUS_CLASSES.has(error?.http_status_class)
    )
  ) return null;
  return {
    operation,
    stage: "SETUP",
    class: error.environment_create_failure_class,
    http_status_class: error.http_status_class,
    provider: "VERCEL",
    retry_allowed: false,
  };
}

export function classifyAdminV1OfficialEnvironmentCreateFailureEvidence(
  journalDocument,
) {
  const state = journalDocument?.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) return null;
  const failure = state.failure;
  if (
    failure &&
    typeof failure === "object" &&
    !Array.isArray(failure) &&
    ["create_environment_1", "create_environment_2"].includes(failure.operation) &&
    failure.stage === "SETUP" &&
    ENVIRONMENT_CREATE_FAILURE_CLASSES.has(failure.class) &&
    (failure.http_status_class === null ||
      ENVIRONMENT_CREATE_HTTP_STATUS_CLASSES.has(failure.http_status_class)) &&
    failure.provider === "VERCEL" &&
    failure.retry_allowed === false
  ) {
    return Object.freeze({
      failure_class: "BRANCH_ENV_PARTIAL_FAILURE",
      operation: failure.operation,
      lower_level_class: failure.class,
    });
  }
  const owned = state.owned;
  const effects = state.effects;
  if (
    journalDocument.sequence === 9 &&
    state.lifecycle === "CLEANUP_COMPLETE" &&
    state.stage === "CLEANUP_COMPLETE_PUBLISHED" &&
    state.retired === true &&
    state.token_spent === false &&
    state.runtime_sessions === 0 &&
    state.last_attempted_qualification_ordinal === 0 &&
    state.last_completed_qualification_ordinal === 0 &&
    state.last_attempted_official_ordinal === 0 &&
    state.last_completed_official_ordinal === 0 &&
    owned && typeof owned === "object" && !Array.isArray(owned) &&
    typeof owned.local_temp_state === "string" &&
    owned.local_temp_state.length > 0 &&
    owned.remote_ref === null &&
    Array.isArray(owned.environment_record_ids) &&
    owned.environment_record_ids.length === 0 &&
    owned.deployment_id === null &&
    Array.isArray(owned.submissions) && owned.submissions.length === 0 &&
    Array.isArray(owned.tools) && owned.tools.length === 0 &&
    Array.isArray(owned.audit_rows) && owned.audit_rows.length === 0 &&
    owned.logo === null &&
    effects && typeof effects === "object" && !Array.isArray(effects) &&
    Object.values(effects).every((value) => value === 0) &&
    Array.isArray(state.evidence) && state.evidence.length === 0 &&
    canonicalJson(state.cleanup) === '["CLEANUP_LOCAL_OWNED_TEMP_STATE"]' &&
    state.zero_residual === true &&
    !Object.hasOwn(state, "failure")
  ) {
    return Object.freeze({
      failure_class: "BRANCH_ENV_PARTIAL_FAILURE",
      operation: "create_environment_1",
      lower_level_class: "LEGACY_UNAVAILABLE",
    });
  }
  return null;
}

function zeroBuffer(value) {
  if (value instanceof Uint8Array) Buffer.from(
    value.buffer,
    value.byteOffset,
    value.byteLength,
  ).fill(0);
}

function clearSensitiveRecord(sensitive) {
  if (!sensitive || typeof sensitive !== "object") return;
  for (const value of Object.values(sensitive)) zeroBuffer(value);
}

function exactAdapterResponse(response, status) {
  return response && typeof response === "object" && !Array.isArray(response) &&
    response.status === status;
}

function responseEvidence(spec, response, lane, sequenceOrdinal) {
  if (
    response?.status !== spec.status ||
    response.header_projection !== "EXACT_SECURITY_HEADERS" ||
    response.body_shape !== "EXACT_BOUNDED_JSON" ||
    !boundedAscii(response.cookie_effect, 96)
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_APPLICATION_CONTRACT_MISMATCH");
  if (
    spec.ordinal === 16 &&
    canonicalJson(response.allow_methods) !==
      canonicalJson(["GET", "POST", "PUT", "DELETE"])
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_ALLOW_METHODS_MISMATCH");
  if (
    [17, 18].includes(spec.ordinal) &&
    (response.proxy_scope !== "DENY_ADMIN_API_PATH" ||
      response.deferred_handler_executions !== 0 ||
      response.deferred_database_effects !== 0 ||
      response.deferred_rpc_effects !== 0 ||
      response.deferred_storage_effects !== 0)
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_DEFERRED_SCOPE_MISMATCH");
  return Object.freeze({
    lane,
    sequence_ordinal: sequenceOrdinal,
    contract_ordinal: spec.ordinal,
    method: spec.method,
    path: spec.path,
    expected_status: spec.status,
    actual_status: response.status,
    latency_bucket: "BOUNDED",
    response_bytes_bucket: "BOUNDED",
    security_headers: response.header_projection,
    cookie_effect: response.cookie_effect,
    ...(spec.ordinal === 16
      ? { allow_methods: [...response.allow_methods] }
      : {}),
    ...([17, 18].includes(spec.ordinal)
      ? {
          proxy_scope: response.proxy_scope,
          deferred_handler_executions: 0,
          deferred_data_effects: 0,
        }
      : {}),
    result: "PASS",
  });
}

function validateEffect(state, ordinal, effect) {
  const auditActions = new Map([
    [8, "tool_added"],
    [10, "tool_updated"],
    [11, "tool_deleted"],
    [12, "submission_updated"],
    [13, "submission_rejected"],
    [14, "submission_approved"],
    [15, "logo_uploaded"],
    [19, "admin_logout"],
  ]);
  const effectOrdinals = new Set(auditActions.keys());
  if (!effectOrdinals.has(ordinal) && effect !== null) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
  }
  if (auditActions.has(ordinal)) {
    if (
      effect?.audit_action !== auditActions.get(ordinal) ||
      !boundedAscii(effect.audit_id, 128) ||
      !boundedAscii(effect.audit_version, 128) ||
      state.owned.audit_rows.some((row) => row.row_id === effect.audit_id)
    ) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    }
    state.owned.audit_rows.push({
      row_id: effect.audit_id,
      version: effect.audit_version,
    });
    state.effects.audits += 1;
  } else if (effect?.audit_action !== undefined) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
  }
  if (ordinal === 8) {
    if (
      !boundedAscii(effect?.tool_id, 128) ||
      !boundedAscii(effect?.tool_version, 128)
    ) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    }
    state.owned.tools.push({ row_id: effect.tool_id, version: effect.tool_version });
    state.effects.tools += 1;
  }
  if ([10, 11].includes(ordinal)) {
    const routeTool = state.owned.tools[0];
    if (
      !routeTool || effect?.tool_id !== routeTool.row_id ||
      !boundedAscii(effect?.tool_version, 128) ||
      effect.tool_version === routeTool.version
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    routeTool.version = effect.tool_version;
  }
  if ([12, 13, 14].includes(ordinal)) {
    const submission = state.owned.submissions[ordinal - 12];
    if (
      !submission || effect?.submission_id !== submission.row_id ||
      !boundedAscii(effect?.submission_version, 128) ||
      effect.submission_version === submission.version
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    submission.version = effect.submission_version;
  }
  if (ordinal === 14) {
    if (
      effect?.approval_rpc !== 1 || !boundedAscii(effect.tool_id, 128) ||
      !boundedAscii(effect.tool_version, 128) ||
      state.owned.tools.some((row) => row.row_id === effect.tool_id)
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    state.effects.approval_rpc += 1;
    state.effects.tools += 1;
    state.owned.tools.push({ row_id: effect.tool_id, version: effect.tool_version });
  }
  if (ordinal === 15) {
    if (
      !boundedAscii(effect?.logo_object_id, 128) ||
      !boundedAscii(effect?.storage_version, 128)
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    state.effects.logo_objects += 1;
    state.owned.logo = {
      object_id: effect.logo_object_id,
      version: effect.storage_version,
    };
  }
}

function exactEffects(state, expectedAudits = 8) {
  return canonicalJson(state.effects) === canonicalJson({
    submitted_tools: 3,
    tools: 2,
    audits: expectedAudits,
    approval_rpc: 1,
    logo_objects: 1,
    grant_prepare: 0,
    grant_revoke: 0,
  });
}

function validatePoststateEffect(ordinal, effect, lane, expectedAuditActions) {
  const actions = new Map([
    [8, "tool_added"],
    [10, "tool_updated"],
    [11, "tool_deleted"],
    [12, "submission_updated"],
    [13, "submission_rejected"],
    [14, "submission_approved"],
    [15, "logo_uploaded"],
    [19, "admin_logout"],
  ]);
  const expected = actions.get(ordinal);
  if (expected === undefined) {
    if (effect !== null) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    }
    return;
  }
  if (
    effect?.audit_action !== expected ||
    (lane === "QUALIFICATION" && ordinal !== 19)
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
  if (ordinal === 14 && effect.approval_rpc !== 1) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
  }
  if (ordinal === 15 && (
    !boundedAscii(effect.logo_object_id, 256) ||
    !boundedAscii(effect.storage_version, 128)
  )) throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
  expectedAuditActions.push(expected);
}

function reconcilePoststateOwnership({
  state,
  submissions,
  tools,
  audits,
  expectedAuditActions,
}) {
  if (
    !Array.isArray(submissions.rows) || submissions.rows.length !== 3 ||
    !Array.isArray(tools.rows) || tools.rows.length !== 2 ||
    !Array.isArray(audits.rows) || audits.rows.length !== 9 ||
    submissions.rows.some((row) =>
      !boundedAscii(row?.row_id, 128) || !boundedAscii(row?.version, 128)
    ) ||
    tools.rows.some((row) =>
      !boundedAscii(row?.row_id, 128) || !boundedAscii(row?.version, 128) ||
      !["APPROVED_SUBMISSION", "ROUTE_TOOL"].includes(row?.role)
    ) ||
    audits.rows.some((row) =>
      !boundedAscii(row?.row_id, 128) || !boundedAscii(row?.version, 128) ||
      !boundedAscii(row?.action, 64)
    )
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_POSTSTATE_MISMATCH");
  const submissionById = new Map(submissions.rows.map((row) => [row.row_id, row]));
  if (
    submissionById.size !== 3 ||
    state.owned.submissions.some((row) => {
      const observed = submissionById.get(row.row_id);
      return !observed || observed.version === row.version;
    })
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_POSTSTATE_MISMATCH");
  for (const row of state.owned.submissions) {
    row.version = submissionById.get(row.row_id).version;
  }
  if (
    new Set(tools.rows.map((row) => row.row_id)).size !== 2 ||
    new Set(tools.rows.map((row) => row.role)).size !== 2 ||
    new Set(audits.rows.map((row) => row.row_id)).size !== 9 ||
    state.owned.logo === null ||
    !boundedAscii(audits.logo_object_id, 256) ||
    audits.logo_object_id !== state.owned.logo.object_id ||
    canonicalJson(audits.rows.map((row) => row.action).sort()) !==
      canonicalJson([...expectedAuditActions].sort())
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_POSTSTATE_MISMATCH");
  state.owned.tools = tools.rows.map((row) => ({
    row_id: row.row_id,
    version: row.version,
  }));
  state.owned.audit_rows = audits.rows.map((row) => ({
    row_id: row.row_id,
    version: row.version,
  }));
  state.effects.tools = 2;
  state.effects.audits = 9;
  state.effects.approval_rpc = 1;
}

export async function runAdminV1OfficialRuntime({
  authorization,
  adapters,
  journal,
  sensitive,
  test_budget_overrides,
  now_epoch_ms = Date.now(),
  automatic_preview_now_epoch_ms = () => Date.now(),
  automatic_preview_wait = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  const validated = validateAdminV1OfficialAuthorization(authorization, {
    now_epoch_ms,
  });
  if (
    !adapters || typeof adapters.invoke !== "function" ||
    !journal || typeof journal.load !== "function" ||
    typeof journal.publish !== "function" || typeof journal.retire !== "function" ||
    !sensitive || !(sensitive.admin_password instanceof Uint8Array) ||
    !(sensitive.admin_session_secret instanceof Uint8Array) ||
    sensitive.admin_password.byteLength === 0 ||
    sensitive.admin_session_secret.byteLength === 0 ||
    typeof automatic_preview_now_epoch_ms !== "function" ||
    typeof automatic_preview_wait !== "function"
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_RUNTIME_INPUT");
  const existing = journal.load();
  if (existing?.retired === true || existing?.value?.state?.token_spent === true) {
    clearSensitiveRecord(sensitive);
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_SPENT");
  }
  if (existing !== null) {
    clearSensitiveRecord(sensitive);
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_REQUIRED");
  }
  const budget = createBudget(test_budget_overrides);
  const state = {
    lifecycle: "PRE_EFFECT",
    stage: "AUTHORIZATION_VERIFIED",
    token_spent: false,
    runtime_sessions: 0,
    last_attempted_qualification_ordinal: 0,
    last_completed_qualification_ordinal: 0,
    last_attempted_official_ordinal: 0,
    last_completed_official_ordinal: 0,
    owned: {
      local_temp_state: null,
      remote_ref: null,
      environment_record_ids: [],
      deployment_id: null,
      submissions: [],
      tools: [],
      audit_rows: [],
      logo: null,
    },
    effects: {
      submitted_tools: 0,
      tools: 0,
      audits: 0,
      approval_rpc: 0,
      logo_objects: 0,
      grant_prepare: 0,
      grant_revoke: 0,
    },
    evidence: [],
    failure: null,
    cleanup: [],
    zero_residual: false,
  };
  journal.publish(publicState(state));

  const invoke = async (operation, input = {}, extraCost = {}) => {
    const fixed = ADMIN_V1_OFFICIAL_ACTION_COSTS[operation];
    if (!fixed) throw new AdminV1OfficialRuntimeError("OFFICIAL_ADAPTER_OPERATION_DENIED");
    budget.take({ ...fixed, ...extraCost });
    return adapters.invoke(operation, input);
  };

  const mutation = async (operation, input, accept, commit = () => {}) => {
    state.stage = `INTENT_${operation.toUpperCase()}`;
    journal.publish(publicState(state));
    const response = await invoke(operation, input);
    const value = accept(response);
    commit(value);
    state.stage = `COMPLETE_${operation.toUpperCase()}`;
    journal.publish(publicState(state));
    return value;
  };

  const clearAuth = (auth) => {
    zeroBuffer(auth.session);
    zeroBuffer(auth.csrfToken);
    zeroBuffer(auth.csrfCookie);
    auth.session = null;
    auth.csrfToken = null;
    auth.csrfCookie = null;
  };

  const runLedger = async (ledger, lane) => {
    const auth = { session: null, csrfToken: null, csrfCookie: null };
    try {
      for (const [index, spec] of ledger.entries()) {
        const sequenceOrdinal = index + 1;
        if (lane === "OFFICIAL") {
          if (sequenceOrdinal === 1) {
            if (state.token_spent || state.runtime_sessions !== 0) {
              throw new AdminV1OfficialRuntimeError("OFFICIAL_SECOND_SESSION_DENIED");
            }
            state.token_spent = true;
            state.runtime_sessions = 1;
            budget.take({ runtime_sessions: 1 });
          }
          state.last_attempted_official_ordinal = sequenceOrdinal;
        } else {
          state.last_attempted_qualification_ordinal = sequenceOrdinal;
        }
        state.stage = `${lane}_REQUEST_${sequenceOrdinal}_ATTEMPTED`;
        journal.publish(publicState(state));
        const requestCost = lane === "OFFICIAL"
          ? { application_requests: 1, official_application_requests: 1 }
          : { application_requests: 1, qualification_application_requests: 1 };
        if (lane === "OFFICIAL" && spec.ordinal === 14) {
          requestCost.approval_rpc_calls = 1;
        }
        if (lane === "OFFICIAL" && spec.ordinal === 15) {
          requestCost.storage_uploads = 1;
        }
        budget.take(requestCost);
        const noCsrf = spec.ordinal === 5;
        const response = await adapters.invoke("application_request", {
          lane,
          sequence_ordinal: sequenceOrdinal,
          contract: structuredClone(spec),
          session: auth.session,
          csrf_token: noCsrf ? null : auth.csrfToken,
          csrf_cookie: noCsrf ? null : auth.csrfCookie,
          admin_password: spec.ordinal === 2 ? sensitive.admin_password : null,
        });
        const evidence = responseEvidence(spec, response, lane, sequenceOrdinal);
        if (spec.ordinal === 2) {
          if (!(response.session_cookie instanceof Uint8Array)) {
            throw new AdminV1OfficialRuntimeError("OFFICIAL_SESSION_CONTRACT");
          }
          zeroBuffer(auth.session);
          auth.session = Buffer.from(response.session_cookie);
          zeroBuffer(response.session_cookie);
        }
        if (spec.ordinal === 4) {
          if (
            !(response.csrf_token instanceof Uint8Array) ||
            !(response.csrf_cookie instanceof Uint8Array)
          ) throw new AdminV1OfficialRuntimeError("OFFICIAL_CSRF_CONTRACT");
          auth.csrfToken = Buffer.from(response.csrf_token);
          auth.csrfCookie = Buffer.from(response.csrf_cookie);
          zeroBuffer(response.csrf_token);
          zeroBuffer(response.csrf_cookie);
        }
        if (response.ownership_projection === "EXACT_POSTSTATE_REQUIRED") {
          poststateOwnershipRequired = true;
          validatePoststateEffect(
            spec.ordinal,
            response.effect,
            lane,
            expectedAuditActions,
          );
          if (lane === "OFFICIAL" && spec.ordinal === 15) {
            state.owned.logo = {
              object_id: response.effect.logo_object_id,
              version: response.effect.storage_version,
            };
            state.effects.logo_objects = 1;
          }
        } else if (poststateOwnershipRequired) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
        } else if (lane === "OFFICIAL") {
          validateEffect(state, spec.ordinal, response.effect);
        }
        if (spec.ordinal === 19) clearAuth(auth);
        state.evidence.push(evidence);
        if (lane === "OFFICIAL") state.last_completed_official_ordinal = sequenceOrdinal;
        else state.last_completed_qualification_ordinal = sequenceOrdinal;
        state.stage = `${lane}_REQUEST_${sequenceOrdinal}_COMPLETED`;
        journal.publish(publicState(state));
      }
    } finally {
      clearAuth(auth);
    }
  };

  let primaryError = null;
  let recoveryPending = false;
  let storageReplacementPreserved = false;
  let poststateOwnershipRequired = false;
  let logoOwnershipConfirmed = false;
  const expectedAuditActions = [];
  const cleanup = async () => {
    state.lifecycle = "CLEANUP_PENDING";
    state.stage = "CLEANUP_PENDING_PUBLISHED";
    journal.publish(publicState(state));
    if (state.owned.logo !== null) {
      if (poststateOwnershipRequired && !logoOwnershipConfirmed) {
        recoveryPending = true;
        state.cleanup.push("STORAGE_OWNERSHIP_UNPROVEN");
      } else {
      const observed = await invoke("storage_read_owned_version", {
        object_id: state.owned.logo.object_id,
      });
      if (observed?.status !== "EXACT" || !boundedAscii(observed.version, 128)) {
        recoveryPending = true;
      } else if (observed.version !== state.owned.logo.version) {
        storageReplacementPreserved = true;
        recoveryPending = true;
        state.cleanup.push("STORAGE_REPLACEMENT_PRESERVED");
      } else {
        let grantId = null;
        try {
          const grant = await mutation(
            "prepare_storage_cleanup_grant",
            {
              object_id: state.owned.logo.object_id,
              expected_version: state.owned.logo.version,
            },
            (response) => {
              if (!exactAdapterResponse(response, "PREPARED") ||
                !boundedAscii(response.grant_id, 128)) {
                throw new AdminV1OfficialRuntimeError("OFFICIAL_STORAGE_GRANT_MISMATCH");
              }
              return response.grant_id;
            },
          );
          grantId = grant;
          state.effects.grant_prepare = 1;
          const deleted = await mutation(
            "delete_storage_exact_version",
            {
              object_id: state.owned.logo.object_id,
              expected_version: state.owned.logo.version,
              grant_id: grantId,
            },
            (response) => response?.status,
          );
          if (deleted !== "DELETED_EXACT") recoveryPending = true;
        } finally {
          if (grantId !== null) {
            const revoked = await mutation(
              "revoke_storage_cleanup_grant",
              { grant_id: grantId },
              (response) => response?.status,
            );
            if (revoked !== "REVOKED_EXACT") recoveryPending = true;
            else state.effects.grant_revoke = 1;
          }
        }
      }
      }
    }
    const safeDelete = async (operation, input = {}) => {
      try {
        const result = await mutation(operation, input, (response) => response?.status);
        if (result !== "DELETED_EXACT") recoveryPending = true;
        else state.cleanup.push(operation.toUpperCase());
      } catch {
        recoveryPending = true;
      }
    };
    if (state.effects.audits > 0) {
      await safeDelete("delete_owned_audits", {
        rows: structuredClone(state.owned.audit_rows),
      });
    }
    for (let index = 0; index < state.owned.submissions.length; index += 1) {
      await safeDelete(`delete_submitted_fixture_${index + 1}`, {
        row_id: state.owned.submissions[index].row_id,
        expected_version: state.owned.submissions[index].version,
      });
    }
    for (let index = 0; index < state.owned.tools.length; index += 1) {
      await safeDelete(`delete_owned_tool_${index + 1}`, {
        row_id: state.owned.tools[index].row_id,
        expected_version: state.owned.tools[index].version,
      });
    }
    let dataResidualProven = false;
    try {
      const residual = await invoke("verify_zero_data_residual", {
        allow_non_owned_storage_replacement: storageReplacementPreserved,
        owned: {
          audit_rows: structuredClone(state.owned.audit_rows),
          logo: structuredClone(state.owned.logo),
          submissions: structuredClone(state.owned.submissions),
          tools: structuredClone(state.owned.tools),
        },
      });
      dataResidualProven = residual?.status === "PROVEN_ABSENT" &&
        residual.ownership_readback === "EXACT" &&
        residual.unrelated_preserved === true;
      if (!dataResidualProven) recoveryPending = true;
    } catch {
      recoveryPending = true;
    }
    if (state.owned.deployment_id !== null) {
      await safeDelete("retire_protected_access", {
        deployment_id: state.owned.deployment_id,
      });
      await safeDelete("delete_preview", { deployment_id: state.owned.deployment_id });
    }
    for (let index = 0; index < state.owned.environment_record_ids.length; index += 1) {
      await safeDelete(`delete_environment_${index + 1}`, {
        record_id: state.owned.environment_record_ids[index],
      });
    }
    if (state.owned.remote_ref !== null) {
      try {
        const observed = await invoke("inspect_remote_ref_before_delete", {
          ref_id: state.owned.remote_ref,
        });
        if (observed?.status !== "EXACT_OWNED") recoveryPending = true;
        else await safeDelete("delete_remote_ref", { ref_id: state.owned.remote_ref });
      } catch {
        recoveryPending = true;
      }
    }
    if (state.owned.local_temp_state !== null) {
      await safeDelete("cleanup_local_owned_temp_state", {
        local_state_id: state.owned.local_temp_state,
      });
    }
    let externalResidualProven = false;
    try {
      const residual = await invoke("verify_zero_external_residual", {
        local_state_id: state.owned.local_temp_state,
        remote_ref: state.owned.remote_ref,
        deployment_id: state.owned.deployment_id,
        environment_record_ids: [...state.owned.environment_record_ids],
      });
      externalResidualProven = residual?.status === "PROVEN_ABSENT" &&
        residual.ownership_readback === "EXACT" &&
        residual.unrelated_preserved === true;
      if (!externalResidualProven) recoveryPending = true;
    } catch {
      recoveryPending = true;
    }
    state.zero_residual = dataResidualProven && externalResidualProven;
    if (recoveryPending) {
      state.lifecycle = "RECOVERY_PENDING";
      state.stage = "CLEANUP_UNPROVEN";
      journal.publish(publicState(state));
      return;
    }
    state.lifecycle = "CLEANUP_COMPLETE";
    state.stage = "CLEANUP_COMPLETE_PUBLISHED";
    journal.publish(publicState(state));
    journal.retire(publicState(state));
  };

  try {
    const residue = await invoke("inspect_prior_residue");
    if (residue?.status !== "ABSENT") {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_PRIOR_RESIDUE");
    }
    const environment = await invoke("inspect_environment_contract");
    if (
      environment?.status !== "EXACT" ||
      canonicalJson(environment.names) !== canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES)
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CONTRACT");
    const database = await invoke("inspect_owned_database_residue");
    if (database?.status !== "ABSENT") {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_PRIOR_RESIDUE");
    }
    state.owned.local_temp_state = await mutation(
      "prepare_local_temporary_commit",
      {
        baseline: validated.repository.head,
        temporary_commit_sha: validated.execution.temporary_commit_sha,
      },
      (response) => {
        if (
          !exactAdapterResponse(response, "VERIFIED_EXACT") ||
          response.commit_sha !== validated.execution.temporary_commit_sha ||
          !boundedAscii(response.local_state_id, 128)
        ) {
          throw new AdminV1OfficialRuntimeError(
            "OFFICIAL_TEMPORARY_COMMIT_MISMATCH",
          );
        }
        return response.local_state_id;
      },
    );
    const github = await invoke("inspect_github_metadata", {
      temporary_commit_sha: validated.execution.temporary_commit_sha,
    });
    if (
      github?.status !== "EXACT" ||
      github.repository !== validated.repository.remote_repository ||
      github.baseline !== validated.repository.head
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_GITHUB_IDENTITY_MISMATCH");
    const remote = await invoke("inspect_remote_ref");
    if (remote?.status !== "ABSENT") {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_PRIOR_RESIDUE");
    }
    for (let index = 1; index <= 2; index += 1) {
      const operation = `create_environment_${index}`;
      let recordId;
      try {
        recordId = await mutation(
          operation,
          {
            key: validated.execution.environment_keys[index - 1],
            value: index === 1
              ? sensitive.admin_password
              : sensitive.admin_session_secret,
          },
          (response) => {
            if (!exactAdapterResponse(response, "CREATED_EXACT") ||
              !boundedAscii(response.record_id, 128)) {
              throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CREATE_MISMATCH");
            }
            return response.record_id;
          },
          (ownedRecordId) => {
            state.owned.environment_record_ids.push(ownedRecordId);
          },
        );
      } catch (error) {
        const failure = boundedEnvironmentCreateFailure(operation, error);
        if (failure !== null) {
          state.failure = failure;
          state.stage = `FAILURE_${operation.toUpperCase()}_CLASSIFIED`;
          journal.publish(publicState(state));
        }
        throw error;
      }
      const verifiedEnvironment = await invoke(`verify_environment_${index}`, {
        key: validated.execution.environment_keys[index - 1],
        record_id: recordId,
      });
      if (
        !exactAdapterResponse(verifiedEnvironment, "EXACT") ||
        verifiedEnvironment.record_id !== recordId
      ) {
        throw new AdminV1OfficialRuntimeError(
          "OFFICIAL_ENVIRONMENT_CREATE_MISMATCH",
        );
      }
    }
    await mutation(
      "create_remote_ref",
      { commit_sha: validated.execution.temporary_commit_sha },
      (response) => {
        if (!exactAdapterResponse(response, "CREATED_EXACT") ||
          response.ref_id !==
            `refs/heads/${validated.execution.branch_name}`) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_REMOTE_REF_MISMATCH");
        }
        return response.ref_id;
      },
      (ownedRefId) => {
        state.owned.remote_ref = ownedRefId;
      },
    );
    const maximumAutomaticPreviewObservations = 5;
    const maximumAutomaticPreviewElapsedMs = 20_000;
    const automaticPreviewPollIntervalMs = 5_000;
    const automaticPreviewStartedAt = automatic_preview_now_epoch_ms();
    if (!Number.isFinite(automaticPreviewStartedAt)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RUNTIME_INPUT");
    }
    for (
      let observation = 1;
      observation <= maximumAutomaticPreviewObservations;
      observation += 1
    ) {
      const automatic = await invoke("acquire_automatic_preview", {
        observation,
        maximum_observations: maximumAutomaticPreviewObservations,
        maximum_elapsed_ms: maximumAutomaticPreviewElapsedMs,
      });
      if (exactAdapterResponse(automatic, "PENDING")) {
        if (observation === maximumAutomaticPreviewObservations) break;
        const observedAt = automatic_preview_now_epoch_ms();
        if (!Number.isFinite(observedAt) || observedAt < automaticPreviewStartedAt) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_RUNTIME_INPUT");
        }
        const remainingMs = maximumAutomaticPreviewElapsedMs -
          (observedAt - automaticPreviewStartedAt);
        if (remainingMs <= 0) break;
        await automatic_preview_wait(Math.min(
          automaticPreviewPollIntervalMs,
          remainingMs,
        ));
        continue;
      }
      if (
        !exactAdapterResponse(automatic, "ACQUIRED_EXACT") ||
        !boundedAscii(automatic.deployment_id, 128)
      ) {
        throw new AdminV1OfficialRuntimeError(
          "OFFICIAL_AUTOMATIC_PREVIEW_IDENTITY_MISMATCH",
        );
      }
      state.owned.deployment_id = automatic.deployment_id;
      journal.publish(publicState(state));
      break;
    }
    if (state.owned.deployment_id === null) {
      throw new AdminV1OfficialRuntimeError(
        "OFFICIAL_AUTOMATIC_PREVIEW_NOT_ACQUIRED",
      );
    }
    if (!exactAdapterResponse(await invoke("verify_preview_identity"), "EXACT")) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_PREVIEW_IDENTITY_MISMATCH");
    }
    const oidc = await invoke("generate_oidc");
    if (!(oidc?.token instanceof Uint8Array)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_OIDC_MISMATCH");
    }
    try {
      const handshake = await invoke("protected_access_handshake", {
        deployment_id: state.owned.deployment_id,
        oidc_token: oidc.token,
      });
      if (handshake?.status !== "BOUND") {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_PROTECTED_ACCESS_MISMATCH");
      }
    } finally {
      zeroBuffer(oidc.token);
    }
    for (let index = 1; index <= 3; index += 1) {
      const rowId = await mutation(
        "create_submitted_fixture",
        { fixture_ordinal: index, website: `https://${validated.run_id}-${index}.invalid/` },
        (response) => {
          if (!exactAdapterResponse(response, "CREATED_EXACT") ||
            !boundedAscii(response.row_id, 128) ||
            !boundedAscii(response.version, 128)) {
            throw new AdminV1OfficialRuntimeError("OFFICIAL_FIXTURE_CREATE_MISMATCH");
          }
          return { row_id: response.row_id, version: response.version };
        },
      );
      state.owned.submissions.push(rowId);
      state.effects.submitted_tools += 1;
      journal.publish(publicState(state));
    }
    state.lifecycle = "QUALIFICATION";
    await runLedger(ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER, "QUALIFICATION");
    if (state.last_completed_qualification_ordinal !== 6) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_QUALIFICATION_FAILED");
    }
    state.lifecycle = "OFFICIAL_RUNTIME";
    await runLedger(ADMIN_V1_OFFICIAL_LEDGER, "OFFICIAL");
    if (
      state.last_completed_official_ordinal !== 20 ||
      (!poststateOwnershipRequired && !exactEffects(state))
    ) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
    }
    const submissions = await invoke("inspect_submissions_poststate");
    const tools = await invoke("inspect_tools_poststate");
    const audits = await invoke("inspect_audits_poststate");
    if (
      submissions?.status !== "EXACT" || submissions.submitted_tools !== 3 ||
      tools?.status !== "EXACT" || tools.tools !== 2 ||
      audits?.status !== "EXACT" ||
      audits.audits !== (poststateOwnershipRequired ? 9 : 8) ||
      ![submissions, tools, audits].every((value) =>
        value.ownership_readback === "EXACT" &&
        value.unrelated_preserved === true
      )
    ) throw new AdminV1OfficialRuntimeError("OFFICIAL_POSTSTATE_MISMATCH");
    if (poststateOwnershipRequired) {
      reconcilePoststateOwnership({
        state,
        submissions,
        tools,
        audits,
        expectedAuditActions,
      });
      logoOwnershipConfirmed = true;
      if (!exactEffects(state, 9)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_EFFECT_MISMATCH");
      }
    }
    state.stage = "SANITIZED_POSTSTATE_PUBLISHED";
    journal.publish(publicState(state));
  } catch (error) {
    primaryError = error;
  }

  try {
    await cleanup();
  } catch {
    recoveryPending = true;
    state.lifecycle = "RECOVERY_PENDING";
    state.stage = "CLEANUP_EXCEPTION";
    try {
      journal.publish(publicState(state));
    } catch (publicationError) {
      const error = new AdminV1OfficialRuntimeError(
        "OFFICIAL_RECOVERY_PUBLICATION_FAILED",
      );
      error.cause = publicationError;
      throw error;
    }
  } finally {
    clearSensitiveRecord(sensitive);
  }

  if (recoveryPending) {
    return Object.freeze({
      classification: "RECOVERY_PENDING",
      official_requests: state.last_completed_official_ordinal,
      qualification_requests: state.last_completed_qualification_ordinal,
      runtime_sessions: state.runtime_sessions,
      runtime_retries: 0,
      runtime_replays: 0,
      token_spent: state.token_spent,
      storage_replacement_preserved: storageReplacementPreserved,
      zero_residual_owned_state: state.zero_residual,
      effects: Object.freeze(structuredClone(state.effects)),
      budgets: Object.freeze(structuredClone(budget.used)),
    });
  }
  if (primaryError !== null) throw primaryError;
  return Object.freeze({
    classification: "OFFICIAL_RUNTIME_COMPLETE",
    official_requests: 20,
    qualification_requests: 6,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    token_spent: true,
    storage_replacement_preserved: false,
    zero_residual_owned_state: true,
    effects: Object.freeze(structuredClone(state.effects)),
    budgets: Object.freeze(structuredClone(budget.used)),
  });
}
