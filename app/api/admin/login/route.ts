import "server-only";

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 5 * 1024; // 5KB
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours
const MALFORMED_REQUEST_ERROR = "Invalid login request.";
const RATE_LIMIT_ERROR =
  "Too many login attempts. Please wait and try again.";
const INVALID_CREDENTIALS_ERROR = "Invalid credentials.";
const OPERATIONAL_ERROR = "Admin login is temporarily unavailable.";

const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>();

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

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = loginRateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    loginRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  current.count += 1;
  loginRateLimitMap.set(ip, current);

  return true;
}

function signSession(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeCompare(first: string, second: string) {
  const firstDigest = createHash("sha256").update(first, "utf8").digest();
  const secondDigest = createHash("sha256").update(second, "utf8").digest();

  return timingSafeEqual(firstDigest, secondDigest);
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    if (!checkRateLimit(clientIp)) {
      console.warn("admin_login_rate_limited");

      return jsonResponse({ error: RATE_LIMIT_ERROR }, 429);
    }

    const contentType = request.headers.get("content-type") || "";
    const mediaType = contentType.split(";")[0].trim().toLowerCase();

    if (mediaType !== "application/json") {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 415);
    }

    const contentLengthHeader = request.headers.get("content-length");

    if (contentLengthHeader && !/^\d+$/.test(contentLengthHeader)) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 400);
    }

    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

    if (
      !Number.isFinite(contentLength) ||
      !Number.isInteger(contentLength) ||
      contentLength < 0
    ) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 400);
    }

    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 413);
    }

    const rawBody = await request.text().catch(() => null);

    if (rawBody === null) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 400);
    }

    const actualBodySize = Buffer.byteLength(rawBody, "utf8");

    if (actualBodySize > MAX_BODY_SIZE_BYTES) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 413);
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: MALFORMED_REQUEST_ERROR }, 400);
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!expectedPassword || !sessionSecret) {
      console.error("admin_login_configuration_unavailable");

      return jsonResponse({ error: OPERATIONAL_ERROR }, 500);
    }

    const typedBody = body as {
      password?: unknown;
    };

    const password =
      typeof typedBody.password === "string" ? typedBody.password : "";

    if (!password || !safeCompare(password, expectedPassword)) {
      console.warn("admin_login_invalid_credentials");

      return jsonResponse({ error: INVALID_CREDENTIALS_ERROR }, 401);
    }

    const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    const payload = `admin:${expiresAt}`;
    const signature = signSession(payload, sessionSecret);
    const sessionValue = `${payload}.${signature}`;

    const response = jsonResponse({
      success: true,
      message: "Admin login successful.",
    });

    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    console.info("admin_login_success");

    return response;
  } catch {
    console.error("admin_login_unexpected_failure");

    return jsonResponse({ error: OPERATIONAL_ERROR }, 500);
  }
}
