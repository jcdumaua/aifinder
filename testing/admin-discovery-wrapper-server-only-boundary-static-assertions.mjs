#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const WRAPPER_1_PATH =
  "app/api/admin/discovery/candidate-extraction/invoke/route.ts";
const WRAPPER_2_PATH =
  "app/api/admin/discovery/candidate-staging-queue/route.ts";
const WRAPPER_3_PATH =
  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts";
const HANDLER_1_PATH =
  "app/api/admin/discovery/candidate-extraction/invoke/handler.ts";
const HANDLER_2_PATH =
  "app/api/admin/discovery/candidate-staging-queue/handler.ts";
const HANDLER_3_PATH =
  "app/api/admin/discovery/runs/[id]/candidate-preview/handler.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-wrapper-server-only-boundary-static-assertions.mjs";
const EXTRACTION_CONTRACT_PATH =
  "testing/discovery-candidate-extraction-invoke-route-export-contract-static-assertions.mjs";
const STAGING_CONTRACT_PATH =
  "testing/discovery-candidate-staging-queue-read-route-export-contract-static-assertions.mjs";
const PREVIEW_CONTRACT_PATH =
  "testing/discovery-candidate-preview-route-export-contract-static-assertions.mjs";
const ADMIN_SHELL_PATH =
  "testing/admin-shell-supabase-read-hardening.test.mjs";
const SERVER_ONLY_STATEMENT = 'import "server-only";\n';
const BASELINE_HEAD = "f46c95c31152ad87a2b718ca51b5e001f52add7e";
const BASELINE_CATALOG_HASH =
  "841677e038581d18725f601684e4e4c63d0a05f659879d5e3a3664b0e49a1d18";
const BASELINE_STAGING_CONTRACT_HASH =
  "7d451328501768347df78c4b2f6cc22292b105fa359e104f7c6c34ebd9c6cf36";
const BASELINE_PREVIEW_CONTRACT_HASH =
  "32ca45d158a547a6cc66100d0975e1697e139e0cf9a90ebff1ef05c94b7b4ae3";
const SUCCESS_MARKER =
  "PASS: admin discovery wrapper server-only boundary static assertions (30 assertions)";

const STAGING_PRIMARY_BASELINE_PREDICATE =
  "\n  routeImports.modules.length === 1 &&\n" +
  '    routeImports.modules[0] === "./handler" &&\n';
const STAGING_PRIMARY_FINAL_PREDICATE =
  "\n  routeImports.modules.length === 2 &&\n" +
  '    routeImports.modules[0] === "server-only" &&\n' +
  '    routeImports.modules[1] === "./handler" &&\n';
const STAGING_SUMMARY_BASELINE_PREDICATE =
  "\n    routeImports.modules.length === 1 &&\n";
const STAGING_SUMMARY_FINAL_PREDICATE =
  "\n    routeImports.modules.length === 2 &&\n" +
  '    routeImports.modules[0] === "server-only" &&\n' +
  '    routeImports.modules[1] === "./handler" &&\n';
const PREVIEW_BASELINE_PREDICATE =
  '\n  routeImports.modules.length === 1 && routeImports.modules[0] === "./handler" &&\n';
const PREVIEW_FINAL_PREDICATE =
  "\n  routeImports.modules.length === 2 &&\n" +
  '  routeImports.modules[0] === "server-only" &&\n' +
  '  routeImports.modules[1] === "./handler" &&\n';
const STAGING_DECISION_ROUTE_BASELINE_HASH =
  "2b90a0ce7c29d9a5db24cbbe52c631ac8f4e2f8075221948cd08b1456fcf8d1b";
const STAGING_DECISION_ROUTE_FINAL_HASH =
  "f42eb9f67823bcd5e0797e7d52991eb64fe8a4caec72f06c0cc52041a1a4e3fb";
