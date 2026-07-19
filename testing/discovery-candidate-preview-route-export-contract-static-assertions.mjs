#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const ROUTE_PATH =
  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts";
const HANDLER_PATH =
  "app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts";
const ROUTE_TEST_PATH = "testing/discovery-candidate-preview-route.test.mjs";
const SOURCE_AUTH_HARNESS_PATH =
  "testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs";
const AUTH_PATH = "lib/admin-auth-read-only.ts";
const PROVIDER_PATH =
  "lib/discovery/discovery-candidate-preview-provider.ts";
const SUPABASE_ADMIN_PATH =
  "lib/discovery/discovery-supabase-admin.ts";
const DATABASE_TYPES_PATH = "lib/supabase/database.types.ts";
const TYPESCRIPT_LOADER_PATH =
  "testing/register-typescript-test-loader.mjs";
const PROVIDER_TEST_PATH =
  "testing/discovery-candidate-preview-provider.test.mjs";
const LIVE_RESOLVER_PATH =
  "lib/discovery/discovery-candidate-preview-live-staging-resolver.ts";
const LIVE_RESOLVER_TEST_PATH =
  "testing/discovery-candidate-preview-live-staging-resolver.test.mjs";
const LIVE_PANEL_TEST_PATH =
  "testing/discovery-candidate-extraction-live-staging-panel.test.mjs";
const PHASE_27GC_HANDLER_PATH =
  "app/api/admin/discovery/candidate-staging-queue/handler.ts";
const PHASE_27GC_ROUTE_PATH =
  "app/api/admin/discovery/candidate-staging-queue/route.ts";
const PHASE_27GC_ADMIN_SHELL_PATH =
  "testing/admin-shell-supabase-read-hardening.test.mjs";
const PHASE_27GC_ROUTE_TEST_PATH =
  "testing/discovery-candidate-staging-queue-api-read-route.test.mjs";
const PHASE_27GC_HARNESS_PATH =
  "testing/discovery-candidate-staging-queue-read-route-export-contract-static-assertions.mjs";

const APP_ROUTER_RUNTIME_EXPORTS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "config",
  "generateStaticParams",
  "unstable_instant",
  "unstable_dynamicStaleTime",
  "revalidate",
  "dynamic",
  "dynamicParams",
  "fetchCache",
  "preferredRegion",
  "runtime",
  "maxDuration",
]);
const EXPECTED_ROUTE_RUNTIME_EXPORTS = new Set([
  "runtime",
  "dynamic",
  "GET",
]);
const EXPECTED_ROUTE_TYPE_EXPORTS = new Set([
  "CandidatePreviewRouteContext",
  "CandidatePreviewRouteDependencies",
]);
const HTTP_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);
const EXPECTED_HANDLER_MODULES = new Set([
  "server-only",
  "next/server",
  "../../../../../../../lib/admin-auth-read-only",
  "../../../../../../../lib/discovery/discovery-candidate-preview-provider",
]);
const EXPECTED_HANDLER_IMPORTS = new Set([
  "NextResponse",
  "getReadOnlyAdminSession",
  "getCandidateExtractionPreviewForRun",
  "CandidateExtractionPreviewInput",
  "CandidateExtractionPreviewResult",
]);
const EXPECTED_SEAMS = new Set([
  "verifySession",
  "getCandidatePreview",
]);
const EXPECTED_ROUTE_TEST_NAMES = new Set([
  "route exports GET only",
  "unauthenticated request returns 401 and does not call provider",
  "missing server-derived admin actor returns 403",
  "route derives admin actor from session id and ignores client query identity",
  "route falls back to session actor label when id is unavailable",
  "missing source id returns provider safe 400 result",
  "invalid or missing run id returns provider safe 400 result",
  "accepted provider result returns 200 with safe data wrapper",
  "unavailable provider result returns 200 application state",
  "blocked provider result returns 200 application state",
  "stale provider result returns 200 application state",
  "ambiguous provider result returns 200 application state",
  "provider exception returns generic 500",
  "route source stays read-only and avoids CSRF/staging helpers",
]);
const EXPECTED_SOURCE_HARNESS_MARKERS = new Set([
  "candidate_preview_route_imports_lib_admin_auth",
  "candidate_preview_route_imports_lib_admin_auth_read_only",
  "candidate_preview_route_uses_getReadOnlyAdminSession",
  "candidate_preview_route_async_returntype_recovered",
  "candidate_preview_route_awaits_verify_session",
  "read_only_helper_imports_lib_admin_auth",
  "read_only_helper_imports_supabase_or_service_role",
  "read_only_helper_exports_getReadOnlyAdminSession",
  "read_only_helper_actor_contract_object_shape",
  "read_only_helper_actor_label_contract_present",
  "read_only_helper_active_mutation_marker_count",
  "candidate_preview_route_active_mutation_marker_count",
  "read_only_helper_generic_db_mutation_marker_count",
  "candidate_preview_route_generic_db_mutation_marker_count",
  "read_only_helper_live_db_read_marker_count",
  "read_only_helper_network_or_response_mutation_marker_count",
]);
const EXPECTED_ARTIFACT_COLUMNS = [
  "id",
  "audit_correlation_id",
  "candidate_name",
  "candidate_website_url",
  "category_hint",
  "confidence_bucket",
  "created_at",
  "discovery_run_id",
  "discovery_source_id",
  "evidence_summary",
  "preview_generated_at",
  "preview_schema_version",
  "preview_status",
  "pricing_hint",
  "safety_flags",
  "source_evidence_locator",
  "source_url_snapshot",
  "updated_at",
];
const EXPECTED_PREVIEW_STATUSES = new Set([
  "unavailable",
  "pending_review",
  "reviewable",
  "blocked",
  "stale",
]);
const EXPECTED_PREVIEW_FIELDS = new Set([
  "candidateName",
  "candidateWebsiteUrl",
  "categoryHint",
  "pricingHint",
  "confidenceBucket",
  "evidenceSummary",
  "sourceEvidenceLocator",
  "sourceUrlSnapshot",
  "discoverySourceId",
  "discoveryRunId",
  "auditCorrelationId",
]);

