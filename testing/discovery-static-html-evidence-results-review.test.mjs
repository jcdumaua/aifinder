import assert from "node:assert/strict";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const { normalizeManualStaticHtmlEvidenceStats } = await import(
  "../lib/discovery-static-html-evidence-results-review.ts"
);

test("normalizes allowlisted static HTML evidence for read-only review", () => {
  const review = normalizeManualStaticHtmlEvidenceStats({
    executor_mode: "manual_static_html_derived_evidence",
    execution_status: "manual_static_html_derived_evidence_completed",
    total_urls: 1,
    attempted_urls: 1,
    acquired_urls: 1,
    evidence_attempted_urls: 1,
    evidence_produced_urls: 1,
    failed_urls: 0,
    skipped_urls: 0,
    all_failed: false,
    no_fetch_performed: false,
    no_extraction_performed: false,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    raw_html_persisted: false,
    candidates_created: false,
    dry_run: false,
    execution_enabled: true,
    evidence_results: [
      {
        normalized_url: "https://example.com/path?access_token=hidden#fragment",
        hostname: "Example.COM",
        status: "evidence_derived",
        acquisition_status: "fetch_completed_html_acquired",
        http_status: 200,
        content_type: "text/html",
        content_length_header: "321",
        resolved_ip_family: 4,
        bytes_read: 321,
        response_truncated: false,
        duration_ms: 24,
        error_code: null,
        failure_reason: null,
        extraction_status: "derived",
        extraction_version: "1",
        evidence_attempted: true,
        raw_html_persisted: false,
        derived_evidence: {
          extractionStatus: "derived",
          extractionVersion: "1",
          title: "Example AI Assistant",
          metaDescription: "A safe derived description.",
          openGraphTitle: "Example OG title",
          openGraphDescription: "Example OG description",
          canonicalUrl: "https://example.com/canonical?token=hidden",
          homepageHeadlineSnippet: "Build safely with AI.",
          visibleTextSnippet: "Visible text derived from the page.",
          appStoreLinks: ["https://apps.apple.com/app/example?id=hidden"],
          pricingLinks: ["https://example.com/pricing?session=hidden"],
          contactLinks: ["https://example.com/contact"],
          docsLinks: ["https://example.com/docs"],
          productNameHint: "Example AI Assistant",
          companyNameHint: "Example Inc.",
          categoryHints: ["chat", "productivity"],
          aiToolRelevanceHints: ["ai", "assistant"],
          confidenceLabel: "tentative",
          truncated: false,
          safetyFlags: ["no_title_found"],
          raw_html: "<script>must-not-render</script>",
          candidate: { name: "must-not-render" },
        },
        raw_html: "<script>must-not-render</script>",
        headers: { cookie: "admin-cookie=must-not-render" },
        cookie: "must-not-render",
        stack: "must-not-render",
        candidate: { name: "must-not-render" },
        public_tool: { name: "must-not-render" },
      },
    ],
    raw_html: "<script>must-not-render</script>",
    response_body: "must-not-render",
    headers: { authorization: "must-not-render" },
    cookie: "must-not-render",
    secret: "must-not-render",
    stack: "must-not-render",
    candidate: { name: "must-not-render" },
    public_tools: [{ name: "must-not-render" }],
  });

  assert.deepEqual(review, {
    executorMode: "manual_static_html_derived_evidence",
    executionStatus: "manual_static_html_derived_evidence_completed",
    counts: {
      totalUrls: 1,
      attemptedUrls: 1,
      acquiredUrls: 1,
      evidenceAttemptedUrls: 1,
      evidenceProducedUrls: 1,
      failedUrls: 0,
      skippedUrls: 0,
      allFailed: false,
    },
    flags: {
      noFetchPerformed: false,
      noExtractionPerformed: false,
      noLlmAnalysisPerformed: true,
      noCandidatesInserted: true,
      noPublicToolsInserted: true,
      rawHtmlPersisted: false,
      candidatesCreated: false,
      dryRun: false,
      executionEnabled: true,
    },
    evidenceResults: [
      {
        normalizedUrl: "https://example.com/path",
        hostname: "example.com",
        status: "evidence_derived",
        acquisitionStatus: "fetch_completed_html_acquired",
        httpStatus: 200,
        contentType: "text/html",
        contentLengthHeader: "321",
        resolvedIpFamily: 4,
        bytesRead: 321,
        responseTruncated: false,
        durationMs: 24,
        errorCode: null,
        failureReason: null,
        extractionStatus: "derived",
        extractionVersion: "1",
        evidenceAttempted: true,
        derivedEvidence: {
          title: "Example AI Assistant",
          metaDescription: "A safe derived description.",
          openGraphTitle: "Example OG title",
          openGraphDescription: "Example OG description",
          canonicalUrl: "https://example.com/canonical",
          homepageHeadlineSnippet: "Build safely with AI.",
          visibleTextSnippet: "Visible text derived from the page.",
          appStoreLinks: ["https://apps.apple.com/app/example"],
          pricingLinks: ["https://example.com/pricing"],
          contactLinks: ["https://example.com/contact"],
          docsLinks: ["https://example.com/docs"],
          productNameHint: "Example AI Assistant",
          companyNameHint: "Example Inc.",
          categoryHints: ["chat", "productivity"],
          aiToolRelevanceHints: ["ai"],
          confidenceLabel: "tentative",
          truncated: false,
          safetyFlags: ["no_title_found"],
        },
      },
    ],
  });

  const serialized = JSON.stringify(review);
  assert.equal(serialized.includes("must-not-render"), false);
  assert.equal(serialized.includes("access_token=hidden"), false);
  assert.equal(serialized.includes("session=hidden"), false);
});

test("returns a safe empty static review for malformed static stats", () => {
  const review = normalizeManualStaticHtmlEvidenceStats({
    executor_mode: "manual_static_html_derived_evidence",
    execution_status: { unsafe: true },
    total_urls: 9,
    attempted_urls: -1,
    acquired_urls: "one",
    evidence_attempted_urls: null,
    evidence_produced_urls: Number.POSITIVE_INFINITY,
    failed_urls: {},
    skipped_urls: [],
    all_failed: "false",
    no_fetch_performed: "false",
    evidence_results: [
      { status: "unknown", raw_html: "must-not-render" },
      "invalid",
    ],
    arbitrary_raw_stats: { raw_html: "must-not-render" },
  });

  assert.deepEqual(review, {
    executorMode: "manual_static_html_derived_evidence",
    executionStatus: null,
    counts: {
      totalUrls: 0,
      attemptedUrls: 0,
      acquiredUrls: 0,
      evidenceAttemptedUrls: 0,
      evidenceProducedUrls: 0,
      failedUrls: 0,
      skippedUrls: 0,
      allFailed: null,
    },
    flags: {
      noFetchPerformed: null,
      noExtractionPerformed: null,
      noLlmAnalysisPerformed: null,
      noCandidatesInserted: null,
      noPublicToolsInserted: null,
      rawHtmlPersisted: null,
      candidatesCreated: null,
      dryRun: null,
      executionEnabled: null,
    },
    evidenceResults: [],
  });
});

test("rejects non-static executor stats without a raw fallback", () => {
  assert.equal(
    normalizeManualStaticHtmlEvidenceStats({
      executor_mode: "manual_metadata_fetch",
      raw_html: "must-not-render",
    }),
    null
  );
});
