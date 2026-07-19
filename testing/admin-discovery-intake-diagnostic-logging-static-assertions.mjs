#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const ROUTE_PATH = "app/api/admin/discovery/intake/route.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-intake-diagnostic-logging-static-assertions.mjs";
const ADMIN_SHELL_PATH =
  "testing/admin-shell-supabase-read-hardening.test.mjs";
const HISTORICAL_HARNESS_PATH =
  "testing/admin-discovery-manual-trigger-diagnostic-logging-static-assertions.mjs";
const DIRECT_CALLER_PATH = "components/admin/admin-dashboard-client.tsx";
const SMOKE_CALLER_PATH = "scripts/smoke-discovery-flow.mjs";
const SERVER_ONLY_STATEMENT = 'import "server-only";\n';
const BASELINE_HEAD = "d3ff315945a813a0337a12d242d8b41d040ae96b";
const BASELINE_CATALOG_HASH =
  "3fbd1fa0d765c8e8f62bb3fd2245e8d41d4c620e279dc694279a3bec5174e017";
const CANONICAL_ROUTE_HASH =
  "0f0fab4ec3072116bd39a4663b4de5df22c5e61ca4d2eb390c7d3a31be1d59ca";
const SUCCESS_MARKER =
  "PASS: admin discovery intake diagnostic logging static assertions (26 assertions)";

const EXPECTED_IMPORTS = [
  { module: "server-only", sideEffectOnly: true, named: [] },
  {
    module: "next/server",
    sideEffectOnly: false,
    named: ["value:NextResponse"],
  },
  {
    module: "../../../../../lib/admin-auth",
    sideEffectOnly: false,
    named: ["value:verifyAdminCsrfRequest", "value:verifyAdminSession"],
  },
  {
    module: "../../../../../lib/admin-rate-limit",
    sideEffectOnly: false,
    named: [
      "value:ADMIN_RATE_LIMIT_ACTIONS",
      "value:checkAdminRateLimit",
      "value:getAdminRateLimitResponseData",
    ],
  },
  {
    module: "../../../../../lib/supabase-admin",
    sideEffectOnly: false,
    named: ["value:supabaseAdmin"],
  },
  {
    module: "../../../../../lib/tool-validation",
    sideEffectOnly: false,
    named: [
      "value:getNormalizedDomain",
      "value:validateHttpsUrl",
      "value:validateOptionalLogoUrl",
      "value:validateTextField",
      "value:validateToolCategory",
      "value:validateToolPricing",
    ],
  },
];

const EXPECTED_EVENTS = [
  { severity: "warn", event: "discovery_manual_intake_unauthorized" },
  {
    severity: "error",
    event: "discovery_manual_intake_existing_discovered_lookup_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_live_tools_lookup_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_pending_submissions_lookup_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_source_load_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_run_insert_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_discovered_tool_insert_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_evidence_insert_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_duplicate_candidate_insert_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_audit_insert_failed",
  },
  {
    severity: "error",
    event: "discovery_manual_intake_source_update_failed",
  },
];

const EXPECTED_METHOD_COUNTS = new Map([
  ["from", 17],
  ["select", 8],
  ["insert", 5],
  ["update", 1],
  ["delete", 6],
  ["upsert", 0],
  ["eq", 12],
  ["neq", 0],
  ["in", 1],
  ["order", 1],
  ["limit", 3],
  ["maybeSingle", 1],
  ["single", 4],
  ["rpc", 0],
  ["fetch", 0],
]);

const EXPECTED_TABLE_COUNTS = new Map([
  ["discovery_audit_events", 2],
  ["discovery_duplicate_candidates", 2],
  ["discovery_evidence", 2],
  ["discovered_tools", 3],
  ["discovery_runs", 3],
  ["tools", 1],
  ["submitted_tools", 1],
  ["discovery_sources", 2],
]);

