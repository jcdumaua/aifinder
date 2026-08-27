import { spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson } from "./canonical.mjs";

const REPOSITORY_ROOT = "/Users/jamescarlodumaua/aifinder";
const NODE_EXECUTABLE = "/usr/local/bin/node";
const SUPERVISOR_PATH =
  "/Users/jamescarlodumaua/aifinder/scripts/launch-operations-kernel/" +
  "admin-v1-official-first-environment-supervisor.mjs";
const MAX_SECRET_CHARACTERS = 16_384;
const MAX_KEYCHAIN_OUTPUT_BYTES = 64 * 1024;
const MAX_SUPERVISOR_OUTPUT_BYTES = 64 * 1024;
const PROCESS_TIMEOUT_MS = 15 * 60 * 1000;
const HERMETIC_DEPENDENCY_KEYS = Object.freeze([
  "allow_hermetic_test",
  "environment",
  "platform",
  "spawn_process",
  "write_stderr",
  "write_stdout",
]);

export const ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY =
  Object.freeze({
    account: "aifinder-admin-v1-first-environment",
    executable: "/usr/bin/security",
    service: "AiFinder.AdminV1.FirstEnvironment.ADMIN_PASSWORD",
  });

const KEYCHAIN_ARGUMENTS = Object.freeze([
  "find-generic-password",
  "-a",
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY.account,
  "-s",
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY.service,
  "-w",
]);

const SAFE_FAILURE_CODES = new Set([
  "FIRST_ENVIRONMENT_KEYCHAIN_ARGUMENTS_DENIED",
  "FIRST_ENVIRONMENT_KEYCHAIN_AUTHORIZATION_INVALID",
  "FIRST_ENVIRONMENT_KEYCHAIN_CREDENTIAL_INVALID",
  "FIRST_ENVIRONMENT_KEYCHAIN_DEPENDENCIES_DENIED",
  "FIRST_ENVIRONMENT_KEYCHAIN_EXECUTABLE_INVALID",
  "FIRST_ENVIRONMENT_KEYCHAIN_INVOCATION_SPENT",
  "FIRST_ENVIRONMENT_KEYCHAIN_LIVE_DEPENDENCY_OVERRIDE",
  "FIRST_ENVIRONMENT_KEYCHAIN_LOOKUP_FAILED",
  "FIRST_ENVIRONMENT_KEYCHAIN_OUTPUT_REDACTED",
  "FIRST_ENVIRONMENT_KEYCHAIN_PLATFORM_UNSUPPORTED",
  "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_FAILED",
  "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_INVALID",
  "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_START_FAILED",
]);

const spentHermeticDependencies = new WeakSet();
let liveInvocationSpent = false;

export class AdminV1OfficialFirstEnvironmentKeychainLauncherError
  extends Error {
  constructor(code) {
    super(code);
    this.name = "AdminV1OfficialFirstEnvironmentKeychainLauncherError";
    this.code = code;
  }
}

function fail(code) {
  throw new AdminV1OfficialFirstEnvironmentKeychainLauncherError(code);
}

function exactKeys(value, expected) {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) return false;
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right, "en")
  );
  const wanted = [...expected].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function parseArguments(argumentsList) {
  if (
    Array.isArray(argumentsList) && argumentsList.length === 1 &&
    argumentsList[0] === "--self-test"
  ) return Object.freeze({ mode: "SELF_TEST" });
  const live = Array.isArray(argumentsList) && argumentsList.length === 4 &&
    argumentsList[3] === "--allow-live";
  if (
    !Array.isArray(argumentsList) ||
    ![3, 4].includes(argumentsList.length) ||
    argumentsList[0] !== "--run-first-environment" ||
    argumentsList[1] !== "--authorization" ||
    typeof argumentsList[2] !== "string" ||
    (argumentsList.length === 4 && !live)
  ) fail("FIRST_ENVIRONMENT_KEYCHAIN_ARGUMENTS_DENIED");
  return Object.freeze({
    authorizationPath: argumentsList[2],
    mode: live ? "LIVE" : "HERMETIC_TEST_ONLY",
  });
}

function validateRegularPath(target, {
  code,
  executable,
  mode,
}) {
  try {
    if (
      typeof target !== "string" || !path.isAbsolute(target) ||
      target.includes("\0") || target.split(path.sep).includes("..") ||
      realpathSync(target) !== target
    ) throw new Error("PATH");
    const metadata = lstatSync(target);
    if (
      !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 ||
      (mode !== undefined && (metadata.mode & 0o777) !== mode) ||
      (executable === true && (metadata.mode & 0o111) === 0)
    ) throw new Error("IDENTITY");
  } catch {
    fail(code);
  }
}

