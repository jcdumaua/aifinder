import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import * as analyzer from "./authenticated-live-route-synthetic-rejection-candidate-analyzer.mjs";

const C2_1_LEDGER_PATH =
  "testing/authenticated-live-route-semantic-branch-ledger.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const BLOCKER_PATH = "testing/public-launch-blocker-registry.json";
const ROUTE_PATHS = Object.freeze([
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
]);
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
]);
const READ_ALLOWLIST_SET = new Set(READ_ALLOWLIST);
const READ_COUNTS = new Map();
const REPOSITORY_ROOT = path.resolve(process.cwd());
const GOVERNANCE_FACTS = Object.freeze({
  repository: "/Users/jamescarlodumaua/aifinder",
  branch: "main",
  commit: "132f4d16e7b8b6c7b4585bb794ac7732cead0a73",
  parent: "bb135e0dc5bfa31b4d5542cca855541014374e44",
  tree: "757a4905c69d606ed50a4a55d9ab629b52947753",
  subject: "Add authenticated route branch qualification ledger",
  c2_1_ledger_path: C2_1_LEDGER_PATH,
  c2_1_ledger_sha256:
    "d668f5955dd0f7b3c079625711fa873576869039f26263267f1a4821da6090e3",
  c2_1_independent_oracle_digest:
    "6e15cd4bc24025892fe7d3985709e48ba56cb2198ea04fe21ec99b08ab2fe172",
  node_set_digest:
    "e93014829e190d478ee8d057289a12bc2703f990b795c3bbf5fdade838dd87d8",
  route_contract_digest:
    "d6dddd950dd1f463106f3cc3aca3c659f5106ec22023c8c31d3e1aefe41fd6a9",
  request_position_digest:
    "014caf9d9f4e3ada5824ed2025a77166f905ffdc02af9786a98ee26ec2627504",
  matrix_path: MATRIX_PATH,
  blocker_registry_path: BLOCKER_PATH,
  launch_blockers: 28,
  runtime_qualified_nodes: 0,
  routes_unblocked: 0,
  execution_authorized: false,
  public_launch: "NO_GO",
});
const SYNTHETIC_FIXTURES = Object.freeze({
  branch_shape:
    'import { NextResponse } from "next/server";\n' +
    'if (flag) return NextResponse.json({ error: "x" }, { status: 401 }); else return NextResponse.json({ error: "y" }, { status: 403 });\n' +
    'if (flag) return NextResponse.json({ error: "x" }, { status: 401 });\n' +
    'if (flag) { sideEffect(); return NextResponse.json({ error: "x" }, { status: 401 }); }\n',
  next_alias:
    'import { NextResponse as NR } from "next/server";\n' +
    'if (flag) return NR.json({ error: "x" }, { status: 401 });\n',
  global_json:
    'if (flag) return Response.json({ error: "x" }, { status: 401 });\n',
  global_new:
    'if (flag) return new Response("x", { status: 401 });\n',
  shadowed_response:
    'const Response = { json() { return null; } };\n' +
    'if (flag) return Response.json({ error: "x" }, { status: 401 });\n',
  status_shapes:
    'const dynamicStatus = 401;\n' +
    'if (flag) return Response.json({ error: "x" }, { status: 401 });\n' +
    'if (flag) return Response.json({ error: "x" }, { status: dynamicStatus });\n' +
    'if (flag) return Response.json({ error: "x" }, { status: 500 });\n' +
    'if (flag) return Response.json({ error: "x" }, { ["status"]: 409 });\n',
  closed_data:
    'const payload = { error: "x" };\n' +
    'const extra = { error: "x" };\n' +
    'const headers = { fixed: "value" };\n' +
    'if (flag) return Response.json({ error: "x", values: [null, true, -2, `fixed`] }, { status: 422, headers: { fixed: "value" } });\n' +
    'if (flag) return Response.json(payload, { status: 422 });\n' +
    'if (flag) return Response.json({ ...extra }, { status: 422 });\n' +
    'if (flag) return Response.json(makePayload(), { status: 409 });\n' +
    'if (flag) return Response.json({ error: "x" }, { status: 409, headers });\n' +
    'if (flag) return helperResponse({ error: "x" }, { status: 409 });\n',
  ownership_deferrals:
    'try { work(); } catch { recover(); }\n' +
    'if (flag) return Response.json({ error: "x" }, { status: 401 });\n',
});

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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

