import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ACTIVE_IDENTITY_PATHS,
  CHILD_LIMITS,
  FIXED_COMMAND_IDS,
  POST_RUN_REQUIRED_FIELDS,
  buildChildEnvironment,
  buildClipboardSequence,
  buildFinalEvidence,
  buildPreliminaryEvidence,
  classifyCaptureMetadata,
  getActiveIdentityTable,
  getFixedCommandSpec,
  getIdentityAllocation,
  isGitVersionSupported,
  parseGitVersion,
  performTwoPassClipboardRoundTrip,
  reverseNormalizeEphemeralWrapper,
  runBoundedChild,
  validateCanonicalOutputDirectoryPath,
  validateExactValidatorSuccess,
  validateHarnessStdout,
  validatePostRunVerification,
} from "./discovery-read-only-runtime-validation-execution-supervisor.mjs";
import {
  readBoundedInputBytes,
  validateBoundedEvidenceBytes,
  validateSemanticProfile,
} from "./discovery-read-only-runtime-validation-evidence-validator.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const paths = Object.freeze({
  harness: path.join(testDirectory, "discovery-read-only-runtime-validation-harness.mjs"),
  staticTest: path.join(testDirectory, "discovery-read-only-runtime-validation-harness-static-contract.test.mjs"),
  wrapper: path.join(testDirectory, "discovery-read-only-runtime-validation-execution-wrapper-candidate.sh"),
  supervisor: path.join(testDirectory, "discovery-read-only-runtime-validation-execution-supervisor.mjs"),
  validator: path.join(testDirectory, "discovery-read-only-runtime-validation-evidence-validator.mjs"),
  executionTest: fileURLToPath(import.meta.url),
  priorRecord: path.join(
    repositoryRoot,
    "docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md",
  ),
});

const SENTINEL = "__BIND_AT_EXECUTION_GATE__";
const ONE_MIB = 1_048_576;
const TWO_MIB = 2_097_152;
const TEN_SECONDS_MS = 10_000;
const REPOSITORY_PATH = "/Users/jamescarlodumaua/aifinder";
const REVIEWED_NODE_EXECUTABLE = "/private/tmp/aifinder-reviewed-node";
const VALID_OUTPUT_DIRECTORY = "/private/tmp/aifinder-runtime-validation-20260719T120000Z-AbC123-output";
const EXPECTED_BASELINE = "a".repeat(40);
const EXPECTED_SUPERVISOR_SHA256 = "b".repeat(64);
const ABSOLUTE_SOURCE_PATHS = Object.freeze({
  harness: `${REPOSITORY_PATH}/testing/discovery-read-only-runtime-validation-harness.mjs`,
  staticTest: `${REPOSITORY_PATH}/testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs`,
  validator: `${REPOSITORY_PATH}/testing/discovery-read-only-runtime-validation-evidence-validator.mjs`,
  executionTest: `${REPOSITORY_PATH}/testing/discovery-read-only-runtime-validation-execution-contract.test.mjs`,
  supervisor: `${REPOSITORY_PATH}/testing/discovery-read-only-runtime-validation-execution-supervisor.mjs`,
});
const EXACT_GIT_CONFIG_ARGS = Object.freeze([
  "-c", "core.fsmonitor=false",
  "-c", "core.untrackedCache=false",
  "-c", "core.hooksPath=/dev/null",
  "-c", "credential.helper=",
  "-c", "credential.interactive=false",
  "-c", "diff.external=",
]);
const EXACT_GIT_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
  GIT_PAGER: "cat",
  PAGER: "cat",
});
const EXACT_NODE_ENVIRONMENT = Object.freeze({ LANG: "C", LC_ALL: "C" });
const EXACT_HARNESS_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  AIFINDER_EXPECTED_EXECUTION_BASELINE: EXPECTED_BASELINE,
});
const EXPECTED_COMMAND_IDS = Object.freeze([
  "GIT_VERSION",
  "GIT_BRANCH",
  "GIT_HEAD",
  "GIT_STATUS",
  "HARNESS_SYNTAX",
  "STATIC_TEST_SYNTAX",
  "VALIDATOR_SYNTAX",
  "EXECUTION_TEST_SYNTAX",
  "SUPERVISOR_SYNTAX",
  "STATIC_TESTS",
  "HARNESS",
  "VALIDATOR",
  "PBCOPY",
  "PBPASTE",
]);
const OPERATION_FIELD_SUFFIXES = Object.freeze([
  "success",
  "result_class",
  "status",
  "timed_out",
  "output_limit_exceeded",
  "signal_present",
  "primary_output_present",
  "diagnostic_output_present",
  "primary_output_length",
  "diagnostic_output_length",
]);
const EXPECTED_ACTIVE_IDENTITY_PATHS = Object.freeze([
  "testing/discovery-read-only-runtime-validation-harness.mjs",
  "testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs",
  "testing/discovery-read-only-runtime-validation-evidence-validator.mjs",
  "testing/discovery-read-only-runtime-validation-execution-contract.test.mjs",
  "docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md",
  "testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs",
  "docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md",
]);
const EXPECTED_ACTIVE_IDENTITY_MODES = Object.freeze({
  "testing/discovery-read-only-runtime-validation-harness.mjs": 0o755,
  "testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs": 0o644,
  "testing/discovery-read-only-runtime-validation-evidence-validator.mjs": 0o644,
  "testing/discovery-read-only-runtime-validation-execution-contract.test.mjs": 0o644,
  "docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md": 0o644,
  "testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs": 0o755,
  "docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md": 0o644,
});
const EXPECTED_POST_RUN_FIELDS = Object.freeze([
  "repository_path_match",
  "main_worktree_match",
  "branch_match",
  "head_match",
  "local_main_match",
  "local_origin_main_match",
  "origin_match",
  "tracked_tree_clean",
  "index_empty",
  "untracked_count",
  "expected_excluded_set_match",
  "expected_excluded_hash_match",
  "expected_excluded_mode_match",
  "active_identity_match",
  "unchanged_dependency_identity_match",
  "supervisor_identity_match",
  "active_child_count",
  "active_timer_count",
]);
const FIXED_CONTEXT = Object.freeze({
  repositoryPath: REPOSITORY_PATH,
  expectedBaseline: EXPECTED_BASELINE,
  expectedNodeExecutable: REVIEWED_NODE_EXECUTABLE,
  nodeExecutable: REVIEWED_NODE_EXECUTABLE,
  outputDirectory: VALID_OUTPUT_DIRECTORY,
  expectedSupervisorSha256: EXPECTED_SUPERVISOR_SHA256,
});

function expectedCommandSpec({
  executable,
  args,
  cwd,
  environment,
  stdinPolicy,
  authenticateStdout,
  persistStdout,
  persistStderr,
}) {
  return Object.freeze({
    executable,
    args: Object.freeze(args),
    cwd,
    environment,
    stdinPolicy,
    expectedExitStatus: 0,
    timeoutMs: TEN_SECONDS_MS,
    stdoutMaxBytes: ONE_MIB,
    stderrMaxBytes: ONE_MIB,
    combinedMaxBytes: TWO_MIB,
    authenticateStdout,
    persistStdout,
    persistStderr,
  });
}

