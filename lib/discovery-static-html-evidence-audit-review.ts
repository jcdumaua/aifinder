const STATIC_AUDIT_EVENT_TYPES = new Set([
  "manual_static_html_derived_evidence_started",
  "manual_static_html_derived_evidence_url_completed",
  "manual_static_html_derived_evidence_url_failed",
  "manual_static_html_derived_evidence_completed",
  "manual_static_html_derived_evidence_failed",
]);

const EVENT_LABELS = {
  manual_static_html_derived_evidence_started: "Static evidence started",
  manual_static_html_derived_evidence_url_completed: "URL evidence completed",
  manual_static_html_derived_evidence_url_failed: "URL evidence failed safely",
  manual_static_html_derived_evidence_completed: "Static evidence completed",
  manual_static_html_derived_evidence_failed: "Static evidence failed safely",
} as const;

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
  "manual_static_html_derived_evidence_requires_at_least_one_url",
  "manual_static_html_derived_evidence_url_cap_exceeded",
  "manual_static_html_derived_evidence_all_failed",
  "static_html_evidence_executor_internal_failure",
]);

const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,80}$/;
const MAX_STATIC_EVIDENCE_URLS = 3;
const MAX_STATIC_AUDIT_EVENTS = 20;

type JsonRecord = Record<string, unknown>;

export type ManualStaticHtmlEvidenceAuditEventType =
  | "manual_static_html_derived_evidence_started"
  | "manual_static_html_derived_evidence_url_completed"
  | "manual_static_html_derived_evidence_url_failed"
  | "manual_static_html_derived_evidence_completed"
  | "manual_static_html_derived_evidence_failed";

export type ManualStaticHtmlEvidenceAuditInput = {
  event_type?: unknown;
  created_at?: unknown;
  status?: unknown;
  url_index?: unknown;
  url_count?: unknown;
  total_urls?: unknown;
  acquisition_status?: unknown;
  extraction_status?: unknown;
  error_code?: unknown;
  failure_reason?: unknown;
  reason?: unknown;
  raw_html_persisted?: unknown;
  candidates_created?: unknown;
  public_tools_inserted?: unknown;
  no_public_tools_inserted?: unknown;
  llm_analysis_performed?: unknown;
  no_llm_analysis_performed?: unknown;
};

export type ManualStaticHtmlEvidenceAuditEvent = {
  eventType: ManualStaticHtmlEvidenceAuditEventType;
  label: string;
  createdAt: string;
  statusLabel: string;
  urlIndex: number | null;
  urlCount: number | null;
  acquisitionStatus: string | null;
  evidenceStatus: string | null;
  failureCode: string | null;
  failureReason: string | null;
  rawHtmlPersisted: boolean | null;
  candidatesCreated: boolean | null;
  publicToolsInserted: boolean | null;
  llmAnalysisPerformed: boolean | null;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStaticAuditEventType(
  value: unknown
): value is ManualStaticHtmlEvidenceAuditEventType {
  return typeof value === "string" && STATIC_AUDIT_EVENT_TYPES.has(value);
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string" || value.length > 64) return null;

  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) return null;

  return parsed.toISOString();
}

function normalizeBoundedUrlCount(value: unknown) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= MAX_STATIC_EVIDENCE_URLS
    ? value
    : null;
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeBooleanWithInverse(value: unknown, inverseValue: unknown) {
  const direct = normalizeBoolean(value);

  if (direct !== null) return direct;

  const inverse = normalizeBoolean(inverseValue);

  return inverse === null ? null : !inverse;
}

function normalizeAcquisitionStatus(value: unknown) {
  return typeof value === "string" && ACQUISITION_STATUSES.has(value)
    ? value
    : null;
}

function normalizeEvidenceStatus(value: unknown) {
  return typeof value === "string" && EVIDENCE_STATUSES.has(value)
    ? value
    : null;
}

function normalizeFailureCode(value: unknown) {
  return typeof value === "string" && SAFE_ERROR_CODE_PATTERN.test(value)
    ? value
    : null;
}

function normalizeFailureReason(value: unknown) {
  return typeof value === "string" && FAILURE_REASONS.has(value)
    ? value
    : null;
}

function getStatusLabel({
  eventType,
  evidenceStatus,
}: {
  eventType: ManualStaticHtmlEvidenceAuditEventType;
  evidenceStatus: string | null;
}) {
  if (eventType === "manual_static_html_derived_evidence_started") {
    return "Started";
  }

  if (eventType === "manual_static_html_derived_evidence_completed") {
    return "Completed";
  }

  if (eventType === "manual_static_html_derived_evidence_failed") {
    return "Failed safely";
  }

  if (evidenceStatus === "evidence_derived") {
    return "Evidence derived";
  }

  if (evidenceStatus === "acquisition_failed") {
    return "Acquisition failed safely";
  }

  if (evidenceStatus === "evidence_empty") {
    return "Evidence unavailable";
  }

  if (evidenceStatus === "evidence_failed_safely") {
    return "Evidence failed safely";
  }

  return eventType === "manual_static_html_derived_evidence_url_completed"
    ? "Completed safely"
    : "Failed safely";
}

function normalizeEvent(value: unknown): ManualStaticHtmlEvidenceAuditEvent | null {
  if (!isRecord(value) || !isStaticAuditEventType(value.event_type)) return null;

  const createdAt = normalizeTimestamp(value.created_at);

  if (!createdAt) return null;

  const eventType = value.event_type;
  const evidenceStatus = normalizeEvidenceStatus(value.status);

  return {
    eventType,
    label: EVENT_LABELS[eventType],
    createdAt,
    statusLabel: getStatusLabel({ eventType, evidenceStatus }),
    urlIndex: normalizeBoundedUrlCount(value.url_index),
    urlCount: normalizeBoundedUrlCount(value.url_count ?? value.total_urls),
    acquisitionStatus: normalizeAcquisitionStatus(value.acquisition_status),
    evidenceStatus,
    failureCode: normalizeFailureCode(value.error_code),
    failureReason: normalizeFailureReason(value.failure_reason ?? value.reason),
    rawHtmlPersisted: normalizeBoolean(value.raw_html_persisted),
    candidatesCreated: normalizeBoolean(value.candidates_created),
    publicToolsInserted: normalizeBooleanWithInverse(
      value.public_tools_inserted,
      value.no_public_tools_inserted
    ),
    llmAnalysisPerformed: normalizeBooleanWithInverse(
      value.llm_analysis_performed,
      value.no_llm_analysis_performed
    ),
  };
}

export function normalizeManualStaticHtmlEvidenceAuditEvents(
  value: unknown
): ManualStaticHtmlEvidenceAuditEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeEvent)
    .filter((event): event is ManualStaticHtmlEvidenceAuditEvent => Boolean(event))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(0, MAX_STATIC_AUDIT_EVENTS);
}
