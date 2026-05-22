import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

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
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    if (!hasActiveAdminSessionCookie(request)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin-login";
      loginUrl.searchParams.set("from", pathname);

      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$).*)",
  ],
};
