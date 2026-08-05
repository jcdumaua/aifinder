import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { register } from "node:module";

const typescriptUrl = import.meta.resolve("typescript");
const hermeticLoaderSource = `
import { readFile } from "node:fs/promises";
import ts from ${JSON.stringify(typescriptUrl)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return nextResolve("next/server.js", context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && url.endsWith(".ts")) {
    const source = await readFile(new URL(url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: new URL(url).pathname,
      reportDiagnostics: true,
    });
    if (output.diagnostics?.length) {
      throw new Error("HERMETIC_TYPESCRIPT_TRANSPILE_FAILED");
    }
    return { format: "module", source: output.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
`;
register(
  `data:text/javascript,${encodeURIComponent(hermeticLoaderSource)}`,
  import.meta.url,
);

const FIXED_PASSWORD = "AIFINDER_FIXED_SYNTHETIC_ADMIN_PASSWORD_V1";
const FIXED_SECRET =
  "AIFINDER_FIXED_SYNTHETIC_SESSION_SECRET_V1_64_CHARACTERS_MINIMUM";
const FIXED_NOW = 1_800_000_000_000;
const SESSION_COOKIE = "aifinder_admin_session";
const CSRF_COOKIE = "aifinder_admin_csrf_token";

process.env.ADMIN_PASSWORD = FIXED_PASSWORD;
process.env.ADMIN_SESSION_SECRET = FIXED_SECRET;
process.env.NODE_ENV = "test";

const originalDateNow = Date.now;
Date.now = () => FIXED_NOW;

const capturedLogs = [];
console.info = (...parts) => capturedLogs.push(["info", ...parts]);
console.warn = (...parts) => capturedLogs.push(["warn", ...parts]);
console.error = (...parts) => capturedLogs.push(["error", ...parts]);

let forbiddenNetworkCalls = 0;
globalThis.fetch = async () => {
  forbiddenNetworkCalls += 1;
  throw new Error("HERMETIC_NETWORK_FORBIDDEN");
};

const hermeticPaths = [
  "app/api/admin/login/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/csrf/route.ts",
  "app/api/admin/logout/handler.ts",
  "app/api/admin/tools/handler.ts",
  "app/api/admin/submissions/handler.ts",
  "app/api/admin/upload-logo/handler.ts",
  "lib/admin-auth.ts",
  "lib/admin-rate-limit.ts",
  "lib/public-live-route-safety.ts",
  "lib/tool-validation.ts",
];

function sourceDigest() {
  const hash = createHash("sha256");
  for (const sourcePath of hermeticPaths) {
    hash.update(sourcePath).update("\0").update(readFileSync(sourcePath)).update("\0");
  }
  return hash.digest("hex");
}

const sourceDigestBefore = sourceDigest();

function sign(value) {
  return createHmac("sha256", FIXED_SECRET).update(value).digest("hex");
}

