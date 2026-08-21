import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
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
  CONCRETE_APPROVAL_TOKEN_SHA256,
  CONCRETE_CREDENTIAL_SOURCE_POLICY,
  CONCRETE_OPERATION_CLASS,
  CONCRETE_RETAINED_IDENTITY_SHA256,
  CONCRETE_SUPPORT_PATHS,
} from "./nonproduction-qualification-authorization.mjs";
import {
  createConcreteRunnerDependencies,
  dispatchConcreteQualificationRunner,
  verifyConcreteTemporaryCommit,
  verifyConcretePreEffectAuthorization,
} from "./nonproduction-qualification-runner.mjs";

const REQUIRED_HEAD = "ae614fa904e4c00d1dacec8493969fdce6fff3a3";
const RUN_ID = "22222222-2222-4222-8222-222222222222";
const GIT_REMOTE_URL = "https://github.com/jcdumaua/aifinder.git";
const GIT_EXECUTION_CONTEXT = Object.freeze({
  git_dir: "/private/tmp/aifinder-qualified-git-context",
  object_directory: "/Users/jamescarlodumaua/aifinder/.git/objects",
});
const AUTHORIZATION_PATH =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${RUN_ID}.json`;
function sha(character) {
  return character.repeat(64);
}

function canonicalJsonForTest(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJsonForTest).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort((left, right) =>
      left.localeCompare(right, "en")
    ).map((key) =>
      `${JSON.stringify(key)}:${canonicalJsonForTest(value[key])}`
    ).join(",")}}`;
  }
  throw new Error("TEST_CANONICAL_JSON_INVALID");
}

function supervisorTrust(authorization) {
  const authorizationBytes = Buffer.from(
    `${canonicalJsonForTest(authorization)}\n`,
    "utf8",
  );
  return Object.freeze({
    verified: true,
    authorization: structuredClone(authorization),
    authorization_bytes: authorizationBytes,
    authorization_sha256: createHash("sha256")
      .update(authorizationBytes)
      .digest("hex"),
    credential_source_policy: structuredClone(CONCRETE_CREDENTIAL_SOURCE_POLICY),
    supervisor_sha256: authorization.supervisor_sha256,
    supervisor_policy_sha256: authorization.supervisor_policy_sha256,
  });
}

function localGit(repositoryRoot, args, input = undefined) {
  const result = spawnSync("/usr/bin/git", [
    "-c",
    "user.name=AiFinder Synthetic",
    "-c",
    "user.email=aifinder-synthetic@example.invalid",
    "-C",
    repositoryRoot,
    ...args,
  ], {
    encoding: "utf8",
    env: {
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_SYSTEM: "/dev/null",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin",
    },
    input,
  });
  assert.equal(result.status, 0, `${args.join(" ")}:${result.stderr}`);
  return result.stdout.trim();
}

function syntheticRawGitFixture({ replacement = false, graft = false } = {}) {
  const repositoryRoot = realpathSync(mkdtempSync("/tmp/aifinder-raw-git-repository."));
  const contextRoot = realpathSync(mkdtempSync("/tmp/aifinder-raw-git-context."));
  localGit(repositoryRoot, ["init", "-q"]);
  writeFileSync(path.join(repositoryRoot, "candidate.txt"), "base\n", "utf8");
  localGit(repositoryRoot, ["add", "candidate.txt"]);
  localGit(repositoryRoot, ["commit", "-q", "-m", "base"]);
  const base = localGit(repositoryRoot, ["rev-parse", "HEAD"]);
  writeFileSync(path.join(repositoryRoot, "candidate.txt"), "candidate\n", "utf8");
  localGit(repositoryRoot, ["add", "candidate.txt"]);
  const tree = localGit(repositoryRoot, ["write-tree"]);
  const commit = localGit(
    repositoryRoot,
    ["commit-tree", tree, "-p", base],
    "candidate\n",
  );
  localGit(repositoryRoot, ["read-tree", base]);
  if (replacement) localGit(repositoryRoot, ["replace", commit, base]);
  if (graft) {
    mkdirSync(path.join(repositoryRoot, ".git", "info"), { recursive: true });
    writeFileSync(
      path.join(repositoryRoot, ".git", "info", "grafts"),
      `${commit} ${"f".repeat(40)}\n`,
      "utf8",
    );
  }
  const gitDir = path.join(contextRoot, "git");
  mkdirSync(path.join(gitDir, "objects"), { recursive: true });
  mkdirSync(path.join(gitDir, "refs", "heads"), { recursive: true });
  writeFileSync(
    path.join(gitDir, "config"),
    "[core]\n\tbare = true\n\trepositoryformatversion = 0\n",
    "utf8",
  );
  writeFileSync(path.join(gitDir, "HEAD"), "ref: refs/heads/raw-context\n", "utf8");
  return {
    repositoryRoot,
    contextRoot,
    base,
    commit,
    tree,
    context: {
      git_dir: gitDir,
      object_directory: path.join(repositoryRoot, ".git", "objects"),
    },
  };
}

