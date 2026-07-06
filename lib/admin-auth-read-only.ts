type ReadOnlyAdminActor = {
  id: string;
  label?: string;
  email?: string;
  username?: string;
};

type ReadOnlyAdminSession = {
  isAdmin: boolean;
  actor: ReadOnlyAdminActor | null;
  errors: string[];
};

type AdminSessionPayload = {
  actor?: unknown;
  admin?: unknown;
  email?: unknown;
  username?: unknown;
  user?: unknown;
  role?: unknown;
  isAdmin?: unknown;
  expiresAt?: unknown;
  expires_at?: unknown;
  expiresAtMs?: unknown;
  exp?: unknown;
};

const ADMIN_SESSION_COOKIE_NAME = `aifinder_admin_session`;
const ADMIN_SESSION_SECRET_ENV_NAME = `ADMIN_SESSION_SECRET`;

function parseCookies(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const rawValue = trimmed.slice(separatorIndex + 1);

    try {
      cookies.set(key, decodeURIComponent(rawValue));
    } catch {
      cookies.set(key, rawValue);
    }
  }

  return cookies;
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  return parseCookies(cookieHeader).get(name) ?? null;
}

function normalizeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;

  return normalized + "=".repeat(paddingLength);
}

function decodeBase64UrlJson(value: string): AdminSessionPayload | null {
  try {
    const json = Buffer.from(normalizeBase64Url(value), "base64").toString("utf8");
    const parsed = JSON.parse(json) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as AdminSessionPayload;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(payload: string, secret: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    return null;
  }

  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await subtle.sign("HMAC", key, encoder.encode(payload));

  return bytesToHex(new Uint8Array(signature));
}

function constantTimeStringEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    const leftCode = index < left.length ? left.charCodeAt(index) : 0;
    const rightCode = index < right.length ? right.charCodeAt(index) : 0;
    diff |= leftCode ^ rightCode;
  }

  return diff === 0;
}

function splitSignedSession(rawSession: string): { payload: string; signature: string } | null {
  const dotIndex = rawSession.lastIndexOf(".");
  const colonIndex = rawSession.lastIndexOf(":");
  const separatorIndex = Math.max(dotIndex, colonIndex);

  if (separatorIndex <= 0 || separatorIndex >= rawSession.length - 1) {
    return null;
  }

  return {
    payload: rawSession.slice(0, separatorIndex),
    signature: rawSession.slice(separatorIndex + 1),
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function pickActor(payload: AdminSessionPayload): ReadOnlyAdminActor | null {
  const actorId = readString(payload.actor);
  const adminId = readString(payload.admin);
  const email = readString(payload.email);
  const username = readString(payload.username);
  const userId = readString(payload.user);
  const id = actorId ?? adminId ?? email ?? username ?? userId;

  if (id) {
    const label = email ?? username ?? id;
  const actor: ReadOnlyAdminActor = { id, label };

    if (email) {
      actor.email = email;
    }

    if (username) {
      actor.username = username;
    }

    return actor;
  }

  if (payload.isAdmin === true || payload.role === "admin") {
    return { id: "admin", label: "admin" };
  }

  return null;
}

function isExpired(payload: AdminSessionPayload): boolean {
  const rawExpiry =
    payload.expiresAt ??
    payload.expires_at ??
    payload.expiresAtMs ??
    payload.exp;

  if (rawExpiry === undefined || rawExpiry === null) {
    return false;
  }

  const expiryNumber =
    typeof rawExpiry === "number"
      ? rawExpiry
      : typeof rawExpiry === "string"
        ? Number(rawExpiry)
        : Number.NaN;

  if (!Number.isFinite(expiryNumber)) {
    return true;
  }

  const expiryMs = expiryNumber < 10_000_000_000 ? expiryNumber * 1000 : expiryNumber;

  return Date.now() > expiryMs;
}

function unauthorized(errors: string[]): ReadOnlyAdminSession {
  return {
    isAdmin: false,
    actor: null,
    errors,
  };
}

export async function getReadOnlyAdminSession(
  request: Request,
): Promise<ReadOnlyAdminSession> {
  const secret = process.env[ADMIN_SESSION_SECRET_ENV_NAME];

  if (!secret) {
    return unauthorized(["missing_admin_session_secret"]);
  }

  const rawSession = getCookie(request, ADMIN_SESSION_COOKIE_NAME);

  if (!rawSession) {
    return unauthorized(["missing_admin_session_cookie"]);
  }

  const signedSession = splitSignedSession(rawSession);

  if (!signedSession) {
    return unauthorized(["invalid_admin_session_format"]);
  }

  const expectedSignature = await hmacSha256Hex(signedSession.payload, secret);

  if (!expectedSignature) {
    return unauthorized(["admin_session_crypto_unavailable"]);
  }

  if (!constantTimeStringEqual(expectedSignature, signedSession.signature)) {
    return unauthorized(["invalid_admin_session_signature"]);
  }

  const payload = decodeBase64UrlJson(signedSession.payload);

  if (!payload) {
    return unauthorized(["invalid_admin_session_payload"]);
  }

  if (payload.isAdmin === false || isExpired(payload)) {
    return unauthorized(["inactive_admin_session"]);
  }

  const actor = pickActor(payload);

  if (!actor) {
    return unauthorized(["missing_admin_session_actor"]);
  }

  return {
    isAdmin: true,
    actor,
    errors: [],
  };
}
