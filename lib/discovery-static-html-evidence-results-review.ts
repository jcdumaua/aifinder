const MANUAL_STATIC_HTML_EVIDENCE_EXECUTION_MODE =
  "manual_static_html_derived_evidence";

const EXECUTION_STATUSES = new Set([
  "manual_static_html_derived_evidence_claimed",
  "manual_static_html_derived_evidence_completed",
  "manual_static_html_derived_evidence_failed",
]);

const EVIDENCE_STATUSES = new Set([
  "evidence_derived",
  "acquisition_failed",
  "evidence_empty",
  "evidence_failed_safely",
]);

const ACQUISITION_STATUSES = new Set([
  "fetch_completed_html_acquired",
  "fetch_failed_invalid_plan",
  "fetch_failed_dns_resolution",
  "fetch_failed_blocked_resolved_ip",
  "fetch_failed_timeout",
  "fetch_failed_response_too_large",
  "fetch_failed_network_error",
  "fetch_failed_unsupported_content_type",
  "fetch_redirect_not_followed",
  "fetch_failed_tls_error",
  "fetch_failed_empty_body",
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
  "empty_body",
  "acquisition_failure",
  "empty_evidence",
  "evidence_failed_closed",
  "evidence_helper_failure",
]);

const EXTRACTION_STATUSES = new Set(["derived", "empty", "failed_closed"]);
const SAFETY_FLAGS = new Set([
  "html_empty",
  "html_truncated",
  "malformed_html_possible",
  "no_title_found",
  "no_visible_text_found",
  "extraction_failed_closed",
]);
const CATEGORY_HINTS = new Set([
  "chat",
  "image",
  "video",
  "voice",
  "writing",
  "coding",
  "marketing",
  "seo",
  "design",
  "productivity",
  "education",
  "business",
  "agents",
]);
const AI_TOOL_RELEVANCE_HINTS = new Set([
  "ai",
  "artificial_intelligence",
  "llm",
  "agent",
  "automation",
  "generate",
  "copilot",
  "chatbot",
]);

const SAFE_HOSTNAME_PATTERN = /^[a-z0-9.-]{1,253}$/i;
const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,80}$/;
const MAX_URLS_PER_REVIEW = 3;
const MAX_BYTES_READ = 1_000_000;
const MAX_DURATION_MS = 60_000;
const MAX_LINKS_PER_TYPE = 5;
const MAX_HINTS_PER_TYPE = 8;

type JsonRecord = Record<string, unknown>;

export type ManualStaticHtmlEvidenceReview = {
  executorMode: "manual_static_html_derived_evidence";
  executionStatus: string | null;
  counts: {
    totalUrls: number;
    attemptedUrls: number;
    acquiredUrls: number;
    evidenceAttemptedUrls: number;
    evidenceProducedUrls: number;
    failedUrls: number;
    skippedUrls: number;
    allFailed: boolean | null;
  };
  flags: {
    noFetchPerformed: boolean | null;
    noExtractionPerformed: boolean | null;
    noLlmAnalysisPerformed: boolean | null;
    noCandidatesInserted: boolean | null;
    noPublicToolsInserted: boolean | null;
    rawHtmlPersisted: boolean | null;
    candidatesCreated: boolean | null;
    dryRun: boolean | null;
    executionEnabled: boolean | null;
  };
  evidenceResults: ManualStaticHtmlEvidenceUrlResult[];
};

export type ManualStaticHtmlEvidenceUrlResult = {
  normalizedUrl: string | null;
  hostname: string | null;
  status: string;
  acquisitionStatus: string | null;
  httpStatus: number | null;
  contentType: "text/html" | null;
  contentLengthHeader: string | null;
  resolvedIpFamily: 4 | 6 | null;
  bytesRead: number | null;
  responseTruncated: boolean | null;
  durationMs: number | null;
  errorCode: string | null;
  failureReason: string | null;
  extractionStatus: string | null;
  extractionVersion: "1" | null;
  evidenceAttempted: boolean | null;
  derivedEvidence: ManualStaticHtmlDerivedEvidence | null;
};

