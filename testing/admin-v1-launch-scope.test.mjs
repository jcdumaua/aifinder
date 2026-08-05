import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const MODULE_PATH = "lib/admin-v1-launch-scope.ts";
const SCHEMA_PATH = "testing/admin-v1-launch-scope.schema.json";
const LEDGER_PATH = "testing/admin-v1-launch-scope.json";
const PROXY_PATH = "proxy.ts";
const UI_PATH = "components/admin/admin-dashboard-client.tsx";
const EXACT_ADMIN_API_MATCHER = "/api/admin/:path*";
const GENERAL_MATCHER = "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$).*)";
const REPRESENTATIVE_EXTENSION_PATHS = Object.freeze([
  "/api/admin/discovery/sources/00000000-0000-0000-0000-000000000000.xml",
  "/api/admin/discovery/discovered-tools/1.js",
  "/api/admin/homepage-control/drafts/example.txt",
  "/api/admin/unknown.map",
]);
const EXPECTED_PROXY_MATCHER_CONTRACT = Object.freeze({
  exact_admin_api_matcher: EXACT_ADMIN_API_MATCHER,
  general_matcher_preserved: true,
  coverage: "ALL_CURRENT_AND_FUTURE_API_ADMIN_PATHS_BEFORE_DISPATCH",
  extension_suffix_bypass_closed: true,
  representative_extension_paths: REPRESENTATIVE_EXTENSION_PATHS,
});
const EXPECTED_CRITICAL_ROUTES = Object.freeze([
  ["/api/admin/login", ["POST"], "app/api/admin/login/route.ts"],
  ["/api/admin/logout", ["POST"], "app/api/admin/logout/route.ts"],
  ["/api/admin/session", ["GET"], "app/api/admin/session/route.ts"],
  ["/api/admin/csrf", ["GET"], "app/api/admin/csrf/route.ts"],
  ["/api/admin/tools", ["GET", "POST", "PUT", "DELETE"], "app/api/admin/tools/route.ts"],
  ["/api/admin/submissions", ["GET", "POST", "PUT", "PATCH"], "app/api/admin/submissions/route.ts"],
  ["/api/admin/upload-logo", ["POST"], "app/api/admin/upload-logo/route.ts"],
]);
const EXPECTED_DEFERRED_ROUTES = Object.freeze([
  ["/api/admin/audit-logs", ["GET", "POST"], "app/api/admin/audit-logs/route.ts"],
  ["/api/admin/discovery/candidate-extraction/invoke", ["POST"], "app/api/admin/discovery/candidate-extraction/invoke/route.ts"],
  ["/api/admin/discovery/candidate-staging-queue/[id]/decision", ["POST"], "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts"],
  ["/api/admin/discovery/candidate-staging-queue", ["GET"], "app/api/admin/discovery/candidate-staging-queue/route.ts"],
  ["/api/admin/discovery/discovered-tools/[id]/approve", ["POST"], "app/api/admin/discovery/discovered-tools/[id]/approve/route.ts"],
  ["/api/admin/discovery/discovered-tools/[id]/duplicate", ["POST"], "app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts"],
  ["/api/admin/discovery/discovered-tools/[id]", ["GET", "PATCH"], "app/api/admin/discovery/discovered-tools/[id]/route.ts"],
  ["/api/admin/discovery/discovered-tools/bulk-status", ["POST"], "app/api/admin/discovery/discovered-tools/bulk-status/route.ts"],
  ["/api/admin/discovery/discovered-tools", ["GET"], "app/api/admin/discovery/discovered-tools/route.ts"],
  ["/api/admin/discovery/intake", ["POST"], "app/api/admin/discovery/intake/route.ts"],
  ["/api/admin/discovery/runs/[id]/candidate-preview", ["GET"], "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts"],
  ["/api/admin/discovery/runs/manual/claim", ["POST"], "app/api/admin/discovery/runs/manual/claim/route.ts"],
  ["/api/admin/discovery/runs/manual", ["POST"], "app/api/admin/discovery/runs/manual/route.ts"],
  ["/api/admin/discovery/runs", ["GET"], "app/api/admin/discovery/runs/route.ts"],
  ["/api/admin/discovery/sources/[id]", ["PATCH"], "app/api/admin/discovery/sources/[id]/route.ts"],
  ["/api/admin/discovery/sources", ["GET", "POST"], "app/api/admin/discovery/sources/route.ts"],
  ["/api/admin/homepage-control/drafts/[id]/mark-preview", ["POST"], "app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts"],
  ["/api/admin/homepage-control/drafts/[id]/preview-checklist", ["PATCH"], "app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts"],
  ["/api/admin/homepage-control/drafts/[id]/publish", ["POST"], "app/api/admin/homepage-control/drafts/[id]/publish/route.ts"],
  ["/api/admin/homepage-control/drafts/[id]", ["PATCH"], "app/api/admin/homepage-control/drafts/[id]/route.ts"],
  ["/api/admin/homepage-control/drafts", ["POST"], "app/api/admin/homepage-control/drafts/route.ts"],
]);

