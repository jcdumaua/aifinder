import { spawnSync } from "node:child_process";
import {
  readFileSync,
  lstatSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  ACTIVATION_REVIEW_SHA256,
  recoverQualification,
  runQualification,
} from "./activation-bridge.mjs";
import {
  createConcreteQualificationBundle,
  loadConcreteLiveCredentials,
} from "./nonproduction-qualification-adapters.mjs";
import {
  readConcreteCredentialEnvironment,
  resolveConcreteCredentialEnvironment,
} from "./nonproduction-qualification-credential-loader.mjs";
import { createConcreteCheckpointStore } from "./nonproduction-qualification-checkpoint-store.mjs";
import {
  createConcreteLivePlatform,
  createConcreteLiveTransport,
} from "./nonproduction-qualification-live-platform.mjs";
import {
  assertLegacyFreezePolicy,
  classifyLegacySnapshot,
  loadCurrentLegacySnapshot,
} from "./legacy-classifier.mjs";
import {
  deriveIdentityReport,
  readStrictJsonFile,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";
import {
  CONCRETE_CREDENTIAL_SOURCE_POLICY,
  CONCRETE_RETAINED_IDENTITY_SHA256,
  CONCRETE_SUPPORT_PATHS,
  validateConcreteAuthorizationRecord,
} from "./nonproduction-qualification-authorization.mjs";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  validateAdminV1OfficialAuthorization,
  createAdminV1OfficialJournal,
  classifyAdminV1OfficialRecoveryState,
} from "./admin-v1-official-runtime.mjs";
import {
  loadAdminV1OfficialCredentials,
  createAdminV1OfficialConcreteTransport,
  runConcreteAdminV1OfficialRuntime,
} from "./admin-v1-official-live-platform.mjs";

const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const MANIFEST_RELATIVE_PATH =
  "scripts/launch-operations-kernel/candidate-manifest.json";
const FREEZE_RELATIVE_PATH =
  "scripts/launch-operations-kernel/legacy-freeze.json";
const PROTECTED_DRAFT_PATHS = Object.freeze([
  "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-wrapper-candidate.sh",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-generator-candidate.py",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-schema.json",
]);
const GIT_TIMEOUT_MS = 20_000;
const OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime-authorization.schema.json";
const PRE_EFFECT_GIT_SANDBOX_PROFILE = [
  "(version 1)",
  "(allow default)",
  "(deny network*)",
  "(deny file-write*)",
  '(allow file-write* (literal "/dev/null"))',
  "(deny process-exec*)",
  '(allow process-exec (literal "/usr/bin/git"))',
  '(allow process-exec (literal "/Library/Developer/CommandLineTools/usr/bin/git"))',
].join("");
const PRE_EFFECT_GIT_ENVIRONMENT = Object.freeze({
  GIT_ASKPASS: "/usr/bin/false",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
  LC_ALL: "C",
  SSH_ASKPASS: "/usr/bin/false",
});
const PRE_EFFECT_GIT_CONFIG = Object.freeze([
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "credential.helper=",
  "-c",
  "credential.interactive=false",
  "-c",
  "diff.external=",
  "-c",
  "core.attributesFile=/dev/null",
  "-c",
  "core.pager=cat",
]);

export class ConcreteRunnerError extends Error {
  constructor(code) {
    super(code);
    this.name = "ConcreteRunnerError";
    this.code = code;
  }
}

function exactObject(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function exactAuthorizationPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/Users/jamescarlodumaua/Downloads/") &&
    value.endsWith(".json") &&
    !value.includes("\0") &&
    !value.includes("/.env") &&
    !value.split("/").includes("..")
  );
}

function exactRetainedClassification(value) {
  return (
    value?.schema_version === 1 &&
    value.classification === "FAIL_CLOSED_UNRESOLVED" &&
    value.authorization_state === "QUALIFICATION_ATTEMPT_STARTED" &&
    value.recovery_state === "EXECUTION_IN_PROGRESS" &&
    value.recovery_stage === "PRIOR_RECONCILIATION" &&
    value.guard?.owner_pid === 12605 &&
    value.guard?.status === "DEAD" &&
    value.guard?.recovery_root_binding_exact === true &&
    value.candidate_binding?.exact === true &&
    value.effects?.data_writes === 0 &&
    value.effects?.branch_commit_present === false &&
    value.effects?.preview_identity_present === false &&
    value.effects?.environment_resource_count === 0 &&
    value.effects?.environment_cleanup_intents?.ADMIN_PASSWORD === 0 &&
    value.effects?.environment_cleanup_intents?.ADMIN_SESSION_SECRET === 0 &&
    value.effects?.branch_cleanup_intents === 0 &&
    value.effects?.preview_cleanup_intents === 0 &&
    value.effects?.terminal_evidence_present === false &&
    exactObject(value.effects?.mutation_intents, [
      { kind: "PRIOR_RECONCILIATION", sequence: 1 },
    ]) &&
    value.ownership_ambiguity === true &&
    value.legacy_reconciliation_required === true &&
    value.clean === false &&
    value.qualified === false &&
    value.retained_identity_digest_sha256 ===
      CONCRETE_RETAINED_IDENTITY_SHA256
  );
}

