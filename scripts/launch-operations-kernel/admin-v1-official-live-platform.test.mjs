import { ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2, ADMIN_V1_OFFICIAL_CONTRACT_SHA256_V2 } from "./admin-v1-official-runtime.mjs";
import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  observeOfficialClientOrigin,
  validateOfficialIsolationAuthorization,
  validateOfficialProvisioningReceipt,
} from "./admin-v1-official-isolation.mjs";
import { loadAdminV1OfficialCredentials } from "./admin-v1-official-live-platform.mjs";
import * as officialPlatform from "./admin-v1-official-live-platform.mjs";
import * as officialRuntime from "./admin-v1-official-runtime.mjs";
import { ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY } from "./admin-v1-official-runtime.mjs";

const runId = "44444444-4444-4444-8444-444444444444";
const projectRef = "review-synthetic-project";
const now = Date.parse("2026-10-02T12:00:00.000Z");
function fixture(origin = `https://${projectRef}.supabase.co`, ref = projectRef) {
  const journal = `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${runId}`;
  const provenance = { schemaVersion: 1, runId, projectRef: ref, origin,
    path: `${journal}/isolated-credentials.json`, source: "OWNER_BOUND_ISOLATED_BUNDLE_V1" };
  const provenanceSha = sha256Hex(canonicalJson(provenance));
  const provisioning = { schemaVersion: 1, runId, projectRef: ref, origin,
    createdNew: true, emptyAtProvisioning: true, testOnly: true,
    schemaContractSha256: "a".repeat(64), credentialBundleProvenanceSha256: provenanceSha };
  const authorization = { schema_version: 2, operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
    run_id: runId, created_at: "2026-10-02T11:00:00.000Z", expires_at: "2026-10-02T13:00:00.000Z",
    execution: { journal_directory: journal,
      provider_cleanup_policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1",
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R", preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF"],
      isolation: { mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1", project_ref: ref, origin,
        provisioning_receipt_sha256: sha256Hex(canonicalJson(provisioning)), schema_contract_sha256: "a".repeat(64),
        credential_bundle_path: provenance.path, credential_bundle_provenance_sha256: provenanceSha,
        validation_run_id: runId, expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
        expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3" } } };
  const bundle = { schema_version: 1, run_id: runId, provisioning_receipt: provisioning, provenance_receipt: provenance,
    values: Object.fromEntries(["admin_password", "admin_session_secret", "github_token", "supabase_anon_key",
      "supabase_service_role_key", "supabase_url", "vercel_token"].map((name) => [name,
        Buffer.from(name === "supabase_url" ? origin : `synthetic-${name}`)])) };
  return { authorization, bundle };
}

const valid = fixture();
assert.equal(validateOfficialIsolationAuthorization(valid.authorization, now).origin, `https://${projectRef}.supabase.co`);
assert.throws(() => loadAdminV1OfficialCredentials({ authorization: valid.authorization,
  credential_bundle: valid.bundle, credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  now_epoch_ms: now }), { code: "OFFICIAL_CREDENTIAL_MISSING" });
let assertions = 2;
for (const [ref, origin] of [
  [projectRef, "https://unrelated-project.supabase.co"],
  [projectRef, "https://mtpisopvdxuvmpzbzqjw.supabase.co"],
  ["mtpisopvdxuvmpzbzqjw", "https://mtpisopvdxuvmpzbzqjw.supabase.co"],
  [projectRef, "https://custom.example"],
  [projectRef, `https://${projectRef}.supabase.co/`],
  [projectRef, `http://${projectRef}.supabase.co`],
]) {
  const { authorization, bundle } = fixture(origin, ref);
  assert.throws(() => validateOfficialIsolationAuthorization(authorization, now));
  assert.throws(() => validateOfficialProvisioningReceipt(authorization, bundle.provisioning_receipt, now));
  assert.throws(() => observeOfficialClientOrigin({ runId, projectRef: ref, actualClientOrigin: origin }));
  assert.throws(() => loadAdminV1OfficialCredentials({ authorization, credential_bundle: bundle,
    credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY, now_epoch_ms: now }),
    { code: "OFFICIAL_CREDENTIAL_MISSING" });
  for (const value of Object.values(bundle.values)) value.fill(0);
  assertions += 4;
}
for (const value of Object.values(valid.bundle.values)) value.fill(0);
// The independently specified v2 fixture exercises the real credential loader,
// preflight, adapter and concrete descriptor/response boundary. Only fetch/Git
// are replaced, so these cases cannot contact a provider or read credentials.
const expectedPreviewKeys = [
  "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "AIFINDER_VALIDATION_RUN_ID", "AIFINDER_VALIDATION_PROJECT_REF",
];
const expectedPreviewTypes = [
  "sensitive", "sensitive", "encrypted", "encrypted", "sensitive", "encrypted", "encrypted",
];
const expectedIsolationV2 = {
  schema_version: 2,
  operation_class: "ADMIN_V1_OFFICIAL_RUNTIME_V1",
  mode: "NEW_EMPTY_TEST_ONLY_PROJECT_V1",
  provider_cleanup_policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1",
  origin_relation: "HTTPS_PROJECT_REF_DOT_SUPABASE_DOT_CO_V1",
  allow_custom_origin: false,
  excluded_project_ref: "mtpisopvdxuvmpzbzqjw",
  excluded_origin: "https://mtpisopvdxuvmpzbzqjw.supabase.co",
  environment_keys: expectedPreviewKeys,
  credential_bundle_schema_version: 1,
  credential_bundle_provenance_source: "OWNER_BOUND_ISOLATED_BUNDLE_V1",
  credential_value_names: ["admin_password", "admin_session_secret", "github_token",
    "supabase_anon_key", "supabase_service_role_key", "supabase_url", "vercel_token"],
  credential_value_max_bytes: 16384,
  provisioning_receipt_schema_version: 1,
  provenance_receipt_schema_version: 1,
  expected_preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
  expected_preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
  preview_environment_plan: [
    ["ADMIN_PASSWORD", "credential:admin_password"],
    ["ADMIN_SESSION_SECRET", "credential:admin_session_secret"],
    ["NEXT_PUBLIC_SUPABASE_URL", "credential:supabase_url"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "credential:supabase_anon_key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "credential:supabase_service_role_key"],
    ["AIFINDER_VALIDATION_RUN_ID", "authorization:run_id"],
    ["AIFINDER_VALIDATION_PROJECT_REF", "authorization:isolation.project_ref"],
  ],
  retention_trigger: "SUCCESS_AFTER_OFFICIAL_LEDGER_AND_POSTSTATE_V1",
  pre_commit_failure_policy: "DELETE_EXACT_RUN_OWNED_EXTERNAL_RESOURCES_V1",
  post_commit_policy: "RETAIN_EXACT_RUN_OWNED_PREVIEW_AND_SEVEN_ENVIRONMENTS_V1",
  retention_complete_lifecycle: "RETENTION_COMPLETE",
  retention_pending_lifecycle: "RETENTION_PENDING",
  retained_preview_count: 1,
  retained_environment_count: 7,
  final_retention_verification: "REVERIFY_EXACT_IDS_AFTER_DATA_AND_EPHEMERAL_CLEANUP_V1",
  automatic_post_success_delete: false,
  later_destructive_cleanup_requires_owner_authority: true,
};

function completeFixture(schemaVersion = 2) {
  const { authorization, bundle } = fixture();
  const expectedCosts = structuredClone(officialRuntime.ADMIN_V1_OFFICIAL_ACTION_COSTS);
  for (let ordinal = 3; ordinal <= 7; ordinal += 1) {
    expectedCosts[`create_environment_${ordinal}`] = {
      provider_direct_mutations: 1, environment_records_created: 1,
    };
    expectedCosts[`verify_environment_${ordinal}`] = {
      provider_control_invocations: 1, environment_metadata_controls: 1,
    };
    expectedCosts[`delete_environment_${ordinal}`] = {
      provider_direct_mutations: 1, environment_records_deleted: 1,
    };
  }
  const expectedBudgets = { ...officialRuntime.ADMIN_V1_OFFICIAL_BUDGET_LIMITS,
    provider_direct_mutations: 15, environment_records_created: 7, environment_records_deleted: 7 };
  Object.assign(authorization, {
    authorization_id_sha256: "1".repeat(64), one_use_authorization_sha256: "2".repeat(64),
    review_approval_sha256: "3".repeat(64), candidate_identity_sha256: "4".repeat(64),
    manifest_sha256: "5".repeat(64), supervisor_sha256: "6".repeat(64),
    supervisor_policy_sha256: "7".repeat(64), authorization_schema_sha256: "8".repeat(64),
    compatibility_support_sha256: Object.fromEntries([
      "testing/admin-v1-staging-runtime-orchestrator.mjs",
      "testing/admin-v1-staging-runtime-source-policy.test.mjs",
      "testing/run-static-readiness.mjs", "testing/static-test-safety-manifest.json",
    ].map((name) => [name, "9".repeat(64)])),
    route_source_sha256: Object.fromEntries([
      "app/api/admin/csrf/route.ts", "app/api/admin/login/route.ts", "app/api/admin/logout/route.ts",
      "app/api/admin/session/route.ts", "app/api/admin/submissions/route.ts", "app/api/admin/tools/route.ts",
      "app/api/admin/upload-logo/route.ts", "lib/admin-v1-launch-scope.ts", "proxy.ts",
    ].map((name) => [name, "a".repeat(64)])),
    contract_sha256: { ...officialRuntime.ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
      action_costs: sha256Hex(canonicalJson(expectedCosts)), budgets: sha256Hex(canonicalJson(expectedBudgets)) },
    isolation_contract_sha256: sha256Hex(canonicalJson(expectedIsolationV2)),
    repository: { root: "/Users/jamescarlodumaua/aifinder", branch: "main", head: "b".repeat(40),
      origin_main: "b".repeat(40), remote_main: "b".repeat(40), ahead: 0, behind: 0,
      index_empty: true, worktree_count: 1, status_sha256: "c".repeat(64), remote_repository: "jcdumaua/aifinder" },
  });
  Object.assign(authorization.execution, {
    access_mode: "SELF_PROJECT_OIDC", branch_name: `aifinder-admin-v1-official-${runId}`,
    preview_project_name: "aifinder", preview_team_slug: "ai-finder-s-projects", storage_bucket: "tool-logos",
    storage_name: `admin/${runId}.png`, temporary_commit_sha: "d".repeat(40),
  });
  if (schemaVersion === 1) {
    authorization.schema_version = 1;
    delete authorization.isolation_contract_sha256;
    delete authorization.execution.provider_cleanup_policy;
    delete authorization.execution.isolation;
    authorization.execution.environment_keys = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];
    authorization.contract_sha256 = structuredClone(officialRuntime.ADMIN_V1_OFFICIAL_CONTRACT_SHA256);
  } else {
    const { one_use_authorization_sha256: ignored, ...unsigned } = authorization;
    authorization.one_use_authorization_sha256 = sha256Hex(canonicalJson({
      domain: "AIFINDER_ADMIN_V1_OFFICIAL_ONE_USE_AUTHORIZATION_V2", ...unsigned,
    }));
  }
  return { authorization, bundle };
}

function credentialProbe(schemaVersion = 2, { journal, retention_recovery, spawn_sync, live_now_epoch_ms = () => now } = {}) {
  const { authorization, bundle } = completeFixture(schemaVersion);
  const credentials = loadAdminV1OfficialCredentials(schemaVersion === 2
    ? { authorization, credential_bundle: bundle, credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
        now_epoch_ms: now }
    : { authorization, credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
        environment: { ADMIN_PASSWORD: "synthetic-admin", ADMIN_SESSION_SECRET: "synthetic-session",
          NEXT_PUBLIC_SUPABASE_URL: `https://${projectRef}.supabase.co`, NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-service", GH_TOKEN: "synthetic-github", VERCEL_TOKEN: "synthetic-vercel",
          NODE_ENV: "production" } });
  const calls = [];
  let responseFor = () => ({ id: authorization.execution.preview_project_id,
    name: authorization.execution.preview_project_name, accountId: authorization.execution.preview_team_id });
  const transport = officialPlatform.createAdminV1OfficialConcreteTransport({
    live_now_epoch_ms,
    execution_context: { ...(journal ? { journal } : {}), ...(retention_recovery ? { retention_recovery } : {}),
      ...(spawn_sync ? { git_execution_context: {
        git_dir: "/tmp/aifinder-official-synthetic-git-dir",
        object_directory: "/tmp/aifinder-official-synthetic-objects",
      } } : {}) },
    spawn_sync: spawn_sync ?? (() => assert.fail("unexpected synthetic Git call")),
    fetch_impl: async (rawUrl, init) => {
      const request = { url: new URL(String(rawUrl)), method: init.method,
        headers: init.headers,
        body: init.body === undefined ? null : JSON.parse(init.body) };
      calls.push(request);
      const response = responseFor(request);
      return { status: response?.http_status ?? 200,
        headers: { get: (name) => response?.http_headers?.[name] ?? null, getSetCookie: () => [] },
        text: async () => response?.http_text ?? JSON.stringify(response?.http_body ?? response) };
    },
  });
  return { authorization, credentials, bundle, calls, transport,
    respondWith(operation) { responseFor = operation; },
    execute(operation, input = {}, suppliedCredentials = credentials) {
      return transport.execute({ operation, input, authorization, credentials: suppliedCredentials });
    },
    retire() {
      for (const value of Object.values(credentials)) value.fill(0);
      for (const value of Object.values(bundle.values)) value.fill(0);
    } };
}

const contractFailures = [];
async function contractCheck(name, operation) {
  try { await operation(); assertions += 1; }
  catch (error) { contractFailures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`); }
}

await contractCheck("v2 expiry inside remote deletion denies physical mutation after ownership read", async () => {
  let clock = now, calls = 0;
  const probe = credentialProbe(2, { live_now_epoch_ms: () => clock, spawn_sync: (_file, args) => {
    calls += 1;
    if (args.includes("ls-remote")) {
      clock = Date.parse(probe.authorization.expires_at);
      return { status: 0, stdout: `${probe.authorization.execution.temporary_commit_sha}\trefs/heads/${probe.authorization.execution.branch_name}\n`, stderr: "" };
    }
    assert.fail("expired authorization must never reach Git push");
  } });
  try {
    await assert.rejects(probe.execute("delete_remote_ref", { ref_id: `refs/heads/${probe.authorization.execution.branch_name}` }));
    assert.equal(calls, 1);
  } finally { probe.retire(); }
});

for (const schemaVersion of [1, 2]) await contractCheck(`schema-${schemaVersion} valid preflight`, async () => {
  const probe = credentialProbe(schemaVersion);
  try {
    const result = await probe.execute("inspect_environment_contract");
    assert.deepEqual(result, { status: "EXACT", names: [...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] });
    assert.equal(probe.calls.length, 1);
    assert.equal(probe.calls[0].url.pathname, `/v9/projects/${probe.authorization.execution.preview_project_id}`);
    assert.equal(probe.calls[0].url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
  } finally { probe.retire(); }
});

for (const [name, change] of [
  ["wrong run", (observation) => { observation.bundle_run_id = "55555555-5555-4555-8555-555555555555"; }],
  ["wrong provenance", (observation) => { observation.bundle_provenance_sha256 = "f".repeat(64); }],
  ["wrong names", (observation) => { observation.names = observation.names.slice(1); }],
  ["wrong policy", (observation) => { observation.credential_source_policy.GITHUB = "UNBOUND"; }],
  ["wrong node environment", (observation) => { observation.node_env = "development"; }],
  ["extra legacy alias", (observation) => { observation.github_alias_count = 1; }],
  ["extra field", (observation) => { observation.unrelated = true; }],
]) await contractCheck(`v2 observation rejects ${name} before request`, async () => {
  const probe = credentialProbe();
  try {
    const [symbol] = Object.getOwnPropertySymbols(probe.credentials);
    const observation = structuredClone(probe.credentials[symbol]);
    change(observation);
    const supplied = { ...probe.credentials };
    Object.defineProperty(supplied, symbol, { value: observation });
    await assert.rejects(probe.execute("inspect_environment_contract", {}, supplied),
      { code: "OFFICIAL_ENVIRONMENT_OBSERVATION_UNPROVEN" });
    assert.equal(probe.calls.length, 0);
  } finally { probe.retire(); }
});

for (const keys of [expectedPreviewKeys.slice(0, 2), [...expectedPreviewKeys].reverse(),
  [...expectedPreviewKeys.slice(0, 6), "UNBOUND_KEY"]]) {
  await contractCheck("v2 preflight rejects wrong exact ordered key set before request", async () => {
    const probe = credentialProbe();
    try {
      probe.authorization.execution.environment_keys = keys;
      await assert.rejects(probe.execute("inspect_environment_contract"), { code: "OFFICIAL_ENVIRONMENT_OBSERVATION_UNPROVEN" });
      assert.equal(probe.calls.length, 0);
    } finally { probe.retire(); }
  });
}

await contractCheck("v2 adapter operation map adds exactly fifteen actions with closed metadata", async () => {
  const v1 = officialPlatform.ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP_V1;
  const v2 = officialPlatform.ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP_V2;
  assert.strictEqual(officialPlatform.ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP, v1);
  assert.ok(Object.isFrozen(v1) && Object.isFrozen(v2));
  const expectedOperations = v1.map((row) => row.operation);
  const metadata = {
    create: ["SETUP", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_created", "mutation", "CREATE_EXACT", "OFFICIAL_STATE_MACHINE"],
    verify: ["SETUP", "PROVIDER_CONTROL", "provider_control_invocations+environment_metadata_controls", "read", "READ_ONLY", "NONE"],
    delete: ["CLEANUP", "PROVIDER_MUTATION", "provider_direct_mutations+environment_records_deleted", "mutation", "DELETE_EXACT", "OFFICIAL_STATE_MACHINE"],
  };
  for (const row of v1) assert.deepEqual(v2.find((entry) => entry.operation === row.operation), row);
  for (const [kind, [stage, authority, budget, effect, idempotency, owner]] of Object.entries(metadata)) {
    for (let ordinal = 3; ordinal <= 7; ordinal += 1) {
      const operation = `${kind}_environment_${ordinal}`;
      expectedOperations.push(operation);
      assert.deepEqual(v2.find((row) => row.operation === operation), {
        operation, state_machine_stage: stage, concrete_implementation: "vercel.environment",
        underlying_transport: "vercel", authority_class: authority, budget_counter: budget,
        mutation_or_read: effect, idempotency, retry_rule: "ZERO",
        sanitized_result_shape: "BOUNDED_OPERATION_SPECIFIC_OBJECT", cleanup_owner: owner,
      });
    }
  }
  assert.deepEqual(v2.map((row) => row.operation).sort(), expectedOperations.sort());
});

for (const schemaVersion of [1, 2]) await contractCheck(`schema-${schemaVersion} operation closure precedes adapter/concrete calls`, async () => {
  const probe = credentialProbe(schemaVersion);
  try {
    let adapterCalls = 0;
    const adapter = officialPlatform.createAdminV1OfficialAdapter({ authorization: probe.authorization,
      credentials: probe.credentials, execution_context: {}, transport: {
        execute: async () => { adapterCalls += 1; return { status: "UNEXPECTED" }; },
      } });
    const denied = ["create_environment_0", "create_environment_8", "create_environment_01",
      "create_environment_2_extra", "verify_environment_8", "delete_environment_8",
      ...(schemaVersion === 1 ? ["create_environment_3", "verify_environment_3", "delete_environment_3"] : [])];
    for (const operation of denied) {
      await assert.rejects(adapter.invoke(operation, { key: "ADMIN_PASSWORD", value: Buffer.from("synthetic"), record_id: "env-owned" }),
        { code: "OFFICIAL_ADAPTER_OPERATION_DENIED" });
      await assert.rejects(probe.execute(operation, { key: "ADMIN_PASSWORD", value: Buffer.from("synthetic"), record_id: "env-owned" }),
        { code: "OFFICIAL_ADAPTER_OPERATION_DENIED" });
    }
    assert.equal(adapterCalls, 0);
    assert.equal(probe.calls.length, 0);
  } finally { probe.retire(); }
});

for (const schemaVersion of [0, 3, "2", undefined]) await contractCheck("adapter and concrete reject unknown schema before calls", async () => {
  const probe = credentialProbe(1);
  try {
    probe.authorization.schema_version = schemaVersion;
    assert.throws(() => officialPlatform.createAdminV1OfficialAdapter({ authorization: probe.authorization,
      credentials: probe.credentials, execution_context: {}, transport: probe.transport }), { code: "OFFICIAL_ADAPTER_INPUT" });
    await assert.rejects(probe.execute("create_environment_1", { key: "ADMIN_PASSWORD", value: Buffer.from("synthetic") }),
      { code: "OFFICIAL_ADAPTER_INPUT" });
    assert.equal(probe.calls.length, 0);
  } finally { probe.retire(); }
});

for (const schemaVersion of [1, 2]) await contractCheck(`schema-${schemaVersion} rejects ordinal key mismatch and unbounded exact IDs`, async () => {
  const probe = credentialProbe(schemaVersion);
  try {
    const adapter = officialPlatform.createAdminV1OfficialAdapter({ authorization: probe.authorization,
      credentials: probe.credentials, execution_context: {}, transport: probe.transport });
    for (const operation of ["create_environment_1", "verify_environment_1"]) {
      const input = { key: "ADMIN_SESSION_SECRET", value: Buffer.from("synthetic"), record_id: "env-owned" };
      await assert.rejects(adapter.invoke(operation, input), { code: "OFFICIAL_ADAPTER_INPUT" });
      await assert.rejects(probe.execute(operation, input), { code: "OFFICIAL_ADAPTER_INPUT" });
    }
    for (const record_id of [undefined, null, "", "bad\0id", "x".repeat(257)]) {
      for (const operation of ["verify_environment_1", "delete_environment_1"]) {
        await assert.rejects(probe.execute(operation, { record_id, key: "ADMIN_PASSWORD" }), { code: "OFFICIAL_ADAPTER_INPUT" });
      }
    }
    assert.equal(probe.calls.length, 0);
  } finally { probe.retire(); }
});

await contractCheck("all seven v2 create/verify/delete descriptors and exact readback shapes", async () => {
  const probe = credentialProbe();
  try {
    await probe.execute("inspect_environment_contract");
    probe.calls.length = 0;
    const records = new Map();
    probe.respondWith(({ url, method, body }) => {
      assert.equal(url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
      if (method === "POST") {
        assert.equal(url.pathname, `/v10/projects/${probe.authorization.execution.preview_project_id}/env`);
        assert.equal(url.searchParams.get("upsert"), "false");
        const ordinal = expectedPreviewKeys.indexOf(body.key) + 1;
        assert.ok(ordinal >= 1 && ordinal <= 7);
        assert.deepEqual(body, { key: expectedPreviewKeys[ordinal - 1], value: `synthetic-preview-${ordinal}`,
          type: expectedPreviewTypes[ordinal - 1], target: ["preview"], gitBranch: probe.authorization.execution.branch_name });
        const id = `env-owned-${ordinal}`;
        records.set(id, { id, key: body.key, type: expectedPreviewTypes[ordinal - 1], target: ["preview"], gitBranch: body.gitBranch });
        return { http_status: 201, http_body: { id } };
      }
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      assert.equal(url.pathname, `/v9/projects/${probe.authorization.execution.preview_project_id}/env/${id}`);
      assert.ok(records.has(id));
      if (method === "GET") {
        assert.equal(url.searchParams.get("decrypt"), "false");
        return records.get(id);
      }
      assert.equal(method, "DELETE");
      records.delete(id);
      return { http_status: 204, http_body: {} };
    });
    const adapter = officialPlatform.createAdminV1OfficialAdapter({ authorization: probe.authorization,
      credentials: probe.credentials, execution_context: {}, transport: probe.transport });
    for (let ordinal = 1; ordinal <= 7; ordinal += 1) {
      const key = expectedPreviewKeys[ordinal - 1];
      const created = await adapter.invoke(`create_environment_${ordinal}`, { key, value: Buffer.from(`synthetic-preview-${ordinal}`) });
      assert.deepEqual(created, { status: "CREATED_EXACT", record_id: `env-owned-${ordinal}` });
      const verified = await adapter.invoke(`verify_environment_${ordinal}`, { key, record_id: created.record_id });
      assert.deepEqual(verified, { status: "EXACT", record_id: created.record_id, key,
        project_id: probe.authorization.execution.preview_project_id, team_id: probe.authorization.execution.preview_team_id,
        git_branch: probe.authorization.execution.branch_name, unrelated_preserved: true });
    }
    for (let ordinal = 1; ordinal <= 7; ordinal += 1) {
      assert.deepEqual(await adapter.invoke(`delete_environment_${ordinal}`, { record_id: `env-owned-${ordinal}` }),
        { status: "DELETED_EXACT" });
    }
    assert.equal(probe.calls.filter((row) => row.method === "POST").length, 7);
    assert.equal(probe.calls.filter((row) => row.method === "GET").length, 7);
    assert.equal(probe.calls.filter((row) => row.method === "DELETE").length, 7);
    assert.equal(records.size, 0);
  } finally { probe.retire(); }
});

// Exercise the actual descriptor and metadata predicates with independent types.
// No readback contains a value; create values are synthetic and never echoed.
for (const schemaVersion of [1, 2]) {
  for (let index = 0; index < (schemaVersion === 1 ? 2 : 7); index += 1) {
    const key = expectedPreviewKeys[index];
    const type = expectedPreviewTypes[index];
    await contractCheck(`schema-${schemaVersion} ${key} creates ${type}`, async () => {
      const probe = credentialProbe(schemaVersion);
      try {
        probe.respondWith(() => ({ id: "env-type-probe" }));
        await probe.execute(`create_environment_${index + 1}`, { key, value: Buffer.from("synthetic-type-probe") });
        assert.equal(probe.calls.length, 1);
        assert.equal(probe.calls[0].body.type, type);
      } finally { probe.retire(); }
    });
    await contractCheck(`schema-${schemaVersion} ${key} immediate and later metadata reject wrong types`, async () => {
      const probe = credentialProbe(schemaVersion);
      try {
        await probe.execute("inspect_environment_contract");
        const record = { id: "env-type-probe", key, type, target: ["preview"],
          gitBranch: probe.authorization.execution.branch_name };
        probe.respondWith(() => ({ id: record.id }));
        const created = await probe.execute(`create_environment_${index + 1}`, { key, value: Buffer.from("synthetic-type-probe") });
        const input = { key, record_id: created.record_id };
        for (const stage of ["immediate", "later"]) {
          for (const wrongType of [type === "sensitive" ? "encrypted" : "sensitive", "plain", undefined, null, "secret"]) {
            probe.respondWith(() => ({ ...record, type: wrongType }));
            await assert.rejects(probe.execute(`verify_environment_${index + 1}`, input),
              { code: "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" }, stage);
          }
          probe.respondWith(() => record);
          const verified = await probe.execute(`verify_environment_${index + 1}`, input);
          assert.equal(verified.status, "EXACT");
          assert.equal(Object.hasOwn(verified, "value"), false);
        }
        for (const call of probe.calls.filter((call) => call.url.pathname.endsWith(`/env/${record.id}`))) {
          assert.equal(call.method, "GET");
          assert.equal(call.url.searchParams.get("decrypt"), "false");
        }
      } finally { probe.retire(); }
    });
  }
}

for (let index = 0; index < 7; index += 1) {
  await contractCheck(`${expectedPreviewKeys[index]} cleanup residue admission rejects wrong type without plaintext`, async () => {
    const probe = credentialProbe(2, { spawn_sync: (_file, args) => {
      assert.ok(args.includes("ls-remote"));
      return { status: 0, stdout: "", stderr: "" };
    } });
    try {
      const record = { id: "env-cleanup-type", key: expectedPreviewKeys[index], type: expectedPreviewTypes[index],
        target: ["preview"], gitBranch: probe.authorization.execution.branch_name };
      for (const direct of [true, false]) {
        for (const wrong of [true, false]) {
          probe.respondWith(({ url }) => {
            if (url.pathname === "/v6/deployments") return { deployments: [], pagination: { count: 0, next: null } };
            assert.equal(url.searchParams.get("decrypt"), "false");
            const observed = { ...record, type: wrong ? (record.type === "sensitive" ? "encrypted" : "sensitive") : record.type };
            return direct ? observed : { envs: [observed] };
          });
          await assert.rejects(probe.execute("verify_zero_external_residual", {
            remote_ref: null, local_state_id: null, deployment_id: null, environment_record_ids: direct ? [record.id] : [],
          }), { code: wrong ? "OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS" : "OFFICIAL_EXTERNAL_RESIDUAL_PRESENT" });
        }
      }
    } finally { probe.retire(); }
  });
}

for (const schemaVersion of [1, 2]) await contractCheck(`schema-${schemaVersion} environment readback rejects wrong exact identity`, async () => {
  const probe = credentialProbe(schemaVersion);
  try {
    await probe.execute("inspect_environment_contract");
    const exact = { id: "env-owned-1", key: "ADMIN_PASSWORD", type: "sensitive", target: ["preview"],
      gitBranch: probe.authorization.execution.branch_name,
      projectId: probe.authorization.execution.preview_project_id, teamId: probe.authorization.execution.preview_team_id };
    for (const [field, value] of [["id", "env-unrelated"], ["key", "ADMIN_SESSION_SECRET"], ["type", "plain"],
      ["target", ["production"]], ["gitBranch", "unrelated"], ["projectId", "prj_unrelated"], ["teamId", "team_unrelated"]]) {
      probe.respondWith(() => ({ ...exact, [field]: value }));
      await assert.rejects(probe.execute("verify_environment_1", { key: "ADMIN_PASSWORD", record_id: "env-owned-1" }),
        { code: "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" });
    }
    if (schemaVersion === 1) {
      probe.respondWith(() => exact);
      assert.deepEqual(await probe.execute("verify_environment_1", { key: "ADMIN_PASSWORD", record_id: "env-owned-1" }),
        { status: "EXACT", record_id: "env-owned-1" });
    }
  } finally { probe.retire(); }
});

await contractCheck("v2 metadata omissions require proven project/team preflight", async () => {
  const probe = credentialProbe();
  try {
    probe.respondWith(() => ({ id: "env-owned-1", key: "ADMIN_PASSWORD", type: "sensitive", target: ["preview"],
      gitBranch: probe.authorization.execution.branch_name }));
    await assert.rejects(probe.execute("verify_environment_1", { key: "ADMIN_PASSWORD", record_id: "env-owned-1" }),
      { code: "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" });
  } finally { probe.retire(); }
});

for (const schemaVersion of [1, 2]) await contractCheck(`schema-${schemaVersion} exact Preview identity result and input binding`, async () => {
  const probe = credentialProbe(schemaVersion);
  try {
    const deployment = { id: "dpl_owned", uid: "dpl_owned", url: "aifinder-owned-preview.vercel.app",
      production: false, target: null, readyState: "READY", createdAt: now,
      projectId: probe.authorization.execution.preview_project_id, name: "aifinder",
      ownerId: probe.authorization.execution.preview_team_id,
      gitSource: { type: "github", sha: probe.authorization.execution.temporary_commit_sha,
        ref: probe.authorization.execution.branch_name, repo: "jcdumaua/aifinder" } };
    probe.respondWith(({ url }) => url.pathname === "/v6/deployments"
      ? { deployments: [deployment], pagination: { count: 1, next: null } } : deployment);
    assert.deepEqual(await probe.execute("acquire_automatic_preview"), { status: "ACQUIRED_EXACT", deployment_id: "dpl_owned" });
    const before = probe.calls.length;
    if (schemaVersion === 2) {
      for (const deployment_id of [undefined, "dpl_unrelated", "x".repeat(257)]) {
        await assert.rejects(probe.execute("verify_preview_identity", { deployment_id }), { code: "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN" });
      }
      assert.equal(probe.calls.length, before);
    }
    assert.deepEqual(await probe.execute("verify_preview_identity", schemaVersion === 2 ? { deployment_id: "dpl_owned" } : {}),
      { status: "EXACT", deployment_id: "dpl_owned", ...(schemaVersion === 2 ? { unrelated_preserved: true,
        isolation_identity: { projectId: probe.authorization.execution.preview_project_id,
          teamId: probe.authorization.execution.preview_team_id, target: "preview",
          sourceCommit: probe.authorization.execution.temporary_commit_sha,
          sourceBranch: probe.authorization.execution.branch_name,
          repository: probe.authorization.repository.remote_repository, sourceIdentityVerified: true } } : {}) });
    assert.equal(probe.calls.at(-1).url.pathname, "/v13/deployments/dpl_owned");
    assert.equal(probe.calls.at(-1).url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
  } finally { probe.retire(); }
});

for (const [schemaVersion, count, admitted] of [[1, 2, true], [1, 3, false], [2, 7, true], [2, 8, false]]) {
  await contractCheck(`schema-${schemaVersion} zero-external-residual exact ID limit ${count}`, async () => {
    let gitCalls = 0;
    const probe = credentialProbe(schemaVersion, { spawn_sync: () => {
      gitCalls += 1;return { status: 0, stdout: "", stderr: "" };
    } });
    try {
      const ids = Array.from({ length: count }, (_, index) => `env-owned-${index + 1}`);
      probe.respondWith(({ url, method }) => {
        assert.equal(method, "GET");
        assert.equal(url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
        if (url.pathname === "/v6/deployments") return { deployments: [], pagination: { count: 0, next: null } };
        if (url.pathname === `/v10/projects/${probe.authorization.execution.preview_project_id}/env`) {
          return { envs: [], pagination: { count: 0, next: null } };
        }
        const id = decodeURIComponent(url.pathname.split("/").at(-1));
        assert.ok(ids.includes(id));
        assert.equal(url.pathname, `/v9/projects/${probe.authorization.execution.preview_project_id}/env/${id}`);
        return { http_status: 404, http_body: { code: "not_found" } };
      });
      const result = probe.execute("verify_zero_external_residual", { remote_ref: null, deployment_id: null,
        environment_record_ids: ids, local_state_id: null });
      if (admitted) {
        assert.deepEqual(await result, { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true });
        assert.equal(gitCalls, 1);
        assert.equal(probe.calls.length, count + 2);
        assert.deepEqual(probe.calls.filter(({ url }) => url.pathname.startsWith("/v9/")).map(({ url }) =>
          decodeURIComponent(url.pathname.split("/").at(-1))), ids);
      } else {
        await assert.rejects(result, { code: "OFFICIAL_EXTERNAL_OBSERVATION_AMBIGUOUS" });
        assert.equal(gitCalls, 0);assert.equal(probe.calls.length, 0);
      }
    } finally { probe.retire(); }
  });
}

function committedRecoveryRecord(authorization, lifecycle = "RETENTION_PENDING") {
  const ids = Array.from({ length: 7 }, (_, index) => `env-owned-${index + 1}`);
  return { retired: false, value: { schema_version: 1,
    identity: { authorization_id_sha256: authorization.authorization_id_sha256, run_id: authorization.run_id },
    sequence: 1, state: { lifecycle, stage: "RETENTION_FINAL_VERIFICATION", token_spent: true,
      runtime_sessions: 1, last_completed_qualification_ordinal: 6, last_completed_official_ordinal: 20,
      owned: { deployment_id: "dpl_owned", environment_record_ids: [...ids] }, zero_residual: false,
      cleanup: ["RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"],
      retention: { policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1", phase: "COMMITTED",
        deployment_id: "dpl_owned", environment_record_ids: [...ids], environment_keys: [...expectedPreviewKeys],
        data_zero_residual: true, external_retained_exact: false, unrelated_preserved: false } } } };
}

function retainedDeployment(authorization) {
  return { id: "dpl_owned", uid: "dpl_owned", url: "aifinder-owned-preview.vercel.app",
    production: false, target: null, readyState: "READY", createdAt: now,
    projectId: authorization.execution.preview_project_id, name: "aifinder", ownerId: authorization.execution.preview_team_id,
    gitSource: { type: "github", sha: authorization.execution.temporary_commit_sha,
      ref: authorization.execution.branch_name, repo: "jcdumaua/aifinder" } };
}

for (const lifecycle of ["RETENTION_PENDING", "RECOVERY_PENDING"]) {
  await contractCheck(`fresh active ${lifecycle} recovery verifies exact Preview and seven IDs without inventories`, async () => {
    let record;
    const probe = credentialProbe(2, { journal: { load: () => structuredClone(record) } });
    try {
      record = committedRecoveryRecord(probe.authorization, lifecycle);
      const deployment = retainedDeployment(probe.authorization);
      let wrongType = false;
      probe.respondWith(({ url, method }) => {
        assert.equal(method, "GET");
        assert.equal(url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
        if (url.pathname === "/v13/deployments/dpl_owned") {
          assert.equal(url.searchParams.get("withGitRepoInfo"), "true");return deployment;
        }
        const id = decodeURIComponent(url.pathname.split("/").at(-1));
        const ordinal = record.value.state.retention.environment_record_ids.indexOf(id);
        assert.ok(ordinal >= 0);
        assert.equal(url.pathname, `/v9/projects/${probe.authorization.execution.preview_project_id}/env/${id}`);
        assert.equal(url.searchParams.get("decrypt"), "false");
        const type = expectedPreviewTypes[ordinal];
        return { id, key: expectedPreviewKeys[ordinal], type: wrongType ? (type === "sensitive" ? "encrypted" : "sensitive") : type, target: ["preview"],
          gitBranch: probe.authorization.execution.branch_name,
          projectId: probe.authorization.execution.preview_project_id, teamId: probe.authorization.execution.preview_team_id };
      });
      assert.deepEqual(await probe.execute("verify_preview_identity", { deployment_id: "dpl_owned" }),
        { status: "EXACT", deployment_id: "dpl_owned", unrelated_preserved: true });
      for (let ordinal = 1; ordinal <= 7; ordinal += 1) {
        const record_id = `env-owned-${ordinal}`;
        const key = expectedPreviewKeys[ordinal - 1];
        wrongType = true;
        await assert.rejects(probe.execute(`verify_environment_${ordinal}`, { key, record_id }),
          { code: "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" });
        wrongType = false;
        assert.deepEqual(await probe.execute(`verify_environment_${ordinal}`, { key, record_id }), {
          status: "EXACT", record_id, key, project_id: probe.authorization.execution.preview_project_id,
          team_id: probe.authorization.execution.preview_team_id, git_branch: probe.authorization.execution.branch_name,
          unrelated_preserved: true,
        });
      }
      assert.equal(probe.calls.length, 15);
      const before = probe.calls.length;
      for (const operation of ["acquire_automatic_preview", "inspect_prior_residue", "create_environment_1",
        "delete_environment_1", "delete_preview", "generate_oidc", "protected_access_handshake",
        "retire_protected_access", "application_request", "verify_zero_data_residual", "verify_zero_external_residual"]) {
        await assert.rejects(probe.execute(operation, { deployment_id: "dpl_owned", record_id: "env-owned-1",
          key: "ADMIN_PASSWORD", value: Buffer.from("synthetic") }), { code: "OFFICIAL_ADAPTER_OPERATION_DENIED" });
      }
      await assert.rejects(probe.execute("verify_environment_1", { key: "ADMIN_PASSWORD", record_id: "env-unrelated" }),
        { code: "OFFICIAL_ADAPTER_INPUT" });
      assert.equal(probe.calls.length, before);
    } finally { probe.retire(); }
  });
}

await contractCheck("retired journal denies all subsequent recovery reads before calls", async () => {
  let record;
  let gitCalls = 0;
  const probe = credentialProbe(2, { journal: { load: () => structuredClone(record) },
    spawn_sync: () => { gitCalls += 1;return { status: 0, stdout: "", stderr: "" }; } });
  try {
    record = committedRecoveryRecord(probe.authorization);
    probe.respondWith(() => retainedDeployment(probe.authorization));
    await probe.execute("verify_preview_identity", { deployment_id: "dpl_owned" });
    record.retired = true;
    for (const operation of ["inspect_remote_ref", "inspect_environment_contract", "verify_preview_identity", "verify_environment_1"]) {
      await assert.rejects(probe.execute(operation, { deployment_id: "dpl_owned", record_id: "env-owned-1", key: "ADMIN_PASSWORD" }),
        { code: "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN" });
    }
    assert.equal(gitCalls, 0);assert.equal(probe.calls.length, 1);
  } finally { probe.retire(); }
});

for (const [name, change, inputId = "dpl_owned"] of [
  ["missing journal record", () => null],
  ["retired record", (record) => { record.retired = true;return record; }],
  ["state retired", (record) => { record.value.state.retired = true;return record; }],
  ["wrong run", (record) => { record.value.identity.run_id = "55555555-5555-4555-8555-555555555555";return record; }],
  ["wrong authorization", (record) => { record.value.identity.authorization_id_sha256 = "2".repeat(64);return record; }],
  ["extra identity field", (record) => { record.value.identity.extra = true;return record; }],
  ["wrong input ID", (record) => record, "dpl_unrelated"],
  ["missing input ID", (record) => record, null],
  ["wrong owned ID", (record) => { record.value.state.owned.deployment_id = "dpl_other";return record; }],
  ["duplicate environments", (record) => { record.value.state.retention.environment_record_ids[6] = "env-owned-1";return record; }],
  ["wrong keys", (record) => { record.value.state.retention.environment_keys.reverse();return record; }],
  ["uncommitted phase", (record) => { record.value.state.retention.phase = "ARMED";return record; }],
  ["false data cleanup", (record) => { record.value.state.retention.data_zero_residual = false;return record; }],
  ["missing ephemeral cleanup", (record) => { record.value.state.cleanup.pop();return record; }],
]) await contractCheck(`fresh recovery rejects ${name} before provider calls`, async () => {
  let record;
  const probe = credentialProbe(2, { journal: { load: () => structuredClone(record) } });
  try {
    record = change(committedRecoveryRecord(probe.authorization));
    await assert.rejects(probe.execute("verify_preview_identity", { deployment_id: inputId }),
      { code: "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN" });
    assert.equal(probe.calls.length, 0);
  } finally { probe.retire(); }
});

for (const [name, change] of [
  ["wrong source commit", (body) => { body.gitSource.sha = "e".repeat(40); }],
  ["wrong project", (body) => { body.projectId = "prj_unrelated"; }],
  ["wrong team", (body) => { body.ownerId = "team_unrelated"; }],
  ["outside lifetime", (body) => { body.createdAt = now - 7_200_000; }],
  ["wrong hostname", (body) => { body.url = "unrelated.example"; }],
  ["wrong deployment ID", (body) => { body.id = "dpl_other";body.uid = "dpl_other"; }],
]) await contractCheck(`fresh recovery rejects provider ${name} without other effects`, async () => {
  let record;
  const probe = credentialProbe(2, { journal: { load: () => structuredClone(record) } });
  try {
    record = committedRecoveryRecord(probe.authorization);
    const body = retainedDeployment(probe.authorization);change(body);
    probe.respondWith(({ url, method }) => {
      assert.equal(method, "GET");assert.equal(url.pathname, "/v13/deployments/dpl_owned");return body;
    });
    await assert.rejects(probe.execute("verify_preview_identity", { deployment_id: "dpl_owned" }),
      { code: "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN" });
    assert.equal(probe.calls.length, 1);
  } finally { probe.retire(); }
});


function recoveryDocument(auth) {
  const ids = Array.from({ length: 7 }, (_, index) => `env-retained-${index + 1}`);
  return { schema_version: 1, identity: { authorization_id_sha256: auth.authorization_id_sha256, run_id: auth.run_id }, sequence: 4,
    state: { lifecycle: "RETENTION_PENDING", stage: "RETENTION_FINAL_VERIFICATION", token_spent: true,
      runtime_sessions: 1, runtime_retries: 0, runtime_replays: 0,
      recovery_usage: Object.fromEntries(Object.keys(ADMIN_V1_OFFICIAL_BUDGET_LIMITS_V2).map(key => [key, 0])),
      last_attempted_qualification_ordinal: 6, last_completed_qualification_ordinal: 6,
      last_attempted_official_ordinal: 20, last_completed_official_ordinal: 20,
      owned: { local_temp_state: "local-historical-owned", remote_ref: `refs/heads/${auth.execution.branch_name}`, environment_record_ids: [...ids], deployment_id: "dpl_RetainedV2",
        submissions: [{ row_id: "submission-owned", version: "v1" }], tools: [{ row_id: "tool-owned", version: "v1" }],
        audit_rows: [{ row_id: "audit-owned", version: "v1" }], logo: { object_id: "logo-owned", version: "v1" } },
      effects: { submitted_tools: 3, tools: 2, audits: 9, approval_rpc: 1, logo_objects: 1, grant_prepare: 1, grant_revoke: 1 },
      evidence: [], failure: null, cleanup: ["DELETE_STORAGE_EXACT_VERSION", "REVOKE_STORAGE_CLEANUP_GRANT", "RETIRE_PROTECTED_ACCESS", "DELETE_REMOTE_REF", "CLEANUP_LOCAL_OWNED_TEMP_STATE"], zero_residual: false,
      retention: { policy: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1", phase: "COMMITTED", deployment_id: "dpl_RetainedV2",
        environment_record_ids: [...ids], environment_keys: [...auth.execution.environment_keys], data_zero_residual: true,
        external_retained_exact: false, unrelated_preserved: false } } };
}

function recoveryContext(journal, document) {
  return { journal, retention_recovery: { mode: "OFFICIAL_RETENTION_RECOVERY_V1",
    journal_sha256: sha256Hex(`${canonicalJson(document)}\n`) } };
}

await contractCheck("concrete committed audit cleanup reconciles partial deletion and lost receipt idempotently", async () => {
  const auth = completeFixture(2).authorization;
  const document = recoveryDocument(auth);document.state.retention.data_zero_residual = false;
  const journal = { load: () => ({ retired: false, value: structuredClone(document) }) };
  let remaining = [{ id: "audit-owned", created_at: "v1" }];
  for (const expectedDeletes of [1, 0]) {
    const probe = credentialProbe(2, recoveryContext(journal, document));
    try {
      await probe.execute("inspect_environment_contract");
      probe.respondWith(({ method }) => {
        if (method === "DELETE") { remaining = [];return { http_status: 200, http_body: [] }; }
        return { http_body: structuredClone(remaining) };
      });
      assert.deepEqual(await probe.execute("delete_owned_audits", { rows: document.state.owned.audit_rows }), { status: "DELETED_EXACT" });
      assert.equal(probe.calls.filter((call) => call.method === "DELETE").length, expectedDeletes);
    } finally { probe.retire(); }
  }
  const probe = credentialProbe(2, recoveryContext(journal, document));
  try {
    await probe.execute("inspect_environment_contract");
    probe.respondWith(() => ({ http_body: [{ id: "audit-owned", created_at: "replacement" }] }));
    await assert.rejects(probe.execute("delete_owned_audits", { rows: document.state.owned.audit_rows }));
    assert.equal(probe.calls.some((call) => call.method === "DELETE"), false);
  } finally { probe.retire(); }
});

await contractCheck("concrete recovery resumes an incomplete owned-row cleanup without replay", async () => {
  const auth = completeFixture(2).authorization;
  let current = { retired: false, value: recoveryDocument(auth) };
  current.value.state.retention.data_zero_residual = false;
  current.value.state.cleanup.unshift("DELETE_SUBMITTED_FIXTURE_1", "DELETE_OWNED_TOOL_1");
  const calls = [];
  const journal = {
    load: () => structuredClone(current),
    publish(state) { current.value.sequence += 1;current.value.state = structuredClone(state); },
    retire(state) { current.value.sequence += 1;current.value.state = { ...structuredClone(state), retired: true };current.retired = true; },
  };
  const transport = { async execute({ operation, input }) {
    calls.push(operation);
    if (operation === "delete_owned_audits") return { status: "DELETED_EXACT" };
    if (operation === "verify_zero_data_residual") return { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true };
    if (operation === "inspect_remote_ref") return { status: "ABSENT" };
    if (operation === "inspect_environment_contract") return { status: "EXACT", names: [...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
    if (operation === "verify_preview_identity") return { status: "EXACT", deployment_id: input.deployment_id, unrelated_preserved: true };
    if (operation.startsWith("verify_environment_")) return { status: "EXACT", ...input, project_id: auth.execution.preview_project_id,
      team_id: auth.execution.preview_team_id, git_branch: auth.execution.branch_name, unrelated_preserved: true };
    assert.fail(`unexpected recovery operation ${operation}`);
  } };
  const result = await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: auth,
    credentials: {}, execution_context: recoveryContext(journal, current.value), transport,
    now_epoch_ms: now, live_now_epoch_ms: () => now });
  assert.equal(result.classification, "RETENTION_COMPLETE");
  assert.deepEqual(calls.slice(0, 4), ["inspect_environment_contract", "delete_owned_audits", "verify_zero_data_residual", "inspect_remote_ref"]);
  assert.equal(current.retired, true);
  assert.equal(result.runtime_sessions, 1);
});

await contractCheck("concrete cleanup counts reconciliation requests against the unchanged signed budget", async () => {
  const auth = completeFixture(2).authorization;
  const doc = recoveryDocument(auth);doc.state.retention.data_zero_residual = false;
  doc.state.owned.submissions = [1, 2, 3].map((id) => ({ row_id: `submission-${id}`, version: "v1" }));
  doc.state.owned.tools = [1, 2].map((id) => ({ row_id: `tool-${id}`, version: "v1" }));
  const journal = { load: () => ({ retired: false, value: structuredClone(doc) }) };
  const probe = credentialProbe(2, recoveryContext(journal, doc));
  let currentRows = [], requests = 0, versionKey = "created_at";
  try {
    await probe.execute("inspect_environment_contract");
    probe.respondWith(({ method }) => {
      requests += 1;
      if (method === "DELETE") currentRows = [];
      return { http_body: currentRows.map((row) => ({ id: row.row_id, [versionKey]: row.version })) };
    });
    const operations = [["delete_owned_audits", { rows: doc.state.owned.audit_rows }, doc.state.owned.audit_rows],
      ...doc.state.owned.submissions.map((row, index) => [`delete_submitted_fixture_${index + 1}`, { row_id: row.row_id, expected_version: row.version }, [row]]),
      ...doc.state.owned.tools.map((row, index) => [`delete_owned_tool_${index + 1}`, { row_id: row.row_id, expected_version: row.version }, [row]])];
    for (const [index, [operation, input, rows]] of operations.entries()) {
      currentRows = structuredClone(rows);versionKey = index === 0 ? "created_at" : "updated_at";
      if (index < 4) assert.equal((await probe.execute(operation, input)).status, "DELETED_EXACT");
      else await assert.rejects(probe.execute(operation, input), { code: "OFFICIAL_BUDGET_EXHAUSTED" });
    }
    assert.equal(requests, 14);
  } finally { probe.retire(); }
});

for (const lifecycle of ["RETENTION_PENDING", "RECOVERY_PENDING"]) {
  await contractCheck(`production recovery wrapper finalizes ${lifecycle} with metadata-free records after exact project preflight`, async () => {
    const fixture = completeFixture(2);const doc = recoveryDocument(fixture.authorization);doc.state.lifecycle = lifecycle;
    let current = { retired: false, value: doc }, publishes = 0, retirements = 0, gitCalls = 0;
    const journal = { load: () => structuredClone(current),
      publish(state) { publishes++;current = { retired: false, value: { ...current.value, sequence: current.value.sequence + 1, state: structuredClone(state) } }; },
      retire(state) { retirements++;current = { retired: true, value: { ...current.value, sequence: current.value.sequence + 1, state: { ...structuredClone(state), retired: true } } }; } };
    const probe = credentialProbe(2, { journal, spawn_sync(executable, argv) {
      gitCalls++;assert.equal(argv.includes("ls-remote"), true);assert.equal(argv.includes("push"), false);
      return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    } });
    const deployment = retainedDeployment(probe.authorization);deployment.id = deployment.uid = "dpl_RetainedV2";
    probe.respondWith(({ url, method }) => {
      assert.equal(method, "GET");assert.equal(url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
      if (url.pathname === "/v13/deployments/dpl_RetainedV2") return deployment;
      if (url.pathname === `/v9/projects/${probe.authorization.execution.preview_project_id}`) return {
        id: probe.authorization.execution.preview_project_id, name: probe.authorization.execution.preview_project_name,
        accountId: probe.authorization.execution.preview_team_id,
      };
      const id = decodeURIComponent(url.pathname.split("/").at(-1));const index = doc.state.retention.environment_record_ids.indexOf(id);
      assert(index >= 0);assert.equal(url.searchParams.get("decrypt"), "false");
      return { id, key: expectedPreviewKeys[index], type: expectedPreviewTypes[index], target: ["preview"], gitBranch: probe.authorization.execution.branch_name };
    });
    const input = { authorization: probe.authorization, credentials: probe.credentials, execution_context: recoveryContext(journal, doc),
      transport: probe.transport, now_epoch_ms: now, live_now_epoch_ms: () => now };
    const restricted = officialPlatform.createAdminV1OfficialRecoveryAdapter(input);
    for (const operation of ["application_request", "create_remote_ref", "create_environment_1", "delete_environment_7",
      "delete_preview", "retire_protected_access", "generate_oidc", "inspect_prior_residue", "cleanup_local_owned_temp_state"])
      await assert.rejects(restricted.invoke(operation), { code: "OFFICIAL_ADAPTER_OPERATION_DENIED" });
    assert.equal(probe.calls.length, 0);assert.equal(gitCalls, 0);
    const result = await officialPlatform.recoverConcreteAdminV1OfficialRetention(input);
    assert.equal(result.classification, "RETENTION_COMPLETE");assert.equal(result.qualification_requests, 6);assert.equal(result.official_requests, 20);
    assert.equal(result.runtime_sessions, 1);assert.equal(result.runtime_replays, 0);assert.equal(result.zero_residual_owned_state, false);
    assert.equal(publishes, 11);assert.equal(retirements, 1);assert.equal(current.retired, true);
    assert.equal(probe.calls.length, 9);assert.equal(gitCalls, 1);
    assert.deepEqual(probe.calls.map(({ url }) => url.pathname), [
      "/v13/deployments/dpl_RetainedV2", `/v9/projects/${probe.authorization.execution.preview_project_id}`,
      ...doc.state.retention.environment_record_ids.map((id) => `/v9/projects/${probe.authorization.execution.preview_project_id}/env/${id}`),
    ]);
    assert(Object.values(probe.credentials).every((value) => value.every((byte) => byte === 0)));
    await assert.rejects(officialPlatform.recoverConcreteAdminV1OfficialRetention(input), { code: "OFFICIAL_AUTHORIZATION_SPENT" });
    assert.equal(probe.calls.length, 9);assert.equal(gitCalls, 1);probe.retire();
  });
}
await contractCheck("recovery wrapper clears credentials and leaves durable pending after unproven concrete read", async () => {
  const fixture = completeFixture(2);let current = { retired: false, value: recoveryDocument(fixture.authorization) };let retired = 0;
  const journal = { load: () => structuredClone(current), publish(state) { current.value.state = structuredClone(state);current.value.sequence++; }, retire() { retired++; } };
  const probe = credentialProbe(2, { journal, spawn_sync: () => ({status:0,signal:null,stdout:Buffer.alloc(0),stderr:Buffer.alloc(0)}) });
  probe.respondWith(() => ({http_status:503,http_body:{}}));
  const output = await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization:probe.authorization,credentials:probe.credentials,
    execution_context:recoveryContext(journal,current.value),transport:probe.transport,now_epoch_ms:now,live_now_epoch_ms:()=>now });
  assert.equal(output.classification,"RECOVERY_PENDING");assert.equal(current.value.state.retention.phase,"COMMITTED");assert.equal(retired,0);
  assert(Object.values(probe.credentials).every((value)=>value.every((byte)=>byte===0)));probe.retire();
});
console.log("PASS_RETENTION_RECOVERY_CONCRETE pending_routes=2 real_adapter_reads=10 mutation_attempts_denied=9 durable_terminal=true real_effects=0");


for (const failure of ["FINAL_READ_DRIFT", "PUBLISH_THROW", "RETIRE_THROW", "PUBLISH_READBACK_THROW"]) {
  await contractCheck(`recovery fails closed and clears credentials after ${failure}`, async () => {
    const auth = completeFixture(2).authorization;let current = { retired: false, value: recoveryDocument(auth) };
    let publishes = 0, retires = 0, reads = 0, changed = false, poisonReadback = false, replacement;
    const credentials = { github_token:Buffer.from("synthetic-github"),vercel_token:Buffer.from("synthetic-vercel") };
    const journal = {
      load() { if (poisonReadback) throw new Error("synthetic readback unavailable");return structuredClone(current); },
      publish(state) { publishes++;assert.equal(changed,false);
        if (failure === "PUBLISH_THROW") throw new Error("synthetic publish unavailable");
        current.value.state = structuredClone(state);current.value.sequence++;
        if (failure === "PUBLISH_READBACK_THROW") poisonReadback = true;
      },
      retire(state) { retires++;if (failure === "RETIRE_THROW") throw new Error("synthetic retire unavailable");
        current.retired = true;current.value.sequence++;current.value.state = { ...structuredClone(state), retired:true }; },
    };
    const transport = { async execute({operation,input}) {
      reads++;
      if (failure === "FINAL_READ_DRIFT" && operation === "verify_environment_7") {
        current.value.sequence++;current.value.state.retention.environment_record_ids[6] = "env-replacement";
        current.value.state.owned.environment_record_ids[6] = "env-replacement";replacement=structuredClone(current);changed=true;
      }
      if (operation === "inspect_remote_ref") return {status:"ABSENT"};
      if (operation === "verify_preview_identity") return {status:"EXACT",deployment_id:input.deployment_id,unrelated_preserved:true};
      if (operation === "inspect_environment_contract") return {status:"EXACT",names:[...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES]};
      return {status:"EXACT",...input,project_id:auth.execution.preview_project_id,team_id:auth.execution.preview_team_id,
        git_branch:auth.execution.branch_name,unrelated_preserved:true};
    } };
    const input = {authorization:auth,credentials,execution_context:recoveryContext(journal,current.value),transport,now_epoch_ms:now,live_now_epoch_ms:()=>now};
    if (failure === "RETIRE_THROW" || failure === "PUBLISH_THROW") {
      assert.equal((await officialPlatform.recoverConcreteAdminV1OfficialRetention(input)).classification,"RECOVERY_PENDING");
      assert.equal(current.retired,false);assert.equal(current.value.state.retention.phase,"COMMITTED");
    } else await assert.rejects(officialPlatform.recoverConcreteAdminV1OfficialRetention(input));
    assert.equal(reads, failure.startsWith("PUBLISH") ? 0 : 10);assert(Object.values(credentials).every((value)=>value.every((byte)=>byte===0)));
    if (failure === "FINAL_READ_DRIFT") { assert.deepEqual(current,replacement);assert.equal(publishes,10);assert.equal(retires,0); }
    if (failure === "PUBLISH_READBACK_THROW") { assert.equal(publishes,1);assert.equal(retires,0); }
  });
}
await contractCheck("restricted recovery adapter refuses substituted input IDs and unrelated readback", async () => {
  const auth = completeFixture(2).authorization;const original = {retired:false,value:recoveryDocument(auth)};let calls=0;
  const credentials={github_token:Buffer.from("synthetic"),vercel_token:Buffer.from("synthetic")};
  const journal={load:()=>structuredClone(original),publish(){},retire(){}};
  const transport={async execute({operation,input}){calls++;
    if(operation==="inspect_remote_ref")return {status:"ABSENT"};
    if(operation==="inspect_environment_contract")return {status:"EXACT",names:[...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES]};
    return {status:"EXACT",deployment_id:input.deployment_id,unrelated_preserved:false};}};
  const adapter=officialPlatform.createAdminV1OfficialRecoveryAdapter({authorization:auth,credentials,execution_context:recoveryContext(journal,original.value),transport});
  const invokeReserved = async (operation, input = {}) => {
    for (const [key, cost] of Object.entries(officialRuntime.ADMIN_V1_OFFICIAL_ACTION_COSTS_V2[operation])) original.value.state.recovery_usage[key] += cost;
    original.value.sequence++;
    return adapter.invoke(operation, input);
  };
  assert.deepEqual(await invokeReserved("inspect_remote_ref"),{status:"ABSENT"});
  await assert.rejects(invokeReserved("verify_preview_identity",{deployment_id:"dpl_other"}),{code:"OFFICIAL_ADAPTER_INPUT"});
  assert.equal(calls,1);
  const denied=await officialPlatform.recoverConcreteAdminV1OfficialRetention({authorization:auth,credentials,execution_context:{
    retention_recovery:recoveryContext(journal,original.value).retention_recovery,
    journal:{load:()=>structuredClone(original),publish(state){original.value.state=structuredClone(state);original.value.sequence++;},retire(){assert.fail("unproven readback cannot retire");}}
  },transport,now_epoch_ms:now,live_now_epoch_ms:()=>now});
  assert.equal(denied.classification,"RECOVERY_PENDING");
  assert(Object.values(credentials).every((value)=>value.every((byte)=>byte===0)));
});
console.log("PASS_RETENTION_RECOVERY_RACES final_await_drift_preserved=true completion_failures_denied=3 unrelated_readback_denied=true");


for (const markerKind of ["MISSING", "NULL", "WRONG_MODE", "WRONG_HASH", "EXTRA_KEY", "INVALID_HASH"]) {
  await contractCheck(`recovery wrapper rejects ${markerKind} admission marker before transport`, async () => {
    const auth = completeFixture(2).authorization;const original = { retired:false, value:recoveryDocument(auth) };
    let calls=0,publishes=0,retires=0;
    const journal={load:()=>structuredClone(original),publish(){publishes++;},retire(){retires++;}};
    const context=recoveryContext(journal,original.value);
    if(markerKind==="MISSING")delete context.retention_recovery;
    if(markerKind==="NULL")context.retention_recovery=null;
    if(markerKind==="WRONG_MODE")context.retention_recovery.mode="OTHER";
    if(markerKind==="WRONG_HASH")context.retention_recovery.journal_sha256="f".repeat(64);
    if(markerKind==="EXTRA_KEY")context.retention_recovery.extra=true;
    if(markerKind==="INVALID_HASH")context.retention_recovery.journal_sha256="invalid";
    const credentials={github_token:Buffer.from("synthetic-github"),vercel_token:Buffer.from("synthetic-vercel")};
    await assert.rejects(officialPlatform.recoverConcreteAdminV1OfficialRetention({authorization:auth,credentials,
      execution_context:context,transport:{async execute(){calls++;assert.fail("denied marker cannot call transport");}},now_epoch_ms:now}),
      {code:"OFFICIAL_RECOVERY_STATE_INVALID"});
    assert.deepEqual({calls,publishes,retires},{calls:0,publishes:0,retires:0});
    assert(Object.values(credentials).every(value=>value.every(byte=>byte===0)));
    assert.deepEqual(journal.load(),original);
  });
}
for (const replacementAt of ["WRAPPER_ENTRY", "ADAPTER_ENTRY"]) {
  await contractCheck(`valid same-authorization replacement at ${replacementAt} cannot re-baseline admitted IDs`, async () => {
    const auth=completeFixture(2).authorization;const original={retired:false,value:recoveryDocument(auth)};
    const replacement=structuredClone(original);replacement.value.sequence++;
    replacement.value.state.retention.deployment_id=replacement.value.state.owned.deployment_id="dpl_SubstitutedV2";
    officialRuntime.validateAdminV1OfficialRetentionRecoveryRecord(replacement,auth);
    let loads=0,calls=0,publishes=0,retires=0;
    const journal={load(){loads++;return structuredClone(replacementAt==="ADAPTER_ENTRY"&&loads===1?original:replacement);},
      publish(){publishes++;},retire(){retires++;}};
    const context=recoveryContext(journal,original.value);
    const credentials={github_token:Buffer.from("synthetic-github"),vercel_token:Buffer.from("synthetic-vercel")};
    await assert.rejects(officialPlatform.recoverConcreteAdminV1OfficialRetention({authorization:auth,credentials,
      execution_context:context,transport:{async execute(){calls++;assert.fail("replacement cannot call transport");}},now_epoch_ms:now}),
      {code:"OFFICIAL_RECOVERY_STATE_INVALID"});
    assert.deepEqual({calls,publishes,retires},{calls:0,publishes:0,retires:0});
    assert.deepEqual(journal.load(),replacement);
    assert(Object.values(credentials).every(value=>value.every(byte=>byte===0)));
  });
}
await contractCheck("direct recovery adapter rejects missing marker and supplied-document mismatch", async () => {
  const auth=completeFixture(2).authorization;const original={retired:false,value:recoveryDocument(auth)};
  const replacement=structuredClone(original.value);replacement.sequence++;
  replacement.state.retention.deployment_id=replacement.state.owned.deployment_id="dpl_SubstitutedV2";
  let calls=0;const journal={load:()=>structuredClone(original),publish(){assert.fail("no publish");},retire(){assert.fail("no retire");}};
  const transport={async execute(){calls++;assert.fail("denied direct admission cannot call transport");}};
  const credentials={github_token:Buffer.from("synthetic-github"),vercel_token:Buffer.from("synthetic-vercel")};
  try {
    assert.throws(()=>officialPlatform.createAdminV1OfficialRecoveryAdapter({authorization:auth,credentials,execution_context:{journal},transport}),
      {code:"OFFICIAL_RECOVERY_STATE_INVALID"});
    assert.throws(()=>officialPlatform.createAdminV1OfficialRecoveryAdapter({authorization:auth,credentials,
      execution_context:recoveryContext(journal,original.value),transport,admitted_document:replacement}),{code:"OFFICIAL_RECOVERY_STATE_INVALID"});
    assert.equal(calls,0);assert.deepEqual(journal.load(),original);
  } finally {for(const value of Object.values(credentials))value.fill(0);}
});
console.log("PASS_RETENTION_RECOVERY_ADMISSION_BINDING marker_negatives=6 valid_replacement_negatives=2 direct_adapter_negatives=2 read_calls=0 real_effects=0");

await contractCheck("metadata-free retained record is denied without project preflight", async () => {
  let record;
  const probe = credentialProbe(2, { journal: { load: () => structuredClone(record) } });
  try {
    record = committedRecoveryRecord(probe.authorization);
    probe.respondWith(({ url }) => {
      if (url.pathname === "/v13/deployments/dpl_owned") return retainedDeployment(probe.authorization);
      return { id: "env-owned-1", key: expectedPreviewKeys[0], type: "sensitive", target: ["preview"],
        gitBranch: probe.authorization.execution.branch_name };
    });
    await probe.execute("verify_preview_identity", { deployment_id: "dpl_owned" });
    await assert.rejects(probe.execute("verify_environment_1", { key: expectedPreviewKeys[0], record_id: "env-owned-1" }),
      { code: "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN" });
    assert.equal(probe.calls.length, 2);
  } finally { probe.retire(); }
});

for (const failure of ["WRONG_PROJECT", "WRONG_TEAM", "FAILED_GET", "WRONG_RUN", "WRONG_PROVENANCE", "MALFORMED_OBSERVATION"]) {
  await contractCheck(`failed recovery project preflight ${failure} persists only reserved usage`, async () => {
    let current, publishes = 0, retires = 0, gitCalls = 0;
    const journal = { load: () => structuredClone(current),
      publish(state) { publishes++;current.value.state = structuredClone(state);current.value.sequence++; },
      retire() { retires++; } };
    const probe = credentialProbe(2, { journal, spawn_sync() {
      gitCalls++;return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    } });
    current = { retired: false, value: recoveryDocument(probe.authorization) };
    const original = structuredClone(current);
    let credentials = probe.credentials;
    if (["WRONG_RUN", "WRONG_PROVENANCE", "MALFORMED_OBSERVATION"].includes(failure)) {
      const [symbol] = Object.getOwnPropertySymbols(credentials);
      const observation = structuredClone(credentials[symbol]);
      if (failure === "WRONG_RUN") observation.bundle_run_id = "55555555-5555-4555-8555-555555555555";
      if (failure === "WRONG_PROVENANCE") observation.bundle_provenance_sha256 = "f".repeat(64);
      if (failure === "MALFORMED_OBSERVATION") observation.unbound = true;
      credentials = { ...credentials };Object.defineProperty(credentials, symbol, { value: observation });
    }
    probe.respondWith(({ url, method }) => {
      assert.equal(method, "GET");
      assert.equal(url.searchParams.get("teamId"), probe.authorization.execution.preview_team_id);
      if (url.pathname === "/v13/deployments/dpl_RetainedV2") {
        const body = retainedDeployment(probe.authorization);body.id = body.uid = "dpl_RetainedV2";return body;
      }
      assert.equal(url.pathname, `/v9/projects/${probe.authorization.execution.preview_project_id}`);
      if (failure === "FAILED_GET") return { http_status: 503, http_body: {} };
      return { id: failure === "WRONG_PROJECT" ? "prj_unrelated" : probe.authorization.execution.preview_project_id,
        name: probe.authorization.execution.preview_project_name,
        accountId: failure === "WRONG_TEAM" ? "team_unrelated" : probe.authorization.execution.preview_team_id };
    });
    try {
      const result = await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: probe.authorization,
        credentials, execution_context: recoveryContext(journal, current.value), transport: probe.transport, now_epoch_ms: now, live_now_epoch_ms: () => now });
      assert.equal(result.classification, "RECOVERY_PENDING");
      assert.deepEqual({ publishes, retires, gitCalls }, { publishes: 3, retires: 0, gitCalls: 1 });
      assert.equal(current.value.sequence, original.value.sequence + 3);
      const unchanged = structuredClone(current);unchanged.value.sequence = original.value.sequence;
      unchanged.value.state.recovery_usage = original.value.state.recovery_usage;
      assert.deepEqual(unchanged, original);
      assert.equal(current.value.state.recovery_usage.provider_control_invocations, 2);
      assert.equal(probe.calls.length, ["WRONG_RUN", "WRONG_PROVENANCE", "MALFORMED_OBSERVATION"].includes(failure) ? 1 : 2);
      assert(Object.values(credentials).every(value => value.every(byte => byte === 0)));
    } finally { probe.retire(); }
  });
}

for (const replacementAt of ["DURING_PREFLIGHT", "AFTER_PREFLIGHT"]) {
  await contractCheck(`valid same-authorization replacement ${replacementAt} preserves substituted journal without finalization`, async () => {
    const auth = completeFixture(2).authorization;
    let current = { retired: false, value: recoveryDocument(auth) }, publishes = 0, retires = 0, preflightDone = false, postLoads = 0;
    const replacement = structuredClone(current);replacement.value.sequence++;
    replacement.value.state.retention.deployment_id = replacement.value.state.owned.deployment_id = "dpl_SubstitutedV2";
    officialRuntime.validateAdminV1OfficialRetentionRecoveryRecord(replacement, auth);
    const reads = [];
    const journal = { load() {
      if (preflightDone && replacementAt === "AFTER_PREFLIGHT" && ++postLoads === 2) current = replacement;
      return structuredClone(current);
    }, publish(state) { publishes++;current.value.sequence++;current.value.state = structuredClone(state); }, retire() { retires++; } };
    const credentials = { github_token: Buffer.from("synthetic-github"), vercel_token: Buffer.from("synthetic-vercel") };
    const transport = { async execute({ operation, input }) {
      reads.push(operation);
      if (operation === "inspect_remote_ref") return { status: "ABSENT" };
      if (operation === "verify_preview_identity") return { status: "EXACT", deployment_id: input.deployment_id, unrelated_preserved: true };
      assert.equal(operation, "inspect_environment_contract");
      if (replacementAt === "DURING_PREFLIGHT") current = replacement;
      await Promise.resolve();preflightDone = true;
      return { status: "EXACT", names: [...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
    } };
    await assert.rejects(officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: auth, credentials,
      execution_context: recoveryContext(journal, current.value), transport, now_epoch_ms: now, live_now_epoch_ms: () => now }), { code: "OFFICIAL_RECOVERY_STATE_INVALID" });
    assert.deepEqual(reads, ["inspect_remote_ref", "verify_preview_identity", "inspect_environment_contract"]);
    assert.deepEqual({ publishes, retires }, { publishes: 3, retires: 0 });assert.deepEqual(current, replacement);
    assert(Object.values(credentials).every(value => value.every(byte => byte === 0)));
  });
}

await contractCheck("reopened concrete cleanup durably bounds every reconciliation request", async () => {
  const auth = completeFixture(2).authorization;
  let current = { retired: false, value: recoveryDocument(auth) }, requests = 0;
  current.value.state.retention.data_zero_residual = false;
  const journal = { load: () => structuredClone(current),
    publish(state) { current.value.sequence++;current.value.state = structuredClone(state); },
    retire() { assert.fail("failed cleanup cannot retire"); } };
  for (let attempt = 0; attempt < 9; attempt++) {
    const context = recoveryContext(journal, current.value);
    const probe = credentialProbe(2, context);
    probe.respondWith(({ url, method }) => {
      if (url.pathname === `/v9/projects/${auth.execution.preview_project_id}`) return {
        id: auth.execution.preview_project_id, name: auth.execution.preview_project_name, accountId: auth.execution.preview_team_id };
      requests++;
      assert.equal(current.value.state.recovery_usage.database_rest_requests, requests);
      assert.equal(current.value.state.recovery_usage.database_rest_successes, requests);
      return method === "GET" ? { http_body: [{ id: "audit-owned", created_at: "v1" }] } : { http_status: 503, http_body: {} };
    });
    try {
      assert.equal((await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: probe.authorization,
        credentials: probe.credentials, execution_context: context, transport: probe.transport,
        now_epoch_ms: now, live_now_epoch_ms: () => now })).classification, "RECOVERY_PENDING");
    } finally { probe.retire(); }
  }
  assert.equal(requests, 14);
  assert.equal(current.value.state.recovery_usage.database_rest_requests, 14);
  assert.equal(current.value.state.runtime_sessions, 1);
});

for (const variant of ["exact", "missing", "extra-secret", "wrong-origin", "unprotected", "wrong-status"]) {
  await contractCheck(`v2 protected handshake attestation ${variant}`, async () => {
    const probe = credentialProbe();
    const auth = probe.authorization;
    const deployment = { id: "dpl_owned", uid: "dpl_owned", url: "aifinder-owned-preview.vercel.app",
      production: false, target: null, readyState: "READY", createdAt: now,
      projectId: auth.execution.preview_project_id, name: "aifinder", ownerId: auth.execution.preview_team_id,
      gitSource: { type: "github", sha: auth.execution.temporary_commit_sha,
        ref: auth.execution.branch_name, repo: "jcdumaua/aifinder" } };
    const security = { "cache-control": "no-store", "content-type": "application/json",
      "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
      "cross-origin-opener-policy": "same-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      "referrer-policy": "strict-origin-when-cross-origin",
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "x-content-type-options": "nosniff", "x-dns-prefetch-control": "off", "x-frame-options": "DENY" };
    try {
      probe.respondWith(({ url, headers }) => {
        if (url.pathname === "/v6/deployments") return { deployments: [deployment], pagination: { count: 1, next: null } };
        if (url.pathname === "/v13/deployments/dpl_owned") return deployment;
        assert.equal(url.pathname, "/api/admin/session");
        if (!headers["x-vercel-trusted-oidc-idp-token"]) return {
          http_status: variant === "unprotected" ? 200 : 401, http_headers: { "content-type": "text/html" },
          http_text: `<title>Authentication Required</title> vercel.com/sso-api url=${encodeURIComponent(String(url))}` };
        assert.equal(headers["x-aifinder-validation"], "client-origin-v1");
        assert.equal(headers["x-vercel-trusted-oidc-idp-token"], "SENTINEL_OIDC");
        const body = { runId, projectRef, origin: `https://${projectRef}.supabase.co` };
        if (variant === "missing") delete body.runId;
        if (variant === "extra-secret") body.secret = "SENTINEL_SECRET";
        if (variant === "wrong-origin") body.origin = "https://default-project.supabase.co";
        return { http_status: variant === "wrong-status" ? 401 : 200, http_headers: security, http_body: body };
      });
      await probe.execute("acquire_automatic_preview");
      await probe.execute("verify_preview_identity", { deployment_id: "dpl_owned" });
      const result = await probe.execute("protected_access_handshake", {
        deployment_id: "dpl_owned", oidc_token: Buffer.from("SENTINEL_OIDC") });
      assert.equal(result.status, variant === "exact" ? "BOUND" : "FAILED");
      if (variant === "exact") assert.deepEqual(result, { status: "BOUND", physical_requests: 2,
        observation: { runId, projectRef, origin: `https://${projectRef}.supabase.co` },
        protected: true, authenticated: true });
      assert.doesNotMatch(JSON.stringify(result), /SENTINEL/u);
      assert.equal(probe.calls.filter(({ url }) => url.pathname === "/api/admin/session").length,
        variant === "unprotected" ? 1 : 2);
    } finally { probe.retire(); }
  });
}

