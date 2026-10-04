import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256,
  OFFICIAL_ISOLATION_KEYS,
  OFFICIAL_PREVIEW_ENVIRONMENT_KEYS,
  OFFICIAL_PREVIEW_ENVIRONMENT_PLAN,
  validateOfficialIsolationAuthorization,
  observeOfficialClientOrigin,
  validateOfficialIsolationBinding,
} from "./admin-v1-official-isolation.mjs";

export const ADMIN_V1_OFFICIAL_OPERATION_CLASS =
  "ADMIN_V1_OFFICIAL_RUNTIME_V1";

export const STORAGE_CLEANUP_CONTRACT = "DETERMINISTIC_STORAGE_CLEANUP_V1";

export function officialStorageGrantId(authorization, logo) {
  if (authorization.schema_version !== 2 || !boundedAscii(logo?.object_id, 256) ||
      !boundedAscii(logo?.version, 128)) throw new AdminV1OfficialRuntimeError("OFFICIAL_STORAGE_GRANT_MISMATCH");
  const digest = createHash("sha256").update(canonicalJson({ domain: "AIFINDER_STORAGE_CLEANUP_GRANT_ID_V1",
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS, run_id: authorization.run_id,
    bucket: authorization.execution.storage_bucket, object_id: logo.object_id, expected_version: logo.version })).digest();
  // RFC UUIDv8 custom SHA-256 layout; variant 10, version 8.
  digest[6] = (digest[6] & 15) | 0x80; digest[8] = (digest[8] & 63) | 0x80;
  const hex = digest.subarray(0, 16).toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function officialRecoveryActionCost(operation, usage) {
  const key = { prepare_storage_cleanup_grant: "grant_prepare_rpc_calls",
    revoke_storage_cleanup_grant: "grant_revoke_rpc_calls" }[operation];
  return key && usage[key] === 1 ? { cleanup_reconciliation_requests: 1 } : ADMIN_V1_OFFICIAL_ACTION_COSTS_V2[operation];
}

// A pure protocol: both the executor and the independent adapter admission
// advance this machine. Only the executor publishes or dispatches effects.
export function* officialStorageCleanupSteps(state, authorization) {
  const logo = state.owned.logo;
  const input = { object_id: logo.object_id, expected_version: logo.version };
  const grantId = officialStorageGrantId(authorization, logo);
  const publish = { publish: true };
  const add = marker => { if (!state.cleanup.includes(marker)) state.cleanup.push(marker); };
  const requireStatus = (result, status) => {
    if (result?.status !== status) throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_CLEANUP_UNPROVEN");
  };
  let storage = state.recovery_storage;
  if (!storage || storage.deletion === "PENDING" && storage.phase !== "REVOKE_ATTEMPTED") {
    const observed = yield { operation: "storage_read_owned_version", input };
    if (observed?.status === "ABSENT" && storage && storage.phase !== "PREPARING") {
      storage.deletion = "ABSENT_CONFIRMED";
      add("STORAGE_DELETION_CONFIRMED_ABSENT");
      if (storage.phase !== "REVOKED") storage.phase = "DELETION_COMPLETE";
      yield publish;
    } else {
      requireStatus(observed, "EXACT");
      if (observed.version !== logo.version) throw new AdminV1OfficialRuntimeError("OFFICIAL_STORAGE_CAS_MISMATCH");
      if (!storage || storage.phase === "REVOKED") {
        storage = state.recovery_storage = { ...logo, contract: STORAGE_CLEANUP_CONTRACT,
          grant_id: grantId, phase: "PREPARING", deletion: "PENDING" };
        state.cleanup = state.cleanup.filter(marker => marker !== "REVOKE_STORAGE_CLEANUP_GRANT");
        yield publish;
      }
      if (storage.phase === "PREPARING") {
        const prepared = yield { operation: "prepare_storage_cleanup_grant", input: { ...input, grant_id: grantId } };
        requireStatus(prepared, "PREPARED");
        if (prepared.grant_id !== grantId) throw new AdminV1OfficialRuntimeError("OFFICIAL_STORAGE_GRANT_MISMATCH");
        storage.phase = "PREPARED"; state.effects.grant_prepare = 1; yield publish;
      }
      try {
        storage.phase = "DELETE_ATTEMPTED"; yield publish;
        const deleted = yield { operation: "delete_storage_exact_version", input: { ...input, grant_id: grantId } };
        requireStatus(deleted, "DELETED_EXACT");
        storage.deletion = "DELETED_EXACT"; storage.phase = "DELETION_COMPLETE";
        add("DELETE_STORAGE_EXACT_VERSION"); yield publish;
      } finally {
        storage.phase = "REVOKE_ATTEMPTED"; yield publish;
        const revoked = yield { operation: "revoke_storage_cleanup_grant", input: { grant_id: grantId } };
        requireStatus(revoked, "REVOKED_EXACT");
        storage.phase = "REVOKED"; state.effects.grant_revoke = 1; add("REVOKE_STORAGE_CLEANUP_GRANT"); yield publish;
      }
    }
  }
  if (storage.phase !== "REVOKED") {
    storage.phase = "REVOKE_ATTEMPTED"; yield publish;
    const revoked = yield { operation: "revoke_storage_cleanup_grant", input: { grant_id: grantId } };
    requireStatus(revoked, "REVOKED_EXACT");
    storage.phase = "REVOKED"; state.effects.grant_revoke = 1; add("REVOKE_STORAGE_CLEANUP_GRANT"); yield publish;
  }
  if (storage.deletion === "PENDING") {
    // A revoke-uncertain continuation closes revoke first. Reopening can then
    // reconcile the exact object with whatever signed budget remains.
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_CLEANUP_UNPROVEN");
  }
}

async function executeStorageCleanup(state, authorization, invoke, publish, aborted = () => false) {
  const steps = officialStorageCleanupSteps(state, authorization);
  let step = steps.next();
  while (!step.done) {
    if (step.value.publish) {
      publish(); // Never feed a persistence failure into the effect-finally path.
      step = steps.next();
    } else {
      let result;
      try { result = await invoke(step.value.operation, step.value.input); }
      catch (error) { if (aborted()) throw error; step = steps.throw(error); continue; }
      step = steps.next(result);
    }
  }
}

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

export const ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V1 = Object.freeze({
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

export const ADMIN_V1_OFFICIAL_BUDGET_LIMITS = ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V1;
export const ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2 = Object.freeze({
  ...ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V1,
  provider_direct_mutations: 15,
  environment_records_created: 7,
  environment_records_deleted: 7,
});

export const ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1 = Object.freeze({
  budgets: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_BUDGET_LIMITS)),
  deferred_routes: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_DEFERRED_ROUTES)),
  environment_names: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES)),
  official_ledger: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_LEDGER)),
  qualification_ledger: sha256Hex(
    canonicalJson(ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER),
  ),
  target_routes: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_TARGET_ROUTES)),
});

export const ADMIN_V1_OFFICIAL_CONTRACT_SHA256 = ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1;

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

const RETENTION_RECEIPT_KEYS = Object.freeze(["policy", "phase", "deployment_id",
  "environment_record_ids", "environment_keys", "data_zero_residual",
  "external_retained_exact", "unrelated_preserved"]);

