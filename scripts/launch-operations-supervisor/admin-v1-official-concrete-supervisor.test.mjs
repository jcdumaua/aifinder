import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
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

const SOURCE_ROOT = realpathSync(path.resolve(import.meta.dirname, "../.."));
const RUN_ID = "66666666-6666-4666-8666-666666666666";
const NOW = Date.parse("2030-01-01T00:30:00.000Z");
const SYNTHETIC_PROOF_PATH =
  "testing/admin-v1-official-supervisor-synthetic-proof.txt";
const SYNTHETIC_PROOF_BYTES = Buffer.from(
  "admin-v1-official-supervisor-synthetic-proof-v1\n",
  "utf8",
);
const AUTHORIZATION_PATH =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-Synthetic-${RUN_ID}.json`;
const JOURNAL_DIRECTORY =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${RUN_ID}`;
const POLICY_RELATIVE_PATH =
  `.git/admin-v1-official-concrete-${RUN_ID}.policy.json`;
const MAXIMUM_OVERLAY_FILE_BYTES = 2 * 1024 * 1024;
const GIT_TIMEOUT_MS = 60_000;
const GIT_EXECUTABLE = process.platform === "darwin"
  ? "/Library/Developer/CommandLineTools/usr/bin/git"
  : "/usr/bin/git";
const ORIGINAL_CANDIDATE_OVERLAY_PATHS = Object.freeze([
  "scripts/launch-operations-kernel/admin-v1-official-runtime.mjs",
  "scripts/launch-operations-kernel/admin-v1-official-live-platform.mjs",
  "scripts/launch-operations-kernel/admin-v1-official-concrete-bridge.test.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.test.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.test.mjs",
  "scripts/launch-operations-kernel/manifest.mjs",
  "scripts/launch-operations-kernel/candidate-manifest.json",
  "scripts/launch-operations-supervisor/supervisor-policy.json",
  "testing/static-test-safety-manifest.json",
  "scripts/launch-operations-kernel/admin-v1-official-runtime.test.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
]);
const ORCHESTRATOR_OVERLAY_PATH =
  "testing/admin-v1-staging-runtime-orchestrator.mjs";
const ORCHESTRATOR_OVERLAY_SHA256 =
  "0f8a35567bae55e7c875accf15745a679a8cfb263803f3aabb5c0afbefa22951";
const CANDIDATE_OVERLAY_PATHS = Object.freeze([
  ...ORIGINAL_CANDIDATE_OVERLAY_PATHS,
  ORCHESTRATOR_OVERLAY_PATH,
]);
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

function exactOverlayTarget(root, relativePath) {
  assert(CANDIDATE_OVERLAY_PATHS.includes(relativePath));
  assert(!relativePath.startsWith("scripts/_drafts/"));
  assert(!path.isAbsolute(relativePath));
  assert(!relativePath.includes("\0"));
  assert(!relativePath.split("/").includes(".."));
  const target = path.resolve(root, relativePath);
  assert(target.startsWith(`${root}${path.sep}`));
  const metadata = lstatSync(target);
  assert(metadata.isFile());
  assert(!metadata.isSymbolicLink());
  assert.equal(metadata.nlink, 1);
  assert.equal(metadata.mode & 0o777, 0o644);
  assert(metadata.size <= MAXIMUM_OVERLAY_FILE_BYTES);
  assert.equal(realpathSync(target), target);
  return Object.freeze({ metadata, target });
}

function readExactOverlayBytes(root, relativePath) {
  const { metadata, target } = exactOverlayTarget(root, relativePath);
  const bytes = readFileSync(target);
  assert.equal(bytes.byteLength, metadata.size);
  return bytes;
}

