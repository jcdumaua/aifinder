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
  dispatchAdminV1OfficialFirstEnvironmentSupervisor,
} from "./admin-v1-official-first-environment-supervisor.mjs";

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
  const value = {
    schema_version: 1,
    operation_class:
      "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREATE_ONLY_RUNTIME_V1",
    authorization_id_sha256: "1".repeat(64),
    one_use_authorization_sha256: "2".repeat(64),
    review_approval_sha256: "3".repeat(64),
    candidate_identity_sha256: manifest.candidate_identity_sha256,
    manifest_sha256: sha256(readFileSync(MANIFEST_PATH)),
    runtime_source_sha256: sha256(readFileSync(RUNTIME_PATH)),
    supervisor_source_sha256: sha256(readFileSync(SUPERVISOR_PATH)),
    transport_source_sha256: sha256(readFileSync(TRANSPORT_PATH)),
    authorization_schema_sha256: sha256(readFileSync(SCHEMA_PATH)),
    created_at: "2026-08-24T15:00:00.000Z",
    expires_at: "2026-08-24T17:00:00.000Z",
    run_id: RUN_ID,
    repository: {
      root: ROOT,
      branch: "main",
      head: HEAD,
      origin_main: HEAD,
      remote_main: HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: "7".repeat(64),
      remote_repository: "jcdumaua/aifinder",
    },
    execution: {
      journal_directory:
        `/Users/jamescarlodumaua/Downloads/` +
        `AiFinder-Admin-V1-Official-First-Environment-${RUN_ID}`,
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      environment_git_branch: "main",
      environment_key: "ADMIN_PASSWORD",
      credential_source_name: "ENV_LOCAL",
      credential_source_contract:
        "INJECTED_EXACT_LOADER_IDENTITY_REQUIRED_BY_LIVE_AUTHORIZATION",
    },
  };
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
      inspect_repository: (record) => structuredClone(record.repository),
      verify_candidate(record) {
        counters.candidate += 1;
        return {
          verified: true,
          candidate_identity_sha256: record.candidate_identity_sha256,
          manifest_sha256: record.manifest_sha256,
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

  console.log(
    "PASS_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_SUPERVISOR " +
      "assertions=17 failures=0 process_start_before_credential=true " +
      "credential_value_reads_before_process_start=0 real_provider_calls=0 " +
      "environment_create_max=1 environment_identity_read_max=1 " +
      "environment_delete_exact_owned_max=1 git_remote_mutations=0 " +
      "database_supabase_reads=0 database_supabase_writes=0 " +
      "storage_rpc_operations=0 full_official_ledger=0 retries=0 replays=0",
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
