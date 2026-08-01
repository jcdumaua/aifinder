import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../../lib/admin-auth";
import { updateHomepageControlPreviewChecklist } from "../../../../../../../lib/homepage-control-admin";
import type { HomepageControlChecklistRun } from "../../../../../../../lib/homepage-control-types";
import {
  parseBoundedJsonBody,
  PublicLiveRouteSafetyError,
  readBoundedRequestBody,
} from "../../../../../../../lib/public-live-route-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 16 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_CHECKLIST_ERROR =
  "Unable to save Homepage Control Room preview checklist.";

type PreviewChecklistRouteContext = {
  params: Promise<{ id: string }>;
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

function isTrustedChecklistError(message: string) {
  return (
    message === "Preview checklist update payload must be an object." ||
    message === "Preview checklist must be an array." ||
    message ===
      "Preview checklist items must include id and completed fields." ||
    message === "Homepage Control Room config not found." ||
    message ===
      "Preview checklist can only be updated while the config is in preview."
  );
}

function genericFailureResponse(status = 400) {
  return jsonResponse(
    {
      success: false,
      data: null,
      errors: [GENERIC_CHECKLIST_ERROR],
      warnings: [],
    },
    status
  );
}

async function readJsonBody(request: NextRequest) {
  const contentType = (request.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") return null;

  const boundedBody = await readBoundedRequestBody(
    request,
    MAX_BODY_SIZE_BYTES
  );
  return parseBoundedJsonBody(boundedBody);
}

export async function PATCH(
  request: NextRequest,
  context: PreviewChecklistRouteContext
) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("homepage_control_preview_checklist_unauthorized");
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

    const contentType = (request.headers.get("content-type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== "application/json") {
      return jsonResponse(
        {
          success: false,
          data: null,
          errors: ["Invalid request format."],
          warnings: [],
        },
        415
      );
    }

    const payload = await readJsonBody(request);
    const result = await updateHomepageControlPreviewChecklist(
      id,
      payload,
      adminSession.actor
    );

    if (!result.success || result.errors.length > 0 || !result.run) {
      const trustedErrors = result.errors.filter(isTrustedChecklistError);
      if (
        result.errors.length > 0 &&
        trustedErrors.length === result.errors.length
      ) {
        return jsonResponse(
          {
            success: false,
            data: null,
            errors: trustedErrors,
            warnings: [],
          },
          400
        );
      }

      console.error("homepage_control_preview_checklist_failed");
      return genericFailureResponse();
    }

    return jsonResponse({
      success: true,
      data: result.run,
      errors: [],
      warnings: [],
    });
  } catch (caught) {
    if (caught instanceof PublicLiveRouteSafetyError) {
      const tooLarge = caught.code === "request_body_too_large";
      return jsonResponse(
        {
          success: false,
          data: null,
          errors: [tooLarge ? "Request is too large." : "Invalid request body."],
          warnings: [],
        },
        tooLarge ? 413 : 400
      );
    }

    console.error("homepage_control_preview_checklist_unexpected_failure");
    return genericFailureResponse(500);
  }
}