const DEPENDENCY_HASHES = new Map([
  [
    "lib/admin-auth.ts",
    "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc",
  ],
  [
    "lib/admin-rate-limit.ts",
    "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b",
  ],
  [
    "lib/supabase-admin.ts",
    "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae",
  ],
  [
    "lib/tool-validation.ts",
    "8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba",
  ],
]);

const CURRENT_STATE_HASHES = new Map([
  [
    ADMIN_SHELL_PATH,
    "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1",
  ],
  [
    HISTORICAL_HARNESS_PATH,
    "cd0fc45154e0eb1d13bb915bb7a59c51d684af7c766ed64b2c4f6c139556f665",
  ],
]);

const CALLER_HASHES = new Map([
  [
    DIRECT_CALLER_PATH,
    "86caa4376bde0084311595010c582b6c3aab83db98887121d8db2c59eb8aae2f",
  ],
  [
    SMOKE_CALLER_PATH,
    "475e6e7e31935f5d514eadca902cef4e63d84a04ea339f159304fe370b67c955",
  ],
]);

const GOVERNANCE_HASHES = new Map([
  [
    "docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md",
    "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12",
  ],
  [
    "docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md",
    "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a",
  ],
  [
    "docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md",
    "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723",
  ],
  [
    "docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md",
    "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca",
  ],
  [
    "docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md",
    "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45",
  ],
]);

function fail(id, reason) {
  process.stderr.write(id + " fails because " + reason + "\n");
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) {
    fail(id, reason);
  }
}

// A01 deliberately reads only the selected intake route. No other repository
// path is read, and TypeScript is not loaded, until this boundary passes.
const routeAbsolutePath = path.join(REPO_ROOT, ROUTE_PATH);
const routeText = readFileSync(routeAbsolutePath, "utf8");
check(
  "A01",
  routeText.startsWith(SERVER_ONLY_STATEMENT),
  ROUTE_PATH + ' does not begin with import "server-only";.',
);

const require = createRequire(import.meta.url);
const ts = require("typescript");

function parseText(relativePath, text, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
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

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  return parseText(
    relativePath,
    readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
    scriptKind,
  );
}

function walk(node, visit) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function callsNamed(sourceFile, name) {
  const calls = [];
  walk(sourceFile, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      calls.push(node);
    }
  });
  return calls;
}

function consoleCalls(sourceFile) {
  const calls = [];
  walk(sourceFile, (node) => {
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

function consolePropertyAccesses(sourceFile) {
  const accesses = [];
  walk(sourceFile, (node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "console"
    ) {
      accesses.push(node);
    }
  });
  return accesses;
}

function owningFunctionName(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current)) {
      return current.name?.text ?? null;
    }
    current = current.parent;
  }
  return null;
}

function importRecords(sourceFile) {
  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map((declaration) => {
      const moduleName = declaration.moduleSpecifier.text;
      const clause = declaration.importClause;
      if (!clause) {
        return { module: moduleName, sideEffectOnly: true, named: [] };
      }

      const named = [];
      if (clause.name) {
        named.push("default:" + clause.name.text);
      }
      if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        named.push("namespace:" + clause.namedBindings.name.text);
      }
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          const importedName = element.propertyName
            ? element.propertyName.text + "->" + element.name.text
            : element.name.text;
          named.push((element.isTypeOnly ? "type:" : "value:") + importedName);
        }
      }
      return { module: moduleName, sideEffectOnly: false, named };
    });
}

function exportRecords(sourceFile) {
  const records = [];
  for (const statement of sourceFile.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) {
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          records.push({
            name: declaration.name.text,
            value: ts.isStringLiteral(declaration.initializer)
              ? declaration.initializer.text
              : null,
            kind: "variable",
          });
        }
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      records.push({
        name: statement.name.text,
        value: null,
        kind: statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
        )
          ? "async-function"
          : "function",
      });
    } else {
      records.push({ name: null, value: null, kind: "other" });
    }
  }
  return records;
}

function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function mode(relativePath) {
  return lstatSync(path.join(REPO_ROOT, relativePath)).mode & 0o777;
}

