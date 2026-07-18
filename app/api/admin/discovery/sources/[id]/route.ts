import "server-only";

import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  checkAdminRateLimit,
  getAdminRateLimitResponseData,
} from "../../../../../../lib/admin-rate-limit";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import {
  validateHttpsUrl,
  validateTextField,
} from "../../../../../../lib/tool-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SOURCE_TYPES = new Set(["rss", "api", "scraper", "manual", "webhook"]);
const MAX_BODY_SIZE_BYTES = 24 * 1024;
const MAX_CONFIG_SIZE_BYTES = 10 * 1024;

type DiscoverySourceAuditRow = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  url: string | null;
  source_type: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean | null;
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function getBooleanValue(value: unknown) {
  if (typeof value !== "boolean") {
    throw new Error("Active state must be true or false.");
  }

  return value;
}

function valuesAreEqual(first: unknown, second: unknown) {
  return JSON.stringify(first ?? null) === JSON.stringify(second ?? null);
}

function getSafeUrlAuditValue(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return "[invalid-url]";
  }
}

function getSafeConfigAuditValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { present: false };
  }

  return {
    present: Object.keys(value as Record<string, unknown>).length > 0,
  };
}

function getSafeSourceAuditValue(field: string, value: unknown) {
  if (field === "url") {
    return getSafeUrlAuditValue(value);
  }

  if (field === "config") {
    return getSafeConfigAuditValue(value);
  }

  if (
    field === "name" ||
    field === "slug" ||
    field === "description" ||
    field === "source_type" ||
    field === "is_active"
  ) {
    return value ?? null;
  }

  return "[omitted]";
}

function buildSourceUpdateAuditMetadata(
  previousSource: DiscoverySourceAuditRow,
  nextSource: DiscoverySourceAuditRow,
  updatePayload: Record<string, unknown>
) {
  const previousRecord = previousSource as unknown as Record<string, unknown>;
  const nextRecord = nextSource as unknown as Record<string, unknown>;
  const changedFields = Object.keys(updatePayload).filter(
    (field) => !valuesAreEqual(previousRecord[field], nextRecord[field])
  );
  const previousValues: Record<string, unknown> = {};
  const nextValues: Record<string, unknown> = {};

  for (const field of changedFields) {
    previousValues[field] = getSafeSourceAuditValue(field, previousRecord[field]);
    nextValues[field] = getSafeSourceAuditValue(field, nextRecord[field]);
  }

  return {
    event_type: "source_updated",
    source_id: nextSource.id,
    source_slug: nextSource.slug,
    changed_fields: changedFields,
    previous_values: previousValues,
    next_values: nextValues,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovery_source_update_unauthorized");

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  const rateLimit = checkAdminRateLimit({
    request,
    action: ADMIN_RATE_LIMIT_ACTIONS.discoverySourceUpdate,
    actor: adminSession.actor,
  });

  if (!rateLimit.allowed) {
    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return jsonResponse({ error: "Invalid discovery source ID." }, 400);
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

  const updatePayload: Record<string, unknown> = {};

  try {
    if ("name" in body) {
      const name = validateTextField(body.name, "Source name", 100, {
        required: true,
        unsafeCheck: true,
      });
      const slug = createSourceSlug(name);

      if (!slug) {
        throw new Error("Source name must produce a valid slug.");
      }

      updatePayload.name = name;
      updatePayload.slug = slug;
    }

    if ("description" in body) {
      const description = validateTextField(
        body.description,
        "Source description",
        500,
        {
          required: false,
          unsafeCheck: true,
        }
      );

      updatePayload.description = description || null;
    }

    if ("url" in body) {
      updatePayload.url = getOptionalSourceUrl(body.url);
    }

    if ("source_type" in body) {
      updatePayload.source_type = getSourceType(body.source_type);
    }

    if ("config" in body) {
      updatePayload.config = getSourceConfig(body.config);
    }

    if ("is_active" in body) {
      updatePayload.is_active = getBooleanValue(body.is_active);
    }
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid source data." },
      400
    );
  }

  if (Object.keys(updatePayload).length === 0) {
    return jsonResponse({ error: "No source updates provided." }, 400);
  }

  if (typeof updatePayload.slug === "string") {
    const { data: existingSource, error: existingSourceError } =
      await supabaseAdmin
        .from("discovery_sources")
        .select("id, name, slug")
        .eq("slug", updatePayload.slug)
        .neq("id", id)
        .maybeSingle();

    if (existingSourceError) {
      console.error("discovery_source_update_duplicate_check_failed");

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
  }

  const { data: previousSource, error: previousSourceError } = await supabaseAdmin
    .from("discovery_sources")
    .select("id, name, slug, description, url, source_type, config, is_active")
    .eq("id", id)
    .maybeSingle();

  if (previousSourceError) {
    console.error("discovery_source_update_load_failed");

    return jsonResponse({ error: "Failed to update discovery source." }, 500);
  }

  if (!previousSource) {
    return jsonResponse({ error: "Failed to update discovery source." }, 500);
  }

  const { data: source, error: updateError } = await supabaseAdmin
    .from("discovery_sources")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
    )
    .single();

  if (updateError) {
    console.error("discovery_source_update_failed");

    return jsonResponse({ error: "Failed to update discovery source." }, 500);
  }

  const auditMetadata = buildSourceUpdateAuditMetadata(
    previousSource as DiscoverySourceAuditRow,
    source as DiscoverySourceAuditRow,
    updatePayload
  );

  const { error: auditError } = await supabaseAdmin
    .from("discovery_audit_events")
    .insert({
      discovered_tool_id: null,
      action: "flag",
      actor_id: adminSession.actor.id,
      actor_label: adminSession.actor.label,
      message: "Discovery source updated.",
      metadata: auditMetadata,
    });

  if (auditError) {
    console.error("discovery_source_update_audit_failed");

    return jsonResponse(
      { error: "Discovery source updated, but audit logging failed." },
      500
    );
  }

  return jsonResponse({
    success: true,
    message: "Discovery source updated.",
    data: { source },
  });
}
