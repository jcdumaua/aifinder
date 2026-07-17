import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath =
  "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts";
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

// 1-7: server/runtime boundary.
assertIncludes(route, 'import "server-only";', "discovered tool duplicate route");
assertNotIncludes(route, '"use client"', "discovered tool duplicate route");
assertNotIncludes(route, "'use client'", "discovered tool duplicate route");
assertIncludes(route, 'export const runtime = "nodejs";', "discovered tool duplicate route");
assertIncludes(route, 'export const dynamic = "force-dynamic";', "discovered tool duplicate route");
assertRegex(route, /export\s+async\s+function\s+POST\s*\(/, "duplicate POST");
assertNoRegex(route, /export\s+async\s+function\s+(?:PUT|PATCH|DELETE)\s*\(/, "extra mutation handlers");

// 8-14: authorization and ordering.
assertIncludes(route, "verifyAdminSession", "duplicate admin session");
assertIncludes(route, "verifyAdminCsrfRequest", "duplicate CSRF");
assertIncludes(route, "checkAdminRateLimit", "duplicate rate limit");
assertIncludes(route, "ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate", "duplicate rate action");
assert.ok(route.indexOf("verifyAdminSession") < route.indexOf("verifyAdminCsrfRequest"), "session must precede CSRF");
assert.ok(route.indexOf("verifyAdminCsrfRequest") < route.indexOf("checkAdminRateLimit"), "CSRF must precede rate limiting");
assert.ok(route.indexOf("checkAdminRateLimit") < route.indexOf('.from("discovered_tools")'), "rate limiting must precede database access");

// 15-21: typed validation boundary and preserved validation rules.
assertIncludes(route, "application/json", "duplicate JSON content type");
assertIncludes(route, "20 * 1024", "duplicate body-size limit");
assertIncludes(route, "VALID_CANDIDATE_TYPES", "duplicate candidate allowlist");
assertIncludes(route, "VALID_MATCH_TYPES", "duplicate match allowlist");
assertIncludes(route, "MAX_REASON_LENGTH", "duplicate reason limit");
assertIncludes(route, "Match score must be between 0 and 100.", "duplicate score bounds");
assertNoRegex(route, /error\s+instanceof\s+Error\s*\?\s*error\.message/, "dynamic validation response");

// 22-28: fixed categorical logging.
assertIncludes(route, 'console.warn("discovered_tool_duplicate_unauthorized")', "duplicate unauthorized log");
assertIncludes(route, 'console.error("discovered_tool_duplicate_load_failed")', "duplicate load failure log");
assertIncludes(route, 'console.error("discovered_tool_duplicate_candidate_insert_failed")', "duplicate insert failure log");
assertIncludes(route, 'console.error("discovered_tool_duplicate_status_update_failed")', "duplicate update failure log");
assertIncludes(route, 'console.error("discovered_tool_duplicate_audit_insert_failed")', "duplicate audit failure log");
assertIncludes(route, 'console.error("discovered_tool_duplicate_unexpected_failure")', "duplicate unexpected log");
assertNotIncludes(route, "adminSession.errors", "duplicate session diagnostics");

// 29-33: no raw diagnostic leakage or partial-completion wording.
assertNoRegex(route, /message:\s*\w+Error\.message/, "raw Supabase error logging");
assertNoRegex(route, /console\.(?:log|warn|error|info)\s*\([^;]*?(?:reason|metadata|candidate_tool_id|candidate_submission_id|candidate_discovered_tool_id|actor|stack|cause)/s, "sensitive duplicate logging");
assertNotIncludes(route, "Duplicate candidate created, but status update failed.", "partial candidate wording");
assertNotIncludes(route, "Duplicate marked, but audit logging failed.", "partial audit wording");
assertIncludes(route, '"Failed to mark duplicate."', "generic duplicate failure response");

// 34-40: exact mutation containment and order.
assertIncludes(route, '.from("discovered_tools")', "discovered tools table");
assertIncludes(route, '.from("discovery_duplicate_candidates")', "duplicate candidate table");
assertIncludes(route, '.from("discovery_audit_events")', "duplicate audit table");
assert.ok(
  route.indexOf('.from("discovered_tools")') <
    route.indexOf('.from("discovery_duplicate_candidates")'),
  "discovered tool read must precede duplicate insert",
);
assert.ok(
  route.indexOf('.from("discovery_duplicate_candidates")') <
    route.lastIndexOf('.from("discovered_tools")'),
  "duplicate insert must precede status update",
);
assert.ok(
  route.lastIndexOf('.from("discovered_tools")') <
    route.indexOf('.from("discovery_audit_events")'),
  "status update must precede audit insert",
);
assert.equal((route.match(/\.insert\(/g) || []).length, 2, "exactly two inserts are allowed");

// 41-45: response and header safeguards.
assertIncludes(route, '"Cache-Control": "no-store"', "duplicate no-store");
assertIncludes(route, '"X-Content-Type-Options": "nosniff"', "duplicate nosniff");
assertIncludes(route, '{ error: "Unauthorized" }', "duplicate unauthorized response");
assertIncludes(route, '"Discovered tool not found."', "duplicate not-found response");
assertIncludes(route, "201", "duplicate success status");

// 46-48: dependency invariants and explicit atomicity limitation.
assertIncludes(auth, "timingSafeEqual", "admin auth timing-safe comparison");
assertIncludes(rateLimit, "discoveryToolDuplicate", "duplicate rate-limit action");
assertIncludes(admin, 'import "server-only";', "Supabase admin server boundary");

console.log("Discovered tool duplicate route security static assertions passed.");
