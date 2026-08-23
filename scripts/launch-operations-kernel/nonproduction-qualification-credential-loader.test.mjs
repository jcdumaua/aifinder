import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

let loader = Object.freeze({});
try {
  loader = await import("./nonproduction-qualification-credential-loader.mjs");
} catch {
  // The first TDD run intentionally reaches this branch before implementation.
}

const ALLOWLIST = Object.freeze([
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "VERCEL_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
]);
const SECRET_SENTINEL = "credential-loader-secret-sentinel";
const GITHUB_SENTINEL = "github-cli-secret-sentinel";
const VERCEL_SENTINEL = "vercel-cli-secret-sentinel";
const failures = [];
let assertions = 0;
let credentialReads = 0;
let network = 0;
let liveMutations = 0;

const GREEN_MARKERS = Object.freeze([
  "ENV_LOCAL_BYTES_ZEROED_SUCCESS",
  "ENV_LOCAL_BYTES_ZEROED_PARSE_FAILURE",
  "GITHUB_CLI_STDOUT_ZEROED_SUCCESS",
  "GITHUB_CLI_STDOUT_ZEROED_COMMAND_FAILURE",
  "GITHUB_CLI_STDOUT_ZEROED_DECODE_OR_VALIDATION_FAILURE",
  "GITHUB_CLI_STDERR_ZEROED_SUCCESS",
  "GITHUB_CLI_STDERR_ZEROED_FAILURE",
  "VERCEL_AUTH_BYTES_ZEROED_SUCCESS",
  "VERCEL_AUTH_BYTES_ZEROED_JSON_OR_TOKEN_FAILURE",
  "SECURE_FILE_ACQUIRED_BUFFER_ZEROED_ON_INTERNAL_FAILURE",
  "RETURNED_CREDENTIAL_SEMANTICS_UNCHANGED",
  "CATEGORICAL_ERROR_SEMANTICS_UNCHANGED",
]);

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

function fixture(source) {
  const root = realpathSync(mkdtempSync("/tmp/aifinder-credential-loader."));
  writeFileSync(path.join(root, ".env.local"), source, { mode: 0o600 });
  return root;
}

function readFixture(root) {
  credentialReads += 1;
  return loader.readConcreteCredentialEnvironment({ repositoryRoot: root });
}

function allBytesZero(bytes) {
  return bytes instanceof Uint8Array && bytes.every((byte) => byte === 0);
}

await check("exports the exact frozen credential allowlist", async () => {
  assert.deepEqual(loader.CONCRETE_CREDENTIAL_NAMES, ALLOWLIST);
  assert.equal(Object.isFrozen(loader.CONCRETE_CREDENTIAL_NAMES), true);
});

await check("loads only exact allowlisted keys from the exact root file", async () => {
  const root = fixture([
    "GH_TOKEN=github-primary",
    "GITHUB_TOKEN=github-fallback",
    "VERCEL_TOKEN=vercel",
    "NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=anon",
    "SUPABASE_SERVICE_ROLE_KEY=service",
    "ADMIN_PASSWORD=admin-password",
    "ADMIN_SESSION_SECRET=admin-session",
    "UNRELATED_VALUE=ignored",
    "",
  ].join("\n"));
  try {
    const environment = readFixture(root);
    assert.deepEqual(Object.keys(environment), ALLOWLIST);
    assert.equal(environment.UNRELATED_VALUE, undefined);
    assert.equal(Object.isFrozen(environment), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("unrelated keys are ignored", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    "UNRELATED=ignored\nGH_TOKEN=kept\n",
  );
  assert.deepEqual(parsed, { GH_TOKEN: "kept" });
});

await check("duplicate allowlisted keys fail closed deterministically", async () => {
  assert.throws(
    () => loader.parseConcreteCredentialEnvironment(
      "GH_TOKEN=first\nGH_TOKEN=second\n",
    ),
    (error) => error?.code === "CONCRETE_CREDENTIAL_FILE_INVALID",
  );
});

await check("malformed lines fail closed", async () => {
  for (const source of ["GH_TOKEN\n", "=value\n", "bad key=value\n"]) {
    assert.throws(
      () => loader.parseConcreteCredentialEnvironment(source),
      (error) => error?.code === "CONCRETE_CREDENTIAL_FILE_INVALID",
    );
  }
});

await check("single and double quoted values use one whole-value rule", async () => {
  assert.deepEqual(
    loader.parseConcreteCredentialEnvironment(
      "GH_TOKEN='single value'\nVERCEL_TOKEN=\"double value\"\n",
    ),
    { GH_TOKEN: "single value", VERCEL_TOKEN: "double value" },
  );
  assert.throws(
    () => loader.parseConcreteCredentialEnvironment("GH_TOKEN='broken\n"),
    (error) => error?.code === "CONCRETE_CREDENTIAL_FILE_INVALID",
  );
});

await check("shell syntax remains literal data", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    "GH_TOKEN=alpha; touch /tmp/never\n",
  );
  assert.equal(parsed.GH_TOKEN, "alpha; touch /tmp/never");
});

