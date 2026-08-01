#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(defaultSourceRoot);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error("usage: admin-discovery-explicit-mutation-transaction-synthetic.test.mjs [--source-root <dir>]");
  }
  return realpathSync(path.resolve(argv[1]));
}

const sourceRoot = parseSourceRoot(process.argv.slice(2));
const capabilityLedger = {
  network: 0,
  env: 0,
  realClients: 0,
  database: 0,
  storage: 0,
};
const originalFetch = globalThis.fetch;
globalThis.__AIFINDER_DISCOVERY_FABRICATED_CAPABILITY_LEDGER__ = capabilityLedger;
globalThis.fetch = async function blockedExternalFetch() {
  capabilityLedger.network += 1;
  throw new Error("external network access is forbidden in fabricated transaction tests");
};

const routeRuntimeTestLoader = new URL(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return {
      url: "data:text/javascript,export%20const%20NextResponse%20%3D%20%7B%20json%3A%20(data%2C%20init)%20%3D%3E%20Response.json(data%2C%20init)%20%7D%3B%20export%20class%20NextRequest%20extends%20Request%20%7B%7D%3B",
      shortCircuit: true,
    };
  }

  if (specifier.includes("public-live-route-safety")) {
    const source = 'export class PublicLiveRouteSafetyError extends Error { constructor(code) { super(code); this.code = code; } } export async function readBoundedRequestBody(request, maximumBytes) { const bytes = new Uint8Array(await request.arrayBuffer()); if (bytes.byteLength > maximumBytes) throw new PublicLiveRouteSafetyError("request_body_too_large"); return new TextDecoder().decode(bytes); } export function parseBoundedJsonBody(body) { try { return JSON.parse(body); } catch { throw new PublicLiveRouteSafetyError("invalid_json_body"); } }';
    return {
      url: "data:text/javascript," + encodeURIComponent(source),
      shortCircuit: true,
    };
  }

  if (specifier.includes("supabase-admin")) {
    const source = 'export const supabaseAdmin = { from() { const ledger = globalThis.__AIFINDER_DISCOVERY_FABRICATED_CAPABILITY_LEDGER__; if (ledger) { ledger.realClients += 1; ledger.database += 1; } throw new Error("fabricated transaction client was not injected"); } };';
    return {
      url: "data:text/javascript," + encodeURIComponent(source),
      shortCircuit: true,
    };
  }

  if (specifier.includes("admin-auth")) {
    const source = 'export function verifyAdminSession() { return { isAdmin: true, actor: { id: "synthetic-admin", label: "Synthetic Admin" }, errors: [] }; } export function verifyAdminCsrfRequest() { return true; }';
    return {
      url: "data:text/javascript," + encodeURIComponent(source),
      shortCircuit: true,
    };
  }

  if (specifier.includes("admin-rate-limit")) {
    const source = 'export const ADMIN_RATE_LIMIT_ACTIONS = { discoveryCandidateDecisionMutation: "candidate-decision", discoveryToolDuplicate: "tool-duplicate", discoveryToolStatus: "tool-status", discoveryToolBulkStatus: "tool-bulk-status", discoveryManualIntake: "manual-intake", discoveryManualCrawlerRun: "manual-run", discoveryManualCrawlerExecutorRun: "manual-claim", discoverySourceUpdate: "source-update", discoverySourceCreate: "source-create" }; export function checkAdminRateLimit() { return { allowed: true, limit: 20, remaining: 19, resetAt: Date.now() + 60000, windowSeconds: 60 }; } export function getAdminRateLimitResponseData(result) { return { error: "Rate limit exceeded.", retryAfterSeconds: result.retryAfterSeconds || 1 }; }';
    return {
      url: "data:text/javascript," + encodeURIComponent(source),
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
`)}`,
);

register(routeRuntimeTestLoader, import.meta.url);
await import("./register-typescript-test-loader.mjs");

function containedSourcePath(relativePath) {
  const candidate = realpathSync(path.resolve(sourceRoot, relativePath));
  const relative = path.relative(sourceRoot, candidate);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`source path escapes --source-root: ${relativePath}`);
  }
  return candidate;
}

const mutationPaths = [
  "app/api/admin/discovery/candidate-extraction/invoke/handler.ts",
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/route.ts",
  "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
  "app/api/admin/discovery/intake/route.ts",
  "app/api/admin/discovery/runs/manual/claim/route.ts",
  "app/api/admin/discovery/runs/manual/route.ts",
  "app/api/admin/discovery/sources/[id]/route.ts",
  "app/api/admin/discovery/sources/route.ts",
];

