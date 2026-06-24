import {
  createDiscoveryFetchHtmlAdapter,
  DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES,
  type DiscoveryFetchHtmlMetadata,
  type DiscoveryFetchHtmlPlan,
  type DiscoveryFetchHtmlResult,
  type DiscoveryFetchHtmlStatus,
} from "./discovery-bounded-html-acquisition";
import {
  deriveStaticHtmlEvidence,
  type StaticHtmlDerivedEvidenceResult,
} from "./discovery-static-html-evidence";
import type { DiscoveryRequestPlan } from "./discovery-request-plan";

export const MANUAL_STATIC_HTML_DERIVED_EVIDENCE_MAX_URLS = 3;

const ACCEPTED_CONTENT_TYPES = new Set<string>(
  DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES
);
const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,80}$/;

const ACQUISITION_FAILURE_REASONS: Record<
  Exclude<DiscoveryFetchHtmlStatus, "fetch_completed_html_acquired">,
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
  fetch_failed_empty_body: "empty_body",
};

export type ManualStaticHtmlEvidenceResult = {
  normalized_url: string;
  hostname: string;
  status:
    | "evidence_derived"
    | "acquisition_failed"
    | "evidence_empty"
    | "evidence_failed_safely";
  acquisition_status: DiscoveryFetchHtmlStatus;
  http_status: number | null;
  content_type: string | null;
  content_length_header: string | null;
  resolved_ip_family: 4 | 6 | null;
  bytes_read: number;
  response_truncated: boolean;
  duration_ms: number;
  error_code: string | null;
  failure_reason: string | null;
  extraction_status: StaticHtmlDerivedEvidenceResult["extractionStatus"] | null;
  extraction_version: StaticHtmlDerivedEvidenceResult["extractionVersion"] | null;
  evidence_attempted: boolean;
  derived_evidence: StaticHtmlDerivedEvidenceResult | null;
  raw_html_persisted: false;
};

export type ManualStaticHtmlEvidenceSummary = {
  totalUrls: number;
  attemptedUrls: number;
  acquiredUrls: number;
  evidenceAttemptedUrls: number;
  evidenceProducedUrls: number;
  failedUrls: number;
  skippedUrls: number;
  allFailed: boolean;
};

export type ManualStaticHtmlEvidenceExecution = {
  results: ManualStaticHtmlEvidenceResult[];
  summary: ManualStaticHtmlEvidenceSummary;
  raw_html_persisted: false;
  candidates_created: false;
};

type StaticHtmlEvidenceExecutorDependencies = {
  acquireHtml?: (plan: DiscoveryFetchHtmlPlan) => Promise<DiscoveryFetchHtmlResult>;
  deriveEvidence?: (input: {
    html: string;
    normalizedUrl: string;
    hostname: string;
    maxSnippetLength?: number;
    maxLinksPerType?: number;
  }) => StaticHtmlDerivedEvidenceResult;
};

function sanitizeString(value: unknown, maximum: number) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > maximum ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "";
  }

  return value;
}

function sanitizeNormalizedUrl(value: unknown) {
  const rawUrl = sanitizeString(value, 2_048);

  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "https:" || url.username || url.password) return "";

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

function sanitizeIpFamily(value: unknown): 4 | 6 | null {
  return value === 4 || value === 6 ? value : null;
}

function sanitizeNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function sanitizeErrorCode(value: unknown) {
  return typeof value === "string" && SAFE_ERROR_CODE_PATTERN.test(value) ? value : null;
}

function createFetchFields(metadata: DiscoveryFetchHtmlMetadata) {
  return {
    normalized_url: sanitizeNormalizedUrl(metadata.normalizedUrl),
    hostname: sanitizeString(metadata.hostname, 253),
    http_status: sanitizeHttpStatus(metadata.httpStatus),
    content_type: sanitizeContentType(metadata.contentType),
    content_length_header: sanitizeContentLengthHeader(metadata.contentLengthHeader),
    resolved_ip_family: sanitizeIpFamily(metadata.resolvedIpFamily),
    bytes_read: sanitizeNonNegativeInteger(metadata.bytesRead),
    response_truncated: metadata.responseTruncated === true,
    duration_ms: sanitizeNonNegativeInteger(metadata.durationMs),
    error_code: sanitizeErrorCode(metadata.errorCode),
  };
}

