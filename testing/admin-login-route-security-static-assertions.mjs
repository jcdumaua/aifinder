import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");
const ROUTE_PATH = "app/api/admin/login/route.ts";
const ROUTE_ABS = path.join(REPO_ROOT, ROUTE_PATH);

const READ_ONLY_HASHES = new Map([
  [
    "lib/admin-audit-log.ts",
    "545ebc99f886918fc579b0b050cff12ad16ca283bbb3437e7505a27bd86bd6e3",
  ],
  [
    "lib/admin-auth.ts",
    "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc",
  ],
  [
    "lib/supabase-admin.ts",
    "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae",
  ],
]);

const PROTECTED_REFERENCE_HASHES = new Map([
  [
    "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
    "b14d5915778be4449eccea9b2269ab02c5158fd8ea9b553fe78a7717ab0029e0",
  ],
  [
    "app/api/admin/audit-logs/route.ts",
    "7b53e0ddccbd0cad69ed28fd39cb206b547df775696f78522d5cd885adef9295",
  ],
]);

const APPROVED_LOCAL_FILES = new Set([
  ROUTE_PATH,
  ...READ_ONLY_HASHES.keys(),
]);

const APPROVED_EVENTS = new Map([
  ["admin_login_rate_limited", "warn"],
  ["admin_login_configuration_unavailable", "error"],
  ["admin_login_invalid_credentials", "warn"],
  ["admin_login_success", "info"],
  ["admin_login_unexpected_failure", "error"],
]);

const APPROVED_ERRORS = new Set([
  "Invalid login request.",
  "Too many login attempts. Please wait and try again.",
  "Invalid credentials.",
  "Admin login is temporarily unavailable.",
]);

function fail(id, reason) {
  process.stderr.write(`${id} fails because ${reason}\n`);
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function parseFile(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const text = readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  return { absolutePath, relativePath, sourceFile, text };
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
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

function compact(text) {
  return text.replace(/\s+/g, "");
}

function functionDeclaration(record, name) {
  return record.sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === name
  );
}

function variableDeclaration(root, name) {
  return first(
    root,
    (node) => ts.isVariableDeclaration(node) && node.name.getText() === name
  );
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
    (node) => ts.isCallExpression(node) && callName(node) === name
  );
}

function propertyNameText(name) {
  if (!name) return "";
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return name.getText().replace(/^['"]|['"]$/g, "");
}

function objectProperties(objectLiteral) {
  const properties = new Map();
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      properties.set(propertyNameText(property.name), property.initializer);
    } else if (ts.isShorthandPropertyAssignment(property)) {
      properties.set(property.name.text, property.name);
    }
  }
  return properties;
}

function topLevelConstants(record) {
  const constants = new Map();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        constants.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  return constants;
}

function staticString(expression, stringConstants) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isIdentifier(expression)) {
    const initializer = stringConstants.get(expression.text);
    if (initializer && ts.isStringLiteral(initializer)) return initializer.text;
  }
  return null;
}

function numericStatus(call) {
  if (call.arguments.length < 2) return 200;
  const status = call.arguments[1];
  return ts.isNumericLiteral(status) ? Number(status.text) : null;
}

function nearestAncestor(node, predicate) {
  let current = node.parent;
  while (current) {
    if (predicate(current)) return current;
    current = current.parent;
  }
  return null;
}

function consoleCalls(root) {
  return collect(root, (node) => {
    if (!ts.isCallExpression(node)) return false;
    const expression = node.expression;
    return (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "console"
    );
  });
}

function resolveRelativeImport(fromRelativePath, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(
    REPO_ROOT,
    path.dirname(fromRelativePath),
    specifier
  );
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    return path.relative(REPO_ROOT, candidate).split(path.sep).join("/");
  }

  return null;
}

