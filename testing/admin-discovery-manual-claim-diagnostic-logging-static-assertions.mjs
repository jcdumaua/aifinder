#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const ROUTE_PATH = "app/api/admin/discovery/runs/manual/claim/route.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-manual-claim-diagnostic-logging-static-assertions.mjs";
const SERVER_ONLY_STATEMENT = 'import "server-only";\n';
const BASELINE_HEAD = "122ba249736e061a344d647b161d349984edcbda";
const BASELINE_CATALOG_HASH =
  "ed9536b303116b65770d299ce8c48954c02c6b51eef4426240e1493af25b97af";
const CANONICAL_ROUTE_HASH =
  "0c2ac4c878a40ae2019e2da2b2c3e3a6dc2482a1bf1a24263b7828de42b80874";
const SUCCESS_MARKER =
  "PASS: admin discovery manual-claim diagnostic logging static assertions (32 assertions)";

const EXPECTED_IMPORTS = [
  { module: "server-only", sideEffectOnly: true, named: [] },
  {
    module: "next/server",
    sideEffectOnly: false,
    named: ["value:NextResponse"],
  },
  {
    module: "../../../../../../../lib/admin-auth",
    sideEffectOnly: false,
    named: [
      "value:verifyAdminCsrfRequest",
      "value:verifyAdminSession",
      "type:VerifiedAdminActor",
    ],
  },
  {
    module: "../../../../../../../lib/admin-rate-limit",
    sideEffectOnly: false,
    named: [
      "value:ADMIN_RATE_LIMIT_ACTIONS",
      "value:checkAdminRateLimit",
      "value:getAdminRateLimitResponseData",
    ],
  },
  {
    module: "../../../../../../../lib/discovery-manual-crawler",
    sideEffectOnly: false,
    named: [
      "value:MANUAL_CRAWLER_SOURCE_KIND",
      "value:validateManualCrawlerSource",
      "type:ManualCrawlerSource",
    ],
  },
  {
    module: "../../../../../../../lib/discovery-request-plan",
    sideEffectOnly: false,
    named: [
      "value:buildDiscoveryRequestPlans",
      "type:DiscoveryRequestPlan",
    ],
  },
  {
    module: "../../../../../../../lib/discovery-fetch-adapter",
    sideEffectOnly: false,
    named: [
      "value:DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES",
      "value:executeDiscoveryFetchMetadataOnly",
      "type:DiscoveryFetchPlan",
      "type:DiscoveryFetchResult",
    ],
  },
  {
    module: "../../../../../../../lib/discovery-manual-metadata-fetch",
    sideEffectOnly: false,
    named: [
      "value:createManualMetadataFetchAdapterFailureResult",
      "value:createManualMetadataFetchResult",
      "value:summarizeManualMetadataFetchResults",
      "type:ManualMetadataFetchResult",
      "type:ManualMetadataFetchSummary",
    ],
  },
  {
    module:
      "../../../../../../../lib/discovery-static-html-evidence-executor",
    sideEffectOnly: false,
    named: [
      "value:executeManualStaticHtmlEvidence",
      "value:getManualStaticHtmlEvidenceTerminalState",
      "value:isManualStaticHtmlEvidencePlanCountAllowed",
      "type:ManualStaticHtmlEvidenceExecution",
      "type:ManualStaticHtmlEvidenceResult",
      "type:ManualStaticHtmlEvidenceSummary",
    ],
  },
  {
    module: "../../../../../../../lib/supabase-admin",
    sideEffectOnly: false,
    named: ["value:supabaseAdmin"],
  },
];

