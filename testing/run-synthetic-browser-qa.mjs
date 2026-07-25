import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { startSyntheticSupabaseStub } from "./synthetic-supabase-stub.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const PLAYWRIGHT_CHROMIUM_EXECUTABLE = chromium.executablePath();
const MAX_OUTPUT_BYTES = 24 * 1024 * 1024;
const BUILD_TIMEOUT_MS = 240_000;
const BROWSER_TIMEOUT_MS = 240_000;
const START_TIMEOUT_MS = 45_000;
const MODES = new Set([
  "--preflight",
  "--expect-red",
  "--accessibility",
  "--responsive",
  "--all",
]);
const AUTHORIZED_CANDIDATE_PATHS = Object.freeze([
  ".github/workflows/static-readiness.yml",
  "README.md",
  "app/layout.tsx",
  "app/globals.css",
  "app/page.tsx",
  "components/tool-details-modal.tsx",
  "app/submit/page.tsx",
  "testing/accessibility-qa.spec.ts",
  "testing/responsive-qa.spec.ts",
  "testing/production-perimeter-static-assertions.mjs",
  "docs/accessibility-qa-framework.md",
  "docs/responsive-qa-framework.md",
  "package.json",
  "testing/static-test-safety-manifest.json",
  "testing/readiness-coverage-matrix.json",
  "docs/readiness-coverage-matrix.md",
  "docs/static-command-classification.md",
  "docs/static-test-safety-contract.md",
  "docs/static-ci-readiness-gate.md",
  "testing/static-readiness-workflow-static-assertions.mjs",
  "components/public/skip-link.tsx",
  "lib/use-dialog-focus.ts",
  "testing/browser-qa-fixtures.ts",
  "testing/synthetic-supabase-stub.mjs",
  "testing/run-synthetic-browser-qa.mjs",
  "playwright.synthetic.config.ts",
  "testing/accessibility-responsive-static-assertions.mjs",
  "docs/discovery-phase-30gd-30gp-accessibility-responsive-browser-qa-gate.md",
]);
const FROZEN_EXCLUSIONS = new Set([
  "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-wrapper-candidate.sh",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-generator-candidate.py",
  "scripts/_drafts/discovery-phase-27nm-27ol-one-use-authorization-record-schema.json",
]);
const PRESERVATION_PATHS = Object.freeze([
  ...AUTHORIZED_CANDIDATE_PATHS,
  "package-lock.json",
  "supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql",
  "supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql",
  ...FROZEN_EXCLUSIONS,
]);
const EXPECTED_RED_TITLES = new Set([
  "@phase30gd-red skip link is first focus and moves focus to the shared target",
  "@phase30gd-red search dialog owns focus and restores its opener",
  "@phase30gd-red nested tool details owns focus without closing search",
  "@phase30gd-red submit popup owns Escape and restores its opener",
]);
const EXPECTED_RED_CATEGORY_BY_TITLE = new Map([
  [
    "@phase30gd-red skip link is first focus and moves focus to the shared target",
    "SKIP_LINK_FIRST_FOCUS",
  ],
  [
    "@phase30gd-red search dialog owns focus and restores its opener",
    "SEARCH_INITIAL_FOCUS",
  ],
  [
    "@phase30gd-red nested tool details owns focus without closing search",
    "DETAILS_INITIAL_FOCUS",
  ],
  [
    "@phase30gd-red submit popup owns Escape and restores its opener",
    "SUBMIT_INITIAL_FOCUS",
  ],
]);

function fail(stage) {
  throw new Error(stage);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function outputIdentity(value) {
  return {
    sha256: sha256(value),
    bytes: Buffer.byteLength(value),
    lines: value.length === 0 ? 0 : value.split("\n").length - 1,
  };
}

function isEnvironmentPath(repositoryPath) {
  return repositoryPath
    .split("/")
    .some((segment) => segment === ".env" || segment.startsWith(".env."));
}

function gitOutput(args) {
  const result = spawnSync("git", args, {
    cwd: REPOSITORY_ROOT,
    encoding: "buffer",
    maxBuffer: MAX_OUTPUT_BYTES,
    env: {
      PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
      HOME: os.tmpdir(),
      TMPDIR: os.tmpdir(),
    },
  });

  if (result.status !== 0 || result.error) {
    fail("GIT_SNAPSHOT_FAILED");
  }

  return result.stdout;
}

function fileIdentity(repositoryPath) {
  const absolutePath = path.join(REPOSITORY_ROOT, repositoryPath);
  if (!fs.existsSync(absolutePath)) {
    return "ABSENT";
  }
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("PRESERVATION_PATH_NOT_REGULAR");
  }
  return `${stat.mode & 0o777}:${stat.size}:${sha256(fs.readFileSync(absolutePath))}`;
}

