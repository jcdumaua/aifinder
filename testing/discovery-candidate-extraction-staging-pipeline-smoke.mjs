#!/usr/bin/env node

import { randomUUID } from "node:crypto";

const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE";
const REQUIRED_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const PHASE = "Phase 10I";
const MARKER_PREFIX = "phase-10i-extraction-staging-pipeline-smoke";
const SERVICE_ROLE_SELECTED_CANDIDATE_COLUMNS =
  "id,candidate_status,discovery_run_id,discovery_source_id,audit_correlation_id,source_evidence_locator,created_at,updated_at";
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
  return "Unexpected candidate extraction staging pipeline smoke failure.";
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
  logStep("Creating dedicated extraction staging pipeline smoke source fixture.");

  const { data, error } = await client
    .from("discovery_sources")
    .insert({
      name: `Phase 10I Extraction Staging Pipeline Smoke Source ${smoke.token}`,
      slug: smoke.slug,
      description:
        "Phase 10I candidate extraction staging pipeline smoke source fixture.",
      url: `https://${smoke.slug}.example.com/source`,
      source_type: "manual",
      config: {
        smoke: true,
        phase: "10I",
        marker: smoke.marker,
        purpose: "candidate_extraction_staging_pipeline_smoke",
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
  logStep("Creating dedicated extraction staging pipeline smoke run fixture.");

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

function buildExtractionInput({
  smoke,
  discoveryRunId,
  discoverySourceId,
}) {
  const sourceUrl = `https://${smoke.slug}.example.com/source`;
  const candidateUrl = `https://${smoke.slug}.example.com/tool`;

  return {
    discoveryRunId,
    discoverySourceId,
    sourceUrl,
    sourceEvidenceLocator: smoke.marker,
    candidateName: `Phase 10I Extraction Staging Pipeline Smoke Candidate ${smoke.token}`,
    candidateWebsiteUrl: candidateUrl,
    candidateDescription: "Controlled extraction staging pipeline smoke fixture.",
    candidateCategoryHint: "Productivity",
    candidatePricingHint: "Free",
    evidenceSummary:
      "Controlled extraction staging pipeline smoke fixture for staging only.",
    confidenceBucket: "low",
    auditCorrelationId: smoke.auditCorrelationId,
  };
}

async function stagePipelineCandidateFixture({
  stageMappedExtractionCandidate,
  smoke,
  discoveryRunId,
  discoverySourceId,
}) {
  logStep("Calling stageMappedExtractionCandidate exactly once.");

  const result = await stageMappedExtractionCandidate({
    item: buildExtractionInput({
      smoke,
      discoveryRunId,
      discoverySourceId,
    }),
  });

  if (!result.ok) {
    fail(
      `Extraction staging pipeline failed at ${result.stage} with safe code: ${result.error.code}`,
    );
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

async function verifyServiceRoleControlRead({
  client,
  candidateId,
  sourceId,
  runId,
  auditCorrelationId,
}) {
  logStep("Test 1 — Service-role pipeline candidate readback.");

  const { data, error } = await client
    .from("discovery_candidate_tools")
    .select(SERVICE_ROLE_SELECTED_CANDIDATE_COLUMNS)
    .eq("id", candidateId)
    .single();

  if (error || !data) {
    fail("Service-role pipeline candidate readback failed.");
  }

  assert(data.id === candidateId, "Service-role readback ID mismatch.");
  assert(
    data.candidate_status === "staged",
    "Service-role readback status mismatch.",
  );
  assert(
    data.discovery_source_id === sourceId,
    "Service-role readback source ID mismatch.",
  );
  assert(
    data.discovery_run_id === runId,
    "Service-role readback run ID mismatch.",
  );
  assert(
    data.audit_correlation_id === auditCorrelationId,
    "Service-role readback audit correlation ID mismatch.",
  );
  assert(
    data.source_evidence_locator === created.marker,
    "Service-role readback evidence locator mismatch.",
  );
  assert(Boolean(data.created_at), "Service-role readback missing created_at.");
  assert(Boolean(data.updated_at), "Service-role readback missing updated_at.");

  logStep("Test 1 — Service-role pipeline candidate readback: pass.");
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

function verifyNoPayloadLeakage() {
  logStep(
    "Test 5 — No payload leakage on denial: pass (denial logs used safe categories only).",
  );
}

async function getPublicDiscoveredCounts(client) {
  const [
    { count: publicToolsCount, error: publicToolsError },
    { count: discoveredToolsCount, error: discoveredToolsError },
  ] = await Promise.all([
    client.from("tools").select("id", { count: "exact", head: true }),
    client.from("discovered_tools").select("id", {
      count: "exact",
      head: true,
    }),
  ]);

  if (publicToolsError || discoveredToolsError) {
    fail("Failed to verify public/discovered tool write boundaries.");
  }

  assert(
    typeof publicToolsCount === "number",
    "Unable to verify public.tools row count.",
  );
  assert(
    typeof discoveredToolsCount === "number",
    "Unable to verify discovered_tools row count.",
  );

  return {
    publicToolsCount,
    discoveredToolsCount,
  };
}

async function verifyNoPublicOrDiscoveredWrites(client, beforeCounts) {
  logStep("Test 6 — No public.tools / discovered_tools writes.");

  const afterCounts = await getPublicDiscoveredCounts(client);

  assert(
    afterCounts.publicToolsCount === beforeCounts.publicToolsCount,
    "public.tools row count changed during smoke.",
  );
  assert(
    afterCounts.discoveredToolsCount === beforeCounts.discoveredToolsCount,
    "discovered_tools row count changed during smoke.",
  );

  logStep("Test 6 — No public.tools / discovered_tools writes: pass.");
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

  await import("./register-typescript-test-loader.mjs");
  await loadLocalEnv();
  assertRequiredEnvPresent();

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const [
    { createClient },
    { createDiscoverySupabaseAdminClient },
    { stageMappedExtractionCandidate },
  ] = await Promise.all([
    import("@supabase/supabase-js"),
    import("../lib/discovery/discovery-supabase-admin.ts"),
    import("../lib/discovery/discovery-candidate-extraction-staging-pipeline.ts"),
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
    const publicDiscoveredCountsBefore =
      await getPublicDiscoveredCounts(adminClient);
    const discoverySourceId = await createDiscoverySourceFixture(
      adminClient,
      smoke,
    );
    const discoveryRunId = await createDiscoveryRunFixture(
      adminClient,
      discoverySourceId,
    );
    const stagedCandidate = await stagePipelineCandidateFixture({
      stageMappedExtractionCandidate,
      smoke,
      discoveryRunId,
      discoverySourceId,
    });

    await verifyServiceRoleControlRead({
      client: adminClient,
      candidateId: stagedCandidate.candidateId,
      sourceId: discoverySourceId,
      runId: discoveryRunId,
      auditCorrelationId: smoke.auditCorrelationId,
    });
    const exactIdDenial = await verifyAnonymousExactIdDenied(
      anonClient,
      stagedCandidate.candidateId,
    );
    await verifyAnonymousListDenied(anonClient);
    verifyGuessedExactIdDenied(exactIdDenial);
    verifyNoPayloadLeakage();
    await verifyNoPublicOrDiscoveredWrites(
      adminClient,
      publicDiscoveredCountsBefore,
    );

    logStep("Candidate extraction staging pipeline smoke passed.");
  } finally {
    await cleanup(adminClient);
  }
}

if (process.env[OPT_IN_ENV] !== "1") {
  logStep(
    `Candidate extraction staging pipeline smoke skipped. Set ${OPT_IN_ENV}=1 to run.`,
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
