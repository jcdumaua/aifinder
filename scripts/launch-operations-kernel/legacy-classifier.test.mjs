import assert from "node:assert/strict";
import path from "node:path";
import {
  assertLegacyFreezePolicy,
  classifyLegacySnapshot,
  loadCurrentLegacySnapshot,
} from "./legacy-classifier.mjs";
import { readStrictJsonFile } from "./manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FREEZE_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/legacy-freeze.json",
);
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

function syntheticSnapshot(overrides = {}) {
  return {
    authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
    active_candidate_identity_sha256:
      "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71",
    recovery_candidate_identity_sha256:
      "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71",
    recovery_state: "EXECUTION_IN_PROGRESS",
    recovery_stage: "PRIOR_RECONCILIATION",
    guard_owner_pid: 12605,
    guard_alive: false,
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
    artifact_sha256: {
      active_authorization:
        "e1401cfe894d15594e3a76f4ac2dd21a2343d9e35719000bc91bc043ab910836",
      execution_lock:
        "9da7c52b3bf54b0222f27368d47c2badc4ba6bbfbe722cb4d57b6b197efa0f91",
      recovery_journal:
        "487022cb10ec48b2881861a1417d374a7fa189c37c32e01ec5e5453aba07fff8",
    },
    ...overrides,
  };
}

check("legacy classifier fails closed", () => {
  const classification = classifyLegacySnapshot(syntheticSnapshot());
  assert.equal(classification.classification, "FAIL_CLOSED_UNRESOLVED");
  assert.equal(classification.clean, false);
  assert.equal(classification.qualified, false);
  assert.equal(classification.ownership_ambiguity, true);
  assert.equal(classification.legacy_reconciliation_required, true);
  assert.equal(classification.guard.status, "DEAD");
  assert.equal(classification.candidate_binding.exact, true);
});

check("alive guard remains unresolved", () => {
  const classification = classifyLegacySnapshot(
    syntheticSnapshot({ guard_alive: true }),
  );
  assert.equal(classification.classification, "FAIL_CLOSED_UNRESOLVED");
  assert.equal(classification.guard.status, "ALIVE");
  assert.equal(classification.legacy_reconciliation_required, true);
});

check("candidate divergence remains unresolved", () => {
  const classification = classifyLegacySnapshot(
    syntheticSnapshot({ recovery_candidate_identity_sha256: "8".repeat(64) }),
  );
  assert.equal(classification.classification, "FAIL_CLOSED_UNRESOLVED");
  assert.equal(classification.candidate_binding.exact, false);
  assert.equal(classification.ownership_ambiguity, true);
});

check("exact current categorical legacy fixture", () => {
  const freeze = readStrictJsonFile(FREEZE_PATH);
  const snapshot = loadCurrentLegacySnapshot({ freeze });
  const classification = classifyLegacySnapshot(snapshot);
  assert.deepEqual(
    {
      classification: classification.classification,
      authorization_state: classification.authorization_state,
      recovery_state: classification.recovery_state,
      recovery_stage: classification.recovery_stage,
      guard_status: classification.guard.status,
      guard_owner_pid: classification.guard.owner_pid,
      candidate_exact: classification.candidate_binding.exact,
      data_writes: classification.effects.data_writes,
      branch_commit_present: classification.effects.branch_commit_present,
      preview_identity_present: classification.effects.preview_identity_present,
      environment_resource_count:
        classification.effects.environment_resource_count,
      ownership_ambiguity: classification.ownership_ambiguity,
      legacy_reconciliation_required:
        classification.legacy_reconciliation_required,
    },
    {
      classification: "FAIL_CLOSED_UNRESOLVED",
      authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
      recovery_state: "EXECUTION_IN_PROGRESS",
      recovery_stage: "PRIOR_RECONCILIATION",
      guard_status: "DEAD",
      guard_owner_pid: 12605,
      candidate_exact: true,
      data_writes: 0,
      branch_commit_present: false,
      preview_identity_present: false,
      environment_resource_count: 0,
      ownership_ambiguity: true,
      legacy_reconciliation_required: true,
    },
  );
});

check("legacy freeze policy", () => {
  const freeze = readStrictJsonFile(FREEZE_PATH);
  const result = assertLegacyFreezePolicy(freeze);
  assert.deepEqual(result, {
    status: "PASS",
    legacy_route_current: false,
    legacy_entrypoints_preserved: 1,
    kernel_live_routes: 0,
    fresh_review_boundaries: 6,
  });
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_LEGACY_CLASSIFIER assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_LEGACY_CLASSIFIER assertions=${assertions} classification=FAIL_CLOSED_UNRESOLVED writes=0 network=0 mutations=0 failures=0 internal_failures=0`,
  );
}
