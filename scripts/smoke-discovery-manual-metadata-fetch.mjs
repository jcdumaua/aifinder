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
  logStep("Cleaning up Phase 7C smoke data");

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
    created_by: "scripts/smoke-discovery-manual-metadata-fetch.mjs",
  };
}

function buildManualRunUrl(url, timestamp, label) {
  return {
    url,
    policy_review: {
      robots_txt_review: "allowed",
      terms_review: "allowed",
      permission_status: "allowed",
      permission_notes: `Phase 7C ${label} metadata-fetch smoke policy review.`,
      reviewed_at: new Date(timestamp).toISOString(),
      reviewed_by: "Phase 7C smoke test",
    },
  };
}

function assertNoUnsafeMetadata(value, path = "fetch_results") {
  const forbiddenKeys = new Set([
    "body",
    "response_body",
    "html",
    "raw_html",
    "title",
    "description",
    "extracted",
    "candidate",
    "tool",
    "cookies",
    "authorization",
    "csrf",
    "token",
    "secret",
    "environment",
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

function assertSafeFetchResults(fetchResults, expectedCount) {
  const allowedKeys = [
    "normalized_url",
    "hostname",
    "status",
    "http_status",
    "content_type",
    "content_length_header",
    "resolved_ip_family",
    "bytes_read",
    "response_truncated",
    "duration_ms",
    "error_code",
    "failure_reason",
  ].sort();

  assert(Array.isArray(fetchResults), "fetch_results must be an array.");
  assert(fetchResults.length === expectedCount, "fetch_results count is incorrect.");

  for (const [index, fetchResult] of fetchResults.entries()) {
    assert(fetchResult && typeof fetchResult === "object", `fetch_results[${index}] is invalid.`);
    assert(
      Object.keys(fetchResult).sort().join("\n") === allowedKeys.join("\n"),
      `fetch_results[${index}] contains an unsafe field.`
    );
  }

  assertNoUnsafeMetadata(fetchResults);
}

async function createSourceAndRun({ csrfToken, timestamp, label, urls }) {
  const sourcePayload = await apiFetch("/api/admin/discovery/sources", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify({
      name: `Phase 7C ${label} Source ${timestamp}`,
      description: "Phase 7C manual metadata-fetch smoke source.",
      source_type: "manual",
      url: `https://example.com/aifinder-phase-7c-${label}-${timestamp}`,
      is_active: true,
      config: buildManualSourceConfig(),
    }),
  });
  const sourceId = sourcePayload?.data?.source?.id || sourcePayload?.data?.id;

  assert(typeof sourceId === "string", `${label} source ID was not returned.`);
  created.sourceIds.push(sourceId);

  const runPayload = await apiFetch("/api/admin/discovery/runs/manual", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify({
      source_id: sourceId,
      urls: urls.map((url) => buildManualRunUrl(url, timestamp, label)),
    }),
  });
  const run = runPayload?.data?.run || runPayload?.run;

  assert(run?.id && run.status === "pending", `${label} run was not pending.`);
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

async function claimManualMetadataFetch(csrfToken, runId) {
  return apiFetchRaw("/api/admin/discovery/runs/manual/claim", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify({
      run_id: runId,
      execution_mode: "manual_metadata_fetch",
    }),
  });
}

async function assertCompletedFetchCase({
  supabase,
  csrfToken,
  timestamp,
  label,
  urls,
  expectedFailedUrls = null,
}) {
  logStep(`Creating and claiming ${label} manual metadata-fetch run`);
  const { sourceId, runId } = await createSourceAndRun({
    csrfToken,
    timestamp,
    label,
    urls,
  });
  const claim = await claimManualMetadataFetch(csrfToken, runId);

  assert(claim.response.ok, `${label} claim failed.`);

  const run = await readRun(supabase, runId);
  const stats = run.stats || {};

  assert(run.status === "completed", `${label} run was not completed.`);
  assert(stats.executor_mode === "manual_metadata_fetch", `${label} mode is wrong.`);
  assert(stats.dry_run === false, `${label} remained dry-run.`);
  assert(stats.execution_enabled === true, `${label} execution was not enabled.`);
  assert(
    stats.execution_status === "manual_metadata_fetch_completed",
    `${label} execution status is wrong.`
  );
  assert(stats.no_fetch_performed === false, `${label} did not record fetches.`);
  assert(stats.no_extraction_performed === true, `${label} extraction flag changed.`);
  assert(stats.no_llm_analysis_performed === true, `${label} LLM flag changed.`);
  assert(stats.no_candidates_inserted === true, `${label} candidate flag changed.`);
  assert(stats.no_public_tools_inserted === true, `${label} public-tools flag changed.`);
  assert(stats.total_urls === urls.length, `${label} total URL count is wrong.`);
  assert(stats.fetched_urls >= 1, `${label} recorded no successful fetch.`);
  if (expectedFailedUrls !== null) {
    assert(
      stats.failed_urls === expectedFailedUrls,
      `${label} failed URL count is wrong.`
    );
  }
  assert(
    stats.fetched_urls + stats.failed_urls + stats.skipped_urls === urls.length,
    `${label} URL counts do not balance.`
  );
  assertSafeFetchResults(stats.fetch_results, urls.length);

  const auditEventTypes = await readAuditEventTypes(supabase, sourceId, runId);

  for (const eventType of [
    "request_plan_preflight_started",
    "request_plan_preflight_passed",
    "manual_metadata_fetch_started",
    "manual_metadata_fetch_completed",
  ]) {
    assert(auditEventTypes.includes(eventType), `${label} missing ${eventType} audit.`);
  }

  assert(
    auditEventTypes.filter((eventType) => eventType === "manual_metadata_fetch_url_completed")
      .length >= stats.fetched_urls,
    `${label} is missing successful per-URL audit events.`
  );
}

async function assertOverCapCase({ supabase, csrfToken, timestamp }) {
  logStep("Creating and claiming over-cap manual metadata-fetch run");
  const { sourceId, runId } = await createSourceAndRun({
    csrfToken,
    timestamp,
    label: "OverCap",
    urls: [
      "https://example.com/aifinder-phase-7c-over-cap-1",
      "https://example.com/aifinder-phase-7c-over-cap-2",
      "https://example.com/aifinder-phase-7c-over-cap-3",
      "https://example.com/aifinder-phase-7c-over-cap-4",
    ],
  });
  const claim = await claimManualMetadataFetch(csrfToken, runId);

  assert(claim.response.status === 422, "Over-cap claim did not return 422.");
  assert(
    claim.payload?.data?.reason === "manual_metadata_fetch_url_cap_exceeded",
    "Over-cap claim returned an unsafe or incorrect reason."
  );

  const run = await readRun(supabase, runId);
  const stats = run.stats || {};

  assert(run.status === "failed", "Over-cap run was not failed.");
  assert(stats.no_fetch_performed === true, "Over-cap run performed a fetch.");
  assert(stats.fetch_results?.length === 0, "Over-cap run recorded a fetch result.");
  assert(stats.total_urls === 4, "Over-cap run count is wrong.");
  assert(stats.skipped_urls === 4, "Over-cap run did not skip all URLs.");

  const auditEventTypes = await readAuditEventTypes(supabase, sourceId, runId);
  assert(
    auditEventTypes.includes("manual_metadata_fetch_failed"),
    "Over-cap run missing safe failure audit."
  );
  assert(
    !auditEventTypes.includes("manual_metadata_fetch_started"),
    "Over-cap run started a fetch executor."
  );
}

async function assertUnsafePreflightCase({ supabase, csrfToken, timestamp }) {
  logStep("Creating and claiming unsafe manual metadata-fetch run");
  const { sourceId, runId } = await createSourceAndRun({
    csrfToken,
    timestamp,
    label: "Unsafe",
    urls: ["https://100.64.0.1/aifinder-phase-7c-unsafe"],
  });
  const claim = await claimManualMetadataFetch(csrfToken, runId);

  assert(claim.response.status === 422, "Unsafe claim did not return 422.");
  assert(
    claim.payload?.data?.reason === "rejected_preflight",
    "Unsafe claim did not return rejected_preflight."
  );

  const run = await readRun(supabase, runId);
  const stats = run.stats || {};

  assert(run.status === "failed", "Unsafe run was not failed.");
  assert(stats.reason === "rejected_preflight", "Unsafe run reason is wrong.");
  assert(stats.no_fetch_performed === true, "Unsafe run performed a fetch.");

  const auditEventTypes = await readAuditEventTypes(supabase, sourceId, runId);
  assert(
    auditEventTypes.includes("request_plan_preflight_rejected"),
    "Unsafe run missing preflight rejection audit."
  );
  assert(
    !auditEventTypes.includes("manual_metadata_fetch_started"),
    "Unsafe run started a fetch executor."
  );
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

    await assertCompletedFetchCase({
      supabase,
      csrfToken,
      timestamp,
      label: "Single",
      urls: ["https://example.com/aifinder-phase-7c-single"],
    });
    await assertCompletedFetchCase({
      supabase,
      csrfToken,
      timestamp,
      label: "Batch",
      urls: [
        "https://example.com/aifinder-phase-7c-batch-1",
        "https://example.com/aifinder-phase-7c-batch-2",
      ],
    });
    await assertCompletedFetchCase({
      supabase,
      csrfToken,
      timestamp,
      label: "Partial",
      urls: [
        "https://example.com/aifinder-phase-7c-partial-success",
        "https://example.com:1/aifinder-phase-7c-partial-failure",
      ],
      expectedFailedUrls: 1,
    });
    await assertOverCapCase({ supabase, csrfToken, timestamp });
    await assertUnsafePreflightCase({ supabase, csrfToken, timestamp });

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
    console.log("\n✅ Phase 7C manual metadata-fetch smoke test passed.");
  } catch (error) {
    console.error("\n❌ Phase 7C manual metadata-fetch smoke test failed.");
    console.error(error instanceof Error ? error.message : error);
    await cleanup(supabase);
    process.exitCode = 1;
  }
}

await main();
