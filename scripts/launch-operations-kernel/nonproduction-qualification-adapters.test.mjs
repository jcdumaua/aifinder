import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ACTIVATION_REVIEW_SHA256,
  recoverQualification,
  runQualification,
} from "./activation-bridge.mjs";
import {
  CONCRETE_APPROVAL_TOKEN_SHA256,
  CONCRETE_OPERATION_CLASS,
  CONCRETE_RETAINED_IDENTITY_SHA256,
  CONCRETE_RUNTIME_CREDENTIAL_SPEC,
  CONCRETE_SUPPORT_PATHS,
} from "./nonproduction-qualification-authorization.mjs";
import {
  createConcreteQualificationBundle,
  loadConcreteLiveCredentials,
} from "./nonproduction-qualification-adapters.mjs";

const RUN_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE = "2".repeat(64);
const MANIFEST = "3".repeat(64);
const LEGACY_CANDIDATE =
  "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71";
const REQUIRED_HEAD = "ae614fa904e4c00d1dacec8493969fdce6fff3a3";

function sha(character) {
  return character.repeat(64);
}

function authorization() {
  return {
    schema_version: 1,
    authorization_id_sha256: sha("1"),
    candidate_identity_sha256: CANDIDATE,
    manifest_sha256: MANIFEST,
    compatibility_support_sha256: Object.fromEntries(
      CONCRETE_SUPPORT_PATHS.map((path, index) => [
        path,
        String(index + 4).repeat(64),
      ]),
    ),
    retained_legacy_identity_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
    retained_legacy_classification: "FAIL_CLOSED_UNRESOLVED",
    preserve_ambiguous_legacy_resources: true,
    operation_class: CONCRETE_OPERATION_CLASS,
    attempt_limit: 1,
    request_budget: 16,
    mutation_budget: 15,
    success_retention_policy: "RETAIN_EXACTLY_ONE_PREVIEW",
    independent_review_approval_token_sha256:
      CONCRETE_APPROVAL_TOKEN_SHA256,
    created_at: "2030-01-01T00:00:00.000Z",
    expires_at: "2030-01-01T01:00:00.000Z",
    run_id: RUN_ID,
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: REQUIRED_HEAD,
      origin_main: REQUIRED_HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: sha("8"),
      remote_repository: "jcdumaua/aifinder",
    },
    execution: {
      journal_directory:
        `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${RUN_ID}`,
      branch_name: `aifinder-qualification-${RUN_ID}`,
      temporary_commit_sha: "a".repeat(40),
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      fixture_website: `https://${RUN_ID}.invalid/`,
      fixture_name: `AiFinder qualification ${RUN_ID}`,
      supabase_origin_sha256:
        "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777",
      supabase_project_ref_sha256:
        "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914",
      storage_bucket: "tool-logos",
      storage_name: `admin/${RUN_ID}.png`,
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
      staging_checks: [
        { method: "GET", path: "/", status: 200 },
        { method: "GET", path: "/api/admin/session", status: 401 },
      ],
    },
  };
}

function freezeClosure() {
  return {
    freeze_document_bytes: readFileSync(
      new URL("./legacy-freeze.json", import.meta.url),
    ),
    legacy_classification: {
      schema_version: 1,
      classification: "FAIL_CLOSED_UNRESOLVED",
      authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
      recovery_state: "EXECUTION_IN_PROGRESS",
      recovery_stage: "PRIOR_RECONCILIATION",
      guard: {
        owner_pid: 12605,
        status: "DEAD",
        recovery_root_binding_exact: true,
      },
      candidate_binding: {
        active_candidate_identity_sha256: LEGACY_CANDIDATE,
        recovery_candidate_identity_sha256: LEGACY_CANDIDATE,
        exact: true,
      },
      effects: {
        mutation_intents: [{ kind: "PRIOR_RECONCILIATION", sequence: 1 }],
        data_writes: 0,
        branch_commit_present: false,
        preview_identity_present: false,
        environment_resource_count: 0,
        environment_cleanup_intents: {
          ADMIN_PASSWORD: 0,
          ADMIN_SESSION_SECRET: 0,
        },
        branch_cleanup_intents: 0,
        preview_cleanup_intents: 0,
        terminal_evidence_present: false,
      },
      ownership_ambiguity: true,
      legacy_reconciliation_required: true,
      clean: false,
      qualified: false,
      retained_identity_digest_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
    },
    approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
    policy: {
      preserve_ambiguous_legacy_resources: true,
      fresh_ownership_namespace: true,
      claim_legacy_resources: false,
    },
  };
}