function fixedSession(expiresAt = FIXED_NOW + 60_000) {
  const payload = `admin:${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function request(method, body, headers = {}) {
  const options = { method, headers: new Headers(headers) };
  if (body !== undefined) options.body = body;
  return new Request("https://aifinder.invalid/api/admin/synthetic", options);
}

function jsonRequest(method, body, headers = {}) {
  return request(method, JSON.stringify(body), {
    "content-type": "application/json",
    ...headers,
  });
}

async function responseJson(response) {
  return response.json();
}

const ADMIN = Object.freeze({
  isAdmin: true,
  actor: Object.freeze({ id: "synthetic-admin", label: "Synthetic Admin" }),
  errors: Object.freeze([]),
});
const UNAUTHORIZED = Object.freeze({
  isAdmin: false,
  actor: null,
  errors: Object.freeze(["synthetic unauthorized"]),
});
const ALLOWED_RATE = Object.freeze({
  allowed: true,
  limit: 80,
  remaining: 79,
  resetAt: FIXED_NOW + 60_000,
  windowSeconds: 60,
});
const BLOCKED_RATE = Object.freeze({
  allowed: false,
  status: 429,
  limit: 80,
  remaining: 0,
  resetAt: FIXED_NOW + 60_000,
  retryAfterSeconds: 60,
  windowSeconds: 60,
  responseData: Object.freeze({
    error: "Too many admin requests. Please wait and try again.",
    metadata: Object.freeze({ retryAfterSeconds: 60 }),
  }),
});

let fakeDatabaseCalls = 0;
let fakeStorageCalls = 0;

function fakeClient(plans = []) {
  const queue = [...plans];
  const calls = [];
  const take = () => queue.shift() ?? { data: [], error: null, count: 0 };
  const chain = (result) => {
    let proxy;
    proxy = new Proxy({}, {
      get(_target, property) {
        if (property === "then") {
          return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
        }
        return (...args) => {
          calls.push([String(property), ...args]);
          fakeDatabaseCalls += 1;
          return proxy;
        };
      },
    });
    return proxy;
  };
  return {
    calls,
    from(table) {
      calls.push(["from", table]);
      fakeDatabaseCalls += 1;
      return chain(take());
    },
    async rpc(name, input) {
      calls.push(["rpc", name, input]);
      fakeDatabaseCalls += 1;
      return take();
    },
  };
}

function handlerDependencies(overrides = {}) {
  const audit = [];
  const client = overrides.client ?? fakeClient();
  return {
    audit,
    client,
    dependencies: {
      verifySession: overrides.verifySession ?? (() => ADMIN),
      verifyCsrf: overrides.verifyCsrf ?? (() => true),
      checkRateLimit: overrides.checkRateLimit ?? (() => ALLOWED_RATE),
      client,
      async writeAudit(input) {
        audit.push(input);
        if (overrides.auditFailure) throw new Error("synthetic audit failure");
      },
      now: () => new Date(FIXED_NOW),
    },
  };
}

function validToolBody(extra = {}) {
  return {
    name: "Synthetic Tool",
    category: "Coding",
    description: "Synthetic description",
    website: "https://synthetic-tool.invalid/",
    logo_url: "https://synthetic-tool.invalid/logo.png",
    pricing: "Free",
    ...extra,
  };
}

function pendingSubmission(extra = {}) {
  return {
    id: 41,
    name: "Synthetic Submission",
    category: "Coding",
    description: "Synthetic description",
    website: "https://synthetic-submission.invalid/",
    logo_url: "https://synthetic-submission.invalid/logo.png",
    pricing: "Free",
    status: "pending",
    ...extra,
  };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const result = new Uint8Array(12 + data.length);
  new DataView(result.buffer).setUint32(0, data.length, false);
  result.set(typeBytes, 4);
  result.set(data, 8);
  new DataView(result.buffer).setUint32(8 + data.length, crc32(result.slice(4, 8 + data.length)), false);
  return result;
}

function syntheticPng() {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 1, false);
  view.setUint32(4, 1, false);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const chunks = [pngChunk("IHDR", ihdr), pngChunk("IDAT", Uint8Array.of(0)), pngChunk("IEND", new Uint8Array())];
  const length = signature.length + chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of [signature, ...chunks]) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function logoRequest(file) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("https://aifinder.invalid/api/admin/upload-logo", {
    method: "POST",
    body: form,
  });
}

function fakeLogoStorage({ publicUrl = "https://storage.invalid/admin/fixed.png", uploadError = null, removeError = null } = {}) {
  const calls = [];
  return {
    calls,
    async upload(...args) {
      calls.push(["upload", ...args]);
      fakeStorageCalls += 1;
      return { error: uploadError };
    },
    async remove(...args) {
      calls.push(["remove", ...args]);
      fakeStorageCalls += 1;
      return { error: removeError };
    },
    getPublicUrl(objectName) {
      calls.push(["getPublicUrl", objectName]);
      fakeStorageCalls += 1;
      return { data: { publicUrl } };
    },
  };
}

const cases = [];
function add(group, name, execute) {
  cases.push({ group, name, execute });
}

let modules;
try {
  const [login, session, csrf, logout, tools, submissions, upload] = await Promise.all([
    import("../app/api/admin/login/route.ts"),
    import("../app/api/admin/session/route.ts"),
    import("../app/api/admin/csrf/route.ts"),
    import("../app/api/admin/logout/handler.ts"),
    import("../app/api/admin/tools/handler.ts"),
    import("../app/api/admin/submissions/handler.ts"),
    import("../app/api/admin/upload-logo/handler.ts"),
  ]);
  modules = { login, session, csrf, logout, tools, submissions, upload };
} catch {
  process.stdout.write("FAIL_ADMIN_V1_LAUNCH_CRITICAL_HERMETIC cases=55 failures=55 internal_failures=1\n");
  process.exit(1);
}

add("login", "login_wrong_media_type", async () => {
  const response = await modules.login.POST(request("POST", "password", { "content-type": "text/plain", "x-forwarded-for": "203.0.113.1" }));
  assert.equal(response.status, 415);
});
add("login", "login_malformed_json", async () => {
  const response = await modules.login.POST(request("POST", "{", { "content-type": "application/json", "x-forwarded-for": "203.0.113.2" }));
  assert.equal(response.status, 400);
});
add("login", "login_oversize_input", async () => {
  const response = await modules.login.POST(request("POST", "{}", { "content-type": "application/json", "content-length": "5121", "x-forwarded-for": "203.0.113.3" }));
  assert.equal(response.status, 413);
});
add("login", "login_missing_fixed_configuration", async () => {
  process.env.ADMIN_PASSWORD = "";
  const response = await modules.login.POST(jsonRequest("POST", { password: FIXED_PASSWORD }, { "x-forwarded-for": "203.0.113.4" }));
  process.env.ADMIN_PASSWORD = FIXED_PASSWORD;
  assert.equal(response.status, 500);
});
add("login", "login_invalid_credentials", async () => {
  const response = await modules.login.POST(jsonRequest("POST", { password: "synthetic-invalid" }, { "x-forwarded-for": "203.0.113.5" }));
  assert.equal(response.status, 401);
});
add("login", "login_rate_limited", async () => {
  let response;
  for (let attempt = 0; attempt < 11; attempt += 1) {
    response = await modules.login.POST(jsonRequest("POST", { password: "synthetic-invalid" }, { "x-forwarded-for": "203.0.113.250" }));
  }
  assert.equal(response.status, 429);
});
add("login", "login_valid_sets_session_cookie", async () => {
  const response = await modules.login.POST(jsonRequest("POST", { password: FIXED_PASSWORD }, { "x-forwarded-for": "203.0.113.6" }));
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.equal(response.status, 200);
  assert(cookie.includes(`${SESSION_COOKIE}=admin%3A`));
  assert(cookie.includes("HttpOnly"));
  assert(cookie.includes("SameSite=strict"));
});
add("login", "login_valid_response_is_bounded", async () => {
  const response = await modules.login.POST(jsonRequest("POST", { password: FIXED_PASSWORD }, { "x-forwarded-for": "203.0.113.7" }));
  assert.deepEqual(await responseJson(response), { success: true, message: "Admin login successful." });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

add("session", "session_missing_cookie", async () => {
  const response = await modules.session.GET(request("GET"));
  assert.equal(response.status, 401);
});
add("session", "session_invalid_and_expired_cookie", async () => {
  const invalid = await modules.session.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=invalid` }));
  const expired = await modules.session.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=${fixedSession(FIXED_NOW - 1)}` }));
  assert.equal(invalid.status, 401);
  assert.equal(expired.status, 401);
});
add("session", "session_valid_signed_cookie", async () => {
  const response = await modules.session.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=${fixedSession()}` }));
  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { authenticated: true, role: "admin" });
});

