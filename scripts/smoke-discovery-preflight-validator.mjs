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
};

function logStep(message) {
  console.log(`\n▶ ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

  const payload = await response.json().catch(() => null);

  return { response, payload };
}

async function apiFetch(path, options = {}) {
  const { response, payload } = await apiFetchRaw(path, options);

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} failed: ${
        payload?.error || response.statusText
      }`
    );
  }

  return payload;
}

async function getTableCount(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count ${tableName}: ${error.message}`);
  }

  return count || 0;
}

async function cleanup(supabase) {
  logStep("Cleaning up Phase 6V smoke test data");

  if (created.runIds.length > 0) {
    await supabase.from("discovery_runs").delete().in("id", created.runIds);
  }

  if (created.sourceIds.length > 0) {
    for (const sourceId of created.sourceIds) {
      await supabase
        .from("discovery_audit_events")
        .delete()
        .eq("metadata->>source_id", sourceId);
    }

    await supabase
      .from("discovery_sources")
      .delete()
      .in("id", created.sourceIds);
  }

  console.log("Cleanup complete.");
}

function getIdFromSourcePayload(payload) {
  return (
    payload?.data?.source?.id ||
    payload?.data?.id ||
    payload?.source?.id ||
    payload?.id
  );
}

function getRunFromPayload(payload) {
  return payload?.data?.run || payload?.run;
}

function buildManualSourceConfig() {
  return {
    kind: "manual_curated_urls",
    approval_status: "approved_for_first_manual_prototype",
    risk_level: "low",
    policy_review_required_before_fetch: true,
    policy: {
      review_mode: "per_url_required_before_fetch",
    },
    smoke: true,
    created_by: "scripts/smoke-discovery-preflight-validator.mjs",
  };
}

function buildManualRunUrl(url, timestamp, label) {
  return {
    url,
    policy_review: {
      robots_txt_review: "allowed",
      terms_review: "allowed",
      permission_status: "allowed",
      permission_notes: `Phase 6V smoke ${label} policy review.`,
      reviewed_at: new Date(timestamp).toISOString(),
      reviewed_by: "Phase 6V smoke test",
    },
  };
}

async function createManualSource({ csrfToken, timestamp, label }) {
  const payload = await apiFetch("/api/admin/discovery/sources", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      name: `Phase 6V ${label} Source ${timestamp}`,
      description: `Phase 6V ${label} preflight smoke source.`,
      source_type: "manual",
      url: `https://example.com/aifinder-phase-6v-${label}-${timestamp}`,
      is_active: true,
      config: buildManualSourceConfig(),
    }),
  });

  const sourceId = getIdFromSourcePayload(payload);

  assert(typeof sourceId === "string", `${label} source ID was not returned.`);

  created.sourceIds.push(sourceId);

  return sourceId;
}

async function createManualRun({ csrfToken, sourceId, url, timestamp, label }) {
  const payload = await apiFetch("/api/admin/discovery/runs/manual", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      source_id: sourceId,
      urls: [buildManualRunUrl(url, timestamp, label)],
    }),
  });

  const run = getRunFromPayload(payload);

  assert(run?.id, `${label} run ID was not returned.`);
  assert(run.status === "pending", `${label} run was not pending.`);

  created.runIds.push(run.id);

  return run;
}

async function readRun(supabase, runId) {
  const { data, error } = await supabase
    .from("discovery_runs")
    .select("id, source_id, status, stats, error_log, started_at, finished_at")
    .eq("id", runId)
    .single();

  if (error) {
    throw new Error(`Failed to read run ${runId}: ${error.message}`);
  }

  return data;
}

