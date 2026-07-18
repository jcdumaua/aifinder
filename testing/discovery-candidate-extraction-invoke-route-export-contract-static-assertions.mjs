import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const ROUTE_PATH =
  "app/api/admin/discovery/candidate-extraction/invoke/route.ts";
const HANDLER_PATH =
  "app/api/admin/discovery/candidate-extraction/invoke/handler.ts";
const ROUTE_TEST_PATH =
  "testing/discovery-candidate-extraction-invocation-route.test.mjs";

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

const EXPECTED_HANDLER_MODULES = new Set([
  "server-only",
  "next/server",
  "../../../../../../lib/admin-auth",
  "../../../../../../lib/admin-rate-limit",
  "../../../../../../lib/discovery/discovery-candidate-extraction-invocation",
  "../../../../../../lib/discovery/discovery-candidate-preview-live-staging-resolver",
]);

const EXPECTED_HANDLER_IMPORTS = new Set([
  "NextResponse",
  "verifyAdminCsrfRequest",
  "verifyAdminSession",
  "ADMIN_RATE_LIMIT_ACTIONS",
  "checkAdminRateLimit",
  "getAdminRateLimitResponseData",
  "AdminRateLimitResult",
  "invokeCandidateExtractionStagingPipeline",
  "CandidateExtractionInvocationInput",
  "CandidateExtractionInvocationOptions",
  "resolveCandidatePreviewLiveStagingOptions",
  "CandidatePreviewLiveStagingResolverDependencies",
]);

const EXPECTED_SEAMS = new Set([
  "resolveLiveStagingOptions",
  "getCandidatePreview",
  "stageCandidate",
  "checkRateLimit",
]);

const EXPECTED_BODY_FIELDS = new Set([
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "invocation_reason",
  "dry_run",
  "max_candidates",
  "source_scope",
  "schema_version",
]);

const EXPECTED_INVOCATION_FIELDS = new Set([
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "invocation_reason",
  "invoked_by_admin_user_id",
  "dry_run",
  "max_candidates",
  "source_scope",
  "schema_version",
]);

const EXPECTED_TEST_NAMES = [
  "server-created route dependency can stage one mocked manual API candidate",
  "default route resolver stages accepted preview through mocked preview dependencies",
  "default route resolver fails closed when preview is rejected",
  "client URL override fields are rejected before resolver execution",
  "anonymous request is rejected",
  "missing CSRF request is rejected",
  "invalid CSRF request is rejected",
  "valid dry-run admin request is accepted",
  "client-supplied admin identity is rejected",
  "dry_run false is rejected with live_invocation_not_enabled",
  "placeholder live staging approval phrase remains inactive at route boundary",
  "client body cannot activate a live staging gate",
  "invalid source and run IDs are rejected",
  "invalid schema version is rejected",
  "max candidate bound is rejected",
  "unsupported raw payload fields are rejected without echoing payload",
  "rate-limit rejection returns a safe response",
  "route source stays free of direct DB writes and audit writes",
];

