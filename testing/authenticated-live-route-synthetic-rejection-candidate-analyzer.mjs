import { createHash } from "node:crypto";
import ts from "typescript";

const QUALIFICATION_STATES = Object.freeze([
  "DEFERRED_CATCH_OUTCOME",
  "DEFERRED_UNATTRIBUTED_IF_OUTCOME",
  "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
  "DEFERRED_NON_SINGLE_RETURN_BRANCH",
  "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
  "DEFERRED_NON_LITERAL_4XX_STATUS",
  "DEFERRED_NON_CLOSED_RESPONSE_DATA",
  "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function recursivelySorted(value) {
  if (Array.isArray(value)) return value.map(recursivelySorted);
  if (value && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = recursivelySorted(value[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(recursivelySorted(value), null, 2) + "\n";
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
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

function parseRoute(routePath, bytes) {
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("C2_2_FATAL_UTF8");
  }
  const sourceFile = ts.createSourceFile(
    routePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length !== 0) fail("C2_2_PARSE_DIAGNOSTICS");
  return { source, sourceFile };
}

function baseOverlay(nodeRecord, outcomeRecord, methodRecord) {
  const methodId =
    nodeRecord.ownership_state === "UNIQUE" &&
      nodeRecord.candidate_exported_method_ids.length === 1
      ? methodRecord?.method_id ?? nodeRecord.candidate_exported_method_ids[0]
      : null;
  let qualificationState;
  let reasonCode;
  if (outcomeRecord.outcome_kind === "CATCH_ENTERED") {
    qualificationState = "DEFERRED_CATCH_OUTCOME";
    reasonCode = "CATCH_OUTCOME_REQUIRES_FRESH_AUTHORITY";
  } else if (nodeRecord.ownership_state !== "UNIQUE") {
    qualificationState = "DEFERRED_UNATTRIBUTED_IF_OUTCOME";
    reasonCode = "IF_OUTCOME_NOT_UNIQUELY_OWNED";
  } else {
    qualificationState = "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR";
    reasonCode = "RESPONSE_CONSTRUCTOR_NOT_RECOGNIZED";
  }
  return {
    outcome_id: outcomeRecord.outcome_id,
    node_id: nodeRecord.node_id,
    route_path: outcomeRecord.route_path,
    outcome_kind: outcomeRecord.outcome_kind,
    ownership_state: nodeRecord.ownership_state,
    method_id_or_null: methodId,
    qualification_state: qualificationState,
    reason_code: reasonCode,
    candidate_id_or_null: null,
    execution_state: "NOT_EXECUTED",
    behavior_state: "NOT_RUNTIME_QUALIFIED",
  };
}

function overlayWithState(base, qualificationState, reasonCode) {
  return {
    ...base,
    qualification_state: qualificationState,
    reason_code: reasonCode,
  };
}

function sourceFileFromInput(value, routePath) {
  if (typeof value !== "string") return value;
  const sourceFile = ts.createSourceFile(
    routePath,
    value,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length !== 0) fail("C2_2_PARSE_DIAGNOSTICS");
  return sourceFile;
}

function findIfStatement(sourceFile, nodeRecord) {
  const matches = [];
  const visit = (node) => {
    if (
      ts.isIfStatement(node) &&
      node.getStart(sourceFile, false) === nodeRecord.start_utf16 &&
      node.end === nodeRecord.end_utf16
    ) matches.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (matches.length !== 1) fail("C2_2_NODE_SPAN_ASSOCIATION");
  return matches[0];
}

function singleReturnExpression(statement) {
  if (ts.isReturnStatement(statement) && statement.expression) {
    return { returnStatement: statement, expression: statement.expression };
  }
  if (
    ts.isBlock(statement) &&
    statement.statements.length === 1 &&
    ts.isReturnStatement(statement.statements[0]) &&
    statement.statements[0].expression
  ) {
    return {
      returnStatement: statement.statements[0],
      expression: statement.statements[0].expression,
    };
  }
  return null;
}

function declarationBindingCount(sourceFile, bindingName) {
  let count = 0;
  const visitBindingName = (name) => {
    if (ts.isIdentifier(name) && name.text === bindingName) count += 1;
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) visitBindingName(element.name);
      }
    }
  };
  const visit = (node) => {
    if (ts.isImportSpecifier(node) && node.name.text === bindingName) count += 1;
    else if (ts.isImportClause(node) && node.name?.text === bindingName) count += 1;
    else if (ts.isNamespaceImport(node) && node.name.text === bindingName) count += 1;
    else if (ts.isVariableDeclaration(node)) visitBindingName(node.name);
    else if (ts.isParameter(node)) visitBindingName(node.name);
    else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassExpression(node)) &&
      node.name?.text === bindingName
    ) count += 1;
    else if (ts.isCatchClause(node) && node.variableDeclaration) {
      visitBindingName(node.variableDeclaration.name);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}

function nextResponseBindings(sourceFile) {
  const bindings = new Set();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "next/server"
    ) continue;
    const named = statement.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const element of named.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      if (
        imported === "NextResponse" &&
        declarationBindingCount(sourceFile, element.name.text) === 1
      ) bindings.add(element.name.text);
    }
  }
  return bindings;
}