const STAGING_DECISION_HARNESS_BASELINE_HASH =
  "e9f944e81e93c6bc7946b89dfc58b8845557fb18e6747f8955c173a632664c53";
const STAGING_DECISION_HARNESS_FINAL_HASH =
  "ad3d3cdd2773eba2aa62cd04b14a194c77e110699591d7be302414c13934f59d";
const PREVIEW_STAGING_WRAPPER_BASELINE_HASH =
  "7dd883c20bf1559a1ff7139b0347314c533c9e45e2c36cf7dd5465481abe8741";
const PREVIEW_STAGING_WRAPPER_FINAL_HASH =
  "088b8e51b73c9278508806523ae273235fbb6c5ec5d0b02c799f88578d0507e8";
const PREVIEW_STAGING_CONTRACT_BASELINE_HASH =
  "7d451328501768347df78c4b2f6cc22292b105fa359e104f7c6c34ebd9c6cf36";
const PREVIEW_STAGING_CONTRACT_FINAL_HASH =
  "a3ff6bfeaf8e05aded5ebbabbf512ed87d23db7295c0227b9d66b2a9e8890a90";
const CATALOG_STAGING_CONTRACT_FINAL_HASH =
  "a3ff6bfeaf8e05aded5ebbabbf512ed87d23db7295c0227b9d66b2a9e8890a90";
const CATALOG_PREVIEW_CONTRACT_FINAL_HASH =
  "023fdaba4fe81bb6a0f4cb8d0381bd051fd5d97b2d65bdfbd76cb33c79fbe28f";

const WRAPPER_CONTRACTS = [
  {
    path: WRAPPER_1_PATH,
    handlerPath: HANDLER_1_PATH,
    factory: "createCandidateExtractionInvokeHandler",
    method: "POST",
    typeExports: [],
    canonicalHash:
      "7d7692aaf4751b5129cf0c22a2ef7aa55a6adcfddd3e8f2b3b080b0f291075e4",
    finalLfCount: 6,
    finalBytes: 226,
  },
  {
    path: WRAPPER_2_PATH,
    handlerPath: HANDLER_2_PATH,
    factory: "createCandidateStagingQueueReadHandler",
    method: "GET",
    typeExports: [
      "CandidateStagingQueueApiReadErrorResponse",
      "CandidateStagingQueueApiReadResponse",
    ],
    canonicalHash:
      "7dd883c20bf1559a1ff7139b0347314c533c9e45e2c36cf7dd5465481abe8741",
    finalLfCount: 14,
    finalBytes: 406,
  },
  {
    path: WRAPPER_3_PATH,
    handlerPath: HANDLER_3_PATH,
    factory: "createCandidatePreviewRouteHandler",
    method: "GET",
    typeExports: [
      "CandidatePreviewRouteContext",
      "CandidatePreviewRouteDependencies",
    ],
    canonicalHash:
      "c1005ed25788bb0f3499464bbb4add13c9c33d87bd6b33fc38dfc4007a4fef64",
    finalLfCount: 12,
    finalBytes: 322,
  },
];

const HANDLER_HASHES = new Map([
  [
    HANDLER_1_PATH,
    "bcf390b1e7154adee85d15b96ce5ed85c57e08136d290a880e7907869c8c5c41",
  ],
  [
    HANDLER_2_PATH,
    "9a6b16457620721c57e33d0e9b4c4ee4e46abe9bbce81aa7a0d9809d80ae3754",
  ],
  [
    HANDLER_3_PATH,
    "d4caae0a42723ecba1a19248f27525105faec4eb568201a5ee4fe666d7add0bf",
  ],
]);

