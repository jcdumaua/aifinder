import { TOOL_CATEGORIES, type ToolCategory } from "./tool-categories";

export const CANDIDATE_STATUS_VALUES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
  "rejected",
  "archived",
] as const;

export const CANDIDATE_CONFIDENCE_BUCKETS = ["low", "medium", "high"] as const;

export type DiscoveryCandidateStatus = (typeof CANDIDATE_STATUS_VALUES)[number];
export type DiscoveryCandidateConfidenceBucket = (typeof CANDIDATE_CONFIDENCE_BUCKETS)[number];

export type DiscoveryCandidatePricingHint = "Free + Paid" | "Free" | "Paid";

export type DiscoveryCandidateDuplicateCheckStatus =
  | "not_checked"
  | "pending"
  | "suspected"
  | "blocked"
  | "cleared";

export type DiscoveryCandidateRejectionCode =
  | "missing_discovery_run_id"
  | "missing_source_url"
  | "missing_name"
  | "missing_website_url"
  | "invalid_url"
  | "non_https_url"
  | "unsafe_domain"
  | "field_too_long"
  | "unsafe_content"
  | "unsupported_category_hint"
  | "unsupported_pricing_hint"
  | "unsupported_confidence_bucket"
  | "invalid_audit_correlation_id"
  | "normalization_failed";

export type SafeNormalizerWarning =
  | "duplicate_advisory_present"
  | "optional_value_dropped"
  | "tracking_parameters_removed";

export type DiscoveryCandidateNormalizerInput = {
  discovery_run_id?: unknown;
  source_url?: unknown;
  source_evidence_locator?: unknown;
  extraction_version?: unknown;
  candidate_name?: unknown;
  candidate_website_url?: unknown;
  candidate_description?: unknown;
  candidate_category_hint?: unknown;
  candidate_pricing_hint?: unknown;
  candidate_platform_hints?: unknown;
  candidate_social_links?: unknown;
  candidate_app_links?: unknown;
  evidence_summary?: unknown;
  confidence_bucket?: unknown;
  risk_flags?: unknown;
  duplicate_check_status?: unknown;
  duplicate_signal_types?: unknown;
  duplicate_blocking?: unknown;
  possible_duplicate_tool_id?: unknown;
  possible_duplicate_discovered_tool_id?: unknown;
  possible_duplicate_candidate_id?: unknown;
  audit_correlation_id?: unknown;
  [key: string]: unknown;
};

export type SafeDiscoveryCandidateToolInsert = {
  discovery_run_id: string;
  source_url: string;
  source_url_normalized: string;
  source_domain: string;
  source_evidence_kind: "static_html_derived_evidence";
  source_evidence_locator: string | null;
  extraction_mode: "deterministic_static_evidence";
  extraction_version: string;
  candidate_name: string;
  candidate_website_url: string;
  candidate_canonical_url: string;
  candidate_normalized_domain: string;
  candidate_description: string | null;
  candidate_category_hint: ToolCategory | null;
  candidate_pricing_hint: DiscoveryCandidatePricingHint | null;
  candidate_platform_hints: string[];
  candidate_social_links: string[];
  candidate_app_links: string[];
  evidence_summary: string | null;
  confidence_bucket: DiscoveryCandidateConfidenceBucket | null;
  risk_flags: string[];
  duplicate_check_status: DiscoveryCandidateDuplicateCheckStatus;
  duplicate_signal_types: string[];
  duplicate_blocking: boolean;
  possible_duplicate_tool_id: number | null;
  possible_duplicate_discovered_tool_id: string | null;
  possible_duplicate_candidate_id: string | null;
  duplicate_checked_at: null;
  candidate_status: "staged";
  reviewed_at: null;
  reviewed_by: null;
  review_notes: null;
  rejection_reason_code: null;
  audit_correlation_id?: string;
  cleanup_status: "active";
  eligible_for_cleanup_at: null;
  archived_at: null;
};

export type DiscoveryCandidateNormalizerResult =
  | {
      ok: true;
      candidate: SafeDiscoveryCandidateToolInsert;
      warnings: SafeNormalizerWarning[];
    }
  | {
      ok: false;
      rejection_code: DiscoveryCandidateRejectionCode;
      warnings: SafeNormalizerWarning[];
    };

type NormalizedTextResult =
  | { ok: true; value: string | null }
  | { ok: false; code: DiscoveryCandidateRejectionCode };

type NormalizedUrlResult =
  | { ok: true; url: string; domain: string; trackingRemoved: boolean }
  | { ok: false; code: DiscoveryCandidateRejectionCode };