function absolute(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  assert(resolved.startsWith(`${ROOT}${path.sep}`));
  return resolved;
}

function bytes(relativePath) {
  return readFileSync(absolute(relativePath));
}

function source(relativePath) {
  return bytes(relativePath).toString("utf8");
}

function gitBlob(contents) {
  return createHash("sha1")
    .update(`blob ${contents.length}\0`, "utf8")
    .update(contents)
    .digest("hex");
}

function strictJson(contents) {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(contents);
  let cursor = 0;
  const skip = () => {
    while (/\s/u.test(text[cursor] ?? "")) cursor += 1;
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
    const number = text.slice(cursor).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u);
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
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expectedType === "integer") return Number.isInteger(value);
  return typeof value === expectedType;
}

function validateSchema(rule, value, rootSchema) {
  if (rule.$ref) {
    const prefix = "#/$defs/";
    assert(rule.$ref.startsWith(prefix));
    validateSchema(rootSchema.$defs[rule.$ref.slice(prefix.length)], value, rootSchema);
    return;
  }
  if (Object.hasOwn(rule, "const")) assert.deepEqual(value, rule.const);
  if (rule.enum) assert(rule.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(value)));
  if (rule.type) assert(schemaTypeMatches(value, rule.type));
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) assert(value.length >= rule.minItems);
    if (rule.maxItems !== undefined) assert(value.length <= rule.maxItems);
    if (rule.uniqueItems) assert.equal(new Set(value.map(JSON.stringify)).size, value.length);
    if (rule.items) value.forEach((entry) => validateSchema(rule.items, entry, rootSchema));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = rule.properties ?? {};
    for (const key of rule.required ?? []) assert(Object.hasOwn(value, key));
    if (rule.additionalProperties === false) {
      assert(Object.keys(value).every((key) => Object.hasOwn(properties, key)));
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) validateSchema(properties[key], child, rootSchema);
    }
  }
}

function expectFailure(callback) {
  let failed = false;
  try {
    callback();
  } catch {
    failed = true;
  }
  assert(failed);
}

