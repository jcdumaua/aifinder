import { readSync, writeSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_VALIDATOR_INPUT_BYTES = 1024 * 1024;
const MAX_JSON_DEPTH = 64;
const EXACT_VALIDATOR_SUCCESS_BYTES = Buffer.from(
  '{"valid":true,"result_class":"VALID"}\n',
  "utf8",
);

const OPERATION_FIELD_NAMES = Object.freeze([
  "git_version_success", "git_version_result_class", "git_version_status", "git_version_timed_out",
  "git_version_output_limit_exceeded", "git_version_signal_present", "git_version_primary_output_present",
  "git_version_diagnostic_output_present", "git_version_primary_output_length", "git_version_diagnostic_output_length",
  "git_branch_success", "git_branch_result_class", "git_branch_status", "git_branch_timed_out",
  "git_branch_output_limit_exceeded", "git_branch_signal_present", "git_branch_primary_output_present",
  "git_branch_diagnostic_output_present", "git_branch_primary_output_length", "git_branch_diagnostic_output_length",
  "git_head_success", "git_head_result_class", "git_head_status", "git_head_timed_out",
  "git_head_output_limit_exceeded", "git_head_signal_present", "git_head_primary_output_present",
  "git_head_diagnostic_output_present", "git_head_primary_output_length", "git_head_diagnostic_output_length",
  "git_status_success", "git_status_result_class", "git_status_status", "git_status_timed_out",
  "git_status_output_limit_exceeded", "git_status_signal_present", "git_status_primary_output_present",
  "git_status_diagnostic_output_present", "git_status_primary_output_length", "git_status_diagnostic_output_length",
]);

const ALLOWED_TOP_LEVEL_FIELDS = Object.freeze([
  "schema_version", "harness_status", "approval_guard_matched", "runtime_validation", "route_invocation",
  "network_call", "live_db_read", "db_mutation", "operational_reactivation_status", "branch_match",
  "expected_baseline_match", "repository_state_class", "tracked_tree_clean", "index_empty", "untracked_count",
  "expected_excluded_set_match", "expected_excluded_hash_match", "git_version_supported", "git_version_class",
  ...OPERATION_FIELD_NAMES,
]);

const REQUIRED_TOP_LEVEL_FIELDS = Object.freeze([
  "schema_version", "harness_status", "approval_guard_matched", "runtime_validation", "route_invocation",
  "network_call", "live_db_read", "db_mutation", "operational_reactivation_status", "branch_match",
  "expected_baseline_match", "repository_state_class", "tracked_tree_clean", "index_empty", "untracked_count",
  "expected_excluded_set_match", "expected_excluded_hash_match", "git_version_supported", "git_version_class",
  ...OPERATION_FIELD_NAMES,
]);

const BOOLEAN_FIELDS = Object.freeze(new Set([
  "approval_guard_matched", "runtime_validation", "route_invocation", "network_call", "live_db_read", "db_mutation",
  "branch_match", "expected_baseline_match", "tracked_tree_clean", "index_empty", "expected_excluded_set_match",
  "expected_excluded_hash_match", "git_version_supported",
  ...OPERATION_FIELD_NAMES.filter((name) => name.endsWith("_success") || name.endsWith("_timed_out")
    || name.endsWith("_output_limit_exceeded") || name.endsWith("_signal_present") || name.endsWith("_output_present")),
]));

const RESULT_CLASSES = Object.freeze(new Set([
  "SUCCESS", "NONZERO_EXIT", "NO_EXIT_STATUS", "SIGNAL_TERMINATION", "TIMEOUT", "OUTPUT_LIMIT_EXCEEDED",
  "SPAWN_ERROR", "OUTPUT_MISSING", "OUTPUT_MALFORMED", "IDENTITY_MISMATCH", "REPOSITORY_STATE_MISMATCH",
  "VERSION_UNSUPPORTED", "VERSION_MALFORMED", "EXECUTABLE_UNAVAILABLE",
]));
const LENGTH_BUCKETS = Object.freeze(new Set([
  "EMPTY", "UP_TO_64_BYTES", "UP_TO_1_KIB", "UP_TO_64_KIB", "UP_TO_1_MIB",
]));
const HARNESS_STATUSES = Object.freeze(new Set(["SKIPPED_BY_DEFAULT", "ABORTED", "FAILED"]));
const REPOSITORY_STATE_CLASSES = Object.freeze(new Set(["UNVERIFIED", "EXPECTED_EXCLUDED_ONLY", "MISMATCH"]));
const VERSION_CLASSES = Object.freeze(new Set(["UNVERIFIED", "SUPPORTED"]));
const NEGATIVE_EXACT_KEYS = Object.freeze(new Set([
  "stdout", "stderr", "message", "stack", "error", "errors", "env", "environment", "token", "secret",
  "password", "credential", "credentials", "authorization", "cookie", "session", "url", "uri", "hostname",
  "host", "path", "filepath", "filename", "request", "response", "body", "headers",
]));

const DEFAULT_GUARD_SKIPPED_PROFILE = Object.freeze({
  schema_version: 1,
  harness_status: "SKIPPED_BY_DEFAULT",
  approval_guard_matched: false,
  runtime_validation: false,
  route_invocation: false,
  network_call: false,
  live_db_read: false,
  db_mutation: false,
  operational_reactivation_status: "BLOCKED",
  branch_match: true,
  expected_baseline_match: true,
  repository_state_class: "EXPECTED_EXCLUDED_ONLY",
  tracked_tree_clean: true,
  index_empty: true,
  untracked_count: 5,
  expected_excluded_set_match: true,
  expected_excluded_hash_match: true,
  git_version_supported: true,
  git_version_class: "SUPPORTED",
  ...Object.fromEntries(["version", "branch", "head", "status"].flatMap((operation) => [
    [`git_${operation}_success`, true],
    [`git_${operation}_result_class`, "SUCCESS"],
    [`git_${operation}_status`, 0],
    [`git_${operation}_timed_out`, false],
    [`git_${operation}_output_limit_exceeded`, false],
    [`git_${operation}_signal_present`, false],
  ])),
});

const SEMANTIC_PROFILES = Object.freeze({
  DEFAULT_GUARD_SKIPPED: DEFAULT_GUARD_SKIPPED_PROFILE,
});

class ValidationFailure extends Error {
  constructor(resultClass) {
    super(resultClass);
    this.name = "ValidationFailure";
    this.resultClass = resultClass;
  }
}

function fail(resultClass) {
  throw new ValidationFailure(resultClass);
}

export function readBoundedInputBytes({
  fd = 0,
  maximumBytes = MAX_VALIDATOR_INPUT_BYTES,
  chunkBytes = 64 * 1024,
  read = readSync,
} = {}) {
  if (!Number.isSafeInteger(fd)
    || fd < 0
    || !Number.isSafeInteger(maximumBytes)
    || maximumBytes < 1
    || !Number.isSafeInteger(chunkBytes)
    || chunkBytes < 1
    || typeof read !== "function") {
    fail("INPUT_READER_INVALID");
  }

  const chunks = [];
  let totalBytes = 0;
  const scratch = Buffer.alloc(Math.min(chunkBytes, maximumBytes + 1));

  while (true) {
    const remainingIncludingSentinel = maximumBytes - totalBytes + 1;
    const requestedBytes = Math.min(scratch.length, remainingIncludingSentinel);
    let bytesRead;
    try {
      bytesRead = read(fd, scratch, 0, requestedBytes, null);
    } catch {
      fail("INPUT_READ_FAILED");
    }
    if (!Number.isSafeInteger(bytesRead) || bytesRead < 0 || bytesRead > requestedBytes) {
      fail("INPUT_READ_FAILED");
    }
    if (bytesRead === 0) break;

    totalBytes += bytesRead;
    if (totalBytes > maximumBytes) fail("INPUT_TOO_LARGE");
    chunks.push(Buffer.from(scratch.subarray(0, bytesRead)));
  }

  return Buffer.concat(chunks, totalBytes);
}

function assertInputBytes(bytes) {
  if (bytes.length === 0) fail("INPUT_EMPTY");
  if (bytes.length > MAX_VALIDATOR_INPUT_BYTES) fail("INPUT_TOO_LARGE");
  if (bytes.includes(0)) fail("INPUT_NUL");
}

function decodeUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("INPUT_NOT_UTF8");
  }
}

