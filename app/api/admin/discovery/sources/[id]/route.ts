import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../../lib/admin-auth";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Source update request.", {
      errors: adminSession.errors,
    });

    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
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
      console.error("Failed to check duplicate discovery source slug.", {
        message: existingSourceError.message,
      });

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

  const { data: source, error: updateError } = await supabaseAdmin
    .from("discovery_sources")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
    )
    .single();

  if (updateError) {
    console.error("Failed to update discovery source.", {
      message: updateError.message,
    });

    return jsonResponse({ error: "Failed to update discovery source." }, 500);
  }

  return jsonResponse({
    success: true,
    message: "Discovery source updated.",
    data: { source },
  });
}
