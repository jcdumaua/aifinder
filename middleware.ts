import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";

function hasActiveAdminSessionCookie(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!session) return false;

  const lastDotIndex = session.lastIndexOf(".");

  if (lastDotIndex === -1) return false;

  const payload = session.slice(0, lastDotIndex);
  const [role, expiresAtText] = payload.split(":");
  const expiresAt = Number(expiresAtText);

  if (role !== "admin") return false;

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  if (hasActiveAdminSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin-login";
  loginUrl.searchParams.set("from", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
