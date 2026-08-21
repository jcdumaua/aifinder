import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import {
  ACTIVATION_OPERATION_CLASS,
  ACTIVATION_REVIEW_SHA256,
  ActivationBridgeError,
  assertLegacyFreezeClosure,
  createOwnedResource,
  recoverQualification,
  runQualification,
} from "./activation-bridge.mjs";
import { canonicalJson, sha256Hex } from "./canonical.mjs";
import {
  buildCompactEvidence,
  createOperationReservation,
  createRecoveryOperationState,
  deriveAuthorityEnvelopeSha256,
  deriveCheckpointRootSha256,
  deriveJournalIdentitySha256,
  deriveOperationSlot,
  deriveQualificationReservationProofSha256,
  deriveQualificationReservationRootSha256,
  deriveRecoveryOperationBindingSha256,
  deriveResourcePlanSha256,
  reconcileRecovery,
  validateCompactEvidence,
  validateCheckpointProtocol,
  validateRecoveryState,
  validateTerminalState,
} from "./kernel.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FREEZE_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/legacy-freeze.json",
);
const FREEZE_BYTES = readFileSync(FREEZE_PATH);
const FREEZE = JSON.parse(FREEZE_BYTES);
const CANDIDATE = "a".repeat(64);
const LEGACY_CANDIDATE =
  "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71";
const RUN_ID = "qualification-run-0001";
const EXACT_CURRENT_RETAINED_STATE_ATTESTATION_SHA256 =
  "7e527d6eded9b332c95d9da6e69003fba8184c47200002463f2d4955f169029e";
const failures = [];
let assertions = 0;

const EVIDENCE_SCHEMA = JSON.parse(
  readFileSync(
    path.join(ROOT, "scripts/launch-operations-kernel/evidence.schema.json"),
    "utf8",
  ),
);
const DRAFT7_EVIDENCE_SCHEMA = JSON.parse(
  JSON.stringify(EVIDENCE_SCHEMA).replaceAll("#/$defs/", "#/definitions/"),
);
delete DRAFT7_EVIDENCE_SCHEMA.$schema;
DRAFT7_EVIDENCE_SCHEMA.definitions = DRAFT7_EVIDENCE_SCHEMA.$defs;
delete DRAFT7_EVIDENCE_SCHEMA.$defs;
const validateStructuralEvidenceSchema = new Ajv({
  allErrors: true,
  schemaId: "auto",
}).compile(DRAFT7_EVIDENCE_SCHEMA);

function structuralEvidenceSchemaAccepts(evidence) {
  if (!validateStructuralEvidenceSchema(structuredClone(evidence))) return false;
  const lifecycleContract = EVIDENCE_SCHEMA.allOf.find(
    (contract) =>
      contract.if?.properties?.lifecycle_state?.const ===
        evidence.lifecycle_state,
  );
  const ledgerSchema =
    lifecycleContract?.then?.properties?.effect_ledger;
  if (!ledgerSchema?.contains) return true;
  const resolve = (schema) => {
    if (typeof schema?.$ref !== "string") return schema;
    const segments = schema.$ref.slice(2).split("/");
    return segments.reduce((value, segment) => value?.[segment], EVIDENCE_SCHEMA);
  };
  const contains = resolve(ledgerSchema.contains);
  const matching = evidence.effect_ledger.filter((entry) =>
    (contains.required ?? []).every((key) => Object.hasOwn(entry, key)) &&
    Object.entries(contains.properties ?? {}).every(
      ([key, contract]) =>
        !Object.hasOwn(contract, "const") || entry[key] === contract.const,
    ),
  ).length;
  return (
    matching >= (ledgerSchema.minContains ?? 1) &&
    matching <= (ledgerSchema.maxContains ?? Number.POSITIVE_INFINITY)
  );
}

