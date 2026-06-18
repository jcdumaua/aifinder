#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const baseUrl = process.env.AIFINDER_BASE_URL || "http://localhost:3000";
let cookieHeader = process.env.AIFINDER_ADMIN_COOKIE || "";
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const created = {
  sourceIds: [],
  runIds: [],
  discoveredToolIds: [],
  duplicateCandidateIds: [],
};

function logStep(message) {
  console.log(`\n▶ ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pickString(...values) {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

function debugPayload(label, payload) {
  console.log(`${label}:`);
  console.log(JSON.stringify(payload, null, 2));
}

function mergeCookieHeader(existingCookieHeader, setCookieHeader) {
  const cookieMap = new Map();

  for (const cookiePart of existingCookieHeader.split(";")) {
    const trimmed = cookiePart.trim();
    if (!trimmed || !trimmed.includes("=")) continue;

    const [name, ...valueParts] = trimmed.split("=");
    cookieMap.set(name, `${name}=${valueParts.join("=")}`);
  }

  if (setCookieHeader) {
    const cookie = setCookieHeader.split(";")[0]?.trim();

    if (cookie && cookie.includes("=")) {
      const [name] = cookie.split("=");
      cookieMap.set(name, cookie);
    }
  }

  return [...cookieMap.values()].join("; ");
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(options.headers || {}),
    },
  });

  const setCookieHeader = response.headers.get("set-cookie");
  cookieHeader = mergeCookieHeader(cookieHeader, setCookieHeader);

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} failed: ${
        payload?.error || response.statusText
      }`
    );
  }

  return payload;
}

async function cleanup(supabase) {
  logStep("Cleaning up smoke test data");

  if (created.duplicateCandidateIds.length > 0) {
    await supabase
      .from("discovery_duplicate_candidates")
      .delete()
      .in("id", created.duplicateCandidateIds);
  }

  if (created.discoveredToolIds.length > 0) {
    await supabase
      .from("discovery_duplicate_candidates")
      .delete()
      .in("discovered_tool_id", created.discoveredToolIds);

    await supabase
      .from("discovery_evidence")
      .delete()
      .in("discovered_tool_id", created.discoveredToolIds);

    await supabase
      .from("discovery_audit_events")
      .delete()
      .in("discovered_tool_id", created.discoveredToolIds);

    await supabase
      .from("discovered_tools")
      .delete()
      .in("id", created.discoveredToolIds);
  }

  if (created.runIds.length > 0) {
    await supabase.from("discovery_runs").delete().in("id", created.runIds);
  }

  if (created.sourceIds.length > 0) {
    await supabase
      .from("discovery_sources")
      .delete()
      .in("id", created.sourceIds);
  }

  console.log("Cleanup complete.");
}