function retainedOwnershipExact(state) {
  const receipt = state?.retention;
  return exactKeys(receipt, RETENTION_RECEIPT_KEYS) &&
    receipt.policy === "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" &&
    /^dpl_[A-Za-z0-9]+$/u.test(receipt.deployment_id ?? "") &&
    receipt.deployment_id === state.owned?.deployment_id &&
    Array.isArray(receipt.environment_record_ids) &&
    receipt.environment_record_ids.length === 7 &&
    receipt.environment_record_ids.every((id) => boundedAscii(id, 128)) &&
    new Set(receipt.environment_record_ids).size === 7 &&
    Array.isArray(state.owned?.environment_record_ids) && Array.isArray(receipt.environment_keys) &&
    [receipt.data_zero_residual, receipt.external_retained_exact, receipt.unrelated_preserved].every((value) => typeof value === "boolean") &&
    canonicalJson(receipt.environment_record_ids) === canonicalJson(state.owned?.environment_record_ids) &&
    canonicalJson(receipt.environment_keys) === canonicalJson(OFFICIAL_PREVIEW_ENVIRONMENT_KEYS) &&
    state.zero_residual === false;
}

function retentionEphemeralCleanupExact(state) {
  return Array.isArray(state?.cleanup) && state.cleanup.every((step) => typeof step === "string") &&
    ["RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"]
      .every((operation) => state.cleanup.includes(operation)) &&
    !state.cleanup.some((step) => step === "DELETE_PREVIEW" || /^DELETE_ENVIRONMENT_[1-7]$/u.test(step));
}

function retentionTerminalExact(state) {
  return retainedOwnershipExact(state) && state.lifecycle === "RETENTION_COMPLETE" &&
    state.retention.phase === "COMPLETE" && state.retention.data_zero_residual === true &&
    state.retention.external_retained_exact === true && state.retention.unrelated_preserved === true &&
    state.token_spent === true && state.runtime_sessions === 1 &&
    state.last_completed_qualification_ordinal === 6 && state.last_completed_official_ordinal === 20 &&
    retentionEphemeralCleanupExact(state);
}

function requireEnvironmentVerification(response, input, authorization) {
  if (!exactAdapterResponse(response, "EXACT") || response.record_id !== input.record_id ||
    authorization.schema_version === 2 && (response.key !== input.key ||
      response.project_id !== authorization.execution.preview_project_id ||
      response.team_id !== authorization.execution.preview_team_id ||
      response.git_branch !== authorization.execution.branch_name || response.unrelated_preserved !== true)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CREATE_MISMATCH");
  }
}

function requireRetainedPreview(response, deploymentId) {
  if (!exactAdapterResponse(response, "EXACT") || response.deployment_id !== deploymentId ||
      response.unrelated_preserved !== true) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_PREVIEW_IDENTITY_MISMATCH");
  }
}

// Snapshot the admitted lifetime, but sample time immediately before every call.
// A broken clock or an expired lifetime cannot become valid again during cleanup.
export function createAdminV1OfficialExpiryGuard(authorization, now_epoch_ms,
  live_now_epoch_ms = () => Date.now()) {
  if (authorization.schema_version !== 2) return () => {};
  const created = Date.parse(authorization.created_at);
  const expires = Date.parse(authorization.expires_at);
  let last = now_epoch_ms;
  let failure = null;
  return () => {
    if (failure !== null) throw failure;
    let now;
    try { now = live_now_epoch_ms(); } catch {
      failure = new AdminV1OfficialRuntimeError("OFFICIAL_CLOCK_INVALID");
      throw failure;
    }
    if (!Number.isSafeInteger(now) || !Number.isSafeInteger(last) || now < last || now < created) {
      failure = new AdminV1OfficialRuntimeError("OFFICIAL_CLOCK_INVALID");
    } else if (now >= expires) {
      failure = new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_EXPIRED");
    }
    if (failure !== null) throw failure;
    last = now;
  };
}

// The plan contains only unfinished cleanup of handles in the durable journal.
export function adminV1OfficialRetentionCleanupPlan(state) {
  const plan = [];
  const add = (operation, input) => {
    if (!state.cleanup.includes(operation.toUpperCase())) plan.push({ operation, input });
  };
  if (!state.retention.data_zero_residual) {
    if (state.owned.logo !== null && (!(state.cleanup.includes("DELETE_STORAGE_EXACT_VERSION") || state.cleanup.includes("STORAGE_DELETION_CONFIRMED_ABSENT")) ||
        !state.cleanup.includes("REVOKE_STORAGE_CLEANUP_GRANT"))) {
      plan.push({ operation: "resume_storage_cleanup", input: structuredClone(state.owned.logo) });
    }
    if (state.effects.audits > 0) add("delete_owned_audits", { rows: structuredClone(state.owned.audit_rows) });
    for (const [kind, prefix] of [["submissions", "delete_submitted_fixture"], ["tools", "delete_owned_tool"]]) {
      for (let index = 0; index < state.owned[kind].length; index += 1) {
        const row = state.owned[kind][index];
        add(`${prefix}_${index + 1}`, { row_id: row.row_id, expected_version: row.version });
      }
    }
  }
  if (!state.retention.data_zero_residual || plan.length > 0) plan.push({ operation: "verify_zero_data_residual",
    input: { allow_non_owned_storage_replacement: false, owned: {
      audit_rows: structuredClone(state.owned.audit_rows), logo: structuredClone(state.owned.logo),
      submissions: structuredClone(state.owned.submissions), tools: structuredClone(state.owned.tools),
    } } });
  add("retire_protected_access", { deployment_id: state.owned.deployment_id });
  if (!state.cleanup.includes("DELETE_REMOTE_REF")) {
    plan.push({ operation: "inspect_remote_ref_before_delete", input: { ref_id: state.owned.remote_ref } });
    add("delete_remote_ref", { ref_id: state.owned.remote_ref });
  }
  add("cleanup_local_owned_temp_state", { local_state_id: state.owned.local_temp_state });
  return plan;
}

