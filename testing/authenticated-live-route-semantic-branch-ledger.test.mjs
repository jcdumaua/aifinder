import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const LEDGER_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.json";
const READ_ALLOWLIST = Object.freeze([
  "app/api/admin/audit-logs/route.ts",
  "app/api/admin/csrf/route.ts",
  "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
  "app/api/admin/discovery/candidate-staging-queue/route.ts",
  "app/api/admin/discovery/discovered-tools/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/publish/route.ts",
  "app/api/admin/homepage-control/drafts/[id]/route.ts",
  "app/api/admin/homepage-control/drafts/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts",
  "app/api/admin/discovery/discovered-tools/[id]/route.ts",
  "app/api/admin/discovery/discovered-tools/bulk-status/route.ts",
  "app/api/admin/discovery/intake/route.ts",
  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
  "app/api/admin/discovery/runs/manual/claim/route.ts",
  "app/api/admin/discovery/runs/manual/route.ts",
  "app/api/admin/discovery/runs/route.ts",
  "app/api/admin/discovery/sources/[id]/route.ts",
  "app/api/admin/discovery/sources/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/upload-logo/route.ts",
  "testing/authenticated-live-route-partial-evidence.json",
  "testing/readiness-coverage-matrix.json",
  "testing/public-launch-blocker-registry.json",
  "testing/authenticated-live-route-semantic-analyzer.mjs",
  "testing/authenticated-live-route-semantic-analyzer.test.mjs",
  "testing/authenticated-live-route-semantic-branch-ledger.schema.json",
  "testing/authenticated-live-route-semantic-branch-ledger.json",
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
]);
const READ_ALLOWLIST_SET = new Set(READ_ALLOWLIST);
const READ_COUNTS = new Map();
const REPOSITORY_ROOT = path.resolve(process.cwd());
const ROUTE_PATHS = Object.freeze(READ_ALLOWLIST.slice(0, 28));
const PARTIAL_EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const BLOCKER_PATH = "testing/public-launch-blocker-registry.json";
const SCHEMA_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.schema.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const MANIFEST_TEST_PATH = "testing/static-test-safety-manifest.test.mjs";
const RUNNER_PATH = "testing/run-static-readiness.mjs";
const ANALYZER_PATH =
  "testing/authenticated-live-route-semantic-analyzer.mjs";
const ANALYZER_TEST_PATH =
  "testing/authenticated-live-route-semantic-analyzer.test.mjs";
const LEDGER_TEST_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs";
const HTTP_METHODS = Object.freeze([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const HELPER_PATHS = Object.freeze([
  "app/api/admin/audit-logs/handler.ts",
  "app/api/admin/discovery/candidate-extraction/invoke/handler.ts",
  "app/api/admin/discovery/candidate-staging-queue/handler.ts",
  "app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts",
  "app/api/admin/logout/handler.ts",
  "app/api/admin/submissions/handler.ts",
  "app/api/admin/tools/handler.ts",
  "app/api/admin/upload-logo/handler.ts",
  "lib/admin-audit-log.ts",
  "lib/admin-auth.ts",
  "lib/admin-rate-limit.ts",
  "lib/discovery-fetch-adapter.ts",
  "lib/discovery-manual-crawler.ts",
  "lib/discovery-manual-metadata-fetch.ts",
  "lib/discovery-request-plan.ts",
  "lib/discovery-run-results-review.ts",
  "lib/discovery-static-html-evidence-audit-review.ts",
  "lib/discovery-static-html-evidence-executor.ts",
  "lib/discovery/discovery-candidate-decision-admin.ts",
  "lib/discovery/discovery-candidate-decision-validation.ts",
  "lib/homepage-control-admin.ts",
  "lib/homepage-control-types.ts",
  "lib/public-live-route-safety.ts",
  "lib/supabase-admin.ts",
  "lib/tool-validation.ts",
]);
const CREATE_PATHS = Object.freeze([
  ANALYZER_PATH,
  ANALYZER_TEST_PATH,
  SCHEMA_PATH,
  LEDGER_PATH,
  LEDGER_TEST_PATH,
]);
const MODIFY_PATHS = Object.freeze([
  MANIFEST_PATH,
  MANIFEST_TEST_PATH,
  RUNNER_PATH,
]);

function readExactC2(relativePath) {
  if (
    typeof relativePath !== "string" ||
    path.isAbsolute(relativePath) ||
    relativePath.split("/").includes("..") ||
    !READ_ALLOWLIST_SET.has(relativePath)
  ) {
    const error = new Error("C2_1_READ_NOT_ALLOWED");
    error.code = "C2_1_READ_NOT_ALLOWED";
    throw error;
  }
  const absolutePath = path.resolve(REPOSITORY_ROOT, relativePath);
  if (
    absolutePath === REPOSITORY_ROOT ||
    !absolutePath.startsWith(REPOSITORY_ROOT + path.sep)
  ) {
    const error = new Error("C2_1_READ_OUTSIDE_ROOT");
    error.code = "C2_1_READ_OUTSIDE_ROOT";
    throw error;
  }
  const metadata = lstatSync(absolutePath);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    const error = new Error("C2_1_READ_NOT_REGULAR");
    error.code = "C2_1_READ_NOT_REGULAR";
    throw error;
  }
  if (realpathSync(absolutePath) !== absolutePath) {
    const error = new Error("C2_1_READ_RESOLUTION_MISMATCH");
    error.code = "C2_1_READ_RESOLUTION_MISMATCH";
    throw error;
  }
  const bytes = readFileSync(absolutePath);
  READ_COUNTS.set(relativePath, (READ_COUNTS.get(relativePath) ?? 0) + 1);
  return bytes;
}

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

function strictJson(bytes) {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  let cursor = 0;
  const whitespace = () => {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
  };
  const stringValue = () => {
    const start = cursor;
    if (source[cursor] !== '"') throw new Error("STRICT_JSON_SYNTAX");
    cursor += 1;
    while (cursor < source.length) {
      const character = source[cursor];
      if (character === '"') {
        cursor += 1;
        return JSON.parse(source.slice(start, cursor));
      }
      if (character === "\\") {
        cursor += 1;
        if (source[cursor] === "u") cursor += 4;
      }
      cursor += 1;
    }
    throw new Error("STRICT_JSON_SYNTAX");
  };
  const value = () => {
    whitespace();
    if (source[cursor] === "{") {
      cursor += 1;
      const result = {};
      const keys = new Set();
      whitespace();
      if (source[cursor] === "}") {
        cursor += 1;
        return result;
      }
      while (cursor < source.length) {
        const key = stringValue();
        if (keys.has(key)) {
          const error = new Error("STRICT_JSON_DUPLICATE_KEY");
          error.code = "STRICT_JSON_DUPLICATE_KEY";
          throw error;
        }
        keys.add(key);
        whitespace();
        if (source[cursor] !== ":") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
        result[key] = value();
        whitespace();
        if (source[cursor] === "}") {
          cursor += 1;
          return result;
        }
        if (source[cursor] !== ",") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
        whitespace();
      }
      throw new Error("STRICT_JSON_SYNTAX");
    }
    if (source[cursor] === "[") {
      cursor += 1;
      const result = [];
      whitespace();
      if (source[cursor] === "]") {
        cursor += 1;
        return result;
      }
      while (cursor < source.length) {
        result.push(value());
        whitespace();
        if (source[cursor] === "]") {
          cursor += 1;
          return result;
        }
        if (source[cursor] !== ",") throw new Error("STRICT_JSON_SYNTAX");
        cursor += 1;
      }
      throw new Error("STRICT_JSON_SYNTAX");
    }
    if (source[cursor] === '"') return stringValue();
    for (const [token, parsed] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ]) {
      if (source.startsWith(token, cursor)) {
        cursor += token.length;
        return parsed;
      }
    }
    const numberMatch = source.slice(cursor).match(
      /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/,
    );
    if (!numberMatch) throw new Error("STRICT_JSON_SYNTAX");
    cursor += numberMatch[0].length;
    return Number(numberMatch[0]);
  };
  const result = value();
  whitespace();
  if (cursor !== source.length) throw new Error("STRICT_JSON_TRAILING_DATA");
  return result;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function canonicalText(value) {
  return JSON.stringify(canonical(value), null, 2) + "\n";
}

function exactKeys(value, expected) {
  assert(value && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hasExport(node) {
  return Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
}

function nameOf(node) {
  return node && ts.isIdentifier(node) ? node.text : null;
}

function parseRouteSource(routePath, bytes) {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const sourceFile = ts.createSourceFile(
    routePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert.equal(sourceFile.parseDiagnostics.length, 0);
  return { source, sourceFile };
}

function bindingCatalog(sourceFile) {
  const imports = new Set();
  const locals = new Map();
  const remember = (name, node) => {
    if (!name) return;
    const candidates = locals.get(name) ?? [];
    candidates.push(node);
    locals.set(name, candidates);
  };
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.name) {
        imports.add(statement.importClause.name.text);
      }
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) {
        imports.add(bindings.name.text);
      } else if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) imports.add(element.name.text);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      remember(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        remember(nameOf(declaration.name), declaration.initializer);
      }
    }
  }
  return { imports, locals };
}