const CONTRACTS = new Map([
  [
    EXTRACTION_CONTRACT_PATH,
    {
      hash: "cca9474c1e1168d3aa8e29b5fa824ae504ffb653137afa2c655d143a66e75af4",
      marker:
        "PASS: candidate extraction invoke route export contract static assertions (26 assertions)\n",
    },
  ],
  [
    STAGING_CONTRACT_PATH,
    {
      hash: "a3ff6bfeaf8e05aded5ebbabbf512ed87d23db7295c0227b9d66b2a9e8890a90",
      marker:
        "PASS: candidate staging queue read route export contract static assertions (28 assertions)\n",
    },
  ],
  [
    PREVIEW_CONTRACT_PATH,
    {
      hash: "023fdaba4fe81bb6a0f4cb8d0381bd051fd5d97b2d65bdfbd76cb33c79fbe28f",
      marker:
        "PASS: candidate preview route export contract static assertions (27 assertions)\n",
    },
  ],
  [
    ADMIN_SHELL_PATH,
    {
      hash: "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1",
      marker:
        "A2 privileged client boundary static assertions passed\n" +
        "admin shell Supabase read hardening static assertions passed\n",
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

// No repository path other than wrapper 1 is read before this check passes.
const wrapper1AbsolutePath = path.join(REPO_ROOT, WRAPPER_1_PATH);
const wrapper1Text = readFileSync(wrapper1AbsolutePath, "utf8");
check(
  "A01",
  wrapper1Text.startsWith(SERVER_ONLY_STATEMENT),
  WRAPPER_1_PATH + ' does not begin with import "server-only";.',
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

function allCalls(sourceFile) {
  const calls = [];
  walk(sourceFile, (node) => {
    if (ts.isCallExpression(node)) {
      calls.push(node);
    }
  });
  return calls;
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
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          named.push({
            imported: element.propertyName?.text ?? element.name.text,
            local: element.name.text,
            typeOnly: element.isTypeOnly,
          });
        }
      }
      return { module: moduleName, sideEffectOnly: false, named };
    });
}

function typeExportRecords(sourceFile) {
  return sourceFile.statements
    .filter(ts.isExportDeclaration)
    .map((declaration) => ({
      module: declaration.moduleSpecifier?.text ?? null,
      typeOnly: declaration.isTypeOnly,
      names:
        declaration.exportClause && ts.isNamedExports(declaration.exportClause)
          ? declaration.exportClause.elements.map(
              (element) => element.propertyName?.text ?? element.name.text,
            )
          : [],
    }));
}

function exportedVariableRecords(sourceFile) {
  const records = [];
  for (const statement of sourceFile.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        records.push({ name: null, kind: "unsupported" });
      } else if (ts.isStringLiteral(declaration.initializer)) {
        records.push({
          name: declaration.name.text,
          kind: "string",
          value: declaration.initializer.text,
        });
      } else if (
        ts.isCallExpression(declaration.initializer) &&
        ts.isIdentifier(declaration.initializer.expression)
      ) {
        records.push({
          name: declaration.name.text,
          kind: "call",
          callee: declaration.initializer.expression.text,
          arguments: declaration.initializer.arguments.length,
        });
      } else {
        records.push({ name: declaration.name.text, kind: "unsupported" });
      }
    }
  }
  return records;
}

function exactJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function lfCount(text) {
  return (text.match(/\n/g) ?? []).length;
}

function occurrences(text, needle) {
  return text.split(needle).length - 1;
}

function normalizeContract(text, replacements) {
  let normalized = text;
  for (const [finalPredicate, baselinePredicate] of replacements) {
    if (occurrences(normalized, finalPredicate) !== 1) {
      return null;
    }
    normalized = normalized.replace(finalPredicate, baselinePredicate);
  }
  return normalized;
}

function protectedHashEntryCount(text) {
  const marker = "const PROTECTED_HASHES = new Map([";
  if (occurrences(text, marker) !== 1) {
    return null;
  }
  const start = text.indexOf(marker) + marker.length;
  const end = text.indexOf("]);", start);
  if (end === -1) {
    return null;
  }
  return (text.slice(start, end).match(/"[0-9a-f]{64}"/g) ?? []).length;
}

