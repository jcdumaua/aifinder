import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const SUPERVISOR_RELATIVE_PATH =
  "scripts/launch-operations-supervisor/nonproduction-qualification-supervisor.mjs";
const POLICY_RELATIVE_PATH =
  "scripts/launch-operations-supervisor/supervisor-policy.json";
const RUNNER_RELATIVE_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
const SAFETY_MANIFEST_RELATIVE_PATH = "testing/static-test-safety-manifest.json";
const SUPPORT_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  SAFETY_MANIFEST_RELATIVE_PATH,
]);
const APPROVAL_TOKEN_SHA256 =
  "fa0968309b6c9a27c6fc90c7f065b3017c71e586ef247707536089a32534d386";
const RETAINED_IDENTITY_SHA256 =
  "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0";
const OPERATION_CLASS = "NONPRODUCTION_QUALIFICATION";
const OFFICIAL_OPERATION_CLASS = "ADMIN_V1_OFFICIAL_RUNTIME_V1";
const OFFICIAL_REQUIRED_BASELINE =
  "1bddba8b5123d7eec4e986fbeff990a5571358bf";
const OFFICIAL_AUTHORIZATION_SCHEMA_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json";
const SPENT_RUN_IDS = Object.freeze([
  "8c0d9e84-62e5-4658-9de0-c0121a302951",
  "e46a0d21-f0b4-4f7d-8a4f-e7f6e8a7eda0",
  "26199d3a-5bcd-4a48-9f31-c7a081195207",
  "f16a8383-a3ff-4c51-bec6-dc8beba5f4eb",
  "89336a0a-b67c-4ad6-99d2-b527ffdca9fd",
  "8e694077-7724-46b4-88ae-1e959d7c28de",
  "716fcb1b-7999-42b4-82f8-e5e8e65b644f",
  "a397fbe1-1107-40df-86b2-83b153d8b8cc",
]);
const CREDENTIAL_SOURCE_POLICY = Object.freeze({
  GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
  VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
  SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
  SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
  ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
  ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
});
const OFFICIAL_CREDENTIAL_SOURCE_POLICY = Object.freeze({
  ...CREDENTIAL_SOURCE_POLICY,
  NODE_ENV: "PROVIDER_PRODUCTION_SEMANTICS",
});
const OFFICIAL_ROUTE_SOURCE_PATHS = Object.freeze([
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
  "lib/admin-v1-launch-scope.ts",
  "proxy.ts",
]);
const OFFICIAL_CONTRACT_DIGEST_KEYS = Object.freeze([
  "budgets",
  "deferred_routes",
  "environment_names",
  "official_ledger",
  "qualification_ledger",
  "target_routes",
]);
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const PRE_TRUST_GIT_SANDBOX_PROFILE = [
  "(version 1)",
  "(allow default)",
  "(deny network*)",
  "(deny file-write*)",
  '(allow file-write* (literal "/dev/null"))',
  "(deny process-exec*)",
  '(allow process-exec (literal "/usr/bin/git"))',
  '(allow process-exec (literal "/Library/Developer/CommandLineTools/usr/bin/git"))',
].join("");
const PRE_TRUST_GIT_CONFIG = Object.freeze([
  "-c", "core.fsmonitor=false",
  "-c", "core.hooksPath=/dev/null",
  "-c", "credential.helper=",
  "-c", "credential.interactive=false",
  "-c", "diff.external=",
  "-c", "core.attributesFile=/dev/null",
  "-c", "core.pager=cat",
]);

export class PreImportSupervisorError extends Error {
  constructor(code) {
    super(code);
    this.name = "PreImportSupervisorError";
    this.code = code;
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new PreImportSupervisorError("SUPERVISOR_JSON_INVALID");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new PreImportSupervisorError("SUPERVISOR_JSON_INVALID");
    }
    return `{${Object.keys(value).sort((left, right) =>
      left.localeCompare(right, "en")
    ).map((key) => {
      if (value[key] === undefined) {
        throw new PreImportSupervisorError("SUPERVISOR_JSON_INVALID");
      }
      return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
    }).join(",")}}`;
  }
  throw new PreImportSupervisorError("SUPERVISOR_JSON_INVALID");
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort((left, right) => left.localeCompare(right, "en"));
  const wanted = [...expected].sort((left, right) => left.localeCompare(right, "en"));
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function exactObject(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function exactRelativePath(value) {
  return typeof value === "string" &&
    value.length >= 1 &&
    !value.includes("\0") &&
    !value.includes("\\") &&
    !path.isAbsolute(value) &&
    !value.split("/").includes("..") &&
    path.posix.normalize(value) === value;
}

function repositoryPath(repositoryRoot, relativePath) {
  if (!exactRelativePath(relativePath)) {
    throw new PreImportSupervisorError("SUPERVISOR_POLICY_INVALID");
  }
  const target = path.resolve(repositoryRoot, relativePath);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new PreImportSupervisorError("SUPERVISOR_POLICY_INVALID");
  }
  return target;
}

