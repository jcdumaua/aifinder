import assert from "node:assert/strict";
import {
  AUTHORIZATION_CLASSES,
  createOperationReservation,
  createRecoveryOperationState,
  deriveAuthorityEnvelopeSha256,
  deriveJournalIdentitySha256,
  deriveOperationSlot,
  deriveQualificationReservationProofSha256,
  deriveQualificationReservationRootSha256,
  deriveRecoveryCapabilitySha256,
  deriveRecoveryOperationBindingSha256,
  deriveResourcePlanSha256,
  reconcileRecovery,
  validateCompactEvidence,
  validateCheckpointProtocol,
  validateRecoveryState,
  validateTerminalState,
} from "./kernel.mjs";
import { canonicalJson, sha256Hex } from "./canonical.mjs";

const CANDIDATE = "1".repeat(64);
const REVIEW = "2".repeat(64);
const FREEZE = "4".repeat(64);
const RETAINED_STATE = "5".repeat(64);
const RETAINED_ATTESTATION =
  "7e527d6eded9b332c95d9da6e69003fba8184c47200002463f2d4955f169029e";
const RUN_ID = "qualification-run-recovery-0001";
const PHASE = "34JA-34JZ";
const OPERATION_CLASS = "NONPRODUCTION_QUALIFICATION";
const failures = [];
let assertions = 0;

function checkpointRootSha256(journalIdentitySha256) {
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_KERNEL_CHECKPOINT_ROOT",
    journal_identity_sha256: journalIdentitySha256,
  }));
}

