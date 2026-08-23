import assert from "node:assert/strict";
import { sha256Hex } from "./canonical.mjs";
import {
  createConcreteLivePlatform,
  createConcreteLiveTransport,
} from "./nonproduction-qualification-live-platform.mjs";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const COMMIT = "a".repeat(40);
const GIT_REMOTE_URL = "https://github.com/jcdumaua/aifinder.git";
const GIT_EXECUTION_CONTEXT = Object.freeze({
  git_dir: "/private/tmp/aifinder-qualified-git-context",
  object_directory: "/Users/jamescarlodumaua/aifinder/.git/objects",
});
const STORAGE_CREATED_AT = "2030-01-01T00:00:00.000Z";
const SYNTHETIC_PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const authorization = {
  candidate_identity_sha256: "2".repeat(64),
  run_id: RUN_ID,
  repository: {
    root: "/Users/jamescarlodumaua/aifinder",
    remote_repository: "jcdumaua/aifinder",
  },
  execution: {
    branch_name: `aifinder-qualification-${RUN_ID}`,
    temporary_commit_sha: COMMIT,
    preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    preview_project_name: "aifinder",
    preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    preview_team_slug: "ai-finder-s-projects",
    fixture_website: `https://${RUN_ID}.invalid/`,
    fixture_name: `AiFinder qualification ${RUN_ID}`,
    supabase_origin_sha256:
      "6bce0afffdc84e79e2971a5dfc7b1228749b214debbf38ea54c5392f873b16d8",
    supabase_project_ref_sha256:
      "b3cc0475bb78a5026098858e9889acf666d31062d513d303314eca31d36e72f2",
    storage_bucket: "tool-logos",
    storage_name: `admin/${RUN_ID}.png`,
    environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    staging_checks: [
      { method: "GET", path: "/", status: 200 },
      { method: "GET", path: "/api/admin/session", status: 401 },
    ],
  },
};
const credentials = {
  github_token: "synthetic-github-secret",
  vercel_token: "synthetic-vercel-secret",
  supabase_url: "https://synthetic.supabase.co",
  supabase_anon_key: "synthetic-anon-secret",
  supabase_service_role_key: "synthetic-service-secret",
  admin_password: "synthetic-admin-password",
  admin_session_secret: "synthetic-session-secret",
};

function resource(resource_type, locator) {
  return {
    resource_type,
    resource_key: `${RUN_ID}:${resource_type}:${sha256Hex(JSON.stringify(locator))}`,
    locator,
    owner: {
      locator_sha256: sha256Hex(JSON.stringify(locator)),
      cleanup_policy: resource_type === "PREVIEW_DEPLOYMENT"
        ? "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW"
        : "DELETE_EXACT",
    },
  };
}

const branch = resource("GIT_BRANCH", {
  repository: "jcdumaua/aifinder",
  branch: authorization.execution.branch_name,
  expected_commit_sha256: sha256Hex(COMMIT),
});
const preview = resource("PREVIEW_DEPLOYMENT", {
  deployment_id: RUN_ID,
  project_id: authorization.execution.preview_project_id,
});
const environment = resource("ENVIRONMENT_RECORD", {
  project_id: authorization.execution.preview_project_id,
  key: "ADMIN_PASSWORD+ADMIN_SESSION_SECRET",
  target: authorization.execution.branch_name,
});
const database = resource("DATABASE_ROW", {
  relation: "submitted_tools",
  id: authorization.execution.fixture_website,
});
const storage = resource("STORAGE_OBJECT", {
  bucket: "tool-logos",
  name: authorization.execution.storage_name,
});

function exactPreviewDeployment(overrides = {}) {
  return {
    id: `dpl_${RUN_ID}`,
    url: `${RUN_ID}.vercel.app`,
    target: null,
    readyState: "READY",
    projectId: authorization.execution.preview_project_id,
    name: authorization.execution.preview_project_name,
    teamId: authorization.execution.preview_team_id,
    gitSource: {
      type: "github",
      repo: authorization.repository.remote_repository,
      ref: authorization.execution.branch_name,
      sha: authorization.execution.temporary_commit_sha,
    },
    meta: {
      aifinderRunId: RUN_ID,
      aifinderCandidate: authorization.candidate_identity_sha256,
    },
    ...overrides,
  };
}

const failures = [];
let assertions = 0;
async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

await check("system transport exposes only exact Git ref operations", async () => {
  const calls = [];
  const outputs = [
    { status: 0, stdout: "", stderr: "" },
    { status: 0, stdout: "", stderr: "" },
    {
      status: 0,
      stdout: `To github.com:jcdumaua/aifinder.git\n*\t${COMMIT}:refs/heads/${authorization.execution.branch_name}\t[new branch]\nDone\n`,
      stderr: "",
    },
    {
      status: 0,
      stdout: `${COMMIT}\trefs/heads/${authorization.execution.branch_name}\n`,
      stderr: "",
    },
    {
      status: 0,
      stdout: `${COMMIT}\trefs/heads/${authorization.execution.branch_name}\n`,
      stderr: "",
    },
    { status: 0, stdout: "", stderr: "" },
    { status: 0, stdout: "", stderr: "" },
  ];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync(command, args, options) {
      calls.push({
        command,
        args: [...args],
        cwd: options.cwd,
        env: { ...options.env },
      });
      return outputs.shift();
    },
  });
  assert.deepEqual(
    await transport.git.inspect({ authorization, credentials }),
    { status: "ABSENT" },
  );
  assert.deepEqual(
    await transport.git.create({ authorization, credentials }),
    { status: "CREATED_EXACT", commit_sha: COMMIT },
  );
  assert.deepEqual(
    await transport.git.delete({ authorization, credentials, commit_sha: COMMIT }),
    { status: "DELETED_EXACT" },
  );
  assert.equal(calls.every((entry) => entry.command === "/usr/bin/git"), true);
  const configChecks = calls.filter((entry) => entry.args[0] === "config");
  const gitOperations = calls;
  assert.equal(configChecks.length, 0);
  assert.equal(gitOperations.length, 7);
  assert.equal(
    gitOperations.every((entry) =>
      entry.args.includes(
        "--config-env=http.extraHeader=AIFINDER_GIT_HTTP_AUTHORIZATION",
      ) &&
      entry.args.includes("-c") &&
      entry.args.includes("core.hooksPath=/dev/null") &&
      entry.args.includes(`url.${GIT_REMOTE_URL}.insteadOf=${GIT_REMOTE_URL}`) &&
      entry.args.includes(`url.${GIT_REMOTE_URL}.pushInsteadOf=${GIT_REMOTE_URL}`)
    ),
    true,
  );
  assert.equal(
    gitOperations.some((entry) => entry.args.join(" ").includes(credentials.github_token)),
    false,
  );
  assert.equal(
    gitOperations.every((entry) =>
      entry.env.GIT_TERMINAL_PROMPT === "0" &&
      entry.env.GIT_DIR === GIT_EXECUTION_CONTEXT.git_dir &&
      entry.env.GIT_OBJECT_DIRECTORY === GIT_EXECUTION_CONTEXT.object_directory &&
      entry.env.GIT_CONFIG_GLOBAL === "/dev/null" &&
      entry.env.GIT_CONFIG_SYSTEM === "/dev/null" &&
      entry.env.AIFINDER_GIT_HTTP_AUTHORIZATION.startsWith("Authorization: Basic ")
    ),
    true,
  );
  assert.equal(gitOperations.some((entry) => entry.args.includes("add")), false);
  assert.equal(gitOperations.some((entry) => entry.args.join(" ").includes("refs/heads/main")), false);
  assert.equal(gitOperations.every((entry) => entry.args.includes(GIT_REMOTE_URL)), true);
  assert.equal(gitOperations.some((entry) => entry.args.includes("origin")), false);
  assert.equal(
    gitOperations
      .filter((entry) => entry.args.includes("push"))
      .every((entry) => entry.args.includes("--no-verify")),
    true,
  );
  assert.equal(
    gitOperations[2].args.includes(
      `--force-with-lease=refs/heads/${authorization.execution.branch_name}:`,
    ),
    true,
  );
  assert.equal(
    gitOperations[5].args.includes(
      `--force-with-lease=refs/heads/${authorization.execution.branch_name}:${COMMIT}`,
    ),
    true,
  );
  assert.equal(
    gitOperations[2].args.at(-1),
    `${COMMIT}:refs/heads/${authorization.execution.branch_name}`,
  );
});


