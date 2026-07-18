#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const RUNS_PATH = "app/api/admin/discovery/runs/route.ts";
const QUEUE_PATH = "app/api/admin/discovery/discovered-tools/route.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-read-route-diagnostic-logging-static-assertions.mjs";
const RUNS_CALLER_PATH =
  "components/admin/discovery/discovery-runs-table.tsx";
const QUEUE_CALLER_PATH =
  "components/admin/discovery/discovery-queue-table.tsx";

const BASELINE_HEAD = "318e0dad4a05bd2233745d99b0803606edfd1b09";
const BASELINE_HASHES = new Map([
  [RUNS_PATH, "5080bfb238e338781e9c970cd8bafe4f2361e52e71a5e5b3d64ea8ecf2c47f2c"],
  [QUEUE_PATH, "04f8535ea4c532ffd65f5e7a85661202426f77748ef2fd9b9d03a85e50879936"],
  [CATALOG_PATH, "e9db4fc77b8183bcfd1b74a902aa95068849608e211271a5e2c970cc6de2ff0e"],
]);

const PROTECTED_HASHES = new Map([
  ["lib/admin-auth.ts", "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc"],
  ["lib/admin-rate-limit.ts", "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b"],
  ["lib/supabase-admin.ts", "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae"],
  ["lib/admin-audit-log.ts", "545ebc99f886918fc579b0b050cff12ad16ca283bbb3437e7505a27bd86bd6e3"],
  ["lib/tool-validation.ts", "8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba"],
  ["lib/tool-categories.ts", "5d7ae105a6539b070cdc214316ec37f2f2970c0a377ceef761e159d3cb619046"],
  ["lib/discovery-run-results-review.ts", "36a25543c169cfeb689240046ace3cbe23e37357b07d5d70f107875da7205f9a"],
  ["lib/discovery-static-html-evidence-audit-review.ts", "983f1b701e0537cbd41a993bbd10711e1782d18261158058a8bfa0829339ac15"],
  ["lib/discovery-static-html-evidence-results-review.ts", "b49032adeca4dd203fb08852c79e454f09dd2080bfacbcaa3594c57444d0ea9e"],
  [RUNS_CALLER_PATH, "43407b086d5a245980b338863131cb327f1bb78abbed2c27e4574b0bf45b4218"],
  [QUEUE_CALLER_PATH, "104a1aeaff3c799d7b0e1235989a98c4708dd89ff888458df85e49b45bbbc2af"],
  ["testing/discovery-run-results-review.test.mjs", "f446c75e4dba663481e5adc9fa16a3c1933cb9cb4bcfcc91908724316755c26e"],
  ["testing/discovery-static-html-evidence-results-review.test.mjs", "7123e47806ad6cc22183bad4e8c07cc46877d3327ef0874c23c19a661f33d4db"],
  ["testing/discovery-static-html-evidence-audit-review.test.mjs", "b9528f0a077ea1beefdf54a6c891af245f28aed6f6e554c066e6966a2c5715d4"],
  ["testing/admin-shell-supabase-read-hardening.test.mjs", "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  ["app/api/admin/upload-logo/route.ts", "c3998d36a8308fba27390613efe24c07cd4387d5eb2ba01e0f317f0005d692d7"],
  ["app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts", "f42eb9f67823bcd5e0797e7d52991eb64fe8a4caec72f06c0cc52041a1a4e3fb"],
  ["testing/discovery-candidate-decision-route-export-contract-static-assertions.mjs", "ad3d3cdd2773eba2aa62cd04b14a194c77e110699591d7be302414c13934f59d"],
  ["testing/admin-mutation-diagnostic-logging-static-assertions.mjs", "308029c59deb892b74eb6df8c606f0f2256dd8aab6ec702c315e9cd0a0b48250"],
  ["lib/discovery/discovery-candidate-decision-admin.ts", "6a72897846ae6276523726bc5f9fb99b7de6b7f9db386c5b3cf0655dd0905b96"],
  ["lib/discovery/discovery-candidate-decision-validation.ts", "922d9d3b70a6975c42725b7708f16ce9de2ea37c4a7111ad8c4919528ca17339"],
  ["lib/supabase/database.types.ts", "7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c"],
  ["testing/discovery-candidate-decision-api-static-assertions.mjs", "71ea505fd0ddd061b926d1976ed8d0a5fa2729ef2d59ad4bb91d5ed8114c4f8a"],
  ["app/api/upload-logo/route.ts", "7398b4241f711a9e69c71168233980f358852c2a2e4e5e631fab4339634feabf"],
  ["components/admin/admin-dashboard-client.tsx", "86caa4376bde0084311595010c582b6c3aab83db98887121d8db2c59eb8aae2f"],
  ["supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql", "7b3cbb1234aa0e492f366baa5e340bda174b619ede1cfb48616658a0f631651f"],
  ["supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql", "59535ac5db55e3d083a4c83094e2aabd089046044320d6391833957ea73b719c"],
  ["supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql", "4479be746e7aeb425b62c308d8f0fda04414d743a02e3ba7b200e50a6ee46cc4"],
  ["app/api/admin/login/route.ts", "b5e2c7908a26cfbbaab050436bd81943ae33c1201f8e5f92a9305efba0fe11e2"],
  ["app/api/admin/audit-logs/route.ts", "7b53e0ddccbd0cad69ed28fd39cb206b547df775696f78522d5cd885adef9295"],
  ["testing/audit-logs-route-security-static-assertions.mjs", "f7d79968e5aac774a0a01cd11fed783f2bc53d9a3b5f63030539ae26dea83eac"],
  ["app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts", "b14d5915778be4449eccea9b2269ab02c5158fd8ea9b553fe78a7717ab0029e0"],
  ["app/api/admin/discovery/candidate-extraction/invoke/route.ts", "7d7692aaf4751b5129cf0c22a2ef7aa55a6adcfddd3e8f2b3b080b0f291075e4"],
  ["app/api/admin/discovery/candidate-extraction/invoke/handler.ts", "bcf390b1e7154adee85d15b96ce5ed85c57e08136d290a880e7907869c8c5c41"],
  ["testing/discovery-candidate-extraction-invocation-route.test.mjs", "b904185546f38878d2a869a554d801337357a30c8649218a6902c02fcab2f668"],
  ["testing/discovery-candidate-extraction-invoke-route-export-contract-static-assertions.mjs", "cca9474c1e1168d3aa8e29b5fa824ae504ffb653137afa2c655d143a66e75af4"],
  ["app/api/admin/discovery/candidate-staging-queue/handler.ts", "9a6b16457620721c57e33d0e9b4c4ee4e46abe9bbce81aa7a0d9809d80ae3754"],
  ["app/api/admin/discovery/candidate-staging-queue/route.ts", "7dd883c20bf1559a1ff7139b0347314c533c9e45e2c36cf7dd5465481abe8741"],
  ["testing/discovery-candidate-staging-queue-api-read-route.test.mjs", "ce80eec655b466158f906dec382462998638c21fb43a422a53c219ddc3a54a99"],
  ["testing/discovery-candidate-staging-queue-read-route-export-contract-static-assertions.mjs", "7d451328501768347df78c4b2f6cc22292b105fa359e104f7c6c34ebd9c6cf36"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/route.ts", "c1005ed25788bb0f3499464bbb4add13c9c33d87bd6b33fc38dfc4007a4fef64"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts", "d4caae0a42723ecba1a19248f27525105faec4eb568201a5ee4fe666d7add0bf"],
  ["testing/discovery-candidate-preview-route.test.mjs", "2f1f0d183cdf566876e02ccbbd2b7800c7080e65cb39c12bbd82adfaa39fe5f1"],
  ["testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs", "a7dc69efc47dce2bae1d206ca6ee32d21ef4e3f096ee604fa57e9c3b7aa1363f"],
  ["testing/discovery-candidate-preview-route-export-contract-static-assertions.mjs", "32ca45d158a547a6cc66100d0975e1697e139e0cf9a90ebff1ef05c94b7b4ae3"],
]);

const GOVERNANCE_HASHES = new Map([
  ["docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md", "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"],
  ["docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md", "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"],
  ["docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md", "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"],
  ["docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md", "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"],
  ["docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md", "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"],
]);

const EXPECTED_RUNS_IMPORTS = [
  "server-only",
  "next/server",
  "../../../../../lib/admin-auth",
  "../../../../../lib/discovery-run-results-review",
  "../../../../../lib/discovery-static-html-evidence-audit-review",
  "../../../../../lib/discovery-static-html-evidence-results-review",
  "../../../../../lib/supabase-admin",
];
const EXPECTED_QUEUE_IMPORTS = [
  "server-only",
  "next/server",
  "../../../../../lib/admin-auth",
  "../../../../../lib/supabase-admin",
];
const EXPECTED_EXPORTS = new Set(["runtime", "dynamic", "GET"]);
const RUNS_EVENTS = new Map([
  ["discovery_runs_unauthorized", "warn"],
  ["discovery_runs_load_failed", "error"],
  ["discovery_run_audit_events_load_failed", "error"],
]);
const QUEUE_EVENTS = new Map([
  ["discovered_tools_queue_unauthorized", "warn"],
  ["discovered_tools_queue_load_failed", "error"],
  ["discovered_tools_queue_sources_load_failed", "error"],
  ["discovered_tools_queue_runs_load_failed", "error"],
  ["discovered_tools_queue_duplicates_load_failed", "error"],
]);

function fail(id, reason) {
  process.stderr.write(`${id} fails because ${reason}\n`);
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const text = readFileSync(absolutePath, "utf8");
  return {
    absolutePath,
    relativePath,
    text,
    sourceFile: ts.createSourceFile(
      absolutePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    ),
  };
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

function compact(value) {
  return value.replace(/\s+/g, "");
}

function setsEqual(actual, expected) {
  return (
    actual.size === expected.size &&
    [...actual].every((value) => expected.has(value))
  );
}

function stringLiteral(node) {
  return node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
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

function topLevelFunction(record, name) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === name,
    ) ?? null
  );
}

