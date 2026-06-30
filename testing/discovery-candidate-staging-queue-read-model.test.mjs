import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("./register-typescript-test-loader.mjs");

const sourcePath = "lib/discovery/discovery-candidate-staging-queue-read-model.ts";
const source = readFileSync(sourcePath, "utf8");
const moduleUnderTest = await import(
  "../lib/discovery/discovery-candidate-staging-queue-read-model.ts"
);
const cursorModule = await import(
  "../lib/discovery/discovery-candidate-staging-queue-cursor.ts"
);

const {
  DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES,
  DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS,
  listDiscoveryCandidateStagingQueueItems,
} = moduleUnderTest;
const {
  createCandidateStagingQueueFiltersHash,
  encodeCandidateStagingQueueCursor,
} = cursorModule;

const ACTIVE_STATUSES = ["staged", "needs_review", "duplicate_suspected"];

const baseRow = {
  id: "11111111-1111-4111-8111-111111111111",
  candidate_name: "Active Queue Tool",
  candidate_status: "staged",
  candidate_website_url: "https://example.com/active-tool",
  candidate_category_hint: "Productivity",
  candidate_pricing_hint: "Free",
  candidate_description: "A safe active candidate.",
  confidence_bucket: "medium",
  duplicate_check_status: "unchecked",
  duplicate_signal_types: ["domain"],
  risk_flags: [],
  discovery_source_id: "22222222-2222-4222-8222-222222222222",
  discovery_run_id: "33333333-3333-4333-8333-333333333333",
  audit_correlation_id: "44444444-4444-4444-8444-444444444444",
  source_url: "https://example.com/",
  source_domain: "example.com",
  source_evidence_kind: "preview_artifact",
  source_evidence_locator: "phase16c-test",
  created_at: "2026-06-29T00:00:00.000Z",
  updated_at: "2026-06-29T00:00:00.000Z",
};

const archivedSmokeRow = {
  ...baseRow,
  id: "eafa4925-4cd9-4361-a8d0-37c8c6bdf65f",
  candidate_name: "Phase 14K Controlled Preview Artifact Smoke Tool",
  candidate_status: "archived",
  candidate_website_url: "https://example.com/phase-14k-controlled-preview-tool",
  audit_correlation_id: "b5f334b2-b22a-4144-8655-6da1e34e3961",
};

const paginatedRows = [
  {
    ...baseRow,
    id: "33333333-3333-4333-8333-333333333333",
    candidate_name: "Newest Active Tool",
    created_at: "2026-06-30T00:00:00.000Z",
    updated_at: "2026-06-30T00:00:00.000Z",
  },
  {
    ...baseRow,
    id: "22222222-2222-4222-8222-222222222222",
    candidate_name: "Tie Breaker Active Tool",
    created_at: "2026-06-29T00:00:00.000Z",
    updated_at: "2026-06-29T00:00:00.000Z",
  },
  {
    ...baseRow,
    id: "11111111-1111-4111-8111-111111111111",
    candidate_name: "Oldest Active Tool",
    created_at: "2026-06-29T00:00:00.000Z",
    updated_at: "2026-06-29T00:00:00.000Z",
  },
];

class FakeQueryBuilder {
  constructor(rows, recorder) {
    this.rows = rows;
    this.recorder = recorder;
    this.statusFilter = null;
    this.eqFilters = [];
    this.limitValue = null;
    this.cursorFilters = [];
  }

  select(columns, options) {
    this.recorder.selectedColumns = columns;
    this.recorder.selectOptions = options;
    return this;
  }

  in(column, values) {
    this.recorder.inCalls.push({ column, values: [...values] });
    if (column === "candidate_status") {
      this.statusFilter = [...values];
    }
    return this;
  }

  eq(column, value) {
    this.recorder.eqCalls.push({ column, value });
    this.eqFilters.push({ column, value });
    return this;
  }

  order(column, options) {
    this.recorder.orderCalls.push({ column, options });
    return this;
  }