function createAcquisitionFailureResult(
  fetchResult: Exclude<DiscoveryFetchHtmlResult, { ok: true }>
): ManualStaticHtmlEvidenceResult {
  return {
    ...createFetchFields(fetchResult.metadata),
    status: "acquisition_failed",
    acquisition_status: fetchResult.status,
    failure_reason: ACQUISITION_FAILURE_REASONS[fetchResult.status],
    extraction_status: null,
    extraction_version: null,
    evidence_attempted: false,
    derived_evidence: null,
    raw_html_persisted: false,
  };
}

function createUnexpectedAcquisitionFailureResult(
  requestPlan: DiscoveryRequestPlan
): ManualStaticHtmlEvidenceResult {
  return {
    normalized_url: sanitizeNormalizedUrl(requestPlan.normalizedUrl),
    hostname: sanitizeString(requestPlan.hostname, 253),
    status: "acquisition_failed",
    acquisition_status: "fetch_failed_network_error",
    http_status: null,
    content_type: null,
    content_length_header: null,
    resolved_ip_family: null,
    bytes_read: 0,
    response_truncated: false,
    duration_ms: 0,
    error_code: "ACQUISITION_ERROR",
    failure_reason: "acquisition_failure",
    extraction_status: null,
    extraction_version: null,
    evidence_attempted: false,
    derived_evidence: null,
    raw_html_persisted: false,
  };
}

function deriveEvidenceFromAcquisition({
  html,
  normalizedUrl,
  hostname,
  deriveEvidence,
}: {
  html: string;
  normalizedUrl: string;
  hostname: string;
  deriveEvidence: NonNullable<StaticHtmlEvidenceExecutorDependencies["deriveEvidence"]>;
}) {
  return deriveEvidence({
    html,
    normalizedUrl,
    hostname,
    maxSnippetLength: 280,
    maxLinksPerType: 5,
  });
}

function createEvidenceResult({
  fetchResult,
  evidence,
}: {
  fetchResult: Extract<DiscoveryFetchHtmlResult, { ok: true }>;
  evidence: StaticHtmlDerivedEvidenceResult;
}): ManualStaticHtmlEvidenceResult {
  const fields = createFetchFields(fetchResult.metadata);

  if (evidence.extractionStatus === "derived") {
    return {
      ...fields,
      status: "evidence_derived",
      acquisition_status: fetchResult.status,
      failure_reason: null,
      extraction_status: evidence.extractionStatus,
      extraction_version: evidence.extractionVersion,
      evidence_attempted: true,
      derived_evidence: evidence,
      raw_html_persisted: false,
    };
  }

  return {
    ...fields,
    status:
      evidence.extractionStatus === "empty"
        ? "evidence_empty"
        : "evidence_failed_safely",
    acquisition_status: fetchResult.status,
    error_code:
      evidence.extractionStatus === "empty"
        ? "EMPTY_EVIDENCE"
        : "EVIDENCE_FAILED_CLOSED",
    failure_reason:
      evidence.extractionStatus === "empty"
        ? "empty_evidence"
        : "evidence_failed_closed",
    extraction_status: evidence.extractionStatus,
    extraction_version: evidence.extractionVersion,
    evidence_attempted: true,
    derived_evidence: null,
    raw_html_persisted: false,
  };
}

function createHelperFailureResult(
  fetchResult: Extract<DiscoveryFetchHtmlResult, { ok: true }>
): ManualStaticHtmlEvidenceResult {
  return {
    ...createFetchFields(fetchResult.metadata),
    status: "evidence_failed_safely",
    acquisition_status: fetchResult.status,
    error_code: "EVIDENCE_HELPER_FAILED",
    failure_reason: "evidence_helper_failure",
    extraction_status: null,
    extraction_version: null,
    evidence_attempted: true,
    derived_evidence: null,
    raw_html_persisted: false,
  };
}