type NormalizedValueResult<T> =
  | { ok: true; value: T | null }
  | { ok: false; code: DiscoveryCandidateRejectionCode };

const DEFAULT_EXTRACTION_VERSION = "candidate_normalizer_v1";
const SOURCE_EVIDENCE_KIND = "static_html_derived_evidence" as const;
const EXTRACTION_MODE = "deterministic_static_evidence" as const;

const MAX_URL_LENGTH = 2048;
const MAX_DOMAIN_LENGTH = 255;
const MAX_NAME_LENGTH = 160;
const MAX_SHORT_TEXT_LENGTH = 80;
const MAX_LOCATOR_LENGTH = 160;
const MAX_LONG_TEXT_LENGTH = 1000;
const MAX_ARRAY_ITEMS = 12;
const MAX_FLAG_ITEMS = 16;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRICING_HINTS = ["Free + Paid", "Free", "Paid"] as const;

const DUPLICATE_CHECK_STATUSES = [
  "not_checked",
  "pending",
  "suspected",
  "blocked",
  "cleared",
] as const satisfies readonly DiscoveryCandidateDuplicateCheckStatus[];

const TRACKING_QUERY_PREFIXES = ["utm_"];
const TRACKING_QUERY_NAMES = new Set(["fbclid", "gclid", "mc_cid", "mc_eid"]);

function reject(
  code: DiscoveryCandidateRejectionCode,
  warnings: SafeNormalizerWarning[] = [],
): DiscoveryCandidateNormalizerResult {
  return {
    ok: false,
    rejection_code: code,
    warnings,
  };
}

function isRecord(value: unknown): value is DiscoveryCandidateNormalizerInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

function normalizeRequiredUuid(value: unknown): string | null {
  if (!isUuid(value)) return null;
  return value.trim().toLowerCase();
}

function normalizeOptionalUuid(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (!isUuid(value)) return null;
  return value.trim().toLowerCase();
}

function collapseText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasUnsafeText(value: string): boolean {
  const trimmed = value.trim();

  if (/<\s*\/?\s*[a-z][^>]*>/i.test(trimmed)) return true;
  if (/\bon[a-z]+\s*=/i.test(trimmed)) return true;
  if (/^\s*[\[{][\s\S]*[\]}]\s*$/.test(trimmed) && /["']?\w+["']?\s*:/.test(trimmed)) {
    return true;
  }
  if (/(^|\n)\s*at\s+\S+|\bError:\s+/i.test(trimmed)) return true;
  if (/\b(?:Cookie|Set-Cookie|Authorization)\s*:/i.test(trimmed)) return true;
  if (/\b(?:api[_-]?key|access[_-]?token|service[_-]?role|secret)\s*[:=]/i.test(trimmed)) {
    return true;
  }
  if (/\bsk-[a-z0-9]{16,}\b/i.test(trimmed)) return true;
  if (/\bignore\s+previous\s+instructions\b/i.test(trimmed)) return true;

  return false;
}

function normalizeSafeText(
  value: unknown,
  options: {
    maxLength: number;
    required?: boolean;
    missingCode?: DiscoveryCandidateRejectionCode;
  },
): NormalizedTextResult {
  if (value === undefined || value === null || value === "") {
    if (options.required) return { ok: false, code: options.missingCode ?? "normalization_failed" };
    return { ok: true, value: null };
  }

  if (typeof value !== "string") return { ok: false, code: "unsafe_content" };

  const normalized = collapseText(value);

  if (!normalized) {
    if (options.required) return { ok: false, code: options.missingCode ?? "normalization_failed" };
    return { ok: true, value: null };
  }

  if (normalized.length > options.maxLength) return { ok: false, code: "field_too_long" };
  if (hasUnsafeText(normalized)) return { ok: false, code: "unsafe_content" };

  return { ok: true, value: normalized };
}

function normalizeRequiredText(
  value: unknown,
  maxLength: number,
  missingCode: DiscoveryCandidateRejectionCode,
): { ok: true; value: string } | { ok: false; code: DiscoveryCandidateRejectionCode } {
  const normalized = normalizeSafeText(value, {
    maxLength,
    required: true,
    missingCode,
  });

  if (!normalized.ok) return normalized;
  if (normalized.value === null) return { ok: false, code: missingCode };

  return { ok: true, value: normalized.value };
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
): NormalizedTextResult {
  return normalizeSafeText(value, {
    maxLength,
    required: false,
  });
}

function isTrackingQueryName(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    TRACKING_QUERY_NAMES.has(normalized) ||
    TRACKING_QUERY_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".");

  if (parts.length !== 4) return false;

  const numbers = parts.map((part) => Number(part));

  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = numbers;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isUnsafeDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (!normalized) return true;
  if (normalized.length > MAX_DOMAIN_LENGTH) return true;
  if (normalized === "localhost") return true;
  if (normalized.includes(":")) return true;
  if (!normalized.includes(".")) return true;
  if (normalized.endsWith(".local")) return true;
  if (normalized.endsWith(".internal")) return true;
  if (normalized.endsWith(".lan")) return true;
  if (normalized.endsWith(".test")) return true;

  return isPrivateIpv4(normalized);
}

