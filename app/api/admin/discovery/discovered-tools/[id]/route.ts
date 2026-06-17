import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../../../lib/admin-auth";
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

  return jsonResponse({
    data: {
      tool,
      evidence: evidence || [],
      duplicateCandidates: duplicateCandidates || [],
    },
  });
}
