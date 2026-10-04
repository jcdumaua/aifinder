import assert from "node:assert/strict";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import { createAdminV1OfficialAuthorizationRecord } from "./admin-v1-official-authorization.mjs";
import {
  OFFICIAL_ISOLATION_MODE,
  OFFICIAL_PREVIEW_ENVIRONMENT_KEYS,
  OFFICIAL_PROVIDER_RETENTION,
  ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256,
} from "./admin-v1-official-isolation.mjs";
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
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2,
} from "./admin-v1-official-runtime.mjs";

let assertions = 0;
const check = {
  equal(...args) { assert.equal(...args); assertions += 1; },
  deepEqual(...args) { assert.deepEqual(...args); assertions += 1; },
  throws(...args) { assert.throws(...args); assertions += 1; },
};
function restoreOwnerWrite(target) {
  const metadata = lstatSync(target);
  if (!metadata.isDirectory()) return;
  chmodSync(target, 0o700);
  for (const name of readdirSync(target)) {
    restoreOwnerWrite(path.join(target, name));
  }
}

const runId = "99999999-9999-4999-8999-999999999999";
const contextRoot =
  `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${runId}`;
const projectRef = "package-a-synthetic-empty-project";
const origin = `https://${projectRef}.supabase.co`;
const provenance = {
  schemaVersion: 1, runId, projectRef, origin,
  path: `${contextRoot}/isolated-credentials.json`,
  source: "OWNER_BOUND_ISOLATED_BUNDLE_V1",
};
const provenanceSha = sha256Hex(canonicalJson(provenance));
const provisioningReceipt = {
  schemaVersion: 1, runId, projectRef, origin,
  createdNew: true, emptyAtProvisioning: true, testOnly: true,
  schemaContractSha256: "e".repeat(64),
  credentialBundleProvenanceSha256: provenanceSha,
};
const isolationBinding = {
  mode: OFFICIAL_ISOLATION_MODE,
  project_ref: projectRef,
  origin,
  provisioning_receipt_sha256: sha256Hex(canonicalJson(provisioningReceipt)),
  schema_contract_sha256: provisioningReceipt.schemaContractSha256,
  credential_bundle_path: provenance.path,
  credential_bundle_provenance_sha256: provenanceSha,
  validation_run_id: runId,
  expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
  expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
};
const publishedHead = "e".repeat(40);
const observedRepository = {
  root: "/Users/jamescarlodumaua/aifinder", branch: "main", head: publishedHead,
  origin_main: publishedHead, remote_main: publishedHead, ahead: 0, behind: 0,
  index_empty: true, worktree_count: 1, status_sha256: "a".repeat(64), remote_repository: "jcdumaua/aifinder",
};
const reviewedPolicy = {
  candidate: { candidate_identity_sha256: "2".repeat(64), manifest_sha256: "3".repeat(64) },
  compatibility_support_sha256: Object.fromEntries([
    "testing/admin-v1-staging-runtime-orchestrator.mjs", "testing/admin-v1-staging-runtime-source-policy.test.mjs",
    "testing/run-static-readiness.mjs", "testing/static-test-safety-manifest.json",
  ].map((name) => [name, "4".repeat(64)])),
  official_runtime: { operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
    authorization_schema_sha256: "5".repeat(64), isolation_contract_sha256: ADMIN_V1_OFFICIAL_ISOLATION_CONTRACT_SHA256,
    route_source_sha256: Object.fromEntries([
      "app/api/admin/csrf/route.ts", "app/api/admin/login/route.ts", "app/api/admin/logout/route.ts",
      "app/api/admin/session/route.ts", "app/api/admin/submissions/route.ts", "app/api/admin/tools/route.ts",
      "app/api/admin/upload-logo/route.ts", "lib/admin-v1-launch-scope.ts", "proxy.ts",
    ].map((name) => [name, "6".repeat(64)])),
    contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
    contract_sha256_v2: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2),
    repository_contract: { root: observedRepository.root, branch: "main", remote_repository: "jcdumaua/aifinder",
      head_binding: "AUTHORIZATION_PUBLISHED_HEAD", origin_main_binding: "SAME_AS_HEAD",
      remote_main_binding: "SAME_AS_HEAD", status_binding: "AUTHORIZATION_STATUS_SHA256" },
  },
};
const isolatedRequest = {
  schema_version: 2,
  published_head: publishedHead,
  authorization_id_sha256: "1".repeat(64),
  review_approval_sha256: "7".repeat(64), supervisor_sha256: "8".repeat(64), supervisor_policy_sha256: "9".repeat(64),
  run_id: runId,
  created_at: new Date(Date.now() - 60_000).toISOString(),
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  execution: {
    access_mode: "SELF_PROJECT_OIDC", branch_name: `aifinder-admin-v1-official-${runId}`,
    journal_directory: contextRoot,
    environment_keys: [...OFFICIAL_PREVIEW_ENVIRONMENT_KEYS],
    provider_cleanup_policy: OFFICIAL_PROVIDER_RETENTION,
    preview_project_id: isolationBinding.expected_preview_project_id,
    preview_project_name: "aifinder", preview_team_slug: "ai-finder-s-projects",
    preview_team_id: isolationBinding.expected_preview_team_id,
    storage_bucket: "tool-logos", storage_name: `admin/${runId}.png`, temporary_commit_sha: "d".repeat(40),
    isolation: structuredClone(isolationBinding),
  },
};
const isolatedAuthorization = await createAdminV1OfficialAuthorizationRecord({
  inspect_repository: async () => structuredClone(observedRepository),
  inspect_temporary_commit: async () => ({ commit_sha: isolatedRequest.execution.temporary_commit_sha,
    parent_sha: publishedHead, tree_sha: "f".repeat(40) }),
  reviewed_policy: reviewedPolicy, request: isolatedRequest, now_epoch_ms: Date.now(),
});
check.equal(Object.keys(isolatedAuthorization).length, 19);
check.equal(Object.keys(isolatedAuthorization.execution).length, 13);
check.equal(Object.keys(isolatedAuthorization.execution.isolation).length, 10);
function isolatedBundle() {
  return {
    schema_version: 1, run_id: runId,
    provisioning_receipt: structuredClone(provisioningReceipt),
    provenance_receipt: structuredClone(provenance),
    values: Object.fromEntries([
      "admin_password", "admin_session_secret", "github_token",
      "supabase_anon_key", "supabase_service_role_key", "supabase_url",
      "vercel_token",
    ].map((name) => [name, Buffer.from(
      name === "supabase_url" ? origin : `synthetic-${name}`,
    )])),
  };
}

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
  check.equal(
    typeof dependencies[name],
    "function",
    `real concrete dependency factory must provide ${name}`,
  );
}

