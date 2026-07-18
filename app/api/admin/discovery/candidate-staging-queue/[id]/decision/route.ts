import "server-only";

import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
  type VerifyAdminSessionResult,
} from "../../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
  type AdminRateLimitResult,
} from "../../../../../../../lib/admin-rate-limit";
import {
  applyDiscoveryCandidateDecision,
  DiscoveryCandidateDecisionMutationError,
  type AppliedDiscoveryCandidateDecision,
  type DiscoveryCandidateDecisionMutationClient,
} from "../../../../../../../lib/discovery/discovery-candidate-decision-admin";
import {
  DiscoveryCandidateDecisionValidationError,
  parseDiscoveryCandidateDecisionRequest,
} from "../../../../../../../lib/discovery/discovery-candidate-decision-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route: POST /api/admin/discovery/candidate-staging-queue/[id]/decision

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CandidateDecisionApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_request_body"
  | DiscoveryCandidateDecisionValidationError["code"]
  | DiscoveryCandidateDecisionMutationError["code"];

export type CandidateDecisionApiSuccessResponse = {
  ok: true;
  candidate: AppliedDiscoveryCandidateDecision;
};

export type CandidateDecisionApiErrorResponse = {
  ok: false;
  error: {
    code: CandidateDecisionApiErrorCode;
    message: string;
  };
};

type CandidateDecisionRouteRateLimitInput = {
  request: Request;
  action: typeof ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation;
  actor: NonNullable<VerifyAdminSessionResult["actor"]>;
};

export type CandidateDecisionRouteDependencies = {
  verifyAdminSession?: (request: Request) => VerifyAdminSessionResult;
  verifyAdminCsrfRequest?: (request: Request) => boolean;
  checkRateLimit?: (
    input: CandidateDecisionRouteRateLimitInput,
  ) => AdminRateLimitResult;
  getClient?: () =>
    | DiscoveryCandidateDecisionMutationClient
    | Promise<DiscoveryCandidateDecisionMutationClient>;
  applyDecision?: typeof applyDiscoveryCandidateDecision;
};

const MAX_BODY_SIZE_BYTES = 8 * 1024;

const VALIDATION_ERROR_STATUS: Record<
  DiscoveryCandidateDecisionValidationError["code"],
  400
> = {
  invalid_candidate_id: 400,
  unsupported_request_field: 400,
  client_admin_identity_not_allowed: 400,
  ambiguous_request_field: 400,
  invalid_action: 400,
  invalid_reason: 400,
  invalid_notes: 400,
  invalid_duplicate_target: 400,
  duplicate_tool_target_not_supported: 400,
  invalid_request_correlation_id: 400,
};

const MUTATION_ERROR_STATUS: Record<
  DiscoveryCandidateDecisionMutationError["code"],
  400 | 404 | 409 | 500
> = {
  candidate_not_found: 404,
  decision_conflict: 409,
  invalid_action: 400,
  invalid_reason: 400,
  invalid_notes: 400,
  invalid_duplicate_target: 400,
  candidate_decision_rpc_failed: 500,
};

function jsonResponse(
  data: CandidateDecisionApiSuccessResponse | CandidateDecisionApiErrorResponse,
  status = 200,
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (contentLength > MAX_BODY_SIZE_BYTES) {
    throw new Error("Request is too large.");
  }

  const body = await request.json().catch(() => null);

  if (!isRecord(body)) {
    throw new Error("Invalid request body.");
  }

  return body;
}

function getAdminActorLabel(actor: NonNullable<VerifyAdminSessionResult["actor"]>) {
  const label = actor.label.trim();

  if (label) return label;

  return actor.id?.trim() || "admin";
}

function errorResponse(
  code: CandidateDecisionApiErrorCode,
  message: string,
  status: number,
) {
  return jsonResponse(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    status,
  );
}

function createCandidateDecisionHandler(
  dependencies: CandidateDecisionRouteDependencies = {},
) {
  return async function candidateDecisionHandler(
    request: Request,
    context: RouteContext,
  ) {
    const adminSession = (
      dependencies.verifyAdminSession || verifyAdminSession
    )(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("Unauthorized candidate decision mutation request.", {
        errors: adminSession.errors,
      });

      return errorResponse("unauthorized", "Unauthorized.", 401);
    }

    const csrfVerifier =
      dependencies.verifyAdminCsrfRequest || verifyAdminCsrfRequest;

    if (!csrfVerifier(request)) {
      return errorResponse(
        "forbidden",
        "Security token missing or expired. Please log in again.",
        403,
      );
    }

    const rateLimitInput = {
      request,
      action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation,
      actor: adminSession.actor,
    };

    const rateLimit = dependencies.checkRateLimit
      ? dependencies.checkRateLimit(rateLimitInput)
      : checkAdminRateLimit(rateLimitInput);

    if (!rateLimit.allowed) {
      return NextResponse.json(getAdminRateLimitResponseData(rateLimit), {
        status: rateLimit.status,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    let body: Record<string, unknown>;

    try {
      body = await readJsonBody(request);
    } catch (error) {
      return errorResponse(
        "invalid_request_body",
        error instanceof Error ? error.message : "Invalid request body.",
        400,
      );
    }

    const { id } = await context.params;

    try {
      const decisionInput = parseDiscoveryCandidateDecisionRequest({
        candidateId: id,
        body,
      });
      const client = dependencies.getClient ? await dependencies.getClient() : undefined;
      const applyDecision = dependencies.applyDecision || applyDiscoveryCandidateDecision;
      const result = await applyDecision(
        {
          ...decisionInput,
          actorLabel: getAdminActorLabel(adminSession.actor),
        },
        client ? { client } : {},
      );

      return jsonResponse({
        ok: true,
        candidate: result.candidate,
      });
    } catch (error) {
      if (error instanceof DiscoveryCandidateDecisionValidationError) {
        return errorResponse(error.code, error.message, VALIDATION_ERROR_STATUS[error.code]);
      }

      if (error instanceof DiscoveryCandidateDecisionMutationError) {
        return errorResponse(error.code, error.message, MUTATION_ERROR_STATUS[error.code]);
      }

      console.error("Candidate decision mutation failed.", {
        message: error instanceof Error ? error.message : "unknown",
      });

      return errorResponse(
        "candidate_decision_rpc_failed",
        "Candidate decision could not be applied.",
        500,
      );
    }
  };
}

export const POST = createCandidateDecisionHandler();
