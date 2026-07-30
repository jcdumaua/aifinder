import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(".");
const SELF_PATH =
  "testing/authenticated-browser-security-static-assertions.mjs";
const EVIDENCE_PATH = "testing/authenticated-browser-static-evidence.json";
const PLAN_PATH = "testing/authenticated-browser-planning-manifest.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const SAFETY_PATH = "testing/static-test-safety-manifest.json";
const LOGIN_PATH = "app/admin-login/page.tsx";
const PREVIEW_PATH = "app/admin/homepage-control/[id]/preview/page.tsx";
const SHARED_PATH = "components/admin/admin-dashboard-client.tsx";
const AUDIT_PATH = "app/api/admin/audit-logs/route.ts";
const DISCOVERY_SOURCES_PATH =
  "components/admin/discovery/discovery-sources-panel.tsx";
const DISCOVERY_RUNS_PATH =
  "components/admin/discovery/discovery-runs-table.tsx";
const DISCOVERY_QUEUE_PATH =
  "components/admin/discovery/discovery-queue-table.tsx";
const DISCOVERY_DETAIL_PATH =
  "components/admin/discovery/discovery-tool-detail.tsx";
const BASELINE = "3a43f8c9b01997487e20725ddcb38a4b7ce19676";
const TERMINAL_ASSURANCE_RESULT =
  "PASS_TERMINAL_AUTHENTICATED_BROWSER_ASSURANCE";
const EXPECTED_SOURCE_SHA256 = Object.freeze({
  [SHARED_PATH]:
    "136ca5994e95faad6225b041023f3ea89084a28ba77cc26608ac5001509592e8",
  [DISCOVERY_QUEUE_PATH]:
    "dc199c25aa6527bb473ac15080d2cee956185f4fe33f412251b8aebbac856429",
  [DISCOVERY_DETAIL_PATH]:
    "ab72c573a7cdef9b0ee245e75be2c3052b3836f0676f9c1b776f1ba46c6ccccd",
});
const AUTHENTICATED_STATIC_EVIDENCE_PATHS = Object.freeze([
  SELF_PATH,
  EVIDENCE_PATH,
]);

const AUTHENTICATED_SURFACES = Object.freeze([
  "app/admin-login/layout.tsx",
  "app/admin-login/page.tsx",
  "app/admin/analytics/page.tsx",
  "app/admin/discovered-tools/page.tsx",
  "app/admin/discovery/page.tsx",
  "app/admin/discovery/tools/[id]/page.tsx",
  "app/admin/discovery/tools/page.tsx",
  "app/admin/homepage-control/[id]/edit/page.tsx",
  "app/admin/homepage-control/[id]/page.tsx",
  "app/admin/homepage-control/[id]/preview/page.tsx",
  "app/admin/homepage-control/page.tsx",
  "app/admin/layout.tsx",
  "app/admin/moderation/page.tsx",
  "app/admin/notifications/page.tsx",
  "app/admin/page.tsx",
  "app/admin/security/page.tsx",
  "app/admin/settings/page.tsx",
  "app/admin/tools/page.tsx",
]);

const STARTING_BLOBS = Object.freeze({
  "app/admin-login/layout.tsx": "3d27e328b56040dfdbcde5f0d1768cc04d94fbce",
  "app/admin-login/page.tsx": "f1269932f586dea8f578556d2bbbce604a29eb1e",
  "app/admin/analytics/page.tsx": "104416d671561ff96a32e648c93a1f7e9f345fad",
  "app/admin/discovered-tools/page.tsx":
    "a0b2bdaa129eff1a5eacd09a7f53b236cde97a12",
  "app/admin/discovery/page.tsx": "e79f1f6ce3aed82e9dc13730f1764fe1278e7b38",
  "app/admin/discovery/tools/[id]/page.tsx":
    "7953f4e8e2dcff5fea7057bff83759391ece9af0",
  "app/admin/discovery/tools/page.tsx":
    "e4b596779d6e6635130b3888ffd14ea5b69cf19c",
  "app/admin/homepage-control/[id]/edit/page.tsx":
    "f795111434271ef46281904b83bc747da209dbb8",
  "app/admin/homepage-control/[id]/page.tsx":
    "bd2fcedf6179ef4ef5d3be00799c646a0e202d1f",
  "app/admin/homepage-control/[id]/preview/page.tsx":
    "637cd8a02350fb42fcb7453298e5b948a5780ee0",
  "app/admin/homepage-control/page.tsx":
    "23657bc640ff78868748e9e0c192c1c91753e49f",
  "app/admin/layout.tsx": "ccd44e42ed83e1e8626abcfcde251bf494e049f3",
  "app/admin/moderation/page.tsx":
    "0138abcaf9c3130598c097ccff99270039c802b4",
  "app/admin/notifications/page.tsx":
    "143070275dc2c30bec651b926d27f8f18bc01bea",
  "app/admin/page.tsx": "24ebb1d5c369b4ba884a0da989efa8457a049e3a",
  "app/admin/security/page.tsx":
    "c420b6ee203cbcb015036646c45513e83b651868",
  "app/admin/settings/page.tsx":
    "d8158550b96c5c02cd53f82920703885e75c7433",
  "app/admin/tools/page.tsx": "6d4b84f3734a1e7c806c2e79752ec105c27f0b65",
});

