import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";

async function signSession(payload: string, secret: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeCompare(first: string, second: string) {
  if (first.length !== second.length) return false;

  let result = 0;

  for (let index = 0; index < first.length; index += 1) {
    result |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }

  return result === 0;
}

async function isValidAdminSession(request: NextRequest) {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!session) return false;

  const lastDotIndex = session.lastIndexOf(".");

  if (lastDotIndex === -1) return false;

  const payload = session.slice(0, lastDotIndex);
  const signature = session.slice(lastDotIndex + 1);

  const [role, expiresAtText] = payload.split(":");
  const expiresAt = Number(expiresAtText);

  if (role !== "admin") return false;

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSignature = await signSession(payload, sessionSecret);

  return safeCompare(signature, expectedSignature);
}

export async function middleware(request: NextRequest) {
  const isAuthenticated = await isValidAdminSession(request);

  if (isAuthenticated) {
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