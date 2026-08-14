import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";

const PHASE = "34IA-34IZ";
const BASELINE = "e2c7025a3985d71a7e354e9644bbd9069db0ab80";
const BRANCH =
  "aifinder-phase-34ia-evidence-publication-runtime-validation-v3";
const MARKER_PATH =
  "testing/aifinder-phase-34fa-staging-runtime-preview-marker.txt";
const TARGET_SHA256 =
  "0000000000000000000000000000000000000000000000000000000000000000";

const REQUESTS = Object.freeze([
  Object.freeze({ ordinal: 1, method: "GET", path: "/api/admin/tools", status: 401, contract: "UNAUTHENTICATED_DENIAL" }),
  Object.freeze({ ordinal: 2, method: "POST", path: "/api/admin/login", status: 200, contract: "SESSION_COOKIE_CREATED" }),
  Object.freeze({ ordinal: 3, method: "GET", path: "/api/admin/session", status: 200, contract: "AUTHENTICATED_SESSION" }),
  Object.freeze({ ordinal: 4, method: "GET", path: "/api/admin/csrf", status: 200, contract: "CSRF_COOKIE_AND_TOKEN" }),
  Object.freeze({ ordinal: 5, method: "POST", path: "/api/admin/tools", status: 403, contract: "MISSING_CSRF_DENIAL" }),
  Object.freeze({ ordinal: 6, method: "GET", path: "/api/admin/submissions", status: 200, contract: "STAGING_TARGET_FIXTURE_BINDING_3_OF_3" }),
  Object.freeze({ ordinal: 7, method: "GET", path: "/api/admin/tools", status: 200, contract: "AUTHENTICATED_TOOLS_READ" }),
  Object.freeze({ ordinal: 8, method: "POST", path: "/api/admin/tools", status: 200, contract: "SYNTHETIC_TOOL_CREATED" }),
  Object.freeze({ ordinal: 9, method: "GET", path: "/api/admin/tools", status: 200, contract: "SYNTHETIC_TOOL_ID_DISCOVERED" }),
  Object.freeze({ ordinal: 10, method: "PUT", path: "/api/admin/tools", status: 200, contract: "SYNTHETIC_TOOL_UPDATED" }),
  Object.freeze({ ordinal: 11, method: "DELETE", path: "/api/admin/tools", status: 200, contract: "SYNTHETIC_TOOL_ARCHIVED" }),
  Object.freeze({ ordinal: 12, method: "PUT", path: "/api/admin/submissions", status: 200, contract: "SYNTHETIC_SUBMISSION_UPDATED" }),
  Object.freeze({ ordinal: 13, method: "PATCH", path: "/api/admin/submissions", status: 200, contract: "SYNTHETIC_SUBMISSION_REJECTED" }),
  Object.freeze({ ordinal: 14, method: "POST", path: "/api/admin/submissions", status: 200, contract: "SYNTHETIC_SUBMISSION_APPROVED_RPC_ONCE" }),
  Object.freeze({ ordinal: 15, method: "POST", path: "/api/admin/upload-logo", status: 200, contract: "SYNTHETIC_PNG_UPLOADED" }),
  Object.freeze({ ordinal: 16, method: "PATCH", path: "/api/admin/tools", status: 405, contract: "METHOD_GATE_ALLOW_HEADER" }),
  Object.freeze({ ordinal: 17, method: "GET", path: "/api/admin/discovery/sources", status: 404, contract: "DEFERRED_ROUTE_FAIL_CLOSED" }),
  Object.freeze({ ordinal: 18, method: "GET", path: "/api/admin/unknown.map", status: 404, contract: "EXTENSION_SUFFIX_FAIL_CLOSED" }),
  Object.freeze({ ordinal: 19, method: "POST", path: "/api/admin/logout", status: 200, contract: "SESSION_AND_CSRF_COOKIES_CLEARED" }),
  Object.freeze({ ordinal: 20, method: "GET", path: "/api/admin/session", status: 401, contract: "POST_LOGOUT_DENIAL" }),
]);

const PLAN = deepFreeze({
  schema_version: 1,
  phase: PHASE,
  baseline: BASELINE,
  branch: BRANCH,
  marker_path: MARKER_PATH,
  target_sha256: TARGET_SHA256,
  project: Object.freeze({
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    team_slug: "ai-finder-s-projects",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    project_name: "aifinder",
    repository: "jcdumaua/aifinder",
  }),
  marker: Object.freeze({
    bytes: 475,
    lf: 10,
    sha256: "f3ad712e4b322a2ed57d5f7bd1e53eac02d6c3715e77a7f76b0d490ca28d358e",
    trailing_lf: true,
  }),
  environment_names: Object.freeze([
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]),
  audit_actions: Object.freeze([
    "tool_added",
    "tool_updated",
    "tool_deleted",
    "submission_updated",
    "submission_rejected",
    "submission_approved",
    "logo_uploaded",
    "admin_logout",
  ]),
  requests: REQUESTS,
  budgets: Object.freeze({
    runtime_sessions: 1,
    application_requests: 20,
    runtime_retries: 0,
    direct_data_success_requests: 14,
    direct_data_maximum: 26,
    cleanup_retry_reserve: 2,
    cleanup_storage_list_reserve: 4,
    cleanup_storage_download_reserve: 3,
    preview_deployments: 1,
    qualification_get_requests: 4,
    protection_access_handshake_get_requests: 6,
    project_oidc_token_generations: 4,
    temporary_bypass_cycles: 3,
    environment_metadata_requests: 2,
    environment_pulls: 0,
    local_environment_reads: 1,
    auth_qualification_cycles: 1,
    auth_qualification_requests: 6,
    login_attempts: 1,
    environment_record_deletes_maximum: 6,
    branch_propagation_retries_maximum: 6,
    registration_inventory_traversals: 4,
    registration_inventory_pages_per_traversal: 10,
    environment_record_creates_maximum: 8,
    vercel_control_maximum: 353,
    github_reads_maximum: 6,
    git_remote_reads_maximum: 42,
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function buildSubmittedToolInsertRows(fixtures) {
  const roles = ["EDIT", "REJECT", "APPROVE"];
  const writableColumns = [
    "category",
    "description",
    "logo_url",
    "name",
    "pricing",
    "status",
    "submitter_email",
    "submitter_name",
    "website",
  ];
  const acceptedColumns = new Set([
    ...writableColumns,
    "normalized_domain",
  ]);
  if (
    !Array.isArray(fixtures) ||
    fixtures.length !== roles.length
  ) {
    fail("FIXTURE_INSERT_ROWS_INPUT");
  }
  const rows = fixtures.map((fixture, index) => {
    if (
      !fixture ||
      typeof fixture !== "object" ||
      Array.isArray(fixture) ||
      fixture.role !== roles[index] ||
      !fixture.row ||
      typeof fixture.row !== "object" ||
      Array.isArray(fixture.row) ||
      typeof fixture.row.normalized_domain !== "string" ||
      fixture.row.normalized_domain.length === 0 ||
      typeof fixture.row.name !== "string" ||
      fixture.row.name.length === 0 ||
      typeof fixture.row.website !== "string" ||
      fixture.row.website.length === 0 ||
      Object.keys(fixture.row).some(
        (column) => !acceptedColumns.has(column),
      )
    ) {
      fail("FIXTURE_INSERT_ROWS_IDENTITY");
    }
    const row = Object.fromEntries(
      writableColumns
        .filter((column) => Object.hasOwn(fixture.row, column))
        .map((column) => [column, fixture.row[column]]),
    );
    if (Object.keys(row).length === 0) {
      fail("FIXTURE_INSERT_ROWS_EMPTY");
    }
    return row;
  });
  return deepFreeze(rows);
}

export function classifySubmittedFixtureMarkerRows(value) {
  requireExactKeys(
    value,
    ["fixtures", "rows"],
    "FIXTURE_MARKER_ROWS_SHAPE",
  );
  const roles = ["EDIT", "REJECT", "APPROVE"];
  if (
    !Array.isArray(value.fixtures) ||
    value.fixtures.length !== roles.length ||
    !Array.isArray(value.rows) ||
    value.rows.length > roles.length
  ) {
    fail("FIXTURE_MARKER_ROWS_INPUT");
  }
  const expected = new Map();
  for (const [index, fixture] of value.fixtures.entries()) {
    if (
      !fixture ||
      typeof fixture !== "object" ||
      Array.isArray(fixture) ||
      fixture.role !== roles[index] ||
      !fixture.row ||
      typeof fixture.row !== "object" ||
      Array.isArray(fixture.row) ||
      typeof fixture.row.name !== "string" ||
      typeof fixture.row.website !== "string" ||
      typeof fixture.row.normalized_domain !== "string" ||
      expected.has(fixture.row.website)
    ) {
      fail("FIXTURE_MARKER_FIXTURE_IDENTITY");
    }
    expected.set(fixture.row.website, fixture);
  }
  if (value.rows.length === 0) {
    return deepFreeze({ bound_ids: [], state: "EMPTY" });
  }
  const ids = new Set();
  const matchedWebsites = new Set();
  const boundIds = [];
  let allPending = true;
  for (const row of value.rows) {
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      !Number.isInteger(row.id) ||
      row.id < 1 ||
      typeof row.name !== "string" ||
      typeof row.website !== "string" ||
      typeof row.normalized_domain !== "string" ||
      typeof row.status !== "string"
    ) {
      fail("FIXTURE_MARKER_ROW_IDENTITY");
    }
    const fixture = expected.get(row.website);
    if (
      !fixture ||
      fixture.row.name !== row.name ||
      fixture.row.normalized_domain !== row.normalized_domain ||
      ids.has(row.id) ||
      matchedWebsites.has(row.website)
    ) {
      fail("FIXTURE_MARKER_ROW_CONFLICT");
    }
    ids.add(row.id);
    matchedWebsites.add(row.website);
    boundIds.push(row.id);
    if (row.status !== "pending") allPending = false;
  }
  boundIds.sort((left, right) => left - right);
  return deepFreeze({
    bound_ids: boundIds,
    state:
      value.rows.length === roles.length &&
      matchedWebsites.size === roles.length &&
      allPending
        ? "EXACT_THREE_PENDING"
        : "PARTIAL_PHASE_ROWS",
  });
}

export function deriveFixtureSetupTransition(value) {
  requireExactKeys(
    value,
    [
      "application_requests_1_to_5_completed_once",
      "attempt",
      "cleanup_verified",
      "marker_state",
      "maximum_attempts",
      "mode",
      "request_6_started",
      "response_state",
      "route_mutation_started",
      "unrelated_rows_deleted",
      "unrelated_rows_modified",
    ],
    "FIXTURE_SETUP_TRANSITION_SHAPE",
  );
  const expectedMaximum = new Map([
    ["QUALIFICATION", 6],
    ["OFFICIAL", 3],
  ]).get(value.mode);
  if (
    expectedMaximum === undefined ||
    value.maximum_attempts !== expectedMaximum ||
    !Number.isInteger(value.attempt) ||
    value.attempt < 1 ||
    value.attempt > value.maximum_attempts ||
    value.application_requests_1_to_5_completed_once !== true ||
    typeof value.cleanup_verified !== "boolean" ||
    value.request_6_started !== false ||
    value.route_mutation_started !== false ||
    value.unrelated_rows_deleted !== 0 ||
    value.unrelated_rows_modified !== 0 ||
    !["EMPTY", "EXACT_THREE_PENDING", "PARTIAL_PHASE_ROWS"].includes(
      value.marker_state,
    ) ||
    !["SUCCESS", "REJECTED", "LOST"].includes(value.response_state)
  ) {
    fail("FIXTURE_SETUP_TRANSITION_IDENTITY");
  }
  if (value.marker_state === "EXACT_THREE_PENDING") {
    if (value.response_state === "REJECTED") {
      fail("FIXTURE_SETUP_REJECTED_WITH_ROWS");
    }
    return value.response_state === "LOST"
      ? "ADOPT_RECONCILED_EXACT_THREE"
      : "ADOPT_EXACT_THREE";
  }
  if (value.marker_state === "PARTIAL_PHASE_ROWS") {
    if (value.cleanup_verified) {
      fail("FIXTURE_SETUP_PARTIAL_AFTER_CLEANUP");
    }
    return "CLEAN_EXACT_MARKER_ROWS_BEFORE_RETRY";
  }
  if (value.attempt === value.maximum_attempts) {
    fail("FIXTURE_SETUP_ATTEMPTS_EXHAUSTED");
  }
  return value.response_state === "REJECTED"
    ? "RETRY_INSERT_AFTER_EMPTY_REJECTION"
    : "RETRY_INSERT_AFTER_EMPTY_LOSS";
}

export function validateDelta15FixtureQualificationEvidence(value) {
  const keys = [
    "application_requests",
    "audit_rows_created",
    "exact_fixture_ids_bound",
    "exact_fixture_rows_created",
    "exact_fixture_rows_remaining",
    "fixture_binding",
    "logo_objects_created",
    "route_mutations",
    "storage_requests",
    "tool_rows_created",
    "unrelated_rows_deleted",
    "unrelated_rows_modified",
  ];
  requireExactKeys(
    value,
    keys,
    "DELTA15_FIXTURE_QUALIFICATION_EVIDENCE_SHAPE",
  );
  if (
    value.application_requests !== 6 ||
    value.exact_fixture_ids_bound !== 3 ||
    value.exact_fixture_rows_created !== 3 ||
    value.exact_fixture_rows_remaining !== 0 ||
    value.fixture_binding !== "3_OF_3_PENDING" ||
    [
      "audit_rows_created",
      "logo_objects_created",
      "route_mutations",
      "storage_requests",
      "tool_rows_created",
      "unrelated_rows_deleted",
      "unrelated_rows_modified",
    ].some((name) => value[name] !== 0)
  ) {
    fail("DELTA15_FIXTURE_QUALIFICATION_EVIDENCE");
  }
  return deepFreeze({ ...value });
}

export function validateDelta15QualificationCompletion(value) {
  requireExactKeys(
    value,
    [
      "current_direct_requests",
      "prior_direct_requests",
      "qualification_cycles",
      "qualification_requests",
      "recovered",
    ],
    "DELTA15_QUALIFICATION_COMPLETION_SHAPE",
  );
  const expectedCycles = value.recovered
    ? [2]
    : [1, 2];
  const expectedRequests = value.recovered
    ? 12
    : value.qualification_cycles === 1
      ? 6
      : 11;
  const expectedPriorDirect = value.recovered ? 3 : 0;
  if (
    typeof value.recovered !== "boolean" ||
    !expectedCycles.includes(value.qualification_cycles) ||
    value.qualification_requests !== expectedRequests ||
    value.prior_direct_requests !== expectedPriorDirect ||
    !Number.isInteger(value.current_direct_requests) ||
    value.current_direct_requests < 3 ||
    value.current_direct_requests > 18
  ) {
    fail("DELTA15_QUALIFICATION_COMPLETION_IDENTITY");
  }
  return deepFreeze({
    current_direct_requests: value.current_direct_requests,
    prior_direct_requests: value.prior_direct_requests,
    qualification_cycles: value.qualification_cycles,
    qualification_requests: value.qualification_requests,
    recovered: value.recovered,
    total_direct_requests:
      value.prior_direct_requests + value.current_direct_requests,
  });
}

export function authorizeDelta15OfficialFixtureSetup(value) {
  requireExactKeys(
    value,
    [
      "application_requests_completed",
      "fixture_insert_attempt",
      "fixture_insert_attempts_maximum",
      "repeated_application_requests_1_to_5",
      "request_6_started",
      "route_mutation_started",
      "runtime_sessions",
    ],
    "DELTA15_OFFICIAL_FIXTURE_SETUP_SHAPE",
  );
  if (
    value.application_requests_completed !== 5 ||
    value.fixture_insert_attempts_maximum !== 3 ||
    !Number.isInteger(value.fixture_insert_attempt) ||
    value.fixture_insert_attempt < 1 ||
    value.fixture_insert_attempt > value.fixture_insert_attempts_maximum ||
    value.repeated_application_requests_1_to_5 !== 0 ||
    value.request_6_started !== false ||
    value.route_mutation_started !== false ||
    value.runtime_sessions !== 1
  ) {
    fail("DELTA15_OFFICIAL_FIXTURE_SETUP");
  }
  return deepFreeze({
    application_requests_completed: 5,
    fixture_insert_attempt: value.fixture_insert_attempt,
    request_6_started: false,
  });
}

export function buildVercelDeploymentDeleteArgs(value) {
  requireExactKeys(
    value,
    ["deployment_id", "team_id"],
    "VERCEL_DEPLOYMENT_DELETE_ARGS_SHAPE",
  );
  if (
    !/^dpl_[A-Za-z0-9]+$/u.test(value.deployment_id) ||
    !/^team_[A-Za-z0-9]+$/u.test(value.team_id)
  ) {
    fail("VERCEL_DEPLOYMENT_DELETE_ARGS_IDENTITY");
  }
  return deepFreeze([
    "api",
    `/v13/deployments/${value.deployment_id}?teamId=${value.team_id}`,
    "--method",
    "DELETE",
    "--dangerously-skip-permissions",
  ]);
}

export function classifyPreviewDeleteTransport(value) {
  requireExactKeys(
    value,
    [
      "delta12_retained_preview_id",
      "delta17a_retained_preview_id",
      "deployment_id",
      "existing_preview_deployment_id",
      "phase_owned_retained_preview_id",
      "resume_mode",
    ],
    "PREVIEW_DELETE_TRANSPORT_SHAPE",
  );
  if (
    ![
      value.delta12_retained_preview_id,
      value.delta17a_retained_preview_id,
      value.deployment_id,
      value.existing_preview_deployment_id,
      value.phase_owned_retained_preview_id,
    ].every((candidate) => /^dpl_[A-Za-z0-9]+$/u.test(candidate)) ||
    typeof value.resume_mode !== "boolean"
  ) {
    fail("PREVIEW_DELETE_TRANSPORT_INPUT");
  }
  if (
    value.resume_mode &&
    [
      value.existing_preview_deployment_id,
      value.delta12_retained_preview_id,
      value.delta17a_retained_preview_id,
      value.phase_owned_retained_preview_id,
    ].includes(value.deployment_id)
  ) {
    return "VERCEL_CLI_REMOVE_EXACT_POSTSTATE";
  }
  return "REST_V13_DELETE_BY_ID";
}

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function requireExactKeys(value, keys, code) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(value, key))
  ) {
    fail(code);
  }
}

const STORAGE_CLEANUP_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const STORAGE_CLEANUP_OBJECT_PATH =
  /^admin\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg|webp)$/u;
const STORAGE_CLEANUP_TOKEN_HEX = /^[a-f0-9]{64}$/u;
const STORAGE_CLEANUP_EXPIRY_RFC3339 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/u;

export function createStorageCleanupCapabilityToken(randomSource) {
  if (typeof randomSource !== "function") {
    fail("STORAGE_CLEANUP_TOKEN_SOURCE");
  }
  const generated = randomSource(32);
  if (!ArrayBuffer.isView(generated) || generated.byteLength !== 32) {
    if (ArrayBuffer.isView(generated)) {
      Buffer.from(
        generated.buffer,
        generated.byteOffset,
        generated.byteLength,
      ).fill(0);
    }
    fail("STORAGE_CLEANUP_TOKEN_BYTES");
  }
  const bytes = Buffer.from(
    generated.buffer,
    generated.byteOffset,
    generated.byteLength,
  );
  try {
    const rawToken = bytes.toString("hex");
    return deepFreeze({
      raw_token: rawToken,
      token_hash: createHash("sha256")
        .update(rawToken, "utf8")
        .digest("hex"),
    });
  } finally {
    bytes.fill(0);
  }
}

export function validateStorageCleanupGrantBinding(value) {
  requireExactKeys(
    value,
    [
      "phase_id",
      "runtime_session_id",
      "bucket_id",
      "object_name",
      "grant_id",
      "expected_version",
      "token_hash",
      "expires_at",
    ],
    "STORAGE_CLEANUP_GRANT_BINDING_SHAPE",
  );
  const expiresAtText = value.expires_at ?? "";
  const expiresAt = Date.parse(expiresAtText);
  if (
    value.phase_id !== "34IA-34IZ" ||
    !STORAGE_CLEANUP_UUID.test(value.runtime_session_id ?? "") ||
    value.bucket_id !== "tool-logos" ||
    !STORAGE_CLEANUP_OBJECT_PATH.test(value.object_name ?? "") ||
    !STORAGE_CLEANUP_UUID.test(value.grant_id ?? "") ||
    typeof value.expected_version !== "string" ||
    value.expected_version.length < 1 ||
    Buffer.byteLength(value.expected_version, "utf8") > 1024 ||
    value.expected_version.includes("\0") ||
    !STORAGE_CLEANUP_TOKEN_HEX.test(value.token_hash ?? "") ||
    !STORAGE_CLEANUP_EXPIRY_RFC3339.test(expiresAtText) ||
    !Number.isFinite(expiresAt) ||
    Math.abs(expiresAt) > 8_640_000_000_000_000
  ) {
    fail("STORAGE_CLEANUP_GRANT_BINDING_IDENTITY");
  }
  return deepFreeze({
    ...value,
    expires_at: new Date(expiresAt).toISOString(),
  });
}

export function authorizeStorageCleanupDeleteClientRole(role) {
  if (role !== "anon") fail("STORAGE_CLEANUP_DELETE_CLIENT_ROLE");
  return role;
}

export function authorizeStorageCleanupDeleteModel(value) {
  requireExactKeys(
    value,
    [
      "active_grant_count",
      "bucket_id",
      "current_version",
      "expected_version",
      "expires_at_epoch_ms",
      "now_epoch_ms",
      "object_name",
      "raw_token",
      "request_method",
      "storage_operation",
      "token_hash",
    ],
    "STORAGE_CLEANUP_DELETE_MODEL_SHAPE",
  );
  if (
    value.active_grant_count !== 1 ||
    value.bucket_id !== "tool-logos" ||
    !STORAGE_CLEANUP_OBJECT_PATH.test(value.object_name ?? "") ||
    value.request_method !== "DELETE" ||
    value.storage_operation !== "storage.object.delete_many" ||
    !Number.isSafeInteger(value.now_epoch_ms) ||
    !Number.isSafeInteger(value.expires_at_epoch_ms) ||
    value.expires_at_epoch_ms <= value.now_epoch_ms ||
    typeof value.expected_version !== "string" ||
    value.expected_version.length < 1 ||
    Buffer.byteLength(value.expected_version, "utf8") > 1024 ||
    value.expected_version.includes("\0") ||
    value.current_version !== value.expected_version ||
    !STORAGE_CLEANUP_TOKEN_HEX.test(value.raw_token ?? "") ||
    !STORAGE_CLEANUP_TOKEN_HEX.test(value.token_hash ?? "")
  ) {
    return false;
  }
  const observedHash = Buffer.from(
    createHash("sha256").update(value.raw_token, "utf8").digest("hex"),
    "ascii",
  );
  const expectedHash = Buffer.from(value.token_hash, "ascii");
  try {
    return timingSafeEqual(observedHash, expectedHash);
  } finally {
    observedHash.fill(0);
    expectedHash.fill(0);
  }
}

export function reconcileStorageCleanupGrantPreparation(value) {
  requireExactKeys(
    value,
    [
      "conflicting_active_grants",
      "grant",
      "matching_active_grants",
      "response_state",
    ],
    "STORAGE_CLEANUP_GRANT_RECONCILIATION_SHAPE",
  );
  const grant = validateStorageCleanupGrantBinding(value.grant);
  if (
    !["RECEIVED", "LOST"].includes(value.response_state) ||
    !Number.isInteger(value.matching_active_grants) ||
    !Number.isInteger(value.conflicting_active_grants) ||
    value.matching_active_grants < 0 ||
    value.conflicting_active_grants < 0 ||
    value.matching_active_grants > 1 ||
    value.conflicting_active_grants > 0
  ) {
    fail("STORAGE_CLEANUP_DUPLICATE_ACTIVE_GRANT");
  }
  if (value.matching_active_grants !== 1) {
    fail("STORAGE_CLEANUP_GRANT_PREPARATION_UNRESOLVED");
  }
  return deepFreeze({
    grant,
    state:
      value.response_state === "LOST"
        ? "RECONCILED_EXACT"
        : "RECEIVED_EXACT",
  });
}

export function classifyStorageCleanupDeleteOutcome(value) {
  requireExactKeys(
    value,
    [
      "delete_response",
      "expected_version",
      "grant_revoked",
      "observed_version",
      "post_delete_absence",
    ],
    "STORAGE_CLEANUP_DELETE_OUTCOME_SHAPE",
  );
  if (
    ![
      "SUCCESS",
      "FORBIDDEN",
      "EXPIRED",
      "LOST",
      "ERROR",
      "NOT_OBSERVED",
    ].includes(value.delete_response) ||
    typeof value.expected_version !== "string" ||
    value.expected_version.length < 1 ||
    Buffer.byteLength(value.expected_version, "utf8") > 1024 ||
    value.expected_version.includes("\0") ||
    !(
      value.observed_version === null ||
      (typeof value.observed_version === "string" &&
        value.observed_version.length > 0 &&
        Buffer.byteLength(value.observed_version, "utf8") <= 1100 &&
        !value.observed_version.includes("\0"))
    ) ||
    typeof value.grant_revoked !== "boolean" ||
    typeof value.post_delete_absence !== "boolean" ||
    (value.post_delete_absence && value.observed_version !== null)
  ) {
    fail("STORAGE_CLEANUP_DELETE_OUTCOME_INPUT");
  }
  let outcome;
  let replacementPreserved = "not_applicable";
  let retryPermitted = false;
  if (
    value.observed_version !== null &&
    value.observed_version !== value.expected_version
  ) {
    outcome = "VERSION_MISMATCH";
    replacementPreserved = true;
  } else if (
    value.post_delete_absence &&
    ["SUCCESS", "LOST"].includes(value.delete_response)
  ) {
    outcome = "AUTHORIZED";
    replacementPreserved = false;
  } else if (value.delete_response === "EXPIRED") {
    outcome = "EXPIRED";
  } else if (value.delete_response === "FORBIDDEN") {
    outcome = "DENIED";
  } else {
    outcome = "AMBIGUOUS";
    retryPermitted =
      ["SUCCESS", "LOST"].includes(value.delete_response) &&
      value.observed_version === value.expected_version &&
      !value.grant_revoked;
  }
  return deepFreeze({
    CAS_outcome: outcome,
    grant_revoked: value.grant_revoked,
    post_delete_absence: value.post_delete_absence,
    replacement_preserved: replacementPreserved,
    retry_permitted: retryPermitted,
  });
}

function requireBoolean(value, expected, code) {
  if (value !== expected) fail(code);
}

function requireOperationFunctions(operations, names, code) {
  if (
    !operations ||
    typeof operations !== "object" ||
    Array.isArray(operations) ||
    !names.every((name) => typeof operations[name] === "function")
  ) {
    fail(code);
  }
}

function hasParentTraversal(candidate) {
  if (typeof candidate !== "string" || !path.isAbsolute(candidate)) {
    return true;
  }
  const parsed = path.parse(candidate);
  return candidate
    .slice(parsed.root.length)
    .split(path.sep)
    .includes("..");
}

function ownedByEffectiveUser(metadata, effectiveUid) {
  return (
    effectiveUid === null ||
    (Number.isInteger(effectiveUid) &&
      effectiveUid >= 0 &&
      metadata?.uid === effectiveUid)
  );
}

export function validateCanonicalTempRoot(value, operations) {
  requireExactKeys(
    value,
    [
      "effective_uid",
      "expected_root_prefix",
      "lexical_temp_root",
      "lexical_tmp_base",
    ],
    "CANONICAL_TEMP_ROOT_SHAPE",
  );
  requireOperationFunctions(
    operations,
    ["lstat", "realpathNative"],
    "CANONICAL_TEMP_ROOT_OPERATIONS",
  );
  const {
    effective_uid: effectiveUid,
    expected_root_prefix: expectedRootPrefix,
    lexical_temp_root: lexicalTempRoot,
    lexical_tmp_base: lexicalTmpBase,
  } = value;
  if (
    ![
      "aifinder-34ia-",
      "aifinder-34ia-resume-",
      "aifinder-34ia-delta11-",
      "aifinder-34ia-delta12-access-",
      "aifinder-34ia-delta13-",
      "aifinder-34ia-delta13-env-",
      "aifinder-34ia-delta14-",
      "aifinder-34ia-delta15-",
      "aifinder-34ia-delta16-",
      "aifinder-34ia-delta17-",
      "aifinder-34ia-delta18-",
      "aifinder-34ia-delta19-",
      "aifinder-34ia-delta20-",
      "aifinder-34ia-delta20-publication-self-test-",
    ].includes(
      expectedRootPrefix,
    ) ||
    hasParentTraversal(lexicalTmpBase) ||
    hasParentTraversal(lexicalTempRoot)
  ) {
    fail("CANONICAL_TEMP_ROOT_INPUT");
  }
  const canonicalTmpBase = operations.realpathNative(lexicalTmpBase);
  const canonicalTempRoot = operations.realpathNative(lexicalTempRoot);
  if (
    hasParentTraversal(canonicalTmpBase) ||
    hasParentTraversal(canonicalTempRoot) ||
    operations.realpathNative(canonicalTmpBase) !== canonicalTmpBase ||
    operations.realpathNative(canonicalTempRoot) !== canonicalTempRoot
  ) {
    fail("CANONICAL_TEMP_ROOT_REALPATH");
  }
  const relativeRoot = path.relative(canonicalTmpBase, canonicalTempRoot);
  if (
    relativeRoot === "" ||
    relativeRoot === ".." ||
    relativeRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeRoot) ||
    relativeRoot.includes(path.sep)
  ) {
    fail("CANONICAL_TEMP_ROOT_CONTAINMENT");
  }
  const rootName = path.basename(canonicalTempRoot);
  const rootSuffix = rootName.slice(expectedRootPrefix.length);
  if (
    !rootName.startsWith(expectedRootPrefix) ||
    rootSuffix.length !== 6 ||
    !/^[A-Za-z0-9]{6}$/u.test(rootSuffix)
  ) {
    fail("CANONICAL_TEMP_ROOT_NAME");
  }
  const lexicalIdentity = operations.lstat(lexicalTempRoot);
  const canonicalIdentity = operations.lstat(canonicalTempRoot);
  if (
    !lexicalIdentity.isDirectory() ||
    lexicalIdentity.isSymbolicLink() ||
    !canonicalIdentity.isDirectory() ||
    canonicalIdentity.isSymbolicLink() ||
    lexicalIdentity.dev !== canonicalIdentity.dev ||
    lexicalIdentity.ino !== canonicalIdentity.ino
  ) {
    fail("CANONICAL_TEMP_ROOT_IDENTITY");
  }
  if (
    (lexicalIdentity.mode & 0o777) !== 0o700 ||
    (canonicalIdentity.mode & 0o777) !== 0o700
  ) {
    fail("CANONICAL_TEMP_ROOT_MODE");
  }
  if (
    !ownedByEffectiveUser(lexicalIdentity, effectiveUid) ||
    !ownedByEffectiveUser(canonicalIdentity, effectiveUid)
  ) {
    fail("CANONICAL_TEMP_ROOT_OWNER");
  }
  return deepFreeze({
    canonical_temp_root: canonicalTempRoot,
    canonical_tmp_base: canonicalTmpBase,
    lexical_temp_root: lexicalTempRoot,
    relative_root: relativeRoot,
  });
}

