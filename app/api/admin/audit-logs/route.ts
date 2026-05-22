import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 80;
const AUDIT_LOG_LIMIT = 50;

const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return realIp || "unknown";
}

function checkAdminRateLimit(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const current = adminRateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    adminRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + ADMIN_RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (current.count >= ADMIN_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  adminRateLimitMap.set(ip, current);

  return true;
}

export async function GET(request: Request) {
  try {
    if (!checkAdminRateLimit(request)) {
      return jsonResponse(
        { error: "Too many admin requests. Please wait and try again." },
        429
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select(
        "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(AUDIT_LOG_LIMIT);

    if (error) {
      console.error("Admin audit logs load error:", error.message);
      return jsonResponse({ error: "Failed to load admin audit logs." }, 500);
    }

    return jsonResponse({
      logs: data || [],
    });
  } catch (error) {
    console.error("Admin audit logs route error:", error);
    return jsonResponse({ error: "Failed to load admin audit logs." }, 500);
  }
}
