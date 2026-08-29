import assert from "node:assert/strict";
import { lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Ajv from "ajv";
import {
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET,
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS,
  AdminV1OfficialFirstEnvironmentRuntimeError,
  classifyAdminV1OfficialFirstEnvironmentFailureEvidence,
  createAdminV1OfficialFirstEnvironmentJournal,
  runAdminV1OfficialFirstEnvironmentRuntime,
  validateAdminV1OfficialFirstEnvironmentAuthorization,
} from "./admin-v1-official-first-environment-runtime.mjs";
import {
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP,
  AdminV1OfficialFirstEnvironmentPlatformError,
  createAdminV1OfficialFirstEnvironmentAdapter,
  createAdminV1OfficialFirstEnvironmentNativeTransport,
} from "./admin-v1-official-first-environment-live-platform.mjs";
import { createAdminV1OfficialFirstEnvironmentAuthorizationRecord } from "./admin-v1-official-first-environment-materializer.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const RUN_ID = "123e4567-e89b-42d3-a456-426614174000";
const NOW = Date.parse("2026-08-24T16:00:00.000Z");
const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

function authorization() {
  return createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: {
      authorization_mode: "HERMETIC_TEST_ONLY",
      phase_identity: "ADMIN_V1_OFFICIAL_RUNTIME_FIRST_ENVIRONMENT_TRUE_CREATE_ONLY_HERMETIC_TEST_V1",
      reviewed_package_sha256: "1".repeat(64), reviewed_package_bytes: 1,
      gemini_approval_token_sha256: "2".repeat(64), direct_james_approval_sha256: "3".repeat(64),
      authorization_id: "223e4567-e89b-42d3-a456-426614174001", run_id: RUN_ID,
      created_at: "2026-08-24T15:00:00.000Z", expires_at: "2026-08-24T17:00:00.000Z",
      candidate_identity_sha256: "4".repeat(64), manifest_sha256: "5".repeat(64), candidate_member_count: 55,
      runtime_source_sha256: "6".repeat(64), supervisor_source_sha256: "8".repeat(64),
      transport_source_sha256: "9".repeat(64), transport_dependency_source_sha256: "9".repeat(64),
      authorization_schema_sha256: "a".repeat(64), materializer_source_sha256: "b".repeat(64),
      credential_loader_source_sha256: "c".repeat(64), supervisor_policy_sha256: "d".repeat(64),
      independent_semantic_pin_set_sha256: "e".repeat(64),
      repository: {
        root: realpathSync(ROOT), branch: "main", head: "a".repeat(40), tree: "b".repeat(40),
        origin_main: "a".repeat(40), remote_main: "a".repeat(40), ahead: 0, behind: 0,
        index_empty: true, worktree_count: 1, status_sha256: "7".repeat(64), remote_repository: "jcdumaua/aifinder",
      },
      deployment: {
        deployment_id: "dpl_2yCcELwLfr2LDejB6FHZaaAWKiuj", project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
        team_id: "team_9POJYxNnjIBbrQ19My8M5yG3", deployed_commit: "a".repeat(40), branch: "main",
        target: "production", source: "git/github", state: "READY",
      },
    },
    now_epoch_ms: NOW,
  });
}

function memoryJournal() {
  let current = null;
  let sequence = 0;
  const snapshots = [];
  const save = (state, retired) => {
    const value = { schema_version: 1, identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID },
      sequence: ++sequence, state: { ...structuredClone(state), ...(retired ? { retired: true } : {}) } };
    current = { value, retired };
    snapshots.push(structuredClone(value));
    return "8".repeat(64);
  };
  return { snapshots, load: () => current, publish: (state) => save(state, false), retire: (state) => save(state, true) };
}

function createOnlyAdapter({ journal, error = null } = {}) {
  const calls = [];
  return {
    calls,
    async createEnvironment({ key, value }) {
      calls.push("createEnvironment");
      assert.equal(key, "ADMIN_PASSWORD");
      assert(value instanceof Uint8Array);
      if (journal) {
        assert.equal(journal.load()?.value?.state?.stage, "AUTHORIZATION_SPENT");
        assert.equal(journal.load()?.value?.state?.token_spent, true);
      }
      if (error) throw error;
      return { status: "CREATED_EXACT", record_id: "env-owned-1" };
    },
  };
}