// A committed run is never replayed. Finish only journal-bound cleanup before
// entering the existing retained-resource verification sequence.
export async function recoverAdminV1OfficialRetention({ authorization, adapters, journal,
  now_epoch_ms = Date.now(), live_now_epoch_ms = () => Date.now() }) {
  const validated = validateAdminV1OfficialAuthorization(authorization, { now_epoch_ms });
  if (validated.schema_version !== 2 || typeof adapters?.invoke !== "function" ||
      typeof journal?.load !== "function" || typeof journal.publish !== "function" ||
      typeof journal.retire !== "function") throw new AdminV1OfficialRuntimeError("OFFICIAL_RUNTIME_INPUT");
  const record = journal.load();
  if (record?.retired === true) throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_SPENT");
  const state = structuredClone(validateAdminV1OfficialRetentionRecoveryRecord(record, validated).state);
  const plan = adminV1OfficialRetentionCleanupPlan(state);
  const guard = createAdminV1OfficialExpiryGuard(validated, now_epoch_ms, live_now_epoch_ms);
  const budget = createAdminV1OfficialBudget({ schema_version: 2 });
  Object.assign(budget.used, state.recovery_usage);
  let persistenceFailed = false;
  let expectedDocument = structuredClone(record.value);
  const publish = () => {
    try {
      const before = journal.load();
      if (before?.retired !== false || canonicalJson(before.value) !== canonicalJson(expectedDocument)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
      }
      journal.publish(state);
      expectedDocument = { ...expectedDocument, sequence: expectedDocument.sequence + 1, state: structuredClone(state) };
      const after = journal.load();
      if (after?.retired !== false || canonicalJson(after.value) !== canonicalJson(expectedDocument)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
      }
    } catch (error) { persistenceFailed = true;throw error; }
  };
  const reserve = (cost) => {
    if (persistenceFailed) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    guard();
    budget.take(cost);
    state.recovery_usage = structuredClone(budget.used);
    publish();
    guard();
  };
  const read = async (operation, input = {}) => {
    const logo = state.owned.logo;
    const storageInputs = logo === null ? {} : {
      storage_read_owned_version: { object_id: logo.object_id, expected_version: logo.version },
      prepare_storage_cleanup_grant: { object_id: logo.object_id, expected_version: logo.version,
        grant_id: state.recovery_storage?.grant_id },
      delete_storage_exact_version: { object_id: logo.object_id, expected_version: logo.version,
        grant_id: state.recovery_storage?.grant_id },
      revoke_storage_cleanup_grant: { grant_id: state.recovery_storage?.grant_id },
    };
    const allowed = operation === "verify_preview_identity" || operation === "inspect_remote_ref" ||
      operation === "inspect_environment_contract" || /^verify_environment_[1-7]$/u.test(operation) ||
      Object.hasOwn(storageInputs, operation) && canonicalJson(storageInputs[operation]) === canonicalJson(input) ||
      plan.some((step) => step.operation === operation && canonicalJson(step.input) === canonicalJson(input));
    if (!allowed) throw new AdminV1OfficialRuntimeError("OFFICIAL_ADAPTER_OPERATION_DENIED");
    reserve(officialRecoveryActionCost(operation, state.recovery_usage));
    let active = true;
    try {
      return await adapters.invoke(operation, input, { reserve_database_request() {
        if (!active || !(ADMIN_V1_OFFICIAL_ACTION_COSTS_V2[operation].database_rest_requests ||
            Object.hasOwn(storageInputs, operation))) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_ADAPTER_OPERATION_DENIED");
        }
        reserve({ database_rest_requests: 1, database_rest_successes: 1 });
      } });
    } finally { active = false; }
  };
  let projectPreflightPending = false;
  try {
    if (plan.length > 0) {
      projectPreflightPending = true;
      const environment = await read("inspect_environment_contract");
      if (environment?.status !== "EXACT" || canonicalJson(environment.names) !==
          canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES)) throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CONTRACT");
      projectPreflightPending = false;
      let remoteAbsent = false;
      for (const { operation, input } of plan) {
        if (operation === "resume_storage_cleanup") {
          await executeStorageCleanup(state, validated, read, publish, () => persistenceFailed);
          continue;
        }
        if (operation === "delete_remote_ref" && remoteAbsent) {
          state.cleanup.push("DELETE_REMOTE_REF");state.stage = "RECOVERY_COMPLETE_DELETE_REMOTE_REF";
          publish();continue;
        }
        const result = await read(operation, input);
        if (operation === "inspect_remote_ref_before_delete") {
          remoteAbsent = result?.status === "ABSENT";
          if (!remoteAbsent && (result?.status !== "EXACT_OWNED" || result.ref_id !== state.owned.remote_ref ||
              result.commit_sha !== validated.execution.temporary_commit_sha)) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
          continue;
        }
        if (operation === "verify_zero_data_residual") {
          if (result?.status !== "PROVEN_ABSENT" || result.ownership_readback !== "EXACT" ||
              result.unrelated_preserved !== true) throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_CLEANUP_UNPROVEN");
          state.retention.data_zero_residual = true;
        } else {
          if (result?.status !== "DELETED_EXACT") throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_CLEANUP_UNPROVEN");
          state.cleanup.push(operation.toUpperCase());
          if (/^delete_(owned|submitted)/u.test(operation)) state.retention.data_zero_residual = false;
        }
        state.stage = `RECOVERY_COMPLETE_${operation.toUpperCase()}`;
        publish();
      }
    }
    if (state.retention.data_zero_residual !== true || !retentionEphemeralCleanupExact(state)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_EPHEMERAL_CLEANUP_UNPROVEN");
    }
    if ((await read("inspect_remote_ref")).status !== "ABSENT") {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_CLEANUP_UNPROVEN");
    }
    requireRetainedPreview(await read("verify_preview_identity", { deployment_id: state.retention.deployment_id }),
      state.retention.deployment_id);
    projectPreflightPending = true;
    const environment = await read("inspect_environment_contract");
    if (environment?.status !== "EXACT" || canonicalJson(environment.names) !==
        canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CONTRACT");
    }
    projectPreflightPending = false;
    for (let index = 0; index < 7; index += 1) {
      const input = { key: state.retention.environment_keys[index], record_id: state.retention.environment_record_ids[index] };
      requireEnvironmentVerification(await read(`verify_environment_${index + 1}`, input), input, validated);
    }
    state.retention.external_retained_exact = true;state.retention.unrelated_preserved = true;
    state.retention.phase = "COMPLETE";state.lifecycle = "RETENTION_COMPLETE";state.stage = "RETENTION_COMPLETE_PUBLISHED";
    publish();journal.retire(state);
    return Object.freeze({ classification: "RETENTION_COMPLETE", zero_residual_owned_state: false,
      retention: Object.freeze(structuredClone(state.retention)) });
  } catch {
    state.retention.phase = "COMMITTED";state.retention.external_retained_exact = false;state.retention.unrelated_preserved = false;
    state.lifecycle = "RECOVERY_PENDING";state.stage = "RETENTION_RECOVERY_UNPROVEN";
    // An unproven project preflight cannot authorize a durable recovery transition.
    if (!projectPreflightPending && !persistenceFailed) publish();
    return Object.freeze({ classification: "RECOVERY_PENDING", zero_residual_owned_state: false });
  }
}