function proxyMatcherLiterals(contents) {
  const ast = ts.createSourceFile(PROXY_PATH, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let matcher = null;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "config" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      const property = node.initializer.properties.find((candidate) =>
        ts.isPropertyAssignment(candidate) &&
        ((ts.isIdentifier(candidate.name) && candidate.name.text === "matcher") ||
          (ts.isStringLiteralLike(candidate.name) && candidate.name.text === "matcher"))
      );
      if (!property || !ts.isPropertyAssignment(property)) return;
      if (ts.isStringLiteralLike(property.initializer)) {
        matcher = [property.initializer.text];
        return;
      }
      if (!ts.isArrayLiteralExpression(property.initializer)) return;
      const literals = property.initializer.elements.map((element) =>
        ts.isStringLiteralLike(element) ? element.text : null
      );
      matcher = literals.every((value) => value !== null) ? literals : null;
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return matcher;
}

function assertProxyMatcherContract(ledgerValue, schemaValue) {
  assert.deepEqual(ledgerValue.proxy_matcher_contract, EXPECTED_PROXY_MATCHER_CONTRACT);
  assert.deepEqual(schemaValue.required, [
    "schema_version",
    "phase",
    "baseline",
    "allowed_admin_pages",
    "critical_api_routes",
    "deferred_c2_routes",
    "unknown_admin_api_policy",
    "proxy_matcher_contract",
    "sources",
    "conditional_route_baseline_blobs",
    "controls",
    "outcomes",
    "next_authority",
  ]);
  assert.deepEqual(schemaValue.properties.proxy_matcher_contract, {
    type: "object",
    additionalProperties: false,
    required: [
      "exact_admin_api_matcher",
      "general_matcher_preserved",
      "coverage",
      "extension_suffix_bypass_closed",
      "representative_extension_paths",
    ],
    properties: {
      exact_admin_api_matcher: { const: EXACT_ADMIN_API_MATCHER },
      general_matcher_preserved: { const: true },
      coverage: { const: "ALL_CURRENT_AND_FUTURE_API_ADMIN_PATHS_BEFORE_DISPATCH" },
      extension_suffix_bypass_closed: { const: true },
      representative_extension_paths: { const: [...REPRESENTATIVE_EXTENSION_PATHS] },
    },
  });
}

function stopRed(line) {
  process.stdout.write(`${line}\n`);
  process.exit(1);
}

if (!existsSync(absolute(MODULE_PATH))) {
  stopRed("EXPECTED_FAIL_ADMIN_V1_LAUNCH_SCOPE_MODULE_ABSENT assertions=1 failures=1 internal_failures=0");
}

if (!existsSync(absolute(LEDGER_PATH)) || bytes(LEDGER_PATH).length === 0) {
  stopRed("EXPECTED_FAIL_ADMIN_V1_LAUNCH_SCOPE_LEDGER_EMPTY assertions=20 pass=0 fail=20 internal_failures=0");
}

const proxySource = source(PROXY_PATH);
if (
  !proxySource.includes('from "./lib/admin-v1-launch-scope"') ||
  !proxySource.includes("classifyAdminV1Path") ||
  !proxySource.includes("DENY_ADMIN_API_PATH") ||
  !proxySource.includes("DENY_ADMIN_API_METHOD") ||
  !proxySource.includes("allowedAdminV1Methods")
) {
  stopRed("EXPECTED_FAIL_ADMIN_V1_LAUNCH_SCOPE stage=PROXY_GATE assertions=28 pass=22 fail=6 internal_failures=0");
}

const uiSource = source(UI_PATH);
const navMatch = uiSource.match(/const ADMIN_NAV_ITEMS:[\s\S]*?= \[([\s\S]*?)\n\];/u);
const navSource = navMatch?.[1] ?? "";
const launchNavReady =
  (navSource.match(/href:/gu) ?? []).length === 3 &&
  navSource.includes('label: "Dashboard", href: "/admin"') &&
  navSource.includes('label: "Tools", href: "/admin/tools"') &&
  navSource.includes('label: "Moderation", href: "/admin/moderation"') &&
  !/Discovery|Homepage|Analytics|Notifications|Security|Settings/u.test(navSource) &&
  !uiSource.includes('data-v1-launch-visible="deferred"');
if (!launchNavReady) {
  stopRed("EXPECTED_FAIL_ADMIN_V1_LAUNCH_SCOPE stage=ADMIN_UI assertions=32 pass=28 fail=4 internal_failures=0");
}

const matcherLiterals = proxyMatcherLiterals(proxySource);
const preflightLedger = strictJson(bytes(LEDGER_PATH));
const preflightSchema = strictJson(bytes(SCHEMA_PATH));
const proxyCoverageRedChecks = [
  () => assert.deepEqual(matcherLiterals, [EXACT_ADMIN_API_MATCHER, GENERAL_MATCHER]),
  () => assert.equal(matcherLiterals?.[0], EXACT_ADMIN_API_MATCHER),
  () => {
    assert.equal(matcherLiterals?.[0], EXACT_ADMIN_API_MATCHER);
    assert(REPRESENTATIVE_EXTENSION_PATHS.every((pathname) => pathname.startsWith("/api/admin/")));
  },
  () => assertProxyMatcherContract(preflightLedger, preflightSchema),
];
let proxyCoverageRedPasses = 0;
for (const check of proxyCoverageRedChecks) {
  try { check(); proxyCoverageRedPasses += 1; } catch {}
}
if (proxyCoverageRedPasses !== proxyCoverageRedChecks.length) {
  stopRed(`EXPECTED_FAIL_ADMIN_V1_PROXY_MATCHER_COVERAGE assertions=4 pass=${proxyCoverageRedPasses} fail=${proxyCoverageRedChecks.length - proxyCoverageRedPasses} failures=1 internal_failures=0`);
}

const ledger = strictJson(bytes(LEDGER_PATH));
const schema = strictJson(bytes(SCHEMA_PATH));
const moduleTranspile = ts.transpileModule(source(MODULE_PATH), {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: MODULE_PATH,
  reportDiagnostics: true,
});
assert.equal(moduleTranspile.diagnostics?.length ?? 0, 0);
const moduleUrl = `data:text/javascript,${encodeURIComponent(moduleTranspile.outputText)}`;
const scopeModule = await import(moduleUrl);

const criticalPaths = ledger.critical_api_routes.map((entry) => entry.pathname);
const deferredPaths = ledger.deferred_c2_routes.map((entry) => entry.pathname);
const criticalMethods = ledger.critical_api_routes.flatMap((entry) => entry.methods.map((method) => `${entry.pathname}:${method}`));
const deferredMethods = ledger.deferred_c2_routes.flatMap((entry) => entry.methods.map((method) => `${entry.pathname}:${method}`));
const routeTuple = ({ pathname, methods, source_path: sourcePath }) => [pathname, methods, sourcePath];

const checks = [
  () => {
    validateSchema(schema, ledger, schema);
    expectFailure(() => strictJson(Buffer.from('{"a":1,"a":2}')));
    const inspectObjects = (node) => {
      if (!node || typeof node !== "object") return;
      if (node.type === "object") assert.equal(node.additionalProperties, false);
      Object.values(node).forEach(inspectObjects);
    };
    inspectObjects(schema);
  },
  () => assert.deepEqual(ledger.baseline, {
    commit: "ef5cbe7aede041d3fd009126de152b4777d160a5",
    parent: "132f4d16e7b8b6c7b4585bb794ac7732cead0a73",
    tree: "024846d8228725de5a99f46f643b1da592525317",
    subject: "Add offline synthetic rejection candidate ledger",
  }),
  () => assert.deepEqual(ledger.allowed_admin_pages, ["/admin", "/admin/tools", "/admin/moderation"]),
  () => assert.deepEqual(ledger.critical_api_routes.map(routeTuple), EXPECTED_CRITICAL_ROUTES),
  () => assert.equal(criticalMethods.length, 13),
  () => assert.deepEqual(ledger.deferred_c2_routes.map(routeTuple), EXPECTED_DEFERRED_ROUTES),
  () => assert.equal(deferredMethods.length, 24),
  () => {
    assert.equal(new Set([...criticalPaths, ...deferredPaths]).size, 28);
    assert(criticalPaths.every((pathname) => !deferredPaths.includes(pathname)));
  },
  () => {
    for (const entry of [...ledger.critical_api_routes, ...ledger.deferred_c2_routes]) {
      assert.equal(gitBlob(bytes(entry.source_path)), entry.baseline_git_blob);
    }
    assert.equal(ledger.sources.proxy.baseline_git_blob, "d416002fe6a7eef9c0790f5b3680738350d87fb8");
    assert.equal(ledger.sources.admin_ui.baseline_git_blob, "4fb4d58b32cfd8932f5b4d75914d9c1d12fd4620");
  },
  () => assert.deepEqual(Object.keys(scopeModule).sort(), [
    "ADMIN_V1_ALLOWED_API_METHODS",
    "ADMIN_V1_ALLOWED_PAGE_PATHS",
    "allowedAdminV1Methods",
    "classifyAdminV1Path",
    "isAdminV1ApiMethodAllowed",
    "isAdminV1PageAllowed",
  ]),
  () => {
    assert.deepEqual([...scopeModule.ADMIN_V1_ALLOWED_PAGE_PATHS], ledger.allowed_admin_pages);
    assert.deepEqual(scopeModule.ADMIN_V1_ALLOWED_API_METHODS, Object.fromEntries(ledger.critical_api_routes.map(({ pathname, methods }) => [pathname, methods])));
  },
  () => {
    assert.equal(scopeModule.classifyAdminV1Path("/admin-login"), "ALLOW_ADMIN_LOGIN_PAGE");
    for (const pathname of ledger.allowed_admin_pages) assert.equal(scopeModule.classifyAdminV1Path(pathname), "ALLOW_ADMIN_PAGE");
    assert.equal(scopeModule.classifyAdminV1Path("/admin/analytics"), "DENY_ADMIN_PAGE");
  },
  () => {
    for (const { pathname, methods } of ledger.critical_api_routes) {
      for (const method of methods) assert.equal(scopeModule.classifyAdminV1Path(pathname, method.toLowerCase()), "ALLOW_ADMIN_API");
    }
  },
  () => {
    for (const pathname of deferredPaths) assert.equal(scopeModule.classifyAdminV1Path(pathname, "GET"), "DENY_ADMIN_API_PATH");
    assert.equal(scopeModule.classifyAdminV1Path("/api/admin/future", "POST"), "DENY_ADMIN_API_PATH");
  },
  () => assert.equal(scopeModule.classifyAdminV1Path("/api/admin/tools", "PATCH"), "DENY_ADMIN_API_METHOD"),
  () => assert.equal(scopeModule.classifyAdminV1Path("/tools", "GET"), "NOT_ADMIN_SURFACE"),
  () => assert(proxySource.includes("classifyAdminV1Path(pathname, request.method)")),
  () => assert(proxySource.indexOf("classifyAdminV1Path(pathname, request.method)") < proxySource.lastIndexOf("NextResponse.next()")),
  () => {
    assert(proxySource.includes("Not found."));
    assert(proxySource.includes("status: 404"));
    assert(!proxySource.includes('error: "Not found.", pathname'));
  },
  () => {
    assert(proxySource.includes("Method not allowed."));
    assert(proxySource.includes("status: 405"));
    assert(proxySource.includes('"Allow"'));
  },
  () => {
    assert(proxySource.includes('"Cache-Control": "no-store"'));
    assert((proxySource.match(/addSecurityHeaders\(/gu) ?? []).length >= 5);
  },
  () => {
    assert(proxySource.includes("hasActiveAdminSessionCookie"));
    assert(proxySource.includes('loginUrl.searchParams.set("from", pathname)'));
    assert(proxySource.includes('redirectUrl.pathname = "/admin"'));
  },
  () => assert.deepEqual([...navSource.matchAll(/label: "([^"]+)", href: "([^"]+)"/gu)].map((match) => [match[1], match[2]]), [
    ["Dashboard", "/admin"],
    ["Tools", "/admin/tools"],
    ["Moderation", "/admin/moderation"],
  ]),
  () => {
    const dashboardMatch = uiSource.match(/\{view === "dashboard" && \(\s*<div[^>]*data-v1-launch-actions="true"[\s\S]*?\n\s*\)\}/u);
    assert(dashboardMatch);
    assert(!/\/admin\/(?:analytics|discovery|homepage-control|notifications|security|settings)/u.test(dashboardMatch[0]));
    assert(!/Audit Logs|Notifications/u.test(dashboardMatch[0]));
  },
  () => {
    const expected = new Map(ledger.critical_api_routes.map((entry) => [entry.source_path, entry.methods]));
    for (const [routePath, methods] of expected) {
      const routeSource = source(routePath);
      for (const method of methods) assert(new RegExp(`export (?:const|async function) ${method}\\b`, "u").test(routeSource));
    }
    const logoutRoute = source("app/api/admin/logout/route.ts");
    for (const marker of ["createLogoutHandler", "verifyAdminSession", "verifyAdminCsrfRequest", "createAdminAuditLog", "ADMIN_SESSION_COOKIE_NAME", "ADMIN_CSRF_COOKIE_NAME"]) assert(logoutRoute.includes(marker));
    const toolsRoute = source("app/api/admin/tools/route.ts");
    for (const marker of ["createAdminToolsHandler", "verifyAdminSession", "verifyAdminCsrfRequest", "checkAdminRateLimit", "supabaseAdmin", "createAdminAuditLog"]) assert(toolsRoute.includes(marker));
    const submissionsRoute = source("app/api/admin/submissions/route.ts");
    for (const marker of ["createAdminSubmissionsHandler", "verifyAdminSession", "verifyAdminCsrfRequest", "checkAdminRateLimit", "supabaseAdmin", "createAdminAuditLog"]) assert(submissionsRoute.includes(marker));
    const uploadRoute = source("app/api/admin/upload-logo/route.ts");
    for (const marker of ["createAdminUploadLogoHandler", "verifyAdminSession", "verifyAdminCsrfRequest", "checkAdminRateLimit", "supabaseAdmin.storage", "createAdminAuditLog", "randomUUID"]) assert(uploadRoute.includes(marker));
  },
  () => {
    const conditional = Object.entries(ledger.conditional_route_baseline_blobs);
    for (const [relativePath, blob] of conditional) assert.equal(gitBlob(bytes(relativePath)), blob);
  },
  () => {
    const matrix = strictJson(bytes("testing/readiness-coverage-matrix.json"));
    const routeRows = matrix.entries.filter((entry) => [...criticalPaths, ...deferredPaths].includes(entry.url_pattern_or_special_role));
    assert.equal(routeRows.filter((entry) => entry.launch_blocking).length, 7);
    for (const entry of routeRows) {
      assert(entry.static_evidence_paths.includes(LEDGER_PATH));
      const critical = criticalPaths.includes(entry.url_pattern_or_special_role);
      assert.equal(entry.coverage_state, critical ? "V1_ADMIN_HERMETIC_EVIDENCE_INTEGRATED_STAGING_REQUIRED" : "V1_ADMIN_DEFERRED_FAIL_CLOSED");
    }
  },
  () => {
    const registry = strictJson(bytes("testing/public-launch-blocker-registry.json"));
    const critical = registry.workstreams.find((entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL");
    const deferred = registry.workstreams.find((entry) => entry.id === "AUTHENTICATED_ADMIN_V1_DEFERRED");
    assert.equal(critical.entry_count, 7);
    assert.equal(deferred.entry_count, 21);
    assert.equal(registry.execution_authorized, false);
  },
  () => {
    const manifest = strictJson(bytes("testing/static-test-safety-manifest.json"));
    const expected = new Map([
      [SCHEMA_PATH, ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY"]],
      [LEDGER_PATH, ["CONFIG", "SAFE_STATIC_SUPPORT", "VALIDATE_ONLY"]],
      ["testing/admin-v1-launch-scope.test.mjs", ["EXECUTABLE", "SAFE_STATIC_POLICY", "RUN_POLICY"]],
      ["testing/admin-v1-launch-critical-hermetic.test.mjs", ["EXECUTABLE", "SAFE_HERMETIC_POLICY", "RUN_POLICY"]],
    ]);
    for (const [entryPath, tuple] of expected) {
      const entry = manifest.entries.find((candidate) => candidate.path === entryPath);
      assert.deepEqual([entry.role, entry.safety_class, entry.ci_disposition], tuple);
    }
  },
  () => {
    const runner = source("testing/run-static-readiness.mjs");
    assert(runner.includes("--v1-admin-policy"));
    assert(runner.includes("PASS_STATIC_READINESS_V1_ADMIN_POLICY"));
    assert(runner.includes("PASS_STATIC_READINESS_V1_ADMIN_COMPLETE"));
  },
  () => {
    const partial = source("testing/authenticated-live-route-partial-evidence.test.mjs");
    const candidates = source("testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs");
    const literalValues = (text, fileName) => {
      const ast = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      const values = new Set();
      const visit = (node) => {
        if (ts.isStringLiteralLike(node)) values.add(node.text);
        ts.forEachChild(node, visit);
      };
      visit(ast);
      return values;
    };
    const partialLiterals = literalValues(partial, "partial-evidence.test.mjs");
    const candidateLiterals = literalValues(candidates, "candidate-ledger.test.mjs");
    for (const marker of ["matrix_partial_evidence_links_28", "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL", "AUTHENTICATED_ADMIN_V1_DEFERRED", "HERMETIC_COMPLETE_STAGING_AUTHORITY_REQUIRED", "SAFELY_DISABLED_FOR_V1_LAUNCH"]) assert(partialLiterals.has(marker));
    for (const marker of ["L18_BLOCKERS_ROUTES_AND_NO_GO", "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL", "AUTHENTICATED_ADMIN_V1_DEFERRED", "HERMETIC_COMPLETE_STAGING_AUTHORITY_REQUIRED", "SAFELY_DISABLED_FOR_V1_LAUNCH"]) assert(candidateLiterals.has(marker));
  },
  () => {
    for (const relativePath of ["testing/authenticated-live-route-partial-evidence.test.mjs", "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs"]) {
      const legacySource = source(relativePath);
      const ast = ts.createSourceFile(relativePath, legacySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      let bypass = false;
      const visit = (node) => {
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "process" &&
          (node.name.text === "env" || node.name.text === "argv")
        ) bypass = true;
        if (ts.isStringLiteralLike(node) && /NODE_OPTIONS|--require|--import|preload|hidden[_-]?flag/iu.test(node.text)) bypass = true;
        ts.forEachChild(node, visit);
      };
      visit(ast);
      assert.equal(bypass, false);
    }
  },
  () => assert.deepEqual(matcherLiterals, [EXACT_ADMIN_API_MATCHER, GENERAL_MATCHER]),
  () => assert.equal(matcherLiterals?.[0], EXACT_ADMIN_API_MATCHER),
  () => {
    for (const pathname of REPRESENTATIVE_EXTENSION_PATHS) {
      assert.equal(scopeModule.classifyAdminV1Path(pathname, "GET"), "DENY_ADMIN_API_PATH");
    }
  },
  () => assertProxyMatcherContract(ledger, schema),
];

const mutations = [
  () => assert.equal(scopeModule.classifyAdminV1Path("/admin/tools/extra"), "DENY_ADMIN_PAGE"),
  () => assert.equal(scopeModule.classifyAdminV1Path("/api/admin/tools/extra", "GET"), "DENY_ADMIN_API_PATH"),
  () => assert.equal(scopeModule.classifyAdminV1Path("/api/admin/tool", "GET"), "DENY_ADMIN_API_PATH"),
  () => assert.equal(scopeModule.classifyAdminV1Path("/api/admin/tools", "CONNECT"), "DENY_ADMIN_API_METHOD"),
  () => assert.equal(scopeModule.isAdminV1ApiMethodAllowed("/api/admin/tools", "patch"), false),
  () => assert.equal(scopeModule.isAdminV1ApiMethodAllowed("/api/admin/tools", "get"), true),
  () => assert.deepEqual([...scopeModule.allowedAdminV1Methods("/api/admin/future")], []),
  () => assert.equal(scopeModule.isAdminV1PageAllowed("/admin/analytics"), false),
  () => assert.equal(scopeModule.classifyAdminV1Path("/admin-login-extra"), "DENY_ADMIN_PAGE"),
  () => assert.equal(scopeModule.classifyAdminV1Path("/api/public", "GET"), "NOT_ADMIN_SURFACE"),
  () => assert.equal(new Set(criticalPaths).size, 7),
  () => assert.equal(new Set(deferredPaths).size, 21),
  () => assert.equal(ledger.controls.real_route_execution, 0),
  () => assert.equal(ledger.controls.network, 0),
  () => assert.equal(ledger.outcomes.launch_blockers_before, 28),
  () => assert.equal(ledger.outcomes.launch_blockers_after, 7),
  () => expectFailure(() => assert.deepEqual(
    proxyMatcherLiterals(proxySource.replace(`    "${EXACT_ADMIN_API_MATCHER}",\n`, "")),
    [EXACT_ADMIN_API_MATCHER, GENERAL_MATCHER]
  )),
  () => expectFailure(() => assert.deepEqual(
    proxyMatcherLiterals(proxySource.replace(EXACT_ADMIN_API_MATCHER, "/api/admin/:path")),
    [EXACT_ADMIN_API_MATCHER, GENERAL_MATCHER]
  )),
  () => expectFailure(() => assert.deepEqual(
    proxyMatcherLiterals(proxySource.replace(`"${EXACT_ADMIN_API_MATCHER}"`, "ADMIN_API_MATCHER")),
    [EXACT_ADMIN_API_MATCHER, GENERAL_MATCHER]
  )),
  () => {
    const mutatedLedger = structuredClone(ledger);
    mutatedLedger.proxy_matcher_contract.extension_suffix_bypass_closed = false;
    expectFailure(() => assertProxyMatcherContract(mutatedLedger, schema));
  },
];

let failures = 0;
for (const check of checks) {
  try { check(); } catch { failures += 1; }
}
for (const mutation of mutations) {
  try { mutation(); } catch { failures += 1; }
}

if (failures > 0) {
  process.stdout.write(`FAIL_ADMIN_V1_LAUNCH_SCOPE assertions=36 mutations=20 failures=${failures} internal_failures=0\n`);
  process.exit(1);
}

process.stdout.write("PASS_ADMIN_V1_LAUNCH_SCOPE assertions=36 mutations=20 launch_pages=3 launch_api_routes=7 launch_api_methods=13 deferred_c2_routes=21 deferred_c2_methods=24 unknown_admin_api=DENY_BY_DEFAULT proxy_admin_matcher=/api/admin/:path* extension_suffix_bypass_closed=true blockers_before=28 blockers_after=7 failures=0 internal_failures=0\n");