export function validateCanonicalStateFile(value, operations) {
  requireExactKeys(
    value,
    [
      "canonical_temp_root",
      "effective_uid",
      "expected_state_basename",
    ],
    "CANONICAL_STATE_FILE_SHAPE",
  );
  requireOperationFunctions(
    operations,
    ["lstat", "realpathNative"],
    "CANONICAL_STATE_FILE_OPERATIONS",
  );
  const {
    canonical_temp_root: canonicalTempRoot,
    effective_uid: effectiveUid,
    expected_state_basename: expectedStateBasename,
  } = value;
  if (
    expectedStateBasename !== "deployment-state.json" ||
    path.basename(expectedStateBasename) !== expectedStateBasename ||
    expectedStateBasename.includes(path.sep) ||
    hasParentTraversal(canonicalTempRoot) ||
    operations.realpathNative(canonicalTempRoot) !== canonicalTempRoot
  ) {
    fail("CANONICAL_STATE_FILE_INPUT");
  }
  const expectedStatePath = path.join(
    canonicalTempRoot,
    expectedStateBasename,
  );
  const canonicalStateParent = operations.realpathNative(
    path.dirname(expectedStatePath),
  );
  const canonicalStatePath = operations.realpathNative(expectedStatePath);
  const relativeState = path.relative(
    canonicalTempRoot,
    canonicalStatePath,
  );
  if (
    canonicalStateParent !== canonicalTempRoot ||
    canonicalStatePath !== expectedStatePath ||
    relativeState !== expectedStateBasename ||
    relativeState.includes(path.sep)
  ) {
    fail("CANONICAL_STATE_FILE_CONTAINMENT");
  }
  const metadata = operations.lstat(expectedStatePath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o600
  ) {
    fail("CANONICAL_STATE_FILE_IDENTITY");
  }
  if (!ownedByEffectiveUser(metadata, effectiveUid)) {
    fail("CANONICAL_STATE_FILE_OWNER");
  }
  return deepFreeze({
    canonical_state_path: canonicalStatePath,
    canonical_state_parent: canonicalStateParent,
    relative_state: relativeState,
  });
}

export function removeExactCanonicalStateRoot(value, operations) {
  requireExactKeys(
    value,
    [
      "effective_uid",
      "expected_root_prefix",
      "expected_state_basename",
      "lexical_temp_root",
      "lexical_tmp_base",
    ],
    "EXACT_CANONICAL_STATE_ROOT_SHAPE",
  );
  requireOperationFunctions(
    operations,
    [
      "fsyncDirectory",
      "isAbsent",
      "lstat",
      "readdir",
      "realpathNative",
      "rmdir",
      "unlink",
    ],
    "EXACT_CANONICAL_STATE_ROOT_OPERATIONS",
  );
  const root = validateCanonicalTempRoot(
    {
      effective_uid: value.effective_uid,
      expected_root_prefix: value.expected_root_prefix,
      lexical_temp_root: value.lexical_temp_root,
      lexical_tmp_base: value.lexical_tmp_base,
    },
    operations,
  );
  const entries = operations.readdir(root.canonical_temp_root);
  if (!Array.isArray(entries)) {
    fail("EXACT_CANONICAL_STATE_ROOT_ENTRIES");
  }
  if (entries.length === 0) {
    const expectedStatePath = path.join(
      root.canonical_temp_root,
      value.expected_state_basename,
    );
    if (!operations.isAbsent(expectedStatePath)) {
      fail("EXACT_CANONICAL_STATE_FILE_RESIDUE");
    }
    operations.fsyncDirectory(root.canonical_temp_root);
    const revalidatedEmptyRoot = validateCanonicalTempRoot(
      {
        effective_uid: value.effective_uid,
        expected_root_prefix: value.expected_root_prefix,
        lexical_temp_root: root.canonical_temp_root,
        lexical_tmp_base: root.canonical_tmp_base,
      },
      operations,
    );
    if (
      operations.readdir(revalidatedEmptyRoot.canonical_temp_root).length !==
      0
    ) {
      fail("EXACT_CANONICAL_STATE_ROOT_RESIDUE");
    }
    operations.rmdir(revalidatedEmptyRoot.canonical_temp_root);
    operations.fsyncDirectory(revalidatedEmptyRoot.canonical_tmp_base);
    if (!operations.isAbsent(revalidatedEmptyRoot.canonical_temp_root)) {
      fail("EXACT_CANONICAL_TEMP_ROOT_RESIDUE");
    }
    return deepFreeze({
      removed: true,
      state_file_remaining: 0,
      temp_root_remaining: 0,
    });
  }
  if (
    entries.length !== 1 ||
    entries[0] !== value.expected_state_basename
  ) {
    fail("EXACT_CANONICAL_STATE_ROOT_ENTRIES");
  }
  const state = validateCanonicalStateFile(
    {
      canonical_temp_root: root.canonical_temp_root,
      effective_uid: value.effective_uid,
      expected_state_basename: value.expected_state_basename,
    },
    operations,
  );
  operations.unlink(state.canonical_state_path);
  operations.fsyncDirectory(root.canonical_temp_root);
  if (!operations.isAbsent(state.canonical_state_path)) {
    fail("EXACT_CANONICAL_STATE_FILE_RESIDUE");
  }
  const revalidatedRoot = validateCanonicalTempRoot(
    {
      effective_uid: value.effective_uid,
      expected_root_prefix: value.expected_root_prefix,
      lexical_temp_root: root.canonical_temp_root,
      lexical_tmp_base: root.canonical_tmp_base,
    },
    operations,
  );
  if (operations.readdir(revalidatedRoot.canonical_temp_root).length !== 0) {
    fail("EXACT_CANONICAL_STATE_ROOT_RESIDUE");
  }
  operations.rmdir(revalidatedRoot.canonical_temp_root);
  operations.fsyncDirectory(revalidatedRoot.canonical_tmp_base);
  if (!operations.isAbsent(revalidatedRoot.canonical_temp_root)) {
    fail("EXACT_CANONICAL_TEMP_ROOT_RESIDUE");
  }
  return deepFreeze({
    removed: true,
    state_file_remaining: 0,
    temp_root_remaining: 0,
  });
}

function exactArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function normalizedHostname(value, code) {
  if (typeof value !== "string" || value.length < 1 || value.length > 253) {
    fail(code);
  }
  const candidate = value.toLowerCase().replace(/\.$/u, "");
  if (
    candidate.includes("://") ||
    candidate.includes("/") ||
    candidate.includes("?") ||
    candidate.includes("#") ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(
      candidate,
    )
  ) {
    fail(code);
  }
  return candidate;
}

function gitValue(source, names) {
  const values = names
    .filter((name) => Object.hasOwn(source ?? {}, name))
    .map((name) => source[name])
    .filter((value) => value !== null && value !== undefined && value !== "");
  if (values.length > 1 && !values.every((value) => value === values[0])) {
    fail("DEPLOYMENT_GIT_VALUES_DISAGREE");
  }
  return values[0] ?? null;
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]),
    );
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) return value;
  fail("CANONICAL_JSON_VALUE");
}

export function classifyDelta20RepositoryTransition(value) {
  const keys = [
    "authorized_evidence_paths",
    "changed_paths",
    "evidence_after_sha256",
    "evidence_before_sha256",
    "immutable_after_sha256",
    "immutable_before_sha256",
  ];
  requireExactKeys(value, keys, "DELTA20_REPOSITORY_TRANSITION_SHAPE");
  const exactEvidencePaths = [
    "testing/admin-v1-staging-runtime-evidence.json",
    "testing/readiness-coverage-matrix.json",
    "testing/public-launch-blocker-registry.json",
    "testing/static-test-safety-manifest.json",
  ];
  if (
    !exactArray(value.authorized_evidence_paths, exactEvidencePaths) ||
    !Array.isArray(value.changed_paths) ||
    new Set(value.changed_paths).size !== value.changed_paths.length ||
    value.changed_paths.some(
      (repositoryPath) =>
        typeof repositoryPath !== "string" ||
        !exactEvidencePaths.includes(repositoryPath),
    ) ||
    [
      value.evidence_after_sha256,
      value.evidence_before_sha256,
      value.immutable_after_sha256,
      value.immutable_before_sha256,
    ].some((digest) => !/^[a-f0-9]{64}$/u.test(digest ?? ""))
  ) {
    fail("DELTA20_REPOSITORY_TRANSITION_INPUT");
  }
  if (value.immutable_before_sha256 !== value.immutable_after_sha256) {
    fail("DELTA20_IMMUTABLE_IMPLEMENTATION_DRIFT");
  }
  if (value.changed_paths.length === 0) {
    if (value.evidence_before_sha256 !== value.evidence_after_sha256) {
      fail("DELTA20_EVIDENCE_IDENTITY_WITHOUT_PATH_TRANSITION");
    }
    return deepFreeze({
      disposition: "NO_DRIFT",
      preserve_cleanup_locators: true,
      preserve_journal: true,
    });
  }
  if (value.evidence_before_sha256 === value.evidence_after_sha256) {
    fail("DELTA20_EVIDENCE_PATH_WITHOUT_IDENTITY_TRANSITION");
  }
  return deepFreeze({
    disposition: "AUTHORIZED_EVIDENCE_PUBLICATION",
    preserve_cleanup_locators: true,
    preserve_journal: true,
  });
}

export function transitionDelta20PublicationLifecycle(value) {
  requireExactKeys(
    value,
    ["current_state", "event", "kind"],
    "DELTA20_PUBLICATION_TRANSITION_SHAPE",
  );
  if (
    !["QUALIFICATION", "RUNTIME"].includes(value.kind) ||
    typeof value.current_state !== "string" ||
    typeof value.event !== "string"
  ) {
    fail("DELTA20_PUBLICATION_TRANSITION_INPUT");
  }
  const transitions = new Map([
    [
      "PROJECTION_MUTABLE\0FREEZE_PROJECTION",
      "PROJECTION_FROZEN",
    ],
    [
      "PROJECTION_FROZEN\0PUBLISH_CLEANUP_PENDING",
      "CLEANUP_PENDING_PUBLISHED",
    ],
    [
      "CLEANUP_PENDING_PUBLISHED\0VERIFY_CLEANUP_PENDING",
      "CLEANUP_PENDING_VERIFIED",
    ],
    [
      "CLEANUP_PENDING_VERIFIED\0CLEAN_EXTERNAL_EFFECTS",
      "EXTERNAL_CLEANUP_COMPLETE",
    ],
    [
      "EXTERNAL_CLEANUP_COMPLETE\0PUBLISH_COMPLETE",
      "COMPLETE_PUBLISHED",
    ],
    [
      "COMPLETE_PUBLISHED\0VERIFY_COMPLETE",
      "COMPLETE_VERIFIED",
    ],
    [
      "COMPLETE_VERIFIED\0PERSIST_RETIREMENT_RECEIPT",
      "RETIREMENT_RECEIPT_PERSISTED",
    ],
    [
      "RETIREMENT_RECEIPT_PERSISTED\0RETIRE_DURABLE_STATE",
      "DURABLE_STATE_RETIRED",
    ],
  ]);
  const validationFailureStates = new Set([
    "CLEANUP_PENDING_PUBLISHED",
    "COMPLETE_PUBLISHED",
  ]);
  let nextState;
  let repairRequired = false;
  if (
    value.event === "PUBLICATION_VALIDATION_FAILED" &&
    validationFailureStates.has(value.current_state)
  ) {
    nextState = value.current_state;
    repairRequired = true;
  } else {
    nextState = transitions.get(
      `${value.current_state}\0${value.event}`,
    );
  }
  if (!nextState) fail("DELTA20_PUBLICATION_TRANSITION_ORDER");
  const retired = nextState === "DURABLE_STATE_RETIRED";
  return deepFreeze({
    cleanup_locators_retained: !retired,
    journal_retained: !retired,
    kind: value.kind,
    repair_required: repairRequired,
    state: nextState,
    teardown_allowed: retired,
  });
}

export function validateDelta20SensitiveStdinTransport(value) {
  const keys = [
    "argv_contains_secret",
    "body_byte_count",
    "body_file_created",
    "body_json_keys",
    "buffer_zeroed",
    "clipboard_contains_secret",
    "filename_contains_secret",
    "filesystem_body_path",
    "hash_contains_secret",
    "log_contains_secret",
    "operation",
    "stdin_byte_count",
    "stdin_json_shape_verified",
    "transport",
  ];
  requireExactKeys(value, keys, "DELTA20_SENSITIVE_STDIN_SHAPE");
  if (
    !["CREATE", "DELETE_RECONCILIATION"].includes(value.operation) ||
    !Array.isArray(value.body_json_keys) ||
    new Set(value.body_json_keys).size !== value.body_json_keys.length ||
    value.body_json_keys.some((key) => typeof key !== "string") ||
    !Number.isInteger(value.body_byte_count) ||
    !Number.isInteger(value.stdin_byte_count) ||
    value.body_byte_count < 0 ||
    value.stdin_byte_count < 0 ||
    value.body_byte_count > 64 * 1024 ||
    value.stdin_byte_count > 64 * 1024 ||
    value.argv_contains_secret !== false ||
    value.body_file_created !== false ||
    value.buffer_zeroed !== true ||
    value.clipboard_contains_secret !== false ||
    value.filename_contains_secret !== false ||
    value.filesystem_body_path !== null ||
    value.hash_contains_secret !== false ||
    value.log_contains_secret !== false ||
    value.stdin_json_shape_verified !== true
  ) {
    fail("DELTA20_SENSITIVE_STDIN_INPUT");
  }
  const createKeys = [
    "comment",
    "gitBranch",
    "key",
    "target",
    "type",
    "value",
  ];
  if (value.operation === "CREATE") {
    if (
      value.transport !== "STDIN" ||
      value.body_byte_count === 0 ||
      value.body_byte_count !== value.stdin_byte_count ||
      !exactArray(value.body_json_keys, createKeys)
    ) {
      fail("DELTA20_SENSITIVE_STDIN_CREATE");
    }
  } else if (
    value.transport !== "NO_BODY" ||
    value.body_byte_count !== 0 ||
    value.stdin_byte_count !== 0 ||
    value.body_json_keys.length !== 0
  ) {
    fail("DELTA20_SENSITIVE_STDIN_DELETE_RECONCILIATION");
  }
  return deepFreeze({
    bodyless: value.operation === "DELETE_RECONCILIATION",
    input: { ...value, body_json_keys: [...value.body_json_keys] },
    operation: value.operation,
    sanitized: true,
    stdin_only: value.operation === "CREATE",
  });
}

export function validateDelta20ProjectionCorpus(value) {
  requireExactKeys(
    value,
    [
      "entries",
      "expected_request_count",
      "journal_kind",
      "projection_complete",
      "raw_material_persisted",
    ],
    "DELTA20_PROJECTION_CORPUS_SHAPE",
  );
  const expectedOrdinals =
    value.journal_kind === "OFFICIAL"
      ? Array.from({ length: 20 }, (_unused, index) => index + 1)
      : value.journal_kind === "QUALIFICATION"
        ? [1, 2, 3, 4, 19, 20]
        : null;
  if (
    expectedOrdinals === null ||
    value.expected_request_count !== expectedOrdinals.length ||
    value.projection_complete !== true ||
    value.raw_material_persisted !== false ||
    !Array.isArray(value.entries) ||
    value.entries.length !== expectedOrdinals.length
  ) {
    fail("DELTA20_PROJECTION_CORPUS_INPUT");
  }
  for (const [index, entry] of value.entries.entries()) {
    requireExactKeys(
      entry,
      [
        "contract_ordinal",
        "projection_source",
        "sequence_ordinal",
        "validator_re_evaluable",
      ],
      "DELTA20_PROJECTION_CORPUS_ENTRY_SHAPE",
    );
    if (
      entry.sequence_ordinal !== index + 1 ||
      entry.contract_ordinal !== expectedOrdinals[index] ||
      entry.projection_source !== "SANITIZED_DURABLE_PROJECTION" ||
      entry.validator_re_evaluable !== true
    ) {
      fail("DELTA20_PROJECTION_CORPUS_ENTRY");
    }
  }
  return deepFreeze({
    journal_kind: value.journal_kind,
    projection_complete: true,
    re_evaluable_request_count: expectedOrdinals.length,
    validated_request_count: expectedOrdinals.length,
  });
}

export function createRuntimePlan() {
  return PLAN;
}

export function validatePredecessorRatification(value) {
  const expected = {
    phase_33na_passed: false,
    phase_33na_final_dependency_evidence_ratified: true,
    phase_33qa_unique_preview_trigger_validated: true,
    phase_33ra_residual_preview_cleanup_passed: true,
    phase_33sa_rolled_back_schema_incompatibility: true,
    phase_33ta_failed_cleanup_resolver_exhaustion: true,
    phase_33ua_residual_cleanup_passed: true,
    phase_33va_marker_mismatch_rolled_back: true,
    phase_34ba_phase_compiler_implemented: true,
    phase_p01_compiler_proof_passed: true,
    phase_34ea_bounded_inspection_contract_implemented: true,
    phase_compiler_generation_exception_reviewed: true,
    phase_compiler_policy_lane: "PASS_3_OF_3",
  };
  requireExactKeys(value, Object.keys(expected), "PREDECESSOR_SHAPE");
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) fail(`PREDECESSOR_${key.toUpperCase()}`);
  }
  return deepFreeze({
    ready: true,
    technical_facts_ratified: 12,
    phase_33na_passed: false,
    phase_compiler_policy_lane: "PASS_3_OF_3",
  });
}

export function validateRuntimeEnvironmentMetadata(value) {
  const keys = [
    "names",
    "optional_alias_name",
    "observations",
    "metadata_requests",
    "decrypt_true_requests",
    "environment_value_reads",
    "environment_pulls",
    "raw_values_persisted",
    "secret_hashes_persisted",
  ];
  requireExactKeys(value, keys, "RUNTIME_ENVIRONMENT_METADATA_SHAPE");
  if (!exactArray(value.names, PLAN.environment_names)) {
    fail("RUNTIME_ENVIRONMENT_NAMES");
  }
  if (
    value.optional_alias_name !== "SUPABASE_URL" ||
    !Array.isArray(value.observations) ||
    value.observations.length > 24 ||
    value.metadata_requests !== 2 ||
    value.decrypt_true_requests !== 0 ||
    value.environment_value_reads !== 0 ||
    value.environment_pulls !== 0 ||
    value.raw_values_persisted !== 0 ||
    value.secret_hashes_persisted !== 0
  ) {
    fail("RUNTIME_ENVIRONMENT_METADATA_BOUNDS");
  }
  const allowedNames = new Set([
    ...PLAN.environment_names,
    value.optional_alias_name,
  ]);
  const secureTypes = new Set(["SENSITIVE", "SECRET", "ENCRYPTED"]);
  for (const observation of value.observations) {
    requireExactKeys(
      observation,
      ["name", "target", "branch_scope", "type", "decrypted"],
      "RUNTIME_ENVIRONMENT_OBSERVATION_SHAPE",
    );
    if (
      !allowedNames.has(observation.name) ||
      observation.target !== "PREVIEW" ||
      !["GLOBAL", "EXACT", "OTHER"].includes(
        observation.branch_scope,
      ) ||
      typeof observation.type !== "string" ||
      typeof observation.decrypted !== "boolean"
    ) {
      fail("RUNTIME_ENVIRONMENT_OBSERVATION_VALUE");
    }
  }
  let duplicateObservations = 0;
  const effectiveRecord = (name, required) => {
    const applicable = value.observations.filter(
      (observation) =>
        observation.name === name &&
        ["GLOBAL", "EXACT"].includes(observation.branch_scope),
    );
    const exact = applicable.filter(
      (observation) => observation.branch_scope === "EXACT",
    );
    const selected = exact.length > 0 ? exact : applicable;
    const distinct = new Map();
    for (const observation of selected) {
      const signature = [
        observation.branch_scope,
        observation.type,
        String(observation.decrypted),
      ].join("\0");
      if (distinct.has(signature)) duplicateObservations += 1;
      else distinct.set(signature, observation);
    }
    if (distinct.size === 0) {
      if (required) fail("RUNTIME_ENVIRONMENT_REQUIRED_MISSING");
      return null;
    }
    if (distinct.size !== 1) fail("RUNTIME_ENVIRONMENT_CONFLICT");
    const [record] = distinct.values();
    if (!secureTypes.has(record.type) || record.decrypted !== false) {
      fail("RUNTIME_ENVIRONMENT_NOT_NONREADABLE");
    }
    return record;
  };
  const effective = PLAN.environment_names.map((name) =>
    effectiveRecord(name, true),
  );
  const optionalAlias = effectiveRecord(value.optional_alias_name, false);
  return deepFreeze({
    ready: true,
    names_present: effective.length,
    sensitive_nonreadable_names: effective.length,
    optional_alias_state: optionalAlias === null ? "ABSENT" : "EFFECTIVE",
    exact_duplicate_observations: duplicateObservations,
    environment_value_reads: 0,
    decrypt_true_requests: 0,
    environment_pulls: 0,
    raw_values_persisted: 0,
    secret_hashes_persisted: 0,
  });
}

const DELTA13_ENVIRONMENT_NAMES = Object.freeze([
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
]);
const DELTA13_BRANCH =
  "aifinder-phase-34ia-evidence-publication-runtime-validation-v3";
const DELTA14_REGISTRATION_VERCEL_JSON_SHA256 =
  "2a4aac1c038892c42f499100077a443bfc17b50187f5eb020dfd066f96a77f7c";
const DELTA14_MARKER_SHA256 =
  "f3ad712e4b322a2ed57d5f7bd1e53eac02d6c3715e77a7f76b0d490ca28d358e";
const DELTA14_AUTHORIZED_REPOSITORY_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-core.mjs",
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/admin-v1-staging-runtime-evidence.schema.json",
  "testing/admin-v1-staging-runtime-evidence.json",
  "testing/admin-v1-staging-runtime-evidence.test.mjs",
  "testing/admin-v1-launch-scope.test.mjs",
  "testing/admin-v1-staging-readiness-source-policy.test.mjs",
  "testing/admin-v1-staging-readiness-evidence.test.mjs",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs",
  "testing/readiness-coverage-matrix.json",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.json",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
]);

export function classifyDelta13BranchEnvironmentSnapshot(value) {
  requireExactKeys(
    value,
    [
      "branch",
      "names",
      "observations",
      "metadata_requests",
      "decrypt_true_requests",
      "environment_value_reads",
      "raw_values_persisted",
      "secret_hashes_persisted",
    ],
    "DELTA13_ENVIRONMENT_SNAPSHOT_SHAPE",
  );
  if (
    value.branch !== DELTA13_BRANCH ||
    !exactArray(value.names, DELTA13_ENVIRONMENT_NAMES) ||
    !Array.isArray(value.observations) ||
    value.observations.length > 64 ||
    value.metadata_requests !== 2 ||
    value.decrypt_true_requests !== 0 ||
    value.environment_value_reads !== 0 ||
    value.raw_values_persisted !== 0 ||
    value.secret_hashes_persisted !== 0
  ) {
    fail("DELTA13_ENVIRONMENT_SNAPSHOT_BOUNDS");
  }
  const records = {};
  for (const name of DELTA13_ENVIRONMENT_NAMES) {
    const observations = value.observations.filter(
      (observation) => observation?.name === name,
    );
    for (const observation of observations) {
      requireExactKeys(
        observation,
        [
          "name",
          "target",
          "branch_scope",
          "type",
          "decrypted",
          "phase_owned_record_id",
          "comment_class",
        ],
        "DELTA13_ENVIRONMENT_OBSERVATION_SHAPE",
      );
      if (
        observation.target !== "PREVIEW" ||
        !["GLOBAL", "EXACT", "OTHER"].includes(
          observation.branch_scope,
        ) ||
        typeof observation.type !== "string" ||
        observation.type.length === 0 ||
        observation.decrypted !== false
      ) {
        fail("DELTA13_ENVIRONMENT_OBSERVATION_VALUE");
      }
      if (observation.branch_scope === "EXACT") {
        const expectedComment =
          name === "ADMIN_PASSWORD"
            ? "DELTA13_ADMIN_PASSWORD"
            : "DELTA13_ADMIN_SESSION_SECRET";
        if (
          typeof observation.phase_owned_record_id !== "string" ||
          !/^[A-Za-z0-9_]{1,256}$/u.test(
            observation.phase_owned_record_id,
          ) ||
          observation.comment_class !== expectedComment ||
          observation.type !== "SENSITIVE"
        ) {
          fail("DELTA13_ENVIRONMENT_EXACT_IDENTITY");
        }
      } else if (
        observation.phase_owned_record_id !== null ||
        observation.comment_class !== "UNRELATED"
      ) {
        fail("DELTA13_ENVIRONMENT_UNRELATED_IDENTITY");
      }
    }
    const global = observations.filter(
      (observation) => observation.branch_scope === "GLOBAL",
    );
    const exact = observations.filter(
      (observation) => observation.branch_scope === "EXACT",
    );
    const other = observations.filter(
      (observation) => observation.branch_scope === "OTHER",
    );
    if (exact.length > 1) fail("DELTA13_ENVIRONMENT_EXACT_DUPLICATE");
    const categories = (entries) =>
      entries
        .map(
          (entry) =>
            `${entry.target}:${entry.type}:${String(entry.decrypted)}`,
        )
        .sort();
    records[name] = {
      global_preview_record_count: global.length,
      exact_new_branch_record_count: exact.length,
      other_branch_record_count: other.length,
      global_preview_categories: categories(global),
      other_branch_categories: categories(other),
      exact_branch_type: exact[0]?.type ?? null,
      exact_branch_decrypted: exact[0]?.decrypted ?? null,
      phase_owned_record_id:
        exact[0]?.phase_owned_record_id ?? null,
    };
  }
  return deepFreeze({
    branch: DELTA13_BRANCH,
    names: [...DELTA13_ENVIRONMENT_NAMES],
    metadata_requests: 2,
    decrypt_true_requests: 0,
    environment_value_reads: 0,
    raw_values_persisted: 0,
    secret_hashes_persisted: 0,
    records,
  });
}

export function validateDelta13BranchEnvironmentTransition(value) {
  requireExactKeys(
    value,
    ["before", "after"],
    "DELTA13_ENVIRONMENT_TRANSITION_SHAPE",
  );
  const snapshotKeys = [
    "branch",
    "names",
    "metadata_requests",
    "decrypt_true_requests",
    "environment_value_reads",
    "raw_values_persisted",
    "secret_hashes_persisted",
    "records",
  ];
  requireExactKeys(
    value.before,
    snapshotKeys,
    "DELTA13_ENVIRONMENT_BEFORE_SHAPE",
  );
  requireExactKeys(
    value.after,
    snapshotKeys,
    "DELTA13_ENVIRONMENT_AFTER_SHAPE",
  );
  for (const snapshot of [value.before, value.after]) {
    if (
      snapshot.branch !== DELTA13_BRANCH ||
      !exactArray(snapshot.names, DELTA13_ENVIRONMENT_NAMES)
    ) {
      fail("DELTA13_ENVIRONMENT_TRANSITION_IDENTITY");
    }
    requireExactKeys(
      snapshot.records,
      DELTA13_ENVIRONMENT_NAMES,
      "DELTA13_ENVIRONMENT_TRANSITION_RECORDS",
    );
  }
  const recordIds = {};
  for (const name of DELTA13_ENVIRONMENT_NAMES) {
    const before = value.before.records[name];
    const after = value.after.records[name];
    if (
      before.exact_new_branch_record_count !== 0 ||
      before.phase_owned_record_id !== null ||
      after.exact_new_branch_record_count !== 1 ||
      after.exact_branch_type !== "SENSITIVE" ||
      after.exact_branch_decrypted !== false ||
      typeof after.phase_owned_record_id !== "string" ||
      before.global_preview_record_count !==
        after.global_preview_record_count ||
      before.other_branch_record_count !==
        after.other_branch_record_count ||
      canonicalJson(before.global_preview_categories) !==
        canonicalJson(after.global_preview_categories) ||
      canonicalJson(before.other_branch_categories) !==
        canonicalJson(after.other_branch_categories)
    ) {
      fail("DELTA13_ENVIRONMENT_TRANSITION");
    }
    recordIds[name] = after.phase_owned_record_id;
  }
  if (recordIds.ADMIN_PASSWORD === recordIds.ADMIN_SESSION_SECRET) {
    fail("DELTA13_ENVIRONMENT_RECORD_ID_COLLISION");
  }
  return deepFreeze({
    ready: true,
    exact_branch_records: 2,
    global_preview_metadata_unchanged: true,
    other_branch_metadata_unchanged: true,
    record_ids: recordIds,
    environment_value_reads: 0,
    decrypt_true_requests: 0,
  });
}