function canonicalWrapperHash(text) {
  return text.startsWith(SERVER_ONLY_STATEMENT)
    ? hashText(text.slice(SERVER_ONLY_STATEMENT.length))
    : null;
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

function hasExactTopLevelShape(record, contract) {
  const expectedImports = [
    { module: "server-only", sideEffectOnly: true, named: [] },
    {
      module: "./handler",
      sideEffectOnly: false,
      named: [
        {
          imported: contract.factory,
          local: contract.factory,
          typeOnly: false,
        },
      ],
    },
  ];
  const expectedTypeExports = contract.typeExports.length
    ? [
        {
          module: "./handler",
          typeOnly: true,
          names: contract.typeExports,
        },
      ]
    : [];
  const expectedVariables = [
    { name: "runtime", kind: "string", value: "nodejs" },
    { name: "dynamic", kind: "string", value: "force-dynamic" },
    {
      name: contract.method,
      kind: "call",
      callee: contract.factory,
      arguments: 0,
    },
  ];
  return (
    exactJson(importRecords(record.sourceFile), expectedImports) &&
    exactJson(typeExportRecords(record.sourceFile), expectedTypeExports) &&
    exactJson(exportedVariableRecords(record.sourceFile), expectedVariables) &&
    record.sourceFile.statements.length ===
      5 + (contract.typeExports.length ? 1 : 0) &&
    record.sourceFile.statements.every(
      (statement) =>
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement) ||
        ts.isVariableStatement(statement),
    ) &&
    allCalls(record.sourceFile).length === 1
  );
}

function hasNoPrivilegedLogic(record) {
  let consoleCalls = 0;
  walk(record.sourceFile, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "console"
    ) {
      consoleCalls += 1;
    }
  });
  return (
    consoleCalls === 0 &&
    !record.text.includes("admin-auth") &&
    !record.text.includes("verifyAdmin") &&
    !record.text.includes("requireAdmin") &&
    !record.text.includes("supabaseAdmin")
  );
}

function handlerBoundaryIsExact(relativePath, expectedHash) {
  const text = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
  return (
    sha256(relativePath) === expectedHash &&
    gitMode(relativePath) === "100644" &&
    mode(relativePath) === 0o644 &&
    isRegularNonSymlink(relativePath) &&
    !text.includes("\r") &&
    text.endsWith("\n") &&
    text.startsWith(SERVER_ONLY_STATEMENT)
  );
}

function runContract(relativePath) {
  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, relativePath)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ?? null,
  };
}

function contractPasses(relativePath) {
  const expected = CONTRACTS.get(relativePath);
  const result = runContract(relativePath);
  return (
    expected &&
    sha256(relativePath) === expected.hash &&
    gitMode(relativePath) === "100644" &&
    mode(relativePath) === 0o644 &&
    isRegularNonSymlink(relativePath) &&
    isLfOnly(relativePath) &&
    result.status === 0 &&
    result.stdout === expected.marker &&
    result.stderr === "" &&
    result.error === null
  );
}

const wrapper2 = parseFile(WRAPPER_2_PATH);
check(
  "A02",
  wrapper2.text.startsWith(SERVER_ONLY_STATEMENT),
  WRAPPER_2_PATH + ' does not begin with import "server-only";.',
);

const wrapper3 = parseFile(WRAPPER_3_PATH);
check(
  "A03",
  wrapper3.text.startsWith(SERVER_ONLY_STATEMENT),
  WRAPPER_3_PATH + ' does not begin with import "server-only";.',
);

const wrapper1 = parseText(WRAPPER_1_PATH, wrapper1Text);
const wrappers = [wrapper1, wrapper2, wrapper3];
check(
  "A04",
  wrappers.every(
    (record) =>
      importRecords(record.sourceFile).filter(
        (entry) => entry.module === "server-only",
      ).length === 1,
  ),
  "a wrapper does not contain exactly one server-only import.",
);