function variableDeclaration(root, name) {
  return (
    collect(
      root,
      (node) =>
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name,
    )[0] ?? null
  );
}

function exportedNames(record) {
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    }
  }
  return names;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = stringLiteral(statement.moduleSpecifier);
    if (moduleName === null) continue;
    modules.push(moduleName);
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

function serverOnlyIsFirst(record) {
  const statement = record.sourceFile.statements[0];
  return Boolean(
    statement &&
      ts.isImportDeclaration(statement) &&
      !statement.importClause &&
      stringLiteral(statement.moduleSpecifier) === "server-only",
  );
}

function initializerString(record, variableName) {
  const declaration = variableDeclaration(record.sourceFile, variableName);
  return stringLiteral(declaration?.initializer);
}

function consoleSignatures(record) {
  return collect(record.sourceFile, (node) =>
    Boolean(
      ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(record.sourceFile) === "console",
    ),
  ).map((call) => ({
    call,
    method: call.expression.name.text,
    args: [...call.arguments],
  }));
}

function exactConsoleContract(record, expectedEvents) {
  const signatures = consoleSignatures(record);
  return (
    signatures.length === expectedEvents.size &&
    signatures.every((signature, index) => {
      const [event, severity] = [...expectedEvents][index];
      return (
        signature.method === severity &&
        signature.args.length === 1 &&
        stringLiteral(signature.args[0]) === event
      );
    })
  );
}

