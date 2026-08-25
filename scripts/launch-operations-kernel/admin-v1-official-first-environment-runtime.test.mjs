import assert from "node:assert/strict";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
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
} from "./admin-v1-official-first-environment-live-platform.mjs";
import {
  createAdminV1OfficialFirstEnvironmentAuthorizationRecord,
} from "./admin-v1-official-first-environment-materializer.mjs";

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

function authorization(overrides = {}) {
  const value = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: {
      authorization_mode: "HERMETIC_TEST_ONLY",
      phase_identity:
        "ADMIN_V1_OFFICIAL_RUNTIME_FIRST_ENVIRONMENT_CREATE_ONLY_HERMETIC_TEST_V1",
      reviewed_package_sha256: "1".repeat(64),
      reviewed_package_bytes: 1,
      gemini_approval_token_sha256: "2".repeat(64),
      direct_james_approval_sha256: "3".repeat(64),
      authorization_id: "223e4567-e89b-42d3-a456-426614174001",
      run_id: RUN_ID,
      created_at: "2026-08-24T15:00:00.000Z",
      expires_at: "2026-08-24T17:00:00.000Z",
      candidate_identity_sha256: "4".repeat(64),
      manifest_sha256: "5".repeat(64),
      candidate_member_count: 47,
      runtime_source_sha256: "6".repeat(64),
      supervisor_source_sha256: "8".repeat(64),
      transport_source_sha256: "9".repeat(64),
      transport_dependency_source_sha256: "9".repeat(64),
      authorization_schema_sha256: "a".repeat(64),
      materializer_source_sha256: "b".repeat(64),
      credential_loader_source_sha256: "c".repeat(64),
      supervisor_policy_sha256: "d".repeat(64),
      independent_semantic_pin_set_sha256: "e".repeat(64),
      repository: {
        root: realpathSync(ROOT),
        branch: "main",
        head: "a".repeat(40),
        tree: "b".repeat(40),
        origin_main: "a".repeat(40),
        remote_main: "a".repeat(40),
        ahead: 0,
        behind: 0,
        index_empty: true,
        worktree_count: 1,
        status_sha256: "7".repeat(64),
        remote_repository: "jcdumaua/aifinder",
      },
      deployment: {
        deployment_id: "dpl_2yCcELwLfr2LDejB6FHZaaAWKiuj",
        project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
        team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
        deployed_commit: "a".repeat(40),
        branch: "main",
        target: "production",
        source: "git/github",
        state: "READY",
      },
    },
    now_epoch_ms: NOW,
  });
  return {
    ...value,
    ...overrides,
    repository: overrides.repository ?? value.repository,
    execution: overrides.execution ?? value.execution,
  };
}

function memoryJournal() {
  let active = null;
  let retired = null;
  let sequence = 0;
  const snapshots = [];
  return {
    snapshots,
    load() {
      return retired ?? active;
    },
    publish(state) {
      sequence += 1;
      const value = {
        schema_version: 1,
        identity: {
          authorization_id_sha256: "1".repeat(64),
          run_id: RUN_ID,
        },
        sequence,
        state: structuredClone(state),
      };
      active = { value, retired: false };
      snapshots.push(structuredClone(value));
      return "8".repeat(64);
    },
    retire(state) {
      sequence += 1;
      const value = {
        schema_version: 1,
        identity: {
          authorization_id_sha256: "1".repeat(64),
          run_id: RUN_ID,
        },
        sequence,
        state: { ...structuredClone(state), retired: true },
      };
      retired = { value, retired: true };
      active = null;
      snapshots.push(structuredClone(value));
      return "9".repeat(64);
    },
  };
}

function fakeAdapter({ createError = null, verifyStatus = "EXACT", deleteStatus = "DELETED_EXACT" } = {}) {
  const calls = [];
  return {
    calls,
    async createEnvironment({ key, value }) {
      calls.push("createEnvironment");
      assert.equal(key, "ADMIN_PASSWORD");
      assert(value instanceof Uint8Array);
      if (createError) throw createError;
      return { status: "CREATED_EXACT", record_id: "env-owned-1" };
    },
    async verifyEnvironmentIdentity({ key, record_id }) {
      calls.push("verifyEnvironmentIdentity");
      assert.equal(key, "ADMIN_PASSWORD");
      assert.equal(record_id, "env-owned-1");
      return { status: verifyStatus, record_id };
    },
    async deleteEnvironment({ record_id }) {
      calls.push("deleteEnvironment");
      assert.equal(record_id, "env-owned-1");
      return { status: deleteStatus, record_id };
    },
  };
}