const PROTECTED_HASHES = new Map([
  [AUTH_PATH, "b5f82ebf0923b610d4ade7bf4e53b6d622fd8c8eab37f61d2edb1e5d0defff38"],
  [PROVIDER_PATH, "9e5c3c4acb44a9e43c6ce3e86f5a8542af34a16f7e0bb266976b8804044bbd66"],
  [SUPABASE_ADMIN_PATH, "0c631c4e02ead5fe423c30a3c6126aa494fa8fd62d7a987ffd9fd7669c62eaf0"],
  [DATABASE_TYPES_PATH, "7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c"],
  [TYPESCRIPT_LOADER_PATH, "f0a6b1527278f16037ffdd29f0305bbd5e79f654fae2ae0c17ef28b4c7d38a08"],
  [PROVIDER_TEST_PATH, "885105d062e2680c0b506f97299c36dfb68bdfa4739e550a92c7838e36502099"],
  [LIVE_RESOLVER_PATH, "a8d2a048e4ca4424faa373435a816378c905209b2f7d0626c7bd6cf9fac5deb9"],
  [LIVE_RESOLVER_TEST_PATH, "f952d8be45df1c900be9a0a16cddd3de47e249dd40039789e5faa02152366e23"],
  [LIVE_PANEL_TEST_PATH, "ab64c825de9e665c1c0f015968b9305d4ffefdc60657bf31f99c3c90c81cd7ee"],
  [PHASE_27GC_HANDLER_PATH, "9a6b16457620721c57e33d0e9b4c4ee4e46abe9bbce81aa7a0d9809d80ae3754"],
  [PHASE_27GC_ROUTE_PATH, "088b8e51b73c9278508806523ae273235fbb6c5ec5d0b02c799f88578d0507e8"],
  [PHASE_27GC_ADMIN_SHELL_PATH, "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  [PHASE_27GC_ROUTE_TEST_PATH, "ce80eec655b466158f906dec382462998638c21fb43a422a53c219ddc3a54a99"],
  [PHASE_27GC_HARNESS_PATH, "a3ff6bfeaf8e05aded5ebbabbf512ed87d23db7295c0227b9d66b2a9e8890a90"],
]);

function fail(id, reason) {
  process.stderr.write(id + " fails because " + reason + "\n");
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function setsEqual(actual, expected) {
  return actual.size === expected.size &&
    [...actual].every((value) => expected.has(value));
}

function arraysEqual(actual, expected) {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function containsAll(text, markers) {
  return markers.every((marker) => text.includes(marker));
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const text = readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  return { absolutePath, relativePath, sourceFile, text };
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
}

function isExported(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
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

function first(root, predicate) {
  let match = null;
  walk(root, (node) => {
    if (!match && predicate(node)) match = node;
  });
  return match;
}

function nameText(name) {
  if (!name) return "";
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return name.getText().replace(/^['"]|['"]$/g, "");
}

function propertyMap(objectLiteral) {
  const properties = new Map();
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property) ||
        ts.isGetAccessorDeclaration(property) || ts.isSetAccessorDeclaration(property)) {
      properties.set(nameText(property.name), property);
    } else if (ts.isShorthandPropertyAssignment(property)) {
      properties.set(property.name.text, property);
    } else if (ts.isSpreadAssignment(property)) {
      properties.set("..." + property.expression.getText(), property);
    }
  }
  return properties;
}

function unwrapExpression(expression) {
  let current = expression;
  while (current && (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current))) {
    current = current.expression;
  }
  return current;
}

function callName(call) {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) return call.expression.name.text;
  return call.expression.getText();
}

function callsNamed(root, name) {
  return collect(root, (node) => ts.isCallExpression(node) && callName(node) === name);
}

function directPropertyCalls(root, names) {
  return collect(root, (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    names.has(node.expression.name.text));
}

function topLevelFunction(record, functionName) {
  return record.sourceFile.statements.find((statement) =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) ?? null;
}

function topLevelVariable(record, variableName) {
  for (const statement of record.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) {
        return { declaration, statement };
      }
    }
  }
  return null;
}

function topLevelTypeAlias(record, typeName) {
  return record.sourceFile.statements.find((statement) =>
    ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName) ?? null;
}

function typePropertyNames(typeAlias) {
  if (!typeAlias || !ts.isTypeLiteralNode(typeAlias.type)) return new Set();
  return new Set(typeAlias.type.members.filter(ts.isPropertySignature)
    .map((member) => nameText(member.name)));
}

function topLevelRuntimeExports(record) {
  const exports = new Set();
  for (const statement of record.sourceFile.statements) {
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
      }
      continue;
    }
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) && isExported(statement) &&
        !hasModifier(statement, ts.SyntaxKind.DeclareKeyword) && statement.name) {
      exports.add(statement.name.text);
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      exports.add("default");
      continue;
    }
    if (ts.isExportDeclaration(statement) && !statement.isTypeOnly &&
        statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (!element.isTypeOnly) exports.add(element.name.text);
      }
    }
  }
  return exports;
}

