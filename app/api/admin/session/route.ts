import "server-only";

import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  if (request.headers.get("x-aifinder-validation") === "client-origin-v1") {
    const { observeValidationClient } = await import("../../../../lib/supabase-validation");
    const observation = await observeValidationClient();
    if (observation) return jsonResponse(observation);
    return jsonResponse({ authenticated: false, message: "Unauthorized." }, 401);
  }
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin) {
    return jsonResponse(
      {
        authenticated: false,
        message: "Unauthorized.",
      },
      401
    );
  }

  return jsonResponse({
    authenticated: true,
    role: "admin",
  });
}
