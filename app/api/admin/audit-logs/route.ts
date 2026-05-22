import { gzipSync } from "zlib";
import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_LOG_LIMIT = 100;
const DISPLAY_LOG_LIMIT = 50;
const ARCHIVE_BUCKET = "admin-audit-archives";

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

type AuditArchiveRow = {
  id: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  log_count: number;
  compressed_size_bytes: number;
  first_log_at: string | null;
  last_log_at: string | null;
  created_at: string;
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

function getArchiveFileName(firstLogAt: string, lastLogAt: string) {
  const nowText = new Date().toISOString().replace(/[:.]/g, "-");
  const firstText = new Date(firstLogAt).toISOString().slice(0, 10);
  const lastText = new Date(lastLogAt).toISOString().slice(0, 10);

  return `admin-audit-logs_${firstText}_to_${lastText}_archived_${nowText}.json.gz`;
}

function getArchiveStoragePath(fileName: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `audit-logs/${year}/${month}/${fileName}`;
}

async function archiveOverflowAuditLogs() {
  const { count, error: countError } = await supabaseAdmin
    .from("admin_audit_logs")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.error("Audit log count error:", countError.message);
    return;
  }

  const totalLogs = count || 0;

  if (totalLogs <= LIVE_LOG_LIMIT) {
    return;
  }

  const archiveCount = totalLogs - LIVE_LOG_LIMIT;

  const { data: logsToArchive, error: fetchError } = await supabaseAdmin
    .from("admin_audit_logs")
    .select(
      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
    )
    .order("created_at", { ascending: true })
    .limit(archiveCount);

  if (fetchError || !logsToArchive || logsToArchive.length === 0) {
    console.error("Audit log archive fetch error:", fetchError?.message);
    return;
  }

  const typedLogs = logsToArchive as AuditLogRow[];
  const firstLogAt = typedLogs[0].created_at;
  const lastLogAt = typedLogs[typedLogs.length - 1].created_at;

  const archivePayload = {
    archivedAt: new Date().toISOString(),
    logCount: typedLogs.length,
    firstLogAt,
    lastLogAt,
    logs: typedLogs.map(cleanAuditLog),
  };

  const compactJson = JSON.stringify(archivePayload);
  const compressed = gzipSync(Buffer.from(compactJson, "utf8"), { level: 9 });

  const fileName = getArchiveFileName(firstLogAt, lastLogAt);
  const storagePath = getArchiveStoragePath(fileName);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ARCHIVE_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "application/gzip",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Audit archive upload error:", uploadError.message);
    return;
  }

  const { error: archiveInsertError } = await supabaseAdmin
    .from("admin_audit_archives")
    .insert([
      {
        file_name: fileName,
        storage_bucket: ARCHIVE_BUCKET,
        storage_path: storagePath,
        log_count: typedLogs.length,
        compressed_size_bytes: compressed.byteLength,
        first_log_at: firstLogAt,
        last_log_at: lastLogAt,
      },
    ]);

  if (archiveInsertError) {
    console.error("Audit archive DB insert error:", archiveInsertError.message);

    await supabaseAdmin.storage.from(ARCHIVE_BUCKET).remove([storagePath]);
    return;
  }

  const idsToDelete = typedLogs.map((log) => log.id);

  const { error: deleteError } = await supabaseAdmin
    .from("admin_audit_logs")
    .delete()
    .in("id", idsToDelete);

  if (deleteError) {
    console.error("Audit archived logs delete error:", deleteError.message);
  }
}

async function getRecentAuditLogs() {
  const { data, error } = await supabaseAdmin
    .from("admin_audit_logs")
    .select(
      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(DISPLAY_LOG_LIMIT);

  if (error) {
    console.error("Admin audit logs load error:", error.message);
    throw new Error("Failed to load audit logs.");
  }

  return ((data || []) as AuditLogRow[]).map(cleanAuditLog);
}

async function getAuditArchives() {
  const { data, error } = await supabaseAdmin
    .from("admin_audit_archives")
    .select(
      "id, file_name, storage_bucket, storage_path, log_count, compressed_size_bytes, first_log_at, last_log_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Admin audit archives load error:", error.message);
    throw new Error("Failed to load audit archives.");
  }

  return (data || []) as AuditArchiveRow[];
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    await archiveOverflowAuditLogs();

    const [logs, archives] = await Promise.all([
      getRecentAuditLogs(),
      getAuditArchives(),
    ]);

    return jsonResponse({
      logs,
      archives,
      liveLogLimit: LIVE_LOG_LIMIT,
      displayLogLimit: DISPLAY_LOG_LIMIT,
      archiveFormat: "json.gz",
    });
  } catch (error) {
    console.error("Admin audit logs route error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to load audit logs.",
      },
      500
    );
  }
}
