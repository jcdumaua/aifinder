import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { VerifyAdminSessionResult } from "../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  type AdminRateLimitAction,
  type AdminRateLimitResult,
} from "../../../../lib/admin-rate-limit";

const LIVE_LOG_LIMIT = 100;
const DISPLAY_LOG_LIMIT = 50;
const MAX_ARCHIVE_BATCH = 1_000;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 4 * 1024 * 1024;
const ARCHIVE_BUCKET = "admin-audit-archives";
const GENERIC_AUDIT_LOGS_ERROR = "Failed to load audit logs.";

type AdminClient = SupabaseClient;
type ArchiveOverflowResult =
  | { outcome: "ARCHIVE_NOT_REQUIRED" }
  | { outcome: "ARCHIVE_COMPLETED"; archivedCount: number }
  | {
      outcome: "ARCHIVE_FAILED";
      reason:
        | "archive_count_failed"
        | "archive_fetch_failed"
        | "archive_payload_invalid"
        | "archive_payload_too_large"
        | "archive_upload_failed"
        | "archive_metadata_failed"
        | "archive_delete_failed"
        | "archive_delete_mismatch";
      uploaded: boolean;
      compensation_failed: boolean;
      requires_reconciliation?: boolean;
    };

type AuditLogRow = {
  id: number;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AdminAuditLogsHandlerDependencies = {
  verifySession: (request: Request) => VerifyAdminSessionResult;
  verifyCsrf: (request: Request) => boolean;
  checkRateLimit: (input: {
    request: Request;
    action: AdminRateLimitAction;
    actor: NonNullable<VerifyAdminSessionResult["actor"]>;
  }) => AdminRateLimitResult;
  client: AdminClient;
  compressArchive: (text: string) => Uint8Array;
  now?: () => Date;
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanAuditLog(log: AuditLogRow) {
  return {
    id: log.id,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
    target_name: log.target_name,
    details: log.details || {},
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
  };
}

function hasExactDeletedIdSet(data: unknown, expectedIds: number[]) {
  if (!Array.isArray(data) || data.length !== expectedIds.length) return false;

  const expected = new Set(expectedIds);
  if (expected.size !== expectedIds.length) return false;

  const actual = new Set<number>();
  for (const row of data) {
    if (!row || typeof row !== "object" || !("id" in row)) return false;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "number" || !Number.isSafeInteger(id)) return false;
    actual.add(id);
  }

  return (
    actual.size === expected.size &&
    [...actual].every((id) => expected.has(id))
  );
}

function serializeBoundedArchivePayload(input: {
  archivedAt: string;
  firstLogAt: string;
  lastLogAt: string;
  logs: AuditLogRow[];
}):
  | { ok: true; text: string }
  | { ok: false; reason: "archive_payload_invalid" | "archive_payload_too_large" } {
  try {
    const encoder = new TextEncoder();
    const header = JSON.stringify({
      archivedAt: input.archivedAt,
      logCount: input.logs.length,
      firstLogAt: input.firstLogAt,
      lastLogAt: input.lastLogAt,
    });
    const prefix = `${header.slice(0, -1)},"logs":[`;
    let byteLength = encoder.encode(prefix).byteLength + 2;
    const logTexts: string[] = [];

    for (const log of input.logs) {
      const logText = JSON.stringify(cleanAuditLog(log));
      byteLength += encoder.encode(logText).byteLength;
      if (logTexts.length > 0) byteLength += 1;
      if (byteLength > MAX_ARCHIVE_UNCOMPRESSED_BYTES) {
        return { ok: false, reason: "archive_payload_too_large" };
      }
      logTexts.push(logText);
    }

    const text = `${prefix}${logTexts.join(",")}]}`;
    if (encoder.encode(text).byteLength > MAX_ARCHIVE_UNCOMPRESSED_BYTES) {
      return { ok: false, reason: "archive_payload_too_large" };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, reason: "archive_payload_invalid" };
  }
}

export function createAdminAuditLogsHandler(
  dependencies: AdminAuditLogsHandlerDependencies,
) {
  let archiveInFlight: Promise<ArchiveOverflowResult> | null = null;
  let archiveRequestKey: string | null = null;

  const now = dependencies.now || (() => new Date());

  function getArchiveFileName(firstLogAt: string, lastLogAt: string) {
    const nowText = now().toISOString().replace(/[:.]/g, "-");
    const firstText = new Date(firstLogAt).toISOString().slice(0, 10);
    const lastText = new Date(lastLogAt).toISOString().slice(0, 10);
    return `admin-audit-logs_${firstText}_to_${lastText}_archived_${nowText}.json.gz`;
  }

  function getArchiveStoragePath(fileName: string) {
    const current = now();
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, "0");
    return `audit-logs/${year}/${month}/${fileName}`;
  }

  async function removeArchiveObject(storagePath: string) {
    try {
      const { error } = await dependencies.client.storage
        .from(ARCHIVE_BUCKET)
        .remove([storagePath]);
      if (error) {
        console.error("audit_logs_archive_compensation_failed");
        return false;
      }
      return true;
    } catch {
      console.error("audit_logs_archive_compensation_failed");
      return false;
    }
  }

  async function deleteArchiveMetadata(storagePath: string) {
    try {
      const { error } = await dependencies.client
        .from("admin_audit_archives")
        .delete()
        .eq("storage_path", storagePath);
      if (error) {
        console.error("audit_logs_archive_compensation_failed");
        return false;
      }
      return true;
    } catch {
      console.error("audit_logs_archive_compensation_failed");
      return false;
    }
  }

  async function archiveOverflowAuditLogs(): Promise<ArchiveOverflowResult> {
    let countResult;
    try {
      countResult = await dependencies.client
        .from("admin_audit_logs")
        .select("id", { count: "exact", head: true });
    } catch {
      console.error("audit_logs_count_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_count_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }
    const { count, error: countError } = countResult;
    if (countError) {
      console.error("audit_logs_count_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_count_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }
    const totalLogs = count || 0;
    if (totalLogs <= LIVE_LOG_LIMIT) return { outcome: "ARCHIVE_NOT_REQUIRED" };

    const archiveCount = Math.min(totalLogs - LIVE_LOG_LIMIT, MAX_ARCHIVE_BATCH);
    let fetchResult;
    try {
      fetchResult = await dependencies.client
        .from("admin_audit_logs")
        .select("id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at")
        .order("created_at", { ascending: true })
        .limit(archiveCount);
    } catch {
      console.error("audit_logs_archive_fetch_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_fetch_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }
    const { data: logsToArchive, error: fetchError } = fetchResult;
    if (fetchError || !logsToArchive || logsToArchive.length === 0) {
      console.error("audit_logs_archive_fetch_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_fetch_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }

    const logs = logsToArchive as AuditLogRow[];
    const firstLogAt = logs[0].created_at;
    const lastLogAt = logs[logs.length - 1].created_at;
    const archivePayload = serializeBoundedArchivePayload({
      archivedAt: now().toISOString(),
      firstLogAt,
      lastLogAt,
      logs,
    });
    if (!archivePayload.ok) {
      if (archivePayload.reason === "archive_payload_too_large") {
        console.error("audit_logs_archive_payload_too_large");
      } else {
        console.error("audit_logs_archive_payload_invalid");
      }
      return {
        outcome: "ARCHIVE_FAILED",
        reason: archivePayload.reason,
        uploaded: false,
        compensation_failed: false,
      };
    }
    const compressed = dependencies.compressArchive(archivePayload.text);
    const fileName = getArchiveFileName(firstLogAt, lastLogAt);
    const storagePath = getArchiveStoragePath(fileName);

    let uploadResult;
    try {
      uploadResult = await dependencies.client.storage
        .from(ARCHIVE_BUCKET)
        .upload(storagePath, compressed, {
          contentType: "application/gzip",
          cacheControl: "3600",
          upsert: false,
        });
    } catch {
      console.error("audit_logs_archive_upload_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_upload_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }
    const { error: uploadError } = uploadResult;
    if (uploadError) {
      console.error("audit_logs_archive_upload_failed");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_upload_failed",
        uploaded: false,
        compensation_failed: false,
      };
    }

    let metadataResult;
    try {
      metadataResult = await dependencies.client
        .from("admin_audit_archives")
        .insert([{
          file_name: fileName,
          storage_bucket: ARCHIVE_BUCKET,
          storage_path: storagePath,
          log_count: logs.length,
          compressed_size_bytes: compressed.byteLength,
          first_log_at: firstLogAt,
          last_log_at: lastLogAt,
        }]);
    } catch {
      console.error("audit_logs_archive_metadata_failed");
      const compensated = await removeArchiveObject(storagePath);
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_metadata_failed",
        uploaded: true,
        compensation_failed: !compensated,
      };
    }
    const { error: metadataError } = metadataResult;
    if (metadataError) {
      console.error("audit_logs_archive_metadata_failed");
      const compensated = await removeArchiveObject(storagePath);
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_metadata_failed",
        uploaded: true,
        compensation_failed: !compensated,
      };
    }

    const ids = logs.map((log) => log.id);
    let deleteResult;
    try {
      deleteResult = await dependencies.client
        .from("admin_audit_logs")
        .delete()
        .in("id", ids)
        .select("id");
    } catch {
      console.error("audit_logs_archive_delete_failed");
      const metadataRemoved = await deleteArchiveMetadata(storagePath);
      const objectRemoved = await removeArchiveObject(storagePath);
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_delete_failed",
        uploaded: true,
        compensation_failed: !metadataRemoved || !objectRemoved,
      };
    }
    const { data: deletedRows, error: deleteError } = deleteResult as {
      data: unknown;
      error: unknown;
    };
    if (deleteError) {
      if (Array.isArray(deletedRows) && deletedRows.length > 0) {
        console.error("audit_logs_archive_delete_mismatch");
        return {
          outcome: "ARCHIVE_FAILED",
          reason: "archive_delete_mismatch",
          uploaded: true,
          compensation_failed: true,
          requires_reconciliation: true,
        };
      }
      console.error("audit_logs_archive_delete_failed");
      const metadataRemoved = await deleteArchiveMetadata(storagePath);
      const objectRemoved = await removeArchiveObject(storagePath);
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_delete_failed",
        uploaded: true,
        compensation_failed: !metadataRemoved || !objectRemoved,
      };
    }

    if (!hasExactDeletedIdSet(deletedRows, ids)) {
      console.error("audit_logs_archive_delete_mismatch");
      return {
        outcome: "ARCHIVE_FAILED",
        reason: "archive_delete_mismatch",
        uploaded: true,
        compensation_failed: true,
        requires_reconciliation: true,
      };
    }

    return { outcome: "ARCHIVE_COMPLETED", archivedCount: logs.length };
  }

  async function requireSecurity(request: Request, action: AdminRateLimitAction, requireCsrf: boolean) {
    const session = dependencies.verifySession(request);
    if (!session.isAdmin || !session.actor) {
      return { response: jsonResponse({ error: "Unauthorized" }, 401), actor: null };
    }
    if (requireCsrf && !dependencies.verifyCsrf(request)) {
      return {
        response: jsonResponse({ error: "Security token missing or expired." }, 403),
        actor: null,
      };
    }
    const rateLimit = dependencies.checkRateLimit({ request, action, actor: session.actor });
    if (!rateLimit.allowed) {
      return { response: jsonResponse(rateLimit.responseData, rateLimit.status), actor: null };
    }
    return { response: null, actor: session.actor };
  }

  async function GET(request: Request) {
    try {
      const security = await requireSecurity(request, ADMIN_RATE_LIMIT_ACTIONS.auditLogsRead, false);
      if (security.response) return security.response;
      const [logsResult, archivesResult] = await Promise.all([
        dependencies.client.from("admin_audit_logs").select("id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at").order("created_at", { ascending: false }).limit(DISPLAY_LOG_LIMIT),
        dependencies.client.from("admin_audit_archives").select("id, file_name, storage_bucket, storage_path, log_count, compressed_size_bytes, first_log_at, last_log_at, created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (logsResult.error || archivesResult.error) {
        if (logsResult.error) {
          console.error("audit_logs_recent_load_failed");
        } else {
          console.error("audit_logs_archives_load_failed");
        }
        return jsonResponse({ error: GENERIC_AUDIT_LOGS_ERROR }, 500);
      }
      return jsonResponse({
        logs: ((logsResult.data || []) as AuditLogRow[]).map(cleanAuditLog),
        archives: archivesResult.data || [],
        liveLogLimit: LIVE_LOG_LIMIT,
        displayLogLimit: DISPLAY_LOG_LIMIT,
        archiveFormat: "json.gz",
      });
    } catch {
      console.error("audit_logs_unexpected_failure");
      return jsonResponse({ error: GENERIC_AUDIT_LOGS_ERROR }, 500);
    }
  }

  async function POST(request: Request) {
    try {
      const security = await requireSecurity(request, ADMIN_RATE_LIMIT_ACTIONS.auditLogsArchive, true);
      if (security.response || !security.actor) return security.response!;

      const requestKey = security.actor.id || security.actor.label;
      if (archiveInFlight) {
        console.info("audit_logs_archive_already_in_progress");
        const archive_already_in_progress = archiveRequestKey === requestKey;
        void archive_already_in_progress;
        return archiveResultResponse(await archiveInFlight);
      }

      archiveRequestKey = requestKey;
      archiveInFlight = archiveOverflowAuditLogs();
      try {
        return archiveResultResponse(await archiveInFlight);
      } finally {
        archiveInFlight = null;
        archiveRequestKey = null;
      }
    } catch {
      console.error("audit_logs_archive_unexpected_failure");
      return jsonResponse({ error: "ARCHIVE_FAILED" }, 500);
    }
  }

  function archiveResultResponse(result: ArchiveOverflowResult) {
    if (result.outcome === "ARCHIVE_NOT_REQUIRED") {
      return jsonResponse({ result: "ARCHIVE_NOT_REQUIRED" });
    }
    if (result.outcome === "ARCHIVE_COMPLETED") {
      return jsonResponse({ result: "ARCHIVE_COMPLETED", archived_count: result.archivedCount });
    }
    return jsonResponse({ error: "ARCHIVE_FAILED" }, 500);
  }

  return { GET, POST };
}