function hasSpreadArgument(argumentsList) {
  return argumentsList.some((argument) => ts.isSpreadElement(argument));
}

function responseExpression(sourceFile, expression) {
  if (
    ts.isCallExpression(expression) &&
    !expression.questionDotToken &&
    !hasSpreadArgument(expression.arguments) &&
    expression.arguments.length === 2 &&
    ts.isPropertyAccessExpression(expression.expression) &&
    !expression.expression.questionDotToken &&
    expression.expression.name.text === "json" &&
    ts.isIdentifier(expression.expression.expression)
  ) {
    const receiver = expression.expression.expression.text;
    if (nextResponseBindings(sourceFile).has(receiver)) {
      return {
        responseShape: "NEXT_RESPONSE_JSON",
        payload: expression.arguments[0],
        init: expression.arguments[1],
      };
    }
    if (
      receiver === "Response" &&
      declarationBindingCount(sourceFile, "Response") === 0
    ) {
      return {
        responseShape: "GLOBAL_RESPONSE_JSON",
        payload: expression.arguments[0],
        init: expression.arguments[1],
      };
    }
  }
  if (
    ts.isNewExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === "Response" &&
    declarationBindingCount(sourceFile, "Response") === 0 &&
    expression.arguments?.length === 2 &&
    !hasSpreadArgument(expression.arguments)
  ) {
    return {
      responseShape: "GLOBAL_NEW_RESPONSE",
      payload: expression.arguments[0],
      init: expression.arguments[1],
    };
  }
  return null;
}

function transparentExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  ) current = current.expression;
  return current;
}

function staticPropertyName(name) {
  if (ts.isComputedPropertyName(name)) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return null;
}

