import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";
import { AUTHORIZATION_CLASSES } from "./kernel.mjs";
import {
  ACTIVATION_OPERATION_CLASS,
  ACTIVATION_REVIEW_SHA256,
  createOwnedResource,
} from "./activation-bridge.mjs";
import {
  CONCRETE_RUNTIME_CREDENTIAL_SPEC,
} from "./nonproduction-qualification-authorization.mjs";
import {
  createFreshResourcePlanFailureReceipt,
  freshResourcePlanDescriptor,
} from "./fresh-resource-plan-diagnostics.mjs";

const PHASE = "34JA-34JZ";
const STORAGE_VERSION_BINDING = "BIND_ON_CREATE";

export class ConcreteAdapterError extends Error {
  constructor(code) {
    super(code);
    this.name = "ConcreteAdapterError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index]);
}

function nonempty(value, maximum = 1024) {
  return typeof value === "string" && value.length >= 1 && value.length <= maximum;
}

function safeCredential(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= 16384;
}

export function loadConcreteLiveCredentials({ environment, authorization }) {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) {
    throw new ConcreteAdapterError("CONCRETE_CREDENTIAL_MISSING");
  }
  const values = Object.fromEntries(CONCRETE_RUNTIME_CREDENTIAL_SPEC.map(
    ({ accepted_names, adapter_slot }) => [
      adapter_slot,
      accepted_names.map((name) => environment[name]).find(safeCredential),
    ],
  ));
  if (!Object.values(values).every(safeCredential)) {
    throw new ConcreteAdapterError("CONCRETE_CREDENTIAL_MISSING");
  }
  let target;
  try {
    target = new URL(values.supabase_url);
    const match = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.supabase\.co$/u.exec(
      target.hostname,
    );
    if (
      target.protocol !== "https:" ||
      target.username ||
      target.password ||
      target.port ||
      target.pathname !== "/" ||
      target.search ||
      target.hash ||
      target.origin !== values.supabase_url ||
      !match ||
      sha256Hex(target.origin) !==
        authorization?.execution?.supabase_origin_sha256 ||
      sha256Hex(match[1]) !==
        authorization?.execution?.supabase_project_ref_sha256
    ) {
      throw new Error("URL");
    }
  } catch {
    throw new ConcreteAdapterError("CONCRETE_CREDENTIAL_TARGET_MISMATCH");
  }
  return Object.freeze(values);
}

function resourcePlan(authorization, storageDeleteCapabilitySha256) {
  if (!isSha256(storageDeleteCapabilitySha256)) {
    throw new ConcreteAdapterError("CONCRETE_STORAGE_CAPABILITY");
  }
  const descriptors = [
    {
      resource_type: "GIT_BRANCH",
      locator: {
        repository: authorization.repository.remote_repository,
        branch: authorization.execution.branch_name,
        expected_commit_sha256: sha256Hex(
          authorization.execution.temporary_commit_sha,
        ),
      },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "ENVIRONMENT_RECORD",
      locator: {
        project_id: authorization.execution.preview_project_id,
        key: authorization.execution.environment_keys.join("+"),
        target: authorization.execution.branch_name,
      },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "PREVIEW_DEPLOYMENT",
      locator: {
        deployment_id: authorization.run_id,
        project_id: authorization.execution.preview_project_id,
      },
      cleanup_policy: "RETAIN_ON_SUCCESS_EXACTLY_ONE_PREVIEW",
    },
    {
      resource_type: "DATABASE_ROW",
      locator: {
        relation: "submitted_tools",
        id: authorization.execution.fixture_website,
      },
      cleanup_policy: "DELETE_EXACT",
    },
    {
      resource_type: "STORAGE_OBJECT",
      locator: {
        bucket: authorization.execution.storage_bucket,
        name: authorization.execution.storage_name,
      },
      cleanup_policy: "DELETE_EXACT",
      storage_cas: {
        expected_version: STORAGE_VERSION_BINDING,
        delete_capability_sha256: storageDeleteCapabilitySha256,
      },
    },
  ];
  return descriptors.map((descriptor) => structuredClone(descriptor));
}

