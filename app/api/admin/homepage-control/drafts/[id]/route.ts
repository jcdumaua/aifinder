import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../lib/admin-auth";
import { updateHomepageControlDraft } from "../../../../../../lib/homepage-control-admin";
import type { HomepageControlConfigRow } from "../../../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 16 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_SAVE_ERROR = "Unable to save Homepage Control Room draft.";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type HomepageControlDraftUpdateResponse = {
  success: boolean;
  data: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

type HomepageDraftRequestErrorCode =
  | "invalid_content_type"
  | "request_too_large"
  | "invalid_request_body";

class HomepageDraftRequestError extends Error {
  constructor(
    readonly code: HomepageDraftRequestErrorCode,
    readonly publicMessage: string,
    readonly status: 400 | 413 | 415
  ) {
    super(publicMessage);
    this.name = "HomepageDraftRequestError";
  }
}

function jsonResponse(
  data: HomepageControlDraftUpdateResponse,
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

function genericFailureResponse(status = 500) {
  return jsonResponse(
    {
      success: false,
      data: null,
      errors: [GENERIC_SAVE_ERROR],
      warnings: [],
    },
    status
  );
}

function isBoundedValidationError(message: string) {
  return (
    message === "Homepage Control Room draft update payload must be an object." ||
    message === "Layout preset is not allowed." ||
    message === "Density preset is not allowed." ||
    message === "Hero title must be text." ||
    message === "Hero subtitle must be text." ||
    message === "Hero title must be 90 characters or fewer." ||
    message === "Hero subtitle must be 220 characters or fewer." ||
    message === "Hero text cannot include raw HTML." ||
    message === "Hero text cannot include script-like content." ||
    message === "Checklist must be an array." ||
    message === "Checklist items must include id and completed fields." ||
    message === "Homepage Control Room config not found." ||
    message === "Only draft Homepage Control Room configs can be updated."
  );
}

function isBoundedValidationWarning(message: string) {
  return (
    message === "Hero title is empty." ||
    message === "Hero title is short; confirm it is clear enough." ||
    message === "Hero subtitle is empty." ||
    message === "Hero subtitle is short; confirm it explains the homepage." ||
    message.startsWith("Unknown checklist item ignored: ")
  );
}

function classifyDependencyResult(
  errors: string[],
  warnings: string[]
): {
  safeErrors: string[];
  safeWarnings: string[];
  hasOperationalFailure: boolean;
} {
  const safeErrors = errors.filter(isBoundedValidationError);
  const safeWarnings = warnings.filter(isBoundedValidationWarning);

  return {
    safeErrors,
    safeWarnings,
    hasOperationalFailure: safeErrors.length !== errors.length,
  };
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new HomepageDraftRequestError(
      "invalid_content_type",
      "Invalid request format.",
      415
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (contentLength > MAX_BODY_SIZE_BYTES) {
    throw new HomepageDraftRequestError(
      "request_too_large",
      "Request is too large.",
      413
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HomepageDraftRequestError(
      "invalid_request_body",
      "Invalid request body.",
      400
    );
  }

  return body;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminSession = verifyAdminSession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("homepage_draft_update_unauthorized");

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
          errors: ["Invalid Homepage Control Room draft ID."],
          warnings: [],
        },
        404
      );
    }

    const body = await readJsonBody(request);
    const result = await updateHomepageControlDraft(
      id,
      body,
      adminSession.actor
    );

    if (result.errors.length > 0 || !result.draft) {
      const classification = classifyDependencyResult(
        result.errors,
        result.warnings
      );

      if (classification.hasOperationalFailure || !result.draft) {
        console.error("homepage_draft_update_failed");
        return genericFailureResponse(400);
      }

      return jsonResponse(
        {
          success: false,
          data: null,
          errors: classification.safeErrors,
          warnings: classification.safeWarnings,
        },
        400
      );
    }

    const boundedWarnings = result.warnings.filter(isBoundedValidationWarning);

    return jsonResponse({
      success: true,
      data: result.draft,
      errors: [],
      warnings: boundedWarnings,
    });
  } catch (caught) {
    if (caught instanceof HomepageDraftRequestError) {
      return jsonResponse(
        {
          success: false,
          data: null,
          errors: [caught.publicMessage],
          warnings: [],
        },
        caught.status
      );
    }

    console.error("homepage_draft_update_unexpected_failure");
    return genericFailureResponse();
  }
}