function topLevelTypeExports(record) {
  const exports = new Set();
  for (const statement of record.sourceFile.statements) {
    if ((ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
        isExported(statement)) {
      exports.add(statement.name.text);
      continue;
    }
    if (ts.isExportDeclaration(statement) && statement.exportClause &&
        ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (statement.isTypeOnly || element.isTypeOnly) exports.add(element.name.text);
      }
    }
  }
  return exports;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    modules.push(statement.moduleSpecifier.text);
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) names.add(element.name.text);
    }
  }
  return { modules, names };
}

function sideEffectServerOnlyIsFirst(record) {
  const statement = record.sourceFile.statements[0];
  return Boolean(statement && ts.isImportDeclaration(statement) &&
    !statement.importClause && ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === "server-only");
}

function getFactoryAndHandler(record) {
  const factory = topLevelFunction(record, "createCandidatePreviewRouteHandler");
  if (!factory?.body) return { factory, requestHandler: null };
  const returnStatement = first(factory.body, (node) =>
    ts.isReturnStatement(node) && Boolean(node.expression) &&
    (ts.isFunctionExpression(unwrapExpression(node.expression)) ||
     ts.isArrowFunction(unwrapExpression(node.expression))));
  return {
    factory,
    requestHandler: returnStatement?.expression
      ? unwrapExpression(returnStatement.expression)
      : null,
  };
}

function arrayLiteralStrings(variable) {
  let expression = variable?.declaration.initializer;
  if (expression && ts.isCallExpression(expression) &&
      ts.isPropertyAccessExpression(expression.expression) &&
      expression.expression.name.text === "join" &&
      expression.arguments.length === 1 &&
      ts.isStringLiteral(expression.arguments[0]) &&
      expression.arguments[0].text === ",") {
    expression = expression.expression.expression;
  }
  if (!expression || !ts.isArrayLiteralExpression(expression)) return [];
  return expression.elements.filter(ts.isStringLiteralLike).map((element) => element.text);
}

function setLiteralStrings(variable) {
  const expression = variable?.declaration.initializer;
  if (!expression || !ts.isNewExpression(expression) ||
      !ts.isIdentifier(expression.expression) || expression.expression.text !== "Set") {
    return new Set();
  }
  const argument = expression.arguments?.[0];
  if (!argument || !ts.isArrayLiteralExpression(argument)) return new Set();
  return new Set(argument.elements.filter(ts.isStringLiteralLike)
    .map((element) => element.text));
}

function functionText(record, name) {
  const fn = topLevelFunction(record, name);
  return fn ? fn.getText(record.sourceFile) : "";
}

function testNames(record) {
  return new Set(callsNamed(record.sourceFile, "test")
    .map((call) => call.arguments[0])
    .filter(ts.isStringLiteralLike)
    .map((argument) => argument.text));
}

// A01 reads and parses only route.ts. The handler and every other repository
// file are untouched until this assertion succeeds.
const route = parseFile(ROUTE_PATH);
const initialRuntimeExports = topLevelRuntimeExports(route);
const illegalRouteExports = [...initialRuntimeExports]
  .filter((name) => !APP_ROUTER_RUNTIME_EXPORTS.has(name))
  .sort();

if (illegalRouteExports.length > 0) {
  fail("A01", ROUTE_PATH + " exports non-App-Router runtime field " +
    illegalRouteExports[0] + ".");
}
check("A01", illegalRouteExports.length === 0,
  ROUTE_PATH + " has an invalid runtime export.");

const handler = parseFile(HANDLER_PATH);
const routeTest = parseFile(ROUTE_TEST_PATH, ts.ScriptKind.JS);
const sourceAuthHarness = parseFile(SOURCE_AUTH_HARNESS_PATH, ts.ScriptKind.JS);
const auth = parseFile(AUTH_PATH);
const provider = parseFile(PROVIDER_PATH);
const supabaseAdmin = parseFile(SUPABASE_ADMIN_PATH);
const providerTest = parseFile(PROVIDER_TEST_PATH, ts.ScriptKind.JS);
const liveResolver = parseFile(LIVE_RESOLVER_PATH);
const liveResolverTest = parseFile(LIVE_RESOLVER_TEST_PATH, ts.ScriptKind.JS);
const livePanelTest = parseFile(LIVE_PANEL_TEST_PATH, ts.ScriptKind.JS);
const phase27gcHandler = parseFile(PHASE_27GC_HANDLER_PATH);
const phase27gcRoute = parseFile(PHASE_27GC_ROUTE_PATH);
const phase27gcAdminShell = parseFile(PHASE_27GC_ADMIN_SHELL_PATH, ts.ScriptKind.JS);
const phase27gcRouteTest = parseFile(PHASE_27GC_ROUTE_TEST_PATH, ts.ScriptKind.JS);
const phase27gcHarness = parseFile(PHASE_27GC_HARNESS_PATH, ts.ScriptKind.JS);

const routeRuntimeExports = topLevelRuntimeExports(route);
const routeTypeExports = topLevelTypeExports(route);
const runtimeVariable = topLevelVariable(route, "runtime");
const dynamicVariable = topLevelVariable(route, "dynamic");
const getVariable = topLevelVariable(route, "GET");
check("A02",
  setsEqual(routeRuntimeExports, EXPECTED_ROUTE_RUNTIME_EXPORTS) &&
  setsEqual(routeTypeExports, EXPECTED_ROUTE_TYPE_EXPORTS) &&
  runtimeVariable?.declaration.initializer?.getText(route.sourceFile) === '"nodejs"' &&
  dynamicVariable?.declaration.initializer?.getText(route.sourceFile) === '"force-dynamic"' &&
  [...routeRuntimeExports].filter((name) => HTTP_METHODS.has(name)).length === 1,
  ROUTE_PATH + " does not preserve the exact runtime and type-only surface.");

