import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
  invokeCandidateExtractionStagingPipeline,
} = await import("../lib/discovery/discovery-candidate-extraction-invocation.ts");
const {
  CANDIDATE_PREVIEW_LIVE_STAGING_RESOLVER_PHASE,
  resolveCandidatePreviewLiveStagingOptions,
} = await import("../lib/discovery/discovery-candidate-preview-live-staging-resolver.ts");

const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const STAGED_CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";
const ADMIN_ID = "admin-user-123";

function createInvocationInput(overrides = {}) {
  return {
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    audit_correlation_id: AUDIT_ID,
    invocation_reason: "Manual admin preview-revalidated live gate resolver test.",
    invoked_by_admin_user_id: ADMIN_ID,
    dry_run: false,
    max_candidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
    source_scope: "single_run",
    schema_version: CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
    ...overrides,
  };
}

function createAcceptedPreview(overrides = {}) {
  return {
    accepted: true,
    rejected: false,
    rejectionCode: null,
    previewStatus: "reviewable",
    preview: {
      candidateName: "Preview Resolver AI",
      candidateWebsiteUrl: "https://tool.example.com",
      categoryHint: "Productivity",
      pricingHint: "Free + Paid",
      confidenceBucket: "medium",
      evidenceSummary: "Server-revalidated preview evidence summary.",
      sourceEvidenceLocator: "url_index:0",
      sourceUrlSnapshot: "https://source.example.com/review",
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
      auditCorrelationId: AUDIT_ID,
      ...(overrides.preview ?? {}),
    },
    safetyFlags: [
      "bounded_preview",
      "server_sanitized",
      "source_run_matched",
      "source_url_snapshot_validated",
      "no_public_write",
      "no_discovered_write",
      "no_raw_html",
      "no_llm_output",
    ],
    auditCorrelationId: AUDIT_ID,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== "preview"),
    ),
  };
}

function createRejectedPreview(overrides = {}) {
  return {
    accepted: false,
    rejected: true,
    rejectionCode: "preview_artifact_unavailable",
    previewStatus: "unavailable",
    preview: null,
    safetyFlags: [
      "no_public_write",
      "no_discovered_write",
      "no_raw_html",
      "no_llm_output",
    ],
    auditCorrelationId: null,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
    ...overrides,
  };
}

function assertEmptyOptions(options) {
  assert.equal(options.liveStagingGate, undefined);
  assert.equal(options.getLiveStagingCandidate, undefined);
  assert.equal(options.stageCandidate, undefined);
}

function assertNoRawPayloadLeak(value) {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw_payload"), false);
  assert.equal(serialized.includes("source_url_snapshot"), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("stack"), false);
}

test("accepted preview resolves a server-created manual API live staging gate", async () => {
  const stageCalls = [];
  const providerCalls = [];

  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput(),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview(input) {
        providerCalls.push(input);
        return createAcceptedPreview();
      },
      stageCandidate(input) {
        stageCalls.push(input);

        return {
          ok: true,
          candidateId: STAGED_CANDIDATE_ID,
          candidateStatus: "staged",
          discoveryRunId: input.discoveryRunId,
          discoverySourceId: input.discoverySourceId,
          auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
        };
      },
    },
  );

  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0].discoverySourceId, SOURCE_ID);
  assert.equal(providerCalls[0].discoveryRunId, RUN_ID);
  assert.equal(providerCalls[0].requestingAdminActorId, ADMIN_ID);

  assert.equal(options.liveStagingGate.enabled, true);
  assert.equal(options.liveStagingGate.mode, CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE);
  assert.equal(options.liveStagingGate.phase, CANDIDATE_PREVIEW_LIVE_STAGING_RESOLVER_PHASE);
  assert.equal(options.liveStagingGate.createdByServer, true);
  assert.equal(options.liveStagingGate.approvedExecutionRequired, true);
  assert.equal(options.liveStagingGate.maxCandidates, 1);
  assert.equal(options.liveStagingGate.sourceScope, "single_run");
  assert.equal(options.liveStagingGate.discoverySourceId, SOURCE_ID);
  assert.equal(options.liveStagingGate.discoveryRunId, RUN_ID);
  assert.equal(options.liveStagingGate.auditCorrelationId, AUDIT_ID);
  assert.equal(options.liveStagingGate.actorId, ADMIN_ID);

  const result = await invokeCandidateExtractionStagingPipeline(
    createInvocationInput(),
    options,
  );

  assert.equal(result.accepted, true);
  assert.equal(result.rejected, false);
  assert.equal(result.dry_run, false);
  assert.equal(result.candidates_considered_count, 1);
  assert.equal(result.candidates_staged_count, 1);
  assert.equal(result.discovery_source_id, SOURCE_ID);
  assert.equal(result.discovery_run_id, RUN_ID);
  assert.equal(result.audit_correlation_id, AUDIT_ID);
  assert.equal(result.no_public_write_confirmed, true);
  assert.equal(result.no_discovered_write_confirmed, true);
  assert.equal(stageCalls.length, 1);
  assert.equal(stageCalls[0].discoverySourceId, SOURCE_ID);
  assert.equal(stageCalls[0].discoveryRunId, RUN_ID);
  assert.equal(stageCalls[0].normalizedCandidate.candidate_status, "staged");
  assert.equal(stageCalls[0].normalizedCandidate.source_url, "https://source.example.com/review");
  assert.equal(stageCalls[0].normalizedCandidate.candidate_website_url, "https://tool.example.com/");
  assertNoRawPayloadLeak(result);
});