function createCheckpointStore() {
  let state = null;
  const adapterReceipts = new Map();
  const externalBindings = new Map();
  let writerTail = Promise.resolve();
  return {
    async withExclusiveWriter(operation) {
      let releaseWriter;
      const priorWriter = writerTail;
      writerTail = new Promise((resolve) => {
        releaseWriter = resolve;
      });
      await priorWriter;
      try {
        return await operation();
      } finally {
        releaseWriter();
      }
    },
    async checkpoint(candidate, command) {
      if (command.operation === "BEGIN_ATTEMPT") {
        if (state !== null) {
          const error = new Error("ATTEMPT_ALREADY_EXISTS");
          error.code = "ATTEMPT_ALREADY_EXISTS";
          throw error;
        }
      } else if (
        state === null ||
        state.checkpoint.checkpoint_identity_sha256 !==
          command.predecessor_checkpoint_identity_sha256
      ) {
        const error = new Error("CHECKPOINT_CAS_MISMATCH");
        error.code = "CHECKPOINT_CAS_MISMATCH";
        throw error;
      }
      state = structuredClone(candidate);
      return {
        ...structuredClone(command),
        status: "CHECKPOINT_COMMITTED",
      };
    },
    async readHead(query) {
      if (state === null) {
        return {
          schema_version: 1,
          status: "CHECKPOINT_ABSENT",
          journal_identity_sha256: query.journal_identity_sha256,
        };
      }
      return {
        schema_version: 1,
        status: "CHECKPOINT_PRESENT",
        journal_identity_sha256: state.journal_identity_sha256,
        checkpoint_sequence: state.checkpoint.sequence,
        predecessor_checkpoint_identity_sha256:
          state.checkpoint.predecessor_checkpoint_identity_sha256,
        checkpoint_identity_sha256:
          state.checkpoint.checkpoint_identity_sha256,
      };
    },
    async loadState() {
      if (state === null) throw new Error("NO_STATE");
      return structuredClone(state);
    },
    async readAdapterReceipt(operationSlotSha256) {
      return adapterReceipts.has(operationSlotSha256)
        ? structuredClone(adapterReceipts.get(operationSlotSha256))
        : null;
    },
    async recordAdapterReceipt(operationSlotSha256, receipt, binding = null) {
      if (adapterReceipts.has(operationSlotSha256)) {
        assert.deepEqual(adapterReceipts.get(operationSlotSha256), receipt);
        return;
      }
      adapterReceipts.set(operationSlotSha256, structuredClone(receipt));
      if (binding !== null) {
        externalBindings.set(receipt.resource_key, structuredClone(binding));
      }
    },
    async recordExternalBinding(resourceKey, binding) {
      const existing = externalBindings.get(resourceKey);
      if (
        existing &&
        existing.resource_type === "ENVIRONMENT_RECORD" &&
        binding.resource_type === "ENVIRONMENT_RECORD" &&
        existing.records.every(
          (record) => binding.records.some(
            (candidate) =>
              candidate.key === record.key && candidate.id === record.id,
          ),
        )
      ) {
        externalBindings.set(resourceKey, structuredClone(binding));
        return;
      }
      if (existing) assert.deepEqual(existing, binding);
      else externalBindings.set(resourceKey, structuredClone(binding));
    },
    async loadExternalBinding(resourceKey) {
      return externalBindings.has(resourceKey)
        ? structuredClone(externalBindings.get(resourceKey))
        : null;
    },
    snapshot() {
      return state === null ? null : structuredClone(state);
    },
    adapterReceiptCount() {
      return adapterReceipts.size;
    },
    adapterReceipts() {
      return [...adapterReceipts.values()].map((entry) => structuredClone(entry));
    },
  };
}

