#!/usr/bin/env node

import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const TEST_FILE = fileURLToPath(import.meta.url);
const DEFAULT_SOURCE_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(DEFAULT_SOURCE_ROOT);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error("usage: authentication-and-session-live-route-static-synthetic.test.mjs [--source-root <dir>]");
  }
  return realpathSync(path.resolve(argv[1]));
}

const SOURCE_ROOT = parseSourceRoot(process.argv.slice(2));

const AUTH_PATH = "lib/admin-auth.ts";
const READ_ONLY_AUTH_PATH = "lib/admin-auth-read-only.ts";
const CSRF_ROUTE_PATH = "app/api/admin/csrf/route.ts";
const SESSION_ROUTE_PATH = "app/api/admin/session/route.ts";
const LOGOUT_ROUTE_PATH = "app/api/admin/logout/route.ts";
const LOGOUT_HANDLER_PATH = "app/api/admin/logout/handler.ts";
const DASHBOARD_PATH = "components/admin/admin-dashboard-client.tsx";
const SYNTHETIC_SECRET = "synthetic-admin-session-secret-not-from-environment";

const failures = new Map();

function source(relativePath) {
  const candidate = containedPath(relativePath);
  const resolved = realpathSync(candidate);
  if (!isContained(resolved)) throw new Error(`source path escapes source root: ${relativePath}`);
  return readFileSync(resolved, "utf8");
}

function isContained(candidate) {
  return candidate === SOURCE_ROOT || candidate.startsWith(`${SOURCE_ROOT}${path.sep}`);
}

function containedPath(relativePath) {
  const candidate = path.resolve(SOURCE_ROOT, relativePath);
  if (!isContained(candidate)) throw new Error(`source path escapes source root: ${relativePath}`);
  return candidate;
}

function fail(domain, reason) {
  if (!failures.has(domain)) failures.set(domain, reason);
}

function expect(domain, condition, reason) {
  if (!condition) fail(domain, reason);
}

function stripImports(text) {
  return text.replace(/^import(?:[\s\S]*?from\s*)?["'][^"']+["'];?\s*$/gmu, "");
}

async function importSyntheticTypeScript(relativePath, prelude, replacements = []) {
  if (!existsSync(containedPath(relativePath))) return null;

  let text = source(relativePath);
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  const output = ts.transpileModule(`${prelude}\n${stripImports(text)}`, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: relativePath,
    reportDiagnostics: false,
  }).outputText;

  const encoded = Buffer.from(output, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}#${encodeURIComponent(relativePath)}`);
}

function createRequest({ method = "GET", cookie = "", csrf = "" } = {}) {
  return new Request("https://aifinder.test/api/admin/auth-contract", {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
  });
}

function authorizedSession() {
  return {
    isAdmin: true,
    actor: { id: null, label: "AiFinder Admin" },
    errors: [],
  };
}

function unauthorizedSession() {
  return { isAdmin: false, actor: null, errors: ["invalid_session"] };
}

const authSource = source(AUTH_PATH);
const readOnlyAuthSource = source(READ_ONLY_AUTH_PATH);
const csrfRouteSource = source(CSRF_ROUTE_PATH);
const sessionRouteSource = source(SESSION_ROUTE_PATH);
const logoutRouteSource = source(LOGOUT_ROUTE_PATH);
const dashboardSource = source(DASHBOARD_PATH);

let authModule = null;
try {
  authModule = await importSyntheticTypeScript(
    AUTH_PATH,
    `import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";\nconst SYNTHETIC_ADMIN_SESSION_SECRET = ${JSON.stringify(SYNTHETIC_SECRET)};`,
    [[/process\.env\.ADMIN_SESSION_SECRET/gu, "SYNTHETIC_ADMIN_SESSION_SECRET"]],
  );
} catch (error) {
  fail("MALFORMED_PERCENT_ENCODED_SESSION_COOKIE", `canonical auth could not be loaded synthetically: ${error?.name || "load_failure"}`);
  fail("MALFORMED_PERCENT_ENCODED_CSRF_COOKIE", "canonical CSRF verification could not be loaded synthetically");
  fail("CSRF_CONCURRENT_FIRST_ISSUANCE", "canonical CSRF issuance could not be loaded synthetically");
}

