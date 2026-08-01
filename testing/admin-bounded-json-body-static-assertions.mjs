#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const DEFAULT_SOURCE_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(DEFAULT_SOURCE_ROOT);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error("usage: admin-bounded-json-body-static-assertions.mjs [--source-root <dir>]");
  }
  return realpathSync(path.resolve(argv[1]));
}

const SOURCE_ROOT = parseSourceRoot(process.argv.slice(2));
const failures = new Map();

const JSON_HANDLER_PATHS = [
  "app/api/admin/submissions/handler.ts",
  "app/api/admin/tools/handler.ts",
];
const UPLOAD_HANDLER_PATH = "app/api/admin/upload-logo/handler.ts";
const AUDIT_HANDLER_PATH = "app/api/admin/audit-logs/handler.ts";
const RATE_LIMIT_PATH = "lib/admin-rate-limit.ts";
const SAFETY_PATH = "lib/public-live-route-safety.ts";

function isContained(candidate) {
  return candidate === SOURCE_ROOT || candidate.startsWith(`${SOURCE_ROOT}${path.sep}`);
}

function containedPath(relativePath) {
  const candidate = path.resolve(SOURCE_ROOT, relativePath);
  if (!isContained(candidate)) throw new Error(`source path escapes source root: ${relativePath}`);
  return candidate;
}

function readExisting(relativePath) {
  const candidate = containedPath(relativePath);
  if (!existsSync(candidate)) return null;
  const resolved = realpathSync(candidate);
  if (!isContained(resolved)) throw new Error(`source path escapes source root: ${relativePath}`);
  return readFileSync(resolved, "utf8");
}

function fail(domain, reason) {
  if (!failures.has(domain)) failures.set(domain, reason);
}

function expect(domain, condition, reason) {
  if (!condition) fail(domain, reason);
}

function position(text, candidates) {
  return candidates
    .map((candidate) => text.indexOf(candidate))
    .filter((value) => value >= 0)
    .sort((left, right) => left - right)[0] ?? -1;
}

function functionBlock(text, name) {
  const marker = `function ${name}(`;
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const bodyStart = text.indexOf("{", start + marker.length);
  if (bodyStart < 0) return "";
  let depth = 0;
  for (let index = bodyStart; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") depth -= 1;
    if (depth === 0) return text.slice(start, index + 1);
  }
  return "";
}

