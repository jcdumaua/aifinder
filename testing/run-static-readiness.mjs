import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import {
  GovernanceError,
  compareExactPathSets,
  executableSafetyViolations,
  listRegularFiles,
  parseTypeScriptFile,
  readStrictJson,
  repositoryRoot,
  repositoryStateDigest,
  stableSortedPaths,
  testingTreeDigest,
} from "./static-governance-utils.mjs";

process.env.PATH = "/usr/bin:/bin";
process.env.HOME = "/tmp/aifinder-c1-no-home";

const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const SANDBOX_PATH = path.resolve(
  repositoryRoot,
  "testing/static-readiness-sandbox.mjs",
);
const PER_CHILD_TIMEOUT_MS = 20_000;
const CORE_TOTAL_TIMEOUT_MS = 60_000;
const C1_TOTAL_TIMEOUT_MS = 60_000;
const C2_1_TOTAL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 1_048_576;
const CORE_CHILD_PATHS = [
  "testing/authenticated-browser-security-static-assertions.mjs",
  "testing/production-perimeter-static-assertions.mjs",
  "testing/public-launch-resilience-static-assertions.mjs",
  "testing/public-live-route-security-static-assertions.mjs",
  "testing/public-persistence.test.mjs",
];
const C1_CHILDREN = [
  {
    path: "testing/authenticated-live-route-partial-evidence.test.mjs",
    sha256: "faaadf7789885447f6e394f34f3770cfffe91ffefa6de3f9fc9465f15f85414d",
    imports: ["node:fs", "node:path", "node:url"],
  },
  {
    path: "testing/public-launch-blocker-registry.test.mjs",
    sha256: "bd4f7f7608454cc19fdcbe5be546832f8f473119d0645a8dbb1bf68952e74588",
    imports: [
      "./static-governance-utils.mjs",
      "node:crypto",
      "node:fs",
      "node:path",
    ],
  },
  {
    path: "testing/readiness-coverage-matrix.test.mjs",
    sha256: "eaa953e96c936d92579d160fb7c24983a356da47efb0add4e2e886e92079acac",
    imports: ["./static-governance-utils.mjs", "node:path"],
  },
  {
    path: "testing/static-test-safety-manifest.test.mjs",
    sha256: "bab58f31ae433774257435aa0cdd94aa3213fe9c790d73c634f5396ddd4aa222",
    imports: [
      "./static-governance-utils.mjs",
      "node:crypto",
      "node:fs",
    ],
  },
];
const EXPECTED_C2_1_CHILD_PATHS = [
  "testing/authenticated-live-route-semantic-analyzer.test.mjs",
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
];
const C2_1_CHILDREN = [
  {
    path: "testing/authenticated-live-route-semantic-analyzer.test.mjs",
    sha256: "9affd30884f9ec78dc15621f97effcee9ee96aad3e74c280a6a0f3202673ea84",
    imports: [
      "./authenticated-live-route-semantic-analyzer.mjs",
      "node:assert/strict",
      "node:crypto",
      "node:fs",
      "node:path",
    ],
    readPaths: 31,
  },
  {
    path:
      "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
    sha256: "f17436ce8a6c693cc74106455a9556317fdc222c04b07c502095bb63ef7ee717",
    imports: [
      "node:assert/strict",
      "node:crypto",
      "node:fs",
      "node:path",
      "typescript",
    ],
    readPaths: 39,
  },
];
const C2_1_ANALYZER = {
  path: "testing/authenticated-live-route-semantic-analyzer.mjs",
  sha256: "37d14d7880338a4cde62befa1d36753c03b398c8a441271ba6bb40f1390675b4",
  imports: ["node:crypto", "typescript"],
};
const C2_1_ROUTE_PATHS = [
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
];
const C2_1_ANALYZER_READ_PATHS = [
  ...C2_1_ROUTE_PATHS,
  "testing/authenticated-live-route-partial-evidence.json",
  "testing/readiness-coverage-matrix.json",
  "testing/public-launch-blocker-registry.json",
];
const C2_1_LEDGER_READ_PATHS = [
  ...C2_1_ANALYZER_READ_PATHS,
  "testing/authenticated-live-route-semantic-analyzer.mjs",
  "testing/authenticated-live-route-semantic-analyzer.test.mjs",
  "testing/authenticated-live-route-semantic-branch-ledger.schema.json",
  "testing/authenticated-live-route-semantic-branch-ledger.json",
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const AUTHORIZED_C2_1_PATHS = [
  "testing/authenticated-live-route-semantic-analyzer.mjs",
  "testing/authenticated-live-route-semantic-analyzer.test.mjs",
  "testing/authenticated-live-route-semantic-branch-ledger.schema.json",
  "testing/authenticated-live-route-semantic-branch-ledger.json",
  "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const AUTHORIZED_C1_PATHS = [
  "testing/authenticated-live-route-partial-evidence.schema.json",
  "testing/authenticated-live-route-partial-evidence.json",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/readiness-coverage-matrix.json",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.json",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
];
const CORE_SAFE_RUNTIME_PATH = [
  path.dirname(process.execPath),
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
].join(":");
const CORE_SAFE_ENVIRONMENT = Object.freeze({
  PATH: CORE_SAFE_RUNTIME_PATH,
  HOME: "/tmp",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});
const C1_SAFE_ENVIRONMENT = Object.freeze({
  PATH: "/usr/bin:/bin",
  HOME: "/tmp/aifinder-c1-no-home",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});
const C2_1_SAFE_ENVIRONMENT = Object.freeze({
  PATH: "/usr/bin:/bin",
  HOME: "/tmp/aifinder-c2-1-no-home",
  TMPDIR: "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  CI: "1",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
});
const DENIED_SOURCE_PATTERNS = [
  ["DYNAMIC_IMPORT", /\bimport\s*\(/],
  ["COMMONJS_REQUIRE", /\brequire\s*\(/],
  ["DYNAMIC_CODE", /\b(?:eval|Function)\s*\(/],
  ["ENVIRONMENT_ACCESS", /process\s*(?:\.\s*env|\[\s*["']env["']\s*\])/],
  [
    "NETWORK_GLOBAL",
    /\b(?:fetch|WebSocket|EventSource|XMLHttpRequest)\b/,
  ],
  [
    "NETWORK_MODULE",
    /["']node:(?:http|https|net|tls|dns|dgram|worker_threads|vm|module)["']/,
  ],
  [
    "FILESYSTEM_MUTATION",
    /\b(?:writeFile|appendFile|truncate|unlink|rm|rename|mkdir|rmdir|chmod|chown|symlink|link|copyFile|createWriteStream|open)\w*\s*\(/,
  ],
  [
    "CHILD_PROCESS",
    /\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\s*\(/,
  ],
  ["ALTERNATE_RUNTIME", /\b(?:Deno|Bun)\b/],
  ["ABSOLUTE_SENSITIVE_PATH", /\/(?:etc|var|private|Users)\//],
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactSet(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    compareExactPathSets(actual, expected).equal
  );
}

function outputIdentity(value) {
  return {
    sha256: digest(value),
    bytes: Buffer.byteLength(value),
    lines: value.length === 0 ? 0 : value.split("\n").length - 1,
  };
}

function pathSetDigest(repositoryPaths) {
  return digest(
    repositoryPaths
      .map((repositoryPath) => {
        const bytes = readFileSync(repositoryPath);
        return [repositoryPath, digest(bytes), bytes.length].join("\0");
      })
      .join("\n"),
  );
}

function authorizedSnapshot() {
  return pathSetDigest(AUTHORIZED_C1_PATHS);
}

function authorizedC2Snapshot() {
  return pathSetDigest(AUTHORIZED_C2_1_PATHS);
}

function directStaticModuleEdges(repositoryPath) {
  const { sourceFile } = parseTypeScriptFile(repositoryPath);
  const edges = [];
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      edges.push(statement.moduleSpecifier.text);
    }
  }
  return edges;
}

function validateC1ChildSource(child) {
  const bytes = readFileSync(child.path);
  if (digest(bytes) !== child.sha256) {
    throw new GovernanceError("RUNNER_C1_SOURCE_IDENTITY");
  }
  let imports;
  try {
    imports = directStaticModuleEdges(child.path);
  } catch {
    throw new GovernanceError("RUNNER_C1_IMPORT_SET");
  }
  if (!exactSet(imports, child.imports)) {
    throw new GovernanceError("RUNNER_C1_IMPORT_SET");
  }
  const source = bytes.toString("utf8");
  for (const [stage, pattern] of DENIED_SOURCE_PATTERNS) {
    if (pattern.test(source)) {
      throw new GovernanceError("RUNNER_C1_" + stage);
    }
  }
}

const C2_1_DENIED_SOURCE_PATTERNS = [
  ["DYNAMIC_IMPORT", /\bimport\s*\(/],
  ["COMMONJS_REQUIRE", /\brequire\s*\(/],
  ["CREATE_REQUIRE", /\bcreateRequire\b/],
  ["DYNAMIC_CODE", /\b(?:eval|Function)\s*\(/],
  ["ENVIRONMENT_ACCESS", /process\s*(?:\.\s*env|\[\s*["']env["']\s*\])/],
  ["CHILD_PROCESS", /["']node:child_process["']/],
  [
    "NETWORK_MODULE",
    /["']node:(?:http|https|net|tls|dns|dgram|worker_threads|vm|module)["']/,
  ],
  ["FS_PROMISES", /["'](?:node:)?fs\/promises["']/],
  ["FS_STREAM_OR_HANDLE", /\b(?:createReadStream|createWriteStream|openSync|open)\s*\(/],
  [
    "FILESYSTEM_MUTATION",
    /\b(?:writeFile|appendFile|truncate|unlink|rm|rename|mkdir|rmdir|chmod|chown|symlink|link|copyFile)\w*\s*\(/,
  ],
  [
    "TYPESCRIPT_ESCAPE",
    /\bts\s*\.\s*(?:sys|createProgram|createCompilerHost|readConfigFile|findConfigFile|createWatchProgram|createSemanticDiagnosticsBuilderProgram|createEmitAndSemanticDiagnosticsBuilderProgram)\b/,
  ],
];

function propertyChain(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) {
    const prefix = propertyChain(node.expression);
    return prefix ? prefix + "." + node.name.text : null;
  }
  return null;
}

function validateC2LanguageSurface(sourceFile) {
  const deniedModuleEscapeMembers = new Set([
    "getBuiltinModule",
    "binding",
    "_linkedBinding",
    "dlopen",
  ]);
  const deniedNetworkGlobals = new Set([
    "fetch",
    "WebSocket",
    "EventSource",
    "XMLHttpRequest",
  ]);
  const allowedProcessChains = new Set([
    "process.argv",
    "process.argv.slice",
    "process.cwd",
    "process.exitCode",
    "process.stdout",
    "process.stdout.write",
  ]);
  const allowedTypeScriptMembers = new Set([
    "createSourceFile",
    "forEachChild",
    "getCombinedModifierFlags",
    "ModifierFlags",
    "ScriptTarget",
    "ScriptKind",
    "SyntaxKind",
  ]);
  const visit = (node) => {
    if (
      ts.isIdentifier(node) &&
      deniedNetworkGlobals.has(node.text)
    ) {
      throw new GovernanceError("RUNNER_C2_1_NETWORK_GLOBAL");
    }
    if (ts.isPropertyAccessExpression(node)) {
      const chain = propertyChain(node);
      if (deniedModuleEscapeMembers.has(node.name.text)) {
        throw new GovernanceError("RUNNER_C2_1_MODULE_ESCAPE");
      }
      if (chain?.startsWith("process.")) {
        if (!allowedProcessChains.has(chain)) {
          throw new GovernanceError("RUNNER_C2_1_PROCESS_SURFACE");
        }
      }
      if (ts.isIdentifier(node.expression) && node.expression.text === "ts") {
        const member = node.name.text;
        if (
          !allowedTypeScriptMembers.has(member) &&
          !/^is[A-Z][A-Za-z0-9]*$/.test(member)
        ) {
          throw new GovernanceError("RUNNER_C2_1_TYPESCRIPT_SURFACE");
        }
      }
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["process", "ts"].includes(node.expression.text)
    ) {
      throw new GovernanceError("RUNNER_C2_1_COMPUTED_SURFACE");
    }
    if (
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      deniedModuleEscapeMembers.has(node.argumentExpression.text)
    ) {
      throw new GovernanceError("RUNNER_C2_1_MODULE_ESCAPE");
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function literalReadAllowlist(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== "READ_ALLOWLIST" ||
        !ts.isCallExpression(declaration.initializer) ||
        !ts.isPropertyAccessExpression(declaration.initializer.expression) ||
        !ts.isIdentifier(declaration.initializer.expression.expression) ||
        declaration.initializer.expression.expression.text !== "Object" ||
        declaration.initializer.expression.name.text !== "freeze" ||
        declaration.initializer.arguments.length !== 1 ||
        !ts.isArrayLiteralExpression(declaration.initializer.arguments[0])
      ) continue;
      const values = [];
      for (const element of declaration.initializer.arguments[0].elements) {
        if (!ts.isStringLiteralLike(element)) {
          throw new GovernanceError("RUNNER_C2_1_READ_ALLOWLIST_LITERAL");
        }
        values.push(element.text);
      }
      return values;
    }
  }
  throw new GovernanceError("RUNNER_C2_1_READ_ALLOWLIST_LITERAL");
}

function flattenLogicalOr(node, output = []) {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.BarBarToken
  ) {
    flattenLogicalOr(node.left, output);
    flattenLogicalOr(node.right, output);
  } else {
    output.push(node);
  }
  return output;
}

function exactIdentifier(node, name) {
  return ts.isIdentifier(node) && node.text === name;
}

function exactIdentifierCall(node, name, argumentName) {
  return (
    ts.isCallExpression(node) &&
    exactIdentifier(node.expression, name) &&
    node.arguments.length === 1 &&
    exactIdentifier(node.arguments[0], argumentName)
  );
}

function exactMemberCall(node, receiverName, memberName, argumentName) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    exactIdentifier(node.expression.expression, receiverName) &&
    node.expression.name.text === memberName &&
    node.arguments.length === 1 &&
    exactIdentifier(node.arguments[0], argumentName)
  );
}

function exactZeroArgumentMemberCall(node, receiverName, memberName) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    exactIdentifier(node.expression.expression, receiverName) &&
    node.expression.name.text === memberName &&
    node.arguments.length === 0
  );
}

function singleVariableInitializer(statement, name) {
  if (
    !ts.isVariableStatement(statement) ||
    statement.declarationList.declarations.length !== 1
  ) return null;
  const declaration = statement.declarationList.declarations[0];
  return exactIdentifier(declaration.name, name)
    ? declaration.initializer ?? null
    : null;
}

function exactThrowingBlock(statement) {
  return (
    ts.isBlock(statement) &&
    statement.statements.length === 3 &&
    ts.isVariableStatement(statement.statements[0]) &&
    ts.isExpressionStatement(statement.statements[1]) &&
    ts.isThrowStatement(statement.statements[2])
  );
}

function validateReadExactC2Structure(readFunction) {
  if (
    readFunction.parameters.length !== 1 ||
    !exactIdentifier(readFunction.parameters[0].name, "relativePath") ||
    !readFunction.body ||
    readFunction.body.statements.length !== 9
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER_STRUCTURE");
  }
  const statements = readFunction.body.statements;
  if (
    !ts.isIfStatement(statements[0]) ||
    !exactThrowingBlock(statements[0].thenStatement)
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER_GUARD");
  }
  const predicates = flattenLogicalOr(statements[0].expression);
  const allowPredicate = predicates[3];
  if (
    predicates.length !== 4 ||
    !ts.isBinaryExpression(predicates[0]) ||
    predicates[0].operatorToken.kind !==
      ts.SyntaxKind.ExclamationEqualsEqualsToken ||
    !ts.isTypeOfExpression(predicates[0].left) ||
    !exactIdentifier(predicates[0].left.expression, "relativePath") ||
    !ts.isStringLiteralLike(predicates[0].right) ||
    predicates[0].right.text !== "string" ||
    !exactMemberCall(
      predicates[1],
      "path",
      "isAbsolute",
      "relativePath",
    ) ||
    !ts.isCallExpression(predicates[2]) ||
    !ts.isPropertyAccessExpression(predicates[2].expression) ||
    predicates[2].expression.name.text !== "includes" ||
    predicates[2].arguments.length !== 1 ||
    !ts.isStringLiteralLike(predicates[2].arguments[0]) ||
    predicates[2].arguments[0].text !== ".." ||
    !ts.isCallExpression(predicates[2].expression.expression) ||
    !ts.isPropertyAccessExpression(
      predicates[2].expression.expression.expression,
    ) ||
    !exactIdentifier(
      predicates[2].expression.expression.expression.expression,
      "relativePath",
    ) ||
    predicates[2].expression.expression.expression.name.text !== "split" ||
    predicates[2].expression.expression.arguments.length !== 1 ||
    !ts.isStringLiteralLike(
      predicates[2].expression.expression.arguments[0],
    ) ||
    predicates[2].expression.expression.arguments[0].text !== "/" ||
    !ts.isPrefixUnaryExpression(allowPredicate) ||
    allowPredicate.operator !== ts.SyntaxKind.ExclamationToken ||
    !exactMemberCall(
      allowPredicate.operand,
      "READ_ALLOWLIST_SET",
      "has",
      "relativePath",
    )
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER_GUARD");
  }
  const absoluteInitializer = singleVariableInitializer(
    statements[1],
    "absolutePath",
  );
  const metadataInitializer = singleVariableInitializer(
    statements[3],
    "metadata",
  );
  const bytesInitializer = singleVariableInitializer(statements[6], "bytes");
  const rootPredicates = ts.isIfStatement(statements[2])
    ? flattenLogicalOr(statements[2].expression)
    : [];
  const rootPrefix = rootPredicates[1];
  if (
    rootPredicates.length !== 2 ||
    !ts.isBinaryExpression(rootPredicates[0]) ||
    rootPredicates[0].operatorToken.kind !==
      ts.SyntaxKind.EqualsEqualsEqualsToken ||
    !exactIdentifier(rootPredicates[0].left, "absolutePath") ||
    !exactIdentifier(rootPredicates[0].right, "REPOSITORY_ROOT") ||
    !ts.isPrefixUnaryExpression(rootPrefix) ||
    rootPrefix.operator !== ts.SyntaxKind.ExclamationToken ||
    !ts.isCallExpression(rootPrefix.operand) ||
    !ts.isPropertyAccessExpression(rootPrefix.operand.expression) ||
    !exactIdentifier(
      rootPrefix.operand.expression.expression,
      "absolutePath",
    ) ||
    rootPrefix.operand.expression.name.text !== "startsWith" ||
    rootPrefix.operand.arguments.length !== 1 ||
    !ts.isBinaryExpression(rootPrefix.operand.arguments[0]) ||
    rootPrefix.operand.arguments[0].operatorToken.kind !==
      ts.SyntaxKind.PlusToken ||
    !exactIdentifier(
      rootPrefix.operand.arguments[0].left,
      "REPOSITORY_ROOT",
    ) ||
    !ts.isPropertyAccessExpression(rootPrefix.operand.arguments[0].right) ||
    !exactIdentifier(
      rootPrefix.operand.arguments[0].right.expression,
      "path",
    ) ||
    rootPrefix.operand.arguments[0].right.name.text !== "sep"
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER_ROOT_GUARD");
  }
  const metadataPredicates = ts.isIfStatement(statements[4])
    ? flattenLogicalOr(statements[4].expression)
    : [];
  if (
    metadataPredicates.length !== 2 ||
    !ts.isPrefixUnaryExpression(metadataPredicates[0]) ||
    metadataPredicates[0].operator !== ts.SyntaxKind.ExclamationToken ||
    !exactZeroArgumentMemberCall(
      metadataPredicates[0].operand,
      "metadata",
      "isFile",
    ) ||
    !exactZeroArgumentMemberCall(
      metadataPredicates[1],
      "metadata",
      "isSymbolicLink",
    )
  ) {
    throw new GovernanceError(
      "RUNNER_C2_1_READ_WRAPPER_REGULAR_FILE_GUARD",
    );
  }
  if (
    !ts.isCallExpression(absoluteInitializer) ||
    !ts.isPropertyAccessExpression(absoluteInitializer.expression) ||
    !exactIdentifier(absoluteInitializer.expression.expression, "path") ||
    absoluteInitializer.expression.name.text !== "resolve" ||
    absoluteInitializer.arguments.length !== 2 ||
    !exactIdentifier(absoluteInitializer.arguments[0], "REPOSITORY_ROOT") ||
    !exactIdentifier(absoluteInitializer.arguments[1], "relativePath") ||
    !ts.isIfStatement(statements[2]) ||
    !exactThrowingBlock(statements[2].thenStatement) ||
    !exactIdentifierCall(metadataInitializer, "lstatSync", "absolutePath") ||
    !ts.isIfStatement(statements[4]) ||
    !exactThrowingBlock(statements[4].thenStatement) ||
    !ts.isIfStatement(statements[5]) ||
    !exactThrowingBlock(statements[5].thenStatement) ||
    !ts.isBinaryExpression(statements[5].expression) ||
    statements[5].expression.operatorToken.kind !==
      ts.SyntaxKind.ExclamationEqualsEqualsToken ||
    !exactIdentifierCall(
      statements[5].expression.left,
      "realpathSync",
      "absolutePath",
    ) ||
    !exactIdentifier(statements[5].expression.right, "absolutePath") ||
    !exactIdentifierCall(bytesInitializer, "readFileSync", "absolutePath") ||
    !ts.isExpressionStatement(statements[7]) ||
    !ts.isCallExpression(statements[7].expression) ||
    !ts.isPropertyAccessExpression(statements[7].expression.expression) ||
    !exactIdentifier(
      statements[7].expression.expression.expression,
      "READ_COUNTS",
    ) ||
    statements[7].expression.expression.name.text !== "set" ||
    !ts.isReturnStatement(statements[8]) ||
    !exactIdentifier(statements[8].expression, "bytes")
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER_STRUCTURE");
  }
  return statements[0].expression;
}

function validateReadExactC2Source(sourceFile, source, expectedPaths) {
  const actualPaths = literalReadAllowlist(sourceFile);
  if (!exactSet(actualPaths, expectedPaths)) {
    throw new GovernanceError("RUNNER_C2_1_READ_ALLOWLIST_SET");
  }
  let readFunction = null;
  let fsImportNames = null;
  const fsImportIdentifiers = new Set();
  let allowlistSetDeclaration = null;
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "readExactC2"
    ) readFunction = statement;
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier.text === "node:fs"
    ) {
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) {
        throw new GovernanceError("RUNNER_C2_1_FS_IMPORTS");
      }
      fsImportNames = bindings.elements.map((element) => {
        if (element.propertyName || !ts.isIdentifier(element.name)) {
          throw new GovernanceError("RUNNER_C2_1_FS_IMPORTS");
        }
        fsImportIdentifiers.add(element.name);
        return element.name.text;
      });
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          exactIdentifier(declaration.name, "READ_ALLOWLIST_SET") &&
          declaration.initializer &&
          ts.isNewExpression(declaration.initializer) &&
          exactIdentifier(declaration.initializer.expression, "Set") &&
          declaration.initializer.arguments?.length === 1 &&
          exactIdentifier(
            declaration.initializer.arguments[0],
            "READ_ALLOWLIST",
          ) &&
          (statement.declarationList.flags & ts.NodeFlags.Const) !== 0
        ) {
          if (allowlistSetDeclaration) {
            throw new GovernanceError("RUNNER_C2_1_READ_ALLOWLIST_SET_BINDING");
          }
          allowlistSetDeclaration = declaration.name;
        }
      }
    }
  }
  if (
    !readFunction ||
    !allowlistSetDeclaration ||
    !exactSet(fsImportNames, ["lstatSync", "readFileSync", "realpathSync"])
  ) {
    throw new GovernanceError("RUNNER_C2_1_READ_WRAPPER");
  }
  const allowlistGuardExpression = validateReadExactC2Structure(readFunction);
  let negativeHelperCalls = 0;
  const allowedLoopBindings = new Set(["routePath", "repositoryPath"]);
  const exactPathBindings = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        ts.isStringLiteralLike(declaration.initializer) &&
        expectedPaths.includes(declaration.initializer.text)
      ) {
        if (exactPathBindings.has(declaration.name.text)) {
          throw new GovernanceError("RUNNER_C2_1_READ_CALLSITE");
        }
        exactPathBindings.set(
          declaration.name.text,
          declaration.initializer.text,
        );
      }
    }
  }
  const fsPrimitives = new Set(["lstatSync", "readFileSync", "realpathSync"]);
  const fsCallCounts = new Map(
    [...fsPrimitives].map((primitive) => [primitive, 0]),
  );
  const visit = (node, parent = null, grandparent = null) => {
    if (ts.isIdentifier(node) && fsPrimitives.has(node.text)) {
      if (fsImportIdentifiers.has(node)) {
        // Exact unaliased import binding established above.
      } else if (
        parent &&
        ts.isCallExpression(parent) &&
        parent.expression === node &&
        node.pos >= readFunction.pos &&
        parent.end <= readFunction.end &&
        parent.arguments.length === 1 &&
        exactIdentifier(parent.arguments[0], "absolutePath")
      ) {
        fsCallCounts.set(node.text, fsCallCounts.get(node.text) + 1);
      } else {
        throw new GovernanceError("RUNNER_C2_1_FS_IDENTIFIER_REFERENCE");
      }
    }
    if (exactIdentifier(node, "READ_ALLOWLIST_SET")) {
      if (node === allowlistSetDeclaration) {
        // Exact const declaration established above.
      } else if (
        parent &&
        grandparent &&
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node &&
        parent.name.text === "has" &&
        ts.isCallExpression(grandparent) &&
        grandparent.expression === parent &&
        grandparent.pos >= allowlistGuardExpression.pos &&
        grandparent.end <= allowlistGuardExpression.end
      ) {
        // The only permitted use is the first fail-closed guard.
      } else {
        throw new GovernanceError("RUNNER_C2_1_READ_ALLOWLIST_SET_USAGE");
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callName = node.expression.text;
      if (callName === "readExactC2") {
        if (node.arguments.length !== 1) {
          throw new GovernanceError("RUNNER_C2_1_READ_CALLSITE");
        }
        const argument = node.arguments[0];
        if (ts.isStringLiteralLike(argument)) {
          if (argument.text === "lib/admin-auth.ts") {
            negativeHelperCalls += 1;
          } else if (!expectedPaths.includes(argument.text)) {
            throw new GovernanceError("RUNNER_C2_1_READ_CALLSITE");
          }
        } else if (
          !ts.isIdentifier(argument) ||
          (!allowedLoopBindings.has(argument.text) &&
            !exactPathBindings.has(argument.text))
        ) {
          throw new GovernanceError("RUNNER_C2_1_READ_CALLSITE");
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, node, parent));
  };
  visit(sourceFile);
  if (
    negativeHelperCalls !== 1 ||
    expectedPaths.includes("lib/admin-auth.ts") ||
    [...fsCallCounts.values()].some((count) => count !== 1)
  ) {
    throw new GovernanceError("RUNNER_C2_1_NEGATIVE_READ_SELF_CHECK");
  }
}

function validateC2ModuleSource(moduleContract) {
  const bytes = readFileSync(moduleContract.path);
  if (digest(bytes) !== moduleContract.sha256) {
    throw new GovernanceError("RUNNER_C2_1_SOURCE_IDENTITY");
  }
  let parsed;
  try {
    parsed = parseTypeScriptFile(moduleContract.path);
  } catch {
    throw new GovernanceError("RUNNER_C2_1_PARSE");
  }
  const imports = directStaticModuleEdges(moduleContract.path);
  if (!exactSet(imports, moduleContract.imports)) {
    throw new GovernanceError("RUNNER_C2_1_IMPORT_SET");
  }
  const typeScriptImports = parsed.sourceFile.statements.filter(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier.text === "typescript",
  );
  if (moduleContract.imports.includes("typescript")) {
    const importClause = typeScriptImports[0]?.importClause;
    if (
      typeScriptImports.length !== 1 ||
      !importClause ||
      importClause.isTypeOnly ||
      !exactIdentifier(importClause.name, "ts") ||
      importClause.namedBindings
    ) {
      throw new GovernanceError("RUNNER_C2_1_TYPESCRIPT_BINDING");
    }
  } else if (typeScriptImports.length !== 0) {
    throw new GovernanceError("RUNNER_C2_1_TYPESCRIPT_BINDING");
  }
  const source = bytes.toString("utf8");
  for (const [stage, pattern] of C2_1_DENIED_SOURCE_PATTERNS) {
    if (pattern.test(source)) {
      throw new GovernanceError("RUNNER_C2_1_" + stage);
    }
  }
  validateC2LanguageSurface(parsed.sourceFile);
  return { source, sourceFile: parsed.sourceFile };
}

function validateC2ChildSource(child) {
  const parsed = validateC2ModuleSource(child);
  const expectedPaths = child.readPaths === 31
    ? C2_1_ANALYZER_READ_PATHS
    : C2_1_LEDGER_READ_PATHS;
  validateReadExactC2Source(parsed.sourceFile, parsed.source, expectedPaths);
  const localEdges = child.imports.filter((edge) => edge.startsWith("."));
  if (child.path.includes("semantic-analyzer.test")) {
    if (
      !exactSet(localEdges, ["./authenticated-live-route-semantic-analyzer.mjs"])
    ) {
      throw new GovernanceError("RUNNER_C2_1_CLOSURE");
    }
    validateC2ModuleSource(C2_1_ANALYZER);
  } else if (localEdges.length !== 0) {
    throw new GovernanceError("RUNNER_C2_1_CLOSURE");
  }
}

function validateManifestForExecution() {
  let manifest;
  try {
    manifest = readStrictJson(MANIFEST_PATH);
  } catch {
    throw new GovernanceError("RUNNER_MANIFEST_HEADER");
  }
  if (
    manifest.manifest_version !== 1 ||
    manifest.repository_baseline !==
      "01a5c779f3f47f9619a2cd4a913622e010145afc" ||
    !Array.isArray(manifest.entries)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_HEADER");
  }

  const inventory = listRegularFiles("testing");
  const paths = manifest.entries.map((entry) => entry.path);
  if (
    paths.length !== new Set(paths).size ||
    !paths.every(
      (entry, index) => entry === stableSortedPaths(paths)[index],
    ) ||
    !compareExactPathSets(paths, inventory).equal ||
    manifest.testing_tree_digest_state !==
      "CURRENT_TESTING_TREE_DIGEST_RECOMPUTED_PHASE_33HA_C2_1" ||
    manifest.testing_tree_digest !== testingTreeDigest(MANIFEST_PATH)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_INVENTORY");
  }

  const executionSurfacePaths = AUTHORIZED_C1_PATHS.filter(
    (repositoryPath) => repositoryPath !== MANIFEST_PATH,
  );
  if (
    manifest.phase_33fa_c1_execution_surface_digest?.algorithm !==
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" ||
    manifest.phase_33fa_c1_execution_surface_digest?.path_count !== 9 ||
    manifest.phase_33fa_c1_execution_surface_digest?.excluded_self_path !==
      MANIFEST_PATH ||
    manifest.phase_33fa_c1_execution_surface_digest?.sha256 !==
      pathSetDigest(executionSurfacePaths)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_C1_DIGEST");
  }

  const c2ExecutionSurfacePaths = AUTHORIZED_C2_1_PATHS.filter(
    (repositoryPath) => repositoryPath !== MANIFEST_PATH,
  );
  if (
    manifest.phase_c2_1_execution_surface_digest?.algorithm !==
      "SHA256_PATH_NUL_SHA256_NUL_BYTES_ROWS_LF" ||
    manifest.phase_c2_1_execution_surface_digest?.path_count !== 7 ||
    manifest.phase_c2_1_execution_surface_digest?.excluded_self_path !==
      MANIFEST_PATH ||
    manifest.phase_c2_1_execution_surface_digest?.sha256 !==
      pathSetDigest(c2ExecutionSurfacePaths)
  ) {
    throw new GovernanceError("RUNNER_MANIFEST_C2_1_DIGEST");
  }

  const manifestCorePaths = manifest.entries
    .filter((entry) => entry.ci_disposition === "RUN_CORE")
    .map((entry) => entry.path);
  if (!exactSet(manifestCorePaths, CORE_CHILD_PATHS)) {
    throw new GovernanceError("RUNNER_CORE_SET");
  }
  const core = [];
  for (const repositoryPath of CORE_CHILD_PATHS) {
    const entry = manifest.entries.find(
      (candidate) => candidate.path === repositoryPath,
    );
    if (
      entry?.safety_class !== "SAFE_STATIC_CORE" ||
      entry.role !== "EXECUTABLE" ||
      !Array.isArray(entry.command_argv) ||
      entry.command_argv.length !== 2 ||
      entry.command_argv[0] !== "node" ||
      entry.command_argv[1] !== entry.path
    ) {
      throw new GovernanceError("RUNNER_CORE_ENTRY");
    }
    let violations;
    try {
      violations = executableSafetyViolations(entry.path);
    } catch {
      throw new GovernanceError("RUNNER_CORE_SOURCE_SAFETY");
    }
    if (violations.length > 0) {
      throw new GovernanceError("RUNNER_CORE_SOURCE_SAFETY");
    }
    core.push(entry);
  }

  for (const entry of manifest.entries) {
    if (
      entry.ci_disposition === "DENY" &&
      entry.command_argv !== null
    ) {
      throw new GovernanceError("RUNNER_DENIED_COMMAND");
    }
  }

  const c1Policy = [];
  for (const child of C1_CHILDREN) {
    const entry = manifest.entries.find(
      (candidate) => candidate.path === child.path,
    );
    if (
      entry?.role !== "EXECUTABLE" ||
      entry.safety_class !== "SAFE_STATIC_POLICY" ||
      entry.ci_disposition !== "RUN_POLICY" ||
      JSON.stringify(entry.command_argv) !==
        JSON.stringify(["node", child.path])
    ) {
      throw new GovernanceError("RUNNER_C1_MANIFEST_ENTRY");
    }
    validateC1ChildSource(child);
    c1Policy.push(child);
  }
  if (
    c1Policy.length !== 4 ||
    !exactSet(
      c1Policy.map((entry) => entry.path),
      C1_CHILDREN.map((entry) => entry.path),
    )
  ) {
    throw new GovernanceError("RUNNER_C1_POLICY_SET");
  }
  const c2Policy = [];
  for (const child of C2_1_CHILDREN) {
    const entry = manifest.entries.find(
      (candidate) => candidate.path === child.path,
    );
    if (
      entry?.role !== "EXECUTABLE" ||
      entry.safety_class !== "SAFE_STATIC_POLICY" ||
      entry.ci_disposition !== "RUN_POLICY" ||
      JSON.stringify(entry.command_argv) !==
        JSON.stringify(["node", child.path])
    ) {
      throw new GovernanceError("RUNNER_C2_1_MANIFEST_ENTRY");
    }
    validateC2ChildSource(child);
    c2Policy.push(child);
  }
  if (
    c2Policy.length !== 2 ||
    !exactSet(
      c2Policy.map((entry) => entry.path),
      EXPECTED_C2_1_CHILD_PATHS,
    )
  ) {
    throw new GovernanceError("RUNNER_C2_1_POLICY_SET");
  }
  return { core, c1Policy, c2Policy };
}

function installLegacyCoreManifestProjection(
  fs,
  syncBuiltinESMExports,
) {
  const manifestSuffix = "/testing/static-test-safety-manifest.json";
  const additiveContracts = new Map([
    [
      "testing/authenticated-live-route-partial-evidence.schema.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_SCHEMA",
      },
    ],
    [
      "testing/authenticated-live-route-partial-evidence.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code: "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE",
      },
    ],
    [
      "testing/authenticated-live-route-partial-evidence.test.mjs",
      {
        role: "EXECUTABLE",
        safety_class: "SAFE_STATIC_POLICY",
        ci_disposition: "RUN_POLICY",
        command_argv: [
          "node",
          "testing/authenticated-live-route-partial-evidence.test.mjs",
        ],
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_PARTIAL_EVIDENCE_POLICY",
      },
    ],
    [
      "testing/authenticated-live-route-semantic-analyzer.mjs",
      {
        role: "SUPPORT",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code: "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_ANALYZER",
      },
    ],
    [
      "testing/authenticated-live-route-semantic-analyzer.test.mjs",
      {
        role: "EXECUTABLE",
        safety_class: "SAFE_STATIC_POLICY",
        ci_disposition: "RUN_POLICY",
        command_argv: [
          "node",
          "testing/authenticated-live-route-semantic-analyzer.test.mjs",
        ],
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_ANALYZER_POLICY",
      },
    ],
    [
      "testing/authenticated-live-route-semantic-branch-ledger.schema.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER_SCHEMA",
      },
    ],
    [
      "testing/authenticated-live-route-semantic-branch-ledger.json",
      {
        role: "CONFIG",
        safety_class: "SAFE_STATIC_SUPPORT",
        ci_disposition: "VALIDATE_ONLY",
        command_argv: null,
        reason_code: "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER",
      },
    ],
    [
      "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
      {
        role: "EXECUTABLE",
        safety_class: "SAFE_STATIC_POLICY",
        ci_disposition: "RUN_POLICY",
        command_argv: [
          "node",
          "testing/authenticated-live-route-semantic-branch-ledger.test.mjs",
        ],
        reason_code:
          "AUTHENTICATED_LIVE_ROUTE_SEMANTIC_BRANCH_LEDGER_POLICY",
      },
    ],
  ]);
  const originalReadFileSync = fs.readFileSync.bind(fs);
  const classificationCounts = (entries) => ({
    core: entries.filter((entry) => entry.ci_disposition === "RUN_CORE")
      .length,
    policy: entries.filter((entry) => entry.ci_disposition === "RUN_POLICY")
      .length,
    validateOnly: entries.filter(
      (entry) => entry.ci_disposition === "VALIDATE_ONLY",
    ).length,
    denied: entries.filter((entry) => entry.ci_disposition === "DENY")
      .length,
  });
  const exactValue = (actual, expected) =>
    JSON.stringify(actual) === JSON.stringify(expected);

  fs.readFileSync = function projectedReadFileSync(target, options) {
    const value = originalReadFileSync(target, options);
    if (!String(target).endsWith(manifestSuffix)) return value;
    const source = Buffer.isBuffer(value) ? value.toString("utf8") : value;
    const manifest = JSON.parse(source);
    const currentCounts = classificationCounts(manifest.entries ?? []);
    if (
      manifest.entries?.length !== 123 ||
      !exactValue(currentCounts, {
        core: 5,
        policy: 9,
        validateOnly: 23,
        denied: 86,
      })
    ) {
      throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
    }
    for (const [repositoryPath, contract] of additiveContracts) {
      const entry = manifest.entries.find(
        (candidate) => candidate.path === repositoryPath,
      );
      if (
        !entry ||
        !Object.entries(contract).every(([key, expected]) =>
          exactValue(entry[key], expected),
        )
      ) {
        throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
      }
    }
    manifest.entries = manifest.entries.filter(
      (entry) => !additiveContracts.has(entry.path),
    );
    const legacyCounts = classificationCounts(manifest.entries);
    if (
      manifest.entries.length !== 115 ||
      !exactValue(legacyCounts, {
        core: 5,
        policy: 6,
        validateOnly: 18,
        denied: 86,
      })
    ) {
      throw new Error("LEGACY_CORE_MANIFEST_PROJECTION_PRECONDITION");
    }
    const projected = Buffer.from(
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8",
    );
    if (typeof options === "string") {
      return projected.toString(options);
    }
    if (options?.encoding) {
      return projected.toString(options.encoding);
    }
    return projected;
  };
  syncBuiltinESMExports();
}

function legacyCorePreloadUrl() {
  const source = [
    "import " + JSON.stringify(pathToFileURL(SANDBOX_PATH).href) + ";",
    'import fs from "node:fs";',
    'import { syncBuiltinESMExports } from "node:module";',
    "(" +
      installLegacyCoreManifestProjection.toString() +
      ")(fs, syncBuiltinESMExports);",
    "",
  ].join("\n");
  return (
    "data:text/javascript;base64," +
    Buffer.from(source, "utf8").toString("base64")
  );
}

const LEGACY_CORE_PRELOAD_URL = legacyCorePreloadUrl();

function runScript(
  scriptPath,
  timeoutMs,
  { preloads = [], environment, cwd = repositoryRoot },
) {
  return new Promise((resolve) => {
    const started = performance.now();
    const absoluteScript = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.resolve(repositoryRoot, scriptPath);
    const argv = [
      ...preloads.flatMap((preload) => ["--import", preload]),
      absoluteScript,
    ];
    const child = spawn(process.execPath, argv, {
      cwd,
      env: environment,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let overflow = false;
    let timedOut = false;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({
        ...result,
        durationMs: Math.round(performance.now() - started),
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
        overflow,
        timedOut,
      });
    };
    const append = (current, chunk) => {
      const next = Buffer.concat([current, chunk]);
      if (next.length > MAX_OUTPUT_BYTES) {
        overflow = true;
        child.kill("SIGKILL");
      }
      return next.subarray(0, MAX_OUTPUT_BYTES);
    };
    child.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.on("error", () => {
      clearTimeout(timer);
      finish({
        exitCode: null,
        signal: null,
        spawnError: true,
      });
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      finish({
        exitCode,
        signal,
        spawnError: false,
      });
    });
  });
}

async function runCore(core) {
  const totalStarted = performance.now();
  const results = [];
  for (const entry of core) {
    const remaining =
      CORE_TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const before = repositoryStateDigest();
    const result = await runScript(
      entry.path,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
      {
        preloads: [LEGACY_CORE_PRELOAD_URL],
        environment: CORE_SAFE_ENVIRONMENT,
      },
    );
    const after = repositoryStateDigest();
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const unchanged = before === after;
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      unchanged;
    results.push({ path: entry.path, passed });
    console.log(
      "STATIC_CORE path=" +
        entry.path +
        " exit=" +
        (result.exitCode ?? "null") +
        " duration_ms=" +
        result.durationMs +
        " stdout_sha256=" +
        stdout.sha256 +
        " stdout_bytes=" +
        stdout.bytes +
        " stdout_lines=" +
        stdout.lines +
        " stderr_sha256=" +
        stderr.sha256 +
        " stderr_bytes=" +
        stderr.bytes +
        " stderr_lines=" +
        stderr.lines +
        " repository_state_unchanged=" +
        unchanged +
        " result=" +
        (passed ? "PASS" : "FAIL"),
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_CORE_COMMAND_FAILED");
    }
  }
  console.log(
    "PASS_STATIC_READINESS_CORE commands=" +
      results.length +
      " pass=" +
      results.length +
      " fail=0 repository_mutations=0 total_duration_ms=" +
      Math.round(performance.now() - totalStarted),
  );
}

async function runC1Policy(c1Policy) {
  const totalStarted = performance.now();
  const results = [];
  for (const child of c1Policy) {
    const remaining =
      C1_TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const authorizedBefore = authorizedSnapshot();
    const repositoryBefore = repositoryStateDigest();
    const result = await runScript(
      child.path,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
      {
        preloads: [],
        environment: C1_SAFE_ENVIRONMENT,
      },
    );
    const repositoryAfter = repositoryStateDigest();
    const authorizedAfter = authorizedSnapshot();
    const authorizedUnchanged = authorizedBefore === authorizedAfter;
    const repositoryUnchanged = repositoryBefore === repositoryAfter;
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      authorizedUnchanged &&
      repositoryUnchanged;
    results.push({ path: child.path, passed });
    console.log(
      "STATIC_C1_POLICY path=" +
        child.path +
        " exit=" +
        (result.exitCode ?? "null") +
        " duration_ms=" +
        result.durationMs +
        " stdout_sha256=" +
        stdout.sha256 +
        " stdout_bytes=" +
        stdout.bytes +
        " stdout_lines=" +
        stdout.lines +
        " stderr_sha256=" +
        stderr.sha256 +
        " stderr_bytes=" +
        stderr.bytes +
        " stderr_lines=" +
        stderr.lines +
        " authorized_scope_unchanged=" +
        authorizedUnchanged +
        " repository_state_unchanged=" +
        repositoryUnchanged +
        " source_identity_verified=true source_policy_verified=true result=" +
        (passed ? "PASS" : "FAIL"),
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_C1_POLICY_COMMAND_FAILED");
    }
  }
  console.log(
    "PASS_STATIC_READINESS_C1_POLICY children=" +
      results.length +
      " pass=" +
      results.length +
      " fail=0 authorized_scope_mutations=0 repository_mutations=0 source_identities=4 source_policy_gates=4 total_duration_ms=" +
      Math.round(performance.now() - totalStarted),
  );
}

async function runC2Policy(c2Policy) {
  const totalStarted = performance.now();
  const results = [];
  for (const child of c2Policy) {
    const remaining =
      C2_1_TOTAL_TIMEOUT_MS - (performance.now() - totalStarted);
    if (remaining <= 0) {
      throw new GovernanceError("RUNNER_TOTAL_TIMEOUT");
    }
    const authorizedBefore = authorizedC2Snapshot();
    const repositoryBefore = repositoryStateDigest();
    const result = await runScript(
      child.path,
      Math.min(PER_CHILD_TIMEOUT_MS, remaining),
      {
        preloads: [SANDBOX_PATH],
        environment: C2_1_SAFE_ENVIRONMENT,
      },
    );
    const repositoryAfter = repositoryStateDigest();
    const authorizedAfter = authorizedC2Snapshot();
    const authorizedUnchanged = authorizedBefore === authorizedAfter;
    const repositoryUnchanged = repositoryBefore === repositoryAfter;
    const stdout = outputIdentity(result.stdout);
    const stderr = outputIdentity(result.stderr);
    const passed =
      result.exitCode === 0 &&
      result.signal === null &&
      result.stderr === "" &&
      !result.overflow &&
      !result.timedOut &&
      !result.spawnError &&
      authorizedUnchanged &&
      repositoryUnchanged;
    results.push({ path: child.path, passed });
    console.log(
      "STATIC_C2_1_POLICY path=" +
        child.path +
        " exit=" +
        (result.exitCode ?? "null") +
        " duration_ms=" +
        result.durationMs +
        " stdout_sha256=" +
        stdout.sha256 +
        " stdout_bytes=" +
        stdout.bytes +
        " stdout_lines=" +
        stdout.lines +
        " stderr_sha256=" +
        stderr.sha256 +
        " stderr_bytes=" +
        stderr.bytes +
        " stderr_lines=" +
        stderr.lines +
        " authorized_scope_unchanged=" +
        authorizedUnchanged +
        " repository_state_unchanged=" +
        repositoryUnchanged +
        " source_identity_verified=true source_policy_verified=true result=" +
        (passed ? "PASS" : "FAIL"),
    );
    if (!passed) {
      throw new GovernanceError("RUNNER_C2_1_POLICY_COMMAND_FAILED");
    }
  }
  console.log(
    "PASS_STATIC_READINESS_C2_1_POLICY children=2 pass=2 fail=0 authorized_scope_mutations=0 repository_mutations=0 source_identities=2 source_policy_gates=2",
  );
}

function selfTestSnippet(category, body) {
  return [
    "try {",
    "  " + body,
    "  console.log(\"BYPASS_" + category + "\");",
    "  process.exitCode = 2;",
    "} catch (caught) {",
    "  if (caught && caught.code === \"STATIC_READINESS_SANDBOX_DENIED_" +
      category +
      "\") {",
    "    console.log(\"DENIED_" + category + "\");",
    "  } else {",
    "    console.log(\"WRONG_DENIAL_" + category + "\");",
    "    process.exitCode = 3;",
    "  }",
    "}",
    "",
  ].join("\n");
}

function replaceUniqueSourceFragment(source, fragment, replacement) {
  const first = source.indexOf(fragment);
  if (first < 0 || first !== source.lastIndexOf(fragment)) {
    throw new GovernanceError("RUNNER_C2_1_MUTATION_FIXTURE_IDENTITY");
  }
  return source.slice(0, first) + replacement + source.slice(first + fragment.length);
}

function expectC2SourcePolicyMutation(source, fragment, expectedStage) {
  const mutated = replaceUniqueSourceFragment(source, fragment, "false");
  const sourceFile = ts.createSourceFile(
    "c2-1-source-policy-mutation.mjs",
    mutated,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  try {
    validateReadExactC2Source(
      sourceFile,
      mutated,
      C2_1_ANALYZER_READ_PATHS,
    );
  } catch (caught) {
    if (caught instanceof GovernanceError && caught.stage === expectedStage) {
      return;
    }
    throw caught;
  }
  throw new GovernanceError("RUNNER_C2_1_MUTATION_NOT_REJECTED");
}

function validateC2SourcePolicyMutations() {
  const child = C2_1_CHILDREN[0];
  const source = readFileSync(child.path, "utf8");
  if (digest(Buffer.from(source, "utf8")) !== child.sha256) {
    throw new GovernanceError("RUNNER_C2_1_MUTATION_SOURCE_IDENTITY");
  }
  expectC2SourcePolicyMutation(
    source,
    "absolutePath === REPOSITORY_ROOT ||\n" +
      "    !absolutePath.startsWith(REPOSITORY_ROOT + path.sep)",
    "RUNNER_C2_1_READ_WRAPPER_ROOT_GUARD",
  );
  expectC2SourcePolicyMutation(
    source,
    "!metadata.isFile() || metadata.isSymbolicLink()",
    "RUNNER_C2_1_READ_WRAPPER_REGULAR_FILE_GUARD",
  );
}

async function runSelfTest() {
  if (
    !exactSet(
      C2_1_CHILDREN.map((child) => child.path),
      EXPECTED_C2_1_CHILD_PATHS,
    )
  ) {
    console.log(
      "EXPECTED_FAIL_STATIC_READINESS_RUNNER_SELF_TEST stage=RUNNER_C2_1_POLICY_SET failures=1 internal_failures=0",
    );
    process.exitCode = 1;
    return;
  }
  validateC2SourcePolicyMutations();
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "aifinder-static-readiness-"),
  );
  const fixtures = [
    ["GLOBAL_NETWORK", "await fetch('http://127.0.0.1/');"],
    [
      "MODULE_NETWORK",
      "const http = await import('node:http'); http.get('http://127.0.0.1/');",
    ],
    [
      "CHILD_PROCESS",
      "const cp = await import('node:child_process'); cp.execFileSync('true');",
    ],
    [
      "FILESYSTEM_MUTATION",
      "const fs = await import('node:fs'); fs.writeFileSync(new URL('./blocked.txt', import.meta.url), 'blocked');",
    ],
  ];
  try {
    const results = [];
    for (const [category, body] of fixtures) {
      const fixture = path.join(
        temporaryDirectory,
        category.toLowerCase() + ".mjs",
      );
      writeFileSync(fixture, selfTestSnippet(category, body), { mode: 0o600 });
      const result = await runScript(fixture, 5_000, {
        preloads: [SANDBOX_PATH],
        environment: CORE_SAFE_ENVIRONMENT,
        cwd: temporaryDirectory,
      });
      const passed =
        result.exitCode === 0 &&
        result.signal === null &&
        result.stdout === "DENIED_" + category + "\n" &&
        result.stderr === "" &&
        !result.overflow &&
        !result.timedOut &&
        !result.spawnError;
      results.push({ category, passed });
      console.log(
        "SANDBOX_SELF_TEST family=" +
          category +
          " duration_ms=" +
          result.durationMs +
          " result=" +
          (passed ? "PASS" : "FAIL"),
      );
    }
    if (!results.every((result) => result.passed)) {
      throw new GovernanceError("SANDBOX_SELF_TEST_FAILED");
    }
    console.log(
      "PASS_STATIC_READINESS_SANDBOX_SELF_TEST families=" +
        results.length +
        " pass=" +
        results.length +
        " fail=0",
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function listChildren(core, c1Policy, c2Policy) {
  for (const entry of core) {
    console.log(
      "STATIC_CORE_LIST path=" +
        entry.path +
        " argv=node," +
        entry.path,
    );
  }
  console.log("PASS_STATIC_READINESS_LIST commands=" + core.length);
  for (const child of c1Policy) {
    console.log(
      "STATIC_C1_POLICY_LIST path=" +
        child.path +
        " argv=node," +
        child.path,
    );
  }
  console.log(
    "PASS_STATIC_READINESS_LIST_COMPLETE core=" +
      core.length +
      " c1=" +
      c1Policy.length +
      " total=" +
      (core.length + c1Policy.length),
  );
  for (const child of c2Policy) {
    console.log(
      "STATIC_C2_1_POLICY_LIST path=" +
        child.path +
        " argv=node," +
        child.path,
    );
  }
  console.log(
    "PASS_STATIC_READINESS_LIST_COMPLETE_C2_1 core=5 c1=4 c2_1=2 total=11",
  );
}

try {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length > 1) {
    throw new GovernanceError("RUNNER_ARGUMENT");
  }
  const option = argumentsList[0] ?? "";
  if (option === "--self-test") {
    await runSelfTest();
  } else if (option === "--list") {
    const { core, c1Policy, c2Policy } = validateManifestForExecution();
    listChildren(core, c1Policy, c2Policy);
  } else if (option === "--c1-policy") {
    const { c1Policy } = validateManifestForExecution();
    await runC1Policy(c1Policy);
  } else if (option === "--c2-1-policy") {
    const { c2Policy } = validateManifestForExecution();
    await runC2Policy(c2Policy);
  } else if (option === "") {
    const { core, c1Policy, c2Policy } = validateManifestForExecution();
    await runCore(core);
    await runC1Policy(c1Policy);
    await runC2Policy(c2Policy);
    console.log(
      "PASS_STATIC_READINESS_C2_1_COMPLETE core=5 c1=4 c2_1=2 fail=0 repository_mutations=0",
    );
    console.log(
      "PASS_STATIC_READINESS_COMPLETE core=5 c1=4 fail=0 repository_mutations=0",
    );
  } else {
    throw new GovernanceError("RUNNER_ARGUMENT");
  }
} catch (caught) {
  const stage =
    caught instanceof GovernanceError
      ? caught.stage
      : "INTERNAL_RUNNER_FAILURE";
  console.log("FAIL_STATIC_READINESS_RUNNER stage=" + stage);
  process.exitCode = 1;
}
