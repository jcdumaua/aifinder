import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(".");
const SELF_PATH =
  "testing/authenticated-browser-security-static-assertions.mjs";
const EVIDENCE_PATH = "testing/authenticated-browser-static-evidence.json";
const AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH =
  "testing/authenticated-browser-runtime-evidence.json";
const PLAN_PATH = "testing/authenticated-browser-planning-manifest.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const SAFETY_PATH = "testing/static-test-safety-manifest.json";
const LOGIN_PATH = "app/admin-login/page.tsx";
const PREVIEW_PATH = "app/admin/homepage-control/[id]/preview/page.tsx";
const SHARED_PATH = "components/admin/admin-dashboard-client.tsx";
const AUDIT_PATH = "app/api/admin/audit-logs/route.ts";
const AUDIT_HANDLER_PATH = "app/api/admin/audit-logs/handler.ts";
const DISCOVERY_SOURCES_PATH =
  "components/admin/discovery/discovery-sources-panel.tsx";
const DISCOVERY_RUNS_PATH =
  "components/admin/discovery/discovery-runs-table.tsx";
const DISCOVERY_QUEUE_PATH =
  "components/admin/discovery/discovery-queue-table.tsx";
const DISCOVERY_DETAIL_PATH =
  "components/admin/discovery/discovery-tool-detail.tsx";
const BASELINE = "3a43f8c9b01997487e20725ddcb38a4b7ce19676";
const INTEGRATION_BASELINE =
  "2570765ca0e769888286e42456d2f27d831f46df";
const INTEGRATION_TREE = "2503e7cf964a4e5bc3f6121aa04dfc5f2e3128e1";
const HISTORICAL_ROUTE_INVENTORY_DIGEST =
  "fa4f5aec336d66511f3811864961894a4132611a79c769bfb0635feca39139ed";
const TERMINAL_ASSURANCE_RESULT =
  "PASS_TERMINAL_AUTHENTICATED_BROWSER_ASSURANCE";
