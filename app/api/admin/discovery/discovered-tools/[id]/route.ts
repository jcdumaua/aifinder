import "server-only";

import { NextResponse } from "next/server";
import { verifyAdminCsrfRequest, verifyAdminSession } from "../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import {
  PublicLiveRouteSafetyError,
  parseBoundedJsonBody,
  readBoundedRequestBody,
} from "../../../../../../lib/public-live-route-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function pickSafeFields(value: unknown, fields: readonly string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    fields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]]),
  );
}

const SAFE_TOOL_FIELDS = [
  "id", "name", "slug", "description", "website", "canonical_url", "category",
  "pricing", "logo_url", "platforms", "discovery_score", "status", "source_id",
  "run_id", "approved_tool_id", "duplicate_of_discovered_tool_id",
  "duplicate_of_tool_id", "rejected_reason", "reviewed_at", "created_at", "updated_at",
] as const;
const SAFE_EVIDENCE_FIELDS = [
  "id", "discovered_tool_id", "source_url", "final_url", "page_title",
  "meta_description", "logo_url", "pricing_text", "confidence_score", "fetched_at",
  "created_at", "updated_at",
] as const;
const SAFE_DUPLICATE_FIELDS = [
  "id", "discovered_tool_id", "candidate_type", "candidate_tool_id",
  "candidate_submission_id", "candidate_discovered_tool_id", "match_type", "match_score",
  "is_blocking", "reason", "created_at",
] as const;
const SAFE_AUDIT_FIELDS = ["id", "action", "actor_label", "message", "created_at"] as const;
const SAFE_SOURCE_FIELDS = [
  "id", "name", "slug", "description", "url", "source_type", "is_active",
  "last_run_at", "created_at", "updated_at",
] as const;
const SAFE_RUN_FIELDS = [
  "id", "source_id", "status", "started_at", "finished_at", "created_at", "updated_at",
] as const;

function toSafeDiscoveredToolDetailResponse(input: {
  tool: unknown;
  source: unknown;
  run: unknown;
  evidence: unknown[];
  duplicateCandidates: unknown[];
  auditEvents: unknown[];
}) {
  return {
    tool: pickSafeFields(input.tool, SAFE_TOOL_FIELDS),
    source: pickSafeFields(input.source, SAFE_SOURCE_FIELDS),
    run: pickSafeFields(input.run, SAFE_RUN_FIELDS),
    evidence: input.evidence.map((row) => pickSafeFields(row, SAFE_EVIDENCE_FIELDS)),
    duplicateCandidates: input.duplicateCandidates.map((row) =>
      pickSafeFields(row, SAFE_DUPLICATE_FIELDS)),
    auditEvents: input.auditEvents.map((row) => pickSafeFields(row, SAFE_AUDIT_FIELDS)),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovered_tool_detail_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
  }

  const { data: tool, error: toolError } = await supabaseAdmin
    .from("discovered_tools")
    .select(SAFE_TOOL_FIELDS.join(", "))
    .eq("id", id)
    .maybeSingle();

  if (toolError) {
    console.error("discovered_tool_detail_load_failed");

    return jsonResponse({ error: "Failed to fetch discovered tool." }, 500);
  }

  const safeTool = pickSafeFields(tool, SAFE_TOOL_FIELDS);

  if (!safeTool) {
    return jsonResponse({ error: "Discovered tool not found." }, 404);
  }

  const { data: evidence, error: evidenceError } = await supabaseAdmin
    .from("discovery_evidence")
    .select(SAFE_EVIDENCE_FIELDS.join(", "))
    .eq("discovered_tool_id", id)
    .order("created_at", { ascending: false });

  if (evidenceError) {
    console.error("discovered_tool_evidence_load_failed");

    return jsonResponse({ error: "Failed to fetch discovery evidence." }, 500);
  }

  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
    .from("discovery_duplicate_candidates")
    .select(SAFE_DUPLICATE_FIELDS.join(", "))
    .eq("discovered_tool_id", id)
    .order("created_at", { ascending: false });

  if (duplicateError) {
    console.error("discovered_tool_duplicates_load_failed");

    return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
  }

    const { data: auditEvents, error: auditError } = await supabaseAdmin
      .from("discovery_audit_events")
      .select(SAFE_AUDIT_FIELDS.join(", "))
      .eq("discovered_tool_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (auditError) {
      console.error("discovered_tool_audit_events_load_failed");

      return jsonResponse({ error: "Failed to fetch audit events." }, 500);
    }

  const { data: source, error: sourceError } =
    typeof safeTool.source_id === "string"
      ? await supabaseAdmin
          .from("discovery_sources")
          .select(SAFE_SOURCE_FIELDS.join(", "))
          .eq("id", safeTool.source_id)
          .maybeSingle()
      : { data: null, error: null };

  if (sourceError) {
    console.error("discovered_tool_source_load_failed");

    return jsonResponse({ error: "Failed to fetch discovery source." }, 500);
  }

  const { data: run, error: runError } =
    typeof safeTool.run_id === "string"
      ? await supabaseAdmin
          .from("discovery_runs")
          .select(SAFE_RUN_FIELDS.join(", "))
          .eq("id", safeTool.run_id)
          .maybeSingle()
      : { data: null, error: null };

  if (runError) {
    console.error("discovered_tool_run_load_failed");

    return jsonResponse({ error: "Failed to fetch discovery run." }, 500);
  }

  return jsonResponse({
    data: toSafeDiscoveredToolDetailResponse({
      tool: safeTool,
      source,
      run,
      evidence: evidence || [],
      duplicateCandidates: duplicateCandidates || [],
      auditEvents: auditEvents || [],
    }),
  });
}

