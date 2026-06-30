import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const routePath = path.resolve(
  "app/api/admin/discovery/candidate-staging-queue/route.ts",
);
const source = readFileSync(routePath, "utf8");

for (const forbiddenExport of [
  "export async function POST",
  "export async function PUT",
  "export async function PATCH",
  "export async function DELETE",
  "export const POST",
  "export const PUT",
  "export const PATCH",
  "export const DELETE",
]) {
  assert.equal(source.includes(forbiddenExport), false, `${forbiddenExport} must not exist`);
}

for (const pattern of [
  ".insert(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".rpc(",
]) {
  assert.equal(source.includes(pattern), false, `${pattern} must not exist in route source`);
}

const testableSource = `
const NextResponse = {
  json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      status: init.status || 200,
      headers: {
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    });
  },
};
${source.replace(/^import[\s\S]*?;\n/gm, "")}
`;

const transpiled = ts.transpileModule(testableSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    strict: true,
  },
}).outputText;

const tempModulePath = path.join(
  tmpdir(),
  `aifinder-phase-14y-candidate-staging-queue-route-${process.pid}-${Date.now()}.mjs`,
);

writeFileSync(tempModulePath, transpiled);

let moduleUnderTest;
try {
  moduleUnderTest = await import(pathToFileURL(tempModulePath).href);
} finally {
  unlinkSync(tempModulePath);
}

const { createCandidateStagingQueueReadHandler } = moduleUnderTest;

const adminSession = {
  isAdmin: true,
  actor: {
    id: null,
    label: "AiFinder Admin",
  },
  errors: [],
};

const unauthenticatedSession = {
  isAdmin: false,
  actor: null,
  errors: ["Admin session cookie is missing."],
};

const fakeClient = {
  from() {
    throw new Error("The route test should not query the fake client directly.");
  },
};

const baseItem = {
  candidateId: "11111111-1111-4111-8111-111111111111",
  candidateName: "Active Queue Tool",
  candidateStatus: "staged",
  candidateWebsiteUrl: "https://example.com/active-tool",
  candidateCategoryHint: "Productivity",
  candidatePricingHint: "Free",
  candidateDescription: "A safe active candidate.",
  confidenceBucket: "medium",
  duplicateCheckStatus: "unchecked",
  duplicateSignalTypes: ["domain"],
  riskFlags: [],
  discoverySourceId: "22222222-2222-4222-8222-222222222222",
  discoveryRunId: "33333333-3333-4333-8333-333333333333",
  auditCorrelationId: "44444444-4444-4444-8444-444444444444",
  sourceUrl: "https://example.com/",
  sourceDomain: "example.com",
  sourceEvidenceKind: "preview_artifact",
  sourceEvidenceLocator: "phase14y-test",
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
};

function createReadError(code, message = "unsafe raw database stack secret") {
  const error = new Error(message);
  error.code = code;
  error.stack = "service-role-key raw stack trace should not be returned";
  return error;
}

function createHandler({
  session = adminSession,
  listQueueItems,
  getClient,
} = {}) {
  const calls = [];
  let getClientCalls = 0;

  const handler = createCandidateStagingQueueReadHandler({
    verifyAdminSession() {
      return session;
    },
    getClient:
      getClient ||
      (() => {
        getClientCalls += 1;
        return fakeClient;
      }),
    listQueueItems:
      listQueueItems ||
      (async (input, options) => {
        calls.push({ input, client: options.client });

        return {
          items: [baseItem],
          nextCursor: null,
          hasNextPage: false,
          limit: 25,
          sortKey: "created_at",
          sortDirection: "desc",
          appliedStatuses: ["staged", "needs_review", "duplicate_suspected"],
          totalCount: 1,
        };
      }),
  });

  return {
    handler,
    calls,
    getClientCalls: () => getClientCalls,
  };
}

async function readJson(response) {
  return {
    status: response.status,
    body: await response.json(),
    cacheControl: response.headers.get("cache-control"),
    contentTypeOptions: response.headers.get("x-content-type-options"),
  };
}

async function callHandler(handler, query = "") {
  return readJson(
    await handler(
      new Request(
        `http://localhost/api/admin/discovery/candidate-staging-queue${query}`,
      ),
    ),
  );
}

async function expectRouteError(query, expectedCode, expectedStatus) {
  const { handler } = createHandler({
    listQueueItems: async () => {
      throw createReadError(expectedCode);
    },
  });

  const response = await callHandler(handler, query);

  assert.equal(response.status, expectedStatus);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.error.code, expectedCode);
  assert.equal(
    JSON.stringify(response.body).includes("service-role-key"),
    false,
    "safe error response must not leak stack traces or secrets",
  );
  assert.equal(
    JSON.stringify(response.body).includes("raw database"),
    false,
    "safe error response must not leak raw error messages",
  );
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("GET unauthenticated request fails with 401 unauthorized before client creation", async () => {
  const { handler, calls, getClientCalls } = createHandler({
    session: unauthenticatedSession,
  });

  const response = await callHandler(handler);

  assert.equal(response.status, 401);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.error.code, "unauthorized");
  assert.equal(calls.length, 0);
  assert.equal(getClientCalls(), 0);
});

