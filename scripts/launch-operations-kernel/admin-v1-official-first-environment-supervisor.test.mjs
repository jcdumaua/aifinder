import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_CONTRACT,
  createAdminV1OfficialFirstEnvironmentNativeDependencies,
  dispatchAdminV1OfficialFirstEnvironmentSupervisor,
} from "./admin-v1-official-first-environment-supervisor.mjs";
import {
  createAdminV1OfficialFirstEnvironmentAuthorizationRecord,
} from "./admin-v1-official-first-environment-materializer.mjs";
import {
  createAdminV1OfficialFirstEnvironmentNativeTransport,
} from "./admin-v1-official-first-environment-live-platform.mjs";

assert.equal(
  typeof createAdminV1OfficialFirstEnvironmentNativeDependencies,
  "function",
);

const ROOT = path.resolve(import.meta.dirname, "../..");
const SUPERVISOR_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-supervisor.mjs",
);
const RUNTIME_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-runtime.mjs",
);
const TRANSPORT_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-live-platform.mjs",
);
const SCHEMA_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-authorization.schema.json",
);
const MATERIALIZER_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-materializer.mjs",
);
const CREDENTIAL_LOADER_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-credential-loader.mjs",
);
const SUPERVISOR_POLICY_PATH = path.join(
  ROOT,
  "scripts/launch-operations-supervisor/supervisor-policy.json",
);
const MANIFEST_PATH = path.join(import.meta.dirname, "candidate-manifest.json");
const SUPERVISOR_SOURCE = readFileSync(SUPERVISOR_PATH, "utf8");
const RUN_ID = "123e4567-e89b-42d3-a456-426614174000";
const NOW = Date.parse("2026-08-24T16:00:00.000Z");
const HEAD = "cd4c39fcc43a0369f2b6c7b350085750bcf5a709";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort((left, right) =>
      left.localeCompare(right, "en")
    ).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new Error("TEST_CANONICAL_JSON_INVALID");
};

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