check(
  "A05",
  hasExactTopLevelShape(wrapper1, WRAPPER_CONTRACTS[0]),
  "wrapper 1 changed its factory import, route configuration, POST binding, or zero-argument call.",
);

check(
  "A06",
  canonicalWrapperHash(wrapper1.text) === WRAPPER_CONTRACTS[0].canonicalHash,
  "wrapper 1 canonical SHA-256 changed.",
);

check(
  "A07",
  handlerBoundaryIsExact(HANDLER_1_PATH, HANDLER_HASHES.get(HANDLER_1_PATH)),
  "wrapper 1 handler identity, mode, LF discipline, or server-only boundary changed.",
);

check(
  "A08",
  hasNoPrivilegedLogic(wrapper1),
  "wrapper 1 gained direct console, authorization-helper, or supabaseAdmin logic.",
);

check(
  "A09",
  hasExactTopLevelShape(wrapper2, WRAPPER_CONTRACTS[1]),
  "wrapper 2 changed its factory import, type re-exports, route configuration, GET binding, or zero-argument call.",
);

check(
  "A10",
  canonicalWrapperHash(wrapper2.text) === WRAPPER_CONTRACTS[1].canonicalHash,
  "wrapper 2 canonical SHA-256 changed.",
);

check(
  "A11",
  handlerBoundaryIsExact(HANDLER_2_PATH, HANDLER_HASHES.get(HANDLER_2_PATH)),
  "wrapper 2 handler identity, mode, LF discipline, or server-only boundary changed.",
);

check(
  "A12",
  hasNoPrivilegedLogic(wrapper2),
  "wrapper 2 gained direct console, authorization-helper, or supabaseAdmin logic.",
);

check(
  "A13",
  hasExactTopLevelShape(wrapper3, WRAPPER_CONTRACTS[2]),
  "wrapper 3 changed its factory import, type re-exports, route configuration, GET binding, or zero-argument call.",
);

check(
  "A14",
  canonicalWrapperHash(wrapper3.text) === WRAPPER_CONTRACTS[2].canonicalHash,
  "wrapper 3 canonical SHA-256 changed.",
);

check(
  "A15",
  handlerBoundaryIsExact(HANDLER_3_PATH, HANDLER_HASHES.get(HANDLER_3_PATH)),
  "wrapper 3 handler identity, mode, LF discipline, or server-only boundary changed.",
);

check(
  "A16",
  hasNoPrivilegedLogic(wrapper3),
  "wrapper 3 gained direct console, authorization-helper, or supabaseAdmin logic.",
);

check(
  "A17",
  exactJson(
    WRAPPER_CONTRACTS.map((contract) => contract.method),
    ["POST", "GET", "GET"],
  ) &&
    wrappers.every(
      (record, index) =>
        exportedVariableRecords(record.sourceFile)[2]?.name ===
        WRAPPER_CONTRACTS[index].method,
    ),
  "the wrapper HTTP method bindings are not exactly POST, GET, GET.",
);

check(
  "A18",
  wrappers.every((record, index) => {
    const binding = exportedVariableRecords(record.sourceFile)[2];
    return (
      binding?.kind === "call" &&
      binding.callee === WRAPPER_CONTRACTS[index].factory &&
      binding.arguments === 0 &&
      importRecords(record.sourceFile)[1]?.module === "./handler"
    );
  }),
  "a factory binding, handler specifier, named import, or zero-argument call changed.",
);

check(
  "A19",
  wrappers.every((record) => {
    const variables = exportedVariableRecords(record.sourceFile);
    return (
      exactJson(variables[0], {
        name: "runtime",
        kind: "string",
        value: "nodejs",
      }) &&
      exactJson(variables[1], {
        name: "dynamic",
        kind: "string",
        value: "force-dynamic",
      })
    );
  }),
  "a wrapper runtime or dynamic route configuration changed.",
);

