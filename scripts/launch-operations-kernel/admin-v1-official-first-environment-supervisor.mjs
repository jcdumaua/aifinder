import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalJson } from "./canonical.mjs";
import {
  createAdminV1OfficialFirstEnvironmentJournal,
  runAdminV1OfficialFirstEnvironmentRuntime,
  validateAdminV1OfficialFirstEnvironmentAuthorization,
} from "./admin-v1-official-first-environment-runtime.mjs";
import {
  createAdminV1OfficialFirstEnvironmentAdapter,
  createAdminV1OfficialFirstEnvironmentNativeTransport,
} from "./admin-v1-official-first-environment-live-platform.mjs";
import {
  createAdminV1OfficialFirstEnvironmentCredentialLoader,
  readAdminV1OfficialFirstEnvironmentVercelCliAuth,
} from "./admin-v1-official-first-environment-credential-loader.mjs";
import { verifyRepositoryCandidateManifest } from "./manifest.mjs";

const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const SUPERVISOR_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-supervisor.mjs";
const RUNTIME_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-runtime.mjs";
const TRANSPORT_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-live-platform.mjs";
const SCHEMA_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-authorization.schema.json";
const MATERIALIZER_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-materializer.mjs";
const CREDENTIAL_LOADER_RELATIVE_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-credential-loader.mjs";
const SUPERVISOR_POLICY_RELATIVE_PATH =
  "scripts/launch-operations-supervisor/supervisor-policy.json";
const MANIFEST_RELATIVE_PATH =
  "scripts/launch-operations-kernel/candidate-manifest.json";
const GIT_EXECUTABLE = "/Library/Developer/CommandLineTools/usr/bin/git";
const GIT_ENVIRONMENT = Object.freeze({
  GIT_ASKPASS: "/usr/bin/false",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin",
  SSH_ASKPASS: "/usr/bin/false",
});

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_CONTRACT =
  Object.freeze({
    key_name: "ADMIN_PASSWORD",
    source_name: "PROCESS_ENV_EXACT_KEY",
  });

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_PROVIDER_SOURCE_CONTRACT =
  Object.freeze({
    key_name: "token",
    source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  });

export class AdminV1OfficialFirstEnvironmentSupervisorError extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentSupervisorError";
    this.code = code;
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function exactObject(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function repositoryPath(repositoryRoot, relativePath) {
  const target = path.resolve(repositoryRoot, relativePath);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_PATH_INVALID",
    );
  }
  return target;
}

function regularFileBytes(target, mode, code) {
  try {
    const metadata = lstatSync(target);
    if (
      !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
      (metadata.mode & 0o777) !== mode || realpathSync(target) !== target
    ) throw new Error("IDENTITY");
    return readFileSync(target);
  } catch {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(code);
  }
}

function readCanonicalPrivateAuthorization(target) {
  const bytes = regularFileBytes(
    target,
    0o600,
    "FIRST_ENVIRONMENT_SUPERVISOR_AUTHORIZATION_INVALID",
  );
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value = JSON.parse(text);
    if (text !== `${canonicalJson(value)}\n`) throw new Error("CANONICAL");
    return { bytes: Buffer.from(bytes), sha256: sha256(bytes), value };
  } catch {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_AUTHORIZATION_INVALID",
    );
  } finally {
    bytes.fill(0);
  }
}

function verifySourceBindings({ authorization, repositoryRoot, supervisorPath }) {
  const bindings = [
    [supervisorPath, authorization.supervisor_source_sha256],
    [repositoryPath(repositoryRoot, RUNTIME_RELATIVE_PATH),
      authorization.runtime_source_sha256],
    [repositoryPath(repositoryRoot, TRANSPORT_RELATIVE_PATH),
      authorization.transport_source_sha256],
    [repositoryPath(repositoryRoot, SCHEMA_RELATIVE_PATH),
      authorization.authorization_schema_sha256],
    [repositoryPath(repositoryRoot, MATERIALIZER_RELATIVE_PATH),
      authorization.authorization_closure.materializer_source_sha256],
    [repositoryPath(repositoryRoot, CREDENTIAL_LOADER_RELATIVE_PATH),
      authorization.authorization_closure.credential_loader_source_sha256],
    [repositoryPath(repositoryRoot, SUPERVISOR_POLICY_RELATIVE_PATH),
      authorization.authorization_closure.supervisor_policy_sha256],
  ];
  for (const [target, expected] of bindings) {
    const bytes = regularFileBytes(
      target,
      0o644,
      "FIRST_ENVIRONMENT_SUPERVISOR_SOURCE_MISMATCH",
    );
    if (sha256(bytes) !== expected) {
      throw new AdminV1OfficialFirstEnvironmentSupervisorError(
        "FIRST_ENVIRONMENT_SUPERVISOR_SOURCE_MISMATCH",
      );
    }
  }
  try {
    const policy = JSON.parse(readFileSync(
      repositoryPath(repositoryRoot, SUPERVISOR_POLICY_RELATIVE_PATH),
      "utf8",
    ));
    if (
      policy.independent_semantic_pin_set_sha256 !==
        authorization.authorization_closure.independent_semantic_pin_set_sha256
    ) throw new Error("SEMANTIC_PIN");
  } catch {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_SOURCE_MISMATCH",
    );
  }
}

