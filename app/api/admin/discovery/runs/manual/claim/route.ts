import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
  type VerifiedAdminActor,
} from "../../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../../lib/admin-rate-limit";
import {
  MANUAL_CRAWLER_SOURCE_KIND,
  validateManualCrawlerSource,
  type ManualCrawlerSource,
} from "../../../../../../../lib/discovery-manual-crawler";
import {
  buildDiscoveryRequestPlans,
  type DiscoveryRequestPlan,
} from "../../../../../../../lib/discovery-request-plan";
import {
  DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES,
  executeDiscoveryFetchMetadataOnly,
  type DiscoveryFetchPlan,
  type DiscoveryFetchResult,
} from "../../../../../../../lib/discovery-fetch-adapter";
import {
  createManualMetadataFetchAdapterFailureResult,
  createManualMetadataFetchResult,
  summarizeManualMetadataFetchResults,
  type ManualMetadataFetchResult,
  type ManualMetadataFetchSummary,
} from "../../../../../../../lib/discovery-manual-metadata-fetch";
import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 4 * 1024;
const STALE_RUNNING_TIMEOUT_MINUTES = 30;
const STALE_RUNNING_TIMEOUT_MS = STALE_RUNNING_TIMEOUT_MINUTES * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METADATA_FETCH_SMOKE_EXECUTION_MODE = "metadata_fetch_smoke";
const MANUAL_METADATA_FETCH_EXECUTION_MODE = "manual_metadata_fetch";
const MANUAL_METADATA_FETCH_MAX_URLS = 3;
const RUN_SELECT = [
  "id",
  "source_id",
  "status",
  "stats",
  "error_log",
  "started_at",
  "finished_at",
  "created_at",
  "updated_at",
].join(", ");

type JsonRecord = Record<string, unknown>;

type DiscoveryRunRecord = {
  id: string;
  source_id: string | null;
  status: string;
  stats: JsonRecord;
  error_log: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type RunningDiscoveryRunRecord = DiscoveryRunRecord;

type AuditEventType =
  | "manual_crawler_executor_claim_attempted"
  | "manual_crawler_executor_claim_succeeded"
  | "manual_crawler_executor_claim_rejected"
  | "manual_crawler_stale_run_recovered"
  | "manual_crawler_executor_dry_run_completed"
  | "manual_crawler_executor_failed"
  | "request_plan_preflight_started"
  | "request_plan_preflight_passed"
  | "request_plan_preflight_rejected"
  | "metadata_fetch_smoke_started"
  | "metadata_fetch_smoke_completed"
  | "metadata_fetch_smoke_failed"
  | "manual_metadata_fetch_started"
  | "manual_metadata_fetch_url_completed"
  | "manual_metadata_fetch_url_failed"
  | "manual_metadata_fetch_completed"
  | "manual_metadata_fetch_failed";

type ClaimExecutionMode =
  | "dry_run"
  | "metadata_fetch_smoke"
  | "manual_metadata_fetch";

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (contentLength > MAX_BODY_SIZE_BYTES) {
    throw new Error("Request is too large.");
  }

  const body = await request.json().catch(() => null);

  if (!isRecord(body)) {
    throw new Error("Invalid request body.");
  }

  return body;
}