const CRITICAL_ROOTS = Object.freeze([
  "proxy.ts",
  "lib/admin-auth.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/csrf/route.ts",
  "app/api/admin/logout/route.ts",
  "components/admin/discovery/candidate-staging-queue-panel.tsx",
  "lib/homepage-control-admin.ts",
  SHARED_PATH,
  AUDIT_PATH,
  DISCOVERY_SOURCES_PATH,
  DISCOVERY_RUNS_PATH,
  DISCOVERY_QUEUE_PATH,
  DISCOVERY_DETAIL_PATH,
]);

const APP_SURFACE_NAMES = new Set([
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

class ContractError extends Error {
  constructor(stage) {
    super(stage);
    this.stage = stage;
  }
}

function requireContract(condition, stage) {
  if (!condition) throw new ContractError(stage);
}

function absolute(repositoryPath) {
  requireContract(
    typeof repositoryPath === "string" &&
      repositoryPath.length > 0 &&
      !path.isAbsolute(repositoryPath),
    "AUTH_STATIC_PATH",
  );
  const resolved = path.resolve(ROOT, repositoryPath);
  requireContract(
    resolved.startsWith(`${ROOT}${path.sep}`),
    "AUTH_STATIC_PATH_ESCAPE",
  );
  return resolved;
}

function regular(repositoryPath, expectedMode = 0o644) {
  let info;
  try {
    info = fs.lstatSync(absolute(repositoryPath));
  } catch {
    throw new ContractError("AUTH_STATIC_REGULAR_FILE_ABSENT");
  }
  requireContract(
    info.isFile() && !info.isSymbolicLink(),
    "AUTH_STATIC_REGULAR_FILE",
  );
  if (expectedMode !== null) {
    requireContract(
      (info.mode & 0o777) === expectedMode,
      "AUTH_STATIC_FILE_MODE",
    );
  }
  return absolute(repositoryPath);
}

function source(repositoryPath) {
  return fs.readFileSync(regular(repositoryPath), "utf8");
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function gitBlob(bytes) {
  return crypto
    .createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");
}

function identity(repositoryPath) {
  const bytes = fs.readFileSync(regular(repositoryPath, null));
  return {
    sha256: sha256(bytes),
    git_blob: gitBlob(bytes),
    bytes: bytes.length,
    lines: bytes.toString("utf8").split("\n").length - 1,
    mode: (fs.statSync(absolute(repositoryPath)).mode & 0o777)
      .toString(8)
      .padStart(4, "0"),
  };
}

class StrictJsonParser {
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  fail(stage = "AUTH_STATIC_JSON_SYNTAX") {
    throw new ContractError(stage);
  }

  whitespace() {
    while (
      this.index < this.text.length &&
      /[\u0009\u000a\u000d\u0020]/u.test(this.text[this.index])
    ) {
      this.index += 1;
    }
  }

  parse() {
    this.whitespace();
    const value = this.value();
    this.whitespace();
    if (this.index !== this.text.length) this.fail();
    return value;
  }

  value() {
    this.whitespace();
    const character = this.text[this.index];
    if (character === "{") return this.object();
    if (character === "[") return this.array();
    if (character === '"') return this.string();
    if (character === "t") return this.literal("true", true);
    if (character === "f") return this.literal("false", false);
    if (character === "n") return this.literal("null", null);
    return this.number();
  }

  string() {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (!escaped && character === '"') {
        this.index += 1;
        try {
          return JSON.parse(this.text.slice(start, this.index));
        } catch {
          this.fail();
        }
      }
      if (!escaped && this.text.charCodeAt(this.index) < 0x20) this.fail();
      escaped = !escaped && character === "\\";
      this.index += 1;
    }
    this.fail();
  }

  number() {
    const match = this.text
      .slice(this.index)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u);
    if (!match) this.fail();
    this.index += match[0].length;
    const number = Number(match[0]);
    if (!Number.isFinite(number)) this.fail();
    return number;
  }

  literal(text, value) {
    if (this.text.slice(this.index, this.index + text.length) !== text) {
      this.fail();
    }
    this.index += text.length;
    return value;
  }

  array() {
    const output = [];
    this.index += 1;
    this.whitespace();
    if (this.text[this.index] === "]") {
      this.index += 1;
      return output;
    }
    while (true) {
      output.push(this.value());
      this.whitespace();
      if (this.text[this.index] === "]") {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ",") this.fail();
      this.index += 1;
    }
  }

  object() {
    const output = Object.create(null);
    const keys = new Set();
    this.index += 1;
    this.whitespace();
    if (this.text[this.index] === "}") {
      this.index += 1;
      return output;
    }
    while (true) {
      this.whitespace();
      if (this.text[this.index] !== '"') this.fail();
      const key = this.string();
      if (keys.has(key)) this.fail("AUTH_STATIC_JSON_DUPLICATE_KEY");
      keys.add(key);
      this.whitespace();
      if (this.text[this.index] !== ":") this.fail();
      this.index += 1;
      output[key] = this.value();
      this.whitespace();
      if (this.text[this.index] === "}") {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ",") this.fail();
      this.index += 1;
    }
  }
}

function readJson(repositoryPath) {
  return new StrictJsonParser(source(repositoryPath)).parse();
}

function parse(repositoryPath) {
  const text = source(repositoryPath);
  const kind = repositoryPath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : repositoryPath.endsWith(".ts")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS;
  const ast = ts.createSourceFile(
    repositoryPath,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  requireContract(
    ast.parseDiagnostics.length === 0,
    "AUTH_STATIC_PARSE_DIAGNOSTIC",
  );
  return { text, ast };
}

function walk(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => walk(child, visitor));
}

function namedFunction(ast, name) {
  let found;
  walk(ast, (node) => {
    if (
      !found &&
      ts.isFunctionDeclaration(node) &&
      node.name?.text === name
    ) {
      found = node;
    }
  });
  requireContract(Boolean(found), `AUTH_STATIC_FUNCTION_${name.toUpperCase()}`);
  return found;
}

function functionText(parsed, name) {
  return namedFunction(parsed.ast, name).getText(parsed.ast);
}

function jsxName(opening) {
  return opening.tagName.getText();
}

function openingOf(node) {
  return ts.isJsxElement(node) ? node.openingElement : node;
}

function jsxAttribute(opening, name) {
  return opening.attributes.properties.find(
    (attribute) =>
      ts.isJsxAttribute(attribute) && attribute.name.getText() === name,
  );
}

function jsxValue(opening, name) {
  const attribute = jsxAttribute(opening, name);
  if (!attribute?.initializer) return null;
  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }
  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression
  ) {
    return attribute.initializer.expression.getText();
  }
  return null;
}

