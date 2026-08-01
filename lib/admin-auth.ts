import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";
export const ADMIN_CSRF_COOKIE_NAME = "aifinder_admin_csrf_token";

const MAX_COOKIE_HEADER_LENGTH = 8 * 1024;
const MAX_COOKIE_VALUE_LENGTH = 4 * 1024;
const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export type VerifiedAdminActor = {
  id: string | null;
  label: string;
};

export type VerifyAdminSessionResult = {
  isAdmin: boolean;
  actor: VerifiedAdminActor | null;
  errors: string[];
};

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

  if (!cookieHeader || cookieHeader.length > MAX_COOKIE_HEADER_LENGTH) {
    return "";
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const matchingCookie = cookies.find((cookie) => {
    const separatorIndex = cookie.indexOf("=");
    return separatorIndex > 0 && cookie.slice(0, separatorIndex) === cookieName;
  });

  if (!matchingCookie) return "";

  const rawValue = matchingCookie.slice(matchingCookie.indexOf("=") + 1);

  if (!rawValue || rawValue.length > MAX_COOKIE_VALUE_LENGTH) {
    return "";
  }

  try {
    const decodedValue = decodeURIComponent(rawValue);
    return decodedValue.length <= MAX_COOKIE_VALUE_LENGTH ? decodedValue : "";
  } catch {
    return "";
  }
}

export function verifyAdminSession(request: Request): VerifyAdminSessionResult {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session is not configured."],
    };
  }

  const session = getCookieValue(request, ADMIN_SESSION_COOKIE_NAME);

  if (!session) {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session cookie is missing."],
    };
  }

  const lastDotIndex = session.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session format is invalid."],
    };
  }

  const payload = session.slice(0, lastDotIndex);
  const signature = session.slice(lastDotIndex + 1);
  const expectedSignature = signSession(payload, sessionSecret);

  if (!safeCompare(signature, expectedSignature)) {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session signature is invalid."],
    };
  }

  const [role, expiresAtText] = payload.split(":");
  const expiresAt = Number(expiresAtText);

  if (role !== "admin") {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session role is invalid."],
    };
  }

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return {
      isAdmin: false,
      actor: null,
      errors: ["Admin session is expired."],
    };
  }

  return {
    isAdmin: true,
    actor: {
      id: null,
      label: "AiFinder Admin",
    },
    errors: [],
  };
}

export function createAdminCsrfToken() {
  return randomBytes(32).toString("hex");
}

function getExpectedAdminCsrfToken(request: Request) {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const session = getCookieValue(request, ADMIN_SESSION_COOKIE_NAME);

  if (!sessionSecret || !session || !verifyAdminSession(request).isAdmin) {
    return "";
  }

  return signSession(`csrf:${session}`, sessionSecret);
}

export function getOrCreateAdminCsrfToken(request: Request) {
  const expectedToken = getExpectedAdminCsrfToken(request);

  if (!expectedToken) {
    return "";
  }

  const existingToken = getCookieValue(request, ADMIN_CSRF_COOKIE_NAME);

  if (
    CSRF_TOKEN_PATTERN.test(existingToken) &&
    safeCompare(existingToken, expectedToken)
  ) {
    return existingToken;
  }

  return expectedToken;
}

export function verifyAdminCsrfRequest(request: Request) {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const csrfHeader = request.headers.get("x-csrf-token") || "";
  const csrfCookie = getCookieValue(request, ADMIN_CSRF_COOKIE_NAME);
  const expectedToken = getExpectedAdminCsrfToken(request);

  if (!csrfHeader || !csrfCookie || !expectedToken) {
    return false;
  }

  if (!CSRF_TOKEN_PATTERN.test(csrfHeader)) {
    return false;
  }

  if (!CSRF_TOKEN_PATTERN.test(csrfCookie)) {
    return false;
  }

  return (
    safeCompare(csrfHeader, expectedToken) &&
    safeCompare(csrfCookie, expectedToken)
  );
}

export function isAuthorizedAdminRequest(request: Request) {
  return verifyAdminSession(request).isAdmin;
}
