import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import * as analyzer from "./authenticated-live-route-semantic-analyzer.mjs";

const FIXTURE_COUNT = 4;
const ACTIVE_STAGE = "ROUTE_RECONCILIATION";
const HTTP_ORDER = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const PARTIAL_EVIDENCE_PATH =
  "testing/authenticated-live-route-partial-evidence.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const BLOCKER_PATH = "testing/public-launch-blocker-registry.json";
const ROUTE_PATHS = Object.freeze([
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
]);
const READ_ALLOWLIST_SET = new Set(READ_ALLOWLIST);
const READ_COUNTS = new Map();
const REPOSITORY_ROOT = path.resolve(process.cwd());

const EXPORT_FIXTURE = `import importedHandler from "./handler";
export function GET() { return null; }
export const POST = () => null;
const putHandler = function () { return null; };
export { putHandler as PUT };
export { importedHandler as PATCH };
export { DELETE } from "./handler";
`;

const NODE_FIXTURE = `function wrap(value) { return value; }
export const OPTIONS = wrap(() => {
  if (true) { return null; }
  try { return null; } catch (error) { return error; }
  try { return null; } catch { return null; }
  Promise.resolve().catch(() => null);
  const text = "if (false) catch (ignored)";
  const ternary = true ? 1 : 0;
  const logical = true && false;
  switch (ternary) { case 1: break; default: break; }
  return { text, logical };
});
`;

const OWNERSHIP_FIXTURE = `function shared() { if (true) { return null; } }
function onlyGet() { try { return null; } catch { return null; } shared(); }
export function GET() { if (true) { return null; } onlyGet(); }
export const POST = () => { shared(); };
if (false) { throw new Error("unattributed"); }
`;

const AMBIGUOUS_FIXTURE = `function shared() { return null; }
function shared() { return null; }
export const GET = shared;
`;

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