function authorization(overrides = {}) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const supervisorPolicy = JSON.parse(readFileSync(SUPERVISOR_POLICY_PATH));
  const transportSourceSha256 = sha256(readFileSync(TRANSPORT_PATH));
  const value = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: {
      authorization_mode: "HERMETIC_TEST_ONLY",
      phase_identity:
        "ADMIN_V1_OFFICIAL_RUNTIME_FIRST_ENVIRONMENT_CREATE_ONLY_HERMETIC_TEST_V1",
      reviewed_package_sha256: "a".repeat(64),
      reviewed_package_bytes: 1,
      gemini_approval_token_sha256: "b".repeat(64),
      direct_james_approval_sha256: "c".repeat(64),
      authorization_id: "223e4567-e89b-42d3-a456-426614174001",
      run_id: RUN_ID,
      created_at: "2026-08-24T15:00:00.000Z",
      expires_at: "2026-08-24T17:00:00.000Z",
      candidate_identity_sha256: manifest.candidate_identity_sha256,
      manifest_sha256: sha256(readFileSync(MANIFEST_PATH)),
      candidate_member_count: manifest.member_count,
      runtime_source_sha256: sha256(readFileSync(RUNTIME_PATH)),
      supervisor_source_sha256: sha256(readFileSync(SUPERVISOR_PATH)),
      transport_source_sha256: transportSourceSha256,
      transport_dependency_source_sha256: transportSourceSha256,
      authorization_schema_sha256: sha256(readFileSync(SCHEMA_PATH)),
      materializer_source_sha256: sha256(readFileSync(MATERIALIZER_PATH)),
      credential_loader_source_sha256:
        sha256(readFileSync(CREDENTIAL_LOADER_PATH)),
      supervisor_policy_sha256: sha256(readFileSync(SUPERVISOR_POLICY_PATH)),
      independent_semantic_pin_set_sha256:
        supervisorPolicy.independent_semantic_pin_set_sha256,
      repository: {
        root: ROOT,
        branch: "main",
        head: HEAD,
        tree: "d".repeat(40),
        origin_main: HEAD,
        remote_main: HEAD,
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
        deployed_commit: HEAD,
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

function writeAuthorization(directory, value) {
  const target = path.join(directory, "authorization.json");
  writeFileSync(target, `${canonicalJson(value)}\n`, { flag: "wx", mode: 0o600 });
  chmodSync(target, 0o600);
  return target;
}

function transport(counters) {
  return {
    async execute(request) {
      counters.transport += 1;
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
      assert.equal(request.operation, "delete_environment");
      return { status: 204, body: null };
    },
  };
}

function dependencies({ journal = memoryJournal(), credential = true } = {}) {
  const counters = {
    candidate: 0,
    journal_creates: 0,
    credential: 0,
    transport: 0,
  };
  const output = [];
  return {
    counters,
    journal,
    output,
    values: {
      repository_root: ROOT,
      supervisor_path: SUPERVISOR_PATH,
      now_epoch_ms: NOW,
      allow_hermetic_test: true,
      inspect_repository: (record) => structuredClone(record.repository),
      verify_candidate(record) {
        counters.candidate += 1;
        return {
          verified: true,
          candidate_identity_sha256: record.candidate_identity_sha256,
          manifest_sha256: record.manifest_sha256,
          member_count:
            record.authorization_closure.candidate_member_count,
        };
      },
      create_journal() {
        counters.journal_creates += 1;
        return journal;
      },
      async load_credential({ source_contract }) {
        counters.credential += 1;
        assert.deepEqual(
          source_contract,
          ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_CONTRACT,
        );
        assert.equal(journal.load()?.value?.state?.token_spent, true);
        assert.equal(journal.load()?.value?.state?.runtime_sessions, 1);
        if (!credential) throw new Error("SYNTHETIC_CREDENTIAL_UNAVAILABLE");
        return Buffer.from("LOCAL_TEST_SENTINEL", "utf8");
      },
      transport: transport(counters),
      write_output(value) {
        output.push(structuredClone(value));
      },
    },
  };
}

const temporaryRoot = realpathSync(mkdtempSync(path.join(
  tmpdir(),
  "aifinder-first-environment-supervisor-test-",
)));
try {
  assert(
    SUPERVISOR_SOURCE.includes(
      "dependencies.inspect_repository\n      ? dependencies.inspect_repository(authorization)\n      : inspectAdminV1OfficialFirstEnvironmentRepository(repositoryRoot)",
    ),
  );
  const selfTest = spawnSync(process.argv[0], [SUPERVISOR_PATH, "--self-test"], {
    cwd: ROOT,
    encoding: "utf8",
    env: {},
    maxBuffer: 64 * 1024,
    timeout: 10_000,
  });
  assert.equal(selfTest.status, 0, selfTest.stderr);
  assert.equal(selfTest.stderr, "");
  assert.deepEqual(JSON.parse(selfTest.stdout), {
    status: "PASS",
    code: "PASS_FIRST_ENVIRONMENT_SUPERVISOR_SELF_TEST",
    network: 0,
    credential_value_reads: 0,
    runtime_sessions: 0,
  });

  const denied = dependencies();
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-admin-v1-official"],
      denied.values,
    ),
    { exit_code: 1, code: "FIRST_ENVIRONMENT_SUPERVISOR_MODE_DENIED" },
  );
  assert.deepEqual(denied.counters, {
    candidate: 0,
    journal_creates: 0,
    credential: 0,
    transport: 0,
  });

  const mismatchAuthorization = authorization({
    runtime_source_sha256: "0".repeat(64),
  });
  const mismatchPath = writeAuthorization(temporaryRoot, mismatchAuthorization);
  const mismatch = dependencies();
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-first-environment", "--authorization", mismatchPath],
      mismatch.values,
    ),
    { exit_code: 1, code: "FIRST_ENVIRONMENT_SUPERVISOR_SOURCE_MISMATCH" },
  );
  assert.deepEqual(mismatch.counters, {
    candidate: 0,
    journal_creates: 0,
    credential: 0,
    transport: 0,
  });

  const missingBindingsPath = writeAuthorization(
    mkdtempSync(path.join(temporaryRoot, "missing-bindings-")),
    authorization(),
  );
  const missingBindings = dependencies();
  delete missingBindings.values.load_credential;
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-first-environment", "--authorization", missingBindingsPath],
      missingBindings.values,
    ),
    {
      exit_code: 1,
      code: "FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED",
    },
  );
  assert.deepEqual(missingBindings.counters, {
    candidate: 0,
    journal_creates: 0,
    credential: 0,
    transport: 0,
  });

  const successPath = writeAuthorization(
    mkdtempSync(path.join(temporaryRoot, "success-")),
    authorization(),
  );
  const success = dependencies();
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-first-environment", "--authorization", successPath],
      success.values,
    ),
    { exit_code: 0, code: "FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE" },
  );
  assert.deepEqual(success.counters, {
    candidate: 1,
    journal_creates: 1,
    credential: 1,
    transport: 3,
  });
  assert.deepEqual(success.output, [{
    status: "PASS",
    code: "FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE",
    environment_creates: 1,
    environment_identity_reads: 1,
    environment_deletes: 1,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
    zero_residual_owned_state: true,
  }]);

  const replay = await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
    ["--run-first-environment", "--authorization", successPath],
    success.values,
  );
  assert.deepEqual(replay, {
    exit_code: 1,
    code: "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT",
  });
  assert.deepEqual(success.counters, {
    candidate: 2,
    journal_creates: 2,
    credential: 1,
    transport: 3,
  });

  const credentialFailurePath = writeAuthorization(
    mkdtempSync(path.join(temporaryRoot, "credential-failure-")),
    authorization(),
  );
  const credentialFailure = dependencies({ credential: false });
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-first-environment", "--authorization", credentialFailurePath],
      credentialFailure.values,
    ),
    {
      exit_code: 1,
      code: "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
    },
  );
  assert.deepEqual(credentialFailure.counters, {
    candidate: 1,
    journal_creates: 1,
    credential: 1,
    transport: 0,
  });
  assert.equal(credentialFailure.journal.load().retired, true);
  assert.equal(
    credentialFailure.journal.load().value.state.zero_residual,
    true,
  );

  const nativeJournal = memoryJournal();
  const nativeOutput = [];
  const nativeEnvironmentReads = [];
  const nativeProviderReads = [];
  const nativeFetches = [];
  const nativeProviderAuth = Buffer.from("SYNTHETIC_NATIVE_VERCEL", "utf8");
  const nativeEnvironment = new Proxy({
    ADMIN_PASSWORD: "SYNTHETIC_NATIVE_ADMIN",
  }, {
    get(target, property, receiver) {
      nativeEnvironmentReads.push(property);
      assert.equal(property, "ADMIN_PASSWORD");
      assert.equal(receiver === nativeEnvironment, true);
      return target.ADMIN_PASSWORD;
    },
    ownKeys() {
      throw new Error("NATIVE_ENVIRONMENT_ENUMERATION_FORBIDDEN");
    },
  });
  const nativeDependencies =
    createAdminV1OfficialFirstEnvironmentNativeDependencies({
      repository_root: ROOT,
      supervisor_path: SUPERVISOR_PATH,
      now_epoch_ms: NOW,
      allow_hermetic_test: true,
      environment: nativeEnvironment,
      read_provider_auth() {
        nativeProviderReads.push("VERCEL_CLI_AUTH_JSON");
        return nativeProviderAuth;
      },
      async fetch_impl(url, init) {
        nativeFetches.push({ method: init.method, url });
        assert.equal(url.startsWith("https://api.vercel.com/"), true);
        assert.equal(init.redirect, "error");
        if (init.method === "POST") {
          assert.equal(JSON.parse(init.body).value, "SYNTHETIC_NATIVE_ADMIN");
          return {
            status: 200,
            async text() {
              return '{"id":"env-native-1"}';
            },
          };
        }
        if (init.method === "GET") {
          return {
            status: 200,
            async text() {
              return canonicalJson({
                id: "env-native-1",
                key: "ADMIN_PASSWORD",
                type: "encrypted",
                target: ["preview"],
                gitBranch: "main",
                projectId: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
                teamId: "team_9POJYxNnjIBbrQ19My8M5yG3",
              });
            },
          };
        }
        assert.equal(init.method, "DELETE");
        return { status: 204, async text() { return ""; } };
      },
      inspect_repository: (record) => structuredClone(record.repository),
      verify_candidate(record) {
        return {
          verified: true,
          candidate_identity_sha256: record.candidate_identity_sha256,
          manifest_sha256: record.manifest_sha256,
          member_count:
            record.authorization_closure.candidate_member_count,
        };
      },
      create_journal() {
        return nativeJournal;
      },
      write_output(value) {
        nativeOutput.push(structuredClone(value));
      },
    });
  assert.deepEqual(Object.keys(nativeDependencies.transport), ["execute"]);
  assert.equal(Object.hasOwn(nativeDependencies.transport, "git"), false);
  const nativePath = writeAuthorization(
    mkdtempSync(path.join(temporaryRoot, "native-success-")),
    authorization(),
  );
  assert.deepEqual(
    await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
      ["--run-first-environment", "--authorization", nativePath],
      nativeDependencies,
    ),
    { exit_code: 0, code: "FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE" },
  );
  assert.deepEqual(nativeEnvironmentReads, ["ADMIN_PASSWORD"]);
  assert.deepEqual(nativeProviderReads, ["VERCEL_CLI_AUTH_JSON"]);
  assert.deepEqual(nativeFetches.map(({ method }) => method), [
    "POST", "GET", "DELETE",
  ]);
  assert.equal(nativeProviderAuth.every((value) => value === 0), true);
  assert.equal(nativeOutput.at(-1)?.status, "PASS");

  let deniedFetches = 0;
  const deniedTransport = createAdminV1OfficialFirstEnvironmentNativeTransport({
    provider_auth: Buffer.from("SYNTHETIC_DENIED", "utf8"),
    async fetch_impl() {
      deniedFetches += 1;
      throw new Error("FETCH_MUST_NOT_RUN");
    },
  });
  assert.deepEqual(Object.keys(deniedTransport), ["execute"]);
  await assert.rejects(
    deniedTransport.execute({
      operation: "create_environment",
      descriptor: {
        service: "PREVIEW",
        method: "POST",
        path: "https://attacker.invalid/",
        body: {},
      },
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_DENIED",
  );
  await assert.rejects(
    deniedTransport.execute({
      operation: "git",
      descriptor: { service: "VERCEL", method: "POST", path: "/", body: {} },
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_NATIVE_TRANSPORT_DENIED",
  );
  assert.equal(deniedFetches, 0);

  console.log(
    "PASS_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_SUPERVISOR " +
      "assertions=31 failures=0 process_start_before_credential=true " +
      "credential_value_reads_before_process_start=0 real_provider_calls=0 " +
      "environment_create_max=1 environment_identity_read_max=1 " +
      "environment_delete_exact_owned_max=1 git_remote_mutations=0 " +
      "database_supabase_reads=0 database_supabase_writes=0 " +
      "storage_rpc_operations=0 full_official_ledger=0 retries=0 replays=0",
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