function isRegularNonSymlink(relativePath) {
  const stats = lstatSync(path.join(REPO_ROOT, relativePath));
  return stats.isFile() && !stats.isSymbolicLink();
}

function isLfOnly(relativePath) {
  const text = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
  return !text.includes("\r") && text.endsWith("\n");
}

function execGit(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitSucceeds(args) {
  try {
    execGit(args);
    return true;
  } catch {
    return false;
  }
}

function gitMode(relativePath) {
  const output = execGit(["ls-files", "-s", "--", relativePath]).trim();
  return output ? output.split(/\s+/, 1)[0] : "";
}

function setsEqual(left, right) {
  return (
    left.size === right.size && [...left].every((value) => right.has(value))
  );
}

function exactJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function methodCallCounts(sourceFile) {
  const counts = new Map(
    [...EXPECTED_METHOD_COUNTS.keys()].map((name) => [name, 0]),
  );
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node)) {
      return;
    }
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      counts.has(node.expression.name.text)
    ) {
      const name = node.expression.name.text;
      counts.set(name, counts.get(name) + 1);
    } else if (
      ts.isIdentifier(node.expression) &&
      node.expression.text === "fetch"
    ) {
      counts.set("fetch", counts.get("fetch") + 1);
    }
  });
  return counts;
}

function tableCallCounts(sourceFile) {
  const counts = new Map();
  walk(sourceFile, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "from" &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const table = node.arguments[0].text;
      counts.set(table, (counts.get(table) ?? 0) + 1);
    }
  });
  return counts;
}

