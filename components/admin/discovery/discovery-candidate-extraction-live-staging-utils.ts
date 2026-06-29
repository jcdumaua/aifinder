export const CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE =
  "/api/admin/discovery/candidate-extraction/invoke";

export const CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION =
  "candidate_extraction_invocation.v1";

export const CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1;
export const CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE = "single_run";
export const CANDIDATE_EXTRACTION_LIVE_STAGING_INVOCATION_REASON =
  "Admin requested staged candidate from reviewable preview.";
export const CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE =
  "STAGE CANDIDATE";

export type CandidateExtractionLiveStagingPreview = {
  candidateName: string | null;
  candidateWebsiteUrl: string | null;
  categoryHint: string | null;
  pricingHint: string | null;
  confidenceBucket: string | null;
  evidenceSummary: string | null;
  sourceEvidenceLocator: string | null;
  sourceUrlSnapshot: string | null;
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string | null;
  previewStatus?: string | null;
};

export type CandidateExtractionLiveStagingContextInput = {
  discoveryRunId: string;
  discoverySourceId: string | null;
  candidatePreview?: CandidateExtractionLiveStagingPreview | null;
};

export type CandidateExtractionLiveStagingRequestBody = {
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_INVOCATION_REASON;
  dry_run: false;
  max_candidates: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES;
  source_scope: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE;
  schema_version: typeof CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION;
};

export type CandidateExtractionLiveStagingResponseSummary = {
  accepted: boolean | null;
  rejected: boolean | null;
  dryRun: boolean | null;
  discoverySourceId: string | null;
  discoveryRunId: string | null;
  auditCorrelationId: string | null;
  candidatesConsideredCount: number | null;
  candidatesStagedCount: number | null;
  candidatesSkippedCount: number | null;
  candidateId: string | null;
  candidateStatus: string | null;
  rejectionCode: string | null;
  errorSummary: string | null;
  safetyFlags: string[];
  validationFailures: string[];
  duplicateOrEligibilityRejections: string[];
  noPublicWriteConfirmed: boolean | null;
  noDiscoveredWriteConfirmed: boolean | null;
};

type CandidateExtractionPreviewRouteResultData = {
  accepted?: unknown;
  rejected?: unknown;
  rejectionCode?: unknown;
  previewStatus?: unknown;
  preview?: unknown;
  safetyFlags?: unknown;
  auditCorrelationId?: unknown;
  noPublicWriteConfirmed?: unknown;
  noDiscoveredWriteConfirmed?: unknown;
};

export type CandidateExtractionPreviewRouteResult =
  CandidateExtractionPreviewRouteResultData & {
    data?: CandidateExtractionPreviewRouteResultData;
  };

export type NormalizedCandidateExtractionPreviewRouteResult = {
  accepted: boolean;
  rejected: boolean;
  rejectionCode: string | null;
  previewStatus: string | null;
  preview: CandidateExtractionLiveStagingPreview | null;
  safetyFlags: string[];
  auditCorrelationId: string | null;
  noPublicWriteConfirmed: boolean | null;
  noDiscoveredWriteConfirmed: boolean | null;
};

const UNSAFE_DISPLAY_PATTERN =
  /<|>|raw[_-]?payload|html|script|secret|token|password|service[_-]?role|stack|credential|cookie|csrf|supabase/i;

const SAFE_PREVIEW_STATUSES = new Set(["reviewable"]);
const SAFE_REJECTION_CODES = new Set([
  "live_invocation_not_enabled",
  "preview_artifact_unavailable",
  "preview_source_url_missing",
  "preview_source_url_unsafe",
  "preview_source_url_drift",
  "unsupported_request_field",
  "client_admin_identity_not_allowed",
]);

function getRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getSafeString(value: unknown, maxLength = 240): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) return null;
  if (UNSAFE_DISPLAY_PATTERN.test(trimmed)) return null;

  return trimmed;
}

function getSafeUrl(value: unknown): string | null {
  const text = getSafeString(value, 2048);

  if (!text) return null;

  try {
    const parsed = new URL(text);

    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function getSafeBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function getSafeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => getSafeString(item, 120))
    .filter((item): item is string => Boolean(item));
}