function record() {
  return {
    schema_version: 1,
    authorization_id_sha256: sha("1"),
    candidate_identity_sha256: sha("2"),
    manifest_sha256: sha("3"),
    supervisor_sha256: sha("a"),
    supervisor_policy_sha256: sha("b"),
    compatibility_support_sha256: Object.fromEntries(
      CONCRETE_SUPPORT_PATHS.map((path, index) => [
        path,
        String(index + 4).repeat(64),
      ]),
    ),
    retained_legacy_identity_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
    retained_legacy_classification: "FAIL_CLOSED_UNRESOLVED",
    preserve_ambiguous_legacy_resources: true,
    operation_class: CONCRETE_OPERATION_CLASS,
    attempt_limit: 1,
    request_budget: 16,
    mutation_budget: 15,
    success_retention_policy: "RETAIN_EXACTLY_ONE_PREVIEW",
    independent_review_approval_token_sha256:
      CONCRETE_APPROVAL_TOKEN_SHA256,
    created_at: "2030-01-01T00:00:00.000Z",
    expires_at: "2030-01-01T01:00:00.000Z",
    run_id: RUN_ID,
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: REQUIRED_HEAD,
      origin_main: REQUIRED_HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: sha("8"),
      remote_repository: "jcdumaua/aifinder",
    },
    execution: {
      journal_directory:
        `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${RUN_ID}`,
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
}

function exactLegacyClassification() {
  return {
    schema_version: 1,
    classification: "FAIL_CLOSED_UNRESOLVED",
    authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
    recovery_state: "EXECUTION_IN_PROGRESS",
    recovery_stage: "PRIOR_RECONCILIATION",
    guard: {
      owner_pid: 12605,
      status: "DEAD",
      recovery_root_binding_exact: true,
    },
    candidate_binding: {
      active_candidate_identity_sha256: sha("9"),
      recovery_candidate_identity_sha256: sha("9"),
      exact: true,
    },
    effects: {
      mutation_intents: [{ kind: "PRIOR_RECONCILIATION", sequence: 1 }],
      data_writes: 0,
      branch_commit_present: false,
      preview_identity_present: false,
      environment_resource_count: 0,
      environment_cleanup_intents: {
        ADMIN_PASSWORD: 0,
        ADMIN_SESSION_SECRET: 0,
      },
      branch_cleanup_intents: 0,
      preview_cleanup_intents: 0,
      terminal_evidence_present: false,
    },
    ownership_ambiguity: true,
    legacy_reconciliation_required: true,
    clean: false,
    qualified: false,
    retained_identity_digest_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
  };
}

function harness(overrides = {}) {
  const authorization = record();
  const calls = {
    authorization_reads: 0,
    candidate_verifications: 0,
    repository_inspections: 0,
    support_hashes: 0,
    temporary_commit_verifications: 0,
    legacy_classifications: 0,
    credential_reads: 0,
    network: 0,
    mutations: 0,
    executions: 0,
    execution_context_preparations: 0,
    writer_leases: 0,
    sequence: [],
  };
  const output = [];
  const dependencies = {
    supervisor_trust: supervisorTrust(authorization),
    now_epoch_ms: Date.parse("2030-01-01T00:30:00.000Z"),
    async readAuthorizationRecord(path) {
      calls.authorization_reads += 1;
      calls.sequence.push("AUTHORIZATION");
      assert.equal(path, AUTHORIZATION_PATH);
      return structuredClone(authorization);
    },
    async verifyCandidate() {
      calls.candidate_verifications += 1;
      calls.sequence.push("CANDIDATE");
      return {
        verified: true,
        source_policy_verified: true,
        activation_source_policy_verified: true,
        candidate_identity_sha256: authorization.candidate_identity_sha256,
        manifest_sha256: authorization.manifest_sha256,
        member_count: 24,
        membership_exact: true,
        legacy_imports: 0,
        live_entrypoints: 1,
      };
    },
    async inspectRepository() {
      calls.repository_inspections += 1;
      calls.sequence.push("REPOSITORY");
      return structuredClone(authorization.repository);
    },
    async hashCompatibilitySupport(path) {
      calls.support_hashes += 1;
      calls.sequence.push(`SUPPORT:${path}`);
      return authorization.compatibility_support_sha256[path];
    },
    async verifyTemporaryCommit(received) {
      calls.temporary_commit_verifications += 1;
      calls.sequence.push("TEMPORARY_COMMIT");
      assert.equal(
        received.execution.temporary_commit_sha,
        authorization.execution.temporary_commit_sha,
      );
      return { verified: true };
    },
    async classifyRetainedLegacy() {
      calls.legacy_classifications += 1;
      calls.sequence.push("RETAINED");
      return exactLegacyClassification();
    },
    async prepareAuthorizedExecutionContext() {
      calls.execution_context_preparations += 1;
      calls.sequence.push("EXECUTION_CONTEXT");
      return {
        checkpoint_store: {
          kind: "synthetic-checkpoint-store",
          async withExclusiveWriter(operation) {
            calls.writer_leases += 1;
            return operation();
          },
        },
        git_execution_context: GIT_EXECUTION_CONTEXT,
      };
    },
    async readLiveCredentials(receivedAuthorization, credentialSourcePolicy) {
      calls.credential_reads += 1;
      calls.sequence.push("CREDENTIALS");
      assert.equal(
        receivedAuthorization?.authorization_id_sha256,
        authorization.authorization_id_sha256,
      );
      assert.deepEqual(
        credentialSourcePolicy,
        CONCRETE_CREDENTIAL_SOURCE_POLICY,
      );
      return {
        github_token_present: true,
        vercel_token_present: true,
        supabase_service_role_present: true,
        supabase_anon_present: true,
        admin_password_present: true,
        admin_session_secret_present: true,
      };
    },
    async runAuthorizedQualification({
      authorization: received,
      execution_context,
    }) {
      calls.executions += 1;
      calls.sequence.push("EXECUTION");
      assert.equal(received.authorization_id_sha256, authorization.authorization_id_sha256);
      assert.equal(execution_context.git_execution_context, GIT_EXECUTION_CONTEXT);
      return {
        classification: "QUALIFIED",
        attempts_used: 1,
        retained_preview_count: 1,
        network_requests: 0,
        external_mutations: 0,
      };
    },
    writeOutput(value) {
      output.push(structuredClone(value));
    },
    ...overrides,
  };
  return { authorization, calls, dependencies, output };
}

const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(
      `${name}:${error?.code ?? "NO_CODE"}:${error?.message ?? "UNKNOWN"}:${error?.detail ?? ""}`,
    );
  }
}

