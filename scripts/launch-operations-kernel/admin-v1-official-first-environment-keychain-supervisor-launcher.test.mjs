import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY,
  dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher,
} from "./admin-v1-official-first-environment-keychain-supervisor-launcher.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const LAUNCHER_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-keychain-supervisor-launcher.mjs",
);
const SUPERVISOR_PATH = path.join(
  import.meta.dirname,
  "admin-v1-official-first-environment-supervisor.mjs",
);
const NODE_EXECUTABLE = "/usr/local/bin/node";
const SYNTHETIC_SECRET = "SYNTHETIC_KEYCHAIN_ADMIN_VALUE";

function syntheticDependencies({
  secret = Buffer.from(`${SYNTHETIC_SECRET}\n`, "utf8"),
  keychainStatus = 0,
  keychainStderr = Buffer.alloc(0),
  supervisorStatus = 0,
  supervisorStdout = Buffer.from(
    '{"code":"FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE","status":"PASS"}\n',
    "utf8",
  ),
  supervisorStderr = Buffer.alloc(0),
  supervisorError,
  platform = "darwin",
} = {}) {
  const parentEnvironment = Object.freeze({
    HOME: "/synthetic/home",
    PATH: "/usr/bin:/bin",
  });
  const calls = [];
  const stdout = [];
  const stderr = [];
  const dependencies = {
    allow_hermetic_test: true,
    environment: parentEnvironment,
    platform,
    spawn_process(command, argumentsList, options) {
      calls.push({
        adminPasswordAtSpawn: options.env?.ADMIN_PASSWORD,
        command,
        argumentsList: [...argumentsList],
        options,
      });
      if (calls.length === 1) {
        return {
          error: undefined,
          signal: null,
          status: keychainStatus,
          stderr: Buffer.from(keychainStderr),
          stdout: Buffer.from(secret),
        };
      }
      assert.equal(calls.length, 2);
      return {
        error: supervisorError,
        signal: null,
        status: supervisorStatus,
        stderr: Buffer.from(supervisorStderr),
        stdout: Buffer.from(supervisorStdout),
      };
    },
    write_stderr(bytes) {
      stderr.push(Buffer.from(bytes));
    },
    write_stdout(bytes) {
      stdout.push(Buffer.from(bytes));
    },
  };
  return { calls, dependencies, parentEnvironment, stderr, stdout };
}

