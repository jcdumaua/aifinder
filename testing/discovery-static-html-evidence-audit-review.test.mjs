import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const { normalizeManualStaticHtmlEvidenceAuditEvents } = await import(
  "../lib/discovery-static-html-evidence-audit-review.ts"
);

const FORBIDDEN_MARKERS = [
  "raw-html-marker",
  "cookie-marker",
  "header-marker",
  "secret-marker",
  "stack-marker",
  "raw-json-marker",
  "candidate-marker",
  "discovered-tool-marker",
  "public-tool-marker",
  "llm-prompt-marker",
  "body-snippet-marker",
  "title-snippet-marker",
  "meta-description-marker",
];

function assertNoForbiddenMarkers(value) {
  const serialized = JSON.stringify(value);

  for (const marker of FORBIDDEN_MARKERS) {
    assert.equal(serialized.includes(marker), false, `${marker} escaped normalizer`);
  }
}

test("normalizes allowlisted static evidence audit events in chronological order", () => {
  const events = normalizeManualStaticHtmlEvidenceAuditEvents([
    {
      event_type: "manual_static_html_derived_evidence_completed",
      created_at: "2026-06-24T12:03:00.000Z",
      total_urls: 1,
      status: "manual_static_html_derived_evidence_completed",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
    },
    {
      event_type: "manual_static_html_derived_evidence_started",
      created_at: "2026-06-24T12:00:00.000Z",
      total_urls: 1,
      raw_html_persisted: false,
      candidates_created: false,
      public_tools_inserted: false,
      llm_analysis_performed: false,
    },
    {
      event_type: "manual_static_html_derived_evidence_url_completed",
      created_at: "2026-06-24T12:01:00.000Z",
      url_index: 1,
      total_urls: 1,
      status: "evidence_derived",
      acquisition_status: "fetch_completed_html_acquired",
      extraction_status: "derived",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
    },
    {
      event_type: "manual_static_html_derived_evidence_url_failed",
      created_at: "2026-06-24T12:02:00.000Z",
      url_index: 1,
      total_urls: 1,
      status: "acquisition_failed",
      acquisition_status: "fetch_failed_network_error",
      error_code: "NETWORK_ERROR",
      failure_reason: "network_error",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
    },
    {
      event_type: "manual_static_html_derived_evidence_failed",
      created_at: "2026-06-24T12:04:00.000Z",
      reason: "static_html_evidence_executor_internal_failure",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
    },
  ]);

  assert.deepEqual(events, [
    {
      eventType: "manual_static_html_derived_evidence_started",
      label: "Static evidence started",
      createdAt: "2026-06-24T12:00:00.000Z",
      statusLabel: "Started",
      urlIndex: null,
      urlCount: 1,
      acquisitionStatus: null,
      evidenceStatus: null,
      failureCode: null,
      failureReason: null,
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
    {
      eventType: "manual_static_html_derived_evidence_url_completed",
      label: "URL evidence completed",
      createdAt: "2026-06-24T12:01:00.000Z",
      statusLabel: "Evidence derived",
      urlIndex: 1,
      urlCount: 1,
      acquisitionStatus: "fetch_completed_html_acquired",
      evidenceStatus: "evidence_derived",
      failureCode: null,
      failureReason: null,
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
    {
      eventType: "manual_static_html_derived_evidence_url_failed",
      label: "URL evidence failed safely",
      createdAt: "2026-06-24T12:02:00.000Z",
      statusLabel: "Acquisition failed safely",
      urlIndex: 1,
      urlCount: 1,
      acquisitionStatus: "fetch_failed_network_error",
      evidenceStatus: "acquisition_failed",
      failureCode: "NETWORK_ERROR",
      failureReason: "network_error",
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
    {
      eventType: "manual_static_html_derived_evidence_completed",
      label: "Static evidence completed",
      createdAt: "2026-06-24T12:03:00.000Z",
      statusLabel: "Completed",
      urlIndex: null,
      urlCount: 1,
      acquisitionStatus: null,
      evidenceStatus: null,
      failureCode: null,
      failureReason: null,
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
    {
      eventType: "manual_static_html_derived_evidence_failed",
      label: "Static evidence failed safely",
      createdAt: "2026-06-24T12:04:00.000Z",
      statusLabel: "Failed safely",
      urlIndex: null,
      urlCount: null,
      acquisitionStatus: null,
      evidenceStatus: null,
      failureCode: null,
      failureReason: "static_html_evidence_executor_internal_failure",
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
  ]);
});

test("drops unknown event types and malformed events without raw fallback", () => {
  assert.deepEqual(
    normalizeManualStaticHtmlEvidenceAuditEvents([
      null,
      "invalid",
      {
        event_type: "manual_metadata_fetch_completed",
        created_at: "2026-06-24T12:00:00.000Z",
        raw_html: "raw-html-marker",
      },
      {
        event_type: "manual_static_html_derived_evidence_started",
        created_at: "not-a-date",
        raw_html: "raw-html-marker",
      },
      {
        event_type: "manual_static_html_derived_evidence_url_completed",
        created_at: "2026-06-24T12:00:00.000Z",
        url_index: 99,
        total_urls: 99,
        status: "<script>raw-html-marker</script>",
        acquisition_status: "header-marker",
      },
    ]),
    [
      {
        eventType: "manual_static_html_derived_evidence_url_completed",
        label: "URL evidence completed",
        createdAt: "2026-06-24T12:00:00.000Z",
        statusLabel: "Completed safely",
        urlIndex: null,
        urlCount: null,
        acquisitionStatus: null,
        evidenceStatus: null,
        failureCode: null,
        failureReason: null,
        rawHtmlPersisted: null,
        candidatesCreated: null,
        publicToolsInserted: null,
        llmAnalysisPerformed: null,
      },
    ]
  );
});

test("strips hostile metadata payloads from helper output", () => {
  const normalized = normalizeManualStaticHtmlEvidenceAuditEvents([
    {
      event_type: "manual_static_html_derived_evidence_url_failed",
      created_at: "2026-06-24T12:00:00.000Z",
      url_index: 1,
      total_urls: 1,
      status: "evidence_failed_safely",
      acquisition_status: "fetch_failed_network_error",
      extraction_status: "failed_closed",
      error_code: "EVIDENCE_HELPER_FAILED",
      failure_reason: "evidence_helper_failure",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
      raw_html: "<script>raw-html-marker</script>",
      html_snippet: "raw-html-marker",
      visible_text_snippet: "body-snippet-marker",
      title: "title-snippet-marker",
      headline: "title-snippet-marker",
      meta_description: "meta-description-marker",
      headers: { cookie: "cookie-marker", authorization: "header-marker" },
      cookies: "cookie-marker",
      csrf_token: "secret-marker",
      secret: "secret-marker",
      stack: "stack-marker",
      exception: { message: "stack-marker" },
      transport: "raw-json-marker",
      metadata: { raw: "raw-json-marker" },
      stats: { raw: "raw-json-marker" },
      candidate: { name: "candidate-marker" },
      discovered_tool: { name: "discovered-tool-marker" },
      public_tool: { name: "public-tool-marker" },
      llm_prompt: "llm-prompt-marker",
      llm_response: "llm-prompt-marker",
    },
  ]);

  assert.deepEqual(normalized, [
    {
      eventType: "manual_static_html_derived_evidence_url_failed",
      label: "URL evidence failed safely",
      createdAt: "2026-06-24T12:00:00.000Z",
      statusLabel: "Evidence failed safely",
      urlIndex: 1,
      urlCount: 1,
      acquisitionStatus: "fetch_failed_network_error",
      evidenceStatus: "evidence_failed_safely",
      failureCode: "EVIDENCE_HELPER_FAILED",
      failureReason: "evidence_helper_failure",
      rawHtmlPersisted: false,
      candidatesCreated: false,
      publicToolsInserted: false,
      llmAnalysisPerformed: false,
    },
  ]);
  assertNoForbiddenMarkers(normalized);
});

test("keeps helper output free of raw metadata keys and JSON stringify fallback", async () => {
  const normalized = normalizeManualStaticHtmlEvidenceAuditEvents([
    {
      event_type: "manual_static_html_derived_evidence_completed",
      created_at: "2026-06-24T12:00:00.000Z",
      raw_html_persisted: false,
      candidates_created: false,
      no_public_tools_inserted: true,
      no_llm_analysis_performed: true,
      metadata: { raw_html: "raw-html-marker" },
      stats: { secret: "secret-marker" },
    },
  ]);
  const serialized = JSON.stringify(normalized);
  const source = await readFile(
    new URL("../lib/discovery-static-html-evidence-audit-review.ts", import.meta.url),
    "utf8"
  );

  assert.equal(serialized.includes("metadata"), false);
  assert.equal(serialized.includes("stats"), false);
  assertNoForbiddenMarkers(normalized);
  assert.doesNotMatch(source, /JSON\.stringify/);
});
