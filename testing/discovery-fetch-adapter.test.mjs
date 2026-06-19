import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  createDiscoveryFetchMetadataOnlyAdapter,
  DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES,
} = await import("../lib/discovery-fetch-adapter.ts");

const PUBLIC_DNS_RECORD = { address: "93.184.216.34", family: 4 };

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
    acceptedContentTypes: DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES,
    createdAt: "2026-06-19T00:00:00.000Z",
    ...overrides,
  };
}

function createResponse({
  statusCode = 200,
  headers = { "content-type": "text/html; charset=utf-8" },
  chunks = [],
  error = null,
}) {
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

      if (!response.destroyed) {
        response.emit("end");
      }
    });
  };

  return response;
}

function createTransport({ response, error } = {}) {
  const requests = [];

  return {
    requests,
    request(options, onResponse) {
      const request = new EventEmitter();
      request.destroyed = false;
      request.endCalled = false;
      request.end = () => {
        request.endCalled = true;
      };
      request.destroy = (destroyError) => {
        request.destroyed = true;

        if (destroyError) {
          queueMicrotask(() => request.emit("error", destroyError));
        }
      };

      requests.push({ options, request });

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
    response: createResponse({ chunks: [Buffer.from("metadata only")] }),
  }),
  resolveHostname,
} = {}) {
  return {
    adapter: createDiscoveryFetchMetadataOnlyAdapter({
      resolveHostname:
        resolveHostname || (async () => resolvedAddresses),
      request: transport.request,
    }),
    transport,
  };
}

test("rejects invalid fetch plans before DNS or transport", async () => {
  const { adapter, transport } = createAdapter();

  for (const plan of [
    createPlan({ protocol: "http:" }),
    createPlan({ method: "POST" }),
    createPlan({ redirectLimit: 1 }),
    createPlan({ normalizedUrl: "https://user:pass@example.com" }),
    createPlan({ normalizedUrl: "https://127.0.0.1", hostname: "127.0.0.1" }),
  ]) {
    const result = await adapter(plan);
    assert.equal(result.status, "fetch_failed_invalid_plan");
  }

  assert.equal(transport.requests.length, 0);
});

test("rejects private, IPv6, and mixed DNS answer sets", async () => {
  for (const resolvedAddresses of [
    [{ address: "10.0.0.1", family: 4 }],
    [{ address: "fc00::1", family: 6 }],
    [PUBLIC_DNS_RECORD, { address: "192.168.1.1", family: 4 }],
  ]) {
    const { adapter, transport } = createAdapter({ resolvedAddresses });
    const result = await adapter(createPlan());

    assert.equal(result.status, "fetch_failed_blocked_resolved_ip");
    assert.equal(result.metadata.dnsResolutionChecked, true);
    assert.equal(transport.requests.length, 0);
  }
});

test("pins a public resolved IP while preserving hostname TLS and Host behavior", async () => {
  const { adapter, transport } = createAdapter();
  const result = await adapter(createPlan());

  assert.equal(result.status, "fetch_completed_metadata_only");
  assert.equal(result.metadata.resolvedIp, "93.184.216.34");
  assert.equal(result.metadata.resolvedIpFamily, 4);
  assert.equal(result.metadata.dnsRebindingProtectionApplied, true);
  assert.equal(result.metadata.connectionPinnedToResolvedIp, true);
  assert.equal(transport.requests.length, 1);

  const [{ options, request }] = transport.requests;
  assert.equal(options.method, "GET");
  assert.equal(options.hostname, "example.com");
  assert.equal(options.servername, "example.com");
  assert.equal(options.headers.host, "example.com");
  assert.equal(options.headers["user-agent"], "AiFinder Discovery Engine/1.0");
  assert.equal(options.agent, false);
  assert.equal(request.endCalled, true);

  await new Promise((resolve, reject) =>
    options.lookup("ignored.example", {}, (error, address, family) => {
      if (error) return reject(error);
      assert.equal(address, "93.184.216.34");
      assert.equal(family, 4);
      resolve();
    })
  );
});

test("does not follow redirects and records a sanitized Location", async () => {
  const response = createResponse({
    statusCode: 302,
    headers: {
      location: "https://redirect.example/next?access_token=hidden#fragment",
    },
  });
  const transport = createTransport({ response });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan());

  assert.equal(result.status, "fetch_redirect_not_followed");
  assert.equal(result.metadata.httpStatus, 302);
  assert.equal(result.metadata.redirectLocation, "https://redirect.example/next");
  assert.equal(transport.requests.length, 1);
});

test("rejects unsupported or missing Content-Type without returning body data", async () => {
  for (const headers of [
    { "content-type": "application/json" },
    {},
  ]) {
    const transport = createTransport({
      response: createResponse({
        headers,
        chunks: [Buffer.from("body must not be returned")],
      }),
    });
    const { adapter } = createAdapter({ transport });
    const result = await adapter(createPlan());

    assert.equal(result.status, "fetch_failed_unsupported_content_type");
    assert.equal(JSON.stringify(result).includes("body must not be returned"), false);
  }
});