const mapped = ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP.map(
  (entry) => entry.operation,
);
check.equal(new Set(mapped).size, mapped.length);
check.deepEqual(
  mapped.filter((entry) => entry !== "application_request").sort(),
  Object.keys(ADMIN_V1_OFFICIAL_ACTION_COSTS).sort(),
);
check.equal(mapped.includes("application_request"), true);

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
check.equal(credentials.admin_password instanceof Uint8Array, true);
check.equal(credentials.admin_session_secret instanceof Uint8Array, true);
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
check.deepEqual(credentialCalls, ["read", "resolve"]);
check.equal(wiredCredentials.github_token instanceof Uint8Array, true);
for (const value of Object.values(wiredCredentials)) value.fill(0);

mkdirSync(contextRoot, { mode: 0o700 });
try {
check.equal(realpathSync(contextRoot), contextRoot);
const isolatedCalls = [];
const isolatedDependencies = createConcreteRunnerDependencies({
  readCredentialEnvironment() {
    isolatedCalls.push("forbidden-generic-read");
    throw new Error("GENERIC_READ_FORBIDDEN");
  },
  resolveCredentialEnvironment() {
    isolatedCalls.push("forbidden-generic-resolve");
    throw new Error("GENERIC_RESOLVE_FORBIDDEN");
  },
  readOfficialBundle() {
    isolatedCalls.push("isolated-bundle");
    return isolatedBundle();
  },
});
const isolatedCredentials = await isolatedDependencies.readOfficialCredentials(
  isolatedAuthorization,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
);
check.deepEqual(isolatedCalls, ["isolated-bundle"]);
check.equal(isolatedCredentials.github_token instanceof Uint8Array, true);
for (const value of Object.values(isolatedCredentials)) value.fill(0);

for (const mutate of [
  (record) => { record.run_id = "88888888-8888-4888-8888-888888888888"; },
  (record) => { record.execution.journal_directory = "/private/tmp/wrong-root"; },
  (record) => { record.execution.isolation.project_ref = "wrong-project"; },
  (record) => { record.execution.isolation.origin = "https://wrong.example/"; },
  (record) => { record.execution.preview_project_id = "prj_wrong"; },
]) {
  const record = structuredClone(isolatedAuthorization);
  mutate(record);
  check.throws(
    () => loadAdminV1OfficialCredentials({
      authorization: record,
      credential_bundle: isolatedBundle(),
      credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
    }),
    { code: "OFFICIAL_CREDENTIAL_MISSING" },
  );
}
for (const mutate of [
  (bundle) => { delete bundle.provenance_receipt; },
  (bundle) => { bundle.provenance_receipt.source = "GENERIC_ENV"; },
  (bundle) => { delete bundle.values.vercel_token; },
]) {
  const invalid = isolatedBundle();
  mutate(invalid);
  check.throws(
    () => loadAdminV1OfficialCredentials({
      authorization: isolatedAuthorization,
      credential_bundle: invalid,
      credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
    }),
    { code: "OFFICIAL_CREDENTIAL_MISSING" },
  );
  for (const value of Object.values(invalid.values ?? {})) {
    if (value instanceof Uint8Array) value.fill(0);
  }
}
  const contextAuthorization = isolatedAuthorization;
  const contextDependencies = createConcreteRunnerDependencies({
    repositoryRoot: realpathSync("."),
  });
  const context = await contextDependencies.prepareOfficialExecutionContext(
    contextAuthorization,
  );
  check.equal(lstatSync(contextRoot).mode & 0o777, 0o700);
  check.equal(typeof context.journal.publish, "function");
  check.equal(typeof context.git_execution_context.git_dir, "string");
  check.deepEqual(
    contextDependencies.verifyNoPriorOfficialRecovery(contextAuthorization),
    { status: "ABSENT" },
  );
  context.journal.publish({
    lifecycle: "RECOVERY_PENDING",
    token_spent: true,
    zero_residual: false,
  });
  check.deepEqual(
    contextDependencies.verifyNoPriorOfficialRecovery(contextAuthorization),
    { status: "RECOVERY_PENDING" },
  );
} finally {
  restoreOwnerWrite(contextRoot);
  rmSync(contextRoot, { recursive: true, force: true });
}