export async function verifyConcretePreEffectAuthorization({
  authorization_record,
  dependencies,
  git_execution_context,
}) {
  const authorization = validateConcreteAuthorizationRecord(
    authorization_record,
    { now_epoch_ms: dependencies.now_epoch_ms },
  );
  const candidate = await dependencies.verifyCandidate();
  if (
    candidate?.verified !== true ||
    candidate.source_policy_verified !== true ||
    candidate.activation_source_policy_verified !== true ||
    candidate.membership_exact !== true ||
    candidate.legacy_imports !== 0 ||
    candidate.live_entrypoints !== 1 ||
    candidate.candidate_identity_sha256 !==
      authorization.candidate_identity_sha256 ||
    candidate.manifest_sha256 !== authorization.manifest_sha256 ||
    !Number.isSafeInteger(candidate.member_count) ||
    candidate.member_count < 1
  ) {
    throw new ConcreteRunnerError("CONCRETE_CANDIDATE_MISMATCH");
  }
  for (const supportPath of CONCRETE_SUPPORT_PATHS) {
    const actual = await dependencies.hashCompatibilitySupport(supportPath);
    if (actual !== authorization.compatibility_support_sha256[supportPath]) {
      throw new ConcreteRunnerError("CONCRETE_SUPPORT_MISMATCH");
    }
  }
  const repository = await dependencies.inspectRepository();
  if (!exactObject(repository, authorization.repository)) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const temporaryCommit = await dependencies.verifyTemporaryCommit(
    authorization,
    git_execution_context,
  );
  if (temporaryCommit?.verified !== true) {
    throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
  }
  const retainedResult = await dependencies.classifyRetainedLegacy();
  const retained =
    retainedResult?.classification &&
      typeof retainedResult.classification === "object" &&
      !Array.isArray(retainedResult.classification)
      ? retainedResult.classification
      : retainedResult;
  if (!exactRetainedClassification(retained)) {
    throw new ConcreteRunnerError("CONCRETE_RETAINED_STATE_MISMATCH");
  }
  return Object.freeze({
    verified: true,
    candidate_identity_sha256: candidate.candidate_identity_sha256,
    manifest_sha256: candidate.manifest_sha256,
    member_count: candidate.member_count,
    retained_legacy_identity_sha256:
      retained.retained_identity_digest_sha256,
    operation_class: authorization.operation_class,
    attempts_authorized: authorization.attempt_limit,
    request_budget: authorization.request_budget,
    mutation_budget: authorization.mutation_budget,
    retained_classification: structuredClone(retained),
    ...(retainedResult?.freeze_document_bytes instanceof Uint8Array
      ? {
          freeze_document_bytes: Buffer.from(
            retainedResult.freeze_document_bytes,
          ),
        }
      : {}),
  });
}

function safeCode(error) {
  const allowed = new Set([
    "CONCRETE_AUTHORIZATION_EXPIRED",
    "CONCRETE_AUTHORIZATION_INVALID",
    "CONCRETE_AUTHORIZATION_REQUIRED",
    "CONCRETE_CANDIDATE_MISMATCH",
    "CONCRETE_CREDENTIAL_MISSING",
    "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
    "CONCRETE_MODE_DENIED",
    "CONCRETE_REPOSITORY_MISMATCH",
    "CONCRETE_RETAINED_STATE_MISMATCH",
    "CONCRETE_SUPERVISOR_TRUST_REQUIRED",
    "CONCRETE_SUPPORT_MISMATCH",
    "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    "CONCRETE_QUALIFICATION_FAILED_CLOSED",
    "CONCRETE_QUALIFICATION_RECOVERED",
    "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
  ]);
  return allowed.has(error?.code) ? error.code : "CONCRETE_RUNNER_FAILED";
}

function emit(dependencies, value) {
  dependencies.writeOutput?.(structuredClone(value));
}

function safeCredentialDiagnostics(error) {
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
  const missing = Array.isArray(error?.missing_credentials) &&
      error.missing_credentials.every((value) => allowedMissing.has(value))
    ? [...error.missing_credentials]
    : [];
  const invalid = Array.isArray(error?.invalid_credential_sources) &&
      error.invalid_credential_sources.every((value) => allowedInvalid.has(value))
    ? [...error.invalid_credential_sources]
    : [];
  return Object.freeze({
    ...(missing.length > 0 ? { missing_credentials: Object.freeze(missing) } : {}),
    ...(invalid.length > 0
      ? { invalid_credential_sources: Object.freeze(invalid) }
      : {}),
  });
}

function authorizationFromSupervisorTrust(supervisorTrust, nowEpochMs) {
  try {
    if (
      !supervisorTrust ||
      typeof supervisorTrust !== "object" ||
      Array.isArray(supervisorTrust) ||
      Object.keys(supervisorTrust).sort().join("\0") !== [
        "authorization",
        "authorization_bytes",
        "authorization_sha256",
        "credential_source_policy",
        "supervisor_policy_sha256",
        "supervisor_sha256",
        "verified",
      ].sort().join("\0") ||
      supervisorTrust.verified !== true ||
      !(supervisorTrust.authorization_bytes instanceof Uint8Array) ||
      supervisorTrust.authorization_bytes.byteLength < 2 ||
      supervisorTrust.authorization_bytes.byteLength > 128 * 1024 ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.authorization_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_policy_sha256)
    ) throw new Error("SHAPE");
    const authorizationBytes = Buffer.from(supervisorTrust.authorization_bytes);
    const authorizationText = new TextDecoder("utf-8", { fatal: true }).decode(
      authorizationBytes,
    );
    if (
      authorizationText.startsWith("\ufeff") ||
      authorizationText !== `${canonicalJson(supervisorTrust.authorization)}\n` ||
      sha256Hex(authorizationBytes) !== supervisorTrust.authorization_sha256 ||
      supervisorTrust.authorization.supervisor_sha256 !==
        supervisorTrust.supervisor_sha256 ||
      supervisorTrust.authorization.supervisor_policy_sha256 !==
        supervisorTrust.supervisor_policy_sha256 ||
      canonicalJson(supervisorTrust.credential_source_policy) !==
        canonicalJson(CONCRETE_CREDENTIAL_SOURCE_POLICY)
    ) throw new Error("BINDING");
    return Object.freeze({
      authorization: validateConcreteAuthorizationRecord(
        structuredClone(supervisorTrust.authorization),
        { now_epoch_ms: nowEpochMs },
      ),
      credential_source_policy: Object.freeze(
        structuredClone(supervisorTrust.credential_source_policy),
      ),
    });
  } catch (error) {
    if (
      error?.code === "CONCRETE_AUTHORIZATION_EXPIRED" ||
      error?.code === "CONCRETE_AUTHORIZATION_INVALID"
    ) throw error;
    throw new ConcreteRunnerError("CONCRETE_SUPERVISOR_TRUST_REQUIRED");
  }
}

