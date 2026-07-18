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
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts";
const AUTH_PATH = "lib/admin-auth.ts";
const RATE_LIMIT_PATH = "lib/admin-rate-limit.ts";
const VALIDATION_PATH =
  "lib/discovery/discovery-candidate-decision-validation.ts";
const ADMIN_PATH = "lib/discovery/discovery-candidate-decision-admin.ts";
const SUPABASE_ADMIN_PATH = "lib/supabase-admin.ts";
const DATABASE_TYPES_PATH = "lib/supabase/database.types.ts";
const MIGRATION_PATH =
  "supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql";
const EXISTING_STATIC_PATH =
  "testing/discovery-candidate-decision-api-static-assertions.mjs";

const PHASE_27GA_HASHES = new Map([
  [
    "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
    "7d7692aaf4751b5129cf0c22a2ef7aa55a6adcfddd3e8f2b3b080b0f291075e4",
  ],
  [
    "app/api/admin/discovery/candidate-extraction/invoke/handler.ts",
    "bcf390b1e7154adee85d15b96ce5ed85c57e08136d290a880e7907869c8c5c41",
  ],
  [
    "testing/discovery-candidate-extraction-invocation-route.test.mjs",
    "b904185546f38878d2a869a554d801337357a30c8649218a6902c02fcab2f668",
  ],
  [
    "testing/discovery-candidate-extraction-invoke-route-export-contract-static-assertions.mjs",
    "cca9474c1e1168d3aa8e29b5fa824ae504ffb653137afa2c655d143a66e75af4",
  ],
]);

const PROTECTED_HASHES = new Map([
  [
    AUTH_PATH,
    "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc",
  ],
  [
    RATE_LIMIT_PATH,
    "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b",
  ],
  [
    VALIDATION_PATH,
    "922d9d3b70a6975c42725b7708f16ce9de2ea37c4a7111ad8c4919528ca17339",
  ],
  [
    ADMIN_PATH,
    "6a72897846ae6276523726bc5f9fb99b7de6b7f9db386c5b3cf0655dd0905b96",
  ],
  [
    SUPABASE_ADMIN_PATH,
    "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae",
  ],
  [
    DATABASE_TYPES_PATH,
    "7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c",
  ],
  [
    MIGRATION_PATH,
    "7b3cbb1234aa0e492f366baa5e340bda174b619ede1cfb48616658a0f631651f",
  ],
  [
    EXISTING_STATIC_PATH,
    "71ea505fd0ddd061b926d1976ed8d0a5fa2729ef2d59ad4bb91d5ed8114c4f8a",
  ],
]);

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

