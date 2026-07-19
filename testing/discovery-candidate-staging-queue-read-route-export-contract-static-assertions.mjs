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
  "app/api/admin/discovery/candidate-staging-queue/route.ts";
const HANDLER_PATH =
  "app/api/admin/discovery/candidate-staging-queue/handler.ts";
const ROUTE_TEST_PATH =
  "testing/discovery-candidate-staging-queue-api-read-route.test.mjs";
const ADMIN_SHELL_TEST_PATH =
  "testing/admin-shell-supabase-read-hardening.test.mjs";
const AUTH_PATH = "lib/admin-auth.ts";
const READ_MODEL_PATH =
  "lib/discovery/discovery-candidate-staging-queue-read-model.ts";
const CURSOR_PATH =
  "lib/discovery/discovery-candidate-staging-queue-cursor.ts";
const SUPABASE_ADMIN_PATH = "lib/supabase-admin.ts";
const READ_MODEL_TEST_PATH =
  "testing/discovery-candidate-staging-queue-read-model.test.mjs";
const CURSOR_TEST_PATH =
  "testing/discovery-candidate-staging-queue-cursor.test.mjs";
const PHASE_27GB_ROUTE_PATH =
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts";
const PHASE_27GB_HARNESS_PATH =
  "testing/discovery-candidate-decision-route-export-contract-static-assertions.mjs";

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
  "CandidateStagingQueueApiReadResponse",
  "CandidateStagingQueueApiReadErrorResponse",
]);
const HTTP_METHODS = [
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];
const EXPECTED_SEAMS = new Set([
  "verifyAdminSession",
  "getClient",
  "listQueueItems",
]);
const EXPECTED_QUERY_PARAMETERS = new Set([
  "statuses",
  "limit",
  "search",
  "discoverySourceId",
  "discoveryRunId",
  "auditCorrelationId",
  "duplicateCheckStatus",
  "confidenceBucket",
  "cursor",
  "sortKey",
  "sortDirection",
]);
const EXPECTED_ACTIVE_STATUSES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
];
const EXPECTED_SAFE_COLUMNS = [
  "id",
  "candidate_name",
  "candidate_status",
  "candidate_website_url",
  "candidate_category_hint",
  "candidate_pricing_hint",
  "candidate_description",
  "confidence_bucket",
  "duplicate_check_status",
  "duplicate_signal_types",
  "risk_flags",
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "source_url",
  "source_domain",
  "source_evidence_kind",
  "source_evidence_locator",
  "created_at",
  "updated_at",
];
const EXPECTED_ITEM_FIELDS = new Set([
  "candidateId",
  "candidateName",
  "candidateStatus",
  "candidateWebsiteUrl",
  "candidateCategoryHint",
  "candidatePricingHint",
  "candidateDescription",
  "confidenceBucket",
  "duplicateCheckStatus",
  "duplicateSignalTypes",
  "riskFlags",
  "discoverySourceId",
  "discoveryRunId",
  "auditCorrelationId",
  "sourceUrl",
  "sourceDomain",
  "sourceEvidenceKind",
  "sourceEvidenceLocator",
  "createdAt",
  "updatedAt",
]);
const EXPECTED_SUCCESS_FIELDS = new Set([
  "ok",
  "items",
  "nextCursor",
  "hasNextPage",
  "limit",
  "sortKey",
  "sortDirection",
  "totalCount",
  "appliedStatuses",
]);
const EXPECTED_ROUTE_TEST_NAMES = new Set([
  "GET unauthenticated request fails with 401 unauthorized before client creation",
  "GET admin request calls listDiscoveryCandidateStagingQueueItems with defaults",
  "GET comma-separated statuses are parsed for the helper",
  "GET optional filters are passed through to the helper",
  "GET archived status maps helper invalid_status_filter to 400",
  "GET rejected status maps helper invalid_status_filter to 400",
  "GET invalid limit maps helper invalid_limit to 400",
  "GET invalid sortKey maps helper invalid_sort_key to 400",
  "GET invalid sortDirection maps helper invalid_sort_direction to 400",
  "GET invalid UUID maps helper invalid_uuid_filter to 400",
  "GET cursor maps helper cursor errors to 400 safely",
  "GET helper failure maps to 500 candidate_queue_read_failed safely",
  "GET unknown helper error maps to 500 candidate_queue_read_failed safely",
  "route source keeps GET-only and mutation-free boundaries",
]);

