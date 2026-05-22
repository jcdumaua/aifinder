import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const isAuthenticated = isAuthorizedAdminRequest(request);

  return jsonResponse({
    authenticated: isAuthenticated,
  });
}
