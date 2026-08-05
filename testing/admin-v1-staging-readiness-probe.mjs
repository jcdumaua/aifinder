import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  classifyEnvironmentReadiness,
  parseStrictEnvironmentText,
  validateOpenApiContract,
  validateStorageBucketContract,
  validateTableProbeContract,
} from "./admin-v1-staging-readiness-core.mjs";

const PROBE_CONTRACT_VERSION = 1;
const BASELINE = "30b57b534c25a7d39d66a5dd29194bee8fe0690b";
const PHASE = "33NA-33NZ";
const ENVIRONMENT_PATH = ".env.local";
const EVIDENCE_PATH = "testing/admin-v1-staging-readiness-evidence.json";
const ENVIRONMENT_VARIABLE_NAMES = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
]);
const SOURCE_IDENTITY_PATHS = Object.freeze([
  "testing/admin-v1-staging-readiness-core.mjs",
  "testing/admin-v1-staging-readiness-probe.mjs",
  "testing/admin-v1-staging-readiness-source-policy.test.mjs",
  "testing/admin-v1-staging-readiness-evidence.schema.json",
  "testing/admin-v1-staging-readiness-evidence.test.mjs",
]);
const REQUEST_TIMEOUT_MS = 10_000;
const OPENAPI_RESPONSE_CAP_BYTES = 5242880;
const OTHER_RESPONSE_CAP_BYTES = 131072;
const MAXIMUM_ATTEMPTS = 2;
const MAXIMUM_REQUESTS = 10;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const REQUEST_SPECS = Object.freeze([
  Object.freeze({
    id: "openapi",
    method: "GET",
    path: "/rest/v1/",
    accept: "application/openapi+json",
    responseCapBytes: OPENAPI_RESPONSE_CAP_BYTES,
  }),
  Object.freeze({
    id: "tools",
    method: "GET",
    path: "/rest/v1/tools?select=id&limit=0",
    accept: "application/json",
    responseCapBytes: OTHER_RESPONSE_CAP_BYTES,
  }),
  Object.freeze({
    id: "submitted_tools",
    method: "GET",
    path: "/rest/v1/submitted_tools?select=id&limit=0",
    accept: "application/json",
    responseCapBytes: OTHER_RESPONSE_CAP_BYTES,
  }),
  Object.freeze({
    id: "admin_audit_logs",
    method: "GET",
    path: "/rest/v1/admin_audit_logs?select=id&limit=0",
    accept: "application/json",
    responseCapBytes: OTHER_RESPONSE_CAP_BYTES,
  }),
  Object.freeze({
    id: "storage_tool_logos",
    method: "GET",
    path: "/storage/v1/bucket/tool-logos",
    accept: "application/json",
    responseCapBytes: OTHER_RESPONSE_CAP_BYTES,
  }),
]);

class ProbeError extends Error {
  constructor(code, retryable = false, ledgerEntry = null) {
    super(code);
    this.code = code;
    this.retryable = retryable;
    this.ledgerEntry = ledgerEntry;
  }
}

function invariant(condition, code) {
  if (!condition) throw new ProbeError(code);
}

function repositoryPath(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      !path.isAbsolute(relativePath) &&
      !relativePath.split(path.sep).includes(".."),
    "REPOSITORY_RELATIVE_PATH",
  );
  const repositoryRoot = realpathSync(process.cwd());
  const resolved = path.resolve(repositoryRoot, relativePath);
  invariant(
    resolved.startsWith(`${repositoryRoot}${path.sep}`),
    "REPOSITORY_PATH_ESCAPE",
  );
  return { repositoryRoot, resolved };
}

function decodeUtf8(bytes, code) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ProbeError(code);
  }
}

function readEnvironmentOnce() {
  const { resolved } = repositoryPath(ENVIRONMENT_PATH);
  const metadata = lstatSync(resolved);
  invariant(metadata.isFile(), "ENVIRONMENT_NOT_REGULAR_FILE");
  invariant(!metadata.isSymbolicLink(), "ENVIRONMENT_SYMBOLIC_LINK");
  invariant((metadata.mode & 0o022) === 0, "ENVIRONMENT_WRITABLE_BY_OTHERS");
  invariant(realpathSync(resolved) === resolved, "ENVIRONMENT_REALPATH");
  invariant(metadata.size <= 1024 * 1024, "ENVIRONMENT_FILE_TOO_LARGE");
  const text = decodeUtf8(readFileSync(resolved), "ENVIRONMENT_UTF8");
  return parseStrictEnvironmentText(text);
}