function runtimeEvidenceAccepts(evidence) {
  try {
    validateCompactEvidence(structuredClone(evidence));
    return true;
  } catch {
    return false;
  }
}

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.message ?? error?.code ?? "UNKNOWN"}`);
  }
}

function legacyClassification(overrides = {}) {
  return {
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
    retained_identity_digest_sha256:
      "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0",
    ...overrides,
  };
}

function freezeClosure(overrides = {}) {
  return {
    freeze_document_bytes: Buffer.from(FREEZE_BYTES),
    legacy_classification: legacyClassification(),
    approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
    policy: {
      preserve_ambiguous_legacy_resources: true,
      fresh_ownership_namespace: true,
      claim_legacy_resources: false,
    },
    ...overrides,
  };
}

function authorization(candidate = CANDIDATE) {
  return {
    schema_version: 1,
    authorization_class: "LOCAL_QUALIFICATION",
    candidate_identity_sha256: candidate,
    review_sha256: ACTIVATION_REVIEW_SHA256,
  };
}

function resourcePlan() {
  return [
    {
      resource_type: "GIT_BRANCH",
      locator: {
        repository: "aifinder",
        branch: "qualification-run-0001",
        expected_commit_sha256: "b".repeat(64),
      },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "PREVIEW_DEPLOYMENT",
      locator: { project_id: "project-1", deployment_id: "preview-1" },
      cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
    },
    {
      resource_type: "ENVIRONMENT_RECORD",
      locator: { project_id: "project-1", key: "ACCESS", target: "preview-1" },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "DATABASE_ROW",
      locator: { relation: "discovered_tools", id: "synthetic-1" },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "STORAGE_OBJECT",
      locator: { bucket: "tool-logos", name: "synthetic-1.png" },
      cleanup_policy: "DELETE_EXACT",
      storage_cas: {
        expected_version: "version-1",
        delete_capability_sha256: "c".repeat(64),
      },
    },
  ];
}

const REORDERED_PREVIEW_PLAN_CASES = [
  {
    preview_index: 0,
    plan_order: [
      "PREVIEW_DEPLOYMENT",
      "GIT_BRANCH",
      "ENVIRONMENT_RECORD",
      "DATABASE_ROW",
      "STORAGE_OBJECT",
    ],
    success_delete_indices: [4, 3, 2, 1],
    cleanup_by_completed_success_count: [
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
    ],
  },
  {
    preview_index: 1,
    plan_order: [
      "GIT_BRANCH",
      "PREVIEW_DEPLOYMENT",
      "ENVIRONMENT_RECORD",
      "DATABASE_ROW",
      "STORAGE_OBJECT",
    ],
    success_delete_indices: [4, 3, 2, 0],
    cleanup_by_completed_success_count: [
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
    ],
  },
  {
    preview_index: 2,
    plan_order: [
      "GIT_BRANCH",
      "ENVIRONMENT_RECORD",
      "PREVIEW_DEPLOYMENT",
      "DATABASE_ROW",
      "STORAGE_OBJECT",
    ],
    success_delete_indices: [4, 3, 1, 0],
    cleanup_by_completed_success_count: [
      ["STORAGE_OBJECT", "DATABASE_ROW", "PREVIEW_DEPLOYMENT", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "PREVIEW_DEPLOYMENT", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "PREVIEW_DEPLOYMENT", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
    ],
  },
  {
    preview_index: 3,
    plan_order: [
      "GIT_BRANCH",
      "ENVIRONMENT_RECORD",
      "DATABASE_ROW",
      "PREVIEW_DEPLOYMENT",
      "STORAGE_OBJECT",
    ],
    success_delete_indices: [4, 2, 1, 0],
    cleanup_by_completed_success_count: [
      ["STORAGE_OBJECT", "PREVIEW_DEPLOYMENT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "PREVIEW_DEPLOYMENT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "PREVIEW_DEPLOYMENT", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
    ],
  },
  {
    preview_index: 4,
    plan_order: [
      "GIT_BRANCH",
      "ENVIRONMENT_RECORD",
      "DATABASE_ROW",
      "STORAGE_OBJECT",
      "PREVIEW_DEPLOYMENT",
    ],
    success_delete_indices: [3, 2, 1, 0],
    cleanup_by_completed_success_count: [
      ["PREVIEW_DEPLOYMENT", "STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "PREVIEW_DEPLOYMENT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "PREVIEW_DEPLOYMENT", "ENVIRONMENT_RECORD", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"],
      ["STORAGE_OBJECT", "DATABASE_ROW", "ENVIRONMENT_RECORD", "GIT_BRANCH", "PREVIEW_DEPLOYMENT"],
    ],
  },
];

function resourcePlanInTypeOrder(typeOrder) {
  const byType = new Map(
    resourcePlan().map((descriptor) => [descriptor.resource_type, descriptor]),
  );
  return typeOrder.map((resourceType) =>
    structuredClone(byType.get(resourceType)),
  );
}

function cleanupEventTypes(fake) {
  return fake.events
    .filter((event) => event.startsWith("cleanup:") && event !== "cleanup:verify")
    .map((event) => event.split(":", 2)[1]);
}

function qualificationReceiptContext(context) {
  return context?.reservation_proof_sha256
    ? {
        reservation_proof_sha256: context.reservation_proof_sha256,
      }
    : {};
}

function adapters({
  failCreateType,
  failCleanupType,
  deleteThenThrowType,
  storageCleanupStatus = "DELETED_EXACT",
  storageDisappearsAfterMismatch = false,
  finalCleanupMode = "VERIFIED",
} = {}) {
  const events = [];
  const present = new Set();
  const checkpoints = [];
  const checkpointHeads = new Map();
  const checkpointStates = new Map();
  let finalCleanupAttempts = 0;
  const create = async (resource, context) => {
    events.push(`create:${resource.resource_type}:${resource.resource_key}`);
    if (resource.resource_type === failCreateType) throw new Error("synthetic failure");
    present.add(resource.resource_key);
    return {
      status: context ? "CREATED_NEW" : "APPLIED",
      resource_key: resource.resource_key,
      ...(context
        ? {
            locator_sha256: resource.owner.locator_sha256,
            authority_envelope_sha256: context.authority_envelope_sha256,
            operation_slot_sha256: context.operation_slot.operation_slot_sha256,
            ...qualificationReceiptContext(context),
          }
        : {}),
    };
  };
  const cleanup = async (resource, context) => {
    events.push(`cleanup:${resource.resource_type}:${resource.resource_key}`);
    if (resource.resource_type === failCleanupType) {
      throw new Error("synthetic cleanup crash");
    }
    present.delete(resource.resource_key);
    if (resource.resource_type === deleteThenThrowType) {
      throw new Error("synthetic cleanup response loss after delete");
    }
    return {
      status: "DELETED_EXACT",
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      ...(context
        ? {
            operation_slot_sha256: context.operation_slot.operation_slot_sha256,
            ...qualificationReceiptContext(context),
          }
        : {}),
    };
  };
  return {
    events,
    present,
    contract: {
      authority: {
        async verifyAuthorityEnvelope(request) {
          events.push("authority:envelope");
          return futureAuthorityResponse(request);
        },
        async verifyCurrentCandidate() {
          events.push("authority:current-candidate");
          return {
            status: "VERIFIED_CURRENT_CANDIDATE",
            candidate_identity_sha256: CANDIDATE,
          };
        },
        async verifyReviewedAuthorization() {
          events.push("authority:reviewed-authorization");
          return {
            status: "VERIFIED_REVIEWED_AUTHORITY",
            candidate_identity_sha256: CANDIDATE,
            phase: "34JA-34JZ",
            operation_class: ACTIVATION_OPERATION_CLASS,
            approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
          };
        },
      },
      namespace: {
        async verifyFresh(request) {
          events.push(`fresh:${request?.authority_envelope_sha256 ?? request?.run_id}`);
          return request?.resource_plan
            ? futureNamespaceResponse(request)
            : { status: "FRESH", run_id: request?.run_id };
        },
      },
      branch: { create, cleanup },
      preview: { create, cleanup },
      environment: { create, cleanup },
      fixture: { create, cleanup },
      staging: {
        async verifyReadOnly(request) {
          events.push("staging:verify");
          return {
            status: "VERIFIED_READ_ONLY",
            writes: 0,
            ...(request?.operation_slot
              ? {
                  operation_slot_sha256:
                    request.operation_slot.operation_slot_sha256,
                  ...qualificationReceiptContext(request),
                }
              : {}),
          };
        },
      },
      storage: {
        async cleanupExactVersion(resource, contract, context) {
          events.push(`cleanup:${resource.resource_type}:${resource.resource_key}`);
          if (storageCleanupStatus === "VERSION_MISMATCH") {
            if (storageDisappearsAfterMismatch) {
              present.delete(resource.resource_key);
            }
            return {
              status: "VERSION_MISMATCH",
              resource_key: resource.resource_key,
              locator_sha256: resource.owner.locator_sha256,
              expected_version: contract.expected_version,
              observed_version: "version-2",
              ...(context
                ? {
                    operation_slot_sha256:
                      context.operation_slot.operation_slot_sha256,
                    ...qualificationReceiptContext(context),
                  }
                : {}),
            };
          }
          present.delete(resource.resource_key);
          return {
            status: "DELETED_EXACT",
            expected_version: contract.expected_version,
            resource_key: resource.resource_key,
            locator_sha256: resource.owner.locator_sha256,
            ...(context
              ? {
                  operation_slot_sha256:
                    context.operation_slot.operation_slot_sha256,
                  ...qualificationReceiptContext(context),
                }
              : {}),
          };
        },
      },
      finalCleanup: {
        async verify(request) {
          const { retained_resource_keys } = request;
          events.push("cleanup:verify");
          finalCleanupAttempts += 1;
          if (finalCleanupAttempts === 1 && finalCleanupMode === "REJECT_FIRST") {
            return { status: "REJECTED", retained_preview_count: 1 };
          }
          if (finalCleanupAttempts === 1 && finalCleanupMode === "THROW_FIRST") {
            throw new Error("synthetic verifier exception");
          }
          return {
            status: "VERIFIED",
            retained_preview_count: retained_resource_keys.length,
            verified_present_resources: request.owned_resources
              .filter(
                (resource) =>
                  retained_resource_keys.includes(resource.resource_key) &&
                  present.has(resource.resource_key),
              )
              .map((resource) => ({
                resource_key: resource.resource_key,
                locator_sha256: resource.owner.locator_sha256,
              })),
            verified_absent_resource_keys: request.owned_resources
              .filter((resource) => !present.has(resource.resource_key))
              .map((resource) => resource.resource_key),
            ...(request.operation_slot
              ? {
                  operation_slot_sha256:
                    request.operation_slot.operation_slot_sha256,
                  ...qualificationReceiptContext(request),
                }
              : {}),
          };
        },
      },
    },
    checkpoints,
    checkpointHeads,
    checkpointStates,
    async commitCheckpoint(state, command) {
      checkpoints.push(structuredClone(state));
      const latest = state.effect_ledger.at(-1);
      events.push(
        latest ? `checkpoint:${latest.resource_key}:${latest.status}` : "checkpoint:state",
      );
      for (const entry of state.effect_ledger) {
        events.push(
          `ledger:${entry.resource_key}:create=${entry.status}:cleanup=${entry.cleanup_status ?? "MISSING"}`,
        );
      }
      if (!command) return;
      const current = checkpointHeads.get(command.journal_identity_sha256);
      if (command.operation === "BEGIN_ATTEMPT") {
        if (current) {
          throw Object.assign(new Error("attempt already exists"), {
            code: "ATTEMPT_ALREADY_EXISTS",
          });
        }
      } else if (
        command.operation !== "CAS_CHECKPOINT" ||
        current !== command.predecessor_checkpoint_identity_sha256
      ) {
        throw Object.assign(new Error("stale checkpoint predecessor"), {
          code: "CHECKPOINT_CAS_MISMATCH",
        });
      }
      checkpointHeads.set(
        command.journal_identity_sha256,
        command.checkpoint_identity_sha256,
      );
      checkpointStates.set(
        command.journal_identity_sha256,
        structuredClone(state),
      );
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
    },
    async readCheckpointHead(request) {
      const state = checkpointStates.get(request.journal_identity_sha256);
      if (!state) {
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
        checkpoint_sequence: state.checkpoint.sequence,
        predecessor_checkpoint_identity_sha256:
          state.checkpoint.predecessor_checkpoint_identity_sha256,
        checkpoint_identity_sha256:
          state.checkpoint.checkpoint_identity_sha256,
      };
    },
  };
}

function qualificationInput(adapterSet, overrides = {}) {
  return {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: "34JA-34JZ",
    operation_class: ACTIVATION_OPERATION_CLASS,
    authorization: authorization(),
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    freeze_closure: freezeClosure(),
    retain_preview_on_success: true,
    resource_plan: resourcePlan(),
    adapters: adapterSet.contract,
    async checkpoint(state, command) {
      return adapterSet.commitCheckpoint(state, command);
    },
    async readCheckpointHead(request) {
      return adapterSet.readCheckpointHead(request);
    },
    ...overrides,
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

function exactCheckpointHead(state) {
  return {
    schema_version: 1,
    status: "CHECKPOINT_PRESENT",
    journal_identity_sha256: state.journal_identity_sha256,
    checkpoint_sequence: state.checkpoint.sequence,
    predecessor_checkpoint_identity_sha256:
      state.checkpoint.predecessor_checkpoint_identity_sha256,
    checkpoint_identity_sha256: state.checkpoint.checkpoint_identity_sha256,
  };
}

function resealCheckpointState(state) {
  const candidate = structuredClone(state);
  const checkpoint = structuredClone(candidate.checkpoint);
  delete candidate.checkpoint;
  checkpoint.checkpoint_identity_sha256 = sha256Hex(canonicalJson({
    schema_version: 1,
    journal_identity_sha256: candidate.journal_identity_sha256,
    sequence: checkpoint.sequence,
    predecessor_checkpoint_identity_sha256:
      checkpoint.predecessor_checkpoint_identity_sha256,
    checkpoint_state: candidate,
  }));
  return { ...candidate, checkpoint };
}

function resealEvidence(evidence) {
  const candidate = structuredClone(evidence);
  delete candidate.evidence_identity_sha256;
  return {
    ...candidate,
    evidence_identity_sha256: sha256Hex(canonicalJson(candidate)),
  };
}

function exactReadyEvidenceFixture() {
  const resourcePlan = [];
  const resourcePlanSha256 = deriveResourcePlanSha256(resourcePlan);
  const authorityEnvelope = {
    schema_version: 1,
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: "34JA-34JZ",
    operation_class: ACTIVATION_OPERATION_CLASS,
    review_approval_sha256: ACTIVATION_REVIEW_SHA256,
    freeze_document_sha256: "7".repeat(64),
    current_retained_state_attestation_sha256:
      "69cdf8984a060a9027df02919ecd1c04a3e28d188f5528aad4dd096376448db7",
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 =
    deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation =
    createOperationReservation(authorityEnvelopeSha256);
  return buildCompactEvidence({
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: "34JA-34JZ",
    operation_class: ACTIVATION_OPERATION_CLASS,
    review_approval_sha256: ACTIVATION_REVIEW_SHA256,
    lifecycle_state: "READY",
    authorization_class: "NONE",
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    freeze_document_sha256: authorityEnvelope.freeze_document_sha256,
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    retained_state_sha256: "9".repeat(64),
    resource_plan: resourcePlan,
    resource_plan_sha256: resourcePlanSha256,
    outcome: { code: "READY", successful: true },
    immutable_audit_reference_sha256: ["6".repeat(64)],
    operation_reservation: operationReservation,
    recovery_operation_state: createRecoveryOperationState(
      operationReservation,
      resourcePlan,
    ),
    journal_identity_sha256: deriveJournalIdentitySha256({
      authority_envelope_sha256: authorityEnvelopeSha256,
      resource_plan_sha256: resourcePlanSha256,
      ordered_resource_keys: [],
      operation_reservation_identity_sha256:
        operationReservation.identity_sha256,
    }),
  });
}

function compactEvidencePayloadFromState(state) {
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

function resealTerminalJournal(state) {
  const candidate = structuredClone(state);
  candidate.final_evidence_identity_sha256 = sha256Hex(
    canonicalJson(compactEvidencePayloadFromState(candidate)),
  );
  return resealCheckpointState(candidate);
}

function ownedResourceDescriptor(resource) {
  return {
    resource_type: resource.resource_type,
    locator: structuredClone(resource.locator),
    cleanup_policy: resource.owner.cleanup_policy,
    ...(resource.resource_type === "STORAGE_OBJECT"
      ? { storage_cas: structuredClone(resource.storage_cas) }
      : {}),
  };
}

function replaceExactStrings(value, replacements) {
  if (typeof value === "string") return replacements.get(value) ?? value;
  if (Array.isArray(value)) {
    return value.map((entry) => replaceExactStrings(entry, replacements));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      replaceExactStrings(entry, replacements),
    ]),
  );
}

function coordinatedActivationSemanticReseal(state, mutationKind) {
  const original = structuredClone(state);
  const replacements = new Map();
  const runId = mutationKind === "INVALID_RUN_ID"
    ? "qualification_run_0001"
    : original.run_id;
  const descriptors = original.resource_plan.map(ownedResourceDescriptor);
  if (mutationKind === "DUPLICATE_MISSING_TYPE") {
    const branchIndex = descriptors.findIndex(
      (descriptor) => descriptor.resource_type === "GIT_BRANCH",
    );
    assert.ok(branchIndex >= 0);
    descriptors[branchIndex] = {
      resource_type: "DATABASE_ROW",
      locator: {
        relation: "discovered_tools",
        id: "synthetic-duplicate-database-row",
      },
      cleanup_policy: "DELETE_EXACT",
    };
  }
  const resourcePlan = descriptors.map((descriptor) => {
    const resource = createOwnedResource({
      candidate_identity_sha256: original.candidate_identity_sha256,
      run_id:
        mutationKind === "INVALID_RUN_ID" ? original.run_id : runId,
      phase: original.phase,
      operation_class: original.operation_class,
      descriptor,
    });
    if (mutationKind === "INVALID_RUN_ID") {
      resource.owner.run_id = runId;
      resource.resource_key =
        `${runId}:${resource.resource_type}:${resource.owner.locator_sha256}`;
    }
    return resource;
  });
  for (const [index, oldResource] of original.resource_plan.entries()) {
    const newResource = resourcePlan[index];
    replacements.set(oldResource.resource_key, newResource.resource_key);
    replacements.set(
      oldResource.owner.locator_sha256,
      newResource.owner.locator_sha256,
    );
  }
  replacements.set(original.run_id, runId);
  const retainedAttestation = mutationKind === "SUBSTITUTED_ATTESTATION"
    ? "d".repeat(64)
    : original.authority_envelope.current_retained_state_attestation_sha256;
  replacements.set(
    original.authority_envelope.current_retained_state_attestation_sha256,
    retainedAttestation,
  );

  const resourcePlanSha256 = deriveResourcePlanSha256(resourcePlan);
  const authorityEnvelope = {
    ...structuredClone(original.authority_envelope),
    run_id: runId,
    current_retained_state_attestation_sha256: retainedAttestation,
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 =
    deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation =
    createOperationReservation(authorityEnvelopeSha256);
  const journalIdentitySha256 = deriveJournalIdentitySha256({
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan_sha256: resourcePlanSha256,
    ordered_resource_keys: resourcePlan.map(
      (resource) => resource.resource_key,
    ),
    operation_reservation_identity_sha256:
      operationReservation.identity_sha256,
  });
  replacements.set(
    original.resource_plan_sha256,
    resourcePlanSha256,
  );
  replacements.set(
    original.authority_envelope_sha256,
    authorityEnvelopeSha256,
  );
  replacements.set(
    original.operation_reservation.identity_sha256,
    operationReservation.identity_sha256,
  );
  replacements.set(original.journal_identity_sha256, journalIdentitySha256);

  const recoveryOperationState = createRecoveryOperationState(
    operationReservation,
    resourcePlan,
  );
  const oldQualificationSlots =
    original.recovery_operation_state.qualification_operation_slots;
  const qualificationSlots =
    recoveryOperationState.qualification_operation_slots;
  for (const [index, oldSlot] of oldQualificationSlots.entries()) {
    const slot = qualificationSlots[index];
    replacements.set(oldSlot.operation_slot_sha256, slot.operation_slot_sha256);
    slot.status = oldSlot.status;
    slot.reservation_ordinal = oldSlot.reservation_ordinal;
  }
  let predecessor = deriveQualificationReservationRootSha256({
    journal_identity_sha256: journalIdentitySha256,
    operation_reservation_identity_sha256:
      operationReservation.identity_sha256,
  });
  const progressedQualificationSlots = qualificationSlots
    .filter((slot) => slot.status !== "NOT_STARTED")
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  for (const [ordinal, slot] of progressedQualificationSlots.entries()) {
    const oldSlot = oldQualificationSlots.find(
      (candidate) => candidate.reservation_ordinal === ordinal,
    );
    assert.ok(oldSlot);
    slot.reservation_ordinal = ordinal;
    slot.predecessor_reservation_proof_sha256 = predecessor;
    slot.reservation_proof_sha256 =
      deriveQualificationReservationProofSha256({
        journal_identity_sha256: journalIdentitySha256,
        operation_reservation_identity_sha256:
          operationReservation.identity_sha256,
        reservation_ordinal: ordinal,
        predecessor_reservation_proof_sha256: predecessor,
        operation_slot_sha256: slot.operation_slot_sha256,
      });
    replacements.set(
      oldSlot.predecessor_reservation_proof_sha256,
      slot.predecessor_reservation_proof_sha256,
    );
    replacements.set(
      oldSlot.reservation_proof_sha256,
      slot.reservation_proof_sha256,
    );
    predecessor = slot.reservation_proof_sha256;
  }
  for (const [index, oldSlot] of oldQualificationSlots.entries()) {
    const slot = qualificationSlots[index];
    if (oldSlot.receipt === null) continue;
    slot.receipt = replaceExactStrings(oldSlot.receipt, replacements);
    slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
    replacements.set(oldSlot.receipt_sha256, slot.receipt_sha256);
  }
  recoveryOperationState.qualification_slot_usage = Object.fromEntries(
    ["requests", "mutations"].map((category) => [
      category,
      original.recovery_operation_state.qualification_slot_usage[category]
        .map((identity) => replacements.get(identity)),
    ]),
  );

  const oldRecoverySlots = original.recovery_operation_state.operation_slots;
  const recoverySlots = recoveryOperationState.operation_slots;
  for (const [index, oldSlot] of oldRecoverySlots.entries()) {
    const slot = recoverySlots[index];
    replacements.set(oldSlot.operation_slot_sha256, slot.operation_slot_sha256);
    slot.status = oldSlot.status;
  }
  recoveryOperationState.recovery_anchor = structuredClone(
    original.recovery_operation_state.recovery_anchor,
  );
  const anchor = recoveryOperationState.recovery_anchor;
  for (const [index, oldSlot] of oldRecoverySlots.entries()) {
    const slot = recoverySlots[index];
    if (oldSlot.status === "NOT_STARTED") continue;
    slot.operation_binding_sha256 = deriveRecoveryOperationBindingSha256({
      journal_identity_sha256: journalIdentitySha256,
      recovery_anchor_checkpoint_identity_sha256:
        anchor.checkpoint_identity_sha256,
      operation_slot_sha256: slot.operation_slot_sha256,
    });
    replacements.set(
      oldSlot.operation_binding_sha256,
      slot.operation_binding_sha256,
    );
  }
  for (const [index, oldSlot] of oldRecoverySlots.entries()) {
    const slot = recoverySlots[index];
    if (oldSlot.receipt === null) continue;
    slot.receipt = replaceExactStrings(oldSlot.receipt, replacements);
    slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
    replacements.set(oldSlot.receipt_sha256, slot.receipt_sha256);
  }
  if (original.recovery_operation_state.recovery_grant !== null) {
    recoveryOperationState.recovery_grant = replaceExactStrings(
      original.recovery_operation_state.recovery_grant,
      replacements,
    );
    const authoritySlot = recoverySlots.find(
      (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
    );
    recoveryOperationState.recovery_grant.authority_receipt_sha256 =
      authoritySlot.receipt_sha256;
  }

  const candidate = {
    ...structuredClone(original),
    run_id: runId,
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan: resourcePlan,
    resource_plan_sha256: resourcePlanSha256,
    operation_reservation: operationReservation,
    recovery_operation_state: recoveryOperationState,
    journal_identity_sha256: journalIdentitySha256,
    owned_resources: original.owned_resources.map((resource) => {
      const planIndex = original.resource_plan.findIndex(
        (candidateResource) =>
          candidateResource.resource_key === resource.resource_key,
      );
      assert.ok(planIndex >= 0);
      return structuredClone(resourcePlan[planIndex]);
    }),
    effect_ledger: replaceExactStrings(original.effect_ledger, replacements),
  };
  if (Object.hasOwn(original, "final_evidence_identity_sha256")) {
    candidate.final_evidence_identity_sha256 = sha256Hex(
      canonicalJson(compactEvidencePayloadFromState(candidate)),
    );
  }
  return resealCheckpointState(candidate);
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
  assert.equal(Object.hasOwn(result, "checkpoint"), false);
  assert.equal(Object.hasOwn(result, "journal_identity_sha256"), false);
  assert.equal(Object.hasOwn(result, "effect_ledger"), false);
  assert.equal(Object.hasOwn(result, "owned_resources"), false);
}

function assertQualificationFailureProjection(result, expectedCode) {
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
  assert.equal(result.result_type, "QUALIFICATION_FAILURE_PROJECTION");
  assert.equal(result.candidate_identity_sha256, CANDIDATE);
  assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.authorization_class, "NONE");
  assert.equal(result.checkpoint_disposition, "UNKNOWN");
  assert.deepEqual(result.cleanup, { required: true, verified: false });
  assert.deepEqual(result.recovery, { status: "PENDING", resume_to: "READY" });
  assert.deepEqual(result.outcome, { code: expectedCode, successful: false });
  for (const forbidden of [
    "checkpoint",
    "journal_identity_sha256",
    "effect_ledger",
    "owned_resources",
    "budgets",
  ]) {
    assert.equal(Object.hasOwn(result, forbidden), false, forbidden);
  }
}

async function runReorderedCleanupBoundary({
  planCase,
  boundaryKind,
  successPosition,
  adapterOptions = {},
  checkpointMode = "EXACT_NOT_COMMITTED",
}) {
  const fake = adapters(adapterOptions);
  installFutureAuthority(fake);
  const targetPlanIndex = planCase.success_delete_indices[successPosition];
  let injected = false;
  let readbacks = 0;
  let persistentOutage = false;
  let exactPredecessorRead = false;
  let result;
  const matchesBoundary = (state) => {
    const resource = state.resource_plan[targetPlanIndex];
    const slot = state.recovery_operation_state.qualification_operation_slots.find(
      (candidate) =>
        candidate.category === "mutations" &&
        candidate.index === 5 + targetPlanIndex &&
        candidate.operation === "QUALIFICATION_DELETE_EXACT" &&
        candidate.resource_key === resource.resource_key,
    );
    if (boundaryKind === "RESERVATION") return slot?.status === "RESERVED";
    const ledger = state.effect_ledger.find(
      (entry) => entry.resource_key === resource.resource_key,
    );
    return (
      slot?.status === "RESULT_APPLIED" &&
      ledger?.status === "CLEANED" &&
      ledger.cleanup_status === "APPLIED"
    );
  };
  await assert.doesNotReject(async () => {
    result = await runQualification(
      qualificationInput(fake, {
        resource_plan: resourcePlanInTypeOrder(planCase.plan_order),
        async checkpoint(state, command) {
          if (!injected && matchesBoundary(state)) {
            injected = true;
            if (checkpointMode === "UNKNOWN") {
              persistentOutage = true;
              throw new Error(`Bearer ${"u".repeat(24)}`);
            }
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          if (persistentOutage) {
            throw new Error(`Bearer ${"w".repeat(24)}`);
          }
          return fake.commitCheckpoint(state, command);
        },
        async readCheckpointHead(request) {
          readbacks += 1;
          if (checkpointMode === "UNKNOWN" || persistentOutage) {
            throw new Error(`Bearer ${"v".repeat(24)}`);
          }
          const head = await fake.readCheckpointHead(request);
          exactPredecessorRead = true;
          if (checkpointMode === "NOT_COMMITTED_THEN_OUTAGE") {
            persistentOutage = true;
          }
          return head;
        },
      }),
    );
  });
  return {
    exactPredecessorRead,
    fake,
    injected,
    readbacks,
    result,
    targetPlanIndex,
  };
}

function assertExactClosedCleanupResult(execution, expectedCleanupOrder, expectedCode) {
  const { fake, result } = execution;
  assert.equal(execution.injected, true);
  assert.equal(execution.exactPredecessorRead, true);
  assert.equal(execution.readbacks, 1);
  assert.deepEqual(cleanupEventTypes(fake), expectedCleanupOrder);
  assert.equal(cleanupEventTypes(fake).length, 5);
  assert.equal(new Set(cleanupEventTypes(fake)).size, 5);
  assert.equal(fake.present.size, 0);
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, expectedCode);
  assert.deepEqual(result.state.cleanup, { required: true, verified: true });
  assert.deepEqual(result.state.recovery, { status: "NOT_REQUIRED" });
  assert.deepEqual(result.retained_resources, []);
  assert.equal(
    result.state.effect_ledger.some(
      (entry) => entry.cleanup_status === "RETAINED",
    ),
    false,
  );
  assert.deepEqual(result.state.budgets, {
    requests: { limit: 16, used: 4 },
    mutations: { limit: 15, used: 10 },
  });
  const protocol = result.state.recovery_operation_state;
  assert.equal(protocol.qualification_slot_usage.requests.length, 4);
  assert.equal(protocol.qualification_slot_usage.mutations.length, 10);
  assert.equal(
    new Set([
      ...protocol.qualification_slot_usage.requests,
      ...protocol.qualification_slot_usage.mutations,
    ]).size,
    14,
  );
  const progressed = protocol.qualification_operation_slots
    .filter((slot) => slot.status !== "NOT_STARTED")
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  assert.deepEqual(
    progressed.map((slot) => slot.reservation_ordinal),
    Array.from({ length: 14 }, (_ignored, index) => index),
  );
  const deleteSlots = protocol.qualification_operation_slots.filter(
    (slot) => slot.operation === "QUALIFICATION_DELETE_EXACT",
  );
  assert.equal(deleteSlots.length, 5);
  for (const slot of deleteSlots) {
    assert.equal(slot.status, "RESULT_APPLIED");
    assert.equal(slot.receipt.operation_slot_sha256, slot.operation_slot_sha256);
    assert.equal(slot.receipt.reservation_proof_sha256, slot.reservation_proof_sha256);
  }
  const slot3 = protocol.qualification_operation_slots.find(
    (slot) =>
      slot.category === "requests" &&
      slot.index === 3 &&
      slot.operation === "QUALIFICATION_VERIFY_CLEANUP",
  );
  const slot4 = protocol.qualification_operation_slots.find(
    (slot) =>
      slot.category === "requests" &&
      slot.index === 4 &&
      slot.operation === "QUALIFICATION_VERIFY_CLEANUP",
  );
  assert.equal(slot3.status, "RESULT_APPLIED");
  assert.equal(slot3.receipt.retained_preview_count, 0);
  assert.deepEqual(slot3.receipt.verified_present_resources, []);
  assert.equal(slot4.status, "NOT_STARTED");
  validateCheckpointProtocol(result.state);
  validateTerminalState(result.state);
  validateCompactEvidence(result.evidence);
  assert.equal(
    result.evidence.evidence_identity_sha256,
    result.state.final_evidence_identity_sha256,
  );
  const durable = fake.checkpointStates.get(result.state.journal_identity_sha256);
  assert.ok(durable);
  assert.equal(canonicalJson(durable), canonicalJson(result.state));
  assert.equal(JSON.stringify(result).includes("Bearer"), false);
}

await check("controlling v2 review digest known-answer contract", async () => {
  assert.equal(
    ACTIVATION_REVIEW_SHA256,
    "84a37bd0d303ef9afc30613aa5c2c737af082dd813dc617313395b7ffecaede3",
  );
});

await check("exact legacy freeze closure", async () => {
  const closure = assertLegacyFreezeClosure(freezeClosure());
  assert.deepEqual(closure, {
    verified: true,
    classification: "FAIL_CLOSED_UNRESOLVED",
    retained_identity_digest_sha256:
      "6614d25b486bdf0c4f19c4fd7617a0d46991569b6cd7b66e66cdb8f49b8584c0",
    approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
    writes: 0,
    created_resources: 0,
    ambiguous_legacy_resources_preserved: true,
  });
});

await check("freeze approval mismatch fails closed", async () => {
  assert.throws(
    () =>
      assertLegacyFreezeClosure(
        freezeClosure({ approval_digest_sha256: "d".repeat(64) }),
      ),
    (error) => error?.code === "FREEZE_APPROVAL_MISMATCH",
  );
});

await check("retained state drift fails closed", async () => {
  assert.throws(
    () =>
      assertLegacyFreezeClosure(
        freezeClosure({
          legacy_classification: legacyClassification({
            retained_identity_digest_sha256: "e".repeat(64),
          }),
        }),
      ),
    (error) => error?.code === "RETAINED_STATE_DRIFT",
  );
});

await check("equivalent JSON byte drift fails before all adapters", async () => {
  const fake = adapters();
  const result = await runQualification(
    qualificationInput(fake, {
      freeze_closure: freezeClosure({
        freeze_document_bytes: Buffer.from(JSON.stringify(FREEZE), "utf8"),
      }),
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "LEGACY_FREEZE_DOCUMENT_DRIFT");
  assert.equal(
    fake.events.some((event) => event.startsWith("authority:") || event.startsWith("create:")),
    false,
  );
});

await check("legacy effects and policy bypass are rejected", async () => {
  for (const closure of [
    freezeClosure({
      legacy_classification: legacyClassification({
        effects: {
          ...legacyClassification().effects,
          data_writes: 1,
        },
      }),
    }),
    freezeClosure({
      policy: {
        preserve_ambiguous_legacy_resources: false,
        fresh_ownership_namespace: true,
        claim_legacy_resources: false,
      },
    }),
  ]) {
    assert.throws(
      () => assertLegacyFreezeClosure(closure),
      (error) => error instanceof ActivationBridgeError,
    );
  }
});

await check("fresh resource ownership is exact", async () => {
  const resource = createOwnedResource({
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: "34JA-34JZ",
    operation_class: ACTIVATION_OPERATION_CLASS,
    descriptor: resourcePlan()[0],
  });
  assert.deepEqual(resource.owner, {
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
    phase: "34JA-34JZ",
    operation_class: ACTIVATION_OPERATION_CLASS,
    resource_type: "GIT_BRANCH",
    locator_sha256: sha256Hex(
      '{"branch":"qualification-run-0001","expected_commit_sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","repository":"aifinder"}',
    ),
    cleanup_policy: "DELETE_EXACT",
  });
  assert.match(resource.resource_key, /^qualification-run-0001:/u);
});

await check("pattern-only and ambiguous resource plans are rejected", async () => {
  for (const descriptor of [
    {
      resource_type: "PREVIEW_DEPLOYMENT",
      locator: { pattern: "preview-*" },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "PREVIEW_DEPLOYMENT",
      locator: { project_id: "project-1", deployment_id: "" },
      cleanup_policy: "DELETE_EXACT",
    },
  ]) {
    assert.throws(
      () =>
        createOwnedResource({
          candidate_identity_sha256: CANDIDATE,
          run_id: RUN_ID,
          phase: "34JA-34JZ",
          operation_class: ACTIVATION_OPERATION_CLASS,
          descriptor,
        }),
      (error) => error?.code === "OWNERSHIP_UNPROVEN",
    );
  }
});

await check("qualification retains exactly one authorized Preview", async () => {
  const fake = adapters();
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "QUALIFIED");
  assert.equal(result.state.outcome.code, "QUALIFIED");
  assert.equal(result.retained_resources.length, 1);
  assert.equal(result.retained_resources[0].resource_type, "PREVIEW_DEPLOYMENT");
  assert.deepEqual(result.state.effect_ledger.map((entry) => entry.status), [
    "CLEANED",
    "APPLIED",
    "CLEANED",
    "CLEANED",
    "CLEANED",
  ]);
  for (const resource of result.state.owned_resources) {
    const intent = fake.events.indexOf(
      `checkpoint:${resource.resource_key}:INTENT_ONLY`,
    );
    const effect = fake.events.indexOf(
      `create:${resource.resource_type}:${resource.resource_key}`,
    );
    assert.ok(intent >= 0 && intent < effect, resource.resource_key);
  }
  assert.equal(result.evidence.lifecycle_state, "QUALIFIED");
  assert.equal(result.evidence.run_id, RUN_ID);
  assert.equal(result.evidence.phase, "34JA-34JZ");
  assert.equal(result.evidence.operation_class, ACTIVATION_OPERATION_CLASS);
  assert.equal(result.evidence.review_approval_sha256, ACTIVATION_REVIEW_SHA256);
  assert.match(result.evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(fake.checkpoints.at(-1).lifecycle_state, "QUALIFIED");
  assert.equal(
    fake.checkpoints.at(-1).final_evidence_identity_sha256,
    result.evidence.evidence_identity_sha256,
  );
});

const invalidPreviewPolicies = [
  {
    name: "retention flag false with Preview DELETE_EXACT",
    retain_preview_on_success: false,
    plan: resourcePlan().map((descriptor) =>
      descriptor.resource_type === "PREVIEW_DEPLOYMENT"
        ? { ...descriptor, cleanup_policy: "DELETE_EXACT" }
        : descriptor,
    ),
  },
  {
    name: "Preview DELETE_EXACT",
    retain_preview_on_success: true,
    plan: resourcePlan().map((descriptor) =>
      descriptor.resource_type === "PREVIEW_DEPLOYMENT"
        ? { ...descriptor, cleanup_policy: "DELETE_EXACT" }
        : descriptor,
    ),
  },
  {
    name: "no Preview descriptor",
    retain_preview_on_success: true,
    plan: resourcePlan().filter(
      (descriptor) => descriptor.resource_type !== "PREVIEW_DEPLOYMENT",
    ),
  },
  {
    name: "multiple Preview descriptors",
    retain_preview_on_success: true,
    plan: [
      ...resourcePlan(),
      {
        resource_type: "PREVIEW_DEPLOYMENT",
        locator: { project_id: "project-1", deployment_id: "preview-2" },
        cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
      },
    ],
  },
];

for (const invalid of invalidPreviewPolicies) {
  await check(`invalid Preview retention rejects pre-BEGIN: ${invalid.name}`, async () => {
    const fake = adapters();
    const result = await runQualification(
      qualificationInput(fake, {
        retain_preview_on_success: invalid.retain_preview_on_success,
        resource_plan: invalid.plan,
      }),
    );
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(result.state.outcome.code, "RETAINED_PREVIEW_POLICY");
    assert.deepEqual(fake.events, []);
    assert.equal(fake.checkpoints.length, 0);
    assert.equal(fake.present.size, 0);
  });
}

await check("pre-effect failure performs zero effects", async () => {
  const fake = adapters();
  const result = await runQualification(
    qualificationInput(fake, {
      freeze_closure: freezeClosure({ approval_digest_sha256: "d".repeat(64) }),
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "FREEZE_APPROVAL_MISMATCH");
  assert.equal(
    fake.events.some((event) => event.startsWith("authority:") || event.startsWith("create:")),
    false,
  );
  assert.deepEqual(result.state.owned_resources, []);
  assert.equal(fake.checkpoints.length, 0);
  assert.equal(result.evidence.run_id, RUN_ID);
  assert.equal(result.evidence.review_approval_sha256, ACTIVATION_REVIEW_SHA256);
});

await check("internally consistent arbitrary candidate fails before effect adapters", async () => {
  const fake = adapters();
  const arbitrary = "d".repeat(64);
  const result = await runQualification(
    qualificationInput(fake, {
      candidate_identity_sha256: arbitrary,
      authorization: authorization(arbitrary),
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "REVIEWED_CANDIDATE_MISMATCH");
  assert.equal(
    fake.events.some(
      (event) => event.startsWith("fresh:") || event.startsWith("create:"),
    ),
    false,
  );
});

await check("partial effect is cleaned exactly", async () => {
  const fake = adapters({ failCreateType: "PREVIEW_DEPLOYMENT" });
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.cleanup.verified, true);
  assert.deepEqual(result.state.effect_ledger.map((entry) => entry.status), [
    "CLEANED",
    "CLEANED",
  ]);
  assert.equal(fake.present.size, 0);
  assert.equal(
    fake.events.some((event) => event.startsWith("create:ENVIRONMENT_RECORD:")),
    false,
  );
});

await check("request budget exhaustion cleans effects and fails closed", async () => {
  const fake = adapters();
  const result = await runQualification(
    qualificationInput(fake, {
      budgets: {
        requests: { limit: 1, used: 0 },
        mutations: { limit: 15, used: 0 },
      },
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "BUDGET_EXHAUSTED");
  assert.equal(result.state.cleanup.verified, true);
  assert.equal(fake.present.size, 0);
});

await check("boundary-minus-one request and mutation budgets reject before effects", async () => {
  for (const budgets of [
    {
      requests: { limit: 15, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 14, used: 0 },
    },
  ]) {
    const fake = adapters();
    const result = await runQualification(qualificationInput(fake, { budgets }));
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(result.state.outcome.code, "BUDGET_EXHAUSTED");
    assert.equal(
      fake.events.some(
        (event) => event.startsWith("fresh:") || event.startsWith("create:"),
      ),
      false,
    );
  }
});

await check("exact qualification-plus-recovery budget boundary permits qualification", async () => {
  const fake = adapters();
  const result = await runQualification(
    qualificationInput(fake, {
      budgets: {
        requests: { limit: 16, used: 0 },
        mutations: { limit: 15, used: 0 },
      },
    }),
  );
  assert.equal(result.state.lifecycle_state, "QUALIFIED", result.state.outcome.code);
});

for (const invalidBudgets of [
  {
    requests: { limit: 17, used: 0 },
    mutations: { limit: 15, used: 0 },
  },
  {
    requests: { limit: 16, used: 0 },
    mutations: { limit: 16, used: 0 },
  },
  {
    requests: { limit: 16, used: 1 },
    mutations: { limit: 15, used: 0 },
  },
  {
    requests: { limit: 16, used: 0 },
    mutations: { limit: 15, used: 1 },
  },
]) {
  await check(
    `non-exact initial qualification budget rejects pre-BEGIN: ${canonicalJson(invalidBudgets)}`,
    async () => {
      const fake = adapters();
      const result = await runQualification(
        qualificationInput(fake, { budgets: invalidBudgets }),
      );
      assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
      assert.equal(result.state.outcome.code, "QUALIFICATION_BUDGET_MISMATCH");
      assert.deepEqual(fake.events, []);
      assert.equal(fake.checkpoints.length, 0);
      assert.equal(fake.present.size, 0);
    },
  );
}

await check("pre-BEGIN malformed budgets emit schema-valid fixed-accounting evidence", async () => {
  for (const budgets of [
    {
      requests: { limit: 17, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    {
      requests: { limit: 16, used: 1 },
      mutations: { limit: 15, used: 0 },
    },
    {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 16, used: 1 },
    },
  ]) {
    const fake = adapters();
    const result = await runQualification(
      qualificationInput(fake, { budgets }),
    );
    assert.deepEqual(result.evidence.budgets, {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    });
    assert.equal(validateCompactEvidence(result.evidence), true);
    assert.deepEqual(fake.events, []);
    assert.equal(fake.checkpoints.length, 0);
  }
});

await check("Storage CAS mismatch preserves replacement", async () => {
  const fake = adapters({ storageCleanupStatus: "VERSION_MISMATCH" });
  const result = await runQualification(qualificationInput(fake));
  const storage = result.state.owned_resources.find(
    (resource) => resource.resource_type === "STORAGE_OBJECT",
  );
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.state.outcome.code, "STORAGE_VERSION_MISMATCH");
  assert.equal(result.state.cleanup.verified, false);
  assert.deepEqual(result.retained_resources, []);
  assert.equal(
    [...fake.present].some((resourceKey) => resourceKey.includes(":PREVIEW_DEPLOYMENT:")),
    false,
  );
  assert.equal(fake.present.has(storage.resource_key), true);
  assert.equal(
    fake.events.filter((event) => event === `cleanup:STORAGE_OBJECT:${storage.resource_key}`)
      .length,
    1,
  );
  assert.equal(storage ? result.state.effect_ledger.find(
    (entry) => entry.resource_key === storage.resource_key,
  ).cleanup_status : null, "VERSION_MISMATCH_PRESERVED");
});

await check("ordinary cleanup failure deletes the success-only Preview", async () => {
  const fake = adapters({ failCleanupType: "GIT_BRANCH" });
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.deepEqual(result.retained_resources, []);
  assert.equal(
    [...fake.present].some((resourceKey) => resourceKey.includes(":PREVIEW_DEPLOYMENT:")),
    false,
  );
});

await check("final cleanup rejection and exception delete the success-only Preview", async () => {
  for (const finalCleanupMode of ["REJECT_FIRST", "THROW_FIRST"]) {
    const fake = adapters({ finalCleanupMode });
    const result = await runQualification(qualificationInput(fake));
    assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.state.outcome.code, "CLEANUP_VERIFICATION_FAILED");
    assert.equal(result.state.cleanup.verified, false);
    assert.deepEqual(result.state.recovery, {
      status: "PENDING",
      resume_to: "READY",
    });
    assert.deepEqual(result.retained_resources, []);
    assert.equal(fake.present.size, 0);
  }
});

for (const planCase of REORDERED_PREVIEW_PLAN_CASES) {
  for (const boundaryKind of ["RESERVATION", "RESULT"]) {
    for (let successPosition = 0; successPosition < 4; successPosition += 1) {
      await check(
        `Preview index ${planCase.preview_index} ${boundaryKind} exact-not-committed at success delete ${successPosition} closes exact reordered cleanup`,
        async () => {
          const execution = await runReorderedCleanupBoundary({
            planCase,
            boundaryKind,
            successPosition,
          });
          const completedSuccessCount =
            successPosition + (boundaryKind === "RESULT" ? 1 : 0);
          assertExactClosedCleanupResult(
            execution,
            planCase.cleanup_by_completed_success_count[
              completedSuccessCount
            ],
            boundaryKind === "RESULT"
              ? "CLEANUP_CHECKPOINT_FAILED"
              : "OPERATION_RESERVATION_CHECKPOINT_FAILED",
          );
          if (
            planCase.preview_index === 2 &&
            boundaryKind === "RESULT" &&
            successPosition === 2
          ) {
            assert.deepEqual(cleanupEventTypes(execution.fake), [
              "STORAGE_OBJECT",
              "DATABASE_ROW",
              "ENVIRONMENT_RECORD",
              "PREVIEW_DEPLOYMENT",
              "GIT_BRANCH",
            ]);
            const repeated = await runReorderedCleanupBoundary({
              planCase,
              boundaryKind,
              successPosition,
            });
            assertExactClosedCleanupResult(
              repeated,
              [
                "STORAGE_OBJECT",
                "DATABASE_ROW",
                "ENVIRONMENT_RECORD",
                "PREVIEW_DEPLOYMENT",
                "GIT_BRANCH",
              ],
              "CLEANUP_CHECKPOINT_FAILED",
            );
            assert.equal(
              canonicalJson(repeated.result),
              canonicalJson(execution.result),
            );
          }
        },
      );
    }
  }
}

for (const planCase of REORDERED_PREVIEW_PLAN_CASES) {
  for (const boundaryKind of ["RESERVATION", "RESULT"]) {
    await check(
      `Preview index ${planCase.preview_index} ${boundaryKind} unknown success-delete persistence starts no failure cleanup`,
      async () => {
        const successPosition = 2;
        const execution = await runReorderedCleanupBoundary({
          planCase,
          boundaryKind,
          successPosition,
          checkpointMode: "UNKNOWN",
        });
        const completedSuccessCount =
          successPosition + (boundaryKind === "RESULT" ? 1 : 0);
        const successOrder =
          planCase.cleanup_by_completed_success_count[4].slice(0, 4);
        assert.equal(execution.injected, true);
        assert.equal(execution.exactPredecessorRead, false);
        assert.ok(execution.readbacks >= 1);
        assert.deepEqual(
          cleanupEventTypes(execution.fake),
          successOrder.slice(0, completedSuccessCount),
        );
        assert.equal(
          [...execution.fake.present].filter((resourceKey) =>
            resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
          ).length,
          1,
        );
        assert.equal(execution.fake.present.size, 5 - completedSuccessCount);
        assertQualificationFailureProjection(
          execution.result.state,
          "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
        );
        assert.deepEqual(execution.result.retained_resources, []);
        validateCompactEvidence(execution.result.evidence);
        assert.deepEqual(execution.result.evidence.budgets, {
          requests: { limit: 16, used: 3 },
          mutations: {
            limit: 15,
            used: 5 + successPosition + 1,
          },
        });
        assert.equal(
          execution.result.evidence.effect_ledger.some(
            (entry) => entry.cleanup_status === "RETAINED",
          ),
          false,
        );
        assert.equal(JSON.stringify(execution.result).includes("Bearer"), false);
        assert.equal(JSON.stringify(execution.result).includes("uuuu"), false);
        assert.equal(JSON.stringify(execution.result).includes("vvvv"), false);
        assert.equal(JSON.stringify(execution.result).includes("wwww"), false);
      },
    );
  }
}

await check(
  "reordered interior exact-not-committed cleanup preserves honest adapter residue",
  async () => {
    const execution = await runReorderedCleanupBoundary({
      planCase: REORDERED_PREVIEW_PLAN_CASES[2],
      boundaryKind: "RESULT",
      successPosition: 2,
      adapterOptions: { failCleanupType: "GIT_BRANCH" },
    });
    assert.equal(execution.injected, true);
    assert.deepEqual(cleanupEventTypes(execution.fake), [
      "STORAGE_OBJECT",
      "DATABASE_ROW",
      "ENVIRONMENT_RECORD",
      "PREVIEW_DEPLOYMENT",
      "GIT_BRANCH",
    ]);
    assert.equal(new Set(cleanupEventTypes(execution.fake)).size, 5);
    assert.equal(execution.fake.present.size, 1);
    assert.equal(
      [...execution.fake.present].some((resourceKey) =>
        resourceKey.includes(":GIT_BRANCH:"),
      ),
      true,
    );
    assert.equal(
      [...execution.fake.present].some((resourceKey) =>
        resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
      ),
      false,
    );
    assert.equal(execution.result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(execution.result.state.outcome.code, "CLEANUP_FAILED");
    assert.deepEqual(execution.result.state.cleanup, {
      required: true,
      verified: false,
    });
    assert.deepEqual(execution.result.state.recovery, {
      status: "PENDING",
      resume_to: "READY",
    });
    validateCheckpointProtocol(execution.result.state);
    validateCompactEvidence(execution.result.evidence);
  },
);

await check(
  "reordered exact-not-committed cleanup preserves Storage version mismatch while deleting Preview",
  async () => {
    const execution = await runReorderedCleanupBoundary({
      planCase: REORDERED_PREVIEW_PLAN_CASES[2],
      boundaryKind: "RESERVATION",
      successPosition: 0,
      adapterOptions: { storageCleanupStatus: "VERSION_MISMATCH" },
    });
    const storageKey = execution.result.state.owned_resources.find(
      (resource) => resource.resource_type === "STORAGE_OBJECT",
    ).resource_key;
    assert.equal(execution.injected, true);
    assert.deepEqual(cleanupEventTypes(execution.fake), [
      "STORAGE_OBJECT",
      "DATABASE_ROW",
      "PREVIEW_DEPLOYMENT",
      "ENVIRONMENT_RECORD",
      "GIT_BRANCH",
    ]);
    assert.equal(new Set(cleanupEventTypes(execution.fake)).size, 5);
    assert.equal(execution.fake.present.size, 1);
    assert.equal(execution.fake.present.has(storageKey), true);
    assert.equal(
      [...execution.fake.present].some((resourceKey) =>
        resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
      ),
      false,
    );
    assert.equal(execution.result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(execution.result.state.outcome.code, "STORAGE_VERSION_MISMATCH");
    assert.equal(
      execution.result.state.effect_ledger.find(
        (entry) => entry.resource_key === storageKey,
      ).cleanup_status,
      "VERSION_MISMATCH_PRESERVED",
    );
    validateCheckpointProtocol(execution.result.state);
    validateCompactEvidence(execution.result.evidence);
  },
);

for (const finalCleanupMode of ["REJECT_FIRST", "THROW_FIRST"]) {
  await check(
    `reordered interior exact-not-committed cleanup returns honest ${finalCleanupMode} verifier failure`,
    async () => {
      const execution = await runReorderedCleanupBoundary({
        planCase: REORDERED_PREVIEW_PLAN_CASES[2],
        boundaryKind: "RESULT",
        successPosition: 2,
        adapterOptions: { finalCleanupMode },
      });
      assert.equal(execution.injected, true);
      assert.deepEqual(cleanupEventTypes(execution.fake), [
        "STORAGE_OBJECT",
        "DATABASE_ROW",
        "ENVIRONMENT_RECORD",
        "PREVIEW_DEPLOYMENT",
        "GIT_BRANCH",
      ]);
      assert.equal(new Set(cleanupEventTypes(execution.fake)).size, 5);
      assert.equal(execution.fake.present.size, 0);
      assert.equal(
        execution.fake.events.filter((event) => event === "cleanup:verify").length,
        1,
      );
      assert.equal(execution.result.state.lifecycle_state, "FAILED_RECOVERABLE");
      assert.equal(
        execution.result.state.outcome.code,
        "CLEANUP_VERIFICATION_FAILED",
      );
      assert.deepEqual(execution.result.state.cleanup, {
        required: true,
        verified: false,
      });
      assert.deepEqual(execution.result.state.recovery, {
        status: "PENDING",
        resume_to: "READY",
      });
      validateCheckpointProtocol(execution.result.state);
      validateCompactEvidence(execution.result.evidence);
    },
  );
}

await check(
  "reordered exact-not-committed cleanup remains total through later checkpoint outage",
  async () => {
    const execution = await runReorderedCleanupBoundary({
      planCase: REORDERED_PREVIEW_PLAN_CASES[2],
      boundaryKind: "RESULT",
      successPosition: 2,
      checkpointMode: "NOT_COMMITTED_THEN_OUTAGE",
    });
    assert.equal(execution.injected, true);
    assert.equal(execution.exactPredecessorRead, true);
    assert.deepEqual(cleanupEventTypes(execution.fake), [
      "STORAGE_OBJECT",
      "DATABASE_ROW",
      "ENVIRONMENT_RECORD",
      "PREVIEW_DEPLOYMENT",
      "GIT_BRANCH",
    ]);
    assert.equal(new Set(cleanupEventTypes(execution.fake)).size, 5);
    assert.equal(execution.fake.present.size, 0);
    assert.equal(
      execution.fake.events.filter((event) => event === "cleanup:verify").length,
      1,
    );
    assertQualificationFailureProjection(
      execution.result.state,
      "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
    );
    assert.deepEqual(execution.result.retained_resources, []);
    validateCompactEvidence(execution.result.evidence);
    assert.equal(JSON.stringify(execution.result).includes("Bearer"), false);
    assert.equal(JSON.stringify(execution.result).includes("vvvv"), false);
    assert.equal(JSON.stringify(execution.result).includes("wwww"), false);
  },
);

for (const checkpointFailure of [
  "THROW",
  "NOT_COMMITTED",
  "CAS_MISMATCH",
  "MALFORMED_RECEIPT",
]) {
  await check(
    `success cleanup ${checkpointFailure} known-not-committed reservation enters exact failure cleanup`,
    async () => {
      const fake = adapters();
      installFutureAuthority(fake);
      let injected = false;
      let readbacks = 0;
      const result = await runQualification(
        qualificationInput(fake, {
          async checkpoint(state, command) {
            const firstDeleteReservation =
              !injected &&
              command.operation === "CAS_CHECKPOINT" &&
              state.recovery_operation_state.qualification_operation_slots.some(
                (slot) =>
                  slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                  slot.status === "RESERVED",
              );
            if (!firstDeleteReservation) {
              return fake.commitCheckpoint(state, command);
            }
            injected = true;
            if (checkpointFailure === "THROW") {
              throw new Error("synthetic success cleanup reservation rejection");
            }
            if (checkpointFailure === "CAS_MISMATCH") {
              throw Object.assign(new Error("synthetic cleanup CAS mismatch"), {
                code: "CHECKPOINT_CAS_MISMATCH",
              });
            }
            if (checkpointFailure === "NOT_COMMITTED") {
              return { status: "CHECKPOINT_NOT_COMMITTED" };
            }
            return {
              ...exactCheckpointReceipt(command),
              unreviewed_field: "forbidden",
            };
          },
          async readCheckpointHead(request) {
            readbacks += 1;
            return fake.readCheckpointHead(request);
          },
        }),
      );
      assert.equal(injected, true, checkpointFailure);
      assert.ok(readbacks >= 1, checkpointFailure);
      const deleteEvents = fake.events.filter(
        (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
      );
      assert.equal(fake.present.size, 0, checkpointFailure);
      assert.equal(
        deleteEvents.length,
        resourcePlan().length,
        checkpointFailure,
      );
      assert.equal(new Set(deleteEvents).size, resourcePlan().length);
      assert.equal(
        fake.events.filter((event) => event === "cleanup:verify").length,
        1,
      );
      assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
      assert.equal(
        result.state.outcome.code,
        "OPERATION_RESERVATION_CHECKPOINT_FAILED",
      );
      assert.equal(result.state.cleanup.verified, true);
      assert.equal(result.state.recovery.status, "NOT_REQUIRED");
      assert.deepEqual(result.retained_resources, []);
      assert.equal(
        result.state.effect_ledger.some(
          (entry) => entry.cleanup_status === "RETAINED",
        ),
        false,
      );
      assert.deepEqual(result.state.budgets, {
        requests: { limit: 16, used: 4 },
        mutations: { limit: 15, used: 10 },
      });
      validateCompactEvidence(result.evidence);
      assert.equal(
        result.evidence.evidence_identity_sha256,
        result.state.final_evidence_identity_sha256,
      );
    },
  );
}

await check(
  "known-not-committed success-verifier reservation enters zero-verifier failure cleanup",
  async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    const verificationRequests = [];
    const verifyCleanup = fake.contract.finalCleanup.verify;
    fake.contract.finalCleanup.verify = async (request) => {
      verificationRequests.push(structuredClone(request));
      return verifyCleanup(request);
    };
    let injected = false;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const successVerifierReservation =
            !injected &&
            state.recovery_operation_state.qualification_operation_slots.some(
              (slot) =>
                slot.category === "requests" &&
                slot.index === 3 &&
                slot.operation === "QUALIFICATION_VERIFY_CLEANUP" &&
                slot.status === "RESERVED",
            );
          if (successVerifierReservation) {
            injected = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          return fake.commitCheckpoint(state, command);
        },
        readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      }),
    );
    assert.equal(injected, true);
    assert.equal(fake.present.size, 0);
    const deleteEvents = fake.events.filter(
      (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
    );
    assert.equal(deleteEvents.length, resourcePlan().length);
    assert.equal(new Set(deleteEvents).size, resourcePlan().length);
    assert.equal(verificationRequests.length, 1);
    assert.deepEqual(verificationRequests[0].retained_resource_keys, []);
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(
      result.state.outcome.code,
      "OPERATION_RESERVATION_CHECKPOINT_FAILED",
    );
    assert.equal(result.state.cleanup.verified, true);
    assert.deepEqual(result.retained_resources, []);
    validateCompactEvidence(result.evidence);
  },
);

await check(
  "known-not-committed first success-delete result checkpoints without adapter replay",
  async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    let injected = false;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const deleteResult =
            !injected &&
            state.recovery_operation_state.qualification_operation_slots.some(
              (slot) =>
                slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                slot.status === "RESULT_APPLIED",
            ) &&
            state.effect_ledger.some(
              (entry) =>
                entry.status === "CLEANED" &&
                entry.cleanup_status === "APPLIED",
            );
          if (deleteResult) {
            injected = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          return fake.commitCheckpoint(state, command);
        },
        readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      }),
    );
    assert.equal(injected, true);
    assert.equal(fake.present.size, 0);
    const deleteEvents = fake.events.filter(
      (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
    );
    assert.equal(deleteEvents.length, resourcePlan().length);
    assert.equal(new Set(deleteEvents).size, resourcePlan().length);
    assert.equal(
      fake.events.filter((event) => event === "cleanup:verify").length,
      1,
    );
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(result.state.outcome.code, "CLEANUP_CHECKPOINT_FAILED");
    assert.equal(result.state.cleanup.verified, true);
    assert.deepEqual(result.retained_resources, []);
    assert.deepEqual(result.state.budgets, {
      requests: { limit: 16, used: 4 },
      mutations: { limit: 15, used: 10 },
    });
    validateCompactEvidence(result.evidence);
  },
);

await check(
  "known-not-committed success-verifier result enters slot4 failure cleanup without replay",
  async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    const verificationRequests = [];
    const verifyCleanup = fake.contract.finalCleanup.verify;
    fake.contract.finalCleanup.verify = async (request) => {
      verificationRequests.push(structuredClone(request));
      return verifyCleanup(request);
    };
    let injected = false;
    let readbacks = 0;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const slots =
            state.recovery_operation_state.qualification_operation_slots;
          const successVerifier = slots.find(
            (slot) =>
              slot.category === "requests" &&
              slot.index === 3 &&
              slot.operation === "QUALIFICATION_VERIFY_CLEANUP",
          );
          const compensationVerifier = slots.find(
            (slot) =>
              slot.category === "requests" &&
              slot.index === 4 &&
              slot.operation === "QUALIFICATION_VERIFY_CLEANUP",
          );
          if (
            !injected &&
            successVerifier?.status === "RESULT_APPLIED" &&
            compensationVerifier?.status === "NOT_STARTED"
          ) {
            injected = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          return fake.commitCheckpoint(state, command);
        },
        async readCheckpointHead(request) {
          readbacks += 1;
          return fake.readCheckpointHead(request);
        },
      }),
    );
    assert.equal(injected, true);
    assert.ok(readbacks >= 1);
    assert.equal(fake.present.size, 0);
    assert.equal(verificationRequests.length, 2);
    assert.equal(verificationRequests[0].retained_resource_keys.length, 1);
    assert.equal(verificationRequests[1].retained_resource_keys.length, 0);
    assert.notEqual(
      verificationRequests[0].operation_slot.operation_slot_sha256,
      verificationRequests[1].operation_slot.operation_slot_sha256,
    );
    const deleteEvents = fake.events.filter(
      (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
    );
    assert.equal(deleteEvents.length, resourcePlan().length);
    assert.equal(new Set(deleteEvents).size, resourcePlan().length);
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(result.state.outcome.code, "CLEANUP_CHECKPOINT_FAILED");
    assert.equal(result.state.cleanup.verified, true);
    assert.deepEqual(result.state.recovery, { status: "NOT_REQUIRED" });
    assert.deepEqual(result.retained_resources, []);
    assert.equal(
      result.state.effect_ledger.some(
        (entry) => entry.cleanup_status === "RETAINED",
      ),
      false,
    );
    assert.deepEqual(result.state.budgets, {
      requests: { limit: 16, used: 5 },
      mutations: { limit: 15, used: 10 },
    });
    validateCompactEvidence(result.evidence);
    assert.equal(
      result.evidence.evidence_identity_sha256,
      result.state.final_evidence_identity_sha256,
    );
  },
);

await check(
  "known-not-committed success cleanup continues through persistent later checkpoint outage",
  async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    let injected = false;
    let exactPredecessorRead = false;
    let outage = false;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const firstDeleteReservation =
            !injected &&
            command.operation === "CAS_CHECKPOINT" &&
            state.recovery_operation_state.qualification_operation_slots.some(
              (slot) =>
                slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                slot.status === "RESERVED",
            );
          if (firstDeleteReservation) {
            injected = true;
            outage = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          if (outage) throw new Error(`Bearer ${"s".repeat(24)}`);
          return fake.commitCheckpoint(state, command);
        },
        async readCheckpointHead(request) {
          if (injected && !exactPredecessorRead) {
            exactPredecessorRead = true;
            return fake.readCheckpointHead(request);
          }
          throw new Error(`Bearer ${"t".repeat(24)}`);
        },
      }),
    );
    assert.equal(injected, true);
    assert.equal(exactPredecessorRead, true);
    assert.equal(fake.present.size, 0);
    const deleteEvents = fake.events.filter(
      (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
    );
    assert.equal(deleteEvents.length, resourcePlan().length);
    assert.equal(new Set(deleteEvents).size, resourcePlan().length);
    assert.equal(
      fake.events.filter((event) => event === "cleanup:verify").length,
      1,
    );
    assertQualificationFailureProjection(
      result.state,
      "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
    );
    assert.deepEqual(result.retained_resources, []);
    validateCompactEvidence(result.evidence);
    assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(
      result.evidence.outcome.code,
      "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
    );
    assert.equal(
      result.evidence.effect_ledger.some(
        (entry) => entry.cleanup_status === "RETAINED",
      ),
      false,
    );
    assert.equal(JSON.stringify(result.evidence).includes("Bearer"), false);
    assert.equal(JSON.stringify(result.evidence).includes("ssss"), false);
    assert.equal(JSON.stringify(result.evidence).includes("tttt"), false);
  },
);

await check(
  "known-not-committed transition continues exact cleanup after one adapter failure",
  async () => {
    const fake = adapters({ failCleanupType: "GIT_BRANCH" });
    installFutureAuthority(fake);
    let injected = false;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const firstDeleteReservation =
            !injected &&
            command.operation === "CAS_CHECKPOINT" &&
            state.recovery_operation_state.qualification_operation_slots.some(
              (slot) =>
                slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                slot.status === "RESERVED",
            );
          if (firstDeleteReservation) {
            injected = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          return fake.commitCheckpoint(state, command);
        },
        readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      }),
    );
    assert.equal(injected, true);
    const deleteEvents = fake.events.filter(
      (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
    );
    assert.equal(deleteEvents.length, resourcePlan().length);
    assert.equal(new Set(deleteEvents).size, resourcePlan().length);
    assert.equal(
      [...fake.present].filter((resourceKey) =>
        resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
      ).length,
      0,
    );
    assert.equal(fake.present.size, 1);
    assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.state.outcome.code, "CLEANUP_FAILED");
    assert.equal(result.state.cleanup.verified, false);
    assert.deepEqual(result.state.recovery, {
      status: "PENDING",
      resume_to: "READY",
    });
    assert.deepEqual(result.retained_resources, []);
    assert.equal(
      result.state.effect_ledger.some(
        (entry) => entry.cleanup_status === "RETAINED",
      ),
      false,
    );
    validateCompactEvidence(result.evidence);
  },
);

await check(
  "known-not-committed transition preserves exact Storage version mismatch while cleaning Preview",
  async () => {
    const fake = adapters({ storageCleanupStatus: "VERSION_MISMATCH" });
    installFutureAuthority(fake);
    let injected = false;
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const firstDeleteReservation =
            !injected &&
            command.operation === "CAS_CHECKPOINT" &&
            state.recovery_operation_state.qualification_operation_slots.some(
              (slot) =>
                slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                slot.status === "RESERVED",
            );
          if (firstDeleteReservation) {
            injected = true;
            return { status: "CHECKPOINT_NOT_COMMITTED" };
          }
          return fake.commitCheckpoint(state, command);
        },
        readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      }),
    );
    assert.equal(injected, true);
    const storage = result.state.owned_resources.find(
      (resource) => resource.resource_type === "STORAGE_OBJECT",
    );
    assert.ok(storage);
    assert.equal(fake.present.has(storage.resource_key), true);
    assert.equal(
      [...fake.present].filter((resourceKey) =>
        resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
      ).length,
      0,
    );
    assert.equal(fake.present.size, 1);
    assert.equal(
      fake.events.filter(
        (event) => event === `cleanup:STORAGE_OBJECT:${storage.resource_key}`,
      ).length,
      1,
    );
    assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.state.outcome.code, "STORAGE_VERSION_MISMATCH");
    assert.equal(result.state.cleanup.verified, false);
    assert.deepEqual(result.state.recovery, {
      status: "PENDING",
      resume_to: "READY",
    });
    assert.equal(
      result.state.effect_ledger.find(
        (entry) => entry.resource_key === storage.resource_key,
      ).cleanup_status,
      "VERSION_MISMATCH_PRESERVED",
    );
    assert.equal(
      result.state.effect_ledger.some(
        (entry) => entry.cleanup_status === "RETAINED",
      ),
      false,
    );
    assert.deepEqual(result.retained_resources, []);
    validateCompactEvidence(result.evidence);
  },
);

for (const finalCleanupMode of ["REJECT_FIRST", "THROW_FIRST"]) {
  await check(
    `known-not-committed transition returns recovery-needed after ${finalCleanupMode} zero verifier`,
    async () => {
      const fake = adapters({ finalCleanupMode });
      installFutureAuthority(fake);
      let injected = false;
      const result = await runQualification(
        qualificationInput(fake, {
          async checkpoint(state, command) {
            const firstDeleteReservation =
              !injected &&
              command.operation === "CAS_CHECKPOINT" &&
              state.recovery_operation_state.qualification_operation_slots.some(
                (slot) =>
                  slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                  slot.status === "RESERVED",
              );
            if (firstDeleteReservation) {
              injected = true;
              return { status: "CHECKPOINT_NOT_COMMITTED" };
            }
            return fake.commitCheckpoint(state, command);
          },
          readCheckpointHead: async (request) =>
            fake.readCheckpointHead(request),
        }),
      );
      assert.equal(injected, true);
      assert.equal(fake.present.size, 0);
      const deleteEvents = fake.events.filter(
        (event) => event.startsWith("cleanup:") && event !== "cleanup:verify",
      );
      assert.equal(deleteEvents.length, resourcePlan().length);
      assert.equal(new Set(deleteEvents).size, resourcePlan().length);
      assert.equal(
        fake.events.filter((event) => event === "cleanup:verify").length,
        1,
      );
      assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
      assert.equal(result.state.outcome.code, "CLEANUP_VERIFICATION_FAILED");
      assert.equal(result.state.cleanup.verified, false);
      assert.deepEqual(result.state.recovery, {
        status: "PENDING",
        resume_to: "READY",
      });
      assert.deepEqual(result.retained_resources, []);
      assert.equal(
        result.state.effect_ledger.some(
          (entry) => entry.cleanup_status === "RETAINED",
        ),
        false,
      );
      validateCompactEvidence(result.evidence);
    },
  );
}

const malformedRetainedVerificationReceipts = {
  "count-only receipt": (receipt) => {
    const { verified_present_resources: ignored, ...countOnly } = receipt;
    return countOnly;
  },
  "substituted retained key": (receipt) => ({
    ...receipt,
    verified_present_resources: receipt.verified_present_resources.map((resource) => ({
      ...resource,
      resource_key: `${resource.resource_key}:substituted`,
    })),
  }),
  "missing retained key": (receipt) => ({
    ...receipt,
    verified_present_resources: [],
  }),
  "duplicate retained key": (receipt) => ({
    ...receipt,
    verified_present_resources: [
      ...receipt.verified_present_resources,
      ...receipt.verified_present_resources,
    ],
  }),
  "wrong retained locator digest": (receipt) => ({
    ...receipt,
    verified_present_resources: receipt.verified_present_resources.map((resource) => ({
      ...resource,
      locator_sha256: "d".repeat(64),
    })),
  }),
  "unreviewed extra field": (receipt) => ({
    ...receipt,
    unreviewed: true,
  }),
};

for (const [name, mutateReceipt] of Object.entries(
  malformedRetainedVerificationReceipts,
)) {
  await check(`retained physical-verification receipt rejects ${name}`, async () => {
    const fake = adapters();
    const verify = fake.contract.finalCleanup.verify;
    fake.contract.finalCleanup.verify = async (request) => {
      const receipt = await verify(request);
      return request.retained_resource_keys.length === 1
        ? mutateReceipt(receipt)
        : receipt;
    };
    const result = await runQualification(qualificationInput(fake));
    assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.state.outcome.code, "CLEANUP_VERIFICATION_FAILED");
    assert.equal(result.state.cleanup.verified, false);
    assert.deepEqual(result.state.recovery, {
      status: "PENDING",
      resume_to: "READY",
    });
    assert.deepEqual(result.retained_resources, []);
    assert.equal(fake.present.size, 0);
    assert.equal(
      result.state.effect_ledger.some(
        (entry) => entry.cleanup_status === "RETAINED",
      ),
      false,
    );
  });
}

await check("terminal checkpoint crash leaves an interrupted journal recoverable", async () => {
  const fake = adapters();
  let durable;
  let failedFinalizationCheckpoints = 0;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (["QUALIFIED", "FAILED_RECOVERABLE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
          if (["FAILED_RECOVERABLE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
            failedFinalizationCheckpoints += 1;
          }
          throw new Error("synthetic terminal checkpoint crash");
        }
        const receipt = await fake.commitCheckpoint(state, command);
        durable = structuredClone(state);
        return receipt;
      },
    }),
  );
  assertQualificationFailureProjection(
    result.state,
    "TERMINAL_CHECKPOINT_FAILED",
  );
  assert.equal(failedFinalizationCheckpoints, 2);
  validateCompactEvidence(result.evidence);
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.evidence.outcome.code, "TERMINAL_CHECKPOINT_FAILED");
  assert.equal(durable.lifecycle_state, "QUALIFYING");
  assert.equal(durable.recovery.status, "INTERRUPTED");
  validateCheckpointProtocol(durable);

  const recoveryCheckpoints = [];
  const recovered = await recoverQualification({
    loadAuthoritativeState: async () => durable,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        return futureRecoveryAuthorityResponse(request, durable);
      },
    },
    checkpointRecoveryState: async (state, command) => {
      recoveryCheckpoints.push(structuredClone(state));
      return fake.commitCheckpoint(state, command);
    },
    readCheckpointHead: async (request) => fake.readCheckpointHead(request),
    inspectOwnedResource: async (resource, context) => ({
      status: fake.present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
      ...(resource.resource_type === "STORAGE_OBJECT" &&
      fake.present.has(resource.resource_key)
        ? { observed_version: "version-1" }
        : {}),
      operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
      ...(context?.operation_binding_sha256
        ? { operation_binding_sha256: context.operation_binding_sha256 }
        : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
    }),
    reconcileOwnedResource: async (resource, cas, context) => {
      fake.present.delete(resource.resource_key);
      return resource.resource_type === "STORAGE_OBJECT"
        ? {
            status: "DELETED_EXACT",
            expected_version: cas.expected_version,
            operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
            ...(context?.operation_binding_sha256
              ? { operation_binding_sha256: context.operation_binding_sha256 }
              : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
          }
        : {
            status: "DELETED_EXACT",
            operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
            ...(context?.operation_binding_sha256
              ? { operation_binding_sha256: context.operation_binding_sha256 }
              : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
          };
    },
  });
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
  assert.equal(recoveryCheckpoints.at(-1).lifecycle_state, "READY");
  assert.equal(recoveryCheckpoints.at(-1).recovery.status, "COMPLETE");
  assert.equal(fake.present.size, 0);
});

await check("failed terminal QUALIFIED checkpoint cleans Preview before recovery", async () => {
  const fake = adapters();
  let durable;
  let terminalQualifiedAttempts = 0;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (state.lifecycle_state === "QUALIFIED") {
          terminalQualifiedAttempts += 1;
          throw new Error(`Bearer ${"s".repeat(24)}`);
        }
        const receipt = await fake.commitCheckpoint(state, command);
        durable = structuredClone(state);
        return receipt;
      },
    }),
  );
  assert.equal(terminalQualifiedAttempts, 1);
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "TERMINAL_CHECKPOINT_FAILED");
  assert.deepEqual(result.retained_resources, []);
  assert.equal(
    [...fake.present].filter((resourceKey) =>
      resourceKey.includes(":PREVIEW_DEPLOYMENT:"),
    ).length,
    0,
  );
  assert.equal(
    durable.effect_ledger.some((entry) => entry.cleanup_status === "RETAINED"),
    false,
  );
  assert.equal(
    result.state.effect_ledger.some((entry) => entry.cleanup_status === "RETAINED"),
    false,
  );
  assert.equal(durable.lifecycle_state, "FAILED_CLOSED");
  assert.equal(durable.recovery.status, "NOT_REQUIRED");
  assert.equal(
    durable.checkpoint.checkpoint_identity_sha256,
    result.state.checkpoint.checkpoint_identity_sha256,
  );
  assert.equal(result.evidence.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.evidence.candidate_identity_sha256, CANDIDATE);
  assert.equal(result.evidence.run_id, RUN_ID);
  assert.equal(result.evidence.phase, "34JA-34JZ");
  assert.equal(result.evidence.operation_class, ACTIVATION_OPERATION_CLASS);
  assert.equal(result.evidence.review_approval_sha256, ACTIVATION_REVIEW_SHA256);
  assert.match(result.evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(
    durable.final_evidence_identity_sha256,
    result.evidence.evidence_identity_sha256,
  );
  assert.equal(
    result.state.final_evidence_identity_sha256,
    result.evidence.evidence_identity_sha256,
  );
  assert.equal(JSON.stringify(result.evidence).includes("Bearer"), false);
  assert.equal(JSON.stringify(result.evidence).includes("ssss"), false);
});

await check("persistent checkpoint outage completes exact cleanup and finalization", async () => {
  const fake = adapters();
  const failedCheckpoints = [];
  let outage = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const latest = state.effect_ledger.at(-1);
        const latestResource = state.owned_resources.find(
          (resource) => resource.resource_key === latest?.resource_key,
        );
        if (
          latestResource?.resource_type === "PREVIEW_DEPLOYMENT" &&
          latest.status === "INTENT_ONLY"
        ) {
          outage = true;
        }
        if (outage) {
          failedCheckpoints.push(structuredClone(state));
          throw new Error(`Bearer ${"s".repeat(24)}`);
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  const previewCheckpointFailures = failedCheckpoints.filter((state) => {
    const latest = state.effect_ledger.at(-1);
    const latestResource = state.owned_resources.find(
      (resource) => resource.resource_key === latest?.resource_key,
    );
    return latestResource?.resource_type === "PREVIEW_DEPLOYMENT";
  });
  assert.ok(
    previewCheckpointFailures.some(
      (state) =>
        state.effect_ledger.at(-1).status === "INTENT_ONLY" &&
        state.effect_ledger.at(-1).cleanup_status === "PENDING",
    ),
  );
  assert.ok(
    previewCheckpointFailures.some(
      (state) =>
        state.effect_ledger.at(-1).status === "CLEANED" &&
        state.effect_ledger.at(-1).cleanup_status === "NOT_REQUIRED",
    ),
  );
  assert.equal(
    fake.events.filter((event) => event.startsWith("create:GIT_BRANCH:")).length,
    1,
  );
  assert.equal(
    fake.events.filter((event) => event.startsWith("create:PREVIEW_DEPLOYMENT:")).length,
    0,
  );
  assert.equal(
    fake.events.filter((event) => event.startsWith("cleanup:GIT_BRANCH:")).length,
    1,
  );
  assert.ok(fake.events.includes("cleanup:verify"));
  assert.equal(fake.present.size, 0);
  assert.ok(
    failedCheckpoints.some(
      (state) =>
        state.lifecycle_state === "QUALIFYING" &&
        state.outcome.code === "TERMINAL_CHECKPOINT_PENDING",
    ),
  );
  assertQualificationFailureProjection(
    result.state,
    "CLEANUP_CHECKPOINT_FAILED",
  );
  assert.deepEqual(result.retained_resources, []);
  validateCompactEvidence(result.evidence);
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.evidence.outcome.code, "CLEANUP_CHECKPOINT_FAILED");
  assert.equal(result.evidence.candidate_identity_sha256, CANDIDATE);
  assert.equal(result.evidence.run_id, RUN_ID);
  assert.equal(result.evidence.phase, "34JA-34JZ");
  assert.equal(result.evidence.operation_class, ACTIVATION_OPERATION_CLASS);
  assert.equal(result.evidence.review_approval_sha256, ACTIVATION_REVIEW_SHA256);
  assert.match(result.evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(JSON.stringify(result.evidence).includes("Bearer"), false);
  assert.equal(JSON.stringify(result.evidence).includes("ssss"), false);
});

await check("failure cleanup survives unknown checkpoint state without broadening ownership", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const plan = resourcePlan();
  const reorderedPlan = [plan[0], plan[1], plan[4], plan[2], plan[3]];
  const cleanupSlots = [];
  const storageContracts = [];
  let finalVerificationCalls = 0;
  for (const adapter of [fake.contract.branch, fake.contract.preview]) {
    const cleanup = adapter.cleanup;
    adapter.cleanup = async (resource, context) => {
      cleanupSlots.push(context.operation_slot.operation_slot_sha256);
      return cleanup(resource, context);
    };
  }
  const cleanupStorage = fake.contract.storage.cleanupExactVersion;
  fake.contract.storage.cleanupExactVersion = async (resource, contract, context) => {
    cleanupSlots.push(context.operation_slot.operation_slot_sha256);
    storageContracts.push(structuredClone(contract));
    return cleanupStorage(resource, contract, context);
  };
  const verifyCleanup = fake.contract.finalCleanup.verify;
  fake.contract.finalCleanup.verify = async (request) => {
    finalVerificationCalls += 1;
    cleanupSlots.push(request.operation_slot.operation_slot_sha256);
    return verifyCleanup(request);
  };
  let outage = false;
  const result = await runQualification(
    qualificationInput(fake, {
      resource_plan: reorderedPlan,
      async checkpoint(state, command) {
        const latest = state.effect_ledger.at(-1);
        const latestResource = state.owned_resources.find(
          (resource) => resource.resource_key === latest?.resource_key,
        );
        if (
          latestResource?.resource_type === "ENVIRONMENT_RECORD" &&
          latest.status === "INTENT_ONLY" &&
          latest.cleanup_status === "PENDING"
        ) {
          outage = true;
        }
        if (outage) throw new Error(`Bearer ${"s".repeat(24)}`);
        return fake.commitCheckpoint(state, command);
      },
      async readCheckpointHead(request) {
        if (outage) throw new Error(`Bearer ${"r".repeat(24)}`);
        return fake.readCheckpointHead(request);
      },
    }),
  );
  const resources = Object.fromEntries(
    reorderedPlan.map((descriptor) => [
      descriptor.resource_type,
      result.evidence.owned_resources.find(
        (resource) => resource.resource_type === descriptor.resource_type,
      ),
    ]),
  );
  for (const type of ["GIT_BRANCH", "PREVIEW_DEPLOYMENT", "STORAGE_OBJECT"]) {
    const key = resources[type].resource_key;
    assert.equal(
      fake.events.filter((event) => event === `cleanup:${type}:${key}`).length,
      1,
      type,
    );
  }
  assert.equal(
    fake.events.filter((event) => event.startsWith("cleanup:ENVIRONMENT_RECORD:")).length,
    0,
  );
  assert.equal(
    fake.events.filter((event) => event.startsWith("cleanup:DATABASE_ROW:")).length,
    0,
  );
  const cleanupOrder = ["STORAGE_OBJECT", "PREVIEW_DEPLOYMENT", "GIT_BRANCH"].map(
    (type) => fake.events.indexOf(`cleanup:${type}:${resources[type].resource_key}`),
  );
  assert.ok(
    cleanupOrder[0] < cleanupOrder[1] && cleanupOrder[1] < cleanupOrder[2],
    cleanupOrder.join(","),
  );
  assert.equal(finalVerificationCalls, 1);
  assert.equal(fake.present.size, 0);
  assert.deepEqual(storageContracts, [{
    expected_version: "version-1",
    delete_capability_sha256: "c".repeat(64),
  }]);
  assert.equal(new Set(cleanupSlots).size, 4);
  assertQualificationFailureProjection(
    result.state,
    "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
  );
  assert.deepEqual(result.retained_resources, []);
  validateCompactEvidence(result.evidence);
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(
    result.evidence.outcome.code,
    "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
  );
  assert.equal(JSON.stringify(result).includes("Bearer"), false);
  assert.equal(JSON.stringify(result).includes("ssss"), false);
  assert.equal(JSON.stringify(result).includes("rrrr"), false);
});

for (const failureBoundary of ["TERMINAL_PREDECESSOR_PROVEN", "EVIDENCE_FAILURE"]) {
  await check(`${failureBoundary} preserves cleanup checkpoint unknown categorically`, async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    let cleanupOutage = false;
    let terminalReadResolved = false;
    if (failureBoundary === "EVIDENCE_FAILURE") {
      fake.contract.evidence = {
        async build() {
          cleanupOutage = true;
          throw new Error(`Bearer ${"e".repeat(24)}`);
        },
      };
    }
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          if (
            failureBoundary === "TERMINAL_PREDECESSOR_PROVEN" &&
            state.lifecycle_state === "QUALIFIED"
          ) {
            throw new Error("synthetic terminal write rejection");
          }
          if (cleanupOutage) throw new Error(`Bearer ${"s".repeat(24)}`);
          return fake.commitCheckpoint(state, command);
        },
        async readCheckpointHead(request) {
          if (
            failureBoundary === "TERMINAL_PREDECESSOR_PROVEN" &&
            !terminalReadResolved &&
            request.expected_checkpoint_sequence !== undefined
          ) {
            terminalReadResolved = true;
            const head = await fake.readCheckpointHead(request);
            cleanupOutage = true;
            return head;
          }
          if (cleanupOutage) throw new Error(`Bearer ${"r".repeat(24)}`);
          return fake.readCheckpointHead(request);
        },
      }),
    );
    if (failureBoundary === "TERMINAL_PREDECESSOR_PROVEN") {
      assert.equal(terminalReadResolved, true);
    }
    assertQualificationFailureProjection(
      result.state,
      "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
    );
    assert.equal(result.evidence.outcome.code, "CLEANUP_CHECKPOINT_STATE_UNKNOWN");
    assert.equal(
      [...fake.present].some((key) => key.includes(":PREVIEW_DEPLOYMENT:")),
      false,
    );
    assert.equal(
      fake.events.filter((event) => event.startsWith("cleanup:PREVIEW_DEPLOYMENT:"))
        .length,
      1,
    );
    assert.equal(JSON.stringify(result).includes("Bearer"), false);
    assert.equal(JSON.stringify(result).includes("eeee"), false);
    assert.equal(JSON.stringify(result).includes("ssss"), false);
    assert.equal(JSON.stringify(result).includes("rrrr"), false);
  });
}

await check("recovery authenticates historical journal authority before inspection", async () => {
  const fake = adapters({ failCleanupType: "GIT_BRANCH" });
  const failed = await runQualification(qualificationInput(fake));
  let inspections = 0;
  let historicalHead = structuredClone(failed.state);
  const driftedCurrentCandidate = "e".repeat(64);
  assert.notEqual(driftedCurrentCandidate, failed.state.candidate_identity_sha256);
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(historicalHead),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        return futureRecoveryAuthorityResponse(request, failed.state);
      },
    },
    checkpointRecoveryState: async (state, command) => {
      historicalHead = structuredClone(state);
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => exactCheckpointHead(historicalHead),
    inspectOwnedResource: async (resource, context) => {
      inspections += 1;
      return {
        status: fake.present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        ...(context?.operation_binding_sha256
          ? { operation_binding_sha256: context.operation_binding_sha256 }
          : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
      };
    },
    reconcileOwnedResource: async (resource, cas, context) => ({
      status: "DELETED_EXACT",
      operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
      ...(context?.operation_binding_sha256
        ? { operation_binding_sha256: context.operation_binding_sha256 }
        : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
    }),
  });
  assert.ok(inspections > 0);
  assert.notEqual(result.outcome.code, "CURRENT_CANDIDATE_MISMATCH");

  inspections = 0;
  const rejected = await recoverQualification({
    loadAuthoritativeState: async () => failed.state,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        return futureRecoveryAuthorityResponse(request, {
          ...failed.state,
          run_id: "different-run-0001",
        });
      },
    },
    checkpointRecoveryState: async (state, command) =>
      exactCheckpointReceipt(command),
    readCheckpointHead: async () => exactCheckpointHead(failed.state),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assertRecoveryFailureProjection(rejected, "RECOVERY_AUTHORITY_MISMATCH");
  assert.equal(inspections, 0);
});

await check("cleanup intent and result bracket every cleanup mutation", async () => {
  const fake = adapters();
  fake.contract.staging.verifyReadOnly = async () => {
    fake.events.push("staging:forced-failure");
    throw new Error("force failure cleanup");
  };
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  for (const resource of result.state.owned_resources) {
    const cleanupCall = fake.events.indexOf(
      `cleanup:${resource.resource_type}:${resource.resource_key}`,
    );
    const intent = fake.events.indexOf(
      `ledger:${resource.resource_key}:create=APPLIED:cleanup=INTENT_ONLY`,
    );
    const applied = fake.events.indexOf(
      `ledger:${resource.resource_key}:create=CLEANED:cleanup=APPLIED`,
    );
    assert.ok(intent >= 0 && intent < cleanupCall, `intent:${resource.resource_key}`);
    assert.ok(applied > cleanupCall, `result:${resource.resource_key}`);
  }
  assert.ok(
    result.state.effect_ledger.every(
      (entry) => entry.status === "CLEANED" && entry.cleanup_status === "VERIFIED",
    ),
  );
});

await check("cleanup crash checkpoints UNCERTAIN immediately", async () => {
  const fake = adapters({ failCleanupType: "GIT_BRANCH" });
  fake.contract.staging.verifyReadOnly = async () => {
    throw new Error("force failure cleanup");
  };
  const result = await runQualification(qualificationInput(fake));
  const branch = result.state.owned_resources.find(
    (resource) => resource.resource_type === "GIT_BRANCH",
  );
  const entry = result.state.effect_ledger.find(
    (candidate) => candidate.resource_key === branch.resource_key,
  );
  const cleanupCall = fake.events.indexOf(
    `cleanup:GIT_BRANCH:${branch.resource_key}`,
  );
  const uncertain = fake.events.indexOf(
    `ledger:${branch.resource_key}:create=APPLIED:cleanup=UNCERTAIN`,
  );
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(entry.cleanup_status, "UNCERTAIN");
  assert.ok(uncertain > cleanupCall);
});

await check("ambiguous plan and retained Preview overreach fail pre-effect", async () => {
  for (const plan of [
    [...resourcePlan(), structuredClone(resourcePlan()[0])],
    [
      ...resourcePlan(),
      {
        resource_type: "PREVIEW_DEPLOYMENT",
        locator: { project_id: "project-1", deployment_id: "preview-2" },
        cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
      },
    ],
  ]) {
    const fake = adapters();
    const result = await runQualification(
      qualificationInput(fake, { resource_plan: plan }),
    );
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(
      fake.events.some((event) => event.startsWith("fresh:") || event.startsWith("create:")),
      false,
    );
  }
});

await check("adapter secrets never enter evidence", async () => {
  const fake = adapters({ failCreateType: "PREVIEW_DEPLOYMENT" });
  fake.contract.preview.create = async () => {
    throw new Error(`Bearer ${"s".repeat(24)}`);
  };
  const result = await runQualification(qualificationInput(fake));
  assert.equal(JSON.stringify(result.evidence).includes("Bearer"), false);
  assert.equal(JSON.stringify(result.evidence).includes("ssss"), false);
});

function futureAuthorityResponse(request, overrides = {}) {
  const envelope = request?.authority_envelope;
  return {
    status: "VERIFIED_AUTHORITY_ENVELOPE",
    candidate_identity_sha256: CANDIDATE,
    run_id: envelope?.run_id,
    phase: envelope?.phase,
    operation_class: envelope?.operation_class,
    approval_digest_sha256: envelope?.review_approval_sha256,
    freeze_document_sha256: envelope?.freeze_document_sha256,
    current_retained_state_attestation_sha256:
      envelope?.current_retained_state_attestation_sha256,
    resource_plan_sha256: envelope?.resource_plan_sha256,
    authority_envelope_sha256: request?.authority_envelope_sha256,
    operation_slot_sha256: request?.operation_slot?.operation_slot_sha256,
    ...qualificationReceiptContext(request),
    ...overrides,
  };
}

function futureNamespaceResponse(request, presentIndex = -1) {
  return {
    status: "FRESH",
    authority_envelope_sha256: request?.authority_envelope_sha256,
    resource_plan_sha256: request?.resource_plan_sha256,
    operation_slot_sha256: request?.operation_slot?.operation_slot_sha256,
    ...qualificationReceiptContext(request),
    proofs: (request?.resource_plan ?? []).map((resource, index) => ({
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      status: index === presentIndex ? "PRESENT" : "ABSENT",
    })),
  };
}

function futureRecoveryAuthorityResponse(request, reviewedState) {
  const recoveryBinding = request?.recovery_anchor
    ? {
        operation_binding_sha256: request.operation_binding_sha256,
        recovery_anchor_checkpoint_identity_sha256:
          request.recovery_anchor.checkpoint_identity_sha256,
        recovery_anchor_checkpoint_sequence:
          request.recovery_anchor.checkpoint_sequence,
        recovery_anchor_predecessor_identity_sha256:
          request.recovery_anchor.predecessor_checkpoint_identity_sha256,
      }
    : reviewedState.checkpoint
      ? {
          checkpoint_identity_sha256:
            reviewedState.checkpoint.checkpoint_identity_sha256,
          checkpoint_sequence: reviewedState.checkpoint.sequence,
          checkpoint_predecessor_identity_sha256:
            reviewedState.checkpoint.predecessor_checkpoint_identity_sha256,
        }
      : {};
  return {
    status: "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
    candidate_identity_sha256: reviewedState.candidate_identity_sha256,
    run_id: reviewedState.run_id,
    phase: reviewedState.phase,
    operation_class: reviewedState.operation_class,
    approval_digest_sha256: reviewedState.review_approval_sha256,
    freeze_document_sha256: reviewedState.freeze_document_sha256,
    retained_state_sha256: reviewedState.retained_state_sha256,
    authority_envelope_sha256: reviewedState.authority_envelope_sha256,
    resource_plan_sha256: reviewedState.resource_plan_sha256,
    journal_identity_sha256: reviewedState.journal_identity_sha256,
    operation_reservation_identity_sha256:
      reviewedState.operation_reservation?.identity_sha256,
    operation_slot_sha256: request?.operation_slot?.operation_slot_sha256,
    ...recoveryBinding,
  };
}

function installFutureAuthority(fake, { presentIndex = -1, authorityOverrides = {} } = {}) {
  fake.contract.authority.verifyAuthorityEnvelope = async (request) => {
    fake.events.push("authority:envelope");
    return futureAuthorityResponse(request, authorityOverrides);
  };
  fake.contract.namespace.verifyFresh = async (request) => {
    fake.events.push("namespace:plan");
    return futureNamespaceResponse(request, presentIndex);
  };
}

async function exactGrantedRecoveryTerminalFixture() {
  const fake = adapters();
  installFutureAuthority(fake);
  await runQualification(qualificationInput(fake));
  const prefix = fake.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "APPLIED",
  );
  assert.ok(prefix);
  const journal = prefix.journal_identity_sha256;
  fake.checkpointHeads.set(journal, prefix.checkpoint.checkpoint_identity_sha256);
  fake.checkpointStates.set(journal, structuredClone(prefix));
  fake.present.clear();
  fake.present.add(prefix.owned_resources[0].resource_key);
  const receiptBinding = (context) => ({
    operation_slot_sha256: context.operation_slot.operation_slot_sha256,
    operation_binding_sha256: context.operation_binding_sha256,
  });
  const terminal = await recoverQualification({
    loadAuthoritativeState: async () =>
      structuredClone(fake.checkpointStates.get(journal)),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, prefix),
    },
    checkpointRecoveryState: async (state, command) =>
      fake.commitCheckpoint(state, command),
    readCheckpointHead: async (request) => fake.readCheckpointHead(request),
    inspectOwnedResource: async (resource, context) => ({
      status: fake.present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
      ...(fake.present.has(resource.resource_key)
        ? {
            creation_operation_slot_sha256:
              prefix.effect_ledger.find(
                (entry) => entry.resource_key === resource.resource_key,
              ).creation_operation_slot_sha256,
          }
        : {}),
      ...receiptBinding(context),
    }),
    reconcileOwnedResource: async (resource, _contract, context) => {
      fake.present.delete(resource.resource_key);
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        ...receiptBinding(context),
      };
    },
  });
  assert.equal(terminal.lifecycle_state, "READY");
  assert.equal(terminal.recovery.status, "COMPLETE");
  return structuredClone(terminal);
}

function rewriteDurableRecoveryAuthorityReceipt(state, rewrite) {
  const authoritySlot = state.recovery_operation_state.operation_slots.find(
    (slot) =>
      slot.category === "requests" &&
      slot.index === 5 &&
      slot.operation === "VERIFY_RECOVERY_AUTHORITY" &&
      slot.resource_key === null,
  );
  assert.ok(authoritySlot);
  authoritySlot.receipt = rewrite(structuredClone(authoritySlot.receipt));
  authoritySlot.receipt_sha256 = sha256Hex(canonicalJson(authoritySlot.receipt));
  state.recovery_operation_state.recovery_grant.authority_receipt_sha256 =
    authoritySlot.receipt_sha256;
}

function resetRecoveryOperationSlot(slot) {
  slot.operation_binding_sha256 = null;
  slot.status = "NOT_STARTED";
  slot.receipt = null;
  slot.receipt_sha256 = null;
}

function rewriteRecoveryOperationReceipt(state, operation, rewrite) {
  const slot = state.recovery_operation_state.operation_slots.find(
    (candidate) => candidate.operation === operation,
  );
  assert.ok(slot);
  slot.receipt = rewrite(structuredClone(slot.receipt));
  slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
}

function qualificationOperationSlot(
  state,
  category,
  index,
  operation,
  resourceKey = null,
) {
  return state.recovery_operation_state.qualification_operation_slots?.find(
    (slot) =>
      slot.category === category &&
      slot.index === index &&
      slot.operation === operation &&
      slot.resource_key === resourceKey,
  );
}

function qualificationOperationSlotSha256(
  state,
  category,
  index,
  operation,
  resourceKey = null,
) {
  return deriveOperationSlot({
    operation_reservation: state.operation_reservation,
    category,
    index,
    operation,
    resource_key: resourceKey,
  }).operation_slot_sha256;
}

function removeQualificationUsage(
  state,
  category,
  index,
  operation,
  resourceKey = null,
) {
  const identity = qualificationOperationSlotSha256(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  const usage = state.recovery_operation_state.qualification_slot_usage[category];
  assert.ok(usage.includes(identity));
  state.recovery_operation_state.qualification_slot_usage[category] =
    usage.filter((candidate) => candidate !== identity);
  state.budgets[category].used -= 1;
  const slot = qualificationOperationSlot(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  assert.ok(slot);
  slot.reservation_ordinal = null;
  slot.predecessor_reservation_proof_sha256 = null;
  slot.reservation_proof_sha256 = null;
  slot.status = "NOT_STARTED";
  slot.receipt = null;
  slot.receipt_sha256 = null;
  return slot;
}

function addQualificationUsage(
  state,
  category,
  index,
  operation,
  resourceKey = null,
) {
  const identity = qualificationOperationSlotSha256(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  const usage = state.recovery_operation_state.qualification_slot_usage[category];
  assert.equal(usage.includes(identity), false);
  usage.push(identity);
  state.budgets[category].used += 1;
  const slot = qualificationOperationSlot(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  assert.ok(slot);
  return slot;
}

function applyMutantQualificationReceipt(slot, receipt) {
  slot.status = "RESULT_APPLIED";
  slot.receipt = structuredClone(receipt);
  slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
  return slot;
}

function rewriteQualificationOperationReceipt(
  state,
  category,
  index,
  operation,
  resourceKey,
  rewrite,
) {
  const slot = qualificationOperationSlot(
    state,
    category,
    index,
    operation,
    resourceKey,
  );
  assert.ok(slot, `${operation}:${resourceKey ?? "GLOBAL"}`);
  assert.equal(slot.status, "RESULT_APPLIED");
  slot.receipt = rewrite(structuredClone(slot.receipt));
  slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
  return slot;
}

function refreshQualificationReservationReceipt(state, slot, predecessor) {
  slot.predecessor_reservation_proof_sha256 = predecessor;
  slot.reservation_proof_sha256 =
    deriveQualificationReservationProofSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      operation_reservation_identity_sha256:
        state.operation_reservation.identity_sha256,
      reservation_ordinal: slot.reservation_ordinal,
      predecessor_reservation_proof_sha256: predecessor,
      operation_slot_sha256: slot.operation_slot_sha256,
    });
  if (slot.receipt !== null) {
    slot.receipt.reservation_proof_sha256 = slot.reservation_proof_sha256;
    slot.receipt_sha256 = sha256Hex(canonicalJson(slot.receipt));
    const ledgerEntry = state.effect_ledger.find(
      (entry) =>
        entry.creation_operation_slot_sha256 === slot.operation_slot_sha256,
    );
    if (ledgerEntry) ledgerEntry.creation_receipt_sha256 = slot.receipt_sha256;
  }
}

function forgeQualificationReservationTuple(state, targetSlot) {
  const contextual = state.recovery_operation_state.qualification_operation_slots
    .filter((slot) => slot.reservation_ordinal !== null)
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  const targetIndex = contextual.indexOf(targetSlot);
  assert.ok(targetIndex >= 0);
  const swapIndex = targetIndex === 0 ? 1 : targetIndex - 1;
  [contextual[targetIndex], contextual[swapIndex]] = [
    contextual[swapIndex],
    contextual[targetIndex],
  ];
  let predecessor = deriveQualificationReservationRootSha256({
    journal_identity_sha256: state.journal_identity_sha256,
    operation_reservation_identity_sha256:
      state.operation_reservation.identity_sha256,
  });
  for (const [index, slot] of contextual.entries()) {
    slot.reservation_ordinal = index;
    refreshQualificationReservationReceipt(state, slot, predecessor);
    assert.equal(
      slot.receipt === null ||
        slot.receipt.reservation_proof_sha256 === slot.reservation_proof_sha256,
      true,
      `${index}:${slot.operation}`,
    );
    predecessor = slot.reservation_proof_sha256;
  }
  return state;
}

function swapQualificationReservationOrder(state, first, second) {
  const contextual = state.recovery_operation_state.qualification_operation_slots
    .filter((slot) => slot.reservation_ordinal !== null)
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  const firstIndex = contextual.indexOf(first);
  const secondIndex = contextual.indexOf(second);
  [contextual[firstIndex], contextual[secondIndex]] = [
    contextual[secondIndex],
    contextual[firstIndex],
  ];
  let predecessor = deriveQualificationReservationRootSha256({
    journal_identity_sha256: state.journal_identity_sha256,
    operation_reservation_identity_sha256:
      state.operation_reservation.identity_sha256,
  });
  for (const [ordinal, slot] of contextual.entries()) {
    slot.reservation_ordinal = ordinal;
    refreshQualificationReservationReceipt(state, slot, predecessor);
    predecessor = slot.reservation_proof_sha256;
  }
  return state;
}

function localFailedRecoverableFromQualified(state) {
  const mutable = structuredClone(state);
  for (const entry of mutable.effect_ledger) {
    if (entry.cleanup_status === "RETAINED") {
      entry.cleanup_status = "PENDING";
    }
  }
  mutable.lifecycle_state = "FAILED_RECOVERABLE";
  mutable.authorization_class = "LOCAL_QUALIFICATION";
  mutable.transition_history = [
    ...mutable.transition_history.slice(0, -1),
    {
      from: "QUALIFYING",
      to: "FAILED_RECOVERABLE",
      authorization_class: "LOCAL_QUALIFICATION",
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
  ];
  mutable.cleanup = { required: true, verified: false };
  mutable.recovery = { status: "PENDING", resume_to: "READY" };
  mutable.outcome = { code: "QUALIFICATION_FAILED", successful: false };
  delete mutable.final_evidence_identity_sha256;
  return resealCheckpointState(mutable);
}

async function recoverForPreAdapterValidation(state) {
  const calls = {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  };
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(state),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) => {
        calls.grant += 1;
        return futureRecoveryAuthorityResponse(request, state);
      },
    },
    checkpointRecoveryState: async (_candidate, command) => {
      calls.checkpoint += 1;
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => {
      calls.head += 1;
      return exactCheckpointHead(state);
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

async function exactUngrantRecoveryPrefixes() {
  const fake = adapters();
  installFutureAuthority(fake);
  await runQualification(qualificationInput(fake));
  const qualifying = fake.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "APPLIED",
  );
  assert.ok(qualifying);
  const failedRecoverable = structuredClone(qualifying);
  failedRecoverable.lifecycle_state = "FAILED_RECOVERABLE";
  failedRecoverable.authorization_class = "LOCAL_QUALIFICATION";
  failedRecoverable.transition_history.push({
    from: "QUALIFYING",
    to: "FAILED_RECOVERABLE",
    authorization_class: "LOCAL_QUALIFICATION",
    review_sha256: ACTIVATION_REVIEW_SHA256,
  });
  failedRecoverable.cleanup = { required: true, verified: false };
  failedRecoverable.recovery = { status: "PENDING", resume_to: "READY" };
  failedRecoverable.outcome = {
    code: "QUALIFICATION_FAILED",
    successful: false,
  };
  return {
    qualifying: resealCheckpointState(qualifying),
    failedRecoverable: resealCheckpointState(failedRecoverable),
  };
}

async function exactQualifiedTerminalFixture() {
  const fake = adapters();
  installFutureAuthority(fake);
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "QUALIFIED");
  assert.equal(result.state.outcome.code, "QUALIFIED");
  return structuredClone(result.state);
}

async function exactAppliedQualificationPrefixes() {
  const fake = adapters();
  installFutureAuthority(fake);
  await runQualification(qualificationInput(fake));
  const prefixes = new Map();
  for (const count of [1, 2, 3, 4, 5]) {
    const prefix = fake.checkpoints.find(
      (state) =>
        state.lifecycle_state === "QUALIFYING" &&
        state.owned_resources.length === count &&
        state.effect_ledger.length === count &&
        state.effect_ledger.every(
          (entry) => entry.status === "APPLIED" && isSha256(entry.creation_receipt_sha256),
        ),
    );
    assert.ok(prefix, `applied-prefix-${count}`);
    prefixes.set(count, structuredClone(prefix));
  }
  return prefixes;
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

async function recoverErasedAppliedSuffix(state, physicalPresent) {
  const calls = {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  };
  let durable = structuredClone(state);
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) => {
        calls.grant += 1;
        return futureRecoveryAuthorityResponse(request, state);
      },
    },
    checkpointRecoveryState: async (candidate, command) => {
      calls.checkpoint += 1;
      durable = structuredClone(candidate);
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => {
      calls.head += 1;
      return exactCheckpointHead(durable);
    },
    inspectOwnedResource: async (resource, context) => {
      calls.inspect += 1;
      const present = physicalPresent.has(resource.resource_key);
      const planIndex = state.resource_plan.findIndex(
        (candidate) => candidate.resource_key === resource.resource_key,
      );
      return {
        status: present ? "PRESENT" : "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
        ...(present
          ? {
              creation_operation_slot_sha256:
                qualificationOperationSlotSha256(
                  state,
                  "mutations",
                  planIndex,
                  "QUALIFICATION_CREATE_NEW",
                  resource.resource_key,
                ),
              ...(resource.resource_type === "STORAGE_OBJECT"
                ? { observed_version: resource.storage_cas.expected_version }
                : {}),
            }
          : {}),
      };
    },
    reconcileOwnedResource: async (resource, contract, context) => {
      calls.reconcile += 1;
      physicalPresent.delete(resource.resource_key);
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { expected_version: contract.expected_version }
          : {}),
      };
    },
  });
  return { calls, result };
}

const exactQualifiedTerminal = await exactQualifiedTerminalFixture();

await check("every applied qualification receipt binds its exact append-only reservation proof", async () => {
  const applied = exactQualifiedTerminal.recovery_operation_state
    .qualification_operation_slots.filter(
      (slot) => slot.status === "RESULT_APPLIED",
    );
  assert.ok(applied.length > 0);
  const ordered = [...applied].sort(
    (left, right) => left.reservation_ordinal - right.reservation_ordinal,
  );
  let predecessor = deriveQualificationReservationRootSha256({
    journal_identity_sha256: exactQualifiedTerminal.journal_identity_sha256,
    operation_reservation_identity_sha256:
      exactQualifiedTerminal.operation_reservation.identity_sha256,
  });
  for (const [ordinal, slot] of ordered.entries()) {
    assert.equal(slot.reservation_ordinal, ordinal);
    assert.equal(slot.predecessor_reservation_proof_sha256, predecessor);
    const expected = deriveQualificationReservationProofSha256({
      journal_identity_sha256: exactQualifiedTerminal.journal_identity_sha256,
      operation_reservation_identity_sha256:
        exactQualifiedTerminal.operation_reservation.identity_sha256,
      reservation_ordinal: ordinal,
      predecessor_reservation_proof_sha256: predecessor,
      operation_slot_sha256: slot.operation_slot_sha256,
    });
    assert.equal(
      slot.reservation_proof_sha256,
      expected,
      `${slot.operation}:${slot.resource_key ?? "GLOBAL"}`,
    );
    assert.equal(slot.receipt.reservation_proof_sha256, expected);
    predecessor = expected;
  }
});

await check("terminal QUALIFIED durably records the exact qualification operation receipts", async () => {
  const slots = exactQualifiedTerminal.recovery_operation_state
    .qualification_operation_slots;
  assert.equal(slots.length, 15);
  const used = new Set([
    ...exactQualifiedTerminal.recovery_operation_state.qualification_slot_usage.requests,
    ...exactQualifiedTerminal.recovery_operation_state.qualification_slot_usage.mutations,
  ]);
  for (const slot of slots) {
    assert.equal(
      slot.status,
      used.has(slot.operation_slot_sha256) ? "RESULT_APPLIED" : "NOT_STARTED",
      `${slot.operation}:${slot.resource_key ?? "GLOBAL"}`,
    );
    if (slot.status === "RESULT_APPLIED") {
      assert.ok(slot.receipt);
      assert.equal(
        slot.receipt_sha256,
        sha256Hex(canonicalJson(slot.receipt)),
      );
    } else {
      assert.equal(slot.receipt, null);
      assert.equal(slot.receipt_sha256, null);
    }
  }
  for (const entry of exactQualifiedTerminal.effect_ledger) {
    const planIndex = exactQualifiedTerminal.resource_plan.findIndex(
      (resource) => resource.resource_key === entry.resource_key,
    );
    const create = qualificationOperationSlot(
      exactQualifiedTerminal,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      entry.resource_key,
    );
    assert.equal(create.status, "RESULT_APPLIED");
    assert.equal(entry.creation_receipt_sha256, create.receipt_sha256);
  }
});

const qualificationReceiptClasses = [
  {
    name: "authority reservation checkpoint",
    category: "requests",
    index: 0,
    operation: "VERIFY_AUTHORITY_ENVELOPE",
    resourceIndex: null,
  },
  {
    name: "namespace reservation checkpoint",
    category: "requests",
    index: 1,
    operation: "VERIFY_FRESH_RESOURCE_PLAN",
    resourceIndex: null,
  },
  {
    name: "create reservation checkpoint with coordinated ledger digest",
    category: "mutations",
    index: 0,
    operation: "QUALIFICATION_CREATE_NEW",
    resourceIndex: 0,
    rewriteLedger: true,
  },
  {
    name: "staging reservation checkpoint",
    category: "requests",
    index: 2,
    operation: "VERIFY_STAGING_READ_ONLY",
    resourceIndex: null,
  },
  {
    name: "delete reservation checkpoint",
    category: "mutations",
    index: 5,
    operation: "QUALIFICATION_DELETE_EXACT",
    resourceIndex: 0,
  },
  {
    name: "final verifier reservation checkpoint",
    category: "requests",
    index: 3,
    operation: "QUALIFICATION_VERIFY_CLEANUP",
    resourceIndex: null,
  },
];

for (const scenario of qualificationReceiptClasses) {
  await check(
    `terminal QUALIFIED rejects substituted ${scenario.name} before current-head read`,
    async () => {
      const malformed = structuredClone(exactQualifiedTerminal);
      const resourceKey = scenario.resourceIndex === null
        ? null
        : malformed.resource_plan[scenario.resourceIndex].resource_key;
      const slot = rewriteQualificationOperationReceipt(
        malformed,
        scenario.category,
        scenario.index,
        scenario.operation,
        resourceKey,
        (receipt) => ({
          ...receipt,
          checkpoint_identity_sha256: "9".repeat(64),
        }),
      );
      if (scenario.rewriteLedger) {
        malformed.effect_ledger.find(
          (entry) => entry.resource_key === resourceKey,
        ).creation_receipt_sha256 = slot.receipt_sha256;
      }
      const sealed = resealCheckpointState(malformed);
      const { calls, result } = await recoverForPreAdapterValidation(sealed);
      assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
      assert.deepEqual(calls, {
        head: 0,
        grant: 0,
        checkpoint: 0,
        inspect: 0,
        reconcile: 0,
      });
    },
  );
}

for (const scenario of qualificationReceiptClasses) {
  await check(
    `terminal QUALIFIED rejects substituted ${scenario.name} predecessor proof before current-head read`,
    async () => {
      const malformed = structuredClone(exactQualifiedTerminal);
      const resourceKey = scenario.resourceIndex === null
        ? null
        : malformed.resource_plan[scenario.resourceIndex].resource_key;
      const slot = qualificationOperationSlot(
        malformed,
        scenario.category,
        scenario.index,
        scenario.operation,
        resourceKey,
      );
      slot.predecessor_reservation_proof_sha256 = "f".repeat(64);
      const sealed = resealCheckpointState(malformed);
      const { calls, result } = await recoverForPreAdapterValidation(sealed);
      assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
      assert.deepEqual(calls, {
        head: 0,
        grant: 0,
        checkpoint: 0,
        inspect: 0,
        reconcile: 0,
      });
    },
  );
}

await check("compact evidence rejects forged terminal controls and non-exact accounting", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const qualified = await runQualification(qualificationInput(fake));
  assert.equal(qualified.state.lifecycle_state, "QUALIFIED");

  const wrongAccounting = structuredClone(qualified.evidence);
  wrongAccounting.budgets = {
    requests: { limit: 1, used: 0 },
    mutations: { limit: 1, used: 0 },
  };
  assert.throws(
    () => validateCompactEvidence(resealEvidence(wrongAccounting)),
    (error) => error?.code === "EVIDENCE_SHAPE",
  );

  const forgedReady = structuredClone(qualified.evidence);
  forgedReady.lifecycle_state = "READY";
  forgedReady.authorization_class = "NONE";
  forgedReady.cleanup = { required: false, verified: true };
  forgedReady.recovery = { status: "NOT_REQUIRED" };
  forgedReady.outcome = { code: "READY", successful: true };
  assert.throws(
    () => validateCompactEvidence(resealEvidence(forgedReady)),
    (error) => error?.code === "EVIDENCE_SHAPE",
  );
});

const qualifiedUsageMutants = [
  {
    name: "erased staging reservation with exact lower request budget",
    mutate(state) {
      removeQualificationUsage(
        state,
        "requests",
        2,
        "VERIFY_STAGING_READ_ONLY",
      );
    },
  },
  {
    name: "erased success cleanup verifier with exact lower request budget",
    mutate(state) {
      removeQualificationUsage(
        state,
        "requests",
        3,
        "QUALIFICATION_VERIFY_CLEANUP",
      );
    },
  },
  ...[0, 2, 3, 4].map((planIndex) => ({
    name: `erased cleaned-resource delete ${planIndex} with exact lower mutation budget`,
    mutate(state) {
      const resource = state.resource_plan[planIndex];
      removeQualificationUsage(
        state,
        "mutations",
        5 + planIndex,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      );
    },
  })),
  {
    name: "retained Preview delete substitutes a cleaned-resource delete at equal count",
    mutate(state) {
      const cleaned = state.resource_plan[0];
      const preview = state.resource_plan[1];
      const cleanedDeletion = qualificationOperationSlot(
        state,
        "mutations",
        5,
        "QUALIFICATION_DELETE_EXACT",
        cleaned.resource_key,
      );
      const substitutedReceipt = {
        ...structuredClone(cleanedDeletion.receipt),
        resource_key: preview.resource_key,
        locator_sha256: preview.owner.locator_sha256,
      };
      removeQualificationUsage(
        state,
        "mutations",
        5,
        "QUALIFICATION_DELETE_EXACT",
        cleaned.resource_key,
      );
      const inserted = addQualificationUsage(
        state,
        "mutations",
        6,
        "QUALIFICATION_DELETE_EXACT",
        preview.resource_key,
      );
      substitutedReceipt.operation_slot_sha256 = inserted.operation_slot_sha256;
      applyMutantQualificationReceipt(inserted, substitutedReceipt);
    },
  },
  {
    name: "failure-only compensation verifier inserted into success path",
    mutate(state) {
      const successVerification = qualificationOperationSlot(
        state,
        "requests",
        3,
        "QUALIFICATION_VERIFY_CLEANUP",
      );
      const inserted = addQualificationUsage(
        state,
        "requests",
        4,
        "QUALIFICATION_VERIFY_CLEANUP",
      );
      applyMutantQualificationReceipt(inserted, {
        ...structuredClone(successVerification.receipt),
        operation_slot_sha256: inserted.operation_slot_sha256,
      });
    },
  },
  {
    name: "original create receipt digest substituted without operation proof",
    mutate(state) {
      state.effect_ledger[0].creation_receipt_sha256 = "6".repeat(64);
    },
  },
];

for (const scenario of qualifiedUsageMutants) {
  await check(`terminal QUALIFIED rejects ${scenario.name} before every adapter`, async () => {
    const malformed = structuredClone(exactQualifiedTerminal);
    scenario.mutate(malformed);
    const sealed = resealCheckpointState(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  });
}

for (const scenario of [
  {
    name: "erased original create receipt proof",
    mutate(state) {
      const resource = state.resource_plan[0];
      const slot = qualificationOperationSlot(
        state,
        "mutations",
        0,
        "QUALIFICATION_CREATE_NEW",
        resource.resource_key,
      );
      assert.ok(slot);
      slot.status = "RESERVED";
      slot.receipt = null;
      slot.receipt_sha256 = null;
    },
  },
  {
    name: "substituted original create receipt and matching ledger digest",
    mutate(state) {
      const resource = state.resource_plan[0];
      const slot = rewriteQualificationOperationReceipt(
        state,
        "mutations",
        0,
        "QUALIFICATION_CREATE_NEW",
        resource.resource_key,
        (receipt) => ({ ...receipt, resource_key: "substituted-resource" }),
      );
      state.effect_ledger[0].creation_receipt_sha256 = slot.receipt_sha256;
    },
  },
  {
    name: "substituted original create operation slot",
    mutate(state) {
      state.effect_ledger[0].creation_operation_slot_sha256 =
        state.effect_ledger[1].creation_operation_slot_sha256;
    },
  },
  {
    name: "substituted cleaned-resource delete receipt locator",
    mutate(state) {
      const resource = state.resource_plan[0];
      rewriteQualificationOperationReceipt(
        state,
        "mutations",
        5,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
        (receipt) => ({ ...receipt, locator_sha256: "7".repeat(64) }),
      );
    },
  },
  {
    name: "substituted success cleanup verifier absent set",
    mutate(state) {
      rewriteQualificationOperationReceipt(
        state,
        "requests",
        3,
        "QUALIFICATION_VERIFY_CLEANUP",
        null,
        (receipt) => ({ ...receipt, verified_absent_resource_keys: [] }),
      );
    },
  },
]) {
  await check(`terminal QUALIFIED rejects ${scenario.name} before every adapter`, async () => {
    const malformed = structuredClone(exactQualifiedTerminal);
    scenario.mutate(malformed);
    const sealed = resealCheckpointState(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

const exactAppliedPrefixes = await exactAppliedQualificationPrefixes();
for (const scenario of [
  {
    name: "mutable authority receipt checkpoint",
    category: "requests",
    index: 0,
    operation: "VERIFY_AUTHORITY_ENVELOPE",
    resourceIndex: null,
  },
  {
    name: "mutable namespace receipt checkpoint",
    category: "requests",
    index: 1,
    operation: "VERIFY_FRESH_RESOURCE_PLAN",
    resourceIndex: null,
  },
  {
    name: "mutable create receipt checkpoint and matching ledger digest",
    category: "mutations",
    index: 0,
    operation: "QUALIFICATION_CREATE_NEW",
    resourceIndex: 0,
    rewriteLedger: true,
  },
]) {
  await check(`${scenario.name} substitution fails before current-head read`, async () => {
    const malformed = structuredClone(exactAppliedPrefixes.get(1));
    const resourceKey = scenario.resourceIndex === null
      ? null
      : malformed.resource_plan[scenario.resourceIndex].resource_key;
    const slot = rewriteQualificationOperationReceipt(
      malformed,
      scenario.category,
      scenario.index,
      scenario.operation,
      resourceKey,
      (receipt) => ({
        ...receipt,
        checkpoint_identity_sha256: "8".repeat(64),
      }),
    );
    if (scenario.rewriteLedger) {
      malformed.effect_ledger.find(
        (entry) => entry.resource_key === resourceKey,
      ).creation_receipt_sha256 = slot.receipt_sha256;
    }
    const sealed = resealCheckpointState(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

for (const scenario of [
  { name: "one-resource branch", count: 1 },
  { name: "multi-resource Preview tail", count: 2 },
  { name: "multi-resource ordinary tail", count: 3 },
  { name: "multi-resource Storage tail", count: 5 },
]) {
  await check(`recovery rejects erased APPLIED ${scenario.name} suffix before every adapter`, async () => {
    const prefix = structuredClone(exactAppliedPrefixes.get(scenario.count));
    const erasedResource = prefix.owned_resources.at(-1);
    const erasedEntry = prefix.effect_ledger.at(-1);
    assert.equal(erasedEntry.resource_key, erasedResource.resource_key);
    assert.equal(erasedEntry.status, "APPLIED");
    const physicalPresent = new Set(
      prefix.owned_resources.map((resource) => resource.resource_key),
    );
    prefix.owned_resources.pop();
    prefix.effect_ledger.pop();
    const sealed = resealCheckpointState(prefix);
    const { calls, result } = await recoverErasedAppliedSuffix(
      sealed,
      physicalPresent,
    );
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
    assert.equal(physicalPresent.has(erasedResource.resource_key), true);
  });
}

async function recoverPlanAwareErasedSuffix(state, physicalPresent) {
  const fake = adapters();
  let durable = structuredClone(state);
  const inspected = [];
  const reconciled = [];
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, state),
    },
    checkpointRecoveryState: async (candidate, command) => {
      durable = structuredClone(candidate);
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => exactCheckpointHead(durable),
    inspectOwnedResource: async (resource, context) => {
      inspected.push(resource.resource_key);
      const present = physicalPresent.has(resource.resource_key);
      const entry = state.effect_ledger.find(
        (candidate) => candidate.resource_key === resource.resource_key,
      );
      return {
        status: present ? "PRESENT" : "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
        ...(present && entry
          ? {
              creation_operation_slot_sha256:
                entry.creation_operation_slot_sha256,
            }
          : {}),
        ...(present && resource.resource_type === "STORAGE_OBJECT"
          ? { observed_version: resource.storage_cas.expected_version }
          : {}),
      };
    },
    reconcileOwnedResource: async (resource, contract, context) => {
      reconciled.push(resource.resource_key);
      physicalPresent.delete(resource.resource_key);
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
        ...(resource.resource_type === "STORAGE_OBJECT"
          ? { expected_version: contract.expected_version }
          : {}),
      };
    },
  });
  return { inspected, reconciled, result };
}

for (const scenario of [
  { name: "branch", count: 1, erase: 1 },
  { name: "Preview", count: 2, erase: 1 },
  { name: "environment", count: 3, erase: 1 },
  { name: "database", count: 4, erase: 1 },
  { name: "Storage", count: 5, erase: 1 },
  { name: "multi-resource database and Storage", count: 5, erase: 2 },
]) {
  await check(
    `recovery inspects exact plan and preserves ownership-unproven erased ${scenario.name} suffix`,
    async () => {
      const prefix = structuredClone(exactAppliedPrefixes.get(scenario.count));
      const physicalPresent = new Set(
        prefix.owned_resources.map((resource) => resource.resource_key),
      );
      const erased = [];
      for (let index = 0; index < scenario.erase; index += 1) {
        const resource = prefix.owned_resources.at(-1);
        const planIndex = prefix.resource_plan.findIndex(
          (candidate) => candidate.resource_key === resource.resource_key,
        );
        erased.push(resource.resource_key);
        prefix.owned_resources.pop();
        prefix.effect_ledger.pop();
        removeQualificationUsage(
          prefix,
          "mutations",
          planIndex,
          "QUALIFICATION_CREATE_NEW",
          resource.resource_key,
        );
      }
      const sealed = resealCheckpointState(prefix);
      const { inspected, reconciled, result } =
        await recoverPlanAwareErasedSuffix(sealed, physicalPresent);
      assertRecoveryFailureProjection(result, "INTENT_OWNERSHIP_UNPROVEN");
      assert.deepEqual(
        new Set(inspected),
        new Set(sealed.resource_plan.map((resource) => resource.resource_key)),
      );
      for (const resourceKey of erased) {
        assert.equal(reconciled.includes(resourceKey), false, resourceKey);
        assert.equal(physicalPresent.has(resourceKey), true, resourceKey);
      }
    },
  );
}

await check("pre-create NOT_STARTED intent never treats a slot-shaped PRESENT receipt as ownership", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  await runQualification(qualificationInput(fake));
  const prefix = fake.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "INTENT_ONLY" &&
      state.budgets.mutations.used === 0,
  );
  assert.ok(prefix);
  const resource = prefix.owned_resources[0];
  const createSlot = qualificationOperationSlot(
    prefix,
    "mutations",
    0,
    "QUALIFICATION_CREATE_NEW",
    resource.resource_key,
  );
  assert.equal(createSlot.status, "NOT_STARTED");
  let durable = structuredClone(prefix);
  let reconciliations = 0;
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, prefix),
    },
    checkpointRecoveryState: async (candidate, command) => {
      durable = structuredClone(candidate);
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => exactCheckpointHead(durable),
    inspectOwnedResource: async (_owned, context) => ({
      status:
        _owned.resource_key === resource.resource_key ? "PRESENT" : "ABSENT",
      ...(_owned.resource_key === resource.resource_key
        ? {
            creation_operation_slot_sha256:
              qualificationOperationSlotSha256(
                prefix,
                "mutations",
                0,
                "QUALIFICATION_CREATE_NEW",
                resource.resource_key,
              ),
          }
        : {}),
      operation_slot_sha256:
        context.operation_slot.operation_slot_sha256,
      operation_binding_sha256: context.operation_binding_sha256,
    }),
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "INTENT_OWNERSHIP_UNPROVEN");
  assert.equal(reconciliations, 0);
});

await check("namespace and staging receipts are recursively safe exact allowlists", async () => {
  for (const surface of ["namespace", "staging"]) {
    for (const injected of [
      { unreviewed_detail: "opaque" },
      { metadata: { api_token: `Bearer ${"s".repeat(24)}` } },
    ]) {
      const fake = adapters();
      installFutureAuthority(fake);
      if (surface === "namespace") {
        fake.contract.namespace.verifyFresh = async (request) => ({
          ...futureNamespaceResponse(request),
          ...injected,
        });
      } else {
        const verifyReadOnly = fake.contract.staging.verifyReadOnly;
        fake.contract.staging.verifyReadOnly = async (request) => ({
          ...(await verifyReadOnly(request)),
          ...injected,
        });
      }
      const result = await runQualification(qualificationInput(fake));
      assert.equal(
        result.state.outcome.code,
        surface === "namespace"
          ? "RUN_NAMESPACE_INSPECTION_FAILED"
          : "STAGING_VERIFICATION_FAILED",
      );
      assert.equal(
        JSON.stringify(result).includes("Bearer"),
        false,
      );
      if (surface === "namespace") {
        assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
      }
    }
  }
});

await check("ordinary cleanup receipt binds exact resource and full locator digest", async () => {
  for (const mode of ["MISSING_LOCATOR", "EXTRA_FIELD", "UNSAFE_FIELD"]) {
    const fake = adapters();
    installFutureAuthority(fake);
    const cleanup = fake.contract.branch.cleanup;
    fake.contract.branch.cleanup = async (resource, context) => {
      const receipt = await cleanup(resource, context);
      if (mode === "MISSING_LOCATOR") delete receipt.locator_sha256;
      if (mode === "EXTRA_FIELD") receipt.unreviewed_detail = "opaque";
      if (mode === "UNSAFE_FIELD") {
        receipt.metadata = { api_token: `Bearer ${"s".repeat(24)}` };
      }
      return receipt;
    };
    const result = await runQualification(qualificationInput(fake));
    assert.equal(result.state.outcome.code, "OPERATION_RECEIPT_MISMATCH", mode);
    assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE", mode);
    assert.equal(result.state.cleanup.verified, false, mode);
    assert.equal(JSON.stringify(result).includes("Bearer"), false, mode);
  }
});

await check("Storage cleanup and version-mismatch receipts are exact locator-bound allowlists", async () => {
  for (const mode of ["DELETE_EXTRA", "MISMATCH_EXTRA", "MISMATCH_LOCATOR"]) {
    const fake = adapters({
      storageCleanupStatus: mode === "DELETE_EXTRA" ? "DELETED_EXACT" : "VERSION_MISMATCH",
    });
    installFutureAuthority(fake);
    const cleanup = fake.contract.storage.cleanupExactVersion;
    fake.contract.storage.cleanupExactVersion = async (...args) => {
      const receipt = await cleanup(...args);
      if (mode.endsWith("EXTRA")) receipt.unreviewed_detail = "opaque";
      if (mode === "MISMATCH_LOCATOR") receipt.locator_sha256 = "d".repeat(64);
      return receipt;
    };
    const result = await runQualification(qualificationInput(fake));
    assert.equal(result.state.outcome.code, "OPERATION_RECEIPT_MISMATCH", mode);
    assert.equal(result.state.cleanup.verified, false, mode);
  }
});

function assertSanitizedResult(result) {
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("Bearer"), false);
  assert.equal(serialized.includes("ssss"), false);
  assert.match(result.evidence.evidence_identity_sha256, /^[0-9a-f]{64}$/u);
}

await check("missing fresh-plan receipt terminalizes the reserved request with bounded evidence", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let attempts = 0;
  fake.contract.namespace.verifyFresh = async () => {
    attempts += 1;
    throw new Error("raw-provider-body-must-not-escape");
  };
  const result = await runQualification(qualificationInput(fake));
  const slot = qualificationOperationSlot(
    result.state,
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
  );
  assert.equal(result.state.outcome.code, "RUN_NAMESPACE_INSPECTION_FAILED");
  assert.equal(slot.status, "RESULT_APPLIED");
  assert.equal(slot.receipt.status, "INSPECTION_FAILED");
  assert.deepEqual(slot.receipt.diagnostic, {
    schema_version: 1,
    request_step: "VERIFY_FRESH_RESOURCE_PLAN",
    provider: "UNKNOWN",
    resource_kind: "UNKNOWN",
    inspection_class: "RESOURCE_PLAN_INSPECTION",
    failure_class: "MISSING_RECEIPT",
    receipt_created: false,
    safe_status: "UNAVAILABLE",
    retryability: "UNKNOWN",
    ownership_known: false,
    provider_response_class: "NOT_APPLICABLE",
  });
  assert.equal(result.state.budgets.requests.used, 2);
  assert.equal(result.state.budgets.mutations.used, 0);
  assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
  assert.equal(attempts, 1);
  assert.equal(JSON.stringify(result).includes("raw-provider-body"), false);
  assert.doesNotThrow(() => validateTerminalState(result.state));
});

await check("authenticated envelope binds current retained state plan journal and create crash", async () => {
  const fake = adapters();
  let reviewedRequest;
  let namespaceRequest;
  fake.contract.authority.verifyAuthorityEnvelope = async (request) => {
    reviewedRequest = structuredClone(request);
    return futureAuthorityResponse(request);
  };
  fake.contract.namespace.verifyFresh = async (request) => {
    namespaceRequest = structuredClone(request);
    return futureNamespaceResponse(request);
  };
  const qualified = await runQualification(qualificationInput(fake));
  assert.equal(qualified.state.lifecycle_state, "QUALIFIED", qualified.state.outcome.code);
  assert.match(reviewedRequest.authority_envelope_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(reviewedRequest.authority_envelope.resource_plan_sha256,
    namespaceRequest.resource_plan_sha256);
  assert.deepEqual(namespaceRequest.resource_plan, qualified.state.resource_plan);
  assert.match(qualified.state.journal_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(Object.keys(qualified.state.checkpoint).sort(), [
    "checkpoint_identity_sha256",
    "predecessor_checkpoint_identity_sha256",
    "schema_version",
    "sequence",
  ]);
  assert.match(
    qualified.state.checkpoint.checkpoint_identity_sha256,
    /^[0-9a-f]{64}$/u,
  );
  assert.match(
    qualified.state.checkpoint.predecessor_checkpoint_identity_sha256,
    /^[0-9a-f]{64}$/u,
  );
  assert.ok(qualified.state.checkpoint.sequence > 0);
  assert.equal(qualified.state.authority_envelope_sha256,
    reviewedRequest.authority_envelope_sha256);
  assert.equal(
    qualified.state.effect_ledger.every((entry) =>
      typeof entry.creation_operation_slot_sha256 === "string"),
    true,
  );

  const stale = adapters();
  installFutureAuthority(stale, {
    authorityOverrides: {
      current_retained_state_attestation_sha256: "d".repeat(64),
    },
  });
  const staleResult = await runQualification(qualificationInput(stale));
  assert.equal(staleResult.state.outcome.code, "RETAINED_STATE_ATTESTATION_MISMATCH");
  assert.equal(stale.events.some((event) => event.startsWith("create:")), false);

  const preexisting = adapters();
  installFutureAuthority(preexisting, { presentIndex: 1 });
  const preexistingResult = await runQualification(qualificationInput(preexisting));
  assert.equal(
    preexistingResult.state.outcome.code,
    "RUN_NAMESPACE_INSPECTION_FAILED",
  );
  assert.equal(preexisting.events.some((event) => event.startsWith("create:")), false);

  const reviewedState = structuredClone(qualified.state);
  const substituted = structuredClone(reviewedState);
  substituted.lifecycle_state = "FAILED_RECOVERABLE";
  substituted.transition_history = [
    ...substituted.transition_history.slice(0, -1),
    {
      from: "QUALIFYING",
      to: "FAILED_RECOVERABLE",
      authorization_class: "LOCAL_QUALIFICATION",
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
  ];
  substituted.recovery = { status: "PENDING", resume_to: "READY" };
  substituted.cleanup = { required: true, verified: false };
  substituted.outcome = { code: "SYNTHETIC_INTERRUPTION", successful: false };
  const target = substituted.owned_resources[0];
  const oldKey = target.resource_key;
  target.locator.branch = "substituted-branch";
  target.owner.locator_sha256 = sha256Hex(canonicalJson(target.locator));
  target.resource_key = `${target.owner.run_id}:${target.resource_type}:${target.owner.locator_sha256}`;
  substituted.effect_ledger.find((entry) => entry.resource_key === oldKey).resource_key =
    target.resource_key;
  let inspections = 0;
  const substitutedResult = await recoverQualification({
    loadAuthoritativeState: async () => substituted,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, reviewedState),
    },
    checkpointRecoveryState: async (state, command) =>
      exactCheckpointReceipt(command),
    readCheckpointHead: async () => exactCheckpointHead(substituted),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(substitutedResult.outcome.code, "RECOVERY_STATE_INVALID");
  assert.equal(inspections, 0);

  const forged = structuredClone(reviewedState);
  forged.lifecycle_state = "FAILED_RECOVERABLE";
  forged.transition_history = [
    ...forged.transition_history.slice(0, -1),
    {
      from: "QUALIFYING",
      to: "FAILED_RECOVERABLE",
      authorization_class: "LOCAL_QUALIFICATION",
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
  ];
  forged.recovery = { status: "PENDING", resume_to: "READY" };
  forged.cleanup = { required: true, verified: false };
  forged.outcome = { code: "QUALIFICATION_FAILED", successful: false };
  for (const entry of forged.effect_ledger) {
    if (entry.cleanup_status === "RETAINED") {
      entry.cleanup_status = "PENDING";
    }
  }
  forged.journal_identity_sha256 = "f".repeat(64);
  const progressedForgedSlots = forged.recovery_operation_state
    .qualification_operation_slots
    .filter((slot) => slot.reservation_ordinal !== null)
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  let forgedPredecessor = deriveQualificationReservationRootSha256({
    journal_identity_sha256: forged.journal_identity_sha256,
    operation_reservation_identity_sha256:
      forged.operation_reservation.identity_sha256,
  });
  for (const slot of progressedForgedSlots) {
    refreshQualificationReservationReceipt(
      forged,
      slot,
      forgedPredecessor,
    );
    forgedPredecessor = slot.reservation_proof_sha256;
  }
  const sealedForged = resealCheckpointState(forged);
  inspections = 0;
  const forgedResult = await recoverQualification({
    loadAuthoritativeState: async () => sealedForged,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, reviewedState),
    },
    checkpointRecoveryState: async () => {},
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => ({ status: "DELETED_EXACT" }),
  });
  assert.equal(forgedResult.outcome.code, "RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  assert.equal(inspections, 0);

  const createCrash = structuredClone(
    fake.checkpoints.find(
      (checkpointState) =>
        checkpointState.lifecycle_state === "QUALIFYING" &&
        checkpointState.effect_ledger.length === 1 &&
        checkpointState.effect_ledger[0].status === "INTENT_ONLY" &&
        qualificationOperationSlot(
          checkpointState,
          "mutations",
          0,
          "QUALIFICATION_CREATE_NEW",
          checkpointState.owned_resources[0].resource_key,
        )?.status === "RESERVED",
    ),
  );
  assert.ok(createCrash);
  const crashResource = structuredClone(createCrash.resource_plan[0]);
  const crashEntry = structuredClone(createCrash.effect_ledger[0]);
  let present = true;
  let reconciliations = 0;
  let createCrashHead = structuredClone(createCrash);
  const recoveredCrash = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(createCrashHead),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, createCrash),
    },
    checkpointRecoveryState: async (state, command) => {
      createCrashHead = structuredClone(state);
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => exactCheckpointHead(createCrashHead),
    inspectOwnedResource: async (resource, context) => {
      const resourcePresent =
        present && resource.resource_key === crashResource.resource_key;
      return {
        status: resourcePresent ? "PRESENT" : "ABSENT",
        ...(resourcePresent
          ? {
              creation_operation_slot_sha256:
                crashEntry.creation_operation_slot_sha256,
            }
          : {}),
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        ...(context?.operation_binding_sha256
          ? { operation_binding_sha256: context.operation_binding_sha256 }
          : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
      };
    },
    reconcileOwnedResource: async (resource, cas, context) => {
      reconciliations += 1;
      present = false;
      return {
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        ...(context?.operation_binding_sha256
          ? { operation_binding_sha256: context.operation_binding_sha256 }
          : { checkpoint_identity_sha256: context?.checkpoint_identity_sha256 }),
      };
    },
  });
  assert.equal(recoveredCrash.lifecycle_state, "READY", recoveredCrash.outcome.code);
  assert.equal(reconciliations, 1);
  assert.equal(present, false);
});

await check("terminal compensation reports delete checkpoint and verifier faults honestly", async () => {
  for (const mode of [
    "DELETE_REJECTED",
    "DELETE_EXCEPTION",
    "RESULT_CHECKPOINT_FAILED",
    "VERIFIER_REJECTED",
    "VERIFIER_EXCEPTION",
  ]) {
    const fake = adapters();
    installFutureAuthority(fake);
    let verificationAttempts = 0;
    if (mode === "DELETE_REJECTED") {
      fake.contract.preview.cleanup = async (resource, context) => ({
        status: "REJECTED",
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
      });
    }
    if (mode === "DELETE_EXCEPTION") {
      fake.contract.preview.cleanup = async () => {
        throw Object.assign(new Error(`Bearer ${"s".repeat(24)}`), {
          code: `Bearer ${"s".repeat(24)}`,
        });
      };
    }
    if (["VERIFIER_REJECTED", "VERIFIER_EXCEPTION"].includes(mode)) {
      const original = fake.contract.finalCleanup.verify;
      fake.contract.finalCleanup.verify = async (...args) => {
        verificationAttempts += 1;
        if (verificationAttempts === 1) return original(...args);
        if (mode === "VERIFIER_EXCEPTION") {
          throw new Error(`Bearer ${"s".repeat(24)}`);
        }
        const context = args[0];
        return {
          status: "REJECTED",
          retained_preview_count: 1,
          operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        };
      };
    }
    const result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const preview = state.owned_resources.find(
            (resource) => resource.resource_type === "PREVIEW_DEPLOYMENT",
          );
          const entry = state.effect_ledger.find(
            (candidate) => candidate.resource_key === preview?.resource_key,
          );
          if (state.lifecycle_state === "QUALIFIED") {
            throw new Error("terminal checkpoint rejected");
          }
          if (
            mode === "RESULT_CHECKPOINT_FAILED" &&
            entry?.status === "CLEANED" &&
            entry.cleanup_status === "APPLIED"
          ) {
            throw new Error("cleanup result checkpoint rejected");
          }
          return fake.commitCheckpoint(state, command);
        },
      }),
    );
    const expectedCode = mode.startsWith("DELETE_")
      ? "TERMINAL_COMPENSATION_DELETE_FAILED"
      : mode === "RESULT_CHECKPOINT_FAILED"
        ? "TERMINAL_COMPENSATION_CHECKPOINT_FAILED"
        : "TERMINAL_COMPENSATION_VERIFICATION_FAILED";
    const projected =
      result.state.result_type === "QUALIFICATION_FAILURE_PROJECTION";
    if (projected) {
      assertQualificationFailureProjection(result.state, expectedCode);
    } else {
      assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE", mode);
      assert.equal(result.state.outcome.code, expectedCode, mode);
      assert.equal(result.state.cleanup.verified, false, mode);
      assert.equal(result.state.recovery.status, "PENDING", mode);
      validateCheckpointProtocol(result.state);
    }
    validateCompactEvidence(result.evidence);
    assert.deepEqual(result.retained_resources, [], mode);
    const ledger = projected
      ? result.evidence.effect_ledger
      : result.state.effect_ledger;
    assert.equal(
      ledger.some((entry) => entry.cleanup_status === "RETAINED"),
      false,
      mode,
    );
    const physicalPreviewCount = [...fake.present].filter((key) =>
      key.includes(":PREVIEW_DEPLOYMENT:"),
    ).length;
    if (mode.startsWith("DELETE_")) {
      assert.equal(physicalPreviewCount, 1, mode);
      assert.equal(
        ledger.some((entry) => entry.cleanup_status === "UNCERTAIN"),
        true,
        mode,
      );
    } else {
      assert.equal(physicalPreviewCount, 0, mode);
    }
    assertSanitizedResult(result);
  }
});

await check("qualification and recovery failures are total prevalidated and sanitized", async () => {
  for (const overrides of [
    { run_id: "BAD RUN" },
    { phase: "34JA-INVALID" },
  ]) {
    const fake = adapters();
    installFutureAuthority(fake);
    const result = await runQualification(qualificationInput(fake, overrides));
    assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
    assert.equal(result.state.outcome.code, "QUALIFICATION_AUTHORITY_INVALID");
    assert.equal(fake.events.some((event) => event.startsWith("authority:")), false);
    assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
    assertSanitizedResult(result);
  }

  const unsafe = adapters();
  installFutureAuthority(unsafe);
  const unsafePlan = resourcePlan();
  unsafePlan[3].locator.id = `Bearer ${"s".repeat(24)}`;
  const unsafeResult = await runQualification(
    qualificationInput(unsafe, { resource_plan: unsafePlan }),
  );
  assert.equal(unsafeResult.state.outcome.code, "EVIDENCE_INPUT_UNSAFE");
  assert.equal(unsafe.events.some((event) => event.startsWith("authority:")), false);
  assert.equal(unsafe.events.some((event) => event.startsWith("create:")), false);
  assertSanitizedResult(unsafeResult);

  const adapterFailure = adapters();
  adapterFailure.contract.authority.verifyAuthorityEnvelope = async () => {
    throw Object.assign(new Error(`Bearer ${"s".repeat(24)}`), {
      code: `Bearer ${"s".repeat(24)}`,
    });
  };
  const adapterFailureResult = await runQualification(qualificationInput(adapterFailure));
  assert.equal(adapterFailureResult.state.outcome.code, "AUTHORITY_VERIFICATION_FAILED");
  assertSanitizedResult(adapterFailureResult);

  const evidenceFailure = adapters();
  installFutureAuthority(evidenceFailure);
  evidenceFailure.contract.evidence = {
    async build() {
      throw new Error(`Bearer ${"s".repeat(24)}`);
    },
  };
  const evidenceFailureResult = await runQualification(qualificationInput(evidenceFailure));
  assert.equal(evidenceFailureResult.state.outcome.code, "EVIDENCE_FINALIZATION_FAILED");
  assert.equal(evidenceFailure.present.size, 0);
  assert.equal(evidenceFailureResult.state.cleanup.verified, true);
  assertSanitizedResult(evidenceFailureResult);

  const assertUnknownRecovery = (result, code) => {
    assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
    assert.deepEqual(result.cleanup, { required: true, verified: false });
    assert.deepEqual(result.recovery, { status: "PENDING", resume_to: "READY" });
    assert.equal(result.outcome.code, code);
    assert.equal(JSON.stringify(result).includes("Bearer"), false);
    assert.equal(JSON.stringify(result).includes("ssss"), false);
  };
  const recoveryCalls = { authority: 0, checkpoint: 0, inspect: 0, reconcile: 0 };
  const recoverySurface = {
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async () => {
        recoveryCalls.authority += 1;
        return null;
      },
    },
    checkpointRecoveryState: async () => {
      recoveryCalls.checkpoint += 1;
    },
    readCheckpointHead: async () => {
      recoveryCalls.checkpoint += 1;
      return null;
    },
    inspectOwnedResource: async () => {
      recoveryCalls.inspect += 1;
      return null;
    },
    reconcileOwnedResource: async () => {
      recoveryCalls.reconcile += 1;
      return null;
    },
  };
  const missingLoad = await recoverQualification(recoverySurface);
  assertUnknownRecovery(missingLoad, "RECOVERY_ADAPTER");
  const rejectedLoad = await recoverQualification({
    ...recoverySurface,
    loadAuthoritativeState: async () => {
      throw Object.assign(new Error(`Bearer ${"s".repeat(24)}`), {
        code: `Bearer ${"s".repeat(24)}`,
      });
    },
  });
  assertUnknownRecovery(rejectedLoad, "RECOVERY_STATE_LOAD_FAILED");
  const unsafeLoad = await recoverQualification({
    ...recoverySurface,
    loadAuthoritativeState: async () => ({ api_token: "redacted-value" }),
  });
  assertUnknownRecovery(unsafeLoad, "RECOVERY_STATE_LOAD_FAILED");
  const cloneFailedLoad = await recoverQualification({
    ...recoverySurface,
    loadAuthoritativeState: async () => ({ clone_failure: () => true }),
  });
  assertUnknownRecovery(cloneFailedLoad, "RECOVERY_STATE_LOAD_FAILED");
  assert.deepEqual(recoveryCalls, {
    authority: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
});

await check("qualification authorization is exact before every adapter", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const result = await runQualification(
    qualificationInput(fake, {
      authorization: {
        ...authorization(),
        unreviewed_scope: "extra",
      },
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "QUALIFICATION_AUTHORITY_INVALID");
  assert.equal(fake.checkpoints.length, 0);
  assert.deepEqual(fake.events, []);
});

await check("recovery rejects every malformed control surface before every adapter", async () => {
  const source = adapters();
  installFutureAuthority(source);
  const qualified = await runQualification(qualificationInput(source));
  const malformedStates = [];

  malformedStates.push(structuredClone(qualified.state));

  const badAuthorization = structuredClone(qualified.state);
  badAuthorization.lifecycle_state = "FAILED_RECOVERABLE";
  badAuthorization.authorization_class = "UNREVIEWED";
  badAuthorization.cleanup = { required: true, verified: false };
  badAuthorization.recovery = { status: "PENDING", resume_to: "READY" };
  badAuthorization.outcome = { code: "SYNTHETIC", successful: false };
  malformedStates.push(badAuthorization);

  const badBudgets = structuredClone(badAuthorization);
  badBudgets.authorization_class = "LOCAL_QUALIFICATION";
  badBudgets.budgets.requests.used = badBudgets.budgets.requests.limit + 1;
  malformedStates.push(badBudgets);

  const droppedLedger = structuredClone(badAuthorization);
  droppedLedger.authorization_class = "LOCAL_QUALIFICATION";
  droppedLedger.owned_resources = droppedLedger.owned_resources.slice(0, -1);
  droppedLedger.effect_ledger = droppedLedger.effect_ledger.slice(0, -1);
  malformedStates.push(droppedLedger);

  for (const field of ["cleanup", "recovery", "outcome"]) {
    const extraControl = structuredClone(badAuthorization);
    extraControl.authorization_class = "LOCAL_QUALIFICATION";
    extraControl[field].unvalidated_detail = "opaque";
    malformedStates.push(extraControl);
  }

  for (const malformed of malformedStates) {
    const calls = { checkpoint: 0, authority: 0, inspect: 0, reconcile: 0 };
    const result = await recoverQualification({
      loadAuthoritativeState: async () => malformed,
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        verifyReviewedRecoveryAuthorization: async (request) => {
          calls.authority += 1;
          return futureRecoveryAuthorityResponse(request, malformed);
        },
      },
      checkpointRecoveryState: async () => {
        calls.checkpoint += 1;
      },
      inspectOwnedResource: async () => {
        calls.inspect += 1;
        return { status: "ABSENT" };
      },
      reconcileOwnedResource: async () => {
        calls.reconcile += 1;
        return { status: "DELETED_EXACT" };
      },
    });
    assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.result_type, "RECOVERY_FAILURE_PROJECTION");
    assert.equal(Object.hasOwn(result, "checkpoint"), false);
    assert.deepEqual(calls, {
      checkpoint: 0,
      authority: 0,
      inspect: 0,
      reconcile: 0,
    });
  }
});

await check("mutable checkpoint rejects rollback row loss and forged APPLIED provenance", async () => {
  const source = adapters();
  installFutureAuthority(source);
  const qualified = await runQualification(qualificationInput(source));
  const interrupted = source.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.at(-1)?.status === "INTENT_ONLY",
  );
  assert.ok(interrupted);

  const rollback = structuredClone(qualified.state);
  rollback.lifecycle_state = "FAILED_RECOVERABLE";
  rollback.cleanup = { required: true, verified: false };
  rollback.recovery = { status: "PENDING", resume_to: "READY" };
  rollback.outcome = { code: "FORGED_ROLLBACK", successful: false };

  const droppedRows = structuredClone(interrupted);
  droppedRows.owned_resources = [];
  droppedRows.effect_ledger = [];

  const alteredControl = structuredClone(interrupted);
  alteredControl.budgets.requests.used += 1;

  const forgedApplied = structuredClone(interrupted);
  forgedApplied.effect_ledger.at(-1).status = "APPLIED";

  for (const forged of [rollback, droppedRows, alteredControl, forgedApplied]) {
    const calls = { checkpoint: 0, authority: 0, inspect: 0, reconcile: 0 };
    const result = await recoverQualification({
      loadAuthoritativeState: async () => forged,
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        verifyReviewedRecoveryAuthorization: async (request) => {
          calls.authority += 1;
          return futureRecoveryAuthorityResponse(request, forged);
        },
      },
      checkpointRecoveryState: async () => {
        calls.checkpoint += 1;
      },
      inspectOwnedResource: async () => {
        calls.inspect += 1;
        return { status: "ABSENT" };
      },
      reconcileOwnedResource: async () => {
        calls.reconcile += 1;
        return { status: "DELETED_EXACT" };
      },
    });
    assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
    assert.equal(result.result_type, "RECOVERY_FAILURE_PROJECTION");
    assert.equal(Object.hasOwn(result, "checkpoint"), false);
    assert.deepEqual(calls, {
      checkpoint: 0,
      authority: 0,
      inspect: 0,
      reconcile: 0,
    });
  }
});

await check("recovery authority rejects a stale authenticated checkpoint head", async () => {
  const source = adapters();
  installFutureAuthority(source);
  await runQualification(qualificationInput(source));
  const prefixes = source.checkpoints.filter(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length > 0,
  );
  assert.ok(prefixes.length > 2);
  const stale = structuredClone(prefixes[0]);
  const current = structuredClone(prefixes.at(-1));
  const calls = { checkpoint: 0, authority: 0, inspect: 0, reconcile: 0 };
  const result = await recoverQualification({
    loadAuthoritativeState: async () => stale,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) => {
        calls.authority += 1;
        return {
          ...futureRecoveryAuthorityResponse(request, current),
          recovery_anchor_checkpoint_identity_sha256:
            current.checkpoint.checkpoint_identity_sha256,
          recovery_anchor_checkpoint_sequence: current.checkpoint.sequence,
          recovery_anchor_predecessor_identity_sha256:
            current.checkpoint.predecessor_checkpoint_identity_sha256,
        };
      },
    },
    checkpointRecoveryState: async (state, command) => {
      calls.checkpoint += 1;
      return exactCheckpointReceipt(command);
    },
    readCheckpointHead: async () => exactCheckpointHead(current),
    inspectOwnedResource: async () => {
      calls.inspect += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => {
      calls.reconcile += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(
    result,
    "RECOVERY_JOURNAL_IDENTITY_MISMATCH",
  );
  assert.equal(calls.checkpoint, 0);
  assert.equal(calls.authority, 0);
  assert.equal(calls.inspect, 0);
  assert.equal(calls.reconcile, 0);
});

await check("BEGIN_ATTEMPT resolved no-op without a receipt stops before every effect", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const result = await runQualification(
    qualificationInput(fake, {
      checkpoint: async () => undefined,
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "ATTEMPT_BEGIN_FAILED");
  assert.equal(fake.events.some((event) => event.startsWith("authority:")), false);
  assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
  assert.equal(fake.present.size, 0);
});

await check("checkpoint receipt rejects extra or substituted fields before every effect", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const result = await runQualification(
    qualificationInput(fake, {
      checkpoint: async (state, command) => ({
        schema_version: 1,
        status: "CHECKPOINT_COMMITTED",
        operation: command.operation,
        journal_identity_sha256: command.journal_identity_sha256,
        checkpoint_sequence: command.checkpoint_sequence,
        predecessor_checkpoint_identity_sha256:
          command.predecessor_checkpoint_identity_sha256,
        checkpoint_identity_sha256: command.checkpoint_identity_sha256,
        unreviewed_field: "forbidden",
      }),
    }),
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "ATTEMPT_BEGIN_FAILED");
  assert.equal(fake.events.some((event) => event.startsWith("authority:")), false);
  assert.equal(fake.present.size, 0);
});

await check("unreadable BEGIN write outcome returns an unknown recovery-needed projection", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let beginWritten = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (command.operation === "BEGIN_ATTEMPT") {
          await fake.commitCheckpoint(state, command);
          beginWritten = true;
          throw new Error(`Bearer ${"s".repeat(24)}`);
        }
        return fake.commitCheckpoint(state, command);
      },
      async readCheckpointHead() {
        throw new Error(`Bearer ${"r".repeat(24)}`);
      },
    }),
  );
  assert.equal(beginWritten, true);
  assertQualificationFailureProjection(
    result.state,
    "ATTEMPT_BEGIN_STATE_UNKNOWN",
  );
  assert.deepEqual(result.retained_resources, []);
  validateCompactEvidence(result.evidence);
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.evidence.recovery.status, "PENDING");
  assert.equal(result.evidence.outcome.code, "ATTEMPT_BEGIN_STATE_UNKNOWN");
  assert.equal(fake.events.some((event) => event.startsWith("authority:")), false);
  assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
  assert.equal(JSON.stringify(result).includes("Bearer"), false);
  assert.equal(JSON.stringify(result).includes("ssss"), false);
  assert.equal(JSON.stringify(result).includes("rrrr"), false);
});

await check("pre-existing exact BEGIN head remains ATTEMPT_ALREADY_EXISTS before every adapter", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let beginCalls = 0;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (command.operation === "BEGIN_ATTEMPT") {
          beginCalls += 1;
          fake.checkpointHeads.set(
            command.journal_identity_sha256,
            command.checkpoint_identity_sha256,
          );
          fake.checkpointStates.set(
            command.journal_identity_sha256,
            structuredClone(state),
          );
          throw Object.assign(new Error("pre-existing attempt"), {
            code: "ATTEMPT_ALREADY_EXISTS",
          });
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  assert.equal(beginCalls, 1);
  assertQualificationFailureProjection(result.state, "ATTEMPT_ALREADY_EXISTS");
  assert.equal(result.state.cleanup.verified, false);
  assert.equal(result.state.recovery.status, "PENDING");
  assert.equal(Object.hasOwn(result.state, "checkpoint"), false);
  assert.equal(Object.hasOwn(result.state, "journal_identity_sha256"), false);
  assert.equal(
    fake.events.some(
      (event) =>
        event.startsWith("authority:") ||
        event.startsWith("namespace:") ||
        event.startsWith("create:") ||
        event.startsWith("cleanup:"),
    ),
    false,
  );
  assert.equal(fake.present.size, 0);
});

await check("BEGIN_ATTEMPT write-then-throw remains unknown for reviewed recovery", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let injected = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const receipt = await fake.commitCheckpoint(state, command);
        if (!injected && command.operation === "BEGIN_ATTEMPT") {
          injected = true;
          throw new Error("synthetic begin write-then-throw");
        }
        return receipt;
      },
    }),
  );
  assert.equal(injected, true);
  assertQualificationFailureProjection(
    result.state,
    "ATTEMPT_BEGIN_STATE_UNKNOWN",
  );
  assert.equal(fake.events.some((event) => event.startsWith("authority:")), false);
  assert.equal(fake.events.some((event) => event.startsWith("create:")), false);
});

for (const beginResponse of [
  "GENERIC_CONFLICT",
  "MISSING_RECEIPT",
  "MALFORMED_RECEIPT",
]) {
  await check(
    `pre-existing identical BEGIN head with ${beginResponse} is never adopted`,
    async () => {
      const fake = adapters();
      installFutureAuthority(fake);
      let beginCalls = 0;
      const result = await runQualification(
        qualificationInput(fake, {
          async checkpoint(state, command) {
            if (command.operation !== "BEGIN_ATTEMPT") {
              return fake.commitCheckpoint(state, command);
            }
            beginCalls += 1;
            fake.checkpointHeads.set(
              command.journal_identity_sha256,
              command.checkpoint_identity_sha256,
            );
            fake.checkpointStates.set(
              command.journal_identity_sha256,
              structuredClone(state),
            );
            if (beginResponse === "GENERIC_CONFLICT") {
              throw new Error("synthetic generic begin conflict");
            }
            if (beginResponse === "MISSING_RECEIPT") return undefined;
            return {
              ...exactCheckpointReceipt(command),
              unreviewed_field: "forbidden",
            };
          },
        }),
      );
      assert.equal(beginCalls, 1, beginResponse);
      assertQualificationFailureProjection(
        result.state,
        "ATTEMPT_BEGIN_STATE_UNKNOWN",
      );
      assert.equal(
        fake.events.some(
          (event) =>
            event.startsWith("authority:") ||
            event.startsWith("fresh:") ||
            event.startsWith("create:") ||
            event.startsWith("cleanup:"),
        ),
        false,
        beginResponse,
      );
    },
  );
}

const preEffectCrashScenarios = [
  {
    name: "immediately after BEGIN",
    prefixRequestsUsed: 0,
    stop: "AUTHORITY_BEFORE_RESPONSE",
    authorityResponses: 0,
    namespaceResponses: 0,
  },
  {
    name: "after authority reservation",
    prefixRequestsUsed: 1,
    stop: "AUTHORITY_BEFORE_RESPONSE",
    authorityResponses: 0,
    namespaceResponses: 0,
  },
  {
    name: "after authority response",
    prefixRequestsUsed: 1,
    stop: "NAMESPACE_RESERVATION",
    authorityResponses: 1,
    namespaceResponses: 0,
  },
  {
    name: "after namespace reservation",
    prefixRequestsUsed: 2,
    stop: "NAMESPACE_BEFORE_RESPONSE",
    authorityResponses: 1,
    namespaceResponses: 0,
  },
  {
    name: "after namespace response",
    prefixRequestsUsed: 2,
    stop: "FIRST_CREATE_RESERVATION",
    authorityResponses: 1,
    namespaceResponses: 1,
  },
];

for (const scenario of preEffectCrashScenarios) {
  await check(`${scenario.name} recovers the same durable attempt with zero creates`, async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    let authorityResponses = 0;
    let namespaceResponses = 0;
    const verifyAuthority = fake.contract.authority.verifyAuthorityEnvelope;
    fake.contract.authority.verifyAuthorityEnvelope = async (request) => {
      if (scenario.stop === "AUTHORITY_BEFORE_RESPONSE") {
        throw new Error("synthetic process loss before authority response");
      }
      const response = await verifyAuthority(request);
      authorityResponses += 1;
      return response;
    };
    const verifyNamespace = fake.contract.namespace.verifyFresh;
    fake.contract.namespace.verifyFresh = async (request) => {
      if (scenario.stop === "NAMESPACE_BEFORE_RESPONSE") {
        throw new Error("synthetic process loss before namespace response");
      }
      const response = await verifyNamespace(request);
      namespaceResponses += 1;
      return response;
    };
    await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          const stopBeforeNamespaceReservation =
            scenario.stop === "NAMESPACE_RESERVATION" &&
            command.operation === "CAS_CHECKPOINT" &&
            state.budgets.requests.used === 2 &&
            state.budgets.mutations.used === 0 &&
            state.effect_ledger.length === 0;
          const stopBeforeFirstCreateIntent =
            scenario.stop === "FIRST_CREATE_RESERVATION" &&
            command.operation === "CAS_CHECKPOINT" &&
            state.budgets.requests.used === 2 &&
            state.budgets.mutations.used === 0 &&
            state.effect_ledger.length === 1 &&
            state.effect_ledger[0].status === "INTENT_ONLY";
          if (stopBeforeNamespaceReservation || stopBeforeFirstCreateIntent) {
            throw new Error("synthetic process loss before next reservation commit");
          }
          return fake.commitCheckpoint(state, command);
        },
      }),
    );
    assert.equal(authorityResponses, scenario.authorityResponses);
    assert.equal(namespaceResponses, scenario.namespaceResponses);
    const prefix = fake.checkpoints.find(
      (state) =>
        state.budgets.requests.used === scenario.prefixRequestsUsed &&
        state.budgets.mutations.used === 0 &&
        state.owned_resources.length === 0 &&
        state.effect_ledger.length === 0,
    );
    assert.ok(prefix, scenario.name);
    assert.equal(
      prefix.lifecycle_state,
      scenario.prefixRequestsUsed === 0 ? "READY" : "QUALIFYING",
      scenario.name,
    );
    assert.equal(prefix.run_id, RUN_ID);
    assert.equal(prefix.outcome.successful, true);
    const journal = prefix.journal_identity_sha256;
    fake.checkpointHeads.set(journal, prefix.checkpoint.checkpoint_identity_sha256);
    fake.checkpointStates.set(journal, structuredClone(prefix));
    const adapterEventsBeforeDuplicate = fake.events.filter(
      (event) =>
        event.startsWith("authority:") ||
        event.startsWith("namespace:") ||
        event.startsWith("fresh:") ||
        event.startsWith("create:"),
    ).length;
    const duplicate = await runQualification(qualificationInput(fake));
    assertQualificationFailureProjection(
      duplicate.state,
      "ATTEMPT_ALREADY_EXISTS",
    );
    assert.equal(
      fake.events.filter(
        (event) =>
          event.startsWith("authority:") ||
          event.startsWith("namespace:") ||
          event.startsWith("fresh:") ||
          event.startsWith("create:"),
      ).length,
      adapterEventsBeforeDuplicate,
    );
    let recoveryAuthorityCalls = 0;
    let inspections = 0;
    let reconciliations = 0;
    const recovered = await recoverQualification({
      loadAuthoritativeState: async () =>
        structuredClone(fake.checkpointStates.get(journal)),
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        async verifyReviewedRecoveryAuthorization(request) {
          recoveryAuthorityCalls += 1;
          return futureRecoveryAuthorityResponse(request, prefix);
        },
      },
      checkpointRecoveryState: async (state, command) =>
        fake.commitCheckpoint(state, command),
      readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      inspectOwnedResource: async (_resource, context) => {
        inspections += 1;
        return {
          status: "ABSENT",
          operation_slot_sha256:
            context.operation_slot.operation_slot_sha256,
          operation_binding_sha256: context.operation_binding_sha256,
        };
      },
      reconcileOwnedResource: async () => {
        reconciliations += 1;
        throw new Error("pre-effect recovery must not reconcile resources");
      },
    });
    assert.equal(recoveryAuthorityCalls, 1);
    assert.equal(inspections, 5);
    assert.equal(reconciliations, 0);
    assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
    assert.equal(recovered.run_id, RUN_ID);
    assert.equal(recovered.journal_identity_sha256, journal);
    assert.equal(recovered.recovery.status, "COMPLETE");
    assert.deepEqual(recovered.cleanup, { required: false, verified: true });
    assert.deepEqual(recovered.owned_resources, []);
    assert.deepEqual(recovered.effect_ledger, []);
    assert.equal(recovered.outcome.code, "RESUME_AUTHORIZED");
    assert.equal(recovered.outcome.successful, true);
    assert.equal(
      fake.events.filter((event) => event.startsWith("create:")).length,
      0,
    );
    validateCheckpointProtocol(recovered);
    assert.equal(
      fake.checkpointStates.get(journal).checkpoint.checkpoint_identity_sha256,
      recovered.checkpoint.checkpoint_identity_sha256,
    );
  });
}

await check("durable owned intent before create reservation recovers absent with zero creates", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let injected = false;
  let durablePrefix;
  const interrupted = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (
          !injected &&
          state.lifecycle_state === "QUALIFYING" &&
          state.budgets.requests.used === 2 &&
          state.budgets.mutations.used === 0 &&
          state.effect_ledger.length === 1 &&
          state.effect_ledger[0].status === "INTENT_ONLY"
        ) {
          const receipt = await fake.commitCheckpoint(state, command);
          durablePrefix = structuredClone(
            fake.checkpointStates.get(state.journal_identity_sha256),
          );
          injected = true;
          throw new Error("synthetic process loss after durable creation intent");
        }
        if (injected) {
          throw new Error("synthetic checkpoint outage after process loss");
        }
        return fake.commitCheckpoint(state, command);
      },
      async readCheckpointHead(request) {
        if (injected) {
          throw new Error("synthetic head outage after process loss");
        }
        return fake.readCheckpointHead(request);
      },
    }),
  );
  assert.equal(injected, true);
  assertQualificationFailureProjection(
    interrupted.state,
    "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
  );
  assert.ok(durablePrefix);
  assert.equal(durablePrefix.owned_resources.length, 1);
  assert.equal(durablePrefix.effect_ledger[0].status, "INTENT_ONLY");
  assert.equal(durablePrefix.budgets.mutations.used, 0);
  const createSlot = qualificationOperationSlot(
    durablePrefix,
    "mutations",
    0,
    "QUALIFICATION_CREATE_NEW",
    durablePrefix.owned_resources[0].resource_key,
  );
  assert.equal(createSlot.status, "NOT_STARTED");
  assert.equal(
    fake.events.filter((event) => event.startsWith("create:")).length,
    0,
  );

  let inspections = 0;
  let reconciliations = 0;
  const recovered = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durablePrefix),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        return futureRecoveryAuthorityResponse(request, durablePrefix);
      },
    },
    checkpointRecoveryState: async (state, command) =>
      fake.commitCheckpoint(state, command),
    readCheckpointHead: async (request) => fake.readCheckpointHead(request),
    inspectOwnedResource: async (_resource, context) => {
      inspections += 1;
      return {
        status: "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      throw new Error("an absent pre-create intent must not be deleted");
    },
  });
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
  assert.equal(recovered.recovery.status, "COMPLETE");
  assert.equal(inspections, 5);
  assert.equal(reconciliations, 0);
  assert.equal(
    fake.events.filter((event) => event.startsWith("create:")).length,
    0,
  );
});

await check("intermediate checkpoint write-then-throw reconciles before the next effect", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let injected = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const receipt = await fake.commitCheckpoint(state, command);
        if (
          !injected &&
          state.lifecycle_state === "QUALIFYING" &&
          state.effect_ledger.length === 1 &&
          state.effect_ledger[0].status === "INTENT_ONLY"
        ) {
          injected = true;
          throw new Error("synthetic intermediate write-then-throw");
        }
        return receipt;
      },
    }),
  );
  assert.equal(result.state.lifecycle_state, "QUALIFIED");
  assert.equal(result.state.outcome.code, "QUALIFIED");
  assert.equal(injected, true);
});

await check("terminal QUALIFIED write-then-throw never compensates a committed success", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let injected = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const receipt = await fake.commitCheckpoint(state, command);
        if (!injected && state.lifecycle_state === "QUALIFIED") {
          injected = true;
          throw new Error("synthetic terminal success write-then-throw");
        }
        return receipt;
      },
    }),
  );
  const durable = [...fake.checkpointStates.values()].at(-1);
  assert.equal(result.state.lifecycle_state, "QUALIFIED");
  assert.equal(durable.lifecycle_state, "QUALIFIED");
  assert.equal(
    durable.checkpoint.checkpoint_identity_sha256,
    result.state.checkpoint.checkpoint_identity_sha256,
  );
  assert.equal(
    [...fake.present].filter((key) => key.includes(":PREVIEW_DEPLOYMENT:")).length,
    1,
  );
  assert.equal(
    result.state.effect_ledger.some((entry) => entry.cleanup_status === "RETAINED"),
    true,
  );
});

await check("durable terminal QUALIFIED survives acknowledgement and immediate read outage", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let durableTerminalWritten = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (state.lifecycle_state === "QUALIFIED") {
          await fake.commitCheckpoint(state, command);
          durableTerminalWritten = true;
          throw new Error("synthetic terminal acknowledgement loss");
        }
        return fake.commitCheckpoint(state, command);
      },
      readCheckpointHead: async () => {
        throw new Error("synthetic authoritative head outage");
      },
    }),
  );
  const durable = [...fake.checkpointStates.values()].at(-1);
  assertQualificationFailureProjection(
    result.state,
    "TERMINAL_CHECKPOINT_STATE_UNKNOWN",
  );
  assert.deepEqual(result.retained_resources, []);
  validateCompactEvidence(result.evidence);
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(
    result.evidence.outcome.code,
    "TERMINAL_CHECKPOINT_STATE_UNKNOWN",
  );
  assert.equal(
    [...fake.present].filter((key) => key.includes(":PREVIEW_DEPLOYMENT:")).length,
    1,
  );
  assert.equal(durableTerminalWritten, true);
  assert.equal(durable.lifecycle_state, "QUALIFIED");
  assert.equal(durable.recovery.status, "NOT_REQUIRED");
  validateCheckpointProtocol(durable);

  const calls = { authority: 0, checkpoint: 0, inspect: 0, reconcile: 0 };
  const admitted = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async () => {
        calls.authority += 1;
        throw new Error("terminal admission must not request a new grant");
      },
    },
    checkpointRecoveryState: async () => {
      calls.checkpoint += 1;
      throw new Error("terminal admission must be read-only");
    },
    readCheckpointHead: async () => exactCheckpointHead(durable),
    inspectOwnedResource: async () => {
      calls.inspect += 1;
      throw new Error("terminal admission must not inspect");
    },
    reconcileOwnedResource: async () => {
      calls.reconcile += 1;
      throw new Error("terminal admission must not reconcile");
    },
  });
  assert.equal(admitted.state.lifecycle_state, "QUALIFIED");
  assert.equal(
    admitted.state.checkpoint.checkpoint_identity_sha256,
    durable.checkpoint.checkpoint_identity_sha256,
  );
  assert.equal(admitted.retained_resources.length, 1);
  assert.equal(admitted.retained_resources[0].resource_type, "PREVIEW_DEPLOYMENT");
  validateCompactEvidence(admitted.evidence);
  assert.equal(
    admitted.evidence.evidence_identity_sha256,
    durable.final_evidence_identity_sha256,
  );
  assert.deepEqual(calls, { authority: 0, checkpoint: 0, inspect: 0, reconcile: 0 });
});

await check("terminal failure write-then-throw preserves exact physical zero and durable failure", async () => {
  const fake = adapters({ failCreateType: "PREVIEW_DEPLOYMENT" });
  installFutureAuthority(fake);
  let injected = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const receipt = await fake.commitCheckpoint(state, command);
        if (!injected && state.lifecycle_state === "FAILED_CLOSED") {
          injected = true;
          throw new Error("synthetic terminal failure write-then-throw");
        }
        return receipt;
      },
    }),
  );
  const durable = [...fake.checkpointStates.values()].at(-1);
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(durable.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.cleanup.verified, true);
  assert.equal(fake.present.size, 0);
  assert.equal(
    durable.checkpoint.checkpoint_identity_sha256,
    result.state.checkpoint.checkpoint_identity_sha256,
  );
});

await check("same-run restart cannot replay pre-compensation receipts into success", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const cache = new Map();
  const oneUse = (operation) => async (...args) => {
    const context = args.find(
      (value) => value?.operation_slot?.operation_slot_sha256,
    );
    const slot = context?.operation_slot?.operation_slot_sha256;
    if (slot && cache.has(slot)) return structuredClone(cache.get(slot));
    const result = await operation(...args);
    if (slot) cache.set(slot, structuredClone(result));
    return result;
  };
  fake.contract.authority.verifyAuthorityEnvelope = oneUse(
    fake.contract.authority.verifyAuthorityEnvelope,
  );
  fake.contract.namespace.verifyFresh = oneUse(fake.contract.namespace.verifyFresh);
  fake.contract.staging.verifyReadOnly = oneUse(fake.contract.staging.verifyReadOnly);
  fake.contract.finalCleanup.verify = oneUse(fake.contract.finalCleanup.verify);
  for (const adapter of [
    fake.contract.branch,
    fake.contract.preview,
    fake.contract.environment,
    fake.contract.fixture,
  ]) {
    adapter.create = oneUse(adapter.create);
    adapter.cleanup = oneUse(adapter.cleanup);
  }
  fake.contract.storage.cleanupExactVersion = oneUse(
    fake.contract.storage.cleanupExactVersion,
  );

  let rejectTerminal = true;
  const input = qualificationInput(fake, {
    async checkpoint(state, command) {
      if (rejectTerminal && state.lifecycle_state === "QUALIFIED") {
        throw new Error("synthetic terminal failure");
      }
      return fake.commitCheckpoint(state, command);
    },
  });
  const first = await runQualification(input);
  assert.equal(first.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(first.state.recovery.status, "NOT_REQUIRED");
  assert.equal(
    [...fake.present].filter((key) => key.includes(":PREVIEW_DEPLOYMENT:")).length,
    0,
  );

  rejectTerminal = false;
  const second = await runQualification(input);
  assert.notEqual(second.state.lifecycle_state, "QUALIFIED");
  assert.deepEqual(second.retained_resources, []);
  assert.equal(
    [...fake.present].filter((key) => key.includes(":PREVIEW_DEPLOYMENT:")).length,
    0,
  );
});

await check("divergent self-consistent injected evidence cannot become terminal", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  fake.contract.evidence = {
    async build(payload) {
      return buildCompactEvidence({
        ...structuredClone(payload),
        outcome: { code: "DIVERGENT_STORY", successful: true },
      });
    },
  };
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "EVIDENCE_FINALIZATION_FAILED");
  assert.deepEqual(result.retained_resources, []);
  assert.equal(fake.present.size, 0);
  assert.notEqual(result.evidence.outcome.code, "DIVERGENT_STORY");
  assert.equal(
    result.state.final_evidence_identity_sha256,
    result.evidence.evidence_identity_sha256,
  );
  assert.equal(
    fake.checkpoints.at(-1).final_evidence_identity_sha256,
    result.evidence.evidence_identity_sha256,
  );
});

await check("malformed create receipt is uncertain and exactly compensated", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const create = fake.contract.branch.create;
  fake.contract.branch.create = async (...args) => ({
    ...(await create(...args)),
    unvalidated_detail: undefined,
  });
  const result = await runQualification(qualificationInput(fake));
  const branch = result.state.owned_resources.find(
    (resource) => resource.resource_type === "GIT_BRANCH",
  );
  const entry = result.state.effect_ledger.find(
    (candidate) => candidate.resource_key === branch?.resource_key,
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.outcome.code, "RESOURCE_CREATE_UNCONFIRMED");
  assert.equal(entry.status, "CLEANED");
  assert.equal(entry.cleanup_status, "VERIFIED");
  assert.equal(
    fake.events.filter((event) => event.startsWith("cleanup:GIT_BRANCH:")).length,
    1,
  );
  assert.equal(fake.present.size, 0);
});

await check("Round23 qualification emits authentic response-loss cleanup prefixes", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const create = fake.contract.branch.create;
  fake.contract.branch.create = async (...args) => ({
    ...(await create(...args)),
    unvalidated_detail: undefined,
  });
  const result = await runQualification(qualificationInput(fake));
  const terminalBranch = result.state.owned_resources.find(
    (resource) => resource.resource_type === "GIT_BRANCH",
  );
  assert.ok(terminalBranch);

  for (const cleanupStatus of ["APPLIED", "VERIFIED"]) {
    const prefix = fake.checkpoints.find((state) => {
      const planIndex = state.resource_plan.findIndex(
        (resource) => resource.resource_key === terminalBranch.resource_key,
      );
      const creation = qualificationOperationSlot(
        state,
        "mutations",
        planIndex,
        "QUALIFICATION_CREATE_NEW",
        terminalBranch.resource_key,
      );
      const deletion = qualificationOperationSlot(
        state,
        "mutations",
        5 + planIndex,
        "QUALIFICATION_DELETE_EXACT",
        terminalBranch.resource_key,
      );
      const entry = state.effect_ledger.find(
        (candidate) => candidate.resource_key === terminalBranch.resource_key,
      );
      return (
        state.lifecycle_state === "QUALIFYING" &&
        creation?.status === "RESERVED" &&
        creation.receipt === null &&
        creation.receipt_sha256 === null &&
        deletion?.status === "RESULT_APPLIED" &&
        deletion.receipt?.status === "DELETED_EXACT" &&
        entry?.status === "CLEANED" &&
        entry.cleanup_status === cleanupStatus &&
        entry.creation_receipt_sha256 === null
      );
    });
    assert.ok(prefix, cleanupStatus);
    validateRecoveryState(prefix);
    const planIndex = prefix.resource_plan.findIndex(
      (resource) => resource.resource_key === terminalBranch.resource_key,
    );
    const creation = qualificationOperationSlot(
      prefix,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      terminalBranch.resource_key,
    );
    const deletion = qualificationOperationSlot(
      prefix,
      "mutations",
      5 + planIndex,
      "QUALIFICATION_DELETE_EXACT",
      terminalBranch.resource_key,
    );
    const entry = prefix.effect_ledger.find(
      (candidate) => candidate.resource_key === terminalBranch.resource_key,
    );
    assert.equal(entry.creation_operation_slot_sha256, creation.operation_slot_sha256);
    assert.equal(deletion.receipt.resource_key, terminalBranch.resource_key);
    assert.equal(
      deletion.receipt.locator_sha256,
      terminalBranch.owner.locator_sha256,
    );
  }
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(fake.present.size, 0);
});

await check("selective checkpoint retries never alias operation slots", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const cache = new Map();
  const coordinates = new Map();
  const collisions = [];
  let missingSequence = 0;
  let actualRequests = 0;
  let actualMutations = 0;
  const oneUse = (category, operation) => async (...args) => {
    const context = args.find(
      (value) => value?.operation_slot?.operation_slot_sha256,
    );
    const slot = context?.operation_slot;
    const key = slot?.operation_slot_sha256 ?? `missing-${missingSequence += 1}`;
    if (cache.has(key)) return structuredClone(cache.get(key));
    if (slot) {
      const coordinate = `${category}:${slot.index}`;
      const previous = coordinates.get(coordinate);
      if (previous && previous !== key) collisions.push([coordinate, previous, key]);
      coordinates.set(coordinate, key);
    }
    if (category === "requests") actualRequests += 1;
    else actualMutations += 1;
    const result = await operation(...args);
    cache.set(key, structuredClone(result));
    return result;
  };
  fake.contract.authority.verifyAuthorityEnvelope = oneUse(
    "requests",
    fake.contract.authority.verifyAuthorityEnvelope,
  );
  fake.contract.namespace.verifyFresh = oneUse(
    "requests",
    fake.contract.namespace.verifyFresh,
  );
  fake.contract.staging.verifyReadOnly = oneUse(
    "requests",
    fake.contract.staging.verifyReadOnly,
  );
  fake.contract.finalCleanup.verify = oneUse(
    "requests",
    fake.contract.finalCleanup.verify,
  );
  for (const adapter of [
    fake.contract.branch,
    fake.contract.preview,
    fake.contract.environment,
    fake.contract.fixture,
  ]) {
    adapter.create = oneUse("mutations", adapter.create);
    adapter.cleanup = oneUse("mutations", adapter.cleanup);
  }
  fake.contract.storage.cleanupExactVersion = oneUse(
    "mutations",
    fake.contract.storage.cleanupExactVersion,
  );

  const selectiveFailures = [
    (state) =>
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "INTENT_ONLY" &&
      state.effect_ledger[0].cleanup_status === "PENDING",
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.owned_resources.length === 5 &&
      state.budgets.requests.used === 3 &&
      state.effect_ledger.every((entry) => entry.status === "APPLIED"),
    () => false,
  ];
  for (const [scenarioIndex, shouldFail] of selectiveFailures.entries()) {
    coordinates.clear();
    const requestsBefore = actualRequests;
    const mutationsBefore = actualMutations;
    let failed = false;
    await runQualification(
      qualificationInput(fake, {
        run_id: `qualification-run-selective-${scenarioIndex + 1}`,
        async checkpoint(state, command) {
          if (!failed && shouldFail(state)) {
            failed = true;
            throw new Error("selective checkpoint rejection");
          }
          return fake.commitCheckpoint(state, command);
        },
      }),
    );
    assert.equal(failed, scenarioIndex < 2);
    assert.ok(
      actualRequests - requestsBefore <= 16,
      `scenario ${scenarioIndex} actual requests ${actualRequests - requestsBefore}`,
    );
    assert.ok(
      actualMutations - mutationsBefore <= 15,
      `scenario ${scenarioIndex} actual mutations ${actualMutations - mutationsBefore}`,
    );
  }
  assert.deepEqual(collisions, []);
  assert.ok(actualRequests > 0, "selective scenarios must invoke request adapters");
  assert.ok(actualMutations > 0, "selective scenarios must invoke mutation adapters");
});

await check("low-level recovery rejects callers without an exact current-head grant capability", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  await runQualification(qualificationInput(fake));
  const prefix = fake.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "APPLIED",
  );
  assert.ok(prefix);
  const journal = prefix.journal_identity_sha256;
  fake.checkpointHeads.set(journal, prefix.checkpoint.checkpoint_identity_sha256);
  fake.checkpointStates.set(journal, structuredClone(prefix));
  let inspections = 0;
  let reconciliations = 0;
  const result = await reconcileRecovery({
    loadAuthoritativeState: async () => structuredClone(prefix),
    expectedCandidateIdentity: CANDIDATE,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    checkpointRecoveryState: async (state, command) =>
      fake.commitCheckpoint(state, command),
    readCheckpointHead: async (request) => fake.readCheckpointHead(request),
    inspectOwnedResource: async () => {
      inspections += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assertRecoveryFailureProjection(result, "RECOVERY_CAPABILITY_REQUIRED");
  assert.equal(inspections, 0);
  assert.equal(reconciliations, 0);
});

for (const scenario of [
  {
    name: "inspection exception",
    expectedCode: "INSPECTION_FAILED",
    initialPresent: true,
    inspect: async () => {
      throw new Error("synthetic inspection failure");
    },
  },
  {
    name: "cleanup exception",
    expectedCode: "RECONCILIATION_FAILED",
    initialPresent: true,
    inspect: async () => "PRESENT",
    reconcile: async () => {
      throw new Error("synthetic cleanup failure");
    },
  },
  {
    name: "post-cleanup verification rejection",
    expectedCode: "CLEANUP_VERIFICATION_FAILED",
    initialPresent: true,
    inspect: async () => "PRESENT",
    reconcile: async () => "DELETED_EXACT",
  },
  {
    name: "terminal READY checkpoint rejection",
    expectedCode: "RECOVERY_TERMINAL_CHECKPOINT_FAILED",
    initialPresent: false,
    inspect: async () => "ABSENT",
    rejectTerminal: true,
  },
]) {
  await check(`post-head recovery ${scenario.name} returns only a non-journal projection`, async () => {
    const fake = adapters();
    installFutureAuthority(fake);
    await runQualification(qualificationInput(fake));
    const prefix = fake.checkpoints.find(
      (state) =>
        state.lifecycle_state === "QUALIFYING" &&
        state.effect_ledger.length === 1 &&
        state.effect_ledger[0].status === "APPLIED",
    );
    assert.ok(prefix);
    const journal = prefix.journal_identity_sha256;
    fake.checkpointHeads.set(journal, prefix.checkpoint.checkpoint_identity_sha256);
    fake.checkpointStates.set(journal, structuredClone(prefix));
    fake.present.clear();
    if (scenario.initialPresent) {
      fake.present.add(prefix.owned_resources[0].resource_key);
    }
    let inspectionCount = 0;
    let reconciliationCount = 0;
    const binding = (context) => ({
      operation_slot_sha256: context.operation_slot.operation_slot_sha256,
      operation_binding_sha256: context.operation_binding_sha256,
    });
    const result = await recoverQualification({
      loadAuthoritativeState: async () =>
        structuredClone(fake.checkpointStates.get(journal)),
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        async verifyReviewedRecoveryAuthorization(request) {
          return futureRecoveryAuthorityResponse(request, prefix);
        },
      },
      async checkpointRecoveryState(state, command) {
        if (scenario.rejectTerminal && state.lifecycle_state === "READY") {
          throw new Error("synthetic terminal rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
      readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      inspectOwnedResource: async (resource, context) => {
        inspectionCount += 1;
        const represented = prefix.effect_ledger.some(
          (entry) => entry.resource_key === resource.resource_key,
        );
        const status = represented
          ? await scenario.inspect(resource, context)
          : "ABSENT";
        return {
          status,
          ...(status === "PRESENT"
            ? {
                creation_operation_slot_sha256:
                  prefix.effect_ledger[0].creation_operation_slot_sha256,
              }
            : {}),
          ...binding(context),
        };
      },
      reconcileOwnedResource: async (resource, cas, context) => {
        reconciliationCount += 1;
        const status = scenario.reconcile
          ? await scenario.reconcile(resource, cas, context)
          : "DELETED_EXACT";
        return {
          status,
          resource_key: resource.resource_key,
          locator_sha256: resource.owner.locator_sha256,
          ...binding(context),
        };
      },
    });
    assertRecoveryFailureProjection(result, scenario.expectedCode);
    assert.ok(inspectionCount > 0);
    if (scenario.name === "inspection exception") {
      assert.equal(reconciliationCount, 0);
    }
  });
}

await check("latest-head recovery reuses one-use receipts across every crash window", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const qualified = await runQualification(qualificationInput(fake));
  assert.equal(qualified.state.lifecycle_state, "QUALIFIED");
  const recoverablePrefix = fake.checkpoints.find(
    (state) =>
      state.lifecycle_state === "QUALIFYING" &&
      state.effect_ledger.length === 1 &&
      state.effect_ledger[0].status === "APPLIED",
  );
  assert.ok(recoverablePrefix);
  const journal = recoverablePrefix.journal_identity_sha256;
  fake.checkpointHeads.set(
    journal,
    recoverablePrefix.checkpoint.checkpoint_identity_sha256,
  );
  fake.checkpointStates.set(journal, structuredClone(recoverablePrefix));
  fake.present.clear();
  fake.present.add(recoverablePrefix.owned_resources[0].resource_key);

  const cache = new Map();
  const actual = { requests: 0, mutations: 0, deletes: 0 };
  const invoked = { requests: 0, mutations: 0 };
  let fallbackBinding = 0;
  const oneUse = (category, operation) => async (...args) => {
    invoked[category] += 1;
    const context = args.find(
      (value) => value?.operation_binding_sha256 || value?.operation_slot,
    );
    const binding =
      context?.operation_binding_sha256 ??
      context?.operation_slot?.operation_slot_sha256 ??
      `missing-binding-${fallbackBinding += 1}`;
    const key = `${category}:${binding}`;
    if (cache.has(key)) return structuredClone(cache.get(key));
    actual[category] += 1;
    const result = await operation(...args);
    cache.set(key, structuredClone(result));
    return result;
  };
  const receiptBinding = (context) => ({
    operation_slot_sha256: context.operation_slot.operation_slot_sha256,
    ...(context.operation_binding_sha256
      ? { operation_binding_sha256: context.operation_binding_sha256 }
      : { checkpoint_identity_sha256: context.checkpoint_identity_sha256 }),
  });
  const crashed = new Set();
  const crashTargets = new Set([
    "VERIFY_RECOVERY_AUTHORITY",
    "RECOVERY_INSPECT",
    "RECOVERY_DELETE_EXACT",
    "RECOVERY_VERIFY_ABSENT",
  ]);
  const loadedHeads = [];
  const attemptedRecoveryCheckpoints = [];
  let terminalReadOutage = false;
  let terminalFailureObserved = false;
  let invocationsAtTerminalWrite = null;
  let result;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    result = await recoverQualification({
      loadAuthoritativeState: async () => {
        const loaded = structuredClone(fake.checkpointStates.get(journal));
        loadedHeads.push(loaded.checkpoint.checkpoint_identity_sha256);
        return loaded;
      },
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        verifyReviewedRecoveryAuthorization: oneUse(
          "requests",
          async (request) =>
            futureRecoveryAuthorityResponse(request, recoverablePrefix),
        ),
      },
      async checkpointRecoveryState(state, command) {
        attemptedRecoveryCheckpoints.push(structuredClone(state));
        const receiptKnown = state.recovery_operation_state?.operation_slots?.find(
          (slot) =>
            ((slot.operation === "VERIFY_RECOVERY_AUTHORITY" &&
              slot.status === "RESULT_APPLIED") ||
              (slot.operation !== "VERIFY_RECOVERY_AUTHORITY" &&
                slot.status === "RECEIPT_KNOWN")) &&
            crashTargets.has(slot.operation) &&
            !crashed.has(slot.operation),
        );
        if (receiptKnown) {
          crashed.add(receiptKnown.operation);
          throw new Error(`synthetic ${receiptKnown.operation} receipt checkpoint loss`);
        }
        if (state.lifecycle_state === "READY" && !crashed.has("TERMINAL_READY")) {
          crashed.add("TERMINAL_READY");
          await fake.commitCheckpoint(state, command);
          terminalReadOutage = true;
          invocationsAtTerminalWrite = structuredClone(invoked);
          throw new Error("synthetic durable terminal READY acknowledgement loss");
        }
        return fake.commitCheckpoint(state, command);
      },
      readCheckpointHead: async (request) => {
        if (terminalReadOutage) {
          terminalReadOutage = false;
          throw new Error("synthetic immediate terminal head outage");
        }
        return fake.readCheckpointHead(request);
      },
      inspectOwnedResource: oneUse("requests", async (resource, context) => ({
        status: fake.present.has(resource.resource_key) ? "PRESENT" : "ABSENT",
        ...(fake.present.has(resource.resource_key)
          ? {
              creation_operation_slot_sha256:
                recoverablePrefix.effect_ledger.find(
                  (entry) => entry.resource_key === resource.resource_key,
                ).creation_operation_slot_sha256,
            }
          : {}),
        ...receiptBinding(context),
      })),
      reconcileOwnedResource: oneUse(
        "mutations",
        async (resource, cas, context) => {
          actual.deletes += 1;
          fake.present.delete(resource.resource_key);
          return {
            status: "DELETED_EXACT",
            resource_key: resource.resource_key,
            locator_sha256: resource.owner.locator_sha256,
            ...receiptBinding(context),
          };
        },
      ),
    });
    if (
      crashed.has("TERMINAL_READY") &&
      result?.outcome?.code === "RECOVERY_TERMINAL_CHECKPOINT_FAILED"
    ) {
      terminalFailureObserved = true;
    }
    if (result.lifecycle_state === "READY") break;
  }
  const durable = fake.checkpointStates.get(journal);
  assert.equal(result.lifecycle_state, "READY");
  assert.equal(durable.lifecycle_state, "READY");
  assert.equal(durable.recovery.status, "COMPLETE");
  assert.deepEqual(
    crashed,
    new Set([
      "VERIFY_RECOVERY_AUTHORITY",
      "RECOVERY_INSPECT",
      "RECOVERY_DELETE_EXACT",
      "RECOVERY_VERIFY_ABSENT",
      "TERMINAL_READY",
    ]),
  );
  assert.ok(new Set(loadedHeads).size > 4, "retries must load advancing heads");
  assert.equal(actual.deletes, 1);
  assert.equal(terminalFailureObserved, true);
  assert.ok(invocationsAtTerminalWrite);
  assert.deepEqual(invoked, invocationsAtTerminalWrite);
  assert.ok(actual.requests <= 7, `actual recovery requests ${actual.requests}`);
  assert.ok(actual.mutations <= 1, `actual recovery mutations ${actual.mutations}`);
  assert.ok(durable.budgets.requests.used <= 16);
  assert.ok(durable.budgets.mutations.used <= 15);
  const appliedOperations = durable.recovery_operation_state.operation_slots
    .filter((slot) => slot.status === "RESULT_APPLIED")
    .map((slot) => slot.operation);
  for (const operation of crashTargets) assert.ok(appliedOperations.includes(operation));
  const progressedStates = attemptedRecoveryCheckpoints.filter((state) =>
    state.recovery_operation_state.operation_slots.some(
      (slot) => slot.status !== "NOT_STARTED",
    ),
  );
  assert.ok(progressedStates.length > 0);
  for (const state of progressedStates) {
    const authoritySlot = state.recovery_operation_state.operation_slots.find(
      (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
    );
    const grant = state.recovery_operation_state.recovery_grant;
    assert.equal(state.authorization_class, "RECOVERY_CONTROLLER");
    assert.deepEqual(Object.keys(grant).sort(), [
      "authorization_class",
      "authority_receipt_sha256",
      "recovery_anchor_checkpoint_identity_sha256",
      "review_sha256",
    ].sort());
    assert.equal(grant.authorization_class, "RECOVERY_CONTROLLER");
    assert.equal(grant.review_sha256, ACTIVATION_REVIEW_SHA256);
    assert.equal(grant.authority_receipt_sha256, authoritySlot.receipt_sha256);
    assert.equal(
      grant.recovery_anchor_checkpoint_identity_sha256,
      state.recovery_operation_state.recovery_anchor.checkpoint_identity_sha256,
    );
    assert.ok(
      state.transition_history.some(
        (entry) =>
          entry.to === "FAILED_RECOVERABLE" &&
          entry.authorization_class === "RECOVERY_CONTROLLER" &&
          entry.review_sha256 === ACTIVATION_REVIEW_SHA256,
      ),
    );
  }
  const terminalAttempt = attemptedRecoveryCheckpoints.find(
    (state) => state.lifecycle_state === "READY",
  );
  assert.ok(terminalAttempt);
  assert.deepEqual(terminalAttempt.transition_history.at(-1), {
    from: "FAILED_RECOVERABLE",
    to: "READY",
    authorization_class: "RECOVERY_CONTROLLER",
    review_sha256: ACTIVATION_REVIEW_SHA256,
  });
});

const exactGrantedTerminal = await exactGrantedRecoveryTerminalFixture();
for (const scenario of [
  {
    name: "erased resource-operation proof and counters lowered to authority only",
    mutate(state) {
      for (const slot of state.recovery_operation_state.operation_slots) {
        if (slot.operation !== "VERIFY_RECOVERY_AUTHORITY") {
          resetRecoveryOperationSlot(slot);
        }
      }
      state.budgets.requests.used = 1;
      state.budgets.mutations.used = 0;
    },
  },
  {
    name: "missing post-delete absence receipt with matching lower request count",
    mutate(state) {
      const verificationSlot =
        state.recovery_operation_state.operation_slots.find(
          (slot) => slot.operation === "RECOVERY_VERIFY_ABSENT",
        );
      assert.equal(verificationSlot.status, "RESULT_APPLIED");
      resetRecoveryOperationSlot(verificationSlot);
      state.budgets.requests.used -= 1;
    },
  },
  {
    name: "initial ABSENT receipt followed by a delete receipt",
    mutate(state) {
      rewriteRecoveryOperationReceipt(state, "RECOVERY_INSPECT", (receipt) => ({
        ...receipt,
        status: "ABSENT",
      }));
    },
  },
  {
    name: "initial inspection substitutes its creation operation slot",
    mutate(state) {
      rewriteRecoveryOperationReceipt(state, "RECOVERY_INSPECT", (receipt) => ({
        ...receipt,
        creation_operation_slot_sha256: "7".repeat(64),
      }));
    },
  },
  {
    name: "delete receipt substitutes its resource key",
    mutate(state) {
      rewriteRecoveryOperationReceipt(
        state,
        "RECOVERY_DELETE_EXACT",
        (receipt) => ({
          ...receipt,
          resource_key: "substituted-terminal-resource-key",
        }),
      );
    },
  },
  {
    name: "post-delete verifier reports PRESENT for a verified ledger row",
    mutate(state) {
      rewriteRecoveryOperationReceipt(
        state,
        "RECOVERY_VERIFY_ABSENT",
        (receipt) => ({
          ...receipt,
          status: "PRESENT",
        }),
      );
    },
  },
  {
    name: "NOT_REQUIRED ledger claim carries delete and verification receipts",
    mutate(state) {
      state.effect_ledger[0].cleanup_status = "NOT_REQUIRED";
    },
  },
  {
    name: "confirmed create claims NOT_REQUIRED from an initial-absence receipt",
    mutate(state) {
      rewriteRecoveryOperationReceipt(state, "RECOVERY_INSPECT", (receipt) => ({
        ...receipt,
        status: "ABSENT",
      }));
      const deletion = state.recovery_operation_state.operation_slots.find(
        (slot) => slot.operation === "RECOVERY_DELETE_EXACT",
      );
      const verification = state.recovery_operation_state.operation_slots.find(
        (slot) => slot.operation === "RECOVERY_VERIFY_ABSENT",
      );
      assert.equal(deletion.status, "RESULT_APPLIED");
      assert.equal(verification.status, "RESULT_APPLIED");
      resetRecoveryOperationSlot(deletion);
      resetRecoveryOperationSlot(verification);
      state.budgets.mutations.used -= 1;
      state.budgets.requests.used -= 1;
      state.effect_ledger[0].cleanup_status = "NOT_REQUIRED";
    },
  },
  {
    name: "earlier local qualification row substitutes its review",
    mutate(state) {
      const local = state.transition_history.find(
        (entry) => entry.authorization_class === "LOCAL_QUALIFICATION",
      );
      assert.ok(local);
      local.review_sha256 = "9".repeat(64);
    },
  },
  {
    name: "earlier recovery-controller row substitutes its review",
    mutate(state) {
      const recoveryRows = state.transition_history.filter(
        (entry) => entry.authorization_class === "RECOVERY_CONTROLLER",
      );
      assert.ok(recoveryRows.length > 1);
      recoveryRows[0].review_sha256 = "9".repeat(64);
    },
  },
  {
    name: "null anchor grant and all slots NOT_STARTED",
    mutate(state) {
      state.recovery_operation_state.recovery_anchor = null;
      state.recovery_operation_state.recovery_grant = null;
      for (const slot of state.recovery_operation_state.operation_slots) {
        slot.operation_binding_sha256 = null;
        slot.status = "NOT_STARTED";
        slot.receipt = null;
        slot.receipt_sha256 = null;
      }
    },
  },
  {
    name: "placeholder recovery grant",
    mutate(state) {
      state.recovery_operation_state.recovery_grant = {
        authorization_class: "RECOVERY_CONTROLLER",
        authority_receipt_sha256: "e".repeat(64),
        recovery_anchor_checkpoint_identity_sha256: "e".repeat(64),
        review_sha256: "e".repeat(64),
      };
    },
  },
  {
    name: "approval-only authority receipt",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, () => ({
        approval_digest_sha256: state.review_approval_sha256,
      }));
    },
  },
  {
    name: "authority receipt missing run binding",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, (receipt) => {
        delete receipt.run_id;
        return receipt;
      });
    },
  },
  {
    name: "authority receipt has an extra field",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, (receipt) => ({
        ...receipt,
        unreviewed_detail: "opaque",
      }));
    },
  },
  {
    name: "authority receipt substitutes candidate identity",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, (receipt) => ({
        ...receipt,
        candidate_identity_sha256: "b".repeat(64),
      }));
    },
  },
  {
    name: "authority receipt carries the wrong anchor sequence",
    mutate(state) {
      state.recovery_operation_state.recovery_anchor.checkpoint_sequence += 1;
    },
  },
  {
    name: "authority receipt carries the wrong anchor predecessor",
    mutate(state) {
      state.recovery_operation_state.recovery_anchor
        .predecessor_checkpoint_identity_sha256 = "c".repeat(64);
    },
  },
  {
    name: "authority receipt substitutes the stable operation binding",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, (receipt) => ({
        ...receipt,
        operation_binding_sha256: "d".repeat(64),
      }));
    },
  },
  {
    name: "authority receipt substitutes the fixed operation slot",
    mutate(state) {
      rewriteDurableRecoveryAuthorityReceipt(state, (receipt) => ({
        ...receipt,
        operation_slot_sha256: "e".repeat(64),
      }));
    },
  },
  {
    name: "authority slot carries a substituted receipt digest",
    mutate(state) {
      const authoritySlot = state.recovery_operation_state.operation_slots.find(
        (slot) => slot.operation === "VERIFY_RECOVERY_AUTHORITY",
      );
      authoritySlot.receipt_sha256 = "e".repeat(64);
      state.recovery_operation_state.recovery_grant.authority_receipt_sha256 =
        authoritySlot.receipt_sha256;
    },
  },
  {
    name: "terminal budget is malformed",
    mutate(state) {
      state.budgets = null;
    },
  },
  {
    name: "terminal budget is overdrawn",
    mutate(state) {
      state.budgets.requests.used = state.budgets.requests.limit + 1;
    },
  },
  {
    name: "terminal budget does not match the fixed reservation limit",
    mutate(state) {
      state.budgets.requests.limit = 17;
    },
  },
  {
    name: "terminal budget undercounts durable recovery slots",
    mutate(state) {
      state.budgets.requests.used = 0;
      state.budgets.mutations.used = 0;
    },
  },
  {
    name: "terminal history contains an illegal earlier edge",
    mutate(state) {
      state.transition_history[0] = {
        from: "READY",
        to: "QUALIFIED",
        authorization_class: "LOCAL_QUALIFICATION",
        review_sha256: state.review_approval_sha256,
      };
    },
  },
  {
    name: "terminal history is discontinuous before its final edge",
    mutate(state) {
      state.transition_history.splice(-1, 0, {
        from: "READY",
        to: "QUALIFYING",
        authorization_class: "LOCAL_QUALIFICATION",
        review_sha256: state.review_approval_sha256,
      });
    },
  },
]) {
  await check(`terminal recovery rejects ${scenario.name} before every adapter`, async () => {
    const malformed = structuredClone(exactGrantedTerminal);
    scenario.mutate(malformed);
    const sealed = resealCheckpointState(malformed);
    const calls = {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    };
    const result = await recoverQualification({
      loadAuthoritativeState: async () => structuredClone(sealed),
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        verifyReviewedRecoveryAuthorization: async () => {
          calls.grant += 1;
          return null;
        },
      },
      checkpointRecoveryState: async () => {
        calls.checkpoint += 1;
        return null;
      },
      readCheckpointHead: async () => {
        calls.head += 1;
        return exactCheckpointHead(sealed);
      },
      inspectOwnedResource: async () => {
        calls.inspect += 1;
        return null;
      },
      reconcileOwnedResource: async () => {
        calls.reconcile += 1;
        return null;
      },
    });
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

const exactUngrantPrefixes = await exactUngrantRecoveryPrefixes();

const controlFixtureSource = adapters();
installFutureAuthority(controlFixtureSource);
await runQualification(qualificationInput(controlFixtureSource));
const exactBeginControl = structuredClone(
  controlFixtureSource.checkpoints.find(
    (state) =>
      state.lifecycle_state === "READY" &&
      state.checkpoint.sequence === 0,
  ),
);
assert.ok(exactBeginControl);
const exactControllerMutable = structuredClone(exactGrantedTerminal);
exactControllerMutable.lifecycle_state = "FAILED_RECOVERABLE";
exactControllerMutable.transition_history.pop();
exactControllerMutable.cleanup = {
  required: exactControllerMutable.owned_resources.length > 0,
  verified: false,
};
exactControllerMutable.recovery = { status: "PENDING", resume_to: "READY" };
exactControllerMutable.outcome = {
  code: "RECOVERY_AUTHORIZED",
  successful: false,
};

for (const scenario of [
  {
    name: "seq0 READY cleanup mutation",
    base: exactBeginControl,
    mutate(state) {
      state.cleanup.required = true;
    },
  },
  {
    name: "local QUALIFYING cleanup mutation",
    base: exactUngrantPrefixes.qualifying,
    mutate(state) {
      state.cleanup.required = true;
    },
  },
  {
    name: "local QUALIFYING recovery mutation",
    base: exactUngrantPrefixes.qualifying,
    mutate(state) {
      state.recovery = { status: "INTERRUPTED", resume_to: "READY" };
    },
  },
  {
    name: "ungranted local FAILED_RECOVERABLE outcome mutation without class shadowing",
    base: exactUngrantPrefixes.failedRecoverable,
    mutate(state) {
      assert.equal(state.authorization_class, "LOCAL_QUALIFICATION");
      state.outcome.code = "RECOVERY_AUTHORIZED";
    },
  },
  {
    name: "granted controller FAILED_RECOVERABLE outcome mutation without class shadowing",
    base: exactControllerMutable,
    mutate(state) {
      assert.equal(state.authorization_class, "RECOVERY_CONTROLLER");
      assert.ok(state.recovery_operation_state.recovery_grant);
      state.outcome.code = "QUALIFICATION_FAILED";
    },
  },
  {
    name: "terminal QUALIFIED status mutation",
    base: exactQualifiedTerminal,
    mutate(state) {
      state.outcome.successful = false;
    },
  },
  {
    name: "terminal READY COMPLETE class mutation",
    base: exactGrantedTerminal,
    mutate(state) {
      state.authorization_class = "LOCAL_QUALIFICATION";
    },
  },
]) {
  await check(`exact recovery control matrix rejects ${scenario.name} pre-head`, async () => {
    const malformed = structuredClone(scenario.base);
    scenario.mutate(malformed);
    const sealed = resealCheckpointState(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

for (const scenario of [
  {
    name: "ordinary FAILED_RECOVERABLE claims controller authorization without a grant",
    base: "failedRecoverable",
    mutate(state) {
      state.authorization_class = "RECOVERY_CONTROLLER";
    },
  },
  {
    name: "controller-without-grant claims cleanup not required for owned effects",
    base: "failedRecoverable",
    mutate(state) {
      state.authorization_class = "RECOVERY_CONTROLLER";
      state.cleanup.required = false;
    },
  },
  {
    name: "controller-without-grant claims recovery-authorized outcome",
    base: "failedRecoverable",
    mutate(state) {
      state.authorization_class = "RECOVERY_CONTROLLER";
      state.outcome.code = "RECOVERY_AUTHORIZED";
    },
  },
  {
    name: "controller-without-grant carries a terminal-success outcome code",
    base: "failedRecoverable",
    mutate(state) {
      state.authorization_class = "RECOVERY_CONTROLLER";
      state.outcome.code = "QUALIFIED";
    },
  },
  {
    name: "interrupted QUALIFYING with empty history",
    base: "qualifying",
    mutate(state) {
      state.transition_history = [];
    },
  },
  {
    name: "interrupted QUALIFYING with a lifecycle-divergent tail",
    base: "qualifying",
    mutate(state) {
      state.transition_history.at(-1).to = "FAILED_RECOVERABLE";
    },
  },
  {
    name: "interrupted QUALIFYING with a substituted local review",
    base: "qualifying",
    mutate(state) {
      state.transition_history.at(-1).review_sha256 = "8".repeat(64);
    },
  },
  {
    name: "ordinary FAILED_RECOVERABLE with empty history",
    base: "failedRecoverable",
    mutate(state) {
      state.transition_history = [];
    },
  },
  {
    name: "ordinary FAILED_RECOVERABLE with truncated history",
    base: "failedRecoverable",
    mutate(state) {
      state.transition_history.pop();
    },
  },
  {
    name: "ordinary FAILED_RECOVERABLE with an illegal local failure review",
    base: "failedRecoverable",
    mutate(state) {
      state.transition_history.at(-1).review_sha256 = "8".repeat(64);
    },
  },
  {
    name: "ordinary FAILED_RECOVERABLE with a wrong request limit",
    base: "failedRecoverable",
    mutate(state) {
      state.budgets.requests.limit = 17;
    },
  },
  {
    name: "interrupted QUALIFYING with undercounted semantic usage",
    base: "qualifying",
    mutate(state) {
      state.budgets.requests.used = 0;
      state.budgets.mutations.used = 0;
    },
  },
  {
    name: "interrupted QUALIFYING with overstated semantic usage",
    base: "qualifying",
    mutate(state) {
      state.budgets.requests.used += 1;
    },
  },
  {
    name: "interrupted QUALIFYING with its create reservation erased",
    base: "qualifying",
    mutate(state) {
      state.recovery_operation_state.qualification_slot_usage.mutations = [];
      state.budgets.mutations.used = 0;
    },
  },
]) {
  await check(`${scenario.name} fails before head, grant, or effects`, async () => {
    const malformed = structuredClone(exactUngrantPrefixes[scenario.base]);
    scenario.mutate(malformed);
    const sealed = resealCheckpointState(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  });
}

const round13MutableQualification = localFailedRecoverableFromQualified(
  exactQualifiedTerminal,
);

await check("Round13 mutable coordinated-forgery fixture reaches authoritative-head validation", async () => {
  const { calls } = await recoverForPreAdapterValidation(
    round13MutableQualification,
  );
  assert.ok(calls.head > 0);
});

for (const scenario of qualificationReceiptClasses) {
  for (const surface of ["terminal", "mutable"]) {
    await check(
      `Round13 ${surface} rejects a coordinated forged reservation proof order for ${scenario.name} pre-head`,
      async () => {
        const malformed = structuredClone(
          surface === "terminal"
            ? exactQualifiedTerminal
            : round13MutableQualification,
        );
        const resourceKey = scenario.resourceIndex === null
          ? null
          : malformed.resource_plan[scenario.resourceIndex].resource_key;
        const slot = qualificationOperationSlot(
          malformed,
          scenario.category,
          scenario.index,
          scenario.operation,
          resourceKey,
        );
        assert.ok(slot);
        forgeQualificationReservationTuple(malformed, slot);
        const sealed = surface === "terminal"
          ? resealTerminalJournal(malformed)
          : resealCheckpointState(malformed);
        const { calls, result } = await recoverForPreAdapterValidation(sealed);
        assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
        assert.deepEqual(calls, {
          head: 0,
          grant: 0,
          checkpoint: 0,
          inspect: 0,
          reconcile: 0,
        });
      },
    );
  }
}

await check("Round13 namespace cannot be applied after a null authority reservation prerequisite", async () => {
  const malformed = structuredClone(exactUngrantPrefixes.qualifying);
  const authoritySlot = qualificationOperationSlot(
    malformed,
    "requests",
    0,
    "VERIFY_AUTHORITY_ENVELOPE",
  );
  const namespaceSlot = qualificationOperationSlot(
    malformed,
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
  );
  assert.equal(namespaceSlot.status, "RESULT_APPLIED");
  authoritySlot.status = "RESERVED";
  authoritySlot.reservation_ordinal = null;
  authoritySlot.predecessor_reservation_proof_sha256 = null;
  authoritySlot.reservation_proof_sha256 = null;
  authoritySlot.receipt = null;
  authoritySlot.receipt_sha256 = null;
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
});

await check("Round13 namespace cannot be applied after an exact but unapplied authority reservation", async () => {
  const malformed = structuredClone(exactUngrantPrefixes.qualifying);
  const authoritySlot = qualificationOperationSlot(
    malformed,
    "requests",
    0,
    "VERIFY_AUTHORITY_ENVELOPE",
  );
  const namespaceSlot = qualificationOperationSlot(
    malformed,
    "requests",
    1,
    "VERIFY_FRESH_RESOURCE_PLAN",
  );
  assert.equal(authoritySlot.status, "RESULT_APPLIED");
  assert.equal(namespaceSlot.status, "RESULT_APPLIED");
  authoritySlot.status = "RESERVED";
  authoritySlot.receipt = null;
  authoritySlot.receipt_sha256 = null;
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
});

for (const scenario of [
  {
    name: "delete before staging",
    first(state) {
      return qualificationOperationSlot(
        state,
        "requests",
        2,
        "VERIFY_STAGING_READ_ONLY",
      );
    },
    second(state) {
      const resource = state.resource_plan.at(-1);
      return qualificationOperationSlot(
        state,
        "mutations",
        5 + state.resource_plan.length - 1,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      );
    },
  },
  {
    name: "forward rather than exact reverse delete order",
    first(state) {
      const resource = state.resource_plan.at(-1);
      return qualificationOperationSlot(
        state,
        "mutations",
        5 + state.resource_plan.length - 1,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      );
    },
    second(state) {
      const index = state.resource_plan.length - 2;
      const resource = state.resource_plan[index];
      return qualificationOperationSlot(
        state,
        "mutations",
        5 + index,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      );
    },
  },
  {
    name: "success verifier before its required delete suffix",
    first(state) {
      const resource = state.resource_plan[0];
      return qualificationOperationSlot(
        state,
        "mutations",
        5,
        "QUALIFICATION_DELETE_EXACT",
        resource.resource_key,
      );
    },
    second(state) {
      return qualificationOperationSlot(
        state,
        "requests",
        3,
        "QUALIFICATION_VERIFY_CLEANUP",
      );
    },
  },
]) {
  await check(`Round13 terminal rejects ${scenario.name} pre-head`, async () => {
    const malformed = structuredClone(exactQualifiedTerminal);
    const first = scenario.first(malformed);
    const second = scenario.second(malformed);
    assert.equal(first.status, "RESULT_APPLIED");
    assert.equal(second.status, "RESULT_APPLIED");
    swapQualificationReservationOrder(malformed, first, second);
    const sealed = resealTerminalJournal(malformed);
    const { calls, result } = await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

await check("Round13 compact evidence rejects every canonically rehashed QUALIFIED lifecycle substitution", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const qualified = await runQualification(qualificationInput(fake));
  assert.equal(qualified.evidence.lifecycle_state, "QUALIFIED");
  for (const lifecycle of [
    "READY",
    "QUALIFYING",
    "OFFICIAL_RUNTIME_AUTHORIZED",
    "OFFICIAL_RUNTIME_RUNNING",
    "COMPLETE",
    "FAILED_RECOVERABLE",
    "FAILED_CLOSED",
  ]) {
    const malformed = structuredClone(qualified.evidence);
    malformed.lifecycle_state = lifecycle;
    assert.throws(
      () => validateCompactEvidence(resealEvidence(malformed)),
      (error) => error?.code === "EVIDENCE_SHAPE",
      lifecycle,
    );
  }
});

await check("Round13 failed-recoverable evidence cannot carry a retained success ledger", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const qualified = await runQualification(qualificationInput(fake));
  const malformed = structuredClone(qualified.evidence);
  malformed.lifecycle_state = "FAILED_RECOVERABLE";
  malformed.cleanup = { required: true, verified: false };
  malformed.recovery = { status: "PENDING", resume_to: "READY" };
  malformed.outcome = {
    code: "TERMINAL_CHECKPOINT_FAILED",
    successful: false,
  };
  assert.throws(
    () => validateCompactEvidence(resealEvidence(malformed)),
    (error) => error?.code === "EVIDENCE_SHAPE",
  );
});

async function failedRecoverableInterruptedCrashFixture() {
  const fake = adapters({
    failCreateType: "PREVIEW_DEPLOYMENT",
    failCleanupType: "GIT_BRANCH",
  });
  installFutureAuthority(fake);
  let durable = null;
  let interruptedCommitted = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (
          !interruptedCommitted &&
          state.lifecycle_state === "QUALIFYING" &&
          state.recovery?.status === "INTERRUPTED" &&
          state.outcome?.code === "TERMINAL_CHECKPOINT_PENDING"
        ) {
          const receipt = await fake.commitCheckpoint(state, command);
          durable = structuredClone(state);
          interruptedCommitted = true;
          return receipt;
        }
        if (interruptedCommitted) {
          throw new Error("synthetic second-write rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
      async readCheckpointHead(request) {
        if (interruptedCommitted) {
          throw new Error("synthetic persistent head outage");
        }
        return fake.readCheckpointHead(request);
      },
    }),
  );
  assert.equal(interruptedCommitted, true);
  assert.ok(durable);
  return { durable, fake, result };
}

await check("Round13 failed-recoverable finalization commits an interrupted QUALIFYING history tail", async () => {
  const { durable, result } = await failedRecoverableInterruptedCrashFixture();
  assertQualificationFailureProjection(result.state, result.state.outcome.code);
  assert.equal(durable.lifecycle_state, "QUALIFYING");
  assert.equal(durable.transition_history.at(-1).to, "QUALIFYING");
});

await check("Round13 restart admits the exact latest failed-recoverable interrupted checkpoint", async () => {
  const { durable } = await failedRecoverableInterruptedCrashFixture();
  const { calls, result } = await recoverForPreAdapterValidation(durable);
  assert.equal(calls.head, 2);
  assert.notEqual(result.outcome?.code, "RECOVERY_STATE_INVALID");
});

async function exactLocalFailedClosedFixture() {
  const fake = adapters({ failCreateType: "PREVIEW_DEPLOYMENT" });
  installFutureAuthority(fake);
  const result = await runQualification(qualificationInput(fake));
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.cleanup.verified, true);
  assert.equal(fake.present.size, 0);
  return { fake, result };
}

await check("Round13 local cleanup-verified failure has exact terminal transition provenance", async () => {
  const { result } = await exactLocalFailedClosedFixture();
  assert.deepEqual(result.state.transition_history.at(-1), {
    from: "QUALIFYING",
    to: "FAILED_CLOSED",
    authorization_class: "LOCAL_QUALIFICATION",
    review_sha256: ACTIVATION_REVIEW_SHA256,
  });
});

await check("Round13 exact local FAILED_CLOSED reload is read-only and survives a prior head outage", async () => {
  const { result } = await exactLocalFailedClosedFixture();
  const terminal = structuredClone(result.state);
  if (terminal.transition_history.at(-1)?.to !== "FAILED_CLOSED") {
    terminal.transition_history.push({
      from: "QUALIFYING",
      to: "FAILED_CLOSED",
      authorization_class: "LOCAL_QUALIFICATION",
      review_sha256: ACTIVATION_REVIEW_SHA256,
    });
  }
  const durable = resealTerminalJournal(terminal);
  const calls = { head: 0, grant: 0, checkpoint: 0, inspect: 0, reconcile: 0 };
  const recoveryInput = {
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async () => {
        calls.grant += 1;
        throw new Error("terminal replay must not request a grant");
      },
    },
    checkpointRecoveryState: async () => {
      calls.checkpoint += 1;
      throw new Error("terminal replay must not checkpoint");
    },
    readCheckpointHead: async () => {
      calls.head += 1;
      return exactCheckpointHead(durable);
    },
    inspectOwnedResource: async () => {
      calls.inspect += 1;
      throw new Error("terminal replay must not inspect");
    },
    reconcileOwnedResource: async () => {
      calls.reconcile += 1;
      throw new Error("terminal replay must not reconcile");
    },
  };
  const outage = await recoverQualification({
    ...recoveryInput,
    readCheckpointHead: async () => {
      calls.head += 1;
      throw new Error("synthetic immediate head outage");
    },
  });
  assertRecoveryFailureProjection(outage, "RECOVERY_HEAD_UNKNOWN");
  const admitted = await recoverQualification(recoveryInput);
  assert.equal(admitted.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(admitted.evidence.lifecycle_state, "FAILED_CLOSED");
  assert.deepEqual(admitted.retained_resources, []);
  assert.deepEqual(calls, {
    head: 2,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
});

await check("Round13 terminal failure write-then-throw plus head outage remains reloadable read-only", async () => {
  const fake = adapters({ failCreateType: "PREVIEW_DEPLOYMENT" });
  installFutureAuthority(fake);
  let terminalWritten = false;
  const first = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const receipt = await fake.commitCheckpoint(state, command);
        if (!terminalWritten && state.lifecycle_state === "FAILED_CLOSED") {
          terminalWritten = true;
          throw new Error("synthetic terminal failure response loss");
        }
        return receipt;
      },
      async readCheckpointHead(request) {
        if (terminalWritten) {
          throw new Error("synthetic terminal failure head outage");
        }
        return fake.readCheckpointHead(request);
      },
    }),
  );
  assert.equal(terminalWritten, true);
  assertQualificationFailureProjection(first.state, first.state.outcome.code);
  const durable = [...fake.checkpointStates.values()].at(-1);
  assert.equal(durable.lifecycle_state, "FAILED_CLOSED");
  assert.equal(durable.cleanup.verified, true);
  assert.equal(fake.present.size, 0);

  const calls = { head: 0, grant: 0, checkpoint: 0, inspect: 0, reconcile: 0 };
  const admitted = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(durable),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async () => {
        calls.grant += 1;
        throw new Error("terminal replay must not request a grant");
      },
    },
    checkpointRecoveryState: async () => {
      calls.checkpoint += 1;
      throw new Error("terminal replay must not checkpoint");
    },
    readCheckpointHead: async () => {
      calls.head += 1;
      return exactCheckpointHead(durable);
    },
    inspectOwnedResource: async () => {
      calls.inspect += 1;
      throw new Error("terminal replay must not inspect");
    },
    reconcileOwnedResource: async () => {
      calls.reconcile += 1;
      throw new Error("terminal replay must not reconcile");
    },
  });
  assert.equal(admitted.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(admitted.state.checkpoint.checkpoint_identity_sha256,
    durable.checkpoint.checkpoint_identity_sha256);
  assert.equal(admitted.evidence.evidence_identity_sha256,
    durable.final_evidence_identity_sha256);
  assert.deepEqual(admitted.retained_resources, []);
  assert.deepEqual(calls, {
    head: 1,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
});

for (const scenario of [
  {
    name: "missing final failure history row",
    mutate(state) {
      state.transition_history.pop();
    },
  },
  {
    name: "substituted final failure review",
    mutate(state) {
      state.transition_history.at(-1).review_sha256 = "8".repeat(64);
    },
  },
  {
    name: "substituted final failure authority class",
    mutate(state) {
      state.transition_history.at(-1).authorization_class =
        "RECOVERY_CONTROLLER";
    },
  },
]) {
  await check(`Round13 local FAILED_CLOSED rejects ${scenario.name} pre-head`, async () => {
    const { result } = await exactLocalFailedClosedFixture();
    const malformed = structuredClone(result.state);
    if (malformed.transition_history.at(-1)?.to !== "FAILED_CLOSED") {
      malformed.transition_history.push({
        from: "QUALIFYING",
        to: "FAILED_CLOSED",
        authorization_class: "LOCAL_QUALIFICATION",
        review_sha256: ACTIVATION_REVIEW_SHA256,
      });
    }
    scenario.mutate(malformed);
    const sealed = resealTerminalJournal(malformed);
    const { calls, result: recovered } =
      await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(recovered, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  });
}

await check("Round13 bridge-emitted compact evidence validates only exact supported lifecycle stories", async () => {
  const qualifiedFake = adapters();
  installFutureAuthority(qualifiedFake);
  const qualified = await runQualification(qualificationInput(qualifiedFake));
  const { result: failedClosed } = await exactLocalFailedClosedFixture();
  const { result: failedRecoverable } =
    await failedRecoverableInterruptedCrashFixture();
  for (const evidence of [
    qualified.evidence,
    failedClosed.evidence,
    failedRecoverable.evidence,
  ]) {
    assert.equal(validateCompactEvidence(evidence), true, evidence.lifecycle_state);
  }
});

await check("one-use reservation bounds actual adapter calls across journal retries", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const cache = new Map();
  let missingSequence = 0;
  let actualRequests = 0;
  let actualMutations = 0;
  const oneUse = (category, operation) => async (...args) => {
    const context = args.find(
      (value) => value?.operation_slot?.operation_slot_sha256,
    );
    const slot = context?.operation_slot?.operation_slot_sha256;
    const key = slot ?? `missing-${missingSequence += 1}`;
    if (cache.has(key)) return structuredClone(cache.get(key));
    if (category === "requests") actualRequests += 1;
    else actualMutations += 1;
    const result = await operation(...args);
    cache.set(key, structuredClone(result));
    return result;
  };
  fake.contract.authority.verifyAuthorityEnvelope = oneUse(
    "requests",
    fake.contract.authority.verifyAuthorityEnvelope,
  );
  fake.contract.namespace.verifyFresh = oneUse(
    "requests",
    fake.contract.namespace.verifyFresh,
  );
  fake.contract.staging.verifyReadOnly = oneUse(
    "requests",
    fake.contract.staging.verifyReadOnly,
  );
  fake.contract.finalCleanup.verify = oneUse(
    "requests",
    fake.contract.finalCleanup.verify,
  );
  for (const adapter of [
    fake.contract.branch,
    fake.contract.preview,
    fake.contract.environment,
    fake.contract.fixture,
  ]) {
    adapter.create = oneUse("mutations", adapter.create);
    adapter.cleanup = oneUse("mutations", adapter.cleanup);
  }
  fake.contract.storage.cleanupExactVersion = oneUse(
    "mutations",
    fake.contract.storage.cleanupExactVersion,
  );

  let durable;
  const qualification = qualificationInput(fake, {
    async checkpoint(state, command) {
      if (["QUALIFIED", "FAILED_RECOVERABLE", "FAILED_CLOSED"].includes(
        state.lifecycle_state,
      )) {
        throw new Error("repeated terminal failure");
      }
      const receipt = await fake.commitCheckpoint(state, command);
      if (state.lifecycle_state === "QUALIFYING") {
        durable = structuredClone(state);
      }
      return receipt;
    },
  });
  const first = await runQualification(qualification);
  assertQualificationFailureProjection(first.state, "TERMINAL_CHECKPOINT_FAILED");
  for (let attempt = 1; attempt < 4; attempt += 1) {
    const retry = await runQualification(qualification);
    assertQualificationFailureProjection(retry.state, "ATTEMPT_ALREADY_EXISTS");
  }
  assert.match(durable.operation_reservation.identity_sha256, /^[0-9a-f]{64}$/u);
  assert.equal(durable.operation_reservation.request_limit, 16);
  assert.equal(durable.operation_reservation.mutation_limit, 15);
  assert.ok(actualRequests <= 16, `actual requests ${actualRequests}`);
  assert.ok(actualMutations <= 15, `actual mutations ${actualMutations}`);

  assert.equal(durable.lifecycle_state, "QUALIFYING");
  assert.equal(durable.recovery.status, "INTERRUPTED");
  let recoveryActualRequests = 0;
  let recoveryActualMutations = 0;
  const recoveryCache = new Map();
  const recoveryOneUse = (category, operation) => async (...args) => {
    const context = args.find(
      (value) => value?.operation_slot?.operation_slot_sha256,
    );
    const slot = context?.operation_slot?.operation_slot_sha256;
    const key = slot ?? `recovery-missing-${missingSequence += 1}`;
    if (recoveryCache.has(key)) return structuredClone(recoveryCache.get(key));
    if (category === "requests") recoveryActualRequests += 1;
    else recoveryActualMutations += 1;
    const result = await operation(...args);
    recoveryCache.set(key, structuredClone(result));
    return result;
  };
  const reviewed = structuredClone(durable);
  const journal = durable.journal_identity_sha256;
  assert.equal(
    fake.checkpointStates.get(journal).checkpoint.checkpoint_identity_sha256,
    durable.checkpoint.checkpoint_identity_sha256,
  );
  let recoveryResult;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    recoveryResult = await recoverQualification({
      loadAuthoritativeState: async () =>
        structuredClone(fake.checkpointStates.get(journal)),
      authorization: {
        schema_version: 1,
        authorization_class: "RECOVERY_CONTROLLER",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      authority: {
        verifyReviewedRecoveryAuthorization: recoveryOneUse(
          "requests",
          async (request) => futureRecoveryAuthorityResponse(request, reviewed),
        ),
      },
      checkpointRecoveryState: async (state, command) => {
        if (state.lifecycle_state === "READY") {
          throw new Error("repeated recovery terminal failure");
        }
        return fake.commitCheckpoint(state, command);
      },
      readCheckpointHead: async (request) => fake.readCheckpointHead(request),
      inspectOwnedResource: recoveryOneUse("requests", async (resource, context) => ({
        status: "ABSENT",
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        operation_binding_sha256: context?.operation_binding_sha256,
      })),
      reconcileOwnedResource: recoveryOneUse("mutations", async (resource, cas, context) => ({
        status: "DELETED_EXACT",
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
        operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
        operation_binding_sha256: context?.operation_binding_sha256,
      })),
    });
    assertRecoveryFailureProjection(
      recoveryResult,
      "RECOVERY_TERMINAL_CHECKPOINT_FAILED",
    );
  }
  assert.ok(fake.checkpointStates.get(journal).checkpoint.sequence > reviewed.checkpoint.sequence);
  assert.equal(
    fake.checkpointStates.get(journal).effect_ledger.every(
      (entry) => entry.status === "CLEANED" && entry.cleanup_status === "VERIFIED",
    ),
    true,
  );
  assert.ok(
    actualRequests + recoveryActualRequests <= 16,
    `combined actual requests ${actualRequests + recoveryActualRequests}`,
  );
  assert.ok(
    actualMutations + recoveryActualMutations <= 15,
    `combined actual mutations ${actualMutations + recoveryActualMutations}`,
  );
});

async function exactLocalCompensatedFailedClosedFixture(
  failureMode = "TERMINAL_CHECKPOINT_FAILED",
) {
  const fake = adapters();
  installFutureAuthority(fake);
  if (failureMode === "EVIDENCE_FINALIZATION_FAILED") {
    fake.contract.evidence = {
      async build() {
        throw new Error("synthetic evidence finalization rejection");
      },
    };
  }
  let rejectedQualified = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (
          failureMode === "TERMINAL_CHECKPOINT_FAILED" &&
          !rejectedQualified &&
          state.lifecycle_state === "QUALIFIED"
        ) {
          rejectedQualified = true;
          throw new Error("synthetic qualified terminal rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  assert.equal(
    rejectedQualified,
    failureMode === "TERMINAL_CHECKPOINT_FAILED",
  );
  assert.equal(result.state.lifecycle_state, "FAILED_CLOSED");
  assert.equal(result.state.cleanup.verified, true);
  assert.equal(result.state.outcome.code, failureMode);
  assert.equal(fake.present.size, 0);
  return { fake, result };
}

function rewriteVerificationAsPhysicalZero(state, index) {
  return rewriteQualificationOperationReceipt(
    state,
    "requests",
    index,
    "QUALIFICATION_VERIFY_CLEANUP",
    null,
    (receipt) => ({
      ...receipt,
      retained_preview_count: 0,
      verified_present_resources: [],
      verified_absent_resource_keys: state.owned_resources.map(
        (resource) => resource.resource_key,
      ),
    }),
  );
}

await check("Round14 compensated FAILED_CLOSED requires slot3 retained success before slot4 zero", async () => {
  for (const failureMode of [
    "TERMINAL_CHECKPOINT_FAILED",
    "EVIDENCE_FINALIZATION_FAILED",
  ]) {
    const { result } =
      await exactLocalCompensatedFailedClosedFixture(failureMode);
    const malformed = structuredClone(result.state);
    const primary = qualificationOperationSlot(
      malformed,
      "requests",
      3,
      "QUALIFICATION_VERIFY_CLEANUP",
    );
    const compensation = qualificationOperationSlot(
      malformed,
      "requests",
      4,
      "QUALIFICATION_VERIFY_CLEANUP",
    );
    assert.equal(primary.status, "RESULT_APPLIED", failureMode);
    assert.equal(primary.receipt.retained_preview_count, 1, failureMode);
    assert.equal(compensation.status, "RESULT_APPLIED", failureMode);
    assert.equal(compensation.receipt.retained_preview_count, 0, failureMode);
    rewriteVerificationAsPhysicalZero(malformed, 3);
    const sealed = resealTerminalJournal(malformed);
    const { calls, result: recovered } =
      await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(recovered, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
    assert.equal(runtimeEvidenceAccepts(resealEvidence(
      compactEvidencePayloadFromState(sealed),
    )), false);
  }
});

await check("Round14 compensated delete chronology cannot masquerade as a slot3-only failure verifier", async () => {
  for (const failureMode of [
    "TERMINAL_CHECKPOINT_FAILED",
    "EVIDENCE_FINALIZATION_FAILED",
  ]) {
    const { result } =
      await exactLocalCompensatedFailedClosedFixture(failureMode);
    const malformed = structuredClone(result.state);
    rewriteVerificationAsPhysicalZero(malformed, 3);
    removeQualificationUsage(
      malformed,
      "requests",
      4,
      "QUALIFICATION_VERIFY_CLEANUP",
    );
    const sealed = resealTerminalJournal(malformed);
    const { calls, result: recovered } =
      await recoverForPreAdapterValidation(sealed);
    assertRecoveryFailureProjection(recovered, "RECOVERY_STATE_INVALID");
    assert.deepEqual(calls, {
      head: 0,
      grant: 0,
      checkpoint: 0,
      inspect: 0,
      reconcile: 0,
    });
  }
});

await check("Round14 actual evidence schema and semantic layer enforce all four lifecycle ledger stories", async () => {
  const qualifiedFake = adapters();
  installFutureAuthority(qualifiedFake);
  const qualified = await runQualification(qualificationInput(qualifiedFake));
  const { result: failedClosed } = await exactLocalFailedClosedFixture();
  const { result: failedRecoverable } =
    await failedRecoverableInterruptedCrashFixture();
  const ready = exactReadyEvidenceFixture();
  const valid = {
    READY: ready,
    QUALIFIED: qualified.evidence,
    FAILED_RECOVERABLE: failedRecoverable.evidence,
    FAILED_CLOSED: failedClosed.evidence,
  };
  for (const [lifecycle, evidence] of Object.entries(valid)) {
    assert.equal(structuralEvidenceSchemaAccepts(evidence), true, lifecycle);
    assert.equal(runtimeEvidenceAccepts(evidence), true, lifecycle);
  }

  const removedRetainedPreview = structuredClone(valid.QUALIFIED);
  const retainedIndex = removedRetainedPreview.effect_ledger.findIndex(
    (entry) => entry.status === "APPLIED" && entry.cleanup_status === "RETAINED",
  );
  assert.ok(retainedIndex >= 0);
  removedRetainedPreview.effect_ledger.splice(retainedIndex, 1);

  const changedRetainedPreview = structuredClone(valid.QUALIFIED);
  const changedRetained = changedRetainedPreview.effect_ledger.find(
    (entry) => entry.status === "APPLIED" && entry.cleanup_status === "RETAINED",
  );
  changedRetained.status = "CLEANED";
  changedRetained.cleanup_status = "VERIFIED";

  const failedClosedResidue = structuredClone(valid.FAILED_CLOSED);
  assert.ok(failedClosedResidue.effect_ledger.length > 0);
  failedClosedResidue.effect_ledger[0].status = "APPLIED";
  failedClosedResidue.effect_ledger[0].cleanup_status = "RETAINED";

  const duplicateRetainedEffect = structuredClone(valid.QUALIFIED);
  const secondRetained = duplicateRetainedEffect.effect_ledger.find(
    (entry) => entry.cleanup_status === "VERIFIED",
  );
  secondRetained.status = "APPLIED";
  secondRetained.cleanup_status = "RETAINED";

  for (const [name, evidence] of Object.entries({
    removedRetainedPreview,
    changedRetainedPreview,
    failedClosedResidue,
    duplicateRetainedEffect,
  })) {
    const sealed = resealEvidence(evidence);
    assert.equal(structuralEvidenceSchemaAccepts(sealed), false, name);
    assert.equal(runtimeEvidenceAccepts(sealed), false, name);
  }

  const pairMutants = {
    READY: (() => {
      const mutant = structuredClone(valid.READY);
      const row = structuredClone(valid.QUALIFIED.effect_ledger[0]);
      row.status = "APPLIED";
      row.cleanup_status = "VERIFIED";
      mutant.effect_ledger.push(row);
      return mutant;
    })(),
    QUALIFIED: (() => {
      const mutant = structuredClone(valid.QUALIFIED);
      const row = mutant.effect_ledger.find(
        (entry) => entry.cleanup_status === "RETAINED",
      );
      row.cleanup_status = "VERIFIED";
      return mutant;
    })(),
    FAILED_RECOVERABLE: (() => {
      const mutant = structuredClone(valid.FAILED_RECOVERABLE);
      assert.ok(mutant.effect_ledger.length > 0);
      mutant.effect_ledger[0].status = "APPLIED";
      mutant.effect_ledger[0].cleanup_status = "VERIFIED";
      return mutant;
    })(),
    FAILED_CLOSED: (() => {
      const mutant = structuredClone(valid.FAILED_CLOSED);
      assert.ok(mutant.effect_ledger.length > 0);
      mutant.effect_ledger[0].status = "APPLIED";
      mutant.effect_ledger[0].cleanup_status = "VERIFIED";
      return mutant;
    })(),
  };
  for (const [lifecycle, evidence] of Object.entries(pairMutants)) {
    const sealed = resealEvidence(evidence);
    assert.equal(structuralEvidenceSchemaAccepts(sealed), false, lifecycle);
    assert.equal(runtimeEvidenceAccepts(sealed), false, lifecycle);
  }

  const crossReferenceMutant = structuredClone(valid.QUALIFIED);
  const retained = crossReferenceMutant.effect_ledger.find(
    (entry) => entry.cleanup_status === "RETAINED",
  );
  const cleaned = crossReferenceMutant.effect_ledger.find(
    (entry) => entry.cleanup_status === "VERIFIED",
  );
  retained.status = "CLEANED";
  retained.cleanup_status = "VERIFIED";
  cleaned.status = "APPLIED";
  cleaned.cleanup_status = "RETAINED";
  const crossReferenceSealed = resealEvidence(crossReferenceMutant);
  assert.equal(
    structuralEvidenceSchemaAccepts(crossReferenceSealed),
    true,
    "JSON Schema cannot cross-link a retained ledger key to resource_plan type",
  );
  assert.equal(runtimeEvidenceAccepts(crossReferenceSealed), false);
});

const round17QualifiedTerminal = await exactQualifiedTerminalFixture();
const round17MutableRecovery = localFailedRecoverableFromQualified(
  round17QualifiedTerminal,
);
const { result: round17FailedClosedResult } =
  await exactLocalFailedClosedFixture();
const round17FailedClosedTerminal = structuredClone(
  round17FailedClosedResult.state,
);
const round17RecoveryCompleteTerminal =
  await exactGrantedRecoveryTerminalFixture();

assert.equal(
  round17QualifiedTerminal.authority_envelope
    .current_retained_state_attestation_sha256,
  EXACT_CURRENT_RETAINED_STATE_ATTESTATION_SHA256,
);

for (const [storyName, state] of [
  ["mutable FAILED_RECOVERABLE", round17MutableRecovery],
  ["terminal QUALIFIED", round17QualifiedTerminal],
  ["terminal FAILED_CLOSED", round17FailedClosedTerminal],
  ["terminal recovery READY COMPLETE", round17RecoveryCompleteTerminal],
]) {
  for (const mutationKind of [
    "DUPLICATE_MISSING_TYPE",
    "INVALID_RUN_ID",
    "SUBSTITUTED_ATTESTATION",
  ]) {
    await check(
      `Round17 ${storyName} rejects coordinated ${mutationKind} reseal pre-adapter`,
      async () => {
        const sealed = coordinatedActivationSemanticReseal(
          state,
          mutationKind,
        );
        const { calls, result } =
          await recoverForPreAdapterValidation(sealed);
        assert.deepEqual(calls, {
          head: 0,
          grant: 0,
          checkpoint: 0,
          inspect: 0,
          reconcile: 0,
        });
        assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
      },
    );
  }
}

for (const mutationKind of [
  "DUPLICATE_MISSING_TYPE",
  "INVALID_RUN_ID",
  "SUBSTITUTED_ATTESTATION",
]) {
  await check(
    `Round17 compact evidence rejects coordinated ${mutationKind} reseal`,
    async () => {
      const state = coordinatedActivationSemanticReseal(
        round17QualifiedTerminal,
        mutationKind,
      );
      const evidence = resealEvidence(
        compactEvidencePayloadFromState(state),
      );
      assert.equal(
        structuralEvidenceSchemaAccepts(evidence),
        mutationKind !== "INVALID_RUN_ID",
        mutationKind,
      );
      assert.throws(
        () => validateCompactEvidence(evidence),
        (error) => error?.code === "EVIDENCE_SHAPE",
      );
    },
  );
}

async function exactPostRetainedDeleteBeforeSlot4Fixture() {
  const { fake } = await exactLocalCompensatedFailedClosedFixture();
  const state = fake.checkpoints.find((candidate) => {
    const retained = candidate.resource_plan.find(
      (resource) =>
        resource.resource_type === "PREVIEW_DEPLOYMENT" &&
        resource.owner.cleanup_policy ===
          "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
    );
    if (!retained) return false;
    const retainedIndex = candidate.resource_plan.findIndex(
      (resource) => resource.resource_key === retained.resource_key,
    );
    const primary = qualificationOperationSlot(
      candidate,
      "requests",
      3,
      "QUALIFICATION_VERIFY_CLEANUP",
    );
    const compensation = qualificationOperationSlot(
      candidate,
      "requests",
      4,
      "QUALIFICATION_VERIFY_CLEANUP",
    );
    const deletion = qualificationOperationSlot(
      candidate,
      "mutations",
      5 + retainedIndex,
      "QUALIFICATION_DELETE_EXACT",
      retained.resource_key,
    );
    const ledger = candidate.effect_ledger.find(
      (entry) => entry.resource_key === retained.resource_key,
    );
    return (
      candidate.lifecycle_state === "QUALIFYING" &&
      candidate.recovery?.status === "INTERRUPTED" &&
      primary?.status === "RESULT_APPLIED" &&
      primary.receipt?.retained_preview_count === 1 &&
      compensation?.status === "NOT_STARTED" &&
      deletion?.status === "RESULT_APPLIED" &&
      ledger?.status === "CLEANED" &&
      ledger.cleanup_status === "APPLIED"
    );
  });
  assert.ok(state, "post-retained-delete/pre-slot4 checkpoint");
  const sealed = resealCheckpointState(state);
  validateRecoveryState(sealed);
  return sealed;
}

function reserveCompensationVerifierForFixture(state) {
  const slot = addQualificationUsage(
    state,
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const progressed = state.recovery_operation_state.qualification_operation_slots
    .filter((candidate) => candidate.status !== "NOT_STARTED")
    .sort((left, right) => left.reservation_ordinal - right.reservation_ordinal);
  slot.reservation_ordinal = progressed.length;
  slot.predecessor_reservation_proof_sha256 =
    progressed.at(-1).reservation_proof_sha256;
  slot.reservation_proof_sha256 =
    deriveQualificationReservationProofSha256({
      journal_identity_sha256: state.journal_identity_sha256,
      operation_reservation_identity_sha256:
        state.operation_reservation.identity_sha256,
      reservation_ordinal: slot.reservation_ordinal,
      predecessor_reservation_proof_sha256:
        slot.predecessor_reservation_proof_sha256,
      operation_slot_sha256: slot.operation_slot_sha256,
    });
  slot.status = "RESERVED";
}

for (const slot4Status of ["NOT_STARTED", "RESERVED"]) {
  await check(
    `Round17 post-retained-delete slot3 ZERO is rejected with slot4 ${slot4Status}`,
    async () => {
      const authentic = await exactPostRetainedDeleteBeforeSlot4Fixture();
      const candidate = structuredClone(authentic);
      if (slot4Status === "RESERVED") {
        reserveCompensationVerifierForFixture(candidate);
      }
      const authenticSealed = resealCheckpointState(candidate);
      validateRecoveryState(authenticSealed);
      rewriteVerificationAsPhysicalZero(candidate, 3);
      const malformed = resealCheckpointState(candidate);
      const { calls, result } =
        await recoverForPreAdapterValidation(malformed);
      assert.deepEqual(calls, {
        head: 0,
        grant: 0,
        checkpoint: 0,
        inspect: 0,
        reconcile: 0,
      });
      assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
    },
  );
}

function exactEmptyLoadedBeginFixture() {
  const evidenceOnly = exactReadyEvidenceFixture();
  const resourcePlan = [];
  const resourcePlanSha256 = deriveResourcePlanSha256(resourcePlan);
  const authorityEnvelope = {
    ...structuredClone(round17QualifiedTerminal.authority_envelope),
    current_retained_state_attestation_sha256:
      evidenceOnly.authority_envelope
        .current_retained_state_attestation_sha256,
    resource_plan_sha256: resourcePlanSha256,
  };
  const authorityEnvelopeSha256 =
    deriveAuthorityEnvelopeSha256(authorityEnvelope);
  const operationReservation =
    createOperationReservation(authorityEnvelopeSha256);
  const recoveryOperationState = createRecoveryOperationState(
    operationReservation,
    resourcePlan,
  );
  const journalIdentitySha256 = deriveJournalIdentitySha256({
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan_sha256: resourcePlanSha256,
    ordered_resource_keys: [],
    operation_reservation_identity_sha256:
      operationReservation.identity_sha256,
  });
  const state = {
    schema_version: 1,
    candidate_identity_sha256:
      round17QualifiedTerminal.candidate_identity_sha256,
    run_id: round17QualifiedTerminal.run_id,
    phase: round17QualifiedTerminal.phase,
    operation_class: round17QualifiedTerminal.operation_class,
    review_approval_sha256:
      round17QualifiedTerminal.review_approval_sha256,
    freeze_document_sha256:
      round17QualifiedTerminal.freeze_document_sha256,
    retained_state_sha256:
      round17QualifiedTerminal.retained_state_sha256,
    authority_envelope: authorityEnvelope,
    authority_envelope_sha256: authorityEnvelopeSha256,
    resource_plan: resourcePlan,
    resource_plan_sha256: resourcePlanSha256,
    operation_reservation: operationReservation,
    recovery_operation_state: recoveryOperationState,
    journal_identity_sha256: journalIdentitySha256,
    lifecycle_state: "READY",
    authorization_class: "NONE",
    budgets: {
      requests: { limit: 16, used: 0 },
      mutations: { limit: 15, used: 0 },
    },
    owned_resources: [],
    effect_ledger: [],
    transition_history: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
    checkpoint: {
      schema_version: 1,
      sequence: 0,
      predecessor_checkpoint_identity_sha256:
        deriveCheckpointRootSha256(journalIdentitySha256),
      checkpoint_identity_sha256: "0".repeat(64),
    },
  };
  return resealCheckpointState(state);
}

function rejectStaging(fake) {
  fake.contract.staging.verifyReadOnly = async (request) => {
    fake.events.push("staging:reject");
    return {
      status: "REJECTED",
      writes: 0,
      operation_slot_sha256:
        request.operation_slot.operation_slot_sha256,
      reservation_proof_sha256: request.reservation_proof_sha256,
    };
  };
}

async function exactOrdinaryCleanupFixture(adapterOptions = {}) {
  const fake = adapters(adapterOptions);
  installFutureAuthority(fake);
  rejectStaging(fake);
  const result = await runQualification(qualificationInput(fake));
  return { fake, result };
}

async function exactCompensationFaultFixture(adapterOptions = {}) {
  const fake = adapters(adapterOptions);
  installFutureAuthority(fake);
  let rejectedQualified = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (!rejectedQualified && state.lifecycle_state === "QUALIFIED") {
          rejectedQualified = true;
          throw new Error("synthetic qualified terminal rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  assert.equal(rejectedQualified, true);
  return { fake, result };
}

function round18RetainedChronology(state) {
  const retained = state.owned_resources.find(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  assert.ok(retained);
  const retainedIndex = state.resource_plan.findIndex(
    (resource) => resource.resource_key === retained.resource_key,
  );
  assert.ok(retainedIndex >= 0);
  return {
    primary: qualificationOperationSlot(
      state,
      "requests",
      3,
      "QUALIFICATION_VERIFY_CLEANUP",
    ),
    deletion: qualificationOperationSlot(
      state,
      "mutations",
      5 + retainedIndex,
      "QUALIFICATION_DELETE_EXACT",
      retained.resource_key,
    ),
    compensation: qualificationOperationSlot(
      state,
      "requests",
      4,
      "QUALIFICATION_VERIFY_CLEANUP",
    ),
    ledger: state.effect_ledger.find(
      (entry) => entry.resource_key === retained.resource_key,
    ),
  };
}

function rewriteVerificationAsRetainedSuccess(state, index = 3) {
  const retained = state.owned_resources.filter(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  assert.equal(retained.length, 1);
  return rewriteQualificationOperationReceipt(
    state,
    "requests",
    index,
    "QUALIFICATION_VERIFY_CLEANUP",
    null,
    (receipt) => ({
      ...receipt,
      retained_preview_count: 1,
      verified_present_resources: retained.map((resource) => ({
        resource_key: resource.resource_key,
        locator_sha256: resource.owner.locator_sha256,
      })),
      verified_absent_resource_keys: state.owned_resources
        .filter(
          (resource) =>
            !retained.some(
              (candidate) => candidate.resource_key === resource.resource_key,
            ),
        )
        .map((resource) => resource.resource_key),
    }),
  );
}

function round18LocalFailedRecoverable(state) {
  const mutable = structuredClone(state);
  mutable.lifecycle_state = "FAILED_RECOVERABLE";
  mutable.authorization_class = "LOCAL_QUALIFICATION";
  mutable.transition_history =
    mutable.transition_history.at(-1)?.to === "QUALIFYING"
      ? [
          ...mutable.transition_history,
          {
            from: "QUALIFYING",
            to: "FAILED_RECOVERABLE",
            authorization_class: "LOCAL_QUALIFICATION",
            review_sha256: ACTIVATION_REVIEW_SHA256,
          },
        ]
      : [
          ...mutable.transition_history.slice(0, -1),
          {
            from: "QUALIFYING",
            to: "FAILED_RECOVERABLE",
            authorization_class: "LOCAL_QUALIFICATION",
            review_sha256: ACTIVATION_REVIEW_SHA256,
          },
        ];
  mutable.cleanup = { required: true, verified: false };
  mutable.recovery = { status: "PENDING", resume_to: "READY" };
  mutable.outcome = { code: "QUALIFICATION_FAILED", successful: false };
  delete mutable.final_evidence_identity_sha256;
  return mutable;
}

function downgradeQualificationResultToReserved(slot) {
  assert.equal(slot.status, "RESULT_APPLIED");
  slot.status = "RESERVED";
  slot.receipt = null;
  slot.receipt_sha256 = null;
}

async function recoverRound18AllAbsent(fake, reviewedState) {
  const journal = reviewedState.journal_identity_sha256;
  let inspections = 0;
  let reconciliations = 0;
  const recovered = await recoverQualification({
    loadAuthoritativeState: async () =>
      structuredClone(fake.checkpointStates.get(journal)),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, reviewedState),
    },
    checkpointRecoveryState: async (state, command) =>
      fake.commitCheckpoint(state, command),
    readCheckpointHead: async (request) => fake.readCheckpointHead(request),
    inspectOwnedResource: async (_resource, context) => {
      inspections += 1;
      return {
        status: "ABSENT",
        operation_slot_sha256:
          context.operation_slot.operation_slot_sha256,
        operation_binding_sha256: context.operation_binding_sha256,
      };
    },
    reconcileOwnedResource: async () => {
      reconciliations += 1;
      throw new Error("verified-absent resources must not be reconciled");
    },
  });
  return { inspections, reconciliations, recovered };
}

await check("Round18 empty compact story remains evidence-only, never a loaded BEGIN", async () => {
  const compactReady = exactReadyEvidenceFixture();
  assert.equal(validateCompactEvidence(compactReady), true);
  const loaded = exactEmptyLoadedBeginFixture();
  const { calls, result } = await recoverForPreAdapterValidation(loaded);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");

  const invalidInput = await runQualification({
    candidate_identity_sha256: CANDIDATE,
    run_id: RUN_ID,
  });
  assert.equal(invalidInput.state.lifecycle_state, "FAILED_CLOSED");
  assert.deepEqual(invalidInput.state.resource_plan, []);
  assert.equal(validateCompactEvidence(invalidInput.evidence), true);

  const loadedTerminal = structuredClone(loaded);
  loadedTerminal.lifecycle_state = "FAILED_CLOSED";
  loadedTerminal.outcome = {
    code: "QUALIFICATION_AUTHORITY_INVALID",
    successful: false,
  };
  loadedTerminal.final_evidence_identity_sha256 = sha256Hex(
    canonicalJson(compactEvidencePayloadFromState(loadedTerminal)),
  );
  const sealedTerminal = resealCheckpointState(loadedTerminal);
  const terminalAttempt = await recoverForPreAdapterValidation(sealedTerminal);
  assert.deepEqual(terminalAttempt.calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(
    terminalAttempt.result,
    "RECOVERY_STATE_INVALID",
  );
});

await check("Round18 delete-before-slot3 cannot be resealed as retained success", async () => {
  const { result: authentic } = await exactOrdinaryCleanupFixture();
  assert.equal(authentic.state.lifecycle_state, "FAILED_CLOSED");
  const authenticChronology = round18RetainedChronology(authentic.state);
  assert.equal(authenticChronology.deletion.status, "RESULT_APPLIED");
  assert.equal(authenticChronology.primary.status, "RESULT_APPLIED");
  assert.equal(authenticChronology.primary.receipt.retained_preview_count, 0);
  assert.ok(
    authenticChronology.deletion.reservation_ordinal <
      authenticChronology.primary.reservation_ordinal,
  );

  const malformed = localFailedRecoverableFromQualified(authentic.state);
  rewriteVerificationAsRetainedSuccess(malformed);
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round18 verifier-crash cleanup prefix is bridge-emittable", async () => {
  const fake = adapters({
    finalCleanupMode: "THROW_FIRST",
  });
  installFutureAuthority(fake);
  const result = await runQualification(qualificationInput(fake));
  const chronology = round18RetainedChronology(result.state);
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(chronology.primary.status, "RESERVED");
  assert.equal(chronology.deletion.status, "RESULT_APPLIED");
  assert.equal(chronology.deletion.receipt.status, "DELETED_EXACT");
  assert.equal(chronology.compensation.status, "NOT_STARTED");
  assert.ok(
    chronology.primary.reservation_ordinal <
      chronology.deletion.reservation_ordinal,
  );
  assert.equal(fake.present.size, 0);
  assert.equal(validateCompactEvidence(result.evidence), true);

  const { inspections, reconciliations, recovered } =
    await recoverRound18AllAbsent(fake, result.state);
  assert.equal(inspections, 5);
  assert.equal(reconciliations, 0);
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
  assert.equal(recovered.recovery.status, "COMPLETE");
});

await check("Round18 slot3 reservation cannot inherit post-success verified ledger", async () => {
  const authentic = await exactPostRetainedDeleteBeforeSlot4Fixture();
  const malformed = round18LocalFailedRecoverable(authentic);
  const chronology = round18RetainedChronology(malformed);
  assert.ok(
    malformed.effect_ledger.some(
      (entry) => entry.cleanup_status === "VERIFIED",
    ),
  );
  downgradeQualificationResultToReserved(chronology.primary);
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round18 slot4 reservation rejects a reserved delete with applied ledger", async () => {
  const authentic = await exactPostRetainedDeleteBeforeSlot4Fixture();
  const malformed = round18LocalFailedRecoverable(authentic);
  const chronology = round18RetainedChronology(malformed);
  downgradeQualificationResultToReserved(chronology.deletion);
  reserveCompensationVerifierForFixture(malformed);
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round18 compensation delete-fault slot4 reservation is bridge-emittable", async () => {
  const { fake, result } = await exactCompensationFaultFixture({
    failCleanupType: "PREVIEW_DEPLOYMENT",
  });
  const chronology = round18RetainedChronology(result.state);
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(chronology.primary.status, "RESULT_APPLIED");
  assert.equal(chronology.primary.receipt.retained_preview_count, 1);
  assert.equal(chronology.deletion.status, "RESERVED");
  assert.equal(chronology.compensation.status, "RESERVED");
  assert.equal(chronology.ledger.cleanup_status, "UNCERTAIN");
  assert.ok(
    chronology.primary.reservation_ordinal <
      chronology.deletion.reservation_ordinal,
  );
  assert.ok(
    chronology.deletion.reservation_ordinal <
      chronology.compensation.reservation_ordinal,
  );
  assert.equal(fake.present.size, 1);
  assert.equal(validateCompactEvidence(result.evidence), true);
});

await check("Round18 slot4 cannot progress while retained delete is only in flight", async () => {
  const { result } = await exactCompensationFaultFixture({
    failCleanupType: "PREVIEW_DEPLOYMENT",
  });
  const malformed = structuredClone(result.state);
  const chronology = round18RetainedChronology(malformed);
  assert.equal(chronology.deletion.status, "RESERVED");
  assert.equal(chronology.compensation.status, "RESERVED");
  chronology.ledger.cleanup_status = "INTENT_ONLY";
  const sealed = resealTerminalJournal(malformed);
  const { calls, result: recovered } =
    await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(recovered, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round18 reserved slot4 cannot inherit a locally verified retained delete", async () => {
  const authentic = await exactPostRetainedDeleteBeforeSlot4Fixture();
  const malformed = round18LocalFailedRecoverable(authentic);
  reserveCompensationVerifierForFixture(malformed);
  const chronology = round18RetainedChronology(malformed);
  assert.equal(chronology.deletion.status, "RESULT_APPLIED");
  assert.equal(chronology.compensation.status, "RESERVED");
  chronology.ledger.cleanup_status = "VERIFIED";
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round18 terminal slot4 zero requires verified retained delete", async () => {
  const { result: authentic } =
    await exactLocalCompensatedFailedClosedFixture();
  const malformed = structuredClone(authentic.state);
  const chronology = round18RetainedChronology(malformed);
  assert.equal(chronology.deletion.status, "RESULT_APPLIED");
  assert.equal(chronology.compensation.status, "RESULT_APPLIED");
  chronology.ledger.cleanup_status = "APPLIED";
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round18 in-flight retained delete cannot be resealed as returned failure", async () => {
  const { fake } = await exactCompensationFaultFixture({
    failCleanupType: "PREVIEW_DEPLOYMENT",
  });
  const authentic = fake.checkpoints.find((candidate) => {
    if (candidate.lifecycle_state !== "QUALIFYING") return false;
    if (
      !candidate.owned_resources.some(
        (resource) =>
          resource.resource_type === "PREVIEW_DEPLOYMENT" &&
          resource.owner.cleanup_policy ===
            "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
      )
    ) {
      return false;
    }
    const chronology = round18RetainedChronology(candidate);
    return (
      chronology.primary?.status === "RESULT_APPLIED" &&
      chronology.primary.receipt?.retained_preview_count === 1 &&
      chronology.deletion?.status === "RESERVED" &&
      chronology.ledger?.cleanup_status === "INTENT_ONLY" &&
      chronology.compensation?.status === "NOT_STARTED"
    );
  });
  assert.ok(authentic);
  validateRecoveryState(resealCheckpointState(authentic));
  const malformed = round18LocalFailedRecoverable(authentic);
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round18 delete response loss plus exact later zero remains honest recovery-pending", async () => {
  const { fake, result } = await exactCompensationFaultFixture({
    deleteThenThrowType: "PREVIEW_DEPLOYMENT",
  });
  assert.equal(result.state.result_type, undefined);
  const chronology = round18RetainedChronology(result.state);
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.deepEqual(result.state.cleanup, { required: true, verified: false });
  assert.deepEqual(result.state.recovery, {
    status: "PENDING",
    resume_to: "READY",
  });
  assert.equal(result.state.outcome.successful, false);
  assert.equal(chronology.primary.status, "RESULT_APPLIED");
  assert.equal(chronology.primary.receipt.retained_preview_count, 1);
  assert.equal(chronology.deletion.status, "RESERVED");
  assert.equal(chronology.ledger.cleanup_status, "UNCERTAIN");
  assert.equal(chronology.compensation.status, "RESULT_APPLIED");
  assert.equal(chronology.compensation.receipt.retained_preview_count, 0);
  assert.ok(
    chronology.primary.reservation_ordinal <
      chronology.deletion.reservation_ordinal,
  );
  assert.ok(
    chronology.deletion.reservation_ordinal <
      chronology.compensation.reservation_ordinal,
  );
  assert.equal(fake.present.size, 0);
  assert.equal(validateCompactEvidence(result.evidence), true);
  const { inspections, reconciliations, recovered } =
    await recoverRound18AllAbsent(fake, result.state);
  assert.equal(inspections, 5);
  assert.equal(reconciliations, 0);
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
  assert.equal(recovered.recovery.status, "COMPLETE");
});

await check("Round18 ordinary delete response loss plus slot3 zero remains honest recovery-pending", async () => {
  const { fake, result } = await exactOrdinaryCleanupFixture({
    deleteThenThrowType: "PREVIEW_DEPLOYMENT",
  });
  assert.equal(result.state.result_type, undefined);
  const chronology = round18RetainedChronology(result.state);
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.deepEqual(result.state.cleanup, { required: true, verified: false });
  assert.deepEqual(result.state.recovery, {
    status: "PENDING",
    resume_to: "READY",
  });
  assert.equal(result.state.outcome.successful, false);
  assert.equal(chronology.deletion.status, "RESERVED");
  assert.equal(chronology.ledger.cleanup_status, "UNCERTAIN");
  assert.equal(chronology.primary.status, "RESULT_APPLIED");
  assert.equal(chronology.primary.receipt.retained_preview_count, 0);
  assert.equal(chronology.compensation.status, "NOT_STARTED");
  assert.ok(
    chronology.deletion.reservation_ordinal <
      chronology.primary.reservation_ordinal,
  );
  assert.equal(fake.present.size, 0);
  assert.equal(validateCompactEvidence(result.evidence), true);
  const { inspections, reconciliations, recovered } =
    await recoverRound18AllAbsent(fake, result.state);
  assert.equal(inspections, 5);
  assert.equal(reconciliations, 0);
  assert.equal(recovered.lifecycle_state, "READY", recovered.outcome.code);
  assert.equal(recovered.recovery.status, "COMPLETE");
});

await check("Round18 Storage mismatch then external absence stays fail-closed despite exact zero", async () => {
  const { fake, result } = await exactOrdinaryCleanupFixture({
    storageCleanupStatus: "VERSION_MISMATCH",
    storageDisappearsAfterMismatch: true,
  });
  const storage = result.state.owned_resources.find(
    (resource) => resource.resource_type === "STORAGE_OBJECT",
  );
  assert.ok(storage);
  const storageIndex = result.state.resource_plan.findIndex(
    (resource) => resource.resource_key === storage.resource_key,
  );
  const deletion = qualificationOperationSlot(
    result.state,
    "mutations",
    5 + storageIndex,
    "QUALIFICATION_DELETE_EXACT",
    storage.resource_key,
  );
  const ledger = result.state.effect_ledger.find(
    (entry) => entry.resource_key === storage.resource_key,
  );
  const chronology = round18RetainedChronology(result.state);
  assert.equal(deletion.status, "RESULT_APPLIED");
  assert.equal(deletion.receipt.status, "VERSION_MISMATCH");
  assert.equal(ledger.cleanup_status, "VERSION_MISMATCH_PRESERVED");
  assert.equal(chronology.primary.status, "RESULT_APPLIED");
  assert.equal(chronology.primary.receipt.retained_preview_count, 0);
  assert.ok(deletion.reservation_ordinal < chronology.primary.reservation_ordinal);
  assert.equal(result.state.lifecycle_state, "FAILED_RECOVERABLE");
  assert.deepEqual(result.state.cleanup, { required: true, verified: false });
  assert.deepEqual(result.state.recovery, {
    status: "PENDING",
    resume_to: "READY",
  });
  assert.equal(result.state.outcome.successful, false);
  assert.equal(fake.present.size, 0);
  assert.equal(validateCompactEvidence(result.evidence), true);

  const falseClosure = structuredClone(result.state);
  falseClosure.lifecycle_state = "FAILED_CLOSED";
  falseClosure.transition_history = [
    ...falseClosure.transition_history.slice(0, -1),
    {
      from: "QUALIFYING",
      to: "FAILED_CLOSED",
      authorization_class: "LOCAL_QUALIFICATION",
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
  ];
  falseClosure.cleanup = { required: true, verified: true };
  falseClosure.recovery = { status: "NOT_REQUIRED" };
  const sealedFalseClosure = resealTerminalJournal(falseClosure);
  const falseClosureAttempt =
    await recoverForPreAdapterValidation(sealedFalseClosure);
  assert.deepEqual(falseClosureAttempt.calls, {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  });
  assertRecoveryFailureProjection(
    falseClosureAttempt.result,
    "RECOVERY_STATE_INVALID",
  );
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(
        compactEvidencePayloadFromState(sealedFalseClosure),
      ),
    ),
    false,
  );
});

await check("Round18 pre-create intent cleanup stays exact NOT_REQUIRED before slot3 zero", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let rejectedIntentCheckpoint = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (
          !rejectedIntentCheckpoint &&
          state.lifecycle_state === "QUALIFYING" &&
          state.effect_ledger.at(-1)?.status === "INTENT_ONLY"
        ) {
          rejectedIntentCheckpoint = true;
          throw new Error("synthetic pre-create intent checkpoint rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  assert.equal(rejectedIntentCheckpoint, true);
  const notRequired = result.state.effect_ledger.find(
    (entry) => entry.cleanup_status === "NOT_REQUIRED",
  );
  assert.ok(notRequired);
  const resourceIndex = result.state.resource_plan.findIndex(
    (resource) => resource.resource_key === notRequired.resource_key,
  );
  const deletion = qualificationOperationSlot(
    result.state,
    "mutations",
    5 + resourceIndex,
    "QUALIFICATION_DELETE_EXACT",
    notRequired.resource_key,
  );
  const primary = qualificationOperationSlot(
    result.state,
    "requests",
    3,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  const compensation = qualificationOperationSlot(
    result.state,
    "requests",
    4,
    "QUALIFICATION_VERIFY_CLEANUP",
  );
  assert.equal(notRequired.status, "CLEANED");
  assert.equal(deletion.status, "NOT_STARTED");
  assert.equal(primary.status, "RESULT_APPLIED");
  assert.equal(primary.receipt.retained_preview_count, 0);
  assert.equal(compensation.status, "NOT_STARTED");
  assert.equal(validateCompactEvidence(result.evidence), true);
});

function round19ZeroAdapterCalls() {
  return {
    head: 0,
    grant: 0,
    checkpoint: 0,
    inspect: 0,
    reconcile: 0,
  };
}

function round19RetainedEntry(state) {
  const retained = state.owned_resources.find(
    (resource) =>
      resource.resource_type === "PREVIEW_DEPLOYMENT" &&
      resource.owner.cleanup_policy ===
        "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
  );
  assert.ok(retained);
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === retained.resource_key,
  );
  assert.ok(entry);
  return entry;
}

async function round19ExactGrantedMutablePrefix(state) {
  const authoritative = resealCheckpointState(state);
  let grantedCandidate = null;
  const result = await recoverQualification({
    loadAuthoritativeState: async () => structuredClone(authoritative),
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      verifyReviewedRecoveryAuthorization: async (request) =>
        futureRecoveryAuthorityResponse(request, authoritative),
    },
    checkpointRecoveryState: async (candidate) => {
      if (
        candidate.authorization_class === "RECOVERY_CONTROLLER" &&
        candidate.recovery_operation_state.recovery_grant !== null
      ) {
        grantedCandidate = structuredClone(candidate);
      }
      const error = new Error("synthetic exact not-committed grant checkpoint");
      error.code = "CHECKPOINT_NOT_COMMITTED";
      throw error;
    },
    readCheckpointHead: async () => exactCheckpointHead(authoritative),
    inspectOwnedResource: async () => {
      throw new Error("grant fixture must stop before inspection");
    },
    reconcileOwnedResource: async () => {
      throw new Error("grant fixture must stop before reconciliation");
    },
  });
  assertRecoveryFailureProjection(result, "RECOVERY_CHECKPOINT_FAILED");
  assert.ok(grantedCandidate);
  validateRecoveryState(grantedCandidate);
  return grantedCandidate;
}

async function round19PreCreateNotRequiredFixture() {
  const fake = adapters();
  installFutureAuthority(fake);
  let rejectedIntentCheckpoint = false;
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        if (
          !rejectedIntentCheckpoint &&
          state.lifecycle_state === "QUALIFYING" &&
          state.effect_ledger.at(-1)?.status === "INTENT_ONLY"
        ) {
          rejectedIntentCheckpoint = true;
          throw new Error("synthetic Round19 pre-create checkpoint rejection");
        }
        return fake.commitCheckpoint(state, command);
      },
    }),
  );
  assert.equal(rejectedIntentCheckpoint, true);
  const entry = result.state.effect_ledger.find(
    (candidate) => candidate.cleanup_status === "NOT_REQUIRED",
  );
  assert.ok(entry);
  const resourceIndex = result.state.resource_plan.findIndex(
    (resource) => resource.resource_key === entry.resource_key,
  );
  const creation = qualificationOperationSlot(
    result.state,
    "mutations",
    resourceIndex,
    "QUALIFICATION_CREATE_NEW",
    entry.resource_key,
  );
  const deletion = qualificationOperationSlot(
    result.state,
    "mutations",
    5 + resourceIndex,
    "QUALIFICATION_DELETE_EXACT",
    entry.resource_key,
  );
  assert.equal(entry.status, "CLEANED");
  assert.equal(entry.creation_receipt_sha256, null);
  assert.equal(creation.status, "NOT_STARTED");
  assert.equal(deletion.status, "NOT_STARTED");
  return { result, entry, creation, deletion };
}

await check("Round19 mutable local failure rejects retained Preview before every adapter", async () => {
  const mutable = round18LocalFailedRecoverable(round17QualifiedTerminal);
  const retained = round19RetainedEntry(mutable);
  assert.equal(retained.status, "APPLIED");
  assert.equal(retained.cleanup_status, "RETAINED");
  const sealed = resealCheckpointState(mutable);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round19 mutable granted controller rejects retained Preview before every adapter", async () => {
  const unresolved = round18LocalFailedRecoverable(round17QualifiedTerminal);
  round19RetainedEntry(unresolved).cleanup_status = "PENDING";
  const granted = await round19ExactGrantedMutablePrefix(unresolved);
  const retained = round19RetainedEntry(granted);
  assert.equal(retained.status, "APPLIED");
  assert.equal(retained.cleanup_status, "PENDING");
  retained.cleanup_status = "RETAINED";
  const sealed = resealCheckpointState(granted);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

const { fake: round19ExactDeletedFake, result: round19ExactDeletedResult } =
  await exactOrdinaryCleanupFixture();
const round19ExactDeletedControl = round18LocalFailedRecoverable(
  round19ExactDeletedResult.state,
);
const round19ExactDeletedEntry = round19ExactDeletedControl.effect_ledger.find(
  (entry) => isSha256(entry.creation_receipt_sha256),
);
assert.ok(round19ExactDeletedEntry);
round19ExactDeletedEntry.status = "CLEANED";
round19ExactDeletedEntry.cleanup_status = "APPLIED";
const round19ExactDeletedIndex =
  round19ExactDeletedControl.resource_plan.findIndex(
    (resource) =>
      resource.resource_key === round19ExactDeletedEntry.resource_key,
  );
const round19ExactDeletedCreation = qualificationOperationSlot(
  round19ExactDeletedControl,
  "mutations",
  round19ExactDeletedIndex,
  "QUALIFICATION_CREATE_NEW",
  round19ExactDeletedEntry.resource_key,
);
const round19ExactDeletedDeletion = qualificationOperationSlot(
  round19ExactDeletedControl,
  "mutations",
  5 + round19ExactDeletedIndex,
  "QUALIFICATION_DELETE_EXACT",
  round19ExactDeletedEntry.resource_key,
);
assert.equal(round19ExactDeletedCreation.status, "RESULT_APPLIED");
assert.equal(round19ExactDeletedDeletion.status, "RESULT_APPLIED");
assert.equal(round19ExactDeletedDeletion.receipt.status, "DELETED_EXACT");
const round19ExactDeletedSealed = resealCheckpointState(
  round19ExactDeletedControl,
);
validateRecoveryState(round19ExactDeletedSealed);
assert.equal(
  runtimeEvidenceAccepts(
    resealEvidence(compactEvidencePayloadFromState(round19ExactDeletedSealed)),
  ),
  true,
);

await check("Round19 mutable exact deletion cannot be relabeled NOT_REQUIRED", async () => {
  const malformed = structuredClone(round19ExactDeletedSealed);
  malformed.effect_ledger.find(
    (entry) => entry.resource_key === round19ExactDeletedEntry.resource_key,
  ).cleanup_status = "NOT_REQUIRED";
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round19 compact exact deletion cannot be relabeled NOT_REQUIRED", async () => {
  const malformed = structuredClone(round19ExactDeletedSealed);
  malformed.effect_ledger.find(
    (entry) => entry.resource_key === round19ExactDeletedEntry.resource_key,
  ).cleanup_status = "NOT_REQUIRED";
  const evidence = resealEvidence(compactEvidencePayloadFromState(malformed));
  assert.equal(structuralEvidenceSchemaAccepts(evidence), false);
  assert.equal(
    runtimeEvidenceAccepts(evidence),
    false,
  );
});

const { result: round19ResponseLossResult } =
  await exactCompensationFaultFixture({
    failCleanupType: "PREVIEW_DEPLOYMENT",
  });
const round19ResponseLossChronology = round18RetainedChronology(
  round19ResponseLossResult.state,
);
assert.equal(round19ResponseLossChronology.primary.status, "RESULT_APPLIED");
assert.equal(
  round19ResponseLossChronology.primary.receipt.retained_preview_count,
  1,
);
assert.equal(round19ResponseLossChronology.deletion.status, "RESERVED");
assert.equal(round19ResponseLossChronology.compensation.status, "RESERVED");
assert.equal(round19ResponseLossChronology.ledger.status, "APPLIED");
assert.equal(round19ResponseLossChronology.ledger.cleanup_status, "UNCERTAIN");
validateRecoveryState(round19ResponseLossResult.state);
assert.equal(validateCompactEvidence(round19ResponseLossResult.evidence), true);

await check("Round19 mutable response loss cannot be relabeled CLEANED UNCERTAIN", async () => {
  const malformed = structuredClone(round19ResponseLossResult.state);
  round18RetainedChronology(malformed).ledger.status = "CLEANED";
  const sealed = resealCheckpointState(malformed);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round19 compact response loss cannot be relabeled CLEANED UNCERTAIN", async () => {
  const malformed = structuredClone(round19ResponseLossResult.state);
  round18RetainedChronology(malformed).ledger.status = "CLEANED";
  const evidence = resealEvidence(compactEvidencePayloadFromState(malformed));
  assert.equal(structuralEvidenceSchemaAccepts(evidence), false);
  assert.equal(
    runtimeEvidenceAccepts(evidence),
    false,
  );
});

function round19RecoveryAdmissionAccepts(state) {
  try {
    validateRecoveryState(resealCheckpointState(state));
    return true;
  } catch {
    return false;
  }
}

function round19EvidenceAdmissionAccepts(state) {
  return runtimeEvidenceAccepts(
    resealEvidence(compactEvidencePayloadFromState(state)),
  );
}

function round19SetEffectStatus(state, resourceKey, effectStatus) {
  const entry = state.effect_ledger.find(
    (candidate) => candidate.resource_key === resourceKey,
  );
  const planIndex = state.resource_plan.findIndex(
    (resource) => resource.resource_key === resourceKey,
  );
  const creation = qualificationOperationSlot(
    state,
    "mutations",
    planIndex,
    "QUALIFICATION_CREATE_NEW",
    resourceKey,
  );
  assert.ok(entry);
  assert.ok(creation);
  entry.status = effectStatus;
  if (["APPLIED", "CLEANED"].includes(effectStatus)) {
    assert.ok(isSha256(creation.receipt_sha256));
    entry.creation_receipt_sha256 = creation.receipt_sha256;
    return;
  }
  entry.creation_receipt_sha256 = null;
  creation.status = "RESERVED";
  creation.receipt = null;
  creation.receipt_sha256 = null;
}

const round19EffectStatuses = [
  "INTENT_ONLY",
  "APPLIED",
  "UNCERTAIN",
  "CLEANED",
];
const round19CleanupStatuses = [
  "PENDING",
  "NOT_REQUIRED",
  "INTENT_ONLY",
  "APPLIED",
  "UNCERTAIN",
  "VERIFIED",
  "RETAINED",
  "VERSION_MISMATCH_PRESERVED",
];

await check("Round19 exact-delete pair matrix is exhaustive on mutable and compact admission", async () => {
  for (const effectStatus of round19EffectStatuses) {
    for (const cleanupStatus of round19CleanupStatuses) {
      const candidate = structuredClone(round19ExactDeletedSealed);
      round19SetEffectStatus(
        candidate,
        round19ExactDeletedEntry.resource_key,
        effectStatus,
      );
      candidate.effect_ledger.find(
        (entry) => entry.resource_key === round19ExactDeletedEntry.resource_key,
      ).cleanup_status = cleanupStatus;
      const expected =
        effectStatus === "CLEANED" &&
        ["APPLIED", "VERIFIED"].includes(cleanupStatus);
      assert.equal(
        round19RecoveryAdmissionAccepts(candidate),
        expected,
        `mutable:${effectStatus}/${cleanupStatus}:create=${effectStatus === "CLEANED" ? "RESULT_APPLIED" : "COORDINATED"}:delete=DELETED_EXACT`,
      );
      assert.equal(
        round19EvidenceAdmissionAccepts(candidate),
        expected,
        `evidence:${effectStatus}/${cleanupStatus}:create=${effectStatus === "CLEANED" ? "RESULT_APPLIED" : "COORDINATED"}:delete=DELETED_EXACT`,
      );
    }
  }
});

await check("Round19 reserved-delete pair matrix is exhaustive on mutable and compact admission", async () => {
  const resourceKey = round19ResponseLossChronology.ledger.resource_key;
  for (const effectStatus of round19EffectStatuses) {
    for (const cleanupStatus of round19CleanupStatuses) {
      const candidate = structuredClone(round19ResponseLossResult.state);
      round19SetEffectStatus(candidate, resourceKey, effectStatus);
      candidate.effect_ledger.find(
        (entry) => entry.resource_key === resourceKey,
      ).cleanup_status = cleanupStatus;
      const expected =
        effectStatus === "APPLIED" &&
        cleanupStatus === "UNCERTAIN";
      assert.equal(
        round19RecoveryAdmissionAccepts(candidate),
        expected,
        `mutable:${effectStatus}/${cleanupStatus}:delete=RESERVED:slot4=RESERVED`,
      );
      assert.equal(
        round19EvidenceAdmissionAccepts(candidate),
        expected,
        `evidence:${effectStatus}/${cleanupStatus}:delete=RESERVED:slot4=RESERVED`,
      );
    }
  }
});

const round19ReservedPreCreatePrefix = structuredClone(
  round19ExactDeletedFake.checkpoints.find((state) =>
    state.effect_ledger.some((entry) => {
      if (entry.status !== "INTENT_ONLY") return false;
      const planIndex = state.resource_plan.findIndex(
        (resource) => resource.resource_key === entry.resource_key,
      );
      return qualificationOperationSlot(
        state,
        "mutations",
        planIndex,
        "QUALIFICATION_CREATE_NEW",
        entry.resource_key,
      )?.status === "RESERVED";
    }),
  ),
);
assert.ok(round19ReservedPreCreatePrefix);
const round19ReservedPreCreateEntry =
  round19ReservedPreCreatePrefix.effect_ledger.find((entry) => {
    if (entry.status !== "INTENT_ONLY") return false;
    const planIndex = round19ReservedPreCreatePrefix.resource_plan.findIndex(
      (resource) => resource.resource_key === entry.resource_key,
    );
    return qualificationOperationSlot(
      round19ReservedPreCreatePrefix,
      "mutations",
      planIndex,
      "QUALIFICATION_CREATE_NEW",
      entry.resource_key,
    )?.status === "RESERVED";
  });
assert.ok(round19ReservedPreCreateEntry);
round19ReservedPreCreateEntry.status = "CLEANED";
round19ReservedPreCreateEntry.cleanup_status = "NOT_REQUIRED";
const round19ReservedPreCreateMutable = round18LocalFailedRecoverable(
  round19ReservedPreCreatePrefix,
);

await check("Round19 authentic reserved pre-create NOT_REQUIRED prefix remains admitted", async () => {
  const planIndex = round19ReservedPreCreateMutable.resource_plan.findIndex(
    (resource) =>
      resource.resource_key === round19ReservedPreCreateEntry.resource_key,
  );
  const creation = qualificationOperationSlot(
    round19ReservedPreCreateMutable,
    "mutations",
    planIndex,
    "QUALIFICATION_CREATE_NEW",
    round19ReservedPreCreateEntry.resource_key,
  );
  const deletion = qualificationOperationSlot(
    round19ReservedPreCreateMutable,
    "mutations",
    5 + planIndex,
    "QUALIFICATION_DELETE_EXACT",
    round19ReservedPreCreateEntry.resource_key,
  );
  assert.equal(creation.status, "RESERVED");
  assert.equal(round19ReservedPreCreateEntry.creation_receipt_sha256, null);
  assert.equal(deletion.status, "NOT_STARTED");
  assert.equal(round19RecoveryAdmissionAccepts(round19ReservedPreCreateMutable), true);
  assert.equal(round19EvidenceAdmissionAccepts(round19ReservedPreCreateMutable), true);
});

await check("Round19 granted controller exact deletion cannot be relabeled NOT_REQUIRED", async () => {
  const granted = await round19ExactGrantedMutablePrefix(
    round19ExactDeletedSealed,
  );
  granted.effect_ledger.find(
    (entry) => entry.resource_key === round19ExactDeletedEntry.resource_key,
  ).cleanup_status = "NOT_REQUIRED";
  const { calls, result } = await recoverForPreAdapterValidation(
    resealCheckpointState(granted),
  );
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

await check("Round19 granted controller reserved response loss cannot be CLEANED UNCERTAIN", async () => {
  const granted = await round19ExactGrantedMutablePrefix(
    round19ResponseLossResult.state,
  );
  round18RetainedChronology(granted).ledger.status = "CLEANED";
  const { calls, result } = await recoverForPreAdapterValidation(
    resealCheckpointState(granted),
  );
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
});

const round19PreCreate = await round19PreCreateNotRequiredFixture();
await check("Round19 genuine pre-create NOT_REQUIRED pair remains admitted", async () => {
  assert.equal(validateTerminalState(round19PreCreate.result.state).terminal_kind, "FAILED_CLOSED");
  assert.equal(validateCompactEvidence(round19PreCreate.result.evidence), true);
});

await check("Round19 pre-create NOT_REQUIRED rejects a forged creation receipt", async () => {
  const mutable = round18LocalFailedRecoverable(round19PreCreate.result.state);
  mutable.effect_ledger.find(
    (entry) => entry.resource_key === round19PreCreate.entry.resource_key,
  ).creation_receipt_sha256 = "f".repeat(64);
  const sealed = resealCheckpointState(mutable);
  const { calls, result } = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round19 emitter-pair positive matrix remains exact", async () => {
  validateRecoveryState(round19ExactDeletedSealed);
  validateRecoveryState(round19ResponseLossResult.state);
  assert.equal(validateTerminalState(round17QualifiedTerminal).terminal_kind, "QUALIFIED");
  assert.equal(
    validateTerminalState(round17RecoveryCompleteTerminal).terminal_kind,
    "RECOVERY_COMPLETE",
  );
  assert.equal(
    validateTerminalState(round19PreCreate.result.state).terminal_kind,
    "FAILED_CLOSED",
  );
  for (const [name, evidence] of [
    ["exact deletion", resealEvidence(compactEvidencePayloadFromState(round19ExactDeletedSealed))],
    ["response loss", round19ResponseLossResult.evidence],
    ["pre-create", round19PreCreate.result.evidence],
    ["terminal qualified", resealEvidence(compactEvidencePayloadFromState(round17QualifiedTerminal))],
  ]) {
    assert.equal(runtimeEvidenceAccepts(evidence), true, name);
  }
});

await check("Round20 proven delete-reservation noncommit restores PENDING before persistence", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  let injected = false;
  let targetResourceKey = null;
  let pendingSnapshots = 0;
  const deletionFreeUncertainSnapshots = [];
  const result = await runQualification(
    qualificationInput(fake, {
      async checkpoint(state, command) {
        const reservedDeletion =
          !injected &&
          state.recovery_operation_state.qualification_operation_slots.find(
            (slot) =>
              slot.operation === "QUALIFICATION_DELETE_EXACT" &&
              slot.status === "RESERVED",
          );
        if (reservedDeletion) {
          injected = true;
          targetResourceKey = reservedDeletion.resource_key;
          return { status: "CHECKPOINT_NOT_COMMITTED" };
        }
        if (injected && targetResourceKey !== null) {
          const entry = state.effect_ledger.find(
            (candidate) => candidate.resource_key === targetResourceKey,
          );
          const qualificationDelete =
            state.recovery_operation_state.qualification_operation_slots.find(
              (slot) =>
                slot.operation === "QUALIFICATION_DELETE_EXACT" &&
                slot.resource_key === targetResourceKey,
            );
          const recoveryDelete =
            state.recovery_operation_state.operation_slots.find(
              (slot) =>
                slot.operation === "RECOVERY_DELETE_EXACT" &&
                slot.resource_key === targetResourceKey,
            );
          if (
            qualificationDelete?.status === "NOT_STARTED" &&
            recoveryDelete?.status === "NOT_STARTED"
          ) {
            pendingSnapshots += entry?.cleanup_status === "PENDING" ? 1 : 0;
            if (entry?.cleanup_status === "UNCERTAIN") {
              deletionFreeUncertainSnapshots.push(structuredClone(state));
            }
          }
        }
        return fake.commitCheckpoint(state, command);
      },
      readCheckpointHead: async (request) =>
        fake.readCheckpointHead(request),
    }),
  );
  assert.equal(injected, true);
  assert.ok(pendingSnapshots > 0);
  assert.equal(deletionFreeUncertainSnapshots.length, 0);
  assert.equal(validateCompactEvidence(result.evidence), true);
});

await check("Round20 deletion-free UNCERTAIN is rejected on mutable and compact admission", async () => {
  const mutant = round18LocalFailedRecoverable(round17QualifiedTerminal);
  const retained = round19RetainedEntry(mutant);
  assert.equal(retained.status, "APPLIED");
  retained.cleanup_status = "PENDING";
  retained.cleanup_status = "UNCERTAIN";
  const sealed = resealCheckpointState(mutant);
  const attempt = await recoverForPreAdapterValidation(sealed);
  assert.deepEqual(attempt.calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(attempt.result, "RECOVERY_STATE_INVALID");
  assert.equal(
    runtimeEvidenceAccepts(
      resealEvidence(compactEvidencePayloadFromState(sealed)),
    ),
    false,
  );
});

await check("Round20 granted deletion-free UNCERTAIN is rejected before every adapter", async () => {
  const unresolved = round18LocalFailedRecoverable(round17QualifiedTerminal);
  round19RetainedEntry(unresolved).cleanup_status = "PENDING";
  const granted = await round19ExactGrantedMutablePrefix(unresolved);
  const retained = round19RetainedEntry(granted);
  retained.cleanup_status = "UNCERTAIN";
  const attempt = await recoverForPreAdapterValidation(
    resealCheckpointState(granted),
  );
  assert.deepEqual(attempt.calls, round19ZeroAdapterCalls());
  assertRecoveryFailureProjection(attempt.result, "RECOVERY_STATE_INVALID");
});

function round20InstallRejectedDelete(fake, adapterName) {
  let calls = 0;
  fake.contract[adapterName].cleanup = async (resource, context) => {
    calls += 1;
    fake.events.push(
      `cleanup:${resource.resource_type}:${resource.resource_key}`,
    );
    return {
      status: "REJECTED",
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      operation_slot_sha256:
        context.operation_slot.operation_slot_sha256,
      reservation_proof_sha256: context.reservation_proof_sha256,
    };
  };
  return () => calls;
}

function round20AssertRejectedDeleteResult({
  fake,
  result,
  resourceType,
  rejectedCalls,
}) {
  assert.equal(rejectedCalls(), 1);
  const resource = result.evidence.owned_resources.find(
    (candidate) => candidate.resource_type === resourceType,
  );
  assert.ok(resource);
  const planIndex = result.evidence.resource_plan.findIndex(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  const deletion = qualificationOperationSlot(
    result.evidence,
    "mutations",
    5 + planIndex,
    "QUALIFICATION_DELETE_EXACT",
    resource.resource_key,
  );
  const entry = result.evidence.effect_ledger.find(
    (candidate) => candidate.resource_key === resource.resource_key,
  );
  assert.equal(deletion.status, "RESERVED");
  assert.equal(deletion.receipt, null);
  assert.equal(entry.status, "APPLIED");
  assert.equal(entry.cleanup_status, "UNCERTAIN");
  assert.equal(result.evidence.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.evidence.cleanup.verified, false);
  assert.equal(result.evidence.recovery.status, "PENDING");
  assert.equal(result.evidence.outcome.successful, false);
  assert.equal(fake.present.has(resource.resource_key), true);
  assert.equal(JSON.stringify(result.evidence).includes("REJECTED"), false);
  assert.equal(validateCompactEvidence(result.evidence), true);
}

await check("Round20 unsupported ordinary cleanup receipt stays RESERVED and total", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  rejectStaging(fake);
  const rejectedCalls = round20InstallRejectedDelete(fake, "branch");
  let result;
  await assert.doesNotReject(async () => {
    result = await runQualification(qualificationInput(fake));
  });
  round20AssertRejectedDeleteResult({
    fake,
    result,
    resourceType: "GIT_BRANCH",
    rejectedCalls,
  });
});

await check("Round20 unsupported compensation cleanup receipt stays RESERVED and total", async () => {
  const fake = adapters();
  installFutureAuthority(fake);
  const rejectedCalls = round20InstallRejectedDelete(fake, "preview");
  let terminalRejected = false;
  let result;
  await assert.doesNotReject(async () => {
    result = await runQualification(
      qualificationInput(fake, {
        async checkpoint(state, command) {
          if (!terminalRejected && state.lifecycle_state === "QUALIFIED") {
            terminalRejected = true;
            throw new Error("synthetic Round20 terminal rejection");
          }
          return fake.commitCheckpoint(state, command);
        },
        readCheckpointHead: async (request) =>
          fake.readCheckpointHead(request),
      }),
    );
  });
  assert.equal(terminalRejected, true);
  round20AssertRejectedDeleteResult({
    fake,
    result,
    resourceType: "PREVIEW_DEPLOYMENT",
    rejectedCalls,
  });
});

if (failures.length > 0) {
  console.log(
    `FAIL_ACTIVATION_BRIDGE assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_ACTIVATION_BRIDGE assertions=${assertions} synthetic_only=true retained_previews=1 network=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
