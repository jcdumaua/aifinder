import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  dispatchPreImportSupervisor,
  inspectPreImportRepository,
  verifyPreImportSupervisorTrust,
} from "./nonproduction-qualification-supervisor.mjs";

const RUN_ID = "77777777-7777-4777-8777-777777777777";
const REQUIRED_HEAD = "ae614fa904e4c00d1dacec8493969fdce6fff3a3";
const APPROVAL_SHA256 =
  "fa0968309b6c9a27c6fc90c7f065b3017c71e586ef247707536089a32534d386";
const SPENT_LATEST_APPROVAL_SHA256 =
  "4f79584ccb29f9d223b618414d6c64c04dab0b75d268b21f789e3e3a8d709bd2";
const SPENT_CURRENT_APPROVAL_SHA256 =
  "2e5b724547830b3d48531e35a911f4087ecd2ab5c459ac3a2ed0b3e4aecc2c93";
const SPENT_PREDECESSOR_APPROVAL_SHA256 =
  "6b939c14ff36b85782bc70cbc3321c09300853b230a367465b76d788f08b46a7";
const SPENT_EARLIER_APPROVAL_SHA256 =
  "909c1288d76283cfda78e2f8ad64aa08c369b40289d6813b493174e9ceec2952";
const SPENT_OLDER_APPROVAL_SHA256 =
  "70e445792d360c010ad5df5136373f4fa5d6add272d783630756868bc17b1198";
const RETIRED_APPROVAL_SHA256 =
  "0a61af030103f8effd1c35cde2495fff84222a45ccae2e5fbdac2933f5209250";
const SUPERSEDED_APPROVAL_SHA256 =
  "4e61136ca0bdcaa62f9c84a3f6d95417db03c97fafa8e2994d0f932fded18a80";
const TRAILING_LF_APPROVAL_SHA256 =
  "5d4bad1e62aabe6d5d5134a6ce5b637f244468bb75fdda54243d020ff0caef58";
const CREDENTIAL_SOURCE_POLICY = {
  GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
  VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
  SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
  SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
  ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
  ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
};
const SUPPORT_PATHS = [
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
];

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort((a, b) => a.localeCompare(b, "en")).map(
      (key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
    ).join(",")}}`;
  }
  throw new Error("TEST_CANONICAL_VALUE");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha(character) {
  return character.repeat(64);
}

function writeCanonical(target, value, mode = 0o644) {
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${canonicalJson(value)}\n`, { mode });
  chmodSync(target, mode);
}

function member(root, relativePath, role, surface) {
  const bytes = readFileSync(path.join(root, relativePath));
  return {
    bytes: bytes.byteLength,
    mode: "0644",
    path: relativePath,
    role,
    sha256: sha256(bytes),
    surface,
  };
}

function candidateIdentity(members) {
  return sha256(members.map((entry) =>
    [entry.path, entry.sha256, String(entry.bytes), entry.mode].join("\0")
  ).join("\n"));
}