async function main() {
  assert(
    cookieHeader,
    "Missing AIFINDER_ADMIN_COOKIE. Log in locally, copy your localhost admin cookie header, then rerun."
  );
  assert(supabaseUrl, "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  assert(supabaseServiceRoleKey, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const timestamp = Date.now();
  const smokeSlug = `smoke-discovery-${timestamp}`;
  const smokeWebsite = `https://example.com/aifinder-${smokeSlug}`;

  try {
    logStep("Creating CSRF token");
    const csrfPayload = await apiFetch("/api/admin/csrf", { method: "GET" });
    const csrfToken = csrfPayload?.csrfToken;

    assert(typeof csrfToken === "string", "CSRF token was not returned.");

    logStep("Creating discovery source");
    const sourcePayload = await apiFetch("/api/admin/discovery/sources", {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        name: `Smoke Discovery Source ${timestamp}`,
        slug: smokeSlug,
        source_type: "manual",
        url: smokeWebsite,
        is_active: true,
        config: {
          smoke: true,
          created_by: "scripts/smoke-discovery-flow.mjs",
        },
      }),
    });

    const sourceId = pickString(
      sourcePayload?.data?.id,
      sourcePayload?.data?.source?.id,
      sourcePayload?.source?.id,
      sourcePayload?.id
    );

    if (!sourceId) {
      debugPayload("Source create response", sourcePayload);
      throw new Error("Source ID was not returned.");
    }

    created.sourceIds.push(sourceId);

    logStep("Creating manual intake candidate");
    const intakePayload = await apiFetch("/api/admin/discovery/intake", {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        source_id: sourceId,
        name: `Smoke Discovery Tool ${timestamp}`,
        website: smokeWebsite,
        category: "Productivity",
        pricing: "Free",
        discovery_score: 0.94,
        description:
          "Smoke test candidate for validating discovery intake, queue, detail, and cleanup.",
      }),
    });

    const discoveredToolId = pickString(
      intakePayload?.data?.discoveredToolId,
      intakePayload?.data?.discovered_tool_id,
      intakePayload?.data?.tool?.id,
      intakePayload?.data?.discoveredTool?.id,
      intakePayload?.discoveredToolId
    );
    const runId = pickString(
      intakePayload?.data?.runId,
      intakePayload?.data?.run_id,
      intakePayload?.data?.run?.id,
      intakePayload?.runId
    );

    if (!discoveredToolId || !runId) {
      debugPayload("Manual intake response", intakePayload);
      throw new Error("Discovered tool ID or run ID was not returned.");
    }

    created.discoveredToolIds.push(discoveredToolId);
    created.runIds.push(runId);

    logStep("Adding duplicate candidate directly for queue summary check");
    const { data: duplicateCandidate, error: duplicateError } = await supabase
      .from("discovery_duplicate_candidates")
      .insert({
        discovered_tool_id: discoveredToolId,
        candidate_type: "discovered_tool",
        candidate_discovered_tool_id: discoveredToolId,
        match_type: "exact_name",
        match_score: 100,
        is_blocking: true,
        reason: "Smoke duplicate summary check.",
      })
      .select("id")
      .single();

    if (duplicateError) {
      throw new Error(`Duplicate insert failed: ${duplicateError.message}`);
    }

    created.duplicateCandidateIds.push(duplicateCandidate.id);

    logStep("Checking queue API visibility");
    const queuePayload = await apiFetch(
      `/api/admin/discovery/discovered-tools?source_id=${sourceId}&page=1&limit=20`
    );

    const queueRows = Array.isArray(queuePayload?.data) ? queuePayload.data : [];
    const queueRow = queueRows.find((row) => row.id === discoveredToolId);

    assert(queueRow, "Created candidate was not visible in queue API.");
    assert(queueRow.source?.id === sourceId, "Queue row source was not linked.");
    assert(queueRow.run?.id === runId, "Queue row run was not linked.");
    assert(
      queueRow.duplicate_count >= 1,
      "Queue row duplicate_count was not returned."
    );
    assert(
      queueRow.blocking_duplicate_count >= 1,
      "Queue row blocking_duplicate_count was not returned."
    );

    logStep("Checking detail API visibility");
    const detailPayload = await apiFetch(
      `/api/admin/discovery/discovered-tools/${discoveredToolId}`
    );

    assert(
      detailPayload?.data?.tool?.id === discoveredToolId,
      "Detail API did not return the created candidate."
    );
    assert(
      detailPayload?.data?.source?.id === sourceId,
      "Detail API did not return linked source."
    );
    assert(
      detailPayload?.data?.run?.id === runId,
      "Detail API did not return linked run."
    );
    assert(
      Array.isArray(detailPayload?.data?.evidence) &&
        detailPayload.data.evidence.length > 0,
      "Detail API did not return evidence."
    );
    assert(
      Array.isArray(detailPayload?.data?.duplicateCandidates) &&
        detailPayload.data.duplicateCandidates.length > 0,
      "Detail API did not return duplicate candidates."
    );
    assert(
      Array.isArray(detailPayload?.data?.auditEvents) &&
        detailPayload.data.auditEvents.length > 0,
      "Detail API did not return audit events."
    );

    await cleanup(supabase);

    console.log("\n✅ Discovery smoke test passed.");
  } catch (error) {
    console.error("\n❌ Discovery smoke test failed.");
    console.error(error instanceof Error ? error.message : error);

    await cleanup(supabase);

    process.exitCode = 1;
  }
}

await main();