function createFakePlatform({
  ambiguity_type = null,
  create_response_loss_type = null,
  environment_first_create_response_loss = false,
  environment_second_create_response_loss = false,
  environment_cleanup_response_loss = false,
  environment_recovery_cleanup_response_loss = false,
  staging_verified = true,
  storage_replacement = false,
} = {}) {
  const resources = new Map();
  const calls = [];
  let environmentCleanupResponseLost = false;
  let environmentRecoveryCleanupResponseLost = false;
  function present(resource) {
    return resources.get(resource.resource_key) ?? null;
  }
  function create(resource, binding) {
    calls.push({ operation: "CREATE", type: resource.resource_type });
    assert.equal(present(resource), null);
    resources.set(resource.resource_key, {
      resource: structuredClone(resource),
      binding: structuredClone(binding),
    });
    return binding;
  }
  function cleanup(resource, binding) {
    calls.push({ operation: "CLEANUP", type: resource.resource_type });
    const current = present(resource);
    if (current === null) return { status: "ABSENT" };
    assert.deepEqual(current.binding, binding);
    resources.delete(resource.resource_key);
    return { status: "DELETED_EXACT" };
  }
  return {
    calls,
    resources,
    async inspectFresh(resource) {
      calls.push({ operation: "INSPECT_FRESH", type: resource.resource_type });
      if (resource.resource_type === ambiguity_type) return { status: "AMBIGUOUS" };
      return { status: present(resource) === null ? "ABSENT" : "PRESENT" };
    },
    async createBranch(resource) {
      const binding = create(resource, {
        resource_type: "GIT_BRANCH",
        commit_sha: "a".repeat(40),
        remote_ref: `refs/heads/${authorization().execution.branch_name}`,
      });
      if (resource.resource_type === create_response_loss_type) {
        throw new Error("SYNTHETIC_RESPONSE_LOSS");
      }
      return binding;
    },
    async createPreview(resource) {
      return create(resource, {
        resource_type: "PREVIEW_DEPLOYMENT",
        deployment_id: `dpl_${RUN_ID}`,
        deployment_url: `${RUN_ID}.vercel.app`,
      });
    },
    async createEnvironment(resource, context = {}) {
      if (environment_first_create_response_loss) {
        create(resource, {
          resource_type: "ENVIRONMENT_RECORD",
          records: [{
            key: "ADMIN_PASSWORD",
            id: `env_${RUN_ID}_1`,
          }],
        });
        throw new Error("SYNTHETIC_FIRST_ENVIRONMENT_CREATE_RESPONSE_LOSS");
      }
      if (environment_second_create_response_loss) {
        const binding = create(resource, {
          resource_type: "ENVIRONMENT_RECORD",
          records: [
            { key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` },
            { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
          ],
        });
        await context.onBindingProgress?.({
          resource_type: "ENVIRONMENT_RECORD",
          records: [structuredClone(binding.records[0])],
        });
        throw new Error("SYNTHETIC_SECOND_ENVIRONMENT_CREATE_RESPONSE_LOSS");
      }
      if (resource.resource_type === create_response_loss_type) {
        const partial = create(resource, {
          resource_type: "ENVIRONMENT_RECORD",
          records: [{
            key: "ADMIN_PASSWORD",
            id: `env_${RUN_ID}_1`,
          }],
        });
        await context.onBindingProgress?.(structuredClone(partial));
        throw new Error("SYNTHETIC_ENVIRONMENT_RESPONSE_LOSS");
      }
      const binding = create(resource, {
        resource_type: "ENVIRONMENT_RECORD",
        records: [
          { key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` },
          { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
        ],
      });
      await context.onBindingProgress?.(structuredClone(binding));
      return binding;
    },
    async createDatabaseFixture(resource) {
      return create(resource, {
        resource_type: "DATABASE_ROW",
        row_ids: [`row_${RUN_ID}`],
      });
    },
    async createStorageFixture(resource) {
      return create(resource, {
        resource_type: "STORAGE_OBJECT",
        object_id: `storage_${RUN_ID}`,
        expected_version: "storage-version-1",
        expected_etag: "storage-etag-1",
        expected_size: 155,
        content_sha256: sha("e"),
        created_at: "2030-01-01T00:00:00.000Z",
      });
    },
    async cleanupBranch(resource, binding) {
      return cleanup(resource, binding);
    },
    async cleanupPreview(resource, binding) {
      return cleanup(resource, binding);
    },
    async cleanupEnvironment(resource, binding) {
      if (
        environment_recovery_cleanup_response_loss &&
        !environmentRecoveryCleanupResponseLost
      ) {
        calls.push({ operation: "CLEANUP", type: resource.resource_type });
        const current = present(resource);
        assert.notEqual(current, null);
        assert.deepEqual(current.binding, binding);
        resources.delete(resource.resource_key);
        environmentRecoveryCleanupResponseLost = true;
        throw new Error("SYNTHETIC_RECOVERY_ENVIRONMENT_DELETE_RESPONSE_LOSS");
      }
      if (environment_recovery_cleanup_response_loss) {
        calls.push({ operation: "CLEANUP", type: resource.resource_type });
        assert.equal(present(resource), null);
        return { status: "DELETED_EXACT" };
      }
      if (environment_second_create_response_loss) {
        calls.push({ operation: "CLEANUP", type: resource.resource_type });
        const current = present(resource);
        if (current === null) return { status: "ABSENT" };
        const deleting = new Map(
          binding.records.map((record) => [record.key, record.id]),
        );
        for (const record of current.binding.records) {
          if (deleting.has(record.key)) {
            assert.equal(deleting.get(record.key), record.id);
          }
        }
        const survivors = current.binding.records.filter(
          (record) => !deleting.has(record.key),
        );
        if (survivors.length === 0) resources.delete(resource.resource_key);
        else current.binding.records = structuredClone(survivors);
        return { status: "DELETED_EXACT" };
      }
      if (
        environment_cleanup_response_loss &&
        !environmentCleanupResponseLost
      ) {
        calls.push({ operation: "CLEANUP", type: resource.resource_type });
        const current = present(resource);
        assert.notEqual(current, null);
        assert.deepEqual(current.binding, binding);
        current.binding = {
          resource_type: "ENVIRONMENT_RECORD",
          records: [structuredClone(binding.records[1])],
        };
        environmentCleanupResponseLost = true;
        throw new Error("SYNTHETIC_ENVIRONMENT_DELETE_RESPONSE_LOSS");
      }
      if (environment_cleanup_response_loss) {
        calls.push({ operation: "CLEANUP", type: resource.resource_type });
        const current = present(resource);
        if (current === null) return { status: "ABSENT" };
        const expectedByKey = new Map(
          binding.records.map((record) => [record.key, record.id]),
        );
        assert.equal(current.binding.records.every(
          (record) => expectedByKey.get(record.key) === record.id,
        ), true);
        resources.delete(resource.resource_key);
        return { status: "DELETED_EXACT" };
      }
      return cleanup(resource, binding);
    },
    async cleanupDatabaseFixture(resource, binding) {
      return cleanup(resource, binding);
    },
    async cleanupStorageExactVersion(resource, binding, cas) {
      calls.push({ operation: "CLEANUP", type: resource.resource_type });
      assert.equal(cas.expected_version, binding.expected_version);
      const current = present(resource);
      if (storage_replacement) {
        assert.notEqual(current, null);
        return {
          status: "VERSION_MISMATCH",
          observed_version: "storage-version-replacement",
        };
      }
      if (current === null) return { status: "ABSENT" };
      assert.deepEqual(current.binding, binding);
      resources.delete(resource.resource_key);
      return { status: "DELETED_EXACT" };
    },
    async verifyStaging({ resource_plan }) {
      calls.push({ operation: "VERIFY_STAGING" });
      return {
        verified: staging_verified &&
          resource_plan.every((resource) => present(resource) !== null),
      };
    },
    async verifyFinal({ owned_resources, retained_resource_keys }) {
      calls.push({ operation: "VERIFY_FINAL" });
      const retained = new Set(retained_resource_keys);
      return {
        retained_preview_count: owned_resources.filter(
          (resource) => retained.has(resource.resource_key) && present(resource) !== null,
        ).length,
        present: owned_resources
          .filter((resource) => present(resource) !== null)
          .map((resource) => resource.resource_key),
      };
    },
    async inspectOwned(resource) {
      const current = present(resource);
      return {
        status: current === null ? "ABSENT" : "PRESENT",
        ...(resource.resource_type === "STORAGE_OBJECT" && current !== null
          ? { observed_version: current.binding.expected_version }
          : {}),
      };
    },
    async resolveBinding(resource) {
      return structuredClone(present(resource)?.binding ?? null);
    },
  };
}

function bundle(options = {}) {
  const record = authorization();
  const checkpointStore = options.checkpoint_store ?? createCheckpointStore();
  const platform = options.platform ?? createFakePlatform();
  return {
    record,
    checkpointStore,
    platform,
    bundle: createConcreteQualificationBundle({
      authorization: record,
      authorization_closure: {
        verified: true,
        candidate_identity_sha256: CANDIDATE,
        manifest_sha256: MANIFEST,
        member_count: 24,
        retained_legacy_identity_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
        operation_class: CONCRETE_OPERATION_CLASS,
        attempts_authorized: 1,
        request_budget: 16,
        mutation_budget: 15,
      },
      credentials: {
        github_token: "synthetic-github-secret",
        vercel_token: "synthetic-vercel-secret",
        supabase_url: "https://synthetic.supabase.co",
        supabase_anon_key: "synthetic-anon-secret",
        supabase_service_role_key: "synthetic-service-secret",
        admin_password: "synthetic-admin-password",
        admin_session_secret: "synthetic-session-secret",
      },
      freeze_closure: freezeClosure(),
      platform,
      checkpoint_store: checkpointStore,
      storage_delete_capability_sha256: sha("f"),
    }),
  };
}

const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(
      `${name}:${error?.code ?? "NO_CODE"}:${error?.message ?? "UNKNOWN"}:${String(error?.stack ?? "NO_STACK").split("\n").slice(1, 3).join("|")}`,
    );
  }
}