function officialAuthorizationFromSupervisorTrust(supervisorTrust, nowEpochMs) {
  try {
    if (
      !supervisorTrust || typeof supervisorTrust !== "object" ||
      Array.isArray(supervisorTrust) ||
      Object.keys(supervisorTrust).sort().join("\0") !== [
        "authorization",
        "authorization_bytes",
        "authorization_sha256",
        "credential_source_policy",
        "operation_class",
        "repository_observation",
        "supervisor_policy_sha256",
        "supervisor_sha256",
        "verified",
      ].sort().join("\0") ||
      supervisorTrust.verified !== true ||
      supervisorTrust.operation_class !== ADMIN_V1_OFFICIAL_OPERATION_CLASS ||
      !exactObject(
        supervisorTrust.repository_observation,
        supervisorTrust.authorization?.repository,
      ) ||
      !(supervisorTrust.authorization_bytes instanceof Uint8Array) ||
      supervisorTrust.authorization_bytes.byteLength < 2 ||
      supervisorTrust.authorization_bytes.byteLength > 128 * 1024 ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.authorization_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_sha256) ||
      !/^[0-9a-f]{64}$/u.test(supervisorTrust.supervisor_policy_sha256)
    ) throw new Error("SHAPE");
    const authorizationBytes = Buffer.from(supervisorTrust.authorization_bytes);
    const authorizationText = new TextDecoder("utf-8", { fatal: true }).decode(
      authorizationBytes,
    );
    if (
      authorizationText.startsWith("\ufeff") ||
      authorizationText !== `${canonicalJson(supervisorTrust.authorization)}\n` ||
      sha256Hex(authorizationBytes) !== supervisorTrust.authorization_sha256 ||
      supervisorTrust.authorization.supervisor_sha256 !==
        supervisorTrust.supervisor_sha256 ||
      supervisorTrust.authorization.supervisor_policy_sha256 !==
        supervisorTrust.supervisor_policy_sha256 ||
      canonicalJson(supervisorTrust.credential_source_policy) !==
        canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY)
    ) throw new Error("BINDING");
    return Object.freeze({
      authorization: validateAdminV1OfficialAuthorization(
        structuredClone(supervisorTrust.authorization),
        { now_epoch_ms: nowEpochMs },
      ),
      credential_source_policy: Object.freeze(
        structuredClone(supervisorTrust.credential_source_policy),
      ),
    });
  } catch (error) {
    if (
      error?.code === "OFFICIAL_AUTHORIZATION_INVALID" ||
      error?.code === "OFFICIAL_AUTHORIZATION_EXPIRED"
    ) throw error;
    throw new ConcreteRunnerError("OFFICIAL_SUPERVISOR_TRUST_REQUIRED");
  }
}

