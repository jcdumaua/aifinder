import { createHash } from "node:crypto";
import {
  lstatSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export class GovernanceError extends Error {
  constructor(stage, message = stage) {
    super(message);
    this.name = "GovernanceError";
    this.stage = stage;
  }
}

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function toRepositoryPath(absolutePath) {
  const relative = path.relative(repositoryRoot, absolutePath);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new GovernanceError("PATH_OUTSIDE_REPOSITORY");
  }
  return relative.split(path.sep).join("/");
}

export function resolveRepositoryPath(repositoryPath) {
  if (
    typeof repositoryPath !== "string" ||
    repositoryPath.length === 0 ||
    path.isAbsolute(repositoryPath)
  ) {
    throw new GovernanceError("INVALID_REPOSITORY_PATH");
  }
  const absolute = path.resolve(repositoryRoot, repositoryPath);
  toRepositoryPath(absolute);
  return absolute;
}

export function assertRegularFile(repositoryPath, expectedMode = 0o644) {
  const absolute = resolveRepositoryPath(repositoryPath);
  let info;
  try {
    info = lstatSync(absolute);
  } catch {
    throw new GovernanceError("REGULAR_FILE_ABSENT");
  }
  if (info.isSymbolicLink()) {
    throw new GovernanceError("SYMLINK_REJECTED");
  }
  if (!info.isFile()) {
    throw new GovernanceError("NOT_REGULAR_FILE");
  }
  if (
    expectedMode !== null &&
    (info.mode & 0o777) !== expectedMode
  ) {
    throw new GovernanceError("FILE_MODE_MISMATCH");
  }
  return absolute;
}

export function fileIdentity(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath, null);
  const bytes = readFileSync(absolute);
  return {
    path: repositoryPath,
    sha256: sha256(bytes),
    bytes: bytes.byteLength,
    mode: (statSync(absolute).mode & 0o777)
      .toString(8)
      .padStart(4, "0"),
  };
}

class StrictJsonParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }

  fail(stage = "STRICT_JSON_SYNTAX") {
    throw new GovernanceError(stage);
  }

  skipWhitespace() {
    while (
      this.index < this.source.length &&
      /[\u0009\u000a\u000d\u0020]/.test(this.source[this.index])
    ) {
      this.index += 1;
    }
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.source.length) this.fail();
    return value;
  }

  parseValue() {
    this.skipWhitespace();
    const character = this.source[this.index];
    if (character === "{") return this.parseObject();
    if (character === "[") return this.parseArray();
    if (character === '"') return this.parseString();
    if (character === "t") return this.parseLiteral("true", true);
    if (character === "f") return this.parseLiteral("false", false);
    if (character === "n") return this.parseLiteral("null", null);
    return this.parseNumber();
  }

  parseString() {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.source.length) {
      const code = this.source.charCodeAt(this.index);
      const character = this.source[this.index];
      if (!escaped && character === '"') {
        this.index += 1;
        try {
          return JSON.parse(this.source.slice(start, this.index));
        } catch {
          this.fail();
        }
      }
      if (!escaped && code < 0x20) this.fail();
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.index += 1;
    }
    this.fail();
  }

  parseNumber() {
    const match = this.source
      .slice(this.index)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) this.fail();
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.fail();
    return value;
  }

  parseLiteral(literal, value) {
    if (this.source.slice(this.index, this.index + literal.length) !== literal) {
      this.fail();
    }
    this.index += literal.length;
    return value;
  }

  parseArray() {
    const result = [];
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      const character = this.source[this.index];
      if (character === "]") {
        this.index += 1;
        return result;
      }
      if (character !== ",") this.fail();
      this.index += 1;
    }
  }

  parseObject() {
    const result = Object.create(null);
    const keys = new Set();
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (true) {
      this.skipWhitespace();
      if (this.source[this.index] !== '"') this.fail();
      const key = this.parseString();
      if (keys.has(key)) this.fail("STRICT_JSON_DUPLICATE_KEY");
      keys.add(key);
      this.skipWhitespace();
      if (this.source[this.index] !== ":") this.fail();
      this.index += 1;
      result[key] = this.parseValue();
      this.skipWhitespace();
      const character = this.source[this.index];
      if (character === "}") {
        this.index += 1;
        return result;
      }
      if (character !== ",") this.fail();
      this.index += 1;
    }
  }
}

export function strictJsonParse(source) {
  if (typeof source !== "string") {
    throw new GovernanceError("STRICT_JSON_INPUT_TYPE");
  }
  return new StrictJsonParser(source).parse();
}