test("GET admin request calls listDiscoveryCandidateStagingQueueItems with defaults", async () => {
  const { handler, calls, getClientCalls } = createHandler();

  const response = await callHandler(handler);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.items.length, 1);
  assert.equal(response.body.items[0].candidateId, baseItem.candidateId);
  assert.deepEqual(response.body.appliedStatuses, [
    "staged",
    "needs_review",
    "duplicate_suspected",
  ]);
  assert.equal(response.body.totalCount, 1);
  assert.equal(response.body.nextCursor, null);
  assert.equal(response.body.hasNextPage, false);
  assert.equal(response.body.limit, 25);
  assert.equal(response.body.sortKey, "created_at");
  assert.equal(response.body.sortDirection, "desc");
  assert.equal(response.cacheControl, "no-store");
  assert.equal(response.contentTypeOptions, "nosniff");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].client, fakeClient);
  assert.deepEqual(calls[0].input, {});
  assert.equal(getClientCalls(), 1);
});

test("GET comma-separated statuses are parsed for the helper", async () => {
  const { handler, calls } = createHandler();

  const response = await callHandler(
    handler,
    "?statuses=staged,needs_review,duplicate_suspected",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].input.statuses, [
    "staged",
    "needs_review",
    "duplicate_suspected",
  ]);
});

test("GET optional filters are passed through to the helper", async () => {
  const { handler, calls } = createHandler();

  const response = await callHandler(
    handler,
    "?search=Example&discoverySourceId=22222222-2222-4222-8222-222222222222&discoveryRunId=33333333-3333-4333-8333-333333333333&auditCorrelationId=44444444-4444-4444-8444-444444444444&duplicateCheckStatus=unchecked&confidenceBucket=medium&limit=25&cursor=safe-page-token&sortKey=updated_at&sortDirection=asc",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].input, {
    search: "Example",
    discoverySourceId: "22222222-2222-4222-8222-222222222222",
    discoveryRunId: "33333333-3333-4333-8333-333333333333",
    auditCorrelationId: "44444444-4444-4444-8444-444444444444",
    duplicateCheckStatus: "unchecked",
    confidenceBucket: "medium",
    limit: 25,
    cursor: "safe-page-token",
    sortKey: "updated_at",
    sortDirection: "asc",
  });
});

test("GET archived status maps helper invalid_status_filter to 400", async () => {
  let capturedInput = null;
  const { handler } = createHandler({
    listQueueItems: async (input) => {
      capturedInput = input;
      throw createReadError("invalid_status_filter");
    },
  });

  const response = await callHandler(handler, "?statuses=archived");

  assert.deepEqual(capturedInput.statuses, ["archived"]);
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "invalid_status_filter");
});

test("GET rejected status maps helper invalid_status_filter to 400", async () => {
  await expectRouteError("?statuses=rejected", "invalid_status_filter", 400);
});

test("GET invalid limit maps helper invalid_limit to 400", async () => {
  await expectRouteError("?limit=abc", "invalid_limit", 400);
});

test("GET invalid sortKey maps helper invalid_sort_key to 400", async () => {
  await expectRouteError("?sortKey=candidate_name", "invalid_sort_key", 400);
});

test("GET invalid sortDirection maps helper invalid_sort_direction to 400", async () => {
  await expectRouteError("?sortDirection=sideways", "invalid_sort_direction", 400);
});

test("GET invalid UUID maps helper invalid_uuid_filter to 400", async () => {
  await expectRouteError("?discoveryRunId=not-a-uuid", "invalid_uuid_filter", 400);
});

test("GET cursor maps helper cursor errors to 400 safely", async () => {
  await expectRouteError(
    "?cursor=future-cursor",
    "candidate_queue_invalid_cursor",
    400,
  );
  await expectRouteError(
    "?cursor=mismatch",
    "candidate_queue_cursor_mismatch",
    400,
  );
  await expectRouteError(
    "?cursor=unsupported",
    "candidate_queue_cursor_version_unsupported",
    400,
  );
});

test("GET helper failure maps to 500 candidate_queue_read_failed safely", async () => {
  await expectRouteError("", "candidate_queue_read_failed", 500);
});

test("GET unknown helper error maps to 500 candidate_queue_read_failed safely", async () => {
  const { handler } = createHandler({
    listQueueItems: async () => {
      throw new Error("raw stack secret");
    },
  });

  const response = await callHandler(handler);

  assert.equal(response.status, 500);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.error.code, "candidate_queue_read_failed");
  assert.equal(JSON.stringify(response.body).includes("raw stack secret"), false);
});

test("route source keeps GET-only and mutation-free boundaries", () => {
  assert.equal(source.includes("export const GET = createCandidateStagingQueueReadHandler();"), true);
  assert.equal(source.includes("export const POST"), false);
  assert.equal(source.includes("export const PUT"), false);
  assert.equal(source.includes("export const PATCH"), false);
  assert.equal(source.includes("export const DELETE"), false);
});

for (const { name, fn } of tests) {
  await fn();
  console.log(`ok - ${name}`);
}

console.log(`\nPhase 14Y candidate staging queue API route tests passed: ${tests.length}/${tests.length}`);