export type ManualStaticHtmlDerivedEvidence = {
  title: string | null;
  metaDescription: string | null;
  openGraphTitle: string | null;
  openGraphDescription: string | null;
  canonicalUrl: string | null;
  homepageHeadlineSnippet: string | null;
  visibleTextSnippet: string | null;
  appStoreLinks: string[];
  pricingLinks: string[];
  contactLinks: string[];
  docsLinks: string[];
  productNameHint: string | null;
  companyNameHint: string | null;
  categoryHints: string[];
  aiToolRelevanceHints: string[];
  confidenceLabel: "tentative";
  truncated: boolean | null;
  safetyFlags: string[];
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBoundedCount(value: unknown, maximum = MAX_URLS_PER_REVIEW) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum
    ? value
    : 0;
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeSafeText(value: unknown, maximum: number) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum ||
    /[\u0000-\u001F\u007F<>]/.test(value)
  ) {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized || null;
}

function normalizeHostname(value: unknown) {
  return typeof value === "string" && SAFE_HOSTNAME_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

function normalizeHttpsUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2_048) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.username || url.password) return null;

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

function normalizeContentLengthHeader(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,7}$/.test(value)) return null;

  return Number(value) <= MAX_BYTES_READ ? value : null;
}

function normalizeBytesRead(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= MAX_BYTES_READ
    ? value
    : null;
}

function normalizeDuration(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= MAX_DURATION_MS
    ? value
    : null;
}

function normalizeArray(value: unknown, maximum: number, allowed: Set<string>) {
  if (!Array.isArray(value)) return [];

  const values: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item) || seen.has(item)) continue;

    seen.add(item);
    values.push(item);
    if (values.length >= maximum) break;
  }

  return values;
}

function normalizeLinks(value: unknown) {
  if (!Array.isArray(value)) return [];

  const links: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const link = normalizeHttpsUrl(item);
    if (!link || seen.has(link)) continue;

    seen.add(link);
    links.push(link);
    if (links.length >= MAX_LINKS_PER_TYPE) break;
  }

  return links;
}

function normalizeDerivedEvidence(value: unknown): ManualStaticHtmlDerivedEvidence | null {
  if (!isRecord(value)) return null;
  if (value.extractionStatus !== "derived" || value.extractionVersion !== "1") return null;
  if (value.confidenceLabel !== "tentative") return null;

  return {
    title: normalizeSafeText(value.title, 160),
    metaDescription: normalizeSafeText(value.metaDescription, 320),
    openGraphTitle: normalizeSafeText(value.openGraphTitle, 160),
    openGraphDescription: normalizeSafeText(value.openGraphDescription, 320),
    canonicalUrl: normalizeHttpsUrl(value.canonicalUrl),
    homepageHeadlineSnippet: normalizeSafeText(value.homepageHeadlineSnippet, 280),
    visibleTextSnippet: normalizeSafeText(value.visibleTextSnippet, 280),
    appStoreLinks: normalizeLinks(value.appStoreLinks),
    pricingLinks: normalizeLinks(value.pricingLinks),
    contactLinks: normalizeLinks(value.contactLinks),
    docsLinks: normalizeLinks(value.docsLinks),
    productNameHint: normalizeSafeText(value.productNameHint, 160),
    companyNameHint: normalizeSafeText(value.companyNameHint, 160),
    categoryHints: normalizeArray(value.categoryHints, MAX_HINTS_PER_TYPE, CATEGORY_HINTS),
    aiToolRelevanceHints: normalizeArray(
      value.aiToolRelevanceHints,
      MAX_HINTS_PER_TYPE,
      AI_TOOL_RELEVANCE_HINTS
    ),
    confidenceLabel: "tentative",
    truncated: normalizeBoolean(value.truncated),
    safetyFlags: normalizeArray(value.safetyFlags, MAX_HINTS_PER_TYPE, SAFETY_FLAGS),
  };
}

