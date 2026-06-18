import assert from "node:assert/strict";
import test from "node:test";

const {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} = await import("../lib/admin-rate-limit.ts");

function requestForIp(ip) {
  return new Request("https://aifinder.test/api/admin/discovery", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

test("limits discovery source writes by admin actor label", () => {
  const actor = { id: null, label: "AiFinder Admin Rate Test" };
  const now = 1_000_000;

  for (let index = 0; index < 20; index += 1) {
    const result = checkAdminRateLimit({
      request: requestForIp(`203.0.113.${index}`),
      action: ADMIN_RATE_LIMIT_ACTIONS.discoverySourceCreate,
      actor,
      now,
    });

    assert.equal(result.allowed, true);
  }

  const limited = checkAdminRateLimit({
    request: requestForIp("203.0.113.250"),
    action: ADMIN_RATE_LIMIT_ACTIONS.discoverySourceCreate,
    actor,
    now,
  });

  assert.equal(limited.allowed, false);

  const responseData = getAdminRateLimitResponseData(limited);
  const serializedData = JSON.stringify(responseData);

  assert.equal(
    responseData.error,
    "Too many admin requests. Please wait and try again.",
  );
  assert.equal(responseData.metadata.retryAfterSeconds, 600);
  assert.equal(serializedData.includes(actor.label), false);
  assert.equal(serializedData.includes("203.0.113"), false);
});

test("uses fallback IP and resets after the fixed window", () => {
  const now = 2_000_000;

  for (let index = 0; index < 30; index += 1) {
    const result = checkAdminRateLimit({
      request: requestForIp("198.51.100.25"),
      action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualIntake,
      actor: null,
      now,
    });

    assert.equal(result.allowed, true);
  }

  const limited = checkAdminRateLimit({
    request: requestForIp("198.51.100.25"),
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualIntake,
    actor: null,
    now,
  });

  assert.equal(limited.allowed, false);
  assert.equal(
    getAdminRateLimitResponseData(limited).metadata.retryAfterSeconds,
    600,
  );

  const reset = checkAdminRateLimit({
    request: requestForIp("198.51.100.25"),
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualIntake,
    actor: null,
    now: now + 600_001,
  });

  assert.equal(reset.allowed, true);

  const otherIp = checkAdminRateLimit({
    request: requestForIp("198.51.100.26"),
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualIntake,
    actor: null,
    now,
  });

  assert.equal(otherIp.allowed, true);
});
