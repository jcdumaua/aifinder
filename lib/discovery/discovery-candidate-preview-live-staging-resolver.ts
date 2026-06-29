import type { CandidateExtractionMapperInput } from "./discovery-candidate-extraction-mapper";
import {
  CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
  type CandidateExtractionInvocationInput,
  type CandidateExtractionInvocationOptions,
  type CandidateExtractionLiveStagingCandidateProviderInput,
} from "./discovery-candidate-extraction-invocation";
import type { CandidateExtractionStageCandidate } from "./discovery-candidate-extraction-staging-pipeline";
import {
  getCandidateExtractionPreviewForRun,
  type CandidateExtractionPreviewInput,
  type CandidateExtractionPreviewResult,
} from "./discovery-candidate-preview-provider";
import { stageNormalizedDiscoveryCandidate } from "./discovery-candidate-staging-admin";

export const CANDIDATE_PREVIEW_LIVE_STAGING_RESOLVER_PHASE =
  "phase-14d-preview-revalidated-live-gate-resolver";

export type CandidatePreviewLiveStagingResolverInput = {
  invocationInput: CandidateExtractionInvocationInput;
  invokedByAdminUserId: string;
};

export type CandidatePreviewLiveStagingResolverDependencies = {
  getCandidatePreview?: (
    input: CandidateExtractionPreviewInput,
  ) => CandidateExtractionPreviewResult | Promise<CandidateExtractionPreviewResult>;
  stageCandidate?: CandidateExtractionStageCandidate;
};

type ResolvedScope = {
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string;
  invokedByAdminUserId: string;
};

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

const SCOPED_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeScopedId(value: unknown): string | null {
  const text = getTrimmedString(value);

  if (!text) return null;

  const normalized = text.toLowerCase();

  return SCOPED_UUID_PATTERN.test(normalized) ? normalized : null;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalized)
  );
}

function getSafeHttpsUrl(value: unknown): string | null {
  const text = getTrimmedString(value);

  if (!text || text.length > 2048) return null;

  try {
    const parsed = new URL(text);

    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      isPrivateOrLocalHost(parsed.hostname)
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeConfidenceBucket(
  value: string | null,
): CandidateExtractionMapperInput["confidenceBucket"] {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : null;
}

function getEligibleScope(
  input: CandidatePreviewLiveStagingResolverInput,
): ResolvedScope | null {
  const invocationInput = input.invocationInput;
  const sourceScope = getTrimmedString(invocationInput.source_scope);
  const schemaVersion = getTrimmedString(invocationInput.schema_version);
  const maxCandidates =
    typeof invocationInput.max_candidates === "number"
      ? invocationInput.max_candidates
      : Number(invocationInput.max_candidates);

  if (invocationInput.dry_run !== false) return null;
  if (maxCandidates !== CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES) {
    return null;
  }
  if (sourceScope !== "single_run") return null;
  if (schemaVersion !== CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION) {
    return null;
  }

  const discoverySourceId = normalizeScopedId(invocationInput.discovery_source_id);
  const discoveryRunId = normalizeScopedId(invocationInput.discovery_run_id);
  const auditCorrelationId = normalizeScopedId(invocationInput.audit_correlation_id);
  const invokedByAdminUserId = getTrimmedString(
    input.invokedByAdminUserId ?? invocationInput.invoked_by_admin_user_id,
  );

  if (
    !discoverySourceId ||
    !discoveryRunId ||
    !auditCorrelationId ||
    !invokedByAdminUserId
  ) {
    return null;
  }

  return {
    discoverySourceId,
    discoveryRunId,
    auditCorrelationId,
    invokedByAdminUserId,
  };
}

function isProviderInputScoped(
  providerInput: CandidateExtractionLiveStagingCandidateProviderInput,
  scope: ResolvedScope,
): boolean {
  return (
    providerInput.discoverySourceId === scope.discoverySourceId &&
    providerInput.discoveryRunId === scope.discoveryRunId &&
    providerInput.auditCorrelationId === scope.auditCorrelationId &&
    providerInput.dryRun === false &&
    providerInput.maxCandidates === CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES &&
    providerInput.sourceScope === "single_run" &&
    providerInput.schemaVersion === CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION
  );
}

function toMapperInput(
  previewResult: Extract<CandidateExtractionPreviewResult, { accepted: true }>,
  scope: ResolvedScope,
): CandidateExtractionMapperInput | null {
  const preview = previewResult.preview;

  if (
    preview.discoverySourceId !== scope.discoverySourceId ||
    preview.discoveryRunId !== scope.discoveryRunId ||
    preview.auditCorrelationId !== scope.auditCorrelationId
  ) {
    return null;
  }

  const sourceUrl = getSafeHttpsUrl(preview.sourceUrlSnapshot);
  const candidateWebsiteUrl = getSafeHttpsUrl(preview.candidateWebsiteUrl);
  const candidateName = getTrimmedString(preview.candidateName);

  if (!sourceUrl || !candidateWebsiteUrl || !candidateName) return null;

  if (sourceUrl === candidateWebsiteUrl) return null;

  return {
    discoverySourceId: scope.discoverySourceId,
    discoveryRunId: scope.discoveryRunId,
    auditCorrelationId: scope.auditCorrelationId,
    sourceUrl,
    sourceEvidenceLocator: preview.sourceEvidenceLocator,
    candidateName,
    candidateWebsiteUrl,
    candidateDescription: null,
    candidateCategoryHint: preview.categoryHint,
    candidatePricingHint: preview.pricingHint,
    evidenceSummary: preview.evidenceSummary,
    confidenceBucket: normalizeConfidenceBucket(preview.confidenceBucket),
  };
}

export async function resolveCandidatePreviewLiveStagingOptions(
  input: CandidatePreviewLiveStagingResolverInput,
  dependencies: CandidatePreviewLiveStagingResolverDependencies = {},
): Promise<CandidateExtractionInvocationOptions> {
  const scope = getEligibleScope(input);

  if (!scope) return {};

  const getCandidatePreview =
    dependencies.getCandidatePreview ?? getCandidateExtractionPreviewForRun;

  let previewResult: CandidateExtractionPreviewResult;

  try {
    previewResult = await getCandidatePreview({
      discoveryRunId: scope.discoveryRunId,
      discoverySourceId: scope.discoverySourceId,
      requestingAdminActorId: scope.invokedByAdminUserId,
    });
  } catch {
    return {};
  }

  if (!previewResult.accepted) return {};

  const candidateInput = toMapperInput(previewResult, scope);

  if (!candidateInput) return {};

  return {
    liveStagingGate: {
      enabled: true,
      mode: CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
      phase: CANDIDATE_PREVIEW_LIVE_STAGING_RESOLVER_PHASE,
      maxCandidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
      sourceScope: "single_run",
      createdByServer: true,
      approvedExecutionRequired: true,
      auditCorrelationId: scope.auditCorrelationId,
      discoverySourceId: scope.discoverySourceId,
      discoveryRunId: scope.discoveryRunId,
      actorId: scope.invokedByAdminUserId,
    },
    getLiveStagingCandidate(providerInput) {
      return isProviderInputScoped(providerInput, scope) ? candidateInput : null;
    },
    stageCandidate: dependencies.stageCandidate ?? stageNormalizedDiscoveryCandidate,
  };
}