function normalizeEvidenceResult(value: unknown): ManualStaticHtmlEvidenceUrlResult | null {
  if (!isRecord(value) || typeof value.status !== "string" || !EVIDENCE_STATUSES.has(value.status)) {
    return null;
  }

  const extractionStatus =
    typeof value.extraction_status === "string" && EXTRACTION_STATUSES.has(value.extraction_status)
      ? value.extraction_status
      : null;

  return {
    normalizedUrl: normalizeHttpsUrl(value.normalized_url),
    hostname: normalizeHostname(value.hostname),
    status: value.status,
    acquisitionStatus:
      typeof value.acquisition_status === "string" && ACQUISITION_STATUSES.has(value.acquisition_status)
        ? value.acquisition_status
        : null,
    httpStatus: normalizeHttpStatus(value.http_status),
    contentType: value.content_type === "text/html" ? "text/html" : null,
    contentLengthHeader: normalizeContentLengthHeader(value.content_length_header),
    resolvedIpFamily: value.resolved_ip_family === 4 || value.resolved_ip_family === 6
      ? value.resolved_ip_family
      : null,
    bytesRead: normalizeBytesRead(value.bytes_read),
    responseTruncated: normalizeBoolean(value.response_truncated),
    durationMs: normalizeDuration(value.duration_ms),
    errorCode:
      typeof value.error_code === "string" && SAFE_ERROR_CODE_PATTERN.test(value.error_code)
        ? value.error_code
        : null,
    failureReason:
      typeof value.failure_reason === "string" && FAILURE_REASONS.has(value.failure_reason)
        ? value.failure_reason
        : null,
    extractionStatus,
    extractionVersion: value.extraction_version === "1" ? "1" : null,
    evidenceAttempted: normalizeBoolean(value.evidence_attempted),
    derivedEvidence:
      value.status === "evidence_derived" && extractionStatus === "derived"
        ? normalizeDerivedEvidence(value.derived_evidence)
        : null,
  };
}

export function normalizeManualStaticHtmlEvidenceStats(
  value: unknown
): ManualStaticHtmlEvidenceReview | null {
  if (!isRecord(value) || value.executor_mode !== MANUAL_STATIC_HTML_EVIDENCE_EXECUTION_MODE) {
    return null;
  }

  const rawEvidenceResults = Array.isArray(value.evidence_results)
    ? value.evidence_results.slice(0, MAX_URLS_PER_REVIEW)
    : [];
  const evidenceResults = rawEvidenceResults
    .map(normalizeEvidenceResult)
    .filter((result): result is ManualStaticHtmlEvidenceUrlResult => Boolean(result));

  return {
    executorMode: MANUAL_STATIC_HTML_EVIDENCE_EXECUTION_MODE,
    executionStatus:
      typeof value.execution_status === "string" && EXECUTION_STATUSES.has(value.execution_status)
        ? value.execution_status
        : null,
    counts: {
      totalUrls: normalizeBoundedCount(value.total_urls),
      attemptedUrls: normalizeBoundedCount(value.attempted_urls),
      acquiredUrls: normalizeBoundedCount(value.acquired_urls),
      evidenceAttemptedUrls: normalizeBoundedCount(value.evidence_attempted_urls),
      evidenceProducedUrls: normalizeBoundedCount(value.evidence_produced_urls),
      failedUrls: normalizeBoundedCount(value.failed_urls),
      skippedUrls: normalizeBoundedCount(value.skipped_urls),
      allFailed: normalizeBoolean(value.all_failed),
    },
    flags: {
      noFetchPerformed: normalizeBoolean(value.no_fetch_performed),
      noExtractionPerformed: normalizeBoolean(value.no_extraction_performed),
      noLlmAnalysisPerformed: normalizeBoolean(value.no_llm_analysis_performed),
      noCandidatesInserted: normalizeBoolean(value.no_candidates_inserted),
      noPublicToolsInserted: normalizeBoolean(value.no_public_tools_inserted),
      rawHtmlPersisted: normalizeBoolean(value.raw_html_persisted),
      candidatesCreated: normalizeBoolean(value.candidates_created),
      dryRun: normalizeBoolean(value.dry_run),
      executionEnabled: normalizeBoolean(value.execution_enabled),
    },
    evidenceResults,
  };
}