function normalizeHttpsUrl(value: unknown): NormalizedUrlResult {
  if (typeof value !== "string") return { ok: false, code: "invalid_url" };

  const trimmed = collapseText(value);

  if (!trimmed) return { ok: false, code: "invalid_url" };
  if (trimmed.length > MAX_URL_LENGTH) return { ok: false, code: "field_too_long" };

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, code: "invalid_url" };
  }

  if (parsed.protocol === "http:") return { ok: false, code: "non_https_url" };
  if (parsed.protocol !== "https:") return { ok: false, code: "invalid_url" };
  if (parsed.username || parsed.password) return { ok: false, code: "invalid_url" };

  const domain = parsed.hostname.toLowerCase().replace(/\.$/, "");

  if (isUnsafeDomain(domain)) return { ok: false, code: "unsafe_domain" };

  parsed.hostname = domain;
  parsed.hash = "";

  if (parsed.port === "443") parsed.port = "";

  const removedKeys: string[] = [];

  parsed.searchParams.forEach((_value, key) => {
    if (isTrackingQueryName(key)) removedKeys.push(key);
  });

  for (const key of removedKeys) {
    parsed.searchParams.delete(key);
  }

  const normalizedUrl = parsed.toString();

  if (normalizedUrl.length > MAX_URL_LENGTH) return { ok: false, code: "field_too_long" };

  return {
    ok: true,
    url: normalizedUrl,
    domain,
    trackingRemoved: removedKeys.length > 0,
  };
}

function normalizeCategory(value: unknown): NormalizedValueResult<ToolCategory> {
  const normalized = normalizeOptionalText(value, MAX_SHORT_TEXT_LENGTH);

  if (!normalized.ok) return { ok: false, code: normalized.code };
  if (normalized.value === null) return { ok: true, value: null };

  if (!TOOL_CATEGORIES.some((category) => category === normalized.value)) {
    return { ok: false, code: "unsupported_category_hint" };
  }

  return { ok: true, value: normalized.value as ToolCategory };
}

function normalizePricing(value: unknown): NormalizedValueResult<DiscoveryCandidatePricingHint> {
  const normalized = normalizeOptionalText(value, MAX_SHORT_TEXT_LENGTH);

  if (!normalized.ok) return { ok: false, code: normalized.code };
  if (normalized.value === null) return { ok: true, value: null };

  if (!PRICING_HINTS.some((hint) => hint === normalized.value)) {
    return { ok: false, code: "unsupported_pricing_hint" };
  }

  return { ok: true, value: normalized.value as DiscoveryCandidatePricingHint };
}

function normalizeConfidence(
  value: unknown,
): NormalizedValueResult<DiscoveryCandidateConfidenceBucket> {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, code: "unsupported_confidence_bucket" };

  const normalized = collapseText(value).toLowerCase();

  if (!CANDIDATE_CONFIDENCE_BUCKETS.some((bucket) => bucket === normalized)) {
    return { ok: false, code: "unsupported_confidence_bucket" };
  }

  return { ok: true, value: normalized as DiscoveryCandidateConfidenceBucket };
}

function normalizeStringArray(
  value: unknown,
  options: { maxItems: number; maxItemLength: number },
): { ok: true; values: string[] } | { ok: false; code: DiscoveryCandidateRejectionCode } {
  if (value === undefined || value === null || value === "") return { ok: true, values: [] };
  if (!Array.isArray(value)) return { ok: false, code: "unsafe_content" };
  if (value.length > options.maxItems) return { ok: false, code: "field_too_long" };

  const output: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const normalized = normalizeOptionalText(item, options.maxItemLength);

    if (!normalized.ok) return { ok: false, code: normalized.code };
    if (normalized.value === null) continue;

    if (!seen.has(normalized.value)) {
      seen.add(normalized.value);
      output.push(normalized.value);
    }
  }

  return { ok: true, values: output };
}

