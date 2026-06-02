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

const MAX_BODY_SIZE_BYTES = 20 * 1024; // 20KB
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_SUBMISSIONS = 5; // 5 submissions per hour per IP

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

type ExistingToolRow = {
  id: number;
  name: string | null;
  website: string | null;
};

type ExistingSubmissionRow = {
  id: number;
  name: string | null;
  website: string | null;
  status: string | null;
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

async function checkDuplicateDomain(
  supabase: SupabaseClient,
  normalizedDomain: string
) {
  const { data: toolsData, error: toolsError } = await supabase
    .from("tools")
    .select("id, name, website");

  if (toolsError) {
    console.error("Duplicate tools check error:", toolsError.message);

    throw new Error("Unable to check existing tools. Please try again later.");
  }

  const tools = (toolsData || []) as ExistingToolRow[];

  const existingTool = tools.find((tool) => {
    if (!tool.website) return false;

    try {
      return getNormalizedDomain(tool.website) === normalizedDomain;
    } catch {
      return false;
    }
  });

  if (existingTool) {
    return {
      isDuplicate: true,
      message:
        "This tool already exists on AiFinder. Please submit a different tool.",
    };
  }

  const { data: submissionsData, error: submissionsError } = await supabase
    .from("submitted_tools")
    .select("id, name, website, status")
    .in("status", ["pending", "approved"]);

  if (submissionsError) {
    console.error(
      "Duplicate submitted tools check error:",
      submissionsError.message
    );

    throw new Error(
      "Unable to check pending submissions. Please try again later."
    );
  }

  const submissions = (submissionsData || []) as ExistingSubmissionRow[];

  const existingSubmission = submissions.find((submission) => {
    if (!submission.website) return false;

    try {
      return getNormalizedDomain(submission.website) === normalizedDomain;
    } catch {
      return false;
    }
  });

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
      return jsonResponse({ error: "Invalid request format." }, 415);
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return jsonResponse(
        { error: "Submission is too large. Please shorten your entry." },
        413
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "Invalid submission." }, 400);
    }

    const typedBody = body as {
      name?: unknown;
      category?: unknown;
      website?: unknown;
      logoUrl?: unknown;
      pricing?: unknown;
      description?: unknown;
      submitterName?: unknown;
      submitterEmail?: unknown;
      companyWebsite?: unknown;
    };

    const honeypot = validateTextField(
      typedBody.companyWebsite,
      "Company website",
      TOOL_FIELD_LENGTHS.companyWebsite,
      { unsafeCheck: false }
    );

    if (honeypot) {
      return jsonResponse({
        message: "Thank you! Your tool has been submitted for admin review.",
      });
    }

    const name = validateTextField(
      typedBody.name,
      "Tool name",
      TOOL_FIELD_LENGTHS.name,
      { required: true }
    );

    const category = validateToolCategory(typedBody.category);

    const description = validateTextField(
      typedBody.description,
      "Description",
      TOOL_FIELD_LENGTHS.description,
      { required: true }
    );

    const submitterName = validateTextField(
      typedBody.submitterName,
      "Submitter name",
      TOOL_FIELD_LENGTHS.submitterName
    );

    const submitterEmail = validateOptionalEmail(typedBody.submitterEmail);
    const pricing = validateToolPricing(typedBody.pricing);
    const safeWebsite = validateHttpsUrl(typedBody.website, "Website URL");
    const safeLogoUrl = validateOptionalLogoUrl(typedBody.logoUrl);
    const normalizedDomain = getNormalizedDomain(safeWebsite);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const duplicateCheck = await checkDuplicateDomain(
      supabase,
      normalizedDomain
    );

    if (duplicateCheck.isDuplicate) {
      return jsonResponse({ error: duplicateCheck.message }, 409);
    }

    const { error } = await supabase.from("submitted_tools").insert([
      {
        name,
        category,
        website: safeWebsite,
        logo_url: safeLogoUrl || null,
        pricing,
        description,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Submit tool database error:", error.message);

      return jsonResponse(
        { error: "Unable to save submission. Please try again later." },
        500
      );
    }

    return jsonResponse({
      message: "Thank you! Your tool has been submitted for admin review.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Submission failed. Please try again.",
      },
      400
    );
  }
}
