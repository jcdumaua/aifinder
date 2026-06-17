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
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = getPositiveInteger(searchParams.get("limit"), 20);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  if (status && !VALID_DISCOVERY_STATUSES.has(status)) {
    return jsonResponse({ error: "Invalid status parameter." }, 400);
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

  const { data, count, error } = await query;

  if (error) {
    console.error("Failed to fetch Discovery Engine discovered tools.", {
      message: error.message,
    });

    return jsonResponse({ error: "Failed to fetch discovered tools." }, 500);
  }

  return jsonResponse({
    data: data || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
