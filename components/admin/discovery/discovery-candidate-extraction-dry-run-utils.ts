export const CANDIDATE_EXTRACTION_DRY_RUN_ROUTE =
  "/api/admin/discovery/candidate-extraction/invoke";

export const CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION =
  "candidate_extraction_invocation.v1";

export const CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES = 1;

export type CandidateExtractionDryRunRequestBody = {
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: string;
  dry_run: true;
  max_candidates: typeof CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES;
  source_scope: "single_run";
  schema_version: typeof CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION;
};

export type CandidateExtractionDryRunRequestInput = {
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string;
  invocationReason: string;
};

export type CandidateExtractionDryRunSafeSummary = {
  accepted: boolean | null;
  rejected: boolean | null;
  dryRun: boolean | null;
  candidatesStagedCount: number;
  candidatesSkippedCount: number;
  auditCorrelationId: string | null;
  safetyFlags: string[];
  validationFailures: string[];
  duplicateOrEligibilityRejections: string[];
  noPublicWriteConfirmed: boolean;
  noDiscoveredWriteConfirmed: boolean;
  rejectionCode: string | null;
  errorSummary: string | null;
};

type JsonRecord = Record<string, unknown>;

const SAFE_TEXT_FORBIDDEN_PATTERN =
  /<|>|raw[_-]?payload|html|script|secret|token|password|service[_-]?role|stack|credential|cookie|csrf|supabase/i;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeDisplayText(value: unknown, maximum = 160) {
  const trimmed = getTrimmedString(value).replace(/\s+/g, " ");

  if (!trimmed || trimmed.length > maximum) return null;
  if (SAFE_TEXT_FORBIDDEN_PATTERN.test(trimmed)) return null;

  return trimmed;
}

function getSafeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => getSafeDisplayText(item, 96))
    .filter((item): item is string => Boolean(item));
}

function getSafeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function getSafeCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

export function hasCandidateExtractionDryRunContext(input: {
  discoverySourceId: string | null | undefined;
  discoveryRunId: string | null | undefined;
}) {
  return Boolean(
    getTrimmedString(input.discoverySourceId) &&
      getTrimmedString(input.discoveryRunId),
  );
}

export function buildCandidateExtractionDryRunRequestBody(
  input: CandidateExtractionDryRunRequestInput,
): CandidateExtractionDryRunRequestBody {
  return {
    discovery_source_id: input.discoverySourceId.trim(),
    discovery_run_id: input.discoveryRunId.trim(),
    audit_correlation_id: input.auditCorrelationId.trim(),
    invocation_reason: input.invocationReason.trim(),
    dry_run: true,
    max_candidates: CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES,
    source_scope: "single_run",
    schema_version: CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION,
  };
}

export function normalizeCandidateExtractionDryRunResponse(
  value: unknown,
): CandidateExtractionDryRunSafeSummary {
  const payload = isRecord(value) ? value : {};

  return {
    accepted: getSafeBoolean(payload.accepted),
    rejected: getSafeBoolean(payload.rejected),
    dryRun: getSafeBoolean(payload.dry_run),
    candidatesStagedCount: getSafeCount(payload.candidates_staged_count),
    candidatesSkippedCount: getSafeCount(payload.candidates_skipped_count),
    auditCorrelationId: getSafeDisplayText(payload.audit_correlation_id, 80),
    safetyFlags: getSafeStringList(payload.safety_flags),
    validationFailures: getSafeStringList(payload.validation_failures),
    duplicateOrEligibilityRejections: getSafeStringList(
      payload.duplicate_or_eligibility_rejections,
    ),
    noPublicWriteConfirmed: payload.no_public_write_confirmed === true,
    noDiscoveredWriteConfirmed: payload.no_discovered_write_confirmed === true,
    rejectionCode: getSafeDisplayText(payload.rejection_code, 96),
    errorSummary: getSafeDisplayText(payload.error_summary, 180),
  };
}
