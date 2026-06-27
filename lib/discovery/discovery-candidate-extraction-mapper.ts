import { randomUUID } from "node:crypto";

import {
  CANDIDATE_CONFIDENCE_BUCKETS,
  normalizeDiscoveryCandidate,
  type DiscoveryCandidateDuplicateCheckStatus,
  type DiscoveryCandidatePricingHint,
  type DiscoveryCandidateRejectionCode,
  type SafeNormalizerWarning,
} from "../discovery-candidate-normalizer";
import { validateDiscoveryUrlSafety } from "../discovery-url-safety";
import { TOOL_CATEGORIES, type ToolCategory } from "../tool-categories";
import type { StageNormalizedDiscoveryCandidateInput } from "./discovery-candidate-staging-admin";

export type CandidateExtractionDuplicateAdvisory = {
  duplicateCheckStatus?: DiscoveryCandidateDuplicateCheckStatus | null;
  duplicateSignalTypes?: string[] | null;
  duplicateBlocking?: boolean | null;
  possibleDuplicateToolId?: number | null;
  possibleDuplicateDiscoveredToolId?: string | null;
  possibleDuplicateCandidateId?: string | null;
};

export type CandidateExtractionMapperInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  sourceUrl: string;
  sourceEvidenceLocator?: string | null;
  candidateName: string;
  candidateWebsiteUrl: string;
  candidateDescription?: string | null;
  candidateCategoryHint?: string | null;
  candidatePricingHint?: string | null;
  candidatePlatformHints?: string[] | null;
  candidateSocialLinks?: string[] | null;
  candidateAppLinks?: string[] | null;
  evidenceSummary?: string | null;
  confidenceBucket?: "low" | "medium" | "high" | null;
  riskFlags?: string[] | null;
  duplicateAdvisory?: CandidateExtractionDuplicateAdvisory | null;
  auditCorrelationId?: string | null;
};

export type CandidateExtractionMapperFailureCode =
  | "missing_discovery_run_id"
  | "missing_discovery_source_id"
  | "missing_source_url"
  | "missing_candidate_name"
  | "missing_candidate_website_url"
  | "invalid_discovery_run_id"
  | "invalid_discovery_source_id"
  | "invalid_source_url"
  | "invalid_candidate_website_url"
  | "invalid_category"
  | "invalid_pricing"
  | "invalid_confidence_bucket"
  | "invalid_audit_correlation_id"
  | "audit_correlation_unavailable"
  | "unsafe_payload"
  | "field_too_long"
  | "normalization_failed"
  | "internal_mapping_error";

export type CandidateExtractionMapperWarning =
  | SafeNormalizerWarning
  | "source_evidence_locator_absent"
  | "audit_correlation_generated";

export type CandidateExtractionMapperSuccess = {
  ok: true;
  stagingInput: StageNormalizedDiscoveryCandidateInput;
  warnings: CandidateExtractionMapperWarning[];
};

export type CandidateExtractionMapperFailure = {
  ok: false;
  error: {
    code: CandidateExtractionMapperFailureCode;
    message: string;
    field?: string;
  };
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  warnings: CandidateExtractionMapperWarning[];
};

export type CandidateExtractionMapperResult =
  | CandidateExtractionMapperSuccess
  | CandidateExtractionMapperFailure;