function gitBlob(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`, "utf8")
    .update(bytes)
    .digest("hex");
}

function fixtureInput(source = EXPORT_FIXTURE) {
  const bytes = Buffer.from(source, "utf8");
  const exportedMethods = source === NODE_FIXTURE
    ? ["OPTIONS"]
    : source === OWNERSHIP_FIXTURE
      ? ["GET", "POST"]
      : source === AMBIGUOUS_FIXTURE
        ? ["GET"]
        : ["GET", "POST", "PUT", "PATCH", "DELETE"];
  return {
    path: "fixtures/route.ts",
    bytes,
    expectedIdentity: {
      git_blob: gitBlob(bytes),
      sha256: sha256(bytes),
      bytes: bytes.length,
      lf_lines: source.split("\n").length - 1,
      exported_methods: exportedMethods,
      observed_status: "UNOBSERVED",
    },
    helperPaths: ["fixtures/handler.ts"],
  };
}

let cachedRealContext = null;
function loadRealContext() {
  if (cachedRealContext) return cachedRealContext;
  const beforeNegative = READ_COUNTS.size;
  expectFailure(() => readExactC2("lib/admin-auth.ts"), "C2_1_READ_NOT_ALLOWED");
  assert.equal(READ_COUNTS.size, beforeNegative);

  const partialBytes = readExactC2(PARTIAL_EVIDENCE_PATH);
  assert.equal(
    sha256(partialBytes),
    "68f8493efd59116bc2b1f81876e6c42243e701ae0d44683cb1a8944a74d9178f",
  );
  const partialEvidence = JSON.parse(partialBytes.toString("utf8"));
  assert.deepEqual(
    partialEvidence.routes.map((route) => route.baseline_path),
    ROUTE_PATHS,
  );
  const routeByPath = new Map(
    partialEvidence.routes.map((route) => [route.baseline_path, route]),
  );
  const routeInputs = ROUTE_PATHS.map((routePath) => {
    const contract = routeByPath.get(routePath);
    return {
      path: routePath,
      bytes: readExactC2(routePath),
      expectedIdentity: {
        git_blob: contract.git_object_identity,
        sha256: contract.sha256,
        bytes: contract.bytes,
        lf_lines: contract.lf_lines,
        exported_methods: contract.exported_methods,
        observed_status: contract.observed_status,
        if_count: contract.source_visible_branch_groups.if_statements,
        catch_bound_count:
          contract.source_visible_branch_groups.catch_clauses_with_binding,
        catch_optional_count:
          contract.source_visible_branch_groups.catch_clauses_optional_binding,
        catch_total: contract.source_visible_branch_groups.catch_clauses_total,
        decision_total:
          contract.source_visible_branch_groups.decision_catch_total,
      },
      helperPaths: HELPER_PATHS,
    };
  });
  const matrix = JSON.parse(readExactC2(MATRIX_PATH).toString("utf8"));
  const blockerRegistry = JSON.parse(
    readExactC2(BLOCKER_PATH).toString("utf8"),
  );
  cachedRealContext = {
    partialEvidence,
    routeInputs,
    matrix,
    blockerRegistry,
  };
  return cachedRealContext;
}

function expectFailure(callback, code) {
  let caught = null;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.equal(caught?.code, code);
}

function buildRealLedger() {
  const context = loadRealContext();
  return analyzer.buildLedger({
    routeInputs: context.routeInputs,
    partialEvidence: context.partialEvidence,
    governanceFacts: {
      repository: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      commit: "bb135e0dc5bfa31b4d5542cca855541014374e44",
      parent: "c4fa8e9afc66d58e0b68855fd49bd92c0c18b6c9",
      tree: "768055aed4e67e083e61bc12bb52f850311039e6",
      subject: "Restore additive static readiness safeguards",
      matrix_path: MATRIX_PATH,
      blocker_registry_path: BLOCKER_PATH,
      gap_code: "AUTHENTICATED_LIVE_ROUTE_BRANCH_EXECUTION_EVIDENCE_REQUIRED",
    },
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function validationFailure(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function validateAnalyzerLedger(candidate, partialEvidence) {
  const expectedRoutes = new Map(
    partialEvidence.routes.map((route) => [route.baseline_path, route]),
  );
  const routePaths = candidate.routes.map((route) => route.route_path);
  if (
    routePaths.length !== ROUTE_PATHS.length ||
    new Set(routePaths).size !== routePaths.length ||
    !ROUTE_PATHS.every((routePath) => routePaths.includes(routePath))
  ) validationFailure("C2_1_ROUTE_SCOPE");
  for (const route of candidate.routes) {
    const expected = expectedRoutes.get(route.route_path);
    if (!expected) validationFailure("C2_1_ROUTE_SCOPE");
    if (
      route.sha256 !== expected.sha256 ||
      route.bytes !== expected.bytes ||
      route.lf_lines !== expected.lf_lines
    ) validationFailure("C2_1_ROUTE_IDENTITY");
    if (route.git_blob !== expected.git_object_identity) {
      validationFailure("C2_1_ROUTE_IDENTITY");
    }
    const methods = candidate.methods
      .filter((method) => method.route_path === route.route_path)
      .map((method) => method.http_method);
    if (JSON.stringify(methods) !== JSON.stringify(expected.exported_methods)) {
      validationFailure("C2_1_EXPORTED_METHOD_SET");
    }
    const vector = expected.source_visible_branch_groups;
    if (route.if_count !== vector.if_statements) {
      validationFailure("C2_1_ROUTE_SEMANTIC_VECTOR");
    }
    if (route.catch_optional_count !== vector.catch_clauses_optional_binding) {
      validationFailure("C2_1_CATCH_OPTIONAL_COUNT");
    }
    if (
      route.catch_bound_count !== vector.catch_clauses_with_binding ||
      route.catch_total !== vector.catch_clauses_total ||
      route.node_ids.length !== vector.decision_catch_total
    ) validationFailure("C2_1_ROUTE_SEMANTIC_VECTOR");
  }
  if (candidate.nodes.some((node) => !["IF", "CATCH"].includes(node.kind))) {
    validationFailure("C2_1_MEMBER_CATCH_EXCLUDED");
  }
  if (candidate.summary.nodes !== 409) {
    validationFailure("C2_1_DECISION_CATCH_TOTAL");
  }
  const nodeIds = candidate.nodes.map((node) => node.node_id);
  if (new Set(nodeIds).size !== nodeIds.length) {
    validationFailure("C2_1_NODE_IDENTITY");
  }
  const sortedNodes = [...candidate.nodes].sort(
    (left, right) =>
      left.route_path.localeCompare(right.route_path) ||
      left.start_utf16 - right.start_utf16 ||
      left.end_utf16 - right.end_utf16 ||
      (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
  );
  if (candidate.nodes.some((node, index) => node.node_id !== sortedNodes[index].node_id)) {
    validationFailure("C2_1_NODE_ORDER");
  }
  for (const node of candidate.nodes) {
    const expectedOwner = node.candidate_exported_method_ids.length === 0
      ? "UNATTRIBUTED"
      : node.candidate_exported_method_ids.length === 1
        ? "UNIQUE"
        : "SHARED";
    if (
      node.ownership_state === "AMBIGUOUS" ||
      node.ownership_state !== expectedOwner
    ) validationFailure("C2_1_NODE_OWNER");
  }
  if (
    candidate.methods.some(
      (method) =>
        method.reason_codes.includes("IMPORTED_IMPLEMENTATION_UNREAD") &&
        method.implementation_kind !== "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
    )
  ) validationFailure("C2_1_IMPORTED_HANDLER_OPACITY");
  return true;
}

function runMutationProofs(ledger, partialEvidence) {
  const cases = [
    ["C2_1_ROUTE_SCOPE", (copy) => copy.routes.pop()],
    ["C2_1_ROUTE_SCOPE", (copy) => copy.routes.push(cloneJson(copy.routes[0]))],
    ["C2_1_ROUTE_IDENTITY", (copy) => { copy.routes[0].sha256 = "0".repeat(64); }],
    ["C2_1_ROUTE_IDENTITY", (copy) => { copy.routes[0].git_blob = "0".repeat(40); }],
    ["C2_1_EXPORTED_METHOD_SET", (copy) => { copy.methods[0].http_method = "TRACE"; }],
    ["C2_1_ROUTE_SEMANTIC_VECTOR", (copy) => {
      const left = copy.routes.find((route) => route.if_count > 0);
      const right = copy.routes.find((route) => route.if_count === 0);
      [left.if_count, right.if_count] = [right.if_count, left.if_count];
    }],
    ["C2_1_CATCH_OPTIONAL_COUNT", (copy) => {
      copy.routes.find((route) => route.catch_optional_count > 0).catch_optional_count -= 1;
    }],
    ["C2_1_MEMBER_CATCH_EXCLUDED", (copy) => { copy.nodes[0].kind = "MEMBER_CATCH"; }],
    ["C2_1_DECISION_CATCH_TOTAL", (copy) => { copy.summary.nodes = 398; }],
    ["C2_1_NODE_IDENTITY", (copy) => { copy.nodes[1].node_id = copy.nodes[0].node_id; }],
    ["C2_1_NODE_ORDER", (copy) => {
      [copy.nodes[0], copy.nodes[1]] = [copy.nodes[1], copy.nodes[0]];
    }],
    ["C2_1_NODE_OWNER", (copy) => {
      const node = copy.nodes.find((entry) => entry.ownership_state === "UNIQUE");
      node.ownership_state = "SHARED";
    }],
    ["C2_1_NODE_OWNER", (copy) => { copy.nodes[0].ownership_state = "AMBIGUOUS"; }],
    ["C2_1_IMPORTED_HANDLER_OPACITY", (copy) => {
      const method = copy.methods.find((entry) =>
        entry.reason_codes.includes("IMPORTED_IMPLEMENTATION_UNREAD")
      );
      method.implementation_kind = "LOCAL_ARROW_FUNCTION";
    }],
  ];
  for (const [expectedCode, mutate] of cases) {
    const copy = cloneJson(ledger);
    mutate(copy);
    expectFailure(() => validateAnalyzerLedger(copy, partialEvidence), expectedCode);
  }
  return cases.length;
}

const assertions = [
  ["A01_MODULE_EXPORTS", () => {
    assert.deepEqual(Object.keys(analyzer).sort(), [
      "analyzeRoute",
      "buildLedger",
      "canonicalJson",
    ]);
    assert.equal(typeof analyzer.analyzeRoute, "function");
    assert.equal(typeof analyzer.buildLedger, "function");
    assert.equal(typeof analyzer.canonicalJson, "function");
  }],
  ["A02_FATAL_UTF8_AND_PARSE_DIAGNOSTICS", () => {
    const invalidUtf8 = fixtureInput();
    invalidUtf8.bytes = Buffer.from([0xc3, 0x28]);
    expectFailure(
      () => analyzer.analyzeRoute(invalidUtf8),
      "C2_1_FATAL_UTF8",
    );
    expectFailure(
      () => analyzer.analyzeRoute(fixtureInput("export function GET( {\n")),
      "C2_1_PARSE_DIAGNOSTICS",
    );
  }],
  ["A03_HTTP_EXPORT_DECLARATIONS_AND_CONST_FORMS", () => {
    const result = analyzer.analyzeRoute(fixtureInput());
    const methods = new Map(result.methods.map((method) => [method.http_method, method]));
    assert.deepEqual(
      result.methods.map((method) => method.http_method),
      ["GET", "POST", "PUT", "PATCH", "DELETE"],
    );
    assert.equal(methods.get("GET")?.export_form, "FUNCTION_DECLARATION");
    assert.equal(methods.get("GET")?.implementation_kind, "LOCAL_FUNCTION_DECLARATION");
    assert.equal(methods.get("POST")?.export_form, "CONST_ARROW");
    assert.equal(methods.get("POST")?.implementation_kind, "LOCAL_ARROW_FUNCTION");
    assert.equal(methods.get("PUT")?.implementation_kind, "LOCAL_FUNCTION_EXPRESSION");
    assert.deepEqual(
      [...result.methods].sort(
        (left, right) => HTTP_ORDER.indexOf(left.http_method) - HTTP_ORDER.indexOf(right.http_method),
      ),
      result.methods,
    );
  }],
  ["A04_ALIAS_REEXPORT_AND_IMPORTED_OPACITY", () => {
    const result = analyzer.analyzeRoute(fixtureInput());
    const methods = new Map(result.methods.map((method) => [method.http_method, method]));
    assert.equal(methods.get("PUT")?.export_form, "LOCAL_EXPORT_ALIAS");
    assert.equal(methods.get("PATCH")?.export_form, "OPAQUE_IMPORTED_BINDING");
    assert.equal(
      methods.get("PATCH")?.implementation_kind,
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
    );
    assert.equal(methods.get("DELETE")?.export_form, "OPAQUE_REEXPORT_FROM");
    assert.equal(
      methods.get("DELETE")?.implementation_kind,
      "IMPORTED_HANDLER_IMPLEMENTATION_UNREAD",
    );
  }],
  ["A05_WRAPPER_CALLBACK_EXPORT", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.equal(result.methods.length, 1);
    assert.equal(result.methods[0].http_method, "OPTIONS");
    assert.equal(result.methods[0].export_form, "WRAPPER_INLINE_CALLBACK");
    assert.equal(result.methods[0].implementation_kind, "LOCAL_WRAPPER_CALLBACK");
  }],
  ["A06_IF_STATEMENT_CLASSIFICATION", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.equal(result.nodes.filter((node) => node.kind === "IF").length, 1);
    assert.equal(result.if_count, 1);
  }],
  ["A07_PARAMETERIZED_CATCH_CLASSIFICATION", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.equal(
      result.nodes.filter((node) => node.catch_binding === "PARAMETERIZED").length,
      1,
    );
    assert.equal(result.catch_bound_count, 1);
  }],
  ["A08_OPTIONAL_CATCH_CLASSIFICATION", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.equal(
      result.nodes.filter((node) => node.catch_binding === "OPTIONAL").length,
      1,
    );
    assert.equal(result.catch_optional_count, 1);
  }],
  ["A09_MEMBER_CATCH_EXCLUDED", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.equal(result.member_catch_calls, 1);
    assert.equal(result.catch_total, 2);
    assert.equal(result.nodes.length, 3);
  }],
  ["A10_COMMENT_STRING_TERNARY_LOGICAL_SWITCH_EXCLUDED", () => {
    const result = analyzer.analyzeRoute(fixtureInput(NODE_FIXTURE));
    assert.deepEqual(
      result.nodes.map((node) => node.kind),
      ["IF", "CATCH", "CATCH"],
    );
    assert.equal(result.if_count + result.catch_total, 3);
  }],
  ["A11_ROUTE_IDENTITY", () => {
    const input = fixtureInput(NODE_FIXTURE);
    const result = analyzer.analyzeRoute(input);
    assert.equal(result.sha256, input.expectedIdentity.sha256);
    assert.equal(result.git_blob, input.expectedIdentity.git_blob);
    assert.equal(result.bytes, input.expectedIdentity.bytes);
    assert.equal(result.lf_lines, input.expectedIdentity.lf_lines);
  }],
  ["A12_EXPORTED_METHOD_SET", () => {
    const { routeInputs } = loadRealContext();
    for (const input of routeInputs) {
      const result = analyzer.analyzeRoute(input);
      assert.deepEqual(
        result.methods.map((method) => method.http_method),
        input.expectedIdentity.exported_methods,
      );
      assert(result.methods.every((method) => /^[0-9a-f]{64}$/.test(method.method_id)));
    }
  }],
  ["A13_PER_ROUTE_SEMANTIC_VECTOR", () => {
    const { routeInputs } = loadRealContext();
    const totals = {
      methods: 0,
      ifs: 0,
      bound: 0,
      optional: 0,
      catches: 0,
      nodes: 0,
    };
    for (const input of routeInputs) {
      const result = analyzer.analyzeRoute(input);
      assert.equal(result.if_count, input.expectedIdentity.if_count);
      assert.equal(result.catch_bound_count, input.expectedIdentity.catch_bound_count);
      assert.equal(
        result.catch_optional_count,
        input.expectedIdentity.catch_optional_count,
      );
      assert.equal(result.catch_total, input.expectedIdentity.catch_total);
      assert.equal(result.semantic_node_count, input.expectedIdentity.decision_total);
      totals.methods += result.methods.length;
      totals.ifs += result.if_count;
      totals.bound += result.catch_bound_count;
      totals.optional += result.catch_optional_count;
      totals.catches += result.catch_total;
      totals.nodes += result.semantic_node_count;
    }
    assert.deepEqual(totals, {
      methods: 37,
      ifs: 366,
      bound: 31,
      optional: 12,
      catches: 43,
      nodes: 409,
    });
  }],
  ["A14_LEXICAL_OWNERSHIP", () => {
    const result = analyzer.analyzeRoute(fixtureInput(OWNERSHIP_FIXTURE));
    const ownershipCounts = Object.fromEntries(
      ["UNIQUE", "SHARED", "UNATTRIBUTED"].map((state) => [
        state,
        result.nodes.filter((node) => node.ownership_state === state).length,
      ]),
    );
    assert.deepEqual(ownershipCounts, {
      UNIQUE: 2,
      SHARED: 1,
      UNATTRIBUTED: 1,
    });
    assert(
      result.nodes.every(
        (node) =>
          Array.isArray(node.candidate_exported_method_ids) &&
          node.candidate_exported_method_ids.length ===
            new Set(node.candidate_exported_method_ids).size,
      ),
    );
  }],
  ["A15_LOCAL_HELPER_REACHABILITY", () => {
    const result = analyzer.analyzeRoute(fixtureInput(OWNERSHIP_FIXTURE));
    const methods = new Map(result.methods.map((method) => [method.http_method, method]));
    assert.equal(methods.get("GET")?.direct_node_ids.length, 1);
    assert.equal(methods.get("GET")?.reachable_local_helper_node_ids.length, 2);
    assert.equal(methods.get("POST")?.direct_node_ids.length, 0);
    assert.equal(methods.get("POST")?.reachable_local_helper_node_ids.length, 1);
  }],
  ["A16_AMBIGUOUS_OWNERSHIP_FATAL", () => {
    expectFailure(
      () => analyzer.analyzeRoute(fixtureInput(AMBIGUOUS_FIXTURE)),
      "C2_1_AMBIGUOUS_OWNERSHIP",
    );
  }],
  ["A17_NODE_METHOD_OUTCOME_IMPORT_IDENTITIES", () => {
    const input = fixtureInput(NODE_FIXTURE);
    const result = analyzer.analyzeRoute(input);
    for (const method of result.methods) {
      assert.equal(
        method.method_id,
        sha256(
          [
            "AIFINDER_C2_1_METHOD_V1",
            input.path,
            input.expectedIdentity.git_blob,
            method.http_method,
            method.export_form,
            method.implementation_kind,
          ].join("\0"),
        ),
      );
    }
    for (const node of result.nodes) {
      assert.equal(
        node.node_id,
        sha256(
          [
            "AIFINDER_C2_1_NODE_V1",
            input.path,
            input.expectedIdentity.git_blob,
            node.kind,
            String(node.start_utf16),
            String(node.end_utf16),
            node.source_span_sha256,
          ].join("\0"),
        ),
      );
      const expectedKinds = node.kind === "IF"
        ? ["IF_TRUE", "IF_FALSE_OR_FALLTHROUGH"]
        : ["CATCH_ENTERED"];
      assert.equal(node.outcome_ids.length, expectedKinds.length);
      for (const [index, outcomeKind] of expectedKinds.entries()) {
        assert.equal(
          node.outcome_ids[index],
          sha256(
            ["AIFINDER_C2_1_OUTCOME_V1", node.node_id, outcomeKind].join("\0"),
          ),
        );
      }
    }
    assert.equal(result.outcomes.length, 4);
  }],
  ["A18_CANONICAL_ORDER_AND_DIGESTS", () => {
    const result = analyzer.analyzeRoute(fixtureInput(OWNERSHIP_FIXTURE));
    const sortedNodes = [...result.nodes].sort(
      (left, right) =>
        left.route_path.localeCompare(right.route_path) ||
        left.start_utf16 - right.start_utf16 ||
        left.end_utf16 - right.end_utf16 ||
        (left.kind === right.kind ? 0 : left.kind === "IF" ? -1 : 1),
    );
    assert.deepEqual(result.nodes, sortedNodes);
    const rows = result.nodes.map((node) =>
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
    assert.equal(result.node_set_digest, sha256(rows));
    assert.equal(
      analyzer.canonicalJson({ z: 1, a: { z: 2, a: 3 } }),
      "{\n  \"a\": {\n    \"a\": 3,\n    \"z\": 2\n  },\n  \"z\": 1\n}\n",
    );
  }],
  ["A19_IMPORT_BOUNDARIES_UNREAD", () => {
    const { routeInputs } = loadRealContext();
    const boundaries = routeInputs.flatMap(
      (input) => analyzer.analyzeRoute(input).import_boundaries,
    );
    assert(boundaries.length > 0);
    assert(
      boundaries.every(
        (boundary) =>
          boundary.content_state === "UNREAD_FOR_C2_1_SEMANTICS" &&
          boundary.behavior_state === "NOT_RUNTIME_QUALIFIED" &&
          /^[0-9a-f]{64}$/.test(boundary.import_boundary_id),
      ),
    );
    assert.deepEqual(
      [...new Set(boundaries.map((boundary) => boundary.resolved_target_or_external))].sort(),
      [...HELPER_PATHS, "crypto", "next/server", "server-only", "zlib"].sort(),
    );
  }],
  ["A20_GLOBAL_RECONCILIATION_AND_RAW_OUTPUT_ZERO", () => {
    const ledger = buildRealLedger();
    assert.deepEqual(Object.keys(ledger).sort(), [
      "algorithm_contract",
      "artifact_purpose",
      "governance",
      "import_boundaries",
      "methods",
      "nodes",
      "outcomes",
      "phase",
      "repository_baseline",
      "request_positions",
      "routes",
      "schema_version",
      "source_contract",
      "summary",
    ]);
    assert.deepEqual(
      [
        ledger.summary.routes,
        ledger.summary.methods,
        ledger.summary.ifs,
        ledger.summary.catches_with_binding,
        ledger.summary.catches_optional,
        ledger.summary.catches,
        ledger.summary.nodes,
        ledger.summary.outcomes,
        ledger.summary.imported_opaque_methods,
        ledger.summary.route_local_methods,
      ],
      [28, 37, 366, 31, 12, 43, 409, 775, 15, 22],
    );
    assert.equal(ledger.request_positions.length, 27);
    assert.equal(ledger.summary.runtime_qualified_nodes, 0);
    assert.equal(ledger.summary.routes_unblocked, 0);
    assert.equal(ledger.summary.launch_blockers, 28);
    assert.equal(ledger.summary.public_launch, "NO_GO");
    assert.equal(READ_COUNTS.size, 31);
    assert(READ_ALLOWLIST.every((repositoryPath) => READ_COUNTS.get(repositoryPath) === 1));
    const forbiddenRawKeys = new Set([
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
        assert(!forbiddenRawKeys.has(key));
        visit(child);
      }
    };
    visit(ledger);
  }],
];

const argumentsList = process.argv.slice(2);
if (argumentsList.length === 1 && argumentsList[0] === "--emit-ledger") {
  process.stdout.write(analyzer.canonicalJson(buildRealLedger()));
} else if (argumentsList.length === 0) {
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
      `EXPECTED_FAIL_C2_1_ANALYZER_SLICE stage=${ACTIVE_STAGE} assertions=${assertions.length} pass=${pass} fail=${fail} internal_failures=0\n`,
    );
    process.exitCode = 1;
  } else {
    const { partialEvidence } = loadRealContext();
    const ledger = buildRealLedger();
    const mutationCount = runMutationProofs(ledger, partialEvidence);
    assert.equal(mutationCount, 14);
    process.stdout.write(
      "PASS_AUTHENTICATED_LIVE_ROUTE_SEMANTIC_ANALYZER assertions=20 mutations=14 fixtures=4 routes=28 methods=37 ifs=366 catches_with_binding=31 catches_optional=12 catches=43 nodes=409 imported_opaque_methods=15 route_local_methods=22 member_catch_calls=1 member_catch_counted=0 raw_source_output=0 failures=0 internal_failures=0\n",
    );
  }
} else {
  process.stdout.write(
    "FAIL_C2_1_ANALYZER_ARGUMENT failures=1 internal_failures=0\n",
  );
  process.exitCode = 1;
}
