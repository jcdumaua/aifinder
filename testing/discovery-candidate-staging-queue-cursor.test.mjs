import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("./register-typescript-test-loader.mjs");

const source = readFileSync(
  "lib/discovery/discovery-candidate-staging-queue-cursor.ts",
  "utf8",
);
const {
  createCandidateStagingQueueFiltersHash,
  createCandidateStagingQueueNextCursor,
  decodeCandidateStagingQueueCursor,
  encodeCandidateStagingQueueCursor,
} = await import(
  "../lib/discovery/discovery-candidate-staging-queue-cursor.ts"
);

const baseFilters = {
  statuses: ["staged", "needs_review", "duplicate_suspected"],
  search: null,
  duplicateCheckStatus: null,
  confidenceBucket: null,
  discoverySourceId: null,
  discoveryRunId: null,
  auditCorrelationId: null,
  limit: 25,
  sortKey: "created_at",
  sortDirection: "desc",
};

const basePayload = {
  version: 1,
  sortKey: "created_at",
  sortDirection: "desc",
  lastValue: "2026-06-29T00:00:00.000Z",
  lastCandidateId: "11111111-1111-4111-8111-111111111111",
  filtersHash: createCandidateStagingQueueFiltersHash(baseFilters),
};

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function replaceLastCharacter(value) {
  return `${value.slice(0, -1)}${value.endsWith("A") ? "B" : "A"}`;
}

test("encodes and decodes a signed cursor payload", () => {
  const token = encodeCandidateStagingQueueCursor(basePayload);
  const decoded = decodeCandidateStagingQueueCursor(token);

  assert.equal(decoded.ok, true);
  assert.deepEqual(decoded.payload, basePayload);
});

test("creates a next cursor from a valid last item", () => {
  const token = createCandidateStagingQueueNextCursor({
    sortKey: "updated_at",
    sortDirection: "asc",
    lastValue: "2026-06-30T00:00:00.000Z",
    lastCandidateId: "22222222-2222-4222-8222-222222222222",
    filtersHash: basePayload.filtersHash,
  });

  assert.equal(typeof token, "string");
  const decoded = decodeCandidateStagingQueueCursor(token);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.payload.sortKey, "updated_at");
  assert.equal(decoded.payload.sortDirection, "asc");
});

test("rejects tampered payload and signature tokens", () => {
  const token = encodeCandidateStagingQueueCursor(basePayload);
  const [payload, signature] = token.split(".");

  assert.deepEqual(
    decodeCandidateStagingQueueCursor(`${replaceLastCharacter(payload)}.${signature}`),
    { ok: false, errorCode: "invalid_cursor" },
  );
  assert.deepEqual(
    decodeCandidateStagingQueueCursor(`${payload}.${replaceLastCharacter(signature)}`),
    { ok: false, errorCode: "invalid_cursor" },
  );
});

test("rejects malformed tokens", () => {
  for (const token of ["", "not-a-token", "payload.", ".signature", "a.b.c"]) {
    assert.deepEqual(decodeCandidateStagingQueueCursor(token), {
      ok: false,
      errorCode: "invalid_cursor",
    });
  }
});

test("rejects unsupported cursor versions", () => {
  const token = encodeCandidateStagingQueueCursor({
    ...basePayload,
    version: 999,
  });

  assert.deepEqual(decodeCandidateStagingQueueCursor(token), {
    ok: false,
    errorCode: "cursor_version_unsupported",
  });
});

// unsupported version regression marker
test("filters hash is stable for equivalent filters and changes for filter changes", () => {
  const firstHash = createCandidateStagingQueueFiltersHash(baseFilters);
  const equivalentHash = createCandidateStagingQueueFiltersHash({
    ...baseFilters,
    statuses: ["needs_review", "staged", "duplicate_suspected"],
    search: "",
  });
  const changedHash = createCandidateStagingQueueFiltersHash({
    ...baseFilters,
    search: "new filter",
  });

  assert.equal(firstHash, equivalentHash);
  assert.notEqual(firstHash, changedHash);
});

test("cursor token does not expose raw JSON fields or signing details", () => {
  const token = encodeCandidateStagingQueueCursor(basePayload);

  for (const rawTokenFragment of [
    "sortKey",
    "lastCandidateId",
    "filtersHash",
    basePayload.lastCandidateId,
  ]) {
    assert.equal(token.includes(rawTokenFragment), false);
  }

  assert.equal(source.includes("console."), false, "cursor helper must not log");
  assert.equal(
    source.includes("CANDIDATE_STAGING_QUEUE_CURSOR_SECRET"),
    true,
    "cursor helper should use a server-only signing secret",
  );
});

for (const { name, fn } of tests) {
  await fn();
  console.log(`ok - ${name}`);
}

console.log(`\nPhase 16C cursor helper tests passed: ${tests.length}/${tests.length}`);
