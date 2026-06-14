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

function hasOperationalError(errors: string[]) {
  return errors.some(
    (error) =>
      error.startsWith("Failed to") ||
      error.startsWith("Unexpected") ||
      error.includes("audit event")
  );
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (contentLength > MAX_BODY_SIZE_BYTES) {
    throw new Error("Request is too large.");
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body.");
  }

  return body;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Homepage Control Room draft update request.", {
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

  let body: unknown;

  try {
    body = await readJsonBody(request);
  } catch (error: unknown) {
    return jsonResponse(
      {
        success: false,
        data: null,
        errors: [
          error instanceof Error ? error.message : "Invalid request body.",
        ],
        warnings: [],
      },
      400
    );
  }

  const result = await updateHomepageControlDraft(
    id,
    body,
    adminSession.actor
  );

  if (result.errors.length > 0 || !result.draft) {
    const shouldHideDetails = hasOperationalError(result.errors);

    console.error("Failed to update Homepage Control Room draft.", {
      errors: result.errors,
      warnings: result.warnings,
    });

    return jsonResponse(
      {
        success: false,
        data: null,
        errors: shouldHideDetails
          ? ["Unable to save Homepage Control Room draft."]
          : result.errors,
        warnings: shouldHideDetails ? [] : result.warnings,
      },
      400
    );
  }

  return jsonResponse({
    success: true,
    data: result.draft,
    errors: [],
    warnings: result.warnings,
  });
}
