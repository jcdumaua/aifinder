import { canonicalJson, sha256Hex } from "./canonical.mjs";

export const OFFICIAL_ISOLATION_MODE = "NEW_EMPTY_TEST_ONLY_PROJECT_V1";
export const OFFICIAL_PROVIDER_RETENTION =
  "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1";
export const OFFICIAL_PREVIEW_ENVIRONMENT_KEYS = Object.freeze([
  "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF",
]);
export const OFFICIAL_ISOLATION_KEYS = Object.freeze([
  "mode", "project_ref", "origin", "provisioning_receipt_sha256",
  "schema_contract_sha256", "credential_bundle_path",
  "credential_bundle_provenance_sha256", "validation_run_id",
  "expected_preview_project_id", "expected_preview_team_id",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const HASH = /^[0-9a-f]{64}$/u;
const EXCLUDED_REF = "mtpisopvdxuvmpzbzqjw";
export const ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V1 = Object.freeze({
  schema_version: 1,
  operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
  mode: OFFICIAL_ISOLATION_MODE,
  provider_cleanup_policy: OFFICIAL_PROVIDER_RETENTION,
  origin_relation: "HTTPS_PROJECT_REF_DOT_SUPABASE_DOT_CO_V1",
  allow_custom_origin: false,
  excluded_project_ref: EXCLUDED_REF,
  excluded_origin: "https://mtpisopvdxuvmpzbzqjw.supabase.co",
  environment_keys: OFFICIAL_PREVIEW_ENVIRONMENT_KEYS,
  credential_bundle_schema_version: 1,
  credential_bundle_provenance_source: "OWNER_BOUND_ISOLATED_BUNDLE_V1",
  credential_value_names: Object.freeze(["admin_password", "admin_session_secret",
    "github_token", "supabase_anon_key", "supabase_service_role_key", "supabase_url", "vercel_token"]),
  credential_value_max_bytes: 16384,
  provisioning_receipt_schema_version: 1,
  provenance_receipt_schema_version: 1,
  expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
  expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
});
export const OFFICIAL_PREVIEW_ENVIRONMENT_PLAN = Object.freeze([
  ["ADMIN_PASSWORD", "credential:admin_password"],
  ["ADMIN_SESSION_SECRET", "credential:admin_session_secret"],
  ["NEXT_PUBLIC_SUPABASE_URL", "credential:supabase_url"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "credential:supabase_anon_key"],
  ["SUPABASE_SERVICE_ROLE_KEY", "credential:supabase_service_role_key"],
  ["AIFINDER_VALIDATION_RUN_ID", "authorization:run_id"],
  ["AIFINDER_VALIDATION_PROJECT_REF", "authorization:isolation.project_ref"],
].map((entry) => Object.freeze(entry)));
export const ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V2 = Object.freeze({
  ...ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V1,
  schema_version: 2,
  preview_environment_plan: OFFICIAL_PREVIEW_ENVIRONMENT_PLAN,
  retention_trigger: "SUCCESS_AFTER_OFFICIAL_LEDGER_AND_POSTSTATE_V1",
  pre_commit_failure_policy: "DELETE_EXACT_RUN_OWNED_EXTERNAL_RESOURCES_V1",
  post_commit_policy: "RETAIN_EXACT_RUN_OWNED_PREVIEW_AND_SEVEN_ENVIRONMENTS_V1",
  retention_complete_lifecycle: "RETENTION_COMPLETE",
  retention_pending_lifecycle: "RETENTION_PENDING",
  retained_preview_count: 1,
  retained_environment_count: 7,
  final_retention_verification: "REVERIFY_EXACT_IDS_AFTER_DATA_AND_EPHEMERAL_CLEANUP_V1",
  automatic_post_success_delete: false,
  later_destructive_cleanup_requires_owner_authority: true,
});
export const ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256_V1 = sha256Hex(
  canonicalJson(ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V1),
);
export const ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256_V2 = sha256Hex(
  canonicalJson(ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_V2),
);
export const ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256 = ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256_V2;

export class OfficialIsolationError extends Error {
  constructor(code) {
    super(code);
    this.name = "OfficialIsolationError";
    this.code = code;
  }
}

function deny(code) { throw new OfficialIsolationError(code); }
function exact(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const actual = Reflect.ownKeys(descriptors);
  return actual.length === keys.length && keys.every((key) =>
    Object.hasOwn(descriptors, key) && Object.hasOwn(descriptors[key], "value") &&
    descriptors[key].enumerable === true);
}
function text(value, maximum = 256) {
  return typeof value === "string" && value.length > 0 && value.length <= maximum &&
    /^[\x21-\x7e]+$/u.test(value);
}
export function canonicalOfficialOrigin(value) {
  if (!text(value, 512)) deny("OFFICIAL_ISOLATION_ORIGIN");
  let parsed;
  try { parsed = new URL(value); } catch { deny("OFFICIAL_ISOLATION_ORIGIN"); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.pathname !== "/" ||
      parsed.origin !== value || parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".localhost")) deny("OFFICIAL_ISOLATION_ORIGIN");
  return value;
}
export function boundOfficialOrigin(projectRef, origin) {
  if (!text(projectRef) || projectRef === EXCLUDED_REF ||
      !/^[a-z0-9-]+$/u.test(projectRef) ||
      canonicalOfficialOrigin(origin) !== `https://${projectRef}.supabase.co`) {
    deny("OFFICIAL_ISOLATION_ORIGIN");
  }
  return origin;
}
export function requireOfficialLifetime(authorization, nowEpochMs) {
  const created = Date.parse(authorization?.created_at);
  const expires = Date.parse(authorization?.expires_at);
  if (!Number.isSafeInteger(nowEpochMs) || !Number.isSafeInteger(created) ||
      !Number.isSafeInteger(expires) || created >= expires ||
      nowEpochMs < created || nowEpochMs >= expires ||
      expires - created > 86_400_000 ||
      new Date(created).toISOString() !== authorization.created_at ||
      new Date(expires).toISOString() !== authorization.expires_at) {
    deny("OFFICIAL_ISOLATION_LIFETIME");
  }
  return expires;
}

export function validateOfficialIsolationAuthorization(authorization, nowEpochMs) {
  requireOfficialLifetime(authorization, nowEpochMs);
  const execution = authorization?.execution;
  const binding = execution?.isolation;
  if (authorization?.schema_version !== 2 ||
      authorization.operation_class !== "ADMIN_V1_OFFICIAL_RUNTIME_V1" ||
      !UUID.test(authorization.run_id ?? "") ||
      !exact(binding, OFFICIAL_ISOLATION_KEYS) ||
      binding.mode !== OFFICIAL_ISOLATION_MODE ||
      execution.provider_cleanup_policy !== OFFICIAL_PROVIDER_RETENTION ||
      !text(binding.project_ref) || binding.project_ref === EXCLUDED_REF ||
      !/^[a-z0-9-]+$/u.test(binding.project_ref) ||
      binding.validation_run_id !== authorization.run_id ||
      binding.expected_preview_project_id !== "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" ||
      binding.expected_preview_team_id !== "team_9POJYxNnjIBbrQ19My8M5yG3" ||
      execution.preview_project_id !== binding.expected_preview_project_id ||
      execution.preview_team_id !== binding.expected_preview_team_id ||
      ![binding.provisioning_receipt_sha256, binding.schema_contract_sha256,
        binding.credential_bundle_provenance_sha256].every((value) => HASH.test(value ?? "")) ||
      binding.credential_bundle_path !== `${execution.journal_directory}/isolated-credentials.json` ||
      execution.journal_directory !== `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${authorization.run_id}` ||
      canonicalJson(execution.environment_keys) !== canonicalJson(OFFICIAL_PREVIEW_ENVIRONMENT_KEYS)) {
    deny("OFFICIAL_ISOLATION_BINDING");
  }
  boundOfficialOrigin(binding.project_ref, binding.origin);
  return Object.freeze({ ...binding });
}

// Only closed, non-secret receipt fields may reach a digest operation.
export function validateOfficialProvisioningReceipt(authorization, receipt, nowEpochMs) {
  const binding = validateOfficialIsolationAuthorization(authorization, nowEpochMs);
  if (!exact(receipt, ["schemaVersion", "runId", "projectRef", "origin",
      "createdNew", "emptyAtProvisioning", "testOnly", "schemaContractSha256",
      "credentialBundleProvenanceSha256"]) || receipt.schemaVersion !== 1 ||
      receipt.runId !== authorization.run_id || receipt.projectRef !== binding.project_ref ||
      receipt.origin !== binding.origin || receipt.createdNew !== true ||
      receipt.emptyAtProvisioning !== true || receipt.testOnly !== true ||
      receipt.schemaContractSha256 !== binding.schema_contract_sha256 ||
      receipt.credentialBundleProvenanceSha256 !== binding.credential_bundle_provenance_sha256) {
    deny("OFFICIAL_ISOLATION_PROVISIONING");
  }
  if (sha256Hex(canonicalJson(receipt)) !== binding.provisioning_receipt_sha256) {
    deny("OFFICIAL_ISOLATION_PROVISIONING");
  }
  return binding;
}

// Called with the URL captured at actual SDK client construction, never a later
// environment lookup. This observation is not a deployment or protection proof.
export function observeOfficialClientOrigin({ runId, projectRef, actualClientOrigin }) {
  if (!UUID.test(runId ?? "") || !text(projectRef) || projectRef === EXCLUDED_REF ||
      !/^[a-z0-9-]+$/u.test(projectRef)) deny("OFFICIAL_ISOLATION_CLIENT");
  return Object.freeze({ runId, projectRef, origin: boundOfficialOrigin(projectRef, actualClientOrigin) });
}

export function validateOfficialIsolationBinding({
  authorization, localObservation, previewObservation, provisioningReceipt, nowEpochMs,
}) {
  const binding = validateOfficialProvisioningReceipt(authorization, provisioningReceipt, nowEpochMs);
  if (!exact(localObservation, ["runId", "projectRef", "origin"]) ||
      localObservation.runId !== authorization.run_id ||
      localObservation.projectRef !== binding.project_ref ||
      localObservation.origin !== binding.origin ||
      !exact(previewObservation, ["runId", "projectRef", "origin", "deploymentId",
        "projectId", "teamId", "target", "protected", "sourceCommit", "sourceBranch",
        "repository", "sourceIdentityVerified", "authenticated"]) ||
      previewObservation.runId !== authorization.run_id ||
      previewObservation.projectRef !== binding.project_ref ||
      previewObservation.origin !== binding.origin ||
      !/^dpl_[A-Za-z0-9]+$/u.test(previewObservation.deploymentId ?? "") ||
      previewObservation.projectId !== binding.expected_preview_project_id ||
      previewObservation.teamId !== binding.expected_preview_team_id ||
      previewObservation.target !== "preview" || previewObservation.protected !== true ||
      previewObservation.authenticated !== true || previewObservation.sourceIdentityVerified !== true ||
      previewObservation.sourceCommit !== authorization.execution.temporary_commit_sha ||
      previewObservation.sourceBranch !== authorization.execution.branch_name ||
      previewObservation.repository !== authorization.repository.remote_repository) {
    deny("OFFICIAL_ISOLATION_OBSERVATION");
  }
  return Object.freeze({ status: "EXACT_ISOLATED_BINDING", runId: authorization.run_id,
    projectRef: binding.project_ref, origin: binding.origin });
}