function jsxElements(ast) {
  const elements = [];
  walk(ast, (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      elements.push(node);
    }
  });
  return elements;
}

function descendantElements(node) {
  const output = [];
  walk(node, (child) => {
    if (
      child !== node &&
      (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))
    ) {
      output.push(child);
    }
  });
  return output;
}

function ancestorJsxElement(node, tagName) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current) && jsxName(current.openingElement) === tagName) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function verifyLoginForm(parsed, inputId, stage) {
  const input = jsxElements(parsed.ast).find((node) => {
    const opening = openingOf(node);
    return jsxName(opening) === "input" && jsxValue(opening, "id") === inputId;
  });
  requireContract(Boolean(input), stage);
  const form = ancestorJsxElement(input, "form");
  requireContract(Boolean(form), stage);
  const formOpening = form.openingElement;
  const descendants = descendantElements(form).map(openingOf);
  requireContract(Boolean(jsxAttribute(formOpening, "onSubmit")), stage);
  requireContract(
    jsxValue(openingOf(input), "name") === "password" &&
      jsxValue(openingOf(input), "type") === "password" &&
      jsxValue(openingOf(input), "autoComplete") === "current-password",
    stage,
  );
  requireContract(
    descendants.some(
      (opening) =>
        jsxName(opening) === "label" &&
        jsxValue(opening, "htmlFor") === inputId,
    ),
    stage,
  );
  requireContract(
    descendants.some(
      (opening) =>
        jsxName(opening) === "button" &&
        jsxValue(opening, "type") === "submit",
    ),
    stage,
  );
  requireContract(
    !descendants.some((opening) => jsxAttribute(opening, "onKeyDown")),
    stage,
  );
}

function verifyDialogs(parsed, expectedCount, stage) {
  const dialogs = jsxElements(parsed.ast).filter(
    (node) => jsxValue(openingOf(node), "role") === "dialog",
  );
  requireContract(dialogs.length === expectedCount, stage);
  for (const dialog of dialogs) {
    const opening = openingOf(dialog);
    const labelledBy = jsxValue(opening, "aria-labelledby");
    const describedBy = jsxValue(opening, "aria-describedby");
    const descendants = descendantElements(dialog).map(openingOf);
    const ids = new Set(
      descendants.map((child) => jsxValue(child, "id")).filter(Boolean),
    );
    requireContract(
      typeof labelledBy === "string" &&
        typeof describedBy === "string" &&
        ids.has(labelledBy) &&
        ids.has(describedBy),
      stage,
    );
  }
}

function verifyPasswordFlow(parsed, stage) {
  const text = functionText(parsed, "unlockAdmin");
  const capture = text.indexOf("const submittedPassword = password;");
  const clear = text.indexOf('setPassword("");', capture);
  const validation = text.indexOf("submittedPassword.trim()", capture);
  const request = text.indexOf('fetch("/api/admin/login"', capture);
  requireContract(
    capture >= 0 &&
      clear > capture &&
      clear < validation &&
      validation < request &&
      text.includes("password: submittedPassword") &&
      !text.includes("password,\n"),
    stage,
  );
}

function verifyStandaloneLogin() {
  const parsed = parse(LOGIN_PATH);
  verifyLoginForm(parsed, "admin-password", "AUTH_STATIC_STANDALONE_FORM");
  verifyDialogs(parsed, 1, "AUTH_STATIC_STANDALONE_DIALOG");
  verifyPasswordFlow(parsed, "AUTH_STATIC_STANDALONE_PASSWORD_CLEAR");
  const redirect = functionText(parsed, "getRedirectPath");
  requireContract(
    redirect.includes("new URL(from, window.location.origin)") &&
      redirect.includes("candidate.origin !== window.location.origin") &&
      redirect.includes("candidate.username") &&
      redirect.includes("candidate.password") &&
      redirect.includes('candidate.pathname === "/admin"') &&
      redirect.includes('candidate.pathname.startsWith("/admin/")') &&
      redirect.includes("candidate.hash") &&
      redirect.includes("from.startsWith(\"//\")") &&
      redirect.includes("from.includes(\"#\")") &&
      redirect.includes("${candidate.pathname}${candidate.search}") &&
      !redirect.includes('from.startsWith("/admin")'),
    "AUTH_STATIC_SAFE_RETURN_PATH",
  );
}

