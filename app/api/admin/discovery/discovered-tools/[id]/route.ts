import { NextResponse } from "next/server";
import { verifyAdminCsrfRequest, verifyAdminSession } from "../../../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";

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

export async function GET(request: Request, context: RouteContext) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Engine detail request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
  }

  const { data: tool, error: toolError } = await supabaseAdmin
    .from("discovered_tools")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (toolError) {
    console.error("Failed to fetch Discovery Engine discovered tool detail.", {
      message: toolError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovered tool." }, 500);
  }

  if (!tool) {
    return jsonResponse({ error: "Discovered tool not found." }, 404);
  }

  const { data: evidence, error: evidenceError } = await supabaseAdmin
    .from("discovery_evidence")
    .select("*")
    .eq("discovered_tool_id", id)
    .order("created_at", { ascending: false });

  if (evidenceError) {
    console.error("Failed to fetch Discovery Engine evidence.", {
      message: evidenceError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovery evidence." }, 500);
  }

  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
    .from("discovery_duplicate_candidates")
    .select("*")
    .eq("discovered_tool_id", id)
    .order("created_at", { ascending: false });

  if (duplicateError) {
    console.error("Failed to fetch Discovery Engine duplicate candidates.", {
      message: duplicateError.message,
    });

    return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
  }

  const { data: source, error: sourceError } =
    typeof tool.source_id === "string"
      ? await supabaseAdmin
          .from("discovery_sources")
          .select("id, name, slug, source_type, is_active, last_run_at, url")
          .eq("id", tool.source_id)
          .maybeSingle()
      : { data: null, error: null };

  if (sourceError) {
    console.error("Failed to fetch Discovery Engine source detail.", {
      message: sourceError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovery source." }, 500);
  }

  const { data: run, error: runError } =
    typeof tool.run_id === "string"
      ? await supabaseAdmin
          .from("discovery_runs")
          .select("id, source_id, status, stats, error_log, started_at, finished_at, created_at")
          .eq("id", tool.run_id)
          .maybeSingle()
      : { data: null, error: null };

  if (runError) {
    console.error("Failed to fetch Discovery Engine run detail.", {
      message: runError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovery run." }, 500);
  }

  return jsonResponse({
    data: {
      tool,
      source,
      run,
      evidence: evidence || [],
      duplicateCandidates: duplicateCandidates || [],
    },
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

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (contentLength > 20 * 1024) {
    throw new Error("Request is too large.");
  }

  const body = await request.json().catch(() => null);

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

export async function PATCH(request: Request, context: RouteContext) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Engine status update request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
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

  const { data: existingTool, error: existingToolError } = await supabaseAdmin
    .from("discovered_tools")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (existingToolError) {
    console.error("Failed to load Discovery Engine tool before status update.", {
      message: existingToolError.message,
    });

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

  const updatePayload: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "rejected" && reason) {
    updatePayload.rejected_reason = reason;
  }

  const { data: updatedTool, error: updateError } = await supabaseAdmin
    .from("discovered_tools")
    .update(updatePayload)
    .eq("id", id)
    .select("id, status, rejected_reason, updated_at")
    .single();

  if (updateError) {
    console.error("Failed to update Discovery Engine discovered tool status.", {
      message: updateError.message,
    });

    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
  }

  const { error: auditError } = await supabaseAdmin
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
    console.error("Failed to write Discovery Engine audit event.", {
      message: auditError.message,
    });

    return jsonResponse(
      { error: "Status updated, but audit logging failed." },
      500
    );
  }

  return jsonResponse({
    success: true,
    data: updatedTool,
  });
}

