import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../lib/admin-auth";
import { createHomepageControlDraft } from "../../../../../lib/homepage-control-admin";
import type { HomepageControlConfigRow } from "../../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HomepageControlDraftResponse = {
  success: boolean;
  data: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

function jsonResponse(data: HomepageControlDraftResponse, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: NextRequest) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Homepage Control Room draft request.", {
      errors: adminSession.errors,
    });

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

  const result = await createHomepageControlDraft(adminSession.actor);

  if (result.errors.length > 0) {
    console.error("Failed to create Homepage Control Room draft.", {
      errors: result.errors,
      warnings: result.warnings,
    });

    return jsonResponse(
      {
        success: false,
        data: null,
        errors: ["Failed to create Homepage Control Room draft."],
        warnings: [],
      },
      500
    );
  }

  return jsonResponse(
    {
      success: result.draft !== null,
      data: result.draft,
      errors: [],
      warnings: result.warnings,
    },
    201
  );
}
