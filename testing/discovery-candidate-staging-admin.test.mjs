import assert from "node:assert/strict";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  normalizeDiscoveryCandidate,
} = await import("../lib/discovery-candidate-normalizer.ts");
const {
  stageNormalizedDiscoveryCandidateWithClientFactory,
} = await import("../lib/discovery/discovery-candidate-staging-admin.ts");

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";
const DUPLICATE_CANDIDATE_ID = "55555555-5555-4555-8555-555555555555";

function createNormalizedCandidate(overrides = {}) {
  const result = normalizeDiscoveryCandidate({
    discovery_run_id: RUN_ID,
    source_url: "https://example.com/source",
    source_evidence_locator: "url_index:0",
    candidate_name: "Example AI Tool",
    candidate_website_url: "https://tool.example.com",
    candidate_description: "A safe AI assistant for team workflows.",
    candidate_category_hint: "Productivity",
    candidate_pricing_hint: "Free + Paid",
    evidence_summary: "Name, website, and category matched safe static signals.",
    confidence_bucket: "medium",
    audit_correlation_id: AUDIT_ID,
    ...overrides,
  });

  assert.equal(result.ok, true);

  return result.candidate;
}

function createMockClient({ response, throwFrom = false } = {}) {
  const calls = {
    table: null,
    insertPayload: null,
    selectColumns: null,
    singleCalled: false,
  };

  const client = {
    from(table) {
      calls.table = table;

      if (throwFrom) {
        throw new Error("unsafe raw database details should not escape");
      }

      return {
        insert(payload) {
          calls.insertPayload = payload;

          return {
            select(columns) {
              calls.selectColumns = columns;

              return {
                async single() {
                  calls.singleCalled = true;

                  return response ?? {
                    data: {
                      id: CANDIDATE_ID,
                      candidate_status: "staged",
                      discovery_run_id: RUN_ID,
                      audit_correlation_id: AUDIT_ID,
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    calls,
    createClient: () => client,
  };
}

function assertFactoryNotCalled() {
  return () => {
    throw new Error("mock client factory should not be called");
  };
}

function assertNoUnsafeErrorLeak(result) {
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("unsafe raw database details"), false);
  assert.equal(serialized.includes("raw_html"), false);
  assert.equal(serialized.includes("public_tool_payload"), false);
  assert.equal(serialized.includes("llm_prompt"), false);
}

test("stages a normalized candidate through a mocked insert and returns a safe success result", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { calls, createClient } = createMockClient();

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.deepEqual(result, {
    ok: true,
    candidateId: CANDIDATE_ID,
    candidateStatus: "staged",
    discoveryRunId: RUN_ID,
    discoverySourceId: SOURCE_ID,
    auditCorrelationId: AUDIT_ID,
  });

  assert.equal(calls.table, "discovery_candidate_tools");
  assert.equal(calls.selectColumns, "id,candidate_status,discovery_run_id,audit_correlation_id");
  assert.equal(calls.singleCalled, true);
  assert.equal(calls.insertPayload.discovery_run_id, RUN_ID);
  assert.equal(calls.insertPayload.discovery_source_id, SOURCE_ID);
  assert.equal(calls.insertPayload.audit_correlation_id, AUDIT_ID);
  assert.equal(calls.insertPayload.candidate_status, "staged");
});

test("trims discoverySourceId before persisting discovery_source_id", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { calls, createClient } = createMockClient();

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: ` ${SOURCE_ID} `,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(result.ok, true);
  assert.equal(result.discoverySourceId, SOURCE_ID);
  assert.equal(calls.insertPayload.discovery_source_id, SOURCE_ID);
});

test("forces candidate_status to staged in the insert payload", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { calls, createClient } = createMockClient();

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(result.ok, true);
  assert.equal(calls.insertPayload.candidate_status, "staged");
});

test("rejects a normalized candidate that attempts to override staging status", async () => {
  const normalizedCandidate = {
    ...createNormalizedCandidate(),
    candidate_status: "published",
  };

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    assertFactoryNotCalled(),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_input");
  assertNoUnsafeErrorLeak(result);
});

test("passes audit_correlation_id through and rejects missing audit correlation", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { calls, createClient } = createMockClient();

  const success = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(success.ok, true);
  assert.equal(success.auditCorrelationId, AUDIT_ID);
  assert.equal(calls.insertPayload.audit_correlation_id, AUDIT_ID);

  const missingAuditCandidate = { ...normalizedCandidate };
  delete missingAuditCandidate.audit_correlation_id;

  const failure = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate: missingAuditCandidate,
    },
    assertFactoryNotCalled(),
  );

  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, "missing_audit_correlation_id");
  assert.equal(failure.auditCorrelationId, null);
  assertNoUnsafeErrorLeak(failure);
});

test("rejects missing discoveryRunId and discoverySourceId before client creation", async () => {
  const normalizedCandidate = createNormalizedCandidate();

  const missingRun = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: "",
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    assertFactoryNotCalled(),
  );

  assert.equal(missingRun.ok, false);
  assert.equal(missingRun.error.code, "invalid_input");

  const missingSource = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: "",
      normalizedCandidate,
    },
    assertFactoryNotCalled(),
  );

  assert.equal(missingSource.ok, false);
  assert.equal(missingSource.error.code, "invalid_input");
});

test("keeps duplicate fields advisory-only in the insert payload", async () => {
  const normalizedCandidate = createNormalizedCandidate({
    duplicate_check_status: "suspected",
    duplicate_signal_types: ["canonical_url_match", "domain_match"],
    duplicate_blocking: true,
    possible_duplicate_tool_id: 42,
    possible_duplicate_candidate_id: DUPLICATE_CANDIDATE_ID,
  });
  const { calls, createClient } = createMockClient();

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(result.ok, true);
  assert.equal(calls.insertPayload.duplicate_check_status, "suspected");
  assert.deepEqual(calls.insertPayload.duplicate_signal_types, [
    "canonical_url_match",
    "domain_match",
  ]);
  assert.equal(calls.insertPayload.duplicate_blocking, true);
  assert.equal(calls.insertPayload.possible_duplicate_tool_id, 42);
  assert.equal(
    calls.insertPayload.possible_duplicate_candidate_id,
    DUPLICATE_CANDIDATE_ID,
  );
  assert.equal(calls.insertPayload.candidate_status, "staged");
});

test("normalizes mocked Supabase insert errors without raw error passthrough", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { createClient } = createMockClient({
    response: {
      data: null,
      error: {
        message: "unsafe raw database details should not escape",
      },
    },
  });

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "database_insert_failed");
  assertNoUnsafeErrorLeak(result);
});

test("normalizes unexpected thrown errors without raw error passthrough", async () => {
  const normalizedCandidate = createNormalizedCandidate();
  const { createClient } = createMockClient({ throwFrom: true });

  const result = await stageNormalizedDiscoveryCandidateWithClientFactory(
    {
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      normalizedCandidate,
    },
    createClient,
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "unexpected_error");
  assertNoUnsafeErrorLeak(result);
});
