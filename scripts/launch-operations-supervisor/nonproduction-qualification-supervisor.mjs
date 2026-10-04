import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  openSync,
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
const OFFICIAL_AUTHORIZATION_SCHEMA_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json";
const PRE_TRUST_GIT_EXECUTABLE =
  "/Library/Developer/CommandLineTools/usr/bin/git";
const PRE_TRUST_GIT_ANCESTORS = Object.freeze([
  "/",
  "/Library",
  "/Library/Developer",
  "/Library/Developer/CommandLineTools",
  "/Library/Developer/CommandLineTools/usr",
  "/Library/Developer/CommandLineTools/usr/bin",
]);
const PRE_TRUST_FILESYSTEM = Object.freeze({ lstatSync, realpathSync });
const SPENT_RUN_IDS = Object.freeze([
  "8c0d9e84-62e5-4658-9de0-c0121a302951",
  "e46a0d21-f0b4-4f7d-8a4f-e7f6e8a7eda0",
  "26199d3a-5bcd-4a48-9f31-c7a081195207",
  "f16a8383-a3ff-4c51-bec6-dc8beba5f4eb",
  "89336a0a-b67c-4ad6-99d2-b527ffdca9fd",
  "8e694077-7724-46b4-88ae-1e959d7c28de",
  "716fcb1b-7999-42b4-82f8-e5e8e65b644f",
  "a397fbe1-1107-40df-86b2-83b153d8b8cc",
  "d331e3ef-ce63-47d7-b728-94db274d306e",
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
const OFFICIAL_CONTRACT_DIGEST_KEYS_V1 = Object.freeze([
  "budgets",
  "deferred_routes",
  "environment_names",
  "official_ledger",
  "qualification_ledger",
  "target_routes",
]);
const OFFICIAL_CONTRACT_DIGEST_KEYS_V2 = Object.freeze([
  "action_costs", ...OFFICIAL_CONTRACT_DIGEST_KEYS_V1,
]);
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const PRE_TRUST_GIT_SANDBOX_PROFILE = [
  "(version 1)",
  "(allow default)",
  "(deny network*)",
  "(deny file-write*)",
  '(allow file-write* (literal "/dev/null"))',
  "(deny process-exec*)",
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

export function validatePreTrustGitExecutable(
  executablePath = PRE_TRUST_GIT_EXECUTABLE,
  filesystem = PRE_TRUST_FILESYSTEM,
) {
  try {
    if (executablePath !== PRE_TRUST_GIT_EXECUTABLE) {
      throw new Error("PRE_TRUST_GIT_PATH");
    }
    for (const ancestorPath of PRE_TRUST_GIT_ANCESTORS) {
      const metadata = filesystem.lstatSync(ancestorPath);
      if (
        !metadata.isDirectory() ||
        metadata.isSymbolicLink() ||
        metadata.uid !== 0 ||
        metadata.gid !== 0 ||
        (metadata.mode & 0o7777) !== 0o0755 ||
        filesystem.realpathSync(ancestorPath) !== ancestorPath
      ) throw new Error("PRE_TRUST_GIT_ANCESTOR_IDENTITY");
    }
    const metadata = filesystem.lstatSync(executablePath);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      metadata.uid !== 0 ||
      metadata.gid !== 0 ||
      (metadata.mode & 0o7777) !== 0o0755 ||
      filesystem.realpathSync(executablePath) !== PRE_TRUST_GIT_EXECUTABLE
    ) throw new Error("PRE_TRUST_GIT_IDENTITY");
  } catch {
    throw new PreImportSupervisorError("SUPERVISOR_REPOSITORY_MISMATCH");
  }
  return executablePath;
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

function exactOfficialRepository(value) {
  return exactKeys(value, [
    "root",
    "branch",
    "head",
    "origin_main",
    "remote_main",
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
    value.remote_main === value.head &&
    value.ahead === 0 &&
    value.behind === 0 &&
    value.index_empty === true &&
    value.worktree_count === 1 &&
    isSha256(value.status_sha256) &&
    value.remote_repository === "jcdumaua/aifinder";
}

function exactOfficialRepositoryContract(value, repositoryRoot) {
  return exactKeys(value, [
    "root",
    "branch",
    "ahead",
    "behind",
    "index_empty",
    "worktree_count",
    "remote_repository",
    "head_binding",
    "origin_main_binding",
    "remote_main_binding",
    "status_binding",
  ]) &&
    value.root === repositoryRoot &&
    value.branch === "main" &&
    value.ahead === 0 &&
    value.behind === 0 &&
    value.index_empty === true &&
    value.worktree_count === 1 &&
    value.remote_repository === "jcdumaua/aifinder" &&
    value.head_binding === "AUTHORIZATION_PUBLISHED_HEAD" &&
    value.origin_main_binding === "SAME_AS_HEAD" &&
    value.remote_main_binding === "SAME_AS_HEAD" &&
    value.status_binding === "AUTHORIZATION_STATUS_SHA256";
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
        "isolation_contract_sha256",
        "contract_sha256",
        "contract_sha256_v2",
        "credential_source_policy",
        "route_source_sha256",
        "repository_contract",
        "access_mode",
      ])],
      ["CLASS", official.operation_class === OFFICIAL_OPERATION_CLASS],
      ["SCHEMA_PATH", official.authorization_schema_path ===
        OFFICIAL_AUTHORIZATION_SCHEMA_PATH],
      ["SCHEMA_SHA", isSha256(official.authorization_schema_sha256)],
      ["ISOLATION_SHA", isSha256(official.isolation_contract_sha256)],
      ["CONTRACT_KEYS", exactKeys(
        official.contract_sha256,
        OFFICIAL_CONTRACT_DIGEST_KEYS_V1,
      )],
      ["CONTRACT_SHA", Object.values(official.contract_sha256 ?? {}).every(
        (value) => isSha256(value),
      )],
      ["CONTRACT_V2_KEYS", exactKeys(
        official.contract_sha256_v2,
        OFFICIAL_CONTRACT_DIGEST_KEYS_V2,
      )],
      ["CONTRACT_V2_SHA", Object.values(official.contract_sha256_v2 ?? {}).every(
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
      ["REPOSITORY_CONTRACT", exactOfficialRepositoryContract(
        official.repository_contract,
        repositoryRoot,
      )],
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

function exactOfficialIsolation(value, execution, runId) {
  if (!exactKeys(value, [
    "mode", "project_ref", "origin", "provisioning_receipt_sha256",
    "schema_contract_sha256", "credential_bundle_path",
    "credential_bundle_provenance_sha256", "validation_run_id",
    "expected_preview_project_id", "expected_preview_team_id",
  ]) || value.mode !== "NEW_EMPTY_TEST_ONLY_PROJECT_V1" ||
    typeof value.project_ref !== "string" || value.project_ref.length > 256 ||
    !/^[a-z0-9-]+$/u.test(value.project_ref) ||
    value.project_ref === "mtpisopvdxuvmpzbzqjw" ||
    value.origin !== `https://${value.project_ref}.supabase.co` ||
    value.origin === "https://mtpisopvdxuvmpzbzqjw.supabase.co" ||
    value.validation_run_id !== runId ||
    value.expected_preview_project_id !== execution.preview_project_id ||
    value.expected_preview_team_id !== execution.preview_team_id ||
    value.credential_bundle_path !==
      `${execution.journal_directory}/isolated-credentials.json` ||
    ![value.provisioning_receipt_sha256, value.schema_contract_sha256,
      value.credential_bundle_provenance_sha256].every(isSha256)) return false;
  try {
    const origin = new URL(value.origin);
    return origin.protocol === "https:" && origin.origin === value.origin &&
      origin.username === "" && origin.password === "" && origin.pathname === "/" &&
      origin.search === "" && origin.hash === "";
  } catch {
    return false;
  }
}

function exactOfficialExecution(value, runId, schemaVersion = 1) {
  const v2 = schemaVersion === 2;
  const keys = [
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
  ];
  if (v2) keys.push("provider_cleanup_policy", "isolation");
  return exactKeys(value, keys) &&
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
    exactObject(value.environment_keys, v2 ? [
      "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
      "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF",
    ] : [
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
    ]) && (!v2 || (
      value.provider_cleanup_policy === "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" &&
      exactOfficialIsolation(value.isolation, value, runId)
    ));
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
  const v2 = authorization?.schema_version === 2;
  const contractKeys = v2
    ? OFFICIAL_CONTRACT_DIGEST_KEYS_V2 : OFFICIAL_CONTRACT_DIGEST_KEYS_V1;
  const contractDigests = v2
    ? official?.contract_sha256_v2 : official?.contract_sha256;
  const keys = [
    "schema_version", "operation_class", "authorization_id_sha256",
    "one_use_authorization_sha256", "review_approval_sha256",
    "candidate_identity_sha256", "manifest_sha256", "supervisor_sha256",
    "supervisor_policy_sha256", "authorization_schema_sha256",
    "compatibility_support_sha256", "route_source_sha256", "contract_sha256",
    "created_at", "expires_at", "run_id", "repository", "execution",
  ];
  if (v2) keys.push("isolation_contract_sha256");
  if (
    !Number.isSafeInteger(nowEpochMs) ||
    !exactKeys(authorization, keys) ||
    (authorization.schema_version !== 1 && !v2) ||
    authorization.operation_class !== OFFICIAL_OPERATION_CLASS ||
    ![
      authorization.authorization_id_sha256,
      authorization.one_use_authorization_sha256,
      authorization.review_approval_sha256,
      authorization.supervisor_sha256,
      authorization.supervisor_policy_sha256,
      authorization.candidate_identity_sha256,
      authorization.manifest_sha256,
      authorization.authorization_schema_sha256,
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
    !exactKeys(authorization.contract_sha256, contractKeys) ||
    !Object.values(authorization.contract_sha256 ?? {}).every(isSha256) ||
    !exactKeys(contractDigests, contractKeys) ||
    !Object.values(contractDigests ?? {}).every(isSha256) ||
    !exactObject(authorization.contract_sha256, contractDigests) ||
    !Number.isFinite(created) || !Number.isFinite(expires) ||
    (v2 && (new Date(created).toISOString() !== authorization.created_at ||
      new Date(expires).toISOString() !== authorization.expires_at)) ||
    created > nowEpochMs || nowEpochMs >= expires || expires <= created ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !runIdPattern.test(authorization.run_id ?? "") ||
    SPENT_RUN_IDS.includes(authorization.run_id) ||
    !exactOfficialRepository(authorization.repository) ||
    !exactOfficialRepositoryContract(
      official?.repository_contract,
      authorization.repository.root,
    ) ||
    !exactOfficialExecution(authorization.execution, authorization.run_id, authorization.schema_version) ||
    (v2 && (authorization.repository.root !== REPOSITORY_ROOT ||
      !isSha256(authorization.isolation_contract_sha256) ||
      authorization.isolation_contract_sha256 !== official?.isolation_contract_sha256))
  ) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  if (v2) {
    const { one_use_authorization_sha256: oneUseDigest, ...fields } = authorization;
    if (oneUseDigest !== sha256(canonicalJson({
      domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...fields,
    }))) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  }
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
  const gitExecutable = validatePreTrustGitExecutable();
  const result = spawnSync("/usr/bin/sandbox-exec", [
    "-p",
    PRE_TRUST_GIT_SANDBOX_PROFILE,
    gitExecutable,
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

function inspectPublishedRemoteMain(repositoryRoot) {
  const result = spawnSync(validatePreTrustGitExecutable(), [
    "--no-replace-objects",
    ...PRE_TRUST_GIT_CONFIG,
    "--no-optional-locks",
    "ls-remote",
    "--heads",
    "https://github.com/jcdumaua/aifinder.git",
    "refs/heads/main",
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
    maxBuffer: 4096,
    timeout: 20_000,
  });
  if (
    result?.status !== 0 ||
    !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.stderr.byteLength !== 0
  ) throw new PreImportSupervisorError("SUPERVISOR_REMOTE_MAIN_MISMATCH");
  let output;
  try {
    output = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  } catch {
    throw new PreImportSupervisorError("SUPERVISOR_REMOTE_MAIN_MISMATCH");
  }
  const match = /^([0-9a-f]{40})\trefs\/heads\/main\n$/u.exec(output);
  if (!match) throw new PreImportSupervisorError("SUPERVISOR_REMOTE_MAIN_MISMATCH");
  return match[1];
}

export function inspectPreImportRepository(
  repositoryRoot,
  { include_remote_main = false } = {},
) {
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
    ...(include_remote_main
      ? { remote_main: inspectPublishedRemoteMain(repositoryRoot) }
      : {}),
    ahead: Number(counts[0]),
    behind: Number(counts[1]),
    index_empty: index.status === 0,
    worktree_count: worktrees.length,
    status_sha256: sha256(status),
    remote_repository: "jcdumaua/aifinder",
  };
}

export function verifyOfficialRunUnspentBeforeImport(
  authorization,
  filesystem = { lstatSync, realpathSync },
) {
  const directory = authorization?.execution?.journal_directory;
  if (
    authorization?.schema_version !== 2 ||
    authorization.operation_class !== OFFICIAL_OPERATION_CLASS ||
    typeof authorization.run_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
      .test(authorization.run_id) ||
    directory !== `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${authorization.run_id}`
  ) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  let metadata;
  try {
    metadata = filesystem.lstatSync(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return Object.freeze({ status: "ABSENT" });
    throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  }
  try {
    if (
      !metadata.isDirectory() || metadata.isSymbolicLink() ||
      (metadata.mode & 0o777) !== 0o700 ||
      filesystem.realpathSync(directory) !== directory
    ) throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  } catch {
    throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
  }
  for (const name of [
    "admin-v1-official-runtime-journal.json",
    "admin-v1-official-runtime-retired.json",
  ]) {
    try {
      filesystem.lstatSync(path.join(directory, name));
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw new PreImportSupervisorError("SUPERVISOR_AUTHORIZATION_INVALID");
    }
    throw new PreImportSupervisorError("OFFICIAL_AUTHORIZATION_SPENT");
  }
  return Object.freeze({ status: "ABSENT" });
}

const OFFICIAL_RECOVERY_BUDGET_LIMITS_V2 = Object.freeze({
  git_remote_mutations: 4,
  git_remote_reads: 42,
  local_temporary_commits: 1,
  local_temporary_cleanups: 1,
  provider_control_invocations: 353,
  provider_inventory_traversals: 30,
  provider_inventory_pages: 118,
  provider_direct_mutations: 15,
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
  environment_records_created: 7,
  environment_records_deleted: 7,
  runtime_sessions: 1,
  runtime_retries: 0,
  runtime_replays: 0,
  cleanup_reconciliation_requests: 2,
});

// Deliberately independent of candidate runtime imports: admission happens before
// loading the runner or resolving credentials. Match the current UUIDv8 contract.
function preImportStorageGrantId(authorization, logo) {
  const digest = createHash("sha256").update(canonicalJson({
    domain: "AIFINDER_STORAGE_CLEANUP_GRANT_ID_V1",
    operation_class: OFFICIAL_OPERATION_CLASS,
    run_id: authorization.run_id,
    bucket: authorization.execution.storage_bucket,
    object_id: logo.object_id,
    expected_version: logo.version,
  })).digest();
  digest[6] = (digest[6] & 15) | 0x80;
  digest[8] = (digest[8] & 63) | 0x80;
  const hex = digest.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function preImportStorageEffectsInvalid(state) {
  return state.recovery_storage === undefined
    ? state.effects.grant_prepare !== state.effects.grant_revoke
    : state.effects.grant_prepare > 1 || state.effects.grant_revoke > 1 ||
      state.effects.grant_prepare > state.recovery_usage.grant_prepare_rpc_calls ||
      state.effects.grant_revoke > state.recovery_usage.grant_revoke_rpc_calls;
}

function validatePreImportRecoveryDocument(record, authorization) {
  const complete = false;
  const boundedAscii = (value, maximum) => typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && /^[\x20-\x7e]+$/u.test(value);

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
      sha256(canonicalJson(OFFICIAL_RECOVERY_BUDGET_LIMITS_V2)) !== authorization.contract_sha256.budgets ||
      !exactKeys(state.recovery_usage, Object.keys(OFFICIAL_RECOVERY_BUDGET_LIMITS_V2)) ||
      !Object.entries(state.recovery_usage).every(([key, count]) => Number.isSafeInteger(count) &&
        count >= 0 && count <= OFFICIAL_RECOVERY_BUDGET_LIMITS_V2[key]) ||
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
      canonicalJson(receipt.environment_keys) !== canonicalJson(OFFICIAL_RETENTION_ENVIRONMENT_KEYS) ||
      canonicalJson(authorization.execution.environment_keys) !== canonicalJson(OFFICIAL_RETENTION_ENVIRONMENT_KEYS) ||
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
    throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
  }
  if (!complete && (!boundedAscii(state.owned.local_temp_state, 256) ||
      state.owned.remote_ref !== `refs/heads/${authorization.execution.branch_name}` ||
      state.owned.logo !== null && (!exactKeys(state.owned.logo, ["object_id", "version"]) ||
        !boundedAscii(state.owned.logo.object_id, 256) || !boundedAscii(state.owned.logo.version, 128)) ||
      preImportStorageEffectsInvalid(state) ||
      ![state.owned.submissions, state.owned.tools, state.owned.audit_rows].every((rows) =>
        rows.every((row) => exactKeys(row, ["row_id", "version"]) && boundedAscii(row.row_id, 128) && boundedAscii(row.version, 128)) &&
        new Set(rows.map((row) => row.row_id)).size === rows.length) ||
      state.owned.submissions.length > 3 || state.owned.tools.length > 2 ||
      new Set(state.cleanup).size !== state.cleanup.length ||
      state.cleanup.some((step) => !/^(DELETE_OWNED_AUDITS|DELETE_SUBMITTED_FIXTURE_[1-3]|DELETE_OWNED_TOOL_[1-2]|DELETE_STORAGE_EXACT_VERSION|STORAGE_DELETION_CONFIRMED_ABSENT|REVOKE_STORAGE_CLEANUP_GRANT|RETIRE_PROTECTED_ACCESS|DELETE_REMOTE_REF|CLEANUP_LOCAL_OWNED_TEMP_STATE)$/u.test(step)))) {
    throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
  }
  const storage = state.recovery_storage;
  if (storage !== undefined) {
    const used = state.recovery_usage;
    const deleted = state.cleanup.includes("DELETE_STORAGE_EXACT_VERSION");
    const absent = state.cleanup.includes("STORAGE_DELETION_CONFIRMED_ABSENT");
    const revoked = state.cleanup.includes("REVOKE_STORAGE_CLEANUP_GRANT");
    if (!exactKeys(storage, ["object_id", "version", "grant_id", "phase", "contract", "deletion"]) ||
        storage.contract !== "DETERMINISTIC_STORAGE_CLEANUP_V1" ||
        storage.object_id !== state.owned.logo?.object_id || storage.version !== state.owned.logo?.version ||
        storage.grant_id !== preImportStorageGrantId(authorization, state.owned.logo) ||
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
      throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
    }
  } else if (state.cleanup.includes("STORAGE_DELETION_CONFIRMED_ABSENT") ||
      state.recovery_usage.grant_prepare_rpc_calls || state.recovery_usage.grant_revoke_rpc_calls || state.recovery_usage.storage_delete_attempts) {
    throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
  }
  return Object.freeze(structuredClone(value));
}

function readPreImportRecoveryFile(target, owner, filesystem) {
  const mode = 0o600;
  const maximum_bytes = 1024 * 1024;

  const before = filesystem.lstatSync(target, { bigint: true });
  const valid = (metadata) => metadata.isFile() && !metadata.isSymbolicLink() && Number(metadata.nlink) === 1 &&
    Number(metadata.uid) === Number(owner) && (Number(metadata.mode) & 0o777) === mode &&
    Number(metadata.size) >= 1 && Number(metadata.size) <= maximum_bytes;
  const same = (left, right) => ["dev", "ino", "mode", "nlink", "uid", "gid", "size", "mtimeNs", "ctimeNs"]
    .every((key) => left[key] !== undefined && right[key] !== undefined && String(left[key]) === String(right[key]));
  if (!valid(before) || filesystem.realpathSync(target) !== target) throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
  const descriptor = filesystem.openSync(target, filesystem.constants.O_RDONLY | filesystem.constants.O_NOFOLLOW);
  try {
    const opened = filesystem.fstatSync(descriptor, { bigint: true });
    if (!valid(opened) || !same(before, opened)) throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
    const bytes = filesystem.readFileSync(descriptor);
    const after = filesystem.fstatSync(descriptor, { bigint: true });
    const named = filesystem.lstatSync(target, { bigint: true });
    if (!same(opened, after) || !same(opened, named) || bytes.byteLength !== Number(opened.size) ||
        filesystem.realpathSync(target) !== target) throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
    return bytes;
  } finally { filesystem.closeSync(descriptor); }
}

export function verifyOfficialRetentionRecoveryBeforeImport(authorization,
  filesystem = { closeSync, constants, fstatSync, openSync, lstatSync, readFileSync, realpathSync }) {
  try {
    const directory = authorization?.execution?.journal_directory;
    if (authorization?.schema_version !== 2 || authorization.operation_class !== OFFICIAL_OPERATION_CLASS ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(authorization.run_id ?? "") ||
        directory !== `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${authorization.run_id}`) throw new Error("AUTHORIZATION");
    const owner = filesystem.lstatSync(authorization.repository.root).uid;
    const root = filesystem.lstatSync(directory);
    if (!root.isDirectory() || root.isSymbolicLink() || root.uid !== owner || (root.mode & 0o777) !== 0o700 ||
        filesystem.realpathSync(directory) !== directory) throw new Error("ROOT");
    try {
      filesystem.lstatSync(path.join(directory, "admin-v1-official-runtime-retired.json"));
      throw new PreImportSupervisorError("OFFICIAL_AUTHORIZATION_SPENT");
    } catch (error) { if (error?.code !== "ENOENT") throw error; }
    const identityBytes = readPreImportRecoveryFile(path.join(directory, "admin-v1-official-runtime-identity.json"), owner, filesystem);
    const identity = { schema_version: 1, identity: { authorization_id_sha256: authorization.authorization_id_sha256, run_id: authorization.run_id } };
    if (identityBytes.toString("utf8") !== `${canonicalJson(identity)}\n`) throw new Error("IDENTITY");
    const bytes = readPreImportRecoveryFile(path.join(directory, "admin-v1-official-runtime-journal.json"), owner, filesystem);
    const document = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (bytes.toString("utf8") !== `${canonicalJson(document)}\n`) throw new Error("CANONICAL");
    validatePreImportRecoveryDocument({ retired: false, value: document }, authorization);
    return Object.freeze({ mode: "OFFICIAL_RETENTION_RECOVERY_V1", journal_sha256: sha256(bytes) });
  } catch (error) {
    if (error?.code === "OFFICIAL_AUTHORIZATION_SPENT") throw error;
    throw new PreImportSupervisorError("SUPERVISOR_RECOVERY_STATE_INVALID");
  }
}

export function verifyPreImportSupervisorTrust({
  authorization_path,
  repository_root = REPOSITORY_ROOT,
  supervisor_path = path.join(REPOSITORY_ROOT, SUPERVISOR_RELATIVE_PATH),
  policy_path = path.join(REPOSITORY_ROOT, POLICY_RELATIVE_PATH),
  now_epoch_ms = Date.now(),
  inspect_repository = inspectPreImportRepository,
  retention_recovery = false,
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
  let recoveryAdmission = null;
  if (retention_recovery) {
    if (!officialMode || authorization.schema_version !== 2) throw new PreImportSupervisorError("SUPERVISOR_MODE_DENIED");
    recoveryAdmission = verifyOfficialRetentionRecoveryBeforeImport(authorization);
  } else if (officialMode && authorization.schema_version === 2) {
    verifyOfficialRunUnspentBeforeImport(authorization);
  }
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
  const observedRepository = inspect_repository(repository_root, {
    include_remote_main: officialMode,
  });
  const expectedRepository = officialMode
    ? authorization.repository
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
    ...(recoveryAdmission ? { retention_recovery: recoveryAdmission } : {}),
    ...(officialMode
      ? { repository_observation: structuredClone(observedRepository) }
      : {}),
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
    "SUPERVISOR_RECOVERY_STATE_INVALID",
    "OFFICIAL_AUTHORIZATION_SPENT",
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
  "RETENTION_COMPLETE",
  "OFFICIAL_RUNTIME_FAILED_CLOSED",
  "OFFICIAL_SUPPORT_MISMATCH",
  "OFFICIAL_SUPERVISOR_TRUST_REQUIRED",
  "OFFICIAL_TEMPORARY_COMMIT_MISMATCH",
  "QUALIFIED",
]);

const OFFICIAL_RETENTION_RECEIPT_KEYS = Object.freeze([
  "policy", "phase", "deployment_id", "environment_record_ids", "environment_keys",
  "data_zero_residual", "external_retained_exact", "unrelated_preserved",
]);
const OFFICIAL_RETENTION_ENVIRONMENT_KEYS = Object.freeze([
  "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF",
]);

function exactRetainedRunnerOutput(value, authorization) {
  const receipt = value?.retention;
  if (authorization?.schema_version !== 2 || authorization.operation_class !== OFFICIAL_OPERATION_CLASS ||
      authorization.execution?.provider_cleanup_policy !== "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1" ||
      value.status !== "PASS" || value.qualification_requests !== 6 || value.official_requests !== 20 ||
      value.runtime_sessions !== 1 || value.runtime_retries !== 0 || value.runtime_replays !== 0 ||
      value.zero_residual_owned_state !== false || !receipt || typeof receipt !== "object" ||
      Array.isArray(receipt)) return false;
  const descriptors = Object.getOwnPropertyDescriptors(receipt);
  if (Reflect.ownKeys(descriptors).length !== OFFICIAL_RETENTION_RECEIPT_KEYS.length ||
      !OFFICIAL_RETENTION_RECEIPT_KEYS.every((key) => Object.hasOwn(descriptors, key) &&
        Object.hasOwn(descriptors[key], "value") && descriptors[key].enumerable === true)) return false;
  const ids = receipt.environment_record_ids;
  return receipt.policy === authorization.execution.provider_cleanup_policy && receipt.phase === "COMPLETE" &&
    /^dpl_[A-Za-z0-9]+$/u.test(receipt.deployment_id ?? "") && Array.isArray(ids) && ids.length === 7 &&
    ids.every((id) => typeof id === "string" && id.length > 0 && id.length <= 128 && /^[\x21-\x7e]+$/u.test(id)) &&
    new Set(ids).size === 7 && Array.isArray(receipt.environment_keys) &&
    exactObject(receipt.environment_keys, OFFICIAL_RETENTION_ENVIRONMENT_KEYS) &&
    exactObject(receipt.environment_keys, authorization.execution.environment_keys) &&
    receipt.data_zero_residual === true && receipt.external_retained_exact === true &&
    receipt.unrelated_preserved === true;
}

export function sanitizedRunnerOutput(value, authorization) {
  let code = SAFE_RUNNER_OUTPUT_CODES.has(value?.code)
    ? value.code
    : "CONCRETE_RUNNER_FAILED";
  if (code === "RETENTION_COMPLETE" && !exactRetainedRunnerOutput(value, authorization) ||
      code === "OFFICIAL_RUNTIME_COMPLETE" && authorization?.schema_version === 2) {
    code = "CONCRETE_RUNNER_FAILED";
  }
  const output = {
    status: ["QUALIFIED", "OFFICIAL_RUNTIME_COMPLETE", "RETENTION_COMPLETE"].includes(code)
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
  if (["OFFICIAL_RUNTIME_COMPLETE", "RETENTION_COMPLETE"].includes(code)) {
    output.qualification_requests = 6;
    output.official_requests = 20;
    output.runtime_sessions = 1;
    output.runtime_retries = 0;
    output.runtime_replays = 0;
    if (code === "RETENTION_COMPLETE") {
      output.zero_residual_owned_state = false;
      output.retention = structuredClone(value.retention);
    }
  }
  return output;
}

export function admitSupervisorRunnerResult(result, authorization, normalizedOutput) {
  if (authorization?.schema_version !== 2 || authorization.operation_class !== OFFICIAL_OPERATION_CLASS) {
    return result;
  }
  if (result?.exit_code === 0 && result.code === "RETENTION_COMPLETE" &&
      normalizedOutput?.code === "RETENTION_COMPLETE" &&
      exactRetainedRunnerOutput(normalizedOutput, authorization)) return result;
  if (result?.exit_code !== 1 || result?.code === "RETENTION_COMPLETE" || result?.code === "OFFICIAL_RUNTIME_COMPLETE") {
    return { exit_code: 1, code: "CONCRETE_RUNNER_FAILED" };
  }
  return result;
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
    !["--qualify-nonproduction", "--run-admin-v1-official", "--recover-admin-v1-official-retention"].includes(
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
      retention_recovery: requestedMode === "--recover-admin-v1-official-retention",
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
    let normalizedRunnerOutput = null;
    const dispatched = runner.dispatchConcreteQualificationRunner(
      argumentsList,
      runner.createConcreteRunnerDependencies({
        repositoryRoot: dependencies.repository_root,
        ...(trust.operation_class === OFFICIAL_OPERATION_CLASS
          ? {
              nowEpochMs: dependencies.now_epoch_ms,
              officialRepositoryObservation: structuredClone(
                trust.repository_observation,
              ),
              ...(dependencies.official_transport
                ? { officialTransport: dependencies.official_transport }
                : {}),
              ...(dependencies.read_credential_environment
                ? {
                    readCredentialEnvironment:
                      dependencies.read_credential_environment,
                  }
                : {}),
              ...(dependencies.resolve_credential_environment
                ? {
                    resolveCredentialEnvironment:
                      dependencies.resolve_credential_environment,
                  }
                : {}),
            }
          : {}),
        writeOutput(value) {
          const normalized = sanitizedRunnerOutput(value, trust.authorization);
          normalizedRunnerOutput = structuredClone(normalized);
          dependencies.write_output(normalized);
        },
      }),
      Object.freeze({
        verified: true,
        authorization: structuredClone(trust.authorization),
        authorization_bytes: Buffer.from(trust.authorization_bytes),
        authorization_sha256: trust.authorization_sha256,
        credential_source_policy: structuredClone(trust.credential_source_policy),
        ...(trust.retention_recovery ? { retention_recovery: structuredClone(trust.retention_recovery) } : {}),
        supervisor_sha256: trust.supervisor_sha256,
        supervisor_policy_sha256: trust.supervisor_policy_sha256,
        ...(trust.operation_class === OFFICIAL_OPERATION_CLASS
          ? {
              operation_class: OFFICIAL_OPERATION_CLASS,
              repository_observation: structuredClone(
                trust.repository_observation,
              ),
            }
          : {}),
      }),
    );
    if (trust.authorization.schema_version === 2 && trust.operation_class === OFFICIAL_OPERATION_CLASS) {
      const result = await dispatched;
      const admitted = admitSupervisorRunnerResult(result, trust.authorization, normalizedRunnerOutput);
      if (admitted !== result) dependencies.write_output({ status: "FAIL", code: admitted.code });
      return admitted;
    }
    return dispatched;
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