await check("variable references are not expanded", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    "GH_TOKEN=$GITHUB_TOKEN\nGITHUB_TOKEN=${GH_TOKEN}\n",
  );
  assert.deepEqual(parsed, {
    GH_TOKEN: "$GITHUB_TOKEN",
    GITHUB_TOKEN: "${GH_TOKEN}",
  });
});

await check("command substitutions are not executed", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    "GH_TOKEN=$(printf forbidden)\n",
  );
  assert.equal(parsed.GH_TOKEN, "$(printf forbidden)");
});

await check("comments and blank lines are deterministic", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    "\n# comment\nGH_TOKEN=value#literal\r\n",
  );
  assert.deepEqual(parsed, { GH_TOKEN: "value#literal" });
});

await check("empty allowlisted values remain explicit for adapter validation", async () => {
  assert.deepEqual(loader.parseConcreteCredentialEnvironment("GH_TOKEN=\n"), {
    GH_TOKEN: "",
  });
});

await check("a symlinked credential file fails closed", async () => {
  const root = realpathSync(mkdtempSync("/tmp/aifinder-credential-loader-link."));
  const target = path.join(root, "synthetic.env");
  writeFileSync(target, "GH_TOKEN=value\n", { mode: 0o600 });
  symlinkSync(target, path.join(root, ".env.local"));
  try {
    assert.throws(
      () => readFixture(root),
      (error) => {
        assert.equal(error?.code, "CONCRETE_CREDENTIAL_MISSING");
        assert.deepEqual(error?.invalid_credential_sources, ["ENV_LOCAL"]);
        return true;
      },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("a missing exact credential file fails categorically", async () => {
  const root = realpathSync(mkdtempSync("/tmp/aifinder-credential-loader-missing."));
  try {
    assert.throws(
      () => readFixture(root),
      (error) => {
        assert.equal(error?.code, "CONCRETE_CREDENTIAL_MISSING");
        assert.deepEqual(error?.missing_credentials, [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "ADMIN_PASSWORD",
          "ADMIN_SESSION_SECRET",
        ]);
        assert.deepEqual(error?.invalid_credential_sources, []);
        return true;
      },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("credential values are returned explicitly without ambient export", async () => {
  const parsed = loader.parseConcreteCredentialEnvironment(
    `GH_TOKEN=${SECRET_SENTINEL}\n`,
  );
  assert.equal(parsed.GH_TOKEN, SECRET_SENTINEL);
  assert.equal("AIFINDER_SYNTHETIC_CREDENTIAL_PROBE" in parsed, false);
  const source = readFileSync(
    new URL("./nonproduction-qualification-credential-loader.mjs", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("process.env"), false);
  assert.equal(source.includes("node:process"), false);
});

await check("credential values are absent from evidence and CCR fixtures", async () => {
  const publicFixtures = JSON.stringify({
    evidence: { status: "FAIL", code: "CONCRETE_CREDENTIAL_MISSING" },
    ccr: { real_credential_reads: 0, network: 0, live_mutations: 0 },
  });
  assert.equal(publicFixtures.includes(SECRET_SENTINEL), false);
});

await check("zeroes retained env-local bytes after a successful parse", async () => {
  const source = "GH_TOKEN=synthetic-env-local\n";
  const root = fixture(source);
  let retained = null;
  try {
    const environment = loader.readConcreteCredentialEnvironment({
      repositoryRoot: root,
      onCredentialBytesAcquired(bytes) {
        retained = bytes;
      },
    });
    assert.deepEqual(environment, { GH_TOKEN: "synthetic-env-local" });
    assert.equal(allBytesZero(retained), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("zeroes retained env-local bytes after parse failure", async () => {
  const source = "GH_TOKEN\n";
  const root = fixture(source);
  let retained = null;
  try {
    assert.throws(
      () => loader.readConcreteCredentialEnvironment({
        repositoryRoot: root,
        onCredentialBytesAcquired(bytes) {
          retained = bytes;
        },
      }),
      (error) => {
        assert.equal(error?.code, "CONCRETE_CREDENTIAL_MISSING");
        assert.deepEqual(error?.invalid_credential_sources, ["ENV_LOCAL"]);
        return true;
      },
    );
    assert.equal(allBytesZero(retained), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

await check("actual required categories do not make both GitHub aliases mandatory", async () => {
  assert.deepEqual(loader.ACTUAL_RUNTIME_CREDENTIAL_CATEGORIES, [
    { category: "GITHUB", accepted_names: ["GH_TOKEN", "GITHUB_TOKEN"] },
    { category: "VERCEL", accepted_names: ["VERCEL_TOKEN"] },
    { category: "SUPABASE_URL", accepted_names: ["NEXT_PUBLIC_SUPABASE_URL"] },
    { category: "SUPABASE_ANON", accepted_names: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
    { category: "SUPABASE_SERVICE_ROLE", accepted_names: ["SUPABASE_SERVICE_ROLE_KEY"] },
    { category: "ADMIN_PASSWORD", accepted_names: ["ADMIN_PASSWORD"] },
    { category: "ADMIN_SESSION", accepted_names: ["ADMIN_SESSION_SECRET"] },
  ]);
});

await check("presence classifier is value-free and fails duplicate or malformed input closed", async () => {
  const classified = loader.classifyConcreteCredentialEnvironment([
    `GH_TOKEN=${SECRET_SENTINEL}`,
    "VERCEL_TOKEN=",
    "",
  ].join("\n"));
  assert.deepEqual(classified.GH_TOKEN, {
    present: true,
    non_empty: true,
    duplicate: false,
    parse_valid: true,
    allowlisted: true,
  });
  assert.deepEqual(classified.VERCEL_TOKEN, {
    present: true,
    non_empty: false,
    duplicate: false,
    parse_valid: true,
    allowlisted: true,
  });
  assert.equal(JSON.stringify(classified).includes(SECRET_SENTINEL), false);
  assert.throws(
    () => loader.classifyConcreteCredentialEnvironment(
      "GH_TOKEN=first\nGH_TOKEN=second\n",
    ),
    (error) => error?.code === "CONCRETE_CREDENTIAL_FILE_INVALID",
  );
  assert.throws(
    () => loader.classifyConcreteCredentialEnvironment("GH_TOKEN\n"),
    (error) => error?.code === "CONCRETE_CREDENTIAL_FILE_INVALID",
  );
});

await check("synthetic GitHub CLI success zeroes retained stdout and stderr", async () => {
  const stdout = Buffer.from(`${GITHUB_SENTINEL}\n`, "utf8");
  const stderr = Buffer.from("synthetic provider noise", "utf8");
  const token = loader.readExistingGitHubCliToken({
    repositoryRoot: "/Users/synthetic/aifinder",
    spawnCredentialCommand(executable, argumentsList, options) {
      assert.equal(executable, "/opt/homebrew/bin/gh");
      assert.deepEqual(argumentsList, ["auth", "token"]);
      assert.equal(options.shell, false);
      return { status: 0, stdout, stderr };
    },
  });
  assert.equal(token, GITHUB_SENTINEL);
  assert.equal(allBytesZero(stdout), true);
  assert.equal(allBytesZero(stderr), true);
});

await check("synthetic GitHub CLI command failure zeroes retained stdout and stderr", async () => {
  const stdout = Buffer.from(SECRET_SENTINEL, "utf8");
  const stderr = Buffer.from("synthetic command failure", "utf8");
  assert.throws(
    () => loader.readExistingGitHubCliToken({
      repositoryRoot: "/Users/synthetic/aifinder",
      spawnCredentialCommand() {
        return { status: 1, stdout, stderr };
      },
    }),
    (error) =>
      error?.code === "CONCRETE_CREDENTIAL_SOURCE_INVALID" &&
      !String(error?.message).includes(SECRET_SENTINEL),
  );
  assert.equal(allBytesZero(stdout), true);
  assert.equal(allBytesZero(stderr), true);
});

await check("synthetic GitHub CLI validation failure zeroes retained stdout and stderr", async () => {
  const stdout = Buffer.from(GITHUB_SENTINEL, "utf8");
  const stderr = Buffer.from("synthetic validation failure", "utf8");
  assert.throws(
    () => loader.readExistingGitHubCliToken({
      repositoryRoot: "/Users/synthetic/aifinder",
      spawnCredentialCommand() {
        return { status: 0, stdout, stderr };
      },
    }),
    (error) => error?.code === "CONCRETE_CREDENTIAL_SOURCE_INVALID",
  );
  assert.equal(allBytesZero(stdout), true);
  assert.equal(allBytesZero(stderr), true);
});

await check("synthetic Vercel CLI success zeroes retained auth bytes", async () => {
  const authBytes = Buffer.from(JSON.stringify({ token: VERCEL_SENTINEL }), "utf8");
  const token = loader.readExistingVercelCliToken({
    repositoryRoot: "/Users/synthetic/aifinder",
    readCredentialFile(credentialPath) {
      assert.equal(
        credentialPath,
        "/Users/synthetic/Library/Application Support/com.vercel.cli/auth.json",
      );
      return authBytes;
    },
  });
  assert.equal(token, VERCEL_SENTINEL);
  assert.equal(allBytesZero(authBytes), true);
});

await check("synthetic Vercel CLI JSON failure zeroes retained auth bytes", async () => {
  const authBytes = Buffer.from("{synthetic-invalid-json", "utf8");
  assert.throws(
    () => loader.readExistingVercelCliToken({
      repositoryRoot: "/Users/synthetic/aifinder",
      readCredentialFile() {
        return authBytes;
      },
    }),
    (error) => error?.code === "CONCRETE_CREDENTIAL_SOURCE_INVALID",
  );
  assert.equal(allBytesZero(authBytes), true);
});

await check("secure file helper zeroes an acquired buffer on internal failure", async () => {
  const temporaryRoot = realpathSync(mkdtempSync("/tmp/aifinder-credential-loader."));
  const repositoryRoot = path.join(temporaryRoot, "aifinder");
  const authDirectory = path.join(
    temporaryRoot,
    "Library",
    "Application Support",
    "com.vercel.cli",
  );
  mkdirSync(repositoryRoot);
  mkdirSync(authDirectory, { recursive: true });
  writeFileSync(
    path.join(authDirectory, "auth.json"),
    JSON.stringify({ token: VERCEL_SENTINEL }),
    { mode: 0o600 },
  );
  credentialReads += 1;
  let acquired = null;
  try {
    assert.throws(
      () => loader.readExistingVercelCliToken({
        repositoryRoot,
        secureCredentialFileDependencies: {
          onCredentialBytesAcquired(bytes) {
            acquired = bytes;
            throw new Error("SYNTHETIC_POST_ACQUISITION_FAILURE");
          },
        },
      }),
      (error) => error?.code === "CONCRETE_CREDENTIAL_SOURCE_INVALID",
    );
    assert.equal(allBytesZero(acquired), true);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

await check("credential source resolution is deterministic and invokes only missing providers", async () => {
  const base = {
    GH_TOKEN: "preferred-github",
    GITHUB_TOKEN: "fallback-github",
    VERCEL_TOKEN: "environment-vercel",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    ADMIN_PASSWORD: "password",
    ADMIN_SESSION_SECRET: "session",
  };
  let githubReads = 0;
  let vercelReads = 0;
  const fromEnvironment = loader.resolveConcreteCredentialEnvironment({
    environment: base,
    repositoryRoot: "/Users/synthetic/aifinder",
    readGitHubCliToken() {
      githubReads += 1;
      return GITHUB_SENTINEL;
    },
    readVercelCliToken() {
      vercelReads += 1;
      return VERCEL_SENTINEL;
    },
  });
  assert.equal(fromEnvironment.environment.GH_TOKEN, "preferred-github");
  assert.equal(fromEnvironment.environment.GITHUB_TOKEN, "fallback-github");
  assert.equal(fromEnvironment.environment.VERCEL_TOKEN, "environment-vercel");
  assert.equal(githubReads, 0);
  assert.equal(vercelReads, 0);
  assert.deepEqual(fromEnvironment.sources, {
    GITHUB: "AVAILABLE_ENV_LOCAL",
    VERCEL: "AVAILABLE_ENV_LOCAL",
    SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
    SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
    SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
    ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
    ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
  });

  const fromCli = loader.resolveConcreteCredentialEnvironment({
    environment: {
      ...base,
      GH_TOKEN: "",
      GITHUB_TOKEN: "",
      VERCEL_TOKEN: "",
    },
    repositoryRoot: "/Users/synthetic/aifinder",
    readGitHubCliToken() {
      githubReads += 1;
      return GITHUB_SENTINEL;
    },
    readVercelCliToken() {
      vercelReads += 1;
      return VERCEL_SENTINEL;
    },
  });
  assert.equal(fromCli.environment.GH_TOKEN, GITHUB_SENTINEL);
  assert.equal(fromCli.environment.VERCEL_TOKEN, VERCEL_SENTINEL);
  assert.equal(githubReads, 1);
  assert.equal(vercelReads, 1);
  assert.equal(fromCli.sources.GITHUB, "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE");
  assert.equal(fromCli.sources.VERCEL, "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE");
  assert.equal(Object.isFrozen(fromCli.environment), true);
});

await check("missing required categories are named without leaking sentinels", async () => {
  assert.throws(
    () => loader.resolveConcreteCredentialEnvironment({
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "session",
      },
      repositoryRoot: "/Users/synthetic/aifinder",
      readGitHubCliToken() {
        throw new Error(SECRET_SENTINEL);
      },
      readVercelCliToken() {
        throw new Error(SECRET_SENTINEL);
      },
    }),
    (error) => {
      assert.equal(error?.code, "CONCRETE_CREDENTIAL_MISSING");
      assert.deepEqual(error?.missing_credentials, ["GH_TOKEN|GITHUB_TOKEN", "VERCEL_TOKEN"]);
      assert.deepEqual(error?.invalid_credential_sources, ["GITHUB", "VERCEL"]);
      assert.equal(JSON.stringify(error).includes(SECRET_SENTINEL), false);
      return true;
    },
  );
});

await check("synthetic loader tests perform no network", async () => {
  assert.equal(network, 0);
});

await check("synthetic loader tests perform no live mutations", async () => {
  assert.equal(liveMutations, 0);
});

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_CREDENTIAL_LOADER assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  for (const marker of GREEN_MARKERS) console.log(`${marker}=PASS`);
  console.log(
    `PASS_CONCRETE_CREDENTIAL_LOADER assertions=${assertions} synthetic_credential_reads=${credentialReads} real_credential_reads=0 REAL_CREDENTIAL_READS=0 NETWORK=${network} LIVE_MUTATIONS=${liveMutations} SECRET_OUTPUTS=0 SECRET_HASHES=0 failures=0 internal_failures=0`,
  );
}