function regularFileBytes(target, mode, code) {
  try {
    const metadata = lstatSync(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      (metadata.mode & 0o777) !== mode ||
      realpathSync(target) !== target
    ) throw new Error("IDENTITY");
    return readFileSync(target);
  } catch {
    throw new PreImportSupervisorError(code);
  }
}

function parseJson(bytes, { canonical = false, code = "SUPERVISOR_JSON_INVALID" } = {}) {
  let text;
  let value;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff") || !text.endsWith("\n")) throw new Error("BYTES");
    value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("ROOT");
    }
    if (canonical && text !== `${canonicalJson(value)}\n`) throw new Error("CANONICAL");
  } catch {
    throw new PreImportSupervisorError(code);
  }
  return value;
}

function exactRepository(value) {
  return exactKeys(value, [
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
  ]) &&
    path.isAbsolute(value.root) &&
    value.branch === "main" &&
    /^[0-9a-f]{40}$/u.test(value.head) &&
    value.origin_main === value.head &&
    value.ahead === 0 &&
    value.behind === 0 &&
    value.index_empty === true &&
    value.worktree_count === 1 &&
    isSha256(value.status_sha256) &&
    value.remote_repository === "jcdumaua/aifinder";
}

function validatePolicy(policy, repositoryRoot) {
  const baseKeys = [
    "schema_version",
    "policy_class",
    "operation_class",
    "supervisor_path",
    "policy_path",
    "candidate",
    "credential_source_policy",
    "compatibility_support_sha256",
    "independent_semantic_source_sha256_by_path",
    "independent_semantic_pin_set_sha256",
    "approved_runner",
    "retained_state",
    "repository",
    "authorization",
  ];
  const policyKeys = Object.hasOwn(policy ?? {}, "official_runtime")
    ? [...baseKeys, "official_runtime"]
    : baseKeys;
  const baseChecks = [
    ["ROOT_KEYS", exactKeys(policy, policyKeys)],
    ["HEADER", policy.schema_version === 1 &&
      policy.policy_class === "AIFINDER_PREIMPORT_SUPERVISOR_V1" &&
      policy.operation_class === OPERATION_CLASS],
    ["CREDENTIAL_POLICY", exactObject(
      policy.credential_source_policy,
      CREDENTIAL_SOURCE_POLICY,
    )],
    ["PATHS", exactRelativePath(policy.supervisor_path) &&
      exactRelativePath(policy.policy_path)],
    ["CANDIDATE", exactKeys(policy.candidate, [
      "manifest_path",
      "manifest_sha256",
      "candidate_identity_sha256",
      "member_count",
    ]) && exactRelativePath(policy.candidate?.manifest_path) &&
      isSha256(policy.candidate?.manifest_sha256) &&
      isSha256(policy.candidate?.candidate_identity_sha256) &&
      Number.isSafeInteger(policy.candidate?.member_count) &&
      policy.candidate.member_count >= 1],
    ["SUPPORT", exactKeys(policy.compatibility_support_sha256, SUPPORT_PATHS) &&
      Object.values(policy.compatibility_support_sha256 ?? {}).every(
        (value) => isSha256(value),
      )],
    ["SEMANTIC", policy.independent_semantic_source_sha256_by_path &&
      typeof policy.independent_semantic_source_sha256_by_path === "object" &&
      !Array.isArray(policy.independent_semantic_source_sha256_by_path) &&
      Object.entries(policy.independent_semantic_source_sha256_by_path).every(
        ([relativePath, digest]) => exactRelativePath(relativePath) && isSha256(digest),
      ) && isSha256(policy.independent_semantic_pin_set_sha256) &&
      policy.independent_semantic_pin_set_sha256 === sha256(canonicalJson(
      policy.independent_semantic_source_sha256_by_path,
    ))],
    ["RUNNER", exactKeys(policy.approved_runner, ["path", "sha256"]) &&
      exactRelativePath(policy.approved_runner?.path) &&
      isSha256(policy.approved_runner?.sha256)],
    ["RETAINED", exactKeys(policy.retained_state, [
      "freeze_path",
      "freeze_sha256",
      "retained_identity_digest_sha256",
      "classification",
    ]) && exactRelativePath(policy.retained_state?.freeze_path) &&
      isSha256(policy.retained_state?.freeze_sha256) &&
      policy.retained_state?.retained_identity_digest_sha256 ===
        RETAINED_IDENTITY_SHA256 &&
      policy.retained_state?.classification === "FAIL_CLOSED_UNRESOLVED"],
    ["REPOSITORY", exactRepository(policy.repository) &&
      policy.repository?.root === repositoryRoot],
    ["AUTHORIZATION", exactKeys(policy.authorization, [
      "approval_token_sha256",
      "attempt_limit",
      "request_budget",
      "mutation_budget",
      "success_retention_policy",
    ]) && policy.authorization?.approval_token_sha256 === APPROVAL_TOKEN_SHA256 &&
      policy.authorization?.attempt_limit === 1 &&
      policy.authorization?.request_budget === 16 &&
      policy.authorization?.mutation_budget === 15 &&
      policy.authorization?.success_retention_policy ===
        "RETAIN_EXACTLY_ONE_PREVIEW"],
  ];
  const failedBase = baseChecks.find(([, passed]) => !passed);
  if (failedBase) {
    const error = new PreImportSupervisorError("SUPERVISOR_POLICY_INVALID");
    error.detail = `BASE_${failedBase[0]}`;
    throw error;
  }
  if (Object.hasOwn(policy, "official_runtime")) {
    const official = policy.official_runtime;
    const checks = [
      ["SHAPE", exactKeys(official, [
        "operation_class",
        "authorization_schema_path",
        "authorization_schema_sha256",
        "contract_sha256",
        "credential_source_policy",
        "route_source_sha256",
        "repository",
        "access_mode",
      ])],
      ["CLASS", official.operation_class === OFFICIAL_OPERATION_CLASS],
      ["SCHEMA_PATH", official.authorization_schema_path ===
        OFFICIAL_AUTHORIZATION_SCHEMA_PATH],
      ["SCHEMA_SHA", isSha256(official.authorization_schema_sha256)],
      ["CONTRACT_KEYS", exactKeys(
        official.contract_sha256,
        OFFICIAL_CONTRACT_DIGEST_KEYS,
      )],
      ["CONTRACT_SHA", Object.values(official.contract_sha256 ?? {}).every(
        (value) => isSha256(value),
      )],
      ["CREDENTIAL_POLICY", exactObject(
        official.credential_source_policy,
        OFFICIAL_CREDENTIAL_SOURCE_POLICY,
      )],
      ["ROUTE_KEYS", exactKeys(
        official.route_source_sha256,
        OFFICIAL_ROUTE_SOURCE_PATHS,
      )],
      ["ROUTE_SHA", Object.values(official.route_source_sha256 ?? {}).every(
        (value) => isSha256(value),
      )],
      ["REPOSITORY", exactRepository(official.repository)],
      ["REPOSITORY_ROOT", official.repository?.root === repositoryRoot],
      ["BASELINE_HEAD", official.repository?.head === OFFICIAL_REQUIRED_BASELINE],
      ["BASELINE_ORIGIN", official.repository?.origin_main ===
        OFFICIAL_REQUIRED_BASELINE],
      ["ACCESS_MODE", official.access_mode === "SELF_PROJECT_OIDC"],
    ];
    const failed = checks.find(([, passed]) => !passed);
    if (failed) {
      const error = new PreImportSupervisorError("SUPERVISOR_POLICY_INVALID");
      error.detail = `OFFICIAL_${failed[0]}`;
      throw error;
    }
  }
  return policy;
}