await check("credential loader requires every existing credential name", async () => {
  const values = {
    GH_TOKEN: "github-value",
    VERCEL_TOKEN: "vercel-value",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-value",
    SUPABASE_SERVICE_ROLE_KEY: "service-value",
    ADMIN_PASSWORD: "password-value",
    ADMIN_SESSION_SECRET: "session-value",
  };
  const credentialAuthorization = {
    execution: {
      supabase_origin_sha256:
        "6bce0afffdc84e79e2971a5dfc7b1228749b214debbf38ea54c5392f873b16d8",
      supabase_project_ref_sha256:
        "b3cc0475bb78a5026098858e9889acf666d31062d513d303314eca31d36e72f2",
    },
  };
  const loaded = loadConcreteLiveCredentials({
    environment: values,
    authorization: credentialAuthorization,
  });
  assert.equal(loaded.github_token, values.GH_TOKEN);
  assert.equal(loaded.vercel_token, values.VERCEL_TOKEN);
  assert.equal(loaded.supabase_service_role_key, values.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(Object.isFrozen(loaded), true);
  assert.deepEqual(
    Object.keys(loaded),
    CONCRETE_RUNTIME_CREDENTIAL_SPEC.map(({ adapter_slot }) => adapter_slot),
  );
  const fallback = loadConcreteLiveCredentials({
    environment: {
      ...values,
      GH_TOKEN: "",
      GITHUB_TOKEN: "github-fallback",
    },
    authorization: credentialAuthorization,
  });
  assert.equal(fallback.github_token, "github-fallback");
  const precedence = loadConcreteLiveCredentials({
    environment: {
      ...values,
      GITHUB_TOKEN: "github-fallback",
    },
    authorization: credentialAuthorization,
  });
  assert.equal(precedence.github_token, values.GH_TOKEN);
  for (const key of Object.keys(values)) {
    assert.throws(
      () => loadConcreteLiveCredentials({
        environment: { ...values, [key]: "" },
        authorization: credentialAuthorization,
      }),
      (error) => error?.code === "CONCRETE_CREDENTIAL_MISSING",
    );
  }
  for (const supabaseUrl of [
    "https://unreviewed.example",
    "https://synthetic.supabase.co/path",
    "https://synthetic.supabase.co?redirect=unreviewed",
    "https://replacement.supabase.co",
  ]) {
    assert.throws(
      () => loadConcreteLiveCredentials({
        environment: { ...values, NEXT_PUBLIC_SUPABASE_URL: supabaseUrl },
        authorization: credentialAuthorization,
      }),
      (error) => error?.code === "CONCRETE_CREDENTIAL_TARGET_MISMATCH",
    );
  }
});

await check("synthetic full qualification retains exactly one Preview", async () => {
  const test = bundle();
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(
    result.state.lifecycle_state,
    "QUALIFIED",
    JSON.stringify({
      outcome: result.state.outcome,
      checkpoint: result.state.checkpoint,
      receipts: test.checkpointStore.adapterReceipts(),
      authority: result.state.authority_envelope,
    }),
  );
  assert.equal(result.state.outcome.code, "QUALIFIED");
  assert.equal(result.retained_resources.length, 1);
  assert.equal(result.retained_resources[0].resource_type, "PREVIEW_DEPLOYMENT");
  assert.equal(test.platform.resources.size, 1);
  assert.equal(
    [...test.platform.resources.values()][0].resource.resource_type,
    "PREVIEW_DEPLOYMENT",
  );
  assert.equal(result.state.budgets.requests.used, 4);
  assert.equal(result.state.budgets.mutations.used, 9);
  const createdTypes = test.platform.calls
    .filter((entry) => entry.operation === "CREATE")
    .map((entry) => entry.type);
  assert.ok(
    createdTypes.indexOf("ENVIRONMENT_RECORD") <
      createdTypes.indexOf("PREVIEW_DEPLOYMENT"),
    "Preview environment must be durably created before Preview deployment",
  );
  const evidence = JSON.stringify(result.evidence);
  for (const secret of [
    "synthetic-github-secret",
    "synthetic-vercel-secret",
    "synthetic-anon-secret",
    "synthetic-service-secret",
    "synthetic-admin-password",
    "synthetic-session-secret",
  ]) {
    assert.equal(evidence.includes(secret), false);
  }
});

await check("synthetic failure cleans every exact owned resource", async () => {
  const test = bundle({ platform: createFakePlatform({ staging_verified: false }) });
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(result.state.outcome.successful, false);
  assert.equal(result.retained_resources.length, 0);
  assert.equal(test.platform.resources.size, 0);
  assert.equal(
    test.platform.calls.filter((entry) => entry.operation === "CLEANUP").length,
    5,
  );
});

await check("ambiguous namespace is rejected before all creates", async () => {
  const test = bundle({
    platform: createFakePlatform({ ambiguity_type: "PREVIEW_DEPLOYMENT" }),
  });
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(result.state.outcome.code, "RUN_NAMESPACE_INSPECTION_FAILED");
  const slot = result.state.recovery_operation_state.qualification_operation_slots
    .find((entry) => entry.operation === "VERIFY_FRESH_RESOURCE_PLAN");
  assert.equal(slot.status, "RESULT_APPLIED");
  assert.equal(slot.receipt.diagnostic.failure_class, "OWNERSHIP_AMBIGUOUS");
  assert.equal(
    test.platform.calls.filter((entry) => entry.operation === "CREATE").length,
    0,
  );
  assert.equal(test.platform.resources.size, 0);
});

await check("fresh resource provider failures publish one safe categorical receipt", async () => {
  const expected = [
    ["GIT_BRANCH", "GITHUB", "GIT_BRANCH_EXISTENCE"],
    ["ENVIRONMENT_RECORD", "VERCEL", "ENVIRONMENT_RECORD_LIST"],
    ["PREVIEW_DEPLOYMENT", "VERCEL", "PREVIEW_DEPLOYMENT_LIST"],
    ["DATABASE_ROW", "SUPABASE", "DATABASE_ROW_SELECT"],
    ["STORAGE_OBJECT", "SUPABASE_STORAGE", "STORAGE_OBJECT_EXISTENCE"],
  ];
  for (const [resourceKind, provider, inspectionClass] of expected) {
    const platform = createFakePlatform();
    let attempts = 0;
    platform.inspectFresh = async (resource) => {
      attempts += 1;
      if (resource.resource_type === resourceKind) {
        const error = new Error("raw-provider-body-must-not-escape");
        error.code = `CONCRETE_${resourceKind}_INSPECTION_FAILED`;
        throw error;
      }
      return { status: "ABSENT" };
    };
    const test = bundle({ platform });
    const request = {
      authority_envelope_sha256: sha("a"),
      resource_plan_sha256: sha("b"),
      resource_plan: structuredClone(test.bundle.owned_resources),
      reservation_proof_sha256: sha("c"),
      operation_slot: {
        category: "requests",
        index: 1,
        operation: "VERIFY_FRESH_RESOURCE_PLAN",
        resource_key: null,
        operation_slot_sha256: sha("d"),
      },
    };
    const receipt = await test.bundle.qualification_input.adapters.namespace
      .verifyFresh(request);
    const duplicate = await test.bundle.qualification_input.adapters.namespace
      .verifyFresh(request);
    assert.deepEqual(duplicate, receipt);
    assert.equal(receipt.status, "INSPECTION_FAILED");
    assert.deepEqual(receipt.diagnostic, {
      schema_version: 1,
      request_step: "VERIFY_FRESH_RESOURCE_PLAN",
      provider,
      resource_kind: resourceKind,
      inspection_class: inspectionClass,
      failure_class: "PROVIDER_READ_FAILED",
      receipt_created: true,
      safe_status: "UNAVAILABLE",
      retryability: "UNKNOWN",
      ownership_known: false,
      provider_response_class: "UNCLASSIFIED_FAILURE",
    });
    assert.equal(JSON.stringify(receipt).includes("raw-provider-body"), false);
    assert.equal(test.checkpointStore.adapterReceiptCount(), 1);
    assert.equal(
      attempts,
      expected.findIndex(([kind]) => kind === resourceKind) + 1,
    );
  }
});

await check("one operation slot cannot repeat an external create", async () => {
  const test = bundle();
  const branch = test.bundle.owned_resources.find(
    (resource) => resource.resource_type === "GIT_BRANCH",
  );
  const context = {
    authority_envelope_sha256: sha("a"),
    resource_plan_sha256: sha("b"),
    journal_identity_sha256: sha("c"),
    reservation_proof_sha256: sha("d"),
    operation_slot: {
      category: "mutations",
      index: 0,
      operation: "QUALIFICATION_CREATE_NEW",
      resource_key: branch.resource_key,
      operation_slot_sha256: sha("e"),
    },
  };
  const first = await test.bundle.qualification_input.adapters.branch.create(branch, context);
  const second = await test.bundle.qualification_input.adapters.branch.create(branch, context);
  assert.deepEqual(second, first);
  assert.equal(
    test.platform.calls.filter(
      (entry) => entry.operation === "CREATE" && entry.type === "GIT_BRANCH",
    ).length,
    1,
  );
});

await check("concurrent one-use calls serialize before invoking the external create", async () => {
  const checkpointStore = createCheckpointStore();
  const platform = createFakePlatform();
  const originalCreateBranch = platform.createBranch.bind(platform);
  let createInvocations = 0;
  let markEntered;
  let releaseCreate;
  const entered = new Promise((resolve) => {
    markEntered = resolve;
  });
  const release = new Promise((resolve) => {
    releaseCreate = resolve;
  });
  platform.createBranch = async (...args) => {
    createInvocations += 1;
    markEntered();
    await release;
    return originalCreateBranch(...args);
  };
  const test = bundle({ checkpoint_store: checkpointStore, platform });
  const branch = test.bundle.owned_resources.find(
    (resource) => resource.resource_type === "GIT_BRANCH",
  );
  const context = {
    authority_envelope_sha256: sha("a"),
    resource_plan_sha256: sha("b"),
    journal_identity_sha256: sha("c"),
    reservation_proof_sha256: sha("d"),
    operation_slot: {
      category: "mutations",
      index: 0,
      operation: "QUALIFICATION_CREATE_NEW",
      resource_key: branch.resource_key,
      operation_slot_sha256: sha("e"),
    },
  };
  const first = test.bundle.qualification_input.adapters.branch.create(
    branch,
    context,
  );
  await entered;
  const second = test.bundle.qualification_input.adapters.branch.create(
    branch,
    context,
  );
  await Promise.resolve();
  releaseCreate();
  const results = await Promise.all([first, second]);
  assert.deepEqual(results[1], results[0]);
  assert.equal(createInvocations, 1);
});

await check("database binding owns exactly one fixture row", async () => {
  const platform = createFakePlatform();
  platform.createDatabaseFixture = async () => ({
    resource_type: "DATABASE_ROW",
    row_ids: [`row_${RUN_ID}_1`, `row_${RUN_ID}_2`],
  });
  const test = bundle({ platform });
  const database = test.bundle.owned_resources.find(
    (resource) => resource.resource_type === "DATABASE_ROW",
  );
  const context = {
    authority_envelope_sha256: sha("a"),
    resource_plan_sha256: sha("b"),
    journal_identity_sha256: sha("c"),
    reservation_proof_sha256: sha("d"),
    operation_slot: {
      category: "mutations",
      index: 0,
      operation: "QUALIFICATION_CREATE_NEW",
      resource_key: database.resource_key,
      operation_slot_sha256: sha("e"),
    },
  };
  await assert.rejects(
    test.bundle.qualification_input.adapters.fixture.create(database, context),
    (error) => error?.code === "CONCRETE_EXTERNAL_BINDING_INVALID",
  );
});

await check("Storage create version is bound into exact CAS cleanup", async () => {
  const test = bundle();
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(result.state.lifecycle_state, "QUALIFIED");
  const storageCreate = result.state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.operation === "QUALIFICATION_CREATE_NEW" &&
      slot.resource_key?.includes(":STORAGE_OBJECT:"),
  );
  assert.equal(storageCreate.receipt.external_binding.expected_version, "storage-version-1");
  const storageDelete = result.state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.operation === "QUALIFICATION_DELETE_EXACT" &&
      slot.resource_key?.includes(":STORAGE_OBJECT:"),
  );
  assert.equal(storageDelete.receipt.expected_version, "storage-version-1");
});

