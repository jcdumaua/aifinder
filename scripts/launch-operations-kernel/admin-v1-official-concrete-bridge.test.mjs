import assert from "node:assert/strict";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_LEDGER,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER,
  runAdminV1OfficialRuntime,
} from "./admin-v1-official-runtime.mjs";
import {
  createAdminV1OfficialConcreteTransport,
  loadAdminV1OfficialCredentials,
} from "./admin-v1-official-live-platform.mjs";
import {
  createConcreteRunnerDependencies,
} from "./nonproduction-qualification-runner.mjs";

const HEAD = "5071f818e6c6aeadbfa708fc937a7ce7e30968eb";
const RUN_ID = "55555555-5555-4555-8555-555555555555";
const TEST_NOW_EPOCH_MS = Date.now();
const sha = (value) => value.repeat(64);
const authorization = {
  schema_version: 1,
  operation_class: ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  authorization_id_sha256: sha("1"),
  one_use_authorization_sha256: sha("2"),
  review_approval_sha256: sha("3"),
  candidate_identity_sha256: sha("4"),
  manifest_sha256: sha("5"),
  supervisor_sha256: sha("6"),
  supervisor_policy_sha256: sha("7"),
  authorization_schema_sha256: sha("8"),
  compatibility_support_sha256: Object.fromEntries([
    "testing/admin-v1-staging-runtime-orchestrator.mjs",
    "testing/admin-v1-staging-runtime-source-policy.test.mjs",
    "testing/run-static-readiness.mjs",
    "testing/static-test-safety-manifest.json",
  ].map((entry) => [entry, sha("9")])),
  route_source_sha256: Object.fromEntries([
    "app/api/admin/csrf/route.ts",
    "app/api/admin/login/route.ts",
    "app/api/admin/logout/route.ts",
    "app/api/admin/session/route.ts",
    "app/api/admin/submissions/route.ts",
    "app/api/admin/tools/route.ts",
    "app/api/admin/upload-logo/route.ts",
    "lib/admin-v1-launch-scope.ts",
    "proxy.ts",
  ].map((entry) => [entry, sha("a")])),
  contract_sha256: structuredClone(ADMIN_V1_OFFICIAL_CONTRACT_SHA256),
  created_at: new Date(TEST_NOW_EPOCH_MS - 60 * 60 * 1000).toISOString(),
  expires_at: new Date(TEST_NOW_EPOCH_MS + 8 * 60 * 60 * 1000).toISOString(),
  run_id: RUN_ID,
  repository: {
    root: "/Users/jamescarlodumaua/aifinder",
    branch: "main",
    head: HEAD,
    origin_main: HEAD,
    remote_main: HEAD,
    ahead: 0,
    behind: 0,
    index_empty: true,
    worktree_count: 1,
    status_sha256: sha("b"),
    remote_repository: "jcdumaua/aifinder",
  },
  execution: {
    access_mode: "SELF_PROJECT_OIDC",
    branch_name: `aifinder-admin-v1-official-${RUN_ID}`,
    journal_directory:
      `/Users/jamescarlodumaua/Downloads/AiFinder-Admin-V1-Official-${RUN_ID}`,
    preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    preview_project_name: "aifinder",
    preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    preview_team_slug: "ai-finder-s-projects",
    storage_bucket: "tool-logos",
    storage_name: `admin/${RUN_ID}.png`,
    temporary_commit_sha: "c".repeat(40),
    environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
  },
};

function effect(ordinal) {
  const actions = new Map([
    [8, "tool_added"], [10, "tool_updated"], [11, "tool_deleted"],
    [12, "submission_updated"], [13, "submission_rejected"],
    [14, "submission_approved"], [15, "logo_uploaded"], [19, "admin_logout"],
  ]);
  const base = actions.has(ordinal)
    ? {
        audit_action: actions.get(ordinal),
        audit_id: `audit-${ordinal}`,
        audit_version: "v1",
      }
    : null;
  if (ordinal === 8) return { ...base, tool_id: "tool-route", tool_version: "v1" };
  if (ordinal === 10) return { ...base, tool_id: "tool-route", tool_version: "v2" };
  if (ordinal === 11) return { ...base, tool_id: "tool-route", tool_version: "v3" };
  if ([12, 13].includes(ordinal)) return {
    ...base,
    submission_id: `submission-${ordinal - 11}`,
    submission_version: "v2",
  };
  if (ordinal === 14) return {
    ...base,
    approval_rpc: 1,
    submission_id: "submission-3",
    submission_version: "v2",
    tool_id: "tool-approved",
    tool_version: "v1",
  };
  if (ordinal === 15) return {
    ...base,
    logo_object_id: "logo-owned-v1",
    storage_version: "v1",
  };
  return base;
}

const operations = [];
let applicationOrdinal = 0;
let fixtureOrdinal = 0;
const transport = {
  async execute({ operation, input }) {
    operations.push(operation);
    if (operation === "inspect_prior_residue") return { status: "ABSENT" };
    if (operation === "inspect_environment_contract") {
      return { status: "EXACT", names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
    }
    if (operation === "inspect_owned_database_residue") return { status: "ABSENT" };
    if (operation === "prepare_local_temporary_commit") return {
      status: "VERIFIED_EXACT",
      commit_sha: authorization.execution.temporary_commit_sha,
      local_state_id: "local-temp-owned",
    };
    if (operation === "inspect_github_metadata") return {
      status: "EXACT",
      repository: authorization.repository.remote_repository,
      baseline: authorization.repository.head,
    };
    if (operation === "inspect_remote_ref") return { status: "ABSENT" };
    if (operation === "create_remote_ref") {
      return { status: "CREATED_EXACT", ref_id: "ref-owned" };
    }
    if (operation === "detect_automatic_preview") return { count: 0 };
    if (operation.startsWith("create_environment_")) {
      return { status: "CREATED_EXACT", record_id: `env-${operation.at(-1)}` };
    }
    if (operation === "create_preview") {
      return { status: "CREATED_EXACT", deployment_id: "dpl-owned" };
    }
    if (operation === "verify_preview_identity") return { status: "EXACT" };
    if (operation === "generate_oidc") return { token: Buffer.from("synthetic-oidc") };
    if (operation === "protected_access_handshake") return { status: "BOUND" };
    if (operation === "create_submitted_fixture") {
      fixtureOrdinal += 1;
      return {
        status: "CREATED_EXACT",
        row_id: `submission-${fixtureOrdinal}`,
        version: "v1",
      };
    }
    if (operation === "application_request") {
      applicationOrdinal += 1;
      const qualification = applicationOrdinal <= 6;
      const ledger = qualification
        ? ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER
        : ADMIN_V1_OFFICIAL_LEDGER;
      const index = qualification ? applicationOrdinal - 1 : applicationOrdinal - 7;
      const spec = ledger[index];
      assert.deepEqual(input.contract, spec);
      return {
        status: spec.status,
        header_projection: "EXACT_SECURITY_HEADERS",
        body_shape: "EXACT_BOUNDED_JSON",
        cookie_effect: [2, 4, 19].includes(spec.ordinal)
          ? `ORDINAL_${spec.ordinal}_COOKIE_EFFECT`
          : "NONE",
        ...(spec.ordinal === 2
          ? { session_cookie: Buffer.from("synthetic-session-cookie") }
          : {}),
        ...(spec.ordinal === 4
          ? {
              csrf_cookie: Buffer.from("synthetic-csrf-cookie"),
              csrf_token: Buffer.from("synthetic-csrf-token"),
            }
          : {}),
        effect: qualification ? null : effect(spec.ordinal),
        ...(spec.ordinal === 16
          ? { allow_methods: ["GET", "POST", "PUT", "DELETE"] }
          : {}),
        ...([17, 18].includes(spec.ordinal)
          ? {
              proxy_scope: "DENY_ADMIN_API_PATH",
              deferred_handler_executions: 0,
              deferred_database_effects: 0,
              deferred_rpc_effects: 0,
              deferred_storage_effects: 0,
            }
          : {}),
      };
    }
    if (operation === "inspect_submissions_poststate") return {
      status: "EXACT", submitted_tools: 3,
      ownership_readback: "EXACT", unrelated_preserved: true,
    };
    if (operation === "inspect_tools_poststate") return {
      status: "EXACT", tools: 2,
      ownership_readback: "EXACT", unrelated_preserved: true,
    };
    if (operation === "inspect_audits_poststate") return {
      status: "EXACT", audits: 8,
      ownership_readback: "EXACT", unrelated_preserved: true,
    };
    if (operation === "storage_read_owned_version") {
      return { status: "EXACT", version: "v1" };
    }
    if (operation === "prepare_storage_cleanup_grant") {
      return { status: "PREPARED", grant_id: "grant-owned" };
    }
    if (operation === "delete_storage_exact_version") return { status: "DELETED_EXACT" };
    if (operation === "revoke_storage_cleanup_grant") return { status: "REVOKED_EXACT" };
    if (operation === "inspect_remote_ref_before_delete") return { status: "EXACT_OWNED" };
    if (
      operation.startsWith("delete_") ||
      ["retire_protected_access", "cleanup_local_owned_temp_state"].includes(operation)
    ) return { status: "DELETED_EXACT" };
    if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
      return {
        status: "PROVEN_ABSENT",
        ownership_readback: "EXACT",
        unrelated_preserved: true,
      };
    }
    assert.fail(`unexpected operation ${operation}`);
  },
};

let current = null;
let retired = null;
const journal = {
  load() {
    return retired === null && current === null
      ? null
      : retired === null
        ? { value: { state: structuredClone(current) }, retired: false }
        : { value: { state: structuredClone(retired) }, retired: true };
  },
  publish(value) {
    current = structuredClone(value);
    return sha("d");
  },
  retire(value) {
    retired = structuredClone(value);
    current = null;
    return sha("e");
  },
};
const credentials = {
  admin_password: Buffer.from("synthetic-admin"),
  admin_session_secret: Buffer.from("synthetic-secret"),
  github_token: Buffer.from("synthetic-github"),
  supabase_anon_key: Buffer.from("synthetic-anon"),
  supabase_service_role_key: Buffer.from("synthetic-service"),
  supabase_url: Buffer.from("https://synthetic.supabase.co"),
  vercel_token: Buffer.from("synthetic-vercel"),
};

function jsonResponse(body, status = 200, headerValues = {}, setCookies = []) {
  const normalizedHeaders = new Map(
    Object.entries(headerValues).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    status,
    headers: {
      get(name) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      },
      getSetCookie() {
        return [...setCookies];
      },
    },
    async text() {
      return body === null ? "" : JSON.stringify(body);
    },
  };
}

function textResponse(body, status = 200, headerValues = {}, setCookies = []) {
  const normalizedHeaders = new Map(
    Object.entries(headerValues).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    status,
    headers: {
      get(name) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      },
      getSetCookie() {
        return [...setCookies];
      },
    },
    async text() {
      return body;
    },
  };
}

const EXACT_APPLICATION_SECURITY_HEADERS = Object.freeze({
  "cache-control": "no-store",
  "content-security-policy":
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  "content-type": "application/json",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-dns-prefetch-control": "off",
  "x-frame-options": "DENY",
});
const RUN_USER_AGENT = `AiFinder-Official-Run/${authorization.run_id}`;
const SYNTHETIC_OIDC_TOKEN = "synthetic-oidc";
const VERCEL_PROTECTION_CHALLENGE = [
  "<!doctype html>",
  "<html><head><title>Authentication Required</title></head>",
  "<body><a href=\"https://vercel.com/sso-api?url=https%3A%2F%2Fsynthetic-official-preview.vercel.app%2Fapi%2Fadmin%2Fsession\">Sign in</a></body></html>",
].join("");

