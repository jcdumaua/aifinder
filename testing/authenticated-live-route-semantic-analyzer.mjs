import { createHash } from "node:crypto";
import ts from "typescript";

const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function hasExportModifier(node) {
  return Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
}

function identifierName(node) {
  return node && ts.isIdentifier(node) ? node.text : null;
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

function parseRoute(path, bytes) {
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("C2_1_FATAL_UTF8");
  }
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length !== 0) {
    fail("C2_1_PARSE_DIAGNOSTICS");
  }
  return { source, sourceFile };
}

function collectTopLevelBindings(sourceFile) {
  const imported = new Set();
  const bindings = new Map();
  const addBinding = (name, binding) => {
    if (!name) return;
    const existing = bindings.get(name) ?? [];
    existing.push(binding);
    bindings.set(name, existing);
  };

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.name) imported.add(clause.name.text);
      const named = clause?.namedBindings;
      if (named && ts.isNamespaceImport(named)) {
        imported.add(named.name.text);
      } else if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) imported.add(element.name.text);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      addBinding(statement.name.text, {
        node: statement,
        initializer: statement,
        implementation_kind: "LOCAL_FUNCTION_DECLARATION",
      });
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = identifierName(declaration.name);
        if (name) {
          addBinding(name, {
            node: declaration,
            initializer: declaration.initializer,
            implementation_kind: ts.isArrowFunction(declaration.initializer)
              ? "LOCAL_ARROW_FUNCTION"
              : ts.isFunctionExpression(declaration.initializer)
                ? "LOCAL_FUNCTION_EXPRESSION"
                : null,
          });
        }
      }
    }
  }
  return { imported, bindings };
}

function uniqueBinding(name, bindings) {
  const matches = bindings.get(name) ?? [];
  if (matches.length > 1) fail("C2_1_AMBIGUOUS_OWNERSHIP");
  if (matches.length !== 1) fail("C2_1_EXPORT_RESOLUTION_NO_BINDING");
  return matches[0];
}

function localFormForInitializer(initializer) {
  if (ts.isFunctionDeclaration(initializer)) {
    return {
      export_form: "LOCAL_EXPORT_ALIAS",
      implementation_kind: "LOCAL_FUNCTION_DECLARATION",
      implementation_node: initializer,
    };
  }
  if (ts.isArrowFunction(initializer)) {
    return {
      export_form: "LOCAL_EXPORT_ALIAS",
      implementation_kind: "LOCAL_ARROW_FUNCTION",
      implementation_node: initializer,
    };
  }
  if (ts.isFunctionExpression(initializer)) {
    return {
      export_form: "LOCAL_EXPORT_ALIAS",
      implementation_kind: "LOCAL_FUNCTION_EXPRESSION",
      implementation_node: initializer,
    };
  }
  return null;
}

function resolveIdentifier(name, imported, bindings, seen = new Set()) {
  if (imported.has(name)) {
    return {
      export_form: "OPAQUE_IMPORTED_BINDING",
      implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      implementation_node: null,
    };
  }
  if (seen.has(name)) fail("C2_1_EXPORT_RESOLUTION_CYCLE");
  seen.add(name);
  const binding = uniqueBinding(name, bindings);
  const direct = localFormForInitializer(binding.initializer);
  if (direct) return direct;
  if (ts.isIdentifier(binding.initializer)) {
    return resolveIdentifier(binding.initializer.text, imported, bindings, seen);
  }
  if (ts.isCallExpression(binding.initializer)) {
    return {
      export_form: "OPAQUE_IMPORTED_FACTORY_CALL",
      implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      implementation_node: null,
    };
  }
  fail("C2_1_EXPORT_RESOLUTION_ALIAS_INITIALIZER");
}