function canonicalizeRoute(text) {
  if (!text.startsWith(SERVER_ONLY_STATEMENT)) {
    return null;
  }
  const withoutServerOnly = text.slice(SERVER_ONLY_STATEMENT.length);
  const sourceFile = ts.createSourceFile(
    path.join(REPO_ROOT, ROUTE_PATH),
    withoutServerOnly,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const calls = consoleCalls(sourceFile);
  if (calls.length !== EXPECTED_EVENTS.length) {
    return null;
  }

  let normalized = withoutServerOnly;
  for (let index = calls.length - 1; index >= 0; index -= 1) {
    const call = calls[index];
    const marker =
      "__AIFINDER_PHASE_27GP_CONSOLE_CALL_" +
      String(index + 1).padStart(2, "0") +
      "__";
    normalized =
      normalized.slice(0, call.getStart(sourceFile)) +
      marker +
      normalized.slice(call.end);
  }
  return normalized;
}

function orderedSubstrings(text, values) {
  let offset = 0;
  for (const value of values) {
    const index = text.indexOf(value, offset);
    if (index === -1) {
      return false;
    }
    offset = index + value.length;
  }
  return true;
}

const route = parseText(ROUTE_PATH, routeText);
check(
  "A02",
  exactJson(importRecords(route.sourceFile), EXPECTED_IMPORTS),
  "the exact six-module import ceiling or an imported symbol/type changed.",
);

const routeExports = exportRecords(route.sourceFile);
const postDeclaration = route.sourceFile.statements.find(
  (statement) =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === "POST",
);
check(
  "A03",
  exactJson(routeExports, [
    { name: "runtime", value: "nodejs", kind: "variable" },
    { name: "dynamic", value: "force-dynamic", kind: "variable" },
    { name: "POST", value: null, kind: "async-function" },
  ]) &&
    postDeclaration &&
    postDeclaration.parameters.length === 1 &&
    ts.isIdentifier(postDeclaration.parameters[0].name) &&
    postDeclaration.parameters[0].name.text === "request" &&
    postDeclaration.parameters[0].type?.getText(route.sourceFile) === "Request",
  "the runtime, dynamic, POST export ceiling, values, or POST signature changed.",
);

const selectedConsoleCalls = consoleCalls(route.sourceFile);
check(
  "A04",
  selectedConsoleCalls.length === 11 &&
    exactJson(
      selectedConsoleCalls.map((call) => call.expression.name.text),
      ["warn", ...Array(10).fill("error")],
    ) &&
    selectedConsoleCalls.every(
      (call) => owningFunctionName(call) === "POST",
    ),
  "the exact eleven-call POST console ownership or severity order changed.",
);

const allConsoleAccesses = consolePropertyAccesses(route.sourceFile);
check(
  "A05",
  allConsoleAccesses.length === 11 &&
    allConsoleAccesses.every(
      (access) =>
        ts.isCallExpression(access.parent) &&
        access.parent.expression === access &&
        (access.name.text === "error" || access.name.text === "warn"),
    ),
  "an additional or unsupported console call exists.",
);

function eventMatches(index) {
  const call = selectedConsoleCalls[index];
  const expected = EXPECTED_EVENTS[index];
  return (
    call &&
    expected &&
    owningFunctionName(call) === "POST" &&
    call.expression.name.text === expected.severity &&
    call.arguments.length === 1 &&
    ts.isStringLiteral(call.arguments[0]) &&
    call.arguments[0].text === expected.event
  );
}

check(
  "A06",
  eventMatches(0),
  "event 1 changed function ownership, severity, literal, or argument count.",
);
check(
  "A07",
  eventMatches(1),
  "event 2 changed function ownership, severity, literal, or argument count.",
);
check(
  "A08",
  eventMatches(2),
  "event 3 changed function ownership, severity, literal, or argument count.",
);
check(
  "A09",
  eventMatches(3),
  "event 4 changed function ownership, severity, literal, or argument count.",
);
check(
  "A10",
  eventMatches(4),
  "event 5 changed function ownership, severity, literal, or argument count.",
);
check(
  "A11",
  eventMatches(5),
  "event 6 changed function ownership, severity, literal, or argument count.",
);
check(
  "A12",
  eventMatches(6),
  "event 7 changed function ownership, severity, literal, or argument count.",
);
check(
  "A13",
  eventMatches(7),
  "event 8 changed function ownership, severity, literal, or argument count.",
);
check(
  "A14",
  eventMatches(8),
  "event 9 changed function ownership, severity, literal, or argument count.",
);
check(
  "A15",
  eventMatches(9),
  "event 10 changed function ownership, severity, literal, or argument count.",
);
check(
  "A16",
  eventMatches(10),
  "event 11 changed function ownership, severity, literal, or argument count.",
);

check(
  "A17",
  selectedConsoleCalls.every(
    (call) =>
      call.arguments.length === 1 &&
      ts.isStringLiteral(call.arguments[0]) &&
      call.arguments[0].getText(route.sourceFile) ===
        JSON.stringify(call.arguments[0].text),
  ),
  "a selected diagnostic argument is dynamic or is not one fixed string literal.",
);

const canonicalRoute = canonicalizeRoute(route.text);
const canonicalRouteHash = canonicalRoute ? hashText(canonicalRoute) : null;
check(
  "A18",
  canonicalRouteHash === CANONICAL_ROUTE_HASH,
  "the canonical normalized-route SHA-256 changed.",
);

const actualMethodCounts = methodCallCounts(route.sourceFile);
check(
  "A19",
  [...EXPECTED_METHOD_COUNTS].every(
    ([name, expected]) => actualMethodCounts.get(name) === expected,
  ),
  "a query, mutation, cleanup-delete, RPC, or fetch method ceiling changed.",
);

const actualTableCounts = tableCallCounts(route.sourceFile);
check(
  "A20",
  setsEqual(
    new Set(actualTableCounts.keys()),
    new Set(EXPECTED_TABLE_COUNTS.keys()),
  ) &&
    [...EXPECTED_TABLE_COUNTS].every(
      ([table, expected]) => actualTableCounts.get(table) === expected,
    ),
  "an exact intake table occurrence count changed.",
);

const postText = postDeclaration.getText(route.sourceFile);
check(
  "A21",
  canonicalRouteHash === CANONICAL_ROUTE_HASH &&
    orderedSubstrings(postText, [
      "verifyAdminSession(request)",
      "verifyAdminCsrfRequest(request)",
      "checkAdminRateLimit({",
      "body = await readJsonBody(request);",
      'name = validateTextField(body.name, "Name", 80',
      "normalizedDomain = getNormalizedDomain(website)",
      '.from("discovered_tools")',
      '.from("tools")',
      '.from("submitted_tools")',
      '.from("discovery_sources")',
      '.from("discovery_runs")',
      '.from("discovered_tools")',
      '.from("discovery_evidence")',
      '.from("discovery_duplicate_candidates")',
      '.from("discovery_audit_events")',
      '.from("discovery_sources")',
      "return jsonResponse(",
    ]),
  "the auth, CSRF, rate-limit, parsing, validation, duplicate, source, insert, cleanup, response, or error ordering changed.",
);

check(
  "A22",
  [...DEPENDENCY_HASHES].every(
    ([relativePath, expectedHash]) =>
      sha256(relativePath) === expectedHash &&
      gitMode(relativePath) === "100644" &&
      mode(relativePath) === 0o644 &&
      isRegularNonSymlink(relativePath) &&
      isLfOnly(relativePath),
  ),
  "an imported dependency identity, mode, regular-file, symlink, or LF boundary changed.",
);

check(
  "A23",
  [...CALLER_HASHES].every(
    ([relativePath, expectedHash]) =>
      sha256(relativePath) === expectedHash &&
      gitMode(relativePath) === "100644" &&
      mode(relativePath) === 0o644 &&
      isRegularNonSymlink(relativePath) &&
      isLfOnly(relativePath),
  ),
  "the direct caller or unexecuted smoke-caller identity, mode, or LF boundary changed.",
);

const catalog = parseFile(CATALOG_PATH, ts.ScriptKind.JS);
const harnessText = readFileSync(TEST_FILE, "utf8");
const expectedRouteHash = hashText(route.text);
const expectedHarnessHash = hashText(harnessText);
const catalogCheckIds = callsNamed(catalog.sourceFile, "check").map((call) =>
  call.arguments.length > 0 && ts.isStringLiteral(call.arguments[0])
    ? call.arguments[0].text
    : null,
);
const expectedCatalogCheckIds = Array.from(
  { length: 24 },
  (_, index) => "A" + String(index + 1).padStart(2, "0"),
);
const catalogConstants =
  'const PHASE_27GP_ROUTE_PATH = "app/api/admin/discovery/intake/route.ts";\n' +
  "const PHASE_27GP_HARNESS_PATH =\n" +
  '  "testing/admin-discovery-intake-diagnostic-logging-static-assertions.mjs";\n' +
  "const PHASE_27GP_SUCCESS_MARKER =\n" +
  '  "PASS: admin discovery intake diagnostic logging static assertions (26 assertions)";\n';
const catalogIdentityBlock =
  '  [PHASE_27GP_ROUTE_PATH, "' +
  expectedRouteHash +
  '"],\n' +
  '  [PHASE_27GP_HARNESS_PATH, "' +
  expectedHarnessHash +
  '"],\n';
const catalogHarnessParse =
  "const phase27gpHarness = parseFile(PHASE_27GP_HARNESS_PATH, ts.ScriptKind.JS);\n";
const catalogMarkerPredicate =
  "    phase27gpHarness.text.includes(PHASE_27GP_SUCCESS_MARKER) &&\n";

check(
  "A24",
  catalogCheckIds.length === 24 &&
    catalogCheckIds.every((id) => id !== null) &&
    expectedCatalogCheckIds.every(
      (expectedId) =>
        catalogCheckIds.filter((actualId) => actualId === expectedId).length ===
        1,
    ) &&
    catalogCheckIds.every((id) => expectedCatalogCheckIds.includes(id)) &&
    catalog.text.includes(
      "PASS: admin catalog route error boundary static assertions (24 assertions)",
    ) &&
    catalog.text.includes(catalogConstants) &&
    catalog.text.includes(catalogIdentityBlock) &&
    catalog.text.includes(catalogHarnessParse) &&
    catalog.text.includes(catalogMarkerPredicate),
  "the catalog lost its exact 24-assertion identity or exact Phase 27GP integration.",
);

const normalizedCatalog = catalog.text
  .replace(catalogConstants, "")
  .replace(catalogIdentityBlock, "")
  .replace(catalogHarnessParse, "")
  .replace(catalogMarkerPredicate, "");
check(
  "A25",
  hashText(normalizedCatalog) === BASELINE_CATALOG_HASH,
  "the catalog does not normalize exactly to the approved pre-Phase 27GP identity.",
);

const expectedStatus = new Set([
  " M " + ROUTE_PATH,
  " M " + CATALOG_PATH,
  "?? docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md",
  "?? docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md",
  "?? docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md",
  "?? docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md",
  "?? docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md",
  "?? " + HARNESS_PATH,
]);
const actualStatus = new Set(
  execGit(["status", "--porcelain=v1", "--untracked-files=all"])
    .trimEnd()
    .split("\n")
    .filter(Boolean),
);
const changedTrackedPaths = execGit(["diff", "--name-only"])
  .trimEnd()
  .split("\n")
  .filter(Boolean);
const harness = parseText(HARNESS_PATH, harnessText, ts.ScriptKind.JS);
const harnessCheckIds = callsNamed(harness.sourceFile, "check").map((call) =>
  call.arguments.length > 0 && ts.isStringLiteral(call.arguments[0])
    ? call.arguments[0].text
    : null,
);
const expectedHarnessCheckIds = Array.from(
  { length: 26 },
  (_, index) => "A" + String(index + 1).padStart(2, "0"),
);
check(
  "A26",
  execGit(["rev-parse", "--show-toplevel"]).trim() === REPO_ROOT &&
    execGit(["branch", "--show-current"]).trim() === "main" &&
    execGit(["rev-parse", "HEAD"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/heads/main"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/remotes/origin/main"]).trim() === BASELINE_HEAD &&
    gitSucceeds(["diff", "--cached", "--quiet"]) &&
    setsEqual(actualStatus, expectedStatus) &&
    setsEqual(
      new Set(changedTrackedPaths),
      new Set([ROUTE_PATH, CATALOG_PATH]),
    ) &&
    [ROUTE_PATH, CATALOG_PATH, HARNESS_PATH].every(
      (relativePath) =>
        mode(relativePath) === 0o644 &&
        isRegularNonSymlink(relativePath) &&
        isLfOnly(relativePath),
    ) &&
    gitMode(ROUTE_PATH) === "100644" &&
    gitMode(CATALOG_PATH) === "100644" &&
    gitMode(HARNESS_PATH) === "" &&
    [...CURRENT_STATE_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash &&
        gitMode(relativePath) === "100644" &&
        mode(relativePath) === 0o644 &&
        isRegularNonSymlink(relativePath) &&
        isLfOnly(relativePath),
    ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash &&
        mode(relativePath) === 0o644 &&
        isRegularNonSymlink(relativePath),
    ) &&
    harnessCheckIds.length === 26 &&
    harnessCheckIds.every((id) => id !== null) &&
    expectedHarnessCheckIds.every(
      (expectedId) =>
        harnessCheckIds.filter((actualId) => actualId === expectedId).length ===
        1,
    ) &&
    harnessCheckIds.every((id) => expectedHarnessCheckIds.includes(id)) &&
    harnessText.includes(SUCCESS_MARKER) &&
    canonicalRouteHash === CANONICAL_ROUTE_HASH &&
    !route.text.includes("process" + ".env") &&
    !route.text.includes("Deno" + ".env"),
  "the exact scope, mode, LF, identity, branch, baseline ref, empty index, governance, assertion, or no-stage boundary changed.",
);

process.stdout.write(SUCCESS_MARKER + "\n");