const EXPECTED_COMMAND_SPECS = Object.freeze({
  GIT_VERSION: expectedCommandSpec({
    executable: "/usr/bin/git",
    args: ["--version"],
    cwd: REPOSITORY_PATH,
    environment: EXACT_GIT_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
  GIT_BRANCH: expectedCommandSpec({
    executable: "/usr/bin/git",
    args: [...EXACT_GIT_CONFIG_ARGS, "branch", "--show-current"],
    cwd: REPOSITORY_PATH,
    environment: EXACT_GIT_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
  GIT_HEAD: expectedCommandSpec({
    executable: "/usr/bin/git",
    args: [
      ...EXACT_GIT_CONFIG_ARGS,
      "rev-parse",
      "HEAD",
      "refs/heads/main",
      "refs/remotes/origin/main",
    ],
    cwd: REPOSITORY_PATH,
    environment: EXACT_GIT_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
  GIT_STATUS: expectedCommandSpec({
    executable: "/usr/bin/git",
    args: [...EXACT_GIT_CONFIG_ARGS, "status", "--porcelain", "--untracked-files=all"],
    cwd: REPOSITORY_PATH,
    environment: EXACT_GIT_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
  HARNESS_SYNTAX: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--check", ABSOLUTE_SOURCE_PATHS.harness],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  STATIC_TEST_SYNTAX: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--check", ABSOLUTE_SOURCE_PATHS.staticTest],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  VALIDATOR_SYNTAX: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--check", ABSOLUTE_SOURCE_PATHS.validator],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  EXECUTION_TEST_SYNTAX: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--check", ABSOLUTE_SOURCE_PATHS.executionTest],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  SUPERVISOR_SYNTAX: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--check", ABSOLUTE_SOURCE_PATHS.supervisor],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  STATIC_TESTS: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: ["--test", ABSOLUTE_SOURCE_PATHS.staticTest, ABSOLUTE_SOURCE_PATHS.executionTest],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: false,
    persistStdout: true,
    persistStderr: true,
  }),
  HARNESS: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: [ABSOLUTE_SOURCE_PATHS.harness],
    cwd: REPOSITORY_PATH,
    environment: EXACT_HARNESS_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: true,
    persistStderr: true,
  }),
  VALIDATOR: expectedCommandSpec({
    executable: REVIEWED_NODE_EXECUTABLE,
    args: [ABSOLUTE_SOURCE_PATHS.validator, "DEFAULT_GUARD_SKIPPED"],
    cwd: REPOSITORY_PATH,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "pipe",
    authenticateStdout: true,
    persistStdout: true,
    persistStderr: true,
  }),
  PBCOPY: expectedCommandSpec({
    executable: "/usr/bin/pbcopy",
    args: [],
    cwd: VALID_OUTPUT_DIRECTORY,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "pipe",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
  PBPASTE: expectedCommandSpec({
    executable: "/usr/bin/pbpaste",
    args: [],
    cwd: VALID_OUTPUT_DIRECTORY,
    environment: EXACT_NODE_ENVIRONMENT,
    stdinPolicy: "ignore",
    authenticateStdout: true,
    persistStdout: false,
    persistStderr: false,
  }),
});

async function sources() {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([name, sourcePath]) => [name, await readFile(sourcePath, "utf8")]),
  );
  return Object.freeze(Object.fromEntries(entries));
}

function resultClassOf(value) {
  if (typeof value === "string") return value;
  return value?.result_class ?? value?.resultClass ?? value?.message;
}

function assertCategoricalRejection(callback, expectedClass) {
  let outcome;
  try {
    outcome = callback();
  } catch (error) {
    assert.equal(resultClassOf(error), expectedClass);
    return;
  }
  assert.equal(resultClassOf(outcome), expectedClass);
}

async function assertAsyncCategoricalRejection(promise, expectedClass) {
  await assert.rejects(promise, (error) => {
    assert.equal(resultClassOf(error), expectedClass);
    return true;
  });
}

function assertRejected(callback, message) {
  let rejected = false;
  try {
    const result = callback();
    rejected = result === false || result?.valid === false;
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, message);
}

function property(object, ...names) {
  for (const name of names) {
    if (Object.hasOwn(object, name)) return object[name];
  }
  assert.fail(`missing required property: ${names.join(" or ")}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function createValidPostRunVerification(overrides = {}) {
  return Object.freeze({
    repository_path_match: true,
    main_worktree_match: true,
    branch_match: true,
    head_match: true,
    local_main_match: true,
    local_origin_main_match: true,
    origin_match: true,
    tracked_tree_clean: true,
    index_empty: true,
    untracked_count: 5,
    expected_excluded_set_match: true,
    expected_excluded_hash_match: true,
    expected_excluded_mode_match: true,
    active_identity_match: true,
    unchanged_dependency_identity_match: true,
    supervisor_identity_match: true,
    active_child_count: 0,
    active_timer_count: 0,
    ...overrides,
  });
}

function mismatchedPostRunValue(field, currentValue) {
  if (field === "untracked_count") return 4;
  if (field === "active_child_count" || field === "active_timer_count") return 1;
  assert.equal(currentValue, true, `unexpected post-run field type for ${field}`);
  return false;
}

function successfulChildEnvelope(stdout = Buffer.alloc(0)) {
  return Object.freeze({
    result: Object.freeze({ success: true, result_class: "SUCCESS", exit_status: 0 }),
    stdout: Buffer.from(stdout),
    stderr: Buffer.alloc(0),
  });
}

function createClipboardDependencies({ firstReadback, secondReadback }) {
  const calls = [];
  const persisted = [];
  let clipboardBytes = Buffer.alloc(0);
  let pasteCount = 0;

  return {
    calls,
    dependencies: {
      async runChild(commandId, options = {}) {
        const stdinBytes = options.stdinBytes === undefined || options.stdinBytes === null
          ? null
          : Buffer.from(options.stdinBytes);
        calls.push(Object.freeze({ commandId, stdinBytes }));
        if (commandId === "PBCOPY") {
          assert.ok(Buffer.isBuffer(stdinBytes), "PBCOPY requires exact bounded stdin bytes");
          clipboardBytes = Buffer.from(stdinBytes);
          return successfulChildEnvelope();
        }
        assert.equal(commandId, "PBPASTE");
        pasteCount += 1;
        const override = pasteCount === 1 ? firstReadback : secondReadback;
        return successfulChildEnvelope(override === undefined ? clipboardBytes : override);
      },
      async persistFinalEvidence(bytes) {
        persisted.push(Buffer.from(bytes));
      },
    },
    persisted,
  };
}

function createValidEvidence(overrides = {}) {
  const evidence = {
    schema_version: 1,
    harness_status: "SKIPPED_BY_DEFAULT",
    approval_guard_matched: false,
    runtime_validation: false,
    route_invocation: false,
    network_call: false,
    live_db_read: false,
    db_mutation: false,
    operational_reactivation_status: "BLOCKED",
    branch_match: true,
    expected_baseline_match: true,
    repository_state_class: "EXPECTED_EXCLUDED_ONLY",
    tracked_tree_clean: true,
    index_empty: true,
    untracked_count: 5,
    expected_excluded_set_match: true,
    expected_excluded_hash_match: true,
    git_version_supported: true,
    git_version_class: "SUPPORTED",
  };

  for (const operation of ["version", "branch", "head", "status"]) {
    const primaryLength = operation === "status" ? "UP_TO_1_KIB" : "UP_TO_64_BYTES";
    Object.assign(evidence, {
      [`git_${operation}_success`]: true,
      [`git_${operation}_result_class`]: "SUCCESS",
      [`git_${operation}_status`]: 0,
      [`git_${operation}_timed_out`]: false,
      [`git_${operation}_output_limit_exceeded`]: false,
      [`git_${operation}_signal_present`]: false,
      [`git_${operation}_primary_output_present`]: true,
      [`git_${operation}_diagnostic_output_present`]: false,
      [`git_${operation}_primary_output_length`]: primaryLength,
      [`git_${operation}_diagnostic_output_length`]: "EMPTY",
    });
  }

  return Object.freeze({ ...evidence, ...overrides });
}

function validateDefaultEvidence(evidence) {
  const bytes = Buffer.from(JSON.stringify(evidence), "utf8");
  validateBoundedEvidenceBytes(bytes);
  return validateSemanticProfile("DEFAULT_GUARD_SKIPPED", evidence);
}

function createBufferReader(sourceBytes, maximumChunkBytes = 65_536) {
  const source = Buffer.from(sourceBytes);
  const calls = [];
  let cursor = 0;

  return {
    calls,
    get bytesReturned() {
      return cursor;
    },
    read(fd, target, targetOffset, requestedBytes, position) {
      assert.equal(fd, 0);
      assert.equal(position, null);
      assert.ok(Buffer.isBuffer(target));
      assert.equal(Number.isSafeInteger(targetOffset) && targetOffset >= 0, true);
      assert.equal(Number.isSafeInteger(requestedBytes) && requestedBytes >= 1, true);

      const bytesRead = Math.min(
        source.length - cursor,
        requestedBytes,
        maximumChunkBytes,
      );
      if (bytesRead > 0) {
        source.copy(target, targetOffset, cursor, cursor + bytesRead);
        cursor += bytesRead;
      }
      calls.push(Object.freeze({ requestedBytes, bytesRead }));
      return bytesRead;
    },
  };
}

function createMockStdin() {
  const stdin = new EventEmitter();
  stdin.eventTrace = [];
  stdin.write = (value) => {
    stdin.eventTrace.push(Object.freeze({
      event: "write",
      bytes: Buffer.from(value),
    }));
    return true;
  };
  stdin.end = (...args) => {
    stdin.eventTrace.push(Object.freeze({
      event: "end",
      arguments: Object.freeze(
        args.map((value) => Buffer.isBuffer(value) ? Buffer.from(value) : value),
      ),
    }));
  };
  return stdin;
}

function createMockChild(pid = 4242, { pipedStdin = false } = {}) {
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = null;
  child.signalCode = null;
  child.stdin = pipedStdin ? createMockStdin() : null;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

function createRunnerFixture({ emitOutput, pipedStdin = false } = {}) {
  const child = createMockChild(4242, { pipedStdin });
  const spawnCalls = [];
  const terminationCalls = [];
  const clearTimerCalls = [];
  const lifecycleTimers = new Map();
  let timerCallback;
  let timerHandle;
  let lifecycleTimerSequence = 0;
  let closeEmitted = false;

  function emitExit(status = 0, signal = null) {
    child.exitCode = Number.isInteger(status) ? status : null;
    child.signalCode = typeof signal === "string" && signal.length > 0 ? signal : null;
    child.emit("exit", status, signal);
  }

  function emitClose(status = null, signal = "SIGKILL") {
    if (closeEmitted) return;
    closeEmitted = true;
    child.emit("close", status, signal);
  }

  const dependencies = {
    spawn(executable, args, options) {
      spawnCalls.push({ executable, args, options });
      if (emitOutput) {
        queueMicrotask(() => emitOutput({ child, emitClose, emitExit }));
      }
      return child;
    },
    setTimeout(callback, milliseconds) {
      timerCallback = callback;
      timerHandle = Object.freeze({ timer: "fixed-test-timer" });
      assert.equal(milliseconds, TEN_SECONDS_MS);
      return timerHandle;
    },
    clearTimeout(handle) {
      clearTimerCalls.push(handle);
    },
    setLifecycleTimeout(callback, milliseconds) {
      assert.equal(milliseconds, 1_000);
      lifecycleTimerSequence += 1;
      const handle = Object.freeze({ timer: `lifecycle-test-timer-${lifecycleTimerSequence}` });
      lifecycleTimers.set(handle, callback);
      return handle;
    },
    clearLifecycleTimeout(handle) {
      lifecycleTimers.delete(handle);
    },
    async terminateProcessGroup(groupPid, signal) {
      terminationCalls.push({ groupPid, signal });
      queueMicrotask(() => emitClose(null, "SIGKILL"));
      return true;
    },
  };

  return {
    child,
    clearTimerCalls,
    dependencies,
    emitClose,
    emitExit,
    fireLifecycleTimers() {
      const callbacks = [...lifecycleTimers.values()];
      lifecycleTimers.clear();
      for (const callback of callbacks) callback();
    },
    fireTimer() {
      assert.equal(typeof timerCallback, "function", "runner did not arm its fixed timer");
      timerCallback();
    },
    get lifecycleTimerCount() {
      return lifecycleTimers.size;
    },
    get timerHandle() {
      return timerHandle;
    },
    spawnCalls,
    terminationCalls,
  };
}

function assertListenerCleanup(child) {
  for (const eventName of ["close", "error", "exit"]) {
    assert.equal(child.listenerCount(eventName), 0, `child listener leaked for ${eventName}`);
  }
  for (const stream of [child.stdout, child.stderr]) {
    for (const eventName of ["data", "end", "error", "close"]) {
      assert.equal(stream.listenerCount(eventName), 0, `stream listener leaked for ${eventName}`);
    }
  }
  if (child.stdin) {
    for (const eventName of ["drain", "error", "finish", "close"]) {
      assert.equal(child.stdin.listenerCount(eventName), 0, `stdin listener leaked for ${eventName}`);
    }
  }
}

function assertExactSpawnCall(fixture, commandId) {
  const expected = EXPECTED_COMMAND_SPECS[commandId];
  assert.ok(expected, `missing independent expected command spec for ${commandId}`);
  assert.equal(fixture.spawnCalls.length, 1);
  const [call] = fixture.spawnCalls;

  assert.equal(call.executable, expected.executable);
  assert.deepEqual(call.args, expected.args);
  assert.deepEqual(call.options, {
    cwd: expected.cwd,
    env: expected.environment,
    shell: false,
    detached: true,
    stdio: [expected.stdinPolicy, "pipe", "pipe"],
  });
  assert.notEqual(call.options.stdio, "inherit");
  assert.equal(call.options.stdio.includes("inherit"), false);
  assert.equal(Object.hasOwn(call.options, "env"), true);
  assert.equal(Object.hasOwn(call.options.env, "PATH"), false);
  assert.equal(Object.hasOwn(call.options.env, "HOME"), false);
}

function assertBoundedEnvelope(envelope, fixture, expectedClass) {
  assert.ok(envelope && typeof envelope === "object");
  assert.ok(Buffer.isBuffer(envelope.stdout));
  assert.ok(Buffer.isBuffer(envelope.stderr));
  assert.ok(envelope.result && typeof envelope.result === "object");
  assert.equal(Object.getPrototypeOf(envelope.result), Object.prototype);
  assert.equal(Object.isFrozen(envelope.result), true);
  assert.equal(envelope.result.result_class, expectedClass);
  assert.equal(envelope.result.settlement_count, 1);
  assert.equal(envelope.result.process_group_termination_attempted, true);
  assert.equal(envelope.result.process_group_termination_succeeded, true);
  assert.equal(envelope.result.child_reaped, true);
  assert.equal(envelope.result.timer_cleared, true);
  assert.equal(fixture.terminationCalls.length, 1);
  assert.deepEqual(fixture.terminationCalls[0], { groupPid: -4242, signal: "SIGKILL" });
  assert.deepEqual(fixture.clearTimerCalls, [fixture.timerHandle]);
  assert.equal(envelope.stdout.length <= ONE_MIB, true);
  assert.equal(envelope.stderr.length <= ONE_MIB, true);
  assert.equal(
    Object.values(envelope.result).some((value) => Buffer.isBuffer(value)),
    false,
    "raw output entered the categorical child result",
  );
  assertListenerCleanup(fixture.child);
}

function assertSuccessfulPipedEnvelope(envelope, fixture, expectedStdout) {
  assert.ok(envelope && typeof envelope === "object");
  assert.deepEqual(envelope.stdout, expectedStdout);
  assert.deepEqual(envelope.stderr, Buffer.alloc(0));
  assert.equal(envelope.result.success, true);
  assert.equal(envelope.result.result_class, "SUCCESS");
  assert.equal(envelope.result.exit_status, 0);
  assert.equal(envelope.result.signal_present, false);
  assert.equal(envelope.result.timed_out, false);
  assert.equal(envelope.result.stdout_limit_exceeded, false);
  assert.equal(envelope.result.stderr_limit_exceeded, false);
  assert.equal(envelope.result.combined_limit_exceeded, false);
  assert.equal(envelope.result.process_group_termination_attempted, false);
  assert.equal(envelope.result.process_group_termination_succeeded, false);
  assert.equal(envelope.result.child_reaped, true);
  assert.equal(envelope.result.timer_cleared, true);
  assert.equal(envelope.result.settlement_count, 1);
  assert.deepEqual(fixture.terminationCalls, []);
  assert.deepEqual(fixture.clearTimerCalls, [fixture.timerHandle]);
  assertListenerCleanup(fixture.child);
}

test("supervisor exports an import-inert non-shell control surface", async () => {
  const { supervisor } = await sources();
  for (const exportName of [
    "parseGitVersion",
    "isGitVersionSupported",
    "validateCanonicalOutputDirectoryPath",
    "buildChildEnvironment",
    "getFixedCommandSpec",
    "classifyCaptureMetadata",
    "validateHarnessStdout",
    "validateExactValidatorSuccess",
    "buildPreliminaryEvidence",
    "buildFinalEvidence",
    "reverseNormalizeEphemeralWrapper",
    "runBoundedChild",
    "getActiveIdentityTable",
    "getIdentityAllocation",
    "validatePostRunVerification",
    "performTwoPassClipboardRoundTrip",
  ]) {
    assert.match(supervisor, new RegExp(`export (?:async )?function ${exportName}\\b`));
  }
  assert.match(supervisor, /const isCli = process\.argv\[1\][\s\S]*import\.meta\.url/);
  assert.doesNotMatch(
    supervisor,
    /process\.exit\s*\(|spawnSync\s*\(|shell:\s*true|\.\.\.process\.env|env:\s*process\.env|stdio:\s*["']inherit["']/,
  );
  assert.match(supervisor, /process\.exitCode\s*=/);
});

test("unknown command IDs fail with only UNKNOWN_COMMAND", () => {
  assertCategoricalRejection(
    () => getFixedCommandSpec("CALLER_DEFINED_COMMAND", FIXED_CONTEXT),
    "UNKNOWN_COMMAND",
  );
});

test("fixed registry contains exactly the fourteen approved child IDs", () => {
  assert.deepEqual([...FIXED_COMMAND_IDS], [...EXPECTED_COMMAND_IDS]);
  assert.equal(new Set(FIXED_COMMAND_IDS).size, EXPECTED_COMMAND_IDS.length);
  assert.deepEqual(Object.keys(EXPECTED_COMMAND_SPECS), [...EXPECTED_COMMAND_IDS]);

  for (const commandId of EXPECTED_COMMAND_IDS) {
    const spec = getFixedCommandSpec(commandId, FIXED_CONTEXT);
    const expected = EXPECTED_COMMAND_SPECS[commandId];
    const { id, ...actualOptions } = spec;

    assert.equal(id, commandId);
    assert.deepEqual(actualOptions, expected, `${commandId} registry entry drifted`);
    assert.equal(Object.isFrozen(spec), true, `${commandId} registry entry must be frozen`);
    assert.equal(Object.isFrozen(spec.args), true, `${commandId} args must be frozen`);
    assert.equal(Object.isFrozen(spec.environment), true, `${commandId} environment must be frozen`);
  }
});

test("wrapper has exactly three full declarations and no malformed sentinel", async () => {
  const { wrapper } = await sources();
  const declarations = [
    `EXPECTED_EXECUTION_BASELINE="${SENTINEL}"`,
    `NODE_EXECUTABLE="${SENTINEL}"`,
    `OUTPUT_DIRECTORY="${SENTINEL}"`,
  ];

  for (const declaration of declarations) {
    assert.equal(wrapper.split(`\n${declaration}\n`).length - 1, 1, `unexpected count for ${declaration}`);
  }
  assert.equal(wrapper.split(SENTINEL).length - 1, 3);
  const sentinelLikeValues = wrapper.match(/__BIND_AT_EXECUTION[A-Z0-9_]*__/g) ?? [];
  assert.deepEqual(sentinelLikeValues, [SENTINEL, SENTINEL, SENTINEL]);
  assert.doesNotMatch(wrapper, /`__BIND_AT_EXECUTION|__BIND_AT_EXECUTION__|__BIND_AT_EXECUTION_GATE_(?!_)/);
});

test("wrapper forwards caller arguments only into the effective zero-argument check", async () => {
  const { wrapper } = await sources();
  assert.match(wrapper, /main\(\)\s*\{[\s\S]*\[ "\$#" -eq 0 \] \|\| exit 64/);
  assert.match(wrapper, /\nmain "\$@"\s*$/);
  const beforeEntry = wrapper.slice(0, wrapper.lastIndexOf('main "$@"'));
  assert.doesNotMatch(beforeEntry, /\$@|\$[1-9]|getopts|\bshift\b/);
});

test("wrapper is a single sealed supervisor launch without orchestration", async () => {
  const { wrapper } = await sources();
  const activeShell = wrapper.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .join("\n");

  assert.equal(activeShell.match(/\bexec \/usr\/bin\/env -i\b/g)?.length, 1);
  assert.doesNotMatch(
    activeShell,
    /\/usr\/bin\/git|\bgit\b|watchdog|capture|pbcopy|pbpaste|shasum|\bstat\b|realpath|chmod|mkdir|mktemp|sleep|kill|ulimit/,
  );
  assert.doesNotMatch(activeShell, /\bPATH=|\bHOME=|AIFINDER_RUN_DISCOVERY_READ_ONLY_RUNTIME_VALIDATION_HARNESS_25FD/);
});

test("canonical output path accepts only the strict private-tmp form", () => {
  assert.equal(validateCanonicalOutputDirectoryPath(VALID_OUTPUT_DIRECTORY), true);
  for (const rejected of [
    null,
    "",
    "relative/output",
    "/tmp/aifinder-runtime-validation-20260719T120000Z-AbC123-output",
    "/private/tmp/../tmp/aifinder-runtime-validation-20260719T120000Z-AbC123-output",
    "/private/tmp/aifinder-runtime-validation-20260719T120000Z-AbC123-output/",
    "/private/tmp/aifinder-runtime-validation-20260719T120000Z-short-output",
    "/private/tmp/aifinder-runtime-validation-bad-date-AbC123-output",
    `/private/tmp/aifinder-runtime-validation-20260719T120000Z-${"a".repeat(65)}-output`,
    "/private/tmp/not-aifinder-output",
  ]) {
    assert.equal(validateCanonicalOutputDirectoryPath(rejected), false, `${String(rejected)} must be rejected`);
  }
});

test("child environment maps are exact and contain no ambient authority", () => {
  const gitEnvironment = Object.freeze({
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_OPTIONAL_LOCKS: "0",
    GIT_TERMINAL_PROMPT: "0",
    GIT_PAGER: "cat",
    PAGER: "cat",
  });
  const nodeEnvironment = Object.freeze({ LANG: "C", LC_ALL: "C" });
  const harnessEnvironment = Object.freeze({
    LANG: "C",
    LC_ALL: "C",
    AIFINDER_EXPECTED_EXECUTION_BASELINE: EXPECTED_BASELINE,
  });

  for (const commandId of ["GIT_VERSION", "GIT_BRANCH", "GIT_HEAD", "GIT_STATUS"]) {
    assert.deepEqual(buildChildEnvironment(commandId, FIXED_CONTEXT), gitEnvironment);
  }
  for (const commandId of [
    "HARNESS_SYNTAX",
    "STATIC_TEST_SYNTAX",
    "VALIDATOR_SYNTAX",
    "EXECUTION_TEST_SYNTAX",
    "SUPERVISOR_SYNTAX",
    "STATIC_TESTS",
    "VALIDATOR",
    "PBCOPY",
    "PBPASTE",
  ]) {
    assert.deepEqual(buildChildEnvironment(commandId, FIXED_CONTEXT), nodeEnvironment);
  }
  assert.deepEqual(buildChildEnvironment("HARNESS", FIXED_CONTEXT), harnessEnvironment);

  for (const commandId of EXPECTED_COMMAND_IDS) {
    const environment = buildChildEnvironment(commandId, FIXED_CONTEXT);
    assert.equal(Object.getPrototypeOf(environment), Object.prototype);
    assert.equal(Object.isFrozen(environment), true);
    assert.equal(Object.hasOwn(environment, "PATH"), false);
    assert.equal(Object.hasOwn(environment, "HOME"), false);
    assert.equal(
      Object.hasOwn(environment, "AIFINDER_RUN_DISCOVERY_READ_ONLY_RUNTIME_VALIDATION_HARNESS_25FD"),
      false,
    );
  }
});

test("fixed child limits and capture classes are exact", () => {
  assert.equal(property(CHILD_LIMITS, "timeoutMs", "timeout_ms"), TEN_SECONDS_MS);
  assert.equal(property(CHILD_LIMITS, "stdoutMaxBytes", "stdout_max_bytes"), ONE_MIB);
  assert.equal(property(CHILD_LIMITS, "stderrMaxBytes", "stderr_max_bytes"), ONE_MIB);
  assert.equal(property(CHILD_LIMITS, "combinedMaxBytes", "combined_max_bytes"), TWO_MIB);
  const emptyCapture = classifyCaptureMetadata(0, 0);
  assert.equal(emptyCapture.stdout_present, false);
  assert.equal(emptyCapture.stderr_present, false);
  assert.equal(emptyCapture.stdout_length_class, "EMPTY");
  assert.equal(emptyCapture.stderr_length_class, "EMPTY");
  assert.equal(classifyCaptureMetadata(64, 1).stdout_length_class, "UP_TO_64_BYTES");
  assert.equal(classifyCaptureMetadata(65, 1).stdout_length_class, "UP_TO_1_KIB");
  assert.equal(classifyCaptureMetadata(1025, 1).stdout_length_class, "UP_TO_64_KIB");
  assert.equal(classifyCaptureMetadata(65537, 1).stdout_length_class, "UP_TO_1_MIB");
});

test("timeout settles once, kills the negative process group, and clears resources", async () => {
  const fixture = createRunnerFixture();
  const pending = runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);
  await Promise.resolve();
  fixture.fireTimer();
  assert.deepEqual(
    fixture.terminationCalls,
    [{ groupPid: -4242, signal: "SIGKILL" }],
    "group termination must begin synchronously in the timeout callback turn",
  );
  const envelope = await pending;

  assertExactSpawnCall(fixture, "GIT_VERSION");
  assertBoundedEnvelope(envelope, fixture, "TIMEOUT");
  assert.equal(envelope.result.timed_out, true);
  assert.equal(envelope.result.stdout_limit_exceeded, false);
  assert.equal(envelope.result.stderr_limit_exceeded, false);
  assert.equal(envelope.result.combined_limit_exceeded, false);
});

test("exit observation blocks a stale timeout from signaling the process group", async () => {
  const fixture = createRunnerFixture();
  const pending = runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);
  await Promise.resolve();

  fixture.emitExit(0, null);
  assert.equal(fixture.lifecycleTimerCount, 1);
  fixture.fireTimer();
  assert.deepEqual(fixture.terminationCalls, []);

  fixture.emitClose(0, null);
  const envelope = await pending;
  assert.equal(envelope.result.success, true);
  assert.equal(envelope.result.result_class, "SUCCESS");
  assert.equal(envelope.result.exit_status, 0);
  assert.equal(envelope.result.child_reaped, true);
  assert.equal(envelope.result.timer_cleared, true);
  assert.equal(envelope.result.settlement_count, 1);
  assert.deepEqual(fixture.clearTimerCalls, [fixture.timerHandle]);
  assertListenerCleanup(fixture.child);
});

