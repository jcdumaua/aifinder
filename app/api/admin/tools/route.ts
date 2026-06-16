import { NextResponse } from "next/server";
import { createAdminAuditLog } from "../../../../lib/admin-audit-log";
import {
  isAuthorizedAdminRequest,
  verifyAdminCsrfRequest,
} from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  createToolSlug,
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

function validateToolBody(body: Record<string, unknown>, requireId = false) {
  const id = requireId ? getValidId(body.id, "Tool ID") : null;

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

  const safeWebsite = validateHttpsUrl(body.website, "Website URL");
  const safeLogoUrl = validateOptionalLogoUrl(body.logo_url) || null;
  const pricing = validateToolPricing(body.pricing);
  const slug = createToolSlug(name);

  if (!slug) {
    throw new Error("Tool name must include at least one URL-safe character.");
  }

  return {
    id,
    name,
    slug,
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
  let query = supabaseAdmin
    .from("tools")
    .select("id, website")
    .eq("normalized_domain", normalizedDomain)
    .is("deleted_at", null);

  if (excludedToolId) {
    query = query.neq("id", excludedToolId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error("Tool duplicate domain check error:", error.message);
    throw new Error("Unable to check existing tools.");
  }

  return data?.[0] || null;
}

async function findDuplicateToolSlug(
  slug: string,
  excludedToolId?: number | null
) {
  let query = supabaseAdmin
    .from("tools")
    .select("id, slug")
    .eq("slug", slug)
    .is("deleted_at", null);

  if (excludedToolId) {
    query = query.neq("id", excludedToolId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error("Tool duplicate slug check error:", error.message);
    throw new Error("Unable to check existing tool slugs.");
  }

  return data?.[0] || null;
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

    const duplicateSlug = await findDuplicateToolSlug(cleanBody.slug);

    if (duplicateSlug) {
      return jsonResponse(
        { error: "A tool with this generated slug already exists." },
        409
      );
    }

    const { error } = await supabaseAdmin.from("tools").insert([
      {
        name: cleanBody.name,
        slug: cleanBody.slug,
        status: "approved",
        deleted_at: null,
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

    const duplicateSlug = await findDuplicateToolSlug(
      cleanBody.slug,
      cleanBody.id
    );

    if (duplicateSlug) {
      return jsonResponse(
        { error: "Another tool with this generated slug already exists." },
        409
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tools")
      .update({
        name: cleanBody.name,
        slug: cleanBody.slug,
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
      .update({
        status: "archived",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
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
      message: "Tool archived.",
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