function exactExecution(value, runId) {
  return exactKeys(value, [
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
  ]) &&
    value.journal_directory ===
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${runId}` &&
    value.branch_name === `aifinder-qualification-${runId}` &&
    /^[0-9a-f]{40}$/u.test(value.temporary_commit_sha) &&
    value.preview_project_id === "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" &&
    value.preview_project_name === "aifinder" &&
    value.preview_team_id === "team_9POJYxNnjIBbrQ19My8M5yG3" &&
    value.preview_team_slug === "ai-finder-s-projects" &&
    value.fixture_website === `https://${runId}.invalid/` &&
    typeof value.fixture_name === "string" &&
    value.fixture_name.length >= 1 &&
    value.fixture_name.length <= 160 &&
    value.supabase_origin_sha256 ===
      "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777" &&
    value.supabase_project_ref_sha256 ===
      "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914" &&
    value.storage_bucket === "tool-logos" &&
    value.storage_name === `admin/${runId}.png` &&
    exactObject(value.environment_keys, ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"]) &&
    exactObject(value.staging_checks, [
      { method: "GET", path: "/", status: 200 },
      { method: "GET", path: "/api/admin/session", status: 401 },
    ]);
}

function validateAuthorization(authorization, policy, nowEpochMs) {
  const runIdPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
  const created = Date.parse(authorization?.created_at);
  const expires = Date.parse(authorization?.expires_at);
  if (
    !Number.isSafeInteger(nowEpochMs) ||
    !exactKeys(authorization, [
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
    ]) ||
    authorization.schema_version !== 1 ||
    !isSha256(authorization.authorization_id_sha256) ||
    !isSha256(authorization.supervisor_sha256) ||
    !isSha256(authorization.supervisor_policy_sha256) ||
    authorization.candidate_identity_sha256 !== policy.candidate.candidate_identity_sha256 ||
    authorization.manifest_sha256 !== policy.candidate.manifest_sha256 ||
    !exactObject(
      authorization.compatibility_support_sha256,
      policy.compatibility_support_sha256,
    ) ||
    authorization.retained_legacy_identity_sha256 !== RETAINED_IDENTITY_SHA256 ||
    authorization.retained_legacy_classification !== "FAIL_CLOSED_UNRESOLVED" ||
    authorization.preserve_ambiguous_legacy_resources !== true ||
    authorization.operation_class !== OPERATION_CLASS ||
    authorization.attempt_limit !== policy.authorization.attempt_limit ||
    authorization.request_budget !== policy.authorization.request_budget ||
    authorization.mutation_budget !== policy.authorization.mutation_budget ||
    authorization.success_retention_policy !==
      policy.authorization.success_retention_policy ||
    authorization.independent_review_approval_token_sha256 !==
      policy.authorization.approval_token_sha256 ||
    !Number.isFinite(created) ||
    !Number.isFinite(expires) ||
    created > nowEpochMs ||
    nowEpochMs >= expires ||
    expires <= created ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !runIdPattern.test(authorization.run_id) ||
    SPENT_RUN_IDS.includes(authorization.run_id) ||
    !exactObject(authorization.repository, policy.repository) ||
    !exactExecution(authorization.execution, authorization.run_id)
  ) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  return authorization;
}

function exactOfficialExecution(value, runId) {
  return exactKeys(value, [
    "access_mode",
    "branch_name",
    "journal_directory",
    "preview_project_id",
    "preview_project_name",
    "preview_team_id",
    "preview_team_slug",
    "storage_bucket",
    "storage_name",
    "temporary_commit_sha",
    "environment_keys",
  ]) &&
    value.access_mode === "SELF_PROJECT_OIDC" &&
    value.branch_name === `aifinder-admin-v1-official-${runId}` &&
    value.journal_directory ===
      `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${runId}` &&
    value.preview_project_id === "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" &&
    value.preview_project_name === "aifinder" &&
    value.preview_team_id === "team_9POJYxNnjIBbrQ19My8M5yG3" &&
    value.preview_team_slug === "ai-finder-s-projects" &&
    value.storage_bucket === "tool-logos" &&
    value.storage_name === `admin/${runId}.png` &&
    /^[0-9a-f]{40}$/u.test(value.temporary_commit_sha ?? "") &&
    exactObject(value.environment_keys, [
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
    ]);
}

export function validateOfficialAuthorizationForSupervisor(
  authorization,
  policy,
  nowEpochMs,
) {
  const runIdPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
  const created = Date.parse(authorization?.created_at);
  const expires = Date.parse(authorization?.expires_at);
  const official = policy?.official_runtime;
  if (
    !Number.isSafeInteger(nowEpochMs) ||
    !exactKeys(authorization, [
      "schema_version",
      "operation_class",
      "authorization_id_sha256",
      "one_use_authorization_sha256",
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
    ]) ||
    authorization.schema_version !== 1 ||
    authorization.operation_class !== OFFICIAL_OPERATION_CLASS ||
    ![
      authorization.authorization_id_sha256,
      authorization.one_use_authorization_sha256,
      authorization.supervisor_sha256,
      authorization.supervisor_policy_sha256,
    ].every(isSha256) ||
    authorization.candidate_identity_sha256 !==
      policy?.candidate?.candidate_identity_sha256 ||
    authorization.manifest_sha256 !== policy?.candidate?.manifest_sha256 ||
    authorization.authorization_schema_sha256 !==
      official?.authorization_schema_sha256 ||
    !exactObject(
      authorization.compatibility_support_sha256,
      policy?.compatibility_support_sha256,
    ) ||
    !exactObject(
      authorization.route_source_sha256,
      official?.route_source_sha256,
    ) ||
    !exactObject(authorization.contract_sha256, official?.contract_sha256) ||
    !Number.isFinite(created) || !Number.isFinite(expires) ||
    created > nowEpochMs || nowEpochMs >= expires || expires <= created ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !runIdPattern.test(authorization.run_id ?? "") ||
    SPENT_RUN_IDS.includes(authorization.run_id) ||
    !exactObject(authorization.repository, official?.repository) ||
    !exactOfficialExecution(authorization.execution, authorization.run_id)
  ) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  return authorization;
}

function memberRowsIdentity(members) {
  return sha256(members.map((entry) =>
    [entry.path, entry.sha256, String(entry.bytes), entry.mode].join("\0")
  ).join("\n"));
}

function verifyCandidate(repositoryRoot, policy) {
  const manifestPath = repositoryPath(repositoryRoot, policy.candidate.manifest_path);
  const manifestBytes = regularFileBytes(
    manifestPath,
    0o644,
    "SUPERVISOR_CANDIDATE_MISMATCH",
  );
  if (sha256(manifestBytes) !== policy.candidate.manifest_sha256) {
    throw new PreImportSupervisorError("SUPERVISOR_CANDIDATE_MISMATCH");
  }
  const manifest = parseJson(manifestBytes, {
    canonical: true,
    code: "SUPERVISOR_CANDIDATE_MISMATCH",
  });
  if (
    manifest.schema_version !== 1 ||
    manifest.manifest_path !== policy.candidate.manifest_path ||
    manifest.manifest_self_exclusion !== "EXCLUDED_TO_AVOID_CIRCULAR_BYTE_IDENTITY" ||
    manifest.candidate_identity_sha256 !== policy.candidate.candidate_identity_sha256 ||
    manifest.member_count !== policy.candidate.member_count ||
    !Array.isArray(manifest.members) ||
    manifest.members.length !== policy.candidate.member_count
  ) throw new PreImportSupervisorError("SUPERVISOR_CANDIDATE_MISMATCH");
  const ordered = manifest.members.map((entry) => entry.path);
  if (
    ordered.some((entry, index) =>
      !exactRelativePath(entry) ||
      entry === policy.supervisor_path ||
      entry === policy.policy_path ||
      (index > 0 && ordered[index - 1].localeCompare(entry, "en") >= 0)
    )
  ) throw new PreImportSupervisorError("SUPERVISOR_CANDIDATE_MISMATCH");
  for (const entry of manifest.members) {
    if (
      !exactKeys(entry, ["bytes", "mode", "path", "role", "sha256", "surface"]) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 0 ||
      entry.mode !== "0644" ||
      !isSha256(entry.sha256)
    ) throw new PreImportSupervisorError("SUPERVISOR_CANDIDATE_MISMATCH");
    const bytes = regularFileBytes(
      repositoryPath(repositoryRoot, entry.path),
      0o644,
      "SUPERVISOR_MEMBER_MISMATCH",
    );
    if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
      throw new PreImportSupervisorError("SUPERVISOR_MEMBER_MISMATCH");
    }
  }
  if (memberRowsIdentity(manifest.members) !== policy.candidate.candidate_identity_sha256) {
    throw new PreImportSupervisorError("SUPERVISOR_CANDIDATE_MISMATCH");
  }
  return manifest;
}

