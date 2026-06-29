import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION,
  CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE,
  buildCandidateExtractionLiveStagingRequestBody,
  getCandidateExtractionLiveStagingFailureMessage,
  getCandidatePreviewForLiveStagingScaffold,
  hasCandidateExtractionLiveStagingContext,
  normalizeCandidateExtractionLiveStagingPreview,
  normalizeCandidateExtractionLiveStagingResponseSummary,
  normalizeCandidateExtractionPreviewRouteResult,
} = await import(
  "../components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts"
);

const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

function createPreview(overrides = {}) {
  return {
    candidateName: "Safe Candidate",
    candidateWebsiteUrl: "https://tool.example.com",
    categoryHint: "Productivity",
    pricingHint: "Free + Paid",
    confidenceBucket: "medium",
    evidenceSummary: "Safe preview summary.",
    sourceEvidenceLocator: "url_index:0",
    sourceUrlSnapshot: "https://source.example.com/review",
    discoverySourceId: SOURCE_ID,
    discoveryRunId: RUN_ID,
    auditCorrelationId: AUDIT_ID,
    ...overrides,
  };
}

function readPanelSource() {
  return readFileSync(
    new URL(
      "../components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx",
      import.meta.url,
    ),
    "utf8",
  );
}

function readUtilsSource() {
  return readFileSync(
    new URL(
      "../components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts",
      import.meta.url,
    ),
    "utf8",
  );
}

test("live staging context requires source, run, audit, and trusted preview", () => {
  const preview = normalizeCandidateExtractionLiveStagingPreview(createPreview());

  assert.notEqual(preview, null);
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      candidatePreview: preview,
    }),
    true,
  );
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoveryRunId: RUN_ID,
      discoverySourceId: "",
      candidatePreview: preview,
    }),
    false,
  );
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      candidatePreview: null,
    }),
    false,
  );
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoveryRunId: "99999999-9999-4999-8999-999999999999",
      discoverySourceId: SOURCE_ID,
      candidatePreview: preview,
    }),
    false,
  );
});

test("live staging request body is separate, bounded, and client-safe", () => {
  const body = buildCandidateExtractionLiveStagingRequestBody({
    discoveryRunId: RUN_ID,
    discoverySourceId: SOURCE_ID,
    candidatePreview: createPreview(),
  });

  assert.notEqual(body, null);
  assert.deepEqual(Object.keys(body).sort(), [
    "audit_correlation_id",
    "discovery_run_id",
    "discovery_source_id",
    "dry_run",
    "invocation_reason",
    "max_candidates",
    "schema_version",
    "source_scope",
  ]);
  assert.equal(body.discovery_source_id, SOURCE_ID);
  assert.equal(body.discovery_run_id, RUN_ID);
  assert.equal(body.audit_correlation_id, AUDIT_ID);
  assert.equal(body.dry_run, false);
  assert.equal(body.max_candidates, CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES);
  assert.equal(body.source_scope, CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE);
  assert.equal(body.schema_version, CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION);
  assert.equal(Object.hasOwn(body, "invoked_by_admin_user_id"), false);
  assert.equal(Object.hasOwn(body, "liveStagingGate"), false);
  assert.equal(Object.hasOwn(body, "stageCandidate"), false);
  assert.equal(Object.hasOwn(body, "sourceUrl"), false);
  assert.equal(Object.hasOwn(body, "sourceUrlSnapshot"), false);
  assert.equal(Object.hasOwn(body, "candidateWebsiteUrl"), false);
});

test("live staging request body fails closed without exact preview lineage", () => {
  assert.equal(
    buildCandidateExtractionLiveStagingRequestBody({
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      candidatePreview: createPreview({
        auditCorrelationId: null,
      }),
    }),
    null,
  );
  assert.equal(
    buildCandidateExtractionLiveStagingRequestBody({
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      candidatePreview: createPreview({
        discoveryRunId: "99999999-9999-4999-8999-999999999999",
      }),
    }),
    null,
  );
  assert.equal(
    buildCandidateExtractionLiveStagingRequestBody({
      discoveryRunId: RUN_ID,
      discoverySourceId: SOURCE_ID,
      candidatePreview: createPreview({
        sourceUrlSnapshot: "https://tool.example.com",
      }),
    }),
    null,
  );
});

