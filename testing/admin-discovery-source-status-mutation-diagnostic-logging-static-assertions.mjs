#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const SOURCES_PATH = "app/api/admin/discovery/sources/route.ts";
const SOURCE_ITEM_PATH = "app/api/admin/discovery/sources/[id]/route.ts";
const DETAIL_PATH =
  "app/api/admin/discovery/discovered-tools/[id]/route.ts";
const BULK_PATH =
  "app/api/admin/discovery/discovered-tools/bulk-status/route.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-source-status-mutation-diagnostic-logging-static-assertions.mjs";

const SOURCES_CALLER_PATH =
  "components/admin/discovery/discovery-sources-panel.tsx";
const QUEUE_CALLER_PATH =
  "components/admin/discovery/discovery-queue-table.tsx";
const DETAIL_CALLER_PATH =
  "components/admin/discovery/discovery-tool-detail.tsx";
const DASHBOARD_CALLER_PATH = "components/admin/admin-dashboard-client.tsx";

const BASELINE_HEAD = "d2708db5fbb80aa6c3e3fd052d15b14418a8e230";
const BASELINE_HASHES = new Map([
  [SOURCES_PATH, "011e135251ba43f40b6bdee40f3007cfc25b60c91666e0fb63d81b8a13daaa2c"],
  [SOURCE_ITEM_PATH, "9372499e20d81d966d65648627aa2e77b8caa564b64c388237c9799f873a1df6"],
  [DETAIL_PATH, "e9bc69f4537e4c831c8f959bbc1082c4324b2c37d475f0823572793c0658a34c"],
  [BULK_PATH, "7bb9b81be5c34896920c393dc29c02b9b42458e8573dc4459a4673e69f216f03"],
  [CATALOG_PATH, "040bc8dfcedd9f235ca9aafede3688a11787335afd67ef3fb0617c983ffe99c4"],
]);

const PROTECTED_HASHES = new Map([
  ["lib/admin-auth.ts", "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc"],
  ["lib/admin-rate-limit.ts", "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b"],
  ["lib/supabase-admin.ts", "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae"],
  ["lib/tool-validation.ts", "8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba"],
  [SOURCES_CALLER_PATH, "426a99311e635e7f0d84897ab772fbd09f8c3b8e54dd9b5c92b4d71413f0497a"],
  [QUEUE_CALLER_PATH, "104a1aeaff3c799d7b0e1235989a98c4708dd89ff888458df85e49b45bbbc2af"],
  [DETAIL_CALLER_PATH, "6c9d796282d360d64f699ea89e86a039bb2d2c60c9973b0adb3c67a3b3d85795"],
  [DASHBOARD_CALLER_PATH, "86caa4376bde0084311595010c582b6c3aab83db98887121d8db2c59eb8aae2f"],
  ["testing/admin-shell-supabase-read-hardening.test.mjs", "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  ["app/api/admin/discovery/runs/route.ts", "62b84b6e7dee14d51383c403f3ce7e48815f92e81730cf283baa74620547a0ee"],
  ["app/api/admin/discovery/discovered-tools/route.ts", "aedd49386666d12cdda85608d20d850de48c9614570c4965b2fb612f2cd48010"],
  ["testing/admin-discovery-read-route-diagnostic-logging-static-assertions.mjs", "b3a4eaf7ae7e12ac6be8aa53642adbb1174c399356d014cad4b05d3e95de5b6d"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/route.ts", "c1005ed25788bb0f3499464bbb4add13c9c33d87bd6b33fc38dfc4007a4fef64"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts", "d4caae0a42723ecba1a19248f27525105faec4eb568201a5ee4fe666d7add0bf"],
  ["testing/discovery-candidate-preview-route-export-contract-static-assertions.mjs", "32ca45d158a547a6cc66100d0975e1697e139e0cf9a90ebff1ef05c94b7b4ae3"],
  ["supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql", "7b3cbb1234aa0e492f366baa5e340bda174b619ede1cfb48616658a0f631651f"],
  ["supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql", "59535ac5db55e3d083a4c83094e2aabd089046044320d6391833957ea73b719c"],
  ["supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql", "4479be746e7aeb425b62c308d8f0fda04414d743a02e3ba7b200e50a6ee46cc4"],
]);

const GOVERNANCE_HASHES = new Map([
  ["docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md", "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"],
  ["docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md", "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"],
  ["docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md", "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"],
  ["docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md", "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"],
  ["docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md", "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"],
]);

function fail(id, reason) {
  process.stderr.write(`${id} fails because ${reason}\n`);
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

// A01 deliberately reads only the sources collection route. No other
// repository file is read before this first-statement boundary passes.
const sourcesAbsolutePath = path.join(REPO_ROOT, SOURCES_PATH);
const sourcesText = readFileSync(sourcesAbsolutePath, "utf8");
check(
  "A01",
  sourcesText.startsWith('import "server-only";\n'),
  `${SOURCES_PATH} does not begin with import "server-only";.`,
);

const require = createRequire(import.meta.url);
const ts = require("typescript");

function parseText(relativePath, text, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    absolutePath,
    relativePath,
    text,
    sourceFile: ts.createSourceFile(
      absolutePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    ),
  };
}

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  return parseText(
    relativePath,
    readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
    scriptKind,
  );
}

function walk(root, visitor) {
  function visit(node) {
    visitor(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
}

function collect(root, predicate) {
  const matches = [];
  walk(root, (node) => {
    if (predicate(node)) matches.push(node);
  });
  return matches;
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function setsEqual(actual, expected) {
  return (
    actual.size === expected.size &&
    [...actual].every((value) => expected.has(value))
  );
}

function stringLiteral(node) {
  return node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
}

function callName(call) {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) {
    return call.expression.name.text;
  }
  return call.expression.getText();
}

function callsNamed(root, name) {
  return collect(
    root,
    (node) => ts.isCallExpression(node) && callName(node) === name,
  );
}

function topLevelFunction(record, name) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === name,
    ) ?? null
  );
}

