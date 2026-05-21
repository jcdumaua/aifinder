import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";

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

function getCookieValue(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") || "";

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const matchingCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`)
  );

  if (!matchingCookie) return "";

  return decodeURIComponent(matchingCookie.slice(cookieName.length + 1));
}

function isValidAdminSession(request: Request) {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    console.error("ADMIN_SESSION_SECRET is missing.");
    return false;
  }

  const session = getCookieValue(request, ADMIN_SESSION_COOKIE_NAME);

  if (!session) return false;

  const lastDotIndex = session.lastIndexOf(".");

  if (lastDotIndex === -1) return false;

  const payload = session.slice(0, lastDotIndex);
  const signature = session.slice(lastDotIndex + 1);
  const expectedSignature = signSession(payload, sessionSecret);

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

export function isAuthorizedAdminRequest(request: Request) {
  return isValidAdminSession(request);
}