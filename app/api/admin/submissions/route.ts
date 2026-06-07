import { NextResponse } from "next/server";
import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  isAuthorizedAdminRequest,
  verifyAdminCsrfRequest,
} from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  getNormalizedDomain,
  TOOL_FIELD_LENGTHS,
  validateHttpsUrl,
  validateOptionalLogoUrl,
  validateTextField,
  validateToolCategory,
  validateToolPricing,
} from "../../../../lib/tool-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 20 * 1024; // 20KB
const ADMIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 80;

const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

type ExistingToolRow = {
  id: number;
  name: string | null;
};

type ExistingSubmissionRow = {
  id: number;
  name: string | null;
  status: string | null;
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return realIp || "unknown";
}

function checkAdminRateLimit(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const current = adminRateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    adminRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + ADMIN_RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (current.count >= ADMIN_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  adminRateLimitMap.set(ip, current);

  return true;
}

function requireAdminSecurity(request: Request) {
  if (!checkAdminRateLimit(request)) {
    return jsonResponse(
      { error: "Too many admin requests. Please wait and try again." },
      429
    );
  }

  if (!isAuthorizedAdminRequest(request)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  return null;
}

function getValidId(value: unknown, fieldName: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return id;
}

async function readJsonBody(request: Request) {
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

  return body as Record<string, unknown>;
}

function validateSubmissionEditBody(body: Record<string, unknown>) {
  const id = getValidId(body.id, "Submission ID");

  const name = validateTextField(
    body.name,
    "Tool name",
    TOOL_FIELD_LENGTHS.name,
    { required: true }
  );

  const category = validateToolCategory(body.category);

  const description = validateTextField(
    body.description,
    "Description",
    TOOL_FIELD_LENGTHS.description,
    { required: true }
  );

  const pricing = validateToolPricing(body.pricing);
  const safeWebsite = validateHttpsUrl(body.website, "Website URL");
  const safeLogoUrl = validateOptionalLogoUrl(body.logo_url);

  return {
    id,
    name,
    category,
    description,
    website: safeWebsite,
    logo_url: safeLogoUrl || null,
    pricing,
    normalizedDomain: getNormalizedDomain(safeWebsite),
  };
}

async function findDuplicateToolDomain(
  normalizedDomain: string,
  excludedToolId?: number | null
) {
  const { data, error } = await supabaseAdmin
    .from("tools")
    .select("id, name")
    .eq("normalized_domain", normalizedDomain)
    .limit(1);

  if (error) {
    console.error("Duplicate live tools check error:", error.message);
    throw new Error("Unable to check existing tools.");
  }

  const duplicate = ((data || []) as ExistingToolRow[]).find((tool) => {
    if (excludedToolId && tool.id === excludedToolId) {
      return false;
    }

    return true;
  });

  return duplicate || null;
}

async function findDuplicatePendingSubmissionDomain(
  normalizedDomain: string,
  excludedSubmissionId?: number | null
) {
  const { data, error } = await supabaseAdmin
    .from("submitted_tools")
    .select("id, name, status")
    .eq("normalized_domain", normalizedDomain)
    .eq("status", "pending")
    .limit(1);

  if (error) {
    console.error("Duplicate pending submissions check error:", error.message);
    throw new Error("Unable to check pending submissions.");
  }

  const duplicate = ((data || []) as ExistingSubmissionRow[]).find(
    (submission) => {
      if (excludedSubmissionId && submission.id === excludedSubmissionId) {
        return false;
      }

      return true;
    }
  );

  return duplicate || null;
}

export async function GET(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from("submitted_tools")
      .select(
        "id, name, category, description, website, pricing, logo_url, submitter_name, submitter_email, status, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (submissionsError) {
      console.error("Admin submissions load error:", submissionsError.message);

      return jsonResponse({ error: "Failed to load submissions." }, 500);
    }

    const { count: totalTools, error: totalToolsError } = await supabaseAdmin
      .from("tools")
      .select("*", { count: "exact", head: true });

    const { count: pendingSubmissions, error: pendingError } =
      await supabaseAdmin
        .from("submitted_tools")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    const { count: approvedSubmissions, error: approvedError } =
      await supabaseAdmin
        .from("submitted_tools")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

    const { count: rejectedSubmissions, error: rejectedError } =
      await supabaseAdmin
        .from("submitted_tools")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected");

    const statsError =
      totalToolsError || pendingError || approvedError || rejectedError;

    if (statsError) {
      console.error("Admin stats error:", statsError.message);

      return jsonResponse({ error: "Failed to load admin stats." }, 500);
    }

    return jsonResponse({
      submissions: submissions || [],
      stats: {
        totalTools: totalTools || 0,
        pendingSubmissions: pendingSubmissions || 0,
        approvedSubmissions: approvedSubmissions || 0,
        rejectedSubmissions: rejectedSubmissions || 0,
      },
    });
  } catch (error) {
    console.error("Admin submissions GET error:", error);

    return jsonResponse({ error: "Failed to load admin submissions." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const body = await readJsonBody(request);
    const submissionId = getValidId(body.submissionId, "Submission ID");

    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submitted_tools")
      .select("*")
      .eq("id", submissionId)
      .eq("status", "pending")
      .single();

    if (fetchError || !submission) {
      return jsonResponse({ error: "Pending submission not found." }, 404);
    }

    const name = validateTextField(
      submission.name,
      "Tool name",
      TOOL_FIELD_LENGTHS.name,
      { required: true }
    );

    const category = validateToolCategory(submission.category);

    const description = validateTextField(
      submission.description,
      "Description",
      TOOL_FIELD_LENGTHS.description,
      { required: true }
    );

    const pricing = validateToolPricing(submission.pricing);
    const safeWebsite = validateHttpsUrl(submission.website, "Website URL");
    validateOptionalLogoUrl(submission.logo_url);
    const normalizedDomain = getNormalizedDomain(safeWebsite);

    const duplicateTool = await findDuplicateToolDomain(normalizedDomain);

    if (duplicateTool) {
      return jsonResponse(
        {
          error:
            "A live tool with this website/domain already exists. Approval blocked.",
        },
        409
      );
    }

    const { error: approvalError } = await supabaseAdmin.rpc(
      "approve_submitted_tool",
      {
        submission_id: submissionId,
      }
    );

    if (approvalError) {
      console.error("Approve submission RPC error:", approvalError.message);

      return jsonResponse(
        { error: "Failed to approve submission." },
        500
      );
    }

    await createAdminAuditLog({
      request,
      action: "submission_approved",
      targetType: "submission",
      targetId: submissionId,
      targetName: name,
      details: {
        category,
        website: safeWebsite,
        pricing: pricing || "Free + Paid",
      },
    });

    return jsonResponse({
      success: true,
      message: "Submission approved and added to tools.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve submission.",
      },
      400
    );
  }
}

export async function PUT(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const body = await readJsonBody(request);
    const cleanBody = validateSubmissionEditBody(body);

    const duplicateTool = await findDuplicateToolDomain(
      cleanBody.normalizedDomain
    );

    if (duplicateTool) {
      return jsonResponse(
        {
          error:
            "A live tool with this website/domain already exists. Please use a different website.",
        },
        409
      );
    }

    const duplicatePendingSubmission =
      await findDuplicatePendingSubmissionDomain(
        cleanBody.normalizedDomain,
        cleanBody.id
      );

    if (duplicatePendingSubmission) {
      return jsonResponse(
        {
          error:
            "Another pending submission with this website/domain already exists.",
        },
        409
      );
    }

    const { data, error } = await supabaseAdmin
      .from("submitted_tools")
      .update({
        name: cleanBody.name,
        category: cleanBody.category,
        description: cleanBody.description,
        website: cleanBody.website,
        pricing: cleanBody.pricing,
        logo_url: cleanBody.logo_url,
      })
      .eq("id", cleanBody.id)
      .eq("status", "pending")
      .select("id")
      .single();

    if (error || !data) {
      console.error("Update submission error:", error?.message);

      return jsonResponse(
        { error: "Pending submission not found or could not be updated." },
        404
      );
    }

    await createAdminAuditLog({
      request,
      action: "submission_updated",
      targetType: "submission",
      targetId: cleanBody.id,
      targetName: cleanBody.name,
      details: {
        category: cleanBody.category,
        website: cleanBody.website,
        pricing: cleanBody.pricing,
      },
    });

    return jsonResponse({
      success: true,
      message: "Submission updated.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update submission.",
      },
      400
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const body = await readJsonBody(request);
    const submissionId = getValidId(body.submissionId, "Submission ID");

    const { data, error } = await supabaseAdmin
      .from("submitted_tools")
      .update({ status: "rejected" })
      .eq("id", submissionId)
      .eq("status", "pending")
      .select("id, name, website")
      .single();

    if (error || !data) {
      console.error("Reject submission error:", error?.message);

      return jsonResponse(
        { error: "Pending submission not found or already reviewed." },
        404
      );
    }

    await createAdminAuditLog({
      request,
      action: "submission_rejected",
      targetType: "submission",
      targetId: data.id,
      targetName: data.name,
      details: {
        website: data.website,
      },
    });

    return jsonResponse({
      success: true,
      message: "Submission rejected.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reject submission.",
      },
      400
    );
  }
}