const EXPECTED_EVENTS = [
  {
    owner: "writeAuditEvent",
    severity: "error",
    event: "discovery_manual_crawler_claim_audit_write_failed",
  },
  {
    owner: "recoverStaleRunningRuns",
    severity: "error",
    event: "discovery_manual_crawler_stale_runs_load_failed",
  },
  {
    owner: "recoverStaleRunningRuns",
    severity: "error",
    event: "discovery_manual_crawler_stale_run_recovery_failed",
  },
  {
    owner: "completeMetadataFetchSmokeRun",
    severity: "error",
    event:
      "discovery_manual_crawler_metadata_smoke_empty_plan_failure_update_failed",
  },
  {
    owner: "completeMetadataFetchSmokeRun",
    severity: "error",
    event: "discovery_manual_crawler_metadata_smoke_success_update_failed",
  },
  {
    owner: "completeMetadataFetchSmokeRun",
    severity: "error",
    event:
      "discovery_manual_crawler_metadata_smoke_adapter_failure_update_failed",
  },
  {
    owner: "completeManualMetadataFetchRun",
    severity: "error",
    event:
      "discovery_manual_crawler_metadata_fetch_plan_limit_failure_update_failed",
  },
  {
    owner: "completeManualMetadataFetchRun",
    severity: "error",
    event: "discovery_manual_crawler_metadata_fetch_terminal_update_failed",
  },
  {
    owner: "completeManualStaticHtmlEvidenceRun",
    severity: "error",
    event:
      "discovery_manual_crawler_static_html_plan_limit_failure_update_failed",
  },
  {
    owner: "completeManualStaticHtmlEvidenceRun",
    severity: "error",
    event:
      "discovery_manual_crawler_static_html_execution_failure_update_failed",
  },
  {
    owner: "completeManualStaticHtmlEvidenceRun",
    severity: "error",
    event: "discovery_manual_crawler_static_html_terminal_update_failed",
  },
  {
    owner: "POST",
    severity: "warn",
    event: "discovery_manual_crawler_claim_unauthorized",
  },
  {
    owner: "POST",
    severity: "error",
    event: "discovery_manual_crawler_claim_run_load_failed",
  },
  {
    owner: "POST",
    severity: "error",
    event: "discovery_manual_crawler_claim_source_load_failed",
  },
  {
    owner: "POST",
    severity: "error",
    event:
      "discovery_manual_crawler_claim_preflight_rejection_update_failed",
  },
  {
    owner: "POST",
    severity: "error",
    event: "discovery_manual_crawler_claim_update_failed",
  },
  {
    owner: "POST",
    severity: "error",
    event: "discovery_manual_crawler_dry_run_completion_update_failed",
  },
];

const EXPECTED_METHOD_COUNTS = new Map([
  ["from", 16],
  ["select", 15],
  ["insert", 1],
  ["update", 12],
  ["delete", 0],
  ["upsert", 0],
  ["eq", 28],
  ["neq", 1],
  ["in", 0],
  ["order", 1],
  ["limit", 1],
  ["maybeSingle", 14],
  ["single", 0],
  ["rpc", 0],
  ["fetch", 0],
]);

const EXPECTED_TABLE_COUNTS = new Map([
  ["discovery_audit_events", 1],
  ["discovery_runs", 14],
  ["discovery_sources", 1],
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
    "lib/discovery-manual-crawler.ts",
    "54dff282eeddca853a983fd0697754ccc2951588b4cf5db071dbb4975173c044",
  ],
  [
    "lib/discovery-request-plan.ts",
    "ea1e8c69d1cde06625aeae760ca4d623bc4aaf477ba9913cc0f2da0a8d2c9d6e",
  ],
  [
    "lib/discovery-fetch-adapter.ts",
    "216b895d21c22641429ba5ccb5c7431145e54b54dc45036b7c5483f12272cc3d",
  ],
  [
    "lib/discovery-manual-metadata-fetch.ts",
    "b223e98b7541e09c3f96117466c0509975916a246f1d636f3fc54b58c6926944",
  ],
  [
    "lib/discovery-static-html-evidence-executor.ts",
    "b8e4647059f9d84a86a979fe39967482ea35c55084e049f5c20d059965d17288",
  ],
  [
    "lib/supabase-admin.ts",
    "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae",
  ],
]);

const SUPPORTING_HASHES = new Map([
  [
    "testing/admin-discovery-manual-trigger-diagnostic-logging-static-assertions.mjs",
    "cd0fc45154e0eb1d13bb915bb7a59c51d684af7c766ed64b2c4f6c139556f665",
  ],
  [
    "testing/admin-shell-supabase-read-hardening.test.mjs",
    "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1",
  ],
  [
    "testing/discovery-static-html-evidence-executor.test.mjs",
    "3e2829d69109882a5948696bea2007a74d0a70c32e7bc3cd2c266876fcbae240",
  ],
]);