function exactEnvironmentRecords(records, authorization, allowPartial) {
  const expectedKeys = authorization.execution.environment_keys;
  if (
    !Array.isArray(records) ||
    records.length < 1 ||
    records.length > expectedKeys.length ||
    (!allowPartial && records.length !== expectedKeys.length)
  ) return false;
  const seenKeys = new Set();
  const seenIds = new Set();
  let priorIndex = -1;
  for (const record of records) {
    const index = expectedKeys.indexOf(record?.key);
    if (
      !exactKeys(record, ["id", "key"]) ||
      index < 0 ||
      index <= priorIndex ||
      !nonempty(record.id, 256) ||
      seenKeys.has(record.key) ||
      seenIds.has(record.id)
    ) return false;
    priorIndex = index;
    seenKeys.add(record.key);
    seenIds.add(record.id);
  }
  return true;
}

function validateBinding(resource, binding, authorization) {
  const type = resource.resource_type;
  if (
    type === "GIT_BRANCH" &&
    exactKeys(binding, ["resource_type", "commit_sha", "remote_ref"]) &&
    binding.resource_type === type &&
    binding.commit_sha === authorization.execution.temporary_commit_sha &&
    binding.remote_ref === `refs/heads/${authorization.execution.branch_name}`
  ) return binding;
  if (
    type === "PREVIEW_DEPLOYMENT" &&
    exactKeys(binding, ["resource_type", "deployment_id", "deployment_url"]) &&
    binding.resource_type === type &&
    nonempty(binding.deployment_id, 256) &&
    nonempty(binding.deployment_url, 512)
  ) return binding;
  if (
    type === "ENVIRONMENT_RECORD" &&
    exactKeys(binding, ["resource_type", "records"]) &&
    binding.resource_type === type &&
    exactEnvironmentRecords(binding.records, authorization, false)
  ) return binding;
  if (
    type === "DATABASE_ROW" &&
    exactKeys(binding, ["resource_type", "row_ids"]) &&
    binding.resource_type === type &&
    Array.isArray(binding.row_ids) &&
    binding.row_ids.length === 1 &&
    new Set(binding.row_ids).size === binding.row_ids.length &&
    binding.row_ids.every((entry) => nonempty(entry, 256))
  ) return binding;
  if (
    type === "STORAGE_OBJECT" &&
    exactKeys(binding, [
      "resource_type",
      "object_id",
      "expected_version",
      "expected_etag",
      "expected_size",
      "content_sha256",
      "created_at",
    ]) &&
    binding.resource_type === type &&
    nonempty(binding.object_id, 1024) &&
    nonempty(binding.expected_version, 1024) &&
    binding.expected_version !== STORAGE_VERSION_BINDING &&
    nonempty(binding.expected_etag, 1024) &&
    Number.isSafeInteger(binding.expected_size) &&
    binding.expected_size >= 96 &&
    binding.expected_size <= 512 &&
    isSha256(binding.content_sha256) &&
    nonempty(binding.created_at, 64) &&
    Number.isFinite(Date.parse(binding.created_at))
  ) return binding;
  throw new ConcreteAdapterError("CONCRETE_EXTERNAL_BINDING_INVALID");
}

function validateDurableBinding(resource, binding, authorization) {
  if (
    resource.resource_type === "ENVIRONMENT_RECORD" &&
    exactKeys(binding, ["records", "resource_type"]) &&
    binding.resource_type === "ENVIRONMENT_RECORD" &&
    exactEnvironmentRecords(binding.records, authorization, true)
  ) {
    return binding;
  }
  return validateBinding(resource, binding, authorization);
}

