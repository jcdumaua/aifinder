import { AsyncLocalStorage } from "node:async_hooks";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";

const FILE_NAME = "qualification-journal.json";
const NEXT_FILE_NAME = ".qualification-journal.next";
const LOCK_FILE_NAME = ".qualification-journal.lock";
const GIT_CONTEXT_DIRECTORY_NAME = ".qualification-git-context";
const GIT_CONTEXT_NEXT_DIRECTORY_NAME = ".qualification-git-context.next";
const GIT_CONTEXT_CONFIG =
  "[core]\n\tbare = true\n\trepositoryformatversion = 0\n";
const GIT_CONTEXT_HEAD = "ref: refs/heads/qualification-context\n";
const LOCK_ACQUIRE_TIMEOUT_MS = 5_000;

export class ConcreteCheckpointError extends Error {
  constructor(code) {
    super(code);
    this.name = "ConcreteCheckpointError";
    this.code = code;
  }
}

export function awaitConcreteWriterAcquisition({
  child,
  handshake,
  timeout_ms = LOCK_ACQUIRE_TIMEOUT_MS,
}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let stdout = "";
    const finishFailure = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdin.destroy();
      reject(new ConcreteCheckpointError(code));
    };
    const timer = setTimeout(() => {
      finishFailure("CONCRETE_CHECKPOINT_WRITE_FAILED");
    }, timeout_ms);
    child.stdout.setEncoding("utf8");
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.once("error", () => {
      finishFailure("CONCRETE_CHECKPOINT_WRITE_FAILED");
    });
    child.once("exit", (code) => {
      finishFailure(
        code === 75
          ? "CONCRETE_CHECKPOINT_WRITER_BUSY"
          : "CONCRETE_CHECKPOINT_WRITE_FAILED",
      );
    });
    child.stdout.on("data", (chunk) => {
      if (settled) return;
      stdout += chunk;
      if (stdout === handshake) {
        settled = true;
        clearTimeout(timer);
        resolve({ active: true, child });
      } else if (stdout.length >= handshake.length) {
        finishFailure("CONCRETE_CHECKPOINT_LOCK_INVALID");
      }
    });
    child.stdin.write(handshake, () => {
      // A busy lockf may close stdin before its authoritative exit(75)
      // notification. The exit status, child error, or bounded timeout owns
      // failure classification; stdin callback ordering does not.
    });
  });
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function exactIdentity(value) {
  return exactKeys(value, [
    "authorization_id_sha256",
    "candidate_identity_sha256",
    "manifest_sha256",
    "run_id",
  ]) &&
    isSha256(value.authorization_id_sha256) &&
    isSha256(value.candidate_identity_sha256) &&
    isSha256(value.manifest_sha256) &&
    typeof value.run_id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      value.run_id,
    );
}

function clone(value) {
  return structuredClone(value);
}

function parseRecord(bytes) {
  let value;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff") || !text.endsWith("\n")) throw new Error("BYTES");
    value = JSON.parse(text);
  } catch {
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_RECORD_INVALID");
  }
  if (
    !exactKeys(value, [
      "schema_version",
      "identity",
      "state",
      "adapter_receipts",
      "external_bindings",
    ]) ||
    value.schema_version !== 1 ||
    !exactIdentity(value.identity) ||
    !(value.state === null ||
      (typeof value.state === "object" && !Array.isArray(value.state))) ||
    !Array.isArray(value.adapter_receipts) ||
    !Array.isArray(value.external_bindings) ||
    !value.adapter_receipts.every((entry) =>
      exactKeys(entry, ["operation_slot_sha256", "receipt"]) &&
      isSha256(entry.operation_slot_sha256) &&
      entry.receipt &&
      typeof entry.receipt === "object" &&
      !Array.isArray(entry.receipt)
    ) ||
    new Set(value.adapter_receipts.map((entry) => entry.operation_slot_sha256))
        .size !== value.adapter_receipts.length ||
    !value.external_bindings.every((entry) =>
      exactKeys(entry, ["binding", "resource_key"]) &&
      typeof entry.resource_key === "string" &&
      entry.resource_key.length >= 1 &&
      entry.resource_key.length <= 4096 &&
      entry.binding &&
      typeof entry.binding === "object" &&
      !Array.isArray(entry.binding) &&
      typeof entry.binding.resource_type === "string"
    ) ||
    new Set(value.external_bindings.map((entry) => entry.resource_key)).size !==
      value.external_bindings.length
  ) {
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_RECORD_INVALID");
  }
  return value;
}