function assertExactCandidateOverlayPaths(paths) {
  assert.equal(paths.length, 15, "SYNTHETIC_OVERLAY_EXACT_MEMBER_COUNT");
  assert.equal(
    new Set(paths).size,
    15,
    "SYNTHETIC_OVERLAY_DUPLICATE_MEMBER_FORBIDDEN",
  );
  assert.deepEqual(
    paths,
    CANDIDATE_OVERLAY_PATHS,
    "SYNTHETIC_OVERLAY_UNEXPECTED_MEMBER_FORBIDDEN",
  );
}

function assertPinnedOrchestratorCovered(paths, publishedOrchestratorSha256) {
  const materializedOrchestratorSha256 = paths.includes(ORCHESTRATOR_OVERLAY_PATH)
    ? ORCHESTRATOR_OVERLAY_SHA256
    : publishedOrchestratorSha256;
  assert.equal(
    materializedOrchestratorSha256,
    ORCHESTRATOR_OVERLAY_SHA256,
    "SYNTHETIC_MISSING_ORCHESTRATOR_SUPPORT_MISMATCH",
  );
}

function assertPublicationStableOrchestratorBaseline(
  publishedOrchestratorSha256,
) {
  assert.match(publishedOrchestratorSha256, /^[0-9a-f]{64}$/u);
  assertPinnedOrchestratorCovered(
    CANDIDATE_OVERLAY_PATHS,
    publishedOrchestratorSha256,
  );
}

function runGit(argumentsList, {
  cwd,
  environment = {},
  input = null,
} = {}) {
  const result = spawnSync(GIT_EXECUTABLE, argumentsList, {
    cwd,
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
      ...environment,
    },
    input,
    maxBuffer: 4 * 1024 * 1024,
    timeout: GIT_TIMEOUT_MS,
  });
  assert.equal(result.status, 0, JSON.stringify({
    arguments: argumentsList,
    error: result.error?.message ?? null,
    signal: result.signal,
    stderr: result.stderr,
  }));
  assert.equal(result.stderr, "");
  return result.stdout;
}

function sourceGit(argumentsList) {
  return runGit(argumentsList, { cwd: SOURCE_ROOT });
}

function resolveSourcePublishedHead(expectedHead = null) {
  const publishedHead = sourceGit([
    "rev-parse", "--verify", "HEAD^{commit}",
  ]).trim();
  assert.match(publishedHead, /^[0-9a-f]{40}$/u);
  assert.equal(publishedHead.split("\n").length, 1);
  if (expectedHead !== null) {
    assert.match(expectedHead, /^[0-9a-f]{40}$/u);
    assert.equal(
      expectedHead,
      publishedHead,
      "SYNTHETIC_EXTERNAL_BASELINE_MUST_EQUAL_ACTUAL_SOURCE_HEAD",
    );
  }
  return publishedHead;
}

function git(argumentsList, { indexFile = null, input = null } = {}) {
  return runGit(argumentsList, {
    cwd: ROOT,
    environment: {
      ...SYNTHETIC_REPOSITORY.git_environment,
      GIT_INDEX_FILE: indexFile ?? SYNTHETIC_REPOSITORY.worktree_index,
    },
    input,
  });
}

