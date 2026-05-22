import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 5 * 1024; // 5KB
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

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
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    if (!checkRateLimit(clientIp)) {
      return jsonResponse(
        { error: "Too many login attempts. Please wait and try again." },
        429
      );
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!expectedPassword || !sessionSecret) {
      console.error(
        "ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing from environment variables."
      );

      return jsonResponse(
        { error: "Admin login is temporarily unavailable." },
        500
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return jsonResponse({ error: "Invalid login format." }, 415);
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return jsonResponse({ error: "Login request is too large." }, 413);
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "Invalid login request." }, 400);
    }

    const typedBody = body as {
      password?: unknown;
    };

    const password =
      typeof typedBody.password === "string" ? typedBody.password : "";

    if (!password || !safeCompare(password, expectedPassword)) {
      return jsonResponse({ error: "Wrong password. Please try again." }, 401);
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

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return jsonResponse({ error: "Admin login failed." }, 500);
  }
}
