import { canonicalJson } from "./canonical.mjs";
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
  ["detect_automatic_preview", "SETUP", "vercel.inventory", "PROVIDER_INVENTORY", "provider_control_invocations+provider_inventory_traversals+provider_inventory_pages", "read", "READ_ONLY", "ZERO"],
  ["create_environment_1", "SETUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_created", "mutation", "CREATE_EXACT", "ZERO"],
  ["create_environment_2", "SETUP", "vercel.environment", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_created", "mutation", "CREATE_EXACT", "ZERO"],
  ["create_preview", "SETUP", "vercel.preview", "PROVIDER_MUTATION", "provider_direct_mutations+preview_creations", "mutation", "CREATE_EXACT", "ZERO"],
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

export class AdminV1OfficialLivePlatformError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialLivePlatformError";
    this.code = code;
  }
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
    !Array.isArray(body.envs) || body.envs.length > 100 ||
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
  return record && typeof record === "object" && !Array.isArray(record) &&
    boundedText(record.id, 256) && boundedText(record.key, 256) &&
    canonicalJson(record.target) === '["preview"]' &&
    (!Object.hasOwn(record, "gitBranch") ||
      record.gitBranch === authorization.execution.branch_name);
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

function exactStorageObservation(body, authorization) {
  return body && typeof body === "object" && !Array.isArray(body) &&
    body.bucket_id === authorization.execution.storage_bucket &&
    body.name === authorization.execution.storage_name &&
    boundedText(body.version, 1024);
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

function providerDescriptor(operation, input, authorization, bindings) {
  const team = `teamId=${encodeURIComponent(authorization.execution.preview_team_id)}`;
  const project = encodeURIComponent(authorization.execution.preview_project_id);
  const run = encodeURIComponent(authorization.run_id);
  const table = (name, query = "") => `/rest/v1/${name}${query}`;
  if (operation === "detect_automatic_preview") return {
    service: "VERCEL", method: "GET",
    path: `/v6/deployments?${team}&projectId=${project}&meta-aifinderRunId=${run}`,
  };
  if (operation.startsWith("create_environment_")) return {
    service: "VERCEL", method: "POST",
    path: `/v10/projects/${project}/env?${team}&upsert=false`,
    body: {
      key: input.key,
      value: input.value,
      type: "encrypted",
      target: ["preview"],
      gitBranch: authorization.execution.branch_name,
    },
  };
  if (operation === "create_preview") return {
    service: "VERCEL", method: "POST", path: `/v13/deployments?${team}`,
    body: {
      name: authorization.execution.preview_project_name,
      project: authorization.execution.preview_project_id,
      target: null,
      gitSource: {
        type: "github",
        repo: authorization.repository.remote_repository,
        ref: authorization.execution.branch_name,
        sha: authorization.execution.temporary_commit_sha,
      },
      meta: {
        aifinderRunId: authorization.run_id,
        aifinderCandidate: authorization.candidate_identity_sha256,
      },
    },
  };
  if (operation === "verify_preview_identity") return {
    service: "VERCEL", method: "GET",
    path: `/v13/deployments/${encodeURIComponent(bindings.deployment_id)}?${team}&withGitRepoInfo=true`,
  };
  if (operation === "generate_oidc") return {
    service: "VERCEL", method: "POST", path: `/v1/oidc/token?${team}`,
    body: { projectId: authorization.execution.preview_project_id },
  };
  if (operation === "protected_access_handshake") return {
    service: "PREVIEW", method: "GET",
    path: `https://${bindings.deployment_url}/api/admin/session`,
    headers: { authorization: `Bearer ${credentialText(input.oidc_token)}` },
  };
  if (operation === "inspect_owned_database_residue") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("submitted_tools", `?select=id&website=like.*${run}*&limit=4`),
  };
  if (operation === "create_submitted_fixture") return {
    service: "SUPABASE_SERVICE", method: "POST", path: table("submitted_tools"),
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
    path: table("submitted_tools", `?select=id,status,updated_at&website=like.*${run}*`),
  };
  if (operation === "inspect_tools_poststate") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("tools", `?select=id,status,updated_at&website=like.*${run}*`),
  };
  if (operation === "inspect_audits_poststate") return {
    service: "SUPABASE_SERVICE", method: "GET",
    path: table("admin_audit_logs", `?select=id,action,created_at&metadata->>run_id=eq.${run}`),
  };
  if (operation === "application_request") return {
    service: "PREVIEW", method: input.contract.method,
    path: `https://${bindings.deployment_url}${input.contract.path}`,
    headers: {},
  };
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
    path: table("admin_audit_logs", `?id=in.(${input.rows.map((row) => encodeURIComponent(row.row_id)).join(",")})`),
  };
  throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_OPERATION_DENIED");
}

