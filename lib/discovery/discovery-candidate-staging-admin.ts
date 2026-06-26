import "server-only";

import type { SafeDiscoveryCandidateToolInsert } from "../discovery-candidate-normalizer";
import type { Database } from "../supabase/database.types";
import type { DiscoverySupabaseAdminClient } from "./discovery-supabase-admin";

export type NormalizedDiscoveryCandidate = SafeDiscoveryCandidateToolInsert;

export type StageNormalizedDiscoveryCandidateInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  normalizedCandidate: NormalizedDiscoveryCandidate;
  actorId?: string | null;
};

export type StageNormalizedDiscoveryCandidateResult =
  | {
      ok: true;
      candidateId: string;
      candidateStatus: "staged";
      discoveryRunId: string;
      discoverySourceId: string;
      auditCorrelationId: string | null;
    }
  | {
      ok: false;
      error: {
        code:
          | "invalid_input"
          | "missing_audit_correlation_id"
          | "database_insert_failed"
          | "unexpected_error";
        message: string;
        details?: unknown;
      };
      discoveryRunId?: string;
      discoverySourceId?: string;
      auditCorrelationId?: string | null;
    };

type DiscoveryCandidateToolInsert =
  Database["public"]["Tables"]["discovery_candidate_tools"]["Insert"];

type DiscoveryCandidateToolStageResult = Pick<
  Database["public"]["Tables"]["discovery_candidate_tools"]["Row"],
  "audit_correlation_id" | "candidate_status" | "discovery_run_id" | "id"
>;

type CandidateStagingAdminClient = Pick<DiscoverySupabaseAdminClient, "from">;

export type CandidateStagingAdminClientFactory = () =>
  | CandidateStagingAdminClient
  | Promise<CandidateStagingAdminClient>;

const INSERT_SELECT_COLUMNS =
  "id,candidate_status,discovery_run_id,audit_correlation_id";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function invalidInput(
  input: Partial<StageNormalizedDiscoveryCandidateInput> = {},
): StageNormalizedDiscoveryCandidateResult {
  return {
    ok: false,
    error: {
      code: "invalid_input",
      message: "Invalid normalized discovery candidate.",
    },
    discoveryRunId: isNonEmptyString(input.discoveryRunId)
      ? input.discoveryRunId.trim()
      : undefined,
    discoverySourceId: isNonEmptyString(input.discoverySourceId)
      ? input.discoverySourceId.trim()
      : undefined,
    auditCorrelationId: isNonEmptyString(
      input.normalizedCandidate?.audit_correlation_id,
    )
      ? input.normalizedCandidate.audit_correlation_id
      : null,
  };
}

function missingAuditCorrelationId(
  input: StageNormalizedDiscoveryCandidateInput,
): StageNormalizedDiscoveryCandidateResult {
  return {
    ok: false,
    error: {
      code: "missing_audit_correlation_id",
      message: "Missing audit correlation ID.",
    },
    discoveryRunId: input.discoveryRunId.trim(),
    discoverySourceId: input.discoverySourceId.trim(),
    auditCorrelationId: null,
  };
}

function databaseInsertFailed(
  input: StageNormalizedDiscoveryCandidateInput,
): StageNormalizedDiscoveryCandidateResult {
  return {
    ok: false,
    error: {
      code: "database_insert_failed",
      message: "Candidate staging insert failed.",
    },
    discoveryRunId: input.discoveryRunId.trim(),
    discoverySourceId: input.discoverySourceId.trim(),
    auditCorrelationId: input.normalizedCandidate.audit_correlation_id ?? null,
  };
}

function unexpectedError(
  input: StageNormalizedDiscoveryCandidateInput,
): StageNormalizedDiscoveryCandidateResult {
  return {
    ok: false,
    error: {
      code: "unexpected_error",
      message: "Unexpected candidate staging error.",
    },
    discoveryRunId: isNonEmptyString(input.discoveryRunId)
      ? input.discoveryRunId.trim()
      : undefined,
    discoverySourceId: isNonEmptyString(input.discoverySourceId)
      ? input.discoverySourceId.trim()
      : undefined,
    auditCorrelationId: input.normalizedCandidate?.audit_correlation_id ?? null,
  };
}

function isValidNormalizedCandidate(
  input: StageNormalizedDiscoveryCandidateInput,
): boolean {
  const candidate = input.normalizedCandidate;
  const discoveryRunId = input.discoveryRunId.trim();

  return (
    candidate !== null &&
    typeof candidate === "object" &&
    candidate.discovery_run_id === discoveryRunId &&
    candidate.candidate_status === "staged" &&
    candidate.source_evidence_kind === "static_html_derived_evidence" &&
    candidate.extraction_mode === "deterministic_static_evidence" &&
    candidate.reviewed_at === null &&
    candidate.reviewed_by === null &&
    candidate.review_notes === null &&
    candidate.rejection_reason_code === null &&
    candidate.cleanup_status === "active" &&
    candidate.eligible_for_cleanup_at === null &&
    candidate.archived_at === null
  );
}