test("live staging preview and response summary omit unsafe display values", () => {
  const preview = normalizeCandidateExtractionLiveStagingPreview(
    createPreview({
      candidateName: "<script>secret=value</script>",
      pricingHint: "service-role unsafe",
      sourceUrlSnapshot: "https://source.example.com/review",
    }),
  );

  assert.notEqual(preview, null);
  assert.equal(preview.candidateName, null);
  assert.equal(preview.pricingHint, null);
  assert.equal(preview.candidateWebsiteUrl, "https://tool.example.com/");

  const summary = normalizeCandidateExtractionLiveStagingResponseSummary({
    accepted: true,
    rejected: false,
    dry_run: false,
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    candidates_considered_count: 1,
    candidates_staged_count: 1,
    candidates_skipped_count: 0,
    candidate_id: "44444444-4444-4444-8444-444444444444",
    candidate_status: "staged",
    audit_correlation_id: AUDIT_ID,
    safety_flags: ["bounded_max_candidates", "<script>secret=value</script>"],
    validation_failures: ["live_staging_not_configured"],
    duplicate_or_eligibility_rejections: ["service-role unsafe"],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    rejection_code: null,
    error_summary: "<script>secret=value</script>",
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.accepted, true);
  assert.equal(summary.candidatesStagedCount, 1);
  assert.equal(summary.candidateStatus, "staged");
  assert.deepEqual(summary.safetyFlags, ["bounded_max_candidates"]);
  assert.deepEqual(summary.duplicateOrEligibilityRejections, []);
  assert.equal(summary.errorSummary, null);
  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("service-role"), false);
});

test("candidate preview route result normalizes accepted preview for staging UI", () => {
  const routeResult = {
    data: {
      accepted: true,
      rejected: false,
      rejectionCode: null,
      previewStatus: "reviewable",
      preview: createPreview(),
      safetyFlags: ["server_sanitized"],
      auditCorrelationId: AUDIT_ID,
      noPublicWriteConfirmed: true,
      noDiscoveredWriteConfirmed: true,
    },
  };

  const normalized = normalizeCandidateExtractionPreviewRouteResult(routeResult);
  const preview = getCandidatePreviewForLiveStagingScaffold(routeResult);

  assert.equal(normalized.accepted, true);
  assert.equal(normalized.previewStatus, "reviewable");
  assert.equal(preview.candidateName, "Safe Candidate");
  assert.equal(preview.discoverySourceId, SOURCE_ID);
  assert.equal(preview.discoveryRunId, RUN_ID);
  assert.equal(preview.auditCorrelationId, AUDIT_ID);
  assert.equal(preview.sourceUrlSnapshot, "https://source.example.com/review");
});

test("candidate preview route result keeps rejected or unsafe preview out of staging UI", () => {
  const blockedRouteResult = {
    data: {
      accepted: false,
      rejected: true,
      rejectionCode: "preview_artifact_blocked",
      previewStatus: "blocked",
      preview: createPreview(),
      safetyFlags: ["no_public_write"],
      auditCorrelationId: AUDIT_ID,
      noPublicWriteConfirmed: true,
      noDiscoveredWriteConfirmed: true,
    },
  };
  const unsafeAcceptedRouteResult = {
    data: {
      accepted: true,
      rejected: false,
      rejectionCode: null,
      previewStatus: "reviewable",
      preview: createPreview({
        sourceUrlSnapshot: "https://tool.example.com",
      }),
      safetyFlags: ["server_sanitized", "<script>secret=value</script>"],
      auditCorrelationId: AUDIT_ID,
      noPublicWriteConfirmed: true,
      noDiscoveredWriteConfirmed: true,
    },
  };

  const blocked = normalizeCandidateExtractionPreviewRouteResult(blockedRouteResult);
  const unsafeAccepted = normalizeCandidateExtractionPreviewRouteResult(
    unsafeAcceptedRouteResult,
  );

  assert.equal(getCandidatePreviewForLiveStagingScaffold(blockedRouteResult), null);
  assert.equal(blocked.preview, null);
  assert.equal(unsafeAccepted.preview, null);
  assert.deepEqual(unsafeAccepted.safetyFlags, ["server_sanitized"]);
});