type MapperContext = {
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRICING_HINTS = ["Free + Paid", "Free", "Paid"] as const satisfies readonly DiscoveryCandidatePricingHint[];

const FAILURE_MESSAGES: Record<CandidateExtractionMapperFailureCode, string> = {
  missing_discovery_run_id: "Missing discovery run ID.",
  missing_discovery_source_id: "Missing discovery source ID.",
  missing_source_url: "Missing source URL.",
  missing_candidate_name: "Missing candidate name.",
  missing_candidate_website_url: "Missing candidate website URL.",
  invalid_discovery_run_id: "Invalid discovery run ID.",
  invalid_discovery_source_id: "Invalid discovery source ID.",
  invalid_source_url: "Invalid source URL.",
  invalid_candidate_website_url: "Invalid candidate website URL.",
  invalid_category: "Invalid candidate category hint.",
  invalid_pricing: "Invalid candidate pricing hint.",
  invalid_confidence_bucket: "Invalid confidence bucket.",
  invalid_audit_correlation_id: "Invalid audit correlation ID.",
  audit_correlation_unavailable: "Audit correlation ID could not be generated.",
  unsafe_payload: "Unsafe extraction payload.",
  field_too_long: "Extraction field is too long.",
  normalization_failed: "Candidate extraction mapping failed normalization.",
  internal_mapping_error: "Candidate extraction mapping failed.",
};

function addWarning(
  warnings: CandidateExtractionMapperWarning[],
  warning: CandidateExtractionMapperWarning,
): CandidateExtractionMapperWarning[] {
  if (warnings.includes(warning)) return warnings;
  return [...warnings, warning];
}

function fail(
  code: CandidateExtractionMapperFailureCode,
  options: {
    field?: string;
    context?: MapperContext;
    warnings?: CandidateExtractionMapperWarning[];
  } = {},
): CandidateExtractionMapperFailure {
  return {
    ok: false,
    error: {
      code,
      message: FAILURE_MESSAGES[code],
      ...(options.field ? { field: options.field } : {}),
    },
    ...(options.context?.discoveryRunId
      ? { discoveryRunId: options.context.discoveryRunId }
      : {}),
    ...(options.context?.discoverySourceId
      ? { discoverySourceId: options.context.discoverySourceId }
      : {}),
    ...(options.context?.auditCorrelationId !== undefined
      ? { auditCorrelationId: options.context.auditCorrelationId }
      : {}),
    warnings: options.warnings ?? [],
  };
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredUuid(
  value: unknown,
  missingCode: CandidateExtractionMapperFailureCode,
  invalidCode: CandidateExtractionMapperFailureCode,
  field: string,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
): string | CandidateExtractionMapperFailure {
  const trimmed = getTrimmedString(value);

  if (!trimmed) {
    return fail(missingCode, { field, context, warnings });
  }

  const normalized = trimmed.toLowerCase();

  if (!UUID_PATTERN.test(normalized)) {
    return fail(invalidCode, { field, context, warnings });
  }

  return normalized;
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return value as never;

  return value.trim() || null;
}

function normalizeCategoryHint(
  value: unknown,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
): ToolCategory | null | undefined | CandidateExtractionMapperFailure {
  const normalized = normalizeOptionalText(value);

  if (normalized === undefined || normalized === null) return normalized;

  if (!TOOL_CATEGORIES.some((category) => category === normalized)) {
    return fail("invalid_category", {
      field: "candidateCategoryHint",
      context,
      warnings,
    });
  }

  return normalized as ToolCategory;
}

function normalizePricingHint(
  value: unknown,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
): DiscoveryCandidatePricingHint | null | undefined | CandidateExtractionMapperFailure {
  const normalized = normalizeOptionalText(value);

  if (normalized === undefined || normalized === null) return normalized;

  if (!PRICING_HINTS.some((hint) => hint === normalized)) {
    return fail("invalid_pricing", {
      field: "candidatePricingHint",
      context,
      warnings,
    });
  }

  return normalized as DiscoveryCandidatePricingHint;
}

function normalizeConfidenceBucket(
  value: unknown,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
): "low" | "medium" | "high" | null | undefined | CandidateExtractionMapperFailure {
  const normalized = normalizeOptionalText(value);

  if (normalized === undefined || normalized === null) return normalized;

  const lowerCased = normalized.toLowerCase();

  if (!CANDIDATE_CONFIDENCE_BUCKETS.some((bucket) => bucket === lowerCased)) {
    return fail("invalid_confidence_bucket", {
      field: "confidenceBucket",
      context,
      warnings,
    });
  }

  return lowerCased as "low" | "medium" | "high";
}

function resolveAuditCorrelationId(
  value: unknown,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
):
  | { auditCorrelationId: string; warnings: CandidateExtractionMapperWarning[] }
  | CandidateExtractionMapperFailure {
  const provided = normalizeOptionalText(value);

  if (provided !== undefined && provided !== null) {
    const normalized = provided.toLowerCase();

    if (!UUID_PATTERN.test(normalized)) {
      return fail("invalid_audit_correlation_id", {
        field: "auditCorrelationId",
        context,
        warnings,
      });
    }

    return { auditCorrelationId: normalized, warnings };
  }

  try {
    return {
      auditCorrelationId: randomUUID(),
      warnings: addWarning(warnings, "audit_correlation_generated"),
    };
  } catch {
    return fail("audit_correlation_unavailable", {
      field: "auditCorrelationId",
      context,
      warnings,
    });
  }
}

function mapNormalizerRejection(
  rejectionCode: DiscoveryCandidateRejectionCode,
): CandidateExtractionMapperFailureCode {
  switch (rejectionCode) {
    case "missing_discovery_run_id":
      return "missing_discovery_run_id";
    case "missing_source_url":
      return "missing_source_url";
    case "missing_name":
      return "missing_candidate_name";
    case "missing_website_url":
      return "missing_candidate_website_url";
    case "field_too_long":
      return "field_too_long";
    case "unsafe_content":
      return "unsafe_payload";
    case "unsupported_category_hint":
      return "invalid_category";
    case "unsupported_pricing_hint":
      return "invalid_pricing";
    case "unsupported_confidence_bucket":
      return "invalid_confidence_bucket";
    case "invalid_audit_correlation_id":
      return "invalid_audit_correlation_id";
    case "invalid_url":
    case "non_https_url":
    case "unsafe_domain":
    case "normalization_failed":
      return "normalization_failed";
    default:
      return "normalization_failed";
  }
}

function normalizeRequiredUrl(
  value: unknown,
  missingCode: CandidateExtractionMapperFailureCode,
  invalidCode: CandidateExtractionMapperFailureCode,
  field: string,
  context: MapperContext,
  warnings: CandidateExtractionMapperWarning[],
): string | CandidateExtractionMapperFailure {
  const trimmed = getTrimmedString(value);

  if (!trimmed) {
    return fail(missingCode, { field, context, warnings });
  }

  const safety = validateDiscoveryUrlSafety(trimmed);

  if (!safety.ok) {
    return fail(invalidCode, { field, context, warnings });
  }

  return safety.normalizedUrl;
}

export function mapExtractionToStagingCandidate(
  input: CandidateExtractionMapperInput,
): CandidateExtractionMapperResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("internal_mapping_error");
  }

  let warnings: CandidateExtractionMapperWarning[] = [];
  const context: MapperContext = {};

  const discoveryRunId = normalizeRequiredUuid(
    input.discoveryRunId,
    "missing_discovery_run_id",
    "invalid_discovery_run_id",
    "discoveryRunId",
    context,
    warnings,
  );

  if (typeof discoveryRunId !== "string") return discoveryRunId;
  context.discoveryRunId = discoveryRunId;

  const discoverySourceId = normalizeRequiredUuid(
    input.discoverySourceId,
    "missing_discovery_source_id",
    "invalid_discovery_source_id",
    "discoverySourceId",
    context,
    warnings,
  );

  if (typeof discoverySourceId !== "string") return discoverySourceId;
  context.discoverySourceId = discoverySourceId;

  const sourceUrl = normalizeRequiredUrl(
    input.sourceUrl,
    "missing_source_url",
    "invalid_source_url",
    "sourceUrl",
    context,
    warnings,
  );

  if (typeof sourceUrl !== "string") return sourceUrl;

  const candidateWebsiteUrl = normalizeRequiredUrl(
    input.candidateWebsiteUrl,
    "missing_candidate_website_url",
    "invalid_candidate_website_url",
    "candidateWebsiteUrl",
    context,
    warnings,
  );

  if (typeof candidateWebsiteUrl !== "string") return candidateWebsiteUrl;

  const candidateName = getTrimmedString(input.candidateName);

  if (!candidateName) {
    return fail("missing_candidate_name", {
      field: "candidateName",
      context,
      warnings,
    });
  }

  const sourceEvidenceLocator = normalizeOptionalText(input.sourceEvidenceLocator);

  if (sourceEvidenceLocator === undefined || sourceEvidenceLocator === null) {
    warnings = addWarning(warnings, "source_evidence_locator_absent");
  }

  const candidateCategoryHint = normalizeCategoryHint(
    input.candidateCategoryHint,
    context,
    warnings,
  );

  if (candidateCategoryHint && typeof candidateCategoryHint === "object") {
    return candidateCategoryHint;
  }

  const candidatePricingHint = normalizePricingHint(
    input.candidatePricingHint,
    context,
    warnings,
  );

  if (candidatePricingHint && typeof candidatePricingHint === "object") {
    return candidatePricingHint;
  }

  const confidenceBucket = normalizeConfidenceBucket(
    input.confidenceBucket,
    context,
    warnings,
  );

  if (confidenceBucket && typeof confidenceBucket === "object") {
    return confidenceBucket;
  }

  const auditCorrelation = resolveAuditCorrelationId(
    input.auditCorrelationId,
    context,
    warnings,
  );

  if ("ok" in auditCorrelation && auditCorrelation.ok === false) {
    return auditCorrelation;
  }

  warnings = auditCorrelation.warnings;
  context.auditCorrelationId = auditCorrelation.auditCorrelationId;

  const duplicateAdvisory = input.duplicateAdvisory ?? {};

  const normalized = normalizeDiscoveryCandidate({
    discovery_run_id: discoveryRunId,
    source_url: sourceUrl,
    source_evidence_locator: sourceEvidenceLocator,
    candidate_name: candidateName,
    candidate_website_url: candidateWebsiteUrl,
    candidate_description: input.candidateDescription,
    candidate_category_hint: candidateCategoryHint,
    candidate_pricing_hint: candidatePricingHint,
    candidate_platform_hints: input.candidatePlatformHints,
    candidate_social_links: input.candidateSocialLinks,
    candidate_app_links: input.candidateAppLinks,
    evidence_summary: input.evidenceSummary,
    confidence_bucket: confidenceBucket,
    risk_flags: input.riskFlags,
    duplicate_check_status: duplicateAdvisory.duplicateCheckStatus,
    duplicate_signal_types: duplicateAdvisory.duplicateSignalTypes,
    duplicate_blocking: duplicateAdvisory.duplicateBlocking,
    possible_duplicate_tool_id: duplicateAdvisory.possibleDuplicateToolId,
    possible_duplicate_discovered_tool_id:
      duplicateAdvisory.possibleDuplicateDiscoveredToolId,
    possible_duplicate_candidate_id: duplicateAdvisory.possibleDuplicateCandidateId,
    audit_correlation_id: auditCorrelation.auditCorrelationId,
  });

  if (!normalized.ok) {
    return fail(mapNormalizerRejection(normalized.rejection_code), {
      context,
      warnings: [...warnings, ...normalized.warnings],
    });
  }

  return {
    ok: true,
    stagingInput: {
      discoveryRunId,
      discoverySourceId,
      normalizedCandidate: normalized.candidate,
    },
    warnings: [...warnings, ...normalized.warnings],
  };
}