test("exit without close fails after a bounded reap deadline without group signaling", async () => {
  const fixture = createRunnerFixture();
  const pending = runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);
  await Promise.resolve();

  fixture.emitExit(0, null);
  assert.equal(fixture.lifecycleTimerCount, 1);
  fixture.fireLifecycleTimers();
  const envelope = await pending;

  assert.equal(envelope.result.success, false);
  assert.equal(envelope.result.result_class, "CHILD_REAP_FAILED");
  assert.equal(envelope.result.child_reaped, false);
  assert.equal(envelope.result.process_group_termination_attempted, false);
  assert.equal(envelope.result.process_group_termination_succeeded, false);
  assert.equal(envelope.result.timer_cleared, true);
  assert.equal(envelope.result.settlement_count, 1);
  assert.deepEqual(fixture.terminationCalls, []);
  assertListenerCleanup(fixture.child);
});

test("stdout overflow is bounded and classified once", async () => {
  const fixture = createRunnerFixture({
    emitOutput({ child }) {
      child.stdout.emit("data", Buffer.alloc(ONE_MIB + 1, 0x61));
    },
  });
  const envelope = await runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);

  assertBoundedEnvelope(envelope, fixture, "STDOUT_LIMIT_EXCEEDED");
  assert.equal(envelope.result.stdout_limit_exceeded, true);
  assert.equal(envelope.result.stderr_limit_exceeded, false);
  assert.equal(envelope.result.combined_limit_exceeded, false);
});

