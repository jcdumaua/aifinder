import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  stageMappedExtractionCandidate,
  stageMappedExtractionCandidateBatch,
} = await import("../lib/discovery/discovery-candidate-extraction-staging-pipeline.ts");

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";

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
    evidenceSummary: "Name, website, and category matched safe static signals.",
    confidenceBucket: "medium",
    auditCorrelationId: AUDIT_ID,
    ...overrides,
  };
}

function createStageDependency({ response, throwOnStage = false } = {}) {
  const calls = [];

  return {
    calls,
    async stageCandidate(input) {
      calls.push(input);

      if (throwOnStage) {
        throw new Error("raw unsafe staging exception should not escape");
      }

      return response ?? {
        ok: true,
        candidateId: CANDIDATE_ID,
        candidateStatus: "staged",
        discoveryRunId: input.discoveryRunId,
        discoverySourceId: input.discoverySourceId,
        auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
      };
    },
  };
}

function serialize(value) {
  return JSON.stringify(value);
}

function assertNoRawPayloadLeak(result) {
  const serialized = serialize(result);

  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw unsafe staging exception"), false);
  assert.equal(serialized.includes("public_tool_payload"), false);
  assert.equal(serialized.includes("full_normalized_candidate"), false);
}

test("mapper failure does not call staging dependency", async () => {
  const dependency = createStageDependency();

  const result = await stageMappedExtractionCandidate(
    {
      item: createInput({ candidateName: "   " }),
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, "mapper");
  assert.equal(result.error.code, "missing_candidate_name");
  assert.equal(dependency.calls.length, 0);
  assertNoRawPayloadLeak(result);
});

test("mapper failure returns safe summary without raw payload", async () => {
  const dependency = createStageDependency();

  const result = await stageMappedExtractionCandidate(
    {
      item: createInput({
        candidateDescription: "<script>secret=value</script>",
      }),
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, "mapper");
  assert.equal(result.error.code, "unsafe_payload");
  assert.equal(dependency.calls.length, 0);
  assertNoRawPayloadLeak(result);
});

test("mapper success calls staging dependency exactly once with run source and audit IDs", async () => {
  const dependency = createStageDependency();

  const result = await stageMappedExtractionCandidate(
    {
      item: createInput(),
      actorId: "  phase-10g-actor  ",
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, "staged");
  assert.equal(result.candidateStatus, "staged");
  assert.equal(result.candidateId, CANDIDATE_ID);
  assert.equal(result.discoveryRunId, RUN_ID);
  assert.equal(result.discoverySourceId, SOURCE_ID);
  assert.equal(result.auditCorrelationId, AUDIT_ID);
  assert.equal(result.mapperWarnings.includes("tracking_parameters_removed"), true);
  assert.equal(dependency.calls.length, 1);
  assert.equal(dependency.calls[0].discoveryRunId, RUN_ID);
  assert.equal(dependency.calls[0].discoverySourceId, SOURCE_ID);
  assert.equal(dependency.calls[0].actorId, "phase-10g-actor");
  assert.equal(dependency.calls[0].normalizedCandidate.audit_correlation_id, AUDIT_ID);
  assert.equal(dependency.calls[0].normalizedCandidate.candidate_status, "staged");
});

test("staging dependency failure returns safe staging failure summary", async () => {
  const dependency = createStageDependency({
    response: {
      ok: false,
      error: {
        code: "database_insert_failed",
        message: "Candidate staging insert failed.",
        details: {
          raw: "public_tool_payload",
        },
      },
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      auditCorrelationId: AUDIT_ID,
    },
  });

  const result = await stageMappedExtractionCandidate(
    {
      item: createInput(),
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, "staging");
  assert.equal(result.error.code, "database_insert_failed");
  assert.equal(result.error.message, "Candidate staging insert failed.");
  assert.equal(result.discoveryRunId, RUN_ID);
  assert.equal(result.discoverySourceId, SOURCE_ID);
  assert.equal(result.auditCorrelationId, AUDIT_ID);
  assert.equal(dependency.calls.length, 1);
  assertNoRawPayloadLeak(result);
});

test("thrown staging dependency error returns safe staging failure summary", async () => {
  const dependency = createStageDependency({ throwOnStage: true });

  const result = await stageMappedExtractionCandidate(
    {
      item: createInput(),
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, "staging");
  assert.equal(result.error.code, "unexpected_error");
  assert.equal(result.error.message, "Unexpected candidate staging error.");
  assert.equal(result.discoveryRunId, RUN_ID);
  assert.equal(result.discoverySourceId, SOURCE_ID);
  assert.equal(result.auditCorrelationId, AUDIT_ID);
  assert.equal(dependency.calls.length, 1);
  assertNoRawPayloadLeak(result);
});

test("batch preserves result order and counts partial success and failure", async () => {
  const dependency = createStageDependency();
  const stageCandidate = async (input) => {
    dependency.calls.push(input);

    if (input.normalizedCandidate.candidate_name === "Stage Failure Tool") {
      return {
        ok: false,
        error: {
          code: "database_insert_failed",
          message: "Candidate staging insert failed.",
        },
        discoveryRunId: input.discoveryRunId,
        discoverySourceId: input.discoverySourceId,
        auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
      };
    }

    return {
      ok: true,
      candidateId: `${CANDIDATE_ID}-${dependency.calls.length}`,
      candidateStatus: "staged",
      discoveryRunId: input.discoveryRunId,
      discoverySourceId: input.discoverySourceId,
      auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
    };
  };

  const result = await stageMappedExtractionCandidateBatch(
    {
      items: [
        createInput({ candidateName: "First Valid Tool" }),
        createInput({ sourceUrl: "   " }),
        createInput({ candidateName: "Stage Failure Tool" }),
      ],
      maxItems: 10,
    },
    {
      stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.totalItems, 3);
  assert.equal(result.processedCount, 3);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.stagedCount, 1);
  assert.equal(result.mapperFailureCount, 1);
  assert.equal(result.stagingFailureCount, 1);
  assert.equal(result.results.length, 3);
  assert.equal(result.results[0].ok, true);
  assert.equal(result.results[1].ok, false);
  assert.equal(result.results[1].stage, "mapper");
  assert.equal(result.results[1].error.code, "missing_source_url");
  assert.equal(result.results[2].ok, false);
  assert.equal(result.results[2].stage, "staging");
  assert.equal(result.results[2].error.code, "database_insert_failed");
  assert.equal(dependency.calls.length, 2);
  assertNoRawPayloadLeak(result);
});

test("batch maxItems cap avoids unbounded processing", async () => {
  const dependency = createStageDependency();

  const result = await stageMappedExtractionCandidateBatch(
    {
      items: [
        createInput({ candidateName: "First Valid Tool" }),
        createInput({ candidateName: "Second Valid Tool" }),
      ],
      maxItems: 1,
    },
    {
      stageCandidate: dependency.stageCandidate,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.totalItems, 2);
  assert.equal(result.processedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.stagedCount, 1);
  assert.equal(result.mapperFailureCount, 0);
  assert.equal(result.stagingFailureCount, 0);
  assert.equal(result.results.length, 1);
  assert.equal(dependency.calls.length, 1);
});

test("integration source stays free of direct persistence and network hooks", () => {
  const source = readFileSync(
    new URL(
      "../lib/discovery/discovery-candidate-extraction-staging-pipeline.ts",
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
  ];

  for (const token of forbiddenTokens) {
    assert.equal(source.includes(token), false);
  }
});