function variableDeclaration(root, name) {
  return (
    collect(
      root,
      (node) =>
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name,
    )[0] ?? null
  );
}

function exportedNames(record) {
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    }
  }
  return names;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = stringLiteral(statement.moduleSpecifier);
    if (moduleName === null) continue;
    modules.push(moduleName);
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        names.add(element.name.text);
      }
    }
  }
  return { modules, names };
}

function serverOnlyIsFirst(record) {
  const statement = record.sourceFile.statements[0];
  return Boolean(
    statement &&
      ts.isImportDeclaration(statement) &&
      !statement.importClause &&
      stringLiteral(statement.moduleSpecifier) === "server-only",
  );
}

function initializerString(record, variableName) {
  const declaration = variableDeclaration(record.sourceFile, variableName);
  return stringLiteral(declaration?.initializer);
}

function consoleSignatures(record) {
  return collect(record.sourceFile, (node) =>
    Boolean(
      ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(record.sourceFile) === "console",
    ),
  ).map((call) => ({
    call,
    method: call.expression.name.text,
    args: [...call.arguments],
  }));
}

function exactConsoleContract(record, expectedEvents) {
  const signatures = consoleSignatures(record);
  return (
    signatures.length === expectedEvents.size &&
    signatures.every((signature, index) => {
      const [event, severity] = [...expectedEvents][index];
      return (
        signature.method === severity &&
        signature.args.length === 1 &&
        stringLiteral(signature.args[0]) === event
      );
    })
  );
}

function setLiteralValues(record, variableName) {
  const declaration = variableDeclaration(record.sourceFile, variableName);
  const initializer = declaration?.initializer;
  if (!initializer || !ts.isNewExpression(initializer)) return new Set();
  const values = initializer.arguments?.[0];
  if (!values || !ts.isArrayLiteralExpression(values)) return new Set();
  return new Set(values.elements.map(stringLiteral).filter(Boolean));
}

function selectProjection(call) {
  const argument = call.arguments[0];
  if (stringLiteral(argument) !== null) return stringLiteral(argument);
  if (
    !argument ||
    !ts.isCallExpression(argument) ||
    !ts.isPropertyAccessExpression(argument.expression) ||
    argument.expression.name.text !== "join" ||
    stringLiteral(argument.arguments[0]) !== ", " ||
    !ts.isArrayLiteralExpression(argument.expression.expression)
  ) {
    return null;
  }
  return argument.expression.expression.elements.map(stringLiteral);
}

function fromTables(root) {
  return callsNamed(root, "from").map((call) => stringLiteral(call.arguments[0]));
}

function propertyMap(objectLiteral) {
  const properties = new Map();
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) {
    return properties;
  }
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      const name =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : property.name.getText();
      properties.set(name, property.initializer);
    } else if (ts.isShorthandPropertyAssignment(property)) {
      properties.set(property.name.text, property.name);
    }
  }
  return properties;
}