function sourceIdentities() {
  return SOURCE_IDENTITY_PATHS.map((relativePath) => {
    const { resolved } = repositoryPath(relativePath);
    const metadata = lstatSync(resolved);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), "SOURCE_IDENTITY_FILE");
    const bytes = readFileSync(resolved);
    return {
      path: relativePath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });
}

function sanitizedEnvironment(readiness) {
  return {
    ready: readiness.ready,
    required_count: ENVIRONMENT_VARIABLE_NAMES.length,
    present_count: ENVIRONMENT_VARIABLE_NAMES.length,
    variables: ENVIRONMENT_VARIABLE_NAMES.map((name) => ({
      name,
      present: true,
      length_bucket:
        name === "NEXT_PUBLIC_SUPABASE_URL"
          ? "VALID_STANDARD_HTTPS_SUPABASE_ORIGIN"
          : readiness.length_buckets[name],
    })),
    service_role_distinct_from_anon:
      readiness.service_role_distinct_from_anon,
    session_secret_distinct_from_password:
      readiness.session_secret_distinct_from_password,
  };
}

function statusCategory(status) {
  if (status >= 200 && status < 300) return "SUCCESS_2XX";
  if (status >= 300 && status < 400) return "REDIRECT_3XX";
  if (status === 401) return "AUTHENTICATION_401";
  if (status === 403) return "AUTHORIZATION_403";
  if (RETRYABLE_STATUSES.has(status)) return "RETRYABLE_GATEWAY";
  if (status >= 400 && status < 500) return "CLIENT_ERROR_4XX";
  return "SERVER_ERROR_5XX";
}

async function readCappedResponse(response, capBytes) {
  if (response.body === null) return { bytes: 0, text: "" };
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    const bytes = Buffer.from(chunk);
    total += bytes.length;
    if (total > capBytes) {
      await response.body.cancel().catch(() => {});
      throw new ProbeError("RESPONSE_CAP_EXCEEDED");
    }
    chunks.push(bytes);
  }
  const body = Buffer.concat(chunks, total);
  return { bytes: total, text: decodeUtf8(body, "RESPONSE_UTF8") };
}

function connectionReset(error) {
  return (
    error?.code === "ECONNRESET" ||
    error?.cause?.code === "ECONNRESET" ||
    error?.message === "ECONNRESET"
  );
}

async function performRequest(spec, serviceRoleKey, confirmedOrigin, ordinal) {
  const requestUrl = new URL(spec.path, confirmedOrigin);
  if (requestUrl.origin !== confirmedOrigin) {
    throw new ProbeError("REQUEST_ORIGIN");
  }
  invariant(requestUrl.href === `${confirmedOrigin}${spec.path}`, "REQUEST_URL");
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Accept": spec.accept,
      },
      redirect: "manual",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const retryable = timedOut || connectionReset(error);
    const category = timedOut ? "TIMEOUT" : connectionReset(error) ? "CONNECTION_RESET" : "NETWORK_ERROR";
    throw new ProbeError("REQUEST_NETWORK", retryable, {
      request_ordinal: ordinal,
      request_id: spec.id,
      method: spec.method,
      path: spec.path,
      status: null,
      status_category: category,
      response_bytes: 0,
      response_cap_bytes: spec.responseCapBytes,
    });
  }
  clearTimeout(timeout);
  invariant(response.url === requestUrl.href, "RESPONSE_URL");
  const entry = {
    request_ordinal: ordinal,
    request_id: spec.id,
    method: spec.method,
    path: spec.path,
    status: response.status,
    status_category: statusCategory(response.status),
    response_bytes: 0,
    response_cap_bytes: spec.responseCapBytes,
  };
  if (RETRYABLE_STATUSES.has(response.status)) {
    throw new ProbeError("REQUEST_RETRYABLE_STATUS", true, entry);
  }
  invariant(response.status >= 200 && response.status < 300, "REQUEST_STATUS");
  const body = await readCappedResponse(response, spec.responseCapBytes);
  entry.response_bytes = body.bytes;
  return { body: body.text, entry };
}

async function executeAttempt(
  attemptOrdinal,
  serviceRoleKey,
  confirmedOrigin,
  startingRequestOrdinal,
) {
  const requests = [];
  const bodies = {};
  try {
    for (const [index, spec] of REQUEST_SPECS.entries()) {
      invariant(
        startingRequestOrdinal + index <= MAXIMUM_REQUESTS,
        "MAXIMUM_REQUESTS",
      );
      const result = await performRequest(
        spec,
        serviceRoleKey,
        confirmedOrigin,
        startingRequestOrdinal + index,
      );
      requests.push(result.entry);
      bodies[spec.id] = result.body;
    }
    return {
      attempt: {
        attempt_ordinal: attemptOrdinal,
        completed: true,
        retry_reason: null,
        requests,
      },
      bodies,
      retryable: false,
    };
  } catch (error) {
    if (error instanceof ProbeError && error.ledgerEntry) {
      requests.push(error.ledgerEntry);
    }
    return {
      attempt: {
        attempt_ordinal: attemptOrdinal,
        completed: false,
        retry_reason:
          error instanceof ProbeError && error.retryable ? error.code : null,
        requests,
      },
      bodies: null,
      error,
      retryable: error instanceof ProbeError && error.retryable,
    };
  }
}