export function validateDelta14RegistrationCommit(value) {
  requireExactKeys(
    value,
    [
      "baseline",
      "branch",
      "candidate_path_changes",
      "changed_paths",
      "commit_sha",
      "main_index_vercel_json_present",
      "marker_present",
      "parent_sha",
      "subject",
      "vercel_json_bytes",
      "vercel_json_lf",
      "vercel_json_mode",
      "vercel_json_sha256",
      "working_tree_vercel_json_present",
    ],
    "DELTA14_REGISTRATION_COMMIT_SHAPE",
  );
  if (
    value.baseline !== BASELINE ||
    value.parent_sha !== BASELINE ||
    value.branch !== DELTA13_BRANCH ||
    value.subject !==
      "Register AiFinder evidence publication runtime branch without deployment" ||
    !/^[a-f0-9]{40}$/u.test(value.commit_sha) ||
    value.commit_sha === BASELINE ||
    !exactArray(value.changed_paths, ["vercel.json"]) ||
    value.candidate_path_changes !== 0 ||
    value.marker_present !== false ||
    value.vercel_json_sha256 !==
      DELTA14_REGISTRATION_VERCEL_JSON_SHA256 ||
    value.vercel_json_bytes !== 184 ||
    value.vercel_json_lf !== 8 ||
    value.vercel_json_mode !== "100644" ||
    value.main_index_vercel_json_present !== false ||
    value.working_tree_vercel_json_present !== false
  ) {
    fail("DELTA14_REGISTRATION_COMMIT_IDENTITY");
  }
  return deepFreeze({
    commit_sha: value.commit_sha,
    parent_sha: BASELINE,
    vercel_json_only: true,
  });
}

export function validateDelta14ActivationCommit(value) {
  requireExactKeys(
    value,
    [
      "activation_commit_sha",
      "authorized_candidate_manifest_sha256",
      "authorized_candidate_path_count",
      "branch",
      "main_index_vercel_json_present",
      "marker_sha256",
      "parent_sha",
      "registration_commit_sha",
      "subject",
      "unauthorized_path_changes",
      "vercel_json_present",
      "working_tree_vercel_json_present",
    ],
    "DELTA14_ACTIVATION_COMMIT_SHAPE",
  );
  if (
    value.branch !== DELTA13_BRANCH ||
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.activation_commit_sha === value.registration_commit_sha ||
    value.parent_sha !== value.registration_commit_sha ||
    value.subject !==
      "Trigger Admin V1 verified evidence publication preview v18" ||
    value.vercel_json_present !== false ||
    value.marker_sha256 !== DELTA14_MARKER_SHA256 ||
    value.authorized_candidate_path_count !==
      DELTA14_AUTHORIZED_REPOSITORY_PATHS.length ||
    !/^[a-f0-9]{64}$/u.test(
      value.authorized_candidate_manifest_sha256,
    ) ||
    value.unauthorized_path_changes !== 0 ||
    value.main_index_vercel_json_present !== false ||
    value.working_tree_vercel_json_present !== false
  ) {
    fail("DELTA14_ACTIVATION_COMMIT_IDENTITY");
  }
  return deepFreeze({
    activation_commit_sha: value.activation_commit_sha,
    registration_commit_sha: value.registration_commit_sha,
    vercel_json_absent: true,
  });
}

export function authorizeDelta14BranchOperation(value) {
  requireExactKeys(
    value,
    [
      "activation_candidate_exact",
      "activation_commit_sha",
      "activation_marker_sha256",
      "activation_parent_sha",
      "activation_push_type",
      "activation_vercel_json_present",
      "admin_password_exact_branch_records",
      "admin_session_secret_exact_branch_records",
      "final_staged_paths",
      "main_index_vercel_json_present",
      "operation",
      "registration_commit_sha",
      "registration_unexpected_deployments",
      "registration_zero_deployment_proven",
      "remote_branch_sha",
      "working_tree_vercel_json_present",
    ],
    "DELTA14_BRANCH_OPERATION_SHAPE",
  );
  if (
    ![
      "CREATE_ENVIRONMENT_RECORD",
      "PUSH_ACTIVATION",
      "FINAL_MAIN_STAGE",
    ].includes(value.operation) ||
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    value.remote_branch_sha !== value.registration_commit_sha ||
    value.registration_zero_deployment_proven !== true ||
    value.registration_unexpected_deployments !== 0 ||
    value.main_index_vercel_json_present !== false ||
    value.working_tree_vercel_json_present !== false
  ) {
    fail("DELTA14_BRANCH_OPERATION_REGISTRATION_GATE");
  }
  if (value.operation === "CREATE_ENVIRONMENT_RECORD") {
    return deepFreeze({
      authorized: true,
      operation: value.operation,
    });
  }
  if (
    value.admin_password_exact_branch_records !== 1 ||
    value.admin_session_secret_exact_branch_records !== 1 ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.activation_parent_sha !== value.registration_commit_sha ||
    value.activation_vercel_json_present !== false ||
    value.activation_marker_sha256 !== DELTA14_MARKER_SHA256 ||
    value.activation_candidate_exact !== true ||
    value.activation_push_type !== "ORDINARY_FAST_FORWARD"
  ) {
    fail("DELTA14_BRANCH_OPERATION_ACTIVATION_GATE");
  }
  if (value.operation === "PUSH_ACTIVATION") {
    return deepFreeze({
      authorized: true,
      operation: value.operation,
      push_type: value.activation_push_type,
    });
  }
  if (
    !exactArray(
      value.final_staged_paths,
      DELTA14_AUTHORIZED_REPOSITORY_PATHS,
    )
  ) {
    fail("DELTA14_BRANCH_OPERATION_FINAL_STAGE");
  }
  return deepFreeze({
    authorized: true,
    authorized_path_count: DELTA14_AUTHORIZED_REPOSITORY_PATHS.length,
    operation: value.operation,
  });
}

export function validateProtectedLocalRuntimeEnvironment(value) {
  const names = [
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  requireExactKeys(
    value,
    [
      "names",
      "present",
      "nonempty",
      "url_structurally_safe",
      "staging_origin_matches",
      "anon_key_publishable_capable",
      "service_role_server_secret_capable",
      "other_local_env_names_read",
      "values_printed",
      "values_logged",
      "values_hashed",
      "values_persisted",
      "exact_lengths_reported",
      "substrings_or_fingerprints_reported",
    ],
    "PROTECTED_LOCAL_ENVIRONMENT_SHAPE",
  );
  if (!exactArray(value.names, names)) {
    fail("PROTECTED_LOCAL_ENVIRONMENT_NAMES");
  }
  requireExactKeys(value.present, names, "PROTECTED_LOCAL_PRESENT_SHAPE");
  requireExactKeys(value.nonempty, names, "PROTECTED_LOCAL_NONEMPTY_SHAPE");
  for (const name of names) {
    requireBoolean(value.present[name], true, "PROTECTED_LOCAL_PRESENT");
    requireBoolean(value.nonempty[name], true, "PROTECTED_LOCAL_NONEMPTY");
  }
  for (const name of [
    "url_structurally_safe",
    "staging_origin_matches",
    "anon_key_publishable_capable",
    "service_role_server_secret_capable",
  ]) {
    requireBoolean(value[name], true, `PROTECTED_LOCAL_${name.toUpperCase()}`);
  }
  for (const name of [
    "other_local_env_names_read",
    "values_printed",
    "values_logged",
    "values_hashed",
    "values_persisted",
    "exact_lengths_reported",
    "substrings_or_fingerprints_reported",
  ]) {
    if (value[name] !== 0) fail(`PROTECTED_LOCAL_${name.toUpperCase()}`);
  }
  return deepFreeze({
    ready: true,
    names_present: 4,
    staging_origin_matches: true,
    other_local_env_names_read: 0,
    secret_outputs: 0,
  });
}

export function authorizeFixtureInsertion(value) {
  requireExactKeys(
    value,
    [
      "runtime_sessions",
      "application_requests",
      "last_completed_application_request",
      "fixture_writes",
      "cleanup_only",
    ],
    "FIXTURE_INSERTION_AUTHORITY_SHAPE",
  );
  if (
    value.runtime_sessions !== 1 ||
    value.application_requests !== 5 ||
    value.last_completed_application_request !== 5 ||
    value.fixture_writes !== 0 ||
    value.cleanup_only !== false
  ) {
    fail("FIXTURE_INSERTION_AUTHORITY");
  }
  return deepFreeze({ authorized_after_request: 5, fixture_writes: 0 });
}

export function classifyRuntimeFailureMode(value) {
  requireExactKeys(
    value,
    ["fixture_writes", "synthetic_effects"],
    "RUNTIME_FAILURE_MODE_SHAPE",
  );
  if (
    !Number.isInteger(value.fixture_writes) ||
    value.fixture_writes < 0 ||
    !Number.isInteger(value.synthetic_effects) ||
    value.synthetic_effects < 0
  ) {
    fail("RUNTIME_FAILURE_MODE_VALUE");
  }
  return value.fixture_writes === 0 && value.synthetic_effects === 0
    ? "NO_SYNTHETIC_EFFECTS"
    : "CLEANUP_ONLY";
}

export function classifyPreRuntimeReplacementDisposition(value) {
  requireExactKeys(
    value,
    [
      "replacement_invocation",
      "maximum_replacement_invocations",
      "runtime_sessions",
      "application_requests",
      "fixture_writes",
      "data_writes",
    ],
    "PRE_RUNTIME_REPLACEMENT_SHAPE",
  );
  for (const name of [
    "replacement_invocation",
    "maximum_replacement_invocations",
    "runtime_sessions",
    "application_requests",
    "fixture_writes",
    "data_writes",
  ]) {
    if (!Number.isInteger(value[name]) || value[name] < 0) {
      fail("PRE_RUNTIME_REPLACEMENT_VALUE");
    }
  }
  if (
    value.maximum_replacement_invocations !== 5 ||
    value.replacement_invocation < 1 ||
    value.replacement_invocation >
      value.maximum_replacement_invocations
  ) {
    fail("PRE_RUNTIME_REPLACEMENT_BOUND");
  }
  if (
    value.runtime_sessions > 0 ||
    value.application_requests > 0 ||
    value.fixture_writes > 0 ||
    value.data_writes > 0
  ) {
    return "RUNTIME_AUTHORITY_CONSUMED";
  }
  return value.replacement_invocation <
    value.maximum_replacement_invocations
    ? "RETRY_WITH_FRESH_ROOT"
    : "PRE_RUNTIME_REPLACEMENTS_EXHAUSTED";
}

export function validateHeaderQualificationAttempt(value) {
  requireExactKeys(
    value,
    [
      "attempt",
      "maximum_attempts",
      "method",
      "path",
      "credentials",
      "cookies",
      "request_body",
      "database_requests",
      "data_writes",
      "deployment_identity_verified",
      "security_header_projection",
    ],
    "HEADER_QUALIFICATION_SHAPE",
  );
  if (
    !Number.isInteger(value.attempt) ||
    value.attempt < 1 ||
    value.attempt > 4 ||
    value.maximum_attempts !== 4 ||
    value.method !== "GET" ||
    value.path !== "/api/admin/tools" ||
    value.credentials !== false ||
    value.cookies !== false ||
    value.request_body !== false ||
    value.database_requests !== 0 ||
    value.data_writes !== 0 ||
    value.deployment_identity_verified !== true
  ) {
    fail("HEADER_QUALIFICATION_AUTHORITY");
  }
  const projection = value.security_header_projection;
  requireExactKeys(
    projection,
    SECURITY_HEADER_PROJECTION_KEYS,
    "HEADER_QUALIFICATION_PROJECTION_SHAPE",
  );
  const dispositions = new Set([
    "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
    "HARNESS_CLASSIFIER_DEFECT",
    "SEMANTIC_EQUIVALENCE_MISCLASSIFIED",
    "APPLICATION_RESPONSE_NOT_REACHED",
    "ROUTE_HEADER_DELIVERY_DEFECT",
    "PROXY_HEADER_DELIVERY_DEFECT",
    "HSTS_DELIVERY_DEFECT",
    "UNSAFE_EXTERNAL_AMBIGUITY",
  ]);
  if (
    !SECURITY_HEADER_STATUS_CLASSES.includes(projection.status_class) ||
    !["EXACT_JSON_OBJECT", "OTHER"].includes(
      projection.application_body_shape,
    ) ||
    !["ADMIN_TOOLS_UNAUTHENTICATED", "OTHER"].includes(
      projection.application_response_identity,
    ) ||
    ![
      "ABSENT",
      "LT_ONE_YEAR",
      "ONE_TO_TWO_YEARS",
      "AT_LEAST_TWO_YEARS",
    ].includes(projection.hsts_max_age_class) ||
    !dispositions.has(projection.disposition)
  ) {
    fail("HEADER_QUALIFICATION_PROJECTION_CLASSIFICATION");
  }
  for (const key of SECURITY_HEADER_PROJECTION_KEYS) {
    if (
      ![
        "status_class",
        "application_body_shape",
        "application_response_identity",
        "hsts_max_age_class",
        "disposition",
      ].includes(key) &&
      typeof projection[key] !== "boolean"
    ) {
      fail("HEADER_QUALIFICATION_PROJECTION_BOOLEAN");
    }
  }
  if (projection.disposition === "PASS_EXACT_APPLICATION_HEADER_CONTRACT") {
    const requiredTrue = SECURITY_HEADER_PROJECTION_KEYS.filter(
      (key) =>
        ![
          "status_class",
          "application_body_shape",
          "application_response_identity",
          "hsts_max_age_class",
          "hsts_include_subdomains",
          "hsts_preload",
          "x_robots_tag_noindex_advisory",
          "disposition",
        ].includes(key),
    );
    if (
      projection.status_class !== "EXPECTED_401" ||
      projection.application_body_shape !== "EXACT_JSON_OBJECT" ||
      projection.application_response_identity !==
        "ADMIN_TOOLS_UNAUTHENTICATED" ||
      !requiredTrue.every((key) => projection[key] === true) ||
      !["ONE_TO_TWO_YEARS", "AT_LEAST_TWO_YEARS"].includes(
        projection.hsts_max_age_class,
      )
    ) {
      fail("HEADER_QUALIFICATION_PASS_INCONSISTENT");
    }
  }
  return deepFreeze({
    attempt: value.attempt,
    disposition: projection.disposition,
    projection: { ...projection },
  });
}

export function deriveDelta11HeaderQualifiedTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "passing_preview_id",
    "temporary_branch",
    "passing_commit_sha",
    "baseline",
    "marker_sha256",
    "header_contract_version",
    "complete_authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA11_HEADER_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    temporary_branch:
      "aifinder-phase-34ia-security-header-runtime-validation",
    baseline: BASELINE,
    marker_sha256:
      "14422d8aa69015a577e93a273d405c42bcffd965e694c55ab1aa501f433ac353",
    header_contract_version: "DELTA11_SECURITY_HEADER_V1",
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA11_HEADER_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id) ||
    !/^[a-f0-9]{40}$/u.test(value.passing_commit_sha)
  ) {
    fail("DELTA11_HEADER_TARGET_PREVIEW_IDENTITY");
  }
  for (const name of keys.slice(8)) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA11_HEADER_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA11_HEADER_QUALIFIED_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta11HeaderQualifiedAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA11_HEADER_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA11_HEADER_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_HEADER_QUALIFIED_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA11_HEADER_AUTHORIZATION");
  }
  return value.target_sha256;
}

export function deriveDelta12ProtectedAccessTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "passing_preview_id",
    "temporary_branch",
    "passing_commit",
    "baseline",
    "access_mode",
    "credential_lifecycle_contract",
    "header_contract_version",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA12_PROTECTED_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    temporary_branch:
      "aifinder-phase-34ia-security-header-runtime-validation",
    baseline: BASELINE,
    header_contract_version: "DELTA11_SECURITY_HEADER_V1",
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA12_PROTECTED_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id) ||
    !/^[a-f0-9]{40}$/u.test(value.passing_commit) ||
    !["SELF_PROJECT_OIDC", "TEMPORARY_AUTOMATION_BYPASS"].includes(
      value.access_mode,
    ) ||
    ![
      "DELTA12_OIDC_EPHEMERAL_V1",
      "DELTA12_TEMPORARY_AUTOMATION_BYPASS_V1",
    ].includes(value.credential_lifecycle_contract)
  ) {
    fail("DELTA12_PROTECTED_TARGET_IDENTITY");
  }
  for (const name of keys.slice(9)) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA12_PROTECTED_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA12_PROTECTED_ACCESS_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta12ProtectedAccessAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA12_PROTECTED_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA12_PROTECTED_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_PROTECTED_ACCESS_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA12_PROTECTED_AUTHORIZATION");
  }
  return value.target_sha256;
}

export function deriveDelta13AuthQualifiedTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "passing_preview_id",
    "new_branch",
    "passing_commit",
    "baseline",
    "marker_sha256",
    "admin_password_env_record_id",
    "admin_session_secret_env_record_id",
    "access_mode",
    "auth_qualification_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA13_AUTH_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    new_branch: DELTA13_BRANCH,
    baseline: BASELINE,
    marker_sha256: DELTA14_MARKER_SHA256,
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA13_AUTH_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id) ||
    !/^[a-f0-9]{40}$/u.test(value.passing_commit) ||
    !/^[A-Za-z0-9_]{1,256}$/u.test(
      value.admin_password_env_record_id,
    ) ||
    !/^[A-Za-z0-9_]{1,256}$/u.test(
      value.admin_session_secret_env_record_id,
    ) ||
    value.admin_password_env_record_id ===
      value.admin_session_secret_env_record_id ||
    !["SELF_PROJECT_OIDC", "TEMPORARY_AUTOMATION_BYPASS"].includes(
      value.access_mode,
    )
  ) {
    fail("DELTA13_AUTH_TARGET_IDENTITY");
  }
  for (const name of keys.slice(10)) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA13_AUTH_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA13_AUTH_QUALIFIED_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta13AuthQualifiedAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA13_AUTH_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA13_AUTH_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_AUTH_QUALIFIED_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA13_AUTH_AUTHORIZATION");
  }
  return value.target_sha256;
}

export function deriveDelta14BranchRegisteredAuthQualifiedTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "registration_commit_sha",
    "registration_vercel_json_sha256",
    "registration_zero_deployment_evidence_sha256",
    "activation_commit_sha",
    "passing_preview_id",
    "branch",
    "baseline",
    "marker_sha256",
    "admin_password_env_record_id",
    "admin_session_secret_env_record_id",
    "access_mode",
    "auth_qualification_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA14_AUTH_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    registration_vercel_json_sha256:
      DELTA14_REGISTRATION_VERCEL_JSON_SHA256,
    branch: DELTA13_BRANCH,
    baseline: BASELINE,
    marker_sha256: DELTA14_MARKER_SHA256,
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA14_AUTH_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id) ||
    !/^[A-Za-z0-9_]{1,256}$/u.test(
      value.admin_password_env_record_id,
    ) ||
    !/^[A-Za-z0-9_]{1,256}$/u.test(
      value.admin_session_secret_env_record_id,
    ) ||
    value.admin_password_env_record_id ===
      value.admin_session_secret_env_record_id ||
    !["SELF_PROJECT_OIDC", "TEMPORARY_AUTOMATION_BYPASS"].includes(
      value.access_mode,
    )
  ) {
    fail("DELTA14_AUTH_TARGET_IDENTITY");
  }
  for (const name of [
    "registration_zero_deployment_evidence_sha256",
    "auth_qualification_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ]) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA14_AUTH_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA14_BRANCH_REGISTERED_AUTH_QUALIFIED_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta14BranchRegisteredAuthQualifiedAuthorization(
  value,
) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA14_AUTH_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA14_AUTH_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_BRANCH_REGISTERED_AUTH_QUALIFIED_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA14_AUTH_AUTHORIZATION");
  }
  return value.target_sha256;
}

export function deriveDelta15FixtureQualifiedFinalTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "registration_commit_sha",
    "registration_vercel_json_sha256",
    "registration_zero_deployment_evidence_sha256",
    "activation_commit_sha",
    "passing_preview_id",
    "branch",
    "baseline",
    "marker_sha256",
    "auth_fixture_qualification_evidence_sha256",
    "environment_override_cleanup_evidence_sha256",
    "branch_cleanup_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA15_FIXTURE_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    registration_vercel_json_sha256:
      DELTA14_REGISTRATION_VERCEL_JSON_SHA256,
    branch: DELTA13_BRANCH,
    baseline: BASELINE,
    marker_sha256: DELTA14_MARKER_SHA256,
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA15_FIXTURE_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id)
  ) {
    fail("DELTA15_FIXTURE_TARGET_IDENTITY");
  }
  for (const name of [
    "registration_zero_deployment_evidence_sha256",
    "auth_fixture_qualification_evidence_sha256",
    "environment_override_cleanup_evidence_sha256",
    "branch_cleanup_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ]) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA15_FIXTURE_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA15_FIXTURE_QUALIFIED_FINAL_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta15FixtureQualifiedFinalAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA15_FIXTURE_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA15_FIXTURE_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_FIXTURE_QUALIFIED_FINAL_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA15_FIXTURE_AUTHORIZATION");
  }
  return value.target_sha256;
}

export function validateDelta16ARouteQualificationEvidence(value) {
  const keys = [
    "application_requests",
    "audit_rows_created",
    "audit_rows_remaining",
    "canonical_relationship",
    "exact_fixture_ids_bound",
    "exact_fixture_rows_created",
    "exact_fixture_rows_remaining",
    "fixture_binding",
    "input_and_stored_hashes_differ",
    "logo_objects_created",
    "request8_has_terminal_slash",
    "request8_input_sha256",
    "request8_is_invalid_tld",
    "request9_expected_has_terminal_slash",
    "request9_expected_stored_sha256",
    "request9_positive_tool_id",
    "request9_unique_match_count",
    "route_mutations",
    "storage_requests",
    "tool_rows_created",
    "tool_rows_remaining",
    "unrelated_rows_deleted",
    "unrelated_rows_modified",
  ];
  requireExactKeys(
    value,
    keys,
    "DELTA16A_ROUTE_QUALIFICATION_EVIDENCE_SHAPE",
  );
  if (
    value.application_requests !== 9 ||
    !Number.isInteger(value.audit_rows_created) ||
    value.audit_rows_created < 0 ||
    value.audit_rows_created > 1 ||
    value.audit_rows_remaining !== 0 ||
    value.canonical_relationship !== "APPLICATION_URL_TOSTRING_ROOT" ||
    value.exact_fixture_ids_bound !== 3 ||
    value.exact_fixture_rows_created !== 3 ||
    value.exact_fixture_rows_remaining !== 0 ||
    value.fixture_binding !== "3_OF_3_PENDING" ||
    value.input_and_stored_hashes_differ !== true ||
    value.logo_objects_created !== 0 ||
    value.request8_has_terminal_slash !== false ||
    value.request8_is_invalid_tld !== true ||
    value.request9_expected_has_terminal_slash !== true ||
    value.request9_positive_tool_id !== true ||
    value.request9_unique_match_count !== 1 ||
    value.route_mutations !== 1 ||
    value.storage_requests !== 0 ||
    value.tool_rows_created !== 1 ||
    value.tool_rows_remaining !== 0 ||
    value.unrelated_rows_deleted !== 0 ||
    value.unrelated_rows_modified !== 0 ||
    !/^[a-f0-9]{64}$/u.test(value.request8_input_sha256) ||
    !/^[a-f0-9]{64}$/u.test(
      value.request9_expected_stored_sha256,
    ) ||
    value.request8_input_sha256 ===
      value.request9_expected_stored_sha256
  ) {
    fail("DELTA16A_ROUTE_QUALIFICATION_EVIDENCE");
  }
  return deepFreeze({ ...value });
}

export function validateDelta16AQualificationCompletion(value) {
  requireExactKeys(
    value,
    [
      "direct_requests",
      "qualification_cycles",
      "qualification_requests",
    ],
    "DELTA16A_QUALIFICATION_COMPLETION_SHAPE",
  );
  if (
    !Number.isInteger(value.qualification_cycles) ||
    value.qualification_cycles < 1 ||
    value.qualification_cycles > 2 ||
    (value.qualification_cycles === 1
      ? value.qualification_requests !== 9
      : value.qualification_requests < 10 ||
        value.qualification_requests > 18) ||
    !Number.isInteger(value.direct_requests) ||
    value.direct_requests < 7 ||
    value.direct_requests > 28
  ) {
    fail("DELTA16A_QUALIFICATION_COMPLETION");
  }
  return deepFreeze({ ...value });
}

export function deriveDelta16AStoredCanonicalRouteDiscoveryQualifiedFinalTarget(
  value,
) {
  const keys = [
    "team_id",
    "project_id",
    "baseline",
    "registration_commit_sha",
    "activation_commit_sha",
    "passing_preview_id",
    "branch",
    "marker_sha256",
    "request8_lexical_identity_sha256",
    "request9_stored_canonical_identity_sha256",
    "canonical_relationship",
    "qualification_evidence_sha256",
    "qualification_cleanup_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA16A_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    baseline: BASELINE,
    branch: DELTA13_BRANCH,
    marker_sha256: DELTA14_MARKER_SHA256,
    canonical_relationship: "APPLICATION_URL_TOSTRING_ROOT",
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) {
      fail(`DELTA16A_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id)
  ) {
    fail("DELTA16A_TARGET_IDENTITY");
  }
  for (const name of [
    "request8_lexical_identity_sha256",
    "request9_stored_canonical_identity_sha256",
    "qualification_evidence_sha256",
    "qualification_cleanup_evidence_sha256",
    "authorized_path_manifest_sha256",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
  ]) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA16A_TARGET_${name.toUpperCase()}`);
    }
  }
  if (
    value.request8_lexical_identity_sha256 ===
    value.request9_stored_canonical_identity_sha256
  ) {
    fail("DELTA16A_TARGET_DUAL_IDENTITY");
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA16A_APPLICATION_STORED_CANONICAL_ROUTE_DISCOVERY_QUALIFIED_FINAL_RUNTIME_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta16AStoredCanonicalRouteDiscoveryQualifiedAuthorization(
  value,
) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA16A_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA16A_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_STORED_CANONICAL_ROUTE_DISCOVERY_QUALIFIED_FINAL_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA16A_AUTHORIZATION");
  }
  return value.target_sha256;
}

const DELTA17_PERSISTED_STATE_IDENTITY_CLASSES = Object.freeze([
  "REQUEST_LEXICAL",
  "APPLICATION_VALIDATED_CANONICAL",
  "DIRECT_FIXTURE_RAW",
  "RPC_PERSISTED_SOURCE_BOUND",
  "STATUS_TRANSITION",
  "RUNTIME_PROJECTION_REQUIRED",
]);

const DELTA17_SOURCE_BINDINGS = Object.freeze({
  approval_rpc_logo_url: "COPY_SUBMISSION_LOGO_URL",
  approval_rpc_submission_status: "SET_APPROVED",
  approval_rpc_tool_status: "INSERT_APPROVED",
  approval_rpc_website: "COPY_SUBMISSION_WEBSITE",
  submission_logo_url: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
  submission_website: "VALIDATE_HTTPS_URL_TO_STRING",
  tool_logo_url: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
  tool_website: "VALIDATE_HTTPS_URL_TO_STRING",
});

const DELTA17_BRANCH =
  "aifinder-phase-34ia-poststate-runtime-validation";
const DELTA17_MARKER_SHA256 =
  "e3cf39bdf96075f0ecb8b8ffba3d176613dab93b4a1f368c8c09a5b27ee2a957";

function delta17Sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function delta17CanonicalSyntheticUrl(value, code) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    value.endsWith("/") ||
    !value.startsWith("https://")
  ) {
    fail(code);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(code);
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    !parsed.hostname.endsWith(".invalid") ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    fail(code);
  }
  const canonical = parsed.toString();
  if (canonical === value || canonical !== `${value}/`) fail(code);
  return canonical;
}

function delta17DirectFixtureUrl(value, code) {
  const canonical = delta17CanonicalSyntheticUrl(value, code);
  if (canonical !== `${value}/`) fail(code);
  return value;
}

function delta17OptionalCanonicalUrl(value, code) {
  return value === null ? null : delta17CanonicalSyntheticUrl(value, code);
}

function delta17Expectation({
  field,
  identityClass,
  relationship,
  requestBodyValue = null,
  storedExpected,
}) {
  if (
    typeof field !== "string" ||
    !DELTA17_PERSISTED_STATE_IDENTITY_CLASSES.includes(identityClass) ||
    typeof relationship !== "string" ||
    !Object.hasOwn({ storedExpected }, "storedExpected")
  ) {
    fail("DELTA17_ORACLE_EXPECTATION");
  }
  return deepFreeze({
    field,
    identity_class: identityClass,
    relationship,
    request_body_value: requestBodyValue,
    stored_expected: storedExpected,
  });
}

