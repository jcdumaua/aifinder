import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = "app/api/admin/audit-logs/route.ts";
const handlerPath = "app/api/admin/audit-logs/handler.ts";
const authPath = "lib/admin-auth.ts";
const adminPath = "lib/supabase-admin.ts";

const route = readFileSync(routePath, "utf8");
const handler = readFileSync(handlerPath, "utf8");
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
assertIncludes(route, "export const GET = handlers.GET;", "audit logs GET");
assertIncludes(route, "export const POST = handlers.POST;", "audit logs archive POST");

// 8-14: authorization and response safeguards.
assertIncludes(route, "verifyAdminSession", "audit logs authorization binding");
assertIncludes(handler, "dependencies.verifySession(request)", "audit logs authorization");
assert.ok(
  handler.indexOf(
    "const security = await requireSecurity(request, ADMIN_RATE_LIMIT_ACTIONS.auditLogsArchive",
  ) < handler.lastIndexOf("archiveInFlight = archiveOverflowAuditLogs()"),
  "authorization must precede archival work",
);
assert.ok(
  handler.indexOf(
    "const security = await requireSecurity(request, ADMIN_RATE_LIMIT_ACTIONS.auditLogsRead",
  ) <
    handler.lastIndexOf('.from("admin_audit_logs")'),
  "authorization must precede database access",
);
assertIncludes(handler, '{ error: "Unauthorized" }', "audit logs unauthorized response");
assertIncludes(handler, '"Cache-Control": "no-store"', "audit logs no-store");
assertIncludes(handler, '"X-Content-Type-Options": "nosniff"', "audit logs nosniff");
assertIncludes(handler, "401", "audit logs unauthorized status");

// 15-23: preserved limits, archive format, and payload.
assertIncludes(handler, "const LIVE_LOG_LIMIT = 100;", "live log limit");
assertIncludes(handler, "const DISPLAY_LOG_LIMIT = 50;", "display log limit");
assertIncludes(handler, 'const ARCHIVE_BUCKET = "admin-audit-archives";', "archive bucket");
assertIncludes(handler, 'contentType: "application/gzip"', "gzip content type");
assertIncludes(handler, 'archiveFormat: "json.gz"', "archive response format");
assertIncludes(handler, "liveLogLimit: LIVE_LOG_LIMIT", "live limit response");
assertIncludes(handler, "displayLogLimit: DISPLAY_LOG_LIMIT", "display limit response");
assertIncludes(handler, "logs:", "logs response key");
assertIncludes(handler, "archives:", "archives response key");

// 24-34: archival sequence and mutation ceilings.
assertIncludes(handler, '.from("admin_audit_logs")', "audit logs table");
assertIncludes(handler, '.from("admin_audit_archives")', "audit archives table");
assert.ok(
  handler.indexOf('.select("id", { count: "exact", head: true })') <
    handler.indexOf("dependencies.compressArchive"),
  "count must precede compression",
);
assert.ok(
  handler.indexOf("dependencies.compressArchive") < handler.indexOf(".upload("),
  "compression must precede upload",
);
assert.ok(
  handler.indexOf(".upload(") < handler.indexOf("const { error: metadataError }"),
  "upload must precede archive metadata insert",
);
assert.ok(
  handler.indexOf("const { error: metadataError }") <
    handler.indexOf(".delete()", handler.indexOf("const ids = logs.map")),
  "archive metadata insert must precede live-log delete",
);
assert.ok(
  handler.indexOf("let metadataResult") <
    handler.indexOf(
      "const compensated = await removeArchiveObject(storagePath)",
      handler.indexOf("let metadataResult"),
    ),
  "archive insert failure must precede cleanup attempt",
);
assert.equal((handler.match(/\.upload\(/g) || []).length, 1, "exactly one upload is allowed");
assert.equal((handler.match(/\.remove\(/g) || []).length, 1, "one cleanup primitive is allowed");
assert.equal((handler.match(/\.insert\(/g) || []).length, 1, "exactly one insert is allowed");
assert.equal((handler.match(/\.delete\(/g) || []).length, 2, "live and compensation deletes are allowed");
assertIncludes(
  handler,
  "const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 4 * 1024 * 1024;",
  "archive actual-byte ceiling",
);
assert.ok(
  handler.indexOf("serializeBoundedArchivePayload") <
    handler.indexOf("dependencies.compressArchive(archivePayload.text)"),
  "actual-byte payload validation must precede compression",
);
assertIncludes(handler, "new TextEncoder()", "archive UTF-8 byte measurement");
assertRegex(
  handler,
  /\.from\("admin_audit_logs"\)\s*\.delete\(\)\s*\.in\("id", ids\)\s*\.select\("id"\)/u,
  "exact live-log delete result selection",
);
assertIncludes(handler, "hasExactDeletedIdSet(deletedRows, ids)", "exact deleted-ID proof");
assertIncludes(handler, 'reason: "archive_delete_mismatch"', "delete mismatch result");
assertIncludes(handler, "requires_reconciliation: true", "delete mismatch reconciliation flag");

// 35-44: fixed categorical logging.
assertIncludes(handler, 'console.error("audit_logs_count_failed")', "audit count log");
assertIncludes(handler, 'console.error("audit_logs_archive_fetch_failed")', "audit archive fetch log");
assertIncludes(handler, 'console.error("audit_logs_archive_upload_failed")', "audit upload log");
assertIncludes(handler, 'console.error("audit_logs_archive_metadata_failed")', "audit insert log");
assertIncludes(handler, 'console.error("audit_logs_archive_delete_failed")', "audit delete log");
assertIncludes(handler, 'console.error("audit_logs_recent_load_failed")', "recent logs load log");
assertIncludes(handler, 'console.error("audit_logs_archives_load_failed")', "archives load log");
assertIncludes(handler, 'console.error("audit_logs_unexpected_failure")', "unexpected log");
assertIncludes(handler, '"Failed to load audit logs."', "generic audit logs failure");
assertNotIncludes(handler, "Admin audit logs route error:", "legacy unexpected log");

// 45-53: no diagnostic leakage.
assertNoRegex(handler, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?\.message/s, "raw message logging");
assertNoRegex(handler, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?\?\.\s*message/s, "optional raw message logging");
assertNoRegex(handler, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?,\s*(?:error|\w+Error)\s*\)/s, "raw error object logging");
assertNoRegex(handler, /console\.(?:log|warn|error|info|debug)\s*\([^;]*?(?:stack|cause|details|hint|code)/s, "diagnostic property logging");
assertNoRegex(handler, /error\s+instanceof\s+Error\s*\?\s*error\.message/, "dynamic error response");
assertNoRegex(handler, /JSON\.stringify\s*\([^)]*(?:error|\w+Error)/, "serialized error object");
assertNotIncludes(handler, "countError.message", "count error message");
assertNotIncludes(handler, "fetchError?.message", "fetch error message");
assertNotIncludes(handler, "uploadError.message", "upload error message");

// 54-60: remaining diagnostic names and dependency invariants.
assertNotIncludes(handler, "metadataError.message", "archive insert error message");
assertNotIncludes(handler, "deleteError.message", "delete error message");
assertNotIncludes(handler, "error.message", "generic error message");
assertIncludes(auth, "isAuthorizedAdminRequest", "admin authorization dependency");
assertIncludes(admin, 'import "server-only";', "Supabase admin server boundary");
assertIncludes(handler, "archiveInFlight = archiveOverflowAuditLogs();", "archival invocation");
assertIncludes(handler, "Promise.all", "parallel read loading");

console.log("Audit logs route security static assertions passed.");