check(
  "A20",
  wrappers.every((record, index) =>
    hasExactTopLevelShape(record, WRAPPER_CONTRACTS[index]),
  ),
  "an unsupported top-level statement, variable, call, factory, argument, route method, or export exists.",
);

check(
  "A21",
  wrappers.every((record, index) => {
    const contract = WRAPPER_CONTRACTS[index];
    return (
      record.relativePath === contract.path &&
      isRegularNonSymlink(contract.path) &&
      gitMode(contract.path) === "100644" &&
      mode(contract.path) === 0o644 &&
      isLfOnly(contract.path) &&
      lfCount(record.text) === contract.finalLfCount &&
      Buffer.byteLength(record.text, "utf8") === contract.finalBytes &&
      canonicalWrapperHash(record.text) === contract.canonicalHash
    );
  }),
  "the exact wrapper source scope, mode, LF discipline, final size, or canonical bytes changed.",
);

check(
  "A22",
  [...HANDLER_HASHES].every(([relativePath, expectedHash]) =>
    handlerBoundaryIsExact(relativePath, expectedHash),
  ),
  "a protected handler identity, mode, LF discipline, or boundary changed.",
);

const catalog = parseFile(CATALOG_PATH, ts.ScriptKind.JS);
const catalogCheckIds = callsNamed(catalog.sourceFile, "check").map((call) =>
  call.arguments.length > 0 && ts.isStringLiteral(call.arguments[0])
    ? call.arguments[0].text
    : null,
);
const expectedCatalogCheckIds = Array.from(
  { length: 24 },
  (_, index) => "A" + String(index + 1).padStart(2, "0"),
);
check(
  "A23",
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
    ),
  "the catalog does not retain exactly A01 through A24 and 24 assertion calls.",
);

const harnessText = readFileSync(TEST_FILE, "utf8");
const wrapperHashes = wrappers.map((record) => hashText(record.text));
const harnessHash = hashText(harnessText);
const catalogConstants =
  "const PHASE_27GR_WRAPPER_1_PATH =\n" +
  '  "app/api/admin/discovery/candidate-extraction/invoke/route.ts";\n' +
  "const PHASE_27GR_WRAPPER_2_PATH =\n" +
  '  "app/api/admin/discovery/candidate-staging-queue/route.ts";\n' +
  "const PHASE_27GR_WRAPPER_3_PATH =\n" +
  '  "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts";\n' +
  "const PHASE_27GR_HARNESS_PATH =\n" +
  '  "testing/admin-discovery-wrapper-server-only-boundary-static-assertions.mjs";\n' +
  "const PHASE_27GR_SUCCESS_MARKER =\n" +
  '  "PASS: admin discovery wrapper server-only boundary static assertions (30 assertions)";\n';
const catalogIdentityBlock =
  '  [PHASE_27GR_WRAPPER_1_PATH, "' +
  wrapperHashes[0] +
  '"],\n' +
  '  [PHASE_27GR_WRAPPER_2_PATH, "' +
  wrapperHashes[1] +
  '"],\n' +
  '  [PHASE_27GR_WRAPPER_3_PATH, "' +
  wrapperHashes[2] +
  '"],\n' +
  '  [PHASE_27GR_HARNESS_PATH, "' +
  harnessHash +
  '"],\n';
const catalogHarnessParse =
  "const phase27grHarness = parseFile(PHASE_27GR_HARNESS_PATH, ts.ScriptKind.JS);\n";
const catalogMarkerPredicate =
  "    phase27grHarness.text.includes(PHASE_27GR_SUCCESS_MARKER) &&\n";
check(
  "A24",
  [
    catalogConstants,
    catalogIdentityBlock,
    catalogHarnessParse,
    catalogMarkerPredicate,
  ].every((addition) => occurrences(catalog.text, addition) === 1),
  "the catalog lacks the exact final wrapper identities, focused-harness identity, or GR marker integration.",
);

