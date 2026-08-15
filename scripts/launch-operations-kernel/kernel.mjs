import {
  canonicalJson,
  isSha256,
  sha256Hex,
} from "./canonical.mjs";

export const LIFECYCLE_STATES = Object.freeze([
  "READY",
  "QUALIFYING",
  "QUALIFIED",
  "OFFICIAL_RUNTIME_AUTHORIZED",
  "OFFICIAL_RUNTIME_RUNNING",
  "COMPLETE",
  "FAILED_RECOVERABLE",
  "FAILED_CLOSED",
]);

export const AUTHORIZATION_CLASSES = Object.freeze({
  NONE: "NONE",
  LOCAL_QUALIFICATION: "LOCAL_QUALIFICATION",
  RECOVERY_CONTROLLER: "RECOVERY_CONTROLLER",
  OFFICIAL_RUNTIME: "OFFICIAL_RUNTIME",
});

const TRANSITIONS = new Map([
  ["READY>QUALIFYING", AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION],
  ["QUALIFYING>QUALIFIED", AUTHORIZATION_CLASSES.LOCAL_QUALIFICATION],
  ["QUALIFYING>FAILED_RECOVERABLE", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  ["QUALIFYING>FAILED_CLOSED", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  ["QUALIFIED>OFFICIAL_RUNTIME_AUTHORIZED", AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME],
  ["QUALIFIED>FAILED_CLOSED", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  [
    "OFFICIAL_RUNTIME_AUTHORIZED>OFFICIAL_RUNTIME_RUNNING",
    AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME,
  ],
  [
    "OFFICIAL_RUNTIME_AUTHORIZED>FAILED_CLOSED",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  ["OFFICIAL_RUNTIME_RUNNING>COMPLETE", AUTHORIZATION_CLASSES.OFFICIAL_RUNTIME],
  [
    "OFFICIAL_RUNTIME_RUNNING>FAILED_RECOVERABLE",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  [
    "OFFICIAL_RUNTIME_RUNNING>FAILED_CLOSED",
    AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
  ],
  ["FAILED_RECOVERABLE>READY", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
  ["FAILED_RECOVERABLE>FAILED_CLOSED", AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER],
]);

const RESOURCE_TYPES = new Set([
  "DATABASE_ROW",
  "STORAGE_OBJECT",
  "PREVIEW_DEPLOYMENT",
  "GIT_BRANCH",
  "ENVIRONMENT_RECORD",
]);

const SECRET_FIELD =
  /(?:secret|password|passwd|token|cookie|session|credential|private[_-]?key|authorization[_-]?value)/iu;
const SECRET_VALUE_PATTERNS = Object.freeze([
  /\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/iu,
  /\b(?:sk|sbp|service[_-]?role)[-_][A-Za-z0-9._~+/=-]{8,}/iu,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/u,
]);

export class KernelError extends Error {
  constructor(code) {
    super(code);
    this.name = "KernelError";
    this.code = code;
  }
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function validBudget(budget) {
  return (
    exactKeys(budget, ["requests", "mutations"]) &&
    [budget.requests, budget.mutations].every(
      (entry) =>
        exactKeys(entry, ["limit", "used"]) &&
        Number.isSafeInteger(entry.limit) &&
        entry.limit >= 0 &&
        Number.isSafeInteger(entry.used) &&
        entry.used >= 0 &&
        entry.used <= entry.limit,
    )
  );
}

function failClosed(state, code) {
  if (["COMPLETE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
    return {
      ...structuredClone(state),
      outcome: { code: "TERMINAL_STATE", successful: false },
    };
  }
  return {
    ...structuredClone(state),
    lifecycle_state: "FAILED_CLOSED",
    outcome: { code, successful: false },
  };
}

function validAuthorization(authorization) {
  return (
    exactKeys(authorization, [
      "schema_version",
      "authorization_class",
      "candidate_identity_sha256",
      "review_sha256",
    ]) &&
    authorization.schema_version === 1 &&
    Object.values(AUTHORIZATION_CLASSES).includes(authorization.authorization_class) &&
    authorization.authorization_class !== AUTHORIZATION_CLASSES.NONE &&
    isSha256(authorization.candidate_identity_sha256) &&
    isSha256(authorization.review_sha256)
  );
}

export function createKernelState({ candidate_identity_sha256, budgets }) {
  if (!isSha256(candidate_identity_sha256)) {
    throw new KernelError("CANDIDATE_IDENTITY");
  }
  if (!validBudget(budgets)) throw new KernelError("BUDGET_SHAPE");
  return {
    schema_version: 1,
    candidate_identity_sha256,
    lifecycle_state: "READY",
    authorization_class: AUTHORIZATION_CLASSES.NONE,
    budgets: structuredClone(budgets),
    owned_resources: [],
    effect_ledger: [],
    transition_history: [],
    cleanup: { required: false, verified: true },
    recovery: { status: "NOT_REQUIRED" },
    outcome: { code: "READY", successful: true },
  };
}

export function applyLifecycleTransition(state, target, authorization) {
  if (!state || !LIFECYCLE_STATES.includes(state.lifecycle_state)) {
    throw new KernelError("LIFECYCLE_STATE");
  }
  if (["COMPLETE", "FAILED_CLOSED"].includes(state.lifecycle_state)) {
    return failClosed(state, "TERMINAL_STATE");
  }
  if (!LIFECYCLE_STATES.includes(target)) {
    return failClosed(state, "TRANSITION_DENIED");
  }
  if (!validAuthorization(authorization)) {
    return failClosed(state, "AUTHORIZATION_INVALID");
  }
  if (
    state.candidate_identity_sha256 !== authorization.candidate_identity_sha256
  ) {
    return failClosed(state, "CANDIDATE_MISMATCH");
  }
  const required = TRANSITIONS.get(`${state.lifecycle_state}>${target}`);
  if (!required) return failClosed(state, "TRANSITION_DENIED");
  if (authorization.authorization_class !== required) {
    return failClosed(state, "AUTHORIZATION_CLASS_MISMATCH");
  }
  return {
    ...structuredClone(state),
    lifecycle_state: target,
    authorization_class: authorization.authorization_class,
    transition_history: [
      ...(state.transition_history ?? []),
      {
        from: state.lifecycle_state,
        to: target,
        authorization_class: authorization.authorization_class,
        review_sha256: authorization.review_sha256,
      },
    ],
    outcome: { code: target, successful: true },
  };
}

export function consumeBudget(budgets, category, amount = 1) {
  if (!validBudget(budgets)) throw new KernelError("BUDGET_SHAPE");
  if (!["requests", "mutations"].includes(category)) {
    throw new KernelError("BUDGET_CATEGORY");
  }
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new KernelError("BUDGET_AMOUNT");
  }
  const result = structuredClone(budgets);
  if (result[category].used + amount > result[category].limit) {
    throw new KernelError("BUDGET_EXHAUSTED");
  }
  result[category].used += amount;
  return result;
}

function rejectSecretFields(value, path = []) {
  if (
    typeof value === "string" &&
    SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))
  ) {
    throw new KernelError("EVIDENCE_SECRET_VALUE");
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectSecretFields(entry, [...path, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_FIELD.test(key)) throw new KernelError("EVIDENCE_SECRET_FIELD");
    rejectSecretFields(entry, [...path, key]);
  }
}

function validateOwnedResource(resource, candidateIdentity) {
  const storage = resource?.resource_type === "STORAGE_OBJECT";
  if (
    !resource ||
    typeof resource !== "object" ||
    !exactKeys(
      resource,
      storage
        ? ["resource_key", "resource_type", "owner", "locator", "storage_cas"]
        : ["resource_key", "resource_type", "owner", "locator"],
    ) ||
    typeof resource.resource_key !== "string" ||
    resource.resource_key.length < 1 ||
    !RESOURCE_TYPES.has(resource.resource_type) ||
    !exactKeys(resource.owner, ["phase", "candidate_identity_sha256"]) ||
    resource.owner?.phase !== "34JA-34JZ" ||
    resource.owner?.candidate_identity_sha256 !== candidateIdentity ||
    !resource.locator ||
    typeof resource.locator !== "object" ||
    Array.isArray(resource.locator)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "DATABASE_ROW" &&
    (!exactKeys(resource.locator, ["relation", "id"]) ||
      typeof resource.locator.relation !== "string" ||
      resource.locator.relation.length < 1 ||
      typeof resource.locator.id !== "string" ||
      resource.locator.id.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (resource.resource_type === "STORAGE_OBJECT") {
    if (
      !exactKeys(resource.locator, ["bucket", "name"]) ||
      typeof resource.locator.bucket !== "string" ||
      resource.locator.bucket.length < 1 ||
      typeof resource.locator.name !== "string" ||
      resource.locator.name.length < 1 ||
      !exactKeys(resource.storage_cas, [
        "expected_version",
        "delete_capability_sha256",
      ]) ||
      typeof resource.storage_cas?.expected_version !== "string" ||
      resource.storage_cas.expected_version.length < 1 ||
      !isSha256(resource.storage_cas.delete_capability_sha256)
    ) {
      throw new KernelError("OWNERSHIP_UNPROVEN");
    }
  }
  if (
    resource.resource_type === "PREVIEW_DEPLOYMENT" &&
    (!exactKeys(resource.locator, ["deployment_id", "project_id"]) ||
      typeof resource.locator.deployment_id !== "string" ||
      resource.locator.deployment_id.length < 1 ||
      typeof resource.locator.project_id !== "string" ||
      resource.locator.project_id.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "GIT_BRANCH" &&
    (!exactKeys(resource.locator, [
      "repository",
      "branch",
      "expected_commit_sha256",
    ]) ||
      typeof resource.locator.repository !== "string" ||
      resource.locator.repository.length < 1 ||
      typeof resource.locator.branch !== "string" ||
      resource.locator.branch.length < 1 ||
      !isSha256(resource.locator.expected_commit_sha256))
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
  if (
    resource.resource_type === "ENVIRONMENT_RECORD" &&
    (!exactKeys(resource.locator, ["project_id", "key", "target"]) ||
      typeof resource.locator.project_id !== "string" ||
      resource.locator.project_id.length < 1 ||
      typeof resource.locator.key !== "string" ||
      resource.locator.key.length < 1 ||
      typeof resource.locator.target !== "string" ||
      resource.locator.target.length < 1)
  ) {
    throw new KernelError("OWNERSHIP_UNPROVEN");
  }
}

function validateLedger(state) {
  if (!Array.isArray(state.owned_resources) || !Array.isArray(state.effect_ledger)) {
    throw new KernelError("RECOVERY_LEDGER_SHAPE");
  }
  const byKey = new Map();
  const locatorIdentities = new Set();
  for (const resource of state.owned_resources) {
    validateOwnedResource(resource, state.candidate_identity_sha256);
    const locatorIdentity = canonicalJson({
      resource_type: resource.resource_type,
      locator: resource.locator,
    });
    if (byKey.has(resource.resource_key) || locatorIdentities.has(locatorIdentity)) {
      throw new KernelError("OWNERSHIP_AMBIGUOUS");
    }
    byKey.set(resource.resource_key, resource);
    locatorIdentities.add(locatorIdentity);
  }
  const sequences = new Set();
  const ledgerKeys = new Set();
  for (const entry of state.effect_ledger) {
    if (
      !entry ||
      !exactKeys(entry, ["sequence", "resource_key", "effect", "status"]) ||
      !Number.isSafeInteger(entry.sequence) ||
      entry.sequence < 1 ||
      sequences.has(entry.sequence) ||
      typeof entry.resource_key !== "string" ||
      ledgerKeys.has(entry.resource_key) ||
      !byKey.has(entry.resource_key) ||
      entry.effect !== "CREATE" ||
      !["INTENT_ONLY", "APPLIED", "UNCERTAIN", "CLEANED"].includes(entry.status)
    ) {
      throw new KernelError("RECOVERY_LEDGER_SHAPE");
    }
    sequences.add(entry.sequence);
    ledgerKeys.add(entry.resource_key);
  }
  const ordered = [...state.effect_ledger].sort((left, right) => left.sequence - right.sequence);
  if (
    ledgerKeys.size !== byKey.size ||
    !ordered.every((entry, index) => entry.sequence === index + 1)
  ) {
    throw new KernelError("RECOVERY_LEDGER_SHAPE");
  }
  return { byKey, ordered };
}

function failedRecovery(
  state,
  code,
  budgets = state?.budgets ?? {
    requests: { limit: 0, used: 0 },
    mutations: { limit: 0, used: 0 },
  },
) {
  const base = state && typeof state === "object" ? structuredClone(state) : {};
  return {
    ...base,
    lifecycle_state: "FAILED_CLOSED",
    budgets: structuredClone(budgets),
    cleanup: { required: true, verified: false },
    recovery: {
      ...(state?.recovery && typeof state.recovery === "object"
        ? structuredClone(state.recovery)
        : {}),
      status: "FAILED_CLOSED",
    },
    outcome: { code, successful: false },
  };
}

export async function reconcileRecovery({
  loadAuthoritativeState,
  expectedCandidateIdentity,
  authorization,
  inspectOwnedResource,
  reconcileOwnedResource,
}) {
  if (
    typeof loadAuthoritativeState !== "function" ||
    typeof inspectOwnedResource !== "function" ||
    typeof reconcileOwnedResource !== "function"
  ) {
    throw new KernelError("RECOVERY_ADAPTER");
  }
  const loaded = await loadAuthoritativeState();
  const state = structuredClone(loaded);
  if (
    !isSha256(expectedCandidateIdentity) ||
    state?.candidate_identity_sha256 !== expectedCandidateIdentity ||
    authorization?.candidate_identity_sha256 !== expectedCandidateIdentity
  ) {
    return failedRecovery(state, "CANDIDATE_MISMATCH");
  }
  if (
    !validAuthorization(authorization) ||
    authorization.authorization_class !== AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER
  ) {
    return failedRecovery(state, "AUTHORIZATION_CLASS_MISMATCH");
  }
  if (
    state.lifecycle_state !== "FAILED_RECOVERABLE" ||
    state.recovery?.status !== "PENDING" ||
    state.recovery?.resume_to !== "READY" ||
    !validBudget(state.budgets)
  ) {
    return failedRecovery(state, "RECOVERY_STATE_INVALID");
  }

  let ledger;
  try {
    ledger = validateLedger(state);
  } catch (error) {
    return failedRecovery(
      state,
      error?.code === "OWNERSHIP_AMBIGUOUS"
        ? "OWNERSHIP_AMBIGUOUS"
        : "OWNERSHIP_UNPROVEN",
    );
  }

  let budgets = structuredClone(state.budgets);
  const entries = state.effect_ledger.map((entry) => ({ ...entry }));
  for (const entry of ledger.ordered) {
    const resource = ledger.byKey.get(entry.resource_key);
    let observation;
    try {
      budgets = consumeBudget(budgets, "requests");
      observation = await inspectOwnedResource(structuredClone(resource));
    } catch (error) {
      return failedRecovery(
        state,
        error?.code === "BUDGET_EXHAUSTED" ? "BUDGET_EXHAUSTED" : "INSPECTION_FAILED",
        budgets,
      );
    }
    if (!observation || !["ABSENT", "PRESENT", "AMBIGUOUS"].includes(observation.status)) {
      return failedRecovery(state, "INSPECTION_INVALID", budgets);
    }
    if (observation.status === "AMBIGUOUS") {
      return failedRecovery(state, "OWNERSHIP_AMBIGUOUS", budgets);
    }
    if (entry.status === "CLEANED") {
      if (observation.status !== "ABSENT") {
        return failedRecovery(state, "CLEANED_EFFECT_PRESENT", budgets);
      }
      continue;
    }
    if (observation.status === "ABSENT") {
      entries.find((candidate) => candidate.sequence === entry.sequence).status = "CLEANED";
      continue;
    }
    if (entry.status === "INTENT_ONLY") {
      return failedRecovery(state, "INTENT_OWNERSHIP_UNPROVEN", budgets);
    }
    let casContract;
    if (resource.resource_type === "STORAGE_OBJECT") {
      casContract = {
        expected_version: resource.storage_cas.expected_version,
        delete_capability_sha256: resource.storage_cas.delete_capability_sha256,
      };
      if (observation.observed_version !== casContract.expected_version) {
        return failedRecovery(state, "STORAGE_VERSION_MISMATCH", budgets);
      }
    }
    let reconciliation;
    try {
      budgets = consumeBudget(budgets, "mutations");
      reconciliation = await reconcileOwnedResource(
        structuredClone(resource),
        casContract,
      );
    } catch (error) {
      return failedRecovery(
        state,
        error?.code === "BUDGET_EXHAUSTED" ? "BUDGET_EXHAUSTED" : "RECONCILIATION_FAILED",
        budgets,
      );
    }
    if (
      resource.resource_type === "STORAGE_OBJECT" &&
      reconciliation?.status === "VERSION_MISMATCH"
    ) {
      return failedRecovery(state, "STORAGE_VERSION_MISMATCH", budgets);
    }
    if (!reconciliation || !["DELETED_EXACT", "ABSENT_VERIFIED"].includes(reconciliation.status)) {
      return failedRecovery(state, "RECONCILIATION_FAILED", budgets);
    }
    if (
      resource.resource_type === "STORAGE_OBJECT" &&
      reconciliation.expected_version !== casContract.expected_version
    ) {
      return failedRecovery(state, "STORAGE_CAS_PROOF_MISMATCH", budgets);
    }
    let verification;
    try {
      budgets = consumeBudget(budgets, "requests");
      verification = await inspectOwnedResource(structuredClone(resource));
    } catch (error) {
      return failedRecovery(
        state,
        error?.code === "BUDGET_EXHAUSTED" ? "BUDGET_EXHAUSTED" : "CLEANUP_VERIFICATION_FAILED",
        budgets,
      );
    }
    if (verification?.status !== "ABSENT") {
      return failedRecovery(state, "CLEANUP_VERIFICATION_FAILED", budgets);
    }
    entries.find((candidate) => candidate.sequence === entry.sequence).status = "CLEANED";
  }

  return {
    ...state,
    lifecycle_state: "READY",
    authorization_class: AUTHORIZATION_CLASSES.RECOVERY_CONTROLLER,
    budgets,
    effect_ledger: entries,
    cleanup: { required: true, verified: true },
    recovery: { ...state.recovery, status: "COMPLETE" },
    outcome: { code: "RESUME_AUTHORIZED", successful: true },
  };
}

const EVIDENCE_KEYS = [
  "authorization_class",
  "budgets",
  "candidate_identity_sha256",
  "cleanup",
  "effect_ledger",
  "immutable_audit_reference_sha256",
  "lifecycle_state",
  "outcome",
  "owned_resources",
  "recovery",
];

export function buildCompactEvidence(input) {
  rejectSecretFields(input);
  if (!exactKeys(input, EVIDENCE_KEYS)) throw new KernelError("EVIDENCE_FIELD");
  const payload = {
    schema_version: 1,
    candidate_identity_sha256: input.candidate_identity_sha256,
    lifecycle_state: input.lifecycle_state,
    authorization_class: input.authorization_class,
    budgets: structuredClone(input.budgets),
    owned_resources: structuredClone(input.owned_resources),
    effect_ledger: structuredClone(input.effect_ledger),
    cleanup: structuredClone(input.cleanup),
    recovery: structuredClone(input.recovery),
    outcome: structuredClone(input.outcome),
    immutable_audit_reference_sha256: [
      ...input.immutable_audit_reference_sha256,
    ],
  };
  const evidence = {
    ...payload,
    evidence_identity_sha256: sha256Hex(canonicalJson(payload)),
  };
  validateCompactEvidence(evidence);
  return evidence;
}

export function validateCompactEvidence(evidence) {
  rejectSecretFields(evidence);
  if (
    !exactKeys(evidence, ["schema_version", ...EVIDENCE_KEYS, "evidence_identity_sha256"]) ||
    evidence.schema_version !== 1 ||
    !isSha256(evidence.candidate_identity_sha256) ||
    !LIFECYCLE_STATES.includes(evidence.lifecycle_state) ||
    !Object.values(AUTHORIZATION_CLASSES).includes(evidence.authorization_class) ||
    !validBudget(evidence.budgets) ||
    !Array.isArray(evidence.owned_resources) ||
    !Array.isArray(evidence.effect_ledger) ||
    !exactKeys(evidence.cleanup, ["required", "verified"]) ||
    typeof evidence.cleanup.required !== "boolean" ||
    typeof evidence.cleanup.verified !== "boolean" ||
    (!exactKeys(evidence.recovery, ["status"]) &&
      !exactKeys(evidence.recovery, ["status", "resume_to"])) ||
    typeof evidence.recovery?.status !== "string" ||
    evidence.recovery.status.length < 1 ||
    (Object.hasOwn(evidence.recovery, "resume_to") &&
      (typeof evidence.recovery.resume_to !== "string" ||
        evidence.recovery.resume_to.length < 1)) ||
    !exactKeys(evidence.outcome, ["code", "successful"]) ||
    typeof evidence.outcome?.code !== "string" ||
    evidence.outcome.code.length < 1 ||
    typeof evidence.outcome?.successful !== "boolean" ||
    !Array.isArray(evidence.immutable_audit_reference_sha256) ||
    !evidence.immutable_audit_reference_sha256.every(isSha256) ||
    evidence.immutable_audit_reference_sha256.length !==
      new Set(evidence.immutable_audit_reference_sha256).size ||
    !isSha256(evidence.evidence_identity_sha256)
  ) {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  for (const resource of evidence.owned_resources) {
    validateOwnedResource(resource, evidence.candidate_identity_sha256);
  }
  try {
    validateLedger(evidence);
  } catch {
    throw new KernelError("EVIDENCE_SHAPE");
  }
  const { evidence_identity_sha256: identity, ...payload } = evidence;
  if (sha256Hex(canonicalJson(payload)) !== identity) {
    throw new KernelError("EVIDENCE_IDENTITY_MISMATCH");
  }
  return true;
}