function oneLocal(name, locals) {
  const candidates = locals.get(name) ?? [];
  assert.equal(candidates.length, 1);
  return candidates[0];
}

function localImplementation(node) {
  if (ts.isFunctionDeclaration(node)) {
    return ["LOCAL_EXPORT_ALIAS", "LOCAL_FUNCTION_DECLARATION", node];
  }
  if (ts.isArrowFunction(node)) {
    return ["LOCAL_EXPORT_ALIAS", "LOCAL_ARROW_FUNCTION", node];
  }
  if (ts.isFunctionExpression(node)) {
    return ["LOCAL_EXPORT_ALIAS", "LOCAL_FUNCTION_EXPRESSION", node];
  }
  return null;
}

function resolveLocalAlias(name, catalog, visited = new Set()) {
  if (catalog.imports.has(name)) {
    return [
      "OPAQUE_IMPORTED_BINDING",
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      null,
    ];
  }
  assert(!visited.has(name));
  visited.add(name);
  const initializer = oneLocal(name, catalog.locals);
  const direct = localImplementation(initializer);
  if (direct) return direct;
  if (ts.isIdentifier(initializer)) {
    return resolveLocalAlias(initializer.text, catalog, visited);
  }
  if (ts.isCallExpression(initializer)) {
    return [
      "OPAQUE_IMPORTED_FACTORY_CALL",
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      null,
    ];
  }
  assert.fail("ORACLE_ALIAS_RESOLUTION");
}

function inlineImplementations(call, catalog) {
  const found = [];
  const visit = (node) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      found.push(node);
      return;
    }
    ts.forEachChild(node, visit);
  };
  for (const argument of call.arguments) visit(argument);
  if (
    found.length === 0 &&
    ts.isIdentifier(call.expression) &&
    !catalog.imports.has(call.expression.text)
  ) {
    const candidates = catalog.locals.get(call.expression.text) ?? [];
    assert(candidates.length <= 1);
    const localFactory = candidates[0];
    if (
      ts.isFunctionDeclaration(localFactory) ||
      ts.isArrowFunction(localFactory) ||
      ts.isFunctionExpression(localFactory)
    ) {
      ts.forEachChild(localFactory, visit);
    }
  }
  return found;
}

function resolveExportInitializer(initializer, catalog) {
  if (ts.isArrowFunction(initializer)) {
    return ["CONST_ARROW", "LOCAL_ARROW_FUNCTION", initializer];
  }
  if (ts.isFunctionExpression(initializer)) {
    return ["CONST_FUNCTION", "LOCAL_FUNCTION_EXPRESSION", initializer];
  }
  if (ts.isIdentifier(initializer)) {
    return resolveLocalAlias(initializer.text, catalog);
  }
  if (ts.isPropertyAccessExpression(initializer)) {
    const owner = nameOf(initializer.expression);
    if (owner && !catalog.imports.has(owner)) {
      const ownerInitializer = oneLocal(owner, catalog.locals);
      if (ts.isCallExpression(ownerInitializer)) {
        return [
          "OPAQUE_IMPORTED_FACTORY_MEMBER",
          "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
          null,
        ];
      }
    }
    return [
      "OPAQUE_IMPORTED_BINDING",
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      null,
    ];
  }
  if (ts.isCallExpression(initializer)) {
    const inline = inlineImplementations(initializer, catalog);
    if (inline.length === 1) {
      return ["WRAPPER_INLINE_CALLBACK", "LOCAL_WRAPPER_CALLBACK", inline[0]];
    }
    return [
      "OPAQUE_IMPORTED_FACTORY_CALL",
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
      null,
    ];
  }
  assert.fail("ORACLE_EXPORTED_INITIALIZER");
}

function exportedImplementations(sourceFile) {
  const catalog = bindingCatalog(sourceFile);
  const found = new Map();
  const add = (httpMethod, resolved) => {
    if (!HTTP_METHODS.includes(httpMethod)) return;
    assert(!found.has(httpMethod));
    found.set(httpMethod, {
      http_method: httpMethod,
      export_form: resolved[0],
      implementation_kind: resolved[1],
      root: resolved[2],
    });
  };
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      hasExport(statement)
    ) {
      add(statement.name.text, [
        "FUNCTION_DECLARATION",
        "LOCAL_FUNCTION_DECLARATION",
        statement,
      ]);
    } else if (ts.isVariableStatement(statement) && hasExport(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const httpMethod = nameOf(declaration.name);
        if (
          httpMethod &&
          HTTP_METHODS.includes(httpMethod) &&
          declaration.initializer
        ) {
          add(
            httpMethod,
            resolveExportInitializer(declaration.initializer, catalog),
          );
        }
      }
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        const httpMethod = element.name.text;
        if (!HTTP_METHODS.includes(httpMethod)) continue;
        if (statement.moduleSpecifier) {
          add(httpMethod, [
            "OPAQUE_REEXPORT_FROM",
            "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
            null,
          ]);
        } else {
          const resolved = resolveLocalAlias(
            element.propertyName?.text ?? element.name.text,
            catalog,
          );
          add(httpMethod, [
            resolved[0] === "OPAQUE_IMPORTED_BINDING"
              ? resolved[0]
              : "LOCAL_EXPORT_ALIAS",
            resolved[1],
            resolved[2],
          ]);
        }
      }
    }
  }
  return {
    catalog,
    methods: HTTP_METHODS.filter((method) => found.has(method)).map(
      (method) => found.get(method),
    ),
  };
}