export function readStrictJson(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath);
  return strictJsonParse(readFileSync(absolute, "utf8"));
}

export function stableSortedPaths(paths) {
  if (!Array.isArray(paths) || paths.some((item) => typeof item !== "string")) {
    throw new GovernanceError("PATH_SET_INPUT");
  }
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

export function compareExactPathSets(actual, expected) {
  const sortedActual = stableSortedPaths(actual);
  const sortedExpected = stableSortedPaths(expected);
  return {
    equal:
      sortedActual.length === sortedExpected.length &&
      sortedActual.every((value, index) => value === sortedExpected[index]),
    missing: sortedExpected.filter((value) => !sortedActual.includes(value)),
    unexpected: sortedActual.filter((value) => !sortedExpected.includes(value)),
  };
}

function walkDirectory(absoluteDirectory, output) {
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, "en"),
  );
  for (const entry of entries) {
    const absolute = path.join(absoluteDirectory, entry.name);
    const info = lstatSync(absolute);
    if (info.isSymbolicLink()) {
      throw new GovernanceError("SYMLINK_REJECTED");
    }
    if (info.isDirectory()) {
      walkDirectory(absolute, output);
    } else if (info.isFile()) {
      output.push(toRepositoryPath(absolute));
    }
  }
}

export function listRegularFiles(repositoryDirectory) {
  const absolute = resolveRepositoryPath(repositoryDirectory);
  if (!lstatSync(absolute).isDirectory()) {
    throw new GovernanceError("INVENTORY_ROOT_NOT_DIRECTORY");
  }
  const output = [];
  walkDirectory(absolute, output);
  return stableSortedPaths(output);
}

export function gitOutput(args) {
  if (!Array.isArray(args) || args.some((item) => typeof item !== "string")) {
    throw new GovernanceError("GIT_ARGV_INVALID");
  }
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    throw new GovernanceError("READ_ONLY_GIT_FAILED");
  }
}