await check("Storage stale replacement is preserved and failure retains no Preview", async () => {
  const test = bundle({ platform: createFakePlatform({ storage_replacement: true }) });
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(result.state.outcome.successful, false);
  assert.equal(result.retained_resources.length, 0);
  const storage = result.state.owned_resources.find(
    (resource) => resource.resource_type === "STORAGE_OBJECT",
  );
  assert.equal(test.platform.resources.has(storage.resource_key), true);
  assert.equal(
    result.state.effect_ledger.find((entry) => entry.resource_key === storage.resource_key)
      .cleanup_status,
    "VERSION_MISMATCH_PRESERVED",
  );
  assert.equal(
    [...test.platform.resources.values()].some(
      (entry) => entry.resource.resource_type === "PREVIEW_DEPLOYMENT",
    ),
    false,
  );
});

await check("duplicate qualification attempt never repeats adapters", async () => {
  const store = createCheckpointStore();
  const platform = createFakePlatform();
  const first = bundle({ checkpoint_store: store, platform });
  const firstResult = await runQualification(first.bundle.qualification_input);
  assert.equal(firstResult.state.lifecycle_state, "QUALIFIED");
  const callsAfterFirst = platform.calls.length;
  const second = bundle({ checkpoint_store: store, platform });
  const secondResult = await runQualification(second.bundle.qualification_input);
  assert.equal(secondResult.state.result_type, "QUALIFICATION_FAILURE_PROJECTION");
  assert.equal(secondResult.state.outcome.code, "ATTEMPT_ALREADY_EXISTS");
  assert.equal(platform.calls.length, callsAfterFirst);
});

