import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { AdminAuditAction } from "../../../../lib/admin-audit-log";
import type { VerifyAdminSessionResult } from "../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  type AdminRateLimitResult,
} from "../../../../lib/admin-rate-limit";
import {
  parseBoundedJsonBody,
  PublicLiveRouteSafetyError,
  readBoundedRequestBody,
} from "../../../../lib/public-live-route-safety";
import {
  getNormalizedDomain,
  TOOL_FIELD_LENGTHS,
  validateHttpsUrl,
  validateOptionalLogoUrl,
  validateTextField,
  validateToolCategory,
  validateToolPricing,
} from "../../../../lib/tool-validation";

const MAX_BODY_SIZE_BYTES = 20 * 1024;

const TRUSTED_REQUEST_ERROR_MESSAGES = new Set([
  "Invalid request format.",
  "Request is too large.",
  "Invalid request body.",
  "Submission ID is invalid.",
  "Tool name is required.",
  "Tool name contains invalid characters.",
  "Tool name must be 80 characters or fewer.",
  "Tool name contains unsafe content.",
  "Category is required.",
  "Category contains invalid characters.",
  "Category must be 40 characters or fewer.",
  "Please select a valid category.",
  "Description is required.",
  "Description contains invalid characters.",
  "Description must be 500 characters or fewer.",
  "Description contains unsafe content.",
  "Pricing contains invalid characters.",
  "Pricing must be 80 characters or fewer.",
  "Please select a valid pricing option.",
  "Website URL is required.",
  "Website URL contains invalid characters.",
  "Website URL must be 500 characters or fewer.",
  "Website URL must be a valid URL.",
  "Website URL must start with https://",
  "Website URL cannot contain username or password.",
  "Website URL cannot use local or private addresses.",
  "Website URL cannot link directly to a downloadable file.",
  "Logo URL contains invalid characters.",
  "Logo URL must be 500 characters or fewer.",
  "Logo URL must be a valid URL.",
  "Logo URL must start with https://",
  "Logo URL cannot contain username or password.",
  "Logo URL cannot use local or private addresses.",
  "Logo URL cannot link directly to a downloadable file.",
  "Unable to check existing tools.",
  "Unable to check pending submissions.",
]);

type AdminClient = SupabaseClient;

type AuditInput = {
  request: Request;
  action: AdminAuditAction;
  targetType?: string;
  targetId?: string | number;
  targetName?: string | null;
  details?: Record<string, unknown>;
};

export type AdminSubmissionsHandlerDependencies = {
  verifySession: (request: Request) => VerifyAdminSessionResult;
  verifyCsrf: (request: Request) => boolean;
  checkRateLimit: (input: {
    request: Request;
    action: typeof ADMIN_RATE_LIMIT_ACTIONS.catalogSubmissions;
    actor: NonNullable<VerifyAdminSessionResult["actor"]>;
  }) => AdminRateLimitResult;
  client: AdminClient;
  writeAudit: (input: AuditInput) => Promise<void>;
};

type ExistingToolRow = { id: number; name: string | null };
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

function getTrustedRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && TRUSTED_REQUEST_ERROR_MESSAGES.has(error.message)) {
    return error.message;
  }
  return fallback;
}

