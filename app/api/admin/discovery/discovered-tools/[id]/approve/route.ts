import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";

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

function getSafeApprovalError(message: string | undefined) {
  if (!message) {
    return "Failed to approve discovered tool.";
  }

  if (message.includes("not found")) {
    return "Discovered tool not found.";
  }

  if (message.includes("already exists")) {
    return message;
  }

  if (message.includes("required")) {
    return message;
  }

  if (message.includes("cannot be normalized")) {
    return message;
  }

  if (message.includes("cannot produce")) {
    return message;
  }

  if (message.includes("must be new or pending_review")) {
    return message;
  }

  if (message.includes("approved but missing approved_tool_id")) {
    return "Discovered tool approval state is inconsistent.";
  }

  return "Failed to approve discovered tool.";
}

export async function POST(request: Request, context: RouteContext) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Engine approve request.", {
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

  const rateLimit = checkAdminRateLimit({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolApprove,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
  }

  const { data: approvedToolId, error } = await supabaseAdmin.rpc(
    "approve_discovered_tool",
    {
      p_discovered_tool_id: id,
      p_actor_id: adminSession.actor.id,
      p_actor_label: adminSession.actor.label,
    }
  );

  if (error) {
    console.error("Approve discovered tool RPC error.", {
      message: error.message,
    });

    return jsonResponse(
      { error: getSafeApprovalError(error.message) },
      error.message?.includes("not found") ? 404 : 400
    );
  }

  return jsonResponse({
    success: true,
    message: "Discovered tool approved and added to live tools.",
    data: {
      approvedToolId,
    },
  });
}
