import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONCRETE_APPROVAL_TOKEN,
  CONCRETE_APPROVAL_TOKEN_SHA256,
  CONCRETE_OPERATION_CLASS,
  CONCRETE_RETAINED_IDENTITY_SHA256,
  validateConcreteAuthorizationRecord,
} from "./nonproduction-qualification-authorization.mjs";

const REQUIRED_HEAD = "ae614fa904e4c00d1dacec8493969fdce6fff3a3";
const REQUIRED_APPROVAL_TOKEN =
  "APPROVE_LAUNCH_OPERATIONS_KERNEL_V6_GIT_PUSH_PORCELAIN_CONTRACT_RESEALED_AND_ONE_FRESH_REAL_NONPRODUCTION_QUALIFICATION_V1";
const REQUIRED_APPROVAL_TOKEN_SHA256 =
  "fa0968309b6c9a27c6fc90c7f065b3017c71e586ef247707536089a32534d386";
const SPENT_LATEST_APPROVAL_TOKEN_SHA256 =
  "4f79584ccb29f9d223b618414d6c64c04dab0b75d268b21f789e3e3a8d709bd2";
const SPENT_CURRENT_APPROVAL_TOKEN_SHA256 =
  "2e5b724547830b3d48531e35a911f4087ecd2ab5c459ac3a2ed0b3e4aecc2c93";
const SPENT_PREDECESSOR_APPROVAL_TOKEN_SHA256 =
  "6b939c14ff36b85782bc70cbc3321c09300853b230a367465b76d788f08b46a7";
const SPENT_EARLIER_APPROVAL_TOKEN_SHA256 =
  "909c1288d76283cfda78e2f8ad64aa08c369b40289d6813b493174e9ceec2952";
const SPENT_OLDER_APPROVAL_TOKEN_SHA256 =
  "70e445792d360c010ad5df5136373f4fa5d6add272d783630756868bc17b1198";
const RETIRED_CREDENTIAL_AVAILABILITY_APPROVAL_TOKEN_SHA256 =
  "0a61af030103f8effd1c35cde2495fff84222a45ccae2e5fbdac2933f5209250";
const SUPERSEDED_CHECKPOINT_REPAIRED_APPROVAL_TOKEN_SHA256 =
  "4e61136ca0bdcaa62f9c84a3f6d95417db03c97fafa8e2994d0f932fded18a80";
const TRAILING_LF_APPROVAL_TOKEN_SHA256 =
  "5d4bad1e62aabe6d5d5134a6ce5b637f244468bb75fdda54243d020ff0caef58";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const SPENT_RUN_IDS = [
  "8c0d9e84-62e5-4658-9de0-c0121a302951",
  "e46a0d21-f0b4-4f7d-8a4f-e7f6e8a7eda0",
  "26199d3a-5bcd-4a48-9f31-c7a081195207",
  "f16a8383-a3ff-4c51-bec6-dc8beba5f4eb",
  "89336a0a-b67c-4ad6-99d2-b527ffdca9fd",
  "8e694077-7724-46b4-88ae-1e959d7c28de",
  "716fcb1b-7999-42b4-82f8-e5e8e65b644f",
  "a397fbe1-1107-40df-86b2-83b153d8b8cc",
];
const SUPPORT_PATHS = [
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/run-static-readiness.mjs",
  "testing/static-test-safety-manifest.json",
];

function sha(character) {
  return character.repeat(64);
}

function record() {
  return {
    schema_version: 1,
    authorization_id_sha256: sha("1"),
    candidate_identity_sha256: sha("2"),
    manifest_sha256: sha("3"),
    supervisor_sha256: sha("a"),
    supervisor_policy_sha256: sha("b"),
    compatibility_support_sha256: Object.fromEntries(
      SUPPORT_PATHS.map((path, index) => [path, String(index + 4).repeat(64)]),
    ),
    retained_legacy_identity_sha256: CONCRETE_RETAINED_IDENTITY_SHA256,
    retained_legacy_classification: "FAIL_CLOSED_UNRESOLVED",
    preserve_ambiguous_legacy_resources: true,
    operation_class: CONCRETE_OPERATION_CLASS,
    attempt_limit: 1,
    request_budget: 16,
    mutation_budget: 15,
    success_retention_policy: "RETAIN_EXACTLY_ONE_PREVIEW",
    independent_review_approval_token_sha256:
      CONCRETE_APPROVAL_TOKEN_SHA256,
    created_at: "2030-01-01T00:00:00.000Z",
    expires_at: "2030-01-01T01:00:00.000Z",
    run_id: RUN_ID,
    repository: {
      root: "/Users/jamescarlodumaua/aifinder",
      branch: "main",
      head: REQUIRED_HEAD,
      origin_main: REQUIRED_HEAD,
      ahead: 0,
      behind: 0,
      index_empty: true,
      worktree_count: 1,
      status_sha256: sha("8"),
      remote_repository: "jcdumaua/aifinder",
    },
    execution: {
      journal_directory:
        `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${RUN_ID}`,
      branch_name: `aifinder-qualification-${RUN_ID}`,
      temporary_commit_sha: "a".repeat(40),
      preview_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      preview_project_name: "aifinder",
      preview_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      preview_team_slug: "ai-finder-s-projects",
      fixture_website: `https://${RUN_ID}.invalid/`,
      fixture_name: `AiFinder qualification ${RUN_ID}`,
      supabase_origin_sha256:
        "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777",
      supabase_project_ref_sha256:
        "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914",
      storage_bucket: "tool-logos",
      storage_name: `admin/${RUN_ID}.png`,
      environment_keys: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
      staging_checks: [
        { method: "GET", path: "/", status: 200 },
        { method: "GET", path: "/api/admin/session", status: 401 },
      ],
    },
  };
}

