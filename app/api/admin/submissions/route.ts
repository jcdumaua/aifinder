import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Chatbots",
  "Image AI",
  "Video AI",
  "Voice AI",
  "Writing",
  "Coding",
  "Business",
  "Productivity",
  "Education AI",
  "Marketing AI",
  "SEO AI",
  "Design AI",
  "AI Agents",
];

const PRICING_OPTIONS = ["Free + Paid", "Free", "Paid"];

const BLOCKED_FILE_EXTENSIONS = [
  ".exe",
  ".zip",
  ".rar",
  ".7z",
  ".apk",
  ".dmg",
  ".pkg",
  ".msi",
  ".bat",
  ".cmd",
  ".scr",
  ".ps1",
  ".vbs",
  ".jar",
  ".iso",
  ".torrent",
];

const MAX_BODY_SIZE_BYTES = 20 * 1024; // 20KB
const ADMIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 80; // per IP

const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_FIELD_LENGTHS = {
  name: 80,
  category: 40,
  website: 500,
  logoUrl: 500,
  pricing: 80,
  description: 500,
};

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

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function hasSuspiciousText(value: string) {
  const lowerValue = value.toLowerCase();

  const blockedPatterns = [
    "<script",
    "</script",
    "javascript:",
    "data:text/html",
    "onerror=",
    "onload=",
    "onclick=",
    "<iframe",
    "</iframe",
    "<object",
    "</object",
    "<embed",
    "</embed",
  ];

  return blockedPatterns.some((pattern) => lowerValue.includes(pattern));
}

function validateSafeText(value: string, fieldName: string) {
  if (hasSuspiciousText(value)) {
    throw new Error(`${fieldName} contains unsafe content.`);
  }

  return value;
}

function validateHttpsUrl(value: string, fieldName: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${fieldName} must start with https://`);
  }

  if (url.username || url.password) {
    throw new Error(`${fieldName} cannot contain username or password.`);
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    throw new Error(`${fieldName} cannot use local or private addresses.`);
  }

  let pathname = "";

  try {
    pathname = decodeURIComponent(url.pathname).toLowerCase();
  } catch {
    pathname = url.pathname.toLowerCase();
  }

  if (BLOCKED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    throw new Error(`${fieldName} cannot link directly to a downloadable file.`);
  }

  url.hash = "";

  return url.toString();
}

function validateOptionalLogoUrl(value: string) {
  if (!value) return null;

  return validateHttpsUrl(value, "Logo URL");
}

