import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { userInfo } from "node:os";
import { pathToFileURL } from "node:url";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  createAdminV1OfficialFirstEnvironmentAuthorizationRecord,
  writeAdminV1OfficialFirstEnvironmentAuthorizationRecord,
} from "./admin-v1-official-first-environment-materializer.mjs";

const PRODUCTION_OUTPUT_ROOT = "/Users/jamescarlodumaua/Downloads";
const OUTPUT_DIRECTORY_PREFIX =
  "AiFinder-Admin-V1-Official-First-Environment-Authorization-";
const REQUEST_MAX_BYTES = 64 * 1024;
const APPROVAL_MAX_BYTES = 64 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const REQUEST_KEYS = Object.freeze([
  "request_schema_version",
  "authorization_mode",
  "phase_identity",
  "reviewed_package_sha256",
  "reviewed_package_bytes",
  "gemini_approval_token_sha256",
  "direct_james_approval_sha256",
  "requested_validity_seconds",
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
  "credential_sources",
  "capability_budget",
  "contracts",
]);
const CREDENTIAL_SOURCE_KEYS = Object.freeze([
  "environment_value", "provider_auth",
]);
const CREDENTIAL_DESCRIPTOR_KEYS = Object.freeze([
  "key_name", "source_name",
]);
const CAPABILITY_BUDGET_KEYS = Object.freeze([
  "credential_value_reads",
  "environment_creates",
  "environment_deletes",
  "environment_identity_reads",
  "environment_updates",
  "full_official_ledger",
  "git_writes",
  "replays",
  "retries",
  "second_invocations",
  "storage_rpc_actions",
  "supabase_reads",
  "supabase_writes",
]);
const CONTRACT_KEYS = Object.freeze([
  "authorization_spend_boundary", "journal", "recovery",
  "successful_create_residue",
]);
const FORBIDDEN_CREDENTIAL_FIELD_NAMES = new Set([
  "credentialvalue",
  "credentialvalues",
  "secret",
  "secretvalue",
  "password",
  "passwordvalue",
  "token",
  "tokenvalue",
  "providerauthvalue",
  "adminpasswordvalue",
]);
const TEST_DEPENDENCY_KEYS = Object.freeze([
  "allow_hermetic_test",
  "allowed_output_root",
  "now_epoch_ms",
  "random_uuid",
]);

export class AdminV1OfficialFirstEnvironmentMaterializerCliError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentMaterializerCliError";
    this.code = code;
  }
}

function fail(code) {
  throw new AdminV1OfficialFirstEnvironmentMaterializerCliError(code);
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

function hasForbiddenCredentialField(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasForbiddenCredentialField);
  return Object.entries(value).some(([key, entry]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/gu, "");
    return FORBIDDEN_CREDENTIAL_FIELD_NAMES.has(normalized) ||
      hasForbiddenCredentialField(entry);
  });
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino &&
    left.size === right.size && left.uid === right.uid &&
    left.nlink === right.nlink && left.mode === right.mode &&
    left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

function sameDirectoryIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino &&
    left.uid === right.uid && left.mode === right.mode;
}

function currentUid() {
  const uid = userInfo().uid;
  return Number.isSafeInteger(uid) ? uid : null;
}

function validatePrivateFileMetadata(metadata, maximumBytes) {
  const uid = currentUid();
  return metadata.isFile() && !metadata.isSymbolicLink() &&
    metadata.nlink === 1 && metadata.size > 0 &&
    metadata.size <= maximumBytes &&
    (metadata.mode & 0o400) === 0o400 &&
    (metadata.mode & 0o177) === 0 &&
    (uid === null || metadata.uid === uid);
}

