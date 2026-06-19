import {
  validateDiscoveryUrlSafety,
  type DiscoveryUrlSafetyFailureReason,
} from "./discovery-url-safety";

export const DISCOVERY_REQUEST_PLAN_TIMEOUT_MS = 10_000;
export const DISCOVERY_REQUEST_PLAN_REDIRECT_LIMIT = 0;
export const DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES = 1_000_000;
export const DISCOVERY_REQUEST_PLAN_USER_AGENT = "AiFinder Discovery Engine/1.0";

export type DiscoveryRequestPlan = {
  normalizedUrl: string;
  hostname: string;
  protocol: "https:";
  method: "GET";
  fetchDisabled: true;
  noNetworkRequestPerformed: true;
  timeoutMs: number;
  redirectLimit: number;
  responseSizeLimitBytes: number;
  userAgent: string;
  createdAt: string;
};

export type DiscoveryRequestPlanResult =
  | {
      ok: true;
      plan: DiscoveryRequestPlan;
    }
  | {
      ok: false;
      reason: DiscoveryUrlSafetyFailureReason;
    };

export type DiscoveryRequestPlansResult =
  | {
      ok: true;
      plans: DiscoveryRequestPlan[];
    }
  | {
      ok: false;
      reason: DiscoveryUrlSafetyFailureReason;
    };

export function buildDiscoveryRequestPlan(
  value: unknown,
  createdAt = new Date().toISOString()
): DiscoveryRequestPlanResult {
  const urlSafety = validateDiscoveryUrlSafety(value);

  if (!urlSafety.ok) {
    return urlSafety;
  }

  return {
    ok: true,
    plan: {
      normalizedUrl: urlSafety.normalizedUrl,
      hostname: urlSafety.hostname,
      protocol: urlSafety.protocol,
      method: "GET",
      fetchDisabled: true,
      noNetworkRequestPerformed: true,
      timeoutMs: DISCOVERY_REQUEST_PLAN_TIMEOUT_MS,
      redirectLimit: DISCOVERY_REQUEST_PLAN_REDIRECT_LIMIT,
      responseSizeLimitBytes: DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES,
      userAgent: DISCOVERY_REQUEST_PLAN_USER_AGENT,
      createdAt,
    },
  };
}

export function buildDiscoveryRequestPlans(
  values: unknown[],
  createdAt = new Date().toISOString()
): DiscoveryRequestPlansResult {
  const plans: DiscoveryRequestPlan[] = [];

  for (const value of values) {
    const result = buildDiscoveryRequestPlan(value, createdAt);

    if (!result.ok) {
      return result;
    }

    plans.push(result.plan);
  }

  return { ok: true, plans };
}
