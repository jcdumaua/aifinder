import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertLegacyFreezePolicy,
  classifyLegacySnapshot,
  loadCurrentLegacySnapshot,
} from "./legacy-classifier.mjs";
import { readStrictJsonFile } from "./manifest.mjs";
import { sha256Hex } from "./canonical.mjs";

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

function withSyntheticLegacyFixture(operation) {
  const temporaryRoot = realpathSync(
    mkdtempSync(
      path.join(os.tmpdir(), "aifinder-lok-legacy-classifier-test-"),
    ),
  );
  chmodSync(temporaryRoot, 0o700);
  const recoveryRootBasename = "aifinder-34ia-delta20-synthetic-fixture";
  const recoveryRoot = path.join(temporaryRoot, recoveryRootBasename);
  mkdirSync(recoveryRoot, { mode: 0o700 });
  const candidate = "1".repeat(64);
  const documents = {
    active_authorization: {
      state: "QUALIFICATION_ATTEMPT_STARTED",
      candidate_manifest_sha256: candidate,
      qualification_temp_root_basename: recoveryRootBasename,
    },
    execution_lock: {
      owner_pid: 4242,
      recovery_root_basename: recoveryRootBasename,
    },
    recovery_journal: {
      candidate_manifest_sha256: candidate,
      state: "EXECUTION_IN_PROGRESS",
      stage: "PRIOR_RECONCILIATION",
      mutation_intents: [{ kind: "PRIOR_RECONCILIATION", sequence: 1 }],
      registration_commit_sha: null,
      activation_commit_sha: null,
      deployment_id: null,
      run_marker: null,
      environment_before: null,
      environment_before_sha256: null,
      prior_reconciliation_evidence_sha256: null,
      cleanup_proof_sha256: null,
      environment_ids: {},
      cleanup_environment_delete_intents: {
        ADMIN_PASSWORD: 0,
        ADMIN_SESSION_SECRET: 0,
      },
      cleanup_branch_delete_intents: 0,
      cleanup_preview_delete_intents: 0,
    },
  };
  const encoded = {
    active_authorization: Buffer.from(
      `${JSON.stringify(documents.active_authorization)}\n`,
    ),
    execution_lock: Buffer.from(
      `${JSON.stringify(documents.execution_lock)}\n`,
    ),
    recovery_journal: Buffer.from(
      `${JSON.stringify(documents.recovery_journal)}\n`,
    ),
  };
  const paths = {
    active_authorization: path.join(temporaryRoot, "synthetic-active.json"),
    execution_lock: path.join(temporaryRoot, "synthetic-execution.json"),
    recovery_journal: path.join(recoveryRoot, "synthetic-recovery.json"),
  };
  const writeSyntheticArtifact = (filePath, bytes) => {
    writeFileSync(filePath, bytes, { mode: 0o600 });
    chmodSync(filePath, 0o600);
  };
  writeSyntheticArtifact(paths.active_authorization, encoded.active_authorization);
  writeSyntheticArtifact(paths.execution_lock, encoded.execution_lock);
  writeSyntheticArtifact(paths.recovery_journal, encoded.recovery_journal);
  const freeze = {
    schema_version: 1,
    phase: "34JA-34JZ",
    status: "LEGACY_FORENSIC_ONLY_NON_CURRENT",
    legacy_entrypoints: [
      {
        path: "testing/admin-v1-staging-runtime-orchestrator.mjs",
        current: false,
        preserved_for_forensics: true,
      },
    ],
    current_route: {
      legacy_route_current: false,
      kernel_live_routes: 1,
      routed_entrypoint:
        "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    },
    fresh_gemini_review_boundaries: [
      "MATERIAL_ARCHITECTURE_CHANGE",
      "LIVE_CANDIDATE_BYTES",
      "DATABASE_OR_STORAGE_MUTATION",
      "LEGACY_MIGRATION_OR_RECONCILIATION",
      "OFFICIAL_RUNTIME",
      "PRODUCTION_OR_PUBLIC_AUTHORITY",
    ],
    retained_state: {
      recovery_root_basename: recoveryRootBasename,
      artifacts: {
        active_authorization: {
          location: "TEMP_ROOT",
          filename: path.basename(paths.active_authorization),
          sha256: sha256Hex(encoded.active_authorization),
          mode: "0600",
        },
        execution_lock: {
          location: "TEMP_ROOT",
          filename: path.basename(paths.execution_lock),
          sha256: sha256Hex(encoded.execution_lock),
          mode: "0600",
        },
        recovery_journal: {
          location: "RECOVERY_ROOT",
          filename: path.basename(paths.recovery_journal),
          sha256: sha256Hex(encoded.recovery_journal),
          mode: "0600",
        },
      },
      categorical_facts: {
        authorization_state: "QUALIFICATION_ATTEMPT_STARTED",
        candidate_identity_sha256: candidate,
        recovery_state: "EXECUTION_IN_PROGRESS",
        recovery_stage: "PRIOR_RECONCILIATION",
        guard_owner_pid: 4242,
        mutation_intents: [{ kind: "PRIOR_RECONCILIATION", sequence: 1 }],
        data_writes: 0,
      },
    },
  };
  const load = (freezeValue = freeze) =>
    loadCurrentLegacySnapshot({
      freeze: freezeValue,
      temporaryRoot,
      probePid: () => false,
    });
  try {
    operation({ freeze, load, paths, recoveryRoot, temporaryRoot });
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
    assert.equal(existsSync(temporaryRoot), false);
  }
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

check("synthetic complete unresolved state", () => {
  withSyntheticLegacyFixture(({ load }) => {
    const classification = classifyLegacySnapshot(load());
    assert.equal(classification.classification, "FAIL_CLOSED_UNRESOLVED");
    assert.equal(classification.guard.status, "DEAD");
    assert.equal(classification.candidate_binding.exact, true);
    assert.equal(classification.effects.data_writes, 0);
    assert.equal(classification.ownership_ambiguity, true);
    assert.equal(classification.legacy_reconciliation_required, true);
  });
});

check("synthetic missing artifact rejects", () => {
  withSyntheticLegacyFixture(({ load, paths }) => {
    rmSync(paths.active_authorization);
    assert.throws(load, { code: "ENOENT" });
  });
});

check("synthetic wrong mode rejects", () => {
  withSyntheticLegacyFixture(({ load, paths }) => {
    chmodSync(paths.execution_lock, 0o644);
    assert.throws(load, { code: "LEGACY_ARTIFACT_IDENTITY" });
  });
});

check("synthetic wrong identity rejects", () => {
  withSyntheticLegacyFixture(({ load, paths }) => {
    writeFileSync(paths.active_authorization, "synthetic-mutated\n", {
      mode: 0o600,
    });
    assert.throws(load, { code: "LEGACY_ARTIFACT_HASH" });
  });
});

check("synthetic unexpected root ambiguity rejects", () => {
  withSyntheticLegacyFixture(({ load, temporaryRoot }) => {
    mkdirSync(path.join(temporaryRoot, "aifinder-34ia-delta20-synthetic-extra"), {
      mode: 0o700,
    });
    assert.throws(load, { code: "LEGACY_RECOVERY_ROOT_AMBIGUOUS" });
  });
});

check("synthetic categorical mismatch rejects", () => {
  withSyntheticLegacyFixture(({ freeze, load }) => {
    const mismatched = structuredClone(freeze);
    mismatched.retained_state.categorical_facts.recovery_stage = "COMPLETE";
    assert.throws(() => load(mismatched), {
      code: "LEGACY_CATEGORICAL_DRIFT",
    });
  });
});

check("legacy freeze policy", () => {
  const freeze = readStrictJsonFile(FREEZE_PATH);
  const result = assertLegacyFreezePolicy(freeze);
  assert.deepEqual(result, {
    status: "PASS",
    legacy_route_current: false,
    legacy_entrypoints_preserved: 1,
    kernel_live_routes: 1,
    routed_entrypoint:
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
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
