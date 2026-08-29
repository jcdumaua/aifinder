import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { canonicalJson } from "./canonical.mjs";
import {
  createAdminV1OfficialFirstEnvironmentAuthorizationRecord,
  writeAdminV1OfficialFirstEnvironmentAuthorizationRecord,
} from "./admin-v1-official-first-environment-materializer.mjs";
import {
  validateAdminV1OfficialFirstEnvironmentAuthorization,
} from "./admin-v1-official-first-environment-runtime.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sha = (character) => character.repeat(64);
const HEAD = "d98d4a455021fe666101903bbe92d32ddc776c14";
const RUN_ID = "123e4567-e89b-42d3-a456-426614174000";
const AUTHORIZATION_ID = "223e4567-e89b-42d3-a456-426614174001";
const NOW = Date.parse("2026-08-25T06:00:00.000Z");
const HISTORICAL_DEPLOYMENT_ID = "dpl_2yCcELwLfr2LDejB6FHZaaAWKiuj";
const CURRENT_DEPLOYMENT_ID = "dpl_BLAAXQGkn8RPbJrYQDwQEwW5ELLn";

function request(overrides = {}) {
  return {
    authorization_mode: "HERMETIC_TEST_ONLY",
    phase_identity:
      "ADMIN_V1_OFFICIAL_RUNTIME_FIRST_ENVIRONMENT_CREATE_ONLY_FUTURE_LIVE_V1",
    reviewed_package_sha256: sha("1"),
    reviewed_package_bytes: 15841,
    gemini_approval_token_sha256: sha("2"),
    direct_james_approval_sha256: sha("3"),
    authorization_id: AUTHORIZATION_ID,
    run_id: RUN_ID,
    created_at: "2026-08-25T06:00:00.000Z",
    expires_at: "2026-08-25T08:00:00.000Z",
    candidate_identity_sha256: sha("4"),
    manifest_sha256: sha("5"),
    candidate_member_count: 51,
    runtime_source_sha256: sha("6"),
    supervisor_source_sha256: sha("7"),
    transport_source_sha256: sha("8"),
    transport_dependency_source_sha256: sha("9"),
    authorization_schema_sha256: sha("a"),
    materializer_source_sha256: sha("b"),
    credential_loader_source_sha256: sha("c"),
    supervisor_policy_sha256: sha("d"),
    independent_semantic_pin_set_sha256: sha("e"),
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: HEAD,
      tree: "863f0ef1c34c88be4177ebe4672dc1c4169152f8",
      origin_main: HEAD,
      remote_main: HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: sha("f"),
      remote_repository: "jcdumaua/aifinder",
    },
    deployment: {
      deployment_id: HISTORICAL_DEPLOYMENT_ID,
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      deployed_commit: HEAD,
      branch: "main",
      target: "production",
      source: "git/github",
      state: "READY",
    },
    ...overrides,
  };
}

const first = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
  request: request(),
  now_epoch_ms: NOW,
});
const second = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
  request: request(),
  now_epoch_ms: NOW,
});
const currentDeploymentRequest = request({
  deployment: {
    ...request().deployment,
    deployment_id: CURRENT_DEPLOYMENT_ID,
  },
});
const currentDeployment =
  createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: currentDeploymentRequest,
    now_epoch_ms: NOW,
  });

assert.equal(canonicalJson(first), canonicalJson(second));
assert.equal(
  currentDeployment.authorization_closure.deployment.deployment_id,
  CURRENT_DEPLOYMENT_ID,
);
assert.equal(first.schema_version, 1);
assert.equal(
  first.operation_class,
  "ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_TRUE_CREATE_ONLY_RUNTIME_V1",
);
assert.deepEqual(first.authorization_closure.capability_budget, {
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
});
assert.deepEqual(first.authorization_closure.contracts, {
  authorization_spend_boundary:
    "IMMEDIATELY_BEFORE_FIRST_PROVIDER_CREATE_REQUEST",
  journal: "DURABLE_FAIL_CLOSED",
  recovery: "ACTIVE_UNKNOWN_STATE_ON_AMBIGUOUS_POST_SPEND_RESULT",
  successful_create_residue: "EXPECTED_OWNED_RESOURCE",
});
assert.deepEqual(first.authorization_closure.credential_sources, {
  environment_value: {
    key_name: "ADMIN_PASSWORD",
    source_name: "PROCESS_ENV_EXACT_KEY",
  },
  provider_auth: {
    key_name: "token",
    source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  },
});
assert.equal(first.authorization_closure.repository_tree, request().repository.tree);
assert.equal(first.authorization_closure.deployment.deployment_id,
  HISTORICAL_DEPLOYMENT_ID);
