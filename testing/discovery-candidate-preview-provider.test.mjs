import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("./register-typescript-test-loader.mjs");

const {
  CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION,
  getCandidateExtractionPreviewForRunWithDependencies,
} = await import("../lib/discovery/discovery-candidate-preview-provider.ts");

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";
const ARTIFACT_ID = "44444444-4444-4444-8444-444444444444";

const BASE_RUN = {
  id: RUN_ID,
  source_id: SOURCE_ID,
  status: "completed",
  updated_at: "2026-06-28T20:00:00.000Z",
};

const BASE_SOURCE = {
  id: SOURCE_ID,
  url: "https://source.example.com/review",
  source_type: "manual",
  updated_at: "2026-06-28T19:50:00.000Z",
};

const BASE_ARTIFACT = {
  id: ARTIFACT_ID,
  audit_correlation_id: AUDIT_ID,
  candidate_name: "Example AI Tool",
  candidate_website_url: "https://tool.example.com",
  category_hint: "Productivity",
  confidence_bucket: "medium",
  created_at: "2026-06-28T20:10:00.000Z",
  discovery_run_id: RUN_ID,
  discovery_source_id: SOURCE_ID,
  evidence_summary: "Name, website, and category matched safe static signals.",
  preview_generated_at: "2026-06-28T20:10:00.000Z",
  preview_schema_version: CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION,
  preview_status: "reviewable",
  pricing_hint: "Free + Paid",
  safety_flags: [
    "bounded_preview",
    "server_sanitized",
    "source_run_matched",
    "no_public_write",
    "no_discovered_write",
    "no_raw_html",
    "no_llm_output",
  ],
  source_evidence_locator: "url_index:0",
  source_url_snapshot: "https://source.example.com/review",
  updated_at: "2026-06-28T20:10:00.000Z",
};

function createInput(overrides = {}) {
  return {
    discoveryRunId: RUN_ID,
    discoverySourceId: SOURCE_ID,
    requestingAdminActorId: "admin-user-123",
    expectedSchemaVersion: CANDIDATE_PREVIEW_ARTIFACT_SCHEMA_VERSION,
    ...overrides,
  };
}

function createArtifact(overrides = {}) {
  return {
    ...BASE_ARTIFACT,
    ...overrides,
  };
}

function createDependencies({ run = BASE_RUN, source = BASE_SOURCE, artifacts = [BASE_ARTIFACT] } = {}) {
  return {
    async loadDiscoveryRun(discoveryRunId) {
      assert.equal(discoveryRunId, RUN_ID);

      return run;
    },
    async loadDiscoverySource(discoverySourceId) {
      assert.equal(discoverySourceId, SOURCE_ID);

      return source;
    },
    async loadPreviewArtifacts({ discoveryRunId, discoverySourceId }) {
      assert.equal(discoveryRunId, RUN_ID);
      assert.equal(discoverySourceId, SOURCE_ID);

      return artifacts;
    },
  };
}

async function runProvider(inputOverrides = {}, dependencyOverrides = {}) {
  return getCandidateExtractionPreviewForRunWithDependencies(
    createInput(inputOverrides),
    createDependencies(dependencyOverrides),
  );
}

function assertRejected(result, rejectionCode) {
  assert.equal(result.accepted, false);
  assert.equal(result.rejected, true);
  assert.equal(result.rejectionCode, rejectionCode);
  assert.equal(result.preview, null);
  assert.equal(result.noPublicWriteConfirmed, true);
  assert.equal(result.noDiscoveredWriteConfirmed, true);
}

function assertNoRawPayloadLeak(result) {
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("<script"), false);
  assert.equal(serialized.includes("secret=value"), false);
  assert.equal(serialized.includes("raw_payload"), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("created_at"), false);
  assert.equal(serialized.includes("updated_at"), false);
  assert.equal(serialized.includes(ARTIFACT_ID), false);
}

test("missing run ID is rejected", async () => {
  const result = await runProvider({ discoveryRunId: " " });

  assertRejected(result, "missing_discovery_run_id");
  assertNoRawPayloadLeak(result);
});

test("missing source ID is rejected", async () => {
  const result = await runProvider({ discoverySourceId: " " });

  assertRejected(result, "missing_discovery_source_id");
  assertNoRawPayloadLeak(result);
});

test("missing admin actor is rejected", async () => {
  const result = await runProvider({ requestingAdminActorId: " " });

  assertRejected(result, "missing_admin_actor");
  assertNoRawPayloadLeak(result);
});

test("missing discovery run is rejected", async () => {
  const result = await runProvider({}, { run: null });

  assertRejected(result, "discovery_run_not_found");
  assertNoRawPayloadLeak(result);
});

test("run source mismatch is rejected", async () => {
  const result = await runProvider(
    {},
    {
      run: {
        ...BASE_RUN,
        source_id: "99999999-9999-4999-8999-999999999999",
      },
    },
  );

  assertRejected(result, "discovery_run_source_mismatch");
  assertNoRawPayloadLeak(result);
});

test("missing preview artifact returns unavailable", async () => {
  const result = await runProvider({}, { artifacts: [] });

  assertRejected(result, "preview_artifact_unavailable");
  assert.equal(result.previewStatus, "unavailable");
  assertNoRawPayloadLeak(result);
});

test("pending preview artifact is not accepted", async () => {
  const result = await runProvider(
    {},
    { artifacts: [createArtifact({ preview_status: "pending_review" })] },
  );

  assertRejected(result, "preview_artifact_unavailable");
  assert.equal(result.previewStatus, "pending_review");
  assertNoRawPayloadLeak(result);
});