function rejectForbiddenControls(text) {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || (code >= 0x7f && code <= 0x9f)) {
      fail("INPUT_CONTROL_CHARACTER");
    }
  }
}

function scanJsonAndRejectDuplicateKeys(text) {
  let cursor = 0;

  function skipWhitespace() {
    while (cursor < text.length && /[\t\n\r ]/.test(text[cursor])) cursor += 1;
  }

  function parseString() {
    const start = cursor;
    if (text[cursor] !== '"') fail("JSON_SYNTAX_INVALID");
    cursor += 1;
    while (cursor < text.length) {
      const character = text[cursor];
      if (character === '"') {
        cursor += 1;
        try {
          return JSON.parse(text.slice(start, cursor));
        } catch {
          fail("JSON_STRING_INVALID");
        }
      }
      if (character === "\\") {
        cursor += 1;
        if (cursor >= text.length || !/["\\/bfnrtu]/.test(text[cursor])) fail("JSON_ESCAPE_INVALID");
        if (text[cursor] === "u") {
          const hex = text.slice(cursor + 1, cursor + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("JSON_ESCAPE_INVALID");
          cursor += 4;
        }
      } else if (character.charCodeAt(0) < 0x20) {
        fail("JSON_STRING_CONTROL_CHARACTER");
      }
      cursor += 1;
    }
    fail("JSON_STRING_UNTERMINATED");
  }

  function parseNumber() {
    const remaining = text.slice(cursor);
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(remaining);
    if (!match) fail("JSON_NUMBER_INVALID");
    cursor += match[0].length;
  }

  function parseValue(depth) {
    if (depth > MAX_JSON_DEPTH) fail("JSON_DEPTH_EXCEEDED");
    skipWhitespace();
    const character = text[cursor];
    if (character === "{") return parseObject(depth + 1);
    if (character === "[") return parseArray(depth + 1);
    if (character === '"') return parseString();
    if (character === "-" || /[0-9]/.test(character ?? "")) return parseNumber();
    for (const literal of ["true", "false", "null"]) {
      if (text.startsWith(literal, cursor)) {
        cursor += literal.length;
        return;
      }
    }
    fail("JSON_VALUE_INVALID");
  }

  function parseObject(depth) {
    const keys = new Set();
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === "}") {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      skipWhitespace();
      const key = parseString();
      if (keys.has(key)) fail("JSON_DUPLICATE_KEY");
      keys.add(key);
      skipWhitespace();
      if (text[cursor] !== ":") fail("JSON_OBJECT_COLON_MISSING");
      cursor += 1;
      parseValue(depth);
      skipWhitespace();
      if (text[cursor] === "}") {
        cursor += 1;
        return;
      }
      if (text[cursor] !== ",") fail("JSON_OBJECT_SEPARATOR_INVALID");
      cursor += 1;
    }
    fail("JSON_OBJECT_UNTERMINATED");
  }

  function parseArray(depth) {
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === "]") {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      parseValue(depth);
      skipWhitespace();
      if (text[cursor] === "]") {
        cursor += 1;
        return;
      }
      if (text[cursor] !== ",") fail("JSON_ARRAY_SEPARATOR_INVALID");
      cursor += 1;
    }
    fail("JSON_ARRAY_UNTERMINATED");
  }

  parseValue(0);
  skipWhitespace();
  if (cursor !== text.length) fail("JSON_TRAILING_CONTENT");
}

function normalizeKeySegments(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function rejectNegativeKeys(key) {
  const normalized = key.toLowerCase();
  const segments = normalizeKeySegments(key);
  if (NEGATIVE_EXACT_KEYS.has(normalized)) fail("FIELD_NAME_FORBIDDEN");
  if (segments.some((segment) => NEGATIVE_EXACT_KEYS.has(segment))) {
    fail("FIELD_NAME_FORBIDDEN");
  }
}

function rejectUnsafeString(value) {
  if (value.includes("://") || /[\r\n\u0000-\u001f]/.test(value)) fail("STRING_VALUE_FORBIDDEN");
  if (/^(?:\/|~\/|[A-Za-z]:[\\/])/.test(value)) fail("STRING_VALUE_FORBIDDEN");
  if (/^(?:Bearer\s+|gh[pousr]_|sk-|eyJ[A-Za-z0-9_-]*\.)/.test(value)) fail("STRING_VALUE_FORBIDDEN");
}

function validateField(key, value) {
  rejectNegativeKeys(key);
  if (!ALLOWED_TOP_LEVEL_FIELDS.includes(key)) fail("UNKNOWN_FIELD");
  if (Array.isArray(value) || (value !== null && typeof value === "object")) fail("NESTED_VALUE_FORBIDDEN");
  if (BOOLEAN_FIELDS.has(key)) {
    if (typeof value !== "boolean") fail("FIELD_TYPE_INVALID");
    return;
  }
  if (key === "schema_version") {
    if (value !== 1) fail("SCHEMA_VERSION_INVALID");
    return;
  }
  if (key === "untracked_count") {
    if (!Number.isSafeInteger(value) || value < 0 || value > 100) fail("INTEGER_RANGE_INVALID");
    return;
  }
  if (key === "harness_status") {
    if (!HARNESS_STATUSES.has(value)) fail("ENUM_INVALID");
    return;
  }
  if (key === "operational_reactivation_status") {
    if (value !== "BLOCKED") fail("ENUM_INVALID");
    return;
  }
  if (key === "repository_state_class") {
    if (!REPOSITORY_STATE_CLASSES.has(value)) fail("ENUM_INVALID");
    return;
  }
  if (key === "git_version_class") {
    if (!VERSION_CLASSES.has(value)) fail("ENUM_INVALID");
    return;
  }
  if (key.endsWith("_status")) {
    if (!Number.isSafeInteger(value) || value < -1 || value > 255) fail("STATUS_RANGE_INVALID");
    return;
  }
  if (key.endsWith("_result_class")) {
    if (!RESULT_CLASSES.has(value)) fail("ENUM_INVALID");
    return;
  }
  if (key.endsWith("_output_length")) {
    if (!LENGTH_BUCKETS.has(value)) fail("ENUM_INVALID");
    return;
  }
  if (typeof value === "string") rejectUnsafeString(value);
  else fail("FIELD_TYPE_INVALID");
}

export function validateBoundedEvidenceBytes(bytes) {
  assertInputBytes(bytes);
  const text = decodeUtf8(bytes);
  rejectForbiddenControls(text);
  scanJsonAndRejectDuplicateKeys(text);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail("JSON_SYNTAX_INVALID");
  }
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object" || Object.getPrototypeOf(parsed) !== Object.prototype) {
    fail("ROOT_OBJECT_REQUIRED");
  }
  for (const requiredField of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!Object.hasOwn(parsed, requiredField)) fail("REQUIRED_FIELD_MISSING");
  }
  for (const [key, value] of Object.entries(parsed)) validateField(key, value);
  return Object.freeze({ valid: true, result_class: "VALID" });
}

