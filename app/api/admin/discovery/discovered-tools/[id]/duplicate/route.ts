import "server-only";

import { NextResponse } from "next/server";
import {
  verifyAdminSession,
  verifyAdminCsrfRequest,
} from "../../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
import {
  PublicLiveRouteSafetyError,
  parseBoundedJsonBody,
  readBoundedRequestBody,
} from "../../../../../../../lib/public-live-route-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_CANDIDATE_TYPES = new Set([
  "tool",
  "submission",
  "discovered_tool",
]);

const VALID_MATCH_TYPES = new Set([
  "canonical_url",
  "normalized_domain",
  "slug",
  "exact_name",
  "fuzzy_name",
]);

const MAX_REASON_LENGTH = 500;
const MAX_BODY_SIZE_BYTES = 20 * 1024;
const GENERIC_OPERATIONAL_ERROR = "Failed to mark duplicate.";

type DiscoveredToolDuplicateDependencies = {
  verifySession?: typeof verifyAdminSession;
  verifyCsrf?: typeof verifyAdminCsrfRequest;
  checkRateLimit?: typeof checkAdminRateLimit;
  client?: typeof supabaseAdmin;
  now?: () => string;
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function operationalFailureResponse() {
  return jsonResponse({ error: GENERIC_OPERATIONAL_ERROR }, 500);
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  let body: unknown;
  try {
    body = parseBoundedJsonBody(
      await readBoundedRequestBody(request, MAX_BODY_SIZE_BYTES),
    );
  } catch (error) {
    if (error instanceof PublicLiveRouteSafetyError && error.code === "request_body_too_large") {
      throw new Error("Request is too large.");
    }
    throw new Error("Invalid request body.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body.");
  }

  return body as Record<string, unknown>;
}

function getPositiveBigintLikeId(value: unknown, fieldName: string) {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }

  const text = String(value).trim();

  if (!/^[1-9][0-9]*$/.test(text)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return text;
}

function getOptionalText(value: unknown, fieldName: string, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be text.`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return text;
}

function getMatchScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("Match score must be between 0 and 100.");
  }

  return score;
}

async function compensateDiscoveredToolDuplicate(input: {
  client: typeof supabaseAdmin;
  discoveredToolId: string;
  duplicateCandidateId: string;
  previousStatus: string;
  previousUpdatedAt: string;
  writtenUpdatedAt: string;
  restoreStatus: boolean;
}) {
  if (input.restoreStatus) {
    const { error: restoreError } = await input.client
      .from("discovered_tools")
      .update({ status: input.previousStatus, updated_at: input.previousUpdatedAt })
      .eq("id", input.discoveredToolId)
      .eq("status", "duplicate")
      .eq("updated_at", input.writtenUpdatedAt);
    if (restoreError) {
      console.error("discovered_tool_duplicate_compensation_failed");
      return false;
    }
  }

  const { error: deleteError } = await input.client
    .from("discovery_duplicate_candidates")
    .delete()
    .eq("id", input.duplicateCandidateId)
    .eq("discovered_tool_id", input.discoveredToolId);
  if (deleteError) {
    console.error("discovered_tool_duplicate_compensation_failed");
    return false;
  }
  return true;
}

export function createDiscoveredToolDuplicateHandler(
  dependencies: DiscoveredToolDuplicateDependencies = {},
) {
 return async function discoveredToolDuplicateHandler(request: Request, context: RouteContext) {
  try {
    const client = dependencies.client ?? supabaseAdmin;
    const adminSession = (dependencies.verifySession ?? verifyAdminSession)(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("discovered_tool_duplicate_unauthorized");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (!(dependencies.verifyCsrf ?? verifyAdminCsrfRequest)(request)) {
      return jsonResponse(
        { error: "Security token missing or expired. Please log in again." },
        403
      );
    }

    const rateLimit = (dependencies.checkRateLimit ?? checkAdminRateLimit)({
      request,
      action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate,
      actor: adminSession.actor,
    });

    if (!rateLimit.allowed) {
      return jsonResponse(
        getAdminRateLimitResponseData(rateLimit),
        rateLimit.status
      );
    }

    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
    }

    let body: Record<string, unknown>;

    try {
      body = await readJsonBody(request);
    } catch {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const candidateType = body.candidate_type;

    if (
      typeof candidateType !== "string" ||
      !VALID_CANDIDATE_TYPES.has(candidateType)
    ) {
      return jsonResponse({ error: "Invalid candidate type." }, 400);
    }

    const matchType = body.match_type;

    if (typeof matchType !== "string" || !VALID_MATCH_TYPES.has(matchType)) {
      return jsonResponse({ error: "Invalid match type." }, 400);
    }

    let candidateToolId: string | null = null;
    let candidateSubmissionId: string | null = null;
    let candidateDiscoveredToolId: string | null = null;
    let reason: string | null = null;
    let matchScore = 0;

    try {
      matchScore = getMatchScore(body.match_score);
      reason = getOptionalText(body.reason, "Reason", MAX_REASON_LENGTH);

      if (candidateType === "tool") {
        candidateToolId = getPositiveBigintLikeId(
          body.candidate_tool_id,
          "Candidate tool ID"
        );
      }

      if (candidateType === "submission") {
        candidateSubmissionId = getPositiveBigintLikeId(
          body.candidate_submission_id,
          "Candidate submission ID"
        );
      }

      if (candidateType === "discovered_tool") {
        if (
          typeof body.candidate_discovered_tool_id !== "string" ||
          !isValidUuid(body.candidate_discovered_tool_id)
        ) {
          throw new Error("Candidate discovered tool ID is invalid.");
        }

        candidateDiscoveredToolId = body.candidate_discovered_tool_id;
      }
    } catch {
      return jsonResponse({ error: "Invalid duplicate data." }, 400);
    }

    const { data: discoveredTool, error: discoveredToolError } =
      await client
        .from("discovered_tools")
        .select("id, status, updated_at")
        .eq("id", id)
        .maybeSingle();

    if (discoveredToolError) {
      console.error("discovered_tool_duplicate_load_failed");
      return operationalFailureResponse();
    }

    if (!discoveredTool) {
      return jsonResponse({ error: "Discovered tool not found." }, 404);
    }

    const { data: duplicateCandidate, error: duplicateError } =
      await client
        .from("discovery_duplicate_candidates")
        .insert({
          discovered_tool_id: id,
          candidate_type: candidateType,
          candidate_tool_id: candidateToolId,
          candidate_submission_id: candidateSubmissionId,
          candidate_discovered_tool_id: candidateDiscoveredToolId,
          match_type: matchType,
          match_score: matchScore,
          is_blocking: true,
          reason,
        })
        .select("id, discovered_tool_id, candidate_type, candidate_tool_id, candidate_submission_id, candidate_discovered_tool_id, match_type, match_score, is_blocking, reason, created_at")
        .single();

    if (duplicateError) {
      console.error("discovered_tool_duplicate_candidate_insert_failed");
      return operationalFailureResponse();
    }

    const writtenUpdatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
    const { data: updatedTool, error: updateError } = await client
      .from("discovered_tools")
      .update({
        status: "duplicate",
        updated_at: writtenUpdatedAt,
      })
      .eq("id", id)
      .eq("status", discoveredTool.status)
      .eq("updated_at", discoveredTool.updated_at)
      .select("id, status, updated_at")
      .maybeSingle();

    if (updateError || !updatedTool) {
      console.error("discovered_tool_duplicate_status_update_failed");
      await compensateDiscoveredToolDuplicate({
        client,
        discoveredToolId: id,
        duplicateCandidateId: duplicateCandidate.id,
        previousStatus: discoveredTool.status,
        previousUpdatedAt: discoveredTool.updated_at,
        writtenUpdatedAt,
        restoreStatus: false,
      });
      return operationalFailureResponse();
    }

    const { error: auditError } = await client
      .from("discovery_audit_events")
      .insert({
        discovered_tool_id: id,
        action: "mark-duplicate",
        actor_id: adminSession.actor.id,
        actor_label: adminSession.actor.label,
        message: "Marked discovered tool as duplicate.",
        metadata: {
          previous_status: discoveredTool.status,
          duplicate_candidate_id: duplicateCandidate.id,
          candidate_type: candidateType,
          candidate_tool_id: candidateToolId,
          candidate_submission_id: candidateSubmissionId,
          candidate_discovered_tool_id: candidateDiscoveredToolId,
          match_type: matchType,
          match_score: matchScore,
          reason,
        },
      });

    if (auditError) {
      console.error("discovered_tool_duplicate_audit_insert_failed");
      await compensateDiscoveredToolDuplicate({
        client,
        discoveredToolId: id,
        duplicateCandidateId: duplicateCandidate.id,
        previousStatus: discoveredTool.status,
        previousUpdatedAt: discoveredTool.updated_at,
        writtenUpdatedAt,
        restoreStatus: true,
      });
      return operationalFailureResponse();
    }

    return jsonResponse(
      {
        success: true,
        data: {
          duplicateCandidate,
          tool: updatedTool,
        },
      },
      201
    );
  } catch {
    console.error("discovered_tool_duplicate_unexpected_failure");
    return operationalFailureResponse();
  }
 };
}

export const POST = createDiscoveredToolDuplicateHandler();