function setLiteralValues(record, variableName) {
  const declaration = variableDeclaration(record.sourceFile, variableName);
  const initializer = declaration?.initializer;
  if (!initializer || !ts.isNewExpression(initializer)) return new Set();
  const values = initializer.arguments?.[0];
  if (!values || !ts.isArrayLiteralExpression(values)) return new Set();
  return new Set(values.elements.map(stringLiteral).filter(Boolean));
}

function selectProjection(call) {
  const argument = call.arguments[0];
  if (stringLiteral(argument) !== null) return stringLiteral(argument);
  if (
    !argument ||
    !ts.isCallExpression(argument) ||
    !ts.isPropertyAccessExpression(argument.expression) ||
    argument.expression.name.text !== "join" ||
    stringLiteral(argument.arguments[0]) !== ", " ||
    !ts.isArrayLiteralExpression(argument.expression.expression)
  ) {
    return null;
  }
  return argument.expression.expression.elements.map(stringLiteral);
}

function fromTables(root) {
  return callsNamed(root, "from").map((call) => stringLiteral(call.arguments[0]));
}

function propertyMap(objectLiteral) {
  const properties = new Map();
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) {
    return properties;
  }
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : property.name.getText();
      properties.set(name, property.initializer);
    }
  }
  return properties;
}

