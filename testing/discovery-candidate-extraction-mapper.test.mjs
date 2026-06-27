import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  mapExtractionToStagingCandidate,
} = await import("../lib/discovery/discovery-candidate-extraction-mapper.ts");

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const DUPLICATE_CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";

function createInput(overrides = {}) {
  return {
    discoveryRunId: RUN_ID,
    discoverySourceId: SOURCE_ID,
    sourceUrl: "https://source.example.com/review?utm_source=newsletter",
    sourceEvidenceLocator: "url_index:0",
    candidateName: "Example AI Tool",
    candidateWebsiteUrl: "https://tool.example.com/?utm_campaign=launch",
    candidateDescription: "A safe AI assistant for team workflows.",
    candidateCategoryHint: "Productivity",
    candidatePricingHint: "Free + Paid",
    candidatePlatformHints: ["Web", "Chrome"],
    evidenceSummary: "Name, website, and category matched safe static signals.",
    confidenceBucket: "medium",
    auditCorrelationId: AUDIT_ID,
    ...overrides,
  };
}

function assertSuccess(result) {
  assert.equal(result.ok, true);
  assert.equal(typeof result.stagingInput, "object");

  return result.stagingInput;
}

function assertFailure(result, code) {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
  assert.equal(JSON.stringify(result).includes("<script"), false);
  assert.equal(JSON.stringify(result).includes("secret="), false);

  return result;
}

test("maps valid bounded extraction input into staging helper input", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({
      discoveryRunId: ` ${RUN_ID.toUpperCase()} `,
      discoverySourceId: ` ${SOURCE_ID.toUpperCase()} `,
      candidateName: "  Example AI Tool  ",
      candidateWebsiteUrl: " https://tool.example.com/?utm_campaign=launch ",
    }),
  );
  const stagingInput = assertSuccess(result);

  assert.equal(stagingInput.discoveryRunId, RUN_ID);
  assert.equal(stagingInput.discoverySourceId, SOURCE_ID);
  assert.equal(stagingInput.normalizedCandidate.discovery_run_id, RUN_ID);
  assert.equal(stagingInput.normalizedCandidate.candidate_name, "Example AI Tool");
  assert.equal(
    stagingInput.normalizedCandidate.candidate_website_url,
    "https://tool.example.com/",
  );
  assert.equal(stagingInput.normalizedCandidate.candidate_status, "staged");
  assert.equal(stagingInput.normalizedCandidate.audit_correlation_id, AUDIT_ID);
  assert.equal(stagingInput.normalizedCandidate.candidate_category_hint, "Productivity");
  assert.equal(stagingInput.normalizedCandidate.candidate_pricing_hint, "Free + Paid");
  assert.deepEqual(stagingInput.normalizedCandidate.candidate_platform_hints, [
    "Web",
    "Chrome",
  ]);
  assert.equal(result.warnings.includes("tracking_parameters_removed"), true);
});

test("fails when discoveryRunId is missing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ discoveryRunId: "   " }),
  );

  assertFailure(result, "missing_discovery_run_id");
});

test("fails when discoverySourceId is missing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ discoverySourceId: "   " }),
  );

  assertFailure(result, "missing_discovery_source_id");
});

test("fails when sourceUrl is missing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ sourceUrl: "   " }),
  );

  assertFailure(result, "missing_source_url");
});

test("fails when candidateName is missing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidateName: "   " }),
  );

  assertFailure(result, "missing_candidate_name");
});

test("fails when candidateWebsiteUrl is missing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidateWebsiteUrl: "   " }),
  );

  assertFailure(result, "missing_candidate_website_url");
});

test("fails when discoveryRunId is not a UUID", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ discoveryRunId: "not-a-run-id" }),
  );

  assertFailure(result, "invalid_discovery_run_id");
});

test("fails when discoverySourceId is not a UUID", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ discoverySourceId: "not-a-source-id" }),
  );

  assertFailure(result, "invalid_discovery_source_id");
});