export function classifyAdminV1OfficialRecoveryState(record) {
  const state = record?.value?.state ?? record?.state ?? record;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
  if (Object.hasOwn(state, "retention")) {
    const precommitCleanupComplete = ["UNARMED", "ARMED"].includes(state.retention?.phase) &&
      state.lifecycle === "CLEANUP_COMPLETE" && state.zero_residual === true;
    if (state.retired !== undefined && typeof state.retired !== "boolean" ||
        record !== state && record?.retired !== undefined && typeof record.retired !== "boolean" ||
        record !== state && record?.retired === true && state.retired !== true ||
        record !== state && record?.retired === false && state.retired === true ||
        state.retention?.phase !== "COMPLETE" && !precommitCleanupComplete &&
          (state.retired === true || record !== state && record?.retired === true)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    }
    if (!exactKeys(state.retention, RETENTION_RECEIPT_KEYS) ||
        state.retention.policy !== "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1") {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    }
    if (state.retention.phase === "COMPLETE" || state.lifecycle === "RETENTION_COMPLETE") {
      if (retentionTerminalExact(state) && state.retired === true &&
          (record === state || record?.retired === true)) return "RETENTION_COMPLETE";
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    }
    if (state.retention.phase === "COMMITTED") {
      if (!retainedOwnershipExact(state)) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
      return state.lifecycle === "RECOVERY_PENDING" ? "RECOVERY_PENDING" : "RETENTION_PENDING";
    }
    if (!["UNARMED", "ARMED"].includes(state.retention.phase)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    }
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
const CONTRACT_DIGEST_KEYS_V2 = Object.freeze(["action_costs", ...CONTRACT_DIGEST_KEYS]);
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
const V2_AUTHORIZATION_KEYS = Object.freeze([...AUTHORIZATION_KEYS, "isolation_contract_sha256"]);
const V2_EXECUTION_KEYS = Object.freeze([...EXECUTION_KEYS, "provider_cleanup_policy", "isolation"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class AdminV1OfficialRuntimeError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialRuntimeError";
    this.code = code;
  }
}

function sameIsolatedFile(left, right) {
  return ["dev", "ino", "mode", "uid", "gid", "nlink", "size", "mtimeMs", "ctimeMs"]
    .every((key) => left[key] === right[key]);
}

export function readAdminV1OfficialIsolatedBundle({ authorization, now_epoch_ms }) {
  const binding = validateOfficialIsolationAuthorization(
    authorization, now_epoch_ms,
  );
  const root = authorization.execution.journal_directory;
  const pathname = binding.credential_bundle_path;
  let descriptor;
  let acquired;
  const mutable = [];
  try {
    const repository = lstatSync(authorization.repository.root);
    const directory = lstatSync(root);
    if (!repository.isDirectory() || repository.isSymbolicLink() ||
      !directory.isDirectory() || directory.isSymbolicLink() ||
      directory.uid !== repository.uid || directory.nlink < 1 ||
      (directory.mode & 0o777) !== 0o700 || realpathSync(root) !== root) {
      throw new Error("ROOT_IDENTITY");
    }
    const before = lstatSync(pathname);
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 ||
      before.uid !== repository.uid || (before.mode & 0o777) !== 0o600 ||
      before.size < 1 || before.size > 128 * 1024 ||
      realpathSync(pathname) !== pathname || !Number.isInteger(constants.O_NOFOLLOW)) {
      throw new Error("BUNDLE_IDENTITY");
    }
    descriptor = openSync(pathname, constants.O_RDONLY | constants.O_NOFOLLOW);
    if (!sameIsolatedFile(before, fstatSync(descriptor))) {
      throw new Error("BUNDLE_CHANGED");
    }
    acquired = Buffer.alloc(before.size + 1);
    let length = 0;
    while (length < acquired.byteLength) {
      const count = readSync(descriptor, acquired, length,
        acquired.byteLength - length, null);
      if (count === 0) break;
      length += count;
    }
    if (length !== before.size ||
      !sameIsolatedFile(before, fstatSync(descriptor)) ||
      !sameIsolatedFile(before, lstatSync(pathname))) {
      throw new Error("BUNDLE_CHANGED");
    }
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      acquired.subarray(0, length),
    );
    const bundle = JSON.parse(decoded);
    if (!bundle || Object.getPrototypeOf(bundle) !== Object.prototype ||
      Object.keys(bundle).sort().join(",") !==
        "provenance_receipt,provisioning_receipt,run_id,schema_version,values" ||
      decoded !== `${canonicalJson(bundle)}\n` ||
      !bundle.values || Object.getPrototypeOf(bundle.values) !== Object.prototype) {
      throw new Error("BUNDLE_FORMAT");
    }
    const names = ["admin_password", "admin_session_secret", "github_token",
      "supabase_anon_key", "supabase_service_role_key", "supabase_url",
      "vercel_token"];
    if (Object.keys(bundle.values).sort().join(",") !==
      [...names].sort().join(",")) throw new Error("BUNDLE_CATEGORIES");
    for (const name of names) {
      const encodedCredential = bundle.values[name];
      if (typeof encodedCredential !== "string" || encodedCredential.length < 1 ||
        encodedCredential.length > 16_384 || encodedCredential.includes("\0")) {
        throw new Error("BUNDLE_VALUE");
      }
      const bytes = Buffer.from(encodedCredential, "utf8");
      mutable.push(bytes);
      bundle.values[name] = bytes;
    }
    return bundle;
  } catch {
    for (const byteArray of mutable) byteArray.fill(0);
    throw new AdminV1OfficialRuntimeError("OFFICIAL_ISOLATED_BUNDLE_INVALID");
  } finally {
    if (acquired) acquired.fill(0);
    if (descriptor !== undefined) closeSync(descriptor);
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

function validatedAuthorizationFields(
  record,
  { now_epoch_ms = Date.now() } = {},
) {
  const isolated = record?.schema_version === 2;
  if (isolated && (!exactKeys(record, V2_AUTHORIZATION_KEYS) ||
      !exactKeys(record.repository, REPOSITORY_KEYS) ||
      !exactKeys(record.execution, V2_EXECUTION_KEYS) ||
      !exactKeys(record.execution?.isolation, OFFICIAL_ISOLATION_KEYS) ||
      !exactKeys(record.compatibility_support_sha256, SUPPORT_PATHS) ||
      !exactKeys(record.route_source_sha256, ROUTE_IDENTITY_PATHS) ||
      !exactKeys(record.contract_sha256, CONTRACT_DIGEST_KEYS_V2))) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  }
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
    !exactKeys(value, isolated ? V2_AUTHORIZATION_KEYS : AUTHORIZATION_KEYS) ||
    value.schema_version !== (isolated ? 2 : 1) ||
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
    !exactDigestMap(value.contract_sha256, isolated ? CONTRACT_DIGEST_KEYS_V2 : CONTRACT_DIGEST_KEYS) ||
    canonicalJson(value.contract_sha256) !==
      canonicalJson(isolated ? ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2 : ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1) ||
    created === null || expires === null || created >= expires ||
    now_epoch_ms < created || now_epoch_ms >= expires ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !UUID_PATTERN.test(value.run_id ?? "") ||
    !exactKeys(repository, REPOSITORY_KEYS) ||
    !path.isAbsolute(repository.root) ||
    isolated && repository.root !== "/Users/jamescarlodumaua/aifinder" ||
    repository.branch !== "main" ||
    !/^[0-9a-f]{40}$/u.test(repository.head ?? "") ||
    repository.origin_main !== repository.head ||
    repository.remote_main !== repository.head ||
    repository.ahead !== 0 || repository.behind !== 0 ||
    repository.index_empty !== true || repository.worktree_count !== 1 ||
    !isSha256(repository.status_sha256) ||
    repository.remote_repository !== "jcdumaua/aifinder" ||
    !exactKeys(execution, isolated ? V2_EXECUTION_KEYS : EXECUTION_KEYS) ||
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
      canonicalJson(isolated ? OFFICIAL_PREVIEW_ENVIRONMENT_KEYS : ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"])
  ) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  }
  if (isolated) {
    try {
      if (value.isolation_contract_sha256 !== ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256) {
        throw new Error("V2_DIGEST");
      }
      validateOfficialIsolationAuthorization(value, now_epoch_ms);
    } catch {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
    }
  }
  return value;
}