  limit(value) {
    this.recorder.limitCalls.push(value);
    this.limitValue = value;
    return this;
  }

  or(filter) {
    this.recorder.orCalls.push(filter);
    if (/^(created_at|updated_at)\.(lt|gt)\./.test(filter)) {
      this.cursorFilters.push(filter);
    }
    return this;
  }

  insert() {
    this.recorder.mutationCalls.push("insert");
    throw new Error("Mutation method should not be called.");
  }

  update() {
    this.recorder.mutationCalls.push("update");
    throw new Error("Mutation method should not be called.");
  }

  upsert() {
    this.recorder.mutationCalls.push("upsert");
    throw new Error("Mutation method should not be called.");
  }

  delete() {
    this.recorder.mutationCalls.push("delete");
    throw new Error("Mutation method should not be called.");
  }

  rpc() {
    this.recorder.mutationCalls.push("rpc");
    throw new Error("Mutation method should not be called.");
  }

  then(resolve, reject) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }

  applyCursorFilter(rows, filter) {
    const match = filter.match(
      /^(created_at|updated_at)\.(lt|gt)\.([^,]+),and\(\1\.eq\.\3,id\.\2\.([0-9a-f-]+)\)$/i,
    );

    if (!match) return rows;

    const [, column, operator, lastValue, lastCandidateId] = match;

    return rows.filter((row) => {
      const value = row[column];

      if (operator === "gt") {
        return value > lastValue || (value === lastValue && row.id > lastCandidateId);
      }

      return value < lastValue || (value === lastValue && row.id < lastCandidateId);
    });
  }

  execute() {
    let rows = [...this.rows];

    if (this.statusFilter) {
      rows = rows.filter((row) => this.statusFilter.includes(row.candidate_status));
    }

    for (const filter of this.eqFilters) {
      rows = rows.filter((row) => row[filter.column] === filter.value);
    }

    for (const filter of this.cursorFilters) {
      rows = this.applyCursorFilter(rows, filter);
    }

    rows.sort((first, second) => {
      for (const { column, options } of this.recorder.orderCalls) {
        const firstValue = first[column] ?? "";
        const secondValue = second[column] ?? "";

        if (firstValue === secondValue) continue;

        const comparison = firstValue > secondValue ? 1 : -1;
        return options.ascending ? comparison : -comparison;
      }

      return 0;
    });

    if (typeof this.limitValue === "number") {
      rows = rows.slice(0, this.limitValue);
    }

    return {
      data: rows,
      error: null,
      count: rows.length,
    };
  }
}

function createFakeClient(rows = [baseRow, archivedSmokeRow]) {
  const recorder = {
    tableName: null,
    selectedColumns: null,
    selectOptions: null,
    inCalls: [],
    eqCalls: [],
    orderCalls: [],
    limitCalls: [],
    orCalls: [],
    mutationCalls: [],
  };

  const client = {
    from(tableName) {
      recorder.tableName = tableName;
      return new FakeQueryBuilder(rows, recorder);
    },
  };

  return { client, recorder };
}

function defaultFiltersHash(overrides = {}) {
  return createCandidateStagingQueueFiltersHash({
    statuses: ACTIVE_STATUSES,
    search: null,
    duplicateCheckStatus: null,
    confidenceBucket: null,
    discoverySourceId: null,
    discoveryRunId: null,
    auditCorrelationId: null,
    limit: 2,
    sortKey: "created_at",
    sortDirection: "desc",
    ...overrides,
  });
}

function createCursor(payloadOverrides = {}) {
  return encodeCandidateStagingQueueCursor({
    version: 1,
    sortKey: "created_at",
    sortDirection: "desc",
    lastValue: "2026-06-29T00:00:00.000Z",
    lastCandidateId: "22222222-2222-4222-8222-222222222222",
    filtersHash: defaultFiltersHash(),
    ...payloadOverrides,
  });
}