function resolveExportedInitializer(initializer, imported, bindings) {
  if (ts.isArrowFunction(initializer)) {
    return {
      export_form: "CONST_ARROW",
      implementation_kind: "LOCAL_ARROW_FUNCTION",
      implementation_node: initializer,
    };
  }
  if (ts.isFunctionExpression(initializer)) {
    return {
      export_form: "CONST_FUNCTION",
      implementation_kind: "LOCAL_FUNCTION_EXPRESSION",
      implementation_node: initializer,
    };
  }
  if (ts.isIdentifier(initializer)) {
    return resolveIdentifier(initializer.text, imported, bindings);
  }
  if (ts.isPropertyAccessExpression(initializer)) {
    const owner = identifierName(initializer.expression);
    if (owner && !imported.has(owner)) {
      const ownerBinding = uniqueBinding(owner, bindings);
      if (ts.isCallExpression(ownerBinding.initializer)) {
        return {
          export_form: "OPAQUE_IMPORTED_FACTORY_MEMBER",
          implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
          implementation_node: null,
        };
      }
    }
    return {
      export_form: "OPAQUE_IMPORTED_BINDING",
      implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      implementation_node: null,
    };
  }
  if (ts.isCallExpression(initializer)) {
    const inlineImplementations = [];
    const collectInlineImplementation = (node) => {
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        inlineImplementations.push(node);
        return;
      }
      ts.forEachChild(node, collectInlineImplementation);
    };
    for (const argument of initializer.arguments) {
      collectInlineImplementation(argument);
    }
    if (
      inlineImplementations.length === 0 &&
      ts.isIdentifier(initializer.expression) &&
      !imported.has(initializer.expression.text)
    ) {
      const localFactoryCandidates =
        bindings.get(initializer.expression.text) ?? [];
      if (localFactoryCandidates.length > 1) {
        fail("C2_1_AMBIGUOUS_OWNERSHIP");
      }
      if (localFactoryCandidates.length === 1) {
        const localFactory = localFactoryCandidates[0].initializer;
        if (
          ts.isFunctionDeclaration(localFactory) ||
          ts.isArrowFunction(localFactory) ||
          ts.isFunctionExpression(localFactory)
        ) {
          ts.forEachChild(localFactory, collectInlineImplementation);
        }
      }
    }
    if (inlineImplementations.length === 1) {
      return {
        export_form: "WRAPPER_INLINE_CALLBACK",
        implementation_kind: "LOCAL_WRAPPER_CALLBACK",
        implementation_node: inlineImplementations[0],
      };
    }
    return {
      export_form: "OPAQUE_IMPORTED_FACTORY_CALL",
      implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      implementation_node: null,
    };
  }
  fail("C2_1_EXPORT_RESOLUTION_EXPORTED_INITIALIZER");
}

function discoverMethods(sourceFile) {
  const { imported, bindings } = collectTopLevelBindings(sourceFile);
  const found = new Map();
  const add = (httpMethod, details) => {
    if (!HTTP_METHODS.includes(httpMethod)) return;
    if (found.has(httpMethod)) fail("C2_1_EXPORTED_METHOD_SET");
    found.set(httpMethod, { http_method: httpMethod, ...details });
  };

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      hasExportModifier(statement)
    ) {
      add(statement.name.text, {
        export_form: "FUNCTION_DECLARATION",
        implementation_kind: "LOCAL_FUNCTION_DECLARATION",
        implementation_node: statement,
      });
      continue;
    }
    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const httpMethod = identifierName(declaration.name);
        if (
          httpMethod &&
          HTTP_METHODS.includes(httpMethod) &&
          declaration.initializer
        ) {
          add(
            httpMethod,
            resolveExportedInitializer(declaration.initializer, imported, bindings),
          );
        }
      }
      continue;
    }
    if (ts.isExportDeclaration(statement) && statement.exportClause) {
      if (!ts.isNamedExports(statement.exportClause)) {
        fail("C2_1_EXPORT_RESOLUTION_EXPORT_CLAUSE");
      }
      for (const element of statement.exportClause.elements) {
        const httpMethod = element.name.text;
        if (!HTTP_METHODS.includes(httpMethod)) continue;
        if (statement.moduleSpecifier) {
          add(httpMethod, {
            export_form: "OPAQUE_REEXPORT_FROM",
            implementation_kind: "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
            implementation_node: null,
          });
        } else {
          const localName = element.propertyName?.text ?? element.name.text;
          const resolved = resolveIdentifier(localName, imported, bindings);
          add(httpMethod, {
            ...resolved,
            export_form: resolved.export_form === "OPAQUE_IMPORTED_BINDING"
              ? "OPAQUE_IMPORTED_BINDING"
              : "LOCAL_EXPORT_ALIAS",
          });
        }
      }
    }
  }

  return HTTP_METHODS.filter((method) => found.has(method)).map((method) => found.get(method));
}

