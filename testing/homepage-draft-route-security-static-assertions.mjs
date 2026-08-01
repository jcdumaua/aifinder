import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = "app/api/admin/homepage-control/drafts/[id]/route.ts";
const authPath = "lib/admin-auth.ts";
const adminPath = "lib/homepage-control-admin.ts";
const bodySafetyPath = "lib/public-live-route-safety.ts";

const route = readFileSync(routePath, "utf8");
const auth = readFileSync(authPath, "utf8");
const admin = readFileSync(adminPath, "utf8");
const bodySafety = readFileSync(bodySafetyPath, "utf8");

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
assertIncludes(route, 'import "server-only";', "homepage draft route");
assertNotIncludes(route, '"use client"', "homepage draft route");
assertNotIncludes(route, "'use client'", "homepage draft route");
assertIncludes(route, 'export const runtime = "nodejs";', "homepage draft route");
assertIncludes(route, 'export const dynamic = "force-dynamic";', "homepage draft route");
assertRegex(route, /export\s+async\s+function\s+PATCH\s*\(/, "homepage draft route PATCH");

// Authorization and ordering.
assertIncludes(route, "verifyAdminSession", "homepage draft route admin session");
assertIncludes(route, "verifyAdminCsrfRequest", "homepage draft route CSRF");
assertIncludes(route, "updateHomepageControlDraft", "homepage draft route mutation helper");
assert.ok(
  route.indexOf("verifyAdminSession") < route.indexOf("updateHomepageControlDraft"),
  "admin session verification must precede mutation",
);
assert.ok(
  route.indexOf("verifyAdminCsrfRequest") < route.indexOf("updateHomepageControlDraft"),
  "CSRF verification must precede mutation",
);

// Fixed categorical logging only.
assertIncludes(
  route,
  'console.warn("homepage_draft_update_unauthorized")',
  "homepage draft unauthorized log",
);
assertIncludes(
  route,
  'console.error("homepage_draft_update_failed")',
  "homepage draft failed log",
);
assertIncludes(
  route,
  'console.error("homepage_draft_update_unexpected_failure")',
  "homepage draft unexpected log",
);
assertNotIncludes(route, "adminSession.errors", "homepage draft session diagnostics");
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?(?:result\.errors|result\.warnings|error\.message|stack|cause|request|body|actor|adminSession\.actor|id\b)/s,
  "homepage draft raw logging",
);

// Request validation and public error boundary.
assertIncludes(route, "UUID_PATTERN", "homepage draft UUID validation");
assertIncludes(route, "MAX_BODY_SIZE_BYTES", "homepage draft body size limit");
assertIncludes(route, "application/json", "homepage draft content type");
assertIncludes(
  route,
  "readBoundedRequestBody",
  "homepage draft actual-byte body reader",
);
assertIncludes(
  route,
  "parseBoundedJsonBody",
  "homepage draft bounded JSON parser",
);
assertIncludes(
  route,
  "PublicLiveRouteSafetyError",
  "homepage draft bounded body error boundary",
);
assertNoRegex(
  route,
  /\brequest\.json\s*\(/,
  "homepage draft unbounded JSON reader",
);
assertNoRegex(
  route,
  /Number\s*\(\s*contentLengthHeader/,
  "homepage draft header-only size check",
);
assertIncludes(route, '"Cache-Control": "no-store"', "homepage draft no-store");
assertIncludes(
  route,
  '"X-Content-Type-Options": "nosniff"',
  "homepage draft nosniff",
);
assertNoRegex(
  route,
  /error\s+instanceof\s+Error\s*\?\s*error\.message/s,
  "homepage draft dynamic request error response",
);
assertNoRegex(
  route,
  /\b(?:stack|cause)\s*:/,
  "homepage draft stack or cause response",
);
assertNoRegex(
  route,
  /\berrors\s*:\s*result\.errors\b/s,
  "homepage draft raw dependency errors response",
);
assertNoRegex(
  route,
  /\bwarnings\s*:\s*result\.warnings\b/s,
  "homepage draft raw dependency warnings response",
);

// Generic operational boundary.
assertIncludes(
  route,
  '"Unable to save Homepage Control Room draft."',
  "homepage draft generic failure response",
);
assertNoRegex(
  route,
  /hasOperationalError\s*\(/,
  "homepage draft string-prefix operational classification",
);

// Existing response/status safeguards.
assertIncludes(route, 'errors: ["Unauthorized"]', "homepage draft 401 response");
assertIncludes(route, "401", "homepage draft unauthorized status");
assertIncludes(route, "403", "homepage draft CSRF status");
assertIncludes(route, "404", "homepage draft malformed ID status");
assertIncludes(route, "success: true", "homepage draft success response");
assertIncludes(route, "data: result.draft", "homepage draft success data");

// Dependency invariants.
assertIncludes(auth, "process.env.ADMIN_SESSION_SECRET", "admin auth environment boundary");
assertIncludes(auth, "timingSafeEqual", "admin auth timing-safe comparison");
assertIncludes(auth, "x-csrf-token", "admin auth CSRF header");
assertIncludes(auth, "ADMIN_CSRF_COOKIE_NAME", "admin auth CSRF cookie");
assertIncludes(admin, '"use server";', "homepage control admin server scope");
assertIncludes(
  admin,
  'import "server-only";',
  "homepage control admin server-only boundary",
);
assertNoRegex(
  admin,
  /^import\s+\{\s*supabaseAdmin\s*\}\s+from\s+["']\.\/supabase-admin["'];/m,
  "homepage control admin eager privileged client",
);
assertRegex(
  admin,
  /await\s+import\s*\(\s*["']\.\/supabase-admin["']\s*\)/,
  "homepage control admin lazy privileged client",
);
assertIncludes(
  admin,
  "updateHomepageControlDraftWithDependencies",
  "homepage control admin fabricated dependency seam",
);
assertIncludes(
  admin,
  '.eq("version", current.version)',
  "homepage control draft optimistic concurrency predicate",
);
assertIncludes(
  admin,
  '.eq("version", nextVersion)',
  "homepage control draft compensation version predicate",
);
assertIncludes(
  admin,
  '.maybeSingle()',
  "homepage control draft checkable affected-row result",
);
assertIncludes(
  bodySafety,
  "actualByteLength += chunk.byteLength",
  "shared request body actual-byte accounting",
);
assertIncludes(
  bodySafety,
  'throw new PublicLiveRouteSafetyError("content_length_understated")',
  "shared request body understated-length rejection",
);
assertIncludes(
  bodySafety,
  'throw new PublicLiveRouteSafetyError("content_length_overstated")',
  "shared request body overstated-length rejection",
);

console.log("Homepage draft route security static assertions passed.");