await check("budget exhaustion stops before platform calls", async () => {
  const test = bundle();
  test.bundle.qualification_input.budgets.requests.limit = 15;
  const result = await runQualification(test.bundle.qualification_input);
  assert.equal(result.state.outcome.code, "BUDGET_EXHAUSTED");
  assert.equal(test.platform.calls.length, 0);
});

await check("partial branch effect is recovered without repeating qualification create", async () => {
  const test = bundle({
    platform: createFakePlatform({ create_response_loss_type: "GIT_BRANCH" }),
  });
  const failed = await runQualification(test.bundle.qualification_input);
  assert.equal(failed.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(test.platform.resources.size, 1);
  const createCalls = test.platform.calls.filter(
    (entry) => entry.operation === "CREATE",
  ).length;
  const recovered = await recoverQualification(
    test.bundle.create_recovery_input(),
  );
  assert.equal(recovered.lifecycle_state, "READY");
  assert.equal(recovered.recovery.status, "COMPLETE");
  assert.equal(test.platform.resources.size, 0);
  assert.equal(
    test.platform.calls.filter((entry) => entry.operation === "CREATE").length,
    createCalls,
  );
});

await check("partial environment identity is durable and cleaned without create replay", async () => {
  const test = bundle({
    platform: createFakePlatform({
      create_response_loss_type: "ENVIRONMENT_RECORD",
    }),
  });
  const failed = await runQualification(test.bundle.qualification_input);
  assert.equal(failed.state.lifecycle_state, "FAILED_CLOSED");
  const environment = failed.state.owned_resources.find(
    (entry) => entry.resource_type === "ENVIRONMENT_RECORD",
  );
  assert.deepEqual(
    await test.checkpointStore.loadExternalBinding(environment.resource_key),
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [{ key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` }],
    },
  );
  assert.equal(test.platform.resources.size, 0);
  assert.equal(
    test.platform.calls.filter((entry) => entry.operation === "CREATE").length,
    2,
  );
  assert.equal(
    test.platform.calls.filter(
      (entry) => entry.operation === "CLEANUP" &&
        entry.type === "ENVIRONMENT_RECORD",
    ).length,
    1,
  );
});

await check("partial environment delete response loss reloads and cleans only the exact survivor", async () => {
  const test = bundle({
    platform: createFakePlatform({
      environment_cleanup_response_loss: true,
      staging_verified: false,
    }),
  });
  const failed = await runQualification(test.bundle.qualification_input);
  assert.equal(failed.state.lifecycle_state, "FAILED_RECOVERABLE");
  const environment = failed.state.owned_resources.find(
    (entry) => entry.resource_type === "ENVIRONMENT_RECORD",
  );
  const durableBinding = await test.checkpointStore.loadExternalBinding(
    environment.resource_key,
  );
  assert.deepEqual(durableBinding, {
    resource_type: "ENVIRONMENT_RECORD",
    records: [
      { key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` },
      { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
    ],
  });
  assert.deepEqual(
    test.platform.resources.get(environment.resource_key)?.binding,
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [
        { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
      ],
    },
  );
  const createCalls = test.platform.calls.filter(
    (entry) => entry.operation === "CREATE",
  ).length;
  const recovered = await recoverQualification(
    test.bundle.create_recovery_input(),
  );
  assert.equal(recovered.lifecycle_state, "READY");
  assert.equal(recovered.recovery.status, "COMPLETE");
  assert.equal(test.platform.resources.size, 0);
  assert.equal(
    test.platform.calls.filter((entry) => entry.operation === "CREATE").length,
    createCalls,
  );
  assert.equal(
    test.platform.calls.filter(
      (entry) => entry.operation === "CLEANUP" &&
        entry.type === "ENVIRONMENT_RECORD",
    ).length,
    2,
  );
});

await check("lost second environment create response merges keyed durable and discovered survivors", async () => {
  const test = bundle({
    platform: createFakePlatform({
      environment_second_create_response_loss: true,
    }),
  });
  const failed = await runQualification(test.bundle.qualification_input);
  assert.equal(failed.state.lifecycle_state, "FAILED_RECOVERABLE");
  const environment = failed.state.owned_resources.find(
    (entry) => entry.resource_type === "ENVIRONMENT_RECORD",
  );
  assert.deepEqual(
    await test.checkpointStore.loadExternalBinding(environment.resource_key),
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [{ key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` }],
    },
  );
  assert.deepEqual(
    test.platform.resources.get(environment.resource_key)?.binding,
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [
        { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
      ],
    },
  );
  const recovered = await recoverQualification(
    test.bundle.create_recovery_input(),
  );
  assert.equal(recovered.lifecycle_state, "READY");
  assert.equal(recovered.recovery.status, "COMPLETE");
  assert.equal(test.platform.resources.size, 0);
  assert.deepEqual(
    await test.checkpointStore.loadExternalBinding(environment.resource_key),
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [
        { key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` },
        { key: "ADMIN_SESSION_SECRET", id: `env_${RUN_ID}_2` },
      ],
    },
  );
});

