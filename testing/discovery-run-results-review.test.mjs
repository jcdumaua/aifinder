import assert from "node:assert/strict";
import test from "node:test";

const {
  normalizeManualMetadataFetchStats,
  normalizeManualMetadataFetchAuditEvents,
} = await import("../lib/discovery-run-results-review.ts");

test("normalizes manual metadata fetch stats through an allowlist", () => {
  const review = normalizeManualMetadataFetchStats({
    executor_mode: "manual_metadata_fetch",
    execution_status: "manual_metadata_fetch_completed",
    total_urls: 2,
    processed_urls: 2,
    fetched_urls: 1,
    failed_urls: 1,
    skipped_urls: 0,
    no_fetch_performed: false,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    dry_run: false,
    execution_enabled: true,
    fetch_results: [
      {
        hostname: "example.com",
        normalized_url: "https://example.com/path?access_token=hidden#fragment",
        status: "fetch_completed_metadata_only",
        http_status: 200,
        content_type: "text/html",
        content_length_header: "321",
        resolved_ip_family: 4,
        bytes_read: 321,
        response_truncated: false,
        duration_ms: 24,
        error_code: null,
        failure_reason: null,
        raw_html: "must never render",
        candidate: { name: "must never render" },
      },
    ],
  });

  assert.deepEqual(review, {
    executorMode: "manual_metadata_fetch",
    executionStatus: "manual_metadata_fetch_completed",
    counts: {
      totalUrls: 2,
      processedUrls: 2,
      fetchedUrls: 1,
      failedUrls: 1,
      skippedUrls: 0,
    },
    flags: {
      noFetchPerformed: false,
      noExtractionPerformed: true,
      noLlmAnalysisPerformed: true,
      noCandidatesInserted: true,
      noPublicToolsInserted: true,
      dryRun: false,
      executionEnabled: true,
    },
    fetchResults: [
      {
        hostname: "example.com",
        normalizedUrl: "https://example.com/path",
        status: "fetch_completed_metadata_only",
        httpStatus: 200,
        contentType: "text/html",
        contentLengthHeader: "321",
        resolvedIpFamily: 4,
        bytesRead: 321,
        responseTruncated: false,
        durationMs: 24,
        errorCode: null,
        failureReason: null,
      },
    ],
  });
});

test("hides malformed manual metadata values without rendering unknown stats", () => {
  const review = normalizeManualMetadataFetchStats({
    executor_mode: "manual_metadata_fetch",
    execution_status: { unsafe: true },
    total_urls: "two",
    processed_urls: -1,
    fetched_urls: null,
    failed_urls: Number.POSITIVE_INFINITY,
    skipped_urls: {},
    no_fetch_performed: "false",
    fetch_results: [{ hostname: "example.com", raw_html: "hidden" }, "invalid"],
    arbitrary_raw_stats: { html: "hidden" },
  });

  assert.deepEqual(review, {
    executorMode: "manual_metadata_fetch",
    executionStatus: null,
    counts: {
      totalUrls: 0,
      processedUrls: 0,
      fetchedUrls: 0,
      failedUrls: 0,
      skippedUrls: 0,
    },
    flags: {
      noFetchPerformed: null,
      noExtractionPerformed: null,
      noLlmAnalysisPerformed: null,
      noCandidatesInserted: null,
      noPublicToolsInserted: null,
      dryRun: null,
      executionEnabled: null,
    },
    fetchResults: [],
  });
});

test("rejects non-manual runs and normalizes only safe manual audit events", () => {
  assert.equal(normalizeManualMetadataFetchStats({ executor_mode: "dry_run" }), null);

  assert.deepEqual(
    normalizeManualMetadataFetchAuditEvents([
      {
        event_type: "manual_metadata_fetch_url_failed",
        message: "Manual metadata fetch failed safely.",
        created_at: "2026-06-20T12:00:00.000Z",
        status: "fetch_failed_network_error",
        hostname: "example.com",
        error_code: "NETWORK_ERROR",
        failure_reason: "network_error",
        raw_html: "must never render",
      },
      {
        event_type: "unknown_event",
        message: "must never render",
      },
    ]),
    [
      {
        eventType: "manual_metadata_fetch_url_failed",
        message: "Manual metadata fetch failed safely.",
        createdAt: "2026-06-20T12:00:00.000Z",
        status: "fetch_failed_network_error",
        hostname: "example.com",
        errorCode: "NETWORK_ERROR",
        failureReason: "network_error",
      },
    ]
  );
});