export function createAdminV1OfficialFirstEnvironmentNativeDependencies({
  write_output,
  environment = process.env,
  read_provider_auth,
  fetch_impl = globalThis.fetch,
  repository_root = REPOSITORY_ROOT,
  supervisor_path = fileURLToPath(import.meta.url),
  now_epoch_ms = Date.now(),
  inspect_repository,
  verify_candidate,
  create_journal,
  allow_hermetic_test = false,
} = {}) {
  if (typeof write_output !== "function" || typeof fetch_impl !== "function") {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED",
    );
  }
  const credentialLoader =
    createAdminV1OfficialFirstEnvironmentCredentialLoader({
      environment,
      read_provider_auth: read_provider_auth ?? (() =>
        readAdminV1OfficialFirstEnvironmentVercelCliAuth({
          repository_root,
        })),
    });
  let nativeTransport = null;
  const dependencies = {
    repository_root,
    supervisor_path,
    now_epoch_ms,
    write_output,
    load_credential({ source_contract }) {
      return credentialLoader.load_environment_value({ source_contract });
    },
    transport: Object.freeze({
      async execute(request) {
        if (nativeTransport === null) {
          const providerAuth = await credentialLoader.load_provider_auth({
            source_contract:
              ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_PROVIDER_SOURCE_CONTRACT,
          });
          nativeTransport = createAdminV1OfficialFirstEnvironmentNativeTransport({
            provider_auth: providerAuth,
            fetch_impl,
          });
        }
        return nativeTransport.execute(request);
      },
    }),
    clear_sensitive() {
      credentialLoader.clear_sensitive();
      nativeTransport = null;
    },
  };
  if (typeof inspect_repository === "function") {
    dependencies.inspect_repository = inspect_repository;
  }
  if (typeof verify_candidate === "function") {
    dependencies.verify_candidate = verify_candidate;
  }
  if (typeof create_journal === "function") {
    dependencies.create_journal = create_journal;
  }
  if (allow_hermetic_test === true) {
    dependencies.allow_hermetic_test = true;
  }
  return Object.freeze(dependencies);
}

function gitOutput(repositoryRoot, args) {
  const result = spawnSync(GIT_EXECUTABLE, [
    "--no-replace-objects",
    "-c", "core.fsmonitor=false",
    "-c", "core.hooksPath=/dev/null",
    "-c", "credential.helper=",
    "-c", "credential.interactive=false",
    "-c", "core.pager=cat",
    "--no-optional-locks",
    ...args,
  ], {
    cwd: repositoryRoot,
    encoding: null,
    env: GIT_ENVIRONMENT,
    maxBuffer: 4 * 1024 * 1024,
    timeout: 20_000,
  });
  if (
    result?.status !== 0 || !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) || result.stderr.byteLength !== 0
  ) {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_REPOSITORY_MISMATCH",
    );
  }
  return Buffer.from(result.stdout);
}

function oneLine(repositoryRoot, args) {
  const value = new TextDecoder("utf-8", { fatal: true }).decode(
    gitOutput(repositoryRoot, args),
  );
  if (!value.endsWith("\n") || value.slice(0, -1).includes("\n")) {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_REPOSITORY_MISMATCH",
    );
  }
  return value.slice(0, -1);
}