function normalizeUrlArray(
  value: unknown,
): { ok: true; values: string[]; trackingRemoved: boolean } | { ok: false; code: DiscoveryCandidateRejectionCode } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, values: [], trackingRemoved: false };
  }

  if (!Array.isArray(value)) return { ok: false, code: "unsafe_content" };
  if (value.length > MAX_ARRAY_ITEMS) return { ok: false, code: "field_too_long" };

  const output: string[] = [];
  const seen = new Set<string>();
  let trackingRemoved = false;

  for (const item of value) {
    const normalized = normalizeHttpsUrl(item);

    if (!normalized.ok) return { ok: false, code: normalized.code };

    trackingRemoved = trackingRemoved || normalized.trackingRemoved;

    if (!seen.has(normalized.url)) {
      seen.add(normalized.url);
      output.push(normalized.url);
    }
  }

  return { ok: true, values: output, trackingRemoved };
}

function normalizeDuplicateCheckStatus(value: unknown): DiscoveryCandidateDuplicateCheckStatus {
  if (typeof value !== "string") return "not_checked";

  const normalized = collapseText(value).toLowerCase();

  if (!DUPLICATE_CHECK_STATUSES.some((status) => status === normalized)) return "not_checked";

  return normalized as DiscoveryCandidateDuplicateCheckStatus;
}

function normalizeOptionalPositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) return null;

  return numberValue;
}

function addWarning(
  warnings: SafeNormalizerWarning[],
  warning: SafeNormalizerWarning,
): SafeNormalizerWarning[] {
  if (warnings.includes(warning)) return warnings;
  return [...warnings, warning];
}