function normalizedProviderResult(operation, response, bindings, input) {
  const body = response?.body;
  if (operation === "detect_automatic_preview") {
    const deployments = Array.isArray(body?.deployments) ? body.deployments : [];
    return { count: deployments.length };
  }
  if (operation.startsWith("create_environment_")) {
    const record = Array.isArray(body?.created) ? body.created[0] : body;
    return { status: response.status < 300 ? "CREATED_EXACT" : "FAILED", record_id: record?.id };
  }
  if (operation === "create_preview") {
    bindings.deployment_id = body?.id ?? body?.uid;
    bindings.deployment_url = body?.url;
    return { status: response.status < 300 ? "CREATED_EXACT" : "FAILED", deployment_id: bindings.deployment_id };
  }
  if (operation === "verify_preview_identity") {
    return { status: response.status === 200 && (body?.readyState ?? body?.state) === "READY" ? "EXACT" : "FAILED" };
  }
  if (operation === "generate_oidc") {
    return { token: Buffer.from(body?.token ?? "", "utf8") };
  }
  if (operation === "protected_access_handshake") {
    return { status: response.status < 400 ? "BOUND" : "FAILED" };
  }
  if (operation === "inspect_owned_database_residue") {
    return { status: Array.isArray(body) && body.length === 0 ? "ABSENT" : "PRESENT" };
  }
  if (operation === "create_submitted_fixture") {
    const row = Array.isArray(body) ? body[0] : body;
    return { status: response.status < 300 ? "CREATED_EXACT" : "FAILED", row_id: String(row?.id ?? ""), version: row?.updated_at };
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
  if (operation === "delete_storage_exact_version" || operation.startsWith("delete_") || operation === "retire_protected_access") {
    return { status: response.status < 300 || response.status === 404 ? "DELETED_EXACT" : "FAILED" };
  }
  if (["inspect_submissions_poststate", "inspect_tools_poststate", "inspect_audits_poststate", "application_request"].includes(operation)) {
    return body;
  }
  return body;
}

export function createAdminV1OfficialConcreteTransport({
  execution_context,
  fetch_impl = globalThis.fetch,
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
  const storageInfoPath = (authorization) =>
    `/storage/v1/object/info/${encodeURIComponent(authorization.execution.storage_bucket)}/${authorization.execution.storage_name.split("/").map(encodeURIComponent).join("/")}`;

  async function readDeploymentNamespace(operation, authorization, credentials) {
    const response = await request(operation, credentials, {
      service: "VERCEL",
      method: "GET",
      path: `/v6/deployments?projectId=${projectPath(authorization)}&${teamQuery(authorization)}&limit=100&meta-aifinderRunId=${encodeURIComponent(authorization.run_id)}`,
    });
    if (response.status !== 200) {
      throw new AdminV1OfficialLivePlatformError("OFFICIAL_EXTERNAL_OBSERVATION_UNPROVEN");
    }
    const deployments = terminalDeploymentInventory(response.body);
    if (
      deployments === null ||
      !deployments.every((entry) => exactOwnedDeployment(entry, authorization))
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
    operation = "inspect_owned_database_residue",
  }) {
    const run = encodeURIComponent(authorization.run_id);
    const descriptors = [
      `/rest/v1/submitted_tools?select=id&website=like.*${run}*&limit=4`,
      `/rest/v1/tools?select=id&website=like.*${run}*&limit=3`,
      `/rest/v1/admin_audit_logs?select=id&metadata->>run_id=eq.${run}&limit=9`,
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
    const storage = await request(operation, credentials, {
      service: "SUPABASE_SERVICE",
      method: "GET",
      path: storageInfoPath(authorization),
    });
    if (storage.status === 404) return { status: "ABSENT" };
    if (storage.status === 200 && exactStorageObservation(storage.body, authorization)) {
      if (
        allowedStorageReplacementVersion !== null &&
        storage.body.version !== allowedStorageReplacementVersion
      ) return { status: "ABSENT" };
      return { status: "PRESENT" };
    }
    throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
  }

  async function verifyZeroDataResidual({ authorization, credentials, input }) {
    if (
      typeof input.allow_non_owned_storage_replacement !== "boolean" ||
      !input.owned || typeof input.owned !== "object" || Array.isArray(input.owned)
    ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
    const ownedRows = exactOwnedRows(input.owned, {
      audit_rows: 8,
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
      const storage = await request("verify_zero_data_residual", credentials, {
        service: "SUPABASE_SERVICE",
        method: "GET",
        path: storageInfoPath(authorization),
      });
      if (input.allow_non_owned_storage_replacement) {
        if (
          storage.status !== 200 ||
          !exactStorageObservation(storage.body, authorization) ||
          storage.body.version === logo.version
        ) throw new AdminV1OfficialLivePlatformError("OFFICIAL_DATA_OBSERVATION_AMBIGUOUS");
      } else if (storage.status !== 404) {
        if (storage.status === 200 && exactStorageObservation(storage.body, authorization)) {
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
          exactOwnedDeployment(deployment.body, authorization) &&
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
      const descriptor = providerDescriptor(operation, input, authorization, bindings);
      const response = await lowLevel.request({
        ...descriptor,
        credentials: textCredentials,
        operation,
      });
      return normalizedProviderResult(operation, response, bindings, input);
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
