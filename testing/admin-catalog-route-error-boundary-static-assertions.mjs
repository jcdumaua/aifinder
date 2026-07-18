#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const SUBMISSIONS_PATH = "app/api/admin/submissions/route.ts";
const TOOLS_PATH = "app/api/admin/tools/route.ts";
const AUDIT_WRITER_PATH = "lib/admin-audit-log.ts";
const LOGIN_HARNESS_PATH =
  "testing/admin-login-route-security-static-assertions.mjs";
const ADMIN_SHELL_PATH = "testing/admin-shell-supabase-read-hardening.test.mjs";
const AUDIT_ROUTE_HARNESS_PATH =
  "testing/audit-logs-route-security-static-assertions.mjs";

const EXPECTED_SUBMISSIONS_EXPORTS = new Set([
  "runtime",
  "dynamic",
  "GET",
  "POST",
  "PUT",
  "PATCH",
]);
const EXPECTED_TOOLS_EXPORTS = new Set([
  "runtime",
  "dynamic",
  "GET",
  "POST",
  "PUT",
  "DELETE",
]);

const TRUSTED_SUBMISSION_MESSAGES = new Set([
  "Invalid request format.",
  "Request is too large.",
  "Invalid request body.",
  "Submission ID is invalid.",
  "Tool name is required.",
  "Tool name contains invalid characters.",
  "Tool name must be 80 characters or fewer.",
  "Tool name contains unsafe content.",
  "Category is required.",
  "Category contains invalid characters.",
  "Category must be 40 characters or fewer.",
  "Please select a valid category.",
  "Description is required.",
  "Description contains invalid characters.",
  "Description must be 500 characters or fewer.",
  "Description contains unsafe content.",
  "Pricing contains invalid characters.",
  "Pricing must be 80 characters or fewer.",
  "Please select a valid pricing option.",
  "Website URL is required.",
  "Website URL contains invalid characters.",
  "Website URL must be 500 characters or fewer.",
  "Website URL must be a valid URL.",
  "Website URL must start with https://",
  "Website URL cannot contain username or password.",
  "Website URL cannot use local or private addresses.",
  "Website URL cannot link directly to a downloadable file.",
  "Logo URL contains invalid characters.",
  "Logo URL must be 500 characters or fewer.",
  "Logo URL must be a valid URL.",
  "Logo URL must start with https://",
  "Logo URL cannot contain username or password.",
  "Logo URL cannot use local or private addresses.",
  "Logo URL cannot link directly to a downloadable file.",
  "Unable to check existing tools.",
  "Unable to check pending submissions.",
]);
const TRUSTED_TOOL_MESSAGES = new Set([
  ...TRUSTED_SUBMISSION_MESSAGES,
  "Tool ID is invalid.",
  "Tool name must include at least one URL-safe character.",
  "Unable to check existing tool slugs.",
]);
TRUSTED_TOOL_MESSAGES.delete("Submission ID is invalid.");
TRUSTED_TOOL_MESSAGES.delete("Unable to check pending submissions.");

const SUBMISSION_EVENTS = new Map([
  ["admin_submissions_duplicate_live_tool_check_failed", "error"],
  ["admin_submissions_duplicate_pending_check_failed", "error"],
  ["admin_submissions_load_failed", "error"],
  ["admin_submissions_stats_load_failed", "error"],
  ["admin_submissions_get_unexpected_failure", "error"],
  ["admin_submission_approval_rpc_failed", "error"],
  ["admin_submission_update_failed", "error"],
  ["admin_submission_rejection_failed", "error"],
]);
const TOOL_EVENTS = new Map([
  ["admin_tools_duplicate_domain_check_failed", "error"],
  ["admin_tools_duplicate_slug_check_failed", "error"],
  ["admin_tools_load_failed", "error"],
  ["admin_tools_get_unexpected_failure", "error"],
  ["admin_tool_add_failed", "error"],
  ["admin_tool_update_failed", "error"],
  ["admin_tool_delete_failed", "error"],
]);
const AUDIT_EVENTS = new Map([
  ["admin_audit_log_insert_rejected", "error"],
  ["admin_audit_log_unexpected_failure", "error"],
]);

