import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_LEDGER,
  ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER,
} from "../launch-operations-kernel/admin-v1-official-runtime.mjs";
import {
  createConcreteRunnerDependencies,
} from "../launch-operations-kernel/nonproduction-qualification-runner.mjs";
import { dispatchPreImportSupervisor } from "./nonproduction-qualification-supervisor.mjs";

const ROOT = realpathSync(path.resolve(import.meta.dirname, "../.."));
const RUN_ID = "66666666-6666-4666-8666-666666666666";
const NOW = Date.parse("2030-01-01T00:30:00.000Z");
const AUTHORIZATION_PATH =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-Synthetic-${RUN_ID}.json`;
const JOURNAL_DIRECTORY =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${RUN_ID}`;
const POLICY_RELATIVE_PATH =
  `scripts/launch-operations-supervisor/.admin-v1-official-concrete-${RUN_ID}.json`;
const POLICY_PATH = path.join(ROOT, POLICY_RELATIVE_PATH);
const SUPERVISOR_PATH = path.join(
  ROOT,
  "scripts/launch-operations-supervisor/nonproduction-qualification-supervisor.mjs",
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function makeTreeOwnerWritable(target) {
  if (!existsSync(target)) return;
  const metadata = lstatSync(target);
  if (metadata.isDirectory() && !metadata.isSymbolicLink()) {
    chmodSync(target, (metadata.mode & 0o777) | 0o700);
    for (const name of readdirSync(target)) {
      makeTreeOwnerWritable(path.join(target, name));
    }
  } else {
    chmodSync(target, (metadata.mode & 0o777) | 0o600);
  }
}
const canonicalJson = (value) => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort((left, right) =>
      left.localeCompare(right, "en")
    ).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new Error("SYNTHETIC_CANONICAL_JSON");
};