test("rejected preview fails closed without creating a live gate", async () => {
  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput(),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        return createRejectedPreview({
          rejectionCode: "preview_source_url_drift",
          previewStatus: "stale",
          auditCorrelationId: AUDIT_ID,
        });
      },
      stageCandidate() {
        throw new Error("stage should not be called");
      },
    },
  );

  assertEmptyOptions(options);

  const result = await invokeCandidateExtractionStagingPipeline(
    createInvocationInput(),
    options,
  );

  assert.equal(result.accepted, false);
  assert.equal(result.rejection_code, "live_invocation_not_enabled");
  assert.equal(result.candidates_staged_count, 0);
  assertNoRawPayloadLeak(result);
});

test("audit correlation mismatch fails closed", async () => {
  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput(),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        return createAcceptedPreview({
          preview: {
            auditCorrelationId: "77777777-7777-4777-8777-777777777777",
          },
          auditCorrelationId: "77777777-7777-4777-8777-777777777777",
        });
      },
    },
  );

  assertEmptyOptions(options);
});

test("candidate website copied as source URL snapshot fails closed", async () => {
  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput(),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        return createAcceptedPreview({
          preview: {
            sourceUrlSnapshot: "https://tool.example.com",
          },
        });
      },
    },
  );

  assertEmptyOptions(options);
});

test("provider input must remain scoped to the invocation", async () => {
  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput(),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        return createAcceptedPreview();
      },
    },
  );

  assert.equal(typeof options.getLiveStagingCandidate, "function");

  const candidate = await options.getLiveStagingCandidate({
    discoverySourceId: SOURCE_ID,
    discoveryRunId: "99999999-9999-4999-8999-999999999999",
    auditCorrelationId: AUDIT_ID,
    invocationReason: "Mismatched run should fail.",
    invokedByAdminUserId: ADMIN_ID,
    dryRun: false,
    maxCandidates: 1,
    sourceScope: "single_run",
    schemaVersion: CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
  });

  assert.equal(candidate, null);
});

test("invalid IDs do not create a live gate", async () => {
  let providerCalled = false;

  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput({
        discovery_source_id: "not-a-uuid",
      }),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        providerCalled = true;
        return createAcceptedPreview();
      },
    },
  );

  assertEmptyOptions(options);
  assert.equal(providerCalled, false);
});

test("dry-run invocation does not create a live gate", async () => {
  let providerCalled = false;

  const options = await resolveCandidatePreviewLiveStagingOptions(
    {
      invocationInput: createInvocationInput({ dry_run: true }),
      invokedByAdminUserId: ADMIN_ID,
    },
    {
      getCandidatePreview() {
        providerCalled = true;
        return createAcceptedPreview();
      },
    },
  );

  assertEmptyOptions(options);
  assert.equal(providerCalled, false);
});

test("resolver source avoids direct database clients and public/discovered writes", () => {
  const source = readFileSync(
    "lib/discovery/discovery-candidate-preview-live-staging-resolver.ts",
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
  ];

  for (const token of forbiddenTokens) {
    assert.equal(source.includes(token), false);
  }

  assert.equal(source.includes("sourceUrl: preview.sourceUrlSnapshot"), false);
  assert.equal(source.includes("sourceUrl: candidateWebsiteUrl"), false);
  assert.equal(source.includes("stageNormalizedDiscoveryCandidate"), true);
  assert.equal(source.includes("getCandidateExtractionPreviewForRun"), true);
});
