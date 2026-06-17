import { NextResponse } from "next/server";
import {
  verifyAdminCsrfRequest,
  verifyAdminSession,
} from "../../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import {
  getNormalizedDomain,
  validateHttpsUrl,
  validateOptionalLogoUrl,
  validateTextField,
  validateToolCategory,
  validateToolPricing,
} from "../../../../../lib/tool-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE_BYTES = 24 * 1024;
const MAX_RAW_PAYLOAD_SIZE_BYTES = 10 * 1024;
const DEFAULT_PLATFORM = "Web";

type DuplicateWarning = {
  candidateType: "tool" | "submission";
  candidateId: number;
  name: string | null;
  slug?: string | null;
  status?: string | null;
  matchType: "normalized_domain";
  matchScore: number;
  reason: string;
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

function createDiscoverySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.·]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getDiscoveryScore(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 0.5;
  }

  const score = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error("Discovery score must be between 0 and 1.");
  }

  return score;
}

function getPlatforms(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return [DEFAULT_PLATFORM];
  }

  if (!Array.isArray(value)) {
    throw new Error("Platforms must be a list.");
  }

  if (value.length > 6) {
    throw new Error("Platforms must include 6 items or fewer.");
  }

  const platforms = value
    .map((platform, index) =>
      validateTextField(platform, `Platform ${index + 1}`, 40, {
        required: true,
        unsafeCheck: true,
      })
    )
    .filter(Boolean);

  const uniquePlatforms = Array.from(new Set(platforms));

  return uniquePlatforms.length > 0 ? uniquePlatforms : [DEFAULT_PLATFORM];
}

function getRawPayload(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Raw payload must be an object.");
  }

  const serialized = JSON.stringify(value);

  if (serialized.length > MAX_RAW_PAYLOAD_SIZE_BYTES) {
    throw new Error("Raw payload is too large.");
  }

  return value as Record<string, unknown>;
}

function getOptionalUrl(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return validateHttpsUrl(value, fieldName, { required: true });
}

async function cleanupDiscoveredTool(discoveredToolId: string) {
  await supabaseAdmin
    .from("discovery_audit_events")
    .delete()
    .eq("discovered_tool_id", discoveredToolId);

  await supabaseAdmin
    .from("discovery_duplicate_candidates")
    .delete()
    .eq("discovered_tool_id", discoveredToolId);

  await supabaseAdmin
    .from("discovery_evidence")
    .delete()
    .eq("discovered_tool_id", discoveredToolId);

  await supabaseAdmin
    .from("discovered_tools")
    .delete()
    .eq("id", discoveredToolId);
}