function sealCheckpoint(state, sequence = 0, predecessor) {
  const { checkpoint: ignored, ...checkpointState } = structuredClone(state);
  const predecessorCheckpointIdentitySha256 =
    predecessor ?? checkpointRootSha256(state.journal_identity_sha256);
  const checkpointIdentitySha256 = sha256Hex(canonicalJson({
    schema_version: 1,
    journal_identity_sha256: state.journal_identity_sha256,
    sequence,
    predecessor_checkpoint_identity_sha256:
      predecessorCheckpointIdentitySha256,
    checkpoint_state: checkpointState,
  }));
  return {
    ...checkpointState,
    checkpoint: {
      schema_version: 1,
      sequence,
      predecessor_checkpoint_identity_sha256:
        predecessorCheckpointIdentitySha256,
      checkpoint_identity_sha256: checkpointIdentitySha256,
    },
  };
}

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.message ?? error?.code ?? "UNKNOWN"}`);
  }
}

function assertRecoveryFailureProjection(result, expectedCode) {
  assert.deepEqual(Object.keys(result).sort(), [
    "authorization_class",
    "candidate_identity_sha256",
    "checkpoint_disposition",
    "cleanup",
    "lifecycle_state",
    "outcome",
    "recovery",
    "result_type",
    "schema_version",
  ].sort());
  assert.equal(result.schema_version, 1);
  assert.equal(result.result_type, "RECOVERY_FAILURE_PROJECTION");
  assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.authorization_class, "NONE");
  assert.equal(result.checkpoint_disposition, "UNKNOWN");
  assert.deepEqual(result.cleanup, { required: true, verified: false });
  assert.deepEqual(result.recovery, { status: "PENDING", resume_to: "READY" });
  assert.deepEqual(result.outcome, { code: expectedCode, successful: false });
}

function recoveryAuthorization(candidate = CANDIDATE) {
  return {
    schema_version: 1,
    authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
    candidate_identity_sha256: candidate,
    review_sha256: REVIEW,
  };
}

function checkpointReceipt(command) {
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

async function runRecovery(input) {
  const inspectOwnedResource = input.inspectOwnedResource;
  const reconcileOwnedResource = input.reconcileOwnedResource;
  const checkpointRecoveryState = input.checkpointRecoveryState ?? (async () => {});
  const loadAuthoritativeState = input.loadAuthoritativeState;
  let loaded;
  let loadError;
  try {
    loaded = await loadAuthoritativeState();
  } catch (error) {
    loadError = error;
  }
  let authoritativeHead = loaded ? structuredClone(loaded) : undefined;
  let recoveryCapabilitySha256 = input.recovery_capability_sha256;
  if (recoveryCapabilitySha256 === undefined && loaded) {
    try {
      recoveryCapabilitySha256 = deriveRecoveryCapabilitySha256(loaded);
    } catch {
      recoveryCapabilitySha256 = "0".repeat(64);
    }
  }
  return reconcileRecovery({
    ...input,
    recovery_capability_sha256: recoveryCapabilitySha256,
    loadAuthoritativeState: async () => {
      if (loadError) throw loadError;
      return structuredClone(loaded);
    },
    checkpointRecoveryState: async (state, command) => {
      const result = await checkpointRecoveryState(state, command);
      authoritativeHead = structuredClone(state);
      return result ?? checkpointReceipt(command);
    },
    readCheckpointHead: async (request) => {
      if (typeof input.readCheckpointHead === "function") {
        return input.readCheckpointHead(request);
      }
      if (!authoritativeHead) {
        return {
          schema_version: 1,
          status: "CHECKPOINT_ABSENT",
          journal_identity_sha256: request.journal_identity_sha256,
        };
      }
      return {
        schema_version: 1,
        status: "CHECKPOINT_PRESENT",
        journal_identity_sha256: request.journal_identity_sha256,
        checkpoint_sequence: authoritativeHead.checkpoint.sequence,
        predecessor_checkpoint_identity_sha256:
          authoritativeHead.checkpoint.predecessor_checkpoint_identity_sha256,
        checkpoint_identity_sha256:
          authoritativeHead.checkpoint.checkpoint_identity_sha256,
      };
    },
    inspectOwnedResource: async (resource, context) => {
      const plannedOnly = !loaded?.owned_resources?.some(
        (owned) => owned.resource_key === resource.resource_key,
      );
      const result = plannedOnly && input.inspectPlannedOnly !== true
        ? { status: "ABSENT" }
        : await inspectOwnedResource(resource, context);
      const creationOperationSlotSha256 =
        loaded?.recovery_operation_state?.qualification_operation_slots?.find(
          (slot) =>
            slot.category === "mutations" &&
            slot.operation === "QUALIFICATION_CREATE_NEW" &&
            slot.status === "RESULT_APPLIED" &&
            slot.resource_key === resource.resource_key,
        )?.operation_slot_sha256;
      return {
        ...result,
        operation_slot_sha256:
          result?.operation_slot_sha256 ??
          context?.operation_slot?.operation_slot_sha256,
        ...(context?.operation_binding_sha256
          ? {
              operation_binding_sha256:
                result?.operation_binding_sha256 ??
                context.operation_binding_sha256,
            }
          : {
              checkpoint_identity_sha256:
                result?.checkpoint_identity_sha256 ??
                context?.checkpoint_identity_sha256,
            }),
        ...(result?.status === "PRESENT" && creationOperationSlotSha256
          ? {
              creation_operation_slot_sha256:
                result?.creation_operation_slot_sha256 ??
                creationOperationSlotSha256,
            }
          : {}),
      };
    },
    reconcileOwnedResource: async (resource, contract, context) => {
      const result = await reconcileOwnedResource(resource, contract, context);
      return {
        ...result,
        resource_key: result?.resource_key ?? resource.resource_key,
        locator_sha256:
          result?.locator_sha256 ?? resource.owner.locator_sha256,
        operation_slot_sha256:
          result?.operation_slot_sha256 ??
          context?.operation_slot?.operation_slot_sha256,
        ...(context?.operation_binding_sha256
          ? {
              operation_binding_sha256:
                result?.operation_binding_sha256 ??
                context.operation_binding_sha256,
            }
          : {
              checkpoint_identity_sha256:
                result?.checkpoint_identity_sha256 ??
                context?.checkpoint_identity_sha256,
            }),
      };
    },
  });
}

function rowResource(overrides = {}) {
  const resource = {
    resource_key: "row:discovered_tools:row-1",
    resource_type: "DATABASE_ROW",
    locator: { relation: "discovered_tools", id: "row-1" },
    ...overrides,
  };
  resource.owner = overrides.owner ?? {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    resource_type: resource.resource_type,
    locator_sha256: sha256Hex(canonicalJson(resource.locator)),
    cleanup_policy: "DELETE_EXACT",
  };
  if (!Object.hasOwn(overrides, "resource_key")) {
    resource.resource_key = `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`;
  }
  return resource;
}

function storageResource(overrides = {}) {
  const resource = {
    resource_key: "storage:tool-logos/logo.png",
    resource_type: "STORAGE_OBJECT",
    locator: { bucket: "tool-logos", name: "logo.png" },
    storage_cas: {
      expected_version: "version-1",
      delete_capability_sha256: "3".repeat(64),
    },
    ...overrides,
  };
  resource.owner = overrides.owner ?? {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    resource_type: resource.resource_type,
    locator_sha256: sha256Hex(canonicalJson(resource.locator)),
    cleanup_policy: "DELETE_EXACT",
  };
  if (!Object.hasOwn(overrides, "resource_key")) {
    resource.resource_key = `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`;
  }
  return resource;
}

function branchResource(overrides = {}) {
  const resource = {
    resource_type: "GIT_BRANCH",
    locator: {
      repository: "aifinder",
      branch: "qualification-recovery-branch",
      expected_commit_sha256: "7".repeat(64),
    },
    ...overrides,
  };
  resource.owner = overrides.owner ?? {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    resource_type: resource.resource_type,
    locator_sha256: sha256Hex(canonicalJson(resource.locator)),
    cleanup_policy: "DELETE_EXACT",
  };
  resource.resource_key = overrides.resource_key ??
    `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`;
  return resource;
}

function previewResource(overrides = {}) {
  const resource = {
    resource_type: "PREVIEW_DEPLOYMENT",
    locator: { project_id: "project-1", deployment_id: "preview-recovery-1" },
    ...overrides,
  };
  resource.owner = overrides.owner ?? {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    resource_type: resource.resource_type,
    locator_sha256: sha256Hex(canonicalJson(resource.locator)),
    cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  };
  resource.resource_key = overrides.resource_key ??
    `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`;
  return resource;
}

function environmentResource(overrides = {}) {
  const resource = {
    resource_type: "ENVIRONMENT_RECORD",
    locator: {
      project_id: "project-1",
      key: "ACCESS",
      target: "preview-recovery-1",
    },
    ...overrides,
  };
  resource.owner = overrides.owner ?? {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    resource_type: resource.resource_type,
    locator_sha256: sha256Hex(canonicalJson(resource.locator)),
    cleanup_policy: "DELETE_EXACT",
  };
  resource.resource_key = overrides.resource_key ??
    `${resource.owner.run_id}:${resource.resource_type}:${resource.owner.locator_sha256}`;
  return resource;
}

function activationResourcePlan(resources) {
  const suppliedTypes = new Set(
    resources.map((resource) => resource.resource_type),
  );
  const missing = [
    rowResource(),
    storageResource(),
    previewResource(),
    branchResource(),
    environmentResource(),
  ].filter((resource) => !suppliedTypes.has(resource.resource_type));
  return [
    ...structuredClone(resources),
    ...missing.slice(0, Math.max(0, 5 - resources.length)),
  ];
}

function recoveryState({
  resources = [rowResource()],
  ledger,
  budgets,
  qualificationCreateReservations = [],
  qualificationDeletes = [],
  qualificationDeleteReservations = [],
} = {}) {
  const resourcePlan = activationResourcePlan(resources);
  const resourcePlanSha256 = deriveResourcePlanSha256(resourcePlan);
  const authorityEnvelope = {
    schema_version: 1,
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    review_approval_sha256: REVIEW,
    freeze_document_sha256: FREEZE,
    current_retained_state_attestation_sha256: RETAINED_ATTESTATION,
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 = deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation = createOperationReservation(authorityEnvelopeSha256);
  const journalIdentitySha256 = deriveJournalIdentitySha256({
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan_sha256: resourcePlanSha256,
    ordered_resource_keys: resourcePlan.map((resource) => resource.resource_key),
    operation_reservation_identity_sha256: operationReservation.identity_sha256,
  });
  const recoveryOperationState = createRecoveryOperationState(
    operationReservation,
    resourcePlan,
  );
  let qualificationSequence = 0;
  let qualificationPredecessorSha256 =
    deriveQualificationReservationRootSha256({
      journal_identity_sha256: journalIdentitySha256,
      operation_reservation_identity_sha256:
        operationReservation.identity_sha256,
    });
  const recordQualificationReceipt = (
    category,
    index,
    operation,
    resourceKey,
    receipt,
  ) => {
    const slot = recoveryOperationState.qualification_operation_slots.find(
      (candidate) =>
        candidate.category === category &&
        candidate.index === index &&
        candidate.operation === operation &&
        candidate.resource_key === resourceKey,
    );
    slot.reservation_ordinal = qualificationSequence;
    slot.predecessor_reservation_proof_sha256 =
      qualificationPredecessorSha256;
    slot.reservation_proof_sha256 =
      deriveQualificationReservationProofSha256({
        journal_identity_sha256: journalIdentitySha256,
        operation_reservation_identity_sha256:
          operationReservation.identity_sha256,
        reservation_ordinal: qualificationSequence,
        predecessor_reservation_proof_sha256:
          qualificationPredecessorSha256,
        operation_slot_sha256: slot.operation_slot_sha256,
      });
    receipt.reservation_proof_sha256 = slot.reservation_proof_sha256;
    slot.status = "RESULT_APPLIED";
    slot.receipt = structuredClone(receipt);
    slot.receipt_sha256 = sha256Hex(canonicalJson(receipt));
    recoveryOperationState.qualification_slot_usage[category].push(
      slot.operation_slot_sha256,
    );
    qualificationPredecessorSha256 = slot.reservation_proof_sha256;
    qualificationSequence += 1;
    return slot;
  };
  recordQualificationReceipt(
    "requests",
    0,
    "VERIFY_AUTHORITY_ENVELOPE",
    null,
    {
      status: "VERIFIED_AUTHORITY_ENVELOPE",
      candidate_identity_sha256: CANDIDATE,
      run_id: RUN_ID,
      phase: PHASE,
      operation_class: OPERATION_CLASS,
      approval_digest_sha256: REVIEW,
      freeze_document_sha256: FREEZE,
      current_retained_state_attestation_sha256: RETAINED_ATTESTATION,
      resource_plan_sha256: resourcePlanSha256,
      authority_envelope_sha256: authorityEnvelopeSha256,
      operation_slot_sha256: deriveOperationSlot({
        operation_reservation: operationReservation,
        category: "requests",
        index: 0,
        operation: "VERIFY_AUTHORITY_ENVELOPE",
      }).operation_slot_sha256,
    },
  );
  recordQualificationReceipt(
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
    null,
    {
      status: "FRESH",
      authority_envelope_sha256: authorityEnvelopeSha256,
      resource_plan_sha256: resourcePlanSha256,
      operation_slot_sha256: deriveOperationSlot({
        operation_reservation: operationReservation,
        category: "requests",
        index: 1,
        operation: "VERIFY_FRESH_RESOURCE_PLAN",
      }).operation_slot_sha256,
      proofs: resourcePlan.map((resource) => ({
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        status: "ABSENT",
      })),
    },
  );
  const rawLedger =
    ledger ?? [
      {
        sequence: 1,
        resource_key: resources[0].resource_key,
        effect: "CREATE",
        status: "APPLIED",
        cleanup_status: "PENDING",
      },
    ];
  const creationReceipts = new Map();
  const qualificationCreateReservationKeys = new Set(
    qualificationCreateReservations,
  );
  for (const [index, resource] of resourcePlan.entries()) {
    const ledgerEntry = rawLedger.find(
      (entry) => entry.resource_key === resource.resource_key,
    );
    if (!["APPLIED", "CLEANED"].includes(ledgerEntry?.status)) continue;
    if (qualificationCreateReservationKeys.has(resource.resource_key)) {
      const slot = recoveryOperationState.qualification_operation_slots.find(
        (candidate) =>
          candidate.category === "mutations" &&
          candidate.index === index &&
          candidate.operation === "QUALIFICATION_CREATE_NEW" &&
          candidate.resource_key === resource.resource_key,
      );
      slot.reservation_ordinal = qualificationSequence;
      slot.predecessor_reservation_proof_sha256 =
        qualificationPredecessorSha256;
      slot.reservation_proof_sha256 =
        deriveQualificationReservationProofSha256({
          journal_identity_sha256: journalIdentitySha256,
          operation_reservation_identity_sha256:
            operationReservation.identity_sha256,
          reservation_ordinal: qualificationSequence,
          predecessor_reservation_proof_sha256:
            qualificationPredecessorSha256,
          operation_slot_sha256: slot.operation_slot_sha256,
        });
      slot.status = "RESERVED";
      recoveryOperationState.qualification_slot_usage.mutations.push(
        slot.operation_slot_sha256,
      );
      qualificationPredecessorSha256 = slot.reservation_proof_sha256;
      qualificationSequence += 1;
      continue;
    }
    const operationSlotSha256 = deriveOperationSlot({
      operation_reservation: operationReservation,
      category: "mutations",
      index,
      operation: "QUALIFICATION_CREATE_NEW",
      resource_key: resource.resource_key,
    }).operation_slot_sha256;
    const receipt = {
      status: "CREATED_NEW",
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      authority_envelope_sha256: authorityEnvelopeSha256,
      operation_slot_sha256: operationSlotSha256,
    };
    const slot = recordQualificationReceipt(
      "mutations",
      index,
      "QUALIFICATION_CREATE_NEW",
      resource.resource_key,
      receipt,
    );
    creationReceipts.set(resource.resource_key, slot.receipt_sha256);
  }
  const qualificationDeleteKeys = new Set(qualificationDeletes);
  const qualificationDeleteReservationKeys = new Set(
    qualificationDeleteReservations,
  );
  for (const [index, resource] of [...resourcePlan.entries()].reverse()) {
    if (
      !qualificationDeleteKeys.has(resource.resource_key) &&
      !qualificationDeleteReservationKeys.has(resource.resource_key)
    ) {
      continue;
    }
    const operationSlotSha256 = deriveOperationSlot({
      operation_reservation: operationReservation,
      category: "mutations",
      index: 5 + index,
      operation: "QUALIFICATION_DELETE_EXACT",
      resource_key: resource.resource_key,
    }).operation_slot_sha256;
    if (qualificationDeleteKeys.has(resource.resource_key)) {
      recordQualificationReceipt(
        "mutations",
        5 + index,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
        {
          status: "DELETED_EXACT",
          resource_key: resource.resource_key,
          locator_sha256: resource.owner.locator_sha256,
          operation_slot_sha256: operationSlotSha256,
          ...(resource.resource_type === "STORAGE_OBJECT"
            ? { expected_version: resource.storage_cas.expected_version }
            : {}),
        },
      );
      continue;
    }
    const slot = recoveryOperationState.qualification_operation_slots.find(
      (candidate) =>
        candidate.category === "mutations" &&
        candidate.index === 5 + index &&
        candidate.operation === "QUALIFICATION_DELETE_EXACT" &&
        candidate.resource_key === resource.resource_key,
    );
    slot.reservation_ordinal = qualificationSequence;
    slot.predecessor_reservation_proof_sha256 =
      qualificationPredecessorSha256;
    slot.reservation_proof_sha256 =
      deriveQualificationReservationProofSha256({
        journal_identity_sha256: journalIdentitySha256,
        operation_reservation_identity_sha256:
          operationReservation.identity_sha256,
        reservation_ordinal: qualificationSequence,
        predecessor_reservation_proof_sha256:
          qualificationPredecessorSha256,
        operation_slot_sha256: slot.operation_slot_sha256,
      });
    slot.status = "RESERVED";
    recoveryOperationState.qualification_slot_usage.mutations.push(
      slot.operation_slot_sha256,
    );
    qualificationPredecessorSha256 = slot.reservation_proof_sha256;
    qualificationSequence += 1;
  }
  const effectLedger = rawLedger.map((entry) => {
    const index = resourcePlan.findIndex(
      (resource) => resource.resource_key === entry.resource_key,
    );
    const creationOperationSlotSha256 =
      entry.creation_operation_slot_sha256 ??
      (index < 0
        ? undefined
        : deriveOperationSlot({
            operation_reservation: operationReservation,
            category: "mutations",
            index,
            operation: "QUALIFICATION_CREATE_NEW",
            resource_key: entry.resource_key,
          }).operation_slot_sha256);
    return {
      ...entry,
      ...(creationOperationSlotSha256 === undefined
        ? {}
        : { creation_operation_slot_sha256: creationOperationSlotSha256 }),
      ...(Object.hasOwn(entry, "creation_receipt_sha256")
        ? {}
        : {
            creation_receipt_sha256: ["APPLIED", "CLEANED"].includes(entry.status)
              ? creationReceipts.get(entry.resource_key)
              : null,
          }),
    };
  });
  const initial = sealCheckpoint({
    schema_version: 1,
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    review_approval_sha256: REVIEW,
    freeze_document_sha256: FREEZE,
    retained_state_sha256: RETAINED_STATE,
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan: resourcePlan,
    resource_plan_sha256: resourcePlanSha256,
    operation_reservation: operationReservation,
    recovery_operation_state: recoveryOperationState,
    journal_identity_sha256: journalIdentitySha256,
    lifecycle_state: "FAILED_RECOVERABLE",
    authorization_class: "RECOVERY_CONTROLLER",
    budgets: budgets ?? {
      requests: { limit: 16, used: 3 },
      mutations: {
        limit: 15,
        used:
          recoveryOperationState.qualification_slot_usage.mutations.length,
      },
    },
    owned_resources: resources,
    effect_ledger: effectLedger,
    transition_history: [],
    cleanup: { required: true, verified: false },
    recovery: { status: "PENDING", resume_to: "READY" },
    outcome: { code: "RECOVERY_AUTHORIZED", successful: false },
  }, qualificationSequence);
  const anchor = {
    checkpoint_identity_sha256: initial.checkpoint.checkpoint_identity_sha256,
    checkpoint_sequence: initial.checkpoint.sequence,
    predecessor_checkpoint_identity_sha256:
      initial.checkpoint.predecessor_checkpoint_identity_sha256,
  };
  const authorized = structuredClone(initial);
  const authorityRecord = authorized.recovery_operation_state.operation_slots.find(
    (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
  );
  const operationBindingSha256 = deriveRecoveryOperationBindingSha256({
    journal_identity_sha256: authorized.journal_identity_sha256,
    recovery_anchor_checkpoint_identity_sha256:
      anchor.checkpoint_identity_sha256,
    operation_slot_sha256: authorityRecord.operation_slot_sha256,
  });
  const authorityReceipt = {
    status: "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: PHASE,
    operation_class: OPERATION_CLASS,
    approval_digest_sha256: REVIEW,
    freeze_document_sha256: FREEZE,
    retained_state_sha256: RETAINED_STATE,
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan_sha256: resourcePlanSha256,
    journal_identity_sha256: journalIdentitySha256,
    operation_reservation_identity_sha256:
      operationReservation.identity_sha256,
    recovery_anchor_checkpoint_identity_sha256:
      anchor.checkpoint_identity_sha256,
    recovery_anchor_checkpoint_sequence: anchor.checkpoint_sequence,
    recovery_anchor_predecessor_identity_sha256:
      anchor.predecessor_checkpoint_identity_sha256,
    operation_binding_sha256: operationBindingSha256,
    operation_slot_sha256: authorityRecord.operation_slot_sha256,
  };
  const authorityReceiptSha256 = sha256Hex(canonicalJson(authorityReceipt));
  authorized.recovery_operation_state.recovery_anchor = anchor;
  authorized.recovery_operation_state.recovery_grant = {
    authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
    authority_receipt_sha256: authorityReceiptSha256,
    recovery_anchor_checkpoint_identity_sha256:
      anchor.checkpoint_identity_sha256,
    review_sha256: REVIEW,
  };
  authorityRecord.operation_binding_sha256 = operationBindingSha256;
  authorityRecord.status = "RESULT_APPLIED";
  authorityRecord.receipt = authorityReceipt;
  authorityRecord.receipt_sha256 = authorityReceiptSha256;
  authorized.transition_history = [
    {
      from: "READY",
      to: "QUALIFYING",
      authorization_class: AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION,
      review_sha256: REVIEW,
    },
    {
      from: "QUALIFYING",
      to: "FAILED_RECOVERABLE",
      authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
      review_sha256: REVIEW,
    },
  ];
  return sealCheckpoint(
    authorized,
    initial.checkpoint.sequence + 1,
    initial.checkpoint.checkpoint_identity_sha256,
  );
}

await check("low-level recovery rejects a different review before head or effects", async () => {
  const state = recoveryState();
  const calls = { checkpoint: 0, head: 0, inspect: 0, reconcile: 0 };
  let present = true;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => structuredClone(state),
    expectedCandidateIdentity: CANDIDATE,
    authorization: {
      schema_version: 1,
      authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
      candidate_identity_sha256: CANDIDATE,
      review_sha256: "9".repeat(64),
    },
    recovery_capability_sha256: deriveRecoveryCapabilitySha256(state),
    checkpointRecoveryState: async (_candidate, command) => {
      calls.checkpoint += 1;
      return checkpointReceipt(command);
    },
    readCheckpointHead: async () => {
      calls.head += 1;
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
    inspectOwnedResource: async (_resource, context) => {
      calls.inspect += 1;
      return {
        status: present ? "PRESENT" : "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
    reconcileOwnedResource: async (resource, _contract, context) => {
      calls.reconcile += 1;
      present = false;
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
  });
  assertRecoveryFailureProjection(result, "RECOVERY_AUTHORITY_MISMATCH");
  assert.deepEqual(calls, { checkpoint: 0, head: 0, inspect: 0, reconcile: 0 });
});

await check("already-granted mutable recovery requires the exact reviewed receipt before head or effects", async () => {
  const state = recoveryState();
  const authoritySlot = state.recovery_operation_state.operation_slots.find(
    (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
  );
  delete authoritySlot.receipt.run_id;
  authoritySlot.receipt_sha256 = sha256Hex(canonicalJson(authoritySlot.receipt));
  state.recovery_operation_state.recovery_grant.authority_receipt_sha256 =
    authoritySlot.receipt_sha256;
  const sealed = sealCheckpoint(
    state,
    state.checkpoint.sequence,
    state.checkpoint.predecessor_checkpoint_identity_sha256,
  );
  const calls = { checkpoint: 0, head: 0, inspect: 0, reconcile: 0 };
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => structuredClone(sealed),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    recovery_capability_sha256: deriveRecoveryCapabilitySha256(sealed),
    checkpointRecoveryState: async (_candidate, command) => {
      calls.checkpoint += 1;
      return checkpointReceipt(command);
    },
    readCheckpointHead: async () => {
      calls.head += 1;
      return {
        schema_version: 1,
        status: "CHECKPOINT_PRESENT",
        journal_identity_sha256: sealed.journal_identity_sha256,
        checkpoint_sequence: sealed.checkpoint.sequence,
        predecessor_checkpoint_identity_sha256:
          sealed.checkpoint.predecessor_checkpoint_identity_sha256,
        checkpoint_identity_sha256:
          sealed.checkpoint.checkpoint_identity_sha256,
      };
    },
    inspectOwnedResource: async (_resource, context) => {
      calls.inspect += 1;
      return {
        status: "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
    reconcileOwnedResource: async () => {
      calls.reconcile += 1;
      return null;
    },
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.deepEqual(calls, { checkpoint: 0, head: 0, inspect: 0, reconcile: 0 });
});

await check("terminal recovery checkpoint requires the grant on the final transition", async () => {
  const granted = recoveryState();
  const terminal = structuredClone(granted);
  terminal.lifecycle_state = "READY";
  terminal.cleanup = { required: true, verified: true };
  terminal.recovery = { status: "COMPLETE", resume_to: "READY" };
  terminal.outcome = { code: "RESUME_AUTHORIZED", successful: true };
  terminal.transition_history.push({
    from: "FAILED_RECOVERABLE",
    to: "READY",
    authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
    review_sha256: "9".repeat(64),
  });
  const sealedTerminal = sealCheckpoint(
    terminal,
    granted.checkpoint.sequence + 1,
    granted.checkpoint.checkpoint_identity_sha256,
  );
  assert.throws(
    () => validateCheckpointProtocol(sealedTerminal),
    (error) => error?.code === "CHECKPOINT_STATE_SHAPE",
  );
});

await check("ambiguous journal rejection", async () => {
  let inspections = 0;
  const duplicate = rowResource({ resource_key: "row:duplicate" });
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        resources: [rowResource(), duplicate],
        ledger: [
          { sequence: 1, resource_key: rowResource().resource_key, effect: "CREATE", status: "APPLIED", cleanup_status: "PENDING" },
          { sequence: 2, resource_key: duplicate.resource_key, effect: "CREATE", status: "APPLIED", cleanup_status: "PENDING" },
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
  assertRecoveryFailureProjection(
    result,
    "RECOVERY_STATE_INVALID",
  );
  assert.equal(inspections, 0);
});

await check("incomplete resource locator is rejected", async () => {
  const resource = {
    resource_key: "preview:unknown",
    resource_type: "PREVIEW_DEPLOYMENT",
    owner: {
      candidate_identity_sha256: CANDIDATE,
      run_id: "qualification-run-recovery-0001",
      phase: "34JA-34JZ",
      operation_class: "NONPRODUCTION_QUALIFICATION",
      resource_type: "PREVIEW_DEPLOYMENT",
      locator_sha256: "3".repeat(64),
      cleanup_policy: "DELETE_EXACT",
    },
    locator: {},
  };
  let inspections = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assertRecoveryFailureProjection(
    result,
    "RECOVERY_STATE_INVALID",
  );
  assert.equal(inspections, 0);
});

await check("unledgered owned resource is rejected", async () => {
  const second = rowResource({
    locator: { relation: "discovered_tools", id: "row-2" },
  });
  let inspections = 0;
  const result = await runRecovery({
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
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(inspections, 0);
});

await check("malformed recovery state is sanitized before adapters", async () => {
  let inspections = 0;
  const malformedRecovery = recoveryState();
  malformedRecovery.recovery.unvalidated_detail = "opaque";
  const recoveryResult = await runRecovery({
    loadAuthoritativeState: async () => malformedRecovery,
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assertRecoveryFailureProjection(recoveryResult, "RECOVERY_STATE_INVALID");
  assert.equal(inspections, 0);

  const malformedBudgets = recoveryState();
  malformedBudgets.budgets.requests.used =
    malformedBudgets.budgets.requests.limit + 1;
  const budgetResult = await runRecovery({
    loadAuthoritativeState: async () => malformedBudgets,
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "ABSENT" }),
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assertRecoveryFailureProjection(budgetResult, "RECOVERY_STATE_INVALID");
  assert.equal(Object.hasOwn(budgetResult, "budgets"), false);
});

await check("candidate mismatch performs no effect", async () => {
  let calls = 0;
  const result = await runRecovery({
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
  assertRecoveryFailureProjection(result, "CANDIDATE_MISMATCH");
  assert.equal(calls, 0);
});

await check("exact ownership recovery", async () => {
  const calls = [];
  let present = true;
  const result = await runRecovery({
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
    ["inspect", rowResource().resource_key],
    ["reconcile", rowResource().resource_key],
    ["inspect", rowResource().resource_key],
  ]);
});

await check("post-delete verifier contradiction remains an admissible unresolved emitter pair", async () => {
  const calls = [];
  let durable;
  const result = await runRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) => {
      calls.push(["inspect", resource.resource_key]);
      return { status: "PRESENT" };
    },
    reconcileOwnedResource: async (resource) => {
      calls.push(["reconcile", resource.resource_key]);
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "CLEANUP_VERIFICATION_FAILED");
  assert.equal(durable.effect_ledger[0].status, "APPLIED");
  assert.equal(durable.effect_ledger[0].cleanup_status, "UNCERTAIN");
  assert.doesNotThrow(() => validateRecoveryState(durable));
  assert.deepEqual(calls, [
    ["inspect", rowResource().resource_key],
    ["reconcile", rowResource().resource_key],
    ["inspect", rowResource().resource_key],
  ]);
});

await check("recovery delete receipt rejects a substituted resource key", async () => {
  let present = true;
  let durable;
  const result = await runRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async () => ({
      status: present ? "PRESENT" : "ABSENT",
    }),
    reconcileOwnedResource: async () => {
      present = false;
      return {
        status: "DELETED_EXACT",
        resource_key: "substituted-resource-key",
      };
    },
  });
  assertRecoveryFailureProjection(result, "OPERATION_RECEIPT_MISMATCH");
  assert.equal(durable.effect_ledger[0].status, "APPLIED");
  assert.equal(durable.effect_ledger[0].cleanup_status, "UNCERTAIN");
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
        cleanup_status: "VERIFIED",
      },
    ],
    qualificationDeletes: [rowResource().resource_key],
  });
  const result = await runRecovery({
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
  const second = branchResource();
  const present = new Set([rowResource().resource_key]);
  const reconciled = [];
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        resources: [rowResource(), second],
        ledger: [
          { sequence: 1, resource_key: rowResource().resource_key, effect: "CREATE", status: "APPLIED", cleanup_status: "PENDING" },
          { sequence: 2, resource_key: second.resource_key, effect: "CREATE", status: "INTENT_ONLY", cleanup_status: "PENDING" },
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

await check("pre-create intent PRESENT and AMBIGUOUS remain unresolved without deletion", async () => {
  for (const status of ["PRESENT", "AMBIGUOUS"]) {
    let reconciliations = 0;
    const result = await runRecovery({
      loadAuthoritativeState: async () =>
        recoveryState({
          ledger: [
            {
              sequence: 1,
              resource_key: rowResource().resource_key,
              effect: "CREATE",
              status: "INTENT_ONLY",
              cleanup_status: "PENDING",
            },
          ],
        }),
      expectedCandidateIdentity: CANDIDATE,
      authorization: recoveryAuthorization(),
      inspectOwnedResource: async () => ({ status }),
      reconcileOwnedResource: async () => {
        reconciliations += 1;
        return { status: "DELETED_EXACT" };
      },
    });
    assertRecoveryFailureProjection(
      result,
      status === "PRESENT"
        ? "INTENT_OWNERSHIP_UNPROVEN"
        : "OWNERSHIP_AMBIGUOUS",
    );
    assert.equal(reconciliations, 0, status);
  }
});

await check("cleanup verification failure", async () => {
  const result = await runRecovery({
    loadAuthoritativeState: async () => recoveryState(),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "PRESENT" }),
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assertRecoveryFailureProjection(result, "CLEANUP_VERIFICATION_FAILED");
});

await check("storage cleanup uses exact CAS", async () => {
  let present = true;
  let observedExpectedVersion = null;
  const resource = storageResource();
  const result = await runRecovery({
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
  const result = await runRecovery({
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
  assertRecoveryFailureProjection(result, "STORAGE_VERSION_MISMATCH");
  assert.equal(cleanupCalls, 0);
});

await check("storage CAS race is classified as version mismatch", async () => {
  let inspections = 0;
  const resource = storageResource();
  const result = await runRecovery({
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
  assertRecoveryFailureProjection(result, "STORAGE_VERSION_MISMATCH");
  assert.equal(inspections, 1);
});

await check("recovery resolves an intent crash window without repeating absent cleanup", async () => {
  let reconciliations = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        ledger: [
          {
            sequence: 1,
            resource_key: rowResource().resource_key,
            effect: "CREATE",
            status: "APPLIED",
            cleanup_status: "INTENT_ONLY",
          },
        ],
        qualificationDeleteReservations: [rowResource().resource_key],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async () => {},
    inspectOwnedResource: async () => ({ status: "ABSENT" }),
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.equal(result.effect_ledger[0].status, "CLEANED");
  assert.equal(result.effect_ledger[0].cleanup_status, "VERIFIED");
  assert.equal(reconciliations, 0);
});

await check("recovery checkpoints cleanup intent before mutation", async () => {
  const events = [];
  let present = true;
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        ledger: [
          {
            sequence: 1,
            resource_key: rowResource().resource_key,
            effect: "CREATE",
            status: "APPLIED",
            cleanup_status: "PENDING",
          },
        ],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      events.push(`checkpoint:${state.effect_ledger[0].cleanup_status}`);
    },
    inspectOwnedResource: async () => ({ status: present ? "PRESENT" : "ABSENT" }),
    reconcileOwnedResource: async () => {
      events.push("reconcile");
      present = false;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "READY");
  assert.ok(events.indexOf("checkpoint:INTENT_ONLY") < events.indexOf("reconcile"));
  assert.ok(events.indexOf("checkpoint:APPLIED") > events.indexOf("reconcile"));
  assert.equal(result.effect_ledger[0].cleanup_status, "VERIFIED");
});

await check("recovery checkpoints Storage CAS mismatch preservation", async () => {
  const checkpoints = [];
  const resource = storageResource();
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        resources: [resource],
        ledger: [
          {
            sequence: 1,
            resource_key: resource.resource_key,
            effect: "CREATE",
            status: "APPLIED",
            cleanup_status: "PENDING",
          },
        ],
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      checkpoints.push(state.effect_ledger[0].cleanup_status);
    },
    inspectOwnedResource: async () => ({
      status: "PRESENT",
      observed_version: "version-1",
    }),
    reconcileOwnedResource: async () => ({
      status: "VERSION_MISMATCH",
      expected_version: "version-1",
      observed_version: "version-2",
    }),
  });
  assertRecoveryFailureProjection(result, "STORAGE_VERSION_MISMATCH");
  assert.equal(checkpoints.at(-1), "VERSION_MISMATCH_PRESERVED");
  assert.ok(
    checkpoints.indexOf("INTENT_ONLY") <
      checkpoints.lastIndexOf("VERSION_MISMATCH_PRESERVED"),
  );
});

await check("Storage CAS preservation never starves later exact-owned effects", async () => {
  const storage = storageResource();
  const branch = branchResource();
  const preview = previewResource();
  const resources = [storage, branch, preview];
  const ledger = resources.map((resource, index) => ({
    sequence: index + 1,
    resource_key: resource.resource_key,
    effect: "CREATE",
    status: "APPLIED",
    cleanup_status: "PENDING",
  }));
  let durable = recoveryState({
    resources,
    ledger,
    budgets: {
      requests: { limit: 16, used: 3 },
      mutations: { limit: 15, used: 3 },
    },
  });
  const present = new Set(resources.map((resource) => resource.resource_key));
  const inspections = [];
  const reconciliations = [];
  const first = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) => {
      inspections.push(resource.resource_type);
      return {
        status: present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { observed_version: "version-2" }
          : {}),
      };
    },
    reconcileOwnedResource: async (resource) => {
      reconciliations.push(resource.resource_type);
      present.delete(resource.resource_key);
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(first, "STORAGE_VERSION_MISMATCH");
  assert.deepEqual(reconciliations, ["PREVIEW_DEPLOYMENT", "GIT_BRANCH"]);
  assert.equal(present.has(storage.resource_key), true);
  assert.equal(present.has(branch.resource_key), false);
  assert.equal(present.has(preview.resource_key), false);
  assert.equal(
    durable.effect_ledger.find((entry) => entry.resource_key === storage.resource_key)
      .cleanup_status,
    "VERSION_MISMATCH_PRESERVED",
  );
  assert.equal(durable.cleanup.verified, false);

  const callsBeforeRetry = {
    inspections: inspections.length,
    reconciliations: reconciliations.length,
  };
  const retried = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) => {
      inspections.push(resource.resource_type);
      return {
        status: present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { observed_version: "version-2" }
          : {}),
      };
    },
    reconcileOwnedResource: async (resource) => {
      reconciliations.push(resource.resource_type);
      throw new Error("a completed or preserved resource must not be deleted twice");
    },
  });
  assertRecoveryFailureProjection(retried, "STORAGE_VERSION_MISMATCH");
  assert.deepEqual(
    { inspections: inspections.length, reconciliations: reconciliations.length },
    callsBeforeRetry,
  );
});

await check("recovery accumulates a resource-local failure and continues reverse cleanup", async () => {
  const row = rowResource();
  const branch = branchResource();
  const preview = previewResource();
  const resources = [row, branch, preview];
  const ledger = resources.map((resource, index) => ({
    sequence: index + 1,
    resource_key: resource.resource_key,
    effect: "CREATE",
    status: "APPLIED",
    cleanup_status: "PENDING",
  }));
  let durable = recoveryState({
    resources,
    ledger,
    budgets: {
      requests: { limit: 16, used: 3 },
      mutations: { limit: 15, used: 3 },
    },
  });
  const present = new Set(resources.map((resource) => resource.resource_key));
  const reconciliations = [];
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) => ({
      status: present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
    }),
    reconcileOwnedResource: async (resource) => {
      reconciliations.push(resource.resource_type);
      if (resource.resource_type === "PREVIEW_DEPLOYMENT") {
        throw new Error("synthetic resource-local reconciliation rejection");
      }
      present.delete(resource.resource_key);
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "RECONCILIATION_FAILED");
  assert.deepEqual(reconciliations, [
    "PREVIEW_DEPLOYMENT",
    "GIT_BRANCH",
    "DATABASE_ROW",
  ]);
  assert.equal(present.has(preview.resource_key), true);
  assert.equal(present.has(branch.resource_key), false);
  assert.equal(present.has(row.resource_key), false);
  assert.equal(durable.cleanup.verified, false);
  assert.equal(durable.recovery.status, "PENDING");
});

await check("forged recovery mutation exhaustion fails without invoking cleanup", async () => {
  let cleanupCalls = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({
        budgets: {
          requests: { limit: 16, used: 1 },
          mutations: { limit: 15, used: 15 },
        },
      }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "PRESENT" }),
    reconcileOwnedResource: async () => {
      cleanupCalls += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(cleanupCalls, 0);
});

await check("recovery terminal checkpoint failure leaves the per-effect journal retryable", async () => {
  let authoritative = recoveryState();
  let present = true;
  const first = await runRecovery({
    loadAuthoritativeState: async () => authoritative,
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      if (state.lifecycle_state === "READY") {
        throw new Error("synthetic terminal checkpoint failure");
      }
      authoritative = structuredClone(state);
    },
    inspectOwnedResource: async () => ({ status: present ? "PRESENT" : "ABSENT" }),
    reconcileOwnedResource: async () => {
      present = false;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(
    first,
    "RECOVERY_TERMINAL_CHECKPOINT_FAILED",
  );
  assert.equal(authoritative.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(authoritative.effect_ledger[0].cleanup_status, "VERIFIED");

  const retried = await runRecovery({
    loadAuthoritativeState: async () => authoritative,
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      authoritative = structuredClone(state);
    },
    inspectOwnedResource: async () => ({ status: "ABSENT" }),
    reconcileOwnedResource: async () => {
      throw new Error("cleaned effect must not be repeated");
    },
  });
  assert.equal(retried.lifecycle_state, "READY");
  assert.equal(authoritative.recovery.status, "COMPLETE");
});

await check("low-level recovery adapter rejection returns a non-journal failure projection", async () => {
  const result = await reconcileRecovery({});
  assertRecoveryFailureProjection(result, "RECOVERY_ADAPTER");
});

async function assertRound14InvalidAbsentCreationProof({
  state,
  creationOperationSlotSha256,
  expectedCode = "OPERATION_RECEIPT_MISMATCH",
}) {
  const durable = [];
  let inspections = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(state),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectPlannedOnly: true,
    checkpointRecoveryState: async (candidate) => {
      durable.push(structuredClone(candidate));
    },
    inspectOwnedResource: async () => {
      inspections += 1;
      return {
        status: "ABSENT",
        creation_operation_slot_sha256: creationOperationSlotSha256,
      };
    },
    reconcileOwnedResource: async () => {
      throw new Error("invalid ABSENT proof must not reconcile");
    },
  });
  assertRecoveryFailureProjection(result, expectedCode);
  assert.equal(inspections, state.resource_plan.length);
  assert.ok(durable.length > 0);
  assert.equal(
    durable.some((candidate) => candidate.lifecycle_state === "READY"),
    false,
    "terminal validation must run before the terminal checkpoint adapter",
  );
  const prior = durable.at(-1);
  assert.equal(prior.lifecycle_state, "FAILED_RECOVERABLE");
  validateCheckpointProtocol(prior);

  const recovered = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(prior),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectOwnedResource: async () => ({ status: "ABSENT" }),
    reconcileOwnedResource: async () => {
      throw new Error("valid ABSENT retry must not reconcile");
    },
  });
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome?.code);
  assert.equal(recovered.recovery.status, "COMPLETE");
}

await check("Round14 pre-create ABSENT rejects an extra creation slot before terminal persistence", async () => {
  const mutable = recoveryState({ ledger: [] });
  mutable.owned_resources = [];
  mutable.cleanup.required = false;
  const state = sealCheckpoint(
    mutable,
    mutable.checkpoint.sequence,
    mutable.checkpoint.predecessor_checkpoint_identity_sha256,
  );
  await assertRound14InvalidAbsentCreationProof({
    state,
    creationOperationSlotSha256: "9".repeat(64),
  });
});

await check("Round14 ledger-backed ABSENT rejects a substituted creation slot before terminal persistence", async () => {
  const state = recoveryState();
  const exactCreationSlot = state.effect_ledger[0].creation_operation_slot_sha256;
  assert.notEqual(exactCreationSlot, "9".repeat(64));
  await assertRound14InvalidAbsentCreationProof({
    state,
    creationOperationSlotSha256: "9".repeat(64),
  });
});

function round20RecoverySlot(state, operation, resourceKey) {
  return state.recovery_operation_state.operation_slots.find(
    (slot) =>
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
}

function round20RewriteRecoveryReceipt(state, operation, resourceKey, rewrite) {
  const slot = round20RecoverySlot(state, operation, resourceKey);
  assert.ok(slot, `${operation}:${resourceKey}`);
  assert.ok(["RECEIPT_KNOWN", "RESULT_APPLIED"].includes(slot.status));
  slot.receipt = rewrite(structuredClone(slot.receipt));
  slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
  return slot;
}

function round20ResealCurrentCheckpoint(state) {
  return sealCheckpoint(
    state,
    state.checkpoint.sequence,
    state.checkpoint.predecessor_checkpoint_identity_sha256,
  );
}

function round20LegacyIndependentBinding(state, slot) {
  return sha256Hex(canonicalJson({
    schema_version: 1,
    domain: "LAUNCH_OPERATIONS_RECOVERY_OPERATION_BINDING",
    journal_identity_sha256: state.journal_identity_sha256,
    recovery_anchor_checkpoint_identity_sha256:
      state.recovery_operation_state.recovery_anchor
        .checkpoint_identity_sha256,
    operation_slot_sha256: slot.operation_slot_sha256,
  }));
}

async function round20AuthenticRecoveryTrace() {
  const target = rowResource();
  const checkpoints = [];
  let present = true;
  let targetInspections = 0;
  let targetDeletions = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () => recoveryState({ resources: [target] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      checkpoints.push(structuredClone(state));
    },
    inspectOwnedResource: async (resource) => {
      if (resource.resource_key === target.resource_key) {
        targetInspections += 1;
      }
      return { status: present ? "PRESENT" : "ABSENT" };
    },
    reconcileOwnedResource: async (resource) => {
      assert.equal(resource.resource_key, target.resource_key);
      targetDeletions += 1;
      present = false;
      return { status: "DELETED_EXACT" };
    },
  });
  return {
    checkpoints,
    result,
    target,
    targetDeletions,
    targetInspections,
  };
}

async function round20PreAdapterAttempt(state) {
  const calls = {
    head: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  };
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => structuredClone(state),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    recovery_capability_sha256: sha256Hex(canonicalJson({
      schema_version: 1,
      domain: "LAUNCH_OPERATIONS_EXACT_RECOVERY_CAPABILITY",
      journal_identity_sha256: state.journal_identity_sha256,
      checkpoint_identity_sha256:
        state.checkpoint.checkpoint_identity_sha256,
      authority_receipt_sha256:
        state.recovery_operation_state.recovery_grant
          .authority_receipt_sha256,
      review_sha256:
        state.recovery_operation_state.recovery_grant.review_sha256,
    })),
    checkpointRecoveryState: async (_candidate, command) => {
      calls.checkpoint += 1;
      return checkpointReceipt(command);
    },
    readCheckpointHead: async () => {
      calls.head += 1;
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
    inspectOwnedResource: async (_resource, context) => {
      calls.inspect += 1;
      return {
        status: "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
    reconcileOwnedResource: async (resource, _contract, context) => {
      calls.reconcile += 1;
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
  });
  return { calls, result };
}

const round20Trace = await round20AuthenticRecoveryTrace();
const round20TargetKey = round20Trace.target.resource_key;

await check("Round20 authentic recovery receipt prefixes remain admissible", async () => {
  assert.equal(round20Trace.targetInspections, 2);
  assert.equal(round20Trace.targetDeletions, 1);
  for (const state of round20Trace.checkpoints.filter(
    (candidate) => candidate.lifecycle_state === "FAILED_RECOVERABLE",
  )) {
    assert.equal(validateRecoveryState(state).ordered.length >= 0, true);
  }
  assert.equal(validateTerminalState(round20Trace.result).terminal_kind, "RECOVERY_COMPLETE");
});

for (const operation of [
  "RECOVERY_INSPECT",
  "RECOVERY_DELETE_EXACT",
  "RECOVERY_VERIFY_ABSENT",
]) {
  await check(
    `Round20 ${operation} receipt is exact before mutable admission`,
    async () => {
      const source = round20Trace.checkpoints.find((candidate) => {
        const slot = round20RecoverySlot(
          candidate,
          operation,
          round20TargetKey,
        );
        return slot?.status === "RECEIPT_KNOWN";
      });
      assert.ok(source, operation);
      const mutant = structuredClone(source);
      round20RewriteRecoveryReceipt(
        mutant,
        operation,
        round20TargetKey,
        (receipt) => ({ ...receipt, unreviewed_field: "forbidden" }),
      );
      const sealed = round20ResealCurrentCheckpoint(mutant);
      const attempt = await round20PreAdapterAttempt(sealed);
      assert.deepEqual(attempt.calls, {
        head: 0,
        checkpoint: 0,
        inspect: 0,
        reconcile: 0,
      });
      assertRecoveryFailureProjection(
        attempt.result,
        "RECOVERY_STATE_INVALID",
      );
    },
  );
}

await check("Round20 malformed recovery delete never becomes durable receipt-known", async () => {
  const target = rowResource();
  let durable = recoveryState({ resources: [target] });
  const checkpoints = [];
  let present = true;
  let deleteCalls = 0;
  const first = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
      checkpoints.push(structuredClone(state));
    },
    inspectOwnedResource: async () => ({
      status: present ? "PRESENT" : "ABSENT",
    }),
    reconcileOwnedResource: async () => {
      deleteCalls += 1;
      return { status: "REJECTED" };
    },
  });
  assertRecoveryFailureProjection(first, "OPERATION_RECEIPT_MISMATCH");
  assert.equal(deleteCalls, 1);
  assert.equal(
    checkpoints.some((state) => {
      const slot = round20RecoverySlot(
        state,
        "RECOVERY_DELETE_EXACT",
        target.resource_key,
      );
      return (
        ["RECEIPT_KNOWN", "RESULT_APPLIED"].includes(slot?.status) &&
        slot.receipt?.status === "REJECTED"
      );
    }),
    false,
  );
  assert.equal(
    round20RecoverySlot(
      durable,
      "RECOVERY_DELETE_EXACT",
      target.resource_key,
    ).status,
    "RESERVED",
  );

  const retried = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async () => ({
      status: present ? "PRESENT" : "ABSENT",
    }),
    reconcileOwnedResource: async () => {
      deleteCalls += 1;
      present = false;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(retried.lifecycle_state, "READY");
  assert.equal(retried.recovery.status, "COMPLETE");
  assert.equal(deleteCalls, 2);
  assert.equal(retried.budgets.mutations.used, 2);
});

function round20StalePreDeleteAbsencePrefix() {
  const state = recoveryState();
  const resource = state.owned_resources[0];
  const ledger = state.effect_ledger[0];
  const initial = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    resource.resource_key,
  );
  const verification = round20RecoverySlot(
    state,
    "RECOVERY_VERIFY_ABSENT",
    resource.resource_key,
  );
  for (const [slot, receipt] of [
    [
      initial,
      {
        status: "PRESENT",
        creation_operation_slot_sha256:
          ledger.creation_operation_slot_sha256,
      },
    ],
    [verification, { status: "ABSENT" }],
  ]) {
    slot.operation_binding_sha256 =
      round20LegacyIndependentBinding(state, slot);
    slot.status = "RESULT_APPLIED";
    slot.receipt = {
      ...receipt,
      operation_slot_sha256: slot.operation_slot_sha256,
      operation_binding_sha256: slot.operation_binding_sha256,
    };
    slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
  }
  state.budgets.requests.used += 2;
  return round20ResealCurrentCheckpoint(state);
}

await check("Round20 pre-delete ABSENT recovery proof is rejected before every adapter", async () => {
  const stale = round20StalePreDeleteAbsencePrefix();
  const attempt = await round20PreAdapterAttempt(stale);
  assert.deepEqual(attempt.calls, {
    head: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(attempt.result, "RECOVERY_STATE_INVALID");
});

await check("Round20 terminal recovery receipt binding proves delete-before-absence", async () => {
  const mutant = structuredClone(round20Trace.result);
  const verification = round20RecoverySlot(
    mutant,
    "RECOVERY_VERIFY_ABSENT",
    round20TargetKey,
  );
  assert.equal(verification.status, "RESULT_APPLIED");
  verification.operation_binding_sha256 =
    round20LegacyIndependentBinding(mutant, verification);
  verification.receipt.operation_binding_sha256 =
    verification.operation_binding_sha256;
  verification.receipt_sha256 = sha256Hex(
    canonicalJson(verification.receipt),
  );
  const sealed = round20ResealCurrentCheckpoint(mutant);
  assert.throws(
    () => validateTerminalState(sealed),
    (error) => error?.code === "RECOVERY_STATE_INVALID",
  );
});

function round21CompactEvidenceInput(state) {
  return {
    schema_version: 1,
    authority_envelope: structuredClone(state.authority_envelope),
    authority_envelope_sha256: state.authority_envelope_sha256,
    candidate_identity_sha256: state.candidate_identity_sha256,
    run_id: state.run_id,
    phase: state.phase,
    operation_class: state.operation_class,
    operation_reservation: structuredClone(state.operation_reservation),
    recovery_operation_state: structuredClone(state.recovery_operation_state),
    review_approval_sha256: state.review_approval_sha256,
    lifecycle_state: state.lifecycle_state,
    authorization_class: state.authorization_class,
    budgets: structuredClone(state.budgets),
    owned_resources: structuredClone(state.owned_resources),
    effect_ledger: structuredClone(state.effect_ledger),
    freeze_document_sha256: state.freeze_document_sha256,
    cleanup: structuredClone(state.cleanup),
    recovery: structuredClone(state.recovery),
    retained_state_sha256: state.retained_state_sha256,
    resource_plan: structuredClone(state.resource_plan),
    resource_plan_sha256: state.resource_plan_sha256,
    outcome: structuredClone(state.outcome),
    immutable_audit_reference_sha256: [
      state.freeze_document_sha256,
      state.retained_state_sha256,
    ],
    journal_identity_sha256: state.journal_identity_sha256,
  };
}

function round21CompactEvidencePayload(state) {
  const payload = round21CompactEvidenceInput(state);
  return {
    ...payload,
    evidence_identity_sha256: sha256Hex(canonicalJson(payload)),
  };
}

function round21ResealTerminal(state) {
  const candidate = structuredClone(state);
  candidate.final_evidence_identity_sha256 = sha256Hex(
    canonicalJson(round21CompactEvidenceInput(candidate)),
  );
  return round20ResealCurrentCheckpoint(candidate);
}

function round21RefreshReceipt(slot) {
  slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
}

function round21RebindCausalSuffix(state, resourceKey) {
  const anchor = state.recovery_operation_state.recovery_anchor;
  const inspection = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    resourceKey,
  );
  const deletion = round20RecoverySlot(
    state,
    "RECOVERY_DELETE_EXACT",
    resourceKey,
  );
  const verification = round20RecoverySlot(
    state,
    "RECOVERY_VERIFY_ABSENT",
    resourceKey,
  );
  if (deletion.status !== "NOT_STARTED") {
    deletion.operation_binding_sha256 = deriveRecoveryOperationBindingSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      recovery_anchor_checkpoint_identity_sha256:
        anchor.checkpoint_identity_sha256,
      operation_slot_sha256: deletion.operation_slot_sha256,
      prerequisite_receipt_sha256: inspection.receipt_sha256,
    });
    if (["RECEIPT_KNOWN", "RESULT_APPLIED"].includes(deletion.status)) {
      deletion.receipt.operation_binding_sha256 =
        deletion.operation_binding_sha256;
      round21RefreshReceipt(deletion);
    }
  }
  if (verification.status !== "NOT_STARTED") {
    verification.operation_binding_sha256 =
      deriveRecoveryOperationBindingSha256({
        journal_identity_sha256: state.journal_identity_sha256,
        recovery_anchor_checkpoint_identity_sha256:
          anchor.checkpoint_identity_sha256,
        operation_slot_sha256: verification.operation_slot_sha256,
        prerequisite_receipt_sha256: deletion.receipt_sha256,
      });
    if (["RECEIPT_KNOWN", "RESULT_APPLIED"].includes(verification.status)) {
      verification.receipt.operation_binding_sha256 =
        verification.operation_binding_sha256;
      round21RefreshReceipt(verification);
    }
  }
}

function round21PhaseState(
  trace,
  inspectionStatus,
  deletionStatus,
  verificationStatus,
) {
  const source = trace.checkpoints.find((candidate) => {
    if (candidate.lifecycle_state !== "FAILED_RECOVERABLE") return false;
    return (
      round20RecoverySlot(
        candidate,
        "RECOVERY_INSPECT",
        trace.resource.resource_key,
      )?.status === inspectionStatus &&
      round20RecoverySlot(
        candidate,
        "RECOVERY_DELETE_EXACT",
        trace.resource.resource_key,
      )?.status === deletionStatus &&
      round20RecoverySlot(
        candidate,
        "RECOVERY_VERIFY_ABSENT",
        trace.resource.resource_key,
      )?.status === verificationStatus
    );
  });
  assert.ok(
    source,
    `${inspectionStatus}/${deletionStatus}/${verificationStatus}`,
  );
  return structuredClone(source);
}

async function round21RecoveryTrace({
  resource = storageResource(),
  initialObservation = {
    status: "PRESENT",
    observed_version: "version-1",
  },
  postDeleteObservation = {
    status: "ABSENT",
    observed_version: null,
  },
} = {}) {
  const checkpoints = [];
  let deleted = false;
  let inspections = 0;
  let reconciliations = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () =>
      recoveryState({ resources: [resource] }),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      checkpoints.push(structuredClone(state));
    },
    inspectOwnedResource: async (candidate) => {
      if (candidate.resource_key !== resource.resource_key) {
        return { status: "ABSENT" };
      }
      inspections += 1;
      return structuredClone(
        deleted ? postDeleteObservation : initialObservation,
      );
    },
    reconcileOwnedResource: async (_candidate, contract) => {
      reconciliations += 1;
      deleted = true;
      return {
        status: "DELETED_EXACT",
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { expected_version: contract.expected_version }
          : {}),
      };
    },
  });
  return {
    checkpoints,
    inspections,
    reconciliations,
    resource,
    result,
  };
}

async function round21AssertPreAdapterRejected(state) {
  const attempt = await round20PreAdapterAttempt(
    round20ResealCurrentCheckpoint(state),
  );
  assert.deepEqual(attempt.calls, {
    head: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(attempt.result, "RECOVERY_STATE_INVALID");
}

const round21StorageTrace = await round21RecoveryTrace();
const round21StorageKey = round21StorageTrace.resource.resource_key;
const round21InitialAbsentTrace = await round21RecoveryTrace({
  initialObservation: { status: "ABSENT", observed_version: null },
});
const round21ContradictionTrace = await round21RecoveryTrace({
  resource: rowResource(),
  initialObservation: { status: "PRESENT" },
  postDeleteObservation: { status: "PRESENT" },
});

await check("Round21 authentic recovery N/R/K/A ledger phases remain admissible", async () => {
  validateRecoveryState(recoveryState({
    resources: [round21StorageTrace.resource],
  }));
  for (const phase of [
    ["RESERVED", "NOT_STARTED", "NOT_STARTED"],
    ["RECEIPT_KNOWN", "NOT_STARTED", "NOT_STARTED"],
    ["RESULT_APPLIED", "NOT_STARTED", "NOT_STARTED"],
    ["RESULT_APPLIED", "RESERVED", "NOT_STARTED"],
    ["RESULT_APPLIED", "RECEIPT_KNOWN", "NOT_STARTED"],
    ["RESULT_APPLIED", "RESULT_APPLIED", "NOT_STARTED"],
    ["RESULT_APPLIED", "RESULT_APPLIED", "RESERVED"],
    ["RESULT_APPLIED", "RESULT_APPLIED", "RECEIPT_KNOWN"],
    ["RESULT_APPLIED", "RESULT_APPLIED", "RESULT_APPLIED"],
  ]) {
    validateRecoveryState(round21PhaseState(round21StorageTrace, ...phase));
  }
  assert.equal(
    validateTerminalState(round21StorageTrace.result).terminal_kind,
    "RECOVERY_COMPLETE",
  );
});

await check("Round21 actual Storage ABSENT rejects a nonnull observed version", async () => {
  const contradictoryAbsence = await round21RecoveryTrace({
    postDeleteObservation: {
      status: "ABSENT",
      observed_version: "version-2",
    },
  });
  assertRecoveryFailureProjection(
    contradictoryAbsence.result,
    "OPERATION_RECEIPT_MISMATCH",
  );
  assert.equal(contradictoryAbsence.reconciliations, 1);
  const lastContradictory = contradictoryAbsence.checkpoints.at(-1);
  assert.equal(
    round20RecoverySlot(
      lastContradictory,
      "RECOVERY_VERIFY_ABSENT",
      contradictoryAbsence.resource.resource_key,
    ).status,
    "RESERVED",
  );
});

await check("Round21 actual Storage PRESENT requires an observed version", async () => {
  const missingPresentVersion = await round21RecoveryTrace({
    initialObservation: { status: "PRESENT" },
  });
  assertRecoveryFailureProjection(
    missingPresentVersion.result,
    "OPERATION_RECEIPT_MISMATCH",
  );
  assert.equal(missingPresentVersion.reconciliations, 0);
});

await check("Round21 actual non-Storage inspection rejects a version field", async () => {
  const nonStorageVersion = await round21RecoveryTrace({
    resource: rowResource(),
    initialObservation: {
      status: "PRESENT",
      observed_version: "not-a-row-field",
    },
    postDeleteObservation: { status: "ABSENT" },
  });
  assertRecoveryFailureProjection(
    nonStorageVersion.result,
    "OPERATION_RECEIPT_MISMATCH",
  );
  assert.equal(nonStorageVersion.reconciliations, 0);
});

await check("Round21 Storage ABSENT permits only omitted or null version", async () => {
  const omitted = await round21RecoveryTrace({
    postDeleteObservation: { status: "ABSENT" },
  });
  const explicitNull = await round21RecoveryTrace({
    postDeleteObservation: { status: "ABSENT", observed_version: null },
  });
  assert.equal(omitted.result.lifecycle_state, "READY");
  assert.equal(explicitNull.result.lifecycle_state, "READY");
});

await check("Round21 contradictory Storage ABSENT mutable prefix is rejected pre-adapter", async () => {
  const mutant = round21PhaseState(
    round21StorageTrace,
    "RESULT_APPLIED",
    "RESULT_APPLIED",
    "RESULT_APPLIED",
  );
  const verification = round20RecoverySlot(
    mutant,
    "RECOVERY_VERIFY_ABSENT",
    round21StorageKey,
  );
  verification.receipt.observed_version = "version-2";
  round21RefreshReceipt(verification);
  await round21AssertPreAdapterRejected(mutant);
});

await check("Round21 contradictory Storage ABSENT terminal is rejected", async () => {
  const mutant = structuredClone(round21StorageTrace.result);
  const verification = round20RecoverySlot(
    mutant,
    "RECOVERY_VERIFY_ABSENT",
    round21StorageKey,
  );
  verification.receipt.observed_version = "version-2";
  round21RefreshReceipt(verification);
  const sealed = round21ResealTerminal(mutant);
  assert.throws(
    () => validateTerminalState(sealed),
    (error) => error?.code === "RECOVERY_STATE_INVALID",
  );
  assert.throws(
    () => validateCompactEvidence(round21CompactEvidencePayload(sealed)),
    (error) => error?.code === "EVIDENCE_SHAPE",
  );
});

await check("Round21 wrong-version deletion authority is rejected by terminal and compact admission", async () => {
  const mutant = structuredClone(round21StorageTrace.result);
  const inspection = round20RecoverySlot(
    mutant,
    "RECOVERY_INSPECT",
    round21StorageKey,
  );
  inspection.receipt.observed_version = "version-2";
  round21RefreshReceipt(inspection);
  round21RebindCausalSuffix(mutant, round21StorageKey);
  const sealed = round21ResealTerminal(mutant);
  assert.throws(
    () => validateTerminalState(sealed),
    (error) => error?.code === "RECOVERY_STATE_INVALID",
  );
  assert.throws(
    () => validateCompactEvidence(round21CompactEvidencePayload(sealed)),
    (error) => error?.code === "EVIDENCE_SHAPE",
  );
});

function round21MissingLedgerMutant(deletionStatus) {
  const state = round21PhaseState(
    round21StorageTrace,
    "RESULT_APPLIED",
    deletionStatus,
    "NOT_STARTED",
  );
  state.owned_resources = state.owned_resources.filter(
    (resource) => resource.resource_key !== round21StorageKey,
  );
  state.effect_ledger = state.effect_ledger.filter(
    (entry) => entry.resource_key !== round21StorageKey,
  );
  state.cleanup.required = false;
  const creation = state.recovery_operation_state
    .qualification_operation_slots.find(
      (slot) =>
        slot.operation === "QUALIFICATION_CREATE_NEW" &&
        slot.resource_key === round21StorageKey,
    );
  state.recovery_operation_state.qualification_slot_usage.mutations =
    state.recovery_operation_state.qualification_slot_usage.mutations.filter(
      (slotSha256) => slotSha256 !== creation.operation_slot_sha256,
    );
  Object.assign(creation, {
    reservation_ordinal: null,
    predecessor_reservation_proof_sha256: null,
    reservation_proof_sha256: null,
    status: "NOT_STARTED",
    receipt: null,
    receipt_sha256: null,
  });
  state.budgets.mutations.used -= 1;
  const inspection = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    round21StorageKey,
  );
  delete inspection.receipt.creation_operation_slot_sha256;
  round21RefreshReceipt(inspection);
  round21RebindCausalSuffix(state, round21StorageKey);
  return state;
}

for (const deletionStatus of [
  "RESERVED",
  "RECEIPT_KNOWN",
  "RESULT_APPLIED",
]) {
  await check(
    `Round21 missing-ledger PRESENT cannot authorize delete ${deletionStatus}`,
    async () => {
      await round21AssertPreAdapterRejected(
        round21MissingLedgerMutant(deletionStatus),
      );
    },
  );
}

function round21UnconfirmedCreateMutant(deletionStatus) {
  const state = round21PhaseState(
    round21StorageTrace,
    "RESULT_APPLIED",
    deletionStatus,
    "NOT_STARTED",
  );
  const creation = state.recovery_operation_state
    .qualification_operation_slots.find(
      (slot) =>
        slot.operation === "QUALIFICATION_CREATE_NEW" &&
        slot.resource_key === round21StorageKey,
    );
  creation.status = "RESERVED";
  creation.receipt = null;
  creation.receipt_sha256 = null;
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  entry.status = "UNCERTAIN";
  entry.cleanup_status = "INTENT_ONLY";
  entry.creation_receipt_sha256 = null;
  const inspection = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    round21StorageKey,
  );
  delete inspection.receipt.creation_operation_slot_sha256;
  round21RefreshReceipt(inspection);
  round21RebindCausalSuffix(state, round21StorageKey);
  return state;
}

for (const deletionStatus of ["RESERVED", "RECEIPT_KNOWN"]) {
  await check(
    `Round21 unconfirmed creation cannot authorize delete ${deletionStatus}`,
    async () => {
      await round21AssertPreAdapterRejected(
        round21UnconfirmedCreateMutant(deletionStatus),
      );
    },
  );
}

await check("Round21 unconfirmed creation cannot support an applied delete contradiction", async () => {
  const resourceKey = round21ContradictionTrace.resource.resource_key;
  const mutant = round21PhaseState(
    round21ContradictionTrace,
    "RESULT_APPLIED",
    "RESULT_APPLIED",
    "RESULT_APPLIED",
  );
  const creation = mutant.recovery_operation_state
    .qualification_operation_slots.find(
      (slot) =>
        slot.operation === "QUALIFICATION_CREATE_NEW" &&
        slot.resource_key === resourceKey,
    );
  creation.status = "RESERVED";
  creation.receipt = null;
  creation.receipt_sha256 = null;
  const entry = mutant.effect_ledger.find(
    (candidate) => candidate.resource_key === resourceKey,
  );
  entry.status = "UNCERTAIN";
  entry.cleanup_status = "UNCERTAIN";
  entry.creation_receipt_sha256 = null;
  const inspection = round20RecoverySlot(
    mutant,
    "RECOVERY_INSPECT",
    resourceKey,
  );
  delete inspection.receipt.creation_operation_slot_sha256;
  round21RefreshReceipt(inspection);
  round21RebindCausalSuffix(mutant, resourceKey);
  await round21AssertPreAdapterRejected(mutant);
});

function round21StorageVersionMutant(
  deletionStatus,
  observedVersion,
  cleanupStatus,
) {
  const state = round21PhaseState(
    round21StorageTrace,
    "RESULT_APPLIED",
    deletionStatus,
    "NOT_STARTED",
  );
  const inspection = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    round21StorageKey,
  );
  if (observedVersion === undefined) {
    delete inspection.receipt.observed_version;
  } else {
    inspection.receipt.observed_version = observedVersion;
  }
  round21RefreshReceipt(inspection);
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  if (cleanupStatus === "VERSION_MISMATCH_PRESERVED") {
    entry.status = "APPLIED";
    entry.cleanup_status = cleanupStatus;
  }
  round21RebindCausalSuffix(state, round21StorageKey);
  return state;
}

for (const observedVersion of [undefined, "version-2"]) {
  for (const deletionStatus of [
    "RESERVED",
    "RECEIPT_KNOWN",
    "RESULT_APPLIED",
  ]) {
    await check(
      `Round21 Storage ${
        observedVersion === undefined ? "omitted" : "wrong"
      } version cannot authorize delete ${deletionStatus}`,
      async () => {
        await round21AssertPreAdapterRejected(
          round21StorageVersionMutant(
            deletionStatus,
            observedVersion,
            null,
          ),
        );
      },
    );
  }
}

for (const deletionStatus of [
  "RESERVED",
  "RECEIPT_KNOWN",
  "RESULT_APPLIED",
]) {
  await check(
    `Round21 mismatch preservation forbids later delete ${deletionStatus}`,
    async () => {
      await round21AssertPreAdapterRejected(
        round21StorageVersionMutant(
          deletionStatus,
          "version-2",
          "VERSION_MISMATCH_PRESERVED",
        ),
      );
    },
  );
}

await check("Round21 applied initial ABSENT cannot retain stale ledger", async () => {
  const mutant = round21PhaseState(
    round21InitialAbsentTrace,
    "RESULT_APPLIED",
    "NOT_STARTED",
    "NOT_STARTED",
  );
  const entry = mutant.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  entry.status = "APPLIED";
  entry.cleanup_status = "PENDING";
  await round21AssertPreAdapterRejected(mutant);
});

for (const verificationStatus of [
  "NOT_STARTED",
  "RESERVED",
  "RECEIPT_KNOWN",
]) {
  await check(
    `Round21 cleanup cannot become VERIFIED at verifier ${verificationStatus}`,
    async () => {
      const mutant = round21PhaseState(
        round21StorageTrace,
        "RESULT_APPLIED",
        "RESULT_APPLIED",
        verificationStatus,
      );
      const entry = mutant.effect_ledger.find(
        (candidate) => candidate.resource_key === round21StorageKey,
      );
      entry.status = "CLEANED";
      entry.cleanup_status = "VERIFIED";
      await round21AssertPreAdapterRejected(mutant);
    },
  );
}

await check("Round21 applied ABSENT verifier cannot retain pre-apply ledger", async () => {
  const mutant = round21PhaseState(
    round21StorageTrace,
    "RESULT_APPLIED",
    "RESULT_APPLIED",
    "RESULT_APPLIED",
  );
  const entry = mutant.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  entry.status = "CLEANED";
  entry.cleanup_status = "APPLIED";
  await round21AssertPreAdapterRejected(mutant);
});

await check("Round21 applied contradictory verifier requires unresolved ledger", async () => {
  const contradictionKey = round21ContradictionTrace.resource.resource_key;
  const mutant = round21PhaseState(
    round21ContradictionTrace,
    "RESULT_APPLIED",
    "RESULT_APPLIED",
    "RESULT_APPLIED",
  );
  const entry = mutant.effect_ledger.find(
    (candidate) => candidate.resource_key === contradictionKey,
  );
  entry.status = "CLEANED";
  entry.cleanup_status = "APPLIED";
  await round21AssertPreAdapterRejected(mutant);
});

await check("Round21 non-authorizing observations remain recovery-admissible", async () => {
  const mismatch = round21StorageVersionMutant(
    "NOT_STARTED",
    "version-2",
    "VERSION_MISMATCH_PRESERVED",
  );
  validateRecoveryState(round20ResealCurrentCheckpoint(mismatch));

  let durable = recoveryState({ resources: [], ledger: [] });
  durable.cleanup.required = false;
  durable = round20ResealCurrentCheckpoint(durable);
  let reconciliations = 0;
  const plannedStorage = durable.resource_plan.find(
    (resource) => resource.resource_type === "STORAGE_OBJECT",
  );
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    inspectPlannedOnly: true,
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) =>
      resource.resource_key === plannedStorage.resource_key
        ? { status: "PRESENT", observed_version: "version-1" }
        : { status: "ABSENT" },
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "INTENT_OWNERSHIP_UNPROVEN");
  assert.equal(reconciliations, 0);
  assert.equal(
    round20RecoverySlot(
      durable,
      "RECOVERY_DELETE_EXACT",
      plannedStorage.resource_key,
    ).status,
    "NOT_STARTED",
  );
  validateRecoveryState(durable);
});

function round21ReservedCreateState(inspectionStatus = "NOT_STARTED") {
  const state = round21PhaseState(
    round21StorageTrace,
    inspectionStatus,
    "NOT_STARTED",
    "NOT_STARTED",
  );
  const creation = state.recovery_operation_state
    .qualification_operation_slots.find(
      (slot) =>
        slot.operation === "QUALIFICATION_CREATE_NEW" &&
        slot.resource_key === round21StorageKey,
    );
  Object.assign(creation, {
    status: "RESERVED",
    receipt: null,
    receipt_sha256: null,
  });
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  Object.assign(entry, {
    status: "INTENT_ONLY",
    cleanup_status: "PENDING",
    creation_receipt_sha256: null,
  });
  return state;
}

await check("Round21 applied PRESENT cannot retain its pre-inspection intent ledger", async () => {
  await round21AssertPreAdapterRejected(
    round21ReservedCreateState("RESULT_APPLIED"),
  );
});

await check("Round21 create-response-loss Storage mismatch commits its exact ledger decision", async () => {
  let durable = round20ResealCurrentCheckpoint(
    round21ReservedCreateState("NOT_STARTED"),
  );
  validateRecoveryState(durable);
  let reconciliations = 0;
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      durable = structuredClone(state);
    },
    inspectOwnedResource: async (resource) =>
      resource.resource_key === round21StorageKey
        ? {
            status: "PRESENT",
            observed_version: "version-2",
            creation_operation_slot_sha256:
              durable.effect_ledger[0].creation_operation_slot_sha256,
          }
        : { status: "ABSENT" },
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "STORAGE_VERSION_MISMATCH");
  assert.equal(reconciliations, 0);
  const entry = durable.effect_ledger.find(
    (candidate) => candidate.resource_key === round21StorageKey,
  );
  assert.deepEqual(
    { status: entry.status, cleanup_status: entry.cleanup_status },
    {
      status: "UNCERTAIN",
      cleanup_status: "VERSION_MISMATCH_PRESERVED",
    },
  );
  assert.equal(
    round20RecoverySlot(
      durable,
      "RECOVERY_INSPECT",
      round21StorageKey,
    ).status,
    "RESULT_APPLIED",
  );
  assert.equal(
    round20RecoverySlot(
      durable,
      "RECOVERY_DELETE_EXACT",
      round21StorageKey,
    ).status,
    "NOT_STARTED",
  );
  validateRecoveryState(durable);
});

function round22LatestPhaseState(
  trace,
  inspectionStatus,
  deletionStatus,
  verificationStatus,
) {
  const source = trace.checkpoints.filter((candidate) => {
    if (candidate.lifecycle_state !== "FAILED_RECOVERABLE") return false;
    return (
      round20RecoverySlot(
        candidate,
        "RECOVERY_INSPECT",
        trace.resource.resource_key,
      )?.status === inspectionStatus &&
      round20RecoverySlot(
        candidate,
        "RECOVERY_DELETE_EXACT",
        trace.resource.resource_key,
      )?.status === deletionStatus &&
      round20RecoverySlot(
        candidate,
        "RECOVERY_VERIFY_ABSENT",
        trace.resource.resource_key,
      )?.status === verificationStatus
    );
  }).at(-1);
  assert.ok(
    source,
    `${inspectionStatus}/${deletionStatus}/${verificationStatus}`,
  );
  return structuredClone(source);
}

function round22AssertBudgetAccounting(state) {
  for (const category of ["requests", "mutations"]) {
    const qualificationUsed =
      state.recovery_operation_state.qualification_slot_usage[category].length;
    const recoveryUsed = state.recovery_operation_state.operation_slots.filter(
      (slot) => slot.category === category && slot.status !== "NOT_STARTED",
    ).length;
    assert.equal(
      state.budgets[category].used,
      qualificationUsed + recoveryUsed,
      `${category} accounting`,
    );
    assert.ok(
      state.budgets[category].used <= state.budgets[category].limit,
      `${category} bound`,
    );
  }
}

function round22QualificationCleanedState(resource, cleanupStatus) {
  return recoveryState({
    resources: [resource],
    ledger: [
      {
        sequence: 1,
        resource_key: resource.resource_key,
        effect: "CREATE",
        status: "CLEANED",
        cleanup_status: cleanupStatus,
      },
    ],
    qualificationDeletes: [resource.resource_key],
  });
}

async function round22RunFromState(state, {
  target,
  initialObservation,
  postDeleteObservation = target.resource_type === "STORAGE_OBJECT"
    ? { status: "ABSENT", observed_version: null }
    : { status: "ABSENT" },
}) {
  let durable = structuredClone(state);
  let deleted = false;
  const calls = { inspect: 0, reconcile: 0 };
  const checkpoints = [];
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(durable),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (candidate) => {
      durable = structuredClone(candidate);
      checkpoints.push(structuredClone(candidate));
    },
    inspectOwnedResource: async (resource) => {
      assert.equal(resource.resource_key, target.resource_key);
      calls.inspect += 1;
      return structuredClone(
        deleted ? postDeleteObservation : initialObservation,
      );
    },
    reconcileOwnedResource: async (resource, contract) => {
      assert.equal(resource.resource_key, target.resource_key);
      calls.reconcile += 1;
      deleted = true;
      return {
        status: "DELETED_EXACT",
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { expected_version: contract.expected_version }
          : {}),
      };
    },
  });
  return { calls, checkpoints, durable, result };
}

await check("Round22 resumes authentic post-delete verifier N/R/K contradictions atomically", async () => {
  const traces = new Map([
    ["PRESENT", round21ContradictionTrace],
    [
      "AMBIGUOUS",
      await round21RecoveryTrace({
        resource: rowResource(),
        initialObservation: { status: "PRESENT" },
        postDeleteObservation: { status: "AMBIGUOUS" },
      }),
    ],
  ]);
  for (const [observationStatus, trace] of traces) {
    for (const phase of ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"]) {
      const source = round22LatestPhaseState(
        trace,
        "RESULT_APPLIED",
        "RESULT_APPLIED",
        phase,
      );
      const sourceBudget = structuredClone(source.budgets);
      const sourceKnownReceipt = round20RecoverySlot(
        source,
        "RECOVERY_VERIFY_ABSENT",
        trace.resource.resource_key,
      ).receipt_sha256;
      const resumed = await round22RunFromState(source, {
        target: trace.resource,
        initialObservation: { status: observationStatus },
      });
      assertRecoveryFailureProjection(
        resumed.result,
        "CLEANUP_VERIFICATION_FAILED",
      );
      assert.deepEqual(
        resumed.calls,
        {
          inspect: phase === "RECEIPT_KNOWN" ? 0 : 1,
          reconcile: 0,
        },
        `${observationStatus}/${phase} adapter replay`,
      );
      const finalVerification = round20RecoverySlot(
        resumed.durable,
        "RECOVERY_VERIFY_ABSENT",
        trace.resource.resource_key,
      );
      assert.equal(finalVerification.status, "RESULT_APPLIED");
      assert.equal(finalVerification.receipt.status, observationStatus);
      if (phase === "RECEIPT_KNOWN") {
        assert.equal(finalVerification.receipt_sha256, sourceKnownReceipt);
      }
      const finalEntry = resumed.durable.effect_ledger.find(
        (entry) => entry.resource_key === trace.resource.resource_key,
      );
      assert.deepEqual(
        {
          status: finalEntry.status,
          cleanup_status: finalEntry.cleanup_status,
        },
        { status: "APPLIED", cleanup_status: "UNCERTAIN" },
      );
      assert.equal(
        resumed.durable.budgets.requests.used,
        sourceBudget.requests.used + (phase === "NOT_STARTED" ? 1 : 0),
      );
      assert.equal(
        resumed.durable.budgets.mutations.used,
        sourceBudget.mutations.used,
      );
      round22AssertBudgetAccounting(resumed.durable);

      const stableBudget = structuredClone(resumed.durable.budgets);
      const retried = await round22RunFromState(resumed.durable, {
        target: trace.resource,
        initialObservation: { status: "ABSENT" },
      });
      assertRecoveryFailureProjection(
        retried.result,
        "CLEANUP_VERIFICATION_FAILED",
      );
      assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 });
      assert.deepEqual(retried.durable.budgets, stableBudget);
    }
  }
});

await check("Round22 qualification-cleaned initial inspection is phase-aware", async () => {
  for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
    for (const resourceKind of ["row", "storage"]) {
      for (const observationKind of ["PRESENT", "AMBIGUOUS", "ABSENT", "WRONG_VERSION"]) {
        if (resourceKind === "row" && observationKind === "WRONG_VERSION") {
          continue;
        }
        const target = resourceKind === "storage"
          ? storageResource()
          : rowResource();
        const state = round22QualificationCleanedState(
          target,
          cleanupStatus,
        );
        validateRecoveryState(state);
        const initialObservation = resourceKind === "storage"
          ? observationKind === "PRESENT"
            ? { status: "PRESENT", observed_version: "version-1" }
            : observationKind === "WRONG_VERSION"
              ? { status: "PRESENT", observed_version: "version-2" }
              : observationKind === "ABSENT"
                ? { status: "ABSENT", observed_version: null }
                : { status: "AMBIGUOUS" }
          : { status: observationKind };
        const attempt = await round22RunFromState(state, {
          target,
          initialObservation,
        });
        const label = `${cleanupStatus}/${resourceKind}/${observationKind}`;
        if (observationKind === "PRESENT") {
          assert.equal(attempt.result.lifecycle_state, "READY", label);
          assert.equal(attempt.result.recovery.status, "COMPLETE", label);
          assert.deepEqual(attempt.calls, { inspect: 2, reconcile: 1 }, label);
          assert.deepEqual(
            attempt.result.effect_ledger
              .filter((entry) => entry.resource_key === target.resource_key)
              .map((entry) => [entry.status, entry.cleanup_status]),
            [["CLEANED", "VERIFIED"]],
            label,
          );
          round22AssertBudgetAccounting(attempt.result);
        } else if (observationKind === "ABSENT") {
          assert.equal(attempt.result.lifecycle_state, "READY", label);
          assert.deepEqual(attempt.calls, { inspect: 1, reconcile: 0 }, label);
          const entry = attempt.result.effect_ledger.find(
            (candidate) => candidate.resource_key === target.resource_key,
          );
          assert.deepEqual(
            [entry.status, entry.cleanup_status],
            ["CLEANED", "VERIFIED"],
            label,
          );
          round22AssertBudgetAccounting(attempt.result);
        } else if (observationKind === "AMBIGUOUS") {
          assertRecoveryFailureProjection(attempt.result, "OWNERSHIP_AMBIGUOUS");
          assert.deepEqual(attempt.calls, { inspect: 1, reconcile: 0 }, label);
          const entry = attempt.durable.effect_ledger.find(
            (candidate) => candidate.resource_key === target.resource_key,
          );
          assert.deepEqual(
            [entry.status, entry.cleanup_status],
            ["APPLIED", "UNCERTAIN"],
            label,
          );
          round22AssertBudgetAccounting(attempt.durable);
        } else {
          assertRecoveryFailureProjection(
            attempt.result,
            "STORAGE_VERSION_MISMATCH",
          );
          assert.deepEqual(attempt.calls, { inspect: 1, reconcile: 0 }, label);
          const entry = attempt.durable.effect_ledger.find(
            (candidate) => candidate.resource_key === target.resource_key,
          );
          assert.deepEqual(
            [entry.status, entry.cleanup_status],
            ["APPLIED", "VERSION_MISMATCH_PRESERVED"],
            label,
          );
          round22AssertBudgetAccounting(attempt.durable);
        }

        if (attempt.result.lifecycle_state === "READY") {
          assert.equal(
            validateTerminalState(attempt.result).terminal_kind,
            "RECOVERY_COMPLETE",
            label,
          );
        } else {
          const stableBudgets = structuredClone(attempt.durable.budgets);
          const retried = await round22RunFromState(attempt.durable, {
            target,
            initialObservation: resourceKind === "storage"
              ? { status: "ABSENT", observed_version: null }
              : { status: "ABSENT" },
          });
          assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 }, label);
          assert.deepEqual(
            retried.result.lifecycle_state,
            attempt.result.lifecycle_state,
            label,
          );
          assert.deepEqual(retried.durable.budgets, stableBudgets, label);
        }
      }
    }
  }
});

function round23QualificationResponseLossCleanedState(
  resource,
  cleanupStatus,
) {
  return recoveryState({
    resources: [resource],
    ledger: [
      {
        sequence: 1,
        resource_key: resource.resource_key,
        effect: "CREATE",
        status: "CLEANED",
        cleanup_status: cleanupStatus,
        creation_receipt_sha256: null,
      },
    ],
    qualificationCreateReservations: [resource.resource_key],
    qualificationDeletes: [resource.resource_key],
  });
}

function round23QualificationCreateSlot(state, resource) {
  return state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.category === "mutations" &&
      slot.operation === "QUALIFICATION_CREATE_NEW" &&
      slot.resource_key === resource.resource_key,
  );
}

function round23QualificationDeleteSlot(state, resource) {
  return state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.category === "mutations" &&
      slot.operation === "QUALIFICATION_DELETE_EXACT" &&
      slot.resource_key === resource.resource_key,
  );
}

function round23AssertAuthenticResponseLossPrefix(
  state,
  resource,
  cleanupStatus,
) {
  const creation = round23QualificationCreateSlot(state, resource);
  const deletion = round23QualificationDeleteSlot(state, resource);
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  assert.equal(creation.status, "RESERVED");
  assert.equal(creation.receipt, null);
  assert.equal(creation.receipt_sha256, null);
  assert.equal(entry.creation_operation_slot_sha256, creation.operation_slot_sha256);
  assert.equal(entry.creation_receipt_sha256, null);
  assert.equal(deletion.status, "RESULT_APPLIED");
  assert.equal(deletion.receipt.status, "DELETED_EXACT");
  assert.equal(deletion.receipt.resource_key, resource.resource_key);
  assert.equal(deletion.receipt.locator_sha256, resource.owner.locator_sha256);
  assert.deepEqual(
    [entry.status, entry.cleanup_status],
    ["CLEANED", cleanupStatus],
  );
  validateRecoveryState(state);
  round22AssertBudgetAccounting(state);
}

function round23PresentObservation(state, resource, observedVersion) {
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  return {
    status: "PRESENT",
    creation_operation_slot_sha256:
      entry.creation_operation_slot_sha256,
    ...(resource.resource_type === "STORAGE_OBJECT"
      ? { observed_version: observedVersion }
      : {}),
  };
}

async function round23InitialInspectionTrace({
  resource,
  cleanupStatus,
  initialObservation,
}) {
  const initial = round23QualificationResponseLossCleanedState(
    resource,
    cleanupStatus,
  );
  round23AssertAuthenticResponseLossPrefix(
    initial,
    resource,
    cleanupStatus,
  );
  const attempt = await round22RunFromState(initial, {
    target: resource,
    initialObservation,
  });
  return {
    checkpoints: [structuredClone(initial), ...attempt.checkpoints],
    resource,
    result: attempt.result,
  };
}

const round23PresentTraces = [];
for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
  for (const resource of [rowResource(), storageResource()]) {
    const initial = round23QualificationResponseLossCleanedState(
      resource,
      cleanupStatus,
    );
    round23PresentTraces.push({
      cleanupStatus,
      resource,
      trace: await round23InitialInspectionTrace({
        resource,
        cleanupStatus,
        initialObservation: round23PresentObservation(
          initial,
          resource,
          "version-1",
        ),
      }),
    });
  }
}

for (const { cleanupStatus, resource, trace } of round23PresentTraces) {
  for (const phase of ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"]) {
    await check(
      `Round23 response-loss ${cleanupStatus} ${resource.resource_type} PRESENT resumes ${phase}`,
      async () => {
        const source = round22LatestPhaseState(
          trace,
          phase,
          "NOT_STARTED",
          "NOT_STARTED",
        );
        round23AssertAuthenticResponseLossPrefix(
          source,
          resource,
          cleanupStatus,
        );
        const sourceBudgets = structuredClone(source.budgets);
        const sourceReceiptSha256 = round20RecoverySlot(
          source,
          "RECOVERY_INSPECT",
          resource.resource_key,
        ).receipt_sha256;
        const attempt = await round22RunFromState(source, {
          target: resource,
          initialObservation: round23PresentObservation(
            source,
            resource,
            "version-1",
          ),
        });
        const label = `${cleanupStatus}/${resource.resource_type}/${phase}`;
        assert.equal(attempt.result.lifecycle_state, "READY", label);
        assert.equal(attempt.result.recovery.status, "COMPLETE", label);
        assert.deepEqual(
          attempt.calls,
          {
            inspect: phase === "RECEIPT_KNOWN" ? 1 : 2,
            reconcile: 1,
          },
          label,
        );
        assert.equal(
          attempt.result.budgets.requests.used,
          sourceBudgets.requests.used + (phase === "NOT_STARTED" ? 2 : 1),
          label,
        );
        assert.equal(
          attempt.result.budgets.mutations.used,
          sourceBudgets.mutations.used + 1,
          label,
        );
        if (phase === "RECEIPT_KNOWN") {
          assert.equal(
            round20RecoverySlot(
              attempt.result,
              "RECOVERY_INSPECT",
              resource.resource_key,
            ).receipt_sha256,
            sourceReceiptSha256,
            label,
          );
        }
        const finalEntry = attempt.result.effect_ledger.find(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        assert.deepEqual(
          [finalEntry.status, finalEntry.cleanup_status],
          ["CLEANED", "VERIFIED"],
          label,
        );
        round22AssertBudgetAccounting(attempt.result);
        assert.equal(
          validateTerminalState(attempt.result).terminal_kind,
          "RECOVERY_COMPLETE",
          label,
        );

        const closedPrefix = round22LatestPhaseState(
          { checkpoints: attempt.checkpoints, resource },
          "RESULT_APPLIED",
          "RESULT_APPLIED",
          "RESULT_APPLIED",
        );
        const stableBudgets = structuredClone(closedPrefix.budgets);
        const retried = await round22RunFromState(closedPrefix, {
          target: resource,
          initialObservation: round23PresentObservation(
            closedPrefix,
            resource,
            "version-1",
          ),
        });
        assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 }, label);
        assert.deepEqual(retried.result.budgets, stableBudgets, label);
        assert.equal(retried.result.lifecycle_state, "READY", label);
      },
    );
  }
}

const round23AmbiguousTraces = [];
for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
  for (const resource of [rowResource(), storageResource()]) {
    round23AmbiguousTraces.push({
      cleanupStatus,
      resource,
      trace: await round23InitialInspectionTrace({
        resource,
        cleanupStatus,
        initialObservation: { status: "AMBIGUOUS" },
      }),
    });
  }
}

for (const { cleanupStatus, resource, trace } of round23AmbiguousTraces) {
  for (const phase of ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"]) {
    await check(
      `Round23 response-loss ${cleanupStatus} ${resource.resource_type} AMBIGUOUS resumes ${phase}`,
      async () => {
        const source = round22LatestPhaseState(
          trace,
          phase,
          "NOT_STARTED",
          "NOT_STARTED",
        );
        round23AssertAuthenticResponseLossPrefix(
          source,
          resource,
          cleanupStatus,
        );
        const sourceBudgets = structuredClone(source.budgets);
        const sourceReceiptSha256 = round20RecoverySlot(
          source,
          "RECOVERY_INSPECT",
          resource.resource_key,
        ).receipt_sha256;
        const attempt = await round22RunFromState(source, {
          target: resource,
          initialObservation: { status: "AMBIGUOUS" },
        });
        const label = `${cleanupStatus}/${resource.resource_type}/${phase}`;
        assertRecoveryFailureProjection(
          attempt.result,
          "OWNERSHIP_AMBIGUOUS",
        );
        assert.deepEqual(
          attempt.calls,
          {
            inspect: phase === "RECEIPT_KNOWN" ? 0 : 1,
            reconcile: 0,
          },
          label,
        );
        assert.equal(
          attempt.durable.budgets.requests.used,
          sourceBudgets.requests.used + (phase === "NOT_STARTED" ? 1 : 0),
          label,
        );
        assert.equal(
          attempt.durable.budgets.mutations.used,
          sourceBudgets.mutations.used,
          label,
        );
        if (phase === "RECEIPT_KNOWN") {
          assert.equal(
            round20RecoverySlot(
              attempt.durable,
              "RECOVERY_INSPECT",
              resource.resource_key,
            ).receipt_sha256,
            sourceReceiptSha256,
            label,
          );
        }
        const finalEntry = attempt.durable.effect_ledger.find(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        assert.deepEqual(
          [finalEntry.status, finalEntry.cleanup_status],
          ["UNCERTAIN", "UNCERTAIN"],
          label,
        );
        assert.equal(
          round20RecoverySlot(
            attempt.durable,
            "RECOVERY_DELETE_EXACT",
            resource.resource_key,
          ).status,
          "NOT_STARTED",
          label,
        );
        round22AssertBudgetAccounting(attempt.durable);

        const stableBudgets = structuredClone(attempt.durable.budgets);
        const retried = await round22RunFromState(attempt.durable, {
          target: resource,
          initialObservation: { status: "ABSENT" },
        });
        assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 }, label);
        assert.deepEqual(retried.durable.budgets, stableBudgets, label);
        assertRecoveryFailureProjection(
          retried.result,
          "OWNERSHIP_AMBIGUOUS",
        );
      },
    );
  }
}

for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
  const resource = storageResource();
  const initial = round23QualificationResponseLossCleanedState(
    resource,
    cleanupStatus,
  );
  const trace = await round23InitialInspectionTrace({
    resource,
    cleanupStatus,
    initialObservation: round23PresentObservation(
      initial,
      resource,
      "version-2",
    ),
  });
  for (const phase of ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"]) {
    await check(
      `Round23 response-loss ${cleanupStatus} Storage mismatch resumes ${phase}`,
      async () => {
        const source = round22LatestPhaseState(
          trace,
          phase,
          "NOT_STARTED",
          "NOT_STARTED",
        );
        const sourceBudgets = structuredClone(source.budgets);
        const attempt = await round22RunFromState(source, {
          target: resource,
          initialObservation: round23PresentObservation(
            source,
            resource,
            "version-2",
          ),
        });
        const label = `${cleanupStatus}/STORAGE_OBJECT/${phase}`;
        assertRecoveryFailureProjection(
          attempt.result,
          "STORAGE_VERSION_MISMATCH",
        );
        assert.deepEqual(
          attempt.calls,
          {
            inspect: phase === "RECEIPT_KNOWN" ? 0 : 1,
            reconcile: 0,
          },
          label,
        );
        const entry = attempt.durable.effect_ledger.find(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        assert.deepEqual(
          [entry.status, entry.cleanup_status],
          ["UNCERTAIN", "VERSION_MISMATCH_PRESERVED"],
          label,
        );
        assert.equal(
          attempt.durable.budgets.requests.used,
          sourceBudgets.requests.used + (phase === "NOT_STARTED" ? 1 : 0),
          label,
        );
        assert.equal(
          attempt.durable.budgets.mutations.used,
          sourceBudgets.mutations.used,
          label,
        );
        round22AssertBudgetAccounting(attempt.durable);

        const stableBudgets = structuredClone(attempt.durable.budgets);
        const retried = await round22RunFromState(attempt.durable, {
          target: resource,
          initialObservation: round23PresentObservation(
            attempt.durable,
            resource,
            "version-1",
          ),
        });
        assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 }, label);
        assert.deepEqual(retried.durable.budgets, stableBudgets, label);
        assertRecoveryFailureProjection(
          retried.result,
          "STORAGE_VERSION_MISMATCH",
        );
      },
    );
  }
}

async function round22CleanedStorageMismatchTrace(cleanupStatus) {
  const resource = storageResource();
  const initial = round22QualificationCleanedState(resource, cleanupStatus);
  const checkpoints = [structuredClone(initial)];
  const result = await runRecovery({
    loadAuthoritativeState: async () => structuredClone(initial),
    expectedCandidateIdentity: CANDIDATE,
    authorization: recoveryAuthorization(),
    checkpointRecoveryState: async (state) => {
      checkpoints.push(structuredClone(state));
    },
    inspectOwnedResource: async (candidate) => {
      assert.equal(candidate.resource_key, resource.resource_key);
      return { status: "PRESENT", observed_version: "version-2" };
    },
    reconcileOwnedResource: async () => {
      throw new Error("mismatched Storage must not be deleted");
    },
  });
  return { checkpoints, resource, result };
}

await check("Round22 cleaned Storage mismatch resumes N/R/K without CAS mutation", async () => {
  for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
    const trace = await round22CleanedStorageMismatchTrace(cleanupStatus);
    for (const phase of ["NOT_STARTED", "RESERVED", "RECEIPT_KNOWN"]) {
      const source = round22LatestPhaseState(
        trace,
        phase,
        "NOT_STARTED",
        "NOT_STARTED",
      );
      const sourceBudget = structuredClone(source.budgets);
      const attempt = await round22RunFromState(source, {
        target: trace.resource,
        initialObservation: {
          status: "PRESENT",
          observed_version: "version-2",
        },
      });
      assertRecoveryFailureProjection(
        attempt.result,
        "STORAGE_VERSION_MISMATCH",
      );
      assert.deepEqual(
        attempt.calls,
        {
          inspect: phase === "RECEIPT_KNOWN" ? 0 : 1,
          reconcile: 0,
        },
        `${cleanupStatus}/${phase}`,
      );
      const entry = attempt.durable.effect_ledger.find(
        (candidate) => candidate.resource_key === trace.resource.resource_key,
      );
      assert.deepEqual(
        [entry.status, entry.cleanup_status],
        ["APPLIED", "VERSION_MISMATCH_PRESERVED"],
      );
      assert.equal(
        attempt.durable.budgets.requests.used,
        sourceBudget.requests.used + (phase === "NOT_STARTED" ? 1 : 0),
      );
      assert.equal(
        attempt.durable.budgets.mutations.used,
        sourceBudget.mutations.used,
      );
      round22AssertBudgetAccounting(attempt.durable);

      const stableBudgets = structuredClone(attempt.durable.budgets);
      const retried = await round22RunFromState(attempt.durable, {
        target: trace.resource,
        initialObservation: {
          status: "PRESENT",
          observed_version: "version-1",
        },
      });
      assertRecoveryFailureProjection(
        retried.result,
        "STORAGE_VERSION_MISMATCH",
      );
      assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 });
      assert.deepEqual(retried.durable.budgets, stableBudgets);
    }
  }
});

function round22PreCreateNoEffectState() {
  const target = rowResource();
  const state = recoveryState({
    resources: [target],
    ledger: [
      {
        sequence: 1,
        resource_key: target.resource_key,
        effect: "CREATE",
        status: "INTENT_ONLY",
        cleanup_status: "PENDING",
      },
    ],
  });
  Object.assign(state.effect_ledger[0], {
    status: "CLEANED",
    cleanup_status: "NOT_REQUIRED",
    creation_receipt_sha256: null,
  });
  return {
    state: round20ResealCurrentCheckpoint(state),
    target,
  };
}

for (const status of ["PRESENT", "AMBIGUOUS"]) {
  await check(`Round22 pre-create CLEANED NOT_REQUIRED ${status} remains non-authorizing`, async () => {
    const fixture = round22PreCreateNoEffectState();
    validateRecoveryState(fixture.state);
    const creationOperationSlotSha256 =
      fixture.state.effect_ledger[0].creation_operation_slot_sha256;
    const attempt = await round22RunFromState(fixture.state, {
      target: fixture.target,
      initialObservation: {
        status,
        ...(status === "PRESENT"
          ? { creation_operation_slot_sha256: creationOperationSlotSha256 }
          : {}),
      },
    });
    assertRecoveryFailureProjection(
      attempt.result,
      status === "PRESENT"
        ? "INTENT_OWNERSHIP_UNPROVEN"
        : "OWNERSHIP_AMBIGUOUS",
    );
    assert.deepEqual(attempt.calls, { inspect: 1, reconcile: 0 }, status);
    assert.deepEqual(
      attempt.durable.effect_ledger.map(
        (entry) => [entry.status, entry.cleanup_status],
      ),
      [["CLEANED", "NOT_REQUIRED"]],
      status,
    );
    assert.equal(
      round20RecoverySlot(
        attempt.durable,
        "RECOVERY_DELETE_EXACT",
        fixture.target.resource_key,
      ).status,
      "NOT_STARTED",
      status,
    );
    round22AssertBudgetAccounting(attempt.durable);

    const stableBudgets = structuredClone(attempt.durable.budgets);
    const retried = await round22RunFromState(attempt.durable, {
      target: fixture.target,
      initialObservation: { status: "ABSENT" },
    });
    assertRecoveryFailureProjection(
      retried.result,
      status === "PRESENT"
        ? "INTENT_OWNERSHIP_UNPROVEN"
        : "OWNERSHIP_AMBIGUOUS",
    );
    assert.deepEqual(retried.calls, { inspect: 0, reconcile: 0 }, status);
    assert.deepEqual(retried.durable.budgets, stableBudgets, status);
  });
}

function round22QualificationMismatchState(inspectionStatus) {
  const target = storageResource();
  const state = recoveryState({
    resources: [target],
    ledger: [
      {
        sequence: 1,
        resource_key: target.resource_key,
        effect: "CREATE",
        status: "APPLIED",
        cleanup_status: "VERSION_MISMATCH_PRESERVED",
      },
    ],
    qualificationDeletes: [target.resource_key],
  });
  const qualificationDelete = state.recovery_operation_state
    .qualification_operation_slots.find(
      (slot) =>
        slot.operation === "QUALIFICATION_DELETE_EXACT" &&
        slot.resource_key === target.resource_key,
    );
  qualificationDelete.receipt.status = "VERSION_MISMATCH";
  qualificationDelete.receipt.observed_version = "version-2";
  qualificationDelete.receipt_sha256 = sha256Hex(
    canonicalJson(qualificationDelete.receipt),
  );
  const inspection = round20RecoverySlot(
    state,
    "RECOVERY_INSPECT",
    target.resource_key,
  );
  if (inspectionStatus !== "NOT_STARTED") {
    const authority = state.recovery_operation_state.operation_slots.find(
      (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
    );
    inspection.operation_binding_sha256 = deriveRecoveryOperationBindingSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      recovery_anchor_checkpoint_identity_sha256:
        state.recovery_operation_state.recovery_anchor
          .checkpoint_identity_sha256,
      operation_slot_sha256: inspection.operation_slot_sha256,
      prerequisite_receipt_sha256: authority.receipt_sha256,
    });
    inspection.status = inspectionStatus;
    state.budgets.requests.used += 1;
    if (["RECEIPT_KNOWN", "RESULT_APPLIED"].includes(inspectionStatus)) {
      inspection.receipt = {
        status: "PRESENT",
        observed_version: "version-2",
        creation_operation_slot_sha256:
          state.effect_ledger[0].creation_operation_slot_sha256,
        operation_slot_sha256: inspection.operation_slot_sha256,
        operation_binding_sha256: inspection.operation_binding_sha256,
      };
      inspection.receipt_sha256 = sha256Hex(
        canonicalJson(inspection.receipt),
      );
    }
  }
  return {
    state: round20ResealCurrentCheckpoint(state),
    target,
  };
}

await check("Round22 qualification-origin mismatch forbids recovery inspection progress", async () => {
  const untouched = round22QualificationMismatchState("NOT_STARTED");
  validateRecoveryState(untouched.state);
  const untouchedResult = await round22RunFromState(untouched.state, {
    target: untouched.target,
    initialObservation: {
      status: "PRESENT",
      observed_version: "version-1",
    },
  });
  assertRecoveryFailureProjection(
    untouchedResult.result,
    "STORAGE_VERSION_MISMATCH",
  );
  assert.deepEqual(untouchedResult.calls, { inspect: 0, reconcile: 0 });

  for (const phase of ["RESERVED", "RECEIPT_KNOWN", "RESULT_APPLIED"]) {
    const mutant = round22QualificationMismatchState(phase);
    const attempt = await round20PreAdapterAttempt(mutant.state);
    assert.deepEqual(
      attempt.calls,
      { head: 0, checkpoint: 0, inspect: 0, reconcile: 0 },
      phase,
    );
    assertRecoveryFailureProjection(attempt.result, "RECOVERY_STATE_INVALID");
  }

  const genuineRecoveryMismatch = round20ResealCurrentCheckpoint(
    round21StorageVersionMutant(
      "NOT_STARTED",
      "version-2",
      "VERSION_MISMATCH_PRESERVED",
    ),
  );
  validateRecoveryState(genuineRecoveryMismatch);
  const genuine = await round22RunFromState(genuineRecoveryMismatch, {
    target: round21StorageTrace.resource,
    initialObservation: {
      status: "PRESENT",
      observed_version: "version-1",
    },
  });
  assertRecoveryFailureProjection(genuine.result, "STORAGE_VERSION_MISMATCH");
  assert.deepEqual(genuine.calls, { inspect: 0, reconcile: 0 });
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
