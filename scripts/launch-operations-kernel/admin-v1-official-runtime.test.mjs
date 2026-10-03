import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import * as isolationModule from "./admin-v1-official-isolation.mjs";
import * as runtimeModule from "./admin-v1-official-runtime.mjs";
import {
  ADMIN_V1_OFFICIAL_BUDGET_LIMITS,
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_DEFERRED_ROUTES,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_FAILURE_TRANSITIONS,
  ADMIN_V1_OFFICIAL_LEDGER,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER,
  AdminV1OfficialRuntimeError,
  createAdminV1OfficialJournal,
  classifyAdminV1OfficialRecoveryState,
  runAdminV1OfficialRuntime,
  validateAdminV1OfficialAuthorization,
} from "./admin-v1-official-runtime.mjs";

const DIGEST = "a".repeat(64);
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const PUBLISHED_HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
const TEST_CREATED_EPOCH_MS = Date.parse("2026-08-21T12:00:00.000Z");
const TEST_EXPIRES_EPOCH_MS = Date.parse("2026-08-22T12:00:00.000Z");
const TEST_NOW_EPOCH_MS = Date.parse("2026-08-21T18:00:00.000Z");
const EXPECTED_REMOTE_REF = `refs/heads/aifinder-admin-v1-official-${RUN_ID}`;
const SENTINELS = Object.freeze({
  admin_password: Buffer.from("SENTINEL_ADMIN_PASSWORD_7e9d", "utf8"),
  admin_session_secret: Buffer.from("SENTINEL_SESSION_SECRET_a213", "utf8"),
  csrf_cookie: Buffer.from("SENTINEL_CSRF_COOKIE_c411", "utf8"),
  csrf_token: Buffer.from("SENTINEL_CSRF_TOKEN_049d", "utf8"),
  session_cookie: Buffer.from("SENTINEL_SESSION_COOKIE_36bf", "utf8"),
});

const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(
      `${name}:${error?.code ?? error?.message ?? "UNKNOWN"}:${error?.stack ?? "NO_STACK"}`,
    );
  }
}

function authorization(overrides = {}) {
  const record = {
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
    compatibility_support_sha256: {
      "testing/admin-v1-staging-runtime-orchestrator.mjs": "8".repeat(64),
      "testing/admin-v1-staging-runtime-source-policy.test.mjs": "9".repeat(64),
      "testing/run-static-readiness.mjs": "a".repeat(64),
      "testing/static-test-safety-manifest.json": "b".repeat(64),
    },
    route_source_sha256: Object.fromEntries([
      "app/api/admin/csrf/route.ts",
      "app/api/admin/login/route.ts",
      "app/api/admin/logout/route.ts",
      "app/api/admin/session/route.ts",
      "app/api/admin/submissions/route.ts",
      "app/api/admin/tools/route.ts",
      "app/api/admin/upload-logo/route.ts",
      "lib/admin-v1-launch-scope.ts",
      "proxy.ts",
    ].map((entry) => [entry, DIGEST])),
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
      status_sha256: "c".repeat(64),
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
      temporary_commit_sha: "d".repeat(40),
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    },
  };
  return Object.assign(record, structuredClone(overrides));
}

const expectedIsolationContractV1 = {
  schema_version: 1, operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
  mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1",
  provider_cleanup_policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1",
  origin_relation: "HTTPS_PROJECT_REF_DOT_SUPABASE_DOT_CO_V1", allow_custom_origin: false,
  excluded_project_ref: "mtpisopvdxuvmpzbzqjw",
  excluded_origin: "https://mtpisopvdxuvmpzbzqjw.supabase.co",
  environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "AIFINDER_VALIDATION_RUN_ID",
    "AIFINDER_VALIDATION_PROJECT_REF"],
  credential_bundle_schema_version: 1, credential_bundle_provenance_source: "OWNER_BOUND_ISOLATED_BUNDLE_V1",
  credential_value_names: ["admin_password", "admin_session_secret", "github_token", "supabase_anon_key",
    "supabase_service_role_key", "supabase_url", "vercel_token"], credential_value_max_bytes: 16384,
  provisioning_receipt_schema_version: 1, provenance_receipt_schema_version: 1,
  expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
  expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
};
const expectedIsolationContract = {
  ...expectedIsolationContractV1, schema_version: 2,
  preview_environment_plan: [
    ["ADMIN_PASSWORD", "credential:admin_password"], ["ADMIN_SESSION_SECRET", "credential:admin_session_secret"],
    ["NEXT_PUBLIC_SUPABASE_URL", "credential:supabase_url"], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "credential:supabase_anon_key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "credential:supabase_service_role_key"], ["AIFINDER_VALIDATION_RUN_ID", "authorization:run_id"],
    ["AIFINDER_VALIDATION_PROJECT_REF", "authorization:isolation.project_ref"],
  ],
  retention_trigger: "SUCCESS_AFTER_OFFICIAL_LEDGER_AND_POSTSTATE_V1",
  pre_commit_failure_policy: "DELETE_EXACT_RUN_OWNED_EXTERNAL_RESOURCES_V1",
  post_commit_policy: "RETAIN_EXACT_RUN_OWNED_PREVIEW_AND_SEVEN_ENVIRONMENTS_V1",
  retention_complete_lifecycle: "RETENTION_COMPLETE", retention_pending_lifecycle: "RETENTION_PENDING",
  retained_preview_count: 1, retained_environment_count: 7,
  final_retention_verification: "REVERIFY_EXACT_IDS_AFTER_DATA_AND_EPHEMERAL_CLEANUP_V1",
  automatic_post_success_delete: false, later_destructive_cleanup_requires_owner_authority: true,
};
function expectedV2OneUse(record) {
  const { one_use_authorization_sha256: ignored, ...unsigned } = record;
  return sha256Hex(canonicalJson({ domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...unsigned }));
}
function authorizationV2() {
  const record = authorization();
  record.schema_version = 2;
  record.contract_sha256 = { ...structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    budgets: "55c557dec8fd8f7a54426bc2f8ac5647a2f3d7389c2239baef5b4efc076075d6",
    action_costs: "471fd0bf4977c76e784220275246f2f73632745494723bd158f7c246760a3e36" };
  record.isolation_contract_sha256 = sha256Hex(canonicalJson(expectedIsolationContract));
  record.execution.environment_keys = [...expectedIsolationContract.environment_keys];
  record.execution.provider_cleanup_policy = expectedIsolationContract.provider_cleanup_policy;
  record.execution.isolation = { mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1",
    project_ref: "runtime-synthetic-project", origin: "https://runtime-synthetic-project.supabase.co",
    provisioning_receipt_sha256: DIGEST, schema_contract_sha256: DIGEST,
    credential_bundle_path: `${record.execution.journal_directory}/isolated-credentials.json`,
    credential_bundle_provenance_sha256: DIGEST, validation_run_id: RUN_ID,
    expected_preview_project_id: record.execution.preview_project_id,
    expected_preview_team_id: record.execution.preview_team_id };
  record.one_use_authorization_sha256 = expectedV2OneUse(record);
  return record;
}

// Evaluate the closed structural JSON Schema vocabulary against actual records.
// Cross-field equality, canonical time and semantic digests are runtime checks.
function schemaAccepts(document, value, schema = document) {
  if (schema.$ref) return schemaAccepts(document, value,
    schema.$ref.slice(2).split("/").reduce((current, key) => current[key], document));
  if (schema.oneOf && schema.oneOf.filter((branch) => schemaAccepts(document, value, branch)).length !== 1) return false;
  if (Object.hasOwn(schema, "const") && canonicalJson(value) !== canonicalJson(schema.const)) return false;
  if (schema.type === "object") {
    if (!value || Object.getPrototypeOf(value) !== Object.prototype) return false;
    if ((schema.required ?? []).some((name) => !Object.hasOwn(value, name))) return false;
    if (schema.additionalProperties === false && Object.keys(value).some((name) => !Object.hasOwn(schema.properties, name))) return false;
    if (Object.entries(schema.properties ?? {}).some(([name, member]) => Object.hasOwn(value, name) && !schemaAccepts(document, value[name], member))) return false;
  }
  if (schema.type === "string" && (typeof value !== "string" ||
    schema.pattern && !new RegExp(schema.pattern, "u").test(value) ||
    schema.minLength && value.length < schema.minLength ||
    schema.maxLength && value.length > schema.maxLength)) return false;
  if (schema.not && schemaAccepts(document, value, schema.not)) return false;
  return true;
}