test("unsupported schema version is stale", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          preview_schema_version: "candidate_preview_artifact.v0",
        }),
      ],
    },
  );

  assertRejected(result, "preview_artifact_schema_unsupported");
  assert.equal(result.previewStatus, "stale");
  assertNoRawPayloadLeak(result);
});

test("unsafe candidate name is rejected without echoing raw text", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          candidate_name: "<script>secret=value</script>",
        }),
      ],
    },
  );

  assertRejected(result, "preview_candidate_missing_name");
  assertNoRawPayloadLeak(result);
});

test("missing candidate website is rejected", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          candidate_website_url: null,
        }),
      ],
    },
  );

  assertRejected(result, "preview_candidate_missing_website");
  assertNoRawPayloadLeak(result);
});

test("unsafe candidate website is rejected", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          candidate_website_url: "javascript:alert(1)",
        }),
      ],
    },
  );

  assertRejected(result, "preview_candidate_unsafe_website");
  assertNoRawPayloadLeak(result);
});

test("missing source URL snapshot is blocked", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          source_url_snapshot: null,
        }),
      ],
    },
  );

  assertRejected(result, "preview_source_url_missing");
  assert.equal(result.previewStatus, "blocked");
  assertNoRawPayloadLeak(result);
});

test("unsafe source URL snapshot is blocked", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          source_url_snapshot: "http://source.example.com/review",
        }),
      ],
    },
  );

  assertRejected(result, "preview_source_url_unsafe");
  assert.equal(result.previewStatus, "blocked");
  assertNoRawPayloadLeak(result);
});

test("candidate website copied as source URL snapshot is blocked", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          source_url_snapshot: "https://tool.example.com",
        }),
      ],
    },
  );

  assertRejected(result, "preview_source_url_unsafe");
  assert.equal(result.previewStatus, "blocked");
  assertNoRawPayloadLeak(result);
});

test("source URL snapshot drift is stale", async () => {
  const result = await runProvider(
    {},
    {
      source: {
        ...BASE_SOURCE,
        url: "https://different-source.example.com/review",
      },
    },
  );

  assertRejected(result, "preview_source_url_drift");
  assert.equal(result.previewStatus, "stale");
  assertNoRawPayloadLeak(result);
});

test("missing source evidence locator is stale", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          source_evidence_locator: null,
        }),
      ],
    },
  );

  assertRejected(result, "preview_artifact_stale");
  assert.equal(result.previewStatus, "stale");
  assertNoRawPayloadLeak(result);
});

test("blocking safety flags reject the artifact", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({
          safety_flags: ["unsafe_url_blocked"],
        }),
      ],
    },
  );

  assertRejected(result, "preview_artifact_blocked");
  assert.equal(result.previewStatus, "blocked");
  assertNoRawPayloadLeak(result);
});

test("multiple reviewable artifacts return ambiguous blocked result", async () => {
  const result = await runProvider(
    {},
    {
      artifacts: [
        createArtifact({ id: ARTIFACT_ID }),
        createArtifact({ id: "55555555-5555-4555-8555-555555555555" }),
      ],
    },
  );

  assertRejected(result, "preview_artifact_ambiguous");
  assert.equal(result.previewStatus, "blocked");
  assertNoRawPayloadLeak(result);
});

test("run update newer than preview makes artifact stale", async () => {
  const result = await runProvider(
    {},
    {
      run: {
        ...BASE_RUN,
        updated_at: "2026-06-28T20:30:00.000Z",
      },
    },
  );

  assertRejected(result, "preview_artifact_stale");
  assert.equal(result.previewStatus, "stale");
  assertNoRawPayloadLeak(result);
});

test("reviewable artifact returns sanitized preview only", async () => {
  const result = await runProvider();

  assert.equal(result.accepted, true);
  assert.equal(result.rejected, false);
  assert.equal(result.rejectionCode, null);
  assert.equal(result.previewStatus, "reviewable");
  assert.equal(result.preview.candidateName, "Example AI Tool");
  assert.equal(result.preview.candidateWebsiteUrl, "https://tool.example.com/");
  assert.equal(result.preview.discoveryRunId, RUN_ID);
  assert.equal(result.preview.discoverySourceId, SOURCE_ID);
  assert.equal(result.preview.auditCorrelationId, AUDIT_ID);
  assert.equal(result.preview.sourceEvidenceLocator, "url_index:0");
  assert.equal(result.preview.sourceUrlSnapshot, "https://source.example.com/review");
  assert.equal(result.noPublicWriteConfirmed, true);
  assert.equal(result.noDiscoveredWriteConfirmed, true);
  assert.equal(result.safetyFlags.includes("server_sanitized"), true);
  assert.equal(result.safetyFlags.includes("no_public_write"), true);
  assert.equal(result.safetyFlags.includes("no_discovered_write"), true);
  assertNoRawPayloadLeak(result);
});

test("provider source does not contain mutation operations", () => {
  const source = readFileSync(
    "lib/discovery/discovery-candidate-preview-provider.ts",
    "utf8",
  );

  assert.equal(source.includes(".insert("), false);
  assert.equal(source.includes(".upsert("), false);
  assert.equal(source.includes(".update("), false);
  assert.equal(source.includes(".delete("), false);
  assert.equal(source.includes("public.tools"), false);
  assert.equal(source.includes("discovered_tools"), false);
  assert.equal(source.includes("sourceUrlSnapshot: artifact.candidate_website_url"), false);
  assert.equal(source.includes("sourceUrlSnapshot: candidateWebsiteUrl"), false);
});