const routeImports = importDetails(route);
const routeFactoryCalls = callsNamed(route.sourceFile, "createCandidatePreviewRouteHandler");
check("A03",
  routeImports.modules.length === 2 &&
  routeImports.modules[0] === "server-only" &&
  routeImports.modules[1] === "./handler" &&
  routeImports.names.size === 1 &&
  routeImports.names.has("createCandidatePreviewRouteHandler") &&
  routeFactoryCalls.length === 1 && routeFactoryCalls[0].arguments.length === 0 &&
  getVariable?.declaration.initializer === routeFactoryCalls[0],
  ROUTE_PATH + " does not wire GET to one zero-argument sibling factory call.");

check("A04",
  sideEffectServerOnlyIsFirst(handler) &&
  !route.text.includes('"use client"') && !route.text.includes("'use client'") &&
  !handler.text.includes('"use client"') && !handler.text.includes("'use client'"),
  HANDLER_PATH + " does not preserve the explicit server-only boundary.");

const { factory, requestHandler } = getFactoryAndHandler(handler);
const dependencyType = topLevelTypeAlias(handler, "CandidatePreviewRouteDependencies");
const dependencyMembers = dependencyType && ts.isTypeLiteralNode(dependencyType.type)
  ? dependencyType.type.members.filter(ts.isPropertySignature)
  : [];
check("A05",
  Boolean(factory && requestHandler) && isExported(factory) &&
  factory.parameters.length === 1 &&
  factory.parameters[0].name.getText(handler.sourceFile) === "dependencies" &&
  factory.parameters[0].type?.getText(handler.sourceFile) ===
    "CandidatePreviewRouteDependencies" &&
  factory.parameters[0].initializer?.getText(handler.sourceFile) === "{}" &&
  ts.isFunctionExpression(requestHandler) &&
  requestHandler.name?.text === "candidatePreviewRouteHandler" &&
  hasModifier(requestHandler, ts.SyntaxKind.AsyncKeyword) &&
  requestHandler.parameters.length === 2 &&
  requestHandler.parameters[0].type?.getText(handler.sourceFile) === "Request" &&
  requestHandler.parameters[1].type?.getText(handler.sourceFile) ===
    "CandidatePreviewRouteContext" &&
  setsEqual(typePropertyNames(dependencyType), EXPECTED_SEAMS) &&
  dependencyMembers.every((member) => Boolean(member.questionToken)) &&
  setsEqual(topLevelRuntimeExports(handler),
    new Set(["createCandidatePreviewRouteHandler"])) &&
  setsEqual(topLevelTypeExports(handler), EXPECTED_ROUTE_TYPE_EXPORTS),
  HANDLER_PATH + " does not preserve the factory, handler, and two-seam contract.");

const handlerImports = importDetails(handler);
const directPrivilegedMarkers = [
  "@supabase/supabase-js", "createDiscoverySupabaseAdminClient",
  "SUPABASE_SERVICE_ROLE_KEY", ".insert(", ".update(", ".upsert(",
  ".delete(", ".rpc(", "storage.", "createAdminAuditLog",
  "stageNormalizedDiscoveryCandidate", "public.tools", "discovered_tools",
];
check("A06",
  setsEqual(new Set(handlerImports.modules), EXPECTED_HANDLER_MODULES) &&
  setsEqual(handlerImports.names, EXPECTED_HANDLER_IMPORTS) &&
  !directPrivilegedMarkers.some((marker) => handler.text.includes(marker)) &&
  !["getReadOnlyAdminSession", "getCandidateExtractionPreviewForRun",
    "supabase", "service-role", "service_role", "storage", "audit", "stage"]
    .some((marker) => route.text.includes(marker)),
  "the thin route or handler direct import graph expanded beyond the approved boundary.");

const handlerText = requestHandler ? requestHandler.getText(handler.sourceFile) : "";
const verifyCalls = requestHandler ? callsNamed(requestHandler, "verifySession") : [];
const adminPosition = handlerText.indexOf(
  "const adminSession = await verifySession(request)");
const paramsPosition = handlerText.indexOf("const params = await context.params");
const urlPosition = handlerText.indexOf("new URL(request.url)");
const providerSelectionPosition = handlerText.indexOf("const getCandidatePreview");
const providerCallPosition = handlerText.indexOf(
  "const result = await getCandidatePreview");
check("A07",
  verifyCalls.length === 1 && ts.isAwaitExpression(verifyCalls[0].parent) &&
  adminPosition >= 0 && providerSelectionPosition > adminPosition &&
  paramsPosition > adminPosition && urlPosition > adminPosition &&
  providerCallPosition > adminPosition,
  "authentication is not awaited exactly once before parsing and provider work.");

const unauthorizedIf = requestHandler
  ? collect(requestHandler, ts.isIfStatement).find((statement) =>
      compact(statement.expression.getText(handler.sourceFile))
        .includes("!adminSession.isAdmin||!adminSession.actor"))
  : null;
const unauthorizedText = unauthorizedIf
  ? compact(unauthorizedIf.getText(handler.sourceFile))
  : "";
const unauthorizedConsoleCalls = unauthorizedIf
  ? callsNamed(unauthorizedIf, "warn")
  : [];
const unauthorizedArgs = unauthorizedConsoleCalls[0]?.arguments ?? [];
const unauthorizedObject = unauthorizedArgs[1] &&
  ts.isObjectLiteralExpression(unauthorizedArgs[1])
  ? propertyMap(unauthorizedArgs[1])
  : new Map();
