import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

const HOMEPAGE_PATH = "lib/homepage-control-public.ts";
const SUBMIT_PATH = "app/api/submit-tool/route.ts";
const UPLOAD_PATH = "app/api/upload-logo/route.ts";
const HELPER_PATH = "lib/public-live-route-safety.ts";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SELF_PATH = "testing/public-live-route-security-static-assertions.mjs";

const failures = [];

function fail(category) {
  if (!failures.includes(category)) failures.push(category);
}

function sourceFile(repositoryPath) {
  const source = readFileSync(repositoryPath, "utf8");
  return {
    source,
    ast: ts.createSourceFile(
      repositoryPath,
      source,
      ts.ScriptTarget.Latest,
      true,
      repositoryPath.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : repositoryPath.endsWith(".ts")
          ? ts.ScriptKind.TS
          : ts.ScriptKind.JS,
    ),
  };
}

function walk(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => walk(child, visitor));
}

function subtreeHasMessageAccess(node) {
  let found = false;
  walk(node, (child) => {
    if (
      ts.isPropertyAccessExpression(child) &&
      child.name.text === "message"
    ) {
      found = true;
    }
  });
  return found;
}

function consoleCalls(ast) {
  const calls = [];
  walk(ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "console"
    ) {
      calls.push(node);
    }
  });
  return calls;
}

function warningPushContainsRawMessage(ast) {
  let found = false;
  walk(ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "warnings" &&
      node.expression.name.text === "push" &&
      node.arguments.some(subtreeHasMessageAccess)
    ) {
      found = true;
    }
  });
  return found;
}

function warningPushContainsPrivateIdentifier(ast) {
  let found = false;
  walk(ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "warnings" &&
      node.expression.name.text === "push"
    ) {
      walk(node, (child) => {
        if (
          (ts.isIdentifier(child) && child.text === "slug") ||
          (ts.isPropertyAccessExpression(child) &&
            child.name.text === "placementId")
        ) {
          found = true;
        }
      });
    }
  });
  return found;
}

function catchBindingNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (
      ts.isCatchClause(node) &&
      node.variableDeclaration &&
      ts.isIdentifier(node.variableDeclaration.name)
    ) {
      names.add(node.variableDeclaration.name.text);
    }
  });
  return names;
}

function consoleCallHasRawCatchBinding(call, catchNames) {
  let found = false;
  for (const argument of call.arguments) {
    walk(argument, (node) => {
      if (ts.isIdentifier(node) && catchNames.has(node.text)) found = true;
    });
  }
  return found;
}

function hasNamedImport(ast, moduleSpecifier, importedName) {
  return ast.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteralLike(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.endsWith(moduleSpecifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some(
        (element) =>
          (element.propertyName?.text ?? element.name.text) === importedName,
      ),
  );
}

function callPositions(ast, names) {
  const positions = new Map(names.map((name) => [name, []]));
  walk(ast, (node) => {
    if (!ts.isCallExpression(node)) return;
    const expression = node.expression;
    const name = ts.isIdentifier(expression)
      ? expression.text
      : ts.isPropertyAccessExpression(expression)
        ? expression.name.text
        : "";
    if (positions.has(name)) positions.get(name).push(node.getStart(ast));
  });
  return positions;
}

function hasRequestBodyParser(ast, method) {
  let found = false;
  walk(ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "request" &&
      node.expression.name.text === method
    ) {
      found = true;
    }
  });
  return found;
}

function boundedRouteContract(
  ast,
  moduleSpecifier,
  parserName,
  forbiddenRequestParser,
  maximumName,
  privilegedCallName,
) {
  const positions = callPositions(ast, [
    "readBoundedRequestBody",
    parserName,
    privilegedCallName,
  ]);
  const boundedPositions = positions.get("readBoundedRequestBody");
  const parsePositions = positions.get(parserName);
  const privilegedPositions = positions.get(privilegedCallName);
  let boundedCallUsesMaximum = false;
  walk(ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "readBoundedRequestBody" &&
      node.arguments.length === 2 &&
      ts.isIdentifier(node.arguments[0]) &&
      node.arguments[0].text === "request" &&
      ts.isIdentifier(node.arguments[1]) &&
      node.arguments[1].text === maximumName
    ) {
      boundedCallUsesMaximum = true;
    }
  });
  return (
    hasNamedImport(ast, moduleSpecifier, "readBoundedRequestBody") &&
    hasNamedImport(ast, moduleSpecifier, parserName) &&
    boundedCallUsesMaximum &&
    boundedPositions.length === 1 &&
    parsePositions.length === 1 &&
    !hasRequestBodyParser(ast, forbiddenRequestParser) &&
    (privilegedPositions.length === 0 ||
      boundedPositions[0] < privilegedPositions[0])
  );
}

