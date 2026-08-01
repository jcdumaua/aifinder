import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../lib/admin-auth";
import { createHomepageControlDraft } from "../../../../../lib/homepage-control-admin";
import type { HomepageControlConfigRow } from "../../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_CREATE_ERROR = "Unable to create Homepage Control Room draft.";

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

function failureResponse(status = 500) {
  return jsonResponse(
    {
      success: false,
      data: null,
      errors: [GENERIC_CREATE_ERROR],
      warnings: [],
    },
    status
  );
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("homepage_control_draft_create_unauthorized");
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

    if (result.errors.length > 0 || !result.draft) {
      console.error("homepage_control_draft_create_failed");
      return failureResponse();
    }

    return jsonResponse(
      {
        success: true,
        data: result.draft,
        errors: [],
        warnings: [],
      },
      201
    );
  } catch {
    console.error("homepage_control_draft_create_unexpected_failure");
    return failureResponse();
  }
}