async function expectCode(promiseFactory, expectedCode) {
  await assert.rejects(
    promiseFactory,
    (error) => {
      assert.equal(error.code, expectedCode);
      return true;
    },
  );
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("exports the active status allowlist exactly", () => {
  assert.deepEqual(
    [...DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES],
    ACTIVE_STATUSES,
  );
});

test("defaults to active statuses, safe projection, created_at desc, and limit 25", async () => {
  const { client, recorder } = createFakeClient();

  const result = await listDiscoveryCandidateStagingQueueItems({}, { client });

  assert.equal(recorder.tableName, "discovery_candidate_tools");
  assert.equal(
    recorder.selectedColumns,
    DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS.join(", "),
  );
  assert.deepEqual(recorder.selectOptions, { count: "exact" });
  assert.deepEqual(recorder.inCalls, [
    { column: "candidate_status", values: ACTIVE_STATUSES },
  ]);
  assert.deepEqual(recorder.orderCalls, [
    { column: "created_at", options: { ascending: false } },
    { column: "id", options: { ascending: false } },
  ]);
  assert.deepEqual(recorder.limitCalls, [26]);
  assert.deepEqual(result.appliedStatuses, ACTIVE_STATUSES);
  assert.equal(result.hasNextPage, false);
  assert.equal(result.nextCursor, null);
  assert.equal(result.limit, 25);
  assert.equal(result.sortKey, "created_at");
  assert.equal(result.sortDirection, "desc");
  assert.equal(result.totalCount, 1);
});

test("excludes the archived Phase 14 smoke artifact through the status allowlist", async () => {
  const { client } = createFakeClient();

  const result = await listDiscoveryCandidateStagingQueueItems({}, { client });

  assert.deepEqual(
    result.items.map((item) => item.candidateId),
    ["11111111-1111-4111-8111-111111111111"],
  );
  assert.equal(
    result.items.some(
      (item) => item.candidateId === "eafa4925-4cd9-4361-a8d0-37c8c6bdf65f",
    ),
    false,
  );
});

test("maps snake_case rows to camelCase queue items", async () => {
  const { client } = createFakeClient([baseRow]);

  const result = await listDiscoveryCandidateStagingQueueItems({}, { client });
  const [item] = result.items;

  assert.equal(item.candidateId, baseRow.id);
  assert.equal(item.candidateName, baseRow.candidate_name);
  assert.equal(item.candidateStatus, baseRow.candidate_status);
  assert.equal(item.candidateWebsiteUrl, baseRow.candidate_website_url);
  assert.equal(item.candidateCategoryHint, baseRow.candidate_category_hint);
  assert.equal(item.candidatePricingHint, baseRow.candidate_pricing_hint);
  assert.equal(item.candidateDescription, baseRow.candidate_description);
  assert.equal(item.confidenceBucket, baseRow.confidence_bucket);
  assert.equal(item.duplicateCheckStatus, baseRow.duplicate_check_status);
  assert.deepEqual(item.duplicateSignalTypes, baseRow.duplicate_signal_types);
  assert.deepEqual(item.riskFlags, baseRow.risk_flags);
  assert.equal(item.discoverySourceId, baseRow.discovery_source_id);
  assert.equal(item.discoveryRunId, baseRow.discovery_run_id);
  assert.equal(item.auditCorrelationId, baseRow.audit_correlation_id);
  assert.equal(item.sourceUrl, baseRow.source_url);
  assert.equal(item.sourceDomain, baseRow.source_domain);
  assert.equal(item.sourceEvidenceKind, baseRow.source_evidence_kind);
  assert.equal(item.sourceEvidenceLocator, baseRow.source_evidence_locator);
  assert.equal(item.createdAt, baseRow.created_at);
  assert.equal(item.updatedAt, baseRow.updated_at);
});

test("rejects inactive and forbidden statuses", async () => {
  for (const status of [
    "archived",
    "rejected",
    "approved",
    "published",
    "promoted",
    "live",
    "public",
  ]) {
    await expectCode(
      () =>
        listDiscoveryCandidateStagingQueueItems(
          { statuses: [status] },
          { client: createFakeClient().client },
        ),
      "invalid_status_filter",
    );
  }
});

test("deduplicates valid status filters while preserving order", async () => {
  const { client } = createFakeClient();

  const result = await listDiscoveryCandidateStagingQueueItems(
    { statuses: ["needs_review", "staged", "needs_review"] },
    { client },
  );

  assert.deepEqual(result.appliedStatuses, ["needs_review", "staged"]);
});

test("validates bounded limits", async () => {
  const invalidLimits = [0, -1, 51, 999, Number.NaN, Number.POSITIVE_INFINITY];

  for (const limit of invalidLimits) {
    await expectCode(
      () =>
        listDiscoveryCandidateStagingQueueItems(
          { limit },
          { client: createFakeClient().client },
        ),
      "invalid_limit",
    );
  }

  const { recorder, client } = createFakeClient();
  await listDiscoveryCandidateStagingQueueItems({ limit: 50 }, { client });
  assert.deepEqual(recorder.limitCalls, [51]);
});

test("validates sort key and sort direction allowlists", async () => {
  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { sortKey: "candidate_name" },
        { client: createFakeClient().client },
      ),
    "invalid_sort_key",
  );

  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { sortDirection: "sideways" },
        { client: createFakeClient().client },
      ),
    "invalid_sort_direction",
  );

  const { recorder, client } = createFakeClient();
  await listDiscoveryCandidateStagingQueueItems(
    { sortKey: "updated_at", sortDirection: "asc" },
    { client },
  );

  assert.deepEqual(recorder.orderCalls, [
    { column: "updated_at", options: { ascending: true } },
    { column: "id", options: { ascending: true } },
  ]);
});