const sources = new Map(
  mutationPaths.map((relativePath) => [
    relativePath,
    readFileSync(containedSourcePath(relativePath), "utf8"),
  ]),
);
const failures = [];

function requireDomain(domain, condition, reason) {
  if (!condition) failures.push(`${domain}: ${reason}`);
}

for (const [relativePath, text] of sources) {
  requireDomain(
    "DISCOVERY_MUTATION_ACTUAL_BYTE_LIMIT",
    text.includes("readBoundedRequestBody") &&
      text.includes("parseBoundedJsonBody") &&
      text.includes("public-live-route-safety") &&
      !text.includes("await request.json()"),
    `${relativePath} must reuse the unchanged actual-byte body reader and parser`,
  );
}

const expectedFactories = new Map([
  [mutationPaths[1], "createCandidateDecisionHandler"],
  [mutationPaths[2], "createDiscoveredToolDuplicateHandler"],
  [mutationPaths[3], "createDiscoveredToolStatusHandler"],
  [mutationPaths[4], "createDiscoveredToolsBulkStatusHandler"],
  [mutationPaths[5], "createDiscoveryIntakeHandler"],
  [mutationPaths[6], "createDiscoveryManualClaimHandler"],
  [mutationPaths[7], "createDiscoveryManualRunHandler"],
  [mutationPaths[8], "createDiscoverySourceUpdateHandler"],
  [mutationPaths[9], "createDiscoverySourceCreateHandler"],
]);

for (const [relativePath, factory] of expectedFactories) {
  requireDomain(
    "DISCOVERY_FABRICATED_TRANSACTION_SEAM",
    sources.get(relativePath).includes(`export function ${factory}`),
    `${relativePath} must export ${factory} for direct fabricated execution`,
  );
}

for (const relativePath of expectedFactories.keys()) {
  const text = sources.get(relativePath);
  requireDomain(
    "DISCOVERY_FABRICATED_CAPABILITY_BOUNDARY",
    !text.includes("process.env") &&
      !text.includes("createClient(") &&
      !text.includes(".storage"),
    `${relativePath} must not directly read environment state or construct real database/storage clients`,
  );
}

requireDomain(
  "DISCOVERY_PRIMARY_WRITE_AUDIT_FAILURE",
  [mutationPaths[2], mutationPaths[3], mutationPaths[4], mutationPaths[5], mutationPaths[7], mutationPaths[8], mutationPaths[9]]
    .every((relativePath) => /compensat|rollback/iu.test(sources.get(relativePath))),
  "every multi-call primary-write/audit chain must expose checked compensation",
);

requireDomain(
  "DUPLICATE_THREE_WRITE_PARTIAL_FAILURE",
  /compensat/iu.test(sources.get(mutationPaths[2])) &&
    sources.get(mutationPaths[2]).includes('.delete()') &&
    sources.get(mutationPaths[2]).includes('duplicateCandidate.id') &&
    sources.get(mutationPaths[2]).includes('.eq("updated_at"'),
  "duplicate insert, status update, and audit insert need reverse checked compensation with a version guard",
);

requireDomain(
  "BULK_STATUS_STALE_WRITE_AND_AUDIT",
  sources.get(mutationPaths[4]).includes('.eq("status"') &&
    sources.get(mutationPaths[4]).includes('.eq("updated_at"') &&
    /updatedTools[\s\S]*auditRows/u.test(sources.get(mutationPaths[4])) &&
    /compensat/iu.test(sources.get(mutationPaths[4])),
  "bulk writes must compare prior state, audit only returned writes, and compensate by version",
);

requireDomain(
  "INTAKE_CHECKED_REVERSE_COMPENSATION",
  sources.get(mutationPaths[5]).includes("compensateDiscoveryIntake") &&
    sources.get(mutationPaths[5]).includes("compensation_failed") &&
    !sources.get(mutationPaths[5]).includes("await cleanupDiscoveredTool(discoveredToolId);"),
  "intake cleanup must return and check a reverse-order compensation ledger",
);