add("csrf", "csrf_unauthorized_missing_cookie", async () => {
  const response = await modules.csrf.GET(request("GET"));
  assert.equal(response.status, 401);
});
add("csrf", "csrf_unauthorized_invalid_cookie", async () => {
  const response = await modules.csrf.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=invalid` }));
  assert.equal(response.status, 401);
});
add("csrf", "csrf_authorized_deterministic_token", async () => {
  const sessionValue = fixedSession();
  const expected = sign(`csrf:${sessionValue}`);
  const response = await modules.csrf.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=${sessionValue}` }));
  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).csrfToken, expected);
  assert((response.headers.get("set-cookie") ?? "").includes(`${CSRF_COOKIE}=${expected}`));
});
add("csrf", "csrf_existing_valid_token_reused", async () => {
  const sessionValue = fixedSession();
  const expected = sign(`csrf:${sessionValue}`);
  const response = await modules.csrf.GET(request("GET", undefined, { cookie: `${SESSION_COOKIE}=${sessionValue}; ${CSRF_COOKIE}=${expected}` }));
  assert.equal((await responseJson(response)).csrfToken, expected);
});

add("logout", "logout_unauthorized_before_audit_or_cookie", async () => {
  let audit = 0;
  let clears = 0;
  const handler = modules.logout.createLogoutHandler({ verifySession: () => UNAUTHORIZED, verifyCsrf: () => true, writeAudit: async () => { audit += 1; }, clearAdminCookies: () => { clears += 1; } });
  const response = await handler(request("POST"));
  assert.equal(response.status, 401);
  assert.equal(audit + clears, 0);
});
add("logout", "logout_missing_csrf_before_audit_or_cookie", async () => {
  let audit = 0;
  let clears = 0;
  const handler = modules.logout.createLogoutHandler({ verifySession: () => ADMIN, verifyCsrf: () => false, writeAudit: async () => { audit += 1; }, clearAdminCookies: () => { clears += 1; } });
  const response = await handler(request("POST"));
  assert.equal(response.status, 403);
  assert.equal(audit + clears, 0);
});
add("logout", "logout_audit_failure_is_best_effort", async () => {
  let clears = 0;
  const handler = modules.logout.createLogoutHandler({ verifySession: () => ADMIN, verifyCsrf: () => true, writeAudit: async () => { throw new Error("synthetic audit failure"); }, clearAdminCookies: () => { clears += 1; } });
  const response = await handler(request("POST"));
  assert.equal(response.status, 200);
  assert.equal(clears, 1);
});
add("logout", "logout_success_clears_both_cookie_names", async () => {
  const cleared = [];
  const handler = modules.logout.createLogoutHandler({ verifySession: () => ADMIN, verifyCsrf: () => true, writeAudit: async () => {}, clearAdminCookies: (response) => {
    response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(CSRF_COOKIE, "", { maxAge: 0, path: "/" });
    cleared.push(SESSION_COOKIE, CSRF_COOKIE);
  } });
  const response = await handler(request("POST"));
  assert.equal(response.status, 200);
  assert.deepEqual(cleared, [SESSION_COOKIE, CSRF_COOKIE]);
});

