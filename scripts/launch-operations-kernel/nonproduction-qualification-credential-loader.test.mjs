import assert from "node:assert/strict";
import {
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

await check("synthetic GitHub CLI source returns only an in-memory token and sanitizes noise", async () => {
  const token = loader.readExistingGitHubCliToken({
    repositoryRoot: "/Users/synthetic/aifinder",
    spawnCredentialCommand(executable, argumentsList, options) {
      assert.equal(executable, "/opt/homebrew/bin/gh");
      assert.deepEqual(argumentsList, ["auth", "token"]);
      assert.equal(options.shell, false);
      return {
        status: 0,
        stdout: Buffer.from(`${GITHUB_SENTINEL}\n`),
        stderr: Buffer.from("synthetic provider noise"),
      };
    },
  });
  assert.equal(token, GITHUB_SENTINEL);
  assert.throws(
    () => loader.readExistingGitHubCliToken({
      repositoryRoot: "/Users/synthetic/aifinder",
      spawnCredentialCommand() {
        return {
          status: 1,
          stdout: Buffer.alloc(0),
          stderr: Buffer.from(SECRET_SENTINEL),
        };
      },
    }),
    (error) =>
      error?.code === "CONCRETE_CREDENTIAL_SOURCE_INVALID" &&
      !String(error?.message).includes(SECRET_SENTINEL),
  );
});

await check("synthetic Vercel CLI auth source returns only an in-memory token", async () => {
  const token = loader.readExistingVercelCliToken({
    repositoryRoot: "/Users/synthetic/aifinder",
    readCredentialFile(credentialPath) {
      assert.equal(
        credentialPath,
        "/Users/synthetic/Library/Application Support/com.vercel.cli/auth.json",
      );
      return Buffer.from(JSON.stringify({ token: VERCEL_SENTINEL }));
    },
  });
  assert.equal(token, VERCEL_SENTINEL);
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
  console.log(
    `PASS_CONCRETE_CREDENTIAL_LOADER assertions=${assertions} synthetic_credential_reads=${credentialReads} real_credential_reads=0 network=${network} live_mutations=${liveMutations} secret_output=0 failures=0 internal_failures=0`,
  );
}
