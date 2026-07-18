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
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
  CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
} = await import("../lib/discovery/discovery-candidate-extraction-invocation.ts");
const { POST } = await import(
  "../app/api/admin/discovery/candidate-extraction/invoke/route.ts"
);
const { createCandidateExtractionInvokeHandler } = await import(
  "../app/api/admin/discovery/candidate-extraction/invoke/handler.ts"
);

const ALLOWED_RATE_LIMIT = {
  allowed: true,
  limit: 10,
  remaining: 9,
  resetAt: Date.now() + 10 * 60 * 1000,
  windowSeconds: 600,
};

const ADMIN_SESSION_SECRET = "phase-10q-test-admin-session-secret";
const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
let routeRequestCounter = 1;

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

function createAcceptedPreview(overrides = {}) {
  return {
    accepted: true,
    rejected: false,
    rejectionCode: null,
    previewStatus: "reviewable",
    preview: {
      candidateName: "Phase 14G Preview Candidate",
      candidateWebsiteUrl: "https://tool.example.com",
      categoryHint: "Productivity",
      pricingHint: "Free + Paid",
      confidenceBucket: "medium",
      evidenceSummary: "Server-revalidated route preview evidence.",
      sourceEvidenceLocator: "url_index:0",
      sourceUrlSnapshot: "https://source.example.com/review",
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
      auditCorrelationId: AUDIT_ID,
      ...(overrides.preview ?? {}),
    },
    safetyFlags: [
      "bounded_preview",
      "server_sanitized",
      "source_run_matched",
      "source_url_snapshot_validated",
      "no_public_write",
      "no_discovered_write",
      "no_raw_html",
      "no_llm_output",
    ],
    auditCorrelationId: AUDIT_ID,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== "preview"),
    ),
  };
}

