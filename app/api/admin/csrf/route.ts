import { NextResponse } from "next/server";
import {
  ADMIN_CSRF_COOKIE_NAME,
  createAdminCsrfToken,
  isAuthorizedAdminRequest,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSRF_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

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
  if (!isAuthorizedAdminRequest(request)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const csrfToken = createAdminCsrfToken();

  const response = jsonResponse({
    success: true,
    csrfToken,
  });

  response.cookies.set(ADMIN_CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
