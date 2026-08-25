import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";
import {
  validateAdminV1OfficialFirstEnvironmentAuthorization,
} from "./admin-v1-official-first-environment-runtime.mjs";

const OPERATION_CLASS =
  "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREATE_ONLY_RUNTIME_V1";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA1_PATTERN = /^[0-9a-f]{40}$/u;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]+$/u;
const REQUEST_KEYS = Object.freeze([
  "authorization_mode",
  "phase_identity",
  "reviewed_package_sha256",
  "reviewed_package_bytes",
  "gemini_approval_token_sha256",
  "direct_james_approval_sha256",
  "authorization_id",
  "run_id",
  "created_at",
  "expires_at",
  "candidate_identity_sha256",
  "manifest_sha256",
  "candidate_member_count",
  "runtime_source_sha256",
  "supervisor_source_sha256",
  "transport_source_sha256",
  "transport_dependency_source_sha256",
  "authorization_schema_sha256",
  "materializer_source_sha256",
  "credential_loader_source_sha256",
  "supervisor_policy_sha256",
  "independent_semantic_pin_set_sha256",
  "repository",
  "deployment",
]);
const REPOSITORY_KEYS = Object.freeze([
  "root", "branch", "head", "tree", "origin_main", "remote_main", "ahead",
  "behind", "index_empty", "worktree_count", "status_sha256",
  "remote_repository",
]);
const DEPLOYMENT_KEYS = Object.freeze([
  "deployment_id", "project_id", "team_id", "deployed_commit", "branch",
  "target", "source", "state",
]);

export class AdminV1OfficialFirstEnvironmentMaterializerError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentMaterializerError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right, "en")
  );
  const wanted = [...expected].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function validTimestamp(value) {
  const epoch = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value
    ? epoch
    : null;
}

function digest(domain, value) {
  return sha256Hex(canonicalJson({ domain, value }));
}

function invalidInput() {
  throw new AdminV1OfficialFirstEnvironmentMaterializerError(
    "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
  );
}

function validateRequest(request, nowEpochMs, allowLive) {
  const created = validTimestamp(request?.created_at);
  const expires = validTimestamp(request?.expires_at);
  const repository = request?.repository;
  const deployment = request?.deployment;
  if (
    !Number.isSafeInteger(nowEpochMs) ||
    !exactKeys(request, REQUEST_KEYS) ||
    !["HERMETIC_TEST_ONLY", "LIVE"].includes(request.authorization_mode) ||
    (request.authorization_mode === "LIVE" && allowLive !== true) ||
    typeof request.phase_identity !== "string" ||
    !/^ADMIN_V1_[A-Z0-9_]+$/u.test(request.phase_identity) ||
    !Number.isSafeInteger(request.reviewed_package_bytes) ||
    request.reviewed_package_bytes < 1 ||
    !Number.isSafeInteger(request.candidate_member_count) ||
    request.candidate_member_count < 1 ||
    !UUID_PATTERN.test(request.authorization_id ?? "") ||
    !UUID_PATTERN.test(request.run_id ?? "") ||
    created === null || expires === null || created >= expires ||
    nowEpochMs < created || nowEpochMs >= expires ||
    expires - created > 24 * 60 * 60 * 1000 ||
    ![
      request.reviewed_package_sha256,
      request.gemini_approval_token_sha256,
      request.direct_james_approval_sha256,
      request.candidate_identity_sha256,
      request.manifest_sha256,
      request.runtime_source_sha256,
      request.supervisor_source_sha256,
      request.transport_source_sha256,
      request.transport_dependency_source_sha256,
      request.authorization_schema_sha256,
      request.materializer_source_sha256,
      request.credential_loader_source_sha256,
      request.supervisor_policy_sha256,
      request.independent_semantic_pin_set_sha256,
    ].every(isSha256) ||
    !exactKeys(repository, REPOSITORY_KEYS) ||
    repository.root !== "/Users/jamescarlodumaua/aifinder" ||
    repository.branch !== "main" ||
    !SHA1_PATTERN.test(repository.head ?? "") ||
    !SHA1_PATTERN.test(repository.tree ?? "") ||
    repository.origin_main !== repository.head ||
    repository.remote_main !== repository.head ||
    repository.ahead !== 0 || repository.behind !== 0 ||
    repository.index_empty !== true || repository.worktree_count !== 1 ||
    !isSha256(repository.status_sha256) ||
    repository.remote_repository !== "jcdumaua/aifinder" ||
    !exactKeys(deployment, DEPLOYMENT_KEYS) ||
    !DEPLOYMENT_ID_PATTERN.test(deployment.deployment_id ?? "") ||
    deployment.project_id !== "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" ||
    deployment.team_id !== "team_9POJYxNnjIBbrQ19My8M5yG3" ||
    deployment.deployed_commit !== repository.head ||
    deployment.branch !== "main" || deployment.target !== "production" ||
    deployment.source !== "git/github" || deployment.state !== "READY"
  ) invalidInput();
  return { created, expires };
}

