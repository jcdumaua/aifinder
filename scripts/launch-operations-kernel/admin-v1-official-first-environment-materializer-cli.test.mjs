import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  linkSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { canonicalJson } from "./canonical.mjs";
import {
  dispatchAdminV1OfficialFirstEnvironmentMaterializerCli,
} from "./admin-v1-official-first-environment-materializer-cli.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sha = (character) => character.repeat(64);
const HEAD = "4d82a2d215e2eeb0ab5dabba1a2d48e00c35bbb8";
const NOW = Date.parse("2026-08-25T20:00:00.000Z");
const SYNTHETIC_IDS = Object.freeze([
  "123e4567-e89b-42d3-a456-426614174000",
  "223e4567-e89b-42d3-a456-426614174001",
]);
const APPROVAL_TEXT = "Synthetic James approval fixture.\n";

function observation(overrides = {}) {
  return {
    request_schema_version: 1,
    authorization_mode: "HERMETIC_TEST_ONLY",
    phase_identity:
      "ADMIN_V1_OFFICIAL_RUNTIME_FIRST_ENVIRONMENT_CREATE_ONLY_FUTURE_LIVE_V1",
    reviewed_package_sha256: sha("1"),
    reviewed_package_bytes: 15841,
    gemini_approval_token_sha256: sha("2"),
    direct_james_approval_sha256: sha256(APPROVAL_TEXT),
    requested_validity_seconds: 7200,
    candidate_identity_sha256: sha("4"),
    manifest_sha256: sha("5"),
    candidate_member_count: 51,
    runtime_source_sha256: sha("6"),
    supervisor_source_sha256: sha("7"),
    transport_source_sha256: sha("8"),
    transport_dependency_source_sha256: sha("8"),
    authorization_schema_sha256: sha("a"),
    materializer_source_sha256: sha("b"),
    credential_loader_source_sha256: sha("c"),
    supervisor_policy_sha256: sha("d"),
    independent_semantic_pin_set_sha256: sha("e"),
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: HEAD,
      tree: "d92fecc070ab0bb0338a917b07ab9361129d5aa9",
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
      deployment_id: "dpl_9vhPqXvXhBfjVY6F9HMZogFPc6mW",
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      deployed_commit: HEAD,
      branch: "main",
      target: "production",
      source: "git/github",
      state: "READY",
    },
    credential_sources: {
      environment_value: {
        key_name: "ADMIN_PASSWORD",
        source_name: "PROCESS_ENV_EXACT_KEY",
      },
      provider_auth: {
        key_name: "token",
        source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
      },
    },
    capability_budget: {
      credential_value_reads: 2,
      environment_creates: 1,
      environment_deletes: 1,
      environment_identity_reads: 1,
      full_official_ledger: 0,
      git_writes: 0,
      replays: 0,
      retries: 0,
      second_invocations: 0,
      storage_rpc_actions: 0,
      supabase_reads: 0,
      supabase_writes: 0,
    },
    contracts: {
      authorization_spend_boundary: "PROCESS_START",
      cleanup: "EXACT_OWNED_ENVIRONMENT_ONLY",
      journal: "DURABLE_FAIL_CLOSED",
      recovery: "RECOVERY_PENDING_WHEN_OWNERSHIP_OR_CLEANUP_UNPROVEN",
    },
    ...overrides,
  };
}

function writePrivate(filePath, bytes) {
  writeFileSync(filePath, bytes, { mode: 0o600 });
  chmodSync(filePath, 0o600);
}

function makeFixture({ request = observation(), approval = APPROVAL_TEXT } = {}) {
  const root = realpathSync(mkdtempSync(path.join(
    tmpdir(),
    "aifinder-first-environment-native-materializer-test-",
  )));
  chmodSync(root, 0o700);
  const directory = path.join(
    root,
    "AiFinder-Admin-V1-Official-First-Environment-Authorization-Test",
  );
  mkdirSync(directory, { mode: 0o700 });
  chmodSync(directory, 0o700);
  const requestPath = path.join(directory, "request.json");
  const approvalPath = path.join(directory, "approval.txt");
  writePrivate(requestPath, `${canonicalJson(request)}\n`);
  writePrivate(approvalPath, approval);
  return { root, directory, requestPath, approvalPath };
}

