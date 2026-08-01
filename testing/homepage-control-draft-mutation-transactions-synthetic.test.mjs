import assert from "node:assert/strict";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

await import("./register-typescript-test-loader.mjs");

const DEFAULT_SOURCE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(DEFAULT_SOURCE_ROOT);

  if (
    argv.length !== 2 ||
    argv[0] !== "--source-root" ||
    typeof argv[1] !== "string" ||
    argv[1].trim().length === 0
  ) {
    throw new Error("HOMEPAGE_TRANSACTION_TEST_SOURCE_ROOT_ARGUMENTS");
  }

  const requestedRoot = realpathSync(path.resolve(argv[1]));
  if (!lstatSync(requestedRoot).isDirectory()) {
    throw new Error("HOMEPAGE_TRANSACTION_TEST_SOURCE_ROOT_NOT_DIRECTORY");
  }
  return requestedRoot;
}

const SOURCE_ROOT = parseSourceRoot(process.argv.slice(2));

function resolveSourcePath(repositoryPath) {
  if (
    typeof repositoryPath !== "string" ||
    repositoryPath.length === 0 ||
    path.isAbsolute(repositoryPath) ||
    repositoryPath.split("/").includes("..")
  ) {
    throw new Error("HOMEPAGE_TRANSACTION_TEST_SOURCE_PATH_INVALID");
  }

  const canonical = realpathSync(path.resolve(SOURCE_ROOT, repositoryPath));
  const relative = path.relative(SOURCE_ROOT, canonical);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("HOMEPAGE_TRANSACTION_TEST_SOURCE_PATH_ESCAPE");
  }
  if (!lstatSync(canonical).isFile()) {
    throw new Error("HOMEPAGE_TRANSACTION_TEST_SOURCE_NOT_FILE");
  }
  return canonical;
}

const ADMIN_PATH = resolveSourcePath("lib/homepage-control-admin.ts");
const DEFAULTS_PATH = resolveSourcePath("lib/homepage-control-defaults.ts");
const adminSource = readFileSync(ADMIN_PATH, "utf8");

const CONFIG_ID = "11111111-1111-4111-8111-111111111111";
const RUN_ID = "22222222-2222-4222-8222-222222222222";
const ACTOR = Object.freeze({
  id: "33333333-3333-4333-8333-333333333333",
  label: "Fabricated Admin",
});
const BASE_TIME = "2026-07-30T00:00:00.000Z";
const MUTATION_TIME = "2026-07-31T00:00:00.000Z";
const RAW_DIAGNOSTIC =
  "raw sqlstate=XX999 service_role secret storage path must never escape";

function extractExportedFunctionSource(exportName, nextExportName) {
  const startMarker = `export async function ${exportName}(`;
  const endMarker = `export async function ${nextExportName}(`;
  const start = adminSource.indexOf(startMarker);
  const end = adminSource.indexOf(endMarker, start + startMarker.length);

  assert.ok(start >= 0, `HOMEPAGE_ATOMIC_PUBLISH_${exportName}_MISSING`);
  assert.ok(end > start, `HOMEPAGE_ATOMIC_PUBLISH_${nextExportName}_BOUNDARY_MISSING`);
  return adminSource.slice(start, end);
}

