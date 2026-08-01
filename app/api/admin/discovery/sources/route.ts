import "server-only";

import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import {
  PublicLiveRouteSafetyError,
  parseBoundedJsonBody,
  readBoundedRequestBody,
} from "../../../../../lib/public-live-route-safety";
import {
  validateHttpsUrl,
  validateTextField,
} from "../../../../../lib/tool-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SOURCE_TYPES = new Set(["rss", "api", "scraper", "manual", "webhook"]);
const MAX_BODY_SIZE_BYTES = 24 * 1024;
const MAX_CONFIG_SIZE_BYTES = 10 * 1024;

type DiscoverySourceCreateDependencies = {
  verifySession?: typeof verifyAdminSession;
  verifyCsrf?: typeof verifyAdminCsrfRequest;
  checkRateLimit?: typeof checkAdminRateLimit;
  client?: typeof supabaseAdmin;
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

function getPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Invalid request format.");
  }

  let body: unknown;
  try {
    body = parseBoundedJsonBody(
      await readBoundedRequestBody(request, MAX_BODY_SIZE_BYTES),
    );
  } catch (error) {
    if (error instanceof PublicLiveRouteSafetyError && error.code === "request_body_too_large") {
      throw new Error("Request is too large.");
    }
    throw new Error("Invalid request body.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body.");
  }

  return body as Record<string, unknown>;
}

function createSourceSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.·]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getOptionalSourceUrl(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return validateHttpsUrl(value, "Source URL", { required: true });
}

function getSourceType(value: unknown) {
  const sourceType = validateTextField(value, "Source type", 30, {
    required: true,
    unsafeCheck: true,
  });

  if (!VALID_SOURCE_TYPES.has(sourceType)) {
    throw new Error("Invalid source type.");
  }

  return sourceType;
}

function getSourceConfig(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Source config must be an object.");
  }

  const serialized = JSON.stringify(value);

  if (serialized.length > MAX_CONFIG_SIZE_BYTES) {
    throw new Error("Source config is too large.");
  }

  return value as Record<string, unknown>;
}

function getBooleanValue(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error("Active state must be true or false.");
  }

  return value;
}

function toSafeDiscoverySourceResponse(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return {
    id: source.id ?? null,
    name: source.name ?? null,
    slug: source.slug ?? null,
    description: source.description ?? null,
    url: source.url ?? null,
    source_type: source.source_type ?? null,
    is_active: source.is_active ?? null,
    last_run_at: source.last_run_at ?? null,
    created_at: source.created_at ?? null,
    updated_at: source.updated_at ?? null,
  };
}

export async function GET(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovery_sources_list_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("source_type");
  const isActive = searchParams.get("is_active");
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = getPositiveInteger(searchParams.get("limit"), 20);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  if (sourceType && !VALID_SOURCE_TYPES.has(sourceType)) {
    return jsonResponse({ error: "Invalid source_type parameter." }, 400);
  }

  if (isActive && !["true", "false"].includes(isActive)) {
    return jsonResponse({ error: "Invalid is_active parameter." }, 400);
  }

  let query = supabaseAdmin
    .from("discovery_sources")
    .select(
      [
        "id",
        "name",
        "slug",
        "description",
        "url",
        "source_type",
        "is_active",
        "last_run_at",
        "created_at",
        "updated_at",
      ].join(", "),
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (sourceType) {
    query = query.eq("source_type", sourceType);
  }

  if (isActive) {
    query = query.eq("is_active", isActive === "true");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("discovery_sources_load_failed");

    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toSafeDiscoverySourceResponse),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export function createDiscoverySourceCreateHandler(
  dependencies: DiscoverySourceCreateDependencies = {},
) {
 return async function discoverySourceCreateHandler(request: Request) {
  const client = dependencies.client ?? supabaseAdmin;
  const adminSession = (dependencies.verifySession ?? verifyAdminSession)(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovery_source_create_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!(dependencies.verifyCsrf ?? verifyAdminCsrfRequest)(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  const rateLimit = (dependencies.checkRateLimit ?? checkAdminRateLimit)({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoverySourceCreate,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
  }

  let body: Record<string, unknown>;

  try {
    body = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      400
    );
  }

  let name = "";
  let slug = "";
  let description = "";
  let url: string | null = null;
  let sourceType = "";
  let config: Record<string, unknown> = {};
  let isActive = true;

  try {
    name = validateTextField(body.name, "Source name", 100, {
      required: true,
      unsafeCheck: true,
    });
    slug = createSourceSlug(name);

    if (!slug) {
      throw new Error("Source name must produce a valid slug.");
    }

    description = validateTextField(body.description, "Source description", 500, {
      required: false,
      unsafeCheck: true,
    });
    url = getOptionalSourceUrl(body.url);
    sourceType = getSourceType(body.source_type);
    config = getSourceConfig(body.config);
    isActive = getBooleanValue(body.is_active, true);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid source data." },
      400
    );
  }

  const { data: existingSource, error: existingSourceError } = await client
    .from("discovery_sources")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSourceError) {
    console.error("discovery_source_duplicate_check_failed");

    return jsonResponse({ error: "Failed to check discovery sources." }, 500);
  }

  if (existingSource) {
    return jsonResponse(
      {
        error: "A discovery source with this name already exists.",
        data: { existingSource },
      },
      409
    );
  }

  const { data: source, error: insertError } = await client
    .from("discovery_sources")
    .insert({
      name,
      slug,
      description: description || null,
      url,
      source_type: sourceType,
      config,
      is_active: isActive,
    })
    .select(
      "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
    )
    .single();

  if (insertError) {
    console.error("discovery_source_create_failed");

    return jsonResponse({ error: "Failed to create discovery source." }, 500);
  }

  const { error: auditError } = await client
    .from("discovery_audit_events")
    .insert({
      discovered_tool_id: null,
      action: "flag",
      actor_id: adminSession.actor.id,
      actor_label: adminSession.actor.label,
      message: "Discovery source created.",
      metadata: {
        event_type: "source_created",
        source_id: source.id,
        source_slug: source.slug,
        source_type: source.source_type,
        is_active: source.is_active,
      },
    });

  if (auditError) {
    console.error("discovery_source_create_audit_failed");

    const { error: compensationError } = await client
      .from("discovery_sources")
      .delete()
      .eq("id", source.id)
      .eq("slug", source.slug);
    if (compensationError) {
      console.error("discovery_source_create_compensation_failed");
    }

    return jsonResponse({ error: "Failed to create discovery source." }, 500);
  }

  return jsonResponse(
    {
      success: true,
      message: "Discovery source created.",
      data: { source: toSafeDiscoverySourceResponse(source) },
    },
    201
  );
 };
}

export const POST = createDiscoverySourceCreateHandler();
