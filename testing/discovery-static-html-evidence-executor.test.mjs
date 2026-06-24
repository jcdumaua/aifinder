import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  createManualStaticHtmlEvidenceExecutor,
  getManualStaticHtmlEvidenceTerminalState,
  MANUAL_STATIC_HTML_DERIVED_EVIDENCE_MAX_URLS,
} = await import("../lib/discovery-static-html-evidence-executor.ts");

function createRequestPlan(overrides = {}) {
  return {
    normalizedUrl: "https://example.com/path?access_token=hidden",
    hostname: "example.com",
    protocol: "https:",
    method: "GET",
    fetchDisabled: true,
    noNetworkRequestPerformed: true,
    timeoutMs: 10_000,
    redirectLimit: 0,
    responseSizeLimitBytes: 1_000_000,
    userAgent: "AiFinder Discovery Engine/1.0",
    createdAt: "2026-06-23T00:00:00.000Z",
    ...overrides,
  };
}

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
    durationMs: 12,
    errorCode: null,
    ...overrides,
  };
}

function createSuccess(html) {
  return {
    ok: true,
    status: "fetch_completed_html_acquired",
    html,
    metadata: createMetadata({ bytesRead: Buffer.byteLength(html) }),
  };
}

function createFailure(overrides = {}) {
  return {
    ok: false,
    status: "fetch_failed_network_error",
    reason: "upstream private body detail",
    metadata: createMetadata({
      httpStatus: null,
      contentType: null,
      contentLengthHeader: null,
      resolvedIpFamily: null,
      bytesRead: 0,
      errorCode: "ECONNRESET",
      body: "body-marker-must-not-escape",
      headers: { cookie: "admin-cookie=private" },
      ...overrides,
    }),
  };
}

test("acquires bounded HTML then immediately returns allowlisted tentative evidence", async () => {
  const plans = [];
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async (plan) => {
      plans.push(plan);
      return createSuccess(`
        <script>raw-html-marker</script>
        <title>Safe AI Assistant</title>
        <h1>Safe visible headline</h1>
      `);
    },
  });
  const result = await executor([createRequestPlan()]);
  const serialized = JSON.stringify(result);

  assert.equal(MANUAL_STATIC_HTML_DERIVED_EVIDENCE_MAX_URLS, 3);
  assert.equal(plans.length, 1);
  assert.deepEqual(plans[0].acceptedContentTypes, ["text/html"]);
  assert.equal(plans[0].redirectLimit, 0);
  assert.equal(result.summary.evidenceProducedUrls, 1);
  assert.equal(result.summary.allFailed, false);
  assert.equal(result.results[0].status, "evidence_derived");
  assert.equal(result.results[0].derived_evidence.confidenceLabel, "tentative");
  assert.equal(result.results[0].derived_evidence.title, "Safe AI Assistant");
  assert.equal("html" in result.results[0], false);
  assert.equal(serialized.includes("raw-html-marker"), false);
  assert.equal(serialized.includes("access_token=hidden"), false);
});

test("processes bounded request plans sequentially", async () => {
  let active = 0;
  let maximumActive = 0;
  const seenHosts = [];
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async (plan) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      seenHosts.push(plan.hostname);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return createSuccess("<title>Sequential</title>");
    },
  });
  const result = await executor([
    createRequestPlan({ normalizedUrl: "https://one.example/", hostname: "one.example" }),
    createRequestPlan({ normalizedUrl: "https://two.example/", hostname: "two.example" }),
  ]);

  assert.equal(maximumActive, 1);
  assert.deepEqual(seenHosts, ["one.example", "two.example"]);
  assert.equal(result.summary.evidenceProducedUrls, 2);
  assert.equal(result.summary.failedUrls, 0);
});

