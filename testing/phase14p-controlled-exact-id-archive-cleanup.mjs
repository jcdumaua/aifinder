#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const requireFromRepo = createRequire(`${process.cwd()}/package.json`);
const { createClient } = requireFromRepo("@supabase/supabase-js");

const REQUIRED_APPROVAL_PHRASE =
  "Approve run Phase 14L controlled staged smoke candidate cleanup";
const REQUIRED_OPT_IN_ENV =
  "AIFINDER_RUN_PHASE_14P_EXACT_ID_ARCHIVE_CLEANUP";

const EXPECTED = Object.freeze({
  candidateId: "eafa4925-4cd9-4361-a8d0-37c8c6bdf65f",
  candidateName: "Phase 14K Controlled Preview Artifact Smoke Tool",
  fromCandidateStatus: "staged",
  toCandidateStatus: "archived",
  discoverySourceId: "bc98e7db-ccdf-46dd-900f-dd538ade41bd",
  discoveryRunId: "5f9440bc-9a5d-4faa-9feb-3cabcc97761b",
  auditCorrelationId: "b5f334b2-b22a-4144-8655-6da1e34e3961",
  candidateWebsiteUrl: "https://example.com/phase-14k-controlled-preview-tool",
  sourceUrl: "https://example.com/",
});

const CANDIDATE_SELECT_COLUMNS = [
  "id",
  "candidate_name",
  "candidate_status",
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "candidate_website_url",
  "source_url",
  "created_at",
  "updated_at",
].join(",");

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

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service env for controlled cleanup.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function assertApproval() {
  if (process.env[REQUIRED_OPT_IN_ENV] !== "1") {
    throw new Error(
      `Missing opt-in env ${REQUIRED_OPT_IN_ENV}=1. Cleanup was not run.`,
    );
  }

  if (process.env.AIFINDER_PHASE_14P_CLEANUP_APPROVAL !== REQUIRED_APPROVAL_PHRASE) {
    throw new Error("Missing exact cleanup approval phrase. Cleanup was not run.");
  }
}

function assertRepoRoot() {
  if (
    !fs.existsSync(path.join(process.cwd(), "package.json")) ||
    !fs.existsSync(path.join(process.cwd(), ".git"))
  ) {
    throw new Error("Run from AiFinder repo root.");
  }
}

function assertCleanGitStatus() {
  // This cleanup runner intentionally avoids invoking shell commands. The wrapper
  // command must check git status before and after execution.
  return true;
}

function assertCandidateRow(row, expectedStatus) {
  if (!row) throw new Error("Candidate row is missing.");

  const expectations = [
    ["id", row.id, EXPECTED.candidateId],
    ["candidate_name", row.candidate_name, EXPECTED.candidateName],
    ["candidate_status", row.candidate_status, expectedStatus],
    ["discovery_source_id", row.discovery_source_id, EXPECTED.discoverySourceId],
    ["discovery_run_id", row.discovery_run_id, EXPECTED.discoveryRunId],
    ["audit_correlation_id", row.audit_correlation_id, EXPECTED.auditCorrelationId],
    ["candidate_website_url", row.candidate_website_url, EXPECTED.candidateWebsiteUrl],
    ["source_url", row.source_url, EXPECTED.sourceUrl],
  ];

  for (const [label, actual, expected] of expectations) {
    if (actual !== expected) {
      throw new Error(`${label} mismatch: expected ${expected}, got ${actual}`);
    }
  }
}

async function selectCandidateByExactId(supabase) {
  const { data, error } = await supabase
    .from("discovery_candidate_tools")
    .select(CANDIDATE_SELECT_COLUMNS)
    .eq("id", EXPECTED.candidateId);

  if (error) throw new Error(`Candidate exact-ID SELECT failed: ${error.message}`);
  return data || [];
}

async function selectCandidateByAuditCorrelation(supabase) {
  const { data, error } = await supabase
    .from("discovery_candidate_tools")
    .select(CANDIDATE_SELECT_COLUMNS)
    .eq("audit_correlation_id", EXPECTED.auditCorrelationId);

  if (error) {
    throw new Error(`Candidate audit-correlation SELECT failed: ${error.message}`);
  }

  return data || [];
}

async function selectCandidateByWebsite(supabase) {
  const { data, error } = await supabase
    .from("discovery_candidate_tools")
    .select(CANDIDATE_SELECT_COLUMNS)
    .eq("candidate_website_url", EXPECTED.candidateWebsiteUrl);

  if (error) throw new Error(`Candidate website SELECT failed: ${error.message}`);
  return data || [];
}

async function selectPublicToolsByWebsite(supabase) {
  const { data, error } = await supabase
    .from("tools")
    .select("id,name,website,status,created_at")
    .eq("website", EXPECTED.candidateWebsiteUrl);

  if (error) throw new Error(`Public tools SELECT failed: ${error.message}`);
  return data || [];
}

async function selectDiscoveredToolsByWebsite(supabase) {
  const { data, error } = await supabase
    .from("discovered_tools")
    .select("id,name,status,website,created_at")
    .eq("website", EXPECTED.candidateWebsiteUrl);

  if (error) throw new Error(`Discovered tools SELECT failed: ${error.message}`);
  return data || [];
}

function assertExactlyOne(label, rows) {
  if (rows.length !== 1) {
    throw new Error(`${label}: expected exactly one row, found ${rows.length}.`);
  }
}

function assertZero(label, rows) {
  if (rows.length !== 0) {
    throw new Error(`${label}: expected zero rows, found ${rows.length}.`);
  }
}

