import assert from "node:assert/strict";
import {
  AUTHORIZATION_CLASSES,
  reconcileRecovery,
} from "./kernel.mjs";

const CANDIDATE = "1".repeat(64);
const REVIEW = "2".repeat(64);
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

function recoveryAuthorization(candidate = CANDIDATE) {
  return {
    schema_version: 1,
    authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
    candidate_identity_sha256: candidate,
    review_sha256: REVIEW,
  };
}

function rowResource(overrides = {}) {
  return {
    resource_key: "row:discovered_tools:row-1",
    resource_type: "DATABASE_ROW",
    owner: {
      phase: "34JA-34JZ",
      candidate_identity_sha256: CANDIDATE,
    },
    locator: { relation: "discovered_tools", id: "row-1" },
    ...overrides,
  };
}

function storageResource(overrides = {}) {
  return {
    resource_key: "storage:tool-logos/logo.png",
    resource_type: "STORAGE_OBJECT",
    owner: {
      phase: "34JA-34JZ",
      candidate_identity_sha256: CANDIDATE,
    },
    locator: { bucket: "tool-logos", name: "logo.png" },
    storage_cas: {
      expected_version: "version-1",
      delete_capability_sha256: "3".repeat(64),
    },
    ...overrides,
  };
}

function recoveryState({ resources = [rowResource()], ledger } = {}) {
  return {
    schema_version: 1,
    candidate_identity_sha256: CANDIDATE,
    lifecycle_state: "FAILED_RECOVERABLE",
    authorization_class: "RECOVERY_CONTROLLER",
    budgets: {
      requests: { limit: 8, used: 0 },
      mutations: { limit: 4, used: 0 },
    },
    owned_resources: resources,
    effect_ledger:
      ledger ?? [
        {
          sequence: 1,
          resource_key: resources[0].resource_key,
          effect: "CREATE",
          status: "APPLIED",
        },
      ],
    recovery: { status: "PENDING", resume_to: "READY" },
  };
}

await check("ambiguous ownership rejection", async () => {
  let inspections = 0;
  const duplicate = rowResource({ resource_key: "row:duplicate" });
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        resources: [rowResource(), duplicate],
        ledger: [
          { sequence: 1, resource_key: rowResource().resource_key, effect: "CREATE", status: "APPLIED" },
          { sequence: 2, resource_key: duplicate.resource_key, effect: "CREATE", status: "APPLIED" },
        ],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "PRESENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "OWNERSHIP_AMBIGUOUS");
  assert.equal(inspections, 0);
});

await check("incomplete resource locator is rejected", async () => {
  const resource = {
    resource_key: "preview:unknown",
    resource_type: "PREVIEW_DEPLOYMENT",
    owner: {
      phase: "34JA-34JZ",
      candidate_identity_sha256: CANDIDATE,
    },
    locator: {},
  };
  let inspections = 0;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "OWNERSHIP_UNPROVEN");
  assert.equal(inspections, 0);
});

await check("unledgered owned resource is rejected", async () => {
  const second = rowResource({
    resource_key: "row:discovered_tools:row-2",
    locator: { relation: "discovered_tools", id: "row-2" },
  });
  let inspections = 0;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({ resources: [rowResource(), second] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "OWNERSHIP_UNPROVEN");
  assert.equal(inspections, 0);
});

await check("candidate mismatch performs no effect", async () => {
  let calls = 0;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: "9".repeat(64),
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      calls += 1;
      return { status: "PRESENT" };
    },
    reconcileOwnedResource: async () => {
      calls += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "CANDIDATE_MISMATCH");
  assert.equal(calls, 0);
});

await check("exact ownership recovery", async () => {
  const calls = [];
  let present = true;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async (resource) => {
      calls.push(["inspect", resource.resource_key]);
      return { status: present ? "PRESENT" : "ABSENT" };
    },
    reconcileOwnedResource: async (resource) => {
      calls.push(["reconcile", resource.resource_key]);
      present = false;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.equal(result.recovery.status, "COMPLETE");
  assert.equal(result.effect_ledger[0].status, "CLEANED");
  assert.deepEqual(calls, [
    ["inspect", "row:discovered_tools:row-1"],
    ["reconcile", "row:discovered_tools:row-1"],
    ["inspect", "row:discovered_tools:row-1"],
  ]);
});

await check("recovery idempotence", async () => {
  let reconciliations = 0;
  const state = recoveryState({
    ledger: [
      {
        sequence: 1,
        resource_key: rowResource().resource_key,
        effect: "CREATE",
        status: "CLEANED",
      },
    ],
  });
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => state,
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "ABSENT" }),
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.equal(reconciliations, 0);
});

await check("partial effect reconciliation", async () => {
  const second = rowResource({
    resource_key: "row:discovered_tools:row-2",
    locator: { relation: "discovered_tools", id: "row-2" },
  });
  const present = new Set([rowResource().resource_key]);
  const reconciled = [];
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        resources: [rowResource(), second],
        ledger: [
          { sequence: 1, resource_key: rowResource().resource_key, effect: "CREATE", status: "APPLIED" },
          { sequence: 2, resource_key: second.resource_key, effect: "CREATE", status: "INTENT_ONLY" },
        ],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async (resource) => ({
      status: present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
    }),
    reconcileOwnedResource: async (resource) => {
      reconciled.push(resource.resource_key);
      present.delete(resource.resource_key);
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.deepEqual(reconciled, [rowResource().resource_key]);
  assert.deepEqual(result.effect_ledger.map((entry) => entry.status), [
    "CLEANED",
    "CLEANED",
  ]);
});

await check("intent-only unexpected presence fails closed", async () => {
  let reconciliations = 0;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        ledger: [
          {
            sequence: 1,
            resource_key: rowResource().resource_key,
            effect: "CREATE",
            status: "INTENT_ONLY",
          },
        ],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "PRESENT" }),
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "INTENT_OWNERSHIP_UNPROVEN");
  assert.equal(reconciliations, 0);
});

await check("cleanup verification failure", async () => {
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "PRESENT" }),
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "CLEANUP_VERIFICATION_FAILED");
});

await check("storage cleanup uses exact CAS", async () => {
  let present = true;
  let observedExpectedVersion = null;
  const resource = storageResource();
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({
      status: present ? "PRESENT" : "ABSENT",
      observed_version: present ? "version-1" : null,
    }),
    reconcileOwnedResource: async (owned, contract) => {
      observedExpectedVersion = contract.expected_version;
      assert.equal(owned.resource_type, "STORAGE_OBJECT");
      present = false;
      return { status: "DELETED_EXACT", expected_version: contract.expected_version };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.equal(observedExpectedVersion, "version-1");
});

await check("storage replacement mismatch is preserved", async () => {
  let cleanupCalls = 0;
  const resource = storageResource();
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({
      status: "PRESENT",
      observed_version: "version-2",
    }),
    reconcileOwnedResource: async () => {
      cleanupCalls += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "STORAGE_VERSION_MISMATCH");
  assert.equal(cleanupCalls, 0);
});

await check("storage CAS race is classified as version mismatch", async () => {
  let inspections = 0;
  const resource = storageResource();
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "PRESENT", observed_version: "version-1" };
    },
    reconcileOwnedResource: async () => ({
      status: "VERSION_MISMATCH",
      expected_version: "version-1",
      observed_version: "version-2",
    }),
  });
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "STORAGE_VERSION_MISMATCH");
  assert.equal(inspections, 1);
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_RECOVERY assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_RECOVERY assertions=${assertions} synthetic_only=true network=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