await check("Git create accepts bounded push stderr when exact postcondition confirms branch", async () => {
  const outputs = [
    { status: 0, stdout: "", stderr: "" },
    {
      status: 0,
      stdout: `To github.com:jcdumaua/aifinder.git\n*\t${COMMIT}:refs/heads/${authorization.execution.branch_name}\t[new branch]\nDone\n`,
      stderr: "remote: informational message\n",
    },
    {
      status: 0,
      stdout: `${COMMIT}\trefs/heads/${authorization.execution.branch_name}\n`,
      stderr: "",
    },
  ];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync() {
      return outputs.shift();
    },
  });
  assert.deepEqual(
    await transport.git.create({ authorization, credentials }),
    { status: "CREATED_EXACT", commit_sha: COMMIT },
  );
  assert.equal(outputs.length, 0);
});

await check("Git delete accepts bounded push stderr when exact postcondition confirms absence", async () => {
  const outputs = [
    {
      status: 0,
      stdout: `${COMMIT}\trefs/heads/${authorization.execution.branch_name}\n`,
      stderr: "",
    },
    {
      status: 0,
      stdout: `To github.com:jcdumaua/aifinder.git\n-\t:refs/heads/${authorization.execution.branch_name}\t[deleted]\nDone\n`,
      stderr: "remote: informational message\n",
    },
    { status: 0, stdout: "", stderr: "" },
  ];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync() {
      return outputs.shift();
    },
  });
  assert.deepEqual(
    await transport.git.delete({ authorization, credentials, commit_sha: COMMIT }),
    { status: "DELETED_EXACT" },
  );
  assert.equal(outputs.length, 0);
});

await check("Git read operations still reject nonempty stderr", async () => {
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync() {
      return {
        status: 0,
        stdout: "",
        stderr: "remote: unexpected read-side message\n",
      };
    },
  });
  await assert.rejects(
    transport.git.inspect({ authorization, credentials }),
    (error) => error?.code === "CONCRETE_GIT_OPERATION_FAILED",
  );
});

await check("Git push still rejects a nonzero exit", async () => {
  const outputs = [
    { status: 0, stdout: "", stderr: "" },
    {
      status: 1,
      stdout: `To github.com:jcdumaua/aifinder.git\n!\t${COMMIT}:refs/heads/${authorization.execution.branch_name}\t[rejected]\nDone\n`,
      stderr: "remote: rejected\n",
    },
  ];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync() {
      return outputs.shift();
    },
  });
  await assert.rejects(
    transport.git.create({ authorization, credentials }),
    (error) => error?.code === "CONCRETE_GIT_OPERATION_FAILED",
  );
});

await check("credentialed Git consumes only the prepared immutable execution context", async () => {
  const calls = [];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync(command, args, options) {
      calls.push({
        command,
        args: [...args],
        cwd: options.cwd,
        env: { ...options.env },
      });
      if (args[0] === "config") {
        return {
          status: 0,
          stdout: "core.repositoryformatversion\0",
          stderr: "",
        };
      }
      return { status: 0, stdout: "", stderr: "" };
    },
  });
  assert.deepEqual(
    await transport.git.inspect({ authorization, credentials }),
    { status: "ABSENT" },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args.includes("config"), false);
  assert.equal(calls[0].cwd, "/");
  assert.equal(calls[0].env.GIT_DIR, GIT_EXECUTION_CONTEXT.git_dir);
  assert.equal(
    calls[0].env.GIT_OBJECT_DIRECTORY,
    GIT_EXECUTION_CONTEXT.object_directory,
  );
});

await check("Git never performs a mutable repository-local config preflight", async () => {
  const calls = [];
  const transport = createConcreteLiveTransport({
    git_execution_context: GIT_EXECUTION_CONTEXT,
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync(command, args, options) {
      calls.push({ command, args: [...args], env: { ...options.env } });
      return { status: 0, stdout: "", stderr: "" };
    },
  });
  assert.deepEqual(
    await transport.git.inspect({ authorization, credentials }),
    { status: "ABSENT" },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args.includes("config"), false);
  assert.equal(calls[0].cwd, undefined);
});

await check("Git rejects a missing immutable execution context before attaching credentials", async () => {
  const calls = [];
  const transport = createConcreteLiveTransport({
    fetch_impl: async () => {
      throw new Error("NETWORK_NOT_EXPECTED");
    },
    spawn_sync(command, args, options) {
      calls.push({ command, args: [...args], env: { ...options.env } });
      return {
        status: 0,
        stdout: "extensions.worktreeconfig\0",
        stderr: "",
      };
    },
  });
  await assert.rejects(
    transport.git.inspect({ authorization, credentials }),
    (error) => error?.code === "CONCRETE_GIT_CONTEXT_INVALID",
  );
  assert.equal(calls.length, 0);
});

await check("system transport reads exact Storage bytes without JSON coercion", async () => {
  const fetchCalls = [];
  const transport = createConcreteLiveTransport({
    async fetch_impl(url, init) {
      fetchCalls.push({ url, init });
      const bytes = Uint8Array.from(SYNTHETIC_PNG_BYTES);
      return {
        status: 200,
        async arrayBuffer() {
          return bytes.buffer;
        },
        async text() {
          throw new Error("TEXT_NOT_EXPECTED");
        },
      };
    },
    spawn_sync: () => {
      throw new Error("GIT_NOT_EXPECTED");
    },
  });
  const response = await transport.request({
    service: "SUPABASE_SERVICE",
    method: "GET",
    path: `/storage/v1/object/authenticated/tool-logos/${authorization.execution.storage_name}`,
    headers: { accept: "image/png" },
    operation: "STORAGE_DOWNLOAD",
    response_kind: "BYTES",
    credentials,
  });
  assert.equal(response.status, 200);
  assert.equal(Buffer.isBuffer(response.body), true);
  assert.deepEqual(response.body, SYNTHETIC_PNG_BYTES);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].init.headers.accept, "image/png");
});

await check("system transport projects only bounded application response headers", async () => {
  const values = new Map(Object.entries({
    allow: "GET, POST, PUT, DELETE",
    "cache-control": "no-store",
    "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    "content-type": "application/json",
    "cross-origin-opener-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-dns-prefetch-control": "off",
    "x-frame-options": "DENY",
  }));
  const setCookies = [
    "aifinder_admin_session=opaque-session; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400",
    "aifinder_admin_csrf_token=opaque-csrf; Path=/; Secure; SameSite=Strict; Max-Age=14400",
  ];
  const transport = createConcreteLiveTransport({
    async fetch_impl() {
      return {
        status: 200,
        headers: {
          get(name) {
            return values.get(name.toLowerCase()) ?? null;
          },
          getSetCookie() {
            return [...setCookies];
          },
        },
        async text() {
          return '{"success":true}';
        },
      };
    },
  });
  const response = await transport.request({
    service: "PREVIEW",
    method: "GET",
    path: "https://synthetic-preview.invalid/api/admin/session",
    credentials,
    operation: "application_request",
  });
  assert.deepEqual(response.response_headers, {
    allow: values.get("allow"),
    cache_control: values.get("cache-control"),
    content_security_policy: values.get("content-security-policy"),
    content_type: values.get("content-type"),
    cross_origin_opener_policy: values.get("cross-origin-opener-policy"),
    permissions_policy: values.get("permissions-policy"),
    referrer_policy: values.get("referrer-policy"),
    set_cookie: setCookies.map((value) => Buffer.from(value, "latin1")),
    strict_transport_security: values.get("strict-transport-security"),
    x_content_type_options: values.get("x-content-type-options"),
    x_dns_prefetch_control: values.get("x-dns-prefetch-control"),
    x_frame_options: values.get("x-frame-options"),
  });
  for (const cookie of response.response_headers.set_cookie) cookie.fill(0);
});

await check("system transport rejects JSON above the exact byte ceiling", async () => {
  const oversized = `{"error":"${"x".repeat(1024 * 1024)}"}`;
  const transport = createConcreteLiveTransport({
    async fetch_impl() {
      return {
        status: 200,
        headers: {
          get(name) {
            if (name.toLowerCase() === "content-length") {
              return String(Buffer.byteLength(oversized, "utf8"));
            }
            return null;
          },
          getSetCookie: () => [],
        },
        async text() {
          return oversized;
        },
      };
    },
  });
  await assert.rejects(
    transport.request({
      service: "PREVIEW",
      method: "GET",
      path: "https://synthetic-preview.invalid/api/admin/session",
      credentials,
      operation: "application_request",
    }),
    (error) => error?.code === "CONCRETE_NETWORK_RESPONSE_INVALID",
  );
});