function git(argumentsList, { indexFile = null } = {}) {
  const result = spawnSync("/usr/bin/git", argumentsList, {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      GIT_AUTHOR_EMAIL: "synthetic@example.invalid",
      GIT_AUTHOR_NAME: "AiFinder synthetic test",
      GIT_COMMITTER_EMAIL: "synthetic@example.invalid",
      GIT_COMMITTER_NAME: "AiFinder synthetic test",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_OPTIONAL_LOCKS: "0",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin",
      ...(indexFile === null ? {} : { GIT_INDEX_FILE: indexFile }),
    },
    maxBuffer: 4 * 1024 * 1024,
    timeout: 20_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return result.stdout;
}

function repositoryObservation() {
  const status = Buffer.from(git([
    "status", "--porcelain=v1", "--untracked-files=all", "-z",
  ]), "utf8");
  const head = git(["rev-parse", "HEAD"]).trim();
  const origin = git(["rev-parse", "refs/remotes/origin/main"]).trim();
  return {
    root: ROOT,
    branch: git(["symbolic-ref", "--quiet", "--short", "HEAD"]).trim(),
    head,
    origin_main: origin,
    remote_main: head,
    ahead: 0,
    behind: 0,
    index_empty: true,
    worktree_count: 1,
    status_sha256: sha256(status),
    remote_repository: "jcdumaua/aifinder",
  };
}

function temporaryCommit(parent) {
  const temporary = realpathSync(mkdtempSync("/tmp/aifinder-official-index."));
  const indexFile = path.join(temporary, "index");
  try {
    git(["read-tree", parent], { indexFile });
    const paths = git(["ls-files", "-m", "-o", "--exclude-standard", "-z"])
      .split("\0").filter(Boolean);
    assert(paths.length > 0);
    git(["add", "--", ...paths], { indexFile });
    const tree = git(["write-tree"], { indexFile }).trim();
    const commit = git([
      "commit-tree", tree, "-p", parent, "-m",
      "synthetic admin v1 official concrete supervisor proof",
    ]).trim();
    assert.match(commit, /^[0-9a-f]{40}$/u);
    return commit;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function exactEffect(ordinal) {
  const actions = new Map([
    [8, "tool_added"], [10, "tool_updated"], [11, "tool_deleted"],
    [12, "submission_updated"], [13, "submission_rejected"],
    [14, "submission_approved"], [15, "logo_uploaded"], [19, "admin_logout"],
  ]);
  const base = actions.has(ordinal)
    ? { audit_action: actions.get(ordinal), audit_id: `audit-${ordinal}`, audit_version: "v1" }
    : null;
  if (ordinal === 8) return { ...base, tool_id: "tool-route", tool_version: "v1" };
  if (ordinal === 10) return { ...base, tool_id: "tool-route", tool_version: "v2" };
  if (ordinal === 11) return { ...base, tool_id: "tool-route", tool_version: "v3" };
  if ([12, 13].includes(ordinal)) return {
    ...base, submission_id: `submission-${ordinal - 11}`, submission_version: "v2",
  };
  if (ordinal === 14) return {
    ...base, approval_rpc: 1, submission_id: "submission-3",
    submission_version: "v2", tool_id: "tool-approved", tool_version: "v1",
  };
  if (ordinal === 15) return {
    ...base, logo_object_id: "logo-owned-v1", storage_version: "v1",
  };
  return base;
}

function syntheticOperationTransport(counters) {
  let applicationOrdinal = 0;
  let fixtureOrdinal = 0;
  return {
    async execute({ operation, input, authorization }) {
      counters.adapter_effects += 1;
      if (operation === "inspect_prior_residue") return { status: "ABSENT" };
      if (operation === "inspect_environment_contract") {
        return { status: "EXACT", names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
      }
      if (operation === "inspect_owned_database_residue") return { status: "ABSENT" };
      if (operation === "prepare_local_temporary_commit") return {
        status: "VERIFIED_EXACT",
        commit_sha: authorization.execution.temporary_commit_sha,
        local_state_id: "local-temp-owned",
      };
      if (operation === "inspect_github_metadata") return {
        status: "EXACT", repository: authorization.repository.remote_repository,
        baseline: authorization.repository.head,
      };
      if (operation === "inspect_remote_ref") return { status: "ABSENT" };
      if (operation === "create_remote_ref") return { status: "CREATED_EXACT", ref_id: "ref-owned" };
      if (operation === "detect_automatic_preview") return { count: 0 };
      if (operation.startsWith("create_environment_")) {
        return { status: "CREATED_EXACT", record_id: `env-${operation.at(-1)}` };
      }
      if (operation === "create_preview") return { status: "CREATED_EXACT", deployment_id: "dpl-owned" };
      if (operation === "verify_preview_identity") return { status: "EXACT" };
      if (operation === "generate_oidc") return { token: Buffer.from("synthetic-oidc") };
      if (operation === "protected_access_handshake") return { status: "BOUND" };
      if (operation === "create_submitted_fixture") {
        fixtureOrdinal += 1;
        return { status: "CREATED_EXACT", row_id: `submission-${fixtureOrdinal}`, version: "v1" };
      }
      if (operation === "application_request") {
        applicationOrdinal += 1;
        const qualification = applicationOrdinal <= 6;
        const ledger = qualification
          ? ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER
          : ADMIN_V1_OFFICIAL_LEDGER;
        const spec = ledger[qualification ? applicationOrdinal - 1 : applicationOrdinal - 7];
        assert.deepEqual(input.contract, spec);
        return {
          status: spec.status,
          header_projection: "EXACT_SECURITY_HEADERS",
          body_shape: "EXACT_BOUNDED_JSON",
          cookie_effect: [2, 4, 19].includes(spec.ordinal)
            ? `ORDINAL_${spec.ordinal}_COOKIE_EFFECT`
            : "NONE",
          ...(spec.ordinal === 2
            ? { session_cookie: Buffer.from("synthetic-session-cookie") }
            : {}),
          ...(spec.ordinal === 4
            ? {
                csrf_cookie: Buffer.from("synthetic-csrf-cookie"),
                csrf_token: Buffer.from("synthetic-csrf-token"),
              }
            : {}),
          effect: qualification ? null : exactEffect(spec.ordinal),
          ...(spec.ordinal === 16
            ? { allow_methods: ["GET", "POST", "PUT", "DELETE"] }
            : {}),
          ...([17, 18].includes(spec.ordinal)
            ? {
                proxy_scope: "DENY_ADMIN_API_PATH",
                deferred_handler_executions: 0,
                deferred_database_effects: 0,
                deferred_rpc_effects: 0,
                deferred_storage_effects: 0,
              }
            : {}),
        };
      }
      if (operation === "inspect_submissions_poststate") return {
        status: "EXACT", submitted_tools: 3,
        ownership_readback: "EXACT", unrelated_preserved: true,
      };
      if (operation === "inspect_tools_poststate") return {
        status: "EXACT", tools: 2, ownership_readback: "EXACT", unrelated_preserved: true,
      };
      if (operation === "inspect_audits_poststate") return {
        status: "EXACT", audits: 8, ownership_readback: "EXACT", unrelated_preserved: true,
      };
      if (operation === "storage_read_owned_version") return { status: "EXACT", version: "v1" };
      if (operation === "prepare_storage_cleanup_grant") {
        return { status: "PREPARED", grant_id: "grant-owned" };
      }
      if (operation === "revoke_storage_cleanup_grant") return { status: "REVOKED_EXACT" };
      if (operation === "inspect_remote_ref_before_delete") return { status: "EXACT_OWNED" };
      if (
        operation.startsWith("delete_") ||
        ["retire_protected_access", "cleanup_local_owned_temp_state"].includes(operation)
      ) return { status: "DELETED_EXACT" };
      if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
        return { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true };
      }
      assert.fail(`unexpected operation ${operation}`);
    },
  };
}

let policyCreated = false;
let authorizationCreated = false;
try {
  const policy = JSON.parse(readFileSync(
    path.join(ROOT, "scripts/launch-operations-supervisor/supervisor-policy.json"),
    "utf8",
  ));
  policy.policy_path = POLICY_RELATIVE_PATH;
  policy.repository.root = ROOT;
  policy.official_runtime.repository_contract.root = ROOT;
  writeFileSync(POLICY_PATH, `${canonicalJson(policy)}\n`, { flag: "wx", mode: 0o644 });
  chmodSync(POLICY_PATH, 0o644);
  policyCreated = true;
  const repository = repositoryObservation();
  assert.equal(repository.branch, "main");
  assert.equal(repository.head, repository.origin_main);
  const commit = temporaryCommit(repository.head);
  const authorization = {
    schema_version: 1,
    operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
    authorization_id_sha256: "1".repeat(64),
    one_use_authorization_sha256: "2".repeat(64),
    review_approval_sha256: "3".repeat(64),
    candidate_identity_sha256: policy.candidate.candidate_identity_sha256,
    manifest_sha256: policy.candidate.manifest_sha256,
    supervisor_sha256: sha256(readFileSync(SUPERVISOR_PATH)),
    supervisor_policy_sha256: sha256(readFileSync(POLICY_PATH)),
    authorization_schema_sha256:
      policy.official_runtime.authorization_schema_sha256,
    compatibility_support_sha256: policy.compatibility_support_sha256,
    route_source_sha256: policy.official_runtime.route_source_sha256,
    contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    created_at: "2030-01-01T00:00:00.000Z",
    expires_at: "2030-01-01T01:00:00.000Z",
    run_id: RUN_ID,
    repository,
    execution: {
      access_mode: "SELF_PROJECT_OIDC",
      branch_name: `aifinder-admin-v1-official-${RUN_ID}`,
      journal_directory: JOURNAL_DIRECTORY,
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      storage_bucket: "tool-logos",
      storage_name: `admin/${RUN_ID}.png`,
      temporary_commit_sha: commit,
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    },
  };
  writeFileSync(AUTHORIZATION_PATH, `${canonicalJson(authorization)}\n`, {
    flag: "wx", mode: 0o600,
  });
  chmodSync(AUTHORIZATION_PATH, 0o600);
  authorizationCreated = true;
  const sources = {
    ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
    ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
    GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
    SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
    SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
    SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
    VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  };
  const environment = {
    ADMIN_PASSWORD: "synthetic-admin",
    ADMIN_SESSION_SECRET: "synthetic-session-secret",
    GH_TOKEN: "synthetic-github",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role",
    VERCEL_TOKEN: "synthetic-vercel",
  };
  const counters = { credential_reads: 0, adapter_effects: 0 };
  const output = [];
  const result = await dispatchPreImportSupervisor(
    ["--run-admin-v1-official", "--authorization", AUTHORIZATION_PATH],
    {
      repository_root: ROOT,
      supervisor_path: SUPERVISOR_PATH,
      policy_path: POLICY_PATH,
      now_epoch_ms: NOW,
      inspect_repository: () => structuredClone(repository),
      official_transport: syntheticOperationTransport(counters),
      read_credential_environment() {
        counters.credential_reads += 1;
        return structuredClone(environment);
      },
      resolve_credential_environment({ environment: input }) {
        return { environment: structuredClone(input), sources: structuredClone(sources) };
      },
      write_output(value) {
        output.push(structuredClone(value));
      },
    },
  );
  let diagnostic = null;
  if (result.exit_code !== 0) {
    try {
      const concrete = createConcreteRunnerDependencies({
        repositoryRoot: ROOT,
        officialRepositoryObservation: repository,
        nowEpochMs: NOW,
      });
      const context = await concrete.prepareOfficialExecutionContext(authorization);
      await concrete.verifyCandidate();
      await concrete.inspectRepository();
      await concrete.verifyTemporaryCommit(
        authorization,
        context.git_execution_context,
      );
      diagnostic = concrete.verifyNoPriorOfficialRecovery(authorization);
    } catch (error) {
      diagnostic = { code: error?.code, detail: error?.detail };
    }
  }
  assert.deepEqual(
    result,
    { exit_code: 0, code: "OFFICIAL_RUNTIME_COMPLETE" },
    JSON.stringify({ result, output, counters, diagnostic }),
  );
  assert.equal(counters.credential_reads, 1);
  assert(counters.adapter_effects > 26);
  assert.deepEqual(output, [{
    status: "PASS",
    code: "OFFICIAL_RUNTIME_COMPLETE",
    qualification_requests: 6,
    official_requests: 20,
    runtime_sessions: 1,
    runtime_retries: 0,
    runtime_replays: 0,
  }]);
  console.log(
    "PASS_ADMIN_V1_OFFICIAL_CONCRETE_SUPERVISOR real_supervisor=true real_factory=true real_state_machine=true qualification=6 official=20 sessions=1 retries=0 replays=0 credential_reads=1 low_level_fakes=true real_external_actions=0",
  );
} finally {
  if (authorizationCreated) unlinkSync(AUTHORIZATION_PATH);
  if (policyCreated) unlinkSync(POLICY_PATH);
  makeTreeOwnerWritable(JOURNAL_DIRECTORY);
  rmSync(JOURNAL_DIRECTORY, { recursive: true, force: true });
}
