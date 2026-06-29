import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const SCRIPT_PATH =
  "testing/phase14k-a-controlled-preview-artifact-preparation.mjs";

const source = fs.readFileSync(SCRIPT_PATH, "utf8");

test("controlled preparation script requires exact opt-in and approval", () => {
  assert.equal(
    source.includes(
      "AIFINDER_RUN_PHASE_14K_A_CONTROLLED_PREVIEW_ARTIFACT_PREPARATION",
    ),
    true,
  );
  assert.equal(source.includes("AIFINDER_PHASE_14K_A_APPROVAL"), true);
  assert.equal(
    source.includes(
      "Approve run Phase 14K-A controlled preview artifact preparation",
    ),
    true,
  );
});

test("controlled preparation script uses reviewable v2 preview artifact contract", () => {
  assert.equal(
    source.includes('const PREVIEW_SCHEMA_VERSION = "candidate_preview_artifact.v2";'),
    true,
  );
  assert.equal(source.includes('const PREVIEW_STATUS = "reviewable";'), true);
  assert.equal(source.includes('"source_url_snapshot_validated"'), true);
  assert.equal(source.includes("source_url_snapshot"), true);
  assert.equal(source.includes("candidate_website_url"), true);
});

test("controlled preparation script keeps live staging and publishing out of scope", () => {
  assert.equal(
    source.includes("/api/admin/discovery/candidate-extraction/invoke"),
    true,
  );
  assert.equal(
    source.includes("Does not POST to the live staging invocation route"),
    true,
  );
  assert.equal(source.includes("Does not fetch CSRF"), true);
  assert.equal(source.includes("Does not send dry_run=false"), true);
  assert.equal(source.includes("Does not stage candidates"), true);

  assert.equal(source.includes(".from(\"tools\")"), false);
  assert.equal(source.includes(".from('tools')"), false);
  assert.equal(source.includes(".from(\"discovered_tools\")"), false);
  assert.equal(source.includes(".from('discovered_tools')"), false);
});

test("controlled preparation script writes only source run and preview artifact scopes", () => {
  assert.equal(source.includes(".from(\"discovery_candidate_preview_artifacts\")"), true);
  assert.equal(source.includes(".from(\"discovery_sources\")"), true);
  assert.equal(source.includes(".from(\"discovery_runs\")"), true);

  const candidateToolsInsertPattern =
    /\.from\(["']discovery_candidate_tools["']\)[\s\S]{0,200}\.(insert|upsert|update|delete)\(/;
  assert.equal(candidateToolsInsertPattern.test(source), false);
});

test("controlled preparation script prints context needed for later live smoke", () => {
  assert.equal(source.includes("preview_artifact_id="), true);
  assert.equal(source.includes("discovery_source_id="), true);
  assert.equal(source.includes("discovery_run_id="), true);
  assert.equal(source.includes("audit_correlation_id="), true);
  assert.equal(
    source.includes("Approve run Phase 14J controlled live staging smoke"),
    true,
  );
});