function reachableLocalRecords(startRecord) {
  const records = new Map([[startRecord.relativePath, startRecord]]);
  const queue = [startRecord];
  const unexpected = [];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const statement of current.sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const resolved = resolveRelativeImport(
        current.relativePath,
        statement.moduleSpecifier.text
      );
      if (!resolved || records.has(resolved)) continue;
      if (!APPROVED_LOCAL_FILES.has(resolved)) {
        unexpected.push(resolved);
        continue;
      }
      const record = parseFile(resolved);
      records.set(resolved, record);
      queue.push(record);
    }
  }

  return { records, unexpected };
}

const route = parseFile(ROUTE_PATH);
const routeConstants = topLevelConstants(route);
const stringConstants = new Map(
  [...routeConstants].filter(([, value]) => ts.isStringLiteral(value))
);
const post = functionDeclaration(route, "POST");

const firstStatement = route.sourceFile.statements[0];
check(
  "A01",
  Boolean(
    firstStatement &&
      ts.isImportDeclaration(firstStatement) &&
      !firstStatement.importClause &&
      ts.isStringLiteral(firstStatement.moduleSpecifier) &&
      firstStatement.moduleSpecifier.text === "server-only"
  ),
  'app/api/admin/login/route.ts does not have a route-local first-statement import "server-only".'
);

const httpMethods = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
const exportedMethods = route.sourceFile.statements
  .filter(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      httpMethods.has(statement.name.text) &&
      hasModifier(statement, ts.SyntaxKind.ExportKeyword)
  )
  .map((statement) => statement.name.text);
check(
  "A02",
  exportedMethods.length === 1 && exportedMethods[0] === "POST",
  "the exported HTTP method surface is not exactly POST."
);

const runtimeInitializer = routeConstants.get("runtime");
const dynamicInitializer = routeConstants.get("dynamic");
check(
  "A03",
  Boolean(
    runtimeInitializer &&
      ts.isStringLiteral(runtimeInitializer) &&
      runtimeInitializer.text === "nodejs" &&
      dynamicInitializer &&
      ts.isStringLiteral(dynamicInitializer) &&
      dynamicInitializer.text === "force-dynamic"
  ),
  'the route does not preserve runtime="nodejs" and dynamic="force-dynamic".'
);

check("A04", Boolean(post?.body), "the POST handler body is unavailable for structural checks.");
const rateCalls = callsNamed(post.body, "checkRateLimit");
const bodyTextCalls = collect(
  post.body,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.getText() === "request.text"
);
const credentialCalls = callsNamed(post.body, "safeCompare");
check(
  "A04",
  rateCalls.length === 1 &&
    bodyTextCalls.length === 1 &&
    credentialCalls.length === 1 &&
    rateCalls[0].getStart() < bodyTextCalls[0].getStart() &&
    bodyTextCalls[0].getStart() < credentialCalls[0].getStart(),
  "rate limiting is not called exactly once before body consumption and credential authentication."
);

const contentTypeMarker = first(
  post.body,
  (node) => ts.isStringLiteral(node) && node.text === "content-type"
);
const contentLengthMarker = first(
  post.body,
  (node) => ts.isStringLiteral(node) && node.text === "content-length"
);
const byteLengthCall = collect(
  post.body,
  (node) => ts.isCallExpression(node) && node.expression.getText() === "Buffer.byteLength"
)[0];
const jsonParseCall = callsNamed(post.body, "parse").find(
  (call) => call.expression.getText() === "JSON.parse"
);
const arrayGuardCall = collect(
  post.body,
  (node) => ts.isCallExpression(node) && node.expression.getText() === "Array.isArray"
)[0];
const passwordAccess = first(
  post.body,
  (node) =>
    ts.isPropertyAccessExpression(node) && node.name.text === "password"
);
const validationMarkers = [
  contentTypeMarker,
  contentLengthMarker,
  bodyTextCalls[0],
  byteLengthCall,
  jsonParseCall,
  arrayGuardCall,
  passwordAccess,
];
check(
  "A05",
  validationMarkers.every(
    (marker) => marker && marker.getStart() < credentialCalls[0].getStart()
  ),
  "request envelope parsing, body validation, and password extraction do not all precede authentication."
);