test("stderr overflow is bounded and classified once", async () => {
  const fixture = createRunnerFixture({
    emitOutput({ child }) {
      child.stderr.emit("data", Buffer.alloc(ONE_MIB + 1, 0x62));
    },
  });
  const envelope = await runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);

  assertBoundedEnvelope(envelope, fixture, "STDERR_LIMIT_EXCEEDED");
  assert.equal(envelope.result.stdout_limit_exceeded, false);
  assert.equal(envelope.result.stderr_limit_exceeded, true);
  assert.equal(envelope.result.combined_limit_exceeded, false);
});

test("combined overflow has precedence when a stream and combined limit cross together", async () => {
  const fixture = createRunnerFixture({
    emitOutput({ child }) {
      child.stdout.emit("data", Buffer.alloc(ONE_MIB, 0x63));
      child.stderr.emit("data", Buffer.alloc(ONE_MIB + 1, 0x64));
    },
  });
  const envelope = await runBoundedChild("GIT_VERSION", FIXED_CONTEXT, fixture.dependencies);

  assertBoundedEnvelope(envelope, fixture, "COMBINED_LIMIT_EXCEEDED");
  assert.equal(envelope.result.combined_limit_exceeded, true);
});

test("validator runner writes the exact evidence bytes then ends piped stdin", async () => {
  const stdinBytes = Buffer.from(`${JSON.stringify(createValidEvidence())}\n`, "utf8");
  const expectedStdout = Buffer.from('{"valid":true,"result_class":"VALID"}\n', "utf8");
  const fixture = createRunnerFixture({
    pipedStdin: true,
    emitOutput({ child, emitClose }) {
      child.stdout.emit("data", expectedStdout);
      emitClose(0, null);
    },
  });

  const envelope = await runBoundedChild(
    "VALIDATOR",
    { ...FIXED_CONTEXT, stdinBytes },
    fixture.dependencies,
  );

  assertExactSpawnCall(fixture, "VALIDATOR");
  assert.deepEqual(fixture.child.stdin.eventTrace, [
    { event: "write", bytes: stdinBytes },
    { event: "end", arguments: [] },
  ]);
  assertSuccessfulPipedEnvelope(envelope, fixture, expectedStdout);
});

