import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";
import {
  AUTHORIZATION_CLASSES,
  KernelError,
  applyLifecycleTransition,
  assertEvidenceSafe,
  buildCompactEvidence,
  commitDurableCheckpoint,
  consumeBudget,
  createOperationReservation,
  createRecoveryFailureProjection,
  createRecoveryOperationState,
  createKernelState,
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
  validateRecoveryState,
  validateTerminalState,
} from "./kernel.mjs";
import { assertLegacyFreezePolicy } from "./legacy-classifier.mjs";
import {
  createFreshResourcePlanFailureReceipt,
  isFreshResourcePlanFailureReceipt,
} from "./fresh-resource-plan-diagnostics.mjs";

export const ACTIVATION_OPERATION_CLASS = "NONPRODUCTION_QUALIFICATION";
export const ACTIVATION_REVIEW_SHA256 =
  "84a37bd0d303ef9afc30613aa5c2c737af082dd813dc617313395b7ffecaede3";

const PHASE = "34JA-34JZ";
const FREEZE_DOCUMENT_SHA256 =
  "f11e73a2f7d3c554ea114b830b6f508f8a368f7825393690ac646cdc4fd77145";
const FREEZE_CANONICAL_SHA256 =
  "288f93fae6ede45eb5e78f1f8b621f9a82ece46ab7f1e7aa06d92f0992bcc9a4";
const RETAINED_IDENTITY_SHA256 =
  "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0";
const STORAGE_VERSION_BINDING = "BIND_ON_CREATE";
const LEGACY_CANDIDATE_SHA256 =
  "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71";
const CLEANUP_POLICIES = new Set([
  "DELETE_EXACT",
  "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
]);
const RESOURCE_TYPES = [
  "GIT_BRANCH",
  "PREVIEW_DEPLOYMENT",
  "ENVIRONMENT_RECORD",
  "DATABASE_ROW",
  "STORAGE_OBJECT",
];

export class ActivationBridgeError extends Error {
  constructor(code) {
    super(code);
    this.name = "ActivationBridgeError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function exactObject(value, expected) {
  return canonicalJson(value) === canonicalJson(expected);
}

function safeExactReceipt(value, expectedKeys) {
  try {
    assertEvidenceSafe(value);
    return exactKeys(value, expectedKeys);
  } catch {
    return false;
  }
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
  const create = state.recovery_operation_state.qualification_operation_slots.find(
    (slot) =>
      slot.operation === "QUALIFICATION_CREATE_NEW" &&
      slot.resource_key === resource.resource_key &&
      slot.status === "RESULT_APPLIED",
  );
  return exactCreateReceiptBinding(resource, create?.receipt)
    ? create.receipt.external_binding.expected_version
    : null;
}

function assertExactFreezeMetadata(freeze) {
  assertLegacyFreezePolicy(freeze);
  const retained = freeze.retained_state;
  const facts = retained?.categorical_facts;
  const expectedArtifacts = {
    tombstone: "d7c396ee7e61d597290b9aaf8b233f2098586a9e129c0f96d42f49995e48bec2",
    replacement_marker: "bb828109b0e8723a67e92fe3e7073700c50f498f0ecd7e774b26255b5bc2276e",
    active_authorization: "e1401cfe894d15594e3a76f4ac2dd21a2343d9e35719000bc91bc043ab910836",
    execution_lock: "9da7c52b3bf54b0222f27368d47c2badc4ba6bbfbe722cb4d57b6b197efa0f91",
    lineage_receipt: "9e608f762762023a1df1fed645699efc613e15dab82e49720ed25836e75f636f",
    runtime_authorization_lock:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    recovery_journal: "487022cb10ec48b2881861a1417d374a7fa189c37c32e01ec5e5453aba07fff8",
  };
  if (
    sha256Hex(canonicalJson(freeze)) !== FREEZE_CANONICAL_SHA256 ||
    retained?.recovery_root_basename !== "aifinder-34ia-delta20-mY2WVZ" ||
    !exactKeys(retained.artifacts, Object.keys(expectedArtifacts)) ||
    Object.entries(expectedArtifacts).some(
      ([name, digest]) => retained.artifacts[name]?.sha256 !== digest,
    ) ||
    !exactObject(facts, {
      authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
      candidate_identity_sha256: LEGACY_CANDIDATE_SHA256,
      recovery_state: "EXECUTION_IN_PROGRESS",
      recovery_stage: "PRIOR_RECONCILIATION",
      guard_owner_pid: 12605,
      mutation_intents: [{ kind: "PRIOR_RECONCILIATION", sequence: 1 }],
      data_writes: 0,
      branch_commits: 0,
      preview_identities: 0,
      environment_resources: 0,
      branch_cleanup_intents: 0,
      environment_cleanup_intents: 0,
      preview_cleanup_intents: 0,
      terminal_evidence_present: false,
      ownership_ambiguity: true,
      legacy_reconciliation_required: true,
    })
  ) {
    throw new ActivationBridgeError("LEGACY_FREEZE_METADATA_DRIFT");
  }
}

function assertExactLegacyClassification(classification) {
  if (
    !exactKeys(classification, [
      "schema_version",
      "classification",
      "authorization_state",
      "recovery_state",
      "recovery_stage",
      "guard",
      "candidate_binding",
      "effects",
      "ownership_ambiguity",
      "legacy_reconciliation_required",
      "clean",
      "qualified",
      "retained_identity_digest_sha256",
    ]) ||
    !exactKeys(classification.guard, [
      "owner_pid",
      "status",
      "recovery_root_binding_exact",
    ]) ||
    !exactKeys(classification.candidate_binding, [
      "active_candidate_identity_sha256",
      "recovery_candidate_identity_sha256",
      "exact",
    ]) ||
    !exactKeys(classification.effects, [
      "mutation_intents",
      "data_writes",
      "branch_commit_present",
      "preview_identity_present",
      "environment_resource_count",
      "environment_cleanup_intents",
      "branch_cleanup_intents",
      "preview_cleanup_intents",
      "terminal_evidence_present",
    ]) ||
    !exactKeys(classification.effects?.environment_cleanup_intents, [
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
    ]) ||
    classification.schema_version !== 1 ||
    classification?.classification !== "FAIL_CLOSED_UNRESOLVED" ||
    classification.authorization_state !== "QUALIFICATION_ATTEMPT_STARTED" ||
    classification.recovery_state !== "EXECUTION_IN_PROGRESS" ||
    classification.recovery_stage !== "PRIOR_RECONCILIATION" ||
    classification.guard?.owner_pid !== 12605 ||
    classification.guard?.status !== "DEAD" ||
    classification.guard?.recovery_root_binding_exact !== true ||
    classification.candidate_binding?.active_candidate_identity_sha256 !==
      LEGACY_CANDIDATE_SHA256 ||
    classification.candidate_binding?.recovery_candidate_identity_sha256 !==
      LEGACY_CANDIDATE_SHA256 ||
    classification.candidate_binding?.exact !== true ||
    !exactObject(classification.effects?.mutation_intents, [
      { kind: "PRIOR_RECONCILIATION", sequence: 1 },
    ]) ||
    classification.effects?.data_writes !== 0 ||
    classification.effects?.branch_commit_present !== false ||
    classification.effects?.preview_identity_present !== false ||
    classification.effects?.environment_resource_count !== 0 ||
    Object.values(classification.effects?.environment_cleanup_intents ?? {}).some(
      (value) => value !== 0,
    ) ||
    classification.effects?.branch_cleanup_intents !== 0 ||
    classification.effects?.preview_cleanup_intents !== 0 ||
    classification.effects?.terminal_evidence_present !== false ||
    classification.ownership_ambiguity !== true ||
    classification.legacy_reconciliation_required !== true ||
    classification.clean !== false ||
    classification.qualified !== false
  ) {
    throw new ActivationBridgeError("LEGACY_CLASSIFICATION_MISMATCH");
  }
  if (classification.retained_identity_digest_sha256 !== RETAINED_IDENTITY_SHA256) {
    throw new ActivationBridgeError("RETAINED_STATE_DRIFT");
  }
}

export function assertLegacyFreezeClosure({
  freeze_document_bytes,
  legacy_classification,
  approval_digest_sha256,
  policy,
}) {
  if (!(freeze_document_bytes instanceof Uint8Array)) {
    throw new ActivationBridgeError("LEGACY_FREEZE_DOCUMENT_BYTES");
  }
  const immutableBytes = Buffer.from(freeze_document_bytes);
  if (sha256Hex(immutableBytes) !== FREEZE_DOCUMENT_SHA256) {
    throw new ActivationBridgeError("LEGACY_FREEZE_DOCUMENT_DRIFT");
  }
  let freeze;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(immutableBytes);
    if (text.startsWith("\ufeff")) throw new Error("BOM");
    freeze = JSON.parse(text);
    if (!freeze || typeof freeze !== "object" || Array.isArray(freeze)) {
      throw new Error("ROOT");
    }
  } catch {
    throw new ActivationBridgeError("LEGACY_FREEZE_DOCUMENT_PARSE");
  }
  assertExactFreezeMetadata(freeze);
  assertExactLegacyClassification(legacy_classification);
  if (approval_digest_sha256 !== ACTIVATION_REVIEW_SHA256) {
    throw new ActivationBridgeError("FREEZE_APPROVAL_MISMATCH");
  }
  if (
    !exactObject(policy, {
      preserve_ambiguous_legacy_resources: true,
      fresh_ownership_namespace: true,
      claim_legacy_resources: false,
    })
  ) {
    throw new ActivationBridgeError("LEGACY_PRESERVATION_POLICY");
  }
  return {
    verified: true,
    classification: "FAIL_CLOSED_UNRESOLVED",
    retained_identity_digest_sha256: RETAINED_IDENTITY_SHA256,
    approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
    writes: 0,
    created_resources: 0,
    ambiguous_legacy_resources_preserved: true,
  };
}

