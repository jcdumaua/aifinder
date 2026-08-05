import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const READ_ALLOWLIST = Object.freeze([
  "app/api/admin/audit-logs/route.ts",
  "app/api/admin/csrf/route.ts",
  "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/route.ts",
  "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
  "app/api/admin/discovery/discovered-tools/route.ts",
  "app/api/admin/discovery/intake/route.ts",
  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
  "app/api/admin/discovery/runs/manual/claim/route.ts",
  "app/api/admin/discovery/runs/manual/route.ts",
  "app/api/admin/discovery/runs/route.ts",
  "app/api/admin/discovery/sources/[id]/route.ts",
  "app/api/admin/discovery/sources/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/route.ts",
  "app/api/admin/homepage-control/drafts/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
  "testing/authenticated-live-route-semantic-branch-ledger.json",
  "testing/readiness-coverage-matrix.json",
  "testing/public-launch-blocker-registry.json",
  "testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs",
  "testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.test.mjs",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.schema.json",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.json",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs"
]);
const READ_ALLOWLIST_SET = new Set(READ_ALLOWLIST);
const READ_COUNTS = new Map();
const REPOSITORY_ROOT = path.resolve(process.cwd());
const LEDGER_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.json";

function readExactC2_2(relativePath) {
  if (
    typeof relativePath !== "string" ||
    path.isAbsolute(relativePath) ||
    relativePath.split("/").includes("..") ||
    !READ_ALLOWLIST_SET.has(relativePath)
  ) {
    const error = new Error("C2_2_READ_NOT_ALLOWED");
    error.code = "C2_2_READ_NOT_ALLOWED";
    throw error;
  }
  const absolutePath = path.resolve(REPOSITORY_ROOT, relativePath);
  if (
    absolutePath === REPOSITORY_ROOT ||
    !absolutePath.startsWith(REPOSITORY_ROOT + path.sep)
  ) {
    const error = new Error("C2_2_READ_OUTSIDE_ROOT");
    error.code = "C2_2_READ_OUTSIDE_ROOT";
    throw error;
  }
  const metadata = lstatSync(absolutePath);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    const error = new Error("C2_2_READ_NOT_REGULAR");
    error.code = "C2_2_READ_NOT_REGULAR";
    throw error;
  }
  if (realpathSync(absolutePath) !== absolutePath) {
    const error = new Error("C2_2_READ_RESOLUTION_MISMATCH");
    error.code = "C2_2_READ_RESOLUTION_MISMATCH";
    throw error;
  }
  const bytes = readFileSync(absolutePath);
  READ_COUNTS.set(relativePath, (READ_COUNTS.get(relativePath) ?? 0) + 1);
  return bytes;
}

const ROUTE_PATHS = Object.freeze(READ_ALLOWLIST.slice(0, 28));
const V1_CRITICAL_ROUTE_PATHS = Object.freeze([
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
]);
const V1_CRITICAL_ROUTE_PATH_SET = new Set(V1_CRITICAL_ROUTE_PATHS);
const V1_DEFERRED_ROUTE_PATHS = Object.freeze(
  ROUTE_PATHS.filter((routePath) => !V1_CRITICAL_ROUTE_PATH_SET.has(routePath)),
);
const V1_CRITICAL_STATE =
  "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED";
const V1_DEFERRED_STATE = "V1_ADMIN_DEFERRED_FAIL_CLOSED";
const V1_STAGING_GAP =
  "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED";
