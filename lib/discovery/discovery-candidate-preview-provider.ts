import "server-only";

import type { Database } from "../supabase/database.types";
import type { DiscoverySupabaseAdminClient } from "./discovery-supabase-admin";

export const CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION =
  "candidate_preview_artifact.v2";

export type CandidateExtractionPreviewStatus =
  | "unavailable"
  | "pending_review"
  | "reviewable"
  | "blocked"
  | "stale";

export type CandidateExtractionPreviewRejectionCode =
  | "missing_discovery_run_id"
  | "missing_discovery_source_id"
  | "missing_admin_actor"
  | "discovery_run_not_found"
  | "discovery_run_source_mismatch"
  | "preview_artifact_unavailable"
  | "preview_artifact_schema_unsupported"
  | "preview_artifact_stale"
  | "preview_artifact_blocked"
  | "preview_artifact_unsafe"
  | "preview_artifact_ambiguous"
  | "preview_candidate_missing_name"
  | "preview_candidate_missing_website"
  | "preview_candidate_unsafe_website"
  | "preview_source_url_missing"
  | "preview_source_url_unsafe"
  | "preview_source_url_drift";

export type CandidateExtractionPreviewInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  requestingAdminActorId: string;
  expectedSchemaVersion?: string;
};

export type CandidateExtractionPreview = {
  candidateName: string;
  candidateWebsiteUrl: string;
  categoryHint: string | null;
  pricingHint: string | null;
  confidenceBucket: string | null;
  evidenceSummary: string | null;
  sourceEvidenceLocator: string;
  sourceUrlSnapshot: string;
  discoverySourceId: string;
  discoveryRunId: string;
  auditCorrelationId: string;
};

export type CandidateExtractionPreviewResult =
  | {
      accepted: true;
      rejected: false;
      rejectionCode: null;
      previewStatus: "reviewable";
      preview: CandidateExtractionPreview;
      safetyFlags: string[];
      auditCorrelationId: string;
      noPublicWriteConfirmed: true;
      noDiscoveredWriteConfirmed: true;
    }
  | {
      accepted: false;
      rejected: true;
      rejectionCode: CandidateExtractionPreviewRejectionCode;
      previewStatus: CandidateExtractionPreviewStatus;
      preview: null;
      safetyFlags: string[];
      auditCorrelationId: string | null;
      noPublicWriteConfirmed: true;
      noDiscoveredWriteConfirmed: true;
    };

type DiscoveryRunRow = Pick<
  Database["public"]["Tables"]["discovery_runs"]["Row"],
  "id" | "source_id" | "status" | "updated_at"
>;

type DiscoverySourceRow = Pick<
  Database["public"]["Tables"]["discovery_sources"]["Row"],
  "id" | "url" | "source_type" | "updated_at"
>;

type CandidatePreviewArtifactRow = Pick<
  Database["public"]["Tables"]["discovery_candidate_preview_artifacts"]["Row"],
  | "id"
  | "audit_correlation_id"
  | "candidate_name"
  | "candidate_website_url"
  | "category_hint"
  | "confidence_bucket"
  | "created_at"
  | "discovery_run_id"
  | "discovery_source_id"
  | "evidence_summary"
  | "preview_generated_at"
  | "preview_schema_version"
  | "preview_status"
  | "pricing_hint"
  | "safety_flags"
  | "source_evidence_locator"
  | "source_url_snapshot"
  | "updated_at"
>;

export type CandidatePreviewProviderDependencies = {
  loadDiscoveryRun: (
    discoveryRunId: string,
  ) => DiscoveryRunRow | null | Promise<DiscoveryRunRow | null>;
  loadDiscoverySource?: (
    discoverySourceId: string,
  ) => DiscoverySourceRow | null | Promise<DiscoverySourceRow | null>;
  loadPreviewArtifacts: (
    input: Pick<CandidateExtractionPreviewInput, "discoveryRunId" | "discoverySourceId">,
  ) =>
    | CandidatePreviewArtifactRow[]
    | Promise<CandidatePreviewArtifactRow[]>;
};