function createRejectedPreview(overrides = {}) {
  return {
    accepted: false,
    rejected: true,
    rejectionCode: "preview_artifact_unavailable",
    previewStatus: "unavailable",
    preview: null,
    safetyFlags: [
      "no_public_write",
      "no_discovered_write",
      "no_raw_html",
      "no_llm_output",
    ],
    auditCorrelationId: null,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
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
        "x-forwarded-for": `203.0.113.${routeRequestCounter++}`,
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

async function invokeIsolatedRoute(options = {}) {
  const isolatedPost = createCandidateExtractionInvokeHandler({
    checkRateLimit() {
      return ALLOWED_RATE_LIMIT;
    },
    resolveLiveStagingOptions() {
      return {};
    },
  });
  const response = await isolatedPost(createRequest(options));
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

test("server-created route dependency can stage one mocked manual API candidate", async () => {
  const stagedCandidateId = "44444444-4444-4444-8444-444444444444";
  const calls = [];

  const livePost = createCandidateExtractionInvokeHandler({
    checkRateLimit() {
      return ALLOWED_RATE_LIMIT;
    },
    resolveLiveStagingOptions({ invocationInput, invokedByAdminUserId }) {
      assert.equal(invocationInput.dry_run, false);
      assert.equal(invocationInput.max_candidates, 1);
      assert.equal(invocationInput.source_scope, "single_run");
      assert.equal(invocationInput.discovery_source_id, SOURCE_ID);
      assert.equal(invocationInput.discovery_run_id, RUN_ID);
      assert.equal(invocationInput.audit_correlation_id, AUDIT_ID);

      return {
        liveStagingGate: {
          enabled: true,
          mode: CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
          phase: "phase-12c-route-test",
          maxCandidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
          sourceScope: "single_run",
          createdByServer: true,
          approvedExecutionRequired: true,
          auditCorrelationId: AUDIT_ID,
          discoverySourceId: SOURCE_ID,
          discoveryRunId: RUN_ID,
          actorId: invokedByAdminUserId,
        },
        getLiveStagingCandidate(providerInput) {
          assert.equal(providerInput.discoverySourceId, SOURCE_ID);
          assert.equal(providerInput.discoveryRunId, RUN_ID);
          assert.equal(providerInput.auditCorrelationId, AUDIT_ID);
          assert.equal(providerInput.dryRun, false);
          assert.equal(providerInput.maxCandidates, 1);
          assert.equal(providerInput.sourceScope, "single_run");

          return {
            discoverySourceId: "99999999-9999-4999-8999-999999999999",
            discoveryRunId: "88888888-8888-4888-8888-888888888888",
            sourceUrl: "https://example.com/source",
            sourceEvidenceLocator: "phase-12c-route-test",
            candidateName: "Phase 12C Route Candidate",
            candidateWebsiteUrl: "https://phase-12c-route.example.com",
            candidateDescription: "A safe mocked candidate for route live gate tests.",
            candidateCategoryHint: "Productivity",
            candidatePricingHint: "Free + Paid",
            evidenceSummary: "Mocked server-created route candidate input.",
            confidenceBucket: "medium",
            auditCorrelationId: "77777777-7777-4777-8777-777777777777",
          };
        },
        stageCandidate(input) {
          calls.push(input);

          return {
            ok: true,
            candidateId: stagedCandidateId,
            candidateStatus: "staged",
            discoveryRunId: input.discoveryRunId,
            discoverySourceId: input.discoverySourceId,
            auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
          };
        },
      };
    },
  });

  const response = await livePost(
    createRequest({
      body: createBody({
        dry_run: false,
        max_candidates: 1,
        source_scope: "single_run",
      }),
    }),
  );
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.accepted, true);
  assert.equal(data.rejected, false);
  assert.equal(data.dry_run, false);
  assert.equal(data.candidates_considered_count, 1);
  assert.equal(data.candidates_staged_count, 1);
  assert.equal(data.candidates_skipped_count, 0);
  assert.equal(data.discovery_source_id, SOURCE_ID);
  assert.equal(data.discovery_run_id, RUN_ID);
  assert.equal(data.audit_correlation_id, AUDIT_ID);
  assert.equal(data.no_public_write_confirmed, true);
  assert.equal(data.no_discovered_write_confirmed, true);
  assert.equal(data.safety_flags.includes("live_staging_gate_enabled"), true);
  assert.equal(data.safety_flags.includes("candidate_status_staged"), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].discoverySourceId, SOURCE_ID);
  assert.equal(calls[0].discoveryRunId, RUN_ID);
  assert.equal(calls[0].normalizedCandidate.discovery_run_id, RUN_ID);
  assert.equal(calls[0].normalizedCandidate.audit_correlation_id, AUDIT_ID);
  assert.equal(calls[0].normalizedCandidate.candidate_status, "staged");
  assertNoRawPayloadLeak(data);
});

test("default route resolver stages accepted preview through mocked preview dependencies", async () => {
  const stagedCandidateId = "55555555-5555-4555-8555-555555555555";
  const previewCalls = [];
  const stageCalls = [];

  const defaultWiredPost = createCandidateExtractionInvokeHandler({
    checkRateLimit() {
      return ALLOWED_RATE_LIMIT;
    },
    getCandidatePreview(input) {
      previewCalls.push(input);
      return createAcceptedPreview();
    },
    stageCandidate(input) {
      stageCalls.push(input);

      return {
        ok: true,
        candidateId: stagedCandidateId,
        candidateStatus: "staged",
        discoveryRunId: input.discoveryRunId,
        discoverySourceId: input.discoverySourceId,
        auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
      };
    },
  });

  const response = await defaultWiredPost(
    createRequest({
      body: createBody({
        invocation_reason: "Admin requested staged candidate from reviewable preview.",
        dry_run: false,
        max_candidates: 1,
        source_scope: "single_run",
      }),
    }),
  );
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.accepted, true);
  assert.equal(data.rejected, false);
  assert.equal(data.dry_run, false);
  assert.equal(data.candidates_considered_count, 1);
  assert.equal(data.candidates_staged_count, 1);
  assert.equal(data.candidates_skipped_count, 0);
  assert.equal(data.discovery_source_id, SOURCE_ID);
  assert.equal(data.discovery_run_id, RUN_ID);
  assert.equal(data.audit_correlation_id, AUDIT_ID);
  assert.equal(data.no_public_write_confirmed, true);
  assert.equal(data.no_discovered_write_confirmed, true);
  assert.equal(data.safety_flags.includes("live_staging_gate_enabled"), true);
  assert.equal(data.safety_flags.includes("candidate_status_staged"), true);
  assert.equal(previewCalls.length, 1);
  assert.equal(previewCalls[0].discoverySourceId, SOURCE_ID);
  assert.equal(previewCalls[0].discoveryRunId, RUN_ID);
  assert.equal(typeof previewCalls[0].requestingAdminActorId, "string");
  assert.equal(previewCalls[0].requestingAdminActorId.length > 0, true);
  assert.equal(stageCalls.length, 1);
  assert.equal(stageCalls[0].discoverySourceId, SOURCE_ID);
  assert.equal(stageCalls[0].discoveryRunId, RUN_ID);
  assert.equal(stageCalls[0].normalizedCandidate.discovery_run_id, RUN_ID);
  assert.equal(stageCalls[0].normalizedCandidate.audit_correlation_id, AUDIT_ID);
  assert.equal(stageCalls[0].normalizedCandidate.candidate_status, "staged");
  assert.equal(stageCalls[0].normalizedCandidate.source_url, "https://source.example.com/review");
  assert.equal(stageCalls[0].normalizedCandidate.candidate_website_url, "https://tool.example.com/");
  assertNoRawPayloadLeak(data);
});