await check("system transport enforces the JSON byte ceiling without Content-Length", async () => {
  let cancelled = false;
  const chunks = [
    new Uint8Array(512 * 1024),
    new Uint8Array(512 * 1024 + 1),
  ];
  const transport = createConcreteLiveTransport({
    async fetch_impl() {
      return {
        status: 200,
        headers: { get: () => null, getSetCookie: () => [] },
        body: {
          getReader() {
            return {
              async read() {
                return chunks.length === 0
                  ? { done: true, value: undefined }
                  : { done: false, value: chunks.shift() };
              },
              async cancel() {
                cancelled = true;
              },
            };
          },
        },
        async text() {
          throw new Error("STREAM_PATH_REQUIRED");
        },
      };
    },
  });
  await assert.rejects(
    transport.request({
      service: "PREVIEW",
      method: "GET",
      path: "https://synthetic-preview.invalid/api/admin/session",
      credentials,
      operation: "application_request",
    }),
    (error) => error?.code === "CONCRETE_NETWORK_RESPONSE_INVALID",
  );
  assert.equal(cancelled, true);
});

await check("system transport preserves bounded FormData for application upload", async () => {
  const form = new FormData();
  form.set("file", new Blob([SYNTHETIC_PNG_BYTES], { type: "image/png" }), "official.png");
  let observed = false;
  const transport = createConcreteLiveTransport({
    async fetch_impl(_url, init) {
      observed = true;
      assert.equal(init.body, form);
      assert.equal(Object.hasOwn(init.headers, "content-type"), false);
      return {
        status: 200,
        headers: { get: () => null, getSetCookie: () => [] },
        async text() {
          return '{"success":true,"logoUrl":"https://synthetic.invalid/logo.png"}';
        },
      };
    },
  });
  await transport.request({
    service: "PREVIEW",
    method: "POST",
    path: "https://synthetic-preview.invalid/api/admin/upload-logo",
    body: form,
    credentials,
    operation: "application_request",
  });
  assert.equal(observed, true);
});

await check("environment inspection preserves a denied response as a safe categorical class", async () => {
  const transport = createConcreteLiveTransport({
    fetch_impl: async () => ({
      status: 403,
      async text() {
        return "raw-provider-response-must-not-escape";
      },
    }),
    spawn_sync: () => {
      throw new Error("GIT_NOT_EXPECTED");
    },
  });
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.inspectFresh(environment),
    (error) =>
      error?.code === "CONCRETE_ENVIRONMENT_INSPECTION_FAILED" &&
      error?.provider_response_class === "AUTHORIZATION_DENIED" &&
      !JSON.stringify(error).includes("raw-provider-response-must-not-escape"),
  );
});

await check("environment inspection distinguishes rejected authentication from denied authorization", async () => {
  const transport = createConcreteLiveTransport({
    fetch_impl: async () => ({
      status: 401,
      async text() {
        return "raw-authentication-response-must-not-escape";
      },
    }),
    spawn_sync: () => {
      throw new Error("GIT_NOT_EXPECTED");
    },
  });
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.inspectFresh(environment),
    (error) =>
      error?.code === "CONCRETE_ENVIRONMENT_INSPECTION_FAILED" &&
      error?.provider_response_class === "AUTHENTICATION_REJECTED" &&
      !JSON.stringify(error).includes("raw-authentication-response-must-not-escape"),
  );
});

await check("environment inspection preserves network failure as a safe categorical class", async () => {
  const transport = createConcreteLiveTransport({
    fetch_impl: async () => {
      throw new Error("raw-network-failure-must-not-escape");
    },
    spawn_sync: () => {
      throw new Error("GIT_NOT_EXPECTED");
    },
  });
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.inspectFresh(environment),
    (error) =>
      error?.code === "CONCRETE_NETWORK_REQUEST_FAILED" &&
      error?.provider_response_class === "NETWORK_FAILURE" &&
      !JSON.stringify(error).includes("raw-network-failure-must-not-escape"),
  );
});


await check("storage fresh inspection uses the Supabase existence contract", async () => {
  for (const status of [400, 404]) {
    const calls = [];
    const platform = createConcreteLivePlatform({
      authorization,
      credentials,
      transport: {
        git: {},
        async request(request) {
          calls.push(structuredClone(request));
          if (request.operation === "STORAGE_EXISTS") {
            return { status, body: null };
          }
          if (request.operation === "STORAGE_INFO") {
            return { status, body: null };
          }
          throw new Error(`UNEXPECTED_${request.operation}`);
        },
      },
    });
    assert.deepEqual(await platform.inspectFresh(storage), { status: "ABSENT" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].service, "SUPABASE_SERVICE");
    assert.equal(calls[0].operation, "STORAGE_EXISTS");
    assert.equal(calls[0].method, "HEAD");
    assert.equal(
      calls[0].path,
      `/storage/v1/object/${authorization.execution.storage_bucket}/${authorization.execution.storage_name}`,
    );
  }

  const presentCalls = [];
  const presentPlatform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport: {
      git: {},
      async request(request) {
        presentCalls.push(structuredClone(request));
        if (request.operation !== "STORAGE_EXISTS") {
          throw new Error(`UNEXPECTED_${request.operation}`);
        }
        return { status: 200, body: null };
      },
    },
  });
  assert.deepEqual(await presentPlatform.inspectFresh(storage), { status: "PRESENT" });
  assert.equal(presentCalls.length, 1);
});

await check("storage fresh inspection preserves provider failure classes", async () => {
  for (const [status, expectedClass] of [
    [401, "AUTHENTICATION_REJECTED"],
    [403, "AUTHORIZATION_DENIED"],
    [429, "RATE_LIMITED"],
    [500, "SERVER_ERROR"],
  ]) {
    const platform = createConcreteLivePlatform({
      authorization,
      credentials,
      transport: {
        git: {},
        async request(request) {
          if (request.operation === "STORAGE_EXISTS") {
            return { status, body: null };
          }
          if (request.operation === "STORAGE_INFO") {
            return { status, body: null };
          }
          throw new Error(`UNEXPECTED_${request.operation}`);
        },
      },
    });
    await assert.rejects(
      platform.inspectFresh(storage),
      (error) =>
        error?.code === "CONCRETE_STORAGE_INSPECTION_FAILED" &&
        error?.provider_response_class === expectedClass,
    );
  }
});

await check("raw Supabase storage info binds snake_case bucket identity", async () => {
  let uploaded = null;
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport: {
      git: {},
      async request(request) {
        if (request.operation === "STORAGE_UPLOAD") {
          uploaded = Buffer.from(request.body);
          return {
            status: 200,
            body: {
              Id: "raw-info-object-id",
              Key: `${authorization.execution.storage_bucket}/${authorization.execution.storage_name}`,
            },
          };
        }
        if (request.operation === "STORAGE_INFO") {
          return {
            status: 200,
            body: {
              id: "raw-info-object-id",
              bucket_id: authorization.execution.storage_bucket,
              name: authorization.execution.storage_name,
              version: "raw-info-version",
              created_at: STORAGE_CREATED_AT,
              updated_at: STORAGE_CREATED_AT,
              metadata: {
                eTag: "raw-info-etag",
                mimetype: "image/png",
                size: uploaded.byteLength,
              },
            },
          };
        }
        if (request.operation === "STORAGE_DOWNLOAD") {
          return { status: 200, body: Buffer.from(uploaded) };
        }
        throw new Error(`UNEXPECTED_${request.operation}`);
      },
    },
  });
  const binding = await platform.createStorageFixture(storage);
  assert.equal(binding.object_id, "raw-info-object-id");
  assert.equal(binding.expected_version, "raw-info-version");
});

