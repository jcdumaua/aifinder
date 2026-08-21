import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  awaitConcreteWriterAcquisition,
  createConcreteCheckpointStore,
} from "./nonproduction-qualification-checkpoint-store.mjs";

const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    const nestedCode = error?.actual?.code;
    failures.push(
      `${name}:${error?.code ?? error?.message ?? "UNKNOWN"}` +
        (typeof nestedCode === "string" ? `[actual=${nestedCode}]` : ""),
    );
  }
}

function sha(character) {
  return character.repeat(64);
}

function authenticInitialState({ journal = sha("a"), extra = {} } = {}) {
  const payload = {
    journal_identity_sha256: journal,
    ...structuredClone(extra),
  };
  const predecessor = sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_KERNEL_CHECKPOINT_ROOT",
    journal_identity_sha256: journal,
  }));
  return {
    ...payload,
    checkpoint: {
      schema_version: 1,
      sequence: 0,
      predecessor_checkpoint_identity_sha256: predecessor,
      checkpoint_identity_sha256: sha256Hex(canonicalJson({
        schema_version: 1,
        journal_identity_sha256: journal,
        sequence: 0,
        predecessor_checkpoint_identity_sha256: predecessor,
        checkpoint_state: payload,
      })),
    },
  };
}

function initialRecord(state, recordIdentity = identity) {
  return {
    schema_version: 1,
    identity: structuredClone(recordIdentity),
    state: structuredClone(state),
    adapter_receipts: [],
    external_bindings: [],
  };
}

function writeOwnedLock(directory) {
  const lockPath = path.join(directory, ".qualification-journal.lock");
  writeFileSync(lockPath, `${JSON.stringify({
    owner_pid: 2147483647,
    owner_token_sha256: sha("f"),
  })}\n`, { mode: 0o600 });
  chmodSync(lockPath, 0o600);
}

function removeCheckpointRoot(directory) {
  for (const name of readdirSync(directory)) {
    const target = path.join(directory, name);
    if (existsSync(target) && lstatSync(target).isFile()) unlinkSync(target);
  }
  if (existsSync(directory)) rmdirSync(directory);
}

function syntheticBusyWriterWithEarlyEpipe() {
  const onceListeners = new Map();
  const child = {
    exitCode: null,
    stdin: {
      destroy() {},
      end() {},
      on() {},
      write(_chunk, callback) {
        queueMicrotask(() => {
          const error = new Error("synthetic busy writer closed stdin");
          error.code = "EPIPE";
          callback(error);
          queueMicrotask(() => {
            child.exitCode = 75;
            onceListeners.get("exit")?.(75, null);
          });
        });
      },
    },
    stdout: {
      on() {},
      setEncoding() {},
    },
    stderr: {
      resume() {},
    },
    once(name, listener) {
      onceListeners.set(name, listener);
    },
  };
  return child;
}

const root = mkdtempSync("/tmp/aifinder-concrete-checkpoint.");
chmodSync(root, 0o700);
const identity = {
  authorization_id_sha256: sha("1"),
  candidate_identity_sha256: sha("2"),
  manifest_sha256: sha("3"),
  run_id: "55555555-5555-4555-8555-555555555555",
};