async function collectLiveMetadata(serviceRoleKey, confirmedOrigin) {
  const attempts = [];
  let requestOrdinal = 1;
  for (let attemptOrdinal = 1; attemptOrdinal <= MAXIMUM_ATTEMPTS; attemptOrdinal += 1) {
    const result = await executeAttempt(
      attemptOrdinal,
      serviceRoleKey,
      confirmedOrigin,
      requestOrdinal,
    );
    attempts.push(result.attempt);
    requestOrdinal += result.attempt.requests.length;
    invariant(requestOrdinal - 1 <= MAXIMUM_REQUESTS, "MAXIMUM_REQUESTS");
    if (result.attempt.completed) {
      return {
        attempts,
        attemptsUsed: attemptOrdinal,
        bodies: result.bodies,
        requestsMade: requestOrdinal - 1,
      };
    }
    if (!result.retryable || attemptOrdinal === MAXIMUM_ATTEMPTS) {
      throw result.error;
    }
  }
  throw new ProbeError("ATTEMPT_EXHAUSTED");
}

function parseJson(text, code) {
  try {
    return JSON.parse(text);
  } catch {
    throw new ProbeError(code);
  }
}

function buildEvidence(readiness, metadata, targetConfirmed) {
  const openApi = validateOpenApiContract(
    parseJson(metadata.bodies.openapi, "OPENAPI_JSON"),
  );
  invariant(openApi.ready, "OPENAPI_CONTRACT");
  const zeroRowProbes = Object.fromEntries(
    ["tools", "submitted_tools", "admin_audit_logs"].map((table) => {
      const entry = metadata.attempts
        .at(-1)
        .requests.find((request) => request.request_id === table);
      const result = validateTableProbeContract(entry.status, metadata.bodies[table]);
      return [table, { status: result.status, status_category: result.status_category, zero_rows: result.zero_rows }];
    }),
  );
  const storage = validateStorageBucketContract(
    parseJson(metadata.bodies.storage_tool_logos, "STORAGE_JSON"),
  );
  invariant(storage.ready, "STORAGE_CONTRACT");
  return {
    schema_version: 1,
    phase: PHASE,
    baseline: BASELINE,
    result: "PASSED_READ_ONLY_STAGING_DEPENDENCY_READINESS",
    next_authority:
      "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION",
    target: {
      project_ref_sha256: readiness.target.project_ref_sha256,
      origin_sha256: readiness.target.origin_sha256,
      human_confirmed: targetConfirmed,
      origin_count: 1,
    },
    environment: sanitizedEnvironment(readiness),
    network: {
      methods: ["GET"],
      request_paths: REQUEST_SPECS.map((spec) => spec.path),
      requests_per_attempt: REQUEST_SPECS.length,
      maximum_attempts: MAXIMUM_ATTEMPTS,
      attempts_used: metadata.attemptsUsed,
      maximum_requests: MAXIMUM_REQUESTS,
      requests_made: metadata.requestsMade,
      timeout_ms: REQUEST_TIMEOUT_MS,
      redirect_policy: "MANUAL_DENY",
      openapi_response_cap_bytes: OPENAPI_RESPONSE_CAP_BYTES,
      other_response_cap_bytes: OTHER_RESPONSE_CAP_BYTES,
      attempts: metadata.attempts,
    },
    openapi: {
      ready: openApi.ready,
      document_present: openApi.openapi_present,
      tables: openApi.tables,
      rpc: openApi.rpc,
    },
    zero_row_probes: zeroRowProbes,
    storage_bucket: storage,
    privacy_and_mutation: {
      environment_file_reads: 1,
      environment_file_writes: 0,
      repository_write_paths: [EVIDENCE_PATH],
      repository_writes: 1,
      database_writes: 0,
      storage_writes: 0,
      storage_object_reads: 0,
      rpc_calls: 0,
      rows_retained: 0,
      raw_values: 0,
      secret_hashes: 0,
      browser_requests: 0,
      live_route_requests: 0,
      vercel_requests: 0,
    },
    governance: {
      current_blockers: 7,
      deferred_routes: 21,
      public_launch_decision: "NO_GO_PENDING_SEPARATE_AUTHORITIES",
      execution_authorized: false,
    },
    source_identities: sourceIdentities(),
  };
}

