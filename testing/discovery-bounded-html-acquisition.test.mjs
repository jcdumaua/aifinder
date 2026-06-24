import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  createDiscoveryFetchHtmlAdapter,
  DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES,
} = await import("../lib/discovery-bounded-html-acquisition.ts");

const PUBLIC_DNS_RECORD = { address: "93.184.216.34", family: 4 };
const FIXED_NOW = () => new Date("2026-06-23T00:00:00.000Z");

function createPlan(overrides = {}) {
  return {
    normalizedUrl: "https://example.com/path?query=1",
    hostname: "example.com",
    protocol: "https:",
    method: "GET",
    timeoutMs: 50,
    redirectLimit: 0,
    responseSizeLimitBytes: 1_024,
    userAgent: "AiFinder Discovery Engine/1.0",
    acceptedContentTypes: DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES,
    createdAt: "2026-06-23T00:00:00.000Z",
    ...overrides,
  };
}

function createResponse({
  statusCode = 200,
  headers = { "content-type": "text/html; charset=utf-8" },
  chunks = [],
  error = null,
} = {}) {
  const response = new EventEmitter();
  response.statusCode = statusCode;
  response.headers = headers;
  response.destroyed = false;
  response.destroy = () => {
    response.destroyed = true;
  };
  response.start = () => {
    queueMicrotask(() => {
      if (error) {
        response.emit("error", error);
        return;
      }

      for (const chunk of chunks) {
        if (response.destroyed) return;
        response.emit("data", chunk);
      }

      if (!response.destroyed) response.emit("end");
    });
  };

  return response;
}

function createTransport({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    request(options, onResponse) {
      const request = new EventEmitter();
      request.destroyed = false;
      request.endCalled = false;
      request.end = () => {
        request.endCalled = true;
      };
      request.destroy = () => {
        request.destroyed = true;
      };
      calls.push({ options, request });

      queueMicrotask(() => {
        if (error) {
          request.emit("error", error);
          return;
        }

        if (response) {
          onResponse(response);
          response.start();
        }
      });

      return request;
    },
  };
}

function createAdapter({
  resolvedAddresses = [PUBLIC_DNS_RECORD],
  transport = createTransport({
    response: createResponse({ chunks: [Buffer.from("<h1>Example</h1>")] }),
  }),
  resolveHostname,
} = {}) {
  return {
    adapter: createDiscoveryFetchHtmlAdapter({
      resolveHostname: resolveHostname || (async () => resolvedAddresses),
      request: transport.request,
      now: FIXED_NOW,
    }),
    transport,
  };
}

test("acquires bounded HTML through injected DNS and transport dependencies", async () => {
  const html = "<html><body><h1>Safe page</h1></body></html>";
  const transport = createTransport({
    response: createResponse({ chunks: [Buffer.from(html)] }),
  });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan());

  assert.equal(result.ok, true);
  assert.equal(result.status, "fetch_completed_html_acquired");
  assert.equal(result.html, html);
  assert.equal(result.metadata.normalizedUrl, "https://example.com/path");
  assert.equal(result.metadata.contentType, "text/html");
  assert.equal(result.metadata.bytesRead, Buffer.byteLength(html));
  assert.equal(result.metadata.connectionPinnedToResolvedIp, true);
  assert.equal(transport.calls.length, 1);

  const [{ options, request }] = transport.calls;
  assert.equal(options.method, "GET");
  assert.equal(options.hostname, "example.com");
  assert.equal(options.servername, "example.com");
  assert.equal(options.agent, false);
  assert.equal(options.headers.cookie, undefined);
  assert.equal(options.headers.authorization, undefined);
  assert.equal(request.endCalled, true);
});