const homepage = sourceFile(HOMEPAGE_PATH);
const submit = sourceFile(SUBMIT_PATH);
const upload = sourceFile(UPLOAD_PATH);

if (
  warningPushContainsRawMessage(homepage.ast) ||
  warningPushContainsPrivateIdentifier(homepage.ast) ||
  /\b(?:errors|warnings)\s*:\s*parsed\.(?:errors|warnings)\b/u.test(
    homepage.source,
  ) ||
  /\.\.\.parsed\.(?:errors|warnings)\b/u.test(homepage.source)
) {
  fail("EXPECTED_FAIL_PUBLIC_HOMEPAGE_WARNING_RETURNS_RAW_BACKEND_MESSAGE");
}

const uploadConsoleCalls = consoleCalls(upload.ast);
if (uploadConsoleCalls.some(subtreeHasMessageAccess)) {
  fail("EXPECTED_FAIL_UPLOAD_LOGS_RAW_STORAGE_ERROR_MESSAGE");
}
const uploadCatchNames = catchBindingNames(upload.ast);
if (
  uploadConsoleCalls.some((call) =>
    consoleCallHasRawCatchBinding(call, uploadCatchNames),
  )
) {
  fail("EXPECTED_FAIL_UPLOAD_LOGS_RAW_CAUGHT_ERROR_OBJECT");
}

const submitBounded = boundedRouteContract(
  submit.ast,
  "lib/public-live-route-safety",
  "parseBoundedJsonBody",
  "json",
  "MAX_BODY_SIZE_BYTES",
  "createClient",
);
if (!submitBounded) {
  fail("EXPECTED_FAIL_SUBMIT_MISSING_CONTENT_LENGTH_BYPASSES_20K_LIMIT");
  fail("EXPECTED_FAIL_SUBMIT_UNDERSTATED_CONTENT_LENGTH_BYPASSES_20K_LIMIT");
}

const uploadBounded = boundedRouteContract(
  upload.ast,
  "lib/public-live-route-safety",
  "parseBoundedFormData",
  "formData",
  "MAX_REQUEST_SIZE_BYTES",
  "upload",
);
if (!uploadBounded) {
  fail("EXPECTED_FAIL_UPLOAD_MISSING_CONTENT_LENGTH_BYPASSES_3M_LIMIT");
  fail("EXPECTED_FAIL_UPLOAD_UNDERSTATED_CONTENT_LENGTH_BYPASSES_3M_LIMIT");
}

if (!existsSync(HELPER_PATH)) {
  fail("EXPECTED_FAIL_SHARED_ACTUAL_BYTE_BOUNDARY_ABSENT");
} else {
  const helper = sourceFile(HELPER_PATH);
  const helperMarkers = [
    'import "server-only";',
    "getReader()",
    "reader.cancel()",
    "reader.releaseLock()",
    "content_length_malformed",
    "content_length_negative",
    "content_length_understated",
    "request_body_too_large",
    "request_body_aborted",
    "request_body_read_failed",
    "request_body_already_consumed",
    "request_body_decode_failed",
    "request_body_invalid_json",
    "request_body_invalid_form_data",
    "new TextDecoder",
    "fatal: true",
    "Promise.race",
    "request.signal.addEventListener",
    "request.signal.removeEventListener",
    "bytes = null",
    "parseBoundedJsonBody",
    "parseBoundedFormData",
  ];
  if (
    helperMarkers.some((marker) => !helper.source.includes(marker)) ||
    /\bconsole\.(?:log|warn|error|info)\s*\(/u.test(helper.source) ||
    /\bprocess\.env\b/u.test(helper.source)
  ) {
    fail("PUBLIC_LIVE_ROUTE_SHARED_HELPER_CONTRACT");
  }
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const manifestEntry = manifest.entries.find((entry) => entry.path === SELF_PATH);
if (
  !manifestEntry ||
  manifestEntry.role !== "EXECUTABLE" ||
  manifestEntry.safety_class !== "SAFE_STATIC_CORE" ||
  manifestEntry.ci_disposition !== "RUN_CORE" ||
  JSON.stringify(manifestEntry.command_argv) !==
    JSON.stringify(["node", SELF_PATH])
) {
  fail("EXPECTED_FAIL_PUBLIC_LIVE_ROUTE_STATIC_CORE_ABSENT");
}

if (failures.length > 0) {
  for (const failure of failures) console.log(failure);
  console.log(
    `FAIL_PUBLIC_LIVE_ROUTE_SECURITY_STATIC failures=${failures.length} internal_failures=0`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "PASS_PUBLIC_LIVE_ROUTE_SECURITY_STATIC homepage=PASS submit=PASS upload=PASS shared_helper=PASS manifest_core=PASS failures=0 internal_failures=0",
  );
}