test("normalizes acquisition failure without HTML, headers, cookies, or body data", async () => {
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async () => createFailure(),
  });
  const result = await executor([createRequestPlan()]);
  const serialized = JSON.stringify(result);

  assert.equal(result.results[0].status, "acquisition_failed");
  assert.equal(result.results[0].derived_evidence, null);
  assert.equal(result.results[0].failure_reason, "network_error");
  assert.equal(result.results[0].error_code, "ECONNRESET");
  assert.equal(result.summary.allFailed, true);
  assert.equal(serialized.includes("body-marker-must-not-escape"), false);
  assert.equal(serialized.includes("admin-cookie=private"), false);
  assert.equal(serialized.includes("upstream private body detail"), false);
  assert.equal("headers" in result.results[0], false);
});

test("normalizes a helper exception without retaining its input or error message", async () => {
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async () => createSuccess("<title>throw-body-marker</title>"),
    deriveEvidence: () => {
      throw new Error("helper secret throw-body-marker");
    },
  });
  const result = await executor([createRequestPlan()]);
  const serialized = JSON.stringify(result);

  assert.equal(result.results[0].status, "evidence_failed_safely");
  assert.equal(result.results[0].error_code, "EVIDENCE_HELPER_FAILED");
  assert.equal(result.results[0].derived_evidence, null);
  assert.equal(result.summary.evidenceAttemptedUrls, 1);
  assert.equal(result.summary.allFailed, true);
  assert.equal(serialized.includes("throw-body-marker"), false);
  assert.equal(serialized.includes("helper secret"), false);
});

test("returns a safe all-failed summary after every URL has been attempted", async () => {
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async () => createFailure(),
  });
  const result = await executor([
    createRequestPlan({ normalizedUrl: "https://one.example/", hostname: "one.example" }),
    createRequestPlan({ normalizedUrl: "https://two.example/", hostname: "two.example" }),
  ]);

  assert.deepEqual(result.summary, {
    totalUrls: 2,
    attemptedUrls: 2,
    acquiredUrls: 0,
    evidenceAttemptedUrls: 0,
    evidenceProducedUrls: 0,
    failedUrls: 2,
    skippedUrls: 0,
    allFailed: true,
  });
});

test("maps an all-failed execution to a completed safe terminal state", () => {
  const terminalState = getManualStaticHtmlEvidenceTerminalState({
    totalUrls: 2,
    attemptedUrls: 2,
    acquiredUrls: 0,
    evidenceAttemptedUrls: 0,
    evidenceProducedUrls: 0,
    failedUrls: 2,
    skippedUrls: 0,
    allFailed: true,
  });

  assert.deepEqual(terminalState, {
    runStatus: "completed",
    executionStatus: "manual_static_html_derived_evidence_completed",
    reason: "manual_static_html_derived_evidence_all_failed",
  });
});

test("does not emit raw HTML to console output", async () => {
  const executor = createManualStaticHtmlEvidenceExecutor({
    acquireHtml: async () => createSuccess("<p>console-body-marker</p>"),
  });
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  const output = [];
  console.log = (...args) => output.push(args);
  console.info = (...args) => output.push(args);
  console.warn = (...args) => output.push(args);
  console.error = (...args) => output.push(args);

  try {
    await executor([createRequestPlan()]);
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  }

  assert.deepEqual(output, []);
});

test("keeps the helper free of database and candidate/public-tool writes", async () => {
  const source = await readFile(
    new URL("../lib/discovery-static-html-evidence-executor.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /supabase|\.from\(|\.insert\(|\.update\(|\.delete\(/i);
  assert.doesNotMatch(source, /discovered_tools|public\.tools/i);
});

test("keeps the existing metadata-fetch branch distinct in the manual claim route", async () => {
  const source = await readFile(
    new URL("../app/api/admin/discovery/runs/manual/claim/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /MANUAL_METADATA_FETCH_EXECUTION_MODE/);
  assert.match(source, /executeDiscoveryFetchMetadataOnly/);
  assert.match(source, /MANUAL_STATIC_HTML_DERIVED_EVIDENCE_EXECUTION_MODE/);
});
