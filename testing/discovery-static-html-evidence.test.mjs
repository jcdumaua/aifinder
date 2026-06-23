import assert from "node:assert/strict";
import test from "node:test";

const { deriveStaticHtmlEvidence } = await import(
  "../lib/discovery-static-html-evidence.ts"
);

const input = (html, overrides = {}) => ({
  html,
  normalizedUrl: "https://example.com/products/ai-helper",
  hostname: "example.com",
  ...overrides,
});

test("derives allowlisted title, metadata, canonical URL, and visible snippets", () => {
  const result = deriveStaticHtmlEvidence(
    input(`
      <html>
        <head>
          <title>Example AI Helper</title>
          <meta name="description" content="A careful AI writing assistant.">
          <meta property="og:title" content="Example OG Title">
          <meta property="og:description" content="Example OG description.">
          <link rel="canonical" href="/canonical">
        </head>
        <body>
          <h1>Write clearer product copy</h1>
          <p>Example helps teams generate draft product copy safely.</p>
        </body>
      </html>
    `)
  );

  assert.equal(result.extractionStatus, "derived");
  assert.equal(result.extractionVersion, "1");
  assert.equal(result.title, "Example AI Helper");
  assert.equal(result.metaDescription, "A careful AI writing assistant.");
  assert.equal(result.openGraphTitle, "Example OG Title");
  assert.equal(result.openGraphDescription, "Example OG description.");
  assert.equal(result.canonicalUrl, "https://example.com/canonical");
  assert.equal(result.homepageHeadlineSnippet, "Write clearer product copy");
  assert.match(result.visibleTextSnippet, /Example helps teams generate draft product copy safely\./);
  assert.equal(result.confidenceLabel, "tentative");
});

test("ignores scripts, styles, and comments when deriving visible evidence", () => {
  const result = deriveStaticHtmlEvidence(
    input(`
      <style>.hidden { display: none; } ignored-style-marker</style>
      <script>window.secret = "ignored-script-marker";</script>
      <!-- ignored-comment-marker -->
      <h2>Safe visible heading</h2>
      <p>Safe visible body copy.</p>
    `)
  );

  const serialized = JSON.stringify(result);

  assert.equal(result.homepageHeadlineSnippet, "Safe visible heading");
  assert.match(result.visibleTextSnippet, /Safe visible body copy\./);
  assert.equal(serialized.includes("ignored-script-marker"), false);
  assert.equal(serialized.includes("ignored-style-marker"), false);
  assert.equal(serialized.includes("ignored-comment-marker"), false);
});

test("detects bounded app-store and support link evidence with tentative hints", () => {
  const result = deriveStaticHtmlEvidence(
    input(`
      <h1>AI design copilot</h1>
      <p>Our AI agent helps automate image design workflows.</p>
      <a href="https://apps.apple.com/us/app/example/id123">App Store</a>
      <a href="https://play.google.com/store/apps/details?id=example">Google Play</a>
      <a href="/pricing">Plans</a>
      <a href="/support">Support</a>
      <a href="/docs/getting-started">Documentation</a>
    `)
  );

  assert.deepEqual(result.appStoreLinks, [
    "https://apps.apple.com/us/app/example/id123",
    "https://play.google.com/store/apps/details",
  ]);
  assert.deepEqual(result.pricingLinks, ["https://example.com/pricing"]);
  assert.deepEqual(result.contactLinks, ["https://example.com/support"]);
  assert.deepEqual(result.docsLinks, ["https://example.com/docs/getting-started"]);
  assert.deepEqual(result.categoryHints, ["image", "design", "agents"]);
  assert.deepEqual(result.aiToolRelevanceHints, ["ai", "agent", "automation", "copilot"]);
  assert.equal(result.confidenceLabel, "tentative");
});

test("truncates visible text to the requested safe length", () => {
  const result = deriveStaticHtmlEvidence(
    input("<p>One two three four five six seven eight nine ten.</p>", {
      maxSnippetLength: 16,
    })
  );

  assert.equal(result.visibleTextSnippet, "One two three…");
  assert.equal(result.truncated, true);
  assert.equal(result.safetyFlags.includes("html_truncated"), true);
});

test("removes queries and fragments from canonical and detected links", () => {
  const result = deriveStaticHtmlEvidence(
    input(`
      <link rel="canonical" href="/canonical?access_token=hidden#section">
      <a href="/pricing?api_key=hidden#plans">Pricing</a>
    `)
  );

  assert.equal(result.canonicalUrl, "https://example.com/canonical");
  assert.deepEqual(result.pricingLinks, ["https://example.com/pricing"]);
});

test("redacts obvious credential-like values from derived text", () => {
  const result = deriveStaticHtmlEvidence(
    input("<p>API_KEY=secret-value Keep this product description.</p>")
  );

  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("secret-value"), false);
  assert.match(result.visibleTextSnippet, /API_KEY=\[redacted\]/);
});

test("handles malformed and empty HTML with safe output", () => {
  const malformed = deriveStaticHtmlEvidence(input("<h1>Broken heading<p>Still readable"));
  const empty = deriveStaticHtmlEvidence(input("  "));

  assert.equal(malformed.extractionStatus, "derived");
  assert.equal(malformed.safetyFlags.includes("malformed_html_possible"), true);
  assert.equal(empty.extractionStatus, "empty");
  assert.deepEqual(empty.safetyFlags, [
    "html_empty",
    "no_title_found",
    "no_visible_text_found",
  ]);
  assert.equal(empty.visibleTextSnippet, null);
});

test("does not fetch or return raw, candidate, discovered, or public tool fields", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network access is forbidden in this helper");
  };

  try {
    const result = deriveStaticHtmlEvidence(
      input("<script>raw-secret-marker</script><p>Only safe text.</p>")
    );
    const serialized = JSON.stringify(result);

    assert.equal(serialized.includes("raw-secret-marker"), false);
    assert.equal("html" in result, false);
    assert.equal("rawHtml" in result, false);
    assert.equal("candidate" in result, false);
    assert.equal("discoveredTool" in result, false);
    assert.equal("publicTool" in result, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