function collectSemanticNodes(sourceFile, source) {
  const nodes = [];
  let memberCatchCalls = 0;
  const visit = (node) => {
    if (ts.isIfStatement(node) || ts.isCatchClause(node)) {
      const start = node.getStart(sourceFile, false);
      const end = node.end;
      const location = sourceFile.getLineAndCharacterOfPosition(start);
      nodes.push({
        kind: ts.isIfStatement(node) ? "IF" : "CATCH",
        catch_binding: ts.isCatchClause(node)
          ? node.variableDeclaration
            ? "PARAMETERIZED"
            : "OPTIONAL"
          : "NOT_APPLICABLE",
        start_utf16: start,
        end_utf16: end,
        start_line_1_based: location.line + 1,
        start_column_1_based: location.character + 1,
        source_span_sha256: createHash("sha256")
          .update(source.slice(start, end), "utf8")
          .digest("hex"),
      });
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "catch"
    ) {
      memberCatchCalls += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  nodes.sort(
    (left, right) =>
      left.start_utf16 - right.start_utf16 ||
      left.end_utf16 - right.end_utf16 ||
      (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
  );
  return { nodes, memberCatchCalls };
}

function digestFields(...fields) {
  return createHash("sha256").update(fields.join("\0"), "utf8").digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitBlobBytes(bytes) {
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

function normalizeLocalTarget(routePath, rawSpecifier, helperPaths) {
  const parts = rawSpecifier.startsWith("@/")
    ? []
    : routePath.split("/").slice(0, -1);
  const relativeParts = rawSpecifier.startsWith("@/")
    ? rawSpecifier.slice(2).split("/")
    : rawSpecifier.split("/");
  for (const part of relativeParts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) fail("C2_1_IMPORT_ROOT_ESCAPE");
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  const normalized = parts.join("/");
  const candidates = [
    normalized,
    normalized + ".ts",
    normalized + ".tsx",
    normalized + "/index.ts",
    normalized + "/index.tsx",
  ];
  const helperSet = new Set(helperPaths);
  const matches = candidates.filter(
    (candidate, index) =>
      candidates.indexOf(candidate) === index && helperSet.has(candidate),
  );
  if (matches.length !== 1) fail("C2_1_IMPORT_LOCAL_RESOLUTION");
  return matches[0];
}

function collectImportBoundaries({ routePath, sourceFile, helperPaths }) {
  const boundaries = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !(
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)
      ) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      continue;
    }
    const rawSpecifier = statement.moduleSpecifier.text;
    let boundaryKind;
    let resolvedTarget;
    if (rawSpecifier.startsWith("./") || rawSpecifier.startsWith("../") || rawSpecifier.startsWith("@/")) {
      boundaryKind = "LOCAL_UNREAD";
      resolvedTarget = normalizeLocalTarget(
        routePath,
        rawSpecifier,
        helperPaths,
      );
    } else if (rawSpecifier === "crypto" || rawSpecifier === "zlib") {
      boundaryKind = "BUILTIN_UNREAD";
      resolvedTarget = rawSpecifier;
    } else if (rawSpecifier === "server-only" || rawSpecifier === "next/server") {
      boundaryKind = "EXTERNAL_UNREAD";
      resolvedTarget = rawSpecifier;
    } else {
      fail("C2_1_IMPORT_BARE_SPECIFIER");
    }
    const tuple = [routePath, rawSpecifier, boundaryKind, resolvedTarget].join("\0");
    const importBoundaryId = digestFields(
      "AIFINDER_C2_1_IMPORT_V1",
      routePath,
      rawSpecifier,
      boundaryKind,
      resolvedTarget,
    );
    const candidate = {
      import_boundary_id: importBoundaryId,
      route_path: routePath,
      raw_specifier: rawSpecifier,
      boundary_kind: boundaryKind,
      resolved_target_or_external: resolvedTarget,
      content_state: "UNREAD_FOR_C2_1_SEMANTICS",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
    };
    const previous = boundaries.get(tuple);
    if (previous && previous.import_boundary_id !== importBoundaryId) {
      fail("C2_1_IMPORT_CONFLICT");
    }
    boundaries.set(tuple, candidate);
  }
  return [...boundaries.values()].sort(
    (left, right) =>
      left.route_path.localeCompare(right.route_path) ||
      left.raw_specifier.localeCompare(right.raw_specifier) ||
      left.import_boundary_id.localeCompare(right.import_boundary_id),
  );
}

function functionRootEntries(sourceFile, methods) {
  const namedRoots = new Map();
  const addNamed = (name, node) => {
    if (!name || !node) return;
    const existing = namedRoots.get(name) ?? [];
    existing.push(node);
    namedRoots.set(name, existing);
  };
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      addNamed(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = identifierName(declaration.name);
        if (
          name &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          addNamed(name, declaration.initializer);
        }
      }
    }
  }
  const roots = new Set();
  for (const candidates of namedRoots.values()) {
    if (candidates.length === 1) roots.add(candidates[0]);
  }
  for (const method of methods) {
    if (method.implementation_node) roots.add(method.implementation_node);
  }
  return { namedRoots, roots: [...roots] };
}