function decimalIntegerLiteral(node, sourceFile) {
  if (!ts.isNumericLiteral(node)) return null;
  const text = node.getText(sourceFile);
  if (!/^(?:0|[1-9][0-9]*)$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

function finiteDecimalLiteral(node, sourceFile) {
  if (!ts.isNumericLiteral(node)) return false;
  const text = node.getText(sourceFile);
  if (/^0[xob]/i.test(text) || text.includes("_")) return false;
  const value = Number(text);
  return Number.isFinite(value);
}

function isClosedData(node, sourceFile) {
  const current = transparentExpression(node);
  if (
    current.kind === ts.SyntaxKind.NullKeyword ||
    current.kind === ts.SyntaxKind.TrueKeyword ||
    current.kind === ts.SyntaxKind.FalseKeyword ||
    ts.isStringLiteral(current) ||
    ts.isNoSubstitutionTemplateLiteral(current) ||
    finiteDecimalLiteral(current, sourceFile)
  ) return true;
  if (
    ts.isPrefixUnaryExpression(current) &&
    current.operator === ts.SyntaxKind.MinusToken &&
    finiteDecimalLiteral(current.operand, sourceFile)
  ) return true;
  if (ts.isArrayLiteralExpression(current)) {
    return current.elements.every(
      (element) =>
        !ts.isOmittedExpression(element) &&
        !ts.isSpreadElement(element) &&
        isClosedData(element, sourceFile),
    );
  }
  if (ts.isObjectLiteralExpression(current)) {
    return current.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        staticPropertyName(property.name) !== null &&
        isClosedData(property.initializer, sourceFile),
    );
  }
  return false;
}

function responseDataQualification(response, sourceFile) {
  const init = transparentExpression(response.init);
  if (!ts.isObjectLiteralExpression(init)) return { status: null, closed: false };
  let status = null;
  let statusCount = 0;
  const nonStatusValues = [];
  for (const property of init.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      staticPropertyName(property.name) === null
    ) return { status: null, closed: false };
    const propertyName = staticPropertyName(property.name);
    if (propertyName === "status") {
      statusCount += 1;
      status = decimalIntegerLiteral(property.initializer, sourceFile);
    } else {
      nonStatusValues.push(property.initializer);
    }
  }
  if (statusCount !== 1 || status === null || status < 400 || status > 499) {
    return { status: null, closed: false };
  }
  return {
    status,
    closed:
      isClosedData(response.payload, sourceFile) &&
      nonStatusValues.every((value) => isClosedData(value, sourceFile)),
  };
}

function candidateIdentity({
  outcomeRecord,
  routeRecord,
  methodRecord,
  branchStart,
  branchEnd,
  branchSpanSha256,
  responseShape,
  status,
}) {
  return digest(
    [
      "AIFINDER_C2_2_CANDIDATE_V1",
      outcomeRecord.outcome_id,
      routeRecord.git_blob,
      methodRecord.method_id,
      outcomeRecord.outcome_kind,
      String(branchStart),
      String(branchEnd),
      branchSpanSha256,
      responseShape,
      String(status),
    ].join("\0"),
  );
}

function qualifyOutcomeDetailed({
  sourceFile,
  routeRecord,
  methodRecord,
  nodeRecord,
  outcomeRecord,
}) {
  const base = baseOverlay(nodeRecord, outcomeRecord, methodRecord);
  if (
    outcomeRecord.outcome_kind === "CATCH_ENTERED" ||
    nodeRecord.ownership_state !== "UNIQUE"
  ) return { overlay: base, candidate: null };
  const parsedSourceFile = sourceFileFromInput(sourceFile, routeRecord.route_path);
  const ifStatement = findIfStatement(parsedSourceFile, nodeRecord);
  let branch;
  if (outcomeRecord.outcome_kind === "IF_TRUE") {
    branch = ifStatement.thenStatement;
  } else if (outcomeRecord.outcome_kind === "IF_FALSE_OR_FALLTHROUGH") {
    if (!ifStatement.elseStatement) {
      return {
        overlay: overlayWithState(
          base,
          "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
          "FALSE_OUTCOME_HAS_NO_EXPLICIT_ELSE",
        ),
        candidate: null,
      };
    }
    branch = ifStatement.elseStatement;
  } else {
    fail("C2_2_OUTCOME_ASSOCIATION");
  }
  const returned = singleReturnExpression(branch);
  if (!returned) {
    return {
      overlay: overlayWithState(
        base,
        "DEFERRED_NON_SINGLE_RETURN_BRANCH",
        "BRANCH_IS_NOT_EXACT_SINGLE_RETURN",
      ),
      candidate: null,
    };
  }
  const response = responseExpression(parsedSourceFile, returned.expression);
  if (!response) {
    return {
      overlay: overlayWithState(
        base,
        "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
        "RESPONSE_CONSTRUCTOR_NOT_RECOGNIZED",
      ),
      candidate: null,
    };
  }
  const data = responseDataQualification(response, parsedSourceFile);
  if (data.status === null) {
    return {
      overlay: overlayWithState(
        base,
        "DEFERRED_NON_LITERAL_4XX_STATUS",
        "RESPONSE_STATUS_NOT_EXACT_LITERAL_4XX",
      ),
      candidate: null,
    };
  }
  if (!data.closed) {
    return {
      overlay: overlayWithState(
        base,
        "DEFERRED_NON_CLOSED_RESPONSE_DATA",
        "RESPONSE_DATA_NOT_EXACT_CLOSED_DATA",
      ),
      candidate: null,
    };
  }
  const branchStart = branch.getStart(parsedSourceFile, false);
  const branchEnd = branch.end;
  const branchSpanSha256 = digest(
    parsedSourceFile.text.slice(branchStart, branchEnd),
  );
  const candidateId = candidateIdentity({
    outcomeRecord,
    routeRecord,
    methodRecord,
    branchStart,
    branchEnd,
    branchSpanSha256,
    responseShape: response.responseShape,
    status: data.status,
  });
  const overlay = {
    ...overlayWithState(
      base,
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
      "EXACT_CLOSED_DATA_LITERAL_4XX_RESPONSE",
    ),
    candidate_id_or_null: candidateId,
  };
  const candidate = {
    candidate_id: candidateId,
    outcome_id: outcomeRecord.outcome_id,
    node_id: nodeRecord.node_id,
    route_path: outcomeRecord.route_path,
    method_id: methodRecord.method_id,
    http_method: methodRecord.http_method,
    outcome_kind: outcomeRecord.outcome_kind,
    branch_start_utf16: branchStart,
    branch_end_utf16: branchEnd,
    branch_span_sha256: branchSpanSha256,
    response_shape: response.responseShape,
    status_code: data.status,
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
  };
  return { overlay, candidate };
}

