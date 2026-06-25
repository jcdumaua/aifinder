import assert from "node:assert/strict";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_CONFIDENCE_BUCKETS,
  CANDIDATE_STATUS_VALUES,
  normalizeDiscoveryCandidate,
} = await import("../lib/discovery-candidate-normalizer.ts");

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const DUPLICATE_CANDIDATE_ID = "22222222-2222-4222-8222-222222222222";

function validInput(overrides = {}) {
  return {
    discovery_run_id: RUN_ID,
    source_url: "https://Example.com/source?utm_source=newsletter&safe=1#top",
    source_evidence_locator: "url_index:0",
    candidate_name: "Example AI Tool",
    candidate_website_url: "https://Tool.Example.com/product?utm_medium=email&ref=home#section",
    candidate_description: "A safe AI assistant for team workflows.",
    candidate_category_hint: "Productivity",
    candidate_pricing_hint: "Free + Paid",
    evidence_summary: "Name, website, and category matched safe static signals.",
    confidence_bucket: "medium",
    audit_correlation_id: AUDIT_ID,
    ...overrides,
  };
}

function assertRejected(input, rejectionCode) {
  const result = normalizeDiscoveryCandidate(input);

  assert.equal(result.ok, false);
  assert.equal(result.rejection_code, rejectionCode);
  assert.equal(Object.hasOwn(result, "candidate"), false);

  if (input.candidate_name) {
    assert.equal(JSON.stringify(result).includes(String(input.candidate_name)), false);
  }

  return result;
}

function assertNoUnsafeOutput(value) {
  const serialized = JSON.stringify(value);
  const unsafeMarkers = [
    "unsafe-raw-html-marker",
    "unsafe-header-marker",
    "unsafe-cookie-marker",
    "unsafe-secret-marker",
    "unsafe-stack-marker",
    "unsafe-json-dump-marker",
    "unsafe-transport-marker",
    "unsafe-candidate-payload-marker",
    "unsafe-discovered-payload-marker",
    "unsafe-public-payload-marker",
    "unsafe-llm-prompt-marker",
    "unsafe-llm-response-marker",
    "published",
    "promoted",
    "approved",
    "live",
    "recommendation_score",
    "ranking_score",
  ];

  for (const marker of unsafeMarkers) {
    assert.equal(serialized.includes(marker), false, `${marker} escaped normalizer`);
  }
}