function normalizeImport(routePath, specifier) {
  const components = specifier.startsWith("@/")
    ? []
    : routePath.split("/").slice(0, -1);
  const incoming = specifier.startsWith("@/")
    ? specifier.slice(2).split("/")
    : specifier.split("/");
  for (const component of incoming) {
    if (component === "" || component === ".") continue;
    if (component === "..") {
      assert(components.length > 0);
      components.pop();
    } else {
      components.push(component);
    }
  }
  const base = components.join("/");
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + "/index.ts",
    base + "/index.tsx",
  ];
  const matches = [...new Set(candidates)].filter((candidate) =>
    HELPER_PATHS.includes(candidate)
  );
  assert.equal(matches.length, 1);
  return matches[0];
}

function importOracle(routePath, sourceFile) {
  const tuples = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !(
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)
      ) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteralLike(statement.moduleSpecifier)
    ) continue;
    const specifier = statement.moduleSpecifier.text;
    let kind;
    let target;
    if (
      specifier.startsWith("./") ||
      specifier.startsWith("../") ||
      specifier.startsWith("@/")
    ) {
      kind = "LOCAL_UNREAD";
      target = normalizeImport(routePath, specifier);
    } else if (specifier === "crypto" || specifier === "zlib") {
      kind = "BUILTIN_UNREAD";
      target = specifier;
    } else {
      assert(["server-only", "next/server"].includes(specifier));
      kind = "EXTERNAL_UNREAD";
      target = specifier;
    }
    const tuple = [routePath, specifier, kind, target].join("\0");
    tuples.set(tuple, {
      import_boundary_id: shaFields(
        "AIFINDER_C2_1_IMPORT_V1",
        routePath,
        specifier,
        kind,
        target,
      ),
      route_path: routePath,
      raw_specifier: specifier,
      boundary_kind: kind,
      resolved_target_or_external: target,
      content_state: "UNREAD_FOR_C2_1_SEMANTICS",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
    });
  }
  return [...tuples.values()].sort(
    (left, right) =>
      compareText(left.route_path, right.route_path) ||
      compareText(left.raw_specifier, right.raw_specifier) ||
      compareText(left.import_boundary_id, right.import_boundary_id),
  );
}

function localRoots(sourceFile, exported) {
  const names = new Map();
  const remember = (name, root) => {
    if (!name || !root) return;
    const values = names.get(name) ?? [];
    values.push(root);
    names.set(name, values);
  };
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      remember(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer)
        ) remember(nameOf(declaration.name), declaration.initializer);
      }
    }
  }
  const roots = new Set();
  for (const values of names.values()) if (values.length === 1) roots.add(values[0]);
  for (const method of exported) if (method.root) roots.add(method.root);
  return { names, roots: [...roots] };
}

function callsByRoot(roots, names) {
  const graph = new Map(roots.map((root) => [root, new Set()]));
  const rootSet = new Set(roots);
  for (const root of roots) {
    const visit = (node) => {
      if (node !== root && rootSet.has(node)) return;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const candidates = names.get(node.expression.text) ?? [];
        assert(candidates.length <= 1);
        if (candidates.length === 1) graph.get(root).add(candidates[0]);
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
  }
  return graph;
}

function transitiveRoots(root, graph) {
  const reached = new Set();
  const stack = root ? [root] : [];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const target of graph.get(current) ?? []) {
      if (target !== root && !reached.has(target)) {
        reached.add(target);
        stack.push(target);
      }
    }
  }
  return reached;
}