assert.equal(first.transport_source_sha256, sha("8"));
assert.equal(first.authorization_closure.transport_dependency_source_sha256,
  sha("9"));
assert.notEqual(first.transport_source_sha256,
  first.authorization_closure.transport_dependency_source_sha256);
assert.notEqual(
  currentDeployment.one_use_authorization_sha256,
  first.one_use_authorization_sha256,
);
assert.match(canonicalJson(currentDeployment), new RegExp(CURRENT_DEPLOYMENT_ID, "u"));

const materializerSource = readFileSync(new URL(
  "./admin-v1-official-first-environment-materializer.mjs",
  import.meta.url,
), "utf8");
const runtimeSource = readFileSync(new URL(
  "./admin-v1-official-first-environment-runtime.mjs",
  import.meta.url,
), "utf8");
const authorizationSchema = JSON.parse(readFileSync(new URL(
  "./admin-v1-official-first-environment-authorization.schema.json",
  import.meta.url,
), "utf8"));
const deploymentIdSchema = authorizationSchema.properties
  .authorization_closure.properties.deployment.properties.deployment_id;
for (const source of [materializerSource, runtimeSource]) {
  assert.equal(source.includes(HISTORICAL_DEPLOYMENT_ID), false);
  assert.equal(source.includes(CURRENT_DEPLOYMENT_ID), false);
}
assert.deepEqual(deploymentIdSchema, {
  type: "string",
  pattern: "^dpl_[A-Za-z0-9]+$",
});
for (const forbiddenSource of [
  `node:${"child_" + "process"}`,
  `node:${"ht" + "tp"}`,
  `node:${"ht" + "tps"}`,
  `node:${"n" + "et"}`,
  `node:${"t" + "ls"}`,
  `${"process"}.${"env"}`,
  `${"globalThis"}.${"fetch"}`,
]) {
  assert.equal(materializerSource.includes(forbiddenSource), false);
}
assert.equal(
  materializerSource.includes(
    "transport_dependency_source_sha256:\n      request.transport_dependency_source_sha256",
  ),
  true,
);
assert.equal(
  materializerSource.includes(
    "transport_dependency_source_sha256:\n      request.transport_source_sha256",
  ),
  false,
);

for (const deploymentId of ["", "dpl_", "DPL_123", "dpl_bad-value", 42]) {
  assert.throws(
    () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
      request: request({
        deployment: {
          ...currentDeploymentRequest.deployment,
          deployment_id: deploymentId,
        },
      }),
      now_epoch_ms: NOW,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
  );
}