const EXPECTED_ROUTE_EXPORTS = new Set(["runtime", "dynamic", "POST"]);
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
  "verifyAdminCsrfRequest",
  "checkRateLimit",
  "getClient",
  "applyDecision",
]);
const EXPECTED_MODULES = [
  "server-only",
  "next/server",
  "../../../../../../../lib/admin-auth",
  "../../../../../../../lib/admin-rate-limit",
  "../../../../../../../lib/discovery/discovery-candidate-decision-admin",
  "../../../../../../../lib/discovery/discovery-candidate-decision-validation",
];
const EXPECTED_IMPORTS = new Set([
  "NextResponse",
  "verifyAdminCsrfRequest",
  "verifyAdminSession",
  "VerifyAdminSessionResult",
  "ADMIN_RATE_LIMIT_ACTIONS",
  "checkAdminRateLimit",
  "getAdminRateLimitResponseData",
  "AdminRateLimitResult",
  "applyDiscoveryCandidateDecision",
  "DiscoveryCandidateDecisionMutationError",
  "AppliedDiscoveryCandidateDecision",
  "DiscoveryCandidateDecisionMutationClient",
  "DiscoveryCandidateDecisionValidationError",
  "parseDiscoveryCandidateDecisionRequest",
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
  const factory = topLevelFunction(record, "createCandidateDecisionHandler");
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

function containsAll(text, markers) {
  return markers.every((marker) => text.includes(marker));
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

function directPropertyCalls(root, names) {
  return collect(
    root,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      names.has(node.expression.name.text),
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

// A01 deliberately reads and parses only route.ts. No proposed or protected
// dependency is touched until the route-module allowlist has been evaluated.
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

const runtimeVariable = topLevelVariable(route, "runtime");
const dynamicVariable = topLevelVariable(route, "dynamic");
const postVariable = topLevelVariable(route, "POST");
check(
  "A02",
  setsEqual(routeRuntimeExports, EXPECTED_ROUTE_EXPORTS) &&
    stringLiteral(runtimeVariable?.declaration.initializer) === "nodejs" &&
    stringLiteral(dynamicVariable?.declaration.initializer) === "force-dynamic" &&
    HTTP_METHODS.every(
      (method) => method === "POST" || !routeRuntimeExports.has(method),
    ) &&
    [
      "CandidateDecisionApiSuccessResponse",
      "CandidateDecisionApiErrorResponse",
      "CandidateDecisionRouteDependencies",
    ].every((name) => {
      const alias = topLevelTypeAlias(route, name);
      return alias && isExported(alias);
    }),
  ROUTE_PATH +
    " does not preserve runtime exports runtime, dynamic, and POST plus its type-only API exports.",
);

const { factory, requestHandler } = getFactoryAndRequestHandler(route);
const factoryCalls = callsNamed(
  route.sourceFile,
  "createCandidateDecisionHandler",
);
const postInitializer = postVariable?.declaration.initializer
  ? unwrapExpression(postVariable.declaration.initializer)
  : null;
check(
  "A03",
  Boolean(
    factory &&
      !isExported(factory) &&
      postInitializer &&
      ts.isCallExpression(postInitializer) &&
      callName(postInitializer) === "createCandidateDecisionHandler" &&
      postInitializer.arguments.length === 0 &&
      factoryCalls.length === 1,
  ),
  "the decision factory is not module-private or POST is not its sole zero-argument call site.",
);

check(
  "A04",
  sideEffectServerOnlyIsFirst(route) &&
    !route.text.includes('"use client"') &&
    !route.text.includes("'use client'"),
  ROUTE_PATH +
    ' does not retain first-statement import "server-only" or contains a client boundary.',
);

const dependencyType = topLevelTypeAlias(
  route,
  "CandidateDecisionRouteDependencies",
);
const dependencyMembers =
  dependencyType && ts.isTypeLiteralNode(dependencyType.type)
    ? dependencyType.type.members.filter(ts.isPropertySignature)
    : [];
const factoryParameter = factory?.parameters[0];
const returnedHandlerText = requestHandler ? nodeText(requestHandler, route) : "";
check(
  "A05",
  Boolean(
    factory &&
      factory.parameters.length === 1 &&
      factoryParameter?.type?.getText(route.sourceFile) ===
        "CandidateDecisionRouteDependencies" &&
      factoryParameter.initializer &&
      ts.isObjectLiteralExpression(factoryParameter.initializer) &&
      factoryParameter.initializer.properties.length === 0 &&
      requestHandler &&
      requestHandler.name?.text === "candidateDecisionHandler" &&
      hasModifier(requestHandler, ts.SyntaxKind.AsyncKeyword) &&
      requestHandler.parameters.length === 2 &&
      requestHandler.parameters[0].type?.getText(route.sourceFile) === "Request" &&
      requestHandler.parameters[1].type?.getText(route.sourceFile) ===
        "RouteContext" &&
      setsEqual(typePropertyNames(dependencyType), EXPECTED_SEAMS) &&
      dependencyMembers.every((member) => Boolean(member.questionToken)) &&
      containsAll(returnedHandlerText, [
        "dependencies.verifyAdminSession || verifyAdminSession",
        "dependencies.verifyAdminCsrfRequest || verifyAdminCsrfRequest",
        "dependencies.checkRateLimit",
        "dependencies.getClient",
        "dependencies.applyDecision || applyDiscoveryCandidateDecision",
      ]),
  ),
  "the factory signature, named async handler, or five optional dependency seams changed.",
);

const routeImports = importDetails(route);
check(
  "A06",
  routeImports.modules.length === EXPECTED_MODULES.length &&
    routeImports.modules.every((module, index) => module === EXPECTED_MODULES[index]) &&
    setsEqual(routeImports.names, EXPECTED_IMPORTS),
  "the route direct import graph or imported symbol set changed.",
);

check(
  "A07",
  Boolean(requestHandler),
  "the returned request handler is missing.",
);
const handlerText = nodeText(requestHandler, route);
const adminSessionCalls = collect(
  requestHandler,
  (node) =>
    ts.isCallExpression(node) &&
    compact(node.expression.getText(route.sourceFile)) ===
      "(dependencies.verifyAdminSession||verifyAdminSession)",
);
const sessionPosition = handlerText.indexOf("const adminSession");
const unauthorizedPosition = handlerText.indexOf(
  "if (!adminSession.isAdmin || !adminSession.actor)",
);
const csrfPosition = handlerText.indexOf("const csrfVerifier");
const rateLimitPosition = handlerText.indexOf("const rateLimitInput");
const bodyPosition = handlerText.indexOf("body = await readJsonBody(request)");
const paramsPosition = handlerText.indexOf("const { id } = await context.params");
const validationPosition = handlerText.indexOf(
  "const decisionInput = parseDiscoveryCandidateDecisionRequest",
);
const mutationPosition = handlerText.indexOf("const result = await applyDecision");
check(
  "A07",
  adminSessionCalls.length === 1 &&
    sessionPosition >= 0 &&
    sessionPosition < unauthorizedPosition &&
    unauthorizedPosition < csrfPosition &&
    unauthorizedPosition < rateLimitPosition &&
    unauthorizedPosition < bodyPosition &&
    unauthorizedPosition < validationPosition &&
    unauthorizedPosition < mutationPosition,
  "authentication/admin-role verification is not first, once, and before downstream work.",
);

const unauthorizedBranch = ifStatementContaining(
  requestHandler,
  "!adminSession.isAdmin||!adminSession.actor",
  route,
);
const unauthorizedText = unauthorizedBranch
  ? nodeText(unauthorizedBranch, route)
  : "";
const unauthorizedConsoleCalls = unauthorizedBranch
  ? collect(unauthorizedBranch, (node) =>
      Boolean(
        ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression.getText(route.sourceFile) === "console",
      ),
    )
  : [];
check(
  "A08",
  Boolean(
    unauthorizedBranch &&
      unauthorizedConsoleCalls.length === 1 &&
      compact(unauthorizedText).includes(
        'console.warn("candidate_decision_unauthorized")',
      ) &&
      compact(unauthorizedText).includes(
        'returnerrorResponse("unauthorized","Unauthorized.",401)',
      ),
  ),
  "the unauthorized predicate, fixed one-literal warning, or fixed 401 response changed.",
);

const csrfCalls = callsNamed(requestHandler, "csrfVerifier");
const csrfBranch = ifStatementContaining(requestHandler, "!csrfVerifier(request)", route);
const csrfText = csrfBranch ? compact(nodeText(csrfBranch, route)) : "";
check(
  "A09",
  csrfCalls.length === 1 &&
    csrfPosition > unauthorizedPosition &&
    csrfPosition < rateLimitPosition &&
    csrfPosition < bodyPosition &&
    csrfText.includes(
      'returnerrorResponse("forbidden","Securitytokenmissingorexpired.Pleaseloginagain.",403',
    ) &&
    !containsAll(csrfText, ["checkRateLimit", "readJsonBody"]),
  "CSRF verification or its fixed fail-closed 403 placement changed.",
);

const rateLimitVariable = variableWithin(requestHandler, "rateLimit");
const rateLimitCalls = collect(requestHandler, (node) =>
  Boolean(
    ts.isCallExpression(node) &&
      ["checkRateLimit", "checkAdminRateLimit"].includes(callName(node)),
  ),
);
const rateLimitBranch = ifStatementContaining(
  requestHandler,
  "!rateLimit.allowed",
  route,
);
const rateLimitText = rateLimitBranch
  ? compact(nodeText(rateLimitBranch, route))
  : "";
check(
  "A10",
  Boolean(
    rateLimitVariable &&
      compact(nodeText(rateLimitVariable.initializer, route)).includes(
        "dependencies.checkRateLimit?dependencies.checkRateLimit(rateLimitInput):checkAdminRateLimit(rateLimitInput)",
      ) &&
      rateLimitCalls.length === 2 &&
      handlerText.includes(
        "action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation",
      ) &&
      handlerText.includes("actor: adminSession.actor") &&
      rateLimitPosition > csrfPosition &&
      rateLimitPosition < bodyPosition &&
      rateLimitText.includes("getAdminRateLimitResponseData(rateLimit)") &&
      rateLimitText.includes("status:rateLimit.status") &&
      rateLimitText.includes('"Cache-Control":"no-store"') &&
      rateLimitText.includes('"X-Content-Type-Options":"nosniff"'),
  ),
  "the rate-limit action, actor, selected-call ceiling, placement, response data, status, or headers changed.",
);

const readJsonBody = topLevelFunction(route, "readJsonBody");
const readJsonText = readJsonBody ? nodeText(readJsonBody, route) : "";
const parserCatch = collect(requestHandler, ts.isCatchClause).find((clause) =>
  nodeText(clause, route).includes('"invalid_request_body"'),
);
const parserCatchText = parserCatch ? compact(nodeText(parserCatch, route)) : "";
check(
  "A11",
  Boolean(
    readJsonBody &&
      route.text.includes("const MAX_BODY_SIZE_BYTES = 8 * 1024;") &&
      containsAll(readJsonText, [
        'request.headers.get("content-type") || ""',
        'contentType.includes("application/json")',
        'request.headers.get("content-length")',
        "contentLength > MAX_BODY_SIZE_BYTES",
        "await request.json().catch(() => null)",
        "!isRecord(body)",
        'throw new Error("Invalid request format.")',
        'throw new Error("Request is too large.")',
        'throw new Error("Invalid request body.")',
      ]) &&
      parserCatch &&
      parserCatchText.includes(
        'returnerrorResponse("invalid_request_body",errorinstanceofError?error.message:"Invalidrequestbody.",400',
      ) &&
      bodyPosition > rateLimitPosition &&
      bodyPosition < paramsPosition &&
      bodyPosition < validationPosition,
  ),
  "the 8 KiB JSON request-envelope parser or its bounded 400 catch changed.",
);

const decisionParseCalls = callsNamed(
  requestHandler,
  "parseDiscoveryCandidateDecisionRequest",
);
check(
  "A12",
  decisionParseCalls.length === 1 &&
    paramsPosition > bodyPosition &&
    paramsPosition < validationPosition &&
    compact(nodeText(decisionParseCalls[0], route)) ===
      "parseDiscoveryCandidateDecisionRequest({candidateId:id,body,})" &&
    validationPosition < mutationPosition,
  "candidate ID resolution/validation is not single, exact, and before mutation.",
);

const validation = parseFile(VALIDATION_PATH);
const validationMarkers = [
  '"approve_for_draft"',
  '"reject"',
  '"duplicate"',
  '"needs_more_evidence"',
  '"archive"',
  "UUID_PATTERN",
  '"action",\n  "decision_action"',
  '"reason",\n  "decision_reason"',
  '"notes",\n  "decision_notes"',
  '"duplicate_of_candidate_id",\n  "duplicateOfCandidateId"',
  '"duplicate_of_tool_id",\n  "duplicateOfToolId"',
  '"request_correlation_id",\n  "requestCorrelationId"',
  "const MAX_DECISION_REASON_LENGTH = 200;",
  "const MIN_DECISION_REASON_LENGTH = 3;",
  "const MAX_DECISION_NOTES_LENGTH = 1000;",
  "const MAX_REQUEST_CORRELATION_ID_LENGTH = 200;",
  '"Client-supplied admin identity is not allowed."',
  '"Unsupported candidate decision request field."',
  '"Candidate cannot be marked as a duplicate of itself."',
  '"Duplicate tool target is not supported yet."',
  "candidateId: trimmedCandidateId",
  "action: actionValue",
  "decisionReason",
];
check(
  "A13",
  containsAll(validation.text, validationMarkers) &&
    callsNamed(validation.sourceFile, "parseDiscoveryCandidateDecisionRequest")
      .length === 0 &&
    topLevelFunction(validation, "parseDiscoveryCandidateDecisionRequest") !== null,
  "the five actions, UUID/alias/bound/duplicate validation, or normalized output contract changed.",
);

const actorLabelCalls = callsNamed(requestHandler, "getAdminActorLabel");
check(
  "A14",
  actorLabelCalls.length === 1 &&
    compact(nodeText(actorLabelCalls[0], route)) ===
      "getAdminActorLabel(adminSession.actor)" &&
    compact(handlerText).includes("actorLabel:getAdminActorLabel(adminSession.actor)") &&
    !/body\s*[.[]\s*(actor|admin|user|decided)/i.test(handlerText),
  "acting identity is not derived exclusively from the verified admin session.",
);

const clientVariable = variableWithin(requestHandler, "client");
const applyVariable = variableWithin(requestHandler, "applyDecision");
const awaitedApplyCalls = collect(requestHandler, (node) =>
  Boolean(
    ts.isAwaitExpression(node) &&
      ts.isCallExpression(unwrapExpression(node.expression)) &&
      callName(unwrapExpression(node.expression)) === "applyDecision",
  ),
);
check(
  "A15",
  Boolean(
    clientVariable &&
      compact(nodeText(clientVariable.initializer, route)) ===
        "dependencies.getClient?awaitdependencies.getClient():undefined" &&
      applyVariable &&
      compact(nodeText(applyVariable.initializer, route)) ===
        "dependencies.applyDecision||applyDiscoveryCandidateDecision" &&
      awaitedApplyCalls.length === 1 &&
      compact(nodeText(awaitedApplyCalls[0], route)).includes(
        "awaitapplyDecision({...decisionInput,actorLabel:getAdminActorLabel(adminSession.actor),},client?{client}:{},)",
      ) &&
      handlerText.includes("candidate: result.candidate"),
  ),
  "the optional client, selected apply function, single awaited mutation, or result mapping changed.",
);

const admin = parseFile(ADMIN_PATH);
const adminDynamicImports = dynamicImportBindings(admin);
const adminRpcCalls = directPropertyCalls(admin.sourceFile, new Set(["rpc"]));
check(
  "A16",
  sideEffectServerOnlyIsFirst(admin) &&
    adminDynamicImports.length === 1 &&
    adminDynamicImports[0].source === "../supabase-admin" &&
    setsEqual(adminDynamicImports[0].bindings, new Set(["supabaseAdmin"])) &&
    adminRpcCalls.length === 1 &&
    admin.text.includes(
      'const CANDIDATE_DECISION_RPC = "admin_apply_discovery_candidate_decision";',
    ) &&
    containsAll(admin.text, [
      "p_action: input.action",
      "p_actor_label: getSafeActorLabel(input.actorLabel)",
      "p_candidate_id: input.candidateId",
      "p_reason: input.decisionReason",
      "args.p_notes = input.decisionNotes",
      "args.p_duplicate_of_candidate_id = input.duplicateOfCandidateId",
      "args.p_request_correlation_id = input.requestCorrelationId",
    ]),
  "the server-only privileged helper, sole dynamic admin-client import, RPC ceiling, name, or arguments changed.",
);

const migrationText = readFileSync(path.join(REPO_ROOT, MIGRATION_PATH), "utf8");
const lowerMigration = migrationText.toLowerCase();
const lockPosition = lowerMigration.indexOf("for update;");
const eligibilityPosition = lowerMigration.indexOf(
  "if v_candidate.candidate_status not in",
);
const updatePosition = lowerMigration.indexOf(
  "update public.discovery_candidate_tools as candidate",
);
const auditPosition = lowerMigration.indexOf(
  "insert into public.discovery_audit_events",
);
check(
  "A17",
  containsAll(lowerMigration, [
    "security definer",
    "set search_path = public, pg_temp",
    "revoke all on function public.admin_apply_discovery_candidate_decision",
    "from public",
    "from anon",
    "from authenticated",
    "grant execute on function public.admin_apply_discovery_candidate_decision",
    "to service_role",
    "for update;",
    "'staged'",
    "'under_review'",
    "'needs_more_evidence'",
    "update public.discovery_candidate_tools as candidate",
    "insert into public.discovery_audit_events",
    "'candidate_decision'",
    "'previous_candidate_status'",
    "'next_candidate_status'",
    "'decision_reason'",
    "'request_correlation_id'",
  ]) &&
    lockPosition >= 0 &&
    lockPosition < eligibilityPosition &&
    eligibilityPosition < updatePosition &&
    updatePosition < auditPosition &&
    (lowerMigration.match(/update public\.discovery_candidate_tools/g) || [])
      .length === 1 &&
    (lowerMigration.match(/insert into public\.discovery_audit_events/g) || [])
      .length === 1 &&
    !/\b(insert\s+into|update|delete\s+from)\s+public\.(tools|discovered_tools)\b/i.test(
      migrationText,
    ),
  "the SQL definer/grant/lock/eligibility/mutation/audit ordering or no-publish boundary changed.",
);

const forbiddenDirectCalls = directPropertyCalls(
  route.sourceFile,
  new Set(["from", "rpc", "insert", "update", "delete", "upsert"]),
);
check(
  "A18",
  forbiddenDirectCalls.length === 0 &&
    !containsAll(route.text, ["process", ".env"]) &&
    !/(supabaseAdmin|createClient|service[_-]?role|createAdminAuditLog|\.storage\b)/i.test(
      route.text,
    ),
  "the route directly reaches a table, RPC, storage, environment, service-role client, or audit constructor.",
);

const jsonResponse = topLevelFunction(route, "jsonResponse");
const errorResponse = topLevelFunction(route, "errorResponse");
const nextResponseJsonCalls = collect(route.sourceFile, (node) =>
  Boolean(
    ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(route.sourceFile) === "NextResponse" &&
      node.expression.name.text === "json",
  ),
);
check(
  "A19",
  Boolean(
    jsonResponse &&
      errorResponse &&
      compact(nodeText(jsonResponse, route)).includes(
        'NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",},})',
      ) &&
      callsNamed(errorResponse, "jsonResponse").length === 1 &&
      nextResponseJsonCalls.length === 2 &&
      rateLimitText.includes('"Cache-Control":"no-store"') &&
      rateLimitText.includes('"X-Content-Type-Options":"nosniff"'),
  ),
  "no-store/nosniff response protection is not preserved for normal and 429 responses.",
);

const validationStatus = topLevelVariable(route, "VALIDATION_ERROR_STATUS");
const mutationStatus = topLevelVariable(route, "MUTATION_ERROR_STATUS");
const directErrorMarkers = [
  '"unauthorized", "Unauthorized.", 401',
  '"forbidden",',
  '"Security token missing or expired. Please log in again.",',
  '"invalid_request_body",',
  '"Invalid request body.",',
  '"candidate_decision_rpc_failed",',
  '"Candidate decision could not be applied.",',
];
check(
  "A20",
  Boolean(
    validationStatus &&
      mutationStatus &&
      containsAll(route.text, directErrorMarkers) &&
      containsAll(nodeText(validationStatus.statement, route), [
        "invalid_candidate_id: 400",
        "unsupported_request_field: 400",
        "client_admin_identity_not_allowed: 400",
        "ambiguous_request_field: 400",
        "invalid_action: 400",
        "invalid_reason: 400",
        "invalid_notes: 400",
        "invalid_duplicate_target: 400",
        "duplicate_tool_target_not_supported: 400",
        "invalid_request_correlation_id: 400",
      ]) &&
      containsAll(nodeText(mutationStatus.statement, route), [
        "candidate_not_found: 404",
        "decision_conflict: 409",
        "invalid_action: 400",
        "invalid_reason: 400",
        "invalid_notes: 400",
        "invalid_duplicate_target: 400",
        "candidate_decision_rpc_failed: 500",
      ]) &&
      !/(stack|cause|details|hint)\s*:/i.test(handlerText) &&
      !/JSON\.stringify\s*\(\s*error\s*\)/.test(handlerText),
  ),
  "the fixed public error/status taxonomy changed or unexpected diagnostics can be serialized.",
);

const consoleCalls = collect(route.sourceFile, (node) =>
  Boolean(
    ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(route.sourceFile) === "console",
  ),
);
const consoleSignatures = consoleCalls.map((call) => ({
  method: call.expression.name.text,
  args: call.arguments,
}));
check(
  "A21",
  consoleSignatures.length === 2 &&
    consoleSignatures[0].method === "warn" &&
    consoleSignatures[0].args.length === 1 &&
    stringLiteral(consoleSignatures[0].args[0]) ===
      "candidate_decision_unauthorized" &&
    consoleSignatures[1].method === "error" &&
    consoleSignatures[1].args.length === 1 &&
    stringLiteral(consoleSignatures[1].args[0]) ===
      "candidate_decision_unexpected_failure" &&
    !/(createAdminAuditLog|auditLog|console\.(info|log|debug|trace))/.test(
      route.text,
    ),
  "the exact two fixed one-literal console calls changed or logging/audit expanded.",
);

const requestHandlerCatches = collect(requestHandler, ts.isCatchClause);
const finalCatch = requestHandlerCatches.find((clause) =>
  nodeText(clause, route).includes("DiscoveryCandidateDecisionMutationError"),
);
const throwStatements = collect(requestHandler, ts.isThrowStatement);
check(
  "A22",
  sessionPosition < unauthorizedPosition &&
    unauthorizedPosition < csrfPosition &&
    csrfPosition < rateLimitPosition &&
    rateLimitPosition < bodyPosition &&
    bodyPosition < paramsPosition &&
    paramsPosition < validationPosition &&
    validationPosition < mutationPosition &&
    requestHandlerCatches.length === 2 &&
    Boolean(parserCatch && parserCatch.variableDeclaration?.name.getText() === "error") &&
    Boolean(finalCatch && finalCatch.variableDeclaration?.name.getText() === "error") &&
    throwStatements.length === 0 &&
    compact(nodeText(finalCatch, route)).endsWith(
      'returnerrorResponse("candidate_decision_rpc_failed","Candidatedecisioncouldnotbeapplied.",500,);}',
    ),
  "the auth-to-mutation ordering or fail-closed catch boundaries changed.",
);

const existingStatic = parseFile(EXISTING_STATIC_PATH, ts.ScriptKind.JS);
const a4Markers = [
  'import "server-only";',
  "export const POST = createCandidateDecisionHandler();",
  "verifyAdminSession",
  "verifyAdminCsrfRequest",
  "checkAdminRateLimit",
  "parseDiscoveryCandidateDecisionRequest",
  "applyDiscoveryCandidateDecision",
  "...decisionInput,",
  '"Cache-Control": "no-store"',
  '"use client"',
  "'use client'",
  "details: error",
  '"Candidate decision could not be applied."',
];
check(
  "A23",
  a4Markers.every((marker) => existingStatic.text.includes(marker)) &&
    existingStatic.text.includes(
      'console.log("A4 admin mutation route boundary static assertions passed.");',
    ) &&
    existingStatic.text.includes(
      'console.log("Phase 19S candidate decision API static assertions passed.");',
    ) &&
    (existingStatic.text.match(/"A4 decision route/g) || []).length === 13,
  "the existing candidate-decision static harness, its 13 A4 markers, or final marker changed.",
);

for (const [relativePath, expectedHash] of PROTECTED_HASHES) {
  check(
    "A24",
    sha256(relativePath) === expectedHash,
    relativePath + " does not match its protected SHA-256 identity.",
  );
}

for (const [relativePath, expectedHash] of PHASE_27GA_HASHES) {
  check(
    "A25",
    sha256(relativePath) === expectedHash,
    relativePath + " does not match its committed Phase 27GA identity.",
  );
}

process.stdout.write(
  "PASS: candidate decision route export contract static assertions (25 assertions)\n",
);