check("A08",
  Boolean(unauthorizedIf) && unauthorizedConsoleCalls.length === 1 &&
  unauthorizedArgs.length === 2 &&
  unauthorizedArgs[0].getText(handler.sourceFile) ===
    '"Unauthorized candidate preview request."' &&
  unauthorizedObject.size === 1 && unauthorizedObject.has("errors") &&
  compact(unauthorizedObject.get("errors").getText(handler.sourceFile)) ===
    "errors:adminSession.errors" &&
  unauthorizedText.includes('returnjsonResponse({error:"Unauthorized"},401)') &&
  callsNamed(unauthorizedIf, "getCandidatePreview").length === 0,
  "the unauthorized predicate, warning, 401 response, or fail-closed branch changed.");

const actorFunction = functionText(handler, "getServerDerivedAdminActorId");
const missingIdentityIf = requestHandler
  ? collect(requestHandler, ts.isIfStatement).find((statement) =>
      compact(statement.expression.getText(handler.sourceFile))
        .includes("!requestingAdminActorId"))
  : null;
const missingIdentityText = missingIdentityIf
  ? compact(missingIdentityIf.getText(handler.sourceFile))
  : "";
check("A09",
  containsAll(compact(actorFunction), [
    'typeofactor.id==="string"?actor.id.trim():""', "if(actorId)returnactorId",
    'typeofactor.label==="string"?actor.label.trim():""', "returnactorLabel||null",
  ]) &&
  missingIdentityText.includes('error:"Authenticatedadminidentityisunavailable."') &&
  missingIdentityText.includes('code:"missing_admin_identity"') &&
  missingIdentityText.includes(",403") &&
  !compact(handlerText).includes("requestingAdminActorId:searchParams") &&
  !compact(handlerText).includes("requestingAdminActorId:params") &&
  !compact(handlerText).includes("requestingAdminActorId:request"),
  "server-derived actor identity or the fixed missing-identity response changed.");

const combinedRouteHandler = route.text + "\n" + handler.text;
const routeMethods = [...routeRuntimeExports].filter((name) => HTTP_METHODS.has(name));
check("A10",
  arraysEqual(routeMethods.sort(), ["GET"]) &&
  !combinedRouteHandler.includes("request.json(") &&
  !["verifyAdminCsrfRequest", "checkAdminRateLimit", "createAdminAuditLog",
    "invokeCandidateExtractionStagingPipeline", "stageNormalizedDiscoveryCandidate",
    "export const POST", "export const PUT", "export const PATCH",
    "export const DELETE"].some((marker) => combinedRouteHandler.includes(marker)),
  "the GET-only read boundary gained body, CSRF, rate-limit, audit, or mutation behavior.");

const newUrlExpressions = requestHandler ? collect(requestHandler, (node) =>
  ts.isNewExpression(node) && ts.isIdentifier(node.expression) &&
  node.expression.text === "URL") : [];
const searchParamGets = requestHandler ? collect(requestHandler, (node) =>
  ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "get" &&
  node.expression.expression.getText(handler.sourceFile) === "searchParams") : [];
check("A11",
  paramsPosition >= 0 && newUrlExpressions.length === 1 &&
  newUrlExpressions[0].arguments?.length === 1 &&
  newUrlExpressions[0].arguments[0].getText(handler.sourceFile) === "request.url" &&
  searchParamGets.length === 1 &&
  searchParamGets[0].arguments[0]?.getText(handler.sourceFile) === '"source_id"' &&
  !["request.json(", "request.text(", "request.formData(", "request.cookies"]
    .some((marker) => handlerText.includes(marker)),
  "route ID and source_id are not the exclusive request input envelope.");

const providerCalls = requestHandler ? callsNamed(requestHandler, "getCandidatePreview") : [];
const providerInput = providerCalls[0]?.arguments[0] &&
  ts.isObjectLiteralExpression(providerCalls[0].arguments[0])
  ? propertyMap(providerCalls[0].arguments[0])
  : new Map();
check("A12",
  providerCalls.length === 1 && providerInput.size === 3 &&
  setsEqual(new Set(providerInput.keys()),
    new Set(["discoveryRunId", "discoverySourceId", "requestingAdminActorId"])) &&
  [...providerInput.keys()].every((key) => {
    const property = providerInput.get(key);
    return ts.isShorthandPropertyAssignment(property) && property.name.text === key;
  }),
  "the provider invocation is not one exact three-field server-mapped call.");

const statusFunction = compact(functionText(handler, "getProviderResultHttpStatus"));
const mappedResultResponses = requestHandler
  ? callsNamed(requestHandler, "jsonResponse").filter((call) => {
      const [dataArgument, statusArgument] = call.arguments;
      if (!dataArgument || !ts.isObjectLiteralExpression(dataArgument) ||
          !statusArgument || !ts.isCallExpression(statusArgument) ||
          !ts.isIdentifier(statusArgument.expression) ||
          statusArgument.expression.text !== "getProviderResultHttpStatus") {
        return false;
      }

      const dataProperties = propertyMap(dataArgument);
      const resultProperty = dataProperties.get("data");
      return dataProperties.size === 1 &&
        resultProperty && ts.isPropertyAssignment(resultProperty) &&
        resultProperty.initializer.getText(handler.sourceFile) === "result" &&
        statusArgument.arguments.length === 1 &&
        statusArgument.arguments[0].getText(handler.sourceFile) === "result";
    })
  : [];