function semanticNodes(sourceFile, source) {
  const nodes = [];
  const visit = (node) => {
    if (ts.isIfStatement(node) || ts.isCatchClause(node)) {
      const start = node.getStart(sourceFile, false);
      const location = sourceFile.getLineAndCharacterOfPosition(start);
      nodes.push({
        ast: node,
        kind: ts.isIfStatement(node) ? "IF" : "CATCH",
        catch_binding: ts.isCatchClause(node)
          ? node.variableDeclaration
            ? "PARAMETERIZED"
            : "OPTIONAL"
          : "NOT_APPLICABLE",
        start_utf16: start,
        end_utf16: node.end,
        start_line_1_based: location.line + 1,
        start_column_1_based: location.character + 1,
        source_span_sha256: sha256(source.slice(start, node.end)),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return nodes.sort(
    (left, right) =>
      left.start_utf16 - right.start_utf16 ||
      left.end_utf16 - right.end_utf16 ||
      (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
  );
}

function smallestContainingRoot(node, roots, sourceFile) {
  const candidates = roots.filter(
    (root) =>
      root.getStart(sourceFile, false) <= node.start_utf16 &&
      root.end >= node.end_utf16,
  );
  candidates.sort(
    (left, right) =>
      left.end - left.getStart(sourceFile, false) -
      (right.end - right.getStart(sourceFile, false)),
  );
  return candidates[0] ?? null;
}

function oracleRoute(routePath, bytes, evidence) {
  const { source, sourceFile } = parseRouteSource(routePath, bytes);
  const routeSha = sha256(bytes);
  const routeBlob = gitBlob(bytes);
  assert.equal(routeSha, evidence.sha256);
  assert.equal(routeBlob, evidence.git_object_identity);
  const discovered = exportedImplementations(sourceFile).methods;
  assert.deepEqual(
    discovered.map((method) => method.http_method),
    evidence.exported_methods,
  );
  const boundaries = importOracle(routePath, sourceFile);
  const boundaryIds = boundaries.map((boundary) => boundary.import_boundary_id);
  const methods = discovered.map((method) => {
    const opaque =
      method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD";
    return {
      method_id: shaFields(
        "AIFINDER_C2_1_METHOD_V1",
        routePath,
        routeBlob,
        method.http_method,
        method.export_form,
        method.implementation_kind,
      ),
      route_path: routePath,
      http_method: method.http_method,
      export_form: method.export_form,
      implementation_kind: method.implementation_kind,
      direct_node_ids: [],
      reachable_local_helper_node_ids: [],
      import_boundary_ids: boundaryIds,
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
      root: method.root,
    };
  });
  const rootsResult = localRoots(sourceFile, discovered);
  const graph = callsByRoot(rootsResult.roots, rootsResult.names);
  const reachable = new Map(
    methods.map((method) => [method.method_id, transitiveRoots(method.root, graph)]),
  );
  const nodes = semanticNodes(sourceFile, source).map((node) => {
    const root = smallestContainingRoot(node, rootsResult.roots, sourceFile);
    const candidates = methods
      .filter(
        (method) =>
          method.root &&
          (method.root === root || reachable.get(method.method_id).has(root)),
      )
      .map((method) => method.method_id)
      .sort(compareText);
    const nodeId = shaFields(
      "AIFINDER_C2_1_NODE_V1",
      routePath,
      routeBlob,
      node.kind,
      String(node.start_utf16),
      String(node.end_utf16),
      node.source_span_sha256,
    );
    const outcomeKinds = node.kind === "IF"
      ? ["IF_TRUE", "IF_FALSE_OR_FALLTHROUGH"]
      : ["CATCH_ENTERED"];
    return {
      node_id: nodeId,
      route_path: routePath,
      route_sha256: routeSha,
      kind: node.kind,
      catch_binding: node.catch_binding,
      start_utf16: node.start_utf16,
      end_utf16: node.end_utf16,
      start_line_1_based: node.start_line_1_based,
      start_column_1_based: node.start_column_1_based,
      source_span_sha256: node.source_span_sha256,
      ownership_state: candidates.length === 0
        ? "UNATTRIBUTED"
        : candidates.length === 1
          ? "UNIQUE"
          : "SHARED",
      candidate_exported_method_ids: candidates,
      outcome_ids: outcomeKinds.map((kind) =>
        shaFields("AIFINDER_C2_1_OUTCOME_V1", nodeId, kind)
      ),
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      next_evidence_classes: ["MANUAL_STATIC_REVIEW_REQUIRED"],
      reason_codes: ["LOCAL_NODE_REQUIRES_MANUAL_REVIEW"],
      root,
      outcomeKinds,
    };
  });
  for (const method of methods) {
    method.direct_node_ids = nodes
      .filter((node) => node.root === method.root)
      .map((node) => node.node_id);
    method.reachable_local_helper_node_ids = nodes
      .filter(
        (node) =>
          node.root &&
          node.root !== method.root &&
          reachable.get(method.method_id).has(node.root),
      )
      .map((node) => node.node_id);
  }
  const outcomes = nodes.flatMap((node) =>
    node.outcomeKinds.map((outcomeKind, index) => ({
      outcome_id: node.outcome_ids[index],
      node_id: node.node_id,
      route_path: routePath,
      outcome_kind: outcomeKind,
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      next_evidence_classes: ["MANUAL_STATIC_REVIEW_REQUIRED"],
      reason_codes: ["LOCAL_NODE_REQUIRES_MANUAL_REVIEW"],
    }))
  );
  return {
    route: {
      route_path: routePath,
      git_blob: routeBlob,
      sha256: routeSha,
      bytes: bytes.length,
      lf_lines: [...bytes].filter((byte) => byte === 0x0a).length,
      observed_status: evidence.observed_status,
      exported_method_ids: methods.map((method) => method.method_id),
      if_count: nodes.filter((node) => node.kind === "IF").length,
      catch_bound_count: nodes.filter(
        (node) => node.catch_binding === "PARAMETERIZED",
      ).length,
      catch_optional_count: nodes.filter(
        (node) => node.catch_binding === "OPTIONAL",
      ).length,
      catch_total: nodes.filter((node) => node.kind === "CATCH").length,
      node_ids: nodes.map((node) => node.node_id),
      import_boundary_ids: boundaryIds,
      structure_state: "QUALIFIED_OFFLINE",
      behavior_state: "NOT_RUNTIME_QUALIFIED",
      launch_blocking: true,
    },
    methods: methods.map(({ root, ...method }) => method),
    nodes: nodes.map(({ root, outcomeKinds, ...node }) => node),
    outcomes,
    boundaries,
  };
}

let negativeCaught = null;
try {
  readExactC2("lib/admin-auth.ts");
} catch (caught) {
  negativeCaught = caught;
}
assert.equal(negativeCaught?.code, "C2_1_READ_NOT_ALLOWED");
assert.equal(READ_COUNTS.size, 0);

const FILE_BYTES = new Map(
  READ_ALLOWLIST.map((repositoryPath) => [
    repositoryPath,
    readExactC2(repositoryPath),
  ]),
);
assert.equal(READ_COUNTS.size, 39);
assert(
  READ_ALLOWLIST.every(
    (repositoryPath) => READ_COUNTS.get(repositoryPath) === 1,
  ),
);

const ledgerBytes = FILE_BYTES.get(LEDGER_PATH);
const schemaBytes = FILE_BYTES.get(SCHEMA_PATH);
const partialEvidence = strictJson(FILE_BYTES.get(PARTIAL_EVIDENCE_PATH));
const matrix = strictJson(FILE_BYTES.get(MATRIX_PATH));
const blockerRegistry = strictJson(FILE_BYTES.get(BLOCKER_PATH));
const ledger = strictJson(ledgerBytes);
const schema = strictJson(schemaBytes);
const manifest = strictJson(FILE_BYTES.get(MANIFEST_PATH));
const evidenceByPath = new Map(
  partialEvidence.routes.map((route) => [route.baseline_path, route]),
);
assert.deepEqual(
  partialEvidence.routes.map((route) => route.baseline_path),
  ROUTE_PATHS,
);

const oracleRoutes = ROUTE_PATHS.map((routePath) =>
  oracleRoute(routePath, FILE_BYTES.get(routePath), evidenceByPath.get(routePath))
).sort((left, right) => compareText(left.route.route_path, right.route.route_path));
const expectedRoutes = oracleRoutes.map((entry) => entry.route);
const expectedMethods = oracleRoutes
  .flatMap((entry) => entry.methods)
  .sort(
    (left, right) =>
      compareText(left.route_path, right.route_path) ||
      HTTP_METHODS.indexOf(left.http_method) -
        HTTP_METHODS.indexOf(right.http_method) ||
      compareText(left.method_id, right.method_id),
  );
const expectedNodes = oracleRoutes
  .flatMap((entry) => entry.nodes)
  .sort(
    (left, right) =>
      compareText(left.route_path, right.route_path) ||
      left.start_utf16 - right.start_utf16 ||
      left.end_utf16 - right.end_utf16 ||
      (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
  );
const outcomeOracle = new Map(
  oracleRoutes
    .flatMap((entry) => entry.outcomes)
    .map((outcome) => [outcome.outcome_id, outcome]),
);
const expectedOutcomes = expectedNodes.flatMap((node) =>
  node.outcome_ids.map((outcomeId) => outcomeOracle.get(outcomeId))
);
const expectedBoundaries = oracleRoutes
  .flatMap((entry) => entry.boundaries)
  .sort(
    (left, right) =>
      compareText(left.route_path, right.route_path) ||
      compareText(left.raw_specifier, right.raw_specifier) ||
      compareText(left.import_boundary_id, right.import_boundary_id),
  );

function routeContractDigest() {
  return sha256(
    [...partialEvidence.routes]
      .sort((left, right) => compareText(left.baseline_path, right.baseline_path))
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
      .join(""),
  );
}

function requestDigestFromEvidence() {
  return sha256(
    [...partialEvidence.request_positions]
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
      .join(""),
  );
}

function requestDigestFromLedger(candidate) {
  return sha256(
    candidate.request_positions.map((position) =>
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
    ).join(""),
  );
}

function nodeSetDigest(candidate = ledger) {
  return sha256(
    candidate.nodes.map((node) =>
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
    ).join(""),
  );
}

function pathSetDigest(repositoryPaths) {
  return sha256(
    repositoryPaths.map((repositoryPath) => {
      const bytes = FILE_BYTES.get(repositoryPath);
      return [repositoryPath, sha256(bytes), bytes.length].join("\0");
    }).join("\n"),
  );
}

const TOP_KEYS = [
  "schema_version",
  "phase",
  "artifact_purpose",
  "repository_baseline",
  "source_contract",
  "algorithm_contract",
  "summary",
  "routes",
  "methods",
  "nodes",
  "outcomes",
  "import_boundaries",
  "request_positions",
  "governance",
];
const ROUTE_KEYS = [
  "route_path",
  "git_blob",
  "sha256",
  "bytes",
  "lf_lines",
  "observed_status",
  "exported_method_ids",
  "if_count",
  "catch_bound_count",
  "catch_optional_count",
  "catch_total",
  "node_ids",
  "import_boundary_ids",
  "structure_state",
  "behavior_state",
  "launch_blocking",
];
const METHOD_KEYS = [
  "method_id",
  "route_path",
  "http_method",
  "export_form",
  "implementation_kind",
  "direct_node_ids",
  "reachable_local_helper_node_ids",
  "import_boundary_ids",
  "structure_state",
  "behavior_state",
  "next_authorities",
  "reason_codes",
];
const NODE_KEYS = [
  "node_id",
  "route_path",
  "route_sha256",
  "kind",
  "catch_binding",
  "start_utf16",
  "end_utf16",
  "start_line_1_based",
  "start_column_1_based",
  "source_span_sha256",
  "ownership_state",
  "candidate_exported_method_ids",
  "outcome_ids",
  "structure_state",
  "behavior_state",
  "next_evidence_classes",
  "reason_codes",
];
const OUTCOME_KEYS = [
  "outcome_id",
  "node_id",
  "route_path",
  "outcome_kind",
  "structure_state",
  "behavior_state",
  "next_evidence_classes",
  "reason_codes",
];
const IMPORT_KEYS = [
  "import_boundary_id",
  "route_path",
  "raw_specifier",
  "boundary_kind",
  "resolved_target_or_external",
  "content_state",
  "behavior_state",
];
const REQUEST_KEYS = [
  "sequence",
  "case_id",
  "route_file",
  "method",
  "path_template",
  "status",
  "pair_position",
  "pre_post_equal",
  "source_visible_branch_category",
  "evidence_identity",
  "node_ids",
  "binding_state",
];

function strictShape(candidate) {
  exactKeys(candidate, TOP_KEYS);
  candidate.routes.forEach((route) => exactKeys(route, ROUTE_KEYS));
  candidate.methods.forEach((method) => exactKeys(method, METHOD_KEYS));
  candidate.nodes.forEach((node) => exactKeys(node, NODE_KEYS));
  candidate.outcomes.forEach((outcome) => exactKeys(outcome, OUTCOME_KEYS));
  candidate.import_boundaries.forEach((boundary) =>
    exactKeys(boundary, IMPORT_KEYS)
  );
  candidate.request_positions.forEach((position) =>
    exactKeys(position, REQUEST_KEYS)
  );
  for (const position of candidate.request_positions) {
    assert(Number.isInteger(position.status));
    assert(position.status >= 100 && position.status <= 599);
  }
  for (const route of candidate.routes) {
    assert.equal(route.structure_state, "QUALIFIED_OFFLINE");
    assert.equal(route.behavior_state, "NOT_RUNTIME_QUALIFIED");
  }
  for (const node of candidate.nodes) {
    assert(["IF", "CATCH"].includes(node.kind));
    assert(["UNIQUE", "SHARED", "UNATTRIBUTED"].includes(node.ownership_state));
    assert.equal(node.structure_state, "QUALIFIED_OFFLINE");
    assert.equal(node.behavior_state, "NOT_RUNTIME_QUALIFIED");
  }
  for (const outcome of candidate.outcomes) {
    assert(
      ["IF_TRUE", "IF_FALSE_OR_FALLTHROUGH", "CATCH_ENTERED"].includes(
        outcome.outcome_kind,
      ),
    );
  }
  for (const boundary of candidate.import_boundaries) {
    assert(
      ["LOCAL_UNREAD", "EXTERNAL_UNREAD", "BUILTIN_UNREAD"].includes(
        boundary.boundary_kind,
      ),
    );
    assert.equal(boundary.content_state, "UNREAD_FOR_C2_1_SEMANTICS");
  }
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

function validateSchemaInstance(contract, value) {
  if (contract.$ref) {
    const prefix = "#/$defs/";
    assert(contract.$ref.startsWith(prefix));
    const definition = schema.$defs[contract.$ref.slice(prefix.length)];
    assert(definition);
    validateSchemaInstance(definition, value);
    return;
  }
  if (Object.hasOwn(contract, "const")) assert.deepEqual(value, contract.const);
  if (contract.enum) {
    assert(contract.enum.some((candidate) => {
      try {
        assert.deepEqual(value, candidate);
        return true;
      } catch {
        return false;
      }
    }));
  }
  if (contract.type) {
    const expectedTypes = Array.isArray(contract.type)
      ? contract.type
      : [contract.type];
    assert(expectedTypes.some((type) => schemaTypeMatches(value, type)));
  }
  if (typeof value === "string") {
    if (contract.minLength !== undefined) {
      assert(value.length >= contract.minLength);
    }
    if (contract.pattern !== undefined) assert(new RegExp(contract.pattern).test(value));
  }
  if (typeof value === "number") {
    if (contract.minimum !== undefined) assert(value >= contract.minimum);
    if (contract.maximum !== undefined) assert(value <= contract.maximum);
  }
  if (Array.isArray(value)) {
    if (contract.minItems !== undefined) assert(value.length >= contract.minItems);
    if (contract.maxItems !== undefined) assert(value.length <= contract.maxItems);
    if (contract.uniqueItems) {
      assert.equal(
        new Set(value.map((item) => JSON.stringify(item))).size,
        value.length,
      );
    }
    if (contract.items) {
      value.forEach((item) => validateSchemaInstance(contract.items, item));
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = contract.properties ?? {};
    for (const requiredKey of contract.required ?? []) {
      assert(Object.hasOwn(value, requiredKey));
    }
    if (contract.additionalProperties === false) {
      assert(Object.keys(value).every((key) => Object.hasOwn(properties, key)));
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) validateSchemaInstance(properties[key], child);
    }
  }
}

const assertions = [
  ["L01_STRICT_JSON_DUPLICATE_KEYS", () => {
    assert.equal(strictJson(ledgerBytes).schema_version, ledger.schema_version);
  }],
  ["L02_DRAFT_2020_12_SCHEMA_AND_NO_UNKNOWN_KEYS", () => {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    const visitSchema = (value) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") assert.equal(value.additionalProperties, false);
      Object.values(value).forEach(visitSchema);
    };
    visitSchema(schema);
    assert.deepEqual(
      schema.$defs.request_position.properties.status,
      { type: "integer", minimum: 100, maximum: 599 },
    );
    validateSchemaInstance(schema, ledger);
    strictShape(ledger);
    assert.equal(canonicalText(ledger), ledgerBytes.toString("utf8"));
  }],
  ["L03_PHASE_BASELINE_AND_ALGORITHM_CONTRACT", () => {
    assert.equal(ledger.schema_version, "AIFINDER_C2_1_SEMANTIC_BRANCH_LEDGER_V1");
    assert.equal(ledger.phase, "33HA-33HZ");
    assert.deepEqual(ledger.repository_baseline, {
      repository: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      commit: "bb135e0dc5bfa31b4d5542cca855541014374e44",
      parent: "c4fa8e9afc66d58e0b68855fd49bd92c0c18b6c9",
      tree: "768055aed4e67e083e61bc12bb52f850311039e6",
      subject: "Restore additive static readiness safeguards",
    });
    assert.deepEqual(ledger.algorithm_contract, {
      analyzer_version: "AIFINDER_C2_1_ANALYZER_V1",
      typescript_version: "5.9.3",
      canonical_json_version: "RECURSIVE_LEXICOGRAPHIC_KEYS_V1",
      node_id_version: "AIFINDER_C2_1_NODE_V1",
      method_id_version: "AIFINDER_C2_1_METHOD_V1",
      outcome_id_version: "AIFINDER_C2_1_OUTCOME_V1",
      import_id_version: "AIFINDER_C2_1_IMPORT_V1",
      ownership_version: "LEXICAL_FIXED_POINT_V1",
      helper_semantics: "UNREAD_FOR_C2_1",
    });
  }],
  ["L04_ROUTE_CONTRACT_AND_DIGEST", () => {
    assert.equal(
      routeContractDigest(),
      "d6dddd950dd1f463106f3cc3aca3c659f5106ec22023c8c31d3e1aefe41fd6a9",
    );
    assert.equal(ledger.source_contract.route_contract_digest, routeContractDigest());
    assert.deepEqual(ledger.routes, expectedRoutes);
  }],
  ["L05_METHOD_SET_AND_IDENTITIES", () => {
    assert.deepEqual(ledger.methods, expectedMethods);
  }],
  ["L06_INDEPENDENT_NODE_SET", () => {
    assert.deepEqual(ledger.nodes, expectedNodes);
  }],
  ["L07_OUTCOME_SET_775", () => {
    assert.equal(ledger.outcomes.length, 775);
    assert.deepEqual(ledger.outcomes, expectedOutcomes);
  }],
  ["L08_IDENTITY_FORMULAS", () => {
    for (const method of ledger.methods) {
      const route = ledger.routes.find((entry) => entry.route_path === method.route_path);
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
    for (const node of ledger.nodes) {
      const route = ledger.routes.find((entry) => entry.route_path === node.route_path);
      assert.equal(
        node.node_id,
        shaFields(
          "AIFINDER_C2_1_NODE_V1",
          node.route_path,
          route.git_blob,
          node.kind,
          String(node.start_utf16),
          String(node.end_utf16),
          node.source_span_sha256,
        ),
      );
    }
  }],
  ["L09_CANONICAL_ORDER", () => {
    assert.deepEqual(ledger.routes, [...ledger.routes].sort((left, right) =>
      compareText(left.route_path, right.route_path)
    ));
    assert.deepEqual(ledger.nodes, expectedNodes);
    assert.deepEqual(ledger.outcomes, expectedOutcomes);
  }],
  ["L10_IF_AND_CATCH_KIND_COUNTS", () => {
    assert.equal(ledger.nodes.filter((node) => node.kind === "IF").length, 366);
    assert.equal(
      ledger.nodes.filter((node) => node.catch_binding === "PARAMETERIZED").length,
      31,
    );
    assert.equal(
      ledger.nodes.filter((node) => node.catch_binding === "OPTIONAL").length,
      12,
    );
  }],
  ["L11_INDEPENDENT_OWNERSHIP", () => {
    assert.deepEqual(
      ledger.nodes.map((node) => [
        node.node_id,
        node.ownership_state,
        node.candidate_exported_method_ids,
      ]),
      expectedNodes.map((node) => [
        node.node_id,
        node.ownership_state,
        node.candidate_exported_method_ids,
      ]),
    );
    assert.deepEqual(
      ledger.methods.map((method) => [
        method.method_id,
        method.direct_node_ids,
        method.reachable_local_helper_node_ids,
      ]),
      expectedMethods.map((method) => [
        method.method_id,
        method.direct_node_ids,
        method.reachable_local_helper_node_ids,
      ]),
    );
  }],
  ["L12_IMPORT_BOUNDARY_SET", () => {
    assert.equal(ledger.import_boundaries.length, 150);
    assert.deepEqual(ledger.import_boundaries, expectedBoundaries);
  }],
  ["L13_WRAPPER_METHODS_OPAQUE", () => {
    const opaque = ledger.methods.filter(
      (method) =>
        method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
    );
    assert.equal(opaque.length, 15);
    assert.deepEqual(
      [...new Set(opaque.map((method) => method.route_path))].sort(),
      [
        "app/api/admin/audit-logs/route.ts",
        "app/api/admin/discovery/candidate-extraction/invoke/route.ts",
        "app/api/admin/discovery/candidate-staging-queue/route.ts",
        "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts",
        "app/api/admin/logout/route.ts",
        "app/api/admin/submissions/route.ts",
        "app/api/admin/tools/route.ts",
        "app/api/admin/upload-logo/route.ts",
      ].sort(),
    );
  }],
  ["L14_FUTURE_CLASS_ENUM_AND_REASONS", () => {
    for (const method of ledger.methods) {
      const opaque =
        method.implementation_kind === "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD";
      assert.deepEqual(method.next_authorities, [
        opaque
          ? "FRESH_EXACT_HELPER_READ_SCOPE_REQUIRED"
          : "MANUAL_STATIC_REVIEW_REQUIRED",
      ]);
      assert.deepEqual(method.reason_codes, [
        opaque
          ? "IMPORTED_IMPLEMENTATION_UNREAD"
          : "LOCAL_NODE_REQUIRES_MANUAL_REVIEW",
      ]);
    }
    assert(
      [...ledger.nodes, ...ledger.outcomes].every(
        (entry) =>
          JSON.stringify(entry.next_evidence_classes) ===
            '["MANUAL_STATIC_REVIEW_REQUIRED"]' &&
          JSON.stringify(entry.reason_codes) ===
            '["LOCAL_NODE_REQUIRES_MANUAL_REVIEW"]',
      ),
    );
  }],
  ["L15_RUNTIME_QUALIFIED_ZERO", () => {
    assert.equal(ledger.summary.runtime_qualified_nodes, 0);
    assert(
      [...ledger.routes, ...ledger.methods, ...ledger.nodes, ...ledger.outcomes]
        .every((entry) => entry.behavior_state === "NOT_RUNTIME_QUALIFIED"),
    );
  }],
  ["L16_OBSERVED_UNOBSERVED_15_13", () => {
    assert.equal(
      ledger.routes.filter(
        (route) => route.observed_status === "OBSERVED_PARTIAL_FILE_LEVEL_ONLY",
      ).length,
      15,
    );
    assert.equal(
      ledger.routes.filter((route) => route.observed_status === "UNOBSERVED").length,
      13,
    );
  }],
  ["L17_CASES_23_POSITIONS_27_AND_DIGEST", () => {
    assert.equal(ledger.request_positions.length, 27);
    assert.equal(new Set(ledger.request_positions.map((position) => position.case_id)).size, 23);
    assert.equal(requestDigestFromLedger(ledger), requestDigestFromEvidence());
    assert.equal(
      requestDigestFromLedger(ledger),
      "014caf9d9f4e3ada5824ed2025a77166f905ffdc02af9786a98ee26ec2627504",
    );
  }],
  ["L18_REQUEST_POSITION_NO_EXACT_NODE_CLAIM", () => {
    assert(
      ledger.request_positions.every(
        (position) =>
          position.node_ids.length === 0 &&
          position.binding_state ===
            "FILE_METHOD_CATEGORY_ONLY_NO_EXACT_NODE_CLAIM",
      ),
    );
  }],
  ["L19_LAUNCH_BLOCKERS_28", () => {
    assert.equal(ledger.routes.filter((route) => route.launch_blocking).length, 28);
    assert.equal(ledger.governance.launch_blocking_routes, 28);
    assert(matrix && blockerRegistry);
  }],
  ["L20_NO_GO_AND_EXECUTION_FALSE", () => {
    assert.equal(ledger.governance.execution_authorized, false);
    assert.equal(ledger.governance.public_launch, "NO_GO");
    assert.equal(ledger.summary.public_launch, "NO_GO");
    assert.equal(
      ledger.governance.overall_decision,
      "NO_GO_PENDING_SEPARATE_AUTHORITIES",
    );
  }],
  ["L21_PRIVACY_RAW_VALUES_ZERO", () => {
    const forbidden = new Set([
      "source",
      "source_text",
      "source_excerpt",
      "predicate",
      "body",
      "headers",
      "cookies",
      "environment",
      "runtime_url",
    ]);
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        assert(!forbidden.has(key));
        visit(child);
      }
    };
    visit(ledger);
  }],
  ["L22_PATH_SCOPE_NO_EXPANSION", () => {
    assert.deepEqual(ledger.source_contract.write_scope_create_paths, CREATE_PATHS);
    assert.deepEqual(ledger.source_contract.write_scope_modify_paths, MODIFY_PATHS);
  }],
  ["L23_MANIFEST_AND_RUNNER_CLASSIFICATIONS", () => {
    const entries = new Map(manifest.entries.map((entry) => [entry.path, entry]));
    const expected = new Map([
      [ANALYZER_PATH, ["SUPPORT", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY", null]],
      [ANALYZER_TEST_PATH, ["EXECUTABLE", "SAFE_STATIC_POLICY", "RUN_POLICY", ["node", ANALYZER_TEST_PATH]]],
      [SCHEMA_PATH, ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY", null]],
      [LEDGER_PATH, ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY", null]],
      [LEDGER_TEST_PATH, ["EXECUTABLE", "SAFE_STATIC_POLICY", "RUN_POLICY", ["node", LEDGER_TEST_PATH]]],
    ]);
    for (const [repositoryPath, contract] of expected) {
      const entry = entries.get(repositoryPath);
      assert.deepEqual(
        [entry?.role, entry?.safety_class, entry?.ci_disposition, entry?.command_argv],
        contract,
      );
    }
    const runnerSource = FILE_BYTES.get(RUNNER_PATH).toString("utf8");
    assert(runnerSource.includes("--c2-1-policy"));
    assert(runnerSource.includes(ANALYZER_TEST_PATH));
    assert(runnerSource.includes(LEDGER_TEST_PATH));
  }],
  ["L24_NODE_SET_LEDGER_AND_EXECUTION_DIGESTS", () => {
    assert(/^[0-9a-f]{64}$/.test(nodeSetDigest()));
    assert(/^[0-9a-f]{64}$/.test(sha256(ledgerBytes)));
    const c2Paths = [
      ANALYZER_PATH,
      ANALYZER_TEST_PATH,
      SCHEMA_PATH,
      LEDGER_PATH,
      LEDGER_TEST_PATH,
      MANIFEST_TEST_PATH,
      RUNNER_PATH,
    ];
    assert.equal(
      manifest.phase_c2_1_execution_surface_digest?.sha256,
      pathSetDigest(c2Paths),
    );
    assert.equal(manifest.phase_c2_1_execution_surface_digest?.path_count, 7);
    const runnerSource = FILE_BYTES.get(RUNNER_PATH).toString("utf8");
    assert(runnerSource.includes(sha256(FILE_BYTES.get(ANALYZER_TEST_PATH))));
    assert(runnerSource.includes(sha256(FILE_BYTES.get(LEDGER_TEST_PATH))));
  }],
];

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function containsRawKey(candidate) {
  const forbidden = new Set([
    "source",
    "source_text",
    "source_excerpt",
    "predicate",
    "body",
    "headers",
    "cookies",
    "environment",
    "runtime_url",
  ]);
  let found = false;
  const visit = (value) => {
    if (!value || typeof value !== "object" || found) return;
    for (const [key, child] of Object.entries(value)) {
      if (forbidden.has(key)) {
        found = true;
        return;
      }
      visit(child);
    }
  };
  visit(candidate);
  return found;
}

function hasUnknownNestedKey(candidate) {
  try {
    strictShape(candidate);
    return false;
  } catch {
    return true;
  }
}

function firstMutationFailure(candidate) {
  if (containsRawKey(candidate)) return "C2_1_LEDGER_PRIVACY";
  if (
    candidate.import_boundaries.some(
      (boundary) =>
        boundary.content_state !== "UNREAD_FOR_C2_1_SEMANTICS" ||
        boundary.behavior_state !== "NOT_RUNTIME_QUALIFIED",
    )
  ) return "C2_1_LEDGER_HELPER_OPACITY";
  if (
    [...candidate.routes, ...candidate.methods, ...candidate.nodes, ...candidate.outcomes]
      .some((entry) => entry.behavior_state === "RUNTIME_QUALIFIED") ||
    candidate.governance.execution_authorized !== false
  ) return "C2_1_LEDGER_AUTHORITY";
  if (hasUnknownNestedKey(candidate)) return "C2_1_LEDGER_SCHEMA";
  if (
    JSON.stringify(candidate.source_contract.write_scope_create_paths) !==
      JSON.stringify(CREATE_PATHS) ||
    JSON.stringify(candidate.source_contract.write_scope_modify_paths) !==
      JSON.stringify(MODIFY_PATHS)
  ) return "C2_1_LEDGER_PATH_EXPANSION";
  if (
    candidate.routes.length !== expectedRoutes.length ||
    candidate.routes.some(
      (route, index) => route.route_path !== expectedRoutes[index].route_path,
    )
  ) return "C2_1_LEDGER_ROUTE_CONTRACT_DIGEST";
  if (
    candidate.methods.length !== expectedMethods.length ||
    candidate.methods.some(
      (method, index) =>
        method.route_path !== expectedMethods[index].route_path ||
        method.http_method !== expectedMethods[index].http_method,
    )
  ) return "C2_1_LEDGER_METHOD_SET";
  if (candidate.nodes.length !== 409) return "C2_1_LEDGER_NODE_SET";
  const nodeIds = candidate.nodes.map((node) => node.node_id);
  if (new Set(nodeIds).size !== nodeIds.length) {
    return "C2_1_LEDGER_NODE_IDENTITY";
  }
  if (
    candidate.nodes.some(
      (node, index) => node.node_id !== expectedNodes[index].node_id,
    )
  ) {
    const sorted = [...candidate.nodes].sort(
      (left, right) =>
        compareText(left.route_path, right.route_path) ||
        left.start_utf16 - right.start_utf16 ||
        left.end_utf16 - right.end_utf16 ||
        (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
    );
    if (
      candidate.nodes.every(
        (node) => sorted.some((expected) => expected.node_id === node.node_id),
      )
    ) return "C2_1_LEDGER_NODE_ORDER";
    return "C2_1_LEDGER_NODE_SET";
  }
  if (
    candidate.nodes.filter((node) => node.kind === "IF").length !== 366 ||
    candidate.nodes.filter((node) => node.catch_binding === "PARAMETERIZED").length !== 31 ||
    candidate.nodes.filter((node) => node.catch_binding === "OPTIONAL").length !== 12
  ) return "C2_1_LEDGER_NODE_KIND_COUNTS";
  if (candidate.summary.nodes !== 409) return "C2_1_LEDGER_SUMMARY";
  if (requestDigestFromLedger(candidate) !== requestDigestFromEvidence()) {
    return "C2_1_LEDGER_REQUEST_POSITION_DIGEST";
  }
  if (
    candidate.routes.some((route) => route.launch_blocking !== true) ||
    candidate.governance.gap_code !==
      "AUTHENTICATED_LIVE_ROUTE_BRANCH_EXECUTION_EVIDENCE_REQUIRED"
  ) return "C2_1_LEDGER_BLOCKERS";
  const outcomeIds = candidate.outcomes.map((outcome) => outcome.outcome_id);
  if (
    candidate.outcomes.length !== 775 ||
    new Set(outcomeIds).size !== outcomeIds.length
  ) return "C2_1_LEDGER_OUTCOME_SET";
  if (
    candidate.outcomes.some(
      (outcome, index) => outcome.outcome_id !== expectedOutcomes[index].outcome_id,
    )
  ) {
    const sameSet = candidate.outcomes.every((outcome) =>
      expectedOutcomes.some((expected) => expected.outcome_id === outcome.outcome_id)
    );
    if (sameSet) return "C2_1_LEDGER_OUTCOME_ORDER";
  }
  if (
    candidate.outcomes.some((outcome, index) =>
      outcome.node_id !== expectedOutcomes[index].node_id ||
      outcome.route_path !== expectedOutcomes[index].route_path
    )
  ) return "C2_1_LEDGER_OUTCOME_ASSOCIATION";
  if (
    candidate.outcomes.some(
      (outcome, index) => outcome.outcome_kind !== expectedOutcomes[index].outcome_kind,
    )
  ) return "C2_1_LEDGER_OUTCOME_KIND";
  if (
    candidate.import_boundaries.length !== expectedBoundaries.length ||
    candidate.import_boundaries.some(
      (boundary, index) =>
        boundary.import_boundary_id !==
          expectedBoundaries[index].import_boundary_id,
    )
  ) return "C2_1_LEDGER_IMPORT_BOUNDARY_SET";
  return null;
}

function expectMutationFailure(candidate, expected) {
  assert.equal(firstMutationFailure(candidate), expected);
}

function runMutations() {
  const duplicateText = ledgerBytes.toString("utf8").replace(
    /\{\n/,
    '{\n  "schema_version": "AIFINDER_C2_1_SEMANTIC_BRANCH_LEDGER_V1",\n',
  );
  let duplicateCode = null;
  try {
    strictJson(Buffer.from(duplicateText, "utf8"));
  } catch (caught) {
    duplicateCode = caught?.code;
  }
  assert.equal(duplicateCode, "STRICT_JSON_DUPLICATE_KEY");
  const cases = [
    ["C2_1_LEDGER_SCHEMA", (copy) => { copy.unexpected_property = true; }],
    ["C2_1_LEDGER_ROUTE_CONTRACT_DIGEST", (copy) => { copy.routes.pop(); }],
    ["C2_1_LEDGER_METHOD_SET", (copy) => { copy.methods[0].http_method = "TRACE"; }],
    ["C2_1_LEDGER_NODE_SET", (copy) => { copy.nodes.pop(); }],
    ["C2_1_LEDGER_NODE_IDENTITY", (copy) => { copy.nodes[1].node_id = copy.nodes[0].node_id; }],
    ["C2_1_LEDGER_NODE_ORDER", (copy) => {
      [copy.nodes[0], copy.nodes[1]] = [copy.nodes[1], copy.nodes[0]];
    }],
    ["C2_1_LEDGER_NODE_KIND_COUNTS", (copy) => {
      copy.nodes.find((node) => node.catch_binding === "OPTIONAL").catch_binding = "PARAMETERIZED";
    }],
    ["C2_1_LEDGER_NODE_KIND_COUNTS", (copy) => {
      copy.nodes.find((node) => node.kind === "IF").kind = "CATCH";
    }],
    ["C2_1_LEDGER_SUMMARY", (copy) => { copy.summary.nodes = 398; }],
    ["C2_1_LEDGER_REQUEST_POSITION_DIGEST", (copy) => {
      [copy.request_positions[0], copy.request_positions[1]] =
        [copy.request_positions[1], copy.request_positions[0]];
    }],
    ["C2_1_LEDGER_PRIVACY", (copy) => { copy.nodes[0].source_excerpt = "REDACTED"; }],
    ["C2_1_LEDGER_BLOCKERS", (copy) => { copy.routes[0].launch_blocking = false; }],
    ["C2_1_LEDGER_BLOCKERS", (copy) => { copy.governance.gap_code = "REMOVED"; }],
    ["C2_1_LEDGER_AUTHORITY", (copy) => {
      copy.nodes[0].behavior_state = "RUNTIME_QUALIFIED";
    }],
    ["C2_1_LEDGER_PATH_EXPANSION", (copy) => {
      copy.source_contract.write_scope_create_paths.push("testing/extra.mjs");
    }],
    ["C2_1_LEDGER_SCHEMA", (copy) => { copy.request_positions[0].status = "415"; }],
    ["C2_1_LEDGER_OUTCOME_SET", (copy) => { copy.outcomes.pop(); }],
    ["C2_1_LEDGER_OUTCOME_SET", (copy) => {
      copy.outcomes[1].outcome_id = copy.outcomes[0].outcome_id;
    }],
    ["C2_1_LEDGER_OUTCOME_ORDER", (copy) => {
      [copy.outcomes[0], copy.outcomes[1]] = [copy.outcomes[1], copy.outcomes[0]];
    }],
    ["C2_1_LEDGER_OUTCOME_ASSOCIATION", (copy) => {
      copy.outcomes[0].node_id = copy.outcomes[2].node_id;
    }],
    ["C2_1_LEDGER_OUTCOME_KIND", (copy) => {
      copy.outcomes[0].outcome_kind = "CATCH_ENTERED";
    }],
    ["C2_1_LEDGER_IMPORT_BOUNDARY_SET", (copy) => {
      copy.import_boundaries.pop();
    }],
    ["C2_1_LEDGER_HELPER_OPACITY", (copy) => {
      copy.import_boundaries[0].content_state = "QUALIFIED";
    }],
  ];
  for (const [expected, mutate] of cases) {
    const copy = cloneJson(ledger);
    mutate(copy);
    expectMutationFailure(copy, expected);
  }
  return 1 + cases.length;
}

let pass = 0;
let fail = 0;
const failedIds = [];
for (const [assertionId, assertion] of assertions) {
  try {
    assertion();
    pass += 1;
  } catch {
    fail += 1;
    failedIds.push(assertionId);
  }
}

if (fail > 0) {
  process.stdout.write(
    `FAIL_AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER assertions=24 pass=${pass} fail=${fail} failed_ids=${failedIds.join(",")} internal_failures=0\n`,
  );
  process.exitCode = 1;
} else {
  assert.equal(runMutations(), 24);
  process.stdout.write(
    "PASS_AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER assertions=24 mutations=24 routes=28 methods=37 nodes=409 ifs=366 catches_with_binding=31 catches_optional=12 catches=43 observed=15 unobserved=13 cases=23 positions=27 launch_blocking=28 runtime_qualified=0 imported_opaque_methods=15 route_local_methods=22 manual_nodes=409 manual_outcomes=775 c2_2=0 c2_3=0 c2_4=0 raw_values=0 failures=0 internal_failures=0\n",
  );
}
