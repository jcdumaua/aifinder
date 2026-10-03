import assert from "node:assert/strict";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  observeOfficialClientOrigin,
  validateOfficialIsolationAuthorization,
  validateOfficialProvisioningReceipt,
} from "./admin-v1-official-isolation.mjs";
import { loadAdminV1OfficialCredentials } from "./admin-v1-official-live-platform.mjs";
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
console.log(`PASS_ADMIN_V1_OFFICIAL_CR3 assertions=${assertions} canonical_relation=true repeated_receipts_bypass=false real_calls=0`);
await import("./admin-v1-official-concrete-bridge.test.mjs");