export async function verifyAdminV1OfficialPreEffectAuthorization({
  authorization_record,
  dependencies,
  git_execution_context,
}) {
  const authorization = validateAdminV1OfficialAuthorization(
    authorization_record,
    { now_epoch_ms: dependencies.now_epoch_ms },
  );
  const candidate = await dependencies.verifyCandidate();
  if (
    candidate?.verified !== true ||
    candidate.source_policy_verified !== true ||
    candidate.activation_source_policy_verified !== true ||
    candidate.membership_exact !== true ||
    candidate.legacy_imports !== 0 ||
    candidate.live_entrypoints !== 1 ||
    candidate.candidate_identity_sha256 !==
      authorization.candidate_identity_sha256 ||
    candidate.manifest_sha256 !== authorization.manifest_sha256
  ) throw new ConcreteRunnerError("OFFICIAL_CANDIDATE_MISMATCH");
  for (const supportPath of Object.keys(
    authorization.compatibility_support_sha256,
  )) {
    if (
      await dependencies.hashCompatibilitySupport(supportPath) !==
        authorization.compatibility_support_sha256[supportPath]
    ) throw new ConcreteRunnerError("OFFICIAL_SUPPORT_MISMATCH");
  }
  const repository = await dependencies.inspectRepository();
  if (!exactObject(repository, authorization.repository)) {
    throw new ConcreteRunnerError("OFFICIAL_REPOSITORY_MISMATCH");
  }
  const temporaryCommit = await dependencies.verifyTemporaryCommit(
    authorization,
    git_execution_context,
  );
  if (temporaryCommit?.verified !== true) {
    throw new ConcreteRunnerError("OFFICIAL_TEMPORARY_COMMIT_MISMATCH");
  }
  for (const routePath of Object.keys(authorization.route_source_sha256)) {
    if (
      await dependencies.hashOfficialRouteSource(routePath) !==
        authorization.route_source_sha256[routePath]
    ) throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  if (
    await dependencies.hashOfficialAuthorizationSchema() !==
      authorization.authorization_schema_sha256 ||
    canonicalJson(authorization.contract_sha256) !==
      canonicalJson(ADMIN_V1_OFFICIAL_CONTRACT_SHA256)
  ) throw new ConcreteRunnerError("OFFICIAL_CONTRACT_MISMATCH");
  const prior = await dependencies.verifyNoPriorOfficialRecovery(authorization);
  if (prior?.status !== "ABSENT") {
    throw new ConcreteRunnerError("OFFICIAL_PRIOR_RECOVERY_PENDING");
  }
  return Object.freeze({
    verified: true,
    operation_class: authorization.operation_class,
    candidate_identity_sha256: authorization.candidate_identity_sha256,
    manifest_sha256: authorization.manifest_sha256,
    token_spent: false,
  });
}

function safeOfficialCode(error) {
  const allowed = new Set([
    "OFFICIAL_AUTHORIZATION_INVALID",
    "OFFICIAL_AUTHORIZATION_REQUIRED",
    "OFFICIAL_AUTHORIZATION_SPENT",
    "OFFICIAL_BUDGET_EXHAUSTED",
    "OFFICIAL_CANDIDATE_MISMATCH",
    "OFFICIAL_CONTRACT_MISMATCH",
    "OFFICIAL_CREDENTIAL_MISSING",
    "OFFICIAL_CREDENTIAL_SOURCE_MISMATCH",
    "OFFICIAL_CONCRETE_TRANSPORT_MISSING",
    "OFFICIAL_PRIOR_RECOVERY_PENDING",
    "OFFICIAL_RECOVERY_PENDING",
    "OFFICIAL_REPOSITORY_MISMATCH",
    "OFFICIAL_ROUTE_SOURCE_MISMATCH",
    "OFFICIAL_RUNTIME_FAILED_CLOSED",
    "OFFICIAL_SUPPORT_MISMATCH",
    "OFFICIAL_SUPERVISOR_TRUST_REQUIRED",
    "OFFICIAL_TEMPORARY_COMMIT_MISMATCH",
  ]);
  return allowed.has(error?.code) ? error.code : "OFFICIAL_RUNTIME_FAILED_CLOSED";
}

export async function dispatchAdminV1OfficialRunner(
  argumentsList,
  dependencies = {},
  supervisorTrust = dependencies.supervisor_trust,
) {
  if (
    !Array.isArray(argumentsList) || argumentsList.length !== 3 ||
    argumentsList[0] !== "--run-admin-v1-official" ||
    argumentsList[1] !== "--authorization" ||
    !exactAuthorizationPath(argumentsList[2])
  ) {
    emit(dependencies, { status: "FAIL", code: "OFFICIAL_AUTHORIZATION_REQUIRED" });
    return { exit_code: 1, code: "OFFICIAL_AUTHORIZATION_REQUIRED" };
  }
  try {
    const trusted = officialAuthorizationFromSupervisorTrust(
      supervisorTrust,
      dependencies.now_epoch_ms,
    );
    const executionContext = await dependencies.prepareOfficialExecutionContext(
      trusted.authorization,
    );
    const closure = await verifyAdminV1OfficialPreEffectAuthorization({
      authorization_record: trusted.authorization,
      dependencies,
      git_execution_context: executionContext?.git_execution_context,
    });
    const credentials = await dependencies.readOfficialCredentials(
      trusted.authorization,
      trusted.credential_source_policy,
    );
    const result = await dependencies.runAuthorizedOfficialRuntime({
      authorization: trusted.authorization,
      authorization_closure: closure,
      credentials,
      execution_context: executionContext,
    });
    if (
      result?.classification === "OFFICIAL_RUNTIME_COMPLETE" &&
      result.official_requests === 20 && result.qualification_requests === 6 &&
      result.runtime_sessions === 1 && result.runtime_retries === 0 &&
      result.runtime_replays === 0 && result.zero_residual_owned_state === true
    ) {
      emit(dependencies, {
        status: "PASS",
        code: "OFFICIAL_RUNTIME_COMPLETE",
        qualification_requests: 6,
        official_requests: 20,
        runtime_sessions: 1,
        runtime_retries: 0,
        runtime_replays: 0,
      });
      return { exit_code: 0, code: "OFFICIAL_RUNTIME_COMPLETE" };
    }
    if (result?.classification === "RECOVERY_PENDING") {
      emit(dependencies, { status: "FAIL", code: "OFFICIAL_RECOVERY_PENDING" });
      return { exit_code: 1, code: "OFFICIAL_RECOVERY_PENDING" };
    }
    throw new ConcreteRunnerError("OFFICIAL_RUNTIME_FAILED_CLOSED");
  } catch (error) {
    const code = safeOfficialCode(error);
    emit(dependencies, { status: "FAIL", code });
    return { exit_code: 1, code };
  }
}

export async function dispatchConcreteQualificationRunner(
  argumentsList,
  dependencies = {},
  supervisorTrust = dependencies.supervisor_trust,
) {
  if (
    Array.isArray(argumentsList) &&
    argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) {
    emit(dependencies, {
      status: "PASS",
      code: "PASS_SELF_TEST",
      network: 0,
      credential_reads: 0,
      live_mutations: 0,
    });
    return { exit_code: 0, code: "PASS_SELF_TEST" };
  }
  if (Array.isArray(argumentsList) &&
    argumentsList[0] === "--run-admin-v1-official") {
    return dispatchAdminV1OfficialRunner(
      argumentsList,
      dependencies,
      supervisorTrust,
    );
  }
  if (!Array.isArray(argumentsList) || argumentsList[0] !== "--qualify-nonproduction") {
    emit(dependencies, { status: "FAIL", code: "CONCRETE_MODE_DENIED" });
    return { exit_code: 1, code: "CONCRETE_MODE_DENIED" };
  }
  if (
    argumentsList.length !== 3 ||
    argumentsList[1] !== "--authorization" ||
    !exactAuthorizationPath(argumentsList[2])
  ) {
    emit(dependencies, {
      status: "FAIL",
      code: "CONCRETE_AUTHORIZATION_REQUIRED",
    });
    return { exit_code: 1, code: "CONCRETE_AUTHORIZATION_REQUIRED" };
  }
  try {
    const trusted = authorizationFromSupervisorTrust(
      supervisorTrust,
      dependencies.now_epoch_ms,
    );
    const authorization = trusted.authorization;
    const executionContext =
      await dependencies.prepareAuthorizedExecutionContext(authorization);
    const closure = await verifyConcretePreEffectAuthorization({
      authorization_record: authorization,
      dependencies,
      git_execution_context: executionContext.git_execution_context,
    });
    const lifecycleWriter =
      executionContext?.checkpoint_store?.withExclusiveWriter;
    if (typeof lifecycleWriter !== "function") {
      throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
    }
    const result = await lifecycleWriter.call(
      executionContext.checkpoint_store,
      async () => {
        const credentials = await dependencies.readLiveCredentials(
          authorization,
          trusted.credential_source_policy,
        );
        return dependencies.runAuthorizedQualification({
          authorization,
          authorization_closure: closure,
          credentials,
          execution_context: executionContext,
        });
      },
    );
    if (
      result?.classification === "QUALIFIED" &&
      result.attempts_used === 1 &&
      result.retained_preview_count === 1
    ) {
      emit(dependencies, {
        status: "PASS",
        code: "QUALIFIED",
        attempts_used: 1,
        retained_preview_count: 1,
      });
      return { exit_code: 0, code: "QUALIFIED" };
    }
    if (
      result?.attempts_used === 1 &&
      result.retained_preview_count === 0 &&
      [
        "CONCRETE_QUALIFICATION_FAILED_CLOSED",
        "CONCRETE_QUALIFICATION_RECOVERED",
        "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
      ].includes(result.classification)
    ) {
      emit(dependencies, {
        status: "FAIL",
        code: result.classification,
        attempts_used: 1,
        retained_preview_count: 0,
      });
      return { exit_code: 1, code: result.classification };
    }
    throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
  } catch (error) {
    const code = safeCode(error);
    emit(dependencies, {
      status: "FAIL",
      code,
      ...(["CONCRETE_CREDENTIAL_MISSING", "CONCRETE_CREDENTIAL_SOURCE_MISMATCH"].includes(code)
        ? safeCredentialDiagnostics(error)
        : {}),
    });
    return { exit_code: 1, code };
  }
}

function exactGitExecutionContext(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") ===
      ["git_dir", "object_directory"].join("\0") &&
    typeof value.git_dir === "string" &&
    typeof value.object_directory === "string" &&
    path.isAbsolute(value.git_dir) &&
    path.isAbsolute(value.object_directory) &&
    !value.git_dir.includes("\0") &&
    !value.object_directory.includes("\0") &&
    realpathSync(value.git_dir) === value.git_dir &&
    realpathSync(value.object_directory) === value.object_directory;
}

function runGitReadOnly(
  repositoryRoot,
  args,
  {
    allowExitOne = false,
    gitExecutionContext = null,
    workTreeRoot = null,
  } = {},
) {
  if (gitExecutionContext !== null && !exactGitExecutionContext(gitExecutionContext)) {
    const error = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    error.detail = "GIT_CONTEXT_INVALID";
    throw error;
  }
  if (workTreeRoot !== null && gitExecutionContext === null) {
    const error = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    error.detail = "GIT_WORKTREE_CONTEXT_MISSING";
    throw error;
  }
  const environment = gitExecutionContext === null
    ? PRE_EFFECT_GIT_ENVIRONMENT
    : {
        ...PRE_EFFECT_GIT_ENVIRONMENT,
        GIT_DIR: gitExecutionContext.git_dir,
        GIT_NO_REPLACE_OBJECTS: "1",
        GIT_OBJECT_DIRECTORY: gitExecutionContext.object_directory,
        ...(workTreeRoot === null
          ? {}
          : {
              GIT_INDEX_FILE: path.join(workTreeRoot, ".git", "index"),
              GIT_WORK_TREE: workTreeRoot,
            }),
      };
  const result = spawnSync("/usr/bin/sandbox-exec", [
    "-p",
    PRE_EFFECT_GIT_SANDBOX_PROFILE,
    "/usr/bin/git",
    "--no-replace-objects",
    ...PRE_EFFECT_GIT_CONFIG,
    "--no-optional-locks",
    ...(workTreeRoot === null ? [] : ["-c", "core.bare=false"]),
    ...args,
  ], {
    cwd: workTreeRoot ?? (gitExecutionContext === null ? repositoryRoot : "/"),
    encoding: null,
    env: environment,
    maxBuffer: 4 * 1024 * 1024,
    timeout: GIT_TIMEOUT_MS,
    windowsHide: true,
  });
  if (
    !result ||
    !(result.status === 0 || (allowExitOne && result.status === 1)) ||
    !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.stderr.byteLength !== 0
  ) {
    const error = new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
    error.detail = Buffer.from(result?.stderr ?? []).toString("utf8").trim();
    throw error;
  }
  return {
    status: result.status,
    stdout: Buffer.from(result.stdout),
  };
}

function textOutput(result, code = "CONCRETE_REPOSITORY_MISMATCH") {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  } catch {
    throw new ConcreteRunnerError(code);
  }
  if (text.includes("\0")) throw new ConcreteRunnerError(code);
  return text;
}