test("failure message mapper returns safe admin-readable messages", () => {
  assert.equal(
    getCandidateExtractionLiveStagingFailureMessage({
      rejection_code: "preview_source_url_drift",
    }),
    "The preview is stale because the source URL changed. Refresh or rerun the preview.",
  );
  assert.equal(
    getCandidateExtractionLiveStagingFailureMessage(
      { code: "unsupported_request_field" },
      400,
    ),
    "The staging request included unsupported fields and was blocked.",
  );
  assert.equal(
    getCandidateExtractionLiveStagingFailureMessage({}, 403),
    "Security token missing or expired. Please refresh and try again.",
  );
  assert.equal(
    getCandidateExtractionLiveStagingFailureMessage(
      { error: "<script>secret=value</script>" },
      500,
    ),
    "Candidate staging failed safely. No public write was performed.",
  );
});

test("enabled panel source uses CSRF, confirmation, same route, and no forbidden write helpers", () => {
  const source = `${readPanelSource()}\n${readUtilsSource()}`;

  assert.equal(source.includes("Stage one candidate"), true);
  assert.equal(source.includes("Stage this candidate?"), true);
  assert.equal(source.includes(CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE), true);
  assert.equal(source.includes("/api/admin/csrf"), true);
  assert.equal(source.includes('"x-csrf-token"'), true);
  assert.equal(source.includes('credentials: "same-origin"'), true);
  assert.equal(source.includes(CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE), true);
  assert.equal(source.includes("buildCandidateExtractionLiveStagingRequestBody"), true);
  assert.equal(source.includes("invoked_by_admin_user_id"), false);
  assert.equal(source.includes("liveStagingGate"), false);
  assert.equal(source.includes("stageCandidate"), false);
  assert.equal(source.includes("raw_payload"), false);
  assert.equal(source.includes("raw_html"), false);
  assert.equal(source.includes("public.tools"), false);
  assert.equal(source.includes("discovered_tools"), false);
  assert.equal(source.includes("audit_events"), false);
  assert.equal(source.includes("stageMappedExtractionCandidate"), false);
  assert.equal(source.includes("stageNormalizedDiscoveryCandidate"), false);
  assert.equal(source.includes("createClient"), false);
});

test("runs table enables staging panel only from normalized preview context", () => {
  const source = readFileSync(
    new URL(
      "../components/admin/discovery/discovery-runs-table.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.equal(
    source.includes("DiscoveryCandidateExtractionLiveStagingPanel"),
    true,
  );
  assert.equal(source.includes("discoveryRunId={run.id}"), true);
  assert.equal(source.includes("discoverySourceId={run.source_id}"), true);
  assert.equal(source.includes("candidatePreview={candidatePreview}"), true);
  assert.equal(source.includes("isLiveStagingAvailable={Boolean(candidatePreview)}"), true);
  assert.equal(source.includes("candidate-preview?source_id="), true);
  assert.equal(source.includes("/api/admin/csrf"), false);
  assert.equal(source.includes('method: "POST"'), false);
  assert.equal(source.includes("stageNormalizedDiscoveryCandidate"), false);
  assert.equal(source.includes(".insert("), false);
  assert.equal(source.includes(".upsert("), false);
  assert.equal(source.includes(".update("), false);
  assert.equal(source.includes(".delete("), false);
});

test("UI constants point at verified live route and fixed single-candidate contract", () => {
  assert.equal(
    CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE,
    "/api/admin/discovery/candidate-extraction/invoke",
  );
  assert.equal(
    CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION,
    "candidate_extraction_invocation.v1",
  );
  assert.equal(CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES, 1);
  assert.equal(CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE, "single_run");
});
