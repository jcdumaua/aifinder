import "server-only";

import * as zlib from "zlib";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../lib/admin-auth";
import { checkAdminRateLimit } from "../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { createAdminAuditLogsHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createAdminAuditLogsHandler({
  verifySession: verifyAdminSession,
  verifyCsrf: verifyAdminCsrfRequest,
  checkRateLimit: checkAdminRateLimit,
  client: supabaseAdmin,
  compressArchive(text) {
    return zlib.gzipSync(Buffer.from(text, "utf8"), { level: 9 });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