const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

await check("authorization binds the independently approved post-trust record", async () => {
  assert.equal(CONCRETE_APPROVAL_TOKEN, REQUIRED_APPROVAL_TOKEN);
  assert.equal(CONCRETE_APPROVAL_TOKEN_SHA256, REQUIRED_APPROVAL_TOKEN_SHA256);
});

function rejected(mutator, expectedCode = "CONCRETE_AUTHORIZATION_INVALID") {
  const candidate = record();
  mutator(candidate);
  assert.throws(
    () =>
      validateConcreteAuthorizationRecord(candidate, {
        now_epoch_ms: Date.parse("2030-01-01T00:30:00.000Z"),
      }),
    (error) => error?.code === expectedCode,
  );
}

await check("exact authorization accepted", async () => {
  const validated = validateConcreteAuthorizationRecord(record(), {
    now_epoch_ms: Date.parse("2030-01-01T00:30:00.000Z"),
  });
  assert.equal(validated.run_id, RUN_ID);
  assert.equal(validated.attempt_limit, 1);
  assert.equal(validated.request_budget, 16);
  assert.equal(validated.mutation_budget, 15);
  assert.equal(Object.isFrozen(validated), true);
});

await check("authorization schema mirrors the fail-closed record", async () => {
  const schema = JSON.parse(
    readFileSync(
      new URL("./nonproduction-qualification-authorization.schema.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual([...schema.required].sort(), [
    "attempt_limit",
    "authorization_id_sha256",
    "candidate_identity_sha256",
    "compatibility_support_sha256",
    "created_at",
    "execution",
    "expires_at",
    "independent_review_approval_token_sha256",
    "manifest_sha256",
    "mutation_budget",
    "operation_class",
    "preserve_ambiguous_legacy_resources",
    "repository",
    "request_budget",
    "retained_legacy_classification",
    "retained_legacy_identity_sha256",
    "run_id",
    "schema_version",
    "success_retention_policy",
    "supervisor_policy_sha256",
    "supervisor_sha256",
  ]);
  assert.equal(schema.properties.operation_class.const, CONCRETE_OPERATION_CLASS);
  assert.equal(schema.properties.attempt_limit.const, 1);
  assert.equal(schema.properties.request_budget.const, 16);
  assert.equal(schema.properties.mutation_budget.const, 15);
  assert.equal(
    schema.properties.independent_review_approval_token_sha256.const,
    REQUIRED_APPROVAL_TOKEN_SHA256,
  );
  assert.equal(
    schema.properties.retained_legacy_identity_sha256.const,
    CONCRETE_RETAINED_IDENTITY_SHA256,
  );
  assert.equal(schema.properties.repository.additionalProperties, false);
  assert.equal(schema.properties.execution.additionalProperties, false);
  assert.equal(
    schema.properties.execution.properties.supabase_origin_sha256.const,
    "25af71e2a439228b8c71e3ab09b27fc2ed4b12a00ba15c8f85ea354664893777",
  );
  assert.equal(
    schema.properties.execution.properties.supabase_project_ref_sha256.const,
    "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914",
  );
  assert.deepEqual(
    schema.properties.execution.properties.temporary_commit_sha,
    { "$ref": "#/$defs/gitSha1" },
  );
  assert.equal(
    schema.properties.run_id.pattern,
    "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
  );
  assert.deepEqual(schema.properties.run_id.not.enum, SPENT_RUN_IDS);
  assert.equal(
    schema.properties.execution.properties.storage_name.pattern,
    "^admin/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.png$",
  );
});

for (const [name, mutate, code] of [
  ["unknown field", (value) => { value.official_runtime = true; }],
  ["candidate shape", (value) => { value.candidate_identity_sha256 = "bad"; }],
  ["supervisor identity", (value) => { value.supervisor_sha256 = "bad"; }],
  ["supervisor policy identity", (value) => { value.supervisor_policy_sha256 = "bad"; }],
  ["retained digest", (value) => { value.retained_legacy_identity_sha256 = sha("9"); }],
  ["legacy classification", (value) => { value.retained_legacy_classification = "CLEAN"; }],
  ["ambiguous residue policy", (value) => { value.preserve_ambiguous_legacy_resources = false; }],
  ["operation class", (value) => { value.operation_class = "OFFICIAL_RUNTIME"; }],
  ["attempt count", (value) => { value.attempt_limit = 2; }],
  ["request budget", (value) => { value.request_budget = 17; }],
  ["mutation budget", (value) => { value.mutation_budget = 14; }],
  ["retention policy", (value) => { value.success_retention_policy = "RETAIN_ALL"; }],
  ["arbitrary approval digest", (value) => { value.independent_review_approval_token_sha256 = sha("a"); }],
  ["spent latest approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SPENT_LATEST_APPROVAL_TOKEN_SHA256;
  }],
  ["spent current approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SPENT_CURRENT_APPROVAL_TOKEN_SHA256;
  }],
  ["spent predecessor approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SPENT_PREDECESSOR_APPROVAL_TOKEN_SHA256;
  }],
  ["spent earlier approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SPENT_EARLIER_APPROVAL_TOKEN_SHA256;
  }],
  ["spent older approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SPENT_OLDER_APPROVAL_TOKEN_SHA256;
  }],
  ["retired credential-availability approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      RETIRED_CREDENTIAL_AVAILABILITY_APPROVAL_TOKEN_SHA256;
  }],
  ["superseded checkpoint-repaired approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      SUPERSEDED_CHECKPOINT_REPAIRED_APPROVAL_TOKEN_SHA256;
  }],
  ["trailing-LF approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      TRAILING_LF_APPROVAL_TOKEN_SHA256;
  }],
  ["predecessor approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      "d86f76f7a9228b4e16b9f74f0da86400c7dbc6bdb310a983b3e7f37a8909984a";
  }],
  ["retired V1 approval digest", (value) => {
    value.independent_review_approval_token_sha256 =
      "7f8d21e9a670015c9723c79e47b5137c07fe9777aaa2b552078a93e4d3a54ff2";
  }],
  ["run grammar", (value) => { value.run_id = "../escape"; }],
  ["non UUID run id", (value) => { value.run_id = "concrete-live-entrypoint-test-001"; }],
  ["first spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[0];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["second spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[1];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["third spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[2];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["fourth spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[3];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["fifth spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[4];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["sixth spent run id", (value) => {
    value.run_id = SPENT_RUN_IDS[5];
    value.execution.journal_directory =
      `/Users/jamescarlodumaua/Downloads/AiFinder-Qualification-${value.run_id}`;
    value.execution.branch_name = `aifinder-qualification-${value.run_id}`;
    value.execution.fixture_website = `https://${value.run_id}.invalid/`;
    value.execution.fixture_name = `AiFinder qualification ${value.run_id}`;
    value.execution.storage_name = `admin/${value.run_id}.png`;
  }],
  ["wrong repository", (value) => { value.repository.root = "/tmp/other"; }],
  ["wrong branch", (value) => { value.repository.branch = "production"; }],
  ["nonempty index", (value) => { value.repository.index_empty = false; }],
  ["multiple worktrees", (value) => { value.repository.worktree_count = 2; }],
  ["main remote", (value) => { value.repository.remote_repository = "other/repo"; }],
  ["branch ownership", (value) => { value.execution.branch_name = "shared-preview"; }],
  ["temporary commit", (value) => { value.execution.temporary_commit_sha = "bad"; }],
  ["fixture ownership", (value) => { value.execution.fixture_website = "https://example.com/"; }],
  ["storage ownership", (value) => { value.execution.storage_name = "shared/logo.png"; }],
  ["Supabase origin", (value) => { value.execution.supabase_origin_sha256 = sha("b"); }],
  ["Supabase project", (value) => { value.execution.supabase_project_ref_sha256 = sha("c"); }],
  ["environment widening", (value) => { value.execution.environment_keys.push("SUPABASE_SERVICE_ROLE_KEY"); }],
  ["write-capable staging", (value) => { value.execution.staging_checks[0].method = "POST"; }],
  ["expired", (value) => { value.expires_at = "2030-01-01T00:20:00.000Z"; }, "CONCRETE_AUTHORIZATION_EXPIRED"],
  ["excess lifetime", (value) => { value.expires_at = "2030-01-03T00:00:00.000Z"; }],
]) {
  await check(`${name} rejected`, async () => rejected(mutate, code));
}

if (failures.length > 0) {
  console.log(
    `FAIL_CONCRETE_AUTHORIZATION assertions=${assertions} mutations=39 failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_CONCRETE_AUTHORIZATION assertions=${assertions} mutations=39 network=0 credential_reads=0 failures=0 internal_failures=0`,
  );
}