export function qualifyOutcome({
  sourceFile,
  routeRecord,
  methodRecord,
  nodeRecord,
  outcomeRecord,
}) {
  return qualifyOutcomeDetailed({
    sourceFile,
    routeRecord,
    methodRecord,
    nodeRecord,
    outcomeRecord,
  }).overlay;
}

function requireExactSourceContract(c2_1_ledger, governanceFacts) {
  if (
    c2_1_ledger?.summary?.routes !== 28 ||
    c2_1_ledger.summary.methods !== 37 ||
    c2_1_ledger.summary.ifs !== 366 ||
    c2_1_ledger.summary.catches_with_binding !== 31 ||
    c2_1_ledger.summary.catches_optional !== 12 ||
    c2_1_ledger.summary.catches !== 43 ||
    c2_1_ledger.summary.nodes !== 409 ||
    c2_1_ledger.summary.outcomes !== 775 ||
    c2_1_ledger.summary.imported_opaque_methods !== 15 ||
    c2_1_ledger.summary.route_local_methods !== 22 ||
    c2_1_ledger.summary.runtime_qualified_nodes !== 0 ||
    c2_1_ledger.summary.routes_unblocked !== 0 ||
    c2_1_ledger.summary.launch_blockers !== 28 ||
    c2_1_ledger.summary.public_launch !== "NO_GO"
  ) fail("C2_2_SOURCE_LEDGER_CONTRACT");
  if (
    governanceFacts.c2_1_ledger_sha256 !==
      "d668f5955dd0f7b3c079625711fa873576869039f26263267f1a4821da6090e3" ||
    governanceFacts.c2_1_independent_oracle_digest !==
      "6e15cd4bc24025892fe7d3985709e48ba56cb2198ea04fe21ec99b08ab2fe172" ||
    governanceFacts.node_set_digest !==
      "e93014829e190d478ee8d057289a12bc2703f990b795c3bbf5fdade838dd87d8" ||
    c2_1_ledger.source_contract.route_contract_digest !==
      governanceFacts.route_contract_digest ||
    c2_1_ledger.source_contract.request_position_contract_digest !==
      governanceFacts.request_position_digest
  ) fail("C2_2_SOURCE_LEDGER_IDENTITY");
}

