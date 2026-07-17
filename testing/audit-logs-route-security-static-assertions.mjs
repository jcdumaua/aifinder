import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = "app/api/admin/audit-logs/route.ts";
const authPath = "lib/admin-auth.ts";
const adminPath = "lib/supabase-admin.ts";

const route = readFileSync(routePath, "utf8");
const auth = readFileSync(authPath, "utf8");
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

// 1-7: server/runtime and route surface.
assertIncludes(route, 'import "server-only";', "audit logs route");
assertNotIncludes(route, '"use client"', "audit logs route");
assertNotIncludes(route, "'use client'", "audit logs route");
assertIncludes(route, 'export const runtime = "nodejs";', "audit logs route");
assertIncludes(route, 'export const dynamic = "force-dynamic";', "audit logs route");
assertRegex(route, /export\s+async\s+function\s+GET\s*\(/, "audit logs GET");
assertNoRegex(route, /export\s+async\s+function\s+(?:POST|PUT|PATCH|DELETE)\s*\(/, "extra audit mutation handlers");

// 8-14: authorization and response safeguards.
assertIncludes(route, "isAuthorizedAdminRequest", "audit logs authorization");
assert.ok(
  route.indexOf("isAuthorizedAdminRequest") <
    route.indexOf("archiveOverflowAuditLogs"),
  "authorization must precede archival work",
);
assert.ok(
  route.indexOf("isAuthorizedAdminRequest") <
    route.indexOf('.from("admin_audit_logs")'),
  "authorization must precede database access",
);
assertIncludes(route, '{ error: "Unauthorized" }', "audit logs unauthorized response");
assertIncludes(route, '"Cache-Control": "no-store"', "audit logs no-store");
assertIncludes(route, '"X-Content-Type-Options": "nosniff"', "audit logs nosniff");
assertIncludes(route, "401", "audit logs unauthorized status");

// 15-23: preserved limits, archive format, and payload.
assertIncludes(route, "const LIVE_LOG_LIMIT = 100;", "live log limit");
assertIncludes(route, "const DISPLAY_LOG_LIMIT = 50;", "display log limit");
assertIncludes(route, 'const ARCHIVE_BUCKET = "admin-audit-archives";', "archive bucket");
assertIncludes(route, 'contentType: "application/gzip"', "gzip content type");
assertIncludes(route, 'archiveFormat: "json.gz"', "archive response format");
assertIncludes(route, "liveLogLimit: LIVE_LOG_LIMIT", "live limit response");
assertIncludes(route, "displayLogLimit: DISPLAY_LOG_LIMIT", "display limit response");
assertIncludes(route, "logs,", "logs response key");
assertIncludes(route, "archives,", "archives response key");

// 24-34: archival sequence and mutation ceilings.
assertIncludes(route, '.from("admin_audit_logs")', "audit logs table");
assertIncludes(route, '.from("admin_audit_archives")', "audit archives table");
assert.ok(
  route.indexOf('.select("id", { count: "exact", head: true })') <
    route.indexOf("gzipSync"),
  "count must precede compression",
);
assert.ok(
  route.indexOf("gzipSync") < route.indexOf(".upload("),
  "compression must precede upload",
);
assert.ok(
  route.indexOf(".upload(") < route.indexOf('.from("admin_audit_archives")'),
  "upload must precede archive metadata insert",
);
assert.ok(
  route.indexOf('.from("admin_audit_archives")') <
    route.lastIndexOf('.from("admin_audit_logs")'),
  "archive metadata insert must precede live-log delete",
);
assert.ok(
  route.indexOf("archiveInsertError") < route.indexOf(".remove("),
  "archive insert failure must precede cleanup attempt",
);
assert.equal((route.match(/\.upload\(/g) || []).length, 1, "exactly one upload is allowed");
assert.equal((route.match(/\.remove\(/g) || []).length, 1, "exactly one remove is allowed");
assert.equal((route.match(/\.insert\(/g) || []).length, 1, "exactly one insert is allowed");
assert.equal((route.match(/\.delete\(/g) || []).length, 1, "exactly one delete is allowed");

// 35-44: fixed categorical logging.
assertIncludes(route, 'console.error("audit_logs_count_failed")', "audit count log");
assertIncludes(route, 'console.error("audit_logs_archive_fetch_failed")', "audit archive fetch log");
assertIncludes(route, 'console.error("audit_logs_archive_upload_failed")', "audit upload log");
assertIncludes(route, 'console.error("audit_logs_archive_insert_failed")', "audit insert log");
assertIncludes(route, 'console.error("audit_logs_archive_delete_failed")', "audit delete log");
assertIncludes(route, 'console.error("audit_logs_recent_load_failed")', "recent logs load log");
assertIncludes(route, 'console.error("audit_logs_archives_load_failed")', "archives load log");
assertIncludes(route, 'console.error("audit_logs_unexpected_failure")', "unexpected log");
assertIncludes(route, '"Failed to load audit logs."', "generic audit logs failure");
assertNotIncludes(route, "Admin audit logs route error:", "legacy unexpected log");

// 45-53: no diagnostic leakage.
assertNoRegex(route, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?\.message/s, "raw message logging");
assertNoRegex(route, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?\?\.\s*message/s, "optional raw message logging");
assertNoRegex(route, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?,\s*(?:error|\w+Error)\s*\)/s, "raw error object logging");
assertNoRegex(route, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?(?:stack|cause|details|hint|code)/s, "diagnostic property logging");
assertNoRegex(route, /error\s+instanceof\s+Error\s*\?\s*error\.message/, "dynamic error response");
assertNoRegex(route, /JSON\.stringify\s*\([^)]*(?:error|\w+Error)/, "serialized error object");
assertNotIncludes(route, "countError.message", "count error message");
assertNotIncludes(route, "fetchError?.message", "fetch error message");
assertNotIncludes(route, "uploadError.message", "upload error message");

// 54-60: remaining diagnostic names and dependency invariants.
assertNotIncludes(route, "archiveInsertError.message", "archive insert error message");
assertNotIncludes(route, "deleteError.message", "delete error message");
assertNotIncludes(route, "error.message", "generic error message");
assertIncludes(auth, "isAuthorizedAdminRequest", "admin authorization dependency");
assertIncludes(admin, 'import "server-only";', "Supabase admin server boundary");
assertIncludes(route, "await archiveOverflowAuditLogs();", "archival invocation");
assertIncludes(route, "Promise.all", "parallel read loading");

console.log("Audit logs route security static assertions passed.");