function snapshotRepository() {
  const status = gitOutput([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  const pathIdentities = PRESERVATION_PATHS.map(
    (repositoryPath) => `${repositoryPath}\0${fileIdentity(repositoryPath)}`,
  ).join("\0");
  return sha256(Buffer.concat([status, Buffer.from(pathIdentities)]));
}

function trackedCopyList() {
  const tracked = gitOutput(["ls-files", "-z"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const candidates = AUTHORIZED_CANDIDATE_PATHS.filter((repositoryPath) =>
    fs.existsSync(path.join(REPOSITORY_ROOT, repositoryPath)),
  );
  const copyList = [...new Set([...tracked, ...candidates])]
    .filter((repositoryPath) => !isEnvironmentPath(repositoryPath))
    .filter((repositoryPath) => !FROZEN_EXCLUSIONS.has(repositoryPath))
    .sort((left, right) => left.localeCompare(right));

  if (
    copyList.some(
      (repositoryPath) =>
        isEnvironmentPath(repositoryPath) ||
        repositoryPath === ".git" ||
        repositoryPath.startsWith(".git/") ||
        repositoryPath === "node_modules" ||
        repositoryPath.startsWith("node_modules/") ||
        repositoryPath === ".next" ||
        repositoryPath.startsWith(".next/") ||
        FROZEN_EXCLUSIONS.has(repositoryPath),
    )
  ) {
    fail("TEMP_COPY_EXCLUSION_FAILED");
  }

  return copyList;
}

function networkPreloadSource(workspacePath) {
  const readonlyNodeModules = path.join(REPOSITORY_ROOT, "node_modules");
  const workspaceNodeModules = path.join(workspacePath, "node_modules");

  return `
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const tls = require("node:tls");
const dns = require("node:dns");
const dgram = require("node:dgram");
const path = require("node:path");
const READ_ONLY_ROOTS = ${JSON.stringify([
    readonlyNodeModules,
    workspaceNodeModules,
  ])};
function deny() { throw new Error("NON_LOOPBACK_NETWORK_DENIED"); }
function normalizedHost(value) {
  return String(value || "127.0.0.1").replace(/^\\[/, "").replace(/\\]$/, "").toLowerCase();
}
function loopback(value) {
  const host = normalizedHost(value);
  return host === "localhost" || host === "::1" || host.startsWith("127.");
}
function requestHost(input, options) {
  if (typeof input === "string" || input instanceof URL) {
    try { return new URL(input).hostname; } catch { return "127.0.0.1"; }
  }
  const candidate = input && typeof input === "object" ? input : options;
  return candidate?.hostname || candidate?.host || "127.0.0.1";
}
function wrapRequest(original) {
  return function guardedRequest(input, options, callback) {
    if (!loopback(requestHost(input, options))) deny();
    return original.apply(this, arguments);
  };
}
http.request = wrapRequest(http.request);
http.get = wrapRequest(http.get);
https.request = wrapRequest(https.request);
https.get = wrapRequest(https.get);
function socketHost(args) {
  const first = args[0];
  if (first && typeof first === "object") return first.host || first.hostname || "127.0.0.1";
  return typeof args[1] === "string" ? args[1] : "127.0.0.1";
}
const originalNetConnect = net.connect;
net.connect = net.createConnection = function guardedNetConnect() {
  if (!loopback(socketHost(arguments))) deny();
  return originalNetConnect.apply(this, arguments);
};
const originalTlsConnect = tls.connect;
tls.connect = function guardedTlsConnect() {
  if (!loopback(socketHost(arguments))) deny();
  return originalTlsConnect.apply(this, arguments);
};
for (const key of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr", "resolveSoa", "resolveSrv", "resolveTxt", "reverse"]) {
  if (typeof dns[key] === "function") {
    const original = dns[key];
    dns[key] = function guardedDns(hostname) {
      if (!loopback(hostname)) deny();
      return original.apply(this, arguments);
    };
  }
  if (dns.promises && typeof dns.promises[key] === "function") {
    const originalPromise = dns.promises[key];
    dns.promises[key] = async function guardedDnsPromise(hostname) {
      if (!loopback(hostname)) deny();
      return originalPromise.apply(this, arguments);
    };
  }
}
dgram.createSocket = deny;
const originalFetch = globalThis.fetch;
if (typeof originalFetch === "function") {
  globalThis.fetch = function guardedFetch(input) {
    const raw = typeof input === "string" || input instanceof URL ? input : input?.url;
    let host = "";
    try { host = new URL(raw).hostname; } catch { return Promise.reject(new Error("NON_LOOPBACK_NETWORK_DENIED")); }
    if (!loopback(host)) return Promise.reject(new Error("NON_LOOPBACK_NETWORK_DENIED"));
    return originalFetch.apply(this, arguments);
  };
}
if (typeof globalThis.WebSocket === "function") {
  globalThis.WebSocket = class DeniedWebSocket { constructor() { deny(); } };
}
if (typeof globalThis.EventSource === "function") {
  globalThis.EventSource = class DeniedEventSource { constructor() { deny(); } };
}
function readOnlyTarget(value) {
  if (typeof value !== "string" && !(value instanceof URL) && !Buffer.isBuffer(value)) return false;
  const resolved = path.resolve(String(value));
  return READ_ONLY_ROOTS.some((root) => resolved === root || resolved.startsWith(root + path.sep));
}
function guardFirstPath(original) {
  return function guardedFsMutation(target) {
    if (readOnlyTarget(target)) throw new Error("READ_ONLY_NODE_MODULES_WRITE_DENIED");
    return original.apply(this, arguments);
  };
}
for (const key of ["appendFile", "chmod", "chown", "cp", "link", "mkdir", "rename", "rm", "rmdir", "symlink", "truncate", "unlink", "writeFile"]) {
  if (typeof fs[key] === "function") fs[key] = guardFirstPath(fs[key]);
  const syncKey = key + "Sync";
  if (typeof fs[syncKey] === "function") fs[syncKey] = guardFirstPath(fs[syncKey]);
  if (fs.promises && typeof fs.promises[key] === "function") fs.promises[key] = guardFirstPath(fs.promises[key]);
}
`;
}

async function createWorkspace() {
  const workspacePath = await fsp.mkdtemp(
    path.join(os.tmpdir(), "aifinder-phase-30gd-"),
  );
  await fsp.chmod(workspacePath, 0o700);
  const copyList = trackedCopyList();

  for (const repositoryPath of copyList) {
    const source = path.join(REPOSITORY_ROOT, repositoryPath);
    const destination = path.join(workspacePath, repositoryPath);
    const stat = await fsp.lstat(source);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      fail("TEMP_COPY_NONREGULAR_SOURCE");
    }
    await fsp.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fsp.copyFile(source, destination);
    await fsp.chmod(destination, stat.mode & 0o777);
  }

  await fsp.symlink(
    path.join(REPOSITORY_ROOT, "node_modules"),
    path.join(workspacePath, "node_modules"),
    "dir",
  );
  const preloadPath = path.join(workspacePath, "phase30gd-network-preload.cjs");
  await fsp.writeFile(preloadPath, networkPreloadSource(workspacePath), {
    mode: 0o600,
    flag: "wx",
  });

  const copiedEnvironmentPaths = copyList.filter(isEnvironmentPath);
  if (copiedEnvironmentPaths.length !== 0) {
    fail("ENVIRONMENT_PATH_ENTERED_TEMP_COPY");
  }

  return { workspacePath, preloadPath, copiedFiles: copyList.length };
}

async function prepareIntentionalRedWorkspace(workspacePath) {
  const layoutPath = path.join(workspacePath, "app", "layout.tsx");
  const focusPath = path.join(workspacePath, "lib", "use-dialog-focus.ts");
  const layoutSource = await fsp.readFile(layoutPath, "utf8");
  const focusSource = await fsp.readFile(focusPath, "utf8");
  const skipNeedle = "        <SkipLink />\n";
  const focusNeedle = [
    "      if (explicitInitial && isFocusable(explicitInitial)) {",
    "        explicitInitial.focus();",
    "        return;",
    "      }",
  ].join("\n");

  if (
    layoutSource.split(skipNeedle).length !== 2 ||
    focusSource.split(focusNeedle).length !== 2
  ) {
    fail("INTENTIONAL_BROWSER_RED_SOURCE_BINDING_MISMATCH");
  }

  await fsp.writeFile(
    layoutPath,
    layoutSource.replace(skipNeedle, ""),
    "utf8",
  );
  await fsp.writeFile(
    focusPath,
    focusSource.replace(
      focusNeedle,
      [
        "      if (explicitInitial && isFocusable(explicitInitial)) {",
        "        container.focus();",
        "        return;",
        "      }",
      ].join("\n"),
    ),
    "utf8",
  );
}

function childEnvironment({
  workspacePath,
  preloadPath,
  stubOrigin,
  appOrigin = "",
  port = "",
}) {
  const chromiumStat = fs.lstatSync(PLAYWRIGHT_CHROMIUM_EXECUTABLE);
  if (!chromiumStat.isFile() || chromiumStat.isSymbolicLink()) {
    fail("PLAYWRIGHT_CHROMIUM_EXECUTABLE_INVALID");
  }
  return {
    PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: workspacePath,
    TMPDIR: workspacePath,
    NODE_OPTIONS: `--require=${preloadPath}`,
    CI: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: stubOrigin,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key",
    PLAYWRIGHT_BASE_URL: appOrigin,
    PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    PLAYWRIGHT_SKIP_WEB_SERVER: "1",
    NO_COLOR: "1",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
  };
}

function terminateProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function runChild({
  args,
  cwd,
  env,
  timeoutMs,
  expectedExit = 0,
}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let outputBytes = 0;
    let timedOut = false;

    function collect(target, chunk) {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        terminateProcess(child);
        reject(new Error("CHILD_OUTPUT_LIMIT"));
        return;
      }
      target.push(chunk);
    }

    child.stdout.on("data", (chunk) => collect(stdoutChunks, chunk));
    child.stderr.on("data", (chunk) => collect(stderrChunks, chunk));
    child.once("error", () => reject(new Error("CHILD_SPAWN_FAILED")));

    const timer = setTimeout(() => {
      timedOut = true;
      terminateProcess(child);
    }, timeoutMs);

    child.once("close", (code) => {
      clearTimeout(timer);
      const result = {
        exitCode: code,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      };
      if (timedOut) {
        reject(new Error("CHILD_TIMEOUT"));
        return;
      }
      if (code !== expectedExit) {
        const failure = new Error("CHILD_EXIT_MISMATCH");
        failure.result = result;
        reject(failure);
        return;
      }
      resolve(result);
    });
  });
}