function toDiscoveryCandidateToolInsert(
  input: StageNormalizedDiscoveryCandidateInput,
): DiscoveryCandidateToolInsert {
  const candidate = input.normalizedCandidate;

  return {
    archived_at: null,
    audit_correlation_id: candidate.audit_correlation_id,
    candidate_app_links: candidate.candidate_app_links,
    candidate_canonical_url: candidate.candidate_canonical_url,
    candidate_category_hint: candidate.candidate_category_hint,
    candidate_description: candidate.candidate_description,
    candidate_name: candidate.candidate_name,
    candidate_normalized_domain: candidate.candidate_normalized_domain,
    candidate_platform_hints: candidate.candidate_platform_hints,
    candidate_pricing_hint: candidate.candidate_pricing_hint,
    candidate_social_links: candidate.candidate_social_links,
    candidate_status: "staged",
    candidate_website_url: candidate.candidate_website_url,
    cleanup_status: "active",
    confidence_bucket: candidate.confidence_bucket,
    discovery_run_id: input.discoveryRunId.trim(),
    duplicate_blocking: candidate.duplicate_blocking,
    duplicate_check_status: candidate.duplicate_check_status,
    duplicate_checked_at: candidate.duplicate_checked_at,
    duplicate_signal_types: candidate.duplicate_signal_types,
    eligible_for_cleanup_at: null,
    evidence_summary: candidate.evidence_summary,
    extraction_mode: candidate.extraction_mode,
    extraction_version: candidate.extraction_version,
    possible_duplicate_candidate_id: candidate.possible_duplicate_candidate_id,
    possible_duplicate_discovered_tool_id:
      candidate.possible_duplicate_discovered_tool_id,
    possible_duplicate_tool_id: candidate.possible_duplicate_tool_id,
    rejection_reason_code: null,
    review_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    risk_flags: candidate.risk_flags,
    source_domain: candidate.source_domain,
    source_evidence_kind: candidate.source_evidence_kind,
    source_evidence_locator: candidate.source_evidence_locator,
    source_url: candidate.source_url,
    source_url_normalized: candidate.source_url_normalized,
  };
}

async function createDefaultDiscoverySupabaseAdminClient() {
  const { createDiscoverySupabaseAdminClient } = await import(
    "./discovery-supabase-admin"
  );

  return createDiscoverySupabaseAdminClient();
}

export async function stageNormalizedDiscoveryCandidate(
  input: StageNormalizedDiscoveryCandidateInput,
): Promise<StageNormalizedDiscoveryCandidateResult> {
  return stageNormalizedDiscoveryCandidateWithClientFactory(
    input,
    createDefaultDiscoverySupabaseAdminClient,
  );
}

export async function stageNormalizedDiscoveryCandidateWithClientFactory(
  input: StageNormalizedDiscoveryCandidateInput,
  createClient: CandidateStagingAdminClientFactory,
): Promise<StageNormalizedDiscoveryCandidateResult> {
  if (
    !input ||
    !isNonEmptyString(input.discoveryRunId) ||
    !isNonEmptyString(input.discoverySourceId) ||
    !input.normalizedCandidate
  ) {
    return invalidInput(input);
  }

  if (!isValidNormalizedCandidate(input)) {
    return invalidInput(input);
  }

  if (!isNonEmptyString(input.normalizedCandidate.audit_correlation_id)) {
    return missingAuditCorrelationId(input);
  }

  const insertPayload = toDiscoveryCandidateToolInsert(input);

  try {
    const client = await createClient();
    const { data, error } = await client
      .from("discovery_candidate_tools")
      .insert(insertPayload)
      .select(INSERT_SELECT_COLUMNS)
      .single();

    if (error || !data || data.candidate_status !== "staged") {
      return databaseInsertFailed(input);
    }

    const stagedCandidate = data as DiscoveryCandidateToolStageResult;

    return {
      ok: true,
      candidateId: stagedCandidate.id,
      candidateStatus: "staged",
      discoveryRunId: stagedCandidate.discovery_run_id,
      discoverySourceId: input.discoverySourceId.trim(),
      auditCorrelationId: stagedCandidate.audit_correlation_id,
    };
  } catch {
    return unexpectedError(input);
  }
}