export function repositoryPathUnion(authorizedUntracked = []) {
  const tracked = gitOutput(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
  const status = gitOutput([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  const untracked = status
    .split("\0")
    .filter(Boolean)
    .filter((entry) => entry.startsWith("?? "))
    .map((entry) => entry.slice(3));
  const comparison = compareExactPathSets(untracked, authorizedUntracked);
  if (!comparison.equal) {
    throw new GovernanceError("UNTRACKED_SCOPE_MISMATCH");
  }
  return stableSortedPaths([...new Set([...tracked, ...untracked])]);
}

export function repositoryStateDigest() {
  const trackedDiff = gitOutput(["diff", "--binary", "--no-ext-diff", "HEAD", "--"]);
  const status = gitOutput([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  const untracked = status
    .split("\0")
    .filter(Boolean)
    .filter((entry) => entry.startsWith("?? "))
    .map((entry) => entry.slice(3))
    .sort((left, right) => left.localeCompare(right, "en"));
  const untrackedRows = untracked.map((repositoryPath) => {
    const identity = fileIdentity(repositoryPath);
    return [
      identity.path,
      identity.sha256,
      identity.bytes,
      identity.mode,
    ].join("\0");
  });
  return sha256(
    ["TRACKED_DIFF", trackedDiff, "UNTRACKED", ...untrackedRows].join("\0"),
  );
}

export function parseTypeScriptFile(repositoryPath) {
  const absolute = assertRegularFile(repositoryPath);
  const source = readFileSync(absolute, "utf8");
  const kind =
    repositoryPath.endsWith(".tsx") || repositoryPath.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : repositoryPath.endsWith(".mjs") || repositoryPath.endsWith(".js")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    repositoryPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new GovernanceError("TYPESCRIPT_PARSE_DIAGNOSTIC");
  }
  return { source, sourceFile };
}

export function walkExecutableNodes(sourceFile, visitor) {
  function visit(node) {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      return;
    }
    visitor(node);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function localSpecifiers(sourceFile) {
  const specifiers = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === "require") ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers.filter(
    (specifier) => specifier.startsWith("./") || specifier.startsWith("../"),
  );
}

export function resolveLocalImport(fromRepositoryPath, specifier) {
  const fromAbsolute = resolveRepositoryPath(fromRepositoryPath);
  const base = path.resolve(path.dirname(fromAbsolute), specifier);
  toRepositoryPath(base);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map(
      (extension) => `${base}${extension}`,
    ),
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map(
      (extension) => path.join(base, `index${extension}`),
    ),
  ];
  for (const candidate of candidates) {
    try {
      const info = lstatSync(candidate);
      if (info.isSymbolicLink()) {
        throw new GovernanceError("SYMLINK_REJECTED");
      }
      if (info.isFile()) return toRepositoryPath(candidate);
    } catch (caught) {
      if (caught instanceof GovernanceError) throw caught;
    }
  }
  throw new GovernanceError("LOCAL_IMPORT_UNRESOLVED");
}

export function collectLocalImportGraph(entryRepositoryPath) {
  const visited = new Set();
  const pending = [entryRepositoryPath];
  while (pending.length > 0) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const { sourceFile } = parseTypeScriptFile(current);
    for (const specifier of localSpecifiers(sourceFile)) {
      const resolved = resolveLocalImport(current, specifier);
      if (!visited.has(resolved)) pending.push(resolved);
    }
  }
  return stableSortedPaths([...visited]);
}

const FORBIDDEN_IMPORTS = new Set([
  "node:http",
  "http",
  "node:http2",
  "http2",
  "node:https",
  "https",
  "node:net",
  "net",
  "node:tls",
  "tls",
  "node:dns",
  "dns",
  "node:dns/promises",
  "dns/promises",
  "node:dgram",
  "dgram",
  "node:child_process",
  "child_process",
  "next",
  "next/server",
  "@supabase/supabase-js",
  "@playwright/test",
  "playwright",
  "undici",
]);
const FORBIDDEN_CALLS = new Set([
  "fetch",
  "WebSocket",
  "EventSource",
  "spawn",
  "spawnSync",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "fork",
  "eval",
  "Function",
  "createRequire",
  "getBuiltinModule",
]);
const FORBIDDEN_FS_METHODS = new Set([
  "writeFile",
  "writeFileSync",
  "write",
  "writeSync",
  "writev",
  "writevSync",
  "appendFile",
  "appendFileSync",
  "copyFile",
  "copyFileSync",
  "cp",
  "cpSync",
  "rename",
  "renameSync",
  "rm",
  "rmSync",
  "rmdir",
  "rmdirSync",
  "unlink",
  "unlinkSync",
  "chmod",
  "chmodSync",
  "chown",
  "chownSync",
  "truncate",
  "truncateSync",
  "symlink",
  "symlinkSync",
  "link",
  "linkSync",
  "mkdir",
  "mkdirSync",
  "mkdtemp",
  "mkdtempSync",
  "createWriteStream",
]);
const APPROVED_ADDITIONAL_SOURCE_ROOTS = new Map([
  [
    "testing/public-persistence.test.mjs",
    ["lib/public-persistence.ts"],
  ],
]);

function hasApprovedDataModuleUrl(sourceFile) {
  let approved = false;
  function visit(node) {
    if (ts.isVariableDeclarationList(node)) {
      for (const declaration of node.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "moduleUrl" &&
          declaration.initializer &&
          ((ts.isTemplateExpression(declaration.initializer) &&
            declaration.initializer.head.text ===
              "data:text/javascript;base64,") ||
            (ts.isNoSubstitutionTemplateLiteral(declaration.initializer) &&
              declaration.initializer.text.startsWith(
                "data:text/javascript;base64,",
              )))
        ) {
          approved = true;
        }
      }
    }
    if (!approved) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return approved;
}

export function executableSafetyViolations(entryRepositoryPath) {
  const violations = [];
  const sourcePaths = new Set(collectLocalImportGraph(entryRepositoryPath));
  for (const additionalRoot of
    APPROVED_ADDITIONAL_SOURCE_ROOTS.get(entryRepositoryPath) ?? []) {
    for (const repositoryPath of collectLocalImportGraph(additionalRoot)) {
      sourcePaths.add(repositoryPath);
    }
  }
  for (const repositoryPath of stableSortedPaths([...sourcePaths])) {
    const { sourceFile } = parseTypeScriptFile(repositoryPath);
    const filesystemNamespaces = new Set();
    const filesystemMutationBindings = new Set();
    for (const statement of sourceFile.statements) {
      if (
        (ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        FORBIDDEN_IMPORTS.has(statement.moduleSpecifier.text)
      ) {
        violations.push("FORBIDDEN_IMPORT");
      }
      if (
        ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        ["node:fs", "fs"].includes(statement.moduleSpecifier.text) &&
        statement.importClause
      ) {
        if (statement.importClause.name) {
          filesystemNamespaces.add(statement.importClause.name.text);
        }
        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
          filesystemNamespaces.add(bindings.name.text);
        } else if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            const imported = element.propertyName?.text ?? element.name.text;
            if (FORBIDDEN_FS_METHODS.has(imported)) {
              filesystemMutationBindings.add(element.name.text);
            }
          }
        }
      }
    }
    walkExecutableNodes(sourceFile, (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "process" &&
        node.name.text === "env"
      ) {
        violations.push("ENVIRONMENT_ACCESS");
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression;
        const name = ts.isIdentifier(expression)
          ? expression.text
          : ts.isPropertyAccessExpression(expression)
            ? expression.name.text
            : ts.isElementAccessExpression(expression) &&
                expression.argumentExpression &&
                ts.isStringLiteralLike(expression.argumentExpression)
              ? expression.argumentExpression.text
            : "";
        if (FORBIDDEN_CALLS.has(name)) {
          violations.push(`FORBIDDEN_CALL_${name}`);
        }
        if (
          (ts.isIdentifier(expression) &&
            filesystemMutationBindings.has(expression.text)) ||
          (ts.isPropertyAccessExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            filesystemNamespaces.has(expression.expression.text) &&
            FORBIDDEN_FS_METHODS.has(expression.name.text)) ||
          (ts.isElementAccessExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            filesystemNamespaces.has(expression.expression.text) &&
            expression.argumentExpression &&
            ts.isStringLiteralLike(expression.argumentExpression) &&
            FORBIDDEN_FS_METHODS.has(expression.argumentExpression.text))
        ) {
          violations.push("FILESYSTEM_MUTATION_CALL");
        }
        if (
          ts.isCallExpression(node) &&
          (expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(expression) && expression.text === "require"))
        ) {
          const specifier = node.arguments[0];
          const approvedDataImport =
            repositoryPath === "testing/public-persistence.test.mjs" &&
            specifier &&
            ts.isIdentifier(specifier) &&
            specifier.text === "moduleUrl" &&
            hasApprovedDataModuleUrl(sourceFile);
          if (
            (!specifier || !ts.isStringLiteralLike(specifier)) &&
            !approvedDataImport
          ) {
            violations.push("DYNAMIC_MODULE_SPECIFIER");
          } else if (FORBIDDEN_IMPORTS.has(specifier.text)) {
            violations.push("FORBIDDEN_DYNAMIC_IMPORT");
          }
        }
      }
      if (
        ts.isElementAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "process" &&
        node.argumentExpression &&
        ts.isStringLiteralLike(node.argumentExpression) &&
        node.argumentExpression.text === "env"
      ) {
        violations.push("ENVIRONMENT_ACCESS");
      }
    });
  }
  return [...new Set(violations)].sort();
}

