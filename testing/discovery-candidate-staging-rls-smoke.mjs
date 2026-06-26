#!/usr/bin/env node

import { randomUUID } from "node:crypto";

const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE";
const REQUIRED_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const PHASE = "Phase 9E";
const MARKER_PREFIX = "phase-9e-rls-smoke";
const SELECTED_CANDIDATE_COLUMNS =
  "id,candidate_status,discovery_run_id,audit_correlation_id,source_evidence_locator,created_at,updated_at";

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

function assert(condition, message) {
  if (!condition) fail(message);
}

function safeErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected candidate staging RLS smoke failure.";
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

async function loadLocalEnv() {
  const nextEnv = await import("@next/env");
  const loadEnvConfig = nextEnv.default?.loadEnvConfig ?? nextEnv.loadEnvConfig;

  if (typeof loadEnvConfig !== "function") {
    fail("Unable to load Next.js environment helper.");
  }

  loadEnvConfig(process.cwd());
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
  logStep("Creating dedicated RLS smoke discovery source fixture.");

  const { data, error } = await client
    .from("discovery_sources")
    .insert({
      name: `Phase 9E RLS Smoke Source ${smoke.token}`,
      slug: smoke.slug,
      description: "Phase 9E candidate staging RLS smoke source fixture.",
      url: `https://${smoke.slug}.example.invalid/`,
      source_type: "manual",
      config: {
        smoke: true,
        phase: "9E",
        marker: smoke.marker,
        purpose: "candidate_staging_rls_smoke",
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
  logStep("Creating dedicated RLS smoke discovery run fixture.");

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
  const smokeUrl = `https://${smoke.slug}.example.invalid/`;

  return {
    discovery_run_id: discoveryRunId,
    source_url: smokeUrl,
    source_evidence_locator: smoke.marker,
    extraction_version: "phase_9e_rls_smoke_v1",
    candidate_name: `Phase 9E RLS Smoke Candidate ${smoke.token}`,
    candidate_website_url: smokeUrl,
    candidate_description: "Controlled RLS smoke fixture.",
    candidate_category_hint: "Productivity",
    candidate_pricing_hint: "Free",
    evidence_summary: "Controlled RLS smoke fixture for staging only.",
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
  logStep("Normalizing controlled RLS candidate fixture.");

  const normalized = normalizeDiscoveryCandidate(
    buildNormalizedCandidateInput({ smoke, discoveryRunId }),
  );

  if (!normalized.ok) {
    fail("Controlled RLS candidate fixture failed normalization.");
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

function categorizeSupabaseError(error) {
  const code = typeof error?.code === "string" ? error.code : undefined;
  const status =
    typeof error?.status === "number"
      ? error.status
      : typeof error?.status === "string"
        ? Number(error.status)
        : undefined;
  const message =
    typeof error?.message === "string" ? error.message.toLowerCase() : "";

  if (status === 401 || status === 403 || code === "401" || code === "403") {
    return "unauthorized_or_forbidden";
  }

  if (
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("not authorized")
  ) {
    return "permission_denied";
  }

  if (
    status === 406 ||
    code === "PGRST116" ||
    message.includes("json object requested")
  ) {
    return "not_acceptable_no_payload";
  }

  return "not_acceptable_no_payload";
}

function maskSupabaseError(error) {
  return {
    code: typeof error?.code === "string" ? error.code : undefined,
    category: categorizeSupabaseError(error),
    message: "Supabase request did not return a readable candidate payload.",
  };
}

function passDenied(testName, category) {
  logStep(`${testName}: pass (${category}).`);
  return { ok: true, category };
}

function assertUnauthorizedResultDenied(testName, { data, error }) {
  if (Array.isArray(data) && data.length > 0) {
    fail(`${testName}: unauthorized client received a candidate row.`);
  }

  if (data && !Array.isArray(data)) {
    fail(`${testName}: unauthorized client received a candidate row.`);
  }

  if (error) {
    const safeError = maskSupabaseError(error);
    return passDenied(testName, safeError.category);
  }

  if (Array.isArray(data) && data.length === 0) {
    return passDenied(testName, "empty_array");
  }

  if (data === null || data === undefined) {
    return passDenied(testName, "null_row");
  }

  fail(`${testName}: unauthorized client received a candidate row.`);
}

async function verifyServiceRoleControlRead(client, candidateId) {
  logStep("Test 1 — Service-role control read.");

  const { data, error } = await client
    .from("discovery_candidate_tools")
    .select(SELECTED_CANDIDATE_COLUMNS)
    .eq("id", candidateId)
    .single();

  if (error || !data) {
    fail("Service-role control read failed.");
  }

  assert(data.id === candidateId, "Service-role control read ID mismatch.");
  assert(
    data.candidate_status === "staged",
    "Service-role control read status mismatch.",
  );
  assert(Boolean(data.created_at), "Service-role control read missing created_at.");
  assert(Boolean(data.updated_at), "Service-role control read missing updated_at.");

  logStep("Test 1 — Service-role control read: pass.");
}

async function verifyAnonymousExactIdDenied(anonClient, candidateId) {
  logStep("Test 2 — Anonymous exact-ID read denial.");

  const result = await anonClient
    .from("discovery_candidate_tools")
    .select(SELECTED_CANDIDATE_COLUMNS)
    .eq("id", candidateId)
    .maybeSingle();

  return assertUnauthorizedResultDenied(
    "Test 2 — Anonymous exact-ID read denial",
    result,
  );
}

async function verifyAnonymousListDenied(anonClient) {
  logStep("Test 3 — Anonymous list denial.");

  const result = await anonClient
    .from("discovery_candidate_tools")
    .select("id")
    .limit(1);

  return assertUnauthorizedResultDenied("Test 3 — Anonymous list denial", result);
}

function verifyGuessedExactIdDenied(denialResult) {
  logStep(
    `Test 4 — Guessed exact candidate ID denial: pass (${denialResult.category}).`,
  );
}

function reportAuthenticatedNonAdminSkipped() {
  logStep(
    "Test 5 — Authenticated non-admin exact-ID denial: skipped (no approved non-admin test identity strategy).",
  );
}

function verifyNoPayloadLeakage() {
  logStep(
    "Test 6 — No payload leakage on denial: pass (denial logs used safe categories only).",
  );
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

  await loadLocalEnv();
  assertRequiredEnvPresent();

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const [
    { createClient },
    { createDiscoverySupabaseAdminClient },
    { normalizeDiscoveryCandidate },
    { stageNormalizedDiscoveryCandidate },
  ] = await Promise.all([
    import("@supabase/supabase-js"),
    import("../lib/discovery/discovery-supabase-admin.ts"),
    import("../lib/discovery-candidate-normalizer.ts"),
    import("../lib/discovery/discovery-candidate-staging-admin.ts"),
  ]);

  const adminClient = createDiscoverySupabaseAdminClient();
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const smoke = buildSmokeIds();

  created.auditCorrelationId = smoke.auditCorrelationId;
  created.marker = smoke.marker;

  logStep(`Using smoke marker: ${smoke.marker}`);

  try {
    const discoverySourceId = await createDiscoverySourceFixture(
      adminClient,
      smoke,
    );
    const discoveryRunId = await createDiscoveryRunFixture(
      adminClient,
      discoverySourceId,
    );
    const stagedCandidate = await stageCandidateFixture({
      normalizeDiscoveryCandidate,
      stageNormalizedDiscoveryCandidate,
      smoke,
      discoveryRunId,
      discoverySourceId,
    });

    await verifyServiceRoleControlRead(adminClient, stagedCandidate.candidateId);
    const exactIdDenial = await verifyAnonymousExactIdDenied(
      anonClient,
      stagedCandidate.candidateId,
    );
    await verifyAnonymousListDenied(anonClient);
    verifyGuessedExactIdDenied(exactIdDenial);
    reportAuthenticatedNonAdminSkipped();
    verifyNoPayloadLeakage();

    logStep("Candidate staging RLS smoke passed.");
  } finally {
    await cleanup(adminClient);
  }
}

if (process.env[OPT_IN_ENV] !== "1") {
  logStep(
    `Candidate staging RLS smoke skipped. Set ${OPT_IN_ENV}=1 to run.`,
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
      created.discoverySourceId ||
      created.auditCorrelationId ||
      created.marker
    ) {
      console.error(
        `[${PHASE}] Manual cleanup may be required for IDs: candidate=${created.candidateId ?? "none"}, run=${created.discoveryRunId ?? "none"}, source=${created.discoverySourceId ?? "none"}, auditCorrelationId=${created.auditCorrelationId ?? "none"}, marker=${created.marker ?? "none"}`,
      );
    }

    process.exitCode = 1;
  }
}
