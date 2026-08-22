import assert from "node:assert/strict";
import {
  ADMIN_V1_OFFICIAL_CONTRACT_SHA256,
  ADMIN_V1_OFFICIAL_CREDENTIAL_SOURCE_POLICY,
  ADMIN_V1_OFFICIAL_ENVIRONMENT_NAMES,
  ADMIN_V1_OFFICIAL_LEDGER,
  ADMIN_V1_OFFICIAL_OPERATION_CLASS,
  ADMIN_V1_OFFICIAL_QUALIFICATION_LEDGER,
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
  created_at: "2026-08-21T12:00:00.000Z",
  expires_at: "2026-08-22T12:00:00.000Z",
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

function jsonResponse(body, status = 200) {
  return {
    status,
    async text() {
      return body === null ? "" : JSON.stringify(body);
    },
  };
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

await focusedCheck("missing environment pagination cannot prove prior absence", async () => {
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
      return jsonResponse({ envs: [] });
    },
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
        logo: { object_id: "logo-owned-v1", version: "owned-v1" },
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

console.log(
  "PASS_ADMIN_V1_OFFICIAL_CONCRETE_BRIDGE assertions=21 qualification=6 official=20 sessions=1 retries=0 replays=0 storage_cas=true residual=zero low_level_fakes=true real_external_actions=0",
);
