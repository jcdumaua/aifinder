import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  runAdminV1OfficialRuntime,
} from "./admin-v1-official-runtime.mjs";
import {
  createConcreteLiveTransport,
} from "./nonproduction-qualification-live-platform.mjs";

const rows = [
  ["inspect_prior_residue", "PRE_EFFECT", "provider.inventory", "PROVIDER_CONTROL", "provider_control_invocations", "read", "READ_ONLY", "ZERO"],
  ["prepare_local_temporary_commit", "SETUP", "git.local", "LOCAL_GIT", "local_temporary_commits", "mutation", "EXACT_COMMIT", "ZERO"],
  ["inspect_github_metadata", "SETUP", "git.remote", "GIT_REMOTE_READ", "git_remote_reads", "read", "READ_ONLY", "ZERO"],
  ["inspect_environment_contract", "PRE_EFFECT", "provider.environment", "PROVIDER_CONTROL", "provider_control_invocations+environment_metadata_controls", "read", "READ_ONLY", "ZERO"],
  ["inspect_remote_ref", "SETUP", "git.remote", "GIT_REMOTE_READ", "git_remote_reads", "read", "READ_ONLY", "ZERO"],
  ["create_remote_ref", "SETUP", "git.remote", "GIT_REMOTE_MUTATION", "git_remote_mutations", "mutation", "CREATE_IF_ABSENT", "ZERO"],
  ["create_environment_1", "SETUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_created", "mutation", "CREATE_EXACT", "ZERO"],
  ["create_environment_2", "SETUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_created", "mutation", "CREATE_EXACT", "ZERO"],
  ["verify_environment_1", "SETUP", "vercel.environment", "PROVIDER_CONTROL", "provider_control_invocations+environment_metadata_controls", "read", "READ_ONLY", "ZERO"],
  ["verify_environment_2", "SETUP", "vercel.environment", "PROVIDER_CONTROL", "provider_control_invocations+environment_metadata_controls", "read", "READ_ONLY", "ZERO"],
  ["acquire_automatic_preview", "SETUP", "vercel.inventory", "PROVIDER_INVENTORY", "provider_control_invocations+provider_inventory_traversals+provider_inventory_pages", "read", "BOUNDED_OBSERVATION", "ZERO"],
  ["verify_preview_identity", "SETUP", "vercel.preview", "PROVIDER_CONTROL", "provider_control_invocations", "read", "READ_ONLY", "ZERO"],
  ["generate_oidc", "SETUP", "vercel.oidc", "OIDC", "oidc_generations", "read", "ONE_SHOT", "ZERO"],
  ["protected_access_handshake", "SETUP", "preview.protected", "PROTECTED_ACCESS", "protected_handshake_requests", "read", "ONE_SHOT", "ZERO"],
  ["inspect_owned_database_residue", "PRE_EFFECT", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "read", "READ_ONLY", "ZERO"],
  ["create_submitted_fixture", "SETUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CREATE_EXACT", "ZERO"],
  ["inspect_submissions_poststate", "POSTSTATE", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "read", "READ_ONLY", "ZERO"],
  ["inspect_tools_poststate", "POSTSTATE", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "read", "READ_ONLY", "ZERO"],
  ["inspect_audits_poststate", "POSTSTATE", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "read", "READ_ONLY", "ZERO"],
  ["storage_read_owned_version", "CLEANUP", "supabase.storage", "STORAGE", "storage_reads", "read", "READ_ONLY", "ZERO"],
  ["prepare_storage_cleanup_grant", "CLEANUP", "supabase.rpc", "RPC", "grant_prepare_rpc_calls", "mutation", "CREATE_EXACT", "ZERO"],
  ["delete_storage_exact_version", "CLEANUP", "supabase.storage", "STORAGE", "storage_delete_attempts", "mutation", "CAS_EXACT", "ZERO"],
  ["revoke_storage_cleanup_grant", "CLEANUP", "supabase.rpc", "RPC", "grant_revoke_rpc_calls", "mutation", "REVOKE_EXACT", "ZERO"],
  ["delete_owned_audits", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["delete_submitted_fixture_1", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["delete_submitted_fixture_2", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["delete_submitted_fixture_3", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["delete_owned_tool_1", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["delete_owned_tool_2", "CLEANUP", "supabase.database", "DATABASE_REST", "database_rest_requests+database_rest_successes", "mutation", "CAS_EXACT", "ZERO"],
  ["retire_protected_access", "CLEANUP", "preview.protected", "PROTECTED_ACCESS", "provider_control_invocations", "mutation", "DELETE_EXACT", "ZERO"],
  ["delete_preview", "CLEANUP", "vercel.preview", "PROVIDER_MUTATION", "provider_direct_mutations", "mutation", "DELETE_EXACT", "ZERO"],
  ["delete_environment_1", "CLEANUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_deleted", "mutation", "DELETE_EXACT", "ZERO"],
  ["delete_environment_2", "CLEANUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_deleted", "mutation", "DELETE_EXACT", "ZERO"],
  ["inspect_remote_ref_before_delete", "CLEANUP", "git.remote", "GIT_REMOTE_READ", "git_remote_reads", "read", "READ_ONLY", "ZERO"],
  ["delete_remote_ref", "CLEANUP", "git.remote", "GIT_REMOTE_MUTATION", "git_remote_mutations", "mutation", "CAS_EXACT", "ZERO"],
  ["verify_zero_data_residual", "CLEANUP", "supabase.residual", "DATABASE_STORAGE_READ", "database_rest_requests+database_rest_successes+storage_reads", "read", "READ_ONLY", "ZERO"],
  ["verify_zero_external_residual", "CLEANUP", "provider.residual", "PROVIDER_GIT_READ", "provider_control_invocations+git_remote_reads", "read", "READ_ONLY", "ZERO"],
  ["cleanup_local_owned_temp_state", "CLEANUP", "git.local", "LOCAL_GIT", "local_temporary_cleanups", "mutation", "DELETE_EXACT", "ZERO"],
  ["application_request", "QUALIFICATION_OR_OFFICIAL", "preview.application", "AUTHENTICATED_APPLICATION", "application_request_lane_budget", "read_or_mutation", "SEQUENCED_ONCE", "ZERO"],
];

export const ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP = Object.freeze(
  rows.map(([
    operation,
    state_machine_stage,
    concrete_implementation,
    authority_class,
    budget_counter,
    mutation_or_read,
    idempotency,
    retry_rule,
  ]) => Object.freeze({
    operation,
    state_machine_stage,
    concrete_implementation,
    underlying_transport: concrete_implementation.split(".")[0],
    authority_class,
    budget_counter,
    mutation_or_read,
    idempotency,
    retry_rule,
    sanitized_result_shape: "BOUNDED_OPERATION_SPECIFIC_OBJECT",
    cleanup_owner: mutation_or_read === "read" ? "NONE" : "OFFICIAL_STATE_MACHINE",
  })),
);

const OPERATION_BY_NAME = new Map(
  ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP.map((entry) => [entry.operation, entry]),
);
const CREDENTIAL_ENVIRONMENT_OBSERVATION = Symbol(
  "ADMIN_V1_OFFICIAL_CREDENTIAL_ENVIRONMENT_OBSERVATION",
);
const MAX_APPLICATION_JSON_RESPONSE_BYTES = 1024 * 1024;
const MAX_APPLICATION_ROWS = 1000;
const MAX_PROTECTION_CHALLENGE_BYTES = 64 * 1024;
const SESSION_COOKIE_NAME = "aifinder_admin_session";
const CSRF_COOKIE_NAME = "aifinder_admin_csrf_token";
const APPLICATION_COOKIE_MAX_AGE_SECONDS = 4 * 60 * 60;
const TRUSTED_SOURCE_OIDC_HEADER = "x-vercel-trusted-oidc-idp-token";
const VERCEL_PROTECTION_CHALLENGE_MARKERS = Object.freeze([
  "vercel.com/sso-api",
  "<title>Authentication Required</title>",
]);

export class AdminV1OfficialLivePlatformError extends Error {
  constructor(code, {
    environment_create_failure_class = null,
    http_status_class = null,
  } = {}) {
    super(code);
    this.name = "AdminV1OfficialLivePlatformError";
    this.code = code;
    this.environment_create_failure_class = environment_create_failure_class;
    this.http_status_class = http_status_class;
  }
}

const ENVIRONMENT_CREATE_FAILURE_CLASSES = new Set([
  "ENVIRONMENT_VALUE_SHAPE_INVALID",
  "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
  "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
]);
const HTTP_STATUS_CLASSES = new Set(["2XX", "4XX", "5XX", "OTHER"]);

function httpStatusClass(status) {
  if (!Number.isSafeInteger(status)) return null;
  if (status >= 200 && status < 300) return "2XX";
  if (status >= 400 && status < 500) return "4XX";
  if (status >= 500 && status < 600) return "5XX";
  return "OTHER";
}

function environmentCreateFailure(code, failureClass, statusClass = null) {
  if (
    !ENVIRONMENT_CREATE_FAILURE_CLASSES.has(failureClass) ||
    !(statusClass === null || HTTP_STATUS_CLASSES.has(statusClass))
  ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_INPUT");
  return new AdminV1OfficialLivePlatformError(code, {
    environment_create_failure_class: failureClass,
    http_status_class: statusClass,
  });
}

function credentialText(value) {
  if (!(value instanceof Uint8Array) || value.byteLength < 1) {
    throw new AdminV1OfficialLivePlatformError("OFFICIAL_CREDENTIAL_MISSING");
  }
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("utf8");
}

function transportCredentials(credentials) {
  return {
    github_token: credentialText(credentials.github_token),
    vercel_token: credentialText(credentials.vercel_token),
    supabase_url: credentialText(credentials.supabase_url),
    supabase_anon_key: credentialText(credentials.supabase_anon_key),
    supabase_service_role_key: credentialText(credentials.supabase_service_role_key),
  };
}

function boundedText(value, maximum = 1024) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && !value.includes("\0");
}

function terminalDeploymentInventory(body) {
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    !Array.isArray(body.deployments) || body.deployments.length > 100 ||
    !body.pagination || typeof body.pagination !== "object" ||
    Array.isArray(body.pagination) ||
    !Number.isSafeInteger(body.pagination.count) ||
    body.pagination.count !== body.deployments.length ||
    body.pagination.next !== null
  ) return null;
  return body.deployments;
}

function terminalEnvironmentInventory(body) {
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    !Array.isArray(body.envs) || body.envs.length > 100
  ) return null;
  if (!Object.hasOwn(body, "pagination")) {
    return body.envs;
  }
  if (
    !body.pagination || typeof body.pagination !== "object" ||
    Array.isArray(body.pagination) ||
    !Number.isSafeInteger(body.pagination.count) ||
    body.pagination.count !== body.envs.length ||
    body.pagination.next !== null
  ) return null;
  return body.envs;
}

function exactOwnedDeployment(candidate, authorization) {
  const [owner, repository] = authorization.repository.remote_repository.split("/");
  const identifiers = [candidate?.id, candidate?.uid]
    .filter((value) => value !== undefined && value !== null);
  const id = candidate?.id ?? candidate?.uid;
  const meta = candidate?.meta;
  return boundedText(id, 256) && identifiers.length >= 1 &&
    identifiers.every((value) => value === id) &&
    candidate.target === null && candidate.production !== true &&
    meta && typeof meta === "object" && !Array.isArray(meta) &&
    meta.aifinderRunId === authorization.run_id &&
    meta.aifinderCandidate === authorization.candidate_identity_sha256 &&
    meta.githubCommitSha === authorization.execution.temporary_commit_sha &&
    meta.githubCommitRef === authorization.execution.branch_name &&
    meta.githubCommitRepo === repository && meta.githubCommitOrg === owner;
}

function exactEnvironmentRecord(record, authorization) {
  if (!(record && typeof record === "object" && !Array.isArray(record) &&
    boundedText(record.id, 256) && boundedText(record.key, 256) &&
    authorization.execution.environment_keys.includes(record.key) &&
    record.type === "encrypted" &&
    canonicalJson(record.target) === '["preview"]' &&
    record.gitBranch === authorization.execution.branch_name &&
    (!Object.hasOwn(record, "projectId") ||
      record.projectId === authorization.execution.preview_project_id) &&
    (!Object.hasOwn(record, "teamId") ||
      record.teamId === authorization.execution.preview_team_id) &&
    (!Object.hasOwn(record, "accountId") ||
      record.accountId === authorization.execution.preview_team_id))) return false;
  if (Object.hasOwn(record, "project")) {
    if (typeof record.project === "string") {
      if (record.project !== authorization.execution.preview_project_id) return false;
    } else if (
      !record.project || typeof record.project !== "object" ||
      Array.isArray(record.project) ||
      record.project.id !== authorization.execution.preview_project_id ||
      (Object.hasOwn(record.project, "name") &&
        record.project.name !== authorization.execution.preview_project_name) ||
      (Object.hasOwn(record.project, "accountId") &&
        record.project.accountId !== authorization.execution.preview_team_id) ||
      (Object.hasOwn(record.project, "teamId") &&
        record.project.teamId !== authorization.execution.preview_team_id)
    ) return false;
  }
  return true;
}

function exactCreatedEnvironmentResponseId(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const hasDirectId = Object.hasOwn(body, "id");
  const hasEnvelope = Object.hasOwn(body, "created") || Object.hasOwn(body, "failed");
  if (hasDirectId === hasEnvelope) return null;
  if (hasDirectId) return boundedText(body.id, 256) ? body.id : null;
  if (
    Object.hasOwn(body, "failed") &&
    (!Array.isArray(body.failed) || body.failed.length !== 0)
  ) return null;
  const created = Array.isArray(body.created) ? body.created : [body.created];
  if (
    created.length !== 1 || !created[0] ||
    typeof created[0] !== "object" || Array.isArray(created[0]) ||
    !boundedText(created[0].id, 256)
  ) return null;
  return created[0].id;
}

function exactCreatedEnvironmentReadbackRecord(
  record,
  authorization,
  expectedId,
  expectedKey,
) {
  if (
    !record || typeof record !== "object" || Array.isArray(record) ||
    record.id !== expectedId || record.key !== expectedKey ||
    record.type !== "encrypted" ||
    canonicalJson(record.target) !== '["preview"]' ||
    record.gitBranch !== authorization.execution.branch_name
  ) return false;
  if (Object.hasOwn(record, "project")) {
    if (typeof record.project === "string") {
      if (record.project !== authorization.execution.preview_project_id) return false;
    } else if (
      !record.project || typeof record.project !== "object" ||
      Array.isArray(record.project) ||
      record.project.id !== authorization.execution.preview_project_id ||
      (Object.hasOwn(record.project, "name") &&
        record.project.name !== authorization.execution.preview_project_name)
    ) return false;
  }
  const projectFacts = [record.projectId, record.project?.id]
    .filter((value) => value !== undefined && value !== null);
  if (!projectFacts.every(
    (value) => value === authorization.execution.preview_project_id,
  )) return false;
  const teamFacts = [
    record.accountId,
    record.teamId,
    record.project?.accountId,
    record.project?.teamId,
  ].filter((value) => value !== undefined && value !== null);
  return teamFacts.every(
    (value) => value === authorization.execution.preview_team_id,
  );
}

function exactProjectObservation(project, authorization) {
  if (!project || typeof project !== "object" || Array.isArray(project)) return false;
  const teamFacts = [project.accountId, project.teamId]
    .filter((value) => value !== undefined && value !== null);
  return project.id === authorization.execution.preview_project_id &&
    project.name === authorization.execution.preview_project_name &&
    teamFacts.length >= 1 && teamFacts.every(
      (value) => value === authorization.execution.preview_team_id,
    );
}

function exactPreviewHostname(value) {
  return boundedText(value, 512) && value === value.toLowerCase() &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(value) &&
    value.endsWith(".vercel.app");
}

function exactPreviewProject(deployment, authorization) {
  const facts = [];
  if (Object.hasOwn(deployment, "project")) {
    if (
      !deployment.project || typeof deployment.project !== "object" ||
      Array.isArray(deployment.project)
    ) return false;
    facts.push({
      id: deployment.project.id,
      name: deployment.project.name,
    });
  }
  if (Object.hasOwn(deployment, "projectId") || Object.hasOwn(deployment, "name")) {
    facts.push({ id: deployment.projectId, name: deployment.name });
  }
  return facts.length >= 1 && facts.every((fact) =>
    fact.id === authorization.execution.preview_project_id &&
    fact.name === authorization.execution.preview_project_name
  );
}

function exactPreviewGit(deployment, authorization) {
  const [expectedOwner, expectedRepositoryName] =
    authorization.repository.remote_repository.split("/");
  const expectedRepository = authorization.repository.remote_repository;
  if (
    deployment.gitSource &&
    deployment.gitSource.type !== undefined &&
    deployment.gitSource.type !== "github"
  ) return false;
  let commitSeen = false;
  let refSeen = false;
  let repositorySeen = false;
  let ownerSeen = false;
  const sources = [
    deployment.gitSource,
    deployment.meta,
    deployment.gitMetadata,
  ].filter((value) => value && typeof value === "object" && !Array.isArray(value));
  for (const source of sources) {
    const commits = [source.sha, source.commitSha, source.githubCommitSha]
      .filter((value) => value !== undefined && value !== null && value !== "");
    const refs = [source.ref, source.commitRef, source.githubCommitRef]
      .filter((value) => value !== undefined && value !== null && value !== "");
    const repositories = [
      source.repo,
      source.repository,
      source.githubCommitRepo,
    ].filter((value) => value !== undefined && value !== null && value !== "");
    const owners = [source.org, source.owner, source.githubCommitOrg]
      .filter((value) => value !== undefined && value !== null && value !== "");
    if (
      !commits.every(
        (value) => value === authorization.execution.temporary_commit_sha,
      ) ||
      !refs.every((value) => value === authorization.execution.branch_name) ||
      !repositories.every(
        (value) => value === expectedRepository || value === expectedRepositoryName,
      ) ||
      !owners.every((value) => value === expectedOwner)
    ) return false;
    commitSeen ||= commits.length > 0;
    refSeen ||= refs.length > 0;
    repositorySeen ||= repositories.length > 0;
    ownerSeen ||= owners.length > 0;
  }
  return commitSeen && refSeen && repositorySeen &&
    (ownerSeen || sources.some((source) => source.repo === expectedRepository));
}

function exactReadyPreviewDeployment(deployment, authorization, bindings) {
  const identifiers = [deployment?.id, deployment?.uid]
    .filter((value) => value !== undefined && value !== null);
  const id = deployment?.id ?? deployment?.uid;
  const readinessFacts = [deployment?.readyState, deployment?.state]
    .filter((value) => value !== undefined && value !== null);
  const teamFacts = [
    deployment?.ownerId,
    deployment?.teamId,
    deployment?.accountId,
    deployment?.project?.accountId,
    deployment?.project?.teamId,
  ].filter((value) => value !== undefined && value !== null);
  return exactAutomaticPreviewDeployment(deployment, authorization) &&
    identifiers.length >= 1 && identifiers.every((value) => value === id) &&
    id === bindings.deployment_id &&
    exactPreviewHostname(deployment.url) &&
    deployment.url === bindings.deployment_url &&
    deployment.production === false &&
    exactPreviewProject(deployment, authorization) &&
    exactPreviewGit(deployment, authorization) &&
    teamFacts.length >= 1 && teamFacts.every(
      (value) => value === authorization.execution.preview_team_id,
    ) &&
    readinessFacts.length >= 1 && readinessFacts.every((value) => value === "READY");
}

function exactAutomaticPreviewDeployment(deployment, authorization) {
  const identifiers = [deployment?.id, deployment?.uid]
    .filter((value) => value !== undefined && value !== null);
  const id = deployment?.id ?? deployment?.uid;
  const teamFacts = [
    deployment?.ownerId,
    deployment?.teamId,
    deployment?.accountId,
    deployment?.project?.accountId,
    deployment?.project?.teamId,
  ].filter((value) => value !== undefined && value !== null);
  const createdAt = typeof deployment?.createdAt === "number"
    ? deployment.createdAt
    : Date.parse(deployment?.createdAt);
  const createdMinimum = Date.parse(authorization.created_at);
  const createdMaximum = Date.parse(authorization.expires_at);
  const readinessFacts = [deployment?.readyState, deployment?.state]
    .filter((value) => value !== undefined && value !== null);
  return boundedText(id, 256) && identifiers.length >= 1 &&
    identifiers.every((value) => value === id) &&
    exactPreviewHostname(deployment?.url) &&
    deployment.target === null && deployment.production === false &&
    deployment?.gitSource?.type === "github" &&
    exactPreviewProject(deployment, authorization) &&
    exactPreviewGit(deployment, authorization) &&
    teamFacts.length >= 1 && teamFacts.every(
      (value) => value === authorization.execution.preview_team_id,
    ) &&
    Number.isFinite(createdAt) && createdAt >= createdMinimum &&
    createdAt <= createdMaximum &&
    readinessFacts.length >= 1 && readinessFacts.every((value) =>
      ["QUEUED", "INITIALIZING", "BUILDING", "READY"].includes(value)
    );
}

function verifiedPreviewUrl(bindings) {
  if (
    bindings.preview_identity_verified !== true ||
    !boundedText(bindings.deployment_id, 256) ||
    !exactPreviewHostname(bindings.deployment_url)
  ) {
    throw new AdminV1OfficialLivePlatformError(
      "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN",
    );
  }
  return bindings.deployment_url;
}

function exactStorageObjectName(value, authorization) {
  return value === authorization.execution.storage_name ||
    (boundedText(value, 256) &&
      /^admin\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/u.test(value));
}

function exactStorageObservation(body, authorization, objectName) {
  return body && typeof body === "object" && !Array.isArray(body) &&
    body.bucket_id === authorization.execution.storage_bucket &&
    body.name === objectName &&
    boundedText(body.version, 1024);
}

function exactCreatedStorageObservation(body, authorization, objectName) {
  return exactStorageObservation(body, authorization, objectName) &&
    boundedText(body.id, 1024) && boundedText(body.created_at, 64) &&
    body.created_at === body.updated_at &&
    Number.isFinite(Date.parse(body.created_at)) &&
    body.metadata && typeof body.metadata === "object" &&
    !Array.isArray(body.metadata) && boundedText(body.metadata.eTag, 1024) &&
    body.metadata.mimetype === "image/png" &&
    body.metadata.size === OFFICIAL_SYNTHETIC_PNG.byteLength;
}

function exactOwnedRows(input, limits) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const output = {};
  for (const [name, maximum] of Object.entries(limits)) {
    const rows = input[name];
    if (!Array.isArray(rows) || rows.length > maximum) return null;
    const ids = [];
    for (const row of rows) {
      if (
        !row || typeof row !== "object" || Array.isArray(row) ||
        !boundedText(row.row_id, 256) || !boundedText(row.version, 256)
      ) return null;
      ids.push(row.row_id);
    }
    if (new Set(ids).size !== ids.length) return null;
    output[name] = ids;
  }
  return output;
}

const APPLICATION_AUDIT_ACTIONS = new Map([
  [8, "tool_added"],
  [10, "tool_updated"],
  [11, "tool_deleted"],
  [12, "submission_updated"],
  [13, "submission_rejected"],
  [14, "submission_approved"],
  [15, "logo_uploaded"],
  [19, "admin_logout"],
]);
const EXPECTED_AUDIT_ACTION_COUNTS = Object.freeze({
  admin_logout: 2,
  logo_uploaded: 1,
  submission_approved: 1,
  submission_rejected: 1,
  submission_updated: 1,
  tool_added: 1,
  tool_deleted: 1,
  tool_updated: 1,
});
const OFFICIAL_SYNTHETIC_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function exactPlainObject(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function runUserAgent(authorization) {
  return `AiFinder-Official-Run/${authorization.run_id}`;
}

function memoryText(value, maximum = 16_384) {
  if (!(value instanceof Uint8Array) || value.byteLength < 1 || value.byteLength > maximum) {
    throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_INPUT_INVALID");
  }
  const text = Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("utf8");
  if (text.includes("\0") || /[\r\n]/u.test(text)) {
    throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_INPUT_INVALID");
  }
  return text;
}

function routeToolBody(authorization, id = null) {
  return {
    ...(id === null ? {} : { id }),
    name: `AiFinder Official ${authorization.run_id} Route Tool`,
    category: "Productivity",
    description: "Synthetic Official runtime route-owned tool",
    website: `https://${authorization.run_id}-route.invalid/`,
    logo_url: null,
    pricing: "Free",
  };
}

function submissionEditBody(binding, authorization) {
  return {
    id: binding.row_id,
    name: `AiFinder Official ${authorization.run_id} 1 Updated`,
    category: "Productivity",
    description: "Synthetic Official runtime updated submission",
    website: binding.website,
    logo_url: null,
    pricing: "Free",
  };
}

function applicationDescriptor(input, authorization, bindings) {
  const deploymentUrl = verifiedPreviewUrl(bindings);
  const contract = input?.contract;
  if (
    !contract || typeof contract !== "object" || Array.isArray(contract) ||
    !Number.isSafeInteger(contract.ordinal) || !boundedText(contract.method, 16) ||
    !boundedText(contract.path, 512)
  ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_INPUT_INVALID");
  const headers = {
    "user-agent": runUserAgent(authorization),
    [TRUSTED_SOURCE_OIDC_HEADER]: protectedAccessOidcHeader(bindings),
  };
  const cookies = [];
  if (input.session !== null) {
    cookies.push(`aifinder_admin_session=${memoryText(input.session)}`);
  }
  if (input.csrf_cookie !== null) {
    cookies.push(`aifinder_admin_csrf_token=${memoryText(input.csrf_cookie)}`);
  }
  if (cookies.length > 0) headers.cookie = cookies.join("; ");
  if (input.csrf_token !== null) {
    headers["x-csrf-token"] = memoryText(input.csrf_token);
  }
  let body = null;
  if (contract.ordinal === 2) {
    body = { password: memoryText(input.admin_password) };
  } else if (contract.ordinal === 8) {
    body = routeToolBody(authorization);
  } else if (contract.ordinal === 10) {
    if (!Number.isSafeInteger(bindings.route_tool_id)) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    body = routeToolBody(authorization, bindings.route_tool_id);
  } else if (contract.ordinal === 11) {
    if (!Number.isSafeInteger(bindings.route_tool_id)) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    body = { id: bindings.route_tool_id };
  } else if (contract.ordinal === 12) {
    if (!bindings.submissions?.[0]) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    body = submissionEditBody(bindings.submissions[0], authorization);
  } else if (contract.ordinal === 13) {
    if (!bindings.submissions?.[1]) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    body = { submissionId: bindings.submissions[1].row_id };
  } else if (contract.ordinal === 14) {
    if (!bindings.submissions?.[2]) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    body = { submissionId: bindings.submissions[2].row_id };
  } else if (contract.ordinal === 15) {
    const form = new FormData();
    form.set(
      "file",
      new Blob([OFFICIAL_SYNTHETIC_PNG], { type: "image/png" }),
      "official.png",
    );
    body = form;
  }
  if (body !== null && !(body instanceof FormData)) {
    headers["content-type"] = "application/json";
  }
  return {
    service: "PREVIEW",
    method: contract.method,
    path: `https://${deploymentUrl}${contract.path}`,
    headers,
    body,
  };
}

function exactAuditPoststate(body, authorization) {
  if (!Array.isArray(body) || body.length !== 9) return null;
  const marker = runUserAgent(authorization);
  const counts = {};
  const ids = new Set();
  const rows = [];
  let logoObjectId = null;
  for (const row of body) {
    if (
      !exactPlainObject(row, [
        "id", "action", "created_at", "target_id", "target_name", "target_type",
        "user_agent",
      ]) ||
      !boundedText(String(row.id), 256) || ids.has(String(row.id)) ||
      !Object.hasOwn(EXPECTED_AUDIT_ACTION_COUNTS, row.action) ||
      row.user_agent !== marker || !boundedText(row.created_at, 64) ||
      !Number.isFinite(Date.parse(row.created_at)) ||
      ![row.target_id, row.target_name, row.target_type].every((value) =>
        value === null || boundedText(value, 256)
      )
    ) return null;
    if (row.action === "logo_uploaded") {
      if (
        row.target_type !== "storage_object" ||
        row.target_id !== row.target_name ||
        !exactStorageObjectName(row.target_id, authorization)
      ) return null;
      logoObjectId = row.target_id;
    }
    ids.add(String(row.id));
    counts[row.action] = (counts[row.action] ?? 0) + 1;
    rows.push({
      row_id: String(row.id),
      version: row.created_at,
      action: row.action,
    });
  }
  if (
    canonicalJson(counts) !== canonicalJson(EXPECTED_AUDIT_ACTION_COUNTS) ||
    logoObjectId === null
  ) return null;
  return { logo_object_id: logoObjectId, rows };
}

function exactSubmissionPoststate(body, bindings) {
  if (!Array.isArray(body) || body.length !== 3 || bindings.submissions?.length !== 3) {
    return null;
  }
  const byId = new Map(body.map((row) => [String(row?.id), row]));
  if (byId.size !== 3) return null;
  const expectedStatuses = ["pending", "rejected", "approved"];
  const rows = [];
  for (const [index, binding] of bindings.submissions.entries()) {
    const row = byId.get(String(binding.row_id));
    if (
      !row || row.website !== binding.website ||
      row.status !== expectedStatuses[index] ||
      !boundedText(row.updated_at, 128) || row.updated_at === binding.version
    ) return null;
    rows.push({ row_id: String(row.id), version: row.updated_at });
  }
  return rows;
}

function exactToolsPoststate(body, authorization, bindings) {
  if (!Array.isArray(body) || body.length !== 2 || !bindings.submissions?.[2]) {
    return null;
  }
  const routeWebsite = routeToolBody(authorization).website;
  const approvedWebsite = bindings.submissions[2].website;
  const route = body.filter((row) => row?.website === routeWebsite);
  const approved = body.filter((row) => row?.website === approvedWebsite);
  if (
    route.length !== 1 || approved.length !== 1 ||
    String(route[0].id) === String(approved[0].id) ||
    route[0].id !== bindings.route_tool_id || route[0].status !== "archived" ||
    !boundedText(route[0].deleted_at, 64) ||
    approved[0].status !== "approved" || approved[0].deleted_at !== null ||
    !boundedText(route[0].updated_at, 128) ||
    !boundedText(approved[0].updated_at, 128)
  ) return null;
  return [
    {
      row_id: String(route[0].id),
      version: route[0].updated_at,
      role: "ROUTE_TOOL",
    },
    {
      row_id: String(approved[0].id),
      version: approved[0].updated_at,
      role: "APPROVED_SUBMISSION",
    },
  ];
}

function exactApplicationSecurityHeaders(headers) {
  return headers?.cache_control === "no-store" &&
    headers.content_security_policy ===
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" &&
    boundedText(headers.content_type, 256) &&
    headers.content_type.toLowerCase().startsWith("application/json") &&
    headers.cross_origin_opener_policy === "same-origin" &&
    headers.permissions_policy ===
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" &&
    headers.referrer_policy === "strict-origin-when-cross-origin" &&
    headers.strict_transport_security ===
      "max-age=31536000; includeSubDomains; preload" &&
    headers.x_content_type_options === "nosniff" &&
    headers.x_dns_prefetch_control === "off" &&
    headers.x_frame_options === "DENY";
}

function zeroProjectedResponseCookies(response) {
  for (const value of response?.response_headers?.set_cookie ?? []) {
    if (value instanceof Uint8Array) value.fill(0);
  }
}

function exactVercelProtectionChallenge(response, expectedUrl) {
  const body = response?.body;
  const headers = response?.response_headers;
  return response?.status === 401 && response.response_json === "NON_JSON" &&
    Number.isSafeInteger(response.response_bytes) && response.response_bytes >= 1 &&
    response.response_bytes <= MAX_PROTECTION_CHALLENGE_BYTES &&
    typeof body === "string" && !body.includes("\0") &&
    Buffer.byteLength(body, "utf8") === response.response_bytes &&
    boundedText(headers?.content_type, 256) &&
    headers.content_type.toLowerCase().startsWith("text/html") &&
    Array.isArray(headers.set_cookie) && headers.set_cookie.length === 0 &&
    VERCEL_PROTECTION_CHALLENGE_MARKERS.every((marker) => body.includes(marker)) &&
    body.includes(`url=${encodeURIComponent(expectedUrl)}`);
}

function exactAiFinderUnauthenticatedSession(response) {
  return response?.status === 401 && response.response_json === "EXACT_BOUNDED" &&
    Number.isSafeInteger(response.response_bytes) && response.response_bytes >= 1 &&
    response.response_bytes <= 4096 &&
    exactApplicationSecurityHeaders(response.response_headers) &&
    Array.isArray(response.response_headers.set_cookie) &&
    response.response_headers.set_cookie.length === 0 &&
    exactPlainObject(response.body, ["authenticated", "message"]) &&
    response.body.authenticated === false && response.body.message === "Unauthorized.";
}

function protectedAccessOidcHeader(bindings) {
  if (
    bindings.protected_access_verified !== true ||
    !(bindings.protected_access_oidc_token instanceof Uint8Array)
  ) {
    throw new AdminV1OfficialLivePlatformError(
      "OFFICIAL_PROTECTED_ACCESS_UNPROVEN",
    );
  }
  return credentialText(bindings.protected_access_oidc_token);
}

function clearProtectedAccessBinding(bindings) {
  if (bindings.protected_access_oidc_token instanceof Uint8Array) {
    bindings.protected_access_oidc_token.fill(0);
  }
  delete bindings.protected_access_oidc_token;
  bindings.protected_access_verified = false;
}

function boundedNullableText(value, maximum) {
  return value === null ||
    (typeof value === "string" && value.length <= maximum &&
      !value.includes("\0") && !/[\r\n]/u.test(value));
}

function exactBoundedRows(rows, validator) {
  if (!Array.isArray(rows) || rows.length > MAX_APPLICATION_ROWS) return false;
  const ids = new Set();
  for (const row of rows) {
    if (!validator(row) || ids.has(row.id)) return false;
    ids.add(row.id);
  }
  return true;
}

function exactApplicationToolRow(row) {
  return exactPlainObject(row, [
    "id", "name", "category", "description", "website", "pricing",
    "logo_url", "status", "deleted_at",
  ]) && Number.isSafeInteger(row.id) && row.id > 0 &&
    boundedText(row.name, 256) && boundedText(row.category, 128) &&
    boundedText(row.description, 8192) && boundedText(row.website, 2048) &&
    boundedNullableText(row.pricing, 256) &&
    boundedNullableText(row.logo_url, 2048) && boundedText(row.status, 64) &&
    boundedNullableText(row.deleted_at, 128);
}

function exactApplicationSubmissionRow(row) {
  return exactPlainObject(row, [
    "id", "name", "category", "description", "website", "pricing",
    "logo_url", "submitter_name", "submitter_email", "status", "created_at",
  ]) && Number.isSafeInteger(row.id) && row.id > 0 &&
    boundedText(row.name, 256) && boundedText(row.category, 128) &&
    boundedText(row.description, 8192) && boundedText(row.website, 2048) &&
    boundedNullableText(row.pricing, 256) &&
    boundedNullableText(row.logo_url, 2048) &&
    boundedNullableText(row.submitter_name, 256) &&
    boundedNullableText(row.submitter_email, 320) &&
    boundedText(row.status, 64) && boundedText(row.created_at, 128) &&
    Number.isFinite(Date.parse(row.created_at));
}

function exactNonnegativeCount(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
}

function exactApplicationBody(contract, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  if (contract.ordinal === 2) {
    return exactPlainObject(body, ["success", "message"]) && body.success === true &&
      body.message === "Admin login successful.";
  }
  if (contract.ordinal === 3) {
    return exactPlainObject(body, ["authenticated", "role"]) &&
      body.authenticated === true && body.role === "admin";
  }
  if (contract.ordinal === 4) {
    return exactPlainObject(body, ["success", "csrfToken"]) && body.success === true &&
      typeof body.csrfToken === "string" && /^[0-9a-f]{64}$/u.test(body.csrfToken);
  }
  if ([6, 7, 9].includes(contract.ordinal)) {
    if (contract.ordinal === 6) {
      return exactPlainObject(body, ["stats", "submissions"]) &&
        exactBoundedRows(body.submissions, exactApplicationSubmissionRow) &&
        exactPlainObject(body.stats, [
          "approvedSubmissions", "pendingSubmissions", "rejectedSubmissions", "totalTools",
        ]) && Object.values(body.stats).every(exactNonnegativeCount);
    }
    return exactPlainObject(body, ["tools"]) &&
      exactBoundedRows(body.tools, exactApplicationToolRow);
  }
  if ([8, 10, 11, 12, 13, 14, 19].includes(contract.ordinal)) {
    return exactPlainObject(body, ["success", "message"]) && body.success === true &&
      boundedText(body.message, 256);
  }
  if (contract.ordinal === 15) {
    return exactPlainObject(body, ["success", "logoUrl"]) && body.success === true &&
      boundedText(body.logoUrl, 2048);
  }
  if (contract.ordinal === 20) {
    return exactPlainObject(body, ["authenticated", "message"]) &&
      body.authenticated === false && boundedText(body.message, 256);
  }
  return exactPlainObject(body, ["error"]) && boundedText(body.error, 512);
}

function parseExactSetCookie(
  buffer,
  { name, httpOnly, maxAge, empty },
) {
  if (
    !(buffer instanceof Uint8Array) || buffer.byteLength < 1 ||
    buffer.byteLength > 16_384
  ) return null;
  const text = Buffer.from(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  ).toString("latin1");
  if (/[\0\r\n]/u.test(text)) return null;
  const segments = text.split(";");
  const first = segments.shift();
  if (typeof first !== "string" || !first.startsWith(`${name}=`)) return null;
  const value = first.slice(name.length + 1);
  if (
    value.length > 4096 ||
    !/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/u.test(value) ||
    (empty ? value !== "" : value === "")
  ) return null;
  const attributes = new Map();
  for (const raw of segments) {
    const segment = raw.trim();
    if (segment === "") return null;
    const equals = segment.indexOf("=");
    const key = (equals < 0 ? segment : segment.slice(0, equals)).toLowerCase();
    const attributeValue = equals < 0 ? null : segment.slice(equals + 1);
    if (attributes.has(key)) return null;
    attributes.set(key, attributeValue);
  }
  const expectedAttributeCount = httpOnly ? 5 : 4;
  if (
    attributes.size !== expectedAttributeCount ||
    attributes.get("path") !== "/" ||
    attributes.get("secure") !== null ||
    attributes.get("samesite")?.toLowerCase() !== "strict" ||
    attributes.get("max-age") !== String(maxAge) ||
    (httpOnly ? attributes.get("httponly") !== null : attributes.has("httponly"))
  ) return null;
  return value;
}

function normalizedApplicationResult(
  input,
  response,
  authorization,
  bindings,
  credentials,
) {
  const contract = input.contract;
  const headers = response?.response_headers;
  if (
    response?.status !== contract.status || !exactApplicationSecurityHeaders(headers) ||
    !exactApplicationBody(contract, response.body) ||
    response.response_json !== "EXACT_BOUNDED" ||
    !Number.isSafeInteger(response.response_bytes) || response.response_bytes < 1 ||
    response.response_bytes > MAX_APPLICATION_JSON_RESPONSE_BYTES ||
    !Array.isArray(headers.set_cookie)
  ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
  const result = {
    status: response.status,
    header_projection: "EXACT_SECURITY_HEADERS",
    body_shape: "EXACT_BOUNDED_JSON",
    cookie_effect: "NONE",
    effect: APPLICATION_AUDIT_ACTIONS.has(contract.ordinal)
      ? { audit_action: APPLICATION_AUDIT_ACTIONS.get(contract.ordinal) }
      : null,
    ownership_projection: "EXACT_POSTSTATE_REQUIRED",
  };
  try {
    if (contract.ordinal === 2) {
      if (headers.set_cookie.length !== 1) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      }
      const value = parseExactSetCookie(headers.set_cookie[0], {
        name: SESSION_COOKIE_NAME,
        httpOnly: true,
        maxAge: APPLICATION_COOKIE_MAX_AGE_SECONDS,
        empty: false,
      });
      if (!boundedText(value, 4096)) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      }
      result.cookie_effect = "SESSION_SET";
      result.session_cookie = Buffer.from(value, "utf8");
    } else if (contract.ordinal === 4) {
      if (headers.set_cookie.length !== 1) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      }
      const value = parseExactSetCookie(headers.set_cookie[0], {
        name: CSRF_COOKIE_NAME,
        httpOnly: false,
        maxAge: APPLICATION_COOKIE_MAX_AGE_SECONDS,
        empty: false,
      });
      if (value !== response.body.csrfToken) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      }
      result.cookie_effect = "CSRF_SET";
      result.csrf_cookie = Buffer.from(value, "utf8");
      result.csrf_token = Buffer.from(value, "utf8");
    } else if (contract.ordinal === 19) {
      const cleared = new Map();
      for (const cookie of headers.set_cookie) {
        const sessionValue = parseExactSetCookie(cookie, {
          name: SESSION_COOKIE_NAME,
          httpOnly: true,
          maxAge: 0,
          empty: true,
        });
        const csrfValue = parseExactSetCookie(cookie, {
          name: CSRF_COOKIE_NAME,
          httpOnly: false,
          maxAge: 0,
          empty: true,
        });
        const cookieName = sessionValue !== null
          ? SESSION_COOKIE_NAME
          : csrfValue !== null
            ? CSRF_COOKIE_NAME
            : null;
        if (cookieName === null || cleared.has(cookieName)) {
          throw new AdminV1OfficialLivePlatformError(
            "OFFICIAL_APPLICATION_RESPONSE_INVALID",
          );
        }
        cleared.set(cookieName, "");
      }
      if (
        headers.set_cookie.length !== 2 ||
        !cleared.has(SESSION_COOKIE_NAME) || !cleared.has(CSRF_COOKIE_NAME)
      ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      result.cookie_effect = "SESSION_CSRF_CLEARED";
    } else if (headers.set_cookie.length !== 0) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
    }
    if (contract.ordinal === 9) {
      const matches = response.body.tools.filter(
        (row) => row?.website === routeToolBody(authorization).website,
      );
      if (
        matches.length !== 1 || !Number.isSafeInteger(matches[0].id) ||
        matches[0].id <= 0
      ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
      bindings.route_tool_id = matches[0].id;
    }
    if (contract.ordinal === 14) result.effect.approval_rpc = 1;
    if (contract.ordinal === 15) {
      let logoUrl;
      let supabaseUrl;
      try {
        logoUrl = new URL(response.body.logoUrl);
        supabaseUrl = new URL(credentials.supabase_url);
      } catch {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
      }
      const prefix =
        `/storage/v1/object/public/${authorization.execution.storage_bucket}/`;
      const objectName = decodeURIComponent(logoUrl.pathname.slice(prefix.length));
      if (
        logoUrl.origin !== supabaseUrl.origin ||
        !logoUrl.pathname.startsWith(prefix) || logoUrl.search !== "" ||
        logoUrl.hash !== "" || !exactStorageObjectName(objectName, authorization)
      ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
      bindings.logo_object_name = objectName;
    }
    if (contract.ordinal === 16) {
      if (headers.allow !== "GET, POST, PUT, DELETE") {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_RESPONSE_INVALID");
      }
      result.allow_methods = headers.allow.split(", ");
    }
    if ([17, 18].includes(contract.ordinal)) {
      Object.assign(result, {
        proxy_scope: "DENY_ADMIN_API_PATH",
        deferred_handler_executions: 0,
        deferred_database_effects: 0,
        deferred_rpc_effects: 0,
        deferred_storage_effects: 0,
      });
    }
    return result;
  } finally {
    for (const value of headers.set_cookie) value.fill(0);
  }
}

function providerDescriptor(operation, input, authorization, bindings) {
  const team = `teamId=${encodeURIComponent(authorization.execution.preview_team_id)}`;
  const project = encodeURIComponent(authorization.execution.preview_project_id);
  const run = encodeURIComponent(authorization.run_id);
  const branch = encodeURIComponent(authorization.execution.branch_name);
  const table = (name, query = "") => `/rest/v1/${name}${query}`;
  if (operation === "acquire_automatic_preview") return {
    service: "VERCEL", method: "GET",
    path: `/v6/deployments?${team}&projectId=${project}&target=preview&meta-githubCommitRef=${branch}&limit=100`,
  };
  if (operation.startsWith("create_environment_")) return {
    service: "VERCEL", method: "POST",
    path: `/v10/projects/${project}/env?${team}&upsert=false`,
    body: {
      key: input.key,
      value: memoryText(input.value),
      type: "encrypted",
      target: ["preview"],
      gitBranch: authorization.execution.branch_name,
    },
  };
  if (operation.startsWith("verify_environment_")) return {
    service: "VERCEL", method: "GET",
    path: `/v9/projects/${project}/env/${encodeURIComponent(input.record_id)}?decrypt=false&${team}`,
  };
  if (operation === "verify_preview_identity") return {
    service: "VERCEL", method: "GET",
    path: `/v13/deployments/${encodeURIComponent(bindings.deployment_id)}?${team}&withGitRepoInfo=true`,
  };
  if (operation === "generate_oidc") {
    verifiedPreviewUrl(bindings);
    return {
      service: "VERCEL", method: "POST", path: `/v1/oidc/token?${team}`,
      body: { projectId: authorization.execution.preview_project_id },
    };
  }
  if (operation === "inspect_owned_database_residue") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("submitted_tools", `?select=id&website=like.*${run}*&limit=4`),
  };
  if (operation === "create_submitted_fixture") return {
    service: "SUPABASE_SERVICE", method: "POST",
    path: table("submitted_tools", "?select=id,name,status,updated_at,website"),
    headers: { prefer: "return=representation" },
    body: {
      name: `AiFinder Official ${authorization.run_id} ${input.fixture_ordinal}`,
      website: input.website,
      category: "Productivity",
      description: "Synthetic Official runtime fixture",
      status: "pending",
    },
  };
  if (operation === "inspect_submissions_poststate") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("submitted_tools", `?select=id,status,updated_at,website&website=like.*${run}*`),
  };
  if (operation === "inspect_tools_poststate") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("tools", `?select=id,status,updated_at,website,deleted_at&website=like.*${run}*`),
  };
  if (operation === "inspect_audits_poststate") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table(
      "admin_audit_logs",
      `?select=id,action,created_at,target_id,target_name,target_type,user_agent&user_agent=eq.${encodeURIComponent(runUserAgent(authorization))}&limit=10`,
    ),
  };
  if (operation === "application_request") {
    return applicationDescriptor(input, authorization, bindings);
  }
  if (operation === "storage_read_owned_version") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: `/storage/v1/object/info/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`,
  };
  if (operation === "prepare_storage_cleanup_grant") return {
    service: "SUPABASE_SERVICE", method: "POST",
    path: table("rpc/aifinder_prepare_storage_cleanup_grant"), body: input,
  };
  if (operation === "delete_storage_exact_version") return {
    service: "SUPABASE_ANON", method: "DELETE",
    path: `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}`,
    body: { prefixes: [authorization.execution.storage_name] },
  };
  if (operation === "revoke_storage_cleanup_grant") return {
    service: "SUPABASE_SERVICE", method: "POST",
    path: table("rpc/aifinder_revoke_storage_cleanup_grant"), body: input,
  };
  if (operation === "delete_preview") return {
    service: "VERCEL", method: "DELETE",
    path: `/v13/deployments/${encodeURIComponent(input.deployment_id)}?${team}`,
  };
  if (operation.startsWith("delete_environment_")) return {
    service: "VERCEL", method: "DELETE",
    path: `/v9/projects/${project}/env/${encodeURIComponent(input.record_id)}?${team}`,
  };
  if (operation === "retire_protected_access") return {
    service: "VERCEL", method: "GET",
    path: `/v13/deployments/${encodeURIComponent(input.deployment_id)}?${team}`,
  };
  if (operation.startsWith("delete_submitted_fixture_")) return {
    service: "SUPABASE_SERVICE", method: "DELETE",
    path: table("submitted_tools", `?id=eq.${encodeURIComponent(input.row_id)}&updated_at=eq.${encodeURIComponent(input.expected_version)}`),
  };
  if (operation.startsWith("delete_owned_tool_")) return {
    service: "SUPABASE_SERVICE", method: "DELETE",
    path: table("tools", `?id=eq.${encodeURIComponent(input.row_id)}&updated_at=eq.${encodeURIComponent(input.expected_version)}`),
  };
  if (operation === "delete_owned_audits") return {
    service: "SUPABASE_SERVICE", method: "DELETE",
    path: table(
      "admin_audit_logs",
      `?or=(${input.rows.map((row) =>
        `and(id.eq.${encodeURIComponent(row.row_id)},created_at.eq.${encodeURIComponent(row.version)})`
      ).join(",")})&select=id,action,created_at,user_agent`,
    ),
    headers: { prefer: "return=representation" },
  };
  throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_OPERATION_DENIED");
}