async function requestStatus(rawUrl, method = "GET") {
  return await new Promise((resolve, reject) => {
    const request = http.request(rawUrl, { method }, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode || 0));
    });
    request.once("error", reject);
    request.end();
  });
}

async function getFreeLoopbackPort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") fail("APP_PORT_BIND_FAILED");
  const port = address.port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function classifyAppStartFailure(stdout, stderr) {
  const bounded = `${stdout}\n${stderr}`;
  if (bounded.includes("NON_LOOPBACK_NETWORK_DENIED")) {
    return "APP_START_EXTERNAL_NETWORK_ATTEMPT";
  }
  if (bounded.includes("READ_ONLY_NODE_MODULES_WRITE_DENIED")) {
    return "APP_START_NODE_MODULES_WRITE_ATTEMPT";
  }
  if (bounded.includes("Could not find a production build")) {
    return "APP_START_BUILD_OUTPUT_ABSENT";
  }
  if (bounded.includes("symlink")) {
    return "APP_START_SYMLINK_FAILED";
  }
  if (bounded.includes("TypeError")) {
    return "APP_START_TYPE_ERROR";
  }
  if (bounded.includes("SyntaxError")) {
    return "APP_START_SYNTAX_ERROR";
  }
  if (bounded.includes("Cannot find module")) {
    return "APP_START_MODULE_RESOLUTION_FAILED";
  }
  const nodeErrorCode = bounded.match(/\b(ERR_[A-Z0-9_]+)\b/)?.[1];
  if (nodeErrorCode) return `APP_START_${nodeErrorCode}`;
  const posixErrorCode = bounded.match(/\b(E[A-Z]{2,})\b/)?.[1];
  if (posixErrorCode) return `APP_START_${posixErrorCode}`;
  return `APP_START_FAILED_STDOUT_${Buffer.byteLength(
    stdout,
  )}_STDERR_${Buffer.byteLength(stderr)}`;
}

