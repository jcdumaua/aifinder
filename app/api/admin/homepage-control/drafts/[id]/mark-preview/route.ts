import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import { markHomepageControlConfigAsPreview } from "../../../../../../../lib/homepage-control-admin";
import type { HomepageControlConfigRow } from "../../../../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_PREVIEW_ERROR =
  "Unable to move Homepage Control Room config to preview.";

type MarkPreviewRouteContext = {
  params: Promise<{ id: string }>;
};

type HomepageControlMarkPreviewResponse = {
  success: boolean;
  data: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

function jsonResponse(
  data: HomepageControlMarkPreviewResponse,
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

function isTrustedPreviewError(message: string) {
  return (
    message === "Homepage Control Room config not found." ||
    message === "Only draft Homepage Control Room configs can move to preview." ||
    message === "Hero title is required before moving to preview." ||
    message === "Config was not found, is no longer a draft, or changed."
  );
}

function isTrustedPreviewWarning(message: string) {
  return (
    message === "Hero title is empty." ||
    message === "Hero title is short; confirm it is clear enough." ||
    message === "Hero subtitle is empty." ||
    message === "Hero subtitle is short; confirm it explains the homepage." ||
    message ===
      "Tool placement references were not hydrated because no numeric tool IDs were found."
  );
}

function genericFailureResponse(status = 400) {
  return jsonResponse(
    {
      success: false,
      data: null,
      errors: [GENERIC_PREVIEW_ERROR],
      warnings: [],
    },
    status
  );
}

export async function POST(
  request: NextRequest,
  context: MarkPreviewRouteContext
) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("homepage_control_mark_preview_unauthorized");
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
    if (!UUID_PATTERN.test(id)) {
      return jsonResponse(
        {
          success: false,
          data: null,
          errors: ["Invalid Homepage Control Room config ID."],
          warnings: [],
        },
        404
      );
    }

    const result = await markHomepageControlConfigAsPreview(
      id,
      adminSession.actor
    );

    if (!result.success || result.errors.length > 0 || !result.data) {
      const trustedErrors = result.errors.filter(isTrustedPreviewError);
      const trustedWarnings = result.warnings.filter(isTrustedPreviewWarning);

      if (
        result.errors.length > 0 &&
        trustedErrors.length === result.errors.length
      ) {
        return jsonResponse(
          {
            success: false,
            data: null,
            errors: trustedErrors,
            warnings: trustedWarnings,
          },
          400
        );
      }

      console.error("homepage_control_mark_preview_failed");
      return genericFailureResponse();
    }

    return jsonResponse({
      success: true,
      data: result.data,
      errors: [],
      warnings: result.warnings.filter(isTrustedPreviewWarning),
    });
  } catch {
    console.error("homepage_control_mark_preview_unexpected_failure");
    return genericFailureResponse(500);
  }
}
