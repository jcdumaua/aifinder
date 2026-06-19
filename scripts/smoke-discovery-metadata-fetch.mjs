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
const created = { sourceIds: [], runIds: [] };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function logStep(message) {
  console.log(`\n▶ ${message}`);
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

async function apiFetchRaw(path, options = {}) {
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

  return {
    response,
    payload: await response.json().catch(() => null),
  };
}

async function apiFetch(path, options = {}) {
  const { response, payload } = await apiFetchRaw(path, options);

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed.`);
  }

  return payload;
}

async function getTableCount(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`Failed to count ${tableName}.`);

  return count || 0;
}

async function cleanup(supabase) {
  logStep("Cleaning up Phase 6Z smoke data");

  if (created.runIds.length > 0) {
    await supabase.from("discovery_runs").delete().in("id", created.runIds);
  }

  for (const sourceId of created.sourceIds) {
    await supabase
      .from("discovery_audit_events")
      .delete()
      .eq("metadata->>source_id", sourceId);
  }

  if (created.sourceIds.length > 0) {
    await supabase.from("discovery_sources").delete().in("id", created.sourceIds);
  }
}

function buildManualSourceConfig() {
  return {
    kind: "manual_curated_urls",
    approval_status: "approved_for_first_manual_prototype",
    risk_level: "low",
    policy_review_required_before_fetch: true,
    policy: { review_mode: "per_url_required_before_fetch" },
    smoke: true,
    created_by: "scripts/smoke-discovery-metadata-fetch.mjs",
  };
}

function buildManualRunUrl(timestamp) {
  return {
    url: "https://example.com/",
    policy_review: {
      robots_txt_review: "allowed",
      terms_review: "allowed",
      permission_status: "allowed",
      permission_notes: "Phase 6Z metadata-fetch smoke policy review.",
      reviewed_at: new Date(timestamp).toISOString(),
      reviewed_by: "Phase 6Z smoke test",
    },
  };
}

function assertNoUnsafeMetadata(value, path = "fetch_metadata") {
  const forbiddenKeys = new Set([
    "body",
    "html",
    "title",
    "description",
    "tool",
    "candidate",
    "cookies",
    "authorization",
  ]);

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUnsafeMetadata(item, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key.toLowerCase()), `${path}.${key} is not allowed.`);
    assertNoUnsafeMetadata(nestedValue, `${path}.${key}`);
  }
}

async function createSourceAndRun(csrfToken, timestamp) {
  const sourcePayload = await apiFetch("/api/admin/discovery/sources", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify({
      name: `Phase 6Z Metadata Fetch Source ${timestamp}`,
      description: "Phase 6Z metadata-only fetch smoke source.",
      source_type: "manual",
      url: `https://example.com/aifinder-phase-6z-${timestamp}`,
      is_active: true,
      config: buildManualSourceConfig(),
    }),
  });
  const sourceId = sourcePayload?.data?.source?.id || sourcePayload?.data?.id;

  assert(typeof sourceId === "string", "Source ID was not returned.");
  created.sourceIds.push(sourceId);

  const runPayload = await apiFetch("/api/admin/discovery/runs/manual", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify({
      source_id: sourceId,
      urls: [buildManualRunUrl(timestamp)],
    }),
  });
  const run = runPayload?.data?.run || runPayload?.run;

  assert(run?.id && run.status === "pending", "Manual run was not pending.");
  created.runIds.push(run.id);

  return { sourceId, runId: run.id };
}

async function readRun(supabase, runId) {
  const { data, error } = await supabase
    .from("discovery_runs")
    .select("id, status, stats")
    .eq("id", runId)
    .single();

  if (error) throw new Error("Failed to read smoke run.");

  return data;
}

async function readAuditEventTypes(supabase, sourceId, runId) {
  const { data, error } = await supabase
    .from("discovery_audit_events")
    .select("metadata")
    .eq("metadata->>source_id", sourceId)
    .eq("metadata->>run_id", runId);

  if (error) throw new Error("Failed to read smoke audit events.");

  return (data || []).map((event) => event.metadata?.event_type);
}

