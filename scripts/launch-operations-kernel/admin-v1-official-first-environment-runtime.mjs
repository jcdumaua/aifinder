import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS =
  "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_TRUE_CREATE_ONLY_RUNTIME_V1";

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET =
  Object.freeze({
    environment_creates: 1,
    environment_identity_reads: 0,
    environment_updates: 0,
    environment_deletes: 0,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    git_remote_mutations: 0,
    database_supabase_reads: 0,
    database_supabase_writes: 0,
    storage_rpc_operations: 0,
    full_official_ledger_executions: 0,
  });

const AUTHORIZATION_KEYS = Object.freeze([
  "schema_version",
  "operation_class",
  "authorization_id_sha256",
  "one_use_authorization_sha256",
  "review_approval_sha256",
  "candidate_identity_sha256",
  "manifest_sha256",
  "runtime_source_sha256",
  "supervisor_source_sha256",
  "transport_source_sha256",
  "authorization_schema_sha256",
  "created_at",
  "expires_at",
  "run_id",
  "repository",
  "execution",
  "authorization_closure",
]);
const REPOSITORY_KEYS = Object.freeze([
  "root",
  "branch",
  "head",
  "tree",
  "origin_main",
  "remote_main",
  "ahead",
  "behind",
  "index_empty",
  "worktree_count",
  "status_sha256",
  "remote_repository",
]);
const AUTHORIZATION_CLOSURE_KEYS = Object.freeze([
  "authorization_mode",
  "phase_identity",
  "reviewed_package_sha256",
  "reviewed_package_bytes",
  "authorization_id",
  "gemini_approval_token_sha256",
  "direct_james_approval_sha256",
  "candidate_member_count",
  "repository_tree",
  "materializer_source_sha256",
  "credential_loader_source_sha256",
  "supervisor_policy_sha256",
  "independent_semantic_pin_set_sha256",
  "transport_dependency_source_sha256",
  "deployment",
  "credential_sources",
  "capability_budget",
  "contracts",
]);
const DEPLOYMENT_KEYS = Object.freeze([
  "deployment_id", "project_id", "team_id", "deployed_commit", "branch",
  "target", "source", "state",
]);
const EXECUTION_KEYS = Object.freeze([
  "journal_directory",
  "preview_project_id",
  "preview_project_name",
  "preview_team_id",
  "preview_team_slug",
  "environment_git_branch",
  "environment_key",
  "credential_source_name",
  "credential_source_contract",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA1_PATTERN = /^[0-9a-f]{40}$/u;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]+$/u;
const CREATE_FAILURE_CLASSIFICATIONS = new Set([
  "FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT",
  "FAIL_PROVIDER_AUTHENTICATION_UNAVAILABLE",
  "FAIL_PROVIDER_PERMISSION_DENIED",
  "FAIL_INVALID_CREATE_REQUEST",
  "FAIL_PROVIDER_RATE_LIMITED",
  "FAIL_PROVIDER_FAILURE",
  "FAIL_CREATE_TRANSPORT",
  "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE",
]);
const HTTP_STATUS_CLASSES = new Set(["2XX", "4XX", "5XX", "OTHER"]);
const DISPOSITION_EVIDENCE_KEYS = Object.freeze([
  "authorization_sha256",
  "active_journal_sha256",
  "identity_journal_sha256",
  "first_reconciliation_ccr_sha256",
  "second_reconciliation_ccr_sha256",
  "cumulative_classification",
  "first_observed_at",
  "second_observed_at",
  "observations",
  "processes",
  "credential_reads",
  "provider_gets",
  "exact_matches",
  "mutations",
]);
const AMBIGUOUS_DISPOSITION_STATE_KEYS = Object.freeze([
  "lifecycle",
  "stage",
  "token_spent",
  "runtime_sessions",
  "runtime_retries",
  "runtime_replays",
  "terminal_classification",
  "resource_state",
  "owned_environment_record_id",
  "failure",
  "expected_residual",
  "zero_residual",
  "provider_creates",
  "provider_reads",
  "provider_updates",
  "provider_deletes",
]);

export class AdminV1OfficialFirstEnvironmentRuntimeError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentRuntimeError";
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

function boundedAscii(value, maximum = 512) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= maximum && /^[\x20-\x7e]+$/u.test(value);
}

function exactTimestamp(value) {
  if (typeof value !== "string") return null;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value
    ? epoch
    : null;
}