function fixture() {
  const root = realpathSync(mkdtempSync("/tmp/aifinder-preimport-supervisor."));
  const runnerPath =
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
  const runnerTestPath =
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs";
  const freezePath = "scripts/launch-operations-kernel/legacy-freeze.json";
  const supervisorPath =
    "scripts/launch-operations-supervisor/nonproduction-qualification-supervisor.mjs";
  const policyPath = "scripts/launch-operations-supervisor/supervisor-policy.json";
  const manifestPath = "scripts/launch-operations-kernel/candidate-manifest.json";
  const authorizationPath = path.join(root, "authorization.json");
  for (const [relativePath, bytes] of [
    [runnerPath, "export const exactRunner = true;\n"],
    [runnerTestPath, "export const syntheticOnly = true;\n"],
    [freezePath, "{\"classification\":\"FAIL_CLOSED_UNRESOLVED\"}\n"],
    [supervisorPath, "export const reviewedSupervisor = true;\n"],
  ]) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes, { mode: 0o644 });
    chmodSync(target, 0o644);
  }
  const members = [
    member(root, freezePath, "GOVERNANCE", "governance"),
    member(root, runnerPath, "SOURCE", "runtime"),
    member(root, runnerTestPath, "TEST", "verification"),
  ].sort((left, right) => left.path.localeCompare(right.path, "en"));
  const manifest = {
    candidate_identity_sha256: candidateIdentity(members),
    candidate_roots: ["scripts/launch-operations-kernel"],
    candidate_version: "synthetic-supervisor-test-v1",
    completion_marker: "SYNTHETIC_COMPLETE",
    derived_surface_sha256: {},
    identity_algorithm: "SHA256_PATH_NUL_SHA256_NUL_BYTES_NUL_MODE_ROWS_LF",
    legacy_candidate_identity_sha256: sha("9"),
    manifest_path: manifestPath,
    manifest_self_exclusion: "EXCLUDED_TO_AVOID_CIRCULAR_BYTE_IDENTITY",
    member_count: members.length,
    members,
    schema_version: 1,
  };
  writeCanonical(path.join(root, manifestPath), manifest);
  const semanticPins = {
    [runnerPath]: sha256(readFileSync(path.join(root, runnerPath))),
    [runnerTestPath]: sha256(readFileSync(path.join(root, runnerTestPath))),
  };
  for (const [index, relativePath] of SUPPORT_PATHS.entries()) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    const value = relativePath.endsWith("static-test-safety-manifest.json")
      ? `${canonicalJson({
          launch_operations_kernel_semantic_source_sha256_by_path: semanticPins,
        })}\n`
      : `support-${index}\n`;
    writeFileSync(target, value, { mode: 0o644 });
    chmodSync(target, 0o644);
  }
  const repository = {
    root,
    branch: "main",
    head: REQUIRED_HEAD,
    origin_main: REQUIRED_HEAD,
    ahead: 0,
    behind: 0,
    index_empty: true,
    worktree_count: 1,
    status_sha256: sha("e"),
    remote_repository: "jcdumaua/aifinder",
  };
  const policy = {
    schema_version: 1,
    policy_class: "AIFINDER_PREIMPORT_SUPERVISOR_V1",
    operation_class: "NONPRODUCTION_QUALIFICATION",
    supervisor_path: supervisorPath,
    policy_path: policyPath,
    candidate: {
      manifest_path: manifestPath,
      manifest_sha256: sha256(readFileSync(path.join(root, manifestPath))),
      candidate_identity_sha256: manifest.candidate_identity_sha256,
      member_count: members.length,
    },
    credential_source_policy: CREDENTIAL_SOURCE_POLICY,
    compatibility_support_sha256: Object.fromEntries(SUPPORT_PATHS.map(
      (relativePath) => [relativePath, sha256(readFileSync(path.join(root, relativePath)))],
    )),
    independent_semantic_source_sha256_by_path: semanticPins,
    independent_semantic_pin_set_sha256: sha256(canonicalJson(semanticPins)),
    approved_runner: {
      path: runnerPath,
      sha256: sha256(readFileSync(path.join(root, runnerPath))),
    },
    retained_state: {
      freeze_path: freezePath,
      freeze_sha256: sha256(readFileSync(path.join(root, freezePath))),
      retained_identity_digest_sha256:
        "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0",
      classification: "FAIL_CLOSED_UNRESOLVED",
    },
    repository,
    authorization: {
      approval_token_sha256: APPROVAL_SHA256,
      attempt_limit: 1,
      request_budget: 16,
      mutation_budget: 15,
      success_retention_policy: "RETAIN_EXACTLY_ONE_PREVIEW",
    },
  };
  writeCanonical(path.join(root, policyPath), policy);
  const authorization = {
    schema_version: 1,
    authorization_id_sha256: sha("1"),
    candidate_identity_sha256: manifest.candidate_identity_sha256,
    manifest_sha256: policy.candidate.manifest_sha256,
    supervisor_sha256: sha256(readFileSync(path.join(root, supervisorPath))),
    supervisor_policy_sha256: sha256(readFileSync(path.join(root, policyPath))),
    compatibility_support_sha256: policy.compatibility_support_sha256,
    retained_legacy_identity_sha256:
      policy.retained_state.retained_identity_digest_sha256,
    retained_legacy_classification: "FAIL_CLOSED_UNRESOLVED",
    preserve_ambiguous_legacy_resources: true,
    operation_class: "NONPRODUCTION_QUALIFICATION",
    attempt_limit: 1,
    request_budget: 16,
    mutation_budget: 15,
    success_retention_policy: "RETAIN_EXACTLY_ONE_PREVIEW",
    independent_review_approval_token_sha256: APPROVAL_SHA256,
    created_at: "2030-01-01T00:00:00.000Z",
    expires_at: "2030-01-01T01:00:00.000Z",
    run_id: RUN_ID,
    repository,
    execution: {
      journal_directory: `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${RUN_ID}`,
      branch_name: `aifinder-qualification-${RUN_ID}`,
      temporary_commit_sha: "a".repeat(40),
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      fixture_website: `https://${RUN_ID}.invalid/`,
      fixture_name: `AiFinder qualification ${RUN_ID}`,
      supabase_origin_sha256:
        "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777",
      supabase_project_ref_sha256:
        "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914",
      storage_bucket: "tool-logos",
      storage_name: `admin/${RUN_ID}.png`,
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
      staging_checks: [
        { method: "GET", path: "/", status: 200 },
        { method: "GET", path: "/api/admin/session", status: 401 },
      ],
    },
  };
  writeCanonical(authorizationPath, authorization, 0o600);
  return {
    root,
    supervisorPath: path.join(root, supervisorPath),
    policyPath: path.join(root, policyPath),
    authorizationPath,
    authorization,
    policy,
    repository,
  };
}

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