type CandidatePreviewProviderContext = {
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  previewStatus?: CandidateExtractionPreviewStatus;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_PREVIEW_STATUSES: ReadonlySet<CandidateExtractionPreviewStatus> =
  new Set([
    "unavailable",
    "pending_review",
    "reviewable",
    "blocked",
    "stale",
  ]);

const ALLOWED_CATEGORY_HINTS = new Set([
  "Chatbots",
  "Image AI",
  "Video AI",
  "Voice AI",
  "Writing",
  "Coding",
  "Business",
  "Productivity",
  "Education AI",
  "Marketing AI",
  "SEO AI",
  "Design AI",
  "AI Agents",
]);

const ALLOWED_PRICING_HINTS = new Set(["Free + Paid", "Free", "Paid"]);

const ALLOWED_CONFIDENCE_BUCKETS = new Set([
  "low",
  "medium",
  "high",
  "review",
  "blocked",
]);

const ALLOWED_SAFETY_FLAGS = new Set([
  "bounded_preview",
  "server_sanitized",
  "source_run_matched",
  "no_public_write",
  "no_discovered_write",
  "no_raw_html",
  "no_llm_output",
  "unsafe_url_blocked",
  "stale_schema_blocked",
  "ambiguous_preview_blocked",
  "source_url_snapshot_validated",
  "source_url_snapshot_missing_blocked",
  "source_url_snapshot_unsafe_blocked",
  "source_url_drift_blocked",
]);

const BLOCKING_SAFETY_FLAGS = new Set([
  "unsafe_url_blocked",
  "stale_schema_blocked",
  "ambiguous_preview_blocked",
  "source_url_snapshot_missing_blocked",
  "source_url_snapshot_unsafe_blocked",
  "source_url_drift_blocked",
]);

const DEFAULT_REJECTION_FLAGS = [
  "no_public_write",
  "no_discovered_write",
  "no_raw_html",
  "no_llm_output",
];

const PREVIEW_ARTIFACT_SELECT_COLUMNS = [
  "id",
  "audit_correlation_id",
  "candidate_name",
  "candidate_website_url",
  "category_hint",
  "confidence_bucket",
  "created_at",
  "discovery_run_id",
  "discovery_source_id",
  "evidence_summary",
  "preview_generated_at",
  "preview_schema_version",
  "preview_status",
  "pricing_hint",
  "safety_flags",
  "source_evidence_locator",
  "source_url_snapshot",
  "updated_at",
].join(",");

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeUuid(value: string): string | null {
  const normalized = value.trim().toLowerCase();

  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function isPreviewStatus(value: unknown): value is CandidateExtractionPreviewStatus {
  return typeof value === "string" && ALLOWED_PREVIEW_STATUSES.has(value as CandidateExtractionPreviewStatus);
}

function containsUnsafePayload(value: string): boolean {
  return (
    /[<>]/.test(value) ||
    /<\s*\/?\s*(script|iframe|html|body|style|svg|object|embed)\b/i.test(
      value,
    ) ||
    /(raw_payload|raw html|raw_html|raw llm|raw_llm|model output)\s*[:=]/i.test(
      value,
    ) ||
    /(api[_-]?key|secret|token|password|service[_-]?role|cookie|csrf)\s*[:=]/i.test(
      value,
    ) ||
    /(supabase[_-]?service|stack trace|sqlstate|postgres error)/i.test(value)
  );
}

function getSafeRequiredText(value: unknown, maxLength: number): string | null {
  if (!isNonEmptyString(value)) return null;

  const trimmed = value.trim();

  if (trimmed.length > maxLength || containsUnsafePayload(trimmed)) {
    return null;
  }

  return trimmed;
}

function getSafeOptionalText(
  value: unknown,
  maxLength: number,
): string | null | false {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return false;

  const trimmed = value.trim();

  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength || containsUnsafePayload(trimmed)) {
    return false;
  }

  return trimmed;
}

function getSafeOptionalAllowlistedText(
  value: unknown,
  allowedValues: ReadonlySet<string>,
): string | null | false {
  const safeText = getSafeOptionalText(value, 160);

  if (safeText === null || safeText === false) return safeText;

  return allowedValues.has(safeText) ? safeText : false;
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
  if (!isNonEmptyString(value)) return null;

  const trimmed = value.trim();

  if (trimmed.length > 2048 || containsUnsafePayload(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname ||
      isPrivateOrLocalHost(parsed.hostname)
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function hasValidSafetyFlags(flags: unknown): flags is string[] {
  return (
    Array.isArray(flags) &&
    flags.length <= 24 &&
    flags.every(
      (flag) =>
        typeof flag === "string" &&
        flag.length > 0 &&
        flag.length <= 80 &&
        ALLOWED_SAFETY_FLAGS.has(flag),
    )
  );
}

function hasBlockingSafetyFlags(flags: string[]): boolean {
  return flags.some((flag) => BLOCKING_SAFETY_FLAGS.has(flag));
}

function parseTimestamp(value: unknown): number | null {
  if (!isNonEmptyString(value)) return null;

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

function rejectPreview(
  rejectionCode: CandidateExtractionPreviewRejectionCode,
  context: CandidatePreviewProviderContext = {},
): CandidateExtractionPreviewResult {
  return {
    accepted: false,
    rejected: true,
    rejectionCode,
    previewStatus: context.previewStatus ?? "unavailable",
    preview: null,
    safetyFlags: DEFAULT_REJECTION_FLAGS,
    auditCorrelationId: context.auditCorrelationId ?? null,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
  };
}

function acceptPreview(
  preview: CandidateExtractionPreview,
  artifactSafetyFlags: string[],
): CandidateExtractionPreviewResult {
  return {
    accepted: true,
    rejected: false,
    rejectionCode: null,
    previewStatus: "reviewable",
    preview,
    safetyFlags: Array.from(
      new Set([
        ...artifactSafetyFlags,
        "server_sanitized",
        "no_public_write",
        "no_discovered_write",
        "no_raw_html",
        "no_llm_output",
      ]),
    ),
    auditCorrelationId: preview.auditCorrelationId,
    noPublicWriteConfirmed: true,
    noDiscoveredWriteConfirmed: true,
  };
}

function chooseArtifactResult(
  artifacts: CandidatePreviewArtifactRow[],
): CandidatePreviewArtifactRow | CandidateExtractionPreviewResult {
  const reviewableArtifacts = artifacts.filter(
    (artifact) => artifact.preview_status === "reviewable",
  );

  if (reviewableArtifacts.length > 1) {
    return rejectPreview("preview_artifact_ambiguous", {
      previewStatus: "blocked",
      auditCorrelationId: reviewableArtifacts[0]?.audit_correlation_id ?? null,
    });
  }

  if (reviewableArtifacts.length === 1) {
    return reviewableArtifacts[0];
  }

  const latestArtifact = artifacts[0];

  if (!latestArtifact) {
    return rejectPreview("preview_artifact_unavailable", {
      previewStatus: "unavailable",
    });
  }

  const status = isPreviewStatus(latestArtifact.preview_status)
    ? latestArtifact.preview_status
    : "blocked";

  if (status === "blocked") {
    return rejectPreview("preview_artifact_blocked", {
      previewStatus: "blocked",
      auditCorrelationId: latestArtifact.audit_correlation_id,
    });
  }

  if (status === "stale") {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: latestArtifact.audit_correlation_id,
    });
  }

  return rejectPreview("preview_artifact_unavailable", {
    previewStatus: status,
    auditCorrelationId: latestArtifact.audit_correlation_id,
  });
}

function validateReviewableArtifact(
  artifact: CandidatePreviewArtifactRow,
  run: DiscoveryRunRow,
  input: Required<CandidateExtractionPreviewInput>,
  source: DiscoverySourceRow | null = null,
): CandidateExtractionPreviewResult {
  if (artifact.preview_schema_version !== input.expectedSchemaVersion) {
    return rejectPreview("preview_artifact_schema_unsupported", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (artifact.discovery_run_id !== input.discoveryRunId) {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (artifact.discovery_source_id !== input.discoverySourceId) {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (!hasValidSafetyFlags(artifact.safety_flags)) {
    return rejectPreview("preview_artifact_unsafe", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (hasBlockingSafetyFlags(artifact.safety_flags)) {
    return rejectPreview("preview_artifact_blocked", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const previewGeneratedAt = parseTimestamp(artifact.preview_generated_at);
  const runUpdatedAt = parseTimestamp(run.updated_at);

  if (previewGeneratedAt === null) {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (runUpdatedAt !== null && runUpdatedAt > previewGeneratedAt) {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const candidateName = getSafeRequiredText(artifact.candidate_name, 160);

  if (!candidateName) {
    return rejectPreview("preview_candidate_missing_name", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const candidateWebsiteUrl = getSafeHttpsUrl(artifact.candidate_website_url);

  if (!artifact.candidate_website_url) {
    return rejectPreview("preview_candidate_missing_website", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (!candidateWebsiteUrl) {
    return rejectPreview("preview_candidate_unsafe_website", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const sourceUrlSnapshot = getSafeHttpsUrl(artifact.source_url_snapshot);

  if (!artifact.source_url_snapshot) {
    return rejectPreview("preview_source_url_missing", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  if (!sourceUrlSnapshot || sourceUrlSnapshot === candidateWebsiteUrl) {
    return rejectPreview("preview_source_url_unsafe", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const parentSourceUrl = getSafeHttpsUrl(source?.url ?? null);

  if (parentSourceUrl && parentSourceUrl !== sourceUrlSnapshot) {
    return rejectPreview("preview_source_url_drift", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const sourceEvidenceLocator = getSafeRequiredText(
    artifact.source_evidence_locator,
    160,
  );

  if (!sourceEvidenceLocator) {
    return rejectPreview("preview_artifact_stale", {
      previewStatus: "stale",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  const categoryHint = getSafeOptionalAllowlistedText(
    artifact.category_hint,
    ALLOWED_CATEGORY_HINTS,
  );
  const pricingHint = getSafeOptionalAllowlistedText(
    artifact.pricing_hint,
    ALLOWED_PRICING_HINTS,
  );
  const confidenceBucket = getSafeOptionalAllowlistedText(
    artifact.confidence_bucket,
    ALLOWED_CONFIDENCE_BUCKETS,
  );
  const evidenceSummary = getSafeOptionalText(artifact.evidence_summary, 1000);

  if (
    categoryHint === false ||
    pricingHint === false ||
    confidenceBucket === false ||
    evidenceSummary === false
  ) {
    return rejectPreview("preview_artifact_unsafe", {
      previewStatus: "blocked",
      auditCorrelationId: artifact.audit_correlation_id,
    });
  }

  return acceptPreview(
    {
      candidateName,
      candidateWebsiteUrl,
      categoryHint,
      pricingHint,
      confidenceBucket,
      evidenceSummary,
      sourceEvidenceLocator,
      sourceUrlSnapshot,
      discoverySourceId: input.discoverySourceId,
      discoveryRunId: input.discoveryRunId,
      auditCorrelationId: artifact.audit_correlation_id,
    },
    artifact.safety_flags,
  );
}

async function createDefaultCandidatePreviewDependencies(): Promise<CandidatePreviewProviderDependencies> {
  const { createDiscoverySupabaseAdminClient } = await import(
    "./discovery-supabase-admin"
  );
  const client: Pick<DiscoverySupabaseAdminClient, "from"> =
    createDiscoverySupabaseAdminClient();

  return {
    async loadDiscoveryRun(discoveryRunId) {
      const { data, error } = await client
        .from("discovery_runs")
        .select("id,source_id,status,updated_at")
        .eq("id", discoveryRunId)
        .maybeSingle();

      if (error || !data) return null;

      return data as DiscoveryRunRow;
    },
    async loadDiscoverySource(discoverySourceId) {
      const { data, error } = await client
        .from("discovery_sources")
        .select("id,url,source_type,updated_at")
        .eq("id", discoverySourceId)
        .maybeSingle();

      if (error || !data) return null;

      return data as DiscoverySourceRow;
    },
    async loadPreviewArtifacts({ discoveryRunId, discoverySourceId }) {
      const { data, error } = await client
        .from("discovery_candidate_preview_artifacts")
        .select(PREVIEW_ARTIFACT_SELECT_COLUMNS)
        .eq("discovery_run_id", discoveryRunId)
        .eq("discovery_source_id", discoverySourceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !Array.isArray(data)) return [];

      return data as unknown as CandidatePreviewArtifactRow[];
    },
  };
}

export async function getCandidateExtractionPreviewForRun(
  input: CandidateExtractionPreviewInput,
): Promise<CandidateExtractionPreviewResult> {
  return getCandidateExtractionPreviewForRunWithDependencies(
    input,
    await createDefaultCandidatePreviewDependencies(),
  );
}

export async function getCandidateExtractionPreviewForRunWithDependencies(
  input: CandidateExtractionPreviewInput,
  dependencies: CandidatePreviewProviderDependencies,
): Promise<CandidateExtractionPreviewResult> {
  const discoveryRunId = isNonEmptyString(input?.discoveryRunId)
    ? normalizeUuid(input.discoveryRunId)
    : null;
  const discoverySourceId = isNonEmptyString(input?.discoverySourceId)
    ? normalizeUuid(input.discoverySourceId)
    : null;
  const requestingAdminActorId = isNonEmptyString(
    input?.requestingAdminActorId,
  )
    ? input.requestingAdminActorId.trim()
    : null;
  const expectedSchemaVersion =
    input?.expectedSchemaVersion ?? CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION;

  if (!discoveryRunId) {
    return rejectPreview("missing_discovery_run_id");
  }

  if (!discoverySourceId) {
    return rejectPreview("missing_discovery_source_id", { discoveryRunId });
  }

  if (!requestingAdminActorId) {
    return rejectPreview("missing_admin_actor", {
      discoveryRunId,
      discoverySourceId,
    });
  }

  try {
    const run = await dependencies.loadDiscoveryRun(discoveryRunId);

    if (!run) {
      return rejectPreview("discovery_run_not_found", {
        discoveryRunId,
        discoverySourceId,
      });
    }

    if (run.id !== discoveryRunId || run.source_id !== discoverySourceId) {
      return rejectPreview("discovery_run_source_mismatch", {
        discoveryRunId,
        discoverySourceId,
      });
    }

    let source: DiscoverySourceRow | null = null;

    if (dependencies.loadDiscoverySource) {
      source = await dependencies.loadDiscoverySource(discoverySourceId);

      if (!source || source.id !== discoverySourceId) {
        return rejectPreview("discovery_run_source_mismatch", {
          discoveryRunId,
          discoverySourceId,
        });
      }
    }

    const artifacts = await dependencies.loadPreviewArtifacts({
      discoveryRunId,
      discoverySourceId,
    });
    const artifactResult = chooseArtifactResult(artifacts);

    if ("accepted" in artifactResult) {
      return artifactResult;
    }

    return validateReviewableArtifact(
      artifactResult,
      run,
      {
        discoveryRunId,
        discoverySourceId,
        requestingAdminActorId,
        expectedSchemaVersion,
      },
      source,
    );
  } catch {
    return rejectPreview("preview_artifact_unavailable", {
      discoveryRunId,
      discoverySourceId,
    });
  }
}