async function waitForApp(appOrigin, child, capturedOutput) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      fail(
        classifyAppStartFailure(
          Buffer.concat(capturedOutput.stdout).toString("utf8"),
          Buffer.concat(capturedOutput.stderr).toString("utf8"),
        ),
      );
    }
    try {
      if ((await requestStatus(appOrigin)) >= 200) return;
    } catch {
      // A loopback connection refusal is expected until the child is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("APP_START_TIMEOUT");
}

function collectPlaywrightSpecs(report) {
  const collected = [];
  const categorizeError = (value) => {
    const message =
      typeof value === "string"
        ? value
        : value && typeof value === "object" && typeof value.message === "string"
          ? value.message
          : "";
    if (message.includes("ERR_CONNECTION_REFUSED")) return "CONNECTION_REFUSED";
    if (message.includes("ERR_PROXY_CONNECTION_FAILED")) {
      return "PROXY_CONNECTION_FAILED";
    }
    if (message.includes("Cannot find module")) return "MODULE_RESOLUTION";
    const safeCode = message.match(
      /\b(AXE_RULE_IDS_[A-Za-z0-9_-]+|UNLABELED_CONTROLS_[A-Za-z0-9_-]+|PAGE_FAILURE_CODES_[A-Z0-9_]+|EXTERNAL_BROWSER_ATTEMPTS_[A-Z0-9_]+|SKIP_LINK_FIRST_FOCUS|SKIP_LINK_VISIBLE_FOCUS|SEARCH_DIALOG_VISIBLE|SEARCH_INITIAL_FOCUS|SEARCH_OPENER_RESTORED(?:_NESTED)?|DETAILS_DIALOG_VISIBLE|DETAILS_INITIAL_FOCUS|DETAILS_OPENER_RESTORED|DIALOG_FOCUSABLE_COUNT|FOCUS_WRAP_FORWARD|FOCUS_WRAP_REVERSE|SUBMIT_INITIAL_FOCUS|SUBMIT_POPUP_INITIAL_FOCUS|SUBMIT_OPENER_RESTORED)\b/,
    )?.[1];
    if (safeCode) return safeCode.toUpperCase().replaceAll("-", "_");
    if (message.includes("Failed to inject axe-core")) return "AXE_INJECTION";
    if (message.includes("AxeBuilder")) return "AXE_BUILDER";
    if (message.includes("Execution context was destroyed")) {
      return "EXECUTION_CONTEXT";
    }
    if (message.includes("Cannot read properties")) return "PROPERTY_ACCESS";
    if (message.includes("Unexpected token")) return "PARSE_ERROR";
    if (message.includes("is not defined")) return "UNDEFINED_REFERENCE";
    if (message.includes("Protocol error")) return "BROWSER_PROTOCOL";
    if (
      message.includes("Target page") ||
      message.includes("browser has been closed")
    ) {
      return "BROWSER_CLOSED";
    }
    if (message.includes("net::ERR")) return "BROWSER_NETWORK";
    if (message.includes("page.goto")) return "NAVIGATION";
    if (message.includes("networkidle")) return "NETWORK_IDLE";
    if (message.includes("Timeout") || message.includes("timed out")) {
      return "TIMEOUT";
    }
    if (message.includes("strict mode violation")) return "STRICT_LOCATOR";
    if (message.includes("toBeFocused")) return "FOCUS_ASSERTION";
    if (message.includes("toBeVisible")) return "VISIBILITY_ASSERTION";
    if (message.includes("toBeHidden")) return "HIDDEN_ASSERTION";
    if (message.includes("toHaveAttribute")) return "ATTRIBUTE_ASSERTION";
    if (message.includes("Expected:") && message.includes("Received:")) {
      return "ASSERTION_MISMATCH";
    }
    if (
      message.includes("accessibility violations") ||
      message.includes("Axe") ||
      message.includes("violations")
    ) {
      return "AXE_VIOLATION";
    }
    if (message.includes("pageFailures")) return "PAGE_FAILURE";
    if (message.includes("toEqual")) return "EQUALITY_ASSERTION";
    if (message.includes("getByRole")) return "ROLE_LOCATOR";
    if (message.includes("getByLabel")) return "LABEL_LOCATOR";
    if (message.includes("waiting for")) return "WAITING";
    if (message.includes("locator")) return "LOCATOR";
    if (message.includes("Error:")) return "GENERIC_ERROR";
    return "OTHER";
  };
  function visit(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        const statuses = (spec.tests || []).flatMap((entry) =>
          (entry.results || []).map((result) => result.status),
        );
        const errorCategories = new Set(
          (spec.tests || []).flatMap((entry) =>
            (entry.results || []).flatMap((result) =>
              (result.errors || []).map(categorizeError),
            ),
          ),
        );
        collected.push({
          title: spec.title,
          ok: spec.ok === true,
          statuses,
          errorCategories: [...errorCategories].sort(),
        });
      }
      visit(suite.suites);
    }
  }
  visit(report.suites);
  return collected;
}