function processBuffers(result, maximumBytes, code) {
  if (
    !result || !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.stdout.byteLength > maximumBytes ||
    result.stderr.byteLength > maximumBytes
  ) fail(code);
  return {
    stderr: Buffer.from(result.stderr),
    stdout: Buffer.from(result.stdout),
  };
}

function nativeSpawn(command, argumentsList, options) {
  return spawnSync(command, argumentsList, options);
}

function decodeBoundedOutput(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function writeNativeStdout(bytes) {
  if (bytes.byteLength === 0) return;
  const text = decodeBoundedOutput(bytes);
  console.log(text.endsWith("\n") ? text.slice(0, -1) : text);
}

function writeNativeStderr(bytes) {
  if (bytes.byteLength === 0) return;
  const text = decodeBoundedOutput(bytes);
  console.error(text.endsWith("\n") ? text.slice(0, -1) : text);
}

function failureCode(error) {
  return SAFE_FAILURE_CODES.has(error?.code)
    ? error.code
    : "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_FAILED";
}

function emitFailure(code, writeStderr) {
  try {
    writeStderr(Buffer.from(`${canonicalJson({ status: "FAIL", code })}\n`));
  } catch {
    // The bounded return code remains available even if the output sink fails.
  }
  return Object.freeze({ exit_code: 1, code });
}

function spendInvocation(parsed, dependencies) {
  if (parsed.mode === "LIVE") {
    if (liveInvocationSpent) fail("FIRST_ENVIRONMENT_KEYCHAIN_INVOCATION_SPENT");
    liveInvocationSpent = true;
    return;
  }
  if (spentHermeticDependencies.has(dependencies)) {
    fail("FIRST_ENVIRONMENT_KEYCHAIN_INVOCATION_SPENT");
  }
  spentHermeticDependencies.add(dependencies);
}

export function dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
  arguments_list,
  dependencies = {},
}) {
  const parsed = (() => {
    try {
      return parseArguments(arguments_list);
    } catch (error) {
      const writeStderr = typeof dependencies?.write_stderr === "function"
        ? dependencies.write_stderr
        : writeNativeStderr;
      return emitFailure(failureCode(error), writeStderr);
    }
  })();
  if (Object.hasOwn(parsed, "exit_code")) return parsed;

  if (parsed.mode === "SELF_TEST") {
    if (!exactKeys(dependencies, [])) {
      return emitFailure(
        "FIRST_ENVIRONMENT_KEYCHAIN_DEPENDENCIES_DENIED",
        writeNativeStderr,
      );
    }
    const result = Object.freeze({
      status: "PASS",
      code: "PASS_FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_LAUNCHER_SELF_TEST",
      credential_value_reads: 0,
      keychain_reads: 0,
      network_calls: 0,
      provider_calls: 0,
      runtime_sessions: 0,
      supervisor_starts: 0,
    });
    writeNativeStdout(Buffer.from(`${canonicalJson(result)}\n`));
    return Object.freeze({ exit_code: 0, code: result.code });
  }

  const dependencyCount = dependencies && typeof dependencies === "object"
    ? Object.keys(dependencies).length
    : -1;
  if (parsed.mode === "LIVE" && dependencyCount !== 0) {
    const writeStderr = typeof dependencies?.write_stderr === "function"
      ? dependencies.write_stderr
      : writeNativeStderr;
    return emitFailure(
      "FIRST_ENVIRONMENT_KEYCHAIN_LIVE_DEPENDENCY_OVERRIDE",
      writeStderr,
    );
  }
  if (
    parsed.mode === "HERMETIC_TEST_ONLY" &&
    (!exactKeys(dependencies, HERMETIC_DEPENDENCY_KEYS) ||
      dependencies.allow_hermetic_test !== true ||
      (dependencies.platform !== "darwin" && dependencies.platform !== "linux") ||
      !dependencies.environment ||
      typeof dependencies.environment !== "object" ||
      typeof dependencies.spawn_process !== "function" ||
      typeof dependencies.write_stderr !== "function" ||
      typeof dependencies.write_stdout !== "function")
  ) {
    const writeStderr = typeof dependencies?.write_stderr === "function"
      ? dependencies.write_stderr
      : writeNativeStderr;
    return emitFailure(
      "FIRST_ENVIRONMENT_KEYCHAIN_DEPENDENCIES_DENIED",
      writeStderr,
    );
  }

  const platform = parsed.mode === "LIVE" ? process.platform : dependencies.platform;
  const spawnProcess = parsed.mode === "LIVE"
    ? nativeSpawn
    : dependencies.spawn_process;
  const parentEnvironment = parsed.mode === "LIVE"
    ? process.env
    : dependencies.environment;
  const writeStderr = parsed.mode === "LIVE"
    ? writeNativeStderr
    : dependencies.write_stderr;
  const writeStdout = parsed.mode === "LIVE"
    ? writeNativeStdout
    : dependencies.write_stdout;
  let keychainStdout = null;
  let keychainStderr = null;
  let secretBytes = null;
  let childEnvironment = null;
  let supervisorStdout = null;
  let supervisorStderr = null;
  try {
    if (platform !== "darwin") {
      fail("FIRST_ENVIRONMENT_KEYCHAIN_PLATFORM_UNSUPPORTED");
    }
    validateRegularPath(
      ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY.executable,
      { code: "FIRST_ENVIRONMENT_KEYCHAIN_EXECUTABLE_INVALID", executable: true },
    );
    validateRegularPath(NODE_EXECUTABLE, {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_EXECUTABLE_INVALID",
      executable: true,
    });
    validateRegularPath(SUPERVISOR_PATH, {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_INVALID",
      mode: 0o644,
    });
    validateRegularPath(parsed.authorizationPath, {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_AUTHORIZATION_INVALID",
      mode: 0o600,
    });
    spendInvocation(parsed, dependencies);

    const lookup = spawnProcess(
      ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY.executable,
      KEYCHAIN_ARGUMENTS,
      {
        encoding: null,
        maxBuffer: MAX_KEYCHAIN_OUTPUT_BYTES,
        shell: false,
        timeout: PROCESS_TIMEOUT_MS,
      },
    );
    ({ stdout: keychainStdout, stderr: keychainStderr } = processBuffers(
      lookup,
      MAX_KEYCHAIN_OUTPUT_BYTES,
      "FIRST_ENVIRONMENT_KEYCHAIN_LOOKUP_FAILED",
    ));
    if (
      lookup.error !== undefined || lookup.signal !== null || lookup.status !== 0
    ) fail("FIRST_ENVIRONMENT_KEYCHAIN_LOOKUP_FAILED");
    secretBytes = Buffer.from(keychainStdout);
    const credentialBytes =
      secretBytes.byteLength > 0 &&
        secretBytes[secretBytes.byteLength - 1] === 0x0a
        ? secretBytes.subarray(0, secretBytes.byteLength - 1)
        : secretBytes;
    let secret;
    try {
      secret = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
        credentialBytes,
      );
    } catch {
      fail("FIRST_ENVIRONMENT_KEYCHAIN_CREDENTIAL_INVALID");
    }
    if (
      secret.length < 1 || secret.length > MAX_SECRET_CHARACTERS ||
      secret.includes("\0") || secret.includes("\r") || secret.includes("\n")
    ) fail("FIRST_ENVIRONMENT_KEYCHAIN_CREDENTIAL_INVALID");

    childEnvironment = { ...parentEnvironment, ADMIN_PASSWORD: secret };
    const child = spawnProcess(
      NODE_EXECUTABLE,
      [
        SUPERVISOR_PATH,
        "--run-first-environment",
        "--authorization",
        parsed.authorizationPath,
      ],
      {
        cwd: REPOSITORY_ROOT,
        encoding: null,
        env: childEnvironment,
        maxBuffer: MAX_SUPERVISOR_OUTPUT_BYTES,
        shell: false,
        timeout: PROCESS_TIMEOUT_MS,
      },
    );
    ({ stdout: supervisorStdout, stderr: supervisorStderr } = processBuffers(
      child,
      MAX_SUPERVISOR_OUTPUT_BYTES,
      "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_START_FAILED",
    ));
    if (child.error !== undefined || child.signal !== null || child.status === null) {
      fail("FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_START_FAILED");
    }
    if (
      supervisorStdout.includes(credentialBytes) ||
      supervisorStderr.includes(credentialBytes)
    ) fail("FIRST_ENVIRONMENT_KEYCHAIN_OUTPUT_REDACTED");
    writeStdout(supervisorStdout);
    writeStderr(supervisorStderr);
    if (child.status !== 0) {
      return Object.freeze({
        exit_code: child.status,
        code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_FAILED",
      });
    }
    return Object.freeze({
      exit_code: 0,
      code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_COMPLETE",
    });
  } catch (error) {
    return emitFailure(failureCode(error), writeStderr);
  } finally {
    if (childEnvironment !== null) childEnvironment.ADMIN_PASSWORD = "";
    if (supervisorStdout !== null) supervisorStdout.fill(0);
    if (supervisorStderr !== null) supervisorStderr.fill(0);
    if (secretBytes !== null) secretBytes.fill(0);
    if (keychainStdout !== null) keychainStdout.fill(0);
    if (keychainStderr !== null) keychainStderr.fill(0);
  }
}

function main() {
  const result =
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: process.argv.slice(2),
    });
  process.exitCode = result.exit_code;
}

if (
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) main();
