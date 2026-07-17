import "server-only";

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

function genericApprovalFailure(status = 500) {
  return jsonResponse({ error: "Failed to approve discovered tool." }, status);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("discovered_tool_approve_unauthorized");
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
      const rateLimitStatus: 429 = rateLimit.status;
      return jsonResponse(
        getAdminRateLimitResponseData(rateLimit),
        rateLimitStatus
      );
    }

    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
    }

    const approvalResult = await supabaseAdmin.rpc(
      "approve_discovered_tool",
      {
        p_discovered_tool_id: id,
        p_actor_id: adminSession.actor.id,
        p_actor_label: adminSession.actor.label,
      }
    );

    if (approvalResult.error) {
      console.error("discovered_tool_approve_failed");
      return genericApprovalFailure(400);
    }

    const approvedToolId = approvalResult.data;

    return jsonResponse({
      success: true,
      message: "Discovered tool approved and added to live tools.",
      data: {
        approvedToolId,
      },
    });
  } catch {
    console.error("discovered_tool_approve_unexpected_failure");
    return genericApprovalFailure();
  }
}