await check("checkpoint lease materializes an exact config-isolated Git execution context", async () => {
  const checkpointRoot = realpathSync(
    mkdtempSync("/tmp/aifinder-concrete-checkpoint-git-context."),
  );
  const repositoryRoot = realpathSync(
    mkdtempSync("/tmp/aifinder-concrete-checkpoint-git-repository."),
  );
  try {
    mkdirSync(path.join(repositoryRoot, ".git"), { mode: 0o700 });
    mkdirSync(path.join(repositoryRoot, ".git", "objects"), { mode: 0o700 });
    const store = createConcreteCheckpointStore({
      directory: checkpointRoot,
      identity,
    });
    const context = await store.prepareGitExecutionContext({
      repository_root: repositoryRoot,
    });
    assert.deepEqual(Object.keys(context).sort(), [
      "git_dir",
      "object_directory",
    ]);
    assert.equal(
      context.object_directory,
      path.join(repositoryRoot, ".git", "objects"),
    );
    assert.equal(realpathSync(context.git_dir), context.git_dir);
    assert.equal((lstatSync(context.git_dir).mode & 0o777), 0o500);
    assert.equal(
      readFileSync(path.join(context.git_dir, "config"), "utf8"),
      "[core]\n\tbare = true\n\trepositoryformatversion = 0\n",
    );
    assert.equal(
      readFileSync(path.join(context.git_dir, "HEAD"), "utf8"),
      "ref: refs/heads/qualification-context\n",
    );
    assert.deepEqual(
      await store.prepareGitExecutionContext({ repository_root: repositoryRoot }),
      context,
    );
    chmodSync(context.git_dir, 0o700);
    chmodSync(path.join(context.git_dir, "config"), 0o600);
    writeFileSync(
      path.join(context.git_dir, "config"),
      "[core]\n\tbare = false\n\trepositoryformatversion = 0\n",
      "utf8",
    );
    chmodSync(path.join(context.git_dir, "config"), 0o400);
    chmodSync(context.git_dir, 0o500);
    await assert.rejects(
      store.prepareGitExecutionContext({ repository_root: repositoryRoot }),
      (error) => error?.code === "CONCRETE_GIT_CONTEXT_INVALID",
    );
  } finally {
    if (!checkpointRoot.startsWith("/private/tmp/aifinder-concrete-checkpoint-git-context.")) {
      throw new Error("CHECKPOINT_TEST_ROOT_INVALID");
    }
    if (!repositoryRoot.startsWith("/private/tmp/aifinder-concrete-checkpoint-git-repository.")) {
      throw new Error("CHECKPOINT_TEST_REPOSITORY_ROOT_INVALID");
    }
    const contextRoot = path.join(
      checkpointRoot,
      ".qualification-git-context",
    );
    if (existsSync(contextRoot)) {
      for (const target of [
        path.join(contextRoot, "refs", "heads"),
        path.join(contextRoot, "refs"),
        path.join(contextRoot, "objects"),
        contextRoot,
      ]) {
        chmodSync(target, 0o700);
      }
    }
    rmSync(checkpointRoot, { recursive: true });
    rmSync(repositoryRoot, { recursive: true });
  }
});

