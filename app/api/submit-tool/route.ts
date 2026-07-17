import "server-only";

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getNormalizedDomain,
  TOOL_FIELD_LENGTHS,
  validateHttpsUrl,
  validateOptionalEmail,
  validateOptionalLogoUrl,
  validateTextField,
  validateToolCategory,
  validateToolPricing,
} from "../../../lib/tool-validation";

const MAX_BODY_SIZE_BYTES = 20 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const GENERIC_SUBMISSION_ERROR = "Submission failed. Please try again.";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

type SubmitToolValidationErrorCode =
  | "invalid_content_type"
  | "request_too_large"
  | "invalid_request_body"
  | "invalid_submission";

class SubmitToolValidationError extends Error {
  constructor(
    readonly code: SubmitToolValidationErrorCode,
    readonly publicMessage: string,
    readonly status: 400 | 413 | 415
  ) {
    super(publicMessage);
    this.name = "SubmitToolValidationError";
  }
}

type ExistingToolRow = {
  id: number;
  name: string | null;
};

type ExistingSubmissionRow = {
  id: number;
  name: string | null;
  status: string | null;
};

type SubmittedToolInput = {
  name: string;
  category: ReturnType<typeof validateToolCategory>;
  website: string;
  logoUrl: string;
  pricing: string;
  description: string;
  submitterName: string;
  submitterEmail: string;
  normalizedDomain: string;
  honeypot: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return false;
  }

  current.count += 1;
  rateLimitMap.set(ip, current);
  return true;
}

function validateSubmissionBody(body: Record<string, unknown>): SubmittedToolInput {
  try {
    const honeypot = validateTextField(
      body.companyWebsite,
      "Company website",
      TOOL_FIELD_LENGTHS.companyWebsite,
      { unsafeCheck: false }
    );

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

    const submitterName = validateTextField(
      body.submitterName,
      "Submitter name",
      TOOL_FIELD_LENGTHS.submitterName
    );

    const submitterEmail = validateOptionalEmail(body.submitterEmail);
    const pricing = validateToolPricing(body.pricing);
    const website = validateHttpsUrl(body.website, "Website URL");
    const logoUrl = validateOptionalLogoUrl(body.logoUrl);
    const normalizedDomain = getNormalizedDomain(website);

    return {
      name,
      category,
      website,
      logoUrl,
      pricing,
      description,
      submitterName,
      submitterEmail,
      normalizedDomain,
      honeypot,
    };
  } catch (caught) {
    if (caught instanceof Error) {
      throw new SubmitToolValidationError(
        "invalid_submission",
        caught.message,
        400
      );
    }

    throw new SubmitToolValidationError(
      "invalid_submission",
      "Invalid submission.",
      400
    );
  }
}

async function checkDuplicateDomain(
  supabase: SupabaseClient,
  normalizedDomain: string
) {
  const toolsResult = await supabase
    .from("tools")
    .select("id, name")
    .eq("normalized_domain", normalizedDomain)
    .maybeSingle();

  if (toolsResult.error) {
    console.error("submit_tool_duplicate_tools_check_failed");
    throw new Error("submit_tool_duplicate_tools_check_failed");
  }

  const existingTool = toolsResult.data as ExistingToolRow | null;

  if (existingTool) {
    return {
      isDuplicate: true,
      message:
        "This tool already exists on AiFinder. Please submit a different tool.",
    };
  }

  const submissionsResult = await supabase
    .from("submitted_tools")
    .select("id, name, status")
    .eq("normalized_domain", normalizedDomain)
    .in("status", ["pending", "approved"])
    .limit(1)
    .maybeSingle();

  if (submissionsResult.error) {
    console.error("submit_tool_duplicate_submissions_check_failed");
    throw new Error("submit_tool_duplicate_submissions_check_failed");
  }

  const existingSubmission =
    submissionsResult.data as ExistingSubmissionRow | null;

  if (existingSubmission) {
    return {
      isDuplicate: true,
      message:
        existingSubmission.status === "pending"
          ? "This tool has already been submitted and is waiting for admin review."
          : "This tool already exists on AiFinder. Please submit a different tool.",
    };
  }

  return {
    isDuplicate: false,
    message: "",
  };
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(
        {
          error:
            "Server configuration error. Submission is temporarily unavailable.",
        },
        500
      );
    }

    const clientIp = getClientIp(request);

    if (!checkRateLimit(clientIp)) {
      return jsonResponse(
        {
          error:
            "Too many submissions. Please wait before submitting another tool.",
        },
        429
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new SubmitToolValidationError(
        "invalid_content_type",
        "Invalid request format.",
        415
      );
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

    if (contentLength > MAX_BODY_SIZE_BYTES) {
      throw new SubmitToolValidationError(
        "request_too_large",
        "Submission is too large. Please shorten your entry.",
        413
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new SubmitToolValidationError(
        "invalid_request_body",
        "Invalid submission.",
        400
      );
    }

    const submission = validateSubmissionBody(body as Record<string, unknown>);

    if (submission.honeypot) {
      return jsonResponse({
        message: "Thank you! Your tool has been submitted for admin review.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const duplicateCheck = await checkDuplicateDomain(
      supabase,
      submission.normalizedDomain
    );

    if (duplicateCheck.isDuplicate) {
      return jsonResponse({ error: duplicateCheck.message }, 409);
    }

    const insertResult = await supabase.from("submitted_tools").insert([
      {
        name: submission.name,
        category: submission.category,
        website: submission.website,
        logo_url: submission.logoUrl || null,
        pricing: submission.pricing,
        description: submission.description,
        submitter_name: submission.submitterName,
        submitter_email: submission.submitterEmail,
        status: "pending",
      },
    ]);

    if (insertResult.error) {
      console.error("submit_tool_insert_failed");
      return jsonResponse(
        { error: "Unable to save submission. Please try again later." },
        500
      );
    }

    return jsonResponse({
      message: "Thank you! Your tool has been submitted for admin review.",
    });
  } catch (caught) {
    if (caught instanceof SubmitToolValidationError) {
      const { publicMessage, status } = caught;
      return jsonResponse({ error: publicMessage }, status);
    }

    console.error("submit_tool_unexpected_failure");

    return jsonResponse(
      {
        error: GENERIC_SUBMISSION_ERROR,
      },
      500
    );
  }
}