function verifySupportsAndPins(repositoryRoot, policy) {
  for (const relativePath of SUPPORT_PATHS) {
    const bytes = regularFileBytes(
      repositoryPath(repositoryRoot, relativePath),
      0o644,
      "SUPERVISOR_SUPPORT_MISMATCH",
    );
    if (sha256(bytes) !== policy.compatibility_support_sha256[relativePath]) {
      throw new PreImportSupervisorError("SUPERVISOR_SUPPORT_MISMATCH");
    }
  }
  const safety = parseJson(
    regularFileBytes(
      repositoryPath(repositoryRoot, SAFETY_MANIFEST_RELATIVE_PATH),
      0o644,
      "SUPERVISOR_SEMANTIC_PIN_MISMATCH",
    ),
    { code: "SUPERVISOR_SEMANTIC_PIN_MISMATCH" },
  );
  if (!exactObject(
    safety.launch_operations_kernel_semantic_source_sha256_by_path,
    policy.independent_semantic_source_sha256_by_path,
  )) throw new PreImportSupervisorError("SUPERVISOR_SEMANTIC_PIN_MISMATCH");
  for (const [relativePath, digest] of Object.entries(
    policy.independent_semantic_source_sha256_by_path,
  )) {
    const bytes = regularFileBytes(
      repositoryPath(repositoryRoot, relativePath),
      0o644,
      "SUPERVISOR_SEMANTIC_PIN_MISMATCH",
    );
    if (sha256(bytes) !== digest) {
      throw new PreImportSupervisorError("SUPERVISOR_SEMANTIC_PIN_MISMATCH");
    }
  }
}