function numericCallCount(calls) {
  return Object.entries(calls)
    .filter(([name, value]) => name !== "sequence" && Number.isSafeInteger(value))
    .reduce((sum, [, value]) => sum + value, 0);
}

await check("temporary commit proof requires exactly one parent", async () => {
  const source = readFileSync(
    new URL("./nonproduction-qualification-runner.mjs", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /\["rev-list", "--parents", "-n", "1", commit\]/u,
  );
  assert.match(source, /commitLine\.length !== 2/u);
});

await check("pre-effect Git uses an absolute binary and credential-free hardened environment", async () => {
  const source = readFileSync(
    new URL("./nonproduction-qualification-runner.mjs", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes('spawnSync("git"'), false);
  assert.equal(source.includes('spawnSync("/usr/bin/git"'), false);
  assert.equal(source.includes('spawnSync("/usr/bin/sandbox-exec"'), true);
  assert.equal(source.includes("env: environment"), true);
  assert.equal(source.includes('GIT_NO_REPLACE_OBJECTS: "1"'), true);
  assert.equal(source.includes("GIT_DIR: gitExecutionContext.git_dir"), true);
  assert.equal(
    source.includes("GIT_OBJECT_DIRECTORY: gitExecutionContext.object_directory"),
    true,
  );
  assert.equal(source.includes('"core.fsmonitor=false"'), true);
  assert.equal(source.includes('"core.hooksPath=/dev/null"'), true);
});

for (const [name, options] of [
  ["clean ordinary repository", {}],
  ["repository replacement ref", { replacement: true }],
  ["repository graft", { graft: true }],
  ["repository replacement ref plus graft", { replacement: true, graft: true }],
]) {
  await check(`raw-object preflight equals publication graph with ${name}`, async () => {
    const fixture = syntheticRawGitFixture(options);
    try {
      const result = verifyConcreteTemporaryCommit({
        repository: {
          root: fixture.repositoryRoot,
          head: fixture.base,
        },
        execution: { temporary_commit_sha: fixture.commit },
      }, fixture.context);
      assert.deepEqual(result, {
        verified: true,
        changed_paths: 1,
        commit_sha: fixture.commit,
        tree_sha: fixture.tree,
        object_directory: fixture.context.object_directory,
      });
    } finally {
      rmSync(fixture.repositoryRoot, { recursive: true, force: true });
      rmSync(fixture.contextRoot, { recursive: true, force: true });
    }
  });
}

await check("raw-object preflight rejects a publication object namespace mismatch", async () => {
  const fixture = syntheticRawGitFixture();
  const other = realpathSync(mkdtempSync("/tmp/aifinder-raw-git-other-objects."));
  try {
    assert.throws(
      () => verifyConcreteTemporaryCommit({
        repository: { root: fixture.repositoryRoot, head: fixture.base },
        execution: { temporary_commit_sha: fixture.commit },
      }, { ...fixture.context, object_directory: other }),
      (error) => error?.code === "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
    );
  } finally {
    rmSync(fixture.repositoryRoot, { recursive: true, force: true });
    rmSync(fixture.contextRoot, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  }
});

await check("pre-effect repository drift cannot execute a clean filter helper", async () => {
  const fixtureRoot = realpathSync(
    mkdtempSync("/tmp/aifinder-concrete-runner-filter."),
  );
  const markerPath = path.join(fixtureRoot, "filter-executed");
  const gitEnvironment = {
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_SYSTEM: "/dev/null",
    LC_ALL: "C",
  };
  const runFixtureGit = (args) => {
    const result = spawnSync("/usr/bin/git", args, {
      cwd: fixtureRoot,
      encoding: "utf8",
      env: gitEnvironment,
    });
    assert.equal(result.status, 0, `${args.join(" ")}:${result.stderr}`);
  };
  try {
    runFixtureGit(["init", "--initial-branch=main", "."]);
    writeFileSync(path.join(fixtureRoot, "probe.txt"), "baseline\n", {
      mode: 0o600,
    });
    runFixtureGit(["add", "probe.txt"]);
    runFixtureGit([
      "-c", "user.name=AiFinder Test",
      "-c", "user.email=aifinder@example.invalid",
      "commit", "-m", "baseline",
    ]);
    runFixtureGit(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    runFixtureGit(["remote", "add", "origin", GIT_REMOTE_URL]);
    runFixtureGit([
      "config",
      "filter.aifinder.clean",
      `/usr/bin/touch ${markerPath}; /bin/cat`,
    ]);
    writeFileSync(
      path.join(fixtureRoot, ".git", "info", "attributes"),
      "probe.txt filter=aifinder\n",
      { mode: 0o600 },
    );
    writeFileSync(path.join(fixtureRoot, "probe.txt"), "drift\n", {
      mode: 0o600,
    });
    let failure = null;
    try {
      createConcreteRunnerDependencies({
        repositoryRoot: fixtureRoot,
        writeOutput() {},
      }).inspectRepository();
    } catch (error) {
      failure = error;
    }
    assert.equal(
      failure === null || failure?.code === "CONCRETE_REPOSITORY_MISMATCH",
      true,
    );
    assert.equal(existsSync(markerPath), false);
  } finally {
    rmSync(fixtureRoot, { recursive: true });
  }
});

await check("Git execution context is prepared before credential access", async () => {
  let prepared = false;
  const executionContext = {
    checkpoint_store: {
      kind: "synthetic-checkpoint-store",
      async withExclusiveWriter(operation) {
        return operation();
      },
    },
    git_execution_context: GIT_EXECUTION_CONTEXT,
  };
  const test = harness({
    async prepareAuthorizedExecutionContext(receivedAuthorization) {
      assert.equal(
        receivedAuthorization.authorization_id_sha256,
        record().authorization_id_sha256,
      );
      prepared = true;
      test.calls.sequence.push("EXECUTION_CONTEXT");
      return executionContext;
    },
    async verifyTemporaryCommit(receivedAuthorization, gitExecutionContext) {
      assert.equal(prepared, true);
      assert.equal(
        receivedAuthorization.authorization_id_sha256,
        record().authorization_id_sha256,
      );
      assert.equal(gitExecutionContext, GIT_EXECUTION_CONTEXT);
      test.calls.temporary_commit_verifications += 1;
      test.calls.sequence.push("TEMPORARY_COMMIT");
      return { verified: true };
    },
    async readLiveCredentials() {
      assert.equal(prepared, true);
      test.calls.credential_reads += 1;
      test.calls.sequence.push("CREDENTIALS");
      return { synthetic: true };
    },
    async runAuthorizedQualification(received) {
      assert.equal(received.execution_context, executionContext);
      test.calls.executions += 1;
      test.calls.sequence.push("EXECUTION");
      return {
        classification: "QUALIFIED",
        attempts_used: 1,
        retained_preview_count: 1,
      };
    },
  });
  assert.deepEqual(
    await dispatchConcreteQualificationRunner(
      ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
      test.dependencies,
    ),
    { exit_code: 0, code: "QUALIFIED" },
  );
});

await check("one lifecycle writer excludes recovery takeover before every live effect", async () => {
  let writerActive = false;
  let releaseFirst;
  let markFirstEntered;
  const firstEntered = new Promise((resolve) => {
    markFirstEntered = resolve;
  });
  const firstRelease = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const checkpointStore = {
    async withExclusiveWriter(operation) {
      if (writerActive) {
        const error = new Error("busy");
        error.code = "CONCRETE_CHECKPOINT_WRITER_BUSY";
        throw error;
      }
      writerActive = true;
      try {
        return await operation();
      } finally {
        writerActive = false;
      }
    },
  };
  const executionContext = {
    checkpoint_store: checkpointStore,
    git_execution_context: GIT_EXECUTION_CONTEXT,
  };
  const first = harness({
    async prepareAuthorizedExecutionContext() {
      first.calls.execution_context_preparations += 1;
      return executionContext;
    },
    async runAuthorizedQualification() {
      first.calls.executions += 1;
      markFirstEntered();
      await firstRelease;
      return {
        classification: "QUALIFIED",
        attempts_used: 1,
        retained_preview_count: 1,
      };
    },
  });
  const second = harness({
    async prepareAuthorizedExecutionContext() {
      second.calls.execution_context_preparations += 1;
      return executionContext;
    },
  });
  const firstAttempt = dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    first.dependencies,
  );
  const firstState = await Promise.race([
    firstEntered.then(() => ({ entered: true })),
    firstAttempt.then((result) => ({ entered: false, result })),
  ]);
  assert.equal(
    firstState.entered,
    true,
    JSON.stringify({ result: firstState.result, output: first.output, sequence: first.calls.sequence }),
  );
  const secondAttempt = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    second.dependencies,
  );
  assert.deepEqual(secondAttempt, {
    exit_code: 1,
    code: "CONCRETE_RUNNER_FAILED",
  });
  assert.equal(second.calls.credential_reads, 0);
  assert.equal(second.calls.executions, 0);
  releaseFirst();
  assert.deepEqual(await firstAttempt, { exit_code: 0, code: "QUALIFIED" });
  assert.equal(first.calls.credential_reads, 1);
  assert.equal(first.calls.executions, 1);
});

await check("default concrete runner dependency surface is inert at construction", async () => {
  const dependencies = createConcreteRunnerDependencies({
    writeOutput() {},
  });
  for (const name of [
    "verifyCandidate",
    "inspectRepository",
    "hashCompatibilitySupport",
    "verifyTemporaryCommit",
    "classifyRetainedLegacy",
    "prepareAuthorizedExecutionContext",
    "readLiveCredentials",
    "runAuthorizedQualification",
    "writeOutput",
  ]) {
    assert.equal(typeof dependencies[name], "function", name);
  }
  assert.equal(dependencies.readAuthorizationRecord, undefined);
  assert.equal(Number.isSafeInteger(dependencies.now_epoch_ms), true);
});

await check("runner dependency surface cannot reopen authorization paths", async () => {
  const dependencies = createConcreteRunnerDependencies({
    writeOutput() {},
  });
  assert.equal(dependencies.readAuthorizationRecord, undefined);
});

await check("unknown CLI mode denied before all reads", async () => {
  const test = harness();
  const result = await dispatchConcreteQualificationRunner(["--official-runtime"], test.dependencies);
  assert.deepEqual(result, { exit_code: 1, code: "CONCRETE_MODE_DENIED" });
  assert.equal(numericCallCount(test.calls), 0);
  assert.deepEqual(test.output, [{ status: "FAIL", code: "CONCRETE_MODE_DENIED" }]);
});

await check("direct live runner invocation is denied before credentials or effects", async () => {
  const runnerPath = new URL(
    "./nonproduction-qualification-runner.mjs",
    import.meta.url,
  );
  const result = spawnSync("/usr/local/bin/node", [
    runnerPath.pathname,
    "--qualify-nonproduction",
    "--authorization",
    AUTHORIZATION_PATH,
  ], {
    encoding: "utf8",
    env: {},
    timeout: 10_000,
  });
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "FAIL",
    code: "CONCRETE_SUPERVISOR_TRUST_REQUIRED",
  });
});