function rootCallEdges(roots, namedRoots) {
  const edges = new Map(roots.map((root) => [root, new Set()]));
  for (const root of roots) {
    const visit = (node) => {
      if (node !== root && roots.includes(node)) return;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const candidates = namedRoots.get(node.expression.text) ?? [];
        if (candidates.length > 1) fail("C2_1_AMBIGUOUS_OWNERSHIP");
        if (candidates.length === 1) edges.get(root).add(candidates[0]);
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
  }
  return edges;
}

function reachableRoots(start, edges) {
  if (!start) return new Set();
  const reached = new Set();
  const pending = [start];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const target of edges.get(current) ?? []) {
      if (!reached.has(target) && target !== start) {
        reached.add(target);
        pending.push(target);
      }
    }
  }
  return reached;
}

function containingRoot(node, roots, sourceFile) {
  const start = node.start_utf16;
  const end = node.end_utf16;
  const candidates = roots.filter(
    (root) =>
      root.getStart(sourceFile, false) <= start && root.end >= end,
  );
  candidates.sort(
    (left, right) =>
      (left.end - left.getStart(sourceFile, false)) -
      (right.end - right.getStart(sourceFile, false)),
  );
  if (
    candidates.length > 1 &&
    candidates[0].getStart(sourceFile, false) ===
      candidates[1].getStart(sourceFile, false) &&
    candidates[0].end === candidates[1].end &&
    candidates[0] !== candidates[1]
  ) {
    fail("C2_1_AMBIGUOUS_OWNERSHIP");
  }
  return candidates[0] ?? null;
}

