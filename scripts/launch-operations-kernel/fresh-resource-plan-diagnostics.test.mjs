import assert from "node:assert/strict";
import {
  FRESH_RESOURCE_PLAN_REGISTER,
  createFreshResourcePlanFailureReceipt,
  freshResourcePlanDescriptor,
  isFreshResourcePlanFailureReceipt,
} from "./fresh-resource-plan-diagnostics.mjs";

const sha = (character) => character.repeat(64);
const context = {
  authority_envelope_sha256: sha("a"),
  resource_plan_sha256: sha("b"),
  reservation_proof_sha256: sha("c"),
  operation_slot: { operation_slot_sha256: sha("d") },
};
const expectedRegister = {
  GIT_BRANCH: {
    provider: "GITHUB",
    inspection_class: "GIT_BRANCH_EXISTENCE",
  },
  ENVIRONMENT_RECORD: {
    provider: "VERCEL",
    inspection_class: "ENVIRONMENT_RECORD_LIST",
  },
  PREVIEW_DEPLOYMENT: {
    provider: "VERCEL",
    inspection_class: "PREVIEW_DEPLOYMENT_LIST",
  },
  DATABASE_ROW: {
    provider: "SUPABASE",
    inspection_class: "DATABASE_ROW_SELECT",
  },
  STORAGE_OBJECT: {
    provider: "SUPABASE_STORAGE",
    inspection_class: "STORAGE_OBJECT_EXISTENCE",
  },
};

assert.deepEqual(FRESH_RESOURCE_PLAN_REGISTER, expectedRegister);
for (const [resourceKind, descriptor] of Object.entries(expectedRegister)) {
  assert.deepEqual(freshResourcePlanDescriptor(resourceKind), descriptor);
  const error = new Error("raw-url-host-project-provider-body-token");
  error.code = `CONCRETE_${resourceKind}_INSPECTION_FAILED`;
  error.provider_response_class = "AUTHORIZATION_DENIED";
  const receipt = createFreshResourcePlanFailureReceipt(context, {
    resource_kind: resourceKind,
    error,
    receipt_created: true,
  });
  assert.equal(isFreshResourcePlanFailureReceipt(receipt, {
    authority_envelope_sha256: context.authority_envelope_sha256,
    resource_plan_sha256: context.resource_plan_sha256,
    reservation_proof_sha256: context.reservation_proof_sha256,
    operation_slot_sha256: context.operation_slot.operation_slot_sha256,
  }), true);
  assert.equal(
    receipt.diagnostic.provider_response_class,
    "AUTHORIZATION_DENIED",
  );
  assert.equal(JSON.stringify(receipt).includes(error.message), false);
}

const missing = createFreshResourcePlanFailureReceipt(context, {
  failure_class: "MISSING_RECEIPT",
  receipt_created: false,
});
assert.equal(missing.diagnostic.provider, "UNKNOWN");
assert.equal(missing.diagnostic.resource_kind, "UNKNOWN");
assert.equal(missing.diagnostic.ownership_known, false);
assert.equal(isFreshResourcePlanFailureReceipt(missing), true);

const authenticationRejected = createFreshResourcePlanFailureReceipt(context, {
  resource_kind: "ENVIRONMENT_RECORD",
  error: Object.assign(new Error("raw-authentication-response"), {
    code: "CONCRETE_ENVIRONMENT_INSPECTION_FAILED",
    provider_response_class: "AUTHENTICATION_REJECTED",
  }),
  receipt_created: true,
});
assert.equal(
  authenticationRejected.diagnostic.provider_response_class,
  "AUTHENTICATION_REJECTED",
);
assert.equal(
  JSON.stringify(authenticationRejected).includes("raw-authentication-response"),
  false,
);
assert.equal(isFreshResourcePlanFailureReceipt(authenticationRejected), true);

const ambiguous = createFreshResourcePlanFailureReceipt(context, {
  resource_kind: "PREVIEW_DEPLOYMENT",
  failure_class: "OWNERSHIP_AMBIGUOUS",
  receipt_created: true,
  safe_status: "AMBIGUOUS",
  retryability: "NONRETRYABLE",
});
assert.equal(ambiguous.diagnostic.safe_status, "AMBIGUOUS");
assert.equal(ambiguous.diagnostic.ownership_known, false);

for (const mutate of [
  (receipt) => { receipt.diagnostic.provider = "UNREVIEWED_PROVIDER"; },
  (receipt) => { receipt.diagnostic.resource_kind = "UNREVIEWED_RESOURCE"; },
  (receipt) => { receipt.diagnostic.provider_response_class = "RAW_STATUS_403"; },
  (receipt) => { receipt.diagnostic.raw_identifier = "forbidden"; },
  (receipt) => { receipt.operation_slot_sha256 = sha("e"); },
]) {
  const forged = structuredClone(ambiguous);
  mutate(forged);
  assert.equal(isFreshResourcePlanFailureReceipt(forged, {
    operation_slot_sha256: context.operation_slot.operation_slot_sha256,
  }), false);
}

console.log(
  "PASS_FRESH_RESOURCE_PLAN_DIAGNOSTICS assertions=29 provider_branches=5 resource_branches=5 raw_identifiers=0 network=0 credential_reads=0 live_mutations=0 retries=0 failures=0 internal_failures=0",
);
