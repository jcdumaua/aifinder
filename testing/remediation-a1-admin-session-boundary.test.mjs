import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const logoutSource = readFileSync("app/api/admin/logout/route.ts", "utf8");
const sessionSource = readFileSync("app/api/admin/session/route.ts", "utf8");
const authSource = readFileSync("lib/admin-auth.ts", "utf8");

const AUTH_GUARD =
  /verifySession|requireAdmin|isAdmin|auth\.getUser|getUser\(|getSession\(/i;
const DENY_STATUS = /status\s*:\s*(401|403)|unauthorized|forbidden/i;
const ROLE_GUARD = /\brole\b|is_admin|admin_role|app_metadata|user_metadata/i;
const COOKIE_CLEAR =
  /cookies\(\)|\.delete\(|maxAge\s*:\s*0|expires\s*:/i;
const COOKIE_SECURITY =
  /httpOnly|sameSite|secure\s*:|path\s*:|maxAge|expires/i;
const PRIVATE_CACHE = /no-store|private|cache-control/i;
const SENSITIVE_LOG =
  /console\.(log|error|warn|info)\s*\([^)]*(cookie|session|token|process\.env|SUPABASE_)/is;
const SENSITIVE_RESPONSE =
  /\b(access_token|refresh_token|service_role|cookie|secret|password)\b/i;

test("A1-T01 logout requires an approved auth guard", () => {
  assert.match(logoutSource, AUTH_GUARD);
});

test("A1-T02 logout defines fail-closed denial behavior", () => {
  assert.match(logoutSource, DENY_STATUS);
});

test("A1-T03 logout clears approved session state", () => {
  assert.match(logoutSource, COOKIE_CLEAR);
});

test("A1-T04 logout uses secure cookie-clearing attributes", () => {
  assert.match(logoutSource, COOKIE_SECURITY);
});

test("A1-T05 logout does not log sensitive session material", () => {
  assert.doesNotMatch(logoutSource, SENSITIVE_LOG);
});

test("A1-T06 session route requires an approved auth guard", () => {
  assert.match(sessionSource, AUTH_GUARD);
});

test("A1-T07 session route defines fail-closed denial behavior", () => {
  assert.match(sessionSource, DENY_STATUS);
});

test("A1-T08 session route enforces an admin-role signal", () => {
  assert.match(sessionSource, ROLE_GUARD);
});

test("A1-T09 session response excludes sensitive fields", () => {
  assert.doesNotMatch(sessionSource, SENSITIVE_RESPONSE);
});

test("A1-T10 session response is private and non-cacheable", () => {
  assert.match(sessionSource, PRIVATE_CACHE);
});

test("A1-T11 auth helper verifies both session and admin role", () => {
  assert.match(authSource, AUTH_GUARD);
  assert.match(authSource, ROLE_GUARD);
});

test("A1-T12 auth helper does not log sensitive session material", () => {
  assert.doesNotMatch(authSource, SENSITIVE_LOG);
});