function exactSpentAmbiguousDispositionState(state) {
  const failure = state?.failure;
  return exactKeys(state, AMBIGUOUS_DISPOSITION_STATE_KEYS) &&
    state.lifecycle === "ACTIVE_UNKNOWN_STATE" &&
    state.stage === "AMBIGUOUS_POST_SPEND_RESULT" &&
    state.token_spent === true && state.runtime_sessions === 1 &&
    state.runtime_retries === 0 && state.runtime_replays === 0 &&
    state.terminal_classification ===
      "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE" &&
    state.resource_state === "UNKNOWN_OR_AMBIGUOUS_PROVIDER_STATE" &&
    state.owned_environment_record_id === null &&
    state.expected_residual === false && state.zero_residual === false &&
    state.provider_creates === 0 && state.provider_reads === 0 &&
    state.provider_updates === 0 && state.provider_deletes === 0 &&
    exactKeys(failure, [
      "operation",
      "stage",
      "classification",
      "provider_code",
      "http_status_class",
      "provider",
      "retry_allowed",
    ]) &&
    failure.operation === "create_environment" &&
    failure.stage === "EXECUTION" &&
    failure.classification ===
      "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE" &&
    (failure.provider_code === null || boundedAscii(failure.provider_code, 128)) &&
    (failure.http_status_class === null ||
      HTTP_STATUS_CLASSES.has(failure.http_status_class)) &&
    failure.provider === "VERCEL" && failure.retry_allowed === false;
}

