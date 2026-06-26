#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";

const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_LIVE_SMOKE";
const REQUIRED_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const PHASE = "Phase 8Z";
const MARKER_PREFIX = "phase-8z-live-smoke";
const SELECTED_CANDIDATE_COLUMNS =
  "id,candidate_status,discovery_run_id,audit_correlation_id,source_evidence_locator,created_at,updated_at";

// Anon/authenticated RLS denial checks are intentionally not performed here.
// They should remain a separate Gemini-approved smoke or security phase if
// implemented later.

const created = {
  auditCorrelationId: null,
  candidateId: null,
  discoveryRunId: null,
  discoverySourceId: null,
  marker: null,
};

function logStep(message) {
  console.log(`[${PHASE}] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function safeErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected live smoke failure.";
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    fail(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertRequiredEnvPresent() {
  for (const envName of REQUIRED_ENV_NAMES) {
    getRequiredEnv(envName);
  }
}

function buildSmokeIds() {
  const token = randomUUID().slice(0, 8);

  return {
    token,
    marker: `${MARKER_PREFIX}:${token}`,
    slug: `${MARKER_PREFIX}-${token}`,
    auditCorrelationId: randomUUID(),
  };
}

async function createDiscoverySourceFixture(client, smoke) {
  logStep("Creating dedicated discovery source fixture.");

  const { data, error } = await client
    .from("discovery_sources")
    .insert({
      name: `Phase 8Z Live Smoke Source ${smoke.token}`,
      slug: smoke.slug,
      description: "Phase 8Z candidate staging live smoke source fixture.",
      url: `https://${smoke.slug}.example.com/`,
      source_type: "manual",
      config: {
        smoke: true,
        phase: "8Z",
        marker: smoke.marker,
        purpose: "candidate_staging_live_smoke",
      },
      is_active: false,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    fail("Failed to create discovery source fixture.");
  }

  created.discoverySourceId = data.id;
  logStep(`Created discovery source fixture: ${data.id}`);

  return data.id;
}

async function createDiscoveryRunFixture(client, sourceId) {
  logStep("Creating dedicated discovery run fixture.");

  const { data, error } = await client
    .from("discovery_runs")
    .insert({
      source_id: sourceId,
      status: "completed",
      error_log: null,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    fail("Failed to create discovery run fixture.");
  }

  created.discoveryRunId = data.id;
  logStep(`Created discovery run fixture: ${data.id}`);

  return data.id;
}

function buildNormalizedCandidateInput({ smoke, discoveryRunId }) {
  const smokeUrl = `https://${smoke.slug}.example.com/`;

  return {
    discovery_run_id: discoveryRunId,
    source_url: smokeUrl,
    source_evidence_locator: smoke.marker,
    extraction_version: "phase_8z_live_smoke_v1",
    candidate_name: `Phase 8Z Live Smoke Candidate ${smoke.token}`,
    candidate_website_url: smokeUrl,
    candidate_description: "Controlled staging smoke fixture.",
    candidate_category_hint: "Productivity",
    candidate_pricing_hint: "Free",
    evidence_summary: "Controlled live smoke fixture for staging only.",
    confidence_bucket: "low",
    audit_correlation_id: smoke.auditCorrelationId,
  };
}

async function stageCandidateFixture({
  normalizeDiscoveryCandidate,
  stageNormalizedDiscoveryCandidate,
  smoke,
  discoveryRunId,
  discoverySourceId,
}) {
  logStep("Normalizing controlled candidate fixture.");

  const normalized = normalizeDiscoveryCandidate(
    buildNormalizedCandidateInput({ smoke, discoveryRunId }),
  );

  if (!normalized.ok) {
    fail("Controlled candidate fixture failed normalization.");
  }

  logStep("Calling stageNormalizedDiscoveryCandidate exactly once.");

  const result = await stageNormalizedDiscoveryCandidate({
    discoveryRunId,
    discoverySourceId,
    normalizedCandidate: normalized.candidate,
  });

  if (!result.ok) {
    fail(`Candidate staging failed with safe code: ${result.error.code}`);
  }

  assert(result.candidateId, "Candidate ID was not returned.");
  assert(
    result.candidateStatus === "staged",
    "Candidate status was not returned as staged.",
  );
  assert(
    result.discoveryRunId === discoveryRunId,
    "Returned discoveryRunId did not match fixture run ID.",
  );
  assert(
    result.discoverySourceId === discoverySourceId,
    "Returned discoverySourceId did not match fixture source ID.",
  );
  assert(
    result.auditCorrelationId === smoke.auditCorrelationId,
    "Returned auditCorrelationId did not match fixture UUID.",
  );

  created.candidateId = result.candidateId;
  logStep(`Created staged candidate fixture: ${result.candidateId}`);

  return result;
}

async function verifyCandidateReadback(client, { smoke, candidateId, discoveryRunId }) {
  logStep("Reading back minimal safe candidate fields.");

  const { data, error } = await client
    .from("discovery_candidate_tools")
    .select(SELECTED_CANDIDATE_COLUMNS)
    .eq("id", candidateId)
    .single();

  if (error || !data) {
    fail("Failed to read back staged candidate fixture.");
  }

  assert(data.id === candidateId, "Readback candidate ID mismatch.");
  assert(data.candidate_status === "staged", "Readback status was not staged.");
  assert(
    data.discovery_run_id === discoveryRunId,
    "Readback discovery_run_id mismatch.",
  );
  assert(
    data.audit_correlation_id === smoke.auditCorrelationId,
    "Readback audit_correlation_id mismatch.",
  );
  assert(
    data.source_evidence_locator === smoke.marker,
    "Readback source_evidence_locator marker mismatch.",
  );
  assert(Boolean(data.created_at), "Readback created_at was missing.");
  assert(Boolean(data.updated_at), "Readback updated_at was missing.");

  logStep("Minimal readback verification passed.");
}

async function deleteByExactId(client, tableName, id, label) {
  if (!id) return;

  logStep(`Cleaning up ${label}: ${id}`);

  const { error } = await client.from(tableName).delete().eq("id", id);

  if (error) {
    fail(`Failed to clean up ${label}.`);
  }
}

async function verifyExactIdRemoved(client, tableName, id, label) {
  if (!id) return;

  const { data, error } = await client
    .from(tableName)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    fail(`Failed to verify cleanup for ${label}.`);
  }

  if (data) {
    fail(`Cleanup verification failed for ${label}.`);
  }

  logStep(`Cleanup verified for ${label}: ${id}`);
}