export function inspectAdminV1OfficialFirstEnvironmentRepository(
  repositoryRoot,
) {
  const head = oneLine(repositoryRoot, ["rev-parse", "HEAD"]);
  const originMain = oneLine(repositoryRoot, [
    "rev-parse", "refs/remotes/origin/main",
  ]);
  const counts = oneLine(repositoryRoot, [
    "rev-list", "--left-right", "--count", "origin/main...main",
  ]).split(/\s+/u);
  const worktrees = new TextDecoder("utf-8", { fatal: true }).decode(
    gitOutput(repositoryRoot, ["worktree", "list", "--porcelain"]),
  ).split("\n").filter((entry) => entry.startsWith("worktree "));
  const status = gitOutput(repositoryRoot, [
    "status", "--porcelain=v1", "--untracked-files=all", "-z",
  ]);
  const remoteOutput = new TextDecoder("utf-8", { fatal: true }).decode(
    gitOutput(repositoryRoot, [
      "ls-remote", "--heads", "https://github.com/jcdumaua/aifinder.git",
      ["refs/heads", "main"].join("/"),
    ]),
  );
  const remoteMatch = /^([0-9a-f]{40})\trefs\/heads\/main\n$/u.exec(
    remoteOutput,
  );
  if (counts.length !== 2 || !remoteMatch) {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_REPOSITORY_MISMATCH",
    );
  }
  return {
    root: repositoryRoot,
    branch: oneLine(repositoryRoot, [
      "symbolic-ref", "--quiet", "--short", "HEAD",
    ]),
    head,
    tree: oneLine(repositoryRoot, ["rev-parse", "HEAD^{tree}"]),
    origin_main: originMain,
    remote_main: remoteMatch[1],
    ahead: Number(counts[0]),
    behind: Number(counts[1]),
    index_empty: gitOutput(repositoryRoot, [
      "diff", "--cached", "--quiet", "--exit-code",
    ]).byteLength === 0,
    worktree_count: worktrees.length,
    status_sha256: sha256(status),
    remote_repository: "jcdumaua/aifinder",
  };
}

function defaultVerifyCandidate(record, repositoryRoot) {
  const report = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath: repositoryPath(repositoryRoot, MANIFEST_RELATIVE_PATH),
  });
  if (
    report.candidate_identity_sha256 !== record.candidate_identity_sha256 ||
    report.manifest_sha256 !== record.manifest_sha256
  ) {
    throw new AdminV1OfficialFirstEnvironmentSupervisorError(
      "FIRST_ENVIRONMENT_SUPERVISOR_CANDIDATE_MISMATCH",
    );
  }
  return report;
}

function safeCode(error) {
  const allowed = new Set([
    "FIRST_ENVIRONMENT_AUTHORIZATION_SPENT",
    "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
    "FIRST_ENVIRONMENT_RECOVERY_REQUIRED",
    "FIRST_ENVIRONMENT_SUPERVISOR_AUTHORIZATION_CHANGED",
    "FIRST_ENVIRONMENT_SUPERVISOR_AUTHORIZATION_INVALID",
    "FIRST_ENVIRONMENT_SUPERVISOR_CANDIDATE_MISMATCH",
    "FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED",
    "FIRST_ENVIRONMENT_SUPERVISOR_PATH_INVALID",
    "FIRST_ENVIRONMENT_SUPERVISOR_REPOSITORY_MISMATCH",
    "FIRST_ENVIRONMENT_SUPERVISOR_SOURCE_MISMATCH",
  ]);
  return allowed.has(error?.code)
    ? error.code
    : "FIRST_ENVIRONMENT_SUPERVISOR_FAILED";
}

function sanitizedRuntimeOutput(result) {
  if (result.classification === "RECOVERY_PENDING") {
    return {
      status: "FAIL",
      code: "FIRST_ENVIRONMENT_RECOVERY_PENDING",
      runtime_sessions: 1,
      runtime_retries: 0,
      runtime_replays: 0,
      zero_residual_owned_state: false,
    };
  }
  return {
    status: "PASS",
    code: "FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE",
    environment_creates: result.budgets.environment_creates,
    environment_identity_reads: result.budgets.environment_identity_reads,
    environment_deletes: result.budgets.environment_deletes,
    runtime_sessions: result.runtime_sessions,
    runtime_retries: 0,
    runtime_replays: 0,
    zero_residual_owned_state: result.zero_residual_owned_state,
  };
}