const EXPECTED_SOURCE_SHA256 = Object.freeze({
  [SHARED_PATH]:
    "e94b4eda5a36f05084b6171ed95634c3e04b3da9c21abb3b186491421bfc3ab2",
  [DISCOVERY_QUEUE_PATH]:
    "dc199c25aa6527bb473ac15080d2cee956185f4fe33f412251b8aebbac856429",
  [DISCOVERY_DETAIL_PATH]:
    "ab72c573a7cdef9b0ee245e75be2c3052b3836f0676f9c1b776f1ba46c6ccccd",
});
const AUTHENTICATED_STATIC_EVIDENCE_PATHS = Object.freeze([
  SELF_PATH,
  EVIDENCE_PATH,
]);
const AUTHENTICATED_INTEGRATED_EVIDENCE_PATHS = Object.freeze([
  SELF_PATH,
  EVIDENCE_PATH,
  AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
]);
const RUNTIME_EVIDENCE_TOP_LEVEL_KEYS = Object.freeze([
  "schema_version",
  "source_phase",
  "source_reporting_notes",
  "source_ccr",
  "predecessor_chain",
  "canonical_result",
  "authorization_session",
  "immutable_binding",
  "exact_surface_contract",
  "credential_session_contract",
  "sentinel_recovery_contract",
  "route_qualification_contract",
  "network_read_only_contract",
  "accessibility_contract",
  "cleanup_privacy_contract",
  "source_artifacts",
  "safety_boundary",
  "integration_decision",
]);
const PLAN_TOP_LEVEL_KEYS = Object.freeze([
  "planning_version",
  "source_commit",
  "source_registry",
  "source_matrix",
  "workstream",
  "decision",
  "current_authority",
  "execution_authorized",
  "real_secret_access_authorized",
  "authenticated_production_runtime_authorized",
  "live_evidence_status",
  "last_runtime_result",
  "canonical_source_alignment",
  "target_origin",
  "static_evidence",
  "runtime_evidence",
  "scope",
  "blocked_capabilities",
  "terminal_assurance_artifact",
  "phase_finalization",
  "next_gate",
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
  const wrapper = parse(AUDIT_PATH);
  const parsed = parse(AUDIT_HANDLER_PATH);
  requireContract(
    wrapper.text.includes('import "server-only";') &&
      wrapper.text.includes("createAdminAuditLogsHandler") &&
      wrapper.text.includes("verifySession: verifyAdminSession") &&
      wrapper.text.includes("verifyCsrf: verifyAdminCsrfRequest") &&
      wrapper.text.includes("export const GET = handlers.GET") &&
      wrapper.text.includes("export const POST = handlers.POST"),
    "AUTH_STATIC_AUDIT_WRAPPER",
  );
  const getText = functionText(parsed, "GET");
  const postText = functionText(parsed, "POST");
  const archiveResultText = functionText(parsed, "archiveResultResponse");
  const archiveText = functionText(parsed, "archiveOverflowAuditLogs");
  const storageRollback = functionText(parsed, "removeArchiveObject");
  const metadataRollback = functionText(parsed, "deleteArchiveMetadata");
  requireContract(
    getText.includes(
      "requireSecurity(request, ADMIN_RATE_LIMIT_ACTIONS.auditLogsRead, false)",
    ) &&
      getText.includes('dependencies.client.from("admin_audit_logs")') &&
      getText.includes('dependencies.client.from("admin_audit_archives")') &&
      !getText.includes("archiveOverflowAuditLogs") &&
      !/\.(?:upload|insert|update|upsert|delete|remove|rpc)\s*\(/u.test(getText),
    "AUDIT_LOG_GET_PURE_READ",
  );
  const sessionIndex = postText.indexOf("requireSecurity(request");
  const csrfIndex = postText.indexOf(
    "ADMIN_RATE_LIMIT_ACTIONS.auditLogsArchive, true",
  );
  const archiveIndex = postText.indexOf("archiveOverflowAuditLogs()");
  requireContract(
    sessionIndex >= 0 &&
      csrfIndex > sessionIndex &&
      archiveIndex > csrfIndex &&
      archiveResultText.includes("ARCHIVE_NOT_REQUIRED") &&
      archiveResultText.includes("ARCHIVE_COMPLETED") &&
      archiveResultText.includes("ARCHIVE_FAILED") &&
      archiveResultText.includes("archived_count: result.archivedCount") &&
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
      archiveText.includes("if (metadataError)") &&
      archiveText.includes("await removeArchiveObject(storagePath)") &&
      archiveText.includes("if (deleteError)") &&
      archiveText.includes("await deleteArchiveMetadata(storagePath)") &&
      archiveText.lastIndexOf("await removeArchiveObject(storagePath)") >
        archiveText.indexOf("if (deleteError)") &&
      storageRollback.includes(".remove([storagePath])") &&
      storageRollback.includes(
        "audit_logs_archive_compensation_failed",
      ) &&
      metadataRollback.includes('.from("admin_audit_archives")') &&
      metadataRollback.includes(".delete()") &&
      metadataRollback.includes('.eq("storage_path", storagePath)') &&
      metadataRollback.includes(
        "audit_logs_archive_compensation_failed",
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
  const logoutHandler = source("app/api/admin/logout/handler.ts");
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
      csrf.includes("getOrCreateAdminCsrfToken(request)") &&
      csrf.includes("response.cookies.set(ADMIN_CSRF_COOKIE_NAME") &&
      logout.includes("createLogoutHandler") &&
      logout.includes("verifySession: verifyAdminSession") &&
      logout.includes("verifyCsrf: verifyAdminCsrfRequest") &&
      logout.includes("response.cookies.set(ADMIN_SESSION_COOKIE_NAME") &&
      logout.includes("response.cookies.set(ADMIN_CSRF_COOKIE_NAME") &&
      (logout.match(/maxAge:\s*0/gu) ?? []).length === 2 &&
      logoutHandler.includes("dependencies.verifySession(request)") &&
      logoutHandler.includes("dependencies.verifyCsrf(request)") &&
      logoutHandler.indexOf("await dependencies.writeAudit") <
        logoutHandler.indexOf("dependencies.clearAdminCookies(response)"),
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
        independentCanonicalRegularFileMode(Number.parseInt(file.mode, 8)),
      ].join("\0");
    });
  return sha256(Buffer.from(rows.join("\n")));
}

const PORTABLE_TESTING_TREE_SELF_TEST_ARGUMENT =
  "--self-test-portable-testing-tree-digest";

function portableTestingTreeArgumentMode(arguments_) {
  if (arguments_.length === 0) return "HISTORICAL";
  if (
    arguments_.length === 1 &&
    arguments_[0] === PORTABLE_TESTING_TREE_SELF_TEST_ARGUMENT
  ) {
    return "SELF_TEST";
  }
  return "REJECT";
}

function independentCanonicalRegularFileMode(mode) {
  return (mode & 0o111) !== 0 ? "0755" : "0644";
}

function independentTestingTreeIdentity({ repositoryPath, bytes, byteCount, mode }) {
  return sha256(
    Buffer.from(
      [
        repositoryPath,
        sha256(bytes),
        byteCount,
        independentCanonicalRegularFileMode(mode),
      ].join("\0"),
    ),
  );
}

function runPortableTestingTreeDigestSelfTest() {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "aifinder-auth-portable-tree-test-"),
  );
  fs.chmodSync(fixtureRoot, 0o700);
  const fixturePath = path.join(fixtureRoot, "fixture.mjs");
  const repositoryPath = "testing/portable-auth-fixture.mjs";
  const initialBytes = Buffer.from("portable-auth-testing-tree-v1\n");
  const changedBytes = Buffer.from("portable-auth-testing-tree-v2\n");
  let result;
  try {
    fs.writeFileSync(fixturePath, initialBytes, { mode: 0o600 });
    const identities = {};
    for (const mode of [0o600, 0o644, 0o664, 0o755]) {
      fs.chmodSync(fixturePath, mode);
      const info = fs.lstatSync(fixturePath);
      requireContract(
        info.isFile() && !info.isSymbolicLink(),
        "AUTH_PORTABLE_TESTING_TREE_FIXTURE_IDENTITY",
      );
      const bytes = fs.readFileSync(fixturePath);
      identities[mode.toString(8).padStart(4, "0")] =
        independentTestingTreeIdentity({
          repositoryPath,
          bytes,
          byteCount: bytes.length,
          mode: info.mode,
        });
    }
    fs.chmodSync(fixturePath, 0o644);
    fs.writeFileSync(fixturePath, changedBytes);
    const changedInfo = fs.lstatSync(fixturePath);
    const changedContentIdentity = independentTestingTreeIdentity({
      repositoryPath,
      bytes: fs.readFileSync(fixturePath),
      byteCount: changedBytes.length,
      mode: changedInfo.mode,
    });
    const baseIdentity = independentTestingTreeIdentity({
      repositoryPath,
      bytes: initialBytes,
      byteCount: initialBytes.length,
      mode: 0o644,
    });
    result = {
      schema_version: 1,
      result: "PASS_AUTH_PORTABLE_TESTING_TREE_DIGEST_SELF_TEST_V1",
      reference_identity_sha256: baseIdentity,
      non_executable_mode_equivalence:
        identities["0600"] === identities["0644"] &&
        identities["0644"] === identities["0664"],
      executable_distinction: identities["0644"] !== identities["0755"],
      content_mutation_changes_identity: baseIdentity !== changedContentIdentity,
      path_mutation_changes_identity:
        baseIdentity !==
        independentTestingTreeIdentity({
          repositoryPath: "testing/portable-auth-fixture-renamed.mjs",
          bytes: initialBytes,
          byteCount: initialBytes.length,
          mode: 0o644,
        }),
      byte_count_mutation_changes_identity:
        baseIdentity !==
        independentTestingTreeIdentity({
          repositoryPath,
          bytes: initialBytes,
          byteCount: initialBytes.length + 1,
          mode: 0o644,
        }),
      clean_checkout_equals_shadow_0600:
        identities["0644"] === identities["0600"],
      unknown_arguments_reject:
        portableTestingTreeArgumentMode(["--unknown"]) === "REJECT" &&
        portableTestingTreeArgumentMode([
          PORTABLE_TESTING_TREE_SELF_TEST_ARGUMENT,
          "extra",
        ]) === "REJECT",
    };
    requireContract(
      Object.entries(result)
        .filter(
          ([key]) =>
            ![
              "schema_version",
              "result",
              "reference_identity_sha256",
            ].includes(key),
        )
        .every(([, value]) => value === true),
      "AUTH_PORTABLE_TESTING_TREE_SELF_TEST",
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
  requireContract(
    !fs.existsSync(fixtureRoot),
    "AUTH_PORTABLE_TESTING_TREE_FIXTURE_CLEANUP",
  );
  return { ...result, fixture_cleanup: true };
}

function exactArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function exactKeys(actual, expected) {
  return (
    actual !== null &&
    typeof actual === "object" &&
    !Array.isArray(actual) &&
    exactArray(Object.keys(actual), expected)
  );
}

function hasForbiddenRuntimeField(value) {
  const forbidden = new Set([
    "password",
    "passwordvalue",
    "passwordlengthvalue",
    "loginrequestbody",
    "requestbodyvalue",
    "cookie",
    "cookievalue",
    "session",
    "sessionvalue",
    "csrf",
    "csrfvalue",
    "secret",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorizationheader",
    "storageStateValue".toLowerCase(),
    "rawpagecontent",
    "rawresponsebody",
    "operationalheadervalue",
    "productiondynamicidentifier",
    "productionrecord",
    "urlquery",
  ]);
  if (Array.isArray(value)) return value.some(hasForbiddenRuntimeField);
  if (value === null || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, child]) =>
      forbidden.has(key.toLowerCase().replace(/[^a-z0-9]/gu, "")) ||
      hasForbiddenRuntimeField(child),
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
  const runtimeEvidence = readJson(AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH);
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

  const expectedRuntimeResult =
    "PASSED_PHASE_32BA_32BZ_OPERATOR_CONTROLLED_EXACT_18_SURFACE_AUTHENTICATED_BROWSER_PRODUCTION_RUNTIME_REQUALIFICATION_READY_FOR_STATIC_EVIDENCE_INTEGRATION";
  requireContract(
    exactKeys(runtimeEvidence, RUNTIME_EVIDENCE_TOP_LEVEL_KEYS) &&
      runtimeEvidence.schema_version === 1 &&
      runtimeEvidence.source_phase ===
        "PHASE_32BA_32BZ_OPERATOR_CONTROLLED_DEDICATED_HEADED_BROWSER_VALID_UUID_SENTINEL_RECOVERY_EXACT_18_SURFACE_AUTHENTICATED_PRODUCTION_RUNTIME_REQUALIFICATION" &&
      runtimeEvidence.canonical_result === expectedRuntimeResult &&
      runtimeEvidence.source_ccr.sha256 ===
        "2b52db3ef22eff3923ec7c4ba81b1336dac6063fd3c7e97242b59020ed11468b" &&
      runtimeEvidence.source_ccr.name === "CCR-REPORT.md" &&
      runtimeEvidence.source_ccr.bytes === 50749 &&
      runtimeEvidence.source_ccr.lines === 1762 &&
      runtimeEvidence.source_ccr.mode === "0600" &&
      runtimeEvidence.source_ccr.opening_marker_count === 1 &&
      runtimeEvidence.source_ccr.closing_marker_count === 1 &&
      runtimeEvidence.authorization_session.source_authorization_state ===
        "CLOSED_SUCCESS_SPENT_NON_REUSABLE" &&
      runtimeEvidence.authorization_session.operator_credential_entry ===
        "HUMAN_BROWSER_ONLY" &&
      runtimeEvidence.authorization_session.ephemeral_session_only === true &&
      runtimeEvidence.authorization_session.execution_authorized_by_this_manifest ===
        false,
    "AUTH_RUNTIME_SOURCE_AND_AUTHORIZATION",
  );
  requireContract(
    exactKeys(runtimeEvidence.source_reporting_notes, [
      "directly_observed_browser_network_outcomes",
      "source_bound_read_only_and_zero_write_inference",
      "human_only_credential_entry",
      "ephemeral_authenticated_session_use",
      "direct_codex_data_operations",
      "persistent_database_storage_mutation",
    ]) &&
      exactKeys(runtimeEvidence.source_ccr, [
        "name",
        "sha256",
        "bytes",
        "lines",
        "mode",
        "opening_marker_count",
        "closing_marker_count",
      ]) &&
      exactKeys(runtimeEvidence.predecessor_chain, [
        "static_assurance_commit",
        "runtime_source_commit",
        "runtime_source_tree",
        "planning_manifest_preintegration_git_blob",
      ]) &&
      exactKeys(runtimeEvidence.authorization_session, [
        "source_authorization_state",
        "operator_credential_entry",
        "ephemeral_session_only",
        "execution_authorized_by_this_manifest",
      ]) &&
      exactKeys(runtimeEvidence.immutable_binding, [
        "repository_commit",
        "repository_tree",
        "repository_subject",
        "github_run_id",
        "vercel_deployment_id",
        "canonical_origin",
        "static_evidence",
      ]) &&
      exactKeys(runtimeEvidence.immutable_binding.static_evidence, [
        "path",
        "sha256",
        "git_blob",
        "bytes",
        "lines",
        "mode",
      ]),
    "AUTH_RUNTIME_SOURCE_SCHEMA",
  );
  requireContract(
    exactKeys(runtimeEvidence.exact_surface_contract, [
      "surface_count",
      "profiles",
      "source_profile_cases",
      "surfaces",
    ]) &&
      Array.isArray(runtimeEvidence.exact_surface_contract.surfaces) &&
      runtimeEvidence.exact_surface_contract.surfaces.every((entry) =>
        exactKeys(entry, [
          "path",
          "git_blob",
          "sha256",
          "bytes",
          "lines",
          "mode",
          "surface_role",
          "route_id",
          "source_profile_count",
          "desktop_disposition",
          "mobile_disposition",
          "runtime_result",
        ]),
      ) &&
      exactKeys(runtimeEvidence.credential_session_contract, [
        "browser_only_credential_entry",
        "ready_signal_received",
        "submissions",
        "successful_submissions",
        "invalid_credential_responses",
        "session_verified",
        "password_observed",
        "request_post_data_reads",
        "cookie_reads",
        "storage_state_exports",
        "clipboard_reads_writes",
        "retained_sensitive_artifacts",
      ]) &&
      exactKeys(runtimeEvidence.sentinel_recovery_contract, [
        "old_sentinel",
        "old_sentinel_valid_uuid",
        "replacement_sentinel",
        "replacement_sentinel_valid_uuid",
        "discovery_route_blob",
        "diagnosis",
        "valid_sentinel_400_count",
        "failure_route",
        "failure_profile",
      ]) &&
      exactKeys(runtimeEvidence.route_qualification_contract, [
        "source_profile_cases",
        "login_layout_page",
        "admin_layout",
        "protected_pages",
        "route_profile_record_count",
        "desktop_route_records",
        "mobile_route_records",
        "source_case_sum",
        "route_profile_records",
      ]),
    "AUTH_RUNTIME_QUALIFICATION_SCHEMA",
  );
  requireContract(
    exactKeys(runtimeEvidence.network_read_only_contract, [
      "allowed_same_origin_get_head",
      "allowed_login_posts",
      "post_login_mutation_methods",
      "external_origin_attempts",
      "same_origin_5xx",
      "authenticated_401_or_403",
      "downloads",
      "popups",
      "direct_supabase_operations",
      "direct_sql_operations",
      "direct_database_operations",
      "direct_storage_operations",
      "persistent_database_writes_directly_observed",
      "persistent_storage_writes_directly_observed",
      "conclusion_basis",
    ]) &&
      exactKeys(runtimeEvidence.accessibility_contract, [
        "critical",
        "serious",
        "moderate",
        "minor",
        "unknown",
        "horizontal_overflow",
        "unknown_console_errors",
        "page_errors",
        "unknown_request_failures",
      ]) &&
      exactKeys(runtimeEvidence.cleanup_privacy_contract, [
        "page_closed",
        "context_closed",
        "browser_closed",
        "temporary_profile_absent",
        "password_retained",
        "password_length_retained",
        "request_body_retained",
        "cookie_retained",
        "session_retained",
        "csrf_retained",
        "storage_state_retained",
        "screenshots",
        "video",
        "trace",
        "har",
        "page_record_text",
        "dynamic_production_identifiers",
        "raw_urls_or_queries",
        "raw_headers",
        "repository_writes",
        "stages",
        "commits",
        "pushes",
      ]) &&
      exactKeys(runtimeEvidence.source_artifacts, [
        "artifact_count",
        "artifacts",
        "script",
        "helper",
      ]) &&
      Array.isArray(runtimeEvidence.source_artifacts.artifacts) &&
      runtimeEvidence.source_artifacts.artifacts.every((entry) =>
        exactKeys(entry, ["name", "sha256", "bytes", "lines", "mode"]),
      ) &&
      exactKeys(runtimeEvidence.source_artifacts.script, [
        "name",
        "sha256",
        "bytes",
        "lines",
        "mode",
      ]) &&
      exactKeys(runtimeEvidence.source_artifacts.helper, [
        "name",
        "sha256",
        "bytes",
        "lines",
        "mode",
      ]) &&
      exactKeys(runtimeEvidence.safety_boundary, [
        "evidence_is_static_only",
        "runtime_authority_granted",
        "authenticated_live_route_authority_granted",
        "database_storage_mutation_directly_observed",
        "raw_sensitive_or_production_values_retained",
        "prohibited_operations",
      ]) &&
      exactKeys(runtimeEvidence.integration_decision, [
        "AUTHENTICATED_BROWSER_RUNTIME_WORKSTREAM",
        "STATIC_EVIDENCE_INTEGRATION_RECOMMENDATION",
        "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
        "PUBLIC_LAUNCH_DECISION",
      ]),
    "AUTH_RUNTIME_BOUNDARY_SCHEMA",
  );
  requireContract(
    runtimeEvidence.source_reporting_notes
      .directly_observed_browser_network_outcomes === true &&
      runtimeEvidence.source_reporting_notes
        .source_bound_read_only_and_zero_write_inference === true &&
      runtimeEvidence.source_reporting_notes.human_only_credential_entry ===
        true &&
      runtimeEvidence.source_reporting_notes
        .ephemeral_authenticated_session_use === true &&
      runtimeEvidence.source_reporting_notes.direct_codex_data_operations ===
        "ZERO_REPORTED_BY_SOURCE" &&
      runtimeEvidence.source_reporting_notes
        .persistent_database_storage_mutation ===
        "NOT_CLAIMED_AS_DIRECTLY_OBSERVED",
    "AUTH_RUNTIME_REPORTING_BOUNDARY",
  );
  const runtimeStaticBinding = runtimeEvidence.immutable_binding.static_evidence;
  requireContract(
    runtimeEvidence.predecessor_chain.static_assurance_commit === BASELINE &&
      runtimeEvidence.predecessor_chain.runtime_source_commit ===
        INTEGRATION_BASELINE &&
      runtimeEvidence.predecessor_chain.runtime_source_tree ===
        INTEGRATION_TREE &&
      runtimeEvidence.predecessor_chain
        .planning_manifest_preintegration_git_blob ===
        "f668e59f58b491972fd03103cc42530396048da5" &&
      runtimeEvidence.immutable_binding.repository_commit ===
        INTEGRATION_BASELINE &&
      runtimeEvidence.immutable_binding.repository_tree === INTEGRATION_TREE &&
      runtimeEvidence.immutable_binding.repository_subject ===
        "Prepare authenticated browser runtime assurance" &&
      runtimeEvidence.immutable_binding.github_run_id === 30591624630 &&
      runtimeEvidence.immutable_binding.vercel_deployment_id ===
        "dpl_8QaNxJeCecrJ9ixXG2UQj44RDcK4" &&
      runtimeEvidence.immutable_binding.canonical_origin ===
        "https://www.aifinder.to" &&
      runtimeStaticBinding.path === EVIDENCE_PATH &&
      runtimeStaticBinding.sha256 ===
        "4a2f319ed8418e695162f9a3a5316da31c15d9f13c467ea10b1881db1faaaa26" &&
      runtimeStaticBinding.git_blob ===
        "c31d798b1110bf9a75ed934cf433be990a6fe52c" &&
      runtimeStaticBinding.bytes === 18950 &&
      runtimeStaticBinding.lines === 456 &&
      runtimeStaticBinding.mode === "0644",
    "AUTH_RUNTIME_IMMUTABLE_BINDING",
  );

  const expectedSurfaceBindings = Object.freeze({
    "app/admin-login/layout.tsx": ["AUTHENTICATION_LAYOUT", "ADMIN_LOGIN_PAGE_AND_LAYOUT", "PASS_SESSION_VERIFIED"],
    "app/admin-login/page.tsx": ["AUTHENTICATION_PAGE", "ADMIN_LOGIN_PAGE_AND_LAYOUT", "PASS_SESSION_VERIFIED"],
    "app/admin/analytics/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_ANALYTICS", "PASS_2XX"],
    "app/admin/discovered-tools/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_DISCOVERED_TOOLS", "PASS_2XX"],
    "app/admin/discovery/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_DISCOVERY", "PASS_2XX"],
    "app/admin/discovery/tools/[id]/page.tsx": ["PROTECTED_ADMIN_DYNAMIC_PAGE", "ADMIN_DISCOVERY_TOOL_DETAIL_SENTINEL", "PASS_2XX"],
    "app/admin/discovery/tools/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_DISCOVERY_TOOLS", "PASS_2XX"],
    "app/admin/homepage-control/[id]/edit/page.tsx": ["PROTECTED_ADMIN_DYNAMIC_PAGE", "ADMIN_HOMEPAGE_CONTROL_EDIT_SENTINEL", "PASS_2XX"],
    "app/admin/homepage-control/[id]/page.tsx": ["PROTECTED_ADMIN_DYNAMIC_PAGE", "ADMIN_HOMEPAGE_CONTROL_DETAIL_SENTINEL", "PASS_2XX"],
    "app/admin/homepage-control/[id]/preview/page.tsx": ["PROTECTED_ADMIN_DYNAMIC_PAGE", "ADMIN_HOMEPAGE_CONTROL_PREVIEW_SENTINEL", "PASS_2XX"],
    "app/admin/homepage-control/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_HOMEPAGE_CONTROL", "PASS_2XX"],
    "app/admin/layout.tsx": ["PROTECTED_ADMIN_LAYOUT", "ADMIN_HOME", "PASS_2XX"],
    "app/admin/moderation/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_MODERATION", "PASS_2XX"],
    "app/admin/notifications/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_NOTIFICATIONS", "PASS_2XX"],
    "app/admin/page.tsx": ["PROTECTED_ADMIN_HOME_PAGE", "ADMIN_HOME", "PASS_2XX"],
    "app/admin/security/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_SECURITY", "PASS_2XX"],
    "app/admin/settings/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_SETTINGS", "PASS_2XX"],
    "app/admin/tools/page.tsx": ["PROTECTED_ADMIN_PAGE", "ADMIN_TOOLS", "PASS_2XX"],
  });
  const runtimeSurfaces = runtimeEvidence.exact_surface_contract.surfaces;
  requireContract(
    runtimeEvidence.exact_surface_contract.surface_count === 18 &&
      runtimeEvidence.exact_surface_contract.source_profile_cases ===
        "36/36" &&
      exactArray(runtimeEvidence.exact_surface_contract.profiles, [
        "DESKTOP",
        "MOBILE",
      ]) &&
      Array.isArray(runtimeSurfaces) &&
      runtimeSurfaces.length === 18 &&
      exactArray(
        runtimeSurfaces.map((entry) => entry.path),
        AUTHENTICATED_SURFACES,
      ),
    "AUTH_RUNTIME_SURFACE_SET",
  );
  for (const entry of runtimeSurfaces) {
    const current = identity(entry.path);
    const expected = expectedSurfaceBindings[entry.path];
    requireContract(
      expected !== undefined &&
        entry.git_blob === current.git_blob &&
        entry.sha256 === current.sha256 &&
        entry.bytes === current.bytes &&
        entry.lines === current.lines &&
        entry.mode === current.mode &&
        entry.source_profile_count === 2 &&
        entry.surface_role === expected[0] &&
        entry.route_id === expected[1] &&
        entry.desktop_disposition === expected[2] &&
        entry.mobile_disposition === expected[2] &&
        entry.runtime_result === "QUALIFIED",
      "AUTH_RUNTIME_SURFACE_IDENTITY",
    );
  }

  const session = runtimeEvidence.credential_session_contract;
  requireContract(
    session.browser_only_credential_entry === true &&
      session.ready_signal_received === true &&
      session.submissions === 1 &&
      session.successful_submissions === 1 &&
      session.invalid_credential_responses === 0 &&
      session.session_verified === true &&
      session.password_observed === false &&
      session.request_post_data_reads === 0 &&
      session.cookie_reads === 0 &&
      session.storage_state_exports === 0 &&
      session.clipboard_reads_writes === 0 &&
      session.retained_sensitive_artifacts === 0,
    "AUTH_RUNTIME_CREDENTIAL_SESSION",
  );
  const sentinel = runtimeEvidence.sentinel_recovery_contract;
  requireContract(
    sentinel.old_sentinel === "00000000-0000-0000-0000-000000000000" &&
      sentinel.old_sentinel_valid_uuid === false &&
      sentinel.replacement_sentinel ===
        "00000000-0000-4000-8000-000000000000" &&
      sentinel.replacement_sentinel_valid_uuid === true &&
      sentinel.discovery_route_blob ===
        "a6b290312b6bcefa84b2c0a0afabf03f0c4daa4b" &&
      sentinel.diagnosis ===
        "OLD_SENTINEL_INVALID_UUID_SOURCE_400_CLASSIFIED_UNKNOWN" &&
      sentinel.valid_sentinel_400_count === 0 &&
      sentinel.failure_route === null &&
      sentinel.failure_profile === null,
    "AUTH_RUNTIME_SENTINEL_RECOVERY",
  );

  const expectedRouteBindings = Object.freeze({
    ADMIN_LOGIN_PAGE_AND_LAYOUT: ["/admin-login", 2, "NOT_APPLICABLE", false],
    ADMIN_HOME: ["/admin", 2, "NOT_APPLICABLE", true],
    ADMIN_ANALYTICS: ["/admin/analytics", 1, "NOT_APPLICABLE", true],
    ADMIN_DISCOVERED_TOOLS: ["/admin/discovered-tools", 1, "NOT_APPLICABLE", true],
    ADMIN_DISCOVERY: ["/admin/discovery", 1, "NOT_APPLICABLE", true],
    ADMIN_DISCOVERY_TOOLS: ["/admin/discovery/tools", 1, "NOT_APPLICABLE", true],
    ADMIN_DISCOVERY_TOOL_DETAIL_SENTINEL: ["/admin/discovery/tools/00000000-0000-4000-8000-000000000000", 1, "SAFE_ABSENT_SENTINEL", true],
    ADMIN_HOMEPAGE_CONTROL: ["/admin/homepage-control", 1, "NOT_APPLICABLE", true],
    ADMIN_HOMEPAGE_CONTROL_DETAIL_SENTINEL: ["/admin/homepage-control/00000000-0000-4000-8000-000000000000", 1, "SAFE_ABSENT_SENTINEL", true],
    ADMIN_HOMEPAGE_CONTROL_EDIT_SENTINEL: ["/admin/homepage-control/00000000-0000-4000-8000-000000000000/edit", 1, "SAFE_ABSENT_SENTINEL", true],
    ADMIN_HOMEPAGE_CONTROL_PREVIEW_SENTINEL: ["/admin/homepage-control/00000000-0000-4000-8000-000000000000/preview", 1, "SAFE_ABSENT_SENTINEL", true],
    ADMIN_MODERATION: ["/admin/moderation", 1, "NOT_APPLICABLE", true],
    ADMIN_NOTIFICATIONS: ["/admin/notifications", 1, "NOT_APPLICABLE", true],
    ADMIN_SECURITY: ["/admin/security", 1, "NOT_APPLICABLE", true],
    ADMIN_SETTINGS: ["/admin/settings", 1, "NOT_APPLICABLE", true],
    ADMIN_TOOLS: ["/admin/tools", 1, "NOT_APPLICABLE", true],
  });
  const routeContract = runtimeEvidence.route_qualification_contract;
  const routeRecords = routeContract.route_profile_records;
  requireContract(
    routeContract.source_profile_cases === "36/36" &&
      routeContract.login_layout_page === "4/4" &&
      routeContract.admin_layout === "2/2" &&
      routeContract.protected_pages === "30/30" &&
      routeContract.route_profile_record_count === 32 &&
      routeContract.desktop_route_records === 16 &&
      routeContract.mobile_route_records === 16 &&
      routeContract.source_case_sum === 36 &&
      Array.isArray(routeRecords) &&
      routeRecords.length === 32 &&
      routeRecords.filter((entry) => entry.profile === "DESKTOP").length ===
        16 &&
      routeRecords.filter((entry) => entry.profile === "MOBILE").length ===
        16 &&
      routeRecords.reduce((sum, entry) => sum + entry.sourceCaseCount, 0) ===
        36 &&
      exactArray(
        sorted([...new Set(routeRecords.map((entry) => entry.routeId))]),
        sorted(Object.keys(expectedRouteBindings)),
      ) &&
      routeRecords.every(
        (entry) => {
          const expected = expectedRouteBindings[entry.routeId];
          const expectedRecordKeys = expected?.[3]
            ? [
                "routeId",
                "routeTemplate",
                "profile",
                "sourceCaseCount",
                "sentinelBranch",
                "metrics",
                "accessibility",
                "errorDeltas",
                "topLevelStatus",
                "statusCategory",
              ]
            : [
                "routeId",
                "routeTemplate",
                "profile",
                "sourceCaseCount",
                "sentinelBranch",
                "metrics",
                "accessibility",
                "errorDeltas",
              ];
          return (
            expected !== undefined &&
            exactKeys(entry, expectedRecordKeys) &&
            entry.routeTemplate === expected[0] &&
            entry.sourceCaseCount === expected[1] &&
            entry.sentinelBranch === expected[2] &&
            ["DESKTOP", "MOBILE"].includes(entry.profile) &&
            exactKeys(entry.metrics, [
              "readyState",
              "headingCount",
              "landmarkCount",
              "elementCount",
              "horizontalOverflow",
              "formCount",
              "fileInputCount",
            ]) &&
            exactKeys(entry.accessibility, [
              "critical",
              "serious",
              "moderate",
              "minor",
              "unknown",
              "ruleIds",
            ]) &&
            exactKeys(entry.errorDeltas, [
              "sentinelValidation400",
              "unknownConsoleErrors",
              "pageErrors",
              "unknownRequestFailures",
            ]) &&
            entry.metrics.readyState === "complete" &&
            entry.metrics.horizontalOverflow === false &&
            [
              entry.metrics.headingCount,
              entry.metrics.landmarkCount,
              entry.metrics.elementCount,
              entry.metrics.formCount,
              entry.metrics.fileInputCount,
            ].every(
              (value) => Number.isSafeInteger(value) && value >= 0,
            ) &&
            Array.isArray(entry.accessibility.ruleIds) &&
            entry.accessibility.ruleIds.length === 0 &&
            [
              entry.accessibility.critical,
              entry.accessibility.serious,
              entry.accessibility.moderate,
              entry.accessibility.minor,
              entry.accessibility.unknown,
            ].every(
              (value) => Number.isSafeInteger(value) && value === 0,
            ) &&
            Object.values(entry.errorDeltas).every(
              (value) => Number.isSafeInteger(value) && value === 0,
            ) &&
            (expected[3]
              ? entry.topLevelStatus === 200 && entry.statusCategory === "2XX"
              : true)
          );
        },
      ) &&
      Object.keys(expectedRouteBindings).every((routeId) => {
        const records = routeRecords.filter(
          (entry) => entry.routeId === routeId,
        );
        return (
          records.length === 2 &&
          exactArray(
            sorted(records.map((entry) => entry.profile)),
            ["DESKTOP", "MOBILE"],
          )
        );
      }),
    "AUTH_RUNTIME_ROUTE_QUALIFICATION",
  );

  const network = runtimeEvidence.network_read_only_contract;
  requireContract(
    network.allowed_same_origin_get_head === 1268 &&
      network.allowed_login_posts === 1 &&
      network.post_login_mutation_methods === 0 &&
      network.external_origin_attempts === 0 &&
      network.same_origin_5xx === 0 &&
      network.authenticated_401_or_403 === 0 &&
      network.downloads === 0 &&
      network.popups === 0 &&
      network.direct_supabase_operations === 0 &&
      network.direct_sql_operations === 0 &&
      network.direct_database_operations === 0 &&
      network.direct_storage_operations === 0 &&
      network.persistent_database_writes_directly_observed === false &&
      network.persistent_storage_writes_directly_observed === false &&
      network.conclusion_basis ===
        "SOURCE_BOUND_METHOD_GUARD_AND_OBSERVED_BROWSER_REQUEST_CATEGORIES_ONLY",
    "AUTH_RUNTIME_NETWORK_READ_ONLY",
  );
  requireContract(
    Object.values(runtimeEvidence.accessibility_contract).every(
      (value) => Number.isSafeInteger(value) && value === 0,
    ),
    "AUTH_RUNTIME_ACCESSIBILITY",
  );
  const cleanup = runtimeEvidence.cleanup_privacy_contract;
  requireContract(
      cleanup.page_closed === true &&
      cleanup.context_closed === true &&
      cleanup.browser_closed === true &&
      cleanup.temporary_profile_absent === true &&
      [
        cleanup.password_retained,
        cleanup.password_length_retained,
        cleanup.request_body_retained,
        cleanup.cookie_retained,
        cleanup.session_retained,
        cleanup.csrf_retained,
        cleanup.storage_state_retained,
        cleanup.screenshots,
        cleanup.video,
        cleanup.trace,
        cleanup.har,
        cleanup.page_record_text,
        cleanup.dynamic_production_identifiers,
        cleanup.raw_urls_or_queries,
        cleanup.raw_headers,
        cleanup.repository_writes,
        cleanup.stages,
        cleanup.commits,
        cleanup.pushes,
      ].every((value) => Number.isSafeInteger(value) && value === 0),
    "AUTH_RUNTIME_CLEANUP_PRIVACY",
  );

  const expectedArtifactIdentities = Object.freeze({
    "01-preflight-source-and-session-budget.md": ["2aceb6e80e42ae64de221331408a8ba370b904d3a4e3c0e6c3fdaa720145551a", 1066, 14, "0600"],
    "02-operator-controlled-login-and-session.json": ["da6ed7a6f99b6235d894d2f868f319a5ff3e39d30108837f2d33bb8fa59babe0", 782, 27, "0600"],
    "03-exact-18-surface-route-qualification.json": ["7188021543b1e33b23d5c14fb09625820257a38f641b501cacf51e7815bc28d5", 27158, 1042, "0600"],
    "04-network-accessibility-and-read-only-boundary.json": ["fc5c95c1fac1e5331c29c5ff2f22a78f20960dfd0e4200654fde51210e43c6f0", 1672, 53, "0600"],
    "05-browser-cleanup-and-sensitive-retention.json": ["00d0c30bbe4369e95529ae3303bdaba367ba9f76bcdcf3e5312361c234097294", 941, 38, "0600"],
    "06-repository-and-platform-preservation.json": ["c383b8704ac1fb8144e7e02acdb1bba8d7525dc274cf674104103d652368485b", 10242, 428, "0600"],
    "07-final-18-surface-static-integration-boundary.md": ["a705a67ba7ff53c4d0be8095d13ed64352b8c4c941abe294e2a107f7743302d9", 561, 8, "0600"],
    "08-risk-stop-and-next-action.md": ["335b31065b48aa07a061789f69c9824349e23a652763aa128f79a35602cf9d89", 606, 10, "0600"],
  });
  const expectedArtifactNames = Object.keys(expectedArtifactIdentities);
  requireContract(
    runtimeEvidence.source_artifacts.artifact_count === 8 &&
      runtimeEvidence.source_artifacts.artifacts.length === 8 &&
      exactArray(
        runtimeEvidence.source_artifacts.artifacts.map((entry) => entry.name),
        expectedArtifactNames,
      ) &&
      runtimeEvidence.source_artifacts.artifacts.every((entry) => {
        const expected = expectedArtifactIdentities[entry.name];
        return (
          expected &&
          entry.sha256 === expected[0] &&
          entry.bytes === expected[1] &&
          entry.lines === expected[2] &&
          entry.mode === expected[3]
        );
      }) &&
      runtimeEvidence.source_artifacts.script.name ===
        "aifinder-phase-32ba-32bz-operator-controlled-authenticated-browser-valid-sentinel-recovery.sh" &&
      runtimeEvidence.source_artifacts.script.sha256 ===
        "adba4a1425405554e9888a9e80aeec6db6eeba00371be99600c99ded9a66a631" &&
      runtimeEvidence.source_artifacts.script.bytes === 103444 &&
      runtimeEvidence.source_artifacts.script.lines === 157 &&
      runtimeEvidence.source_artifacts.script.mode === "0700" &&
      runtimeEvidence.source_artifacts.helper.name ===
        "support/phase32ba-runner.cjs" &&
      runtimeEvidence.source_artifacts.helper.sha256 ===
        "8b0fed433eeec06ff2fbb19c3b22d997e6baa22dbae1956f9cd1d93e7106f92c" &&
      runtimeEvidence.source_artifacts.helper.bytes === 73477 &&
      runtimeEvidence.source_artifacts.helper.lines === 1472 &&
      runtimeEvidence.source_artifacts.helper.mode === "0600",
    "AUTH_RUNTIME_SOURCE_ARTIFACTS",
  );
  requireContract(
    hasForbiddenRuntimeField(runtimeEvidence) === false &&
      runtimeEvidence.safety_boundary.evidence_is_static_only === true &&
      runtimeEvidence.safety_boundary.runtime_authority_granted === false &&
      runtimeEvidence.safety_boundary
        .authenticated_live_route_authority_granted === false &&
      runtimeEvidence.safety_boundary
        .database_storage_mutation_directly_observed === false &&
      runtimeEvidence.safety_boundary.raw_sensitive_or_production_values_retained ===
        false &&
      exactArray(runtimeEvidence.safety_boundary.prohibited_operations, [
        "AUTHENTICATED_RUNTIME",
        "DATABASE_OR_STORAGE",
        "DIRECT_VERCEL_WRITE",
        "PUBLIC_HTTP_OR_BROWSER",
        "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
        "SQL_OR_SUPABASE",
        "USER_VISIBLE_PERSISTENT_MUTATION",
      ]) &&
      runtimeEvidence.integration_decision
        .AUTHENTICATED_BROWSER_RUNTIME_WORKSTREAM === "EVIDENCE_COMPLETE" &&
      runtimeEvidence.integration_decision
        .STATIC_EVIDENCE_INTEGRATION_RECOMMENDATION === "GO" &&
      runtimeEvidence.integration_decision.AUTHENTICATED_LIVE_ROUTE_RUNTIME ===
        "STILL_BLOCKED" &&
      runtimeEvidence.integration_decision.PUBLIC_LAUNCH_DECISION ===
        "NO_GO_PENDING_AUTHENTICATED_LIVE_ROUTE_RUNTIME_AND_FINAL_LAUNCH_GATE",
    "AUTH_RUNTIME_DECISIONS",
  );

  const evidenceIdentity = identity(EVIDENCE_PATH);
  const runtimeEvidenceIdentity = identity(
    AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
  );
  const expectedBlockedCapabilities = [
    "AUTHENTICATED_PRODUCTION_RUNTIME",
    "DATABASE",
    "DEPLOYMENT_CONTROL",
    "DIRECT_VERCEL_WRITE",
    "MIGRATIONS_OR_GENERATED_TYPES",
    "OPERATIONAL_REACTIVATION",
    "PRODUCTION_BROWSER",
    "PUBLIC_HTTP",
    "PUBLIC_LAUNCH",
    "REAL_ENVIRONMENT_OR_SECRET_ACCESS",
    "REAL_FORM_OR_FILE_INTERACTION",
    "SQL",
    "SUPABASE",
    "USER_VISIBLE_PERSISTENT_MUTATION",
  ];
  requireContract(
    exactKeys(plan, PLAN_TOP_LEVEL_KEYS) &&
      exactKeys(plan.source_registry, [
        "path",
        "sha256",
        "git_blob",
        "bytes",
        "lines",
        "mode",
      ]) &&
      exactKeys(plan.source_matrix, [
        "path",
        "sha256",
        "git_blob",
        "bytes",
        "lines",
        "mode",
        "route_inventory_digest",
        "entry_count",
        "launch_blocking_count",
      ]) &&
      exactKeys(plan.workstream, ["id", "entry_count", "gap_code"]) &&
      exactKeys(plan.static_evidence, [
        "path",
        "sha256",
        "git_blob",
        "bytes",
        "lines",
        "mode",
        "authenticated_surface_profile_cases",
        "discovery_select_name_cases",
        "discovery_detail_contrast_cases",
        "audit_get_post_security_and_compensation_cases",
      ]) &&
      exactKeys(plan.runtime_evidence, [
        "path",
        "sha256",
        "git_blob",
        "bytes",
        "lines",
        "mode",
        "source_profile_cases",
        "route_profile_records",
        "authenticated_surface_count",
        "result",
      ]) &&
      exactKeys(plan.scope, [
        "repository_path_count",
        "authenticated_browser_surface_count",
        "route_profile_record_count",
        "authenticated_live_route_partial_static_count",
        "authenticated_live_route_no_static_count",
      ]) &&
      exactKeys(plan.phase_finalization, [
        "state",
        "execution_authorized",
        "authenticated_live_route_runtime",
        "public_launch",
      ]) &&
      plan.planning_version === 1 &&
      plan.source_commit === INTEGRATION_BASELINE &&
      plan.source_registry.git_blob ===
        "b4cab952aad85634f031a6b175f3c991911517e7" &&
      plan.source_registry.sha256 ===
        "8bb921814898abd40c9d3f4c38b4181446bd9f4bfc58cdf29f9909a6071668e6" &&
      plan.source_registry.path === REGISTRY_PATH &&
      plan.source_registry.bytes === 10542 &&
      plan.source_registry.lines === 291 &&
      plan.source_registry.mode === "0644" &&
      plan.source_matrix.git_blob ===
        "ac474c6470a805687b04875754e416b6fce502e3" &&
      plan.source_matrix.sha256 ===
        "0a467e1cacfdb4310c254357931b8cf3c5d976f52f486f9c0a3bb8c67048656e" &&
      plan.source_matrix.path === MATRIX_PATH &&
      plan.source_matrix.bytes === 41322 &&
      plan.source_matrix.lines === 1067 &&
      plan.source_matrix.mode === "0644" &&
      plan.source_matrix.route_inventory_digest ===
        HISTORICAL_ROUTE_INVENTORY_DIGEST &&
      plan.source_matrix.entry_count === 69 &&
      plan.source_matrix.launch_blocking_count === 46 &&
      plan.workstream.id === "AUTHENTICATED_BROWSER_RUNTIME" &&
      plan.workstream.entry_count === 18 &&
      plan.workstream.gap_code ===
        "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
      plan.decision ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_INTEGRATED" &&
      plan.current_authority === "STATIC_ONLY" &&
      plan.execution_authorized === false &&
      plan.real_secret_access_authorized === false &&
      plan.authenticated_production_runtime_authorized === false &&
      plan.live_evidence_status ===
        "PASSED_EXACT_18_SURFACE_AUTHENTICATED_BROWSER_PRODUCTION_RUNTIME_QUALIFICATION" &&
      plan.last_runtime_result === expectedRuntimeResult &&
      plan.canonical_source_alignment === "COMPLETE" &&
      plan.target_origin === "https://www.aifinder.to" &&
      plan.static_evidence.path === EVIDENCE_PATH &&
      plan.static_evidence.sha256 === evidenceIdentity.sha256 &&
      plan.static_evidence.git_blob === evidenceIdentity.git_blob &&
      plan.static_evidence.bytes === evidenceIdentity.bytes &&
      plan.static_evidence.lines === evidenceIdentity.lines &&
      plan.static_evidence.mode === evidenceIdentity.mode &&
      plan.static_evidence.authenticated_surface_profile_cases === "72/72" &&
      plan.static_evidence.discovery_select_name_cases === "20/20" &&
      plan.static_evidence.discovery_detail_contrast_cases === "8/8" &&
      plan.static_evidence.audit_get_post_security_and_compensation_cases ===
        "24/24" &&
      plan.runtime_evidence.path ===
        AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH &&
      plan.runtime_evidence.sha256 === runtimeEvidenceIdentity.sha256 &&
      plan.runtime_evidence.git_blob === runtimeEvidenceIdentity.git_blob &&
      plan.runtime_evidence.bytes === runtimeEvidenceIdentity.bytes &&
      plan.runtime_evidence.lines === runtimeEvidenceIdentity.lines &&
      plan.runtime_evidence.mode === runtimeEvidenceIdentity.mode &&
      plan.runtime_evidence.source_profile_cases === "36/36" &&
      plan.runtime_evidence.route_profile_records === 32 &&
      plan.runtime_evidence.authenticated_surface_count === 18 &&
      plan.runtime_evidence.result === expectedRuntimeResult &&
      plan.scope.repository_path_count === 8 &&
      plan.scope.authenticated_browser_surface_count === 18 &&
      plan.scope.route_profile_record_count === 32 &&
      plan.scope.authenticated_live_route_partial_static_count === 1 &&
      plan.scope.authenticated_live_route_no_static_count === 27 &&
      exactArray(plan.blocked_capabilities, expectedBlockedCapabilities) &&
      plan.phase_finalization.state ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_INTEGRATED" &&
      plan.phase_finalization.execution_authorized === false &&
      plan.phase_finalization.authenticated_live_route_runtime ===
        "BLOCKED_SEPARATE_AUTHORITY_REQUIRED" &&
      plan.phase_finalization.public_launch === "NO_GO" &&
      plan.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME",
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
          entry.coverage_state ===
            "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null &&
          exactArray(
            entry.static_evidence_paths,
            AUTHENTICATED_INTEGRATED_EVIDENCE_PATHS,
          ) &&
          exactArray(entry.future_evidence_paths, [
            "testing/accessibility-qa.spec.ts",
            "testing/responsive-qa.spec.ts",
          ]),
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
      ).length === 1 &&
      matrix.entries.filter(
        (entry) =>
          entry.coverage_state ===
          "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED",
      ).length === 18 &&
      matrix.entries.filter((entry) => entry.launch_blocking).length === 28 &&
      matrix.entries.filter((entry) => !entry.launch_blocking).length === 41,
    "AUTH_STATIC_MATRIX",
  );

  const browserWorkstream = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_BROWSER_RUNTIME",
  );
  const routeWorkstream = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_LIVE_ROUTE_RUNTIME",
  );
  requireContract(
    registry.source_commit === INTEGRATION_BASELINE &&
      registry.source_matrix.sha256 === identity(MATRIX_PATH).sha256 &&
      registry.source_matrix.git_blob === identity(MATRIX_PATH).git_blob &&
      registry.source_matrix.bytes === identity(MATRIX_PATH).bytes &&
      registry.source_matrix.lines === identity(MATRIX_PATH).lines &&
      registry.source_matrix.launch_blocking_count === 28 &&
      registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      registry.current_authority === "STATIC_ONLY" &&
      registry.execution_authorized === false &&
      registry.planning_artifacts.length === 4 &&
      registry.planning_artifacts[3].path === PLAN_PATH &&
      registry.planning_artifacts[3].state ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_INTEGRATED" &&
      browserWorkstream.gap_code ===
        "AUTHENTICATED_BROWSER_EVIDENCE_INTEGRATED" &&
      browserWorkstream.state === "EVIDENCE_COMPLETE_PENDING_NEXT_WORKSTREAM" &&
      browserWorkstream.next_gate ===
        "SEPARATE_PLANNING_REVIEW_AUTHENTICATED_LIVE_ROUTE_RUNTIME" &&
      browserWorkstream.entry_count === 18 &&
      routeWorkstream.entry_count === 28 &&
      routeWorkstream.partial_static_count === 1 &&
      routeWorkstream.gap_code ===
        "AUTHENTICATED_LIVE_ROUTE_EVIDENCE_REQUIRED" &&
      routeWorkstream.state === "BLOCKED_SEPARATE_AUTHORITY_REQUIRED",
    "AUTH_STATIC_REGISTRY",
  );

  const selfEntry = safety.entries.find((entry) => entry.path === SELF_PATH);
  const evidenceEntry = safety.entries.find(
    (entry) => entry.path === EVIDENCE_PATH,
  );
  const planEntry = safety.entries.find((entry) => entry.path === PLAN_PATH);
  const runtimeEvidenceEntry = safety.entries.find(
    (entry) => entry.path === AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE_PATH,
  );
  requireContract(
    safety.entries.length === 115 &&
      safety.entries.filter((entry) => entry.ci_disposition === "RUN_CORE")
        .length === 5 &&
      safety.entries.filter((entry) => entry.ci_disposition === "RUN_POLICY")
        .length === 6 &&
      safety.entries.filter(
        (entry) => entry.ci_disposition === "VALIDATE_ONLY",
      ).length === 18 &&
      safety.entries.filter((entry) => entry.ci_disposition === "DENY")
        .length === 86 &&
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
      runtimeEvidenceEntry?.role === "CONFIG" &&
      runtimeEvidenceEntry.safety_class === "SAFE_STATIC_SUPPORT" &&
      runtimeEvidenceEntry.ci_disposition === "VALIDATE_ONLY" &&
      runtimeEvidenceEntry.command_argv === null &&
      runtimeEvidenceEntry.reason_code ===
        "FINAL_AUTHENTICATED_BROWSER_RUNTIME_EVIDENCE" &&
      safety.testing_tree_digest === testingTreeDigest(),
    "AUTH_STATIC_SAFETY_MANIFEST",
  );
}

const portableTestingTreeArgumentModeResult = portableTestingTreeArgumentMode(
  process.argv.slice(2),
);

if (portableTestingTreeArgumentModeResult === "SELF_TEST") {
  console.log(JSON.stringify(runPortableTestingTreeDigestSelfTest()));
} else if (portableTestingTreeArgumentModeResult === "REJECT") {
  console.log("FAIL_AUTH_PORTABLE_TESTING_TREE_DIGEST_ARGUMENT_CONTRACT_V1");
  process.exitCode = 1;
} else {
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
}