await check("altered supervisor authorization bytes fail before credential access", async () => {
  const test = harness();
  test.dependencies.supervisor_trust = {
    ...test.dependencies.supervisor_trust,
    authorization_bytes: Buffer.from(
      `${canonicalJsonForTest({ ...test.authorization, run_id: "33333333-3333-4333-8333-333333333333" })}\n`,
      "utf8",
    ),
  };
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
    test.dependencies.supervisor_trust,
  );
  assert.deepEqual(result, {
    exit_code: 1,
    code: "CONCRETE_SUPERVISOR_TRUST_REQUIRED",
  });
  assert.equal(test.calls.credential_reads, 0);
  assert.equal(test.calls.executions, 0);
});

await check("live mode requires authorization record path", async () => {
  const test = harness();
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction"],
    test.dependencies,
  );
  assert.deepEqual(result, {
    exit_code: 1,
    code: "CONCRETE_AUTHORIZATION_REQUIRED",
  });
  assert.equal(numericCallCount(test.calls), 0);
});

await check("self-test mode is credential and network inert", async () => {
  const test = harness();
  const result = await dispatchConcreteQualificationRunner(["--self-test"], test.dependencies);
  assert.deepEqual(result, { exit_code: 0, code: "PASS_SELF_TEST" });
  assert.equal(test.calls.credential_reads, 0);
  assert.equal(test.calls.network, 0);
  assert.equal(test.calls.mutations, 0);
  assert.equal(test.calls.executions, 0);
});

