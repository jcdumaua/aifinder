import { NextResponse } from "next/server";
import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  isAuthorizedAdminRequest,
  verifyAdminCsrfRequest,
} from "../../../../lib/admin-auth";
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
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 80;

const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_FIELD_LENGTHS = {
  name: 80,
  category: 40,
  website: 500,
  logoUrl: 500,
  pricing: 80,
  description: 500,
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

function validateToolBody(body: Record<string, unknown>, requireId = false) {
  const id = requireId ? getValidId(body.id, "Tool ID") : null;

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
    pricing: pricing || null,
    normalizedDomain: getNormalizedDomain(safeWebsite),
  };
}

async function findDuplicateWebsiteDomain(
  normalizedDomain: string,
  excludedToolId?: number | null
) {
  const { data, error } = await supabaseAdmin
    .from("tools")
    .select("id, website");

  if (error) {
    console.error("Tool duplicate domain check error:", error.message);
    throw new Error("Unable to check existing tools.");
  }

  const duplicate = (data || []).find((tool) => {
    if (!tool.website) return false;

    try {
      const toolDomain = getNormalizedDomain(tool.website);

      if (excludedToolId && tool.id === excludedToolId) {
        return false;
      }

      return toolDomain === normalizedDomain;
    } catch {
      return false;
    }
  });

  return duplicate || null;
}

export async function POST(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const body = await readJsonBody(request);
    const cleanBody = validateToolBody(body);

    const duplicate = await findDuplicateWebsiteDomain(
      cleanBody.normalizedDomain
    );

    if (duplicate) {
      return jsonResponse(
        { error: "A tool with this website/domain already exists." },
        409
      );
    }

    const { error } = await supabaseAdmin.from("tools").insert([
      {
        name: cleanBody.name,
        category: cleanBody.category,
        description: cleanBody.description,
        website: cleanBody.website,
        pricing: cleanBody.pricing,
        logo_url: cleanBody.logo_url,
        platforms: [],
        featured: false,
        best_for: "General use",
        use_cases: [],
      },
    ]);

    if (error) {
      console.error("Admin add tool error:", error.message);

      return jsonResponse({ error: "Failed to add tool." }, 500);
    }

    await createAdminAuditLog({
      request,
      action: "tool_added",
      targetType: "tool",
      targetName: cleanBody.name,
      details: {
        category: cleanBody.category,
        website: cleanBody.website,
        pricing: cleanBody.pricing,
      },
    });

    return jsonResponse({
      success: true,
      message: "Tool added.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Failed to add tool.",
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
    const cleanBody = validateToolBody(body, true);

    const duplicate = await findDuplicateWebsiteDomain(
      cleanBody.normalizedDomain,
      cleanBody.id
    );

    if (duplicate) {
      return jsonResponse(
        { error: "Another tool with this website/domain already exists." },
        409
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tools")
      .update({
        name: cleanBody.name,
        category: cleanBody.category,
        description: cleanBody.description,
        website: cleanBody.website,
        pricing: cleanBody.pricing,
        logo_url: cleanBody.logo_url,
      })
      .eq("id", cleanBody.id)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Admin update tool error:", error?.message);

      return jsonResponse(
        { error: "Tool not found or could not be updated." },
        404
      );
    }

    await createAdminAuditLog({
      request,
      action: "tool_updated",
      targetType: "tool",
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
      message: "Tool updated.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to update tool.",
      },
      400
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const body = await readJsonBody(request);
    const id = getValidId(body.id, "Tool ID");

    const { data, error } = await supabaseAdmin
      .from("tools")
      .delete()
      .eq("id", id)
      .select("id, name, website")
      .single();

    if (error || !data) {
      console.error("Admin delete tool error:", error?.message);

      return jsonResponse(
        { error: "Tool not found or could not be deleted." },
        404
      );
    }

    await createAdminAuditLog({
      request,
      action: "tool_deleted",
      targetType: "tool",
      targetId: data.id,
      targetName: data.name,
      details: {
        website: data.website,
      },
    });

    return jsonResponse({
      success: true,
      message: "Tool deleted.",
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete tool.",
      },
      400
    );
  }
}