await check("concrete platform binds exact Preview environment and database identities", async () => {
  const calls = [];
  const transport = {
    git: {
      async inspect() { return { status: "ABSENT" }; },
      async create() { return { status: "CREATED_EXACT", commit_sha: COMMIT }; },
      async delete() { return { status: "DELETED_EXACT" }; },
    },
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "PREVIEW_CREATE") {
        return {
          status: 200,
          body: exactPreviewDeployment(),
        };
      }
      if (request.operation === "ENVIRONMENT_CREATE") {
        return {
          status: 200,
          body: {
            id: `env_${request.body.key}`,
            key: request.body.key,
            target: ["preview"],
            gitBranch: authorization.execution.branch_name,
          },
        };
      }
      if (request.operation === "DATABASE_CREATE") {
        return {
          status: 201,
          body: [{
            id: 41,
            name: authorization.execution.fixture_name,
            website: authorization.execution.fixture_website,
            status: "pending",
          }],
        };
      }
      if (["PREVIEW_READ", "ENVIRONMENT_READ", "DATABASE_READ"].includes(request.operation)) {
        return { status: 200, body: request.expected_fixture };
      }
      if (["PREVIEW_DELETE", "ENVIRONMENT_DELETE", "DATABASE_DELETE"].includes(request.operation)) {
        return { status: 200, body: request.operation === "DATABASE_DELETE" ? [{ id: 41 }] : null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  const durableBindings = [];
  const progress = async (binding) => {
    durableBindings.push(structuredClone(binding));
  };
  const previewBinding = await platform.createPreview(preview, {
    onBindingProgress: progress,
  });
  const environmentBinding = await platform.createEnvironment(environment, {
    onBindingProgress: progress,
  });
  const databaseBinding = await platform.createDatabaseFixture(database, {
    onBindingProgress: progress,
  });
  assert.equal(previewBinding.deployment_id, `dpl_${RUN_ID}`);
  assert.deepEqual(environmentBinding.records, [
    { key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" },
    { key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" },
  ]);
  assert.deepEqual(databaseBinding.row_ids, ["41"]);
  assert.deepEqual(
    durableBindings.map((entry) => [
      entry.resource_type,
      entry.records?.length ?? entry.row_ids?.length ?? 1,
    ]),
    [
      ["PREVIEW_DEPLOYMENT", 1],
      ["ENVIRONMENT_RECORD", 1],
      ["ENVIRONMENT_RECORD", 2],
      ["DATABASE_ROW", 1],
    ],
  );
  assert.deepEqual(await platform.cleanupDatabaseFixture(database, databaseBinding), {
    status: "DELETED_EXACT",
  });
  assert.deepEqual(await platform.cleanupEnvironment(environment, environmentBinding), {
    status: "DELETED_EXACT",
  });
  assert.deepEqual(await platform.cleanupPreview(preview, previewBinding), {
    status: "DELETED_EXACT",
  });
  assert.equal(
    calls.filter((entry) => entry.operation === "ENVIRONMENT_CREATE").length,
    2,
  );
  assert.equal(
    JSON.stringify(calls).includes(credentials.admin_password),
    true,
  );
});

await check("Storage CAS preserves a stale replacement and never invokes delete", async () => {
  const calls = [];
  let uploaded = null;
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "STORAGE_UPLOAD") {
        uploaded = Buffer.from(request.body);
        return {
          status: 200,
          body: {
            Id: "created-object-id",
            Key: `tool-logos/${authorization.execution.storage_name}`,
          },
        };
      }
      if (request.operation === "STORAGE_INFO") {
        const read = calls.filter((entry) => entry.operation === "STORAGE_INFO").length;
        return {
          status: 200,
          body: {
            id: read === 1 ? "created-object-id" : "replacement-object-id",
            bucket_id: "tool-logos",
            name: authorization.execution.storage_name,
            version: read === 1
              ? "version-created"
              : "version-replacement",
            created_at: STORAGE_CREATED_AT,
            updated_at: STORAGE_CREATED_AT,
            metadata: {
              eTag: read === 1 ? "created-etag" : "replacement-etag",
              mimetype: "image/png",
              size: uploaded.byteLength,
            },
          },
        };
      }
      if (request.operation === "STORAGE_DOWNLOAD") {
        return { status: 200, body: Buffer.from(uploaded) };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  const binding = await platform.createStorageFixture(storage);
  assert.equal(binding.expected_version, "version-created");
  assert.deepEqual(
    await platform.cleanupStorageExactVersion(
      storage,
      binding,
      { expected_version: binding.expected_version, delete_capability_sha256: "f".repeat(64) },
    ),
    { status: "VERSION_MISMATCH", observed_version: "version-replacement" },
  );
  assert.equal(
    calls.some((entry) => entry.operation === "STORAGE_CAS_DELETE"),
    false,
  );
});

await check("Storage CAS uses the deployed exact-version grant and anon delete contract", async () => {
  const calls = [];
  let infoReads = 0;
  let uploaded = null;
  const grantId = "55555555-5555-4555-8555-555555555555";
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "STORAGE_UPLOAD") {
        uploaded = Buffer.from(request.body);
        return {
          status: 200,
          body: {
            Id: "exact-created-object-id",
            Key: `tool-logos/${authorization.execution.storage_name}`,
          },
        };
      }
      if (request.operation === "STORAGE_INFO") {
        infoReads += 1;
        if (infoReads === 3) return { status: 404, body: null };
        return {
          status: 200,
          body: {
            id: "exact-created-object-id",
            bucket_id: "tool-logos",
            name: authorization.execution.storage_name,
            version: "exact-created-version",
            created_at: STORAGE_CREATED_AT,
            updated_at: STORAGE_CREATED_AT,
            metadata: {
              eTag: "exact-created-etag",
              mimetype: "image/png",
              size: uploaded.byteLength,
            },
          },
        };
      }
      if (request.operation === "STORAGE_DOWNLOAD") {
        return { status: 200, body: Buffer.from(uploaded) };
      }
      if (request.operation === "STORAGE_CAS_GRANT") {
        return {
          status: 200,
          body: [{
            grant_id: grantId,
            expected_version: "exact-created-version",
            expires_at: "2030-01-01T00:05:00.000Z",
          }],
        };
      }
      if (request.operation === "STORAGE_CAS_DELETE") {
        return { status: 200, body: { message: "Successfully deleted" } };
      }
      if (request.operation === "STORAGE_CAS_REVOKE") {
        return { status: 200, body: true };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport,
    random_bytes: () => Buffer.alloc(32, 7),
    random_uuid: () => grantId,
  });
  const binding = await platform.createStorageFixture(storage);
  assert.deepEqual(
    await platform.cleanupStorageExactVersion(
      storage,
      binding,
      {
        expected_version: binding.expected_version,
        delete_capability_sha256: "f".repeat(64),
      },
    ),
    { status: "DELETED_EXACT" },
  );
  const upload = calls.find((entry) => entry.operation === "STORAGE_UPLOAD");
  assert.equal(upload.headers["content-type"], "image/png");
  assert.equal(Buffer.from(upload.body).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const grant = calls.find((entry) => entry.operation === "STORAGE_CAS_GRANT");
  assert.equal(grant.body.p_phase_id, "34IA-34IZ");
  assert.equal(grant.body.p_runtime_session_id, RUN_ID);
  assert.equal(grant.body.p_object_name, `admin/${RUN_ID}.png`);
  assert.equal(grant.body.p_expected_mime_type, "image/png");
  assert.equal(grant.body.p_expected_etag, "exact-created-etag");
  assert.equal(grant.body.p_expected_size, uploaded.byteLength);
  const deletion = calls.find((entry) => entry.operation === "STORAGE_CAS_DELETE");
  assert.equal(deletion.service, "SUPABASE_ANON");
  assert.equal(deletion.method, "DELETE");
  assert.equal(deletion.path, "/storage/v1/object/tool-logos");
  assert.deepEqual(deletion.body, { prefixes: [`admin/${RUN_ID}.png`] });
  assert.equal(
    /^[a-f0-9]{64}$/u.test(deletion.headers["x-aifinder-storage-cleanup-token"]),
    true,
  );
});

await check("Storage upload identity cannot arm deletion for a pre-binding replacement", async () => {
  const calls = [];
  const durableBindings = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "STORAGE_UPLOAD") {
        return {
          status: 200,
          body: {
            Id: "created-object-id",
            Key: `tool-logos/${authorization.execution.storage_name}`,
          },
        };
      }
      if (request.operation === "STORAGE_INFO") {
        return {
          status: 200,
          body: {
            id: "replacement-object-id",
            bucket_id: authorization.execution.storage_bucket,
            name: authorization.execution.storage_name,
            version: "replacement-before-first-info",
            metadata: { eTag: "replacement", mimetype: "image/png", size: 68 },
          },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.createStorageFixture(storage, {
      onBindingProgress: async (binding) => durableBindings.push(structuredClone(binding)),
    }),
    (error) => error?.code === "CONCRETE_STORAGE_CREATE_UNCONFIRMED",
  );
  assert.deepEqual(durableBindings, []);
  assert.equal(
    calls.some((entry) =>
      ["STORAGE_CAS_GRANT", "STORAGE_CAS_DELETE", "STORAGE_CAS_REVOKE"].includes(
        entry.operation,
      )
    ),
    false,
  );
});

await check("Storage same-ID replacement cannot become the first durable binding", async () => {
  const durableBindings = [];
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport: {
      git: {},
      async request(request) {
        if (request.operation === "STORAGE_UPLOAD") {
          return {
            status: 200,
            body: {
              Id: "shared-object-id",
              Key: `tool-logos/${authorization.execution.storage_name}`,
            },
          };
        }
        if (request.operation === "STORAGE_INFO") {
          return {
            status: 200,
            body: {
              id: "shared-object-id",
              bucket_id: authorization.execution.storage_bucket,
              name: authorization.execution.storage_name,
              version: "replacement-before-first-info",
              metadata: {
                eTag: "replacement-etag",
                mimetype: "image/png",
                size: 68,
              },
            },
          };
        }
        if (request.operation === "STORAGE_DOWNLOAD") {
          const replacement = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZKx8AAAAASUVORK5CYII=",
            "base64",
          );
          replacement[replacement.length - 1] ^= 1;
          return { status: 200, body: replacement };
        }
        throw new Error(`UNEXPECTED_${request.operation}`);
      },
    },
  });
  await assert.rejects(
    platform.createStorageFixture(storage, {
      onBindingProgress: async (binding) => {
        durableBindings.push(structuredClone(binding));
      },
    }),
    (error) => error?.code === "CONCRETE_STORAGE_CREATE_UNCONFIRMED",
  );
  assert.deepEqual(durableBindings, []);
});

