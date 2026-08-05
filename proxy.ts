import { NextResponse, type NextRequest } from "next/server";
import {
  allowedAdminV1Methods,
  classifyAdminV1Path,
} from "./lib/admin-v1-launch-scope";

const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";

function getSessionSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

async function signSession(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeCompare(first: string, second: string) {
  if (first.length !== second.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < first.length; index += 1) {
    mismatch |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }

  return mismatch === 0;
}

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

async function hasActiveAdminSessionCookie(request: NextRequest) {
  const sessionSecret = getSessionSigningSecret();

  if (!sessionSecret) return false;

  const session = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!session) return false;

  const lastDotIndex = session.lastIndexOf(".");

  if (lastDotIndex === -1) return false;

  const payload = session.slice(0, lastDotIndex);
  const signature = session.slice(lastDotIndex + 1);
  const expectedSignature = await signSession(payload, sessionSecret);

  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  const [role, expiresAtText] = payload.split(":");
  const expiresAt = Number(expiresAtText);

  if (role !== "admin") return false;

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const classification = classifyAdminV1Path(pathname, request.method);

  if (classification === "DENY_ADMIN_API_PATH") {
    return addSecurityHeaders(
      NextResponse.json(
        { error: "Not found." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }
      )
    );
  }

  if (classification === "DENY_ADMIN_API_METHOD") {
    return addSecurityHeaders(
      NextResponse.json(
        { error: "Method not allowed." },
        {
          status: 405,
          headers: {
            "Allow": allowedAdminV1Methods(pathname).join(", "),
            "Cache-Control": "no-store",
          },
        }
      )
    );
  }

  if (classification === "ALLOW_ADMIN_PAGE" || classification === "DENY_ADMIN_PAGE") {
    if (!(await hasActiveAdminSessionCookie(request))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin-login";
      loginUrl.searchParams.set("from", pathname);

      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (classification === "DENY_ADMIN_PAGE") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      redirectUrl.search = "";

      return addSecurityHeaders(NextResponse.redirect(redirectUrl));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$).*)",
  ],
};
