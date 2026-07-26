import { existsSync, lstatSync, readFileSync } from "node:fs";
import ts from "typescript";

const CURRENT_CANONICAL_ORIGIN = "https://www.aifinder.to";
const ALTERNATE_CANONICAL_ORIGIN = "https://aifinder.to";
const OLD_ORIGIN = "https://aifinder-eight.vercel.app";
const CANONICAL_SOURCE_PATH = "lib/public-canonical-origin.ts";

const errorBoundaryPaths = [
  "app/error.tsx",
  "app/global-error.tsx",
  "app/compare/error.tsx",
  "app/category/[slug]/error.tsx",
  "app/tool/[slug]/error.tsx",
  "app/submit/error.tsx",
];

const diagnosticConsumers = new Map([
  ["app/page.tsx", "PUBLIC_HOMEPAGE_TOOLS_LOAD_FAILED"],
  ["app/compare/page.tsx", "PUBLIC_COMPARE_TOOLS_LOAD_FAILED"],
  ["app/category/[slug]/page.tsx", "PUBLIC_CATEGORY_TOOLS_LOAD_FAILED"],
  ["app/tool/[slug]/page.tsx", "PUBLIC_TOOL_DETAIL_LOAD_FAILED"],
  ["app/sitemap.ts", "PUBLIC_SITEMAP_TOOLS_LOAD_FAILED"],
]);

const canonicalPages = [
  "app/compare/page.tsx",
  "app/category/[slug]/page.tsx",
  "app/tool/[slug]/page.tsx",
];
const canonicalImportSpecifiers = new Map([
  ["app/compare/page.tsx", "../../lib/public-canonical-origin"],
  ["app/category/[slug]/page.tsx", "../../../lib/public-canonical-origin"],
  ["app/tool/[slug]/page.tsx", "../../../lib/public-canonical-origin"],
]);

const expectedDiagnosticEvents = [...diagnosticConsumers.values()];

let assertionCount = 0;

class ExpectedAssertionFailure extends Error {}

class InternalTestFailure extends Error {}

function assert(condition, label) {
  assertionCount += 1;
  if (!condition) throw new ExpectedAssertionFailure(label);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireRegularFile(path) {
  assert(existsSync(path), `${path} is absent`);
  const info = lstatSync(path);
  assert(info.isFile(), `${path} is not a regular file`);
  assert(!info.isSymbolicLink(), `${path} is a symbolic link`);
  assert((info.mode & 0o777) === 0o644, `${path} mode is not 0644`);
}

function parse(path, kind = ts.ScriptKind.TSX) {
  const source = read(path);
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new InternalTestFailure(`${path} contains a TypeScript parse diagnostic`);
  }
  return { source, sourceFile };
}

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function defaultFunction(sourceFile) {
  return sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
      hasModifier(statement, ts.SyntaxKind.DefaultKeyword),
  );
}

function hasNamedImport(sourceFile, moduleName, importedName) {
  return sourceFile.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== moduleName
    ) {
      return false;
    }

    const bindings = statement.importClause?.namedBindings;
    return (
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.some(
        (element) =>
          (element.propertyName?.text ?? element.name.text) === importedName,
      )
    );
  });
}

function exactIdentifierCallCount(sourceFile, functionName, literalArgument) {
  let count = 0;

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === functionName &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      node.arguments[0].text === literalArgument
    ) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return count;
}

function variableStringLiteral(sourceFile, name) {
  const matches = [];
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) {
      matches.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert(matches.length === 1, `${name} declaration count`);
  assert(ts.isStringLiteralLike(matches[0]), `${name} is not a string literal`);
  return matches[0].text;
}