function readPrivateFile(filePath, { code, maximumBytes }) {
  let descriptor;
  let bytes;
  try {
    if (
      typeof filePath !== "string" || !path.isAbsolute(filePath) ||
      filePath.includes("\0") || filePath.split(path.sep).includes("..") ||
      realpathSync(filePath) !== filePath
    ) throw new Error("PATH");
    const beforePath = lstatSync(filePath);
    if (!validatePrivateFileMetadata(beforePath, maximumBytes)) {
      throw new Error("METADATA");
    }
    descriptor = openSync(
      filePath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const beforeDescriptor = fstatSync(descriptor);
    if (
      !validatePrivateFileMetadata(beforeDescriptor, maximumBytes) ||
      !sameIdentity(beforePath, beforeDescriptor)
    ) throw new Error("IDENTITY");
    bytes = readFileSync(descriptor);
    const afterDescriptor = fstatSync(descriptor);
    const afterPath = lstatSync(filePath);
    if (
      bytes.length !== beforeDescriptor.size ||
      !sameIdentity(beforeDescriptor, afterDescriptor) ||
      !sameIdentity(afterDescriptor, afterPath) ||
      realpathSync(filePath) !== filePath
    ) throw new Error("RACE");
    return {
      bytes,
      identity: Object.freeze({ dev: afterPath.dev, ino: afterPath.ino }),
      parent: path.dirname(filePath),
    };
  } catch {
    if (bytes) bytes.fill(0);
    fail(code);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

function decodeUtf8(bytes, code) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.includes("\0")) fail(code);
    return text;
  } catch (error) {
    if (error?.code === code) throw error;
    fail(code);
  }
}

function directoryIdentity(directory, allowedOutputRoot) {
  try {
    if (
      typeof directory !== "string" || !path.isAbsolute(directory) ||
      realpathSync(directory) !== directory ||
      path.dirname(directory) !== allowedOutputRoot ||
      !path.basename(directory).startsWith(OUTPUT_DIRECTORY_PREFIX)
    ) throw new Error("PATH");
    const root = lstatSync(allowedOutputRoot);
    const metadata = lstatSync(directory);
    const uid = currentUid();
    if (
      !root.isDirectory() || root.isSymbolicLink() ||
      !metadata.isDirectory() || metadata.isSymbolicLink() ||
      (root.mode & 0o022) !== 0 || (metadata.mode & 0o777) !== 0o700 ||
      (uid !== null && (root.uid !== uid || metadata.uid !== uid))
    ) throw new Error("METADATA");
    return metadata;
  } catch {
    fail("FIRST_ENVIRONMENT_NATIVE_OUTPUT_DIRECTORY_INVALID");
  }
}