function deterministicDependencies(root) {
  let idIndex = 0;
  return {
    allow_hermetic_test: true,
    allowed_output_root: root,
    now_epoch_ms: () => NOW,
    random_uuid: () => SYNTHETIC_IDS[idIndex++],
  };
}

function dispatch(fixture, dependencies = deterministicDependencies(fixture.root), extra = []) {
  return dispatchAdminV1OfficialFirstEnvironmentMaterializerCli({
    arguments_list: [
      "--materialize",
      "--request",
      fixture.requestPath,
      "--approval-artifact",
      fixture.approvalPath,
      ...extra,
    ],
    dependencies,
  });
}

function assertCode(callback, code) {
  assert.throws(callback, (error) => error?.code === code);
}

const roots = [];
try {
  const positive = makeFixture();
  roots.push(positive.root);
  const result = dispatch(positive);
  assert.equal(result.classification, "HERMETIC_TEST_ONLY");
  assert.equal(result.authorization_id, SYNTHETIC_IDS[0]);
  assert.equal(result.run_id, SYNTHETIC_IDS[1]);
  assert.equal(result.created_at, "2026-08-25T20:00:00.000Z");
  assert.equal(result.expires_at, "2026-08-25T22:00:00.000Z");
  assert.equal(result.output_path,
    path.join(positive.directory, `authorization-${SYNTHETIC_IDS[0]}.json`));
  assert.equal(lstatSync(result.output_path).mode & 0o777, 0o600);
  assert.equal(result.authorization_sha256,
    sha256(readFileSync(result.output_path)));
  assert.equal(result.credential_value_reads, 0);
  assert.equal(result.provider_calls, 0);
  assert.equal(result.network_calls, 0);

  const malformed = makeFixture();
  roots.push(malformed.root);
  writePrivate(malformed.requestPath, "{not-json}\n");
  assertCode(() => dispatch(malformed), "FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");

  const unknown = makeFixture({ request: { ...observation(), surprise: true } });
  roots.push(unknown.root);
  assertCode(() => dispatch(unknown), "FIRST_ENVIRONMENT_NATIVE_REQUEST_INVALID");

  const credential = makeFixture({
    request: { ...observation(), credential_value: "synthetic-secret" },
  });
  roots.push(credential.root);
  assertCode(() => dispatch(credential), "FIRST_ENVIRONMENT_NATIVE_REQUEST_CREDENTIAL_FIELD");

  const missingApproval = makeFixture();
  roots.push(missingApproval.root);
  rmSync(missingApproval.approvalPath);
  assertCode(
    () => dispatch(missingApproval),
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_FILE_INVALID",
  );

  const digestMismatch = makeFixture({ approval: "different synthetic text" });
  roots.push(digestMismatch.root);
  assertCode(
    () => dispatch(digestMismatch),
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_DIGEST_MISMATCH",
  );

  const newlineMismatch = makeFixture({ approval: APPROVAL_TEXT.trimEnd() });
  roots.push(newlineMismatch.root);
  assertCode(
    () => dispatch(newlineMismatch),
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_DIGEST_MISMATCH",
  );

  const requestSymlink = makeFixture();
  roots.push(requestSymlink.root);
  const realRequest = path.join(requestSymlink.directory, "request-real.json");
  writePrivate(realRequest, readFileSync(requestSymlink.requestPath));
  rmSync(requestSymlink.requestPath);
  symlinkSync(realRequest, requestSymlink.requestPath);
  assertCode(
    () => dispatch(requestSymlink),
    "FIRST_ENVIRONMENT_NATIVE_REQUEST_FILE_INVALID",
  );

  const approvalSymlink = makeFixture();
  roots.push(approvalSymlink.root);
  const realApproval = path.join(approvalSymlink.directory, "approval-real.txt");
  writePrivate(realApproval, APPROVAL_TEXT);
  rmSync(approvalSymlink.approvalPath);
  symlinkSync(realApproval, approvalSymlink.approvalPath);
  assertCode(
    () => dispatch(approvalSymlink),
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_FILE_INVALID",
  );

  const broadMode = makeFixture();
  roots.push(broadMode.root);
  chmodSync(broadMode.requestPath, 0o644);
  assertCode(
    () => dispatch(broadMode),
    "FIRST_ENVIRONMENT_NATIVE_REQUEST_FILE_INVALID",
  );

  const hardLink = makeFixture();
  roots.push(hardLink.root);
  linkSync(hardLink.approvalPath, path.join(hardLink.directory, "approval-link.txt"));
  assertCode(
    () => dispatch(hardLink),
    "FIRST_ENVIRONMENT_NATIVE_APPROVAL_FILE_INVALID",
  );

  const malformedDeployment = makeFixture({
    request: observation({
      deployment: { ...observation().deployment, deployment_id: "dpl_bad-value" },
    }),
  });
  roots.push(malformedDeployment.root);
  assertCode(() => dispatch(malformedDeployment), "FIRST_ENVIRONMENT_MATERIALIZER_INPUT");

  const substitutedAnchor = makeFixture({
    request: observation({
      deployment: { ...observation().deployment, project_id: "prj_attacker" },
    }),
  });
  roots.push(substitutedAnchor.root);
  assertCode(() => dispatch(substitutedAnchor), "FIRST_ENVIRONMENT_MATERIALIZER_INPUT");

  const commitMismatch = makeFixture({
    request: observation({
      deployment: { ...observation().deployment, deployed_commit: "0".repeat(40) },
    }),
  });
  roots.push(commitMismatch.root);
  assertCode(() => dispatch(commitMismatch), "FIRST_ENVIRONMENT_MATERIALIZER_INPUT");

  const liveWithoutOptIn = makeFixture({
    request: observation({ authorization_mode: "LIVE" }),
  });
  roots.push(liveWithoutOptIn.root);
  assertCode(
    () => dispatch(liveWithoutOptIn, {
      ...deterministicDependencies(liveWithoutOptIn.root),
      allow_hermetic_test: false,
    }),
    "FIRST_ENVIRONMENT_NATIVE_LIVE_OPT_IN_REQUIRED",
  );

  const liveWithInjectedProviders = makeFixture({
    request: observation({ authorization_mode: "LIVE" }),
  });
  roots.push(liveWithInjectedProviders.root);
  assertCode(
    () => dispatch(
      liveWithInjectedProviders,
      {
        ...deterministicDependencies(liveWithInjectedProviders.root),
        allow_hermetic_test: false,
      },
      ["--allow-live"],
    ),
    "FIRST_ENVIRONMENT_NATIVE_LIVE_DEPENDENCY_OVERRIDE",
  );

  const selfTestRoot = realpathSync(mkdtempSync(path.join(
    tmpdir(),
    "aifinder-first-environment-native-self-test-",
  )));
  roots.push(selfTestRoot);
  const beforeSelfTest = readdirSync(selfTestRoot);
  const selfTest = dispatchAdminV1OfficialFirstEnvironmentMaterializerCli({
    arguments_list: ["--self-test"],
    dependencies: {
      allow_hermetic_test: true,
      allowed_output_root: selfTestRoot,
      now_epoch_ms: () => NOW,
      random_uuid: () => {
        throw new Error("SELF_TEST_MUST_NOT_GENERATE_IDS");
      },
    },
  });
  assert.equal(selfTest.classification, "SELF_TEST_ONLY");
  assert.deepEqual(readdirSync(selfTestRoot), beforeSelfTest);
  assert.equal(selfTest.live_usable_records_created, 0);

  const source = readFileSync(new URL(
    "./admin-v1-official-first-environment-materializer-cli.mjs",
    import.meta.url,
  ), "utf8");
  assert.equal(source.includes("node:child_process"), false);
  assert.equal(source.includes("process.env"), false);
  assert.equal(source.includes("globalThis.fetch"), false);
  assert.equal(source.includes("node:http"), false);
  assert.equal(source.includes("node:https"), false);
  assert.equal(source.includes("readline"), false);
  assert.equal(source.includes("eval("), false);
  assert.equal(source.includes("Function("), false);
  assert.equal(source.includes("createAdminV1OfficialFirstEnvironmentAuthorizationRecord"), true);
  assert.equal(source.includes("writeAdminV1OfficialFirstEnvironmentAuthorizationRecord"), true);
} finally {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
}

console.log(
  "PASS_FIRST_ENVIRONMENT_NATIVE_MATERIALIZER_CLI assertions=45 synthetic_records_created=1 live_records_created=0 credential_value_reads=0 provider_calls=0 network_calls=0",
);
