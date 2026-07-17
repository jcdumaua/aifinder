import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath =
  "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts";
const authPath = "lib/admin-auth.ts";
const rateLimitPath = "lib/admin-rate-limit.ts";
const adminPath = "lib/supabase-admin.ts";

const route = readFileSync(routePath, "utf8");
const auth = readFileSync(authPath, "utf8");
const rateLimit = readFileSync(rateLimitPath, "utf8");
const admin = readFileSync(adminPath, "utf8");

function assertIncludes(source, marker, label) {
  assert.ok(source.includes(marker), `${label} missing marker: ${marker}`);
}

function assertNotIncludes(source, marker, label) {
  assert.ok(!source.includes(marker), `${label} forbidden marker present: ${marker}`);
}

function assertRegex(source, pattern, label) {
  assert.ok(pattern.test(source), `${label} missing required pattern: ${pattern}`);
}

function assertNoRegex(source, pattern, label) {
  assert.ok(!pattern.test(source), `${label} contains forbidden pattern: ${pattern}`);
}

// Server/runtime boundary.
assertIncludes(route, 'import "server-only";', "discovered tool approve route");
assertNotIncludes(route, '"use client"', "discovered tool approve route");
assertNotIncludes(route, "'use client'", "discovered tool approve route");
assertIncludes(route, 'export const runtime = "nodejs";', "discovered tool approve route");
assertIncludes(route, 'export const dynamic = "force-dynamic";', "discovered tool approve route");
assertRegex(
  route,
  /export\s+async\s+function\s+POST\s*\(/,
  "discovered tool approve POST",
);
assertNoRegex(
  route,
  /export\s+async\s+function\s+(?:PUT|PATCH|DELETE)\s*\(/,
  "discovered tool approve extra mutation handlers",
);

// Authorization and ordering.
assertIncludes(route, "verifyAdminSession", "discovered tool approve admin session");
assertIncludes(route, "verifyAdminCsrfRequest", "discovered tool approve CSRF");
assertIncludes(route, "checkAdminRateLimit", "discovered tool approve rate limit");
assertIncludes(
  route,
  "ADMIN_RATE_LIMIT_ACTIONS.discoveryToolApprove",
  "discovered tool approve rate action",
);
assertIncludes(route, "approve_discovered_tool", "discovered tool approve RPC");
assert.ok(
  route.indexOf("verifyAdminSession") < route.indexOf("checkAdminRateLimit"),
  "admin session verification must precede rate limiting",
);
assert.ok(
  route.indexOf("verifyAdminCsrfRequest") < route.indexOf("checkAdminRateLimit"),
  "CSRF verification must precede rate limiting",
);
assert.ok(
  route.indexOf("checkAdminRateLimit") < route.indexOf("approve_discovered_tool"),
  "rate limiting must precede approve RPC",
);

// Fixed categorical logging.
assertIncludes(
  route,
  'console.warn("discovered_tool_approve_unauthorized")',
  "discovered tool approve unauthorized log",
);
assertIncludes(
  route,
  'console.error("discovered_tool_approve_failed")',
  "discovered tool approve failed log",
);
assertIncludes(
  route,
  'console.error("discovered_tool_approve_unexpected_failure")',
  "discovered tool approve unexpected log",
);
assertNotIncludes(route, "adminSession.errors", "discovered tool approve session diagnostics");
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?(?:error\.message|adminSession\.actor|request|p_actor_id|p_actor_label|approvedToolId|stack|cause|id\b)/s,
  "discovered tool approve raw logging",
);

// Public error boundary.
assertIncludes(
  route,
  '"Failed to approve discovered tool."',
  "discovered tool approve generic failure response",
);
assertNotIncludes(route, "getSafeApprovalError", "discovered tool approve message classifier");
assertNoRegex(
  route,
  /\.includes\(\s*["'](?:not found|already exists|required|cannot be normalized|cannot produce|must be new or pending_review|approved but missing approved_tool_id)["']\s*\)/,
  "discovered tool approve substring classifier",
);
assertNoRegex(
  route,
  /error\.message/,
  "discovered tool approve raw RPC message",
);
assertNoRegex(
  route,
  /\b(?:stack|cause)\s*:/,
  "discovered tool approve stack or cause response",
);

// RPC containment and success shape.
assertRegex(
  route,
  /\.rpc\(\s*["']approve_discovered_tool["']/,
  "discovered tool approve exact RPC",
);
assertIncludes(route, "p_discovered_tool_id", "discovered tool approve ID argument");
assertIncludes(route, "p_actor_id", "discovered tool approve actor ID");
assertIncludes(route, "p_actor_label", "discovered tool approve actor label");
assertNoRegex(
  route,
  /\.from\(\s*["'][^"']+["']\s*\)\s*\.(?:insert|update|upsert|delete)\s*\(/,
  "discovered tool approve direct table mutation",
);
assertIncludes(route, "approvedToolId", "discovered tool approve success ID");
assertIncludes(route, "success: true", "discovered tool approve success response");

// Existing safeguards.
assertIncludes(route, "isValidUuid", "discovered tool approve UUID validation");
assertIncludes(route, '"Cache-Control": "no-store"', "discovered tool approve no-store");
assertIncludes(
  route,
  '"X-Content-Type-Options": "nosniff"',
  "discovered tool approve nosniff",
);
assertIncludes(route, '{ error: "Unauthorized" }', "discovered tool approve 401 response");
assertIncludes(route, "401", "discovered tool approve unauthorized status");
assertIncludes(route, "403", "discovered tool approve CSRF status");
assertIncludes(route, "429", "discovered tool approve rate-limit status");
assertIncludes(route, "400", "discovered tool approve invalid UUID status");

// Dependency invariants.
assertIncludes(auth, "process.env.ADMIN_SESSION_SECRET", "admin auth environment boundary");
assertIncludes(auth, "timingSafeEqual", "admin auth timing-safe comparison");
assertIncludes(auth, "x-csrf-token", "admin auth CSRF header");
assertIncludes(auth, "ADMIN_CSRF_COOKIE_NAME", "admin auth CSRF cookie");
assertIncludes(
  rateLimit,
  "discoveryToolApprove",
  "admin rate limit approve action",
);
assertIncludes(
  rateLimit,
  "Too many admin requests. Please wait and try again.",
  "admin rate limit bounded response",
);
assertIncludes(admin, 'import "server-only";', "Supabase admin server boundary");
assertIncludes(
  admin,
  "SUPABASE_SERVICE_ROLE_KEY",
  "Supabase admin service-role boundary",
);

console.log("Discovered tool approve route security static assertions passed.");