export function normalizeDiscoveryCandidate(
  input: DiscoveryCandidateNormalizerInput,
): DiscoveryCandidateNormalizerResult {
  if (!isRecord(input)) return reject("normalization_failed");

  let warnings: SafeNormalizerWarning[] = [];

  const discoveryRunId = normalizeRequiredUuid(input.discovery_run_id);

  if (!discoveryRunId) return reject("missing_discovery_run_id");

  const sourceUrlMissing =
    input.source_url === undefined || input.source_url === null || input.source_url === "";

  if (sourceUrlMissing) return reject("missing_source_url");

  const sourceUrl = normalizeHttpsUrl(input.source_url);

  if (!sourceUrl.ok) return reject(sourceUrl.code);
  if (sourceUrl.trackingRemoved) warnings = addWarning(warnings, "tracking_parameters_removed");

  const candidateWebsiteMissing =
    input.candidate_website_url === undefined ||
    input.candidate_website_url === null ||
    input.candidate_website_url === "";

  if (candidateWebsiteMissing) return reject("missing_website_url");

  const candidateWebsiteUrl = normalizeHttpsUrl(input.candidate_website_url);

  if (!candidateWebsiteUrl.ok) return reject(candidateWebsiteUrl.code);
  if (candidateWebsiteUrl.trackingRemoved) {
    warnings = addWarning(warnings, "tracking_parameters_removed");
  }

  const candidateName = normalizeRequiredText(
    input.candidate_name,
    MAX_NAME_LENGTH,
    "missing_name",
  );

  if (!candidateName.ok) return reject(candidateName.code, warnings);

  const sourceEvidenceLocator = normalizeOptionalText(
    input.source_evidence_locator,
    MAX_LOCATOR_LENGTH,
  );

  if (!sourceEvidenceLocator.ok) return reject(sourceEvidenceLocator.code, warnings);

  const extractionVersion = normalizeOptionalText(input.extraction_version, MAX_SHORT_TEXT_LENGTH);

  if (!extractionVersion.ok) return reject(extractionVersion.code, warnings);

  const candidateDescription = normalizeOptionalText(
    input.candidate_description,
    MAX_LONG_TEXT_LENGTH,
  );

  if (!candidateDescription.ok) return reject(candidateDescription.code, warnings);

  const evidenceSummary = normalizeOptionalText(input.evidence_summary, MAX_LONG_TEXT_LENGTH);

  if (!evidenceSummary.ok) return reject(evidenceSummary.code, warnings);

  const categoryHint = normalizeCategory(input.candidate_category_hint);

  if (!categoryHint.ok) return reject(categoryHint.code, warnings);

  const pricingHint = normalizePricing(input.candidate_pricing_hint);

  if (!pricingHint.ok) return reject(pricingHint.code, warnings);

  const confidenceBucket = normalizeConfidence(input.confidence_bucket);

  if (!confidenceBucket.ok) return reject(confidenceBucket.code, warnings);

  const platformHints = normalizeStringArray(input.candidate_platform_hints, {
    maxItems: MAX_ARRAY_ITEMS,
    maxItemLength: MAX_SHORT_TEXT_LENGTH,
  });

  if (!platformHints.ok) return reject(platformHints.code, warnings);

  const socialLinks = normalizeUrlArray(input.candidate_social_links);

  if (!socialLinks.ok) return reject(socialLinks.code, warnings);
  if (socialLinks.trackingRemoved) warnings = addWarning(warnings, "tracking_parameters_removed");

  const appLinks = normalizeUrlArray(input.candidate_app_links);

  if (!appLinks.ok) return reject(appLinks.code, warnings);
  if (appLinks.trackingRemoved) warnings = addWarning(warnings, "tracking_parameters_removed");

  const riskFlags = normalizeStringArray(input.risk_flags, {
    maxItems: MAX_FLAG_ITEMS,
    maxItemLength: MAX_SHORT_TEXT_LENGTH,
  });

  if (!riskFlags.ok) return reject(riskFlags.code, warnings);

  const duplicateSignalTypes = normalizeStringArray(input.duplicate_signal_types, {
    maxItems: MAX_FLAG_ITEMS,
    maxItemLength: MAX_SHORT_TEXT_LENGTH,
  });

  if (!duplicateSignalTypes.ok) return reject(duplicateSignalTypes.code, warnings);

  const duplicateCheckStatus = normalizeDuplicateCheckStatus(input.duplicate_check_status);
  const duplicateBlocking = input.duplicate_blocking === true;
  const possibleDuplicateToolId = normalizeOptionalPositiveInteger(input.possible_duplicate_tool_id);
  const possibleDuplicateDiscoveredToolId = normalizeOptionalUuid(
    input.possible_duplicate_discovered_tool_id,
  );
  const possibleDuplicateCandidateId = normalizeOptionalUuid(input.possible_duplicate_candidate_id);
  const auditCorrelationId = normalizeOptionalUuid(input.audit_correlation_id);

  if (input.audit_correlation_id && !auditCorrelationId) {
    return reject("invalid_audit_correlation_id", warnings);
  }

  if (
    duplicateCheckStatus !== "not_checked" ||
    duplicateBlocking ||
    possibleDuplicateToolId !== null ||
    possibleDuplicateDiscoveredToolId !== null ||
    possibleDuplicateCandidateId !== null ||
    duplicateSignalTypes.values.length > 0
  ) {
    warnings = addWarning(warnings, "duplicate_advisory_present");
  }

  const candidate: SafeDiscoveryCandidateToolInsert = {
    discovery_run_id: discoveryRunId,
    source_url: sourceUrl.url,
    source_url_normalized: sourceUrl.url,
    source_domain: sourceUrl.domain,
    source_evidence_kind: SOURCE_EVIDENCE_KIND,
    source_evidence_locator: sourceEvidenceLocator.value,
    extraction_mode: EXTRACTION_MODE,
    extraction_version: extractionVersion.value ?? DEFAULT_EXTRACTION_VERSION,
    candidate_name: candidateName.value,
    candidate_website_url: candidateWebsiteUrl.url,
    candidate_canonical_url: candidateWebsiteUrl.url,
    candidate_normalized_domain: candidateWebsiteUrl.domain,
    candidate_description: candidateDescription.value,
    candidate_category_hint: categoryHint.value,
    candidate_pricing_hint: pricingHint.value,
    candidate_platform_hints: platformHints.values,
    candidate_social_links: socialLinks.values,
    candidate_app_links: appLinks.values,
    evidence_summary: evidenceSummary.value,
    confidence_bucket: confidenceBucket.value,
    risk_flags: riskFlags.values,
    duplicate_check_status: duplicateCheckStatus,
    duplicate_signal_types: duplicateSignalTypes.values,
    duplicate_blocking: duplicateBlocking,
    possible_duplicate_tool_id: possibleDuplicateToolId,
    possible_duplicate_discovered_tool_id: possibleDuplicateDiscoveredToolId,
    possible_duplicate_candidate_id: possibleDuplicateCandidateId,
    duplicate_checked_at: null,
    candidate_status: "staged",
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    rejection_reason_code: null,
    cleanup_status: "active",
    eligible_for_cleanup_at: null,
    archived_at: null,
  };

  if (auditCorrelationId) {
    candidate.audit_correlation_id = auditCorrelationId;
  }

  return {
    ok: true,
    candidate,
    warnings,
  };
}