await check("exact pre-effect gate closes every local binding", async () => {
  const test = harness();
  const closure = await verifyConcretePreEffectAuthorization({
    authorization_record: test.authorization,
    dependencies: test.dependencies,
  });
  assert.equal(closure.verified, true);
  assert.equal(closure.candidate_identity_sha256, test.authorization.candidate_identity_sha256);
  assert.equal(closure.manifest_sha256, test.authorization.manifest_sha256);
  assert.equal(closure.member_count, 24);
  assert.equal(closure.retained_legacy_identity_sha256, CONCRETE_RETAINED_IDENTITY_SHA256);
  assert.equal(test.calls.credential_reads, 0);
  assert.equal(test.calls.network, 0);
  assert.equal(test.calls.mutations, 0);
  assert.equal(test.calls.temporary_commit_verifications, 1);
  assert.deepEqual(test.calls.sequence, [
    "CANDIDATE",
    ...CONCRETE_SUPPORT_PATHS.map((entry) => `SUPPORT:${entry}`),
    "REPOSITORY",
    "TEMPORARY_COMMIT",
    "RETAINED",
  ]);
});

for (const [name, mutateDependency, code] of [
  [
    "candidate mismatch",
    (test) => {
      test.dependencies.verifyCandidate = async () => ({
        verified: true,
        source_policy_verified: true,
        activation_source_policy_verified: true,
        candidate_identity_sha256: sha("a"),
        manifest_sha256: test.authorization.manifest_sha256,
        member_count: 24,
        membership_exact: true,
        legacy_imports: 0,
        live_entrypoints: 1,
      });
    },
    "CONCRETE_CANDIDATE_MISMATCH",
  ],
  [
    "manifest mismatch",
    (test) => {
      test.dependencies.verifyCandidate = async () => ({
        verified: true,
        source_policy_verified: true,
        activation_source_policy_verified: true,
        candidate_identity_sha256: test.authorization.candidate_identity_sha256,
        manifest_sha256: sha("b"),
        member_count: 24,
        membership_exact: true,
        legacy_imports: 0,
        live_entrypoints: 1,
      });
    },
    "CONCRETE_CANDIDATE_MISMATCH",
  ],
  [
    "full membership mismatch",
    (test) => {
      test.dependencies.verifyCandidate = async () => ({
        verified: true,
        source_policy_verified: true,
        activation_source_policy_verified: true,
        candidate_identity_sha256: test.authorization.candidate_identity_sha256,
        manifest_sha256: test.authorization.manifest_sha256,
        member_count: 24,
        membership_exact: false,
        legacy_imports: 0,
        live_entrypoints: 1,
      });
    },
    "CONCRETE_CANDIDATE_MISMATCH",
  ],
  [
    "support mismatch",
    (test) => {
      test.dependencies.hashCompatibilitySupport = async () => sha("c");
    },
    "CONCRETE_SUPPORT_MISMATCH",
  ],
  [
    "repository mismatch",
    (test) => {
      test.dependencies.inspectRepository = async () => ({
        ...test.authorization.repository,
        index_empty: false,
      });
    },
    "CONCRETE_REPOSITORY_MISMATCH",
  ],
  [
    "temporary commit mismatch",
    (test) => {
      test.dependencies.verifyTemporaryCommit = async () => ({ verified: false });
    },
    "CONCRETE_TEMPORARY_COMMIT_MISMATCH",
  ],
  [
    "retained freeze mismatch",
    (test) => {
      test.dependencies.classifyRetainedLegacy = async () => ({
        ...exactLegacyClassification(),
        retained_identity_digest_sha256: sha("d"),
      });
    },
    "CONCRETE_RETAINED_STATE_MISMATCH",
  ],
  [
    "legacy classification mismatch",
    (test) => {
      test.dependencies.classifyRetainedLegacy = async () => ({
        ...exactLegacyClassification(),
        ownership_ambiguity: false,
      });
    },
    "CONCRETE_RETAINED_STATE_MISMATCH",
  ],
]) {
  await check(`${name} denied before credential access`, async () => {
    const test = harness();
    mutateDependency(test);
    const result = await dispatchConcreteQualificationRunner(
      ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
      test.dependencies,
    );
    assert.deepEqual(result, { exit_code: 1, code });
    assert.equal(test.calls.credential_reads, 0);
    assert.equal(test.calls.network, 0);
    assert.equal(test.calls.mutations, 0);
    assert.equal(test.calls.executions, 0);
  });
}