function exactTwoZeroObservationEvidence(
  evidence,
  { activeJournalSha256, identityJournalSha256 },
) {
  if (!exactKeys(evidence, DISPOSITION_EVIDENCE_KEYS)) return false;
  const firstObserved = exactTimestamp(evidence.first_observed_at);
  const secondObserved = exactTimestamp(evidence.second_observed_at);
  const hashes = [
    evidence.authorization_sha256,
    evidence.active_journal_sha256,
    evidence.identity_journal_sha256,
    evidence.first_reconciliation_ccr_sha256,
    evidence.second_reconciliation_ccr_sha256,
  ];
  return hashes.every(isSha256) && new Set(hashes).size === hashes.length &&
    evidence.active_journal_sha256 === activeJournalSha256 &&
    evidence.identity_journal_sha256 === identityJournalSha256 &&
    evidence.cumulative_classification ===
      "RECONCILED_TWO_TIME_SEPARATED_ZERO_MATCH_OBSERVATIONS" &&
    firstObserved !== null && secondObserved !== null &&
    secondObserved > firstObserved && secondObserved - firstObserved >= 300_000 &&
    evidence.observations === 2 && evidence.processes === 2 &&
    evidence.credential_reads === 2 && evidence.provider_gets === 2 &&
    evidence.exact_matches === 0 && evidence.mutations === 0;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function validateAdminV1OfficialFirstEnvironmentAuthorization(
  record,
  { now_epoch_ms = Date.now(), allow_hermetic_test = false } = {},
) {
  let value;
  try {
    value = structuredClone(record);
  } catch {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
    );
  }
  const created = exactTimestamp(value?.created_at);
  const expires = exactTimestamp(value?.expires_at);
  const repository = value?.repository;
  const execution = value?.execution;
  const closure = value?.authorization_closure;
  const deployment = closure?.deployment;
  const sources = closure?.credential_sources;
  const budget = closure?.capability_budget;
  const contracts = closure?.contracts;
  let authorizationIdSha256 = null;
  let reviewApprovalSha256 = null;
  let oneUseAuthorizationSha256 = null;
  try {
    authorizationIdSha256 = sha256Hex(canonicalJson({
      domain: "AIFINDER_FIRST_ENVIRONMENT_AUTHORIZATION_ID_V1",
      value: {
        authorization_id: closure?.authorization_id,
        run_id: value?.run_id,
      },
    }));
    reviewApprovalSha256 = sha256Hex(canonicalJson({
      domain: "AIFINDER_FIRST_ENVIRONMENT_REVIEW_APPROVAL_V1",
      value: {
        phase_identity: closure?.phase_identity,
        reviewed_package_sha256: closure?.reviewed_package_sha256,
        reviewed_package_bytes: closure?.reviewed_package_bytes,
        gemini_approval_token_sha256: closure?.gemini_approval_token_sha256,
        direct_james_approval_sha256: closure?.direct_james_approval_sha256,
      },
    }));
    oneUseAuthorizationSha256 = sha256Hex(canonicalJson({
      domain: "AIFINDER_FIRST_ENVIRONMENT_ONE_USE_AUTHORIZATION_V1",
      value: {
        authorization_id_sha256: authorizationIdSha256,
        review_approval_sha256: reviewApprovalSha256,
        run_id: value?.run_id,
        created_at: value?.created_at,
        expires_at: value?.expires_at,
        candidate_identity_sha256: value?.candidate_identity_sha256,
        manifest_sha256: value?.manifest_sha256,
        repository,
        authorization_closure: closure,
      },
    }));
  } catch {
    // The single validation error below is the fail-closed public surface.
  }
  if (
    !Number.isSafeInteger(now_epoch_ms) ||
    !exactKeys(value, AUTHORIZATION_KEYS) ||
    value.schema_version !== 1 ||
    value.operation_class !==
      ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS ||
    value.authorization_id_sha256 !== authorizationIdSha256 ||
    value.review_approval_sha256 !== reviewApprovalSha256 ||
    value.one_use_authorization_sha256 !== oneUseAuthorizationSha256 ||
    ![
      value.authorization_id_sha256,
      value.one_use_authorization_sha256,
      value.review_approval_sha256,
      value.candidate_identity_sha256,
      value.manifest_sha256,
      value.runtime_source_sha256,
      value.supervisor_source_sha256,
      value.transport_source_sha256,
      value.authorization_schema_sha256,
    ].every(isSha256) ||
    created === null || expires === null || created >= expires ||
    now_epoch_ms < created || now_epoch_ms >= expires ||
    expires - created > 24 * 60 * 60 * 1000 ||
    !UUID_PATTERN.test(value.run_id ?? "") ||
    !exactKeys(repository, REPOSITORY_KEYS) ||
    !path.isAbsolute(repository.root) ||
    realpathSync(repository.root) !== repository.root ||
    repository.branch !== "main" ||
    !SHA1_PATTERN.test(repository.head ?? "") ||
    !SHA1_PATTERN.test(repository.tree ?? "") ||
    repository.origin_main !== repository.head ||
    repository.remote_main !== repository.head ||
    repository.ahead !== 0 || repository.behind !== 0 ||
    repository.index_empty !== true || repository.worktree_count !== 1 ||
    !isSha256(repository.status_sha256) ||
    repository.remote_repository !== "jcdumaua/aifinder" ||
    !exactKeys(execution, EXECUTION_KEYS) ||
    execution.journal_directory !==
      `/Users/jamescarlodumaua/Downloads/` +
        `AiFinder-Admin-V1-Official-First-Environment-${value.run_id}` ||
    execution.preview_project_id !== "prj_BPaQVKdElriAhxabhoTkg8LysQ5R" ||
    execution.preview_project_name !== "aifinder" ||
    execution.preview_team_id !== "team_9POJYxNnjIBbrQ19My8M5yG3" ||
    execution.preview_team_slug !== "ai-finder-s-projects" ||
    execution.environment_git_branch !== "main" ||
    execution.environment_key !== "ADMIN_PASSWORD" ||
    execution.credential_source_name !== "PROCESS_ENV_EXACT_KEY" ||
    execution.credential_source_contract !== "DIRECT_PROPERTY_ACCESS_NO_ENUMERATION" ||
    !exactKeys(closure, AUTHORIZATION_CLOSURE_KEYS) ||
    !["LIVE", "HERMETIC_TEST_ONLY"].includes(closure.authorization_mode) ||
    (closure.authorization_mode === "HERMETIC_TEST_ONLY" &&
      allow_hermetic_test !== true) ||
    !/^ADMIN_V1_[A-Z0-9_]+$/u.test(closure.phase_identity ?? "") ||
    !isSha256(closure.reviewed_package_sha256) ||
    !Number.isSafeInteger(closure.reviewed_package_bytes) ||
    closure.reviewed_package_bytes < 1 ||
    !UUID_PATTERN.test(closure.authorization_id ?? "") ||
    !isSha256(closure.gemini_approval_token_sha256) ||
    !isSha256(closure.direct_james_approval_sha256) ||
    !Number.isSafeInteger(closure.candidate_member_count) ||
    closure.candidate_member_count < 1 ||
    closure.repository_tree !== repository.tree ||
    ![
      closure.materializer_source_sha256,
      closure.credential_loader_source_sha256,
      closure.supervisor_policy_sha256,
      closure.independent_semantic_pin_set_sha256,
      closure.transport_dependency_source_sha256,
    ].every(isSha256) ||
    !exactKeys(deployment, DEPLOYMENT_KEYS) ||
    !DEPLOYMENT_ID_PATTERN.test(deployment.deployment_id ?? "") ||
    deployment.project_id !== execution.preview_project_id ||
    deployment.team_id !== execution.preview_team_id ||
    deployment.deployed_commit !== repository.head ||
    deployment.branch !== "main" || deployment.target !== "production" ||
    deployment.source !== "git/github" || deployment.state !== "READY" ||
    !exactKeys(sources, ["environment_value", "provider_auth"]) ||
    !exactKeys(sources.environment_value, ["key_name", "source_name"]) ||
    sources.environment_value.key_name !== "ADMIN_PASSWORD" ||
    sources.environment_value.source_name !== "PROCESS_ENV_EXACT_KEY" ||
    !exactKeys(sources.provider_auth, ["key_name", "source_name"]) ||
    sources.provider_auth.key_name !== "token" ||
    sources.provider_auth.source_name !==
      "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE" ||
    !exactKeys(budget, [
      "credential_value_reads", "environment_creates", "environment_deletes",
      "environment_identity_reads", "environment_updates",
      "full_official_ledger", "git_writes",
      "replays", "retries", "second_invocations", "storage_rpc_actions",
      "supabase_reads", "supabase_writes",
    ]) ||
    canonicalJson(budget) !== canonicalJson({
      credential_value_reads: 2,
      environment_creates: 1,
      environment_deletes: 0,
      environment_identity_reads: 0,
      environment_updates: 0,
      full_official_ledger: 0,
      git_writes: 0,
      replays: 0,
      retries: 0,
      second_invocations: 0,
      storage_rpc_actions: 0,
      supabase_reads: 0,
      supabase_writes: 0,
    }) ||
    !exactKeys(contracts, [
      "authorization_spend_boundary", "journal", "recovery",
      "successful_create_residue",
    ]) ||
    contracts.authorization_spend_boundary !==
      "IMMEDIATELY_BEFORE_FIRST_PROVIDER_CREATE_REQUEST" ||
    contracts.journal !== "DURABLE_FAIL_CLOSED" ||
    contracts.recovery !==
      "ACTIVE_UNKNOWN_STATE_ON_AMBIGUOUS_POST_SPEND_RESULT" ||
    contracts.successful_create_residue !== "EXPECTED_OWNED_RESOURCE"
  ) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
    );
  }
  return deepFreeze(value);
}