export function buildDelta17PersistedStateOracle(value) {
  const keys = [
    "approve_submission_logo_url_raw",
    "approve_submission_website_raw",
    "edit_fixture_website_raw",
    "edit_submission_logo_url_lexical",
    "edit_submission_website_lexical",
    "reject_fixture_website_raw",
    "route_tool_logo_url_lexical",
    "route_tool_website_lexical",
    "source_bindings",
  ];
  requireExactKeys(value, keys, "DELTA17_ORACLE_SHAPE");
  requireExactKeys(
    value.source_bindings,
    Object.keys(DELTA17_SOURCE_BINDINGS),
    "DELTA17_ORACLE_SOURCE_BINDINGS_SHAPE",
  );
  for (const [name, expected] of Object.entries(DELTA17_SOURCE_BINDINGS)) {
    if (value.source_bindings[name] !== expected) {
      fail(`DELTA17_ORACLE_SOURCE_BINDING_${name.toUpperCase()}`);
    }
  }
  const routeStored = delta17CanonicalSyntheticUrl(
    value.route_tool_website_lexical,
    "DELTA17_ORACLE_ROUTE_WEBSITE",
  );
  const routeLogoStored = delta17OptionalCanonicalUrl(
    value.route_tool_logo_url_lexical,
    "DELTA17_ORACLE_ROUTE_LOGO",
  );
  const editFixtureRaw = delta17DirectFixtureUrl(
    value.edit_fixture_website_raw,
    "DELTA17_ORACLE_EDIT_FIXTURE",
  );
  const rejectFixtureRaw = delta17DirectFixtureUrl(
    value.reject_fixture_website_raw,
    "DELTA17_ORACLE_REJECT_FIXTURE",
  );
  const editStored = delta17CanonicalSyntheticUrl(
    value.edit_submission_website_lexical,
    "DELTA17_ORACLE_EDIT_WEBSITE",
  );
  const editLogoStored = delta17OptionalCanonicalUrl(
    value.edit_submission_logo_url_lexical,
    "DELTA17_ORACLE_EDIT_LOGO",
  );
  const approveWebsiteRaw = delta17DirectFixtureUrl(
    value.approve_submission_website_raw,
    "DELTA17_ORACLE_APPROVE_WEBSITE",
  );
  if (value.approve_submission_logo_url_raw !== null) {
    delta17DirectFixtureUrl(
      value.approve_submission_logo_url_raw,
      "DELTA17_ORACLE_APPROVE_LOGO",
    );
  }
  const expectations = deepFreeze({
    request6_approve_fixture_website: delta17Expectation({
      field: "website",
      identityClass: "DIRECT_FIXTURE_RAW",
      relationship: "DIRECT_INSERT_EXACT",
      storedExpected: approveWebsiteRaw,
    }),
    request6_edit_fixture_website: delta17Expectation({
      field: "website",
      identityClass: "DIRECT_FIXTURE_RAW",
      relationship: "DIRECT_INSERT_EXACT",
      storedExpected: editFixtureRaw,
    }),
    request6_reject_fixture_website: delta17Expectation({
      field: "website",
      identityClass: "DIRECT_FIXTURE_RAW",
      relationship: "DIRECT_INSERT_EXACT",
      storedExpected: rejectFixtureRaw,
    }),
    request8_website: delta17Expectation({
      field: "website",
      identityClass: "APPLICATION_VALIDATED_CANONICAL",
      relationship: "VALIDATE_HTTPS_URL_TO_STRING",
      requestBodyValue: value.route_tool_website_lexical,
      storedExpected: routeStored,
    }),
    request10_website: delta17Expectation({
      field: "website",
      identityClass: "APPLICATION_VALIDATED_CANONICAL",
      relationship: "VALIDATE_HTTPS_URL_TO_STRING",
      requestBodyValue: value.route_tool_website_lexical,
      storedExpected: routeStored,
    }),
    request10_logo_url: delta17Expectation({
      field: "logo_url",
      identityClass: "APPLICATION_VALIDATED_CANONICAL",
      relationship: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
      requestBodyValue: value.route_tool_logo_url_lexical,
      storedExpected: routeLogoStored,
    }),
    request12_website: delta17Expectation({
      field: "website",
      identityClass: "APPLICATION_VALIDATED_CANONICAL",
      relationship: "VALIDATE_HTTPS_URL_TO_STRING",
      requestBodyValue: value.edit_submission_website_lexical,
      storedExpected: editStored,
    }),
    request12_logo_url: delta17Expectation({
      field: "logo_url",
      identityClass: "APPLICATION_VALIDATED_CANONICAL",
      relationship: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
      requestBodyValue: value.edit_submission_logo_url_lexical,
      storedExpected: editLogoStored,
    }),
    request13_status: delta17Expectation({
      field: "status",
      identityClass: "STATUS_TRANSITION",
      relationship: "PENDING_TO_REJECTED",
      storedExpected: "rejected",
    }),
    request14_submission_status: delta17Expectation({
      field: "status",
      identityClass: "STATUS_TRANSITION",
      relationship: "PENDING_TO_APPROVED",
      storedExpected: "approved",
    }),
    request14_approved_tool_status: delta17Expectation({
      field: "status",
      identityClass: "RPC_PERSISTED_SOURCE_BOUND",
      relationship: "RPC_INSERT_APPROVED",
      storedExpected: "approved",
    }),
    request14_approved_tool_website: delta17Expectation({
      field: "website",
      identityClass: "RPC_PERSISTED_SOURCE_BOUND",
      relationship: "RPC_COPY_SUBMISSION_WEBSITE",
      storedExpected: approveWebsiteRaw,
    }),
    request14_approved_tool_logo_url: delta17Expectation({
      field: "logo_url",
      identityClass: "RPC_PERSISTED_SOURCE_BOUND",
      relationship: "RPC_COPY_SUBMISSION_LOGO_URL",
      storedExpected: value.approve_submission_logo_url_raw,
    }),
    request15_storage_identity: delta17Expectation({
      field: "object_path",
      identityClass: "RUNTIME_PROJECTION_REQUIRED",
      relationship: "AUDIT_AND_STORAGE_RUNTIME_PROJECTION",
      storedExpected: null,
    }),
  });
  const cleanupSelectors = deepFreeze([
    "ROUTE_TOOL",
    "APPROVED_TOOL",
    "EDIT_SUBMISSION",
    "REJECT_SUBMISSION",
    "APPROVE_SUBMISSION",
    "AUDIT_SET",
    "STORAGE_OBJECT",
  ].map((entityRole) => ({
    entity_role: entityRole,
    selector_class: "EXACT_PHASE_OWNED_ID_OR_MARKER",
  })));
  const contractProjection = {
    cleanup_selectors: cleanupSelectors,
    expectations: Object.fromEntries(
      Object.entries(expectations).map(([name, expectation]) => [
        name,
        {
          field: expectation.field,
          identity_class: expectation.identity_class,
          relationship: expectation.relationship,
        },
      ]),
    ),
    identity_classes: DELTA17_PERSISTED_STATE_IDENTITY_CLASSES,
    source_bindings: DELTA17_SOURCE_BINDINGS,
  };
  return deepFreeze({
    cleanup_selectors: cleanupSelectors,
    contract_sha256: delta17Sha256(canonicalJson(contractProjection)),
    expectations,
    identity_classes: DELTA17_PERSISTED_STATE_IDENTITY_CLASSES,
    source_bindings: DELTA17_SOURCE_BINDINGS,
  });
}

function delta17ExactRow(rows, id, code) {
  if (!Array.isArray(rows) || !Number.isInteger(id) || id < 1) fail(code);
  const matches = rows.filter((row) => row?.id === id);
  if (matches.length !== 1) fail(code);
  return matches[0];
}

function delta17HashScalar(value, code) {
  if (typeof value !== "string" && !Number.isInteger(value)) fail(code);
  return delta17Sha256(String(value));
}

function delta17EntityProjection({
  auditActions = null,
  auditTargetRoles = null,
  id = null,
  logoPresent = null,
  matchCount,
  nameMarkerMatch = null,
  normalizedDomain = null,
  pricingCategoryShape = null,
  role,
  status = null,
  storagePath = null,
  storagePresence = null,
  transitionMatch,
  website = null,
  websiteIdentityClass = null,
}) {
  return deepFreeze({
    audit_action_enum: auditActions,
    audit_target_role: auditTargetRoles,
    exact_id_hash: id === null ? null : delta17HashScalar(id, "DELTA17_ENTITY_ID"),
    expected_transition_match: transitionMatch,
    logo_presence: logoPresent,
    match_count: matchCount,
    name_marker_match: nameMarkerMatch,
    normalized_domain_hash:
      normalizedDomain === null
        ? null
        : delta17HashScalar(normalizedDomain, "DELTA17_ENTITY_DOMAIN"),
    positive_id: id === null ? null : id > 0,
    pricing_category_shape: pricingCategoryShape,
    status_enum: status,
    storage_exact_path_hash:
      storagePath === null
        ? null
        : delta17HashScalar(storagePath, "DELTA17_ENTITY_STORAGE"),
    storage_presence: storagePresence,
    synthetic_entity_role: role,
    website_has_terminal_slash:
      website === null ? null : website.endsWith("/"),
    website_hash:
      website === null
        ? null
        : delta17HashScalar(website, "DELTA17_ENTITY_WEBSITE"),
    website_identity_class: websiteIdentityClass,
  });
}

function delta17AssertExpectedRow(observed, expected, code, deleted) {
  const fields = [
    "category",
    "logo_url",
    "name",
    "normalized_domain",
    "pricing",
    "status",
    "website",
  ];
  if (
    !observed ||
    typeof observed !== "object" ||
    !expected ||
    typeof expected !== "object" ||
    fields.some((field) => observed[field] !== expected[field]) ||
    (deleted === true &&
      (typeof observed.deleted_at !== "string" || observed.deleted_at === "")) ||
    (deleted === false && observed.deleted_at !== null)
  ) {
    fail(code);
  }
}

function delta17AssertExpectedSubmission(observed, expected, code) {
  if (
    !observed ||
    typeof observed !== "object" ||
    !expected ||
    typeof expected !== "object" ||
    !["id", "logo_url", "name", "status", "website"].every(
      (field) => observed[field] === expected[field],
    )
  ) {
    fail(code);
  }
}

function delta17ExpectedRowMatches(observed, expected, deleted) {
  const fields = [
    "category",
    "logo_url",
    "name",
    "normalized_domain",
    "pricing",
    "status",
    "website",
  ];
  return Boolean(
    observed &&
      typeof observed === "object" &&
      expected &&
      typeof expected === "object" &&
      fields.every((field) => observed[field] === expected[field]) &&
      (deleted === true
        ? typeof observed.deleted_at === "string" &&
          observed.deleted_at !== ""
        : observed.deleted_at === null),
  );
}

function delta17ExpectedSubmissionMatches(observed, expected) {
  return Boolean(
    observed &&
      typeof observed === "object" &&
      expected &&
      typeof expected === "object" &&
      ["id", "logo_url", "name", "status", "website"].every(
        (field) => observed[field] === expected[field],
      ),
  );
}

function delta17AuditTargetRole(action) {
  if (["tool_added", "tool_updated", "tool_deleted"].includes(action)) {
    return "ROUTE_TOOL";
  }
  if (action === "submission_updated") return "EDIT_SUBMISSION";
  if (action === "submission_rejected") return "REJECT_SUBMISSION";
  if (action === "submission_approved") return "APPROVE_SUBMISSION";
  if (action === "logo_uploaded") return "STORAGE_OBJECT";
  if (action === "admin_logout") return "SESSION";
  fail("DELTA17_AUDIT_ACTION");
}

function delta17ValidateAudits(rows, expected, expectedActions) {
  if (
    !Array.isArray(rows) ||
    rows.length !== expectedActions.length ||
    new Set(rows.map((row) => row?.action)).size !== rows.length ||
    !expectedActions.every((action) =>
      rows.some((row) => row?.action === action),
    )
  ) {
    fail("DELTA17_AUDIT_SET");
  }
  const byAction = new Map(rows.map((row) => [row.action, row]));
  const expectedTargetIds = new Map([
    ["tool_added", null],
    ["tool_updated", String(expected.route_tool.id)],
    ["tool_deleted", String(expected.route_tool.id)],
    ["submission_updated", String(expected.submissions.EDIT.id)],
    ["submission_rejected", String(expected.submissions.REJECT.id)],
    ["submission_approved", String(expected.submissions.APPROVE.id)],
  ]);
  for (const [action, targetId] of expectedTargetIds) {
    if (expectedActions.includes(action) && byAction.get(action)?.target_id !== targetId) {
      fail("DELTA17_AUDIT_TARGET_ID");
    }
  }
  if (
    expectedActions.includes("logo_uploaded") &&
    byAction.get("logo_uploaded")?.target_name !== expected.storage_path
  ) {
    fail("DELTA17_AUDIT_STORAGE_TARGET");
  }
  return expectedActions.map(delta17AuditTargetRole);
}

function delta17AuditProjection(rows, expected, expectedActions) {
  if (!Array.isArray(rows) || rows.length > 16) {
    fail("DELTA17_AUDIT_PROJECTION_SHAPE");
  }
  const actions = rows.map((row) =>
    typeof row?.action === "string" && row.action.length <= 64
      ? row.action
      : "UNRECOGNIZED",
  );
  const roles = actions.map((action) => {
    try {
      return delta17AuditTargetRole(action);
    } catch {
      return "UNRECOGNIZED";
    }
  });
  const byAction = new Map(
    rows
      .filter((row) => typeof row?.action === "string")
      .map((row) => [row.action, row]),
  );
  const expectedTargetIds = new Map([
    ["tool_added", null],
    ["tool_updated", String(expected.route_tool.id)],
    ["tool_deleted", String(expected.route_tool.id)],
    ["submission_updated", String(expected.submissions.EDIT.id)],
    ["submission_rejected", String(expected.submissions.REJECT.id)],
    ["submission_approved", String(expected.submissions.APPROVE.id)],
  ]);
  const targetIdsMatch = [...expectedTargetIds].every(
    ([action, targetId]) =>
      !expectedActions.includes(action) ||
      byAction.get(action)?.target_id === targetId,
  );
  const storageTargetMatches =
    !expectedActions.includes("logo_uploaded") ||
    (byAction.get("logo_uploaded")?.target_id === expected.storage_path &&
      byAction.get("logo_uploaded")?.target_name === expected.storage_path);
  return deepFreeze({
    actions,
    match:
      rows.length === expectedActions.length &&
      new Set(actions).size === rows.length &&
      exactArray(actions, expectedActions) &&
      targetIdsMatch &&
      storageTargetMatches,
    roles,
  });
}

const DELTA17_ENTITY_PROJECTION_KEYS = Object.freeze([
  "audit_action_enum",
  "audit_target_role",
  "exact_id_hash",
  "expected_transition_match",
  "logo_presence",
  "match_count",
  "name_marker_match",
  "normalized_domain_hash",
  "positive_id",
  "pricing_category_shape",
  "status_enum",
  "storage_exact_path_hash",
  "storage_presence",
  "synthetic_entity_role",
  "website_has_terminal_slash",
  "website_hash",
  "website_identity_class",
]);

