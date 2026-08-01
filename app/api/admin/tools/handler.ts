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
  createToolSlug,
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
  "Tool ID is invalid.",
  "Tool name must include at least one URL-safe character.",
  "Unable to check existing tool slugs.",
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

export type AdminToolsHandlerDependencies = {
  verifySession: (request: Request) => VerifyAdminSessionResult;
  verifyCsrf: (request: Request) => boolean;
  checkRateLimit: (input: {
    request: Request;
    action: typeof ADMIN_RATE_LIMIT_ACTIONS.catalogTools;
    actor: NonNullable<VerifyAdminSessionResult["actor"]>;
  }) => AdminRateLimitResult;
  client: AdminClient;
  writeAudit: (input: AuditInput) => Promise<void>;
  now?: () => Date;
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

function validateToolBody(body: Record<string, unknown>, requireId = false) {
  const id = requireId ? getValidId(body.id, "Tool ID") : null;
  const name = validateTextField(body.name, "Tool name", TOOL_FIELD_LENGTHS.name, { required: true });
  const category = validateToolCategory(body.category);
  const description = validateTextField(body.description, "Description", TOOL_FIELD_LENGTHS.description, { required: true });
  const website = validateHttpsUrl(body.website, "Website URL");
  const logoUrl = validateOptionalLogoUrl(body.logo_url) || null;
  const pricing = validateToolPricing(body.pricing);
  const slug = createToolSlug(name);
  if (!slug) throw new Error("Tool name must include at least one URL-safe character.");
  return {
    id,
    name,
    slug,
    category,
    description,
    website,
    logo_url: logoUrl,
    pricing: pricing || null,
    normalizedDomain: getNormalizedDomain(website),
  };
}

async function writeBestEffortAudit(
  dependencies: AdminToolsHandlerDependencies,
  input: AuditInput,
): Promise<"primary_write_committed" | "audit_write_failed"> {
  try {
    await dependencies.writeAudit(input);
    return "primary_write_committed";
  } catch {
    console.error("admin_tools_audit_write_failed");
    return "audit_write_failed";
  }
}

export function createAdminToolsHandler(dependencies: AdminToolsHandlerDependencies) {
  async function requireAdminSecurity(request: Request) {
    const adminSession = dependencies.verifySession(request);
    if (!adminSession.isAdmin || !adminSession.actor) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    if (!dependencies.verifyCsrf(request)) {
      return jsonResponse({ error: "Security token missing or expired. Please log in again." }, 403);
    }
    const rateLimit = dependencies.checkRateLimit({
      request,
      action: ADMIN_RATE_LIMIT_ACTIONS.catalogTools,
      actor: adminSession.actor,
    });
    if (!rateLimit.allowed) return jsonResponse(rateLimit.responseData, rateLimit.status);
    return null;
  }

  async function findDuplicateWebsiteDomain(normalizedDomain: string, excludedToolId?: number | null) {
    let query = dependencies.client
      .from("tools")
      .select("id, website")
      .eq("normalized_domain", normalizedDomain)
      .is("deleted_at", null);
    if (excludedToolId) query = query.neq("id", excludedToolId);
    const { data, error } = await query.limit(1);
    if (error) {
      console.error("admin_tools_duplicate_domain_check_failed");
      throw new Error("Unable to check existing tools.");
    }
    return data?.[0] || null;
  }

  async function findDuplicateToolSlug(slug: string, excludedToolId?: number | null) {
    let query = dependencies.client
      .from("tools")
      .select("id, slug")
      .eq("slug", slug)
      .is("deleted_at", null);
    if (excludedToolId) query = query.neq("id", excludedToolId);
    const { data, error } = await query.limit(1);
    if (error) {
      console.error("admin_tools_duplicate_slug_check_failed");
      throw new Error("Unable to check existing tool slugs.");
    }
    return data?.[0] || null;
  }

  async function GET(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const { data, error } = await dependencies.client
        .from("tools")
        .select("id, name, category, description, website, pricing, logo_url, status, deleted_at")
        .order("id", { ascending: false });
      if (error) {
        console.error("admin_tools_load_failed");
        return jsonResponse({ error: "Failed to load live tools." }, 500);
      }
      return jsonResponse({ tools: data || [] });
    } catch {
      console.error("admin_tools_get_unexpected_failure");
      return jsonResponse({ error: "Failed to load live tools." }, 500);
    }
  }

  async function POST(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const cleanBody = validateToolBody(await readJsonBody(request));
      if (await findDuplicateWebsiteDomain(cleanBody.normalizedDomain)) {
        return jsonResponse({ error: "A tool with this website/domain already exists." }, 409);
      }
      if (await findDuplicateToolSlug(cleanBody.slug)) {
        return jsonResponse({ error: "A tool with this generated slug already exists." }, 409);
      }
      const { error } = await dependencies.client.from("tools").insert([{
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
      }]);
      if (error) {
        console.error("admin_tool_add_failed");
        return jsonResponse({ error: "Failed to add tool." }, 500);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "tool_added",
        targetType: "tool",
        targetName: cleanBody.name,
        details: { category: cleanBody.category, website: cleanBody.website, pricing: cleanBody.pricing },
      });
      return jsonResponse({ success: true, message: "Tool added." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to add tool.") }, 400);
    }
  }

  async function PUT(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const cleanBody = validateToolBody(await readJsonBody(request), true);
      if (await findDuplicateWebsiteDomain(cleanBody.normalizedDomain, cleanBody.id)) {
        return jsonResponse({ error: "Another tool with this website/domain already exists." }, 409);
      }
      if (await findDuplicateToolSlug(cleanBody.slug, cleanBody.id)) {
        return jsonResponse({ error: "Another tool with this generated slug already exists." }, 409);
      }
      const { data, error } = await dependencies.client
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
        console.error("admin_tool_update_failed");
        return jsonResponse({ error: "Tool not found or could not be updated." }, 404);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "tool_updated",
        targetType: "tool",
        targetId: cleanBody.id || undefined,
        targetName: cleanBody.name,
        details: { category: cleanBody.category, website: cleanBody.website, pricing: cleanBody.pricing },
      });
      return jsonResponse({ success: true, message: "Tool updated." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to update tool.") }, 400);
    }
  }

  async function DELETE(request: Request) {
    try {
      const securityError = await requireAdminSecurity(request);
      if (securityError) return securityError;
      const id = getValidId((await readJsonBody(request)).id, "Tool ID");
      const deletedAt = (dependencies.now || (() => new Date()))().toISOString();
      const { data, error } = await dependencies.client
        .from("tools")
        .update({ status: "archived", deleted_at: deletedAt })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id, name, website")
        .single();
      if (error || !data) {
        console.error("admin_tool_delete_failed");
        return jsonResponse({ error: "Tool not found or could not be deleted." }, 404);
      }
      await writeBestEffortAudit(dependencies, {
        request,
        action: "tool_deleted",
        targetType: "tool",
        targetId: data.id,
        targetName: data.name,
        details: { website: data.website },
      });
      return jsonResponse({ success: true, message: "Tool archived." });
    } catch (error) {
      return jsonResponse({ error: getTrustedRequestErrorMessage(error, "Failed to delete tool.") }, 400);
    }
  }

  return { GET, POST, PUT, DELETE };
}