check("A13",
  containsAll(statusFunction, [
    "if(!result.rejected)return200",
    'result.rejectionCode==="missing_admin_actor"', "return403",
    'result.rejectionCode==="missing_discovery_run_id"',
    'result.rejectionCode==="missing_discovery_source_id"',
    "return400", "return200",
  ]) && mappedResultResponses.length === 1,
  "provider result wrapping or HTTP status mapping changed.");

const dynamicImports = collect(provider.sourceFile, (node) =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword);
check("A14",
  sideEffectServerOnlyIsFirst(provider) && sideEffectServerOnlyIsFirst(supabaseAdmin) &&
  dynamicImports.length === 1 &&
  dynamicImports[0].arguments[0]?.getText(provider.sourceFile) ===
    '"./discovery-supabase-admin"' &&
  callsNamed(provider.sourceFile, "createDiscoverySupabaseAdminClient").length === 1 &&
  callsNamed(supabaseAdmin.sourceFile, "createClient").length === 1 &&
  !combinedRouteHandler.includes("createDiscoverySupabaseAdminClient") &&
  !combinedRouteHandler.includes("createClient"),
  "the server-only dynamic privileged-client boundary changed.");

const providerImplementation = functionText(
  provider, "getCandidateExtractionPreviewForRunWithDependencies");
const compactProviderImplementation = compact(providerImplementation);
const providerValidationEnd = compactProviderImplementation.indexOf("try{");
const firstProviderRead = compactProviderImplementation.indexOf(
  "dependencies.loadDiscoveryRun");
check("A15",
  containsAll(compactProviderImplementation, [
    "normalizeUuid(input.discoveryRunId)",
    "normalizeUuid(input.discoverySourceId)",
    "input.requestingAdminActorId.trim()",
    "input?.expectedSchemaVersion??CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION",
    'rejectPreview("missing_discovery_run_id")',
    'rejectPreview("missing_discovery_source_id"',
    'rejectPreview("missing_admin_actor"',
  ]) &&
  provider.text.includes('"candidate_preview_artifact.v2"') &&
  providerValidationEnd >= 0 && firstProviderRead > providerValidationEnd,
  "provider UUID, actor, schema, or pre-query validation changed.");

const defaultDependencies = functionText(
  provider, "createDefaultCandidatePreviewDependencies");
const compactDefaultDependencies = compact(defaultDependencies);
check("A16",
  containsAll(compactDefaultDependencies, [
    '.from("discovery_runs").select("id,source_id,status,updated_at").eq("id",discoveryRunId).maybeSingle()',
    '.from("discovery_sources").select("id,url,source_type,updated_at").eq("id",discoverySourceId).maybeSingle()',
  ]) &&
  containsAll(compactProviderImplementation, [
    "construn=awaitdependencies.loadDiscoveryRun(discoveryRunId)",
    "run.id!==discoveryRunId||run.source_id!==discoverySourceId",
    "source=awaitdependencies.loadDiscoverySource(discoverySourceId)",
    "!source||source.id!==discoverySourceId",
  ]) &&
  compactProviderImplementation.indexOf("run.source_id!==discoverySourceId") <
    compactProviderImplementation.indexOf("dependencies.loadPreviewArtifacts"),
  "run/source projections, exact reads, or binding order changed.");

const artifactColumns = arrayLiteralStrings(
  topLevelVariable(provider, "PREVIEW_ARTIFACT_SELECT_COLUMNS"));
check("A17",
  arraysEqual(artifactColumns, EXPECTED_ARTIFACT_COLUMNS) &&
  containsAll(compactDefaultDependencies, [
    '.from("discovery_candidate_preview_artifacts")',
    ".select(PREVIEW_ARTIFACT_SELECT_COLUMNS)",
    '.eq("discovery_run_id",discoveryRunId)',
    '.eq("discovery_source_id",discoverySourceId)',
    '.order("created_at",{ascending:false})', ".limit(10)",
  ]) &&
  !provider.text.includes('select("*")') &&
  !provider.text.includes(".select(" + String.fromCharCode(96)) &&
  !provider.text.includes("!inner"),
  "artifact table, exact 18-column projection, filters, ordering, or limit changed.");

const previewStatuses = setLiteralStrings(
  topLevelVariable(provider, "ALLOWED_PREVIEW_STATUSES"));
const artifactSelection = compact(functionText(provider, "chooseArtifactResult"));
const artifactValidation = compact(functionText(provider, "validateReviewableArtifact"));
check("A18",
  setsEqual(previewStatuses, EXPECTED_PREVIEW_STATUSES) &&
  containsAll(artifactSelection, [
    'artifact.preview_status==="reviewable"', "if(reviewableArtifacts.length>1)",
    'rejectPreview("preview_artifact_ambiguous"',
    "if(reviewableArtifacts.length===1)",
    'rejectPreview("preview_artifact_unavailable"',
    'rejectPreview("preview_artifact_blocked"',
    'rejectPreview("preview_artifact_stale"',
  ]) &&
  containsAll(artifactValidation, [
    "artifact.preview_schema_version!==input.expectedSchemaVersion",
    "artifact.discovery_run_id!==input.discoveryRunId",
    "artifact.discovery_source_id!==input.discoverySourceId",
    "hasBlockingSafetyFlags(artifact.safety_flags)",
    "runUpdatedAt>previewGeneratedAt",
  ]),
  "artifact state, lineage, schema, ambiguity, blocking, or freshness checks changed.");

const safetyFlagsFunction = compact(functionText(provider, "hasValidSafetyFlags"));
const safeUrlFunction = compact(functionText(provider, "getSafeHttpsUrl"));
const artifactValidationFunction = topLevelFunction(
  provider, "validateReviewableArtifact");
const requiredTextCalls = artifactValidationFunction
  ? callsNamed(artifactValidationFunction, "getSafeRequiredText")
  : [];
