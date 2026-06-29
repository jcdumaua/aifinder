#!/usr/bin/env node

/**
 * Phase 14K-A — Controlled Reviewable Preview Artifact Preparation
 *
 * Creates exactly one controlled reviewable v2 preview artifact for the
 * Phase 14J/14K controlled live staging smoke.
 *
 * Requires exact opt-in and exact approval environment variables.
 *
 * This script may write only:
 * - optionally one clearly marked discovery source when fallback is enabled;
 * - optionally one clearly marked discovery run when fallback is enabled;
 * - exactly one reviewable v2 discovery_candidate_preview_artifacts row.
 *
 * This script must not:
 * - POST to /api/admin/discovery/candidate-extraction/invoke
 * - fetch CSRF
 * - send dry_run=false
 * - stage candidates
 * - write public.tools
 * - write discovered_tools
 * - publish anything
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MARKER = "phase-14k-a-controlled-preview-artifact-preparation";
const OPT_IN_ENV =
  "AIFINDER_RUN_PHASE_14K_A_CONTROLLED_PREVIEW_ARTIFACT_PREPARATION";
const APPROVAL_ENV = "AIFINDER_PHASE_14K_A_APPROVAL";
const REQUIRED_APPROVAL =
  "Approve run Phase 14K-A controlled preview artifact preparation";
const FALLBACK_ENV =
  "AIFINDER_PHASE_14K_A_ALLOW_SOURCE_RUN_FALLBACK";

const PREVIEW_SCHEMA_VERSION = "candidate_preview_artifact.v2";
const PREVIEW_STATUS = "reviewable";
const CANDIDATE_NAME = "Phase 14K Controlled Preview Artifact Smoke Tool";
const CANDIDATE_WEBSITE_URL =
  "https://example.com/phase-14k-controlled-preview-tool";
const FALLBACK_SOURCE_URL =
  "https://example.com/phase-14k-controlled-preview-source";
const EVIDENCE_SUMMARY =
  "Controlled Phase 14K-A preview artifact fixture for live staging smoke readiness only.";
const SOURCE_EVIDENCE_LOCATOR =
  "manual:phase-14k-a-controlled-preview-artifact-preparation";
const SAFETY_FLAGS = ["source_url_snapshot_validated"];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function assertOptIn() {
  if (process.env[OPT_IN_ENV] !== "1") {
    throw new Error(
      `Missing opt-in. Set ${OPT_IN_ENV}=1 to run this controlled preparation.`,
    );
  }

  if (process.env[APPROVAL_ENV] !== REQUIRED_APPROVAL) {
    throw new Error(
      `Missing exact approval. Set ${APPROVAL_ENV}="${REQUIRED_APPROVAL}".`,
    );
  }
}

function assertSafeHttps(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${label} must use HTTPS.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${label} must not include credentials.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    throw new Error(`${label} must not be local/private/internal.`);
  }

  return parsed.toString();
}

function getSupabaseEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

function getSourceUrl(row) {
  const directKeys = [
    "source_url",
    "url",
    "website_url",
    "homepage_url",
    "input_url",
    "source_value",
  ];

  for (const key of directKeys) {
    if (typeof row[key] === "string") {
      try {
        return assertSafeHttps(row[key], `discovery_sources.${key}`);
      } catch {
        // Keep trying candidate source URL fields.
      }
    }
  }

  for (const containerKey of ["metadata", "config", "settings"]) {
    const value = row[containerKey];

    if (!value || typeof value !== "object") continue;

    for (const key of directKeys) {
      if (typeof value[key] === "string") {
        try {
          return assertSafeHttps(
            value[key],
            `discovery_sources.${containerKey}.${key}`,
          );
        } catch {
          // Keep trying candidate source URL fields.
        }
      }
    }
  }

  return null;
}

function getRunSourceId(row) {
  for (const key of ["source_id", "discovery_source_id"]) {
    if (typeof row[key] === "string") return row[key];
  }

  return null;
}

function requireCleanEnoughRow(row, label) {
  if (!row || typeof row.id !== "string" || !row.id) {
    throw new Error(`${label} must have an id.`);
  }
}

async function selectRows(
  supabase,
  table,
  orderColumnCandidates = ["updated_at", "created_at", "id"],
) {
  let lastError = null;

  for (const column of orderColumnCandidates) {
    const result = await supabase
      .from(table)
      .select("*")
      .order(column, { ascending: false })
      .limit(50);

    if (!result.error) return result.data || [];
    lastError = result.error;
  }

  const fallback = await supabase.from(table).select("*").limit(50);

  if (fallback.error) {
    throw new Error(
      `Failed to read ${table}: ${fallback.error.message || lastError?.message}`,
    );
  }

  return fallback.data || [];
}

async function findExistingPreparationArtifact(supabase) {
  const { data, error } = await supabase
    .from("discovery_candidate_preview_artifacts")
    .select("*")
    .eq("source_evidence_locator", SOURCE_EVIDENCE_LOCATOR)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(
      `Failed to check existing preparation artifact: ${error.message}`,
    );
  }

  if ((data || []).length > 1) {
    throw new Error(
      `Abort: found ${(data || []).length} existing preparation artifacts for marker ${SOURCE_EVIDENCE_LOCATOR}.`,
    );
  }

  return (data || [])[0] || null;
}

async function findSafeSource(supabase) {
  const rows = await selectRows(supabase, "discovery_sources");

  for (const row of rows) {
    const sourceUrl = getSourceUrl(row);
    if (sourceUrl) return { row, sourceUrl };
  }

  return null;
}

async function createFallbackSource(supabase) {
  if (process.env[FALLBACK_ENV] !== "1") {
    throw new Error(
      `No reusable safe discovery source found. Set ${FALLBACK_ENV}=1 only if fallback source/run creation is approved.`,
    );
  }

  const attempts = [
    {
      name: "source_url/source_type/status",
      payload: {
        source_url: FALLBACK_SOURCE_URL,
        source_type: "manual_curated_urls",
        status: "active",
        label: "Phase 14K-A Controlled Preview Source",
        metadata: { marker: MARKER },
      },
    },
    {
      name: "url/source_type/status",
      payload: {
        url: FALLBACK_SOURCE_URL,
        source_type: "manual_curated_urls",
        status: "active",
        name: "Phase 14K-A Controlled Preview Source",
        metadata: { marker: MARKER },
      },
    },
    {
      name: "source_value/source_type/status",
      payload: {
        source_value: FALLBACK_SOURCE_URL,
        source_type: "manual_curated_urls",
        status: "active",
        name: "Phase 14K-A Controlled Preview Source",
        metadata: { marker: MARKER },
      },
    },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("discovery_sources")
      .insert(attempt.payload)
      .select("*")
      .single();

    if (!error && data) {
      return { row: data, sourceUrl: FALLBACK_SOURCE_URL };
    }

    lastError = error;
  }

  throw new Error(
    `Failed to create fallback discovery source with bounded attempts: ${lastError?.message || "unknown error"}`,
  );
}

async function findSafeRunForSource(supabase, sourceId) {
  const rows = await selectRows(supabase, "discovery_runs");

  for (const row of rows) {
    if (getRunSourceId(row) === sourceId) {
      return row;
    }
  }

  return null;
}

async function createFallbackRun(supabase, sourceId) {
  if (process.env[FALLBACK_ENV] !== "1") {
    throw new Error(
      `No reusable discovery run found for source ${sourceId}. Set ${FALLBACK_ENV}=1 only if fallback source/run creation is approved.`,
    );
  }

  const attempts = [
    {
      name: "source_id/status/run_type/phase/stats",
      payload: {
        source_id: sourceId,
        status: "completed",
        run_type: "manual_preview_artifact_preparation",
        phase: MARKER,
        stats: {
          marker: MARKER,
          purpose: "controlled reviewable preview artifact preparation",
        },
      },
    },
    {
      name: "source_id/status/stats",
      payload: {
        source_id: sourceId,
        status: "completed",
        stats: {
          marker: MARKER,
          purpose: "controlled reviewable preview artifact preparation",
        },
      },
    },
    {
      name: "discovery_source_id/status/run_type/phase/stats",
      payload: {
        discovery_source_id: sourceId,
        status: "completed",
        run_type: "manual_preview_artifact_preparation",
        phase: MARKER,
        stats: {
          marker: MARKER,
          purpose: "controlled reviewable preview artifact preparation",
        },
      },
    },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("discovery_runs")
      .insert(attempt.payload)
      .select("*")
      .single();

    if (!error && data) return data;
    lastError = error;
  }

  throw new Error(
    `Failed to create fallback discovery run with bounded attempts: ${lastError?.message || "unknown error"}`,
  );
}

async function assertNoExistingReviewableArtifactForPair(supabase, sourceId, runId) {
  const { data, error } = await supabase
    .from("discovery_candidate_preview_artifacts")
    .select("id, source_evidence_locator")
    .eq("discovery_source_id", sourceId)
    .eq("discovery_run_id", runId)
    .eq("preview_status", PREVIEW_STATUS)
    .limit(5);

  if (error) {
    throw new Error(
      `Failed to check pair reviewable artifact uniqueness: ${error.message}`,
    );
  }

  const rows = data || [];
  const foreignRows = rows.filter(
    (row) => row.source_evidence_locator !== SOURCE_EVIDENCE_LOCATOR,
  );

  if (foreignRows.length > 0) {
    throw new Error(
      `Abort: selected source/run already has ${foreignRows.length} non-preparation reviewable artifact(s).`,
    );
  }
}

async function assertNoStagedCandidateForAudit(supabase, auditCorrelationId) {
  const { count, error } = await supabase
    .from("discovery_candidate_tools")
    .select("id", { count: "exact", head: true })
    .eq("audit_correlation_id", auditCorrelationId);

  if (error) {
    throw new Error(`Failed to check staged candidate uniqueness: ${error.message}`);
  }

  if ((count || 0) > 0) {
    throw new Error(
      `Abort: audit correlation ${auditCorrelationId} already has staged candidate rows.`,
    );
  }
}

async function createPreviewArtifact(supabase, sourceId, runId, sourceUrl) {
  const sourceUrlSnapshot = assertSafeHttps(sourceUrl, "source_url_snapshot");
  const candidateWebsiteUrl = assertSafeHttps(
    CANDIDATE_WEBSITE_URL,
    "candidate_website_url",
  );

  if (sourceUrlSnapshot === candidateWebsiteUrl) {
    throw new Error("source_url_snapshot and candidate_website_url must differ.");
  }

  await assertNoExistingReviewableArtifactForPair(supabase, sourceId, runId);

  const auditCorrelationId = crypto.randomUUID();

  await assertNoStagedCandidateForAudit(supabase, auditCorrelationId);

  const payload = {
    discovery_source_id: sourceId,
    discovery_run_id: runId,
    audit_correlation_id: auditCorrelationId,
    preview_schema_version: PREVIEW_SCHEMA_VERSION,
    preview_status: PREVIEW_STATUS,
    candidate_name: CANDIDATE_NAME,
    candidate_website_url: candidateWebsiteUrl,
    category_hint: "Productivity",
    pricing_hint: "Free",
    confidence_bucket: "medium",
    evidence_summary: EVIDENCE_SUMMARY,
    source_evidence_locator: SOURCE_EVIDENCE_LOCATOR,
    source_url_snapshot: sourceUrlSnapshot,
    safety_flags: SAFETY_FLAGS,
    preview_generated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("discovery_candidate_preview_artifacts")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create reviewable preview artifact: ${error.message}`);
  }

  return data;
}

function validateArtifactShape(artifact, expectedSourceId, expectedRunId) {
  requireCleanEnoughRow(artifact, "preview artifact");

  if (artifact.discovery_source_id !== expectedSourceId) {
    throw new Error("Created artifact source id mismatch.");
  }

  if (artifact.discovery_run_id !== expectedRunId) {
    throw new Error("Created artifact run id mismatch.");
  }

  if (artifact.preview_schema_version !== PREVIEW_SCHEMA_VERSION) {
    throw new Error("Created artifact schema version mismatch.");
  }

  if (artifact.preview_status !== PREVIEW_STATUS) {
    throw new Error("Created artifact preview status mismatch.");
  }

  if (artifact.source_evidence_locator !== SOURCE_EVIDENCE_LOCATOR) {
    throw new Error("Created artifact marker mismatch.");
  }

  const sourceUrl = assertSafeHttps(
    artifact.source_url_snapshot,
    "artifact.source_url_snapshot",
  );
  const websiteUrl = assertSafeHttps(
    artifact.candidate_website_url,
    "artifact.candidate_website_url",
  );

  if (sourceUrl === websiteUrl) {
    throw new Error("Created artifact source and candidate URLs must differ.");
  }

  if (!Array.isArray(artifact.safety_flags)) {
    throw new Error("Created artifact safety_flags must be an array.");
  }

  if (!artifact.safety_flags.includes("source_url_snapshot_validated")) {
    throw new Error("Created artifact must include source_url_snapshot_validated.");
  }

  return { sourceUrl, websiteUrl };
}

async function countEligiblePreparationArtifacts(
  supabase,
  sourceId,
  runId,
  auditCorrelationId,
) {
  const { data, error } = await supabase
    .from("discovery_candidate_preview_artifacts")
    .select("*")
    .eq("discovery_source_id", sourceId)
    .eq("discovery_run_id", runId)
    .eq("audit_correlation_id", auditCorrelationId)
    .eq("preview_schema_version", PREVIEW_SCHEMA_VERSION)
    .eq("preview_status", PREVIEW_STATUS)
    .limit(5);

  if (error) {
    throw new Error(`Failed to verify eligible preparation artifacts: ${error.message}`);
  }

  const rows = data || [];

  return rows.filter((row) => {
    try {
      const sourceUrl = assertSafeHttps(
        row.source_url_snapshot,
        "verify.source_url_snapshot",
      );
      const websiteUrl = assertSafeHttps(
        row.candidate_website_url,
        "verify.candidate_website_url",
      );

      return (
        sourceUrl !== websiteUrl &&
        Array.isArray(row.safety_flags) &&
        row.safety_flags.includes("source_url_snapshot_validated")
      );
    } catch {
      return false;
    }
  }).length;
}

async function main() {
  const repo = process.cwd();

  if (!fs.existsSync(path.join(repo, "package.json")) || !fs.existsSync(path.join(repo, ".git"))) {
    throw new Error("Run this from the AiFinder repo root: /Users/jamescarlodumaua/aifinder");
  }

  loadEnvFile(path.join(repo, ".env.local"));
  assertOptIn();

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("=== Phase 14K-A Controlled Reviewable Preview Artifact Preparation ===");
  console.log(new Date().toISOString());
  console.log();
  console.log("Approval phrase accepted:");
  console.log(REQUIRED_APPROVAL);
  console.log();
  console.log("Boundary:");
  console.log("- Creates or reuses exactly one controlled reviewable preview artifact");
  console.log("- Does not POST to the live staging invocation route");
  console.log("- Does not fetch CSRF");
  console.log("- Does not send dry_run=false");
  console.log("- Does not stage candidates");
  console.log("- Does not write public.tools");
  console.log("- Does not write discovered_tools");
  console.log();

  let artifact = await findExistingPreparationArtifact(supabase);

  if (artifact) {
    console.log("Existing controlled preparation artifact found. Reusing it.");
  } else {
    let selectedSource = await findSafeSource(supabase);

    if (!selectedSource) {
      selectedSource = await createFallbackSource(supabase);
      console.log("Created fallback controlled discovery source.");
    } else {
      console.log("Selected existing safe discovery source.");
    }

    requireCleanEnoughRow(selectedSource.row, "selected discovery source");

    let selectedRun = await findSafeRunForSource(supabase, selectedSource.row.id);

    if (!selectedRun) {
      selectedRun = await createFallbackRun(supabase, selectedSource.row.id);
      console.log("Created fallback controlled discovery run.");
    } else {
      console.log("Selected existing discovery run for source.");
    }

    requireCleanEnoughRow(selectedRun, "selected discovery run");

    artifact = await createPreviewArtifact(
      supabase,
      selectedSource.row.id,
      selectedRun.id,
      selectedSource.sourceUrl,
    );

    console.log("Created controlled reviewable preview artifact.");
  }

  const urls = validateArtifactShape(
    artifact,
    artifact.discovery_source_id,
    artifact.discovery_run_id,
  );

  await assertNoStagedCandidateForAudit(supabase, artifact.audit_correlation_id);

  const eligibleCount = await countEligiblePreparationArtifacts(
    supabase,
    artifact.discovery_source_id,
    artifact.discovery_run_id,
    artifact.audit_correlation_id,
  );

  if (eligibleCount !== 1) {
    throw new Error(`Expected exactly one eligible preparation artifact, found ${eligibleCount}.`);
  }

  console.log();
  console.log("=== Prepared reviewable preview context ===");
  console.log(`preview_artifact_id=${artifact.id}`);
  console.log(`discovery_source_id=${artifact.discovery_source_id}`);
  console.log(`discovery_run_id=${artifact.discovery_run_id}`);
  console.log(`audit_correlation_id=${artifact.audit_correlation_id}`);
  console.log(`preview_schema_version=${artifact.preview_schema_version}`);
  console.log(`preview_status=${artifact.preview_status}`);
  console.log(`candidate_name=${artifact.candidate_name}`);
  console.log(`source_url_snapshot=${urls.sourceUrl}`);
  console.log(`candidate_website_url=${urls.websiteUrl}`);
  console.log(`source_evidence_locator=${artifact.source_evidence_locator}`);
  console.log(`safety_flags=${JSON.stringify(artifact.safety_flags)}`);
  console.log();

  console.log("=== Post-preparation verification ===");
  console.log("eligible_preparation_artifacts=1");
  console.log("staged_candidate_rows_for_audit_correlation=0");
  console.log("no_public_tools_write_attempted=true");
  console.log("no_discovered_tools_write_attempted=true");
  console.log("no_candidate_staging_write_attempted=true");
  console.log();

  console.log("Do NOT run live staging yet.");
  console.log("Exact live smoke phrase still required:");
  console.log("Approve run Phase 14J controlled live staging smoke");
}

main().catch((error) => {
  console.error("ERROR:", error.message || error);
  process.exit(1);
});