add("tools", "tools_unauthorized_before_client", async () => {
  const state = handlerDependencies({ verifySession: () => UNAUTHORIZED });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 401);
  assert.equal(state.client.calls.length, 0);
});
add("tools", "tools_missing_csrf_before_client", async () => {
  const state = handlerDependencies({ verifyCsrf: () => false });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).POST(jsonRequest("POST", validToolBody()));
  assert.equal(response.status, 403);
  assert.equal(state.client.calls.length, 0);
});
add("tools", "tools_rate_limited_before_client", async () => {
  const state = handlerDependencies({ checkRateLimit: () => BLOCKED_RATE });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 429);
  assert.equal(state.client.calls.length, 0);
});
add("tools", "tools_get_success", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [{ id: 1, name: "Synthetic" }], error: null }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).tools.length, 1);
});
add("tools", "tools_get_error_mapping", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: null, error: { code: "SYNTHETIC" } }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 500);
});
add("tools", "tools_post_bounded_validation", async () => {
  const state = handlerDependencies();
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).POST(request("POST", "{}", { "content-type": "text/plain" }));
  assert.equal(response.status, 400);
  assert.equal(state.client.calls.length, 0);
});
add("tools", "tools_post_duplicate_domain", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [{ id: 1 }], error: null }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).POST(jsonRequest("POST", validToolBody()));
  assert.equal(response.status, 409);
});
add("tools", "tools_post_success_with_audit", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [], error: null }, { error: null }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).POST(jsonRequest("POST", validToolBody()));
  assert.equal(response.status, 200);
  assert.equal(state.audit.length, 1);
});
add("tools", "tools_post_audit_failure_is_best_effort", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [], error: null }, { error: null }]), auditFailure: true });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).POST(jsonRequest("POST", validToolBody({ name: "Synthetic Audit Tool" })));
  assert.equal(response.status, 200);
});
add("tools", "tools_put_success", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [], error: null }, { data: { id: 7 }, error: null }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).PUT(jsonRequest("PUT", validToolBody({ id: 7 })));
  assert.equal(response.status, 200);
});
add("tools", "tools_delete_success_with_deterministic_time", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: { id: 7, name: "Synthetic", website: "https://synthetic.invalid/" }, error: null }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).DELETE(jsonRequest("DELETE", { id: 7 }));
  assert.equal(response.status, 200);
  assert(state.client.calls.some((call) => call[0] === "update" && call[1].deleted_at === new Date(FIXED_NOW).toISOString()));
});
add("tools", "tools_put_not_found_mapping", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [], error: null }, { data: null, error: { code: "SYNTHETIC" } }]) });
  const response = await modules.tools.createAdminToolsHandler(state.dependencies).PUT(jsonRequest("PUT", validToolBody({ id: 9 })));
  assert.equal(response.status, 404);
});