function exactJournalDirectory(directory) {
  if (
    typeof directory !== "string" || !path.isAbsolute(directory) ||
    directory.includes("\0") || directory.split(path.sep).includes("..")
  ) return false;
  const canonicalCandidate = existsSync(directory)
    ? realpathSync(directory)
    : directory;
  const temporaryPrefix = path.join(
    realpathSync(tmpdir()),
    "aifinder-admin-v1-official-first-environment-",
  );
  return canonicalCandidate.startsWith(temporaryPrefix) ||
    canonicalCandidate.startsWith(
      "/Users/jamescarlodumaua/Downloads/" +
        "AiFinder-Admin-V1-Official-First-Environment-",
    );
}

function regularIdentity(filePath, mode) {
  const metadata = lstatSync(filePath);
  return metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1 &&
    (metadata.mode & 0o777) === mode && realpathSync(filePath) === filePath;
}

function strictJournalObject(filePath) {
  if (!regularIdentity(filePath, 0o600)) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_IDENTITY",
    );
  }
  const bytes = readFileSync(filePath);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value = JSON.parse(text);
    if (text !== `${canonicalJson(value)}\n`) throw new Error("CANONICAL");
    return { value, sha256: sha256Hex(bytes) };
  } catch {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_INVALID",
    );
  } finally {
    bytes.fill(0);
  }
}

function fsyncPath(filePath, flags = constants.O_RDONLY) {
  const descriptor = openSync(filePath, flags);
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function sanitizedJournalState(value) {
  let serialized;
  try {
    serialized = canonicalJson(value);
  } catch {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_INVALID",
    );
  }
  const forbidden = [
    "password",
    "environment_value",
    "authorization_header",
    "raw_headers",
    "raw_body",
    "raw_child",
    "provider_output",
    "cookie",
    "token_value",
    "secret",
  ];
  if (forbidden.some((entry) => serialized.toLowerCase().includes(entry))) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_EVIDENCE_SENSITIVE",
    );
  }
  return serialized;
}