function verifyPreview() {
  const text = source(PREVIEW_PATH);
  requireContract(
    !text.includes("recordHomepageControlPreview") &&
      !text.includes("previewAuditResult") &&
      !text.includes("auditWarnings") &&
      text.includes("getHomepageControlConfigById") &&
      text.includes("getHomepageControlPreviewChecklist") &&
      text.includes("hydrateHomepagePreviewToolPlacements"),
    "AUTH_STATIC_PREVIEW_RENDER_READ_ONLY",
  );
}

function enclosingFunctionName(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current)) return current.name?.text ?? "";
    if (
      (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
      ts.isVariableDeclaration(current.parent) &&
      ts.isIdentifier(current.parent.name)
    ) {
      return current.parent.name.text;
    }
    current = current.parent;
  }
  return "";
}

function verifySharedClient() {
  const parsed = parse(SHARED_PATH);
  verifyLoginForm(
    parsed,
    "admin-dashboard-password",
    "AUTH_STATIC_SHARED_FORM",
  );
  verifyDialogs(parsed, 3, "AUTH_STATIC_SHARED_DIALOGS");
  verifyPasswordFlow(parsed, "AUTH_STATIC_SHARED_PASSWORD_CLEAR");

  const auditCalls = [];
  walk(parsed.ast, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "fetchAuditLogs"
    ) {
      auditCalls.push(enclosingFunctionName(node));
    }
  });
  requireContract(
    auditCalls.length === 2 &&
      auditCalls.includes("openAuditLogsPanel") &&
      auditCalls.includes("refreshAuditLogsPanel"),
    "AUTH_STATIC_EXPLICIT_ONLY_AUDIT_FETCH",
  );

  const archive = functionText(parsed, "archiveOverflowAuditLogs");
  requireContract(
    archive.includes("askConfirm({") &&
      archive.includes("await fetchCsrfToken()") &&
      archive.includes('fetch("/api/admin/audit-logs"') &&
      archive.includes('method: "POST"') &&
      archive.includes('"x-csrf-token": secureToken') &&
      archive.indexOf("askConfirm({") < archive.indexOf("await fetchCsrfToken()"),
    "AUTH_STATIC_EXPLICIT_ARCHIVE_CONTROL",
  );
}

function verifyAuditRoute() {
  const parsed = parse(AUDIT_PATH);
  const getText = functionText(parsed, "GET");
  const postText = functionText(parsed, "POST");
  const archiveText = functionText(parsed, "archiveOverflowAuditLogs");
  const storageRollback = functionText(parsed, "removeArchiveStorageObject");
  const metadataRollback = functionText(parsed, "rollbackArchiveMetadata");
  requireContract(
    getText.includes("isAuthorizedAdminRequest(request)") &&
      getText.includes("getRecentAuditLogs()") &&
      getText.includes("getAuditArchives()") &&
      !getText.includes("archiveOverflowAuditLogs") &&
      !/\.(?:upload|insert|update|upsert|delete|remove|rpc)\s*\(/u.test(getText),
    "AUDIT_LOG_GET_PURE_READ",
  );
  const sessionIndex = postText.indexOf("isAuthorizedAdminRequest(request)");
  const csrfIndex = postText.indexOf("verifyAdminCsrfRequest(request)");
  const archiveIndex = postText.indexOf("archiveOverflowAuditLogs()");
  requireContract(
    sessionIndex >= 0 &&
      csrfIndex > sessionIndex &&
      archiveIndex > csrfIndex &&
      postText.includes("ARCHIVE_NOT_REQUIRED") &&
      postText.includes("ARCHIVE_COMPLETED") &&
      postText.includes("ARCHIVE_FAILED") &&
      postText.includes("archived_count: result.archivedCount") &&
      !/(?:fileName|file_name|storagePath|storage_path|caught|exception)\s*[,}]/u.test(
        postText,
      ),
    "AUTH_STATIC_ARCHIVE_POST_GUARDS_AND_RESPONSE",
  );
  const uploadIndex = archiveText.indexOf(".upload(");
  const insertIndex = archiveText.indexOf(".insert(");
  const liveDeleteIndex = archiveText.lastIndexOf(".delete()");
  requireContract(
    uploadIndex >= 0 &&
      insertIndex > uploadIndex &&
      liveDeleteIndex > insertIndex &&
      archiveText.includes("if (uploadError)") &&
      archiveText.includes("if (archiveInsertError)") &&
      archiveText.includes("await removeArchiveStorageObject(storagePath)") &&
      archiveText.includes("if (deleteError)") &&
      archiveText.includes("await rollbackArchiveMetadata(storagePath)") &&
      archiveText.lastIndexOf("await removeArchiveStorageObject(storagePath)") >
        archiveText.indexOf("if (deleteError)") &&
      storageRollback.includes(".remove([storagePath])") &&
      storageRollback.includes(
        "audit_logs_archive_storage_rollback_failed",
      ) &&
      metadataRollback.includes('.from("admin_audit_archives")') &&
      metadataRollback.includes(".delete()") &&
      metadataRollback.includes('.eq("storage_path", storagePath)') &&
      metadataRollback.includes(
        "audit_logs_archive_metadata_rollback_failed",
      ) &&
      archiveText.includes("MAX_ARCHIVE_BATCH"),
    "AUTH_STATIC_ARCHIVE_COMPENSATION",
  );
}