function gitOutput(repositoryRoot, args, { allowOne = false, binary = false } = {}) {
  const result = spawnSync("/usr/bin/sandbox-exec", [
    "-p",
    PRE_TRUST_GIT_SANDBOX_PROFILE,
    "/usr/bin/git",
    "--no-replace-objects",
    ...PRE_TRUST_GIT_CONFIG,
    "--no-optional-locks",
    ...args,
  ], {
    cwd: repositoryRoot,
    encoding: null,
    env: {
      GIT_ASKPASS: "/usr/bin/false",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin",
      SSH_ASKPASS: "/usr/bin/false",
    },
    maxBuffer: 4 * 1024 * 1024,
    timeout: 20_000,
  });
  if (
    !result ||
    !(result.status === 0 || (allowOne && result.status === 1)) ||
    !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.stderr.byteLength !== 0
  ) throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  if (binary) return { status: result.status, stdout: Buffer.from(result.stdout) };
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  } catch {
    throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  }
  if (text.includes("\0")) {
    throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  }
  return { status: result.status, stdout: text };
}

function oneLine(repositoryRoot, args) {
  const value = gitOutput(repositoryRoot, args).stdout;
  if (!value.endsWith("\n") || value.slice(0, -1).includes("\n")) {
    throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  }
  return value.slice(0, -1);
}

