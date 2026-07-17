import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = "app/api/submit-tool/route.ts";
const validationPath = "lib/tool-validation.ts";

const route = readFileSync(routePath, "utf8");
const validation = readFileSync(validationPath, "utf8");

function assertIncludes(source, marker, label) {
  assert.ok(
    source.includes(marker),
    `${label} missing marker: ${marker}`,
  );
}

function assertNotIncludes(source, marker, label) {
  assert.ok(
    !source.includes(marker),
    `${label} forbidden marker present: ${marker}`,
  );
}

function assertRegex(source, pattern, label) {
  assert.ok(
    pattern.test(source),
    `${label} missing required pattern: ${pattern}`,
  );
}

function assertNoRegex(source, pattern, label) {
  assert.ok(
    !pattern.test(source),
    `${label} contains forbidden pattern: ${pattern}`,
  );
}

// Server isolation and public route shape.
assertIncludes(route, 'import "server-only";', "submit-tool route");
assertNotIncludes(route, '"use client"', "submit-tool route");
assertNotIncludes(route, "'use client'", "submit-tool route");
assertRegex(
  route,
  /export\s+async\s+function\s+POST\s*\(/,
  "submit-tool route POST handler",
);

// Privileged-client containment.
assertIncludes(
  route,
  "process.env.SUPABASE_SERVICE_ROLE_KEY",
  "submit-tool route privileged key reference",
);
assertIncludes(
  route,
  "process.env.NEXT_PUBLIC_SUPABASE_URL",
  "submit-tool route Supabase URL reference",
);
assertIncludes(route, "createClient(", "submit-tool route client creation");
assertIncludes(
  route,
  "persistSession: false",
  "submit-tool route session persistence boundary",
);
assertRegex(
  route,
  /\.from\(["']submitted_tools["']\)\.insert\s*\(/s,
  "submit-tool route submitted-tools mutation",
);

// Secret-safe logging.
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?\b(?:error|toolsError|submissionsError)\.message\b/s,
  "submit-tool route database error logging",
);
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?\b(?:error|toolsError|submissionsError)\b(?!\s*["'])/s,
  "submit-tool route raw error-object logging",
);
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?(?:SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL|supabaseServiceRoleKey|supabaseUrl)/s,
  "submit-tool route secret or configuration logging",
);
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?(?:submitterEmail|submitterName|safeWebsite|safeLogoUrl|description|name)/s,
  "submit-tool route submitted-field logging",
);
assertNoRegex(
  route,
  /console\.(?:log|warn|error|info)\s*\([^;]*?\b(?:stack|cause)\b/s,
  "submit-tool route stack or cause logging",
);

// Public error boundary.
assertIncludes(
  route,
  '"Submission failed. Please try again."',
  "submit-tool route generic unexpected-error response",
);
assertNoRegex(
  route,
  /error\s*:\s*error\s+instanceof\s+Error\s*\?\s*error\.message/s,
  "submit-tool route raw unexpected error response",
);
assertNoRegex(
  route,
  /\berror\s*:\s*(?:error|toolsError|submissionsError)\b/s,
  "submit-tool route raw error-object response",
);
assertNoRegex(
  route,
  /\b(?:stack|cause)\s*:/,
  "submit-tool route stack or cause response",
);
assertIncludes(
  route,
  '"Server configuration error. Submission is temporarily unavailable."',
  "submit-tool route generic configuration response",
);
assertIncludes(
  route,
  '"Unable to save submission. Please try again later."',
  "submit-tool route generic database response",
);

// Existing safeguards that must remain intact.
assertIncludes(route, "RATE_LIMIT_MAX_SUBMISSIONS", "submit-tool route rate limit");
assertIncludes(route, "checkRateLimit", "submit-tool route rate limit");
assertIncludes(route, "MAX_BODY_SIZE_BYTES", "submit-tool route body-size limit");
assertIncludes(route, "application/json", "submit-tool route content-type check");
assertIncludes(route, "companyWebsite", "submit-tool route honeypot");
assertIncludes(route, '"Cache-Control": "no-store"', "submit-tool route no-store");
assertIncludes(
  route,
  '"X-Content-Type-Options": "nosniff"',
  "submit-tool route nosniff",
);
assertIncludes(
  route,
  '.from("tools")',
  "submit-tool route duplicate tools check",
);
assertIncludes(
  route,
  '.from("submitted_tools")',
  "submit-tool route submitted-tools access",
);

// Validation dependency safeguards.
assertIncludes(
  validation,
  "CONTROL_CHARACTER_PATTERN",
  "tool validation control-character protection",
);
assertIncludes(
  validation,
  "SUSPICIOUS_TEXT_PATTERNS",
  "tool validation unsafe-content protection",
);
assertIncludes(
  validation,
  'url.protocol !== "https:"',
  "tool validation HTTPS-only protection",
);
assertIncludes(
  validation,
  "isBlockedHostname",
  "tool validation private-host protection",
);
assertIncludes(
  validation,
  "BLOCKED_FILE_EXTENSIONS",
  "tool validation direct-download protection",
);
assertIncludes(
  validation,
  "validateOptionalEmail",
  "tool validation optional-email protection",
);

console.log("Submit-tool secret-safe boundary static assertions passed.");
