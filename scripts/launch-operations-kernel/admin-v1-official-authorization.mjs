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
import { canonicalJson, isSha256 } from "./canonical.mjs";
import {
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  validateAdminV1OfficialAuthorization,
} from "./admin-v1-official-runtime.mjs";

const SHA1_PATTERN = /^[0-9a-f]{40}$/u;

export class AdminV1OfficialAuthorizationError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialAuthorizationError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function exactObservedRepository(value) {
  return exactKeys(value, [
    "root", "branch", "head", "origin_main", "remote_main", "ahead", "behind",
    "index_empty", "worktree_count", "status_sha256", "remote_repository",
  ]) &&
    path.isAbsolute(value.root) &&
    realpathSync(value.root) === value.root &&
    value.branch === "main" &&
    SHA1_PATTERN.test(value.head) &&
    value.origin_main === value.head &&
    value.remote_main === value.head &&
    value.ahead === 0 &&
    value.behind === 0 &&
    value.index_empty === true &&
    value.worktree_count === 1 &&
    isSha256(value.status_sha256) &&
    value.remote_repository === "jcdumaua/aifinder";
}

function exactReviewedPolicy(value, repositoryRoot) {
  const official = value?.official_runtime;
  const contract = official?.repository_contract;
  return value?.candidate &&
    isSha256(value.candidate.candidate_identity_sha256) &&
    isSha256(value.candidate.manifest_sha256) &&
    value.compatibility_support_sha256 &&
    Object.values(value.compatibility_support_sha256).every(isSha256) &&
    official?.operation_class === ADMIN_V1_OFFICIAL_OPERATION_CLASS &&
    isSha256(official.authorization_schema_sha256) &&
    Object.values(official.route_source_sha256 ?? {}).every(isSha256) &&
    Object.values(official.contract_sha256 ?? {}).every(isSha256) &&
    contract?.root === repositoryRoot &&
    contract.branch === "main" &&
    contract.remote_repository === "jcdumaua/aifinder" &&
    contract.head_binding === "AUTHORIZATION_PUBLISHED_HEAD" &&
    contract.origin_main_binding === "SAME_AS_HEAD" &&
    contract.remote_main_binding === "SAME_AS_HEAD" &&
    contract.status_binding === "AUTHORIZATION_STATUS_SHA256";
}

export async function createAdminV1OfficialAuthorizationRecord({
  inspect_repository,
  inspect_temporary_commit,
  reviewed_policy,
  request,
  now_epoch_ms,
}) {
  if (
    typeof inspect_repository !== "function" ||
    typeof inspect_temporary_commit !== "function" ||
    !Number.isSafeInteger(now_epoch_ms)
  ) throw new AdminV1OfficialAuthorizationError("OFFICIAL_AUTHORIZATION_GENERATOR_INPUT");
  const repository = await inspect_repository();
  if (
    !exactObservedRepository(repository) ||
    !exactReviewedPolicy(reviewed_policy, repository.root) ||
    request?.published_head !== repository.head
  ) throw new AdminV1OfficialAuthorizationError(
    "OFFICIAL_AUTHORIZATION_GENERATOR_REPOSITORY_MISMATCH",
  );
  const temporaryCommit = await inspect_temporary_commit(
    request?.execution?.temporary_commit_sha,
  );
  if (
    temporaryCommit?.commit_sha !== request?.execution?.temporary_commit_sha ||
    temporaryCommit?.parent_sha !== repository.head ||
    !SHA1_PATTERN.test(temporaryCommit?.tree_sha ?? "")
  ) throw new AdminV1OfficialAuthorizationError(
    "OFFICIAL_AUTHORIZATION_GENERATOR_TEMPORARY_COMMIT_MISMATCH",
  );
  const record = {
    schema_version: 1,
    operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
    authorization_id_sha256: request.authorization_id_sha256,
    one_use_authorization_sha256: request.one_use_authorization_sha256,
    review_approval_sha256: request.review_approval_sha256,
    candidate_identity_sha256:
      reviewed_policy.candidate.candidate_identity_sha256,
    manifest_sha256: reviewed_policy.candidate.manifest_sha256,
    supervisor_sha256: request.supervisor_sha256,
    supervisor_policy_sha256: request.supervisor_policy_sha256,
    authorization_schema_sha256:
      reviewed_policy.official_runtime.authorization_schema_sha256,
    compatibility_support_sha256: structuredClone(
      reviewed_policy.compatibility_support_sha256,
    ),
    route_source_sha256: structuredClone(
      reviewed_policy.official_runtime.route_source_sha256,
    ),
    contract_sha256: structuredClone(
      reviewed_policy.official_runtime.contract_sha256,
    ),
    created_at: request.created_at,
    expires_at: request.expires_at,
    run_id: request.run_id,
    repository: structuredClone(repository),
    execution: structuredClone(request.execution),
  };
  return validateAdminV1OfficialAuthorization(record, { now_epoch_ms });
}

export function writeAdminV1OfficialAuthorizationRecord({ file_path, record }) {
  if (
    typeof file_path !== "string" ||
    !path.isAbsolute(file_path) ||
    !file_path.startsWith("/Users/jamescarlodumaua/Downloads/") ||
    !file_path.endsWith(".json") ||
    file_path.includes("\0") ||
    file_path.split(path.sep).includes("..")
  ) throw new AdminV1OfficialAuthorizationError(
    "OFFICIAL_AUTHORIZATION_GENERATOR_OUTPUT_PATH",
  );
  const bytes = Buffer.from(`${canonicalJson(record)}\n`, "utf8");
  let descriptor;
  try {
    descriptor = openSync(
      file_path,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } catch {
    throw new AdminV1OfficialAuthorizationError(
      "OFFICIAL_AUTHORIZATION_GENERATOR_WRITE_FAILED",
    );
  } finally {
    bytes.fill(0);
    if (descriptor !== undefined) closeSync(descriptor);
  }
  const metadata = lstatSync(file_path);
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o600 || realpathSync(file_path) !== file_path
  ) throw new AdminV1OfficialAuthorizationError(
    "OFFICIAL_AUTHORIZATION_GENERATOR_OUTPUT_IDENTITY",
  );
  return Object.freeze({ path: file_path, bytes: metadata.size, mode: "0600" });
}
