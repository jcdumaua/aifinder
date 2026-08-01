#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const defaultSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(defaultSourceRoot);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error("usage: discovery-admin-read-and-mixed-collections-security.test.mjs [--source-root <dir>]");
  }
  return realpathSync(path.resolve(argv[1]));
}

const sourceRoot = parseSourceRoot(process.argv.slice(2));

function containedSourcePath(relativePath) {
  const candidate = realpathSync(path.resolve(sourceRoot, relativePath));
  const relative = path.relative(sourceRoot, candidate);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`source path escapes --source-root: ${relativePath}`);
  }
  return candidate;
}

const paths = {
  preview: "app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts",
  readOnlyAuth: "lib/admin-auth-read-only.ts",
  detail: "app/api/admin/discovery/discovered-tools/[id]/route.ts",
  runs: "app/api/admin/discovery/runs/route.ts",
  manual: "app/api/admin/discovery/runs/manual/route.ts",
  claim: "app/api/admin/discovery/runs/manual/claim/route.ts",
  sources: "app/api/admin/discovery/sources/route.ts",
  source: "app/api/admin/discovery/sources/[id]/route.ts",
  readModel: "lib/discovery/discovery-candidate-staging-queue-read-model.ts",
  cursor: "lib/discovery/discovery-candidate-staging-queue-cursor.ts",
};

const source = Object.fromEntries(
  Object.entries(paths).map(([name, relativePath]) => [
    name,
    readFileSync(containedSourcePath(relativePath), "utf8"),
  ]),
);

const failures = [];

function requireContract(domain, condition, reason) {
  if (!condition) failures.push(`${domain}: ${reason}`);
}

function section(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = end ? text.indexOf(end, Math.max(0, startIndex + start.length)) : -1;

  if (startIndex < 0) return "";
  return text.slice(startIndex, endIndex < 0 ? text.length : endIndex);
}

function containsAny(text, values) {
  return values.some((value) => text.includes(value));
}

function inspectMapper(text, functionName) {
  const sourceFile = ts.createSourceFile(
    `${functionName}.ts`,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declaration = sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === functionName,
  );
  const statements = declaration?.body?.statements || [];
  const objectReturns = statements.filter(
    (statement) =>
      ts.isReturnStatement(statement) &&
      statement.expression &&
      ts.isObjectLiteralExpression(statement.expression),
  );
  const unsafeDirectReturns = statements.filter(
    (statement) =>
      ts.isReturnStatement(statement) &&
      statement.expression &&
      statement.expression.kind !== ts.SyntaxKind.NullKeyword &&
      !ts.isObjectLiteralExpression(statement.expression),
  );
  const objectLiteral = objectReturns[0]?.expression;
  const properties = objectLiteral?.properties || [];
  const expressions = new Map();
  let hasSpread = false;

  for (const property of properties) {
    if (ts.isSpreadAssignment(property)) {
      hasSpread = true;
      continue;
    }
    if (!ts.isPropertyAssignment(property)) continue;
    const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
      ? property.name.text
      : property.name.getText(sourceFile);
    expressions.set(key, property.initializer.getText(sourceFile));
  }

  return {
    found: Boolean(declaration?.body),
    body: declaration?.body?.getText(sourceFile) || "",
    keys: [...expressions.keys()],
    expressions,
    hasSpread,
    objectReturnCount: objectReturns.length,
    unsafeDirectReturnCount: unsafeDirectReturns.length,
  };
}

function hasExactKeys(contract, expectedKeys) {
  return contract.keys.length === expectedKeys.length &&
    [...contract.keys].sort().join("\n") === [...expectedKeys].sort().join("\n");
}

function hasClosedObjectReturn(contract, expectedKeys) {
  return contract.found &&
    contract.objectReturnCount === 1 &&
    contract.unsafeDirectReturnCount === 0 &&
    !contract.hasSpread &&
    hasExactKeys(contract, expectedKeys);
}

const detailGet = section(source.detail, "export async function GET", "const PATCHABLE_DISCOVERY_STATUSES");
const runsGet = section(source.runs, "export async function GET");
const sourcesGet = section(source.sources, "export async function GET", "export async function POST");
const sourceSuccess = section(source.source, "const auditMetadata", "}");