function validatePlaywrightResult(rawJson, mode) {
  let report;
  try {
    report = JSON.parse(rawJson);
  } catch {
    fail("PLAYWRIGHT_JSON_INVALID");
  }
  const specs = collectPlaywrightSpecs(report);
  if (specs.length === 0) fail("PLAYWRIGHT_TESTS_ABSENT");

  const failed = specs.filter((spec) => !spec.ok);
  if (mode === "--expect-red") {
    const failedTitles = new Set(failed.map((spec) => spec.title));
    if (
      failed.length !== EXPECTED_RED_TITLES.size ||
      failedTitles.size !== EXPECTED_RED_TITLES.size ||
      [...EXPECTED_RED_TITLES].some((title) => !failedTitles.has(title)) ||
      specs.some((spec) => !EXPECTED_RED_TITLES.has(spec.title))
    ) {
      fail("BROWSER_RED_FAILURE_SET_MISMATCH");
    }
    for (const spec of failed) {
      const expectedCategory = EXPECTED_RED_CATEGORY_BY_TITLE.get(spec.title);
      if (
        !expectedCategory ||
        !spec.errorCategories.includes(expectedCategory)
      ) {
        fail("BROWSER_RED_FAILURE_CATEGORY_MISMATCH");
      }
    }
    return {
      tests: specs.length,
      passed: specs.length - failed.length,
      failed: failed.length,
      expectedRed: failed.length,
    };
  }

  if (failed.length !== 0) {
    const firstTitle = failed[0]?.title || "";
    const errorCategories = [
      ...new Set(failed.flatMap((spec) => spec.errorCategories)),
    ].sort();
    const category = firstTitle.includes("passes Axe")
      ? "ACCESSIBILITY_ROUTE"
      : firstTitle.includes("not-found route")
        ? "NOT_FOUND_CONTRACT"
        : firstTitle.includes("skip link")
          ? "SKIP_LINK"
          : firstTitle.includes("search dialog")
            ? "SEARCH_DIALOG_FOCUS"
            : firstTitle.includes("nested tool details")
              ? "NESTED_DIALOG_FOCUS"
              : firstTitle.includes("submit popup")
                ? "SUBMIT_POPUP_FOCUS"
                : firstTitle.includes("stays within its viewport")
                  ? "RESPONSIVE_ROUTE"
                  : firstTitle.includes("panels inside")
                    ? "RESPONSIVE_MODAL"
                    : "UNCLASSIFIED";
    const diagnostic =
      errorCategories.length === 0 ? "NO_ERROR_CATEGORY" : errorCategories.join("_");
    const titleCategory = (title) => {
      const routeMatch = title.match(
        /^(\/|\/submit|\/compare|\/category\/chatbots|\/tool\/synthetic-tool|\/this-route-does-not-exist) passes Axe/,
      );
      if (routeMatch) {
        const routeCategories = new Map([
          ["/", "HOME_AXE"],
          ["/submit", "SUBMIT_AXE"],
          ["/compare", "COMPARE_AXE"],
          ["/category/chatbots", "CATEGORY_AXE"],
          ["/tool/synthetic-tool", "TOOL_AXE"],
          ["/this-route-does-not-exist", "NOT_FOUND_AXE"],
        ]);
        return routeCategories.get(routeMatch[1]) || "ROUTE_AXE";
      }
      if (title.includes("not-found route")) return "NOT_FOUND_CONTRACT";
      if (title.includes("skip link")) return "SKIP_LINK";
      if (title.includes("search dialog")) return "SEARCH_DIALOG";
      if (title.includes("nested tool details")) return "NESTED_DIALOG";
      if (title.includes("submit popup")) return "SUBMIT_POPUP";
      if (title.includes("stays within its viewport")) return "RESPONSIVE_ROUTE";
      if (title.includes("panels inside")) return "RESPONSIVE_MODAL";
      return "UNCLASSIFIED";
    };
    const failureSet = failed
      .map(
        (spec) =>
          `${titleCategory(spec.title)}_${
            spec.errorCategories.length === 0
              ? "NO_ERROR_CATEGORY"
              : spec.errorCategories.join("_")
          }`,
      )
      .sort()
      .join("__");
    fail(
      `PLAYWRIGHT_GREEN_FAILED_${category}_COUNT_${failed.length}_${diagnostic}_SET_${failureSet}`,
    );
  }
  return {
    tests: specs.length,
    passed: specs.length,
    failed: 0,
    expectedRed: 0,
  };
}