function exactEffectForOrdinal(ordinal) {
  const audit = new Map([[8, "tool_added"], [10, "tool_updated"],
    [11, "tool_deleted"], [12, "submission_updated"],
    [13, "submission_rejected"], [14, "submission_approved"],
    [15, "logo_uploaded"], [19, "admin_logout"]]);
  const base = audit.has(ordinal)
    ? {
        audit_action: audit.get(ordinal),
        audit_id: `audit-${ordinal}`,
        audit_version: "v1",
      }
    : null;
  if (ordinal === 8) {
    return { ...base, tool_id: "tool-route", tool_version: "v1" };
  }
  if (ordinal === 10) {
    return { ...base, tool_id: "tool-route", tool_version: "v2" };
  }
  if (ordinal === 11) {
    return { ...base, tool_id: "tool-route", tool_version: "v3" };
  }
  if ([12, 13].includes(ordinal)) {
    return {
      ...base,
      submission_id: `submission-${ordinal - 11}`,
      submission_version: "v2",
    };
  }
  if (ordinal === 14) {
    return {
      ...base,
      approval_rpc: 1,
      submission_id: "submission-3",
      submission_version: "v2",
      tool_id: "tool-approved",
      tool_version: "v1",
    };
  }
  if (ordinal === 15) {
    return {
      ...base,
      logo_object_id: "logo-owned-v1",
      storage_version: "v1",
    };
  }
  return base;
}

function fakeAdapters({
  automatic_preview_after = 1,
  automatic_preview_failure = false,
  external_residual_present = false,
  fail_operation = null,
  prior_residue = false,
  remote_ref_id = EXPECTED_REMOTE_REF,
  storage_version_mismatch = false,
  unrelated_preserved = true,
} = {}) {
  const invocations = [];
  let applicationOrdinal = 0;
  let automaticPreviewObservations = 0;
  let fixtureOrdinal = 0;
  const adapter = {
    invocations,
    async invoke(operation, input = {}) {
      invocations.push(operation);
      if (operation === fail_operation) {
        throw new AdminV1OfficialRuntimeError("OFFICIAL_SYNTHETIC_FAILURE");
      }
      if (operation === "inspect_prior_residue") {
        return { status: prior_residue ? "RECOVERY_PENDING" : "ABSENT" };
      }
      if (operation === "inspect_owned_database_residue") return { status: "ABSENT" };
      if (operation === "prepare_local_temporary_commit") {
        return {
          status: "VERIFIED_EXACT",
          commit_sha: "d".repeat(40),
          local_state_id: "local-temp-owned",
        };
      }
      if (operation === "inspect_github_metadata") {
        return {
          status: "EXACT",
          repository: "jcdumaua/aifinder",
          baseline: PUBLISHED_HEAD,
        };
      }
      if (operation === "inspect_environment_contract") {
        return { status: "EXACT", names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
      }
      if (operation === "inspect_remote_ref") return { status: "ABSENT" };
      if (operation === "inspect_remote_ref_before_delete") {
        return { status: "EXACT_OWNED" };
      }
      if (operation === "create_remote_ref") {
        return { status: "CREATED_EXACT", ref_id: remote_ref_id };
      }
      if (operation.startsWith("create_environment_")) {
        return { status: "CREATED_EXACT", record_id: `env-${operation.at(-1)}` };
      }
      if (operation.startsWith("verify_environment_")) {
        return { status: "EXACT", record_id: input.record_id };
      }
      if (operation === "acquire_automatic_preview") {
        if (automatic_preview_failure) {
          throw new AdminV1OfficialRuntimeError(
            "OFFICIAL_AUTOMATIC_PREVIEW_IDENTITY_UNPROVEN",
          );
        }
        automaticPreviewObservations += 1;
        return automaticPreviewObservations < automatic_preview_after
          ? { status: "PENDING" }
          : { status: "ACQUIRED_EXACT", deployment_id: "dpl-owned" };
      }
      if (operation === "verify_preview_identity") return { status: "EXACT" };
      if (operation === "generate_oidc") return { token: Buffer.from("SENTINEL_OIDC_7be2") };
      if (operation === "protected_access_handshake") return { status: "BOUND" };
      if (operation === "create_submitted_fixture") {
        fixtureOrdinal += 1;
        return {
          status: "CREATED_EXACT",
          row_id: `submission-${fixtureOrdinal}`,
          version: "v1",
        };
      }
      if (operation === "application_request") {
        applicationOrdinal += 1;
        const ledger = applicationOrdinal <= 6
          ? ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER
          : ADMIN_V1_OFFICIAL_LEDGER;
        const sequence = applicationOrdinal <= 6
          ? applicationOrdinal
          : applicationOrdinal - 6;
        const spec = ledger[sequence - 1];
        if ([1, 20].includes(spec.ordinal) && input.session !== null) {
          throw new AdminV1OfficialRuntimeError("TEST_AUTH_JAR_NOT_EMPTY");
        }
        if (spec.ordinal === 2 && !(input.admin_password instanceof Uint8Array)) {
          throw new AdminV1OfficialRuntimeError("TEST_LOGIN_PASSWORD_MISSING");
        }
        if ([3, 4, 5].includes(spec.ordinal) && !(input.session instanceof Uint8Array)) {
          throw new AdminV1OfficialRuntimeError("TEST_SESSION_MISSING");
        }
        if (spec.ordinal === 5 &&
          (input.csrf_token !== null || input.csrf_cookie !== null)) {
          throw new AdminV1OfficialRuntimeError("TEST_NO_CSRF_PROBE_DIRTY");
        }
        if (
          input.lane === "OFFICIAL" &&
          [8, 10, 11, 12, 13, 14, 15, 19].includes(spec.ordinal) &&
          (!(input.session instanceof Uint8Array) ||
            !(input.csrf_token instanceof Uint8Array) ||
            !(input.csrf_cookie instanceof Uint8Array))
        ) throw new AdminV1OfficialRuntimeError("TEST_MUTATION_AUTH_MISSING");
        return {
          status: spec.status,
          header_projection: "EXACT_SECURITY_HEADERS",
          body_shape: "EXACT_BOUNDED_JSON",
          cookie_effect: [2, 4, 19].includes(spec.ordinal)
            ? `ORDINAL_${spec.ordinal}_COOKIE_EFFECT`
            : "NONE",
          ...(spec.ordinal === 2
            ? { session_cookie: Buffer.from(SENTINELS.session_cookie) }
            : {}),
          ...(spec.ordinal === 4
            ? {
                csrf_cookie: Buffer.from(SENTINELS.csrf_cookie),
                csrf_token: Buffer.from(SENTINELS.csrf_token),
              }
            : {}),
          effect: applicationOrdinal <= 6 ? null : exactEffectForOrdinal(spec.ordinal),
          ...(spec.ordinal === 16
            ? { allow_methods: ["GET", "POST", "PUT", "DELETE"] }
            : {}),
          ...([17, 18].includes(spec.ordinal)
            ? {
                proxy_scope: "DENY_ADMIN_API_PATH",
                deferred_handler_executions: 0,
                deferred_database_effects: 0,
                deferred_rpc_effects: 0,
                deferred_storage_effects: 0,
              }
            : {}),
        };
      }
      if (operation === "inspect_submissions_poststate") {
        return {
          status: "EXACT", submitted_tools: 3,
          ownership_readback: "EXACT", unrelated_preserved: true,
        };
      }
      if (operation === "inspect_tools_poststate") {
        return {
          status: "EXACT", tools: 2,
          ownership_readback: "EXACT", unrelated_preserved: true,
        };
      }
      if (operation === "inspect_audits_poststate") {
        return {
          status: "EXACT", audits: 8,
          ownership_readback: "EXACT", unrelated_preserved: true,
        };
      }
      if (operation === "storage_read_owned_version") {
        return { status: "EXACT", version: storage_version_mismatch ? "v2" : "v1" };
      }
      if (operation === "prepare_storage_cleanup_grant") return { status: "PREPARED", grant_id: "grant-owned" };
      if (operation === "delete_storage_exact_version") return { status: "DELETED_EXACT" };
      if (operation === "revoke_storage_cleanup_grant") return { status: "REVOKED_EXACT" };
      if (
        operation.startsWith("delete_") ||
        ["retire_protected_access", "cleanup_local_owned_temp_state"].includes(operation)
      ) {
        return { status: "DELETED_EXACT" };
      }
      if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
        if (operation === "verify_zero_external_residual" && external_residual_present) {
          return { status: "PRESENT", ownership_readback: "EXACT", unrelated_preserved: true };
        }
        return {
          status: "PROVEN_ABSENT",
          ownership_readback: "EXACT",
          unrelated_preserved,
        };
      }
      throw new AdminV1OfficialRuntimeError("OFFICIAL_ADAPTER_OPERATION_DENIED");
    },
  };
  return adapter;
}