await check("Storage rejects an adaptive same-ID exact-byte replacement before first binding", async () => {
  let uploaded = null;
  const durableBindings = [];
  const calls = [];
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    random_bytes: () => Buffer.alloc(32, 19),
    transport: {
      git: {},
      async request(request) {
        calls.push(structuredClone(request));
        if (request.operation === "STORAGE_UPLOAD") {
          uploaded = Buffer.from(request.body);
          return {
            status: 200,
            body: {
              Id: "adaptive-shared-object-id",
              Key: `tool-logos/${authorization.execution.storage_name}`,
            },
          };
        }
        if (request.operation === "STORAGE_INFO") {
          return {
            status: 200,
            body: {
              id: "adaptive-shared-object-id",
              bucket_id: authorization.execution.storage_bucket,
              name: authorization.execution.storage_name,
              version: "adaptive-replacement-version",
              created_at: STORAGE_CREATED_AT,
              updated_at: "2030-01-01T00:00:01.000Z",
              metadata: {
                eTag: "adaptive-replacement-etag",
                mimetype: "image/png",
                size: uploaded.byteLength,
              },
            },
          };
        }
        if (request.operation === "STORAGE_DOWNLOAD") {
          return { status: 200, body: Buffer.from(uploaded) };
        }
        throw new Error(`UNEXPECTED_${request.operation}`);
      },
    },
  });
  await assert.rejects(
    platform.createStorageFixture(storage, {
      onBindingProgress: async (binding) => {
        durableBindings.push(structuredClone(binding));
      },
    }),
    (error) => error?.code === "CONCRETE_STORAGE_CREATE_UNCONFIRMED",
  );
  assert.deepEqual(durableBindings, []);
  assert.equal(
    calls.some((entry) =>
      ["STORAGE_CAS_GRANT", "STORAGE_CAS_DELETE"].includes(entry.operation)
    ),
    false,
  );
});

await check("Storage upload uses a fresh content capability before first binding", async () => {
  let uploaded = null;
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    random_bytes: () => Buffer.alloc(32, 11),
    transport: {
      git: {},
      async request(request) {
        if (request.operation === "STORAGE_UPLOAD") {
          uploaded = Buffer.from(request.body);
          return {
            status: 200,
            body: {
              Id: "fresh-content-object-id",
              Key: `tool-logos/${authorization.execution.storage_name}`,
            },
          };
        }
        if (request.operation === "STORAGE_INFO") {
          return {
            status: 200,
            body: {
              id: "fresh-content-object-id",
              bucket_id: authorization.execution.storage_bucket,
              name: authorization.execution.storage_name,
              version: "fresh-content-version",
              created_at: STORAGE_CREATED_AT,
              updated_at: STORAGE_CREATED_AT,
              metadata: {
                eTag: "fresh-content-etag",
                mimetype: "image/png",
                size: uploaded.byteLength,
              },
            },
          };
        }
        if (request.operation === "STORAGE_DOWNLOAD") {
          return { status: 200, body: Buffer.from(uploaded) };
        }
        throw new Error(`UNEXPECTED_${request.operation}`);
      },
    },
  });
  const binding = await platform.createStorageFixture(storage);
  assert.equal(Buffer.from(uploaded).equals(SYNTHETIC_PNG_BYTES), false);
  assert.equal(uploaded.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(binding.content_sha256, sha256Hex(uploaded));
  assert.equal(binding.created_at, STORAGE_CREATED_AT);
});

await check("Storage cleanup preserves a same-version content replacement", async () => {
  const calls = [];
  let uploaded = null;
  let infoReads = 0;
  let downloadReads = 0;
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    random_bytes: () => Buffer.alloc(32, 13),
    transport: {
      git: {},
      async request(request) {
        calls.push(structuredClone(request));
        if (request.operation === "STORAGE_UPLOAD") {
          uploaded = Buffer.from(request.body);
          return {
            status: 200,
            body: {
              Id: "same-version-object-id",
              Key: `tool-logos/${authorization.execution.storage_name}`,
            },
          };
        }
        if (request.operation === "STORAGE_INFO") {
          infoReads += 1;
          return {
            status: 200,
            body: {
              id: "same-version-object-id",
              bucket_id: authorization.execution.storage_bucket,
              name: authorization.execution.storage_name,
              version: "same-version",
              created_at: STORAGE_CREATED_AT,
              updated_at: STORAGE_CREATED_AT,
              metadata: {
                eTag: "created-etag",
                mimetype: "image/png",
                size: uploaded.byteLength,
              },
            },
          };
        }
        if (request.operation === "STORAGE_DOWNLOAD") {
          downloadReads += 1;
          if (downloadReads === 1) {
            return { status: 200, body: Buffer.from(uploaded) };
          }
          const replacement = Buffer.from(uploaded);
          replacement[replacement.length - 20] ^= 1;
          return { status: 200, body: replacement };
        }
        throw new Error(`UNEXPECTED_${request.operation}`);
      },
    },
  });
  const binding = await platform.createStorageFixture(storage);
  await assert.rejects(
    platform.cleanupStorageExactVersion(
      storage,
      binding,
      {
        expected_version: binding.expected_version,
        delete_capability_sha256: "f".repeat(64),
      },
    ),
    (error) => error?.code === "CONCRETE_STORAGE_REPLACEMENT_PRESENT",
  );
  assert.equal(downloadReads, 2);
  assert.equal(
    calls.some((entry) =>
      ["STORAGE_CAS_GRANT", "STORAGE_CAS_DELETE"].includes(entry.operation)
    ),
    false,
  );
});

await check("Storage creation requires exact upload and first-info continuity", async () => {
  const validUpload = {
    Id: "created-object-id",
    Key: `tool-logos/${authorization.execution.storage_name}`,
  };
  const validInfo = {
    id: validUpload.Id,
    bucket_id: authorization.execution.storage_bucket,
    name: authorization.execution.storage_name,
    version: "created-version",
    created_at: STORAGE_CREATED_AT,
    updated_at: STORAGE_CREATED_AT,
    metadata: { eTag: "created-etag", mimetype: "image/png", size: 68 },
  };
  const cases = [
    [{ Key: validUpload.Key }, validInfo],
    [{ ...validUpload, Key: `other/${authorization.execution.storage_name}` }, validInfo],
    [validUpload, { ...validInfo, created_at: null }],
    [validUpload, {
      ...validInfo,
      created_at: "not-a-timestamp",
      updated_at: "not-a-timestamp",
    }],
    [validUpload, {
      ...validInfo,
      updated_at: "2030-01-01T00:00:00.001Z",
    }],
    [validUpload, { ...validInfo, metadata: { ...validInfo.metadata, size: 69 } }],
    [validUpload, { ...validInfo, metadata: { ...validInfo.metadata, mimetype: "text/plain" } }],
    [validUpload, { ...validInfo, metadata: { ...validInfo.metadata, eTag: "" } }],
  ];
  for (const [uploadBody, infoBody] of cases) {
    let bindingWrites = 0;
    const platform = createConcreteLivePlatform({
      authorization,
      credentials,
      transport: {
        git: {},
        async request(request) {
          if (request.operation === "STORAGE_UPLOAD") {
            return { status: 200, body: structuredClone(uploadBody) };
          }
          if (request.operation === "STORAGE_INFO") {
            return { status: 200, body: structuredClone(infoBody) };
          }
          throw new Error(`UNEXPECTED_${request.operation}`);
        },
      },
    });
    await assert.rejects(
      platform.createStorageFixture(storage, {
        onBindingProgress: async () => { bindingWrites += 1; },
      }),
      (error) => error?.code === "CONCRETE_STORAGE_CREATE_UNCONFIRMED",
    );
    assert.equal(bindingWrites, 0);
  }
});

await check("cleanup rejects a substituted Preview identity before delete", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "PREVIEW_READ") {
        return {
          status: 200,
          body: exactPreviewDeployment({
            gitSource: {
              type: "github",
              repo: authorization.repository.remote_repository,
              ref: authorization.execution.branch_name,
              sha: "b".repeat(40),
            },
          }),
        };
      }
      if (request.operation === "PREVIEW_DELETE") {
        return { status: 204, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.cleanupPreview(preview, {
      resource_type: "PREVIEW_DEPLOYMENT",
      deployment_id: `dpl_${RUN_ID}`,
      deployment_url: `${RUN_ID}.vercel.app`,
    }),
    (error) => error?.code === "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
  );
  assert.equal(calls.some((entry) => entry.operation === "PREVIEW_DELETE"), false);
});

