import { NextResponse } from "next/server";
import {
  ADMIN_CSRF_COOKIE_NAME,
  createAdminCsrfToken,
  isAuthorizedAdminRequest,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSRF_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours
const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function getCookieValue(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const matchingCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`)
  );

  if (!matchingCookie) return "";

  return decodeURIComponent(matchingCookie.slice(cookieName.length + 1));
}

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

  const existingCsrfToken = getCookieValue(request, ADMIN_CSRF_COOKIE_NAME);
  const csrfToken = CSRF_TOKEN_PATTERN.test(existingCsrfToken)
    ? existingCsrfToken
    : createAdminCsrfToken();

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