function adapterForResponse(responseOrError) {
  let attempts = 0;
  const adapter = createAdminV1OfficialFirstEnvironmentAdapter({
    authorization: authorization(),
    transport: { async execute(request) {
      attempts += 1;
      assert.equal(request.operation, "create_environment");
      if (responseOrError instanceof Error) throw responseOrError;
      return structuredClone(responseOrError);
    } },
  });
  return { adapter, attempts: () => attempts };
}

await check("capability surface is true create-only", async () => {
  assert.equal(ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS,
    "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_TRUE_CREATE_ONLY_RUNTIME_V1");
  assert.deepEqual(ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET, {
    environment_creates: 1, environment_identity_reads: 0, environment_updates: 0, environment_deletes: 0,
    runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0, git_remote_mutations: 0,
    database_supabase_reads: 0, database_supabase_writes: 0, storage_rpc_operations: 0,
    full_official_ledger_executions: 0,
  });
  assert.deepEqual(ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP, [{
    operation: "create_environment", capability: "environment_mutation",
    budget_counter: "environment_creates", effect: "CREATE_EXACT",
  }]);
});

await check("authorization and schema bind true create-only", async () => {
  const value = authorization();
  const validated = validateAdminV1OfficialFirstEnvironmentAuthorization(value,
    { now_epoch_ms: NOW, allow_hermetic_test: true });
  assert.equal(validated.operation_class,
    "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_TRUE_CREATE_ONLY_RUNTIME_V1");
  assert.deepEqual(validated.authorization_closure.capability_budget, {
    credential_value_reads: 2, environment_creates: 1, environment_deletes: 0,
    environment_identity_reads: 0, environment_updates: 0, full_official_ledger: 0,
    git_writes: 0, replays: 0, retries: 0, second_invocations: 0,
    storage_rpc_actions: 0, supabase_reads: 0, supabase_writes: 0,
  });
  assert.deepEqual(validated.authorization_closure.contracts, {
    authorization_spend_boundary: "IMMEDIATELY_BEFORE_FIRST_PROVIDER_CREATE_REQUEST",
    journal: "DURABLE_FAIL_CLOSED",
    recovery: "ACTIVE_UNKNOWN_STATE_ON_AMBIGUOUS_POST_SPEND_RESULT",
    successful_create_residue: "EXPECTED_OWNED_RESOURCE",
  });
  const schema = JSON.parse(readFileSync(path.join(import.meta.dirname,
    "admin-v1-official-first-environment-authorization.schema.json"), "utf8"));
  const validate = new Ajv({ allErrors: true, schemaId: "auto" }).compile(schema);
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
});

await check("success spends immediately before create and leaves expected residue", async () => {
  const journal = memoryJournal();
  const adapter = createOnlyAdapter({ journal });
  const secret = Buffer.from("LOCAL_TEST_SENTINEL", "utf8");
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({
    authorization: authorization(), adapter, journal,
    async load_sensitive() {
      assert.equal(journal.load()?.value?.state?.token_spent, false);
      return { environment_value: secret };
    },
    now_epoch_ms: NOW, allow_hermetic_test: true,
  });
  assert.deepEqual(adapter.calls, ["createEnvironment"]);
  assert.equal(result.classification, "PASS_TRUE_CREATE_ONLY_ENVIRONMENT_CREATED");
  assert.equal(result.resource_state, "EXPECTED_CREATED_RESOURCE_PRESENT");
  assert.equal(result.expected_residual, true);
  assert.equal(result.zero_residual, false);
  assert.equal(result.owned_environment_record_id, "env-owned-1");
  assert.equal(result.token_spent, true);
  assert(secret.every((byte) => byte === 0));
  assert.equal(journal.load().retired, true);
  assert.equal(journal.load().value.state.terminal_classification,
    "PASS_TRUE_CREATE_ONLY_ENVIRONMENT_CREATED");
  assert.equal(journal.load().value.state.expected_residual, true);
  assert.equal(journal.load().value.state.zero_residual, false);
});