await check("final verifier reads the retained Preview instead of trusting memory", async () => {
  let created = false;
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "PREVIEW_CREATE") {
        created = true;
        return {
          status: 200,
          body: exactPreviewDeployment(),
        };
      }
      if (request.operation === "PREVIEW_READ") return { status: 404, body: null };
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await platform.createPreview(preview);
  assert.equal(created, true);
  assert.deepEqual(
    await platform.verifyFinal({
      owned_resources: [preview],
      retained_resource_keys: [preview.resource_key],
    }),
    { retained_preview_count: 0, present: [] },
  );
});

await check("cleanup response loss closes exact already-absent bindings without replay", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (["PREVIEW_READ", "ENVIRONMENT_READ"].includes(request.operation)) {
        return { status: 404, body: null };
      }
      if (request.operation === "DATABASE_READ") {
        return { status: 200, body: [] };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(
    await platform.cleanupPreview(preview, {
      resource_type: "PREVIEW_DEPLOYMENT",
      deployment_id: `dpl_${RUN_ID}`,
      deployment_url: `${RUN_ID}.vercel.app`,
    }),
    { status: "DELETED_EXACT" },
  );
  assert.deepEqual(
    await platform.cleanupEnvironment(environment, {
      resource_type: "ENVIRONMENT_RECORD",
      records: [
        { key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" },
        { key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" },
      ],
    }),
    { status: "DELETED_EXACT" },
  );
  assert.deepEqual(
    await platform.cleanupDatabaseFixture(database, {
      resource_type: "DATABASE_ROW",
      row_ids: ["41"],
    }),
    { status: "DELETED_EXACT" },
  );
  assert.equal(
    calls.some((entry) =>
      ["PREVIEW_DELETE", "ENVIRONMENT_DELETE", "DATABASE_DELETE"].includes(
        entry.operation,
      )
    ),
    false,
  );
});

await check("partial exact environment deletion remains inspectable and cleanup closes only the survivor", async () => {
  const calls = [];
  const firstId = "env_ADMIN_PASSWORD";
  const secondId = "env_ADMIN_SESSION_SECRET";
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "ENVIRONMENT_READ") {
        if (request.path.includes(`/${firstId}?`)) {
          return { status: 404, body: null };
        }
        return {
          status: 200,
          body: {
            id: secondId,
            key: "ADMIN_SESSION_SECRET",
            target: ["preview"],
            gitBranch: authorization.execution.branch_name,
          },
        };
      }
      if (request.operation === "ENVIRONMENT_DELETE") {
        assert.equal(request.path.includes(`/${secondId}?`), true);
        return { status: 204, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  const binding = {
    resource_type: "ENVIRONMENT_RECORD",
    records: [
      { key: "ADMIN_PASSWORD", id: firstId },
      { key: "ADMIN_SESSION_SECRET", id: secondId },
    ],
  };
  assert.deepEqual(
    await platform.inspectOwned(environment, binding),
    { status: "PRESENT" },
  );
  assert.deepEqual(
    await platform.cleanupEnvironment(environment, binding),
    { status: "DELETED_EXACT" },
  );
  assert.equal(
    calls.filter((entry) => entry.operation === "ENVIRONMENT_DELETE").length,
    1,
  );
});

async function lostSecondEnvironmentCreateScenario() {
  const calls = [];
  const records = new Map();
  const durableBindings = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "ENVIRONMENT_CREATE") {
        const record = {
          id: `env_${request.body.key}`,
          key: request.body.key,
          target: ["preview"],
          gitBranch: authorization.execution.branch_name,
        };
        records.set(record.id, structuredClone(record));
        if (record.key === "ADMIN_SESSION_SECRET") {
          throw new Error("SYNTHETIC_SECOND_ENVIRONMENT_CREATE_RESPONSE_LOSS");
        }
        return { status: 200, body: structuredClone(record) };
      }
      if (request.operation === "ENVIRONMENT_LIST") {
        return {
          status: 200,
          body: {
            envs: [...records.values()].map((entry) => structuredClone(entry)),
            pagination: { count: records.size, next: null },
          },
        };
      }
      if (request.operation === "ENVIRONMENT_READ") {
        const record = [...records.values()].find((entry) =>
          request.path.includes(`/${encodeURIComponent(entry.id)}?`)
        );
        return record === undefined
          ? { status: 404, body: null }
          : { status: 200, body: structuredClone(record) };
      }
      if (request.operation === "ENVIRONMENT_DELETE") {
        const record = [...records.values()].find((entry) =>
          request.path.includes(`/${encodeURIComponent(entry.id)}?`)
        );
        assert.notEqual(record, undefined);
        records.delete(record.id);
        return { status: 204, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.createEnvironment(environment, {
      async onBindingProgress(binding) {
        durableBindings.push(structuredClone(binding));
      },
    }),
    /SYNTHETIC_SECOND_ENVIRONMENT_CREATE_RESPONSE_LOSS/u,
  );
  assert.deepEqual(durableBindings, [{
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" }],
  }]);
  await platform.cleanupEnvironment(environment, durableBindings[0]);
  assert.deepEqual([...records.keys()], ["env_ADMIN_SESSION_SECRET"]);
  return { calls, platform, records };
}

await check("final verification rediscovers a survivor omitted from the partial environment binding", async () => {
  const { platform } = await lostSecondEnvironmentCreateScenario();
  assert.deepEqual(
    await platform.verifyFinal({ owned_resources: [environment] }),
    {
      retained_preview_count: 1,
      present: [environment.resource_key],
    },
  );
});

await check("environment binding resolution refreshes a stale in-memory partial binding", async () => {
  const { platform } = await lostSecondEnvironmentCreateScenario();
  assert.deepEqual(await platform.resolveBinding(environment), {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{
      key: "ADMIN_SESSION_SECRET",
      id: "env_ADMIN_SESSION_SECRET",
    }],
  });
});

await check("Preview creation rejects a coordinated Git project and team substitution", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation !== "PREVIEW_CREATE") {
        throw new Error(`UNEXPECTED_${request.operation}`);
      }
      return {
        status: 200,
        body: exactPreviewDeployment({
          projectId: "prj_substituted",
          name: "substituted",
          teamId: "team_substituted",
          gitSource: {
            type: "github",
            repo: "attacker/substituted",
            ref: "attacker-ref",
            sha: "b".repeat(40),
          },
        }),
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.createPreview(preview),
    (error) => error?.code === "CONCRETE_PREVIEW_CREATE_UNCONFIRMED",
  );
});

await check("Preview creation rejects an untrusted probe hostname", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation !== "PREVIEW_CREATE") {
        throw new Error(`UNEXPECTED_${request.operation}`);
      }
      return {
        status: 200,
        body: exactPreviewDeployment({ url: "attacker.example.com" }),
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.createPreview(preview),
    (error) => error?.code === "CONCRETE_PREVIEW_CREATE_UNCONFIRMED",
  );
});

await check("Preview creation rejects each independently substituted identity fact", async () => {
  const mutants = [
    ["commit", (value) => { value.gitSource.sha = "b".repeat(40); }],
    ["ref", (value) => { value.gitSource.ref = "substituted-ref"; }],
    ["repository", (value) => { value.gitSource.repo = "attacker/aifinder"; }],
    ["project", (value) => { value.projectId = "prj_substituted"; }],
    ["team", (value) => { value.teamId = "team_substituted"; }],
    ["hostname", (value) => { value.url = "attacker.example.com"; }],
    ["lifecycle", (value) => { value.readyState = "UNREVIEWED"; }],
  ];
  for (const [name, mutate] of mutants) {
    const body = exactPreviewDeployment();
    mutate(body);
    const platform = createConcreteLivePlatform({
      authorization,
      credentials,
      transport: {
        git: {},
        async request(request) {
          if (request.operation === "PREVIEW_CREATE") {
            return { status: 200, body };
          }
          throw new Error(`UNEXPECTED_${name}_${request.operation}`);
        },
      },
    });
    await assert.rejects(
      platform.createPreview(preview),
      (error) => error?.code === "CONCRETE_PREVIEW_CREATE_UNCONFIRMED",
      name,
    );
  }
});

await check("staging requires a fresh exact READY Preview before the first probe", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "PREVIEW_CREATE") {
        return { status: 200, body: exactPreviewDeployment({ readyState: "BUILDING" }) };
      }
      if (request.operation === "PREVIEW_READ") {
        return { status: 200, body: exactPreviewDeployment({ readyState: "BUILDING" }) };
      }
      if (request.operation === "STAGING_VERIFY") {
        return { status: 200, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport,
    wait: async () => {},
  });
  await platform.createPreview(preview);
  await assert.rejects(
    platform.verifyStaging({ staging_checks: authorization.execution.staging_checks }),
    (error) => error?.code === "CONCRETE_PREVIEW_NOT_READY",
  );
  assert.equal(calls.some((entry) => entry.operation === "STAGING_VERIFY"), false);
});