export function normalizeCandidateExtractionLiveStagingPreview(
  value: unknown,
): CandidateExtractionLiveStagingPreview | null {
  const record = getRecord(value);

  if (!record) return null;

  const discoverySourceId = getSafeString(record.discoverySourceId, 80);
  const discoveryRunId = getSafeString(record.discoveryRunId, 80);
  const auditCorrelationId = getSafeString(record.auditCorrelationId, 80);
  const candidateWebsiteUrl = getSafeUrl(record.candidateWebsiteUrl);
  const sourceUrlSnapshot = getSafeUrl(record.sourceUrlSnapshot);

  if (
    !discoverySourceId ||
    !discoveryRunId ||
    !auditCorrelationId ||
    !candidateWebsiteUrl ||
    !sourceUrlSnapshot
  ) {
    return null;
  }

  if (candidateWebsiteUrl === sourceUrlSnapshot) return null;

  return {
    candidateName: getSafeString(record.candidateName, 160),
    candidateWebsiteUrl,
    categoryHint: getSafeString(record.categoryHint, 80),
    pricingHint: getSafeString(record.pricingHint, 80),
    confidenceBucket: getSafeString(record.confidenceBucket, 24),
    evidenceSummary: getSafeString(record.evidenceSummary, 400),
    sourceEvidenceLocator: getSafeString(record.sourceEvidenceLocator, 120),
    sourceUrlSnapshot,
    discoverySourceId,
    discoveryRunId,
    auditCorrelationId,
    previewStatus: getSafeString(record.previewStatus, 40),
  };
}

export function hasCandidateExtractionLiveStagingContext(
  input: CandidateExtractionLiveStagingContextInput,
): boolean {
  const preview = normalizeCandidateExtractionLiveStagingPreview(
    input.candidatePreview,
  );
  const discoveryRunId = getSafeString(input.discoveryRunId, 80);
  const discoverySourceId = getSafeString(input.discoverySourceId, 80);

  return Boolean(
    preview &&
      discoveryRunId &&
      discoverySourceId &&
      preview.discoveryRunId === discoveryRunId &&
      preview.discoverySourceId === discoverySourceId &&
      preview.auditCorrelationId &&
      preview.sourceUrlSnapshot &&
      preview.candidateWebsiteUrl,
  );
}

export function buildCandidateExtractionLiveStagingRequestBody(
  input: CandidateExtractionLiveStagingContextInput,
): CandidateExtractionLiveStagingRequestBody | null {
  const preview = normalizeCandidateExtractionLiveStagingPreview(
    input.candidatePreview,
  );
  const discoveryRunId = getSafeString(input.discoveryRunId, 80);
  const discoverySourceId = getSafeString(input.discoverySourceId, 80);

  if (
    !preview ||
    !discoveryRunId ||
    !discoverySourceId ||
    preview.discoveryRunId !== discoveryRunId ||
    preview.discoverySourceId !== discoverySourceId ||
    !preview.auditCorrelationId
  ) {
    return null;
  }

  return {
    discovery_source_id: discoverySourceId,
    discovery_run_id: discoveryRunId,
    audit_correlation_id: preview.auditCorrelationId,
    invocation_reason: CANDIDATE_EXTRACTION_LIVE_STAGING_INVOCATION_REASON,
    dry_run: false,
    max_candidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
    source_scope: CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE,
    schema_version: CANDIDATE_EXTRACTION_LIVE_STAGING_SCHEMA_VERSION,
  };
}