test("default route resolver fails closed when preview is rejected", async () => {
  let previewCalled = false;
  let stageCalled = false;

  const defaultWiredPost = createCandidateExtractionInvokeHandler({
    checkRateLimit() {
      return ALLOWED_RATE_LIMIT;
    },
    getCandidatePreview() {
      previewCalled = true;
      return createRejectedPreview({
        rejectionCode: "preview_source_url_drift",
        previewStatus: "stale",
        auditCorrelationId: AUDIT_ID,
      });
    },
    stageCandidate() {
      stageCalled = true;
      throw new Error("stage should not be called");
    },
  });

  const response = await defaultWiredPost(
    createRequest({
      body: createBody({
        dry_run: false,
        max_candidates: 1,
        source_scope: "single_run",
      }),
    }),
  );
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.accepted, false);
  assert.equal(data.rejection_code, "live_invocation_not_enabled");
  assert.equal(data.candidates_staged_count, 0);
  assert.equal(previewCalled, true);
  assert.equal(stageCalled, false);
  assertNoRawPayloadLeak(data);
});

test("client URL override fields are rejected before resolver execution", async () => {
  const forbiddenFields = [
    "sourceUrl",
    "source_url",
    "sourceUrlSnapshot",
    "candidateWebsiteUrl",
  ];

  for (const field of forbiddenFields) {
    let resolverCalled = false;
    const isolatedPost = createCandidateExtractionInvokeHandler({
      checkRateLimit() {
        return ALLOWED_RATE_LIMIT;
      },
      resolveLiveStagingOptions() {
        resolverCalled = true;
        return {};
      },
    });

    const response = await isolatedPost(
      createRequest({
        body: createBody({
          dry_run: false,
          [field]: "https://client-override.example.com",
        }),
      }),
    );
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.code, "unsupported_request_field");
    assert.equal(resolverCalled, false);
    assertNoRawPayloadLeak(data);
  }
});

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
  const { response, data } = await invokeIsolatedRoute();

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
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({ invoked_by_admin_user_id: "client-spoofed-admin" }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.code, "client_admin_identity_not_allowed");
  assertNoRawPayloadLeak(data);
});

test("dry_run false is rejected with live_invocation_not_enabled", async () => {
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({ dry_run: false }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.accepted, false);
  assert.equal(data.rejection_code, "live_invocation_not_enabled");
  assert.equal(data.dry_run, false);
  assert.equal(data.candidates_staged_count, 0);
  assertNoRawPayloadLeak(data);
});

test("placeholder live staging approval phrase remains inactive at route boundary", async () => {
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({
      dry_run: false,
      invocation_reason: "Approve run candidate extraction live staging write",
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.accepted, false);
  assert.equal(data.rejection_code, "live_invocation_not_enabled");
  assert.equal(data.dry_run, false);
  assert.equal(data.candidates_staged_count, 0);
  assert.equal(data.no_public_write_confirmed, true);
  assert.equal(data.no_discovered_write_confirmed, true);
  assertNoRawPayloadLeak(data);
});

test("client body cannot activate a live staging gate", async () => {
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({
      dry_run: false,
      liveStagingGate: {
        enabled: true,
      },
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.code, "unsupported_request_field");
  assertNoRawPayloadLeak(data);
});

test("invalid source and run IDs are rejected", async () => {
  const sourceResult = await invokeIsolatedRoute({
    body: createBody({ discovery_source_id: "not-a-uuid" }),
  });
  assert.equal(sourceResult.response.status, 400);
  assert.equal(sourceResult.data.rejection_code, "invalid_discovery_source_id");
  assertNoRawPayloadLeak(sourceResult.data);

  const runResult = await invokeIsolatedRoute({
    body: createBody({ discovery_run_id: "not-a-uuid" }),
  });
  assert.equal(runResult.response.status, 400);
  assert.equal(runResult.data.rejection_code, "invalid_discovery_run_id");
  assertNoRawPayloadLeak(runResult.data);
});

test("invalid schema version is rejected", async () => {
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({ schema_version: "candidate_extraction_invocation.v0" }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.rejection_code, "invalid_schema_version");
  assertNoRawPayloadLeak(data);
});

test("max candidate bound is rejected", async () => {
  const { response, data } = await invokeIsolatedRoute({
    body: createBody({
      max_candidates: CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES + 1,
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(data.rejection_code, "max_candidates_out_of_bounds");
  assertNoRawPayloadLeak(data);
});

test("unsupported raw payload fields are rejected without echoing payload", async () => {
  const { response, data } = await invokeIsolatedRoute({
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
      headers: {
        "x-forwarded-for": "198.51.100.10",
      },
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
  const routeSource = readFileSync(
    new URL(
      "../app/api/admin/discovery/candidate-extraction/invoke/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const handlerSource = readFileSync(
    new URL(
      "../app/api/admin/discovery/candidate-extraction/invoke/handler.ts",
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
    assert.equal(routeSource.includes(token), false);
    assert.equal(handlerSource.includes(token), false);
  }

  assert.equal(routeSource.includes("createCandidateExtractionInvokeHandler"), true);
  assert.equal(routeSource.includes("./handler"), true);
  assert.equal(handlerSource.includes("createCandidateExtractionInvokeHandler"), true);
  assert.equal(handlerSource.includes("resolveCandidatePreviewLiveStagingOptions"), true);
  assert.equal(
    handlerSource.includes("discovery-candidate-preview-live-staging-resolver"),
    true,
  );
});
