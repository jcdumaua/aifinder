import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";

const nextServerTestLoader = new URL(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return {
      url: "data:text/javascript,export%20const%20NextResponse%20%3D%20%7B%20json%3A%20(data%2C%20init)%20%3D%3E%20Response.json(data%2C%20init)%20%7D%3B%20export%20class%20NextRequest%20extends%20Request%20%7B%7D%3B",
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
`)}`,
);

register(nextServerTestLoader, import.meta.url);
await import("./register-typescript-test-loader.mjs");

const {
  ADMIN_CSRF_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
} = await import("../lib/admin-auth.ts");
const {
  CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
} = await import("../lib/discovery/discovery-candidate-extraction-invocation.ts");
const { POST } = await import(
  "../app/api/admin/discovery/candidate-extraction/invoke/route.ts"
);

const ADMIN_SESSION_SECRET = "phase-10q-test-admin-session-secret";
const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

process.env.ADMIN_SESSION_SECRET = ADMIN_SESSION_SECRET;

function signSession(payload) {
  return createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

function createAdminSessionCookie() {
  const payload = `admin:${Date.now() + 60 * 60 * 1000}`;
  const signature = signSession(payload);

  return `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(
    `${payload}.${signature}`,
  )}`;
}

function createCookieHeader({ includeSession = true, includeCsrf = true } = {}) {
  const cookies = [];

  if (includeSession) cookies.push(createAdminSessionCookie());
  if (includeCsrf) cookies.push(`${ADMIN_CSRF_COOKIE_NAME}=${CSRF_TOKEN}`);

  return cookies.join("; ");
}

function createBody(overrides = {}) {
  return {
    discovery_source_id: SOURCE_ID,
    discovery_run_id: RUN_ID,
    audit_correlation_id: AUDIT_ID,
    invocation_reason: "Manual admin dry-run invocation route test.",
    dry_run: true,
    max_candidates: 5,
    source_scope: "single_run",
    schema_version: CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
    ...overrides,
  };
}

function createRequest({
  body = createBody(),
  includeSession = true,
  includeCsrf = true,
  csrfHeader = CSRF_TOKEN,
  headers = {},
} = {}) {
  return new Request(
    "https://aifinder.test/api/admin/discovery/candidate-extraction/invoke",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: createCookieHeader({ includeSession, includeCsrf }),
        ...(csrfHeader ? { "x-csrf-token": csrfHeader } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );
}

async function invokeRoute(options = {}) {
  const response = await POST(createRequest(options));
  const data = await response.json();

  return { response, data };
}

function assertNoRawPayloadLeak(value) {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw_payload"), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(serialized.includes("SUPABASE"), false);
}

test("anonymous request is rejected", async () => {
  const { response, data } = await invokeRoute({ includeSession: false });

  assert.equal(response.status, 401);
  assert.equal(data.error, "Unauthorized");
  assertNoRawPayloadLeak(data);
});

test("missing CSRF request is rejected", async () => {
  const { response, data } = await invokeRoute({
    includeCsrf: false,
    csrfHeader: null,
  });

  assert.equal(response.status, 403);
  assert.equal(data.error, "Security token missing or expired. Please log in again.");
  assertNoRawPayloadLeak(data);
});

test("invalid CSRF request is rejected", async () => {
  const { response, data } = await invokeRoute({
    csrfHeader:
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  });

  assert.equal(response.status, 403);
  assert.equal(data.error, "Security token missing or expired. Please log in again.");
  assertNoRawPayloadLeak(data);
});

test("valid dry-run admin request is accepted", async () => {
  const { response, data } = await invokeRoute();

  assert.equal(response.status, 200);
  assert.equal(data.accepted, true);
  assert.equal(data.rejected, false);
  assert.equal(data.dry_run, true);
  assert.equal(data.discovery_source_id, SOURCE_ID);
  assert.equal(data.discovery_run_id, RUN_ID);
  assert.equal(data.audit_correlation_id, AUDIT_ID);
  assert.equal(data.candidates_staged_count, 0);
  assert.equal(data.no_public_write_confirmed, true);
  assert.equal(data.no_discovered_write_confirmed, true);
  assert.equal(data.safety_flags.includes("dry_run_only"), true);
  assertNoRawPayloadLeak(data);
});

test("client-supplied admin identity is rejected", async () => {
  const { response, data } = await invokeRoute({
    body: createBody({ invoked_by_admin_user_id: "client-spoofed-admin" }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.code, "client_admin_identity_not_allowed");
  assertNoRawPayloadLeak(data);
});

test("dry_run false is rejected with live_invocation_not_enabled", async () => {
  const { response, data } = await invokeRoute({
    body: createBody({ dry_run: false }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.accepted, false);
  assert.equal(data.rejection_code, "live_invocation_not_enabled");
  assert.equal(data.dry_run, false);
  assert.equal(data.candidates_staged_count, 0);
  assertNoRawPayloadLeak(data);
});

test("invalid source and run IDs are rejected", async () => {
  const sourceResult = await invokeRoute({
    body: createBody({ discovery_source_id: "not-a-uuid" }),
  });
  assert.equal(sourceResult.response.status, 400);
  assert.equal(sourceResult.data.rejection_code, "invalid_discovery_source_id");
  assertNoRawPayloadLeak(sourceResult.data);

  const runResult = await invokeRoute({
    body: createBody({ discovery_run_id: "not-a-uuid" }),
  });
  assert.equal(runResult.response.status, 400);
  assert.equal(runResult.data.rejection_code, "invalid_discovery_run_id");
  assertNoRawPayloadLeak(runResult.data);
});

test("invalid schema version is rejected", async () => {
  const { response, data } = await invokeRoute({
    body: createBody({ schema_version: "candidate_extraction_invocation.v0" }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.rejection_code, "invalid_schema_version");
  assertNoRawPayloadLeak(data);
});

test("max candidate bound is rejected", async () => {
  const { response, data } = await invokeRoute({
    body: createBody({
      max_candidates: CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES + 1,
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.rejection_code, "max_candidates_out_of_bounds");
  assertNoRawPayloadLeak(data);
});

test("unsupported raw payload fields are rejected without echoing payload", async () => {
  const { response, data } = await invokeRoute({
    body: createBody({ raw_payload: "<script>secret=value</script>" }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.code, "unsupported_request_field");
  assertNoRawPayloadLeak(data);
});

test("rate-limit rejection returns a safe response", async () => {
  let lastResponse = null;
  let lastData = null;

  for (let index = 0; index < 20; index += 1) {
    const { response, data } = await invokeRoute({
      body: createBody({
        invocation_reason: `Manual admin rate-limit route test ${index}.`,
      }),
    });

    lastResponse = response;
    lastData = data;

    if (response.status === 429) break;
  }

  assert.equal(lastResponse.status, 429);
  assert.equal(lastData.error, "Too many admin requests. Please wait and try again.");
  assertNoRawPayloadLeak(lastData);
});

test("route source stays free of direct DB writes and audit writes", () => {
  const source = readFileSync(
    new URL(
      "../app/api/admin/discovery/candidate-extraction/invoke/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const forbiddenTokens = [
    ["create", "Client"].join(""),
    ["supa", "base"].join(""),
    [".insert", "("].join(""),
    [".update", "("].join(""),
    [".upsert", "("].join(""),
    [".delete", "("].join(""),
    [".from", "("].join(""),
    ["public", ".tools"].join(""),
    ["discovered", "_tools"].join(""),
    ["audit", "_events"].join(""),
    ["stageMapped", "ExtractionCandidate"].join(""),
    ["stageNormalized", "DiscoveryCandidate"].join(""),
  ];

  for (const token of forbiddenTokens) {
    assert.equal(source.includes(token), false);
  }
});
