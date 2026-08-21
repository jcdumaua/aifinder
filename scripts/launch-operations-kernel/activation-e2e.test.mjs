import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ACTIVATION_OPERATION_CLASS,
  ACTIVATION_REVIEW_SHA256,
  recoverQualification,
  runQualification,
} from "./activation-bridge.mjs";
import { verifyRepositoryCandidateManifest } from "./manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FREEZE_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/legacy-freeze.json",
);
const FREEZE_BYTES = readFileSync(FREEZE_PATH);
const MANIFEST_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/candidate-manifest.json",
);
const CANDIDATE = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  .candidate_identity_sha256;
const LEGACY_CANDIDATE =
  "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71";
const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.message ?? error?.code ?? "UNKNOWN"}`);
  }
}

function classification() {
  return {
    schema_version: 1,
    classification: "FAIL_CLOSED_UNRESOLVED",
    authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
    recovery_state: "EXECUTION_IN_PROGRESS",
    recovery_stage: "PRIOR_RECONCILIATION",
    guard: { owner_pid: 12605, status: "DEAD", recovery_root_binding_exact: true },
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
      environment_cleanup_intents: { ADMIN_PASSWORD: 0, ADMIN_SESSION_SECRET: 0 },
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
  };
}

function qualificationReceiptContext(context) {
  return context?.reservation_proof_sha256
    ? {
        reservation_proof_sha256: context.reservation_proof_sha256,
      }
    : {};
}

function input() {
  const resources = new Map();
  const checkpoints = [];
  const checkpointHeads = new Map();
  const checkpointStates = new Map();
  const create = async (resource, context) => {
    resources.set(resource.resource_key, { resource, version: "version-1" });
    return {
      status: "CREATED_NEW",
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      authority_envelope_sha256: context.authority_envelope_sha256,
      operation_slot_sha256: context.operation_slot.operation_slot_sha256,
      ...qualificationReceiptContext(context),
    };
  };
  const cleanup = async (resource, context) => {
    resources.delete(resource.resource_key);
    return {
      status: "DELETED_EXACT",
      resource_key: resource.resource_key,
      locator_sha256: resource.owner.locator_sha256,
      operation_slot_sha256: context.operation_slot.operation_slot_sha256,
      ...qualificationReceiptContext(context),
    };
  };
  return {
    resources,
    checkpoints,
    checkpointHeads,
    checkpointStates,
    request: {
      candidate_identity_sha256: CANDIDATE,
      run_id: "qualification-run-e2e-0001",
      phase: "34JA-34JZ",
      operation_class: ACTIVATION_OPERATION_CLASS,
      authorization: {
        schema_version: 1,
        authorization_class: "LOCAL_QUALIFICATION",
        candidate_identity_sha256: CANDIDATE,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      budgets: {
        requests: { limit: 16, used: 0 },
        mutations: { limit: 15, used: 0 },
      },
      freeze_closure: {
        freeze_document_bytes: Buffer.from(FREEZE_BYTES),
        legacy_classification: classification(),
        approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
        policy: {
          preserve_ambiguous_legacy_resources: true,
          fresh_ownership_namespace: true,
          claim_legacy_resources: false,
        },
      },
      retain_preview_on_success: true,
      resource_plan: [
        {
          resource_type: "GIT_BRANCH",
          locator: {
            repository: "aifinder",
            branch: "qualification-run-e2e-0001",
            expected_commit_sha256: "b".repeat(64),
          },
          cleanup_policy: "DELETE_EXACT",
        },
        {
          resource_type: "PREVIEW_DEPLOYMENT",
          locator: { project_id: "project-1", deployment_id: "preview-e2e-1" },
          cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
        },
        {
          resource_type: "ENVIRONMENT_RECORD",
          locator: { project_id: "project-1", key: "ACCESS", target: "preview-e2e-1" },
          cleanup_policy: "DELETE_EXACT",
        },
        {
          resource_type: "DATABASE_ROW",
          locator: { relation: "discovered_tools", id: "synthetic-e2e-1" },
          cleanup_policy: "DELETE_EXACT",
        },
        {
          resource_type: "STORAGE_OBJECT",
          locator: { bucket: "tool-logos", name: "synthetic-e2e-1.png" },
          cleanup_policy: "DELETE_EXACT",
          storage_cas: {
            expected_version: "version-1",
            delete_capability_sha256: "c".repeat(64),
          },
        },
      ],
      adapters: {
        authority: {
          async verifyAuthorityEnvelope(request) {
            const verified = verifyRepositoryCandidateManifest({
              repositoryRoot: ROOT,
              manifestPath: MANIFEST_PATH,
            });
            const envelope = request.authority_envelope;
            return {
              status: "VERIFIED_AUTHORITY_ENVELOPE",
              candidate_identity_sha256: verified.candidate_identity_sha256,
              run_id: envelope.run_id,
              phase: envelope.phase,
              operation_class: envelope.operation_class,
              approval_digest_sha256: envelope.review_approval_sha256,
              freeze_document_sha256: envelope.freeze_document_sha256,
              current_retained_state_attestation_sha256:
                envelope.current_retained_state_attestation_sha256,
              resource_plan_sha256: envelope.resource_plan_sha256,
              authority_envelope_sha256: request.authority_envelope_sha256,
              operation_slot_sha256:
                request.operation_slot.operation_slot_sha256,
              ...qualificationReceiptContext(request),
            };
          },
        },
        namespace: {
          verifyFresh: async (request) => ({
            status: "FRESH",
            authority_envelope_sha256: request.authority_envelope_sha256,
            resource_plan_sha256: request.resource_plan_sha256,
            operation_slot_sha256:
              request.operation_slot.operation_slot_sha256,
            ...qualificationReceiptContext(request),
            proofs: request.resource_plan.map((resource) => ({
              resource_key: resource.resource_key,
              locator_sha256: resource.owner.locator_sha256,
              status: "ABSENT",
            })),
          }),
        },
        branch: { create, cleanup },
        preview: { create, cleanup },
        environment: { create, cleanup },
        fixture: { create, cleanup },
        staging: {
          verifyReadOnly: async (request) => ({
            status: "VERIFIED_READ_ONLY",
            writes: 0,
            operation_slot_sha256:
              request.operation_slot.operation_slot_sha256,
            ...qualificationReceiptContext(request),
          }),
        },
        storage: {
          async cleanupExactVersion(resource, cas, context) {
            const current = resources.get(resource.resource_key);
            if (current?.version !== cas.expected_version) {
              return {
                status: "VERSION_MISMATCH",
                resource_key: resource.resource_key,
                locator_sha256: resource.owner.locator_sha256,
                expected_version: cas.expected_version,
                observed_version: current?.version ?? "ABSENT",
                operation_slot_sha256:
                  context.operation_slot.operation_slot_sha256,
                ...qualificationReceiptContext(context),
              };
            }
            resources.delete(resource.resource_key);
            return {
              status: "DELETED_EXACT",
              resource_key: resource.resource_key,
              locator_sha256: resource.owner.locator_sha256,
              expected_version: cas.expected_version,
              operation_slot_sha256:
                context.operation_slot.operation_slot_sha256,
              ...qualificationReceiptContext(context),
            };
          },
        },
        finalCleanup: {
          async verify(request) {
            return {
              status: "VERIFIED",
              retained_preview_count: request.retained_resource_keys.filter((key) =>
                resources.has(key),
              ).length,
              verified_present_resources: request.owned_resources
                .filter((resource) =>
                  request.retained_resource_keys.includes(resource.resource_key),
                )
                .filter((resource) => resources.has(resource.resource_key))
                .map((resource) => ({
                  resource_key: resource.resource_key,
                  locator_sha256: resource.owner.locator_sha256,
                })),
              verified_absent_resource_keys: request.owned_resources
                .filter((resource) => !request.retained_resource_keys.includes(resource.resource_key))
                .filter((resource) => !resources.has(resource.resource_key))
                .map((resource) => resource.resource_key),
              operation_slot_sha256:
                request.operation_slot.operation_slot_sha256,
              ...qualificationReceiptContext(request),
            };
          },
        },
      },
      async checkpoint(state, command) {
        checkpoints.push(structuredClone(state));
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
    },
  };
}

await check("synthetic activation E2E finalizes compact evidence", async () => {
  const fixture = input();
  const result = await runQualification(fixture.request);
  assert.equal(result.state.lifecycle_state, "QUALIFIED", result.state.outcome.code);
  assert.equal(result.retained_resources.length, 1);
  assert.equal(fixture.resources.size, 1);
  assert.equal(
    [...fixture.resources.values()][0].resource.resource_type,
    "PREVIEW_DEPLOYMENT",
  );
  assert.equal(result.state.cleanup.verified, true);
  assert.equal(result.evidence.evidence_identity_sha256.length, 64);
  assert.equal(result.evidence.immutable_audit_reference_sha256.length, 2);
  assert.equal(result.evidence.run_id, "qualification-run-e2e-0001");
  assert.equal(fixture.checkpoints.at(-1).lifecycle_state, "QUALIFIED");
  assert.ok(fixture.checkpoints.length >= 10);
});

await check("bridge recovery rejects terminal rollback before every adapter", async () => {
  const fixture = input();
  const failed = await runQualification(fixture.request);
  const recoverable = {
    ...failed.state,
    lifecycle_state: "FAILED_RECOVERABLE",
    authorization_class: "LOCAL_QUALIFICATION",
    transition_history: [
      ...failed.state.transition_history.slice(0, -1),
      {
        from: "QUALIFYING",
        to: "FAILED_RECOVERABLE",
        authorization_class: "LOCAL_QUALIFICATION",
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
    ],
    recovery: { status: "PENDING", resume_to: "READY" },
    cleanup: { required: true, verified: false },
    outcome: { code: "QUALIFICATION_FAILED", successful: false },
    effect_ledger: failed.state.effect_ledger.map((entry) => ({
      ...entry,
      ...(entry.status === "APPLIED" ? {} : { status: "CLEANED" }),
      ...(entry.cleanup_status === "RETAINED"
        ? { cleanup_status: "PENDING" }
        : {}),
    })),
  };
  let checkpointCalls = 0;
  let authorityCalls = 0;
  let effectCalls = 0;
  const recovered = await recoverQualification({
    loadAuthoritativeState: async () => recoverable,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: ACTIVATION_REVIEW_SHA256,
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        authorityCalls += 1;
        return {
          status: "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
          candidate_identity_sha256: CANDIDATE,
          run_id: recoverable.run_id,
          phase: recoverable.phase,
          operation_class: recoverable.operation_class,
          approval_digest_sha256: recoverable.review_approval_sha256,
          freeze_document_sha256: recoverable.freeze_document_sha256,
          retained_state_sha256: recoverable.retained_state_sha256,
          authority_envelope_sha256: recoverable.authority_envelope_sha256,
          resource_plan_sha256: recoverable.resource_plan_sha256,
          journal_identity_sha256: recoverable.journal_identity_sha256,
          operation_reservation_identity_sha256:
            recoverable.operation_reservation.identity_sha256,
          operation_slot_sha256:
            request.operation_slot.operation_slot_sha256,
          ...(recoverable.checkpoint
            ? {
                checkpoint_identity_sha256:
                  recoverable.checkpoint.checkpoint_identity_sha256,
                checkpoint_sequence: recoverable.checkpoint.sequence,
                checkpoint_predecessor_identity_sha256:
                  recoverable.checkpoint.predecessor_checkpoint_identity_sha256,
              }
            : {}),
        };
      },
    },
    checkpointRecoveryState: async () => {
      checkpointCalls += 1;
    },
    inspectOwnedResource: async () => {
      effectCalls += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => {
      effectCalls += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(recovered.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(recovered.result_type, "RECOVERY_FAILURE_PROJECTION");
  assert.equal(Object.hasOwn(recovered, "checkpoint"), false);
  assert.equal(recovered.outcome.code, "RECOVERY_JOURNAL_IDENTITY_MISMATCH");
  assert.equal(checkpointCalls, 0);
  assert.equal(authorityCalls, 0);
  assert.equal(effectCalls, 0);
  assert.equal(fixture.resources.size, 1);
});

await check("bridge recovery rejects a mismatched review digest before effects", async () => {
  let effects = 0;
  let authorityCalls = 0;
  let headCalls = 0;
  const fixture = input();
  const commit = fixture.request.checkpoint;
  fixture.request.checkpoint = async (state, command) => {
    if (["QUALIFIED", "FAILED_RECOVERABLE", "FAILED_CLOSED"].includes(
      state.lifecycle_state,
    )) {
      throw new Error("synthetic terminal crash");
    }
    return commit(state, command);
  };
  const failed = await runQualification(fixture.request);
  assert.equal(failed.state.lifecycle_state, "FAILED_RECOVERABLE");
  const state = structuredClone(fixture.checkpoints.at(-1));
  const result = await recoverQualification({
    loadAuthoritativeState: async () => state,
    authorization: {
      schema_version: 1,
      authorization_class: "RECOVERY_CONTROLLER",
      candidate_identity_sha256: CANDIDATE,
      review_sha256: "d".repeat(64),
    },
    authority: {
      async verifyReviewedRecoveryAuthorization(request) {
        authorityCalls += 1;
        return {
          status: "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
          candidate_identity_sha256: CANDIDATE,
          run_id: state.run_id,
          phase: state.phase,
          operation_class: state.operation_class,
          approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
          freeze_document_sha256: state.freeze_document_sha256,
          retained_state_sha256: state.retained_state_sha256,
          authority_envelope_sha256: state.authority_envelope_sha256,
          resource_plan_sha256: state.resource_plan_sha256,
          journal_identity_sha256: state.journal_identity_sha256,
          operation_reservation_identity_sha256:
            state.operation_reservation.identity_sha256,
          operation_slot_sha256:
            request.operation_slot.operation_slot_sha256,
          ...(state.checkpoint
            ? {
                checkpoint_identity_sha256:
                  state.checkpoint.checkpoint_identity_sha256,
                checkpoint_sequence: state.checkpoint.sequence,
                checkpoint_predecessor_identity_sha256:
                  state.checkpoint.predecessor_checkpoint_identity_sha256,
              }
            : {}),
        };
      },
    },
    checkpointRecoveryState: async () => {},
    readCheckpointHead: async () => {
      headCalls += 1;
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
    inspectOwnedResource: async () => {
      effects += 1;
      return { status: "ABSENT" };
    },
    reconcileOwnedResource: async () => {
      effects += 1;
      return { status: "DELETED_EXACT" };
    },
  });
  assert.equal(result.lifecycle_state, "FAILED_RECOVERABLE");
  assert.equal(result.result_type, "RECOVERY_FAILURE_PROJECTION");
  assert.equal(Object.hasOwn(result, "checkpoint"), false);
  assert.equal(result.outcome.code, "RECOVERY_AUTHORITY_MISMATCH");
  assert.equal(authorityCalls, 0);
  assert.equal(headCalls, 0);
  assert.equal(effects, 0);
});

if (failures.length > 0) {
  console.log(
    `FAIL_ACTIVATION_E2E assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_ACTIVATION_E2E assertions=${assertions} synthetic_only=true recovery=true evidence=true network=0 live_mutations=0 failures=0 internal_failures=0`,
  );
}
