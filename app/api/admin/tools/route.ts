import "server-only";

import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../lib/admin-auth";
import { checkAdminRateLimit } from "../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { createAdminToolsHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createAdminToolsHandler({
  verifySession: verifyAdminSession,
  verifyCsrf: verifyAdminCsrfRequest,
  checkRateLimit: checkAdminRateLimit,
  client: supabaseAdmin,
  writeAudit: createAdminAuditLog,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
