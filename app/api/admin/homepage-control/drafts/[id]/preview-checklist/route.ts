import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import { updateHomepageControlPreviewChecklist } from "../../../../../../../lib/homepage-control-admin";
import type { HomepageControlChecklistRun } from "../../../../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PreviewChecklistRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type HomepageControlPreviewChecklistResponse = {
  success: boolean;
  data: HomepageControlChecklistRun | null;
  errors: string[];
  warnings: string[];
};

function jsonResponse(
  data: HomepageControlPreviewChecklistResponse,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: PreviewChecklistRouteContext
) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn(
      "Unauthorized Homepage Control Room preview checklist request.",
      {
        errors: adminSession.errors,
      }
    );

    return jsonResponse(
      {
        success: false,
        data: null,
        errors: ["Unauthorized"],
        warnings: [],
      },
      401
    );
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      {
        success: false,
        data: null,
        errors: ["Security token missing or expired. Please log in again."],
        warnings: [],
      },
      403
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  const { id } = await context.params;
  const result = await updateHomepageControlPreviewChecklist(
    id,
    payload,
    adminSession.actor
  );

  if (!result.success || result.errors.length > 0) {
    console.error("Failed to update Homepage Control Room preview checklist.", {
      errors: result.errors,
      warnings: result.warnings,
    });

    return jsonResponse(
      {
        success: false,
        data: null,
        errors: result.errors,
        warnings: result.warnings,
      },
      400
    );
  }

  return jsonResponse({
    success: true,
    data: result.run,
    errors: [],
    warnings: result.warnings,
  });
}
