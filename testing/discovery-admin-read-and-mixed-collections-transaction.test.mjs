#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const defaultSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(defaultSourceRoot);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error("usage: discovery-admin-read-and-mixed-collections-transaction.test.mjs [--source-root <dir>]");
  }
  return realpathSync(path.resolve(argv[1]));
}

const sourceRoot = parseSourceRoot(process.argv.slice(2));
assert.equal(path.isAbsolute(sourceRoot), true);

const PATHS = {
  duplicate:
    "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
  bulk:
    "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
  manual: "app/api/admin/discovery/runs/manual/route.ts",
};

function isContained(candidate) {
  return candidate === sourceRoot || candidate.startsWith(`${sourceRoot}${path.sep}`);
}

function source(relativePath) {
  const candidate = path.resolve(sourceRoot, relativePath);
  assert.equal(isContained(candidate), true);
  const resolved = realpathSync(candidate);
  assert.equal(isContained(resolved), true);
  return readFileSync(resolved, "utf8");
}

function stripImports(text) {
  return text.replace(/^import(?:[\s\S]*?from\s*)?["'][^"']+["'];?\s*$/gmu, "");
}

const SYNTHETIC_PRELUDE = `
const NextResponse = {
  json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      status: init.status ?? 200,
      headers: { "content-type": "application/json", ...(init.headers || {}) },
    });
  },
};
const ADMIN_RATE_LIMIT_ACTIONS = {
  discoveryToolDuplicate: "discovery-tool-duplicate",
  discoveryToolBulkStatus: "discovery-tool-bulk-status",
  discoveryManualCrawlerRun: "discovery-manual-crawler-run",
};
function forbiddenCapability(name) {
  globalThis.__phase32DiscoveryForbiddenCapabilities.push(name);
  throw new Error("FORBIDDEN_SYNTHETIC_CAPABILITY:" + name);
}
const supabaseAdmin = new Proxy({}, {
  get() { return forbiddenCapability("default_supabase_client"); },
});
function verifyAdminSession() { return forbiddenCapability("default_session_verifier"); }
function verifyAdminCsrfRequest() { return forbiddenCapability("default_csrf_verifier"); }
function checkAdminRateLimit() { return forbiddenCapability("default_rate_limiter"); }
function getAdminRateLimitResponseData() {
  return forbiddenCapability("default_rate_limit_response");
}
class PublicLiveRouteSafetyError extends Error {
  constructor(code) { super(code); this.code = code; }
}
async function readBoundedRequestBody(request, maximumBytes) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maximumBytes) {
    throw new PublicLiveRouteSafetyError("request_body_too_large");
  }
  return bytes;
}
function parseBoundedJsonBody(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}
function validateManualCrawlerRequest(body) {
  if (typeof body.source_id !== "string" || !Array.isArray(body.urls)) {
    throw new Error("Invalid fabricated manual crawler request.");
  }
  return { sourceId: body.source_id, urls: [...body.urls] };
}
function validateManualCrawlerSource(source) {
  if (!source || source.is_active !== true) {
    throw new Error("Invalid fabricated discovery source.");
  }
}
function createManualCrawlerRunStats({ source, request }) {
  return {
    fabricated: true,
    source_id: source.id,
    requested_url_count: request.urls.length,
  };
}
`;

async function importSyntheticTypeScript(relativePath) {
  const output = ts.transpileModule(
    `${SYNTHETIC_PRELUDE}\n${stripImports(source(relativePath))}`,
    {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
      fileName: relativePath,
      reportDiagnostics: false,
    },
  ).outputText;
  const encoded = Buffer.from(output, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}#${encodeURIComponent(relativePath)}`);
}

globalThis.__phase32DiscoveryForbiddenCapabilities = [];

const modules = Object.fromEntries(
  await Promise.all(
    Object.entries(PATHS).map(async ([name, relativePath]) => [
      name,
      await importSyntheticTypeScript(relativePath),
    ]),
  ),
);

function response(data, error = null) {
  return { data, error };
}