const PROTECTED_HASHES = new Map([
  [
    AUTH_PATH,
    "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc",
  ],
  [
    READ_MODEL_PATH,
    "f1e32581f8e3960dd9b41ea52615bf56b23141bfe7a4e9a1d82b3ac5da1de765",
  ],
  [
    CURSOR_PATH,
    "59dea937168c3fa72e2d11997d66965bffded2619f539682bd6dce638e9afaf5",
  ],
  [
    SUPABASE_ADMIN_PATH,
    "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae",
  ],
  [
    READ_MODEL_TEST_PATH,
    "2f759bcb0639364918098d4716edda09c83bf46fb950a441caa8231399c45381",
  ],
  [
    CURSOR_TEST_PATH,
    "81e0decaa264b3229a947d3b173a0e72d69076b60a7adee4080649fb8ceb028b",
  ],
  [
    PHASE_27GB_ROUTE_PATH,
    "f42eb9f67823bcd5e0797e7d52991eb64fe8a4caec72f06c0cc52041a1a4e3fb",
  ],
  [
    PHASE_27GB_HARNESS_PATH,
    "ad3d3cdd2773eba2aa62cd04b14a194c77e110699591d7be302414c13934f59d",
  ],
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
  return (
    actual.size === expected.size &&
    [...actual].every((value) => expected.has(value))
  );
}

function arraysEqual(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
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

function nodeText(node, record) {
  return node.getText(record.sourceFile);
}

function nameText(name) {
  if (!name) return "";
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  return name.getText().replace(/^['"]|['"]$/g, "");
}

function propertyMap(objectLiteral) {
  const properties = new Map();
  for (const property of objectLiteral.properties) {
    if (
      ts.isPropertyAssignment(property) ||
      ts.isMethodDeclaration(property) ||
      ts.isGetAccessorDeclaration(property) ||
      ts.isSetAccessorDeclaration(property)
    ) {
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
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current))
  ) {
    current = current.expression;
  }
  return current;
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

function directPropertyCalls(root, names) {
  return collect(
    root,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      names.has(node.expression.name.text),
  );
}

function receiverPropertyCalls(root, receiver, names, record) {
  return collect(
    root,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      compact(node.expression.expression.getText(record.sourceFile)) ===
        receiver &&
      names.has(node.expression.name.text),
  );
}

function topLevelVariable(record, variableName) {
  for (const statement of record.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        return { declaration, statement };
      }
    }
  }
  return null;
}

function variableWithin(root, variableName) {
  return first(
    root,
    (node) =>
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName,
  );
}

function topLevelFunction(record, functionName) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) &&
        statement.name?.text === functionName,
    ) ?? null
  );
}

function topLevelTypeAlias(record, typeName) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName,
    ) ?? null
  );
}

function typePropertyNames(typeAlias) {
  if (!typeAlias || !ts.isTypeLiteralNode(typeAlias.type)) return new Set();
  return new Set(
    typeAlias.type.members
      .filter(ts.isPropertySignature)
      .map((member) => nameText(member.name)),
  );
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
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      isExported(statement) &&
      !hasModifier(statement, ts.SyntaxKind.DeclareKeyword) &&
      statement.name
    ) {
      exports.add(statement.name.text);
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      exports.add("default");
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
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
    if (
      (ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement)) &&
      isExported(statement)
    ) {
      exports.add(statement.name.text);
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (statement.isTypeOnly || element.isTypeOnly) {
          exports.add(element.name.text);
        }
      }
    }
  }
  return exports;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    modules.push(statement.moduleSpecifier.text);
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

function sideEffectServerOnlyIsFirst(record) {
  const firstStatement = record.sourceFile.statements[0];
  return Boolean(
    firstStatement &&
      ts.isImportDeclaration(firstStatement) &&
      !firstStatement.importClause &&
      ts.isStringLiteral(firstStatement.moduleSpecifier) &&
      firstStatement.moduleSpecifier.text === "server-only",
  );
}

function getFactoryAndRequestHandler(record) {
  const factory = topLevelFunction(
    record,
    "createCandidateStagingQueueReadHandler",
  );
  if (!factory?.body) return { factory, requestHandler: null };
  const returnStatement = factory.body.statements.find(ts.isReturnStatement);
  const expression = returnStatement?.expression
    ? unwrapExpression(returnStatement.expression)
    : null;
  const requestHandler =
    expression && ts.isFunctionExpression(expression) ? expression : null;
  return { factory, requestHandler };
}

function ifStatementContaining(root, marker, record) {
  return (
    collect(root, ts.isIfStatement).find((statement) =>
      compact(nodeText(statement.expression, record)).includes(marker),
    ) ?? null
  );
}

function stringLiteral(value) {
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)
    ? value.text
    : null;
}

function numericLiteral(value) {
  const expression = value ? unwrapExpression(value) : null;
  return expression && ts.isNumericLiteral(expression)
    ? Number(expression.text)
    : null;
}

function arrayLiteralStrings(variable) {
  const initializer = variable?.declaration.initializer
    ? unwrapExpression(variable.declaration.initializer)
    : null;
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) return [];
  return initializer.elements.map(stringLiteral);
}

function dynamicImportBindings(record) {
  const results = [];
  for (const declaration of collect(record.sourceFile, ts.isVariableDeclaration)) {
    if (!declaration.initializer) continue;
    let initializer = unwrapExpression(declaration.initializer);
    if (ts.isAwaitExpression(initializer)) {
      initializer = unwrapExpression(initializer.expression);
    }
    if (
      !ts.isCallExpression(initializer) ||
      initializer.expression.kind !== ts.SyntaxKind.ImportKeyword ||
      initializer.arguments.length !== 1 ||
      !ts.isStringLiteral(initializer.arguments[0])
    ) {
      continue;
    }
    const bindings = new Set();
    if (ts.isObjectBindingPattern(declaration.name)) {
      for (const element of declaration.name.elements) {
        bindings.add(element.name.getText(record.sourceFile));
      }
    } else if (ts.isIdentifier(declaration.name)) {
      bindings.add(declaration.name.text);
    }
    results.push({ source: initializer.arguments[0].text, bindings });
  }
  return results;
}

