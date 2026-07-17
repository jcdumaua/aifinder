import { NextResponse } from "next/server";
import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  ADMIN_CSRF_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "../../../../lib/admin-auth";

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

export async function POST(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin) {
    return jsonResponse(
      {
        success: false,
        message: "Unauthorized.",
      },
      401
    );
  }

  await createAdminAuditLog({
    request,
    action: "admin_logout",
  });

  const response = jsonResponse({
    success: true,
    message: "Admin logged out.",
  });

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set(ADMIN_CSRF_COOKIE_NAME, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