add("submissions", "submissions_unauthorized_before_client", async () => {
  const state = handlerDependencies({ verifySession: () => UNAUTHORIZED });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 401);
  assert.equal(state.client.calls.length, 0);
});
add("submissions", "submissions_missing_csrf_before_client", async () => {
  const state = handlerDependencies({ verifyCsrf: () => false });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PATCH(jsonRequest("PATCH", { submissionId: 1 }));
  assert.equal(response.status, 403);
  assert.equal(state.client.calls.length, 0);
});
add("submissions", "submissions_rate_limited_before_client", async () => {
  const state = handlerDependencies({ checkRateLimit: () => BLOCKED_RATE });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 429);
  assert.equal(state.client.calls.length, 0);
});
add("submissions", "submissions_get_success_and_stats", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [pendingSubmission()], error: null }, { count: 4, error: null }, { count: 1, error: null }, { count: 2, error: null }, { count: 1, error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).GET(request("GET"));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.deepEqual(body.stats, { totalTools: 4, pendingSubmissions: 1, approvedSubmissions: 2, rejectedSubmissions: 1 });
});
add("submissions", "submissions_get_error_mapping", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: null, error: { code: "SYNTHETIC" } }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).GET(request("GET"));
  assert.equal(response.status, 500);
});
add("submissions", "submissions_post_invalid_body", async () => {
  const state = handlerDependencies();
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).POST(jsonRequest("POST", { submissionId: 0 }));
  assert.equal(response.status, 400);
});
add("submissions", "submissions_post_duplicate_live_domain", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: pendingSubmission(), error: null }, { data: [{ id: 1, name: "Existing" }], error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).POST(jsonRequest("POST", { submissionId: 41 }));
  assert.equal(response.status, 409);
});
add("submissions", "submissions_post_approval_success", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: pendingSubmission(), error: null }, { data: [], error: null }, { error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).POST(jsonRequest("POST", { submissionId: 41 }));
  assert.equal(response.status, 200);
  assert.equal(state.audit.length, 1);
});
add("submissions", "submissions_post_audit_failure_best_effort", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: pendingSubmission(), error: null }, { data: [], error: null }, { error: null }]), auditFailure: true });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).POST(jsonRequest("POST", { submissionId: 41 }));
  assert.equal(response.status, 200);
});
add("submissions", "submissions_put_success", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [], error: null }, { data: { id: 41 }, error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PUT(jsonRequest("PUT", validToolBody({ id: 41 })));
  assert.equal(response.status, 200);
});
add("submissions", "submissions_put_duplicate_pending_domain", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: [], error: null }, { data: [{ id: 42, name: "Other", status: "pending" }], error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PUT(jsonRequest("PUT", validToolBody({ id: 41 })));
  assert.equal(response.status, 409);
});
add("submissions", "submissions_patch_rejection_success", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: { id: 41, name: "Synthetic", website: "https://synthetic.invalid/" }, error: null }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PATCH(jsonRequest("PATCH", { submissionId: 41 }));
  assert.equal(response.status, 200);
  assert.equal(state.audit.length, 1);
});
add("submissions", "submissions_patch_not_found_mapping", async () => {
  const state = handlerDependencies({ client: fakeClient([{ data: null, error: { code: "SYNTHETIC" } }]) });
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PATCH(jsonRequest("PATCH", { submissionId: 41 }));
  assert.equal(response.status, 404);
});
add("submissions", "submissions_put_bounded_validation", async () => {
  const state = handlerDependencies();
  const response = await modules.submissions.createAdminSubmissionsHandler(state.dependencies).PUT(request("PUT", "{}", { "content-type": "text/plain" }));
  assert.equal(response.status, 400);
  assert.equal(state.client.calls.length, 0);
});

function uploadHandler(overrides = {}) {
  const storage = overrides.storage ?? fakeLogoStorage();
  const audit = [];
  return {
    storage,
    audit,
    handler: modules.upload.createAdminUploadLogoHandler({
      verifySession: overrides.verifySession ?? (() => ADMIN),
      verifyCsrf: overrides.verifyCsrf ?? (() => true),
      checkRateLimit: overrides.checkRateLimit ?? (() => ALLOWED_RATE),
      storage,
      async writeAudit(input) {
        audit.push(input);
        if (overrides.auditFailure) throw new Error("synthetic audit failure");
      },
      createObjectName: () => "admin/fixed.png",
    }).POST,
  };
}