function authBeforeRate(relativePath, { csrfRequired }) {
  const text = readExisting(relativePath);
  if (text === null) {
    fail("AUTH_BEFORE_RATE_KEY_ALLOCATION", `${relativePath} injectable handler seam is absent`);
    return;
  }

  const securityText =
    functionBlock(text, "requireAdminSecurity") || functionBlock(text, "requireSecurity");
  const auth = position(securityText, ["verifySession(", "verifyAdminSession("]);
  const csrf = position(securityText, ["verifyCsrf(", "verifyAdminCsrfRequest("]);
  const rate = position(securityText, ["checkRateLimit(", "checkAdminRateLimit("]);
  const capability = position(securityText, [".from(", ".rpc(", ".storage", "readBoundedRequestBody("]);

  expect(
    "AUTH_BEFORE_RATE_KEY_ALLOCATION",
    auth >= 0 &&
      rate > auth &&
      (!csrfRequired || (csrf > auth && rate > csrf)) &&
      (capability < 0 || rate < capability),
    `${relativePath} does not authenticate${csrfRequired ? ", verify CSRF," : ""} then allocate rate before downstream capability`,
  );

  expect(
    "AUTH_BEFORE_RATE_KEY_ALLOCATION",
    !/(x-forwarded-for|x-real-ip)[\s\S]{0,300}(new Map|\.set\s*\()/iu.test(text) &&
      !/const\s+\w*rate\w*Map\s*=\s*new\s+Map/iu.test(text),
    `${relativePath} retains an attacker-keyed local rate map`,
  );
}

for (const relativePath of JSON_HANDLER_PATHS) {
  const text = readExisting(relativePath);
  if (text === null) {
    fail("ADMIN_JSON_ACTUAL_BYTE_LIMIT", `${relativePath} bounded JSON handler seam is absent`);
    continue;
  }

  expect(
    "ADMIN_JSON_ACTUAL_BYTE_LIMIT",
    text.includes("readBoundedRequestBody") &&
      text.includes("parseBoundedJsonBody") &&
      text.includes("20 * 1024") &&
      !/request\.json\s*\(/u.test(text) &&
      !/Number\s*\(\s*contentLengthHeader\s*\)/u.test(text),
    `${relativePath} does not enforce the 20 KiB limit against actual bytes`,
  );

  expect(
    "ADMIN_JSON_ACTUAL_BYTE_LIMIT",
    [
      "Invalid request format.",
      "Request is too large.",
      "Invalid request body.",
    ].every((message) => text.includes(message)) &&
      !/jsonResponse\s*\([^;]{0,300}(?:error\.message|error\?\.message|error\.stack|error\.cause)/su.test(text) &&
      !/console\.[a-z]+\s*\([^)]*(?:error\.message|error\?\.message|error\.stack|error\.cause)/su.test(text),
    `${relativePath} lacks fixed categorical body failures or exposes diagnostics`,
  );
}

const upload = readExisting(UPLOAD_HANDLER_PATH);
if (upload === null) {
  fail("ADMIN_MULTIPART_ACTUAL_BYTE_LIMIT", `${UPLOAD_HANDLER_PATH} bounded multipart handler seam is absent`);
} else {
  expect(
    "ADMIN_MULTIPART_ACTUAL_BYTE_LIMIT",
    upload.includes("readBoundedRequestBody") &&
      upload.includes("parseBoundedFormData") &&
      upload.includes("3 * 1024 * 1024") &&
      !/request\.formData\s*\(/u.test(upload) &&
      !/Number\s*\(\s*contentLengthHeader\s*\)/u.test(upload),
    "upload handler does not enforce the multipart request ceiling against actual bytes",
  );

  expect(
    "ADMIN_MULTIPART_ACTUAL_BYTE_LIMIT",
    upload.includes("Invalid upload format.") &&
      upload.includes("Upload is too large. Logo file must be under 2MB.") &&
      upload.includes("Logo upload failed. Please try again.") &&
      !/(error\.message|error\?\.message|error\.stack|error\.cause)/u.test(upload),
    "upload actual-byte failures are not fixed and diagnostic-free",
  );
}

for (const relativePath of JSON_HANDLER_PATHS) {
  authBeforeRate(relativePath, { csrfRequired: true });
}
authBeforeRate(UPLOAD_HANDLER_PATH, { csrfRequired: true });
authBeforeRate(AUDIT_HANDLER_PATH, { csrfRequired: false });

const rateLimit = readExisting(RATE_LIMIT_PATH) || "";
expect(
  "RATE_MAP_PRUNING_AND_CARDINALITY",
  /const\s+MAX_ADMIN_RATE_LIMIT_BUCKETS\s*=\s*\d+/u.test(rateLimit) &&
    rateLimit.includes("pruneExpiredBuckets") &&
    /adminRateLimitBuckets\.size\s*>=\s*MAX_ADMIN_RATE_LIMIT_BUCKETS/u.test(rateLimit) &&
    /adminRateLimitBuckets\.delete\s*\(/u.test(rateLimit),
  "central admin rate map lacks deterministic pruning and a fixed cardinality ceiling",
);

expect(
  "RATE_MAP_PRUNING_AND_CARDINALITY",
  /actor\?\.id|actor\.id/u.test(rateLimit) &&
    /actor\?\.label|actor\.label/u.test(rateLimit) &&
    position(rateLimit, ["if (!actor", "if (actor == null", "if (!actorIdentifier"]) >= 0 &&
    position(rateLimit, ["if (!actor", "if (actor == null", "if (!actorIdentifier"]) <
      rateLimit.indexOf("adminRateLimitBuckets.set("),
  "central admin rate allocation is not bound to an authenticated actor",
);

const safety = readExisting(SAFETY_PATH) || "";
expect(
  "ADMIN_JSON_ACTUAL_BYTE_LIMIT",
  safety.includes("content_length_understated") &&
    safety.includes("content_length_overstated") &&
    safety.includes("request_body_aborted") &&
    safety.includes("request_body_too_large") &&
    safety.includes("actualByteLength > maximumByteLength"),
  "shared bounded-body reader no longer distinguishes actual-byte terminal conditions",
);

for (const domain of [
  "ADMIN_JSON_ACTUAL_BYTE_LIMIT",
  "ADMIN_MULTIPART_ACTUAL_BYTE_LIMIT",
  "AUTH_BEFORE_RATE_KEY_ALLOCATION",
  "RATE_MAP_PRUNING_AND_CARDINALITY",
]) {
  if (failures.has(domain)) process.stderr.write(`${domain} ${failures.get(domain)}\n`);
}

if (failures.size > 0) {
  process.stderr.write(
    `RED_ADMIN_BOUNDED_INPUT domains=${failures.size}/4 expected=4 no_missing_module_errors=true\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write("PASS_ADMIN_BOUNDED_JSON_MULTIPART_AND_RATE domains=4/4\n");
}