function createScriptedClient(script) {
  const queues = new Map(
    Object.entries(script).map(([key, values]) => [key, [...values]]),
  );
  const calls = [];

  class Query {
    constructor(table) {
      this.table = table;
      this.verb = "select";
      this.payload = null;
      this.projection = null;
      this.filters = [];
      this.modifiers = [];
      this.consumed = false;
    }

    select(projection) {
      this.projection = projection;
      return this;
    }

    insert(payload) {
      this.verb = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.verb = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.verb = "delete";
      return this;
    }

    eq(column, value) {
      this.filters.push({ kind: "eq", column, value });
      return this;
    }

    in(column, value) {
      this.filters.push({ kind: "in", column, value: [...value] });
      return this;
    }

    order(column, options) {
      this.modifiers.push({ kind: "order", column, options });
      return this;
    }

    limit(value) {
      this.modifiers.push({ kind: "limit", value });
      return this;
    }

    consume(terminal) {
      assert.equal(this.consumed, false, "fabricated query consumed twice");
      this.consumed = true;
      const key = `${this.table}:${this.verb}:${terminal}`;
      const queue = queues.get(key);
      assert.ok(queue && queue.length > 0, `missing fabricated result for ${key}`);
      const result = queue.shift();
      calls.push({
        table: this.table,
        verb: this.verb,
        terminal,
        payload: this.payload,
        projection: this.projection,
        filters: this.filters.map((filter) => ({ ...filter })),
        modifiers: this.modifiers.map((modifier) => ({ ...modifier })),
      });
      if (result && typeof result === "object" && "throw" in result) {
        throw new Error(result.throw);
      }
      return result;
    }

    single() {
      return Promise.resolve(this.consume("single"));
    }

    maybeSingle() {
      return Promise.resolve(this.consume("maybeSingle"));
    }

    then(resolve, reject) {
      return Promise.resolve()
        .then(() => this.consume("await"))
        .then(resolve, reject);
    }
  }

  return {
    client: {
      from(table) {
        return new Query(table);
      },
    },
    calls,
    assertDrained() {
      for (const [key, queue] of queues) {
        assert.equal(queue.length, 0, `unused fabricated result for ${key}`);
      }
    },
  };
}

function authorizedSession() {
  return {
    isAdmin: true,
    actor: { id: "synthetic-admin", label: "Synthetic Admin" },
    errors: [],
  };
}

function allowedRateLimit() {
  return {
    allowed: true,
    limit: 100,
    remaining: 99,
    resetAt: 4_102_444_800_000,
    windowSeconds: 900,
  };
}

function dependencies(client, extras = {}) {
  return {
    client,
    verifySession: authorizedSession,
    verifyCsrf: () => true,
    checkRateLimit: allowedRateLimit,
    ...extras,
  };
}