const mediaTypeDeclaration = variableDeclaration(post.body, "mediaType");
const mediaTypeText = mediaTypeDeclaration?.initializer
  ? compact(mediaTypeDeclaration.initializer.getText())
  : "";
const mediaTypeComparison = collect(
  post.body,
  (node) =>
    ts.isBinaryExpression(node) &&
    node.left.getText() === "mediaType" &&
    node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
    ts.isStringLiteral(node.right) &&
    node.right.text === "application/json"
)[0];
const permissiveMediaTypeCall = collect(
  post.body,
  (node) =>
    ts.isCallExpression(node) &&
    callName(node) === "includes" &&
    node.arguments.some(
      (argument) =>
        ts.isStringLiteral(argument) && argument.text === "application/json"
    )
)[0];
check(
  "A06",
  mediaTypeText.includes('contentType.split(";")[0].trim().toLowerCase()') &&
    Boolean(mediaTypeComparison) &&
    !permissiveMediaTypeCall,
  "the media type is not normalized and compared exactly with application/json."
);

const postText = post.body.getText(route.sourceFile);
const compactPostText = compact(postText);
check(
  "A07",
  compactPostText.includes('/^\\d+$/.test(contentLengthHeader)') &&
    compactPostText.includes("Number(contentLengthHeader)") &&
    compactPostText.includes("Number.isFinite(contentLength)") &&
    compactPostText.includes("Number.isInteger(contentLength)") &&
    compactPostText.includes("contentLength<0") &&
    compactPostText.includes("contentLength>MAX_BODY_SIZE_BYTES"),
  "declared Content-Length is not validated as finite, non-negative decimal integer data before the 5 KiB ceiling."
);

const directRequestJson = collect(
  post.body,
  (node) =>
    ts.isCallExpression(node) && node.expression.getText() === "request.json"
)[0];
check(
  "A08",
  !directRequestJson &&
    Boolean(byteLengthCall) &&
    byteLengthCall.arguments[0]?.getText() === "rawBody" &&
    staticString(byteLengthCall.arguments[1], stringConstants) === "utf8" &&
    Boolean(jsonParseCall) &&
    bodyTextCalls[0].getStart() < byteLengthCall.getStart() &&
    byteLengthCall.getStart() < jsonParseCall.getStart() &&
    compactPostText.includes("actualBodySize>MAX_BODY_SIZE_BYTES"),
  "actual UTF-8 bytes are not capped before JSON parsing and authentication."
);

const bodyGuard = collect(
  post.body,
  (node) =>
    ts.isIfStatement(node) &&
    compact(node.expression.getText()).includes(
      '!body||typeofbody!=="object"||Array.isArray(body)'
    )
)[0];
check(
  "A09",
  Boolean(bodyGuard) &&
    Boolean(passwordAccess) &&
    bodyGuard.getStart() < passwordAccess.getStart(),
  "the parsed body is not proven to be a non-null, non-array object before password access."
);

const expectedPasswordAccess = first(
  post.body,
  (node) => node.getText() === "process.env.ADMIN_PASSWORD"
);
const sessionSecretAccess = first(
  post.body,
  (node) => node.getText() === "process.env.ADMIN_SESSION_SECRET"
);
check(
  "A10",
  Boolean(
    bodyGuard &&
      expectedPasswordAccess &&
      sessionSecretAccess &&
      jsonParseCall &&
      jsonParseCall.getStart() < bodyGuard.getStart() &&
      bodyGuard.getStart() < expectedPasswordAccess.getStart() &&
      expectedPasswordAccess.getStart() < credentialCalls[0].getStart() &&
      sessionSecretAccess.getStart() < credentialCalls[0].getStart()
  ),
  "request parsing and shape validation do not precede configuration checks and authentication."
);

