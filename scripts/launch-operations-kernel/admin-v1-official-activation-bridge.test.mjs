import assert from "node:assert/strict";
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import {
  createConcreteRunnerDependencies,
} from "./nonproduction-qualification-runner.mjs";
import {
  ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP,
  loadAdminV1OfficialCredentials,
} from "./admin-v1-official-live-platform.mjs";
import {
  ADMIN_V1_OFFICIAL_ACTION_COSTS,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
} from "./admin-v1-official-runtime.mjs";

const dependencies = createConcreteRunnerDependencies({
  repositoryRoot: "/Users/jamescarlodumaua/aifinder",
  writeOutput() {},
});

for (const name of [
  "prepareOfficialExecutionContext",
  "hashOfficialRouteSource",
  "hashOfficialAuthorizationSchema",
  "verifyNoPriorOfficialRecovery",
  "readOfficialCredentials",
  "runAuthorizedOfficialRuntime",
]) {
  assert.equal(
    typeof dependencies[name],
    "function",
    `real concrete dependency factory must provide ${name}`,
  );
}

const mapped = ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP.map(
  (entry) => entry.operation,
);
assert.equal(new Set(mapped).size, mapped.length);
assert.deepEqual(
  mapped.filter((entry) => entry !== "application_request").sort(),
  Object.keys(ADMIN_V1_OFFICIAL_ACTION_COSTS).sort(),
);
assert.equal(mapped.includes("application_request"), true);

const credentials = loadAdminV1OfficialCredentials({
  environment: {
    ADMIN_PASSWORD: "synthetic-admin",
    ADMIN_SESSION_SECRET: "synthetic-session",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service",
    GH_TOKEN: "synthetic-github",
    VERCEL_TOKEN: "synthetic-vercel",
    NODE_ENV: "production",
  },
  credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
});
assert.equal(credentials.admin_password instanceof Uint8Array, true);
assert.equal(credentials.admin_session_secret instanceof Uint8Array, true);
for (const value of Object.values(credentials)) value.fill(0);

const credentialCalls = [];
const credentialDependencies = createConcreteRunnerDependencies({
  readCredentialEnvironment() {
    credentialCalls.push("read");
    return Object.freeze({});
  },
  resolveCredentialEnvironment() {
    credentialCalls.push("resolve");
    return {
      environment: {
        ADMIN_PASSWORD: "synthetic-admin",
        ADMIN_SESSION_SECRET: "synthetic-session",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
        NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "synthetic-service",
        GH_TOKEN: "synthetic-github",
        VERCEL_TOKEN: "synthetic-vercel",
      },
      sources: {
        GITHUB: "AVAILABLE_EXISTING_GITHUB_CLI_SOURCE",
        VERCEL: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
        SUPABASE_URL: "AVAILABLE_ENV_LOCAL",
        SUPABASE_ANON: "AVAILABLE_ENV_LOCAL",
        SUPABASE_SERVICE_ROLE: "AVAILABLE_ENV_LOCAL",
        ADMIN_PASSWORD: "AVAILABLE_ENV_LOCAL",
        ADMIN_SESSION: "AVAILABLE_ENV_LOCAL",
      },
    };
  },
});
const wiredCredentials = await credentialDependencies.readOfficialCredentials(
  {},
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
);
assert.deepEqual(credentialCalls, ["read", "resolve"]);
assert.equal(wiredCredentials.github_token instanceof Uint8Array, true);
for (const value of Object.values(wiredCredentials)) value.fill(0);

const contextRoot = realpathSync(mkdtempSync(
  "/tmp/aifinder-admin-v1-official-context-",
));
function restoreOwnerWrite(target) {
  const metadata = lstatSync(target);
  if (!metadata.isDirectory()) return;
  chmodSync(target, 0o700);
  for (const name of readdirSync(target)) {
    restoreOwnerWrite(path.join(target, name));
  }
}
try {
  const contextAuthorization = {
    authorization_id_sha256: "1".repeat(64),
    candidate_identity_sha256: "2".repeat(64),
    manifest_sha256: "3".repeat(64),
    run_id: "66666666-6666-4666-8666-666666666666",
    repository: { root: realpathSync(".") },
    execution: { journal_directory: contextRoot },
  };
  const contextDependencies = createConcreteRunnerDependencies({
    repositoryRoot: realpathSync("."),
  });
  const context = await contextDependencies.prepareOfficialExecutionContext(
    contextAuthorization,
  );
  assert.equal(lstatSync(contextRoot).mode & 0o777, 0o700);
  assert.equal(typeof context.journal.publish, "function");
  assert.equal(typeof context.git_execution_context.git_dir, "string");
  assert.deepEqual(
    contextDependencies.verifyNoPriorOfficialRecovery(contextAuthorization),
    { status: "ABSENT" },
  );
  context.journal.publish({
    lifecycle: "RECOVERY_PENDING",
    token_spent: true,
    zero_residual: false,
  });
  assert.deepEqual(
    contextDependencies.verifyNoPriorOfficialRecovery(contextAuthorization),
    { status: "RECOVERY_PENDING" },
  );
} finally {
  restoreOwnerWrite(contextRoot);
  rmSync(contextRoot, { recursive: true, force: true });
}

console.log(
  "PASS_ADMIN_V1_OFFICIAL_ACTIVATION_BRIDGE assertions=19 real_factory=true operation_map_closed=true official_credentials=true recovery_gate=true real_external_actions=0",
);