function verifyDiscoverySelectAccessibility() {
  const controls = [
    {
      path: DISCOVERY_SOURCES_PATH,
      value: "sourceTypeFilter",
      name: "Filter discovery sources by type",
    },
    {
      path: DISCOVERY_SOURCES_PATH,
      value: "activeFilter",
      name: "Filter discovery sources by active state",
    },
    {
      path: DISCOVERY_RUNS_PATH,
      value: "status",
      name: "Filter discovery runs by status",
    },
    {
      path: DISCOVERY_QUEUE_PATH,
      value: "sourceFilter",
      name: "Filter discovery queue by source",
    },
    {
      path: DISCOVERY_QUEUE_PATH,
      value: "statusFilter",
      name: "Filter discovery queue by status",
    },
  ];
  const parsedByPath = new Map(
    [...new Set(controls.map((control) => control.path))].map(
      (repositoryPath) => [repositoryPath, parse(repositoryPath)],
    ),
  );

  for (const control of controls) {
    const parsed = parsedByPath.get(control.path);
    const matches = jsxElements(parsed.ast).filter((node) => {
      const opening = openingOf(node);
      return (
        jsxName(opening) === "select" &&
        jsxValue(opening, "value") === control.value
      );
    });
    requireContract(
      matches.length === 1,
      "AUTH_STATIC_DISCOVERY_SELECT_CONTROL",
    );

    const opening = openingOf(matches[0]);
    requireContract(
      jsxValue(opening, "aria-label") === control.name &&
        jsxValue(opening, "aria-labelledby") === null &&
        jsxValue(opening, "title") === null &&
        jsxValue(opening, "id") === null &&
        ancestorJsxElement(matches[0], "label") === null,
      "AUTH_STATIC_DISCOVERY_SELECT_ACCESSIBLE_NAME",
    );

    const exactNameCount = [...parsedByPath.values()]
      .flatMap(({ ast }) => jsxElements(ast).map(openingOf))
      .filter(
        (candidate) =>
          jsxName(candidate) === "select" &&
          jsxValue(candidate, "aria-label") === control.name,
      ).length;
    requireContract(
      exactNameCount === 1,
      "AUTH_STATIC_DISCOVERY_SELECT_NAME_UNIQUE",
    );
  }
}

function classTokens(opening) {
  const value = jsxValue(opening, "className");
  requireContract(
    typeof value === "string",
    "AUTH_STATIC_DISCOVERY_DETAIL_CONTRAST",
  );
  return new Set(value.trim().split(/\s+/u));
}

function verifySourceCandidateIdentities() {
  for (const [repositoryPath, expectedSha256] of Object.entries(
    EXPECTED_SOURCE_SHA256,
  )) {
    requireContract(
      identity(repositoryPath).sha256 === expectedSha256,
      "AUTH_STATIC_SOURCE_CANDIDATE_IDENTITIES",
    );
  }
}

function verifyDiscoveryDetailContrast() {
  const parsed = parse(DISCOVERY_DETAIL_PATH);
  const paragraphElements = jsxElements(parsed.ast).filter(
    (node) =>
      ts.isJsxElement(node) &&
      jsxName(node.openingElement) === "p",
  );
  const eyebrowMatches = paragraphElements.filter((element) =>
    element.children.some(
      (child) =>
        ts.isJsxText(child) &&
        child.getText(parsed.ast).trim() === "Discovered Candidate",
    ),
  );
  requireContract(
    eyebrowMatches.length === 1,
    "AUTH_STATIC_DISCOVERY_DETAIL_CONTRAST",
  );
  const eyebrowTokens = classTokens(eyebrowMatches[0].openingElement);
  requireContract(
    eyebrowTokens.has("text-cyan-700") &&
      !eyebrowTokens.has("text-cyan-600"),
    "AUTH_STATIC_DISCOVERY_DETAIL_CONTRAST",
  );

  const detailRow = namedFunction(parsed.ast, "DetailRow");
  const rowLabelMatches = jsxElements(detailRow).filter(
    (node) =>
      ts.isJsxElement(node) &&
      jsxName(node.openingElement) === "p" &&
      node.children.some(
        (child) =>
          ts.isJsxExpression(child) &&
          ts.isIdentifier(child.expression) &&
          child.expression.text === "label",
      ),
  );
  requireContract(
    rowLabelMatches.length === 1,
    "AUTH_STATIC_DISCOVERY_DETAIL_CONTRAST",
  );
  const rowLabelTokens = classTokens(rowLabelMatches[0].openingElement);
  requireContract(
    rowLabelTokens.has("text-slate-600") &&
      !rowLabelTokens.has("text-slate-400"),
    "AUTH_STATIC_DISCOVERY_DETAIL_CONTRAST",
  );
}