function jsonRequest(body) {
  return new Request("https://aifinder.test/api/admin/discovery/fabricated", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function jsonBody(value) {
  return value.json();
}

async function captureConsole(operation) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const events = [];
  console.error = (...values) => events.push(["error", ...values]);
  console.warn = (...values) => events.push(["warn", ...values]);
  try {
    return { value: await operation(), events };
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

async function withCapabilityGuard(operation) {
  const originalFetch = globalThis.fetch;
  let networkAttempts = 0;
  globalThis.__phase32DiscoveryForbiddenCapabilities.length = 0;
  globalThis.fetch = async () => {
    networkAttempts += 1;
    throw new Error("FABRICATED_NETWORK_ACCESS_BLOCKED");
  };
  try {
    const value = await operation();
    assert.equal(networkAttempts, 0);
    assert.deepEqual(globalThis.__phase32DiscoveryForbiddenCapabilities, []);
    return value;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function hasFilter(call, column, value) {
  return call.filters.some(
    (filter) =>
      filter.kind === "eq" && filter.column === column && filter.value === value,
  );
}

const DISCOVERED_ID = "11111111-1111-4111-8111-111111111111";
const DUPLICATE_ID = "22222222-2222-4222-8222-222222222222";
const BULK_ID_A = "33333333-3333-4333-8333-333333333333";
const BULK_ID_B = "44444444-4444-4444-8444-444444444444";
const SOURCE_ID = "55555555-5555-4555-8555-555555555555";
const WINNING_RUN_ID = "66666666-6666-4666-8666-666666666666";
const CREATED_RUN_ID = "77777777-7777-4777-8777-777777777777";
const BEFORE = "2026-07-30T00:00:00.000Z";
const WRITTEN = "2026-07-31T00:00:00.000Z";

function duplicateRequest() {
  return jsonRequest({
    candidate_type: "tool",
    candidate_tool_id: 7,
    match_type: "exact_name",
    match_score: 95,
    reason: "Fabricated duplicate evidence.",
  });
}

function duplicateContext() {
  return { params: Promise.resolve({ id: DISCOVERED_ID }) };
}

function duplicateBaseScript(overrides = {}) {
  return {
    "discovered_tools:select:maybeSingle": [
      response({ id: DISCOVERED_ID, status: "new", updated_at: BEFORE }),
    ],
    "discovery_duplicate_candidates:insert:single": [
      response({
        id: DUPLICATE_ID,
        discovered_tool_id: DISCOVERED_ID,
        candidate_type: "tool",
      }),
    ],
    "discovered_tools:update:maybeSingle": [
      response({ id: DISCOVERED_ID, status: "duplicate", updated_at: WRITTEN }),
    ],
    ...overrides,
  };
}

test("actual duplicate factory reverses status then candidate when audit insert fails", async () => {
  const fabricated = createScriptedClient(
    duplicateBaseScript({
      "discovery_audit_events:insert:await": [response(null, { fabricated: true })],
      "discovered_tools:update:await": [response(null)],
      "discovery_duplicate_candidates:delete:await": [response(null)],
    }),
  );
  const handler = modules.duplicate.createDiscoveredToolDuplicateHandler(
    dependencies(fabricated.client, { now: () => WRITTEN }),
  );

  const captured = await withCapabilityGuard(() =>
    captureConsole(() => handler(duplicateRequest(), duplicateContext())),
  );
  const body = await jsonBody(captured.value);

  assert.equal(captured.value.status, 500);
  assert.equal(body.error, "Failed to mark duplicate.");
  assert.deepEqual(
    fabricated.calls.map((call) => `${call.table}:${call.verb}:${call.terminal}`),
    [
      "discovered_tools:select:maybeSingle",
      "discovery_duplicate_candidates:insert:single",
      "discovered_tools:update:maybeSingle",
      "discovery_audit_events:insert:await",
      "discovered_tools:update:await",
      "discovery_duplicate_candidates:delete:await",
    ],
  );
  const restore = fabricated.calls[4];
  assert.equal(hasFilter(restore, "status", "duplicate"), true);
  assert.equal(hasFilter(restore, "updated_at", WRITTEN), true);
  assert.equal(fabricated.calls[5].payload, null);
  assert.equal(hasFilter(fabricated.calls[5], "id", DUPLICATE_ID), true);
  fabricated.assertDrained();
});

test("actual duplicate factory removes the inserted candidate after a stale status write", async () => {
  const fabricated = createScriptedClient(
    duplicateBaseScript({
      "discovered_tools:update:maybeSingle": [response(null)],
      "discovery_duplicate_candidates:delete:await": [response(null)],
    }),
  );
  const handler = modules.duplicate.createDiscoveredToolDuplicateHandler(
    dependencies(fabricated.client, { now: () => WRITTEN }),
  );

  const responseValue = await withCapabilityGuard(() =>
    handler(duplicateRequest(), duplicateContext()),
  );
  assert.equal(responseValue.status, 500);
  assert.deepEqual(
    fabricated.calls.map((call) => `${call.table}:${call.verb}`),
    [
      "discovered_tools:select",
      "discovery_duplicate_candidates:insert",
      "discovered_tools:update",
      "discovery_duplicate_candidates:delete",
    ],
  );
  assert.equal(
    fabricated.calls.some(
      (call) => call.table === "discovered_tools" && call.terminal === "await",
    ),
    false,
  );
  fabricated.assertDrained();
});

test("actual duplicate factory reports checked compensation failure without continuing reversal", async () => {
  const fabricated = createScriptedClient(
    duplicateBaseScript({
      "discovery_audit_events:insert:await": [response(null, { fabricated: true })],
      "discovered_tools:update:await": [response(null, { fabricated: true })],
    }),
  );
  const handler = modules.duplicate.createDiscoveredToolDuplicateHandler(
    dependencies(fabricated.client, { now: () => WRITTEN }),
  );

  const captured = await withCapabilityGuard(() =>
    captureConsole(() => handler(duplicateRequest(), duplicateContext())),
  );
  assert.equal(captured.value.status, 500);
  assert.equal(
    captured.events.some(
      ([method, event]) =>
        method === "error" &&
        event === "discovered_tool_duplicate_compensation_failed",
    ),
    true,
  );
  assert.equal(
    fabricated.calls.some(
      (call) => call.table === "discovery_duplicate_candidates" && call.verb === "delete",
    ),
    false,
  );
  fabricated.assertDrained();
});

test("actual bulk factory audits only version-guarded writes returned by PostgREST", async () => {
  const existingRows = [
    { id: BULK_ID_A, status: "new", updated_at: `${BEFORE}-a` },
    { id: BULK_ID_B, status: "new", updated_at: `${BEFORE}-b` },
  ];
  const fabricated = createScriptedClient({
    "discovered_tools:select:await": [response(existingRows)],
    "discovered_tools:update:maybeSingle": [
      response({ id: BULK_ID_A, status: "ignored", updated_at: WRITTEN }),
      response(null),
    ],
    "discovery_audit_events:insert:await": [response(null)],
  });
  const handler = modules.bulk.createDiscoveredToolsBulkStatusHandler(
    dependencies(fabricated.client, { now: () => WRITTEN }),
  );

  const responseValue = await withCapabilityGuard(() =>
    handler(
      jsonRequest({ ids: [BULK_ID_A, BULK_ID_B], status: "ignored" }),
    ),
  );
  const body = await jsonBody(responseValue);

  assert.equal(responseValue.status, 200);
  assert.equal(body.data.updated, 1);
  const writes = fabricated.calls.filter(
    (call) => call.table === "discovered_tools" && call.verb === "update",
  );
  assert.equal(writes.length, 2);
  assert.equal(hasFilter(writes[0], "status", "new"), true);
  assert.equal(hasFilter(writes[0], "updated_at", `${BEFORE}-a`), true);
  assert.equal(hasFilter(writes[1], "status", "new"), true);
  assert.equal(hasFilter(writes[1], "updated_at", `${BEFORE}-b`), true);
  const audit = fabricated.calls.find(
    (call) => call.table === "discovery_audit_events",
  );
  assert.equal(Array.isArray(audit.payload), true);
  assert.deepEqual(audit.payload.map((row) => row.discovered_tool_id), [BULK_ID_A]);
  fabricated.assertDrained();
});

test("actual manual-run factory deterministically loses and deletes only its pending run", async () => {
  const sourceRow = {
    id: SOURCE_ID,
    name: "Fabricated Source",
    slug: "fabricated-source",
    source_type: "curated_list",
    config: {},
    is_active: true,
  };
  const createdRun = {
    id: CREATED_RUN_ID,
    source_id: SOURCE_ID,
    status: "pending",
    stats: {},
    error_log: null,
    started_at: null,
    finished_at: null,
    created_at: WRITTEN,
    updated_at: WRITTEN,
  };
  const fabricated = createScriptedClient({
    "discovery_sources:select:maybeSingle": [response(sourceRow)],
    "discovery_runs:select:await": [
      response([]),
      response([
        { id: WINNING_RUN_ID, status: "pending", created_at: BEFORE },
        { id: CREATED_RUN_ID, status: "pending", created_at: WRITTEN },
      ]),
    ],
    "discovery_runs:insert:single": [response(createdRun)],
    "discovery_runs:delete:await": [response(null)],
  });
  const handler = modules.manual.createDiscoveryManualRunHandler(
    dependencies(fabricated.client),
  );

  const responseValue = await withCapabilityGuard(() =>
    handler(jsonRequest({ source_id: SOURCE_ID, urls: ["https://example.test/"] })),
  );
  const body = await jsonBody(responseValue);

  assert.equal(responseValue.status, 409);
  assert.equal(
    body.error,
    "A discovery run is already pending or running for this source.",
  );
  const contenderRead = fabricated.calls.filter(
    (call) => call.table === "discovery_runs" && call.verb === "select",
  )[1];
  assert.deepEqual(
    contenderRead.modifiers.filter((modifier) => modifier.kind === "order"),
    [
      { kind: "order", column: "created_at", options: { ascending: true } },
      { kind: "order", column: "id", options: { ascending: true } },
    ],
  );
  const cleanup = fabricated.calls.find(
    (call) => call.table === "discovery_runs" && call.verb === "delete",
  );
  assert.equal(hasFilter(cleanup, "id", CREATED_RUN_ID), true);
  assert.equal(hasFilter(cleanup, "status", "pending"), true);
  assert.equal(
    fabricated.calls.some((call) => call.table === "discovery_audit_events"),
    false,
  );
  fabricated.assertDrained();
});

for (const [name, text] of Object.entries(
  Object.fromEntries(
    Object.entries(PATHS).map(([name, relativePath]) => [name, source(relativePath)]),
  ),
)) {
  assert.equal(text.startsWith('import "server-only";'), true, `${name} server-only`);
  assert.equal(text.includes("process.env"), false, `${name} environment access`);
  assert.equal(text.includes("fetch("), false, `${name} network access`);
}

console.log(
  "DISCOVERY_PRODUCTION_FACTORY_TRANSACTION_SUITE_REGISTERED cases=5 network=0 env=0 real_clients=0 database=0 storage=0",
);