export function validateAdminV1OfficialAuthorization(record, options = {}) {
  const value = validatedAuthorizationFields(record, options);
  if (
    realpathSync(value.repository.root) !== value.repository.root ||
    value.schema_version === 2 &&
      value.one_use_authorization_sha256 !== adminV1OfficialOneUseAuthorizationDigest(value)
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  return deepFreeze(value);
}

export function adminV1OfficialOneUseAuthorizationDigest(record) {
  if (record?.schema_version !== 2 || !exactKeys(record, V2_AUTHORIZATION_KEYS)) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_INVALID");
  }
  const value = validatedAuthorizationFields({
    ...record,
    one_use_authorization_sha256: "0".repeat(64),
  }, {
    now_epoch_ms: typeof record.created_at === "string"
      ? Date.parse(record.created_at)
      : Number.NaN,
  });
  const unsigned = { domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2" };
  for (const key of V2_AUTHORIZATION_KEYS) {
    if (key !== "one_use_authorization_sha256") unsigned[key] = value[key];
  }
  return sha256Hex(canonicalJson(unsigned));
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
  const bytes = readAdminV1OfficialRecoveryFile({ target: filePath, owner: lstatSync(path.dirname(filePath)).uid });
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
  let scanned = serialized;
  if (Object.hasOwn(value.state ?? {}, "retention")) {
    const receipt = value.state.retention;
    if (!exactKeys(receipt, RETENTION_RECEIPT_KEYS) ||
        receipt.policy !== "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" ||
        !["UNARMED", "ARMED", "COMMITTED", "COMPLETE"].includes(receipt.phase) ||
        canonicalJson(receipt.environment_keys) !== canonicalJson(OFFICIAL_PREVIEW_ENVIRONMENT_KEYS)) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_EVIDENCE_SENSITIVE");
    }
    // These seven constant names are public contract metadata. Exempt only
    // this exact array; every other journal field retains the original scan.
    const publicProjection = structuredClone(value);
    publicProjection.state.retention.environment_keys = [];
    scanned = canonicalJson(publicProjection);
  }
  if (forbidden.some((entry) => scanned.toLowerCase().includes(entry))) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_EVIDENCE_SENSITIVE");
  }
  return serialized;
}

function storageEffectsInvalid(state) {
  return state.recovery_storage === undefined
    ? state.effects.grant_prepare !== state.effects.grant_revoke
    : state.effects.grant_prepare > 1 || state.effects.grant_revoke > 1 ||
      state.effects.grant_prepare > state.recovery_usage.grant_prepare_rpc_calls ||
      state.effects.grant_revoke > state.recovery_usage.grant_revoke_rpc_calls;
}

// Admission for a continuation of one completed, spent schema-v2 runtime.
export function validateAdminV1OfficialRetentionRecoveryRecord(record, authorization, { complete = false } = {}) {

  const value = record?.value;
  const state = value?.state;
  const receipt = state?.retention;
  const stateKeys = ["lifecycle", "stage", "token_spent", "runtime_sessions", "runtime_retries", "runtime_replays", "last_attempted_qualification_ordinal", "last_completed_qualification_ordinal", "last_attempted_official_ordinal", "last_completed_official_ordinal", "owned", "effects", "evidence", "failure", "cleanup", "zero_residual", "retention", "recovery_usage"];
  const ids = receipt?.environment_record_ids;
  if (authorization?.schema_version !== 2 ||
      authorization.execution?.provider_cleanup_policy !== "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" ||
      record?.retired !== complete || !exactKeys(value, ["schema_version", "identity", "sequence", "state"]) ||
      value.schema_version !== 1 || !Number.isSafeInteger(value.sequence) || value.sequence < 1 ||
      !exactKeys(value.identity, ["authorization_id_sha256", "run_id"]) ||
      value.identity.authorization_id_sha256 !== authorization.authorization_id_sha256 || value.identity.run_id !== authorization.run_id ||
      !exactKeys(state, [...stateKeys, ...(complete ? ["retired"] : []),
        ...(Object.hasOwn(state ?? {}, "recovery_storage") ? ["recovery_storage"] : [])]) ||
      !exactKeys(state.recovery_usage, Object.keys(ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2)) ||
      !Object.entries(state.recovery_usage).every(([key, count]) => Number.isSafeInteger(count) &&
        count >= 0 && count <= ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2[key]) ||
      (complete ? state.retired !== true || state.lifecycle !== "RETENTION_COMPLETE" : !["RETENTION_PENDING", "RECOVERY_PENDING"].includes(state.lifecycle)) ||
      receipt?.phase !== (complete ? "COMPLETE" : "COMMITTED") ||
      state.token_spent !== true || state.runtime_sessions !== 1 || state.runtime_retries !== 0 || state.runtime_replays !== 0 ||
      state.last_attempted_qualification_ordinal !== 6 || state.last_completed_qualification_ordinal !== 6 ||
      state.last_attempted_official_ordinal !== 20 || state.last_completed_official_ordinal !== 20 ||
      typeof state.stage !== "string" || !/^[A-Z0-9_]{1,128}$/u.test(state.stage) ||
      !exactKeys(receipt, ["policy", "phase", "deployment_id", "environment_record_ids", "environment_keys", "data_zero_residual", "external_retained_exact", "unrelated_preserved"]) ||
      receipt.policy !== authorization.execution.provider_cleanup_policy || !/^dpl_[A-Za-z0-9]+$/u.test(receipt.deployment_id ?? "") ||
      !Array.isArray(ids) || ids.length !== 7 || new Set(ids).size !== 7 ||
      !ids.every((id) => typeof id === "string" && /^[\x21-\x7e]{1,128}$/u.test(id)) ||
      canonicalJson(receipt.environment_keys) !== canonicalJson(OFFICIAL_PREVIEW_ENVIRONMENT_KEYS) ||
      canonicalJson(authorization.execution.environment_keys) !== canonicalJson(OFFICIAL_PREVIEW_ENVIRONMENT_KEYS) ||
      typeof receipt.data_zero_residual !== "boolean" || complete && receipt.data_zero_residual !== true ||
      ![receipt.external_retained_exact, receipt.unrelated_preserved].every((flag) => typeof flag === "boolean") ||
      complete && (receipt.external_retained_exact !== true || receipt.unrelated_preserved !== true) || state.zero_residual !== false ||
      !exactKeys(state.owned, ["local_temp_state", "remote_ref", "environment_record_ids", "deployment_id", "submissions", "tools", "audit_rows", "logo"]) ||
      state.owned.deployment_id !== receipt.deployment_id || canonicalJson(state.owned.environment_record_ids) !== canonicalJson(ids) ||
      !(state.owned.local_temp_state === null || typeof state.owned.local_temp_state === "string" && /^[\x21-\x7e]{1,256}$/u.test(state.owned.local_temp_state)) ||
      !(state.owned.remote_ref === null || state.owned.remote_ref === `refs/heads/${authorization.execution.branch_name}`) ||
      !(state.owned.logo === null || state.owned.logo && typeof state.owned.logo === "object" && !Array.isArray(state.owned.logo)) ||
      ![state.owned.submissions, state.owned.tools, state.owned.audit_rows].every((rows) => Array.isArray(rows) && rows.length <= 9 &&
        rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) ||
      !exactKeys(state.effects, ["submitted_tools", "tools", "audits", "approval_rpc", "logo_objects", "grant_prepare", "grant_revoke"]) ||
      !Object.values(state.effects).every((count) => Number.isSafeInteger(count) && count >= 0) ||
      !Array.isArray(state.evidence) || !(state.failure === null || state.failure && typeof state.failure === "object" && !Array.isArray(state.failure)) ||
      !Array.isArray(state.cleanup) || !state.cleanup.every((step) => typeof step === "string") ||
      complete && !["RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"].every((step) => state.cleanup.includes(step)) ||
      state.cleanup.some((step) => step === "DELETE_PREVIEW" || /^DELETE_ENVIRONMENT_[1-7]$/u.test(step))) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
  if (!complete && (!boundedAscii(state.owned.local_temp_state, 256) ||
      state.owned.remote_ref !== `refs/heads/${authorization.execution.branch_name}` ||
      state.owned.logo !== null && (!exactKeys(state.owned.logo, ["object_id", "version"]) ||
        !boundedAscii(state.owned.logo.object_id, 256) || !boundedAscii(state.owned.logo.version, 128)) ||
      storageEffectsInvalid(state) ||
      ![state.owned.submissions, state.owned.tools, state.owned.audit_rows].every((rows) =>
        rows.every((row) => exactKeys(row, ["row_id", "version"]) && boundedAscii(row.row_id, 128) && boundedAscii(row.version, 128)) &&
        new Set(rows.map((row) => row.row_id)).size === rows.length) ||
      state.owned.submissions.length > 3 || state.owned.tools.length > 2 ||
      new Set(state.cleanup).size !== state.cleanup.length ||
      state.cleanup.some((step) => !/^(DELETE_OWNED_AUDITS|DELETE_SUBMITTED_FIXTURE_[1-3]|DELETE_OWNED_TOOL_[1-2]|DELETE_STORAGE_EXACT_VERSION|STORAGE_DELETION_CONFIRMED_ABSENT|REVOKE_STORAGE_CLEANUP_GRANT|RETIRE_PROTECTED_ACCESS|DELETE_REMOTE_REF|CLEANUP_LOCAL_OWNED_TEMP_STATE)$/u.test(step)))) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
  const storage = state.recovery_storage;
  if (storage !== undefined) {
    const used = state.recovery_usage;
    const deleted = state.cleanup.includes("DELETE_STORAGE_EXACT_VERSION");
    const absent = state.cleanup.includes("STORAGE_DELETION_CONFIRMED_ABSENT");
    const revoked = state.cleanup.includes("REVOKE_STORAGE_CLEANUP_GRANT");
    if (!exactKeys(storage, ["object_id", "version", "grant_id", "phase", "contract", "deletion"]) ||
        storage.contract !== STORAGE_CLEANUP_CONTRACT ||
        storage.object_id !== state.owned.logo?.object_id || storage.version !== state.owned.logo?.version ||
        storage.grant_id !== officialStorageGrantId(authorization, state.owned.logo) ||
        !["PREPARING", "PREPARED", "DELETE_ATTEMPTED", "DELETION_COMPLETE", "REVOKE_ATTEMPTED", "REVOKED"].includes(storage.phase) ||
        !["PENDING", "DELETED_EXACT", "ABSENT_CONFIRMED"].includes(storage.deletion) ||
        deleted !== (storage.deletion === "DELETED_EXACT") || absent !== (storage.deletion === "ABSENT_CONFIRMED") ||
        revoked !== (storage.phase === "REVOKED") ||
        storage.phase !== "PREPARING" && used.grant_prepare_rpc_calls !== 1 ||
        used.grant_prepare_rpc_calls === 0 && (used.grant_revoke_rpc_calls !== 0 || used.storage_delete_attempts !== 0) ||
        absent && used.storage_reads < 1 ||
        ["PREPARING", "PREPARED", "DELETE_ATTEMPTED"].includes(storage.phase) && storage.deletion !== "PENDING" ||
        storage.phase === "DELETION_COMPLETE" && storage.deletion === "PENDING" ||
        storage.phase === "REVOKED" && used.grant_revoke_rpc_calls !== 1 ||
        deleted && used.storage_delete_attempts < 1 ||
        (receipt.data_zero_residual || complete) && (storage.phase !== "REVOKED" || storage.deletion === "PENDING")) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    }
  } else if (state.cleanup.includes("STORAGE_DELETION_CONFIRMED_ABSENT") ||
      state.recovery_usage.grant_prepare_rpc_calls || state.recovery_usage.grant_revoke_rpc_calls || state.recovery_usage.storage_delete_attempts) {
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
  }
  return Object.freeze(structuredClone(value));
}

