import { isSha256 } from "./canonical.mjs";

export const FRESH_RESOURCE_PLAN_REGISTER = Object.freeze({
  GIT_BRANCH: Object.freeze({
    provider: "GITHUB",
    inspection_class: "GIT_BRANCH_EXISTENCE",
  }),
  ENVIRONMENT_RECORD: Object.freeze({
    provider: "VERCEL",
    inspection_class: "ENVIRONMENT_RECORD_LIST",
  }),
  PREVIEW_DEPLOYMENT: Object.freeze({
    provider: "VERCEL",
    inspection_class: "PREVIEW_DEPLOYMENT_LIST",
  }),
  DATABASE_ROW: Object.freeze({
    provider: "SUPABASE",
    inspection_class: "DATABASE_ROW_SELECT",
  }),
  STORAGE_OBJECT: Object.freeze({
    provider: "SUPABASE_STORAGE",
    inspection_class: "STORAGE_OBJECT_EXISTENCE",
  }),
});

const PROVIDERS = new Set([
  "GITHUB",
  "VERCEL",
  "SUPABASE",
  "SUPABASE_STORAGE",
  "UNKNOWN",
]);
const RESOURCE_KINDS = new Set([
  ...Object.keys(FRESH_RESOURCE_PLAN_REGISTER),
  "UNKNOWN",
]);
const INSPECTION_CLASSES = new Set([
  ...Object.values(FRESH_RESOURCE_PLAN_REGISTER).map(
    ({ inspection_class }) => inspection_class,
  ),
  "RESOURCE_PLAN_INSPECTION",
]);
const FAILURE_CLASSES = new Set([
  "PROVIDER_READ_FAILED",
  "MALFORMED_PROVIDER_RESPONSE",
  "MISSING_OR_INVALID_RESOURCE",
  "OWNERSHIP_AMBIGUOUS",
  "MISSING_RECEIPT",
  "MALFORMED_RECEIPT",
]);
const SAFE_STATUSES = new Set(["UNAVAILABLE", "AMBIGUOUS"]);
const RETRYABILITY = new Set(["UNKNOWN", "NONRETRYABLE"]);
const PROVIDER_RESPONSE_CLASSES = new Set([
  "NOT_APPLICABLE",
  "NETWORK_FAILURE",
  "AUTHENTICATION_REJECTED",
  "AUTHORIZATION_DENIED",
  "RESOURCE_NOT_FOUND",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "CLIENT_ERROR",
  "REDIRECTED",
  "UNEXPECTED_STATUS",
  "UNCLASSIFIED_FAILURE",
]);

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index]);
}

export function freshResourcePlanDescriptor(resourceKind) {
  return FRESH_RESOURCE_PLAN_REGISTER[resourceKind] ?? null;
}

function classifiedFailure(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  const providerResponseClass = PROVIDER_RESPONSE_CLASSES.has(
    error?.provider_response_class,
  )
    ? error.provider_response_class
    : "UNCLASSIFIED_FAILURE";
  if (code.includes("AMBIGUOUS") || code.includes("OWNERSHIP")) {
    return {
      failure_class: "OWNERSHIP_AMBIGUOUS",
      safe_status: "AMBIGUOUS",
      retryability: "NONRETRYABLE",
      provider_response_class: providerResponseClass,
    };
  }
  if (
    code.includes("INVALID") ||
    code.includes("MALFORMED") ||
    code.includes("RESPONSE_KIND_DENIED")
  ) {
    return {
      failure_class: "MALFORMED_PROVIDER_RESPONSE",
      safe_status: "UNAVAILABLE",
      retryability: "NONRETRYABLE",
      provider_response_class: providerResponseClass,
    };
  }
  return {
    failure_class: "PROVIDER_READ_FAILED",
    safe_status: "UNAVAILABLE",
    retryability: "UNKNOWN",
    provider_response_class: providerResponseClass,
  };
}