const normalizedCatalog = normalizeContract(
  catalog.text
    .replace(catalogConstants, "")
    .replace(catalogIdentityBlock, "")
    .replace(catalogHarnessParse, "")
    .replace(catalogMarkerPredicate, ""),
  [
    [CATALOG_STAGING_CONTRACT_FINAL_HASH, BASELINE_STAGING_CONTRACT_HASH],
    [CATALOG_PREVIEW_CONTRACT_FINAL_HASH, BASELINE_PREVIEW_CONTRACT_HASH],
  ],
);
check(
  "A25",
  normalizedCatalog !== null &&
    hashText(normalizedCatalog) === BASELINE_CATALOG_HASH,
  "the catalog does not normalize exactly to the approved pre-Phase 27GR identity.",
);

check(
  "A26",
  contractPasses(EXTRACTION_CONTRACT_PATH),
  "the candidate-extraction invoke export contract identity or execution result changed.",
);

const stagingContractText = readFileSync(
  path.join(REPO_ROOT, STAGING_CONTRACT_PATH),
  "utf8",
);
const normalizedStagingContract = normalizeContract(stagingContractText, [
  [STAGING_PRIMARY_FINAL_PREDICATE, STAGING_PRIMARY_BASELINE_PREDICATE],
  [STAGING_SUMMARY_FINAL_PREDICATE, STAGING_SUMMARY_BASELINE_PREDICATE],
  [STAGING_DECISION_ROUTE_FINAL_HASH, STAGING_DECISION_ROUTE_BASELINE_HASH],
  [
    STAGING_DECISION_HARNESS_FINAL_HASH,
    STAGING_DECISION_HARNESS_BASELINE_HASH,
  ],
]);
const stagingProtectedHashEntryCount = protectedHashEntryCount(
  stagingContractText,
);
check(
  "A27",
  normalizedStagingContract !== null &&
    hashText(normalizedStagingContract) === BASELINE_STAGING_CONTRACT_HASH &&
    stagingProtectedHashEntryCount === 8 &&
    occurrences(stagingContractText, STAGING_PRIMARY_FINAL_PREDICATE) === 1 &&
    occurrences(stagingContractText, STAGING_SUMMARY_FINAL_PREDICATE) === 1 &&
    occurrences(stagingContractText, STAGING_PRIMARY_BASELINE_PREDICATE) === 0 &&
    occurrences(stagingContractText, STAGING_SUMMARY_BASELINE_PREDICATE) === 0 &&
    contractPasses(STAGING_CONTRACT_PATH),
  "the candidate-staging contract hash, normalization, exact ordered import predicate, or execution result changed.",
);

const previewContractText = readFileSync(
  path.join(REPO_ROOT, PREVIEW_CONTRACT_PATH),
  "utf8",
);
const normalizedPreviewContract = normalizeContract(previewContractText, [
  [PREVIEW_FINAL_PREDICATE, PREVIEW_BASELINE_PREDICATE],
  [PREVIEW_STAGING_WRAPPER_FINAL_HASH, PREVIEW_STAGING_WRAPPER_BASELINE_HASH],
  [
    PREVIEW_STAGING_CONTRACT_FINAL_HASH,
    PREVIEW_STAGING_CONTRACT_BASELINE_HASH,
  ],
]);
const previewProtectedHashEntryCount = protectedHashEntryCount(
  previewContractText,
);
check(
  "A28",
  normalizedPreviewContract !== null &&
    hashText(normalizedPreviewContract) === BASELINE_PREVIEW_CONTRACT_HASH &&
    previewProtectedHashEntryCount === 14 &&
    stagingProtectedHashEntryCount + previewProtectedHashEntryCount === 22 &&
    occurrences(previewContractText, PREVIEW_FINAL_PREDICATE) === 1 &&
    occurrences(previewContractText, PREVIEW_BASELINE_PREDICATE) === 0 &&
    contractPasses(PREVIEW_CONTRACT_PATH),
  "the candidate-preview contract hash, normalization, exact ordered import predicate, or execution result changed.",
);