function createSyntheticRepository() {
  const temporaryRoot = realpathSync(
    mkdtempSync("/tmp/aifinder-official-supervisor-repository."),
  );
  try {
    const root = path.join(temporaryRoot, "worktree");
    const gitDirectory = path.join(root, ".git");
    const objectDirectory = path.join(gitDirectory, "objects");
    const worktreeIndex = path.join(gitDirectory, "index");
    mkdirSync(path.join(objectDirectory, "info"), { recursive: true, mode: 0o700 });
    mkdirSync(path.join(gitDirectory, "refs", "heads"), {
      recursive: true,
      mode: 0o700,
    });
    mkdirSync(path.join(gitDirectory, "refs", "remotes", "origin"), {
      recursive: true,
      mode: 0o700,
    });
    mkdirSync(path.join(gitDirectory, "info"), { recursive: true, mode: 0o700 });
    const canonicalRoot = realpathSync(root);
    const canonicalGitDirectory = realpathSync(gitDirectory);
    const canonicalObjectDirectory = realpathSync(objectDirectory);
    const sourceObjectDirectory = realpathSync(
      path.join(SOURCE_ROOT, ".git", "objects"),
    );
    const publishedOrchestratorSha256 = sha256(sourceGit([
      "show", `HEAD:${ORCHESTRATOR_OVERLAY_PATH}`,
    ]));
    assert.doesNotThrow(() => assertPublicationStableOrchestratorBaseline(
      ORCHESTRATOR_OVERLAY_SHA256,
    ));
    assertPublicationStableOrchestratorBaseline(publishedOrchestratorSha256);
    assert.deepEqual(
      CANDIDATE_OVERLAY_PATHS.slice(0, -1),
      ORIGINAL_CANDIDATE_OVERLAY_PATHS,
    );
    assertExactCandidateOverlayPaths(CANDIDATE_OVERLAY_PATHS);
    assertPinnedOrchestratorCovered(
      CANDIDATE_OVERLAY_PATHS,
      publishedOrchestratorSha256,
    );
    assert.doesNotThrow(() => assertPinnedOrchestratorCovered(
      ORIGINAL_CANDIDATE_OVERLAY_PATHS,
      ORCHESTRATOR_OVERLAY_SHA256,
    ));
    assert.throws(
      () => assertPinnedOrchestratorCovered(
        ORIGINAL_CANDIDATE_OVERLAY_PATHS,
        "0".repeat(64),
      ),
      /SYNTHETIC_MISSING_ORCHESTRATOR_SUPPORT_MISMATCH/u,
    );
    assert.throws(
      () => assertExactCandidateOverlayPaths([
        ...CANDIDATE_OVERLAY_PATHS,
        "testing/unexpected-overlay-member.mjs",
      ]),
      /SYNTHETIC_OVERLAY_EXACT_MEMBER_COUNT/u,
    );
    assert.throws(
      () => assertExactCandidateOverlayPaths([
        ...CANDIDATE_OVERLAY_PATHS.slice(0, -1),
        CANDIDATE_OVERLAY_PATHS[0],
      ]),
      /SYNTHETIC_OVERLAY_DUPLICATE_MEMBER_FORBIDDEN/u,
    );
    const parent = resolveSourcePublishedHead();
    assert.throws(
      () => resolveSourcePublishedHead("0".repeat(40)),
      /SYNTHETIC_EXTERNAL_BASELINE_MUST_EQUAL_ACTUAL_SOURCE_HEAD/u,
    );
    writeFileSync(
      path.join(gitDirectory, "config"),
      `[core]\n\trepositoryformatversion = 0\n\tbare = false\n\tworktree = ${canonicalRoot}\n[remote "origin"]\n\turl = https://github.com/jcdumaua/aifinder.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`,
      { mode: 0o600 },
    );
    writeFileSync(path.join(gitDirectory, "HEAD"), "ref: refs/heads/main\n", {
      mode: 0o600,
    });
    writeFileSync(path.join(gitDirectory, "refs", "heads", "main"), `${parent}\n`, {
      mode: 0o600,
    });
    writeFileSync(
      path.join(gitDirectory, "refs", "remotes", "origin", "main"),
      `${parent}\n`,
      { mode: 0o600 },
    );
    writeFileSync(
      path.join(objectDirectory, "info", "alternates"),
      `${sourceObjectDirectory}\n`,
      { mode: 0o600 },
    );
    const gitEnvironment = Object.freeze({
      GIT_ALTERNATE_OBJECT_DIRECTORIES: sourceObjectDirectory,
      GIT_DIR: canonicalGitDirectory,
      GIT_OBJECT_DIRECTORY: canonicalObjectDirectory,
      GIT_WORK_TREE: canonicalRoot,
    });
    const isolatedGit = (argumentsList, { input = null } = {}) => runGit(
      argumentsList,
      {
        cwd: canonicalRoot,
        environment: {
          ...gitEnvironment,
          GIT_INDEX_FILE: worktreeIndex,
        },
        input,
      },
    );
    const materializeCandidateState = (sourceRoot) => {
      const baselineCommit = isolatedGit(["rev-parse", "HEAD"]).trim();
      const baselineTree = isolatedGit([
        "rev-parse", `${baselineCommit}^{tree}`,
      ]).trim();
      assertExactCandidateOverlayPaths(CANDIDATE_OVERLAY_PATHS);
      for (const relativePath of CANDIDATE_OVERLAY_PATHS) {
        const bytes = readExactOverlayBytes(sourceRoot, relativePath);
        const { target } = exactOverlayTarget(canonicalRoot, relativePath);
        writeFileSync(target, bytes, { mode: 0o644 });
        chmodSync(target, 0o644);
        const blob = isolatedGit([
          "hash-object", "-w", "--stdin", "--path", relativePath,
        ], { input: bytes }).trim();
        assert.match(blob, /^[0-9a-f]{40}$/u);
        isolatedGit([
          "update-index", "--add", "--cacheinfo", "100644", blob,
          relativePath,
        ]);
      }
      const candidateTree = isolatedGit(["write-tree"]).trim();
      let candidateCommit = baselineCommit;
      if (candidateTree !== baselineTree) {
        candidateCommit = isolatedGit([
          "commit-tree", candidateTree, "-p", baselineCommit, "-m",
          "synthetic pre-publication candidate state",
        ]).trim();
        assert.match(candidateCommit, /^[0-9a-f]{40}$/u);
        isolatedGit([
          "update-ref", "refs/heads/main", candidateCommit, baselineCommit,
        ]);
        isolatedGit([
          "update-ref", "refs/remotes/origin/main", candidateCommit,
          baselineCommit,
        ]);
        isolatedGit(["read-tree", "--reset", "-u", candidateCommit]);
      }
      isolatedGit(["update-index", "--refresh"]);
      assert.equal(isolatedGit([
        "status", "--porcelain=v1", "--untracked-files=all",
      ]), "");
      assert.equal(isolatedGit(["rev-parse", "HEAD"]).trim(), candidateCommit);
      assert.equal(
        isolatedGit(["rev-parse", "refs/remotes/origin/main"]).trim(),
        candidateCommit,
      );
      assert.equal(
        isolatedGit(["rev-parse", "HEAD^{tree}"]).trim(),
        candidateTree,
      );
      return Object.freeze({
        baseline_commit: baselineCommit,
        baseline_tree: baselineTree,
        candidate_commit: candidateCommit,
        candidate_tree: candidateTree,
        commit_created: candidateCommit !== baselineCommit,
        overlay_paths: CANDIDATE_OVERLAY_PATHS.length,
      });
    };
    const assertExactlyOneSyntheticCommit = (state) => {
      assert.equal(state.commit_created, true);
      assert.notEqual(state.candidate_tree, state.baseline_tree);
      assert.equal(isolatedGit([
        "rev-parse", `${state.candidate_commit}^`,
      ]).trim(), state.baseline_commit);
      assert.equal(isolatedGit([
        "rev-list", "--count",
        `${state.baseline_commit}..${state.candidate_commit}`,
      ]).trim(), "1");
      assert.equal(isolatedGit([
        "rev-parse", `${state.candidate_commit}^{tree}`,
      ]).trim(), state.candidate_tree);
    };
    const createAlteredOverlayBaseline = (parentCommit) => {
      const exactBytes = readExactOverlayBytes(
        canonicalRoot,
        ORCHESTRATOR_OVERLAY_PATH,
      );
      const alteredBytes = Buffer.from(exactBytes);
      alteredBytes[0] ^= 1;
      const { target } = exactOverlayTarget(
        canonicalRoot,
        ORCHESTRATOR_OVERLAY_PATH,
      );
      writeFileSync(target, alteredBytes, { mode: 0o644 });
      chmodSync(target, 0o644);
      const blob = isolatedGit([
        "hash-object", "-w", "--stdin", "--path", ORCHESTRATOR_OVERLAY_PATH,
      ], { input: alteredBytes }).trim();
      assert.match(blob, /^[0-9a-f]{40}$/u);
      isolatedGit([
        "update-index", "--add", "--cacheinfo", "100644", blob,
        ORCHESTRATOR_OVERLAY_PATH,
      ]);
      const tree = isolatedGit(["write-tree"]).trim();
      const commit = isolatedGit([
        "commit-tree", tree, "-p", parentCommit, "-m",
        "synthetic clean-to-dirty transition baseline",
      ]).trim();
      assert.match(commit, /^[0-9a-f]{40}$/u);
      isolatedGit([
        "update-ref", "refs/heads/main", commit, parentCommit,
      ]);
      isolatedGit([
        "update-ref", "refs/remotes/origin/main", commit, parentCommit,
      ]);
      isolatedGit(["read-tree", "--reset", "-u", commit]);
      assert.equal(isolatedGit([
        "diff-tree", "--no-commit-id", "--name-only", "-r", commit,
      ]), `${ORCHESTRATOR_OVERLAY_PATH}\n`);
      assert.notEqual(sha256(alteredBytes), ORCHESTRATOR_OVERLAY_SHA256);
      return Object.freeze({ commit, tree });
    };
    isolatedGit(["read-tree", parent]);
    isolatedGit([
      "checkout-index", "--all", "--force", `--prefix=${canonicalRoot}/`,
    ]);
    isolatedGit(["update-index", "--refresh"]);
    const sourceMaterializationState = materializeCandidateState(SOURCE_ROOT);
    assert.equal(sourceMaterializationState.baseline_commit, parent);
    if (sourceMaterializationState.commit_created) {
      assertExactlyOneSyntheticCommit(sourceMaterializationState);
    } else {
      assert.equal(
        sourceMaterializationState.candidate_commit,
        sourceMaterializationState.baseline_commit,
      );
      assert.equal(
        sourceMaterializationState.candidate_tree,
        sourceMaterializationState.baseline_tree,
      );
    }
    assert.equal(sourceMaterializationState.overlay_paths, 15);
    const dirtyCandidateBaseline = createAlteredOverlayBaseline(
      sourceMaterializationState.candidate_commit,
    );
    const candidateState = materializeCandidateState(SOURCE_ROOT);
    assert.equal(candidateState.baseline_commit, dirtyCandidateBaseline.commit);
    assert.equal(candidateState.baseline_tree, dirtyCandidateBaseline.tree);
    assertExactlyOneSyntheticCommit(candidateState);
    assert.equal(candidateState.overlay_paths, 15);
    assert.equal(
      sha256(readExactOverlayBytes(canonicalRoot, ORCHESTRATOR_OVERLAY_PATH)),
      ORCHESTRATOR_OVERLAY_SHA256,
    );
    assert.equal(isolatedGit([
      "cat-file", "-t", candidateState.candidate_commit,
    ]).trim(), "commit");
    const cleanPostPublicationState = materializeCandidateState(SOURCE_ROOT);
    assert.equal(
      cleanPostPublicationState.baseline_commit,
      candidateState.candidate_commit,
    );
    assert.equal(cleanPostPublicationState.commit_created, false);
    assert.equal(
      cleanPostPublicationState.candidate_commit,
      cleanPostPublicationState.baseline_commit,
    );
    assert.equal(
      cleanPostPublicationState.candidate_tree,
      cleanPostPublicationState.baseline_tree,
    );
    assert.equal(
      sha256(readExactOverlayBytes(canonicalRoot, ORCHESTRATOR_OVERLAY_PATH)),
      ORCHESTRATOR_OVERLAY_SHA256,
    );
    assert.equal(cleanPostPublicationState.overlay_paths, 15);
    assertPinnedOrchestratorCovered(
      CANDIDATE_OVERLAY_PATHS,
      ORCHESTRATOR_OVERLAY_SHA256,
    );
    const alteredOverlayBaseline = createAlteredOverlayBaseline(
      cleanPostPublicationState.candidate_commit,
    );
    const negativeTransitionState = materializeCandidateState(SOURCE_ROOT);
    assert.equal(
      negativeTransitionState.baseline_commit,
      alteredOverlayBaseline.commit,
    );
    assert.equal(
      negativeTransitionState.baseline_tree,
      alteredOverlayBaseline.tree,
    );
    assertExactlyOneSyntheticCommit(negativeTransitionState);
    assert.equal(
      sha256(readExactOverlayBytes(canonicalRoot, ORCHESTRATOR_OVERLAY_PATH)),
      ORCHESTRATOR_OVERLAY_SHA256,
    );
    isolatedGit([
      "update-ref", "refs/heads/main", candidateState.candidate_commit,
      negativeTransitionState.candidate_commit,
    ]);
    isolatedGit([
      "update-ref", "refs/remotes/origin/main", candidateState.candidate_commit,
      negativeTransitionState.candidate_commit,
    ]);
    isolatedGit([
      "read-tree", "--reset", "-u", candidateState.candidate_commit,
    ]);
    assert.equal(isolatedGit([
      "status", "--porcelain=v1", "--untracked-files=all",
    ]), "");
    writeFileSync(path.join(canonicalRoot, SYNTHETIC_PROOF_PATH), SYNTHETIC_PROOF_BYTES, {
      flag: "wx",
      mode: 0o644,
    });
    return Object.freeze({
      git_environment: gitEnvironment,
      object_directory: canonicalObjectDirectory,
      candidate_state: candidateState,
      clean_postpublication_state: cleanPostPublicationState,
      negative_transition_state: negativeTransitionState,
      root: canonicalRoot,
      temporary_root: temporaryRoot,
      worktree_index: worktreeIndex,
    });
  } catch (error) {
    makeTreeOwnerWritable(temporaryRoot);
    rmSync(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}

const sourceObjectStateBefore = sourceGit(["count-objects", "-v"]);
const sourceIndexShaBefore = sha256(readFileSync(path.join(SOURCE_ROOT, ".git", "index")));
const sourceRefsShaBefore = sha256(sourceGit([
  "for-each-ref",
  "--format=%(refname)%00%(objectname)%00%(symref)",
]));
const SYNTHETIC_REPOSITORY = createSyntheticRepository();
const ROOT = SYNTHETIC_REPOSITORY.root;
const POLICY_PATH = path.join(ROOT, POLICY_RELATIVE_PATH);
const SUPERVISOR_PATH = path.join(
  ROOT,
  "scripts/launch-operations-supervisor/nonproduction-qualification-supervisor.mjs",
);

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
  const indexFile = path.join(
    SYNTHETIC_REPOSITORY.temporary_root,
    "synthetic-commit.index",
  );
  git(["read-tree", parent], { indexFile });
  const blob = git([
    "hash-object", "-w", "--stdin", "--path", SYNTHETIC_PROOF_PATH,
  ], { indexFile, input: SYNTHETIC_PROOF_BYTES }).trim();
  assert.match(blob, /^[0-9a-f]{40}$/u);
  git([
    "update-index", "--add", "--cacheinfo", "100644", blob,
    SYNTHETIC_PROOF_PATH,
  ], { indexFile });
  const tree = git(["write-tree"], { indexFile }).trim();
  const commit = git([
    "commit-tree", tree, "-p", parent, "-m",
    "synthetic admin v1 official concrete supervisor proof",
  ], { indexFile }).trim();
  assert.match(commit, /^[0-9a-f]{40}$/u);
  return commit;
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
      if (operation === "create_remote_ref") {
        return {
          status: "CREATED_EXACT",
          ref_id: `refs/heads/${authorization.execution.branch_name}`,
        };
      }
      if (operation.startsWith("create_environment_")) {
        return { status: "CREATED_EXACT", record_id: `env-${operation.at(-1)}` };
      }
      if (operation.startsWith("verify_environment_")) {
        return { status: "EXACT", record_id: input.record_id };
      }
      if (operation === "acquire_automatic_preview") {
        return { status: "ACQUIRED_EXACT", deployment_id: "dpl-owned" };
      }
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
  assert.equal(
    repository.head,
    SYNTHETIC_REPOSITORY.candidate_state.candidate_commit,
  );
  assert.equal(
    repository.head,
    SYNTHETIC_REPOSITORY.clean_postpublication_state.candidate_commit,
  );
  const candidateVerification = createConcreteRunnerDependencies({
    repositoryRoot: ROOT,
    officialRepositoryObservation: repository,
    nowEpochMs: NOW,
  }).verifyCandidate();
  assert.equal(candidateVerification.verified, true);
  assert.equal(candidateVerification.membership_exact, true);
  assert.equal(
    candidateVerification.candidate_identity_sha256,
    policy.candidate.candidate_identity_sha256,
  );
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
  const nonNulStatusSha256 = sha256(Buffer.from(git([
    "status", "--porcelain=v1", "--untracked-files=all",
  ]), "utf8"));
  assert.notEqual(nonNulStatusSha256, repository.status_sha256);
  const nonNulAuthorization = structuredClone(authorization);
  nonNulAuthorization.repository.status_sha256 = nonNulStatusSha256;
  writeFileSync(
    AUTHORIZATION_PATH,
    `${canonicalJson(nonNulAuthorization)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  chmodSync(AUTHORIZATION_PATH, 0o600);
  authorizationCreated = true;
  const preImportCounters = { imports: 0, credentials: 0 };
  const preImportOutput = [];
  const nonNulResult = await dispatchPreImportSupervisor(
    ["--run-admin-v1-official", "--authorization", AUTHORIZATION_PATH],
    {
      repository_root: ROOT,
      supervisor_path: SUPERVISOR_PATH,
      policy_path: POLICY_PATH,
      now_epoch_ms: NOW,
      inspect_repository: () => structuredClone(repository),
      import_runner() {
        preImportCounters.imports += 1;
        throw new Error("NON_NUL_AUTHORIZATION_IMPORTED_RUNNER");
      },
      read_credential_environment() {
        preImportCounters.credentials += 1;
        throw new Error("NON_NUL_AUTHORIZATION_READ_CREDENTIALS");
      },
      write_output(value) {
        preImportOutput.push(structuredClone(value));
      },
    },
  );
  assert.deepEqual(nonNulResult, {
    exit_code: 1,
    code: "SUPERVISOR_REPOSITORY_MISMATCH",
  });
  assert.deepEqual(preImportCounters, { imports: 0, credentials: 0 });
  assert.deepEqual(preImportOutput, [{
    status: "FAIL",
    code: "SUPERVISOR_REPOSITORY_MISMATCH",
  }]);
  writeFileSync(AUTHORIZATION_PATH, `${canonicalJson(authorization)}\n`, {
    mode: 0o600,
  });
  chmodSync(AUTHORIZATION_PATH, 0o600);
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
  assert.equal(sourceGit(["count-objects", "-v"]), sourceObjectStateBefore);
  assert.equal(
    sha256(readFileSync(path.join(SOURCE_ROOT, ".git", "index"))),
    sourceIndexShaBefore,
  );
  assert.equal(sha256(sourceGit([
    "for-each-ref",
    "--format=%(refname)%00%(objectname)%00%(symref)",
  ])), sourceRefsShaBefore);
  console.log(
    "PASS_ADMIN_V1_OFFICIAL_CONCRETE_SUPERVISOR SYNTHETIC_DYNAMIC_SOURCE_HEAD=PASS SYNTHETIC_EXTERNAL_BASELINE_SUBSTITUTION=REJECTED SYNTHETIC_CANDIDATE_OVERLAY_PATHS=15 SYNTHETIC_CANDIDATE_OVERLAY_ORIGINAL_14_PRESERVED=PASS SYNTHETIC_ORIGINAL_14_BASELINE_ORCHESTRATOR_EQUALITY=PASS SYNTHETIC_CANDIDATE_OVERLAY_MISSING_ORCHESTRATOR=REJECTED SYNTHETIC_CANDIDATE_OVERLAY_UNEXPECTED_16TH=REJECTED SYNTHETIC_CANDIDATE_OVERLAY_DUPLICATE=REJECTED SYNTHETIC_ORCHESTRATOR_SHA256=0f8a35567bae55e7c875accf15745a679a8cfb263803f3aabb5c0afbefa22951 SYNTHETIC_BASELINE_ORCHESTRATOR_EQUALITY_ALLOWED=PASS SYNTHETIC_SOURCE_MATERIALIZATION_PUBLICATION_STABLE=PASS SYNTHETIC_CANDIDATE_OVERLAY_EXACT_ALLOWLIST=PASS SYNTHETIC_CANDIDATE_OVERLAY_PROTECTED_DRAFTS=0 SYNTHETIC_DIRTY_CANDIDATE_STATE_A_COMMIT_CREATED=true SYNTHETIC_DIRTY_CANDIDATE_STATE_A_EXACTLY_ONE_COMMIT=PASS SYNTHETIC_CLEAN_POSTPUBLICATION_STATE_B_COMMIT_CREATED=false SYNTHETIC_CLEAN_POSTPUBLICATION_STATE_B_TREE_EQUAL=PASS SYNTHETIC_CLEAN_POSTPUBLICATION_STATE_B_CANDIDATE_VERIFY=PASS SYNTHETIC_NEGATIVE_CLEAN_TO_DIRTY_COMMIT_CREATED=true SYNTHETIC_NEGATIVE_CLEAN_TO_DIRTY_EXACTLY_ONE_COMMIT=PASS SYNTHETIC_CANDIDATE_STATE_TREE=EXACT SYNTHETIC_CANDIDATE_STATE_COMMIT_ISOLATED=PASS SYNTHETIC_CANDIDATE_MANIFEST_VERIFY=PASS SYNTHETIC_MAIN_ORIGIN_MAIN_EQUAL=PASS CONCRETE_SUPERVISOR_RESULT=OFFICIAL_RUNTIME_COMPLETE QUALIFICATION_REQUESTS=6 OFFICIAL_REQUESTS=20 RUNTIME_SESSIONS=1 RUNTIME_RETRIES=0 RUNTIME_REPLAYS=0 CREDENTIAL_READS=1 ADAPTER_EFFECTS_GT_26=true SOURCE_OBJECT_WRITES=0 SOURCE_INDEX_WRITES=0 SOURCE_REF_WRITES=0 PROTECTED_DRAFT_CONTENT_READS_V6=0 REAL_EXTERNAL_ACTIONS=0 real_supervisor=true real_factory=true real_state_machine=true low_level_fakes=true isolated_index=true isolated_objects=true",
  );
} finally {
  if (authorizationCreated) unlinkSync(AUTHORIZATION_PATH);
  if (policyCreated) unlinkSync(POLICY_PATH);
  makeTreeOwnerWritable(JOURNAL_DIRECTORY);
  rmSync(JOURNAL_DIRECTORY, { recursive: true, force: true });
  makeTreeOwnerWritable(SYNTHETIC_REPOSITORY.temporary_root);
  rmSync(SYNTHETIC_REPOSITORY.temporary_root, { recursive: true, force: true });
}