// A recovery read never creates state and binds the descriptor to its pathname.
export function readAdminV1OfficialRecoveryFile({ target, owner, mode = 0o600, maximum_bytes = 1024 * 1024,
  filesystem = { constants, lstatSync, realpathSync, openSync, fstatSync, readFileSync, closeSync } }) {

  const before = filesystem.lstatSync(target, { bigint: true });
  const valid = (metadata) => metadata.isFile() && !metadata.isSymbolicLink() && Number(metadata.nlink) === 1 &&
    Number(metadata.uid) === Number(owner) && (Number(metadata.mode) & 0o777) === mode &&
    Number(metadata.size) >= 1 && Number(metadata.size) <= maximum_bytes;
  const same = (left, right) => ["dev", "ino", "mode", "nlink", "uid", "gid", "size", "mtimeNs", "ctimeNs"]
    .every((key) => left[key] !== undefined && right[key] !== undefined && String(left[key]) === String(right[key]));
  if (!valid(before) || filesystem.realpathSync(target) !== target) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
  const descriptor = filesystem.openSync(target, filesystem.constants.O_RDONLY | filesystem.constants.O_NOFOLLOW);
  try {
    const opened = filesystem.fstatSync(descriptor, { bigint: true });
    if (!valid(opened) || !same(before, opened)) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
    const bytes = filesystem.readFileSync(descriptor);
    const after = filesystem.fstatSync(descriptor, { bigint: true });
    const named = filesystem.lstatSync(target, { bigint: true });
    if (!same(opened, after) || !same(opened, named) || bytes.byteLength !== Number(opened.size) ||
        filesystem.realpathSync(target) !== target) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
    return bytes;
  } finally { filesystem.closeSync(descriptor); }
}