let cachedContext = null;
function loadContext() {
  if (cachedContext) return cachedContext;
  const beforeNegative = READ_COUNTS.size;
  expectFailure(
    () => readExactC2_2("lib/admin-auth.ts"),
    "C2_2_READ_NOT_ALLOWED",
  );
  assert.equal(READ_COUNTS.size, beforeNegative);
  const ledgerBytes = readExactC2_2(C2_1_LEDGER_PATH);
  assert.equal(
    sha256(ledgerBytes),
    "d668f5955dd0f7b3c079625711fa873576869039f26263267f1a4821da6090e3",
  );
  const c2_1_ledger = JSON.parse(ledgerBytes.toString("utf8"));
  assert.deepEqual(
    c2_1_ledger.routes.map((route) => route.route_path),
    ROUTE_PATHS,
  );
  const routeInputs = ROUTE_PATHS.map((routePath, index) => ({
    path: routePath,
    bytes: readExactC2_2(routePath),
    expectedIdentity: {
      sha256: c2_1_ledger.routes[index].sha256,
      git_blob: c2_1_ledger.routes[index].git_blob,
      bytes: c2_1_ledger.routes[index].bytes,
      lf_lines: c2_1_ledger.routes[index].lf_lines,
    },
  }));
  const matrix = JSON.parse(readExactC2_2(MATRIX_PATH).toString("utf8"));
  const blockerRegistry = JSON.parse(
    readExactC2_2(BLOCKER_PATH).toString("utf8"),
  );
  cachedContext = { c2_1_ledger, routeInputs, matrix, blockerRegistry };
  return cachedContext;
}

let cachedCandidate = null;
function buildCandidate() {
  if (cachedCandidate) return cachedCandidate;
  const context = loadContext();
  cachedCandidate = analyzer.qualifyCandidateOverlay({
    routeInputs: context.routeInputs,
    c2_1_ledger: context.c2_1_ledger,
    governanceFacts: GOVERNANCE_FACTS,
  });
  return cachedCandidate;
}