const optionalTextCalls = artifactValidationFunction
  ? callsNamed(artifactValidationFunction, "getSafeOptionalText")
  : [];
const hasBoundedTextCall = (calls, valueExpression, maximum) =>
  calls.some((call) => call.arguments.length === 2 &&
    call.arguments[0].getText(provider.sourceFile) === valueExpression &&
    ts.isNumericLiteral(call.arguments[1]) &&
    Number(call.arguments[1].text) === maximum);
check("A19",
  containsAll(safeUrlFunction, [
    "trimmed.length>2048", 'parsed.protocol!=="https:"',
    "isPrivateOrLocalHost(parsed.hostname)",
  ]) &&
  containsAll(safetyFlagsFunction, [
    "flags.length<=24", "flag.length<=80", "ALLOWED_SAFETY_FLAGS.has(flag)",
  ]) &&
  containsAll(artifactValidation, [
    "ALLOWED_CATEGORY_HINTS", "ALLOWED_PRICING_HINTS",
    "ALLOWED_CONFIDENCE_BUCKETS", "parentSourceUrl!==sourceUrlSnapshot",
    "sourceUrlSnapshot===candidateWebsiteUrl",
  ]) &&
  hasBoundedTextCall(requiredTextCalls, "artifact.candidate_name", 160) &&
  hasBoundedTextCall(
    requiredTextCalls, "artifact.source_evidence_locator", 160) &&
  hasBoundedTextCall(optionalTextCalls, "artifact.evidence_summary", 1000) &&
  containsAll(provider.text, [
    "ALLOWED_SAFETY_FLAGS", "containsUnsafePayload",
    "raw_payload", "service[_-]?role",
  ]),
  "preview sanitization bounds, allowlists, URL checks, or raw-payload blocks changed.");

const previewType = topLevelTypeAlias(provider, "CandidateExtractionPreview");
const previewFields = typePropertyNames(previewType);
const resultType = topLevelTypeAlias(provider, "CandidateExtractionPreviewResult");
const resultText = resultType ? compact(resultType.getText(provider.sourceFile)) : "";
check("A20",
  setsEqual(previewFields, EXPECTED_PREVIEW_FIELDS) &&
  containsAll(resultText, [
    "accepted:true", "rejected:false", "rejectionCode:null",
    'previewStatus:"reviewable"', "accepted:false", "rejected:true",
    "preview:null", "noPublicWriteConfirmed:true",
    "noDiscoveredWriteConfirmed:true",
  ]) &&
  !["sqlstate", "SUPABASE_SERVICE_ROLE_KEY", "stack:", "cookie:",
    "rawHtml", "rawModelOutput"].some((marker) => resultText.includes(marker)),
  "the safe provider result and preview field shapes changed.");

const forbiddenMutationNames = new Set([
  "insert", "update", "upsert", "delete", "rpc", "upload", "remove",
]);
const privilegedSources = [route, handler, provider, supabaseAdmin];
const forbiddenMutationCalls = privilegedSources.flatMap((record) =>
  directPropertyCalls(record.sourceFile, forbiddenMutationNames));
const fromCalls = directPropertyCalls(provider.sourceFile, new Set(["from"]));
const fromTables = new Set(fromCalls.map((call) => call.arguments[0])
  .filter(ts.isStringLiteralLike).map((argument) => argument.text));
check("A21",
  forbiddenMutationCalls.length === 0 &&
  setsEqual(fromTables, new Set([
    "discovery_runs", "discovery_sources",
    "discovery_candidate_preview_artifacts",
  ])) &&
  !["createAdminAuditLog", "public.tools", "discovered_tools", ".storage",
    "publish"].some((marker) =>
      privilegedSources.some((record) => record.text.includes(marker))),
  "the read-only privileged boundary gained a mutation, table, audit, storage, or publishing path.");

const jsonResponseFunction = topLevelFunction(handler, "jsonResponse");
const nextResponseCalls = callsNamed(handler.sourceFile, "json");
const handlerReturnStatements = requestHandler
  ? collect(requestHandler, ts.isReturnStatement).filter((statement) => statement.expression)
  : [];
check("A22",
  Boolean(jsonResponseFunction) && nextResponseCalls.length === 1 &&
  ts.isPropertyAccessExpression(nextResponseCalls[0].expression) &&
  nextResponseCalls[0].expression.expression.getText(handler.sourceFile) ===
    "NextResponse" &&
  jsonResponseFunction.getText(handler.sourceFile).includes(
    '"Cache-Control": "no-store"') &&
  jsonResponseFunction.getText(handler.sourceFile).includes(
    '"X-Content-Type-Options": "nosniff"') &&
  handlerReturnStatements.length === 4 &&
  handlerReturnStatements.every((statement) =>
    ts.isCallExpression(unwrapExpression(statement.expression)) &&
    callName(unwrapExpression(statement.expression)) === "jsonResponse"),
  "responses do not all use the single no-store/nosniff JSON helper.");

const rejectionType = topLevelTypeAlias(
  provider, "CandidateExtractionPreviewRejectionCode");
const rejectionText = rejectionType ? rejectionType.getText(provider.sourceFile) : "";
check("A23",
  containsAll(handler.text, [
    '{ error: "Unauthorized" }, 401',
    'error: "Authenticated admin identity is unavailable."',
    'code: "missing_admin_identity"',
    '{ error: "Candidate preview request failed." }, 500',
    '"missing_admin_actor"', '"missing_discovery_run_id"',
    '"missing_discovery_source_id"',
  ]) &&
  rejectionText.includes('"preview_artifact_unavailable"') &&
  rejectionText.includes('"preview_source_url_drift"') &&
  !["error.message", "error.stack", "error.cause", "error.details",
    "error.hint", "caught.message", "caught.stack"]
    .some((marker) => handler.text.includes(marker)),
  "public error taxonomy, status mapping, or unexpected-error secrecy changed.");