function applyOwnership({
  routePath,
  routeSha256,
  gitBlob,
  sourceFile,
  discoveredMethods,
  nodes,
  importBoundaries,
}) {
  const routeImportBoundaryIds = importBoundaries
    .map((boundary) => boundary.import_boundary_id);
  const methods = discoveredMethods.map((method) => {
    const methodId = digestFields(
      "AIFINDER_C2_1_METHOD_V1",
      routePath,
      gitBlob,
      method.http_method,
      method.export_form,
      method.implementation_kind,
    );
    const opaque =
      method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD";
    return {
      method_id: methodId,
      route_path: routePath,
      http_method: method.http_method,
      export_form: method.export_form,
      implementation_kind: method.implementation_kind,
      direct_node_ids: [],
      reachable_local_helper_node_ids: [],
      import_boundary_ids: routeImportBoundaryIds,
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      next_authorities: [
        opaque
          ? "FRESH_EXACT_HELPER_READ_SCOPE_REQUIRED"
          : "MANUAL_STATIC_REVIEW_REQUIRED",
      ],
      reason_codes: [
        opaque
          ? "IMPORTED_IMPLEMENTATION_UNREAD"
          : "LOCAL_NODE_REQUIRES_MANUAL_REVIEW",
      ],
      implementation_node: method.implementation_node,
    };
  });
  const { namedRoots, roots } = functionRootEntries(sourceFile, discoveredMethods);
  const edges = rootCallEdges(roots, namedRoots);
  const reachability = new Map(
    methods.map((method) => [method.method_id, reachableRoots(method.implementation_node, edges)]),
  );
  const publicNodes = nodes.map((node) => {
    const nodeId = digestFields(
      "AIFINDER_C2_1_NODE_V1",
      routePath,
      gitBlob,
      node.kind,
      String(node.start_utf16),
      String(node.end_utf16),
      node.source_span_sha256,
    );
    const root = containingRoot(node, roots, sourceFile);
    const candidates = methods
      .filter(
        (method) =>
          method.implementation_node &&
          (method.implementation_node === root ||
            reachability.get(method.method_id)?.has(root)),
      )
      .map((method) => method.method_id)
      .sort();
    const ownership = candidates.length === 0
      ? "UNATTRIBUTED"
      : candidates.length === 1
        ? "UNIQUE"
        : "SHARED";
    return {
      node_id: nodeId,
      route_path: routePath,
      route_sha256: routeSha256,
      kind: node.kind,
      catch_binding: node.catch_binding,
      start_utf16: node.start_utf16,
      end_utf16: node.end_utf16,
      start_line_1_based: node.start_line_1_based,
      start_column_1_based: node.start_column_1_based,
      source_span_sha256: node.source_span_sha256,
      ownership_state: ownership,
      candidate_exported_method_ids: candidates,
      outcome_ids: [],
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      next_evidence_classes: ["MANUAL_STATIC_REVIEW_REQUIRED"],
      reason_codes: ["LOCAL_NODE_REQUIRES_MANUAL_REVIEW"],
      root,
    };
  });
  for (const method of methods) {
    method.direct_node_ids = publicNodes
      .filter((node) => node.root === method.implementation_node)
      .map((node) => node.node_id);
    const reached = reachability.get(method.method_id) ?? new Set();
    method.reachable_local_helper_node_ids = publicNodes
      .filter(
        (node) =>
          node.root &&
          node.root !== method.implementation_node &&
          reached.has(node.root),
      )
      .map((node) => node.node_id);
  }
  const outcomes = [];
  for (const node of publicNodes) {
    const outcomeKinds = node.kind === "IF"
      ? ["IF_TRUE", "IF_FALSE_OR_FALLTHROUGH"]
      : ["CATCH_ENTERED"];
    node.outcome_ids = outcomeKinds.map((outcomeKind) => {
      const outcomeId = digestFields(
        "AIFINDER_C2_1_OUTCOME_V1",
        node.node_id,
        outcomeKind,
      );
      outcomes.push({
        outcome_id: outcomeId,
        node_id: node.node_id,
        route_path: routePath,
        outcome_kind: outcomeKind,
        structure_state: "QUALIFIED_OFFLINE",
        behavior_state: "NOT_RUNTIME_QUALIFIED",
        next_evidence_classes: ["MANUAL_STATIC_REVIEW_REQUIRED"],
        reason_codes: ["LOCAL_NODE_REQUIRES_MANUAL_REVIEW"],
      });
      return outcomeId;
    });
  }
  const nodeRows = publicNodes.map((node) =>
    [
      node.node_id,
      node.route_path,
      node.kind,
      node.start_utf16,
      node.end_utf16,
      node.source_span_sha256,
      node.ownership_state,
      node.candidate_exported_method_ids.join(","),
      node.outcome_ids.join(","),
    ].join("\0") + "\n"
  ).join("");
  return {
    methods: methods.map(({ implementation_node, ...method }) => method),
    nodes: publicNodes.map(({ root, ...node }) => node),
    outcomes,
    nodeSetDigest: sha256Bytes(Buffer.from(nodeRows, "utf8")),
  };
}

export function analyzeRoute({
  path,
  bytes,
  expectedIdentity = null,
  helperPaths = [],
}) {
  if (typeof path !== "string" || !(bytes instanceof Uint8Array)) {
    fail("C2_1_ROUTE_INPUT");
  }
  const exactBytes = Buffer.from(bytes);
  const { source, sourceFile } = parseRoute(path, exactBytes);
  const sha256 = sha256Bytes(exactBytes);
  const gitBlob = gitBlobBytes(exactBytes);
  const lfLines = countLf(exactBytes);
  if (
    expectedIdentity &&
    (expectedIdentity.sha256 !== sha256 ||
      expectedIdentity.git_blob !== gitBlob ||
      expectedIdentity.bytes !== exactBytes.length ||
      expectedIdentity.lf_lines !== lfLines)
  ) {
    fail("C2_1_ROUTE_IDENTITY");
  }
  const discoveredMethods = discoverMethods(sourceFile);
  const { nodes, memberCatchCalls } = collectSemanticNodes(sourceFile, source);
  const importBoundaries = collectImportBoundaries({
    routePath: path,
    sourceFile,
    helperPaths,
  });
  const ifCount = nodes.filter((node) => node.kind === "IF").length;
  const catchBoundCount = nodes.filter(
    (node) => node.catch_binding === "PARAMETERIZED",
  ).length;
  const catchOptionalCount = nodes.filter(
    (node) => node.catch_binding === "OPTIONAL",
  ).length;
  if (
    expectedIdentity?.exported_methods &&
    JSON.stringify(discoveredMethods.map((method) => method.http_method)) !==
      JSON.stringify(expectedIdentity.exported_methods)
  ) {
    fail("C2_1_EXPORTED_METHOD_SET");
  }
  const semanticNodeCount = nodes.length;
  if (
    expectedIdentity &&
    [
      ["if_count", ifCount],
      ["catch_bound_count", catchBoundCount],
      ["catch_optional_count", catchOptionalCount],
      ["catch_total", catchBoundCount + catchOptionalCount],
      ["decision_total", semanticNodeCount],
    ].some(
      ([field, actual]) =>
        typeof expectedIdentity[field] === "number" &&
        expectedIdentity[field] !== actual,
    )
  ) {
    fail("C2_1_ROUTE_SEMANTIC_VECTOR");
  }
  const owned = applyOwnership({
    routePath: path,
    routeSha256: sha256,
    gitBlob,
    sourceFile,
    discoveredMethods,
    nodes,
    importBoundaries,
  });
  return {
    route_path: path,
    git_blob: gitBlob,
    sha256,
    bytes: exactBytes.length,
    lf_lines: lfLines,
    methods: owned.methods,
    nodes: owned.nodes,
    outcomes: owned.outcomes,
    import_boundaries: importBoundaries,
    if_count: ifCount,
    catch_bound_count: catchBoundCount,
    catch_optional_count: catchOptionalCount,
    catch_total: catchBoundCount + catchOptionalCount,
    semantic_node_count: semanticNodeCount,
    member_catch_calls: memberCatchCalls,
    node_set_digest: owned.nodeSetDigest,
  };
}