if (authModule) {
  try {
    const result = authModule.verifyAdminSession(
      createRequest({ cookie: "aifinder_admin_session=%E0%A4%A" }),
    );
    expect(
      "MALFORMED_PERCENT_ENCODED_SESSION_COOKIE",
      result?.isAdmin === false && result?.actor === null,
      "malformed percent-encoded session cookie did not fail closed",
    );
  } catch {
    fail("MALFORMED_PERCENT_ENCODED_SESSION_COOKIE", "malformed percent-encoded session cookie throws instead of failing closed");
  }

  try {
    const result = authModule.verifyAdminCsrfRequest(
      createRequest({
        method: "POST",
        cookie: "aifinder_admin_csrf_token=%E0%A4%A",
        csrf: "a".repeat(64),
      }),
    );
    expect(
      "MALFORMED_PERCENT_ENCODED_CSRF_COOKIE",
      result === false,
      "malformed percent-encoded CSRF cookie did not fail closed",
    );
  } catch {
    fail("MALFORMED_PERCENT_ENCODED_CSRF_COOKIE", "malformed percent-encoded CSRF cookie throws instead of failing closed");
  }

  if (typeof authModule.getOrCreateAdminCsrfToken !== "function") {
    fail("CSRF_CONCURRENT_FIRST_ISSUANCE", "canonical concurrency-safe CSRF issuance helper is absent");
  } else {
    const payload = "admin:4102444800000";
    const previousPayload = "admin:4102444799000";
    const signedSession = (value) => {
      const signature = createHmac("sha256", SYNTHETIC_SECRET)
        .update(value)
        .digest("hex");
      return `${value}.${signature}`;
    };
    const session = signedSession(payload);
    const previousSession = signedSession(previousPayload);
    const expectedCsrf = createHmac("sha256", SYNTHETIC_SECRET)
      .update(`csrf:${session}`)
      .digest("hex");
    const previousCsrf = createHmac("sha256", SYNTHETIC_SECRET)
      .update(`csrf:${previousSession}`)
      .digest("hex");
    const request = createRequest({
      cookie: `aifinder_admin_session=${encodeURIComponent(session)}`,
    });
    try {
      const [first, second] = await Promise.all([
        authModule.getOrCreateAdminCsrfToken(request),
        authModule.getOrCreateAdminCsrfToken(request),
      ]);
      expect(
        "CSRF_CONCURRENT_FIRST_ISSUANCE",
        typeof first === "string" &&
          /^[a-f0-9]{64}$/u.test(first) &&
          first === second &&
          first === expectedCsrf,
        "concurrent first CSRF issuance is not stable and session-bound",
      );

      const staleCookieRequest = createRequest({
        cookie: `aifinder_admin_session=${encodeURIComponent(session)}; aifinder_admin_csrf_token=${previousCsrf}`,
      });
      expect(
        "CSRF_CONCURRENT_FIRST_ISSUANCE",
        authModule.getOrCreateAdminCsrfToken(staleCookieRequest) === expectedCsrf,
        "stale CSRF cookie survives authenticated session rotation",
      );

      const preseededToken = "a".repeat(64);
      const preseededCookieRequest = createRequest({
        cookie: `aifinder_admin_session=${encodeURIComponent(session)}; aifinder_admin_csrf_token=${preseededToken}`,
      });
      expect(
        "CSRF_CONCURRENT_FIRST_ISSUANCE",
        authModule.getOrCreateAdminCsrfToken(preseededCookieRequest) === expectedCsrf,
        "syntactically valid preseeded CSRF cookie is accepted without session binding",
      );

      const validPost = createRequest({
        method: "POST",
        cookie: `aifinder_admin_session=${encodeURIComponent(session)}; aifinder_admin_csrf_token=${expectedCsrf}`,
        csrf: expectedCsrf,
      });
      const stalePost = createRequest({
        method: "POST",
        cookie: `aifinder_admin_session=${encodeURIComponent(session)}; aifinder_admin_csrf_token=${previousCsrf}`,
        csrf: previousCsrf,
      });
      const preseededPost = createRequest({
        method: "POST",
        cookie: `aifinder_admin_session=${encodeURIComponent(session)}; aifinder_admin_csrf_token=${preseededToken}`,
        csrf: preseededToken,
      });
      expect(
        "CSRF_CONCURRENT_FIRST_ISSUANCE",
        authModule.verifyAdminCsrfRequest(validPost) === true &&
          authModule.verifyAdminCsrfRequest(stalePost) === false &&
          authModule.verifyAdminCsrfRequest(preseededPost) === false,
        "CSRF verification is not bound to the current authenticated session",
      );
    } catch {
      fail("CSRF_CONCURRENT_FIRST_ISSUANCE", "concurrent first CSRF issuance throws");
    }
  }
}