requireDomain(
  "MANUAL_RUN_ACTIVE_CREATE_RACE",
  sources.get(mutationPaths[7]).includes("resolveActiveRunCreateRace") &&
    sources.get(mutationPaths[7]).includes('.delete()') &&
    sources.get(mutationPaths[7]).includes('.eq("status", "pending")'),
  "manual run creation needs deterministic post-insert arbitration and checked loser cleanup",
);

requireDomain(
  "SOURCE_UPDATE_VERSION_AND_AUDIT",
  sources.get(mutationPaths[8]).includes('.eq("updated_at"') &&
    /compensat/iu.test(sources.get(mutationPaths[8])) &&
    sources.get(mutationPaths[8]).includes("source_update_stale"),
  "source update must compare a version and reverse only its own write when audit fails",
);

assert.deepEqual(
  failures,
  [],
  `INTENTIONAL_RED_DISCOVERY_EXPLICIT_MUTATIONS\n${failures.join("\n")}`,
);

const [
  candidateDecisionRoute,
  duplicateRoute,
  discoveredToolStatusRoute,
  bulkStatusRoute,
  intakeRoute,
  manualClaimRoute,
  manualRunRoute,
  sourceUpdateRoute,
  sourceCreateRoute,
] = await Promise.all(
  mutationPaths.slice(1).map((relativePath) =>
    import(pathToFileURL(containedSourcePath(relativePath)).href),
  ),
);

const ADMIN_SESSION = {
  isAdmin: true,
  actor: { id: "synthetic-admin", label: "Synthetic Admin" },
  errors: [],
};
const ALLOWED_RATE_LIMIT = {
  allowed: true,
  limit: 20,
  remaining: 19,
  resetAt: Date.now() + 60_000,
  windowSeconds: 60,
};
const TOOL_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_TOOL_ID = "22222222-2222-4222-8222-222222222222";
const SOURCE_ID = "33333333-3333-4333-8333-333333333333";
const RUN_ID = "44444444-4444-4444-8444-444444444444";
const OTHER_RUN_ID = "55555555-5555-4555-8555-555555555555";
const CANDIDATE_ID = "66666666-6666-4666-8666-666666666666";
const DUPLICATE_ID = "77777777-7777-4777-8777-777777777777";
const EVIDENCE_ID = "88888888-8888-4888-8888-888888888888";
const PREVIOUS_AT = "2026-07-31T10:00:00.000Z";
const WRITTEN_AT = "2026-07-31T10:01:00.000Z";

const standardDependencies = {
  verifySession() {
    return ADMIN_SESSION;
  },
  verifyCsrf() {
    return true;
  },
  checkRateLimit() {
    return ALLOWED_RATE_LIMIT;
  },
};