function runSelfTest() {
  invariant(PROBE_CONTRACT_VERSION === 1, "PROBE_CONTRACT_VERSION");
  invariant(REQUEST_SPECS.length === 5, "REQUEST_SPEC_COUNT");
  invariant(
    REQUEST_SPECS.every((spec) => spec.method === "GET"),
    "REQUEST_METHOD",
  );
  invariant(new Set(REQUEST_SPECS.map((spec) => spec.path)).size === 5, "REQUEST_PATHS");
  invariant(MAXIMUM_ATTEMPTS === 2 && MAXIMUM_REQUESTS === 10, "REQUEST_LIMITS");
  const synthetic = parseStrictEnvironmentText(
    [
      "NEXT_PUBLIC_SUPABASE_URL=https://syntheticref.supabase.co",
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${"a".repeat(32)}`,
      `SUPABASE_SERVICE_ROLE_KEY=${"s".repeat(32)}`,
      "ADMIN_PASSWORD=Synthetic-Admin-Password-1",
      `ADMIN_SESSION_SECRET=${"z".repeat(32)}`,
      "",
    ].join("\n"),
  );
  invariant(classifyEnvironmentReadiness(synthetic).ready, "SELF_TEST_ENVIRONMENT");
  invariant(
    canonicalJson({ z: 1, a: 2 }) === '{\n  "a": 2,\n  "z": 1\n}\n',
    "SELF_TEST_CANONICAL_JSON",
  );
  process.stdout.write(
    "PASS_ADMIN_V1_STAGING_READINESS_PROBE_SELF_TEST requests_per_attempt=5 maximum_attempts=2 maximum_requests=10 network_requests=0 repository_writes=0 database_writes=0 storage_writes=0 rpc_calls=0 raw_values=0 failures=0 internal_failures=0\n",
  );
}

function identifyTarget() {
  const environment = readEnvironmentOnce();
  const readiness = classifyEnvironmentReadiness(environment);
  invariant(readiness.ready, "ENVIRONMENT_NOT_READY");
  process.stdout.write(
    `ADMIN_V1_STAGING_TARGET_IDENTIFIED project_ref_sha256=${readiness.target.project_ref_sha256} origin_sha256=${readiness.target.origin_sha256} required_variables=5/5 environment_file=.env.local network_requests=0 raw_values=0\n`,
  );
}

async function runProbe() {
  const environment = readEnvironmentOnce();
  const readiness = classifyEnvironmentReadiness(environment);
  invariant(readiness.ready, "ENVIRONMENT_NOT_READY");
  const expectedAuthorization =
    `AUTHORIZE_ADMIN_V1_STAGING_TARGET_${readiness.target.project_ref_sha256}`;
  invariant(
    process.env.AIFINDER_STAGING_TARGET_AUTHORIZATION === expectedAuthorization,
    "TARGET_AUTHORIZATION",
  );
  const metadata = await collectLiveMetadata(
    environment.SUPABASE_SERVICE_ROLE_KEY,
    readiness.target.normalized_origin,
  );
  const evidence = buildEvidence(readiness, metadata, true);
  invariant(evidence.result === "PASSED_READ_ONLY_STAGING_DEPENDENCY_READINESS", "EVIDENCE_RESULT");
  const { resolved } = repositoryPath(EVIDENCE_PATH);
  writeFileSync(resolved, canonicalJson(evidence), {
    encoding: "utf8",
    flag: "w",
    mode: 0o600,
  });
  process.stdout.write(
    `PASS_ADMIN_V1_STAGING_READINESS_PROBE result=${evidence.result} target_bound=true environment=5/5 openapi=1 tables=3/3 rpc=1/1 zero_row_probes=3/3 storage_bucket=1/1 attempts=${metadata.attemptsUsed} requests=${metadata.requestsMade} writes=0 rows_retained=0 raw_values=0 failures=0 internal_failures=0\n`,
  );
}

const mode = process.argv[2] ?? "";
try {
  if (mode === "--self-test") runSelfTest();
  else if (mode === "--identify-target") identifyTarget();
  else if (mode === "--probe") await runProbe();
  else throw new ProbeError("MODE");
} catch (error) {
  const code = error instanceof ProbeError ? error.code : "INTERNAL";
  process.stdout.write(
    `FAIL_ADMIN_V1_STAGING_READINESS_PROBE code=${code} network_origins=1 methods=GET database_writes=0 storage_writes=0 rpc_calls=0 raw_values=0 internal_failures=${code === "INTERNAL" ? 1 : 0}\n`,
  );
  process.exit(1);
}