async function main() {
  assert(
    cookieHeader,
    "Missing AIFINDER_ADMIN_COOKIE. Log in locally and rerun this script."
  );
  assert(supabaseUrl, "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  assert(supabaseServiceRoleKey, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const timestamp = Date.now();
  const countsBefore = {
    discoveredTools: await getTableCount(supabase, "discovered_tools"),
    publicTools: await getTableCount(supabase, "tools"),
  };

  try {
    logStep("Creating CSRF token");
    const csrfPayload = await apiFetch("/api/admin/csrf");
    const csrfToken = csrfPayload?.csrfToken;

    assert(typeof csrfToken === "string", "CSRF token was not returned.");

    logStep("Creating approved source and pending run");
    const { sourceId, runId } = await createSourceAndRun(csrfToken, timestamp);

    logStep("Claiming metadata-fetch smoke run");
    const claim = await apiFetchRaw("/api/admin/discovery/runs/manual/claim", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
      body: JSON.stringify({
        run_id: runId,
        execution_mode: "metadata_fetch_smoke",
      }),
    });

    if (!claim.response.ok) {
      console.log("Claim response status:", claim.response.status);
      console.log("Claim response payload:", JSON.stringify(claim.payload, null, 2));
      throw new Error("Metadata-fetch smoke claim failed.");
    }

    const run = await readRun(supabase, runId);
    const stats = run.stats || {};
    const metadata = stats.fetch_metadata;

    assert(run.status === "completed", `Expected completed run, received ${run.status}.`);
    assert(stats.executor_mode === "metadata_fetch_smoke", "Wrong executor mode.");
    assert(stats.dry_run === false, "Smoke run remained dry-run.");
    assert(stats.execution_enabled === true, "Smoke run execution was not enabled.");
    assert(
      stats.execution_status === "metadata_fetch_smoke_completed",
      "Wrong execution status."
    );
    assert(stats.no_fetch_performed === false, "Metadata fetch was not recorded.");
    assert(stats.no_extraction_performed === true, "Extraction safety flag changed.");
    assert(stats.no_llm_analysis_performed === true, "LLM safety flag changed.");
    assert(stats.no_candidates_inserted === true, "Candidate insert safety flag changed.");
    assert(stats.no_public_tools_inserted === true, "Public tool insert safety flag changed.");
    assert(stats.fetch_adapter_status === "fetch_completed_metadata_only", "Wrong adapter status.");
    assert(metadata && typeof metadata === "object", "Fetch metadata was not recorded.");
    assert(metadata.hostname === "example.com", "Wrong fetch hostname.");
    assert(metadata.method === "GET", "Wrong fetch method.");
    assert(metadata.redirectLimit === 0, "Redirect limit changed.");
    assert(metadata.dnsResolutionChecked === true, "DNS was not checked.");
    assert(metadata.dnsRebindingProtectionApplied === true, "DNS pinning was not recorded.");
    assert(metadata.connectionPinnedToResolvedIp === true, "Connection was not pinned.");
    assertNoUnsafeMetadata(metadata);

    const auditEventTypes = await readAuditEventTypes(supabase, sourceId, runId);

    for (const eventType of [
      "request_plan_preflight_started",
      "request_plan_preflight_passed",
      "metadata_fetch_smoke_started",
      "metadata_fetch_smoke_completed",
    ]) {
      assert(auditEventTypes.includes(eventType), `Missing ${eventType} audit event.`);
    }

    const countsAfter = {
      discoveredTools: await getTableCount(supabase, "discovered_tools"),
      publicTools: await getTableCount(supabase, "tools"),
    };

    assert(
      countsAfter.discoveredTools === countsBefore.discoveredTools,
      "discovered_tools count changed."
    );
    assert(countsAfter.publicTools === countsBefore.publicTools, "public.tools count changed.");

    await cleanup(supabase);
    console.log("\n✅ Phase 6Z metadata-fetch smoke test passed.");
  } catch (error) {
    console.error("\n❌ Phase 6Z metadata-fetch smoke test failed.");
    console.error(error instanceof Error ? error.message : error);
    await cleanup(supabase);
    process.exitCode = 1;
  }
}

await main();
