import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { canonicalJson, isSha256, sha256Hex } from "./canonical.mjs";

export class LegacyClassifierError extends Error {
  constructor(code) {
    super(code);
    this.name = "LegacyClassifierError";
    this.code = code;
  }
}

function exactArray(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

function readJson(bytes, code) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff")) throw new Error("BOM");
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("ROOT");
    }
    return value;
  } catch {
    throw new LegacyClassifierError(code);
  }
}

function readExactArtifact(filePath, contract) {
  const metadata = lstatSync(filePath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== Number.parseInt(contract.mode, 8) ||
    realpathSync(filePath) !== filePath
  ) {
    throw new LegacyClassifierError("LEGACY_ARTIFACT_IDENTITY");
  }
  const bytes = readFileSync(filePath);
  if (sha256Hex(bytes) !== contract.sha256) {
    throw new LegacyClassifierError("LEGACY_ARTIFACT_HASH");
  }
  return bytes;
}

function defaultProbePid(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    if (error?.code === "ESRCH") return false;
    throw new LegacyClassifierError("LEGACY_GUARD_PROBE");
  }
}

export function assertLegacyFreezePolicy(freeze) {
  const requiredBoundaries = [
    "MATERIAL_ARCHITECTURE_CHANGE",
    "LIVE_CANDIDATE_BYTES",
    "DATABASE_OR_STORAGE_MUTATION",
    "LEGACY_MIGRATION_OR_RECONCILIATION",
    "OFFICIAL_RUNTIME",
    "PRODUCTION_OR_PUBLIC_AUTHORITY",
  ];
  if (
    freeze?.schema_version !== 1 ||
    freeze.phase !== "34JA-34JZ" ||
    freeze.status !== "LEGACY_FORENSIC_ONLY_NON_CURRENT" ||
    !Array.isArray(freeze.legacy_entrypoints) ||
    freeze.legacy_entrypoints.length !== 1 ||
    freeze.legacy_entrypoints[0]?.path !==
      "testing/admin-v1-staging-runtime-orchestrator.mjs" ||
    freeze.legacy_entrypoints[0]?.current !== false ||
    freeze.legacy_entrypoints[0]?.preserved_for_forensics !== true ||
    freeze.current_route?.legacy_route_current !== false ||
    freeze.current_route?.kernel_live_routes !== 1 ||
    freeze.current_route?.routed_entrypoint !==
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs" ||
    !exactArray(freeze.fresh_gemini_review_boundaries, requiredBoundaries)
  ) {
    throw new LegacyClassifierError("LEGACY_FREEZE_POLICY");
  }
  return {
    status: "PASS",
    legacy_route_current: false,
    legacy_entrypoints_preserved: 1,
    kernel_live_routes: 1,
    routed_entrypoint:
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    fresh_review_boundaries: requiredBoundaries.length,
  };
}