function operationSlotSha256(context) {
  const value = context?.operation_slot?.operation_slot_sha256;
  if (!isSha256(value)) {
    throw new ConcreteAdapterError("CONCRETE_OPERATION_SLOT_INVALID");
  }
  return value;
}

async function oneUse(checkpointStore, context, operation) {
  const slotSha256 = operationSlotSha256(context);
  if (typeof checkpointStore.withExclusiveWriter !== "function") {
    throw new ConcreteAdapterError("CONCRETE_CHECKPOINT_WRITER_ADAPTER_MISSING");
  }
  return checkpointStore.withExclusiveWriter(async () => {
    const existing = await checkpointStore.readAdapterReceipt(slotSha256);
    if (existing !== null) return existing;
    const produced = await operation();
    await checkpointStore.recordAdapterReceipt(
      slotSha256,
      produced.receipt,
      produced.binding ?? null,
    );
    return produced.receipt;
  });
}

function createReceipt(resource, context, binding) {
  return {
    status: "CREATED_NEW",
    resource_key: resource.resource_key,
    locator_sha256: resource.owner.locator_sha256,
    authority_envelope_sha256: context.authority_envelope_sha256,
    reservation_proof_sha256: context.reservation_proof_sha256,
    operation_slot_sha256: operationSlotSha256(context),
    external_binding: structuredClone(binding),
  };
}

function cleanupReceipt(resource, context, result, binding) {
  const base = {
    status: result.status,
    resource_key: resource.resource_key,
    locator_sha256: resource.owner.locator_sha256,
    operation_slot_sha256: operationSlotSha256(context),
    reservation_proof_sha256: context.reservation_proof_sha256,
  };
  if (resource.resource_type !== "STORAGE_OBJECT") return base;
  return {
    ...base,
    expected_version: binding.expected_version,
    ...(result.status === "VERSION_MISMATCH"
      ? { observed_version: result.observed_version }
      : {}),
  };
}

function platformCreateMethod(platform, type) {
  if (type === "GIT_BRANCH") return platform.createBranch;
  if (type === "PREVIEW_DEPLOYMENT") return platform.createPreview;
  if (type === "ENVIRONMENT_RECORD") return platform.createEnvironment;
  if (type === "DATABASE_ROW") return platform.createDatabaseFixture;
  return platform.createStorageFixture;
}

function platformCleanupMethod(platform, type) {
  if (type === "GIT_BRANCH") return platform.cleanupBranch;
  if (type === "PREVIEW_DEPLOYMENT") return platform.cleanupPreview;
  if (type === "ENVIRONMENT_RECORD") return platform.cleanupEnvironment;
  if (type === "DATABASE_ROW") return platform.cleanupDatabaseFixture;
  return platform.cleanupStorageExactVersion;
}