export function inspectPreImportRepository(repositoryRoot) {
  const branch = oneLine(repositoryRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  const head = oneLine(repositoryRoot, ["rev-parse", "HEAD"]);
  const originMain = oneLine(repositoryRoot, ["rev-parse", "refs/remotes/origin/main"]);
  const counts = oneLine(repositoryRoot, [
    "rev-list",
    "--left-right",
    "--count",
    "HEAD...refs/remotes/origin/main",
  ]).split(/\s+/u);
  const index = gitOutput(
    repositoryRoot,
    ["diff", "--cached", "--quiet", "--exit-code"],
    { allowOne: true },
  );
  const worktrees = gitOutput(
    repositoryRoot,
    ["worktree", "list", "--porcelain"],
  ).stdout.split("\n").filter((line) => line.startsWith("worktree "));
  const status = gitOutput(
    repositoryRoot,
    ["status", "--porcelain=v1", "--untracked-files=all", "-z"],
    { binary: true },
  ).stdout;
  const remote = oneLine(repositoryRoot, ["remote", "get-url", "origin"]);
  if (
    counts.length !== 2 ||
    counts.some((entry) => !/^\d+$/u.test(entry)) ||
    ![
      "git@github.com:jcdumaua/aifinder.git",
      "https://github.com/jcdumaua/aifinder.git",
    ].includes(remote)
  ) throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  return {
    root: repositoryRoot,
    branch,
    head,
    origin_main: originMain,
    ahead: Number(counts[0]),
    behind: Number(counts[1]),
    index_empty: index.status === 0,
    worktree_count: worktrees.length,
    status_sha256: sha256(status),
    remote_repository: "jcdumaua/aifinder",
  };
}

export function verifyPreImportSupervisorTrust({
  authorization_path,
  repository_root = REPOSITORY_ROOT,
  supervisor_path = path.join(REPOSITORY_ROOT, SUPERVISOR_RELATIVE_PATH),
  policy_path = path.join(REPOSITORY_ROOT, POLICY_RELATIVE_PATH),
  now_epoch_ms = Date.now(),
  inspect_repository = inspectPreImportRepository,
}) {
  if (
    realpathSync(repository_root) !== repository_root ||
    supervisor_path !== repositoryPath(repository_root, SUPERVISOR_RELATIVE_PATH) &&
      !supervisor_path.startsWith(`${repository_root}${path.sep}`) ||
    policy_path !== repositoryPath(repository_root, POLICY_RELATIVE_PATH) &&
      !policy_path.startsWith(`${repository_root}${path.sep}`)
  ) throw new PreImportSupervisorError("SUPERVISOR_PATH_INVALID");
  const supervisorBytes = regularFileBytes(
    supervisor_path,
    0o644,
    "SUPERVISOR_IDENTITY_MISMATCH",
  );
  const policyBytes = regularFileBytes(
    policy_path,
    0o644,
    "SUPERVISOR_POLICY_INVALID",
  );
  const policy = validatePolicy(
    parseJson(policyBytes, { canonical: true, code: "SUPERVISOR_POLICY_INVALID" }),
    repository_root,
  );
  if (
    supervisor_path !== repositoryPath(repository_root, policy.supervisor_path) ||
    policy_path !== repositoryPath(repository_root, policy.policy_path)
  ) throw new PreImportSupervisorError("SUPERVISOR_PATH_INVALID");
  const authorizationBytes = regularFileBytes(
    authorization_path,
    0o600,
    "SUPERVISOR_AUTHORIZATION_INVALID",
  );
  const parsedAuthorization = parseJson(authorizationBytes, {
    canonical: true,
    code: "SUPERVISOR_AUTHORIZATION_INVALID",
  });
  const officialMode =
    parsedAuthorization.operation_class === OFFICIAL_OPERATION_CLASS;
  const authorization = officialMode
    ? validateOfficialAuthorizationForSupervisor(
      parsedAuthorization,
      policy,
      now_epoch_ms,
    )
    : validateAuthorization(parsedAuthorization, policy, now_epoch_ms);
  if (
    authorization.supervisor_sha256 !== sha256(supervisorBytes) ||
    authorization.supervisor_policy_sha256 !== sha256(policyBytes)
  ) throw new PreImportSupervisorError("SUPERVISOR_IDENTITY_MISMATCH");
  const manifest = verifyCandidate(repository_root, policy);
  verifySupportsAndPins(repository_root, policy);
  if (officialMode) {
    const official = policy.official_runtime;
    if (
      sha256(regularFileBytes(
        repositoryPath(repository_root, official.authorization_schema_path),
        0o644,
        "SUPERVISOR_AUTHORIZATION_SCHEMA_MISMATCH",
      )) !== official.authorization_schema_sha256
    ) throw new PreImportSupervisorError(
      "SUPERVISOR_AUTHORIZATION_SCHEMA_MISMATCH",
    );
    for (const [relativePath, expectedSha256] of Object.entries(
      official.route_source_sha256,
    )) {
      if (
        sha256(regularFileBytes(
          repositoryPath(repository_root, relativePath),
          0o644,
          "SUPERVISOR_ROUTE_SOURCE_MISMATCH",
        )) !== expectedSha256
      ) throw new PreImportSupervisorError("SUPERVISOR_ROUTE_SOURCE_MISMATCH");
    }
  }
  const runnerPath = repositoryPath(repository_root, policy.approved_runner.path);
  if (
    policy.approved_runner.path !== RUNNER_RELATIVE_PATH ||
    sha256(regularFileBytes(runnerPath, 0o644, "SUPERVISOR_RUNNER_MISMATCH")) !==
      policy.approved_runner.sha256 ||
    !manifest.members.some((entry) =>
      entry.path === policy.approved_runner.path &&
      entry.sha256 === policy.approved_runner.sha256
    )
  ) throw new PreImportSupervisorError("SUPERVISOR_RUNNER_MISMATCH");
  if (
    sha256(regularFileBytes(
      repositoryPath(repository_root, policy.retained_state.freeze_path),
      0o644,
      "SUPERVISOR_RETAINED_STATE_MISMATCH",
    )) !== policy.retained_state.freeze_sha256
  ) throw new PreImportSupervisorError("SUPERVISOR_RETAINED_STATE_MISMATCH");
  const observedRepository = inspect_repository(repository_root);
  const expectedRepository = officialMode
    ? policy.official_runtime.repository
    : policy.repository;
  if (
    !exactObject(observedRepository, expectedRepository) ||
    !exactObject(observedRepository, authorization.repository)
  ) throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  return Object.freeze({
    verified: true,
    supervisor_sha256: authorization.supervisor_sha256,
    supervisor_policy_sha256: authorization.supervisor_policy_sha256,
    candidate_identity_sha256: policy.candidate.candidate_identity_sha256,
    manifest_sha256: policy.candidate.manifest_sha256,
    runner_path: runnerPath,
    runner_sha256: policy.approved_runner.sha256,
    authorization: structuredClone(authorization),
    authorization_bytes: Buffer.from(authorizationBytes),
    authorization_sha256: sha256(authorizationBytes),
    credential_source_policy: structuredClone(
      officialMode
        ? policy.official_runtime.credential_source_policy
        : policy.credential_source_policy,
    ),
    operation_class: authorization.operation_class,
  });
}

function safeCode(error) {
  return new Set([
    "SUPERVISOR_AUTHORIZATION_CHANGED",
    "SUPERVISOR_AUTHORIZATION_SCHEMA_MISMATCH",
    "SUPERVISOR_AUTHORIZATION_INVALID",
    "SUPERVISOR_CANDIDATE_MISMATCH",
    "SUPERVISOR_IDENTITY_MISMATCH",
    "SUPERVISOR_MEMBER_MISMATCH",
    "SUPERVISOR_MODE_DENIED",
    "SUPERVISOR_OUTPUT_WRITER_MISSING",
    "SUPERVISOR_PATH_INVALID",
    "SUPERVISOR_POLICY_INVALID",
    "SUPERVISOR_REPOSITORY_MISMATCH",
    "SUPERVISOR_ROUTE_SOURCE_MISMATCH",
    "SUPERVISOR_RETAINED_STATE_MISMATCH",
    "SUPERVISOR_RUNNER_MISMATCH",
    "SUPERVISOR_SEMANTIC_PIN_MISMATCH",
    "SUPERVISOR_SUPPORT_MISMATCH",
  ]).has(error?.code)
    ? error.code
    : "SUPERVISOR_FAILED";
}

const SAFE_RUNNER_OUTPUT_CODES = new Set([
  "CONCRETE_AUTHORIZATION_EXPIRED",
  "CONCRETE_AUTHORIZATION_INVALID",
  "CONCRETE_AUTHORIZATION_REQUIRED",
  "CONCRETE_CANDIDATE_MISMATCH",
  "CONCRETE_CREDENTIAL_MISSING",
  "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
  "CONCRETE_MODE_DENIED",
  "CONCRETE_QUALIFICATION_FAILED_CLOSED",
  "CONCRETE_QUALIFICATION_RECOVERED",
  "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
  "CONCRETE_REPOSITORY_MISMATCH",
  "CONCRETE_RETAINED_STATE_MISMATCH",
  "CONCRETE_RUNNER_FAILED",
  "CONCRETE_SUPERVISOR_TRUST_REQUIRED",
  "CONCRETE_SUPPORT_MISMATCH",
  "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
  "OFFICIAL_AUTHORIZATION_INVALID",
  "OFFICIAL_AUTHORIZATION_REQUIRED",
  "OFFICIAL_AUTHORIZATION_SPENT",
  "OFFICIAL_BUDGET_EXHAUSTED",
  "OFFICIAL_CANDIDATE_MISMATCH",
  "OFFICIAL_CONTRACT_MISMATCH",
  "OFFICIAL_PRIOR_RECOVERY_PENDING",
  "OFFICIAL_RECOVERY_PENDING",
  "OFFICIAL_REPOSITORY_MISMATCH",
  "OFFICIAL_ROUTE_SOURCE_MISMATCH",
  "OFFICIAL_RUNTIME_COMPLETE",
  "OFFICIAL_RUNTIME_FAILED_CLOSED",
  "OFFICIAL_SUPPORT_MISMATCH",
  "OFFICIAL_SUPERVISOR_TRUST_REQUIRED",
  "OFFICIAL_TEMPORARY_COMMIT_MISMATCH",
  "QUALIFIED",
]);

function sanitizedRunnerOutput(value) {
  const code = SAFE_RUNNER_OUTPUT_CODES.has(value?.code)
    ? value.code
    : "CONCRETE_RUNNER_FAILED";
  const output = {
    status: ["QUALIFIED", "OFFICIAL_RUNTIME_COMPLETE"].includes(code)
      ? "PASS"
      : "FAIL",
    code,
  };
  if (["CONCRETE_CREDENTIAL_MISSING", "CONCRETE_CREDENTIAL_SOURCE_MISMATCH"].includes(code)) {
    const allowedMissing = new Set([
      "GH_TOKEN|GITHUB_TOKEN",
      "VERCEL_TOKEN",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
    ]);
    const allowedInvalid = new Set([
      "GITHUB",
      "VERCEL",
      "SUPABASE_URL",
      "SUPABASE_ANON",
      "SUPABASE_SERVICE_ROLE",
      "ADMIN_PASSWORD",
      "ADMIN_SESSION",
      "ENV_LOCAL",
    ]);
    if (
      Array.isArray(value.missing_credentials) &&
      value.missing_credentials.length > 0 &&
      value.missing_credentials.every((entry) => allowedMissing.has(entry))
    ) output.missing_credentials = [...value.missing_credentials];
    if (
      Array.isArray(value.invalid_credential_sources) &&
      value.invalid_credential_sources.length > 0 &&
      value.invalid_credential_sources.every((entry) => allowedInvalid.has(entry))
    ) output.invalid_credential_sources = [...value.invalid_credential_sources];
  }
  if (
    [
      "CONCRETE_QUALIFICATION_FAILED_CLOSED",
      "CONCRETE_QUALIFICATION_RECOVERED",
      "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
      "QUALIFIED",
    ].includes(code)
  ) {
    output.attempts_used = 1;
    output.retained_preview_count = code === "QUALIFIED" ? 1 : 0;
  }
  if (code === "OFFICIAL_RUNTIME_COMPLETE") {
    output.qualification_requests = 6;
    output.official_requests = 20;
    output.runtime_sessions = 1;
    output.runtime_retries = 0;
    output.runtime_replays = 0;
  }
  return output;
}

export async function dispatchPreImportSupervisor(argumentsList, dependencies = {}) {
  if (
    Array.isArray(argumentsList) &&
    argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) {
    dependencies.write_output?.({
      status: "PASS",
      code: "PASS_SUPERVISOR_SELF_TEST",
      network: 0,
      credential_reads: 0,
      candidate_imports: 0,
    });
    return { exit_code: 0, code: "PASS_SUPERVISOR_SELF_TEST" };
  }
  const requestedMode = Array.isArray(argumentsList) ? argumentsList[0] : null;
  if (
    !Array.isArray(argumentsList) ||
    argumentsList.length !== 3 ||
    !["--qualify-nonproduction", "--run-admin-v1-official"].includes(
      requestedMode,
    ) ||
    argumentsList[1] !== "--authorization" ||
    typeof argumentsList[2] !== "string"
  ) {
    dependencies.write_output?.({ status: "FAIL", code: "SUPERVISOR_MODE_DENIED" });
    return { exit_code: 1, code: "SUPERVISOR_MODE_DENIED" };
  }
  if (typeof dependencies.write_output !== "function") {
    return { exit_code: 1, code: "SUPERVISOR_OUTPUT_WRITER_MISSING" };
  }
  try {
    const trust = verifyPreImportSupervisorTrust({
      authorization_path: argumentsList[2],
      repository_root: dependencies.repository_root,
      supervisor_path: dependencies.supervisor_path,
      policy_path: dependencies.policy_path,
      now_epoch_ms: dependencies.now_epoch_ms,
      inspect_repository: dependencies.inspect_repository,
    });
    const importRunner = dependencies.import_runner ??
      ((url) => import(url.href));
    const runner = await importRunner(pathToFileURL(trust.runner_path));
    if (
      typeof runner?.dispatchConcreteQualificationRunner !== "function" ||
      typeof runner?.createConcreteRunnerDependencies !== "function"
    ) throw new PreImportSupervisorError("SUPERVISOR_RUNNER_MISMATCH");
    const currentAuthorizationBytes = regularFileBytes(
      argumentsList[2],
      0o600,
      "SUPERVISOR_AUTHORIZATION_CHANGED",
    );
    if (sha256(currentAuthorizationBytes) !== trust.authorization_sha256) {
      throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_CHANGED");
    }
    return runner.dispatchConcreteQualificationRunner(
      argumentsList,
      runner.createConcreteRunnerDependencies({
        writeOutput(value) {
          dependencies.write_output(sanitizedRunnerOutput(value));
        },
      }),
      Object.freeze({
        verified: true,
        authorization: structuredClone(trust.authorization),
        authorization_bytes: Buffer.from(trust.authorization_bytes),
        authorization_sha256: trust.authorization_sha256,
        credential_source_policy: structuredClone(trust.credential_source_policy),
        supervisor_sha256: trust.supervisor_sha256,
        supervisor_policy_sha256: trust.supervisor_policy_sha256,
        ...(trust.operation_class === OFFICIAL_OPERATION_CLASS
          ? { operation_class: OFFICIAL_OPERATION_CLASS }
          : {}),
      }),
    );
  } catch (error) {
    const code = safeCode(error);
    dependencies.write_output?.({ status: "FAIL", code });
    return { exit_code: 1, code };
  }
}

async function main() {
  const result = await dispatchPreImportSupervisor(process.argv.slice(2), {
    repository_root: REPOSITORY_ROOT,
    supervisor_path: fileURLToPath(import.meta.url),
    policy_path: path.join(REPOSITORY_ROOT, POLICY_RELATIVE_PATH),
    now_epoch_ms: Date.now(),
    inspect_repository: inspectPreImportRepository,
    write_output(value) {
      console.log(canonicalJson(value));
    },
  });
  process.exitCode = result.exit_code;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