check(
  "A29",
  contractPasses(ADMIN_SHELL_PATH),
  "the current admin-shell contract identity or execution result changed.",
);

const expectedStatus = new Set([
  " M " + WRAPPER_1_PATH,
  " M " + WRAPPER_2_PATH,
  " M " + WRAPPER_3_PATH,
  " M " + CATALOG_PATH,
  " M " + STAGING_CONTRACT_PATH,
  " M " + PREVIEW_CONTRACT_PATH,
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
  { length: 30 },
  (_, index) => "A" + String(index + 1).padStart(2, "0"),
);
check(
  "A30",
  execGit(["rev-parse", "--show-toplevel"]).trim() === REPO_ROOT &&
    execGit(["remote", "get-url", "origin"]).trim() ===
      "https://github.com/jcdumaua/aifinder.git" &&
    execGit(["branch", "--show-current"]).trim() === "main" &&
    execGit(["rev-parse", "HEAD"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/heads/main"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/remotes/origin/main"]).trim() ===
      BASELINE_HEAD &&
    gitSucceeds(["diff", "--cached", "--quiet"]) &&
    setsEqual(actualStatus, expectedStatus) &&
    setsEqual(
      new Set(changedTrackedPaths),
      new Set([
        WRAPPER_1_PATH,
        WRAPPER_2_PATH,
        WRAPPER_3_PATH,
        CATALOG_PATH,
        STAGING_CONTRACT_PATH,
        PREVIEW_CONTRACT_PATH,
      ]),
    ) &&
    [...WRAPPER_CONTRACTS].every(
      (contract) =>
        gitMode(contract.path) === "100644" &&
        mode(contract.path) === 0o644 &&
        isRegularNonSymlink(contract.path) &&
        isLfOnly(contract.path),
    ) &&
    gitMode(CATALOG_PATH) === "100644" &&
    mode(CATALOG_PATH) === 0o644 &&
    isRegularNonSymlink(CATALOG_PATH) &&
    isLfOnly(CATALOG_PATH) &&
    gitMode(HARNESS_PATH) === "" &&
    mode(HARNESS_PATH) === 0o644 &&
    isRegularNonSymlink(HARNESS_PATH) &&
    isLfOnly(HARNESS_PATH) &&
    [...HANDLER_HASHES].every(([relativePath, expectedHash]) =>
      handlerBoundaryIsExact(relativePath, expectedHash),
    ) &&
    [...CONTRACTS].every(
      ([relativePath, expected]) =>
        sha256(relativePath) === expected.hash &&
        gitMode(relativePath) === "100644" &&
        mode(relativePath) === 0o644 &&
        isRegularNonSymlink(relativePath) &&
        isLfOnly(relativePath),
    ) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) =>
        sha256(relativePath) === expectedHash &&
        gitMode(relativePath) === "" &&
        mode(relativePath) === 0o644 &&
        isRegularNonSymlink(relativePath),
    ) &&
    harnessCheckIds.length === 30 &&
    harnessCheckIds.every((id) => id !== null) &&
    expectedHarnessCheckIds.every(
      (expectedId) =>
        harnessCheckIds.filter((actualId) => actualId === expectedId).length ===
        1,
    ) &&
    harnessCheckIds.every((id) => expectedHarnessCheckIds.includes(id)) &&
    harnessText.includes(SUCCESS_MARKER) &&
    hashText(normalizedCatalog) === BASELINE_CATALOG_HASH &&
    !wrappers.some(
      (record) =>
        record.text.includes("process" + ".env") ||
        record.text.includes("Deno" + ".env"),
    ),
  "the exact scope, mode, LF, identity, branch, refs, empty index, governance, assertion, or no-stage boundary changed.",
);

process.stdout.write(SUCCESS_MARKER + "\n");