add("upload_logo", "upload_unauthorized_before_storage", async () => {
  const state = uploadHandler({ verifySession: () => UNAUTHORIZED });
  const response = await state.handler(request("POST"));
  assert.equal(response.status, 401);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_missing_csrf_before_storage", async () => {
  const state = uploadHandler({ verifyCsrf: () => false });
  const response = await state.handler(request("POST"));
  assert.equal(response.status, 403);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rate_limited_before_storage", async () => {
  const state = uploadHandler({ checkRateLimit: () => BLOCKED_RATE });
  const response = await state.handler(request("POST"));
  assert.equal(response.status, 429);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rejects_wrong_media_type", async () => {
  const state = uploadHandler();
  const response = await state.handler(request("POST", "body", { "content-type": "text/plain" }));
  assert.equal(response.status, 415);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rejects_missing_file", async () => {
  const state = uploadHandler();
  const response = await state.handler(logoRequest());
  assert.equal(response.status, 400);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rejects_disallowed_type", async () => {
  const state = uploadHandler();
  const response = await state.handler(logoRequest(new File(["synthetic"], "logo.gif", { type: "image/gif" })));
  assert.equal(response.status, 400);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rejects_oversize_file", async () => {
  const state = uploadHandler();
  const response = await state.handler(logoRequest(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "logo.png", { type: "image/png" })));
  assert.equal(response.status, 400);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_rejects_invalid_structure", async () => {
  const state = uploadHandler();
  const response = await state.handler(logoRequest(new File(["not-a-png"], "logo.png", { type: "image/png" })));
  assert.equal(response.status, 400);
  assert.equal(state.storage.calls.length, 0);
});
add("upload_logo", "upload_positive_uses_deterministic_fake_storage", async () => {
  const state = uploadHandler();
  const response = await state.handler(logoRequest(new File([syntheticPng()], "logo.png", { type: "image/png" })));
  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).logoUrl, "https://storage.invalid/admin/fixed.png");
  assert.equal(state.audit.length, 1);
  assert(state.storage.calls.some((call) => call[0] === "upload" && call[1] === "admin/fixed.png"));
});
add("upload_logo", "upload_post_upload_failure_cleans_up", async () => {
  const state = uploadHandler({ auditFailure: true });
  const response = await state.handler(logoRequest(new File([syntheticPng()], "logo.png", { type: "image/png" })));
  assert.equal(response.status, 500);
  assert(state.storage.calls.some((call) => call[0] === "remove" && call[1][0] === "admin/fixed.png"));
});

const expectedCounts = { login: 8, session: 3, csrf: 4, logout: 4, tools: 12, submissions: 14, upload_logo: 10 };
assert.equal(cases.length, 55);
for (const [group, count] of Object.entries(expectedCounts)) {
  assert.equal(cases.filter((testCase) => testCase.group === group).length, count);
  assert.equal(new Set(cases.filter((testCase) => testCase.group === group).map((testCase) => testCase.name)).size, count);
}

let failures = 0;
for (const testCase of cases) {
  try {
    await testCase.execute();
  } catch {
    failures += 1;
  }
}

Date.now = originalDateNow;
assert.equal(sourceDigest(), sourceDigestBefore);
assert.equal(forbiddenNetworkCalls, 0);
assert(fakeDatabaseCalls > 0);
assert(fakeStorageCalls > 0);
for (const entry of capturedLogs) {
  const rendered = entry.map(String).join(" ");
  assert(!rendered.includes(FIXED_PASSWORD));
  assert(!rendered.includes(FIXED_SECRET));
  assert(!rendered.includes(SESSION_COOKIE + "="));
}

if (failures > 0) {
  process.stdout.write(`FAIL_ADMIN_V1_LAUNCH_CRITICAL_HERMETIC cases=55 pass=${55 - failures} fail=${failures} internal_failures=0\n`);
  process.exit(1);
}

process.stdout.write("PASS_ADMIN_V1_LAUNCH_CRITICAL_HERMETIC cases=55 login=8 session=3 csrf=4 logout=4 tools=12 submissions=14 upload_logo=10 fake_database_calls_recorded=true fake_storage_calls_recorded=true real_database=0 real_supabase=0 real_storage=0 network=0 browser=0 failures=0 internal_failures=0\n");