const safeCompare = functionDeclaration(route, "safeCompare");
const digestCalls = safeCompare?.body ? callsNamed(safeCompare.body, "createHash") : [];
const updateCalls = safeCompare?.body ? callsNamed(safeCompare.body, "update") : [];
const timingCalls = safeCompare?.body
  ? callsNamed(safeCompare.body, "timingSafeEqual")
  : [];
const unsafeLengthAccess = safeCompare?.body
  ? first(
      safeCompare.body,
      (node) => ts.isPropertyAccessExpression(node) && node.name.text === "length"
    )
  : null;
const earlyFalse = safeCompare?.body
  ? first(
      safeCompare.body,
      (node) =>
        ts.isReturnStatement(node) && node.expression?.kind === ts.SyntaxKind.FalseKeyword
    )
  : null;
check(
  "A11",
  Boolean(
    safeCompare?.body &&
      digestCalls.length === 2 &&
      digestCalls.every(
        (call) => staticString(call.arguments[0], stringConstants) === "sha256"
      ) &&
      updateCalls.length === 2 &&
      updateCalls.some(
        (call) =>
          call.arguments[0]?.getText() === "first" &&
          staticString(call.arguments[1], stringConstants) === "utf8"
      ) &&
      updateCalls.some(
        (call) =>
          call.arguments[0]?.getText() === "second" &&
          staticString(call.arguments[1], stringConstants) === "utf8"
      ) &&
      timingCalls.length === 1 &&
      !unsafeLengthAccess &&
      !earlyFalse
  ),
  "safeCompare does not normalize both credentials to SHA-256 digests before one timingSafeEqual call."
);

const authForbiddenCalls = new Set([
  "signIn",
  "signInWithPassword",
  "getUser",
  "verifyOtp",
]);
check(
  "A12",
  credentialCalls.length === 1 &&
    credentialCalls[0].arguments[0]?.getText() === "password" &&
    credentialCalls[0].arguments[1]?.getText() === "expectedPassword" &&
    !first(
      post.body,
      (node) => ts.isCallExpression(node) && authForbiddenCalls.has(callName(node))
    ),
  "credential authentication is not exactly one local password comparison with no provider lookup."
);

const signSessionCalls = callsNamed(post.body, "signSession");
const cookieSetCalls = collect(
  post.body,
  (node) =>
    ts.isCallExpression(node) && node.expression.getText() === "response.cookies.set"
);
check(
  "A13",
  signSessionCalls.length === 1 && cookieSetCalls.length === 1,
  "session signing or cookie creation exceeds the one-success-path call ceiling."
);

const responseCalls = collect(
  post.body,
  (node) =>
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "jsonResponse" &&
    node.arguments[0] &&
    ts.isObjectLiteralExpression(node.arguments[0])
);

function responseRecord(call) {
  const properties = objectProperties(call.arguments[0]);
  return {
    call,
    properties,
    status: numericStatus(call),
    error: properties.has("error")
      ? staticString(properties.get("error"), stringConstants)
      : null,
  };
}

const responses = responseCalls.map(responseRecord);
const rateResponses = responses.filter((response) => response.status === 429);
const rateIf = rateResponses[0]
  ? nearestAncestor(rateResponses[0].call, ts.isIfStatement)
  : null;
check(
  "A14",
  rateResponses.length === 1 &&
    rateResponses[0].error ===
      "Too many login attempts. Please wait and try again." &&
    Boolean(rateIf?.expression.getText().includes("checkRateLimit")),
  "the denied rate-limit branch does not return the fixed 429 response."
);

const malformedResponses = responses.filter((response) =>
  [400, 413, 415].includes(response.status)
);
const malformedStatuses = new Set(
  malformedResponses.map((response) => response.status)
);
check(
  "A15",
  malformedResponses.length >= 5 &&
    [400, 413, 415].every((status) => malformedStatuses.has(status)) &&
    malformedResponses.every(
      (response) => response.error === "Invalid login request."
    ) &&
    !route.text.includes("Invalid login format.") &&
    !route.text.includes("Login request is too large."),
  "malformed request branches do not use only the fixed malformed response with 400, 413, and 415 categories."
);

