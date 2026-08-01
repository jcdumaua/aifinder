import "server-only";

import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  ADMIN_CSRF_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../lib/admin-auth";
import {
  createLogoutHandler,
  type AdminLogoutHandlerDependencies,
} from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const secureCookies = process.env.NODE_ENV === "production";

const clearAdminCookies: AdminLogoutHandlerDependencies["clearAdminCookies"] = (
  response,
) => {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set(ADMIN_CSRF_COOKIE_NAME, "", {
    httpOnly: false,
    secure: secureCookies,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
};

export const POST = createLogoutHandler({
  verifySession: verifyAdminSession,
  verifyCsrf: verifyAdminCsrfRequest,
  async writeAudit(request) {
    await createAdminAuditLog({ request, action: "admin_logout" });
  },
  clearAdminCookies,
});
