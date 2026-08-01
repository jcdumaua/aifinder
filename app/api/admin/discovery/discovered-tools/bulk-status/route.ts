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
  PublicLiveRouteSafetyError,
  parseBoundedJsonBody,
  readBoundedRequestBody,
} from "../../../../../../lib/public-live-route-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_BATCH_SIZE = 50;
const MAX_BODY_SIZE_BYTES = 24 * 1024;
const MAX_REASON_LENGTH = 500;

const BULK_ALLOWED_TARGET_STATUSES = new Set(["pending_review", "ignored"]);
const BULK_SAFE_SOURCE_STATUSES = new Set(["new", "pending_review", "ignored"]);

const DISCOVERY_AUDIT_ACTION_BY_STATUS: Record<string, string> = {
  pending_review: "flag",
  ignored: "ignore",
};

type ExistingDiscoveredTool = {
  id: string;
  status: string | null;
  updated_at: string;
};

type DiscoveredToolsBulkStatusDependencies = {
  verifySession?: typeof verifyAdminSession;
  verifyCsrf?: typeof verifyAdminCsrfRequest;
  checkRateLimit?: typeof checkAdminRateLimit;
  client?: typeof supabaseAdmin;
  now?: () => string;
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

function getBulkIds(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("ids must be an array.");
  }

  const ids = [...new Set(value)];

  if (ids.length === 0) {
    throw new Error("Select at least one candidate.");
  }

  if (ids.length > MAX_BATCH_SIZE) {
    throw new Error(`Bulk actions are limited to ${MAX_BATCH_SIZE} candidates.`);
  }

  if (!ids.every((id) => typeof id === "string" && UUID_PATTERN.test(id))) {
    throw new Error("One or more candidate IDs are invalid.");
  }

  return ids as string[];
}

function getTargetStatus(value: unknown) {
  if (typeof value !== "string" || !BULK_ALLOWED_TARGET_STATUSES.has(value)) {
    throw new Error("Invalid bulk status.");
  }

  return value;
}

function getOptionalReason(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Reason must be text.");
  }

  const reason = value.trim();

  if (reason.length > MAX_REASON_LENGTH) {
    throw new Error("Reason is too long.");
  }

  return reason || null;
}

export function createDiscoveredToolsBulkStatusHandler(
  dependencies: DiscoveredToolsBulkStatusDependencies = {},
) {
 return async function discoveredToolsBulkStatusHandler(request: Request) {
  const client = dependencies.client ?? supabaseAdmin;
  const adminSession = (dependencies.verifySession ?? verifyAdminSession)(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("discovered_tools_bulk_status_unauthorized");

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
    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolBulkStatus,
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

  let ids: string[];
  let status: string;
  let reason: string | null;

  try {
    ids = getBulkIds(body.ids);
    status = getTargetStatus(body.status);
    reason = getOptionalReason(body.reason);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid bulk action." },
      400
    );
  }

  const { data: existingTools, error: existingToolsError } = await client
    .from("discovered_tools")
    .select("id, status, updated_at")
    .in("id", ids);

  if (existingToolsError) {
    console.error("discovered_tools_bulk_status_load_failed");

    return jsonResponse({ error: "Failed to load selected candidates." }, 500);
  }

  const existingRows = (existingTools || []) as ExistingDiscoveredTool[];
  const existingById = new Map(existingRows.map((tool) => [tool.id, tool]));
  const foundIds = existingRows.map((tool) => tool.id);

  const eligibleRows = existingRows.filter((tool) => {
    if (tool.status === status) return false;

    return BULK_SAFE_SOURCE_STATUSES.has(tool.status || "new");
  });

  const eligibleIds = eligibleRows.map((tool) => tool.id);
  const skippedIds = ids.filter((id) => !eligibleIds.includes(id));

  if (eligibleIds.length === 0) {
    return jsonResponse({
      success: true,
      data: {
        requested: ids.length,
        found: foundIds.length,
        updated: 0,
        skipped: skippedIds.length,
        skippedIds,
      },
    });
  }

  const updatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
  const updatedTools: Array<{ id: string; status: string; updated_at: string }> = [];

  for (const tool of eligibleRows) {
    const { data: updatedTool, error: updateError } = await client
      .from("discovered_tools")
      .update({ status, updated_at: updatedAt })
      .eq("id", tool.id)
      .eq("status", tool.status)
      .eq("updated_at", tool.updated_at)
      .select("id, status, updated_at")
      .maybeSingle();

    if (updateError) {
      console.error("discovered_tools_bulk_status_update_failed");
      await compensateBulkStatusWrites(client, updatedTools, existingById, status, updatedAt);
      return jsonResponse({ error: "Failed to update selected candidates." }, 500);
    }
    if (updatedTool) updatedTools.push(updatedTool);
  }

  const auditRows = updatedTools.map((updatedTool) => {
    const tool = existingById.get(updatedTool.id)!;
    return {
    discovered_tool_id: tool.id,
    action: DISCOVERY_AUDIT_ACTION_BY_STATUS[status],
    actor_id: adminSession.actor?.id || null,
    actor_label: adminSession.actor?.label || "AiFinder Admin",
    message: `Bulk changed discovered tool status from ${tool.status} to ${status}.`,
    metadata: {
      bulk: true,
      from_status: tool.status,
      to_status: status,
      reason,
    },
  };});

  const { error: auditError } = await client
    .from("discovery_audit_events")
    .insert(auditRows);

  if (auditError) {
    console.error("discovered_tools_bulk_status_audit_failed");
    await compensateBulkStatusWrites(client, updatedTools, existingById, status, updatedAt);
    return jsonResponse({ error: "Failed to update selected candidates." }, 500);
  }

  return jsonResponse({
    success: true,
    data: {
      requested: ids.length,
      found: foundIds.length,
      updated: updatedTools.length,
      skipped: skippedIds.length,
      skippedIds,
      missingIds: ids.filter((id) => !existingById.has(id)),
    },
  });
 };
}

async function compensateBulkStatusWrites(
  client: typeof supabaseAdmin,
  updatedTools: Array<{ id: string; status: string; updated_at: string }>,
  existingById: Map<string, ExistingDiscoveredTool>,
  status: string,
  updatedAt: string,
) {
  let succeeded = true;
  for (const updatedTool of [...updatedTools].reverse()) {
    const previous = existingById.get(updatedTool.id);
    if (!previous) continue;
    const { error } = await client
      .from("discovered_tools")
      .update({ status: previous.status, updated_at: previous.updated_at })
      .eq("id", updatedTool.id)
      .eq("status", status)
      .eq("updated_at", updatedAt);
    if (error) succeeded = false;
  }
  if (!succeeded) console.error("discovered_tools_bulk_status_compensation_failed");
  return succeeded;
}

export const POST = createDiscoveredToolsBulkStatusHandler();