const safeDetailKeys = [
  "tool",
  "source",
  "run",
  "evidence",
  "duplicateCandidates",
  "auditEvents",
];
const safeRunKeys = [
  "id",
  "source_id",
  "status",
  "started_at",
  "finished_at",
  "created_at",
  "updated_at",
];
const safeSourceKeys = [
  "id",
  "name",
  "slug",
  "description",
  "url",
  "source_type",
  "is_active",
  "last_run_at",
  "created_at",
  "updated_at",
];
const privateFieldNames = [
  "raw_payload",
  "extracted_json",
  "storage_path",
  "stats",
  "error_log",
  "config",
];

requireContract(
  "CANDIDATE_PREVIEW_CANONICAL_COOKIE",
  source.preview.includes("verifyAdminSession") &&
    source.readOnlyAuth.includes('from "./admin-auth"') &&
    source.readOnlyAuth.includes("verifyAdminSession") &&
    !source.readOnlyAuth.includes("decodeBase64UrlJson") &&
    !source.readOnlyAuth.includes("splitSignedSession"),
  "candidate preview must consume the canonical admin:<expiresAt>.<HMAC> session verifier",
);

requireContract(
  "DISCOVERY_DETAIL_RAW_FIELD_EXCLUSION",
  detailGet.includes("toSafeDiscoveredToolDetailResponse") &&
    !detailGet.includes('.select("*")') &&
    !containsAny(detailGet, ["...tool", "...run", "raw_payload", "extracted_json", "storage_path"]),
  "detail GET must project and map an explicit public response instead of forwarding broad rows",
);

requireContract(
  "DISCOVERY_DETAIL_RAW_FIELD_EXCLUSION",
  !containsAny(detailGet, ["metadata, created_at", "stats, error_log"]),
  "detail GET must not return arbitrary audit metadata or raw run stats/error logs",
);

const detailMapper = inspectMapper(
  source.detail,
  "toSafeDiscoveredToolDetailResponse",
);
const detailPicker = section(
  source.detail,
  "function pickSafeFields",
  "const SAFE_TOOL_FIELDS",
);
const detailExpressionContracts = new Map([
  ["tool", ["input.tool", "SAFE_TOOL_FIELDS"]],
  ["source", ["input.source", "SAFE_SOURCE_FIELDS"]],
  ["run", ["input.run", "SAFE_RUN_FIELDS"]],
  ["evidence", ["input.evidence.map", "SAFE_EVIDENCE_FIELDS"]],
  ["duplicateCandidates", ["input.duplicateCandidates.map", "SAFE_DUPLICATE_FIELDS"]],
  ["auditEvents", ["input.auditEvents.map", "SAFE_AUDIT_FIELDS"]],
]);

requireContract(
  "DISCOVERY_DETAIL_RAW_FIELD_EXCLUSION",
  hasClosedObjectReturn(detailMapper, safeDetailKeys) &&
    [...detailExpressionContracts].every(([key, markers]) => {
      const expression = detailMapper.expressions.get(key) || "";
      return expression.includes("pickSafeFields") &&
        markers.every((marker) => expression.includes(marker));
    }) &&
    detailPicker.includes("Object.fromEntries") &&
    detailPicker.includes("fields.filter") &&
    detailPicker.includes("Object.hasOwn(record, field)") &&
    detailPicker.includes("[field, record[field]]") &&
    !containsAny(detailMapper.body, privateFieldNames),
  "detail response mapper must return only the six approved safe-field projections",
);

requireContract(
  "DISCOVERY_RUN_RAW_STATS_ERROR_EXCLUSION",
  runsGet.includes("toSafeDiscoveryRunResponse") &&
    !containsAny(runsGet, ['"stats"', '"error_log"', "...run"]),
  "run collection responses must be constructed from an exact safe allowlist",
);