const genericContextRoot = realpathSync(mkdtempSync(
  "/tmp/aifinder-admin-v1-official-context-",
));
try {
  const genericAuthorization = {
    authorization_id_sha256: "1".repeat(64),
    candidate_identity_sha256: "2".repeat(64),
    manifest_sha256: "3".repeat(64),
    run_id: "66666666-6666-4666-8666-666666666666",
    repository: { root: observedRepository.root },
    execution: { journal_directory: genericContextRoot },
  };
  const genericDependencies = createConcreteRunnerDependencies({
    repositoryRoot: realpathSync("."),
  });
  const genericContext = await genericDependencies.prepareOfficialExecutionContext(
    genericAuthorization,
  );
  check.equal(lstatSync(genericContextRoot).mode & 0o777, 0o700);
  check.equal(typeof genericContext.journal.publish, "function");
  check.equal(typeof genericContext.git_execution_context.git_dir, "string");
  check.deepEqual(
    genericDependencies.verifyNoPriorOfficialRecovery(genericAuthorization),
    { status: "ABSENT" },
  );
} finally {
  restoreOwnerWrite(genericContextRoot);
  rmSync(genericContextRoot, { recursive: true, force: true });
}

console.log(
  `PASS_ADMIN_V1_OFFICIAL_ACTIVATION_BRIDGE assertions=${assertions} real_factory=true operation_map_closed=true official_credentials=true recovery_gate=true real_external_actions=0`,
);