export function createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
  request,
  now_epoch_ms = Date.now(),
  allow_live = false,
}) {
  validateRequest(request, now_epoch_ms, allow_live);
  const authorizationClosure = {
    authorization_mode: request.authorization_mode,
    phase_identity: request.phase_identity,
    reviewed_package_sha256: request.reviewed_package_sha256,
    reviewed_package_bytes: request.reviewed_package_bytes,
    authorization_id: request.authorization_id,
    gemini_approval_token_sha256: request.gemini_approval_token_sha256,
    direct_james_approval_sha256: request.direct_james_approval_sha256,
    candidate_member_count: request.candidate_member_count,
    repository_tree: request.repository.tree,
    materializer_source_sha256: request.materializer_source_sha256,
    credential_loader_source_sha256: request.credential_loader_source_sha256,
    supervisor_policy_sha256: request.supervisor_policy_sha256,
    independent_semantic_pin_set_sha256:
      request.independent_semantic_pin_set_sha256,
    transport_dependency_source_sha256:
      request.transport_dependency_source_sha256,
    deployment: structuredClone(request.deployment),
    credential_sources: {
      environment_value: {
        key_name: "ADMIN_PASSWORD",
        source_name: "PROCESS_ENV_EXACT_KEY",
      },
      provider_auth: {
        key_name: "token",
        source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
      },
    },
    capability_budget: {
      credential_value_reads: 2,
      environment_creates: 1,
      environment_deletes: 1,
      environment_identity_reads: 1,
      full_official_ledger: 0,
      git_writes: 0,
      replays: 0,
      retries: 0,
      second_invocations: 0,
      storage_rpc_actions: 0,
      supabase_reads: 0,
      supabase_writes: 0,
    },
    contracts: {
      authorization_spend_boundary: "PROCESS_START",
      cleanup: "EXACT_OWNED_ENVIRONMENT_ONLY",
      journal: "DURABLE_FAIL_CLOSED",
      recovery: "RECOVERY_PENDING_WHEN_OWNERSHIP_OR_CLEANUP_UNPROVEN",
    },
  };
  const authorizationIdSha256 = digest(
    "AIFINDER_FIRST_ENVIRONMENT_AUTHORIZATION_ID_V1",
    { authorization_id: request.authorization_id, run_id: request.run_id },
  );
  const reviewApprovalSha256 = digest(
    "AIFINDER_FIRST_ENVIRONMENT_REVIEW_APPROVAL_V1",
    {
      phase_identity: request.phase_identity,
      reviewed_package_sha256: request.reviewed_package_sha256,
      reviewed_package_bytes: request.reviewed_package_bytes,
      gemini_approval_token_sha256: request.gemini_approval_token_sha256,
      direct_james_approval_sha256: request.direct_james_approval_sha256,
    },
  );
  const oneUseAuthorizationSha256 = digest(
    "AIFINDER_FIRST_ENVIRONMENT_ONE_USE_AUTHORIZATION_V1",
    {
      authorization_id_sha256: authorizationIdSha256,
      review_approval_sha256: reviewApprovalSha256,
      run_id: request.run_id,
      created_at: request.created_at,
      expires_at: request.expires_at,
      candidate_identity_sha256: request.candidate_identity_sha256,
      manifest_sha256: request.manifest_sha256,
      repository: request.repository,
      authorization_closure: authorizationClosure,
    },
  );
  const record = {
    schema_version: 1,
    operation_class: OPERATION_CLASS,
    authorization_id_sha256: authorizationIdSha256,
    one_use_authorization_sha256: oneUseAuthorizationSha256,
    review_approval_sha256: reviewApprovalSha256,
    candidate_identity_sha256: request.candidate_identity_sha256,
    manifest_sha256: request.manifest_sha256,
    runtime_source_sha256: request.runtime_source_sha256,
    supervisor_source_sha256: request.supervisor_source_sha256,
    transport_source_sha256: request.transport_source_sha256,
    authorization_schema_sha256: request.authorization_schema_sha256,
    created_at: request.created_at,
    expires_at: request.expires_at,
    run_id: request.run_id,
    repository: structuredClone(request.repository),
    execution: {
      journal_directory:
        "/Users/jamescarlodumaua/Downloads/" +
        `AiFinder-Admin-V1-Official-First-Environment-${request.run_id}`,
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      environment_git_branch: "main",
      environment_key: "ADMIN_PASSWORD",
      credential_source_name: "PROCESS_ENV_EXACT_KEY",
      credential_source_contract: "DIRECT_PROPERTY_ACCESS_NO_ENUMERATION",
    },
    authorization_closure: authorizationClosure,
  };
  return validateAdminV1OfficialFirstEnvironmentAuthorization(record, {
    now_epoch_ms,
    allow_hermetic_test: request.authorization_mode === "HERMETIC_TEST_ONLY",
  });
}