test("returns no HTML or body data when a streamed response exceeds the byte cap", async () => {
  const bodyMarker = "private-body-must-not-escape";
  const response = createResponse({ chunks: [Buffer.from(bodyMarker)] });
  const { adapter } = createAdapter({ transport: createTransport({ response }) });
  const result = await adapter(createPlan({ responseSizeLimitBytes: 4 }));

  assert.equal(result.ok, false);
  assert.equal(result.status, "fetch_failed_response_too_large");
  assert.equal("html" in result, false);
  assert.equal(response.destroyed, true);
  assert.equal(result.metadata.responseTruncated, true);
  assert.equal(JSON.stringify(result).includes(bodyMarker), false);
});

test("fails invalid or non-HTTPS plans before injected DNS or transport", async () => {
  const { adapter, transport } = createAdapter();

  for (const plan of [
    createPlan({ normalizedUrl: "http://example.com", protocol: "http:" }),
    createPlan({ normalizedUrl: "not-a-valid-url" }),
    createPlan({ normalizedUrl: "https://user:pass@example.com" }),
  ]) {
    const result = await adapter(plan);
    assert.equal(result.ok, false);
    assert.equal(result.status, "fetch_failed_invalid_plan");
    assert.equal("html" in result, false);
  }

  assert.equal(transport.calls.length, 0);
});

test("rejects non-HTML content without exposing the body or response headers", async () => {
  const bodyMarker = "json-body-secret-marker";
  const transport = createTransport({
    response: createResponse({
      headers: {
        "content-type": "application/json",
        "set-cookie": "admin-cookie=private",
        "x-secret": "not-allowed",
      },
      chunks: [Buffer.from(bodyMarker)],
    }),
  });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan());
  const serialized = JSON.stringify(result);

  assert.equal(result.ok, false);
  assert.equal(result.status, "fetch_failed_unsupported_content_type");
  assert.equal("html" in result, false);
  assert.equal(serialized.includes(bodyMarker), false);
  assert.equal(serialized.includes("admin-cookie"), false);
  assert.equal(serialized.includes("not-allowed"), false);
  assert.equal("headers" in result.metadata, false);
});

test("rejects redirects when the plan redirect limit is zero", async () => {
  const transport = createTransport({
    response: createResponse({
      statusCode: 302,
      headers: {
        location: "https://redirect.example/next?access_token=hidden#fragment",
      },
    }),
  });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan());

  assert.equal(result.ok, false);
  assert.equal(result.status, "fetch_redirect_not_followed");
  assert.equal("html" in result, false);
  assert.equal(result.metadata.redirectLocation, "https://redirect.example/next");
});

test("returns a bounded timeout failure with no HTML", async () => {
  const { adapter } = createAdapter({ transport: createTransport() });
  const result = await adapter(createPlan({ timeoutMs: 5 }));

  assert.equal(result.ok, false);
  assert.equal(result.status, "fetch_failed_timeout");
  assert.equal(result.reason, "fetch_timeout");
  assert.equal("html" in result, false);
  assert.equal(result.metadata.errorCode, "TIMEOUT");
});

test("sanitizes transport failures without body, cookies, headers, secrets, or stacks", async () => {
  const transport = createTransport({
    error: Object.assign(
      new Error("private response body admin-cookie=hidden api_key=super-secret"),
      { code: "ECONNRESET" }
    ),
  });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan());
  const serialized = JSON.stringify(result);

  assert.equal(result.ok, false);
  assert.equal(result.status, "fetch_failed_network_error");
  assert.equal(result.metadata.errorCode, "ECONNRESET");
  assert.equal("html" in result, false);
  assert.equal(serialized.includes("private response body"), false);
  assert.equal(serialized.includes("admin-cookie"), false);
  assert.equal(serialized.includes("super-secret"), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal("headers" in result.metadata, false);
});

test("does not write acquired HTML to console output", async () => {
  const html = "<p>console-body-marker</p>";
  const { adapter } = createAdapter({
    transport: createTransport({
      response: createResponse({ chunks: [Buffer.from(html)] }),
    }),
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
    const result = await adapter(createPlan());
    assert.equal(result.ok, true);
    assert.equal(result.html, html);
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  }

  assert.deepEqual(output, []);
});