function getNormalizedDomain(value: string) {
  const url = new URL(value);
  return url.hostname.toLowerCase().replace(/^www\./, "");
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

  const name = validateSafeText(
    cleanText(body.name, MAX_FIELD_LENGTHS.name),
    "Tool name"
  );

  const category = cleanText(body.category, MAX_FIELD_LENGTHS.category);

  const description = validateSafeText(
    cleanText(body.description, MAX_FIELD_LENGTHS.description),
    "Description"
  );

  const website = cleanText(body.website, MAX_FIELD_LENGTHS.website);

  const logoUrl = cleanText(body.logo_url, MAX_FIELD_LENGTHS.logoUrl);

  const pricing = cleanText(body.pricing, MAX_FIELD_LENGTHS.pricing);

  if (!name || !category || !description || !website) {
    throw new Error("Please fill all required fields.");
  }

  if (!CATEGORIES.includes(category)) {
    throw new Error("Please select a valid category.");
  }

  if (pricing && !PRICING_OPTIONS.includes(pricing)) {
    throw new Error("Please select a valid pricing option.");
  }

  const safeWebsite = validateHttpsUrl(website, "Website URL");
  const safeLogoUrl = validateOptionalLogoUrl(logoUrl);

  return {
    id,
    name,
    category,
    description,
    website: safeWebsite,
    logo_url: safeLogoUrl,
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
    .select("id, name, website");

  if (error) {
    console.error("Duplicate live tools check error:", error.message);
    throw new Error("Unable to check existing tools.");
  }

  const tools = (data || []) as ExistingToolRow[];

  const duplicate = tools.find((tool) => {
    if (!tool.website) return false;

    if (excludedToolId && tool.id === excludedToolId) {
      return false;
    }

    try {
      return getNormalizedDomain(tool.website) === normalizedDomain;
    } catch {
      return false;
    }
  });

  return duplicate || null;
}

async function findDuplicatePendingSubmissionDomain(
  normalizedDomain: string,
  excludedSubmissionId?: number | null
) {
  const { data, error } = await supabaseAdmin
    .from("submitted_tools")
    .select("id, name, website, status")
    .eq("status", "pending");

  if (error) {
    console.error("Duplicate pending submissions check error:", error.message);
    throw new Error("Unable to check pending submissions.");
  }

  const submissions = (data || []) as ExistingSubmissionRow[];

  const duplicate = submissions.find((submission) => {
    if (!submission.website) return false;

    if (excludedSubmissionId && submission.id === excludedSubmissionId) {
      return false;
    }

    try {
      return getNormalizedDomain(submission.website) === normalizedDomain;
    } catch {
      return false;
    }
  });

  return duplicate || null;
}

export async function GET(request: Request) {
  try {
    if (!checkAdminRateLimit(request)) {
      return jsonResponse(
        { error: "Too many admin requests. Please wait and try again." },
        429
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
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
    if (!checkAdminRateLimit(request)) {
      return jsonResponse(
        { error: "Too many admin requests. Please wait and try again." },
        429
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
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

    const name = validateSafeText(
      cleanText(submission.name, MAX_FIELD_LENGTHS.name),
      "Tool name"
    );

    const category = cleanText(
      submission.category,
      MAX_FIELD_LENGTHS.category
    );

    const description = validateSafeText(
      cleanText(submission.description, MAX_FIELD_LENGTHS.description),
      "Description"
    );

    const website = cleanText(submission.website, MAX_FIELD_LENGTHS.website);
    const logoUrl = cleanText(submission.logo_url, MAX_FIELD_LENGTHS.logoUrl);
    const pricing = cleanText(submission.pricing, MAX_FIELD_LENGTHS.pricing);

    if (!name || !category || !description || !website) {
      return jsonResponse(
        { error: "Submission is missing required fields." },
        400
      );
    }

    if (!CATEGORIES.includes(category)) {
      return jsonResponse(
        { error: "Submission has an invalid category." },
        400
      );
    }

    if (pricing && !PRICING_OPTIONS.includes(pricing)) {
      return jsonResponse(
        { error: "Submission has an invalid pricing option." },
        400
      );
    }

    const safeWebsite = validateHttpsUrl(website, "Website URL");
    const safeLogoUrl = validateOptionalLogoUrl(logoUrl);
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

    const { error: insertError } = await supabaseAdmin.from("tools").insert([
      {
        name,
        category,
        description,
        website: safeWebsite,
        pricing: pricing || "Free + Paid",
        logo_url: safeLogoUrl,
        platforms: [],
        featured: false,
        best_for: "General use",
        use_cases: [],
      },
    ]);

    if (insertError) {
      console.error("Approve submission insert error:", insertError.message);

      return jsonResponse({ error: "Failed to add approved tool." }, 500);
    }

    const { error: updateError } = await supabaseAdmin
      .from("submitted_tools")
      .update({ status: "approved" })
      .eq("id", submissionId)
      .eq("status", "pending");

    if (updateError) {
      console.error("Approve submission status error:", updateError.message);

      return jsonResponse(
        { error: "Tool was added, but submission status update failed." },
        500
      );
    }

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
    if (!checkAdminRateLimit(request)) {
      return jsonResponse(
        { error: "Too many admin requests. Please wait and try again." },
        429
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
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
    if (!checkAdminRateLimit(request)) {
      return jsonResponse(
        { error: "Too many admin requests. Please wait and try again." },
        429
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await readJsonBody(request);
    const submissionId = getValidId(body.submissionId, "Submission ID");

    const { data, error } = await supabaseAdmin
      .from("submitted_tools")
      .update({ status: "rejected" })
      .eq("id", submissionId)
      .eq("status", "pending")
      .select("id")
      .single();

    if (error || !data) {
      console.error("Reject submission error:", error?.message);

      return jsonResponse(
        { error: "Pending submission not found or already reviewed." },
        404
      );
    }

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