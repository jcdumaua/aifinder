import type { CandidateExtractionMapperInput } from "./discovery-candidate-extraction-mapper";
import {
  stageMappedExtractionCandidate,
  type CandidateExtractionStageCandidate,
  type CandidateExtractionStagingPipelineItemResult,
} from "./discovery-candidate-extraction-staging-pipeline";

export const CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION =
  "candidate_extraction_invocation.v1";

export const CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES = 25;
export const CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1;
export const CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE =
  "manual_api_single_candidate_staging";

export type CandidateExtractionInvocationSourceScope =
  | "single_source"
  | "single_run";

export type CandidateExtractionInvocationRejectionCode =
  | "invalid_invocation_input"
  | "missing_discovery_source_id"
  | "invalid_discovery_source_id"
  | "missing_discovery_run_id"
  | "invalid_discovery_run_id"
  | "missing_audit_correlation_id"
  | "invalid_audit_correlation_id"
  | "missing_invocation_reason"
  | "missing_invoked_by_admin_user_id"
  | "missing_dry_run"
  | "invalid_dry_run"
  | "live_invocation_not_enabled"
  | "live_staging_not_configured"
  | "live_staging_input_unavailable"
  | "live_staging_failed"
  | "missing_max_candidates"
  | "invalid_max_candidates"
  | "max_candidates_out_of_bounds"
  | "missing_source_scope"
  | "invalid_source_scope"
  | "ambiguous_source_scope"
  | "missing_schema_version"
  | "invalid_schema_version"
  | "unsafe_payload"
  | "field_too_long";

export type CandidateExtractionInvocationInput = {
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: string;
  invoked_by_admin_user_id: string;
  dry_run: boolean;
  max_candidates: number;
  source_scope: CandidateExtractionInvocationSourceScope;
  schema_version: string;
};

export type CandidateExtractionInvocationResult = {
  accepted: boolean;
  rejected: boolean;
  rejection_code: CandidateExtractionInvocationRejectionCode | null;
  dry_run: boolean | null;
  discovery_source_id: string | null;
  discovery_run_id: string | null;
  candidates_considered_count: number;
  candidates_staged_count: number;
  candidates_skipped_count: number;
  validation_failures: CandidateExtractionInvocationRejectionCode[];
  duplicate_or_eligibility_rejections: string[];
  audit_correlation_id: string | null;
  safety_flags: string[];
  no_public_write_confirmed: boolean;
  no_discovered_write_confirmed: boolean;
  error_summary: string | null;
};

export type CandidateExtractionLiveStagingGateMode =
  | "test_only_mocked_staging"
  | typeof CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE;

export type CandidateExtractionLiveStagingGate = {
  enabled: boolean;
  mode: CandidateExtractionLiveStagingGateMode;
  phase?: string;
  maxCandidates?: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES;
  sourceScope?: "single_run";
  createdByServer?: true;
  approvedExecutionRequired?: true;
  auditCorrelationId?: string;
  discoverySourceId?: string;
  discoveryRunId?: string;
  actorId?: string;
};

export type CandidateExtractionLiveStagingCandidateProviderInput = {
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string;
  invocationReason: string;
  invokedByAdminUserId: string;
  dryRun: false;
  maxCandidates: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES;
  sourceScope: "single_run";
  schemaVersion: typeof CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION;
};

export type CandidateExtractionLiveStagingCandidateProvider = (
  input: CandidateExtractionLiveStagingCandidateProviderInput,
) =>
  | CandidateExtractionMapperInput
  | null
  | Promise<CandidateExtractionMapperInput | null>;

// Server-created options only. Client request bodies must never activate live staging.
export type CandidateExtractionInvocationOptions = {
  liveStagingGate?: CandidateExtractionLiveStagingGate;
  getLiveStagingCandidate?: CandidateExtractionLiveStagingCandidateProvider;
  stageCandidate?: CandidateExtractionStageCandidate;
};

type InvocationContext = {
  discoverySourceId?: string;
  discoveryRunId?: string;
  auditCorrelationId?: string;
  dryRun?: boolean | null;
};

