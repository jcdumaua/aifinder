import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as kernelModule from "./kernel.mjs";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  AUTHORIZATION_CLASSES,
  LIFECYCLE_STATES,
  applyLifecycleTransition,
  buildCompactEvidence,
  commitDurableCheckpoint,
  consumeBudget,
  createOperationReservation,
  createRecoveryOperationState,
  createKernelState,
  deriveAuthorityEnvelopeSha256,
  deriveJournalIdentitySha256,
  deriveOperationSlot,
  deriveResourcePlanSha256,
  validateCompactEvidence,
} from "./kernel.mjs";

const CANDIDATE = "1".repeat(64);
const LOCAL_REVIEW = "2".repeat(64);
const OFFICIAL_REVIEW = "3".repeat(64);
const AUDIT_DIGEST = "4".repeat(64);
const FREEZE_DIGEST = "6".repeat(64);
const RETAINED_DIGEST = "7".repeat(64);
const RETAINED_ATTESTATION =
  "69cdf8984a060a9027df02919ecd1c04a3e28d188f5528aad4dd096376448db7";
const EVIDENCE_AUTHORITY = Object.freeze({
  run_id: "qualification-run-kernel-0001",
  phase: "34JA-34JZ",
  operation_class: "NONPRODUCTION_QUALIFICATION",
  review_approval_sha256: "5".repeat(64),
});
const failures = [];
let assertions = 0;