await check("expired authorization denied before credential access", async () => {
  const test = harness({ now_epoch_ms: Date.parse("2030-01-01T02:00:00.000Z") });
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
  );
  assert.deepEqual(result, {
    exit_code: 1,
    code: "CONCRETE_AUTHORIZATION_EXPIRED",
  });
  assert.equal(test.calls.credential_reads, 0);
  assert.equal(test.calls.executions, 0);
});

await check("missing credential fails before mutation without secret output", async () => {
  const missingValue = "never-print-this-secret";
  const test = harness({
    async readLiveCredentials() {
      test.calls.credential_reads += 1;
      const error = new Error(missingValue);
      error.code = "CONCRETE_CREDENTIAL_MISSING";
      error.missing_credentials = ["ADMIN_SESSION_SECRET"];
      error.invalid_credential_sources = ["ENV_LOCAL"];
      throw error;
    },
  });
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
  );
  assert.deepEqual(result, { exit_code: 1, code: "CONCRETE_CREDENTIAL_MISSING" });
  assert.equal(test.calls.credential_reads, 1);
  assert.equal(test.calls.mutations, 0);
  assert.equal(test.calls.executions, 0);
  assert.equal(JSON.stringify(test.output).includes(missingValue), false);
  assert.deepEqual(test.output, [{
    status: "FAIL",
    code: "CONCRETE_CREDENTIAL_MISSING",
    missing_credentials: ["ADMIN_SESSION_SECRET"],
    invalid_credential_sources: ["ENV_LOCAL"],
  }]);
});