for (const variant of ["exact", "replacement", "absent", "malformed"]) {
  await contractCheck(`fresh concrete transport rebinds only journal-owned storage ${variant}`, async () => {
    const auth = completeFixture(2).authorization;
    const document = recoveryDocument(auth);
    document.state.retention.data_zero_residual = false;
    document.state.owned.logo = { object_id: "admin/55555555-5555-4555-8555-555555555555.png", version: "owned-v1" };
    document.state.cleanup = document.state.cleanup.filter(step => step !== "DELETE_STORAGE_EXACT_VERSION");
    let current = { retired: false, value: document }, deleted = false, revoked = false, grantId;
    const journal = { load: () => structuredClone(current), publish(state) {
      current = { retired: false, value: { ...current.value, sequence: current.value.sequence + 1, state: structuredClone(state) } };
    }, retire() { assert.fail("residual read intentionally fails"); } };
    const probe = credentialProbe(2, recoveryContext(journal, document));
    const logo = document.state.owned.logo;
    probe.respondWith(({ url, method, body }) => {
      if (url.pathname === `/v9/projects/${auth.execution.preview_project_id}`) return {
        id: auth.execution.preview_project_id, name: auth.execution.preview_project_name, accountId: auth.execution.preview_team_id };
      if (method === "HEAD") return { http_status: deleted || variant === "absent" ? 404 : 200, http_body: {} };
      if (url.pathname.startsWith("/storage/v1/object/info/")) return {
        id: "owned-storage-id", bucket_id: "tool-logos", name: logo.object_id,
        version: variant === "replacement" ? "replacement-v2" : logo.version,
        created_at: "2026-10-02T11:30:00.000Z", updated_at: "2026-10-02T11:30:00.000Z",
        metadata: variant === "malformed" ? {} : { eTag: "owned-etag", mimetype: "image/png", size: 68 },
      };
      if (url.pathname.endsWith("aifinder_prepare_storage_cleanup_grant")) {
        assert.equal(body.p_object_name, logo.object_id);assert.equal(body.p_expected_version, logo.version);
        grantId = body.p_grant_id;
        return { grant_id: grantId, expected_version: logo.version, expires_at: "2026-10-02T12:05:00.000Z" };
      }
      if (method === "DELETE") { assert.deepEqual(body.prefixes, [logo.object_id]);deleted = true;return {}; }
      if (url.pathname.endsWith("aifinder_revoke_storage_cleanup_grant")) {
        assert.equal(body.p_grant_id, grantId);revoked = true;return { http_body: true };
      }
      return { http_status: 503, http_body: {} };
    });
    try {
      const result = await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: probe.authorization,
        credentials: probe.credentials, execution_context: recoveryContext(journal, document), transport: probe.transport,
        now_epoch_ms: now, live_now_epoch_ms: () => now });
      assert.equal(result.classification, "RECOVERY_PENDING");
      assert.equal(deleted, variant === "exact");assert.equal(revoked, variant === "exact");
      if (variant === "exact") {
        assert(current.value.state.cleanup.includes("DELETE_STORAGE_EXACT_VERSION"));
        assert(current.value.state.cleanup.includes("REVOKE_STORAGE_CLEANUP_GRANT"));
        assert(current.value.state.recovery_usage.database_rest_requests >= 6);
      } else assert.equal(probe.calls.some(call => ["DELETE", "POST"].includes(call.method)), false);
    } finally { probe.retire(); }
  });
}