function requireNodeOutcomeContract(c2_1_ledger) {
  const nodeById = new Map(c2_1_ledger.nodes.map((node) => [node.node_id, node]));
  const methodById = new Map(
    c2_1_ledger.methods.map((method) => [method.method_id, method]),
  );
  if (
    nodeById.size !== 409 ||
    methodById.size !== 37 ||
    new Set(c2_1_ledger.outcomes.map((outcome) => outcome.outcome_id)).size !== 775
  ) fail("C2_2_SOURCE_IDENTITY_SET");
  for (const outcome of c2_1_ledger.outcomes) {
    const node = nodeById.get(outcome.node_id);
    if (
      !node ||
      node.route_path !== outcome.route_path ||
      !node.outcome_ids.includes(outcome.outcome_id)
    ) fail("C2_2_OUTCOME_ASSOCIATION");
  }
  const split = {
    uniqueIf: 0,
    unattributedIf: 0,
    uniqueCatch: 0,
    unattributedCatch: 0,
    shared: 0,
  };
  for (const node of c2_1_ledger.nodes) {
    if (node.ownership_state === "SHARED") split.shared += 1;
    else if (node.ownership_state === "UNIQUE" && node.kind === "IF") split.uniqueIf += 1;
    else if (node.ownership_state === "UNATTRIBUTED" && node.kind === "IF") split.unattributedIf += 1;
    else if (node.ownership_state === "UNIQUE" && node.kind === "CATCH") split.uniqueCatch += 1;
    else if (node.ownership_state === "UNATTRIBUTED" && node.kind === "CATCH") split.unattributedCatch += 1;
    else fail("C2_2_OWNERSHIP_SPLIT");
  }
  if (
    split.uniqueIf + split.uniqueCatch !== 326 ||
    split.unattributedIf + split.unattributedCatch !== 83 ||
    split.shared !== 0
  ) fail("C2_2_OWNERSHIP_SPLIT");
  if (
    split.uniqueIf !== 290 ||
    split.unattributedIf !== 76 ||
    split.uniqueCatch !== 36 ||
    split.unattributedCatch !== 7
  ) fail("C2_2_KIND_SPLIT");
  return { nodeById, methodById, split };
}

function routeContext(routeInputs, c2_1_ledger) {
  if (
    !Array.isArray(routeInputs) ||
    routeInputs.length !== 28 ||
    new Set(routeInputs.map((input) => input.path)).size !== 28
  ) fail("C2_2_ROUTE_SET");
  const inputByPath = new Map(routeInputs.map((input) => [input.path, input]));
  const routePaths = c2_1_ledger.routes.map((route) => route.route_path);
  if (
    routePaths.length !== 28 ||
    routePaths.some((routePath) => !inputByPath.has(routePath))
  ) fail("C2_2_ROUTE_SET");
  const parsedByPath = new Map();
  for (const route of c2_1_ledger.routes) {
    const input = inputByPath.get(route.route_path);
    if (!(input.bytes instanceof Uint8Array)) fail("C2_2_ROUTE_IDENTITY");
    const bytes = Buffer.from(input.bytes);
    if (
      digest(bytes) !== route.sha256 ||
      gitBlob(bytes) !== route.git_blob ||
      bytes.length !== route.bytes ||
      countLf(bytes) !== route.lf_lines ||
      input.expectedIdentity?.sha256 !== route.sha256 ||
      input.expectedIdentity?.git_blob !== route.git_blob ||
      input.expectedIdentity?.bytes !== route.bytes ||
      input.expectedIdentity?.lf_lines !== route.lf_lines
    ) fail("C2_2_ROUTE_IDENTITY");
    parsedByPath.set(route.route_path, parseRoute(route.route_path, bytes));
  }
  return { routePaths, parsedByPath };
}

function histogram(values, order = null) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const keys = order
    ? order.filter((value) => counts.has(value))
    : [...counts.keys()].sort();
  return keys.map((key) => ({ key, count: counts.get(key) }));
}