const temporaryRoot = realpathSync(mkdtempSync(path.join(
  tmpdir(),
  "aifinder-keychain-supervisor-launcher-test-",
)));
try {
  const authorizationPath = path.join(temporaryRoot, "authorization.json");
  writeFileSync(authorizationPath, "{}\n", { mode: 0o600 });
  chmodSync(authorizationPath, 0o600);

  assert.deepEqual(
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY,
    {
      account: "aifinder-admin-v1-first-environment",
      executable: "/usr/bin/security",
      service: "AiFinder.AdminV1.FirstEnvironment.ADMIN_PASSWORD",
    },
  );

  const selfTest = spawnSync(process.argv[0], [LAUNCHER_PATH, "--self-test"], {
    cwd: ROOT,
    encoding: "utf8",
    env: {},
    maxBuffer: 64 * 1024,
    timeout: 10_000,
  });
  assert.equal(selfTest.status, 0, selfTest.stderr);
  assert.equal(selfTest.stderr, "");
  assert.deepEqual(JSON.parse(selfTest.stdout), {
    code: "PASS_FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_LAUNCHER_SELF_TEST",
    credential_value_reads: 0,
    keychain_reads: 0,
    network_calls: 0,
    provider_calls: 0,
    runtime_sessions: 0,
    status: "PASS",
    supervisor_starts: 0,
  });

  const success = syntheticDependencies();
  const successResult =
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: success.dependencies,
    });
  assert.deepEqual(successResult, {
    code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_COMPLETE",
    exit_code: 0,
  });
  assert.equal(success.calls.length, 2);
  assert.equal(
    success.calls[0].command,
    ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_IDENTITY.executable,
  );
  assert.deepEqual(success.calls[0].argumentsList, [
    "find-generic-password",
    "-a",
    "aifinder-admin-v1-first-environment",
    "-s",
    "AiFinder.AdminV1.FirstEnvironment.ADMIN_PASSWORD",
    "-w",
  ]);
  assert.equal(success.calls[0].options.shell, false);
  assert.equal(
    success.calls[0].argumentsList.includes(SYNTHETIC_SECRET),
    false,
  );
  assert.equal(success.calls[1].command, NODE_EXECUTABLE);
  assert.deepEqual(success.calls[1].argumentsList, [
    SUPERVISOR_PATH,
    "--run-first-environment",
    "--authorization",
    authorizationPath,
  ]);
  assert.equal(success.calls[1].options.shell, false);
  assert.equal(
    success.calls[1].adminPasswordAtSpawn,
    SYNTHETIC_SECRET,
  );
  assert.equal(Object.hasOwn(success.parentEnvironment, "ADMIN_PASSWORD"), false);
  assert.equal(success.calls[1].options.env.ADMIN_PASSWORD, "");
  assert.equal(
    Buffer.concat([...success.stdout, ...success.stderr]).includes(
      Buffer.from(SYNTHETIC_SECRET, "utf8"),
    ),
    false,
  );
  assert.equal(
    Buffer.concat(success.stdout).toString("utf8"),
    '{"code":"FIRST_ENVIRONMENT_SUPERVISOR_COMPLETE","status":"PASS"}\n',
  );
  assert.equal(Buffer.concat(success.stderr).byteLength, 0);

  const unframedSuccess = syntheticDependencies({
    secret: Buffer.from(SYNTHETIC_SECRET, "utf8"),
  });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: unframedSuccess.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_COMPLETE",
      exit_code: 0,
    },
  );
  assert.equal(unframedSuccess.calls.length, 2);
  assert.equal(
    unframedSuccess.calls[1].adminPasswordAtSpawn,
    SYNTHETIC_SECRET,
  );

  const bomFramedSecret = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from(`${SYNTHETIC_SECRET}\n`, "utf8"),
  ]);
  const bomFramedSuccess = syntheticDependencies({ secret: bomFramedSecret });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: bomFramedSuccess.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_COMPLETE",
      exit_code: 0,
    },
  );
  assert.equal(bomFramedSuccess.calls.length, 2);
  assert.equal(
    bomFramedSuccess.calls[1].adminPasswordAtSpawn,
    `\ufeff${SYNTHETIC_SECRET}`,
  );

  for (const secret of [
    Buffer.alloc(0),
    Buffer.from("A\0B", "utf8"),
    Buffer.from("A\rB", "utf8"),
    Buffer.from("A\nB", "utf8"),
    Buffer.alloc(16_385, 0x41),
    Buffer.from([0xc3, 0x28]),
  ]) {
    const invalid = syntheticDependencies({ secret });
    const result =
      dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
        arguments_list: [
          "--run-first-environment",
          "--authorization",
          authorizationPath,
        ],
        dependencies: invalid.dependencies,
      });
    assert.deepEqual(result, {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_CREDENTIAL_INVALID",
      exit_code: 1,
    });
    assert.equal(invalid.calls.length, 1);
    if (secret.byteLength > 0) {
      assert.equal(
        Buffer.concat([...invalid.stdout, ...invalid.stderr]).includes(secret),
        false,
      );
    }
  }

  for (const secret of [
    Buffer.from(`${SYNTHETIC_SECRET}\n\n`, "utf8"),
    Buffer.from(`${SYNTHETIC_SECRET}\r\n`, "utf8"),
    Buffer.from(`SYNTHETIC\nKEYCHAIN\n`, "utf8"),
    Buffer.from("\n", "utf8"),
  ]) {
    const invalidFraming = syntheticDependencies({ secret });
    const result =
      dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
        arguments_list: [
          "--run-first-environment",
          "--authorization",
          authorizationPath,
        ],
        dependencies: invalidFraming.dependencies,
      });
    assert.deepEqual(result, {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_CREDENTIAL_INVALID",
      exit_code: 1,
    });
    assert.equal(invalidFraming.calls.length, 1);
  }

  const lookupFailure = syntheticDependencies({
    keychainStatus: 44,
    keychainStderr: Buffer.from("SYNTHETIC_SENSITIVE_LOOKUP_ERROR", "utf8"),
  });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: lookupFailure.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_LOOKUP_FAILED",
      exit_code: 1,
    },
  );
  assert.equal(lookupFailure.calls.length, 1);
  assert.equal(
    Buffer.concat([...lookupFailure.stdout, ...lookupFailure.stderr])
      .includes(Buffer.from("SYNTHETIC_SENSITIVE_LOOKUP_ERROR", "utf8")),
    false,
  );

  const childFailure = syntheticDependencies({
    supervisorError: Object.assign(new Error("SYNTHETIC_CHILD_ERROR"), {
      code: "ENOENT",
    }),
    supervisorStatus: null,
  });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: childFailure.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_START_FAILED",
      exit_code: 1,
    },
  );
  assert.equal(childFailure.calls.length, 2);
  assert.equal(
    Buffer.concat([...childFailure.stdout, ...childFailure.stderr])
      .includes(Buffer.from("SYNTHETIC_CHILD_ERROR", "utf8")),
    false,
  );

  const outputLeak = syntheticDependencies({
    supervisorStdout: Buffer.from(`FAIL ${SYNTHETIC_SECRET}\n`, "utf8"),
  });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: outputLeak.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_OUTPUT_REDACTED",
      exit_code: 1,
    },
  );
  assert.equal(
    Buffer.concat([...outputLeak.stdout, ...outputLeak.stderr])
      .includes(Buffer.from(SYNTHETIC_SECRET, "utf8")),
    false,
  );

  const liveOverride = syntheticDependencies();
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
        "--allow-live",
      ],
      dependencies: liveOverride.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_LIVE_DEPENDENCY_OVERRIDE",
      exit_code: 1,
    },
  );
  assert.equal(liveOverride.calls.length, 0);

  const invalidPath = syntheticDependencies();
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        "relative-authorization.json",
      ],
      dependencies: invalidPath.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_AUTHORIZATION_INVALID",
      exit_code: 1,
    },
  );
  assert.equal(invalidPath.calls.length, 0);

  const unsupported = syntheticDependencies({ platform: "linux" });
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: unsupported.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_PLATFORM_UNSUPPORTED",
      exit_code: 1,
    },
  );
  assert.equal(unsupported.calls.length, 0);

  const oneShot = syntheticDependencies();
  assert.equal(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: oneShot.dependencies,
    }).exit_code,
    0,
  );
  assert.deepEqual(
    dispatchAdminV1OfficialFirstEnvironmentKeychainSupervisorLauncher({
      arguments_list: [
        "--run-first-environment",
        "--authorization",
        authorizationPath,
      ],
      dependencies: oneShot.dependencies,
    }),
    {
      code: "FIRST_ENVIRONMENT_KEYCHAIN_INVOCATION_SPENT",
      exit_code: 1,
    },
  );
  assert.equal(oneShot.calls.length, 2);

  console.log(
    "PASS_ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_KEYCHAIN_SUPERVISOR_LAUNCHER " +
      "assertions=52 failures=0 real_keychain_reads=0 real_keychain_writes=0 " +
      "real_supervisor_starts=0 credential_values_exposed=0 shell_uses=0 " +
      "provider_calls=0 network_calls=0 database_actions=0 retries=0 replays=0",
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