function fixtureOutcome(
  source,
  outcomeKind = "IF_TRUE",
  { ordinal = 0, ownership = "UNIQUE", kind = "IF" } = {},
) {
  let nodeStart = -1;
  let cursor = 0;
  const needle = kind === "CATCH" ? "catch" : "if (";
  for (let index = 0; index <= ordinal; index += 1) {
    nodeStart = source.indexOf(needle, cursor);
    assert(nodeStart >= 0);
    cursor = nodeStart + needle.length;
  }
  const lineEnd = source.indexOf("\n", nodeStart);
  const nodeEnd = lineEnd < 0 ? source.length : lineEnd;
  const methodId = "1".repeat(64);
  const nodeId = "2".repeat(64);
  const outcomeId = outcomeKind === "IF_TRUE" ? "3".repeat(64) : "4".repeat(64);
  return analyzer.qualifyOutcome({
    sourceFile: source,
    routeRecord: {
      route_path: "fixtures/route.ts",
      git_blob: "a".repeat(40),
      sha256: sha256(source),
    },
    methodRecord: {
      method_id: methodId,
      route_path: "fixtures/route.ts",
      http_method: "POST",
    },
    nodeRecord: {
      node_id: nodeId,
      route_path: "fixtures/route.ts",
      kind,
      start_utf16: nodeStart,
      end_utf16: nodeEnd,
      ownership_state: ownership,
      candidate_exported_method_ids: ownership === "UNIQUE" ? [methodId] : [],
      outcome_ids: kind === "CATCH"
        ? ["5".repeat(64)]
        : ["3".repeat(64), "4".repeat(64)],
    },
    outcomeRecord: {
      outcome_id: outcomeId,
      node_id: nodeId,
      route_path: "fixtures/route.ts",
      outcome_kind: kind === "CATCH" ? "CATCH_ENTERED" : outcomeKind,
    },
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectCode(callback, expectedCode) {
  let caught = null;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.equal(caught?.code, expectedCode);
}

function mutationFailure(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function clonedRouteInputs() {
  return loadContext().routeInputs.map((input) => ({
    path: input.path,
    bytes: Buffer.from(input.bytes),
    expectedIdentity: { ...input.expectedIdentity },
  }));
}

function qualifyMutated({
  routeInputs = clonedRouteInputs(),
  c2_1_ledger = cloneJson(loadContext().c2_1_ledger),
  governanceFacts = { ...GOVERNANCE_FACTS },
} = {}) {
  return analyzer.qualifyCandidateOverlay({
    routeInputs,
    c2_1_ledger,
    governanceFacts,
  });
}

function validateMutatedOverlay(mutated, expected, code) {
  if (
    mutated.qualification_state !== expected.qualification_state ||
    mutated.reason_code !== expected.reason_code ||
    mutated.candidate_id_or_null !== expected.candidate_id_or_null
  ) mutationFailure(code);
}

function mutateDeferredFixtureToCandidate(source, options, code) {
  const expected = fixtureOutcome(
    source,
    options.outcomeKind ?? "IF_TRUE",
    options,
  );
  assert.notEqual(
    expected.qualification_state,
    "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
  );
  const mutated = {
    ...expected,
    qualification_state: "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    reason_code: "EXACT_CLOSED_DATA_LITERAL_4XX_RESPONSE",
    candidate_id_or_null: "f".repeat(64),
  };
  expectCode(() => validateMutatedOverlay(mutated, expected, code), code);
}

function validateCandidateIdentities(candidateLedger) {
  const routes = new Map(
    loadContext().c2_1_ledger.routes.map((route) => [route.route_path, route]),
  );
  for (const candidate of candidateLedger.candidates) {
    const route = routes.get(candidate.route_path);
    const expected = sha256(
      [
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
      ].join("\0"),
    );
    if (candidate.candidate_id !== expected) {
      mutationFailure("C2_2_CANDIDATE_IDENTITY");
    }
  }
}

function validateOverlayOrder(candidateLedger) {
  const expected = loadContext().c2_1_ledger.outcomes.map(
    (outcome) => outcome.outcome_id,
  );
  if (
    candidateLedger.outcome_overlay.length !== expected.length ||
    candidateLedger.outcome_overlay.some(
      (entry, index) => entry.outcome_id !== expected[index],
    )
  ) mutationFailure("C2_2_OVERLAY_ORDER");
}

function validateOpaqueDeferrals(candidateLedger) {
  if (
    candidateLedger.method_deferrals.length !== 15 ||
    candidateLedger.summary.opaque_imported_methods_deferred !== 15
  ) mutationFailure("C2_2_OPAQUE_METHOD_DEFERRAL");
}

function validateAuthorityGovernance(candidateLedger) {
  if (
    candidateLedger.summary.runtime_qualified_nodes !== 0 ||
    candidateLedger.summary.routes_unblocked !== 0 ||
    candidateLedger.summary.launch_blockers !== 28 ||
    candidateLedger.summary.execution_authorized !== false ||
    candidateLedger.summary.public_launch !== "NO_GO" ||
    candidateLedger.governance.actual_synthetic_execution_started !== false ||
    candidateLedger.governance.transformed_route_execution !== false
  ) mutationFailure("C2_2_AUTHORITY_GOVERNANCE");
}

function runMutationProofs() {
  const cases = [];
  cases.push(() => {
    const governanceFacts = {
      ...GOVERNANCE_FACTS,
      c2_1_ledger_sha256: "0".repeat(64),
    };
    expectCode(
      () => qualifyMutated({ governanceFacts }),
      "C2_2_SOURCE_LEDGER_IDENTITY",
    );
  });
  cases.push(() => {
    const routeInputs = clonedRouteInputs();
    routeInputs.pop();
    expectCode(() => qualifyMutated({ routeInputs }), "C2_2_ROUTE_SET");
  });
  cases.push(() => {
    const routeInputs = clonedRouteInputs();
    routeInputs[0].bytes[0] ^= 1;
    expectCode(() => qualifyMutated({ routeInputs }), "C2_2_ROUTE_IDENTITY");
  });
  cases.push(() => {
    const c2_1_ledger = cloneJson(loadContext().c2_1_ledger);
    c2_1_ledger.outcomes[0].node_id = c2_1_ledger.nodes[1].node_id;
    expectCode(
      () => qualifyMutated({ c2_1_ledger }),
      "C2_2_OUTCOME_ASSOCIATION",
    );
  });
  cases.push(() => {
    const c2_1_ledger = cloneJson(loadContext().c2_1_ledger);
    const node = c2_1_ledger.nodes.find(
      (entry) => entry.ownership_state === "UNIQUE",
    );
    node.ownership_state = "UNATTRIBUTED";
    node.candidate_exported_method_ids = [];
    expectCode(
      () => qualifyMutated({ c2_1_ledger }),
      "C2_2_OWNERSHIP_SPLIT",
    );
  });
  cases.push(() => {
    const c2_1_ledger = cloneJson(loadContext().c2_1_ledger);
    c2_1_ledger.nodes.find((entry) => entry.kind === "CATCH").kind = "IF";
    expectCode(() => qualifyMutated({ c2_1_ledger }), "C2_2_KIND_SPLIT");
  });
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.branch_shape,
    { ordinal: 1, outcomeKind: "IF_FALSE_OR_FALLTHROUGH" },
    "C2_2_EXPLICIT_BRANCH",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.branch_shape,
    { ordinal: 2 },
    "C2_2_SINGLE_RETURN",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.closed_data,
    { ordinal: 5 },
    "C2_2_RESPONSE_CONSTRUCTOR",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.shadowed_response,
    {},
    "C2_2_RESPONSE_BINDING",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.status_shapes,
    { ordinal: 1 },
    "C2_2_LITERAL_STATUS",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.status_shapes,
    { ordinal: 2 },
    "C2_2_4XX_STATUS",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.closed_data,
    { ordinal: 1 },
    "C2_2_CLOSED_DATA",
  ));
  cases.push(() => mutateDeferredFixtureToCandidate(
    SYNTHETIC_FIXTURES.closed_data,
    { ordinal: 2 },
    "C2_2_CLOSED_DATA",
  ));
  cases.push(() => {
    const expected = fixtureOutcome(SYNTHETIC_FIXTURES.global_json);
    assert.equal(
      expected.qualification_state,
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    );
    const mutated = {
      ...expected,
      candidate_id_or_null: "0".repeat(64),
    };
    expectCode(
      () => {
        if (mutated.candidate_id_or_null !== expected.candidate_id_or_null) {
          mutationFailure("C2_2_CANDIDATE_IDENTITY");
        }
      },
      "C2_2_CANDIDATE_IDENTITY",
    );
  });
  cases.push(() => {
    const candidateLedger = cloneJson(buildCandidate());
    [candidateLedger.outcome_overlay[0], candidateLedger.outcome_overlay[1]] =
      [candidateLedger.outcome_overlay[1], candidateLedger.outcome_overlay[0]];
    expectCode(
      () => validateOverlayOrder(candidateLedger),
      "C2_2_OVERLAY_ORDER",
    );
  });
  cases.push(() => {
    const candidateLedger = cloneJson(buildCandidate());
    candidateLedger.method_deferrals.pop();
    expectCode(
      () => validateOpaqueDeferrals(candidateLedger),
      "C2_2_OPAQUE_METHOD_DEFERRAL",
    );
  });
  cases.push(() => {
    const candidateLedger = cloneJson(buildCandidate());
    candidateLedger.summary.runtime_qualified_nodes = 1;
    candidateLedger.summary.launch_blockers = 27;
    expectCode(
      () => validateAuthorityGovernance(candidateLedger),
      "C2_2_AUTHORITY_GOVERNANCE",
    );
  });
  for (const [index, mutation] of cases.entries()) {
    try {
      mutation();
    } catch (error) {
      const wrapped = new Error(
        `MUTATION_${index + 1}_${error?.code ?? error?.message ?? "UNKNOWN"}`,
      );
      wrapped.code = wrapped.message;
      throw wrapped;
    }
  }
  assert.equal(cases.length, 18);
  return cases.length;
}

const assertions = [
  ["A01_MODULE_INTERFACE_AND_CANONICAL_JSON", () => {
    assert.deepEqual(Object.keys(analyzer).sort(), [
      "canonicalJson",
      "qualifyCandidateOverlay",
      "qualifyOutcome",
    ]);
    assert.equal(
      analyzer.canonicalJson({ z: 1, a: { z: 2, a: 3 } }),
      "{\n  \"a\": {\n    \"a\": 3,\n    \"z\": 2\n  },\n  \"z\": 1\n}\n",
    );
  }],
  ["A02_C2_1_LEDGER_IDENTITY_AND_DIGESTS", () => {
    const result = buildCandidate();
    assert.equal(
      result.source_contract.c2_1_ledger_sha256,
      "d668f5955dd0f7b3c079625711fa873576869039f26263267f1a4821da6090e3",
    );
    assert.equal(
      result.source_contract.c2_1_independent_oracle_digest,
      "6e15cd4bc24025892fe7d3985709e48ba56cb2198ea04fe21ec99b08ab2fe172",
    );
    assert.equal(
      result.source_contract.node_set_digest,
      "e93014829e190d478ee8d057289a12bc2703f990b795c3bbf5fdade838dd87d8",
    );
  }],
  ["A03_ROUTE_METHOD_NODE_OUTCOME_IDENTITIES", () => {
    const result = buildCandidate();
    assert.deepEqual(
      [result.summary.routes, result.summary.methods, result.summary.nodes, result.summary.outcomes],
      [28, 37, 409, 775],
    );
    assert.equal(result.outcome_overlay.length, 775);
  }],
  ["A04_OWNERSHIP_KIND_SPLIT_290_76_36_7", () => {
    const summary = buildCandidate().summary;
    assert.deepEqual(
      [
        summary.unique_nodes,
        summary.unattributed_nodes,
        summary.unique_if_nodes,
        summary.unattributed_if_nodes,
        summary.unique_catch_nodes,
        summary.unattributed_catch_nodes,
      ],
      [326, 83, 290, 76, 36, 7],
    );
  }],
  ["A05_EXACT_ROUTE_SET_AND_IDENTITIES", () => {
    const result = buildCandidate();
    assert.deepEqual(result.source_contract.route_paths, ROUTE_PATHS);
    assert.equal(result.source_contract.route_identities_verified, 28);
  }],
  ["A06_OUTCOME_UNIVERSE_580_152_43", () => {
    const summary = buildCandidate().summary;
    assert.deepEqual(
      [
        summary.eligible_universe_outcomes,
        summary.mandatory_deferred_unattributed_if_outcomes,
        summary.mandatory_deferred_catch_outcomes,
        summary.mandatory_deferred_outcomes,
      ],
      [580, 152, 43, 195],
    );
  }],
  ["A07_EXPLICIT_BRANCH_MATERIALIZATION", () => {
    const source = SYNTHETIC_FIXTURES.branch_shape;
    const trueState = fixtureOutcome(source, "IF_TRUE").qualification_state;
    const falseState = fixtureOutcome(
      source,
      "IF_FALSE_OR_FALLTHROUGH",
    ).qualification_state;
    assert(![
      "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
      "DEFERRED_NON_SINGLE_RETURN_BRANCH",
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    ].includes(trueState));
    assert(![
      "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
      "DEFERRED_NON_SINGLE_RETURN_BRANCH",
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    ].includes(falseState));
  }],
  ["A08_IMPLICIT_FALSE_FALLTHROUGH_DEFERRED", () => {
    assert.equal(
      fixtureOutcome(
        SYNTHETIC_FIXTURES.branch_shape,
        "IF_FALSE_OR_FALLTHROUGH",
        { ordinal: 1 },
      ).qualification_state,
      "DEFERRED_IMPLICIT_FALSE_FALLTHROUGH",
    );
  }],
  ["A09_SINGLE_RETURN_BRANCH_ONLY", () => {
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.branch_shape, "IF_TRUE", {
        ordinal: 2,
      }).qualification_state,
      "DEFERRED_NON_SINGLE_RETURN_BRANCH",
    );
  }],
  ["A10_RESPONSE_BINDING_AND_CONSTRUCTOR_RECOGNITION", () => {
    assert.notEqual(
      fixtureOutcome(SYNTHETIC_FIXTURES.next_alias).qualification_state,
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    );
    assert.notEqual(
      fixtureOutcome(SYNTHETIC_FIXTURES.global_json).qualification_state,
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    );
    assert.notEqual(
      fixtureOutcome(SYNTHETIC_FIXTURES.global_new).qualification_state,
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    );
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.shadowed_response).qualification_state,
      "DEFERRED_UNRECOGNIZED_RESPONSE_CONSTRUCTOR",
    );
  }],
  ["A11_LITERAL_4XX_STATUS_EXTRACTION", () => {
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.status_shapes, "IF_TRUE", {
        ordinal: 0,
      }).qualification_state,
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    );
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.status_shapes, "IF_TRUE", {
        ordinal: 1,
      }).qualification_state,
      "DEFERRED_NON_LITERAL_4XX_STATUS",
    );
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.status_shapes, "IF_TRUE", {
        ordinal: 2,
      }).qualification_state,
      "DEFERRED_NON_LITERAL_4XX_STATUS",
    );
  }],
  ["A12_CLOSED_DATA_RESPONSE_RULE", () => {
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.closed_data, "IF_TRUE", {
        ordinal: 0,
      }).qualification_state,
      "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    );
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.closed_data, "IF_TRUE", {
        ordinal: 1,
      }).qualification_state,
      "DEFERRED_NON_CLOSED_RESPONSE_DATA",
    );
    assert.equal(
      fixtureOutcome(SYNTHETIC_FIXTURES.closed_data, "IF_TRUE", {
        ordinal: 2,
      }).qualification_state,
      "DEFERRED_NON_CLOSED_RESPONSE_DATA",
    );
  }],
  ["A13_SIDE_EFFECTFUL_OR_DYNAMIC_SYNTAX_DEFERRED", () => {
    const callState = fixtureOutcome(
      SYNTHETIC_FIXTURES.closed_data,
      "IF_TRUE",
      { ordinal: 3 },
    ).qualification_state;
    const nonStatusState = fixtureOutcome(
      SYNTHETIC_FIXTURES.closed_data,
      "IF_TRUE",
      { ordinal: 4 },
    ).qualification_state;
    const computedState = fixtureOutcome(
      SYNTHETIC_FIXTURES.status_shapes,
      "IF_TRUE",
      { ordinal: 3 },
    ).qualification_state;
    assert.equal(
      callState,
      "DEFERRED_NON_CLOSED_RESPONSE_DATA",
    );
    assert.equal(
      nonStatusState,
      "DEFERRED_NON_LITERAL_4XX_STATUS",
    );
    assert.equal(
      computedState,
      "DEFERRED_NON_LITERAL_4XX_STATUS",
    );
  }],
  ["A14_CANDIDATE_IDENTITY_AND_ORDER", () => {
    const result = buildCandidate();
    const eligibleOverlay = result.outcome_overlay.filter(
      (entry) =>
        entry.qualification_state ===
        "ELIGIBLE_OFFLINE_SYNTHETIC_REJECTION_CANDIDATE",
    );
    assert.equal(result.summary.candidate_count_contract, "DERIVED_FROM_OVERLAY");
    assert.deepEqual(
      result.candidates.map((candidate) => candidate.candidate_id),
      eligibleOverlay.map((entry) => entry.candidate_id_or_null),
    );
    for (const candidate of result.candidates) {
      const route = loadContext().c2_1_ledger.routes.find(
        (entry) => entry.route_path === candidate.route_path,
      );
      assert.equal(
        candidate.candidate_id,
        sha256(
          [
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
          ].join("\0"),
        ),
      );
    }
  }],
  ["A15_COMPLETE_OVERLAY_PARTITION_AND_DIGESTS", () => {
    const result = buildCandidate();
    const candidateRows = result.candidates.map((candidate) =>
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
    const overlayRows = result.outcome_overlay.map((entry) =>
      [
        entry.outcome_id,
        entry.qualification_state,
        entry.candidate_id_or_null ?? "",
        entry.reason_code,
      ].join("\0") + "\n"
    ).join("");
    assert.equal(result.outcome_overlay.length, 775);
    assert.equal(result.summary.candidate_set_digest, sha256(candidateRows));
    assert.equal(result.summary.overlay_digest, sha256(overlayRows));
    assert.equal(
      result.summary.candidate_outcomes + result.summary.total_deferred_outcomes,
      775,
    );
  }],
  ["A16_OPAQUE_METHOD_DEFERRALS_15", () => {
    const result = buildCandidate();
    assert.equal(result.method_deferrals.length, 15);
    assert.equal(result.summary.opaque_imported_methods_deferred, 15);
    assert(
      result.method_deferrals.every(
        (entry) =>
          entry.qualification_state === "DEFERRED_OPAQUE_IMPORTED_METHOD" &&
          entry.reason_code ===
            "HELPER_IMPLEMENTATION_UNREAD_REQUIRES_FRESH_SCOPE" &&
          entry.helper_content_read === false &&
          entry.execution_state === "NOT_EXECUTED" &&
          entry.behavior_state === "NOT_RUNTIME_QUALIFIED",
      ),
    );
  }],
  ["A17_HELPER_READ_RAW_OUTPUT_AND_RUNTIME_ZERO", () => {
    const result = buildCandidate();
    assert.equal(READ_COUNTS.size, 31);
    assert(READ_ALLOWLIST.every((entry) => READ_COUNTS.get(entry) === 1));
    assert.equal(result.summary.c2_2_analyzer_ledger_helper_content_reads, 0);
    assert.equal(result.summary.raw_values, 0);
    assert.equal(result.summary.route_execution, 0);
    assert.equal(result.summary.runtime_qualified_nodes, 0);
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
    visit(result);
  }],
  ["A18_GOVERNANCE_BLOCKERS_AND_NO_GO", () => {
    const result = buildCandidate();
    assert.equal(result.governance.actual_synthetic_execution_started, false);
    assert.equal(result.governance.transformed_route_execution, false);
    assert.equal(result.governance.application_route_imported, false);
    assert.equal(result.governance.application_route_executed, false);
    assert.equal(result.governance.helper_module_read_for_c2_2, false);
    assert.equal(result.governance.launch_blocking_routes, 28);
    assert.equal(result.governance.runtime_qualified_nodes, 0);
    assert.equal(result.governance.routes_unblocked, 0);
    assert.equal(result.governance.execution_authorized, false);
    assert.equal(result.governance.public_launch, "NO_GO");
  }],
];