await check("credential source drift fails before mutation without secret output", async () => {
  const test = harness({
    async readLiveCredentials() {
      test.calls.credential_reads += 1;
      const error = new Error("credential-source-secret-sentinel");
      error.code = "CONCRETE_CREDENTIAL_SOURCE_MISMATCH";
      error.invalid_credential_sources = ["GITHUB"];
      throw error;
    },
  });
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
  );
  assert.deepEqual(result, {
    exit_code: 1,
    code: "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
  });
  assert.equal(test.calls.executions, 0);
  assert.deepEqual(test.output, [{
    status: "FAIL",
    code: "CONCRETE_CREDENTIAL_SOURCE_MISMATCH",
    invalid_credential_sources: ["GITHUB"],
  }]);
  assert.equal(JSON.stringify(test.output).includes("secret-sentinel"), false);
});

await check("provider error bodies are reduced to a categorical runner failure", async () => {
  const providerBody = "provider-error-body-secret-sentinel";
  const test = harness({
    async runAuthorizedQualification() {
      test.calls.executions += 1;
      throw new Error(providerBody);
    },
  });
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
  );
  assert.deepEqual(result, { exit_code: 1, code: "CONCRETE_RUNNER_FAILED" });
  assert.deepEqual(test.output, [{ status: "FAIL", code: "CONCRETE_RUNNER_FAILED" }]);
  assert.equal(JSON.stringify(test.output).includes(providerBody), false);
});