expect(
  "MALFORMED_PERCENT_ENCODED_SESSION_COOKIE",
  readOnlyAuthSource.includes('from "./admin-auth"') &&
    readOnlyAuthSource.includes("verifyAdminSession") &&
    !readOnlyAuthSource.includes("decodeBase64UrlJson") &&
    !readOnlyAuthSource.includes("splitSignedSession"),
  "read-only auth still implements a divergent base64url session contract",
);

for (const [domain, relativePath, text] of [
  ["MALFORMED_PERCENT_ENCODED_SESSION_COOKIE", AUTH_PATH, authSource],
  ["MALFORMED_PERCENT_ENCODED_CSRF_COOKIE", CSRF_ROUTE_PATH, csrfRouteSource],
  ["MALFORMED_PERCENT_ENCODED_SESSION_COOKIE", SESSION_ROUTE_PATH, sessionRouteSource],
]) {
  expect(
    domain,
    text.startsWith('import "server-only";'),
    `${relativePath} lacks a direct first-statement server-only boundary`,
  );
}

expect(
  "MALFORMED_PERCENT_ENCODED_CSRF_COOKIE",
  !csrfRouteSource.includes("decodeURIComponent(") &&
    csrfRouteSource.includes("getOrCreateAdminCsrfToken"),
  "CSRF route still owns throwing cookie parsing or non-concurrent issuance",
);

expect(
  "CSRF_CONCURRENT_FIRST_ISSUANCE",
  csrfRouteSource.includes("getOrCreateAdminCsrfToken") &&
    !csrfRouteSource.includes("createAdminCsrfToken()"),
  "CSRF route still creates a new random token for each first request",
);