function classifyBuildFailure(result) {
  const bounded = `${result?.stdout || ""}\n${result?.stderr || ""}`;
  if (bounded.includes("NON_LOOPBACK_NETWORK_DENIED")) {
    return "TEMP_BUILD_EXTERNAL_NETWORK_ATTEMPT";
  }
  if (bounded.includes("READ_ONLY_NODE_MODULES_WRITE_DENIED")) {
    return "TEMP_BUILD_NODE_MODULES_WRITE_ATTEMPT";
  }
  if (
    bounded.includes("Cannot set property") ||
    bounded.includes("only a getter") ||
    bounded.includes("read only property")
  ) {
    return "TEMP_BUILD_PRELOAD_PATCH_INCOMPATIBLE";
  }
  if (
    bounded.includes("Type error") ||
    bounded.includes("Failed to compile") ||
    /\bTS\d{4}\b/.test(bounded)
  ) {
    return "TEMP_BUILD_COMPILE_FAILED";
  }
  if (
    bounded.includes("EACCES") ||
    bounded.includes("EPERM") ||
    bounded.includes("permission denied")
  ) {
    return "TEMP_BUILD_PERMISSION_FAILED";
  }
  if (
    bounded.includes("Cannot find module") ||
    bounded.includes("MODULE_NOT_FOUND")
  ) {
    return "TEMP_BUILD_MODULE_RESOLUTION_FAILED";
  }
  if (bounded.includes("TypeError")) {
    return "TEMP_BUILD_TYPE_ERROR";
  }
  if (bounded.includes("SyntaxError")) {
    return "TEMP_BUILD_SYNTAX_ERROR";
  }
  if (bounded.includes("ReferenceError")) {
    return "TEMP_BUILD_REFERENCE_ERROR";
  }
  if (bounded.includes("ENOENT")) {
    return "TEMP_BUILD_FILE_ABSENT";
  }
  if (bounded.includes("ERR_INVALID_ARG")) {
    return "TEMP_BUILD_INVALID_ARGUMENT";
  }
  if (bounded.includes("Invalid project directory")) {
    return "TEMP_BUILD_PROJECT_DIRECTORY_INVALID";
  }
  if (bounded.includes("unknown option")) {
    return "TEMP_BUILD_CLI_OPTION_INVALID";
  }
  if (bounded.includes("Failed to collect page data")) {
    return "TEMP_BUILD_PAGE_DATA_FAILED";
  }
  if (bounded.includes("Error occurred prerendering page")) {
    return "TEMP_BUILD_PRERENDER_FAILED";
  }
  if (bounded.includes("Turbopack build failed")) {
    return "TEMP_BUILD_TURBOPACK_FAILED";
  }
  if (bounded.includes("Webpack build failed")) {
    return "TEMP_BUILD_WEBPACK_FAILED";
  }
  if (bounded.includes("Maximum call stack size exceeded")) {
    return "TEMP_BUILD_STACK_OVERFLOW";
  }
  if (bounded.includes("is not a function")) {
    return "TEMP_BUILD_FUNCTION_INCOMPATIBLE";
  }
  if (bounded.includes("Cannot read properties of undefined")) {
    return "TEMP_BUILD_UNDEFINED_PROPERTY";
  }
  if (bounded.includes("NEXT_PUBLIC_SUPABASE")) {
    return "TEMP_BUILD_SYNTHETIC_SUPABASE_ENV_FAILED";
  }
  if (bounded.toLowerCase().includes("supabase")) {
    return "TEMP_BUILD_SYNTHETIC_SUPABASE_FAILED";
  }
  for (const [needle, category] of [
    ["symlink", "TEMP_BUILD_SYMLINK_FAILED"],
    ["workspace root", "TEMP_BUILD_WORKSPACE_ROOT_FAILED"],
    ["project root", "TEMP_BUILD_PROJECT_ROOT_FAILED"],
    ["next package", "TEMP_BUILD_NEXT_PACKAGE_FAILED"],
    ["package manager", "TEMP_BUILD_PACKAGE_MANAGER_FAILED"],
    ["realpath", "TEMP_BUILD_REALPATH_FAILED"],
    ["patch-incorrect-lockfile", "TEMP_BUILD_LOCKFILE_PATCH_FAILED"],
    ["lockfile", "TEMP_BUILD_LOCKFILE_FAILED"],
    ["lightningcss", "TEMP_BUILD_LIGHTNINGCSS_FAILED"],
    ["postcss", "TEMP_BUILD_POSTCSS_FAILED"],
    ["turbopack", "TEMP_BUILD_TURBOPACK_INTERNAL_FAILED"],
    ["webpack", "TEMP_BUILD_WEBPACK_INTERNAL_FAILED"],
    ["swc", "TEMP_BUILD_SWC_FAILED"],
    ["network-preload", "TEMP_BUILD_NETWORK_PRELOAD_FAILED"],
    ["child_process", "TEMP_BUILD_CHILD_PROCESS_FAILED"],
    ["spawn", "TEMP_BUILD_SPAWN_FAILED"],
  ]) {
    if (bounded.toLowerCase().includes(needle)) return category;
  }
  const nodeErrorCode = bounded.match(/\b(ERR_[A-Z0-9_]+)\b/)?.[1];
  if (nodeErrorCode) {
    return `TEMP_BUILD_${nodeErrorCode}`;
  }
  const posixErrorCode = bounded.match(/\b(E[A-Z]{2,})\b/)?.[1];
  if (posixErrorCode) {
    return `TEMP_BUILD_${posixErrorCode}`;
  }
  return `TEMP_BUILD_FAILED_STDOUT_${Buffer.byteLength(
    result?.stdout || "",
  )}_STDERR_${Buffer.byteLength(result?.stderr || "")}`;
}