export function testingTreeDigest(manifestPath) {
  const rows = listRegularFiles("testing")
    .filter((repositoryPath) => repositoryPath !== manifestPath)
    .map((repositoryPath) => {
      const identity = fileIdentity(repositoryPath);
      return [
        identity.path,
        identity.sha256,
        identity.bytes,
        identity.mode,
      ].join("\0");
    });
  return sha256(rows.join("\n"));
}

export const APP_SURFACE_NAMES = new Set([
  "page",
  "layout",
  "template",
  "default",
  "route",
  "error",
  "global-error",
  "loading",
  "not-found",
  "robots",
  "sitemap",
  "manifest",
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
]);

export function appSurfaceInventory() {
  return listRegularFiles("app").filter((repositoryPath) => {
    const extension = path.extname(repositoryPath);
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extension)) {
      return false;
    }
    return APP_SURFACE_NAMES.has(path.basename(repositoryPath, extension));
  });
}

export function worktreeGitIdentity(repositoryPath) {
  const worktreeBlob = gitOutput(["hash-object", "--", repositoryPath]).trim();
  let indexBlob = null;
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "-s", "--", repositoryPath],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    indexBlob = output ? output.split(/\s+/)[1] : null;
  } catch {
    indexBlob = null;
  }
  return indexBlob === worktreeBlob
    ? `git:${indexBlob}`
    : `worktree:${fileIdentity(repositoryPath).sha256}`;
}

export function appSurfaceDigest() {
  const rows = appSurfaceInventory().map((repositoryPath) =>
    [repositoryPath, worktreeGitIdentity(repositoryPath)].join("\0"),
  );
  return sha256(rows.join("\n"));
}

export function categoricalFailure(stage) {
  const normalized =
    typeof stage === "string" && /^[A-Z0-9_]+$/.test(stage)
      ? stage
      : "INTERNAL_TEST_FAILURE";
  console.log(`EXPECTED_FAIL_${normalized}`);
}