await check("Preview rediscovery reads and rejects a run-tagged but substituted deployment", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "PREVIEW_LIST") {
        return {
          status: 200,
          body: {
            deployments: [{
              id: `dpl_${RUN_ID}`,
              url: `${RUN_ID}.vercel.app`,
              target: null,
              readyState: "READY",
              meta: {
                aifinderRunId: RUN_ID,
                aifinderCandidate: authorization.candidate_identity_sha256,
                githubCommitSha: authorization.execution.temporary_commit_sha,
                githubCommitRef: authorization.execution.branch_name,
                githubCommitRepo: "aifinder",
                githubCommitOrg: "jcdumaua",
              },
            }],
            pagination: { count: 1, next: null },
          },
        };
      }
      if (request.operation === "PREVIEW_READ") {
        return {
          status: 200,
          body: exactPreviewDeployment({
            gitSource: {
              type: "github",
              repo: authorization.repository.remote_repository,
              ref: authorization.execution.branch_name,
              sha: "b".repeat(40),
            },
          }),
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.resolveBinding(preview),
    (error) => error?.code === "CONCRETE_PREVIEW_OWNERSHIP_MISMATCH",
  );
  assert.equal(calls.some((entry) => entry.operation === "PREVIEW_READ"), true);
});

await check("staging polls a bounded exact Preview from BUILDING to READY", async () => {
  const calls = [];
  let reads = 0;
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "PREVIEW_CREATE") {
        return { status: 200, body: exactPreviewDeployment({ readyState: "BUILDING" }) };
      }
      if (request.operation === "PREVIEW_READ") {
        reads += 1;
        return {
          status: 200,
          body: exactPreviewDeployment({ readyState: reads === 1 ? "BUILDING" : "READY" }),
        };
      }
      if (request.operation === "STAGING_VERIFY") {
        return { status: request.path.endsWith("/api/admin/session") ? 401 : 200, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({
    authorization,
    credentials,
    transport,
    wait: async () => {},
  });
  await platform.createPreview(preview);
  assert.deepEqual(
    await platform.verifyStaging({ staging_checks: authorization.execution.staging_checks }),
    { verified: true },
  );
  assert.equal(reads, 2);
  assert.equal(
    calls.filter((entry) => entry.operation === "STAGING_VERIFY").length,
    2,
  );
});

await check("partial environment rediscovery preserves the surviving key-to-id identity", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "ENVIRONMENT_LIST") {
        return {
          status: 200,
          body: {
            envs: [{
              id: "env_ADMIN_SESSION_SECRET",
              key: "ADMIN_SESSION_SECRET",
              target: ["preview"],
              gitBranch: authorization.execution.branch_name,
            }],
            pagination: { count: 1, next: null },
          },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.resolveBinding(environment), {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" }],
  });
});

await check("lost durable bindings are rediscovered from one exact run namespace", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "PREVIEW_LIST") {
        return {
          status: 200,
          body: {
            deployments: [{
              id: `dpl_${RUN_ID}`,
              url: `${RUN_ID}.vercel.app`,
              target: null,
              readyState: "READY",
              meta: {
                aifinderRunId: RUN_ID,
                aifinderCandidate: authorization.candidate_identity_sha256,
                githubCommitSha: authorization.execution.temporary_commit_sha,
                githubCommitRef: authorization.execution.branch_name,
                githubCommitRepo: "aifinder",
                githubCommitOrg: "jcdumaua",
              },
            }],
            pagination: { count: 1, next: null },
          },
        };
      }
      if (request.operation === "ENVIRONMENT_LIST") {
        return {
          status: 200,
          body: {
            envs: authorization.execution.environment_keys.map((key) => ({
              id: `env_${key}`,
              key,
              target: ["preview"],
              gitBranch: authorization.execution.branch_name,
            })),
            pagination: {
              count: authorization.execution.environment_keys.length,
              next: null,
            },
          },
        };
      }
      if (request.operation === "PREVIEW_READ") {
        return { status: 200, body: exactPreviewDeployment() };
      }
      if (request.operation === "DATABASE_READ") {
        return {
          status: 200,
          body: [{
            id: 41,
            name: authorization.execution.fixture_name,
            website: authorization.execution.fixture_website,
            status: "pending",
          }],
        };
      }
      if (request.operation === "STORAGE_INFO") {
        return {
          status: 200,
          body: {
            id: "recovered-storage-object-id",
            bucket_id: authorization.execution.storage_bucket,
            name: authorization.execution.storage_name,
            version: "recovered-storage-version",
          },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.resolveBinding(preview), {
    resource_type: "PREVIEW_DEPLOYMENT",
    deployment_id: `dpl_${RUN_ID}`,
    deployment_url: `${RUN_ID}.vercel.app`,
  });
  assert.deepEqual(await platform.resolveBinding(environment), {
    resource_type: "ENVIRONMENT_RECORD",
    records: [
      { key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" },
      { key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" },
    ],
  });
  assert.deepEqual(await platform.resolveBinding(database), {
    resource_type: "DATABASE_ROW",
    row_ids: ["41"],
  });
  assert.equal(await platform.resolveBinding(storage), null);
});

await check("Storage create response loss never rebinds deletion authority to a replacement", async () => {
  const calls = [];
  let uploadCommitted = false;
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "STORAGE_UPLOAD") {
        uploadCommitted = true;
        throw new Error("SYNTHETIC_STORAGE_CREATE_RESPONSE_LOSS");
      }
      if (request.operation === "STORAGE_EXISTS") {
        assert.equal(uploadCommitted, true);
        return { status: 200, body: null };
      }
      if (request.operation === "STORAGE_INFO") {
        assert.equal(uploadCommitted, true);
        return {
          status: 200,
          body: {
            id: "replacement-after-lost-create-id",
            bucket_id: authorization.execution.storage_bucket,
            name: authorization.execution.storage_name,
            version: "replacement-after-lost-create",
            metadata: {
              eTag: "replacement-etag",
              mimetype: "image/png",
              size: 68,
            },
          },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const creating = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    creating.createStorageFixture(storage),
    /SYNTHETIC_STORAGE_CREATE_RESPONSE_LOSS/u,
  );
  const recovering = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.equal(await recovering.resolveBinding(storage), null);
  assert.deepEqual(await recovering.inspectOwned(storage, null), {
    status: "PRESENT",
    observed_version: "replacement-after-lost-create",
  });
  assert.equal(
    calls.some((entry) =>
      ["STORAGE_CAS_GRANT", "STORAGE_CAS_DELETE", "STORAGE_CAS_REVOKE"].includes(
        entry.operation,
      )
    ),
    false,
  );
});

await check("duplicate JSON inventory keys cannot erase a survivor into authoritative absence", async () => {
  const transport = createConcreteLiveTransport({
    fetch_impl: async () => ({
      status: 200,
      async text() {
        return `{"envs":[{"id":"env_survivor","key":"ADMIN_SESSION_SECRET","target":["preview"],"gitBranch":"${authorization.execution.branch_name}"}],"envs":[],"pagination":{"count":1,"next":null}}`;
      },
    }),
    spawn_sync: () => {
      throw new Error("GIT_NOT_EXPECTED");
    },
  });
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(environment), {
    status: "AMBIGUOUS",
  });
});

const malformedInventoryCases = [
  {
    name: "Preview missing required count",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: [], pagination: { next: null } },
  },
  {
    name: "Preview contradictory count",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: [], pagination: { count: 1, next: null } },
  },
  {
    name: "Preview malformed returned member",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: [null], pagination: { count: 1, next: null } },
  },
  {
    name: "environment contradictory count",
    operation: "ENVIRONMENT_LIST",
    resource: environment,
    body: { envs: [], pagination: { count: 1, next: null } },
  },
  {
    name: "environment malformed returned member",
    operation: "ENVIRONMENT_LIST",
    resource: environment,
    body: { envs: [null], pagination: { count: 1, next: null } },
  },
  {
    name: "Preview missing collection",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { pagination: { next: null } },
  },
  {
    name: "Preview non-array collection",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: {}, pagination: { next: null } },
  },
  {
    name: "Preview missing pagination",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: [] },
  },
  {
    name: "Preview malformed pagination",
    operation: "PREVIEW_LIST",
    resource: preview,
    body: { deployments: [], pagination: [] },
  },
  {
    name: "environment missing collection",
    operation: "ENVIRONMENT_LIST",
    resource: environment,
    body: { pagination: { next: null } },
  },
  {
    name: "environment non-array collection",
    operation: "ENVIRONMENT_LIST",
    resource: environment,
    body: { envs: null, pagination: { next: null } },
  },
  {
    name: "environment malformed pagination",
    operation: "ENVIRONMENT_LIST",
    resource: environment,
    body: { envs: [], pagination: {} },
  },
];