function delta17ProjectionHash(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function delta17EntityFieldsAreNull(entity, fields) {
  return fields.every((field) => entity[field] === null);
}

function delta17ValidatePersistedEntityProjection(
  entity,
  expectedRole,
  expectedRequestCount,
) {
  requireExactKeys(
    entity,
    DELTA17_ENTITY_PROJECTION_KEYS,
    "DELTA17_PROJECTION_ENTITY_SHAPE",
  );
  if (
    entity.synthetic_entity_role !== expectedRole ||
    entity.expected_transition_match !== true
  ) {
    fail("DELTA17_PROJECTION_ENTITY_IDENTITY");
  }
  const toolContracts = Object.freeze({
    APPROVED_TOOL: Object.freeze({
      status: "approved",
      websiteIdentity: "RPC_PERSISTED_SOURCE_BOUND",
      websiteTerminalSlash: false,
    }),
    ROUTE_TOOL: Object.freeze({
      status: "archived",
      websiteIdentity: "APPLICATION_VALIDATED_CANONICAL",
      websiteTerminalSlash: true,
    }),
  });
  if (Object.hasOwn(toolContracts, expectedRole)) {
    const contract = toolContracts[expectedRole];
    if (
      !delta17ProjectionHash(entity.exact_id_hash) ||
      entity.logo_presence !== false ||
      entity.match_count !== 1 ||
      entity.name_marker_match !== true ||
      !delta17ProjectionHash(entity.normalized_domain_hash) ||
      entity.positive_id !== true ||
      entity.pricing_category_shape !== "PRODUCTIVITY_FREE" ||
      entity.status_enum !== contract.status ||
      !delta17EntityFieldsAreNull(entity, [
        "audit_action_enum",
        "audit_target_role",
        "storage_exact_path_hash",
        "storage_presence",
      ]) ||
      entity.website_has_terminal_slash !==
        contract.websiteTerminalSlash ||
      !delta17ProjectionHash(entity.website_hash) ||
      entity.website_identity_class !== contract.websiteIdentity
    ) {
      fail("DELTA17_PROJECTION_TOOL_ENTITY");
    }
    return entity;
  }
  const submissionContracts = Object.freeze({
    APPROVE_SUBMISSION: Object.freeze({
      status: "approved",
      websiteIdentity: "DIRECT_FIXTURE_RAW",
      websiteTerminalSlash: false,
    }),
    EDIT_SUBMISSION: Object.freeze({
      status: "pending",
      websiteIdentity: "APPLICATION_VALIDATED_CANONICAL",
      websiteTerminalSlash: true,
    }),
    REJECT_SUBMISSION: Object.freeze({
      status: "rejected",
      websiteIdentity: "DIRECT_FIXTURE_RAW",
      websiteTerminalSlash: false,
    }),
  });
  if (Object.hasOwn(submissionContracts, expectedRole)) {
    const contract = submissionContracts[expectedRole];
    if (
      !delta17ProjectionHash(entity.exact_id_hash) ||
      entity.logo_presence !== false ||
      entity.match_count !== 1 ||
      entity.name_marker_match !== true ||
      entity.normalized_domain_hash !== null ||
      entity.positive_id !== true ||
      entity.pricing_category_shape !== null ||
      entity.status_enum !== contract.status ||
      !delta17EntityFieldsAreNull(entity, [
        "audit_action_enum",
        "audit_target_role",
        "storage_exact_path_hash",
        "storage_presence",
      ]) ||
      entity.website_has_terminal_slash !==
        contract.websiteTerminalSlash ||
      !delta17ProjectionHash(entity.website_hash) ||
      entity.website_identity_class !== contract.websiteIdentity
    ) {
      fail("DELTA17_PROJECTION_SUBMISSION_ENTITY");
    }
    return entity;
  }
  if (expectedRole === "AUDIT_SET") {
    const expectedActions = PLAN.audit_actions.slice(
      0,
      expectedRequestCount === 20 ? 8 : 7,
    );
    const expectedTargetRoles = expectedActions.map(delta17AuditTargetRole);
    if (
      !exactArray(entity.audit_action_enum, expectedActions) ||
      !exactArray(entity.audit_target_role, expectedTargetRoles) ||
      entity.match_count !== expectedActions.length ||
      !delta17EntityFieldsAreNull(entity, [
        "exact_id_hash",
        "logo_presence",
        "name_marker_match",
        "normalized_domain_hash",
        "positive_id",
        "pricing_category_shape",
        "status_enum",
        "storage_exact_path_hash",
        "storage_presence",
        "website_has_terminal_slash",
        "website_hash",
        "website_identity_class",
      ])
    ) {
      fail("DELTA17_PROJECTION_AUDIT_ENTITY");
    }
    return entity;
  }
  if (
    expectedRole !== "STORAGE_OBJECT" ||
    entity.match_count !== 1 ||
    !delta17ProjectionHash(entity.storage_exact_path_hash) ||
    entity.storage_presence !== true ||
    !delta17EntityFieldsAreNull(entity, [
      "audit_action_enum",
      "audit_target_role",
      "exact_id_hash",
      "logo_presence",
      "name_marker_match",
      "normalized_domain_hash",
      "positive_id",
      "pricing_category_shape",
      "status_enum",
      "website_has_terminal_slash",
      "website_hash",
      "website_identity_class",
    ])
  ) {
    fail("DELTA17_PROJECTION_STORAGE_ENTITY");
  }
  return entity;
}

function delta17AssertionEvidenceClasses(ordinal) {
  if (ordinal === 8 || ordinal === 10) {
    return ["APPLICATION_CONTRACT_PROJECTION", "APPLICATION_VALIDATED_CANONICAL"];
  }
  if (ordinal === 9) {
    return ["APPLICATION_CONTRACT_PROJECTION", "RUNTIME_PROJECTION_REQUIRED"];
  }
  if (ordinal === 11 || ordinal === 13) {
    return ["APPLICATION_CONTRACT_PROJECTION", "STATUS_TRANSITION"];
  }
  if (ordinal === 12) {
    return ["APPLICATION_CONTRACT_PROJECTION", "APPLICATION_VALIDATED_CANONICAL"];
  }
  if (ordinal === 14) {
    return [
      "APPLICATION_CONTRACT_PROJECTION",
      "RPC_PERSISTED_SOURCE_BOUND",
      "STATUS_TRANSITION",
    ];
  }
  if (ordinal === 15) {
    return ["APPLICATION_CONTRACT_PROJECTION", "RUNTIME_PROJECTION_REQUIRED"];
  }
  return ["APPLICATION_CONTRACT_PROJECTION"];
}

const DELTA17_APPLICATION_RESPONSE_FACT_KEYS = Object.freeze([
  "allow_methods_exact",
  "csrf_cookie_contract_pass",
  "csrf_cookie_matches_body",
  "csrf_token_format",
  "fixture_binding_count",
  "fixture_binding_exact",
  "identity_contract_pass",
  "logo_origin_match",
  "logo_path_valid",
  "logout_cookie_contract_pass",
  "post_logout_denial_contract_pass",
  "response_path_echo_absent",
  "route_positive_tool_id",
  "route_unique_match_count",
  "session_cookie_contract_pass",
]);

function delta17ExpectedApplicationIdentity(ordinal) {
  return new Map([
    [1, "ADMIN_TOOLS_UNAUTHENTICATED_401"],
    [2, "LOGIN_SUCCESS_200"],
    [3, "AUTHENTICATED_SESSION_200"],
    [4, "CSRF_ISSUED_200"],
    [5, "MISSING_CSRF_DENIAL_403"],
  ]).get(ordinal) ?? "OTHER_APPLICATION_RESPONSE";
}

function delta17ExpectedBodyShape(ordinal) {
  return new Map([
    [1, "EXACT_UNAUTHENTICATED_TOOLS_JSON"],
    [2, "EXACT_LOGIN_SUCCESS_JSON"],
    [3, "EXACT_AUTHENTICATED_SESSION_JSON"],
    [4, "EXACT_CSRF_SUCCESS_JSON"],
    [5, "EXACT_MISSING_CSRF_DENIAL_JSON"],
  ]).get(ordinal) ?? "JSON_VALUE";
}

function delta17ExpectedStatusClass(status) {
  if (status === 401) return "EXPECTED_401";
  if (status >= 300 && status <= 399) return "HTTP_3XX";
  if (status === 403) return "HTTP_403";
  if (status === 404) return "HTTP_404";
  if (status >= 400 && status <= 499) return "HTTP_OTHER_4XX";
  if (status >= 500) return "HTTP_5XX";
  return "OTHER";
}

function delta17ValidateSecurityHeaderCategories(value, request) {
  requireExactKeys(
    value,
    SECURITY_HEADER_PROJECTION_KEYS,
    "DELTA17_APPLICATION_SECURITY_HEADER_SHAPE",
  );
  const requiredTrue = [
    "cache_control_no_store",
    "x_content_type_options_nosniff",
    "x_frame_options_deny",
    "referrer_policy_strict_origin_when_cross_origin",
    "x_dns_prefetch_control_off",
    "cross_origin_opener_policy_same_origin",
    "permissions_camera_disabled",
    "permissions_microphone_disabled",
    "permissions_geolocation_disabled",
    "permissions_payment_disabled",
    "permissions_usb_disabled",
    "permissions_magnetometer_disabled",
    "permissions_gyroscope_disabled",
    "permissions_accelerometer_disabled",
    "csp_frame_ancestors_none",
    "csp_base_uri_self",
    "csp_form_action_self",
    "csp_object_src_none",
    "hsts_present",
  ];
  const expectedApplicationIdentity =
    request.ordinal === 1
      ? "ADMIN_TOOLS_UNAUTHENTICATED"
      : request.ordinal === 20
        ? "ADMIN_SESSION_UNAUTHENTICATED"
        : "OTHER";
  const unauthenticatedProjection = [1, 20].includes(request.ordinal);
  if (
    requiredTrue.some((name) => value[name] !== true) ||
    !["ONE_TO_TWO_YEARS", "AT_LEAST_TWO_YEARS"].includes(
      value.hsts_max_age_class,
    ) ||
    ![
      "hsts_include_subdomains",
      "hsts_preload",
      "x_robots_tag_noindex_advisory",
    ].every((name) => typeof value[name] === "boolean") ||
    value.status_class !== delta17ExpectedStatusClass(request.status) ||
    value.application_body_shape !==
      (unauthenticatedProjection ? "EXACT_JSON_OBJECT" : "OTHER") ||
    value.application_response_identity !==
      expectedApplicationIdentity ||
    value.disposition !==
      (unauthenticatedProjection
        ? "PASS_EXACT_APPLICATION_HEADER_CONTRACT"
        : "APPLICATION_RESPONSE_NOT_REACHED")
  ) {
    fail("DELTA17_APPLICATION_SECURITY_HEADER_CONTRACT");
  }
  return value;
}

function delta17ValidateCookieEffects(value, ordinal) {
  requireExactKeys(
    value,
    ["csrf_cookie", "session_cookie"],
    "DELTA17_APPLICATION_COOKIE_EFFECT_SHAPE",
  );
  const expectedSession =
    ordinal === 2
      ? "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400"
      : ordinal === 19
        ? "CLEARED_MAXAGE_ZERO"
        : "ABSENT";
  const expectedCsrf =
    ordinal === 4
      ? "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400"
      : ordinal === 19
        ? "CLEARED_MAXAGE_ZERO"
        : "ABSENT";
  if (
    value.session_cookie !== expectedSession ||
    value.csrf_cookie !== expectedCsrf
  ) {
    fail("DELTA17_APPLICATION_COOKIE_EFFECT_CONTRACT");
  }
  return value;
}

function delta17ExpectedResponseFacts(ordinal) {
  return Object.freeze({
    allow_methods_exact: ordinal === 16 ? true : null,
    csrf_cookie_contract_pass: ordinal === 4 ? true : null,
    csrf_cookie_matches_body: ordinal === 4 ? true : null,
    csrf_token_format: ordinal === 4 ? true : null,
    fixture_binding_count: ordinal === 6 ? 3 : null,
    fixture_binding_exact: ordinal === 6 ? true : null,
    identity_contract_pass: ordinal <= 5 ? true : null,
    logo_origin_match: ordinal === 15 ? true : null,
    logo_path_valid: ordinal === 15 ? true : null,
    logout_cookie_contract_pass: ordinal === 19 ? true : null,
    post_logout_denial_contract_pass: ordinal === 20 ? true : null,
    response_path_echo_absent: [17, 18].includes(ordinal) ? true : null,
    route_positive_tool_id: ordinal === 9 ? true : null,
    route_unique_match_count: ordinal === 9 ? 1 : null,
    session_cookie_contract_pass: ordinal === 2 ? true : null,
  });
}

export function validateDelta17SanitizedApplicationAssertion(value) {
  requireExactKeys(
    value,
    [
      "actual_status_integer",
      "application_identity_class",
      "body_contract",
      "body_shape_class",
      "cookie_effect_categories",
      "decidable",
      "evidence_classes",
      "expected_status",
      "expected_transition_match",
      "method",
      "ordinal",
      "path_class",
      "raw_body_persisted",
      "raw_cookies_persisted",
      "raw_headers_persisted",
      "response_facts",
      "security_header_categories",
      "status_match",
    ],
    "DELTA17_APPLICATION_ASSERTION_SHAPE",
  );
  const request = REQUESTS[value.ordinal - 1];
  requireExactKeys(
    value.response_facts,
    DELTA17_APPLICATION_RESPONSE_FACT_KEYS,
    "DELTA17_APPLICATION_RESPONSE_FACT_SHAPE",
  );
  if (
    !request ||
    value.ordinal !== request.ordinal ||
    value.method !== request.method ||
    value.body_contract !== request.contract ||
    value.expected_status !== request.status ||
    value.actual_status_integer !== request.status ||
    value.status_match !== true ||
    value.path_class !== delta13PathClass(request.path) ||
    value.application_identity_class !==
      delta17ExpectedApplicationIdentity(request.ordinal) ||
    value.body_shape_class !== delta17ExpectedBodyShape(request.ordinal) ||
    value.decidable !== true ||
    value.expected_transition_match !== true ||
    value.raw_body_persisted !== false ||
    value.raw_cookies_persisted !== false ||
    value.raw_headers_persisted !== false ||
    !exactArray(
      value.evidence_classes,
      delta17AssertionEvidenceClasses(request.ordinal),
    ) ||
    canonicalJson(value.response_facts) !==
      canonicalJson(delta17ExpectedResponseFacts(request.ordinal))
  ) {
    fail("DELTA17_APPLICATION_ASSERTION_CONTRACT");
  }
  delta17ValidateCookieEffects(
    value.cookie_effect_categories,
    request.ordinal,
  );
  delta17ValidateSecurityHeaderCategories(
    value.security_header_categories,
    request,
  );
  return deepFreeze({
    ...value,
    cookie_effect_categories: { ...value.cookie_effect_categories },
    evidence_classes: [...value.evidence_classes],
    response_facts: { ...value.response_facts },
    security_header_categories: { ...value.security_header_categories },
  });
}

function projectDelta18SanitizedApplicationAssertion(value) {
  requireExactKeys(
    value,
    ["contract_projection", "response_projection"],
    "DELTA17_APPLICATION_PROJECTION_INPUT_SHAPE",
  );
  const contract = value.contract_projection;
  const response = value.response_projection;
  requireExactKeys(
    contract,
    [
      "actual_status_integer",
      "allow_methods_exact",
      "body_contract",
      "csrf_cookie_contract_pass",
      "csrf_cookie_matches_body",
      "csrf_token_format",
      "expected_status",
      "fixture_binding_count",
      "fixture_binding_exact",
      "identity_contract_pass",
      "logo_object_path",
      "logo_origin_match",
      "logo_path_valid",
      "logout_cookie_contract_pass",
      "method",
      "ordinal",
      "path",
      "post_logout_denial_contract_pass",
      "raw_body_persisted",
      "raw_cookies_persisted",
      "raw_headers_persisted",
      "response_path_echo_absent",
      "route_created_tool_id",
      "route_positive_tool_id",
      "route_unique_match_count",
      "schema_version",
      "session_cookie_contract_pass",
      "status_match",
    ],
    "DELTA17_APPLICATION_CONTRACT_PROJECTION_SHAPE",
  );
  requireExactKeys(
    response,
    [
      "actual_status_integer",
      "application_identity_class",
      "body_shape_class",
      "cookie_effect_categories",
      "expected_status",
      "method",
      "path_class",
      "request_ordinal",
      "security_header_categories",
      "status_match",
    ],
    "DELTA17_APPLICATION_RESPONSE_PROJECTION_SHAPE",
  );
  const request = REQUESTS[contract.ordinal - 1];
  if (
    !request ||
    contract.schema_version !== 1 ||
    contract.path !== request.path ||
    response.request_ordinal !== request.ordinal ||
    response.method !== contract.method ||
    response.expected_status !== contract.expected_status ||
    response.actual_status_integer !== contract.actual_status_integer ||
    response.status_match !== contract.status_match
  ) {
    fail("DELTA17_APPLICATION_PROJECTION_INPUT");
  }
  const responseFacts = Object.fromEntries(
    DELTA17_APPLICATION_RESPONSE_FACT_KEYS.map((name) => [
      name,
      contract[name],
    ]),
  );
  return deepFreeze({
    actual_status_integer: response.actual_status_integer,
    application_identity_class: response.application_identity_class,
    body_contract: contract.body_contract,
    body_shape_class: response.body_shape_class,
    cookie_effect_categories: { ...response.cookie_effect_categories },
    decidable: true,
    evidence_classes: delta17AssertionEvidenceClasses(request.ordinal),
    expected_status: response.expected_status,
    expected_transition_match: true,
    method: response.method,
    ordinal: request.ordinal,
    path_class: response.path_class,
    raw_body_persisted: false,
    raw_cookies_persisted: false,
    raw_headers_persisted: false,
    response_facts: responseFacts,
    security_header_categories: { ...response.security_header_categories },
    status_match: response.status_match,
  });
}

export function projectDelta18DurableApplicationObservation(value) {
  requireExactKeys(
    value,
    ["contract_projection", "response_projection", "sequence_ordinal"],
    "DELTA18_DURABLE_OBSERVATION_INPUT_SHAPE",
  );
  if (
    !Number.isInteger(value.sequence_ordinal) ||
    value.sequence_ordinal < 1 ||
    value.sequence_ordinal > 20
  ) {
    fail("DELTA18_DURABLE_OBSERVATION_SEQUENCE");
  }
  const assertion = projectDelta18SanitizedApplicationAssertion({
    contract_projection: value.contract_projection,
    response_projection: value.response_projection,
  });
  return deepFreeze({
    sequence_ordinal: value.sequence_ordinal,
    contract_ordinal: assertion.ordinal,
    assertion,
  });
}

export function projectDelta17SanitizedApplicationAssertion(value) {
  return validateDelta17SanitizedApplicationAssertion(
    projectDelta18SanitizedApplicationAssertion(value),
  );
}

function validateDelta18SanitizedApplicationAssertionStructure(value) {
  requireExactKeys(
    value,
    [
      "actual_status_integer",
      "application_identity_class",
      "body_contract",
      "body_shape_class",
      "cookie_effect_categories",
      "decidable",
      "evidence_classes",
      "expected_status",
      "expected_transition_match",
      "method",
      "ordinal",
      "path_class",
      "raw_body_persisted",
      "raw_cookies_persisted",
      "raw_headers_persisted",
      "response_facts",
      "security_header_categories",
      "status_match",
    ],
    "DELTA18_DURABLE_ASSERTION_SHAPE",
  );
  requireExactKeys(
    value.response_facts,
    DELTA17_APPLICATION_RESPONSE_FACT_KEYS,
    "DELTA18_DURABLE_RESPONSE_FACT_SHAPE",
  );
  requireExactKeys(
    value.cookie_effect_categories,
    ["csrf_cookie", "session_cookie"],
    "DELTA18_DURABLE_COOKIE_EFFECT_SHAPE",
  );
  requireExactKeys(
    value.security_header_categories,
    SECURITY_HEADER_PROJECTION_KEYS,
    "DELTA18_DURABLE_SECURITY_HEADER_SHAPE",
  );
  const request = REQUESTS[value.ordinal - 1];
  const pathClasses = new Set([
    "ADMIN_TOOLS",
    "ADMIN_LOGIN",
    "ADMIN_SESSION",
    "ADMIN_CSRF",
    "ADMIN_SUBMISSIONS",
    "ADMIN_UPLOAD_LOGO",
    "ADMIN_LOGOUT",
    "ADMIN_DISCOVERY_SOURCES",
    "ADMIN_UNKNOWN_EXTENSION",
  ]);
  const identityClasses = new Set([
    "ADMIN_TOOLS_UNAUTHENTICATED_401",
    "LOGIN_SUCCESS_200",
    "AUTHENTICATED_SESSION_200",
    "CSRF_ISSUED_200",
    "MISSING_CSRF_DENIAL_403",
    "OTHER_APPLICATION_RESPONSE",
    "INVALID_CREDENTIALS_401",
    "MALFORMED_MEDIA_TYPE_415",
    "MALFORMED_REQUEST_400",
    "BODY_TOO_LARGE_413",
    "RATE_LIMITED_429",
    "CONFIGURATION_UNAVAILABLE_500",
    "UNAUTHENTICATED_SESSION_401",
    "UNEXPECTED_STATUS",
  ]);
  const bodyShapeClasses = new Set([
    "EXACT_UNAUTHENTICATED_TOOLS_JSON",
    "EXACT_LOGIN_SUCCESS_JSON",
    "EXACT_AUTHENTICATED_SESSION_JSON",
    "EXACT_CSRF_SUCCESS_JSON",
    "EXACT_MISSING_CSRF_DENIAL_JSON",
    "JSON_VALUE",
    "JSON_SCALAR",
    "NON_JSON",
    "OTHER_JSON",
    "EXACT_INVALID_CREDENTIALS_JSON",
    "EXACT_MALFORMED_REQUEST_JSON",
    "EXACT_RATE_LIMITED_JSON",
    "EXACT_CONFIGURATION_UNAVAILABLE_JSON",
    "EXACT_UNAUTHENTICATED_SESSION_JSON",
  ]);
  const cookieEffects = new Set([
    "ABSENT",
    "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400",
    "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400",
    "CLEARED_MAXAGE_ZERO",
    "INVALID",
  ]);
  const evidenceClasses = new Set([
    "APPLICATION_CONTRACT_PROJECTION",
    "APPLICATION_VALIDATED_CANONICAL",
    "RPC_PERSISTED_SOURCE_BOUND",
    "RUNTIME_PROJECTION_REQUIRED",
    "STATUS_TRANSITION",
  ]);
  if (
    !request ||
    value.method !== request.method ||
    value.body_contract !== request.contract ||
    !Number.isInteger(value.expected_status) ||
    value.expected_status < 100 ||
    value.expected_status > 599 ||
    !Number.isInteger(value.actual_status_integer) ||
    value.actual_status_integer < 100 ||
    value.actual_status_integer > 599 ||
    !pathClasses.has(value.path_class) ||
    !identityClasses.has(value.application_identity_class) ||
    !bodyShapeClasses.has(value.body_shape_class) ||
    value.decidable !== true ||
    typeof value.expected_transition_match !== "boolean" ||
    typeof value.status_match !== "boolean" ||
    value.raw_body_persisted !== false ||
    value.raw_cookies_persisted !== false ||
    value.raw_headers_persisted !== false ||
    !Array.isArray(value.evidence_classes) ||
    value.evidence_classes.length < 1 ||
    value.evidence_classes.length > 3 ||
    value.evidence_classes.some((name) => !evidenceClasses.has(name)) ||
    !cookieEffects.has(value.cookie_effect_categories.csrf_cookie) ||
    !cookieEffects.has(value.cookie_effect_categories.session_cookie)
  ) {
    fail("DELTA18_DURABLE_ASSERTION_STRUCTURE");
  }
  for (const fact of Object.values(value.response_facts)) {
    if (
      fact !== null &&
      typeof fact !== "boolean" &&
      (!Number.isInteger(fact) || fact < 0)
    ) {
      fail("DELTA18_DURABLE_RESPONSE_FACT_VALUE");
    }
  }
  const security = value.security_header_categories;
  for (const name of [
    "cache_control_no_store",
    "x_content_type_options_nosniff",
    "x_frame_options_deny",
    "referrer_policy_strict_origin_when_cross_origin",
    "x_dns_prefetch_control_off",
    "cross_origin_opener_policy_same_origin",
    "permissions_camera_disabled",
    "permissions_microphone_disabled",
    "permissions_geolocation_disabled",
    "permissions_payment_disabled",
    "permissions_usb_disabled",
    "permissions_magnetometer_disabled",
    "permissions_gyroscope_disabled",
    "permissions_accelerometer_disabled",
    "csp_frame_ancestors_none",
    "csp_base_uri_self",
    "csp_form_action_self",
    "csp_object_src_none",
    "hsts_present",
    "hsts_include_subdomains",
    "hsts_preload",
    "x_robots_tag_noindex_advisory",
  ]) {
    if (typeof security[name] !== "boolean") {
      fail("DELTA18_DURABLE_SECURITY_HEADER_BOOLEAN");
    }
  }
  if (
    !SECURITY_HEADER_STATUS_CLASSES.includes(security.status_class) ||
    !["EXACT_JSON_OBJECT", "OTHER"].includes(
      security.application_body_shape,
    ) ||
    ![
      "ADMIN_TOOLS_UNAUTHENTICATED",
      "ADMIN_SESSION_UNAUTHENTICATED",
      "OTHER",
    ].includes(security.application_response_identity) ||
    !["ONE_TO_TWO_YEARS", "AT_LEAST_TWO_YEARS"].includes(
      security.hsts_max_age_class,
    ) ||
    ![
      "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      "APPLICATION_RESPONSE_NOT_REACHED",
      "ROUTE_HEADER_DELIVERY_DEFECT",
      "PROXY_HEADER_DELIVERY_DEFECT",
      "HSTS_DELIVERY_DEFECT",
    ].includes(security.disposition)
  ) {
    fail("DELTA18_DURABLE_SECURITY_HEADER_CATEGORY");
  }
  return deepFreeze({
    ...value,
    cookie_effect_categories: { ...value.cookie_effect_categories },
    evidence_classes: [...value.evidence_classes],
    response_facts: { ...value.response_facts },
    security_header_categories: { ...value.security_header_categories },
  });
}

function delta18ExpectedContractOrdinals(kind) {
  if (kind === "QUALIFICATION") return [1, 2, 3, 4, 19, 20];
  if (kind === "OFFICIAL") return REQUESTS.map((request) => request.ordinal);
  fail("DELTA18_DURABLE_JOURNAL_KIND");
}

export function validateDelta18DurableProjectionJournal(value) {
  requireExactKeys(
    value,
    [
      "completed_request_count",
      "entries",
      "expected_request_count",
      "journal_kind",
      "phase",
      "projection_complete",
      "raw_body_persisted",
      "raw_cookies_persisted",
      "raw_headers_persisted",
      "raw_secrets_persisted",
      "raw_urls_persisted",
      "schema_version",
    ],
    "DELTA18_DURABLE_JOURNAL_SHAPE",
  );
  const expectedContractOrdinals = delta18ExpectedContractOrdinals(
    value.journal_kind,
  );
  if (
    value.schema_version !== 1 ||
    value.phase !== "34IA-34IZ-DELTA18" ||
    value.expected_request_count !== expectedContractOrdinals.length ||
    !Array.isArray(value.entries) ||
    value.entries.length !== value.completed_request_count ||
    !Number.isInteger(value.completed_request_count) ||
    value.completed_request_count < 0 ||
    value.completed_request_count > value.expected_request_count ||
    typeof value.projection_complete !== "boolean" ||
    value.projection_complete !==
      (value.completed_request_count === value.expected_request_count) ||
    value.raw_body_persisted !== false ||
    value.raw_cookies_persisted !== false ||
    value.raw_headers_persisted !== false ||
    value.raw_secrets_persisted !== false ||
    value.raw_urls_persisted !== false
  ) {
    fail("DELTA18_DURABLE_JOURNAL_CONTRACT");
  }
  const entries = value.entries.map((entry, index) => {
    requireExactKeys(
      entry,
      ["assertion", "contract_ordinal", "sequence_ordinal"],
      "DELTA18_DURABLE_JOURNAL_ENTRY_SHAPE",
    );
    const assertion = validateDelta18SanitizedApplicationAssertionStructure(
      entry.assertion,
    );
    if (
      entry.sequence_ordinal !== index + 1 ||
      entry.contract_ordinal !== expectedContractOrdinals[index] ||
      assertion.ordinal !== entry.contract_ordinal
    ) {
      fail("DELTA18_DURABLE_JOURNAL_ORDINAL");
    }
    return {
      assertion,
      contract_ordinal: entry.contract_ordinal,
      sequence_ordinal: entry.sequence_ordinal,
    };
  });
  return deepFreeze({
    ...value,
    entries,
  });
}

export function validateDelta18DurableProjectionSemantics(value) {
  const journal = validateDelta18DurableProjectionJournal(value);
  const validated = journal.entries.map((entry) =>
    validateDelta17SanitizedApplicationAssertion(entry.assertion),
  );
  return deepFreeze({
    journal_kind: journal.journal_kind,
    projection_complete: journal.projection_complete,
    validated_request_count: validated.length,
    validated_contract_ordinals: validated.map((entry) => entry.ordinal),
  });
}

export function projectDelta17SanitizedPostState(value) {
  requireExactKeys(
    value,
    [
      "application_contracts",
      "expected",
      "expected_request_count",
      "observed",
      "oracle",
    ],
    "DELTA17_PROJECTION_INPUT_SHAPE",
  );
  if (
    ![15, 20].includes(value.expected_request_count) ||
    !/^[a-f0-9]{64}$/u.test(value.oracle?.contract_sha256 ?? "") ||
    !Array.isArray(value.application_contracts) ||
    value.application_contracts.length !== value.expected_request_count
  ) {
    fail("DELTA17_PROJECTION_INPUT");
  }
  const applicationAssertions = value.application_contracts.map(
    (applicationContract, index) => {
      const validated = validateDelta17SanitizedApplicationAssertion(
        applicationContract,
      );
      if (validated.ordinal !== index + 1) {
        fail("DELTA17_APPLICATION_CONTRACT");
      }
      return validated;
    },
  );
  requireExactKeys(
    value.expected,
    ["approved_tool", "audit_actions", "route_tool", "storage_path", "submissions"],
    "DELTA17_EXPECTED_SHAPE",
  );
  requireExactKeys(
    value.expected.submissions,
    ["APPROVE", "EDIT", "REJECT"],
    "DELTA17_EXPECTED_SUBMISSIONS_SHAPE",
  );
  requireExactKeys(
    value.observed,
    ["audits", "storage_objects", "submissions", "tools"],
    "DELTA17_OBSERVED_SHAPE",
  );
  const oracle = value.oracle.expectations;
  if (
    value.expected.route_tool.website !== oracle?.request10_website?.stored_expected ||
    value.expected.route_tool.logo_url !== oracle?.request10_logo_url?.stored_expected ||
    value.expected.submissions.EDIT.website !==
      oracle?.request12_website?.stored_expected ||
    value.expected.submissions.EDIT.logo_url !==
      oracle?.request12_logo_url?.stored_expected ||
    value.expected.submissions.REJECT.status !==
      oracle?.request13_status?.stored_expected ||
    value.expected.submissions.APPROVE.status !==
      oracle?.request14_submission_status?.stored_expected ||
    value.expected.approved_tool.status !==
      oracle?.request14_approved_tool_status?.stored_expected ||
    value.expected.approved_tool.website !==
      oracle?.request14_approved_tool_website?.stored_expected ||
    value.expected.approved_tool.logo_url !==
      oracle?.request14_approved_tool_logo_url?.stored_expected
  ) {
    fail("DELTA17_EXPECTED_ORACLE_DRIFT");
  }
  if (
    !Array.isArray(value.observed.tools) ||
    value.observed.tools.length > 16 ||
    !Array.isArray(value.observed.submissions) ||
    value.observed.submissions.length > 16
  ) {
    fail("DELTA17_OBSERVED_SET_BOUNDS");
  }
  const routeToolMatches = value.observed.tools.filter(
    (row) => row?.id === value.expected.route_tool.id,
  );
  const approvedToolMatches = value.observed.tools.filter(
    (row) =>
      row?.normalized_domain ===
      value.expected.approved_tool.normalized_domain,
  );
  const routeTool =
    routeToolMatches.length === 1 ? routeToolMatches[0] : null;
  const approvedTool =
    approvedToolMatches.length === 1 ? approvedToolMatches[0] : null;
  const toolSetExact = value.observed.tools.length === 2;
  const submissionMatches = Object.fromEntries(
    ["EDIT", "REJECT", "APPROVE"].map((role) => [
      role,
      value.observed.submissions.filter(
        (row) => row?.id === value.expected.submissions[role].id,
      ),
    ]),
  );
  const submissions = Object.fromEntries(
    Object.entries(submissionMatches).map(([role, matches]) => [
      role,
      matches.length === 1 ? matches[0] : null,
    ]),
  );
  const submissionSetExact = value.observed.submissions.length === 3;
  const expectedAuditActions = PLAN.audit_actions.slice(
    0,
    value.expected_request_count === 20 ? 8 : 7,
  );
  if (
    !Array.isArray(value.expected.audit_actions) ||
    value.expected.audit_actions.length !== expectedAuditActions.length ||
    !exactArray(value.expected.audit_actions, expectedAuditActions)
  ) {
    fail("DELTA17_EXPECTED_AUDITS");
  }
  const auditProjection = delta17AuditProjection(
    value.observed.audits,
    value.expected,
    expectedAuditActions,
  );
  if (
    !Array.isArray(value.observed.storage_objects) ||
    value.observed.storage_objects.length > 4
  ) {
    fail("DELTA17_STORAGE_PROJECTION_SHAPE");
  }
  const storageMatches = value.observed.storage_objects.filter(
    (row) => row?.path === value.expected.storage_path,
  );
  const storageObject =
    storageMatches.length === 1 ? storageMatches[0] : null;
  const shape = (row) =>
    row &&
    typeof row.category === "string" &&
    typeof row.pricing === "string"
      ? `${row.category.toUpperCase()}_${row.pricing.toUpperCase()}`
      : null;
  const stringOrNull = (candidate) =>
    typeof candidate === "string" ? candidate : null;
  const entities = [
    delta17EntityProjection({
      id: Number.isInteger(routeTool?.id) ? routeTool.id : null,
      logoPresent: routeTool ? routeTool.logo_url !== null : null,
      matchCount: routeToolMatches.length,
      nameMarkerMatch: routeTool
        ? routeTool.name === value.expected.route_tool.name
        : null,
      normalizedDomain: stringOrNull(routeTool?.normalized_domain),
      pricingCategoryShape: shape(routeTool),
      role: "ROUTE_TOOL",
      status: stringOrNull(routeTool?.status),
      transitionMatch:
        toolSetExact &&
        routeToolMatches.length === 1 &&
        delta17ExpectedRowMatches(
          routeTool,
          value.expected.route_tool,
          true,
        ),
      website: stringOrNull(routeTool?.website),
      websiteIdentityClass: oracle.request10_website.identity_class,
    }),
    delta17EntityProjection({
      id: Number.isInteger(approvedTool?.id) ? approvedTool.id : null,
      logoPresent: approvedTool ? approvedTool.logo_url !== null : null,
      matchCount: approvedToolMatches.length,
      nameMarkerMatch: approvedTool
        ? approvedTool.name === value.expected.approved_tool.name
        : null,
      normalizedDomain: stringOrNull(approvedTool?.normalized_domain),
      pricingCategoryShape: shape(approvedTool),
      role: "APPROVED_TOOL",
      status: stringOrNull(approvedTool?.status),
      transitionMatch:
        toolSetExact &&
        approvedToolMatches.length === 1 &&
        delta17ExpectedRowMatches(
          approvedTool,
          value.expected.approved_tool,
          false,
        ),
      website: stringOrNull(approvedTool?.website),
      websiteIdentityClass:
        oracle.request14_approved_tool_website.identity_class,
    }),
    ...[
      ["EDIT", "EDIT_SUBMISSION", oracle.request12_website.identity_class],
      ["REJECT", "REJECT_SUBMISSION", "DIRECT_FIXTURE_RAW"],
      ["APPROVE", "APPROVE_SUBMISSION", "DIRECT_FIXTURE_RAW"],
    ].map(([fixtureRole, entityRole, websiteIdentityClass]) => {
      const row = submissions[fixtureRole];
      return delta17EntityProjection({
        id: Number.isInteger(row?.id) ? row.id : null,
        logoPresent: row ? row.logo_url !== null : null,
        matchCount: submissionMatches[fixtureRole].length,
        nameMarkerMatch: row
          ? row.name === value.expected.submissions[fixtureRole].name
          : null,
        role: entityRole,
        status: stringOrNull(row?.status),
        transitionMatch:
          submissionSetExact &&
          submissionMatches[fixtureRole].length === 1 &&
          delta17ExpectedSubmissionMatches(
            row,
            value.expected.submissions[fixtureRole],
          ),
        website: stringOrNull(row?.website),
        websiteIdentityClass,
      });
    }),
    delta17EntityProjection({
      auditActions: [...auditProjection.actions],
      auditTargetRoles: [...auditProjection.roles],
      matchCount: value.observed.audits.length,
      role: "AUDIT_SET",
      transitionMatch: auditProjection.match,
    }),
    delta17EntityProjection({
      matchCount: storageMatches.length,
      role: "STORAGE_OBJECT",
      storagePath:
        typeof storageObject?.path === "string"
          ? storageObject.path
          : null,
      storagePresence:
        typeof storageObject?.present === "boolean"
          ? storageObject.present
          : null,
      transitionMatch:
        value.observed.storage_objects.length === 1 &&
        storageMatches.length === 1 &&
        storageObject?.present === true,
    }),
  ];
  const assertions = applicationAssertions;
  const projection = deepFreeze({
    assertions,
    entities,
    expected_request_count: value.expected_request_count,
    oracle_contract_sha256: value.oracle.contract_sha256,
    projection_complete: true,
    projection_sufficiency: "COMPLETE",
    raw_headers_persisted: false,
    raw_response_bodies_persisted: false,
    raw_rows_persisted: false,
    raw_storage_metadata_persisted: false,
    schema_version: 2,
  });
  validateDelta17ProjectionStructure({
    expected_request_count: value.expected_request_count,
    projection,
  });
  return projection;
}

function delta17ProjectionContainsRawMaterial(value) {
  const serialized = JSON.stringify(value);
  if (
    serialized.includes("https://") ||
    serialized.includes(".invalid") ||
    /admin\/[0-9a-f-]{36}\.png/u.test(serialized)
  ) {
    return true;
  }
  const forbiddenKeys = new Set([
    "raw_body",
    "raw_cookie",
    "raw_header",
    "raw_hostname",
    "raw_path",
    "raw_row",
    "raw_url",
    "raw_value",
    "raw_website",
  ]);
  const visit = (candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    if (Array.isArray(candidate)) return candidate.some(visit);
    return Object.entries(candidate).some(
      ([name, child]) => forbiddenKeys.has(name) || visit(child),
    );
  };
  return visit(value);
}

function delta17ProjectionNullableHash(value) {
  return value === null || delta17ProjectionHash(value);
}

function delta17ProjectionNullableBoolean(value) {
  return value === null || typeof value === "boolean";
}

function delta17ProjectionNullableBoundedString(value) {
  return value === null ||
    (typeof value === "string" && value.length > 0 && value.length <= 128);
}

function delta17ValidateProjectionEntityStructure(entity, expectedRole) {
  requireExactKeys(
    entity,
    DELTA17_ENTITY_PROJECTION_KEYS,
    "DELTA17_PROJECTION_ENTITY_STRUCTURE_SHAPE",
  );
  const boundedArrays = [
    entity.audit_action_enum,
    entity.audit_target_role,
  ];
  if (
    entity.synthetic_entity_role !== expectedRole ||
    typeof entity.expected_transition_match !== "boolean" ||
    !Number.isInteger(entity.match_count) ||
    entity.match_count < 0 ||
    entity.match_count > 16 ||
    !boundedArrays.every(
      (candidate) =>
        candidate === null ||
        (Array.isArray(candidate) &&
          candidate.length <= 16 &&
          candidate.every(
            (entry) =>
              typeof entry === "string" &&
              entry.length > 0 &&
              entry.length <= 64,
          )),
    ) ||
    ![
      entity.exact_id_hash,
      entity.normalized_domain_hash,
      entity.storage_exact_path_hash,
      entity.website_hash,
    ].every(delta17ProjectionNullableHash) ||
    ![
      entity.logo_presence,
      entity.name_marker_match,
      entity.positive_id,
      entity.storage_presence,
      entity.website_has_terminal_slash,
    ].every(delta17ProjectionNullableBoolean) ||
    ![
      entity.pricing_category_shape,
      entity.status_enum,
      entity.website_identity_class,
    ].every(delta17ProjectionNullableBoundedString)
  ) {
    fail("DELTA17_PROJECTION_ENTITY_STRUCTURE");
  }
  return entity;
}

export function validateDelta17ProjectionStructure(value) {
  requireExactKeys(
    value,
    ["expected_request_count", "projection"],
    "DELTA17_PROJECTION_STRUCTURE_VALIDATION_SHAPE",
  );
  const projection = value.projection;
  requireExactKeys(
    projection,
    [
      "assertions",
      "entities",
      "expected_request_count",
      "oracle_contract_sha256",
      "projection_complete",
      "projection_sufficiency",
      "raw_headers_persisted",
      "raw_response_bodies_persisted",
      "raw_rows_persisted",
      "raw_storage_metadata_persisted",
      "schema_version",
    ],
    "DELTA17_PROJECTION_STRUCTURE_SHAPE",
  );
  if (
    ![15, 20].includes(value.expected_request_count) ||
    projection.expected_request_count !== value.expected_request_count ||
    projection.schema_version !== 2 ||
    projection.projection_complete !== true ||
    projection.projection_sufficiency !== "COMPLETE" ||
    projection.raw_headers_persisted !== false ||
    projection.raw_response_bodies_persisted !== false ||
    projection.raw_rows_persisted !== false ||
    projection.raw_storage_metadata_persisted !== false ||
    !/^[a-f0-9]{64}$/u.test(projection.oracle_contract_sha256 ?? "") ||
    delta17ProjectionContainsRawMaterial(projection) ||
    !Array.isArray(projection.assertions) ||
    projection.assertions.length !== value.expected_request_count ||
    !Array.isArray(projection.entities) ||
    projection.entities.length !== 7
  ) {
    fail("DELTA17_PROJECTION_STRUCTURE_INCOMPLETE");
  }
  const entityRoles = [
    "ROUTE_TOOL",
    "APPROVED_TOOL",
    "EDIT_SUBMISSION",
    "REJECT_SUBMISSION",
    "APPROVE_SUBMISSION",
    "AUDIT_SET",
    "STORAGE_OBJECT",
  ];
  for (const [index, entity] of projection.entities.entries()) {
    delta17ValidateProjectionEntityStructure(entity, entityRoles[index]);
  }
  for (const [index, assertion] of projection.assertions.entries()) {
    const validated = validateDelta17SanitizedApplicationAssertion(assertion);
    if (validated.ordinal !== index + 1) {
      fail("DELTA17_PROJECTION_STRUCTURE_ASSERTION");
    }
  }
  return deepFreeze({
    bounded_assertions: projection.assertions.length,
    projection_structure: "COMPLETE",
  });
}

export function validateDelta17ProjectionSufficiency(value) {
  validateDelta17ProjectionStructure(value);
  const projection = value.projection;
  const entityRoles = [
    "ROUTE_TOOL",
    "APPROVED_TOOL",
    "EDIT_SUBMISSION",
    "REJECT_SUBMISSION",
    "APPROVE_SUBMISSION",
    "AUDIT_SET",
    "STORAGE_OBJECT",
  ];
  if (
    !exactArray(
      projection.entities.map((entity) => entity.synthetic_entity_role),
      entityRoles,
    )
  ) {
    fail("DELTA17_PROJECTION_ENTITIES");
  }
  for (const [index, entity] of projection.entities.entries()) {
    delta17ValidatePersistedEntityProjection(
      entity,
      entityRoles[index],
      value.expected_request_count,
    );
  }
  for (const [index, assertion] of projection.assertions.entries()) {
    const validated = validateDelta17SanitizedApplicationAssertion(assertion);
    if (validated.ordinal !== index + 1) {
      fail("DELTA17_PROJECTION_ASSERTION");
    }
  }
  return deepFreeze({
    decidable_assertions: projection.assertions.length,
    projection_sufficiency: "COMPLETE",
    projection_sufficiency_matrix_sha256: delta17Sha256(
      canonicalJson({
        assertions: projection.assertions,
        entities: projection.entities,
        oracle_contract_sha256: projection.oracle_contract_sha256,
      }),
    ),
  });
}

export function deriveDelta17PoststateOracleQualifiedFinalTarget(value) {
  const keys = [
    "baseline",
    "registration_commit_sha",
    "activation_commit_sha",
    "passing_preview_id",
    "marker_sha256",
    "persisted_state_oracle_sha256",
    "projection_sufficiency_matrix_sha256",
    "mutating_qualification_evidence_sha256",
    "qualification_cleanup_evidence_sha256",
    "branch_env_cleanup_evidence_sha256",
    "authorized_path_manifest_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA17_TARGET_SHAPE");
  if (
    value.baseline !== BASELINE ||
    value.marker_sha256 !== DELTA17_MARKER_SHA256 ||
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id)
  ) {
    fail("DELTA17_TARGET_IDENTITY");
  }
  for (const name of keys.slice(5)) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA17_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA17_POSTSTATE_ORACLE_QUALIFIED_FINAL_RUNTIME_V1",
        DELTA17_BRANCH,
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta17PoststateOracleQualifiedAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA17_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA17_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_POSTSTATE_ORACLE_QUALIFIED_FINAL_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) fail("DELTA17_AUTHORIZATION");
  return value.target_sha256;
}