function getValidId(value: unknown, fieldName: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${fieldName} is invalid.`);
  return id;
}

async function readJsonBody(request: Request) {
  const mediaType = (request.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (mediaType !== "application/json") throw new Error("Invalid request format.");

  try {
    const bounded = await readBoundedRequestBody(request, MAX_BODY_SIZE_BYTES);
    const body = parseBoundedJsonBody(bounded);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid request body.");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof PublicLiveRouteSafetyError &&
      error.code === "request_body_too_large"
    ) {
      throw new Error("Request is too large.");
    }
    if (error instanceof Error && error.message === "Invalid request body.") {
      throw error;
    }
    throw new Error("Invalid request body.");
  }
}

function validateSubmissionEditBody(body: Record<string, unknown>) {
  const id = getValidId(body.id, "Submission ID");
  const name = validateTextField(body.name, "Tool name", TOOL_FIELD_LENGTHS.name, {
    required: true,
  });
  const category = validateToolCategory(body.category);
  const description = validateTextField(
    body.description,
    "Description",
    TOOL_FIELD_LENGTHS.description,
    { required: true },
  );
  const pricing = validateToolPricing(body.pricing);
  const website = validateHttpsUrl(body.website, "Website URL");
  const logoUrl = validateOptionalLogoUrl(body.logo_url);
  return {
    id,
    name,
    category,
    description,
    pricing,
    website,
    logo_url: logoUrl || null,
    normalizedDomain: getNormalizedDomain(website),
  };
}

async function writeBestEffortAudit(
  dependencies: AdminSubmissionsHandlerDependencies,
  input: AuditInput,
): Promise<"primary_write_committed" | "audit_write_failed"> {
  try {
    await dependencies.writeAudit(input);
    return "primary_write_committed";
  } catch {
    console.error("admin_submissions_audit_write_failed");
    return "audit_write_failed";
  }
}

export function createAdminSubmissionsHandler(
  dependencies: AdminSubmissionsHandlerDependencies,
) {
  async function requireAdminSecurity(request: Request) {
    const adminSession = dependencies.verifySession(request);
    if (!adminSession.isAdmin || !adminSession.actor) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    if (!dependencies.verifyCsrf(request)) {
      return jsonResponse(
        { error: "Security token missing or expired. Please log in again." },
        403,
      );
    }
    const rateLimit = dependencies.checkRateLimit({
      request,
      action: ADMIN_RATE_LIMIT_ACTIONS.catalogSubmissions,
      actor: adminSession.actor,
    });
    if (!rateLimit.allowed) {
      return jsonResponse(rateLimit.responseData, rateLimit.status);
    }
    return null;
  }

  async function findDuplicateToolDomain(
    normalizedDomain: string,
    excludedToolId?: number | null,
  ) {
    const { data, error } = await dependencies.client
      .from("tools")
      .select("id, name")
      .eq("normalized_domain", normalizedDomain)
      .is("deleted_at", null)
      .limit(1);
    if (error) {
      console.error("admin_submissions_duplicate_live_tool_check_failed");
      throw new Error("Unable to check existing tools.");
    }
    return (
      ((data || []) as ExistingToolRow[]).find(
        (tool) => !excludedToolId || tool.id !== excludedToolId,
      ) || null
    );
  }

  async function findDuplicatePendingSubmissionDomain(
    normalizedDomain: string,
    excludedSubmissionId?: number | null,
  ) {
    const { data, error } = await dependencies.client
      .from("submitted_tools")
      .select("id, name, status")
      .eq("normalized_domain", normalizedDomain)
      .eq("status", "pending")
      .limit(1);
    if (error) {
      console.error("admin_submissions_duplicate_pending_check_failed");
      throw new Error("Unable to check pending submissions.");
    }
    return (
      ((data || []) as ExistingSubmissionRow[]).find(
        (submission) => !excludedSubmissionId || submission.id !== excludedSubmissionId,
      ) || null
    );
  }

  async function GET(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;

      const { data: submissions, error: submissionsError } = await dependencies.client
        .from("submitted_tools")
        .select(
          "id, name, category, description, website, pricing, logo_url, submitter_name, submitter_email, status, created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (submissionsError) {
        console.error("admin_submissions_load_failed");
        return jsonResponse({ error: "Failed to load submissions." }, 500);
      }

      const [toolsResult, pendingResult, approvedResult, rejectedResult] =
        await Promise.all([
          dependencies.client.from("tools").select("*", { count: "exact", head: true }).is("deleted_at", null),
          dependencies.client.from("submitted_tools").select("*", { count: "exact", head: true }).eq("status", "pending"),
          dependencies.client.from("submitted_tools").select("*", { count: "exact", head: true }).eq("status", "approved"),
          dependencies.client.from("submitted_tools").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        ]);
      if (toolsResult.error || pendingResult.error || approvedResult.error || rejectedResult.error) {
        console.error("admin_submissions_stats_load_failed");
        return jsonResponse({ error: "Failed to load admin stats." }, 500);
      }

      return jsonResponse({
        submissions: submissions || [],
        stats: {
          totalTools: toolsResult.count || 0,
          pendingSubmissions: pendingResult.count || 0,
          approvedSubmissions: approvedResult.count || 0,
          rejectedSubmissions: rejectedResult.count || 0,
        },
      });
    } catch {
      console.error("admin_submissions_get_unexpected_failure");
      return jsonResponse({ error: "Failed to load admin submissions." }, 500);
    }
  }

  async function POST(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const body = await readJsonBody(request);
      const submissionId = getValidId(body.submissionId, "Submission ID");
      const { data: submission, error: fetchError } = await dependencies.client
        .from("submitted_tools")
        .select("*")
        .eq("id", submissionId)
        .eq("status", "pending")
        .single();
      if (fetchError || !submission) {
        return jsonResponse({ error: "Pending submission not found." }, 404);
      }
      const name = validateTextField(submission.name, "Tool name", TOOL_FIELD_LENGTHS.name, { required: true });
      const category = validateToolCategory(submission.category);
      const description = validateTextField(submission.description, "Description", TOOL_FIELD_LENGTHS.description, { required: true });
      const pricing = validateToolPricing(submission.pricing);
      const website = validateHttpsUrl(submission.website, "Website URL");
      validateOptionalLogoUrl(submission.logo_url);
      const normalizedDomain = getNormalizedDomain(website);
      if (await findDuplicateToolDomain(normalizedDomain)) {
        return jsonResponse({ error: "A live tool with this website/domain already exists. Approval blocked." }, 409);
      }
      const { error: approvalError } = await dependencies.client.rpc(
        "approve_submitted_tool",
        { submission_id: submissionId },
      );
      if (approvalError) {
        console.error("admin_submission_approval_rpc_failed");
        return jsonResponse({ error: "Failed to approve submission." }, 500);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "submission_approved",
        targetType: "submission",
        targetId: submissionId,
        targetName: name,
        details: { category, website, pricing: pricing || "Free + Paid" },
      });
      return jsonResponse({ success: true, message: "Submission approved and added to tools." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to approve submission.") }, 400);
    }
  }

  async function PUT(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const cleanBody = validateSubmissionEditBody(await readJsonBody(request));
      if (await findDuplicateToolDomain(cleanBody.normalizedDomain)) {
        return jsonResponse({ error: "A live tool with this website/domain already exists. Please use a different website." }, 409);
      }
      if (await findDuplicatePendingSubmissionDomain(cleanBody.normalizedDomain, cleanBody.id)) {
        return jsonResponse({ error: "Another pending submission with this website/domain already exists." }, 409);
      }
      const { data, error } = await dependencies.client
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
        console.error("admin_submission_update_failed");
        return jsonResponse({ error: "Pending submission not found or could not be updated." }, 404);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "submission_updated",
        targetType: "submission",
        targetId: cleanBody.id,
        targetName: cleanBody.name,
        details: { category: cleanBody.category, website: cleanBody.website, pricing: cleanBody.pricing },
      });
      return jsonResponse({ success: true, message: "Submission updated." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to update submission.") }, 400);
    }
  }

  async function PATCH(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const body = await readJsonBody(request);
      const submissionId = getValidId(body.submissionId, "Submission ID");
      const { data, error } = await dependencies.client
        .from("submitted_tools")
        .update({ status: "rejected" })
        .eq("id", submissionId)
        .eq("status", "pending")
        .select("id, name, website")
        .single();
      if (error || !data) {
        console.error("admin_submission_rejection_failed");
        return jsonResponse({ error: "Pending submission not found or already reviewed." }, 404);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "submission_rejected",
        targetType: "submission",
        targetId: data.id,
        targetName: data.name,
        details: { website: data.website },
      });
      return jsonResponse({ success: true, message: "Submission rejected." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to reject submission.") }, 400);
    }
  }

  return { GET, POST, PUT, PATCH };
}