function validRunId(value) {
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

function validLocator(resourceType, locator) {
  if (!locator || typeof locator !== "object" || Array.isArray(locator)) return false;
  try {
    assertEvidenceSafe(locator);
  } catch {
    return false;
  }
  const nonempty = (value) => typeof value === "string" && value.length > 0;
  if (resourceType === "DATABASE_ROW") {
    return exactKeys(locator, ["relation", "id"]) && nonempty(locator.relation) && nonempty(locator.id);
  }
  if (resourceType === "STORAGE_OBJECT") {
    return exactKeys(locator, ["bucket", "name"]) && nonempty(locator.bucket) && nonempty(locator.name);
  }
  if (resourceType === "PREVIEW_DEPLOYMENT") {
    return (
      exactKeys(locator, ["deployment_id", "project_id"]) &&
      nonempty(locator.deployment_id) &&
      nonempty(locator.project_id)
    );
  }
  if (resourceType === "GIT_BRANCH") {
    return (
      exactKeys(locator, ["repository", "branch", "expected_commit_sha256"]) &&
      nonempty(locator.repository) &&
      nonempty(locator.branch) &&
      isSha256(locator.expected_commit_sha256)
    );
  }
  return (
    resourceType === "ENVIRONMENT_RECORD" &&
    exactKeys(locator, ["project_id", "key", "target"]) &&
    nonempty(locator.project_id) &&
    nonempty(locator.key) &&
    nonempty(locator.target)
  );
}

export function createOwnedResource({
  candidate_identity_sha256,
  run_id,
  phase,
  operation_class,
  descriptor,
}) {
  const storage = descriptor?.resource_type === "STORAGE_OBJECT";
  if (
    !isSha256(candidate_identity_sha256) ||
    !validRunId(run_id) ||
    phase !== PHASE ||
    operation_class !== ACTIVATION_OPERATION_CLASS ||
    !descriptor ||
    !exactKeys(
      descriptor,
      storage
        ? ["resource_type", "locator", "cleanup_policy", "storage_cas"]
        : ["resource_type", "locator", "cleanup_policy"],
    ) ||
    !RESOURCE_TYPES.includes(descriptor.resource_type) ||
    !validLocator(descriptor.resource_type, descriptor.locator) ||
    !CLEANUP_POLICIES.has(descriptor.cleanup_policy) ||
    (descriptor.cleanup_policy === "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW" &&
      descriptor.resource_type !== "PREVIEW_DEPLOYMENT") ||
    (storage &&
      (!exactKeys(descriptor.storage_cas, [
        "expected_version",
        "delete_capability_sha256",
      ]) ||
        typeof descriptor.storage_cas.expected_version !== "string" ||
        descriptor.storage_cas.expected_version.length < 1 ||
        !isSha256(descriptor.storage_cas.delete_capability_sha256)))
  ) {
    throw new ActivationBridgeError("OWNERSHIP_UNPROVEN");
  }
  const locatorSha256 = sha256Hex(canonicalJson(descriptor.locator));
  const resource = {
    resource_key: `${run_id}:${descriptor.resource_type}:${locatorSha256}`,
    resource_type: descriptor.resource_type,
    owner: {
      candidate_identity_sha256,
      run_id,
      phase,
      operation_class,
      resource_type: descriptor.resource_type,
      locator_sha256: locatorSha256,
      cleanup_policy: descriptor.cleanup_policy,
    },
    locator: structuredClone(descriptor.locator),
  };
  if (storage) resource.storage_cas = structuredClone(descriptor.storage_cas);
  return resource;
}

function validateInput(input) {
  try {
    assertEvidenceSafe({
      run_id: input?.run_id,
      phase: input?.phase,
      operation_class: input?.operation_class,
      authorization: input?.authorization,
      budgets: input?.budgets,
      resource_plan: input?.resource_plan,
    });
  } catch {
    throw new ActivationBridgeError("EVIDENCE_INPUT_UNSAFE");
  }
  if (
    !isSha256(input?.candidate_identity_sha256) ||
    !validRunId(input.run_id) ||
    input.phase !== PHASE ||
    input.operation_class !== ACTIVATION_OPERATION_CLASS ||
    !exactKeys(input.authorization, [
      "schema_version",
      "authorization_class",
      "candidate_identity_sha256",
      "review_sha256",
    ]) ||
    input.authorization?.schema_version !== 1 ||
    input.authorization?.authorization_class !== AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION ||
    input.authorization?.candidate_identity_sha256 !== input.candidate_identity_sha256 ||
    input.authorization?.review_sha256 !== ACTIVATION_REVIEW_SHA256 ||
    typeof input.retain_preview_on_success !== "boolean" ||
    !Array.isArray(input.resource_plan) ||
    typeof input.checkpoint !== "function" ||
    typeof input.readCheckpointHead !== "function"
  ) {
    throw new ActivationBridgeError("QUALIFICATION_AUTHORITY_INVALID");
  }
  const previewDescriptors = input.resource_plan.filter(
    (descriptor) => descriptor?.resource_type === "PREVIEW_DEPLOYMENT",
  );
  const retainedDescriptors = input.resource_plan.filter(
    (descriptor) =>
      descriptor?.cleanup_policy ===
      "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  if (
    input.retain_preview_on_success !== true ||
    previewDescriptors.length !== 1 ||
    previewDescriptors[0]?.cleanup_policy !==
      "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW" ||
    retainedDescriptors.length !== 1 ||
    retainedDescriptors[0]?.resource_type !== "PREVIEW_DEPLOYMENT"
  ) {
    throw new ActivationBridgeError("RETAINED_PREVIEW_POLICY");
  }
  const budgets = input.budgets;
  const budgetShapeValid =
    exactKeys(budgets, ["requests", "mutations"]) &&
    [budgets.requests, budgets.mutations].every(
      (entry) =>
        exactKeys(entry, ["limit", "used"]) &&
        Number.isSafeInteger(entry.limit) &&
        Number.isSafeInteger(entry.used) &&
        entry.limit >= entry.used &&
        entry.used >= 0,
    );
  if (
    !budgetShapeValid ||
    budgets.requests.limit !== 16 ||
    budgets.requests.used !== 0 ||
    budgets.mutations.limit !== 15 ||
    budgets.mutations.used !== 0
  ) {
    const undersizedUnused =
      budgetShapeValid &&
      budgets.requests.used === 0 &&
      budgets.mutations.used === 0 &&
      (budgets.requests.limit < 16 || budgets.mutations.limit < 15);
    throw new ActivationBridgeError(
      undersizedUnused
        ? "BUDGET_EXHAUSTED"
        : "QUALIFICATION_BUDGET_MISMATCH",
    );
  }
  const resources = input.resource_plan.map((descriptor) =>
    createOwnedResource({
      candidate_identity_sha256: input.candidate_identity_sha256,
      run_id: input.run_id,
      phase: input.phase,
      operation_class: input.operation_class,
      descriptor,
    }),
  );
  if (
    resources.length !== RESOURCE_TYPES.length ||
    RESOURCE_TYPES.some(
      (type) => resources.filter((resource) => resource.resource_type === type).length !== 1,
    ) ||
    new Set(resources.map((resource) => resource.resource_key)).size !== resources.length
  ) {
    throw new ActivationBridgeError("OWNERSHIP_AMBIGUOUS");
  }
  const retained = resources.filter(
    (resource) => resource.owner.cleanup_policy === "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  if (
    retained.length !== (input.retain_preview_on_success ? 1 : 0) ||
    (retained[0] && retained[0].resource_type !== "PREVIEW_DEPLOYMENT")
  ) {
    throw new ActivationBridgeError("RETAINED_PREVIEW_POLICY");
  }
  const requiredFunctions = [
    input.adapters?.authority?.verifyAuthorityEnvelope,
    input.adapters?.namespace?.verifyFresh,
    input.adapters?.branch?.create,
    input.adapters?.branch?.cleanup,
    input.adapters?.preview?.create,
    input.adapters?.preview?.cleanup,
    input.adapters?.environment?.create,
    input.adapters?.environment?.cleanup,
    input.adapters?.fixture?.create,
    input.adapters?.fixture?.cleanup,
    input.adapters?.staging?.verifyReadOnly,
    input.adapters?.storage?.cleanupExactVersion,
    input.adapters?.finalCleanup?.verify,
  ];
  if (!requiredFunctions.every((entry) => typeof entry === "function")) {
    throw new ActivationBridgeError("ACTIVATION_ADAPTER_CONTRACT");
  }
  return resources;
}

function adapterFor(resource, adapters) {
  if (resource.resource_type === "GIT_BRANCH") return adapters.branch;
  if (resource.resource_type === "PREVIEW_DEPLOYMENT") return adapters.preview;
  if (resource.resource_type === "ENVIRONMENT_RECORD") return adapters.environment;
  return adapters.fixture;
}

function createProtocol(input, resources) {
  const resourcePlanSha256 = deriveResourcePlanSha256(resources);
  const authorityEnvelope = {
    schema_version: 1,
    candidate_identity_sha256: input.candidate_identity_sha256,
    run_id: input.run_id,
    phase: input.phase,
    operation_class: input.operation_class,
    review_approval_sha256: ACTIVATION_REVIEW_SHA256,
    freeze_document_sha256: FREEZE_DOCUMENT_SHA256,
    current_retained_state_attestation_sha256: sha256Hex(
      canonicalJson(input.freeze_closure.legacy_classification),
    ),
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 =
    deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation = createOperationReservation(
    authorityEnvelopeSha256,
  );
  const journalIdentitySha256 = deriveJournalIdentitySha256({
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan_sha256: resourcePlanSha256,
    ordered_resource_keys: resources.map((resource) => resource.resource_key),
    operation_reservation_identity_sha256: operationReservation.identity_sha256,
  });
  return {
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan: structuredClone(resources),
    resource_plan_sha256: resourcePlanSha256,
    operation_reservation: operationReservation,
    recovery_operation_state: createRecoveryOperationState(
      operationReservation,
      resources,
    ),
    journal_identity_sha256: journalIdentitySha256,
  };
}

function attachProtocol(state, protocol) {
  Object.assign(state, structuredClone(protocol));
  return state;
}

function operationSlot(state, category, index, operation, resourceKey = null) {
  return deriveOperationSlot({
    operation_reservation: state.operation_reservation,
    category,
    index,
    operation,
    resource_key: resourceKey,
  });
}

function exactSlotReceipt(result, slot) {
  return result?.operation_slot_sha256 === slot.operation_slot_sha256;
}

async function reserveOperation(
  input,
  state,
  category,
  index,
  operation,
  resourceKey = null,
  bestEffortCheckpoint = false,
  allowUnknownCheckpoint = false,
) {
  const slot = operationSlot(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  const usage =
    state.recovery_operation_state?.qualification_slot_usage?.[category];
  const operationRecord =
    state.recovery_operation_state?.qualification_operation_slots?.find(
      (candidate) =>
        candidate.category === category &&
        candidate.index === index &&
        candidate.operation === operation &&
        candidate.resource_key === resourceKey &&
        candidate.operation_slot_sha256 === slot.operation_slot_sha256,
    );
  if (
    !Array.isArray(usage) ||
    usage.includes(slot.operation_slot_sha256) ||
    operationRecord?.status !== "NOT_STARTED"
  ) {
    throw new ActivationBridgeError("OPERATION_RESERVATION_CHECKPOINT_FAILED");
  }
  const priorBudgets = structuredClone(state.budgets);
  const priorRecoveryOperationState = structuredClone(
    state.recovery_operation_state,
  );
  const nextBudgets = consumeBudget(state.budgets, category);
  const progressed = state.recovery_operation_state.qualification_operation_slots
    .filter((candidate) => candidate.status !== "NOT_STARTED")
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  const reservationOrdinal = progressed.length;
  const predecessorReservationProofSha256 = reservationOrdinal === 0
    ? deriveQualificationReservationRootSha256({
        journal_identity_sha256: state.journal_identity_sha256,
        operation_reservation_identity_sha256:
          state.operation_reservation.identity_sha256,
      })
    : progressed.at(-1).reservation_proof_sha256;
  usage.push(slot.operation_slot_sha256);
  operationRecord.reservation_ordinal = reservationOrdinal;
  operationRecord.predecessor_reservation_proof_sha256 =
    predecessorReservationProofSha256;
  operationRecord.reservation_proof_sha256 =
    deriveQualificationReservationProofSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      operation_reservation_identity_sha256:
        state.operation_reservation.identity_sha256,
      reservation_ordinal: reservationOrdinal,
      predecessor_reservation_proof_sha256:
        predecessorReservationProofSha256,
      operation_slot_sha256: operationRecord.operation_slot_sha256,
    });
  operationRecord.status = "RESERVED";
  state.budgets = nextBudgets;
  let checkpointVerified = false;
  let checkpointUnknown = false;
  try {
    await checkpoint(input, state);
    checkpointVerified = true;
  } catch (error) {
    if (
      error?.code === "CHECKPOINT_NOT_COMMITTED" &&
      !bestEffortCheckpoint
    ) {
      state.budgets = priorBudgets;
      state.recovery_operation_state = priorRecoveryOperationState;
      const notCommitted = new ActivationBridgeError(
        "OPERATION_RESERVATION_CHECKPOINT_FAILED",
      );
      notCommitted.checkpoint_disposition = "NOT_COMMITTED";
      throw notCommitted;
    }
    if (error?.code === "CHECKPOINT_STATE_UNKNOWN") {
      if (!allowUnknownCheckpoint) throw error;
      checkpointUnknown = true;
    }
  }
  if (!checkpointVerified && !bestEffortCheckpoint) {
    throw new ActivationBridgeError("OPERATION_RESERVATION_CHECKPOINT_FAILED");
  }
  return {
    slot,
    checkpointVerified,
    checkpointUnknown,
    reservation_proof_sha256: operationRecord.reservation_proof_sha256,
  };
}

function recordQualificationOperationReceipt(state, reservation, receipt) {
  const record =
    state.recovery_operation_state?.qualification_operation_slots?.find(
      (candidate) =>
        candidate.category === reservation.slot.category &&
        candidate.index === reservation.slot.index &&
        candidate.operation === reservation.slot.operation &&
        candidate.resource_key === reservation.slot.resource_key &&
        candidate.operation_slot_sha256 ===
          reservation.slot.operation_slot_sha256,
    );
  if (
    record?.status !== "RESERVED" ||
    !Number.isSafeInteger(record.reservation_ordinal) ||
    record.reservation_ordinal < 0 ||
    receipt?.reservation_proof_sha256 !== record.reservation_proof_sha256
  ) {
    throw new ActivationBridgeError("OPERATION_RECEIPT_MISMATCH");
  }
  assertEvidenceSafe(receipt);
  const durableReceipt = structuredClone(receipt);
  record.status = "RESULT_APPLIED";
  record.receipt = durableReceipt;
  record.receipt_sha256 = sha256Hex(canonicalJson(durableReceipt));
  return record;
}

function assertExactOwnership(resource, input) {
  if (
    resource.owner.candidate_identity_sha256 !== input.candidate_identity_sha256 ||
    resource.owner.run_id !== input.run_id ||
    resource.owner.phase !== input.phase ||
    resource.owner.operation_class !== input.operation_class ||
    resource.owner.resource_type !== resource.resource_type ||
    resource.owner.locator_sha256 !== sha256Hex(canonicalJson(resource.locator))
  ) {
    throw new ActivationBridgeError("OWNERSHIP_UNPROVEN");
  }
}

async function checkpoint(input, state, beginAttempt = false) {
  await commitDurableCheckpoint(state, input.checkpoint, {
    begin_attempt: beginAttempt,
    read_authoritative_head: input.readCheckpointHead,
    validate_candidate(candidate) {
      if (
        candidate.lifecycle_state === "QUALIFIED" ||
        candidate.lifecycle_state === "FAILED_CLOSED" ||
        (candidate.lifecycle_state === "READY" &&
          candidate.recovery?.status === "COMPLETE")
      ) {
        validateTerminalState(candidate);
      } else {
        validateRecoveryState(candidate);
      }
    },
  });
}

async function checkpointBestEffort(input, state) {
  return (await checkpointBestEffortDisposition(input, state)) === "COMMITTED";
}

async function checkpointBestEffortDisposition(input, state) {
  try {
    await checkpoint(input, state);
    return "COMMITTED";
  } catch (error) {
    if (error?.code === "CHECKPOINT_NOT_COMMITTED") return "NOT_COMMITTED";
    if (error?.code === "CHECKPOINT_STATE_UNKNOWN") return "UNKNOWN";
    return "REJECTED";
  }
}

function setLedgerStatus(state, resourceKey, status) {
  const entry = state.effect_ledger.find((candidate) => candidate.resource_key === resourceKey);
  if (!entry) throw new ActivationBridgeError("EFFECT_LEDGER_MISMATCH");
  entry.status = status;
}

async function cleanupResources(
  input,
  state,
  retainOnSuccess,
  verificationSlotIndex = 3,
) {
  const retentionCandidates = retainOnSuccess
    ? state.owned_resources.filter(
        (resource) =>
          resource.owner.cleanup_policy === "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
      )
    : [];
  const candidateKeys = new Set(
    retentionCandidates.map((resource) => resource.resource_key),
  );
  let failureCode = null;
  let checkpointStateUnknown = false;
  let failureCleanupSafe = false;
  const cleanupOne = async (resource) => {
    const entry = state.effect_ledger.find(
      (candidate) => candidate.resource_key === resource.resource_key,
    );
    if (
      entry.status === "CLEANED" &&
      ["APPLIED", "NOT_REQUIRED", "VERIFIED"].includes(entry.cleanup_status)
    ) {
      return null;
    }
    if (entry.status === "INTENT_ONLY") {
      entry.status = "CLEANED";
      entry.cleanup_status = "NOT_REQUIRED";
      const disposition = await checkpointBestEffortDisposition(input, state);
      failureCleanupSafe ||=
        retainOnSuccess && disposition === "NOT_COMMITTED";
      checkpointStateUnknown ||= disposition === "UNKNOWN";
      return disposition === "COMMITTED"
        ? null
        : disposition === "UNKNOWN"
          ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          : "CLEANUP_CHECKPOINT_FAILED";
    }
    let checkpointFailed = false;
    const priorCleanupStatus = entry.cleanup_status;
    try {
      assertExactOwnership(resource, input);
      entry.cleanup_status = "INTENT_ONLY";
      const planIndex = state.resource_plan.findIndex(
        (candidate) => candidate.resource_key === resource.resource_key,
      );
      const reserved = await reserveOperation(
        input,
        state,
        "mutations",
        5 + planIndex,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
        !retainOnSuccess,
        !retainOnSuccess,
      );
      checkpointStateUnknown ||= reserved.checkpointUnknown;
      checkpointFailed ||= !reserved.checkpointVerified;
      const context = {
        authority_envelope_sha256: state.authority_envelope_sha256,
        journal_identity_sha256: state.journal_identity_sha256,
        reservation_proof_sha256: reserved.reservation_proof_sha256,
        operation_slot: reserved.slot,
      };
      const expectedStorageVersion =
        resource.resource_type === "STORAGE_OBJECT"
          ? effectiveStorageExpectedVersion(state, resource)
          : null;
      const result =
        resource.resource_type === "STORAGE_OBJECT"
          ? await input.adapters.storage.cleanupExactVersion(
              structuredClone(resource),
              {
                expected_version: expectedStorageVersion,
                delete_capability_sha256:
                  resource.storage_cas.delete_capability_sha256,
              },
              context,
            )
          : await adapterFor(resource, input.adapters).cleanup(
              structuredClone(resource),
              context,
            );
      const commonReceiptKeys = [
        "status",
        "resource_key",
        "locator_sha256",
        "operation_slot_sha256",
        "reservation_proof_sha256",
      ];
      const storageVersionMismatch =
        resource.resource_type === "STORAGE_OBJECT" &&
        result?.status === "VERSION_MISMATCH";
      const expectedReceiptKeys = resource.resource_type === "STORAGE_OBJECT"
        ? [
            ...commonReceiptKeys,
            "expected_version",
            ...(storageVersionMismatch ? ["observed_version"] : []),
          ]
        : commonReceiptKeys;
      const exactReceipt =
        safeExactReceipt(result, expectedReceiptKeys) &&
        result.resource_key === resource.resource_key &&
        result.locator_sha256 === resource.owner.locator_sha256 &&
        exactSlotReceipt(result, reserved.slot) &&
        result.reservation_proof_sha256 ===
          reserved.reservation_proof_sha256 &&
        (resource.resource_type !== "STORAGE_OBJECT" ||
          (expectedStorageVersion !== null &&
            result.expected_version === expectedStorageVersion &&
            (!storageVersionMismatch ||
              (typeof result.observed_version === "string" &&
                result.observed_version.length > 0 &&
                result.observed_version !== result.expected_version))));
      if (!exactReceipt) {
        entry.cleanup_status = "UNCERTAIN";
        await checkpointBestEffort(input, state);
        return "OPERATION_RECEIPT_MISMATCH";
      }
      if (
        result?.status !== "DELETED_EXACT" &&
        !storageVersionMismatch
      ) {
        entry.cleanup_status = "UNCERTAIN";
        await checkpointBestEffort(input, state);
        return "CLEANUP_FAILED";
      }
      recordQualificationOperationReceipt(state, reserved, result);
      if (storageVersionMismatch) {
        entry.cleanup_status = "VERSION_MISMATCH_PRESERVED";
        await checkpointBestEffort(input, state);
        return "STORAGE_VERSION_MISMATCH";
      }
      if (
        result?.status !== "DELETED_EXACT" ||
        (resource.resource_type === "STORAGE_OBJECT" &&
          result.expected_version !== expectedStorageVersion)
      ) {
        entry.cleanup_status = "UNCERTAIN";
        await checkpointBestEffort(input, state);
        return "CLEANUP_FAILED";
      }
      entry.status = "CLEANED";
      entry.cleanup_status = "APPLIED";
      const resultCheckpointDisposition =
        await checkpointBestEffortDisposition(input, state);
      checkpointFailed ||= resultCheckpointDisposition !== "COMMITTED";
      failureCleanupSafe ||=
        retainOnSuccess &&
        resultCheckpointDisposition === "NOT_COMMITTED";
      checkpointStateUnknown ||=
        resultCheckpointDisposition === "UNKNOWN";
      return checkpointStateUnknown
        ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
        : checkpointFailed
          ? "CLEANUP_CHECKPOINT_FAILED"
          : null;
    } catch (error) {
      checkpointStateUnknown ||= error?.code === "CHECKPOINT_STATE_UNKNOWN";
      failureCleanupSafe ||=
        retainOnSuccess &&
        error?.checkpoint_disposition === "NOT_COMMITTED";
      entry.cleanup_status =
        error?.checkpoint_disposition === "NOT_COMMITTED"
          ? priorCleanupStatus
          : "UNCERTAIN";
      checkpointFailed ||= !(await checkpointBestEffort(input, state));
      return error?.code === "OPERATION_RESERVATION_CHECKPOINT_FAILED"
        ? "OPERATION_RESERVATION_CHECKPOINT_FAILED"
        : error?.code === "BUDGET_EXHAUSTED"
        ? "BUDGET_EXHAUSTED"
        : checkpointStateUnknown
          ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          : checkpointFailed
            ? "CLEANUP_CHECKPOINT_FAILED"
            : "CLEANUP_FAILED";
    }
  };

  for (const resource of [...state.owned_resources].reverse()) {
    if (candidateKeys.has(resource.resource_key)) continue;
    const cleanupFailure = await cleanupOne(resource);
    failureCode ??= cleanupFailure;
    if (
      retainOnSuccess &&
      [
        "OPERATION_RESERVATION_CHECKPOINT_FAILED",
        "CLEANUP_CHECKPOINT_FAILED",
        "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
      ].includes(cleanupFailure)
    ) {
      return {
        verified: false,
        retained: [],
        code: cleanupFailure,
        failure_cleanup_safe: failureCleanupSafe,
      };
    }
  }

  const verifyCleanup = async (retained, slotIndex) => {
    try {
      const reserved = await reserveOperation(
        input,
        state,
        "requests",
        slotIndex,
        "QUALIFICATION_VERIFY_CLEANUP",
        null,
        !retainOnSuccess,
        !retainOnSuccess,
      );
      checkpointStateUnknown ||= reserved.checkpointUnknown;
      const retainedKeys = new Set(
        retained.map((resource) => resource.resource_key),
      );
      const expectedAbsent = state.owned_resources
        .filter((resource) => !retainedKeys.has(resource.resource_key))
        .map((resource) => resource.resource_key);
      const expectedPresent = retained.map((resource) => ({
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
      }));
      const verification = await input.adapters.finalCleanup.verify({
        owned_resources: structuredClone(state.owned_resources),
        effect_ledger: structuredClone(state.effect_ledger),
        retained_resource_keys: [...retainedKeys],
        authority_envelope_sha256: state.authority_envelope_sha256,
        journal_identity_sha256: state.journal_identity_sha256,
        reservation_proof_sha256: reserved.reservation_proof_sha256,
        operation_slot: reserved.slot,
      });
      const exactVerification = (
        exactKeys(verification, [
          "status",
          "retained_preview_count",
          "verified_present_resources",
          "verified_absent_resource_keys",
          "operation_slot_sha256",
          "reservation_proof_sha256",
        ]) &&
        verification?.status === "VERIFIED" &&
        verification.retained_preview_count === retained.length &&
        exactSlotReceipt(verification, reserved.slot) &&
        verification.reservation_proof_sha256 ===
          reserved.reservation_proof_sha256 &&
        exactObject(verification.verified_present_resources, expectedPresent) &&
        exactObject(verification.verified_absent_resource_keys, expectedAbsent)
      );
      if (exactVerification) {
        recordQualificationOperationReceipt(state, reserved, verification);
      }
      return exactVerification;
    } catch (error) {
      checkpointStateUnknown ||= error?.code === "CHECKPOINT_STATE_UNKNOWN";
      if (error?.checkpoint_disposition === "NOT_COMMITTED") {
        failureCleanupSafe = true;
        failureCode ??= "OPERATION_RESERVATION_CHECKPOINT_FAILED";
      }
      return false;
    }
  };

  if (!(await verifyCleanup(retentionCandidates, verificationSlotIndex))) {
    failureCode ??= "CLEANUP_VERIFICATION_FAILED";
  }
  if (checkpointStateUnknown) {
    failureCode = "CLEANUP_CHECKPOINT_STATE_UNKNOWN";
  }

  if (!failureCode) {
    for (const entry of state.effect_ledger) {
      if (entry.cleanup_status === "APPLIED") entry.cleanup_status = "VERIFIED";
    }
    const resultCheckpointDisposition =
      await checkpointBestEffortDisposition(input, state);
    if (resultCheckpointDisposition === "COMMITTED") {
      return { verified: true, retained: retentionCandidates, code: null };
    }
    failureCleanupSafe ||=
      retainOnSuccess && resultCheckpointDisposition === "NOT_COMMITTED";
    checkpointStateUnknown ||=
      resultCheckpointDisposition === "UNKNOWN";
    failureCode = checkpointStateUnknown
      ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
      : "CLEANUP_CHECKPOINT_FAILED";
  }

  if (failureCode) {
    if (
      retainOnSuccess &&
      [
        "OPERATION_RESERVATION_CHECKPOINT_FAILED",
        "CLEANUP_CHECKPOINT_FAILED",
        "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
      ].includes(failureCode)
    ) {
      return {
        verified: false,
        retained: [],
        code: failureCode,
        failure_cleanup_safe: failureCleanupSafe,
      };
    }
    let retentionCleanupFailed = false;
    for (const resource of [...retentionCandidates].reverse()) {
      const cleanupFailure = await cleanupOne(resource);
      retentionCleanupFailed ||= cleanupFailure !== null;
      failureCode ??= cleanupFailure;
    }
    const absenceVerified = false;
    if (checkpointStateUnknown) {
      failureCode = "CLEANUP_CHECKPOINT_STATE_UNKNOWN";
    }
    let finalCheckpointVerified = true;
    if (absenceVerified) {
      for (const entry of state.effect_ledger) {
        if (entry.cleanup_status === "APPLIED") entry.cleanup_status = "VERIFIED";
      }
      finalCheckpointVerified = await checkpointBestEffort(input, state);
      if (!finalCheckpointVerified && failureCode === "CLEANUP_VERIFICATION_FAILED") {
        failureCode = "CLEANUP_CHECKPOINT_FAILED";
      }
    }
    const verified =
      failureCode === "CLEANUP_VERIFICATION_FAILED" &&
      !retentionCleanupFailed &&
      absenceVerified &&
      finalCheckpointVerified;
    return {
      verified,
      retained: [],
      code: failureCode,
      failure_cleanup_safe: false,
    };
  }
}

function evidencePayload(state) {
  return {
    authority_envelope: state.authority_envelope,
    authority_envelope_sha256: state.authority_envelope_sha256,
    candidate_identity_sha256: state.candidate_identity_sha256,
    run_id: state.run_id,
    phase: state.phase,
    operation_class: state.operation_class,
    operation_reservation: state.operation_reservation,
    recovery_operation_state: state.recovery_operation_state,
    review_approval_sha256: state.review_approval_sha256,
    lifecycle_state: state.lifecycle_state,
    authorization_class: state.authorization_class,
    budgets: state.budgets,
    owned_resources: state.owned_resources,
    effect_ledger: state.effect_ledger,
    freeze_document_sha256: state.freeze_document_sha256,
    cleanup: state.cleanup,
    recovery: state.recovery,
    retained_state_sha256: state.retained_state_sha256,
    resource_plan: state.resource_plan,
    resource_plan_sha256: state.resource_plan_sha256,
    outcome: state.outcome,
    immutable_audit_reference_sha256: [
      FREEZE_DOCUMENT_SHA256,
      RETAINED_IDENTITY_SHA256,
    ],
    journal_identity_sha256: state.journal_identity_sha256,
  };
}

async function finalEvidence(input, state, allowInjectedBuilder = true) {
  const payload = evidencePayload(state);
  const authoritative = buildCompactEvidence(payload);
  if (allowInjectedBuilder && typeof input.adapters?.evidence?.build === "function") {
    const evidence = await input.adapters.evidence.build(structuredClone(payload));
    validateCompactEvidence(evidence);
    if (canonicalJson(evidence) !== canonicalJson(authoritative)) {
      throw new ActivationBridgeError("EVIDENCE_DIVERGENCE");
    }
  }
  return authoritative;
}

const QUALIFICATION_FAILURE_PROJECTION_CODES = new Set([
  "ATTEMPT_ALREADY_EXISTS",
  "ATTEMPT_BEGIN_STATE_UNKNOWN",
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

function qualificationFailureProjection(state, code) {
  return {
    schema_version: 1,
    result_type: "QUALIFICATION_FAILURE_PROJECTION",
    candidate_identity_sha256: isSha256(state?.candidate_identity_sha256)
      ? state.candidate_identity_sha256
      : "0".repeat(64),
    authorization_class: AUTHORIZATION_CLASSES.NONE,
    lifecycle_state: "FAILED_RECOVERABLE",
    cleanup: { required: true, verified: false },
    recovery: { status: "PENDING", resume_to: "READY" },
    checkpoint_disposition: "UNKNOWN",
    outcome: {
      code: QUALIFICATION_FAILURE_PROJECTION_CODES.has(code)
        ? code
        : "QUALIFICATION_FAILED",
      successful: false,
    },
  };
}

function projectedQualificationFailure(state, evidence) {
  return {
    state: qualificationFailureProjection(state, state?.outcome?.code),
    retained_resources: [],
    evidence,
  };
}

async function unknownQualificationFailure(input, state, code) {
  const unresolved = {
    ...structuredClone(state),
    authorization_class: AUTHORIZATION_CLASSES.NONE,
    lifecycle_state: "FAILED_RECOVERABLE",
    cleanup: { required: true, verified: false },
    recovery: { status: "PENDING", resume_to: "READY" },
    outcome: { code, successful: false },
  };
  const evidence = await finalEvidence(input, unresolved, false);
  return projectedQualificationFailure(unresolved, evidence);
}

function bindLocalQualificationFailure(state, authorization) {
  if (![
    "FAILED_RECOVERABLE",
    "FAILED_CLOSED",
  ].includes(state.lifecycle_state)) return state;
  const last = state.transition_history.at(-1);
  if (last?.to === state.lifecycle_state) return state;
  if (
    last?.to !== "QUALIFYING" ||
    authorization?.authorization_class !==
      AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION ||
    authorization.candidate_identity_sha256 !==
      state.candidate_identity_sha256 ||
    authorization.review_sha256 !== state.review_approval_sha256
  ) {
    throw new ActivationBridgeError("RECOVERY_STATE_INVALID");
  }
  return {
    ...state,
    authorization_class: AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION,
    transition_history: [
      ...state.transition_history,
      {
        from: "QUALIFYING",
        to: state.lifecycle_state,
        authorization_class: AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION,
        review_sha256: state.review_approval_sha256,
      },
    ],
  };
}

async function finalizeFailureResult(input, failedState) {
  let failed = bindLocalQualificationFailure(
    failedState,
    input.authorization,
  );
  let evidence = await finalEvidence(input, failed, false);
  failed.final_evidence_identity_sha256 = evidence.evidence_identity_sha256;
  let failureCheckpointVerified = await checkpointBestEffort(input, failed);
  if (
    failed.lifecycle_state === "FAILED_CLOSED" &&
    !failureCheckpointVerified
  ) {
    failed.lifecycle_state = "FAILED_RECOVERABLE";
    if (failed.transition_history.at(-1)?.to === "FAILED_CLOSED") {
      failed.transition_history = failed.transition_history.slice(0, -1);
    }
    failed.cleanup = { ...failed.cleanup, verified: false };
    failed.recovery = { status: "PENDING", resume_to: "READY" };
    failed = bindLocalQualificationFailure(failed, input.authorization);
    evidence = await finalEvidence(input, failed, false);
    failed.final_evidence_identity_sha256 = evidence.evidence_identity_sha256;
    failureCheckpointVerified = await checkpointBestEffort(input, failed);
  }
  if (!failureCheckpointVerified) {
    return projectedQualificationFailure(failed, evidence);
  }
  return {
    state: failed,
    retained_resources: [],
    evidence,
  };
}

async function finalizeResult(input, terminalState, retainedResources) {
  const durableTerminal = structuredClone(terminalState);
  const retainedKeys = new Set(
    retainedResources.map((resource) => resource.resource_key),
  );
  for (const entry of durableTerminal.effect_ledger) {
    if (retainedKeys.has(entry.resource_key)) entry.cleanup_status = "RETAINED";
  }
  const interrupted = {
    ...structuredClone(terminalState),
    lifecycle_state: "QUALIFYING",
    authorization_class: AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION,
    transition_history:
      terminalState.transition_history.at(-1)?.from === "QUALIFYING" &&
      terminalState.transition_history.at(-1)?.to ===
        terminalState.lifecycle_state
        ? structuredClone(terminalState.transition_history.slice(0, -1))
        : structuredClone(terminalState.transition_history),
    cleanup: { required: terminalState.owned_resources.length > 0, verified: false },
    recovery: { status: "INTERRUPTED", resume_to: "READY" },
    outcome: { code: "TERMINAL_CHECKPOINT_PENDING", successful: false },
  };
  let evidence;
  try {
    evidence = await finalEvidence(input, durableTerminal);
  } catch {
    let compensation = null;
    if (retainedResources.length > 0) {
      compensation = await cleanupResources(input, interrupted, false, 4);
    }
    const failed = {
      ...interrupted,
      lifecycle_state:
        compensation?.verified === true ? "FAILED_CLOSED" : "FAILED_RECOVERABLE",
      cleanup: {
        required: interrupted.owned_resources.length > 0,
        verified: compensation?.verified === true,
      },
      recovery:
        compensation?.verified === true
          ? { status: "NOT_REQUIRED" }
          : { status: "PENDING", resume_to: "READY" },
      outcome: {
        code:
          compensation?.code === "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
            ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
            : "EVIDENCE_FINALIZATION_FAILED",
        successful: false,
      },
    };
    return finalizeFailureResult(input, failed);
  }
  try {
    await checkpoint(input, interrupted);
    durableTerminal.checkpoint = structuredClone(interrupted.checkpoint);
    durableTerminal.final_evidence_identity_sha256 =
      evidence.evidence_identity_sha256;
    await checkpoint(input, durableTerminal);
    return { state: durableTerminal, retained_resources: retainedResources, evidence };
  } catch (error) {
    if (error?.code === "CHECKPOINT_STATE_UNKNOWN") {
      const unresolvedCode =
        terminalState.outcome.code === "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          : "TERMINAL_CHECKPOINT_STATE_UNKNOWN";
      const unresolved = {
        ...interrupted,
        lifecycle_state: "FAILED_RECOVERABLE",
        cleanup: {
          required: interrupted.owned_resources.length > 0,
          verified: false,
        },
        recovery: { status: "PENDING", resume_to: "READY" },
        outcome: {
          code: unresolvedCode,
          successful: false,
        },
      };
      const unresolvedEvidence = await finalEvidence(input, unresolved, false);
      unresolved.final_evidence_identity_sha256 =
        unresolvedEvidence.evidence_identity_sha256;
      return projectedQualificationFailure(unresolved, unresolvedEvidence);
    }
    let compensation = null;
    if (retainedResources.length > 0) {
      compensation = await cleanupResources(input, interrupted, false, 4);
    }
    const compensationCode = !compensation || compensation.verified
      ? null
      : ["CLEANUP_FAILED", "OPERATION_RECEIPT_MISMATCH", "BUDGET_EXHAUSTED"].includes(
            compensation.code,
          )
        ? "TERMINAL_COMPENSATION_DELETE_FAILED"
        : compensation.code === "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          ? "CLEANUP_CHECKPOINT_STATE_UNKNOWN"
          : compensation.code === "CLEANUP_CHECKPOINT_FAILED"
            ? "TERMINAL_COMPENSATION_CHECKPOINT_FAILED"
            : "TERMINAL_COMPENSATION_VERIFICATION_FAILED";
    const failed = {
      ...interrupted,
      lifecycle_state:
        compensation?.verified === true ? "FAILED_CLOSED" : "FAILED_RECOVERABLE",
      cleanup: {
        required: interrupted.owned_resources.length > 0,
        verified: compensation?.verified === true,
      },
      recovery:
        compensation?.verified === true
          ? { status: "NOT_REQUIRED" }
          : { status: "PENDING", resume_to: "READY" },
      outcome: {
        code:
          compensationCode ??
          (terminalState.outcome.successful
            ? "TERMINAL_CHECKPOINT_FAILED"
            : terminalState.outcome.code),
        successful: false,
      },
    };
    return finalizeFailureResult(input, failed);
  }
}

function closeState(state, code, cleanup, authorization) {
  return bindLocalQualificationFailure(
    {
      ...state,
      lifecycle_state:
        cleanup?.verified === false ? "FAILED_RECOVERABLE" : "FAILED_CLOSED",
      cleanup: {
        required: state.owned_resources.length > 0,
        verified: cleanup?.verified ?? state.owned_resources.length === 0,
      },
      recovery:
        cleanup?.verified === false
          ? { status: "PENDING", resume_to: "READY" }
          : { status: "NOT_REQUIRED" },
      outcome: { code: cleanup?.code ?? code, successful: false },
    },
    authorization,
  );
}

function safeBudgets(input) {
  return {
    requests: { limit: 16, used: 0 },
    mutations: { limit: 15, used: 0 },
  };
}

function safeFailureState(input, code) {
  const safeInput = {
    candidate_identity_sha256: isSha256(input?.candidate_identity_sha256)
      ? input.candidate_identity_sha256
      : "0".repeat(64),
    run_id: validRunId(input?.run_id) ? input.run_id : "invalid-input-run-0000",
    phase: PHASE,
    operation_class: ACTIVATION_OPERATION_CLASS,
    freeze_closure: {
      legacy_classification: { status: "UNAVAILABLE" },
    },
  };
  const protocol = createProtocol(safeInput, []);
  const state = attachProtocol(
    createKernelState({
      candidate_identity_sha256: safeInput.candidate_identity_sha256,
      budgets: safeBudgets(input),
      run_id: safeInput.run_id,
      phase: PHASE,
      operation_class: ACTIVATION_OPERATION_CLASS,
      review_approval_sha256: ACTIVATION_REVIEW_SHA256,
      freeze_document_sha256: FREEZE_DOCUMENT_SHA256,
      retained_state_sha256: RETAINED_IDENTITY_SHA256,
    }),
    protocol,
  );
  return {
    ...state,
    lifecycle_state: "FAILED_CLOSED",
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code, successful: false },
  };
}

function unknownRecoveryState(input, code) {
  return createRecoveryFailureProjection(input, code);
}

async function preEffectFailure(input, code) {
  const state = safeFailureState(input, code);
  return {
    state,
    retained_resources: [],
    evidence: await finalEvidence(input ?? {}, state, false),
  };
}

function categoricalCode(error, fallback) {
  const allowed = new Set([
    "BUDGET_EXHAUSTED",
    "AUTHORITY_VERIFICATION_FAILED",
    "ATTEMPT_ALREADY_EXISTS",
    "ATTEMPT_BEGIN_FAILED",
    "EVIDENCE_INPUT_UNSAFE",
    "FREEZE_APPROVAL_MISMATCH",
    "LEGACY_CLASSIFICATION_MISMATCH",
    "LEGACY_FREEZE_DOCUMENT_BYTES",
    "LEGACY_FREEZE_DOCUMENT_DRIFT",
    "LEGACY_FREEZE_DOCUMENT_PARSE",
    "LEGACY_FREEZE_METADATA_DRIFT",
    "LEGACY_PRESERVATION_POLICY",
    "OPERATION_RECEIPT_MISMATCH",
    "OPERATION_RESERVATION_CHECKPOINT_FAILED",
    "OWNERSHIP_AMBIGUOUS",
    "OWNERSHIP_UNPROVEN",
    "QUALIFICATION_BUDGET_MISMATCH",
    "QUALIFICATION_AUTHORITY_INVALID",
    "RESOURCE_CREATE_FAILED",
    "RESOURCE_CREATE_UNCONFIRMED",
    "RETAINED_STATE_ATTESTATION_MISMATCH",
    "RETAINED_PREVIEW_POLICY",
    "RETAINED_STATE_DRIFT",
    "REVIEWED_CANDIDATE_MISMATCH",
    "RUN_NAMESPACE_INSPECTION_FAILED",
    "RUN_NAMESPACE_NOT_FRESH",
    "STAGING_VERIFICATION_FAILED",
  ]);
  return (
    (error instanceof ActivationBridgeError || error instanceof KernelError) &&
    allowed.has(error.code)
  )
    ? error.code
    : fallback;
}

export async function runQualification(input) {
  let state;
  let resources;
  try {
    assertLegacyFreezeClosure(input?.freeze_closure ?? {});
    resources = validateInput(input);
    state = createKernelState({
      candidate_identity_sha256: input.candidate_identity_sha256,
      budgets: input.budgets,
      run_id: input.run_id,
      phase: input.phase,
      operation_class: input.operation_class,
      review_approval_sha256: ACTIVATION_REVIEW_SHA256,
      freeze_document_sha256: FREEZE_DOCUMENT_SHA256,
      retained_state_sha256: RETAINED_IDENTITY_SHA256,
    });
    attachProtocol(state, createProtocol(input, resources));
  } catch (error) {
    return preEffectFailure(
      input,
      categoricalCode(error, "QUALIFICATION_AUTHORITY_INVALID"),
    );
  }
  const requiredRequests = 16;
  const requiredMutations = 15;
  if (
    state.budgets.requests.limit - state.budgets.requests.used < requiredRequests ||
    state.budgets.mutations.limit - state.budgets.mutations.used < requiredMutations
  ) {
    return preEffectFailure(input, "BUDGET_EXHAUSTED");
  }
  try {
    await checkpoint(input, state, true);
  } catch (error) {
    if (error?.code === "CHECKPOINT_STATE_UNKNOWN") {
      return unknownQualificationFailure(
        input,
        state,
        "ATTEMPT_BEGIN_STATE_UNKNOWN",
      );
    }
    if (error?.code === "ATTEMPT_ALREADY_EXISTS") {
      return unknownQualificationFailure(
        input,
        state,
        "ATTEMPT_ALREADY_EXISTS",
      );
    }
    return preEffectFailure(
      input,
      "ATTEMPT_BEGIN_FAILED",
    );
  }
  try {
    state = applyLifecycleTransition(
      state,
      "QUALIFYING",
      input.authorization,
    );
    if (state.lifecycle_state !== "QUALIFYING") {
      throw new ActivationBridgeError(state.outcome.code);
    }
    const authorityReservation = await reserveOperation(
      input,
      state,
      "requests",
      0,
      "VERIFY_AUTHORITY_ENVELOPE",
    );
    let reviewedAuthority;
    try {
      reviewedAuthority = await input.adapters.authority.verifyAuthorityEnvelope({
        authority_envelope: structuredClone(state.authority_envelope),
        authority_envelope_sha256: state.authority_envelope_sha256,
        resource_plan: structuredClone(state.resource_plan),
        reservation_proof_sha256:
          authorityReservation.reservation_proof_sha256,
        operation_slot: authorityReservation.slot,
      });
    } catch {
      throw new ActivationBridgeError("AUTHORITY_VERIFICATION_FAILED");
    }
    if (
      !exactKeys(reviewedAuthority, [
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
      reviewedAuthority.status !== "VERIFIED_AUTHORITY_ENVELOPE" ||
      reviewedAuthority.candidate_identity_sha256 !==
        input.candidate_identity_sha256 ||
      reviewedAuthority.run_id !== input.run_id ||
      reviewedAuthority.phase !== input.phase ||
      reviewedAuthority.operation_class !== input.operation_class ||
      reviewedAuthority.approval_digest_sha256 !== ACTIVATION_REVIEW_SHA256 ||
      reviewedAuthority.freeze_document_sha256 !== FREEZE_DOCUMENT_SHA256 ||
      reviewedAuthority.resource_plan_sha256 !== state.resource_plan_sha256 ||
      reviewedAuthority.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
      reviewedAuthority.reservation_proof_sha256 !==
        authorityReservation.reservation_proof_sha256 ||
      !exactSlotReceipt(reviewedAuthority, authorityReservation.slot)
    ) {
      throw new ActivationBridgeError("REVIEWED_CANDIDATE_MISMATCH");
    }
    if (
      reviewedAuthority.current_retained_state_attestation_sha256 !==
      state.authority_envelope.current_retained_state_attestation_sha256
    ) {
      throw new ActivationBridgeError("RETAINED_STATE_ATTESTATION_MISMATCH");
    }
    recordQualificationOperationReceipt(
      state,
      authorityReservation,
      reviewedAuthority,
    );
    const namespaceReservation = await reserveOperation(
      input,
      state,
      "requests",
      1,
      "VERIFY_FRESH_RESOURCE_PLAN",
    );
    const namespaceRequest = {
      authority_envelope_sha256: state.authority_envelope_sha256,
      resource_plan_sha256: state.resource_plan_sha256,
      resource_plan: structuredClone(state.resource_plan),
      reservation_proof_sha256:
        namespaceReservation.reservation_proof_sha256,
      operation_slot: namespaceReservation.slot,
    };
    let namespace;
    try {
      namespace = await input.adapters.namespace.verifyFresh(namespaceRequest);
    } catch {
      namespace = createFreshResourcePlanFailureReceipt(namespaceRequest, {
        failure_class: "MISSING_RECEIPT",
        receipt_created: false,
      });
    }
    const expectedProofs = state.resource_plan.map((resource) => ({
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      status: "ABSENT",
    }));
    const namespaceProofShape =
      safeExactReceipt(namespace, [
        "status",
        "authority_envelope_sha256",
        "resource_plan_sha256",
        "reservation_proof_sha256",
        "operation_slot_sha256",
        "proofs",
      ]) &&
      ["FRESH", "NOT_FRESH"].includes(namespace?.status) &&
      namespace.authority_envelope_sha256 === state.authority_envelope_sha256 &&
      namespace.resource_plan_sha256 === state.resource_plan_sha256 &&
      namespace.reservation_proof_sha256 ===
        namespaceReservation.reservation_proof_sha256 &&
      exactSlotReceipt(namespace, namespaceReservation.slot) &&
      Array.isArray(namespace.proofs) &&
      namespace.proofs.length === state.resource_plan.length &&
      namespace.proofs.every((proof, index) => {
        const resource = state.resource_plan[index];
        return exactKeys(proof, ["resource_key", "locator_sha256", "status"]) &&
          proof.resource_key === resource.resource_key &&
          proof.locator_sha256 === resource.owner.locator_sha256 &&
          ["ABSENT", "PRESENT"].includes(proof.status);
      });
    const namespaceProofs = namespaceProofShape &&
      ((namespace.status === "FRESH" &&
        namespace.proofs.every((proof) => proof.status === "ABSENT")) ||
        (namespace.status === "NOT_FRESH" &&
          namespace.proofs.some((proof) => proof.status === "PRESENT")));
    const failureReceipt = isFreshResourcePlanFailureReceipt(namespace, {
      authority_envelope_sha256: state.authority_envelope_sha256,
      resource_plan_sha256: state.resource_plan_sha256,
      reservation_proof_sha256:
        namespaceReservation.reservation_proof_sha256,
      operation_slot_sha256: namespaceReservation.slot.operation_slot_sha256,
    });
    if (!namespaceProofs && !failureReceipt) {
      namespace = createFreshResourcePlanFailureReceipt(namespaceRequest, {
        failure_class: "MALFORMED_RECEIPT",
        receipt_created: false,
        retryability: "NONRETRYABLE",
      });
    }
    recordQualificationOperationReceipt(state, namespaceReservation, namespace);
    if (namespace.status === "INSPECTION_FAILED") {
      throw new ActivationBridgeError("RUN_NAMESPACE_INSPECTION_FAILED");
    }
    if (
      namespace.status !== "FRESH" ||
      !exactObject(namespace.proofs, expectedProofs)
    ) {
      throw new ActivationBridgeError("RUN_NAMESPACE_NOT_FRESH");
    }
    for (const [index, resource] of resources.entries()) {
      const createSlot = operationSlot(
        state,
        "mutations",
        index,
        "QUALIFICATION_CREATE_NEW",
        resource.resource_key,
      );
      state.owned_resources.push(structuredClone(resource));
      state.effect_ledger.push({
        sequence: state.effect_ledger.length + 1,
        resource_key: resource.resource_key,
        effect: "CREATE",
        status: "INTENT_ONLY",
        cleanup_status: "PENDING",
        creation_operation_slot_sha256:
          createSlot.operation_slot_sha256,
        creation_receipt_sha256: null,
      });
      await checkpoint(input, state);
      const createReservation = await reserveOperation(
        input,
        state,
        "mutations",
        index,
        "QUALIFICATION_CREATE_NEW",
        resource.resource_key,
      );
      let result;
      try {
        result = await adapterFor(resource, input.adapters).create(
          structuredClone(resource),
          {
            authority_envelope_sha256: state.authority_envelope_sha256,
            resource_plan_sha256: state.resource_plan_sha256,
            journal_identity_sha256: state.journal_identity_sha256,
            reservation_proof_sha256:
              createReservation.reservation_proof_sha256,
            operation_slot: createReservation.slot,
          },
        );
      } catch {
        setLedgerStatus(state, resource.resource_key, "UNCERTAIN");
        await checkpointBestEffort(input, state);
        throw new ActivationBridgeError("RESOURCE_CREATE_FAILED");
      }
      let creationReceiptSha256;
      try {
        assertEvidenceSafe(result);
        if (
          !exactKeys(result, [
            "status",
            "resource_key",
            "locator_sha256",
            "authority_envelope_sha256",
            "reservation_proof_sha256",
            "operation_slot_sha256",
            ...(Object.hasOwn(result ?? {}, "external_binding")
              ? ["external_binding"]
              : []),
          ]) ||
          result.status !== "CREATED_NEW" ||
          result.resource_key !== resource.resource_key ||
          result.locator_sha256 !== resource.owner.locator_sha256 ||
          result.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
          result.reservation_proof_sha256 !==
            createReservation.reservation_proof_sha256 ||
          !exactSlotReceipt(result, createReservation.slot) ||
          !exactCreateReceiptBinding(resource, result)
        ) {
          throw new ActivationBridgeError("RESOURCE_CREATE_UNCONFIRMED");
        }
        creationReceiptSha256 = recordQualificationOperationReceipt(
          state,
          createReservation,
          result,
        ).receipt_sha256;
      } catch {
        setLedgerStatus(state, resource.resource_key, "UNCERTAIN");
        await checkpointBestEffort(input, state);
        throw new ActivationBridgeError("RESOURCE_CREATE_UNCONFIRMED");
      }
      state.effect_ledger.find(
        (entry) => entry.resource_key === resource.resource_key,
      ).creation_receipt_sha256 = creationReceiptSha256;
      setLedgerStatus(state, resource.resource_key, "APPLIED");
      await checkpoint(input, state);
    }
    const stagingReservation = await reserveOperation(
      input,
      state,
      "requests",
      2,
      "VERIFY_STAGING_READ_ONLY",
    );
    const staging = await input.adapters.staging.verifyReadOnly({
      candidate_identity_sha256: input.candidate_identity_sha256,
      run_id: input.run_id,
      authority_envelope_sha256: state.authority_envelope_sha256,
      reservation_proof_sha256:
        stagingReservation.reservation_proof_sha256,
      operation_slot: stagingReservation.slot,
    });
    if (
      !safeExactReceipt(staging, [
        "status",
        "writes",
        "reservation_proof_sha256",
        "operation_slot_sha256",
      ]) ||
      staging?.status !== "VERIFIED_READ_ONLY" ||
      staging.writes !== 0 ||
      staging.reservation_proof_sha256 !==
        stagingReservation.reservation_proof_sha256 ||
      !exactSlotReceipt(staging, stagingReservation.slot)
    ) {
      throw new ActivationBridgeError("STAGING_VERIFICATION_FAILED");
    }
    recordQualificationOperationReceipt(state, stagingReservation, staging);
    const cleanup = await cleanupResources(input, state, input.retain_preview_on_success);
    if (!cleanup.verified || cleanup.code) {
      let closureCleanup = cleanup;
      if (cleanup.failure_cleanup_safe === true) {
        const successVerifierApplied =
          state.recovery_operation_state.qualification_operation_slots.some(
            (slot) =>
              slot.category === "requests" &&
              slot.index === 3 &&
              slot.operation === "QUALIFICATION_VERIFY_CLEANUP" &&
              slot.status === "RESULT_APPLIED",
          );
        const failureCleanup = await cleanupResources(
          input,
          state,
          false,
          successVerifierApplied ? 4 : 3,
        );
        closureCleanup = {
          ...failureCleanup,
          code: failureCleanup.code ?? cleanup.code,
        };
      }
      state = closeState(
        state,
        cleanup.code,
        closureCleanup,
        input.authorization,
      );
      return finalizeResult(input, state, [], input.freeze_closure);
    }
    state.cleanup = { required: true, verified: true };
    state.recovery = { status: "NOT_REQUIRED" };
    state = applyLifecycleTransition(state, "QUALIFIED", input.authorization);
    state.outcome = { code: "QUALIFIED", successful: true };
    return finalizeResult(input, state, cleanup.retained, input.freeze_closure);
  } catch (error) {
    const code = categoricalCode(error, "QUALIFICATION_FAILED");
    let cleanup;
    if (state.owned_resources.length > 0) {
      cleanup = await cleanupResources(input, state, false);
    }
    state = closeState(state, code, cleanup, input.authorization);
    return finalizeResult(input, state, [], input.freeze_closure);
  }
}

export async function recoverQualification(input) {
  if (typeof input?.loadAuthoritativeState !== "function") {
    return unknownRecoveryState(
      {
        candidate_identity_sha256: input?.authorization?.candidate_identity_sha256,
      },
      "RECOVERY_ADAPTER",
    );
  }
  let state;
  try {
    const loaded = await input.loadAuthoritativeState();
    assertEvidenceSafe(loaded);
    state = structuredClone(loaded);
  } catch {
    return unknownRecoveryState(
      {
        candidate_identity_sha256: input?.authorization?.candidate_identity_sha256,
      },
      "RECOVERY_STATE_LOAD_FAILED",
    );
  }
  let terminalKind = null;
  try {
    if (
      state.lifecycle_state === "QUALIFIED" ||
      state.lifecycle_state === "FAILED_CLOSED" ||
      (state.lifecycle_state === "READY" && state.recovery?.status === "COMPLETE")
    ) {
      terminalKind = validateTerminalState(state).terminal_kind;
    } else {
      validateRecoveryState(state);
    }
  } catch (error) {
    const code = error?.code === "RECOVERY_STATE_INVALID"
      ? "RECOVERY_STATE_INVALID"
      : "RECOVERY_JOURNAL_IDENTITY_MISMATCH";
    return unknownRecoveryState(
      { candidate_identity_sha256: state?.candidate_identity_sha256 },
      code,
    );
  }
  try {
    assertEvidenceSafe(input.authorization);
  } catch {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_AUTHORITY_MISMATCH",
    );
  }
  if (
    typeof input.readCheckpointHead !== "function" ||
    !exactKeys(input.authorization, [
      "schema_version",
      "authorization_class",
      "candidate_identity_sha256",
      "review_sha256",
    ]) ||
    input.authorization.schema_version !== 1 ||
    input.authorization.authorization_class !==
      AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER ||
    input.authorization.candidate_identity_sha256 !==
      state.candidate_identity_sha256 ||
    input.authorization.review_sha256 !== ACTIVATION_REVIEW_SHA256 ||
    state.phase !== PHASE ||
    state.operation_class !== ACTIVATION_OPERATION_CLASS ||
    state.review_approval_sha256 !== ACTIVATION_REVIEW_SHA256 ||
    state.freeze_document_sha256 !== FREEZE_DOCUMENT_SHA256 ||
    state.retained_state_sha256 !== RETAINED_IDENTITY_SHA256
  ) {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_AUTHORITY_MISMATCH",
    );
  }
  if (
    terminalKind === null &&
    (typeof input?.authority?.verifyReviewedRecoveryAuthorization !== "function" ||
      typeof input.checkpointRecoveryState !== "function" ||
      typeof input.inspectOwnedResource !== "function" ||
      typeof input.reconcileOwnedResource !== "function")
  ) {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_ADAPTER",
    );
  }
  let authoritativeHead;
  try {
    authoritativeHead = await input.readCheckpointHead({
      schema_version: 1,
      journal_identity_sha256: state.journal_identity_sha256,
      expected_checkpoint_sequence: state.checkpoint.sequence,
      expected_predecessor_checkpoint_identity_sha256:
        state.checkpoint.predecessor_checkpoint_identity_sha256,
      expected_checkpoint_identity_sha256:
        state.checkpoint.checkpoint_identity_sha256,
    });
    assertEvidenceSafe(authoritativeHead);
    authoritativeHead = structuredClone(authoritativeHead);
  } catch {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_HEAD_UNKNOWN",
    );
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
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_JOURNAL_IDENTITY_MISMATCH",
    );
  }
  if (terminalKind === "QUALIFIED") {
    try {
      const evidence = await finalEvidence(input, state, false);
      if (
        evidence.evidence_identity_sha256 !==
        state.final_evidence_identity_sha256
      ) {
        throw new ActivationBridgeError("EVIDENCE_DIVERGENCE");
      }
      const retainedKeys = new Set(
        state.effect_ledger
          .filter((entry) => entry.cleanup_status === "RETAINED")
          .map((entry) => entry.resource_key),
      );
      return {
        state: structuredClone(state),
        retained_resources: state.owned_resources
          .filter((resource) => retainedKeys.has(resource.resource_key))
          .map((resource) => structuredClone(resource)),
        evidence,
      };
    } catch {
      return unknownRecoveryState(
        { candidate_identity_sha256: state.candidate_identity_sha256 },
        "RECOVERY_STATE_INVALID",
      );
    }
  }
  if (terminalKind === "FAILED_CLOSED") {
    try {
      const evidence = await finalEvidence(input, state, false);
      if (
        evidence.evidence_identity_sha256 !==
        state.final_evidence_identity_sha256
      ) {
        throw new ActivationBridgeError("EVIDENCE_DIVERGENCE");
      }
      return {
        state: structuredClone(state),
        retained_resources: [],
        evidence,
      };
    } catch {
      return unknownRecoveryState(
        { candidate_identity_sha256: state.candidate_identity_sha256 },
        "RECOVERY_STATE_INVALID",
      );
    }
  }
  if (terminalKind === "RECOVERY_COMPLETE") {
    return structuredClone(state);
  }
  const persistRecoveryState = () =>
    commitDurableCheckpoint(state, input.checkpointRecoveryState, {
      read_authoritative_head: input.readCheckpointHead,
      validate_candidate: validateRecoveryState,
    });
  const authoritySlot = operationSlot(
    state,
    "requests",
    5,
    "VERIFY_RECOVERY_AUTHORITY",
  );
  const authorityRecord = state.recovery_operation_state.operation_slots.find(
    (slot) =>
      slot.operation === "VERIFY_RECOVERY_AUTHORITY" &&
      slot.category === "requests" &&
      slot.index === 5 &&
      slot.resource_key === null,
  );
  let anchor = state.recovery_operation_state.recovery_anchor;
  let operationBindingSha256 = authorityRecord?.operation_binding_sha256;
  let reviewed;
  let freshAuthorityGrant = false;
  if (anchor === null && authorityRecord?.status === "NOT_STARTED") {
    anchor = {
      checkpoint_identity_sha256:
        state.checkpoint.checkpoint_identity_sha256,
      checkpoint_sequence: state.checkpoint.sequence,
      predecessor_checkpoint_identity_sha256:
        state.checkpoint.predecessor_checkpoint_identity_sha256,
    };
    operationBindingSha256 = deriveRecoveryOperationBindingSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      recovery_anchor_checkpoint_identity_sha256:
        anchor.checkpoint_identity_sha256,
      operation_slot_sha256: authoritySlot.operation_slot_sha256,
    });
    try {
      reviewed = await input.authority.verifyReviewedRecoveryAuthorization({
        authority_envelope_sha256: state.authority_envelope_sha256,
        resource_plan_sha256: state.resource_plan_sha256,
        journal_identity_sha256: state.journal_identity_sha256,
        operation_reservation_identity_sha256:
          state.operation_reservation.identity_sha256,
        recovery_anchor: structuredClone(anchor),
        operation_binding_sha256: operationBindingSha256,
        operation_slot: authoritySlot,
      });
      assertEvidenceSafe(reviewed);
      reviewed = structuredClone(reviewed);
      canonicalJson(reviewed);
      freshAuthorityGrant = true;
    } catch {
      reviewed = null;
    }
  } else if (anchor !== null && authorityRecord?.status === "RESULT_APPLIED") {
    reviewed = structuredClone(authorityRecord.receipt);
  } else {
    reviewed = null;
  }
  if (
    !exactKeys(reviewed, [
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
    reviewed.status !== "VERIFIED_REVIEWED_RECOVERY_AUTHORITY" ||
    reviewed.candidate_identity_sha256 !== state.candidate_identity_sha256 ||
    reviewed.run_id !== state.run_id ||
    reviewed.phase !== state.phase ||
    reviewed.operation_class !== state.operation_class ||
    reviewed.approval_digest_sha256 !== state.review_approval_sha256 ||
    reviewed.freeze_document_sha256 !== state.freeze_document_sha256 ||
    reviewed.retained_state_sha256 !== state.retained_state_sha256 ||
    reviewed.authority_envelope_sha256 !== state.authority_envelope_sha256 ||
    reviewed.resource_plan_sha256 !== state.resource_plan_sha256 ||
    reviewed.journal_identity_sha256 !== state.journal_identity_sha256 ||
    reviewed.operation_reservation_identity_sha256 !==
      state.operation_reservation.identity_sha256 ||
    reviewed.recovery_anchor_checkpoint_identity_sha256 !==
      anchor.checkpoint_identity_sha256 ||
    reviewed.recovery_anchor_checkpoint_sequence !==
      anchor.checkpoint_sequence ||
    reviewed.recovery_anchor_predecessor_identity_sha256 !==
      anchor.predecessor_checkpoint_identity_sha256 ||
    reviewed.operation_binding_sha256 !==
      operationBindingSha256 ||
    !exactSlotReceipt(reviewed, authoritySlot) ||
    input.authorization.candidate_identity_sha256 !== state.candidate_identity_sha256
  ) {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_AUTHORITY_MISMATCH",
    );
  }
  if (freshAuthorityGrant) {
    const priorState = structuredClone(state);
    try {
      state.budgets = consumeBudget(state.budgets, "requests");
      state.recovery_operation_state.recovery_anchor = structuredClone(anchor);
      authorityRecord.operation_binding_sha256 = operationBindingSha256;
      authorityRecord.status = "RESULT_APPLIED";
      authorityRecord.receipt = structuredClone(reviewed);
      authorityRecord.receipt_sha256 = sha256Hex(canonicalJson(reviewed));
      state = applyLifecycleTransition(
        state,
        "FAILED_RECOVERABLE",
        input.authorization,
      );
      if (state.lifecycle_state !== "FAILED_RECOVERABLE") {
        throw new ActivationBridgeError("RECOVERY_AUTHORITY_MISMATCH");
      }
      state.cleanup = {
        required: state.owned_resources.length > 0,
        verified: false,
      };
      state.recovery = { status: "PENDING", resume_to: "READY" };
      state.outcome = { code: "RECOVERY_AUTHORIZED", successful: false };
      state.recovery_operation_state.recovery_grant = {
        authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
        authority_receipt_sha256: authorityRecord.receipt_sha256,
        recovery_anchor_checkpoint_identity_sha256:
          anchor.checkpoint_identity_sha256,
        review_sha256: input.authorization.review_sha256,
      };
      await persistRecoveryState();
    } catch {
      state = priorState;
      return unknownRecoveryState(
        { candidate_identity_sha256: state.candidate_identity_sha256 },
        "RECOVERY_CHECKPOINT_FAILED",
      );
    }
  }
  let recoveryCapabilitySha256;
  try {
    recoveryCapabilitySha256 = deriveRecoveryCapabilitySha256(state);
  } catch {
    return unknownRecoveryState(
      { candidate_identity_sha256: state.candidate_identity_sha256 },
      "RECOVERY_CAPABILITY_REQUIRED",
    );
  }
  return reconcileRecovery({
    ...input,
    loadAuthoritativeState: async () => structuredClone(state),
    expectedCandidateIdentity: state.candidate_identity_sha256,
    recovery_capability_sha256: recoveryCapabilitySha256,
  });
}
