import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AUTHORIZATION_CLASSES,
  LIFECYCLE_STATES,
  applyLifecycleTransition,
  buildCompactEvidence,
  consumeBudget,
  createKernelState,
  validateCompactEvidence,
} from "./kernel.mjs";

const CANDIDATE = "1".repeat(64);
const LOCAL_REVIEW = "2".repeat(64);
const OFFICIAL_REVIEW = "3".repeat(64);
const AUDIT_DIGEST = "4".repeat(64);
const failures = [];
let assertions = 0;

function check(name, operation) {
  try {
    operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

function authorization(authorizationClass, candidateIdentity = CANDIDATE) {
  return {
    schema_version: 1,
    authorization_class: authorizationClass,
    candidate_identity_sha256: candidateIdentity,
    review_sha256:
      authorizationClass === AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME
        ? OFFICIAL_REVIEW
        : LOCAL_REVIEW,
  };
}

function initialState() {
  return createKernelState({
    candidate_identity_sha256: CANDIDATE,
    budgets: {
      requests: { limit: 4, used: 0 },
      mutations: { limit: 2, used: 0 },
    },
  });
}

check("lifecycle happy path", () => {
  let state = initialState();
  const local = authorization(AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION);
  const official = authorization(AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME);
  for (const [target, grant] of [
    ["QUALIFYING", local],
    ["QUALIFIED", local],
    ["OFFICIAL_RUNTIME_AUTHORIZED", official],
    ["OFFICIAL_RUNTIME_RUNNING", official],
    ["COMPLETE", official],
  ]) {
    state = applyLifecycleTransition(state, target, grant);
  }
  assert.equal(state.lifecycle_state, "COMPLETE");
  assert.deepEqual(state.transition_history.map((entry) => entry.to), [
    "QUALIFYING",
    "QUALIFIED",
    "OFFICIAL_RUNTIME_AUTHORIZED",
    "OFFICIAL_RUNTIME_RUNNING",
    "COMPLETE",
  ]);
});

check("every allowed transition", () => {
  const allowed = [
    ["READY", "QUALIFYING", "LOCAL_QUALIFICATION"],
    ["QUALIFYING", "QUALIFIED", "LOCAL_QUALIFICATION"],
    ["QUALIFYING", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
    ["QUALIFYING", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["QUALIFIED", "OFFICIAL_RUNTIME_AUTHORIZED", "OFFICIAL_RUNTIME"],
    ["QUALIFIED", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_AUTHORIZED", "OFFICIAL_RUNTIME_RUNNING", "OFFICIAL_RUNTIME"],
    ["OFFICIAL_RUNTIME_AUTHORIZED", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_RUNNING", "COMPLETE", "OFFICIAL_RUNTIME"],
    ["OFFICIAL_RUNTIME_RUNNING", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_RUNNING", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["FAILED_RECOVERABLE", "READY", "RECOVERY_CONTROLLER"],
    ["FAILED_RECOVERABLE", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
  ];
  for (const [from, to, authorizationClass] of allowed) {
    const state = { ...initialState(), lifecycle_state: from };
    const next = applyLifecycleTransition(
      state,
      to,
      authorization(authorizationClass),
    );
    assert.equal(next.lifecycle_state, to, `${from}->${to}`);
  }
});

check("every denied transition fails closed", () => {
  const allowedTargets = new Set([
    "READY>QUALIFYING",
    "QUALIFYING>QUALIFIED",
    "QUALIFYING>FAILED_RECOVERABLE",
    "QUALIFYING>FAILED_CLOSED",
    "QUALIFIED>OFFICIAL_RUNTIME_AUTHORIZED",
    "QUALIFIED>FAILED_CLOSED",
    "OFFICIAL_RUNTIME_AUTHORIZED>OFFICIAL_RUNTIME_RUNNING",
    "OFFICIAL_RUNTIME_AUTHORIZED>FAILED_CLOSED",
    "OFFICIAL_RUNTIME_RUNNING>COMPLETE",
    "OFFICIAL_RUNTIME_RUNNING>FAILED_RECOVERABLE",
    "OFFICIAL_RUNTIME_RUNNING>FAILED_CLOSED",
    "FAILED_RECOVERABLE>READY",
    "FAILED_RECOVERABLE>FAILED_CLOSED",
  ]);
  const nonterminal = LIFECYCLE_STATES.filter(
    (state) => !["COMPLETE", "FAILED_CLOSED"].includes(state),
  );
  for (const from of nonterminal) {
    for (const to of LIFECYCLE_STATES) {
      if (allowedTargets.has(`${from}>${to}`)) continue;
      const result = applyLifecycleTransition(
        { ...initialState(), lifecycle_state: from },
        to,
        authorization(AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER),
      );
      assert.equal(result.lifecycle_state, "FAILED_CLOSED", `${from}->${to}`);
      assert.equal(result.outcome.code, "TRANSITION_DENIED");
    }
  }
});

check("terminal states stay terminal", () => {
  for (const from of ["COMPLETE", "FAILED_CLOSED"]) {
    const state = { ...initialState(), lifecycle_state: from };
    const result = applyLifecycleTransition(
      state,
      "READY",
      authorization(AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER),
    );
    assert.equal(result.lifecycle_state, from);
    assert.equal(result.outcome.code, "TERMINAL_STATE");
  }
});

check("candidate mismatch fails closed", () => {
  const result = applyLifecycleTransition(
    initialState(),
    "QUALIFYING",
    authorization(AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION, "9".repeat(64)),
  );
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "CANDIDATE_MISMATCH");
});

check("authorization mismatch fails closed", () => {
  const result = applyLifecycleTransition(
    initialState(),
    "QUALIFYING",
    authorization(AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME),
  );
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "AUTHORIZATION_CLASS_MISMATCH");
});

check("official authority remains separate", () => {
  const qualified = { ...initialState(), lifecycle_state: "QUALIFIED" };
  const result = applyLifecycleTransition(
    qualified,
    "OFFICIAL_RUNTIME_AUTHORIZED",
    authorization(AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION),
  );
  assert.equal(result.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.outcome.code, "AUTHORIZATION_CLASS_MISMATCH");
});

check("budget consumption", () => {
  const budget = consumeBudget(
    { requests: { limit: 4, used: 1 }, mutations: { limit: 2, used: 0 } },
    "requests",
    2,
  );
  assert.deepEqual(budget, {
    requests: { limit: 4, used: 3 },
    mutations: { limit: 2, used: 0 },
  });
});

check("budget exhaustion fails closed", () => {
  assert.throws(
    () =>
      consumeBudget(
        { requests: { limit: 1, used: 1 }, mutations: { limit: 0, used: 0 } },
        "requests",
        1,
      ),
    (error) => error?.code === "BUDGET_EXHAUSTED",
  );
});

check("compact evidence validates", () => {
  const evidence = buildCompactEvidence({
    candidate_identity_sha256: CANDIDATE,
    lifecycle_state: "READY",
    authorization_class: "LOCAL_QUALIFICATION",
    budgets: {
      requests: { limit: 4, used: 1 },
      mutations: { limit: 2, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
    immutable_audit_reference_sha256: [AUDIT_DIGEST],
  });
  assert.equal(validateCompactEvidence(evidence), true);
  assert.match(evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(Object.hasOwn(evidence, "raw"), false);
});

check("compact evidence rejects schema-divergent fields and ledgers", () => {
  const input = {
    candidate_identity_sha256: CANDIDATE,
    lifecycle_state: "READY",
    authorization_class: "LOCAL_QUALIFICATION",
    budgets: {
      requests: { limit: 4, used: 1 },
      mutations: { limit: 2, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
    immutable_audit_reference_sha256: [AUDIT_DIGEST],
  };
  for (const malformed of [
    {
      ...input,
      outcome: { ...input.outcome, detail: "extra" },
    },
    {
      ...input,
      immutable_audit_reference_sha256: [AUDIT_DIGEST, AUDIT_DIGEST],
    },
    {
      ...input,
      recovery: { status: "" },
    },
    {
      ...input,
      outcome: { code: "", successful: false },
    },
    {
      ...input,
      effect_ledger: [
        {
          sequence: 1,
          resource_key: "missing",
          effect: "CREATE",
          status: "APPLIED",
          detail: "extra",
        },
      ],
    },
  ]) {
    assert.throws(
      () => buildCompactEvidence(malformed),
      (error) => error?.code === "EVIDENCE_SHAPE",
    );
  }
});

check("secret-shaped evidence is rejected", () => {
  assert.throws(
    () =>
      buildCompactEvidence({
        candidate_identity_sha256: CANDIDATE,
        lifecycle_state: "READY",
        authorization_class: "LOCAL_QUALIFICATION",
        budgets: {
          requests: { limit: 0, used: 0 },
          mutations: { limit: 0, used: 0 },
        },
        owned_resources: [],
        effect_ledger: [],
        cleanup: { required: false, verified: true },
        recovery: { status: "NOT_REQUIRED" },
        outcome: { code: "READY", successful: true },
        immutable_audit_reference_sha256: [AUDIT_DIGEST],
        nested: { admin_password: "must-not-persist" },
      }),
    (error) => error?.code === "EVIDENCE_SECRET_FIELD",
  );
});

check("secret-bearing evidence value is rejected", () => {
  assert.throws(
    () =>
      buildCompactEvidence({
        candidate_identity_sha256: CANDIDATE,
        lifecycle_state: "READY",
        authorization_class: "LOCAL_QUALIFICATION",
        budgets: {
          requests: { limit: 0, used: 0 },
          mutations: { limit: 0, used: 0 },
        },
        owned_resources: [],
        effect_ledger: [],
        cleanup: { required: false, verified: true },
        recovery: { status: "NOT_REQUIRED" },
        outcome: {
          code: `Bearer ${"a".repeat(24)}`,
          successful: false,
        },
        immutable_audit_reference_sha256: [AUDIT_DIGEST],
      }),
    (error) => error?.code === "EVIDENCE_SECRET_VALUE",
  );
});

check("evidence identity is deterministic", () => {
  const input = {
    candidate_identity_sha256: CANDIDATE,
    lifecycle_state: "READY",
    authorization_class: "LOCAL_QUALIFICATION",
    budgets: {
      requests: { limit: 1, used: 0 },
      mutations: { limit: 1, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
    immutable_audit_reference_sha256: [AUDIT_DIGEST],
  };
  assert.equal(
    buildCompactEvidence(input).evidence_identity_sha256,
    buildCompactEvidence(structuredClone(input)).evidence_identity_sha256,
  );
});

check("evidence schema matches the compact contract", () => {
  const schema = JSON.parse(
    readFileSync(
      path.join(import.meta.dirname, "evidence.schema.json"),
      "utf8",
    ),
  );
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, [
    "schema_version",
    "candidate_identity_sha256",
    "lifecycle_state",
    "authorization_class",
    "budgets",
    "owned_resources",
    "effect_ledger",
    "cleanup",
    "recovery",
    "outcome",
    "immutable_audit_reference_sha256",
    "evidence_identity_sha256",
  ]);
  assert.equal(schema.properties.recovery.additionalProperties, false);
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_KERNEL assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_KERNEL assertions=${assertions} lifecycle_states=${LIFECYCLE_STATES.length} failures=0 internal_failures=0`,
  );
}