const authenticationResponses = responses.filter(
  (response) => response.status === 401
);
check(
  "A16",
  authenticationResponses.length === 1 &&
    authenticationResponses[0].error === "Invalid credentials." &&
    !route.text.includes("Wrong password"),
  "credential failures do not share the fixed Invalid credentials. 401 response."
);

const operationalResponses = responses.filter(
  (response) => response.status === 500
);
check(
  "A17",
  operationalResponses.length === 2 &&
    operationalResponses.every(
      (response) => response.error === "Admin login is temporarily unavailable."
    ) &&
    !route.text.includes("Admin login failed."),
  "configuration and unexpected failures do not share one fixed operational 500 response."
);

const successResponses = responses.filter((response) => {
  const success = response.properties.get("success");
  return success?.kind === ts.SyntaxKind.TrueKeyword;
});
const successProperties = successResponses[0]?.properties;
check(
  "A18",
  successResponses.length === 1 &&
    successResponses[0].status === 200 &&
    successProperties.size === 2 &&
    staticString(successProperties.get("message"), stringConstants) ===
      "Admin login successful.",
  "the successful response does not preserve exactly success=true and the approved message."
);

const forbiddenResponseFields = new Set([
  "token",
  "cookie",
  "session",
  "signature",
  "payload",
  "expiresAt",
  "expiry",
  "secret",
  "user",
  "email",
  "identifier",
]);
check(
  "A19",
  responses.every((response) =>
    [...response.properties.keys()].every(
      (property) => !forbiddenResponseFields.has(property)
    )
  ),
  "a public response exposes authentication or session diagnostics."
);

const errorResponses = responses.filter((response) =>
  response.properties.has("error")
);
check(
  "A20",
  errorResponses.every(
    (response) => response.error && APPROVED_ERRORS.has(response.error)
  ),
  "an error response contains a dynamic or non-approved diagnostic value."
);

const serializedError = first(post.body, (node) => {
  if (ts.isSpreadAssignment(node)) return true;
  if (ts.isShorthandPropertyAssignment(node) && node.name.text === "error") {
    return true;
  }
  if (!ts.isCallExpression(node)) return false;
  const name = node.expression.getText();
  return (
    (name === "JSON.stringify" || name === "String") &&
    node.arguments.some((argument) => /error/i.test(argument.getText()))
  );
});
check(
  "A21",
  !serializedError,
  "an error object is serialized, spread, stringified, or directly returned."
);

const routeConsoleCalls = consoleCalls(route.sourceFile);
check(
  "A22",
  routeConsoleCalls.every(
    (call) => call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0])
  ),
  "a console call is not a single fixed string-literal event."
);

const actualEvents = routeConsoleCalls.map((call) => ({
  event: ts.isStringLiteral(call.arguments[0]) ? call.arguments[0].text : null,
  method: call.expression.name.text,
  call,
}));
const eventCounts = new Map();
for (const event of actualEvents) {
  eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1);
}
const rateEvent = actualEvents.find(
  (event) => event.event === "admin_login_rate_limited"
);
const configEvent = actualEvents.find(
  (event) => event.event === "admin_login_configuration_unavailable"
);
const credentialEvent = actualEvents.find(
  (event) => event.event === "admin_login_invalid_credentials"
);
const successEvent = actualEvents.find(
  (event) => event.event === "admin_login_success"
);
const unexpectedEvent = actualEvents.find(
  (event) => event.event === "admin_login_unexpected_failure"
);
const outerTry = post.body.statements.find(ts.isTryStatement);
check(
  "A23",
  actualEvents.length === APPROVED_EVENTS.size &&
    [...APPROVED_EVENTS].every(
      ([event, method]) =>
        eventCounts.get(event) === 1 &&
        actualEvents.some(
          (actual) => actual.event === event && actual.method === method
        )
    ) &&
    Boolean(
      rateEvent &&
        nearestAncestor(rateEvent.call, ts.isIfStatement)?.expression
          .getText()
          .includes("checkRateLimit")
    ) &&
    Boolean(
      configEvent &&
        nearestAncestor(configEvent.call, ts.isIfStatement)?.expression
          .getText()
          .includes("expectedPassword")
    ) &&
    Boolean(
      credentialEvent &&
        nearestAncestor(credentialEvent.call, ts.isIfStatement)?.expression
          .getText()
          .includes("safeCompare")
    ) &&
    Boolean(
      unexpectedEvent &&
        outerTry?.catchClause?.block ===
          nearestAncestor(unexpectedEvent.call, ts.isBlock)
    ),
  "the five-event allowlist, console levels, or structural event paths differ from the approved contract."
);

