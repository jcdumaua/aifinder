export const CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE =
  "Stage one candidate";

export const CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1;

export const CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE = "single_run";

export type CandidateExtractionLiveStagingPreview = {
  candidateName: string | null;
  candidateWebsiteUrl: string | null;
  categoryHint: string | null;
  pricingHint: string | null;
  confidenceBucket: string | null;
  evidenceSummary: string | null;
  sourceEvidenceLocator: string | null;
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string | null;
};

export type CandidateExtractionLiveStagingSafeSummary = {
  accepted: boolean | null;
  rejected: boolean | null;
  dryRun: boolean | null;
  discoverySourceId: string | null;
  discoveryRunId: string | null;
  candidatesConsideredCount: number;
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
  /<|>|payload|html|script|secret|token|password|service[_-]?role|stack|credential|cookie|csrf|supabase/i;

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

function getSafeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function getSafeCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function getSafeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => getSafeDisplayText(item, 96))
    .filter((item): item is string => Boolean(item));
}

export function normalizeCandidateExtractionLiveStagingPreview(
  value: unknown,
): CandidateExtractionLiveStagingPreview | null {
  if (!isRecord(value)) return null;

  const discoverySourceId = getSafeDisplayText(value.discoverySourceId, 80);
  const discoveryRunId = getSafeDisplayText(value.discoveryRunId, 80);

  if (!discoverySourceId || !discoveryRunId) return null;

  return {
    candidateName: getSafeDisplayText(value.candidateName, 120),
    candidateWebsiteUrl: getSafeDisplayText(value.candidateWebsiteUrl, 180),
    categoryHint: getSafeDisplayText(value.categoryHint, 80),
    pricingHint: getSafeDisplayText(value.pricingHint, 80),
    confidenceBucket: getSafeDisplayText(value.confidenceBucket, 80),
    evidenceSummary: getSafeDisplayText(value.evidenceSummary, 180),
    sourceEvidenceLocator: getSafeDisplayText(value.sourceEvidenceLocator, 120),
    discoverySourceId,
    discoveryRunId,
    auditCorrelationId: getSafeDisplayText(value.auditCorrelationId, 80),
  };
}

export type CandidateExtractionPreviewRouteStatus =
  | "unavailable"
  | "pending_review"
  | "reviewable"
  | "blocked"
  | "stale";

export type CandidateExtractionPreviewRouteResult = {
  accepted: boolean | null;
  rejected: boolean | null;
  rejectionCode: string | null;
  previewStatus: CandidateExtractionPreviewRouteStatus | null;
  preview: CandidateExtractionLiveStagingPreview | null;
  safetyFlags: string[];
  auditCorrelationId: string | null;
  noPublicWriteConfirmed: boolean;
  noDiscoveredWriteConfirmed: boolean;
};

const ALLOWED_CANDIDATE_PREVIEW_ROUTE_STATUSES = new Set([
  "unavailable",
  "pending_review",
  "reviewable",
  "blocked",
  "stale",
]);

function getSafePreviewRouteStatus(
  value: unknown,
): CandidateExtractionPreviewRouteStatus | null {
  return typeof value === "string" &&
    ALLOWED_CANDIDATE_PREVIEW_ROUTE_STATUSES.has(value)
    ? (value as CandidateExtractionPreviewRouteStatus)
    : null;
}

export function normalizeCandidateExtractionPreviewRouteResult(
  value: unknown,
): CandidateExtractionPreviewRouteResult | null {
  const container = isRecord(value) ? value : {};
  const payload = isRecord(container.data) ? container.data : container;
  const previewStatus = getSafePreviewRouteStatus(payload.previewStatus);

  if (!previewStatus) return null;

  const accepted = getSafeBoolean(payload.accepted);
  const rejected = getSafeBoolean(payload.rejected);
  const preview =
    accepted === true && previewStatus === "reviewable"
      ? normalizeCandidateExtractionLiveStagingPreview(payload.preview)
      : null;

  return {
    accepted,
    rejected,
    rejectionCode: getSafeDisplayText(payload.rejectionCode, 120),
    previewStatus,
    preview,
    safetyFlags: getSafeStringList(payload.safetyFlags),
    auditCorrelationId: getSafeDisplayText(payload.auditCorrelationId, 80),
    noPublicWriteConfirmed: payload.noPublicWriteConfirmed === true,
    noDiscoveredWriteConfirmed: payload.noDiscoveredWriteConfirmed === true,
  };
}

export function getCandidatePreviewForLiveStagingScaffold(
  value: unknown,
): CandidateExtractionLiveStagingPreview | null {
  const result = normalizeCandidateExtractionPreviewRouteResult(value);

  if (
    !result ||
    result.accepted !== true ||
    result.previewStatus !== "reviewable" ||
    result.noPublicWriteConfirmed !== true ||
    result.noDiscoveredWriteConfirmed !== true
  ) {
    return null;
  }

  return result.preview;
}

export function hasCandidateExtractionLiveStagingContext(input: {
  discoverySourceId: string | null | undefined;
  discoveryRunId: string | null | undefined;
  candidatePreview?: CandidateExtractionLiveStagingPreview | null;
}) {
  return Boolean(
    getTrimmedString(input.discoverySourceId) &&
      getTrimmedString(input.discoveryRunId) &&
      input.candidatePreview,
  );
}

export function normalizeCandidateExtractionLiveStagingResponseSummary(
  value: unknown,
): CandidateExtractionLiveStagingSafeSummary {
  const payload = isRecord(value) ? value : {};

  return {
    accepted: getSafeBoolean(payload.accepted),
    rejected: getSafeBoolean(payload.rejected),
    dryRun: getSafeBoolean(payload.dry_run),
    discoverySourceId: getSafeDisplayText(payload.discovery_source_id, 80),
    discoveryRunId: getSafeDisplayText(payload.discovery_run_id, 80),
    candidatesConsideredCount: getSafeCount(
      payload.candidates_considered_count,
    ),
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
