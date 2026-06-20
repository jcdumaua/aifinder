import {
  DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES,
  type DiscoveryFetchResult,
  type DiscoveryFetchStatus,
} from "./discovery-fetch-adapter";

const ACCEPTED_CONTENT_TYPES = new Set<string>(DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES);
const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,80}$/;

const FAILURE_REASONS: Record<
  Exclude<DiscoveryFetchStatus, "fetch_completed_metadata_only">,
  string
> = {
  fetch_failed_invalid_plan: "invalid_plan",
  fetch_failed_dns_resolution: "dns_resolution_failed",
  fetch_failed_blocked_resolved_ip: "blocked_resolved_ip",
  fetch_failed_timeout: "request_timeout",
  fetch_failed_response_too_large: "response_too_large",
  fetch_failed_network_error: "network_error",
  fetch_failed_unsupported_content_type: "unsupported_content_type",
  fetch_redirect_not_followed: "redirect_not_allowed",
  fetch_failed_tls_error: "tls_error",
};

export type ManualMetadataFetchResult = {
  normalized_url: string;
  hostname: string;
  status: DiscoveryFetchStatus;
  http_status: number | null;
  content_type: string | null;
  content_length_header: string | null;
  resolved_ip_family: 4 | 6 | null;
  bytes_read: number;
  response_truncated: boolean;
  duration_ms: number;
  error_code: string | null;
  failure_reason: string | null;
};

export type ManualMetadataFetchSummary = {
  totalUrls: number;
  fetchedUrls: number;
  failedUrls: number;
  skippedUrls: number;
};

function sanitizeString(value: unknown, maxLength: number) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > maxLength ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "";
  }

  return value;
}

function sanitizeNormalizedUrl(value: unknown) {
  const rawUrl = sanitizeString(value, 2_048);

  if (!rawUrl) {
    return "";
  }

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "https:" || url.username || url.password) {
      return "";
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function sanitizeHttpStatus(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : null;
}

function sanitizeContentType(value: unknown) {
  return typeof value === "string" && ACCEPTED_CONTENT_TYPES.has(value) ? value : null;
}

function sanitizeContentLengthHeader(value: unknown) {
  return typeof value === "string" && /^\d{1,16}$/.test(value) ? value : null;
}

function sanitizeIpFamily(value: unknown) {
  return value === 4 || value === 6 ? value : null;
}

function sanitizeNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function sanitizeErrorCode(value: unknown) {
  return typeof value === "string" && SAFE_ERROR_CODE_PATTERN.test(value) ? value : null;
}

export function createManualMetadataFetchResult(
  fetchResult: DiscoveryFetchResult
): ManualMetadataFetchResult {
  const metadata = fetchResult.metadata;

  return {
    normalized_url: sanitizeNormalizedUrl(metadata.normalizedUrl),
    hostname: sanitizeString(metadata.hostname, 253),
    status: fetchResult.status,
    http_status: sanitizeHttpStatus(metadata.httpStatus),
    content_type: sanitizeContentType(metadata.contentType),
    content_length_header: sanitizeContentLengthHeader(metadata.contentLengthHeader),
    resolved_ip_family: sanitizeIpFamily(metadata.resolvedIpFamily),
    bytes_read: sanitizeNonNegativeInteger(metadata.bytesRead),
    response_truncated: metadata.responseTruncated === true,
    duration_ms: sanitizeNonNegativeInteger(metadata.durationMs),
    error_code: sanitizeErrorCode(metadata.errorCode),
    failure_reason: fetchResult.ok ? null : FAILURE_REASONS[fetchResult.status],
  };
}

export function createManualMetadataFetchAdapterFailureResult({
  normalizedUrl,
  hostname,
}: {
  normalizedUrl: string;
  hostname: string;
}): ManualMetadataFetchResult {
  return {
    normalized_url: sanitizeNormalizedUrl(normalizedUrl),
    hostname: sanitizeString(hostname, 253),
    status: "fetch_failed_network_error",
    http_status: null,
    content_type: null,
    content_length_header: null,
    resolved_ip_family: null,
    bytes_read: 0,
    response_truncated: false,
    duration_ms: 0,
    error_code: "ADAPTER_ERROR",
    failure_reason: "adapter_failure",
  };
}

export function summarizeManualMetadataFetchResults(
  fetchResults: readonly ManualMetadataFetchResult[]
): ManualMetadataFetchSummary {
  const fetchedUrls = fetchResults.filter(
    (fetchResult) => fetchResult.status === "fetch_completed_metadata_only"
  ).length;

  return {
    totalUrls: fetchResults.length,
    fetchedUrls,
    failedUrls: fetchResults.length - fetchedUrls,
    skippedUrls: 0,
  };
}