test("normalizes a valid minimal staging candidate into safe insert-like fields", () => {
  const result = normalizeDiscoveryCandidate({
    ...validInput({
      candidate_name: "  Example   AI\nTool  ",
      candidate_platform_hints: [" Web ", "iOS", "Web"],
      candidate_social_links: ["https://x.com/ExampleTool?utm_source=x#bio"],
      candidate_app_links: ["https://apps.apple.com/app/example?id=123#reviews"],
      risk_flags: [" missing_description ", "duplicate_signal_present"],
      duplicate_check_status: "suspected",
      duplicate_signal_types: ["canonical_url_match", "domain_match", "canonical_url_match"],
      duplicate_blocking: true,
      possible_duplicate_tool_id: 42,
      possible_duplicate_candidate_id: DUPLICATE_CANDIDATE_ID,
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.warnings, [
    "tracking_parameters_removed",
    "duplicate_advisory_present",
  ]);

  assert.deepEqual(result.candidate, {
    discovery_run_id: RUN_ID,
    source_url: "https://example.com/source?safe=1",
    source_url_normalized: "https://example.com/source?safe=1",
    source_domain: "example.com",
    source_evidence_kind: "static_html_derived_evidence",
    source_evidence_locator: "url_index:0",
    extraction_mode: "deterministic_static_evidence",
    extraction_version: "candidate_normalizer_v1",
    candidate_name: "Example AI Tool",
    candidate_website_url: "https://tool.example.com/product?ref=home",
    candidate_canonical_url: "https://tool.example.com/product?ref=home",
    candidate_normalized_domain: "tool.example.com",
    candidate_description: "A safe AI assistant for team workflows.",
    candidate_category_hint: "Productivity",
    candidate_pricing_hint: "Free + Paid",
    candidate_platform_hints: ["Web", "iOS"],
    candidate_social_links: ["https://x.com/ExampleTool"],
    candidate_app_links: ["https://apps.apple.com/app/example?id=123"],
    evidence_summary: "Name, website, and category matched safe static signals.",
    confidence_bucket: "medium",
    risk_flags: ["missing_description", "duplicate_signal_present"],
    duplicate_check_status: "suspected",
    duplicate_signal_types: ["canonical_url_match", "domain_match"],
    duplicate_blocking: true,
    possible_duplicate_tool_id: 42,
    possible_duplicate_discovered_tool_id: null,
    possible_duplicate_candidate_id: DUPLICATE_CANDIDATE_ID,
    duplicate_checked_at: null,
    candidate_status: "staged",
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    rejection_reason_code: null,
    audit_correlation_id: AUDIT_ID,
    cleanup_status: "active",
    eligible_for_cleanup_at: null,
    archived_at: null,
  });

  assertNoUnsafeOutput(result);
});

test("keeps lifecycle values staging-only and human-review fields unset", () => {
  const result = normalizeDiscoveryCandidate(
    validInput({
      candidate_status: "published",
      reviewed_at: "2026-06-25T00:00:00.000Z",
      reviewed_by: "44444444-4444-4444-8444-444444444444",
      review_notes: "unsafe admin note should not be accepted by the normalizer",
      duplicate_check_status: "blocked",
      duplicate_blocking: true,
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.candidate.candidate_status, "staged");
  assert.equal(result.candidate.reviewed_at, null);
  assert.equal(result.candidate.reviewed_by, null);
  assert.equal(result.candidate.review_notes, null);
  assert.equal(result.candidate.duplicate_check_status, "blocked");
  assert.equal(result.candidate.duplicate_blocking, true);
  assertNoUnsafeOutput(result);
});

test("rejects missing required fields with safe rejection codes only", () => {
  assertRejected(validInput({ discovery_run_id: "" }), "missing_discovery_run_id");
  assertRejected(validInput({ source_url: "" }), "missing_source_url");
  assertRejected(validInput({ candidate_name: "" }), "missing_name");
  assertRejected(validInput({ candidate_website_url: "" }), "missing_website_url");
});

test("rejects malformed, non-HTTPS, unsupported, and unsafe-domain URLs", () => {
  assertRejected(validInput({ candidate_website_url: "https://%zz" }), "invalid_url");
  assertRejected(validInput({ candidate_website_url: "http://example.com" }), "non_https_url");
  assertRejected(validInput({ candidate_website_url: "javascript:alert(1)" }), "invalid_url");
  assertRejected(validInput({ candidate_website_url: "data:text/html,unsafe" }), "invalid_url");
  assertRejected(validInput({ candidate_website_url: "file:///etc/passwd" }), "invalid_url");
  assertRejected(validInput({ candidate_website_url: "mailto:team@example.com" }), "invalid_url");
  assertRejected(validInput({ candidate_website_url: "https://localhost:3000" }), "unsafe_domain");
  assertRejected(validInput({ candidate_website_url: "https://127.0.0.1" }), "unsafe_domain");
  assertRejected(validInput({ candidate_website_url: "https://192.168.1.10" }), "unsafe_domain");
  assertRejected(validInput({ candidate_website_url: "https://admin.internal" }), "unsafe_domain");
});

test("rejects hostile text in names, descriptions, summaries, and array hints", () => {
  assertRejected(validInput({ candidate_name: "<script>alert(1)</script>" }), "unsafe_content");
  assertRejected(validInput({ candidate_description: "<img src=x onerror=alert(1)>" }), "unsafe_content");
  assertRejected(validInput({ evidence_summary: '{"raw":"unsafe-json-dump-marker"}' }), "unsafe_content");
  assertRejected(validInput({ candidate_description: "Error: failed\n at crawler.run" }), "unsafe_content");
  assertRejected(validInput({ candidate_description: "Cookie: session=unsafe-cookie-marker" }), "unsafe_content");
  assertRejected(validInput({ candidate_description: "Authorization: Bearer unsafe-secret-marker" }), "unsafe_content");
  assertRejected(validInput({ candidate_description: "sk-1234567890abcdef1234567890abcdef" }), "unsafe_content");
  assertRejected(validInput({ candidate_platform_hints: ["<svg onload=alert(1)>"] }), "unsafe_content");
});

test("rejects overlong fields before database insertion could be attempted", () => {
  assertRejected(validInput({ candidate_name: "A".repeat(161) }), "field_too_long");
  assertRejected(validInput({ candidate_description: "A".repeat(1001) }), "field_too_long");
  assertRejected(validInput({ evidence_summary: "A".repeat(1001) }), "field_too_long");
  assertRejected(validInput({ source_evidence_locator: "A".repeat(161) }), "field_too_long");
});

test("rejects unsupported category, pricing, and confidence values", () => {
  assertRejected(validInput({ candidate_category_hint: "Unreviewed Category" }), "unsupported_category_hint");
  assertRejected(validInput({ candidate_pricing_hint: "Enterprise Only" }), "unsupported_pricing_hint");
  assertRejected(validInput({ confidence_bucket: "very_high" }), "unsupported_confidence_bucket");
  assertRejected(validInput({ confidence_bucket: 0.98 }), "unsupported_confidence_bucket");
});

test("ignores unknown raw-like input keys and never returns unsafe payload markers", () => {
  const result = normalizeDiscoveryCandidate(
    validInput({
      raw_html: "unsafe-raw-html-marker",
      headers: { authorization: "unsafe-header-marker" },
      cookies: "unsafe-cookie-marker",
      secrets: "unsafe-secret-marker",
      raw_metadata: { value: "unsafe-metadata-marker" },
      raw_stats: { value: "unsafe-stats-marker" },
      json_dump: '{"unsafe":"unsafe-json-dump-marker"}',
      snippet: "unsafe-body-snippet-marker",
      stack_trace: "unsafe-stack-marker",
      transport_payload: "unsafe-transport-marker",
      raw_candidate_payload: "unsafe-candidate-payload-marker",
      discovered_tool_payload: "unsafe-discovered-payload-marker",
      public_tool_payload: "unsafe-public-payload-marker",
      llm_prompt: "unsafe-llm-prompt-marker",
      llm_response: "unsafe-llm-response-marker",
      ranking_score: 100,
      recommendation_score: 100,
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.candidate, "raw_html"), false);
  assert.equal(Object.hasOwn(result.candidate, "headers"), false);
  assert.equal(Object.hasOwn(result.candidate, "cookies"), false);
  assert.equal(Object.hasOwn(result.candidate, "raw_metadata"), false);
  assert.equal(Object.hasOwn(result.candidate, "ranking_score"), false);
  assert.equal(Object.hasOwn(result.candidate, "recommendation_score"), false);
  assertNoUnsafeOutput(result);
});

test("exports only coarse confidence buckets and staging-safe status values", () => {
  assert.deepEqual(CANDIDATE_CONFIDENCE_BUCKETS, ["low", "medium", "high"]);
  assert.deepEqual(CANDIDATE_STATUS_VALUES, [
    "staged",
    "needs_review",
    "duplicate_suspected",
    "rejected",
    "archived",
  ]);
});