const consoleCalls = [route, handler].flatMap((record) =>
  collect(record.sourceFile, (node) =>
    ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(record.sourceFile) === "console"));
const handlerCatches = requestHandler ? collect(requestHandler, ts.isCatchClause) : [];
const providerFunction = topLevelFunction(
  provider, "getCandidateExtractionPreviewForRunWithDependencies");
const providerCatches = providerFunction
  ? collect(providerFunction, ts.isCatchClause)
  : [];
const handlerThrows = requestHandler ? collect(requestHandler, ts.isThrowStatement) : [];
check("A24",
  consoleCalls.length === 1 && callName(consoleCalls[0]) === "warn" &&
  handlerCatches.length === 1 && !handlerCatches[0].variableDeclaration &&
  providerCatches.length === 1 && !providerCatches[0].variableDeclaration &&
  handlerThrows.length === 0 && adminPosition >= 0 &&
  handlerText.indexOf("if (!adminSession.isAdmin") > adminPosition &&
  handlerText.indexOf("const requestingAdminActorId") >
    handlerText.indexOf("if (!adminSession.isAdmin") &&
  paramsPosition > handlerText.indexOf("const requestingAdminActorId") &&
  providerCallPosition > paramsPosition &&
  handlerText.indexOf("return jsonResponse(\n        { data: result }") >
    providerCallPosition,
  "logging, catch boundaries, or auth-to-response fail-closed ordering changed.");

const currentRouteTestNames = testNames(routeTest);
const testFactoryCalls = callsNamed(
  routeTest.sourceFile, "createCandidatePreviewRouteHandler");
const testFactoryInput = testFactoryCalls[0]?.arguments[0] &&
  ts.isObjectLiteralExpression(testFactoryCalls[0].arguments[0])
  ? propertyMap(testFactoryCalls[0].arguments[0])
  : new Map();
const dynamicTestImports = collect(routeTest.sourceFile, (node) =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword);
check("A25",
  setsEqual(currentRouteTestNames, EXPECTED_ROUTE_TEST_NAMES) &&
  currentRouteTestNames.size === 14 && testFactoryCalls.length === 1 &&
  setsEqual(new Set(testFactoryInput.keys()), EXPECTED_SEAMS) &&
  routeTest.text.includes("handlerSource") &&
  routeTest.text.includes("routeSource") &&
  routeTest.text.includes("transpileModule") &&
  routeTest.text.includes("writeFileSync") &&
  routeTest.text.includes("unlinkSync") &&
  routeTest.text.includes(
    'import { createCandidatePreviewRouteHandler } from "./handler";') &&
  routeTest.text.includes(
    "export const GET = createCandidatePreviewRouteHandler();") &&
  dynamicTestImports.every((call) =>
    !call.arguments[0]?.getText(routeTest.sourceFile).includes(
      "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts")) &&
  containsAll(routeTest.text, [
    "assertNoRawPayloadLeak", ".insert(", ".upsert(", ".update(", ".delete(",
    "verifySession", "getCandidatePreview",
  ]),
  "the 14-case transformed-handler test seam or thin-route source checks changed.");

const sourceHarnessMarkers = new Set(
  callsNamed(sourceAuthHarness.sourceFile, "assertEquals")
    .map((call) => call.arguments[0]).filter(ts.isStringLiteralLike)
    .map((argument) => argument.text));
check("A26",
  setsEqual(sourceHarnessMarkers, EXPECTED_SOURCE_HARNESS_MARKERS) &&
  sourceHarnessMarkers.size === 16 &&
  sourceAuthHarness.text.includes(HANDLER_PATH) &&
  sourceAuthHarness.text.includes(ROUTE_PATH) &&
  sourceAuthHarness.text.includes("candidatePreviewHandlerSource") &&
  sourceAuthHarness.text.includes('print("result", "passed")') &&
  testNames(providerTest).size === 21 &&
  testNames(liveResolverTest).size === 8 &&
  testNames(livePanelTest).size === 10 &&
  sha256(PROVIDER_TEST_PATH) === PROTECTED_HASHES.get(PROVIDER_TEST_PATH) &&
  sha256(LIVE_RESOLVER_TEST_PATH) ===
    PROTECTED_HASHES.get(LIVE_RESOLVER_TEST_PATH) &&
  sha256(LIVE_PANEL_TEST_PATH) === PROTECTED_HASHES.get(LIVE_PANEL_TEST_PATH),
  "the source-auth markers or protected 21/8/10 indirect test surfaces changed.");

check("A27",
  [...PROTECTED_HASHES].every(([relativePath, expectedHash]) =>
    sha256(relativePath) === expectedHash) &&
  sideEffectServerOnlyIsFirst(phase27gcHandler) &&
  setsEqual(topLevelRuntimeExports(phase27gcRoute),
    new Set(["runtime", "dynamic", "GET"])) &&
  phase27gcAdminShell.text.includes(PHASE_27GC_HANDLER_PATH) &&
  phase27gcRouteTest.text.includes("createCandidateStagingQueueReadHandler") &&
  phase27gcHarness.text.includes(
    "PASS: candidate staging queue read route export contract static assertions (28 assertions)"),
  "a protected dependency or Phase 27GC closure identity changed.");

process.stdout.write(
  "PASS: candidate preview route export contract static assertions (27 assertions)\n");