export function createStaticHtmlEvidenceFetchPlan(
  requestPlan: DiscoveryRequestPlan
): DiscoveryFetchHtmlPlan {
  return {
    normalizedUrl: requestPlan.normalizedUrl,
    hostname: requestPlan.hostname,
    protocol: requestPlan.protocol,
    method: requestPlan.method,
    timeoutMs: requestPlan.timeoutMs,
    redirectLimit: 0,
    responseSizeLimitBytes: requestPlan.responseSizeLimitBytes,
    userAgent: requestPlan.userAgent,
    acceptedContentTypes: DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES,
    createdAt: requestPlan.createdAt,
  };
}

export function isManualStaticHtmlEvidencePlanCountAllowed(count: number) {
  return (
    Number.isInteger(count) &&
    count >= 1 &&
    count <= MANUAL_STATIC_HTML_DERIVED_EVIDENCE_MAX_URLS
  );
}

function summarizeResults(
  results: readonly ManualStaticHtmlEvidenceResult[],
  totalUrls: number,
  skippedUrls: number
): ManualStaticHtmlEvidenceSummary {
  const acquiredUrls = results.filter(
    (result) => result.acquisition_status === "fetch_completed_html_acquired"
  ).length;
  const evidenceAttemptedUrls = results.filter(
    (result) => result.evidence_attempted
  ).length;
  const evidenceProducedUrls = results.filter(
    (result) => result.status === "evidence_derived"
  ).length;

  return {
    totalUrls,
    attemptedUrls: results.length,
    acquiredUrls,
    evidenceAttemptedUrls,
    evidenceProducedUrls,
    failedUrls: results.length - evidenceProducedUrls,
    skippedUrls,
    allFailed: results.length > 0 && evidenceProducedUrls === 0,
  };
}

export function getManualStaticHtmlEvidenceTerminalState(
  summary: ManualStaticHtmlEvidenceSummary
) {
  return {
    runStatus: "completed" as const,
    executionStatus: "manual_static_html_derived_evidence_completed" as const,
    reason: summary.allFailed
      ? "manual_static_html_derived_evidence_all_failed"
      : undefined,
  };
}

export function createManualStaticHtmlEvidenceExecutor(
  dependencies: StaticHtmlEvidenceExecutorDependencies = {}
) {
  const acquireHtml = dependencies.acquireHtml || createDiscoveryFetchHtmlAdapter();
  const deriveEvidence = dependencies.deriveEvidence || deriveStaticHtmlEvidence;

  return async function executeManualStaticHtmlEvidence(
    requestPlans: readonly DiscoveryRequestPlan[]
  ): Promise<ManualStaticHtmlEvidenceExecution> {
    if (!isManualStaticHtmlEvidencePlanCountAllowed(requestPlans.length)) {
      return {
        results: [],
        summary: summarizeResults([], requestPlans.length, requestPlans.length),
        raw_html_persisted: false,
        candidates_created: false,
      };
    }

    const results: ManualStaticHtmlEvidenceResult[] = [];

    for (const requestPlan of requestPlans) {
      let fetchResult: DiscoveryFetchHtmlResult;

      try {
        fetchResult = await acquireHtml(createStaticHtmlEvidenceFetchPlan(requestPlan));
      } catch {
        results.push(createUnexpectedAcquisitionFailureResult(requestPlan));
        continue;
      }

      if (!fetchResult.ok) {
        results.push(createAcquisitionFailureResult(fetchResult));
        continue;
      }

      try {
        const evidence = deriveEvidenceFromAcquisition({
          html: fetchResult.html,
          normalizedUrl: sanitizeNormalizedUrl(fetchResult.metadata.normalizedUrl),
          hostname: sanitizeString(fetchResult.metadata.hostname, 253),
          deriveEvidence,
        });
        results.push(createEvidenceResult({ fetchResult, evidence }));
      } catch {
        results.push(createHelperFailureResult(fetchResult));
      }
    }

    return {
      results,
      summary: summarizeResults(results, requestPlans.length, 0),
      raw_html_persisted: false,
      candidates_created: false,
    };
  };
}

export const executeManualStaticHtmlEvidence =
  createManualStaticHtmlEvidenceExecutor();