export function deriveDelta18DurableProjectionFinalTarget(value) {
  const keys = [
    "activation_commit_sha",
    "authorized_path_manifest_sha256",
    "baseline",
    "branch_env_cleanup_evidence_sha256",
    "journal_schema_sha256",
    "marker_sha256",
    "passing_preview_id",
    "projection_sufficiency_matrix_sha256",
    "qualification_cleanup_evidence_sha256",
    "qualification_journal_sha256",
    "registration_commit_sha",
    "request_identity_contract_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA18_TARGET_SHAPE");
  if (
    value.baseline !== BASELINE ||
    value.marker_sha256 !== DELTA14_MARKER_SHA256 ||
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id)
  ) {
    fail("DELTA18_TARGET_IDENTITY");
  }
  for (const name of keys.filter((name) => name.endsWith("_sha256"))) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA18_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA18_DURABLE_PROJECTION_FINAL_RUNTIME_V1",
        DELTA13_BRANCH,
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta18DurableProjectionFinalAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA18_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA18_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_DURABLE_PROJECTION_FINAL_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) fail("DELTA18_AUTHORIZATION");
  return value.target_sha256;
}

export function deriveDelta20VerifiedPublicationFinalTarget(value) {
  const keys = [
    "activation_commit_sha",
    "authorized_path_manifest_sha256",
    "baseline",
    "branch_env_cleanup_evidence_sha256",
    "delta20_active_lock_sha256",
    "delta20_authority_sha256",
    "delta20_lineage_receipt_sha256",
    "false_drift_repair_evidence_sha256",
    "immutable_manifest_sha256",
    "marker_sha256",
    "passing_preview_id",
    "prior_residue_reconciliation_evidence_sha256",
    "qualification_cleanup_receipt_sha256",
    "qualification_projection_sha256",
    "qualification_publication_receipt_sha256",
    "qualification_retirement_receipt_sha256",
    "registration_commit_sha",
    "stdin_secret_transport_evidence_sha256",
    "testing_tree_sha256",
  ];
  requireExactKeys(value, keys, "DELTA20_TARGET_SHAPE");
  if (
    value.baseline !== BASELINE ||
    value.delta20_authority_sha256 !==
      "efb3bf384da9b9f03c3ea97ca1f311a86ac17fcc6fac120d138796f557c732d7" ||
    value.marker_sha256 !== DELTA14_MARKER_SHA256 ||
    !/^[a-f0-9]{40}$/u.test(value.registration_commit_sha) ||
    !/^[a-f0-9]{40}$/u.test(value.activation_commit_sha) ||
    value.registration_commit_sha === value.activation_commit_sha ||
    !/^dpl_[A-Za-z0-9]+$/u.test(value.passing_preview_id)
  ) {
    fail("DELTA20_TARGET_IDENTITY");
  }
  for (const name of keys.filter((name) => name.endsWith("_sha256"))) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA20_TARGET_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA20_VERIFIED_EVIDENCE_PUBLICATION_FINAL_RUNTIME_V1",
        DELTA13_BRANCH,
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta20VerifiedPublicationFinalAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "target_sha256"],
    "DELTA20_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.target_sha256)) {
    fail("DELTA20_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_VERIFIED_PUBLICATION_FINAL_TARGET_" +
    value.target_sha256;
  if (value.authorization !== expected) fail("DELTA20_AUTHORIZATION");
  return value.target_sha256;
}

export function deriveDelta09ReboundTarget(value) {
  const keys = [
    "team_id",
    "project_id",
    "preview_id",
    "git_branch",
    "git_commit",
    "baseline",
    "required_five_name_contract",
    "optional_supabase_url_alias_contract",
    "canonical_orchestrator_sha256",
    "reviewed_pre_aggregate_sha256",
    "reviewed_stable_surface_sha256",
    "manifest_runtime_surface_sha256",
    "testing_tree_sha256",
    "exact_18_path_manifest_sha256",
  ];
  requireExactKeys(value, keys, "DELTA09_REBOUND_TARGET_SHAPE");
  const expected = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    preview_id: "dpl_8DFSeAmw3qx6ETsYx9LWcHz5w9wK",
    git_branch: BRANCH,
    git_commit: "d604b66bf1bf43050395520ce0b63ee0ae6e4140",
    baseline: BASELINE,
    required_five_name_contract: PLAN.environment_names.join(","),
    optional_supabase_url_alias_contract:
      "SUPABASE_URL=OPTIONAL_COMPATIBILITY_ALIAS_NOT_CREATED",
  };
  for (const [name, expectedValue] of Object.entries(expected)) {
    if (value[name] !== expectedValue) fail(`DELTA09_REBOUND_${name.toUpperCase()}`);
  }
  for (const name of keys.slice(8)) {
    if (!/^[a-f0-9]{64}$/u.test(value[name])) {
      fail(`DELTA09_REBOUND_${name.toUpperCase()}`);
    }
  }
  return createHash("sha256")
    .update(
      [
        "AIFINDER_PHASE_34IA_DELTA09_REBOUND_V1",
        ...keys.map((name) => value[name]),
      ].join("|"),
      "utf8",
    )
    .digest("hex");
}

export function validateDelta09ReboundAuthorization(value) {
  requireExactKeys(
    value,
    ["authorization", "rebound_target_sha256"],
    "DELTA09_REBOUND_AUTHORIZATION_SHAPE",
  );
  if (!/^[a-f0-9]{64}$/u.test(value.rebound_target_sha256)) {
    fail("DELTA09_REBOUND_AUTHORIZATION_TARGET");
  }
  const expected =
    "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_REBOUND_TARGET_" +
    value.rebound_target_sha256;
  if (value.authorization !== expected) {
    fail("DELTA09_REBOUND_AUTHORIZATION");
  }
  return value.rebound_target_sha256;
}

function deploymentProjectFacts(deployment) {
  const facts = [];
  if (Object.hasOwn(deployment, "project")) {
    if (
      !deployment.project ||
      typeof deployment.project !== "object" ||
      Array.isArray(deployment.project) ||
      typeof deployment.project.id !== "string" ||
      typeof deployment.project.name !== "string"
    ) {
      fail("DEPLOYMENT_PROJECT_SHAPE");
    }
    facts.push({
      id: deployment.project.id,
      name: deployment.project.name,
    });
  }
  const hasTopLevelProject =
    Object.hasOwn(deployment, "projectId") ||
    Object.hasOwn(deployment, "name");
  if (hasTopLevelProject) {
    if (
      typeof deployment.projectId !== "string" ||
      typeof deployment.name !== "string"
    ) {
      fail("DEPLOYMENT_PROJECT_SHAPE");
    }
    facts.push({ id: deployment.projectId, name: deployment.name });
  }
  if (facts.length === 0) fail("DEPLOYMENT_PROJECT_SHAPE");
  return facts;
}

export function validateGithubDeploymentAdvisory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("GITHUB_DEPLOYMENT_ADVISORY_INPUT");
  }
  const {
    deployments,
    expected_commit: expectedCommit,
    expected_ref: expectedRef,
    expected_repository: expectedRepository,
  } = value;
  if (
    typeof expectedCommit !== "string" ||
    !/^[a-f0-9]{40}$/u.test(expectedCommit) ||
    typeof expectedRef !== "string" ||
    expectedRef.length === 0 ||
    expectedRepository !== PLAN.project.repository
  ) {
    fail("GITHUB_DEPLOYMENT_ADVISORY_EXPECTED_IDENTITY");
  }
  if (deployments === null) {
    return deepFreeze({
      available: false,
      matching_records: 0,
      records_observed: 0,
    });
  }
  if (!Array.isArray(deployments) || deployments.length > 100) {
    fail("GITHUB_DEPLOYMENT_ADVISORY_RECORDS");
  }
  for (const deployment of deployments) {
    if (
      !deployment ||
      typeof deployment !== "object" ||
      Array.isArray(deployment) ||
      deployment.sha !== expectedCommit ||
      deployment.ref !== expectedRef
    ) {
      fail("GITHUB_DEPLOYMENT_ADVISORY_GIT_CONTRADICTION");
    }
    const repositoryValues = [];
    if (typeof deployment.repository === "string") {
      repositoryValues.push(deployment.repository);
    }
    if (
      deployment.repository &&
      typeof deployment.repository === "object" &&
      !Array.isArray(deployment.repository) &&
      typeof deployment.repository.full_name === "string"
    ) {
      repositoryValues.push(deployment.repository.full_name);
    }
    if (typeof deployment.repo === "string") {
      repositoryValues.push(deployment.repo);
    }
    if (typeof deployment.repository_url === "string") {
      const prefix = "https://api.github.com/repos/";
      if (!deployment.repository_url.startsWith(prefix)) {
        fail("GITHUB_DEPLOYMENT_ADVISORY_REPOSITORY_CONTRADICTION");
      }
      repositoryValues.push(deployment.repository_url.slice(prefix.length));
    }
    if (
      repositoryValues.some(
        (repository) => repository !== expectedRepository,
      )
    ) {
      fail("GITHUB_DEPLOYMENT_ADVISORY_REPOSITORY_CONTRADICTION");
    }
  }
  return deepFreeze({
    available: true,
    matching_records: deployments.length,
    records_observed: deployments.length,
  });
}

function deploymentAliasMetadata(record, deployment) {
  const branchAliases = [];
  const aliasCollections = [];
  for (const candidate of [record, deployment]) {
    if (
      candidate?.meta &&
      typeof candidate.meta === "object" &&
      !Array.isArray(candidate.meta) &&
      Object.hasOwn(candidate.meta, "branchAlias") &&
      candidate.meta.branchAlias !== null &&
      candidate.meta.branchAlias !== undefined
    ) {
      if (
        typeof candidate.meta.branchAlias !== "string" ||
        candidate.meta.branchAlias.length === 0
      ) {
        fail("MALFORMED_ALIAS_METADATA");
      }
      branchAliases.push(candidate.meta.branchAlias);
    }
    for (const key of ["alias", "aliases"]) {
      if (
        Object.hasOwn(candidate ?? {}, key) &&
        candidate[key] !== null &&
        candidate[key] !== undefined
      ) {
        if (
          !Array.isArray(candidate[key]) ||
          candidate[key].some(
            (alias) => typeof alias !== "string" || alias.length === 0,
          )
        ) {
          fail("MALFORMED_ALIAS_METADATA");
        }
        if (candidate[key].length > 1) {
          fail("UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS");
        }
        aliasCollections.push(candidate[key]);
      }
    }
  }
  const distinctBranchAliases = new Set(branchAliases);
  if (distinctBranchAliases.size > 1) {
    fail("MALFORMED_ALIAS_METADATA");
  }
  const aliases = new Set(aliasCollections.flat());
  if (aliases.size > 1) {
    fail("UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS");
  }
  if (aliases.size === 1) {
    const [alias] = aliases;
    const [branchAlias] = distinctBranchAliases;
    if (branchAlias === undefined || alias !== branchAlias) {
      fail("UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS");
    }
  }
  return deepFreeze({ alias_count: aliases.size });
}

export function validateDeploymentIdentity(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("DEPLOYMENT_INPUT");
  }
  const {
    inventory,
    deployment,
    expected_commit: expectedCommit,
    expected_ref: expectedRef,
    expected_repository: expectedRepository,
    expected_project_id: expectedProjectId,
    expected_project_name: expectedProjectName,
    expected_team_id: expectedTeamId,
    github_deployment_advisory: githubDeploymentAdvisory,
  } = value;
  if (!Array.isArray(inventory) || inventory.length !== 1) {
    fail("DEPLOYMENT_INVENTORY_UNIQUE");
  }
  const [record] = inventory;
  if (!record || typeof record !== "object" || !deployment || typeof deployment !== "object") {
    fail("DEPLOYMENT_RECORD");
  }
  const deploymentId = deployment.id;
  const v13DeploymentIdentifiers = [deployment.id, deployment.uid].filter(
    (identifier) => identifier !== undefined && identifier !== null,
  );
  if (
    typeof deploymentId !== "string" ||
    !/^dpl_[A-Za-z0-9]+$/u.test(deploymentId) ||
    v13DeploymentIdentifiers.length === 0 ||
    !v13DeploymentIdentifiers.every(
      (identifier) => identifier === deploymentId,
    )
  ) {
    fail("DEPLOYMENT_ID");
  }
  for (const optionalId of [record.id, record.uid].filter(Boolean)) {
    if (optionalId !== deploymentId) fail("DEPLOYMENT_INVENTORY_ID");
  }
  const inventoryUrl = normalizedHostname(record.url, "DEPLOYMENT_INVENTORY_URL");
  const deploymentUrl = normalizedHostname(deployment.url, "DEPLOYMENT_V13_URL");
  if (inventoryUrl !== deploymentUrl) fail("DEPLOYMENT_URL_MISMATCH");
  if (
    !deploymentUrl.endsWith(".vercel.app") ||
    deploymentUrl === `${PLAN.project.project_name}.vercel.app`
  ) {
    fail("DEPLOYMENT_PREVIEW_HOSTNAME");
  }
  const inventoryReady = record.readyState ?? record.state;
  const deploymentReady = deployment.readyState ?? deployment.state;
  if (inventoryReady !== "READY" || deploymentReady !== "READY") {
    fail("DEPLOYMENT_NOT_READY");
  }
  const previewTargets = new Set([null, "preview"]);
  if (
    !Object.hasOwn(record, "target") ||
    !Object.hasOwn(deployment, "target") ||
    !previewTargets.has(record.target) ||
    !previewTargets.has(deployment.target) ||
    (Object.hasOwn(record, "production") && record.production !== false) ||
    (Object.hasOwn(deployment, "production") &&
      deployment.production !== false)
  ) {
    fail("DEPLOYMENT_PRODUCTION");
  }
  const projectFacts = deploymentProjectFacts(deployment);
  if (
    !projectFacts.every(
      (project) =>
        project.id === expectedProjectId &&
        project.name === expectedProjectName,
    ) ||
    expectedProjectId !== PLAN.project.project_id ||
    expectedProjectName !== PLAN.project.project_name
  ) {
    fail("DEPLOYMENT_PROJECT");
  }
  const deploymentTeamValues = [
    deployment.ownerId,
    deployment.teamId,
    deployment.project?.accountId,
  ].filter((candidate) => candidate !== null && candidate !== undefined);
  if (
    expectedTeamId !== PLAN.project.team_id ||
    deploymentTeamValues.length === 0 ||
    !deploymentTeamValues.every((candidate) => candidate === expectedTeamId)
  ) {
    fail("DEPLOYMENT_TEAM");
  }
  if (
    typeof expectedCommit !== "string" ||
    !/^[a-f0-9]{40}$/u.test(expectedCommit) ||
    expectedRef !== PLAN.branch ||
    expectedRepository !== PLAN.project.repository
  ) {
    fail("DEPLOYMENT_EXPECTED_GIT");
  }
  const inventoryMeta = record.meta ?? {};
  if (
    inventoryMeta.githubCommitSha !== expectedCommit ||
    inventoryMeta.githubCommitRef !== expectedRef ||
    inventoryMeta.githubCommitRepo !== "aifinder" ||
    inventoryMeta.githubCommitOrg !== "jcdumaua"
  ) {
    fail("DEPLOYMENT_INVENTORY_GIT");
  }
  const sources = [deployment.gitSource, deployment.meta, deployment.gitMetadata]
    .filter((source) => source && typeof source === "object");
  let v13CommitSeen = false;
  let v13RefSeen = false;
  let v13RepositorySeen = false;
  for (const source of sources) {
    const commit = gitValue(source, ["sha", "commitSha", "githubCommitSha"]);
    const ref = gitValue(source, ["ref", "commitRef", "githubCommitRef"]);
    const repository = gitValue(source, ["repo", "repository", "githubCommitRepo"]);
    if (commit !== null && commit !== expectedCommit) fail("DEPLOYMENT_V13_COMMIT");
    if (ref !== null && ref !== expectedRef) fail("DEPLOYMENT_V13_REF");
    if (
      repository !== null &&
      repository !== expectedRepository &&
      repository !== "aifinder"
    ) {
      fail("DEPLOYMENT_V13_REPOSITORY");
    }
    v13CommitSeen ||= commit !== null;
    v13RefSeen ||= ref !== null;
    v13RepositorySeen ||= repository !== null;
  }
  if (!v13CommitSeen || !v13RefSeen || !v13RepositorySeen) {
    fail("DEPLOYMENT_V13_GIT_INCOMPLETE");
  }
  if (
    !githubDeploymentAdvisory ||
    typeof githubDeploymentAdvisory !== "object" ||
    Array.isArray(githubDeploymentAdvisory) ||
    typeof githubDeploymentAdvisory.available !== "boolean" ||
    !Number.isInteger(githubDeploymentAdvisory.matching_records) ||
    githubDeploymentAdvisory.matching_records < 0 ||
    !Number.isInteger(githubDeploymentAdvisory.records_observed) ||
    githubDeploymentAdvisory.records_observed < 0 ||
    (githubDeploymentAdvisory.available === false &&
      (githubDeploymentAdvisory.matching_records !== 0 ||
        githubDeploymentAdvisory.records_observed !== 0))
  ) {
    fail("DEPLOYMENT_GITHUB_ADVISORY_SHAPE");
  }
  const aliasMetadata = deploymentAliasMetadata(record, deployment);
  return deepFreeze({
    classification: "EXACT_NONPRODUCTION_PREVIEW_IDENTITY",
    ready: true,
    deployment_id: deploymentId,
    hostname_match: true,
    rest_v13_identity: "PASS",
    production: false,
    aliases: aliasMetadata.alias_count,
  });
}

export function classifyDeploymentIdentity(value) {
  try {
    validateDeploymentIdentity(value);
    return "EXACT_NONPRODUCTION_PREVIEW_IDENTITY";
  } catch (caught) {
    if (caught?.code === "DEPLOYMENT_PRODUCTION") {
      return "PRODUCTION_TARGET_FORBIDDEN";
    }
    if (caught?.code === "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS") {
      return "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS";
    }
    if (caught?.code === "MALFORMED_ALIAS_METADATA") {
      return "MALFORMED_ALIAS_METADATA";
    }
    return "CONTROLLING_IDENTITY_MISMATCH";
  }
}

export function validateExistingPreviewResumeState(value) {
  requireExactKeys(
    value,
    [
      "deployment_identity",
      "expected_deployment_id",
      "runtime_sessions",
      "application_requests",
      "data_requests",
      "data_writes",
      "target_confirmation_count",
      "temporary_remote_branch_states",
      "preview_count",
    ],
    "PREVIEW_RESUME_STATE_SHAPE",
  );
  const classification = classifyDeploymentIdentity(
    value.deployment_identity,
  );
  if (classification !== "EXACT_NONPRODUCTION_PREVIEW_IDENTITY") {
    fail(classification);
  }
  const deploymentId = value.deployment_identity?.deployment?.id;
  if (
    typeof value.expected_deployment_id !== "string" ||
    value.expected_deployment_id !== deploymentId
  ) {
    fail("CONTROLLING_IDENTITY_MISMATCH");
  }
  if (
    value.runtime_sessions !== 0 ||
    value.application_requests !== 0 ||
    value.data_requests !== 0 ||
    value.data_writes !== 0 ||
    value.target_confirmation_count !== 1 ||
    !exactArray(value.temporary_remote_branch_states, [
      "ABSENT",
      "ABSENT",
    ]) ||
    value.preview_count !== 1
  ) {
    fail("PREVIEW_RESUME_STATE_INVALID");
  }
  return deepFreeze({
    state: "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME",
    deployment_id: deploymentId,
    branch_absence_checks: 2,
    preview_count: 1,
    target_confirmation_count: 1,
    runtime_sessions: 0,
    application_requests: 0,
    data_requests: 0,
    data_writes: 0,
  });
}

const REQUIRED_PERMISSION_FEATURES = Object.freeze([
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "magnetometer",
  "gyroscope",
  "accelerometer",
]);
const SECURITY_HEADER_PROJECTION_KEYS = Object.freeze([
  "status_class",
  "application_body_shape",
  "application_response_identity",
  "cache_control_no_store",
  "x_content_type_options_nosniff",
  "x_frame_options_deny",
  "referrer_policy_strict_origin_when_cross_origin",
  "x_dns_prefetch_control_off",
  "cross_origin_opener_policy_same_origin",
  "permissions_camera_disabled",
  "permissions_microphone_disabled",
  "permissions_geolocation_disabled",
  "permissions_payment_disabled",
  "permissions_usb_disabled",
  "permissions_magnetometer_disabled",
  "permissions_gyroscope_disabled",
  "permissions_accelerometer_disabled",
  "csp_frame_ancestors_none",
  "csp_base_uri_self",
  "csp_form_action_self",
  "csp_object_src_none",
  "hsts_present",
  "hsts_max_age_class",
  "hsts_include_subdomains",
  "hsts_preload",
  "x_robots_tag_noindex_advisory",
  "disposition",
]);
const SECURITY_HEADER_STATUS_CLASSES = Object.freeze([
  "EXPECTED_401",
  "HTTP_3XX",
  "HTTP_403",
  "HTTP_404",
  "HTTP_OTHER_4XX",
  "HTTP_5XX",
  "OTHER",
]);

function asciiWhitespace(byte) {
  return byte === 0x20 || byte === 0x09;
}

function trimmedAsciiView(bytes) {
  let start = 0;
  let end = bytes.byteLength;
  while (start < end && asciiWhitespace(bytes[start])) start += 1;
  while (end > start && asciiWhitespace(bytes[end - 1])) end -= 1;
  return bytes.subarray(start, end);
}

function splitByte(bytes, delimiter) {
  const parts = [];
  let start = 0;
  for (let index = 0; index <= bytes.byteLength; index += 1) {
    if (index < bytes.byteLength && bytes[index] !== delimiter) continue;
    parts.push(bytes.subarray(start, index));
    start = index + 1;
  }
  return parts;
}

function lowerAsciiCopy(bytes, scratch) {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength > 16 * 1024) return null;
  const lowered = Buffer.alloc(bytes.byteLength);
  scratch.push(lowered);
  for (let index = 0; index < bytes.byteLength; index += 1) {
    const byte = bytes[index];
    if (!(byte === 0x09 || (byte >= 0x20 && byte <= 0x7e))) return null;
    lowered[index] = byte >= 0x41 && byte <= 0x5a ? byte + 0x20 : byte;
  }
  return lowered;
}

function asciiEquals(bytes, literal) {
  const expected = Buffer.from(literal, "ascii");
  return bytes.byteLength === expected.byteLength && bytes.equals(expected);
}

function asciiToken(bytes) {
  if (bytes.byteLength === 0) return false;
  return bytes.every(
    (byte) =>
      (byte >= 0x61 && byte <= 0x7a) ||
      (byte >= 0x30 && byte <= 0x39) ||
      [
        0x21,
        0x23,
        0x24,
        0x25,
        0x26,
        0x27,
        0x2a,
        0x2b,
        0x2d,
        0x2e,
        0x5e,
        0x5f,
        0x60,
        0x7c,
        0x7e,
      ].includes(byte),
  );
}

function decimalAscii(bytes) {
  if (
    bytes.byteLength === 0 ||
    !bytes.every((byte) => byte >= 0x30 && byte <= 0x39)
  ) {
    return null;
  }
  let value = 0;
  for (const byte of bytes) {
    value = value * 10 + byte - 0x30;
    if (!Number.isSafeInteger(value)) return null;
  }
  return value;
}

function whitespaceTokens(bytes) {
  const tokens = [];
  let start = null;
  for (let index = 0; index <= bytes.byteLength; index += 1) {
    const separator =
      index === bytes.byteLength || asciiWhitespace(bytes[index]);
    if (!separator && start === null) start = index;
    if (separator && start !== null) {
      tokens.push(bytes.subarray(start, index));
      start = null;
    }
  }
  return tokens;
}

function exactSingletonHeader(grouped, name, literal, scratch) {
  const values = grouped.get(name) ?? [];
  if (values.length !== 1) return false;
  const lowered = lowerAsciiCopy(values[0], scratch);
  return lowered !== null && asciiEquals(trimmedAsciiView(lowered), literal);
}

function cacheControlNoStore(grouped, scratch) {
  const values = grouped.get("cache-control") ?? [];
  if (values.length === 0) return false;
  let valid = true;
  let noStore = false;
  let contradictory = false;
  for (const value of values) {
    const lowered = lowerAsciiCopy(value, scratch);
    if (lowered === null) {
      valid = false;
      continue;
    }
    for (const rawDirective of splitByte(lowered, 0x2c)) {
      const directive = trimmedAsciiView(rawDirective);
      if (directive.byteLength === 0) {
        valid = false;
        continue;
      }
      const equalIndex = directive.indexOf(0x3d);
      const name = trimmedAsciiView(
        equalIndex === -1 ? directive : directive.subarray(0, equalIndex),
      );
      const argument =
        equalIndex === -1
          ? null
          : trimmedAsciiView(directive.subarray(equalIndex + 1));
      if (!asciiToken(name) || (argument !== null && argument.byteLength === 0)) {
        valid = false;
        continue;
      }
      if (asciiEquals(name, "no-store")) {
        if (argument !== null) valid = false;
        noStore = true;
      }
      if (asciiEquals(name, "public")) contradictory = true;
      if (
        argument !== null &&
        (asciiEquals(name, "max-age") || asciiEquals(name, "s-maxage"))
      ) {
        const age = decimalAscii(argument);
        if (age === null) valid = false;
        else if (age > 0) contradictory = true;
      }
    }
  }
  return valid && noStore && !contradictory;
}

function permissionsPolicyFacts(grouped, scratch) {
  const facts = Object.fromEntries(
    REQUIRED_PERMISSION_FEATURES.map((feature) => [feature, false]),
  );
  const values = grouped.get("permissions-policy") ?? [];
  if (values.length !== 1) return facts;
  const lowered = lowerAsciiCopy(values[0], scratch);
  if (lowered === null) return facts;
  const observations = new Map();
  let valid = true;
  for (const rawDirective of splitByte(lowered, 0x2c)) {
    const directive = trimmedAsciiView(rawDirective);
    const equalIndex = directive.indexOf(0x3d);
    if (equalIndex <= 0 || directive.indexOf(0x3d, equalIndex + 1) !== -1) {
      valid = false;
      continue;
    }
    const feature = trimmedAsciiView(directive.subarray(0, equalIndex));
    const policy = trimmedAsciiView(directive.subarray(equalIndex + 1));
    if (
      !asciiToken(feature) ||
      policy.byteLength < 2 ||
      policy[0] !== 0x28 ||
      policy.at(-1) !== 0x29
    ) {
      valid = false;
      continue;
    }
    for (const required of REQUIRED_PERMISSION_FEATURES) {
      if (!asciiEquals(feature, required)) continue;
      const prior = observations.get(required) ?? [];
      prior.push(
        trimmedAsciiView(policy.subarray(1, policy.byteLength - 1))
          .byteLength === 0,
      );
      observations.set(required, prior);
    }
  }
  if (!valid) return facts;
  for (const feature of REQUIRED_PERMISSION_FEATURES) {
    const entries = observations.get(feature) ?? [];
    facts[feature] = entries.length === 1 && entries[0] === true;
  }
  return facts;
}