const graph = reachableLocalRecords(route);
const reachableConsoleCalls = [...graph.records.values()].flatMap((record) =>
  consoleCalls(record.sourceFile).map((call) => ({ call, record }))
);
const rawMessageLog = reachableConsoleCalls.find(({ call }) =>
  call.arguments.some((argument) =>
    Boolean(
      first(
        argument,
        (node) =>
          ts.isPropertyAccessExpression(node) && node.name.text === "message"
      )
    )
  )
);
check(
  "A24",
  !rawMessageLog,
  "a reachable logging path reads .message or ?.message from a diagnostic object."
);

check(
  "A25",
  Boolean(outerTry?.catchClause && !outerTry.catchClause.variableDeclaration),
  "the outer POST catch is not binding-free."
);

const diagnosticNames = new Set(["stack", "cause", "details", "hint", "code"]);
const diagnosticLog = reachableConsoleCalls.find(({ call }) =>
  call.arguments.some((argument) =>
    Boolean(
      first(
        argument,
        (node) =>
          ts.isPropertyAccessExpression(node) &&
          diagnosticNames.has(node.name.text)
      )
    )
  )
);
check(
  "A26",
  !diagnosticLog,
  "a reachable logging path reads stack, cause, details, hint, or code diagnostics."
);

const sensitiveLoggerCall = [...graph.records.values()].find((record) =>
  first(
    record.sourceFile,
    (node) =>
      ts.isCallExpression(node) &&
      callName(node) === "createAdminAuditLog"
  )
);
check(
  "A27",
  routeConsoleCalls.every(
    (call) => call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0])
  ) && !sensitiveLoggerCall,
  "request, credential, session, identity, IP, user-agent, or dynamic data remains reachable by a logger."
);

const auditIdentifier = first(
  route.sourceFile,
  (node) => ts.isIdentifier(node) && node.text === "createAdminAuditLog"
);
check(
  "A28",
  !auditIdentifier,
  "the route still imports, references, or calls createAdminAuditLog."
);

const privilegedReachability =
  graph.unexpected.length > 0 ||
  graph.records.has("lib/admin-audit-log.ts") ||
  graph.records.has("lib/supabase-admin.ts") ||
  [...graph.records.values()].some(
    (record) =>
      record.text.includes("supabaseAdmin") ||
      record.text.includes("@supabase/supabase-js")
  );
check(
  "A29",
  !privilegedReachability,
  "the route dependency graph still reaches a privileged Supabase client or an unapproved local dependency."
);