function exactOfficialPreviewDeployment() {
  return {
    id: "dpl-direct",
    uid: "dpl-direct",
    url: "synthetic-official-preview.vercel.app",
    target: null,
    production: false,
    readyState: "READY",
    project: {
      id: authorization.execution.preview_project_id,
      name: authorization.execution.preview_project_name,
      accountId: authorization.execution.preview_team_id,
    },
    ownerId: authorization.execution.preview_team_id,
    gitSource: {
      type: "github",
      repo: authorization.repository.remote_repository,
      ref: authorization.execution.branch_name,
      sha: authorization.execution.temporary_commit_sha,
    },
    meta: {
      aifinderRunId: authorization.run_id,
      aifinderCandidate: authorization.candidate_identity_sha256,
      githubCommitSha: authorization.execution.temporary_commit_sha,
      githubCommitRef: authorization.execution.branch_name,
      githubCommitRepo: "aifinder",
      githubCommitOrg: "jcdumaua",
    },
  };
}

async function directApplicationRequest({
  contract,
  body,
  setCookies = [],
  input = {},
  responseHeaders = {},
}) {
  let applicationInit = null;
  const concrete = concreteTransport({
    fetch_impl: async (url, init) => {
      if (String(url).startsWith("https://api.vercel.com/v13/deployments")) {
        return jsonResponse(exactOfficialPreviewDeployment());
      }
      if (init.headers["user-agent"] !== RUN_USER_AGENT) {
        if (init.headers["x-vercel-trusted-oidc-idp-token"] === undefined) {
          return textResponse(
            VERCEL_PROTECTION_CHALLENGE,
            401,
            { "content-type": "text/html; charset=utf-8" },
          );
        }
        assert.equal(
          init.headers["x-vercel-trusted-oidc-idp-token"],
          SYNTHETIC_OIDC_TOKEN,
        );
        return jsonResponse(
          { authenticated: false, message: "Unauthorized." },
          401,
          EXACT_APPLICATION_SECURITY_HEADERS,
        );
      }
      applicationInit = init;
      return jsonResponse(
        body,
        contract.status,
        { ...EXACT_APPLICATION_SECURITY_HEADERS, ...responseHeaders },
        setCookies,
      );
    },
    spawn_sync: absentRef,
  });
  await concrete.execute({
    operation: "create_preview",
    input: { branch_name: authorization.execution.branch_name },
    authorization,
    credentials,
  });
  await concrete.execute({
    operation: "verify_preview_identity",
    input: {},
    authorization,
    credentials,
  });
  await concrete.execute({
    operation: "protected_access_handshake",
    input: { oidc_token: Buffer.from(SYNTHETIC_OIDC_TOKEN) },
    authorization,
    credentials,
  });
  const result = await concrete.execute({
    operation: "application_request",
    input: {
      lane: "OFFICIAL",
      sequence_ordinal: contract.ordinal,
      contract,
      session: null,
      csrf_token: null,
      csrf_cookie: null,
      admin_password: null,
      ...input,
    },
    authorization,
    credentials,
  });
  return { applicationInit, result };
}

function concreteTransport({ fetch_impl, spawn_sync }) {
  return createAdminV1OfficialConcreteTransport({
    execution_context: {
      git_execution_context: {
        git_dir: "/tmp/aifinder-official-synthetic-git-dir",
        object_directory: "/tmp/aifinder-official-synthetic-objects",
      },
    },
    fetch_impl,
    spawn_sync,
  });
}

const absentRef = () => ({ status: 0, stdout: "", stderr: "" });
const focusedFailures = [];
async function focusedCheck(name, check) {
  try {
    await check();
  } catch (error) {
    focusedFailures.push(`${name}: ${error?.message ?? String(error)}`);
  }
}

async function assertFailsClosed({
  operation,
  input = {},
  forbiddenStatus,
  fetch_impl,
  spawn_sync = absentRef,
  operationCredentials = credentials,
}) {
  try {
    const result = await concreteTransport({ fetch_impl, spawn_sync }).execute({
      operation,
      input,
      authorization,
      credentials: operationCredentials,
    });
    assert.notEqual(result?.status, forbiddenStatus);
  } catch (error) {
    if (error?.code === "ERR_ASSERTION") throw error;
    assert.match(error?.code ?? "", /^OFFICIAL_/u);
  }
}

await focusedCheck("application credentials cannot be sent before exact preview verification", async () => {
  let applicationRequests = 0;
  const concrete = concreteTransport({
    fetch_impl: async (url, init) => {
      if (String(url).startsWith("https://api.vercel.com/v13/deployments")) {
        return jsonResponse(exactOfficialPreviewDeployment());
      }
      applicationRequests += 1;
      return jsonResponse(
        { success: true, message: "Admin login successful." },
        200,
        EXACT_APPLICATION_SECURITY_HEADERS,
        [
          "aifinder_admin_session=must-not-be-sent; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400",
        ],
      );
    },
    spawn_sync: absentRef,
  });
  await concrete.execute({
    operation: "create_preview",
    input: {},
    authorization,
    credentials,
  });
  await assert.rejects(
    concrete.execute({
      operation: "application_request",
      input: {
        lane: "OFFICIAL",
        sequence_ordinal: 2,
        contract: ADMIN_V1_OFFICIAL_LEDGER[1],
        session: null,
        csrf_token: null,
        csrf_cookie: null,
        admin_password: Buffer.from("synthetic-admin"),
      },
      authorization,
      credentials,
    }),
    (error) => error?.code === "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN",
  );
  assert.equal(applicationRequests, 0);
});

for (const [name, mutate] of [
  ["deployment id", (value) => { value.id = "dpl-wrong"; value.uid = "dpl-wrong"; }],
  ["deployment URL", (value) => { value.url = "wrong-preview.vercel.app"; }],
  ["project", (value) => { value.project.id = "prj_wrong"; }],
  ["team", (value) => { value.ownerId = "team_wrong"; }],
  ["run marker", (value) => { value.meta.aifinderRunId = "66666666-6666-4666-8666-666666666666"; }],
  ["candidate marker", (value) => { value.meta.aifinderCandidate = "f".repeat(64); }],
  ["temporary commit", (value) => { value.gitSource.sha = "e".repeat(40); }],
  ["branch ref", (value) => { value.gitSource.ref = "wrong-branch"; }],
  ["repository", (value) => { value.gitSource.repo = "other/repository"; }],
  ["target", (value) => { value.target = "production"; }],
  ["production", (value) => { value.production = true; }],
  ["missing production flag", (value) => { delete value.production; }],
  ["READY state", (value) => { value.readyState = "BUILDING"; }],
  ["contradictory READY aliases", (value) => { value.state = "ERROR"; }],
]) {
  await focusedCheck(`preview verification rejects mismatched ${name}`, async () => {
    let requestOrdinal = 0;
    const concrete = concreteTransport({
      fetch_impl: async () => {
        requestOrdinal += 1;
        const deployment = exactOfficialPreviewDeployment();
        if (requestOrdinal === 2) mutate(deployment);
        return jsonResponse(deployment);
      },
      spawn_sync: absentRef,
    });
    await concrete.execute({
      operation: "create_preview",
      input: {},
      authorization,
      credentials,
    });
    await assert.rejects(
      concrete.execute({
        operation: "verify_preview_identity",
        input: {},
        authorization,
        credentials,
      }),
      (error) => error?.code === "OFFICIAL_PREVIEW_IDENTITY_UNPROVEN",
    );
  });
}

function createProtectedAccessProbe({
  negativeResponse = () => textResponse(
    VERCEL_PROTECTION_CHALLENGE,
    401,
    { "content-type": "text/html; charset=utf-8" },
  ),
  positiveResponse = () => jsonResponse(
    { authenticated: false, message: "Unauthorized." },
    401,
    EXACT_APPLICATION_SECURITY_HEADERS,
  ),
} = {}) {
  const state = { preview_requests: [] };
  const concrete = concreteTransport({
    fetch_impl: async (rawUrl, init) => {
      const url = new URL(String(rawUrl));
      if (url.hostname === "api.vercel.com") {
        return jsonResponse(exactOfficialPreviewDeployment());
      }
      state.preview_requests.push({
        body: init.body,
        headers: structuredClone(init.headers),
        method: init.method,
        url: String(rawUrl),
      });
      return state.preview_requests.length === 1
        ? negativeResponse({ init, url })
        : positiveResponse({ init, url });
    },
    spawn_sync: absentRef,
  });
  return {
    state,
    async execute() {
      await concrete.execute({
        operation: "create_preview",
        input: {},
        authorization,
        credentials,
      });
      await concrete.execute({
        operation: "verify_preview_identity",
        input: {},
        authorization,
        credentials,
      });
      return concrete.execute({
        operation: "protected_access_handshake",
        input: { oidc_token: Buffer.from(SYNTHETIC_OIDC_TOKEN) },
        authorization,
        credentials,
      });
    },
  };
}

await focusedCheck("protected access requires exact challenge then trusted OIDC traversal", async () => {
  const probe = createProtectedAccessProbe();
  const result = await probe.execute();
  assert.deepEqual(result, { status: "BOUND", physical_requests: 2 });
  assert.equal(probe.state.preview_requests.length, 2);
  const [negative, positive] = probe.state.preview_requests;
  assert.equal(negative.url, positive.url);
  assert.equal(
    negative.url,
    "https://synthetic-official-preview.vercel.app/api/admin/session",
  );
  assert.equal(negative.method, "GET");
  assert.equal(positive.method, "GET");
  assert.equal(negative.body, undefined);
  assert.equal(positive.body, undefined);
  for (const name of [
    "authorization",
    "cookie",
    "x-csrf-token",
    "x-vercel-trusted-oidc-idp-token",
  ]) assert.equal(negative.headers[name], undefined);
  for (const name of ["authorization", "cookie", "x-csrf-token"]) {
    assert.equal(positive.headers[name], undefined);
  }
  assert.equal(
    positive.headers["x-vercel-trusted-oidc-idp-token"],
    SYNTHETIC_OIDC_TOKEN,
  );
});

await focusedCheck("plain application 401 cannot prove protected access", async () => {
  const application401 = () => jsonResponse(
    { authenticated: false, message: "Unauthorized." },
    401,
    EXACT_APPLICATION_SECURITY_HEADERS,
  );
  const probe = createProtectedAccessProbe({
    negativeResponse: application401,
    positiveResponse: application401,
  });
  const result = await probe.execute();
  assert.notEqual(result.status, "BOUND");
  assert.equal(probe.state.preview_requests.length, 1);
});

await focusedCheck("same application 401 with and without OIDC fails closed", async () => {
  const application401 = () => jsonResponse(
    { authenticated: false, message: "Unauthorized." },
    401,
    EXACT_APPLICATION_SECURITY_HEADERS,
  );
  const probe = createProtectedAccessProbe({
    negativeResponse: application401,
    positiveResponse: application401,
  });
  const result = await probe.execute();
  assert.notEqual(result.status, "BOUND");
});

