import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE,
  hasCandidateExtractionLiveStagingContext,
  normalizeCandidateExtractionLiveStagingPreview,
  normalizeCandidateExtractionLiveStagingResponseSummary,
} = await import(
  "../components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts"
);

const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

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

test("live staging constants remain bounded and high-friction", () => {
  assert.equal(
    CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE,
    "Stage one candidate",
  );
  assert.equal(CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES, 1);
  assert.equal(CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE, "single_run");
});

test("live staging context requires source, run, and trusted preview", () => {
  const preview = normalizeCandidateExtractionLiveStagingPreview({
    candidateName: "Safe Candidate",
    candidateWebsiteUrl: "https://example.com",
    categoryHint: "Productivity",
    pricingHint: "Free",
    confidenceBucket: "review",
    evidenceSummary: "Safe bounded evidence summary.",
    sourceEvidenceLocator: "manual-static-evidence:0",
    discoverySourceId: SOURCE_ID,
    discoveryRunId: RUN_ID,
    auditCorrelationId: AUDIT_ID,
  });

  assert.notEqual(preview, null);
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
      candidatePreview: preview,
    }),
    true,
  );
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
      candidatePreview: null,
    }),
    false,
  );
  assert.equal(
    hasCandidateExtractionLiveStagingContext({
      discoverySourceId: null,
      discoveryRunId: RUN_ID,
      candidatePreview: preview,
    }),
    false,
  );
});

test("live staging preview and response summary omit unsafe display values", () => {
  const preview = normalizeCandidateExtractionLiveStagingPreview({
    candidateName: "<script>secret=value</script>",
    candidateWebsiteUrl: "https://example.com",
    categoryHint: "Coding",
    pricingHint: "token=value",
    confidenceBucket: "review",
    evidenceSummary: "Safe summary.",
    sourceEvidenceLocator: "manual-static-evidence:0",
    discoverySourceId: SOURCE_ID,
    discoveryRunId: RUN_ID,
    auditCorrelationId: AUDIT_ID,
  });

  assert.notEqual(preview, null);
  assert.equal(preview.candidateName, null);
  assert.equal(preview.pricingHint, null);
  assert.equal(preview.candidateWebsiteUrl, "https://example.com");

  const summary = normalizeCandidateExtractionLiveStagingResponseSummary({
    accepted: true,
    rejected: false,
    dry_run: false,
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    candidates_considered_count: 1,
    candidates_staged_count: 1,
    candidates_skipped_count: 0,
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
  assert.deepEqual(summary.safetyFlags, ["bounded_max_candidates"]);
  assert.deepEqual(summary.duplicateOrEligibilityRejections, []);
  assert.equal(summary.errorSummary, null);
  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("service-role"), false);
});

test("disabled scaffold source is inert and performs no network or backend activation", () => {
  const source = `${readPanelSource()}\n${readUtilsSource()}`;

  assert.equal(source.includes("Stage one candidate"), true);
  assert.equal(source.includes("Live staging unavailable"), true);
  assert.equal(source.includes("No public catalog publishing"), true);
  assert.equal(source.includes("No discovered-tools write"), true);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("/api/admin/csrf"), false);
  assert.equal(
    source.includes("/api/admin/discovery/candidate-extraction/invoke"),
    false,
  );
  assert.equal(source.includes("buildCandidateExtractionDryRunRequestBody"), false);
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

test("runs table wires disabled scaffold with explicit null preview and false availability", () => {
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
  assert.equal(source.includes("candidatePreview={null}"), true);
  assert.equal(source.includes("isLiveStagingAvailable={false}"), true);
});
