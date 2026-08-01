import "server-only";

import { randomUUID } from "crypto";
import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../lib/admin-auth";
import { checkAdminRateLimit } from "../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { createAdminUploadLogoHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createAdminUploadLogoHandler({
  verifySession: verifyAdminSession,
  verifyCsrf: verifyAdminCsrfRequest,
  checkRateLimit: checkAdminRateLimit,
  storage: supabaseAdmin.storage.from("tool-logos"),
  writeAudit: createAdminAuditLog,
  createObjectName(extension) {
    return `admin/${randomUUID()}.${extension}`;
  },
});

export const POST = handlers.POST;