function cspFacts(grouped, scratch) {
  const facts = {
    frameAncestorsNone: false,
    baseUriSelf: false,
    formActionSelf: false,
    objectSrcNone: false,
  };
  const values = grouped.get("content-security-policy") ?? [];
  if (values.length !== 1) return facts;
  const lowered = lowerAsciiCopy(values[0], scratch);
  if (lowered === null) return facts;
  const observations = new Map();
  let valid = true;
  for (const rawDirective of splitByte(lowered, 0x3b)) {
    const directive = trimmedAsciiView(rawDirective);
    if (directive.byteLength === 0) continue;
    const tokens = whitespaceTokens(directive);
    if (tokens.length === 0 || !asciiToken(tokens[0])) {
      valid = false;
      continue;
    }
    for (const required of [
      "frame-ancestors",
      "base-uri",
      "form-action",
      "object-src",
    ]) {
      if (!asciiEquals(tokens[0], required)) continue;
      const prior = observations.get(required) ?? [];
      prior.push(tokens);
      observations.set(required, prior);
    }
  }
  const exactDirective = (name, expected) => {
    const entries = observations.get(name) ?? [];
    return (
      valid &&
      entries.length === 1 &&
      entries[0].length === 2 &&
      asciiEquals(entries[0][1], expected)
    );
  };
  facts.frameAncestorsNone = exactDirective("frame-ancestors", "'none'");
  facts.baseUriSelf = exactDirective("base-uri", "'self'");
  facts.formActionSelf = exactDirective("form-action", "'self'");
  facts.objectSrcNone = exactDirective("object-src", "'none'");
  return facts;
}

function hstsFacts(grouped, scratch) {
  const values = grouped.get("strict-transport-security") ?? [];
  const present = values.length > 0;
  if (values.length !== 1) {
    return {
      present,
      maxAgeClass: present ? "LT_ONE_YEAR" : "ABSENT",
      includeSubdomains: false,
      preload: false,
      sufficient: false,
    };
  }
  const lowered = lowerAsciiCopy(values[0], scratch);
  if (lowered === null) {
    return {
      present: true,
      maxAgeClass: "LT_ONE_YEAR",
      includeSubdomains: false,
      preload: false,
      sufficient: false,
    };
  }
  let valid = true;
  let maxAge = null;
  let maxAgeCount = 0;
  let includeSubdomainsCount = 0;
  let preloadCount = 0;
  for (const rawDirective of splitByte(lowered, 0x3b)) {
    const directive = trimmedAsciiView(rawDirective);
    if (directive.byteLength === 0) continue;
    const equalIndex = directive.indexOf(0x3d);
    if (equalIndex === -1) {
      if (!asciiToken(directive)) {
        valid = false;
      } else if (asciiEquals(directive, "includesubdomains")) {
        includeSubdomainsCount += 1;
      } else if (asciiEquals(directive, "preload")) {
        preloadCount += 1;
      }
      continue;
    }
    if (directive.indexOf(0x3d, equalIndex + 1) !== -1) {
      valid = false;
      continue;
    }
    const name = trimmedAsciiView(directive.subarray(0, equalIndex));
    const argument = trimmedAsciiView(directive.subarray(equalIndex + 1));
    if (!asciiToken(name) || argument.byteLength === 0) {
      valid = false;
      continue;
    }
    if (asciiEquals(name, "max-age")) {
      maxAgeCount += 1;
      maxAge = decimalAscii(argument);
      if (maxAge === null) valid = false;
    }
  }
  valid &&= maxAgeCount === 1;
  valid &&= includeSubdomainsCount <= 1 && preloadCount <= 1;
  const classifiedAge = valid ? maxAge : null;
  const maxAgeClass =
    classifiedAge === null || classifiedAge < 31_536_000
      ? "LT_ONE_YEAR"
      : classifiedAge < 63_072_000
        ? "ONE_TO_TWO_YEARS"
        : "AT_LEAST_TWO_YEARS";
  return {
    present: true,
    maxAgeClass,
    includeSubdomains: valid && includeSubdomainsCount === 1,
    preload: valid && preloadCount === 1,
    sufficient: valid && classifiedAge >= 31_536_000,
  };
}

function robotsNoindexAdvisory(grouped, scratch) {
  for (const value of grouped.get("x-robots-tag") ?? []) {
    const lowered = lowerAsciiCopy(value, scratch);
    if (lowered === null) continue;
    for (const directive of splitByte(lowered, 0x2c)) {
      if (asciiEquals(trimmedAsciiView(directive), "noindex")) return true;
    }
  }
  return false;
}

function httpStatusFromLine(line) {
  const prefix = Buffer.from("HTTP/", "ascii");
  if (
    line.byteLength < prefix.byteLength + 5 ||
    !line.subarray(0, prefix.byteLength).equals(prefix)
  ) {
    return null;
  }
  const space = line.indexOf(0x20);
  if (
    space < prefix.byteLength + 1 ||
    space + 4 > line.byteLength ||
    !line
      .subarray(space + 1, space + 4)
      .every((byte) => byte >= 0x30 && byte <= 0x39) ||
    (space + 4 < line.byteLength && line[space + 4] !== 0x20)
  ) {
    return null;
  }
  return (
    (line[space + 1] - 0x30) * 100 +
    (line[space + 2] - 0x30) * 10 +
    line[space + 3] -
    0x30
  );
}

export function projectHttpResponseHeaderBuffers(rawHeaderBytes) {
  const owned = [];
  let returned = false;
  try {
    if (
      !Buffer.isBuffer(rawHeaderBytes) ||
      rawHeaderBytes.byteLength === 0 ||
      rawHeaderBytes.byteLength > 128 * 1024 ||
      rawHeaderBytes.includes(0x00)
    ) {
      fail("HTTP_HEADER_PROJECTION_INPUT");
    }
    const allowedSecurityNames = new Set([
      "cache-control",
      "x-content-type-options",
      "x-frame-options",
      "referrer-policy",
      "x-dns-prefetch-control",
      "cross-origin-opener-policy",
      "permissions-policy",
      "content-security-policy",
      "strict-transport-security",
      "x-robots-tag",
    ]);
    let block = null;
    let blockClosed = false;
    let lineStart = 0;
    for (let index = 0; index <= rawHeaderBytes.byteLength; index += 1) {
      if (index < rawHeaderBytes.byteLength && rawHeaderBytes[index] !== 0x0a) {
        continue;
      }
      let lineEnd = index;
      if (lineEnd > lineStart && rawHeaderBytes[lineEnd - 1] === 0x0d) {
        lineEnd -= 1;
      }
      const line = rawHeaderBytes.subarray(lineStart, lineEnd);
      lineStart = index + 1;
      const status = httpStatusFromLine(line);
      if (status !== null) {
        if (block) {
          for (const buffer of [
            ...block.security_header_fields.map((field) => field.value),
            ...block.allow_values,
            ...block.set_cookie_values,
          ]) {
            buffer.fill(0);
          }
        }
        block = {
          status,
          security_header_fields: [],
          allow_values: [],
          set_cookie_values: [],
        };
        blockClosed = false;
        continue;
      }
      if (!block) {
        if (line.byteLength !== 0) fail("HTTP_HEADER_STATUS_LINE");
        continue;
      }
      if (line.byteLength === 0) {
        blockClosed = true;
        continue;
      }
      if (blockClosed) fail("HTTP_HEADER_BLOCK_TRAILING_DATA");
      const colon = line.indexOf(0x3a);
      if (colon <= 0) fail("HTTP_HEADER_LINE");
      const nameBytes = trimmedAsciiView(line.subarray(0, colon));
      if (
        nameBytes.byteLength === 0 ||
        nameBytes.byteLength > 128 ||
        !nameBytes.every(
          (byte) =>
            (byte >= 0x41 && byte <= 0x5a) ||
            (byte >= 0x61 && byte <= 0x7a) ||
            (byte >= 0x30 && byte <= 0x39) ||
            byte === 0x2d,
        )
      ) {
        fail("HTTP_HEADER_NAME");
      }
      const name = nameBytes.toString("ascii").toLowerCase();
      if (
        !allowedSecurityNames.has(name) &&
        name !== "allow" &&
        name !== "set-cookie"
      ) {
        continue;
      }
      const value = Buffer.from(
        trimmedAsciiView(line.subarray(colon + 1)),
      );
      owned.push(value);
      if (value.byteLength > 16 * 1024) fail("HTTP_HEADER_VALUE_BOUND");
      if (allowedSecurityNames.has(name)) {
        block.security_header_fields.push(Object.freeze({ name, value }));
      } else if (name === "allow") {
        block.allow_values.push(value);
      } else {
        block.set_cookie_values.push(value);
      }
      if (
        block.security_header_fields.length +
          block.allow_values.length +
          block.set_cookie_values.length >
        64
      ) {
        fail("HTTP_HEADER_FIELD_BOUND");
      }
    }
    if (!block || !blockClosed) fail("HTTP_HEADER_BLOCK_INCOMPLETE");
    returned = true;
    return block;
  } finally {
    if (Buffer.isBuffer(rawHeaderBytes)) rawHeaderBytes.fill(0);
    if (!returned) {
      for (const buffer of owned) buffer.fill(0);
    }
  }
}

function bufferContainsAscii(bytes, literal, scratch) {
  const lowered = lowerAsciiCopy(bytes, scratch);
  if (lowered === null) return false;
  const expected = Buffer.from(literal.toLowerCase(), "ascii");
  return lowered.indexOf(expected) !== -1;
}

export function classifyAuxiliaryResponseHeaderProjection(value) {
  const allowValues = Array.isArray(value?.allow_values)
    ? value.allow_values
    : [];
  const setCookieValues = Array.isArray(value?.set_cookie_values)
    ? value.set_cookie_values
    : [];
  const rawBuffers = [...allowValues, ...setCookieValues].filter((buffer) =>
    Buffer.isBuffer(buffer),
  );
  const scratch = [];
  try {
    requireExactKeys(
      value,
      ["allow_values", "set_cookie_values"],
      "AUXILIARY_HEADER_PROJECTION_SHAPE",
    );
    if (
      allowValues.length > 8 ||
      setCookieValues.length > 16 ||
      ![...allowValues, ...setCookieValues].every(
        (buffer) => Buffer.isBuffer(buffer) && buffer.byteLength <= 16 * 1024,
      )
    ) {
      fail("AUXILIARY_HEADER_PROJECTION_INPUT");
    }
    const allowExact =
      allowValues.length === 1 &&
      (() => {
        const lowered = lowerAsciiCopy(allowValues[0], scratch);
        return (
          lowered !== null &&
          asciiEquals(
            trimmedAsciiView(lowered),
            "get, post, put, delete",
          )
        );
      })();
    const sessionCookie = setCookieValues.find((buffer) =>
      bufferContainsAscii(buffer, "aifinder_admin_session=", scratch),
    );
    const csrfCookie = setCookieValues.find((buffer) =>
      bufferContainsAscii(buffer, "aifinder_admin_csrf_token=", scratch),
    );
    return deepFreeze({
      allow_methods_exact: allowExact,
      session_cookie_name_present: Boolean(sessionCookie),
      csrf_cookie_name_present: Boolean(csrfCookie),
      http_only: Boolean(
        sessionCookie && bufferContainsAscii(sessionCookie, "httponly", scratch),
      ),
      secure: Boolean(
        sessionCookie && bufferContainsAscii(sessionCookie, "secure", scratch),
      ),
      same_site_strict: Boolean(
        sessionCookie &&
          bufferContainsAscii(sessionCookie, "samesite=strict", scratch),
      ),
      max_age_14400: Boolean(
        sessionCookie &&
          bufferContainsAscii(sessionCookie, "max-age=14400", scratch),
      ),
      max_age_zero: setCookieValues.some((buffer) =>
        bufferContainsAscii(buffer, "max-age=0", scratch),
      ),
    });
  } finally {
    for (const buffer of rawBuffers) buffer.fill(0);
    for (const buffer of scratch) buffer.fill(0);
  }
}

function delta13PathClass(requestPath) {
  const classes = new Map([
    ["/api/admin/tools", "ADMIN_TOOLS"],
    ["/api/admin/login", "ADMIN_LOGIN"],
    ["/api/admin/session", "ADMIN_SESSION"],
    ["/api/admin/csrf", "ADMIN_CSRF"],
    ["/api/admin/submissions", "ADMIN_SUBMISSIONS"],
    ["/api/admin/upload-logo", "ADMIN_UPLOAD_LOGO"],
    ["/api/admin/logout", "ADMIN_LOGOUT"],
    ["/api/admin/discovery/sources", "ADMIN_DISCOVERY_SOURCES"],
    ["/api/admin/unknown.map", "ADMIN_UNKNOWN_EXTENSION"],
  ]);
  const result = classes.get(requestPath);
  if (!result) fail("DELTA13_RESPONSE_PATH_CLASS");
  return result;
}

function exactJsonObject(value, expected) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    canonicalJson(value) === canonicalJson(expected)
  );
}

function delta13BodyShape(requestOrdinal, rawBodyBytes) {
  let parsed;
  try {
    parsed = JSON.parse(rawBodyBytes.toString("utf8"));
  } catch {
    return "NON_JSON";
  }
  if (requestOrdinal === 1) {
    return exactJsonObject(parsed, { error: "Unauthorized" })
      ? "EXACT_UNAUTHENTICATED_TOOLS_JSON"
      : "OTHER_JSON";
  }
  if (requestOrdinal === 2) {
    if (
      exactJsonObject(parsed, {
        success: true,
        message: "Admin login successful.",
      })
    ) {
      return "EXACT_LOGIN_SUCCESS_JSON";
    }
    if (exactJsonObject(parsed, { error: "Invalid credentials." })) {
      return "EXACT_INVALID_CREDENTIALS_JSON";
    }
    if (exactJsonObject(parsed, { error: "Invalid login request." })) {
      return "EXACT_MALFORMED_REQUEST_JSON";
    }
    if (
      exactJsonObject(parsed, {
        error: "Too many login attempts. Please wait and try again.",
      })
    ) {
      return "EXACT_RATE_LIMITED_JSON";
    }
    if (
      exactJsonObject(parsed, {
        error: "Admin login is temporarily unavailable.",
      })
    ) {
      return "EXACT_CONFIGURATION_UNAVAILABLE_JSON";
    }
    return "OTHER_JSON";
  }
  if (requestOrdinal === 3) {
    if (exactJsonObject(parsed, { authenticated: true, role: "admin" })) {
      return "EXACT_AUTHENTICATED_SESSION_JSON";
    }
    if (
      exactJsonObject(parsed, {
        authenticated: false,
        message: "Unauthorized.",
      })
    ) {
      return "EXACT_UNAUTHENTICATED_SESSION_JSON";
    }
    return "OTHER_JSON";
  }
  if (requestOrdinal === 4) {
    const keys =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.keys(parsed).sort()
        : [];
    return (
      canonicalJson(keys) === canonicalJson(["csrfToken", "success"]) &&
      parsed.success === true &&
      typeof parsed.csrfToken === "string" &&
      /^[a-f0-9]{64}$/u.test(parsed.csrfToken)
    )
      ? "EXACT_CSRF_SUCCESS_JSON"
      : "OTHER_JSON";
  }
  if (requestOrdinal === 5) {
    return exactJsonObject(parsed, {
      error: "Security token missing or expired. Please log in again.",
    })
      ? "EXACT_MISSING_CSRF_DENIAL_JSON"
      : "OTHER_JSON";
  }
  return parsed !== null && typeof parsed === "object"
    ? "JSON_VALUE"
    : "JSON_SCALAR";
}

function delta13ApplicationIdentity(requestOrdinal, status, bodyShape) {
  if (requestOrdinal === 1) {
    return status === 401 &&
      bodyShape === "EXACT_UNAUTHENTICATED_TOOLS_JSON"
      ? "ADMIN_TOOLS_UNAUTHENTICATED_401"
      : "UNEXPECTED_STATUS";
  }
  if (requestOrdinal === 2) {
    const identities = new Map([
      ["200:EXACT_LOGIN_SUCCESS_JSON", "LOGIN_SUCCESS_200"],
      ["401:EXACT_INVALID_CREDENTIALS_JSON", "INVALID_CREDENTIALS_401"],
      ["415:EXACT_MALFORMED_REQUEST_JSON", "MALFORMED_MEDIA_TYPE_415"],
      ["400:EXACT_MALFORMED_REQUEST_JSON", "MALFORMED_REQUEST_400"],
      ["413:EXACT_MALFORMED_REQUEST_JSON", "BODY_TOO_LARGE_413"],
      ["429:EXACT_RATE_LIMITED_JSON", "RATE_LIMITED_429"],
      [
        "500:EXACT_CONFIGURATION_UNAVAILABLE_JSON",
        "CONFIGURATION_UNAVAILABLE_500",
      ],
    ]);
    return identities.get(`${status}:${bodyShape}`) ?? "UNEXPECTED_STATUS";
  }
  if (requestOrdinal === 3) {
    if (status === 200 && bodyShape === "EXACT_AUTHENTICATED_SESSION_JSON") {
      return "AUTHENTICATED_SESSION_200";
    }
    if (
      status === 401 &&
      bodyShape === "EXACT_UNAUTHENTICATED_SESSION_JSON"
    ) {
      return "UNAUTHENTICATED_SESSION_401";
    }
    return "UNEXPECTED_STATUS";
  }
  if (requestOrdinal === 4) {
    return status === 200 && bodyShape === "EXACT_CSRF_SUCCESS_JSON"
      ? "CSRF_ISSUED_200"
      : "UNEXPECTED_STATUS";
  }
  if (requestOrdinal === 5) {
    return status === 403 && bodyShape === "EXACT_MISSING_CSRF_DENIAL_JSON"
      ? "MISSING_CSRF_DENIAL_403"
      : "UNEXPECTED_STATUS";
  }
  return status >= 100 && status <= 599
    ? "OTHER_APPLICATION_RESPONSE"
    : "UNEXPECTED_STATUS";
}

function delta13CookieEffect(setCookieValues, targetName, requireHttpOnly) {
  const matching = [];
  for (const bytes of setCookieValues) {
    const parts = bytes.toString("latin1").split(";");
    const separator = parts[0].indexOf("=");
    if (separator <= 0) continue;
    if (parts[0].slice(0, separator).trim() !== targetName) continue;
    const attributes = parts.slice(1).map((part) => part.trim().toLowerCase());
    matching.push({
      httpOnly: attributes.includes("httponly"),
      maxAge14400: attributes.includes("max-age=14400"),
      maxAgeZero: attributes.includes("max-age=0"),
      sameSiteStrict: attributes.includes("samesite=strict"),
      secure: attributes.includes("secure"),
    });
  }
  if (matching.length === 0) return "ABSENT";
  if (matching.length !== 1) return "INVALID";
  const [cookie] = matching;
  if (cookie.maxAgeZero) return "CLEARED_MAXAGE_ZERO";
  if (
    cookie.secure &&
    cookie.sameSiteStrict &&
    cookie.maxAge14400 &&
    cookie.httpOnly === requireHttpOnly
  ) {
    return requireHttpOnly
      ? "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400"
      : "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400";
  }
  return "INVALID";
}

export function projectDelta13ApplicationResponse(value) {
  const rawBodyBytes = value?.raw_body_bytes;
  const setCookieValues = Array.isArray(value?.set_cookie_values)
    ? value.set_cookie_values
    : [];
  try {
    requireExactKeys(
      value,
      [
        "request_ordinal",
        "method",
        "path",
        "expected_status",
        "actual_status_integer",
        "raw_body_bytes",
        "security_header_categories",
        "set_cookie_values",
      ],
      "DELTA13_RESPONSE_PROJECTION_SHAPE",
    );
    const expected = PLAN.requests.find(
      (request) => request.ordinal === value.request_ordinal,
    );
    if (
      !expected ||
      value.method !== expected.method ||
      value.path !== expected.path ||
      value.expected_status !== expected.status ||
      !Number.isInteger(value.actual_status_integer) ||
      value.actual_status_integer < 100 ||
      value.actual_status_integer > 599 ||
      !Buffer.isBuffer(rawBodyBytes) ||
      rawBodyBytes.byteLength > 512 * 1024 ||
      setCookieValues.length > 16 ||
      !setCookieValues.every(
        (buffer) => Buffer.isBuffer(buffer) && buffer.byteLength <= 16 * 1024,
      )
    ) {
      fail("DELTA13_RESPONSE_PROJECTION_INPUT");
    }
    requireExactKeys(
      value.security_header_categories,
      SECURITY_HEADER_PROJECTION_KEYS,
      "DELTA13_SECURITY_HEADER_CATEGORIES",
    );
    const bodyShape = delta13BodyShape(
      value.request_ordinal,
      rawBodyBytes,
    );
    return deepFreeze({
      request_ordinal: value.request_ordinal,
      method: value.method,
      path_class: delta13PathClass(value.path),
      expected_status: value.expected_status,
      actual_status_integer: value.actual_status_integer,
      status_match: value.actual_status_integer === value.expected_status,
      application_identity_class: delta13ApplicationIdentity(
        value.request_ordinal,
        value.actual_status_integer,
        bodyShape,
      ),
      body_shape_class: bodyShape,
      security_header_categories: {
        ...value.security_header_categories,
      },
      cookie_effect_categories: {
        session_cookie: delta13CookieEffect(
          setCookieValues,
          "aifinder_admin_session",
          true,
        ),
        csrf_cookie: delta13CookieEffect(
          setCookieValues,
          "aifinder_admin_csrf_token",
          false,
        ),
      },
    });
  } finally {
    if (Buffer.isBuffer(rawBodyBytes)) rawBodyBytes.fill(0);
    for (const buffer of setCookieValues) {
      if (Buffer.isBuffer(buffer)) buffer.fill(0);
    }
  }
}

function delta13SecurityHeaderCategoriesPass(categories) {
  requireExactKeys(
    categories,
    SECURITY_HEADER_PROJECTION_KEYS,
    "DELTA13_QUALIFICATION_SECURITY_HEADERS",
  );
  const required = [
    "cache_control_no_store",
    "x_content_type_options_nosniff",
    "x_frame_options_deny",
    "referrer_policy_strict_origin_when_cross_origin",
    "x_dns_prefetch_control_off",
    "cross_origin_opener_policy_same_origin",
    "permissions_camera_disabled",
    "permissions_microphone_disabled",
    "permissions_geolocation_disabled",
    "permissions_payment_disabled",
    "permissions_usb_disabled",
    "permissions_magnetometer_disabled",
    "permissions_gyroscope_disabled",
    "permissions_accelerometer_disabled",
    "csp_frame_ancestors_none",
    "csp_base_uri_self",
    "csp_form_action_self",
    "csp_object_src_none",
    "hsts_present",
  ];
  return (
    required.every((name) => categories[name] === true) &&
    ["ONE_TO_TWO_YEARS", "AT_LEAST_TWO_YEARS"].includes(
      categories.hsts_max_age_class,
    )
  );
}

export function validateDelta13AuthQualificationCycle(value) {
  requireExactKeys(
    value,
    [
      "cycle",
      "maximum_cycles",
      "requests",
      "login_attempts",
      "fresh_cookie_jar",
      "cookie_jar_destroyed",
      "database_requests",
      "data_writes",
      "storage_requests",
      "fixture_insertions",
    ],
    "DELTA13_QUALIFICATION_CYCLE_SHAPE",
  );
  if (
    !Number.isInteger(value.cycle) ||
    value.cycle < 1 ||
    value.cycle > 4 ||
    value.maximum_cycles !== 4 ||
    value.login_attempts !== 1 ||
    value.fresh_cookie_jar !== true ||
    value.cookie_jar_destroyed !== true ||
    value.database_requests !== 0 ||
    value.data_writes !== 0 ||
    value.storage_requests !== 0 ||
    value.fixture_insertions !== 0 ||
    !Array.isArray(value.requests) ||
    value.requests.length !== 5
  ) {
    fail("DELTA13_QUALIFICATION_CYCLE_BOUNDS");
  }
  const expected = [
    [1, "GET", "ADMIN_TOOLS", 401, "ADMIN_TOOLS_UNAUTHENTICATED_401"],
    [2, "POST", "ADMIN_LOGIN", 200, "LOGIN_SUCCESS_200"],
    [3, "GET", "ADMIN_SESSION", 200, "AUTHENTICATED_SESSION_200"],
    [4, "GET", "ADMIN_CSRF", 200, "CSRF_ISSUED_200"],
    [5, "POST", "ADMIN_TOOLS", 403, "MISSING_CSRF_DENIAL_403"],
  ];
  const responseKeys = [
    "request_ordinal",
    "method",
    "path_class",
    "expected_status",
    "actual_status_integer",
    "status_match",
    "application_identity_class",
    "body_shape_class",
    "security_header_categories",
    "cookie_effect_categories",
  ];
  for (let index = 0; index < expected.length; index += 1) {
    const request = value.requests[index];
    const [ordinal, method, pathClass, status, identity] = expected[index];
    requireExactKeys(
      request,
      responseKeys,
      "DELTA13_QUALIFICATION_RESPONSE_SHAPE",
    );
    if (
      request.request_ordinal !== ordinal ||
      request.method !== method ||
      request.path_class !== pathClass ||
      request.expected_status !== status ||
      request.actual_status_integer !== status ||
      request.status_match !== true ||
      request.application_identity_class !== identity ||
      !delta13SecurityHeaderCategoriesPass(
        request.security_header_categories,
      )
    ) {
      fail("DELTA13_QUALIFICATION_RESPONSE");
    }
  }
  if (
    value.requests[1].cookie_effect_categories.session_cookie !==
      "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400" ||
    value.requests[3].cookie_effect_categories.csrf_cookie !==
      "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400"
  ) {
    fail("DELTA13_QUALIFICATION_COOKIE_EFFECTS");
  }
  return deepFreeze({
    ready: true,
    cycle: value.cycle,
    requests: 5,
    login_attempts: 1,
    statuses: value.requests.map(
      (request) => request.actual_status_integer,
    ),
    application_identity_classes: value.requests.map(
      (request) => request.application_identity_class,
    ),
    database_requests: 0,
    data_writes: 0,
    storage_requests: 0,
    fixture_insertions: 0,
    cookie_jar_destroyed: true,
  });
}