const forbiddenOperationalCalls = new Set([
  "from",
  "insert",
  "update",
  "delete",
  "rpc",
  "upload",
  "remove",
  "signIn",
  "signInWithPassword",
  "setSession",
  "createSession",
]);
function isForbiddenOperationalCall(node) {
  if (!ts.isCallExpression(node)) return false;

  const name = callName(node);
  if (!forbiddenOperationalCalls.has(name)) return false;
  if (!ts.isPropertyAccessExpression(node.expression)) return true;

  const receiver = node.expression.expression;
  if (name === "from" && receiver.getText() === "Buffer") return false;
  if (
    name === "update" &&
    ts.isCallExpression(receiver) &&
    ["createHash", "createHmac"].includes(callName(receiver))
  ) {
    return false;
  }

  return true;
}
const operationalCall = [...graph.records.values()].find((record) =>
  first(record.sourceFile, isForbiddenOperationalCall)
);
check(
  "A30",
  !operationalCall &&
    signSessionCalls.length === 1 &&
    cookieSetCalls.length === 1,
  "a database, RPC, storage, provider-auth, external-session, or extra mutation call is reachable."
);

const expiresAtDeclaration = variableDeclaration(post.body, "expiresAt");
const successResponseCall = successResponses[0]?.call;
const successReturn = collect(
  post.body,
  (node) =>
    ts.isReturnStatement(node) && node.expression?.getText() === "response"
)[0];
check(
  "A31",
  Boolean(
    expiresAtDeclaration &&
      successResponseCall &&
      successEvent &&
      successReturn &&
      credentialCalls[0].getStart() < expiresAtDeclaration.getStart() &&
      expiresAtDeclaration.getStart() < signSessionCalls[0].getStart() &&
      signSessionCalls[0].getStart() < successResponseCall.getStart() &&
      successResponseCall.getStart() < cookieSetCalls[0].getStart() &&
      cookieSetCalls[0].getStart() < successEvent.call.getStart() &&
      successEvent.call.getStart() < successReturn.getStart()
  ),
  "session creation, cookie completion, success logging, and return ordering are not preserved."
);

const sessionMaxAge = routeConstants.get("SESSION_MAX_AGE_SECONDS");
const signSession = functionDeclaration(route, "signSession");
const cookieOptions = cookieSetCalls[0]?.arguments[2];
const cookieProperties =
  cookieOptions && ts.isObjectLiteralExpression(cookieOptions)
    ? objectProperties(cookieOptions)
    : new Map();
check(
  "A32",
  Boolean(
    sessionMaxAge &&
      compact(sessionMaxAge.getText()) === "60*60*4" &&
      signSession?.body &&
      compact(signSession.body.getText()).includes(
        'createHmac("sha256",secret).update(payload).digest("hex")'
      ) &&
      expiresAtDeclaration?.initializer &&
      compact(expiresAtDeclaration.initializer.getText()) ===
        "Date.now()+SESSION_MAX_AGE_SECONDS*1000" &&
      cookieSetCalls[0].arguments[0]?.getText() ===
        "ADMIN_SESSION_COOKIE_NAME" &&
      cookieSetCalls[0].arguments[1]?.getText() === "sessionValue" &&
      cookieProperties.get("httpOnly")?.kind === ts.SyntaxKind.TrueKeyword &&
      compact(cookieProperties.get("secure")?.getText() || "") ===
        'process.env.NODE_ENV==="production"' &&
      staticString(cookieProperties.get("sameSite"), stringConstants) ===
        "strict" &&
      cookieProperties.get("maxAge")?.getText() ===
        "SESSION_MAX_AGE_SECONDS" &&
      staticString(cookieProperties.get("path"), stringConstants) === "/" &&
      !cookieProperties.has("domain")
  ),
  "the four-hour HMAC session or secure cookie attributes changed."
);

const nextResponseJsonCalls = collect(
  route.sourceFile,
  (node) =>
    ts.isCallExpression(node) && node.expression.getText() === "NextResponse.json"
);
const jsonResponseFunction = functionDeclaration(route, "jsonResponse");
const protectedJsonCall = nextResponseJsonCalls[0];
const protectedOptions = protectedJsonCall?.arguments[1];
const protectedProperties =
  protectedOptions && ts.isObjectLiteralExpression(protectedOptions)
    ? objectProperties(protectedOptions)
    : new Map();
const protectedHeaders = protectedProperties.get("headers");
const headerProperties =
  protectedHeaders && ts.isObjectLiteralExpression(protectedHeaders)
    ? objectProperties(protectedHeaders)
    : new Map();