function validateDirectory(directory) {
  if (
    typeof directory !== "string" ||
    !path.isAbsolute(directory) ||
    directory.includes("\0") ||
    directory.split(path.sep).includes("..")
  ) {
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_DIRECTORY_INVALID");
  }
  if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
  const metadata = lstatSync(directory);
  const canonicalDirectory = realpathSync(directory);
  if (
    !metadata.isDirectory() ||
    metadata.isSymbolicLink() ||
    (metadata.mode & 0o777) !== 0o700
  ) {
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_DIRECTORY_INVALID");
  }
  return canonicalDirectory;
}

export function createConcreteCheckpointStore({ directory, identity }) {
  if (!exactIdentity(identity)) {
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_IDENTITY_MISMATCH");
  }
  const canonicalDirectory = validateDirectory(directory);
  const filePath = path.join(canonicalDirectory, FILE_NAME);
  const nextPath = path.join(canonicalDirectory, NEXT_FILE_NAME);
  const lockPath = path.join(canonicalDirectory, LOCK_FILE_NAME);
  const writerContext = new AsyncLocalStorage();
  const storeMarker = Symbol("concrete-checkpoint-store");

  function assertRegularFile(target) {
    const metadata = lstatSync(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      realpathSync(target) !== target ||
      (metadata.mode & 0o777) !== 0o600
    ) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_FILE_INVALID");
    }
  }

  function syncDirectory() {
    let descriptor = null;
    try {
      descriptor = openSync(canonicalDirectory, "r");
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = null;
    } catch {
      if (descriptor !== null) closeSync(descriptor);
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_WRITE_FAILED");
    }
  }

  function exactGitContextDirectory(target, expectedNames) {
    const metadata = lstatSync(target);
    if (
      !metadata.isDirectory() ||
      metadata.isSymbolicLink() ||
      realpathSync(target) !== target ||
      (metadata.mode & 0o777) !== 0o500 ||
      readdirSync(target).sort().join("\0") !== [...expectedNames].sort().join("\0")
    ) {
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
  }

  function exactGitContextFile(target, expected) {
    const metadata = lstatSync(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      realpathSync(target) !== target ||
      (metadata.mode & 0o777) !== 0o400 ||
      !readFileSync(target).equals(Buffer.from(expected, "utf8"))
    ) {
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
  }

  function syncGitContextDirectory(target) {
    let descriptor = null;
    try {
      descriptor = openSync(target, "r");
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = null;
    } catch {
      if (descriptor !== null) closeSync(descriptor);
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
  }

  function validatePartialGitContextDirectory(target, relative = "") {
    const expectedDirectories = new Map([
      ["", new Set(["objects", "refs"])],
      ["objects", new Set()],
      ["refs", new Set(["heads"])],
      ["refs/heads", new Set()],
    ]);
    const expectedFiles = relative === ""
      ? new Set(["HEAD", "config"])
      : new Set();
    const metadata = lstatSync(target);
    if (
      !metadata.isDirectory() ||
      metadata.isSymbolicLink() ||
      realpathSync(target) !== target ||
      ![0o500, 0o700].includes(metadata.mode & 0o777)
    ) {
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
    const allowedDirectories = expectedDirectories.get(relative);
    if (allowedDirectories === undefined) {
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
    for (const name of readdirSync(target)) {
      const child = path.join(target, name);
      const childMetadata = lstatSync(child);
      if (allowedDirectories.has(name)) {
        if (!childMetadata.isDirectory() || childMetadata.isSymbolicLink()) {
          throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
        }
        validatePartialGitContextDirectory(
          child,
          relative === "" ? name : `${relative}/${name}`,
        );
      } else if (
        !expectedFiles.has(name) ||
        !childMetadata.isFile() ||
        childMetadata.isSymbolicLink() ||
        childMetadata.nlink !== 1 ||
        realpathSync(child) !== child ||
        ![0o400, 0o600].includes(childMetadata.mode & 0o777)
      ) {
        throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
      }
    }
  }

  function removePartialGitContextDirectory(target, relative = "") {
    const directoryNames = relative === ""
      ? new Set(["objects", "refs"])
      : relative === "refs"
        ? new Set(["heads"])
        : new Set();
    chmodSync(target, 0o700);
    for (const name of readdirSync(target)) {
      const child = path.join(target, name);
      if (directoryNames.has(name)) {
        removePartialGitContextDirectory(
          child,
          relative === "" ? name : `${relative}/${name}`,
        );
      } else {
        unlinkSync(child);
      }
    }
    rmdirSync(target);
  }

  function prepareGitContext(repositoryRoot) {
    if (
      typeof repositoryRoot !== "string" ||
      !path.isAbsolute(repositoryRoot) ||
      repositoryRoot.includes("\0") ||
      realpathSync(repositoryRoot) !== repositoryRoot
    ) {
      throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
    }
    const gitDirectory = path.join(repositoryRoot, ".git");
    const objectDirectory = path.join(gitDirectory, "objects");
    for (const target of [gitDirectory, objectDirectory]) {
      const metadata = lstatSync(target);
      if (
        !metadata.isDirectory() ||
        metadata.isSymbolicLink() ||
        realpathSync(target) !== target
      ) {
        throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
      }
    }
    const contextDirectory = path.join(
      canonicalDirectory,
      GIT_CONTEXT_DIRECTORY_NAME,
    );
    const configPath = path.join(contextDirectory, "config");
    const headPath = path.join(contextDirectory, "HEAD");
    const objectsPath = path.join(contextDirectory, "objects");
    const refsPath = path.join(contextDirectory, "refs");
    const headsPath = path.join(refsPath, "heads");
    const nextContextDirectory = path.join(
      canonicalDirectory,
      GIT_CONTEXT_NEXT_DIRECTORY_NAME,
    );
    const nextConfigPath = path.join(nextContextDirectory, "config");
    const nextHeadPath = path.join(nextContextDirectory, "HEAD");
    const nextObjectsPath = path.join(nextContextDirectory, "objects");
    const nextRefsPath = path.join(nextContextDirectory, "refs");
    const nextHeadsPath = path.join(nextRefsPath, "heads");
    if (existsSync(nextContextDirectory)) {
      try {
        validatePartialGitContextDirectory(nextContextDirectory);
        removePartialGitContextDirectory(nextContextDirectory);
        syncDirectory();
      } catch (error) {
        if (error instanceof ConcreteCheckpointError) throw error;
        throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
      }
    }
    if (!existsSync(contextDirectory)) {
      try {
        mkdirSync(nextContextDirectory, { mode: 0o700 });
        mkdirSync(nextObjectsPath, { mode: 0o700 });
        mkdirSync(nextRefsPath, { mode: 0o700 });
        mkdirSync(nextHeadsPath, { mode: 0o700 });
        writeFileSync(nextConfigPath, GIT_CONTEXT_CONFIG, {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        writeFileSync(nextHeadPath, GIT_CONTEXT_HEAD, {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        for (const target of [nextConfigPath, nextHeadPath]) {
          chmodSync(target, 0o400);
          const descriptor = openSync(target, "r");
          try {
            fsyncSync(descriptor);
          } finally {
            closeSync(descriptor);
          }
        }
        for (const target of [
          nextHeadsPath,
          nextObjectsPath,
          nextRefsPath,
          nextContextDirectory,
        ]) {
          chmodSync(target, 0o500);
        }
        syncGitContextDirectory(nextHeadsPath);
        syncGitContextDirectory(nextObjectsPath);
        syncGitContextDirectory(nextRefsPath);
        syncGitContextDirectory(nextContextDirectory);
        exactGitContextDirectory(
          nextContextDirectory,
          ["HEAD", "config", "objects", "refs"],
        );
        exactGitContextDirectory(nextObjectsPath, []);
        exactGitContextDirectory(nextRefsPath, ["heads"]);
        exactGitContextDirectory(nextHeadsPath, []);
        exactGitContextFile(nextConfigPath, GIT_CONTEXT_CONFIG);
        exactGitContextFile(nextHeadPath, GIT_CONTEXT_HEAD);
        renameSync(nextContextDirectory, contextDirectory);
        syncDirectory();
      } catch {
        throw new ConcreteCheckpointError("CONCRETE_GIT_CONTEXT_INVALID");
      }
    }
    exactGitContextDirectory(contextDirectory, ["HEAD", "config", "objects", "refs"]);
    exactGitContextDirectory(objectsPath, []);
    exactGitContextDirectory(refsPath, ["heads"]);
    exactGitContextDirectory(headsPath, []);
    exactGitContextFile(configPath, GIT_CONTEXT_CONFIG);
    exactGitContextFile(headPath, GIT_CONTEXT_HEAD);
    return Object.freeze({
      git_dir: contextDirectory,
      object_directory: objectDirectory,
    });
  }

  function ensureLockFile() {
    let descriptor = null;
    try {
      if (!existsSync(lockPath)) {
        try {
          descriptor = openSync(lockPath, "ax", 0o600);
          closeSync(descriptor);
          descriptor = null;
          chmodSync(lockPath, 0o600);
          syncDirectory();
        } catch (error) {
          if (descriptor !== null) closeSync(descriptor);
          descriptor = null;
          if (error?.code !== "EEXIST") throw error;
        }
      }
      assertRegularFile(lockPath);
    } catch (error) {
      if (descriptor !== null) closeSync(descriptor);
      if (error instanceof ConcreteCheckpointError) throw error;
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_LOCK_INVALID");
    }
  }

  async function acquireWriter() {
    ensureLockFile();
    const tokenBytes = randomBytes(32);
    const handshake = `${Buffer.from(tokenBytes).toString("hex")}\n`;
    tokenBytes.fill(0);
    const child = spawn("/usr/bin/lockf", [
      "-t",
      "0",
      lockPath,
      "/usr/bin/tee",
      "/dev/null",
    ], {
      env: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    return awaitConcreteWriterAcquisition({
      child,
      handshake,
    });
  }

  async function releaseWriter(lease) {
    if (!lease?.active || lease.child.exitCode !== null) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_LOCK_OWNERSHIP_LOST");
    }
    lease.active = false;
    const result = await new Promise((resolve) => {
      lease.child.once("exit", (code, signal) => resolve({ code, signal }));
      lease.child.once("error", () => resolve({ code: null, signal: "ERROR" }));
      lease.child.stdin.end();
    });
    if (result.code !== 0 || result.signal !== null) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_LOCK_OWNERSHIP_LOST");
    }
  }

  function readRecord() {
    if (!existsSync(filePath)) {
      return {
        schema_version: 1,
        identity: clone(identity),
        state: null,
        adapter_receipts: [],
        external_bindings: [],
      };
    }
    assertRegularFile(filePath);
    const record = parseRecord(readFileSync(filePath));
    if (canonicalJson(record.identity) !== canonicalJson(identity)) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_IDENTITY_MISMATCH");
    }
    return record;
  }

  function environmentBindingExtends(existing, candidate) {
    const existingRecords = existing?.records;
    const candidateRecords = candidate?.records;
    return existing?.resource_type === "ENVIRONMENT_RECORD" &&
      candidate?.resource_type === "ENVIRONMENT_RECORD" &&
      Array.isArray(existingRecords) &&
      Array.isArray(candidateRecords) &&
      existingRecords.length >= 1 &&
      candidateRecords.length <= 2 &&
      candidateRecords.length > existingRecords.length &&
      existingRecords.every((record) =>
        candidateRecords.some((next) =>
          next?.key === record?.key && next?.id === record?.id
        )
      );
  }

  function collectionExtends(current, candidate, key, valueExtends) {
    if (
      candidate.length < current.length ||
      candidate.length > current.length + 1
    ) return false;
    const candidateByKey = new Map(candidate.map((entry) => [entry[key], entry]));
    if (candidateByKey.size !== candidate.length) return false;
    for (const entry of current) {
      const next = candidateByKey.get(entry[key]);
      if (!next) return false;
      if (
        canonicalJson(entry) !== canonicalJson(next) &&
        !valueExtends(entry, next)
      ) return false;
    }
    return true;
  }

  function stateAdvances(current, candidate) {
    if (current === null) {
      return authenticInitialState(candidate);
    }
    return Number.isSafeInteger(current?.checkpoint?.sequence) &&
      isSha256(current.checkpoint.checkpoint_identity_sha256) &&
      candidate?.checkpoint?.sequence === current.checkpoint.sequence + 1 &&
      candidate.checkpoint.predecessor_checkpoint_identity_sha256 ===
        current.checkpoint.checkpoint_identity_sha256 &&
      isSha256(candidate.checkpoint.checkpoint_identity_sha256);
  }

  function authenticInitialState(state) {
    if (
      !state ||
      typeof state !== "object" ||
      Array.isArray(state) ||
      !isSha256(state.journal_identity_sha256) ||
      !exactKeys(state.checkpoint, [
        "schema_version",
        "sequence",
        "predecessor_checkpoint_identity_sha256",
        "checkpoint_identity_sha256",
      ]) ||
      state.checkpoint.schema_version !== 1 ||
      state.checkpoint.sequence !== 0 ||
      !isSha256(state.checkpoint.predecessor_checkpoint_identity_sha256) ||
      !isSha256(state.checkpoint.checkpoint_identity_sha256)
    ) return false;
    const predecessor = sha256Hex(canonicalJson({
      schema_version: 1,
      domain: "LAUNCH_OPERATIONS_KERNEL_CHECKPOINT_ROOT",
      journal_identity_sha256: state.journal_identity_sha256,
    }));
    if (state.checkpoint.predecessor_checkpoint_identity_sha256 !== predecessor) {
      return false;
    }
    const { checkpoint: ignored, ...payload } = clone(state);
    return state.checkpoint.checkpoint_identity_sha256 === sha256Hex(canonicalJson({
      schema_version: 1,
      journal_identity_sha256: state.journal_identity_sha256,
      sequence: 0,
      predecessor_checkpoint_identity_sha256: predecessor,
      checkpoint_state: payload,
    }));
  }

  function authenticInitialRecord(record) {
    return canonicalJson(record.identity) === canonicalJson(identity) &&
      authenticInitialState(record.state) &&
      record.adapter_receipts.length === 0 &&
      record.external_bindings.length === 0;
  }

  function recordExtends(current, candidate) {
    if (canonicalJson(current.identity) !== canonicalJson(candidate.identity)) {
      return false;
    }
    const stateSame = canonicalJson(current.state) === canonicalJson(candidate.state);
    const stateAdvanced = stateAdvances(current.state, candidate.state);
    if (!stateSame && !stateAdvanced) return false;
    const receiptsExtend = collectionExtends(
      current.adapter_receipts,
      candidate.adapter_receipts,
      "operation_slot_sha256",
      () => false,
    );
    const bindingsExtend = collectionExtends(
      current.external_bindings,
      candidate.external_bindings,
      "resource_key",
      (existing, next) => environmentBindingExtends(
        existing.binding,
        next.binding,
      ),
    );
    if (!receiptsExtend || !bindingsExtend) return false;
    if (stateAdvanced) {
      return canonicalJson(current.adapter_receipts) ===
          canonicalJson(candidate.adapter_receipts) &&
        canonicalJson(current.external_bindings) ===
          canonicalJson(candidate.external_bindings);
    }
    return canonicalJson(current) !== canonicalJson(candidate);
  }

  function recoverInterruptedPublication() {
    if (!existsSync(nextPath)) return;
    assertRegularFile(nextPath);
    let candidate;
    try {
      candidate = parseRecord(readFileSync(nextPath));
    } catch (error) {
      if (error?.code !== "CONCRETE_CHECKPOINT_RECORD_INVALID") throw error;
      unlinkSync(nextPath);
      syncDirectory();
      return;
    }
    if (canonicalJson(candidate.identity) !== canonicalJson(identity)) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_TEMP_CONFLICT");
    }
    const current = readRecord();
    if (current.state === null) {
      if (!authenticInitialRecord(candidate)) {
        throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_TEMP_CONFLICT");
      }
      renameSync(nextPath, filePath);
      assertRegularFile(filePath);
      syncDirectory();
      return;
    }
    if (canonicalJson(current) === canonicalJson(candidate)) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_TEMP_CONFLICT");
    }
    if (
      recordExtends(current, candidate)
    ) {
      renameSync(nextPath, filePath);
      assertRegularFile(filePath);
      syncDirectory();
      return;
    }
    if (recordExtends(candidate, current)) {
      unlinkSync(nextPath);
      syncDirectory();
      return;
    }
    throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_TEMP_CONFLICT");
  }

  function currentWriter() {
    const context = writerContext.getStore();
    return context?.store_marker === storeMarker &&
        context.lease?.active === true &&
        context.lease.child.exitCode === null
      ? context.lease
      : null;
  }

  async function withExclusiveWriter(operation) {
    if (typeof operation !== "function") {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_WRITER_INVALID");
    }
    if (currentWriter() !== null) return operation();
    const lease = await acquireWriter();
    return writerContext.run({ store_marker: storeMarker, lease }, async () => {
      try {
        recoverInterruptedPublication();
        return await operation();
      } finally {
        await releaseWriter(lease);
      }
    });
  }

  function persist(record) {
    if (currentWriter() === null) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_LOCK_REQUIRED");
    }
    if (existsSync(nextPath)) {
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_TEMP_CONFLICT");
    }
    const bytes = Buffer.from(`${canonicalJson(record)}\n`, "utf8");
    let descriptor = null;
    let directoryDescriptor = null;
    try {
      descriptor = openSync(nextPath, "wx", 0o600);
      writeFileSync(descriptor, bytes);
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = null;
      chmodSync(nextPath, 0o600);
      assertRegularFile(nextPath);
      renameSync(nextPath, filePath);
      assertRegularFile(filePath);
      directoryDescriptor = openSync(canonicalDirectory, "r");
      fsyncSync(directoryDescriptor);
      closeSync(directoryDescriptor);
      directoryDescriptor = null;
    } catch (error) {
      if (descriptor !== null) closeSync(descriptor);
      if (directoryDescriptor !== null) closeSync(directoryDescriptor);
      if (existsSync(nextPath)) unlinkSync(nextPath);
      if (error instanceof ConcreteCheckpointError) throw error;
      throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_WRITE_FAILED");
    } finally {
      bytes.fill(0);
    }
  }

  function upsertExternalBinding(record, resourceKey, binding) {
    if (
      typeof resourceKey !== "string" ||
      resourceKey.length < 1 ||
      resourceKey.length > 4096 ||
      !binding ||
      typeof binding !== "object" ||
      Array.isArray(binding) ||
      typeof binding.resource_type !== "string"
    ) {
      throw new ConcreteCheckpointError("CONCRETE_EXTERNAL_BINDING_INVALID");
    }
    const conflicting = record.external_bindings.find(
      (candidate) => candidate.resource_key === resourceKey,
    );
    if (!conflicting) {
      record.external_bindings.push({
        resource_key: resourceKey,
        binding: clone(binding),
      });
      record.external_bindings.sort((left, right) =>
        left.resource_key.localeCompare(right.resource_key, "en")
      );
      return;
    }
    if (canonicalJson(conflicting.binding) === canonicalJson(binding)) return;
    const existingRecords = conflicting.binding?.records;
    const nextRecords = binding.records;
    const exactEnvironmentExtension =
      conflicting.binding?.resource_type === "ENVIRONMENT_RECORD" &&
      binding.resource_type === "ENVIRONMENT_RECORD" &&
      Array.isArray(existingRecords) &&
      Array.isArray(nextRecords) &&
      existingRecords.length >= 1 &&
      nextRecords.length <= 2 &&
      nextRecords.length > existingRecords.length &&
      existingRecords.every((existing) =>
        nextRecords.some((next) =>
          next?.key === existing?.key && next?.id === existing?.id
        )
      );
    if (!exactEnvironmentExtension) {
      throw new ConcreteCheckpointError("CONCRETE_EXTERNAL_BINDING_CONFLICT");
    }
    conflicting.binding = clone(binding);
  }

  readRecord();

  return Object.freeze({
    file_path: filePath,
    withExclusiveWriter,
    async prepareGitExecutionContext({ repository_root }) {
      return withExclusiveWriter(async () => prepareGitContext(repository_root));
    },
    async checkpoint(candidate, command) {
      return withExclusiveWriter(async () => {
        const record = readRecord();
        if (
          !candidate ||
          !command ||
          candidate.journal_identity_sha256 !== command.journal_identity_sha256 ||
          candidate.checkpoint?.sequence !== command.checkpoint_sequence ||
          candidate.checkpoint?.predecessor_checkpoint_identity_sha256 !==
            command.predecessor_checkpoint_identity_sha256 ||
          candidate.checkpoint?.checkpoint_identity_sha256 !==
            command.checkpoint_identity_sha256
        ) {
          throw new ConcreteCheckpointError("CHECKPOINT_CANDIDATE_MISMATCH");
        }
        if (command.operation === "BEGIN_ATTEMPT") {
          if (record.state !== null) {
            throw new ConcreteCheckpointError("ATTEMPT_ALREADY_EXISTS");
          }
        } else if (
          record.state === null ||
          record.state.checkpoint?.checkpoint_identity_sha256 !==
            command.predecessor_checkpoint_identity_sha256
        ) {
          throw new ConcreteCheckpointError("CHECKPOINT_CAS_MISMATCH");
        }
        record.state = clone(candidate);
        persist(record);
        return { ...clone(command), status: "CHECKPOINT_COMMITTED" };
      });
    },
    async readHead(query) {
      return withExclusiveWriter(async () => {
        const state = readRecord().state;
        if (state === null) {
          return {
            schema_version: 1,
            status: "CHECKPOINT_ABSENT",
            journal_identity_sha256: query.journal_identity_sha256,
          };
        }
        return {
          schema_version: 1,
          status: "CHECKPOINT_PRESENT",
          journal_identity_sha256: state.journal_identity_sha256,
          checkpoint_sequence: state.checkpoint.sequence,
          predecessor_checkpoint_identity_sha256:
            state.checkpoint.predecessor_checkpoint_identity_sha256,
          checkpoint_identity_sha256:
            state.checkpoint.checkpoint_identity_sha256,
        };
      });
    },
    async loadState() {
      return withExclusiveWriter(async () => {
        const state = readRecord().state;
        if (state === null) {
          throw new ConcreteCheckpointError("CONCRETE_CHECKPOINT_STATE_ABSENT");
        }
        return clone(state);
      });
    },
    async readAdapterReceipt(operationSlotSha256) {
      if (!isSha256(operationSlotSha256)) {
        throw new ConcreteCheckpointError("CONCRETE_ADAPTER_RECEIPT_INVALID");
      }
      return withExclusiveWriter(async () => {
        const entry = readRecord().adapter_receipts.find(
          (candidate) => candidate.operation_slot_sha256 === operationSlotSha256,
        );
        return entry ? clone(entry.receipt) : null;
      });
    },
    async recordAdapterReceipt(operationSlotSha256, receipt, binding = null) {
      if (!isSha256(operationSlotSha256) || !receipt || typeof receipt !== "object") {
        throw new ConcreteCheckpointError("CONCRETE_ADAPTER_RECEIPT_INVALID");
      }
      return withExclusiveWriter(async () => {
        const record = readRecord();
        const existing = record.adapter_receipts.find(
          (candidate) => candidate.operation_slot_sha256 === operationSlotSha256,
        );
        if (existing) {
          if (canonicalJson(existing.receipt) !== canonicalJson(receipt)) {
            throw new ConcreteCheckpointError("CONCRETE_ADAPTER_RECEIPT_CONFLICT");
          }
          return;
        }
        record.adapter_receipts.push({
          operation_slot_sha256: operationSlotSha256,
          receipt: clone(receipt),
        });
        record.adapter_receipts.sort((left, right) =>
          left.operation_slot_sha256.localeCompare(right.operation_slot_sha256, "en")
        );
        if (binding !== null) {
          if (typeof receipt.resource_key !== "string" || receipt.resource_key.length < 1) {
            throw new ConcreteCheckpointError("CONCRETE_EXTERNAL_BINDING_INVALID");
          }
          upsertExternalBinding(record, receipt.resource_key, binding);
        }
        persist(record);
      });
    },
    async recordExternalBinding(resourceKey, binding) {
      return withExclusiveWriter(async () => {
        const record = readRecord();
        upsertExternalBinding(record, resourceKey, binding);
        persist(record);
      });
    },
    async loadExternalBinding(resourceKey) {
      return withExclusiveWriter(async () => {
        const entry = readRecord().external_bindings.find(
          (candidate) => candidate.resource_key === resourceKey,
        );
        return entry ? clone(entry.binding) : null;
      });
    },
  });
}