const atomicPublishSource = extractExportedFunctionSource(
  "publishHomepageControlConfigWithDependencies",
  "markHomepageControlConfigAsPreview",
);
assert.match(
  atomicPublishSource,
  /dependencies\.client\.rpc\(\s*["']publish_homepage_control_config["']/u,
  "HOMEPAGE_ATOMIC_PUBLISH_RPC_MISSING",
);
assert.doesNotMatch(
  atomicPublishSource,
  /\b(?:compensat|rollback|restore)\w*\b/iu,
  "HOMEPAGE_ATOMIC_PUBLISH_SOURCE_SIDE_COMPENSATION_FORBIDDEN",
);

function assertImportSafeSeam(exportName, domain) {
  assert.match(
    adminSource,
    new RegExp(`export\\s+async\\s+function\\s+${exportName}\\s*\\(`, "u"),
    `${domain}_FABRICATED_DEPENDENCY_SEAM_MISSING`,
  );
  assert.match(
    adminSource,
    /import\s+["']server-only["'];/u,
    `${domain}_SERVER_ONLY_BOUNDARY_MISSING`,
  );
  assert.doesNotMatch(
    adminSource,
    /^import\s+\{\s*supabaseAdmin\s*\}\s+from\s+["']\.\/supabase-admin["'];/mu,
    `${domain}_STATIC_PRIVILEGED_CLIENT_IMPORT`,
  );
  assert.doesNotMatch(
    adminSource,
    /\bprocess\.env\b/u,
    `${domain}_ENVIRONMENT_ACCESS`,
  );
  assert.doesNotMatch(
    adminSource,
    /\bcreateClient\s*\(/u,
    `${domain}_REAL_CLIENT_CONSTRUCTION`,
  );
}

async function loadHomepageModule(exportName, domain) {
  assertImportSafeSeam(exportName, domain);
  const loadedModule = await import(pathToFileURL(ADMIN_PATH).href);
  assert.equal(
    typeof loadedModule[exportName],
    "function",
    `${domain}_FABRICATED_DEPENDENCY_EXPORT_INVALID`,
  );
  return loadedModule;
}

async function loadDefaults() {
  const loadedModule = await import(pathToFileURL(DEFAULTS_PATH).href);
  return loadedModule.createDefaultHomepageControlDraftValues();
}

function response(data, error = null) {
  return { data, error };
}

function createFabricatedPostgrestClient(script) {
  const queues = new Map(
    Object.entries(script).map(([key, values]) => [key, [...values]]),
  );
  const calls = [];

  function consume(record, terminal) {
    const key = `${record.table}:${record.verb}:${terminal}`;
    const queue = queues.get(key);
    if (!queue || queue.length === 0) {
      throw new Error(`FABRICATED_UNEXPECTED_QUERY:${key}`);
    }

    const outcome = queue.shift();
    calls.push({
      ...record,
      filters: record.filters.map((filter) => ({ ...filter })),
      modifiers: record.modifiers.map((modifier) => ({ ...modifier })),
      terminal,
    });

    if (outcome && typeof outcome === "object" && "throw" in outcome) {
      throw new Error(outcome.throw);
    }
    return outcome;
  }

  function from(table) {
    const record = {
      table,
      verb: "select",
      payload: null,
      projection: null,
      filters: [],
      modifiers: [],
    };
    let consumed = false;

    function finish(terminal) {
      if (consumed) throw new Error("FABRICATED_QUERY_ALREADY_CONSUMED");
      consumed = true;
      return consume(record, terminal);
    }

    const builder = {
      select(columns = "*") {
        record.projection = columns;
        return builder;
      },
      insert(payload) {
        record.verb = "insert";
        record.payload = payload;
        return builder;
      },
      upsert(payload, options) {
        record.verb = "upsert";
        record.payload = payload;
        record.modifiers.push({ kind: "upsert-options", value: options });
        return builder;
      },
      update(payload) {
        record.verb = "update";
        record.payload = payload;
        return builder;
      },
      delete() {
        record.verb = "delete";
        return builder;
      },
      eq(column, value) {
        record.filters.push({ kind: "eq", column, value });
        return builder;
      },
      in(column, value) {
        record.filters.push({ kind: "in", column, value });
        return builder;
      },
      order(column, options) {
        record.modifiers.push({ kind: "order", column, value: options });
        return builder;
      },
      limit(value) {
        record.modifiers.push({ kind: "limit", value });
        return builder;
      },
      single() {
        return Promise.resolve(finish("single"));
      },
      maybeSingle() {
        return Promise.resolve(finish("maybeSingle"));
      },
      then(resolve, reject) {
        return Promise.resolve()
          .then(() => finish("await"))
          .then(resolve, reject);
      },
    };

    return builder;
  }

  return {
    client: {
      from,
      rpc() {
        throw new Error("FABRICATED_RPC_NOT_AUTHORIZED_IN_THIS_TEST");
      },
    },
    calls,
  };
}

async function withNetworkGuard(callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("FABRICATED_NETWORK_ACCESS_BLOCKED");
  };

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function createConfig(overrides = {}) {
  const defaults = await loadDefaults();
  return {
    ...defaults,
    id: CONFIG_ID,
    status: "draft",
    version: 7,
    is_active: false,
    created_by: ACTOR.id,
    updated_by: ACTOR.id,
    published_by: null,
    published_at: null,
    created_at: BASE_TIME,
    updated_at: BASE_TIME,
    ...overrides,
  };
}

function checklistRun(config, overrides = {}) {
  return {
    id: RUN_ID,
    config_id: config.id,
    checklist: config.pre_publish_checklist.map((item) => ({ ...item })),
    completed_by: null,
    completed_at: null,
    created_at: BASE_TIME,
    updated_at: BASE_TIME,
    ...overrides,
  };
}

function hasFilter(call, column, value) {
  return call.filters.some(
    (filter) =>
      filter.kind === "eq" && filter.column === column && filter.value === value,
  );
}

function assertNoRawDiagnostic(value, domain) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(RAW_DIAGNOSTIC), false, `${domain}_RAW_LEAK`);
  assert.equal(serialized.includes("sqlstate"), false, `${domain}_SQLSTATE_LEAK`);
  assert.equal(
    serialized.includes("service_role"),
    false,
    `${domain}_SERVICE_ROLE_LEAK`,
  );
  assert.equal(
    serialized.includes("storage path"),
    false,
    `${domain}_STORAGE_PATH_LEAK`,
  );
}

test("HOMEPAGE_CHECKLIST_AUDIT_FAILURE restores the prior run with a checkable concurrency guard", async () => {
  const domain = "HOMEPAGE_CHECKLIST_AUDIT_FAILURE";
  const loadedModule = await loadHomepageModule(
    "updateHomepageControlPreviewChecklistWithDependencies",
    domain,
  );
  const config = await createConfig({ status: "preview" });
  const priorRun = checklistRun(config);
  assert.ok(priorRun.checklist.length > 0, `${domain}_FIXTURE_CHECKLIST_EMPTY`);
  const changedChecklist = priorRun.checklist.map((item, index) => ({
    ...item,
    completed: index === 0 ? true : item.completed,
  }));
  const writtenRun = checklistRun(config, {
    checklist: changedChecklist,
    updated_at: MUTATION_TIME,
  });
  const fabricated = createFabricatedPostgrestClient({
    "homepage_control_configs:select:maybeSingle": [
      response(config),
      response(config),
    ],
    "homepage_control_checklist_runs:select:maybeSingle": [response(priorRun)],
    "homepage_control_checklist_runs:upsert:single": [response(writtenRun)],
    "homepage_control_audit_events:insert:await": [
      response(null, { message: RAW_DIAGNOSTIC }),
    ],
    "homepage_control_checklist_runs:update:maybeSingle": [response(priorRun)],
  });

  const result = await withNetworkGuard(() =>
    loadedModule.updateHomepageControlPreviewChecklistWithDependencies(
      config.id,
      {
        checklist: changedChecklist.map((item) => ({
          id: item.id,
          completed: item.completed,
        })),
      },
      ACTOR,
      { client: fabricated.client, now: () => MUTATION_TIME },
    ),
  );

  assert.equal(result.success, false);
  assert.equal(result.run, null);
  assert.deepEqual(result.errors, [
    "Failed to create Homepage Control Room preview checklist audit event.",
  ]);
  assertNoRawDiagnostic(result, domain);

  const upsertIndex = fabricated.calls.findIndex(
    (call) =>
      call.table === "homepage_control_checklist_runs" && call.verb === "upsert",
  );
  const auditIndex = fabricated.calls.findIndex(
    (call) =>
      call.table === "homepage_control_audit_events" && call.verb === "insert",
  );
  const compensationIndex = fabricated.calls.findIndex(
    (call, index) =>
      index > auditIndex &&
      call.table === "homepage_control_checklist_runs" &&
      call.verb === "update",
  );
  assert.ok(upsertIndex >= 0 && upsertIndex < auditIndex, `${domain}_PRIMARY_ORDER`);
  assert.ok(
    auditIndex >= 0 && auditIndex < compensationIndex,
    `${domain}_COMPENSATION_ORDER`,
  );

  const compensation = fabricated.calls[compensationIndex];
  assert.deepEqual(compensation.payload.checklist, priorRun.checklist);
  assert.equal(hasFilter(compensation, "id", writtenRun.id), true);
  assert.equal(hasFilter(compensation, "config_id", config.id), true);
  assert.equal(
    hasFilter(compensation, "updated_at", writtenRun.updated_at),
    true,
  );
  assert.equal(compensation.terminal, "maybeSingle");
});

test("HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION restores only the version it wrote", async () => {
  const domain =
    "HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION";
  const loadedModule = await loadHomepageModule(
    "updateHomepageControlDraftWithDependencies",
    domain,
  );
  const current = await createConfig();
  const updated = {
    ...current,
    version: current.version + 1,
    content: {
      ...current.content,
      hero: {
        title: "Find the right AI tool",
        subtitle: "Compare trusted AI tools for the work you need to do.",
      },
    },
    updated_at: MUTATION_TIME,
  };
  const fabricated = createFabricatedPostgrestClient({
    "homepage_control_configs:select:maybeSingle": [response(current)],
    "homepage_control_configs:update:maybeSingle": [
      response(updated),
      response(current),
    ],
    "homepage_control_audit_events:insert:await": [
      response(null, { message: RAW_DIAGNOSTIC }),
    ],
  });

  const result = await withNetworkGuard(() =>
    loadedModule.updateHomepageControlDraftWithDependencies(
      current.id,
      {
        layoutPreset: current.config.layoutPreset,
        densityPreset: current.config.densityPreset,
        heroTitle: updated.content.hero.title,
        heroSubtitle: updated.content.hero.subtitle,
        checklist: current.pre_publish_checklist.map((item) => ({
          id: item.id,
          completed: item.completed,
        })),
      },
      ACTOR,
      { client: fabricated.client, now: () => MUTATION_TIME },
    ),
  );

  assert.equal(result.draft, null);
  assert.deepEqual(result.errors, [
    "Failed to create Homepage Control Room audit event.",
  ]);
  assertNoRawDiagnostic(result, domain);

  const writes = fabricated.calls.filter(
    (call) =>
      call.table === "homepage_control_configs" && call.verb === "update",
  );
  assert.equal(writes.length, 2, `${domain}_WRITE_COUNT`);
  const [primary, compensation] = writes;
  assert.equal(primary.payload.version, current.version + 1);
  assert.equal(hasFilter(primary, "id", current.id), true);
  assert.equal(hasFilter(primary, "status", "draft"), true);
  assert.equal(hasFilter(primary, "version", current.version), true);
  assert.equal(primary.terminal, "maybeSingle");
  assert.equal(compensation.payload.version, current.version);
  assert.equal(hasFilter(compensation, "id", current.id), true);
  assert.equal(hasFilter(compensation, "status", "draft"), true);
  assert.equal(
    hasFilter(compensation, "version", current.version + 1),
    true,
  );
  assert.equal(compensation.terminal, "maybeSingle");
});

test("HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION reports a fixed compensation conflict without overwriting a newer version", async () => {
  const domain =
    "HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION";
  const loadedModule = await loadHomepageModule(
    "updateHomepageControlDraftWithDependencies",
    domain,
  );
  const current = await createConfig();
  const updated = {
    ...current,
    version: current.version + 1,
    content: {
      ...current.content,
      hero: {
        title: "Find the right AI tool",
        subtitle: "Compare trusted AI tools for the work you need to do.",
      },
    },
    updated_at: MUTATION_TIME,
  };
  const fabricated = createFabricatedPostgrestClient({
    "homepage_control_configs:select:maybeSingle": [response(current)],
    "homepage_control_configs:update:maybeSingle": [
      response(updated),
      response(null),
    ],
    "homepage_control_audit_events:insert:await": [
      response(null, { message: RAW_DIAGNOSTIC }),
    ],
  });

  const result = await withNetworkGuard(() =>
    loadedModule.updateHomepageControlDraftWithDependencies(
      current.id,
      {
        layoutPreset: current.config.layoutPreset,
        densityPreset: current.config.densityPreset,
        heroTitle: updated.content.hero.title,
        heroSubtitle: updated.content.hero.subtitle,
        checklist: current.pre_publish_checklist.map((item) => ({
          id: item.id,
          completed: item.completed,
        })),
      },
      ACTOR,
      { client: fabricated.client, now: () => MUTATION_TIME },
    ),
  );

  assert.equal(result.draft, null);
  assert.ok(
    result.warnings.includes(
      "Homepage Control Room draft compensation could not be confirmed.",
    ),
    `${domain}_COMPENSATION_CONFLICT_NOT_REPORTED`,
  );
  assertNoRawDiagnostic(result, domain);
  const compensation = fabricated.calls.filter(
    (call) =>
      call.table === "homepage_control_configs" && call.verb === "update",
  )[1];
  assert.equal(
    hasFilter(compensation, "version", current.version + 1),
    true,
  );
});

test("HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION removes a newly inserted draft whose returned row is invalid", async () => {
  const domain =
    "HOMEPAGE_VERSIONED_COMPENSATION_AND_RAW_DIAGNOSTIC_EXCLUSION";
  const loadedModule = await loadHomepageModule(
    "createHomepageControlDraftWithDependencies",
    domain,
  );
  const invalidInsertedDraft = {
    ...(await createConfig({ version: 1 })),
    content: null,
  };
  const fabricated = createFabricatedPostgrestClient({
    "homepage_control_configs:insert:single": [
      response(invalidInsertedDraft),
    ],
    "homepage_control_configs:delete:maybeSingle": [
      response({ id: invalidInsertedDraft.id }),
    ],
  });

  const result = await withNetworkGuard(() =>
    loadedModule.createHomepageControlDraftWithDependencies(ACTOR, {
      client: fabricated.client,
      now: () => MUTATION_TIME,
    }),
  );

  assert.equal(result.draft, null);
  assert.equal(result.errors.length > 0, true, `${domain}_PARSE_ERROR_ABSENT`);
  const cleanup = fabricated.calls.find(
    (call) =>
      call.table === "homepage_control_configs" && call.verb === "delete",
  );
  assert.ok(cleanup, `${domain}_INVALID_CREATE_CLEANUP_ABSENT`);
  assert.equal(hasFilter(cleanup, "id", invalidInsertedDraft.id), true);
  assert.equal(hasFilter(cleanup, "status", "draft"), true);
  assert.equal(hasFilter(cleanup, "version", 1), true);
  assert.equal(cleanup.terminal, "maybeSingle");
  assert.equal(
    result.warnings.includes(
      "Homepage Control Room draft cleanup could not be confirmed.",
    ),
    false,
  );
  assertNoRawDiagnostic(result, domain);
});

test("HOMEPAGE_CHECKLIST_AUDIT_FAILURE restores the prior run when the returned upsert row is invalid", async () => {
  const domain = "HOMEPAGE_CHECKLIST_AUDIT_FAILURE";
  const loadedModule = await loadHomepageModule(
    "updateHomepageControlPreviewChecklistWithDependencies",
    domain,
  );
  const config = await createConfig({ status: "preview" });
  const priorRun = checklistRun(config);
  const invalidWrittenRun = {
    ...priorRun,
    checklist: "invalid-returned-checklist",
    updated_at: MUTATION_TIME,
  };
  const fabricated = createFabricatedPostgrestClient({
    "homepage_control_configs:select:maybeSingle": [
      response(config),
      response(config),
    ],
    "homepage_control_checklist_runs:select:maybeSingle": [
      response(priorRun),
    ],
    "homepage_control_checklist_runs:upsert:single": [
      response(invalidWrittenRun),
    ],
    "homepage_control_checklist_runs:update:maybeSingle": [
      response(priorRun),
    ],
  });

  const result = await withNetworkGuard(() =>
    loadedModule.updateHomepageControlPreviewChecklistWithDependencies(
      config.id,
      {
        checklist: priorRun.checklist.map((item, index) => ({
          id: item.id,
          completed: index === 0 ? true : item.completed,
        })),
      },
      ACTOR,
      { client: fabricated.client, now: () => MUTATION_TIME },
    ),
  );

  assert.equal(result.success, false);
  assert.equal(result.run, null);
  assert.equal(result.errors.length > 0, true, `${domain}_PARSE_ERROR_ABSENT`);
  const compensation = fabricated.calls.find(
    (call) =>
      call.table === "homepage_control_checklist_runs" &&
      call.verb === "update",
  );
  assert.ok(compensation, `${domain}_INVALID_UPSERT_COMPENSATION_ABSENT`);
  assert.equal(hasFilter(compensation, "id", invalidWrittenRun.id), true);
  assert.equal(hasFilter(compensation, "config_id", config.id), true);
  assert.equal(
    hasFilter(compensation, "updated_at", invalidWrittenRun.updated_at),
    true,
  );
  assert.equal(compensation.terminal, "maybeSingle");
  assert.equal(
    result.warnings.includes(
      "Homepage Control Room preview checklist compensation could not be confirmed.",
    ),
    false,
  );
  assertNoRawDiagnostic(result, domain);
});

console.log(
  "HOMEPAGE_SYNTHETIC_TRANSACTION_SUITE_REGISTERED domains=2 real_clients=0 network=0 env=0 database=0 storage=0 server=0 browser=0",
);