check(
  "A33",
  Boolean(
    nextResponseJsonCalls.length === 1 &&
      jsonResponseFunction?.body &&
      nearestAncestor(protectedJsonCall, ts.isFunctionDeclaration) ===
        jsonResponseFunction &&
      staticString(headerProperties.get("Cache-Control"), stringConstants) ===
        "no-store" &&
      staticString(
        headerProperties.get("X-Content-Type-Options"),
        stringConstants
      ) === "nosniff" &&
      responses.length === responseCalls.length
  ),
  "responses are not centralized through the no-store and nosniff JSON helper."
);

const auditWriter = parseFile("lib/admin-audit-log.ts");
const auditFirstStatement = auditWriter.sourceFile.statements[0];
const auditConsoleCalls = consoleCalls(auditWriter.sourceFile);
const auditEventNames = new Set(
  auditConsoleCalls
    .filter(
      (call) =>
        call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0])
    )
    .map((call) => call.arguments[0].text)
);
const auditCatch = collect(auditWriter.sourceFile, ts.isCatchClause)[0];
const expectedAuditEvents = new Set([
  "admin_audit_log_insert_rejected",
  "admin_audit_log_unexpected_failure",
]);

check(
  "A34",
  [...READ_ONLY_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash
  ) &&
    Boolean(
      auditFirstStatement &&
        ts.isImportDeclaration(auditFirstStatement) &&
        !auditFirstStatement.importClause &&
        ts.isStringLiteral(auditFirstStatement.moduleSpecifier) &&
        auditFirstStatement.moduleSpecifier.text === "server-only"
    ) &&
    auditConsoleCalls.length === 2 &&
    auditConsoleCalls.every(
      (call) =>
        call.expression.getText() === "console.error" &&
        call.arguments.length === 1 &&
        ts.isStringLiteral(call.arguments[0])
    ) &&
    auditEventNames.size === expectedAuditEvents.size &&
    [...auditEventNames].every((event) => expectedAuditEvents.has(event)) &&
    Boolean(auditCatch && !auditCatch.variableDeclaration) &&
    !first(auditCatch.block, ts.isThrowStatement) &&
    !auditWriter.text.includes("error.message") &&
    !auditWriter.text.includes("error?.message"),
  "the immediate dependency identity or fixed, server-only, swallow-on-failure audit boundary differs from the approved contract."
);

check(
  "A35",
  [...PROTECTED_REFERENCE_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash
  ),
  "a protected security-reference identity differs from the approved SHA-256 contract."
);

const catchBlock = outerTry?.catchClause?.block;
const catchConsoleCalls = catchBlock ? consoleCalls(catchBlock) : [];
const catchResponses = catchBlock
  ? collect(
      catchBlock,
      (node) =>
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "jsonResponse" &&
        node.arguments[0] &&
        ts.isObjectLiteralExpression(node.arguments[0])
    ).map(responseRecord)
  : [];
const catchThrow = catchBlock
  ? first(catchBlock, (node) => ts.isThrowStatement(node))
  : null;
check(
  "A36",
  Boolean(
    outerTry?.catchClause &&
      !outerTry.catchClause.variableDeclaration &&
      catchConsoleCalls.length === 1 &&
      catchConsoleCalls[0].expression.getText() === "console.error" &&
      ts.isStringLiteral(catchConsoleCalls[0].arguments[0]) &&
      catchConsoleCalls[0].arguments[0].text ===
        "admin_login_unexpected_failure" &&
      catchResponses.length === 1 &&
      catchResponses[0].status === 500 &&
      catchResponses[0].error === "Admin login is temporarily unavailable." &&
      !catchThrow
  ),
  "the binding-free unexpected path does not log one fixed event and return the protected operational 500."
);

process.stdout.write(
  "PASS: admin login route security static assertions (36 assertions)\n"
);