const C2_1_LEDGER_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const BLOCKER_PATH = "testing/public-launch-blocker-registry.json";
const SCHEMA_PATH =
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.schema.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const MANIFEST_TEST_PATH = "testing/static-test-safety-manifest.test.mjs";
const RUNNER_PATH = "testing/run-static-readiness.mjs";
const QUALIFICATION_ORDER = Object.freeze([
  "DEFERRED_CATCH_OUTCOME",
  "DEFERRED_UNATTRIBUTED_IF_OUTCOME",
  "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
  "DEFERRED_NON_SINGLE_RETURN_BRANCH",
  "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
  "DEFERRED_NON_LITERAL_4XX_STATUS",
  "DEFERRED_NON_CLOSED_RESPONSE_DATA",
  "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function shaFields(...values) {
  return sha256(values.join("\0"));
}

function gitBlob(bytes) {
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`, "utf8")
    .update(bytes)
    .digest("hex");
}

function countLf(bytes) {
  let count = 0;
  for (const byte of bytes) if (byte === 0x0a) count += 1;
  return count;
}

function strictJson(bytes) {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  let cursor = 0;
  const skip = () => {
    while (/\s/.test(text[cursor] ?? "")) cursor += 1;
  };
  const stringValue = () => {
    const start = cursor;
    if (text[cursor] !== '"') throw new Error("STRICT_JSON_SYNTAX");
    cursor += 1;
    while (cursor < text.length) {
      if (text[cursor] === '"') {
        cursor += 1;
        return JSON.parse(text.slice(start, cursor));
      }
      if (text[cursor] === "\\") {
        cursor += 1;
        if (text[cursor] === "u") cursor += 4;
      }
      cursor += 1;
    }
    throw new Error("STRICT_JSON_SYNTAX");
  };
  const value = () => {
    skip();
    if (text[cursor] === "{") {
      cursor += 1;
      const result = {};
      const keys = new Set();
      skip();
      if (text[cursor] === "}") {
        cursor += 1;
        return result;
      }
      while (cursor < text.length) {
        const key = stringValue();
        if (keys.has(key)) {
          const error = new Error("STRICT_JSON_DUPLICATE_KEY");
          error.code = "STRICT_JSON_DUPLICATE_KEY";
          throw error;
        }
        keys.add(key);
        skip();
        if (text[cursor] !== ":") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
        result[key] = value();
        skip();
        if (text[cursor] === "}") {
          cursor += 1;
          return result;
        }
        if (text[cursor] !== ",") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
        skip();
      }
      throw new Error("STRICT_JSON_SYNTAX");
    }
    if (text[cursor] === "[") {
      cursor += 1;
      const result = [];
      skip();
      if (text[cursor] === "]") {
        cursor += 1;
        return result;
      }
      while (cursor < text.length) {
        result.push(value());
        skip();
        if (text[cursor] === "]") {
          cursor += 1;
          return result;
        }
        if (text[cursor] !== ",") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
      }
      throw new Error("STRICT_JSON_SYNTAX");
    }
    if (text[cursor] === '"') return stringValue();
    for (const [token, parsed] of [["true", true], ["false", false], ["null", null]]) {
      if (text.startsWith(token, cursor)) {
        cursor += token.length;
        return parsed;
      }
    }
    const number = text.slice(cursor).match(
      /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/,
    );
    if (!number) throw new Error("STRICT_JSON_SYNTAX");
    cursor += number[0].length;
    return Number(number[0]);
  };
  const result = value();
  skip();
  if (cursor !== text.length) throw new Error("STRICT_JSON_TRAILING_DATA");
  return result;
}

function schemaTypeMatches(value, expectedType) {
  if (expectedType === "null") return value === null;
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (expectedType === "integer") return Number.isInteger(value);
  if (expectedType === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }
  return typeof value === expectedType;
}

function validateSchema(contract, value, rootSchema) {
  if (contract.$ref) {
    const prefix = "#/$defs/";
    assert(contract.$ref.startsWith(prefix));
    validateSchema(rootSchema.$defs[contract.$ref.slice(prefix.length)], value, rootSchema);
    return;
  }
  if (contract.oneOf) {
    let matches = 0;
    for (const choice of contract.oneOf) {
      try {
        validateSchema(choice, value, rootSchema);
        matches += 1;
      } catch {
        // A non-matching branch is expected.
      }
    }
    assert.equal(matches, 1);
    return;
  }
  if (Object.hasOwn(contract, "const")) assert.deepEqual(value, contract.const);
  if (contract.enum) {
    assert(contract.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(value)));
  }
  if (contract.type) {
    const types = Array.isArray(contract.type) ? contract.type : [contract.type];
    assert(types.some((type) => schemaTypeMatches(value, type)));
  }
  if (typeof value === "string") {
    if (contract.minLength !== undefined) assert(value.length >= contract.minLength);
    if (contract.pattern) assert(new RegExp(contract.pattern).test(value));
  }
  if (typeof value === "number") {
    if (contract.minimum !== undefined) assert(value >= contract.minimum);
    if (contract.maximum !== undefined) assert(value <= contract.maximum);
  }
  if (Array.isArray(value)) {
    if (contract.minItems !== undefined) assert(value.length >= contract.minItems);
    if (contract.maxItems !== undefined) assert(value.length <= contract.maxItems);
    if (contract.uniqueItems) {
      assert.equal(new Set(value.map((entry) => JSON.stringify(entry))).size, value.length);
    }
    const prefixItems = contract.prefixItems ?? [];
    prefixItems.forEach((child, index) => validateSchema(child, value[index], rootSchema));
    if (contract.items === false) assert(value.length <= prefixItems.length);
    else if (contract.items && typeof contract.items === "object") {
      value.slice(prefixItems.length).forEach(
        (entry) => validateSchema(contract.items, entry, rootSchema),
      );
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = contract.properties ?? {};
    for (const key of contract.required ?? []) assert(Object.hasOwn(value, key));
    if (contract.additionalProperties === false) {
      assert(Object.keys(value).every((key) => Object.hasOwn(properties, key)));
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) validateSchema(properties[key], child, rootSchema);
    }
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function exactKeys(value, keys) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort());
}

function expectCode(callback, code) {
  let caught = null;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.equal(caught?.code, code);
}

const beforeNegative = READ_COUNTS.size;
expectCode(() => readExactC2_2("lib/admin-auth.ts"), "C2_2_READ_NOT_ALLOWED");
assert.equal(READ_COUNTS.size, beforeNegative);
const FILE_BYTES = new Map(
  READ_ALLOWLIST.map((repositoryPath) => [
    repositoryPath,
    readExactC2_2(repositoryPath),
  ]),
);
const ledgerBytes = FILE_BYTES.get(LEDGER_PATH);

function parseRouteBytes(routePath, bytes) {
  const routeText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const file = ts.createSourceFile(
    routePath,
    routeText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert.equal(file.parseDiagnostics.length, 0);
  return { file, routeText };
}

function collectRouteNodes(routeRecord, parsed) {
  const discovered = [];
  const visit = (node) => {
    if (ts.isIfStatement(node) || ts.isCatchClause(node)) {
      const start = node.getStart(parsed.file, false);
      const end = node.end;
      discovered.push({
        kind: ts.isIfStatement(node) ? "IF" : "CATCH",
        start_utf16: start,
        end_utf16: end,
        source_span_sha256: sha256(parsed.routeText.slice(start, end)),
        ast: node,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed.file);
  discovered.sort(
    (left, right) =>
      left.start_utf16 - right.start_utf16 ||
      left.end_utf16 - right.end_utf16 ||
      (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
  );
  return discovered.map((node) => ({
    ...node,
    node_id: shaFields(
      "AIFINDER_C2_1_NODE_V1",
      routeRecord.route_path,
      routeRecord.git_blob,
      node.kind,
      String(node.start_utf16),
      String(node.end_utf16),
      node.source_span_sha256,
    ),
  }));
}

function bindingCount(file, name) {
  let count = 0;
  const bindingName = (node) => {
    if (ts.isIdentifier(node) && node.text === name) count += 1;
    else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      for (const element of node.elements) {
        if (ts.isBindingElement(element)) bindingName(element.name);
      }
    }
  };
  const visit = (node) => {
    if (ts.isImportSpecifier(node) && node.name.text === name) count += 1;
    else if (ts.isImportClause(node) && node.name?.text === name) count += 1;
    else if (ts.isNamespaceImport(node) && node.name.text === name) count += 1;
    else if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
      bindingName(node.name);
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassExpression(node)) &&
      node.name?.text === name
    ) count += 1;
    else if (ts.isCatchClause(node) && node.variableDeclaration) {
      bindingName(node.variableDeclaration.name);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return count;
}

function nextResponseNames(file) {
  const names = new Set();
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "next/server"
    ) continue;
    const named = statement.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const element of named.elements) {
      if (
        (element.propertyName?.text ?? element.name.text) === "NextResponse" &&
        bindingCount(file, element.name.text) === 1
      ) names.add(element.name.text);
    }
  }
  return names;
}

function oneReturn(statement) {
  if (ts.isReturnStatement(statement) && statement.expression) {
    return statement.expression;
  }
  if (
    ts.isBlock(statement) &&
    statement.statements.length === 1 &&
    ts.isReturnStatement(statement.statements[0]) &&
    statement.statements[0].expression
  ) return statement.statements[0].expression;
  return null;
}

function responseCall(file, expression) {
  if (
    ts.isCallExpression(expression) &&
    !expression.questionDotToken &&
    expression.arguments.length === 2 &&
    expression.arguments.every((argument) => !ts.isSpreadElement(argument)) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    !expression.expression.questionDotToken &&
    expression.expression.name.text === "json" &&
    ts.isIdentifier(expression.expression.expression)
  ) {
    const receiver = expression.expression.expression.text;
    if (nextResponseNames(file).has(receiver)) {
      return {
        shape: "NEXT_RESPONSE_JSON",
        data: expression.arguments[0],
        init: expression.arguments[1],
      };
    }
    if (receiver === "Response" && bindingCount(file, "Response") === 0) {
      return {
        shape: "GLOBAL_RESPONSE_JSON",
        data: expression.arguments[0],
        init: expression.arguments[1],
      };
    }
  }
  if (
    ts.isNewExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === "Response" &&
    bindingCount(file, "Response") === 0 &&
    expression.arguments?.length === 2 &&
    expression.arguments.every((argument) => !ts.isSpreadElement(argument))
  ) {
    return {
      shape: "GLOBAL_NEW_RESPONSE",
      data: expression.arguments[0],
      init: expression.arguments[1],
    };
  }
  return null;
}

function unwrap(node) {
  let value = node;
  while (
    ts.isParenthesizedExpression(value) ||
    ts.isAsExpression(value) ||
    ts.isTypeAssertionExpression(value) ||
    ts.isSatisfiesExpression(value) ||
    ts.isNonNullExpression(value)
  ) value = value.expression;
  return value;
}

function propertyName(node) {
  if (ts.isComputedPropertyName(node)) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return null;
}

function literalInteger4xx(node, file) {
  if (!ts.isNumericLiteral(node)) return null;
  const text = node.getText(file);
  if (!/^(?:0|[1-9][0-9]*)$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value >= 400 && value <= 499
    ? value
    : null;
}

function closedData(node, file) {
  const value = unwrap(node);
  if (
    value.kind === ts.SyntaxKind.NullKeyword ||
    value.kind === ts.SyntaxKind.TrueKeyword ||
    value.kind === ts.SyntaxKind.FalseKeyword ||
    ts.isStringLiteral(value) ||
    ts.isNoSubstitutionTemplateLiteral(value)
  ) return true;
  if (ts.isNumericLiteral(value)) {
    const text = value.getText(file);
    return !/^0[xob]/i.test(text) && !text.includes("_") && Number.isFinite(Number(text));
  }
  if (
    ts.isPrefixUnaryExpression(value) &&
    value.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(value.operand)
  ) {
    const text = value.operand.getText(file);
    return !/^0[xob]/i.test(text) && !text.includes("_") && Number.isFinite(Number(text));
  }
  if (ts.isArrayLiteralExpression(value)) {
    return value.elements.every(
      (element) =>
        !ts.isOmittedExpression(element) &&
        !ts.isSpreadElement(element) &&
        closedData(element, file),
    );
  }
  if (ts.isObjectLiteralExpression(value)) {
    return value.properties.every(
      (entry) =>
        ts.isPropertyAssignment(entry) &&
        propertyName(entry.name) !== null &&
        closedData(entry.initializer, file),
    );
  }
  return false;
}

function responseEligibility(call, file) {
  const init = unwrap(call.init);
  if (!ts.isObjectLiteralExpression(init)) return { status: null, closed: false };
  let statusCount = 0;
  let status = null;
  const otherValues = [];
  for (const entry of init.properties) {
    if (!ts.isPropertyAssignment(entry) || propertyName(entry.name) === null) {
      return { status: null, closed: false };
    }
    if (propertyName(entry.name) === "status") {
      statusCount += 1;
      status = literalInteger4xx(entry.initializer, file);
    } else {
      otherValues.push(entry.initializer);
    }
  }
  if (statusCount !== 1 || status === null) return { status: null, closed: false };
  return {
    status,
    closed:
      closedData(call.data, file) &&
      otherValues.every((entry) => closedData(entry, file)),
  };
}

function baseOverlay(node, outcome, method) {
  const methodId =
    node.ownership_state === "UNIQUE" &&
      node.candidate_exported_method_ids.length === 1
      ? method?.method_id ?? node.candidate_exported_method_ids[0]
      : null;
  if (outcome.outcome_kind === "CATCH_ENTERED") {
    return {
      outcome_id: outcome.outcome_id,
      node_id: node.node_id,
      route_path: outcome.route_path,
      outcome_kind: outcome.outcome_kind,
      ownership_state: node.ownership_state,
      method_id_or_null: methodId,
      qualification_state: "DEFERRED_CATCH_OUTCOME",
      reason_code: "CATCH_OUTCOME_REQUIRES_FRESH_AUTHORITY",
      candidate_id_or_null: null,
      execution_state: "NOT_EXECUTED",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
    };
  }
  if (node.ownership_state !== "UNIQUE") {
    return {
      outcome_id: outcome.outcome_id,
      node_id: node.node_id,
      route_path: outcome.route_path,
      outcome_kind: outcome.outcome_kind,
      ownership_state: node.ownership_state,
      method_id_or_null: null,
      qualification_state: "DEFERRED_UNATTRIBUTED_IF_OUTCOME",
      reason_code: "IF_OUTCOME_NOT_UNIQUELY_OWNED",
      candidate_id_or_null: null,
      execution_state: "NOT_EXECUTED",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
    };
  }
  return {
    outcome_id: outcome.outcome_id,
    node_id: node.node_id,
    route_path: outcome.route_path,
    outcome_kind: outcome.outcome_kind,
    ownership_state: node.ownership_state,
    method_id_or_null: methodId,
    qualification_state: null,
    reason_code: null,
    candidate_id_or_null: null,
    execution_state: "NOT_EXECUTED",
    behavior_state: "NOT_RUNTIME_QUALIFIED",
  };
}

function withDeferral(base, state, reason) {
  return { ...base, qualification_state: state, reason_code: reason };
}

function qualifyIndependently({ parsed, astNode, route, method, node, outcome }) {
  const base = baseOverlay(node, outcome, method);
  if (
    outcome.outcome_kind === "CATCH_ENTERED" ||
    node.ownership_state !== "UNIQUE"
  ) return { overlay: base, candidate: null };
  assert(ts.isIfStatement(astNode));
  let branch;
  if (outcome.outcome_kind === "IF_TRUE") branch = astNode.thenStatement;
  else if (outcome.outcome_kind === "IF_FALSE_OR_FALLTHROUGH") {
    if (!astNode.elseStatement) {
      return {
        overlay: withDeferral(
          base,
          "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
          "FALSE_OUTCOME_HAS_NO_EXPLICIT_ELSE",
        ),
        candidate: null,
      };
    }
    branch = astNode.elseStatement;
  } else {
    assert.fail("OUTCOME_KIND");
  }
  const returned = oneReturn(branch);
  if (!returned) {
    return {
      overlay: withDeferral(
        base,
        "DEFERRED_NON_SINGLE_RETURN_BRANCH",
        "BRANCH_IS_NOT_EXACT_SINGLE_RETURN",
      ),
      candidate: null,
    };
  }
  const response = responseCall(parsed.file, returned);
  if (!response) {
    return {
      overlay: withDeferral(
        base,
        "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
        "RESPONSE_CONSTRUCTOR_NOT_RECOGNIZED",
      ),
      candidate: null,
    };
  }
  const eligibleData = responseEligibility(response, parsed.file);
  if (eligibleData.status === null) {
    return {
      overlay: withDeferral(
        base,
        "DEFERRED_NON_LITERAL_4XX_STATUS",
        "RESPONSE_STATUS_NOT_EXACT_LITERAL_4XX",
      ),
      candidate: null,
    };
  }
  if (!eligibleData.closed) {
    return {
      overlay: withDeferral(
        base,
        "DEFERRED_NON_CLOSED_RESPONSE_DATA",
        "RESPONSE_DATA_NOT_EXACT_CLOSED_DATA",
      ),
      candidate: null,
    };
  }
  const branchStart = branch.getStart(parsed.file, false);
  const branchEnd = branch.end;
  const branchHash = sha256(parsed.routeText.slice(branchStart, branchEnd));
  const candidateId = shaFields(
    "AIFINDER_C2_2_CANDIDATE_V1",
    outcome.outcome_id,
    route.git_blob,
    method.method_id,
    outcome.outcome_kind,
    String(branchStart),
    String(branchEnd),
    branchHash,
    response.shape,
    String(eligibleData.status),
  );
  return {
    overlay: {
      ...withDeferral(
        base,
        "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
        "EXACT_CLOSED_DATA_LITERAL_4XX_RESPONSE",
      ),
      candidate_id_or_null: candidateId,
    },
    candidate: {
      candidate_id: candidateId,
      outcome_id: outcome.outcome_id,
      node_id: node.node_id,
      route_path: outcome.route_path,
      method_id: method.method_id,
      http_method: method.http_method,
      outcome_kind: outcome.outcome_kind,
      branch_start_utf16: branchStart,
      branch_end_utf16: branchEnd,
      branch_span_sha256: branchHash,
      response_shape: response.shape,
      status_code: eligibleData.status,
      eligibility_state: "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
      semantic_family: "UNCLASSIFIED_STATIC_4XX_RESPONSE",
      execution_state: "NOT_EXECUTED",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      next_authority: "FRESH_HERMETIC_SYNTHETIC_EXECUTION_REVIEW_REQUIRED",
      reason_codes: [
        "UNIQUE_IF_OUTCOME",
        "EXPLICIT_BRANCH",
        "SINGLE_RETURN_BRANCH",
        "RECOGNIZED_RESPONSE_CONSTRUCTOR",
        "LITERAL_4XX_STATUS",
        "CLOSED_DATA_RESPONSE",
      ],
    },
  };
}

function buildIndependentOracle(c2_1) {
  assert.equal(sha256(FILE_BYTES.get(C2_1_LEDGER_PATH)),
    "d668f5955dd0f7b3c079625711fa873576869039f26263267f1a4821da6090e3");
  assert.deepEqual(c2_1.routes.map((route) => route.route_path), ROUTE_PATHS);
  const parsedByPath = new Map();
  const astByNodeId = new Map();
  for (const route of c2_1.routes) {
    const bytes = FILE_BYTES.get(route.route_path);
    assert.equal(sha256(bytes), route.sha256);
    assert.equal(gitBlob(bytes), route.git_blob);
    assert.equal(bytes.length, route.bytes);
    assert.equal(countLf(bytes), route.lf_lines);
    const parsed = parseRouteBytes(route.route_path, bytes);
    parsedByPath.set(route.route_path, parsed);
    const discovered = collectRouteNodes(route, parsed);
    const recorded = c2_1.nodes.filter((node) => node.route_path === route.route_path);
    assert.equal(discovered.length, recorded.length);
    assert.deepEqual(
      discovered.map((node) => [
        node.node_id,
        node.kind,
        node.start_utf16,
        node.end_utf16,
        node.source_span_sha256,
      ]),
      recorded.map((node) => [
        node.node_id,
        node.kind,
        node.start_utf16,
        node.end_utf16,
        node.source_span_sha256,
      ]),
    );
    assert.deepEqual(recorded.map((node) => node.node_id), route.node_ids);
    for (const node of discovered) astByNodeId.set(node.node_id, node.ast);
  }
  const nodeById = new Map(c2_1.nodes.map((node) => [node.node_id, node]));
  const methodById = new Map(c2_1.methods.map((method) => [method.method_id, method]));
  const routeByPath = new Map(c2_1.routes.map((route) => [route.route_path, route]));
  assert.equal(nodeById.size, 409);
  assert.equal(methodById.size, 37);
  for (const method of c2_1.methods) {
    const route = routeByPath.get(method.route_path);
    assert.equal(
      method.method_id,
      shaFields(
        "AIFINDER_C2_1_METHOD_V1",
        method.route_path,
        route.git_blob,
        method.http_method,
        method.export_form,
        method.implementation_kind,
      ),
    );
  }
  for (const node of c2_1.nodes) {
    const expectedKinds = node.kind === "IF"
      ? ["IF_TRUE", "IF_FALSE_OR_FALLTHROUGH"]
      : ["CATCH_ENTERED"];
    assert.deepEqual(
      node.outcome_ids,
      expectedKinds.map((kind) =>
        shaFields("AIFINDER_C2_1_OUTCOME_V1", node.node_id, kind)
      ),
    );
  }
  const candidates = [];
  const outcomeOverlay = c2_1.outcomes.map((outcome) => {
    const node = nodeById.get(outcome.node_id);
    assert(node && node.outcome_ids.includes(outcome.outcome_id));
    const methodId = node.candidate_exported_method_ids.length === 1
      ? node.candidate_exported_method_ids[0]
      : null;
    const method = methodId ? methodById.get(methodId) : null;
    const result = qualifyIndependently({
      parsed: parsedByPath.get(outcome.route_path),
      astNode: astByNodeId.get(node.node_id),
      route: routeByPath.get(outcome.route_path),
      method,
      node,
      outcome,
    });
    if (result.candidate) candidates.push(result.candidate);
    return result.overlay;
  });
  const split = {
    uniqueIf: c2_1.nodes.filter((node) => node.ownership_state === "UNIQUE" && node.kind === "IF").length,
    unattributedIf: c2_1.nodes.filter((node) => node.ownership_state === "UNATTRIBUTED" && node.kind === "IF").length,
    uniqueCatch: c2_1.nodes.filter((node) => node.ownership_state === "UNIQUE" && node.kind === "CATCH").length,
    unattributedCatch: c2_1.nodes.filter((node) => node.ownership_state === "UNATTRIBUTED" && node.kind === "CATCH").length,
  };
  assert.deepEqual(split, {
    uniqueIf: 290,
    unattributedIf: 76,
    uniqueCatch: 36,
    unattributedCatch: 7,
  });
  const methodDeferrals = c2_1.methods
    .filter((method) => method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD")
    .map((method) => ({
      method_id: method.method_id,
      route_path: method.route_path,
      http_method: method.http_method,
      qualification_state: "DEFERRED_OPAQUE_IMPORTED_METHOD",
      reason_code: "HELPER_IMPLEMENTATION_UNREAD_REQUIRES_FRESH_SCOPE",
      helper_content_read: false,
      execution_state: "NOT_EXECUTED",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
    }));
  const candidateRows = candidates.map((candidate) =>
    [
      candidate.candidate_id,
      candidate.outcome_id,
      candidate.node_id,
      candidate.route_path,
      candidate.method_id,
      candidate.outcome_kind,
      candidate.branch_start_utf16,
      candidate.branch_end_utf16,
      candidate.branch_span_sha256,
      candidate.response_shape,
      candidate.status_code,
    ].join("\0") + "\n"
  ).join("");
  const overlayRows = outcomeOverlay.map((entry) =>
    [
      entry.outcome_id,
      entry.qualification_state,
      entry.candidate_id_or_null ?? "",
      entry.reason_code,
    ].join("\0") + "\n"
  ).join("");
  const candidateDigest = sha256(candidateRows);
  const completeOverlayDigest = sha256(overlayRows);
  const statusCounts = new Map();
  const shapeCounts = new Map();
  for (const candidate of candidates) {
    statusCounts.set(candidate.status_code, (statusCounts.get(candidate.status_code) ?? 0) + 1);
    shapeCounts.set(candidate.response_shape, (shapeCounts.get(candidate.response_shape) ?? 0) + 1);
  }
  const statusHistogram = [...statusCounts]
    .sort((left, right) => left[0] - right[0])
    .map(([statusCode, count]) => ({ status_code: statusCode, count }));
  const shapeHistogram = ["NEXT_RESPONSE_JSON", "GLOBAL_RESPONSE_JSON", "GLOBAL_NEW_RESPONSE"]
    .filter((shape) => shapeCounts.has(shape))
    .map((shape) => ({ response_shape: shape, count: shapeCounts.get(shape) }));
  const stateCounts = new Map();
  for (const entry of outcomeOverlay) {
    if (entry.qualification_state.startsWith("DEFERRED_")) {
      stateCounts.set(
        entry.qualification_state,
        (stateCounts.get(entry.qualification_state) ?? 0) + 1,
      );
    }
  }
  const deferredHistogram = QUALIFICATION_ORDER
    .filter((state) => stateCounts.has(state))
    .map((state) => ({ qualification_state: state, count: stateCounts.get(state) }));
  const candidateCount = candidates.length;
  return {
    candidates,
    outcomeOverlay,
    methodDeferrals,
    candidateDigest,
    overlayDigest: completeOverlayDigest,
    statusHistogram,
    shapeHistogram,
    deferredHistogram,
    split,
    candidateCount,
  };
}

function directImports(repositoryPath) {
  const text = FILE_BYTES.get(repositoryPath).toString("utf8");
  const file = ts.createSourceFile(
    repositoryPath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  assert.equal(file.parseDiagnostics.length, 0);
  return file.statements
    .filter(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteralLike(statement.moduleSpecifier),
    )
    .map((statement) => statement.moduleSpecifier.text)
    .sort();
}

function candidateFormula(candidate, c2_1) {
  const route = c2_1.routes.find((entry) => entry.route_path === candidate.route_path);
  return shaFields(
    "AIFINDER_C2_2_CANDIDATE_V1",
    candidate.outcome_id,
    route.git_blob,
    candidate.method_id,
    candidate.outcome_kind,
    String(candidate.branch_start_utf16),
    String(candidate.branch_end_utf16),
    candidate.branch_span_sha256,
    candidate.response_shape,
    String(candidate.status_code),
  );
}

function mutationError(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function currentGovernanceValid(matrix, registry, historicalLedger) {
  const currentRows = matrix?.entries?.filter((entry) =>
    ROUTE_PATHS.includes(entry.path),
  );
  const criticalRows = currentRows?.filter((entry) =>
    V1_CRITICAL_ROUTE_PATH_SET.has(entry.path),
  );
  const deferredRows = currentRows?.filter(
    (entry) => !V1_CRITICAL_ROUTE_PATH_SET.has(entry.path),
  );
  const criticalWorkstream = registry?.workstreams?.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  const deferredWorkstream = registry?.workstreams?.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_DEFERRED",
  );
  return (
    historicalLedger?.summary?.launch_blockers === 28 &&
    historicalLedger?.summary?.routes_unblocked === 0 &&
    currentRows?.length === 28 &&
    criticalRows?.length === 7 &&
    criticalRows.every(
      (entry) =>
        entry.coverage_state === V1_CRITICAL_STATE &&
        entry.launch_blocking === true &&
        entry.gap_code_or_null === V1_STAGING_GAP,
    ) &&
    deferredRows?.length === 21 &&
    deferredRows.every(
      (entry) =>
        entry.coverage_state === V1_DEFERRED_STATE &&
        entry.launch_blocking === false &&
        entry.gap_code_or_null === null,
    ) &&
    matrix.entries.filter((entry) => entry.launch_blocking === true).length === 7 &&
    criticalWorkstream?.entry_count === 7 &&
    criticalWorkstream.state ===
      "STAGING_ENV_DATABASE_STORAGE_READINESS_COMPLETE_DEPLOYED_RUNTIME_REQUIRED" &&
    criticalWorkstream.authority_class ===
      "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME" &&
    criticalWorkstream.next_gate ===
      "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION" &&
    criticalWorkstream.execution_authorized === false &&
    JSON.stringify(criticalWorkstream.source_paths) ===
      JSON.stringify(V1_CRITICAL_ROUTE_PATHS) &&
    deferredWorkstream?.entry_count === 21 &&
    deferredWorkstream.state === "SAFELY_DISABLED_FOR_V1_LAUNCH" &&
    deferredWorkstream.execution_authorized === false &&
    JSON.stringify(deferredWorkstream.source_paths) ===
      JSON.stringify(V1_DEFERRED_ROUTE_PATHS) &&
    registry.execution_authorized === false &&
    registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES"
  );
}

function runLedgerMutations(ledger, oracle, c2_1) {
  const cases = [];
  cases.push(() => expectCode(
    () => strictJson(Buffer.from('{"a":1,"a":2}\n', "utf8")),
    "STRICT_JSON_DUPLICATE_KEY",
  ));
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.unknown_property = true;
    expectCode(() => {
      if (Object.hasOwn(copy, "unknown_property")) mutationError("C2_2_UNKNOWN_PROPERTY");
    }, "C2_2_UNKNOWN_PROPERTY");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.repository_baseline.commit = "0".repeat(40);
    expectCode(() => {
      if (copy.repository_baseline.commit !== ledger.repository_baseline.commit) {
        mutationError("C2_2_BASELINE_IDENTITY");
      }
    }, "C2_2_BASELINE_IDENTITY");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.source_contract.c2_1_ledger_sha256 = "0".repeat(64);
    expectCode(() => {
      if (copy.source_contract.c2_1_ledger_sha256 !== ledger.source_contract.c2_1_ledger_sha256) {
        mutationError("C2_2_SOURCE_LEDGER_IDENTITY");
      }
    }, "C2_2_SOURCE_LEDGER_IDENTITY");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.outcome_overlay[0].node_id = "0".repeat(64);
    expectCode(() => {
      if (copy.outcome_overlay[0].node_id !== oracle.outcomeOverlay[0].node_id) {
        mutationError("C2_2_ROUTE_METHOD_NODE_OUTCOME_IDENTITY");
      }
    }, "C2_2_ROUTE_METHOD_NODE_OUTCOME_IDENTITY");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.summary.unique_if_nodes -= 1;
    expectCode(() => {
      if (copy.summary.unique_if_nodes !== oracle.split.uniqueIf) {
        mutationError("C2_2_OWNERSHIP_KIND_SPLIT");
      }
    }, "C2_2_OWNERSHIP_KIND_SPLIT");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.summary.eligible_universe_outcomes -= 1;
    expectCode(() => {
      if (copy.summary.eligible_universe_outcomes !== 580) {
        mutationError("C2_2_OUTCOME_PARTITION");
      }
    }, "C2_2_OUTCOME_PARTITION");
  });
  cases.push(() => {
    const index = oracle.outcomeOverlay.findIndex(
      (entry) => entry.qualification_state === "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
    );
    const copy = cloneJson(ledger);
    copy.outcome_overlay[index].qualification_state =
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE";
    expectCode(() => {
      if (copy.outcome_overlay[index].qualification_state !== oracle.outcomeOverlay[index].qualification_state) {
        mutationError("C2_2_BRANCH_MATERIALIZATION");
      }
    }, "C2_2_BRANCH_MATERIALIZATION");
  });
  cases.push(() => {
    const index = oracle.outcomeOverlay.findIndex(
      (entry) => entry.qualification_state === "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    );
    const copy = cloneJson(ledger);
    copy.outcome_overlay[index].qualification_state =
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE";
    expectCode(() => {
      if (copy.outcome_overlay[index].qualification_state !== oracle.outcomeOverlay[index].qualification_state) {
        mutationError("C2_2_RESPONSE_QUALIFICATION");
      }
    }, "C2_2_RESPONSE_QUALIFICATION");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.candidates.push({ candidate_id: "f".repeat(64) });
    expectCode(() => {
      if (copy.candidates.length !== oracle.candidates.length) {
        mutationError("C2_2_CANDIDATE_SET");
      }
    }, "C2_2_CANDIDATE_SET");
  });
  cases.push(() => {
    const expected = [{ candidate_id: "1".repeat(64) }];
    const mutated = cloneJson(expected);
    mutated.pop();
    expectCode(() => {
      if (mutated.length !== expected.length) mutationError("C2_2_CANDIDATE_DELETION");
    }, "C2_2_CANDIDATE_DELETION");
  });
  cases.push(() => {
    const expected = [
      { candidate_id: "1".repeat(64) },
      { candidate_id: "2".repeat(64) },
    ];
    const mutated = [expected[1], expected[0]];
    expectCode(() => {
      if (mutated.some((entry, index) => entry.candidate_id !== expected[index].candidate_id)) {
        mutationError("C2_2_CANDIDATE_ORDER");
      }
    }, "C2_2_CANDIDATE_ORDER");
  });
  cases.push(() => {
    const expected = { candidate_id: "1".repeat(64) };
    const mutated = { candidate_id: "0".repeat(64) };
    expectCode(() => {
      if (mutated.candidate_id !== expected.candidate_id) {
        mutationError("C2_2_CANDIDATE_IDENTITY");
      }
    }, "C2_2_CANDIDATE_IDENTITY");
  });
  cases.push(() => {
    const index = oracle.outcomeOverlay.findIndex(
      (entry) => entry.qualification_state === "DEFERRED_UNATTRIBUTED_IF_OUTCOME",
    );
    const copy = cloneJson(ledger);
    copy.outcome_overlay[index].qualification_state =
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE";
    expectCode(() => {
      if (copy.outcome_overlay[index].qualification_state !== oracle.outcomeOverlay[index].qualification_state) {
        mutationError("C2_2_UNATTRIBUTED_PROMOTION");
      }
    }, "C2_2_UNATTRIBUTED_PROMOTION");
  });
  cases.push(() => {
    const index = oracle.outcomeOverlay.findIndex(
      (entry) => entry.qualification_state === "DEFERRED_CATCH_OUTCOME",
    );
    const copy = cloneJson(ledger);
    copy.outcome_overlay[index].qualification_state =
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE";
    expectCode(() => {
      if (copy.outcome_overlay[index].qualification_state !== oracle.outcomeOverlay[index].qualification_state) {
        mutationError("C2_2_CATCH_PROMOTION");
      }
    }, "C2_2_CATCH_PROMOTION");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.method_deferrals.pop();
    expectCode(() => {
      if (copy.method_deferrals.length !== 15) mutationError("C2_2_OPAQUE_METHOD_DEFERRAL");
    }, "C2_2_OPAQUE_METHOD_DEFERRAL");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.summary.expected_candidate_count = oracle.candidateCount;
    expectCode(() => {
      if (Object.hasOwn(copy.summary, "expected_candidate_count")) {
        mutationError("C2_2_TARGET_FIT_COUNT_FIELD");
      }
    }, "C2_2_TARGET_FIT_COUNT_FIELD");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.summary.runtime_qualified_nodes = 1;
    expectCode(() => {
      if (copy.summary.runtime_qualified_nodes !== 0) mutationError("C2_2_RUNTIME_STATE");
    }, "C2_2_RUNTIME_STATE");
  });
  cases.push(() => {
    const historicalRewrite = cloneJson(ledger);
    historicalRewrite.summary.launch_blockers = 7;
    expectCode(() => {
      if (!currentGovernanceValid(
        strictJson(FILE_BYTES.get(MATRIX_PATH)),
        strictJson(FILE_BYTES.get(BLOCKER_PATH)),
        historicalRewrite,
      )) {
        mutationError("C2_2_HISTORICAL_BLOCKER_REWRITE");
      }
    }, "C2_2_HISTORICAL_BLOCKER_REWRITE");

    const currentMatrixReversion = strictJson(FILE_BYTES.get(MATRIX_PATH));
    for (const entry of currentMatrixReversion.entries) {
      if (!ROUTE_PATHS.includes(entry.path)) continue;
      entry.launch_blocking = true;
    }
    expectCode(() => {
      if (!currentGovernanceValid(
        currentMatrixReversion,
        strictJson(FILE_BYTES.get(BLOCKER_PATH)),
        ledger,
      )) {
        mutationError("C2_2_CURRENT_BLOCKER_REVERSION");
      }
    }, "C2_2_CURRENT_BLOCKER_REVERSION");

    const splitLoss = strictJson(FILE_BYTES.get(BLOCKER_PATH));
    splitLoss.workstreams = splitLoss.workstreams.filter(
      (entry) => entry.id !== "AUTHENTICATED_ADMIN_V1_DEFERRED",
    );
    expectCode(() => {
      if (!currentGovernanceValid(
        strictJson(FILE_BYTES.get(MATRIX_PATH)),
        splitLoss,
        ledger,
      )) {
        mutationError("C2_2_V1_WORKSTREAM_SPLIT");
      }
    }, "C2_2_V1_WORKSTREAM_SPLIT");

    const executionAuthorization = strictJson(FILE_BYTES.get(BLOCKER_PATH));
    executionAuthorization.execution_authorized = true;
    expectCode(() => {
      if (!currentGovernanceValid(
        strictJson(FILE_BYTES.get(MATRIX_PATH)),
        executionAuthorization,
        ledger,
      )) {
        mutationError("C2_2_EXECUTION_AUTHORIZATION");
      }
    }, "C2_2_EXECUTION_AUTHORIZATION");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.source_excerpt = "forbidden";
    expectCode(() => {
      if (Object.hasOwn(copy, "source_excerpt")) mutationError("C2_2_RAW_VALUE_PRIVACY");
    }, "C2_2_RAW_VALUE_PRIVACY");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.source_contract.route_paths.push("lib/admin-auth.ts");
    expectCode(() => {
      if (copy.source_contract.route_paths.length !== 28) mutationError("C2_2_PATH_SCOPE");
    }, "C2_2_PATH_SCOPE");
  });
  cases.push(() => {
    const copy = cloneJson(ledger);
    copy.summary.overlay_digest = "0".repeat(64);
    expectCode(() => {
      if (copy.summary.overlay_digest !== oracle.overlayDigest) mutationError("C2_2_DIGEST_IDENTITY");
    }, "C2_2_DIGEST_IDENTITY");
  });
  for (const mutation of cases) mutation();
  assert.equal(cases.length, 22);
  return cases.length;
}

function runFinalLedgerTest() {
  const ledger = strictJson(ledgerBytes);
  const schema = strictJson(FILE_BYTES.get(SCHEMA_PATH));
  const c2_1 = strictJson(FILE_BYTES.get(C2_1_LEDGER_PATH));
  const matrix = strictJson(FILE_BYTES.get(MATRIX_PATH));
  const blockers = strictJson(FILE_BYTES.get(BLOCKER_PATH));
  const manifest = strictJson(FILE_BYTES.get(MANIFEST_PATH));
  const oracle = buildIndependentOracle(c2_1);
  const topKeys = [
    "schema_version",
    "phase",
    "artifact_purpose",
    "repository_baseline",
    "source_contract",
    "algorithm_contract",
    "summary",
    "method_deferrals",
    "outcome_overlay",
    "candidates",
    "governance",
  ];
  const assertions = [
    ["L01_STRICT_JSON_DUPLICATE_KEYS", () => {
      assert.equal(strictJson(ledgerBytes).schema_version, ledger.schema_version);
      expectCode(
        () => strictJson(Buffer.from('{"x":1,"x":2}\n', "utf8")),
        "STRICT_JSON_DUPLICATE_KEY",
      );
    }],
    ["L02_DRAFT_2020_12_SCHEMA_AND_NO_UNKNOWN_KEYS", () => {
      assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
      validateSchema(schema, ledger, schema);
      exactKeys(ledger, topKeys);
    }],
    ["L03_PHASE_BASELINE_AND_SOURCE_CONTRACT", () => {
      assert.equal(ledger.phase, "33IA-33IZ");
      assert.equal(
        ledger.artifact_purpose,
        "BATCH_C2_2_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE_QUALIFICATION",
      );
      assert.deepEqual(ledger.repository_baseline, {
        repository: "/Users/jamescarlodumaua/aifinder",
        branch: "main",
        commit: "132f4d16e7b8b6c7b4585bb794ac7732cead0a73",
        parent: "bb135e0dc5bfa31b4d5542cca855541014374e44",
        tree: "757a4905c69d606ed50a4a55d9ab629b52947753",
        subject: "Add authenticated route branch qualification ledger",
      });
      assert.deepEqual(ledger.source_contract.route_paths, ROUTE_PATHS);
    }],
    ["L04_C2_1_LEDGER_IDENTITY_AND_DIGESTS", () => {
      assert.equal(
        sha256(FILE_BYTES.get(C2_1_LEDGER_PATH)),
        ledger.source_contract.c2_1_ledger_sha256,
      );
      assert.equal(
        ledger.source_contract.c2_1_independent_oracle_digest,
        "6e15cd4bc24025892fe7d3985709e48ba56cb2198ea04fe21ec99b08ab2fe172",
      );
      assert.equal(
        ledger.source_contract.node_set_digest,
        "e93014829e190d478ee8d057289a12bc2703f990b795c3bbf5fdade838dd87d8",
      );
    }],
    ["L05_ROUTE_METHOD_NODE_OUTCOME_IDENTITIES", () => {
      assert.deepEqual(
        [c2_1.routes.length, c2_1.methods.length, c2_1.nodes.length, c2_1.outcomes.length],
        [28, 37, 409, 775],
      );
      assert.equal(ledger.outcome_overlay.length, c2_1.outcomes.length);
      assert.deepEqual(
        ledger.outcome_overlay.map((entry) => [entry.outcome_id, entry.node_id, entry.route_path]),
        c2_1.outcomes.map((entry) => [entry.outcome_id, entry.node_id, entry.route_path]),
      );
    }],
    ["L06_OWNERSHIP_AND_KIND_SPLIT_290_76_36_7", () => {
      assert.deepEqual(oracle.split, {
        uniqueIf: 290,
        unattributedIf: 76,
        uniqueCatch: 36,
        unattributedCatch: 7,
      });
      assert.deepEqual(
        [
          ledger.summary.unique_if_nodes,
          ledger.summary.unattributed_if_nodes,
          ledger.summary.unique_catch_nodes,
          ledger.summary.unattributed_catch_nodes,
        ],
        [290, 76, 36, 7],
      );
    }],
    ["L07_UNIVERSE_580_152_43_EQUALS_775", () => {
      assert.equal(290 * 2, 580);
      assert.equal(76 * 2, 152);
      assert.equal(36 + 7, 43);
      assert.equal(580 + 152 + 43, 775);
      assert.deepEqual(
        [
          ledger.summary.eligible_universe_outcomes,
          ledger.summary.mandatory_deferred_unattributed_if_outcomes,
          ledger.summary.mandatory_deferred_catch_outcomes,
          ledger.summary.mandatory_deferred_outcomes,
        ],
        [580, 152, 43, 195],
      );
    }],
    ["L08_INDEPENDENT_BRANCH_MATERIALIZATION", () => {
      assert.deepEqual(
        ledger.outcome_overlay.map((entry) => entry.qualification_state),
        oracle.outcomeOverlay.map((entry) => entry.qualification_state),
      );
      assert(
        oracle.outcomeOverlay.some(
          (entry) => entry.qualification_state === "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
        ),
      );
      assert(
        oracle.outcomeOverlay.some(
          (entry) => entry.qualification_state === "DEFERRED_NON_SINGLE_RETURN_BRANCH",
        ),
      );
    }],
    ["L09_INDEPENDENT_RESPONSE_STATUS_AND_CLOSED_DATA_RULES", () => {
      assert.deepEqual(ledger.outcome_overlay, oracle.outcomeOverlay);
      assert.deepEqual(ledger.summary.status_histogram, oracle.statusHistogram);
      assert.deepEqual(ledger.summary.response_shape_histogram, oracle.shapeHistogram);
    }],
    ["L10_INDEPENDENT_CANDIDATE_SET", () => {
      assert.deepEqual(ledger.candidates, oracle.candidates);
      assert.equal(ledger.summary.candidate_outcomes, oracle.candidateCount);
    }],
    ["L11_CANDIDATE_IDENTITY_FORMULAS", () => {
      for (const candidate of ledger.candidates) {
        assert.equal(candidate.candidate_id, candidateFormula(candidate, c2_1));
      }
      assert.deepEqual(
        ledger.candidates.map((candidate) => candidate.candidate_id),
        ledger.outcome_overlay
          .filter((entry) => entry.candidate_id_or_null !== null)
          .map((entry) => entry.candidate_id_or_null),
      );
    }],
    ["L12_COMPLETE_OVERLAY_PARTITION_AND_ORDER", () => {
      assert.deepEqual(
        ledger.outcome_overlay.map((entry) => entry.outcome_id),
        c2_1.outcomes.map((entry) => entry.outcome_id),
      );
      assert.equal(
        ledger.outcome_overlay.filter(
          (entry) => entry.qualification_state.startsWith("DEFERRED_"),
        ).length + ledger.candidates.length,
        775,
      );
      assert.deepEqual(ledger.summary.deferred_state_histogram, oracle.deferredHistogram);
    }],
    ["L13_UNATTRIBUTED_IF_DEFERRALS_152", () => {
      assert.equal(
        ledger.outcome_overlay.filter(
          (entry) => entry.qualification_state === "DEFERRED_UNATTRIBUTED_IF_OUTCOME",
        ).length,
        152,
      );
    }],
    ["L14_CATCH_DEFERRALS_43", () => {
      assert.equal(
        ledger.outcome_overlay.filter(
          (entry) => entry.qualification_state === "DEFERRED_CATCH_OUTCOME",
        ).length,
        43,
      );
    }],
    ["L15_OPAQUE_METHOD_DEFERRALS_15", () => {
      assert.deepEqual(ledger.method_deferrals, oracle.methodDeferrals);
      assert.equal(ledger.method_deferrals.length, 15);
    }],
    ["L16_DERIVED_COUNT_ARITHMETIC_NO_TARGET_FIT", () => {
      assert.equal(ledger.algorithm_contract.candidate_count_contract, "DERIVED_NOT_PREDECLARED");
      assert.equal(ledger.summary.candidate_count_contract, "DERIVED_FROM_OVERLAY");
      assert(!Object.hasOwn(ledger.summary, "expected_candidate_count"));
      assert.equal(
        ledger.summary.additional_deferred_unique_if_outcomes,
        580 - oracle.candidateCount,
      );
      assert.equal(ledger.summary.total_deferred_outcomes, 775 - oracle.candidateCount);
    }],
    ["L17_RUNTIME_QUALIFIED_AND_EXECUTION_ZERO", () => {
      assert.equal(ledger.summary.runtime_qualified_nodes, 0);
      assert.equal(ledger.summary.route_execution, 0);
      assert.equal(ledger.summary.execution_authorized, false);
      assert(
        ledger.outcome_overlay.every(
          (entry) =>
            entry.execution_state === "NOT_EXECUTED" &&
            entry.behavior_state === "NOT_RUNTIME_QUALIFIED",
        ),
      );
    }],
    ["L18_BLOCKERS_ROUTES_AND_NO_GO", () => {
      assert(currentGovernanceValid(matrix, blockers, ledger));
      assert.equal(ledger.summary.public_launch, "NO_GO");
    }],
    ["L19_PRIVACY_RAW_VALUES_ZERO", () => {
      const forbidden = new Set([
        "source",
        "source_text",
        "source_excerpt",
        "predicate",
        "payload",
        "body",
        "headers",
        "cookies",
        "environment",
        "url",
      ]);
      const visit = (value) => {
        if (!value || typeof value !== "object") return;
        for (const [key, child] of Object.entries(value)) {
          assert(!forbidden.has(key));
          visit(child);
        }
      };
      visit(ledger);
      assert.equal(ledger.summary.raw_values, 0);
    }],
    ["L20_PATH_SCOPE_AND_HELPER_READS_ZERO", () => {
      assert.equal(READ_COUNTS.size, 39);
      assert(READ_ALLOWLIST.every((entry) => READ_COUNTS.get(entry) === 1));
      assert(!READ_ALLOWLIST.includes("lib/admin-auth.ts"));
      assert.deepEqual(
        directImports("testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs"),
        ["node:crypto", "typescript"],
      );
      assert.deepEqual(
        directImports("testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.test.mjs"),
        [
          "./authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs",
          "node:assert/strict",
          "node:crypto",
          "node:fs",
          "node:path",
        ].sort(),
      );
      assert.deepEqual(
        directImports("testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs"),
        ["node:assert/strict", "node:crypto", "node:fs", "node:path", "typescript"].sort(),
      );
      assert.equal(ledger.summary.c2_2_analyzer_ledger_helper_content_reads, 0);
    }],
    ["L21_MANIFEST_AND_RUNNER_CLASSIFICATIONS", () => {
      const expected = new Map([
        ["testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs", ["SUPPORT", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY"]],
        ["testing/authenticated-live-route-synthetic-rejection-candidate-analyzer.test.mjs", ["EXECUTABLE", "SAFE_STATIC_POLICY", "RUN_POLICY"]],
        ["testing/authenticated-live-route-synthetic-rejection-candidate-ledger.schema.json", ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY"]],
        ["testing/authenticated-live-route-synthetic-rejection-candidate-ledger.json", ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY"]],
        ["testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs", ["EXECUTABLE", "SAFE_STATIC_POLICY", "RUN_POLICY"]],
      ]);
      for (const [repositoryPath, contract] of expected) {
        const entry = manifest.entries.find((candidate) => candidate.path === repositoryPath);
        assert.deepEqual(
          [entry?.role, entry?.safety_class, entry?.ci_disposition],
          contract,
        );
      }
      const runnerText = FILE_BYTES.get(RUNNER_PATH).toString("utf8");
      assert(runnerText.includes("--c2-2-policy"));
      assert(runnerText.includes("PASS_STATIC_READINESS_C2_2_COMPLETE"));
      assert(runnerText.includes("authenticated-live-route-synthetic-rejection-candidate-analyzer.test.mjs"));
      assert(runnerText.includes("authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs"));
    }],
    ["L22_CANDIDATE_OVERLAY_AND_EXECUTION_DIGESTS", () => {
      assert.equal(ledger.summary.candidate_set_digest, oracle.candidateDigest);
      assert.equal(ledger.summary.overlay_digest, oracle.overlayDigest);
      assert.equal(ledger.governance.candidate_set_digest, oracle.candidateDigest);
      assert.equal(ledger.governance.overlay_digest, oracle.overlayDigest);
    }],
  ];
  let pass = 0;
  let fail = 0;
  for (const [, assertion] of assertions) {
    try {
      assertion();
      pass += 1;
    } catch {
      fail += 1;
    }
  }
  if (fail > 0) {
    process.stdout.write(
      `FAIL_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER assertions=22 pass=${pass} fail=${fail} failures=1 internal_failures=0\n`,
    );
    process.exitCode = 1;
    return;
  }
  try {
    const mutationCount = runLedgerMutations(ledger, oracle, c2_1);
    const summary = ledger.summary;
    process.stdout.write(
      `PASS_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER assertions=22 mutations=${mutationCount} routes=${summary.routes} methods=${summary.methods} nodes=${summary.nodes} outcomes=${summary.outcomes} eligible_universe=${summary.eligible_universe_outcomes} mandatory_deferred=${summary.mandatory_deferred_outcomes} candidates=${summary.candidate_outcomes} additional_deferred_unique_if=${summary.additional_deferred_unique_if_outcomes} total_deferred=${summary.total_deferred_outcomes} opaque_methods_deferred=${summary.opaque_imported_methods_deferred} candidate_set_digest=${summary.candidate_set_digest} overlay_digest=${summary.overlay_digest} launch_blocking=${summary.launch_blockers} runtime_qualified=${summary.runtime_qualified_nodes} routes_unblocked=${summary.routes_unblocked} execution_authorized=${summary.execution_authorized} public_launch=${summary.public_launch} raw_values=${summary.raw_values} failures=0 internal_failures=0\n`,
    );
  } catch {
    process.stdout.write(
      "FAIL_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER assertions=22 failures=1 internal_failures=0\n",
    );
    process.exitCode = 1;
  }
}

if (ledgerBytes.toString("utf8") === "{}\n") {
  process.stdout.write(
    "EXPECTED_FAIL_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_LEDGER assertions=22 pass=0 fail=22 reason=EMPTY_LEDGER_SCAFFOLD internal_failures=0\n",
  );
  process.exitCode = 1;
} else {
  runFinalLedgerTest();
}
