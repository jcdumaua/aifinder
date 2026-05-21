import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_SUBMISSIONS = 5; // 5 submissions per hour per IP

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_FIELD_LENGTHS = {
  name: 80,
  category: 40,
  website: 500,
  logoUrl: 500,
  pricing: 80,
  description: 500,
  submitterName: 80,
  submitterEmail: 120,
  companyWebsite: 200,
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
  if (!value) return "";

  return validateHttpsUrl(value, "Logo URL");
}

function getNormalizedDomain(value: string) {
  const url = new URL(value);
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function isValidEmail(value: string) {
  if (!value) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    const honeypot = cleanText(
      typedBody.companyWebsite,
      MAX_FIELD_LENGTHS.companyWebsite
    );

    if (honeypot) {
      return jsonResponse({
        message: "Thank you! Your tool has been submitted for admin review.",
      });
    }

    const name = validateSafeText(
      cleanText(typedBody.name, MAX_FIELD_LENGTHS.name),
      "Tool name"
    );

    const category = cleanText(
      typedBody.category,
      MAX_FIELD_LENGTHS.category
    );

    const website = cleanText(typedBody.website, MAX_FIELD_LENGTHS.website);

    const logoUrl = cleanText(typedBody.logoUrl, MAX_FIELD_LENGTHS.logoUrl);

    const pricing = cleanText(typedBody.pricing, MAX_FIELD_LENGTHS.pricing);

    const description = validateSafeText(
      cleanText(typedBody.description, MAX_FIELD_LENGTHS.description),
      "Description"
    );

    const submitterName = validateSafeText(
      cleanText(typedBody.submitterName, MAX_FIELD_LENGTHS.submitterName),
      "Submitter name"
    );

    const submitterEmail = cleanText(
      typedBody.submitterEmail,
      MAX_FIELD_LENGTHS.submitterEmail
    );

    if (!name || !category || !website || !description) {
      return jsonResponse({ error: "Please fill in all required fields." }, 400);
    }

    if (!CATEGORIES.includes(category)) {
      return jsonResponse({ error: "Please select a valid category." }, 400);
    }

    if (pricing && !PRICING_OPTIONS.includes(pricing)) {
      return jsonResponse(
        { error: "Please select a valid pricing option." },
        400
      );
    }

    if (!isValidEmail(submitterEmail)) {
      return jsonResponse(
        { error: "Please enter a valid email address." },
        400
      );
    }

    const safeWebsite = validateHttpsUrl(website, "Website URL");
    const safeLogoUrl = validateOptionalLogoUrl(logoUrl);
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