// A01 deliberately reads and parses only route.ts. No proposed handler,
// dependency, test, or protected file is touched until the allowlist passes.
const route = parseFile(ROUTE_PATH);
const routeRuntimeExports = topLevelRuntimeExports(route);
const illegalRouteExports = [...routeRuntimeExports]
  .filter((name) => !APP_ROUTER_RUNTIME_EXPORTS.has(name))
  .sort();

if (illegalRouteExports.length > 0) {
  fail(
    "A01",
    ROUTE_PATH +
      " exports non-App-Router runtime field " +
      illegalRouteExports[0] +
      ".",
  );
}
check("A01", true, ROUTE_PATH + " has an invalid runtime export.");

const handler = parseFile(HANDLER_PATH);
const routeTest = parseFile(ROUTE_TEST_PATH, ts.ScriptKind.JS);
const adminShellTest = parseFile(ADMIN_SHELL_TEST_PATH, ts.ScriptKind.JS);
const auth = parseFile(AUTH_PATH);
const readModel = parseFile(READ_MODEL_PATH);
const cursor = parseFile(CURSOR_PATH);
const supabaseAdmin = parseFile(SUPABASE_ADMIN_PATH);
const readModelTest = parseFile(READ_MODEL_TEST_PATH, ts.ScriptKind.JS);
const cursorTest = parseFile(CURSOR_TEST_PATH, ts.ScriptKind.JS);
const phase27gbRoute = parseFile(PHASE_27GB_ROUTE_PATH);
const phase27gbHarness = parseFile(PHASE_27GB_HARNESS_PATH, ts.ScriptKind.JS);

const runtimeVariable = topLevelVariable(route, "runtime");
const dynamicVariable = topLevelVariable(route, "dynamic");
const getVariable = topLevelVariable(route, "GET");
const routeTypeExports = topLevelTypeExports(route);
check(
  "A02",
  setsEqual(routeRuntimeExports, EXPECTED_ROUTE_RUNTIME_EXPORTS) &&
    setsEqual(routeTypeExports, EXPECTED_ROUTE_TYPE_EXPORTS) &&
    stringLiteral(runtimeVariable?.declaration.initializer) === "nodejs" &&
    stringLiteral(dynamicVariable?.declaration.initializer) ===
      "force-dynamic" &&
    HTTP_METHODS.every(
      (method) => method === "GET" || !routeRuntimeExports.has(method),
    ),
  ROUTE_PATH +
    " does not expose exactly runtime, dynamic, GET, and the two type-only response exports.",
);

const routeImports = importDetails(route);
const routeFactoryCalls = callsNamed(
  route.sourceFile,
  "createCandidateStagingQueueReadHandler",
);
const getInitializer = getVariable?.declaration.initializer
  ? unwrapExpression(getVariable.declaration.initializer)
  : null;
check(
  "A03",
  routeImports.modules.length === 2 &&
    routeImports.modules[0] === "server-only" &&
    routeImports.modules[1] === "./handler" &&
    setsEqual(
      routeImports.names,
      new Set(["createCandidateStagingQueueReadHandler"]),
    ) &&
    getInitializer &&
    ts.isCallExpression(getInitializer) &&
    callName(getInitializer) === "createCandidateStagingQueueReadHandler" &&
    getInitializer.arguments.length === 0 &&
    routeFactoryCalls.length === 1,
  "GET is not wired through one relative import and one zero-argument factory call.",
);