if (!existsSync(containedPath(LOGOUT_HANDLER_PATH))) {
  fail("LOGOUT_CSRF_BEFORE_AUDIT", "injectable logout handler seam is absent");
  fail("LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY", "logout audit-failure and replay seam is absent");
} else {
  const logoutHandlerSource = source(LOGOUT_HANDLER_PATH);
  expect(
    "LOGOUT_CSRF_BEFORE_AUDIT",
    !/(supabase-admin|process\.env|createClient|\.from\s*\(|\.rpc\s*\(|\.storage\b)/iu.test(
      logoutHandlerSource,
    ),
    "logout handler has privileged or environment capability",
  );

  let logoutModule = null;
  try {
    logoutModule = await importSyntheticTypeScript(
      LOGOUT_HANDLER_PATH,
      'const NextResponse = { json: (data, init = {}) => Response.json(data, init) };',
    );
  } catch (error) {
    fail("LOGOUT_CSRF_BEFORE_AUDIT", `logout handler could not be loaded synthetically: ${error?.name || "load_failure"}`);
    fail("LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY", "logout handler audit/replay behavior could not be exercised");
  }

  const factory = logoutModule?.createLogoutHandler;
  if (typeof factory !== "function") {
    fail("LOGOUT_CSRF_BEFORE_AUDIT", "createLogoutHandler export is absent");
    fail("LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY", "createLogoutHandler export is absent");
  } else {
    const deniedCalls = [];
    const deniedHandler = factory({
      verifySession() {
        deniedCalls.push("session");
        return authorizedSession();
      },
      verifyCsrf() {
        deniedCalls.push("csrf");
        return false;
      },
      async writeAudit() {
        deniedCalls.push("audit");
      },
      clearAdminCookies() {
        deniedCalls.push("clear");
      },
    });

    try {
      const post = typeof deniedHandler === "function" ? deniedHandler : deniedHandler.POST;
      const response = await post(createRequest({ method: "POST" }));
      expect(
        "LOGOUT_CSRF_BEFORE_AUDIT",
        response.status === 403 && deniedCalls.join(",") === "session,csrf",
        "logout does not enforce session then CSRF before audit/cookie capability",
      );
    } catch {
      fail("LOGOUT_CSRF_BEFORE_AUDIT", "logout CSRF denial throws instead of returning fixed 403");
    }

    const replayCalls = [];
    let sessionAttempt = 0;
    let clearCount = 0;
    const replayHandler = factory({
      verifySession() {
        replayCalls.push("session");
        sessionAttempt += 1;
        return sessionAttempt === 1 ? authorizedSession() : unauthorizedSession();
      },
      verifyCsrf() {
        replayCalls.push("csrf");
        return true;
      },
      async writeAudit() {
        replayCalls.push("audit");
        throw new Error("synthetic audit rejection");
      },
      clearAdminCookies() {
        replayCalls.push("clear");
        clearCount += 1;
      },
    });

    const originalConsoleError = console.error;
    const replayLogEvents = [];
    try {
      console.error = (...values) => replayLogEvents.push(values);
      const post = typeof replayHandler === "function" ? replayHandler : replayHandler.POST;
      const first = await post(createRequest({ method: "POST" }));
      const second = await post(createRequest({ method: "POST" }));
      expect(
        "LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY",
        first.status === 200 &&
          second.status === 401 &&
          clearCount === 1 &&
          replayCalls.join(",") === "session,csrf,audit,clear,session" &&
          replayLogEvents.length === 1 &&
          replayLogEvents[0]?.length === 1 &&
          replayLogEvents[0]?.[0] === "admin_logout_audit_write_failed",
        "audit rejection is not client-invisible or cleared-cookie replay repeats capability",
      );
    } catch {
      fail("LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY", "audit rejection escapes logout or prevents deterministic replay handling");
    } finally {
      console.error = originalConsoleError;
    }
  }
}

expect(
  "LOGOUT_CSRF_BEFORE_AUDIT",
  logoutRouteSource.startsWith('import "server-only";') &&
    logoutRouteSource.includes('from "./handler"') &&
    logoutRouteSource.includes("createLogoutHandler"),
  "logout route is not a server-only thin wrapper around the injected handler",
);

expect(
  "LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY",
  dashboardSource.includes("logoutOnUnauthorized: false") &&
    dashboardSource.includes('"x-csrf-token"') &&
    dashboardSource.indexOf("logoutOnUnauthorized: false") <
      dashboardSource.indexOf('fetch("/api/admin/logout"'),
  "dashboard logout does not obtain CSRF through a non-recursive path",
);

for (const domain of [
  "MALFORMED_PERCENT_ENCODED_SESSION_COOKIE",
  "MALFORMED_PERCENT_ENCODED_CSRF_COOKIE",
  "LOGOUT_CSRF_BEFORE_AUDIT",
  "LOGOUT_AUDIT_REJECT_THROW_AND_REPLAY",
  "CSRF_CONCURRENT_FIRST_ISSUANCE",
]) {
  if (!failures.has(domain)) continue;
  process.stderr.write(`${domain} ${failures.get(domain)}\n`);
}

if (failures.size > 0) {
  process.stderr.write(
    `RED_AUTHENTICATION_AND_SESSION domains=${failures.size}/5 expected=5 no_missing_module_errors=true\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    "PASS_AUTHENTICATION_AND_SESSION_LIVE_ROUTE_STATIC_SYNTHETIC domains=5/5\n",
  );
}

import assert from "node:assert/strict";
import vm from "node:vm";
import * as isolation from "../scripts/launch-operations-kernel/admin-v1-official-isolation.mjs";
{


const root = new URL("../", import.meta.url);
const runId = "44444444-4444-4444-8444-444444444444";
const projectRef = "attestation-test-project";
const origin = "https://attestation-test-project.supabase.co";
const source = (name) => readFileSync(new URL(name, root), "utf8");
const sources = Object.fromEntries(["lib/supabase.ts", "lib/supabase-validation.ts",
  "app/api/admin/session/route.ts"].map((name) => [name, source(name)]));
let assertions = 0;
function fixture({ env = {}, admin = false } = {}) {
  const environment = { NEXT_PUBLIC_SUPABASE_URL: origin,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "SENTINEL_ANON_NEVER_RETURN",
    AIFINDER_VALIDATION_RUN_ID: runId, AIFINDER_VALIDATION_PROJECT_REF: projectRef, ...env };
  const calls = [], logs = [], cache = {};
  const context = vm.createContext({ process: { env: environment }, Object, Promise,
    console: { log: (...v) => logs.push(v), error: (...v) => logs.push(v), warn: (...v) => logs.push(v) } });
  function load(name) {
    if (cache[name]) return cache[name];
    const compiledModule = { exports: {} };
    const output = ts.transpileModule(sources[name], { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    } }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "server-only") return {};
      if (specifier === "@supabase/supabase-js") return { createClient(url, key) {
        calls.push({ url, key });return Object.freeze({});
      } };
      if (specifier === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (specifier.endsWith("admin-auth")) return { verifyAdminSession: () => ({ isAdmin: admin }) };
      if (specifier.endsWith("admin-v1-official-isolation.mjs")) return isolation;
      if (specifier.endsWith("supabase-validation")) return load("lib/supabase-validation.ts");
      if (specifier.endsWith("supabase")) return load("lib/supabase.ts");
      throw new Error(`Unexpected dependency: ${specifier}`);
    };
    vm.runInContext(`(function(require,module,exports){${output}\n})`, context)(localRequire, compiledModule, compiledModule.exports);
    cache[name] = compiledModule.exports;return compiledModule.exports;
  }
  const request = (headers = {}) => load("app/api/admin/session/route.ts").GET(
    new Request("https://preview.example/api/admin/session", { headers }));
  return { request, load, calls, logs, environment };
}
const mode = { "x-aifinder-validation": "client-origin-v1" };
for (const admin of [false, true]) {
  for (const markers of [true, false]) {
    for (const headers of [{}, { "x-aifinder-validation": "wrong-mode" }]) {
      const f = fixture({ admin, env: markers ? {} : {
        AIFINDER_VALIDATION_RUN_ID: undefined, AIFINDER_VALIDATION_PROJECT_REF: undefined } });
      const response = await f.request(headers);
      assert.equal(response.status, admin ? 200 : 401);
      assert.deepEqual(await response.json(), admin ? { authenticated: true, role: "admin" }
        : { authenticated: false, message: "Unauthorized." });
      assert.equal(f.calls.length, 0);assertions += 3;
    }
  }
}
for (const env of [{ AIFINDER_VALIDATION_RUN_ID: undefined }, { AIFINDER_VALIDATION_PROJECT_REF: undefined },
  { AIFINDER_VALIDATION_RUN_ID: "stale" }, { AIFINDER_VALIDATION_PROJECT_REF: "bad/ref" },
  { AIFINDER_VALIDATION_PROJECT_REF: "mtpisopvdxuvmpzbzqjw" },
  { NEXT_PUBLIC_SUPABASE_URL: "https://mtpisopvdxuvmpzbzqjw.supabase.co" },
  { NEXT_PUBLIC_SUPABASE_URL: "https://default-project.supabase.co" },
  { NEXT_PUBLIC_SUPABASE_URL: "https://user:secret@example.com" }]) {
  const f = fixture({ env, admin: true });
  const response = await f.request(mode);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { authenticated: false, message: "Unauthorized." });
  assert.deepEqual(f.logs, []);assertions += 3;
}
{
  const f = fixture();
  const response = await f.request({ ...mode, "x-aifinder-validation-run-id": "spoofed",
    "x-aifinder-validation-project-ref": "spoofed", "x-aifinder-validation-origin": "https://spoofed.example" });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.deepEqual(JSON.parse(body), { runId, projectRef, origin });
  assert.equal(f.calls[0].url, origin);
  assert.equal(f.calls[0].key, "SENTINEL_ANON_NEVER_RETURN");
  assert.doesNotMatch(body, /SENTINEL|secret|token|key|password|spoofed/u);
  assert.deepEqual(f.logs, []);
  assert.equal(response.headers.get("cache-control"), "no-store");assertions += 7;
}
{
  const f = fixture({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://default-project.supabase.co" } });
  f.load("lib/supabase.ts");
  f.environment.NEXT_PUBLIC_SUPABASE_URL = origin;
  const response = await f.request(mode);
  assert.equal(response.status, 401);
  assert.equal(f.calls.length, 1);assertions += 2;
}
{
  const f = fixture();f.load("lib/supabase.ts");
  f.environment.AIFINDER_VALIDATION_RUN_ID = "11111111-1111-4111-8111-111111111111";
  assert.equal((await f.request(mode)).status, 401);assertions += 1;
}
// The test has no real SDK, transport or credential source.
console.log(`PASS_ADMIN_VALIDATION_CLIENT_ATTESTATION assertions=${assertions} network=0 credential_reads=0`);
}
