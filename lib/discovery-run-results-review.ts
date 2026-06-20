const MANUAL_METADATA_FETCH_EXECUTION_MODE = "manual_metadata_fetch";

const FETCH_STATUSES = new Set([
  "fetch_completed_metadata_only",
  "fetch_failed_invalid_plan",
  "fetch_failed_dns_resolution",
  "fetch_failed_blocked_resolved_ip",
  "fetch_failed_timeout",
  "fetch_failed_response_too_large",
  "fetch_failed_network_error",
  "fetch_failed_unsupported_content_type",
  "fetch_redirect_not_followed",
  "fetch_failed_tls_error",
]);

const FAILURE_REASONS = new Set([
  "invalid_plan",
  "dns_resolution_failed",
  "blocked_resolved_ip",
  "request_timeout",
  "response_too_large",
  "network_error",
  "unsupported_content_type",
  "redirect_not_allowed",
  "tls_error",
  "adapter_failure",
]);

const MANUAL_METADATA_FETCH_AUDIT_EVENT_TYPES = new Set([
  "manual_metadata_fetch_started",
  "manual_metadata_fetch_url_completed",
  "manual_metadata_fetch_url_failed",
  "manual_metadata_fetch_completed",
  "manual_metadata_fetch_failed",
]);

const ACCEPTED_CONTENT_TYPES = new Set([
  "text/html",
  "text/plain",
  "application/xhtml+xml",
]);

const SAFE_EXECUTION_STATUS_PATTERN = /^[a-z0-9_]{1,80}$/;
const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,80}$/;
const SAFE_HOSTNAME_PATTERN = /^[a-z0-9.-]{1,253}$/i;

type JsonRecord = Record<string, unknown>;

export type ManualMetadataFetchReview = {
  executorMode: "manual_metadata_fetch";
  executionStatus: string | null;
  counts: {
    totalUrls: number;
    processedUrls: number;
    fetchedUrls: number;
    failedUrls: number;
    skippedUrls: number;
  };
  flags: {
    noFetchPerformed: boolean | null;
    noExtractionPerformed: boolean | null;
    noLlmAnalysisPerformed: boolean | null;
    noCandidatesInserted: boolean | null;
    noPublicToolsInserted: boolean | null;
    dryRun: boolean | null;
    executionEnabled: boolean | null;
  };
  fetchResults: ManualMetadataFetchUrlResult[];
};

export type ManualMetadataFetchUrlResult = {
  hostname: string | null;
  normalizedUrl: string | null;
  status: string | null;
  httpStatus: number | null;
  contentType: string | null;
  contentLengthHeader: string | null;
  resolvedIpFamily: 4 | 6 | null;
  bytesRead: number | null;
  responseTruncated: boolean | null;
  durationMs: number | null;
  errorCode: string | null;
  failureReason: string | null;
};

export type ManualMetadataFetchAuditEvent = {
  eventType: string;
  message: string;
  createdAt: string | null;
  status: string | null;
  hostname: string | null;
  errorCode: string | null;
  failureReason: string | null;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeSafeString(value: unknown, pattern: RegExp) {
  return typeof value === "string" && pattern.test(value) ? value : null;
}

function normalizeHostname(value: unknown) {
  return typeof value === "string" && SAFE_HOSTNAME_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2_048) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.username || url.password) {
      return null;
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeHttpStatus(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : null;
}

function normalizeNullableCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function normalizeContentType(value: unknown) {
  return typeof value === "string" && ACCEPTED_CONTENT_TYPES.has(value) ? value : null;
}

function normalizeContentLengthHeader(value: unknown) {
  return typeof value === "string" && /^\d{1,16}$/.test(value) ? value : null;
}

function normalizeFetchResult(value: unknown): ManualMetadataFetchUrlResult | null {
  if (!isRecord(value)) return null;

  const status =
    typeof value.status === "string" && FETCH_STATUSES.has(value.status)
      ? value.status
      : null;

  if (!status) return null;

  return {
    hostname: normalizeHostname(value.hostname),
    normalizedUrl: normalizeUrl(value.normalized_url),
    status,
    httpStatus: normalizeHttpStatus(value.http_status),
    contentType: normalizeContentType(value.content_type),
    contentLengthHeader: normalizeContentLengthHeader(value.content_length_header),
    resolvedIpFamily: value.resolved_ip_family === 4 || value.resolved_ip_family === 6
      ? value.resolved_ip_family
      : null,
    bytesRead: normalizeNullableCount(value.bytes_read),
    responseTruncated: normalizeBoolean(value.response_truncated),
    durationMs: normalizeNullableCount(value.duration_ms),
    errorCode: normalizeSafeString(value.error_code, SAFE_ERROR_CODE_PATTERN),
    failureReason:
      typeof value.failure_reason === "string" && FAILURE_REASONS.has(value.failure_reason)
        ? value.failure_reason
        : null,
  };
}

export function normalizeManualMetadataFetchStats(
  value: unknown
): ManualMetadataFetchReview | null {
  if (!isRecord(value) || value.executor_mode !== MANUAL_METADATA_FETCH_EXECUTION_MODE) {
    return null;
  }

  const rawFetchResults = Array.isArray(value.fetch_results) ? value.fetch_results : [];
  const fetchResults = rawFetchResults
    .map(normalizeFetchResult)
    .filter((fetchResult): fetchResult is ManualMetadataFetchUrlResult => Boolean(fetchResult));

  return {
    executorMode: MANUAL_METADATA_FETCH_EXECUTION_MODE,
    executionStatus: normalizeSafeString(value.execution_status, SAFE_EXECUTION_STATUS_PATTERN),
    counts: {
      totalUrls: normalizeCount(value.total_urls),
      processedUrls: normalizeCount(value.processed_urls),
      fetchedUrls: normalizeCount(value.fetched_urls),
      failedUrls: normalizeCount(value.failed_urls),
      skippedUrls: normalizeCount(value.skipped_urls),
    },
    flags: {
      noFetchPerformed: normalizeBoolean(value.no_fetch_performed),
      noExtractionPerformed: normalizeBoolean(value.no_extraction_performed),
      noLlmAnalysisPerformed: normalizeBoolean(value.no_llm_analysis_performed),
      noCandidatesInserted: normalizeBoolean(value.no_candidates_inserted),
      noPublicToolsInserted: normalizeBoolean(value.no_public_tools_inserted),
      dryRun: normalizeBoolean(value.dry_run),
      executionEnabled: normalizeBoolean(value.execution_enabled),
    },
    fetchResults,
  };
}

function normalizeAuditMessage(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 180
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim()
    : "Metadata fetch event recorded.";
}

function normalizeCreatedAt(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

export function normalizeManualMetadataFetchAuditEvents(
  value: unknown
): ManualMetadataFetchAuditEvent[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((event) => {
    if (!isRecord(event) || typeof event.event_type !== "string") return [];
    if (!MANUAL_METADATA_FETCH_AUDIT_EVENT_TYPES.has(event.event_type)) return [];

    const status =
      typeof event.status === "string" && FETCH_STATUSES.has(event.status)
        ? event.status
        : null;
    const failureReason =
      typeof event.failure_reason === "string" && FAILURE_REASONS.has(event.failure_reason)
        ? event.failure_reason
        : null;

    return [
      {
        eventType: event.event_type,
        message: normalizeAuditMessage(event.message),
        createdAt: normalizeCreatedAt(event.created_at),
        status,
        hostname: normalizeHostname(event.hostname),
        errorCode: normalizeSafeString(event.error_code, SAFE_ERROR_CODE_PATTERN),
        failureReason,
      },
    ];
  });
}