function hasAncestor(node, predicate) {
  let current = node.parent;
  while (current) {
    if (predicate(current)) return true;
    current = current.parent;
  }
  return false;
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function execGit(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function checkIds(record) {
  return new Set(
    callsNamed(record.sourceFile, "check")
      .map((call) => stringLiteral(call.arguments[0]))
      .filter(Boolean),
  );
}

function expectedIds(count) {
  return new Set(
    Array.from(
      { length: count },
      (_, index) => `A${String(index + 1).padStart(2, "0")}`,
    ),
  );
}

function mode(relativePath) {
  return statSync(path.join(REPO_ROOT, relativePath)).mode & 0o777;
}

function functionText(record, name) {
  return compact(topLevelFunction(record, name)?.getText(record.sourceFile) ?? "");
}

const sources = parseText(SOURCES_PATH, sourcesText);
const sourceItem = parseFile(SOURCE_ITEM_PATH);
check(
  "A02",
  serverOnlyIsFirst(sourceItem),
  `${SOURCE_ITEM_PATH} does not begin with import "server-only";.`,
);

const detail = parseFile(DETAIL_PATH);
check(
  "A03",
  serverOnlyIsFirst(detail),
  `${DETAIL_PATH} does not begin with import "server-only";.`,
);

const bulk = parseFile(BULK_PATH);
check(
  "A04",
  serverOnlyIsFirst(bulk),
  `${BULK_PATH} does not begin with import "server-only";.`,
);

const AUTH_IMPORT_NAMES = new Set([
  "NextResponse",
  "verifyAdminCsrfRequest",
  "verifyAdminSession",
  "ADMIN_RATE_LIMIT_ACTIONS",
  "checkAdminRateLimit",
  "getAdminRateLimitResponseData",
  "supabaseAdmin",
]);
const SOURCE_IMPORT_NAMES = new Set([
  ...AUTH_IMPORT_NAMES,
  "validateHttpsUrl",
  "validateTextField",
]);

const sourcesImports = importDetails(sources);
check(
  "A05",
  JSON.stringify(sourcesImports.modules) ===
    JSON.stringify([
      "server-only",
      "next/server",
      "../../../../../lib/admin-auth",
      "../../../../../lib/admin-rate-limit",
      "../../../../../lib/supabase-admin",
      "../../../../../lib/tool-validation",
    ]) && setsEqual(sourcesImports.names, SOURCE_IMPORT_NAMES),
  "the sources collection import module or symbol ceiling changed.",
);

const sourceItemImports = importDetails(sourceItem);
check(
  "A06",
  JSON.stringify(sourceItemImports.modules) ===
    JSON.stringify([
      "server-only",
      "next/server",
      "../../../../../../lib/admin-auth",
      "../../../../../../lib/admin-rate-limit",
      "../../../../../../lib/supabase-admin",
      "../../../../../../lib/tool-validation",
    ]) && setsEqual(sourceItemImports.names, SOURCE_IMPORT_NAMES),
  "the source item import module or symbol ceiling changed.",
);

const detailImports = importDetails(detail);
check(
  "A07",
  JSON.stringify(detailImports.modules) ===
    JSON.stringify([
      "server-only",
      "next/server",
      "../../../../../../lib/admin-auth",
      "../../../../../../lib/admin-rate-limit",
      "../../../../../../lib/supabase-admin",
    ]) && setsEqual(detailImports.names, AUTH_IMPORT_NAMES),
  "the discovered-tool detail/status import module or symbol ceiling changed.",
);

const bulkImports = importDetails(bulk);
check(
  "A08",
  JSON.stringify(bulkImports.modules) ===
    JSON.stringify([
      "server-only",
      "next/server",
      "../../../../../../lib/admin-auth",
      "../../../../../../lib/admin-rate-limit",
      "../../../../../../lib/supabase-admin",
    ]) && setsEqual(bulkImports.names, AUTH_IMPORT_NAMES),
  "the bulk-status import module or symbol ceiling changed.",
);

function exactExports(record, expected) {
  return (
    setsEqual(exportedNames(record), expected) &&
    initializerString(record, "runtime") === "nodejs" &&
    initializerString(record, "dynamic") === "force-dynamic"
  );
}

check(
  "A09",
  exactExports(sources, new Set(["runtime", "dynamic", "GET", "POST"])),
  "the sources collection exports, methods, runtime, or dynamic value changed.",
);
check(
  "A10",
  exactExports(sourceItem, new Set(["runtime", "dynamic", "PATCH"])),
  "the source item exports, method, runtime, or dynamic value changed.",
);
check(
  "A11",
  exactExports(detail, new Set(["runtime", "dynamic", "GET", "PATCH"])),
  "the discovered-tool detail/status exports, methods, runtime, or dynamic value changed.",
);
check(
  "A12",
  exactExports(bulk, new Set(["runtime", "dynamic", "POST"])),
  "the bulk-status exports, method, runtime, or dynamic value changed.",
);

const methods = [
  [sources, "GET"],
  [sources, "POST"],
  [sourceItem, "PATCH"],
  [detail, "GET"],
  [detail, "PATCH"],
  [bulk, "POST"],
].map(([record, name]) => ({
  record,
  name,
  fn: topLevelFunction(record, name),
}));
const mutationMethods = methods.filter(({ name }) => name !== "GET");

function authenticationPrecedesWork(fn) {
  if (!fn) return false;
  const authCalls = callsNamed(fn, "verifyAdminSession");
  const protectedNames = new Set([
    "URL",
    "readJsonBody",
    "validateTextField",
    "getOptionalSourceUrl",
    "getSourceType",
    "getSourceConfig",
    "getBooleanValue",
    "isUuid",
    "isValidUuid",
    "getOptionalReason",
    "getBulkIds",
    "getTargetStatus",
    "from",
  ]);
  const protectedCalls = collect(
    fn,
    (node) =>
      (ts.isCallExpression(node) && protectedNames.has(callName(node))) ||
      (ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "URL"),
  );
  return (
    authCalls.length === 1 &&
    protectedCalls.length > 0 &&
    protectedCalls.every((node) => authCalls[0].end < node.pos)
  );
}

check(
  "A13",
  methods.every(({ fn }) => authenticationPrecedesWork(fn)),
  "session verification no longer precedes URL, body, validation, and database work in every method.",
);

check(
  "A14",
  mutationMethods.every(({ fn }) => {
    const auth = callsNamed(fn, "verifyAdminSession");
    const csrf = callsNamed(fn, "verifyAdminCsrfRequest");
    return auth.length === 1 && csrf.length === 1 && auth[0].end < csrf[0].pos;
  }),
  "authentication no longer precedes CSRF verification in every mutation method.",
);

check(
  "A15",
  mutationMethods.every(({ fn }) => {
    const csrf = callsNamed(fn, "verifyAdminCsrfRequest")[0];
    const protectedCalls = collect(
      fn,
      (node) =>
        ts.isCallExpression(node) &&
        [
          "checkAdminRateLimit",
          "readJsonBody",
          "validateTextField",
          "getOptionalSourceUrl",
          "getSourceType",
          "getSourceConfig",
          "getBooleanValue",
          "isUuid",
          "isValidUuid",
          "getOptionalReason",
          "getBulkIds",
          "getTargetStatus",
          "from",
        ].includes(callName(node)),
    );
    return csrf && protectedCalls.length > 0 && protectedCalls.every((call) => csrf.end < call.pos);
  }),
  "CSRF verification no longer precedes rate limiting, body handling, validation, and database activity.",
);

const expectedSourceTypes = new Set(["rss", "api", "scraper", "manual", "webhook"]);
const detailStatuses = new Set([
  "new",
  "pending_review",
  "rejected",
  "ignored",
  "duplicate",
]);
const bulkTargetStatuses = new Set(["pending_review", "ignored"]);
const bulkSourceStatuses = new Set(["new", "pending_review", "ignored"]);
const sourcesCompact = compact(sources.text);
const sourceItemCompact = compact(sourceItem.text);
const detailCompact = compact(detail.text);
const bulkCompact = compact(bulk.text);
check(
  "A16",
  setsEqual(setLiteralValues(sources, "VALID_SOURCE_TYPES"), expectedSourceTypes) &&
    setsEqual(setLiteralValues(sourceItem, "VALID_SOURCE_TYPES"), expectedSourceTypes) &&
    setsEqual(setLiteralValues(detail, "PATCHABLE_DISCOVERY_STATUSES"), detailStatuses) &&
    setsEqual(setLiteralValues(bulk, "BULK_ALLOWED_TARGET_STATUSES"), bulkTargetStatuses) &&
    setsEqual(setLiteralValues(bulk, "BULK_SAFE_SOURCE_STATUSES"), bulkSourceStatuses) &&
    sourcesCompact.includes("constMAX_BODY_SIZE_BYTES=24*1024") &&
    sourcesCompact.includes("constMAX_CONFIG_SIZE_BYTES=10*1024") &&
    sourceItemCompact.includes("constMAX_BODY_SIZE_BYTES=24*1024") &&
    sourceItemCompact.includes("constMAX_CONFIG_SIZE_BYTES=10*1024") &&
    detailCompact.includes("if(contentLength>20*1024)") &&
    detailCompact.includes("constMAX_REASON_LENGTH=500") &&
    bulkCompact.includes("constMAX_BATCH_SIZE=50") &&
    bulkCompact.includes("constMAX_BODY_SIZE_BYTES=24*1024") &&
    bulkCompact.includes("constMAX_REASON_LENGTH=500") &&
    sourceItemCompact.includes('returnjsonResponse({error:"InvaliddiscoverysourceID."},400)') &&
    detailCompact.includes('returnjsonResponse({error:"InvaliddiscoveredtoolID."},400)') &&
    detailCompact.includes('returnjsonResponse({error:"Invalidstatus."},400)') &&
    bulkCompact.includes('thrownewError("Invalidbulkstatus.")'),
  "a body, batch, reason, route-ID, status, source, or trusted validation boundary changed.",
);

const sourcesGet = topLevelFunction(sources, "GET");
const sourcesGetText = compact(sourcesGet?.getText(sources.sourceFile) ?? "");
const sourcesGetSelects = callsNamed(sourcesGet, "select");
check(
  "A17",
  JSON.stringify(fromTables(sourcesGet)) === JSON.stringify(["discovery_sources"]) &&
    sourcesGetSelects.length === 1 &&
    JSON.stringify(selectProjection(sourcesGetSelects[0])) ===
      JSON.stringify([
        "id", "name", "slug", "description", "url", "source_type",
        "config", "is_active", "last_run_at", "created_at", "updated_at",
      ]) &&
    callsNamed(sourcesGet, "order").length === 1 &&
    callsNamed(sourcesGet, "range").length === 1 &&
    callsNamed(sourcesGet, "eq").length === 2 &&
    sourcesGetText.includes('query=query.eq("source_type",sourceType)') &&
    sourcesGetText.includes('query=query.eq("is_active",isActive==="true")') &&
    sourcesGetText.includes('returnjsonResponse({error:"Failedtofetchdiscoverysources."},500)') &&
    sourcesGetText.includes("pagination:{total:count||0,page,limit,totalPages:Math.ceil((count||0)/limit)") &&
    callsNamed(sourcesGet, "insert").length === 0 &&
    callsNamed(sourcesGet, "update").length === 0,
  "the sources GET query, filters, pagination, headers, statuses, or response changed.",
);

const sourcesPost = topLevelFunction(sources, "POST");
const sourcesPostText = compact(sourcesPost?.getText(sources.sourceFile) ?? "");
check(
  "A18",
  JSON.stringify(fromTables(sourcesPost)) ===
    JSON.stringify(["discovery_sources", "discovery_sources", "discovery_audit_events"]) &&
    callsNamed(sourcesPost, "select").length === 2 &&
    callsNamed(sourcesPost, "insert").length === 2 &&
    callsNamed(sourcesPost, "update").length === 0 &&
    sourcesPostText.indexOf('.select("id,name,slug")') < sourcesPostText.indexOf('.insert({name,slug,description:description||null,url,source_type:sourceType,config,is_active:isActive,})') &&
    sourcesPostText.indexOf('.insert({name,slug,description:description||null,url,source_type:sourceType,config,is_active:isActive,})') < sourcesPostText.indexOf('.from("discovery_audit_events")') &&
    sourcesPostText.includes('action:"flag"') &&
    sourcesPostText.includes('message:"Discoverysourcecreated."'),
  "source creation no longer preserves duplicate read, insert/select, and audit insertion ordering.",
);

const sourcePatch = topLevelFunction(sourceItem, "PATCH");
const sourcePatchText = compact(sourcePatch?.getText(sourceItem.sourceFile) ?? "");
const duplicateFrom = callsNamed(sourcePatch, "from").find(
  (call) =>
    stringLiteral(call.arguments[0]) === "discovery_sources" &&
    hasAncestor(call, ts.isIfStatement),
);
check(
  "A19",
  JSON.stringify(fromTables(sourcePatch)) ===
    JSON.stringify(["discovery_sources", "discovery_sources", "discovery_sources", "discovery_audit_events"]) &&
    Boolean(duplicateFrom) &&
    callsNamed(sourcePatch, "select").length === 3 &&
    callsNamed(sourcePatch, "update").length === 1 &&
    callsNamed(sourcePatch, "insert").length === 1 &&
    sourcePatchText.indexOf('const{data:previousSource,error:previousSourceError}=awaitsupabaseAdmin') < sourcePatchText.indexOf('.update(updatePayload)') &&
    sourcePatchText.indexOf('.update(updatePayload)') < sourcePatchText.indexOf('.from("discovery_audit_events")') &&
    sourcePatchText.includes('action:"flag"') &&
    sourcePatchText.includes('message:"Discoverysourceupdated."'),
  "source update no longer preserves conditional duplicate, previous-row, update/select, and audit ordering.",
);

const detailGet = topLevelFunction(detail, "GET");
const detailGetText = compact(detailGet?.getText(detail.sourceFile) ?? "");
check(
  "A20",
  JSON.stringify(fromTables(detailGet)) ===
    JSON.stringify([
      "discovered_tools",
      "discovery_evidence",
      "discovery_duplicate_candidates",
      "discovery_audit_events",
      "discovery_sources",
      "discovery_runs",
    ]) &&
    callsNamed(detailGet, "select").length === 6 &&
    callsNamed(detailGet, "limit").length === 1 &&
    callsNamed(detailGet, "limit")[0].arguments[0]?.getText(detail.sourceFile) === "50" &&
    detailGetText.indexOf('.from("discovered_tools")') < detailGetText.indexOf('.from("discovery_evidence")') &&
    detailGetText.indexOf('.from("discovery_evidence")') < detailGetText.indexOf('.from("discovery_duplicate_candidates")') &&
    detailGetText.indexOf('.from("discovery_duplicate_candidates")') < detailGetText.indexOf('.from("discovery_audit_events")') &&
    detailGetText.indexOf('.from("discovery_audit_events")') < detailGetText.indexOf('.from("discovery_sources")') &&
    detailGetText.indexOf('.from("discovery_sources")') < detailGetText.indexOf('.from("discovery_runs")') &&
    detailGetText.includes('typeoftool.source_id==="string"') &&
    detailGetText.includes('typeoftool.run_id==="string"') &&
    ["tool,source,run,evidence:evidence||[]", "duplicateCandidates:duplicateCandidates||[]", "auditEvents:auditEvents||[]"].every((marker) => detailGetText.includes(marker)),
  "the discovered-tool GET six-read graph, projections, enrichment, audit ceiling, or response changed.",
);

const detailPatch = topLevelFunction(detail, "PATCH");
const detailPatchText = compact(detailPatch?.getText(detail.sourceFile) ?? "");
check(
  "A21",
  JSON.stringify(fromTables(detailPatch)) ===
    JSON.stringify(["discovered_tools", "discovered_tools", "discovery_audit_events"]) &&
    callsNamed(detailPatch, "select").length === 2 &&
    callsNamed(detailPatch, "update").length === 1 &&
    callsNamed(detailPatch, "insert").length === 1 &&
    detailPatchText.indexOf('.select("id,status")') < detailPatchText.indexOf('.update(updatePayload)') &&
    detailPatchText.indexOf('.update(updatePayload)') < detailPatchText.indexOf('.from("discovery_audit_events")') &&
    detailPatchText.includes('action:DISCOVERY_AUDIT_ACTION_BY_STATUS[status]') &&
    detailPatchText.includes('message:`Changeddiscoveredtoolstatusfrom${existingTool.status}to${status}.`'),
  "discovered-tool PATCH no longer preserves load, update/select, and audit insertion ordering.",
);

const bulkPost = topLevelFunction(bulk, "POST");
const bulkPostText = compact(bulkPost?.getText(bulk.sourceFile) ?? "");
check(
  "A22",
  JSON.stringify(fromTables(bulkPost)) ===
    JSON.stringify(["discovered_tools", "discovered_tools", "discovery_audit_events"]) &&
    callsNamed(bulkPost, "select").length === 2 &&
    callsNamed(bulkPost, "update").length === 1 &&
    callsNamed(bulkPost, "insert").length === 1 &&
    bulkPostText.includes("consteligibleRows=existingRows.filter") &&
    bulkPostText.includes("BULK_SAFE_SOURCE_STATUSES.has(tool.status||\"new\")") &&
    bulkPostText.indexOf('.select("id,status")') < bulkPostText.indexOf('.update({status,updated_at:updatedAt,})') &&
    bulkPostText.indexOf('.update({status,updated_at:updatedAt,})') < bulkPostText.indexOf('.from("discovery_audit_events")') &&
    bulkPostText.includes('message:`Bulkchangeddiscoveredtoolstatusfrom${tool.status}to${status}.`'),
  "bulk status no longer preserves selected-row load, eligibility filtering, update/select, and audit ordering.",
);

const allRouteRecords = [sources, sourceItem, detail, bulk];
const allRouteCalls = allRouteRecords.flatMap((record) =>
  collect(record.sourceFile, ts.isCallExpression),
);
const prohibitedCalls = new Set([
  "delete",
  "upsert",
  "rpc",
  "upload",
  "remove",
  "fetch",
  "retry",
  "rollback",
  "transaction",
]);
check(
  "A23",
  callsNamed(sources.sourceFile, "from").length === 4 &&
    callsNamed(sourceItem.sourceFile, "from").length === 4 &&
    callsNamed(detail.sourceFile, "from").length === 9 &&
    callsNamed(bulk.sourceFile, "from").length === 3 &&
    callsNamed(sources.sourceFile, "update").length === 0 &&
    callsNamed(sourceItem.sourceFile, "update").length === 1 &&
    callsNamed(detail.sourceFile, "update").length === 1 &&
    callsNamed(bulk.sourceFile, "update").length === 1 &&
    callsNamed(sources.sourceFile, "insert").length === 2 &&
    callsNamed(sourceItem.sourceFile, "insert").length === 1 &&
    callsNamed(detail.sourceFile, "insert").length === 1 &&
    callsNamed(bulk.sourceFile, "insert").length === 1 &&
    !allRouteCalls.some((call) => prohibitedCalls.has(callName(call))) &&
    !allRouteRecords.some((record) => /\.storage\b|\bretry\b|\brollback\b|\btransaction\b/i.test(record.text)),
  "a table/query/mutation/audit ceiling expanded or delete, upsert, RPC, storage, retry, rollback, or transaction behavior appeared.",
);

check(
  "A24",
  sourcesPostText.includes('metadata:{event_type:"source_created",source_id:source.id,source_slug:source.slug,source_type:source.source_type,is_active:source.is_active,}') &&
    sourcePatchText.includes('constauditMetadata=buildSourceUpdateAuditMetadata') &&
    sourceItemCompact.includes('event_type:"source_updated"') &&
    sourceItemCompact.includes("changed_fields:changedFields") &&
    sourceItemCompact.includes("previous_values:previousValues") &&
    sourceItemCompact.includes("next_values:nextValues") &&
    detailPatchText.includes('metadata:{from_status:existingTool.status,to_status:status,reason,}') &&
    bulkPostText.includes('metadata:{bulk:true,from_status:tool.status,to_status:status,reason,}') &&
    detailCompact.includes('rejected:"reject"') &&
    detailCompact.includes('ignored:"ignore"') &&
    detailCompact.includes('duplicate:"mark-duplicate"') &&
    bulkCompact.includes('pending_review:"flag"') &&
    bulkCompact.includes('ignored:"ignore"'),
  "an audit action, target field, metadata key, message, or mutation-before-audit ordering changed.",
);

const SOURCES_EVENTS = new Map([
  ["discovery_sources_list_unauthorized", "warn"],
  ["discovery_sources_load_failed", "error"],
  ["discovery_source_create_unauthorized", "warn"],
  ["discovery_source_duplicate_check_failed", "error"],
  ["discovery_source_create_failed", "error"],
  ["discovery_source_create_audit_failed", "error"],
]);
const SOURCE_ITEM_EVENTS = new Map([
  ["discovery_source_update_unauthorized", "warn"],
  ["discovery_source_update_duplicate_check_failed", "error"],
  ["discovery_source_update_load_failed", "error"],
  ["discovery_source_update_failed", "error"],
  ["discovery_source_update_audit_failed", "error"],
]);
const DETAIL_EVENTS = new Map([
  ["discovered_tool_detail_unauthorized", "warn"],
  ["discovered_tool_detail_load_failed", "error"],
  ["discovered_tool_evidence_load_failed", "error"],
  ["discovered_tool_duplicates_load_failed", "error"],
  ["discovered_tool_audit_events_load_failed", "error"],
  ["discovered_tool_source_load_failed", "error"],
  ["discovered_tool_run_load_failed", "error"],
  ["discovered_tool_status_update_unauthorized", "warn"],
  ["discovered_tool_status_update_load_failed", "error"],
  ["discovered_tool_status_update_failed", "error"],
  ["discovered_tool_status_update_audit_failed", "error"],
]);
const BULK_EVENTS = new Map([
  ["discovered_tools_bulk_status_unauthorized", "warn"],
  ["discovered_tools_bulk_status_load_failed", "error"],
  ["discovered_tools_bulk_status_update_failed", "error"],
  ["discovered_tools_bulk_status_audit_failed", "error"],
]);

check(
  "A25",
  exactConsoleContract(sources, SOURCES_EVENTS) &&
    exactConsoleContract(sourceItem, SOURCE_ITEM_EVENTS) &&
    exactConsoleContract(detail, DETAIL_EVENTS) &&
    exactConsoleContract(bulk, BULK_EVENTS),
  "the exact 26-event set or required severities changed.",
);

const allConsoleSignatures = allRouteRecords.flatMap(consoleSignatures);
check(
  "A26",
  allConsoleSignatures.length === 26 &&
    allConsoleSignatures.every(
      ({ args }) => args.length === 1 && stringLiteral(args[0]) !== null,
    ),
  "a selected console call does not have exactly one fixed TypeScript string-literal argument.",
);

const forbiddenConsoleData =
  /(?:\.message|adminSession\.errors|request\.|session|sourceId|runId|toolId|batch|row|metadata|state|environment|credential|secret|token|password|stack|cause|details|hint|code)/i;
check(
  "A27",
  !allConsoleSignatures.some(({ call }) =>
    forbiddenConsoleData.test(call.getText()),
  ),
  "a selected console call exposes dynamic diagnostic, session, request, ID, row, batch, audit, state, environment, credential, or secret data.",
);

const ROUTE_REWRITES = new Map([
  [SOURCES_PATH, [
    ['    console.warn("discovery_sources_list_unauthorized");', '    console.warn("Unauthorized Discovery Sources request.", {\n      errors: adminSession.errors,\n    });'],
    ['    console.error("discovery_sources_load_failed");', '    console.error("Failed to fetch Discovery Sources.", {\n      message: error.message,\n    });'],
    ['    console.warn("discovery_source_create_unauthorized");', '    console.warn("Unauthorized Discovery Source create request.", {\n      errors: adminSession.errors,\n    });'],
    ['    console.error("discovery_source_duplicate_check_failed");', '    console.error("Failed to check existing discovery source.", {\n      message: existingSourceError.message,\n    });'],
    ['    console.error("discovery_source_create_failed");', '    console.error("Failed to create discovery source.", {\n      message: insertError.message,\n    });'],
    ['    console.error("discovery_source_create_audit_failed");', '    console.error("Failed to write Discovery Source create audit event.", {\n      message: auditError.message,\n      sourceId: source.id,\n    });'],
  ]],
  [SOURCE_ITEM_PATH, [
    ['    console.warn("discovery_source_update_unauthorized");', '    console.warn("Unauthorized Discovery Source update request.", {\n      errors: adminSession.errors,\n    });'],
    ['      console.error("discovery_source_update_duplicate_check_failed");', '      console.error("Failed to check duplicate discovery source slug.", {\n        message: existingSourceError.message,\n      });'],
    ['    console.error("discovery_source_update_load_failed");', '    console.error("Failed to load discovery source before update.", {\n      message: previousSourceError.message,\n    });'],
    ['    console.error("discovery_source_update_failed");', '    console.error("Failed to update discovery source.", {\n      message: updateError.message,\n    });'],
    ['    console.error("discovery_source_update_audit_failed");', '    console.error("Failed to write Discovery Source update audit event.", {\n      message: auditError.message,\n      sourceId: source.id,\n    });'],
  ]],
  [DETAIL_PATH, [
    ['    console.warn("discovered_tool_detail_unauthorized");', '    console.warn("Unauthorized Discovery Engine detail request.", {\n      errors: adminSession.errors,\n    });'],
    ['    console.error("discovered_tool_detail_load_failed");', '    console.error("Failed to fetch Discovery Engine discovered tool detail.", {\n      message: toolError.message,\n    });'],
    ['    console.error("discovered_tool_evidence_load_failed");', '    console.error("Failed to fetch Discovery Engine evidence.", {\n      message: evidenceError.message,\n    });'],
    ['    console.error("discovered_tool_duplicates_load_failed");', '    console.error("Failed to fetch Discovery Engine duplicate candidates.", {\n      message: duplicateError.message,\n    });'],
    ['      console.error("discovered_tool_audit_events_load_failed");', '      console.error("Failed to fetch Discovery Engine audit events.", {\n        message: auditError.message,\n      });'],
    ['    console.error("discovered_tool_source_load_failed");', '    console.error("Failed to fetch Discovery Engine source detail.", {\n      message: sourceError.message,\n    });'],
    ['    console.error("discovered_tool_run_load_failed");', '    console.error("Failed to fetch Discovery Engine run detail.", {\n      message: runError.message,\n    });'],
    ['    console.warn("discovered_tool_status_update_unauthorized");', '    console.warn("Unauthorized Discovery Engine status update request.", {\n      errors: adminSession.errors,\n    });'],
    ['    console.error("discovered_tool_status_update_load_failed");', '    console.error("Failed to load Discovery Engine tool before status update.", {\n      message: existingToolError.message,\n    });'],
    ['    console.error("discovered_tool_status_update_failed");', '    console.error("Failed to update Discovery Engine discovered tool status.", {\n      message: updateError.message,\n    });'],
    ['    console.error("discovered_tool_status_update_audit_failed");', '    console.error("Failed to write Discovery Engine audit event.", {\n      message: auditError.message,\n    });'],
  ]],
  [BULK_PATH, [
    ['    console.warn("discovered_tools_bulk_status_unauthorized");', '    console.warn("Unauthorized Discovery Engine bulk status request.", {\n      errors: adminSession.errors,\n    });'],
    ['    console.error("discovered_tools_bulk_status_load_failed");', '    console.error("Failed to load Discovery Engine tools before bulk status.", {\n      message: existingToolsError.message,\n    });'],
    ['    console.error("discovered_tools_bulk_status_update_failed");', '    console.error("Failed to bulk update Discovery Engine discovered tools.", {\n      message: updateError.message,\n    });'],
    ['    console.error("discovered_tools_bulk_status_audit_failed");', '    console.error("Failed to write Discovery Engine bulk audit events.", {\n      message: auditError.message,\n    });'],
  ]],
]);

function normalizeRoute(record) {
  let normalized = record.text.replace('import "server-only";\n\n', "");
  for (const [fixed, baseline] of ROUTE_REWRITES.get(record.relativePath) ?? []) {
    normalized = normalized.replace(fixed, baseline);
  }
  return normalized;
}

check(
  "A28",
  allRouteRecords.every(
    (record) => hashText(normalizeRoute(record)) === BASELINE_HASHES.get(record.relativePath),
  ) &&
    sourcesCompact.includes('"Cache-Control":"no-store"') &&
    sourcesCompact.includes('"X-Content-Type-Options":"nosniff"') &&
    [sourceItemCompact, detailCompact, bulkCompact].every(
      (text) => text.includes('"Cache-Control":"no-store"') && text.includes('"X-Content-Type-Options":"nosniff"'),
    ) &&
    sourcesPostText.includes('"Discoverysourcecreated,butauditloggingfailed."') &&
    sourcePatchText.includes('"Discoverysourceupdated,butauditloggingfailed."') &&
    detailPatchText.includes('"Statusupdated,butauditloggingfailed."') &&
    bulkPostText.includes('"Bulkstatusupdated,butauditloggingfailed."'),
  "a public body, status, header, success shape, validation message, not-found response, unchanged-status response, or truthful partial-state response changed.",
);

const sourcesCaller = parseFile(SOURCES_CALLER_PATH, ts.ScriptKind.TSX);
const queueCaller = parseFile(QUEUE_CALLER_PATH, ts.ScriptKind.TSX);
const detailCaller = parseFile(DETAIL_CALLER_PATH, ts.ScriptKind.TSX);
const dashboardCaller = parseFile(DASHBOARD_CALLER_PATH, ts.ScriptKind.TSX);
check(
  "A29",
  [SOURCES_CALLER_PATH, QUEUE_CALLER_PATH, DETAIL_CALLER_PATH, DASHBOARD_CALLER_PATH].every(
    (relativePath) => sha256(relativePath) === PROTECTED_HASHES.get(relativePath),
  ) &&
    sourcesCaller.text.includes('fetch(`/api/admin/discovery/sources?${queryString}`') &&
    sourcesCaller.text.includes('fetch("/api/admin/discovery/sources", {') &&
    sourcesCaller.text.includes('fetch(`/api/admin/discovery/sources/${source.id}`, {') &&
    sourcesCaller.text.includes('method: "POST"') &&
    sourcesCaller.text.includes('method: "PATCH"') &&
    sourcesCaller.text.includes('credentials: "same-origin"') &&
    sourcesCaller.text.includes('cache: "no-store"') &&
    sourcesCaller.text.includes("payload.pagination") &&
    queueCaller.text.includes('"/api/admin/discovery/discovered-tools/bulk-status"') &&
    queueCaller.text.includes('method: "POST"') &&
    queueCaller.text.includes('ids: selectedIds') &&
    queueCaller.text.includes('reason: "Bulk queue safety action."') &&
    queueCaller.text.includes("result.updated") &&
    queueCaller.text.includes("result.skipped") &&
    detailCaller.text.includes('method: "PATCH"') &&
    detailCaller.text.includes("status,") &&
    detailCaller.text.includes("reason,") &&
    detailCaller.text.includes("result.data || null") &&
    dashboardCaller.text.includes("<DiscoverySourcesPanel />") &&
    dashboardCaller.text.includes("<DiscoveryQueueTable />") &&
    dashboardCaller.text.includes("<DiscoveryToolDetail toolId={discoveryToolId} />"),
  "a caller identity, endpoint, method, body, credentials/cache behavior, consumed response field, or rendered component changed.",
);

const allowedTrackedChanges = new Set([
  SOURCES_PATH,
  SOURCE_ITEM_PATH,
  DETAIL_PATH,
  BULK_PATH,
  CATALOG_PATH,
]);
const trackedChanges = new Set(
  execGit(["diff", "--name-only"])
    .trimEnd()
    .split("\n")
    .filter(Boolean),
);
check(
  "A30",
  [...PROTECTED_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
  ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
    ) &&
    [...trackedChanges].every((relativePath) => allowedTrackedChanges.has(relativePath)),
  "a direct dependency, admin-shell contract, previous security contract, migration, Phase 27GJ identity, governance identity, or tracked repository file outside scope changed.",
);

const expectedStatus = new Set([
  ` M ${SOURCES_PATH}`,
  ` M ${SOURCE_ITEM_PATH}`,
  ` M ${DETAIL_PATH}`,
  ` M ${BULK_PATH}`,
  ` M ${CATALOG_PATH}`,
  `?? ${HARNESS_PATH}`,
  ...[...GOVERNANCE_HASHES.keys()].map((relativePath) => `?? ${relativePath}`),
]);
const actualStatus = new Set(
  execGit(["status", "--porcelain=v1", "--untracked-files=all"])
    .trimEnd()
    .split("\n")
    .filter(Boolean),
);
const trackedModes = new Map(
  execGit(["ls-files", "-s", ...allowedTrackedChanges])
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [metadata, relativePath] = line.split("\t");
      return [relativePath, metadata.split(" ")[0]];
    }),
);
check(
  "A31",
  setsEqual(actualStatus, expectedStatus) &&
    execGit(["diff", "--cached", "--name-only"]).trim() === "" &&
    execGit(["rev-parse", "HEAD"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "origin/main"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "--abbrev-ref", "HEAD"]).trim() === "main" &&
    [...allowedTrackedChanges].every(
      (relativePath) => trackedModes.get(relativePath) === "100644",
    ) &&
    [...allowedTrackedChanges, HARNESS_PATH].every(
      (relativePath) => mode(relativePath) === 0o644,
    ) &&
    [...GOVERNANCE_HASHES.keys()].every(
      (relativePath) => mode(relativePath) === 0o644,
    ) &&
    [...allRouteRecords.map((record) => record.text), parseFile(CATALOG_PATH, ts.ScriptKind.JS).text, parseFile(HARNESS_PATH, ts.ScriptKind.JS).text].every(
      (text) => !text.includes("\r"),
    ),
  "the exact final six-file scope, LF content, modes, branch, Git baseline, index, or five-file governance ceiling changed.",
);