await focusedCheck("repeated Vercel protection challenge does not prove OIDC traversal", async () => {
  const challenge = () => textResponse(
    VERCEL_PROTECTION_CHALLENGE,
    401,
    { "content-type": "text/html; charset=utf-8" },
  );
  const probe = createProtectedAccessProbe({
    negativeResponse: challenge,
    positiveResponse: challenge,
  });
  const result = await probe.execute();
  assert.notEqual(result.status, "BOUND");
  assert.equal(probe.state.preview_requests.length, 2);
});

for (const [name, response] of [
  [
    "wrong challenge content type",
    () => textResponse(
      VERCEL_PROTECTION_CHALLENGE,
      401,
      { "content-type": "application/json" },
    ),
  ],
  [
    "challenge cookie",
    () => textResponse(
      VERCEL_PROTECTION_CHALLENGE,
      401,
      { "content-type": "text/html; charset=utf-8" },
      ["unexpected=challenge-cookie; Path=/; Secure; HttpOnly"],
    ),
  ],
  [
    "oversized challenge",
    () => textResponse(
      `${VERCEL_PROTECTION_CHALLENGE}${"x".repeat(64 * 1024)}`,
      401,
      { "content-type": "text/html; charset=utf-8" },
    ),
  ],
]) {
  await focusedCheck(`protected access rejects ${name}`, async () => {
    const probe = createProtectedAccessProbe({ negativeResponse: response });
    const result = await probe.execute();
    assert.notEqual(result.status, "BOUND");
    assert.equal(probe.state.preview_requests.length, 1);
  });
}