function singleLine(result, code = "CONCRETE_REPOSITORY_MISMATCH") {
  const text = textOutput(result, code);
  if (!text.endsWith("\n") || text.slice(0, -1).includes("\n")) {
    throw new ConcreteRunnerError(code);
  }
  return text.slice(0, -1);
}

function exactRemoteRepository(repositoryRoot) {
  const remote = singleLine(
    runGitReadOnly(repositoryRoot, ["remote", "get-url", "origin"]),
  );
  if (![
    "git@github.com:jcdumaua/aifinder.git",
    "https://github.com/jcdumaua/aifinder.git",
  ].includes(remote)) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  return "jcdumaua/aifinder";
}

function inspectConcreteRepository(repositoryRoot, officialRepositoryObservation = null) {
  if (realpathSync(repositoryRoot) !== repositoryRoot) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const branch = singleLine(
    runGitReadOnly(repositoryRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
  );
  const head = singleLine(runGitReadOnly(repositoryRoot, ["rev-parse", "HEAD"]));
  const originMain = singleLine(
    runGitReadOnly(repositoryRoot, ["rev-parse", "refs/remotes/origin/main"]),
  );
  const counts = singleLine(
    runGitReadOnly(repositoryRoot, [
      "rev-list",
      "--left-right",
      "--count",
      "HEAD...refs/remotes/origin/main",
    ]),
  ).split(/\s+/u);
  if (counts.length !== 2 || counts.some((entry) => !/^\d+$/u.test(entry))) {
    throw new ConcreteRunnerError("CONCRETE_REPOSITORY_MISMATCH");
  }
  const index = runGitReadOnly(
    repositoryRoot,
    ["diff", "--cached", "--quiet", "--exit-code"],
    { allowExitOne: true },
  );
  const worktrees = textOutput(
    runGitReadOnly(repositoryRoot, ["worktree", "list", "--porcelain"]),
  ).split("\n").filter((entry) => entry.startsWith("worktree "));
  const statusBytes = runGitReadOnly(repositoryRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "-z",
  ]).stdout;
  const repository = {
    root: repositoryRoot,
    branch,
    head,
    origin_main: originMain,
    ...(officialRepositoryObservation === null
      ? {}
      : { remote_main: officialRepositoryObservation.remote_main }),
    ahead: Number(counts[0]),
    behind: Number(counts[1]),
    index_empty: index.status === 0,
    worktree_count: worktrees.length,
    status_sha256: sha256Hex(statusBytes),
    remote_repository: exactRemoteRepository(repositoryRoot),
  };
  if (
    officialRepositoryObservation !== null &&
    !exactObject(repository, officialRepositoryObservation)
  ) throw new ConcreteRunnerError("OFFICIAL_REPOSITORY_MISMATCH");
  return repository;
}