check(
  "A04",
  sideEffectServerOnlyIsFirst(handler) &&
    !/^\s*["']use client["'];?/m.test(handler.text) &&
    !/^\s*["']use client["'];?/m.test(route.text),
  HANDLER_PATH +
    ' does not begin with import "server-only" or a client boundary is present.',
);

const { factory, requestHandler } = getFactoryAndRequestHandler(handler);
const factoryParameter = factory?.parameters[0];
check(
  "A05",
  Boolean(
    factory &&
      isExported(factory) &&
      factory.parameters.length === 1 &&
      factoryParameter?.type?.getText(handler.sourceFile) ===
        "CandidateStagingQueueReadRouteDependencies" &&
      factoryParameter.initializer &&
      ts.isObjectLiteralExpression(factoryParameter.initializer) &&
      factoryParameter.initializer.properties.length === 0 &&
      requestHandler &&
      requestHandler.name?.text === "candidateStagingQueueReadHandler" &&
      hasModifier(requestHandler, ts.SyntaxKind.AsyncKeyword) &&
      requestHandler.parameters.length === 1 &&
      requestHandler.parameters[0].type?.getText(handler.sourceFile) ===
        "Request" &&
      !routeRuntimeExports.has("createCandidateStagingQueueReadHandler"),
  ),
  "the exported handler factory signature or returned named async Request handler changed.",
);

const dependencyType = topLevelTypeAlias(
  handler,
  "CandidateStagingQueueReadRouteDependencies",
);
const dependencyMembers =
  dependencyType && ts.isTypeLiteralNode(dependencyType.type)
    ? dependencyType.type.members.filter(ts.isPropertySignature)
    : [];
const dependencyText = dependencyType ? nodeText(dependencyType, handler) : "";
check(
  "A06",
  setsEqual(typePropertyNames(dependencyType), EXPECTED_SEAMS) &&
    dependencyMembers.length === 3 &&
    dependencyMembers.every((member) => Boolean(member.questionToken)) &&
    containsAll(dependencyText, [
      "(request: Request) => VerifyAdminSessionResult",
      "CandidateStagingQueueReadClient",
      "Promise<CandidateStagingQueueReadClient>",
      "typeof listDiscoveryCandidateStagingQueueItems",
    ]),
  "the three optional dependency seams or their imported types changed.",
);

const handlerImports = importDetails(handler);
const expectedHandlerModules = [
  "server-only",
  "next/server",
  "../../../../../lib/admin-auth",
  "../../../../../lib/discovery/discovery-candidate-staging-queue-read-model",
];
const expectedHandlerImports = new Set([
  "NextResponse",
  "verifyAdminSession",
  "VerifyAdminSessionResult",
  "listDiscoveryCandidateStagingQueueItems",
  "CandidateStagingQueueReadClient",
  "CandidateStagingQueueReadErrorCode",
  "CandidateStagingQueueSortDirection",
  "CandidateStagingQueueSortKey",
  "CandidateStagingQueueStatusFilter",
  "DiscoveryCandidateStagingQueueItem",
  "ListDiscoveryCandidateStagingQueueItemsInput",
]);
check(
  "A07",
  arraysEqual(handlerImports.modules, expectedHandlerModules) &&
    setsEqual(handlerImports.names, expectedHandlerImports) &&
    routeImports.modules.length === 2 &&
    routeImports.modules[0] === "server-only" &&
    routeImports.modules[1] === "./handler" &&
    !/(audit|storage|mutation|createClient|service[_-]?role)/i.test(
      handlerImports.modules.join("\n"),
    ),
  "the exact implementation import graph changed or privileged work reached the thin route.",
);

check("A08", Boolean(requestHandler), "the returned request handler is missing.");
const handlerText = nodeText(requestHandler, handler);
const adminSessionCalls = collect(
  requestHandler,
  (node) =>
    ts.isCallExpression(node) &&
    compact(node.expression.getText(handler.sourceFile)) ===
      "(dependencies.verifyAdminSession||verifyAdminSession)",
);
const sessionPosition = handlerText.indexOf("const adminSession");
const unauthorizedPosition = handlerText.indexOf(
  "if (!adminSession.isAdmin || !adminSession.actor)",
);
const parsePosition = handlerText.indexOf("const parsedInput");
const clientPosition = handlerText.indexOf("const client");
const readSelectionPosition = handlerText.indexOf("const readQueueItems");
const resultPosition = handlerText.indexOf("const result");
check(
  "A08",
  adminSessionCalls.length === 1 &&
    adminSessionCalls[0].arguments.length === 1 &&
    adminSessionCalls[0].arguments[0].getText(handler.sourceFile) ===
      "request" &&
    sessionPosition >= 0 &&
    sessionPosition < unauthorizedPosition &&
    unauthorizedPosition < parsePosition &&
    unauthorizedPosition < clientPosition &&
    unauthorizedPosition < readSelectionPosition &&
    unauthorizedPosition < resultPosition,
  "authentication/admin-role verification is not first, once, and before downstream work.",
);

const unauthorizedBranch = ifStatementContaining(
  requestHandler,
  "!adminSession.isAdmin||!adminSession.actor",
  handler,
);
const unauthorizedText = unauthorizedBranch
  ? compact(nodeText(unauthorizedBranch, handler))
  : "";
const unauthorizedConsoleCalls = unauthorizedBranch
  ? collect(
      unauthorizedBranch,
      (node) =>
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(handler.sourceFile) === "console",
    )
  : [];
check(
  "A09",
  Boolean(
    unauthorizedBranch &&
      unauthorizedConsoleCalls.length === 1 &&
      unauthorizedText.includes(
        'console.warn("Unauthorizedcandidatestagingqueuereadrequest.",{errors:adminSession.errors,})',
      ) &&
      unauthorizedText.includes(
        'code:"unauthorized",message:"Unauthorized.",',
      ) &&
      unauthorizedText.includes("},401,") &&
      !containsAll(unauthorizedText, ["getClient", "readQueueItems"]),
  ),
  "the unauthorized predicate, warning, fixed 401 response, or rejection reachability changed.",
);

const forbiddenRequestReads = receiverPropertyCalls(
  requestHandler,
  "request",
  new Set(["json", "text", "formData", "arrayBuffer", "blob"]),
  handler,
);
check(
  "A10",
  routeRuntimeExports.has("GET") &&
    HTTP_METHODS.every(
      (method) => method === "GET" || !routeRuntimeExports.has(method),
    ) &&
    forbiddenRequestReads.length === 0 &&
    !handler.text.includes("verifyAdminCsrfRequest") &&
    !/(checkAdminRateLimit|ADMIN_RATE_LIMIT_ACTIONS|request\.body)/.test(
      handler.text,
    ),
  "the GET-only, body-free, non-CSRF, non-rate-limited read boundary changed.",
);

const parseStatuses = topLevelFunction(handler, "parseStatuses");
const parseLimit = topLevelFunction(handler, "parseLimit");
const parseSearchParams = topLevelFunction(
  handler,
  "parseCandidateStagingQueueSearchParams",
);
const statusGetCalls = parseStatuses
  ? receiverPropertyCalls(
      parseStatuses,
      "searchParams",
      new Set(["get"]),
      handler,
    )
  : [];
const limitGetCalls = parseLimit
  ? receiverPropertyCalls(
      parseLimit,
      "searchParams",
      new Set(["get"]),
      handler,
    )
  : [];
const optionalParamCalls = parseSearchParams
  ? callsNamed(parseSearchParams, "getOptionalParam")
  : [];
const optionalParamNames = new Set(
  optionalParamCalls
    .map((call) => stringLiteral(call.arguments[1]))
    .filter(Boolean),
);
const parsedParameterNames = new Set([
  stringLiteral(statusGetCalls[0]?.arguments[0]),
  stringLiteral(limitGetCalls[0]?.arguments[0]),
  ...optionalParamNames,
]);
const urlCalls = collect(
  requestHandler,
  (node) =>
    ts.isNewExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "URL",
);
check(
  "A11",
  Boolean(
    parseStatuses &&
      parseLimit &&
      parseSearchParams &&
      statusGetCalls.length === 1 &&
      limitGetCalls.length === 1 &&
      optionalParamCalls.length === 9 &&
      setsEqual(parsedParameterNames, EXPECTED_QUERY_PARAMETERS) &&
      urlCalls.length === 1 &&
      urlCalls[0].arguments?.length === 1 &&
      compact(urlCalls[0].arguments[0].getText(handler.sourceFile)) ===
        "request.url" &&
      collect(parseSearchParams, ts.isSpreadAssignment).length === 0 &&
      !/(request\.(headers|cookies|body)|adminSession\.actor\.id)/.test(
        nodeText(parseSearchParams, handler),
      ),
  ),
  "the explicit 11-field URL search-parameter envelope changed.",
);

const parseStatusesText = parseStatuses
  ? compact(nodeText(parseStatuses, handler))
  : "";
const parseLimitText = parseLimit ? compact(nodeText(parseLimit, handler)) : "";
const inputAssignments = parseSearchParams
  ? collect(
      parseSearchParams,
      (node) =>
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        node.left.expression.getText(handler.sourceFile) === "input",
    )
  : [];
const assignedInputFields = new Set(
  inputAssignments.map((assignment) => assignment.left.name.text),
);
check(
  "A12",
  parseStatusesText.includes(
    '.split(",").map((status)=>status.trim()).filter(Boolean)',
  ) &&
    parseLimitText.includes("returnNumber(value)") &&
    setsEqual(assignedInputFields, EXPECTED_QUERY_PARAMETERS) &&
    [...EXPECTED_QUERY_PARAMETERS].every((name) =>
      compact(nodeText(parseSearchParams, handler)).includes(
        "input." + name + "=",
      ),
    ),
  "status/limit parsing or defined-only query-field forwarding changed.",
);

const activeStatuses = topLevelVariable(
  readModel,
  "DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES",
);
const resolveStatuses = topLevelFunction(readModel, "resolveStatuses");
const resolveStatusesText = resolveStatuses
  ? compact(nodeText(resolveStatuses, readModel))
  : "";
check(
  "A13",
  arraysEqual(arrayLiteralStrings(activeStatuses), EXPECTED_ACTIVE_STATUSES) &&
    resolveStatusesText.includes(
      "return[...DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES]",
    ) &&
    resolveStatusesText.includes('fail("invalid_status_filter"') &&
    resolveStatusesText.includes("!resolved.includes(status)") &&
    resolveStatusesText.includes("resolved.push(status)"),
  "the active status allowlist, defaults, deduplication, or inactive rejection changed.",
);

const defaultLimit = topLevelVariable(readModel, "DEFAULT_LIMIT");
const maxLimit = topLevelVariable(readModel, "MAX_LIMIT");
const maxSearchLength = topLevelVariable(readModel, "MAX_SEARCH_LENGTH");
const listFunction = topLevelFunction(
  readModel,
  "listDiscoveryCandidateStagingQueueItems",
);
const listText = listFunction ? compact(nodeText(listFunction, readModel)) : "";
check(
  "A14",
  numericLiteral(defaultLimit?.declaration.initializer) === 25 &&
    numericLiteral(maxLimit?.declaration.initializer) === 50 &&
    numericLiteral(maxSearchLength?.declaration.initializer) === 120 &&
    readModel.text.includes(
      "!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT",
    ) &&
    listText.includes(".limit(limit+1)") &&
    containsAll(readModel.text, [
      "trimmed.length > MAX_SEARCH_LENGTH",
      "Search term is too long.",
      "Optional filters must be non-empty and bounded.",
    ]),
  "the default/maximum limit, limit + 1 query ceiling, or 120-character text bounds changed.",
);

const assertUuidCalls = listFunction
  ? callsNamed(listFunction, "assertUuidFilter")
  : [];
check(
  "A15",
  containsAll(readModel.text, [
    '"created_at"',
    '"updated_at"',
    '"confidence_bucket"',
    'new Set<string>(["asc", "desc"])',
    'return "created_at";',
    'return "desc";',
    '"invalid_sort_key"',
    '"invalid_sort_direction"',
    '"invalid_uuid_filter"',
    "UUID_PATTERN",
  ]) &&
    assertUuidCalls.length === 3 &&
    compact(nodeText(assertUuidCalls[0], readModel)) ===
      'assertUuidFilter(input.discoverySourceId,"discoverySourceId")' &&
    compact(nodeText(assertUuidCalls[1], readModel)) ===
      'assertUuidFilter(input.discoveryRunId,"discoveryRunId")' &&
    compact(nodeText(assertUuidCalls[2], readModel)) ===
      'assertUuidFilter(input.auditCorrelationId,"auditCorrelationId")',
  "the sort allowlists/defaults or three UUID filter checks changed.",
);

const cursorConsoleCalls = collect(
  cursor.sourceFile,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(cursor.sourceFile) === "console",
);
check(
  "A16",
  sideEffectServerOnlyIsFirst(cursor) &&
    containsAll(cursor.text, [
      'const CURSOR_VERSION = 1;',
      'const HMAC_ALGORITHM = "sha256";',
      "createHmac(HMAC_ALGORITHM, secret)",
      "timingSafeEqual(firstBuffer, secondBuffer)",
      "payload.version !== CURSOR_VERSION",
      "filtersHash: input.filtersHash",
      "lastCandidateId: input.lastCandidateId.toLowerCase()",
    ]) &&
    containsAll(readModel.text, [
      "decoded.payload.filtersHash !== context.filtersHash",
      "decoded.payload.sortKey !== context.sortKey",
      "decoded.payload.sortDirection !== context.sortDirection",
      "lastCandidateId",
      '"candidate_queue_invalid_cursor"',
      '"candidate_queue_cursor_mismatch"',
      '"candidate_queue_cursor_version_unsupported"',
    ]) &&
    cursorConsoleCalls.length === 0,
  "the signed/versioned/filter-bound cursor or safe diagnostic boundary changed.",
);

const handlerDynamicImports = dynamicImportBindings(handler);
const clientVariable = variableWithin(requestHandler, "client");
const defaultClientCalls = callsNamed(
  requestHandler,
  "getDefaultCandidateStagingQueueReadClient",
);
check(
  "A17",
  handlerDynamicImports.length === 1 &&
    handlerDynamicImports[0].source ===
      "../../../../../lib/supabase-admin" &&
    setsEqual(handlerDynamicImports[0].bindings, new Set(["supabaseAdmin"])) &&
    defaultClientCalls.length === 1 &&
    clientVariable &&
    compact(nodeText(clientVariable.initializer, handler)) ===
      "dependencies.getClient?awaitdependencies.getClient():awaitgetDefaultCandidateStagingQueueReadClient()" &&
    sessionPosition < parsePosition &&
    parsePosition < clientPosition &&
    !/(supabaseAdmin|supabase-admin|createClient|service[_-]?role)/i.test(
      route.text,
    ),
  "the one authenticated injected-or-dynamic privileged client selection changed.",
);

const readQueueItemsVariable = variableWithin(
  requestHandler,
  "readQueueItems",
);
const awaitedReadCalls = collect(
  requestHandler,
  (node) =>
    ts.isAwaitExpression(node) &&
    ts.isCallExpression(unwrapExpression(node.expression)) &&
    callName(unwrapExpression(node.expression)) === "readQueueItems",
);
check(
  "A18",
  Boolean(
    readQueueItemsVariable &&
      compact(nodeText(readQueueItemsVariable.initializer, handler)) ===
        "dependencies.listQueueItems||listDiscoveryCandidateStagingQueueItems" &&
      awaitedReadCalls.length === 1 &&
      compact(nodeText(awaitedReadCalls[0], handler)) ===
        "awaitreadQueueItems(parsedInput,{client})" &&
      clientPosition < readSelectionPosition &&
      readSelectionPosition < resultPosition,
  ),
  "the injected-or-default read helper selection or single awaited call changed.",
);

const safeColumns = topLevelVariable(
  readModel,
  "DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS",
);
const fromCalls = directPropertyCalls(readModel.sourceFile, new Set(["from"]));
const selectCalls = directPropertyCalls(
  readModel.sourceFile,
  new Set(["select"]),
);
const forbiddenJoinCalls = directPropertyCalls(
  readModel.sourceFile,
  new Set(["leftJoin", "rightJoin", "innerJoin"]),
);
check(
  "A19",
  arraysEqual(arrayLiteralStrings(safeColumns), EXPECTED_SAFE_COLUMNS) &&
    fromCalls.length === 1 &&
    stringLiteral(fromCalls[0].arguments[0]) ===
      "discovery_candidate_tools" &&
    selectCalls.length === 1 &&
    compact(nodeText(selectCalls[0].arguments[0], readModel)) ===
      'DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS.join(",")' &&
    !/select\s*\(\s*["']\*["']/.test(readModel.text) &&
    forbiddenJoinCalls.length === 0,
  "the sole table or exact 20-column non-wildcard projection changed.",
);

const queryCallCounts = new Map();
for (const method of ["in", "eq", "order", "limit", "or", "select", "from"]) {
  queryCallCounts.set(
    method,
    directPropertyCalls(readModel.sourceFile, new Set([method])).length,
  );
}
check(
  "A20",
  queryCallCounts.get("from") === 1 &&
    queryCallCounts.get("select") === 1 &&
    queryCallCounts.get("in") === 1 &&
    queryCallCounts.get("eq") === 5 &&
    queryCallCounts.get("order") === 2 &&
    queryCallCounts.get("limit") === 1 &&
    queryCallCounts.get("or") === 2 &&
    containsAll(listText, [
      '.in("candidate_status",statuses)',
      '.order(sortKey,{ascending:sortDirection==="asc"})',
      '.order("id",{ascending:sortDirection==="asc"})',
      ".limit(limit+1)",
      'count:"exact"',
      "applyCursorFilter(query,cursor)",
      '.eq("discovery_source_id",input.discoverySourceId)',
      '.eq("discovery_run_id",input.discoveryRunId)',
      '.eq("audit_correlation_id",input.auditCorrelationId)',
      '.eq("duplicate_check_status",duplicateCheckStatus)',
      '.eq("confidence_bucket",confidenceBucket)',
    ]),
  "the bounded filter, order, tie-breaker, cursor, count, or query-call ceiling changed.",
);

const mapQueueRow = topLevelFunction(readModel, "mapQueueRow");
const mappedObject = mapQueueRow
  ? collect(
      mapQueueRow,
      (node) =>
        ts.isObjectLiteralExpression(node) &&
        propertyMap(node).has("candidateId"),
    )[0]
  : null;
const successType = topLevelTypeAlias(
  handler,
  "CandidateStagingQueueApiReadResponse",
);
const successResponseCalls = callsNamed(requestHandler, "jsonResponse").filter(
  (call) =>
    call.arguments[0] &&
    ts.isObjectLiteralExpression(call.arguments[0]) &&
    propertyMap(call.arguments[0]).has("ok") &&
    propertyMap(call.arguments[0]).has("...result"),
);
check(
  "A21",
  Boolean(
    mapQueueRow &&
      mappedObject &&
      setsEqual(
        new Set(propertyMap(mappedObject).keys()),
        EXPECTED_ITEM_FIELDS,
      ) &&
      setsEqual(typePropertyNames(successType), EXPECTED_SUCCESS_FIELDS) &&
      successResponseCalls.length === 1 &&
      containsAll(nodeText(mapQueueRow, readModel), [
        "!isActiveStatus(row.candidate_status)",
        "!row.id",
        "!row.candidate_name",
        "!row.candidate_website_url",
        "!row.discovery_run_id",
        "!row.audit_correlation_id",
      ])
  ),
  "row validation, exact item mapping, or success response shape changed.",
);

const forbiddenMutationNames = new Set([
  "insert",
  "update",
  "upsert",
  "delete",
  "rpc",
]);
const forbiddenMutationCalls = [
  ...directPropertyCalls(route.sourceFile, forbiddenMutationNames),
  ...directPropertyCalls(handler.sourceFile, forbiddenMutationNames),
  ...directPropertyCalls(readModel.sourceFile, forbiddenMutationNames),
];
const combinedReadSource = route.text + "\n" + handler.text + "\n" + readModel.text;
check(
  "A22",
  forbiddenMutationCalls.length === 0 &&
    !/(\.storage\b|createAdminAuditLog|public\.tools|public\.discovered_tools|\bpublish(?:ing)?\b)/i.test(
      combinedReadSource,
    ) &&
    !/(createClient|SUPABASE_SERVICE_ROLE_KEY)/.test(route.text + handler.text),
  "the route/handler/read-model boundary gained mutation, RPC, storage, audit, publishing, or client construction.",
);

const jsonResponse = topLevelFunction(handler, "jsonResponse");
const nextResponseJsonCalls = collect(
  handler.sourceFile,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(handler.sourceFile) === "NextResponse" &&
    node.expression.name.text === "json",
);
const handlerJsonResponseCalls = callsNamed(requestHandler, "jsonResponse");
check(
  "A23",
  Boolean(
    jsonResponse &&
      compact(nodeText(jsonResponse, handler)).includes(
        'NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",},})',
      ) &&
      nextResponseJsonCalls.length === 1 &&
      handlerJsonResponseCalls.length === 3
  ),
  "the single protected response helper or all-explicit-response coverage changed.",
);

const errorCodeSet = topLevelVariable(
  handler,
  "CANDIDATE_QUEUE_READ_ERROR_CODES",
);
const errorStatusMap = topLevelVariable(
  handler,
  "CANDIDATE_QUEUE_READ_ERROR_STATUS",
);
const errorMessageMap = topLevelVariable(
  handler,
  "CANDIDATE_QUEUE_READ_ERROR_MESSAGES",
);
const fixedErrorMarkers = [
  '"invalid_status_filter"',
  '"invalid_limit"',
  '"candidate_queue_invalid_cursor"',
  '"candidate_queue_cursor_mismatch"',
  '"candidate_queue_cursor_version_unsupported"',
  '"invalid_sort_key"',
  '"invalid_sort_direction"',
  '"invalid_uuid_filter"',
  '"candidate_queue_read_failed"',
  '"Invalid candidate staging queue status filter."',
  '"Invalid candidate staging queue limit."',
  '"Invalid candidate staging queue sort key."',
  '"Invalid candidate staging queue sort direction."',
  '"Invalid candidate staging queue UUID filter."',
  '"Candidate staging queue read failed."',
];
check(
  "A24",
  Boolean(
    errorCodeSet &&
      errorStatusMap &&
      errorMessageMap &&
      containsAll(handler.text, fixedErrorMarkers) &&
      containsAll(nodeText(errorStatusMap.statement, handler), [
        "invalid_status_filter: 400",
        "invalid_limit: 400",
        "candidate_queue_invalid_cursor: 400",
        "candidate_queue_cursor_mismatch: 400",
        "candidate_queue_cursor_version_unsupported: 400",
        "invalid_sort_key: 400",
        "invalid_sort_direction: 400",
        "invalid_uuid_filter: 400",
        "candidate_queue_read_failed: 500",
      ]) &&
      compact(handlerText).includes(
        "constcode=getCandidateQueueReadErrorCode(error)",
      ) &&
      compact(handlerText).includes(
        "message:CANDIDATE_QUEUE_READ_ERROR_MESSAGES[code]",
      ) &&
      !/(error\??\.message|error\.stack|JSON\.stringify\s*\(\s*error|stack\s*:|cause\s*:|details\s*:|hint\s*:)/.test(
        handlerText,
      )
  ),
  "the fixed public error/status taxonomy or caught-error non-disclosure changed.",
);

const consoleCalls = [
  ...collect(
    route.sourceFile,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(route.sourceFile) === "console",
  ),
  ...collect(
    handler.sourceFile,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(handler.sourceFile) === "console",
  ),
];
const onlyConsoleCall = consoleCalls[0];
check(
  "A25",
  Boolean(
    consoleCalls.length === 1 &&
      onlyConsoleCall.expression.name.text === "warn" &&
      onlyConsoleCall.arguments.length === 2 &&
      stringLiteral(onlyConsoleCall.arguments[0]) ===
        "Unauthorized candidate staging queue read request." &&
      ts.isObjectLiteralExpression(onlyConsoleCall.arguments[1]) &&
      compact(onlyConsoleCall.arguments[1].getText(handler.sourceFile)) ===
        "{errors:adminSession.errors,}" &&
      !/(createAdminAuditLog|auditLog|console\.(info|log|debug|trace|error))/.test(
        route.text + "\n" + handler.text,
      )
  ),
  "the sole existing two-argument unauthorized warning changed or logging/audit expanded.",
);

const requestHandlerCatches = collect(requestHandler, ts.isCatchClause);
const throwStatements = collect(requestHandler, ts.isThrowStatement);
const catchText =
  requestHandlerCatches.length === 1
    ? compact(nodeText(requestHandlerCatches[0], handler))
    : "";
const tryPosition = handlerText.indexOf("try {");
const catchPosition = handlerText.indexOf("catch (error)");
check(
  "A26",
  sessionPosition < unauthorizedPosition &&
    unauthorizedPosition < parsePosition &&
    parsePosition < tryPosition &&
    tryPosition < clientPosition &&
    clientPosition < readSelectionPosition &&
    readSelectionPosition < resultPosition &&
    resultPosition < catchPosition &&
    requestHandlerCatches.length === 1 &&
    requestHandlerCatches[0].variableDeclaration?.name.getText() === "error" &&
    throwStatements.length === 0 &&
    catchText.includes(
      "constcode=getCandidateQueueReadErrorCode(error)",
    ) &&
    catchText.includes(
      "CANDIDATE_QUEUE_READ_ERROR_STATUS[code]",
    ),
  "the session-to-read ordering, sole catch, or fail-closed unknown-code collapse changed.",
);

const routeTestNames = new Set(
  collect(
    routeTest.sourceFile,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "test" &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0]),
  ).map((call) => call.arguments[0].text),
);
const routeTestFactoryCalls = callsNamed(
  routeTest.sourceFile,
  "createCandidateStagingQueueReadHandler",
);
const routeTestFactoryObject = routeTestFactoryCalls[0]?.arguments[0];
const routeTestImports = importDetails(routeTest);
check(
  "A27",
  setsEqual(routeTestNames, EXPECTED_ROUTE_TEST_NAMES) &&
    routeTestFactoryCalls.length === 1 &&
    routeTestFactoryObject &&
    ts.isObjectLiteralExpression(routeTestFactoryObject) &&
    setsEqual(
      new Set(propertyMap(routeTestFactoryObject).keys()),
      EXPECTED_SEAMS,
    ) &&
    routeTestImports.modules.every((moduleName) =>
      moduleName.startsWith("node:"),
    ) &&
    containsAll(routeTest.text, [
      "app/api/admin/discovery/candidate-staging-queue/route.ts",
      "app/api/admin/discovery/candidate-staging-queue/handler.ts",
      "handlerSource",
      "routeSource",
      "pathToFileURL(tempModulePath).href",
      "Phase 14Y candidate staging queue API route tests passed:",
      'import { createCandidateStagingQueueReadHandler } from "./handler";',
      "export const GET = createCandidateStagingQueueReadHandler();",
    ]) &&
    adminShellTest.text.includes(
      '"app/api/admin/discovery/candidate-staging-queue/handler.ts"',
    ) &&
    !adminShellTest.text.includes(
      '"app/api/admin/discovery/candidate-staging-queue/route.ts"',
    ) &&
    containsAll(adminShellTest.text, [
      'console.log("A2 privileged client boundary static assertions passed");',
      'console.log("admin shell Supabase read hardening static assertions passed");',
    ]) &&
    readModelTest.text.includes(
      "Phase 16C read model helper tests passed:",
    ) &&
    cursorTest.text.includes(
      "Phase 16C cursor helper tests passed:",
    ),
  "the 14-case transformed-handler seam, route wiring checks, importer boundary, or existing helper markers changed.",
);

check(
  "A28",
  auth.text.length > 0 &&
    supabaseAdmin.text.length > 0 &&
    phase27gbRoute.text.length > 0 &&
    phase27gbHarness.text.length > 0,
  "a protected dependency or Phase 27GB source is missing.",
);
for (const [relativePath, expectedHash] of PROTECTED_HASHES) {
  check(
    "A28",
    sha256(relativePath) === expectedHash,
    relativePath + " does not match its protected SHA-256 identity.",
  );
}

process.stdout.write(
  "PASS: candidate staging queue read route export contract static assertions (28 assertions)\n",
);