export function normalizeCandidateExtractionLiveStagingResponseSummary(
  value: unknown,
): CandidateExtractionLiveStagingResponseSummary | null {
  const record = getRecord(value);

  if (!record) return null;

  return {
    accepted: getSafeBoolean(record.accepted),
    rejected: getSafeBoolean(record.rejected),
    dryRun: getSafeBoolean(record.dry_run),
    discoverySourceId: getSafeString(record.discovery_source_id, 80),
    discoveryRunId: getSafeString(record.discovery_run_id, 80),
    auditCorrelationId: getSafeString(record.audit_correlation_id, 80),
    candidatesConsideredCount: getSafeNumber(record.candidates_considered_count),
    candidatesStagedCount: getSafeNumber(record.candidates_staged_count),
    candidatesSkippedCount: getSafeNumber(record.candidates_skipped_count),
    candidateId: getSafeString(record.candidate_id, 80),
    candidateStatus: getSafeString(record.candidate_status, 40),
    rejectionCode: getSafeString(record.rejection_code, 80),
    errorSummary: getSafeString(record.error_summary, 240),
    safetyFlags: getSafeStringArray(record.safety_flags),
    validationFailures: getSafeStringArray(record.validation_failures),
    duplicateOrEligibilityRejections: getSafeStringArray(
      record.duplicate_or_eligibility_rejections,
    ),
    noPublicWriteConfirmed: getSafeBoolean(record.no_public_write_confirmed),
    noDiscoveredWriteConfirmed: getSafeBoolean(
      record.no_discovered_write_confirmed,
    ),
  };
}

export function getCandidateExtractionLiveStagingFailureMessage(
  value: unknown,
  status?: number,
): string {
  const record = getRecord(value);
  const code = getSafeString(record?.rejection_code ?? record?.code, 80);

  if (code === "live_invocation_not_enabled") {
    return "The backend did not enable staging for this preview. Refresh and try again after review.";
  }

  if (code === "preview_artifact_unavailable") {
    return "No reviewable preview is available for this run.";
  }

  if (code === "preview_source_url_missing") {
    return "The trusted source URL snapshot is missing. This candidate cannot be staged.";
  }

  if (code === "preview_source_url_unsafe") {
    return "The trusted source URL snapshot failed safety checks.";
  }

  if (code === "preview_source_url_drift") {
    return "The preview is stale because the source URL changed. Refresh or rerun the preview.";
  }

  if (code === "unsupported_request_field") {
    return "The staging request included unsupported fields and was blocked.";
  }

  if (code === "client_admin_identity_not_allowed") {
    return "The staging request attempted to send client identity and was blocked.";
  }

  if (status === 401) return "Admin session expired. Please log in again.";
  if (status === 403) {
    return "Security token missing or expired. Please refresh and try again.";
  }
  if (status === 429) return "Too many admin requests. Please wait and try again.";

  return "Candidate staging failed safely. No public write was performed.";
}

export function normalizeCandidateExtractionPreviewRouteResult(
  value: unknown,
): NormalizedCandidateExtractionPreviewRouteResult | null {
  const outer = getRecord(value);
  const data = getRecord(outer?.data ?? value);

  if (!data) return null;

  const accepted = getSafeBoolean(data.accepted) ?? false;
  const rejected = getSafeBoolean(data.rejected) ?? !accepted;
  const rejectionCode = getSafeString(data.rejectionCode, 80);
  const previewStatus = getSafeString(data.previewStatus, 40);
  const preview =
    accepted && previewStatus && SAFE_PREVIEW_STATUSES.has(previewStatus)
      ? normalizeCandidateExtractionLiveStagingPreview({
          ...(getRecord(data.preview) ?? {}),
          previewStatus,
        })
      : null;

  return {
    accepted,
    rejected,
    rejectionCode,
    previewStatus,
    preview,
    safetyFlags: getSafeStringArray(data.safetyFlags),
    auditCorrelationId: getSafeString(data.auditCorrelationId, 80),
    noPublicWriteConfirmed: getSafeBoolean(data.noPublicWriteConfirmed),
    noDiscoveredWriteConfirmed: getSafeBoolean(
      data.noDiscoveredWriteConfirmed,
    ),
  };
}

export function getCandidatePreviewForLiveStagingScaffold(
  value: unknown,
): CandidateExtractionLiveStagingPreview | null {
  const normalized = normalizeCandidateExtractionPreviewRouteResult(value);

  if (!normalized?.accepted || normalized.previewStatus !== "reviewable") {
    return null;
  }

  return normalized.preview;
}

export function isSafeLiveStagingRejectionCode(value: unknown): boolean {
  const code = getSafeString(value, 80);

  return Boolean(code && SAFE_REJECTION_CODES.has(code));
}