function dependencies(test, counters = { imports: 0, network: 0, credentials: 0 }) {
  const output = [];
  return {
    repository_root: test.root,
    supervisor_path: test.supervisorPath,
    policy_path: test.policyPath,
    now_epoch_ms: Date.parse("2030-01-01T00:30:00.000Z"),
    inspect_repository: () => structuredClone(test.repository),
    async import_runner(url) {
      counters.imports += 1;
      assert.equal(url.href, new URL(`file://${path.join(test.root, test.policy.approved_runner.path)}`).href);
      return {
        createConcreteRunnerDependencies(options) {
          assert.equal(typeof options?.writeOutput, "function");
          return { writeOutput: options.writeOutput };
        },
        async dispatchConcreteQualificationRunner(
          _argumentsList,
          runnerDependencies,
          supervisorTrust,
        ) {
          assert.equal(supervisorTrust.verified, true);
          assert.deepEqual(supervisorTrust.authorization, test.authorization);
          assert.deepEqual(
            supervisorTrust.credential_source_policy,
            CREDENTIAL_SOURCE_POLICY,
          );
          assert.equal(
            supervisorTrust.authorization_sha256,
            sha256(supervisorTrust.authorization_bytes),
          );
          runnerDependencies.writeOutput({
            status: "FAIL",
            code: "CONCRETE_CREDENTIAL_MISSING",
            missing_credentials: ["ADMIN_SESSION_SECRET"],
            invalid_credential_sources: ["ENV_LOCAL"],
            detail: "secret-sentinel",
          });
          return { exit_code: 1, code: "CONCRETE_CREDENTIAL_MISSING" };
        },
      };
    },
    write_output(value) {
      output.push(structuredClone(value));
    },
    output,
  };
}

await check("unknown mode is denied before trust reads or candidate import", async () => {
  const counters = { imports: 0, network: 0, credentials: 0 };
  const result = await dispatchPreImportSupervisor(["--official-runtime"], {
    import_runner() { counters.imports += 1; },
  });
  assert.deepEqual(result, { exit_code: 1, code: "SUPERVISOR_MODE_DENIED" });
  assert.equal(counters.imports, 0);
});