await check("default credential loader is explicit and remains inert at construction", async () => {
  let loaderCalls = 0;
  let resolverCalls = 0;
  const dependencies = createConcreteRunnerDependencies({
    repositoryRoot: "/synthetic/repository",
    readCredentialEnvironment({ repositoryRoot }) {
      loaderCalls += 1;
      assert.equal(repositoryRoot, "/synthetic/repository");
      return Object.freeze({ GH_TOKEN: "synthetic" });
    },
    resolveCredentialEnvironment({ environment, repositoryRoot }) {
      resolverCalls += 1;
      assert.deepEqual(environment, { GH_TOKEN: "synthetic" });
      assert.equal(repositoryRoot, "/synthetic/repository");
      return {
        environment: Object.freeze({
          GH_TOKEN: "synthetic",
          VERCEL_TOKEN: "synthetic-vercel",
          NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-service",
          ADMIN_PASSWORD: "synthetic-password",
          ADMIN_SESSION_SECRET: "synthetic-session",
        }),
        sources: Object.freeze(structuredClone(CONCRETE_CREDENTIAL_SOURCE_POLICY)),
      };
    },
    writeOutput() {},
  });
  assert.equal(loaderCalls, 0);
  assert.equal(resolverCalls, 0);
  const syntheticAuthorization = record();
  syntheticAuthorization.execution.supabase_origin_sha256 =
    "6bce0afffdc84e79e2971a5dfc7b1228749b214debbf38ea54c5392f873b16d8";
  syntheticAuthorization.execution.supabase_project_ref_sha256 =
    "b3cc0475bb78a5026098858e9889acf666d31062d513d303314eca31d36e72f2";
  const credentials = await dependencies.readLiveCredentials(
    syntheticAuthorization,
    CONCRETE_CREDENTIAL_SOURCE_POLICY,
  );
  assert.equal(credentials.github_token, "synthetic");
  assert.equal(credentials.vercel_token, "synthetic-vercel");
  assert.equal(loaderCalls, 1);
  assert.equal(resolverCalls, 1);
  const driftedDependencies = createConcreteRunnerDependencies({
    repositoryRoot: "/synthetic/repository",
    readCredentialEnvironment() {
      return Object.freeze({});
    },
    resolveCredentialEnvironment() {
      return {
        environment: Object.freeze({
          GH_TOKEN: "synthetic",
          VERCEL_TOKEN: "synthetic-vercel",
          NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-service",
          ADMIN_PASSWORD: "synthetic-password",
          ADMIN_SESSION_SECRET: "synthetic-session",
        }),
        sources: Object.freeze({
          ...CONCRETE_CREDENTIAL_SOURCE_POLICY,
          GITHUB: "AVAILABLE_ENV_LOCAL",
        }),
      };
    },
    writeOutput() {},
  });
  await assert.rejects(
    () => driftedDependencies.readLiveCredentials(
      syntheticAuthorization,
      CONCRETE_CREDENTIAL_SOURCE_POLICY,
    ),
    (error) => {
      assert.equal(error?.code, "CONCRETE_CREDENTIAL_SOURCE_MISMATCH");
      assert.deepEqual(error?.invalid_credential_sources, ["GITHUB"]);
      return true;
    },
  );
});

await check("authorized synthetic qualification executes exactly once", async () => {
  const test = harness();
  const result = await dispatchConcreteQualificationRunner(
    ["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH],
    test.dependencies,
  );
  assert.deepEqual(result, { exit_code: 0, code: "QUALIFIED" });
  assert.equal(test.calls.credential_reads, 1);
  assert.equal(test.calls.executions, 1);
  assert.deepEqual(test.output, [
    {
      status: "PASS",
      code: "QUALIFIED",
      attempts_used: 1,
      retained_preview_count: 1,
    },
  ]);
});

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_RUNNER assertions=${assertions} mutations=12 failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_CONCRETE_RUNNER assertions=${assertions} mutations=12 network=0 credential_reads=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