async function cleanup(client) {
  if (!client) return;

  logStep("Running exact-ID cleanup.");

  await deleteByExactId(
    client,
    "discovery_candidate_tools",
    created.candidateId,
    "staged candidate fixture",
  );
  await deleteByExactId(
    client,
    "discovery_runs",
    created.discoveryRunId,
    "discovery run fixture",
  );
  await deleteByExactId(
    client,
    "discovery_sources",
    created.discoverySourceId,
    "discovery source fixture",
  );

  await verifyExactIdRemoved(
    client,
    "discovery_candidate_tools",
    created.candidateId,
    "staged candidate fixture",
  );
  await verifyExactIdRemoved(
    client,
    "discovery_runs",
    created.discoveryRunId,
    "discovery run fixture",
  );
  await verifyExactIdRemoved(
    client,
    "discovery_sources",
    created.discoverySourceId,
    "discovery source fixture",
  );

  logStep("Exact-ID cleanup completed.");
}

async function main() {
  logStep("Opt-in guard satisfied. Loading local environment without printing values.");

  const { loadEnvConfig } = nextEnv;
  loadEnvConfig(process.cwd());
  assertRequiredEnvPresent();

  const [
    { createDiscoverySupabaseAdminClient },
    { normalizeDiscoveryCandidate },
    { stageNormalizedDiscoveryCandidate },
  ] = await Promise.all([
    import("../lib/discovery/discovery-supabase-admin.ts"),
    import("../lib/discovery-candidate-normalizer.ts"),
    import("../lib/discovery/discovery-candidate-staging-admin.ts"),
  ]);

  const client = createDiscoverySupabaseAdminClient();
  const smoke = buildSmokeIds();

  created.auditCorrelationId = smoke.auditCorrelationId;
  created.marker = smoke.marker;

  logStep(`Using smoke marker: ${smoke.marker}`);

  try {
    const discoverySourceId = await createDiscoverySourceFixture(client, smoke);
    const discoveryRunId = await createDiscoveryRunFixture(
      client,
      discoverySourceId,
    );
    const stagedCandidate = await stageCandidateFixture({
      normalizeDiscoveryCandidate,
      stageNormalizedDiscoveryCandidate,
      smoke,
      discoveryRunId,
      discoverySourceId,
    });

    await verifyCandidateReadback(client, {
      smoke,
      candidateId: stagedCandidate.candidateId,
      discoveryRunId,
    });

    logStep("Live candidate staging smoke passed.");
  } finally {
    await cleanup(client);
  }
}

if (process.env[OPT_IN_ENV] !== "1") {
  logStep(
    `Opt-in guard not set. Set ${OPT_IN_ENV}=1 to run this live DB smoke test.`,
  );
  logStep("No environment values loaded, no DB client created, no DB operation performed.");
} else {
  try {
    await main();
  } catch (error) {
    console.error(`[${PHASE}] ${safeErrorMessage(error)}`);

    if (
      created.candidateId ||
      created.discoveryRunId ||
      created.discoverySourceId
    ) {
      console.error(
        `[${PHASE}] Manual cleanup may be required for IDs: candidate=${created.candidateId ?? "none"}, run=${created.discoveryRunId ?? "none"}, source=${created.discoverySourceId ?? "none"}, auditCorrelationId=${created.auditCorrelationId ?? "none"}, marker=${created.marker ?? "none"}`,
      );
    }

    process.exitCode = 1;
  }
}
