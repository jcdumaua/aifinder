const ADMIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ADMIN_RATE_LIMIT_MESSAGE =
  "Too many admin requests. Please wait and try again.";

export const ADMIN_RATE_LIMIT_ACTIONS = {
  discoverySourceCreate: "discovery-source-create",
  discoverySourceUpdate: "discovery-source-update",
  discoveryManualIntake: "discovery-manual-intake",
  discoveryToolStatus: "discovery-tool-status",
  discoveryToolApprove: "discovery-tool-approve",
  discoveryToolDuplicate: "discovery-tool-duplicate",
  discoveryToolBulkStatus: "discovery-tool-bulk-status",
} as const;

export type AdminRateLimitAction =
  (typeof ADMIN_RATE_LIMIT_ACTIONS)[keyof typeof ADMIN_RATE_LIMIT_ACTIONS];

type AdminRateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type AdminRateLimitActor = {
  id?: string | null;
  label?: string | null;
};

type AdminRateLimitBucket = {
  count: number;
  resetAt: number;
};

type AdminRateLimitResponseData = {
  error: string;
  metadata: {
    retryAfterSeconds: number;
  };
};

type AdminRateLimitAllowedResult = {
  allowed: true;
  limit: number;
  remaining: number;
  resetAt: number;
  windowSeconds: number;
};

type AdminRateLimitBlockedResult = {
  allowed: false;
  status: 429;
  limit: number;
  remaining: 0;
  resetAt: number;
  retryAfterSeconds: number;
  windowSeconds: number;
  responseData: AdminRateLimitResponseData;
};

export type AdminRateLimitResult =
  | AdminRateLimitAllowedResult
  | AdminRateLimitBlockedResult;

type CheckAdminRateLimitInput = {
  request: Request;
  action: AdminRateLimitAction;
  actor?: AdminRateLimitActor | null;
  now?: number;
};

const ADMIN_RATE_LIMIT_POLICIES: Record<
  AdminRateLimitAction,
  AdminRateLimitPolicy
> = {
  [ADMIN_RATE_LIMIT_ACTIONS.discoverySourceCreate]: {
    limit: 20,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoverySourceUpdate]: {
    limit: 20,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoveryManualIntake]: {
    limit: 30,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolStatus]: {
    limit: 60,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolApprove]: {
    limit: 60,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate]: {
    limit: 60,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
  [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolBulkStatus]: {
    limit: 60,
    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  },
};

const adminRateLimitBuckets = new Map<string, AdminRateLimitBucket>();

function cleanIdentifier(value: string) {
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 160);

  return cleaned || "unknown";
}

function getFallbackIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return cleanIdentifier(forwardedFor.split(",")[0] || "unknown");
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return cleanIdentifier(realIp);
  }

  const connectingIp = request.headers.get("cf-connecting-ip");

  if (connectingIp) {
    return cleanIdentifier(connectingIp);
  }

  return "unknown";
}

function getLimiterIdentifier(request: Request, actor?: AdminRateLimitActor | null) {
  const actorLabel =
    typeof actor?.label === "string" ? cleanIdentifier(actor.label) : "";

  if (actorLabel && actorLabel !== "unknown") {
    return `actor:${actorLabel.toLowerCase()}`;
  }

  return `ip:${getFallbackIp(request).toLowerCase()}`;
}

function getRateLimitKey(
  request: Request,
  action: AdminRateLimitAction,
  actor?: AdminRateLimitActor | null
) {
  return `${action}:${getLimiterIdentifier(request, actor)}`;
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of adminRateLimitBuckets) {
    if (bucket.resetAt <= now) {
      adminRateLimitBuckets.delete(key);
    }
  }
}

function createBlockedResult(
  policy: AdminRateLimitPolicy,
  resetAt: number,
  now: number
): AdminRateLimitBlockedResult {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  return {
    allowed: false,
    status: 429,
    limit: policy.limit,
    remaining: 0,
    resetAt,
    retryAfterSeconds,
    windowSeconds: Math.ceil(policy.windowMs / 1000),
    responseData: {
      error: ADMIN_RATE_LIMIT_MESSAGE,
      metadata: {
        retryAfterSeconds,
      },
    },
  };
}

export function checkAdminRateLimit({
  request,
  action,
  actor,
  now = Date.now(),
}: CheckAdminRateLimitInput): AdminRateLimitResult {
  pruneExpiredBuckets(now);

  const policy = ADMIN_RATE_LIMIT_POLICIES[action];
  const key = getRateLimitKey(request, action, actor);
  const current = adminRateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    adminRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + policy.windowMs,
    });

    return {
      allowed: true,
      limit: policy.limit,
      remaining: policy.limit - 1,
      resetAt: now + policy.windowMs,
      windowSeconds: Math.ceil(policy.windowMs / 1000),
    };
  }

  if (current.count >= policy.limit) {
    return createBlockedResult(policy, current.resetAt, now);
  }

  current.count += 1;
  adminRateLimitBuckets.set(key, current);

  return {
    allowed: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - current.count),
    resetAt: current.resetAt,
    windowSeconds: Math.ceil(policy.windowMs / 1000),
  };
}

export function getAdminRateLimitResponseData(result: AdminRateLimitResult) {
  if (result.allowed) {
    throw new Error("Cannot create a rate limit error response for an allowed request.");
  }

  return result.responseData;
}