function normalizedProviderResult(
  operation,
  response,
  bindings,
  input,
  authorization,
  credentials,
) {
  const body = response?.body;
  if (operation === "acquire_automatic_preview") {
    const deployments = response?.status === 200
      ? terminalDeploymentInventory(body)
      : null;
    if (deployments === null) {
      throw new AdminV1OfficialLivePlatformError(
        "OFFICIAL_AUTOMATIC_PREVIEW_IDENTITY_UNPROVEN",
      );
    }
    if (deployments.length === 0) return { status: "PENDING" };
    if (
      deployments.length !== 1 ||
      !exactAutomaticPreviewDeployment(deployments[0], authorization)
    ) {
      throw new AdminV1OfficialLivePlatformError(
        "OFFICIAL_AUTOMATIC_PREVIEW_IDENTITY_UNPROVEN",
      );
    }
    const deployment = deployments[0];
    const deploymentId = deployment.id ?? deployment.uid;
    bindings.deployment_id = deploymentId;
    bindings.deployment_url = deployment.url;
    bindings.preview_identity_verified = false;
    return {
      status: "ACQUIRED_EXACT",
      deployment_id: bindings.deployment_id,
    };
  }
  if (operation.startsWith("verify_environment_")) {
    if (
      response.status !== 200 ||
      !exactCreatedEnvironmentReadbackRecord(
        body,
        authorization,
        input.record_id,
        input.key,
      )
    ) {
      throw new AdminV1OfficialLivePlatformError(
        "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
      );
    }
    return { status: "EXACT", record_id: input.record_id };
  }
  if (operation === "verify_preview_identity") {
    if (
      response.status !== 200 ||
      !exactReadyPreviewDeployment(body, authorization, bindings)
    ) {
      throw new AdminV1OfficialLivePlatformError(
        "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN",
      );
    }
    bindings.preview_identity_verified = true;
    return {
      status: "EXACT",
      deployment_id: bindings.deployment_id,
    };
  }
  if (operation === "generate_oidc") {
    if (
      response.status !== 200 || response.response_json !== "EXACT_BOUNDED" ||
      !exactPlainObject(body, ["token"]) || !boundedText(body.token, 16_384)
    ) {
      throw new AdminV1OfficialLivePlatformError(
        "OFFICIAL_PROTECTED_ACCESS_UNPROVEN",
      );
    }
    return { token: Buffer.from(body.token, "utf8") };
  }
  if (operation === "inspect_owned_database_residue") {
    return { status: Array.isArray(body) && body.length === 0 ? "ABSENT" : "PRESENT" };
  }
  if (operation === "create_submitted_fixture") {
    const row = Array.isArray(body) ? body[0] : body;
    const expectedName =
      `AiFinder Official ${authorization.run_id} ${input.fixture_ordinal}`;
    const result = {
      status: response.status >= 200 && response.status < 300
        ? "CREATED_EXACT"
        : "FAILED",
      row_id: String(row?.id ?? ""),
      version: row?.updated_at,
    };
    if (result.status === "CREATED_EXACT") {
      if (
        !exactPlainObject(row, ["id", "name", "status", "updated_at", "website"]) ||
        !Number.isSafeInteger(row.id) || row.id <= 0 ||
        row.name !== expectedName || row.status !== "pending" ||
        row.website !== input.website || !boundedText(result.version, 128)
      ) {
        throw new AdminV1OfficialLivePlatformError(
          "OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN",
        );
      }
      bindings.submissions ??= [];
      bindings.submissions.push({
        fixture_ordinal: input.fixture_ordinal,
        row_id: Number.isSafeInteger(row.id) ? row.id : result.row_id,
        version: result.version,
        website: input.website,
      });
    }
    return result;
  }
  if (operation === "storage_read_owned_version") {
    return { status: response.status === 200 ? "EXACT" : "ABSENT", version: body?.version };
  }
  if (operation === "prepare_storage_cleanup_grant") {
    const row = Array.isArray(body) ? body[0] : body;
    if (response.status >= 300 || !boundedText(row?.grant_id, 128)) {
      return { status: "FAILED" };
    }
    bindings.cleanup_grant_id = row.grant_id;
    bindings.cleanup_grant_revoked = false;
    return { status: "PREPARED", grant_id: row.grant_id };
  }
  if (operation === "revoke_storage_cleanup_grant") {
    if (
      response.status >= 300 || body !== true ||
      input?.grant_id !== bindings.cleanup_grant_id
    ) return { status: "FAILED" };
    bindings.cleanup_grant_revoked = true;
    return { status: "REVOKED_EXACT" };
  }
  if (operation === "delete_owned_audits") {
    if (response.status !== 200 || !Array.isArray(body) || body.length !== 9) {
      return { status: "FAILED" };
    }
    const expected = new Map(input.rows.map((row) => [row.row_id, row.version]));
    if (
      expected.size !== 9 || body.some((row) =>
        !row || typeof row !== "object" || Array.isArray(row) ||
        expected.get(String(row.id)) !== row.created_at ||
        row.user_agent !== runUserAgent(authorization)
      ) || new Set(body.map((row) => String(row.id))).size !== 9
    ) return { status: "FAILED" };
    return { status: "DELETED_EXACT" };
  }
  if (operation === "delete_storage_exact_version" || operation.startsWith("delete_") || operation === "retire_protected_access") {
    return { status: response.status < 300 || response.status === 404 ? "DELETED_EXACT" : "FAILED" };
  }
  if (operation === "inspect_audits_poststate") {
    const observation = exactAuditPoststate(body, authorization);
    if (response.status !== 200 || observation === null) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    return {
      status: "EXACT",
      audits: 9,
      logo_object_id: observation.logo_object_id,
      rows: observation.rows,
      ownership_readback: "EXACT",
      unrelated_preserved: true,
    };
  }
  if (operation === "application_request") {
    return normalizedApplicationResult(
      input,
      response,
      authorization,
      bindings,
      credentials,
    );
  }
  if (operation === "inspect_submissions_poststate") {
    const rows = exactSubmissionPoststate(body, bindings);
    if (response.status !== 200 || rows === null) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    return {
      status: "EXACT",
      submitted_tools: 3,
      rows,
      ownership_readback: "EXACT",
      unrelated_preserved: true,
    };
  }
  if (operation === "inspect_tools_poststate") {
    const rows = exactToolsPoststate(body, authorization, bindings);
    if (response.status !== 200 || rows === null) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
    }
    return {
      status: "EXACT",
      tools: 2,
      rows,
      ownership_readback: "EXACT",
      unrelated_preserved: true,
    };
  }
  return body;
}