export function classifySecurityHeaderProjection(value) {
  const bodyBytes = value?.application_body_bytes;
  const fields = Array.isArray(value?.header_fields) ? value.header_fields : [];
  const rawBuffers = fields
    .map((field) => field?.value)
    .filter((buffer) => Buffer.isBuffer(buffer));
  const scratch = [];
  try {
    requireExactKeys(
      value,
      ["status", "application_body_bytes", "header_fields"],
      "SECURITY_HEADER_PROJECTION_SHAPE",
    );
    if (
      !Number.isInteger(value.status) ||
      value.status < 100 ||
      value.status > 599 ||
      !Buffer.isBuffer(bodyBytes) ||
      bodyBytes.byteLength > 512 * 1024 ||
      !Array.isArray(value.header_fields) ||
      value.header_fields.length > 64
    ) {
      fail("SECURITY_HEADER_PROJECTION_INPUT");
    }
    const grouped = new Map();
    const allowedNames = new Set([
      "cache-control",
      "x-content-type-options",
      "x-frame-options",
      "referrer-policy",
      "x-dns-prefetch-control",
      "cross-origin-opener-policy",
      "permissions-policy",
      "content-security-policy",
      "strict-transport-security",
      "x-robots-tag",
    ]);
    for (const field of value.header_fields) {
      requireExactKeys(field, ["name", "value"], "SECURITY_HEADER_FIELD_SHAPE");
      if (
        typeof field.name !== "string" ||
        !/^[A-Za-z0-9-]{1,128}$/u.test(field.name) ||
        !Buffer.isBuffer(field.value) ||
        field.value.byteLength > 16 * 1024
      ) {
        fail("SECURITY_HEADER_FIELD_INPUT");
      }
      const name = field.name.toLowerCase();
      if (!allowedNames.has(name)) fail("SECURITY_HEADER_FIELD_NAME");
      const entries = grouped.get(name) ?? [];
      entries.push(field.value);
      grouped.set(name, entries);
    }
    const trimmedBody = (() => {
      let start = 0;
      let end = bodyBytes.byteLength;
      while (start < end && [0x20, 0x09, 0x0a, 0x0d].includes(bodyBytes[start])) {
        start += 1;
      }
      while (end > start && [0x20, 0x09, 0x0a, 0x0d].includes(bodyBytes[end - 1])) {
        end -= 1;
      }
      return bodyBytes.subarray(start, end);
    })();
    const expectedToolsBody = Buffer.from(
      '{"error":"Unauthorized"}',
      "utf8",
    );
    const expectedSessionBody = Buffer.from(
      '{"authenticated":false,"message":"Unauthorized."}',
      "utf8",
    );
    const exactToolsBody =
      trimmedBody.byteLength === expectedToolsBody.byteLength &&
      trimmedBody.equals(expectedToolsBody);
    const exactSessionBody =
      trimmedBody.byteLength === expectedSessionBody.byteLength &&
      trimmedBody.equals(expectedSessionBody);
    expectedToolsBody.fill(0);
    expectedSessionBody.fill(0);
    const statusClass =
      value.status === 401
        ? "EXPECTED_401"
        : value.status >= 300 && value.status <= 399
          ? "HTTP_3XX"
          : value.status === 403
            ? "HTTP_403"
            : value.status === 404
              ? "HTTP_404"
              : value.status >= 400 && value.status <= 499
                ? "HTTP_OTHER_4XX"
                : value.status >= 500
                  ? "HTTP_5XX"
                  : "OTHER";
    const responseIdentity =
      value.status === 401 && exactToolsBody
        ? "ADMIN_TOOLS_UNAUTHENTICATED"
        : value.status === 401 && exactSessionBody
          ? "ADMIN_SESSION_UNAUTHENTICATED"
          : "OTHER";
    const cacheControl = cacheControlNoStore(grouped, scratch);
    const nosniff = exactSingletonHeader(
      grouped,
      "x-content-type-options",
      "nosniff",
      scratch,
    );
    const xFrame = exactSingletonHeader(
      grouped,
      "x-frame-options",
      "deny",
      scratch,
    );
    const referrer = exactSingletonHeader(
      grouped,
      "referrer-policy",
      "strict-origin-when-cross-origin",
      scratch,
    );
    const dnsPrefetch = exactSingletonHeader(
      grouped,
      "x-dns-prefetch-control",
      "off",
      scratch,
    );
    const coop = exactSingletonHeader(
      grouped,
      "cross-origin-opener-policy",
      "same-origin",
      scratch,
    );
    const permissions = permissionsPolicyFacts(grouped, scratch);
    const csp = cspFacts(grouped, scratch);
    const hsts = hstsFacts(grouped, scratch);
    const proxyPass =
      xFrame &&
      referrer &&
      dnsPrefetch &&
      coop &&
      REQUIRED_PERMISSION_FEATURES.every(
        (feature) => permissions[feature] === true,
      ) &&
      csp.frameAncestorsNone &&
      csp.baseUriSelf &&
      csp.formActionSelf &&
      csp.objectSrcNone;
    const disposition =
      ![
        "ADMIN_TOOLS_UNAUTHENTICATED",
        "ADMIN_SESSION_UNAUTHENTICATED",
      ].includes(responseIdentity)
        ? "APPLICATION_RESPONSE_NOT_REACHED"
        : !cacheControl || !nosniff
          ? "ROUTE_HEADER_DELIVERY_DEFECT"
          : !proxyPass
            ? "PROXY_HEADER_DELIVERY_DEFECT"
            : !hsts.sufficient
              ? "HSTS_DELIVERY_DEFECT"
              : "PASS_EXACT_APPLICATION_HEADER_CONTRACT";
    return deepFreeze({
      status_class: statusClass,
      application_body_shape:
        exactToolsBody || exactSessionBody ? "EXACT_JSON_OBJECT" : "OTHER",
      application_response_identity: responseIdentity,
      cache_control_no_store: cacheControl,
      x_content_type_options_nosniff: nosniff,
      x_frame_options_deny: xFrame,
      referrer_policy_strict_origin_when_cross_origin: referrer,
      x_dns_prefetch_control_off: dnsPrefetch,
      cross_origin_opener_policy_same_origin: coop,
      permissions_camera_disabled: permissions.camera,
      permissions_microphone_disabled: permissions.microphone,
      permissions_geolocation_disabled: permissions.geolocation,
      permissions_payment_disabled: permissions.payment,
      permissions_usb_disabled: permissions.usb,
      permissions_magnetometer_disabled: permissions.magnetometer,
      permissions_gyroscope_disabled: permissions.gyroscope,
      permissions_accelerometer_disabled: permissions.accelerometer,
      csp_frame_ancestors_none: csp.frameAncestorsNone,
      csp_base_uri_self: csp.baseUriSelf,
      csp_form_action_self: csp.formActionSelf,
      csp_object_src_none: csp.objectSrcNone,
      hsts_present: hsts.present,
      hsts_max_age_class: hsts.maxAgeClass,
      hsts_include_subdomains: hsts.includeSubdomains,
      hsts_preload: hsts.preload,
      x_robots_tag_noindex_advisory: robotsNoindexAdvisory(grouped, scratch),
      disposition,
    });
  } finally {
    if (Buffer.isBuffer(bodyBytes)) bodyBytes.fill(0);
    for (const buffer of rawBuffers) buffer.fill(0);
    for (const buffer of scratch) buffer.fill(0);
  }
}

export function projectProtectedAccessHandshake(value) {
  const rawBodyBytes = value?.raw_body_bytes;
  const rawHeaderBytes = value?.raw_header_bytes;
  let projectedHeaders = null;
  const scratch = [];
  try {
    requireExactKeys(
      value,
      ["raw_body_bytes", "raw_header_bytes", "status"],
      "PROTECTED_ACCESS_HANDSHAKE_SHAPE",
    );
    if (
      !Number.isInteger(value.status) ||
      value.status < 100 ||
      value.status > 599 ||
      !Buffer.isBuffer(rawBodyBytes) ||
      rawBodyBytes.byteLength > 512 * 1024 ||
      !Buffer.isBuffer(rawHeaderBytes) ||
      rawHeaderBytes.byteLength === 0 ||
      rawHeaderBytes.byteLength > 128 * 1024
    ) {
      fail("PROTECTED_ACCESS_HANDSHAKE_INPUT");
    }
    const trustedSourcesMentioned =
      bufferContainsAscii(rawBodyBytes, "trusted_sources", scratch) ||
      bufferContainsAscii(rawBodyBytes, "trusted sources", scratch);
    const environmentMentioned = bufferContainsAscii(
      rawBodyBytes,
      "environment",
      scratch,
    );
    const unsupportedMentioned =
      bufferContainsAscii(rawBodyBytes, "unsupported", scratch) ||
      bufferContainsAscii(rawBodyBytes, "not available", scratch);
    const oidcMentioned = bufferContainsAscii(rawBodyBytes, "oidc", scratch);
    projectedHeaders = projectHttpResponseHeaderBuffers(rawHeaderBytes);
    if (projectedHeaders.status !== value.status) {
      fail("PROTECTED_ACCESS_HANDSHAKE_STATUS");
    }
    const securityHeaderProjection = classifySecurityHeaderProjection({
      status: value.status,
      application_body_bytes: rawBodyBytes,
      header_fields: projectedHeaders.security_header_fields,
    });
    classifyAuxiliaryResponseHeaderProjection({
      allow_values: projectedHeaders.allow_values,
      set_cookie_values: projectedHeaders.set_cookie_values,
    });
    const applicationReached =
      securityHeaderProjection.application_response_identity ===
      "ADMIN_TOOLS_UNAUTHENTICATED";
    const platformRejection =
      trustedSourcesMentioned && environmentMentioned
        ? "TRUSTED_SOURCES_ENVIRONMENT_MISMATCH"
        : trustedSourcesMentioned && unsupportedMentioned
          ? "TRUSTED_SOURCES_UNSUPPORTED"
          : oidcMentioned && value.status >= 400
            ? "OIDC_REJECTED"
            : "NONE";
    const accessDisposition = applicationReached
      ? "APPLICATION_UNAUTHENTICATED_DENIAL"
      : value.status >= 300 && value.status <= 399
        ? "PROTECTION_LAYER_NOT_APPLICATION"
        : platformRejection !== "NONE"
          ? "PROTECTED_ACCESS_CREDENTIAL_REJECTED"
          : "APPLICATION_NOT_REACHED_OTHER";
    return deepFreeze({
      access_disposition: accessDisposition,
      application_reached: applicationReached,
      counts_as_application_request: applicationReached,
      counts_as_runtime_session: false,
      platform_rejection: platformRejection,
      security_header_projection: securityHeaderProjection,
      status_class: securityHeaderProjection.status_class,
    });
  } finally {
    if (Buffer.isBuffer(rawBodyBytes)) rawBodyBytes.fill(0);
    if (Buffer.isBuffer(rawHeaderBytes)) rawHeaderBytes.fill(0);
    if (projectedHeaders) {
      for (const buffer of [
        ...projectedHeaders.security_header_fields.map((field) => field.value),
        ...projectedHeaders.allow_values,
        ...projectedHeaders.set_cookie_values,
      ]) {
        buffer.fill(0);
      }
    }
    for (const buffer of scratch) buffer.fill(0);
  }
}

function exactProtectedAccessOrigin(value, code) {
  if (typeof value !== "string" || value.length > 512) fail(code);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(code);
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    parsed.origin !== value
  ) {
    fail(code);
  }
  return value;
}

export function validateProtectedAccessProbe(value) {
  requireExactKeys(
    value,
    [
      "admin_auth",
      "cookies",
      "csrf",
      "data_credentials",
      "database_requests",
      "expected_origin",
      "method",
      "path",
      "redirect_following",
      "request_body",
      "request_origin",
      "data_writes",
    ],
    "PROTECTED_ACCESS_PROBE_SHAPE",
  );
  const expectedOrigin = exactProtectedAccessOrigin(
    value.expected_origin,
    "PROTECTED_ACCESS_EXPECTED_ORIGIN",
  );
  const requestOrigin = exactProtectedAccessOrigin(
    value.request_origin,
    "PROTECTED_ACCESS_REQUEST_ORIGIN",
  );
  if (
    requestOrigin !== expectedOrigin ||
    value.method !== "GET" ||
    value.path !== "/api/admin/tools" ||
    value.redirect_following !== false ||
    value.cookies !== false ||
    value.admin_auth !== false ||
    value.csrf !== false ||
    value.request_body !== false ||
    value.data_credentials !== false ||
    value.database_requests !== 0 ||
    value.data_writes !== 0
  ) {
    fail("PROTECTED_ACCESS_PROBE_AUTHORITY");
  }
  return deepFreeze({
    admin_auth: false,
    application_request_eligible: true,
    cookies: false,
    csrf: false,
    data_credentials: false,
    database_requests: 0,
    method: "GET",
    path: "/api/admin/tools",
    redirect_following: false,
    request_body: false,
    data_writes: 0,
  });
}

export async function withProtectedAccessCredential(value, operation) {
  requireExactKeys(
    value,
    ["access_mode", "credential_bytes", "expected_origin", "request_origin"],
    "PROTECTED_ACCESS_CREDENTIAL_SHAPE",
  );
  if (typeof operation !== "function") {
    fail("PROTECTED_ACCESS_CREDENTIAL_OPERATION");
  }
  const expectedOrigin = exactProtectedAccessOrigin(
    value.expected_origin,
    "PROTECTED_ACCESS_CREDENTIAL_EXPECTED_ORIGIN",
  );
  const requestOrigin = exactProtectedAccessOrigin(
    value.request_origin,
    "PROTECTED_ACCESS_CREDENTIAL_REQUEST_ORIGIN",
  );
  if (requestOrigin !== expectedOrigin) {
    fail("PROTECTED_ACCESS_CREDENTIAL_ORIGIN");
  }
  if (
    !Buffer.isBuffer(value.credential_bytes) ||
    value.credential_bytes.byteLength === 0 ||
    value.credential_bytes.byteLength > 32 * 1024
  ) {
    fail("PROTECTED_ACCESS_CREDENTIAL_BYTES");
  }
  const headerName = new Map([
    ["SELF_PROJECT_OIDC", "x-vercel-trusted-oidc-idp-token"],
    ["TEMPORARY_AUTOMATION_BYPASS", "x-vercel-protection-bypass"],
  ]).get(value.access_mode);
  if (!headerName) fail("PROTECTED_ACCESS_CREDENTIAL_MODE");
  if (
    value.access_mode === "TEMPORARY_AUTOMATION_BYPASS" &&
    (value.credential_bytes.byteLength !== 32 ||
      !value.credential_bytes.every(
        (byte) =>
          (byte >= 0x30 && byte <= 0x39) ||
          (byte >= 0x41 && byte <= 0x5a) ||
          (byte >= 0x61 && byte <= 0x7a),
      ))
  ) {
    fail("PROTECTED_ACCESS_BYPASS_SECRET_SHAPE");
  }
  const headerValue = Buffer.from(value.credential_bytes);
  try {
    return await operation(
      Object.freeze({
        header_name: headerName,
        header_value: headerValue,
      }),
    );
  } finally {
    headerValue.fill(0);
  }
}

export function projectVercelOidcToken(value) {
  const tokenBytes = value?.token_bytes;
  let headerBytes = null;
  let payloadBytes = null;
  try {
    requireExactKeys(
      value,
      [
        "expected_project_id",
        "expected_project_name",
        "expected_team_id",
        "expected_team_slug",
        "now_seconds",
        "token_bytes",
      ],
      "VERCEL_OIDC_TOKEN_SHAPE",
    );
    if (
      value.expected_team_id !== "team_9POJYxNnjIBbrQ19My8M5yG3" ||
      value.expected_team_slug !== "ai-finder-s-projects" ||
      value.expected_project_id !== "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" ||
      value.expected_project_name !== "aifinder" ||
      !Number.isInteger(value.now_seconds) ||
      value.now_seconds < 0 ||
      !Buffer.isBuffer(tokenBytes) ||
      tokenBytes.byteLength < 16 ||
      tokenBytes.byteLength > 32 * 1024 ||
      !tokenBytes.every(
        (byte) =>
          (byte >= 0x30 && byte <= 0x39) ||
          (byte >= 0x41 && byte <= 0x5a) ||
          (byte >= 0x61 && byte <= 0x7a) ||
          byte === 0x2d ||
          byte === 0x2e ||
          byte === 0x5f,
      )
    ) {
      fail("VERCEL_OIDC_TOKEN_INPUT");
    }
    const dots = [];
    for (let index = 0; index < tokenBytes.byteLength; index += 1) {
      if (tokenBytes[index] === 0x2e) dots.push(index);
    }
    if (
      dots.length !== 2 ||
      dots[0] === 0 ||
      dots[1] === dots[0] + 1 ||
      dots[1] === tokenBytes.byteLength - 1
    ) {
      fail("VERCEL_OIDC_TOKEN_SEGMENTS");
    }
    headerBytes = Buffer.from(
      tokenBytes.subarray(0, dots[0]).toString("ascii"),
      "base64url",
    );
    payloadBytes = Buffer.from(
      tokenBytes.subarray(dots[0] + 1, dots[1]).toString("ascii"),
      "base64url",
    );
    if (
      headerBytes.byteLength === 0 ||
      payloadBytes.byteLength === 0 ||
      headerBytes.byteLength > 8 * 1024 ||
      payloadBytes.byteLength > 16 * 1024
    ) {
      fail("VERCEL_OIDC_TOKEN_DECODE");
    }
    let header;
    let payload;
    try {
      header = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(headerBytes),
      );
      payload = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes),
      );
    } catch {
      fail("VERCEL_OIDC_TOKEN_JSON");
    }
    if (
      !header ||
      typeof header !== "object" ||
      Array.isArray(header) ||
      typeof header.alg !== "string" ||
      header.alg.length === 0 ||
      String(header.typ ?? "").toLowerCase() !== "jwt" ||
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      fail("VERCEL_OIDC_TOKEN_DOCUMENT");
    }
    const expectedAudience =
      `https://vercel.com/${value.expected_team_slug}`;
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const issuerPresent =
      typeof payload.iss === "string" &&
      (payload.iss === "https://oidc.vercel.com" ||
        payload.iss ===
          `https://oidc.vercel.com/${value.expected_team_slug}`);
    const audienceMatchesTeam = audiences.includes(expectedAudience);
    const ownerMatchesTeam =
      payload.owner === value.expected_team_slug &&
      payload.owner_id === value.expected_team_id;
    const projectMatchesExact =
      payload.project === value.expected_project_name &&
      payload.project_id === value.expected_project_id;
    const environment =
      payload.environment === "development"
        ? "DEVELOPMENT"
        : payload.environment === "preview"
          ? "PREVIEW"
          : payload.environment === undefined
            ? "MISSING"
            : "OTHER";
    const notBeforeValid =
      Number.isInteger(payload.nbf) && payload.nbf <= value.now_seconds;
    if (
      !issuerPresent ||
      !audienceMatchesTeam ||
      !ownerMatchesTeam ||
      !projectMatchesExact ||
      !notBeforeValid ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= value.now_seconds
    ) {
      fail("VERCEL_OIDC_TOKEN_CLAIMS");
    }
    const remainingSeconds = payload.exp - value.now_seconds;
    const expirationBucket = remainingSeconds < 600
      ? "LT10M"
      : remainingSeconds <= 1_800
        ? "10_TO_30M"
        : "GT30M";
    return deepFreeze({
      audience_matches_team: true,
      environment,
      expiration_bucket: expirationBucket,
      issuer_present: true,
      not_before_valid: true,
      owner_matches_team: true,
      project_matches_exact: true,
      signature_shape: "JWT_THREE_SEGMENTS",
    });
  } finally {
    if (Buffer.isBuffer(tokenBytes)) tokenBytes.fill(0);
    if (headerBytes) headerBytes.fill(0);
    if (payloadBytes) payloadBytes.fill(0);
  }
}

export function validateProjectBypassTransition(value) {
  requireExactKeys(
    value,
    [
      "environment_designated_record_present_after",
      "environment_designated_record_present_before",
      "generated_exact_secret_recognized",
      "post_generation_bypass_count_delta",
      "post_revoke_bypass_record_count",
      "pre_bypass_record_count",
      "temporary_secret_no_longer_bypasses",
      "trusted_sources_self_entry_present_after",
      "trusted_sources_self_entry_present_before",
    ],
    "PROJECT_BYPASS_TRANSITION_SHAPE",
  );
  const countCategories = new Set(["ZERO", "ONE", "MULTIPLE"]);
  const trustedCategories = new Set([true, false, "unknown"]);
  if (
    !countCategories.has(value.pre_bypass_record_count) ||
    !countCategories.has(value.post_revoke_bypass_record_count) ||
    !trustedCategories.has(value.trusted_sources_self_entry_present_before) ||
    !trustedCategories.has(value.trusted_sources_self_entry_present_after) ||
    typeof value.environment_designated_record_present_before !== "boolean" ||
    typeof value.environment_designated_record_present_after !== "boolean" ||
    value.generated_exact_secret_recognized !== true ||
    value.post_generation_bypass_count_delta !== "PLUS_ONE" ||
    value.temporary_secret_no_longer_bypasses !== true ||
    value.post_revoke_bypass_record_count !== value.pre_bypass_record_count ||
    value.environment_designated_record_present_after !==
      value.environment_designated_record_present_before ||
    value.trusted_sources_self_entry_present_after !==
      value.trusted_sources_self_entry_present_before
  ) {
    fail("PROJECT_BYPASS_TRANSITION_RESTORE");
  }
  return deepFreeze({
    existing_records_preserved: true,
    no_generated_secret_active: true,
    pre_bypass_record_count: value.pre_bypass_record_count,
    project_bypass_record_count_restored: true,
  });
}

export async function runProtectedAccessCredentialLifecycle(value, operations) {
  requireExactKeys(
    value,
    ["access_mode", "credential_bytes"],
    "PROTECTED_ACCESS_LIFECYCLE_SHAPE",
  );
  requireOperationFunctions(
    operations,
    [
      "activate",
      "install_signal_handlers",
      "revoke",
      "use",
      "verify_restored",
    ],
    "PROTECTED_ACCESS_LIFECYCLE_OPERATIONS",
  );
  const credentialBytes = value.credential_bytes;
  if (
    value.access_mode !== "TEMPORARY_AUTOMATION_BYPASS" ||
    !Buffer.isBuffer(credentialBytes) ||
    credentialBytes.byteLength !== 32 ||
    !credentialBytes.every(
      (byte) =>
        (byte >= 0x30 && byte <= 0x39) ||
        (byte >= 0x41 && byte <= 0x5a) ||
        (byte >= 0x61 && byte <= 0x7a),
    )
  ) {
    if (Buffer.isBuffer(credentialBytes)) credentialBytes.fill(0);
    fail("PROTECTED_ACCESS_LIFECYCLE_CREDENTIAL");
  }
  let activationAttempted = false;
  let cleanupPromise = null;
  let signalName = null;
  let removeSignalHandlers = null;
  let result;
  let primaryError = null;
  const cleanup = async (reason) => {
    if (cleanupPromise) return cleanupPromise;
    cleanupPromise = (async () => {
      if (activationAttempted) {
        await operations.revoke(credentialBytes, reason);
      }
      if ((await operations.verify_restored()) !== true) {
        fail("PROTECTED_ACCESS_LIFECYCLE_RESTORE");
      }
    })();
    return cleanupPromise;
  };
  try {
    removeSignalHandlers = operations.install_signal_handlers(
      (receivedSignal) => {
        if (!new Set(["SIGHUP", "SIGINT", "SIGTERM"]).has(receivedSignal)) {
          fail("PROTECTED_ACCESS_LIFECYCLE_SIGNAL");
        }
        if (signalName === null) signalName = receivedSignal;
      },
    );
    if (typeof removeSignalHandlers !== "function") {
      fail("PROTECTED_ACCESS_LIFECYCLE_SIGNAL_REMOVE");
    }
    activationAttempted = true;
    await operations.activate(credentialBytes);
    result = await operations.use(credentialBytes);
  } catch (caught) {
    primaryError = caught;
  } finally {
    try {
      await cleanup(signalName === null ? (primaryError ? "ERROR" : "SUCCESS") : "SIGNAL");
    } catch (caught) {
      primaryError = caught;
    }
    try {
      if (removeSignalHandlers) removeSignalHandlers();
    } catch (caught) {
      primaryError = caught;
    }
    credentialBytes.fill(0);
  }
  if (signalName !== null) fail("PROTECTED_ACCESS_SIGNAL");
  if (primaryError) throw primaryError;
  return result;
}

export function validateProtectedAccessOperation(value) {
  requireExactKeys(
    value,
    [
      "credential_active",
      "operation",
      "protected_access_target_confirmed",
    ],
    "PROTECTED_ACCESS_OPERATION_SHAPE",
  );
  const operations = new Set([
    "ACCESS_HANDSHAKE",
    "BRANCH_PUSH",
    "CREDENTIAL_CLEANUP",
    "FINAL_RUNTIME_REQUEST",
    "HEADER_QUALIFICATION",
    "OFFICIAL_RUNTIME_START",
    "PREVIEW_BUILD",
  ]);
  if (
    typeof value.credential_active !== "boolean" ||
    typeof value.protected_access_target_confirmed !== "boolean" ||
    !operations.has(value.operation)
  ) {
    fail("PROTECTED_ACCESS_OPERATION_INPUT");
  }
  if (
    value.credential_active &&
    ["BRANCH_PUSH", "PREVIEW_BUILD"].includes(value.operation)
  ) {
    fail("PROTECTED_ACCESS_OPERATION_CREDENTIAL_ACTIVE");
  }
  if (
    value.operation === "OFFICIAL_RUNTIME_START" &&
    value.protected_access_target_confirmed !== true
  ) {
    fail("PROTECTED_ACCESS_RUNTIME_TARGET_UNCONFIRMED");
  }
  return deepFreeze({ allowed: true, operation: value.operation });
}

export function validateRuntimeResponse(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("RUNTIME_RESPONSE_INPUT");
  }
  const expected = PLAN.requests.find(
    (request) => request.ordinal === value.ordinal,
  );
  if (!expected) fail("RUNTIME_RESPONSE_ORDINAL");
  if (
    value.method !== expected.method ||
    value.path !== expected.path ||
    value.status !== expected.status ||
    value.body_contract !== expected.contract
  ) {
    fail("RUNTIME_RESPONSE_CONTRACT");
  }
  if (Object.hasOwn(value, "headers")) fail("RUNTIME_RAW_HEADER_MAP");
  const projection = value.security_header_projection;
  requireExactKeys(
    projection,
    SECURITY_HEADER_PROJECTION_KEYS,
    "RUNTIME_SECURITY_HEADER_PROJECTION",
  );
  if (
    !SECURITY_HEADER_STATUS_CLASSES.includes(projection.status_class) ||
    !["EXACT_JSON_OBJECT", "OTHER"].includes(
      projection.application_body_shape,
    ) ||
    ![
      "ADMIN_TOOLS_UNAUTHENTICATED",
      "ADMIN_SESSION_UNAUTHENTICATED",
      "OTHER",
    ].includes(
      projection.application_response_identity,
    ) ||
    ![
      "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      "APPLICATION_RESPONSE_NOT_REACHED",
      "ROUTE_HEADER_DELIVERY_DEFECT",
      "PROXY_HEADER_DELIVERY_DEFECT",
      "HSTS_DELIVERY_DEFECT",
    ].includes(projection.disposition)
  ) {
    fail("RUNTIME_SECURITY_HEADER_CLASSIFICATION");
  }
  for (const name of [
    "cache_control_no_store",
    "x_content_type_options_nosniff",
    "x_frame_options_deny",
    "referrer_policy_strict_origin_when_cross_origin",
    "x_dns_prefetch_control_off",
    "cross_origin_opener_policy_same_origin",
    "permissions_camera_disabled",
    "permissions_microphone_disabled",
    "permissions_geolocation_disabled",
    "permissions_payment_disabled",
    "permissions_usb_disabled",
    "permissions_magnetometer_disabled",
    "permissions_gyroscope_disabled",
    "permissions_accelerometer_disabled",
    "csp_frame_ancestors_none",
    "csp_base_uri_self",
    "csp_form_action_self",
    "csp_object_src_none",
    "hsts_present",
  ]) {
    requireBoolean(projection[name], true, "RUNTIME_SECURITY_HEADER_REQUIRED");
  }
  for (const name of [
    "hsts_include_subdomains",
    "hsts_preload",
    "x_robots_tag_noindex_advisory",
  ]) {
    if (typeof projection[name] !== "boolean") {
      fail("RUNTIME_SECURITY_HEADER_BOOLEAN");
    }
  }
  if (
    !["ONE_TO_TWO_YEARS", "AT_LEAST_TWO_YEARS"].includes(
      projection.hsts_max_age_class,
    )
  ) {
    fail("RUNTIME_HSTS_MAX_AGE");
  }
  if (
    expected.ordinal === 1 &&
    (projection.status_class !== "EXPECTED_401" ||
      projection.application_body_shape !== "EXACT_JSON_OBJECT" ||
      projection.application_response_identity !==
        "ADMIN_TOOLS_UNAUTHENTICATED" ||
      projection.disposition !== "PASS_EXACT_APPLICATION_HEADER_CONTRACT")
  ) {
    fail("RUNTIME_REQUEST_1_HEADER_QUALIFICATION");
  }
  if (
    expected.ordinal === 20 &&
    (projection.status_class !== "EXPECTED_401" ||
      projection.application_body_shape !== "EXACT_JSON_OBJECT" ||
      projection.application_response_identity !==
        "ADMIN_SESSION_UNAUTHENTICATED" ||
      projection.disposition !== "PASS_EXACT_APPLICATION_HEADER_CONTRACT")
  ) {
    fail("RUNTIME_REQUEST_20_HEADER_QUALIFICATION");
  }
  requireBoolean(value.raw_body_persisted, false, "RUNTIME_RAW_BODY");
  requireBoolean(value.raw_headers_persisted, false, "RUNTIME_RAW_HEADERS");
  requireBoolean(value.raw_url_persisted, false, "RUNTIME_RAW_URL");
  if (
    expected.contract === "METHOD_GATE_ALLOW_HEADER" &&
    value.allow_methods_exact !== true
  ) {
    fail("RUNTIME_ALLOW_HEADER");
  }
  if (
    expected.contract === "CSRF_COOKIE_AND_TOKEN" &&
    (value.csrf_cookie_matches_body !== true || value.csrf_token_format !== "64_LOWER_HEX")
  ) {
    fail("RUNTIME_CSRF");
  }
  if (
    expected.contract === "SESSION_COOKIE_CREATED" &&
    (value.admin_password_matches_deployment !== true ||
      value.session_cookie_httponly !== true ||
      value.session_cookie_secure !== true ||
      value.session_cookie_samesite !== "Strict" ||
      value.session_cookie_bounded_lifetime !== true)
  ) {
    fail("RUNTIME_SESSION_COOKIE");
  }
  if (
    expected.contract === "AUTHENTICATED_SESSION" &&
    value.session_secret_signature_verified !== true
  ) {
    fail("RUNTIME_SESSION_SIGNATURE");
  }
  return deepFreeze({
    ordinal: expected.ordinal,
    status: expected.status,
    contract: expected.contract,
    validated: true,
  });
}

export function validateFixtureState(value) {
  const expectedScalars = {
    route_created_tools: 1,
    approved_submission_tools: 1,
    submitted_tool_fixtures: 3,
    logo_objects: 1,
    direct_rpc_executions: 0,
    route_rpc_executions: 1,
    edit_submission_state: "pending",
    reject_submission_state: "rejected",
    approve_submission_state: "approved",
    route_created_tool_archived: true,
  };
  requireExactKeys(
    value,
    [...Object.keys(expectedScalars), "audit_actions"],
    "FIXTURE_STATE_SHAPE",
  );
  for (const [key, expected] of Object.entries(expectedScalars)) {
    if (value[key] !== expected) fail(`FIXTURE_STATE_${key.toUpperCase()}`);
  }
  if (!exactArray(value.audit_actions, PLAN.audit_actions)) {
    fail("FIXTURE_STATE_AUDIT_ACTIONS");
  }
  return deepFreeze({
    ready: true,
    tools: 2,
    submissions: 3,
    audit_actions: 8,
    storage_objects: 1,
    direct_rpc_executions: 0,
    route_rpc_executions: 1,
  });
}

export function validateCleanupState(value) {
  const expected = {
    synthetic_tools_remaining: 0,
    synthetic_submissions_remaining: 0,
    synthetic_audit_rows_remaining: 0,
    synthetic_storage_objects_remaining: 0,
    preview_deployments_remaining: 0,
    temporary_branches_remaining: 0,
    temporary_worktrees_remaining: 0,
    temporary_secret_files_remaining: 0,
  };
  requireExactKeys(value, Object.keys(expected), "CLEANUP_STATE_SHAPE");
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) fail(`CLEANUP_STATE_${key.toUpperCase()}`);
  }
  return deepFreeze({
    ready: true,
    data_storage: "4_OF_4",
    external_git: "4_OF_4",
    cleanup: "8_OF_8",
  });
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalValue(value), null, 2)}\n`;
}