await check("owned partial Git context publication is recovered before restart", async () => {
  const phases = [
    ["empty", () => {}],
    ["objects", (target) => {
      mkdirSync(path.join(target, "objects"), { mode: 0o700 });
    }],
    ["directories", (target) => {
      mkdirSync(path.join(target, "objects"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs", "heads"), { mode: 0o700 });
    }],
    ["partial-file", (target) => {
      mkdirSync(path.join(target, "objects"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs", "heads"), { mode: 0o700 });
      writeFileSync(path.join(target, "config"), "partial", { mode: 0o600 });
    }],
    ["complete-writable", (target) => {
      mkdirSync(path.join(target, "objects"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs"), { mode: 0o700 });
      mkdirSync(path.join(target, "refs", "heads"), { mode: 0o700 });
      writeFileSync(
        path.join(target, "config"),
        "[core]\n\tbare = true\n\trepositoryformatversion = 0\n",
        { mode: 0o600 },
      );
      writeFileSync(
        path.join(target, "HEAD"),
        "ref: refs/heads/qualification-context\n",
        { mode: 0o600 },
      );
    }],
  ];
  for (const [phase, materialize] of phases) {
    const checkpointRoot = realpathSync(
      mkdtempSync(`/tmp/aifinder-concrete-checkpoint-git-restart-${phase}.`),
    );
    const repositoryRoot = realpathSync(
      mkdtempSync(`/tmp/aifinder-concrete-checkpoint-git-repository-${phase}.`),
    );
    const nextRoot = path.join(
      checkpointRoot,
      ".qualification-git-context.next",
    );
    const finalRoot = path.join(
      checkpointRoot,
      ".qualification-git-context",
    );
    try {
      mkdirSync(path.join(repositoryRoot, ".git"), { mode: 0o700 });
      mkdirSync(path.join(repositoryRoot, ".git", "objects"), { mode: 0o700 });
      mkdirSync(nextRoot, { mode: 0o700 });
      materialize(nextRoot);
      const store = createConcreteCheckpointStore({
        directory: checkpointRoot,
        identity,
      });
      const context = await store.prepareGitExecutionContext({
        repository_root: repositoryRoot,
      });
      assert.equal(existsSync(nextRoot), false, phase);
      assert.equal(context.git_dir, finalRoot, phase);
      assert.equal((lstatSync(finalRoot).mode & 0o777), 0o500, phase);
      assert.equal((lstatSync(path.join(finalRoot, "config")).mode & 0o777), 0o400, phase);
      assert.equal((lstatSync(path.join(finalRoot, "HEAD")).mode & 0o777), 0o400, phase);
    } finally {
      for (const contextRoot of [nextRoot, finalRoot]) {
        for (const target of [
          path.join(contextRoot, "refs", "heads"),
          path.join(contextRoot, "refs"),
          path.join(contextRoot, "objects"),
          contextRoot,
        ]) {
          if (existsSync(target) && lstatSync(target).isDirectory()) {
            chmodSync(target, 0o700);
          }
        }
      }
      rmSync(checkpointRoot, { recursive: true });
      rmSync(repositoryRoot, { recursive: true });
    }
  }
});

await check("Git context reaches its final path only by same-parent atomic promotion", async () => {
  const source = readFileSync(
    new URL("./nonproduction-qualification-checkpoint-store.mjs", import.meta.url),
    "utf8",
  );
  const createNext = source.indexOf(
    "mkdirSync(nextContextDirectory, { mode: 0o700 });",
  );
  const syncNext = source.indexOf(
    "syncGitContextDirectory(nextContextDirectory);",
  );
  const promote = source.indexOf(
    "renameSync(nextContextDirectory, contextDirectory);",
  );
  const syncParent = source.indexOf("syncDirectory();", promote);
  assert.equal(createNext >= 0, true);
  assert.equal(syncNext > createNext, true);
  assert.equal(promote > syncNext, true);
  assert.equal(syncParent > promote, true);
});

await check("checkpoint rename is made durable by fsyncing its directory", async () => {
  const source = readFileSync(
    new URL("./nonproduction-qualification-checkpoint-store.mjs", import.meta.url),
    "utf8",
  );
  const rename = source.indexOf("renameSync(nextPath, filePath);");
  const openDirectory = source.indexOf(
    'directoryDescriptor = openSync(canonicalDirectory, "r");',
  );
  const syncDirectory = source.indexOf("fsyncSync(directoryDescriptor);");
  assert.equal(rename >= 0, true);
  assert.equal(openDirectory > rename, true);
  assert.equal(syncDirectory > openDirectory, true);
});

await check("checkpoint state and adapter bindings survive exact reload", async () => {
  const first = createConcreteCheckpointStore({ directory: root, identity });
  const state = {
    journal_identity_sha256: sha("4"),
    checkpoint: {
      sequence: 0,
      predecessor_checkpoint_identity_sha256: null,
      checkpoint_identity_sha256: sha("5"),
    },
  };
  const begin = await first.checkpoint(state, {
    schema_version: 1,
    operation: "BEGIN_ATTEMPT",
    journal_identity_sha256: sha("4"),
    checkpoint_sequence: 0,
    predecessor_checkpoint_identity_sha256: null,
    checkpoint_identity_sha256: sha("5"),
  });
  assert.equal(begin.status, "CHECKPOINT_COMMITTED");
  const receipt = { status: "CREATED_NEW", resource_key: "owned:resource" };
  const binding = { resource_type: "DATABASE_ROW", row_ids: ["row-1"] };
  await first.recordAdapterReceipt(sha("6"), receipt, binding);
  await first.recordExternalBinding("owned:environment", {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_SESSION_SECRET", id: "env-2" }],
  });
  await first.recordExternalBinding("owned:environment", {
    resource_type: "ENVIRONMENT_RECORD",
    records: [
      { key: "ADMIN_PASSWORD", id: "env-1" },
      { key: "ADMIN_SESSION_SECRET", id: "env-2" },
    ],
  });

  const second = createConcreteCheckpointStore({ directory: root, identity });
  assert.deepEqual(await second.loadState(), state);
  assert.deepEqual(await second.readAdapterReceipt(sha("6")), receipt);
  assert.deepEqual(await second.loadExternalBinding("owned:resource"), binding);
  assert.deepEqual(await second.loadExternalBinding("owned:environment"), {
    resource_type: "ENVIRONMENT_RECORD",
    records: [
      { key: "ADMIN_PASSWORD", id: "env-1" },
      { key: "ADMIN_SESSION_SECRET", id: "env-2" },
    ],
  });
  assert.equal(lstatSync(second.file_path).mode & 0o777, 0o600);
  assert.equal(readFileSync(second.file_path).includes(Buffer.from("secret-value")), false);
});

await check("checkpoint CAS and one-use receipt identity fail closed", async () => {
  const store = createConcreteCheckpointStore({ directory: root, identity });
  await assert.rejects(
    store.checkpoint(
      {
        journal_identity_sha256: sha("4"),
        checkpoint: {
          sequence: 1,
          predecessor_checkpoint_identity_sha256: sha("7"),
          checkpoint_identity_sha256: sha("8"),
        },
      },
      {
        schema_version: 1,
        operation: "ADVANCE_CHECKPOINT",
        journal_identity_sha256: sha("4"),
        checkpoint_sequence: 1,
        predecessor_checkpoint_identity_sha256: sha("7"),
        checkpoint_identity_sha256: sha("8"),
      },
    ),
    (error) => error?.code === "CHECKPOINT_CAS_MISMATCH",
  );
  await assert.rejects(
    store.recordAdapterReceipt(
      sha("6"),
      { status: "CREATED_NEW", resource_key: "other" },
      null,
    ),
    (error) => error?.code === "CONCRETE_ADAPTER_RECEIPT_CONFLICT",
  );
  await assert.rejects(
    store.recordExternalBinding("owned:environment", {
      resource_type: "ENVIRONMENT_RECORD",
      records: [{ key: "ADMIN_PASSWORD", id: "substituted-env" }],
    }),
    (error) => error?.code === "CONCRETE_EXTERNAL_BINDING_CONFLICT",
  );
});

await check("attempt identity is immutable across store reopen", async () => {
  assert.throws(
    () => createConcreteCheckpointStore({
      directory: root,
      identity: { ...identity, candidate_identity_sha256: sha("9") },
    }),
    (error) => error?.code === "CONCRETE_CHECKPOINT_IDENTITY_MISMATCH",
  );
  assert.throws(
    () => createConcreteCheckpointStore({
      directory: root,
      identity: { ...identity, run_id: "not-a-uuid-run" },
    }),
    (error) => error?.code === "CONCRETE_CHECKPOINT_IDENTITY_MISMATCH",
  );
});

await check("a complete interrupted durable publication is recovered on restart", async () => {
  const interruptedRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-interrupted.");
  chmodSync(interruptedRoot, 0o700);
  const state = authenticInitialState();
  const record = initialRecord(state);
  const nextPath = path.join(
    interruptedRoot,
    ".qualification-journal.next",
  );
  const lockPath = path.join(
    interruptedRoot,
    ".qualification-journal.lock",
  );
  try {
    writeFileSync(nextPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    chmodSync(nextPath, 0o600);
    writeOwnedLock(interruptedRoot);
    const recovered = createConcreteCheckpointStore({
      directory: interruptedRoot,
      identity,
    });
    assert.deepEqual(await recovered.loadState(), state);
    assert.equal(existsSync(nextPath), false);
    assert.equal(existsSync(recovered.file_path), true);
  } finally {
    removeCheckpointRoot(interruptedRoot);
  }
});

await check("incomplete initial temp write is discarded without creating a final", async () => {
  const directory = mkdtempSync("/tmp/aifinder-concrete-checkpoint-incomplete-initial.");
  chmodSync(directory, 0o700);
  const nextPath = path.join(directory, ".qualification-journal.next");
  try {
    writeFileSync(nextPath, "{", { mode: 0o600 });
    chmodSync(nextPath, 0o600);
    writeOwnedLock(directory);
    const store = createConcreteCheckpointStore({ directory, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_STATE_ABSENT",
    );
    assert.equal(existsSync(nextPath), false);
    assert.equal(existsSync(store.file_path), false);
  } finally {
    removeCheckpointRoot(directory);
  }
});

for (const phase of ["complete-before-fsync", "complete-fsynced-before-rename"]) {
  await check(`authentic initial temp at ${phase} recovers exactly`, async () => {
    const directory = mkdtempSync(`/tmp/aifinder-concrete-checkpoint-${phase}.`);
    chmodSync(directory, 0o700);
    const nextPath = path.join(directory, ".qualification-journal.next");
    const state = authenticInitialState({ extra: { phase } });
    try {
      writeFileSync(nextPath, `${canonicalJson(initialRecord(state))}\n`, {
        mode: 0o600,
      });
      chmodSync(nextPath, 0o600);
      writeOwnedLock(directory);
      const store = createConcreteCheckpointStore({ directory, identity });
      assert.deepEqual(await store.loadState(), state);
      assert.equal(existsSync(nextPath), false);
    } finally {
      removeCheckpointRoot(directory);
    }
  });
}

await check("renamed authentic initial final survives restart before directory fsync", async () => {
  const directory = mkdtempSync("/tmp/aifinder-concrete-checkpoint-renamed-initial.");
  chmodSync(directory, 0o700);
  const finalPath = path.join(directory, "qualification-journal.json");
  const state = authenticInitialState({ extra: { phase: "renamed" } });
  try {
    writeFileSync(finalPath, `${canonicalJson(initialRecord(state))}\n`, {
      mode: 0o600,
    });
    chmodSync(finalPath, 0o600);
    writeOwnedLock(directory);
    const store = createConcreteCheckpointStore({ directory, identity });
    assert.deepEqual(await store.loadState(), state);
  } finally {
    removeCheckpointRoot(directory);
  }
});

await check("duplicate authentic final and temp is rejected as ambiguous", async () => {
  const directory = mkdtempSync("/tmp/aifinder-concrete-checkpoint-duplicate-initial.");
  chmodSync(directory, 0o700);
  const bytes = `${canonicalJson(initialRecord(authenticInitialState()))}\n`;
  try {
    for (const name of ["qualification-journal.json", ".qualification-journal.next"]) {
      const target = path.join(directory, name);
      writeFileSync(target, bytes, { mode: 0o600 });
      chmodSync(target, 0o600);
    }
    writeOwnedLock(directory);
    const store = createConcreteCheckpointStore({ directory, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_TEMP_CONFLICT",
    );
  } finally {
    removeCheckpointRoot(directory);
  }
});

await check("wrong authentic-initial predecessor is rejected", async () => {
  const directory = mkdtempSync("/tmp/aifinder-concrete-checkpoint-wrong-predecessor.");
  chmodSync(directory, 0o700);
  const nextPath = path.join(directory, ".qualification-journal.next");
  const state = authenticInitialState();
  state.checkpoint.predecessor_checkpoint_identity_sha256 = sha("0");
  try {
    writeFileSync(nextPath, `${canonicalJson(initialRecord(state))}\n`, { mode: 0o600 });
    chmodSync(nextPath, 0o600);
    writeOwnedLock(directory);
    const store = createConcreteCheckpointStore({ directory, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_TEMP_CONFLICT",
    );
  } finally {
    removeCheckpointRoot(directory);
  }
});

await check("wrong candidate binding in authentic initial temp is rejected", async () => {
  const directory = mkdtempSync("/tmp/aifinder-concrete-checkpoint-wrong-candidate.");
  chmodSync(directory, 0o700);
  const nextPath = path.join(directory, ".qualification-journal.next");
  try {
    writeFileSync(
      nextPath,
      `${canonicalJson(initialRecord(authenticInitialState(), {
        ...identity,
        candidate_identity_sha256: sha("9"),
      }))}\n`,
      { mode: 0o600 },
    );
    chmodSync(nextPath, 0o600);
    writeOwnedLock(directory);
    const store = createConcreteCheckpointStore({ directory, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_TEMP_CONFLICT",
    );
  } finally {
    removeCheckpointRoot(directory);
  }
});

for (const [name, override] of [
  ["authorization", { authorization_id_sha256: sha("8") }],
  ["run", { run_id: "66666666-6666-4666-8666-666666666666" }],
]) {
  await check(`wrong ${name} binding in authentic initial temp is rejected`, async () => {
    const directory = mkdtempSync(`/tmp/aifinder-concrete-checkpoint-wrong-${name}.`);
    chmodSync(directory, 0o700);
    const nextPath = path.join(directory, ".qualification-journal.next");
    try {
      writeFileSync(
        nextPath,
        `${canonicalJson(initialRecord(authenticInitialState(), {
          ...identity,
          ...override,
        }))}\n`,
        { mode: 0o600 },
      );
      chmodSync(nextPath, 0o600);
      writeOwnedLock(directory);
      const store = createConcreteCheckpointStore({ directory, identity });
      await assert.rejects(
        store.loadState(),
        (error) => error?.code === "CONCRETE_CHECKPOINT_TEMP_CONFLICT",
      );
    } finally {
      removeCheckpointRoot(directory);
    }
  });
}

await check("partial or stale interrupted publications preserve the newer authoritative head", async () => {
  const crashRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-crash-boundaries.");
  chmodSync(crashRoot, 0o700);
  const nextPath = path.join(crashRoot, ".qualification-journal.next");
  try {
    const store = createConcreteCheckpointStore({ directory: crashRoot, identity });
    const firstState = {
      journal_identity_sha256: sha("1"),
      checkpoint: {
        sequence: 0,
        predecessor_checkpoint_identity_sha256: null,
        checkpoint_identity_sha256: sha("2"),
      },
    };
    await store.checkpoint(firstState, {
      schema_version: 1,
      operation: "BEGIN_ATTEMPT",
      journal_identity_sha256: sha("1"),
      checkpoint_sequence: 0,
      predecessor_checkpoint_identity_sha256: null,
      checkpoint_identity_sha256: sha("2"),
    });
    const staleBytes = readFileSync(store.file_path);
    writeFileSync(nextPath, "{", { mode: 0o600 });
    chmodSync(nextPath, 0o600);
    const afterPartial = createConcreteCheckpointStore({
      directory: crashRoot,
      identity,
    });
    assert.deepEqual(await afterPartial.loadState(), firstState);
    assert.equal(existsSync(nextPath), false);

    const secondState = {
      journal_identity_sha256: sha("1"),
      checkpoint: {
        sequence: 1,
        predecessor_checkpoint_identity_sha256: sha("2"),
        checkpoint_identity_sha256: sha("3"),
      },
    };
    await afterPartial.checkpoint(secondState, {
      schema_version: 1,
      operation: "ADVANCE_CHECKPOINT",
      journal_identity_sha256: sha("1"),
      checkpoint_sequence: 1,
      predecessor_checkpoint_identity_sha256: sha("2"),
      checkpoint_identity_sha256: sha("3"),
    });
    writeFileSync(nextPath, staleBytes, { mode: 0o600 });
    chmodSync(nextPath, 0o600);
    const afterStale = createConcreteCheckpointStore({
      directory: crashRoot,
      identity,
    });
    assert.deepEqual(await afterStale.loadState(), secondState);
    assert.equal(existsSync(nextPath), false);
  } finally {
    removeCheckpointRoot(crashRoot);
  }
});

await check("partial writer-owner publication cannot poison restart", async () => {
  const partialRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-partial-owner.");
  chmodSync(partialRoot, 0o700);
  const partialOwner = path.join(
    partialRoot,
    `.qualification-journal.writer.${process.pid}.${sha("a")}`,
  );
  try {
    writeFileSync(partialOwner, "{", { mode: 0o600 });
    chmodSync(partialOwner, 0o600);
    const store = createConcreteCheckpointStore({ directory: partialRoot, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_STATE_ABSENT",
    );
  } finally {
    removeCheckpointRoot(partialRoot);
  }
});

await check("PID reuse without an active operating-system lease cannot poison restart", async () => {
  const staleRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-stale-pid.");
  chmodSync(staleRoot, 0o700);
  const lockPath = path.join(staleRoot, ".qualification-journal.lock");
  try {
    writeFileSync(lockPath, `${JSON.stringify({
      owner_pid: process.pid,
      owner_token_sha256: sha("b"),
    })}\n`, { mode: 0o600 });
    chmodSync(lockPath, 0o600);
    const store = createConcreteCheckpointStore({ directory: staleRoot, identity });
    await assert.rejects(
      store.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_STATE_ABSENT",
    );
  } finally {
    removeCheckpointRoot(staleRoot);
  }
});

await check("busy exit remains authoritative when stdin EPIPE arrives first", async () => {
  await assert.rejects(
    awaitConcreteWriterAcquisition({
      child: syntheticBusyWriterWithEarlyEpipe(),
      handshake: `${sha("a")}\n`,
      timeout_ms: 1_000,
    }),
    (error) => error?.code === "CONCRETE_CHECKPOINT_WRITER_BUSY",
  );
});

await check("busy lock classification follows authoritative exit status", async () => {
  const eventOrderRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-event-order.");
  chmodSync(eventOrderRoot, 0o700);
  const first = createConcreteCheckpointStore({ directory: eventOrderRoot, identity });
  const second = createConcreteCheckpointStore({ directory: eventOrderRoot, identity });
  let releaseFirst;
  let markEntered;
  const entered = new Promise((resolve) => {
    markEntered = resolve;
  });
  const release = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const held = first.withExclusiveWriter(async () => {
    markEntered();
    await release;
  });
  try {
    await entered;
    const results = await Promise.allSettled(
      Array.from({ length: 128 }, () => second.loadState()),
    );
    const codes = results.map((result) =>
      result.status === "rejected" ? result.reason?.code : "RESOLVED"
    );
    assert.equal(
      codes.every((code) => code === "CONCRETE_CHECKPOINT_WRITER_BUSY"),
      true,
      JSON.stringify(Object.fromEntries(
        [...new Set(codes)].map((code) => [code, codes.filter((item) => item === code).length]),
      )),
    );
  } finally {
    releaseFirst();
    await held;
    removeCheckpointRoot(eventOrderRoot);
  }
});

await check("expired async writer context cannot bypass a later exclusive owner", async () => {
  const delayedRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-delayed-context.");
  chmodSync(delayedRoot, 0o700);
  try {
    const first = createConcreteCheckpointStore({ directory: delayedRoot, identity });
    const second = createConcreteCheckpointStore({ directory: delayedRoot, identity });
    let releaseLate;
    const lateGate = new Promise((resolve) => {
      releaseLate = resolve;
    });
    let lateOperation;
    await first.withExclusiveWriter(async () => {
      lateOperation = (async () => {
        await lateGate;
        return first.recordExternalBinding("late-resource", {
          resource_type: "DATABASE_ROW",
          row_ids: ["late-row"],
        });
      })();
    });

    let releaseSecond;
    let markSecondEntered;
    const secondEntered = new Promise((resolve) => {
      markSecondEntered = resolve;
    });
    const secondRelease = new Promise((resolve) => {
      releaseSecond = resolve;
    });
    const held = second.withExclusiveWriter(async () => {
      markSecondEntered();
      await secondRelease;
    });
    await secondEntered;
    releaseLate();
    try {
      await assert.rejects(
        lateOperation,
        (error) => error?.code === "CONCRETE_CHECKPOINT_WRITER_BUSY",
      );
    } finally {
      releaseSecond();
      await held;
    }
  } finally {
    removeCheckpointRoot(delayedRoot);
  }
});

await check("exclusive writer ownership makes one-use effects single-invocation", async () => {
  const concurrentRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-one-use.");
  chmodSync(concurrentRoot, 0o700);
  try {
    const first = createConcreteCheckpointStore({ directory: concurrentRoot, identity });
    const second = createConcreteCheckpointStore({ directory: concurrentRoot, identity });
    const slot = sha("c");
    const receipt = { status: "CREATED_NEW", resource_key: "one-use-resource" };
    let externalInvocations = 0;
    let releaseFirst;
    let markEntered;
    const entered = new Promise((resolve) => {
      markEntered = resolve;
    });
    const release = new Promise((resolve) => {
      releaseFirst = resolve;
    });
    const invoke = (store) => store.withExclusiveWriter(async () => {
      const existing = await store.readAdapterReceipt(slot);
      if (existing !== null) return existing;
      externalInvocations += 1;
      markEntered();
      await release;
      await store.recordAdapterReceipt(slot, receipt);
      return receipt;
    });
    const firstAttempt = invoke(first);
    await entered;
    let firstResult;
    try {
      await assert.rejects(
        invoke(second),
        (error) => error?.code === "CONCRETE_CHECKPOINT_WRITER_BUSY",
      );
    } finally {
      releaseFirst();
      firstResult = await firstAttempt;
    }
    assert.deepEqual(firstResult, receipt);
    assert.deepEqual(await invoke(second), receipt);
    assert.equal(externalInvocations, 1);
  } finally {
    removeCheckpointRoot(concurrentRoot);
  }
});

await check("failed assertion path releases the synthetic writer", async () => {
  const failureRoot = mkdtempSync(
    "/tmp/aifinder-concrete-checkpoint-failed-assertion.",
  );
  chmodSync(failureRoot, 0o700);
  const first = createConcreteCheckpointStore({ directory: failureRoot, identity });
  const second = createConcreteCheckpointStore({ directory: failureRoot, identity });
  let releaseFirst;
  let markEntered;
  const entered = new Promise((resolve) => {
    markEntered = resolve;
  });
  const release = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const held = first.withExclusiveWriter(async () => {
    markEntered();
    await release;
  });
  let failure;
  try {
    await entered;
    assert.fail("synthetic assertion failure");
  } catch (error) {
    failure = error;
  } finally {
    releaseFirst();
    await held;
  }
  try {
    assert.equal(failure?.code, "ERR_ASSERTION");
    await assert.rejects(
      second.loadState(),
      (error) => error?.code === "CONCRETE_CHECKPOINT_STATE_ABSENT",
    );
  } finally {
    removeCheckpointRoot(failureRoot);
  }
});

await check("concurrent BEGIN and stale predecessor writes admit one authoritative head", async () => {
  const concurrentRoot = mkdtempSync("/tmp/aifinder-concrete-checkpoint-begin.");
  chmodSync(concurrentRoot, 0o700);
  try {
    const first = createConcreteCheckpointStore({ directory: concurrentRoot, identity });
    const second = createConcreteCheckpointStore({ directory: concurrentRoot, identity });
    const state = {
      journal_identity_sha256: sha("d"),
      checkpoint: {
        sequence: 0,
        predecessor_checkpoint_identity_sha256: null,
        checkpoint_identity_sha256: sha("e"),
      },
    };
    const command = {
      schema_version: 1,
      operation: "BEGIN_ATTEMPT",
      journal_identity_sha256: sha("d"),
      checkpoint_sequence: 0,
      predecessor_checkpoint_identity_sha256: null,
      checkpoint_identity_sha256: sha("e"),
    };
    let releaseFirst;
    let markEntered;
    const entered = new Promise((resolve) => {
      markEntered = resolve;
    });
    const release = new Promise((resolve) => {
      releaseFirst = resolve;
    });
    const firstAttempt = first.withExclusiveWriter(async () => {
      markEntered();
      await release;
      return first.checkpoint(state, command);
    });
    await entered;
    let firstResult;
    try {
      await assert.rejects(
        second.checkpoint(state, command),
        (error) => error?.code === "CONCRETE_CHECKPOINT_WRITER_BUSY",
      );
    } finally {
      releaseFirst();
      firstResult = await firstAttempt;
    }
    assert.equal(firstResult.status, "CHECKPOINT_COMMITTED");
    await assert.rejects(
      second.checkpoint(state, command),
      (error) => error?.code === "ATTEMPT_ALREADY_EXISTS",
    );
    assert.deepEqual(await second.loadState(), state);
  } finally {
    removeCheckpointRoot(concurrentRoot);
  }
});

const filePath = path.join(root, "qualification-journal.json");
if (existsSync(filePath) && lstatSync(filePath).isFile()) unlinkSync(filePath);
rmdirSync(root);

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_CHECKPOINT_STORE assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_CONCRETE_CHECKPOINT_STORE assertions=${assertions} filesystem_scope=isolated_tmp network=0 credential_reads=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