export function createAdminV1OfficialJournal({ directory, identity, existing_only = false }) {
  if (
    !exactJournalDirectory(directory) ||
    !exactKeys(identity, ["authorization_id_sha256", "run_id"]) ||
    !isSha256(identity.authorization_id_sha256) ||
    !UUID_PATTERN.test(identity.run_id ?? "")
  ) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_INPUT");
  if (!existsSync(directory)) {
    if (existing_only) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
    mkdirSync(directory, { mode: 0o700 });
  }
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
  if (existing_only && (existsSync(retiredPath) || !existsSync(activePath))) {
    throw new AdminV1OfficialRuntimeError(existsSync(retiredPath) ? "OFFICIAL_AUTHORIZATION_SPENT" : "OFFICIAL_RECOVERY_STATE_INVALID");
  }
  let sequence = 0;
  const exactIdentity = Object.freeze(structuredClone(identity));
  const identityDocument = {
    schema_version: 1,
    identity: structuredClone(exactIdentity),
  };
  if (!existsSync(identityPath)) {
    if (existing_only) throw new AdminV1OfficialRuntimeError("OFFICIAL_JOURNAL_IDENTITY");
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
      const destructiveCleanupComplete = state?.lifecycle === "CLEANUP_COMPLETE" && state?.zero_residual === true &&
        !["COMMITTED", "COMPLETE"].includes(state?.retention?.phase);
      if (!destructiveCleanupComplete && !retentionTerminalExact(state)) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_RETIREMENT_DENIED");
      }
      if (existsSync(retiredPath)) {
        const retired = strictJournalObject(retiredPath);
        if (Object.hasOwn(state, "retention") || Object.hasOwn(retired.value.state ?? {}, "retention")) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_AUTHORIZATION_SPENT");
        }
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

export function createAdminV1OfficialBudget({ schema_version = 1, test_budget_overrides: overrides } = {}) {
  if (![1, 2].includes(schema_version)) throw new AdminV1OfficialRuntimeError("OFFICIAL_BUDGET_INPUT");
  const limits = { ...(schema_version === 2 ? ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2 : ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V1) };
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

export const ADMIN_V1_OFFICIAL_ACTION_COSTS_V1 = Object.freeze({
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

export const ADMIN_V1_OFFICIAL_ACTION_COSTS = ADMIN_V1_OFFICIAL_ACTION_COSTS_V1;
export const ADMIN_V1_OFFICIAL_ACTION_COSTS_V2 = deepFreeze({
  ...structuredClone(ADMIN_V1_OFFICIAL_ACTION_COSTS_V1),
  ...Object.fromEntries([3, 4, 5, 6, 7].flatMap((ordinal) => [
    [`create_environment_${ordinal}`, { provider_direct_mutations: 1, environment_records_created: 1 }],
    [`verify_environment_${ordinal}`, { provider_control_invocations: 1, environment_metadata_controls: 1 }],
    [`delete_environment_${ordinal}`, { provider_direct_mutations: 1, environment_records_deleted: 1 }],
  ])),
});
export const ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2 = Object.freeze({
  ...ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V1,
  action_costs: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_ACTION_COSTS_V2)),
  budgets: sha256Hex(canonicalJson(ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2)),
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
    ...(state.retention === undefined ? {} : { retention: structuredClone(state.retention) }),
    ...(state.recovery_usage === undefined ? {} : { recovery_usage: structuredClone(state.recovery_usage) }),
    ...(state.recovery_storage === undefined ? {} : { recovery_storage: structuredClone(state.recovery_storage) }),
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

function boundedEnvironmentCreateFailure(operation, error, schemaVersion = 1) {
  if (
    !(schemaVersion === 2 ? /^create_environment_[1-7]$/u : /^create_environment_[1-2]$/u).test(operation) ||
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
    (state.retention === undefined ? /^create_environment_[1-2]$/u : /^create_environment_[1-7]$/u).test(failure.operation) &&
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
  provisioning_receipt,
  test_budget_overrides,
  now_epoch_ms = Date.now(),
  live_now_epoch_ms = () => Date.now(),
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
  const isolated = validated.schema_version === 2;
  const guard = createAdminV1OfficialExpiryGuard(validated, now_epoch_ms, live_now_epoch_ms);
  if (isolated && (!["supabase_url", "supabase_anon_key", "supabase_service_role_key"].every((name) =>
      sensitive[name] instanceof Uint8Array && sensitive[name].byteLength > 0) ||
      Buffer.from(sensitive.supabase_url).toString("utf8") !== validated.execution.isolation.origin)) {
    clearSensitiveRecord(sensitive);
    throw new AdminV1OfficialRuntimeError("OFFICIAL_RUNTIME_INPUT");
  }
  const budget = createAdminV1OfficialBudget({ schema_version: validated.schema_version, test_budget_overrides });
  const actionCosts = isolated ? ADMIN_V1_OFFICIAL_ACTION_COSTS_V2 : ADMIN_V1_OFFICIAL_ACTION_COSTS_V1;
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
    ...(isolated ? { recovery_usage: blankCounts(), retention: { policy: validated.execution.provider_cleanup_policy,
      phase: "UNARMED", deployment_id: null, environment_record_ids: [],
      environment_keys: [...OFFICIAL_PREVIEW_ENVIRONMENT_KEYS], data_zero_residual: false,
      external_retained_exact: false, unrelated_preserved: false } } : {}),
  };
  journal.publish(publicState(state));

  let persistenceFailed = false;
  const storageBudget = createAdminV1OfficialBudget({ schema_version: 2 });
  const publishUsage = () => {
    try {
      const before = journal.load();
      if (before?.retired !== false || before.value.identity.authorization_id_sha256 !== validated.authorization_id_sha256 ||
          before.value.identity.run_id !== validated.run_id) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
      journal.publish(publicState(state));
      const after = journal.load();
      if (after?.retired !== false || canonicalJson(after.value) !== canonicalJson({ ...before.value,
        sequence: before.value.sequence + 1, state: publicState(state) })) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
      }
    }
    catch (error) { persistenceFailed = true; throw error; }
  };
  const invoke = async (operation, input = {}, extraCost = {}) => {
    if (persistenceFailed) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
    const fixed = actionCosts[operation];
    if (!fixed) throw new AdminV1OfficialRuntimeError("OFFICIAL_ADAPTER_OPERATION_DENIED");
    budget.take({ ...fixed, ...extraCost });
    guard();
    if (isolated && ["storage_read_owned_version", "prepare_storage_cleanup_grant", "delete_storage_exact_version", "revoke_storage_cleanup_grant"].includes(operation)) {
      storageBudget.take(fixed);
      state.recovery_usage = structuredClone(storageBudget.used);
      publishUsage(); guard();
      let active = true;
      try {
        return await adapters.invoke(operation, input, { reserve_database_request() {
          if (!active || persistenceFailed) throw new AdminV1OfficialRuntimeError("OFFICIAL_RECOVERY_STATE_INVALID");
          guard(); storageBudget.take({ database_rest_requests: 1, database_rest_successes: 1 });
          state.recovery_usage = structuredClone(storageBudget.used); publishUsage(); guard();
        } });
      } finally { active = false; }
    }
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
        guard();
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
  let retentionVerificationFailed = false;
  const expectedAuditActions = [];
  const cleanup = async () => {
    const retain = state.retention?.phase === "COMMITTED";
    state.lifecycle = retain ? "RETENTION_PENDING" : "CLEANUP_PENDING";
    state.stage = retain ? "RETENTION_FINALIZATION_PUBLISHED" : "CLEANUP_PENDING_PUBLISHED";
    journal.publish(publicState(state));
    if (state.owned.logo !== null && isolated && (!poststateOwnershipRequired || logoOwnershipConfirmed)) {
      await executeStorageCleanup(state, validated, invoke, publishUsage, () => persistenceFailed);
    } else if (state.owned.logo !== null) {
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
          else if (isolated) {
            state.cleanup.push("DELETE_STORAGE_EXACT_VERSION");
            journal.publish(publicState(state));
          }
        } finally {
          if (grantId !== null) {
            const revoked = await mutation(
              "revoke_storage_cleanup_grant",
              { grant_id: grantId },
              (response) => response?.status,
            );
            if (revoked !== "REVOKED_EXACT") recoveryPending = true;
            else {
              state.effects.grant_revoke = 1;
              if (isolated) {
                state.cleanup.push("REVOKE_STORAGE_CLEANUP_GRANT");
                journal.publish(publicState(state));
              }
            }
          }
        }
      }
      }
    }
    const safeDelete = async (operation, input = {}) => {
      try {
        const result = await mutation(operation, input, (response) => response?.status);
        if (result !== "DELETED_EXACT") recoveryPending = true;
        else {
          state.cleanup.push(operation.toUpperCase());
          journal.publish(publicState(state));
        }
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
      if (!retain) await safeDelete("delete_preview", { deployment_id: state.owned.deployment_id });
    }
    for (let index = 0; !retain && index < state.owned.environment_record_ids.length; index += 1) {
      await safeDelete(`delete_environment_${index + 1}`, {
        record_id: state.owned.environment_record_ids[index],
      });
    }
    if (state.owned.remote_ref !== null) {
      try {
        const observed = await invoke("inspect_remote_ref_before_delete", {
          ref_id: state.owned.remote_ref,
        });
        if (observed?.status !== "EXACT_OWNED" || isolated &&
            (observed.ref_id !== state.owned.remote_ref || observed.commit_sha !== validated.execution.temporary_commit_sha)) recoveryPending = true;
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
    if (retain) {
      state.retention.data_zero_residual = dataResidualProven && !storageReplacementPreserved;
      try {
        if (!retainedOwnershipExact(state)) throw new AdminV1OfficialRuntimeError("OFFICIAL_RETENTION_OWNERSHIP_UNPROVEN");
        requireRetainedPreview(await invoke("verify_preview_identity", { deployment_id: state.retention.deployment_id }),
          state.retention.deployment_id);
        for (let index = 0; index < 7; index += 1) {
          const input = { key: state.retention.environment_keys[index], record_id: state.retention.environment_record_ids[index] };
          requireEnvironmentVerification(await invoke(`verify_environment_${index + 1}`, input), input, validated);
        }
        state.retention.external_retained_exact = true;
        state.retention.unrelated_preserved = dataResidualProven;
      } catch {
        retentionVerificationFailed = true;recoveryPending = true;
      }
      state.zero_residual = false;
      if (recoveryPending) {
        state.lifecycle = "RECOVERY_PENDING";state.stage = "RETENTION_UNPROVEN";
        journal.publish(publicState(state));return;
      }
      state.retention.phase = "COMPLETE";state.lifecycle = "RETENTION_COMPLETE";state.stage = "RETENTION_COMPLETE_PUBLISHED";
      journal.publish(publicState(state));journal.retire(publicState(state));return;
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
    const environmentPlan = isolated
      ? OFFICIAL_PREVIEW_ENVIRONMENT_PLAN.map(([key, source]) => ({ key, value: source.startsWith("credential:")
        ? sensitive[source.slice("credential:".length)]
        : Buffer.from(source === "authorization:run_id" ? validated.run_id : validated.execution.isolation.project_ref, "utf8") }))
      : [{ key: "ADMIN_PASSWORD", value: sensitive.admin_password },
        { key: "ADMIN_SESSION_SECRET", value: sensitive.admin_session_secret }];
    for (let index = 1; index <= environmentPlan.length; index += 1) {
      const operation = `create_environment_${index}`;
      let recordId;
      try {
        recordId = await mutation(
          operation,
          {
            key: environmentPlan[index - 1].key,
            value: environmentPlan[index - 1].value,
          },
          (response) => {
            if (!exactAdapterResponse(response, "CREATED_EXACT") ||
              !boundedAscii(response.record_id, 128)) {
              throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CREATE_MISMATCH");
            }
            return response.record_id;
          },
          (ownedRecordId) => {
            if (isolated && state.owned.environment_record_ids.includes(ownedRecordId)) {
              throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CREATE_MISMATCH");
            }
            state.owned.environment_record_ids.push(ownedRecordId);
          },
        );
      } catch (error) {
        const failure = boundedEnvironmentCreateFailure(operation, error, validated.schema_version);
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
      requireEnvironmentVerification(verifiedEnvironment, {
        key: environmentPlan[index - 1].key, record_id: recordId,
      }, validated);
    }
    if (isolated && (state.owned.environment_record_ids.length !== 7 || new Set(state.owned.environment_record_ids).size !== 7 ||
        canonicalJson(environmentPlan.map((entry) => entry.key)) !== canonicalJson(validated.execution.environment_keys))) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_ENVIRONMENT_CREATE_MISMATCH");
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
    const previewIdentity = await invoke("verify_preview_identity", isolated ? { deployment_id: state.owned.deployment_id } : {});
    if (!exactAdapterResponse(previewIdentity, "EXACT")) {
      throw new AdminV1OfficialRuntimeError("OFFICIAL_PREVIEW_IDENTITY_MISMATCH");
    }
    if (isolated) {
      requireRetainedPreview(previewIdentity, state.owned.deployment_id);
      state.retention.deployment_id = state.owned.deployment_id;
      state.retention.environment_record_ids = [...state.owned.environment_record_ids];
      state.retention.phase = "ARMED";state.stage = "RETENTION_ARMED_PUBLISHED";
      journal.publish(publicState(state));
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
      if (isolated) {
        if (!exactKeys(handshake.observation, ["runId", "projectRef", "origin"]) ||
            !exactKeys(previewIdentity.isolation_identity, ["projectId", "teamId", "target",
              "sourceCommit", "sourceBranch", "repository", "sourceIdentityVerified"])) {
          throw new AdminV1OfficialRuntimeError("OFFICIAL_ISOLATION_OBSERVATION");
        }
        validateOfficialIsolationBinding({
          authorization: validated,
          provisioningReceipt: provisioning_receipt,
          localObservation: observeOfficialClientOrigin({
            runId: validated.run_id,
            projectRef: validated.execution.isolation.project_ref,
            actualClientOrigin: Buffer.from(sensitive.supabase_url).toString("utf8"),
          }),
          previewObservation: {
            ...handshake.observation,
            ...previewIdentity.isolation_identity,
            deploymentId: previewIdentity.deployment_id,
            protected: handshake.protected,
            authenticated: handshake.authenticated,
          },
          nowEpochMs: live_now_epoch_ms(),
        });
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
    if (isolated) {
      state.retention.phase = "COMMITTED";state.stage = "RETENTION_COMMITTED_PUBLISHED";
      journal.publish(publicState(state));
    }
  } catch (error) {
    primaryError = error;
  }

  try {
    await cleanup();
  } catch {
    recoveryPending = true;
    const committedRetention = ["COMMITTED", "COMPLETE"].includes(state.retention?.phase);
    if (committedRetention) state.retention.phase = "COMMITTED";
    state.lifecycle = committedRetention && !retentionVerificationFailed ? "RETENTION_PENDING" : "RECOVERY_PENDING";
    state.stage = committedRetention ? "RETENTION_FINALIZATION_EXCEPTION" : "CLEANUP_EXCEPTION";
    try {
      if (!persistenceFailed) journal.publish(publicState(state));
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
      classification: state.lifecycle === "RETENTION_PENDING" ? "RETENTION_PENDING" : "RECOVERY_PENDING",
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
    classification: isolated ? "RETENTION_COMPLETE" : "OFFICIAL_RUNTIME_COMPLETE",
    official_requests: 20,
    qualification_requests: 6,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    token_spent: true,
    storage_replacement_preserved: false,
    zero_residual_owned_state: !isolated,
    ...(isolated ? { retention: Object.freeze(structuredClone(state.retention)) } : {}),
    effects: Object.freeze(structuredClone(state.effects)),
    budgets: Object.freeze(structuredClone(budget.used)),
  });
}