async function readAuditEvents(supabase, sourceId, runId) {
  const { data, error } = await supabase
    .from("discovery_audit_events")
    .select("action, message, metadata, created_at")
    .eq("metadata->>source_id", sourceId)
    .eq("metadata->>run_id", runId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to read audit events: ${error.message}`);
  }

  return data || [];
}

async function claimRun({ csrfToken, runId }) {
  return apiFetchRaw("/api/admin/discovery/runs/manual/claim", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      run_id: runId,
    }),
  });
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
  const countsBefore = {
    discoveredTools: await getTableCount(supabase, "discovered_tools"),
    publicTools: await getTableCount(supabase, "tools"),
  };

  try {
    logStep("Creating CSRF token");
    const csrfPayload = await apiFetch("/api/admin/csrf", { method: "GET" });
    const csrfToken = csrfPayload?.csrfToken;

    assert(typeof csrfToken === "string", "CSRF token was not returned.");

    logStep("Creating valid preflight source and run");
    const validSourceId = await createManualSource({
      csrfToken,
      timestamp,
      label: "Valid",
    });
    const validRun = await createManualRun({
      csrfToken,
      sourceId: validSourceId,
      url: "https://example.com/aifinder-phase-6v-valid",
      timestamp,
      label: "valid",
    });

    logStep("Claiming valid run");
    const validClaim = await claimRun({
      csrfToken,
      runId: validRun.id,
    });

    if (!validClaim.response.ok) {
      console.log(JSON.stringify(validClaim.payload, null, 2));
      throw new Error("Valid preflight claim failed.");
    }

    const validRunAfter = await readRun(supabase, validRun.id);
    assert(
      validRunAfter.status === "completed",
      `Valid run expected completed, received ${validRunAfter.status}.`
    );
    assert(
      validRunAfter.stats?.request_plan_preflight?.status === "passed",
      "Valid run did not record passed preflight."
    );
    assert(
      Array.isArray(validRunAfter.stats?.request_plan_preflight?.plans) &&
        validRunAfter.stats.request_plan_preflight.plans.length === 1,
      "Valid run did not record exactly one request plan."
    );
    assert(validRunAfter.stats?.no_fetch_performed === true, "Valid run fetched.");
    assert(
      validRunAfter.stats?.no_candidates_inserted === true,
      "Valid run inserted candidates."
    );
    assert(
      validRunAfter.stats?.no_public_tools_inserted === true,
      "Valid run inserted public tools."
    );

    const validAuditEvents = await readAuditEvents(
      supabase,
      validSourceId,
      validRun.id
    );
    const validEventTypes = validAuditEvents.map(
      (event) => event.metadata?.event_type
    );

    assert(
      validEventTypes.includes("request_plan_preflight_started"),
      "Valid run missing preflight started audit."
    );
    assert(
      validEventTypes.includes("request_plan_preflight_passed"),
      "Valid run missing preflight passed audit."
    );
    assert(
      validEventTypes.includes("manual_crawler_executor_dry_run_completed"),
      "Valid run missing dry-run completed audit."
    );

    logStep("Creating rejected preflight source and run");
    const rejectedSourceId = await createManualSource({
      csrfToken,
      timestamp,
      label: "Rejected",
    });
    const rejectedRun = await createManualRun({
      csrfToken,
      sourceId: rejectedSourceId,
      url: "https://100.64.0.1/aifinder-phase-6v-rejected",
      timestamp,
      label: "rejected",
    });

    logStep("Claiming rejected run");
    const rejectedClaim = await claimRun({
      csrfToken,
      runId: rejectedRun.id,
    });

    assert(
      rejectedClaim.response.status === 422,
      `Rejected preflight expected 422, received ${rejectedClaim.response.status}.`
    );
    assert(
      rejectedClaim.payload?.data?.reason === "rejected_preflight",
      "Rejected claim did not return rejected_preflight reason."
    );

    const rejectedRunAfter = await readRun(supabase, rejectedRun.id);
    assert(
      rejectedRunAfter.status === "failed",
      `Rejected run expected failed, received ${rejectedRunAfter.status}.`
    );
    assert(
      rejectedRunAfter.stats?.reason === "rejected_preflight",
      "Rejected run missing rejected_preflight reason."
    );
    assert(
      rejectedRunAfter.stats?.preflight_failure_code === "blocked_ip_address",
      "Rejected run did not record blocked_ip_address."
    );
    assert(
      rejectedRunAfter.stats?.no_fetch_performed === true,
      "Rejected run fetched."
    );
    assert(
      rejectedRunAfter.stats?.no_candidates_inserted === true,
      "Rejected run inserted candidates."
    );
    assert(
      rejectedRunAfter.stats?.no_public_tools_inserted === true,
      "Rejected run inserted public tools."
    );

    const rejectedAuditEvents = await readAuditEvents(
      supabase,
      rejectedSourceId,
      rejectedRun.id
    );
    const rejectedEventTypes = rejectedAuditEvents.map(
      (event) => event.metadata?.event_type
    );

    assert(
      rejectedEventTypes.includes("request_plan_preflight_started"),
      "Rejected run missing preflight started audit."
    );
    assert(
      rejectedEventTypes.includes("request_plan_preflight_rejected"),
      "Rejected run missing preflight rejected audit."
    );

    const countsAfter = {
      discoveredTools: await getTableCount(supabase, "discovered_tools"),
      publicTools: await getTableCount(supabase, "tools"),
    };

    assert(
      countsAfter.discoveredTools === countsBefore.discoveredTools,
      "discovered_tools count changed during Phase 6V smoke."
    );
    assert(
      countsAfter.publicTools === countsBefore.publicTools,
      "public.tools count changed during Phase 6V smoke."
    );

    await cleanup(supabase);

    console.log("\n✅ Phase 6V preflight validator smoke test passed.");
    console.log(
      JSON.stringify(
        {
          validRun: {
            id: validRunAfter.id,
            status: validRunAfter.status,
            preflightStatus: validRunAfter.stats?.request_plan_preflight?.status,
            noFetch: validRunAfter.stats?.no_fetch_performed,
          },
          rejectedRun: {
            id: rejectedRunAfter.id,
            status: rejectedRunAfter.status,
            reason: rejectedRunAfter.stats?.reason,
            failureCode: rejectedRunAfter.stats?.preflight_failure_code,
            noFetch: rejectedRunAfter.stats?.no_fetch_performed,
          },
          countsBefore,
          countsAfter,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("\n❌ Phase 6V preflight validator smoke test failed.");
    console.error(error instanceof Error ? error.message : error);

    await cleanup(supabase);

    process.exitCode = 1;
  }
}

await main();
