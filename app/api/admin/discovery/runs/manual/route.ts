import "server-only";

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
  createManualCrawlerRunStats,
  validateManualCrawlerRequest,
  validateManualCrawlerSource,
  type ManualCrawlerSource,
} from "../../../../../../lib/discovery-manual-crawler";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 24 * 1024;

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body.");
  }

  return body as Record<string, unknown>;
}

export async function POST(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovery_manual_crawler_trigger_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  const rateLimit = checkAdminRateLimit({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualCrawlerRun,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
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

  let manualCrawlerRequest;

  try {
    manualCrawlerRequest = validateManualCrawlerRequest(body);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid manual crawler request." },
      400
    );
  }

  const { data: source, error: sourceError } = await supabaseAdmin
    .from("discovery_sources")
    .select("id, name, slug, source_type, config, is_active")
    .eq("id", manualCrawlerRequest.sourceId)
    .maybeSingle();

  if (sourceError) {
    console.error("discovery_manual_crawler_source_load_failed");

    return jsonResponse({ error: "Failed to validate discovery source." }, 500);
  }

  if (!source) {
    return jsonResponse({ error: "Discovery source not found." }, 400);
  }

  try {
    validateManualCrawlerSource(source as ManualCrawlerSource);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid discovery source." },
      400
    );
  }

  const { data: activeRuns, error: activeRunError } = await supabaseAdmin
    .from("discovery_runs")
    .select("id, status, created_at")
    .eq("source_id", source.id)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (activeRunError) {
    console.error("discovery_manual_crawler_active_runs_load_failed");

    return jsonResponse({ error: "Failed to check active discovery runs." }, 500);
  }

  if (activeRuns && activeRuns.length > 0) {
    return jsonResponse(
      {
        error: "A discovery run is already pending or running for this source.",
        data: {
          existingRun: activeRuns[0],
        },
      },
      409
    );
  }

  const runStats = createManualCrawlerRunStats({
    source: source as ManualCrawlerSource,
    request: manualCrawlerRequest,
  });

  const { data: discoveryRun, error: insertRunError } = await supabaseAdmin
    .from("discovery_runs")
    .insert({
      source_id: source.id,
      status: "pending",
      stats: runStats,
      error_log: null,
      started_at: null,
      finished_at: null,
    })
    .select(
      [
        "id",
        "source_id",
        "status",
        "stats",
        "error_log",
        "started_at",
        "finished_at",
        "created_at",
        "updated_at",
      ].join(", ")
    )
    .single();

  if (insertRunError) {
    console.error("discovery_manual_crawler_run_create_failed");

    return jsonResponse({ error: "Failed to create discovery run." }, 500);
  }

  const discoveryRunRecord = discoveryRun as unknown as {
    id: string;
    source_id: string | null;
    status: string;
    stats: Record<string, unknown>;
    error_log: string | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const { error: auditError } = await supabaseAdmin
    .from("discovery_audit_events")
    .insert({
      discovered_tool_id: null,
      action: "flag",
      actor_id: adminSession.actor.id,
      actor_label: adminSession.actor.label,
      message: "Manual crawler run trigger created with execution disabled.",
      metadata: {
        event_type: "manual_crawler_run_trigger_created",
        source_id: source.id,
        source_slug: source.slug,
        run_id: discoveryRunRecord.id,
        requested_url_count: manualCrawlerRequest.urls.length,
        execution_enabled: false,
        execution_status: "awaiting_approved_async_executor",
        no_fetch_performed: true,
        no_candidates_inserted: true,
        no_public_tools_inserted: true,
      },
    });

  if (auditError) {
    console.error("discovery_manual_crawler_trigger_audit_failed");
  }

  return jsonResponse(
    {
      data: {
        run: discoveryRunRecord,
        execution: {
          enabled: false,
          status: "awaiting_approved_async_executor",
          message:
            "Manual crawler run was created. Fetch/extract execution remains disabled until the async executor is separately approved.",
        },
      },
    },
    201
  );
}