for (const fixture of malformedInventoryCases) {
  await check(`${fixture.name} inventory never proves authoritative absence`, async () => {
    const transport = {
      git: {},
      async request(request) {
        if (request.operation !== fixture.operation) {
          throw new Error(`UNEXPECTED_${request.operation}`);
        }
        return { status: 200, body: structuredClone(fixture.body) };
      },
    };
    const platform = createConcreteLivePlatform({ authorization, credentials, transport });
    assert.deepEqual(
      await platform.inspectFresh(fixture.resource),
      { status: "AMBIGUOUS" },
    );
  });
}

await check("malformed environment inventory cannot close response-loss final verification", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "ENVIRONMENT_LIST") {
        return {
          status: 200,
          body: { envs: null, pagination: { next: null } },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.verifyFinal({ owned_resources: [environment] }),
    (error) => error?.code === "CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS",
  );
});

for (const [name, body] of [
  [
    "contradictory environment count",
    { envs: [], pagination: { count: 1, next: null } },
  ],
  [
    "malformed environment member",
    { envs: [null], pagination: { count: 1, next: null } },
  ],
]) {
  await check(`${name} cannot close response-loss final verification`, async () => {
    const transport = {
      git: {},
      async request(request) {
        if (request.operation !== "ENVIRONMENT_LIST") {
          throw new Error(`UNEXPECTED_${request.operation}`);
        }
        return { status: 200, body: structuredClone(body) };
      },
    };
    const platform = createConcreteLivePlatform({ authorization, credentials, transport });
    await assert.rejects(
      platform.verifyFinal({ owned_resources: [environment] }),
      (error) => error?.code === "CONCRETE_ENVIRONMENT_INSPECTION_AMBIGUOUS",
    );
  });
}

await check("malformed Preview inventory cannot create a recovered destructive binding", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "PREVIEW_LIST") {
        return {
          status: 200,
          body: { deployments: [], pagination: null },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.resolveBinding(preview),
    (error) => error?.code === "CONCRETE_PREVIEW_INSPECTION_AMBIGUOUS",
  );
});

await check("malformed Preview member cannot create a recovered destructive binding", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "PREVIEW_LIST") {
        return {
          status: 200,
          body: { deployments: [null], pagination: { count: 1, next: null } },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.resolveBinding(preview),
    (error) => error?.code === "CONCRETE_PREVIEW_INSPECTION_AMBIGUOUS",
  );
});

await check("paginated Vercel inventories remain ambiguous", async () => {
  const transport = {
    git: {},
    async request(request) {
      if (request.operation === "PREVIEW_LIST") {
        return {
          status: 200,
          body: { deployments: [], pagination: { next: 123 } },
        };
      }
      if (request.operation === "ENVIRONMENT_LIST") {
        return {
          status: 200,
          body: { envs: [], pagination: { next: 123 } },
        };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(preview), { status: "AMBIGUOUS" });
  assert.deepEqual(await platform.inspectFresh(environment), { status: "AMBIGUOUS" });
});

await check("database cleanup rejects a modified exact-id row", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "DATABASE_READ") {
        return {
          status: 200,
          body: [{
            id: 41,
            name: "substituted fixture",
            website: authorization.execution.fixture_website,
            status: "pending",
          }],
        };
      }
      if (request.operation === "DATABASE_DELETE") {
        return { status: 200, body: [{ id: 41 }] };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  await assert.rejects(
    platform.cleanupDatabaseFixture(database, {
      resource_type: "DATABASE_ROW",
      row_ids: ["41"],
    }),
    (error) => error?.code === "CONCRETE_DATABASE_OWNERSHIP_MISMATCH",
  );
  assert.equal(calls.some((entry) => entry.operation === "DATABASE_DELETE"), false);
});


await check("official unpaginated branch-filtered environment inventory proves absence", async () => {
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_LIST");
      assert.equal(request.path.includes("gitBranch="), true);
      return { status: 200, body: { envs: [] } };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(environment), { status: "ABSENT" });
});

await check("one expected branch-filtered environment key proves namespace presence even when gitBranch is omitted", async () => {
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_LIST");
      return {
        status: 200,
        body: {
          envs: [{ id: "env_ADMIN_PASSWORD", key: "ADMIN_PASSWORD", target: ["preview"] }],
        },
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(environment), { status: "PRESENT" });
});

await check("duplicate expected environment keys remain ambiguous", async () => {
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_LIST");
      return {
        status: 200,
        body: {
          envs: [
            { id: "env_a", key: "ADMIN_PASSWORD", target: ["preview"], gitBranch: authorization.execution.branch_name },
            { id: "env_b", key: "ADMIN_PASSWORD", target: ["preview"], gitBranch: authorization.execution.branch_name },
          ],
          pagination: { count: 2, next: null },
        },
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(environment), { status: "AMBIGUOUS" });
});

await check("explicitly conflicting environment branch remains ambiguous", async () => {
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_LIST");
      return {
        status: 200,
        body: {
          envs: [{ id: "env_conflict", key: "ADMIN_PASSWORD", target: ["preview"], gitBranch: "other-branch" }],
        },
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectFresh(environment), { status: "AMBIGUOUS" });
});

await check("partial branch-filtered environment rediscovery accepts omitted gitBranch", async () => {
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_LIST");
      return {
        status: 200,
        body: {
          envs: [{ id: "env_ADMIN_SESSION_SECRET", key: "ADMIN_SESSION_SECRET", target: ["preview"] }],
        },
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.resolveBinding(environment), {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" }],
  });
});

await check("official Vercel create envelope is accepted without requiring an echoed gitBranch", async () => {
  const calls = [];
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      assert.equal(request.operation, "ENVIRONMENT_CREATE");
      return {
        status: 201,
        body: {
          created: {
            id: `env_${request.body.key}`,
            key: request.body.key,
            target: ["preview"],
            type: "encrypted",
          },
          failed: [],
        },
      };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  const binding = await platform.createEnvironment(environment);
  assert.deepEqual(binding.records, [
    { key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" },
    { key: "ADMIN_SESSION_SECRET", id: "env_ADMIN_SESSION_SECRET" },
  ]);
  assert.equal(calls.length, 2);
});

await check("bound environment reads use the documented v1 project-env endpoint and tolerate omitted target and gitBranch", async () => {
  const binding = {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" }],
  };
  const transport = {
    git: {},
    async request(request) {
      assert.equal(request.operation, "ENVIRONMENT_READ");
      assert.equal(request.path.startsWith(`/v1/projects/${authorization.execution.preview_project_id}/env/env_ADMIN_PASSWORD?`), true);
      return { status: 200, body: { id: "env_ADMIN_PASSWORD", key: "ADMIN_PASSWORD", type: "encrypted", decrypted: false } };
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.inspectOwned(environment, binding), { status: "PRESENT" });
});

await check("environment cleanup uses documented v1 read and v9 delete endpoints", async () => {
  const calls = [];
  const binding = {
    resource_type: "ENVIRONMENT_RECORD",
    records: [{ key: "ADMIN_PASSWORD", id: "env_ADMIN_PASSWORD" }],
  };
  const transport = {
    git: {},
    async request(request) {
      calls.push(structuredClone(request));
      if (request.operation === "ENVIRONMENT_READ") {
        assert.equal(request.path.startsWith(`/v1/projects/${authorization.execution.preview_project_id}/env/env_ADMIN_PASSWORD?`), true);
        return { status: 200, body: { id: "env_ADMIN_PASSWORD", key: "ADMIN_PASSWORD", type: "encrypted", decrypted: false } };
      }
      if (request.operation === "ENVIRONMENT_DELETE") {
        assert.equal(request.path.startsWith(`/v9/projects/${authorization.execution.preview_project_id}/env/env_ADMIN_PASSWORD?`), true);
        return { status: 200, body: null };
      }
      throw new Error(`UNEXPECTED_${request.operation}`);
    },
  };
  const platform = createConcreteLivePlatform({ authorization, credentials, transport });
  assert.deepEqual(await platform.cleanupEnvironment(environment, binding), { status: "DELETED_EXACT" });
  assert.deepEqual(calls.map((entry) => entry.operation), ["ENVIRONMENT_READ", "ENVIRONMENT_DELETE"]);
});

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_LIVE_PLATFORM assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_CONCRETE_LIVE_PLATFORM assertions=${assertions} mutations=23 network=0 credential_reads=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