function getRequiredUuid(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a valid ID.`);
  }

  return value;
}

function getClaimExecutionMode(value: unknown): ClaimExecutionMode {
  if (typeof value === "undefined") {
    return "dry_run";
  }

  if (value === METADATA_FETCH_SMOKE_EXECUTION_MODE) {
    return METADATA_FETCH_SMOKE_EXECUTION_MODE;
  }

  if (value === MANUAL_METADATA_FETCH_EXECUTION_MODE) {
    return MANUAL_METADATA_FETCH_EXECUTION_MODE;
  }

  throw new Error("Invalid execution mode.");
}

function validateDryRunStats(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Discovery run stats must be valid.");
  }

  if (value.execution_enabled !== false) {
    throw new Error("Discovery run execution must be disabled.");
  }

  if (value.no_fetch_performed !== true) {
    throw new Error("Discovery run must confirm no fetch was performed.");
  }

  if (value.no_candidates_inserted !== true) {
    throw new Error("Discovery run must confirm no candidates were inserted.");
  }

  if (value.no_public_tools_inserted !== true) {
    throw new Error("Discovery run must confirm no public tools were inserted.");
  }

  return value;
}

function getActorLabel(actor: VerifiedAdminActor) {
  return actor.label || actor.id || "AiFinder Admin";
}

function createDrySafetyMetadata() {
  return {
    source_kind: MANUAL_CRAWLER_SOURCE_KIND,
    executor_mode: "dry_run",
    dry_run: true,
    execution_enabled: false,
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
  };
}

function createMetadataFetchSmokeSafetyMetadata(noFetchPerformed: boolean) {
  return {
    source_kind: MANUAL_CRAWLER_SOURCE_KIND,
    executor_mode: METADATA_FETCH_SMOKE_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    no_fetch_performed: noFetchPerformed,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
  };
}

function createManualMetadataFetchSafetyMetadata(noFetchPerformed: boolean) {
  return {
    source_kind: MANUAL_CRAWLER_SOURCE_KIND,
    executor_mode: MANUAL_METADATA_FETCH_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    no_fetch_performed: noFetchPerformed,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
  };
}

async function writeAuditEvent({
  actor,
  eventType,
  runId,
  sourceId,
  message,
  metadata = {},
  safetyMetadata = createDrySafetyMetadata(),
}: {
  actor: VerifiedAdminActor;
  eventType: AuditEventType;
  runId: string;
  sourceId: string;
  message: string;
  metadata?: JsonRecord;
  safetyMetadata?: JsonRecord;
}) {
  const { error } = await supabaseAdmin.from("discovery_audit_events").insert({
    discovered_tool_id: null,
    action: "flag",
    actor_id: actor.id,
    actor_label: actor.label,
    message,
    metadata: {
      ...metadata,
      event_type: eventType,
      run_id: runId,
      source_id: sourceId,
      ...safetyMetadata,
    },
  });

  if (error) {
    console.error("Failed to write manual crawler executor audit event.", {
      eventType,
      runId,
      sourceId,
      message: error.message,
    });

    return false;
  }

  return true;
}

function coerceRunRecord(value: unknown) {
  return value as DiscoveryRunRecord;
}

function coerceRunRecords(value: unknown) {
  return (Array.isArray(value) ? value : []) as RunningDiscoveryRunRecord[];
}

function getRunningRunTimestamp(run: RunningDiscoveryRunRecord) {
  return run.started_at || run.updated_at || run.created_at;
}

function isStaleRunningRun(run: RunningDiscoveryRunRecord, nowMs: number) {
  const timestamp = getRunningRunTimestamp(run);
  const parsed = Date.parse(timestamp);

  return Number.isFinite(parsed) && nowMs - parsed > STALE_RUNNING_TIMEOUT_MS;
}

function getManualCuratedUrlValues(stats: JsonRecord) {
  if (!Array.isArray(stats.policy_reviews) || stats.policy_reviews.length === 0) {
    return null;
  }

  return stats.policy_reviews.map((policyReview) =>
    isRecord(policyReview) ? policyReview.url : undefined
  );
}

function buildManualCuratedRequestPlans({
  stats,
  createdAt,
}: {
  stats: JsonRecord;
  createdAt: string;
}):
  | { ok: true; plans: DiscoveryRequestPlan[] }
  | { ok: false; reason: string } {
  const urls = getManualCuratedUrlValues(stats);

  if (!urls) {
    return { ok: false, reason: "missing_manual_curated_urls" };
  }

  return buildDiscoveryRequestPlans(urls, createdAt);
}

function createClaimStats({
  stats,
  claimedAt,
  actor,
  requestPlans,
}: {
  stats: JsonRecord;
  claimedAt: string;
  actor: VerifiedAdminActor;
  requestPlans: DiscoveryRequestPlan[];
}) {
  return {
    ...stats,
    executor_mode: "dry_run",
    dry_run: true,
    execution_enabled: false,
    execution_status: "dry_executor_validation_claimed",
    claimed_at: claimedAt,
    claimed_by: getActorLabel(actor),
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    request_plan_preflight: {
      status: "passed",
      plans: requestPlans,
    },
  };
}

function createCompletedDryRunStats({
  stats,
  completedAt,
  actor,
}: {
  stats: JsonRecord;
  completedAt: string;
  actor: VerifiedAdminActor;
}) {
  return {
    ...stats,
    executor_mode: "dry_run",
    dry_run: true,
    execution_enabled: false,
    execution_status: "dry_executor_validation_completed",
    processed_urls: 0,
    fetched_urls: 0,
    extracted_candidates: 0,
    inserted_discovered_tools: 0,
    inserted_public_tools: 0,
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    completed_at: completedAt,
    completed_by: getActorLabel(actor),
  };
}

function createMetadataFetchSmokeClaimStats({
  stats,
  claimedAt,
  actor,
  requestPlans,
}: {
  stats: JsonRecord;
  claimedAt: string;
  actor: VerifiedAdminActor;
  requestPlans: DiscoveryRequestPlan[];
}) {
  return {
    ...stats,
    executor_mode: METADATA_FETCH_SMOKE_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    execution_status: "metadata_fetch_smoke_claimed",
    claimed_at: claimedAt,
    claimed_by: getActorLabel(actor),
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    request_plan_preflight: {
      status: "passed",
      plans: requestPlans,
    },
  };
}

function createMetadataFetchSmokeCompletedStats({
  stats,
  completedAt,
  actor,
  fetchResult,
}: {
  stats: JsonRecord;
  completedAt: string;
  actor: VerifiedAdminActor;
  fetchResult: Extract<DiscoveryFetchResult, { ok: true }>;
}) {
  return {
    ...stats,
    executor_mode: METADATA_FETCH_SMOKE_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    execution_status: "metadata_fetch_smoke_completed",
    processed_urls: 1,
    fetched_urls: 1,
    extracted_candidates: 0,
    inserted_discovered_tools: 0,
    inserted_public_tools: 0,
    no_fetch_performed: false,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    fetch_adapter_status: fetchResult.status,
    fetch_metadata: fetchResult.metadata,
    completed_at: completedAt,
    completed_by: getActorLabel(actor),
  };
}

function createMetadataFetchSmokeFailedStats({
  stats,
  failedAt,
  actor,
  reason,
  fetchResult,
}: {
  stats: JsonRecord;
  failedAt: string;
  actor: VerifiedAdminActor;
  reason: string;
  fetchResult?: Exclude<DiscoveryFetchResult, { ok: true }>;
}) {
  const reachedFetchPhase =
    fetchResult?.metadata.connectionPinnedToResolvedIp === true;

  return {
    ...stats,
    executor_mode: METADATA_FETCH_SMOKE_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    execution_status: "metadata_fetch_smoke_failed",
    reason,
    processed_urls: fetchResult ? 1 : 0,
    fetched_urls: 0,
    extracted_candidates: 0,
    inserted_discovered_tools: 0,
    inserted_public_tools: 0,
    no_fetch_performed: !reachedFetchPhase,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    ...(fetchResult
      ? {
          fetch_adapter_status: fetchResult.status,
          fetch_error_code: fetchResult.metadata.errorCode,
          fetch_metadata: fetchResult.metadata,
        }
      : {}),
    failed_at: failedAt,
    failed_by: getActorLabel(actor),
  };
}

function createManualMetadataFetchClaimStats({
  stats,
  claimedAt,
  actor,
  requestPlans,
}: {
  stats: JsonRecord;
  claimedAt: string;
  actor: VerifiedAdminActor;
  requestPlans: DiscoveryRequestPlan[];
}) {
  return {
    ...stats,
    executor_mode: MANUAL_METADATA_FETCH_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    execution_status: "manual_metadata_fetch_claimed",
    claimed_at: claimedAt,
    claimed_by: getActorLabel(actor),
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    total_urls: requestPlans.length,
    fetched_urls: 0,
    failed_urls: 0,
    skipped_urls: 0,
    fetch_results: [],
    request_plan_preflight: {
      status: "passed",
      plans: requestPlans,
    },
  };
}

function createManualMetadataFetchFinalStats({
  stats,
  finishedAt,
  actor,
  executionStatus,
  reason,
  summary,
  fetchResults,
}: {
  stats: JsonRecord;
  finishedAt: string;
  actor: VerifiedAdminActor;
  executionStatus: "manual_metadata_fetch_completed" | "manual_metadata_fetch_failed";
  reason?: string;
  summary: ManualMetadataFetchSummary;
  fetchResults: ManualMetadataFetchResult[];
}) {
  const noFetchPerformed = fetchResults.length === 0;

  return {
    ...stats,
    executor_mode: MANUAL_METADATA_FETCH_EXECUTION_MODE,
    dry_run: false,
    execution_enabled: true,
    execution_status: executionStatus,
    ...(reason ? { reason } : {}),
    processed_urls: summary.totalUrls,
    fetched_urls: summary.fetchedUrls,
    failed_urls: summary.failedUrls,
    skipped_urls: summary.skippedUrls,
    extracted_candidates: 0,
    inserted_discovered_tools: 0,
    inserted_public_tools: 0,
    no_fetch_performed: noFetchPerformed,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    total_urls: summary.totalUrls,
    fetch_results: fetchResults,
    ...(executionStatus === "manual_metadata_fetch_completed"
      ? {
          completed_at: finishedAt,
          completed_by: getActorLabel(actor),
        }
      : {
          failed_at: finishedAt,
          failed_by: getActorLabel(actor),
        }),
  };
}

function createManualMetadataFetchAuditMetadata({
  fetchResult,
  urlIndex,
}: {
  fetchResult: ManualMetadataFetchResult;
  urlIndex: number;
}) {
  return {
    url_index: urlIndex,
    normalized_url: fetchResult.normalized_url,
    hostname: fetchResult.hostname,
    status: fetchResult.status,
    http_status: fetchResult.http_status,
    content_type: fetchResult.content_type,
    content_length_header: fetchResult.content_length_header,
    resolved_ip_family: fetchResult.resolved_ip_family,
    bytes_read: fetchResult.bytes_read,
    response_truncated: fetchResult.response_truncated,
    duration_ms: fetchResult.duration_ms,
    error_code: fetchResult.error_code,
    failure_reason: fetchResult.failure_reason,
  };
}

function createMetadataFetchPlan(requestPlan: DiscoveryRequestPlan): DiscoveryFetchPlan {
  return {
    normalizedUrl: requestPlan.normalizedUrl,
    hostname: requestPlan.hostname,
    protocol: requestPlan.protocol,
    method: requestPlan.method,
    timeoutMs: requestPlan.timeoutMs,
    redirectLimit: 0,
    responseSizeLimitBytes: requestPlan.responseSizeLimitBytes,
    userAgent: requestPlan.userAgent,
    acceptedContentTypes: DISCOVERY_FETCH_ACCEPTED_CONTENT_TYPES,
    createdAt: requestPlan.createdAt,
  };
}

function createRejectedPreflightStats({
  stats,
  rejectedAt,
  actor,
  preflightFailureCode,
}: {
  stats: JsonRecord;
  rejectedAt: string;
  actor: VerifiedAdminActor;
  preflightFailureCode: string;
}) {
  return {
    ...stats,
    executor_mode: "dry_run",
    dry_run: true,
    execution_enabled: false,
    execution_status: "rejected_preflight",
    reason: "rejected_preflight",
    preflight_failure_code: preflightFailureCode,
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    rejected_at: rejectedAt,
    rejected_by: getActorLabel(actor),
  };
}

function createRecoveredRunStats({
  stats,
  recoveredAt,
}: {
  stats: unknown;
  recoveredAt: string;
}) {
  const safeStats = isRecord(stats) ? stats : {};

  return {
    ...safeStats,
    dry_run: true,
    execution_enabled: false,
    execution_status: "stale_running_recovered",
    recovered_from_stale_running: true,
    recovery_reason: "timeout",
    timeout_minutes: STALE_RUNNING_TIMEOUT_MINUTES,
    recovered_at: recoveredAt,
    no_fetch_performed: true,
    no_extraction_performed: true,
    no_llm_analysis_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
  };
}

async function recoverStaleRunningRuns({
  actor,
  sourceId,
  targetRunId,
}: {
  actor: VerifiedAdminActor;
  sourceId: string;
  targetRunId: string;
}) {
  const { data: runningRuns, error } = await supabaseAdmin
    .from("discovery_runs")
    .select(RUN_SELECT)
    .eq("source_id", sourceId)
    .eq("status", "running")
    .neq("id", targetRunId)
    .order("started_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Failed to check running manual crawler runs.", {
      message: error.message,
      sourceId,
      runId: targetRunId,
    });

    throw new Error("Failed to check active discovery runs.");
  }

  const nowMs = Date.now();
  const staleRuns: RunningDiscoveryRunRecord[] = [];
  const activeRuns: RunningDiscoveryRunRecord[] = [];

  for (const runningRun of coerceRunRecords(runningRuns)) {
    if (isStaleRunningRun(runningRun, nowMs)) {
      staleRuns.push(runningRun);
    } else {
      activeRuns.push(runningRun);
    }
  }

  for (const staleRun of staleRuns) {
    const recoveredAt = new Date().toISOString();
    const recoveredStats = createRecoveredRunStats({
      stats: staleRun.stats,
      recoveredAt,
    });

    const { data: recoveredRun, error: recoveryError } = await supabaseAdmin
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: recoveredAt,
        updated_at: recoveredAt,
        error_log: "Manual crawler run exceeded timeout threshold.",
        stats: recoveredStats,
      })
      .eq("id", staleRun.id)
      .eq("status", "running")
      .select(RUN_SELECT)
      .maybeSingle();

    if (recoveryError) {
      console.error("Failed to recover stale manual crawler run.", {
        message: recoveryError.message,
        sourceId,
        staleRunId: staleRun.id,
      });

      throw new Error("Failed to recover stale discovery run.");
    }

    if (recoveredRun) {
      await writeAuditEvent({
        actor,
        eventType: "manual_crawler_stale_run_recovered",
        runId: staleRun.id,
        sourceId,
        message: "Stale manual crawler dry run recovered before executor claim.",
        metadata: {
          recovered_at: recoveredAt,
          timeout_minutes: STALE_RUNNING_TIMEOUT_MINUTES,
          recovery_reason: "timeout",
          target_run_id: targetRunId,
        },
      });
    }
  }

  return activeRuns;
}

async function completeMetadataFetchSmokeRun({
  actor,
  claimedRun,
  sourceId,
  requestPlans,
}: {
  actor: VerifiedAdminActor;
  claimedRun: DiscoveryRunRecord;
  sourceId: string;
  requestPlans: DiscoveryRequestPlan[];
}) {
  if (requestPlans.length !== 1) {
    const failedAt = new Date().toISOString();
    const failedStats = createMetadataFetchSmokeFailedStats({
      stats: claimedRun.stats,
      failedAt,
      actor,
      reason: "metadata_fetch_smoke_requires_single_url",
    });
    const { data: failedRun, error } = await supabaseAdmin
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: failedAt,
        updated_at: failedAt,
        error_log: "Metadata-fetch smoke mode requires exactly one request plan.",
        stats: failedStats,
      })
      .eq("id", claimedRun.id)
      .eq("status", "running")
      .select(RUN_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Failed to reject metadata-fetch smoke run plan count.", {
        message: error.message,
        runId: claimedRun.id,
        sourceId,
      });

      return jsonResponse({ error: "Failed to reject metadata-fetch smoke run." }, 500);
    }

    if (!failedRun) {
      return jsonResponse({ error: "Discovery run changed state before fetch." }, 409);
    }

    await writeAuditEvent({
      actor,
      eventType: "metadata_fetch_smoke_failed",
      runId: claimedRun.id,
      sourceId,
      message: "Metadata-fetch smoke mode rejected a run without exactly one request plan.",
      metadata: {
        fetch_adapter_status: "metadata_fetch_smoke_requires_single_url",
      },
      safetyMetadata: createMetadataFetchSmokeSafetyMetadata(true),
    });

    return jsonResponse(
      {
        error: "Metadata-fetch smoke mode requires exactly one URL.",
        data: { reason: "metadata_fetch_smoke_requires_single_url" },
      },
      422
    );
  }

  const requestPlan = requestPlans[0];

  if (!requestPlan) {
    return jsonResponse({ error: "Metadata-fetch plan was unavailable." }, 500);
  }

  const started = await writeAuditEvent({
    actor,
    eventType: "metadata_fetch_smoke_started",
    runId: claimedRun.id,
    sourceId,
    message: "Metadata-fetch smoke adapter started after validated request-plan preflight.",
    metadata: {
      fetch_adapter_status: "metadata_fetch_smoke_started",
    },
    safetyMetadata: createMetadataFetchSmokeSafetyMetadata(true),
  });

  if (!started) {
    return jsonResponse({ error: "Failed to audit metadata-fetch smoke start." }, 500);
  }

  const fetchResult = await executeDiscoveryFetchMetadataOnly(
    createMetadataFetchPlan(requestPlan)
  );

  if (fetchResult.ok) {
    const completedAt = new Date().toISOString();
    const completedStats = createMetadataFetchSmokeCompletedStats({
      stats: claimedRun.stats,
      completedAt,
      actor,
      fetchResult,
    });
    const { data: completedRun, error } = await supabaseAdmin
      .from("discovery_runs")
      .update({
        status: "completed",
        finished_at: completedAt,
        updated_at: completedAt,
        error_log: null,
        stats: completedStats,
      })
      .eq("id", claimedRun.id)
      .eq("status", "running")
      .select(RUN_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Failed to complete metadata-fetch smoke run.", {
        message: error.message,
        runId: claimedRun.id,
        sourceId,
      });

      return jsonResponse({ error: "Failed to complete metadata-fetch smoke run." }, 500);
    }

    if (!completedRun) {
      return jsonResponse({ error: "Discovery run changed state before completion." }, 409);
    }

    const completedRunRecord = coerceRunRecord(completedRun);
    const completedAudit = await writeAuditEvent({
      actor,
      eventType: "metadata_fetch_smoke_completed",
      runId: completedRunRecord.id,
      sourceId,
      message: "Metadata-fetch smoke adapter completed without extraction or inserts.",
      metadata: {
        fetch_adapter_status: fetchResult.status,
      },
      safetyMetadata: createMetadataFetchSmokeSafetyMetadata(false),
    });

    if (!completedAudit) {
      return jsonResponse(
        { error: "Metadata-fetch smoke completed but could not be audited." },
        500
      );
    }

    return jsonResponse({
      data: {
        run: completedRunRecord,
        execution: {
          enabled: true,
          mode: METADATA_FETCH_SMOKE_EXECUTION_MODE,
          status: "metadata_fetch_smoke_completed",
          message: "Metadata-only fetch completed without extraction or inserts.",
        },
      },
    });
  }

  const failedAt = new Date().toISOString();
  const failedStats = createMetadataFetchSmokeFailedStats({
    stats: claimedRun.stats,
    failedAt,
    actor,
    reason: fetchResult.status,
    fetchResult,
  });
  const { data: failedRun, error } = await supabaseAdmin
    .from("discovery_runs")
    .update({
      status: "failed",
      finished_at: failedAt,
      updated_at: failedAt,
      error_log: "Metadata-fetch smoke adapter failed safely.",
      stats: failedStats,
    })
    .eq("id", claimedRun.id)
    .eq("status", "running")
    .select(RUN_SELECT)
    .maybeSingle();

  if (error) {
    console.error("Failed to record metadata-fetch smoke adapter failure.", {
      message: error.message,
      runId: claimedRun.id,
      sourceId,
      adapterStatus: fetchResult.status,
    });

    return jsonResponse({ error: "Failed to record metadata-fetch smoke failure." }, 500);
  }

  if (!failedRun) {
    return jsonResponse({ error: "Discovery run changed state before fetch failure." }, 409);
  }

  const failedAudit = await writeAuditEvent({
    actor,
    eventType: "metadata_fetch_smoke_failed",
    runId: claimedRun.id,
    sourceId,
    message: "Metadata-fetch smoke adapter failed without extraction or inserts.",
    metadata: {
      fetch_adapter_status: fetchResult.status,
      error_code: fetchResult.metadata.errorCode,
    },
    safetyMetadata: createMetadataFetchSmokeSafetyMetadata(
      fetchResult.metadata.connectionPinnedToResolvedIp === false
    ),
  });

  if (!failedAudit) {
    return jsonResponse(
      { error: "Metadata-fetch smoke failed but could not be audited." },
      500
    );
  }

  return jsonResponse(
    {
      error: "Metadata-fetch smoke adapter failed safely.",
      data: { reason: fetchResult.status },
    },
    422
  );
}

async function completeManualMetadataFetchRun({
  actor,
  claimedRun,
  sourceId,
  requestPlans,
}: {
  actor: VerifiedAdminActor;
  claimedRun: DiscoveryRunRecord;
  sourceId: string;
  requestPlans: DiscoveryRequestPlan[];
}) {
  if (
    requestPlans.length < 1 ||
    requestPlans.length > MANUAL_METADATA_FETCH_MAX_URLS
  ) {
    const failedAt = new Date().toISOString();
    const reason =
      requestPlans.length < 1
        ? "manual_metadata_fetch_requires_at_least_one_url"
        : "manual_metadata_fetch_url_cap_exceeded";
    const summary: ManualMetadataFetchSummary = {
      totalUrls: requestPlans.length,
      fetchedUrls: 0,
      failedUrls: 0,
      skippedUrls: requestPlans.length,
    };
    const failedStats = createManualMetadataFetchFinalStats({
      stats: claimedRun.stats,
      finishedAt: failedAt,
      actor,
      executionStatus: "manual_metadata_fetch_failed",
      reason,
      summary,
      fetchResults: [],
    });
    const { data: failedRun, error } = await supabaseAdmin
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: failedAt,
        updated_at: failedAt,
        error_log: "Manual metadata fetch mode rejected the request-plan count.",
        stats: failedStats,
      })
      .eq("id", claimedRun.id)
      .eq("status", "running")
      .select(RUN_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Failed to reject manual metadata fetch run plan count.", {
        message: error.message,
        runId: claimedRun.id,
        sourceId,
      });

      return jsonResponse(
        { error: "Failed to reject manual metadata fetch run." },
        500
      );
    }

    if (!failedRun) {
      return jsonResponse({ error: "Discovery run changed state before fetch." }, 409);
    }

    await writeAuditEvent({
      actor,
      eventType: "manual_metadata_fetch_failed",
      runId: claimedRun.id,
      sourceId,
      message: "Manual metadata fetch mode rejected a request-plan count outside its cap.",
      metadata: {
        reason,
        total_urls: requestPlans.length,
      },
      safetyMetadata: createManualMetadataFetchSafetyMetadata(true),
    });

    return jsonResponse(
      {
        error: "Manual metadata fetch mode supports between one and three URLs.",
        data: { reason },
      },
      422
    );
  }

  const started = await writeAuditEvent({
    actor,
    eventType: "manual_metadata_fetch_started",
    runId: claimedRun.id,
    sourceId,
    message: "Manual metadata fetch executor started after validated request-plan preflight.",
    metadata: {
      total_urls: requestPlans.length,
    },
    safetyMetadata: createManualMetadataFetchSafetyMetadata(true),
  });

  if (!started) {
    return jsonResponse({ error: "Failed to audit manual metadata fetch start." }, 500);
  }

  const fetchResults: ManualMetadataFetchResult[] = [];
  let urlAuditFailed = false;

  for (const [urlIndex, requestPlan] of requestPlans.entries()) {
    let safeFetchResult: ManualMetadataFetchResult;

    try {
      const fetchResult = await executeDiscoveryFetchMetadataOnly(
        createMetadataFetchPlan(requestPlan)
      );
      safeFetchResult = createManualMetadataFetchResult(fetchResult);
    } catch {
      safeFetchResult = createManualMetadataFetchAdapterFailureResult({
        normalizedUrl: requestPlan.normalizedUrl,
        hostname: requestPlan.hostname,
      });
    }

    fetchResults.push(safeFetchResult);

    const urlAudit = await writeAuditEvent({
      actor,
      eventType:
        safeFetchResult.status === "fetch_completed_metadata_only"
          ? "manual_metadata_fetch_url_completed"
          : "manual_metadata_fetch_url_failed",
      runId: claimedRun.id,
      sourceId,
      message:
        safeFetchResult.status === "fetch_completed_metadata_only"
          ? "Manual metadata fetch completed without extraction or inserts."
          : "Manual metadata fetch failed safely without extraction or inserts.",
      metadata: createManualMetadataFetchAuditMetadata({
        fetchResult: safeFetchResult,
        urlIndex: urlIndex + 1,
      }),
      safetyMetadata: createManualMetadataFetchSafetyMetadata(false),
    });

    if (!urlAudit) {
      urlAuditFailed = true;
    }
  }

  const summary = summarizeManualMetadataFetchResults(fetchResults);
  const completedAt = new Date().toISOString();
  const hasSuccessfulFetch = summary.fetchedUrls > 0;
  const reason = hasSuccessfulFetch ? undefined : "manual_metadata_fetch_all_failed";
  const finalStats = createManualMetadataFetchFinalStats({
    stats: claimedRun.stats,
    finishedAt: completedAt,
    actor,
    executionStatus: hasSuccessfulFetch
      ? "manual_metadata_fetch_completed"
      : "manual_metadata_fetch_failed",
    reason,
    summary,
    fetchResults,
  });
  const { data: finalRun, error } = await supabaseAdmin
    .from("discovery_runs")
    .update({
      status: hasSuccessfulFetch ? "completed" : "failed",
      finished_at: completedAt,
      updated_at: completedAt,
      error_log: hasSuccessfulFetch
        ? null
        : "Manual metadata fetch executor completed without successful fetches.",
      stats: finalStats,
    })
    .eq("id", claimedRun.id)
    .eq("status", "running")
    .select(RUN_SELECT)
    .maybeSingle();

  if (error) {
    console.error("Failed to finalize manual metadata fetch run.", {
      message: error.message,
      runId: claimedRun.id,
      sourceId,
    });

    return jsonResponse({ error: "Failed to finalize manual metadata fetch run." }, 500);
  }

  if (!finalRun) {
    return jsonResponse({ error: "Discovery run changed state before completion." }, 409);
  }

  const finalRunRecord = coerceRunRecord(finalRun);
  const terminalAudit = await writeAuditEvent({
    actor,
    eventType: hasSuccessfulFetch
      ? "manual_metadata_fetch_completed"
      : "manual_metadata_fetch_failed",
    runId: finalRunRecord.id,
    sourceId,
    message: hasSuccessfulFetch
      ? "Manual metadata fetch executor completed without extraction or inserts."
      : "Manual metadata fetch executor failed without successful fetches.",
    metadata: {
      ...(reason ? { reason } : {}),
      total_urls: summary.totalUrls,
      fetched_urls: summary.fetchedUrls,
      failed_urls: summary.failedUrls,
      skipped_urls: summary.skippedUrls,
    },
    safetyMetadata: createManualMetadataFetchSafetyMetadata(false),
  });

  if (!terminalAudit || urlAuditFailed) {
    return jsonResponse(
      {
        error: hasSuccessfulFetch
          ? "Manual metadata fetch completed but could not be fully audited."
          : "Manual metadata fetch failed but could not be fully audited.",
      },
      500
    );
  }

  if (!hasSuccessfulFetch) {
    return jsonResponse(
      {
        error: "Manual metadata fetch completed without successful fetches.",
        data: { reason },
      },
      422
    );
  }

  return jsonResponse({
    data: {
      run: finalRunRecord,
      execution: {
        enabled: true,
        mode: MANUAL_METADATA_FETCH_EXECUTION_MODE,
        status: "manual_metadata_fetch_completed",
        message: "Manual metadata fetch completed without extraction or inserts.",
      },
    },
  });
}

export async function POST(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized manual crawler executor claim request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  const rateLimit = checkAdminRateLimit({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryManualCrawlerExecutorRun,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
  }

  let body: JsonRecord;

  try {
    body = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      400
    );
  }

  let runId = "";
  let executionMode: ClaimExecutionMode;

  try {
    runId = getRequiredUuid(body.run_id, "Discovery run ID");
    executionMode = getClaimExecutionMode(body.execution_mode);
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Invalid discovery run request.",
      },
      400
    );
  }

  const { data: discoveryRun, error: runError } = await supabaseAdmin
    .from("discovery_runs")
    .select(RUN_SELECT)
    .eq("id", runId)
    .maybeSingle();

  if (runError) {
    console.error("Failed to load manual crawler run for executor claim.", {
      message: runError.message,
      runId,
    });

    return jsonResponse({ error: "Failed to load discovery run." }, 500);
  }

  if (!discoveryRun) {
    return jsonResponse({ error: "Discovery run not found." }, 404);
  }

  const runRecord = coerceRunRecord(discoveryRun);

  if (runRecord.status !== "pending") {
    return jsonResponse(
      { error: "Discovery run is not pending and cannot be claimed." },
      409
    );
  }

  if (!runRecord.source_id) {
    return jsonResponse(
      { error: "Discovery run is missing a discovery source." },
      400
    );
  }

  const { data: source, error: sourceError } = await supabaseAdmin
    .from("discovery_sources")
    .select("id, name, slug, source_type, config, is_active")
    .eq("id", runRecord.source_id)
    .maybeSingle();

  if (sourceError) {
    console.error("Failed to validate manual crawler executor source.", {
      message: sourceError.message,
      runId,
      sourceId: runRecord.source_id,
    });

    return jsonResponse({ error: "Failed to validate discovery source." }, 500);
  }

  if (!source) {
    return jsonResponse({ error: "Discovery source not found." }, 400);
  }

  try {
    validateManualCrawlerSource(source as ManualCrawlerSource);
    validateDryRunStats(runRecord.stats);
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Manual crawler run is not eligible for dry execution.",
      },
      400
    );
  }

  const preflightStartedAt = new Date().toISOString();
  const preflightStarted = await writeAuditEvent({
    actor: adminSession.actor,
    eventType: "request_plan_preflight_started",
    runId: runRecord.id,
    sourceId: runRecord.source_id,
    message: "Manual crawler dry executor request-plan preflight started.",
    metadata: {
      requested_url_count: Array.isArray(runRecord.stats.policy_reviews)
        ? runRecord.stats.policy_reviews.length
        : 0,
      preflight_started_at: preflightStartedAt,
    },
  });

  if (!preflightStarted) {
    return jsonResponse(
      { error: "Failed to audit request-plan preflight start." },
      500
    );
  }

  const requestPlanPreflight = buildManualCuratedRequestPlans({
    stats: runRecord.stats,
    createdAt: preflightStartedAt,
  });

  if (!requestPlanPreflight.ok) {
    const rejectedAt = new Date().toISOString();
    const rejectedStats = createRejectedPreflightStats({
      stats: runRecord.stats,
      rejectedAt,
      actor: adminSession.actor,
      preflightFailureCode: requestPlanPreflight.reason,
    });
    const { data: rejectedRun, error: rejectError } = await supabaseAdmin
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: rejectedAt,
        updated_at: rejectedAt,
        error_log: "Manual crawler request-plan preflight rejected the run.",
        stats: rejectedStats,
      })
      .eq("id", runRecord.id)
      .eq("status", "pending")
      .select(RUN_SELECT)
      .maybeSingle();

    if (rejectError) {
      console.error("Failed to record manual crawler request-plan rejection.", {
        message: rejectError.message,
        runId: runRecord.id,
        sourceId: runRecord.source_id,
        preflightFailureCode: requestPlanPreflight.reason,
      });

      return jsonResponse({ error: "Failed to record request-plan preflight rejection." }, 500);
    }

    if (!rejectedRun) {
      return jsonResponse(
        { error: "Discovery run was already claimed or is no longer pending." },
        409
      );
    }

    const rejectedRunRecord = coerceRunRecord(rejectedRun);
    const preflightRejected = await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "request_plan_preflight_rejected",
      runId: rejectedRunRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler request-plan preflight rejected the run without network activity.",
      metadata: {
        reason: "rejected_preflight",
        preflight_failure_code: requestPlanPreflight.reason,
        rejected_at: rejectedAt,
      },
    });

    if (!preflightRejected) {
      return jsonResponse(
        { error: "Request-plan preflight was rejected but could not be audited." },
        500
      );
    }

    return jsonResponse(
      {
        error: "Discovery run request-plan preflight was rejected.",
        data: {
          run: {
            id: rejectedRunRecord.id,
            status: rejectedRunRecord.status,
            finished_at: rejectedRunRecord.finished_at,
          },
          reason: "rejected_preflight",
        },
      },
      422
    );
  }

  const preflightPassed = await writeAuditEvent({
    actor: adminSession.actor,
    eventType: "request_plan_preflight_passed",
    runId: runRecord.id,
    sourceId: runRecord.source_id,
    message: "Manual crawler dry executor request-plan preflight passed without network activity.",
    metadata: {
      request_plans: requestPlanPreflight.plans,
    },
  });

  if (!preflightPassed) {
    return jsonResponse(
      { error: "Failed to audit request-plan preflight pass." },
      500
    );
  }

  let activeRunningRuns: RunningDiscoveryRunRecord[] = [];

  try {
    activeRunningRuns = await recoverStaleRunningRuns({
      actor: adminSession.actor,
      sourceId: runRecord.source_id,
      targetRunId: runRecord.id,
    });
  } catch (error) {
    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_failed",
      runId: runRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor failed during stale-run recovery.",
      metadata: {
        failure_code: "stale_run_recovery_failed",
      },
    });

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare manual crawler executor claim.",
      },
      500
    );
  }

  if (activeRunningRuns.length > 0) {
    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_claim_rejected",
      runId: runRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor claim rejected because the source already has a running run.",
      metadata: {
        rejection_reason: "active_running_run_exists",
        active_run_id: activeRunningRuns[0]?.id,
      },
    });

    return jsonResponse(
      {
        error: "A discovery run is already running for this source.",
        data: {
          existingRun: {
            id: activeRunningRuns[0]?.id,
            status: activeRunningRuns[0]?.status,
            started_at: activeRunningRuns[0]?.started_at,
            updated_at: activeRunningRuns[0]?.updated_at,
          },
        },
      },
      409
    );
  }

  const claimAttempted = await writeAuditEvent({
    actor: adminSession.actor,
    eventType: "manual_crawler_executor_claim_attempted",
    runId: runRecord.id,
    sourceId: runRecord.source_id,
    message: "Manual crawler dry executor claim attempted.",
  });

  if (!claimAttempted) {
    return jsonResponse(
      { error: "Failed to audit manual crawler executor claim attempt." },
      500
    );
  }

  const claimedAt = new Date().toISOString();
  const claimStats =
    executionMode === METADATA_FETCH_SMOKE_EXECUTION_MODE
      ? createMetadataFetchSmokeClaimStats({
          stats: runRecord.stats,
          claimedAt,
          actor: adminSession.actor,
          requestPlans: requestPlanPreflight.plans,
        })
      : executionMode === MANUAL_METADATA_FETCH_EXECUTION_MODE
        ? createManualMetadataFetchClaimStats({
            stats: runRecord.stats,
            claimedAt,
            actor: adminSession.actor,
            requestPlans: requestPlanPreflight.plans,
          })
      : createClaimStats({
          stats: runRecord.stats,
          claimedAt,
          actor: adminSession.actor,
          requestPlans: requestPlanPreflight.plans,
        });

  const { data: claimedRun, error: claimError } = await supabaseAdmin
    .from("discovery_runs")
    .update({
      status: "running",
      started_at: claimedAt,
      updated_at: claimedAt,
      stats: claimStats,
    })
    .eq("id", runRecord.id)
    .eq("status", "pending")
    .select(RUN_SELECT)
    .maybeSingle();

  if (claimError) {
    console.error("Failed to claim manual crawler dry run.", {
      message: claimError.message,
      runId: runRecord.id,
      sourceId: runRecord.source_id,
    });

    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_failed",
      runId: runRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor claim failed.",
      metadata: {
        failure_code: "claim_update_failed",
      },
    });

    return jsonResponse({ error: "Failed to claim discovery run." }, 500);
  }

  if (!claimedRun) {
    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_claim_rejected",
      runId: runRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor claim rejected because the run was already claimed.",
      metadata: {
        rejection_reason: "atomic_claim_returned_no_row",
      },
    });

    return jsonResponse(
      { error: "Discovery run was already claimed or is no longer pending." },
      409
    );
  }

  const claimedRunRecord = coerceRunRecord(claimedRun);

  await writeAuditEvent({
    actor: adminSession.actor,
    eventType: "manual_crawler_executor_claim_succeeded",
    runId: claimedRunRecord.id,
    sourceId: runRecord.source_id,
    message: "Manual crawler dry executor claim succeeded.",
    safetyMetadata:
      executionMode === METADATA_FETCH_SMOKE_EXECUTION_MODE
        ? createMetadataFetchSmokeSafetyMetadata(true)
        : executionMode === MANUAL_METADATA_FETCH_EXECUTION_MODE
          ? createManualMetadataFetchSafetyMetadata(true)
        : undefined,
  });

  if (executionMode === METADATA_FETCH_SMOKE_EXECUTION_MODE) {
    return completeMetadataFetchSmokeRun({
      actor: adminSession.actor,
      claimedRun: claimedRunRecord,
      sourceId: runRecord.source_id,
      requestPlans: requestPlanPreflight.plans,
    });
  }

  if (executionMode === MANUAL_METADATA_FETCH_EXECUTION_MODE) {
    return completeManualMetadataFetchRun({
      actor: adminSession.actor,
      claimedRun: claimedRunRecord,
      sourceId: runRecord.source_id,
      requestPlans: requestPlanPreflight.plans,
    });
  }

  const completedAt = new Date().toISOString();
  const completedStats = createCompletedDryRunStats({
    stats: claimedRunRecord.stats,
    completedAt,
    actor: adminSession.actor,
  });

  const { data: completedRun, error: completeError } = await supabaseAdmin
    .from("discovery_runs")
    .update({
      status: "completed",
      finished_at: completedAt,
      updated_at: completedAt,
      error_log: null,
      stats: completedStats,
    })
    .eq("id", claimedRunRecord.id)
    .eq("status", "running")
    .select(RUN_SELECT)
    .maybeSingle();

  if (completeError) {
    console.error("Failed to complete manual crawler dry run.", {
      message: completeError.message,
      runId: claimedRunRecord.id,
      sourceId: runRecord.source_id,
    });

    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_failed",
      runId: claimedRunRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor failed during dry completion.",
      metadata: {
        failure_code: "dry_completion_update_failed",
      },
    });

    return jsonResponse(
      { error: "Failed to complete manual crawler dry run." },
      500
    );
  }

  if (!completedRun) {
    await writeAuditEvent({
      actor: adminSession.actor,
      eventType: "manual_crawler_executor_failed",
      runId: claimedRunRecord.id,
      sourceId: runRecord.source_id,
      message: "Manual crawler dry executor could not complete because the claimed run state changed.",
      metadata: {
        failure_code: "dry_completion_returned_no_row",
      },
    });

    return jsonResponse(
      { error: "Discovery run changed state before dry completion." },
      409
    );
  }

  const completedRunRecord = coerceRunRecord(completedRun);

  await writeAuditEvent({
    actor: adminSession.actor,
    eventType: "manual_crawler_executor_dry_run_completed",
    runId: completedRunRecord.id,
    sourceId: runRecord.source_id,
    message: "Manual crawler dry executor validation completed without fetching or inserting candidates.",
    metadata: {
      completed_at: completedAt,
      processed_urls: 0,
      fetched_urls: 0,
      extracted_candidates: 0,
      inserted_discovered_tools: 0,
      inserted_public_tools: 0,
    },
  });

  return jsonResponse({
    data: {
      run: completedRunRecord,
      execution: {
        enabled: false,
        mode: "dry_run",
        status: "dry_executor_validation_completed",
        message:
          "Manual crawler dry executor claimed and completed the run without fetching, extracting, or inserting candidates.",
      },
    },
  });
}