await check("binding constants", async () => {
  assert.equal(ADMIN_V1_OFFICIAL_OPERATION_CLASS, "ADMIN_V1_OFFICIAL_RUNTIME_V1");
  assert.equal(ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER.length, 6);
  assert.deepEqual(ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER.map((entry) => entry.ordinal), [1, 2, 3, 4, 19, 20]);
  assert.equal(ADMIN_V1_OFFICIAL_LEDGER.length, 20);
  assert.equal(ADMIN_V1_OFFICIAL_DEFERRED_ROUTES.length, 21);
  assert.equal(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES.length, 9);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.application_requests, 26);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.browser_requests, 0);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.local_temporary_commits, 1);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.local_temporary_cleanups, 1);
  assert.deepEqual(ADMIN_V1_OFFICIAL_FAILURE_TRANSITIONS, {
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
});

await check("crash recovery state classification", async () => {
  const emptyOwned = {
    local_temp_state: null,
    remote_ref: null,
    environment_record_ids: [],
    deployment_id: null,
    submissions: [],
    tools: [],
    audit_rows: [],
    logo: null,
  };
  assert.deepEqual([
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "PRE_EFFECT", token_spent: false, owned: emptyOwned,
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "PRE_EFFECT", token_spent: false,
      owned: { ...emptyOwned, remote_ref: "ref-owned" },
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "QUALIFICATION", token_spent: false, owned: emptyOwned,
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "OFFICIAL_RUNTIME", token_spent: true, owned: emptyOwned,
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "CLEANUP_PENDING", token_spent: true, owned: emptyOwned,
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "RECOVERY_PENDING", token_spent: true, owned: emptyOwned,
    }),
    classifyAdminV1OfficialRecoveryState({
      lifecycle: "CLEANUP_COMPLETE", token_spent: true,
      owned: emptyOwned, zero_residual: true,
    }),
  ], [
    "PRE_EFFECT",
    "PARTIAL_SETUP",
    "PRE_OFFICIAL_QUALIFICATION",
    "TOKEN_SPENT_OFFICIAL_RUNTIME",
    "CLEANUP_PENDING",
    "CLEANUP_PARTIAL",
    "CLEANUP_COMPLETE",
  ]);
});

await check("published-head-bound one-use authorization", async () => {
  const valid = validateAdminV1OfficialAuthorization(authorization(), {
    now_epoch_ms: TEST_NOW_EPOCH_MS,
  });
  assert.equal(valid.repository.head, PUBLISHED_HEAD);
  assert.throws(
    () => validateAdminV1OfficialAuthorization(authorization({
      repository: { ...authorization().repository, head: "e".repeat(40) },
    }), { now_epoch_ms: TEST_NOW_EPOCH_MS }),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_INVALID",
  );
});

await check("authorization enforces exact inclusive-created exclusive-expiry window", async () => {
  assert.throws(
    () => validateAdminV1OfficialAuthorization(authorization(), {
      now_epoch_ms: TEST_CREATED_EPOCH_MS - 1,
    }),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_INVALID",
  );
  assert.equal(
    validateAdminV1OfficialAuthorization(authorization(), {
      now_epoch_ms: TEST_CREATED_EPOCH_MS,
    }).run_id,
    RUN_ID,
  );
  assert.equal(
    validateAdminV1OfficialAuthorization(authorization(), {
      now_epoch_ms: TEST_EXPIRES_EPOCH_MS - 1,
    }).run_id,
    RUN_ID,
  );
  assert.throws(
    () => validateAdminV1OfficialAuthorization(authorization(), {
      now_epoch_ms: TEST_EXPIRES_EPOCH_MS,
    }),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_INVALID",
  );
});

await check("v2 complete authorization and semantic digest admission", async () => {
  const valid = authorizationV2();
  assert.equal(validateAdminV1OfficialAuthorization(valid, { now_epoch_ms: TEST_NOW_EPOCH_MS }).schema_version, 2);
  assert.deepEqual(isolationModule.ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V1, expectedIsolationContractV1);
  assert.deepEqual(isolationModule.ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V2, expectedIsolationContract);
  assert.equal(isolationModule.ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256, valid.isolation_contract_sha256);
  assert.equal(runtimeModule.adminV1OfficialOneUseAuthorizationDigest(valid), valid.one_use_authorization_sha256);
});

await check("v1 and v2 closed shapes reject missing extra and hybrid fields", async () => {
  const reject = (record) => assert.throws(() => validateAdminV1OfficialAuthorization(record,
    { now_epoch_ms: TEST_NOW_EPOCH_MS }), { code: "OFFICIAL_AUTHORIZATION_INVALID" });
  for (const version of [1, 2]) {
    const valid = version === 1 ? authorization() : authorizationV2();
    for (const [name, keys] of [["outer", Object.keys(valid)], ["repository", Object.keys(valid.repository)],
      ["execution", Object.keys(valid.execution)], ...(version === 2 ? [["isolation", Object.keys(valid.execution.isolation)]] : [])]) {
      for (const key of keys) {
        const invalid = structuredClone(valid);
        const target = name === "outer" ? invalid : name === "isolation" ? invalid.execution.isolation : invalid[name];
        delete target[key]; reject(invalid);
      }
      const invalid = structuredClone(valid);
      const target = name === "outer" ? invalid : name === "isolation" ? invalid.execution.isolation : invalid[name];
      target.extra = true; reject(invalid);
    }
  }
  const v1Hybrid = authorization(); v1Hybrid.execution = authorizationV2().execution; reject(v1Hybrid);
  const v2Hybrid = authorizationV2(); v2Hybrid.execution = authorization().execution;
  v2Hybrid.one_use_authorization_sha256 = expectedV2OneUse(v2Hybrid); reject(v2Hybrid);
  const v1Extra = authorization(); v1Extra.isolation_contract_sha256 = DIGEST; reject(v1Extra);
});

await check("v2 identity maps one use lifetime and bound isolation fail closed", async () => {
  for (const mutate of [
    ...["authorization_id_sha256", "review_approval_sha256", "candidate_identity_sha256", "manifest_sha256",
      "supervisor_sha256", "supervisor_policy_sha256", "authorization_schema_sha256", "isolation_contract_sha256",
      "one_use_authorization_sha256"].map((name) => (record) => { record[name] = "f".repeat(64); }),
    (record) => { record.compatibility_support_sha256[Object.keys(record.compatibility_support_sha256)[0]] = "f".repeat(64); },
    (record) => { record.route_source_sha256[Object.keys(record.route_source_sha256)[0]] = "f".repeat(64); },
    (record) => { record.contract_sha256.budgets = "f".repeat(64); },
    (record) => { record.repository.origin_main = "f".repeat(40); },
    (record) => { record.repository.root = "/private/tmp"; },
    (record) => { record.execution.isolation.origin = "https://other-project.supabase.co"; },
    (record) => { record.execution.isolation.validation_run_id = "22222222-2222-4222-8222-222222222222"; },
    (record) => { record.execution.provider_cleanup_policy = "DELETE"; },
    (record) => { record.execution.environment_keys.reverse(); },
    (record) => { record.created_at = "2026-08-21T12:00:00Z"; },
    (record) => { record.expires_at = "2026-08-23T12:00:00.000Z"; },
  ]) {
    const invalid = authorizationV2(); mutate(invalid);
    assert.throws(() => validateAdminV1OfficialAuthorization(invalid, { now_epoch_ms: TEST_NOW_EPOCH_MS }),
      { code: "OFFICIAL_AUTHORIZATION_INVALID" });
  }
  for (const now of [TEST_CREATED_EPOCH_MS - 1, TEST_EXPIRES_EPOCH_MS]) assert.throws(() =>
    validateAdminV1OfficialAuthorization(authorizationV2(), { now_epoch_ms: now }), { code: "OFFICIAL_AUTHORIZATION_INVALID" });
});