const catalog = parseFile(CATALOG_PATH, ts.ScriptKind.JS);
const harness = parseFile(HARNESS_PATH, ts.ScriptKind.JS);
const finalRouteIdentityLines = [
  `  ["${SOURCES_PATH}", "${sha256(SOURCES_PATH)}"],`,
  `  ["${SOURCE_ITEM_PATH}", "${sha256(SOURCE_ITEM_PATH)}"],`,
  `  ["${DETAIL_PATH}", "${sha256(DETAIL_PATH)}"],`,
  `  ["${BULK_PATH}", "${sha256(BULK_PATH)}"],`,
  `  [PHASE_27GL_HARNESS_PATH, "${sha256(HARNESS_PATH)}"],`,
];
const catalogConstants =
  'const PHASE_27GL_HARNESS_PATH =\n  "testing/admin-discovery-source-status-mutation-diagnostic-logging-static-assertions.mjs";\nconst PHASE_27GL_SUCCESS_MARKER =\n  "PASS: admin discovery source/status mutation diagnostic logging static assertions (32 assertions)";\n\n';
const catalogHarnessParse =
  "const phase27glHarness = parseFile(PHASE_27GL_HARNESS_PATH, ts.ScriptKind.JS);\n";
const catalogMarkerCheck =
  "    phase27glHarness.text.includes(PHASE_27GL_SUCCESS_MARKER) &&\n";