test("validates UUID filters and applies valid UUID filters", async () => {
  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { discoveryRunId: "not-a-uuid" },
        { client: createFakeClient().client },
      ),
    "invalid_uuid_filter",
  );

  const { recorder, client } = createFakeClient();
  await listDiscoveryCandidateStagingQueueItems(
    {
      discoverySourceId: "22222222-2222-4222-8222-222222222222",
      discoveryRunId: "33333333-3333-4333-8333-333333333333",
      auditCorrelationId: "44444444-4444-4444-8444-444444444444",
    },
    { client },
  );

  assert.deepEqual(recorder.eqCalls, [
    {
      column: "discovery_source_id",
      value: "22222222-2222-4222-8222-222222222222",
    },
    {
      column: "discovery_run_id",
      value: "33333333-3333-4333-8333-333333333333",
    },
    {
      column: "audit_correlation_id",
      value: "44444444-4444-4444-8444-444444444444",
    },
  ]);
});

test("applies optional duplicate, confidence, and search filters safely", async () => {
  const { recorder, client } = createFakeClient();

  await listDiscoveryCandidateStagingQueueItems(
    {
      duplicateCheckStatus: "unchecked",
      confidenceBucket: "medium",
      search: "Example, Tool",
    },
    { client },
  );

  assert.deepEqual(recorder.eqCalls, [
    { column: "duplicate_check_status", value: "unchecked" },
    { column: "confidence_bucket", value: "medium" },
  ]);
  assert.equal(recorder.orCalls.length, 1);
  assert.match(recorder.orCalls[0], /candidate_name\.ilike\.%Example  Tool%/);
  assert.match(recorder.orCalls[0], /candidate_website_url\.ilike\.%Example  Tool%/);
  assert.match(recorder.orCalls[0], /source_domain\.ilike\.%Example  Tool%/);
});

test("returns next cursor for timestamp first page when an extra row exists", async () => {
  const { client, recorder } = createFakeClient(paginatedRows);

  const result = await listDiscoveryCandidateStagingQueueItems(
    { limit: 2 },
    { client },
  );

  assert.deepEqual(recorder.limitCalls, [3]);
  assert.deepEqual(
    result.items.map((item) => item.candidateName),
    ["Newest Active Tool", "Tie Breaker Active Tool"],
  );
  assert.equal(result.hasNextPage, true);
  assert.equal(typeof result.nextCursor, "string");
  assert.equal(result.items.length, 2);
});