await check("dual version authorization schema admits each closed record", async () => {
  const schema = JSON.parse(readFileSync(
    path.join(
      import.meta.dirname,
      "admin-v1-official-runtime-authorization.schema.json",
    ),
    "utf8",
  ));
  for (const valid of [authorization(), authorizationV2()]) {
    assert.equal(schemaAccepts(schema, valid), true);
    for (const location of ["outer", "repository", "execution", ...(valid.schema_version === 2 ? ["isolation"] : [])]) {
      const invalid = structuredClone(valid);
      const target = location === "outer" ? invalid : location === "isolation" ? invalid.execution.isolation : invalid[location];
      target.extra = true; assert.equal(schemaAccepts(schema, invalid), false);
      delete target.extra;
      for (const key of Object.keys(target)) { const removed = target[key]; delete target[key];
        assert.equal(schemaAccepts(schema, invalid), false); target[key] = removed; }
    }
  }
  const hybrid = authorization(); hybrid.execution = authorizationV2().execution;
  assert.equal(schemaAccepts(schema, hybrid), false);
  hybrid.schema_version = 2; hybrid.execution = authorization().execution;
  assert.equal(schemaAccepts(schema, hybrid), false);
});

await check("complete Official runtime and sanitized durable lifecycle", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-journal.");
  const journal = createAdminV1OfficialJournal({
    directory: root,
    identity: {
      authorization_id_sha256: "1".repeat(64),
      run_id: RUN_ID,
    },
  });
  const adapters = fakeAdapters();
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters,
    journal,
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
  });
  assert.equal(result.classification, "OFFICIAL_RUNTIME_COMPLETE");
  assert.equal(result.official_requests, 20);
  assert.equal(result.qualification_requests, 6);
  assert.equal(result.runtime_sessions, 1);
  assert.equal(result.runtime_retries, 0);
  assert.equal(result.runtime_replays, 0);
  assert.equal(result.zero_residual_owned_state, true);
  assert.equal(result.effects.submitted_tools, 3);
  assert.equal(result.effects.tools, 2);
  assert.equal(result.effects.audits, 8);
  assert.equal(result.effects.approval_rpc, 1);
  assert.equal(result.effects.logo_objects, 1);
  assert.equal(result.effects.grant_prepare, 1);
  assert.equal(result.effects.grant_revoke, 1);
  assert.equal(result.budgets.application_requests, 26);
  assert.equal(result.budgets.qualification_application_requests, 6);
  assert.equal(result.budgets.official_application_requests, 20);
  assert.equal(result.budgets.database_rest_successes, 14);
  assert.equal(result.budgets.runtime_sessions, 1);
  assert.equal(result.budgets.runtime_retries, 0);
  assert.equal(result.budgets.runtime_replays, 0);
  const retiredPath = path.join(root, "admin-v1-official-runtime-retired.json");
  const bytes = readFileSync(retiredPath);
  assert.equal(statSync(root).mode & 0o777, 0o700);
  assert.equal(statSync(retiredPath).mode & 0o777, 0o600);
  const text = bytes.toString("utf8");
  for (const value of Object.values(SENTINELS)) {
    assert.equal(text.includes(value.toString("utf8")), false);
    assert.equal(
      text.includes(createHash("sha256").update(value).digest("hex")),
      false,
    );
  }
  assert.equal(text.includes("raw_headers"), false);
  assert.equal(text.includes("raw_body"), false);
  assert.equal(text.includes("secret_sha256"), false);
  assert.equal(adapters.invocations.filter((entry) => entry === "application_request").length, 26);
  assert.equal(adapters.invocations.some((entry) => entry.includes("deferred")), false);
  const cleanupOrder = [
    "storage_read_owned_version",
    "prepare_storage_cleanup_grant",
    "delete_storage_exact_version",
    "revoke_storage_cleanup_grant",
    "delete_owned_audits",
    "delete_submitted_fixture_1",
    "delete_submitted_fixture_2",
    "delete_submitted_fixture_3",
    "delete_owned_tool_1",
    "delete_owned_tool_2",
    "verify_zero_data_residual",
    "retire_protected_access",
    "delete_preview",
    "delete_environment_1",
    "delete_environment_2",
    "inspect_remote_ref_before_delete",
    "delete_remote_ref",
    "cleanup_local_owned_temp_state",
    "verify_zero_external_residual",
  ];
  assert(cleanupOrder.every((operation) => adapters.invocations.includes(operation)));
  assert(cleanupOrder.every((operation, index) =>
    index === 0 ||
    adapters.invocations.indexOf(cleanupOrder[index - 1]) <
      adapters.invocations.indexOf(operation)
  ));
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters: fakeAdapters(),
      journal,
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_SPENT",
  );
});

await check("spent-token failure is not replayed", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-failure.");
  const journal = createAdminV1OfficialJournal({
    directory: root,
    identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
  });
  const adapters = fakeAdapters();
  let applicationCalls = 0;
  const invoke = adapters.invoke.bind(adapters);
  adapters.invoke = async (operation, input) => {
    if (operation === "application_request") {
      applicationCalls += 1;
      if (applicationCalls === 14) {
        adapters.invocations.push(operation);
        throw new AdminV1OfficialRuntimeError("OFFICIAL_SYNTHETIC_FAILURE");
      }
    }
    return invoke(operation, input);
  };
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal,
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_SYNTHETIC_FAILURE",
  );
  assert.equal(applicationCalls, 14);
  assert.equal(
    adapters.invocations.filter((entry) => entry === "application_request").length,
    14,
  );
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters: fakeAdapters(),
      journal,
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_AUTHORIZATION_SPENT",
  );
});

await check("qualification failure prevents Official token spend", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-qualification-failure.");
  const adapters = fakeAdapters();
  let applicationCalls = 0;
  const invoke = adapters.invoke.bind(adapters);
  adapters.invoke = async (operation, input) => {
    if (operation === "application_request") {
      applicationCalls += 1;
      if (applicationCalls === 3) {
        adapters.invocations.push(operation);
        throw new AdminV1OfficialRuntimeError("OFFICIAL_SYNTHETIC_FAILURE");
      }
    }
    return invoke(operation, input);
  };
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal: createAdminV1OfficialJournal({
        directory: root,
        identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
      }),
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_SYNTHETIC_FAILURE",
  );
  assert.equal(applicationCalls, 3);
  const retired = JSON.parse(readFileSync(path.join(
    root,
    "admin-v1-official-runtime-retired.json",
  ), "utf8"));
  assert.equal(retired.state.token_spent, false);
  assert.equal(retired.state.runtime_sessions, 0);
  assert.equal(retired.state.last_attempted_official_ordinal, 0);
});

await check("cleanup ambiguity remains durable recovery pending", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-cleanup-pending.");
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters: fakeAdapters({ fail_operation: "delete_owned_tool_1" }),
    journal: createAdminV1OfficialJournal({
      directory: root,
      identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
    }),
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(
    JSON.parse(readFileSync(path.join(
      root,
      "admin-v1-official-runtime-journal.json",
    ), "utf8")).state.lifecycle,
    "RECOVERY_PENDING",
  );
});

await check("classified environment-create failure is published before cleanup", async () => {
  const snapshots = [];
  let retired = null;
  const adapters = fakeAdapters();
  const invoke = adapters.invoke.bind(adapters);
  adapters.invoke = async (operation, input) => {
    if (operation === "create_environment_1") {
      adapters.invocations.push(operation);
      const error = new Error("RAW_ERROR_SENTINEL_DO_NOT_PERSIST");
      error.code = "RAW_PROVIDER_ERROR_SENTINEL_DO_NOT_PERSIST";
      error.environment_create_failure_class =
        "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE";
      error.http_status_class = "4XX";
      throw error;
    }
    return invoke(operation, input);
  };
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal: {
        load: () => null,
        publish(value) {
          snapshots.push(structuredClone(value));
        },
        retire(value) {
          retired = structuredClone(value);
        },
      },
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "RAW_PROVIDER_ERROR_SENTINEL_DO_NOT_PERSIST",
  );
  const classifiedIndex = snapshots.findIndex(
    (value) => value.stage === "FAILURE_CREATE_ENVIRONMENT_1_CLASSIFIED",
  );
  const cleanupIndex = snapshots.findIndex(
    (value) => value.stage === "CLEANUP_PENDING_PUBLISHED",
  );
  assert(classifiedIndex >= 0);
  assert(cleanupIndex > classifiedIndex);
  assert.deepEqual(retired.failure, {
    operation: "create_environment_1",
    stage: "SETUP",
    class: "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
    http_status_class: "4XX",
    provider: "VERCEL",
    retry_allowed: false,
  });
  assert.equal(retired.owned.environment_record_ids.length, 0);
  assert.equal(retired.zero_residual, true);
  const serialized = JSON.stringify({ snapshots, retired });
  for (const sentinel of [
    "RAW_ERROR_SENTINEL_DO_NOT_PERSIST",
    "RAW_PROVIDER_ERROR_SENTINEL_DO_NOT_PERSIST",
    ...Object.values(SENTINELS).map((value) => value.toString("utf8")),
  ]) assert.equal(serialized.includes(sentinel), false);
});