await check("recovery persists a rediscovered environment binding before delete response loss", async () => {
  const test = bundle({
    platform: createFakePlatform({
      environment_first_create_response_loss: true,
      environment_recovery_cleanup_response_loss: true,
    }),
  });
  const failed = await runQualification(test.bundle.qualification_input);
  assert.equal(failed.state.lifecycle_state, "FAILED_RECOVERABLE");
  const environment = failed.state.owned_resources.find(
    (entry) => entry.resource_type === "ENVIRONMENT_RECORD",
  );
  assert.equal(
    await test.checkpointStore.loadExternalBinding(environment.resource_key),
    null,
  );
  const interrupted = await recoverQualification(
    test.bundle.create_recovery_input(),
  );
  assert.equal(interrupted.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(test.platform.resources.size, 0);
  assert.deepEqual(
    await test.checkpointStore.loadExternalBinding(environment.resource_key),
    {
      resource_type: "ENVIRONMENT_RECORD",
      records: [{ key: "ADMIN_PASSWORD", id: `env_${RUN_ID}_1` }],
    },
  );
  const recovered = await recoverQualification(
    test.bundle.create_recovery_input(),
  );
  assert.equal(recovered.lifecycle_state, "READY");
  assert.equal(recovered.recovery.status, "COMPLETE");
  assert.equal(
    test.platform.calls.filter(
      (entry) => entry.operation === "CLEANUP" &&
        entry.type === "ENVIRONMENT_RECORD",
    ).length,
    2,
  );
});

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_ADAPTERS assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_CONCRETE_ADAPTERS assertions=${assertions} synthetic_qualifications=5 network=0 credential_reads=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
