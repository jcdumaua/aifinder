import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import { publishHomepageControlConfig } from "../../../../../../../lib/homepage-control-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_PUBLISH_ERROR =
  "Unable to publish Homepage Control Room config.";

type PublishRouteContext = {
  params: Promise<{ id: string }>;
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

function isTrustedPublishError(message: string) {
  return (
    message === "Homepage Control Room config not found." ||
    message ===
      "Homepage Control Room tool placements must be an array before publish." ||
    message ===
      "Cannot publish homepage tool placements because the public-safe tools view does not expose a slug column for validation." ||
    message ===
      "Unable to validate homepage tool placements against public-safe tools."
  );
}

function isTrustedPublishWarning(message: string) {
  return (
    message ===
    "Publish was blocked before activation. Tool placement validation currently runs immediately before the atomic publish RPC."
  );
}

function genericFailureResponse(status = 400) {
  return jsonResponse(
    {
      success: false,
      data: null,
      errors: [GENERIC_PUBLISH_ERROR],
      warnings: [],
    },
    status
  );
}

export async function POST(
  request: NextRequest,
  context: PublishRouteContext
) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("homepage_control_publish_unauthorized");
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

    const result = await publishHomepageControlConfig(id, adminSession.actor);

    if (!result.success || result.errors.length > 0 || !result.data) {
      const trustedErrors = result.errors.filter(isTrustedPublishError);
      const trustedWarnings = result.warnings.filter(isTrustedPublishWarning);
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

      console.error("homepage_control_publish_failed");
      return genericFailureResponse();
    }

    return jsonResponse({
      success: true,
      data: result.data,
      errors: [],
      warnings: result.warnings.filter(isTrustedPublishWarning),
    });
  } catch {
    console.error("homepage_control_publish_unexpected_failure");
    return genericFailureResponse(500);
  }
}