export function createAdminV1OfficialConcreteTransport({
  execution_context,
  fetch_impl = globalThis.fetch,
  random_bytes = (size) => globalThis.crypto.getRandomValues(new Uint8Array(size)),
  random_uuid = () => globalThis.crypto.randomUUID(),
  spawn_sync,
} = {}) {
  const lowLevel = createConcreteLiveTransport({
    fetch_impl,
    ...(spawn_sync ? { spawn_sync } : {}),
    git_execution_context: execution_context?.git_execution_context,
  });
  const bindings = {};
  const request = (operation, credentials, descriptor) => lowLevel.request({
    ...descriptor,
    credentials,
    operation,
  });
  const teamQuery = (authorization) =>
    `teamId=${encodeURIComponent(authorization.execution.preview_team_id)}`;
  const projectPath = (authorization) =>
    encodeURIComponent(authorization.execution.preview_project_id);
  const storageObjectPath = (authorization, objectName) =>
    `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}/${objectName.split("/").map(encodeURIComponent).join("/")}`;
  const storageInfoPath = (authorization, objectName) =>
    `/storage/v1/object/info/${encodeURIComponent(authorization.execution.storage_bucket)}/${objectName.split("/").map(encodeURIComponent).join("/")}`;

  async function readStoragePresence(operation, authorization, credentials, objectName) {
    if (!exactStorageObjectName(objectName, authorization)) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    }
    return request(operation, credentials, {
      service: "SUPABASE_SERVICE",
      method: "HEAD",
      path: storageObjectPath(authorization, objectName),
    });
  }

  async function readExactStorageInfo(operation, authorization, credentials, objectName) {
    const response = await request(operation, credentials, {
      service: "SUPABASE_SERVICE",
      method: "GET",
      path: storageInfoPath(authorization, objectName),
    });
    if (
      response.status !== 200 ||
      !exactStorageObservation(response.body, authorization, objectName)
    ) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    }
    return response.body;
  }

  async function readDeploymentNamespace(operation, authorization, credentials) {
    const response = await request(operation, credentials, {
      service: "VERCEL",
      method: "GET",
      path: `/v6/deployments?${teamQuery(authorization)}&projectId=${projectPath(authorization)}&target=preview&meta-githubCommitRef=${encodeURIComponent(authorization.execution.branch_name)}&limit=100`,
    });
    if (response.status !== 200) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_UNPROVEN");
    }
    const deployments = terminalDeploymentInventory(response.body);
    if (
      deployments === null ||
      !deployments.every((entry) =>
        exactAutomaticPreviewDeployment(entry, authorization) ||
        exactOwnedDeployment(entry, authorization)
      )
    ) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
    }
    return deployments;
  }

  async function readEnvironmentNamespace(operation, authorization, credentials) {
    const response = await request(operation, credentials, {
      service: "VERCEL",
      method: "GET",
      path: `/v10/projects/${projectPath(authorization)}/env?target=preview&gitBranch=${encodeURIComponent(authorization.execution.branch_name)}&decrypt=false&${teamQuery(authorization)}`,
    });
    if (response.status !== 200) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_UNPROVEN");
    }
    const records = terminalEnvironmentInventory(response.body);
    if (
      records === null ||
      !records.every((entry) => exactEnvironmentRecord(entry, authorization))
    ) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
    }
    const ids = records.map((entry) => entry.id);
    const keys = records.map((entry) => entry.key);
    if (new Set(ids).size !== ids.length || new Set(keys).size !== keys.length) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
    }
    return records;
  }

  async function inspectPriorExternalResidue({ authorization, credentials }) {
    const remote = await lowLevel.git.inspect({ authorization, credentials });
    if (remote.status !== "ABSENT") return { status: "PRESENT" };
    if ((await readDeploymentNamespace(
      "inspect_prior_residue",
      authorization,
      credentials,
    )).length !== 0) return { status: "PRESENT" };
    if ((await readEnvironmentNamespace(
      "inspect_prior_residue",
      authorization,
      credentials,
    )).length !== 0) return { status: "PRESENT" };
    return { status: "ABSENT" };
  }

  async function inspectEnvironmentContract({ authorization, credentials, rawCredentials }) {
    const observation = rawCredentials?.[CREDENTIAL_ENVIRONMENT_OBSERVATION];
    if (
      !observation || observation.github_alias_count !== 1 ||
      observation.node_env !== "production" ||
      canonicalJson(observation.names) !==
        canonicalJson(ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES) ||
      canonicalJson(observation.credential_source_policy) !==
        canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY) ||
      canonicalJson(authorization.execution.environment_keys) !==
        canonicalJson(["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"])
    ) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_ENVIRONMENT_OBSERVATION_UNPROVEN");
    }
    const response = await request("inspect_environment_contract", credentials, {
      service: "VERCEL",
      method: "GET",
      path: `/v9/projects/${projectPath(authorization)}?${teamQuery(authorization)}`,
    });
    if (response.status !== 200 || !exactProjectObservation(response.body, authorization)) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_ENVIRONMENT_OBSERVATION_UNPROVEN");
    }
    return {
      status: "EXACT",
      names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES],
    };
  }

  async function inspectOwnedDataNamespace({
    authorization,
    credentials,
    allowedStorageReplacementVersion = null,
    storageObjectName = authorization.execution.storage_name,
    operation = "inspect_owned_database_residue",
  }) {
    const run = encodeURIComponent(authorization.run_id);
    const descriptors = [
      `/rest/v1/submitted_tools?select=id&website=like.*${run}*&limit=4`,
      `/rest/v1/tools?select=id&website=like.*${run}*&limit=3`,
      `/rest/v1/admin_audit_logs?select=id&user_agent=eq.${encodeURIComponent(runUserAgent(authorization))}&limit=10`,
    ];
    for (const path of descriptors) {
      const response = await request(operation, credentials, {
        service: "SUPABASE_SERVICE",
        method: "GET",
        path,
      });
      if (
        response.status !== 200 || !Array.isArray(response.body) ||
        response.body.length > 9
      ) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
      }
      if (response.body.length !== 0) return { status: "PRESENT" };
    }
    const storage = await readStoragePresence(
      operation,
      authorization,
      credentials,
      storageObjectName,
    );
    if ([400, 404].includes(storage.status)) return { status: "ABSENT" };
    if (!(storage.status >= 200 && storage.status < 300)) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    }
    if (allowedStorageReplacementVersion === null) return { status: "PRESENT" };
    const info = await readExactStorageInfo(
      operation,
      authorization,
      credentials,
      storageObjectName,
    );
    return info.version === allowedStorageReplacementVersion
      ? { status: "PRESENT" }
      : { status: "ABSENT" };
  }

  async function verifyZeroDataResidual({ authorization, credentials, input }) {
    if (
      typeof input.allow_non_owned_storage_replacement !== "boolean" ||
      !input.owned || typeof input.owned !== "object" || Array.isArray(input.owned)
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    const ownedRows = exactOwnedRows(input.owned, {
      audit_rows: 9,
      submissions: 3,
      tools: 2,
    });
    if (ownedRows === null) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    }
    const logo = input.owned.logo;
    if (
      (logo !== null && (
        !logo || typeof logo !== "object" || Array.isArray(logo) ||
        !boundedText(logo.object_id, 128) || !boundedText(logo.version, 128)
      )) ||
      (input.allow_non_owned_storage_replacement && logo === null)
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    const namespace = await inspectOwnedDataNamespace({
      authorization,
      credentials,
      allowedStorageReplacementVersion:
        input.allow_non_owned_storage_replacement ? logo.version : null,
      storageObjectName: logo?.object_id ?? authorization.execution.storage_name,
      operation: "verify_zero_data_residual",
    });
    if (namespace.status !== "ABSENT") {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_RESIDUAL_PRESENT");
    }
    const relations = [
      ["admin_audit_logs", ownedRows.audit_rows],
      ["submitted_tools", ownedRows.submissions],
      ["tools", ownedRows.tools],
    ];
    for (const [relation, ids] of relations) {
      if (ids.length === 0) continue;
      const response = await request("verify_zero_data_residual", credentials, {
        service: "SUPABASE_SERVICE",
        method: "GET",
        path: `/rest/v1/${relation}?select=id&id=in.(${ids.map(encodeURIComponent).join(",")})&limit=${ids.length + 1}`,
      });
      if (
        response.status !== 200 || !Array.isArray(response.body) ||
        response.body.length > ids.length ||
        response.body.some((row) =>
          !row || typeof row !== "object" || Array.isArray(row) ||
          !ids.includes(String(row.id))
        )
      ) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
      }
      if (response.body.length !== 0) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_RESIDUAL_PRESENT");
      }
    }
    if (logo !== null) {
      const storage = await readStoragePresence(
        "verify_zero_data_residual",
        authorization,
        credentials,
        logo.object_id,
      );
      if (input.allow_non_owned_storage_replacement) {
        if (!(storage.status >= 200 && storage.status < 300)) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
        }
        const info = await readExactStorageInfo(
          "verify_zero_data_residual",
          authorization,
          credentials,
          logo.object_id,
        );
        if (info.version === logo.version) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
        }
      } else if (![400, 404].includes(storage.status)) {
        if (storage.status >= 200 && storage.status < 300) {
          await readExactStorageInfo(
            "verify_zero_data_residual",
            authorization,
            credentials,
            logo.object_id,
          );
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_RESIDUAL_PRESENT");
        }
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
      }
    }
    if (
      bindings.cleanup_grant_id !== undefined &&
      bindings.cleanup_grant_revoked !== true
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_GRANT_RESIDUAL_UNPROVEN");
    return {
      status: "PROVEN_ABSENT",
      ownership_readback: "EXACT",
      unrelated_preserved: true,
    };
  }

  async function verifyZeroExternalResidual({ authorization, credentials, input }) {
    const expectedRef = `refs/heads/${authorization.execution.branch_name}`;
    if (
      !input || typeof input !== "object" || Array.isArray(input) ||
      ![null, expectedRef].includes(input.remote_ref) ||
      (input.deployment_id !== null && !boundedText(input.deployment_id, 256)) ||
      !Array.isArray(input.environment_record_ids) ||
      input.environment_record_ids.length > 2 ||
      input.environment_record_ids.some((value) => !boundedText(value, 256)) ||
      new Set(input.environment_record_ids).size !== input.environment_record_ids.length ||
      (input.local_state_id !== null && !boundedText(input.local_state_id, 256))
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
    if (
      input.local_state_id !== null &&
      (bindings.local_state_id !== input.local_state_id ||
        bindings.local_state_cleaned !== true)
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_LOCAL_STATE_RESIDUAL_UNPROVEN");
    const remote = await lowLevel.git.inspect({ authorization, credentials });
    if (remote.status !== "ABSENT") {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_RESIDUAL_PRESENT");
    }
    if (input.deployment_id !== null) {
      const deployment = await request("verify_zero_external_residual", credentials, {
        service: "VERCEL",
        method: "GET",
        path: `/v13/deployments/${encodeURIComponent(input.deployment_id)}?${teamQuery(authorization)}&withGitRepoInfo=true`,
      });
      if (deployment.status !== 404) {
        if (
          deployment.status === 200 &&
          exactAutomaticPreviewDeployment(deployment.body, authorization) &&
          (deployment.body.id ?? deployment.body.uid) === input.deployment_id
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_RESIDUAL_PRESENT");
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
      }
    }
    if ((await readDeploymentNamespace(
      "verify_zero_external_residual",
      authorization,
      credentials,
    )).length !== 0) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_RESIDUAL_PRESENT");
    }
    for (const recordId of input.environment_record_ids) {
      const environment = await request("verify_zero_external_residual", credentials, {
        service: "VERCEL",
        method: "GET",
        path: `/v9/projects/${projectPath(authorization)}/env/${encodeURIComponent(recordId)}?${teamQuery(authorization)}`,
      });
      if (environment.status !== 404) {
        if (
          environment.status === 200 &&
          exactEnvironmentRecord(environment.body, authorization) &&
          environment.body.id === recordId
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_RESIDUAL_PRESENT");
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS");
      }
    }
    if ((await readEnvironmentNamespace(
      "verify_zero_external_residual",
      authorization,
      credentials,
    )).length !== 0) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_RESIDUAL_PRESENT");
    }
    return {
      status: "PROVEN_ABSENT",
      ownership_readback: "EXACT",
      unrelated_preserved: true,
    };
  }

  return Object.freeze({
    async execute({ operation, input, authorization, credentials }) {
      const textCredentials = transportCredentials(credentials);
      if (operation === "prepare_local_temporary_commit") {
        bindings.local_state_id = `git:${input.temporary_commit_sha}`;
        bindings.local_state_cleaned = false;
        return { status: "VERIFIED_EXACT", commit_sha: input.temporary_commit_sha, local_state_id: bindings.local_state_id };
      }
      if (operation === "cleanup_local_owned_temp_state") {
        if (input.local_state_id !== bindings.local_state_id) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_LOCAL_STATE_OWNERSHIP_MISMATCH");
        }
        bindings.local_state_cleaned = true;
        return { status: "DELETED_EXACT" };
      }
      if (operation === "inspect_github_metadata") {
        return { status: "EXACT", repository: authorization.repository.remote_repository, baseline: authorization.repository.head };
      }
      if (["inspect_remote_ref", "inspect_remote_ref_before_delete"].includes(operation)) {
        const observed = await lowLevel.git.inspect({ authorization, credentials: textCredentials });
        return observed.status === "ABSENT"
          ? { status: "ABSENT" }
          : { status: "EXACT_OWNED", ref_id: `refs/heads/${authorization.execution.branch_name}`, commit_sha: observed.commit_sha };
      }
      if (operation === "create_remote_ref") {
        const created = await lowLevel.git.create({ authorization, credentials: textCredentials });
        return { status: created.status, ref_id: `refs/heads/${authorization.execution.branch_name}` };
      }
      if (operation === "delete_remote_ref") {
        return lowLevel.git.delete({ authorization, credentials: textCredentials, commit_sha: authorization.execution.temporary_commit_sha });
      }
      if (operation === "inspect_prior_residue") {
        return inspectPriorExternalResidue({
          authorization,
          credentials: textCredentials,
        });
      }
      if (operation === "inspect_environment_contract") {
        return inspectEnvironmentContract({
          authorization,
          credentials: textCredentials,
          rawCredentials: credentials,
        });
      }
      if (operation === "inspect_owned_database_residue") {
        return inspectOwnedDataNamespace({
          authorization,
          credentials: textCredentials,
        });
      }
      if (operation.startsWith("create_environment_")) {
        let descriptor;
        try {
          descriptor = providerDescriptor(
            operation,
            input,
            authorization,
            bindings,
          );
        } catch (error) {
          if (error?.code === "OFFICIAL_APPLICATION_INPUT_INVALID") {
            throw environmentCreateFailure(
              "OFFICIAL_ENVIRONMENT_VALUE_SHAPE_INVALID",
              "ENVIRONMENT_VALUE_SHAPE_INVALID",
            );
          }
          throw error;
        }
        let response;
        try {
          response = await request(operation, textCredentials, descriptor);
        } catch {
          throw environmentCreateFailure(
            "OFFICIAL_ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
            "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
          );
        }
        const statusClass = httpStatusClass(response.status);
        if (statusClass !== "2XX") {
          throw environmentCreateFailure(
            "OFFICIAL_ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
            "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
            statusClass,
          );
        }
        const recordId = exactCreatedEnvironmentResponseId(response.body);
        if (recordId === null) {
          throw environmentCreateFailure(
            "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
            "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
            "2XX",
          );
        }
        return { status: "CREATED_EXACT", record_id: recordId };
      }
      if (operation === "protected_access_handshake") {
        if (
          bindings.protected_access_verified === true ||
          bindings.protected_access_oidc_token instanceof Uint8Array
        ) {
          throw new AdminV1OfficialLivePlatformError(
            "OFFICIAL_PROTECTED_ACCESS_UNPROVEN",
          );
        }
        const previewUrl =
          `https://${verifiedPreviewUrl(bindings)}/api/admin/session`;
        let negative;
        let positive;
        try {
          negative = await request(operation, textCredentials, {
            service: "PREVIEW",
            method: "GET",
            path: previewUrl,
            headers: { accept: "text/html" },
          });
          if (!exactVercelProtectionChallenge(negative, previewUrl)) {
            return { status: "FAILED", physical_requests: 1 };
          }
          positive = await request(operation, textCredentials, {
            service: "PREVIEW",
            method: "GET",
            path: previewUrl,
            headers: {
              accept: "application/json",
              [TRUSTED_SOURCE_OIDC_HEADER]: credentialText(input.oidc_token),
            },
          });
          if (!exactAiFinderUnauthenticatedSession(positive)) {
            return { status: "FAILED", physical_requests: 2 };
          }
          bindings.protected_access_oidc_token = Buffer.from(input.oidc_token);
          bindings.protected_access_verified = true;
          return { status: "BOUND", physical_requests: 2 };
        } finally {
          zeroProjectedResponseCookies(negative);
          zeroProjectedResponseCookies(positive);
        }
      }
      if (operation === "storage_read_owned_version") {
        const objectName = input.object_id;
        const presence = await readStoragePresence(
          operation,
          authorization,
          textCredentials,
          objectName,
        );
        if ([400, 404].includes(presence.status)) return { status: "ABSENT" };
        if (!(presence.status >= 200 && presence.status < 300)) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
        }
        const info = await readExactStorageInfo(
          operation,
          authorization,
          textCredentials,
          objectName,
        );
        return { status: "EXACT", version: info.version };
      }
      if (operation === "prepare_storage_cleanup_grant") {
        if (
          !bindings.logo || input.object_id !== bindings.logo.object_id ||
          input.expected_version !== bindings.logo.expected_version ||
          bindings.cleanup_grant_revoked === false
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
        const tokenBytes = random_bytes(32);
        const grantId = random_uuid();
        if (
          !(tokenBytes instanceof Uint8Array) || tokenBytes.byteLength !== 32 ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(grantId)
        ) {
          if (tokenBytes instanceof Uint8Array) tokenBytes.fill(0);
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
        }
        const rawToken = Buffer.from(tokenBytes).toString("hex");
        tokenBytes.fill(0);
        const tokenHash = sha256Hex(rawToken);
        try {
          const response = await request(operation, textCredentials, {
            service: "SUPABASE_SERVICE",
            method: "POST",
            path: "/rest/v1/rpc/aifinder_prepare_storage_cleanup_grant",
            body: {
              p_bucket_id: authorization.execution.storage_bucket,
              p_expected_etag: bindings.logo.expected_etag,
              p_expected_mime_type: "image/png",
              p_expected_size: bindings.logo.expected_size,
              p_expected_version: bindings.logo.expected_version,
              p_grant_id: grantId,
              p_object_name: bindings.logo.object_id,
              p_phase_id: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
              p_runtime_session_id: authorization.run_id,
              p_token_hash: tokenHash,
              p_ttl_seconds: 300,
            },
          });
          const row = Array.isArray(response.body) ? response.body[0] : response.body;
          if (
            response.status !== 200 ||
            !exactPlainObject(row, ["expected_version", "expires_at", "grant_id"]) ||
            row.grant_id !== grantId ||
            row.expected_version !== bindings.logo.expected_version ||
            !boundedText(row.expires_at, 64) || !Number.isFinite(Date.parse(row.expires_at))
          ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
          bindings.cleanup_grant_id = grantId;
          bindings.cleanup_grant_token = Buffer.from(rawToken, "ascii");
          bindings.cleanup_grant_token_hash = tokenHash;
          bindings.cleanup_grant_revoked = false;
          return { status: "PREPARED", grant_id: grantId };
        } catch (error) {
          if (bindings.cleanup_grant_token instanceof Uint8Array) {
            bindings.cleanup_grant_token.fill(0);
          }
          throw error;
        }
      }
      if (operation === "delete_storage_exact_version") {
        if (
          !bindings.logo || input.object_id !== bindings.logo.object_id ||
          input.expected_version !== bindings.logo.expected_version ||
          input.grant_id !== bindings.cleanup_grant_id ||
          bindings.cleanup_grant_revoked !== false ||
          !(bindings.cleanup_grant_token instanceof Uint8Array)
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
        const response = await request(operation, textCredentials, {
          service: "SUPABASE_ANON",
          method: "DELETE",
          path: `/storage/v1/object/${encodeURIComponent(authorization.execution.storage_bucket)}`,
          headers: {
            "x-aifinder-storage-cleanup-token": memoryText(
              bindings.cleanup_grant_token,
              128,
            ),
          },
          body: { prefixes: [bindings.logo.object_id] },
        });
        if (response.status !== 200) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
        }
        const after = await readStoragePresence(
          operation,
          authorization,
          textCredentials,
          bindings.logo.object_id,
        );
        if ([400, 404].includes(after.status)) return { status: "DELETED_EXACT" };
        if (after.status >= 200 && after.status < 300) {
          const info = await readExactStorageInfo(
            operation,
            authorization,
            textCredentials,
            bindings.logo.object_id,
          );
          if (info.version !== bindings.logo.expected_version) {
            return { status: "VERSION_MISMATCH", observed_version: info.version };
          }
        }
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
      }
      if (operation === "revoke_storage_cleanup_grant") {
        if (
          input.grant_id !== bindings.cleanup_grant_id ||
          bindings.cleanup_grant_revoked !== false ||
          !(bindings.cleanup_grant_token instanceof Uint8Array)
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
        try {
          const response = await request(operation, textCredentials, {
            service: "SUPABASE_SERVICE",
            method: "POST",
            path: "/rest/v1/rpc/aifinder_revoke_storage_cleanup_grant",
            body: {
              p_grant_id: bindings.cleanup_grant_id,
              p_token_hash: bindings.cleanup_grant_token_hash,
            },
          });
          if (response.status !== 200 || response.body !== true) {
            throw new AdminV1OfficialLivePlatformError("OFFICIAL_STORAGE_CAS_MISMATCH");
          }
          bindings.cleanup_grant_revoked = true;
          return { status: "REVOKED_EXACT" };
        } finally {
          bindings.cleanup_grant_token.fill(0);
        }
      }
      if (operation === "verify_zero_data_residual") {
        return verifyZeroDataResidual({
          authorization,
          credentials: textCredentials,
          input,
        });
      }
      if (operation === "verify_zero_external_residual") {
        return verifyZeroExternalResidual({
          authorization,
          credentials: textCredentials,
          input,
        });
      }
      if (operation === "retire_protected_access") {
        try {
          const descriptor = providerDescriptor(
            operation,
            input,
            authorization,
            bindings,
          );
          const response = await lowLevel.request({
            ...descriptor,
            credentials: textCredentials,
            operation,
          });
          return normalizedProviderResult(
            operation,
            response,
            bindings,
            input,
            authorization,
            textCredentials,
          );
        } finally {
          clearProtectedAccessBinding(bindings);
        }
      }
      const descriptor = providerDescriptor(operation, input, authorization, bindings);
      const response = await lowLevel.request({
        ...descriptor,
        credentials: textCredentials,
        operation,
      });
      const result = normalizedProviderResult(
        operation,
        response,
        bindings,
        input,
        authorization,
        textCredentials,
      );
      if (operation === "application_request" && input.contract.ordinal === 15) {
        const objectName = bindings.logo_object_name;
        const presence = await readStoragePresence(
          operation,
          authorization,
          textCredentials,
          objectName,
        );
        if (!(presence.status >= 200 && presence.status < 300)) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
        }
        const info = await readExactStorageInfo(
          operation,
          authorization,
          textCredentials,
          objectName,
        );
        if (!exactCreatedStorageObservation(info, authorization, objectName)) {
          throw new AdminV1OfficialLivePlatformError("OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN");
        }
        bindings.logo = {
          expected_etag: info.metadata.eTag,
          expected_size: info.metadata.size,
          expected_version: info.version,
          object_id: objectName,
        };
        result.effect.logo_object_id = objectName;
        result.effect.storage_version = info.version;
      }
      return result;
    },
  });
}

function zeroRecord(record) {
  for (const value of Object.values(record ?? {})) {
    if (value instanceof Uint8Array) Buffer.from(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    ).fill(0);
  }
}

function safeString(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= 16_384 &&
    !value.includes("\0");
}

export function loadAdminV1OfficialCredentials({
  environment,
  credential_source_policy,
}) {
  const sensitive = {};
  try {
    if (
      canonicalJson(credential_source_policy) !==
        canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY) ||
      !environment || typeof environment !== "object" || Array.isArray(environment)
    ) throw new Error("INPUT");
    const githubNames = ["GH_TOKEN", "GITHUB_TOKEN"].filter(
      (name) => safeString(environment[name]),
    );
    if (githubNames.length !== 1 || environment.NODE_ENV !== "production") {
      throw new Error("GITHUB_OR_NODE_ENV");
    }
    const slots = {
      admin_password: environment.ADMIN_PASSWORD,
      admin_session_secret: environment.ADMIN_SESSION_SECRET,
      github_token: environment[githubNames[0]],
      supabase_anon_key: environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role_key: environment.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url: environment.NEXT_PUBLIC_SUPABASE_URL,
      vercel_token: environment.VERCEL_TOKEN,
    };
    if (!Object.values(slots).every(safeString)) throw new Error("MISSING");
    for (const [name, value] of Object.entries(slots)) {
      sensitive[name] = Buffer.from(value, "utf8");
    }
    Object.defineProperty(sensitive, CREDENTIAL_ENVIRONMENT_OBSERVATION, {
      configurable: false,
      enumerable: false,
      value: Object.freeze({
        credential_source_policy: structuredClone(credential_source_policy),
        github_alias_count: githubNames.length,
        names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES],
        node_env: environment.NODE_ENV,
      }),
      writable: false,
    });
    return Object.freeze(sensitive);
  } catch {
    zeroRecord(sensitive);
    throw new AdminV1OfficialLivePlatformError("OFFICIAL_CREDENTIAL_MISSING");
  }
}

function boundedResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  let size = 0;
  const visit = (entry, key = "") => {
    if (/(raw_child|provider_output|sql_output|authorization_header)/iu.test(key)) {
      return false;
    }
    if (entry instanceof Uint8Array) {
      size += entry.byteLength;
      return size <= 128 * 1024;
    }
    if (entry === null || typeof entry === "boolean") {
      size += 16;
      return size <= 128 * 1024;
    }
    if (typeof entry === "number") {
      size += 16;
      return Number.isFinite(entry) && size <= 128 * 1024;
    }
    if (typeof entry === "string") {
      size += Buffer.byteLength(entry, "utf8");
      return size <= 128 * 1024 && !entry.includes("\0");
    }
    if (Array.isArray(entry)) return entry.every((child) => visit(child));
    if (!entry || typeof entry !== "object" || Object.getPrototypeOf(entry) !== Object.prototype) {
      return false;
    }
    return Object.entries(entry).every(([childKey, child]) => {
      size += Buffer.byteLength(childKey, "utf8");
      return size <= 128 * 1024 && visit(child, childKey);
    });
  };
  return visit(value);
}

export function createAdminV1OfficialAdapter({
  authorization,
  credentials,
  execution_context,
  transport,
}) {
  if (
    authorization?.operation_class !== ADMIN_V1_OFFICIAL_OPERATION_CLASS ||
    !credentials || typeof credentials !== "object" ||
    !execution_context || typeof execution_context !== "object" ||
    typeof transport?.execute !== "function"
  ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_INPUT");
  return Object.freeze({
    async invoke(operation, input = {}) {
      const mapping = OPERATION_BY_NAME.get(operation);
      if (!mapping) {
        throw new AdminV1OfficialLivePlatformError(
          "OFFICIAL_ADAPTER_OPERATION_DENIED",
        );
      }
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_INPUT");
      }
      const result = await transport.execute(Object.freeze({
        operation,
        mapping,
        input: structuredClone(input),
        authorization,
        credentials,
        execution_context,
      }));
      if (!boundedResult(result)) {
        const error = new AdminV1OfficialLivePlatformError(
          "OFFICIAL_ADAPTER_RESULT",
        );
        error.operation = operation;
        throw error;
      }
      return result;
    },
  });
}

export async function runConcreteAdminV1OfficialRuntime({
  authorization,
  credentials,
  execution_context,
  transport,
  now_epoch_ms,
}) {
  const adapters = createAdminV1OfficialAdapter({
    authorization,
    credentials,
    execution_context,
    transport,
  });
  return runAdminV1OfficialRuntime({
    authorization,
    adapters,
    journal: execution_context.journal,
    sensitive: credentials,
    now_epoch_ms,
  });
}