test("rejects oversized Content-Length before body read", async () => {
  const response = createResponse({
    headers: {
      "content-type": "text/plain",
      "content-length": "1025",
    },
    chunks: [Buffer.from("should not be read")],
  });
  const transport = createTransport({ response });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan({ responseSizeLimitBytes: 1_024 }));

  assert.equal(result.status, "fetch_failed_response_too_large");
  assert.equal(result.metadata.bytesRead, 0);
  assert.equal(result.metadata.responseTruncated, true);
  assert.equal(response.destroyed, true);
});

test("aborts an oversized streamed response without storing body text", async () => {
  const marker = "streamed-body-must-not-appear";
  const response = createResponse({
    headers: { "content-type": "text/plain" },
    chunks: [Buffer.from(marker)],
  });
  const transport = createTransport({ response });
  const { adapter } = createAdapter({ transport });
  const result = await adapter(createPlan({ responseSizeLimitBytes: 4 }));

  assert.equal(result.status, "fetch_failed_response_too_large");
  assert.equal(result.metadata.bytesRead, Buffer.byteLength(marker));
  assert.equal(result.metadata.responseTruncated, true);
  assert.equal(JSON.stringify(result).includes(marker), false);
});

test("returns timeout, network, and TLS failures without metadata leakage", async () => {
  const timeoutTransport = createTransport();
  const { adapter: timeoutAdapter } = createAdapter({ transport: timeoutTransport });
  const timeoutResult = await timeoutAdapter(createPlan({ timeoutMs: 5 }));
  assert.equal(timeoutResult.status, "fetch_failed_timeout");

  const networkTransport = createTransport({
    error: Object.assign(new Error("private network detail"), { code: "ECONNRESET" }),
  });
  const { adapter: networkAdapter } = createAdapter({ transport: networkTransport });
  const networkResult = await networkAdapter(createPlan());
  assert.equal(networkResult.status, "fetch_failed_network_error");
  assert.equal(JSON.stringify(networkResult).includes("private network detail"), false);

  const tlsTransport = createTransport({
    error: Object.assign(new Error("certificate detail"), {
      code: "ERR_TLS_CERT_ALTNAME_INVALID",
    }),
  });
  const { adapter: tlsAdapter } = createAdapter({ transport: tlsTransport });
  const tlsResult = await tlsAdapter(createPlan());
  assert.equal(tlsResult.status, "fetch_failed_tls_error");
  assert.equal(JSON.stringify(tlsResult).includes("certificate detail"), false);
});

test("returns metadata-only results for allowed 4xx and 5xx responses", async () => {
  for (const statusCode of [404, 503]) {
    const transport = createTransport({
      response: createResponse({ statusCode, chunks: [Buffer.from("not stored")] }),
    });
    const { adapter } = createAdapter({ transport });
    const result = await adapter(createPlan());

    assert.equal(result.status, "fetch_completed_metadata_only");
    assert.equal(result.metadata.httpStatus, statusCode);
  }
});

test("returns the approved metadata schema without extraction or body fields", async () => {
  const { adapter } = createAdapter();
  const result = await adapter(createPlan());

  assert.deepEqual(Object.keys(result.metadata).sort(), [
    "bytesRead",
    "connectionPinnedToResolvedIp",
    "contentLengthHeader",
    "contentType",
    "dnsRebindingProtectionApplied",
    "dnsResolutionChecked",
    "durationMs",
    "errorCode",
    "fetchFinishedAt",
    "fetchStartedAt",
    "hostname",
    "httpStatus",
    "method",
    "normalizedUrl",
    "redirectLimit",
    "redirectLocation",
    "requestedUrl",
    "resolvedIp",
    "resolvedIpFamily",
    "responseSizeLimitBytes",
    "responseTruncated",
    "timeoutMs",
    "userAgent",
  ]);
  assert.equal("body" in result.metadata, false);
  assert.equal("html" in result.metadata, false);
  assert.equal("title" in result.metadata, false);
  assert.equal("description" in result.metadata, false);
});

test("contains no discovery inserts, model calls, extraction, or scheduled-work logic", async () => {
  const source = await readFile(
    new URL("../lib/discovery-fetch-adapter.ts", import.meta.url),
    "utf8"
  );
  const forbiddenPattern = new RegExp(
    [
      "discovered" + "_tools",
      "open" + "ai",
      "anth" + "ropic",
      "gem" + "ini",
      "generate" + "Text",
      "generate" + "Object",
      "sched" + "uler",
      "cr" + "on",
      "ex" + "tract",
    ].join("|"),
    "i"
  );

  assert.doesNotMatch(source, forbiddenPattern);
});