function compactEvidenceInput(overrides = {}) {
  const resourcePlan = structuredClone(overrides.resource_plan ?? []);
  const resourcePlanSha256 = deriveResourcePlanSha256(resourcePlan);
  const authorityEnvelope = {
    schema_version: 1,
    candidate_identity_sha256: CANDIDATE,
    run_id: EVIDENCE_AUTHORITY.run_id,
    phase: EVIDENCE_AUTHORITY.phase,
    operation_class: EVIDENCE_AUTHORITY.operation_class,
    review_approval_sha256: EVIDENCE_AUTHORITY.review_approval_sha256,
    freeze_document_sha256: FREEZE_DIGEST,
    current_retained_state_attestation_sha256: RETAINED_ATTESTATION,
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 = deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation = createOperationReservation(authorityEnvelopeSha256);
  return {
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    candidate_identity_sha256: CANDIDATE,
    ...EVIDENCE_AUTHORITY,
    lifecycle_state: "READY",
    authorization_class: "NONE",
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    freeze_document_sha256: FREEZE_DIGEST,
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    retained_state_sha256: RETAINED_DIGEST,
    resource_plan: resourcePlan,
    resource_plan_sha256: resourcePlanSha256,
    outcome: { code: "READY", successful: true },
    immutable_audit_reference_sha256: [AUDIT_DIGEST],
    operation_reservation: operationReservation,
    recovery_operation_state: createRecoveryOperationState(
      operationReservation,
      resourcePlan,
    ),
    journal_identity_sha256: deriveJournalIdentitySha256({
      authority_envelope_sha256: authorityEnvelopeSha256,
      resource_plan_sha256: resourcePlanSha256,
      ordered_resource_keys: resourcePlan.map((resource) => resource.resource_key),
      operation_reservation_identity_sha256: operationReservation.identity_sha256,
    }),
    ...overrides,
  };
}

function check(name, operation) {
  try {
    operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

async function asyncCheck(name, operation) {
  try {
    await operation();
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

check("kernel export surface omits the dead anchor-only recovery mutation", () => {
  assert.equal(Object.hasOwn(kernelModule, "ensureRecoveryAnchor"), false);
});

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

check("local qualification may explicitly close only a cleanup-verified failure", () => {
  const local = authorization(AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION);
  const qualifying = applyLifecycleTransition(initialState(), "QUALIFYING", local);
  const closed = applyLifecycleTransition(qualifying, "FAILED_CLOSED", local);
  assert.equal(closed.lifecycle_state, "FAILED_CLOSED");
  assert.deepEqual(closed.transition_history.at(-1), {
    from: "QUALIFYING",
    to: "FAILED_CLOSED",
    authorization_class: "LOCAL_QUALIFICATION",
    review_sha256: LOCAL_REVIEW,
  });
});

check("every allowed transition", () => {
  const allowed = [
    ["READY", "QUALIFYING", "LOCAL_QUALIFICATION"],
    ["READY", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
    ["QUALIFYING", "QUALIFIED", "LOCAL_QUALIFICATION"],
    ["QUALIFYING", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
    ["QUALIFYING", "FAILED_CLOSED", "LOCAL_QUALIFICATION"],
    ["QUALIFIED", "OFFICIAL_RUNTIME_AUTHORIZED", "OFFICIAL_RUNTIME"],
    ["QUALIFIED", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_AUTHORIZED", "OFFICIAL_RUNTIME_RUNNING", "OFFICIAL_RUNTIME"],
    ["OFFICIAL_RUNTIME_AUTHORIZED", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_RUNNING", "COMPLETE", "OFFICIAL_RUNTIME"],
    ["OFFICIAL_RUNTIME_RUNNING", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
    ["OFFICIAL_RUNTIME_RUNNING", "FAILED_CLOSED", "RECOVERY_CONTROLLER"],
    ["FAILED_RECOVERABLE", "READY", "RECOVERY_CONTROLLER"],
    ["FAILED_RECOVERABLE", "FAILED_RECOVERABLE", "RECOVERY_CONTROLLER"],
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
    assert.equal(
      next.transition_history.at(-1)?.authorization_class,
      authorizationClass,
      `${from}->${to}:provenance`,
    );
  }
});

check("every denied transition fails closed", () => {
  const allowedTargets = new Set([
    "READY>QUALIFYING",
    "READY>FAILED_RECOVERABLE",
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
    "FAILED_RECOVERABLE>FAILED_RECOVERABLE",
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
  const evidence = buildCompactEvidence(compactEvidenceInput());
  assert.equal(validateCompactEvidence(evidence), true);
  assert.match(evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(Object.hasOwn(evidence, "raw"), false);
});

check("compact evidence enforces the schema's exact 16/15 accounting contract", () => {
  const evidence = buildCompactEvidence(compactEvidenceInput());
  for (const budgets of [
    {
      requests: { limit: 4, used: 0 },
      mutations: { limit: 2, used: 0 },
    },
    {
      requests: { limit: 16, used: 1 },
      mutations: { limit: 15, used: 0 },
    },
  ]) {
    const malformed = structuredClone(evidence);
    malformed.budgets = budgets;
    delete malformed.evidence_identity_sha256;
    malformed.evidence_identity_sha256 = sha256Hex(canonicalJson(malformed));
    assert.throws(
      () => validateCompactEvidence(malformed),
      (error) => error?.code === "EVIDENCE_SHAPE",
    );
  }
});

check("initial READY compact evidence rejects every canonically rehashed lifecycle substitution", () => {
  const ready = buildCompactEvidence(compactEvidenceInput());
  for (const lifecycle of LIFECYCLE_STATES.filter(
    (candidate) => candidate !== "READY",
  )) {
    const malformed = structuredClone(ready);
    malformed.lifecycle_state = lifecycle;
    delete malformed.evidence_identity_sha256;
    malformed.evidence_identity_sha256 = sha256Hex(canonicalJson(malformed));
    assert.throws(
      () => validateCompactEvidence(malformed),
      (error) => error?.code === "EVIDENCE_SHAPE",
      lifecycle,
    );
  }
});

check("compact evidence rejects schema-divergent fields and ledgers", () => {
  const input = compactEvidenceInput();
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
      buildCompactEvidence(compactEvidenceInput({
        budgets: {
          requests: { limit: 0, used: 0 },
          mutations: { limit: 0, used: 0 },
        },
        nested: { admin_password: "must-not-persist" },
      })),
    (error) => error?.code === "EVIDENCE_SECRET_FIELD",
  );
});

check("secret-bearing evidence value is rejected", () => {
  assert.throws(
    () =>
      buildCompactEvidence(compactEvidenceInput({
        budgets: {
          requests: { limit: 0, used: 0 },
          mutations: { limit: 0, used: 0 },
        },
        outcome: {
          code: `Bearer ${"a".repeat(24)}`,
          successful: false,
        },
      })),
    (error) => error?.code === "EVIDENCE_SECRET_VALUE",
  );
});

check("evidence identity is deterministic", () => {
  const input = compactEvidenceInput({
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
  });
  assert.equal(
    buildCompactEvidence(input).evidence_identity_sha256,
    buildCompactEvidence(structuredClone(input)).evidence_identity_sha256,
  );
});

function checkpointProtocolState() {
  const evidence = compactEvidenceInput({
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
  });
  return {
    schema_version: 1,
    candidate_identity_sha256: evidence.candidate_identity_sha256,
    run_id: evidence.run_id,
    phase: evidence.phase,
    operation_class: evidence.operation_class,
    review_approval_sha256: evidence.review_approval_sha256,
    freeze_document_sha256: evidence.freeze_document_sha256,
    retained_state_sha256: evidence.retained_state_sha256,
    authority_envelope: evidence.authority_envelope,
    authority_envelope_sha256: evidence.authority_envelope_sha256,
    resource_plan: evidence.resource_plan,
    resource_plan_sha256: evidence.resource_plan_sha256,
    operation_reservation: evidence.operation_reservation,
    recovery_operation_state: createRecoveryOperationState(
      evidence.operation_reservation,
      evidence.resource_plan,
    ),
    journal_identity_sha256: evidence.journal_identity_sha256,
    lifecycle_state: "READY",
    authorization_class: "NONE",
    budgets: evidence.budgets,
    owned_resources: [],
    effect_ledger: [],
    transition_history: [],
    cleanup: evidence.cleanup,
    recovery: evidence.recovery,
    outcome: evidence.outcome,
  };
}

function exactCheckpointReceipt(command) {
  return {
    schema_version: 1,
    status: "CHECKPOINT_COMMITTED",
    operation: command.operation,
    journal_identity_sha256: command.journal_identity_sha256,
    checkpoint_sequence: command.checkpoint_sequence,
    predecessor_checkpoint_identity_sha256:
      command.predecessor_checkpoint_identity_sha256,
    checkpoint_identity_sha256: command.checkpoint_identity_sha256,
  };
}

await asyncCheck("checkpoint no-receipt no-write is authoritatively rejected", async () => {
  const state = checkpointProtocolState();
  await assert.rejects(
    commitDurableCheckpoint(state, async () => undefined, {
      begin_attempt: true,
      read_authoritative_head: async (request) => ({
        schema_version: 1,
        status: "CHECKPOINT_ABSENT",
        journal_identity_sha256: request.journal_identity_sha256,
      }),
    }),
    (error) => error?.code === "CHECKPOINT_NOT_COMMITTED",
  );
  assert.equal(Object.hasOwn(state, "checkpoint"), false);
});

await asyncCheck("checkpoint receipt is exact allowlisted", async () => {
  const state = checkpointProtocolState();
  await assert.rejects(
    commitDurableCheckpoint(
      state,
      async (candidate, command) => ({
        ...exactCheckpointReceipt(command),
        unreviewed_field: candidate.lifecycle_state,
      }),
      {
        begin_attempt: true,
        read_authoritative_head: async (request) => ({
          schema_version: 1,
          status: "CHECKPOINT_ABSENT",
          journal_identity_sha256: request.journal_identity_sha256,
        }),
      },
    ),
    (error) => error?.code === "CHECKPOINT_NOT_COMMITTED",
  );
});

await asyncCheck("checkpoint candidate validation precedes persistence", async () => {
  const state = checkpointProtocolState();
  let checkpointCalls = 0;
  await assert.rejects(
    commitDurableCheckpoint(
      state,
      async () => {
        checkpointCalls += 1;
        return null;
      },
      {
        begin_attempt: true,
        validate_candidate(candidate) {
          assert.equal(candidate.checkpoint.sequence, 0);
          throw new Error("synthetic semantic candidate rejection");
        },
      },
    ),
    /synthetic semantic candidate rejection/u,
  );
  assert.equal(checkpointCalls, 0);
  assert.equal(Object.hasOwn(state, "checkpoint"), false);
});

await asyncCheck("BEGIN checkpoint write-then-throw is never adopted without a direct receipt", async () => {
  const state = checkpointProtocolState();
  let written;
  await assert.rejects(
    commitDurableCheckpoint(
      state,
      async (candidate) => {
        written = structuredClone(candidate);
        throw new Error("synthetic write-then-throw");
      },
      {
        begin_attempt: true,
        read_authoritative_head: async (request) => ({
          schema_version: 1,
          status: "CHECKPOINT_PRESENT",
          journal_identity_sha256: request.journal_identity_sha256,
          checkpoint_sequence: written.checkpoint.sequence,
          predecessor_checkpoint_identity_sha256:
            written.checkpoint.predecessor_checkpoint_identity_sha256,
          checkpoint_identity_sha256:
            written.checkpoint.checkpoint_identity_sha256,
        }),
      },
    ),
    (error) => error?.code === "CHECKPOINT_STATE_UNKNOWN",
  );
  assert.equal(Object.hasOwn(state, "checkpoint"), false);
});

check("evidence schema matches the compact contract", () => {
  const schema = JSON.parse(
    readFileSync(
      path.join(import.meta.dirname, "evidence.schema.json"),
      "utf8",
    ),
  );
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.lifecycle_state.enum, [
    "READY",
    "QUALIFIED",
    "FAILED_RECOVERABLE",
    "FAILED_CLOSED",
  ]);
  assert.deepEqual(schema.required, [
    "schema_version",
    "authority_envelope",
    "authority_envelope_sha256",
    "candidate_identity_sha256",
    "run_id",
    "phase",
    "operation_class",
    "review_approval_sha256",
    "freeze_document_sha256",
    "retained_state_sha256",
    "resource_plan",
    "resource_plan_sha256",
    "operation_reservation",
    "recovery_operation_state",
    "journal_identity_sha256",
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
  assert.equal(
    schema.properties.recovery_operation_state.$ref,
    "#/$defs/recovery_operation_state",
  );
  assert.equal(
    schema.$defs.recovery_operation_state.additionalProperties,
    false,
  );
  assert.deepEqual(schema.$defs.recovery_operation_state.required, [
    "schema_version",
    "recovery_anchor",
    "recovery_grant",
    "qualification_slot_usage",
    "qualification_operation_slots",
    "operation_slots",
  ]);
  assert.equal(
    schema.$defs.qualification_slot_usage.additionalProperties,
    false,
  );
  assert.equal(
    schema.$defs.qualification_slot_usage.properties.requests.maxItems,
    5,
  );
  assert.equal(
    schema.$defs.qualification_slot_usage.properties.mutations.maxItems,
    10,
  );
  assert.equal(schema.$defs.recovery_grant.additionalProperties, false);
  assert.equal(
    schema.$defs.recovery_grant.properties.authorization_class.const,
    "RECOVERY_CONTROLLER",
  );
  assert.deepEqual(
    schema.$defs.qualification_operation_slot.properties.status.enum,
    ["NOT_STARTED", "RESERVED", "RESULT_APPLIED"],
  );
  assert.deepEqual(
    schema.$defs.qualification_operation_slot.required,
    [
      "category",
      "index",
      "operation",
      "resource_key",
      "operation_slot_sha256",
      "reservation_ordinal",
      "predecessor_reservation_proof_sha256",
      "reservation_proof_sha256",
      "status",
      "receipt",
      "receipt_sha256",
    ],
  );
  assert.equal(schema.$defs.qualification_operation_slot.allOf.length, 4);
  assert.equal(schema.$defs.request_counter.properties.limit.const, 16);
  assert.equal(schema.$defs.mutation_counter.properties.limit.const, 15);
  const readyEvidenceContract = schema.allOf.find(
    (contract) => contract.if?.properties?.lifecycle_state?.const === "READY",
  );
  assert.ok(readyEvidenceContract);
  assert.equal(
    readyEvidenceContract.then.properties.budgets.properties.requests.properties.used.const,
    0,
  );
  assert.equal(
    readyEvidenceContract.then.properties.budgets.properties.mutations.properties.used.const,
    0,
  );
  assert.equal(
    readyEvidenceContract.then.properties.recovery_operation_state.properties
      .qualification_slot_usage.properties.requests.maxItems,
    0,
  );
  assert.equal(
    readyEvidenceContract.then.properties.recovery_operation_state.properties
      .qualification_slot_usage.properties.mutations.maxItems,
    0,
  );
  const qualifiedEvidenceContract = schema.allOf.find(
    (contract) => contract.if?.properties?.lifecycle_state?.const === "QUALIFIED",
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.budgets.properties.requests.properties.used.const,
    4,
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.budgets.properties.mutations.properties.used.const,
    9,
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.recovery_operation_state.properties
      .qualification_slot_usage.properties.requests.minItems,
    4,
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.recovery_operation_state.properties
      .qualification_slot_usage.properties.mutations.minItems,
    9,
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.effect_ledger.contains.$ref,
    "#/$defs/terminal_retained_effect",
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.effect_ledger.minContains,
    1,
  );
  assert.equal(
    qualifiedEvidenceContract.then.properties.effect_ledger.maxContains,
    1,
  );
  assert.deepEqual(
    schema.allOf.map(
      (contract) => contract.if?.properties?.lifecycle_state?.const,
    ),
    ["QUALIFIED", "READY", "FAILED_RECOVERABLE", "FAILED_CLOSED"],
  );
  const failedRecoverableEvidenceContract = schema.allOf.find(
    (contract) =>
      contract.if?.properties?.lifecycle_state?.const === "FAILED_RECOVERABLE",
  );
  assert.deepEqual(
    failedRecoverableEvidenceContract.then.properties.authorization_class.enum,
    ["NONE", "LOCAL_QUALIFICATION"],
  );
  assert.equal(
    failedRecoverableEvidenceContract.then.properties.effect_ledger.items
      .properties.cleanup_status.not.const,
    "RETAINED",
  );
  const failedClosedEvidenceContract = schema.allOf.find(
    (contract) =>
      contract.if?.properties?.lifecycle_state?.const === "FAILED_CLOSED",
  );
  assert.equal(
    failedClosedEvidenceContract.then.properties.effect_ledger.items.$ref,
    "#/$defs/terminal_cleaned_effect",
  );
  assert.equal(schema.$defs.effect.allOf.length, 6);
  const effectPairContract = (cleanupStatus) =>
    schema.$defs.effect.allOf.find((contract) => {
      const condition = contract.if?.properties?.cleanup_status;
      return (
        condition?.const === cleanupStatus ||
        condition?.enum?.includes(cleanupStatus)
      );
    });
  assert.equal(
    effectPairContract("RETAINED").then.properties.status.const,
    "APPLIED",
  );
  assert.deepEqual(
    effectPairContract("PENDING").then.properties.status.enum,
    ["INTENT_ONLY", "APPLIED", "UNCERTAIN"],
  );
  assert.deepEqual(
    effectPairContract("INTENT_ONLY").if.properties.cleanup_status.enum,
    ["INTENT_ONLY", "UNCERTAIN", "VERSION_MISMATCH_PRESERVED"],
  );
  assert.deepEqual(
    effectPairContract("INTENT_ONLY").then.properties.status.enum,
    ["APPLIED", "UNCERTAIN"],
  );
  assert.equal(
    effectPairContract("APPLIED").then.properties.status.const,
    "CLEANED",
  );
  assert.equal(
    effectPairContract("VERIFIED").then.properties.status.const,
    "CLEANED",
  );
  assert.equal(
    effectPairContract("NOT_REQUIRED").then.properties.status.const,
    "CLEANED",
  );
  assert.equal(
    effectPairContract("NOT_REQUIRED").then.properties
      .creation_receipt_sha256.type,
    "null",
  );
  assert.equal(
    schema.$defs.terminal_retained_effect.properties.cleanup_status.const,
    "RETAINED",
  );
  assert.deepEqual(
    schema.$defs.terminal_cleaned_effect.properties.cleanup_status.enum,
    ["VERIFIED", "NOT_REQUIRED"],
  );
  assert.equal(
    schema.$defs.qualification_operation_slot.additionalProperties,
    false,
  );
  assert.deepEqual(
    schema.$defs.recovery_operation_slot.properties.status.enum,
    ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN", "RESULT_APPLIED"],
  );
  assert.deepEqual(schema.$defs.owner.required, [
    "candidate_identity_sha256",
    "run_id",
    "phase",
    "operation_class",
    "resource_type",
    "locator_sha256",
    "cleanup_policy",
  ]);
  assert.deepEqual(schema.$defs.effect.required, [
    "sequence",
    "resource_key",
    "effect",
    "status",
    "cleanup_status",
    "creation_operation_slot_sha256",
    "creation_receipt_sha256",
  ]);
  assert.deepEqual(schema.$defs.effect.properties.cleanup_status.enum, [
    "PENDING",
    "NOT_REQUIRED",
    "INTENT_ONLY",
    "APPLIED",
    "UNCERTAIN",
    "VERIFIED",
    "RETAINED",
    "VERSION_MISMATCH_PRESERVED",
  ]);
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
