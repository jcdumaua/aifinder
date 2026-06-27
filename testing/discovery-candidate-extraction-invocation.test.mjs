import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
  invokeCandidateExtractionStagingPipeline,
} = await import("../lib/discovery/discovery-candidate-extraction-invocation.ts");

const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

function createInput(overrides = {}) {
  return {
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    audit_correlation_id: AUDIT_ID,
    invocation_reason: "Manual admin dry-run for approved discovery source.",
    invoked_by_admin_user_id: "admin-user-123",
    dry_run: true,
    max_candidates: 5,
    source_scope: "single_run",
    schema_version: CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
    ...overrides,
  };
}

function assertNoRawPayloadLeak(result) {
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw_payload"), false);
  assert.equal(serialized.includes("public_tool_payload"), false);
  assert.equal(serialized.includes("discovered_tool_payload"), false);
}

test("valid dry-run input returns accepted safe result", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({
      discovery_source_id: `  ${SOURCE_ID.toUpperCase()}  `,
      discovery_run_id: `  ${RUN_ID.toUpperCase()}  `,
      audit_correlation_id: `  ${AUDIT_ID.toUpperCase()}  `,
    }),
  );

  assert.equal(result.accepted, true);
  assert.equal(result.rejected, false);
  assert.equal(result.rejection_code, null);
  assert.equal(result.dry_run, true);
  assert.equal(result.discovery_source_id, SOURCE_ID);
  assert.equal(result.discovery_run_id, RUN_ID);
  assert.equal(result.audit_correlation_id, AUDIT_ID);
  assert.equal(result.candidates_considered_count, 0);
  assert.equal(result.candidates_staged_count, 0);
  assert.equal(result.candidates_skipped_count, 0);
  assert.deepEqual(result.validation_failures, []);
  assert.deepEqual(result.duplicate_or_eligibility_rejections, []);
  assert.equal(result.no_public_write_confirmed, true);
  assert.equal(result.no_discovered_write_confirmed, true);
  assert.equal(result.error_summary, null);
  assert.equal(result.safety_flags.includes("dry_run_only"), true);
  assert.equal(result.safety_flags.includes("staging_not_executed"), true);
  assertNoRawPayloadLeak(result);
});

test("missing admin identity is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ invoked_by_admin_user_id: "   " }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejected, true);
  assert.equal(result.rejection_code, "missing_invoked_by_admin_user_id");
  assert.deepEqual(result.validation_failures, [
    "missing_invoked_by_admin_user_id",
  ]);
  assert.equal(result.no_public_write_confirmed, true);
  assertNoRawPayloadLeak(result);
});

test("missing audit correlation ID is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ audit_correlation_id: "" }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "missing_audit_correlation_id");
  assert.equal(result.audit_correlation_id, null);
  assertNoRawPayloadLeak(result);
});

test("invalid schema version is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ schema_version: "candidate_extraction_invocation.v0" }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "invalid_schema_version");
  assert.equal(result.audit_correlation_id, AUDIT_ID);
  assertNoRawPayloadLeak(result);
});

test("invalid source scope is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ source_scope: "source_and_run" }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "invalid_source_scope");
  assertNoRawPayloadLeak(result);
});

test("ambiguous source scope is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ source_scope: "all_sources" }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "ambiguous_source_scope");
  assertNoRawPayloadLeak(result);
});

test("max candidates above bound is rejected", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({
      max_candidates: CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES + 1,
    }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "max_candidates_out_of_bounds");
  assert.equal(result.no_public_write_confirmed, true);
  assertNoRawPayloadLeak(result);
});

test("dry_run false is rejected because live invocation is not enabled", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({ dry_run: false }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "live_invocation_not_enabled");
  assert.equal(result.dry_run, false);
  assert.equal(result.candidates_staged_count, 0);
  assert.equal(result.no_public_write_confirmed, true);
  assert.equal(result.no_discovered_write_confirmed, true);
  assertNoRawPayloadLeak(result);
});

test("unsafe payload is rejected without echoing raw input", () => {
  const result = invokeCandidateExtractionStagingPipeline(
    createInput({
      invocation_reason: "<script>secret=value</script>",
    }),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "unsafe_payload");
  assertNoRawPayloadLeak(result);
});

test("invocation source stays internal and free of direct persistence hooks", () => {
  const source = readFileSync(
    new URL(
      "../lib/discovery/discovery-candidate-extraction-invocation.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const forbiddenTokens = [
    ["create", "Client"].join(""),
    ["supa", "base"].join(""),
    ["process", ".env"].join(""),
    ["fetch", "("].join(""),
    [".insert", "("].join(""),
    [".update", "("].join(""),
    [".upsert", "("].join(""),
    [".delete", "("].join(""),
    [".from", "("].join(""),
    ["public", ".tools"].join(""),
    ["discovered", "_tools"].join(""),
    ["audit", "_events"].join(""),
    ["stageMapped", "ExtractionCandidate"].join(""),
    ["stageNormalized", "DiscoveryCandidate"].join(""),
  ];

  for (const token of forbiddenTokens) {
    assert.equal(source.includes(token), false);
  }
});