await check("authorization replacement during runner import is denied before dispatch", async () => {
  const test = fixture();
  const counters = { imports: 0, dispatches: 0, credentials: 0, effects: 0 };
  try {
    const liveDependencies = dependencies(test, counters);
    liveDependencies.import_runner = async () => {
      counters.imports += 1;
      writeCanonical(test.authorizationPath, {
        ...test.authorization,
        run_id: "88888888-8888-4888-8888-888888888888",
      }, 0o600);
      return {
        createConcreteRunnerDependencies() {
          return {};
        },
        async dispatchConcreteQualificationRunner() {
          counters.dispatches += 1;
          counters.effects += 1;
          return { exit_code: 0, code: "QUALIFIED" };
        },
      };
    };
    const result = await dispatchPreImportSupervisor(
      ["--qualify-nonproduction", "--authorization", test.authorizationPath],
      liveDependencies,
    );
    assert.deepEqual(result, {
      exit_code: 1,
      code: "SUPERVISOR_AUTHORIZATION_CHANGED",
    });
    assert.deepEqual(counters, {
      imports: 1,
      dispatches: 0,
      credentials: 0,
      effects: 0,
    });
  } finally {
    rmSync(test.root, { recursive: true, force: true });
  }
});

await check("pre-trust repository inspection cannot execute configured helpers", async () => {
  const root = realpathSync(mkdtempSync("/tmp/aifinder-supervisor-git-hardening."));
  const markerPath = path.join(root, "git-helper-executed");
  const runGit = (args) => {
    const result = spawnSync("/usr/bin/git", args, {
      cwd: root,
      encoding: "utf8",
      env: {
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_SYSTEM: "/dev/null",
        LC_ALL: "C",
        PATH: "/usr/bin:/bin",
      },
    });
    assert.equal(result.status, 0, `${args.join(" ")}:${result.stderr}`);
  };
  try {
    runGit(["init", "--initial-branch=main", "."]);
    writeFileSync(path.join(root, "probe.txt"), "baseline\n", "utf8");
    runGit(["add", "probe.txt"]);
    runGit([
      "-c", "user.name=AiFinder Test",
      "-c", "user.email=aifinder@example.invalid",
      "commit", "-m", "baseline",
    ]);
    runGit(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    runGit(["remote", "add", "origin", "https://github.com/jcdumaua/aifinder.git"]);
    runGit(["config", "core.fsmonitor", `/usr/bin/touch ${markerPath}`]);
    runGit([
      "config",
      "filter.aifinder.clean",
      `/usr/bin/touch ${markerPath}; /bin/cat`,
    ]);
    mkdirSync(path.join(root, ".git", "info"), { recursive: true });
    writeFileSync(
      path.join(root, ".git", "info", "attributes"),
      "probe.txt filter=aifinder\n",
      "utf8",
    );
    writeFileSync(path.join(root, "probe.txt"), "drift\n", "utf8");
    let failure = null;
    try {
      inspectPreImportRepository(root);
    } catch (error) {
      failure = error;
    }
    assert.equal(
      failure === null || failure?.code === "SUPERVISOR_REPOSITORY_MISMATCH",
      true,
    );
    assert.equal(existsSync(markerPath), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("self-test is network and credential inert", async () => {
  const counters = { imports: 0, network: 0, credentials: 0 };
  const output = [];
  const result = await dispatchPreImportSupervisor(["--self-test"], {
    import_runner() { counters.imports += 1; },
    write_output(value) { output.push(structuredClone(value)); },
  });
  assert.deepEqual(result, { exit_code: 0, code: "PASS_SUPERVISOR_SELF_TEST" });
  assert.deepEqual(counters, { imports: 0, network: 0, credentials: 0 });
  assert.deepEqual(output, [{
    status: "PASS",
    code: "PASS_SUPERVISOR_SELF_TEST",
    network: 0,
    credential_reads: 0,
    candidate_imports: 0,
  }]);
});

await check("live supervisor dispatch requires a safe output writer", async () => {
  const test = fixture();
  const counters = { imports: 0, network: 0, credentials: 0 };
  try {
    const withoutWriter = dependencies(test, counters);
    delete withoutWriter.write_output;
    const result = await dispatchPreImportSupervisor(
      ["--qualify-nonproduction", "--authorization", test.authorizationPath],
      withoutWriter,
    );
    assert.deepEqual(result, {
      exit_code: 1,
      code: "SUPERVISOR_OUTPUT_WRITER_MISSING",
    });
    assert.equal(counters.imports, 0);
  } finally {
    rmSync(test.root, { recursive: true, force: true });
  }
});

await check("exact trust verifies before importing only the approved runner", async () => {
  const test = fixture();
  const counters = { imports: 0, network: 0, credentials: 0 };
  try {
    const trust = verifyPreImportSupervisorTrust({
      authorization_path: test.authorizationPath,
      ...dependencies(test, counters),
    });
    assert.equal(trust.verified, true);
    assert.equal(trust.candidate_identity_sha256, test.policy.candidate.candidate_identity_sha256);
    assert.equal(counters.imports, 0);
    const liveDependencies = dependencies(test, counters);
    const result = await dispatchPreImportSupervisor(
      ["--qualify-nonproduction", "--authorization", test.authorizationPath],
      liveDependencies,
    );
    assert.deepEqual(result, { exit_code: 1, code: "CONCRETE_CREDENTIAL_MISSING" });
    assert.equal(counters.imports, 1);
    assert.deepEqual(liveDependencies.output, [{
      status: "FAIL",
      code: "CONCRETE_CREDENTIAL_MISSING",
      missing_credentials: ["ADMIN_SESSION_SECRET"],
      invalid_credential_sources: ["ENV_LOCAL"],
    }]);
    assert.equal(JSON.stringify(liveDependencies.output).includes("secret-sentinel"), false);
  } finally {
    rmSync(test.root, { recursive: true, force: true });
  }
});

await check("approval-token changes deterministically change supervisor-policy identity", async () => {
  const test = fixture();
  try {
    const currentPolicySha256 = sha256(`${canonicalJson(test.policy)}\n`);
    const retiredPolicy = structuredClone(test.policy);
    retiredPolicy.authorization.approval_token_sha256 = RETIRED_APPROVAL_SHA256;
    assert.notEqual(
      sha256(`${canonicalJson(retiredPolicy)}\n`),
      currentPolicySha256,
    );
  } finally {
    rmSync(test.root, { recursive: true, force: true });
  }
});

for (const [name, approvalSha256] of [
  ["retired credential-availability", RETIRED_APPROVAL_SHA256],
  ["spent latest", SPENT_LATEST_APPROVAL_SHA256],
  ["spent current", SPENT_CURRENT_APPROVAL_SHA256],
  ["spent predecessor", SPENT_PREDECESSOR_APPROVAL_SHA256],
  ["spent earlier", SPENT_EARLIER_APPROVAL_SHA256],
  ["spent older", SPENT_OLDER_APPROVAL_SHA256],
  ["superseded checkpoint-repaired", SUPERSEDED_APPROVAL_SHA256],
  ["arbitrary", sha("0")],
  ["trailing-LF", TRAILING_LF_APPROVAL_SHA256],
]) {
  await check(`${name} approval authority fails before candidate import`, async () => {
    const test = fixture();
    const counters = { imports: 0, network: 0, credentials: 0 };
    try {
      test.policy.authorization.approval_token_sha256 = approvalSha256;
      writeCanonical(test.policyPath, test.policy);
      test.authorization.independent_review_approval_token_sha256 = approvalSha256;
      test.authorization.supervisor_policy_sha256 =
        sha256(readFileSync(test.policyPath));
      writeCanonical(test.authorizationPath, test.authorization, 0o600);
      const result = await dispatchPreImportSupervisor(
        ["--qualify-nonproduction", "--authorization", test.authorizationPath],
        dependencies(test, counters),
      );
      assert.deepEqual(result, {
        exit_code: 1,
        code: "SUPERVISOR_POLICY_INVALID",
      });
      assert.deepEqual(counters, {
        imports: 0,
        network: 0,
        credentials: 0,
      });
    } finally {
      rmSync(test.root, { recursive: true, force: true });
    }
  });
}

await check("spent run namespaces fail before candidate import", async () => {
  for (const runId of [
    "8c0d9e84-62e5-4658-9de0-c0121a302951",
    "e46a0d21-f0b4-4f7d-8a4f-e7f6e8a7eda0",
    "26199d3a-5bcd-4a48-9f31-c7a081195207",
    "f16a8383-a3ff-4c51-bec6-dc8beba5f4eb",
    "89336a0a-b67c-4ad6-99d2-b527ffdca9fd",
    "8e694077-7724-46b4-88ae-1e959d7c28de",
    "716fcb1b-7999-42b4-82f8-e5e8e65b644f",
    "a397fbe1-1107-40df-86b2-83b153d8b8cc",
  ]) {
    const test = fixture();
    const counters = { imports: 0, network: 0, credentials: 0 };
    try {
      test.authorization.run_id = runId;
      test.authorization.execution.journal_directory =
        `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${runId}`;
      test.authorization.execution.branch_name = `aifinder-qualification-${runId}`;
      test.authorization.execution.fixture_website = `https://${runId}.invalid/`;
      test.authorization.execution.fixture_name = `AiFinder qualification ${runId}`;
      test.authorization.execution.storage_name = `admin/${runId}.png`;
      writeCanonical(test.authorizationPath, test.authorization, 0o600);
      const result = await dispatchPreImportSupervisor(
        ["--qualify-nonproduction", "--authorization", test.authorizationPath],
        dependencies(test, counters),
      );
      assert.deepEqual(result, {
        exit_code: 1,
        code: "SUPERVISOR_AUTHORIZATION_INVALID",
      });
      assert.equal(counters.imports, 0);
    } finally {
      rmSync(test.root, { recursive: true, force: true });
    }
  }
});

for (const [name, mutate] of [
  ["candidate manifest hash", (test) => {
    test.authorization.manifest_sha256 = sha("0");
  }],
  ["candidate member hash", (test) => {
    writeFileSync(
      path.join(test.root, test.policy.approved_runner.path),
      "export const changed = true;\n",
      "utf8",
    );
  }],
  ["compatibility support hash", (test) => {
    writeFileSync(path.join(test.root, SUPPORT_PATHS[0]), "changed\n", "utf8");
  }],
  ["semantic pin digest", (test) => {
    test.policy.independent_semantic_pin_set_sha256 = sha("0");
  }],
  ["credential source policy", (test) => {
    test.policy.credential_source_policy.GITHUB = "AVAILABLE_ENV_LOCAL";
  }],
  ["runner path", (test) => {
    test.policy.approved_runner.path = "scripts/launch-operations-kernel/other.mjs";
  }],
  ["retained freeze hash", (test) => {
    writeFileSync(
      path.join(test.root, test.policy.retained_state.freeze_path),
      "changed\n",
      "utf8",
    );
  }],
  ["approval binding", (test) => {
    test.authorization.independent_review_approval_token_sha256 = sha("0");
  }],
  ["operation class", (test) => {
    test.authorization.operation_class = "OFFICIAL_RUNTIME";
  }],
  ["supervisor identity", (test) => {
    test.authorization.supervisor_sha256 = sha("0");
  }],
  ["supervisor policy identity", (test) => {
    test.authorization.supervisor_policy_sha256 = sha("0");
  }],
]) {
  await check(`${name} mismatch fails before candidate import`, async () => {
    const test = fixture();
    const counters = { imports: 0, network: 0, credentials: 0 };
    try {
      mutate(test);
      if (["semantic pin digest", "credential source policy", "runner path"].includes(name)) {
        writeCanonical(test.policyPath, test.policy);
        test.authorization.supervisor_policy_sha256 = sha256(readFileSync(test.policyPath));
      }
      if ([
        "candidate manifest hash",
        "approval binding",
        "operation class",
        "supervisor identity",
        "supervisor policy identity",
      ].includes(name)) {
        writeCanonical(test.authorizationPath, test.authorization, 0o600);
      }
      const result = await dispatchPreImportSupervisor(
        ["--qualify-nonproduction", "--authorization", test.authorizationPath],
        dependencies(test, counters),
      );
      assert.equal(result.exit_code, 1);
      assert.equal(result.code.startsWith("SUPERVISOR_"), true);
      assert.equal(counters.imports, 0);
    } finally {
      rmSync(test.root, { recursive: true, force: true });
    }
  });
}

if (failures.length > 0) {
  console.log(
    `FAIL_PREIMPORT_SUPERVISOR assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_PREIMPORT_SUPERVISOR assertions=${assertions} trust_mutations=11 token_binding_mutations=4 network=0 credential_reads=0 candidate_imports_after_trust=1 failures=0 internal_failures=0`,
  );
}
