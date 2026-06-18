import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DISCOVERY_STATUSES = new Set([
  "new",
  "pending_review",
  "approved",
  "rejected",
  "ignored",
  "duplicate",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DiscoveredToolQueueRow = {
  id: string;
  name: string | null;
  description: string | null;
  website: string | null;
  canonical_url: string | null;
  normalized_domain: string | null;
  slug: string | null;
  status: string | null;
  pricing: string | null;
  platforms: unknown;
  category: string | null;
  logo_url: string | null;
  discovery_score: number | null;
  source_id: string | null;
  run_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DiscoverySourceSummary = {
  id: string;
  name: string | null;
  slug: string | null;
  source_type: string | null;
  is_active: boolean | null;
  last_run_at: string | null;
};

type DiscoveryRunSummary = {
  id: string;
  source_id: string | null;
  status: string | null;
  stats: Record<string, unknown> | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
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

function getPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Engine discovered tools request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sourceId = searchParams.get("source_id");
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = getPositiveInteger(searchParams.get("limit"), 20);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  if (status && !VALID_DISCOVERY_STATUSES.has(status)) {
    return jsonResponse({ error: "Invalid status parameter." }, 400);
  }

  if (sourceId && !UUID_PATTERN.test(sourceId)) {
    return jsonResponse({ error: "Invalid source_id parameter." }, 400);
  }

  let query = supabaseAdmin
    .from("discovered_tools")
    .select(
      [
        "id",
        "name",
        "description",
        "website",
        "canonical_url",
        "normalized_domain",
        "slug",
        "status",
        "pricing",
        "platforms",
        "category",
        "logo_url",
        "discovery_score",
        "source_id",
        "run_id",
        "created_at",
        "updated_at",
      ].join(", "),
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (sourceId) {
    query = query.eq("source_id", sourceId);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Failed to fetch Discovery Engine discovered tools.", {
      message: error.message,
    });

    return jsonResponse({ error: "Failed to fetch discovered tools." }, 500);
  }

  const tools = (data || []) as unknown as DiscoveredToolQueueRow[];
  const toolIds = tools.map((tool) => tool.id);
  const sourceIds = [
    ...new Set(
      tools
        .map((tool) => tool.source_id)
        .filter((sourceId): sourceId is string => typeof sourceId === "string")
    ),
  ];
  const runIds = [
    ...new Set(
      tools
        .map((tool) => tool.run_id)
        .filter((runId): runId is string => typeof runId === "string")
    ),
  ];

  const { data: sources, error: sourcesError } = sourceIds.length
    ? await supabaseAdmin
        .from("discovery_sources")
        .select("id, name, slug, source_type, is_active, last_run_at")
        .in("id", sourceIds)
    : { data: [], error: null };

  if (sourcesError) {
    console.error("Failed to fetch Discovery Engine queue sources.", {
      message: sourcesError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
  }

  const { data: runs, error: runsError } = runIds.length
    ? await supabaseAdmin
        .from("discovery_runs")
        .select("id, source_id, status, stats, started_at, finished_at, created_at")
        .in("id", runIds)
    : { data: [], error: null };

  if (runsError) {
    console.error("Failed to fetch Discovery Engine queue runs.", {
      message: runsError.message,
    });

    return jsonResponse({ error: "Failed to fetch discovery runs." }, 500);
  }

  const { data: duplicateRows, error: duplicateRowsError } = toolIds.length
    ? await supabaseAdmin
        .from("discovery_duplicate_candidates")
        .select("discovered_tool_id, is_blocking")
        .in("discovered_tool_id", toolIds)
    : { data: [], error: null };

  if (duplicateRowsError) {
    console.error("Failed to fetch Discovery Engine queue duplicate summaries.", {
      message: duplicateRowsError.message,
    });

    return jsonResponse({ error: "Failed to fetch duplicate summaries." }, 500);
  }

  const sourceRows = (sources || []) as unknown as DiscoverySourceSummary[];
  const runRows = (runs || []) as unknown as DiscoveryRunSummary[];
  const duplicateSummaryRows = (duplicateRows || []) as Array<{
    discovered_tool_id: string;
    is_blocking: boolean | null;
  }>;

  const duplicateSummaryByTool = new Map<
    string,
    { duplicate_count: number; blocking_duplicate_count: number }
  >();

  duplicateSummaryRows.forEach((duplicateRow) => {
    const current = duplicateSummaryByTool.get(duplicateRow.discovered_tool_id) || {
      duplicate_count: 0,
      blocking_duplicate_count: 0,
    };

    current.duplicate_count += 1;

    if (duplicateRow.is_blocking) {
      current.blocking_duplicate_count += 1;
    }

    duplicateSummaryByTool.set(duplicateRow.discovered_tool_id, current);
  });


  const sourceById = new Map(sourceRows.map((source) => [source.id, source]));
  const runById = new Map(runRows.map((run) => [run.id, run]));

  return jsonResponse({
    data: tools.map((tool) => ({
      ...tool,
      source:
        typeof tool.source_id === "string"
          ? sourceById.get(tool.source_id) || null
          : null,
      run:
        typeof tool.run_id === "string" ? runById.get(tool.run_id) || null : null,
      duplicate_count: duplicateSummaryByTool.get(tool.id)?.duplicate_count || 0,
      blocking_duplicate_count:
        duplicateSummaryByTool.get(tool.id)?.blocking_duplicate_count || 0,
    })),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