function validatePresenceAndLength(present, lengthClass) {
  if (typeof present !== "boolean" || !LENGTH_BUCKETS.has(lengthClass)) {
    fail("PROFILE_MISMATCH");
  }
  if (present === false && lengthClass !== "EMPTY") fail("PROFILE_MISMATCH");
  if (present === true && lengthClass === "EMPTY") fail("PROFILE_MISMATCH");
}

function validateSuccessfulGitOperation(operation, evidence) {
  const prefix = `git_${operation}`;
  for (const [suffix, expectedValue] of [
    ["success", true],
    ["result_class", "SUCCESS"],
    ["status", 0],
    ["timed_out", false],
    ["output_limit_exceeded", false],
    ["signal_present", false],
    ["diagnostic_output_present", false],
    ["diagnostic_output_length", "EMPTY"],
  ]) {
    if (evidence[`${prefix}_${suffix}`] !== expectedValue) fail("PROFILE_MISMATCH");
  }

  const primaryOutputPresent = evidence[`${prefix}_primary_output_present`];
  const primaryOutputLength = evidence[`${prefix}_primary_output_length`];
  const diagnosticOutputPresent = evidence[`${prefix}_diagnostic_output_present`];
  const diagnosticOutputLength = evidence[`${prefix}_diagnostic_output_length`];
  validatePresenceAndLength(primaryOutputPresent, primaryOutputLength);
  validatePresenceAndLength(diagnosticOutputPresent, diagnosticOutputLength);
  if (operation !== "status" && primaryOutputPresent !== true) fail("PROFILE_MISMATCH");
}

