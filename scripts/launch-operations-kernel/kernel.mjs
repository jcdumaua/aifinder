import {
  canonicalJson,
  isSha256,
  sha256Hex,
} from "./canonical.mjs";
import { isFreshResourcePlanFailureReceipt } from "./fresh-resource-plan-diagnostics.mjs";

export const LIFECYCLE_STATES = Object.freeze([
  "READY",
  "QUALIFYING",
  "QUALIFIED",
  "OFFICIAL_RUNTIME_AUTHORIZED",
  "OFFICIAL_RUNTIME_RUNNING",
  "COMPLETE",
  "FAILED_RECOVERABLE",
  "FAILED_CLOSED",
]);

export const AUTHORIZATION_CLASSES = Object.freeze({
  NONE: "NONE",
  LOCAL_QUALIFICATION: "LOCAL_QUALIFICATION",
  RECOVERY_CONTROLLER: "RECOVERY_CONTROLLER",
  OFFICIAL_RUNTIME: "OFFICIAL_RUNTIME",
});

const TRANSITIONS = new Map([
  ["READY>QUALIFYING", AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION],
  ["READY>FAILED_RECOVERABLE", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  ["QUALIFYING>QUALIFIED", AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION],
  ["QUALIFYING>FAILED_RECOVERABLE", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  ["QUALIFYING>FAILED_CLOSED", AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION],
  ["QUALIFIED>OFFICIAL_RUNTIME_AUTHORIZED", AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME],
  ["QUALIFIED>FAILED_CLOSED", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  [
    "OFFICIAL_RUNTIME_AUTHORIZED>OFFICIAL_RUNTIME_RUNNING",
    AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME,
  ],
  [
    "OFFICIAL_RUNTIME_AUTHORIZED>FAILED_CLOSED",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  ["OFFICIAL_RUNTIME_RUNNING>COMPLETE", AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME],
  [
    "OFFICIAL_RUNTIME_RUNNING>FAILED_RECOVERABLE",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  [
    "OFFICIAL_RUNTIME_RUNNING>FAILED_CLOSED",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  ["FAILED_RECOVERABLE>READY", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  [
    "FAILED_RECOVERABLE>FAILED_RECOVERABLE",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  ["FAILED_RECOVERABLE>FAILED_CLOSED", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
]);

const RESOURCE_TYPES = new Set([
  "DATABASE_ROW",
  "STORAGE_OBJECT",
  "PREVIEW_DEPLOYMENT",
  "GIT_BRANCH",
  "ENVIRONMENT_RECORD",
]);
const ACTIVATION_RESOURCE_TYPES = Object.freeze([
  "GIT_BRANCH",
  "PREVIEW_DEPLOYMENT",
  "ENVIRONMENT_RECORD",
  "DATABASE_ROW",
  "STORAGE_OBJECT",
]);
const ACTIVATION_CURRENT_RETAINED_STATE_ATTESTATION_SHA256 =
  "7e527d6eded9b332c95d9da6e69003fba8184c47200002463f2d4955f169029e";
const SAFE_EMPTY_RETAINED_STATE_ATTESTATION_SHA256 =
  "69cdf8984a060a9027df02919ecd1c04a3e28d188f5528aad4dd096376448db7";
const STORAGE_VERSION_BINDING = "BIND_ON_CREATE";
const CLEANUP_STATUSES = new Set([
  "PENDING",
  "NOT_REQUIRED",
  "INTENT_ONLY",
  "APPLIED",
  "UNCERTAIN",
  "VERIFIED",
  "RETAINED",
  "VERSION_MISMATCH_PRESERVED",
]);
const LOCAL_QUALIFICATION_FAILURE_CODES = new Set([
  "AUTHORITY_VERIFICATION_FAILED",
  "BUDGET_EXHAUSTED",
  "CLEANUP_CHECKPOINT_FAILED",
  "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
  "CLEANUP_FAILED",
  "CLEANUP_VERIFICATION_FAILED",
  "EVIDENCE_DIVERGENCE",
  "EVIDENCE_FINALIZATION_FAILED",
  "OPERATION_RECEIPT_MISMATCH",
  "OPERATION_RESERVATION_CHECKPOINT_FAILED",
  "OWNERSHIP_AMBIGUOUS",
  "OWNERSHIP_UNPROVEN",
  "QUALIFICATION_FAILED",
  "RESOURCE_CREATE_FAILED",
  "RESOURCE_CREATE_UNCONFIRMED",
  "RETAINED_STATE_ATTESTATION_MISMATCH",
  "REVIEWED_CANDIDATE_MISMATCH",
  "RUN_NAMESPACE_INSPECTION_FAILED",
  "RUN_NAMESPACE_NOT_FRESH",
  "STAGING_VERIFICATION_FAILED",
  "STORAGE_VERSION_MISMATCH",
  "TERMINAL_CHECKPOINT_FAILED",
  "TERMINAL_CHECKPOINT_STATE_UNKNOWN",
  "TERMINAL_COMPENSATION_CHECKPOINT_FAILED",
  "TERMINAL_COMPENSATION_DELETE_FAILED",
  "TERMINAL_COMPENSATION_VERIFICATION_FAILED",
]);
const UNKNOWN_QUALIFICATION_FAILURE_CODES = new Set([
  "ATTEMPT_ALREADY_EXISTS",
  "ATTEMPT_BEGIN_STATE_UNKNOWN",
  ...LOCAL_QUALIFICATION_FAILURE_CODES,
]);
const SAFE_PRE_EFFECT_FAILURE_CODES = new Set([
  ...UNKNOWN_QUALIFICATION_FAILURE_CODES,
  "ATTEMPT_BEGIN_FAILED",
  "EVIDENCE_INPUT_UNSAFE",
  "FREEZE_APPROVAL_MISMATCH",
  "LEGACY_CLASSIFICATION_MISMATCH",
  "LEGACY_FREEZE_DOCUMENT_BYTES",
  "LEGACY_FREEZE_DOCUMENT_DRIFT",
  "LEGACY_FREEZE_DOCUMENT_PARSE",
  "LEGACY_FREEZE_METADATA_DRIFT",
  "LEGACY_PRESERVATION_POLICY",
  "QUALIFICATION_AUTHORITY_INVALID",
  "QUALIFICATION_BUDGET_MISMATCH",
  "RETAINED_PREVIEW_POLICY",
  "RETAINED_STATE_ATTESTATION_MISMATCH",
  "RETAINED_STATE_DRIFT",
  "REVIEWED_CANDIDATE_MISMATCH",
]);
const COMPACT_EVIDENCE_LIFECYCLES = new Set([
  "READY",
  "QUALIFIED",
  "FAILED_RECOVERABLE",
  "FAILED_CLOSED",
]);

const SECRET_FIELD =
  /(?:secret|password|passwd|token|cookie|session|credential|private[_-]?key|authorization[_-]?value)/iu;
const SECRET_VALUE_PATTERNS = Object.freeze([
  /\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/iu,
  /\b(?:sk|sbp|service[_-]?role)[-_][A-Za-z0-9._~+/=-]{8,}/iu,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/u,
]);
const CHECKPOINT_STATE_KEYS = Object.freeze([
  "schema_version",
  "candidate_identity_sha256",
  "run_id",
  "phase",
  "operation_class",
  "review_approval_sha256",
  "freeze_document_sha256",
  "retained_state_sha256",
  "authority_envelope",
  "authority_envelope_sha256",
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
  "transition_history",
  "cleanup",
  "recovery",
  "outcome",
]);

export class KernelError extends Error {
  constructor(code) {
    super(code);
    this.name = "KernelError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function validBudget(budget) {
  return (
    exactKeys(budget, ["requests", "mutations"]) &&
    [budget.requests, budget.mutations].every(
      (entry) =>
        exactKeys(entry, ["limit", "used"]) &&
        Number.isSafeInteger(entry.limit) &&
        entry.limit >= 0 &&
        Number.isSafeInteger(entry.used) &&
        entry.used >= 0 &&
        entry.used <= entry.limit,
    )
  );
}

function validQualificationSlotUsageSemantics(state) {
  const usage = state?.recovery_operation_state?.qualification_slot_usage;
  if (
    !exactKeys(usage, ["requests", "mutations"]) ||
    !Array.isArray(usage.requests) ||
    !Array.isArray(usage.mutations) ||
    !Array.isArray(state?.resource_plan) ||
    !Array.isArray(state?.owned_resources) ||
    !Array.isArray(state?.effect_ledger)
  ) {
    return false;
  }
  const used = {
    requests: new Set(usage.requests),
    mutations: new Set(usage.mutations),
  };
  const qualificationSlots =
    state.recovery_operation_state.qualification_operation_slots;
  if (!Array.isArray(qualificationSlots)) return false;
  const slotRecord = (
    category,
    index,
    operation,
    resourceKey = null,
  ) => qualificationSlots.find(
    (slot) =>
      slot.category === category &&
      slot.index === index &&
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
  const slotUsed = (category, index, operation, resourceKey = null) => {
    try {
      return used[category].has(
        deriveOperationSlot({
          operation_reservation: state.operation_reservation,
          category,
          index,
          operation,
          resource_key: resourceKey,
        }).operation_slot_sha256,
      );
    } catch {
      return false;
    }
  };
  const authorityUsed = slotUsed(
    "requests",
    0,
    "VERIFY_AUTHORITY_ENVELOPE",
  );
  const namespaceUsed = slotUsed(
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
  );
  const stagingUsed = slotUsed(
    "requests",
    2,
    "VERIFY_STAGING_READ_ONLY",
  );
  const cleanupVerificationUsed = slotUsed(
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensationVerificationUsed = slotUsed(
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  if (
    (namespaceUsed &&
      (!authorityUsed ||
        slotRecord(
          "requests",
          0,
          "VERIFY_AUTHORITY_ENVELOPE",
        )?.status !== "RESULT_APPLIED")) ||
    (stagingUsed && (!authorityUsed || !namespaceUsed)) ||
    (cleanupVerificationUsed &&
      (!authorityUsed ||
        !namespaceUsed ||
        state.owned_resources.length === 0)) ||
    (compensationVerificationUsed &&
      (!stagingUsed || !cleanupVerificationUsed)) ||
    (state.owned_resources.length > 0 &&
      (!authorityUsed || !namespaceUsed))
  ) {
    return false;
  }
  const creationUsage = state.resource_plan.map((resource, index) =>
    slotUsed(
      "mutations",
      index,
      "QUALIFICATION_CREATE_NEW",
      resource.resource_key,
    ),
  );
  const creationCount = creationUsage.filter(Boolean).length;
  if (
    creationUsage.some(
      (present, index) => present !== (index < creationCount),
    ) ||
    creationCount > state.owned_resources.length ||
    state.owned_resources.length > creationCount + 1
  ) {
    return false;
  }
  for (let index = 0; index < creationCount; index += 1) {
    if (
      slotRecord(
        "requests",
        1,
        "VERIFY_FRESH_RESOURCE_PLAN",
      )?.status !== "RESULT_APPLIED" ||
      creationUsage
        .slice(0, index)
        .some(
          (_present, priorIndex) =>
            slotRecord(
              "mutations",
              priorIndex,
              "QUALIFICATION_CREATE_NEW",
              state.resource_plan[priorIndex].resource_key,
            )?.status !== "RESULT_APPLIED",
        )
    ) {
      return false;
    }
  }
  for (const [index, resource] of state.owned_resources.entries()) {
    const entry = state.effect_ledger.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    if (
      state.resource_plan[index]?.resource_key !== resource.resource_key ||
      !entry ||
      (index < creationCount && !creationUsage[index]) ||
      (index === creationCount &&
        (creationUsage[index] ||
          entry.creation_receipt_sha256 !== null ||
          !["INTENT_ONLY", "CLEANED"].includes(entry.status)))
    ) {
      return false;
    }
  }
  for (const [index, resource] of state.resource_plan.entries()) {
    if (
      slotUsed(
        "mutations",
        5 + index,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      ) &&
      (index >= state.owned_resources.length || !creationUsage[index])
    ) {
      return false;
    }
  }
  if (
    stagingUsed &&
    (creationCount !== state.resource_plan.length ||
      state.resource_plan.some((resource) => {
        const entry = state.effect_ledger.find(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        const planIndex = state.resource_plan.findIndex(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        return (
          !entry ||
          !isSha256(entry.creation_receipt_sha256) ||
          slotRecord(
            "mutations",
            planIndex,
            "QUALIFICATION_CREATE_NEW",
            resource.resource_key,
          )?.status !== "RESULT_APPLIED"
        );
      }))
  ) {
    return false;
  }
  return true;
}

function validReservationBudgetAccounting(state) {
  if (!validBudget(state?.budgets)) return false;
  const reservation = state?.operation_reservation;
  if (
    reservation?.request_limit !== 16 ||
    reservation?.mutation_limit !== 15 ||
    state.budgets.requests.limit !== reservation.request_limit ||
    state.budgets.mutations.limit !== reservation.mutation_limit
  ) {
    return false;
  }
  if (!validQualificationSlotUsageSemantics(state)) return false;
  const slots = state?.recovery_operation_state?.operation_slots;
  const qualification =
    state?.recovery_operation_state?.qualification_slot_usage;
  if (
    !Array.isArray(slots) ||
    !exactKeys(qualification, ["requests", "mutations"]) ||
    !Array.isArray(qualification.requests) ||
    !Array.isArray(qualification.mutations)
  ) {
    return false;
  }
  const progressed = {
    requests: slots.filter(
      (slot) => slot.category === "requests" && slot.status !== "NOT_STARTED",
    ).length,
    mutations: slots.filter(
      (slot) => slot.category === "mutations" && slot.status !== "NOT_STARTED",
    ).length,
  };
  return (
    state.budgets.requests.used ===
      qualification.requests.length + progressed.requests &&
    state.budgets.mutations.used ===
      qualification.mutations.length + progressed.mutations
  );
}

function validateSemanticTransitionHistory(state) {
  const history = state?.transition_history;
  if (
    !Array.isArray(history) ||
    history.length === 0 ||
    history[0].from !== "READY"
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const recoveryReview =
    state?.recovery_operation_state?.recovery_grant?.review_sha256;
  for (const [index, entry] of history.entries()) {
    const edge = `${entry.from}>${entry.to}`;
    const expectedClass = TRANSITIONS.get(edge);
    const localQualificationFailure =
      edge === "QUALIFYING>FAILED_RECOVERABLE" &&
      entry.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION;
    const expectedReview =
      entry.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION
        ? state.review_approval_sha256
        : entry.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER
          ? recoveryReview
          : null;
    if (
      (expectedClass !== entry.authorization_class &&
        !localQualificationFailure) ||
      (index > 0 && history[index - 1].to !== entry.from) ||
      !isSha256(expectedReview) ||
      entry.review_sha256 !== expectedReview
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  if (history.at(-1).to !== state.lifecycle_state) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return history.at(-1);
}

function validateRecoveryAuthorizationProvenance(state, finalTransition) {
  const protocol = state?.recovery_operation_state;
  const progressed = protocol?.operation_slots?.some(
    (slot) => slot.status !== "NOT_STARTED",
  );
  const granted =
    protocol?.recovery_anchor !== null ||
    protocol?.recovery_grant !== null ||
    progressed === true;
  if (!granted) {
    if (
      protocol?.recovery_anchor !== null ||
      protocol?.recovery_grant !== null ||
      state.authorization_class !==
        AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION ||
      finalTransition?.authorization_class !==
        AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION ||
      finalTransition?.review_sha256 !== state.review_approval_sha256
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    return true;
  }
  const grant = protocol?.recovery_grant;
  if (
    protocol?.recovery_anchor === null ||
    grant === null ||
    state.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
    finalTransition?.authorization_class !==
      AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
    finalTransition?.review_sha256 !== grant?.review_sha256
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return true;
}

function failClosed(state, code) {
  if (["COMPLETE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
    return {
      ...structuredClone(state),
      outcome: { code: "TERMINAL_STATE", successful: false },
    };
  }
  return {
    ...structuredClone(state),
    lifecycle_state: "FAILED_CLOSED",
    outcome: { code, successful: false },
  };
}

function validAuthorization(authorization) {
  return (
    exactKeys(authorization, [
      "schema_version",
      "authorization_class",
      "candidate_identity_sha256",
      "review_sha256",
    ]) &&
    authorization.schema_version === 1 &&
    Object.values(AUTHORIZATION_CLASSES).includes(authorization.authorization_class) &&
    authorization.authorization_class !== AUTHORIZATION_CLASSES.NONE &&
    isSha256(authorization.candidate_identity_sha256) &&
    isSha256(authorization.review_sha256)
  );
}

export function createKernelState({
  candidate_identity_sha256,
  budgets,
  run_id,
  phase,
  operation_class,
  review_approval_sha256,
  freeze_document_sha256,
  retained_state_sha256,
}) {
  if (!isSha256(candidate_identity_sha256)) {
    throw new KernelError("CANDIDATE_IDENTITY");
  }
  if (!validBudget(budgets)) throw new KernelError("BUDGET_SHAPE");
  return {
    schema_version: 1,
    candidate_identity_sha256,
    ...(run_id === undefined
      ? {}
      : {
          run_id,
          phase,
          operation_class,
          review_approval_sha256,
          freeze_document_sha256,
          retained_state_sha256,
        }),
    lifecycle_state: "READY",
    authorization_class: AUTHORIZATION_CLASSES.NONE,
    budgets: structuredClone(budgets),
    owned_resources: [],
    effect_ledger: [],
    transition_history: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
  };
}

export function applyLifecycleTransition(state, target, authorization) {
  if (!state || !LIFECYCLE_STATES.includes(state.lifecycle_state)) {
    throw new KernelError("LIFECYCLE_STATE");
  }
  if (["COMPLETE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
    return failClosed(state, "TERMINAL_STATE");
  }
  if (!LIFECYCLE_STATES.includes(target)) {
    return failClosed(state, "TRANSITION_DENIED");
  }
  if (!validAuthorization(authorization)) {
    return failClosed(state, "AUTHORIZATION_INVALID");
  }
  if (
    state.candidate_identity_sha256 !== authorization.candidate_identity_sha256
  ) {
    return failClosed(state, "CANDIDATE_MISMATCH");
  }
  const required = TRANSITIONS.get(`${state.lifecycle_state}>${target}`);
  if (!required) return failClosed(state, "TRANSITION_DENIED");
  if (authorization.authorization_class !== required) {
    return failClosed(state, "AUTHORIZATION_CLASS_MISMATCH");
  }
  return {
    ...structuredClone(state),
    lifecycle_state: target,
    authorization_class: authorization.authorization_class,
    transition_history: [
      ...(state.transition_history ?? []),
      {
        from: state.lifecycle_state,
        to: target,
        authorization_class: authorization.authorization_class,
        review_sha256: authorization.review_sha256,
      },
    ],
    outcome: { code: target, successful: true },
  };
}

export function consumeBudget(budgets, category, amount = 1) {
  if (!validBudget(budgets)) throw new KernelError("BUDGET_SHAPE");
  if (!["requests", "mutations"].includes(category)) {
    throw new KernelError("BUDGET_CATEGORY");
  }
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new KernelError("BUDGET_AMOUNT");
  }
  const result = structuredClone(budgets);
  if (result[category].used + amount > result[category].limit) {
    throw new KernelError("BUDGET_EXHAUSTED");
  }
  result[category].used += amount;
  return result;
}

export function deriveResourcePlanSha256(resources) {
  if (!Array.isArray(resources)) throw new KernelError("RESOURCE_PLAN_SHAPE");
  return sha256Hex(canonicalJson(resources));
}

export function deriveAuthorityEnvelopeSha256(envelope) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw new KernelError("AUTHORITY_ENVELOPE_SHAPE");
  }
  return sha256Hex(canonicalJson(envelope));
}

export function createOperationReservation(authorityEnvelopeSha256) {
  if (!isSha256(authorityEnvelopeSha256)) {
    throw new KernelError("OPERATION_RESERVATION_SHAPE");
  }
  const payload = {
    schema_version: 1,
    authority_envelope_sha256: authorityEnvelopeSha256,
    request_limit: 16,
    mutation_limit: 15,
  };
  return {
    ...payload,
    identity_sha256: sha256Hex(canonicalJson(payload)),
  };
}

export function deriveOperationSlot({
  operation_reservation,
  category,
  index,
  operation,
  resource_key = null,
}) {
  const expectedReservation = createOperationReservation(
    operation_reservation?.authority_envelope_sha256,
  );
  if (
    !exactKeys(operation_reservation, [
      "schema_version",
      "authority_envelope_sha256",
      "request_limit",
      "mutation_limit",
      "identity_sha256",
    ]) ||
    canonicalJson(operation_reservation) !== canonicalJson(expectedReservation) ||
    !["requests", "mutations"].includes(category) ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= operation_reservation[category === "requests" ? "request_limit" : "mutation_limit"] ||
    typeof operation !== "string" ||
    operation.length < 1 ||
    (resource_key !== null && (typeof resource_key !== "string" || resource_key.length < 1))
  ) {
    throw new KernelError("OPERATION_SLOT_SHAPE");
  }
  const payload = {
    reservation_identity_sha256: operation_reservation.identity_sha256,
    category,
    index,
    operation,
    resource_key,
  };
  return {
    ...payload,
    operation_slot_sha256: sha256Hex(canonicalJson(payload)),
  };
}

export function deriveQualificationReservationRootSha256({
  journal_identity_sha256,
  operation_reservation_identity_sha256,
}) {
  if (
    !isSha256(journal_identity_sha256) ||
    !isSha256(operation_reservation_identity_sha256)
  ) {
    throw new KernelError("QUALIFICATION_RESERVATION_PROOF_SHAPE");
  }
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_QUALIFICATION_RESERVATION_ROOT",
    journal_identity_sha256,
    operation_reservation_identity_sha256,
  }));
}

export function deriveQualificationReservationProofSha256({
  journal_identity_sha256,
  operation_reservation_identity_sha256,
  reservation_ordinal,
  predecessor_reservation_proof_sha256,
  operation_slot_sha256,
}) {
  if (
    !isSha256(journal_identity_sha256) ||
    !isSha256(operation_reservation_identity_sha256) ||
    !Number.isSafeInteger(reservation_ordinal) ||
    reservation_ordinal < 0 ||
    !isSha256(predecessor_reservation_proof_sha256) ||
    !isSha256(operation_slot_sha256)
  ) {
    throw new KernelError("QUALIFICATION_RESERVATION_PROOF_SHAPE");
  }
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_QUALIFICATION_RESERVATION_PROOF",
    journal_identity_sha256,
    operation_reservation_identity_sha256,
    reservation_ordinal,
    predecessor_reservation_proof_sha256,
    operation_slot_sha256,
  }));
}

function recoveryOperationSlotRecord(
  operationReservation,
  category,
  index,
  operation,
  resourceKey = null,
) {
  const slot = deriveOperationSlot({
    operation_reservation: operationReservation,
    category,
    index,
    operation,
    resource_key: resourceKey,
  });
  return {
    category,
    index,
    operation,
    resource_key: resourceKey,
    operation_slot_sha256: slot.operation_slot_sha256,
    operation_binding_sha256: null,
    status: "NOT_STARTED",
    receipt: null,
    receipt_sha256: null,
  };
}

function qualificationOperationSlotRecord(
  operationReservation,
  category,
  index,
  operation,
  resourceKey = null,
) {
  const slot = deriveOperationSlot({
    operation_reservation: operationReservation,
    category,
    index,
    operation,
    resource_key: resourceKey,
  });
  return {
    category,
    index,
    operation,
    resource_key: resourceKey,
    operation_slot_sha256: slot.operation_slot_sha256,
    reservation_ordinal: null,
    predecessor_reservation_proof_sha256: null,
    reservation_proof_sha256: null,
    status: "NOT_STARTED",
    receipt: null,
    receipt_sha256: null,
  };
}

function createQualificationOperationSlots(operationReservation, resourcePlan) {
  return [
    qualificationOperationSlotRecord(
      operationReservation,
      "requests",
      0,
      "VERIFY_AUTHORITY_ENVELOPE",
    ),
    qualificationOperationSlotRecord(
      operationReservation,
      "requests",
      1,
      "VERIFY_FRESH_RESOURCE_PLAN",
    ),
    qualificationOperationSlotRecord(
      operationReservation,
      "requests",
      2,
      "VERIFY_STAGING_READ_ONLY",
    ),
    qualificationOperationSlotRecord(
      operationReservation,
      "requests",
      3,
      "QUALIFICATION_VERIFY_CLEANUP",
    ),
    qualificationOperationSlotRecord(
      operationReservation,
      "requests",
      4,
      "QUALIFICATION_VERIFY_CLEANUP",
    ),
    ...resourcePlan.flatMap((resource, index) => [
      qualificationOperationSlotRecord(
        operationReservation,
        "mutations",
        index,
        "QUALIFICATION_CREATE_NEW",
        resource.resource_key,
      ),
      qualificationOperationSlotRecord(
        operationReservation,
        "mutations",
        5 + index,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      ),
    ]),
  ];
}

export function createRecoveryOperationState(operationReservation, resourcePlan) {
  if (!Array.isArray(resourcePlan)) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  return {
    schema_version: 1,
    recovery_anchor: null,
    recovery_grant: null,
    qualification_slot_usage: {
      requests: [],
      mutations: [],
    },
    qualification_operation_slots: createQualificationOperationSlots(
      operationReservation,
      resourcePlan,
    ),
    operation_slots: [
      recoveryOperationSlotRecord(
        operationReservation,
        "requests",
        5,
        "VERIFY_RECOVERY_AUTHORITY",
      ),
      ...resourcePlan.flatMap((resource, index) => {
        if (typeof resource?.resource_key !== "string" || resource.resource_key.length < 1) {
          throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
        }
        return [
          recoveryOperationSlotRecord(
            operationReservation,
            "requests",
            6 + index * 2,
            "RECOVERY_INSPECT",
            resource.resource_key,
          ),
          recoveryOperationSlotRecord(
            operationReservation,
            "requests",
            7 + index * 2,
            "RECOVERY_VERIFY_ABSENT",
            resource.resource_key,
          ),
          recoveryOperationSlotRecord(
            operationReservation,
            "mutations",
            10 + index,
            "RECOVERY_DELETE_EXACT",
            resource.resource_key,
          ),
        ];
      }),
    ],
  };
}

function qualificationReservationExecutionPaths(state, slots) {
  const find = (category, index, operation, resourceKey = null) =>
    slots.find(
      (slot) =>
        slot.category === category &&
        slot.index === index &&
        slot.operation === operation &&
        slot.resource_key === resourceKey,
    )?.operation_slot_sha256;
  const authority = find("requests", 0, "VERIFY_AUTHORITY_ENVELOPE");
  const namespace = find("requests", 1, "VERIFY_FRESH_RESOURCE_PLAN");
  const staging = find("requests", 2, "VERIFY_STAGING_READ_ONLY");
  const successVerifier = find(
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensationVerifier = find(
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const creates = state.resource_plan.map((resource, index) =>
    find(
      "mutations",
      index,
      "QUALIFICATION_CREATE_NEW",
      resource.resource_key,
    ),
  );
  const deletes = state.resource_plan.map((resource, index) =>
    find(
      "mutations",
      5 + index,
      "QUALIFICATION_DELETE_EXACT",
      resource.resource_key,
    ),
  );
  if (
    [
      authority,
      namespace,
      staging,
      successVerifier,
      compensationVerifier,
      ...creates,
      ...deletes,
    ].some((identity) => !isSha256(identity))
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const paths = [];
  paths.push([authority, namespace, successVerifier]);
  for (let index = 0; index < creates.length; index += 1) {
    const creationPrefix = [authority, namespace, ...creates.slice(0, index + 1)];
    paths.push([
      ...creationPrefix,
      ...deletes.slice(0, index + 1).reverse(),
      successVerifier,
    ]);
    paths.push([
      ...creationPrefix,
      ...deletes.slice(0, index).reverse(),
      successVerifier,
    ]);
  }
  const fullPrefix = [authority, namespace, ...creates, staging];
  paths.push([...fullPrefix, ...[...deletes].reverse(), successVerifier]);
  const retainedIndex = state.resource_plan.findIndex(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  if (retainedIndex >= 0) {
    const reverseDeletes = [...deletes].reverse();
    const successDeletes = deletes.filter(
      (_identity, index) => index !== retainedIndex,
    ).reverse();
    const successPath = [
      ...fullPrefix,
      ...successDeletes,
      successVerifier,
    ];
    const abortedSuccessPath = [
      ...fullPrefix,
      ...successDeletes,
      deletes[retainedIndex],
      successVerifier,
    ];
    paths.push(successPath);
    paths.push(abortedSuccessPath);
    for (
      let completedSuccessDeletes = 1;
      completedSuccessDeletes < successDeletes.length;
      completedSuccessDeletes += 1
    ) {
      const completedPrefix = successDeletes.slice(0, completedSuccessDeletes);
      const completed = new Set(completedPrefix);
      paths.push([
        ...fullPrefix,
        ...completedPrefix,
        ...reverseDeletes.filter((identity) => !completed.has(identity)),
        successVerifier,
      ]);
    }
    paths.push([
      ...successPath,
      deletes[retainedIndex],
      compensationVerifier,
    ]);
  }
  return paths;
}

function validateQualificationReservationProofChain(state, slots) {
  const progressed = slots
    .filter((slot) => slot.status !== "NOT_STARTED")
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  const root = deriveQualificationReservationRootSha256({
    journal_identity_sha256: state.journal_identity_sha256,
    operation_reservation_identity_sha256:
      state.operation_reservation.identity_sha256,
  });
  let predecessor = root;
  for (const [ordinal, slot] of progressed.entries()) {
    const expectedProof = deriveQualificationReservationProofSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      operation_reservation_identity_sha256:
        state.operation_reservation.identity_sha256,
      reservation_ordinal: ordinal,
      predecessor_reservation_proof_sha256: predecessor,
      operation_slot_sha256: slot.operation_slot_sha256,
    });
    if (
      slot.reservation_ordinal !== ordinal ||
      slot.predecessor_reservation_proof_sha256 !== predecessor ||
      slot.reservation_proof_sha256 !== expectedProof
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    predecessor = expectedProof;
  }
  const observed = progressed.map((slot) => slot.operation_slot_sha256);
  if (
    !qualificationReservationExecutionPaths(state, slots).some(
      (path) =>
        observed.length <= path.length &&
        observed.every((identity, index) => identity === path[index]),
    )
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  return true;
}

export function deriveRecoveryOperationBindingSha256({
  journal_identity_sha256,
  recovery_anchor_checkpoint_identity_sha256,
  operation_slot_sha256,
  prerequisite_receipt_sha256 = null,
}) {
  if (
    !isSha256(journal_identity_sha256) ||
    !isSha256(recovery_anchor_checkpoint_identity_sha256) ||
    !isSha256(operation_slot_sha256) ||
    (prerequisite_receipt_sha256 !== null &&
      !isSha256(prerequisite_receipt_sha256))
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const binding = {
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_RECOVERY_OPERATION_BINDING",
    journal_identity_sha256,
    recovery_anchor_checkpoint_identity_sha256,
    operation_slot_sha256,
    ...(prerequisite_receipt_sha256 === null
      ? {}
      : { prerequisite_receipt_sha256 }),
  };
  return sha256Hex(canonicalJson(binding));
}

export function validateRecoveryOperationState(state) {
  const protocol = state?.recovery_operation_state;
  if (
    !exactKeys(protocol, [
      "schema_version",
      "recovery_anchor",
      "recovery_grant",
      "qualification_slot_usage",
      "qualification_operation_slots",
      "operation_slots",
    ]) ||
    protocol.schema_version !== 1 ||
    !Array.isArray(protocol.operation_slots)
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const qualification = protocol.qualification_slot_usage;
  if (
    !exactKeys(qualification, ["requests", "mutations"]) ||
    !Array.isArray(qualification.requests) ||
    !Array.isArray(qualification.mutations)
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const qualificationSlots = {
    requests: [
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "requests",
        index: 0,
        operation: "VERIFY_AUTHORITY_ENVELOPE",
      }),
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "requests",
        index: 1,
        operation: "VERIFY_FRESH_RESOURCE_PLAN",
      }),
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "requests",
        index: 2,
        operation: "VERIFY_STAGING_READ_ONLY",
      }),
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "requests",
        index: 3,
        operation: "QUALIFICATION_VERIFY_CLEANUP",
      }),
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "requests",
        index: 4,
        operation: "QUALIFICATION_VERIFY_CLEANUP",
      }),
    ],
    mutations: state.resource_plan.flatMap((resource, index) => [
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "mutations",
        index,
        operation: "QUALIFICATION_CREATE_NEW",
        resource_key: resource.resource_key,
      }),
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "mutations",
        index: 5 + index,
        operation: "QUALIFICATION_DELETE_EXACT",
        resource_key: resource.resource_key,
      }),
    ]),
  };
  for (const category of ["requests", "mutations"]) {
    const allowed = new Set(
      qualificationSlots[category].map(
        (slot) => slot.operation_slot_sha256,
      ),
    );
    if (
      new Set(qualification[category]).size !== qualification[category].length ||
      qualification[category].some(
        (identity) => !isSha256(identity) || !allowed.has(identity),
      )
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
  }
  const expectedQualification = createQualificationOperationSlots(
    state.operation_reservation,
    state.resource_plan,
  );
  if (
    !Array.isArray(protocol.qualification_operation_slots) ||
    protocol.qualification_operation_slots.length !==
      expectedQualification.length
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  for (const [index, slot] of
    protocol.qualification_operation_slots.entries()) {
    const descriptor = expectedQualification[index];
    const used = qualification[slot.category]?.includes(
      slot.operation_slot_sha256,
    );
    if (
      !exactKeys(slot, [
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
      ]) ||
      slot.category !== descriptor.category ||
      slot.index !== descriptor.index ||
      slot.operation !== descriptor.operation ||
      slot.resource_key !== descriptor.resource_key ||
      slot.operation_slot_sha256 !== descriptor.operation_slot_sha256 ||
      !["NOT_STARTED", "RESERVED", "RESULT_APPLIED"].includes(slot.status) ||
      (slot.status === "NOT_STARTED") !== !used
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    const reservationProofNull =
      slot.reservation_ordinal === null &&
      slot.predecessor_reservation_proof_sha256 === null &&
      slot.reservation_proof_sha256 === null;
    const reservationProofExact =
      Number.isSafeInteger(slot.reservation_ordinal) &&
      slot.reservation_ordinal >= 0 &&
      isSha256(slot.predecessor_reservation_proof_sha256) &&
      isSha256(slot.reservation_proof_sha256);
    if (
      (slot.status === "NOT_STARTED" && !reservationProofNull) ||
      (slot.status !== "NOT_STARTED" && !reservationProofExact)
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    if (slot.status !== "RESULT_APPLIED") {
      if (slot.receipt !== null || slot.receipt_sha256 !== null) {
        throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
      }
      continue;
    }
    if (
      !slot.receipt ||
      typeof slot.receipt !== "object" ||
      Array.isArray(slot.receipt) ||
      slot.receipt.reservation_proof_sha256 !==
        slot.reservation_proof_sha256 ||
      !isSha256(slot.receipt_sha256) ||
      sha256Hex(canonicalJson(slot.receipt)) !== slot.receipt_sha256
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    assertEvidenceSafe(slot.receipt);
  }
  validateQualificationReservationProofChain(
    state,
    protocol.qualification_operation_slots,
  );
  const expected = createRecoveryOperationState(
    state.operation_reservation,
    state.resource_plan,
  ).operation_slots;
  if (protocol.operation_slots.length !== expected.length) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const anchor = protocol.recovery_anchor;
  if (
    anchor !== null &&
    (!exactKeys(anchor, [
      "checkpoint_identity_sha256",
      "checkpoint_sequence",
      "predecessor_checkpoint_identity_sha256",
    ]) ||
      !isSha256(anchor.checkpoint_identity_sha256) ||
      !Number.isSafeInteger(anchor.checkpoint_sequence) ||
      anchor.checkpoint_sequence < 0 ||
      !isSha256(anchor.predecessor_checkpoint_identity_sha256) ||
      (state.checkpoint && anchor.checkpoint_sequence > state.checkpoint.sequence))
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  const grant = protocol.recovery_grant;
  if (
    grant !== null &&
    (!exactKeys(grant, [
      "authorization_class",
      "authority_receipt_sha256",
      "recovery_anchor_checkpoint_identity_sha256",
      "review_sha256",
    ]) ||
      grant.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
      !isSha256(grant.authority_receipt_sha256) ||
      !isSha256(grant.recovery_anchor_checkpoint_identity_sha256) ||
      !isSha256(grant.review_sha256))
  ) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  if ((anchor === null) !== (grant === null)) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  for (const [index, slot] of protocol.operation_slots.entries()) {
    const descriptor = expected[index];
    if (
      !exactKeys(slot, [
        "category",
        "index",
        "operation",
        "resource_key",
        "operation_slot_sha256",
        "operation_binding_sha256",
        "status",
        "receipt",
        "receipt_sha256",
      ]) ||
      slot.category !== descriptor.category ||
      slot.index !== descriptor.index ||
      slot.operation !== descriptor.operation ||
      slot.resource_key !== descriptor.resource_key ||
      slot.operation_slot_sha256 !== descriptor.operation_slot_sha256 ||
      !["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN", "RESULT_APPLIED"].includes(
        slot.status,
      )
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    if (slot.status === "NOT_STARTED") {
      if (
        slot.operation_binding_sha256 !== null ||
        slot.receipt !== null ||
        slot.receipt_sha256 !== null
      ) {
        throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
      }
      continue;
    }
    const prerequisiteReceiptSha256 =
      recoveryOperationPrerequisiteReceiptSha256(state, slot);
    if (
      anchor === null ||
      (slot.operation !== "VERIFY_RECOVERY_AUTHORITY" &&
        !isSha256(prerequisiteReceiptSha256)) ||
      !isSha256(slot.operation_binding_sha256) ||
      deriveRecoveryOperationBindingSha256({
        journal_identity_sha256: state.journal_identity_sha256,
        recovery_anchor_checkpoint_identity_sha256:
          anchor.checkpoint_identity_sha256,
        operation_slot_sha256: slot.operation_slot_sha256,
        prerequisite_receipt_sha256: prerequisiteReceiptSha256,
      }) !== slot.operation_binding_sha256
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    if (slot.status === "RESERVED") {
      if (slot.receipt !== null || slot.receipt_sha256 !== null) {
        throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
      }
      continue;
    }
    if (
      !slot.receipt ||
      typeof slot.receipt !== "object" ||
      Array.isArray(slot.receipt) ||
      !isSha256(slot.receipt_sha256) ||
      sha256Hex(canonicalJson(slot.receipt)) !== slot.receipt_sha256
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
    assertEvidenceSafe(slot.receipt);
    if (
      slot.operation !== "VERIFY_RECOVERY_AUTHORITY" &&
      !exactRecoveryOperationReceipt(state, slot)
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
  }
  validateRecoveryFinitePrefixState(state);
  const progressed = protocol.operation_slots.some(
    (slot) => slot.status !== "NOT_STARTED",
  );
  if ((grant !== null) !== progressed) {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  }
  if (progressed) {
    const authoritySlot = protocol.operation_slots.find(
      (slot) =>
        slot.category === "requests" &&
        slot.index === 5 &&
        slot.operation === "VERIFY_RECOVERY_AUTHORITY" &&
        slot.resource_key === null,
    );
    const finalProvenance = state.transition_history?.at(-1);
    if (
      grant === null ||
      anchor === null ||
      state.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
      state.review_approval_sha256 !== grant.review_sha256 ||
      authoritySlot?.status !== "RESULT_APPLIED" ||
      authoritySlot.receipt_sha256 !== grant.authority_receipt_sha256 ||
      authoritySlot.receipt?.approval_digest_sha256 !== grant.review_sha256 ||
      grant.recovery_anchor_checkpoint_identity_sha256 !==
        anchor.checkpoint_identity_sha256 ||
      !finalProvenance ||
      finalProvenance.to !== state.lifecycle_state ||
      finalProvenance.authorization_class !== grant.authorization_class ||
      finalProvenance.review_sha256 !== grant.review_sha256 ||
      (state.lifecycle_state === "READY" &&
        finalProvenance.from !== "FAILED_RECOVERABLE")
    ) {
      throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
    }
  }
  return true;
}

export function validateGrantedRecoveryJournal(state) {
  try {
    validateRecoveryOperationState(state);
  } catch {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const protocol = state.recovery_operation_state;
  const anchor = protocol.recovery_anchor;
  const grant = protocol.recovery_grant;
  const authoritySlot = protocol.operation_slots.find(
    (slot) =>
      slot.category === "requests" &&
      slot.index === 5 &&
      slot.operation === "VERIFY_RECOVERY_AUTHORITY" &&
      slot.resource_key === null,
  );
  const receipt = authoritySlot?.receipt;
  let finalProvenance;
  try {
    finalProvenance = validateSemanticTransitionHistory(state);
  } catch {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  if (
    anchor === null ||
    grant === null ||
    !["FAILED_RECOVERABLE", "READY"].includes(state.lifecycle_state) ||
    state.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
    state.review_approval_sha256 !== grant.review_sha256 ||
    !validReservationBudgetAccounting(state) ||
    !state.checkpoint ||
    anchor.checkpoint_sequence >= state.checkpoint.sequence ||
    authoritySlot?.status !== "RESULT_APPLIED" ||
    !exactKeys(receipt, [
      "status",
      "candidate_identity_sha256",
      "run_id",
      "phase",
      "operation_class",
      "approval_digest_sha256",
      "freeze_document_sha256",
      "retained_state_sha256",
      "authority_envelope_sha256",
      "resource_plan_sha256",
      "journal_identity_sha256",
      "operation_reservation_identity_sha256",
      "recovery_anchor_checkpoint_identity_sha256",
      "recovery_anchor_checkpoint_sequence",
      "recovery_anchor_predecessor_identity_sha256",
      "operation_binding_sha256",
      "operation_slot_sha256",
    ]) ||
    receipt.status !== "VERIFIED_REVIEWED_RECOVERY_AUTHORITY" ||
    receipt.candidate_identity_sha256 !== state.candidate_identity_sha256 ||
    receipt.run_id !== state.run_id ||
    receipt.phase !== state.phase ||
    receipt.operation_class !== state.operation_class ||
    receipt.approval_digest_sha256 !== state.review_approval_sha256 ||
    receipt.approval_digest_sha256 !== grant.review_sha256 ||
    receipt.freeze_document_sha256 !== state.freeze_document_sha256 ||
    receipt.retained_state_sha256 !== state.retained_state_sha256 ||
    receipt.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
    receipt.resource_plan_sha256 !== state.resource_plan_sha256 ||
    receipt.journal_identity_sha256 !== state.journal_identity_sha256 ||
    receipt.operation_reservation_identity_sha256 !==
      state.operation_reservation.identity_sha256 ||
    receipt.recovery_anchor_checkpoint_identity_sha256 !==
      anchor.checkpoint_identity_sha256 ||
    receipt.recovery_anchor_checkpoint_sequence !==
      anchor.checkpoint_sequence ||
    receipt.recovery_anchor_predecessor_identity_sha256 !==
      anchor.predecessor_checkpoint_identity_sha256 ||
    receipt.operation_binding_sha256 !==
      authoritySlot.operation_binding_sha256 ||
    receipt.operation_slot_sha256 !== authoritySlot.operation_slot_sha256 ||
    authoritySlot.receipt_sha256 !== sha256Hex(canonicalJson(receipt)) ||
    grant.authority_receipt_sha256 !== authoritySlot.receipt_sha256 ||
    grant.recovery_anchor_checkpoint_identity_sha256 !==
      anchor.checkpoint_identity_sha256 ||
    grant.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
    finalProvenance.authorization_class !== grant.authorization_class ||
    finalProvenance.review_sha256 !== grant.review_sha256 ||
    finalProvenance.to !== state.lifecycle_state ||
    (state.lifecycle_state === "READY" &&
      finalProvenance.from !== "FAILED_RECOVERABLE")
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return true;
}

export function deriveRecoveryCapabilitySha256(state) {
  validateCheckpointProtocol(state);
  const grant = state.recovery_operation_state?.recovery_grant;
  if (
    grant === null ||
    state.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER
  ) {
    throw new KernelError("RECOVERY_CAPABILITY_REQUIRED");
  }
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_EXACT_RECOVERY_CAPABILITY",
    journal_identity_sha256: state.journal_identity_sha256,
    checkpoint_identity_sha256: state.checkpoint.checkpoint_identity_sha256,
    authority_receipt_sha256: grant.authority_receipt_sha256,
    review_sha256: grant.review_sha256,
  }));
}

export function deriveJournalIdentitySha256({
  authority_envelope_sha256,
  resource_plan_sha256,
  ordered_resource_keys,
  operation_reservation_identity_sha256,
}) {
  if (
    !isSha256(authority_envelope_sha256) ||
    !isSha256(resource_plan_sha256) ||
    !Array.isArray(ordered_resource_keys) ||
    ordered_resource_keys.some((key) => typeof key !== "string" || key.length < 1) ||
    new Set(ordered_resource_keys).size !== ordered_resource_keys.length ||
    !isSha256(operation_reservation_identity_sha256)
  ) {
    throw new KernelError("JOURNAL_IDENTITY_SHAPE");
  }
  return sha256Hex(canonicalJson({
    authority_envelope_sha256,
    resource_plan_sha256,
    ordered_resource_keys,
    operation_reservation_identity_sha256,
  }));
}

export function deriveCheckpointRootSha256(journalIdentitySha256) {
  if (!isSha256(journalIdentitySha256)) {
    throw new KernelError("CHECKPOINT_IDENTITY_SHAPE");
  }
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_KERNEL_CHECKPOINT_ROOT",
    journal_identity_sha256: journalIdentitySha256,
  }));
}

function checkpointStatePayload(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new KernelError("CHECKPOINT_STATE_SHAPE");
  }
  const { checkpoint: ignored, ...payload } = structuredClone(state);
  const expected = [...CHECKPOINT_STATE_KEYS];
  if (Object.hasOwn(payload, "final_evidence_identity_sha256")) {
    expected.push("final_evidence_identity_sha256");
  }
  if (!exactKeys(payload, expected)) {
    throw new KernelError("CHECKPOINT_STATE_SHAPE");
  }
  if (
    payload.schema_version !== 1 ||
    !Array.isArray(payload.transition_history) ||
    payload.transition_history.some(
      (entry) =>
        !exactKeys(entry, [
          "from",
          "to",
          "authorization_class",
          "review_sha256",
        ]) ||
        !LIFECYCLE_STATES.includes(entry.from) ||
        !LIFECYCLE_STATES.includes(entry.to) ||
        !Object.values(AUTHORIZATION_CLASSES).includes(entry.authorization_class) ||
        !isSha256(entry.review_sha256),
    ) ||
    (Object.hasOwn(payload, "final_evidence_identity_sha256") &&
      !isSha256(payload.final_evidence_identity_sha256))
  ) {
    throw new KernelError("CHECKPOINT_STATE_SHAPE");
  }
  try {
    validateRecoveryOperationState(payload);
  } catch {
    throw new KernelError("CHECKPOINT_STATE_SHAPE");
  }
  return payload;
}

export function deriveCheckpointIdentitySha256({
  state,
  sequence,
  predecessor_checkpoint_identity_sha256,
}) {
  if (
    !Number.isSafeInteger(sequence) ||
    sequence < 0 ||
    !isSha256(predecessor_checkpoint_identity_sha256) ||
    !isSha256(state?.journal_identity_sha256)
  ) {
    throw new KernelError("CHECKPOINT_IDENTITY_SHAPE");
  }
  return sha256Hex(canonicalJson({
    schema_version: 1,
    journal_identity_sha256: state.journal_identity_sha256,
    sequence,
    predecessor_checkpoint_identity_sha256,
    checkpoint_state: checkpointStatePayload(state),
  }));
}

function validCheckpointMetadata(checkpoint) {
  return (
    exactKeys(checkpoint, [
      "schema_version",
      "sequence",
      "predecessor_checkpoint_identity_sha256",
      "checkpoint_identity_sha256",
    ]) &&
    checkpoint.schema_version === 1 &&
    Number.isSafeInteger(checkpoint.sequence) &&
    checkpoint.sequence >= 0 &&
    isSha256(checkpoint.predecessor_checkpoint_identity_sha256) &&
    isSha256(checkpoint.checkpoint_identity_sha256)
  );
}

export function validateCheckpointProtocol(state) {
  if (!validCheckpointMetadata(state?.checkpoint)) {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  const checkpoint = state.checkpoint;
  if (
    (checkpoint.sequence === 0 &&
      checkpoint.predecessor_checkpoint_identity_sha256 !==
        deriveCheckpointRootSha256(state.journal_identity_sha256)) ||
    deriveCheckpointIdentitySha256({
      state,
      sequence: checkpoint.sequence,
      predecessor_checkpoint_identity_sha256:
        checkpoint.predecessor_checkpoint_identity_sha256,
    }) !== checkpoint.checkpoint_identity_sha256
  ) {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  try {
    validateRecoveryOperationState(state);
  } catch {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  return true;
}

export async function commitDurableCheckpoint(
  state,
  checkpointAdapter,
  {
    begin_attempt = false,
    read_authoritative_head,
    validate_candidate,
  } = {},
) {
  if (typeof checkpointAdapter !== "function") {
    throw new KernelError("CHECKPOINT_ADAPTER");
  }
  const prior = state?.checkpoint;
  if (
    (begin_attempt && prior !== undefined) ||
    (!begin_attempt && !validCheckpointMetadata(prior))
  ) {
    throw new KernelError("CHECKPOINT_CAS_MISMATCH");
  }
  const sequence = begin_attempt ? 0 : prior.sequence + 1;
  const predecessorCheckpointIdentitySha256 = begin_attempt
    ? deriveCheckpointRootSha256(state.journal_identity_sha256)
    : prior.checkpoint_identity_sha256;
  const checkpointIdentitySha256 = deriveCheckpointIdentitySha256({
    state,
    sequence,
    predecessor_checkpoint_identity_sha256:
      predecessorCheckpointIdentitySha256,
  });
  const checkpoint = {
    schema_version: 1,
    sequence,
    predecessor_checkpoint_identity_sha256:
      predecessorCheckpointIdentitySha256,
    checkpoint_identity_sha256: checkpointIdentitySha256,
  };
  const candidate = {
    ...structuredClone(state),
    checkpoint,
  };
  assertEvidenceSafe(candidate);
  if (validate_candidate !== undefined) {
    if (typeof validate_candidate !== "function") {
      throw new KernelError("CHECKPOINT_STATE_SHAPE");
    }
    validate_candidate(structuredClone(candidate));
  }
  const command = {
    schema_version: 1,
    operation: begin_attempt ? "BEGIN_ATTEMPT" : "CAS_CHECKPOINT",
    journal_identity_sha256: state.journal_identity_sha256,
    checkpoint_sequence: sequence,
    predecessor_checkpoint_identity_sha256:
      predecessorCheckpointIdentitySha256,
    checkpoint_identity_sha256: checkpointIdentitySha256,
  };
  let receipt;
  let adapterRejected = false;
  try {
    receipt = await checkpointAdapter(candidate, command);
  } catch (error) {
    adapterRejected = true;
    if (begin_attempt && error?.code === "ATTEMPT_ALREADY_EXISTS") {
      throw new KernelError("ATTEMPT_ALREADY_EXISTS");
    }
  }
  const receiptValid =
    exactKeys(receipt, [
      "schema_version",
      "status",
      "operation",
      "journal_identity_sha256",
      "checkpoint_sequence",
      "predecessor_checkpoint_identity_sha256",
      "checkpoint_identity_sha256",
    ]) &&
    receipt.schema_version === 1 &&
    receipt.status === "CHECKPOINT_COMMITTED" &&
    receipt.operation === command.operation &&
    receipt.journal_identity_sha256 === command.journal_identity_sha256 &&
    receipt.checkpoint_sequence === command.checkpoint_sequence &&
    receipt.predecessor_checkpoint_identity_sha256 ===
      command.predecessor_checkpoint_identity_sha256 &&
    receipt.checkpoint_identity_sha256 === command.checkpoint_identity_sha256;
  if (!receiptValid) {
    if (typeof read_authoritative_head !== "function") {
      throw new KernelError("CHECKPOINT_STATE_UNKNOWN");
    }
    let head;
    try {
      head = await read_authoritative_head({
        schema_version: 1,
        journal_identity_sha256: command.journal_identity_sha256,
        expected_operation: command.operation,
        expected_checkpoint_sequence: command.checkpoint_sequence,
        expected_predecessor_checkpoint_identity_sha256:
          command.predecessor_checkpoint_identity_sha256,
        expected_checkpoint_identity_sha256:
          command.checkpoint_identity_sha256,
      });
      assertEvidenceSafe(head);
    } catch {
      throw new KernelError("CHECKPOINT_STATE_UNKNOWN");
    }
    const absent =
      exactKeys(head, ["schema_version", "status", "journal_identity_sha256"]) &&
      head.schema_version === 1 &&
      head.status === "CHECKPOINT_ABSENT" &&
      head.journal_identity_sha256 === command.journal_identity_sha256;
    const present =
      exactKeys(head, [
        "schema_version",
        "status",
        "journal_identity_sha256",
        "checkpoint_sequence",
        "predecessor_checkpoint_identity_sha256",
        "checkpoint_identity_sha256",
      ]) &&
      head.schema_version === 1 &&
      head.status === "CHECKPOINT_PRESENT" &&
      head.journal_identity_sha256 === command.journal_identity_sha256 &&
      Number.isSafeInteger(head.checkpoint_sequence) &&
      head.checkpoint_sequence >= 0 &&
      isSha256(head.predecessor_checkpoint_identity_sha256) &&
      isSha256(head.checkpoint_identity_sha256);
    if (begin_attempt && absent) {
      throw new KernelError("CHECKPOINT_NOT_COMMITTED");
    } else if (begin_attempt && present) {
      throw new KernelError("CHECKPOINT_STATE_UNKNOWN");
    } else if (
      present &&
      head.checkpoint_sequence === command.checkpoint_sequence &&
      head.predecessor_checkpoint_identity_sha256 ===
        command.predecessor_checkpoint_identity_sha256 &&
      head.checkpoint_identity_sha256 === command.checkpoint_identity_sha256
    ) {
      receipt = {
        ...command,
        status: "CHECKPOINT_COMMITTED",
      };
    } else if (
      !begin_attempt &&
      present &&
      head.checkpoint_sequence === prior.sequence &&
      head.predecessor_checkpoint_identity_sha256 ===
        prior.predecessor_checkpoint_identity_sha256 &&
      head.checkpoint_identity_sha256 === prior.checkpoint_identity_sha256
    ) {
      throw new KernelError("CHECKPOINT_NOT_COMMITTED");
    } else {
      throw new KernelError("CHECKPOINT_STATE_UNKNOWN");
    }
  }
  if (adapterRejected && !receiptValid && receipt?.status !== "CHECKPOINT_COMMITTED") {
    throw new KernelError("CHECKPOINT_STATE_UNKNOWN");
  }
  state.checkpoint = checkpoint;
  return structuredClone(checkpoint);
}

export function assertEvidenceSafe(value) {
  rejectSecretFields(value);
  return true;
}

function rejectSecretFields(value, path = []) {
  if (
    typeof value === "string" &&
    SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))
  ) {
    throw new KernelError("EVIDENCE_SECRET_VALUE");
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectSecretFields(entry, [...path, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_FIELD.test(key)) throw new KernelError("EVIDENCE_SECRET_FIELD");
    rejectSecretFields(entry, [...path, key]);
  }
}

function validateOwnedResource(resource, candidateIdentity) {
  const storage = resource?.resource_type === "STORAGE_OBJECT";
  if (
    !resource ||
    typeof resource !== "object" ||
    !exactKeys(
      resource,
      storage
        ? ["resource_key", "resource_type", "owner", "locator", "storage_cas"]
        : ["resource_key", "resource_type", "owner", "locator"],
    ) ||
    typeof resource.resource_key !== "string" ||
    resource.resource_key.length < 1 ||
    !RESOURCE_TYPES.has(resource.resource_type) ||
    !exactKeys(resource.owner, [
      "candidate_identity_sha256",
      "run_id",
      "phase",
      "operation_class",
      "resource_type",
      "locator_sha256",
      "cleanup_policy",
    ]) ||
    resource.owner?.phase !== "34JA-34JZ" ||
    resource.owner?.candidate_identity_sha256 !== candidateIdentity ||
    typeof resource.owner?.run_id !== "string" ||
    resource.owner.run_id.length < 16 ||
    resource.owner.operation_class !== "NONPRODUCTION_QUALIFICATION" ||
    resource.owner.resource_type !== resource.resource_type ||
    !isSha256(resource.owner.locator_sha256) ||
    ![
      "DELETE_EXACT",
      "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
    ].includes(resource.owner.cleanup_policy) ||
    (resource.owner.cleanup_policy ===
      "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW" &&
      resource.resource_type !== "PREVIEW_DEPLOYMENT") ||
    !resource.locator ||
    typeof resource.locator !== "object" ||
    Array.isArray(resource.locator)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (resource.owner.locator_sha256 !== sha256Hex(canonicalJson(resource.locator))) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_key !==
    `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "DATABASE_ROW" &&
    (!exactKeys(resource.locator, ["relation", "id"]) ||
      typeof resource.locator.relation !== "string" ||
      resource.locator.relation.length < 1 ||
      typeof resource.locator.id !== "string" ||
      resource.locator.id.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (resource.resource_type === "STORAGE_OBJECT") {
    if (
      !exactKeys(resource.locator, ["bucket", "name"]) ||
      typeof resource.locator.bucket !== "string" ||
      resource.locator.bucket.length < 1 ||
      typeof resource.locator.name !== "string" ||
      resource.locator.name.length < 1 ||
      !exactKeys(resource.storage_cas, [
        "expected_version",
        "delete_capability_sha256",
      ]) ||
      typeof resource.storage_cas?.expected_version !== "string" ||
      resource.storage_cas.expected_version.length < 1 ||
      !isSha256(resource.storage_cas.delete_capability_sha256)
    ) {
      throw new KernelError("OWNERSHIP_UNPROVEN");
    }
  }
  if (
    resource.resource_type === "PREVIEW_DEPLOYMENT" &&
    (!exactKeys(resource.locator, ["deployment_id", "project_id"]) ||
      typeof resource.locator.deployment_id !== "string" ||
      resource.locator.deployment_id.length < 1 ||
      typeof resource.locator.project_id !== "string" ||
      resource.locator.project_id.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "GIT_BRANCH" &&
    (!exactKeys(resource.locator, [
      "repository",
      "branch",
      "expected_commit_sha256",
    ]) ||
      typeof resource.locator.repository !== "string" ||
      resource.locator.repository.length < 1 ||
      typeof resource.locator.branch !== "string" ||
      resource.locator.branch.length < 1 ||
      !isSha256(resource.locator.expected_commit_sha256))
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "ENVIRONMENT_RECORD" &&
    (!exactKeys(resource.locator, ["project_id", "key", "target"]) ||
      typeof resource.locator.project_id !== "string" ||
      resource.locator.project_id.length < 1 ||
      typeof resource.locator.key !== "string" ||
      resource.locator.key.length < 1 ||
      typeof resource.locator.target !== "string" ||
      resource.locator.target.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
}

function validActivationRunId(value) {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 96 &&
    [...value].every(
      (character) =>
        (character >= "a" && character <= "z") ||
        (character >= "0" && character <= "9") ||
        character === "-",
    )
  );
}

function exactEmptyActivationEvidenceStory(state) {
  if (
    !Array.isArray(state?.resource_plan) ||
    state.resource_plan.length !== 0 ||
    !Array.isArray(state.owned_resources) ||
    state.owned_resources.length !== 0 ||
    !Array.isArray(state.effect_ledger) ||
    state.effect_ledger.length !== 0 ||
    state.authorization_class !== AUTHORIZATION_CLASSES.NONE ||
    state.budgets?.requests?.used !== 0 ||
    state.budgets?.mutations?.used !== 0 ||
    state.authority_envelope
      ?.current_retained_state_attestation_sha256 !==
      SAFE_EMPTY_RETAINED_STATE_ATTESTATION_SHA256
  ) {
    return false;
  }
  const initialReady =
    state.lifecycle_state === "READY" &&
    state.cleanup?.required === false &&
    state.cleanup?.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    state.outcome?.code === "READY" &&
    state.outcome?.successful === true;
  const safePreEffectFailure =
    state.lifecycle_state === "FAILED_CLOSED" &&
    state.cleanup?.required === false &&
    state.cleanup?.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    SAFE_PRE_EFFECT_FAILURE_CODES.has(state.outcome?.code) &&
    state.outcome?.successful === false;
  return initialReady || safePreEffectFailure;
}

function validateActivationSemanticParity(
  state,
  { allow_empty_evidence_story = false } = {},
) {
  if (
    !validActivationRunId(state?.run_id) ||
    state.phase !== "34JA-34JZ" ||
    state.operation_class !== "NONPRODUCTION_QUALIFICATION" ||
    state.authority_envelope?.run_id !== state.run_id ||
    state.authority_envelope?.phase !== state.phase ||
    state.authority_envelope?.operation_class !== state.operation_class
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  if (
    allow_empty_evidence_story &&
    exactEmptyActivationEvidenceStory(state)
  ) {
    return true;
  }
  if (
    !Array.isArray(state.resource_plan) ||
    state.resource_plan.length !== ACTIVATION_RESOURCE_TYPES.length ||
    ACTIVATION_RESOURCE_TYPES.some(
      (resourceType) =>
        state.resource_plan.filter(
          (resource) => resource?.resource_type === resourceType,
        ).length !== 1,
    ) ||
    state.authority_envelope
      ?.current_retained_state_attestation_sha256 !==
      ACTIVATION_CURRENT_RETAINED_STATE_ATTESTATION_SHA256
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const retained = state.resource_plan.filter(
    (resource) =>
      resource?.owner?.cleanup_policy ===
      "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  if (
    retained.length !== 1 ||
    retained[0].resource_type !== "PREVIEW_DEPLOYMENT" ||
    state.resource_plan.some(
      (resource) =>
        resource?.owner?.candidate_identity_sha256 !==
          state.candidate_identity_sha256 ||
        resource.owner.run_id !== state.run_id ||
        resource.owner.phase !== state.phase ||
        resource.owner.operation_class !== state.operation_class ||
        resource.owner.resource_type !== resource.resource_type ||
        (resource.resource_key !== retained[0].resource_key &&
          resource.owner.cleanup_policy !== "DELETE_EXACT"),
    ) ||
    (state.owned_resources ?? []).some(
      (resource) =>
        resource?.owner?.candidate_identity_sha256 !==
          state.candidate_identity_sha256 ||
        resource.owner.run_id !== state.run_id ||
        resource.owner.phase !== state.phase ||
        resource.owner.operation_class !== state.operation_class ||
        resource.owner.resource_type !== resource.resource_type,
    )
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const authorityReceipt =
    state.recovery_operation_state?.qualification_operation_slots?.find(
      (slot) =>
        slot.category === "requests" &&
        slot.index === 0 &&
        slot.operation === "VERIFY_AUTHORITY_ENVELOPE" &&
        slot.resource_key === null,
    );
  if (
    authorityReceipt?.status === "RESULT_APPLIED" &&
    (authorityReceipt.receipt?.run_id !== state.run_id ||
      authorityReceipt.receipt.current_retained_state_attestation_sha256 !==
        ACTIVATION_CURRENT_RETAINED_STATE_ATTESTATION_SHA256)
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return true;
}

export function validateJournalProtocol(state) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state) ||
    !exactKeys(state.authority_envelope, [
      "schema_version",
      "candidate_identity_sha256",
      "run_id",
      "phase",
      "operation_class",
      "review_approval_sha256",
      "freeze_document_sha256",
      "current_retained_state_attestation_sha256",
      "resource_plan_sha256",
    ]) ||
    state.authority_envelope.schema_version !== 1 ||
    state.authority_envelope.candidate_identity_sha256 !== state.candidate_identity_sha256 ||
    state.authority_envelope.run_id !== state.run_id ||
    state.authority_envelope.phase !== state.phase ||
    state.authority_envelope.operation_class !== state.operation_class ||
    state.authority_envelope.review_approval_sha256 !== state.review_approval_sha256 ||
    state.authority_envelope.freeze_document_sha256 !== state.freeze_document_sha256 ||
    !isSha256(state.authority_envelope.current_retained_state_attestation_sha256) ||
    !isSha256(state.authority_envelope.resource_plan_sha256) ||
    !isSha256(state.authority_envelope_sha256) ||
    deriveAuthorityEnvelopeSha256(state.authority_envelope) !== state.authority_envelope_sha256 ||
    !Array.isArray(state.resource_plan) ||
    !isSha256(state.resource_plan_sha256) ||
    deriveResourcePlanSha256(state.resource_plan) !== state.resource_plan_sha256 ||
    state.authority_envelope.resource_plan_sha256 !== state.resource_plan_sha256
  ) {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  const planByKey = new Map();
  for (const resource of state.resource_plan) {
    validateOwnedResource(resource, state.candidate_identity_sha256);
    if (planByKey.has(resource.resource_key)) {
      throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
    }
    planByKey.set(resource.resource_key, canonicalJson(resource));
  }
  if (
    !Array.isArray(state.owned_resources) ||
    state.owned_resources.some(
      (resource) => planByKey.get(resource.resource_key) !== canonicalJson(resource),
    )
  ) {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  const expectedReservation = createOperationReservation(state.authority_envelope_sha256);
  if (
    canonicalJson(state.operation_reservation) !== canonicalJson(expectedReservation) ||
    !isSha256(state.journal_identity_sha256) ||
    deriveJournalIdentitySha256({
      authority_envelope_sha256: state.authority_envelope_sha256,
      resource_plan_sha256: state.resource_plan_sha256,
      ordered_resource_keys: state.resource_plan.map((resource) => resource.resource_key),
      operation_reservation_identity_sha256: state.operation_reservation.identity_sha256,
    }) !== state.journal_identity_sha256
  ) {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  return true;
}

function validateLedger(state) {
  if (!Array.isArray(state.owned_resources) || !Array.isArray(state.effect_ledger)) {
    throw new KernelError("RECOVERY_LEDGER_SHAPE");
  }
  const byKey = new Map();
  const locatorIdentities = new Set();
  for (const resource of state.owned_resources) {
    validateOwnedResource(resource, state.candidate_identity_sha256);
    if (
      state.run_id !== undefined &&
      (resource.owner.run_id !== state.run_id ||
        resource.owner.phase !== state.phase ||
        resource.owner.operation_class !== state.operation_class)
    ) {
      throw new KernelError("OWNERSHIP_UNPROVEN");
    }
    const locatorIdentity = canonicalJson({
      resource_type: resource.resource_type,
      locator: resource.locator,
    });
    if (byKey.has(resource.resource_key) || locatorIdentities.has(locatorIdentity)) {
      throw new KernelError("OWNERSHIP_AMBIGUOUS");
    }
    byKey.set(resource.resource_key, resource);
    locatorIdentities.add(locatorIdentity);
  }
  const sequences = new Set();
  const ledgerKeys = new Set();
  for (const entry of state.effect_ledger) {
    if (
      !entry ||
      !exactKeys(entry, [
        "sequence",
        "resource_key",
        "effect",
        "status",
        "cleanup_status",
        "creation_operation_slot_sha256",
        "creation_receipt_sha256",
      ]) ||
      !Number.isSafeInteger(entry.sequence) ||
      entry.sequence < 1 ||
      sequences.has(entry.sequence) ||
      typeof entry.resource_key !== "string" ||
      ledgerKeys.has(entry.resource_key) ||
      !byKey.has(entry.resource_key) ||
      entry.effect !== "CREATE" ||
      !["INTENT_ONLY", "APPLIED", "UNCERTAIN", "CLEANED"].includes(entry.status) ||
      !CLEANUP_STATUSES.has(entry.cleanup_status) ||
      !isSha256(entry.creation_operation_slot_sha256) ||
      (entry.status === "APPLIED"
        ? !isSha256(entry.creation_receipt_sha256)
        : entry.status === "CLEANED"
          ? !(
              isSha256(entry.creation_receipt_sha256) ||
              entry.creation_receipt_sha256 === null
            )
          : entry.creation_receipt_sha256 !== null) ||
      (entry.cleanup_status === "RETAINED" && entry.status !== "APPLIED") ||
      (entry.cleanup_status === "VERIFIED" && entry.status !== "CLEANED") ||
      (entry.cleanup_status === "NOT_REQUIRED" && entry.status !== "CLEANED")
    ) {
      throw new KernelError("RECOVERY_LEDGER_SHAPE");
    }
    const planIndex = state.resource_plan?.findIndex(
      (resource) => resource.resource_key === entry.resource_key,
    );
    if (
      planIndex < 0 ||
      deriveOperationSlot({
        operation_reservation: state.operation_reservation,
        category: "mutations",
        index: planIndex,
        operation: "QUALIFICATION_CREATE_NEW",
        resource_key: entry.resource_key,
      }).operation_slot_sha256 !== entry.creation_operation_slot_sha256
    ) {
      throw new KernelError("RECOVERY_LEDGER_SHAPE");
    }
    sequences.add(entry.sequence);
    ledgerKeys.add(entry.resource_key);
  }
  const ordered = [...state.effect_ledger].sort((left, right) => left.sequence - right.sequence);
  if (
    ledgerKeys.size !== byKey.size ||
    !ordered.every((entry, index) => entry.sequence === index + 1)
  ) {
    throw new KernelError("RECOVERY_LEDGER_SHAPE");
  }
  return { byKey, ordered };
}

function copyJournalState(state) {
  return {
    schema_version: 1,
    candidate_identity_sha256: state.candidate_identity_sha256,
    run_id: state.run_id,
    phase: state.phase,
    operation_class: state.operation_class,
    review_approval_sha256: state.review_approval_sha256,
    freeze_document_sha256: state.freeze_document_sha256,
    retained_state_sha256: state.retained_state_sha256,
    authority_envelope: structuredClone(state.authority_envelope),
    authority_envelope_sha256: state.authority_envelope_sha256,
    resource_plan: structuredClone(state.resource_plan),
    resource_plan_sha256: state.resource_plan_sha256,
    operation_reservation: structuredClone(state.operation_reservation),
    recovery_operation_state: structuredClone(state.recovery_operation_state),
    journal_identity_sha256: state.journal_identity_sha256,
    lifecycle_state: state.lifecycle_state,
    authorization_class: state.authorization_class,
    budgets: structuredClone(state.budgets),
    owned_resources: structuredClone(state.owned_resources),
    effect_ledger: structuredClone(state.effect_ledger),
    transition_history: structuredClone(state.transition_history),
    cleanup: structuredClone(state.cleanup),
    recovery: structuredClone(state.recovery),
    outcome: structuredClone(state.outcome),
    checkpoint: structuredClone(state.checkpoint),
    ...(Object.hasOwn(state, "final_evidence_identity_sha256")
      ? {
          final_evidence_identity_sha256:
            state.final_evidence_identity_sha256,
        }
      : {}),
  };
}

export function validateRecoveryState(state) {
  try {
    assertEvidenceSafe(state);
    checkpointStatePayload(state);
    validateActivationSemanticParity(state);
  } catch {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const exactBeginPrefix =
    state.lifecycle_state === "READY" &&
    state.authorization_class === AUTHORIZATION_CLASSES.NONE &&
    state.checkpoint?.sequence === 0 &&
    !Object.hasOwn(state, "final_evidence_identity_sha256") &&
    exactKeys(state.cleanup, ["required", "verified"]) &&
    state.cleanup.required === false &&
    state.cleanup.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    exactKeys(state.outcome, ["code", "successful"]) &&
    state.outcome.code === "READY" &&
    state.outcome.successful === true &&
    exactKeys(state.budgets, ["requests", "mutations"]) &&
    exactKeys(state.budgets.requests, ["limit", "used"]) &&
    state.budgets.requests.limit === 16 &&
    state.budgets.requests.used === 0 &&
    exactKeys(state.budgets.mutations, ["limit", "used"]) &&
    state.budgets.mutations.limit === 15 &&
    state.budgets.mutations.used === 0 &&
    state.owned_resources.length === 0 &&
    state.effect_ledger.length === 0 &&
    state.transition_history.length === 0 &&
    state.recovery_operation_state.qualification_slot_usage.requests.length === 0 &&
    state.recovery_operation_state.qualification_slot_usage.mutations.length === 0 &&
    state.recovery_operation_state.recovery_anchor === null &&
    state.recovery_operation_state.recovery_grant === null &&
    state.recovery_operation_state.operation_slots.every(
      (slot) => slot.status === "NOT_STARTED",
    );
  if (
    !exactKeys(state.cleanup, ["required", "verified"]) ||
    typeof state.cleanup.required !== "boolean" ||
    typeof state.cleanup.verified !== "boolean" ||
    !exactKeys(state.outcome, ["code", "successful"]) ||
    typeof state.outcome.code !== "string" ||
    state.outcome.code.length === 0 ||
    typeof state.outcome.successful !== "boolean" ||
    !validBudget(state.budgets)
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  let finalTransition = null;
  if (!exactBeginPrefix) {
    try {
      if (!validReservationBudgetAccounting(state)) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      finalTransition = validateSemanticTransitionHistory(state);
      validateRecoveryAuthorizationProvenance(state, finalTransition);
      validateQualificationOperationReceipts(state);
    } catch {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  const protocol = state.recovery_operation_state;
  const recoveryProgressed = protocol.operation_slots.some(
    (slot) => slot.status !== "NOT_STARTED",
  );
  const granted =
    protocol.recovery_anchor !== null ||
    protocol.recovery_grant !== null ||
    recoveryProgressed;
  const activeLocalQualification =
    !granted &&
    state.lifecycle_state === "QUALIFYING" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    exactKeys(state.cleanup, ["required", "verified"]) &&
    state.cleanup.required === false &&
    state.cleanup.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    state.outcome.code === "QUALIFYING" &&
    state.outcome.successful === true;
  const interruptedLocalQualification =
    !granted &&
    state.lifecycle_state === "QUALIFYING" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    state.cleanup.required === (state.owned_resources.length > 0) &&
    state.cleanup.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "INTERRUPTED" &&
    state.recovery.resume_to === "READY" &&
    state.outcome.code === "TERMINAL_CHECKPOINT_PENDING" &&
    state.outcome.successful === false;
  const ungrantedLocalFailure =
    !granted &&
    state.lifecycle_state === "FAILED_RECOVERABLE" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    state.cleanup.required === (state.owned_resources.length > 0) &&
    state.cleanup.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "PENDING" &&
    state.recovery.resume_to === "READY" &&
    LOCAL_QUALIFICATION_FAILURE_CODES.has(state.outcome.code) &&
    state.outcome.successful === false;
  const grantedControllerFailure =
    granted &&
    state.lifecycle_state === "FAILED_RECOVERABLE" &&
    state.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    state.cleanup.required === (state.owned_resources.length > 0) &&
    state.cleanup.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "PENDING" &&
    state.recovery.resume_to === "READY" &&
    state.outcome.code === "RECOVERY_AUTHORIZED" &&
    state.outcome.successful === false;
  if (
    !exactBeginPrefix &&
    !activeLocalQualification &&
    !interruptedLocalQualification &&
    !ungrantedLocalFailure &&
    !grantedControllerFailure
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  try {
    validateJournalProtocol(state);
  } catch {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  const ledger = validateLedger(state);
  try {
    validateCheckpointProtocol(state);
  } catch {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  if (state.recovery_operation_state.recovery_grant !== null) {
    validateGrantedRecoveryJournal(state);
  }
  return ledger;
}

function terminalRecoverySlot(
  state,
  category,
  index,
  operation,
  resourceKey,
) {
  return state.recovery_operation_state.operation_slots.find(
    (slot) =>
      slot.category === category &&
      slot.index === index &&
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
}

function terminalQualificationSlot(
  state,
  category,
  index,
  operation,
  resourceKey = null,
) {
  return state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.category === category &&
      slot.index === index &&
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
}

function boundedText(value, maximum = 1024) {
  return typeof value === "string" && value.length >= 1 && value.length <= maximum;
}

function exactExternalBinding(resource, binding) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) return false;
  if (resource.resource_type === "GIT_BRANCH") {
    return exactKeys(binding, ["resource_type", "commit_sha", "remote_ref"]) &&
      binding.resource_type === resource.resource_type &&
      /^[0-9a-f]{40}$/u.test(binding.commit_sha ?? "") &&
      boundedText(binding.remote_ref, 512);
  }
  if (resource.resource_type === "PREVIEW_DEPLOYMENT") {
    return exactKeys(binding, ["resource_type", "deployment_id", "deployment_url"]) &&
      binding.resource_type === resource.resource_type &&
      boundedText(binding.deployment_id, 256) &&
      boundedText(binding.deployment_url, 512);
  }
  if (resource.resource_type === "ENVIRONMENT_RECORD") {
    return exactKeys(binding, ["resource_type", "records"]) &&
      binding.resource_type === resource.resource_type &&
      Array.isArray(binding.records) &&
      binding.records.length === 2 &&
      new Set(binding.records.map((entry) => entry?.key)).size === 2 &&
      new Set(binding.records.map((entry) => entry?.id)).size === 2 &&
      binding.records.every((entry) =>
        exactKeys(entry, ["id", "key"]) &&
        boundedText(entry.key, 256) &&
        boundedText(entry.id, 256)
      );
  }
  if (resource.resource_type === "DATABASE_ROW") {
    return exactKeys(binding, ["resource_type", "row_ids"]) &&
      binding.resource_type === resource.resource_type &&
      Array.isArray(binding.row_ids) &&
      binding.row_ids.length >= 1 &&
      binding.row_ids.length <= 3 &&
      new Set(binding.row_ids).size === binding.row_ids.length &&
      binding.row_ids.every((entry) => boundedText(entry, 256));
  }
  return resource.resource_type === "STORAGE_OBJECT" &&
    exactKeys(binding, [
      "resource_type",
      "object_id",
      "expected_version",
      "expected_etag",
      "expected_size",
      "content_sha256",
      "created_at",
    ]) &&
    binding.resource_type === resource.resource_type &&
    boundedText(binding.object_id, 1024) &&
    boundedText(binding.expected_version, 1024) &&
    binding.expected_version !== STORAGE_VERSION_BINDING &&
    boundedText(binding.expected_etag, 1024) &&
    Number.isSafeInteger(binding.expected_size) &&
    binding.expected_size >= 96 &&
    binding.expected_size <= 512 &&
    isSha256(binding.content_sha256) &&
    boundedText(binding.created_at, 64) &&
    Number.isFinite(Date.parse(binding.created_at));
}

function exactCreateReceiptBinding(resource, receipt) {
  const hasBinding = Object.hasOwn(receipt ?? {}, "external_binding");
  if (hasBinding && !exactExternalBinding(resource, receipt.external_binding)) return false;
  if (resource.resource_type !== "STORAGE_OBJECT") return true;
  if (resource.storage_cas.expected_version === STORAGE_VERSION_BINDING) {
    return hasBinding;
  }
  return !hasBinding ||
    receipt.external_binding.expected_version === resource.storage_cas.expected_version;
}

function effectiveStorageExpectedVersion(state, resource) {
  if (resource.resource_type !== "STORAGE_OBJECT") return null;
  if (resource.storage_cas.expected_version !== STORAGE_VERSION_BINDING) {
    return resource.storage_cas.expected_version;
  }
  const create = terminalQualificationSlot(
    state,
    "mutations",
    state.resource_plan.indexOf(resource),
    "QUALIFICATION_CREATE_NEW",
    resource.resource_key,
  );
  return create?.status === "RESULT_APPLIED" &&
    exactCreateReceiptBinding(resource, create.receipt)
    ? create.receipt.external_binding.expected_version
    : null;
}

function exactQualificationCreateReceipt(receipt, slot, resource, state) {
  const optionalBinding = Object.hasOwn(receipt ?? {}, "external_binding")
    ? ["external_binding"]
    : [];
  return (
    exactKeys(receipt, [
      "status",
      "resource_key",
      "locator_sha256",
      "authority_envelope_sha256",
      "reservation_proof_sha256",
      "operation_slot_sha256",
      ...optionalBinding,
    ]) &&
    receipt.status === "CREATED_NEW" &&
    receipt.resource_key === resource.resource_key &&
    receipt.locator_sha256 === resource.owner.locator_sha256 &&
    receipt.authority_envelope_sha256 === state.authority_envelope_sha256 &&
    receipt.reservation_proof_sha256 === slot.reservation_proof_sha256 &&
    receipt.operation_slot_sha256 === slot.operation_slot_sha256 &&
    exactCreateReceiptBinding(resource, receipt)
  );
}

function exactQualificationVerificationReceipt(state, slot, expectedKind) {
  const receipt = slot?.receipt;
  if (
    slot?.status !== "RESULT_APPLIED" ||
    !exactKeys(receipt, [
      "status",
      "retained_preview_count",
      "verified_present_resources",
      "verified_absent_resource_keys",
      "operation_slot_sha256",
      "reservation_proof_sha256",
    ]) ||
    receipt.status !== "VERIFIED" ||
    receipt.operation_slot_sha256 !== slot.operation_slot_sha256 ||
    receipt.reservation_proof_sha256 !== slot.reservation_proof_sha256
  ) {
    return false;
  }
  const retained = state.owned_resources.filter(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  if (expectedKind === "SUCCESS") {
    const expectedPresent = retained.map((resource) => ({
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
    }));
    const expectedAbsent = state.owned_resources
      .filter(
        (resource) =>
          !retained.some(
            (candidate) => candidate.resource_key === resource.resource_key,
          ),
      )
      .map((resource) => resource.resource_key);
    return (
      slot.index === 3 &&
      retained.length === 1 &&
      receipt.retained_preview_count === 1 &&
      canonicalJson(receipt.verified_present_resources) ===
        canonicalJson(expectedPresent) &&
      canonicalJson(receipt.verified_absent_resource_keys) ===
        canonicalJson(expectedAbsent)
    );
  }
  if (expectedKind === "ZERO") {
    return (
      receipt.retained_preview_count === 0 &&
      canonicalJson(receipt.verified_present_resources) === "[]" &&
      canonicalJson(receipt.verified_absent_resource_keys) ===
        canonicalJson(
          state.owned_resources.map((resource) => resource.resource_key),
        )
    );
  }
  return false;
}

function exactStatusSensitiveRecoveryDeleteReceipt({
  receipt,
  operationSlotSha256,
  operationBindingSha256,
  resource,
  expectedStorageVersion = resource?.storage_cas?.expected_version,
}) {
  const storage = resource?.resource_type === "STORAGE_OBJECT";
  const versionMismatch = storage && receipt?.status === "VERSION_MISMATCH";
  return (
    exactKeys(receipt, [
      "status",
      "resource_key",
      "locator_sha256",
      "operation_slot_sha256",
      "operation_binding_sha256",
      ...(storage ? ["expected_version"] : []),
      ...(versionMismatch ? ["observed_version"] : []),
    ]) &&
    [
      "DELETED_EXACT",
      "ABSENT_VERIFIED",
      ...(storage ? ["VERSION_MISMATCH"] : []),
    ].includes(receipt.status) &&
    receipt.resource_key === resource.resource_key &&
    receipt.locator_sha256 === resource.owner.locator_sha256 &&
    receipt.operation_slot_sha256 === operationSlotSha256 &&
    receipt.operation_binding_sha256 === operationBindingSha256 &&
    (!storage ||
      (expectedStorageVersion !== null &&
        receipt.expected_version === expectedStorageVersion &&
        (!versionMismatch ||
          (typeof receipt.observed_version === "string" &&
            receipt.observed_version.length > 0 &&
            receipt.observed_version !== receipt.expected_version))))
  );
}

function exactRecoveryDeleteReceipt(state, slot, resource, expectedKind) {
  const receipt = slot?.receipt;
  const allowedStatus = expectedKind === "DELETED"
    ? ["DELETED_EXACT", "ABSENT_VERIFIED"]
    : ["VERSION_MISMATCH"];
  return (
    slot?.status === "RESULT_APPLIED" &&
    allowedStatus.includes(receipt?.status) &&
    exactStatusSensitiveRecoveryDeleteReceipt({
      receipt,
      operationSlotSha256: slot.operation_slot_sha256,
      operationBindingSha256: slot.operation_binding_sha256,
      resource,
      expectedStorageVersion: effectiveStorageExpectedVersion(state, resource),
    })
  );
}

function validateQualificationEmitterLedgerPairs(state) {
  const grantedControllerJournal =
    state.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    state.recovery_operation_state?.recovery_anchor !== null &&
    state.recovery_operation_state?.recovery_grant !== null;
  const allowedEffectStatuses = {
    PENDING: new Set(["INTENT_ONLY", "APPLIED", "UNCERTAIN"]),
    NOT_REQUIRED: new Set(["CLEANED"]),
    INTENT_ONLY: new Set(["APPLIED", "UNCERTAIN"]),
    APPLIED: new Set(["CLEANED"]),
    UNCERTAIN: new Set(["APPLIED", "UNCERTAIN"]),
    VERIFIED: new Set(["CLEANED"]),
    RETAINED: new Set(["APPLIED"]),
    VERSION_MISMATCH_PRESERVED: new Set(["APPLIED", "UNCERTAIN"]),
  };
  validateQualificationCreationLedgerClosure(state, {
    ordered: state.effect_ledger,
  });
  for (const entry of state.effect_ledger) {
    if (!allowedEffectStatuses[entry.cleanup_status]?.has(entry.status)) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    const planIndex = state.resource_plan.findIndex(
      (resource) => resource.resource_key === entry.resource_key,
    );
    const resource = state.resource_plan[planIndex];
    const creation = terminalQualificationSlot(
      state,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      entry.resource_key,
    );
    const qualificationDelete = terminalQualificationSlot(
      state,
      "mutations",
      5 + planIndex,
      "QUALIFICATION_DELETE_EXACT",
      entry.resource_key,
    );
    const recoveryInspect = terminalRecoverySlot(
      state,
      "requests",
      6 + planIndex * 2,
      "RECOVERY_INSPECT",
      entry.resource_key,
    );
    const recoveryVerify = terminalRecoverySlot(
      state,
      "requests",
      7 + planIndex * 2,
      "RECOVERY_VERIFY_ABSENT",
      entry.resource_key,
    );
    const recoveryDelete = terminalRecoverySlot(
      state,
      "mutations",
      10 + planIndex,
      "RECOVERY_DELETE_EXACT",
      entry.resource_key,
    );
    const qualificationDeleted =
      qualificationDelete?.status === "RESULT_APPLIED" &&
      qualificationDelete.receipt?.status === "DELETED_EXACT";
    const qualificationMismatch =
      resource.resource_type === "STORAGE_OBJECT" &&
      qualificationDelete?.status === "RESULT_APPLIED" &&
      qualificationDelete.receipt?.status === "VERSION_MISMATCH";
    const recoveryDeleted = exactRecoveryDeleteReceipt(
      state,
      recoveryDelete,
      resource,
      "DELETED",
    );
    const recoveryMismatch = exactRecoveryDeleteReceipt(
      state,
      recoveryDelete,
      resource,
      "VERSION_MISMATCH",
    );
    const controllerVerifiedAbsent =
      grantedControllerJournal &&
      [recoveryInspect, recoveryVerify].some(
        (slot) =>
          slot?.status === "RESULT_APPLIED" &&
          slot.receipt?.status === "ABSENT" &&
          exactTerminalInspectionReceipt(
            slot.receipt,
            slot,
            resource,
            entry,
            effectiveStorageExpectedVersion(state, resource),
          ),
      );
    const controllerObservedStorageMismatch =
      grantedControllerJournal &&
      resource.resource_type === "STORAGE_OBJECT" &&
      recoveryInspect?.status === "RESULT_APPLIED" &&
      recoveryInspect.receipt?.status === "PRESENT" &&
      recoveryInspect.receipt.observed_version !==
        effectiveStorageExpectedVersion(state, resource) &&
      exactStatusSensitiveInspectionReceipt({
        receipt: recoveryInspect.receipt,
        operationSlotSha256: recoveryInspect.operation_slot_sha256,
        operationBindingSha256: recoveryInspect.operation_binding_sha256,
        resource,
        creationOperationSlotSha256:
          entry.creation_operation_slot_sha256,
        requireExpectedStorageVersion: false,
      });
    const controllerInvalidatedQualificationCleanup =
      grantedControllerJournal &&
      qualificationDeleted &&
      recoveryInspect?.status === "RESULT_APPLIED" &&
      ["PRESENT", "AMBIGUOUS"].includes(
        recoveryInspect.receipt?.status,
      ) &&
      exactStatusSensitiveInspectionReceipt({
        receipt: recoveryInspect.receipt,
        operationSlotSha256: recoveryInspect.operation_slot_sha256,
        operationBindingSha256: recoveryInspect.operation_binding_sha256,
        resource,
        creationOperationSlotSha256:
          entry.creation_operation_slot_sha256,
        allowAmbiguous: true,
        requireCreationProofForPresent: true,
        requireExpectedStorageVersion: true,
      });
    const qualificationDeleteUntouched =
      qualificationDelete?.status === "NOT_STARTED";
    const recoveryDeleteUntouched =
      recoveryDelete?.status === "NOT_STARTED";
    const deleteReserved =
      qualificationDelete?.status === "RESERVED" ||
      ["RESERVED", "RECEIPT_KNOWN"].includes(recoveryDelete?.status);
    const deleteApplied =
      qualificationDelete?.status === "RESULT_APPLIED" ||
      recoveryDelete?.status === "RESULT_APPLIED";
    const recoveryDeletionContradicted =
      grantedControllerJournal &&
      recoveryDeleted &&
      recoveryVerify?.status === "RESULT_APPLIED" &&
      ["PRESENT", "AMBIGUOUS"].includes(recoveryVerify.receipt?.status) &&
      exactStatusSensitiveInspectionReceipt({
        receipt: recoveryVerify.receipt,
        operationSlotSha256: recoveryVerify.operation_slot_sha256,
        operationBindingSha256: recoveryVerify.operation_binding_sha256,
        resource,
        creationOperationSlotSha256:
          entry.creation_operation_slot_sha256,
        allowAmbiguous: true,
        requireCreationProofForPresent: true,
      });

    if (
      entry.cleanup_status === "NOT_REQUIRED" &&
      (entry.creation_receipt_sha256 !== null ||
        !["NOT_STARTED", "RESERVED"].includes(creation?.status) ||
        !qualificationDeleteUntouched ||
        !recoveryDeleteUntouched)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "PENDING" &&
      (!qualificationDeleteUntouched || !recoveryDeleteUntouched)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "INTENT_ONLY" &&
      (!deleteReserved ||
        (deleteApplied && !controllerInvalidatedQualificationCleanup))
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "UNCERTAIN" &&
      (deleteApplied
        ? !recoveryDeletionContradicted &&
          !controllerInvalidatedQualificationCleanup
        : !deleteReserved)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "APPLIED" &&
      !qualificationDeleted &&
      !recoveryDeleted
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "VERIFIED" &&
      !qualificationDeleted &&
      !recoveryDeleted &&
      !controllerVerifiedAbsent
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "RETAINED" &&
      (state.lifecycle_state !== "QUALIFIED" ||
        !qualificationDeleteUntouched ||
        !recoveryDeleteUntouched)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      entry.cleanup_status === "VERSION_MISMATCH_PRESERVED" &&
      !qualificationMismatch &&
      !recoveryMismatch &&
      !controllerObservedStorageMismatch
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  return true;
}

function validateQualificationCompensationChronology(state) {
  validateQualificationEmitterLedgerPairs(state);
  const primary = terminalQualificationSlot(
    state,
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensation = terminalQualificationSlot(
    state,
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const retained = state.owned_resources.filter(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  const retainedResource = retained.length === 1 ? retained[0] : null;
  const planIndex = retainedResource === null
    ? -1
    : state.resource_plan.findIndex(
        (resource) => resource.resource_key === retainedResource.resource_key,
      );
  const deletion = planIndex < 0
    ? null
    : terminalQualificationSlot(
        state,
        "mutations",
        5 + planIndex,
        "QUALIFICATION_DELETE_EXACT",
        retainedResource.resource_key,
      );
  const entry = retainedResource === null
    ? null
    : state.effect_ledger.find(
        (candidate) => candidate.resource_key === retainedResource.resource_key,
      );
  const primaryIsSuccess =
    exactQualificationVerificationReceipt(state, primary, "SUCCESS");
  const primaryIsZero =
    exactQualificationVerificationReceipt(state, primary, "ZERO");
  const activeQualification =
    state.lifecycle_state === "QUALIFYING" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    state.cleanup?.required === false &&
    state.cleanup?.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    state.outcome?.code === "QUALIFYING" &&
    state.outcome.successful === true;
  const interruptedQualification =
    state.lifecycle_state === "QUALIFYING" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    state.cleanup?.required === (state.owned_resources.length > 0) &&
    state.cleanup?.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "INTERRUPTED" &&
    state.recovery.resume_to === "READY" &&
    state.outcome?.code === "TERMINAL_CHECKPOINT_PENDING" &&
    state.outcome.successful === false;
  const localRecoveryPending =
    state.lifecycle_state === "FAILED_RECOVERABLE" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    state.cleanup?.required === (state.owned_resources.length > 0) &&
    state.cleanup?.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "PENDING" &&
    state.recovery.resume_to === "READY" &&
    LOCAL_QUALIFICATION_FAILURE_CODES.has(state.outcome?.code) &&
    state.outcome.successful === false;
  const controllerRecoveryPending =
    state.lifecycle_state === "FAILED_RECOVERABLE" &&
    state.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    state.cleanup?.required === (state.owned_resources.length > 0) &&
    state.cleanup?.verified === false &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "PENDING" &&
    state.recovery.resume_to === "READY" &&
    state.outcome?.code === "RECOVERY_AUTHORIZED" &&
    state.outcome.successful === false;
  const nonterminalQualification =
    activeQualification ||
    interruptedQualification ||
    localRecoveryPending ||
    controllerRecoveryPending;
  const recoveryPending =
    localRecoveryPending || controllerRecoveryPending;
  const grantedControllerJournal =
    state.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    state.recovery_operation_state?.recovery_anchor !== null &&
    state.recovery_operation_state?.recovery_grant !== null;
  const primaryProgressed =
    primary !== null && primary !== undefined &&
    primary.status !== "NOT_STARTED";
  const deletionProgressed =
    deletion !== null && deletion !== undefined &&
    deletion.status !== "NOT_STARTED";
  const compensationProgressed =
    compensation !== null && compensation !== undefined &&
    compensation.status !== "NOT_STARTED";
  const exactProgressedOrder = (...slots) =>
    slots.every((slot) => Number.isSafeInteger(slot?.reservation_ordinal)) &&
    slots.every(
      (slot, index) =>
        index === 0 ||
        slots[index - 1].reservation_ordinal < slot.reservation_ordinal,
    );
  if (
    primaryProgressed &&
    deletionProgressed &&
    exactProgressedOrder(primary, deletion) &&
    primary?.status === "RESULT_APPLIED" &&
    !primaryIsSuccess
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  if (
    primaryIsSuccess &&
    deletionProgressed &&
    exactProgressedOrder(deletion, primary)
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  if (
    primary?.status === "RESERVED" &&
    deletionProgressed &&
    exactProgressedOrder(primary, deletion)
  ) {
    const exactLocalFaultLedger =
      state.authorization_class ===
        AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
      !state.effect_ledger.some(
        (ledgerEntry) =>
          ["RETAINED", "VERIFIED"].includes(ledgerEntry.cleanup_status),
      ) &&
      ((deletion.status === "RESULT_APPLIED" &&
        entry?.status === "CLEANED" &&
        entry.cleanup_status === "APPLIED") ||
        (deletion.status === "RESERVED" &&
          ["INTENT_ONLY", "UNCERTAIN"].includes(entry?.cleanup_status)));
    if (
      (!nonterminalQualification && !grantedControllerJournal) ||
      (state.authorization_class ===
          AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
        !exactLocalFaultLedger)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  if (primaryIsZero) {
    for (const ledgerEntry of state.effect_ledger) {
      if (ledgerEntry.cleanup_status === "NOT_REQUIRED") continue;
      const resourceIndex = state.resource_plan.findIndex(
        (resource) => resource.resource_key === ledgerEntry.resource_key,
      );
      const resource = state.resource_plan[resourceIndex];
      const requiredDeletion = resourceIndex < 0
        ? null
        : terminalQualificationSlot(
            state,
            "mutations",
            5 + resourceIndex,
            "QUALIFICATION_DELETE_EXACT",
            resource.resource_key,
          );
      if (
        !Number.isSafeInteger(requiredDeletion?.reservation_ordinal) ||
        requiredDeletion.reservation_ordinal >= primary.reservation_ordinal
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      const versionMismatch =
        requiredDeletion.receipt?.status === "VERSION_MISMATCH";
      const appliedExactDelete =
        requiredDeletion.status === "RESULT_APPLIED" &&
        requiredDeletion.receipt?.status === "DELETED_EXACT" &&
        ledgerEntry.status === "CLEANED" &&
        ["APPLIED", "VERIFIED"].includes(ledgerEntry.cleanup_status);
      const appliedVersionMismatch =
        requiredDeletion.status === "RESULT_APPLIED" &&
        versionMismatch &&
        ["APPLIED", "UNCERTAIN"].includes(ledgerEntry.status) &&
        ledgerEntry.cleanup_status === "VERSION_MISMATCH_PRESERVED" &&
        recoveryPending;
      const unresolvedDeleteResponse =
        requiredDeletion.status === "RESERVED" &&
        ["APPLIED", "UNCERTAIN"].includes(ledgerEntry.status) &&
        ledgerEntry.cleanup_status === "UNCERTAIN" &&
        recoveryPending;
      const recoveredUnresolvedDelete =
        requiredDeletion.status === "RESERVED" &&
        ledgerEntry.status === "CLEANED" &&
        ledgerEntry.cleanup_status === "VERIFIED" &&
        grantedControllerJournal;
      if (
        !appliedExactDelete &&
        !appliedVersionMismatch &&
        !unresolvedDeleteResponse &&
        !recoveredUnresolvedDelete
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
    }
  }
  if (compensation?.status === "NOT_STARTED") {
    if (
      primaryIsSuccess &&
      deletionProgressed &&
      exactProgressedOrder(primary, deletion)
    ) {
      const appliedBeforeCompensation =
        deletion.status === "RESULT_APPLIED" &&
        entry?.status === "CLEANED" &&
        (entry.cleanup_status === "APPLIED" ||
          (entry.cleanup_status === "VERIFIED" &&
            grantedControllerJournal));
      const reservedBeforeCompensation =
        deletion.status === "RESERVED" &&
        ["APPLIED", "UNCERTAIN"].includes(entry?.status) &&
        (((activeQualification || interruptedQualification) &&
          ["INTENT_ONLY", "UNCERTAIN"].includes(entry.cleanup_status)) ||
          ((localRecoveryPending || controllerRecoveryPending) &&
            entry.cleanup_status === "UNCERTAIN"));
      const recoveredReservedDelete =
        deletion.status === "RESERVED" &&
        entry?.status === "CLEANED" &&
        entry.cleanup_status === "VERIFIED" &&
        grantedControllerJournal;
      if (
        !appliedBeforeCompensation &&
        !reservedBeforeCompensation &&
        !recoveredReservedDelete
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
    }
    return true;
  }
  if (
    !primaryIsSuccess ||
    !deletionProgressed ||
    !compensationProgressed ||
    !exactProgressedOrder(primary, deletion, compensation)
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const appliedDeletion =
    deletion.status === "RESULT_APPLIED" &&
    entry?.status === "CLEANED" &&
    ["APPLIED", "VERIFIED"].includes(entry.cleanup_status);
  const uncertainDeletion =
    deletion.status === "RESERVED" &&
    ["APPLIED", "UNCERTAIN"].includes(entry?.status) &&
    entry?.cleanup_status === "UNCERTAIN";
  const recoveredUncertainDeletion =
    deletion.status === "RESERVED" &&
    entry?.status === "CLEANED" &&
    entry.cleanup_status === "VERIFIED" &&
    grantedControllerJournal;
  if (
    !appliedDeletion &&
    !uncertainDeletion &&
    !recoveredUncertainDeletion
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  if (compensation?.status === "RESERVED") {
    const exactAppliedDeleteBeforeVerifier =
      appliedDeletion &&
      ((entry.cleanup_status === "APPLIED" && nonterminalQualification) ||
        (entry.cleanup_status === "VERIFIED" && grantedControllerJournal));
    if (
      (appliedDeletion && !exactAppliedDeleteBeforeVerifier) ||
      (uncertainDeletion && !nonterminalQualification)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    return true;
  }
  if (
    compensation?.status !== "RESULT_APPLIED" ||
    !exactQualificationVerificationReceipt(state, compensation, "ZERO") ||
    (appliedDeletion &&
      entry.cleanup_status !== "VERIFIED" &&
      !(entry.cleanup_status === "APPLIED" && recoveryPending)) ||
    (uncertainDeletion && !recoveryPending)
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return true;
}

function validateQualificationOperationReceipts(state) {
  const slots = state?.recovery_operation_state?.qualification_operation_slots;
  if (!Array.isArray(slots)) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const resourceByKey = new Map(
    (state.resource_plan ?? []).map((resource) => [
      resource.resource_key,
      resource,
    ]),
  );
  const ledgerByKey = new Map(
    (state.effect_ledger ?? []).map((entry) => [entry.resource_key, entry]),
  );
  for (const slot of slots) {
    if (slot.status !== "RESULT_APPLIED") continue;
    const receipt = slot.receipt;
    let exact = false;
    if (slot.operation === "VERIFY_AUTHORITY_ENVELOPE") {
      exact =
        exactKeys(receipt, [
          "status",
          "candidate_identity_sha256",
          "run_id",
          "phase",
          "operation_class",
          "approval_digest_sha256",
          "freeze_document_sha256",
          "current_retained_state_attestation_sha256",
          "resource_plan_sha256",
          "authority_envelope_sha256",
          "reservation_proof_sha256",
          "operation_slot_sha256",
        ]) &&
        receipt.status === "VERIFIED_AUTHORITY_ENVELOPE" &&
        receipt.candidate_identity_sha256 === state.candidate_identity_sha256 &&
        receipt.run_id === state.run_id &&
        receipt.phase === state.phase &&
        receipt.operation_class === state.operation_class &&
        receipt.approval_digest_sha256 === state.review_approval_sha256 &&
        receipt.freeze_document_sha256 === state.freeze_document_sha256 &&
        receipt.current_retained_state_attestation_sha256 ===
          state.authority_envelope.current_retained_state_attestation_sha256 &&
        receipt.resource_plan_sha256 === state.resource_plan_sha256 &&
        receipt.authority_envelope_sha256 === state.authority_envelope_sha256 &&
        receipt.reservation_proof_sha256 === slot.reservation_proof_sha256 &&
        receipt.operation_slot_sha256 === slot.operation_slot_sha256;
    } else if (slot.operation === "VERIFY_FRESH_RESOURCE_PLAN") {
      const expectedProofs = state.resource_plan.map((resource) => ({
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        status: "ABSENT",
      }));
      const boundedProofs =
        exactKeys(receipt, [
          "status",
          "authority_envelope_sha256",
          "resource_plan_sha256",
          "reservation_proof_sha256",
          "operation_slot_sha256",
          "proofs",
        ]) &&
        ["FRESH", "NOT_FRESH"].includes(receipt.status) &&
        receipt.authority_envelope_sha256 === state.authority_envelope_sha256 &&
        receipt.resource_plan_sha256 === state.resource_plan_sha256 &&
        receipt.reservation_proof_sha256 === slot.reservation_proof_sha256 &&
        receipt.operation_slot_sha256 === slot.operation_slot_sha256 &&
        Array.isArray(receipt.proofs) &&
        receipt.proofs.length === state.resource_plan.length &&
        receipt.proofs.every((proof, index) => {
          const resource = state.resource_plan[index];
          return exactKeys(proof, ["resource_key", "locator_sha256", "status"]) &&
            proof.resource_key === resource.resource_key &&
            proof.locator_sha256 === resource.owner.locator_sha256 &&
            ["ABSENT", "PRESENT"].includes(proof.status);
        });
      exact =
        (boundedProofs &&
          ((receipt.status === "FRESH" &&
            canonicalJson(receipt.proofs) === canonicalJson(expectedProofs)) ||
            (receipt.status === "NOT_FRESH" &&
              receipt.proofs.some((proof) => proof.status === "PRESENT")))) ||
        isFreshResourcePlanFailureReceipt(receipt, {
          authority_envelope_sha256: state.authority_envelope_sha256,
          resource_plan_sha256: state.resource_plan_sha256,
          reservation_proof_sha256: slot.reservation_proof_sha256,
          operation_slot_sha256: slot.operation_slot_sha256,
        });
    } else if (slot.operation === "QUALIFICATION_CREATE_NEW") {
      const resource = resourceByKey.get(slot.resource_key);
      const ledger = ledgerByKey.get(slot.resource_key);
      exact =
        resource !== undefined &&
        exactQualificationCreateReceipt(receipt, slot, resource, state) &&
        ledger?.creation_operation_slot_sha256 ===
          slot.operation_slot_sha256 &&
        ledger?.creation_receipt_sha256 === slot.receipt_sha256;
    } else if (slot.operation === "VERIFY_STAGING_READ_ONLY") {
      exact =
        exactKeys(receipt, [
          "status",
          "writes",
          "reservation_proof_sha256",
          "operation_slot_sha256",
        ]) &&
        receipt.status === "VERIFIED_READ_ONLY" &&
        receipt.writes === 0 &&
        receipt.reservation_proof_sha256 === slot.reservation_proof_sha256 &&
        receipt.operation_slot_sha256 === slot.operation_slot_sha256;
    } else if (slot.operation === "QUALIFICATION_DELETE_EXACT") {
      const resource = resourceByKey.get(slot.resource_key);
      const storage = resource?.resource_type === "STORAGE_OBJECT";
      const versionMismatch = storage && receipt?.status === "VERSION_MISMATCH";
      exact =
        resource !== undefined &&
        exactKeys(receipt, [
          "status",
          "resource_key",
          "locator_sha256",
          "operation_slot_sha256",
          "reservation_proof_sha256",
          ...(storage ? ["expected_version"] : []),
          ...(versionMismatch ? ["observed_version"] : []),
        ]) &&
        (receipt.status === "DELETED_EXACT" || versionMismatch) &&
        receipt.resource_key === resource.resource_key &&
        receipt.locator_sha256 === resource.owner.locator_sha256 &&
        receipt.reservation_proof_sha256 === slot.reservation_proof_sha256 &&
        receipt.operation_slot_sha256 === slot.operation_slot_sha256 &&
        (!storage ||
          (receipt.expected_version ===
            effectiveStorageExpectedVersion(state, resource) &&
            (!versionMismatch ||
              (typeof receipt.observed_version === "string" &&
                receipt.observed_version.length > 0 &&
                receipt.observed_version !== receipt.expected_version))));
    } else if (slot.operation === "QUALIFICATION_VERIFY_CLEANUP") {
      exact =
        exactQualificationVerificationReceipt(state, slot, "SUCCESS") ||
        exactQualificationVerificationReceipt(state, slot, "ZERO");
    }
    if (!exact) throw new KernelError("RECOVERY_STATE_INVALID");
  }
  validateQualificationCompensationChronology(state);
  return true;
}

function validateQualificationCreationLedgerClosure(state, ledger) {
  for (const [planIndex, resource] of state.resource_plan.entries()) {
    const slot = terminalQualificationSlot(
      state,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      resource.resource_key,
    );
    const entry = ledger.ordered.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    if (!entry) {
      if (slot?.status !== "NOT_STARTED") {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    if (entry.creation_receipt_sha256 === null) {
      if (slot?.status === "RESULT_APPLIED") {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    if (
      slot?.status !== "RESULT_APPLIED" ||
      slot.receipt_sha256 !== entry.creation_receipt_sha256 ||
      !exactQualificationCreateReceipt(slot.receipt, slot, resource, state)
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  return true;
}

function validateTerminalQualifiedOperationLedgerClosure(state, ledger) {
  const authority = terminalQualificationSlot(
    state,
    "requests",
    0,
    "VERIFY_AUTHORITY_ENVELOPE",
  );
  const namespace = terminalQualificationSlot(
    state,
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
  );
  const staging = terminalQualificationSlot(
    state,
    "requests",
    2,
    "VERIFY_STAGING_READ_ONLY",
  );
  const finalVerification = terminalQualificationSlot(
    state,
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensationVerification = terminalQualificationSlot(
    state,
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const expectedNamespaceProofs = state.resource_plan.map((resource) => ({
    resource_key: resource.resource_key,
    locator_sha256: resource.owner.locator_sha256,
    status: "ABSENT",
  }));
  if (
    authority?.status !== "RESULT_APPLIED" ||
    !exactKeys(authority.receipt, [
      "status",
      "candidate_identity_sha256",
      "run_id",
      "phase",
      "operation_class",
      "approval_digest_sha256",
      "freeze_document_sha256",
      "current_retained_state_attestation_sha256",
      "resource_plan_sha256",
      "authority_envelope_sha256",
      "reservation_proof_sha256",
      "operation_slot_sha256",
    ]) ||
    authority.receipt.status !== "VERIFIED_AUTHORITY_ENVELOPE" ||
    authority.receipt.candidate_identity_sha256 !== state.candidate_identity_sha256 ||
    authority.receipt.run_id !== state.run_id ||
    authority.receipt.phase !== state.phase ||
    authority.receipt.operation_class !== state.operation_class ||
    authority.receipt.approval_digest_sha256 !== state.review_approval_sha256 ||
    authority.receipt.freeze_document_sha256 !== state.freeze_document_sha256 ||
    authority.receipt.current_retained_state_attestation_sha256 !==
      state.authority_envelope.current_retained_state_attestation_sha256 ||
    authority.receipt.resource_plan_sha256 !== state.resource_plan_sha256 ||
    authority.receipt.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
    authority.receipt.reservation_proof_sha256 !==
      authority.reservation_proof_sha256 ||
    authority.receipt.operation_slot_sha256 !== authority.operation_slot_sha256 ||
    namespace?.status !== "RESULT_APPLIED" ||
    !exactKeys(namespace.receipt, [
      "status",
      "authority_envelope_sha256",
      "resource_plan_sha256",
      "reservation_proof_sha256",
      "operation_slot_sha256",
      "proofs",
    ]) ||
    namespace.receipt.status !== "FRESH" ||
    namespace.receipt.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
    namespace.receipt.resource_plan_sha256 !== state.resource_plan_sha256 ||
    namespace.receipt.reservation_proof_sha256 !==
      namespace.reservation_proof_sha256 ||
    namespace.receipt.operation_slot_sha256 !== namespace.operation_slot_sha256 ||
    canonicalJson(namespace.receipt.proofs) !== canonicalJson(expectedNamespaceProofs) ||
    staging?.status !== "RESULT_APPLIED" ||
    !exactKeys(staging.receipt, [
      "status",
      "writes",
      "reservation_proof_sha256",
      "operation_slot_sha256",
    ]) ||
    staging.receipt.status !== "VERIFIED_READ_ONLY" ||
    staging.receipt.writes !== 0 ||
    staging.receipt.reservation_proof_sha256 !==
      staging.reservation_proof_sha256 ||
    staging.receipt.operation_slot_sha256 !== staging.operation_slot_sha256 ||
    finalVerification?.status !== "RESULT_APPLIED" ||
    compensationVerification?.status !== "NOT_STARTED"
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const retained = ledger.ordered.filter(
    (entry) => entry.cleanup_status === "RETAINED",
  );
  if (retained.length !== 1) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const retainedResource = ledger.byKey.get(retained[0].resource_key);
  if (!retainedResource) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const expectedAbsent = [];
  for (const [planIndex, resource] of state.resource_plan.entries()) {
    const entry = ledger.ordered.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    const deletion = terminalQualificationSlot(
      state,
      "mutations",
      5 + planIndex,
      "QUALIFICATION_DELETE_EXACT",
      resource.resource_key,
    );
    if (resource.resource_key === retainedResource.resource_key) {
      if (deletion?.status !== "NOT_STARTED") {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    const storage = resource.resource_type === "STORAGE_OBJECT";
    if (
      entry?.status !== "CLEANED" ||
      entry.cleanup_status !== "VERIFIED" ||
      deletion?.status !== "RESULT_APPLIED" ||
      !exactKeys(deletion.receipt, [
        "status",
        "resource_key",
        "locator_sha256",
        "operation_slot_sha256",
        "reservation_proof_sha256",
        ...(storage ? ["expected_version"] : []),
      ]) ||
      deletion.receipt.status !== "DELETED_EXACT" ||
      deletion.receipt.resource_key !== resource.resource_key ||
      deletion.receipt.locator_sha256 !== resource.owner.locator_sha256 ||
      deletion.receipt.reservation_proof_sha256 !==
        deletion.reservation_proof_sha256 ||
      deletion.receipt.operation_slot_sha256 !== deletion.operation_slot_sha256 ||
      (storage &&
        deletion.receipt.expected_version !==
          effectiveStorageExpectedVersion(state, resource))
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    expectedAbsent.push(resource.resource_key);
  }
  const expectedPresent = [{
    resource_key: retainedResource.resource_key,
    locator_sha256: retainedResource.owner.locator_sha256,
  }];
  if (
    !exactKeys(finalVerification.receipt, [
      "status",
      "retained_preview_count",
      "verified_present_resources",
      "verified_absent_resource_keys",
      "operation_slot_sha256",
      "reservation_proof_sha256",
    ]) ||
    finalVerification.receipt.status !== "VERIFIED" ||
    finalVerification.receipt.retained_preview_count !== 1 ||
    canonicalJson(finalVerification.receipt.verified_present_resources) !==
      canonicalJson(expectedPresent) ||
    canonicalJson(finalVerification.receipt.verified_absent_resource_keys) !==
      canonicalJson(expectedAbsent) ||
    finalVerification.receipt.operation_slot_sha256 !==
      finalVerification.operation_slot_sha256 ||
    finalVerification.receipt.reservation_proof_sha256 !==
      finalVerification.reservation_proof_sha256
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  validateQualificationCreationLedgerClosure(state, ledger);
  return true;
}

function validateTerminalLocalFailureOperationLedgerClosure(state, ledger) {
  const primaryVerification = terminalQualificationSlot(
    state,
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensationVerification = terminalQualificationSlot(
    state,
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensated = compensationVerification?.status === "RESULT_APPLIED";
  if (state.owned_resources.length === 0) {
    if (
      ledger.ordered.length !== 0 ||
      primaryVerification?.status !== "NOT_STARTED" ||
      compensationVerification?.status !== "NOT_STARTED"
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    validateQualificationCreationLedgerClosure(state, ledger);
    return true;
  }
  if (compensated) {
    if (
      !exactQualificationVerificationReceipt(
        state,
        primaryVerification,
        "SUCCESS",
      ) ||
      !exactQualificationVerificationReceipt(
        state,
        compensationVerification,
        "ZERO",
      )
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  } else if (
    compensationVerification?.status !== "NOT_STARTED" ||
    !exactQualificationVerificationReceipt(
      state,
      primaryVerification,
      "ZERO",
    )
  ) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  for (const [planIndex, resource] of state.resource_plan.entries()) {
    const entry = ledger.ordered.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    const creation = terminalQualificationSlot(
      state,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      resource.resource_key,
    );
    const deletion = terminalQualificationSlot(
      state,
      "mutations",
      5 + planIndex,
      "QUALIFICATION_DELETE_EXACT",
      resource.resource_key,
    );
    if (!entry) continue;
    if (entry.status !== "CLEANED") {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (entry.cleanup_status === "NOT_REQUIRED") {
      if (
        entry.creation_receipt_sha256 !== null ||
        !["NOT_STARTED", "RESERVED"].includes(creation?.status) ||
        deletion?.status !== "NOT_STARTED"
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    const storage = resource.resource_type === "STORAGE_OBJECT";
    if (
      entry.cleanup_status !== "VERIFIED" ||
      !["RESERVED", "RESULT_APPLIED"].includes(creation?.status) ||
      (creation.status === "RESULT_APPLIED" &&
        entry.creation_receipt_sha256 !== creation.receipt_sha256) ||
      (creation.status === "RESERVED" && entry.creation_receipt_sha256 !== null) ||
      deletion?.status !== "RESULT_APPLIED" ||
      !exactKeys(deletion.receipt, [
        "status",
        "resource_key",
        "locator_sha256",
        "operation_slot_sha256",
        "reservation_proof_sha256",
        ...(storage ? ["expected_version"] : []),
      ]) ||
      deletion.receipt.status !== "DELETED_EXACT" ||
      deletion.receipt.resource_key !== resource.resource_key ||
      deletion.receipt.locator_sha256 !== resource.owner.locator_sha256 ||
      deletion.receipt.operation_slot_sha256 !== deletion.operation_slot_sha256 ||
      deletion.receipt.reservation_proof_sha256 !== deletion.reservation_proof_sha256 ||
      (storage &&
        deletion.receipt.expected_version !==
          effectiveStorageExpectedVersion(state, resource))
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (
      !compensated &&
      deletion.reservation_ordinal >= primaryVerification.reservation_ordinal
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  validateQualificationCreationLedgerClosure(state, ledger);
  return true;
}

function exactStatusSensitiveInspectionReceipt({
  receipt,
  operationSlotSha256,
  operationBindingSha256,
  resource,
  creationOperationSlotSha256,
  allowAmbiguous = false,
  requireCreationProofForPresent = true,
  requireExpectedStorageVersion = false,
  expectedStorageVersion = resource?.storage_cas?.expected_version,
}) {
  const storage = resource?.resource_type === "STORAGE_OBJECT";
  const hasObservedVersion = Object.hasOwn(
    receipt ?? {},
    "observed_version",
  );
  const optional = [
    ...(hasObservedVersion
      ? ["observed_version"]
      : []),
    ...(Object.hasOwn(receipt ?? {}, "creation_operation_slot_sha256")
      ? ["creation_operation_slot_sha256"]
      : []),
  ];
  if (
    !exactKeys(receipt, [
      "status",
      "operation_slot_sha256",
      "operation_binding_sha256",
      ...optional,
    ]) ||
    ![
      "ABSENT",
      "PRESENT",
      ...(allowAmbiguous ? ["AMBIGUOUS"] : []),
    ].includes(receipt.status) ||
    receipt.operation_slot_sha256 !== operationSlotSha256 ||
    receipt.operation_binding_sha256 !== operationBindingSha256 ||
    (!storage && hasObservedVersion) ||
    (storage &&
      receipt.status === "PRESENT" &&
      (!hasObservedVersion ||
        typeof receipt.observed_version !== "string" ||
        receipt.observed_version.length === 0)) ||
    (storage &&
      receipt.status !== "PRESENT" &&
      hasObservedVersion &&
      receipt.observed_version !== null) ||
    (creationOperationSlotSha256 === null &&
      Object.hasOwn(receipt, "creation_operation_slot_sha256")) ||
    (creationOperationSlotSha256 !== null &&
      Object.hasOwn(receipt, "creation_operation_slot_sha256") &&
      receipt.creation_operation_slot_sha256 !==
        creationOperationSlotSha256) ||
    (receipt.status === "PRESENT" &&
      requireCreationProofForPresent &&
      receipt.creation_operation_slot_sha256 !==
        creationOperationSlotSha256)
  ) {
    return false;
  }
  if (
    requireExpectedStorageVersion &&
    resource.resource_type === "STORAGE_OBJECT" &&
    receipt.status === "PRESENT" &&
    receipt.observed_version !== expectedStorageVersion
  ) {
    return false;
  }
  return true;
}

function exactTerminalInspectionReceipt(
  receipt,
  slot,
  resource,
  entry,
  expectedStorageVersion = resource?.storage_cas?.expected_version,
) {
  return exactStatusSensitiveInspectionReceipt({
    receipt,
    operationSlotSha256: slot.operation_slot_sha256,
    operationBindingSha256: slot.operation_binding_sha256,
    resource,
    creationOperationSlotSha256: entry.creation_operation_slot_sha256,
    requireExpectedStorageVersion: true,
    expectedStorageVersion,
  });
}

function exactRecoveryOperationReceipt(state, slot) {
  const resource = state.resource_plan.find(
    (candidate) => candidate.resource_key === slot.resource_key,
  );
  if (!resource) return false;
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  if (slot.operation === "RECOVERY_DELETE_EXACT") {
    return exactStatusSensitiveRecoveryDeleteReceipt({
      receipt: slot.receipt,
      operationSlotSha256: slot.operation_slot_sha256,
      operationBindingSha256: slot.operation_binding_sha256,
      resource,
      expectedStorageVersion: effectiveStorageExpectedVersion(state, resource),
    });
  }
  if (
    slot.operation !== "RECOVERY_INSPECT" &&
    slot.operation !== "RECOVERY_VERIFY_ABSENT"
  ) {
    return false;
  }
  const postDelete = slot.operation === "RECOVERY_VERIFY_ABSENT";
  if (postDelete && !entry) return false;
  return exactStatusSensitiveInspectionReceipt({
    receipt: slot.receipt,
    operationSlotSha256: slot.operation_slot_sha256,
    operationBindingSha256: slot.operation_binding_sha256,
    resource,
    creationOperationSlotSha256:
      entry?.creation_operation_slot_sha256 ?? null,
    allowAmbiguous: true,
    requireCreationProofForPresent:
      postDelete ||
      (entry !== undefined &&
        !["INTENT_ONLY", "UNCERTAIN"].includes(entry.status)),
  });
}

function exactRecoveryCreationOwnershipInspection(
  state,
  resource,
  entry,
  inspection,
) {
  if (
    !entry ||
    inspection?.status !== "RESULT_APPLIED" ||
    inspection.receipt?.status !== "PRESENT"
  ) {
    return false;
  }
  const planIndex = state.resource_plan.findIndex(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  const creation = terminalQualificationSlot(
    state,
    "mutations",
    planIndex,
    "QUALIFICATION_CREATE_NEW",
    resource.resource_key,
  );
  return (
    planIndex >= 0 &&
    ["RESERVED", "RESULT_APPLIED"].includes(creation?.status) &&
    entry.creation_operation_slot_sha256 ===
      creation.operation_slot_sha256 &&
    exactStatusSensitiveInspectionReceipt({
      receipt: inspection.receipt,
      operationSlotSha256: inspection.operation_slot_sha256,
      operationBindingSha256: inspection.operation_binding_sha256,
      resource,
      creationOperationSlotSha256:
        entry.creation_operation_slot_sha256,
      allowAmbiguous: false,
      requireCreationProofForPresent: true,
      requireExpectedStorageVersion: false,
    })
  );
}

function exactRecoveryDeleteAuthorizingInspection(
  state,
  resource,
  entry,
  inspection,
) {
  return (
    exactRecoveryCreationOwnershipInspection(
      state,
      resource,
      entry,
      inspection,
    ) &&
    (resource.resource_type !== "STORAGE_OBJECT" ||
      inspection.receipt.observed_version ===
        effectiveStorageExpectedVersion(state, resource))
  );
}

function validateRecoveryFinitePrefixState(state) {
  const invalid = () => {
    throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  };
  for (const resource of state.resource_plan) {
    const entry = state.effect_ledger.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    const inspection = terminalRecoverySlot(
      state,
      "requests",
      6 + state.resource_plan.indexOf(resource) * 2,
      "RECOVERY_INSPECT",
      resource.resource_key,
    );
    const verification = terminalRecoverySlot(
      state,
      "requests",
      7 + state.resource_plan.indexOf(resource) * 2,
      "RECOVERY_VERIFY_ABSENT",
      resource.resource_key,
    );
    const deletion = terminalRecoverySlot(
      state,
      "mutations",
      10 + state.resource_plan.indexOf(resource),
      "RECOVERY_DELETE_EXACT",
      resource.resource_key,
    );
    const deletionUntouched = deletion?.status === "NOT_STARTED";
    const verificationUntouched = verification?.status === "NOT_STARTED";
    const planIndex = state.resource_plan.indexOf(resource);
    const qualificationDelete = terminalQualificationSlot(
      state,
      "mutations",
      5 + planIndex,
      "QUALIFICATION_DELETE_EXACT",
      resource.resource_key,
    );
    const qualificationDeleted =
      qualificationDelete?.status === "RESULT_APPLIED" &&
      qualificationDelete.receipt?.status === "DELETED_EXACT";
    const qualificationMismatch =
      resource.resource_type === "STORAGE_OBJECT" &&
      qualificationDelete?.status === "RESULT_APPLIED" &&
      qualificationDelete.receipt?.status === "VERSION_MISMATCH";

    if (!entry) {
      if (!deletionUntouched || !verificationUntouched) invalid();
      continue;
    }
    const qualificationDeletedExpectedStatus = isSha256(
      entry.creation_receipt_sha256,
    )
      ? "APPLIED"
      : "UNCERTAIN";
    if (
      entry.cleanup_status === "VERSION_MISMATCH_PRESERVED" &&
      qualificationMismatch
    ) {
      if (
        inspection?.status !== "NOT_STARTED" ||
        !deletionUntouched ||
        !verificationUntouched
      ) {
        invalid();
      }
      continue;
    }
    if (inspection?.status !== "RESULT_APPLIED") {
      if (!deletionUntouched || !verificationUntouched) invalid();
      continue;
    }
    const observation = inspection.receipt;
    if (observation.status === "ABSENT") {
      if (
        !deletionUntouched ||
        !verificationUntouched ||
        entry.status !== "CLEANED" ||
        !["NOT_REQUIRED", "VERIFIED"].includes(entry.cleanup_status)
      ) {
        invalid();
      }
      continue;
    }
    if (observation.status !== "PRESENT") {
      if (
        !deletionUntouched ||
        !verificationUntouched ||
        (qualificationDeleted &&
          (entry.status !== qualificationDeletedExpectedStatus ||
            entry.cleanup_status !== "UNCERTAIN"))
      ) {
        invalid();
      }
      continue;
    }
    const creationOwnershipProven =
      exactRecoveryCreationOwnershipInspection(
        state,
        resource,
        entry,
        inspection,
      );
    if (creationOwnershipProven && entry.status === "INTENT_ONLY") {
      invalid();
    }
    if (
      resource.resource_type === "STORAGE_OBJECT" &&
      observation.observed_version !==
        effectiveStorageExpectedVersion(state, resource)
    ) {
      if (
        !deletionUntouched ||
        !verificationUntouched ||
        (creationOwnershipProven
          ? !["APPLIED", "UNCERTAIN"].includes(entry.status) ||
            entry.cleanup_status !== "VERSION_MISMATCH_PRESERVED"
          : entry.cleanup_status === "VERSION_MISMATCH_PRESERVED")
      ) {
        invalid();
      }
      continue;
    }
    if (deletionUntouched) {
      if (
        !verificationUntouched ||
        (qualificationDeleted &&
          resource.resource_type !== "STORAGE_OBJECT" &&
          (entry.status !== qualificationDeletedExpectedStatus ||
            entry.cleanup_status !== "UNCERTAIN")) ||
        (qualificationDeleted &&
          resource.resource_type === "STORAGE_OBJECT" &&
          observation.observed_version ===
            effectiveStorageExpectedVersion(state, resource) &&
          (entry.status !== qualificationDeletedExpectedStatus ||
            entry.cleanup_status !== "UNCERTAIN"))
      ) {
        invalid();
      }
      continue;
    }
    if (
      !exactRecoveryDeleteAuthorizingInspection(
        state,
        resource,
        entry,
        inspection,
      )
    ) {
      invalid();
    }
    if (deletion.status === "RESERVED") {
      if (
        !verificationUntouched ||
        !["APPLIED", "UNCERTAIN"].includes(entry.status) ||
        !["INTENT_ONLY", "UNCERTAIN"].includes(entry.cleanup_status)
      ) {
        invalid();
      }
      continue;
    }
    if (deletion.status === "RECEIPT_KNOWN") {
      if (
        !verificationUntouched ||
        !["APPLIED", "UNCERTAIN"].includes(entry.status) ||
        !["INTENT_ONLY", "UNCERTAIN"].includes(entry.cleanup_status)
      ) {
        invalid();
      }
      continue;
    }
    if (deletion.status !== "RESULT_APPLIED") invalid();
    if (deletion.receipt.status === "VERSION_MISMATCH") {
      if (
        !verificationUntouched ||
        !["APPLIED", "UNCERTAIN"].includes(entry.status) ||
        entry.cleanup_status !== "VERSION_MISMATCH_PRESERVED"
      ) {
        invalid();
      }
      continue;
    }
    if (!["DELETED_EXACT", "ABSENT_VERIFIED"].includes(
      deletion.receipt.status,
    )) {
      invalid();
    }
    if (["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"].includes(
      verification.status,
    )) {
      if (entry.status !== "CLEANED" || entry.cleanup_status !== "APPLIED") {
        invalid();
      }
      continue;
    }
    if (verification.status !== "RESULT_APPLIED") invalid();
    if (verification.receipt.status === "ABSENT") {
      if (entry.status !== "CLEANED" || entry.cleanup_status !== "VERIFIED") {
        invalid();
      }
      continue;
    }
    if (!["PRESENT", "AMBIGUOUS"].includes(verification.receipt.status)) {
      invalid();
    }
    const expectedStatus = isSha256(entry.creation_receipt_sha256)
      ? "APPLIED"
      : "UNCERTAIN";
    if (
      entry.status !== expectedStatus ||
      entry.cleanup_status !== "UNCERTAIN"
    ) {
      invalid();
    }
  }
  return true;
}

function recoveryOperationPrerequisiteReceiptSha256(state, slot) {
  if (slot.operation === "VERIFY_RECOVERY_AUTHORITY") return null;
  const authority = terminalRecoverySlot(
    state,
    "requests",
    5,
    "VERIFY_RECOVERY_AUTHORITY",
    null,
  );
  if (
    slot.operation === "RECOVERY_INSPECT" &&
    authority?.status === "RESULT_APPLIED"
  ) {
    return authority.receipt_sha256;
  }
  const planIndex = state.resource_plan.findIndex(
    (resource) => resource.resource_key === slot.resource_key,
  );
  if (planIndex < 0) return null;
  const resource = state.resource_plan[planIndex];
  if (slot.operation === "RECOVERY_DELETE_EXACT") {
    const inspection = terminalRecoverySlot(
      state,
      "requests",
      6 + planIndex * 2,
      "RECOVERY_INSPECT",
      resource.resource_key,
    );
    const entry = state.effect_ledger.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    return exactRecoveryDeleteAuthorizingInspection(
      state,
      resource,
      entry,
      inspection,
    )
      ? inspection.receipt_sha256
      : null;
  }
  if (slot.operation === "RECOVERY_VERIFY_ABSENT") {
    const deletion = terminalRecoverySlot(
      state,
      "mutations",
      10 + planIndex,
      "RECOVERY_DELETE_EXACT",
      resource.resource_key,
    );
    return deletion?.status === "RESULT_APPLIED" &&
        ["DELETED_EXACT", "ABSENT_VERIFIED"].includes(
          deletion.receipt?.status,
        ) &&
        exactRecoveryOperationReceipt(state, deletion)
      ? deletion.receipt_sha256
      : null;
  }
  return null;
}

function validateTerminalRecoveryLedgerClosure(state, ledger) {
  const ledgerKeys = new Set(ledger.ordered.map((entry) => entry.resource_key));
  for (const [planIndex, resource] of state.resource_plan.entries()) {
    const inspection = terminalRecoverySlot(
      state,
      "requests",
      6 + planIndex * 2,
      "RECOVERY_INSPECT",
      resource.resource_key,
    );
    const verification = terminalRecoverySlot(
      state,
      "requests",
      7 + planIndex * 2,
      "RECOVERY_VERIFY_ABSENT",
      resource.resource_key,
    );
    const deletion = terminalRecoverySlot(
      state,
      "mutations",
      10 + planIndex,
      "RECOVERY_DELETE_EXACT",
      resource.resource_key,
    );
    if (!ledgerKeys.has(resource.resource_key)) {
      if (
        inspection?.status !== "RESULT_APPLIED" ||
        !exactTerminalInspectionReceipt(
          inspection.receipt,
          inspection,
          resource,
          { creation_operation_slot_sha256: null },
          effectiveStorageExpectedVersion(state, resource),
        ) ||
        inspection.receipt.status !== "ABSENT" ||
        verification?.status !== "NOT_STARTED" ||
        deletion?.status !== "NOT_STARTED"
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    const entry = ledger.ordered.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    if (
      inspection?.status !== "RESULT_APPLIED" ||
      !exactTerminalInspectionReceipt(
        inspection.receipt,
        inspection,
        resource,
        entry,
        effectiveStorageExpectedVersion(state, resource),
      )
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    if (inspection.receipt.status === "ABSENT") {
      if (
        deletion?.status !== "NOT_STARTED" ||
        verification?.status !== "NOT_STARTED" ||
        entry.status !== "CLEANED" ||
        !["VERIFIED", "NOT_REQUIRED"].includes(entry.cleanup_status) ||
        (entry.creation_receipt_sha256 !== null &&
          entry.cleanup_status === "NOT_REQUIRED")
      ) {
        throw new KernelError("RECOVERY_STATE_INVALID");
      }
      continue;
    }
    const deletionReceipt = deletion?.receipt;
    const storage = resource.resource_type === "STORAGE_OBJECT";
    if (
      deletion?.status !== "RESULT_APPLIED" ||
      verification?.status !== "RESULT_APPLIED" ||
      entry.status !== "CLEANED" ||
      entry.cleanup_status !== "VERIFIED" ||
      !exactKeys(deletionReceipt, [
        "status",
        "resource_key",
        "locator_sha256",
        "operation_slot_sha256",
        "operation_binding_sha256",
        ...(storage ? ["expected_version"] : []),
      ]) ||
      !["DELETED_EXACT", "ABSENT_VERIFIED"].includes(
        deletionReceipt.status,
      ) ||
      deletionReceipt.resource_key !== resource.resource_key ||
      deletionReceipt.locator_sha256 !== resource.owner.locator_sha256 ||
      deletionReceipt.operation_slot_sha256 !==
        deletion.operation_slot_sha256 ||
      deletionReceipt.operation_binding_sha256 !==
        deletion.operation_binding_sha256 ||
      (storage &&
        deletionReceipt.expected_version !==
          effectiveStorageExpectedVersion(state, resource)) ||
      !exactTerminalInspectionReceipt(
        verification.receipt,
        verification,
        resource,
        entry,
        effectiveStorageExpectedVersion(state, resource),
      ) ||
      verification.receipt.status !== "ABSENT"
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
  }
  return true;
}

export function validateTerminalState(state) {
  try {
    assertEvidenceSafe(state);
    checkpointStatePayload(state);
    validateActivationSemanticParity(state);
    validateQualificationOperationReceipts(state);
  } catch {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  try {
    validateJournalProtocol(state);
  } catch {
    throw new KernelError("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  let ledger;
  try {
    ledger = validateLedger(state);
    validateCheckpointProtocol(state);
  } catch (error) {
    throw new KernelError(
      error?.code === "RECOVERY_LEDGER_SHAPE"
        ? "RECOVERY_STATE_INVALID"
        : "RECOVERY_JOURNAL_IDENTITY_MISMATCH",
    );
  }
  let finalTransition;
  try {
    if (!validReservationBudgetAccounting(state)) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    finalTransition = validateSemanticTransitionHistory(state);
  } catch {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  const qualified =
    state.lifecycle_state === "QUALIFIED" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    exactKeys(state.cleanup, ["required", "verified"]) &&
    state.cleanup.required === true &&
    state.cleanup.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    exactKeys(state.outcome, ["code", "successful"]) &&
    state.outcome.code === "QUALIFIED" &&
    state.outcome.successful === true &&
    isSha256(state.final_evidence_identity_sha256) &&
    canonicalJson(state.owned_resources) === canonicalJson(state.resource_plan) &&
    finalTransition?.from === "QUALIFYING" &&
    finalTransition?.to === "QUALIFIED" &&
    finalTransition.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    finalTransition.review_sha256 === state.review_approval_sha256;
  if (qualified) {
    const retained = ledger.ordered.filter(
      (entry) => entry.cleanup_status === "RETAINED",
    );
    const retainedResource = retained.length === 1
      ? ledger.byKey.get(retained[0].resource_key)
      : null;
    if (
      retained.length !== 1 ||
      retained[0].status !== "APPLIED" ||
      retainedResource?.resource_type !== "PREVIEW_DEPLOYMENT" ||
      retainedResource?.owner?.cleanup_policy !==
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW" ||
      ledger.ordered.some(
        (entry) =>
          entry.resource_key !== retained[0].resource_key &&
          (entry.status !== "CLEANED" || entry.cleanup_status !== "VERIFIED"),
      )
    ) {
      throw new KernelError("RECOVERY_STATE_INVALID");
    }
    validateTerminalQualifiedOperationLedgerClosure(state, ledger);
    return { terminal_kind: "QUALIFIED", ledger };
  }
  const localFailedClosed =
    state.lifecycle_state === "FAILED_CLOSED" &&
    state.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    exactKeys(state.cleanup, ["required", "verified"]) &&
    state.cleanup.required === (state.owned_resources.length > 0) &&
    state.cleanup.verified === true &&
    exactKeys(state.recovery, ["status"]) &&
    state.recovery.status === "NOT_REQUIRED" &&
    exactKeys(state.outcome, ["code", "successful"]) &&
    LOCAL_QUALIFICATION_FAILURE_CODES.has(state.outcome.code) &&
    state.outcome.successful === false &&
    isSha256(state.final_evidence_identity_sha256) &&
    finalTransition?.from === "QUALIFYING" &&
    finalTransition?.to === "FAILED_CLOSED" &&
    finalTransition.authorization_class ===
      AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
    finalTransition.review_sha256 === state.review_approval_sha256 &&
    state.recovery_operation_state.recovery_anchor === null &&
    state.recovery_operation_state.recovery_grant === null &&
    state.recovery_operation_state.operation_slots.every(
      (slot) => slot.status === "NOT_STARTED",
    );
  if (localFailedClosed) {
    validateTerminalLocalFailureOperationLedgerClosure(state, ledger);
    return { terminal_kind: "FAILED_CLOSED", ledger };
  }
  validateGrantedRecoveryJournal(state);
  validateQualificationCreationLedgerClosure(state, ledger);
  validateTerminalRecoveryLedgerClosure(state, ledger);
  const recoveredReady =
    state.lifecycle_state === "READY" &&
    state.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    exactKeys(state.cleanup, ["required", "verified"]) &&
    state.cleanup.required === (state.owned_resources.length > 0) &&
    state.cleanup.verified === true &&
    exactKeys(state.recovery, ["status", "resume_to"]) &&
    state.recovery.status === "COMPLETE" &&
    state.recovery.resume_to === "READY" &&
    exactKeys(state.outcome, ["code", "successful"]) &&
    state.outcome.code === "RESUME_AUTHORIZED" &&
    state.outcome.successful === true &&
    finalTransition?.from === "FAILED_RECOVERABLE" &&
    finalTransition?.to === "READY" &&
    finalTransition.authorization_class === AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER &&
    finalTransition.review_sha256 === state.review_approval_sha256 &&
    ledger.ordered.every(
      (entry) =>
        entry.status === "CLEANED" &&
        ["VERIFIED", "NOT_REQUIRED"].includes(entry.cleanup_status),
    );
  if (!recoveredReady) {
    throw new KernelError("RECOVERY_STATE_INVALID");
  }
  return { terminal_kind: "RECOVERY_COMPLETE", ledger };
}

function restoreMutableState(target, snapshot) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, structuredClone(snapshot));
}

async function mutateRecoveryStateAndPersist(state, persist, mutation) {
  const before = structuredClone(state);
  try {
    mutation();
    validateRecoveryOperationState(state);
    if (state.recovery_operation_state.recovery_grant !== null) {
      validateGrantedRecoveryJournal(state);
    }
    await persist();
  } catch (error) {
    restoreMutableState(state, before);
    throw error;
  }
}

function findRecoveryOperationSlot(
  state,
  category,
  index,
  operation,
  resourceKey,
) {
  const record = state.recovery_operation_state?.operation_slots?.find(
    (slot) =>
      slot.category === category &&
      slot.index === index &&
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
  if (!record) throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  return record;
}

export async function obtainRecoveryOperationReceipt({
  state,
  category,
  index,
  operation,
  resource_key = null,
  persist,
  invoke,
  on_reserve = () => {},
  validate_receipt = () => true,
}) {
  if (
    typeof persist !== "function" ||
    typeof invoke !== "function" ||
    typeof validate_receipt !== "function"
  ) {
    throw new KernelError("RECOVERY_ADAPTER");
  }
  validateGrantedRecoveryJournal(state);
  const anchor = state.recovery_operation_state.recovery_anchor;
  if (anchor === null) throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
  let record = findRecoveryOperationSlot(
    state,
    category,
    index,
    operation,
    resource_key,
  );
  if (record.status === "NOT_STARTED") {
    await mutateRecoveryStateAndPersist(state, persist, () => {
      const mutable = findRecoveryOperationSlot(
        state,
        category,
        index,
        operation,
        resource_key,
      );
      const prerequisiteReceiptSha256 =
        recoveryOperationPrerequisiteReceiptSha256(state, mutable);
      if (
        mutable.operation !== "VERIFY_RECOVERY_AUTHORITY" &&
        !isSha256(prerequisiteReceiptSha256)
      ) {
        throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
      }
      state.budgets = consumeBudget(state.budgets, category);
      mutable.operation_binding_sha256 = deriveRecoveryOperationBindingSha256({
        journal_identity_sha256: state.journal_identity_sha256,
        recovery_anchor_checkpoint_identity_sha256:
          anchor.checkpoint_identity_sha256,
        operation_slot_sha256: mutable.operation_slot_sha256,
        prerequisite_receipt_sha256: prerequisiteReceiptSha256,
      });
      mutable.status = "RESERVED";
      on_reserve();
    });
    record = findRecoveryOperationSlot(
      state,
      category,
      index,
      operation,
      resource_key,
    );
  }
  const operationSlot = deriveOperationSlot({
    operation_reservation: state.operation_reservation,
    category,
    index,
    operation,
    resource_key,
  });
  if (record.status === "RESERVED") {
    let received;
    try {
      received = await invoke({
        recovery_anchor: structuredClone(anchor),
        operation_binding_sha256: record.operation_binding_sha256,
        operation_slot: operationSlot,
      });
      assertEvidenceSafe(received);
      received = structuredClone(received);
      canonicalJson(received);
      if (
        validate_receipt(received, {
          operation_binding_sha256: record.operation_binding_sha256,
          operation_slot: operationSlot,
        }) !== true
      ) {
        throw new KernelError("OPERATION_RECEIPT_MISMATCH");
      }
    } catch (error) {
      if (error instanceof KernelError) throw error;
      throw new KernelError("RECOVERY_OPERATION_FAILED");
    }
    await mutateRecoveryStateAndPersist(state, persist, () => {
      const mutable = findRecoveryOperationSlot(
        state,
        category,
        index,
        operation,
        resource_key,
      );
      mutable.receipt = structuredClone(received);
      mutable.receipt_sha256 = sha256Hex(canonicalJson(received));
      mutable.status = "RECEIPT_KNOWN";
    });
    record = findRecoveryOperationSlot(
      state,
      category,
      index,
      operation,
      resource_key,
    );
  }
  const receipt = structuredClone(record.receipt);
  const alreadyApplied = record.status === "RESULT_APPLIED";
  return {
    receipt,
    already_applied: alreadyApplied,
    operation_binding_sha256: record.operation_binding_sha256,
    operation_slot: operationSlot,
    async applyResult(mutation = () => {}) {
      const current = findRecoveryOperationSlot(
        state,
        category,
        index,
        operation,
        resource_key,
      );
      if (current.status === "RESULT_APPLIED") return false;
      if (current.status !== "RECEIPT_KNOWN") {
        throw new KernelError("RECOVERY_OPERATION_STATE_INVALID");
      }
      await mutateRecoveryStateAndPersist(state, persist, () => {
        mutation();
        findRecoveryOperationSlot(
          state,
          category,
          index,
          operation,
          resource_key,
        ).status = "RESULT_APPLIED";
      });
      return true;
    },
  };
}

const RECOVERY_FAILURE_CODES = new Set([
  "AUTHORIZATION_CLASS_MISMATCH",
  "BUDGET_EXHAUSTED",
  "CANDIDATE_MISMATCH",
  "CLEANED_EFFECT_PRESENT",
  "CLEANUP_VERIFICATION_FAILED",
  "INSPECTION_FAILED",
  "INSPECTION_INVALID",
  "INTENT_OWNERSHIP_UNPROVEN",
  "OPERATION_RECEIPT_MISMATCH",
  "OWNERSHIP_AMBIGUOUS",
  "OWNERSHIP_UNPROVEN",
  "RECONCILIATION_FAILED",
  "RECOVERY_ADAPTER",
  "RECOVERY_AUTHORITY_MISMATCH",
  "RECOVERY_CAPABILITY_REQUIRED",
  "RECOVERY_CHECKPOINT_FAILED",
  "RECOVERY_HEAD_UNKNOWN",
  "RECOVERY_JOURNAL_IDENTITY_MISMATCH",
  "RECOVERY_STATE_INVALID",
  "RECOVERY_STATE_LOAD_FAILED",
  "RECOVERY_TERMINAL_CHECKPOINT_FAILED",
  "STORAGE_CAS_PROOF_MISMATCH",
  "STORAGE_VERSION_MISMATCH",
]);

export function createRecoveryFailureProjection(state, code) {
  const categoricalCode = RECOVERY_FAILURE_CODES.has(code)
    ? code
    : "RECOVERY_STATE_INVALID";
  return {
    schema_version: 1,
    result_type: "RECOVERY_FAILURE_PROJECTION",
    candidate_identity_sha256: isSha256(state?.candidate_identity_sha256)
      ? state.candidate_identity_sha256
      : "0".repeat(64),
    authorization_class: AUTHORIZATION_CLASSES.NONE,
    lifecycle_state: "FAILED_RECOVERABLE",
    cleanup: { required: true, verified: false },
    recovery: { status: "PENDING", resume_to: "READY" },
    checkpoint_disposition: "UNKNOWN",
    outcome: { code: categoricalCode, successful: false },
  };
}

function failedRecovery(state, code) {
  return createRecoveryFailureProjection(state, code);
}

export async function reconcileRecovery({
  loadAuthoritativeState,
  expectedCandidateIdentity,
  authorization,
  recovery_capability_sha256,
  checkpointRecoveryState,
  readCheckpointHead,
  inspectOwnedResource,
  reconcileOwnedResource,
}) {
  if (
    typeof loadAuthoritativeState !== "function" ||
    typeof checkpointRecoveryState !== "function" ||
    typeof readCheckpointHead !== "function" ||
    typeof inspectOwnedResource !== "function" ||
    typeof reconcileOwnedResource !== "function"
  ) {
    return failedRecovery(null, "RECOVERY_ADAPTER");
  }
  let state;
  try {
    const loaded = await loadAuthoritativeState();
    assertEvidenceSafe(loaded);
    state = structuredClone(loaded);
  } catch {
    return failedRecovery(null, "RECOVERY_STATE_LOAD_FAILED");
  }
  if (
    !isSha256(expectedCandidateIdentity) ||
    state?.candidate_identity_sha256 !== expectedCandidateIdentity ||
    authorization?.candidate_identity_sha256 !== expectedCandidateIdentity
  ) {
    return failedRecovery(state, "CANDIDATE_MISMATCH");
  }
  if (
    !validAuthorization(authorization) ||
    authorization.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER
  ) {
    return failedRecovery(state, "AUTHORIZATION_CLASS_MISMATCH");
  }
  let ledger;
  try {
    ledger = validateRecoveryState(state);
    state = copyJournalState(state);
    ledger = validateLedger(state);
  } catch (error) {
    return failedRecovery(
      state,
      error?.code === "RECOVERY_STATE_INVALID"
        ? "RECOVERY_STATE_INVALID"
        : error?.code === "RECOVERY_JOURNAL_IDENTITY_MISMATCH"
          ? "RECOVERY_JOURNAL_IDENTITY_MISMATCH"
          : error?.code === "OWNERSHIP_AMBIGUOUS"
            ? "OWNERSHIP_AMBIGUOUS"
            : "OWNERSHIP_UNPROVEN",
    );
  }

  const recoveryState = () => structuredClone(state);
  const fail = (code) => failedRecovery(recoveryState(), code);
  const durableGrant = state.recovery_operation_state.recovery_grant;
  const durableAuthorityReceipt =
    state.recovery_operation_state.operation_slots.find(
      (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
    )?.receipt;
  if (durableGrant === null) {
    return fail("RECOVERY_CAPABILITY_REQUIRED");
  }
  if (
    authorization.authorization_class !== durableGrant.authorization_class ||
    authorization.candidate_identity_sha256 !== state.candidate_identity_sha256 ||
    authorization.review_sha256 !== durableGrant.review_sha256 ||
    durableAuthorityReceipt?.approval_digest_sha256 !== durableGrant.review_sha256 ||
    state.review_approval_sha256 !== durableGrant.review_sha256
  ) {
    return fail("RECOVERY_AUTHORITY_MISMATCH");
  }
  const durableAuthorization = {
    schema_version: 1,
    authorization_class: durableGrant.authorization_class,
    candidate_identity_sha256: state.candidate_identity_sha256,
    review_sha256: durableGrant.review_sha256,
  };
  let expectedCapabilitySha256;
  try {
    expectedCapabilitySha256 = deriveRecoveryCapabilitySha256(state);
  } catch {
    return fail("RECOVERY_CAPABILITY_REQUIRED");
  }
  if (recovery_capability_sha256 !== expectedCapabilitySha256) {
    return fail("RECOVERY_CAPABILITY_REQUIRED");
  }
  let authoritativeHead;
  try {
    authoritativeHead = await readCheckpointHead({
      schema_version: 1,
      journal_identity_sha256: state.journal_identity_sha256,
      expected_checkpoint_sequence: state.checkpoint.sequence,
      expected_predecessor_checkpoint_identity_sha256:
        state.checkpoint.predecessor_checkpoint_identity_sha256,
      expected_checkpoint_identity_sha256:
        state.checkpoint.checkpoint_identity_sha256,
    });
    assertEvidenceSafe(authoritativeHead);
  } catch {
    return fail("RECOVERY_HEAD_UNKNOWN");
  }
  if (
    !exactKeys(authoritativeHead, [
      "schema_version",
      "status",
      "journal_identity_sha256",
      "checkpoint_sequence",
      "predecessor_checkpoint_identity_sha256",
      "checkpoint_identity_sha256",
    ]) ||
    authoritativeHead.schema_version !== 1 ||
    authoritativeHead.status !== "CHECKPOINT_PRESENT" ||
    authoritativeHead.journal_identity_sha256 !== state.journal_identity_sha256 ||
    authoritativeHead.checkpoint_sequence !== state.checkpoint.sequence ||
    authoritativeHead.predecessor_checkpoint_identity_sha256 !==
      state.checkpoint.predecessor_checkpoint_identity_sha256 ||
    authoritativeHead.checkpoint_identity_sha256 !==
      state.checkpoint.checkpoint_identity_sha256
  ) {
    return fail("RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  }
  const persist = async () => {
    await commitDurableCheckpoint(state, checkpointRecoveryState, {
      read_authoritative_head: readCheckpointHead,
    });
  };
  const planIndex = (resource) =>
    state.resource_plan.findIndex(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
  const creationSlot = (resource) =>
    deriveOperationSlot({
      operation_reservation: state.operation_reservation,
      category: "mutations",
      index: planIndex(resource),
      operation: "QUALIFICATION_CREATE_NEW",
      resource_key: resource.resource_key,
    });
  const exactInspectReceipt = (receipt, handle, resource, entryStatus) => {
    return exactStatusSensitiveInspectionReceipt({
      receipt,
      operationSlotSha256: handle.operation_slot.operation_slot_sha256,
      operationBindingSha256: handle.operation_binding_sha256,
      resource,
      creationOperationSlotSha256:
        entryStatus === null
          ? null
          : creationSlot(resource).operation_slot_sha256,
      allowAmbiguous: true,
      requireCreationProofForPresent:
        entryStatus !== null &&
        !["INTENT_ONLY", "UNCERTAIN"].includes(entryStatus),
    });
  };
  const inspect = async (resource, postMutation = false, entryStatus = null) => {
    const planPosition = planIndex(resource);
    const handle = await obtainRecoveryOperationReceipt({
      state,
      category: "requests",
      index: 6 + planPosition * 2 + (postMutation ? 1 : 0),
      operation: postMutation ? "RECOVERY_VERIFY_ABSENT" : "RECOVERY_INSPECT",
      resource_key: resource.resource_key,
      persist,
      invoke: (context) =>
        inspectOwnedResource(structuredClone(resource), {
          journal_identity_sha256: state.journal_identity_sha256,
          authority_envelope_sha256: state.authority_envelope_sha256,
          recovery_anchor: context.recovery_anchor,
          operation_binding_sha256: context.operation_binding_sha256,
          operation_slot: context.operation_slot,
        }),
      validate_receipt: (receipt, context) =>
        exactStatusSensitiveInspectionReceipt({
          receipt,
          operationSlotSha256:
            context.operation_slot.operation_slot_sha256,
          operationBindingSha256: context.operation_binding_sha256,
          resource,
          creationOperationSlotSha256:
            entryStatus === null
              ? null
              : creationSlot(resource).operation_slot_sha256,
          allowAmbiguous: true,
          requireCreationProofForPresent:
            entryStatus !== null &&
            !["INTENT_ONLY", "UNCERTAIN"].includes(entryStatus),
        }),
    });
    if (!exactInspectReceipt(handle.receipt, handle, resource, entryStatus)) {
      throw new KernelError("OPERATION_RECEIPT_MISMATCH");
    }
    return handle;
  };
  const exactReconciliationReceipt = (receipt, handle, resource, casContract) => {
    return exactStatusSensitiveRecoveryDeleteReceipt({
      receipt,
      operationSlotSha256:
        handle.operation_slot.operation_slot_sha256,
      operationBindingSha256: handle.operation_binding_sha256,
      resource: resource.resource_type === "STORAGE_OBJECT"
        ? {
            ...resource,
            storage_cas: {
              ...resource.storage_cas,
              expected_version: casContract.expected_version,
            },
          }
        : resource,
    });
  };
  let recoveryFailureCode = null;
  const rememberFailure = (code) => {
    recoveryFailureCode ??= code;
  };
  const checkpointFailure = (error) =>
    typeof error?.code === "string" &&
    (error.code === "RECOVERY_CHECKPOINT_FAILED" ||
      error.code.startsWith("CHECKPOINT_"));
  const applyPostDeleteVerification = async (handle, entrySequence) => {
    const verification = handle.receipt;
    if (verification?.status !== "ABSENT") {
      await handle.applyResult(() => {
        const uncertainEntry = state.effect_ledger.find(
          (candidate) => candidate.sequence === entrySequence,
        );
        uncertainEntry.status = isSha256(
          uncertainEntry.creation_receipt_sha256,
        )
          ? "APPLIED"
          : "UNCERTAIN";
        uncertainEntry.cleanup_status = "UNCERTAIN";
      });
      rememberFailure("CLEANUP_VERIFICATION_FAILED");
      return;
    }
    await handle.applyResult(() => {
      const verifiedEntry = state.effect_ledger.find(
        (candidate) => candidate.sequence === entrySequence,
      );
      verifiedEntry.status = "CLEANED";
      verifiedEntry.cleanup_status = "VERIFIED";
    });
  };
  for (const resource of [...state.resource_plan].reverse()) {
    const entry = ledger.ordered.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    if (!entry) {
      let inspection;
      try {
        inspection = await inspect(resource, false, null);
      } catch (error) {
        if (
          error?.code === "BUDGET_EXHAUSTED" ||
          checkpointFailure(error)
        ) {
          return fail(
            error?.code === "BUDGET_EXHAUSTED"
              ? "BUDGET_EXHAUSTED"
              : "RECOVERY_CHECKPOINT_FAILED",
          );
        }
        rememberFailure(
          error?.code === "OPERATION_RECEIPT_MISMATCH"
            ? "OPERATION_RECEIPT_MISMATCH"
            : "INSPECTION_FAILED",
        );
        continue;
      }
      try {
        await inspection.applyResult();
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      if (inspection.receipt?.status === "PRESENT") {
        rememberFailure("INTENT_OWNERSHIP_UNPROVEN");
      } else if (inspection.receipt?.status === "AMBIGUOUS") {
        rememberFailure("OWNERSHIP_AMBIGUOUS");
      } else if (inspection.receipt?.status !== "ABSENT") {
        rememberFailure("INSPECTION_INVALID");
      }
      continue;
    }
    let current = state.effect_ledger.find(
      (candidate) => candidate.sequence === entry.sequence,
    );
    const qualificationDeleteSlot = state.recovery_operation_state
      .qualification_operation_slots.find(
        (slot) =>
          slot.category === "mutations" &&
          slot.index === 5 + planIndex(resource) &&
          slot.operation === "QUALIFICATION_DELETE_EXACT" &&
          slot.resource_key === resource.resource_key,
      );
    const qualificationCleanupApplied =
      qualificationDeleteSlot?.status === "RESULT_APPLIED" &&
      qualificationDeleteSlot.receipt?.status === "DELETED_EXACT";
    if (current.cleanup_status === "VERSION_MISMATCH_PRESERVED") {
      rememberFailure(
        resource.resource_type === "STORAGE_OBJECT"
          ? "STORAGE_VERSION_MISMATCH"
          : "RECOVERY_STATE_INVALID",
      );
      continue;
    }
    let inspection;
    try {
      const verificationSlot = state.recovery_operation_state.operation_slots.find(
        (slot) =>
          slot.category === "requests" &&
          slot.index === 7 + planIndex(resource) * 2 &&
          slot.operation === "RECOVERY_VERIFY_ABSENT" &&
          slot.resource_key === resource.resource_key,
      );
      const deletionSlot = state.recovery_operation_state.operation_slots.find(
        (slot) =>
          slot.category === "mutations" &&
          slot.index === 10 + planIndex(resource) &&
          slot.operation === "RECOVERY_DELETE_EXACT" &&
          slot.resource_key === resource.resource_key,
      );
      inspection = await inspect(
        resource,
        verificationSlot?.status !== "NOT_STARTED" ||
          (deletionSlot?.status === "RESULT_APPLIED" &&
            ["DELETED_EXACT", "ABSENT_VERIFIED"].includes(
              deletionSlot.receipt?.status,
            )),
        current.status,
      );
    } catch (error) {
      if (
        error?.code === "BUDGET_EXHAUSTED" ||
        checkpointFailure(error)
      ) {
        return fail(
          error?.code === "BUDGET_EXHAUSTED"
            ? "BUDGET_EXHAUSTED"
            : "RECOVERY_CHECKPOINT_FAILED",
        );
      }
      rememberFailure(
        error?.code === "OPERATION_RECEIPT_MISMATCH"
          ? "OPERATION_RECEIPT_MISMATCH"
          : "INSPECTION_FAILED",
      );
      continue;
    }
    const observation = inspection.receipt;
    if (!observation || !["ABSENT", "PRESENT", "AMBIGUOUS"].includes(observation.status)) {
      rememberFailure("INSPECTION_INVALID");
      continue;
    }
    if (inspection.operation_slot.operation === "RECOVERY_VERIFY_ABSENT") {
      try {
        await applyPostDeleteVerification(inspection, entry.sequence);
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      continue;
    }
    if (observation.status === "AMBIGUOUS") {
      try {
        await inspection.applyResult(() => {
          const ambiguousEntry = state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          );
          if (
            ambiguousEntry.status === "CLEANED" &&
            qualificationCleanupApplied
          ) {
            ambiguousEntry.status = isSha256(
              ambiguousEntry.creation_receipt_sha256,
            )
              ? "APPLIED"
              : "UNCERTAIN";
            ambiguousEntry.cleanup_status = "UNCERTAIN";
          }
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("OWNERSHIP_AMBIGUOUS");
      continue;
    }
    if (current.status === "CLEANED" && observation.status === "ABSENT") {
      try {
        await inspection.applyResult(() => {
          current = state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          );
          if (!["VERIFIED", "NOT_REQUIRED"].includes(current.cleanup_status)) {
            current.cleanup_status = "VERIFIED";
          }
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      continue;
    }
    if (
      current.status === "CLEANED" &&
      observation.status === "PRESENT" &&
      !qualificationCleanupApplied
    ) {
      try {
        await inspection.applyResult();
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("INTENT_OWNERSHIP_UNPROVEN");
      continue;
    }
    if (observation.status === "ABSENT") {
      try {
        await inspection.applyResult(() => {
          current = state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          );
          current.status = "CLEANED";
          current.cleanup_status =
            current.cleanup_status === "NOT_REQUIRED" ? "NOT_REQUIRED" : "VERIFIED";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      continue;
    }
    if (["INTENT_ONLY", "UNCERTAIN"].includes(current.status)) {
      const expectedCreationSlot = creationSlot(resource);
      const qualificationCreateRecord =
        state.recovery_operation_state.qualification_operation_slots.find(
          (slot) =>
            slot.operation_slot_sha256 ===
              expectedCreationSlot.operation_slot_sha256,
        );
      if (
        !["RESERVED", "RESULT_APPLIED"].includes(
          qualificationCreateRecord?.status,
        ) ||
        observation.creation_operation_slot_sha256 !==
          expectedCreationSlot.operation_slot_sha256
      ) {
        try {
          await inspection.applyResult();
        } catch {
          return fail("RECOVERY_CHECKPOINT_FAILED");
        }
        rememberFailure("INTENT_OWNERSHIP_UNPROVEN");
        continue;
      }
    }
    let casContract;
    if (resource.resource_type === "STORAGE_OBJECT") {
      casContract = {
        expected_version: effectiveStorageExpectedVersion(state, resource),
        delete_capability_sha256: resource.storage_cas.delete_capability_sha256,
      };
      if (observation.observed_version !== casContract.expected_version) {
        try {
          await inspection.applyResult(() => {
            const appliedEntry = state.effect_ledger.find(
              (candidate) => candidate.sequence === entry.sequence,
            );
            appliedEntry.status = isSha256(
              appliedEntry.creation_receipt_sha256,
            )
              ? "APPLIED"
              : "UNCERTAIN";
            appliedEntry.cleanup_status = "VERSION_MISMATCH_PRESERVED";
          });
        } catch {
          return fail("RECOVERY_CHECKPOINT_FAILED");
        }
        rememberFailure("STORAGE_VERSION_MISMATCH");
        continue;
      }
    }
    try {
      await inspection.applyResult(() => {
        const appliedEntry = state.effect_ledger.find(
          (candidate) => candidate.sequence === entry.sequence,
        );
        if (appliedEntry.status === "CLEANED") {
          appliedEntry.status = isSha256(
            appliedEntry.creation_receipt_sha256,
          )
            ? "APPLIED"
            : "UNCERTAIN";
          appliedEntry.cleanup_status = "UNCERTAIN";
        } else if (["INTENT_ONLY", "UNCERTAIN"].includes(appliedEntry.status)) {
          appliedEntry.status = "UNCERTAIN";
        }
      });
    } catch {
      return fail("RECOVERY_CHECKPOINT_FAILED");
    }
    let deletion;
    try {
      deletion = await obtainRecoveryOperationReceipt({
        state,
        category: "mutations",
        index: 10 + planIndex(resource),
        operation: "RECOVERY_DELETE_EXACT",
        resource_key: resource.resource_key,
        persist,
        on_reserve: () => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "INTENT_ONLY";
        },
        invoke: (context) =>
          reconcileOwnedResource(
            structuredClone(resource),
            casContract,
            {
              journal_identity_sha256: state.journal_identity_sha256,
              authority_envelope_sha256: state.authority_envelope_sha256,
              recovery_anchor: context.recovery_anchor,
              operation_binding_sha256: context.operation_binding_sha256,
              operation_slot: context.operation_slot,
            },
          ),
        validate_receipt: (receipt, context) =>
          exactStatusSensitiveRecoveryDeleteReceipt({
            receipt,
            operationSlotSha256:
              context.operation_slot.operation_slot_sha256,
            operationBindingSha256:
              context.operation_binding_sha256,
            resource,
            expectedStorageVersion: casContract?.expected_version,
          }),
      });
    } catch (error) {
      if (checkpointFailure(error)) {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      try {
        await mutateRecoveryStateAndPersist(state, persist, () => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "UNCERTAIN";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      if (error?.code === "BUDGET_EXHAUSTED") {
        return fail("BUDGET_EXHAUSTED");
      }
      rememberFailure(
        error?.code === "OPERATION_RECEIPT_MISMATCH"
          ? "OPERATION_RECEIPT_MISMATCH"
          : "RECONCILIATION_FAILED",
      );
      continue;
    }
    const reconciliation = deletion.receipt;
    if (!exactReconciliationReceipt(
      reconciliation,
      deletion,
      resource,
      casContract,
    )) {
      try {
        await mutateRecoveryStateAndPersist(state, persist, () => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "UNCERTAIN";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("OPERATION_RECEIPT_MISMATCH");
      continue;
    }
    if (
      resource.resource_type === "STORAGE_OBJECT" &&
      reconciliation?.status === "VERSION_MISMATCH"
    ) {
      try {
        await deletion.applyResult(() => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "VERSION_MISMATCH_PRESERVED";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("STORAGE_VERSION_MISMATCH");
      continue;
    }
    if (!reconciliation || !["DELETED_EXACT", "ABSENT_VERIFIED"].includes(reconciliation.status)) {
      try {
        await mutateRecoveryStateAndPersist(state, persist, () => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "UNCERTAIN";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("RECONCILIATION_FAILED");
      continue;
    }
    if (
      resource.resource_type === "STORAGE_OBJECT" &&
      reconciliation.expected_version !== casContract.expected_version
    ) {
      try {
        await mutateRecoveryStateAndPersist(state, persist, () => {
          state.effect_ledger.find(
            (candidate) => candidate.sequence === entry.sequence,
          ).cleanup_status = "UNCERTAIN";
        });
      } catch {
        return fail("RECOVERY_CHECKPOINT_FAILED");
      }
      rememberFailure("STORAGE_CAS_PROOF_MISMATCH");
      continue;
    }
    try {
      await deletion.applyResult(() => {
        const appliedEntry = state.effect_ledger.find(
          (candidate) => candidate.sequence === entry.sequence,
        );
        appliedEntry.status = "CLEANED";
        appliedEntry.cleanup_status = "APPLIED";
      });
    } catch {
      return fail("RECOVERY_CHECKPOINT_FAILED");
    }
    let verificationHandle;
    try {
      verificationHandle = await inspect(resource, true, "CLEANED");
    } catch (error) {
      if (
        error?.code === "BUDGET_EXHAUSTED" ||
        checkpointFailure(error)
      ) {
        return fail(
          error?.code === "BUDGET_EXHAUSTED"
            ? "BUDGET_EXHAUSTED"
            : "RECOVERY_CHECKPOINT_FAILED",
        );
      }
      rememberFailure(
        error?.code === "OPERATION_RECEIPT_MISMATCH"
          ? "OPERATION_RECEIPT_MISMATCH"
          : "CLEANUP_VERIFICATION_FAILED",
      );
      continue;
    }
    try {
      await applyPostDeleteVerification(
        verificationHandle,
        entry.sequence,
      );
    } catch {
      return fail("RECOVERY_CHECKPOINT_FAILED");
    }
  }

  if (recoveryFailureCode !== null) {
    return fail(recoveryFailureCode);
  }

  const terminal = applyLifecycleTransition(
    state,
    "READY",
    durableAuthorization,
  );
  if (terminal.lifecycle_state !== "READY") {
    return fail("AUTHORIZATION_CLASS_MISMATCH");
  }
  terminal.cleanup = {
    required: state.owned_resources.length > 0,
    verified: true,
  };
  terminal.recovery = { ...state.recovery, status: "COMPLETE" };
  terminal.outcome = { code: "RESUME_AUTHORIZED", successful: true };
  try {
    await commitDurableCheckpoint(terminal, checkpointRecoveryState, {
      read_authoritative_head: readCheckpointHead,
      validate_candidate: validateTerminalState,
    });
  } catch {
    return failedRecovery(recoveryState(), "RECOVERY_TERMINAL_CHECKPOINT_FAILED");
  }
  return terminal;
}

const EVIDENCE_KEYS = [
  "authority_envelope",
  "authority_envelope_sha256",
  "authorization_class",
  "budgets",
  "candidate_identity_sha256",
  "cleanup",
  "effect_ledger",
  "freeze_document_sha256",
  "immutable_audit_reference_sha256",
  "lifecycle_state",
  "operation_class",
  "operation_reservation",
  "recovery_operation_state",
  "outcome",
  "owned_resources",
  "phase",
  "recovery",
  "retained_state_sha256",
  "resource_plan",
  "resource_plan_sha256",
  "review_approval_sha256",
  "run_id",
  "journal_identity_sha256",
];

export function buildCompactEvidence(input) {
  rejectSecretFields(input);
  if (!exactKeys(input, EVIDENCE_KEYS)) throw new KernelError("EVIDENCE_FIELD");
  const payload = {
    schema_version: 1,
    authority_envelope: structuredClone(input.authority_envelope),
    authority_envelope_sha256: input.authority_envelope_sha256,
    candidate_identity_sha256: input.candidate_identity_sha256,
    run_id: input.run_id,
    phase: input.phase,
    operation_class: input.operation_class,
    operation_reservation: structuredClone(input.operation_reservation),
    recovery_operation_state: structuredClone(input.recovery_operation_state),
    review_approval_sha256: input.review_approval_sha256,
    lifecycle_state: input.lifecycle_state,
    authorization_class: input.authorization_class,
    budgets: structuredClone(input.budgets),
    owned_resources: structuredClone(input.owned_resources),
    effect_ledger: structuredClone(input.effect_ledger),
    freeze_document_sha256: input.freeze_document_sha256,
    cleanup: structuredClone(input.cleanup),
    recovery: structuredClone(input.recovery),
    retained_state_sha256: input.retained_state_sha256,
    resource_plan: structuredClone(input.resource_plan),
    resource_plan_sha256: input.resource_plan_sha256,
    outcome: structuredClone(input.outcome),
    immutable_audit_reference_sha256: [
      ...input.immutable_audit_reference_sha256,
    ],
    journal_identity_sha256: input.journal_identity_sha256,
  };
  const evidence = {
    ...payload,
    evidence_identity_sha256: sha256Hex(canonicalJson(payload)),
  };
  validateCompactEvidence(evidence);
  return evidence;
}

function validateCompactEvidenceLifecycle(evidence, ledger) {
  if (!COMPACT_EVIDENCE_LIFECYCLES.has(evidence.lifecycle_state)) {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  if (evidence.lifecycle_state === "QUALIFIED") {
    const qualified =
      evidence.authorization_class === AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
      evidence.cleanup.required === true &&
      evidence.cleanup.verified === true &&
      exactKeys(evidence.recovery, ["status"]) &&
      evidence.recovery.status === "NOT_REQUIRED" &&
      evidence.outcome.code === "QUALIFIED" &&
      evidence.outcome.successful === true &&
      canonicalJson(evidence.owned_resources) ===
        canonicalJson(evidence.resource_plan);
    if (!qualified) throw new KernelError("EVIDENCE_SHAPE");
    try {
      validateTerminalQualifiedOperationLedgerClosure(evidence, ledger);
    } catch {
      throw new KernelError("EVIDENCE_SHAPE");
    }
    return true;
  }
  if (evidence.lifecycle_state === "READY") {
    const exactInitialReady =
      evidence.authorization_class === AUTHORIZATION_CLASSES.NONE &&
      evidence.budgets.requests.used === 0 &&
      evidence.budgets.mutations.used === 0 &&
      evidence.owned_resources.length === 0 &&
      evidence.effect_ledger.length === 0 &&
      evidence.recovery_operation_state.qualification_slot_usage.requests.length === 0 &&
      evidence.recovery_operation_state.qualification_slot_usage.mutations.length === 0 &&
      evidence.recovery_operation_state.recovery_anchor === null &&
      evidence.recovery_operation_state.recovery_grant === null &&
      evidence.recovery_operation_state.operation_slots.every(
        (slot) => slot.status === "NOT_STARTED",
      ) &&
      evidence.cleanup.required === false &&
      evidence.cleanup.verified === true &&
      exactKeys(evidence.recovery, ["status"]) &&
      evidence.recovery.status === "NOT_REQUIRED" &&
      evidence.outcome.code === "READY" &&
      evidence.outcome.successful === true;
    if (!exactInitialReady) throw new KernelError("EVIDENCE_SHAPE");
    return true;
  }
  if (evidence.lifecycle_state === "FAILED_RECOVERABLE") {
    if (ledger.ordered.some((entry) => entry.cleanup_status === "RETAINED")) {
      throw new KernelError("EVIDENCE_SHAPE");
    }
    const noRecoveryControllerProgress =
      evidence.recovery_operation_state.recovery_anchor === null &&
      evidence.recovery_operation_state.recovery_grant === null &&
      evidence.recovery_operation_state.operation_slots.every(
        (slot) => slot.status === "NOT_STARTED",
      );
    const exactControls =
      evidence.cleanup.verified === false &&
      exactKeys(evidence.recovery, ["status", "resume_to"]) &&
      evidence.recovery.status === "PENDING" &&
      evidence.recovery.resume_to === "READY" &&
      evidence.outcome.successful === false &&
      noRecoveryControllerProgress;
    const unknownProjection =
      evidence.authorization_class === AUTHORIZATION_CLASSES.NONE &&
      evidence.cleanup.required === true &&
      UNKNOWN_QUALIFICATION_FAILURE_CODES.has(evidence.outcome.code);
    const localFailure =
      evidence.authorization_class ===
        AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
      evidence.cleanup.required === (evidence.owned_resources.length > 0) &&
      LOCAL_QUALIFICATION_FAILURE_CODES.has(evidence.outcome.code);
    if (!exactControls || (!unknownProjection && !localFailure)) {
      throw new KernelError("EVIDENCE_SHAPE");
    }
    return true;
  }
  if (evidence.lifecycle_state === "FAILED_CLOSED") {
    const noRecoveryControllerProgress =
      evidence.recovery_operation_state.recovery_anchor === null &&
      evidence.recovery_operation_state.recovery_grant === null &&
      evidence.recovery_operation_state.operation_slots.every(
        (slot) => slot.status === "NOT_STARTED",
      );
    const exactControls =
      evidence.cleanup.verified === true &&
      exactKeys(evidence.recovery, ["status"]) &&
      evidence.recovery.status === "NOT_REQUIRED" &&
      evidence.outcome.successful === false &&
      noRecoveryControllerProgress;
    const safePreEffectFailure =
      evidence.authorization_class === AUTHORIZATION_CLASSES.NONE &&
      evidence.cleanup.required === false &&
      evidence.budgets.requests.used === 0 &&
      evidence.budgets.mutations.used === 0 &&
      evidence.owned_resources.length === 0 &&
      evidence.effect_ledger.length === 0 &&
      evidence.recovery_operation_state.qualification_slot_usage.requests.length === 0 &&
      evidence.recovery_operation_state.qualification_slot_usage.mutations.length === 0 &&
      SAFE_PRE_EFFECT_FAILURE_CODES.has(evidence.outcome.code);
    const localFailure =
      evidence.authorization_class ===
        AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION &&
      evidence.cleanup.required === (evidence.owned_resources.length > 0) &&
      LOCAL_QUALIFICATION_FAILURE_CODES.has(evidence.outcome.code);
    if (!exactControls || (!safePreEffectFailure && !localFailure)) {
      throw new KernelError("EVIDENCE_SHAPE");
    }
    if (localFailure) {
      try {
        validateTerminalLocalFailureOperationLedgerClosure(evidence, ledger);
      } catch {
        throw new KernelError("EVIDENCE_SHAPE");
      }
    }
    return true;
  }
  throw new KernelError("EVIDENCE_SHAPE");
}

export function validateCompactEvidence(evidence) {
  rejectSecretFields(evidence);
  if (
    !exactKeys(evidence, ["schema_version", ...EVIDENCE_KEYS, "evidence_identity_sha256"]) ||
    evidence.schema_version !== 1 ||
    !isSha256(evidence.candidate_identity_sha256) ||
    typeof evidence.run_id !== "string" ||
    evidence.run_id.length < 16 ||
    evidence.phase !== "34JA-34JZ" ||
    evidence.operation_class !== "NONPRODUCTION_QUALIFICATION" ||
    !isSha256(evidence.authority_envelope_sha256) ||
    !isSha256(evidence.freeze_document_sha256) ||
    !isSha256(evidence.retained_state_sha256) ||
    !isSha256(evidence.resource_plan_sha256) ||
    !isSha256(evidence.journal_identity_sha256) ||
    !isSha256(evidence.review_approval_sha256) ||
    !COMPACT_EVIDENCE_LIFECYCLES.has(evidence.lifecycle_state) ||
    !Object.values(AUTHORIZATION_CLASSES).includes(evidence.authorization_class) ||
    !validBudget(evidence.budgets) ||
    !Array.isArray(evidence.owned_resources) ||
    !Array.isArray(evidence.effect_ledger) ||
    !exactKeys(evidence.cleanup, ["required", "verified"]) ||
    typeof evidence.cleanup.required !== "boolean" ||
    typeof evidence.cleanup.verified !== "boolean" ||
    (!exactKeys(evidence.recovery, ["status"]) &&
      !exactKeys(evidence.recovery, ["status", "resume_to"])) ||
    typeof evidence.recovery?.status !== "string" ||
    evidence.recovery.status.length < 1 ||
    (Object.hasOwn(evidence.recovery, "resume_to") &&
      (typeof evidence.recovery.resume_to !== "string" ||
        evidence.recovery.resume_to.length < 1)) ||
    !exactKeys(evidence.outcome, ["code", "successful"]) ||
    typeof evidence.outcome?.code !== "string" ||
    evidence.outcome.code.length < 1 ||
    typeof evidence.outcome?.successful !== "boolean" ||
    !Array.isArray(evidence.immutable_audit_reference_sha256) ||
    !evidence.immutable_audit_reference_sha256.every(isSha256) ||
    evidence.immutable_audit_reference_sha256.length !==
      new Set(evidence.immutable_audit_reference_sha256).size ||
    !isSha256(evidence.evidence_identity_sha256)
  ) {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  try {
    validateActivationSemanticParity(evidence, {
      allow_empty_evidence_story: true,
    });
    validateJournalProtocol(evidence);
    validateRecoveryOperationState(evidence);
    if (!validReservationBudgetAccounting(evidence)) {
      throw new KernelError("EVIDENCE_SHAPE");
    }
    validateQualificationOperationReceipts(evidence);
  } catch {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  for (const resource of evidence.owned_resources) {
    validateOwnedResource(resource, evidence.candidate_identity_sha256);
    if (
      resource.owner.run_id !== evidence.run_id ||
      resource.owner.phase !== evidence.phase ||
      resource.owner.operation_class !== evidence.operation_class
    ) {
      throw new KernelError("EVIDENCE_SHAPE");
    }
  }
  let ledger;
  try {
    ledger = validateLedger(evidence);
    validateCompactEvidenceLifecycle(evidence, ledger);
  } catch {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  const { evidence_identity_sha256: identity, ...payload } = evidence;
  if (sha256Hex(canonicalJson(payload)) !== identity) {
    throw new KernelError("EVIDENCE_IDENTITY_MISMATCH");
  }
  return true;
}