export function createFreshResourcePlanFailureReceipt(context, options = {}) {
  const descriptor = freshResourcePlanDescriptor(options.resource_kind);
  const classified = options.error === undefined
    ? {
        failure_class: options.failure_class,
        safe_status: options.safe_status ?? "UNAVAILABLE",
        retryability: options.retryability ?? "UNKNOWN",
        provider_response_class:
          options.provider_response_class ?? "NOT_APPLICABLE",
      }
    : classifiedFailure(options.error);
  return {
    status: "INSPECTION_FAILED",
    authority_envelope_sha256: context?.authority_envelope_sha256,
    resource_plan_sha256: context?.resource_plan_sha256,
    reservation_proof_sha256: context?.reservation_proof_sha256,
    operation_slot_sha256: context?.operation_slot?.operation_slot_sha256,
    diagnostic: {
      schema_version: 1,
      request_step: "VERIFY_FRESH_RESOURCE_PLAN",
      provider: descriptor?.provider ?? "UNKNOWN",
      resource_kind: descriptor ? options.resource_kind : "UNKNOWN",
      inspection_class:
        descriptor?.inspection_class ?? "RESOURCE_PLAN_INSPECTION",
      failure_class: classified.failure_class,
      receipt_created: options.receipt_created === true,
      safe_status: classified.safe_status,
      retryability: classified.retryability,
      ownership_known: options.ownership_known === true,
      provider_response_class: classified.provider_response_class,
    },
  };
}

export function isFreshResourcePlanFailureReceipt(receipt, context = {}) {
  const diagnostic = receipt?.diagnostic;
  const valid =
    exactKeys(receipt, [
      "status",
      "authority_envelope_sha256",
      "resource_plan_sha256",
      "reservation_proof_sha256",
      "operation_slot_sha256",
      "diagnostic",
    ]) &&
    receipt.status === "INSPECTION_FAILED" &&
    isSha256(receipt.authority_envelope_sha256) &&
    isSha256(receipt.resource_plan_sha256) &&
    isSha256(receipt.reservation_proof_sha256) &&
    isSha256(receipt.operation_slot_sha256) &&
    exactKeys(diagnostic, [
      "schema_version",
      "request_step",
      "provider",
      "resource_kind",
      "inspection_class",
      "failure_class",
      "receipt_created",
      "safe_status",
      "retryability",
      "ownership_known",
      "provider_response_class",
    ]) &&
    diagnostic.schema_version === 1 &&
    diagnostic.request_step === "VERIFY_FRESH_RESOURCE_PLAN" &&
    PROVIDERS.has(diagnostic.provider) &&
    RESOURCE_KINDS.has(diagnostic.resource_kind) &&
    INSPECTION_CLASSES.has(diagnostic.inspection_class) &&
    FAILURE_CLASSES.has(diagnostic.failure_class) &&
    typeof diagnostic.receipt_created === "boolean" &&
    SAFE_STATUSES.has(diagnostic.safe_status) &&
    RETRYABILITY.has(diagnostic.retryability) &&
    typeof diagnostic.ownership_known === "boolean" &&
    PROVIDER_RESPONSE_CLASSES.has(diagnostic.provider_response_class);
  if (!valid) return false;
  const descriptor = freshResourcePlanDescriptor(diagnostic.resource_kind);
  if (
    (descriptor === null) !== (diagnostic.resource_kind === "UNKNOWN") ||
    (descriptor !== null &&
      (descriptor.provider !== diagnostic.provider ||
        descriptor.inspection_class !== diagnostic.inspection_class)) ||
    (descriptor === null &&
      (diagnostic.provider !== "UNKNOWN" ||
        diagnostic.inspection_class !== "RESOURCE_PLAN_INSPECTION"))
  ) return false;
  for (const [key, expected] of [
    ["authority_envelope_sha256", context.authority_envelope_sha256],
    ["resource_plan_sha256", context.resource_plan_sha256],
    ["reservation_proof_sha256", context.reservation_proof_sha256],
    ["operation_slot_sha256", context.operation_slot_sha256],
  ]) {
    if (expected !== undefined && receipt[key] !== expected) return false;
  }
  return true;
}
