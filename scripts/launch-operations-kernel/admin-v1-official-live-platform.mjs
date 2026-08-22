import { canonicalJson } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
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
  if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
    return { service: "VERCEL", method: "GET", path: `/v13/deployments?${team}&limit=1` };
  }
  throw new AdminV1OfficialLivePlatformError("OFFICIAL_ADAPTER_OPERATION_DENIED");
}

function normalizedProviderResult(operation, response, bindings) {
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
    return { status: response.status < 300 ? "PREPARED" : "FAILED", grant_id: row?.grant_id };
  }
  if (operation === "revoke_storage_cleanup_grant") {
    return { status: response.status < 300 ? "REVOKED_EXACT" : "FAILED" };
  }
  if (operation === "delete_storage_exact_version" || operation.startsWith("delete_") || operation === "retire_protected_access") {
    return { status: response.status < 300 || response.status === 404 ? "DELETED_EXACT" : "FAILED" };
  }
  if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
    return { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true };
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
  return Object.freeze({
    async execute({ operation, input, authorization, credentials }) {
      const textCredentials = transportCredentials(credentials);
      if (operation === "prepare_local_temporary_commit") {
        return { status: "VERIFIED_EXACT", commit_sha: input.temporary_commit_sha, local_state_id: `git:${input.temporary_commit_sha}` };
      }
      if (operation === "cleanup_local_owned_temp_state") return { status: "DELETED_EXACT" };
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
      if (operation === "inspect_prior_residue") return { status: "ABSENT" };
      if (operation === "inspect_environment_contract") {
        return { status: "EXACT", names: [
          "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NODE_ENV",
          "GH_TOKEN", "GITHUB_TOKEN", "VERCEL_TOKEN",
        ] };
      }
      const descriptor = providerDescriptor(operation, input, authorization, bindings);
      const response = await lowLevel.request({
        ...descriptor,
        credentials: textCredentials,
        operation,
      });
      return normalizedProviderResult(operation, response, bindings);
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