await check("legacy retired sequence maps to unavailable lower-level environment class", async () => {
  assert.equal(
    typeof runtimeModule.classifyAdminV1OfficialEnvironmentCreateFailureEvidence,
    "function",
  );
  const result = runtimeModule.classifyAdminV1OfficialEnvironmentCreateFailureEvidence({
    sequence: 9,
    state: {
      lifecycle: "CLEANUP_COMPLETE",
      stage: "CLEANUP_COMPLETE_PUBLISHED",
      retired: true,
      token_spent: false,
      runtime_sessions: 0,
      last_attempted_qualification_ordinal: 0,
      last_completed_qualification_ordinal: 0,
      last_attempted_official_ordinal: 0,
      last_completed_official_ordinal: 0,
      owned: {
        local_temp_state: "git:synthetic",
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
      cleanup: ["CLEANUP_LOCAL_OWNED_TEMP_STATE"],
      zero_residual: true,
    },
  });
  assert.deepEqual(result, {
    failure_class: "BRANCH_ENV_PARTIAL_FAILURE",
    operation: "create_environment_1",
    lower_level_class: "LEGACY_UNAVAILABLE",
  });
});

await check("environment IDs are owned before direct readback and branch publication", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-env-ownership.");
  const snapshots = [];
  let retired = null;
  const journal = {
    load: () => null,
    publish(value) {
      snapshots.push(structuredClone(value));
    },
    retire(value) {
      retired = structuredClone(value);
    },
  };
  const adapters = fakeAdapters({ fail_operation: "verify_environment_1" });
  const invoke = adapters.invoke.bind(adapters);
  adapters.invoke = async (operation, input) => {
    if (operation === "verify_environment_1") {
      assert.equal(
        snapshots.at(-1).owned.environment_record_ids.includes("env-1"),
        true,
      );
    }
    return invoke(operation, input);
  };
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal,
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_SYNTHETIC_FAILURE",
  );
  assert.equal(adapters.invocations.filter((entry) => entry === "delete_environment_1").length, 1);
  assert.equal(adapters.invocations.includes("create_remote_ref"), false);
  assert.equal(retired.owned.environment_record_ids.includes("env-1"), true);
});

await check("remote ref creation requires the exact authorized branch", async () => {
  const adapters = fakeAdapters({ remote_ref_id: "refs/heads/unowned" });
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal: {
        load: () => null,
        publish() {},
        retire() {},
      },
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
    }),
    (error) => error?.code === "OFFICIAL_REMOTE_REF_MISMATCH",
  );
  assert.equal(adapters.invocations.includes("acquire_automatic_preview"), false);
  assert.equal(adapters.invocations.includes("delete_remote_ref"), false);
});

for (const scenario of [
  {
    name: "environment ownership survives its COMPLETE journal failure",
    failedStage: "COMPLETE_CREATE_ENVIRONMENT_1",
    expectedEnvironmentDeletes: 1,
    expectedRemoteDelete: false,
  },
  {
    name: "remote-ref ownership survives its COMPLETE journal failure",
    failedStage: "COMPLETE_CREATE_REMOTE_REF",
    expectedEnvironmentDeletes: 2,
    expectedRemoteDelete: true,
  },
]) {
  await check(scenario.name, async () => {
    const adapters = fakeAdapters();
    let failedOnce = false;
    let retired = null;
    const journal = {
      load: () => null,
      publish(value) {
        if (!failedOnce && value.stage === scenario.failedStage) {
          failedOnce = true;
          throw new Error("SYNTHETIC_COMPLETE_PUBLICATION_FAILURE");
        }
      },
      retire(value) {
        retired = structuredClone(value);
      },
    };
    await assert.rejects(
      runAdminV1OfficialRuntime({
        authorization: authorization(),
        now_epoch_ms: TEST_NOW_EPOCH_MS,
        adapters,
        journal,
        sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
          ([key, value]) => [key, Buffer.from(value)],
        )),
      }),
      (error) => error?.message === "SYNTHETIC_COMPLETE_PUBLICATION_FAILURE",
    );
    assert.equal(failedOnce, true);
    assert.equal(retired.lifecycle, "CLEANUP_COMPLETE");
    assert.equal(retired.zero_residual, true);
    assert.equal(
      adapters.invocations.filter((entry) => entry.startsWith("delete_environment_")).length,
      scenario.expectedEnvironmentDeletes,
    );
    assert.equal(adapters.invocations.includes("delete_remote_ref"), scenario.expectedRemoteDelete);
  });
}

await check("delayed automatic Preview is acquired without explicit creation", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-auto-preview.");
  const adapters = fakeAdapters({ automatic_preview_after: 3 });
  let previewClock = TEST_NOW_EPOCH_MS;
  const previewWaits = [];
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters,
    journal: createAdminV1OfficialJournal({
      directory: root,
      identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
    }),
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
    automatic_preview_now_epoch_ms: () => previewClock,
    automatic_preview_wait: async (milliseconds) => {
      previewWaits.push(milliseconds);
      previewClock += milliseconds;
    },
  });
  assert.equal(result.classification, "OFFICIAL_RUNTIME_COMPLETE");
  assert.equal(
    adapters.invocations.filter((entry) => entry === "acquire_automatic_preview").length,
    3,
  );
  assert.deepEqual(previewWaits, [5_000, 5_000]);
  assert.equal(adapters.invocations.includes("detect_automatic_preview"), false);
  assert.equal(adapters.invocations.includes("create_preview"), false);
  assert(
    adapters.invocations.indexOf("verify_environment_2") <
      adapters.invocations.indexOf("create_remote_ref"),
  );
  assert(
    adapters.invocations.indexOf("create_remote_ref") <
      adapters.invocations.indexOf("acquire_automatic_preview"),
  );
});

for (const scenario of [
  {
    name: "env 1 created before readback",
    adapterOptions: { fail_operation: "verify_environment_1" },
    environmentDeletes: 1,
    remoteDelete: false,
    previewDelete: false,
  },
  {
    name: "env 1 verified before env 2 readback",
    adapterOptions: { fail_operation: "verify_environment_2" },
    environmentDeletes: 2,
    remoteDelete: false,
    previewDelete: false,
  },
  {
    name: "both envs verified before remote ref",
    adapterOptions: { fail_operation: "create_remote_ref" },
    environmentDeletes: 2,
    remoteDelete: false,
    previewDelete: false,
  },
  {
    name: "remote ref created before automatic Preview appears",
    adapterOptions: { automatic_preview_after: 6 },
    environmentDeletes: 2,
    remoteDelete: true,
    previewDelete: false,
  },
  {
    name: "automatic Preview acquired before readiness",
    adapterOptions: { fail_operation: "verify_preview_identity" },
    environmentDeletes: 2,
    remoteDelete: true,
    previewDelete: true,
  },
  {
    name: "automatic Preview readiness passed before protection failure",
    adapterOptions: { fail_operation: "protected_access_handshake" },
    environmentDeletes: 2,
    remoteDelete: true,
    previewDelete: true,
  },
]) {
  await check(`setup cleanup matrix closes ${scenario.name}`, async () => {
    const adapters = fakeAdapters(scenario.adapterOptions);
    let previewClock = TEST_NOW_EPOCH_MS;
    let previewJournaledBeforeReadiness = false;
    let remoteJournaledBeforeAcquisition = false;
    let current = null;
    let retired = null;
    const journal = {
      load: () => null,
      publish(value) {
        current = structuredClone(value);
      },
      retire(value) {
        retired = structuredClone(value);
        current = null;
      },
    };
    const invoke = adapters.invoke.bind(adapters);
    adapters.invoke = async (operation, input) => {
      if (operation === "acquire_automatic_preview") {
        remoteJournaledBeforeAcquisition = current?.owned?.remote_ref === EXPECTED_REMOTE_REF;
      }
      if (operation === "verify_preview_identity") {
        previewJournaledBeforeReadiness = current?.owned?.deployment_id === "dpl-owned";
      }
      return invoke(operation, input);
    };
    await assert.rejects(runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal,
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
      automatic_preview_now_epoch_ms: () => previewClock,
      automatic_preview_wait: async (milliseconds) => {
        previewClock += milliseconds;
      },
    }));
    assert.equal(retired.lifecycle, "CLEANUP_COMPLETE");
    assert.equal(retired.zero_residual, true);
    assert.equal(
      adapters.invocations.filter((entry) => entry.startsWith("delete_environment_")).length,
      scenario.environmentDeletes,
    );
    assert.equal(adapters.invocations.includes("delete_remote_ref"), scenario.remoteDelete);
    assert.equal(adapters.invocations.includes("delete_preview"), scenario.previewDelete);
    if (scenario.remoteDelete) assert.equal(remoteJournaledBeforeAcquisition, true);
    if (scenario.previewDelete) assert.equal(previewJournaledBeforeReadiness, true);
  });
}