const PATCHABLE_DISCOVERY_STATUSES = new Set([
  "new",
  "pending_review",
  "rejected",
  "ignored",
  "duplicate",
]);

const DISCOVERY_AUDIT_ACTION_BY_STATUS: Record<string, string> = {
  new: "flag",
  pending_review: "flag",
  rejected: "reject",
  ignored: "ignore",
  duplicate: "mark-duplicate",
};

const MAX_REASON_LENGTH = 500;
const MAX_BODY_SIZE_BYTES = 20 * 1024;

type DiscoveredToolStatusDependencies = {
  verifySession?: typeof verifyAdminSession;
  verifyCsrf?: typeof verifyAdminCsrfRequest;
  checkRateLimit?: typeof checkAdminRateLimit;
  client?: typeof supabaseAdmin;
  now?: () => string;
};

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

function getOptionalReason(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Reason must be text.");
  }

  const reason = value.trim();

  if (reason.length > MAX_REASON_LENGTH) {
    throw new Error("Reason is too long.");
  }

  return reason;
}

export function createDiscoveredToolStatusHandler(
  dependencies: DiscoveredToolStatusDependencies = {},
) {
 return async function discoveredToolStatusHandler(request: Request, context: RouteContext) {
  const client = dependencies.client ?? supabaseAdmin;
  const adminSession = (dependencies.verifySession ?? verifyAdminSession)(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovered_tool_status_update_unauthorized");

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
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolStatus,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
  }

  let body: Record<string, unknown>;

  try {
    body = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      400
    );
  }

  const status = body.status;

  if (typeof status !== "string" || !PATCHABLE_DISCOVERY_STATUSES.has(status)) {
    return jsonResponse({ error: "Invalid status." }, 400);
  }

  let reason: string | null;

  try {
    reason = getOptionalReason(body.reason);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid reason." },
      400
    );
  }

  const { data: existingTool, error: existingToolError } = await client
    .from("discovered_tools")
    .select("id, status, rejected_reason, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (existingToolError) {
    console.error("discovered_tool_status_update_load_failed");

    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
  }

  if (!existingTool) {
    return jsonResponse({ error: "Discovered tool not found." }, 404);
  }

  if (existingTool.status === status) {
    return jsonResponse({
      success: true,
      data: {
        id,
        status,
        unchanged: true,
      },
    });
  }

  const writtenUpdatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
  const updatePayload: Record<string, string> = {
    status,
    updated_at: writtenUpdatedAt,
  };

  if (status === "rejected" && reason) {
    updatePayload.rejected_reason = reason;
  }

  const { data: updatedTool, error: updateError } = await client
    .from("discovered_tools")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", existingTool.status)
    .eq("updated_at", existingTool.updated_at)
    .select("id, status, rejected_reason, updated_at")
    .maybeSingle();

  if (updateError || !updatedTool) {
    console.error("discovered_tool_status_update_failed");

    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
  }

  const { error: auditError } = await client
    .from("discovery_audit_events")
    .insert({
      discovered_tool_id: id,
      action: DISCOVERY_AUDIT_ACTION_BY_STATUS[status],
      actor_id: adminSession.actor.id,
      actor_label: adminSession.actor.label,
      message: `Changed discovered tool status from ${existingTool.status} to ${status}.`,
      metadata: {
        from_status: existingTool.status,
        to_status: status,
        reason,
      },
    });

  if (auditError) {
    console.error("discovered_tool_status_update_audit_failed");

    const { error: compensationError } = await client
      .from("discovered_tools")
      .update({
        status: existingTool.status,
        rejected_reason: existingTool.rejected_reason,
        updated_at: existingTool.updated_at,
      })
      .eq("id", id)
      .eq("status", status)
      .eq("updated_at", writtenUpdatedAt);

    if (compensationError) {
      console.error("discovered_tool_status_update_compensation_failed");
    }

    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
  }

  return jsonResponse({
    success: true,
    data: updatedTool,
  });
 };
}

export const PATCH = createDiscoveredToolStatusHandler();