function statusPaths(repositoryRoot, gitExecutionContext) {
  const readPaths = (args) => {
    const bytes = runGitReadOnly(repositoryRoot, args, {
      gitExecutionContext,
      workTreeRoot: repositoryRoot,
    }).stdout;
    if (bytes.byteLength === 0) return [];
    if (bytes.at(-1) !== 0) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    return bytes.subarray(0, -1).toString("utf8").split("\0").map((entry) => {
      if (
        entry.length < 1 ||
        entry.includes("\0") ||
        entry.includes("\\") ||
        path.isAbsolute(entry) ||
        entry.split("/").includes("..") ||
        path.posix.normalize(entry) !== entry
      ) {
        throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
      }
      return entry;
    });
  };
  const paths = [
    ...readPaths(["diff-files", "--name-only", "-z", "--"]),
    ...readPaths(["ls-files", "--others", "--exclude-standard", "-z", "--"]),
  ].sort((left, right) => left.localeCompare(right, "en"));
  if (new Set(paths).size !== paths.length) {
    throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
  }
  return paths;
}

export function verifyConcreteTemporaryCommit(authorization, gitExecutionContext) {
  const repositoryRoot = authorization.repository.root;
  const commit = authorization.execution.temporary_commit_sha;
  let verificationStage = "CONTEXT";
  try {
    const rawGit = (args) => runGitReadOnly(repositoryRoot, args, {
      gitExecutionContext,
    });
    verificationStage = "COMMIT_EXISTS";
    rawGit(["cat-file", "-e", `${commit}^{commit}`]);
    verificationStage = "PARENT";
    const commitLine = singleLine(
      rawGit(["rev-list", "--parents", "-n", "1", commit]),
      "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    ).split(/\s+/u);
    if (
      commitLine.length !== 2 ||
      commitLine[0] !== commit ||
      commitLine[1] !== authorization.repository.head
    ) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    verificationStage = "CHANGED_PATHS";
    const changed = textOutput(rawGit([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
    ])).trimEnd().split("\n").filter(Boolean).sort();
    verificationStage = "STATUS_PATHS";
    const expected = statusPaths(repositoryRoot, gitExecutionContext)
      .filter((entry) => !PROTECTED_DRAFT_PATHS.includes(entry))
      .sort();
    verificationStage = "PATH_EQUIVALENCE";
    if (!exactObject(changed, expected) || expected.length < 1) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    for (const relativePath of expected) {
      verificationStage = `BLOB:${relativePath}`;
      const current = readFileSync(path.join(repositoryRoot, relativePath));
      const committed = rawGit([
        "show",
        `${commit}:${relativePath}`,
      ]).stdout;
      if (!current.equals(committed)) {
        throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
      }
    }
    verificationStage = "TREE";
    const treeSha = singleLine(
      rawGit(["show", "-s", "--format=%T", commit]),
      "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    );
    if (!/^[0-9a-f]{40}$/u.test(treeSha)) {
      throw new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    }
    return {
      verified: true,
      changed_paths: expected.length,
      commit_sha: commit,
      tree_sha: treeSha,
      object_directory: gitExecutionContext.object_directory,
    };
  } catch (error) {
    if (error?.code === "CONCRETE_TEMPORARY_COMMIT_MISMATCH") {
      error.detail = error.detail || verificationStage;
      throw error;
    }
    const wrapped = new ConcreteRunnerError("CONCRETE_TEMPORARY_COMMIT_MISMATCH");
    wrapped.detail = error?.detail ?? error?.message ?? "";
    throw wrapped;
  }
}

function verifyConcreteCandidate(repositoryRoot) {
  const manifestPath = path.join(repositoryRoot, MANIFEST_RELATIVE_PATH);
  const verification = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath,
    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",
  });
  const identities = deriveIdentityReport({
    repositoryRoot,
    manifestPath,
    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",
  });
  return {
    ...verification,
    manifest_sha256: identities.manifest_sha256,
    membership_exact: true,
    live_entrypoints: verification.live_entrypoints,
  };
}

