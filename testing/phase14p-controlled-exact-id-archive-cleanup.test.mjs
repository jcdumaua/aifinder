import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const SCRIPT_PATH = "testing/phase14p-controlled-exact-id-archive-cleanup.mjs";
const source = fs.readFileSync(SCRIPT_PATH, "utf8");

test("requires exact cleanup approval phrase and opt-in env", () => {
  assert.match(
    source,
    /Approve run Phase 14L controlled staged smoke candidate cleanup/,
  );
  assert.match(
    source,
    /AIFINDER_RUN_PHASE_14P_EXACT_ID_ARCHIVE_CLEANUP/,
  );
  assert.match(
    source,
    /AIFINDER_PHASE_14P_CLEANUP_APPROVAL/,
  );
});

test("pins cleanup to the exact smoke candidate identifiers", () => {
  assert.match(source, /eafa4925-4cd9-4361-a8d0-37c8c6bdf65f/);
  assert.match(source, /b5f334b2-b22a-4144-8655-6da1e34e3961/);
  assert.match(source, /bc98e7db-ccdf-46dd-900f-dd538ade41bd/);
  assert.match(source, /5f9440bc-9a5d-4faa-9feb-3cabcc97761b/);
  assert.match(source, /Phase 14K Controlled Preview Artifact Smoke Tool/);
  assert.match(source, /https:\/\/example\.com\/phase-14k-controlled-preview-tool/);
  assert.match(source, /https:\/\/example\.com\//);
});

test("uses archive status transition and does not hard delete", () => {
  assert.match(source, /fromCandidateStatus: "staged"/);
  assert.match(source, /toCandidateStatus: "archived"/);
  assert.match(source, /\.update\(\{\s*candidate_status: EXPECTED\.toCandidateStatus\s*\}\)/);
  assert.doesNotMatch(source, /\.delete\(/);
  assert.doesNotMatch(source, /\.upsert\(/);
  assert.doesNotMatch(source, /\.insert\(/);
});

test("uses defensive exact where clauses for the archive mutation", () => {
  assert.match(source, /\.eq\("id", EXPECTED\.candidateId\)/);
  assert.match(source, /\.eq\("audit_correlation_id", EXPECTED\.auditCorrelationId\)/);
  assert.match(source, /\.eq\("candidate_status", EXPECTED\.fromCandidateStatus\)/);
  assert.match(source, /\.eq\("candidate_website_url", EXPECTED\.candidateWebsiteUrl\)/);
});

test("verifies public tools and discovered tools absence before and after cleanup", () => {
  assert.match(source, /selectPublicToolsByWebsite/);
  assert.match(source, /selectDiscoveredToolsByWebsite/);
  assert.match(source, /public tools rows before cleanup/);
  assert.match(source, /discovered_tools rows before cleanup/);
  assert.match(source, /public tools rows after cleanup/);
  assert.match(source, /discovered_tools rows after cleanup/);
});

test("does not write to public tools or discovered_tools", () => {
  const toolsWritePattern =
    /\.from\(["']tools["']\)[\s\S]{0,240}\.(insert|upsert|update|delete)\(/;
  const discoveredToolsWritePattern =
    /\.from\(["']discovered_tools["']\)[\s\S]{0,240}\.(insert|upsert|update|delete)\(/;

  assert.doesNotMatch(source, toolsWritePattern);
  assert.doesNotMatch(source, discoveredToolsWritePattern);
});

test("prints required success markers", () => {
  assert.match(source, /Phase 14P controlled exact-ID archive cleanup PASSED/);
  assert.match(source, /candidate_status_before=staged/);
  assert.match(source, /candidate_status_after=archived/);
  assert.match(source, /updated_rows=1/);
  assert.match(source, /no_public_write_confirmed=true/);
  assert.match(source, /no_discovered_write_confirmed=true/);
  assert.match(source, /no_publish_action_confirmed=true/);
});