test("uses a valid timestamp cursor to fetch the next page without duplicates", async () => {
  const { client: firstClient } = createFakeClient(paginatedRows);
  const firstPage = await listDiscoveryCandidateStagingQueueItems(
    { limit: 2 },
    { client: firstClient },
  );

  const { client: nextClient, recorder } = createFakeClient(paginatedRows);
  const nextPage = await listDiscoveryCandidateStagingQueueItems(
    { limit: 2, cursor: firstPage.nextCursor },
    { client: nextClient },
  );

  assert.equal(recorder.orCalls.some((filter) => filter.includes("created_at.lt.")), true);
  assert.deepEqual(
    nextPage.items.map((item) => item.candidateName),
    ["Oldest Active Tool"],
  );
  assert.equal(nextPage.hasNextPage, false);
  assert.equal(nextPage.nextCursor, null);
});

test("rejects malformed and tampered cursors safely", async () => {
  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { limit: 2, cursor: "future-cursor" },
        { client: createFakeClient(paginatedRows).client },
      ),
    "candidate_queue_invalid_cursor",
  );

  const token = createCursor();
  const tamperedToken = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { limit: 2, cursor: tamperedToken },
        { client: createFakeClient(paginatedRows).client },
      ),
    "candidate_queue_invalid_cursor",
  );
});

test("rejects cursor mismatches and unsupported cursor versions safely", async () => {
  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { limit: 25, cursor: createCursor() },
        { client: createFakeClient(paginatedRows).client },
      ),
    "candidate_queue_cursor_mismatch",
  );

  const unsupportedVersionCursor = encodeCandidateStagingQueueCursor({
    version: 999,
    sortKey: "created_at",
    sortDirection: "desc",
    lastValue: "2026-06-29T00:00:00.000Z",
    lastCandidateId: "22222222-2222-4222-8222-222222222222",
    filtersHash: defaultFiltersHash(),
  });

  await expectCode(
    () =>
      listDiscoveryCandidateStagingQueueItems(
        { limit: 2, cursor: unsupportedVersionCursor },
        { client: createFakeClient(paginatedRows).client },
      ),
    "candidate_queue_cursor_version_unsupported",
  );
});

test("keeps confidence_bucket first-page sorting cursor-free in this phase", async () => {
  const { client } = createFakeClient(paginatedRows);

  const result = await listDiscoveryCandidateStagingQueueItems(
    { limit: 2, sortKey: "confidence_bucket", sortDirection: "asc" },
    { client },
  );

  assert.equal(result.hasNextPage, false);
  assert.equal(result.nextCursor, null);
});

test("requires an injected read client in the helper-only phase", async () => {
  await expectCode(
    () => listDiscoveryCandidateStagingQueueItems(),
    "candidate_queue_read_failed",
  );
});

test("does not expose unsafe fields in the safe projection", () => {
  const safeColumns = [...DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS];

  for (const forbidden of [
    "raw_html",
    "raw_payload",
    "service_role_key",
    "environment",
    "secret",
    "public_tools_write",
    "approval_mutation",
    "promotion_mutation",
  ]) {
    assert.equal(
      safeColumns.some((column) => column.includes(forbidden)),
      false,
      `${forbidden} should not be selected`,
    );
  }
});

test("does not contain mutation call sites in the helper source", () => {
  for (const pattern of [
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    ".rpc(",
  ]) {
    assert.equal(source.includes(pattern), false, `${pattern} must not exist`);
  }
});

for (const { name, fn } of tests) {
  await fn();
  console.log(`ok - ${name}`);
}

console.log(`\nPhase 16C read model helper tests passed: ${tests.length}/${tests.length}`);