test("fails when sourceUrl is unsafe or non-HTTPS", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ sourceUrl: "http://source.example.com/review" }),
  );

  assertFailure(result, "invalid_source_url");
});

test("fails when candidateWebsiteUrl is unsafe or non-HTTPS", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidateWebsiteUrl: "javascript:alert(1)" }),
  );

  assertFailure(result, "invalid_candidate_website_url");
});

test("fails when category hint is not approved", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidateCategoryHint: "Unknown AI" }),
  );

  assertFailure(result, "invalid_category");
});

test("fails when pricing hint is not approved", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidatePricingHint: "Enterprise" }),
  );

  assertFailure(result, "invalid_pricing");
});

test("fails when unsafe payload text is present", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ candidateDescription: "<script>secret=value</script>" }),
  );

  assertFailure(result, "unsafe_payload");
});

test("preserves provided audit correlation ID", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ auditCorrelationId: ` ${AUDIT_ID.toUpperCase()} ` }),
  );
  const stagingInput = assertSuccess(result);

  assert.equal(stagingInput.normalizedCandidate.audit_correlation_id, AUDIT_ID);
  assert.equal(result.warnings.includes("audit_correlation_generated"), false);
});

test("generates audit correlation ID when absent", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ auditCorrelationId: null }),
  );
  const stagingInput = assertSuccess(result);

  assert.match(
    stagingInput.normalizedCandidate.audit_correlation_id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.equal(result.warnings.includes("audit_correlation_generated"), true);
});

test("maps duplicate advisory fields without approving or publishing", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({
      duplicateAdvisory: {
        duplicateCheckStatus: "suspected",
        duplicateSignalTypes: ["canonical_url_match", "domain_match"],
        duplicateBlocking: true,
        possibleDuplicateToolId: 42,
        possibleDuplicateCandidateId: DUPLICATE_CANDIDATE_ID,
      },
    }),
  );
  const stagingInput = assertSuccess(result);

  assert.equal(stagingInput.normalizedCandidate.duplicate_check_status, "suspected");
  assert.deepEqual(stagingInput.normalizedCandidate.duplicate_signal_types, [
    "canonical_url_match",
    "domain_match",
  ]);
  assert.equal(stagingInput.normalizedCandidate.duplicate_blocking, true);
  assert.equal(stagingInput.normalizedCandidate.possible_duplicate_tool_id, 42);
  assert.equal(
    stagingInput.normalizedCandidate.possible_duplicate_candidate_id,
    DUPLICATE_CANDIDATE_ID,
  );
  assert.equal(stagingInput.normalizedCandidate.candidate_status, "staged");
  assert.equal(result.warnings.includes("duplicate_advisory_present"), true);
});

test("keeps source evidence locator optional with a safe warning", () => {
  const result = mapExtractionToStagingCandidate(
    createInput({ sourceEvidenceLocator: null }),
  );
  const stagingInput = assertSuccess(result);

  assert.equal(stagingInput.normalizedCandidate.source_evidence_locator, null);
  assert.equal(result.warnings.includes("source_evidence_locator_absent"), true);
});

test("mapper source stays free of persistence and network hooks", () => {
  const mapperSource = readFileSync(
    new URL("../lib/discovery/discovery-candidate-extraction-mapper.ts", import.meta.url),
    "utf8",
  );
  const forbiddenTokens = [
    ["create", "Client"].join(""),
    ["supa", "base"].join(""),
    ["stage", "Normalized", "Discovery", "Candidate"].join(""),
    ["process", ".env"].join(""),
    ["fetch", "("].join(""),
    [".insert", "("].join(""),
    [".update", "("].join(""),
    [".upsert", "("].join(""),
    [".delete", "("].join(""),
    [".from", "("].join(""),
  ];

  for (const token of forbiddenTokens) {
    assert.equal(mapperSource.includes(token), false);
  }
});