async function preflightRuntime({
  workspacePath,
  preloadPath,
  stubOrigin,
}) {
  const env = childEnvironment({
    workspacePath,
    preloadPath,
    stubOrigin,
  });
  const localResult = await runChild({
    args: [
      "-e",
      `fetch(${JSON.stringify(`${stubOrigin}/health`)}).then((response)=>{if(response.status!==200)process.exit(2);console.log("LOOPBACK_NETWORK_ALLOWED")}).catch(()=>process.exit(3))`,
    ],
    cwd: workspacePath,
    env,
    timeoutMs: 10_000,
  });
  if (localResult.stdout !== "LOOPBACK_NETWORK_ALLOWED\n") {
    fail("LOOPBACK_SELF_TEST_FAILED");
  }

  const deniedResult = await runChild({
    args: [
      "-e",
      'fetch("https://example.invalid").then(()=>process.exit(2)).catch((error)=>{if(error&&error.message==="NON_LOOPBACK_NETWORK_DENIED"){console.log("NON_LOOPBACK_NETWORK_DENIED");return;}process.exit(3)})',
    ],
    cwd: workspacePath,
    env,
    timeoutMs: 10_000,
  });
  if (deniedResult.stdout !== "NON_LOOPBACK_NETWORK_DENIED\n") {
    fail("NON_LOOPBACK_SELF_TEST_FAILED");
  }
  if ((await requestStatus(`${stubOrigin}/unknown`)) !== 404) {
    fail("STUB_UNKNOWN_ROUTE_NOT_REJECTED");
  }
  if ((await requestStatus(`${stubOrigin}/rest/v1/public_safe_tools`, "POST")) !== 405) {
    fail("STUB_WRITE_NOT_REJECTED");
  }
}