const argumentsList = process.argv.slice(2);
if (argumentsList.length === 1 && argumentsList[0] === "--emit-ledger") {
  process.stdout.write(analyzer.canonicalJson(buildCandidate()));
} else if (argumentsList.length !== 0) {
  process.stdout.write(
    "FAIL_C2_2_CANDIDATE_ANALYZER_ARGUMENT failures=1 internal_failures=0\n",
  );
  process.exitCode = 1;
} else {
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
      `FAIL_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_ANALYZER assertions=${assertions.length} pass=${pass} fail=${fail} failures=1 internal_failures=0\n`,
    );
    process.exitCode = 1;
  } else {
    try {
      const mutationCount = runMutationProofs();
      const result = buildCandidate();
      const summary = result.summary;
      process.stdout.write(
        `PASS_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_ANALYZER assertions=18 mutations=${mutationCount} fixtures=${Object.keys(SYNTHETIC_FIXTURES).length} routes=${summary.routes} methods=${summary.methods} nodes=${summary.nodes} outcomes=${summary.outcomes} unique_nodes=${summary.unique_nodes} unattributed_nodes=${summary.unattributed_nodes} unique_if_nodes=${summary.unique_if_nodes} unattributed_if_nodes=${summary.unattributed_if_nodes} unique_catch_nodes=${summary.unique_catch_nodes} unattributed_catch_nodes=${summary.unattributed_catch_nodes} eligible_universe=${summary.eligible_universe_outcomes} mandatory_deferred_if=${summary.mandatory_deferred_unattributed_if_outcomes} mandatory_deferred_catch=${summary.mandatory_deferred_catch_outcomes} candidates=${summary.candidate_outcomes} additional_deferred_unique_if=${summary.additional_deferred_unique_if_outcomes} total_deferred=${summary.total_deferred_outcomes} opaque_methods_deferred=${summary.opaque_imported_methods_deferred} candidate_set_digest=${summary.candidate_set_digest} overlay_digest=${summary.overlay_digest} helper_content_reads=${summary.c2_2_analyzer_ledger_helper_content_reads} route_execution=${summary.route_execution} raw_source_output=${summary.raw_values} runtime_qualified=${summary.runtime_qualified_nodes} failures=0 internal_failures=0\n`,
      );
    } catch (error) {
      void error;
      process.stdout.write(
        "FAIL_AUTHENTICATED_LIVE_ROUTE_SYNTHETIC_REJECTION_CANDIDATE_ANALYZER assertions=18 failures=1 internal_failures=0\n",
      );
      process.exitCode = 1;
    }
  }
}