test("pbcopy runner writes the exact clipboard bytes then ends piped stdin", async () => {
  const stdinBytes = Buffer.from("exact-final-evidence-bytes\n", "utf8");
  const fixture = createRunnerFixture({
    pipedStdin: true,
    emitOutput({ emitClose }) {
      emitClose(0, null);
    },
  });

  const envelope = await runBoundedChild(
    "PBCOPY",
    { ...FIXED_CONTEXT, stdinBytes },
    fixture.dependencies,
  );

  assertExactSpawnCall(fixture, "PBCOPY");
  assert.deepEqual(fixture.child.stdin.eventTrace, [
    { event: "write", bytes: stdinBytes },
    { event: "end", arguments: [] },
  ]);
  assertSuccessfulPipedEnvelope(envelope, fixture, Buffer.alloc(0));
});

test("harness stdout parser accepts exactly one newline-terminated JSON record", () => {
  const evidence = createValidEvidence();
  const bytes = Buffer.from(`${JSON.stringify(evidence)}\n`, "utf8");
  const parsed = validateHarnessStdout(bytes);
  assert.ok(parsed && typeof parsed === "object");

  assertRejected(
    () => validateHarnessStdout(Buffer.from(JSON.stringify(evidence), "utf8")),
    "missing newline must be rejected",
  );
  assertRejected(
    () => validateHarnessStdout(Buffer.from(`${JSON.stringify(evidence)}\n${JSON.stringify(evidence)}\n`, "utf8")),
    "multiple records must be rejected",
  );
  assertRejected(
    () => validateHarnessStdout(Buffer.from("{malformed}\n", "utf8")),
    "malformed JSON must be rejected",
  );
});

test("validator success authentication is byte exact", () => {
  const exact = Buffer.from('{"valid":true,"result_class":"VALID"}\n', "utf8");
  assert.equal(validateExactValidatorSuccess(exact), true);

  for (const nearMatch of [
    '{"valid":true,"result_class":"VALID"}',
    '{"valid":true,"result_class":"VALID"}\n\n',
    '{ "valid":true,"result_class":"VALID"}\n',
    '{"result_class":"VALID","valid":true}\n',
    '{"valid":false,"result_class":"VALID"}\n',
  ]) {
    assertRejected(
      () => validateExactValidatorSuccess(Buffer.from(nearMatch, "utf8")),
      `validator near-match must be rejected: ${JSON.stringify(nearMatch)}`,
    );
  }
});