await check("automatic Preview collision never deletes the unowned deployment", async () => {
  const adapters = fakeAdapters({
    automatic_preview_failure: true,
    external_residual_present: true,
  });
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters,
    journal: {
      load: () => null,
      publish() {},
      retire() {},
    },
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(result.zero_residual_owned_state, false);
  assert.equal(adapters.invocations.includes("delete_preview"), false);
  assert.equal(
    adapters.invocations.filter((entry) => entry.startsWith("delete_environment_")).length,
    2,
  );
  assert.equal(adapters.invocations.includes("delete_remote_ref"), true);
});

await check("Storage CAS replacement preservation", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-cas.");
  const adapters = fakeAdapters({ storage_version_mismatch: true });
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters,
    journal: createAdminV1OfficialJournal({
      directory: root,
      identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
    }),
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(result.storage_replacement_preserved, true);
  assert.equal(adapters.invocations.includes("delete_storage_exact_version"), false);
});

await check("zero count without ownership preservation proof is insufficient", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-zero-insufficient.");
  const result = await runAdminV1OfficialRuntime({
    authorization: authorization(),
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    adapters: fakeAdapters({ unrelated_preserved: false }),
    journal: createAdminV1OfficialJournal({
      directory: root,
      identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
    }),
    sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
      ([key, value]) => [key, Buffer.from(value)],
    )),
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(result.zero_residual_owned_state, false);
});

await check("budget stops before adapter effect", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-budget.");
  const adapters = fakeAdapters();
  await assert.rejects(
    runAdminV1OfficialRuntime({
      authorization: authorization(),
      now_epoch_ms: TEST_NOW_EPOCH_MS,
      adapters,
      journal: createAdminV1OfficialJournal({
        directory: root,
        identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
      }),
      sensitive: Object.fromEntries(Object.entries(SENTINELS).map(
        ([key, value]) => [key, Buffer.from(value)],
      )),
      test_budget_overrides: { oidc_generations: 0 },
    }),
    (error) => error?.code === "OFFICIAL_BUDGET_EXHAUSTED",
  );
  assert.equal(adapters.invocations.includes("generate_oidc"), false);
});

function v2Sensitive(record) {
  return { admin_password: Buffer.from("synthetic-admin"),
    admin_session_secret: Buffer.from("synthetic-session"),
    supabase_url: Buffer.from(record.execution.isolation.origin),
    supabase_anon_key: Buffer.from("synthetic-anon"),
    supabase_service_role_key: Buffer.from("synthetic-service") };
}
function v2Fixture({ fail = null, bad_verify = null, duplicate_id = false,
  final_failure = null, journal_failure = null } = {}) {
  const record = authorizationV2();
  const base = fakeAdapters();
  const calls = [], publications = [];
  let current = null, retired = false, previews = 0;
  const journal = {
    load() { return current === null ? null : { value: { state: structuredClone(current) }, retired }; },
    publish(state) {
      if (journal_failure && state.stage === journal_failure) throw new Error("SYNTHETIC_JOURNAL_FAILURE");
      current = structuredClone(state);publications.push(structuredClone(state));return DIGEST;
    },
    retire(state) { current = { ...structuredClone(state), retired: true };retired = true;return DIGEST; },
  };
  const adapters = { async invoke(operation, input = {}) {
    calls.push({ operation, input: Object.fromEntries(Object.entries(input).map(([key, value]) =>
      [key, value instanceof Uint8Array ? Buffer.from(value).toString("utf8") : structuredClone(value)])) });
    if (operation === fail) throw Object.assign(new Error("SYNTHETIC_AMBIGUOUS_CREATE"), {
      environment_create_failure_class: "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE", http_status_class: null });
    if (operation === "create_environment_2" && duplicate_id) return { status: "CREATED_EXACT", record_id: "env-1" };
    if (operation.startsWith("verify_environment_")) {
      if (operation === bad_verify || previews > 1 && operation === final_failure) return { status: "AMBIGUOUS" };
      return { status: "EXACT", record_id: input.record_id, key: input.key,
        project_id: record.execution.preview_project_id, team_id: record.execution.preview_team_id,
        git_branch: record.execution.branch_name, unrelated_preserved: true };
    }
    if (operation === "verify_preview_identity") {
      previews += 1;
      return { status: "EXACT", deployment_id: "dpl_owned", unrelated_preserved: true };
    }
    if (operation === "acquire_automatic_preview") return { status: "ACQUIRED_EXACT", deployment_id: "dpl_owned" };
    if (operation === "inspect_remote_ref_before_delete") return { status: "EXACT_OWNED",
      ref_id: EXPECTED_REMOTE_REF, commit_sha: record.execution.temporary_commit_sha };
    return base.invoke(operation, input);
  } };
  const run = (overrides = {}) => runAdminV1OfficialRuntime({ authorization: record,
    now_epoch_ms: TEST_NOW_EPOCH_MS, sensitive: v2Sensitive(record), journal, adapters, ...overrides });
  return { record, journal, calls, publications, run, state: () => current };
}

await check("versioned signed budget and action maps preserve v1", async () => {
  assert.deepEqual(runtimeModule.ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V1, ADMIN_V1_OFFICIAL_BUDGET_LIMITS);
  const expected = { ...ADMIN_V1_OFFICIAL_BUDGET_LIMITS, provider_direct_mutations: 15,
    environment_records_created: 7, environment_records_deleted: 7 };
  assert.deepEqual(runtimeModule.ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2, expected);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.environment_records_created, 2);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.environment_records_deleted, 4);
  assert.equal(ADMIN_V1_OFFICIAL_BUDGET_LIMITS.provider_direct_mutations, 13);
  const cost = runtimeModule.ADMIN_V1_OFFICIAL_ACTION_COSTS_V2;
  assert.equal(Object.keys(cost).length, Object.keys(runtimeModule.ADMIN_V1_OFFICIAL_ACTION_COSTS).length + 15);
  for (const [action, v1Cost] of Object.entries(runtimeModule.ADMIN_V1_OFFICIAL_ACTION_COSTS)) assert.deepEqual(cost[action], v1Cost);
  for (const version of [1, 2]) {
    const maximum = version === 1 ? 2 : 7;
    const budget = runtimeModule.createAdminV1OfficialBudget({ schema_version: version });
    for (let index = 0; index < maximum; index += 1) budget.take({ provider_direct_mutations: 1, environment_records_created: 1 });
    assert.throws(() => budget.take({ provider_direct_mutations: 1, environment_records_created: 1 }), { code: "OFFICIAL_BUDGET_EXHAUSTED" });
    assert.equal(budget.used.environment_records_created, maximum);
    assert.throws(() => runtimeModule.createAdminV1OfficialBudget({ schema_version: version,
      test_budget_overrides: { environment_records_created: maximum + 1 } }), { code: "OFFICIAL_BUDGET_INPUT" });
  }
  for (const name of ["environment_records_deleted", "provider_direct_mutations"]) {
    const budget = runtimeModule.createAdminV1OfficialBudget({ schema_version: 2 });
    for (let index = 0; index < expected[name]; index += 1) budget.take({ [name]: 1 });
    assert.throws(() => budget.take({ [name]: 1 }), { code: "OFFICIAL_BUDGET_EXHAUSTED" });
  }
});