export function writeAdminV1OfficialFirstEnvironmentAuthorizationRecord({
  directory,
  record,
}) {
  try {
    validateAdminV1OfficialFirstEnvironmentAuthorization(record, {
      now_epoch_ms: Date.parse(record?.created_at),
      allow_hermetic_test:
        record?.authorization_closure?.authorization_mode ===
          "HERMETIC_TEST_ONLY",
    });
  } catch {
    invalidInput();
  }
  let canonicalDirectory;
  try {
    if (
      typeof directory !== "string" || !path.isAbsolute(directory) ||
      directory.includes("\0") || directory.split(path.sep).includes("..") ||
      realpathSync(directory) !== directory
    ) throw new Error("PATH");
    const metadata = lstatSync(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error("IDENTITY");
    }
    canonicalDirectory = directory;
  } catch {
    throw new AdminV1OfficialFirstEnvironmentMaterializerError(
      "FIRST_ENVIRONMENT_MATERIALIZER_OUTPUT_PATH",
    );
  }
  const authorizationId = record?.authorization_closure?.authorization_id;
  if (!UUID_PATTERN.test(authorizationId ?? "")) invalidInput();
  const filePath = path.join(
    canonicalDirectory,
    `authorization-${authorizationId}.json`,
  );
  const bytes = Buffer.from(`${canonicalJson(record)}\n`, "utf8");
  const outputSha256 = sha256Hex(bytes);
  let descriptor;
  try {
    descriptor = openSync(
      filePath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } catch {
    throw new AdminV1OfficialFirstEnvironmentMaterializerError(
      "FIRST_ENVIRONMENT_MATERIALIZER_WRITE_FAILED",
    );
  } finally {
    bytes.fill(0);
    if (descriptor !== undefined) closeSync(descriptor);
  }
  const metadata = lstatSync(filePath);
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o600 || realpathSync(filePath) !== filePath
  ) {
    throw new AdminV1OfficialFirstEnvironmentMaterializerError(
      "FIRST_ENVIRONMENT_MATERIALIZER_OUTPUT_IDENTITY",
    );
  }
  return Object.freeze({
    path: filePath,
    bytes: metadata.size,
    mode: "0600",
    sha256: outputSha256,
  });
}