test("validator rejects duplicate keys before semantic validation", () => {
  const validJson = JSON.stringify(createValidEvidence());
  const duplicateJson = validJson.replace(
    /^\{"schema_version":1,/,
    '{"schema_version":1,"schema_version":1,',
  );
  assertCategoricalRejection(
    () => validateBoundedEvidenceBytes(Buffer.from(duplicateJson, "utf8")),
    "JSON_DUPLICATE_KEY",
  );
});

test("validator requires all forty Git operation metadata fields individually", () => {
  const operationFields = ["version", "branch", "head", "status"].flatMap((operation) => (
    OPERATION_FIELD_SUFFIXES.map((suffix) => `git_${operation}_${suffix}`)
  ));
  assert.equal(operationFields.length, 40);
  assert.equal(new Set(operationFields).size, 40);

  for (const missingField of operationFields) {
    const evidence = { ...createValidEvidence() };
    delete evidence[missingField];
    assertCategoricalRejection(
      () => validateBoundedEvidenceBytes(Buffer.from(JSON.stringify(evidence), "utf8")),
      "REQUIRED_FIELD_MISSING",
    );
  }
});

test("validator rejects output presence and length inconsistencies", () => {
  assertRejected(
    () => validateDefaultEvidence(createValidEvidence({
      git_status_primary_output_present: false,
      git_status_primary_output_length: "UP_TO_1_KIB",
    })),
    "absent status output with nonempty length must be rejected",
  );
  assertRejected(
    () => validateDefaultEvidence(createValidEvidence({
      git_branch_primary_output_present: true,
      git_branch_primary_output_length: "EMPTY",
    })),
    "present branch output with empty length must be rejected",
  );
  assertRejected(
    () => validateDefaultEvidence(createValidEvidence({
      git_version_diagnostic_output_present: true,
      git_version_diagnostic_output_length: "UP_TO_64_BYTES",
    })),
    "successful Git diagnostic output must be rejected",
  );
});

test("validator rejects a default-guard semantic profile mismatch", () => {
  assertRejected(
    () => validateDefaultEvidence(createValidEvidence({ runtime_validation: true })),
    "runtime validation true must not satisfy DEFAULT_GUARD_SKIPPED",
  );
});

test("bounded validator reader accepts exactly one MiB incrementally", () => {
  const input = Buffer.alloc(ONE_MIB, 0x61);
  const fixture = createBufferReader(input, 16_384);
  const bytes = readBoundedInputBytes({
    read: fixture.read,
    maximumBytes: ONE_MIB,
    chunkBytes: 65_536,
  });

  assert.deepEqual(bytes, input);
  assert.equal(fixture.bytesReturned, ONE_MIB);
  assert.equal(fixture.calls.length > 2, true);
  assert.equal(fixture.calls.every((call) => call.requestedBytes <= 65_536), true);
  assert.equal(fixture.calls.at(-1).bytesRead, 0);
});

test("bounded validator reader stops after the first byte beyond one MiB", () => {
  const fixture = createBufferReader(Buffer.alloc(ONE_MIB + 100, 0x62), 32_768);
  assertCategoricalRejection(
    () => readBoundedInputBytes({
      read: fixture.read,
      maximumBytes: ONE_MIB,
      chunkBytes: 65_536,
    }),
    "INPUT_TOO_LARGE",
  );
  assert.equal(fixture.bytesReturned, ONE_MIB + 1);
});

test("bounded validator reader reports read failures categorically", () => {
  assertCategoricalRejection(
    () => readBoundedInputBytes({
      read() {
        throw new Error("synthetic read failure");
      },
    }),
    "INPUT_READ_FAILED",
  );
});

test("validator CLI is stdin-only and writes exact categorical JSON synchronously", async () => {
  const { validator } = await sources();
  assert.match(validator, /process\.argv\.length !== 3/);
  assert.match(validator, /export function readBoundedInputBytes\(/);
  assert.match(validator, /const bytes = readBoundedInputBytes\(\);/);
  assert.doesNotMatch(validator, /readFileSync\(0\)/);
  assert.equal(
    validator.split('\'{"valid":true,"result_class":"VALID"}\\n\'').length - 1,
    1,
    "validator source must define the exact success bytes once",
  );
  assert.match(
    validator,
    /const EXACT_VALIDATOR_SUCCESS_BYTES = Buffer\.from\(\s*'\{"valid":true,"result_class":"VALID"\}\\n',\s*"utf8",\s*\);/s,
  );
  assert.match(validator, /result\.valid\s*\?\s*EXACT_VALIDATOR_SUCCESS_BYTES\s*:/);
  assert.match(validator, /writeSync\(1,/);
  assert.match(validator, /process\.exitCode\s*=/);
  assert.doesNotMatch(
    validator,
    /WRAPPER_OUTPUT_ROOT_PATTERN|realpathSync|isAllowedWrapperInputPath|readFileSync\(0\)|process\.exit\s*\(/,
  );
});

test("supervisor Git parser matches the safe-integer contract", () => {
  assert.deepEqual([...parseGitVersion("git version 2.35.2")], [2, 35, 2]);
  assert.deepEqual([...parseGitVersion("git version 2.44.0 (Apple Git-150)")], [2, 44, 0]);
  for (const malformed of [
    "git version 2.44.0 (Apple Git-alpha)",
    "git version 2.44.0 (Apple Git-)",
    "git version 2.44.0 (Apple Git-150) extra",
    `git version ${Number.MAX_SAFE_INTEGER}0.35.2`,
    `git version 2.${Number.MAX_SAFE_INTEGER}0.2`,
    `git version 2.35.${Number.MAX_SAFE_INTEGER}0`,
    `git version 2.35.2 (Apple Git-${Number.MAX_SAFE_INTEGER}0)`,
  ]) {
    assert.equal(parseGitVersion(malformed), null, `${malformed} must be rejected`);
  }
  assert.equal(isGitVersionSupported(parseGitVersion("git version 2.35.1")), false);
  assert.equal(isGitVersionSupported(parseGitVersion("git version 2.35.2")), true);
  assert.equal(isGitVersionSupported(parseGitVersion("git version 2.36.0")), true);
});

test("reverse normalization restores exactly the three repository declarations", () => {
  const repositoryText = [
    `EXPECTED_EXECUTION_BASELINE="${SENTINEL}"`,
    `NODE_EXECUTABLE="${SENTINEL}"`,
    `OUTPUT_DIRECTORY="${SENTINEL}"`,
    "unchanged=true",
    "",
  ].join("\n");
  const bindings = Object.freeze({
    expectedExecutionBaseline: EXPECTED_BASELINE,
    nodeExecutable: FIXED_CONTEXT.nodeExecutable,
    outputDirectory: VALID_OUTPUT_DIRECTORY,
  });
  const ephemeralText = repositoryText
    .replace(`EXPECTED_EXECUTION_BASELINE="${SENTINEL}"`, `EXPECTED_EXECUTION_BASELINE="${EXPECTED_BASELINE}"`)
    .replace(`NODE_EXECUTABLE="${SENTINEL}"`, `NODE_EXECUTABLE="${FIXED_CONTEXT.nodeExecutable}"`)
    .replace(`OUTPUT_DIRECTORY="${SENTINEL}"`, `OUTPUT_DIRECTORY="${VALID_OUTPUT_DIRECTORY}"`);

  assert.equal(reverseNormalizeEphemeralWrapper(ephemeralText, bindings), repositoryText);
  assert.notEqual(
    reverseNormalizeEphemeralWrapper(ephemeralText.replace("unchanged=true", "unchanged=false"), bindings),
    repositoryText,
  );
});

test("active identity table binds exact paths, bytes, modes, and file-type rules", async () => {
  const identityTable = getActiveIdentityTable();
  assert.deepEqual([...ACTIVE_IDENTITY_PATHS], [...EXPECTED_ACTIVE_IDENTITY_PATHS]);
  assert.equal(new Set(ACTIVE_IDENTITY_PATHS).size, EXPECTED_ACTIVE_IDENTITY_PATHS.length);
  assert.equal(identityTable.length, 7);
  assert.equal(Object.isFrozen(identityTable), true);
  assert.deepEqual(identityTable.map((entry) => entry.path), [...EXPECTED_ACTIVE_IDENTITY_PATHS]);

  for (const entry of identityTable) {
    assert.equal(Object.isFrozen(entry), true);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
    assert.equal(entry.mode, EXPECTED_ACTIVE_IDENTITY_MODES[entry.path]);
    assert.equal(entry.regular_file_required, true);
    assert.equal(entry.symlink_rejected, true);
    const absolutePath = path.join(repositoryRoot, entry.path);
    const [bytes, stats] = await Promise.all([readFile(absolutePath), lstat(absolutePath)]);
    assert.equal(entry.sha256, sha256(bytes), `identity hash mismatch for ${entry.path}`);
    assert.equal(stats.isFile(), true, `${entry.path} must be a regular file`);
    assert.equal(stats.isSymbolicLink(), false, `${entry.path} must reject symlinks`);
    assert.equal(stats.mode & 0o777, entry.mode, `identity mode mismatch for ${entry.path}`);
  }
});

test("supervisor and wrapper identities use separate non-circular allocation", () => {
  const identityTable = getActiveIdentityTable();
  const identityPaths = identityTable.map((entry) => entry.path);
  assert.equal(
    identityPaths.includes("testing/discovery-read-only-runtime-validation-execution-supervisor.mjs"),
    false,
  );
  assert.equal(
    identityPaths.includes("testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh"),
    false,
  );
  assert.deepEqual(getIdentityAllocation(), {
    active_source_identities: "SUPERVISOR_FIXED_TABLE",
    supervisor_identity: "WRAPPER_ENVIRONMENT_SHA256",
    wrapper_identity: "EXTERNAL_GATE",
  });
});

test("post-run verification field contract is complete", () => {
  assert.deepEqual([...POST_RUN_REQUIRED_FIELDS], [...EXPECTED_POST_RUN_FIELDS]);
  assert.equal(new Set(POST_RUN_REQUIRED_FIELDS).size, EXPECTED_POST_RUN_FIELDS.length);
});

test("post-run verifier rejects every required field mismatch independently", () => {
  const validState = createValidPostRunVerification();
  assert.equal(validatePostRunVerification(validState), true);

  for (const field of EXPECTED_POST_RUN_FIELDS) {
    const mismatch = createValidPostRunVerification({
      [field]: mismatchedPostRunValue(field, validState[field]),
    });
    assertRejected(
      () => validatePostRunVerification(mismatch),
      `post-run mismatch must be rejected for ${field}`,
    );
  }
});

test("post-run verifier rejects every missing required field independently", () => {
  for (const field of EXPECTED_POST_RUN_FIELDS) {
    const state = { ...createValidPostRunVerification() };
    delete state[field];
    assertRejected(
      () => validatePostRunVerification(state),
      `missing post-run field must be rejected for ${field}`,
    );
  }
});

test("clipboard evidence uses the exact two-pass command and state sequence", () => {
  assert.deepEqual(buildClipboardSequence(), ["PBCOPY", "PBPASTE", "PBCOPY", "PBPASTE"]);
  const preliminary = buildPreliminaryEvidence({ result: "PENDING" });
  const final = buildFinalEvidence({ result: "PASSED" });

  assert.equal(preliminary.CLIPBOARD_COPY, "PENDING");
  assert.equal(preliminary.CLIPBOARD_VERIFY, "PENDING");
  assert.equal(preliminary.CLIPBOARD_ROUND_TRIP, false);
  assert.equal(final.CLIPBOARD_COPY, "SUCCESS");
  assert.equal(final.CLIPBOARD_VERIFY, "SUCCESS");
  assert.equal(final.CLIPBOARD_ROUND_TRIP, true);
  for (const evidence of [preliminary, final]) {
    assert.equal(Object.hasOwn(evidence, "stdout"), false);
    assert.equal(Object.hasOwn(evidence, "stderr"), false);
  }
});

test("two-pass clipboard helper persists only after both exact readback equalities", async () => {
  const preliminaryBytes = Buffer.from(
    `${JSON.stringify(buildPreliminaryEvidence({ result: "PENDING" }))}\n`,
    "utf8",
  );
  const finalBytes = Buffer.from(
    `${JSON.stringify(buildFinalEvidence({ result: "PASSED" }))}\n`,
    "utf8",
  );
  const fixture = createClipboardDependencies({});
  const result = await performTwoPassClipboardRoundTrip(
    preliminaryBytes,
    finalBytes,
    fixture.dependencies,
  );

  assert.equal(result.success, true);
  assert.deepEqual(fixture.calls.map((call) => call.commandId), buildClipboardSequence());
  assert.deepEqual(fixture.calls[0].stdinBytes, preliminaryBytes);
  assert.equal(fixture.calls[1].stdinBytes, null);
  assert.deepEqual(fixture.calls[2].stdinBytes, finalBytes);
  assert.equal(fixture.calls[3].stdinBytes, null);
  assert.deepEqual(fixture.persisted, [finalBytes]);
});

test("two-pass clipboard helper stops before final copy on preliminary mismatch", async () => {
  const preliminaryBytes = Buffer.from("preliminary\n", "utf8");
  const finalBytes = Buffer.from("final\n", "utf8");
  const fixture = createClipboardDependencies({ firstReadback: Buffer.from("mismatch\n", "utf8") });

  await assertAsyncCategoricalRejection(
    performTwoPassClipboardRoundTrip(preliminaryBytes, finalBytes, fixture.dependencies),
    "CLIPBOARD_MISMATCH",
  );
  assert.deepEqual(fixture.calls.map((call) => call.commandId), ["PBCOPY", "PBPASTE"]);
  assert.deepEqual(fixture.persisted, []);
});

test("two-pass clipboard helper never persists after final readback mismatch", async () => {
  const preliminaryBytes = Buffer.from("preliminary\n", "utf8");
  const finalBytes = Buffer.from("final\n", "utf8");
  const fixture = createClipboardDependencies({ secondReadback: Buffer.from("mismatch\n", "utf8") });

  await assertAsyncCategoricalRejection(
    performTwoPassClipboardRoundTrip(preliminaryBytes, finalBytes, fixture.dependencies),
    "CLIPBOARD_MISMATCH",
  );
  assert.deepEqual(fixture.calls.map((call) => call.commandId), buildClipboardSequence());
  assert.deepEqual(fixture.persisted, []);
});

test("prior correction record contains each exact no-execution token once", async () => {
  const { priorRecord } = await sources();
  for (const token of [
    "HARNESS_EXECUTED=false",
    "STATIC_TESTS_EXECUTED=false",
    "WRAPPER_EXECUTED=false",
    "VALIDATOR_EXECUTED=false",
  ]) {
    const fullLine = new RegExp(`^${token}$`, "gm");
    assert.equal(priorRecord.match(fullLine)?.length, 1, `unexpected count for ${token}`);
  }
});

test("both tests exclude mutation, subprocess, worker, VM, and network capability", async () => {
  const { staticTest, executionTest } = await sources();
  const testSources = Object.freeze({ staticTest, executionTest });
  const forbiddenModuleBases = [
    "child_" + "process",
    "http",
    "https",
    "http2",
    "net",
    "tls",
    "dns",
    "dgram",
    "worker_" + "threads",
    "clu" + "ster",
    "v" + "m",
    "pro" + "cess",
    "mod" + "ule",
  ];
  const forbiddenModules = forbiddenModuleBases.flatMap((moduleName) => [
    moduleName,
    `node:${moduleName}`,
  ]);
  const builtinLoaderModuleBases = [
    "child_" + "process",
    "http",
    "https",
    "http2",
    "net",
    "tls",
    "dns",
    "dgram",
    "worker_" + "threads",
    "clu" + "ster",
    "v" + "m",
    "f" + "s",
    "f" + "s/promises",
  ];
  const builtinLoaderModules = builtinLoaderModuleBases.flatMap((moduleName) => [
    moduleName,
    `node:${moduleName}`,
  ]);
  const filesystemMutationCalls = [
    "write" + "File", "write" + "FileSync", "append" + "File", "append" + "FileSync",
    "write" + "Sync", "write" + "v", "write" + "vSync", "truncate", "truncate" + "Sync",
    "ftruncate", "ftruncate" + "Sync", "mkdir", "mkdir" + "Sync", "mkdtemp", "mkdtemp" + "Sync",
    "rm", "rm" + "Sync", "rmdir", "rmdir" + "Sync", "unlink", "unlink" + "Sync",
    "rename", "rename" + "Sync", "copy" + "File", "copy" + "FileSync", "cp", "cp" + "Sync",
    "chmod", "chmod" + "Sync", "fchmod", "fchmod" + "Sync", "lchmod", "lchmod" + "Sync",
    "chown", "chown" + "Sync", "fchown", "fchown" + "Sync", "lchown", "lchown" + "Sync",
    "utimes", "utimes" + "Sync", "futimes", "futimes" + "Sync", "lutimes", "lutimes" + "Sync",
    "symlink", "symlink" + "Sync", "link", "link" + "Sync", "open", "open" + "Sync",
    "create" + "WriteStream",
  ];
  const globalNetworkCalls = [
    "fetch", "Web" + "Socket", "Event" + "Source", "XMLHttp" + "Request", "send" + "Beacon",
  ];
  const processMutationMethods = [
    "ki" + "ll",
    "ch" + "dir",
    "ex" + "it",
    "ab" + "ort",
    "set" + "uid",
    "sete" + "uid",
    "set" + "gid",
    "sete" + "gid",
    "set" + "groups",
    "init" + "groups",
    "um" + "ask",
    "dis" + "connect",
    "bind" + "ing",
    "_linked" + "Binding",
    "dlo" + "pen",
  ];
  const processMutationProperties = [
    "exit" + "Code",
    "ti" + "tle",
    "arg" + "v",
    "exec" + "Argv",
  ];
  const workerConstructors = ["Work" + "er", "Shared" + "Worker"];
  const alternateRuntimeMutationMethods = [
    ["De" + "no", "ex" + "it"],
    ["De" + "no", "ch" + "dir"],
    ["De" + "no", "ki" + "ll"],
    ["B" + "un", "spawn"],
  ];
  const builtinModuleLoaderMethod = "get" + "Builtin" + "Module";
  const objectEnvironmentMutationMethods = [
    "as" + "sign",
    "define" + "Property",
    "define" + "Properties",
  ];
  const reflectEnvironmentMutationMethods = [
    "s" + "et",
    "delete" + "Property",
    "define" + "Property",
  ];
  const writableFlagPattern = new RegExp("\\bO_" + "(?:WRONLY|RDWR|CREAT|TRUNC|APPEND|EXCL)\\b");
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const moduleCapabilityPattern = (moduleName) => new RegExp(
    `(?:\\bfrom\\s*|\\bimport\\s*(?:\\(\\s*)?|\\brequire\\s*(?:\\.\\s*resolve\\s*)?\\(\\s*)["']${escapeRegExp(moduleName)}["']`,
    "m",
  );
  const processToken = "pro" + "cess";
  const environmentToken = "e" + "nv";
  const processEnvironmentTarget = "\\bprocess\\s*(?:\\.\\s*env\\b|\\[\\s*[\"']env[\"']\\s*\\])";
  const processEnvironmentMemberTarget = `${processEnvironmentTarget}\\s*(?:\\.\\s*[A-Za-z_$][A-Za-z0-9_$]*|\\[[^\\]]+\\])`;
  const assignmentMutationOperator = "(?:\\*\\*=|>>>=|<<=|>>=|&&=|\\|\\|=|\\?\\?=|\\+=|-=|\\*=|\\/=|%=|&=|\\^=|\\|=|=)";
  const incrementDecrementOperator = "(?:\\+\\+|--)";
  const contiguousBuiltinLoaderToken = "get" + "Builtin" + "Module";
  const computedProcessAccessPattern = new RegExp(
    `\\b${processToken}\\s*(?:\\?\\.\\s*)?\\[`,
  );
  const directProcessEnvironmentAccessPattern = new RegExp(
    `\\b${processToken}\\s*(?:\\.\\s*|\\?\\.\\s*)${environmentToken}\\b`,
  );
  const propertySurface = (owner, propertyName) => (
    `\\b${owner}\\s*(?:\\.\\s*${propertyName}\\b|\\[\\s*[\"']${propertyName}[\"']\\s*\\])`
  );

  for (const [sourceName, source] of Object.entries(testSources)) {
    const importSurfaces = [
      ...source.matchAll(/^\s*import\s+(?!\s*\()([\s\S]*?)\s+from\s*["'][^"'\r\n]+["']\s*;?\s*$/gm),
      ...source.matchAll(/\b(?:const|let|var)\s*\{([\s\S]*?)\}\s*=\s*require\s*\(\s*["'][^"']+["']\s*\)/g),
    ].map((match) => match[1]).join("\n");
    assert.equal(
      source.includes(contiguousBuiltinLoaderToken),
      false,
      `${sourceName} contains a forbidden contiguous built-in loader token`,
    );
    assert.doesNotMatch(
      source,
      computedProcessAccessPattern,
      `${sourceName} uses computed process access`,
    );
    assert.doesNotMatch(
      source,
      directProcessEnvironmentAccessPattern,
      `${sourceName} reads or aliases the process environment`,
    );
    for (const moduleName of forbiddenModules) {
      assert.doesNotMatch(
        source,
        moduleCapabilityPattern(moduleName),
        `${sourceName} loads forbidden module ${moduleName}`,
      );
    }
    for (const moduleName of builtinLoaderModules) {
      assert.doesNotMatch(
        source,
        new RegExp(
          `${propertySurface("process", builtinModuleLoaderMethod)}\\s*\\(\\s*["']${escapeRegExp(moduleName)}["']`,
        ),
        `${sourceName} loads forbidden built-in module ${moduleName}`,
      );
    }
    for (const capability of filesystemMutationCalls) {
      assert.doesNotMatch(
        importSurfaces,
        new RegExp(`\\b${capability}\\b`),
        `${sourceName} imports filesystem mutation capability ${capability}`,
      );
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${capability}\\s*\\(`),
        `${sourceName} gained filesystem mutation capability ${capability}`,
      );
      assert.doesNotMatch(
        source,
        new RegExp(`(?:\\.\\s*${capability}\\b|\\[\\s*["']${capability}["']\\s*\\])`),
        `${sourceName} aliases filesystem mutation capability ${capability}`,
      );
    }
    for (const capability of globalNetworkCalls) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${capability}\\s*\\(`),
        `${sourceName} gained network capability ${capability}`,
      );
    }
    for (const method of processMutationMethods) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\bprocess\\s*(?:\\.\\s*${method}\\b|\\[\\s*["']${method}["']\\s*\\])\\s*\\(`),
        `${sourceName} mutates the current process via ${method}`,
      );
    }
    for (const propertyName of processMutationProperties) {
      const processPropertyTarget = propertySurface("process", propertyName);
      assert.doesNotMatch(
        source,
        new RegExp(`${processPropertyTarget}\\s*${assignmentMutationOperator}`),
        `${sourceName} mutates process property ${propertyName}`,
      );
      assert.doesNotMatch(
        source,
        new RegExp(`${processPropertyTarget}\\s*${incrementDecrementOperator}`),
        `${sourceName} applies a postfix process property mutator to ${propertyName}`,
      );
      assert.doesNotMatch(
        source,
        new RegExp(`${incrementDecrementOperator}\\s*${processPropertyTarget}`),
        `${sourceName} applies a prefix process property mutator to ${propertyName}`,
      );
    }
    assert.doesNotMatch(
      source,
      new RegExp(`${processEnvironmentMemberTarget}\\s*${assignmentMutationOperator}`),
      `${sourceName} assigns through a process environment member`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`${processEnvironmentMemberTarget}\\s*${incrementDecrementOperator}`),
      `${sourceName} applies a postfix process environment mutator`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`${incrementDecrementOperator}\\s*${processEnvironmentMemberTarget}`),
      `${sourceName} applies a prefix process environment mutator`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`\\bdelete\\s+${processEnvironmentMemberTarget}`),
      `${sourceName} deletes a process environment member`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`${processEnvironmentTarget}\\s*${assignmentMutationOperator}`),
      `${sourceName} directly replaces the process environment`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`${processEnvironmentTarget}\\s*${incrementDecrementOperator}`),
      `${sourceName} applies a postfix process environment-object mutator`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`${incrementDecrementOperator}\\s*${processEnvironmentTarget}`),
      `${sourceName} applies a prefix process environment-object mutator`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`\\bdelete\\s+${processEnvironmentTarget}(?!\\s*(?:\\.|\\[))`),
      `${sourceName} deletes the process environment`,
    );
    for (const method of objectEnvironmentMutationMethods) {
      const objectMethod = propertySurface("Object", method);
      assert.doesNotMatch(
        source,
        new RegExp(`${objectMethod}\\s*\\(\\s*${processEnvironmentTarget}`),
        `${sourceName} mutates the process environment via Object.${method}`,
      );
      if (method !== objectEnvironmentMutationMethods[0]) {
        assert.doesNotMatch(
          source,
          new RegExp(`${objectMethod}\\s*\\(\\s*\\bprocess\\s*,\\s*["']env["']`),
          `${sourceName} redefines the process environment via Object.${method}`,
        );
      }
    }
    for (const method of reflectEnvironmentMutationMethods) {
      const reflectMethod = propertySurface("Reflect", method);
      assert.doesNotMatch(
        source,
        new RegExp(`${reflectMethod}\\s*\\(\\s*${processEnvironmentTarget}`),
        `${sourceName} mutates the process environment via Reflect.${method}`,
      );
      assert.doesNotMatch(
        source,
        new RegExp(`${reflectMethod}\\s*\\(\\s*\\bprocess\\s*,\\s*["']env["']`),
        `${sourceName} mutates the process env property via Reflect.${method}`,
      );
    }
    assert.doesNotMatch(
      source,
      new RegExp(`\\bprocess\\s*(?:\\.\\s*mainModule\\b|\\[\\s*["']mainModule["']\\s*\\])`),
      `${sourceName} accesses the legacy process module loader`,
    );
    for (const constructorName of workerConstructors) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b(?:new\\s+)?${constructorName}\\s*\\(`),
        `${sourceName} creates a worker via ${constructorName}`,
      );
    }
    for (const [runtimeName, method] of alternateRuntimeMutationMethods) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${runtimeName}\\s*(?:\\.\\s*${method}\\b|\\[\\s*["']${method}["']\\s*\\])\\s*\\(`),
        `${sourceName} gains alternate runtime mutation capability ${runtimeName}.${method}`,
      );
    }
    assert.doesNotMatch(
      importSurfaces,
      /(?:node:stream|from\s+["']stream["'])[\s\S]*(?:Writable|Duplex|Transform|PassThrough)/,
    );
    assert.doesNotMatch(source, /\b(?:new\s+)?(?:Writable|Duplex|Transform|PassThrough)\s*\(/);
    assert.doesNotMatch(source, writableFlagPattern);
  }
});