await check("v2 provisions seven exact values and commits truthful retention", async () => {
  const f = v2Fixture();const result = await f.run();
  const creates = f.calls.filter((call) => /^create_environment_[1-7]$/u.test(call.operation));
  assert.deepEqual(creates.map((call) => [call.input.key, call.input.value]), [
    ["ADMIN_PASSWORD", "synthetic-admin"], ["ADMIN_SESSION_SECRET", "synthetic-session"],
    ["NEXT_PUBLIC_SUPABASE_URL", f.record.execution.isolation.origin], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon"],
    ["SUPABASE_SERVICE_ROLE_KEY", "synthetic-service"], ["AIFINDER_VALIDATION_RUN_ID", RUN_ID],
    ["AIFINDER_VALIDATION_PROJECT_REF", f.record.execution.isolation.project_ref],
  ]);
  for (const [index, create] of creates.entries()) {
    const at = f.calls.indexOf(create);assert.equal(f.calls[at + 1].operation, `verify_environment_${index + 1}`);
  }
  assert.equal(result.classification, "RETENTION_COMPLETE");
  assert.equal(result.zero_residual_owned_state, false);
  assert.equal(result.budgets.environment_records_created, 7);
  assert.equal(result.budgets.environment_records_deleted, 0);
  assert.equal(f.calls.filter((call) => call.operation === "verify_preview_identity").length, 2);
  assert.equal(f.calls.filter((call) => call.operation.startsWith("verify_environment_")).length, 14);
  assert.equal(f.calls.some((call) => call.operation === "delete_preview" || call.operation.startsWith("delete_environment_") || call.operation === "verify_zero_external_residual"), false);
  const state = f.state();
  assert.deepEqual(Object.keys(state.retention).sort(), ["policy", "phase", "deployment_id", "environment_record_ids", "environment_keys", "data_zero_residual", "external_retained_exact", "unrelated_preserved"].sort());
  assert.equal(state.lifecycle, "RETENTION_COMPLETE");assert.equal(state.zero_residual, false);
  assert.equal(state.retention.phase, "COMPLETE");assert.equal(state.retention.data_zero_residual, true);
  assert.equal(state.retention.external_retained_exact, true);assert.equal(state.retention.unrelated_preserved, true);
  assert.equal(state.retention.deployment_id, "dpl_owned");assert.equal(new Set(state.retention.environment_record_ids).size, 7);
  assert.deepEqual(f.publications.filter((value) => ["ARMED", "COMMITTED", "COMPLETE"].includes(value.retention.phase))
    .map((value) => value.retention.phase).filter((phase, index, rows) => index === 0 || rows[index - 1] !== phase), ["ARMED", "COMMITTED", "COMPLETE"]);
  assert.equal(classifyAdminV1OfficialRecoveryState(f.journal.load()), "RETENTION_COMPLETE");
  const before = f.calls.length;await assert.rejects(f.run(), { code: "OFFICIAL_AUTHORIZATION_SPENT" });assert.equal(f.calls.length, before);
  for (const mutate of [(s) => { s.zero_residual = true; }, (s) => { s.retention.environment_record_ids[6] = s.retention.environment_record_ids[0]; },
    (s) => { s.retention.environment_keys.reverse(); }, (s) => { s.retention.data_zero_residual = false; },
    (s) => { s.retention.extra = true; }, (s) => { s.retired = false; }]) {
    const invalid = structuredClone(state);mutate(invalid);assert.throws(() => classifyAdminV1OfficialRecoveryState(invalid), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  }
  for (const invalidCleanup of [[], state.cleanup.filter((step) => step !== "DELETE_REMOTE_REF"),
    [...state.cleanup, "DELETE_PREVIEW"], null]) {
    const invalid = structuredClone(state);invalid.cleanup = invalidCleanup;
    assert.throws(() => classifyAdminV1OfficialRecoveryState(invalid), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  }
  for (const wrapper of [{ retired: false, value: { state } },
    { retired: true, value: { state: { ...state, retired: false } } }]) {
    assert.throws(() => classifyAdminV1OfficialRecoveryState(wrapper), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  }
  const committed = structuredClone(state);committed.lifecycle = "RETENTION_PENDING";committed.retention.phase = "COMMITTED";
  assert.throws(() => classifyAdminV1OfficialRecoveryState(committed), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  committed.retired = false;
  assert.throws(() => classifyAdminV1OfficialRecoveryState({ retired: true, value: { state: committed } }), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
  assert.throws(() => classifyAdminV1OfficialRecoveryState({ retired: "true", value: { state: committed } }), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
});

await check("v2 precommit failures clean only captured exact IDs without create retry", async () => {
  for (const ordinal of [1, 3, 7]) {
    const f = v2Fixture({ fail: `create_environment_${ordinal}` });await assert.rejects(f.run());
    assert.equal(f.calls.filter((call) => call.operation === `create_environment_${ordinal}`).length, 1);
    assert.equal(f.calls.some((call) => call.operation === `create_environment_${ordinal + 1}`), false);
    assert.deepEqual(f.calls.filter((call) => call.operation.startsWith("delete_environment_")).map((call) => call.input.record_id),
      Array.from({ length: ordinal - 1 }, (_, index) => `env-${index + 1}`));
    assert.equal(f.state().lifecycle, "CLEANUP_COMPLETE");assert.equal(f.state().zero_residual, true);
    assert.equal(classifyAdminV1OfficialRecoveryState(f.state()), "CLEANUP_COMPLETE");
    assert.equal(classifyAdminV1OfficialRecoveryState(f.journal.load()), "CLEANUP_COMPLETE");
    const contradictory = structuredClone(f.state());contradictory.retired = false;
    assert.throws(() => classifyAdminV1OfficialRecoveryState({ retired: true, value: { state: contradictory } }),
      { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
    assert.equal(runtimeModule.classifyAdminV1OfficialEnvironmentCreateFailureEvidence({ state: f.state() }).operation, `create_environment_${ordinal}`);
  }
  const armed = v2Fixture({ fail: "generate_oidc" });await assert.rejects(armed.run());
  assert(armed.publications.some((state) => state.retention.phase === "ARMED"));
  assert.equal(armed.calls.filter((call) => call.operation === "delete_preview").length, 1);
  assert.equal(armed.calls.filter((call) => call.operation.startsWith("delete_environment_")).length, 7);
  assert.equal(armed.state().zero_residual, true);
  assert.equal(classifyAdminV1OfficialRecoveryState(armed.journal.load()), "CLEANUP_COMPLETE");
  const verification = v2Fixture({ bad_verify: "verify_environment_3" });await assert.rejects(verification.run());
  assert.equal(verification.calls.some((call) => call.operation === "create_environment_4"), false);
  assert.deepEqual(verification.calls.filter((call) => call.operation.startsWith("delete_environment_")).map((call) => call.input.record_id), ["env-1", "env-2", "env-3"]);
  const duplicate = v2Fixture({ duplicate_id: true });await assert.rejects(duplicate.run());
  assert.equal(duplicate.calls.some((call) => call.operation === "create_environment_3"), false);
  assert.deepEqual(duplicate.calls.filter((call) => call.operation.startsWith("delete_environment_")).map((call) => call.input.record_id), ["env-1"]);
  const exhausted = v2Fixture();await assert.rejects(exhausted.run({ test_budget_overrides: { environment_records_created: 6 } }), { code: "OFFICIAL_BUDGET_EXHAUSTED" });
  assert.equal(exhausted.calls.some((call) => call.operation === "create_environment_7"), false);
});

await check("v2 committed finalization failures retain resources and recover by reads only", async () => {
  const pending = v2Fixture({ journal_failure: "RETENTION_FINALIZATION_PUBLISHED" });
  assert.equal((await pending.run()).classification, "RETENTION_PENDING");
  assert.equal(classifyAdminV1OfficialRecoveryState(pending.journal.load()), "RETENTION_PENDING");
  assert.equal(pending.calls.some((call) => call.operation === "delete_preview" || call.operation.startsWith("delete_environment_")), false);
  const f = v2Fixture({ final_failure: "verify_environment_6" });assert.equal((await f.run()).classification, "RECOVERY_PENDING");
  assert.equal(f.state().retention.phase, "COMMITTED");assert.equal(f.state().zero_residual, false);
  assert.equal(f.calls.some((call) => call.operation === "delete_preview" || call.operation.startsWith("delete_environment_")), false);
  const reads = [];
  const recoveryAdapters = { async invoke(operation, input = {}) {
    reads.push(operation);
    if (operation === "verify_preview_identity") return { status: "EXACT", deployment_id: "dpl_owned", unrelated_preserved: true };
    if (operation.startsWith("verify_environment_")) return { status: "EXACT", record_id: input.record_id, key: input.key,
      project_id: f.record.execution.preview_project_id, team_id: f.record.execution.preview_team_id,
      git_branch: f.record.execution.branch_name, unrelated_preserved: true };
    if (operation === "inspect_remote_ref") return { status: "ABSENT" };
    throw new Error("MUTATION_IN_READ_ONLY_RECOVERY");
  } };
  const completed = await runtimeModule.recoverAdminV1OfficialRetention({ authorization: f.record, journal: f.journal,
    adapters: recoveryAdapters, now_epoch_ms: TEST_NOW_EPOCH_MS });
  assert.equal(completed.classification, "RETENTION_COMPLETE");
  assert.equal(reads.length, 9);assert.equal(reads.some((operation) => operation.startsWith("delete_") ||
    operation === "verify_zero_external_residual" || operation === "verify_zero_data_residual"), false);
  await assert.rejects(runtimeModule.recoverAdminV1OfficialRetention({ authorization: f.record, journal: f.journal,
    adapters: recoveryAdapters, now_epoch_ms: TEST_NOW_EPOCH_MS }), { code: "OFFICIAL_AUTHORIZATION_SPENT" });
});

await check("v2 retained success retires durable journal and rejects replay", async () => {
  const f = v2Fixture();const root = mkdtempSync("/tmp/aifinder-admin-v1-official-retention.");
  const journal = createAdminV1OfficialJournal({ directory: root, identity: { authorization_id_sha256: f.record.authorization_id_sha256, run_id: RUN_ID } });
  await f.run({ journal });
  const document = journal.load();assert.equal(document.retired, true);
  const retiredPath = path.join(root, "admin-v1-official-runtime-retired.json");
  const retiredBytes = readFileSync(retiredPath);
  assert.throws(() => journal.retire(document.value.state), { code: "OFFICIAL_AUTHORIZATION_SPENT" });
  assert.deepEqual(readFileSync(retiredPath), retiredBytes);
  assert.throws(() => journal.retire({ lifecycle: "CLEANUP_COMPLETE", zero_residual: true }),
    { code: "OFFICIAL_AUTHORIZATION_SPENT" });
  assert.deepEqual(readFileSync(retiredPath), retiredBytes);
  assert.equal(classifyAdminV1OfficialRecoveryState(document), "RETENTION_COMPLETE");
  assert.equal(document.value.state.zero_residual, false);
  for (const cleanup of [[], document.value.state.cleanup.filter((step) => step !== "RETIRE_PROTECTED_ACCESS")]) {
    const invalid = structuredClone(document.value.state);invalid.cleanup = cleanup;
    assert.throws(() => journal.retire(invalid), { code: "OFFICIAL_RETIREMENT_DENIED" });
  }
  await assert.rejects(f.run({ journal }), { code: "OFFICIAL_AUTHORIZATION_SPENT" });
});

await check("durable retention journal exempts only the exact public key array", async () => {
  const f = v2Fixture();await f.run();
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-retention-filter.");
  const journal = createAdminV1OfficialJournal({ directory: root, identity: {
    authorization_id_sha256: f.record.authorization_id_sha256, run_id: RUN_ID } });
  const initial = f.publications[0];journal.publish(initial);
  assert.deepEqual(journal.load().value.state.retention.environment_keys, expectedIsolationContract.environment_keys);
  for (const mutate of [(state) => { state.stage = "SYNTHETIC_PASSWORD_VALUE"; },
    (state) => { state.retention.environment_keys.reverse(); },
    (state) => { state.retention.environment_keys[0] = "SYNTHETIC_PASSWORD_VALUE"; },
    (state) => { state.retention.extra = "public-but-unapproved"; },
    (state) => { state.owned.extra = "SYNTHETIC_SESSION_SECRET_VALUE"; }]) {
    const invalid = structuredClone(initial);mutate(invalid);
    assert.throws(() => journal.publish(invalid), { code: "OFFICIAL_EVIDENCE_SENSITIVE" });
    assert.deepEqual(journal.load().value.state, initial);
  }
});

await check("contract digest versions and semantic one-use binding", async () => {
  for (const version of [1, 2]) {
    const record = version === 1 ? authorization() : authorizationV2();
    assert.equal(validateAdminV1OfficialAuthorization(record, { now_epoch_ms: TEST_NOW_EPOCH_MS }).schema_version, version);
    const hybrid = structuredClone(record);
    if (version === 1) hybrid.contract_sha256.action_costs = "a".repeat(64);
    else delete hybrid.contract_sha256.action_costs;
    assert.throws(() => validateAdminV1OfficialAuthorization(hybrid, { now_epoch_ms: TEST_NOW_EPOCH_MS }), { code: "OFFICIAL_AUTHORIZATION_INVALID" });
  }
  const original = authorizationV2();
  for (const mutate of [(record) => { record.contract_sha256.budgets = "b".repeat(64); },
    (record) => { record.contract_sha256.action_costs = "c".repeat(64); },
    (record) => { record.isolation_contract_sha256 = "d".repeat(64); },
    (record) => { record.execution.provider_cleanup_policy = "DELETE_ALL"; }]) {
    const changed = structuredClone(original);mutate(changed);
    assert.notEqual(expectedV2OneUse(changed), original.one_use_authorization_sha256);
    assert.throws(() => validateAdminV1OfficialAuthorization(changed, { now_epoch_ms: TEST_NOW_EPOCH_MS }), { code: "OFFICIAL_AUTHORIZATION_INVALID" });
  }
});


await check("existing-only journal cannot create absent roots or identity records", async () => {
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-journal.");
  const identity = { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID };
  const before = readdirSync(root);
  assert.throws(() => createAdminV1OfficialJournal({directory:root,identity,existing_only:true}));
  assert.deepEqual(readdirSync(root),before);
  const absent = `${root}/absent`;
  assert.throws(() => createAdminV1OfficialJournal({directory:absent,identity,existing_only:true}));
  assert.equal(existsSync(absent),false);
  const journal = createAdminV1OfficialJournal({directory:root,identity});
  journal.publish({lifecycle:"PRE_EFFECT",zero_residual:false});
  const names = readdirSync(root);
  const reopened = createAdminV1OfficialJournal({directory:root,identity,existing_only:true});
  assert.deepEqual(reopened.load(),journal.load());assert.deepEqual(readdirSync(root),names);
});


await check("real durable final-failure journal admits recovery with historical owned handles", async () => {
  const f = v2Fixture({final_failure:"verify_environment_7"});
  const root = mkdtempSync("/tmp/aifinder-admin-v1-official-retention.");
  const identity = {authorization_id_sha256:f.record.authorization_id_sha256,run_id:RUN_ID};
  const journal = createAdminV1OfficialJournal({directory:root,identity});
  assert.equal((await f.run({journal})).classification,"RECOVERY_PENDING");
  const before=journal.load();
  assert.equal(before.value.state.owned.submissions.length,3);
  assert.equal(before.value.state.owned.tools.length,2);assert(before.value.state.owned.local_temp_state);
  assert.equal(runtimeModule.validateAdminV1OfficialRetentionRecoveryRecord(before,f.record).state.retention.phase,"COMMITTED");
  const reopened=createAdminV1OfficialJournal({directory:root,identity,existing_only:true});
  let reads=0;
  const result=await runtimeModule.recoverAdminV1OfficialRetention({authorization:f.record,journal:reopened,
    now_epoch_ms:TEST_NOW_EPOCH_MS,adapters:{async invoke(operation,input={}){
      reads++;if(operation==="inspect_remote_ref")return {status:"ABSENT"};
      if(operation==="verify_preview_identity")return {status:"EXACT",deployment_id:input.deployment_id,unrelated_preserved:true};
      return {status:"EXACT",...input,project_id:f.record.execution.preview_project_id,team_id:f.record.execution.preview_team_id,
        git_branch:f.record.execution.branch_name,unrelated_preserved:true};}}});
  assert.equal(result.classification,"RETENTION_COMPLETE");assert.equal(reads,9);
  const completed=reopened.load().value.state;
  assert.equal(completed.last_completed_official_ordinal,20);assert.equal(completed.last_completed_qualification_ordinal,6);assert.equal(completed.runtime_sessions,1);
  assert.equal(classifyAdminV1OfficialRecoveryState(reopened.load()),"RETENTION_COMPLETE");
  assert.deepEqual(reopened.load().value.state.owned,before.value.state.owned);
});

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("PRODUCTION_EXPIRY_VALIDATION_UNCHANGED=PASS");
  console.log("GLOBAL_TIME_MONKEYPATCH=0");
  console.log("TEST_AUTHORIZATION_WINDOW_EXTENSION_FOR_CONVENIENCE=0");
  console.log("EXPLICIT_TEST_NOW_FOR_VALID_FIXTURE=PASS");
  console.log("EXPLICIT_EXPIRY_BOUNDARY_TESTS=PASS");
  console.log(
    `PASS_ADMIN_V1_OFFICIAL_RUNTIME assertions=${assertions} qualification=6 official=20 sessions=1 retries=0 replays=0 deferred_handlers=0 real_calls=0 failures=0 internal_failures=0`,
  );
}
