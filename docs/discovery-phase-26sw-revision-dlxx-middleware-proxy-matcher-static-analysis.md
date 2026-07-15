# Phase 26SW — Middleware and Proxy Matcher Static Analysis

## Bound baseline

`a5051e4bc9a7b4c5888799113d7c098657a791b4`

## Inspection boundary

Committed proxy or middleware source files were read statically.

No matcher was executed. No request was sent. No route, server, database, environment value, credential, or network service was accessed.

## Inventory result

- Proxy/middleware source files: `1`
- Admin/API route candidates considered for coverage comparison: `47`

## Proxy and middleware files

```text
proxy.ts
```

## Matcher and routing evidence

```text
proxy.ts:1:import { NextResponse, type NextRequest } from "next/server";
proxy.ts:39:function addSecurityHeaders(response: NextResponse) {
proxy.ts:100:  const pathname = request.nextUrl.pathname;
proxy.ts:102:  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
proxy.ts:105:      loginUrl.pathname = "/admin-login";
proxy.ts:106:      loginUrl.searchParams.set("from", pathname);
proxy.ts:108:      return addSecurityHeaders(NextResponse.redirect(loginUrl));
proxy.ts:112:  return addSecurityHeaders(NextResponse.next());
proxy.ts:115:export const config = {
proxy.ts:116:  matcher: [
```

## Static proxy/middleware source

```text
### FILE: proxy.ts
import { NextResponse, type NextRequest } from "next/server";

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

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    if (!(await hasActiveAdminSessionCookie(request))) {
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
```

## Protected-route candidates

```text
app/admin/analytics/page.tsx
app/admin/discovered-tools/page.tsx
app/admin/discovery/page.tsx
app/admin/discovery/tools/[id]/page.tsx
app/admin/discovery/tools/page.tsx
app/admin/homepage-control/[id]/edit/page.tsx
app/admin/homepage-control/[id]/page.tsx
app/admin/homepage-control/[id]/preview/page.tsx
app/admin/homepage-control/page.tsx
app/admin/layout.tsx
app/admin/moderation/page.tsx
app/admin/notifications/page.tsx
app/admin/page.tsx
app/admin/security/page.tsx
app/admin/settings/page.tsx
app/admin/tools/page.tsx
app/api/admin/audit-logs/route.ts
app/api/admin/csrf/route.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts
app/api/admin/homepage-control/drafts/[id]/publish/route.ts
app/api/admin/homepage-control/drafts/[id]/route.ts
app/api/admin/homepage-control/drafts/route.ts
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
app/api/admin/submissions/route.ts
app/api/admin/tools/route.ts
app/api/admin/upload-logo/route.ts
app/api/homepage-control/published/route.ts
app/api/submit-tool/route.ts
app/api/upload-logo/route.ts
```

## Required coverage analysis

The static review must confirm or leave open:

1. which routes the matcher includes;
2. which routes it intentionally excludes;
3. whether static assets and framework internals are excluded safely;
4. whether admin pages and admin APIs are protected consistently;
5. whether public APIs rely on route-level authorization instead;
6. whether redirects fail closed;
7. whether encoded, nested, or alternate paths could bypass pathname checks;
8. whether middleware and route-level checks provide defense in depth;
9. whether matcher behavior changed across framework upgrades;
10. whether any unprotected route can reach privileged service-role operations.

## Current determination

`MIDDLEWARE_MATCHER_STATIC_STRUCTURE_IDENTIFIED_COMPLETE_COVERAGE_NOT_ESTABLISHED`