for (const [name, text] of [["manual", source.manual], ["claim", source.claim]]) {
  requireContract(
    "DISCOVERY_RUN_RAW_STATS_ERROR_EXCLUSION",
    text.includes("toSafeDiscoveryRunResponse") &&
      !/data\s*:\s*\{[\s\S]{0,160}run\s*:\s*(?:discoveryRunRecord|completedRun|claimedRun)/u.test(text),
    `${name} mutation responses must reuse the safe run response mapper`,
  );
}

for (const [name, text] of [
  ["runs", source.runs],
  ["manual", source.manual],
  ["claim", source.claim],
]) {
  const mapper = inspectMapper(text, "toSafeDiscoveryRunResponse");
  requireContract(
    "DISCOVERY_RUN_RAW_STATS_ERROR_EXCLUSION",
    hasClosedObjectReturn(mapper, safeRunKeys) &&
      safeRunKeys.every((key) =>
        (mapper.expressions.get(key) || "").includes(`run.${key}`)) &&
      !containsAny(mapper.body, privateFieldNames),
    `${name} run mapper must return exactly the approved seven-key allowlist without pass-through`,
  );
}

requireContract(
  "DISCOVERY_SOURCE_CONFIG_EXCLUSION",
  sourcesGet.includes("toSafeDiscoverySourceResponse") &&
    !containsAny(sourcesGet, ['"config"', "...source"]),
  "source collection GET must omit arbitrary config from both projection and response",
);

for (const [name, text] of [
  ["sources", source.sources],
  ["source", source.source],
]) {
  const mapper = inspectMapper(text, "toSafeDiscoverySourceResponse");
  requireContract(
    "DISCOVERY_SOURCE_CONFIG_EXCLUSION",
    hasClosedObjectReturn(mapper, safeSourceKeys) &&
      safeSourceKeys.every((key) =>
        (mapper.expressions.get(key) || "").includes(`source.${key}`)) &&
      !containsAny(mapper.body, privateFieldNames),
    `${name} source mapper must return exactly the approved ten-key allowlist without config or pass-through`,
  );
}

const normalizeSearchSection = section(
  source.readModel,
  "function normalizeSearch",
  "function escapePostgrestLikePattern",
);
const searchGrammarGuardIndex = normalizeSearchSection.indexOf(
  "rejectUnsafeSearchGrammar(search)",
);
const normalizedSearchReturnIndex = normalizeSearchSection.indexOf(
  "return trimmed",
);

requireContract(
  "DISCOVERY_SEARCH_GRAMMAR_REJECTION",
  source.readModel.includes("UNSAFE_POSTGREST_SEARCH_PATTERN") &&
    source.readModel.includes("rejectUnsafeSearchGrammar") &&
    searchGrammarGuardIndex >= 0 &&
    normalizedSearchReturnIndex >= 0 &&
    searchGrammarGuardIndex < normalizedSearchReturnIndex,
  "candidate search must reject PostgREST grammar before composing the literal filter",
);

requireContract(
  "DISCOVERY_CURSOR_SIZE_CEILING",
  [
    "MAX_CURSOR_TOKEN_LENGTH",
    "MAX_CURSOR_ENCODED_PAYLOAD_LENGTH",
    "MAX_CURSOR_SIGNATURE_LENGTH",
    "MAX_CURSOR_STRING_FIELD_LENGTH",
  ].every((marker) => source.cursor.includes(marker)) &&
    source.cursor.indexOf("trimmed.length > MAX_CURSOR_TOKEN_LENGTH") <
      source.cursor.indexOf('trimmed.split(".")') &&
    source.cursor.includes("encodedPayload.length > MAX_CURSOR_ENCODED_PAYLOAD_LENGTH") &&
    /signature\.length\s*(?:>|!==)\s*MAX_CURSOR_SIGNATURE_LENGTH/u.test(source.cursor),
  "cursor token, encoded payload, signature, and decoded string fields need pre-HMAC ceilings",
);

requireContract(
  "DISCOVERY_SOURCE_CONFIG_EXCLUSION",
  source.source.includes("toSafeDiscoverySourceResponse") &&
    source.sources.includes("toSafeDiscoverySourceResponse") &&
    !sourceSuccess.includes("data: { source }"),
  "source create/update responses must use one explicit config-free mapper",
);

const forbiddenCanaries = [
  "PHASE32_RAW_PAYLOAD_CANARY",
  "PHASE32_EXTRACTED_JSON_CANARY",
  "PHASE32_STORAGE_PATH_CANARY",
  "PHASE32_RAW_STATS_CANARY",
  "PHASE32_ERROR_LOG_CANARY",
  "PHASE32_SOURCE_CONFIG_SECRET_CANARY",
];

requireContract(
  "DISCOVERY_RESPONSE_PRIVACY_CANARIES",
  forbiddenCanaries.every((canary) =>
    [source.detail, source.runs, source.manual, source.claim, source.sources, source.source]
      .every((text) => !text.includes(canary))),
  "fixture canaries must never be copied into production source",
);

assert.deepEqual(
  failures,
  [],
  `INTENTIONAL_RED_DISCOVERY_RESPONSE_PRIVACY\n${failures.join("\n")}`,
);

console.log("PASS: discovery admin read and mixed collection response privacy");