const SMOKE_FILES = new Map([
  [
    "scripts/smoke-discovery-manual-metadata-fetch.mjs",
    {
      hash: "ada7c2732696af8d7c6cfc86d1093d39ada06a6f6b44e9fce9a9bccacb707960",
      gitMode: "100644",
      mode: 0o644,
    },
  ],
  [
    "scripts/smoke-discovery-metadata-fetch.mjs",
    {
      hash: "9e0365a2c7bed9b0f64ca3c41236f9df8ec70b08de7de2475b35177aadd0b212",
      gitMode: "100644",
      mode: 0o644,
    },
  ],
  [
    "scripts/smoke-discovery-preflight-validator.mjs",
    {
      hash: "72107eb1911e447a6286b399eea80da1f2391432233a27bc889067b75e1cbf1f",
      gitMode: "100755",
      mode: 0o755,
    },
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

// A01 deliberately reads only the selected route. No other repository path is
// read, and TypeScript is not loaded, until this first-statement boundary passes.
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
  return statSync(path.join(REPO_ROOT, relativePath)).mode & 0o777;
}

function isRegularFile(relativePath) {
  return statSync(path.join(REPO_ROOT, relativePath)).isFile();
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
      "__AIFINDER_PHASE_27GO_CONSOLE_CALL_" +
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
const routeImports = importRecords(route.sourceFile);
check(
  "A02",
  exactJson(routeImports, EXPECTED_IMPORTS),
  "the exact ten-module import ceiling or an imported symbol/type changed.",
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
const selectedSeverities = selectedConsoleCalls.map(
  (call) => call.expression.name.text,
);
check(
  "A04",
  selectedConsoleCalls.length === 17 &&
    exactJson(selectedSeverities, [
      ...Array(11).fill("error"),
      "warn",
      ...Array(5).fill("error"),
    ]),
  "the exact 17-call console severity order changed.",
);

const allConsoleAccesses = consolePropertyAccesses(route.sourceFile);
check(
  "A05",
  allConsoleAccesses.length === 17 &&
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
    owningFunctionName(call) === expected.owner &&
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
  eventMatches(11),
  "event 12 changed function ownership, severity, literal, or argument count.",
);
check(
  "A18",
  eventMatches(12),
  "event 13 changed function ownership, severity, literal, or argument count.",
);
check(
  "A19",
  eventMatches(13),
  "event 14 changed function ownership, severity, literal, or argument count.",
);
check(
  "A20",
  eventMatches(14),
  "event 15 changed function ownership, severity, literal, or argument count.",
);
check(
  "A21",
  eventMatches(15),
  "event 16 changed function ownership, severity, literal, or argument count.",
);
check(
  "A22",
  eventMatches(16),
  "event 17 changed function ownership, severity, literal, or argument count.",
);

check(
  "A23",
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
  "A24",
  canonicalRouteHash === CANONICAL_ROUTE_HASH,
  "the canonical normalized-route SHA-256 changed.",
);

const actualMethodCounts = methodCallCounts(route.sourceFile);
check(
  "A25",
  [...EXPECTED_METHOD_COUNTS].every(
    ([name, expected]) => actualMethodCounts.get(name) === expected,
  ),
  "a query, mutation, RPC, or fetch method ceiling changed.",
);

const actualTableCounts = tableCallCounts(route.sourceFile);
check(
  "A26",
  setsEqual(
    new Set(actualTableCounts.keys()),
    new Set(EXPECTED_TABLE_COUNTS.keys()),
  ) &&
    [...EXPECTED_TABLE_COUNTS].every(
      ([table, expected]) => actualTableCounts.get(table) === expected,
    ),
  "an exact discovery table occurrence count changed.",
);

const postText = postDeclaration.getText(route.sourceFile);
check(
  "A27",
  canonicalRouteHash === CANONICAL_ROUTE_HASH &&
    orderedSubstrings(postText, [
      "verifyAdminSession(request)",
      "verifyAdminCsrfRequest(request)",
      "checkAdminRateLimit({",
      "body = await readJsonBody(request);",
      'runId = getRequiredUuid(body.run_id, "Discovery run ID");',
      '.from("discovery_runs")',
      '.from("discovery_sources")',
      "validateManualCrawlerSource(source as ManualCrawlerSource)",
      'eventType: "request_plan_preflight_started"',
      "buildManualCuratedRequestPlans({",
      'eventType: "request_plan_preflight_rejected"',
      'eventType: "request_plan_preflight_passed"',
      "recoverStaleRunningRuns({",
      'eventType: "manual_crawler_executor_claim_attempted"',
      'status: "running"',
      'eventType: "manual_crawler_executor_claim_succeeded"',
      "if (executionMode === METADATA_FETCH_SMOKE_EXECUTION_MODE)",
      "if (executionMode === MANUAL_METADATA_FETCH_EXECUTION_MODE)",
      "if (executionMode === MANUAL_STATIC_HTML_DERIVED_EVIDENCE_EXECUTION_MODE)",
      'status: "completed"',
      'eventType: "manual_crawler_executor_dry_run_completed"',
    ]),
  "the authentication, CSRF, rate-limit, parsing, recovery, preflight, claim, execution, completion, audit, response, or error ordering changed.",
);

check(
  "A28",
  [...DEPENDENCY_HASHES].every(
    ([relativePath, expectedHash]) =>
      sha256(relativePath) === expectedHash &&
      gitMode(relativePath) === "100644" &&
      mode(relativePath) === 0o644 &&
      isRegularFile(relativePath) &&
      isLfOnly(relativePath),
  ),
  "an imported dependency identity, mode, regular-file, or LF boundary changed.",
);

check(
  "A29",
  [...SMOKE_FILES].every(
    ([relativePath, expected]) =>
      sha256(relativePath) === expected.hash &&
      gitMode(relativePath) === expected.gitMode &&
      mode(relativePath) === expected.mode &&
      isRegularFile(relativePath) &&
      isLfOnly(relativePath),
  ),
  "a protected unexecuted smoke-script identity, mode, or LF boundary changed.",
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
  'const PHASE_27GO_ROUTE_PATH =\n  "app/api/admin/discovery/runs/manual/claim/route.ts";\n' +
  "const PHASE_27GO_HARNESS_PATH =\n" +
  '  "testing/admin-discovery-manual-claim-diagnostic-logging-static-assertions.mjs";\n' +
  "const PHASE_27GO_SUCCESS_MARKER =\n" +
  '  "PASS: admin discovery manual-claim diagnostic logging static assertions (32 assertions)";\n';
const catalogIdentityBlock =
  '  [PHASE_27GO_ROUTE_PATH, "' +
  expectedRouteHash +
  '"],\n' +
  '  [PHASE_27GO_HARNESS_PATH, "' +
  expectedHarnessHash +
  '"],\n';
const catalogHarnessParse =
  "const phase27goHarness = parseFile(PHASE_27GO_HARNESS_PATH, ts.ScriptKind.JS);\n";
const catalogMarkerPredicate =
  "    phase27goHarness.text.includes(PHASE_27GO_SUCCESS_MARKER) &&\n";

check(
  "A30",
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
  "the catalog lost its exact 24-assertion identity or exact Phase 27GO integration.",
);

const normalizedCatalog = catalog.text
  .replace(catalogConstants, "")
  .replace(catalogIdentityBlock, "")
  .replace(catalogHarnessParse, "")
  .replace(catalogMarkerPredicate, "");
check(
  "A31",
  hashText(normalizedCatalog) === BASELINE_CATALOG_HASH,
  "the catalog does not normalize exactly to the approved pre-Phase 27GO identity.",
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
  { length: 32 },
  (_, index) => "A" + String(index + 1).padStart(2, "0"),
);
check(
  "A32",
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
        isRegularFile(relativePath) &&
        isLfOnly(relativePath),
    ) &&
    gitMode(ROUTE_PATH) === "100644" &&
    gitMode(CATALOG_PATH) === "100644" &&
    gitMode(HARNESS_PATH) === "" &&
    [...SUPPORTING_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash &&
        gitMode(relativePath) === "100644" &&
        mode(relativePath) === 0o644 &&
        isRegularFile(relativePath) &&
        isLfOnly(relativePath),
    ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash &&
        mode(relativePath) === 0o644 &&
        isRegularFile(relativePath),
    ) &&
    harnessCheckIds.length === 32 &&
    harnessCheckIds.every((id) => id !== null) &&
    expectedHarnessCheckIds.every(
      (expectedId) =>
        harnessCheckIds.filter((actualId) => actualId === expectedId).length ===
        1,
    ) &&
    harnessCheckIds.every((id) => expectedHarnessCheckIds.includes(id)) &&
    harnessText.includes(SUCCESS_MARKER) &&
    canonicalRouteHash === CANONICAL_ROUTE_HASH,
  "the exact scope, mode, LF, identity, branch, baseline ref, empty index, governance, assertion, or no-stage boundary changed.",
);

process.stdout.write(SUCCESS_MARKER + "\n");