function verifyImmutableAuthBoundary() {
  const proxy = source("proxy.ts");
  const auth = source("lib/admin-auth.ts");
  const login = source("app/api/admin/login/route.ts");
  const session = source("app/api/admin/session/route.ts");
  const csrf = source("app/api/admin/csrf/route.ts");
  const logout = source("app/api/admin/logout/route.ts");
  requireContract(
    proxy.includes("hasActiveAdminSessionCookie") &&
      proxy.includes("ADMIN_SESSION_COOKIE_NAME") &&
      proxy.includes('loginUrl.pathname = "/admin-login"') &&
      auth.includes("verifyAdminCsrfRequest") &&
      auth.includes("verifyAdminSession") &&
      login.includes("signSession") &&
      login.includes("response.cookies.set(ADMIN_SESSION_COOKIE_NAME") &&
      session.includes("verifyAdminSession(request)") &&
      csrf.includes("isAuthorizedAdminRequest(request)") &&
      csrf.includes("createAdminCsrfToken()") &&
      csrf.includes("response.cookies.set(ADMIN_CSRF_COOKIE_NAME") &&
      logout.includes("verifyAdminSession(request)") &&
      logout.includes("response.cookies.set(ADMIN_SESSION_COOKIE_NAME") &&
      logout.includes("response.cookies.set(ADMIN_CSRF_COOKIE_NAME") &&
      (logout.match(/maxAge:\s*0/gu) ?? []).length === 2,
    "AUTH_STATIC_SESSION_CSRF_BOUNDARY",
  );
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function resolveImport(fromPath, specifier) {
  const base = specifier.startsWith("@/")
    ? absolute(specifier.slice(2))
    : path.resolve(path.dirname(absolute(fromPath)), specifier);
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
      const info = fs.lstatSync(candidate);
      if (info.isFile() && !info.isSymbolicLink()) {
        return path.relative(ROOT, candidate).split(path.sep).join("/");
      }
    } catch {
      // Continue through exact candidates.
    }
  }
  throw new ContractError("AUTH_STATIC_LOCAL_IMPORT_UNRESOLVED");
}

function localSpecifiers(repositoryPath) {
  if (repositoryPath.endsWith(".json")) return [];
  const { ast } = parse(repositoryPath);
  const output = [];
  const add = (specifier) => {
    if (
      specifier.startsWith("./") ||
      specifier.startsWith("../") ||
      specifier.startsWith("@/")
    ) {
      output.push(specifier);
    }
  };
  walk(ast, (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === "require") ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      add(node.arguments[0].text);
    }
  });
  return output;
}

function importGraph(entries) {
  const files = new Set();
  const declarations = [];
  const edges = new Set();
  const pending = [...entries];
  while (pending.length > 0) {
    const current = pending.pop();
    if (files.has(current)) continue;
    files.add(current);
    for (const specifier of localSpecifiers(current)) {
      const target = resolveImport(current, specifier);
      declarations.push(`${current}->${target}`);
      edges.add(`${current}->${target}`);
      if (!files.has(target)) pending.push(target);
    }
  }
  return { files, declarations, edges };
}