function validateObservationContract(request) {
  if (hasForbiddenCredentialField(request)) {
    fail("FIRST_ENVIRONMENT_NATIVE_REQUEST_CREDENTIAL_FIELD");
  }
  if (
    !exactKeys(request, REQUEST_KEYS) ||
    request.request_schema_version !== 1 ||
    !Number.isSafeInteger(request.requested_validity_seconds) ||
    request.requested_validity_seconds < 1 ||
    request.requested_validity_seconds > 24 * 60 * 60 ||
    !exactKeys(request.credential_sources, CREDENTIAL_SOURCE_KEYS) ||
    !exactKeys(
      request.credential_sources.environment_value,
      CREDENTIAL_DESCRIPTOR_KEYS,
    ) ||
    !exactKeys(
      request.credential_sources.provider_auth,
      CREDENTIAL_DESCRIPTOR_KEYS,
    ) ||
    request.credential_sources.environment_value.key_name !==
      "ADMIN_PASSWORD" ||
    request.credential_sources.environment_value.source_name !==
      "PROCESS_ENV_EXACT_KEY" ||
    request.credential_sources.provider_auth.key_name !== "token" ||
    request.credential_sources.provider_auth.source_name !==
      "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE" ||
    !exactKeys(request.capability_budget, CAPABILITY_BUDGET_KEYS) ||
    canonicalJson(request.capability_budget) !== canonicalJson({
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
    !exactKeys(request.contracts, CONTRACT_KEYS) ||
    canonicalJson(request.contracts) !== canonicalJson({
      authorization_spend_boundary:
        "IMMEDIATELY_BEFORE_FIRST_PROVIDER_CREATE_REQUEST",
      journal: "DURABLE_FAIL_CLOSED",
      recovery: "ACTIVE_UNKNOWN_STATE_ON_AMBIGUOUS_POST_SPEND_RESULT",
      successful_create_residue: "EXPECTED_OWNED_RESOURCE",
    })
  ) fail("FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");
}

function parseObservation(bytes) {
  const text = decodeUtf8(bytes, "FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");
  let request;
  try {
    request = JSON.parse(text);
    if (`${canonicalJson(request)}\n` !== text) throw new Error("CANONICAL");
  } catch {
    fail("FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");
  } finally {
    bytes.fill(0);
  }
  validateObservationContract(request);
  return request;
}

function materializerRequest(request, { authorizationId, runId, nowEpochMs }) {
  return {
    authorization_mode: request.authorization_mode,
    phase_identity: request.phase_identity,
    reviewed_package_sha256: request.reviewed_package_sha256,
    reviewed_package_bytes: request.reviewed_package_bytes,
    gemini_approval_token_sha256: request.gemini_approval_token_sha256,
    direct_james_approval_sha256: request.direct_james_approval_sha256,
    authorization_id: authorizationId,
    run_id: runId,
    created_at: new Date(nowEpochMs).toISOString(),
    expires_at: new Date(
      nowEpochMs + request.requested_validity_seconds * 1000,
    ).toISOString(),
    candidate_identity_sha256: request.candidate_identity_sha256,
    manifest_sha256: request.manifest_sha256,
    candidate_member_count: request.candidate_member_count,
    runtime_source_sha256: request.runtime_source_sha256,
    supervisor_source_sha256: request.supervisor_source_sha256,
    transport_source_sha256: request.transport_source_sha256,
    transport_dependency_source_sha256:
      request.transport_dependency_source_sha256,
    authorization_schema_sha256: request.authorization_schema_sha256,
    materializer_source_sha256: request.materializer_source_sha256,
    credential_loader_source_sha256: request.credential_loader_source_sha256,
    supervisor_policy_sha256: request.supervisor_policy_sha256,
    independent_semantic_pin_set_sha256:
      request.independent_semantic_pin_set_sha256,
    repository: structuredClone(request.repository),
    deployment: structuredClone(request.deployment),
  };
}

function parseArguments(argumentsList) {
  if (
    Array.isArray(argumentsList) && argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) return { mode: "SELF_TEST" };
  const liveOptIn = argumentsList?.length === 6 &&
    argumentsList[5] === "--allow-live";
  if (
    !Array.isArray(argumentsList) ||
    ![5, 6].includes(argumentsList.length) ||
    argumentsList[0] !== "--materialize" ||
    argumentsList[1] !== "--request" ||
    typeof argumentsList[2] !== "string" ||
    argumentsList[3] !== "--approval-artifact" ||
    typeof argumentsList[4] !== "string" ||
    (argumentsList.length === 6 && !liveOptIn)
  ) fail("FIRST_ENVIRONMENT_NATIVE_ARGUMENTS");
  return {
    mode: "MATERIALIZE",
    requestPath: argumentsList[2],
    approvalPath: argumentsList[4],
    liveOptIn,
  };
}

export function dispatchAdminV1OfficialFirstEnvironmentMaterializerCli({
  arguments_list,
  dependencies = {},
}) {
  if (
    !dependencies || typeof dependencies !== "object" ||
    Array.isArray(dependencies) ||
    Object.getPrototypeOf(dependencies) !== Object.prototype ||
    Object.keys(dependencies).some((key) => !TEST_DEPENDENCY_KEYS.includes(key))
  ) fail("FIRST_ENVIRONMENT_NATIVE_DEPENDENCIES");
  const dependencyKeys = Object.keys(dependencies);
  const parsedArguments = parseArguments(arguments_list);
  if (parsedArguments.mode === "SELF_TEST") {
    return Object.freeze({
      status: "PASSED",
      classification: "SELF_TEST_ONLY",
      live_usable_records_created: 0,
      credential_value_reads: 0,
      provider_calls: 0,
      network_calls: 0,
    });
  }
  const allowedOutputRoot = dependencies.allowed_output_root ??
    PRODUCTION_OUTPUT_ROOT;
  let canonicalOutputRoot;
  try {
    canonicalOutputRoot = realpathSync(allowedOutputRoot);
    if (canonicalOutputRoot !== allowedOutputRoot) throw new Error("ROOT");
  } catch {
    fail("FIRST_ENVIRONMENT_NATIVE_OUTPUT_DIRECTORY_INVALID");
  }
  const requestFile = readPrivateFile(parsedArguments.requestPath, {
    code: "FIRST_ENVIRONMENT_NATIVE_REQUEST_FILE_INVALID",
    maximumBytes: REQUEST_MAX_BYTES,
  });
  const approvalFile = readPrivateFile(parsedArguments.approvalPath, {
    code: "FIRST_ENVIRONMENT_NATIVE_APPROVAL_FILE_INVALID",
    maximumBytes: APPROVAL_MAX_BYTES,
  });
  if (
    requestFile.parent !== approvalFile.parent ||
    (requestFile.identity.dev === approvalFile.identity.dev &&
      requestFile.identity.ino === approvalFile.identity.ino)
  ) {
    requestFile.bytes.fill(0);
    approvalFile.bytes.fill(0);
    fail("FIRST_ENVIRONMENT_NATIVE_FILE_ALIAS");
  }
  const outputDirectory = requestFile.parent;
  const beforeDirectory = directoryIdentity(outputDirectory, canonicalOutputRoot);
  const request = parseObservation(requestFile.bytes);
  const approvalSha256 = sha256Hex(approvalFile.bytes);
  decodeUtf8(
    approvalFile.bytes,
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_FILE_INVALID",
  );
  approvalFile.bytes.fill(0);
  if (approvalSha256 !== request.direct_james_approval_sha256) {
    fail("FIRST_ENVIRONMENT_NATIVE_APPROVAL_DIGEST_MISMATCH");
  }
  if (request.authorization_mode === "LIVE" && !parsedArguments.liveOptIn) {
    fail("FIRST_ENVIRONMENT_NATIVE_LIVE_OPT_IN_REQUIRED");
  }
  if (request.authorization_mode === "LIVE" && dependencyKeys.length !== 0) {
    fail("FIRST_ENVIRONMENT_NATIVE_LIVE_DEPENDENCY_OVERRIDE");
  }
  if (
    request.authorization_mode === "HERMETIC_TEST_ONLY" &&
    (!exactKeys(dependencies, TEST_DEPENDENCY_KEYS) ||
      dependencies.allow_hermetic_test !== true ||
      typeof dependencies.allowed_output_root !== "string" ||
      typeof dependencies.now_epoch_ms !== "function" ||
      typeof dependencies.random_uuid !== "function")
  ) fail("FIRST_ENVIRONMENT_NATIVE_HERMETIC_DENIED");
  if (
    request.authorization_mode !== "LIVE" &&
    request.authorization_mode !== "HERMETIC_TEST_ONLY"
  ) fail("FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");
  if (
    request.authorization_mode === "HERMETIC_TEST_ONLY" &&
    parsedArguments.liveOptIn
  ) fail("FIRST_ENVIRONMENT_NATIVE_ARGUMENTS");
  const nowProvider = dependencies.now_epoch_ms ?? (() => Date.now());
  const uuidProvider = dependencies.random_uuid ?? (() => randomUUID());
  const nowEpochMs = nowProvider();
  const authorizationId = uuidProvider();
  const runId = uuidProvider();
  if (
    !Number.isSafeInteger(nowEpochMs) ||
    !UUID_PATTERN.test(authorizationId ?? "") ||
    !UUID_PATTERN.test(runId ?? "") || authorizationId === runId
  ) fail("FIRST_ENVIRONMENT_NATIVE_IDENTITY_PROVIDER_INVALID");
  const materializerInput = materializerRequest(request, {
    authorizationId,
    runId,
    nowEpochMs,
  });
  const record = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: materializerInput,
    now_epoch_ms: nowEpochMs,
    allow_live: parsedArguments.liveOptIn,
  });
  const output = writeAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    directory: outputDirectory,
    record,
  });
  const afterDirectory = directoryIdentity(outputDirectory, canonicalOutputRoot);
  if (!sameDirectoryIdentity(beforeDirectory, afterDirectory)) {
    fail("FIRST_ENVIRONMENT_NATIVE_OUTPUT_DIRECTORY_RACE");
  }
  return Object.freeze({
    status: "PASSED",
    classification: request.authorization_mode,
    authorization_id: authorizationId,
    run_id: runId,
    authorization_id_sha256: record.authorization_id_sha256,
    one_use_authorization_sha256: record.one_use_authorization_sha256,
    review_approval_sha256: record.review_approval_sha256,
    authorization_sha256: output.sha256,
    output_path: output.path,
    created_at: record.created_at,
    expires_at: record.expires_at,
    credential_value_reads: 0,
    provider_calls: 0,
    network_calls: 0,
  });
}

function main() {
  try {
    const result = dispatchAdminV1OfficialFirstEnvironmentMaterializerCli({
      arguments_list: process.argv.slice(2),
    });
    console.log(canonicalJson(result));
  } catch (error) {
    const code = typeof error?.code === "string"
      ? error.code
      : "FIRST_ENVIRONMENT_NATIVE_INTERNAL";
    console.error(canonicalJson({ status: "FAILED", code }));
    process.exitCode = 1;
  }
}

if (
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) main();