function assertNoUnsafeBoundaryBehavior(path, sourceFile, source) {
  for (const rejected of [
    "console.",
    "window.",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "process.env",
    "cookies(",
    "headers(",
    "supabase",
    "JSON.stringify",
  ]) {
    assert(!source.includes(rejected), `${path} contains ${rejected}`);
  }

  function visit(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      ["message", "digest", "stack", "cause"].includes(node.name.text)
    ) {
      throw new Error(`${path} inspects exception data`);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assertionCount += 1;
}

const groups = [
  {
    id: "REQUIRED_PUBLIC_BOUNDARIES",
    run() {
      for (const path of [
        ...errorBoundaryPaths,
        "app/not-found.tsx",
        "app/loading.tsx",
        "components/public/public-route-error.tsx",
      ]) {
        requireRegularFile(path);
      }

      for (const path of errorBoundaryPaths) {
        const { source, sourceFile } = parse(path);
        assert(
          ts.isExpressionStatement(sourceFile.statements[0]) &&
            ts.isStringLiteral(sourceFile.statements[0].expression) &&
            sourceFile.statements[0].expression.text === "use client",
          `${path} is not a client component`,
        );
        const component = defaultFunction(sourceFile);
        assert(component, `${path} has no default function export`);
        assert(component.parameters.length === 1, `${path} parameter count`);
        const parameter = component.parameters[0];
        assert(
          ts.isObjectBindingPattern(parameter.name),
          `${path} does not use a bounded prop binding`,
        );
        assert(
          parameter.name.elements.length === 1 &&
            parameter.name.elements[0].name.getText() === "reset",
          `${path} binds exception data instead of reset only`,
        );
        const typeText = parameter.type?.getText(sourceFile) ?? "";
        assert(/\berror\s*:/.test(typeText), `${path} omits the Next error prop`);
        assert(/\breset\s*:/.test(typeText), `${path} omits the Next reset prop`);
        assert(source.includes("<PublicRouteError"), `${path} does not use the shared surface`);
        assert(source.includes("reset={reset}"), `${path} does not forward reset`);
        assertNoUnsafeBoundaryBehavior(path, sourceFile, source);
      }

      const globalError = read("app/global-error.tsx");
      assert(globalError.includes("<html"), "global error omits html");
      assert(globalError.includes("<body"), "global error omits body");

      const notFound = read("app/not-found.tsx");
      assert(notFound.includes("<PublicRouteError"), "not-found omits shared surface");
      assert(!notFound.includes('"use client"'), "not-found is unnecessarily client-side");

      const loading = read("app/loading.tsx");
      assert(loading.includes('role="status"'), "loading omits status role");
      assert(loading.includes('aria-live="polite"'), "loading omits polite live region");

      const shared = read("components/public/public-route-error.tsx");
      assert(shared.includes("PUBLIC_ROUTE_ERROR_COPY"), "shared copy map is absent");
      assert(shared.includes('href="/"'), "shared home action is absent");
      assert(shared.includes("onClick={reset}"), "shared reset action is absent");
      assert(!/\berror\s*[?:]/.test(shared), "shared surface accepts exception data");
      assert(!shared.includes("console."), "shared surface logs data");
    },
  },
  {
    id: "PUBLIC_PERSISTENCE_HELPER",
    run() {
      requireRegularFile("lib/public-persistence.ts");
      const helper = read("lib/public-persistence.ts");
      assert(
        helper.includes("export function parsePersistedStringArray"),
        "pure parser export is absent",
      );
      assert(
        helper.includes("export function readPersistedStringArray"),
        "storage reader export is absent",
      );
      assert(!helper.includes("console."), "persistence helper logs data");

      const consumers = [
        {
          path: "app/page.tsx",
          keys: [
            ['"aifinder-favorites"', "maxSerializedLength: 16384", "maxItems: 100", "maxItemLength: 128"],
            ['"aifinder-recent-searches"', "maxSerializedLength: 2048", "maxItems: 5", "maxItemLength: 120"],
          ],
        },
        {
          path: "app/compare-provider.tsx",
          keys: [
            ['"aifinder-compare"', "maxSerializedLength: 2048", "maxItems: 3", "maxItemLength: 128"],
          ],
        },
        {
          path: "app/category/[slug]/category-detail-client.tsx",
          keys: [
            ['"aifinder-favorites"', "maxSerializedLength: 16384", "maxItems: 100", "maxItemLength: 128"],
          ],
        },
      ];

      for (const consumer of consumers) {
        const source = read(consumer.path);
        assert(
          source.includes('from "@/lib/public-persistence"'),
          `${consumer.path} omits the persistence import`,
        );
        assert(!source.includes("JSON.parse"), `${consumer.path} retains direct JSON.parse`);
        for (const expected of consumer.keys.flat()) {
          assert(source.includes(expected), `${consumer.path} omits ${expected}`);
        }
      }

      const packageJson = JSON.parse(read("package.json"));
      assert(
        packageJson.scripts["test:public-launch-resilience"] ===
          "node testing/public-launch-resilience-static-assertions.mjs",
        "resilience package script mismatch",
      );
      assert(
        packageJson.scripts["test:public-persistence"] ===
          "node testing/public-persistence.test.mjs",
        "persistence package script mismatch",
      );
      assert(
        packageJson.scripts["test:public-launch-static"] ===
          "npm run test:public-launch-resilience && npm run test:public-persistence && node testing/production-perimeter-static-assertions.mjs",
        "aggregate package script mismatch",
      );
    },
  },
  {
    id: "PUBLIC_DIAGNOSTICS_HELPER",
    run() {
      requireRegularFile("lib/public-diagnostics.ts");
      const { source, sourceFile } = parse(
        "lib/public-diagnostics.ts",
        ts.ScriptKind.TS,
      );
      const eventType = sourceFile.statements.find(
        (statement) =>
          ts.isTypeAliasDeclaration(statement) &&
          statement.name.text === "PublicDiagnosticEvent",
      );
      assert(eventType, "diagnostic event type is absent");
      assert(ts.isUnionTypeNode(eventType.type), "diagnostic event type is not a union");
      const eventMembers = eventType.type.types.map((member) => {
        assert(
          ts.isLiteralTypeNode(member) &&
            ts.isStringLiteralLike(member.literal),
          "diagnostic event member is not a string literal",
        );
        return member.literal.text;
      });
      assert(
        eventMembers.length === expectedDiagnosticEvents.length &&
          expectedDiagnosticEvents.every((event) => eventMembers.includes(event)),
        "diagnostic event union is not exact",
      );
      assert(
        !/\b(error|message|stack|payload|url|input|identifier)\s*[?:]/i.test(source),
        "diagnostic helper accepts data-bearing props",
      );
      const component = sourceFile.statements.find(
        (statement) =>
          ts.isFunctionDeclaration(statement) &&
          statement.name?.text === "logPublicDiagnosticEvent",
      );
      assert(component, "diagnostic function is absent");
      assert(component.parameters.length === 1, "diagnostic function parameter count");
      assert(
        component.parameters[0].name.getText(sourceFile) === "event",
        "diagnostic function accepts a non-event parameter",
      );
      assert(
        component.body?.statements.some(
          (statement) =>
            ts.isExpressionStatement(statement) &&
            ts.isCallExpression(statement.expression) &&
            ts.isPropertyAccessExpression(statement.expression.expression) &&
            ts.isIdentifier(statement.expression.expression.expression) &&
            statement.expression.expression.expression.text === "console" &&
            statement.expression.expression.name.text === "error" &&
            statement.expression.arguments.length === 1 &&
            ts.isIdentifier(statement.expression.arguments[0]) &&
            statement.expression.arguments[0].text === "event",
        ),
        "diagnostic helper does not emit only the event",
      );
    },
  },
  {
    id: "RESIDUAL_CANONICAL_ORIGINS",
    run() {
      const { source: canonicalSource, sourceFile: canonicalSourceFile } = parse(
        CANONICAL_SOURCE_PATH,
        ts.ScriptKind.TS,
      );
      assert(
        variableStringLiteral(
          canonicalSourceFile,
          "PUBLIC_CANONICAL_ORIGIN",
        ) === CURRENT_CANONICAL_ORIGIN,
        "shared canonical origin mismatch",
      );
      assert(
        !canonicalSource.includes("process.env"),
        "shared canonical source reads environment state",
      );
      for (const path of canonicalPages) {
        const { source, sourceFile } = parse(path);
        assert(
          hasNamedImport(
            sourceFile,
            canonicalImportSpecifiers.get(path),
            "PUBLIC_CANONICAL_ORIGIN",
          ),
          `${path} omits the shared canonical origin import`,
        );
        assert(
          !source.includes(CURRENT_CANONICAL_ORIGIN),
          `${path} retains a local current origin`,
        );
        assert(
          !source.includes(ALTERNATE_CANONICAL_ORIGIN),
          `${path} retains the alternate origin`,
        );
        assert(!source.includes(OLD_ORIGIN), `${path} retains the old origin`);
      }
    },
  },
  {
    id: "RAW_PUBLIC_DIAGNOSTICS",
    run() {
      for (const [path, event] of diagnosticConsumers) {
        const { source, sourceFile } = parse(path);
        assert(!source.includes("error.message"), `${path} retains error.message`);
        assert(!source.includes("console.error"), `${path} retains console.error`);
        assert(
          hasNamedImport(
            sourceFile,
            "@/lib/public-diagnostics",
            "logPublicDiagnosticEvent",
          ),
          `${path} omits the diagnostics import`,
        );
        assert(
          exactIdentifierCallCount(
            sourceFile,
            "logPublicDiagnosticEvent",
            event,
          ) === 1,
          `${path} omits its exact executable diagnostic event`,
        );
      }
    },
  },
];

let passCount = 0;
let failCount = 0;
let internalFailCount = 0;

for (const group of groups) {
  try {
    group.run();
    passCount += 1;
    console.log(`PASS ${group.id}`);
  } catch (caught) {
    if (caught instanceof ExpectedAssertionFailure) {
      failCount += 1;
      console.log(`EXPECTED_FAIL ${group.id}`);
    } else {
      internalFailCount += 1;
      console.log(`INTERNAL_FAIL ${group.id}`);
    }
  }
}

console.log(
  `AIFINDER_PHASE_30EM_30EX_RESILIENCE_ASSERTIONS groups=${groups.length} assertions=${assertionCount} pass=${passCount} fail=${failCount} internal_fail=${internalFailCount}`,
);

if (failCount > 0 || internalFailCount > 0) process.exitCode = 1;