export function createAdminV1OfficialFirstEnvironmentJournal({
  directory,
  identity,
}) {
  if (
    !exactJournalDirectory(directory) ||
    !exactKeys(identity, ["authorization_id_sha256", "run_id"]) ||
    !isSha256(identity.authorization_id_sha256) ||
    !UUID_PATTERN.test(identity.run_id ?? "")
  ) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_INPUT",
    );
  }
  if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
  const directoryIdentity = lstatSync(directory);
  const canonicalDirectory = realpathSync(directory);
  if (
    !directoryIdentity.isDirectory() || directoryIdentity.isSymbolicLink() ||
    (directoryIdentity.mode & 0o777) !== 0o700
  ) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_IDENTITY",
    );
  }
  const activePath = path.join(
    canonicalDirectory,
    "admin-v1-official-first-environment-runtime-journal.json",
  );
  const retiredPath = path.join(
    canonicalDirectory,
    "admin-v1-official-first-environment-runtime-retired.json",
  );
  const identityPath = path.join(
    canonicalDirectory,
    "admin-v1-official-first-environment-runtime-identity.json",
  );
  const exactIdentity = Object.freeze(structuredClone(identity));
  const identityDocument = {
    schema_version: 1,
    identity: structuredClone(exactIdentity),
  };
  let sequence = 0;
  if (!existsSync(identityPath)) {
    writeFileSync(identityPath, `${canonicalJson(identityDocument)}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    fsyncPath(identityPath);
    fsyncPath(canonicalDirectory);
  }
  const persistedIdentity = strictJournalObject(identityPath);
  if (canonicalJson(persistedIdentity.value) !== canonicalJson(identityDocument)) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_JOURNAL_IDENTITY",
    );
  }

  const load = () => {
    if (existsSync(retiredPath)) {
      const retired = strictJournalObject(retiredPath);
      if (canonicalJson(retired.value.identity) !== canonicalJson(exactIdentity)) {
        throw new AdminV1OfficialFirstEnvironmentRuntimeError(
          "FIRST_ENVIRONMENT_JOURNAL_IDENTITY",
        );
      }
      sequence = Math.max(sequence, retired.value.sequence ?? 0);
      return { ...retired, retired: true };
    }
    if (!existsSync(activePath)) return null;
    const active = strictJournalObject(activePath);
    if (canonicalJson(active.value.identity) !== canonicalJson(exactIdentity)) {
      throw new AdminV1OfficialFirstEnvironmentRuntimeError(
        "FIRST_ENVIRONMENT_JOURNAL_IDENTITY",
      );
    }
    sequence = Math.max(sequence, active.value.sequence ?? 0);
    return { ...active, retired: false };
  };

  const persistTo = (targetPath, state) => {
    sequence += 1;
    const document = {
      schema_version: 1,
      identity: structuredClone(exactIdentity),
      sequence,
      state: structuredClone(state),
    };
    const text = `${sanitizedJournalState(document)}\n`;
    const temporaryPath = path.join(
      canonicalDirectory,
      `.admin-v1-official-first-environment-${sequence}.tmp`,
    );
    writeFileSync(temporaryPath, text, { flag: "wx", mode: 0o600 });
    fsyncPath(temporaryPath);
    renameSync(temporaryPath, targetPath);
    fsyncPath(canonicalDirectory);
    const readback = strictJournalObject(targetPath);
    if (canonicalJson(readback.value) !== canonicalJson(document)) {
      throw new AdminV1OfficialFirstEnvironmentRuntimeError(
        "FIRST_ENVIRONMENT_JOURNAL_READBACK",
      );
    }
    return readback.sha256;
  };

  return Object.freeze({
    load,
    publish(state) {
      if (existsSync(retiredPath)) {
        throw new AdminV1OfficialFirstEnvironmentRuntimeError(
          "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT",
        );
      }
      return persistTo(activePath, state);
    },
    retire(state) {
      const exactSuccess =
        state?.lifecycle === "TERMINAL_SUCCESS" &&
        state?.terminal_classification ===
          "PASS_TRUE_CREATE_ONLY_ENVIRONMENT_CREATED" &&
        state?.resource_state === "EXPECTED_CREATED_RESOURCE_PRESENT" &&
        boundedAscii(state?.owned_environment_record_id, 256) &&
        state?.expected_residual === true && state?.zero_residual === false &&
        state?.provider_creates === 1 && state?.provider_reads === 0 &&
        state?.provider_updates === 0 && state?.provider_deletes === 0;
      const exactNoEffect =
        state?.lifecycle === "TERMINAL_NO_EFFECT_FAILURE" &&
        typeof state?.terminal_classification === "string" &&
        state.terminal_classification.startsWith("FAIL_") &&
        state?.resource_state === "PROVEN_NO_PROVIDER_EFFECT" &&
        state?.owned_environment_record_id === null &&
        state?.expected_residual === false && state?.zero_residual === true &&
        state?.provider_creates === 0 && state?.provider_reads === 0 &&
        state?.provider_updates === 0 && state?.provider_deletes === 0;
      if (!exactSuccess && !exactNoEffect) {
        throw new AdminV1OfficialFirstEnvironmentRuntimeError(
          "FIRST_ENVIRONMENT_RETIREMENT_DENIED",
        );
      }
      const sha256 = persistTo(retiredPath, { ...state, retired: true });
      if (existsSync(activePath)) unlinkSync(activePath);
      fsyncPath(canonicalDirectory);
      return sha256;
    },
    retireReconciledNoOwnedResource(evidence) {
      const current = load();
      if (
        current === null || current.retired === true ||
        current.value.sequence !== 6 ||
        !exactSpentAmbiguousDispositionState(current.value.state) ||
        !exactTwoZeroObservationEvidence(evidence, {
          activeJournalSha256: current.sha256,
          identityJournalSha256: persistedIdentity.sha256,
        }) ||
        !existsSync(activePath) ||
        strictJournalObject(activePath).sha256 !== current.sha256
      ) {
        throw new AdminV1OfficialFirstEnvironmentRuntimeError(
          "FIRST_ENVIRONMENT_DISPOSITION_DENIED",
        );
      }
      const dispositionState = {
        ...structuredClone(current.value.state),
        lifecycle: "TERMINAL_GOVERNED_DISPOSITION",
        stage: "TWO_TIME_SEPARATED_ZERO_MATCH_DISPOSITION",
        terminal_classification:
          "DISPOSITION_TWO_ZERO_OBSERVATIONS_NO_OWNED_RESOURCE_IDENTIFIED",
        resource_state:
          "NO_OWNED_RESOURCE_IDENTIFIED_REMOTE_ABSENCE_NOT_PROVEN",
        disposition_evidence: structuredClone(evidence),
      };
      const sha256 = persistTo(retiredPath, {
        ...dispositionState,
        retired: true,
      });
      if (existsSync(activePath)) unlinkSync(activePath);
      fsyncPath(canonicalDirectory);
      return sha256;
    },
  });
}

function clearSensitive(sensitive) {
  const value = sensitive?.environment_value;
  if (value instanceof Uint8Array) {
    Buffer.from(value.buffer, value.byteOffset, value.byteLength).fill(0);
  }
}

function blankBudget() {
  return Object.fromEntries(
    Object.keys(ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET)
      .map((key) => [key, 0]),
  );
}

function publicState(state) {
  return {
    lifecycle: state.lifecycle,
    stage: state.stage,
    token_spent: state.token_spent,
    runtime_sessions: state.runtime_sessions,
    runtime_retries: 0,
    runtime_replays: 0,
    terminal_classification: state.terminal_classification,
    resource_state: state.resource_state,
    owned_environment_record_id: state.owned_environment_record_id,
    failure: structuredClone(state.failure),
    expected_residual: state.expected_residual,
    zero_residual: state.zero_residual,
    provider_creates: state.provider_creates,
    provider_reads: 0,
    provider_updates: 0,
    provider_deletes: 0,
  };
}

function boundedFailure(error) {
  const classification = error?.classification;
  const providerCode = error?.provider_code ?? null;
  const statusClass = error?.http_status_class ?? null;
  if (
    !CREATE_FAILURE_CLASSIFICATIONS.has(classification) ||
    !(providerCode === null || boundedAscii(providerCode, 128)) ||
    !(statusClass === null || HTTP_STATUS_CLASSES.has(statusClass))
  ) return null;
  return {
    operation: "create_environment",
    stage: "EXECUTION",
    classification,
    provider_code: providerCode,
    http_status_class: statusClass,
    provider: "VERCEL",
    retry_allowed: false,
  };
}

export function classifyAdminV1OfficialFirstEnvironmentFailureEvidence(
  journalDocument,
) {
  const failure = journalDocument?.state?.failure;
  if (
    !failure || typeof failure !== "object" || Array.isArray(failure) ||
    failure.operation !== "create_environment" ||
    failure.stage !== "EXECUTION" ||
    !CREATE_FAILURE_CLASSIFICATIONS.has(failure.classification) ||
    !(failure.provider_code === null || boundedAscii(failure.provider_code, 128)) ||
    !(failure.http_status_class === null ||
      HTTP_STATUS_CLASSES.has(failure.http_status_class)) ||
    failure.provider !== "VERCEL" || failure.retry_allowed !== false
  ) return null;
  return Object.freeze({
    failure_class: "BRANCH_ENV_CREATE_ONLY_FAILURE",
    operation: "create_environment",
    classification: failure.classification,
  });
}

export async function runAdminV1OfficialFirstEnvironmentRuntime({
  authorization,
  adapter,
  journal,
  load_sensitive,
  now_epoch_ms = Date.now(),
  allow_hermetic_test = false,
}) {
  const validated = validateAdminV1OfficialFirstEnvironmentAuthorization(
    authorization,
    { now_epoch_ms, allow_hermetic_test },
  );
  if (
    !adapter || !exactKeys(adapter, ["calls", "createEnvironment"]) &&
      !exactKeys(adapter, ["createEnvironment"]) ||
    typeof adapter.createEnvironment !== "function" ||
    !journal || typeof journal.load !== "function" ||
    typeof journal.publish !== "function" ||
    typeof journal.retire !== "function" ||
    typeof load_sensitive !== "function"
  ) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_RUNTIME_INPUT",
    );
  }

  const existing = journal.load();
  if (existing?.retired === true || existing?.value?.state?.token_spent === true) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT",
    );
  }
  if (existing !== null) {
    throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_RECOVERY_REQUIRED",
    );
  }

  const budgets = blankBudget();
  const take = (key) => {
    const limit = ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET[key];
    if (!Number.isSafeInteger(limit) || limit < 1 || budgets[key] + 1 > limit) {
      throw new AdminV1OfficialFirstEnvironmentRuntimeError(
        "FIRST_ENVIRONMENT_BUDGET_EXHAUSTED",
      );
    }
    budgets[key] += 1;
  };
  const state = {
    lifecycle: "PRE_EFFECT",
    stage: "AUTHORIZATION_VERIFIED",
    token_spent: false,
    runtime_sessions: 0,
    terminal_classification: null,
    resource_state: "NO_PROVIDER_EFFECT_STARTED",
    owned_environment_record_id: null,
    failure: null,
    expected_residual: false,
    zero_residual: true,
    provider_creates: 0,
  };
  journal.publish(publicState(state));
  take("runtime_sessions");
  state.runtime_sessions = 1;
  journal.publish(publicState(state));
  let sensitive = null;
  try {
    try {
      sensitive = await load_sensitive();
      if (
        !exactKeys(sensitive, ["environment_value"]) ||
        !(sensitive.environment_value instanceof Uint8Array) ||
        sensitive.environment_value.byteLength < 1
      ) {
        throw new AdminV1OfficialFirstEnvironmentRuntimeError(
          "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
        );
      }
    } catch (error) {
      state.failure = {
        operation: "load_credential_source",
        stage: "PRE_EFFECT",
        classification: "FAIL_CREDENTIAL_SOURCE_UNAVAILABLE",
        provider: "LOCAL",
        retry_allowed: false,
      };
      state.lifecycle = "TERMINAL_NO_EFFECT_FAILURE";
      state.stage = "CREDENTIAL_SOURCE_UNAVAILABLE";
      state.terminal_classification = "FAIL_CREDENTIAL_SOURCE_UNAVAILABLE";
      state.resource_state = "PROVEN_NO_PROVIDER_EFFECT";
      journal.publish(publicState(state));
      journal.retire(publicState(state));
      return Object.freeze({
        classification: state.terminal_classification,
        token_spent: false,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
        resource_state: state.resource_state,
        owned_environment_record_id: null,
        expected_residual: false,
        zero_residual: true,
        budgets: Object.freeze(structuredClone(budgets)),
      });
    }
    state.stage = "CREDENTIAL_SOURCE_ACQUIRED";
    journal.publish(publicState(state));
    state.stage = "INTENT_CREATE_ENVIRONMENT";
    journal.publish(publicState(state));
    take("environment_creates");
    state.token_spent = true;
    state.lifecycle = "EXECUTION_STARTED";
    state.stage = "AUTHORIZATION_SPENT";
    journal.publish(publicState(state));
    let created;
    try {
      created = await adapter.createEnvironment({
        key: validated.execution.environment_key,
        value: sensitive.environment_value,
      });
    } catch (error) {
      const failure = boundedFailure(error);
      const classification = failure?.classification ??
        "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE";
      state.failure = failure ?? {
        operation: "create_environment",
        stage: "EXECUTION",
        classification,
        provider_code: null,
        http_status_class: null,
        provider: "VERCEL",
        retry_allowed: false,
      };
      state.terminal_classification = classification;
      const provenNoEffect = new Set([
        "FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT",
        "FAIL_PROVIDER_AUTHENTICATION_UNAVAILABLE",
        "FAIL_PROVIDER_PERMISSION_DENIED",
        "FAIL_INVALID_CREATE_REQUEST",
        "FAIL_PROVIDER_RATE_LIMITED",
      ]).has(classification);
      if (provenNoEffect) {
        state.lifecycle = "TERMINAL_NO_EFFECT_FAILURE";
        state.stage = "PROVIDER_NO_EFFECT_FAILURE_CLASSIFIED";
        state.resource_state = "PROVEN_NO_PROVIDER_EFFECT";
        journal.publish(publicState(state));
        journal.retire(publicState(state));
      } else {
        state.lifecycle = "ACTIVE_UNKNOWN_STATE";
        state.stage = "AMBIGUOUS_POST_SPEND_RESULT";
        state.resource_state = "UNKNOWN_OR_AMBIGUOUS_PROVIDER_STATE";
        state.zero_residual = false;
        journal.publish(publicState(state));
      }
      return Object.freeze({
        classification,
        token_spent: true,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
        resource_state: state.resource_state,
        owned_environment_record_id: null,
        expected_residual: false,
        zero_residual: state.zero_residual,
        budgets: Object.freeze(structuredClone(budgets)),
      });
    }
    if (
      created?.status !== "CREATED_EXACT" ||
      !boundedAscii(created.record_id, 256)
    ) {
      state.failure = {
        operation: "create_environment",
        stage: "EXECUTION",
        classification: "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE",
        provider_code: null,
        http_status_class: null,
        provider: "VERCEL",
        retry_allowed: false,
      };
      state.terminal_classification =
        "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE";
      state.lifecycle = "ACTIVE_UNKNOWN_STATE";
      state.stage = "AMBIGUOUS_POST_SPEND_RESULT";
      state.resource_state = "UNKNOWN_OR_AMBIGUOUS_PROVIDER_STATE";
      state.zero_residual = false;
      journal.publish(publicState(state));
      return Object.freeze({
        classification: state.terminal_classification,
        token_spent: true,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
        resource_state: state.resource_state,
        owned_environment_record_id: null,
        expected_residual: false,
        zero_residual: false,
        budgets: Object.freeze(structuredClone(budgets)),
      });
    }
    state.owned_environment_record_id = created.record_id;
    state.provider_creates = 1;
    state.terminal_classification =
      "PASS_TRUE_CREATE_ONLY_ENVIRONMENT_CREATED";
    state.lifecycle = "TERMINAL_SUCCESS";
    state.stage = "EXPECTED_CREATED_RESOURCE_PRESENT";
    state.resource_state = "EXPECTED_CREATED_RESOURCE_PRESENT";
    state.expected_residual = true;
    state.zero_residual = false;
    journal.publish(publicState(state));
    journal.retire(publicState(state));
    return Object.freeze({
      classification: state.terminal_classification,
      token_spent: true,
      runtime_sessions: 1,
      runtime_retries: 0,
      runtime_replays: 0,
      resource_state: state.resource_state,
      owned_environment_record_id: state.owned_environment_record_id,
      expected_residual: true,
      zero_residual: false,
      budgets: Object.freeze(structuredClone(budgets)),
    });
  } finally {
    clearSensitive(sensitive);
  }
}