function hasAncestor(node, predicate) {
  let current = node.parent;
  while (current) {
    if (predicate(current)) return true;
    current = current.parent;
  }
  return false;
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function execGit(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function checkIds(record) {
  return new Set(
    callsNamed(record.sourceFile, "check")
      .map((call) => stringLiteral(call.arguments[0]))
      .filter(Boolean),
  );
}

function expectedIds(count) {
  return new Set(
    Array.from(
      { length: count },
      (_, index) => `A${String(index + 1).padStart(2, "0")}`,
    ),
  );
}

function mode(relativePath) {
  return statSync(path.join(REPO_ROOT, relativePath)).mode & 0o777;
}

// A01 deliberately reads only the runs route. No other repository source is
// read until this first-statement server-only boundary has passed.
const runs = parseFile(RUNS_PATH);
check(
  "A01",
  serverOnlyIsFirst(runs),
  `${RUNS_PATH} does not begin with import "server-only".`,
);

const queue = parseFile(QUEUE_PATH);
check(
  "A02",
  serverOnlyIsFirst(queue),
  `${QUEUE_PATH} does not begin with import "server-only".`,
);

check(
  "A03",
  setsEqual(exportedNames(runs), EXPECTED_EXPORTS) &&
    setsEqual(exportedNames(queue), EXPECTED_EXPORTS) &&
    initializerString(runs, "runtime") === "nodejs" &&
    initializerString(queue, "runtime") === "nodejs" &&
    initializerString(runs, "dynamic") === "force-dynamic" &&
    initializerString(queue, "dynamic") === "force-dynamic",
  "the exact GET-only App Router export ceilings or runtime values changed.",
);

const runsImports = importDetails(runs);
const queueImports = importDetails(queue);
check(
  "A04",
  JSON.stringify(runsImports.modules) === JSON.stringify(EXPECTED_RUNS_IMPORTS) &&
    JSON.stringify(queueImports.modules) === JSON.stringify(EXPECTED_QUEUE_IMPORTS) &&
    setsEqual(
      runsImports.names,
      new Set([
        "NextResponse",
        "verifyAdminSession",
        "normalizeManualMetadataFetchAuditEvents",
        "normalizeManualStaticHtmlEvidenceAuditEvents",
        "normalizeManualStaticHtmlEvidenceStats",
        "supabaseAdmin",
      ]),
    ) &&
    setsEqual(
      queueImports.names,
      new Set(["NextResponse", "verifyAdminSession", "supabaseAdmin"]),
    ) &&
    ![runs.text, queue.text].some(
      (text) => text.includes('"use client"') || text.includes("'use client'"),
    ),
  "an authorized import ceiling or server-only module boundary changed.",
);

const runsGet = topLevelFunction(runs, "GET");
const queueGet = topLevelFunction(queue, "GET");
function authenticationPrecedesReads(getFunction) {
  if (!getFunction) return false;
  const authCalls = callsNamed(getFunction, "verifyAdminSession");
  const urlReads = collect(
    getFunction,
    (node) =>
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "URL",
  );
  const searchReads = callsNamed(getFunction, "get").filter(
    (call) =>
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.expression.getText() === "searchParams",
  );
  const validationCalls = [
    ...callsNamed(getFunction, "has"),
    ...callsNamed(getFunction, "test"),
  ];
  const queryCalls = callsNamed(getFunction, "from");
  const privilegedIdentifiers = collect(
    getFunction,
    (node) => ts.isIdentifier(node) && node.text === "supabaseAdmin",
  );
  const normalizerCalls = collect(
    getFunction,
    (node) =>
      ts.isCallExpression(node) &&
      [
        "normalizeManualMetadataFetchAuditEvents",
        "normalizeManualStaticHtmlEvidenceAuditEvents",
        "normalizeManualStaticHtmlEvidenceStats",
      ].includes(callName(node)),
  );
  const protectedNodes = [
    ...urlReads,
    ...searchReads,
    ...validationCalls,
    ...queryCalls,
    ...privilegedIdentifiers,
    ...normalizerCalls,
  ];
  return (
    authCalls.length === 1 &&
    urlReads.length === 1 &&
    searchReads.length > 0 &&
    validationCalls.length > 0 &&
    queryCalls.length > 0 &&
    privilegedIdentifiers.length > 0 &&
    protectedNodes.every((node) => authCalls[0].end < node.pos)
  );
}
check(
  "A05",
  authenticationPrecedesReads(runsGet) && authenticationPrecedesReads(queueGet),
  "session verification no longer precedes URL parsing, validation, query construction, and privileged reads.",
);

function responseHelperIsProtected(record) {
  const helper = topLevelFunction(record, "jsonResponse");
  if (!helper) return false;
  const helperText = compact(helper.getText(record.sourceFile));
  return (
    helper.parameters.length === 2 &&
    helper.parameters[1].initializer?.getText(record.sourceFile) === "200" &&
    helperText.includes(
      'NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",},})',
    )
  );
}
check(
  "A06",
  Boolean(runsGet && queueGet) &&
    compact(runsGet.getText(runs.sourceFile)).includes(
      'returnjsonResponse({error:"Unauthorized"},401)',
    ) &&
    compact(queueGet.getText(queue.sourceFile)).includes(
      'returnjsonResponse({error:"Unauthorized"},401)',
    ) &&
    responseHelperIsProtected(runs) &&
    responseHelperIsProtected(queue),
  "the unauthorized body, 401 status, no-store header, or nosniff header changed.",
);

check(
  "A07",
  exactConsoleContract(runs, RUNS_EVENTS),
  "the runs route does not contain exactly its three fixed one-literal events with required severities.",
);

check(
  "A08",
  exactConsoleContract(queue, QUEUE_EVENTS),
  "the discovered-tools route does not contain exactly its five fixed one-literal events with required severities.",
);

const allConsoleSignatures = [
  ...consoleSignatures(runs),
  ...consoleSignatures(queue),
];
const forbiddenConsoleData =
  /(?:\.message|adminSession\.errors|error_log|hostname|failure_reason|stack|cause|details|hint|code|credential|secret|searchParams|request\.|sourceId|runIds?|toolIds?|metadata)/i;
check(
  "A09",
  allConsoleSignatures.length === 8 &&
    allConsoleSignatures.every(
      ({ args }) => args.length === 1 && stringLiteral(args[0]) !== null,
    ) &&
    !allConsoleSignatures.some(({ call }) =>
      forbiddenConsoleData.test(call.getText()),
    ),
  "a selected console call contains a dynamic diagnostic, request, session, identifier, row, state, credential, or secret argument.",
);

const runsGetText = compact(runsGet?.getText(runs.sourceFile) ?? "");
check(
  "A10",
  runsGetText.includes(
    'returnjsonResponse({error:"Invalidstatusparameter."},400)',
  ) &&
    runsGetText.includes(
      'returnjsonResponse({error:"Failedtofetchdiscoveryruns."},500)',
    ) &&
    callsNamed(runsGet, "jsonResponse").filter(
      (call) => call.arguments.length === 2,
    ).length === 3,
  "the runs invalid-status or main database-failure response body or status changed.",
);

const queueGetText = compact(queueGet?.getText(queue.sourceFile) ?? "");
const expectedQueueFailures = [
  'returnjsonResponse({error:"Invalidstatusparameter."},400)',
  'returnjsonResponse({error:"Invalidsource_idparameter."},400)',
  'returnjsonResponse({error:"Failedtofetchdiscoveredtools."},500)',
  'returnjsonResponse({error:"Failedtofetchdiscoverysources."},500)',
  'returnjsonResponse({error:"Failedtofetchdiscoveryruns."},500)',
  'returnjsonResponse({error:"Failedtofetchduplicatesummaries."},500)',
];
check(
  "A11",
  expectedQueueFailures.every((marker) => queueGetText.includes(marker)) &&
    callsNamed(queueGet, "jsonResponse").filter(
      (call) => call.arguments.length === 2,
    ).length === 7,
  "a queue invalid-filter or database-failure response body or status changed.",
);

function successResponseIsDefault(getFunction) {
  const responses = callsNamed(getFunction, "jsonResponse");
  return (
    responses.filter((call) => call.arguments.length === 1).length === 1 &&
    responses.at(-1)?.arguments.length === 1 &&
    ts.isObjectLiteralExpression(responses.at(-1)?.arguments[0])
  );
}
check(
  "A12",
  callsNamed(runsGet, "jsonResponse").length === 4 &&
    callsNamed(queueGet, "jsonResponse").length === 8 &&
    successResponseIsDefault(runsGet) &&
    successResponseIsDefault(queueGet) &&
    responseHelperIsProtected(runs) &&
    responseHelperIsProtected(queue),
  "the response helper, security headers, response ceiling, or default success status changed.",
);

const expectedRunStatuses = new Set([
  "pending",
  "running",
  "completed",
  "failed",
]);
const expectedQueueStatuses = new Set([
  "new",
  "pending_review",
  "approved",
  "rejected",
  "ignored",
  "duplicate",
]);
check(
  "A13",
  setsEqual(
    setLiteralValues(runs, "VALID_RUN_STATUSES"),
    expectedRunStatuses,
  ) &&
    setsEqual(
      setLiteralValues(queue, "VALID_DISCOVERY_STATUSES"),
      expectedQueueStatuses,
    ) &&
    variableDeclaration(queue.sourceFile, "UUID_PATTERN")?.initializer?.getText(
      queue.sourceFile,
    ) ===
      "/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i" &&
    callsNamed(runsGet, "has").length === 1 &&
    callsNamed(queueGet, "has").length === 1 &&
    callsNamed(queueGet, "test").length === 1,
  "a status allowlist, status validator, or source UUID validator changed.",
);

function paginationIsProtected(record, getFunction) {
  const text = compact(getFunction?.getText(record.sourceFile) ?? "");
  const ranges = callsNamed(getFunction, "range");
  return (
    text.includes('constpage=getPositiveInteger(searchParams.get("page"),1)') &&
    text.includes(
      'constrequestedLimit=getPositiveInteger(searchParams.get("limit"),20)',
    ) &&
    text.includes('constlimit=Math.min(100,Math.max(1,requestedLimit))') &&
    text.includes('constoffset=(page-1)*limit') &&
    text.includes('totalPages:Math.ceil((count||0)/limit)') &&
    ranges.length === 1 &&
    ranges[0].arguments[0]?.getText(record.sourceFile) === "offset" &&
    compact(ranges[0].arguments[1]?.getText(record.sourceFile) ?? "") ===
      "offset+limit-1"
  );
}
check(
  "A14",
  paginationIsProtected(runs, runsGet) && paginationIsProtected(queue, queueGet),
  "a page default, limit default, cap, offset, range, or total-pages calculation changed.",
);

const runsSelectCalls = callsNamed(runsGet, "select");
const expectedRunsProjection = [
  "id",
  "source_id",
  "status",
  "stats",
  "error_log",
  "started_at",
  "finished_at",
  "created_at",
  "updated_at",
];
check(
  "A15",
  JSON.stringify(fromTables(runsGet)) ===
    JSON.stringify(["discovery_runs", "discovery_audit_events"]) &&
    runsSelectCalls.length === 2 &&
    JSON.stringify(selectProjection(runsSelectCalls[0])) ===
      JSON.stringify(expectedRunsProjection) &&
    selectProjection(runsSelectCalls[1]) === "metadata, created_at",
  "the runs table set, query count, select count, or projection changed.",
);

const queueSelectCalls = callsNamed(queueGet, "select");
const expectedQueueProjection = [
  "id",
  "name",
  "description",
  "website",
  "canonical_url",
  "normalized_domain",
  "slug",
  "status",
  "pricing",
  "platforms",
  "category",
  "logo_url",
  "discovery_score",
  "source_id",
  "run_id",
  "created_at",
  "updated_at",
];
check(
  "A16",
  JSON.stringify(fromTables(queueGet)) ===
    JSON.stringify([
      "discovered_tools",
      "discovery_sources",
      "discovery_runs",
      "discovery_duplicate_candidates",
    ]) &&
    queueSelectCalls.length === 4 &&
    JSON.stringify(selectProjection(queueSelectCalls[0])) ===
      JSON.stringify(expectedQueueProjection) &&
    selectProjection(queueSelectCalls[1]) ===
      "id, name, slug, source_type, is_active, last_run_at" &&
    selectProjection(queueSelectCalls[2]) ===
      "id, source_id, status, stats, started_at, finished_at, created_at" &&
    selectProjection(queueSelectCalls[3]) ===
      "discovered_tool_id, is_blocking",
  "the queue table set, query count, select count, or projection changed.",
);

const runsQuery = variableDeclaration(runsGet, "query");
const runsIfStatements = collect(runsGet, ts.isIfStatement);
const auditFromCall = callsNamed(runsGet, "from").find(
  (call) => stringLiteral(call.arguments[0]) === "discovery_audit_events",
);
check(
  "A17",
  Boolean(runsQuery?.initializer && auditFromCall) &&
    compact(runsQuery.initializer.getText(runs.sourceFile)).startsWith(
      'supabaseAdmin.from("discovery_runs").select(',
    ) &&
    compact(runsQuery.initializer.getText(runs.sourceFile)).endsWith(
      '.order("created_at",{ascending:false}).range(offset,offset+limit-1)',
    ) &&
    runsIfStatements.some(
      (statement) =>
        compact(statement.expression.getText(runs.sourceFile)) === "status" &&
        compact(statement.thenStatement.getText(runs.sourceFile)).includes(
          'query=query.eq("status",status)',
        ),
    ) &&
    hasAncestor(
      auditFromCall,
      (node) =>
        ts.isIfStatement(node) &&
        compact(node.expression.getText(runs.sourceFile)) === "runIds.length>0",
    ) &&
    callsNamed(runsGet, "from").length === 2 &&
    callsNamed(runsGet, "select").length === 2 &&
    callsNamed(runsGet, "order").length === 2 &&
    callsNamed(runsGet, "range").length === 1 &&
    callsNamed(runsGet, "eq").length === 1 &&
    callsNamed(runsGet, "in").length === 1 &&
    callsNamed(runsGet, "limit").length === 1 &&
    runsGetText.includes(
      '.in("metadata->>run_id",runIds).order("created_at",{ascending:true}).limit(MAX_AUDIT_EVENTS_PER_PAGE)',
    ) &&
    runs.text.includes("const MAX_AUDIT_EVENTS_PER_PAGE = 100;"),
  "the runs main-query or conditional audit-query order, receiver chain, or call ceiling changed.",
);

const queueFromCalls = callsNamed(queueGet, "from");
const queueConditionals = collect(queueGet, ts.isConditionalExpression);
const conditionalTables = new Map(
  queueFromCalls.slice(1).map((call) => [stringLiteral(call.arguments[0]), call]),
);
check(
  "A18",
  queueFromCalls.every(
    (call, index) => index === 0 || queueFromCalls[index - 1].pos < call.pos,
  ) &&
    [
      ["discovery_sources", "sourceIds.length"],
      ["discovery_runs", "runIds.length"],
      ["discovery_duplicate_candidates", "toolIds.length"],
    ].every(([table, condition]) => {
      const call = conditionalTables.get(table);
      return (
        call &&
        hasAncestor(
          call,
          (node) =>
            ts.isConditionalExpression(node) &&
            compact(node.condition.getText(queue.sourceFile)) === condition,
        )
      );
    }) &&
    queueConditionals.length >= 3 &&
    callsNamed(queueGet, "from").length === 4 &&
    callsNamed(queueGet, "select").length === 4 &&
    callsNamed(queueGet, "order").length === 1 &&
    callsNamed(queueGet, "range").length === 1 &&
    callsNamed(queueGet, "eq").length === 2 &&
    callsNamed(queueGet, "in").length === 3 &&
    queueGetText.indexOf('.from("discovery_sources")') <
      queueGetText.indexOf('.from("discovery_runs")') &&
    queueGetText.indexOf('.from("discovery_runs")') <
      queueGetText.indexOf('.from("discovery_duplicate_candidates")'),
  "the queue main/source/run/duplicate ordering, conditional execution, receiver chain, or call ceiling changed.",
);

const prohibitedSideEffectCalls = new Set([
  "insert",
  "update",
  "upsert",
  "delete",
  "rpc",
  "upload",
  "remove",
  "fetch",
  "redirect",
  "cookies",
  "createAdminAuditLog",
  "publish",
]);
const selectedCalls = [
  ...collect(runsGet, ts.isCallExpression),
  ...collect(queueGet, ts.isCallExpression),
];
check(
  "A19",
  !selectedCalls.some((call) => prohibitedSideEffectCalls.has(callName(call))) &&
    ![runs.text, queue.text].some((text) =>
      /(?:\.storage\b|storage\.(?:remove|delete)|public promotion|deploy|publish)/i.test(
        text,
      ),
    ),
  "a mutation, RPC, storage, external fetch, audit write, redirect, deployment, or publishing operation was added.",
);

check(
  "A20",
  callsNamed(runsGet, "normalizeManualMetadataFetchAuditEvents").length === 1 &&
    callsNamed(runsGet, "normalizeManualStaticHtmlEvidenceAuditEvents").length ===
      1 &&
    callsNamed(runsGet, "normalizeManualStaticHtmlEvidenceStats").length === 1 &&
    runsGetText.includes('letauditWarning:string|null=null') &&
    runsGetText.includes('auditWarning="Audittimelineisunavailable."') &&
    runsGetText.includes(
      'static_evidence_audit_warning:"Staticevidenceaudittimelineisunavailable."',
    ) &&
    [
      "audit_events:",
      "static_evidence_audit_events:",
      "static_evidence_audit_warning:",
      "audit_warning:",
      "event_type:",
      "failure_reason:",
      "public_tools_inserted:",
      "llm_analysis_performed:",
    ].every((marker) => runsGetText.includes(marker)),
  "the runs audit warning or normalized metadata/static-evidence response paths changed.",
);

check(
  "A21",
  queueGetText.includes(
    'constduplicateSummaryByTool=newMap<string,{duplicate_count:number;blocking_duplicate_count:number}>()',
  ) &&
    queueGetText.includes("current.duplicate_count+=1") &&
    queueGetText.includes("current.blocking_duplicate_count+=1") &&
    queueGetText.includes(
      "duplicateSummaryByTool.set(duplicateRow.discovered_tool_id,current)",
    ) &&
    queueGetText.indexOf("constsourceById=newMap") <
      queueGetText.indexOf("construnById=newMap") &&
    [
      "source:typeof tool.source_id",
      "sourceById.get(tool.source_id)||null",
      "run:typeof tool.run_id",
      "runById.get(tool.run_id)||null",
      "duplicate_count:duplicateSummaryByTool.get(tool.id)?.duplicate_count||0",
      "blocking_duplicate_count:duplicateSummaryByTool.get(tool.id)?.blocking_duplicate_count||0",
    ].every((marker) => queueGetText.includes(compact(marker))),
  "the queue source/run enrichment, duplicate mapping, or caller-visible response keys changed.",
);

const runsCaller = parseFile(RUNS_CALLER_PATH, ts.ScriptKind.TSX);
const queueCaller = parseFile(QUEUE_CALLER_PATH, ts.ScriptKind.TSX);
function targetFetches(record, routeMarker) {
  return callsNamed(record.sourceFile, "fetch").filter((call) =>
    call.arguments[0]?.getText(record.sourceFile).includes(routeMarker),
  );
}
const runsFetches = targetFetches(runsCaller, "/api/admin/discovery/runs?");
const queueFetches = targetFetches(
  queueCaller,
  "/api/admin/discovery/discovered-tools?",
);
const runsFetchOptions = propertyMap(runsFetches[0]?.arguments[1]);
const queueFetchOptions = propertyMap(queueFetches[0]?.arguments[1]);
check(
  "A22",
  sha256(RUNS_CALLER_PATH) === PROTECTED_HASHES.get(RUNS_CALLER_PATH) &&
    sha256(QUEUE_CALLER_PATH) === PROTECTED_HASHES.get(QUEUE_CALLER_PATH) &&
    runsFetches.length === 1 &&
    queueFetches.length === 1 &&
    stringLiteral(runsFetchOptions.get("method")) === "GET" &&
    stringLiteral(runsFetchOptions.get("credentials")) === "same-origin" &&
    stringLiteral(runsFetchOptions.get("cache")) === "no-store" &&
    !queueFetchOptions.has("method") &&
    stringLiteral(queueFetchOptions.get("credentials")) === "same-origin" &&
    stringLiteral(queueFetchOptions.get("cache")) === "no-store" &&
    [
      "result?.data",
      "result?.pagination?.total",
      "result?.pagination?.totalPages",
    ].every((marker) => runsCaller.text.includes(marker)) &&
    ["result.data", "result.pagination"].every((marker) =>
      queueCaller.text.includes(marker),
    ),
  "a sole caller identity, route string, GET/credentials/cache behavior, or consumed response key changed.",
);

check(
  "A23",
  [...PROTECTED_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
  ),
  "an auth, Supabase, normalizer, caller, admin-shell, prior-phase contract, or migration identity changed.",
);

const catalog = parseFile(CATALOG_PATH, ts.ScriptKind.JS);
const harness = parseFile(HARNESS_PATH, ts.ScriptKind.JS);
const finalRunsHash = sha256(RUNS_PATH);
const finalQueueHash = sha256(QUEUE_PATH);
const finalHarnessHash = sha256(HARNESS_PATH);
const finalCatalogLines = [
  `  ["${RUNS_PATH}", "${finalRunsHash}"],`,
  `  ["${QUEUE_PATH}", "${finalQueueHash}"],`,
  `  ["${HARNESS_PATH}", "${finalHarnessHash}"],`,
];
const normalizedCatalog = finalCatalogLines.reduce(
  (text, line) => text.replace(`${line}\n`, ""),
  catalog.text,
);
const normalizedRuns = runs.text
  .replace('import "server-only";\n\n', "")
  .replace(
    '    console.warn("discovery_runs_unauthorized");',
    '    console.warn("Unauthorized Discovery Engine runs request.", {\n      errors: adminSession.errors,\n    });',
  )
  .replace(
    '    console.error("discovery_runs_load_failed");',
    '    console.error("Failed to fetch Discovery Engine runs.", {\n      message: error.message,\n    });',
  )
  .replace(
    '      console.error("discovery_run_audit_events_load_failed");',
    '      console.error("Failed to fetch Discovery Engine run audit events.", {\n        message: auditError.message,\n      });',
  );
const normalizedQueue = queue.text
  .replace('import "server-only";\n\n', "")
  .replace(
    '    console.warn("discovered_tools_queue_unauthorized");',
    '    console.warn("Unauthorized Discovery Engine discovered tools request.", {\n      errors: adminSession.errors,\n    });',
  )
  .replace(
    '    console.error("discovered_tools_queue_load_failed");',
    '    console.error("Failed to fetch Discovery Engine discovered tools.", {\n      message: error.message,\n    });',
  )
  .replace(
    '    console.error("discovered_tools_queue_sources_load_failed");',
    '    console.error("Failed to fetch Discovery Engine queue sources.", {\n      message: sourcesError.message,\n    });',
  )
  .replace(
    '    console.error("discovered_tools_queue_runs_load_failed");',
    '    console.error("Failed to fetch Discovery Engine queue runs.", {\n      message: runsError.message,\n    });',
  )
  .replace(
    '    console.error("discovered_tools_queue_duplicates_load_failed");',
    '    console.error("Failed to fetch Discovery Engine queue duplicate summaries.", {\n      message: duplicateRowsError.message,\n    });',
  );
const expectedStatus = new Set([
  ` M ${RUNS_PATH}`,
  ` M ${QUEUE_PATH}`,
  ` M ${CATALOG_PATH}`,
  `?? ${HARNESS_PATH}`,
  ...[...GOVERNANCE_HASHES.keys()].map((relativePath) => `?? ${relativePath}`),
]);
const actualStatus = new Set(
  execGit(["status", "--porcelain=v1", "--untracked-files=all"])
    .trimEnd()
    .split("\n")
    .filter(Boolean),
);
const trackedModes = new Map(
  execGit(["ls-files", "-s", RUNS_PATH, QUEUE_PATH, CATALOG_PATH])
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [metadata, relativePath] = line.split("\t");
      return [relativePath, metadata.split(" ")[0]];
    }),
);
check(
  "A24",
  setsEqual(checkIds(harness), expectedIds(24)) &&
    harness.text.includes(
      "PASS: admin discovery read-route diagnostic logging static assertions (24 assertions)",
    ) &&
    setsEqual(checkIds(catalog), expectedIds(24)) &&
    catalog.text.includes(
      "PASS: admin catalog route error boundary static assertions (24 assertions)",
    ) &&
    finalCatalogLines.every((line) => catalog.text.includes(line)) &&
    hashText(normalizedCatalog) === BASELINE_HASHES.get(CATALOG_PATH) &&
    hashText(normalizedRuns) === BASELINE_HASHES.get(RUNS_PATH) &&
    hashText(normalizedQueue) === BASELINE_HASHES.get(QUEUE_PATH) &&
    setsEqual(actualStatus, expectedStatus) &&
    execGit(["diff", "--cached", "--name-only"]).trim() === "" &&
    execGit(["rev-parse", "HEAD"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "origin/main"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "--abbrev-ref", "HEAD"]).trim() === "main" &&
    [RUNS_PATH, QUEUE_PATH, CATALOG_PATH].every(
      (relativePath) => trackedModes.get(relativePath) === "100644",
    ) &&
    [RUNS_PATH, QUEUE_PATH, CATALOG_PATH, HARNESS_PATH].every(
      (relativePath) => mode(relativePath) === 0o644,
    ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash && mode(relativePath) === 0o644,
    ) &&
    [runs.text, queue.text, catalog.text, harness.text].every(
      (text) => !text.includes("\r"),
    ),
  "the exact four-file normalized scope, modes, LF content, Git baseline, index, protected catalog, or governance ceiling changed.",
);

process.stdout.write(
  "PASS: admin discovery read-route diagnostic logging static assertions (24 assertions)\n",
);