function hashExactOfficialFile(repositoryRoot, relativePath, allowlist) {
  if (!allowlist.has(relativePath)) {
    throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  const target = path.resolve(repositoryRoot, relativePath);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  }
  const metadata = lstatSync(target);
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o644 || realpathSync(target) !== target
  ) throw new ConcreteRunnerError("OFFICIAL_ROUTE_SOURCE_MISMATCH");
  return sha256Hex(readFileSync(target));
}

function classifyConcreteRetainedLegacy(repositoryRoot) {
  const freezePath = path.join(repositoryRoot, FREEZE_RELATIVE_PATH);
  const freezeDocumentBytes = readFileSync(freezePath);
  const freeze = readStrictJsonFile(freezePath);
  assertLegacyFreezePolicy(freeze);
  const classification = classifyLegacySnapshot(
    loadCurrentLegacySnapshot({ freeze }),
  );
  return {
    classification,
    freeze_document_bytes: Buffer.from(freezeDocumentBytes),
  };
}

function normalizedConcreteResult(result) {
  const state = result?.state ?? result;
  const lifecycle = state?.lifecycle_state;
  const retained = Array.isArray(result?.retained_resources)
    ? result.retained_resources
    : [];
  if (
    lifecycle === "QUALIFIED" &&
    state?.outcome?.code === "QUALIFIED" &&
    retained.length === 1 &&
    retained[0]?.resource_type === "PREVIEW_DEPLOYMENT"
  ) {
    return {
      classification: "QUALIFIED",
      attempts_used: 1,
      retained_preview_count: 1,
    };
  }
  if (
    lifecycle === "READY" &&
    state?.recovery?.status === "COMPLETE"
  ) {
    return {
      classification: "CONCRETE_QUALIFICATION_RECOVERED",
      attempts_used: 1,
      retained_preview_count: 0,
    };
  }
  if (lifecycle === "FAILED_CLOSED") {
    return {
      classification: "CONCRETE_QUALIFICATION_FAILED_CLOSED",
      attempts_used: 1,
      retained_preview_count: 0,
    };
  }
  return {
    classification: "CONCRETE_QUALIFICATION_RECOVERY_PENDING",
    attempts_used: 1,
    retained_preview_count: 0,
  };
}

async function runConcreteAuthorizedQualification({
  authorization,
  authorization_closure,
  credentials,
  execution_context,
}) {
  if (!(authorization_closure.freeze_document_bytes instanceof Uint8Array)) {
    throw new ConcreteRunnerError("CONCRETE_RETAINED_STATE_MISMATCH");
  }
  const checkpointStore = execution_context?.checkpoint_store;
  if (
    !checkpointStore ||
    typeof checkpointStore.loadState !== "function" ||
    !execution_context?.git_execution_context
  ) {
    throw new ConcreteRunnerError("CONCRETE_RUNNER_FAILED");
  }
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport: createConcreteLiveTransport({
      git_execution_context: execution_context.git_execution_context,
    }),
  });
  const bundle = createConcreteQualificationBundle({
    authorization,
    authorization_closure,
    credentials,
    freeze_closure: {
      freeze_document_bytes: Buffer.from(
        authorization_closure.freeze_document_bytes,
      ),
      legacy_classification: structuredClone(
        authorization_closure.retained_classification,
      ),
      approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
      policy: {
        preserve_ambiguous_legacy_resources: true,
        fresh_ownership_namespace: true,
        claim_legacy_resources: false,
      },
    },
    platform,
    checkpoint_store: checkpointStore,
    storage_delete_capability_sha256: sha256Hex(canonicalJson({
      schema_version: 1,
      authorization_id_sha256: authorization.authorization_id_sha256,
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      run_id: authorization.run_id,
      operation: "DELETE_EXACT_STORAGE_VERSION",
      storage_bucket: authorization.execution.storage_bucket,
      storage_name: authorization.execution.storage_name,
    })),
  });
  let result;
  try {
    await checkpointStore.loadState();
    result = await recoverQualification(bundle.create_recovery_input());
  } catch (error) {
    if (error?.code !== "CONCRETE_CHECKPOINT_STATE_ABSENT") throw error;
    result = await runQualification(bundle.qualification_input);
    if (result?.state?.lifecycle_state === "FAILED_RECOVERABLE") {
      result = await recoverQualification(bundle.create_recovery_input());
    }
  }
  return normalizedConcreteResult(result);
}

async function prepareConcreteAuthorizedExecutionContext(authorization) {
  const checkpointStore = createConcreteCheckpointStore({
    directory: authorization.execution.journal_directory,
    identity: {
      authorization_id_sha256: authorization.authorization_id_sha256,
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      manifest_sha256: authorization.manifest_sha256,
      run_id: authorization.run_id,
    },
  });
  const gitExecutionContext = await checkpointStore.prepareGitExecutionContext({
    repository_root: authorization.repository.root,
  });
  return Object.freeze({
    checkpoint_store: checkpointStore,
    git_execution_context: gitExecutionContext,
  });
}