const PROTECTED_HASHES = new Map([
  ["lib/admin-auth.ts", "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc"],
  ["lib/supabase-admin.ts", "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae"],
  ["lib/tool-validation.ts", "8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba"],
  ["lib/tool-categories.ts", "5d7ae105a6539b070cdc214316ec37f2f2970c0a377ceef761e159d3cb619046"],
  [ADMIN_SHELL_PATH, "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  ["supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql", "59535ac5db55e3d083a4c83094e2aabd089046044320d6391833957ea73b719c"],
  ["supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql", "4479be746e7aeb425b62c308d8f0fda04414d743a02e3ba7b200e50a6ee46cc4"],
  ["app/api/admin/login/route.ts", "b5e2c7908a26cfbbaab050436bd81943ae33c1201f8e5f92a9305efba0fe11e2"],
  ["app/api/admin/audit-logs/route.ts", "7b53e0ddccbd0cad69ed28fd39cb206b547df775696f78522d5cd885adef9295"],
  [AUDIT_ROUTE_HARNESS_PATH, "f7d79968e5aac774a0a01cd11fed783f2bc53d9a3b5f63030539ae26dea83eac"],
  ["app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts", "b14d5915778be4449eccea9b2269ab02c5158fd8ea9b553fe78a7717ab0029e0"],
  ["app/api/admin/discovery/candidate-extraction/invoke/route.ts", "7d7692aaf4751b5129cf0c22a2ef7aa55a6adcfddd3e8f2b3b080b0f291075e4"],
  ["app/api/admin/discovery/candidate-extraction/invoke/handler.ts", "bcf390b1e7154adee85d15b96ce5ed85c57e08136d290a880e7907869c8c5c41"],
  ["testing/discovery-candidate-extraction-invocation-route.test.mjs", "b904185546f38878d2a869a554d801337357a30c8649218a6902c02fcab2f668"],
  ["testing/discovery-candidate-extraction-invoke-route-export-contract-static-assertions.mjs", "cca9474c1e1168d3aa8e29b5fa824ae504ffb653137afa2c655d143a66e75af4"],
  ["app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts", "f42eb9f67823bcd5e0797e7d52991eb64fe8a4caec72f06c0cc52041a1a4e3fb"],
  ["testing/discovery-candidate-decision-route-export-contract-static-assertions.mjs", "ad3d3cdd2773eba2aa62cd04b14a194c77e110699591d7be302414c13934f59d"],
  ["testing/admin-mutation-diagnostic-logging-static-assertions.mjs", "308029c59deb892b74eb6df8c606f0f2256dd8aab6ec702c315e9cd0a0b48250"],
  ["app/api/admin/discovery/candidate-staging-queue/handler.ts", "9a6b16457620721c57e33d0e9b4c4ee4e46abe9bbce81aa7a0d9809d80ae3754"],
  ["app/api/admin/discovery/candidate-staging-queue/route.ts", "7dd883c20bf1559a1ff7139b0347314c533c9e45e2c36cf7dd5465481abe8741"],
  ["testing/discovery-candidate-staging-queue-api-read-route.test.mjs", "ce80eec655b466158f906dec382462998638c21fb43a422a53c219ddc3a54a99"],
  ["testing/discovery-candidate-staging-queue-read-route-export-contract-static-assertions.mjs", "7d451328501768347df78c4b2f6cc22292b105fa359e104f7c6c34ebd9c6cf36"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/route.ts", "c1005ed25788bb0f3499464bbb4add13c9c33d87bd6b33fc38dfc4007a4fef64"],
  ["app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts", "d4caae0a42723ecba1a19248f27525105faec4eb568201a5ee4fe666d7add0bf"],
  ["testing/discovery-candidate-preview-route.test.mjs", "2f1f0d183cdf566876e02ccbbd2b7800c7080e65cb39c12bbd82adfaa39fe5f1"],
  ["testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs", "a7dc69efc47dce2bae1d206ca6ee32d21ef4e3f096ee604fa57e9c3b7aa1363f"],
  ["testing/discovery-candidate-preview-route-export-contract-static-assertions.mjs", "32ca45d158a547a6cc66100d0975e1697e139e0cf9a90ebff1ef05c94b7b4ae3"],
  ["app/api/admin/discovery/runs/route.ts", "62b84b6e7dee14d51383c403f3ce7e48815f92e81730cf283baa74620547a0ee"],
  ["app/api/admin/discovery/discovered-tools/route.ts", "aedd49386666d12cdda85608d20d850de48c9614570c4965b2fb612f2cd48010"],
  ["testing/admin-discovery-read-route-diagnostic-logging-static-assertions.mjs", "b3a4eaf7ae7e12ac6be8aa53642adbb1174c399356d014cad4b05d3e95de5b6d"],
]);

const GOVERNANCE_HASHES = new Map([
  ["docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md", "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"],
  ["docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md", "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"],
  ["docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md", "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"],
  ["docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md", "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"],
  ["docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md", "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"],
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

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
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

function first(root, predicate) {
  let match = null;
  walk(root, (node) => {
    if (!match && predicate(node)) match = node;
  });
  return match;
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function setsEqual(actual, expected) {
  return actual.size === expected.size &&
    [...actual].every((value) => expected.has(value));
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

function functionDeclaration(record, name) {
  return record.sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
}

function exportedRuntimeNames(record) {
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
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text);
    }
  }
  return names;
}

function importModules(record) {
  return new Set(
    record.sourceFile.statements
      .filter(ts.isImportDeclaration)
      .map((statement) => statement.moduleSpecifier.text),
  );
}

function firstStatementIsServerOnly(record) {
  const statement = record.sourceFile.statements[0];
  return Boolean(
    statement &&
      ts.isImportDeclaration(statement) &&
      !statement.importClause &&
      statement.moduleSpecifier.text === "server-only",
  );
}

function consoleCalls(recordOrNode) {
  const root = recordOrNode.sourceFile || recordOrNode;
  return collect(root, (node) => {
    if (!ts.isCallExpression(node)) return false;
    return (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "console"
    );
  });
}

function fixedConsoleEvents(record) {
  return consoleCalls(record).map((call) => ({
    call,
    method: call.expression.name.text,
    event:
      call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0])
        ? call.arguments[0].text
        : null,
  }));
}

function hasDirectCaughtResponseLeak(record) {
  const diagnostics = new Set(["message", "stack", "cause", "details", "hint"]);
  return collect(record.sourceFile, ts.isCatchClause).some((catchClause) => {
    const caught = catchClause.variableDeclaration?.name;
    if (!caught || !ts.isIdentifier(caught)) return false;
    const caughtName = caught.text;
    return callsNamed(catchClause.block, "jsonResponse").some((call) =>
      call.arguments.some((argument) =>
        Boolean(
          first(argument, (node) => {
            if (
              ts.isPropertyAccessExpression(node) &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === caughtName &&
              diagnostics.has(node.name.text)
            ) {
              return true;
            }
            if (
              ts.isSpreadAssignment(node) &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === caughtName
            ) {
              return true;
            }
            if (
              ts.isShorthandPropertyAssignment(node) &&
              node.name.text === caughtName
            ) {
              return true;
            }
            return false;
          }),
        ),
      ),
    );
  });
}

function variableInitializer(record, name) {
  const declaration = first(
    record.sourceFile,
    (node) =>
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name,
  );
  return declaration?.initializer || null;
}

function stringSetInitializer(record, name) {
  const initializer = variableInitializer(record, name);
  if (
    !initializer ||
    !ts.isNewExpression(initializer) ||
    initializer.expression.getText() !== "Set" ||
    initializer.arguments?.length !== 1 ||
    !ts.isArrayLiteralExpression(initializer.arguments[0])
  ) {
    return null;
  }
  const values = new Set();
  for (const element of initializer.arguments[0].elements) {
    if (!ts.isStringLiteral(element)) return null;
    values.add(element.text);
  }
  return values;
}

function methodBody(record, method) {
  return functionDeclaration(record, method)?.body || null;
}

function occurrences(text, marker) {
  return text.split(marker).length - 1;
}

function hasMethodCatchFallback(record, method, fallback) {
  const body = methodBody(record, method);
  const catchClause = body ? collect(body, ts.isCatchClause)[0] : null;
  if (!catchClause?.variableDeclaration?.name) return false;
  const response = callsNamed(catchClause.block, "jsonResponse")[0];
  if (!response || response.arguments.length !== 2) return false;
  const helperCall = first(
    response.arguments[0],
    (node) =>
      ts.isCallExpression(node) &&
      callName(node) === "getTrustedRequestErrorMessage",
  );
  return Boolean(
    helperCall &&
      helperCall.arguments[0]?.getText() ===
        catchClause.variableDeclaration.name.getText() &&
      ts.isStringLiteral(helperCall.arguments[1]) &&
      helperCall.arguments[1].text === fallback &&
      ts.isNumericLiteral(response.arguments[1]) &&
      response.arguments[1].text === "400",
  );
}

function securityOrder(record) {
  const security = functionDeclaration(record, "requireAdminSecurity");
  if (!security?.body) return false;
  const rate = callsNamed(security.body, "checkAdminRateLimit");
  const auth = callsNamed(security.body, "isAuthorizedAdminRequest");
  const csrf = callsNamed(security.body, "verifyAdminCsrfRequest");
  if (rate.length !== 1 || auth.length !== 1 || csrf.length !== 1) return false;
  if (!(rate[0].getStart() < auth[0].getStart() && auth[0].getStart() < csrf[0].getStart())) {
    return false;
  }
  return [...exportedRuntimeNames(record)]
    .filter((name) => ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(name))
    .every((name) => {
      const body = methodBody(record, name);
      if (!body) return false;
      const securityCalls = callsNamed(body, "requireAdminSecurity");
      const bodyReads = callsNamed(body, "readJsonBody");
      const privileged = first(
        body,
        (node) => ts.isIdentifier(node) && node.text === "supabaseAdmin",
      );
      const firstDownstream = [bodyReads[0], privileged]
        .filter(Boolean)
        .sort((left, right) => left.getStart() - right.getStart())[0];
      return securityCalls.length === 1 &&
        (!firstDownstream || securityCalls[0].getStart() < firstDownstream.getStart());
    });
}

function exactEventContract(record, expected) {
  const events = fixedConsoleEvents(record);
  return events.length === expected.size &&
    events.every(
      ({ event, method }) =>
        event && expected.get(event) === method,
    );
}

function callStringArguments(record, call) {
  return callsNamed(record.sourceFile, call)
    .map((candidate) => candidate.arguments[0])
    .filter(ts.isStringLiteral)
    .map((argument) => argument.text);
}

function auditDetailKeys(record) {
  const keys = new Set();
  for (const call of callsNamed(record.sourceFile, "createAdminAuditLog")) {
    const input = call.arguments[0];
    if (!input || !ts.isObjectLiteralExpression(input)) continue;
    const details = input.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) && property.name.getText() === "details",
    );
    if (!details || !ts.isPropertyAssignment(details)) continue;
    if (!ts.isObjectLiteralExpression(details.initializer)) continue;
    for (const property of details.initializer.properties) {
      if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
        keys.add(property.name.getText().replace(/^['"]|['"]$/g, ""));
      }
    }
  }
  return keys;
}

// A01 must read and parse only the submissions route.
const submissions = parseFile(SUBMISSIONS_PATH);
check(
  "A01",
  !hasDirectCaughtResponseLeak(submissions),
  `${SUBMISSIONS_PATH} serializes caught Error.message into an admin API response.`,
);

// No other repository file is read until A01 has completed successfully.
const tools = parseFile(TOOLS_PATH);
const auditWriter = parseFile(AUDIT_WRITER_PATH);
const loginHarness = parseFile(LOGIN_HARNESS_PATH, ts.ScriptKind.JS);
const adminShell = parseFile(ADMIN_SHELL_PATH, ts.ScriptKind.JS);
const auditRouteHarness = parseFile(AUDIT_ROUTE_HARNESS_PATH, ts.ScriptKind.JS);

check(
  "A02",
  !hasDirectCaughtResponseLeak(tools),
  `${TOOLS_PATH} serializes caught diagnostics into an admin API response.`,
);

check(
  "A03",
  [submissions, tools, auditWriter].every(firstStatementIsServerOnly) &&
    [submissions, tools, auditWriter].every(
      (record) => !record.text.includes('"use client"') && !record.text.includes("'use client'"),
    ),
  "the submissions route, tools route, and audit writer do not all begin with the explicit server-only boundary.",
);

check(
  "A04",
  setsEqual(exportedRuntimeNames(submissions), EXPECTED_SUBMISSIONS_EXPORTS) &&
    setsEqual(exportedRuntimeNames(tools), EXPECTED_TOOLS_EXPORTS) &&
    compact(variableInitializer(submissions, "runtime")?.getText() || "") === '"nodejs"' &&
    compact(variableInitializer(submissions, "dynamic")?.getText() || "") === '"force-dynamic"' &&
    compact(variableInitializer(tools, "runtime")?.getText() || "") === '"nodejs"' &&
    compact(variableInitializer(tools, "dynamic")?.getText() || "") === '"force-dynamic"',
  "the admin catalog App Router export surface or route configuration changed.",
);

function responseProtection(record) {
  const directJson = callsNamed(record.sourceFile, "json").filter(
    (call) => call.expression.getText() === "NextResponse.json",
  );
  const helper = functionDeclaration(record, "jsonResponse");
  if (directJson.length !== 1 || !helper?.body) return false;
  if (directJson[0].getStart() < helper.body.getStart() || directJson[0].getEnd() > helper.body.getEnd()) {
    return false;
  }
  return record.text.includes('"Cache-Control": "no-store"') &&
    record.text.includes('"X-Content-Type-Options": "nosniff"') &&
    record.text.includes("Too many admin requests. Please wait and try again.");
}
check(
  "A05",
  responseProtection(submissions) && responseProtection(tools),
  "admin catalog JSON responses are not centralized through no-store and nosniff protection.",
);

check(
  "A06",
  securityOrder(submissions) && securityOrder(tools),
  "rate limiting, authentication, CSRF enforcement, or per-method security ordering changed.",
);

check(
  "A07",
  [submissions, tools].every(
    (record) =>
      compact(variableInitializer(record, "ADMIN_RATE_LIMIT_MAX_REQUESTS")?.getText() || "") === "80" &&
      compact(variableInitializer(record, "ADMIN_RATE_LIMIT_WINDOW_MS")?.getText() || "") === "15*60*1000" &&
      record.text.includes('request.headers.get("x-forwarded-for")') &&
      record.text.includes('request.headers.get("x-real-ip")') &&
      record.text.includes("Too many admin requests. Please wait and try again.") &&
      record.text.includes("429"),
  ),
  "the 80-per-15-minute rate-limit envelope, IP derivation, or fixed 429 response changed.",
);

check(
  "A08",
  [submissions, tools].every((record) => {
    const readBody = functionDeclaration(record, "readJsonBody");
    return Boolean(
      readBody?.body &&
        compact(variableInitializer(record, "MAX_BODY_SIZE_BYTES")?.getText() || "") === "20*1024" &&
        callsNamed(readBody.body, "json").length === 1 &&
        readBody.body.getText().includes('contentType.includes("application/json")') &&
        readBody.body.getText().includes("contentLength > MAX_BODY_SIZE_BYTES") &&
        readBody.body.getText().includes('typeof body !== "object"') &&
        readBody.body.getText().includes("Array.isArray(body)") &&
        readBody.body.getText().includes("Invalid request format.") &&
        readBody.body.getText().includes("Request is too large.") &&
        readBody.body.getText().includes("Invalid request body.")
    );
  }),
  "the JSON content-type, 20 KiB declared-size, object-body, or parsing error contract changed.",
);

function trustedMapping(record, expectedMessages) {
  const actual = stringSetInitializer(record, "TRUSTED_REQUEST_ERROR_MESSAGES");
  const helper = functionDeclaration(record, "getTrustedRequestErrorMessage");
  if (!actual || !setsEqual(actual, expectedMessages) || !helper?.body) return false;
  const helperText = compact(helper.body.getText());
  return helperText.includes("errorinstanceofError") &&
    helperText.includes("TRUSTED_REQUEST_ERROR_MESSAGES.has(error.message)") &&
    helperText.includes("returnerror.message") &&
    helperText.includes("returnfallback") &&
    !helperText.includes("RegExp") &&
    !helperText.includes("startsWith") &&
    !helperText.includes("includes(error.message)");
}
check(
  "A09",
  trustedMapping(submissions, TRUSTED_SUBMISSION_MESSAGES) &&
    trustedMapping(tools, TRUSTED_TOOL_MESSAGES),
  "trusted validation errors are not constrained by the exact literal allowlist and fixed fallback mechanism.",
);

check(
  "A10",
  hasMethodCatchFallback(submissions, "POST", "Failed to approve submission.") &&
    hasMethodCatchFallback(submissions, "PUT", "Failed to update submission.") &&
    hasMethodCatchFallback(submissions, "PATCH", "Failed to reject submission.") &&
    hasMethodCatchFallback(tools, "POST", "Failed to add tool.") &&
    hasMethodCatchFallback(tools, "PUT", "Failed to update tool.") &&
    hasMethodCatchFallback(tools, "DELETE", "Failed to delete tool."),
  "unexpected mutation failures do not collapse to the fixed operation-specific 400 responses.",
);

check(
  "A11",
  exactEventContract(submissions, SUBMISSION_EVENTS),
  "submissions logging is not the exact fixed categorical event set with no dynamic diagnostic arguments.",
);

check(
  "A12",
  exactEventContract(tools, TOOL_EVENTS),
  "tools logging is not the exact fixed categorical event set with no dynamic diagnostic arguments.",
);

check(
  "A13",
  submissions.text.includes('.eq("normalized_domain", normalizedDomain)') &&
    submissions.text.includes('.eq("status", "pending")') &&
    submissions.text.includes("submission.id === excludedSubmissionId") &&
    tools.text.includes('.eq("normalized_domain", normalizedDomain)') &&
    tools.text.includes("query = query.neq(\"id\", excludedToolId)") &&
    occurrences(submissions.text, "findDuplicateToolDomain(") === 3 &&
    occurrences(submissions.text, "findDuplicatePendingSubmissionDomain(") === 2 &&
    occurrences(tools.text, "findDuplicateWebsiteDomain(") === 3,
  "normalized-domain duplicate checks or record-exclusion behavior changed.",
);

const domainMigration = parseFile(
  "supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql",
  ts.ScriptKind.Unknown,
);
const rpcMigration = parseFile(
  "supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql",
  ts.ScriptKind.Unknown,
);
check(
  "A14",
  sha256(domainMigration.relativePath) === PROTECTED_HASHES.get(domainMigration.relativePath) &&
    sha256(rpcMigration.relativePath) === PROTECTED_HASHES.get(rpcMigration.relativePath) &&
    domainMigration.text.includes("tools_normalized_domain_unique") &&
    domainMigration.text.includes("submitted_tools_pending_normalized_domain_unique") &&
    rpcMigration.text.includes("aifinder_tool_slug") &&
    rpcMigration.text.includes("grant execute on function public.approve_submitted_tool(bigint) to service_role"),
  "database duplicate-domain, slug, or service-role approval guards differ from the protected migrations.",
);

const submissionsGet = methodBody(submissions, "GET");
check(
  "A15",
  Boolean(
    submissionsGet &&
      submissionsGet.getText().includes("id, name, category, description, website, pricing, logo_url, submitter_name, submitter_email, status, created_at") &&
      submissionsGet.getText().includes('.eq("status", "pending")') &&
      submissionsGet.getText().includes('.order("created_at", { ascending: false })') &&
      occurrences(submissionsGet.getText(), '.select("*", { count: "exact", head: true })') === 4 &&
      callsNamed(submissionsGet, "createAdminAuditLog").length === 0 &&
      callsNamed(submissionsGet, "update").length === 0 &&
      callsNamed(submissionsGet, "rpc").length === 0
  ),
  "the pending-submission projection, ordering, four statistics counts, or read-only GET boundary changed.",
);

const submissionsPost = methodBody(submissions, "POST");
check(
  "A16",
  Boolean(
    submissionsPost &&
      occurrences(submissionsPost.getText(), '.rpc(') === 1 &&
      submissionsPost.getText().includes('"approve_submitted_tool"') &&
      submissionsPost.getText().includes("submission_id: submissionId") &&
      submissionsPost.getText().includes('.from("submitted_tools")') &&
      submissionsPost.getText().includes('.eq("status", "pending")') &&
      submissionsPost.getText().includes("findDuplicateToolDomain(normalizedDomain)") &&
      rpcMigration.text.includes("revoke all on function public.approve_submitted_tool(bigint) from authenticated")
  ),
  "submission approval no longer preserves the pending fetch, normalized-domain precheck, one RPC, exact argument, and service-role grant.",
);

const submissionsPut = methodBody(submissions, "PUT");
const submissionsPatch = methodBody(submissions, "PATCH");
check(
  "A17",
  Boolean(
    submissionsPost && submissionsPut && submissionsPatch &&
      submissionsPost.getText().includes('action: "submission_approved"') &&
      submissionsPut.getText().includes('action: "submission_updated"') &&
      submissionsPatch.getText().includes('action: "submission_rejected"') &&
      submissionsPut.getText().includes('.eq("status", "pending")') &&
      submissionsPatch.getText().includes('.update({ status: "rejected" })') &&
      submissionsPatch.getText().includes('.eq("status", "pending")') &&
      submissionsPost.getText().indexOf("approve_submitted_tool") < submissionsPost.getText().indexOf("createAdminAuditLog") &&
      submissionsPut.getText().indexOf(".update({") < submissionsPut.getText().indexOf("createAdminAuditLog") &&
      submissionsPatch.getText().indexOf('.update({ status: "rejected" })') < submissionsPatch.getText().indexOf("createAdminAuditLog") &&
      submissions.text.includes("Submission approved and added to tools.") &&
      submissions.text.includes("Submission updated.") &&
      submissions.text.includes("Submission rejected.")
  ),
  "submission mutations, status filters, audit actions/details ordering, statuses, or success shapes changed.",
);

const toolsGet = methodBody(tools, "GET");
check(
  "A18",
  Boolean(
    toolsGet &&
      toolsGet.getText().includes("id, name, category, description, website, pricing, logo_url, status, deleted_at") &&
      toolsGet.getText().includes('.order("id", { ascending: false })') &&
      callsNamed(toolsGet, "insert").length === 0 &&
      callsNamed(toolsGet, "update").length === 0 &&
      callsNamed(toolsGet, "createAdminAuditLog").length === 0
  ),
  "the tools projection, ordering, or read-only GET boundary changed.",
);

const toolsPost = methodBody(tools, "POST");
const toolsPut = methodBody(tools, "PUT");
const toolsDelete = methodBody(tools, "DELETE");
check(
  "A19",
  Boolean(
    toolsPost && toolsPut && toolsDelete &&
      toolsPost.getText().includes('.from("tools").insert([') &&
      toolsPost.getText().includes('status: "approved"') &&
      toolsPost.getText().includes('action: "tool_added"') &&
      toolsPut.getText().includes('.from("tools")') &&
      toolsPut.getText().includes('.update({') &&
      toolsPut.getText().includes('.eq("id", cleanBody.id)') &&
      toolsPut.getText().includes('action: "tool_updated"') &&
      toolsDelete.getText().includes('status: "archived"') &&
      toolsDelete.getText().includes('.is("deleted_at", null)') &&
      toolsDelete.getText().includes('action: "tool_deleted"') &&
      toolsPost.getText().indexOf(".insert([") < toolsPost.getText().indexOf("createAdminAuditLog") &&
      toolsPut.getText().indexOf(".update({") < toolsPut.getText().indexOf("createAdminAuditLog") &&
      toolsDelete.getText().indexOf(".update({") < toolsDelete.getText().indexOf("createAdminAuditLog") &&
      tools.text.includes("Tool added.") &&
      tools.text.includes("Tool updated.") &&
      tools.text.includes("Tool archived.")
  ),
  "tool insert, update, archive, filters, audit ordering, or success shapes changed.",
);

const auditAction = auditWriter.sourceFile.statements.find(
  (statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === "AdminAuditAction",
);
const auditActions = new Set(
  auditAction
    ? collect(auditAction.type, ts.isLiteralTypeNode)
        .map((node) => node.literal)
        .filter(ts.isStringLiteral)
        .map((literal) => literal.text)
    : [],
);
const expectedAuditActions = new Set([
  "admin_login_success",
  "admin_login_failed",
  "admin_logout",
  "tool_added",
  "tool_updated",
  "tool_deleted",
  "submission_approved",
  "submission_rejected",
  "submission_updated",
  "logo_uploaded",
]);
check(
  "A20",
  setsEqual(auditActions, expectedAuditActions) &&
    occurrences(auditWriter.text, '.from("admin_audit_logs")') === 1 &&
    occurrences(auditWriter.text, ".insert([") === 1 &&
    auditWriter.text.includes("cleanText(targetType, 100)") &&
    auditWriter.text.includes("String(targetId).slice(0, 100)") &&
    auditWriter.text.includes("cleanText(targetName, 250)") &&
    auditWriter.text.includes("slice(0, 1000)") &&
    auditWriter.text.includes("userAgent.slice(0, 500)") &&
    !auditWriter.text.includes("return error"),
  "the audit action union, sanitizer ceilings, single sink, or client-invisible result changed.",
);

const auditCatch = collect(auditWriter.sourceFile, ts.isCatchClause)[0];
check(
  "A21",
  exactEventContract(auditWriter, AUDIT_EVENTS) &&
    Boolean(auditCatch) &&
    !first(auditCatch.block, ts.isThrowStatement) &&
    !auditWriter.text.includes("error.message") &&
    !auditWriter.text.includes("error?.message"),
  "audit failures do not use exactly two fixed events with no diagnostics, rethrow, or client-visible effect.",
);

const expectedSubmissionModules = new Set([
  "server-only",
  "next/server",
  "../../../../lib/admin-audit-log",
  "../../../../lib/admin-auth",
  "../../../../lib/supabase-admin",
  "../../../../lib/tool-validation",
]);
const expectedToolsModules = new Set(expectedSubmissionModules);
const expectedAuditModules = new Set(["server-only", "./supabase-admin"]);
const routeTables = new Set([
  ...callStringArguments(submissions, "from"),
  ...callStringArguments(tools, "from"),
  ...callStringArguments(auditWriter, "from"),
]);
const routeRpcs = new Set([
  ...callStringArguments(submissions, "rpc"),
  ...callStringArguments(tools, "rpc"),
  ...callStringArguments(auditWriter, "rpc"),
]);
const detailKeys = new Set([
  ...auditDetailKeys(submissions),
  ...auditDetailKeys(tools),
]);
check(
  "A22",
  setsEqual(importModules(submissions), expectedSubmissionModules) &&
    setsEqual(importModules(tools), expectedToolsModules) &&
    setsEqual(importModules(auditWriter), expectedAuditModules) &&
    setsEqual(routeTables, new Set(["tools", "submitted_tools", "admin_audit_logs"])) &&
    setsEqual(routeRpcs, new Set(["approve_submitted_tool"])) &&
    setsEqual(detailKeys, new Set(["category", "website", "pricing"])) &&
    ![submissions, tools, auditWriter].some((record) =>
      /\.(?:storage|upload|remove)\s*\(|public\.tools|discovered_tools|publish/i.test(record.text),
    ),
  "the privileged import, table, RPC, storage, publishing, or audit-detail boundary expanded.",
);

const loginAssertionIds = new Set(
  callsNamed(loginHarness.sourceFile, "check")
    .map((call) => call.arguments[0])
    .filter(ts.isStringLiteral)
    .map((argument) => argument.text),
);
const expectedLoginIds = new Set(
  Array.from({ length: 36 }, (_, index) => `A${String(index + 1).padStart(2, "0")}`),
);
check(
  "A23",
  setsEqual(loginAssertionIds, expectedLoginIds) &&
    loginHarness.text.includes("PASS: admin login route security static assertions (36 assertions)") &&
    adminShell.text.includes("A2 privileged client boundary static assertions passed") &&
    adminShell.text.includes("admin shell Supabase read hardening static assertions passed") &&
    auditRouteHarness.text.includes("Audit logs route security static assertions passed.") &&
    sha256(AUDIT_ROUTE_HARNESS_PATH) === PROTECTED_HASHES.get(AUDIT_ROUTE_HARNESS_PATH),
  "the admin-shell, 36-assertion login, or audit-route security contracts were weakened.",
);

check(
  "A24",
  [...PROTECTED_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
  ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
    ),
  "a protected dependency, Phase 27GA-27GD artifact, migration, harness, or governance identity changed.",
);

process.stdout.write(
  "PASS: admin catalog route error boundary static assertions (24 assertions)\n",
);