export function createConcreteQualificationBundle({
  authorization,
  authorization_closure,
  credentials,
  freeze_closure,
  platform,
  checkpoint_store,
  storage_delete_capability_sha256,
}) {
  if (
    authorization_closure?.verified !== true ||
    authorization_closure.candidate_identity_sha256 !==
      authorization?.candidate_identity_sha256 ||
    authorization_closure.manifest_sha256 !== authorization?.manifest_sha256 ||
    authorization_closure.retained_legacy_identity_sha256 !==
      authorization?.retained_legacy_identity_sha256 ||
    authorization_closure.operation_class !== ACTIVATION_OPERATION_CLASS ||
    authorization_closure.attempts_authorized !== 1 ||
    authorization_closure.request_budget !== 16 ||
    authorization_closure.mutation_budget !== 15 ||
    !credentials ||
    !platform ||
    !checkpoint_store
  ) {
    throw new ConcreteAdapterError("CONCRETE_ADAPTER_AUTHORITY_INVALID");
  }
  const descriptors = resourcePlan(
    authorization,
    storage_delete_capability_sha256,
  );
  const resources = descriptors.map((descriptor) =>
    createOwnedResource({
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      run_id: authorization.run_id,
      phase: PHASE,
      operation_class: ACTIVATION_OPERATION_CLASS,
      descriptor,
    }),
  );

  async function createResource(resource, context) {
    return oneUse(checkpoint_store, context, async () => {
      const method = platformCreateMethod(platform, resource.resource_type);
      if (typeof method !== "function") {
        throw new ConcreteAdapterError("CONCRETE_PLATFORM_ADAPTER_MISSING");
      }
      const binding = validateBinding(
        resource,
        await method.call(platform, structuredClone(resource), {
          authorization: structuredClone(authorization),
          credentials,
          context: structuredClone(context),
          async onBindingProgress(candidateBinding) {
            const durable = validateDurableBinding(
              resource,
              structuredClone(candidateBinding),
              authorization,
            );
            if (typeof checkpoint_store.recordExternalBinding !== "function") {
              throw new ConcreteAdapterError(
                "CONCRETE_CHECKPOINT_BINDING_ADAPTER_MISSING",
              );
            }
            await checkpoint_store.recordExternalBinding(
              resource.resource_key,
              structuredClone(durable),
            );
          },
        }),
        authorization,
      );
      return {
        binding,
        receipt: createReceipt(resource, context, binding),
      };
    });
  }

  async function cleanupResource(resource, context, suppliedCas = null) {
    return oneUse(checkpoint_store, context, async () => {
      const binding = await checkpoint_store.loadExternalBinding(
        resource.resource_key,
      );
      if (binding === null) {
        throw new ConcreteAdapterError("CONCRETE_EXTERNAL_BINDING_MISSING");
      }
      validateDurableBinding(resource, binding, authorization);
      const method = platformCleanupMethod(platform, resource.resource_type);
      if (typeof method !== "function") {
        throw new ConcreteAdapterError("CONCRETE_PLATFORM_ADAPTER_MISSING");
      }
      const cas = resource.resource_type === "STORAGE_OBJECT"
        ? {
            expected_version: binding.expected_version,
            delete_capability_sha256:
              suppliedCas?.delete_capability_sha256,
          }
        : null;
      const result = await method.call(
        platform,
        structuredClone(resource),
        structuredClone(binding),
        structuredClone(cas),
        {
          authorization: structuredClone(authorization),
          credentials,
          context: structuredClone(context),
        },
      );
      if (
        !result ||
        !["DELETED_EXACT", "VERSION_MISMATCH"].includes(result.status) ||
        (result.status === "VERSION_MISMATCH" &&
          (!nonempty(result.observed_version, 1024) ||
            result.observed_version === binding.expected_version))
      ) {
        throw new ConcreteAdapterError("CONCRETE_CLEANUP_RESULT_INVALID");
      }
      return {
        receipt: cleanupReceipt(resource, context, result, binding),
      };
    });
  }

  async function loadOrResolveBinding(resource) {
    const durable = await checkpoint_store.loadExternalBinding(resource.resource_key);
    if (durable !== null) {
      const validated = validateDurableBinding(resource, durable, authorization);
      if (
        resource.resource_type === "ENVIRONMENT_RECORD" &&
        validated.records.length < authorization.execution.environment_keys.length &&
        typeof platform.resolveBinding === "function"
      ) {
        const resolved = await platform.resolveBinding(structuredClone(resource));
        if (resolved !== null) {
          const complete = validateDurableBinding(
            resource,
            resolved,
            authorization,
          );
          const mergedByKey = new Map(
            validated.records.map((record) => [record.key, record.id]),
          );
          for (const record of complete.records) {
            const existing = mergedByKey.get(record.key);
            if (existing !== undefined && existing !== record.id) {
              throw new ConcreteAdapterError(
                "CONCRETE_EXTERNAL_BINDING_CONFLICT",
              );
            }
            mergedByKey.set(record.key, record.id);
          }
          const merged = validateDurableBinding(resource, {
            resource_type: "ENVIRONMENT_RECORD",
            records: authorization.execution.environment_keys
              .filter((key) => mergedByKey.has(key))
              .map((key) => ({ key, id: mergedByKey.get(key) })),
          }, authorization);
          if (merged.records.length > validated.records.length) {
            await checkpoint_store.recordExternalBinding(
              resource.resource_key,
              structuredClone(merged),
            );
          }
          return merged;
        }
      }
      return validated;
    }
    if (typeof platform.resolveBinding !== "function") return null;
    const resolved = await platform.resolveBinding(structuredClone(resource));
    return resolved === null
      ? null
      : validateDurableBinding(resource, resolved, authorization);
  }

  async function oneUseRecovery(context, operation) {
    const slotSha256 = operationSlotSha256(context);
    if (typeof checkpoint_store.withExclusiveWriter !== "function") {
      throw new ConcreteAdapterError("CONCRETE_CHECKPOINT_WRITER_ADAPTER_MISSING");
    }
    return checkpoint_store.withExclusiveWriter(async () => {
      const existing = await checkpoint_store.readAdapterReceipt(slotSha256);
      if (existing !== null) return existing;
      const produced = await operation();
      await checkpoint_store.recordAdapterReceipt(
        slotSha256,
        produced.receipt,
        produced.binding ?? null,
      );
      return produced.receipt;
    });
  }

  const typed = (type) => ({
    create(resource, context) {
      if (resource?.resource_type !== type) {
        throw new ConcreteAdapterError("CONCRETE_RESOURCE_TYPE_MISMATCH");
      }
      return createResource(resource, context);
    },
    cleanup(resource, context) {
      if (resource?.resource_type !== type) {
        throw new ConcreteAdapterError("CONCRETE_RESOURCE_TYPE_MISMATCH");
      }
      return cleanupResource(resource, context);
    },
  });

  const adapters = {
    authority: {
      verifyAuthorityEnvelope(request) {
        return oneUse(checkpoint_store, request, async () => {
          const envelope = request.authority_envelope;
          if (
            envelope.candidate_identity_sha256 !==
              authorization.candidate_identity_sha256 ||
            envelope.run_id !== authorization.run_id ||
            envelope.operation_class !== authorization.operation_class ||
            !isSha256(envelope.resource_plan_sha256)
          ) {
            throw new ConcreteAdapterError("CONCRETE_AUTHORITY_ENVELOPE_MISMATCH");
          }
          return {
            receipt: {
              status: "VERIFIED_AUTHORITY_ENVELOPE",
              candidate_identity_sha256: envelope.candidate_identity_sha256,
              run_id: envelope.run_id,
              phase: envelope.phase,
              operation_class: envelope.operation_class,
              approval_digest_sha256: ACTIVATION_REVIEW_SHA256,
              freeze_document_sha256: envelope.freeze_document_sha256,
              current_retained_state_attestation_sha256:
                envelope.current_retained_state_attestation_sha256,
              resource_plan_sha256: envelope.resource_plan_sha256,
              authority_envelope_sha256: request.authority_envelope_sha256,
              reservation_proof_sha256: request.reservation_proof_sha256,
              operation_slot_sha256: operationSlotSha256(request),
            },
          };
        });
      },
    },
    namespace: {
      verifyFresh(request) {
        return oneUse(checkpoint_store, request, async () => {
          const proofs = [];
          let fresh = true;
          if (!Array.isArray(request.resource_plan)) {
            return {
              receipt: createFreshResourcePlanFailureReceipt(request, {
                failure_class: "MISSING_OR_INVALID_RESOURCE",
                receipt_created: true,
                retryability: "NONRETRYABLE",
              }),
            };
          }
          for (const resource of request.resource_plan) {
            if (freshResourcePlanDescriptor(resource?.resource_type) === null) {
              return {
                receipt: createFreshResourcePlanFailureReceipt(request, {
                  failure_class: "MISSING_OR_INVALID_RESOURCE",
                  receipt_created: true,
                  retryability: "NONRETRYABLE",
                }),
              };
            }
            let observation;
            try {
              observation = await platform.inspectFresh(
                structuredClone(resource),
                {
                  authorization: structuredClone(authorization),
                  credentials,
                },
              );
            } catch (error) {
              return {
                receipt: createFreshResourcePlanFailureReceipt(request, {
                  resource_kind: resource.resource_type,
                  error,
                  receipt_created: true,
                }),
              };
            }
            const status = observation?.status;
            if (!['ABSENT', 'PRESENT', 'AMBIGUOUS'].includes(status)) {
              return {
                receipt: createFreshResourcePlanFailureReceipt(request, {
                  resource_kind: resource.resource_type,
                  failure_class: "MALFORMED_PROVIDER_RESPONSE",
                  receipt_created: true,
                  retryability: "NONRETRYABLE",
                }),
              };
            }
            if (status === "AMBIGUOUS") {
              return {
                receipt: createFreshResourcePlanFailureReceipt(request, {
                  resource_kind: resource.resource_type,
                  failure_class: "OWNERSHIP_AMBIGUOUS",
                  receipt_created: true,
                  safe_status: "AMBIGUOUS",
                  retryability: "NONRETRYABLE",
                }),
              };
            }
            fresh &&= status === "ABSENT";
            proofs.push({
              resource_key: resource.resource_key,
              locator_sha256: resource.owner.locator_sha256,
              status,
            });
          }
          return {
            receipt: {
              status: fresh ? "FRESH" : "NOT_FRESH",
              authority_envelope_sha256: request.authority_envelope_sha256,
              resource_plan_sha256: request.resource_plan_sha256,
              reservation_proof_sha256: request.reservation_proof_sha256,
              operation_slot_sha256: operationSlotSha256(request),
              proofs,
            },
          };
        });
      },
    },
    branch: typed("GIT_BRANCH"),
    preview: typed("PREVIEW_DEPLOYMENT"),
    environment: typed("ENVIRONMENT_RECORD"),
    fixture: {
      create(resource, context) {
        if (!['DATABASE_ROW', 'STORAGE_OBJECT'].includes(resource?.resource_type)) {
          throw new ConcreteAdapterError("CONCRETE_RESOURCE_TYPE_MISMATCH");
        }
        return createResource(resource, context);
      },
      cleanup(resource, context) {
        if (resource?.resource_type !== "DATABASE_ROW") {
          throw new ConcreteAdapterError("CONCRETE_RESOURCE_TYPE_MISMATCH");
        }
        return cleanupResource(resource, context);
      },
    },
    storage: {
      cleanupExactVersion(resource, suppliedCas, context) {
        if (resource?.resource_type !== "STORAGE_OBJECT") {
          throw new ConcreteAdapterError("CONCRETE_RESOURCE_TYPE_MISMATCH");
        }
        return cleanupResource(resource, context, suppliedCas);
      },
    },
    staging: {
      verifyReadOnly(request) {
        return oneUse(checkpoint_store, request, async () => {
          const result = await platform.verifyStaging({
            authorization: structuredClone(authorization),
            credentials,
            resource_plan: structuredClone(resources),
            staging_checks: structuredClone(authorization.execution.staging_checks),
          });
          return {
            receipt: {
              status: result?.verified === true
                ? "VERIFIED_READ_ONLY"
                : "VERIFICATION_FAILED",
              writes: 0,
              reservation_proof_sha256: request.reservation_proof_sha256,
              operation_slot_sha256: operationSlotSha256(request),
            },
          };
        });
      },
    },
    finalCleanup: {
      verify(request) {
        return oneUse(checkpoint_store, request, async () => {
          const result = await platform.verifyFinal({
            authorization: structuredClone(authorization),
            credentials,
            owned_resources: structuredClone(request.owned_resources),
            retained_resource_keys: structuredClone(request.retained_resource_keys),
          });
          const retained = new Set(request.retained_resource_keys);
          const expectedPresent = request.owned_resources
            .filter((resource) => retained.has(resource.resource_key))
            .map((resource) => ({
              resource_key: resource.resource_key,
              locator_sha256: resource.owner.locator_sha256,
            }));
          const expectedAbsent = request.owned_resources
            .filter((resource) => !retained.has(resource.resource_key))
            .map((resource) => resource.resource_key);
          const exact =
            result?.retained_preview_count === expectedPresent.length &&
            exactKeys(result, ["retained_preview_count", "present"]) &&
            canonicalJson(result.present) ===
              canonicalJson(expectedPresent.map((entry) => entry.resource_key));
          return {
            receipt: {
              status: exact ? "VERIFIED" : "VERIFICATION_FAILED",
              retained_preview_count: exact ? expectedPresent.length : 0,
              verified_present_resources: exact ? expectedPresent : [],
              verified_absent_resource_keys: exact ? expectedAbsent : [],
              operation_slot_sha256: operationSlotSha256(request),
              reservation_proof_sha256: request.reservation_proof_sha256,
            },
          };
        });
      },
    },
  };

  return {
    owned_resources: structuredClone(resources),
    create_recovery_input() {
      return {
        loadAuthoritativeState: checkpoint_store.loadState.bind(checkpoint_store),
        authorization: {
          schema_version: 1,
          authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
          candidate_identity_sha256: authorization.candidate_identity_sha256,
          review_sha256: ACTIVATION_REVIEW_SHA256,
        },
        authority: {
          verifyReviewedRecoveryAuthorization(request) {
            return oneUseRecovery(request, async () => {
              const reviewedState = await checkpoint_store.loadState();
              return {
                receipt: {
                  status: "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
                  candidate_identity_sha256:
                    reviewedState.candidate_identity_sha256,
                  run_id: reviewedState.run_id,
                  phase: reviewedState.phase,
                  operation_class: reviewedState.operation_class,
                  approval_digest_sha256:
                    reviewedState.review_approval_sha256,
                  freeze_document_sha256:
                    reviewedState.freeze_document_sha256,
                  retained_state_sha256: reviewedState.retained_state_sha256,
                  authority_envelope_sha256:
                    reviewedState.authority_envelope_sha256,
                  resource_plan_sha256: reviewedState.resource_plan_sha256,
                  journal_identity_sha256: reviewedState.journal_identity_sha256,
                  operation_reservation_identity_sha256:
                    reviewedState.operation_reservation.identity_sha256,
                  recovery_anchor_checkpoint_identity_sha256:
                    request.recovery_anchor.checkpoint_identity_sha256,
                  recovery_anchor_checkpoint_sequence:
                    request.recovery_anchor.checkpoint_sequence,
                  recovery_anchor_predecessor_identity_sha256:
                    request.recovery_anchor.predecessor_checkpoint_identity_sha256,
                  operation_binding_sha256: request.operation_binding_sha256,
                  operation_slot_sha256: operationSlotSha256(request),
                },
              };
            });
          },
        },
        checkpointRecoveryState:
          checkpoint_store.checkpoint.bind(checkpoint_store),
        readCheckpointHead: checkpoint_store.readHead.bind(checkpoint_store),
        inspectOwnedResource(resource, context) {
          return oneUseRecovery(context, async () => {
            if (typeof platform.inspectOwned !== "function") {
              throw new ConcreteAdapterError("CONCRETE_RECOVERY_ADAPTER_MISSING");
            }
            const binding = await loadOrResolveBinding(resource);
            const observation = await platform.inspectOwned(
              structuredClone(resource),
              binding === null ? null : structuredClone(binding),
            );
            if (
              !observation ||
              !["ABSENT", "PRESENT", "AMBIGUOUS"].includes(observation.status)
            ) {
              throw new ConcreteAdapterError("CONCRETE_RECOVERY_INSPECTION_INVALID");
            }
            if (binding !== null) {
              if (typeof checkpoint_store.recordExternalBinding !== "function") {
                throw new ConcreteAdapterError(
                  "CONCRETE_CHECKPOINT_BINDING_ADAPTER_MISSING",
                );
              }
              await checkpoint_store.recordExternalBinding(
                resource.resource_key,
                structuredClone(binding),
              );
            }
            const state = await checkpoint_store.loadState();
            const entry = state.effect_ledger.find(
              (candidate) => candidate.resource_key === resource.resource_key,
            );
            const receipt = {
              status: observation.status,
              operation_slot_sha256: operationSlotSha256(context),
              operation_binding_sha256: context.operation_binding_sha256,
              ...(observation.status === "PRESENT" && entry
                ? {
                    creation_operation_slot_sha256:
                      entry.creation_operation_slot_sha256,
                  }
                : {}),
              ...(resource.resource_type === "STORAGE_OBJECT"
                ? {
                    observed_version:
                      observation.status === "PRESENT"
                        ? observation.observed_version
                        : null,
                  }
                : {}),
            };
            return { receipt };
          });
        },
        reconcileOwnedResource(resource, cas, context) {
          return oneUseRecovery(context, async () => {
            const binding = await loadOrResolveBinding(resource);
            if (binding === null) {
              throw new ConcreteAdapterError("CONCRETE_EXTERNAL_BINDING_MISSING");
            }
            const method = platformCleanupMethod(platform, resource.resource_type);
            if (typeof method !== "function") {
              throw new ConcreteAdapterError("CONCRETE_RECOVERY_ADAPTER_MISSING");
            }
            const result = await method.call(
              platform,
              structuredClone(resource),
              structuredClone(binding),
              resource.resource_type === "STORAGE_OBJECT"
                ? structuredClone(cas)
                : null,
              { authorization: structuredClone(authorization), credentials },
            );
            if (
              !result ||
              !["DELETED_EXACT", "VERSION_MISMATCH"].includes(result.status)
            ) {
              throw new ConcreteAdapterError("CONCRETE_CLEANUP_RESULT_INVALID");
            }
            return {
              binding,
              receipt: {
                status: result.status,
                resource_key: resource.resource_key,
                locator_sha256: resource.owner.locator_sha256,
                operation_slot_sha256: operationSlotSha256(context),
                operation_binding_sha256: context.operation_binding_sha256,
                ...(resource.resource_type === "STORAGE_OBJECT"
                  ? {
                      expected_version: binding.expected_version,
                      ...(result.status === "VERSION_MISMATCH"
                        ? { observed_version: result.observed_version }
                        : {}),
                    }
                  : {}),
              },
            };
          });
        },
      };
    },
    qualification_input: {
      candidate_identity_sha256: authorization.candidate_identity_sha256,
      run_id: authorization.run_id,
      phase: PHASE,
      operation_class: ACTIVATION_OPERATION_CLASS,
      authorization: {
        schema_version: 1,
        authorization_class: AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION,
        candidate_identity_sha256: authorization.candidate_identity_sha256,
        review_sha256: ACTIVATION_REVIEW_SHA256,
      },
      budgets: {
        requests: { limit: 16, used: 0 },
        mutations: { limit: 15, used: 0 },
      },
      retain_preview_on_success: true,
      resource_plan: descriptors,
      freeze_closure: structuredClone(freeze_closure),
      adapters,
      checkpoint: checkpoint_store.checkpoint.bind(checkpoint_store),
      readCheckpointHead: checkpoint_store.readHead.bind(checkpoint_store),
    },
  };
}

export const CONCRETE_STORAGE_VERSION_BINDING = STORAGE_VERSION_BINDING;