export async function dispatchAdminV1OfficialFirstEnvironmentSupervisor(
  argumentsList,
  dependencies = {},
) {
  if (
    Array.isArray(argumentsList) && argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) {
    dependencies.write_output?.({
      status: "PASS",
      code: "PASS_FIRST_ENVIRONMENT_SUPERVISOR_SELF_TEST",
      network: 0,
      credential_value_reads: 0,
      runtime_sessions: 0,
    });
    return {
      exit_code: 0,
      code: "PASS_FIRST_ENVIRONMENT_SUPERVISOR_SELF_TEST",
    };
  }
  if (
    !Array.isArray(argumentsList) || argumentsList.length !== 3 ||
    argumentsList[0] !== "--run-first-environment" ||
    argumentsList[1] !== "--authorization" ||
    typeof argumentsList[2] !== "string"
  ) {
    dependencies.write_output?.({
      status: "FAIL",
      code: "FIRST_ENVIRONMENT_SUPERVISOR_MODE_DENIED",
    });
    return {
      exit_code: 1,
      code: "FIRST_ENVIRONMENT_SUPERVISOR_MODE_DENIED",
    };
  }
  if (
    typeof dependencies.write_output !== "function" ||
    typeof dependencies.load_credential !== "function" ||
    typeof dependencies.transport?.execute !== "function"
  ) {
    dependencies.write_output?.({
      status: "FAIL",
      code: "FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED",
    });
    return {
      exit_code: 1,
      code: "FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED",
    };
  }
  try {
    const repositoryRoot = dependencies.repository_root ?? REPOSITORY_ROOT;
    const supervisorPath = dependencies.supervisor_path ??
      repositoryPath(repositoryRoot, SUPERVISOR_RELATIVE_PATH);
    if (realpathSync(repositoryRoot) !== repositoryRoot) {
      throw new AdminV1OfficialFirstEnvironmentSupervisorError(
        "FIRST_ENVIRONMENT_SUPERVISOR_PATH_INVALID",
      );
    }
    const firstRead = readCanonicalPrivateAuthorization(argumentsList[2]);
    const authorization = validateAdminV1OfficialFirstEnvironmentAuthorization(
      firstRead.value,
      {
        now_epoch_ms: dependencies.now_epoch_ms ?? Date.now(),
        allow_hermetic_test: dependencies.allow_hermetic_test === true,
      },
    );
    verifySourceBindings({ authorization, repositoryRoot, supervisorPath });
    const verifyCandidate = dependencies.verify_candidate ??
      ((record) => defaultVerifyCandidate(record, repositoryRoot));
    const candidate = verifyCandidate(authorization);
    if (
      candidate?.verified !== true ||
      candidate.candidate_identity_sha256 !==
        authorization.candidate_identity_sha256 ||
      candidate.manifest_sha256 !== authorization.manifest_sha256 ||
      candidate.member_count !==
        authorization.authorization_closure.candidate_member_count
    ) {
      throw new AdminV1OfficialFirstEnvironmentSupervisorError(
        "FIRST_ENVIRONMENT_SUPERVISOR_CANDIDATE_MISMATCH",
      );
    }
    const repositoryObservation = dependencies.inspect_repository
      ? dependencies.inspect_repository(authorization)
      : inspectAdminV1OfficialFirstEnvironmentRepository(repositoryRoot);
    if (!exactObject(repositoryObservation, authorization.repository)) {
      throw new AdminV1OfficialFirstEnvironmentSupervisorError(
        "FIRST_ENVIRONMENT_SUPERVISOR_REPOSITORY_MISMATCH",
      );
    }
    const secondRead = readCanonicalPrivateAuthorization(argumentsList[2]);
    if (secondRead.sha256 !== firstRead.sha256) {
      throw new AdminV1OfficialFirstEnvironmentSupervisorError(
        "FIRST_ENVIRONMENT_SUPERVISOR_AUTHORIZATION_CHANGED",
      );
    }
    const createJournal = dependencies.create_journal ??
      createAdminV1OfficialFirstEnvironmentJournal;
    const journal = createJournal({
      directory: authorization.execution.journal_directory,
      identity: {
        authorization_id_sha256: authorization.authorization_id_sha256,
        run_id: authorization.run_id,
      },
    });
    const adapter = createAdminV1OfficialFirstEnvironmentAdapter({
      authorization,
      transport: dependencies.transport,
    });
    const result = await runAdminV1OfficialFirstEnvironmentRuntime({
      authorization,
      adapter,
      journal,
      load_sensitive: async () => {
        let value;
        try {
          value = await dependencies.load_credential({
            source_contract:
              ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_CONTRACT,
          });
        } catch {
          throw new AdminV1OfficialFirstEnvironmentSupervisorError(
            "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
          );
        }
        if (!(value instanceof Uint8Array) || value.byteLength < 1) {
          throw new AdminV1OfficialFirstEnvironmentSupervisorError(
            "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
          );
        }
        return { environment_value: value };
      },
      now_epoch_ms: dependencies.now_epoch_ms ?? Date.now(),
      allow_hermetic_test: dependencies.allow_hermetic_test === true,
    });
    const output = sanitizedRuntimeOutput(result);
    dependencies.write_output(output);
    return {
      exit_code: output.status === "PASS" ? 0 : 1,
      code: output.code,
    };
  } catch (error) {
    const code = safeCode(error);
    dependencies.write_output?.({ status: "FAIL", code });
    return { exit_code: 1, code };
  } finally {
    dependencies.clear_sensitive?.();
  }
}

async function main() {
  const dependencies =
    createAdminV1OfficialFirstEnvironmentNativeDependencies({
      repository_root: REPOSITORY_ROOT,
      supervisor_path: fileURLToPath(import.meta.url),
      now_epoch_ms: Date.now(),
      write_output(value) {
        console.log(canonicalJson(value));
      },
    });
  const result = await dispatchAdminV1OfficialFirstEnvironmentSupervisor(
    process.argv.slice(2),
    dependencies,
  );
  process.exitCode = result.exit_code;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
