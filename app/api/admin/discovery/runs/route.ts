import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../../lib/admin-auth";
import { normalizeManualMetadataFetchAuditEvents } from "../../../../../lib/discovery-run-results-review";
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
    console.warn("Unauthorized Discovery Engine runs request.", {
      errors: adminSession.errors,
    });

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
    console.error("Failed to fetch Discovery Engine runs.", {
      message: error.message,
    });

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
  let auditWarning: string | null = null;

  if (runIds.length > 0) {
    const { data: auditRows, error: auditError } = await supabaseAdmin
      .from("discovery_audit_events")
      .select("metadata, created_at")
      .in("metadata->>run_id", runIds)
      .order("created_at", { ascending: true })
      .limit(MAX_AUDIT_EVENTS_PER_PAGE);

    if (auditError) {
      console.error("Failed to fetch Discovery Engine run audit events.", {
        message: auditError.message,
      });
      auditWarning = "Audit timeline is unavailable.";
    } else {
      for (const auditRow of auditRows || []) {
        if (!isRecord(auditRow) || !isRecord(auditRow.metadata)) continue;

        const runId = auditRow.metadata.run_id;
        const message = getManualMetadataFetchAuditMessage(auditRow.metadata.event_type);

        if (typeof runId !== "string" || !message) continue;

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
    data: runs.map((run) => ({
      ...run,
      audit_events: auditEventsByRunId.get(run.id) || [],
      ...(auditWarning ? { audit_warning: auditWarning } : {}),
    })),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
