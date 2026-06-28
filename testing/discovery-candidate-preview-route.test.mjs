import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";

const nextServerMockUrl = `data:text/javascript,${encodeURIComponent(`
export const NextResponse = {
  json(data, init = {}) {
    return Response.json(data, init);
  },
};
`)}`;

register(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return {
      url: ${JSON.stringify(nextServerMockUrl)},
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
`)}`,
  import.meta.url,
);

await import("./register-typescript-test-loader.mjs");

const routeModule = await import(
  "../app/api/admin/discovery/runs/[id]/candidate-preview/route.ts"
);

const { createCandidatePreviewRouteHandler } = routeModule;

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

function createRequest(path = `/api/admin/discovery/runs/${RUN_ID}/candidate-preview?source_id=${SOURCE_ID}`) {
  return new Request(`https://aifinder.test${path}`, {
    method: "GET",
  });
}

function createContext(id = RUN_ID) {
  return {
    params: Promise.resolve({
      id,
    }),
  };
}

function createAdminSession(overrides = {}) {
  return {
    isAdmin: true,
    actor: {
      id: "admin-user-123",
      label: "Admin User",
    },
    errors: [],
    ...overrides,
  };
}

function createAcceptedProviderResult(overrides = {}) {
  return {
    accepted: true,
    rejected: false,
    rejectionCode: null,
    previewStatus: "reviewable",
    preview: {
      candidateName: "Example AI Tool",
      candidateWebsiteUrl: "https://tool.example.com/",
      categoryHint: "Productivity",
      pricingHint: "Free + Paid",
      confidenceBucket: "medium",
      evidenceSummary: "Safe bounded preview summary.",
      sourceEvidenceLocator: "url_index:0",
      discoverySourceId: SOURCE_ID,
      discoveryRunId: RUN_ID,
      auditCorrelationId: AUDIT_ID,
    },
    safetyFlags: [
      "server_sanitized",
      "no_public_write",
      "no_discovered_write",
      "no_raw_html",
      "no_llm_output",
    ],
    auditCorrelationId: AUDIT_ID,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
    ...overrides,
  };
}

function createRejectedProviderResult(overrides = {}) {
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

function createHandler({
  session = createAdminSession(),
  providerResult = createAcceptedProviderResult(),
  providerThrows = false,
  calls = [],
} = {}) {
  return createCandidatePreviewRouteHandler({
    verifySession() {
      return session;
    },
    async getCandidatePreview(input) {
      calls.push(input);

      if (providerThrows) {
        throw new Error("provider failed");
      }

      return providerResult;
    },
  });
}

async function readJson(response) {
  return response.json();
}

function assertNoStoreNosniff(response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}

function assertNoRawPayloadLeak(value) {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes("created_at"), false);
  assert.equal(serialized.includes("updated_at"), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("csrf"), false);
  assert.equal(serialized.includes("sqlstate"), false);
  assert.equal(serialized.includes("<script"), false);
}

test("route exports GET only", () => {
  assert.equal(typeof routeModule.GET, "function");
  assert.equal("POST" in routeModule, false);
});

test("unauthenticated request returns 401 and does not call provider", async () => {
  const calls = [];
  const handler = createHandler({
    session: {
      isAdmin: false,
      actor: null,
      errors: ["invalid_session"],
    },
    calls,
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 401);
  assert.equal(body.error, "Unauthorized");
  assert.equal(calls.length, 0);
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("missing server-derived admin actor returns 403", async () => {
  const calls = [];
  const handler = createHandler({
    session: createAdminSession({
      actor: {
        id: " ",
        label: " ",
      },
    }),
    calls,
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 403);
  assert.equal(body.code, "missing_admin_identity");
  assert.equal(calls.length, 0);
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("route derives admin actor from session id and ignores client query identity", async () => {
  const calls = [];
  const handler = createHandler({ calls });

  const response = await handler(
    createRequest(
      `/api/admin/discovery/runs/${RUN_ID}/candidate-preview?source_id=${SOURCE_ID}&requestingAdminActorId=spoofed-client`,
    ),
    createContext(),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestingAdminActorId, "admin-user-123");
  assert.equal(calls[0].discoveryRunId, RUN_ID);
  assert.equal(calls[0].discoverySourceId, SOURCE_ID);
  assert.equal(body.data.accepted, true);
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("route falls back to session actor label when id is unavailable", async () => {
  const calls = [];
  const handler = createHandler({
    session: createAdminSession({
      actor: {
        id: null,
        label: "Admin Label",
      },
    }),
    calls,
  });

  const response = await handler(createRequest(), createContext());

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestingAdminActorId, "Admin Label");
  assertNoStoreNosniff(response);
});

test("missing source id returns provider safe 400 result", async () => {
  const calls = [];
  const handler = createHandler({
    calls,
    providerResult: createRejectedProviderResult({
      rejectionCode: "missing_discovery_source_id",
      previewStatus: "unavailable",
    }),
  });

  const response = await handler(
    createRequest(`/api/admin/discovery/runs/${RUN_ID}/candidate-preview`),
    createContext(),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].discoverySourceId, "");
  assert.equal(body.data.rejectionCode, "missing_discovery_source_id");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("invalid or missing run id returns provider safe 400 result", async () => {
  const calls = [];
  const handler = createHandler({
    calls,
    providerResult: createRejectedProviderResult({
      rejectionCode: "missing_discovery_run_id",
      previewStatus: "unavailable",
    }),
  });

  const response = await handler(createRequest(), createContext(""));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].discoveryRunId, "");
  assert.equal(body.data.rejectionCode, "missing_discovery_run_id");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("accepted provider result returns 200 with safe data wrapper", async () => {
  const handler = createHandler();

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.accepted, true);
  assert.equal(body.data.rejected, false);
  assert.equal(body.data.previewStatus, "reviewable");
  assert.equal(body.data.preview.candidateName, "Example AI Tool");
  assert.equal(body.data.noPublicWriteConfirmed, true);
  assert.equal(body.data.noDiscoveredWriteConfirmed, true);
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("unavailable provider result returns 200 application state", async () => {
  const handler = createHandler({
    providerResult: createRejectedProviderResult({
      rejectionCode: "preview_artifact_unavailable",
      previewStatus: "unavailable",
    }),
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.accepted, false);
  assert.equal(body.data.previewStatus, "unavailable");
  assert.equal(body.data.rejectionCode, "preview_artifact_unavailable");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("blocked provider result returns 200 application state", async () => {
  const handler = createHandler({
    providerResult: createRejectedProviderResult({
      rejectionCode: "preview_artifact_blocked",
      previewStatus: "blocked",
      auditCorrelationId: AUDIT_ID,
    }),
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.previewStatus, "blocked");
  assert.equal(body.data.rejectionCode, "preview_artifact_blocked");
  assert.equal(body.data.auditCorrelationId, AUDIT_ID);
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("stale provider result returns 200 application state", async () => {
  const handler = createHandler({
    providerResult: createRejectedProviderResult({
      rejectionCode: "preview_artifact_stale",
      previewStatus: "stale",
    }),
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.previewStatus, "stale");
  assert.equal(body.data.rejectionCode, "preview_artifact_stale");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("ambiguous provider result returns 200 application state", async () => {
  const handler = createHandler({
    providerResult: createRejectedProviderResult({
      rejectionCode: "preview_artifact_ambiguous",
      previewStatus: "blocked",
    }),
  });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.previewStatus, "blocked");
  assert.equal(body.data.rejectionCode, "preview_artifact_ambiguous");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("provider exception returns generic 500", async () => {
  const handler = createHandler({ providerThrows: true });

  const response = await handler(createRequest(), createContext());
  const body = await readJson(response);

  assert.equal(response.status, 500);
  assert.equal(body.error, "Candidate preview request failed.");
  assertNoStoreNosniff(response);
  assertNoRawPayloadLeak(body);
});

test("route source stays read-only and avoids CSRF/staging helpers", () => {
  const source = readFileSync(
    "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
    "utf8",
  );

  assert.equal(source.includes("verifyAdminCsrfRequest"), false);
  assert.equal(source.includes("invokeCandidateExtractionStagingPipeline"), false);
  assert.equal(source.includes("stageNormalizedDiscoveryCandidate"), false);
  assert.equal(source.includes(".insert("), false);
  assert.equal(source.includes(".upsert("), false);
  assert.equal(source.includes(".update("), false);
  assert.equal(source.includes(".delete("), false);
  assert.equal(source.includes("export async function POST"), false);
  assert.equal(source.includes("export const POST"), false);
});
