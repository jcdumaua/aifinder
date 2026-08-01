import "server-only";

import { NextResponse } from "next/server";

import type { VerifyAdminSessionResult } from "../../../../lib/admin-auth";

type LogoutResponse = ReturnType<typeof NextResponse.json>;

export type AdminLogoutHandlerDependencies = {
  verifySession: (request: Request) => VerifyAdminSessionResult;
  verifyCsrf: (request: Request) => boolean;
  writeAudit: (request: Request) => Promise<void>;
  clearAdminCookies: (response: LogoutResponse) => void;
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

export function createLogoutHandler(
  dependencies: AdminLogoutHandlerDependencies,
) {
  return async function POST(request: Request) {
    const adminSession = dependencies.verifySession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      return jsonResponse(
        { success: false, message: "Unauthorized." },
        401,
      );
    }

    if (!dependencies.verifyCsrf(request)) {
      return jsonResponse(
        { error: "Security token missing or expired. Please log in again." },
        403,
      );
    }

    try {
      await dependencies.writeAudit(request);
    } catch {
      console.error("admin_logout_audit_write_failed");
    }

    const response = jsonResponse({
      success: true,
      message: "Admin logged out.",
    });

    dependencies.clearAdminCookies(response);
    return response;
  };
}