function jsonRequest(relativePath, body, method = "POST") {
  return new Request(`https://aifinder.test${relativePath}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function hasFilter(call, method, ...args) {
  return call.filters.some(
    (filter) => filter.method === method &&
      JSON.stringify(filter.args) === JSON.stringify(args),
  );
}

function createScriptedClient(domain, scriptedSteps) {
  const pendingSteps = [...scriptedSteps];
  const calls = [];
  const errors = [];

  function from(table) {
    const state = {
      table,
      operation: null,
      payload: undefined,
      projection: undefined,
      filters: [],
      modifiers: [],
      terminal: undefined,
    };
    let settlement;

    function settle(terminal) {
      if (settlement) return settlement;
      state.terminal = terminal;
      const call = {
        ...state,
        filters: [...state.filters],
        modifiers: [...state.modifiers],
      };
      calls.push(call);
      const step = pendingSteps.shift();

      if (!step) {
        errors.push(`${domain}: unexpected ${state.operation} on ${table}`);
        settlement = Promise.resolve({ data: null, error: { code: "unexpected_call" } });
        return settlement;
      }

      if (step.table !== table || step.operation !== state.operation) {
        errors.push(
          `${domain}: expected ${step.operation} on ${step.table}, received ${state.operation} on ${table}`,
        );
      }

      if (step.check) {
        try {
          step.check(call);
        } catch (error) {
          errors.push(
            `${domain}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      settlement = Promise.resolve(step.result ?? { data: null, error: null });
      return settlement;
    }

    const builder = {
      select(projection, options) {
        if (!state.operation) state.operation = "select";
        state.projection = projection;
        state.modifiers.push({ method: "select", args: [projection, options] });
        return builder;
      },
      insert(payload) {
        state.operation = "insert";
        state.payload = payload;
        return builder;
      },
      update(payload) {
        state.operation = "update";
        state.payload = payload;
        return builder;
      },
      delete() {
        state.operation = "delete";
        return builder;
      },
      eq(...args) {
        state.filters.push({ method: "eq", args });
        return builder;
      },
      neq(...args) {
        state.filters.push({ method: "neq", args });
        return builder;
      },
      in(...args) {
        state.filters.push({ method: "in", args });
        return builder;
      },
      is(...args) {
        state.filters.push({ method: "is", args });
        return builder;
      },
      order(...args) {
        state.modifiers.push({ method: "order", args });
        return builder;
      },
      limit(...args) {
        state.modifiers.push({ method: "limit", args });
        return builder;
      },
      maybeSingle() {
        return settle("maybeSingle");
      },
      single() {
        return settle("single");
      },
      then(onFulfilled, onRejected) {
        return settle("await").then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  return {
    from,
    calls,
    assertComplete() {
      assert.deepEqual(errors, [], errors.join("\n"));
      assert.equal(
        pendingSteps.length,
        0,
        `${domain}: ${pendingSteps.length} fabricated transaction step(s) were not executed`,
      );
    },
  };
}

async function withExpectedOperationalFailure(callback) {
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};
  try {
    return await callback();
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

{
  const byteLimitClient = {
    from() {
      throw new Error("oversized request reached a fabricated database client");
    },
  };
  const oversizedBody = { padding: "😀".repeat(7_000) };
  assert.equal(
    JSON.stringify(oversizedBody).length < 24 * 1024,
    true,
    "the body must stay below the largest legacy character-count limit",
  );
  assert.equal(
    new TextEncoder().encode(JSON.stringify(oversizedBody)).byteLength > 24 * 1024,
    true,
    "the body must exceed every route's actual-byte limit",
  );

  const byteLimitCases = [
    {
      domain: "candidate-decision",
      handler: candidateDecisionRoute.createCandidateDecisionHandler({
        verifyAdminSession() {
          return ADMIN_SESSION;
        },
        verifyAdminCsrfRequest() {
          return true;
        },
        checkRateLimit() {
          return ALLOWED_RATE_LIMIT;
        },
        getClient() {
          return byteLimitClient;
        },
      }),
      request: jsonRequest(
        `/api/admin/discovery/candidate-staging-queue/${CANDIDATE_ID}/decision`,
        oversizedBody,
      ),
      context: { params: Promise.resolve({ id: CANDIDATE_ID }) },
      expectedMessage: "Request is too large.",
    },
    {
      domain: "duplicate",
      handler: duplicateRoute.createDiscoveredToolDuplicateHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest(
        `/api/admin/discovery/discovered-tools/${TOOL_ID}/duplicate`,
        oversizedBody,
      ),
      context: { params: Promise.resolve({ id: TOOL_ID }) },
      expectedMessage: "Invalid request body.",
    },
    {
      domain: "single-status",
      handler: discoveredToolStatusRoute.createDiscoveredToolStatusHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest(
        `/api/admin/discovery/discovered-tools/${TOOL_ID}`,
        oversizedBody,
        "PATCH",
      ),
      context: { params: Promise.resolve({ id: TOOL_ID }) },
      expectedMessage: "Request is too large.",
    },
    {
      domain: "bulk-status",
      handler: bulkStatusRoute.createDiscoveredToolsBulkStatusHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest(
        "/api/admin/discovery/discovered-tools/bulk-status",
        oversizedBody,
      ),
      expectedMessage: "Request is too large.",
    },
    {
      domain: "intake",
      handler: intakeRoute.createDiscoveryIntakeHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest("/api/admin/discovery/intake", oversizedBody),
      expectedMessage: "Request is too large.",
    },
    {
      domain: "manual-claim",
      handler: manualClaimRoute.createDiscoveryManualClaimHandler(),
      request: jsonRequest(
        "/api/admin/discovery/runs/manual/claim",
        oversizedBody,
      ),
      expectedMessage: "Request is too large.",
    },
    {
      domain: "manual-run",
      handler: manualRunRoute.createDiscoveryManualRunHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest("/api/admin/discovery/runs/manual", oversizedBody),
      expectedMessage: "Request is too large.",
    },
    {
      domain: "source-update",
      handler: sourceUpdateRoute.createDiscoverySourceUpdateHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest(
        `/api/admin/discovery/sources/${SOURCE_ID}`,
        oversizedBody,
        "PATCH",
      ),
      context: { params: Promise.resolve({ id: SOURCE_ID }) },
      expectedMessage: "Request is too large.",
    },
    {
      domain: "source-create",
      handler: sourceCreateRoute.createDiscoverySourceCreateHandler({
        ...standardDependencies,
        client: byteLimitClient,
      }),
      request: jsonRequest("/api/admin/discovery/sources", oversizedBody),
      expectedMessage: "Request is too large.",
    },
  ];

  for (const testCase of byteLimitCases) {
    const response = testCase.context
      ? await testCase.handler(testCase.request, testCase.context)
      : await testCase.handler(testCase.request);
    const data = await response.json();
    const message = data.error?.message ?? data.error;
    assert.equal(response.status, 400, `${testCase.domain}: oversized body status`);
    assert.equal(
      message,
      testCase.expectedMessage,
      `${testCase.domain}: oversized body must be rejected by the production byte parser`,
    );
  }
}

{
  const fabricatedClient = { domain: "candidate-decision" };
  let capturedInput;
  let capturedOptions;
  const handler = candidateDecisionRoute.createCandidateDecisionHandler({
    verifyAdminSession() {
      return ADMIN_SESSION;
    },
    verifyAdminCsrfRequest() {
      return true;
    },
    checkRateLimit() {
      return ALLOWED_RATE_LIMIT;
    },
    getClient() {
      return fabricatedClient;
    },
    async applyDecision(input, options) {
      capturedInput = input;
      capturedOptions = options;
      return {
        candidate: {
          id: CANDIDATE_ID,
          decision_status: "rejected",
          decision_reason: input.decisionReason,
        },
      };
    },
  });
  const response = await handler(
    jsonRequest(
      `/api/admin/discovery/candidate-staging-queue/${CANDIDATE_ID}/decision`,
      { action: "reject", reason: "Synthetic transaction rejection." },
    ),
    { params: Promise.resolve({ id: CANDIDATE_ID }) },
  );
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.candidate.id, CANDIDATE_ID);
  assert.equal(capturedInput.candidateId, CANDIDATE_ID);
  assert.equal(capturedInput.actorLabel, "Synthetic Admin");
  assert.equal(capturedOptions.client, fabricatedClient);
}

{
  const client = createScriptedClient("duplicate", [
    {
      table: "discovered_tools",
      operation: "select",
      result: {
        data: { id: TOOL_ID, status: "new", updated_at: PREVIOUS_AT },
        error: null,
      },
    },
    {
      table: "discovery_duplicate_candidates",
      operation: "insert",
      result: {
        data: {
          id: DUPLICATE_ID,
          discovered_tool_id: TOOL_ID,
          candidate_type: "tool",
        },
        error: null,
      },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.equal(call.payload.status, "duplicate");
        assert.equal(hasFilter(call, "eq", "status", "new"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", PREVIOUS_AT), true);
      },
      result: {
        data: { id: TOOL_ID, status: "duplicate", updated_at: WRITTEN_AT },
        error: null,
      },
    },
    {
      table: "discovery_audit_events",
      operation: "insert",
      result: { data: null, error: { code: "synthetic_audit_failure" } },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.equal(call.payload.status, "new");
        assert.equal(hasFilter(call, "eq", "status", "duplicate"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", WRITTEN_AT), true);
      },
      result: { data: null, error: null },
    },
    {
      table: "discovery_duplicate_candidates",
      operation: "delete",
      check(call) {
        assert.equal(hasFilter(call, "eq", "id", DUPLICATE_ID), true);
        assert.equal(hasFilter(call, "eq", "discovered_tool_id", TOOL_ID), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = duplicateRoute.createDiscoveredToolDuplicateHandler({
    ...standardDependencies,
    client,
    now: () => WRITTEN_AT,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest(`/api/admin/discovery/discovered-tools/${TOOL_ID}/duplicate`, {
        candidate_type: "tool",
        candidate_tool_id: "42",
        match_type: "normalized_domain",
        match_score: 100,
        reason: "Synthetic exact-domain duplicate.",
      }),
      { params: Promise.resolve({ id: TOOL_ID }) },
    ),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Failed to mark duplicate." });
  client.assertComplete();
  assert.deepEqual(
    client.calls.slice(-2).map(({ table, operation }) => [table, operation]),
    [
      ["discovered_tools", "update"],
      ["discovery_duplicate_candidates", "delete"],
    ],
  );
}

{
  const client = createScriptedClient("single-status", [
    {
      table: "discovered_tools",
      operation: "select",
      result: {
        data: {
          id: TOOL_ID,
          status: "new",
          rejected_reason: null,
          updated_at: PREVIOUS_AT,
        },
        error: null,
      },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.equal(hasFilter(call, "eq", "status", "new"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", PREVIOUS_AT), true);
      },
      result: {
        data: {
          id: TOOL_ID,
          status: "rejected",
          rejected_reason: "Synthetic rejection.",
          updated_at: WRITTEN_AT,
        },
        error: null,
      },
    },
    {
      table: "discovery_audit_events",
      operation: "insert",
      result: { data: null, error: { code: "synthetic_audit_failure" } },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.deepEqual(call.payload, {
          status: "new",
          rejected_reason: null,
          updated_at: PREVIOUS_AT,
        });
        assert.equal(hasFilter(call, "eq", "status", "rejected"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", WRITTEN_AT), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = discoveredToolStatusRoute.createDiscoveredToolStatusHandler({
    ...standardDependencies,
    client,
    now: () => WRITTEN_AT,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest(
        `/api/admin/discovery/discovered-tools/${TOOL_ID}`,
        { status: "rejected", reason: "Synthetic rejection." },
        "PATCH",
      ),
      { params: Promise.resolve({ id: TOOL_ID }) },
    ),
  );

  assert.equal(response.status, 500);
  client.assertComplete();
}

{
  const client = createScriptedClient("bulk-status", [
    {
      table: "discovered_tools",
      operation: "select",
      result: {
        data: [
          { id: TOOL_ID, status: "new", updated_at: PREVIOUS_AT },
          { id: SECOND_TOOL_ID, status: "ignored", updated_at: PREVIOUS_AT },
        ],
        error: null,
      },
    },
    {
      table: "discovered_tools",
      operation: "update",
      result: {
        data: { id: TOOL_ID, status: "pending_review", updated_at: WRITTEN_AT },
        error: null,
      },
    },
    {
      table: "discovered_tools",
      operation: "update",
      result: {
        data: {
          id: SECOND_TOOL_ID,
          status: "pending_review",
          updated_at: WRITTEN_AT,
        },
        error: null,
      },
    },
    {
      table: "discovery_audit_events",
      operation: "insert",
      check(call) {
        assert.equal(Array.isArray(call.payload), true);
        assert.deepEqual(
          call.payload.map((row) => row.discovered_tool_id),
          [TOOL_ID, SECOND_TOOL_ID],
        );
      },
      result: { data: null, error: { code: "synthetic_audit_failure" } },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.equal(hasFilter(call, "eq", "id", SECOND_TOOL_ID), true);
        assert.equal(hasFilter(call, "eq", "status", "pending_review"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", WRITTEN_AT), true);
      },
      result: { data: null, error: null },
    },
    {
      table: "discovered_tools",
      operation: "update",
      check(call) {
        assert.equal(hasFilter(call, "eq", "id", TOOL_ID), true);
        assert.equal(hasFilter(call, "eq", "status", "pending_review"), true);
        assert.equal(hasFilter(call, "eq", "updated_at", WRITTEN_AT), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = bulkStatusRoute.createDiscoveredToolsBulkStatusHandler({
    ...standardDependencies,
    client,
    now: () => WRITTEN_AT,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest("/api/admin/discovery/discovered-tools/bulk-status", {
        ids: [TOOL_ID, SECOND_TOOL_ID],
        status: "pending_review",
        reason: "Synthetic bulk review.",
      }),
    ),
  );

  assert.equal(response.status, 500);
  client.assertComplete();
  assert.deepEqual(
    client.calls.slice(-2).map((call) =>
      call.filters.find((filter) => filter.method === "eq" && filter.args[0] === "id")?.args[1]
    ),
    [SECOND_TOOL_ID, TOOL_ID],
  );
}

{
  const client = createScriptedClient("intake", [
    {
      table: "discovered_tools",
      operation: "select",
      result: { data: [], error: null },
    },
    { table: "tools", operation: "select", result: { data: [], error: null } },
    {
      table: "submitted_tools",
      operation: "select",
      result: { data: [], error: null },
    },
    {
      table: "discovery_runs",
      operation: "insert",
      result: { data: { id: RUN_ID }, error: null },
    },
    {
      table: "discovered_tools",
      operation: "insert",
      result: {
        data: {
          id: TOOL_ID,
          name: "Synthetic Intake Tool",
          slug: "synthetic-intake-tool",
          status: "new",
          normalized_domain: "synthetic-intake.example.com",
          run_id: RUN_ID,
        },
        error: null,
      },
    },
    {
      table: "discovery_evidence",
      operation: "insert",
      result: { data: null, error: { code: "synthetic_evidence_failure" } },
    },
    ...[
      ["discovery_audit_events", "discovered_tool_id", TOOL_ID],
      ["discovery_duplicate_candidates", "discovered_tool_id", TOOL_ID],
      ["discovery_evidence", "discovered_tool_id", TOOL_ID],
      ["discovered_tools", "id", TOOL_ID],
      ["discovery_runs", "id", RUN_ID],
    ].map(([table, column, value]) => ({
      table,
      operation: "delete",
      check(call) {
        assert.equal(hasFilter(call, "eq", column, value), true);
      },
      result: { data: null, error: null },
    })),
  ]);
  const handler = intakeRoute.createDiscoveryIntakeHandler({
    ...standardDependencies,
    client,
    now: () => WRITTEN_AT,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest("/api/admin/discovery/intake", {
        name: "Synthetic Intake Tool",
        description: "A fabricated candidate used only by a local route test.",
        website: "https://synthetic-intake.example.com",
        category: "Productivity",
        pricing: "Free + Paid",
      }),
    ),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Intake candidate created, but evidence creation failed.",
  });
  client.assertComplete();
  assert.deepEqual(
    client.calls.slice(-5).map(({ table }) => table),
    [
      "discovery_audit_events",
      "discovery_duplicate_candidates",
      "discovery_evidence",
      "discovered_tools",
      "discovery_runs",
    ],
  );
}

{
  let receivedRequest;
  const claimedResponse = Response.json(
    { data: { run: { id: RUN_ID, status: "running" } } },
    { status: 200 },
  );
  const handler = manualClaimRoute.createDiscoveryManualClaimHandler({
    async execute(request) {
      receivedRequest = request;
      return claimedResponse;
    },
  });
  const request = jsonRequest("/api/admin/discovery/runs/manual/claim", {
    run_id: RUN_ID,
  });
  const response = await handler(request);

  assert.equal(receivedRequest, request);
  assert.equal(response, claimedResponse);
  assert.equal((await response.json()).data.run.status, "running");
}

{
  const client = createScriptedClient("manual-run-race", [
    {
      table: "discovery_sources",
      operation: "select",
      result: {
        data: {
          id: SOURCE_ID,
          name: "Synthetic Manual Source",
          slug: "synthetic-manual-source",
          source_type: "manual",
          config: {
            kind: "manual_curated_urls",
            approval_status: "approved_for_first_manual_prototype",
            risk_level: "low",
            policy_review_required_before_fetch: true,
          },
          is_active: true,
        },
        error: null,
      },
    },
    {
      table: "discovery_runs",
      operation: "select",
      result: { data: [], error: null },
    },
    {
      table: "discovery_runs",
      operation: "insert",
      result: {
        data: {
          id: RUN_ID,
          source_id: SOURCE_ID,
          status: "pending",
          stats: {},
          error_log: null,
          started_at: null,
          finished_at: null,
          created_at: WRITTEN_AT,
          updated_at: WRITTEN_AT,
        },
        error: null,
      },
    },
    {
      table: "discovery_runs",
      operation: "select",
      check(call) {
        assert.deepEqual(
          call.modifiers.filter(({ method }) => method === "order").map(({ args }) => args[0]),
          ["created_at", "id"],
        );
      },
      result: {
        data: [
          { id: OTHER_RUN_ID, status: "pending", created_at: PREVIOUS_AT },
          { id: RUN_ID, status: "pending", created_at: WRITTEN_AT },
        ],
        error: null,
      },
    },
    {
      table: "discovery_runs",
      operation: "delete",
      check(call) {
        assert.equal(hasFilter(call, "eq", "id", RUN_ID), true);
        assert.equal(hasFilter(call, "eq", "status", "pending"), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = manualRunRoute.createDiscoveryManualRunHandler({
    ...standardDependencies,
    client,
  });
  const response = await handler(
    jsonRequest("/api/admin/discovery/runs/manual", {
      source_id: SOURCE_ID,
      urls: [
        {
          url: "https://manual-source.example.com/tool",
          policy_review: {
            robots_txt_review: "allowed",
            terms_review: "allowed",
            permission_status: "allowed",
            permission_notes: "Synthetic local test permission.",
            reviewed_at: PREVIOUS_AT,
            reviewed_by: "Synthetic Admin",
          },
        },
      ],
    }),
  );

  assert.equal(response.status, 409);
  assert.equal(
    (await response.json()).error,
    "A discovery run is already pending or running for this source.",
  );
  client.assertComplete();
}

{
  const previousSource = {
    id: SOURCE_ID,
    name: "Synthetic Source",
    slug: "synthetic-source",
    description: "Before",
    url: "https://source.example.com",
    source_type: "manual",
    config: { kind: "synthetic" },
    is_active: true,
    updated_at: PREVIOUS_AT,
  };
  const client = createScriptedClient("source-update", [
    {
      table: "discovery_sources",
      operation: "select",
      result: { data: previousSource, error: null },
    },
    {
      table: "discovery_sources",
      operation: "update",
      check(call) {
        assert.equal(hasFilter(call, "eq", "updated_at", PREVIOUS_AT), true);
      },
      result: {
        data: {
          ...previousSource,
          description: "After",
          updated_at: WRITTEN_AT,
          created_at: PREVIOUS_AT,
          last_run_at: null,
        },
        error: null,
      },
    },
    {
      table: "discovery_audit_events",
      operation: "insert",
      result: { data: null, error: { code: "synthetic_audit_failure" } },
    },
    {
      table: "discovery_sources",
      operation: "update",
      check(call) {
        assert.equal(call.payload.description, "Before");
        assert.equal(call.payload.updated_at, PREVIOUS_AT);
        assert.equal(hasFilter(call, "eq", "updated_at", WRITTEN_AT), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = sourceUpdateRoute.createDiscoverySourceUpdateHandler({
    ...standardDependencies,
    client,
    now: () => WRITTEN_AT,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest(
        `/api/admin/discovery/sources/${SOURCE_ID}`,
        { description: "After" },
        "PATCH",
      ),
      { params: Promise.resolve({ id: SOURCE_ID }) },
    ),
  );

  assert.equal(response.status, 500);
  client.assertComplete();
}

{
  const createdSource = {
    id: SOURCE_ID,
    name: "Synthetic Source",
    slug: "synthetic-source",
    description: "Synthetic source.",
    url: "https://source.example.com",
    source_type: "manual",
    config: { kind: "synthetic" },
    is_active: true,
    last_run_at: null,
    created_at: PREVIOUS_AT,
    updated_at: PREVIOUS_AT,
  };
  const client = createScriptedClient("source-create", [
    {
      table: "discovery_sources",
      operation: "select",
      result: { data: null, error: null },
    },
    {
      table: "discovery_sources",
      operation: "insert",
      result: { data: createdSource, error: null },
    },
    {
      table: "discovery_audit_events",
      operation: "insert",
      result: { data: null, error: { code: "synthetic_audit_failure" } },
    },
    {
      table: "discovery_sources",
      operation: "delete",
      check(call) {
        assert.equal(hasFilter(call, "eq", "id", SOURCE_ID), true);
        assert.equal(hasFilter(call, "eq", "slug", "synthetic-source"), true);
      },
      result: { data: null, error: null },
    },
  ]);
  const handler = sourceCreateRoute.createDiscoverySourceCreateHandler({
    ...standardDependencies,
    client,
  });
  const response = await withExpectedOperationalFailure(() =>
    handler(
      jsonRequest("/api/admin/discovery/sources", {
        name: "Synthetic Source",
        description: "Synthetic source.",
        url: "https://source.example.com",
        source_type: "manual",
        config: { kind: "synthetic" },
        is_active: true,
      }),
    ),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to create discovery source.",
  });
  client.assertComplete();
}

globalThis.fetch = originalFetch;
delete globalThis.__AIFINDER_DISCOVERY_FABRICATED_CAPABILITY_LEDGER__;
assert.deepEqual(capabilityLedger, {
  network: 0,
  env: 0,
  realClients: 0,
  database: 0,
  storage: 0,
});
console.log("network=0 env=0 real_clients=0 database=0 storage=0");
console.log("PASS: admin discovery explicit mutation fabricated transaction contracts");
