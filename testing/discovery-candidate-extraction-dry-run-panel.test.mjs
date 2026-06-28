import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  buildCandidateExtractionDryRunRequestBody,
  CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_DRY_RUN_ROUTE,
  CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION,
  hasCandidateExtractionDryRunContext,
  normalizeCandidateExtractionDryRunResponse,
} = await import(
  "../components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts"
);

const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

test("request body is dry-run-only, bounded, and excludes client admin identity", () => {
  const body = buildCandidateExtractionDryRunRequestBody({
    discoverySourceId: ` ${SOURCE_ID} `,
    discoveryRunId: ` ${RUN_ID} `,
    auditCorrelationId: ` ${AUDIT_ID} `,
    invocationReason: " Phase 10V UI dry-run test. ",
  });

  assert.deepEqual(body, {
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    audit_correlation_id: AUDIT_ID,
    invocation_reason: "Phase 10V UI dry-run test.",
    dry_run: true,
    max_candidates: CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES,
    source_scope: "single_run",
    schema_version: CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION,
  });
  assert.equal(Object.hasOwn(body, "invoked_by_admin_user_id"), false);
  assert.equal(body.dry_run, true);
  assert.equal(body.max_candidates, 1);
});

test("trusted context check blocks missing source or run IDs", () => {
  assert.equal(
    hasCandidateExtractionDryRunContext({
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
    }),
    true,
  );
  assert.equal(
    hasCandidateExtractionDryRunContext({
      discoverySourceId: null,
      discoveryRunId: RUN_ID,
    }),
    false,
  );
  assert.equal(
    hasCandidateExtractionDryRunContext({
      discoverySourceId: SOURCE_ID,
      discoveryRunId: "  ",
    }),
    false,
  );
});

test("safe response normalizer omits raw payload, raw HTML, and secret-like values", () => {
  const summary = normalizeCandidateExtractionDryRunResponse({
    accepted: true,
    rejected: false,
    dry_run: true,
    candidates_staged_count: 0,
    candidates_skipped_count: 0,
    audit_correlation_id: AUDIT_ID,
    safety_flags: ["dry_run_only", "<script>secret=value</script>"],
    validation_failures: ["invalid_schema_version", "raw_payload"],
    duplicate_or_eligibility_rejections: ["service_role leaked"],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    error_summary: "<script>secret=value</script>",
    raw_payload: "<script>secret=value</script>",
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.accepted, true);
  assert.equal(summary.noPublicWriteConfirmed, true);
  assert.equal(summary.noDiscoveredWriteConfirmed, true);
  assert.deepEqual(summary.safetyFlags, ["dry_run_only"]);
  assert.deepEqual(summary.validationFailures, ["invalid_schema_version"]);
  assert.deepEqual(summary.duplicateOrEligibilityRejections, []);
  assert.equal(summary.errorSummary, null);
  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw_payload"), false);
  assert.equal(serialized.includes("service_role"), false);
});

test("panel source uses CSRF fetch, same route, and no forbidden write paths", () => {
  const source = readFileSync(
    new URL(
      "../components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.equal(source.includes("/api/admin/csrf"), true);
  assert.equal(source.includes('"x-csrf-token"'), true);
  assert.equal(source.includes("credentials: \"same-origin\""), true);
  assert.equal(source.includes("buildCandidateExtractionDryRunRequestBody"), true);
  assert.equal(source.includes("invoked_by_admin_user_id"), false);
  assert.equal(source.includes("public.tools"), false);
  assert.equal(source.includes("discovered_tools"), false);
  assert.equal(source.includes("audit_events"), false);
  assert.equal(source.includes("stageMappedExtractionCandidate"), false);
  assert.equal(source.includes("stageNormalizedDiscoveryCandidate"), false);
  assert.equal(source.includes("createClient"), false);
});

test("runs table wires panel with trusted run and source context", () => {
  const source = readFileSync(
    new URL(
      "../components/admin/discovery/discovery-runs-table.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.equal(
    source.includes("DiscoveryCandidateExtractionDryRunPanel"),
    true,
  );
  assert.equal(source.includes("discoveryRunId={run.id}"), true);
  assert.equal(source.includes("discoverySourceId={run.source_id}"), true);
  assert.equal(source.includes("run.source_id || \"Manual / unknown\""), true);
});

test("UI constants point at the verified dry-run route and fixed schema", () => {
  assert.equal(
    CANDIDATE_EXTRACTION_DRY_RUN_ROUTE,
    "/api/admin/discovery/candidate-extraction/invoke",
  );
  assert.equal(
    CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION,
    "candidate_extraction_invocation.v1",
  );
  assert.equal(CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES, 1);
});