const normalizedCatalog = catalog.text
  .replace(catalogConstants, "\n")
  .replace(`${finalRouteIdentityLines.join("\n")}\n`, "")
  .replace(catalogHarnessParse, "")
  .replace(catalogMarkerCheck, "");
check(
  "A32",
  setsEqual(checkIds(harness), expectedIds(32)) &&
    harness.text.includes(
      "PASS: admin discovery source/status mutation diagnostic logging static assertions (32 assertions)",
    ) &&
    setsEqual(checkIds(catalog), expectedIds(24)) &&
    catalog.text.includes(
      "PASS: admin catalog route error boundary static assertions (24 assertions)",
    ) &&
    finalRouteIdentityLines.every((line) => catalog.text.includes(line)) &&
    catalog.text.includes(catalogConstants.trimEnd()) &&
    catalog.text.includes(catalogHarnessParse.trimEnd()) &&
    catalog.text.includes(catalogMarkerCheck.trim()) &&
    hashText(normalizedCatalog) === BASELINE_HASHES.get(CATALOG_PATH),
  "the catalog contract lost A01-A24, its 24-assertion marker, a final Phase 27GL identity, the Phase 27GL marker, or a previous invariant.",
);

process.stdout.write(
  "PASS: admin discovery source/status mutation diagnostic logging static assertions (32 assertions)\n",
);