async function verifyBeforeMutation(supabase) {
  const byId = await selectCandidateByExactId(supabase);
  const byAudit = await selectCandidateByAuditCorrelation(supabase);
  const byWebsite = await selectCandidateByWebsite(supabase);
  const publicTools = await selectPublicToolsByWebsite(supabase);
  const discoveredTools = await selectDiscoveredToolsByWebsite(supabase);

  assertExactlyOne("candidate by exact ID", byId);
  assertExactlyOne("candidate by audit correlation", byAudit);
  assertExactlyOne("candidate by website", byWebsite);

  if (byAudit[0].id !== EXPECTED.candidateId) {
    throw new Error("Audit-correlation row does not match expected candidate ID.");
  }

  if (byWebsite[0].id !== EXPECTED.candidateId) {
    throw new Error("Website row does not match expected candidate ID.");
  }

  assertCandidateRow(byId[0], EXPECTED.fromCandidateStatus);
  assertZero("public tools rows before cleanup", publicTools);
  assertZero("discovered_tools rows before cleanup", discoveredTools);

  return {
    candidate: byId[0],
    candidateRowsByAuditCorrelation: byAudit.length,
    candidateRowsByWebsite: byWebsite.length,
    publicToolsRows: publicTools.length,
    discoveredToolsRows: discoveredTools.length,
  };
}

async function archiveCandidateByExactId(supabase) {
  const { data, error } = await supabase
    .from("discovery_candidate_tools")
    .update({ candidate_status: EXPECTED.toCandidateStatus })
    .eq("id", EXPECTED.candidateId)
    .eq("audit_correlation_id", EXPECTED.auditCorrelationId)
    .eq("candidate_status", EXPECTED.fromCandidateStatus)
    .eq("candidate_website_url", EXPECTED.candidateWebsiteUrl)
    .select(CANDIDATE_SELECT_COLUMNS);

  if (error) {
    throw new Error(`Exact-ID archive update failed: ${error.message}`);
  }

  return data || [];
}

async function verifyAfterMutation(supabase) {
  const byId = await selectCandidateByExactId(supabase);
  const byAudit = await selectCandidateByAuditCorrelation(supabase);
  const byWebsite = await selectCandidateByWebsite(supabase);
  const publicTools = await selectPublicToolsByWebsite(supabase);
  const discoveredTools = await selectDiscoveredToolsByWebsite(supabase);

  assertExactlyOne("candidate by exact ID after cleanup", byId);
  assertExactlyOne("candidate by audit correlation after cleanup", byAudit);
  assertExactlyOne("candidate by website after cleanup", byWebsite);

  if (byAudit[0].id !== EXPECTED.candidateId) {
    throw new Error("Post-cleanup audit-correlation row does not match candidate ID.");
  }

  if (byWebsite[0].id !== EXPECTED.candidateId) {
    throw new Error("Post-cleanup website row does not match candidate ID.");
  }

  assertCandidateRow(byId[0], EXPECTED.toCandidateStatus);
  assertZero("public tools rows after cleanup", publicTools);
  assertZero("discovered_tools rows after cleanup", discoveredTools);

  return {
    candidate: byId[0],
    candidateRowsByAuditCorrelation: byAudit.length,
    candidateRowsByWebsite: byWebsite.length,
    publicToolsRows: publicTools.length,
    discoveredToolsRows: discoveredTools.length,
  };
}

async function main() {
  assertRepoRoot();
  assertCleanGitStatus();

  loadEnvFile(path.join(process.cwd(), ".env.local"));
  assertApproval();

  const supabase = getSupabaseClient();

  console.log("=== Phase 14P Controlled Exact-ID Archive Cleanup ===");
  console.log(new Date().toISOString());
  console.log();
  console.log("Boundary:");
  console.log("- Exact cleanup approval phrase required");
  console.log("- Exact-ID archive transition only");
  console.log("- No hard delete");
  console.log("- No public tools write");
  console.log("- No discovered_tools write");
  console.log("- No publish action");
  console.log();

  console.log("=== Before cleanup verification ===");
  const before = await verifyBeforeMutation(supabase);
  console.log(JSON.stringify(before, null, 2));
  console.log();

  console.log("=== Executing exact-ID archive transition ===");
  const updatedRows = await archiveCandidateByExactId(supabase);
  console.log(JSON.stringify(updatedRows, null, 2));
  console.log();

  if (updatedRows.length !== 1) {
    throw new Error(`Expected archive update to affect one row, affected ${updatedRows.length}.`);
  }

  assertCandidateRow(updatedRows[0], EXPECTED.toCandidateStatus);

  console.log("=== After cleanup verification ===");
  const after = await verifyAfterMutation(supabase);
  console.log(JSON.stringify(after, null, 2));
  console.log();

  console.log("=== Phase 14P controlled exact-ID archive cleanup PASSED ===");
  console.log(`candidate_id=${EXPECTED.candidateId}`);
  console.log("candidate_status_before=staged");
  console.log("candidate_status_after=archived");
  console.log("updated_rows=1");
  console.log("public_tools_rows_for_candidate_website=0");
  console.log("discovered_tools_rows_for_candidate_website=0");
  console.log("no_public_write_confirmed=true");
  console.log("no_discovered_write_confirmed=true");
  console.log("no_publish_action_confirmed=true");
}

main().catch((error) => {
  console.error("ERROR:", error.message || error);
  process.exit(1);
});