function candidateSetDigest(candidates) {
  const rows = candidates.map((candidate) =>
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
  return digest(rows);
}

function overlayDigest(outcomeOverlay) {
  const rows = outcomeOverlay.map((entry) =>
    [
      entry.outcome_id,
      entry.qualification_state,
      entry.candidate_id_or_null ?? "",
      entry.reason_code,
    ].join("\0") + "\n"
  ).join("");
  return digest(rows);
}

export function qualifyCandidateOverlay({
  routeInputs,
  c2_1_ledger,
  governanceFacts,
} = {}) {
  if (!c2_1_ledger || !governanceFacts) fail("C2_2_SOURCE_LEDGER_CONTRACT");
  requireExactSourceContract(c2_1_ledger, governanceFacts);
  const { nodeById, methodById, split } = requireNodeOutcomeContract(c2_1_ledger);
  const { routePaths, parsedByPath } = routeContext(routeInputs, c2_1_ledger);
  const routeByPath = new Map(
    c2_1_ledger.routes.map((route) => [route.route_path, route]),
  );
  const candidates = [];
  const outcomeOverlay = c2_1_ledger.outcomes.map((outcomeRecord) => {
    const nodeRecord = nodeById.get(outcomeRecord.node_id);
    const methodId = nodeRecord.candidate_exported_method_ids.length === 1
      ? nodeRecord.candidate_exported_method_ids[0]
      : null;
    const methodRecord = methodId ? methodById.get(methodId) : null;
    const parsed = parsedByPath.get(outcomeRecord.route_path);
    const qualified = qualifyOutcomeDetailed({
      sourceFile: parsed.sourceFile,
      routeRecord: routeByPath.get(outcomeRecord.route_path),
      methodRecord,
      nodeRecord,
      outcomeRecord,
    });
    if (qualified.candidate) candidates.push(qualified.candidate);
    return qualified.overlay;
  });
  const deferredStates = outcomeOverlay.map((entry) => entry.qualification_state);
  const mandatoryUnattributed = split.unattributedIf * 2;
  const mandatoryCatch = split.uniqueCatch + split.unattributedCatch;
  const methodDeferrals = c2_1_ledger.methods
    .filter(
      (method) =>
        method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
    )
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
  if (methodDeferrals.length !== 15) fail("C2_2_OPAQUE_METHOD_DEFERRAL");
  const candidateDigest = candidateSetDigest(candidates);
  const completeOverlayDigest = overlayDigest(outcomeOverlay);
  const statusCounts = new Map();
  const responseShapeCounts = new Map();
  for (const candidate of candidates) {
    statusCounts.set(
      candidate.status_code,
      (statusCounts.get(candidate.status_code) ?? 0) + 1,
    );
    responseShapeCounts.set(
      candidate.response_shape,
      (responseShapeCounts.get(candidate.response_shape) ?? 0) + 1,
    );
  }
  const statusHistogram = [...statusCounts]
    .sort((left, right) => left[0] - right[0])
    .map(([statusCode, count]) => ({ status_code: statusCode, count }));
  const responseShapeHistogram = [
    "NEXT_RESPONSE_JSON",
    "GLOBAL_RESPONSE_JSON",
    "GLOBAL_NEW_RESPONSE",
  ].filter((shape) => responseShapeCounts.has(shape))
    .map((shape) => ({
      response_shape: shape,
      count: responseShapeCounts.get(shape),
    }));
  const deferredStateHistogram = histogram(
    deferredStates.filter(
      (state) => state !== "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    ),
    QUALIFICATION_STATES,
  ).map((entry) => ({
    qualification_state: entry.key,
    count: entry.count,
  }));
  const candidateOutcomes = candidates.length;
  return {
    schema_version: "AIFINDER_C2_2_SYNTHETIC_REJECTION_CANDIDATE_LEDGER_V1",
    phase: "33IA-33IZ",
    artifact_purpose:
      "BATCH_C2_2_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE_QUALIFICATION",
    repository_baseline: {
      repository: governanceFacts.repository,
      branch: governanceFacts.branch,
      commit: governanceFacts.commit,
      parent: governanceFacts.parent,
      tree: governanceFacts.tree,
      subject: governanceFacts.subject,
    },
    source_contract: {
      c2_1_ledger_path: governanceFacts.c2_1_ledger_path,
      c2_1_ledger_sha256: governanceFacts.c2_1_ledger_sha256,
      c2_1_independent_oracle_digest:
        governanceFacts.c2_1_independent_oracle_digest,
      route_contract_digest: governanceFacts.route_contract_digest,
      request_position_digest: governanceFacts.request_position_digest,
      node_set_digest: governanceFacts.node_set_digest,
      route_paths: routePaths,
      route_identities_verified: routePaths.length,
    },
    algorithm_contract: {
      analyzer_version: "AIFINDER_C2_2_CANDIDATE_ANALYZER_V1",
      typescript_version: "5.9.3",
      canonical_json_version: "RECURSIVE_LEXICOGRAPHIC_KEYS_V1",
      candidate_id_version: "AIFINDER_C2_2_CANDIDATE_V1",
      qualification_state_order: QUALIFICATION_STATES,
      candidate_count_contract: "DERIVED_NOT_PREDECLARED",
      first_match_algorithm: QUALIFICATION_STATES,
      response_shape_order: [
        "NEXT_RESPONSE_JSON",
        "GLOBAL_RESPONSE_JSON",
        "GLOBAL_NEW_RESPONSE",
      ],
      helper_semantics: "UNREAD_FOR_C2_2",
    },
    summary: {
      routes: 28,
      methods: 37,
      nodes: 409,
      outcomes: 775,
      unique_nodes: split.uniqueIf + split.uniqueCatch,
      unattributed_nodes: split.unattributedIf + split.unattributedCatch,
      unique_if_nodes: split.uniqueIf,
      unattributed_if_nodes: split.unattributedIf,
      unique_catch_nodes: split.uniqueCatch,
      unattributed_catch_nodes: split.unattributedCatch,
      eligible_universe_outcomes: split.uniqueIf * 2,
      mandatory_deferred_unattributed_if_outcomes: mandatoryUnattributed,
      mandatory_deferred_catch_outcomes: mandatoryCatch,
      mandatory_deferred_outcomes: mandatoryUnattributed + mandatoryCatch,
      candidate_outcomes: candidateOutcomes,
      candidate_count_contract: "DERIVED_FROM_OVERLAY",
      additional_deferred_unique_if_outcomes:
        split.uniqueIf * 2 - candidateOutcomes,
      total_deferred_outcomes: 775 - candidateOutcomes,
      opaque_imported_methods_deferred: methodDeferrals.length,
      status_histogram: statusHistogram,
      response_shape_histogram: responseShapeHistogram,
      deferred_state_histogram: deferredStateHistogram,
      c2_2_analyzer_ledger_helper_content_reads: 0,
      raw_values: 0,
      route_execution: 0,
      runtime_qualified_nodes: 0,
      routes_unblocked: 0,
      launch_blockers: 28,
      execution_authorized: false,
      public_launch: "NO_GO",
      candidate_set_digest: candidateDigest,
      overlay_digest: completeOverlayDigest,
    },
    method_deferrals: methodDeferrals,
    outcome_overlay: outcomeOverlay,
    candidates,
    governance: {
      matrix_path: governanceFacts.matrix_path,
      blocker_registry_path: governanceFacts.blocker_registry_path,
      launch_blocking_routes: governanceFacts.launch_blockers,
      runtime_qualified_nodes: governanceFacts.runtime_qualified_nodes,
      routes_unblocked: governanceFacts.routes_unblocked,
      execution_authorized: governanceFacts.execution_authorized,
      public_launch: governanceFacts.public_launch,
      actual_synthetic_execution_started: false,
      transformed_route_execution: false,
      application_route_imported: false,
      application_route_executed: false,
      helper_module_read_for_c2_2: false,
      helper_module_imported: false,
      helper_module_executed: false,
      raw_values: 0,
      candidate_set_digest: candidateDigest,
      overlay_digest: completeOverlayDigest,
    },
  };
}