await check("capability surface is narrow and explicit", async () => {
  assert.equal(
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS,
    "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREATE_ONLY_RUNTIME_V1",
  );
  assert.deepEqual(ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CAPABILITY_BUDGET, {
    environment_creates: 1,
    environment_identity_reads: 1,
    environment_deletes: 1,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    git_remote_mutations: 0,
    database_supabase_reads: 0,
    database_supabase_writes: 0,
    storage_rpc_operations: 0,
    full_official_ledger_executions: 0,
  });
  assert.deepEqual(
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP.map((entry) =>
      entry.operation
    ),
    ["create_environment", "verify_environment_identity", "delete_environment"],
  );
  assert.equal(
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_MAP.some((entry) =>
      /(git|database|supabase|storage|rpc|ledger|application)/u.test(
        `${entry.operation}:${entry.capability}`,
      )
    ),
    false,
  );
});

await check("authorization binds the narrow runtime exactly", async () => {
  const validated = validateAdminV1OfficialFirstEnvironmentAuthorization(
    authorization(),
    { now_epoch_ms: NOW, allow_hermetic_test: true },
  );
  assert.equal(validated.operation_class,
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_OPERATION_CLASS);
  assert.equal(validated.execution.environment_key, "ADMIN_PASSWORD");
  assert.equal(validated.execution.environment_git_branch, "main");
  assert(Object.isFrozen(validated));
  assert.throws(
    () => validateAdminV1OfficialFirstEnvironmentAuthorization(
      { ...authorization(), unrelated: true },
      { now_epoch_ms: NOW, allow_hermetic_test: true },
    ),
    (error) =>
      error instanceof AdminV1OfficialFirstEnvironmentRuntimeError &&
      error.code === "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
  );
  assert.throws(
    () => validateAdminV1OfficialFirstEnvironmentAuthorization(
      { ...authorization(), operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1" },
      { now_epoch_ms: NOW, allow_hermetic_test: true },
    ),
    (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
  );
});

await check("authorization schema accepts only the narrow runtime contract", async () => {
  const schema = JSON.parse(readFileSync(path.join(
    import.meta.dirname,
    "admin-v1-official-first-environment-authorization.schema.json",
  ), "utf8"));
  const validate = new Ajv({ allErrors: true, schemaId: "auto" }).compile(schema);
  assert.equal(validate(authorization()), true, JSON.stringify(validate.errors));
  assert.equal(validate({
    ...authorization(),
    operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
  }), false);
  assert.equal(validate({ ...authorization(), runtime_source_sha256: undefined }), false);
  assert.equal(validate({ ...authorization(), unrelated: true }), false);
});

await check("success spends once, proves identity, and cleans exact ownership", async () => {
  const journal = memoryJournal();
  const adapter = fakeAdapter();
  const environmentValue = Buffer.from("LOCAL_TEST_SENTINEL", "utf8");
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({
    authorization: authorization(),
    adapter,
    journal,
    async load_sensitive() {
      assert.equal(journal.load()?.value?.state?.token_spent, true);
      return { environment_value: environmentValue };
    },
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  });
  assert.deepEqual(adapter.calls, [
    "createEnvironment",
    "verifyEnvironmentIdentity",
    "deleteEnvironment",
  ]);
  assert.equal(result.classification, "FIRST_ENVIRONMENT_CREATE_ONLY_COMPLETE");
  assert.equal(result.token_spent, true);
  assert.equal(result.zero_residual_owned_state, true);
  assert.deepEqual(result.budgets, {
    environment_creates: 1,
    environment_identity_reads: 1,
    environment_deletes: 1,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    git_remote_mutations: 0,
    database_supabase_reads: 0,
    database_supabase_writes: 0,
    storage_rpc_operations: 0,
    full_official_ledger_executions: 0,
  });
  assert(environmentValue.every((byte) => byte === 0));
  assert.equal(journal.load().retired, true);
  assert.equal(journal.load().value.state.lifecycle, "CLEANUP_COMPLETE");
});

await check("a spent authorization cannot be replayed", async () => {
  const journal = memoryJournal();
  await runAdminV1OfficialFirstEnvironmentRuntime({
    authorization: authorization(),
    adapter: fakeAdapter(),
    journal,
    load_sensitive: async () => ({
      environment_value: Buffer.from("FIRST", "utf8"),
    }),
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  });
  const second = fakeAdapter();
  let secondValue = null;
  await assert.rejects(
    runAdminV1OfficialFirstEnvironmentRuntime({
      authorization: authorization(),
      adapter: second,
      journal,
      load_sensitive: async () => {
        secondValue = Buffer.from("SECOND", "utf8");
        return { environment_value: secondValue };
      },
      now_epoch_ms: NOW,
      allow_hermetic_test: true,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT",
  );
  assert.deepEqual(second.calls, []);
  assert.equal(secondValue, null);
});

await check("classified create failure is durable before cleanup", async () => {
  const error = new Error("bounded");
  error.environment_create_failure_class =
    "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE";
  error.http_status_class = "5XX";
  const journal = memoryJournal();
  const adapter = fakeAdapter({ createError: error });
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({
    authorization: authorization(),
    adapter,
    journal,
    load_sensitive: async () => ({
      environment_value: Buffer.from("LOCAL", "utf8"),
    }),
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.deepEqual(adapter.calls, ["createEnvironment"]);
  const classifiedIndex = journal.snapshots.findIndex((entry) =>
    entry.state.stage === "FAILURE_CREATE_ENVIRONMENT_CLASSIFIED"
  );
  const cleanupIndex = journal.snapshots.findIndex((entry) =>
    entry.state.stage === "CLEANUP_PENDING_PUBLISHED"
  );
  assert(classifiedIndex >= 0);
  assert(cleanupIndex > classifiedIndex);
  assert.deepEqual(
    classifyAdminV1OfficialFirstEnvironmentFailureEvidence(journal.load().value),
    {
      failure_class: "BRANCH_ENV_PARTIAL_FAILURE",
      operation: "create_environment",
      lower_level_class: "ENVIRONMENT_CREATE_TRANSPORT_OR_HTTP_FAILURE",
    },
  );
});

await check("identity mismatch fails closed after exact owned cleanup", async () => {
  const journal = memoryJournal();
  const adapter = fakeAdapter({ verifyStatus: "MISMATCH" });
  await assert.rejects(
    runAdminV1OfficialFirstEnvironmentRuntime({
      authorization: authorization(),
      adapter,
      journal,
      load_sensitive: async () => ({
        environment_value: Buffer.from("LOCAL", "utf8"),
      }),
      now_epoch_ms: NOW,
      allow_hermetic_test: true,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_IDENTITY_UNPROVEN",
  );
  assert.deepEqual(adapter.calls, [
    "createEnvironment",
    "verifyEnvironmentIdentity",
    "deleteEnvironment",
  ]);
  assert.equal(journal.load().retired, true);
  assert.equal(journal.load().value.state.zero_residual, true);
});

await check("ambiguous cleanup remains recovery pending", async () => {
  const journal = memoryJournal();
  const adapter = fakeAdapter({ deleteStatus: "AMBIGUOUS" });
  const result = await runAdminV1OfficialFirstEnvironmentRuntime({
    authorization: authorization(),
    adapter,
    journal,
    load_sensitive: async () => ({
      environment_value: Buffer.from("LOCAL", "utf8"),
    }),
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(result.zero_residual_owned_state, false);
  assert.equal(journal.load().retired, false);
  assert.equal(journal.load().value.state.lifecycle, "RECOVERY_PENDING");
});

await check("credential failure retires a real secret-free journal", async () => {
  const directory = mkdtempSync(path.join(
    tmpdir(),
    "aifinder-admin-v1-official-first-environment-",
  ));
  try {
    const journal = createAdminV1OfficialFirstEnvironmentJournal({
      directory,
      identity: {
        authorization_id_sha256: "1".repeat(64),
        run_id: RUN_ID,
      },
    });
    const adapter = fakeAdapter();
    await assert.rejects(
      runAdminV1OfficialFirstEnvironmentRuntime({
        authorization: authorization(),
        adapter,
        journal,
        load_sensitive: async () => {
          throw new AdminV1OfficialFirstEnvironmentRuntimeError(
            "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
          );
        },
        now_epoch_ms: NOW,
        allow_hermetic_test: true,
      }),
      (error) =>
        error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
    );
    assert.deepEqual(adapter.calls, []);
    assert.equal(journal.load().retired, true);
    assert.equal(journal.load().value.state.zero_residual, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

await check("filesystem journal is canonical, private, and secret-free", async () => {
  const directory = mkdtempSync(path.join(
    tmpdir(),
    "aifinder-admin-v1-official-first-environment-",
  ));
  const journal = createAdminV1OfficialFirstEnvironmentJournal({
    directory,
    identity: {
      authorization_id_sha256: "1".repeat(64),
      run_id: RUN_ID,
    },
  });
  assert.equal(lstatSync(directory).mode & 0o777, 0o700);
  journal.publish({
    lifecycle: "PRE_EFFECT",
    stage: "AUTHORIZATION_VERIFIED",
    token_spent: false,
    runtime_sessions: 0,
    runtime_retries: 0,
    runtime_replays: 0,
    owned_environment_record_id: null,
    identity_verified: false,
    failure: null,
    cleanup: [],
    zero_residual: false,
  });
  assert.equal(journal.load().retired, false);
  assert.throws(
    () => journal.publish({ raw_body: "SECRET" }),
    (error) => error?.code === "FIRST_ENVIRONMENT_EVIDENCE_SENSITIVE",
  );
});

await check("concrete adapter exposes only the three reviewed operations", async () => {
  const transportCalls = [];
  const adapter = createAdminV1OfficialFirstEnvironmentAdapter({
    authorization: authorization(),
    transport: {
      async execute(request) {
        transportCalls.push(structuredClone({
          operation: request.operation,
          descriptor: request.descriptor,
        }));
        if (request.operation === "create_environment") {
          return { status: 200, body: { id: "env-owned-1" } };
        }
        if (request.operation === "verify_environment_identity") {
          return {
            status: 200,
            body: {
              id: "env-owned-1",
              key: "ADMIN_PASSWORD",
              type: "encrypted",
              target: ["preview"],
              gitBranch: "main",
              projectId: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
              teamId: "team_9POJYxNnjIBbrQ19My8M5yG3",
            },
          };
        }
        return { status: 204, body: null };
      },
    },
  });
  assert.deepEqual(Object.keys(adapter), [
    "createEnvironment",
    "deleteEnvironment",
    "verifyEnvironmentIdentity",
  ]);
  const created = await adapter.createEnvironment({
    key: "ADMIN_PASSWORD",
    value: Buffer.from("LOCAL_TEST_SENTINEL", "utf8"),
  });
  assert.deepEqual(created, { status: "CREATED_EXACT", record_id: "env-owned-1" });
  assert.deepEqual(
    await adapter.verifyEnvironmentIdentity({
      key: "ADMIN_PASSWORD",
      record_id: "env-owned-1",
    }),
    { status: "EXACT", record_id: "env-owned-1" },
  );
  assert.deepEqual(
    await adapter.deleteEnvironment({ record_id: "env-owned-1" }),
    { status: "DELETED_EXACT", record_id: "env-owned-1" },
  );
  assert.deepEqual(transportCalls.map((entry) => entry.operation), [
    "create_environment",
    "verify_environment_identity",
    "delete_environment",
  ]);
  assert.equal(
    transportCalls.some((entry) =>
      entry.descriptor.service !== "VERCEL" ||
      !/^\/v(?:9|10)\/projects\//u.test(entry.descriptor.path) ||
      /(supabase|database|storage|rpc|github|ledger)/iu.test(
        `${entry.descriptor.service}:${entry.descriptor.path}`,
      )
    ),
    false,
  );
});

await check("adapter rejects malformed create identity without retry", async () => {
  let attempts = 0;
  const adapter = createAdminV1OfficialFirstEnvironmentAdapter({
    authorization: authorization(),
    transport: {
      async execute() {
        attempts += 1;
        return { status: 200, body: { created: [], failed: [] } };
      },
    },
  });
  await assert.rejects(
    adapter.createEnvironment({
      key: "ADMIN_PASSWORD",
      value: Buffer.from("LOCAL_TEST_SENTINEL", "utf8"),
    }),
    (error) =>
      error instanceof AdminV1OfficialFirstEnvironmentPlatformError &&
      error.environment_create_failure_class ===
        "ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" &&
      error.http_status_class === "2XX",
  );
  assert.equal(attempts, 1);
});

if (failures.length > 0) {
  console.log(
    `FAIL_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_RUNTIME ` +
      `assertions=${assertions} failures=${failures.length} ` +
      `failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_RUNTIME ` +
      `assertions=${assertions} failures=0 internal_failures=0 ` +
      `environment_create_max=1 git_remote_mutations=0 ` +
      `database_supabase_reads=0 database_supabase_writes=0 ` +
      `storage_rpc_operations=0 full_official_ledger=0 retries=0 replays=0`,
  );
}
