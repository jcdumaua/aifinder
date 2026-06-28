import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../lib/admin-rate-limit";
import {
  invokeCandidateExtractionStagingPipeline,
  type CandidateExtractionInvocationInput,
} from "../../../../../../lib/discovery/discovery-candidate-extraction-invocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 8 * 1024;
const CLIENT_ADMIN_IDENTITY_FIELD = "invoked_by_admin_user_id";
const ALLOWED_BODY_FIELDS = new Set([
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "invocation_reason",
  "dry_run",
  "max_candidates",
  "source_scope",
  "schema_version",
]);

function jsonResponse(data: object, status = 200) {
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

function getServerDerivedAdminActorId(actor: { id: string | null; label: string }) {
  const actorId = typeof actor.id === "string" ? actor.id.trim() : "";

  if (actorId) return actorId;

  return actor.label.trim();
}

function hasUnsupportedBodyField(body: Record<string, unknown>) {
  return Object.keys(body).some((key) => !ALLOWED_BODY_FIELDS.has(key));
}

export async function POST(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized candidate extraction invocation request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403,
    );
  }

  const rateLimit = checkAdminRateLimit({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateExtractionInvocation,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(
      getAdminRateLimitResponseData(rateLimit),
      rateLimit.status,
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      400,
    );
  }

  if (CLIENT_ADMIN_IDENTITY_FIELD in body) {
    return jsonResponse(
      {
        error: "Client-supplied admin identity is not allowed.",
        code: "client_admin_identity_not_allowed",
      },
      400,
    );
  }

  if (hasUnsupportedBodyField(body)) {
    return jsonResponse(
      {
        error: "Unsupported candidate extraction invocation field.",
        code: "unsupported_request_field",
      },
      400,
    );
  }

  const invokedByAdminUserId = getServerDerivedAdminActorId(adminSession.actor);

  if (!invokedByAdminUserId) {
    return jsonResponse(
      {
        error: "Authenticated admin identity is unavailable.",
        code: "missing_admin_identity",
      },
      403,
    );
  }

  try {
    const result = invokeCandidateExtractionStagingPipeline({
      discovery_source_id: body.discovery_source_id,
      discovery_run_id: body.discovery_run_id,
      audit_correlation_id: body.audit_correlation_id,
      invocation_reason: body.invocation_reason,
      invoked_by_admin_user_id: invokedByAdminUserId,
      dry_run: body.dry_run,
      max_candidates: body.max_candidates,
      source_scope: body.source_scope,
      schema_version: body.schema_version,
    } as CandidateExtractionInvocationInput);

    return jsonResponse(result, result.accepted ? 200 : 400);
  } catch {
    return jsonResponse({ error: "Candidate extraction invocation failed." }, 500);
  }
}