export function buildLedger({
  routeInputs,
  partialEvidence,
  governanceFacts,
} = {}) {
  if (
    !Array.isArray(routeInputs) ||
    routeInputs.length !== 28 ||
    new Set(routeInputs.map((route) => route.path)).size !== 28 ||
    !partialEvidence ||
    !governanceFacts
  ) {
    fail("C2_1_ROUTE_SCOPE");
  }
  const evidenceByPath = new Map(
    partialEvidence.routes.map((route) => [route.baseline_path, route]),
  );
  if (
    evidenceByPath.size !== 28 ||
    routeInputs.some((route) => !evidenceByPath.has(route.path))
  ) {
    fail("C2_1_ROUTE_SCOPE");
  }
  const analyses = routeInputs
    .map((routeInput) => analyzeRoute(routeInput))
    .sort((left, right) => left.route_path.localeCompare(right.route_path));
  const methods = analyses
    .flatMap((analysis) => analysis.methods)
    .sort(
      (left, right) =>
        left.route_path.localeCompare(right.route_path) ||
        HTTP_METHODS.indexOf(left.http_method) -
          HTTP_METHODS.indexOf(right.http_method) ||
        left.method_id.localeCompare(right.method_id),
    );
  const nodes = analyses
    .flatMap((analysis) => analysis.nodes)
    .sort(
      (left, right) =>
        left.route_path.localeCompare(right.route_path) ||
        left.start_utf16 - right.start_utf16 ||
        left.end_utf16 - right.end_utf16 ||
        (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
    );
  const outcomeById = new Map(
    analyses
      .flatMap((analysis) => analysis.outcomes)
      .map((outcome) => [outcome.outcome_id, outcome]),
  );
  const outcomes = nodes.flatMap((node) =>
    node.outcome_ids.map((outcomeId) => {
      const outcome = outcomeById.get(outcomeId);
      if (!outcome) fail("C2_1_OUTCOME_SET");
      return outcome;
    })
  );
  const importBoundaries = analyses
    .flatMap((analysis) => analysis.import_boundaries)
    .sort(
      (left, right) =>
        left.route_path.localeCompare(right.route_path) ||
        left.raw_specifier.localeCompare(right.raw_specifier) ||
        left.import_boundary_id.localeCompare(right.import_boundary_id),
    );
  const methodByRoute = new Map();
  for (const method of methods) {
    const values = methodByRoute.get(method.route_path) ?? [];
    values.push(method);
    methodByRoute.set(method.route_path, values);
  }
  const nodeByRoute = new Map();
  for (const node of nodes) {
    const values = nodeByRoute.get(node.route_path) ?? [];
    values.push(node);
    nodeByRoute.set(node.route_path, values);
  }
  const boundaryByRoute = new Map();
  for (const boundary of importBoundaries) {
    const values = boundaryByRoute.get(boundary.route_path) ?? [];
    values.push(boundary);
    boundaryByRoute.set(boundary.route_path, values);
  }
  const routes = analyses.map((analysis) => {
    const evidence = evidenceByPath.get(analysis.route_path);
    return {
      route_path: analysis.route_path,
      git_blob: analysis.git_blob,
      sha256: analysis.sha256,
      bytes: analysis.bytes,
      lf_lines: analysis.lf_lines,
      observed_status: evidence.observed_status,
      exported_method_ids: (methodByRoute.get(analysis.route_path) ?? []).map(
        (method) => method.method_id,
      ),
      if_count: analysis.if_count,
      catch_bound_count: analysis.catch_bound_count,
      catch_optional_count: analysis.catch_optional_count,
      catch_total: analysis.catch_total,
      node_ids: (nodeByRoute.get(analysis.route_path) ?? []).map(
        (node) => node.node_id,
      ),
      import_boundary_ids: (
        boundaryByRoute.get(analysis.route_path) ?? []
      ).map((boundary) => boundary.import_boundary_id),
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      launch_blocking: true,
    };
  });
  const importedOpaqueMethods = methods.filter(
    (method) =>
      method.implementation_kind ===
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
  ).length;
  const routeLocalMethods = methods.length - importedOpaqueMethods;
  const ifs = nodes.filter((node) => node.kind === "IF").length;
  const catchesWithBinding = nodes.filter(
    (node) => node.catch_binding === "PARAMETERIZED",
  ).length;
  const catchesOptional = nodes.filter(
    (node) => node.catch_binding === "OPTIONAL",
  ).length;
  const observed = routes.filter(
    (route) => route.observed_status === "OBSERVED_PARTIAL_FILE_LEVEL_ONLY",
  ).length;
  const unobserved = routes.filter(
    (route) => route.observed_status === "UNOBSERVED",
  ).length;
  if (methods.length !== 37) fail("C2_1_GLOBAL_RECONCILIATION_METHODS");
  if (ifs !== 366) fail("C2_1_GLOBAL_RECONCILIATION_IFS");
  if (catchesWithBinding !== 31) fail("C2_1_GLOBAL_RECONCILIATION_BOUND_CATCHES");
  if (catchesOptional !== 12) fail("C2_1_GLOBAL_RECONCILIATION_OPTIONAL_CATCHES");
  if (nodes.length !== 409) fail("C2_1_GLOBAL_RECONCILIATION_NODES");
  if (outcomes.length !== 775) fail("C2_1_GLOBAL_RECONCILIATION_OUTCOMES");
  if (importedOpaqueMethods !== 15) {
    fail("C2_1_GLOBAL_RECONCILIATION_OPAQUE_METHODS");
  }
  if (routeLocalMethods !== 22) fail("C2_1_GLOBAL_RECONCILIATION_LOCAL_METHODS");
  if (observed !== 15 || unobserved !== 13) {
    fail("C2_1_GLOBAL_RECONCILIATION_OBSERVED_PARTITION");
  }
  const routeContractRows = [...partialEvidence.routes]
    .sort((left, right) => left.baseline_path.localeCompare(right.baseline_path))
    .map((route) =>
      [
        route.baseline_path,
        route.git_object_identity,
        route.sha256,
        route.exported_methods.join(","),
        route.source_visible_branch_groups.if_statements,
        route.source_visible_branch_groups.catch_clauses_with_binding,
        route.source_visible_branch_groups.catch_clauses_optional_binding,
        route.source_visible_branch_groups.catch_clauses_total,
        route.source_visible_branch_groups.decision_catch_total,
      ].join("\0") + "\n"
    )
    .join("");
  const requestPositionRows = [...partialEvidence.request_positions]
    .sort((left, right) => left.sequence - right.sequence)
    .map((position) =>
      [
        position.sequence,
        position.case_id,
        position.route_file,
        position.method,
        position.path_template,
        position.status,
        position.pair_position,
        JSON.stringify(position.pre_post_equal),
        position.source_visible_branch_category,
        position.evidence_identity,
      ].join("\0") + "\n"
    )
    .join("");
  const routeContractDigest = sha256Bytes(
    Buffer.from(routeContractRows, "utf8"),
  );
  const requestPositionContractDigest = sha256Bytes(
    Buffer.from(requestPositionRows, "utf8"),
  );
  if (
    routeContractDigest !==
      "d6dddd950dd1f463106f3cc3aca3c659f5106ec22023c8c31d3e1aefe41fd6a9" ||
    requestPositionContractDigest !==
      "014caf9d9f4e3ada5824ed2025a77166f905ffdc02af9786a98ee26ec2627504"
  ) {
    fail("C2_1_SOURCE_CONTRACT_DIGEST");
  }
  const requestPositions = [...partialEvidence.request_positions]
    .sort((left, right) => left.sequence - right.sequence)
    .map((position) => ({
      sequence: position.sequence,
      case_id: position.case_id,
      route_file: position.route_file,
      method: position.method,
      path_template: position.path_template,
      status: position.status,
      pair_position: position.pair_position,
      pre_post_equal: position.pre_post_equal,
      source_visible_branch_category: position.source_visible_branch_category,
      evidence_identity: position.evidence_identity,
      node_ids: [],
      binding_state: "FILE_METHOD_CATEGORY_ONLY_NO_EXACT_NODE_CLAIM",
    }));
  return {
    schema_version: "AIFINDER_C2_1_SEMANTIC_BRANCH_LEDGER_V1",
    phase: "33HA-33HZ",
    artifact_purpose: "BATCH_C2_1_OFFLINE_SEMANTIC_BRANCH_QUALIFICATION",
    repository_baseline: {
      repository: governanceFacts.repository,
      branch: governanceFacts.branch,
      commit: governanceFacts.commit,
      parent: governanceFacts.parent,
      tree: governanceFacts.tree,
      subject: governanceFacts.subject,
    },
    source_contract: {
      partial_evidence_path:
        "testing/authenticated-live-route-partial-evidence.json",
      partial_evidence_sha256:
        "68f8493efd59116bc2b1f81876e6c42243e701ae0d44683cb1a8944a74d9178f",
      route_contract_digest: routeContractDigest,
      request_position_contract_digest: requestPositionContractDigest,
      route_count: 28,
      method_count: 37,
      observed_routes: 15,
      unobserved_routes: 13,
      wrapper_routes: 8,
      imported_opaque_methods: 15,
      route_local_methods: 22,
      write_scope_create_paths: [
        "testing/authenticated-live-route-semantic-analyzer.mjs",
        "testing/authenticated-live-route-semantic-analyzer.test.mjs",
        "testing/authenticated-live-route-semantic-branch-ledger.schema.json",
        "testing/authenticated-live-route-semantic-branch-ledger.json",
        "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
      ],
      write_scope_modify_paths: [
        "testing/static-test-safety-manifest.json",
        "testing/static-test-safety-manifest.test.mjs",
        "testing/run-static-readiness.mjs",
      ],
    },
    algorithm_contract: {
      analyzer_version: "AIFINDER_C2_1_ANALYZER_V1",
      typescript_version: "5.9.3",
      canonical_json_version: "RECURSIVE_LEXICOGRAPHIC_KEYS_V1",
      node_id_version: "AIFINDER_C2_1_NODE_V1",
      method_id_version: "AIFINDER_C2_1_METHOD_V1",
      outcome_id_version: "AIFINDER_C2_1_OUTCOME_V1",
      import_id_version: "AIFINDER_C2_1_IMPORT_V1",
      ownership_version: "LEXICAL_FIXED_POINT_V1",
      helper_semantics: "UNREAD_FOR_C2_1",
    },
    summary: {
      routes: 28,
      methods: 37,
      ifs: 366,
      catches_with_binding: 31,
      catches_optional: 12,
      catches: 43,
      nodes: 409,
      outcomes: 775,
      observed: 15,
      unobserved: 13,
      imported_opaque_methods: 15,
      route_local_methods: 22,
      manual_methods: 22,
      fresh_helper_methods: 15,
      manual_nodes: 409,
      manual_outcomes: 775,
      c2_2_candidates: 0,
      c2_3_candidates: 0,
      c2_4_candidates: 0,
      runtime_qualified_nodes: 0,
      routes_unblocked: 0,
      launch_blockers: 28,
      public_launch: "NO_GO",
    },
    routes,
    methods,
    nodes,
    outcomes,
    import_boundaries: importBoundaries,
    request_positions: requestPositions,
    governance: {
      matrix_path: governanceFacts.matrix_path,
      blocker_registry_path: governanceFacts.blocker_registry_path,
      gap_code: governanceFacts.gap_code,
      launch_blocking_routes: 28,
      runtime_qualified_nodes: 0,
      routes_unblocked: 0,
      overall_decision: "NO_GO_PENDING_SEPARATE_AUTHORITIES",
      execution_authorized: false,
      public_launch: "NO_GO",
    },
  };
}