type NormalizedInvocationInput = {
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string;
  invocationReason: string;
  invokedByAdminUserId: string;
  dryRun: boolean;
  maxCandidates: number;
  sourceScope: CandidateExtractionInvocationSourceScope;
  schemaVersion: typeof CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_INVOCATION_REASON_LENGTH = 240;
const MAX_ADMIN_USER_ID_LENGTH = 120;

const REJECTION_MESSAGES: Record<
  CandidateExtractionInvocationRejectionCode,
  string
> = {
  invalid_invocation_input: "Invalid candidate extraction invocation input.",
  missing_discovery_source_id: "Missing discovery source ID.",
  invalid_discovery_source_id: "Invalid discovery source ID.",
  missing_discovery_run_id: "Missing discovery run ID.",
  invalid_discovery_run_id: "Invalid discovery run ID.",
  missing_audit_correlation_id: "Missing audit correlation ID.",
  invalid_audit_correlation_id: "Invalid audit correlation ID.",
  missing_invocation_reason: "Missing invocation reason.",
  missing_invoked_by_admin_user_id: "Missing invoked-by admin user ID.",
  missing_dry_run: "Missing dry-run flag.",
  invalid_dry_run: "Invalid dry-run flag.",
  live_invocation_not_enabled: "Live invocation is not enabled.",
  live_staging_not_configured: "Live staging is not configured.",
  live_staging_input_unavailable: "Live staging input is unavailable.",
  live_staging_failed: "Live candidate staging failed.",
  missing_max_candidates: "Missing max candidates.",
  invalid_max_candidates: "Invalid max candidates.",
  max_candidates_out_of_bounds: "Max candidates is outside the allowed bound.",
  missing_source_scope: "Missing source scope.",
  invalid_source_scope: "Invalid source scope.",
  ambiguous_source_scope: "Ambiguous source scope.",
  missing_schema_version: "Missing schema version.",
  invalid_schema_version: "Invalid schema version.",
  unsafe_payload: "Unsafe invocation payload.",
  field_too_long: "Invocation field is too long.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUuid(value: string): string | null {
  const normalized = value.trim().toLowerCase();

  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function containsUnsafePayload(value: string): boolean {
  return (
    /<\s*\/?\s*(script|iframe|html|body|style|svg|object|embed)\b/i.test(
      value,
    ) ||
    /(api[_-]?key|secret|token|password)\s*[:=]/i.test(value) ||
    /(system prompt|developer prompt|assistant message|model output)\s*:/i.test(
      value,
    )
  );
}

function isAmbiguousScope(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "*" ||
    normalized === "all" ||
    normalized === "all_sources" ||
    normalized === "all_runs" ||
    normalized === "multi_source" ||
    normalized === "multi_run" ||
    normalized.includes(",")
  );
}

function reject(
  code: CandidateExtractionInvocationRejectionCode,
  context: InvocationContext = {},
): CandidateExtractionInvocationResult {
  return {
    accepted: false,
    rejected: true,
    rejection_code: code,
    dry_run: context.dryRun ?? null,
    discovery_source_id: context.discoverySourceId ?? null,
    discovery_run_id: context.discoveryRunId ?? null,
    candidates_considered_count: 0,
    candidates_staged_count: 0,
    candidates_skipped_count: 0,
    validation_failures: [code],
    duplicate_or_eligibility_rejections: [],
    audit_correlation_id: context.auditCorrelationId ?? null,
    safety_flags: [
      "invocation_rejected",
      "staging_not_executed",
      "no_public_write",
      "no_discovered_write",
    ],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    error_summary: REJECTION_MESSAGES[code],
  };
}

function acceptDryRun(
  input: NormalizedInvocationInput,
): CandidateExtractionInvocationResult {
  return {
    accepted: true,
    rejected: false,
    rejection_code: null,
    dry_run: input.dryRun,
    discovery_source_id: input.discoverySourceId,
    discovery_run_id: input.discoveryRunId,
    candidates_considered_count: 0,
    candidates_staged_count: 0,
    candidates_skipped_count: 0,
    validation_failures: [],
    duplicate_or_eligibility_rejections: [],
    audit_correlation_id: input.auditCorrelationId,
    safety_flags: [
      "dry_run_only",
      "staging_not_executed",
      "bounded_max_candidates",
      "no_public_write",
      "no_discovered_write",
    ],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    error_summary: null,
  };
}

function toProviderInput(
  input: NormalizedInvocationInput,
): CandidateExtractionLiveStagingCandidateProviderInput {
  return {
    discoverySourceId: input.discoverySourceId,
    discoveryRunId: input.discoveryRunId,
    auditCorrelationId: input.auditCorrelationId,
    invocationReason: input.invocationReason,
    invokedByAdminUserId: input.invokedByAdminUserId,
    dryRun: false,
    maxCandidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
    sourceScope: "single_run",
    schemaVersion: input.schemaVersion,
  };
}

function toScopedMapperInput(
  input: NormalizedInvocationInput,
  candidateInput: CandidateExtractionMapperInput,
): CandidateExtractionMapperInput {
  return {
    ...candidateInput,
    discoverySourceId: input.discoverySourceId,
    discoveryRunId: input.discoveryRunId,
    auditCorrelationId: input.auditCorrelationId,
  };
}

function acceptLiveStaging(
  input: NormalizedInvocationInput,
): CandidateExtractionInvocationResult {
  return {
    accepted: true,
    rejected: false,
    rejection_code: null,
    dry_run: false,
    discovery_source_id: input.discoverySourceId,
    discovery_run_id: input.discoveryRunId,
    candidates_considered_count: 1,
    candidates_staged_count: 1,
    candidates_skipped_count: 0,
    validation_failures: [],
    duplicate_or_eligibility_rejections: [],
    audit_correlation_id: input.auditCorrelationId,
    safety_flags: [
      "live_staging_gate_enabled",
      "staging_executed",
      "bounded_max_candidates",
      "candidate_status_staged",
      "no_public_write",
      "no_discovered_write",
    ],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    error_summary: null,
  };
}

function isSupportedLiveStagingGateMode(
  mode: string,
): mode is CandidateExtractionLiveStagingGateMode {
  return (
    mode === "test_only_mocked_staging" ||
    mode === CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE
  );
}

function isManualApiLiveGateScopedToInput(
  gate: CandidateExtractionLiveStagingGate,
  input: NormalizedInvocationInput,
) {
  return (
    gate.mode === CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE &&
    typeof gate.phase === "string" &&
    gate.phase.trim().length > 0 &&
    gate.maxCandidates === CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES &&
    gate.sourceScope === "single_run" &&
    gate.createdByServer === true &&
    gate.approvedExecutionRequired === true &&
    gate.auditCorrelationId === input.auditCorrelationId &&
    gate.discoverySourceId === input.discoverySourceId &&
    gate.discoveryRunId === input.discoveryRunId &&
    gate.actorId === input.invokedByAdminUserId
  );
}

function rejectLiveStagingResult(
  input: NormalizedInvocationInput,
  result: Extract<CandidateExtractionStagingPipelineItemResult, { ok: false }>,
): CandidateExtractionInvocationResult {
  return {
    accepted: false,
    rejected: true,
    rejection_code: "live_staging_failed",
    dry_run: false,
    discovery_source_id: input.discoverySourceId,
    discovery_run_id: input.discoveryRunId,
    candidates_considered_count: 1,
    candidates_staged_count: 0,
    candidates_skipped_count: 1,
    validation_failures: ["live_staging_failed"],
    duplicate_or_eligibility_rejections: [result.error.code],
    audit_correlation_id: input.auditCorrelationId,
    safety_flags: [
      "invocation_rejected",
      "staging_not_executed",
      "no_public_write",
      "no_discovered_write",
    ],
    no_public_write_confirmed: true,
    no_discovered_write_confirmed: true,
    error_summary: result.error.message,
  };
}

async function invokeLiveStaging(
  input: NormalizedInvocationInput,
  options: CandidateExtractionInvocationOptions,
): Promise<CandidateExtractionInvocationResult> {
  const context: InvocationContext = {
    discoverySourceId: input.discoverySourceId,
    discoveryRunId: input.discoveryRunId,
    auditCorrelationId: input.auditCorrelationId,
    dryRun: false,
  };

  const liveGate = options.liveStagingGate;

  if (!liveGate?.enabled) {
    return reject("live_invocation_not_enabled", context);
  }

  if (!isSupportedLiveStagingGateMode(liveGate.mode)) {
    return reject("live_staging_not_configured", context);
  }

  if (input.maxCandidates !== CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES) {
    return reject("max_candidates_out_of_bounds", context);
  }

  if (input.sourceScope !== "single_run") {
    return reject("invalid_source_scope", context);
  }

  if (
    liveGate.mode === CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE &&
    !isManualApiLiveGateScopedToInput(liveGate, input)
  ) {
    return reject("live_staging_not_configured", context);
  }

  if (!options.getLiveStagingCandidate || !options.stageCandidate) {
    return reject("live_staging_not_configured", context);
  }

  let candidateInput: CandidateExtractionMapperInput | null;

  try {
    candidateInput = await options.getLiveStagingCandidate(toProviderInput(input));
  } catch {
    return reject("live_staging_input_unavailable", context);
  }

  if (!candidateInput) {
    return reject("live_staging_input_unavailable", context);
  }

  const stagingResult = await stageMappedExtractionCandidate(
    {
      item: toScopedMapperInput(input, candidateInput),
      actorId: input.invokedByAdminUserId,
    },
    { stageCandidate: options.stageCandidate },
  );

  if (!stagingResult.ok) {
    return rejectLiveStagingResult(input, stagingResult);
  }

  return acceptLiveStaging(input);
}

function validateInvocationInput(
  input: CandidateExtractionInvocationInput,
):
  | { ok: true; value: NormalizedInvocationInput }
  | { ok: false; result: CandidateExtractionInvocationResult } {
  if (!isRecord(input)) {
    return { ok: false, result: reject("invalid_invocation_input") };
  }

  const context: InvocationContext = {};

  const discoverySourceIdInput = getTrimmedString(input.discovery_source_id);

  if (!discoverySourceIdInput) {
    return { ok: false, result: reject("missing_discovery_source_id", context) };
  }

  const discoverySourceId = normalizeUuid(discoverySourceIdInput);

  if (!discoverySourceId) {
    return { ok: false, result: reject("invalid_discovery_source_id", context) };
  }

  context.discoverySourceId = discoverySourceId;

  const discoveryRunIdInput = getTrimmedString(input.discovery_run_id);

  if (!discoveryRunIdInput) {
    return { ok: false, result: reject("missing_discovery_run_id", context) };
  }

  const discoveryRunId = normalizeUuid(discoveryRunIdInput);

  if (!discoveryRunId) {
    return { ok: false, result: reject("invalid_discovery_run_id", context) };
  }

  context.discoveryRunId = discoveryRunId;

  const auditCorrelationIdInput = getTrimmedString(input.audit_correlation_id);

  if (!auditCorrelationIdInput) {
    return {
      ok: false,
      result: reject("missing_audit_correlation_id", context),
    };
  }

  const auditCorrelationId = normalizeUuid(auditCorrelationIdInput);

  if (!auditCorrelationId) {
    return {
      ok: false,
      result: reject("invalid_audit_correlation_id", context),
    };
  }

  context.auditCorrelationId = auditCorrelationId;

  const invocationReason = getTrimmedString(input.invocation_reason);

  if (!invocationReason) {
    return { ok: false, result: reject("missing_invocation_reason", context) };
  }

  if (invocationReason.length > MAX_INVOCATION_REASON_LENGTH) {
    return { ok: false, result: reject("field_too_long", context) };
  }

  const invokedByAdminUserId = getTrimmedString(input.invoked_by_admin_user_id);

  if (!invokedByAdminUserId) {
    return {
      ok: false,
      result: reject("missing_invoked_by_admin_user_id", context),
    };
  }

  if (invokedByAdminUserId.length > MAX_ADMIN_USER_ID_LENGTH) {
    return { ok: false, result: reject("field_too_long", context) };
  }

  if (
    containsUnsafePayload(invocationReason) ||
    containsUnsafePayload(invokedByAdminUserId)
  ) {
    return { ok: false, result: reject("unsafe_payload", context) };
  }

  if (!("dry_run" in input)) {
    return { ok: false, result: reject("missing_dry_run", context) };
  }

  if (typeof input.dry_run !== "boolean") {
    return { ok: false, result: reject("invalid_dry_run", context) };
  }

  context.dryRun = input.dry_run;

  if (!("max_candidates" in input)) {
    return { ok: false, result: reject("missing_max_candidates", context) };
  }

  if (!Number.isInteger(input.max_candidates)) {
    return { ok: false, result: reject("invalid_max_candidates", context) };
  }

  if (
    input.max_candidates < 1 ||
    input.max_candidates > CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES
  ) {
    return {
      ok: false,
      result: reject("max_candidates_out_of_bounds", context),
    };
  }

  const sourceScope = getTrimmedString(input.source_scope);

  if (!sourceScope) {
    return { ok: false, result: reject("missing_source_scope", context) };
  }

  if (isAmbiguousScope(sourceScope)) {
    return { ok: false, result: reject("ambiguous_source_scope", context) };
  }

  if (sourceScope !== "single_source" && sourceScope !== "single_run") {
    return { ok: false, result: reject("invalid_source_scope", context) };
  }

  const schemaVersion = getTrimmedString(input.schema_version);

  if (!schemaVersion) {
    return { ok: false, result: reject("missing_schema_version", context) };
  }

  if (schemaVersion !== CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION) {
    return { ok: false, result: reject("invalid_schema_version", context) };
  }

  return {
    ok: true,
    value: {
      discoverySourceId,
      discoveryRunId,
      auditCorrelationId,
      invocationReason,
      invokedByAdminUserId,
      dryRun: input.dry_run,
      maxCandidates: input.max_candidates,
      sourceScope,
      schemaVersion,
    },
  };
}

export function invokeCandidateExtractionStagingPipeline(
  input: CandidateExtractionInvocationInput,
  options: CandidateExtractionInvocationOptions = {},
): Promise<CandidateExtractionInvocationResult> {
  const validation = validateInvocationInput(input);

  if (!validation.ok) return Promise.resolve(validation.result);

  if (validation.value.dryRun) {
    return Promise.resolve(acceptDryRun(validation.value));
  }

  return invokeLiveStaging(validation.value, options);
}