export async function POST(request: Request) {
  const adminSession = verifyAdminSession(request);

  if (!adminSession.isAdmin || !adminSession.actor) {
    console.warn("Unauthorized Discovery Engine intake request.", {
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
  let description = "";
  let website = "";
  let canonicalUrl = "";
  let normalizedDomain = "";
  let slug = "";
  let category = "";
  let pricing = "";
  let logoUrl = "";
  let sourceUrl = "";
  let pageTitle = "";
  let metaDescription = "";
  let discoveryScore = 0.5;
  let platforms: string[] = [];
  let rawPayload: Record<string, unknown> = {};

  try {
    name = validateTextField(body.name, "Name", 80, { required: true });
    description = validateTextField(body.description, "Description", 500, {
      required: true,
    });
    website = validateHttpsUrl(body.website, "Website URL", { required: true });
    canonicalUrl = getOptionalUrl(body.canonical_url, "Canonical URL") || website;
    normalizedDomain = getNormalizedDomain(website);
    slug = createDiscoverySlug(name);

    if (!slug) {
      throw new Error("Name must produce a valid slug.");
    }

    category = validateToolCategory(body.category);
    pricing = validateToolPricing(body.pricing) || "Free + Paid";
    logoUrl = validateOptionalLogoUrl(body.logo_url);
    sourceUrl = getOptionalUrl(body.source_url, "Source URL") || website;
    pageTitle = validateTextField(body.page_title, "Page title", 160, {
      required: false,
    });
    metaDescription = validateTextField(
      body.meta_description,
      "Meta description",
      300,
      { required: false }
    );
    discoveryScore = getDiscoveryScore(body.discovery_score);
    platforms = getPlatforms(body.platforms);
    rawPayload = getRawPayload(body.raw_payload);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid intake data." },
      400
    );
  }

  const { data: existingDiscoveredTools, error: existingDiscoveredError } =
    await supabaseAdmin
      .from("discovered_tools")
      .select("id, name, slug, status, normalized_domain, created_at")
      .eq("normalized_domain", normalizedDomain)
      .in("status", ["new", "pending_review", "approved", "duplicate"])
      .order("created_at", { ascending: false })
      .limit(1);

  if (existingDiscoveredError) {
    console.error("Failed to check existing discovered tools.", {
      message: existingDiscoveredError.message,
    });

    return jsonResponse({ error: "Failed to check discovery queue." }, 500);
  }

  const existingDiscoveredTool = existingDiscoveredTools?.[0];

  if (existingDiscoveredTool) {
    return jsonResponse(
      {
        error: "A discovered candidate with this domain already exists.",
        data: {
          existingDiscoveredTool,
        },
      },
      409
    );
  }

  const { data: liveTools, error: liveToolsError } = await supabaseAdmin
    .from("tools")
    .select("id, name, slug, status, deleted_at, normalized_domain")
    .eq("normalized_domain", normalizedDomain)
    .is("deleted_at", null)
    .limit(1);

  if (liveToolsError) {
    console.error("Failed to check live tools during discovery intake.", {
      message: liveToolsError.message,
    });

    return jsonResponse({ error: "Failed to check live tools." }, 500);
  }

  const { data: pendingSubmissions, error: pendingSubmissionsError } =
    await supabaseAdmin
      .from("submitted_tools")
      .select("id, name, status, normalized_domain")
      .eq("normalized_domain", normalizedDomain)
      .eq("status", "pending")
      .limit(1);

  if (pendingSubmissionsError) {
    console.error("Failed to check pending submissions during discovery intake.", {
      message: pendingSubmissionsError.message,
    });

    return jsonResponse({ error: "Failed to check pending submissions." }, 500);
  }

  const duplicateWarnings: DuplicateWarning[] = [];

  const liveTool = liveTools?.[0];
  const pendingSubmission = pendingSubmissions?.[0];

  if (liveTool) {
    duplicateWarnings.push({
      candidateType: "tool",
      candidateId: liveTool.id,
      name: liveTool.name,
      slug: liveTool.slug,
      status: liveTool.status,
      matchType: "normalized_domain",
      matchScore: 100,
      reason: "Existing live tool has the same normalized domain.",
    });
  }

  if (pendingSubmission) {
    duplicateWarnings.push({
      candidateType: "submission",
      candidateId: pendingSubmission.id,
      name: pendingSubmission.name,
      status: pendingSubmission.status,
      matchType: "normalized_domain",
      matchScore: 100,
      reason: "Pending submission has the same normalized domain.",
    });
  }

  const intakeStatus = duplicateWarnings.length > 0 ? "duplicate" : "new";

  const { data: discoveredTool, error: discoveredInsertError } =
    await supabaseAdmin
      .from("discovered_tools")
      .insert({
        name,
        description,
        website,
        canonical_url: canonicalUrl,
        normalized_domain: normalizedDomain,
        slug,
        status: intakeStatus,
        pricing,
        platforms,
        category,
        logo_url: logoUrl || null,
        raw_payload: {
          source: "manual-intake",
          raw_payload: rawPayload,
          duplicate_warnings: duplicateWarnings,
        },
        discovery_score: discoveryScore,
        source_id: null,
        run_id: null,
      })
      .select("id, name, slug, status, normalized_domain")
      .single();

  if (discoveredInsertError) {
    console.error("Failed to create manual discovery intake candidate.", {
      message: discoveredInsertError.message,
    });

    return jsonResponse(
      { error: "Failed to create discovery intake candidate." },
      500
    );
  }

  const discoveredToolId = discoveredTool.id as string;

  const { data: evidence, error: evidenceError } = await supabaseAdmin
    .from("discovery_evidence")
    .insert({
      discovered_tool_id: discoveredToolId,
      source_url: sourceUrl,
      final_url: website,
      page_title: pageTitle || name,
      meta_description: metaDescription || description,
      logo_url: logoUrl || null,
      pricing_text: pricing,
      extracted_json: {
        source: "manual-intake",
        name,
        category,
        platforms,
        duplicate_warnings: duplicateWarnings,
      },
      confidence_score: discoveryScore,
      fetched_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (evidenceError) {
    console.error("Failed to create manual discovery evidence.", {
      message: evidenceError.message,
    });

    await cleanupDiscoveredTool(discoveredToolId);

    return jsonResponse(
      { error: "Intake candidate created, but evidence creation failed." },
      500
    );
  }

  let duplicateCandidateId: string | null = null;

  if (duplicateWarnings.length > 0) {
    const primaryDuplicate = duplicateWarnings[0];

    const { data: duplicateCandidate, error: duplicateError } =
      await supabaseAdmin
        .from("discovery_duplicate_candidates")
        .insert({
          discovered_tool_id: discoveredToolId,
          candidate_type: primaryDuplicate.candidateType,
          candidate_tool_id:
            primaryDuplicate.candidateType === "tool"
              ? primaryDuplicate.candidateId
              : null,
          candidate_submission_id:
            primaryDuplicate.candidateType === "submission"
              ? primaryDuplicate.candidateId
              : null,
          candidate_discovered_tool_id: null,
          match_type: primaryDuplicate.matchType,
          match_score: primaryDuplicate.matchScore,
          is_blocking: true,
          reason: primaryDuplicate.reason,
        })
        .select("id")
        .single();

    if (duplicateError) {
      console.error("Failed to create manual intake duplicate candidate.", {
        message: duplicateError.message,
      });

      await cleanupDiscoveredTool(discoveredToolId);

      return jsonResponse(
        { error: "Intake candidate created, but duplicate recording failed." },
        500
      );
    }

    duplicateCandidateId = duplicateCandidate.id as string;
  }

  const auditAction = intakeStatus === "duplicate" ? "mark-duplicate" : "flag";

  const { error: auditError } = await supabaseAdmin
    .from("discovery_audit_events")
    .insert({
      discovered_tool_id: discoveredToolId,
      action: auditAction,
      actor_id: adminSession.actor.id,
      actor_label: adminSession.actor.label,
      message:
        intakeStatus === "duplicate"
          ? "Manual discovery intake recorded a duplicate candidate."
          : "Manual discovery intake created a review candidate.",
      metadata: {
        source: "manual-intake",
        status: intakeStatus,
        normalized_domain: normalizedDomain,
        slug,
        evidence_id: evidence.id,
        duplicate_candidate_id: duplicateCandidateId,
        duplicate_warnings: duplicateWarnings,
      },
    });

  if (auditError) {
    console.error("Failed to write manual discovery intake audit event.", {
      message: auditError.message,
    });

    await cleanupDiscoveredTool(discoveredToolId);

    return jsonResponse(
      { error: "Intake candidate created, but audit logging failed." },
      500
    );
  }

  return jsonResponse(
    {
      success: true,
      message:
        intakeStatus === "duplicate"
          ? "Discovery intake recorded as duplicate."
          : "Discovery intake candidate created.",
      data: {
        discoveredTool,
        evidenceId: evidence.id,
        duplicateCandidateId,
        duplicateWarnings,
      },
    },
    201
  );
}