await check("spent authorization cannot be reused", async () => {
  const journal = memoryJournal();
  await runAdminV1OfficialFirstEnvironmentRuntime({ authorization: authorization(), adapter: createOnlyAdapter({ journal }),
    journal, load_sensitive: async () => ({ environment_value: Buffer.from("FIRST") }),
    now_epoch_ms: NOW, allow_hermetic_test: true });
  const second = createOnlyAdapter({ journal });
  await assert.rejects(runAdminV1OfficialFirstEnvironmentRuntime({ authorization: authorization(), adapter: second,
    journal, load_sensitive: async () => ({ environment_value: Buffer.from("SECOND") }),
    now_epoch_ms: NOW, allow_hermetic_test: true }),
  (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT");
  assert.deepEqual(second.calls, []);
});

await check("credential failure remains unspent and retires no-effect", async () => {
  const journal = memoryJournal();
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({ authorization: authorization(),
    adapter: createOnlyAdapter({ journal }), journal,
    load_sensitive: async () => { throw new AdminV1OfficialFirstEnvironmentRuntimeError(
      "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE"); },
    now_epoch_ms: NOW, allow_hermetic_test: true });
  assert.equal(result.classification, "FAIL_CREDENTIAL_SOURCE_UNAVAILABLE");
  assert.equal(result.token_spent, false);
  assert.equal(result.resource_state, "PROVEN_NO_PROVIDER_EFFECT");
  assert.equal(journal.load().retired, true);
});

const providerCases = [
  ["ENV_ALREADY_EXISTS", 409, "FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT"],
  ["ENV_CONFLICT", 400, "FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT"],
  ["EXISTING_KEY_AND_TARGET", 400, "FAIL_TARGET_ALREADY_EXISTS_OR_CREATE_ONLY_CONFLICT"],
  ["NOT_AUTHORIZED", 401, "FAIL_PROVIDER_AUTHENTICATION_UNAVAILABLE"],
  ["FORBIDDEN", 403, "FAIL_PROVIDER_PERMISSION_DENIED"],
  ["INVALID_KEY", 400, "FAIL_INVALID_CREATE_REQUEST"],
  ["MISSING_VALUE", 400, "FAIL_INVALID_CREATE_REQUEST"],
  [null, 429, "FAIL_PROVIDER_RATE_LIMITED"],
  [null, 503, "FAIL_PROVIDER_FAILURE"],
];
for (const [providerCode, status, classification] of providerCases) {
  await check(`provider classifies ${classification}`, async () => {
    const { adapter, attempts } = adapterForResponse({ status,
      body: providerCode === null ? {} : { code: providerCode } });
    await assert.rejects(adapter.createEnvironment({ key: "ADMIN_PASSWORD",
      value: Buffer.from("LOCAL_TEST_SENTINEL") }),
    (error) => error instanceof AdminV1OfficialFirstEnvironmentPlatformError &&
      error.classification === classification && error.provider_code === providerCode);
    assert.equal(attempts(), 1);
  });
}

await check("success shapes are exact", async () => {
  for (const body of [{ id: "env-owned-1" }, { created: [{ id: "env-owned-1" }], failed: [] }]) {
    const { adapter, attempts } = adapterForResponse({ status: 200, body });
    assert.deepEqual(await adapter.createEnvironment({ key: "ADMIN_PASSWORD",
      value: Buffer.from("LOCAL_TEST_SENTINEL") }),
    { status: "CREATED_EXACT", record_id: "env-owned-1" });
    assert.equal(attempts(), 1);
  }
});

await check("transport and unknown responses fail closed without retry", async () => {
  const transport = adapterForResponse(new Error("synthetic transport"));
  await assert.rejects(transport.adapter.createEnvironment({ key: "ADMIN_PASSWORD",
    value: Buffer.from("LOCAL_TEST_SENTINEL") }),
  (error) => error?.classification === "FAIL_CREATE_TRANSPORT");
  assert.equal(transport.attempts(), 1);
  for (const response of [
    { status: 200, body: { created: [], failed: [] } },
    { status: 418, body: { code: "UNKNOWN_ERROR" } },
    { status: 400, body: { code: "env_conflict" } },
  ]) {
    const current = adapterForResponse(response);
    await assert.rejects(current.adapter.createEnvironment({ key: "ADMIN_PASSWORD",
      value: Buffer.from("LOCAL_TEST_SENTINEL") }),
    (error) => error?.classification === "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE");
    assert.equal(current.attempts(), 1);
  }
});

await check("ambiguous post-spend state remains active", async () => {
  const error = new AdminV1OfficialFirstEnvironmentPlatformError("FIRST_ENVIRONMENT_CREATE_AMBIGUOUS",
    { classification: "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE" });
  const journal = memoryJournal();
  const adapter = createOnlyAdapter({ journal, error });
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({ authorization: authorization(), adapter, journal,
    load_sensitive: async () => ({ environment_value: Buffer.from("LOCAL") }),
    now_epoch_ms: NOW, allow_hermetic_test: true });
  assert.equal(result.classification, "FAIL_AMBIGUOUS_OR_UNEXPECTED_PROVIDER_RESPONSE");
  assert.equal(result.resource_state, "UNKNOWN_OR_AMBIGUOUS_PROVIDER_STATE");
  assert.deepEqual(adapter.calls, ["createEnvironment"]);
  assert.equal(journal.load().retired, false);
});

await check("native transport admits one exact POST only", async () => {
  const requests = [];
  const native = createAdminV1OfficialFirstEnvironmentNativeTransport({
    provider_auth: Buffer.from("SYNTHETIC_PROVIDER_AUTH"),
    async fetch_impl(url, init) {
      requests.push({ url, method: init.method, body: init.body });
      return { status: 200, async text() { return JSON.stringify({ id: "env-owned-1" }); } };
    },
  });
  const adapter = createAdminV1OfficialFirstEnvironmentAdapter({ authorization: authorization(), transport: native });
  assert.deepEqual(Object.keys(adapter), ["createEnvironment"]);
  await adapter.createEnvironment({ key: "ADMIN_PASSWORD", value: Buffer.from("LOCAL_TEST_SENTINEL") });
  assert.deepEqual(requests.map(({ url, method }) => ({ url, method })), [{
    url: "https://api.vercel.com/v10/projects/prj_BPaQVKdElriAhxabhoTkg8LysQ5R/env?teamId=team_9POJYxNnjIBbrQ19My8M5yG3&upsert=false",
    method: "POST",
  }]);
  await assert.rejects(adapter.createEnvironment({ key: "ADMIN_PASSWORD", value: Buffer.from("SECOND") }),
    (error) => error?.code === "FIRST_ENVIRONMENT_CREATE_BUDGET_EXHAUSTED");
  assert.equal(requests.length, 1);
});

await check("filesystem journal is private and rejects sensitive evidence", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "aifinder-admin-v1-official-first-environment-"));
  try {
    const journal = createAdminV1OfficialFirstEnvironmentJournal({ directory,
      identity: { authorization_id_sha256: "1".repeat(64), run_id: RUN_ID } });
    assert.equal(lstatSync(directory).mode & 0o777, 0o700);
    assert.throws(() => journal.publish({ raw_body: "SYNTHETIC_SECRET" }),
      (error) => error?.code === "FIRST_ENVIRONMENT_EVIDENCE_SENSITIVE");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

await check("failure evidence is bounded", async () => {
  assert.deepEqual(classifyAdminV1OfficialFirstEnvironmentFailureEvidence({ state: { failure: {
    operation: "create_environment", stage: "EXECUTION", classification: "FAIL_PROVIDER_PERMISSION_DENIED",
    provider_code: "FORBIDDEN", http_status_class: "4XX", provider: "VERCEL", retry_allowed: false,
  } } }), {
    failure_class: "BRANCH_ENV_CREATE_ONLY_FAILURE", operation: "create_environment",
    classification: "FAIL_PROVIDER_PERMISSION_DENIED",
  });
});

if (failures.length > 0) {
  console.log(`FAIL_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_RUNTIME assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_RUNTIME assertions=${assertions} failures=0 internal_failures=0 environment_create_max=1 environment_read_max=0 environment_update_max=0 environment_delete_max=0 retries=0 replays=0 expected_residual=true git_remote_mutations=0 database_supabase_reads=0 database_supabase_writes=0 storage_rpc_operations=0 full_official_ledger=0`);
}
