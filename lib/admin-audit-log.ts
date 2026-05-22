import { supabaseAdmin } from "./supabase-admin";

export type AdminAuditAction =
  | "admin_login_success"
  | "admin_login_failed"
  | "admin_logout"
  | "tool_added"
  | "tool_updated"
  | "tool_deleted"
  | "submission_approved"
  | "submission_rejected"
  | "submission_updated"
  | "logo_uploaded";

type CreateAdminAuditLogInput = {
  request: Request;
  action: AdminAuditAction;
  targetType?: string;
  targetId?: string | number | null;
  targetName?: string | null;
  details?: Record<string, unknown>;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return realIp || "unknown";
}

function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return null;

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanDetails(details?: Record<string, unknown>) {
  if (!details) return {};

  return JSON.parse(
    JSON.stringify(details, (_key, value) => {
      if (typeof value === "string") {
        return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 1000);
      }

      return value;
    })
  ) as Record<string, unknown>;
}

export async function createAdminAuditLog({
  request,
  action,
  targetType,
  targetId,
  targetName,
  details,
}: CreateAdminAuditLogInput) {
  try {
    const userAgent = request.headers.get("user-agent") || "";

    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([
      {
        action,
        target_type: cleanText(targetType, 100),
        target_id:
          targetId === null || typeof targetId === "undefined"
            ? null
            : String(targetId).slice(0, 100),
        target_name: cleanText(targetName, 250),
        details: cleanDetails(details),
        ip_address: getClientIp(request),
        user_agent: userAgent.slice(0, 500),
      },
    ]);

    if (error) {
      console.error("Admin audit log insert error:", error.message);
    }
  } catch (error) {
    console.error("Admin audit log error:", error);
  }
}