const PINNED_HASHES = new Map([
  [
    "lib/admin-auth.ts",
    "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc",
  ],
  [
    "lib/admin-rate-limit.ts",
    "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b",
  ],
  [
    "lib/discovery/discovery-candidate-extraction-invocation.ts",
    "365245d0e58e958e39b352daa17865fd5643401740a7ef8397ef57791f3519f5",
  ],
  [
    "lib/discovery/discovery-candidate-preview-live-staging-resolver.ts",
    "a8d2a048e4ca4424faa373435a816378c905209b2f7d0626c7bd6cf9fac5deb9",
  ],
  [
    "lib/discovery/discovery-candidate-extraction-staging-pipeline.ts",
    "e1ce127703a1004f13f2cdb9b99a53bd05a0150229f69439be43f1bc971ece1e",
  ],
  [
    "lib/discovery/discovery-candidate-staging-admin.ts",
    "f164323723a58b25a2231a40e15dd407feb24676321371eeb76c404461bfe7fd",
  ],
  [
    "lib/discovery/discovery-candidate-preview-provider.ts",
    "9e5c3c4acb44a9e43c6ce3e86f5a8542af34a16f7e0bb266976b8804044bbd66",
  ],
  [
    "lib/discovery/discovery-supabase-admin.ts",
    "0c631c4e02ead5fe423c30a3c6126aa494fa8fd62d7a987ffd9fd7669c62eaf0",
  ],
  [
    "testing/register-typescript-test-loader.mjs",
    "f0a6b1527278f16037ffdd29f0305bbd5e79f654fae2ae0c17ef28b4c7d38a08",
  ],
  [
    "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
    "b14d5915778be4449eccea9b2269ab02c5158fd8ea9b553fe78a7717ab0029e0",
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
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) {
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

function getFactoryAndRequestHandler(handlerRecord) {
  const factory = topLevelFunction(
    handlerRecord,
    "createCandidateExtractionInvokeHandler",
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

function stringLiteral(value) {
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)
    ? value.text
    : null;
}

function containsAll(text, markers) {
  return markers.every((marker) => text.includes(marker));
}

function ifStatementContaining(root, marker, record) {
  return (
    collect(root, ts.isIfStatement).find((statement) =>
      compact(nodeText(statement.expression, record)).includes(marker),
    ) ?? null
  );
}

function responseCallIn(root, status, record) {
  return callsNamed(root, "jsonResponse").find((call) => {
    if (call.arguments.length < 2) return false;
    return compact(nodeText(call.arguments[1], record)) === String(status);
  });
}

function dynamicImportBindings(record) {
  const results = [];
  const declarations = collect(record.sourceFile, ts.isVariableDeclaration);

  for (const declaration of declarations) {
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

check(
  "A01",
  true,
  ROUTE_PATH + " has an invalid App Router runtime export.",
);

const runtimeVariable = topLevelVariable(route, "runtime");
const dynamicVariable = topLevelVariable(route, "dynamic");

check(
  "A02",
  setsEqual(routeRuntimeExports, EXPECTED_ROUTE_EXPORTS) &&
    stringLiteral(runtimeVariable?.declaration.initializer) === "nodejs" &&
    stringLiteral(dynamicVariable?.declaration.initializer) === "force-dynamic" &&
    HTTP_METHODS.filter((method) => routeRuntimeExports.has(method)).join(",") ===
      "POST",
  ROUTE_PATH +
    " does not preserve the exact runtime, dynamic, and POST route surface.",
);

const routeFactoryImports = route.sourceFile.statements.filter(
  (statement) =>
    ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === "./handler" &&
    statement.importClause?.namedBindings &&
    ts.isNamedImports(statement.importClause.namedBindings) &&
    statement.importClause.namedBindings.elements.some(
      (element) => element.name.text === "createCandidateExtractionInvokeHandler",
    ),
);
const postVariable = topLevelVariable(route, "POST");
const postInitializer = postVariable?.declaration.initializer
  ? unwrapExpression(postVariable.declaration.initializer)
  : null;
const routeFactoryCalls = callsNamed(
  route.sourceFile,
  "createCandidateExtractionInvokeHandler",
);

check(
  "A03",
  routeFactoryImports.length === 1 &&
    postInitializer &&
    ts.isCallExpression(postInitializer) &&
    callName(postInitializer) === "createCandidateExtractionInvokeHandler" &&
    postInitializer.arguments.length === 0 &&
    routeFactoryCalls.length === 1,
  ROUTE_PATH +
    " does not wire POST to exactly one zero-argument factory call from ./handler.",
);

check(
  "A04",
  existsSync(path.join(REPO_ROOT, HANDLER_PATH)),
  HANDLER_PATH + " is missing.",
);
const handler = parseFile(HANDLER_PATH);
check(
  "A04",
  sideEffectServerOnlyIsFirst(handler),
  HANDLER_PATH + ' does not have first-statement import "server-only".',
);

const { factory, requestHandler } = getFactoryAndRequestHandler(handler);
const factoryParameter = factory?.parameters[0];
const factoryDefault = factoryParameter?.initializer
  ? unwrapExpression(factoryParameter.initializer)
  : null;

check(
  "A05",
  factory &&
    isExported(factory) &&
    factory.parameters.length === 1 &&
    factoryParameter?.type?.getText(handler.sourceFile) ===
      "CandidateExtractionRouteDependencies" &&
    factoryDefault &&
    ts.isObjectLiteralExpression(factoryDefault) &&
    factoryDefault.properties.length === 0 &&
    requestHandler &&
    requestHandler.name?.text === "candidateExtractionInvokeHandler" &&
    hasModifier(requestHandler, ts.SyntaxKind.AsyncKeyword) &&
    requestHandler.parameters.length === 1 &&
    requestHandler.parameters[0].name.getText(handler.sourceFile) === "request" &&
    requestHandler.parameters[0].type?.getText(handler.sourceFile) === "Request" &&
    !routeRuntimeExports.has("createCandidateExtractionInvokeHandler"),
  HANDLER_PATH + " does not preserve the exported factory contract.",
);

const dependencyType = topLevelTypeAlias(
  handler,
  "CandidateExtractionRouteDependencies",
);
const dependencyMembers =
  dependencyType && ts.isTypeLiteralNode(dependencyType.type)
    ? dependencyType.type.members.filter(ts.isPropertySignature)
    : [];
const dependencyNames = new Set(
  dependencyMembers.map((member) => nameText(member.name)),
);
const dependencyTypeText = dependencyType
  ? nodeText(dependencyType, handler)
  : "";

check(
  "A06",
  dependencyType &&
    isExported(dependencyType) &&
    dependencyMembers.length === 4 &&
    dependencyMembers.every((member) => Boolean(member.questionToken)) &&
    setsEqual(dependencyNames, EXPECTED_SEAMS) &&
    containsAll(dependencyTypeText, [
      "CandidateExtractionInvocationOptions",
      'CandidatePreviewLiveStagingResolverDependencies["getCandidatePreview"]',
      'CandidatePreviewLiveStagingResolverDependencies["stageCandidate"]',
      "AdminRateLimitResult",
    ]),
  HANDLER_PATH + " does not preserve exactly the four approved dependency seams.",
);

const handlerImports = importDetails(handler);
check(
  "A07",
  setsEqual(new Set(handlerImports.modules), EXPECTED_HANDLER_MODULES) &&
    setsEqual(handlerImports.names, EXPECTED_HANDLER_IMPORTS) &&
    !handlerImports.modules.some((moduleName) =>
      /supabase|storage|database|audit|\/route(?:\.|$)/i.test(moduleName),
    ),
  HANDLER_PATH + " does not preserve the approved direct import graph.",
);

const sessionCalls = callsNamed(requestHandler, "verifyAdminSession");
const csrfCalls = callsNamed(requestHandler, "verifyAdminCsrfRequest");
const rateCalls = [
  ...callsNamed(requestHandler, "checkRateLimit"),
  ...callsNamed(requestHandler, "checkAdminRateLimit"),
];
const bodyCalls = callsNamed(requestHandler, "readJsonBody");
const resolverCalls = [
  ...callsNamed(requestHandler, "resolveLiveStagingOptions"),
  ...callsNamed(requestHandler, "resolveCandidatePreviewLiveStagingOptions"),
];
const pipelineCalls = callsNamed(
  requestHandler,
  "invokeCandidateExtractionStagingPipeline",
);
const sessionPosition = sessionCalls[0]?.getStart(handler.sourceFile) ?? Infinity;

check(
  "A08",
  sessionCalls.length === 1 &&
    compact(nodeText(sessionCalls[0], handler)) ===
      "verifyAdminSession(request)" &&
    csrfCalls.every(
      (call) => sessionPosition < call.getStart(handler.sourceFile),
    ) &&
    rateCalls.every(
      (call) => sessionPosition < call.getStart(handler.sourceFile),
    ) &&
    bodyCalls.every(
      (call) => sessionPosition < call.getStart(handler.sourceFile),
    ) &&
    resolverCalls.every(
      (call) => sessionPosition < call.getStart(handler.sourceFile),
    ) &&
    pipelineCalls.every(
      (call) => sessionPosition < call.getStart(handler.sourceFile),
    ),
  HANDLER_PATH + " does not authenticate exactly once before downstream work.",
);

const unauthorizedIf = ifStatementContaining(
  requestHandler,
  "!adminSession.isAdmin||!adminSession.actor",
  handler,
);
const unauthorizedConsoleCalls = unauthorizedIf
  ? collect(
      unauthorizedIf.thenStatement,
      (node) =>
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(handler.sourceFile) === "console",
    )
  : [];
const unauthorizedConsole = unauthorizedConsoleCalls[0];
const unauthorizedObject =
  unauthorizedConsole?.arguments[1] &&
  ts.isObjectLiteralExpression(unauthorizedConsole.arguments[1])
    ? unauthorizedConsole.arguments[1]
    : null;
const unauthorizedObjectProperties = unauthorizedObject
  ? propertyMap(unauthorizedObject)
  : new Map();
const unauthorizedResponse = unauthorizedIf
  ? responseCallIn(unauthorizedIf.thenStatement, 401, handler)
  : null;

check(
  "A09",
  unauthorizedIf &&
    unauthorizedConsoleCalls.length === 1 &&
    unauthorizedConsole &&
    nodeText(unauthorizedConsole.expression, handler) === "console.warn" &&
    unauthorizedConsole.arguments.length === 2 &&
    stringLiteral(unauthorizedConsole.arguments[0]) ===
      "Unauthorized candidate extraction invocation request." &&
    unauthorizedObjectProperties.size === 1 &&
    compact(
      nodeText(unauthorizedObjectProperties.get("errors"), handler),
    ).includes("errors:adminSession.errors") &&
    unauthorizedResponse &&
    nodeText(unauthorizedResponse.arguments[0], handler).includes(
      'error: "Unauthorized"',
    ) &&
    !nodeText(unauthorizedIf.thenStatement, handler).includes(
      "createAdminAuditLog",
    ),
  HANDLER_PATH + " does not preserve the exact unauthorized branch and log.",
);

const csrfIf = ifStatementContaining(
  requestHandler,
  "!verifyAdminCsrfRequest(request)",
  handler,
);
const csrfBranchText = csrfIf ? nodeText(csrfIf.thenStatement, handler) : "";
const csrfForbiddenCalls = csrfIf
  ? [
      "checkRateLimit",
      "checkAdminRateLimit",
      "readJsonBody",
      "resolveLiveStagingOptions",
      "resolveCandidatePreviewLiveStagingOptions",
      "invokeCandidateExtractionStagingPipeline",
    ].some((name) => callsNamed(csrfIf.thenStatement, name).length > 0)
  : true;

check(
  "A10",
  csrfCalls.length === 1 &&
    csrfIf &&
    csrfIf.getStart(handler.sourceFile) >
      unauthorizedIf.getStart(handler.sourceFile) &&
    containsAll(csrfBranchText, [
      "Security token missing or expired. Please log in again.",
      "403",
    ]) &&
    !csrfForbiddenCalls,
  HANDLER_PATH + " does not preserve the CSRF rejection boundary.",
);

const rateLimitInput = variableWithin(requestHandler, "rateLimitInput");
const rateLimitInputObject = rateLimitInput?.initializer
  ? unwrapExpression(rateLimitInput.initializer)
  : null;
const rateLimitInputProperties =
  rateLimitInputObject && ts.isObjectLiteralExpression(rateLimitInputObject)
    ? propertyMap(rateLimitInputObject)
    : new Map();
const rateLimitVariable = variableWithin(requestHandler, "rateLimit");
const rateLimitInitializerText = rateLimitVariable?.initializer
  ? compact(nodeText(rateLimitVariable.initializer, handler))
  : "";

check(
  "A11",
  rateLimitInputProperties.size === 3 &&
    compact(
      nodeText(rateLimitInputProperties.get("request"), handler),
    ).includes("request") &&
    compact(
      nodeText(rateLimitInputProperties.get("action"), handler),
    ).includes(
      "action:ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateExtractionInvocation",
    ) &&
    compact(
      nodeText(rateLimitInputProperties.get("actor"), handler),
    ).includes("actor:adminSession.actor") &&
    rateLimitInitializerText ===
      "dependencies.checkRateLimit?dependencies.checkRateLimit(rateLimitInput):checkAdminRateLimit(rateLimitInput)" &&
    callsNamed(requestHandler, "checkRateLimit").length === 1 &&
    callsNamed(requestHandler, "checkAdminRateLimit").length === 1 &&
    rateLimitVariable.getStart(handler.sourceFile) <
      bodyCalls[0].getStart(handler.sourceFile),
  HANDLER_PATH + " does not preserve rate-limit placement and call ceilings.",
);

const rateLimitIf = ifStatementContaining(
  requestHandler,
  "!rateLimit.allowed",
  handler,
);
const rateLimitResponse = rateLimitIf
  ? callsNamed(rateLimitIf.thenStatement, "jsonResponse")[0]
  : null;

check(
  "A12",
  rateLimitIf &&
    rateLimitResponse &&
    rateLimitResponse.arguments.length === 2 &&
    compact(nodeText(rateLimitResponse.arguments[0], handler)) ===
      "getAdminRateLimitResponseData(rateLimit)" &&
    compact(nodeText(rateLimitResponse.arguments[1], handler)) ===
      "rateLimit.status" &&
    sha256("lib/admin-rate-limit.ts") ===
      PINNED_HASHES.get("lib/admin-rate-limit.ts"),
  HANDLER_PATH + " does not preserve the shared rate-limit rejection response.",
);

const maxBodySize = topLevelVariable(handler, "MAX_BODY_SIZE_BYTES");
const readJsonBody = topLevelFunction(handler, "readJsonBody");
const readJsonBodyText = readJsonBody ? nodeText(readJsonBody, handler) : "";
const parserMessages = new Set(
  readJsonBody
    ? collect(readJsonBody, ts.isThrowStatement)
        .map((statement) => statement.expression)
        .filter(
          (expression) =>
            expression &&
            ts.isNewExpression(expression) &&
            expression.expression.getText(handler.sourceFile) === "Error" &&
            expression.arguments?.length === 1,
        )
        .map((expression) => stringLiteral(expression.arguments[0]))
        .filter(Boolean)
    : [],
);
const expectedParserMessages = new Set([
  "Invalid request format.",
  "Request is too large.",
  "Invalid request body.",
]);
const parserTry = collect(requestHandler, ts.isTryStatement).find(
  (statement) => callsNamed(statement.tryBlock, "readJsonBody").length === 1,
);
const parserCatchText = parserTry?.catchClause
  ? nodeText(parserTry.catchClause, handler)
  : "";

check(
  "A13",
  maxBodySize?.declaration.initializer &&
    compact(nodeText(maxBodySize.declaration.initializer, handler)) ===
      "8*1024" &&
    readJsonBody &&
    setsEqual(parserMessages, expectedParserMessages) &&
    containsAll(compact(readJsonBodyText), [
      'contentType.includes("application/json")',
      'request.headers.get("content-length")',
      "Number(contentLengthHeader)",
      "contentLength>MAX_BODY_SIZE_BYTES",
      "request.json().catch(()=>null)",
      "!isRecord(body)",
    ]) &&
    parserTry?.catchClause?.variableDeclaration?.name.getText(
      handler.sourceFile,
    ) === "error" &&
    containsAll(compact(parserCatchText), [
      "errorinstanceofError?error.message:",
      '"Invalidrequestbody."',
      ",400",
    ]) &&
    bodyCalls.length === 1 &&
    resolverCalls.every(
      (call) => bodyCalls[0].getStart(handler.sourceFile) < call.getStart(handler.sourceFile),
    ) &&
    pipelineCalls.every(
      (call) => bodyCalls[0].getStart(handler.sourceFile) < call.getStart(handler.sourceFile),
    ),
  HANDLER_PATH + " does not preserve the bounded JSON request parser.",
);

const allowedBodyFields = topLevelVariable(handler, "ALLOWED_BODY_FIELDS");
const allowedBodyFieldsInitializer = allowedBodyFields?.declaration.initializer
  ? unwrapExpression(allowedBodyFields.declaration.initializer)
  : null;
const allowedBodyFieldArray =
  allowedBodyFieldsInitializer &&
  ts.isNewExpression(allowedBodyFieldsInitializer) &&
  allowedBodyFieldsInitializer.arguments?.[0] &&
  ts.isArrayLiteralExpression(allowedBodyFieldsInitializer.arguments[0])
    ? allowedBodyFieldsInitializer.arguments[0]
    : null;
const actualAllowedBodyFields = new Set(
  allowedBodyFieldArray
    ? allowedBodyFieldArray.elements.map(stringLiteral).filter(Boolean)
    : [],
);
const clientIdentityConstant = topLevelVariable(
  handler,
  "CLIENT_ADMIN_IDENTITY_FIELD",
);
const clientIdentityIf = ifStatementContaining(
  requestHandler,
  "CLIENT_ADMIN_IDENTITY_FIELDinbody",
  handler,
);
const unsupportedIf = ifStatementContaining(
  requestHandler,
  "hasUnsupportedBodyField(body)",
  handler,
);
const clientIdentityText = clientIdentityIf
  ? nodeText(clientIdentityIf.thenStatement, handler)
  : "";
const unsupportedText = unsupportedIf
  ? nodeText(unsupportedIf.thenStatement, handler)
  : "";

check(
  "A14",
  setsEqual(actualAllowedBodyFields, EXPECTED_BODY_FIELDS) &&
    stringLiteral(clientIdentityConstant?.declaration.initializer) ===
      "invoked_by_admin_user_id" &&
    clientIdentityIf &&
    containsAll(clientIdentityText, [
      "Client-supplied admin identity is not allowed.",
      "client_admin_identity_not_allowed",
      "400",
    ]) &&
    unsupportedIf &&
    containsAll(unsupportedText, [
      "Unsupported candidate extraction invocation field.",
      "unsupported_request_field",
      "400",
    ]),
  HANDLER_PATH + " does not preserve the exact request-field boundary.",
);

const actorHelper = topLevelFunction(
  handler,
  "getServerDerivedAdminActorId",
);
const actorVariable = variableWithin(requestHandler, "invokedByAdminUserId");
const actorInitializerText = actorVariable?.initializer
  ? compact(nodeText(actorVariable.initializer, handler))
  : "";
const missingActorIf = ifStatementContaining(
  requestHandler,
  "!invokedByAdminUserId",
  handler,
);
const missingActorText = missingActorIf
  ? nodeText(missingActorIf.thenStatement, handler)
  : "";

check(
  "A15",
  actorHelper &&
    containsAll(compact(nodeText(actorHelper, handler)), [
      "typeofactor.id===",
      "actor.id.trim()",
      "actor.label.trim()",
    ]) &&
    actorInitializerText ===
      "getServerDerivedAdminActorId(adminSession.actor)" &&
    !actorInitializerText.includes("body") &&
    missingActorIf &&
    containsAll(missingActorText, [
      "Authenticated admin identity is unavailable.",
      "missing_admin_identity",
      "403",
    ]),
  HANDLER_PATH + " does not preserve server-derived admin identity.",
);

const invocationInput = variableWithin(requestHandler, "invocationInput");
const invocationInputInitializer = invocationInput?.initializer
  ? unwrapExpression(invocationInput.initializer)
  : null;
const invocationInputProperties =
  invocationInputInitializer &&
  ts.isObjectLiteralExpression(invocationInputInitializer)
    ? propertyMap(invocationInputInitializer)
    : new Map();
const invocationIdentityProperty = invocationInputProperties.get(
  "invoked_by_admin_user_id",
);

check(
  "A16",
  setsEqual(
    new Set(invocationInputProperties.keys()),
    EXPECTED_INVOCATION_FIELDS,
  ) &&
    compact(nodeText(invocationIdentityProperty, handler)).includes(
      "invoked_by_admin_user_id:invokedByAdminUserId",
    ) &&
    !invocationInputInitializer.properties.some(ts.isSpreadAssignment),
  HANDLER_PATH + " does not preserve the exact nine-field invocation mapping.",
);

const liveOptions = variableWithin(requestHandler, "liveStagingOptions");
const liveOptionsInitializer = liveOptions?.initializer
  ? unwrapExpression(liveOptions.initializer)
  : null;
const liveOptionsText = liveOptions?.initializer
  ? compact(nodeText(liveOptions.initializer, handler))
  : "";

check(
  "A17",
  liveOptionsInitializer &&
    ts.isConditionalExpression(liveOptionsInitializer) &&
    callsNamed(liveOptionsInitializer, "resolveLiveStagingOptions").length ===
      1 &&
    callsNamed(
      liveOptionsInitializer,
      "resolveCandidatePreviewLiveStagingOptions",
    ).length === 1 &&
    containsAll(liveOptionsText, [
      "request,body,invocationInput,invokedByAdminUserId",
      "invocationInput,invokedByAdminUserId",
      "dependencies.getCandidatePreview",
      "getCandidatePreview:dependencies.getCandidatePreview",
      "dependencies.stageCandidate",
      "stageCandidate:dependencies.stageCandidate",
    ]) &&
    liveOptions.getStart(handler.sourceFile) <
      pipelineCalls[0].getStart(handler.sourceFile),
  HANDLER_PATH + " does not preserve the injected-or-default resolver contract.",
);

const pipelineCall = pipelineCalls[0];
const resultResponse = callsNamed(requestHandler, "jsonResponse").find(
  (call) =>
    call.arguments[0]?.getText(handler.sourceFile) === "result" &&
    call.arguments[1],
);

check(
  "A18",
  pipelineCalls.length === 1 &&
    pipelineCall.arguments.length === 2 &&
    compact(nodeText(pipelineCall.arguments[0], handler)) ===
      "invocationInput" &&
    compact(nodeText(pipelineCall.arguments[1], handler)) ===
      "liveStagingOptions" &&
    resultResponse &&
    compact(nodeText(resultResponse.arguments[1], handler)) ===
      "result.accepted?200:400",
  HANDLER_PATH + " does not preserve the single pipeline call and result mapping.",
);

const directPrivilegedCalls = [];
for (const record of [route, handler]) {
  for (const call of collect(record.sourceFile, ts.isCallExpression)) {
    if (!ts.isPropertyAccessExpression(call.expression)) continue;
    const method = call.expression.name.text;
    const receiver = call.expression.expression
      .getText(record.sourceFile)
      .toLowerCase();
    const alwaysPrivileged = new Set([
      "insert",
      "update",
      "delete",
      "upsert",
      "rpc",
    ]);
    if (
      alwaysPrivileged.has(method) ||
      (method === "from" &&
        /client|supabase|database|(^|\W)db(\W|$)/.test(receiver)) ||
      receiver.includes("storage")
    ) {
      directPrivilegedCalls.push(nodeText(call, record));
    }
  }
}
const routeAndHandlerText = route.text + "\n" + handler.text;

check(
  "A19",
  directPrivilegedCalls.length === 0 &&
    !/createAdminAuditLog|createDiscoverySupabaseAdminClient|service[_-]?role/i.test(
      routeAndHandlerText,
    ),
  "route.ts or handler.ts introduces a direct privileged database, storage, service-role, or audit operation.",
);

const invocationDependency = parseFile(
  "lib/discovery/discovery-candidate-extraction-invocation.ts",
);
const resolverDependency = parseFile(
  "lib/discovery/discovery-candidate-preview-live-staging-resolver.ts",
);
const previewProviderDependency = parseFile(
  "lib/discovery/discovery-candidate-preview-provider.ts",
);
const stagingPipelineDependency = parseFile(
  "lib/discovery/discovery-candidate-extraction-staging-pipeline.ts",
);
const stagingAdminDependency = parseFile(
  "lib/discovery/discovery-candidate-staging-admin.ts",
);
const serviceRoleDependency = parseFile(
  "lib/discovery/discovery-supabase-admin.ts",
);

check(
  "A20",
  sideEffectServerOnlyIsFirst(previewProviderDependency) &&
    sideEffectServerOnlyIsFirst(stagingAdminDependency) &&
    sideEffectServerOnlyIsFirst(serviceRoleDependency) &&
    containsAll(invocationDependency.text, [
      "CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1",
      "createdByServer?: true",
      "approvedExecutionRequired?: true",
      "stageMappedExtractionCandidate",
    ]) &&
    containsAll(resolverDependency.text, [
      "createdByServer: true",
      "approvedExecutionRequired: true",
      "maxCandidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES",
      "sourceScope: \"single_run\"",
    ]) &&
    [
      invocationDependency.relativePath,
      resolverDependency.relativePath,
      previewProviderDependency.relativePath,
      stagingPipelineDependency.relativePath,
      stagingAdminDependency.relativePath,
      serviceRoleDependency.relativePath,
    ].every(
      (relativePath) => sha256(relativePath) === PINNED_HASHES.get(relativePath),
    ),
  "the pinned server-only, single-candidate privileged chain is not preserved.",
);

const jsonResponse = topLevelFunction(handler, "jsonResponse");
const nextJsonCalls = collect(
  handler.sourceFile,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(handler.sourceFile) === "NextResponse" &&
    node.expression.name.text === "json",
);
const requestHandlerReturns = collect(requestHandler, ts.isReturnStatement);

check(
  "A21",
  jsonResponse &&
    nextJsonCalls.length === 1 &&
    jsonResponse.pos <= nextJsonCalls[0].pos &&
    nextJsonCalls[0].end <= jsonResponse.end &&
    containsAll(nodeText(jsonResponse, handler), [
      '"Cache-Control": "no-store"',
      '"X-Content-Type-Options": "nosniff"',
    ]) &&
    requestHandlerReturns.length > 0 &&
    requestHandlerReturns.every(
      (statement) =>
        statement.expression &&
        ts.isCallExpression(unwrapExpression(statement.expression)) &&
        callName(unwrapExpression(statement.expression)) === "jsonResponse",
    ),
  HANDLER_PATH + " does not preserve centralized no-store/nosniff responses.",
);

const requiredPublicMarkers = [
  '"Unauthorized"',
  "Security token missing or expired. Please log in again.",
  "Invalid request format.",
  "Request is too large.",
  "Invalid request body.",
  "Client-supplied admin identity is not allowed.",
  "client_admin_identity_not_allowed",
  "Unsupported candidate extraction invocation field.",
  "unsupported_request_field",
  "Authenticated admin identity is unavailable.",
  "missing_admin_identity",
  "Candidate extraction invocation failed.",
];
const boundCatchClauses = collect(
  requestHandler,
  (node) =>
    ts.isCatchClause(node) && Boolean(node.variableDeclaration),
);
const caughtErrorProperties = collect(
  requestHandler,
  (node) =>
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "error",
);
const serializedCaughtErrors = collect(
  requestHandler,
  (node) =>
    ts.isCallExpression(node) &&
    /^(JSON\.stringify|String)$/.test(
      compact(node.expression.getText(handler.sourceFile)),
    ) &&
    node.arguments.some(
      (argument) =>
        ts.isIdentifier(unwrapExpression(argument)) &&
        unwrapExpression(argument).text === "error",
    ),
);

check(
  "A22",
  containsAll(handler.text, requiredPublicMarkers) &&
    boundCatchClauses.length === 1 &&
    boundCatchClauses[0].variableDeclaration.name.getText(
      handler.sourceFile,
    ) === "error" &&
    caughtErrorProperties.length === 1 &&
    caughtErrorProperties[0].name.text === "message" &&
    serializedCaughtErrors.length === 0 &&
    !caughtErrorProperties.some((property) =>
      new Set(["stack", "cause", "code", "details", "hint"]).has(
        property.name.text,
      ),
    ),
  HANDLER_PATH + " does not preserve the bounded direct public-error taxonomy.",
);

const consoleCalls = [];
for (const record of [route, handler]) {
  for (const call of collect(record.sourceFile, ts.isCallExpression)) {
    if (
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.expression.getText(record.sourceFile) === "console"
    ) {
      consoleCalls.push({ call, record });
    }
  }
}
const onlyConsole = consoleCalls[0];
const onlyConsoleObject =
  onlyConsole?.call.arguments[1] &&
  ts.isObjectLiteralExpression(onlyConsole.call.arguments[1])
    ? onlyConsole.call.arguments[1]
    : null;
const onlyConsoleProperties = onlyConsoleObject
  ? propertyMap(onlyConsoleObject)
  : new Map();

check(
  "A23",
  consoleCalls.length === 1 &&
    onlyConsole.record.relativePath === HANDLER_PATH &&
    nodeText(onlyConsole.call.expression, handler) === "console.warn" &&
    onlyConsole.call.arguments.length === 2 &&
    stringLiteral(onlyConsole.call.arguments[0]) ===
      "Unauthorized candidate extraction invocation request." &&
    onlyConsoleProperties.size === 1 &&
    compact(nodeText(onlyConsoleProperties.get("errors"), handler)).includes(
      "errors:adminSession.errors",
    ) &&
    !/createAdminAuditLog|audit[_A-Za-z]*\s*\(/.test(routeAndHandlerText),
  "route.ts and handler.ts do not preserve the single existing warning and no-audit contract.",
);

const outerTry = collect(requestHandler, ts.isTryStatement).find(
  (statement) =>
    callsNamed(
      statement.tryBlock,
      "invokeCandidateExtractionStagingPipeline",
    ).length === 1,
);
const resultResponsePosition =
  resultResponse?.getStart(handler.sourceFile) ?? Infinity;
const orderedPositions = [
  sessionCalls[0]?.getStart(handler.sourceFile),
  unauthorizedIf?.getStart(handler.sourceFile),
  csrfIf?.getStart(handler.sourceFile),
  rateLimitVariable?.getStart(handler.sourceFile),
  bodyCalls[0]?.getStart(handler.sourceFile),
  clientIdentityIf?.getStart(handler.sourceFile),
  actorVariable?.getStart(handler.sourceFile),
  invocationInput?.getStart(handler.sourceFile),
  liveOptions?.getStart(handler.sourceFile),
  pipelineCall?.getStart(handler.sourceFile),
  resultResponsePosition,
];
const positionsAreOrdered = orderedPositions.every(
  (position, index) =>
    Number.isFinite(position) &&
    (index === 0 || orderedPositions[index - 1] < position),
);
const outerCatchText = outerTry?.catchClause
  ? nodeText(outerTry.catchClause, handler)
  : "";

check(
  "A24",
  positionsAreOrdered &&
    outerTry &&
    !outerTry.catchClause?.variableDeclaration &&
    containsAll(outerCatchText, [
      "Candidate extraction invocation failed.",
      "500",
    ]) &&
    collect(outerTry.catchClause, ts.isThrowStatement).length === 0 &&
    requestHandler.body.statements.at(-1) === outerTry &&
    outerTry.tryBlock.statements.at(-1) instanceof Object &&
    ts.isReturnStatement(outerTry.tryBlock.statements.at(-1)) &&
    ts.isReturnStatement(outerTry.catchClause.block.statements.at(-1)),
  HANDLER_PATH + " does not preserve the full fail-closed request ordering.",
);

const routeTest = parseFile(ROUTE_TEST_PATH, ts.ScriptKind.JS);
const actualTestNames = collect(
  routeTest.sourceFile,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "test" &&
    node.arguments.length > 0 &&
    ts.isStringLiteral(node.arguments[0]),
).map((call) => call.arguments[0].text);
const testImports = dynamicImportBindings(routeTest);
const routeTestImport = testImports.find((entry) =>
  entry.source.endsWith(
    "/app/api/admin/discovery/candidate-extraction/invoke/route.ts",
  ),
);
const handlerTestImport = testImports.find((entry) =>
  entry.source.endsWith(
    "/app/api/admin/discovery/candidate-extraction/invoke/handler.ts",
  ),
);
const testFactoryCalls = callsNamed(
  routeTest.sourceFile,
  "createCandidateExtractionInvokeHandler",
);
const injectedSeamNames = new Set();
let factoryArgumentsAreObjects = true;
for (const call of testFactoryCalls) {
  const argument = call.arguments[0]
    ? unwrapExpression(call.arguments[0])
    : null;
  if (!argument || !ts.isObjectLiteralExpression(argument)) {
    factoryArgumentsAreObjects = false;
    continue;
  }
  for (const property of argument.properties) {
    if ("name" in property && property.name) {
      injectedSeamNames.add(nameText(property.name));
    }
  }
}
const noRawLeakHelper = topLevelFunction(routeTest, "assertNoRawPayloadLeak");
const sourceSafetyTest = collect(
  routeTest.sourceFile,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "test" &&
    ts.isStringLiteral(node.arguments[0]) &&
    node.arguments[0].text ===
      "route source stays free of direct DB writes and audit writes",
)[0];
const sourceSafetyText = sourceSafetyTest
  ? nodeText(sourceSafetyTest, routeTest)
  : "";

check(
  "A25",
  actualTestNames.length === EXPECTED_TEST_NAMES.length &&
    actualTestNames.every(
      (name, index) => name === EXPECTED_TEST_NAMES[index],
    ) &&
    routeTestImport &&
    setsEqual(routeTestImport.bindings, new Set(["POST"])) &&
    handlerTestImport &&
    setsEqual(
      handlerTestImport.bindings,
      new Set(["createCandidateExtractionInvokeHandler"]),
    ) &&
    testFactoryCalls.length === 5 &&
    factoryArgumentsAreObjects &&
    setsEqual(injectedSeamNames, EXPECTED_SEAMS) &&
    noRawLeakHelper &&
    containsAll(nodeText(noRawLeakHelper, routeTest), [
      "<script",
      "secret=value",
      "raw_payload",
      "service_role",
      "stack",
      "SUPABASE",
    ]) &&
    containsAll(sourceSafetyText, [
      "candidate-extraction/invoke/route.ts",
      "candidate-extraction/invoke/handler.ts",
      "forbiddenTokens",
      "handlerSource.includes(token)",
      'routeSource.includes("createCandidateExtractionInvokeHandler")',
      'routeSource.includes("./handler")',
      'handlerSource.includes("resolveCandidatePreviewLiveStagingOptions")',
    ]) &&
    !routeTestImport.bindings.has(
      "createCandidateExtractionInvokeHandler",
    ),
  ROUTE_TEST_PATH + " does not preserve all 18 tests and five injected seams.",
);

for (const [relativePath, expectedHash] of PINNED_HASHES) {
  check(
    "A26",
    existsSync(path.join(REPO_ROOT, relativePath)) &&
      sha256(relativePath) === expectedHash,
    relativePath + " does not match its pinned read-only SHA-256 identity.",
  );
}

process.stdout.write(
  "PASS: candidate extraction invoke route export contract static assertions (26 assertions)\n",
);