async function executeBrowserMode({
  mode,
  workspacePath,
  preloadPath,
  stub,
}) {
  if (mode === "--expect-red") {
    await prepareIntentionalRedWorkspace(workspacePath);
  }
  const nextCli = path.join(
    workspacePath,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const playwrightCli = path.join(
    workspacePath,
    "node_modules",
    "@playwright",
    "test",
    "cli.js",
  );
  const appPort = await getFreeLoopbackPort();
  const appOrigin = `http://127.0.0.1:${appPort}`;
  const env = childEnvironment({
    workspacePath,
    preloadPath,
    stubOrigin: stub.origin,
    appOrigin,
    port: appPort,
  });

  let build;
  try {
    build = await runChild({
      args: [nextCli, "build", "--webpack"],
      cwd: workspacePath,
      env,
      timeoutMs: BUILD_TIMEOUT_MS,
    });
  } catch (caught) {
    if (caught?.message === "CHILD_EXIT_MISMATCH" && caught.result) {
      fail(classifyBuildFailure(caught.result));
    }
    throw caught;
  }

  const app = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(appPort)],
    {
      cwd: workspacePath,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  let appStdoutBytes = 0;
  let appStderrBytes = 0;
  const appOutput = { stdout: [], stderr: [] };
  app.stdout.on("data", (chunk) => {
    appStdoutBytes += chunk.length;
    appOutput.stdout.push(chunk);
    if (appStdoutBytes + appStderrBytes > MAX_OUTPUT_BYTES) terminateProcess(app);
  });
  app.stderr.on("data", (chunk) => {
    appStderrBytes += chunk.length;
    appOutput.stderr.push(chunk);
    if (appStdoutBytes + appStderrBytes > MAX_OUTPUT_BYTES) terminateProcess(app);
  });

  try {
    await waitForApp(appOrigin, app, appOutput);
    const args = [
      playwrightCli,
      "test",
      "--config",
      "playwright.synthetic.config.ts",
      "--reporter=json",
      "--workers=1",
    ];
    if (mode === "--expect-red") {
      args.push(
        "testing/accessibility-qa.spec.ts",
        "--grep",
        "@phase30gd-red",
      );
    } else if (mode === "--accessibility") {
      args.push("testing/accessibility-qa.spec.ts");
    } else if (mode === "--responsive") {
      args.push("testing/responsive-qa.spec.ts");
    }

    let browser;
    if (mode === "--expect-red") {
      try {
        browser = await runChild({
          args,
          cwd: workspacePath,
          env,
          timeoutMs: BROWSER_TIMEOUT_MS,
          expectedExit: 0,
        });
        fail("BROWSER_RED_UNEXPECTED_GREEN");
      } catch (caught) {
        if (caught?.message !== "CHILD_EXIT_MISMATCH" || !caught.result) {
          throw caught;
        }
        browser = caught.result;
      }
    } else {
      try {
        browser = await runChild({
          args,
          cwd: workspacePath,
          env,
          timeoutMs: BROWSER_TIMEOUT_MS,
        });
      } catch (caught) {
        if (caught?.message !== "CHILD_EXIT_MISMATCH" || !caught.result) {
          throw caught;
        }
        browser = caught.result;
      }
    }

    const tests = validatePlaywrightResult(browser.stdout, mode);
    if (browser.stderr.length !== 0) fail("PLAYWRIGHT_STDERR_NONEMPTY");
    if (
      stub.metrics.rejectedUnknown !== 0 ||
      stub.metrics.rejectedWrites !== 0
    ) {
      fail("STUB_REJECTED_RUNTIME_REQUEST");
    }

    return {
      tests,
      buildStdout: outputIdentity(build.stdout),
      buildStderr: outputIdentity(build.stderr),
      browserStdout: outputIdentity(browser.stdout),
      browserStderr: outputIdentity(browser.stderr),
      appStdoutBytes,
      appStderrBytes,
    };
  } finally {
    terminateProcess(app);
    await new Promise((resolve) => {
      if (app.exitCode !== null || app.signalCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        try {
          process.kill(-app.pid, "SIGKILL");
        } catch {
          app.kill("SIGKILL");
        }
      }, 3_000);
      app.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

async function main() {
  const mode = process.argv[2];
  if (!MODES.has(mode) || process.argv.length !== 3) {
    fail("MODE_INVALID");
  }
  if (
    AUTHORIZED_CANDIDATE_PATHS.length !== 28 ||
    new Set(AUTHORIZED_CANDIDATE_PATHS).size !== 28
  ) {
    fail("AUTHORIZED_PATH_INVENTORY_INVALID");
  }

  const before = snapshotRepository();
  const workspace = await createWorkspace();
  const stub = await startSyntheticSupabaseStub();
  let result = null;

  try {
    if (mode === "--preflight") {
      await preflightRuntime({
        workspacePath: workspace.workspacePath,
        preloadPath: workspace.preloadPath,
        stubOrigin: stub.origin,
      });
      if (
        stub.metrics.rejectedUnknown !== 1 ||
        stub.metrics.rejectedWrites !== 1
      ) {
        fail("STUB_PREFLIGHT_REJECTION_COUNTS");
      }
    } else {
      result = await executeBrowserMode({
        mode,
        workspacePath: workspace.workspacePath,
        preloadPath: workspace.preloadPath,
        stub,
      });
    }
  } finally {
    await stub.close().catch(() => {
      fail("STUB_CLEANUP_FAILED");
    });
    await fsp.rm(workspace.workspacePath, { recursive: true, force: true });
  }

  const after = snapshotRepository();
  if (after !== before) fail("REPOSITORY_STATE_CHANGED");

  if (mode === "--preflight") {
    console.log(
      `PASS_SYNTHETIC_BROWSER_PREFLIGHT copied_files=${workspace.copiedFiles} environment_files=0 external_network_attempts=0 rejected_unknown=1 rejected_writes=1 repository_state_unchanged=true`,
    );
    return;
  }

  const classification =
    mode === "--expect-red"
      ? "EXPECTED_BROWSER_RED"
      : "PASS_SYNTHETIC_BROWSER_QA";
  console.log(
    `${classification} mode=${mode.slice(2)} tests=${result.tests.tests} pass=${result.tests.passed} fail=${result.tests.failed} expected_red=${result.tests.expectedRed} stub_reads=${stub.metrics.acceptedReads} external_network_attempts=0 environment_file_reads=0 real_supabase_calls=0 sql_executions=0 database_accesses=0 repository_state_unchanged=true build_stdout_sha256=${result.buildStdout.sha256} build_stdout_bytes=${result.buildStdout.bytes} build_stderr_sha256=${result.buildStderr.sha256} build_stderr_bytes=${result.buildStderr.bytes} browser_stdout_sha256=${result.browserStdout.sha256} browser_stdout_bytes=${result.browserStdout.bytes} browser_stderr_bytes=${result.browserStderr.bytes} app_stdout_bytes=${result.appStdoutBytes} app_stderr_bytes=${result.appStderrBytes}`,
  );
}

try {
  await main();
} catch (caught) {
  const stage =
    caught instanceof Error && /^[A-Z0-9_]+$/.test(caught.message)
      ? caught.message
      : "INTERNAL_FAILURE";
  console.log(`FAIL_SYNTHETIC_BROWSER_QA stage=${stage}`);
  process.exitCode = 1;
}