for (const failure of [null, "delete_storage_exact_version", "revoke_storage_cleanup_grant"]) {
  await contractCheck(`recovery adapter independently admits journal-bound storage sequence ${failure}`, async () => {
    const auth = completeFixture(2).authorization;
    let current = { retired: false, value: recoveryDocument(auth) };
    const state = current.value.state;
    state.retention.data_zero_residual = false;
    state.cleanup = state.cleanup.filter(step => step !== "DELETE_STORAGE_EXACT_VERSION");
    const journal = { load: () => structuredClone(current), publish(next) {
      current.value.sequence++;current.value.state = structuredClone(next);
    }, retire(next) { current.retired = true;current.value.sequence++;current.value.state = { ...structuredClone(next), retired: true }; } };
    const calls = [];
    const transport = { async execute({ operation, input, recovery }) {
      calls.push(operation);
      if (operation === failure) throw new Error("SYNTHETIC_FAILURE");
      if (operation === "inspect_environment_contract") return { status: "EXACT", names: [...officialRuntime.ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
      if (operation === "storage_read_owned_version") {
        assert.deepEqual(input, { object_id: "logo-owned", expected_version: "v1" });
        recovery.reserve_database_request();recovery.reserve_database_request();
        assert.equal(current.value.state.recovery_usage.database_rest_requests, 2);
        return { status: "EXACT", version: "v1" };
      }
      if (operation === "prepare_storage_cleanup_grant") return { status: "PREPARED", grant_id: "grant-owned" };
      if (operation === "delete_storage_exact_version") {
        assert.deepEqual(input, { object_id: "logo-owned", expected_version: "v1", grant_id: "grant-owned" });
        return { status: "DELETED_EXACT" };
      }
      if (operation === "revoke_storage_cleanup_grant") { assert.deepEqual(input, { grant_id: "grant-owned" });return { status: "REVOKED_EXACT" }; }
      if (operation === "verify_zero_data_residual") return { status: "PROVEN_ABSENT", ownership_readback: "EXACT", unrelated_preserved: true };
      if (operation === "inspect_remote_ref") return { status: "ABSENT" };
      if (operation === "verify_preview_identity") return { status: "EXACT", deployment_id: input.deployment_id, unrelated_preserved: true };
      if (operation.startsWith("verify_environment_")) return { status: "EXACT", ...input,
        project_id: auth.execution.preview_project_id, team_id: auth.execution.preview_team_id,
        git_branch: auth.execution.branch_name, unrelated_preserved: true };
      return { status: "DELETED_EXACT" };
    } };
    const result = await officialPlatform.recoverConcreteAdminV1OfficialRetention({ authorization: auth,
      credentials: { github_token: Buffer.from("synthetic-github"), vercel_token: Buffer.from("synthetic-vercel") },
      execution_context: recoveryContext(journal, current.value), transport, now_epoch_ms: now, live_now_epoch_ms: () => now });
    assert.equal(result.classification, failure ? "RECOVERY_PENDING" : "RETENTION_COMPLETE");
    assert.deepEqual(calls.filter(op => /storage/u.test(op)), ["storage_read_owned_version", "prepare_storage_cleanup_grant",
      "delete_storage_exact_version", "revoke_storage_cleanup_grant"]);
    assert.equal(calls.includes("verify_zero_data_residual"), failure === null);
  });
}

assert.deepEqual(contractFailures, [], contractFailures.join("\n"));
console.log(`PASS_ADMIN_V1_OFFICIAL_CR3 assertions=${assertions} canonical_relation=true repeated_receipts_bypass=false real_calls=0`);
await import("./admin-v1-official-concrete-bridge.test.mjs");
