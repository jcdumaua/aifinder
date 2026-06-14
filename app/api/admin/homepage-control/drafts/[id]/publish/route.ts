import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import { publishHomepageControlConfig } from "../../../../../../../lib/homepage-control-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type HomepageControlPublishResponse = {
  success: boolean;
  data: {
    success: boolean;
    config_id: string;
    status: string;
    published_at: string;
  } | null;
  errors: string[];
  warnings: string[];
};

function jsonResponse(data: HomepageControlPublishResponse, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: PublishRouteContext
) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Homepage Control Room publish request.", {
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

  const { id } = await context.params;
  const result = await publishHomepageControlConfig(id, adminSession.actor);

  if (!result.success || result.errors.length > 0) {
    console.error("Failed to publish Homepage Control Room config.", {
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
    data: result.data,
    errors: [],
    warnings: result.warnings,
  });
}