function walkFiles(directory, output) {
  const entries = fs
    .readdirSync(absolute(directory), { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const repositoryPath = `${directory}/${entry.name}`;
    const info = fs.lstatSync(absolute(repositoryPath));
    requireContract(!info.isSymbolicLink(), "AUTH_STATIC_SYMLINK");
    if (info.isDirectory()) walkFiles(repositoryPath, output);
    else if (info.isFile()) output.push(repositoryPath);
  }
}

function appSurfaceInventory() {
  const files = [];
  walkFiles("app", files);
  return sorted(
    files.filter((repositoryPath) => {
      const extension = path.extname(repositoryPath);
      return (
        [".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extension) &&
        APP_SURFACE_NAMES.has(path.basename(repositoryPath, extension))
      );
    }),
  );
}

function appSurfaceDigest() {
  const rows = appSurfaceInventory().map((repositoryPath) => {
    const bytes = fs.readFileSync(regular(repositoryPath, null));
    return `${repositoryPath}\0git:${gitBlob(bytes)}`;
  });
  return sha256(Buffer.from(rows.join("\n")));
}

function testingTreeDigest() {
  const files = [];
  walkFiles("testing", files);
  const rows = sorted(files)
    .filter((repositoryPath) => repositoryPath !== SAFETY_PATH)
    .map((repositoryPath) => {
      const file = identity(repositoryPath);
      return [
        repositoryPath,
        file.sha256,
        file.bytes,
        file.mode,
      ].join("\0");
    });
  return sha256(Buffer.from(rows.join("\n")));
}

function exactArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function isTerminalAssuranceBinding(value) {
  const expectedKeys = ["bytes", "lines", "mode", "result", "sha256"];
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    exactArray(sorted(Object.keys(value)), expectedKeys) &&
    value.result === TERMINAL_ASSURANCE_RESULT &&
    /^[0-9a-f]{64}$/u.test(value.sha256) &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes > 0 &&
    Number.isSafeInteger(value.lines) &&
    value.lines > 0 &&
    value.mode === "0600"
  );
}

function verifyGovernance() {
  const evidence = readJson(EVIDENCE_PATH);
  const plan = readJson(PLAN_PATH);
  const matrix = readJson(MATRIX_PATH);
  const registry = readJson(REGISTRY_PATH);
  const safety = readJson(SAFETY_PATH);

  requireContract(
    evidence.schema_version === 1 &&
      evidence.repository_baseline === BASELINE &&
      evidence.decisions.authenticated_browser_static_assurance ===
        "COMPLETE" &&
      evidence.decisions.authenticated_browser_production_runtime ===
        "NOT_EXECUTED" &&
      evidence.decisions.audit_log_get === "PURE_READ" &&
      evidence.decisions.audit_archival ===
        "EXPLICIT_SESSION_CSRF_POST_ONLY" &&
      evidence.decisions.discovery_detail_contrast ===
        "2_TARGETS_8_OF_8_PROFILE_CASES" &&
      evidence.decisions.public_launch_decision === "NO_GO" &&
      evidence.synthetic_assurance.authenticated_surface_profile_cases ===
        "72/72" &&
      evidence.synthetic_assurance.discovery_detail_contrast_cases ===
        "8/8" &&
      evidence.synthetic_assurance.discovery_detail_contrast_failures === 0 &&
      evidence.synthetic_assurance
        .audit_get_post_security_and_compensation_cases === "24/24" &&
      evidence.synthetic_assurance.preview_navigation_persistent_writes ===
        0 &&
      evidence.privacy.real_environment_reads === 0 &&
      evidence.privacy.real_supabase_calls === 0 &&
      evidence.privacy.sql_executions === 0 &&
      evidence.privacy.non_loopback_requests === 0,
    "AUTH_STATIC_EVIDENCE_DECISIONS",
  );
  requireContract(
    isTerminalAssuranceBinding(evidence.terminal_assurance_artifact) &&
      isTerminalAssuranceBinding(plan.terminal_assurance_artifact) &&
      exactArray(
        sorted(Object.keys(evidence.terminal_assurance_artifact)),
        sorted(Object.keys(plan.terminal_assurance_artifact)),
      ) &&
      Object.keys(evidence.terminal_assurance_artifact).every(
        (key) =>
          evidence.terminal_assurance_artifact[key] ===
          plan.terminal_assurance_artifact[key],
      ),
    "AUTH_STATIC_TERMINAL_ASSURANCE_BINDING",
  );
  requireContract(
    Array.isArray(evidence.closure.surfaces) &&
      evidence.closure.surfaces.length === 18 &&
      exactArray(
        sorted(evidence.closure.surfaces.map((entry) => entry.path)),
        sorted(AUTHENTICATED_SURFACES),
      ),
    "AUTH_STATIC_SURFACE_EVIDENCE",
  );
  for (const entry of evidence.closure.surfaces) {
    const current = identity(entry.path);
    requireContract(
      entry.starting_git_blob === STARTING_BLOBS[entry.path] &&
        entry.candidate_git_blob === current.git_blob &&
        entry.candidate_sha256 === current.sha256 &&
        entry.bytes === current.bytes &&
        entry.lines === current.lines &&
        entry.mode === current.mode,
      "AUTH_STATIC_SURFACE_IDENTITY",
    );
  }
  const pageGraph = importGraph(AUTHENTICATED_SURFACES);
  const closureGraph = importGraph([...AUTHENTICATED_SURFACES, ...CRITICAL_ROOTS]);
  requireContract(pageGraph.files.size >= 58, "AUTH_STATIC_PAGE_CLOSURE_FILES");
  requireContract(
    pageGraph.declarations.length >= 80,
    "AUTH_STATIC_PAGE_CLOSURE_DECLARATIONS",
  );
  requireContract(
    pageGraph.edges.size >= 77,
    "AUTH_STATIC_PAGE_CLOSURE_EDGES",
  );
  requireContract(
    closureGraph.files.size >= 66,
    "AUTH_STATIC_CRITICAL_CLOSURE_FILES",
  );
  requireContract(
    closureGraph.declarations.length >= 88,
    "AUTH_STATIC_CRITICAL_CLOSURE_DECLARATIONS",
  );
  requireContract(
    closureGraph.edges.size >= 85,
    "AUTH_STATIC_CRITICAL_CLOSURE_EDGES",
  );
  requireContract(
    evidence.closure.unresolved_local_imports === 0 &&
      evidence.closure.shared_admin_client_direct_surfaces === 11,
    "AUTH_STATIC_RECURSIVE_CLOSURE_EVIDENCE",
  );

  const evidenceIdentity = identity(EVIDENCE_PATH);
  requireContract(
    plan.planning_version === 1 &&
      plan.source_commit === BASELINE &&
      plan.workstream.id === "AUTHENTICATED_BROWSER_RUNTIME" &&
      plan.workstream.entry_count === 18 &&
      plan.workstream.gap_code ===
        "AUTHENTICATED_BROWSER_EVIDENCE_REQUIRED" &&
      plan.decision ===
        "AUTHENTICATED_BROWSER_STATIC_ASSURANCE_READY_FOR_RUNTIME" &&
      plan.current_authority === "STATIC_AND_SYNTHETIC_ONLY" &&
      plan.execution_authorized === false &&
      plan.real_secret_access_authorized === false &&
      plan.authenticated_production_runtime_authorized === false &&
      plan.runtime_evidence.sha256 === evidenceIdentity.sha256 &&
      plan.runtime_evidence.git_blob === evidenceIdentity.git_blob &&
      plan.runtime_evidence.bytes === evidenceIdentity.bytes &&
      plan.runtime_evidence.lines === evidenceIdentity.lines &&
      plan.runtime_evidence.mode === evidenceIdentity.mode,
    "AUTH_STATIC_PLANNING",
  );

  const browserEntries = matrix.entries.filter((entry) =>
    AUTHENTICATED_SURFACES.includes(entry.path),
  );
  const auditEntry = matrix.entries.find((entry) => entry.path === AUDIT_PATH);
  const otherAuthenticatedRoutes = matrix.entries.filter(
    (entry) =>
      entry.public_or_admin === "ADMIN" &&
      entry.surface_kind === "route" &&
      entry.path !== AUDIT_PATH,
  );
  requireContract(
    matrix.entries.length === 69 &&
      matrix.route_inventory_digest === appSurfaceDigest() &&
      browserEntries.length === 18 &&
      browserEntries.every(
        (entry) =>
          entry.coverage_state === "PARTIAL_STATIC" &&
          entry.launch_blocking === true &&
          exactArray(
            entry.static_evidence_paths,
            AUTHENTICATED_STATIC_EVIDENCE_PATHS,
          ),
      ) &&
      auditEntry?.coverage_state === "PARTIAL_STATIC" &&
      auditEntry.launch_blocking === true &&
      exactArray(
        auditEntry.static_evidence_paths,
        AUTHENTICATED_STATIC_EVIDENCE_PATHS,
      ) &&
      otherAuthenticatedRoutes.length === 27 &&
      otherAuthenticatedRoutes.every(
        (entry) =>
          entry.coverage_state === "NO_STATIC_EVIDENCE" &&
          entry.static_evidence_paths.length === 0,
      ) &&
      matrix.entries.filter(
        (entry) => entry.coverage_state === "PARTIAL_STATIC",
      ).length === 19 &&
      matrix.entries.filter((entry) => entry.launch_blocking).length === 46 &&
      matrix.entries.filter((entry) => !entry.launch_blocking).length === 23,
    "AUTH_STATIC_MATRIX",
  );

  const browserWorkstream = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_BROWSER_RUNTIME",
  );
  const routeWorkstream = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
  );
  requireContract(
    registry.source_commit === BASELINE &&
      registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      registry.current_authority === "STATIC_ONLY" &&
      registry.execution_authorized === false &&
      registry.planning_artifacts.length === 4 &&
      registry.planning_artifacts[3].path === PLAN_PATH &&
      browserWorkstream.state ===
        "STATIC_EVIDENCE_COMPLETE_RUNTIME_REQUIRED" &&
      browserWorkstream.next_gate ===
        "SEPARATE_RUNTIME_REVIEW_AUTHENTICATED_BROWSER_RUNTIME" &&
      routeWorkstream.entry_count === 28 &&
      routeWorkstream.partial_static_count === 1,
    "AUTH_STATIC_REGISTRY",
  );

  const selfEntry = safety.entries.find((entry) => entry.path === SELF_PATH);
  const evidenceEntry = safety.entries.find(
    (entry) => entry.path === EVIDENCE_PATH,
  );
  const planEntry = safety.entries.find((entry) => entry.path === PLAN_PATH);
  requireContract(
    safety.entries.length === 106 &&
      safety.entries.filter((entry) => entry.ci_disposition === "RUN_CORE")
        .length === 5 &&
      safety.entries.filter((entry) => entry.ci_disposition === "RUN_POLICY")
        .length === 6 &&
      safety.entries.filter(
        (entry) => entry.ci_disposition === "VALIDATE_ONLY",
      ).length === 17 &&
      safety.entries.filter((entry) => entry.ci_disposition === "DENY")
        .length === 78 &&
      selfEntry?.role === "EXECUTABLE" &&
      selfEntry.safety_class === "SAFE_STATIC_CORE" &&
      selfEntry.ci_disposition === "RUN_CORE" &&
      exactArray(selfEntry.command_argv, ["node", SELF_PATH]) &&
      evidenceEntry?.role === "CONFIG" &&
      evidenceEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      evidenceEntry.ci_disposition === "VALIDATE_ONLY" &&
      planEntry?.role === "CONFIG" &&
      planEntry.safety_class === "STATIC_FIXTURE" &&
      planEntry.ci_disposition === "VALIDATE_ONLY" &&
      safety.testing_tree_digest === testingTreeDigest(),
    "AUTH_STATIC_SAFETY_MANIFEST",
  );
}

const checks = [
  verifyStandaloneLogin,
  verifyPreview,
  verifySharedClient,
  verifyAuditRoute,
  verifyDiscoverySelectAccessibility,
  verifySourceCandidateIdentities,
  verifyDiscoveryDetailContrast,
  verifyImmutableAuthBoundary,
  verifyGovernance,
];
const failures = [];
for (const check of checks) {
  try {
    check();
  } catch (caught) {
    failures.push(
      caught instanceof ContractError
        ? caught.stage
        : "AUTH_STATIC_INTERNAL_ASSERTION",
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.log(failure);
  console.log(
    `FAIL_AUTHENTICATED_BROWSER_SECURITY_STATIC groups=${checks.length} pass=${
      checks.length - failures.length
    } fail=${failures.length} internal_failures=0`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_AUTHENTICATED_BROWSER_SECURITY_STATIC groups=${checks.length} pass=${checks.length} fail=0 internal_failures=0 surfaces=18 closure_files=66 source_paths=8 discovery_selects=5 discovery_detail=2_TARGETS_8_OF_8_PROFILES terminal_assurance=BOUND audit_get=PURE_READ archive_post=SESSION_CSRF_EXPLICIT`,
  );
}