export function loadCurrentLegacySnapshot({
  freeze,
  temporaryRoot = realpathSync(os.tmpdir()),
  probePid = defaultProbePid,
} = {}) {
  assertLegacyFreezePolicy(freeze);
  const retained = freeze.retained_state;
  const artifacts = retained?.artifacts;
  if (!retained || !artifacts || typeof artifacts !== "object") {
    throw new LegacyClassifierError("LEGACY_FREEZE_RETAINED_STATE");
  }
  const rootPath = path.join(temporaryRoot, retained.recovery_root_basename);
  const rootMetadata = lstatSync(rootPath);
  if (
    !rootMetadata.isDirectory() ||
    rootMetadata.isSymbolicLink() ||
    (rootMetadata.mode & 0o777) !== 0o700 ||
    realpathSync(rootPath) !== rootPath
  ) {
    throw new LegacyClassifierError("LEGACY_RECOVERY_ROOT_IDENTITY");
  }
  const matchingRoots = readdirSync(temporaryRoot)
    .filter((name) => name.startsWith("aifinder-34ia-delta20-"))
    .sort();
  if (!exactArray(matchingRoots, [retained.recovery_root_basename])) {
    throw new LegacyClassifierError("LEGACY_RECOVERY_ROOT_AMBIGUOUS");
  }
  const rootEntries = readdirSync(rootPath).sort();
  if (!exactArray(rootEntries, [artifacts.recovery_journal.filename])) {
    throw new LegacyClassifierError("LEGACY_RECOVERY_ROOT_CONTENTS");
  }

  const artifactBytes = {};
  for (const [name, contract] of Object.entries(artifacts)) {
    const base = contract.location === "RECOVERY_ROOT" ? rootPath : temporaryRoot;
    artifactBytes[name] = readExactArtifact(
      path.join(base, contract.filename),
      contract,
    );
  }
  const active = readJson(artifactBytes.active_authorization, "LEGACY_ACTIVE_JSON");
  const execution = readJson(artifactBytes.execution_lock, "LEGACY_EXECUTION_JSON");
  const recovery = readJson(artifactBytes.recovery_journal, "LEGACY_RECOVERY_JSON");
  const terminalFields = [
    recovery.registration_commit_sha,
    recovery.activation_commit_sha,
    recovery.deployment_id,
    recovery.run_marker,
    recovery.environment_before,
    recovery.environment_before_sha256,
    recovery.prior_reconciliation_evidence_sha256,
    recovery.cleanup_proof_sha256,
  ];
  const snapshot = {
    authorization_state: active.state,
    active_candidate_identity_sha256: active.candidate_manifest_sha256,
    recovery_candidate_identity_sha256: recovery.candidate_manifest_sha256,
    recovery_state: recovery.state,
    recovery_stage: recovery.stage,
    guard_owner_pid: execution.owner_pid,
    guard_alive: Boolean(probePid(execution.owner_pid)),
    recovery_root_binding_exact:
      active.qualification_temp_root_basename ===
        retained.recovery_root_basename &&
      execution.recovery_root_basename === retained.recovery_root_basename,
    mutation_intents: recovery.mutation_intents.map((entry) => ({
      kind: entry.kind,
      sequence: entry.sequence,
    })),
    data_writes: retained.categorical_facts.data_writes,
    branch_commit_present: Boolean(
      recovery.registration_commit_sha || recovery.activation_commit_sha,
    ),
    preview_identity_present: Boolean(recovery.deployment_id),
    environment_resource_count: Object.keys(recovery.environment_ids).length,
    environment_cleanup_intents: structuredClone(
      recovery.cleanup_environment_delete_intents,
    ),
    branch_cleanup_intents: recovery.cleanup_branch_delete_intents,
    preview_cleanup_intents: recovery.cleanup_preview_delete_intents,
    terminal_evidence_present: terminalFields.some((value) => value !== null),
    artifact_sha256: {
      active_authorization: artifacts.active_authorization.sha256,
      execution_lock: artifacts.execution_lock.sha256,
      recovery_journal: artifacts.recovery_journal.sha256,
    },
  };
  const expected = retained.categorical_facts;
  if (
    snapshot.authorization_state !== expected.authorization_state ||
    snapshot.active_candidate_identity_sha256 !== expected.candidate_identity_sha256 ||
    snapshot.recovery_candidate_identity_sha256 !== expected.candidate_identity_sha256 ||
    snapshot.recovery_state !== expected.recovery_state ||
    snapshot.recovery_stage !== expected.recovery_stage ||
    snapshot.guard_owner_pid !== expected.guard_owner_pid ||
    !snapshot.recovery_root_binding_exact ||
    !exactArray(
      snapshot.mutation_intents.map((entry) => `${entry.kind}:${entry.sequence}`),
      expected.mutation_intents.map((entry) => `${entry.kind}:${entry.sequence}`),
    ) ||
    snapshot.data_writes !== 0 ||
    snapshot.branch_commit_present ||
    snapshot.preview_identity_present ||
    snapshot.environment_resource_count !== 0 ||
    Object.values(snapshot.environment_cleanup_intents).some((value) => value !== 0) ||
    snapshot.branch_cleanup_intents !== 0 ||
    snapshot.preview_cleanup_intents !== 0 ||
    snapshot.terminal_evidence_present
  ) {
    throw new LegacyClassifierError("LEGACY_CATEGORICAL_DRIFT");
  }
  return snapshot;
}

export function classifyLegacySnapshot(snapshot) {
  if (
    !snapshot ||
    !isSha256(snapshot.active_candidate_identity_sha256) ||
    !isSha256(snapshot.recovery_candidate_identity_sha256) ||
    !Number.isSafeInteger(snapshot.guard_owner_pid) ||
    !Array.isArray(snapshot.mutation_intents) ||
    !snapshot.artifact_sha256 ||
    !Object.values(snapshot.artifact_sha256).every(isSha256)
  ) {
    throw new LegacyClassifierError("LEGACY_SNAPSHOT_SHAPE");
  }
  const exactCandidate =
    snapshot.active_candidate_identity_sha256 ===
    snapshot.recovery_candidate_identity_sha256;
  const unresolvedPriorReconciliation =
    snapshot.authorization_state === "QUALIFICATION_ATTEMPT_STARTED" &&
    snapshot.recovery_state === "EXECUTION_IN_PROGRESS" &&
    snapshot.recovery_stage === "PRIOR_RECONCILIATION";
  return {
    schema_version: 1,
    classification: "FAIL_CLOSED_UNRESOLVED",
    authorization_state: snapshot.authorization_state,
    recovery_state: snapshot.recovery_state,
    recovery_stage: snapshot.recovery_stage,
    guard: {
      owner_pid: snapshot.guard_owner_pid,
      status: snapshot.guard_alive ? "ALIVE" : "DEAD",
      recovery_root_binding_exact: snapshot.recovery_root_binding_exact,
    },
    candidate_binding: {
      active_candidate_identity_sha256:
        snapshot.active_candidate_identity_sha256,
      recovery_candidate_identity_sha256:
        snapshot.recovery_candidate_identity_sha256,
      exact: exactCandidate,
    },
    effects: {
      mutation_intents: structuredClone(snapshot.mutation_intents),
      data_writes: snapshot.data_writes,
      branch_commit_present: snapshot.branch_commit_present,
      preview_identity_present: snapshot.preview_identity_present,
      environment_resource_count: snapshot.environment_resource_count,
      environment_cleanup_intents: structuredClone(
        snapshot.environment_cleanup_intents,
      ),
      branch_cleanup_intents: snapshot.branch_cleanup_intents,
      preview_cleanup_intents: snapshot.preview_cleanup_intents,
      terminal_evidence_present: snapshot.terminal_evidence_present,
    },
    ownership_ambiguity: !exactCandidate || unresolvedPriorReconciliation,
    legacy_reconciliation_required: true,
    clean: false,
    qualified: false,
    retained_identity_digest_sha256: sha256Hex(
      canonicalJson(snapshot.artifact_sha256),
    ),
  };
}