await focusedCheck("automatic preview inventory uses exact project branch namespace", async () => {
  let inspectedUrl = null;
  const result = await concreteTransport({
    fetch_impl: async (url) => {
      inspectedUrl = new URL(String(url));
      return jsonResponse({ deployments: [], pagination: { count: 0, next: null } });
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "detect_automatic_preview",
    input: {},
    authorization,
    credentials,
  });
  assert.deepEqual(result, { count: 0 });
  assert.equal(
    inspectedUrl.searchParams.get("projectId"),
    authorization.execution.preview_project_id,
  );
  assert.equal(
    inspectedUrl.searchParams.get("meta-githubCommitRef"),
    authorization.execution.branch_name,
  );
  assert.equal(inspectedUrl.searchParams.has("meta-aifinderRunId"), false);
});

for (const [name, response] of [
  ["non-2xx status", jsonResponse({}, 403)],
  ["missing deployments", jsonResponse({ pagination: { count: 0, next: null } })],
  ["missing pagination", jsonResponse({ deployments: [] })],
  ["non-terminal pagination", jsonResponse({
    deployments: [],
    pagination: { count: 0, next: "next-page" },
  })],
]) {
  await focusedCheck(`automatic preview inventory rejects ${name}`, async () => {
    await assert.rejects(
      concreteTransport({
        fetch_impl: async () => response,
        spawn_sync: absentRef,
      }).execute({
        operation: "detect_automatic_preview",
        input: {},
        authorization,
        credentials,
      }),
      (error) => error?.code === "OFFICIAL_AUTOMATIC_PREVIEW_INVENTORY_UNPROVEN",
    );
  });
}

await focusedCheck("owned data residue cannot be certified absent", async () => {
  await assertFailsClosed({
    operation: "verify_zero_data_residual",
    forbiddenStatus: "PROVEN_ABSENT",
    input: {
      allow_non_owned_storage_replacement: false,
      owned: {
        audit_rows: [],
        logo: null,
        submissions: [{ row_id: "submission-1", version: "v1" }],
        tools: [],
      },
    },
    fetch_impl: async (url) => {
      if (String(url).includes("/rest/v1/submitted_tools")) {
        return jsonResponse([{ id: "submission-1", updated_at: "v1" }]);
      }
      return jsonResponse([]);
    },
  });
});

for (const [name, row] of [
  ["website", {
    id: 1,
    name: `AiFinder Official ${RUN_ID} 1`,
    status: "pending",
    updated_at: "2030-01-01T00:00:00.000Z",
    website: "https://unrelated.invalid/",
  }],
  ["name", {
    id: 1,
    name: "Unrelated submission",
    status: "pending",
    updated_at: "2030-01-01T00:00:00.000Z",
    website: `https://${RUN_ID}-1.invalid/`,
  }],
  ["status", {
    id: 1,
    name: `AiFinder Official ${RUN_ID} 1`,
    status: "approved",
    updated_at: "2030-01-01T00:00:00.000Z",
    website: `https://${RUN_ID}-1.invalid/`,
  }],
]) {
  await focusedCheck(`fixture creation rejects substituted ${name}`, async () => {
    await assert.rejects(
      concreteTransport({
        fetch_impl: async () => jsonResponse([row]),
        spawn_sync: absentRef,
      }).execute({
        operation: "create_submitted_fixture",
        input: {
          fixture_ordinal: 1,
          website: `https://${RUN_ID}-1.invalid/`,
        },
        authorization,
        credentials,
      }),
      (error) => error?.code === "OFFICIAL_APPLICATION_OWNERSHIP_UNPROVEN",
    );
  });
}

await focusedCheck("unjournaled run-owned data cannot be certified absent", async () => {
  await assertFailsClosed({
    operation: "verify_zero_data_residual",
    forbiddenStatus: "PROVEN_ABSENT",
    input: {
      allow_non_owned_storage_replacement: false,
      owned: {
        audit_rows: [],
        logo: null,
        submissions: [],
        tools: [],
      },
    },
    fetch_impl: async (url) => {
      if (String(url).includes("/rest/v1/submitted_tools")) {
        return jsonResponse([{ id: "unjournaled-run-owned-submission" }]);
      }
      if (String(url).includes("/storage/v1/object/info/")) {
        return jsonResponse(null, 404);
      }
      return jsonResponse([]);
    },
  });
});

await focusedCheck("owned external residue cannot be certified absent", async () => {
  await assertFailsClosed({
    operation: "verify_zero_external_residual",
    forbiddenStatus: "PROVEN_ABSENT",
    input: {
      local_state_id: null,
      remote_ref: `refs/heads/${authorization.execution.branch_name}`,
      deployment_id: null,
      environment_record_ids: [],
    },
    fetch_impl: async () => jsonResponse({
      deployments: [],
      pagination: { count: 0, next: null },
    }),
    spawn_sync: () => ({
      status: 0,
      stderr: "",
      stdout: `${authorization.execution.temporary_commit_sha}\trefs/heads/${authorization.execution.branch_name}\n`,
    }),
  });
});

await focusedCheck("ambiguous external pagination cannot be certified absent", async () => {
  await assertFailsClosed({
    operation: "verify_zero_external_residual",
    forbiddenStatus: "PROVEN_ABSENT",
    input: {
      local_state_id: null,
      remote_ref: `refs/heads/${authorization.execution.branch_name}`,
      deployment_id: null,
      environment_record_ids: [],
    },
    fetch_impl: async () => jsonResponse({
      deployments: [],
      pagination: { count: 0, next: "next-page" },
    }),
  });
});

await focusedCheck("nonempty environment inventory without pagination cannot prove prior absence", async () => {
  let requestOrdinal = 0;
  await assertFailsClosed({
    operation: "inspect_prior_residue",
    forbiddenStatus: "ABSENT",
    fetch_impl: async () => {
      requestOrdinal += 1;
      if (requestOrdinal === 1) {
        return jsonResponse({
          deployments: [],
          pagination: { count: 0, next: null },
        });
      }
      return jsonResponse({
        envs: [{
          id: "env-owned",
          key: authorization.execution.environment_keys[0],
          target: ["preview"],
          gitBranch: authorization.execution.branch_name,
        }],
      });
    },
  });
});

await focusedCheck("empty environment inventory without pagination proves absence", async () => {
  let requestOrdinal = 0;
  const result = await concreteTransport({
    fetch_impl: async () => {
      requestOrdinal += 1;
      return requestOrdinal === 1
        ? jsonResponse({
            deployments: [],
            pagination: { count: 0, next: null },
          })
        : jsonResponse({ envs: [] });
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "inspect_prior_residue",
    input: {},
    authorization,
    credentials,
  });
  assert.deepEqual(result, { status: "ABSENT" });
});

await focusedCheck("malformed environment pagination remains ambiguous", async () => {
  let requestOrdinal = 0;
  await assertFailsClosed({
    operation: "inspect_prior_residue",
    forbiddenStatus: "ABSENT",
    fetch_impl: async () => {
      requestOrdinal += 1;
      return requestOrdinal === 1
        ? jsonResponse({
            deployments: [],
            pagination: { count: 0, next: null },
          })
        : jsonResponse({ envs: [], pagination: {} });
    },
  });
});

await focusedCheck("exact paginated environment inventory remains accepted", async () => {
  let requestOrdinal = 0;
  const result = await concreteTransport({
    fetch_impl: async () => {
      requestOrdinal += 1;
      return requestOrdinal === 1
        ? jsonResponse({
            deployments: [],
            pagination: { count: 0, next: null },
          })
        : jsonResponse({
            envs: [],
            pagination: { count: 0, next: null },
          });
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "inspect_prior_residue",
    input: {},
    authorization,
    credentials,
  });
  assert.deepEqual(result, { status: "ABSENT" });
});

function createEnvironmentReadbackProbe({
  createBody = { id: "env-created-exact" },
  inventoryBody = {
    envs: [{
      id: "env-created-exact",
      key: authorization.execution.environment_keys[0],
      target: ["preview"],
      gitBranch: authorization.execution.branch_name,
    }],
    pagination: { count: 1, next: null },
  },
} = {}) {
  const state = {
    deletes: 0,
    requests: [],
    secret_value_reads: 0,
  };
  const concrete = concreteTransport({
    fetch_impl: async (rawUrl, init) => {
      const url = new URL(String(rawUrl));
      state.requests.push({ method: init.method, url });
      if (init.method === "POST") return jsonResponse(createBody, 201);
      if (init.method === "GET") {
        assert.equal(url.pathname, `/v10/projects/${authorization.execution.preview_project_id}/env`);
        assert.equal(url.searchParams.get("teamId"), authorization.execution.preview_team_id);
        assert.equal(url.searchParams.get("target"), "preview");
        assert.equal(url.searchParams.get("gitBranch"), authorization.execution.branch_name);
        assert.equal(url.searchParams.get("decrypt"), "false");
        return jsonResponse(inventoryBody);
      }
      if (init.method === "DELETE") {
        state.deletes += 1;
        return jsonResponse(null, 204);
      }
      assert.fail(`unexpected environment probe request ${init.method} ${url}`);
    },
    spawn_sync: absentRef,
  });
  return {
    state,
    execute() {
      return concrete.execute({
        operation: "create_environment_1",
        input: {
          key: authorization.execution.environment_keys[0],
          value: Buffer.from("synthetic-environment-value"),
        },
        authorization,
        credentials,
      });
    },
  };
}

await focusedCheck("environment create response ID alone is not ownership", async () => {
  const probe = createEnvironmentReadbackProbe({
    inventoryBody: { envs: [], pagination: { count: 0, next: null } },
  });
  await assert.rejects(
    probe.execute(),
    (error) => error?.code === "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
  );
  assert.deepEqual(probe.state.requests.map(({ method }) => method), ["POST", "GET"]);
  assert.equal(probe.state.deletes, 0);
});

await focusedCheck("environment create requires exact non-decrypting readback", async () => {
  const probe = createEnvironmentReadbackProbe();
  const result = await probe.execute();
  assert.deepEqual(result, {
    status: "CREATED_EXACT",
    record_id: "env-created-exact",
  });
  assert.deepEqual(probe.state.requests.map(({ method }) => method), ["POST", "GET"]);
  assert.equal(probe.state.secret_value_reads, 0);
});

for (const [name, mutate] of [
  ["substituted ID", (record) => { record.id = "env-unrelated"; }],
  ["wrong key", (record) => { record.key = authorization.execution.environment_keys[1]; }],
  ["wrong target", (record) => { record.target = ["production"]; }],
  ["wrong branch", (record) => { record.gitBranch = "unrelated-branch"; }],
  ["missing branch", (record) => { delete record.gitBranch; }],
  ["wrong project", (record) => { record.projectId = "prj_unrelated"; }],
  ["wrong team", (record) => { record.teamId = "team_unrelated"; }],
]) {
  await focusedCheck(`environment create readback rejects ${name}`, async () => {
    const record = {
      id: "env-created-exact",
      key: authorization.execution.environment_keys[0],
      target: ["preview"],
      gitBranch: authorization.execution.branch_name,
    };
    mutate(record);
    const probe = createEnvironmentReadbackProbe({
      inventoryBody: {
        envs: [record],
        pagination: { count: 1, next: null },
      },
    });
    await assert.rejects(
      probe.execute(),
      (error) => error?.code === "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
    );
    assert.equal(probe.state.deletes, 0);
  });
}

for (const [name, createBody, inventoryBody] of [
  [
    "duplicate readback records",
    { id: "env-created-exact" },
    {
      envs: [1, 2].map(() => ({
        id: "env-created-exact",
        key: authorization.execution.environment_keys[0],
        target: ["preview"],
        gitBranch: authorization.execution.branch_name,
      })),
      pagination: { count: 2, next: null },
    },
  ],
  [
    "ambiguous create response",
    { created: [{ id: "env-created-exact" }, { id: "env-unrelated" }] },
    { envs: [], pagination: { count: 0, next: null } },
  ],
  [
    "malformed readback pagination",
    { id: "env-created-exact" },
    { envs: [], pagination: { count: 0, next: "next-page" } },
  ],
]) {
  await focusedCheck(`environment create rejects ${name}`, async () => {
    const probe = createEnvironmentReadbackProbe({ createBody, inventoryBody });
    await assert.rejects(
      probe.execute(),
      (error) => error?.code === "OFFICIAL_ENVIRONMENT_CREATE_IDENTITY_UNPROVEN",
    );
    assert.equal(probe.state.deletes, 0);
  });
}

for (const absentStatus of [400, 404]) {
  await focusedCheck(`Storage HEAD ${absentStatus} proves exact-path absence`, async () => {
    let storageReads = 0;
    const result = await concreteTransport({
      fetch_impl: async (url, init) => {
        if (String(url).includes("/rest/v1/")) return jsonResponse([]);
        storageReads += 1;
        assert.equal(init.method, "HEAD");
        assert.equal(
          new URL(String(url)).pathname,
          `/storage/v1/object/${authorization.execution.storage_bucket}/${authorization.execution.storage_name}`,
        );
        return jsonResponse(null, absentStatus);
      },
      spawn_sync: absentRef,
    }).execute({
      operation: "inspect_owned_database_residue",
      input: {},
      authorization,
      credentials,
    });
    assert.deepEqual(result, { status: "ABSENT" });
    assert.equal(storageReads, 1);
  });
}

await focusedCheck("Storage HEAD 2xx proves exact-path presence", async () => {
  const result = await concreteTransport({
    fetch_impl: async (url, init) => {
      if (String(url).includes("/rest/v1/")) return jsonResponse([]);
      assert.equal(init.method, "HEAD");
      return jsonResponse(null, 204);
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "inspect_owned_database_residue",
    input: {},
    authorization,
    credentials,
  });
  assert.deepEqual(result, { status: "PRESENT" });
});

for (const ambiguousStatus of [401, 403, 429, 500]) {
  await focusedCheck(`Storage HEAD ${ambiguousStatus} remains ambiguous`, async () => {
    await assertFailsClosed({
      operation: "inspect_owned_database_residue",
      forbiddenStatus: "ABSENT",
      fetch_impl: async (url) => String(url).includes("/rest/v1/")
        ? jsonResponse([])
        : jsonResponse(null, ambiguousStatus),
    });
  });
}

await focusedCheck("present Storage version requires exact info metadata", async () => {
  let storageReads = 0;
  const result = await concreteTransport({
    fetch_impl: async (url, init) => {
      storageReads += 1;
      if (storageReads === 1) {
        assert.equal(init.method, "HEAD");
        return jsonResponse(null, 200);
      }
      assert.equal(init.method, "GET");
      assert.equal(String(url).includes("/storage/v1/object/info/"), true);
      return jsonResponse({
        bucket_id: authorization.execution.storage_bucket,
        name: authorization.execution.storage_name,
        version: "owned-v1",
      });
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "storage_read_owned_version",
    input: { object_id: authorization.execution.storage_name },
    authorization,
    credentials,
  });
  assert.deepEqual(result, { status: "EXACT", version: "owned-v1" });
  assert.equal(storageReads, 2);
});

await focusedCheck("arbitrary Storage info 4xx cannot establish absence", async () => {
  await assertFailsClosed({
    operation: "storage_read_owned_version",
    input: { object_id: authorization.execution.storage_name },
    forbiddenStatus: "ABSENT",
    fetch_impl: async (_url, init) => init.method === "HEAD"
      ? jsonResponse(null, 200)
      : jsonResponse({ error: "synthetic-info-denial" }, 404),
  });
});

await focusedCheck("non-owned Storage replacement remains preserved", async () => {
  const result = await concreteTransport({
    fetch_impl: async (url) => {
      if (String(url).includes("/storage/v1/object/info/")) {
        return jsonResponse({
          bucket_id: authorization.execution.storage_bucket,
          name: authorization.execution.storage_name,
          version: "replacement-v2",
        });
      }
      return jsonResponse([]);
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "verify_zero_data_residual",
    input: {
      allow_non_owned_storage_replacement: true,
      owned: {
        audit_rows: [],
        logo: {
          object_id: authorization.execution.storage_name,
          version: "owned-v1",
        },
        submissions: [],
        tools: [],
      },
    },
    authorization,
    credentials,
  });
  assert.deepEqual(result, {
    status: "PROVEN_ABSENT",
    ownership_readback: "EXACT",
    unrelated_preserved: true,
  });
});

await focusedCheck("present prior namespace cannot be reported absent", async () => {
  await assertFailsClosed({
    operation: "inspect_prior_residue",
    forbiddenStatus: "ABSENT",
    fetch_impl: async () => jsonResponse({
      deployments: [{
        id: "dpl-owned",
        uid: "dpl-owned",
        url: "aifinder-owned-preview.vercel.app",
        target: null,
        production: false,
        readyState: "READY",
        meta: {
          aifinderRunId: authorization.run_id,
          aifinderCandidate: authorization.candidate_identity_sha256,
          githubCommitSha: authorization.execution.temporary_commit_sha,
          githubCommitRef: authorization.execution.branch_name,
          githubCommitRepo: "aifinder",
          githubCommitOrg: "jcdumaua",
        },
      }],
      pagination: { count: 1, next: null },
    }),
  });
});

await focusedCheck("mismatched provider project cannot satisfy environment gate", async () => {
  const observedCredentials = loadAdminV1OfficialCredentials({
    environment: {
      ADMIN_PASSWORD: "synthetic-admin",
      ADMIN_SESSION_SECRET: "synthetic-session-secret",
      GH_TOKEN: "synthetic-github",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
      NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.invalid",
      NODE_ENV: "production",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role",
      VERCEL_TOKEN: "synthetic-vercel",
    },
    credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  });
  try {
    await assertFailsClosed({
      operation: "inspect_environment_contract",
      forbiddenStatus: "EXACT",
      operationCredentials: observedCredentials,
      fetch_impl: async () => jsonResponse({
        id: "wrong-project",
        name: authorization.execution.preview_project_name,
        accountId: authorization.execution.preview_team_id,
      }),
    });
  } finally {
    for (const value of Object.values(observedCredentials)) value.fill(0);
  }
});

await focusedCheck("real concrete login projects security headers and session memory", async () => {
  const sessionValue = "synthetic-session-cookie";
  const { applicationInit, result } = await directApplicationRequest({
    contract: ADMIN_V1_OFFICIAL_LEDGER[1],
    body: { success: true, message: "Admin login successful." },
    setCookies: [
      `aifinder_admin_session=${sessionValue}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400`,
    ],
    input: { admin_password: Buffer.from("synthetic-admin") },
  });
  assert.equal(applicationInit.headers["user-agent"], RUN_USER_AGENT);
  assert.equal(
    applicationInit.headers["x-vercel-trusted-oidc-idp-token"],
    SYNTHETIC_OIDC_TOKEN,
  );
  assert.equal(applicationInit.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(applicationInit.body), { password: "synthetic-admin" });
  assert.equal(result.status, 200);
  assert.equal(result.header_projection, "EXACT_SECURITY_HEADERS");
  assert.equal(result.body_shape, "EXACT_BOUNDED_JSON");
  assert.equal(result.cookie_effect, "SESSION_SET");
  assert.deepEqual(result.session_cookie, Buffer.from(sessionValue));
  assert.equal(result.ownership_projection, "EXACT_POSTSTATE_REQUIRED");
  result.session_cookie.fill(0);
});

await focusedCheck("real concrete CSRF projects matching cookie and body token memory", async () => {
  const csrfValue = "c".repeat(64);
  const { applicationInit, result } = await directApplicationRequest({
    contract: ADMIN_V1_OFFICIAL_LEDGER[3],
    body: { success: true, csrfToken: csrfValue },
    setCookies: [
      `aifinder_admin_csrf_token=${csrfValue}; Path=/; Secure; SameSite=Strict; Max-Age=14400`,
    ],
    input: { session: Buffer.from("synthetic-session-cookie") },
  });
  assert.equal(applicationInit.headers["user-agent"], RUN_USER_AGENT);
  assert.equal(
    applicationInit.headers.cookie,
    "aifinder_admin_session=synthetic-session-cookie",
  );
  assert.deepEqual(result.csrf_token, Buffer.from(csrfValue));
  assert.deepEqual(result.csrf_cookie, Buffer.from(csrfValue));
  assert.equal(result.cookie_effect, "CSRF_SET");
  result.csrf_token.fill(0);
  result.csrf_cookie.fill(0);
});

for (const [name, cookie] of [
  ["missing HttpOnly", "aifinder_admin_session=session; Path=/; Secure; SameSite=Strict; Max-Age=14400"],
  ["missing Secure", "aifinder_admin_session=session; Path=/; HttpOnly; SameSite=Strict; Max-Age=14400"],
  ["wrong SameSite", "aifinder_admin_session=session; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=14400"],
  ["wrong Path", "aifinder_admin_session=session; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=14400"],
  ["wrong Max-Age", "aifinder_admin_session=session; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600"],
  ["unexpected Domain", "aifinder_admin_session=session; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400; Domain=example.invalid"],
]) {
  await focusedCheck(`login rejects session cookie with ${name}`, async () => {
    await assert.rejects(
      directApplicationRequest({
        contract: ADMIN_V1_OFFICIAL_LEDGER[1],
        body: { success: true, message: "Admin login successful." },
        setCookies: [cookie],
        input: { admin_password: Buffer.from("synthetic-admin") },
      }),
      (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
    );
  });
}

for (const [name, cookie] of [
  ["HttpOnly present", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400`],
  ["missing Secure", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; SameSite=Strict; Max-Age=14400`],
  ["wrong SameSite", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; Secure; SameSite=Lax; Max-Age=14400`],
  ["wrong Path", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/admin; Secure; SameSite=Strict; Max-Age=14400`],
  ["wrong Max-Age", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; Secure; SameSite=Strict; Max-Age=3600`],
  ["unexpected Domain", `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; Secure; SameSite=Strict; Max-Age=14400; Domain=example.invalid`],
]) {
  await focusedCheck(`CSRF rejects cookie with ${name}`, async () => {
    await assert.rejects(
      directApplicationRequest({
        contract: ADMIN_V1_OFFICIAL_LEDGER[3],
        body: { success: true, csrfToken: "c".repeat(64) },
        setCookies: [cookie],
        input: { session: Buffer.from("synthetic-session-cookie") },
      }),
      (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
    );
  });
}

await focusedCheck("logout proves exact session and CSRF cookie clearing", async () => {
  const { result } = await directApplicationRequest({
    contract: ADMIN_V1_OFFICIAL_LEDGER[18],
    body: { success: true, message: "Admin logged out." },
    setCookies: [
      "aifinder_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      "aifinder_admin_csrf_token=; Path=/; Secure; SameSite=Strict; Max-Age=0",
    ],
    input: {
      session: Buffer.from("synthetic-session-cookie"),
      csrf_token: Buffer.from("c".repeat(64)),
      csrf_cookie: Buffer.from("c".repeat(64)),
    },
  });
  assert.equal(result.cookie_effect, "SESSION_CSRF_CLEARED");
});

for (const [name, cookies] of [
  ["wrong cookie names", [
    "wrong_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
    "wrong_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0",
  ]],
  ["duplicate session cookie", [
    "aifinder_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
    "aifinder_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
  ]],
  ["nonempty cleared values", [
    "aifinder_admin_session=still-present; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
    "aifinder_admin_csrf_token=still-present; Path=/; Secure; SameSite=Strict; Max-Age=0",
  ]],
  ["missing secure attributes", [
    "aifinder_admin_session=; Path=/; Max-Age=0",
    "aifinder_admin_csrf_token=; Path=/; Max-Age=0",
  ]],
  ["unexpected Domain", [
    "aifinder_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Domain=example.invalid",
    "aifinder_admin_csrf_token=; Path=/; Secure; SameSite=Strict; Max-Age=0",
  ]],
]) {
  await focusedCheck(`logout rejects ${name}`, async () => {
    await assert.rejects(
      directApplicationRequest({
        contract: ADMIN_V1_OFFICIAL_LEDGER[18],
        body: { success: true, message: "Admin logged out." },
        setCookies: cookies,
        input: {
          session: Buffer.from("synthetic-session-cookie"),
          csrf_token: Buffer.from("c".repeat(64)),
          csrf_cookie: Buffer.from("c".repeat(64)),
        },
      }),
      (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
    );
  });
}

await focusedCheck("application JSON rejects unexpected top-level keys", async () => {
  await assert.rejects(
    directApplicationRequest({
      contract: ADMIN_V1_OFFICIAL_LEDGER[6],
      body: { tools: [], unexpected: true },
      input: {
        session: Buffer.from("synthetic-session-cookie"),
        csrf_token: Buffer.from("c".repeat(64)),
        csrf_cookie: Buffer.from("c".repeat(64)),
      },
    }),
    (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
  );
});

await focusedCheck("application JSON rejects over-limit row arrays", async () => {
  await assert.rejects(
    directApplicationRequest({
      contract: ADMIN_V1_OFFICIAL_LEDGER[6],
      body: { tools: Array.from({ length: 1001 }, (_, id) => ({ id })) },
      input: {
        session: Buffer.from("synthetic-session-cookie"),
        csrf_token: Buffer.from("c".repeat(64)),
        csrf_cookie: Buffer.from("c".repeat(64)),
      },
    }),
    (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
  );
});

await focusedCheck("application JSON rejects unexpected row shapes", async () => {
  await assert.rejects(
    directApplicationRequest({
      contract: ADMIN_V1_OFFICIAL_LEDGER[6],
      body: { tools: [{ id: 1 }] },
      input: {
        session: Buffer.from("synthetic-session-cookie"),
        csrf_token: Buffer.from("c".repeat(64)),
        csrf_cookie: Buffer.from("c".repeat(64)),
      },
    }),
    (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
  );
});

await focusedCheck("application JSON rejects non-numeric statistics", async () => {
  await assert.rejects(
    directApplicationRequest({
      contract: ADMIN_V1_OFFICIAL_LEDGER[5],
      body: {
        submissions: [],
        stats: {
          approvedSubmissions: 0,
          pendingSubmissions: "0",
          rejectedSubmissions: 0,
          totalTools: 0,
        },
      },
      input: {
        session: Buffer.from("synthetic-session-cookie"),
        csrf_token: Buffer.from("c".repeat(64)),
        csrf_cookie: Buffer.from("c".repeat(64)),
      },
    }),
    (error) => error?.code === "OFFICIAL_APPLICATION_RESPONSE_INVALID",
  );
});

await focusedCheck("real concrete method denial projects exact Allow header", async () => {
  const { result } = await directApplicationRequest({
    contract: ADMIN_V1_OFFICIAL_LEDGER[15],
    body: { error: "Method not allowed." },
    responseHeaders: { allow: "GET, POST, PUT, DELETE" },
    input: {
      session: Buffer.from("synthetic-session-cookie"),
      csrf_token: Buffer.from("c".repeat(64)),
      csrf_cookie: Buffer.from("c".repeat(64)),
    },
  });
  assert.deepEqual(result.allow_methods, ["GET", "POST", "PUT", "DELETE"]);
});

await focusedCheck("real concrete deferred route proves proxy-only denial", async () => {
  const { result } = await directApplicationRequest({
    contract: ADMIN_V1_OFFICIAL_LEDGER[16],
    body: { error: "Not found." },
    input: {
      session: Buffer.from("synthetic-session-cookie"),
      csrf_token: Buffer.from("c".repeat(64)),
      csrf_cookie: Buffer.from("c".repeat(64)),
    },
  });
  assert.equal(result.proxy_scope, "DENY_ADMIN_API_PATH");
  assert.equal(result.deferred_handler_executions, 0);
  assert.equal(result.deferred_database_effects, 0);
  assert.equal(result.deferred_rpc_effects, 0);
  assert.equal(result.deferred_storage_effects, 0);
});

const exactAuditRows = [
  "admin_logout",
  "admin_logout",
  "tool_added",
  "tool_updated",
  "tool_deleted",
  "submission_updated",
  "submission_rejected",
  "submission_approved",
  "logo_uploaded",
].map((action, index) => ({
  id: `audit-${index + 1}`,
  action,
  created_at: `2030-01-01T00:00:0${index}.000Z`,
  target_id: action === "logo_uploaded"
    ? "admin/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png"
    : null,
  target_name: action === "logo_uploaded"
    ? "admin/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png"
    : null,
  target_type: action === "logo_uploaded" ? "storage_object" : null,
  user_agent: RUN_USER_AGENT,
}));

await focusedCheck("audit ownership uses exact run User-Agent and nine-action multiset", async () => {
  let observedUrl = null;
  const result = await concreteTransport({
    fetch_impl: async (url) => {
      observedUrl = String(url);
      return jsonResponse(exactAuditRows);
    },
    spawn_sync: absentRef,
  }).execute({
    operation: "inspect_audits_poststate",
    input: {},
    authorization,
    credentials,
  });
  assert.equal(observedUrl.includes("metadata"), false);
  assert.equal(
    observedUrl.includes(`user_agent=eq.${encodeURIComponent(RUN_USER_AGENT)}`),
    true,
  );
  assert.equal(result.status, "EXACT");
  assert.equal(result.audits, 9);
  assert.deepEqual(
    result.rows.map((row) => row.action).sort(),
    exactAuditRows.map((row) => row.action).sort(),
  );
});

await focusedCheck("audit ownership rejects an unrelated row", async () => {
  await assertFailsClosed({
    operation: "inspect_audits_poststate",
    forbiddenStatus: "EXACT",
    fetch_impl: async () => jsonResponse([
      ...exactAuditRows.slice(0, -1),
      { ...exactAuditRows.at(-1), user_agent: "unrelated-agent" },
    ]),
  });
});

await focusedCheck("audit ownership rejects a substituted logo target", async () => {
  await assertFailsClosed({
    operation: "inspect_audits_poststate",
    forbiddenStatus: "EXACT",
    fetch_impl: async () => jsonResponse(exactAuditRows.map((row) =>
      row.action === "logo_uploaded"
        ? {
            ...row,
            target_id: "admin/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png",
          }
        : row
    )),
  });
});

await focusedCheck("unproven logo ownership cannot authorize cleanup deletion", async () => {
  let applicationRequests = 0;
  let fixtureRequests = 0;
  let storageDeletes = 0;
  let currentState = null;
  let retiredState = null;
  const expectedActions = [
    "admin_logout",
    "admin_logout",
    "logo_uploaded",
    "submission_approved",
    "submission_rejected",
    "submission_updated",
    "tool_added",
    "tool_deleted",
    "tool_updated",
  ];
  const adapters = {
    async invoke(operation, input) {
      if (operation === "inspect_prior_residue") return { status: "ABSENT" };
      if (operation === "inspect_environment_contract") {
        return { status: "EXACT", names: [...ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES] };
      }
      if (operation === "inspect_owned_database_residue") return { status: "ABSENT" };
      if (operation === "prepare_local_temporary_commit") return {
        status: "VERIFIED_EXACT",
        commit_sha: authorization.execution.temporary_commit_sha,
        local_state_id: "local-temp-provisional-logo",
      };
      if (operation === "inspect_github_metadata") return {
        status: "EXACT",
        repository: authorization.repository.remote_repository,
        baseline: authorization.repository.head,
      };
      if (operation === "inspect_remote_ref") return { status: "ABSENT" };
      if (operation === "create_remote_ref") {
        return { status: "CREATED_EXACT", ref_id: "ref-provisional-logo" };
      }
      if (operation === "detect_automatic_preview") return { count: 0 };
      if (operation.startsWith("create_environment_")) {
        return { status: "CREATED_EXACT", record_id: `env-${operation.at(-1)}` };
      }
      if (operation === "create_preview") {
        return { status: "CREATED_EXACT", deployment_id: "dpl-provisional-logo" };
      }
      if (operation === "verify_preview_identity") return { status: "EXACT" };
      if (operation === "generate_oidc") return { token: Buffer.from("synthetic-oidc") };
      if (operation === "protected_access_handshake") return { status: "BOUND" };
      if (operation === "create_submitted_fixture") {
        fixtureRequests += 1;
        return {
          status: "CREATED_EXACT",
          row_id: String(fixtureRequests),
          version: `submission-v1-${fixtureRequests}`,
        };
      }
      if (operation === "application_request") {
        applicationRequests += 1;
        const qualification = applicationRequests <= 6;
        const ledger = qualification
          ? ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER
          : ADMIN_V1_OFFICIAL_LEDGER;
        const index = qualification ? applicationRequests - 1 : applicationRequests - 7;
        const spec = ledger[index];
        return {
          status: spec.status,
          header_projection: "EXACT_SECURITY_HEADERS",
          body_shape: "EXACT_BOUNDED_JSON",
          cookie_effect: [2, 4, 19].includes(spec.ordinal)
            ? `ORDINAL_${spec.ordinal}_COOKIE_EFFECT`
            : "NONE",
          ...(spec.ordinal === 2
            ? { session_cookie: Buffer.from("synthetic-session-cookie") }
            : {}),
          ...(spec.ordinal === 4
            ? {
                csrf_cookie: Buffer.from("synthetic-csrf-cookie"),
                csrf_token: Buffer.from("synthetic-csrf-token"),
              }
            : {}),
          effect: effect(spec.ordinal),
          ownership_projection: "EXACT_POSTSTATE_REQUIRED",
          ...(spec.ordinal === 16
            ? { allow_methods: ["GET", "POST", "PUT", "DELETE"] }
            : {}),
          ...([17, 18].includes(spec.ordinal)
            ? {
                proxy_scope: "DENY_ADMIN_API_PATH",
                deferred_handler_executions: 0,
                deferred_database_effects: 0,
                deferred_rpc_effects: 0,
                deferred_storage_effects: 0,
              }
            : {}),
        };
      }
      if (operation === "inspect_submissions_poststate") return {
        status: "EXACT",
        submitted_tools: 3,
        rows: [1, 2, 3].map((id) => ({ row_id: String(id), version: `submission-v2-${id}` })),
        ownership_readback: "EXACT",
        unrelated_preserved: true,
      };
      if (operation === "inspect_tools_poststate") return {
        status: "EXACT",
        tools: 2,
        rows: [
          { row_id: "101", version: "tool-v1", role: "ROUTE_TOOL" },
          { row_id: "102", version: "tool-v2", role: "APPROVED_SUBMISSION" },
        ],
        ownership_readback: "EXACT",
        unrelated_preserved: true,
      };
      if (operation === "inspect_audits_poststate") return {
        status: "EXACT",
        audits: 9,
        logo_object_id: "logo-substituted",
        rows: expectedActions.map((action, index) => ({
          action,
          row_id: `audit-${index + 1}`,
          version: `audit-v${index + 1}`,
        })),
        ownership_readback: "EXACT",
        unrelated_preserved: true,
      };
      if (operation === "storage_read_owned_version") return { status: "EXACT", version: "v1" };
      if (operation === "prepare_storage_cleanup_grant") {
        return { status: "PREPARED", grant_id: "grant-must-not-be-used" };
      }
      if (operation === "delete_storage_exact_version") {
        storageDeletes += 1;
        return { status: "DELETED_EXACT" };
      }
      if (operation === "revoke_storage_cleanup_grant") return { status: "REVOKED_EXACT" };
      if (operation === "inspect_remote_ref_before_delete") return { status: "EXACT_OWNED" };
      if (
        operation.startsWith("delete_") ||
        ["retire_protected_access", "cleanup_local_owned_temp_state"].includes(operation)
      ) return { status: "DELETED_EXACT" };
      if (["verify_zero_data_residual", "verify_zero_external_residual"].includes(operation)) {
        return {
          status: "PROVEN_ABSENT",
          ownership_readback: "EXACT",
          unrelated_preserved: true,
        };
      }
      assert.fail(`unexpected provisional-logo operation ${operation}`);
    },
  };
  const journal = {
    load() {
      return retiredState === null && currentState === null
        ? null
        : retiredState === null
          ? { value: { state: structuredClone(currentState) }, retired: false }
          : { value: { state: structuredClone(retiredState) }, retired: true };
    },
    publish(value) {
      currentState = structuredClone(value);
      return sha("1");
    },
    retire(value) {
      retiredState = structuredClone(value);
      currentState = null;
      return sha("2");
    },
  };
  const result = await runAdminV1OfficialRuntime({
    authorization,
    adapters,
    journal,
    now_epoch_ms: TEST_NOW_EPOCH_MS,
    sensitive: {
      admin_password: Buffer.from("synthetic-admin"),
      admin_session_secret: Buffer.from("synthetic-secret"),
    },
  });
  assert.equal(result.classification, "RECOVERY_PENDING");
  assert.equal(storageDeletes, 0);
  assert.equal(retiredState, null);
  assert.equal(currentState.lifecycle, "RECOVERY_PENDING");
});

for (const [name, rows] of [
  ["missing action", exactAuditRows.slice(0, -1)],
  ["duplicate action", [
    ...exactAuditRows.slice(0, -1),
    { ...exactAuditRows.at(-1), id: "audit-duplicate", action: "tool_added" },
  ]],
]) {
  await focusedCheck(`audit ownership rejects ${name}`, async () => {
    await assertFailsClosed({
      operation: "inspect_audits_poststate",
      forbiddenStatus: "EXACT",
      fetch_impl: async () => jsonResponse(rows),
    });
  });
}

assert.deepEqual(focusedFailures, [], focusedFailures.join("\n"));

const dependencies = createConcreteRunnerDependencies({
  officialTransport: transport,
});
const result = await dependencies.runAuthorizedOfficialRuntime({
  authorization,
  credentials,
  execution_context: {
    journal,
    git_execution_context: {
      git_dir: "/tmp/synthetic-git-dir",
      object_directory: "/tmp/synthetic-object-directory",
    },
  },
});

assert.equal(
  result.classification,
  "OFFICIAL_RUNTIME_COMPLETE",
  JSON.stringify({ result, operations }),
);
assert.equal(result.qualification_requests, 6);
assert.equal(result.official_requests, 20);
assert.equal(result.runtime_sessions, 1);
assert.equal(result.runtime_retries, 0);
assert.equal(result.runtime_replays, 0);
assert.equal(result.zero_residual_owned_state, true);
assert.equal(applicationOrdinal, 26);
assert.equal(retired.lifecycle, "CLEANUP_COMPLETE");
assert.equal(retired.zero_residual, true);
assert.equal(operations.includes("delete_storage_exact_version"), true);
assert.equal(operations.includes("verify_zero_external_residual"), true);
assert.equal(Object.values(credentials).every((value) => value.every((byte) => byte === 0)), true);

function createSyntheticConcreteRuntimeFixture() {
  const state = {
    application_requests: 0,
    audit_query_paths: [],
    audits: [],
    branch_commit: null,
    deployment: null,
    environments: new Map(),
    grants: new Map(),
    logo: null,
    provider_requests: [],
    submissions: new Map(),
    tools: new Map(),
    user_agent_requests: 0,
  };
  const nextVersion = (prefix, ordinal) =>
    `2030-01-01T00:00:${String(ordinal).padStart(2, "0")}.000Z-${prefix}`;
  const addAudit = (action, target = null) => {
    const ordinal = state.audits.length + 1;
    state.audits.push({
      id: `audit-real-${ordinal}`,
      action,
      created_at: `2030-01-01T00:00:${String(ordinal).padStart(2, "0")}.000Z`,
      target_id: target,
      target_name: target,
      target_type: action === "logo_uploaded" ? "storage_object" : null,
      user_agent: RUN_USER_AGENT,
    });
  };
  const applicationResponse = (spec, lane, init) => {
    assert.equal(init.headers["user-agent"], RUN_USER_AGENT);
    state.user_agent_requests += 1;
    const headers = { ...EXACT_APPLICATION_SECURITY_HEADERS };
    const cookies = [];
    let body;
    if (spec.ordinal === 1) {
      body = { error: "Unauthorized" };
    } else if (spec.ordinal === 2) {
      assert.deepEqual(JSON.parse(init.body), { password: "synthetic-admin" });
      body = { success: true, message: "Admin login successful." };
      cookies.push(
        `aifinder_admin_session=session-${lane.toLowerCase()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400`,
      );
    } else if (spec.ordinal === 3) {
      body = { authenticated: true, role: "admin" };
    } else if (spec.ordinal === 4) {
      body = { success: true, csrfToken: "c".repeat(64) };
      cookies.push(
        `aifinder_admin_csrf_token=${"c".repeat(64)}; Path=/; Secure; SameSite=Strict; Max-Age=14400`,
      );
    } else if (spec.ordinal === 5) {
      body = { error: "Security token missing or expired. Please log in again." };
    } else if (spec.ordinal === 6) {
      body = {
        submissions: [...state.submissions.values()].map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description,
          website: row.website,
          pricing: row.pricing ?? null,
          logo_url: row.logo_url ?? null,
          submitter_name: row.submitter_name ?? null,
          submitter_email: row.submitter_email ?? null,
          status: row.status,
          created_at: row.created_at,
        })),
        stats: {
          totalTools: state.tools.size,
          pendingSubmissions: [...state.submissions.values()].filter((row) => row.status === "pending").length,
          approvedSubmissions: [...state.submissions.values()].filter((row) => row.status === "approved").length,
          rejectedSubmissions: [...state.submissions.values()].filter((row) => row.status === "rejected").length,
        },
      };
    } else if ([7, 9].includes(spec.ordinal)) {
      body = {
        tools: [...state.tools.values()].map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description,
          website: row.website,
          pricing: row.pricing ?? null,
          logo_url: row.logo_url ?? null,
          status: row.status,
          deleted_at: row.deleted_at,
        })),
      };
    } else if (spec.ordinal === 8) {
      const input = JSON.parse(init.body);
      state.tools.set(101, {
        id: 101,
        ...input,
        status: "approved",
        deleted_at: null,
        updated_at: nextVersion("tool-route", 1),
      });
      addAudit("tool_added");
      body = { success: true, message: "Tool added." };
    } else if (spec.ordinal === 10) {
      const input = JSON.parse(init.body);
      assert.equal(input.id, 101);
      state.tools.set(101, {
        ...state.tools.get(101),
        ...input,
        updated_at: nextVersion("tool-route", 2),
      });
      addAudit("tool_updated");
      body = { success: true, message: "Tool updated." };
    } else if (spec.ordinal === 11) {
      assert.deepEqual(JSON.parse(init.body), { id: 101 });
      state.tools.set(101, {
        ...state.tools.get(101),
        status: "archived",
        deleted_at: "2030-01-01T00:01:00.000Z",
        updated_at: nextVersion("tool-route", 3),
      });
      addAudit("tool_deleted");
      body = { success: true, message: "Tool archived." };
    } else if (spec.ordinal === 12) {
      const input = JSON.parse(init.body);
      const existing = state.submissions.get(input.id);
      assert.ok(existing);
      state.submissions.set(input.id, {
        ...existing,
        ...input,
        updated_at: nextVersion("submission", 2),
      });
      addAudit("submission_updated");
      body = { success: true, message: "Submission updated." };
    } else if (spec.ordinal === 13) {
      const input = JSON.parse(init.body);
      const existing = state.submissions.get(input.submissionId);
      assert.ok(existing);
      state.submissions.set(input.submissionId, {
        ...existing,
        status: "rejected",
        updated_at: nextVersion("submission", 3),
      });
      addAudit("submission_rejected");
      body = { success: true, message: "Submission rejected." };
    } else if (spec.ordinal === 14) {
      const input = JSON.parse(init.body);
      const existing = state.submissions.get(input.submissionId);
      assert.ok(existing);
      state.submissions.set(input.submissionId, {
        ...existing,
        status: "approved",
        updated_at: nextVersion("submission", 4),
      });
      state.tools.set(102, {
        id: 102,
        name: existing.name,
        category: existing.category,
        description: existing.description,
        website: existing.website,
        pricing: null,
        logo_url: null,
        status: "approved",
        deleted_at: null,
        updated_at: nextVersion("tool-approved", 1),
      });
      addAudit("submission_approved");
      body = { success: true, message: "Submission approved and added to tools." };
    } else if (spec.ordinal === 15) {
      assert.equal(init.body instanceof FormData, true);
      const objectName = "admin/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png";
      state.logo = {
        id: "logo-real",
        bucket_id: authorization.execution.storage_bucket,
        name: objectName,
        version: "logo-version-v1",
        created_at: "2030-01-01T00:02:00.000Z",
        updated_at: "2030-01-01T00:02:00.000Z",
        metadata: {
          eTag: "logo-etag-v1",
          mimetype: "image/png",
          size: 68,
        },
      };
      addAudit("logo_uploaded", objectName);
      body = {
        success: true,
        logoUrl:
          `https://synthetic.supabase.co/storage/v1/object/public/${authorization.execution.storage_bucket}/${objectName}`,
      };
    } else if (spec.ordinal === 16) {
      headers.allow = "GET, POST, PUT, DELETE";
      body = { error: "Method not allowed." };
    } else if ([17, 18].includes(spec.ordinal)) {
      body = { error: "Not found." };
    } else if (spec.ordinal === 19) {
      addAudit("admin_logout");
      body = { success: true, message: "Admin logged out." };
      cookies.push(
        "aifinder_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
        "aifinder_admin_csrf_token=; Path=/; Secure; SameSite=Strict; Max-Age=0",
      );
    } else if (spec.ordinal === 20) {
      body = { authenticated: false, message: "Unauthorized." };
    } else {
      assert.fail(`unhandled application ordinal ${spec.ordinal}`);
    }
    return jsonResponse(body, spec.status, headers, cookies);
  };
  const fetch_impl = async (rawUrl, init) => {
    const url = new URL(String(rawUrl));
    const path = `${url.pathname}${url.search}`;
    state.provider_requests.push(`${init.method} ${url.hostname}${path}`);
    if (url.hostname === "synthetic-official-preview.vercel.app") {
      const trustedOidc = init.headers["x-vercel-trusted-oidc-idp-token"];
      if (init.headers["user-agent"] !== RUN_USER_AGENT) {
        if (trustedOidc === undefined) {
          return textResponse(
            VERCEL_PROTECTION_CHALLENGE,
            401,
            { "content-type": "text/html; charset=utf-8" },
          );
        }
        assert.equal(trustedOidc, SYNTHETIC_OIDC_TOKEN);
        assert.equal(init.headers.authorization, undefined);
        assert.equal(init.headers.cookie, undefined);
        assert.equal(init.headers["x-csrf-token"], undefined);
        return jsonResponse(
          { authenticated: false, message: "Unauthorized." },
          401,
          EXACT_APPLICATION_SECURITY_HEADERS,
        );
      }
      if (init.headers["user-agent"] === RUN_USER_AGENT) {
        assert.equal(trustedOidc, SYNTHETIC_OIDC_TOKEN);
        state.application_requests += 1;
        const qualification = state.application_requests <= 6;
        const ledger = qualification
          ? ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER
          : ADMIN_V1_OFFICIAL_LEDGER;
        const index = qualification
          ? state.application_requests - 1
          : state.application_requests - 7;
        const spec = ledger[index];
        assert.equal(url.pathname, spec.path);
        assert.equal(init.method, spec.method);
        return applicationResponse(spec, qualification ? "QUALIFICATION" : "OFFICIAL", init);
      }
    }
    if (url.hostname === "api.vercel.com") {
      if (url.pathname === "/v9/projects/prj_BPaQVKdElriAhxabhoTkg8LysQ5R" && init.method === "GET") {
        return jsonResponse({
          id: authorization.execution.preview_project_id,
          name: authorization.execution.preview_project_name,
          accountId: authorization.execution.preview_team_id,
        });
      }
      if (url.pathname.endsWith("/env") && init.method === "GET") {
        return jsonResponse({
          envs: [...state.environments.values()],
          ...(state.environments.size === 0
            ? {}
            : { pagination: { count: state.environments.size, next: null } }),
        });
      }
      if (url.pathname.endsWith("/env") && init.method === "POST") {
        const input = JSON.parse(init.body);
        const record = { id: `env-real-${state.environments.size + 1}`, ...input };
        state.environments.set(record.id, record);
        return jsonResponse(record);
      }
      if (url.pathname.includes("/env/") && init.method === "GET") {
        const id = decodeURIComponent(url.pathname.split("/").at(-1));
        return state.environments.has(id)
          ? jsonResponse(state.environments.get(id))
          : jsonResponse(null, 404);
      }
      if (url.pathname.includes("/env/") && init.method === "DELETE") {
        const id = decodeURIComponent(url.pathname.split("/").at(-1));
        state.environments.delete(id);
        return jsonResponse(null, 204);
      }
      if (url.pathname === "/v6/deployments") {
        return jsonResponse({
          deployments: state.deployment === null ? [] : [state.deployment],
          pagination: { count: state.deployment === null ? 0 : 1, next: null },
        });
      }
      if (url.pathname === "/v13/deployments" && init.method === "POST") {
        state.deployment = {
          id: "dpl-real",
          uid: "dpl-real",
          url: "synthetic-official-preview.vercel.app",
          target: null,
          production: false,
          readyState: "READY",
          project: {
            id: authorization.execution.preview_project_id,
            name: authorization.execution.preview_project_name,
            accountId: authorization.execution.preview_team_id,
          },
          ownerId: authorization.execution.preview_team_id,
          gitSource: {
            type: "github",
            repo: authorization.repository.remote_repository,
            ref: authorization.execution.branch_name,
            sha: authorization.execution.temporary_commit_sha,
          },
          meta: {
            aifinderRunId: authorization.run_id,
            aifinderCandidate: authorization.candidate_identity_sha256,
            githubCommitSha: authorization.execution.temporary_commit_sha,
            githubCommitRef: authorization.execution.branch_name,
            githubCommitRepo: "aifinder",
            githubCommitOrg: "jcdumaua",
          },
        };
        return jsonResponse(state.deployment);
      }
      if (url.pathname === "/v13/deployments/dpl-real" && init.method === "GET") {
        return state.deployment === null
          ? jsonResponse(null, 404)
          : jsonResponse(state.deployment);
      }
      if (url.pathname === "/v13/deployments/dpl-real" && init.method === "DELETE") {
        state.deployment = null;
        return jsonResponse(null, 204);
      }
      if (url.pathname === "/v1/oidc/token" && init.method === "POST") {
        return jsonResponse({ token: "synthetic-oidc" });
      }
      assert.fail(`unhandled Vercel request ${init.method} ${path}`);
    }
    if (url.hostname === "synthetic.supabase.co") {
      if (url.pathname === "/rest/v1/submitted_tools") {
        if (init.method === "POST") {
          const input = JSON.parse(init.body);
          const id = state.submissions.size + 1;
          const row = {
            id,
            ...input,
            created_at: `2030-01-01T00:10:${String(id).padStart(2, "0")}.000Z`,
            updated_at: nextVersion("submission", 1),
          };
          state.submissions.set(id, row);
          return jsonResponse([{
            id: row.id,
            name: row.name,
            status: row.status,
            updated_at: row.updated_at,
            website: row.website,
          }]);
        }
        if (init.method === "DELETE") {
          const id = Number(url.searchParams.get("id")?.replace("eq.", ""));
          state.submissions.delete(id);
          return jsonResponse(null, 204);
        }
        const selectedIds = url.searchParams.get("id");
        if (selectedIds?.startsWith("in.(")) {
          const ids = selectedIds.slice(4, -1).split(",").map(Number);
          return jsonResponse(ids.filter((id) => state.submissions.has(id)).map((id) => ({ id })));
        }
        return jsonResponse([...state.submissions.values()]);
      }
      if (url.pathname === "/rest/v1/tools") {
        if (init.method === "DELETE") {
          const id = Number(url.searchParams.get("id")?.replace("eq.", ""));
          state.tools.delete(id);
          return jsonResponse(null, 204);
        }
        const selectedIds = url.searchParams.get("id");
        if (selectedIds?.startsWith("in.(")) {
          const ids = selectedIds.slice(4, -1).split(",").map(Number);
          return jsonResponse(ids.filter((id) => state.tools.has(id)).map((id) => ({ id })));
        }
        return jsonResponse([...state.tools.values()]);
      }
      if (url.pathname === "/rest/v1/admin_audit_logs") {
        if (init.method === "GET") state.audit_query_paths.push(path);
        if (init.method === "DELETE") {
          const predicate = url.searchParams.get("or");
          assert.ok(predicate);
          for (const row of state.audits) {
            assert.equal(predicate.includes(`id.eq.${row.id}`), true);
            assert.equal(predicate.includes(`created_at.eq.${row.created_at}`), true);
          }
          const deleted = [...state.audits];
          state.audits = [];
          return jsonResponse(deleted);
        }
        return jsonResponse([...state.audits]);
      }
      if (url.pathname === "/rest/v1/rpc/aifinder_prepare_storage_cleanup_grant") {
        const input = JSON.parse(init.body);
        assert.equal(input.p_bucket_id, authorization.execution.storage_bucket);
        assert.equal(input.p_object_name, state.logo.name);
        assert.equal(input.p_expected_version, state.logo.version);
        assert.equal(input.p_expected_etag, state.logo.metadata.eTag);
        assert.equal(input.p_expected_mime_type, "image/png");
        assert.equal(input.p_expected_size, state.logo.metadata.size);
        assert.equal(input.p_phase_id, ADMIN_V1_OFFICIAL_OPERATION_CLASS);
        assert.equal(input.p_runtime_session_id, authorization.run_id);
        assert.equal(input.p_ttl_seconds, 300);
        assert.match(input.p_grant_id, /^[0-9a-f-]{36}$/u);
        assert.match(input.p_token_hash, /^[0-9a-f]{64}$/u);
        const grantId = input.p_grant_id;
        state.grants.set(grantId, input);
        return jsonResponse([{
          expected_version: state.logo?.version,
          expires_at: "2030-01-01T00:05:00.000Z",
          grant_id: grantId,
        }]);
      }
      if (url.pathname === "/rest/v1/rpc/aifinder_revoke_storage_cleanup_grant") {
        const input = JSON.parse(init.body);
        const grant = state.grants.get(input.p_grant_id);
        assert.ok(grant);
        assert.equal(input.p_token_hash, grant.p_token_hash);
        state.grants.delete(input.p_grant_id);
        return jsonResponse(true);
      }
      if (url.pathname.startsWith("/storage/v1/object/info/")) {
        return state.logo === null ? jsonResponse({ error: "absent" }, 404) : jsonResponse(state.logo);
      }
      if (url.pathname.startsWith("/storage/v1/object/tool-logos/") && init.method === "HEAD") {
        const objectName = decodeURIComponent(url.pathname.slice("/storage/v1/object/tool-logos/".length));
        return state.logo?.name === objectName
          ? jsonResponse(null, 200)
          : jsonResponse(null, 404);
      }
      if (url.pathname === "/storage/v1/object/tool-logos" && init.method === "DELETE") {
        const input = JSON.parse(init.body);
        assert.deepEqual(input, { prefixes: [state.logo.name] });
        const rawToken = init.headers["x-aifinder-storage-cleanup-token"];
        assert.match(rawToken, /^[0-9a-f]{64}$/u);
        const [grant] = state.grants.values();
        const computedTokenHash = Buffer.from(
          await crypto.subtle.digest("SHA-256", Buffer.from(rawToken, "utf8")),
        ).toString("hex");
        assert.equal(computedTokenHash, grant.p_token_hash);
        state.logo = null;
        return jsonResponse({ message: "Successfully deleted" });
      }
      assert.fail(`unhandled Supabase request ${init.method} ${path}`);
    }
    assert.fail(`unhandled synthetic request ${init.method} ${path}`);
  };
  const spawn_sync = (_command, args) => {
    if (args.includes("ls-remote")) {
      return {
        status: 0,
        stderr: "",
        stdout: state.branch_commit === null
          ? ""
          : `${state.branch_commit}\trefs/heads/${authorization.execution.branch_name}\n`,
      };
    }
    if (args.includes("push")) {
      const refspec = args.at(-1);
      state.branch_commit = refspec.startsWith(":")
        ? null
        : authorization.execution.temporary_commit_sha;
      return { status: 0, stderr: "", stdout: "" };
    }
    assert.fail(`unhandled synthetic git args ${args.join(" ")}`);
  };
  return { fetch_impl, spawn_sync, state };
}

const syntheticConcrete = createSyntheticConcreteRuntimeFixture();
const realConcreteTransport = createAdminV1OfficialConcreteTransport({
  execution_context: {
    git_execution_context: {
      git_dir: "/tmp/aifinder-official-real-concrete-git-dir",
      object_directory: "/tmp/aifinder-official-real-concrete-objects",
    },
  },
  fetch_impl: syntheticConcrete.fetch_impl,
  spawn_sync: syntheticConcrete.spawn_sync,
});
const realConcreteCredentials = loadAdminV1OfficialCredentials({
  environment: {
    ADMIN_PASSWORD: "synthetic-admin",
    ADMIN_SESSION_SECRET: "synthetic-secret",
    GH_TOKEN: "synthetic-github",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    NODE_ENV: "production",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service",
    VERCEL_TOKEN: "synthetic-vercel",
  },
  credential_source_policy: ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
});
let realCurrent = null;
let realRetired = null;
const realStages = [];
const realJournal = {
  load() {
    return realRetired === null && realCurrent === null
      ? null
      : realRetired === null
        ? { value: { state: structuredClone(realCurrent) }, retired: false }
        : { value: { state: structuredClone(realRetired) }, retired: true };
  },
  publish(value) {
    realCurrent = structuredClone(value);
    realStages.push(`${value.lifecycle}:${value.stage}`);
    return sha("f");
  },
  retire(value) {
    realRetired = structuredClone(value);
    realCurrent = null;
    return sha("0");
  },
};
const realDependencies = createConcreteRunnerDependencies({
  officialTransport: realConcreteTransport,
});
const realConcreteResult = await realDependencies.runAuthorizedOfficialRuntime({
  authorization,
  credentials: realConcreteCredentials,
  execution_context: {
    journal: realJournal,
    git_execution_context: {
      git_dir: "/tmp/aifinder-official-real-concrete-git-dir",
      object_directory: "/tmp/aifinder-official-real-concrete-objects",
    },
  },
});
assert.equal(
  realConcreteResult.classification,
  "OFFICIAL_RUNTIME_COMPLETE",
  JSON.stringify({
    application_requests: syntheticConcrete.state.application_requests,
    effects: realConcreteResult.effects,
    lifecycle: realCurrent?.lifecycle ?? realRetired?.lifecycle,
    official_requests: realConcreteResult.official_requests,
    provider_requests: syntheticConcrete.state.provider_requests,
    stages: realStages,
    qualification_requests: realConcreteResult.qualification_requests,
    stage: realCurrent?.stage ?? realRetired?.stage,
  }),
);
assert.equal(realConcreteResult.qualification_requests, 6);
assert.equal(realConcreteResult.official_requests, 20);
assert.equal(realConcreteResult.runtime_sessions, 1);
assert.equal(realConcreteResult.runtime_retries, 0);
assert.equal(realConcreteResult.runtime_replays, 0);
assert.equal(realConcreteResult.effects.audits, 9);
assert.equal(realConcreteResult.zero_residual_owned_state, true);
assert.equal(syntheticConcrete.state.application_requests, 26);
assert.equal(syntheticConcrete.state.user_agent_requests, 26);
assert.equal(syntheticConcrete.state.branch_commit, null);
assert.equal(syntheticConcrete.state.deployment, null);
assert.equal(syntheticConcrete.state.environments.size, 0);
assert.equal(syntheticConcrete.state.submissions.size, 0);
assert.equal(syntheticConcrete.state.tools.size, 0);
assert.equal(syntheticConcrete.state.audits.length, 0);
assert.equal(syntheticConcrete.state.logo, null);
assert.equal(syntheticConcrete.state.grants.size, 0);
assert.equal(
  syntheticConcrete.state.audit_query_paths.every((entry) => !entry.includes("metadata")) &&
    syntheticConcrete.state.audit_query_paths.some((entry) =>
      entry.includes(`user_agent=eq.${encodeURIComponent(RUN_USER_AGENT)}`)
    ),
  true,
);
assert.equal(realRetired.lifecycle, "CLEANUP_COMPLETE");
assert.equal(realRetired.zero_residual, true);
assert.equal(
  Object.values(realConcreteCredentials).every((value) =>
    value.every((byte) => byte === 0)
  ),
  true,
);

for (const marker of [
  "ENV_CREATE_RESPONSE_ID_ALONE_NOT_OWNERSHIP=PASS",
  "ENV_CREATE_NONDECRYPTING_READBACK_REQUIRED=PASS",
  "ENV_CREATE_ID_KEY_TARGET_BRANCH_EXACT=PASS",
  "ENV_CREATE_SUBSTITUTED_ID_REJECTED=PASS",
  "ENV_CREATE_WRONG_KEY_REJECTED=PASS",
  "ENV_CREATE_WRONG_TARGET_REJECTED=PASS",
  "ENV_CREATE_WRONG_BRANCH_REJECTED=PASS",
  "ENV_CREATE_DUPLICATE_OR_AMBIGUOUS_REJECTED=PASS",
  "ENV_CREATE_SECRET_VALUE_READS=0",
  "ENV_CREATE_UNVERIFIED_ID_DELETE_ARMED=0",
  "ENV_CREATE_UNVERIFIED_OWNERSHIP_FAILS_CLOSED=PASS",
  "PROTECTED_ACCESS_EXACT_PREVIEW_BOUND_FIRST=PASS",
  "PROTECTED_ACCESS_ADMIN_CREDENTIALS_SENT=0",
  "TRUSTED_SOURCE_OIDC_HEADER_CONTRACT_EXACT=PASS",
  "PROTECTED_ACCESS_NEGATIVE_CONTROL_REQUIRED=PASS",
  "PROTECTED_ACCESS_POSITIVE_CONTROL_REQUIRED=PASS",
  "NO_TOKEN_APP_401_REJECTED_AS_PROTECTION_PROOF=PASS",
  "SAME_401_WITH_AND_WITHOUT_OIDC_REJECTED=PASS",
  "OIDC_CHANGES_PROTECTION_LAYER_RESULT=PASS",
  "EXPECTED_APP_RESPONSE_ONLY_AFTER_OIDC=PASS",
  "FAKE_PROVIDER_MUST_INSPECT_OIDC_HEADER=PASS",
  "OIDC_RAW_OUTPUTS=0",
  "EMPTY_ENV_NO_PAGINATION_ACCEPTED=PASS",
  "NONEMPTY_ENV_NO_PAGINATION_REJECTED=PASS",
  "MALFORMED_ENV_PAGINATION_REJECTED=PASS",
  "EXACT_PAGINATED_ENV_UNCHANGED=PASS",
  "AUDIT_OWNERSHIP_USES_EXACT_RUN_USER_AGENT=PASS",
  "AUDIT_EXPECTED_ACTION_MULTISET_9=PASS",
  "AUDIT_UNRELATED_ROW_REJECTED=PASS",
  "AUDIT_DUPLICATE_OR_MISSING_ACTION_REJECTED=PASS",
  "QUALIFICATION_LOGOUT_ACCOUNTED=PASS",
  "NO_METADATA_RUN_ID_DEPENDENCY=PASS",
  "STORAGE_HEAD_400_ABSENT=PASS",
  "STORAGE_HEAD_404_ABSENT=PASS",
  "STORAGE_HEAD_2XX_PRESENT=PASS",
  "STORAGE_HEAD_401_403_429_5XX_AMBIGUOUS=PASS",
  "STORAGE_PRESENT_VERSION_INFO_EXACT=PASS",
  "STORAGE_ARBITRARY_GET_4XX_NOT_ABSENCE=PASS",
  "REAL_CONCRETE_APPLICATION_STATUS_PROJECTED=PASS",
  "REAL_CONCRETE_SECURITY_HEADERS_PROJECTED=PASS",
  "REAL_CONCRETE_SESSION_CSRF_MEMORY_ONLY=PASS",
  "REAL_CONCRETE_ALLOW_HEADER_PROJECTED=PASS",
  "REAL_CONCRETE_DEFERRED_PROXY_PROOF=PASS",
  "OWNERSHIP_IDS_FROM_POSTSTATE_NOT_FABRICATED=PASS",
  "AUTOMATIC_PREVIEW_INVENTORY_FAIL_CLOSED=PASS",
  "PREVIEW_READY_ALIASES_EXACT=PASS",
  "PREVIEW_EXACT_READY_IDENTITY_BOUND=PASS",
  "PREVIEW_CREDENTIAL_SEND_GATED=PASS",
  "SESSION_COOKIE_ATTRIBUTES_EXACT=PASS",
  "CSRF_COOKIE_ATTRIBUTES_EXACT=PASS",
  "LOGOUT_COOKIE_CLEARING_EXACT=PASS",
  "EXACT_BOUNDED_JSON_BYTES=1048576",
  "EXACT_BOUNDED_JSON_KEYS_ROWS_SHAPES=PASS",
  "REAL_CONCRETE_FULL_QUALIFICATION_REQUESTS=6",
  "REAL_CONCRETE_FULL_OFFICIAL_REQUESTS=20",
  "REAL_CONCRETE_RUNTIME_SESSIONS=1",
  "REAL_CONCRETE_RUNTIME_RETRIES=0",
  "REAL_CONCRETE_RUNTIME_REPLAYS=0",
  "REAL_CONCRETE_ZERO_RESIDUAL=true",
]) console.log(marker);

console.log(
  "PASS_ADMIN_V1_OFFICIAL_CONCRETE_BRIDGE assertions=21 qualification=6 official=20 sessions=1 retries=0 replays=0 storage_cas=true residual=zero low_level_fakes=true real_external_actions=0",
);
