import "server-only";

import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../../lib/admin-auth";
import { normalizeManualMetadataFetchAuditEvents } from "../../../../../lib/discovery-run-results-review";
import { normalizeManualStaticHtmlEvidenceAuditEvents } from "../../../../../lib/discovery-static-html-evidence-audit-review";
import { normalizeManualStaticHtmlEvidenceStats } from "../../../../../lib/discovery-static-html-evidence-results-review";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RUN_STATUSES = new Set([
  "pending",
  "running",
  "completed",
  "failed",
]);
const MAX_AUDIT_EVENTS_PER_PAGE = 100;

type JsonRecord = Record<string, unknown>;
type DiscoveryRunRecord = JsonRecord & { id: string };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDiscoveryRunRecord(value: unknown): value is DiscoveryRunRecord {
  return isRecord(value) && typeof value.id === "string";
}

function getManualMetadataFetchAuditMessage(eventType: unknown) {
  if (eventType === "manual_metadata_fetch_started") {
    return "Manual metadata fetch started.";
  }

  if (eventType === "manual_metadata_fetch_url_completed") {
    return "Metadata fetch completed.";
  }

  if (eventType === "manual_metadata_fetch_url_failed") {
    return "Metadata fetch failed safely.";
  }

  if (eventType === "manual_metadata_fetch_completed") {
    return "Manual metadata fetch completed.";
  }

  if (eventType === "manual_metadata_fetch_failed") {
    return "Manual metadata fetch failed.";
  }

  return null;
}

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovery_runs_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = getPositiveInteger(searchParams.get("limit"), 20);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  if (status && !VALID_RUN_STATUSES.has(status)) {
    return jsonResponse({ error: "Invalid status parameter." }, 400);
  }

  let query = supabaseAdmin
    .from("discovery_runs")
    .select(
      [
        "id",
        "source_id",
        "status",
        "stats",
        "error_log",
        "started_at",
        "finished_at",
        "created_at",
        "updated_at",
      ].join(", "),
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("discovery_runs_load_failed");

    return jsonResponse({ error: "Failed to fetch discovery runs." }, 500);
  }

  const rawRuns: unknown = data;
  const candidateRuns: unknown[] = Array.isArray(rawRuns) ? rawRuns : [];
  const runs = candidateRuns.filter(isDiscoveryRunRecord);
  const runIds = runs
    .map((run) => run.id)
    .filter((runId): runId is string => typeof runId === "string");
  const auditEventsByRunId = new Map<
    string,
    Array<{
      event_type: string;
      message: string;
      created_at: string | null;
      status: string | null;
      hostname: string | null;
      error_code: string | null;
      failure_reason: string | null;
    }>
  >();
  const staticEvidenceAuditEventsByRunId = new Map<
    string,
    Array<{
      event_type: string;
      label: string;
      created_at: string;
      status_label: string;
      url_index: number | null;
      url_count: number | null;
      acquisition_status: string | null;
      evidence_status: string | null;
      failure_code: string | null;
      failure_reason: string | null;
      raw_html_persisted: boolean | null;
      candidates_created: boolean | null;
      public_tools_inserted: boolean | null;
      llm_analysis_performed: boolean | null;
    }>
  >();
  let auditWarning: string | null = null;

  if (runIds.length > 0) {
    const { data: auditRows, error: auditError } = await supabaseAdmin
      .from("discovery_audit_events")
      .select("metadata, created_at")
      .in("metadata->>run_id", runIds)
      .order("created_at", { ascending: true })
      .limit(MAX_AUDIT_EVENTS_PER_PAGE);

    if (auditError) {
      console.error("discovery_run_audit_events_load_failed");
      auditWarning = "Audit timeline is unavailable.";
    } else {
      for (const auditRow of auditRows || []) {
        if (!isRecord(auditRow) || !isRecord(auditRow.metadata)) continue;

        const runId = auditRow.metadata.run_id;
        const message = getManualMetadataFetchAuditMessage(auditRow.metadata.event_type);

        if (typeof runId !== "string") continue;

        const staticEvidenceAudit = normalizeManualStaticHtmlEvidenceAuditEvents([
          {
            event_type: auditRow.metadata.event_type,
            created_at: auditRow.created_at,
            status: auditRow.metadata.status,
            url_index: auditRow.metadata.url_index,
            total_urls: auditRow.metadata.total_urls,
            acquisition_status: auditRow.metadata.acquisition_status,
            extraction_status: auditRow.metadata.extraction_status,
            error_code: auditRow.metadata.error_code,
            failure_reason: auditRow.metadata.failure_reason,
            reason: auditRow.metadata.reason,
            raw_html_persisted: auditRow.metadata.raw_html_persisted,
            candidates_created: auditRow.metadata.candidates_created,
            no_public_tools_inserted: auditRow.metadata.no_public_tools_inserted,
            no_llm_analysis_performed: auditRow.metadata.no_llm_analysis_performed,
          },
        ])[0];

        if (staticEvidenceAudit) {
          const events = staticEvidenceAuditEventsByRunId.get(runId) || [];
          events.push({
            event_type: staticEvidenceAudit.eventType,
            label: staticEvidenceAudit.label,
            created_at: staticEvidenceAudit.createdAt,
            status_label: staticEvidenceAudit.statusLabel,
            url_index: staticEvidenceAudit.urlIndex,
            url_count: staticEvidenceAudit.urlCount,
            acquisition_status: staticEvidenceAudit.acquisitionStatus,
            evidence_status: staticEvidenceAudit.evidenceStatus,
            failure_code: staticEvidenceAudit.failureCode,
            failure_reason: staticEvidenceAudit.failureReason,
            raw_html_persisted: staticEvidenceAudit.rawHtmlPersisted,
            candidates_created: staticEvidenceAudit.candidatesCreated,
            public_tools_inserted: staticEvidenceAudit.publicToolsInserted,
            llm_analysis_performed: staticEvidenceAudit.llmAnalysisPerformed,
          });
          staticEvidenceAuditEventsByRunId.set(runId, events);
        }

        if (!message) continue;

        const normalized = normalizeManualMetadataFetchAuditEvents([
          {
            event_type: auditRow.metadata.event_type,
            message,
            created_at: auditRow.created_at,
            status: auditRow.metadata.status,
            hostname: auditRow.metadata.hostname,
            error_code: auditRow.metadata.error_code,
            failure_reason: auditRow.metadata.failure_reason,
          },
        ])[0];

        if (!normalized) continue;

        const events = auditEventsByRunId.get(runId) || [];
        events.push({
          event_type: normalized.eventType,
          message: normalized.message,
          created_at: normalized.createdAt,
          status: normalized.status,
          hostname: normalized.hostname,
          error_code: normalized.errorCode,
          failure_reason: normalized.failureReason,
        });
        auditEventsByRunId.set(runId, events);
      }
    }
  }

  return jsonResponse({
    data: runs.map((run) => {
      const staticEvidenceReview = normalizeManualStaticHtmlEvidenceStats(run.stats);

      return {
        ...run,
        audit_events: auditEventsByRunId.get(run.id) || [],
        ...(staticEvidenceReview
          ? {
              static_evidence_audit_events:
                staticEvidenceAuditEventsByRunId.get(run.id) || [],
              ...(auditWarning
                ? {
                    static_evidence_audit_warning:
                      "Static evidence audit timeline is unavailable.",
                  }
                : {}),
            }
          : {}),
        ...(auditWarning ? { audit_warning: auditWarning } : {}),
      };
    }),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