for (const deploymentOverride of [
  { project_id: "prj_wrong" },
  { team_id: "team_wrong" },
  { branch: "preview" },
  { target: "preview" },
  { source: "manual" },
]) {
  assert.throws(
    () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
      request: request({
        deployment: {
          ...currentDeploymentRequest.deployment,
          ...deploymentOverride,
        },
      }),
      now_epoch_ms: NOW,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
  );
}
assert.throws(
  () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: request({
      repository: {
        ...currentDeploymentRequest.repository,
        remote_repository: "attacker/aifinder",
      },
      deployment: currentDeploymentRequest.deployment,
    }),
    now_epoch_ms: NOW,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
);
assert.throws(
  () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: request({
      deployment: {
        ...currentDeploymentRequest.deployment,
        deployed_commit: "0".repeat(40),
      },
    }),
    now_epoch_ms: NOW,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
);
assert.throws(
  () => validateAdminV1OfficialFirstEnvironmentAuthorization({
    ...currentDeployment,
    authorization_closure: {
      ...currentDeployment.authorization_closure,
      deployment: {
        ...currentDeployment.authorization_closure.deployment,
        deployment_id: HISTORICAL_DEPLOYMENT_ID,
      },
    },
  }, {
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
);
assert.match(first.authorization_id_sha256, /^[0-9a-f]{64}$/u);
assert.match(first.review_approval_sha256, /^[0-9a-f]{64}$/u);
assert.match(first.one_use_authorization_sha256, /^[0-9a-f]{64}$/u);
assert.notEqual(first.authorization_id_sha256, first.review_approval_sha256);
assert.notEqual(first.review_approval_sha256, first.one_use_authorization_sha256);
assert.throws(
  () => validateAdminV1OfficialFirstEnvironmentAuthorization(first, {
    now_epoch_ms: NOW,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
);
assert.equal(
  validateAdminV1OfficialFirstEnvironmentAuthorization(first, {
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  }).authorization_closure.authorization_mode,
  "HERMETIC_TEST_ONLY",
);
assert.throws(
  () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: request({ authorization_mode: "LIVE" }),
    now_epoch_ms: NOW,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
);
assert.throws(
  () => validateAdminV1OfficialFirstEnvironmentAuthorization({
    ...first,
    authorization_closure: {
      ...first.authorization_closure,
      candidate_member_count: first.authorization_closure.candidate_member_count + 1,
    },
  }, {
    now_epoch_ms: NOW,
    allow_hermetic_test: true,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_AUTHORIZATION_INVALID",
);

const changedPackage = createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
  request: request({ reviewed_package_sha256: sha("0") }),
  now_epoch_ms: NOW,
});
assert.notEqual(changedPackage.review_approval_sha256, first.review_approval_sha256);
assert.notEqual(
  changedPackage.one_use_authorization_sha256,
  first.one_use_authorization_sha256,
);

assert.throws(
  () => createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    request: { ...request(), unexpected: true },
    now_epoch_ms: NOW,
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_INPUT",
);

const temporaryRoot = realpathSync(mkdtempSync(path.join(
  tmpdir(),
  "aifinder-first-environment-materializer-test-",
)));
try {
  const output = writeAdminV1OfficialFirstEnvironmentAuthorizationRecord({
    directory: temporaryRoot,
    record: first,
  });
  assert.equal(output.mode, "0600");
  assert.equal(output.path,
    path.join(temporaryRoot, `authorization-${AUTHORIZATION_ID}.json`));
  assert.equal(readFileSync(output.path, "utf8"), `${canonicalJson(first)}\n`);
  const metadata = lstatSync(output.path);
  assert.equal(metadata.isFile(), true);
  assert.equal(metadata.isSymbolicLink(), false);
  assert.equal(metadata.nlink, 1);
  assert.equal(metadata.mode & 0o777, 0o600);
  assert.equal(output.sha256, sha256(readFileSync(output.path)));
  assert.throws(
    () => writeAdminV1OfficialFirstEnvironmentAuthorizationRecord({
      directory: temporaryRoot,
      record: first,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_WRITE_FAILED",
  );

  const aliasDirectory = path.join(temporaryRoot, "alias");
  symlinkSync(temporaryRoot, aliasDirectory);
  assert.throws(
    () => writeAdminV1OfficialFirstEnvironmentAuthorizationRecord({
      directory: aliasDirectory,
      record: createAdminV1OfficialFirstEnvironmentAuthorizationRecord({
        request: request({ authorization_id: "323e4567-e89b-42d3-a456-426614174002" }),
        now_epoch_ms: NOW,
      }),
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_MATERIALIZER_OUTPUT_PATH",
  );

  const occupied = path.join(
    temporaryRoot,
    "authorization-423e4567-e89b-42d3-a456-426614174003.json",
  );
  writeFileSync(occupied, "occupied", { mode: 0o600 });
  chmodSync(occupied, 0o600);
  assert.equal(existsSync(occupied), true);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(
  "PASS_FIRST_ENVIRONMENT_MATERIALIZER assertions=57 live_records_created=0 credential_value_reads=0 provider_calls=0",
);
