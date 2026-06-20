import assert from "node:assert/strict";
import test from "node:test";

const {
  createManualMetadataFetchAdapterFailureResult,
  createManualMetadataFetchResult,
  summarizeManualMetadataFetchResults,
} = await import("../lib/discovery-manual-metadata-fetch.ts");

function createMetadata(overrides = {}) {
  return {
    normalizedUrl: "https://example.com/path",
    hostname: "example.com",
    httpStatus: 200,
    contentType: "text/html",
    contentLengthHeader: "128",
    resolvedIpFamily: 4,
    bytesRead: 128,
    responseTruncated: false,
    durationMs: 24,
    errorCode: null,
    ...overrides,
  };
}

test("maps a successful adapter result to the manual metadata allowlist", () => {
  const result = createManualMetadataFetchResult({
    ok: true,
    status: "fetch_completed_metadata_only",
    metadata: {
      ...createMetadata(),
      body: "must not be stored",
      html: "<title>must not be stored</title>",
      title: "must not be stored",
    },
  });

  assert.deepEqual(result, {
    normalized_url: "https://example.com/path",
    hostname: "example.com",
    status: "fetch_completed_metadata_only",
    http_status: 200,
    content_type: "text/html",
    content_length_header: "128",
    resolved_ip_family: 4,
    bytes_read: 128,
    response_truncated: false,
    duration_ms: 24,
    error_code: null,
    failure_reason: null,
  });
});

test("removes query strings and fragments from stored normalized URLs", () => {
  const result = createManualMetadataFetchResult({
    ok: true,
    status: "fetch_completed_metadata_only",
    metadata: createMetadata({
      normalizedUrl: "https://example.com/path?access_token=hidden#fragment",
    }),
  });

  assert.equal(result.normalized_url, "https://example.com/path");
});

test("maps adapter failures to fixed reasons and rejects unsafe metadata values", () => {
  const result = createManualMetadataFetchResult({
    ok: false,
    status: "fetch_failed_network_error",
    reason: "upstream response leaked a body-like message",
    metadata: createMetadata({
      httpStatus: 999,
      contentType: "application/json",
      contentLengthHeader: "not-a-length",
      resolvedIpFamily: 8,
      bytesRead: -1,
      responseTruncated: "yes",
      durationMs: -10,
      errorCode: "unsafe\nvalue",
    }),
  });

  assert.deepEqual(result, {
    normalized_url: "https://example.com/path",
    hostname: "example.com",
    status: "fetch_failed_network_error",
    http_status: null,
    content_type: null,
    content_length_header: null,
    resolved_ip_family: null,
    bytes_read: 0,
    response_truncated: false,
    duration_ms: 0,
    error_code: null,
    failure_reason: "network_error",
  });
});

test("summarizes successful and failed manual metadata results without skips", () => {
  const summary = summarizeManualMetadataFetchResults([
    createManualMetadataFetchResult({
      ok: true,
      status: "fetch_completed_metadata_only",
      metadata: createMetadata(),
    }),
    createManualMetadataFetchResult({
      ok: false,
      status: "fetch_failed_timeout",
      reason: "fetch_timeout",
      metadata: createMetadata({ errorCode: "TIMEOUT" }),
    }),
  ]);

  assert.deepEqual(summary, {
    totalUrls: 2,
    fetchedUrls: 1,
    failedUrls: 1,
    skippedUrls: 0,
  });
});

test("represents an unexpected adapter exception as a fixed safe failure", () => {
  assert.deepEqual(
    createManualMetadataFetchAdapterFailureResult({
      normalizedUrl: "https://example.com/path",
      hostname: "example.com",
    }),
    {
      normalized_url: "https://example.com/path",
      hostname: "example.com",
      status: "fetch_failed_network_error",
      http_status: null,
      content_type: null,
      content_length_header: null,
      resolved_ip_family: null,
      bytes_read: 0,
      response_truncated: false,
      duration_ms: 0,
      error_code: "ADAPTER_ERROR",
      failure_reason: "adapter_failure",
    }
  );
});
