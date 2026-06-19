import assert from "node:assert/strict";
import test from "node:test";

const { buildDiscoveryRequestPlan, buildDiscoveryRequestPlans } = await import(
  "../lib/discovery-request-plan.ts"
);

test("builds a fetch-disabled request plan from a safe URL", () => {
  const result = buildDiscoveryRequestPlan(
    "https://example.com/path?query=1",
    "2026-06-19T00:00:00.000Z"
  );

  assert.deepEqual(result, {
    ok: true,
    plan: {
      normalizedUrl: "https://example.com/path?query=1",
      hostname: "example.com",
      protocol: "https:",
      method: "GET",
      fetchDisabled: true,
      noNetworkRequestPerformed: true,
      timeoutMs: 10_000,
      redirectLimit: 0,
      responseSizeLimitBytes: 1_000_000,
      userAgent: "AiFinder Discovery Engine/1.0",
      createdAt: "2026-06-19T00:00:00.000Z",
    },
  });
});

test("returns only a safe failure reason for an unsafe URL", () => {
  assert.deepEqual(
    buildDiscoveryRequestPlan("https://127.0.0.1", "2026-06-19T00:00:00.000Z"),
    { ok: false, reason: "blocked_ip_address" }
  );
});

test("does not return partial plans when any curated URL fails preflight", () => {
  assert.deepEqual(
    buildDiscoveryRequestPlans(
      ["https://example.com", "https://127.0.0.1"],
      "2026-06-19T00:00:00.000Z"
    ),
    { ok: false, reason: "blocked_ip_address" }
  );
});