export function createConcreteRunnerDependencies({
  repositoryRoot = REPOSITORY_ROOT,
  officialRepositoryObservation = null,
  officialTransport = null,
  readCredentialEnvironment = readConcreteCredentialEnvironment,
  resolveCredentialEnvironment = resolveConcreteCredentialEnvironment,
  nowEpochMs = Date.now(),
  writeOutput,
} = {}) {
  const officialContexts = new Map();
  const officialRoutePaths = new Set([
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
  return {
    now_epoch_ms: nowEpochMs,
    verifyCandidate() {
      return verifyConcreteCandidate(repositoryRoot);
    },
    inspectRepository() {
      return inspectConcreteRepository(
        repositoryRoot,
        officialRepositoryObservation,
      );
    },
    hashCompatibilitySupport(relativePath) {
      return sha256Hex(readFileSync(path.join(repositoryRoot, relativePath)));
    },
    hashOfficialRouteSource(relativePath) {
      return hashExactOfficialFile(
        repositoryRoot,
        relativePath,
        officialRoutePaths,
      );
    },
    hashOfficialAuthorizationSchema() {
      return hashExactOfficialFile(
        repositoryRoot,
        OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH,
        new Set([OFFICIAL_AUTHORIZATION_SCHEMA_RELATIVE_PATH]),
      );
    },
    verifyTemporaryCommit: verifyConcreteTemporaryCommit,
    classifyRetainedLegacy() {
      return classifyConcreteRetainedLegacy(repositoryRoot);
    },
    prepareAuthorizedExecutionContext:
      prepareConcreteAuthorizedExecutionContext,
    async prepareOfficialExecutionContext(authorization) {
      const checkpointStore = createConcreteCheckpointStore({
        directory: authorization.execution.journal_directory,
        identity: {
          authorization_id_sha256: authorization.authorization_id_sha256,
          candidate_identity_sha256: authorization.candidate_identity_sha256,
          manifest_sha256: authorization.manifest_sha256,
          run_id: authorization.run_id,
        },
      });
      const journal = createAdminV1OfficialJournal({
        directory: authorization.execution.journal_directory,
        identity: {
          authorization_id_sha256: authorization.authorization_id_sha256,
          run_id: authorization.run_id,
        },
      });
      const gitExecutionContext = await checkpointStore.prepareGitExecutionContext({
        repository_root: authorization.repository.root,
      });
      const context = Object.freeze({
        journal,
        git_execution_context: gitExecutionContext,
      });
      officialContexts.set(authorization.authorization_id_sha256, context);
      return context;
    },
    verifyNoPriorOfficialRecovery(authorization) {
      const context = officialContexts.get(authorization.authorization_id_sha256);
      if (!context) return { status: "MISMATCH" };
      let existing;
      try {
        existing = context.journal.load();
      } catch {
        return { status: "MISMATCH" };
      }
      if (existing === null) return { status: "ABSENT" };
      if (existing.retired === true) return { status: "RETIRED" };
      try {
        const classification = classifyAdminV1OfficialRecoveryState(existing);
        if (classification === "CLEANUP_COMPLETE") return { status: "SPENT" };
        return { status: "RECOVERY_PENDING" };
      } catch {
        return { status: "MISMATCH" };
      }
    },
    async readLiveCredentials(authorization, credentialSourcePolicy) {
      const environment = readCredentialEnvironment({ repositoryRoot });
      const resolved = resolveCredentialEnvironment({
        environment,
        repositoryRoot,
      });
      if (
        canonicalJson(credentialSourcePolicy) !==
          canonicalJson(CONCRETE_CREDENTIAL_SOURCE_POLICY) ||
        canonicalJson(resolved.sources) !== canonicalJson(credentialSourcePolicy)
      ) {
        const mismatches = Object.keys(CONCRETE_CREDENTIAL_SOURCE_POLICY).filter(
          (category) => resolved.sources?.[category] !== credentialSourcePolicy?.[category],
        );
        const error = new ConcreteRunnerError(
          "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
        );
        error.invalid_credential_sources = Object.freeze(mismatches);
        throw error;
      }
      return loadConcreteLiveCredentials({
        environment: resolved.environment,
        authorization,
      });
    },
    async readOfficialCredentials(authorization, credentialSourcePolicy) {
      const environment = readCredentialEnvironment({ repositoryRoot });
      const resolved = resolveCredentialEnvironment({
        environment,
        repositoryRoot,
      });
      const officialSources = Object.freeze({
        ...resolved.sources,
        NODE_ENV: "PROVIDER_PRODUCTION_SEMANTICS",
      });
      if (
        canonicalJson(officialSources) !== canonicalJson(credentialSourcePolicy) ||
        canonicalJson(credentialSourcePolicy) !==
          canonicalJson(ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY)
      ) throw new ConcreteRunnerError("OFFICIAL_CREDENTIAL_SOURCE_MISMATCH");
      return loadAdminV1OfficialCredentials({
        environment: { ...resolved.environment, NODE_ENV: "production" },
        credential_source_policy: officialSources,
      });
    },
    runAuthorizedQualification: runConcreteAuthorizedQualification,
    runAuthorizedOfficialRuntime({
      authorization,
      credentials,
      execution_context,
    }) {
      const concreteTransport = typeof officialTransport?.execute === "function"
        ? officialTransport
        : createAdminV1OfficialConcreteTransport({ execution_context });
      return runConcreteAdminV1OfficialRuntime({
        authorization,
        credentials,
        execution_context,
        transport: concreteTransport,
        now_epoch_ms: nowEpochMs,
      });
    },
    writeOutput,
  };
}

async function main() {
  const result = await dispatchConcreteQualificationRunner(
    process.argv.slice(2),
    createConcreteRunnerDependencies({
      writeOutput(value) {
        console.log(canonicalJson(value));
      },
    }),
  );
  process.exitCode = result.exit_code;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