export function validateSemanticProfile(profileName, evidence) {
  if (!Object.hasOwn(SEMANTIC_PROFILES, profileName)) fail("PROFILE_UNKNOWN");
  if (evidence === null
    || Array.isArray(evidence)
    || typeof evidence !== "object"
    || Object.getPrototypeOf(evidence) !== Object.prototype) {
    fail("PROFILE_MISMATCH");
  }
  for (const [key, expectedValue] of Object.entries(SEMANTIC_PROFILES[profileName])) {
    if (!Object.hasOwn(evidence, key) || evidence[key] !== expectedValue) fail("PROFILE_MISMATCH");
  }
  for (const operation of ["version", "branch", "head", "status"]) {
    validateSuccessfulGitOperation(operation, evidence);
  }
  return Object.freeze({ valid: true, result_class: "VALID" });
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  let result = Object.freeze({ valid: false, result_class: "VALIDATION_REJECTED" });
  try {
    if (process.argv.length !== 3) fail("ARGUMENT_COUNT_INVALID");
    const bytes = readBoundedInputBytes();
    result = validateBoundedEvidenceBytes(bytes);
    const evidence = JSON.parse(decodeUtf8(bytes));
    validateSemanticProfile(process.argv[2], evidence);
  } catch (error) {
    result = Object.freeze({
      valid: false,
      result_class: error instanceof ValidationFailure ? error.resultClass : "VALIDATION_REJECTED",
    });
  }
  const resultBytes = result.valid
    ? EXACT_VALIDATOR_SUCCESS_BYTES
    : Buffer.from(`${JSON.stringify(result)}\n`, "utf8");
  writeSync(1, resultBytes);
  process.exitCode = result.valid ? 0 : 1;
}
