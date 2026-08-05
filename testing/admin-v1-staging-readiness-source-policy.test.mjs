import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import * as core from "./admin-v1-staging-readiness-core.mjs";

const PROBE_PATH = "testing/admin-v1-staging-readiness-probe.mjs";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const MANIFEST_PATH = "testing/static-test-safety-manifest.json";
const RUNNER_PATH = "testing/run-static-readiness.mjs";
const CRITICAL_PATHS = Object.freeze([
  "app/api/admin/csrf/route.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/api/admin/session/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/tools/route.ts",
  "app/api/admin/upload-logo/route.ts",
]);
const REQUIRED_PROPERTIES = Object.freeze({
  tools: Object.freeze([
    "id",
    "name",
    "slug",
    "normalized_domain",
    "category",
    "description",
    "website",
    "pricing",
    "logo_url",
    "status",
    "deleted_at",
    "platforms",
    "featured",
    "best_for",
    "use_cases",
  ]),
  submitted_tools: Object.freeze([
    "id",
    "name",
    "category",
    "description",
    "website",
    "pricing",
    "logo_url",
    "submitter_name",
    "submitter_email",
    "status",
    "created_at",
    "normalized_domain",
  ]),
  admin_audit_logs: Object.freeze([
    "id",
    "action",
    "target_type",
    "target_id",
    "target_name",
    "details",
    "ip_address",
    "user_agent",
    "created_at",
  ]),
});
const EXPECTED_IMPORTS = Object.freeze([
  "./admin-v1-staging-readiness-core.mjs",
  "node:crypto",
  "node:fs",
  "node:path",
]);
const EXPECTED_REQUEST_PATHS = Object.freeze([
  "/rest/v1/",
  "/rest/v1/tools?select=id&limit=0",
  "/rest/v1/submitted_tools?select=id&limit=0",
  "/rest/v1/admin_audit_logs?select=id&limit=0",
  "/storage/v1/bucket/tool-logos",
]);
const EXPECTED_CLASSIFICATIONS = Object.freeze({
  "testing/admin-v1-staging-readiness-core.mjs": [
    "SUPPORT",
    "SAFE_STATIC_SUPPORT",
    "VALIDATE_ONLY",
  ],
  "testing/admin-v1-staging-readiness-probe.mjs": [
    "EXECUTABLE",
    "DATABASE_OR_SUPABASE",
    "DENY",
  ],
  "testing/admin-v1-staging-readiness-source-policy.test.mjs": [
    "EXECUTABLE",
    "SAFE_STATIC_POLICY",
    "RUN_POLICY",
  ],
  "testing/admin-v1-staging-readiness-evidence.schema.json": [
    "CONFIG",
    "SAFE_STATIC_SUPPORT",
    "VALIDATE_ONLY",
  ],
  "testing/admin-v1-staging-readiness-evidence.json": [
    "CONFIG",
    "SAFE_STATIC_SUPPORT",
    "VALIDATE_ONLY",
  ],
  "testing/admin-v1-staging-readiness-evidence.test.mjs": [
    "EXECUTABLE",
    "SAFE_STATIC_POLICY",
    "RUN_POLICY",
  ],
});

function absolute(relativePath) {
  const resolved = path.resolve(process.cwd(), relativePath);
  assert(resolved.startsWith(`${process.cwd()}${path.sep}`));
  return resolved;
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function catches(operation) {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
}

function validEnvironment(overrides = {}) {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://syntheticref.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(32),
    SUPABASE_SERVICE_ROLE_KEY: "s".repeat(32),
    ADMIN_PASSWORD: "Synthetic-Admin-Password-1",
    ADMIN_SESSION_SECRET: "z".repeat(32),
    ...overrides,
  };
}

function environmentText(overrides = {}) {
  const environment = validEnvironment(overrides);
  return `${Object.entries(environment)
    .map(([name, value]) => `${name}=${value}`)
    .join("\n")}\n`;
}

function validOpenApi() {
  const definitions = Object.fromEntries(
    Object.entries(REQUIRED_PROPERTIES).map(([table, properties]) => [
      table,
      {
        properties: Object.fromEntries(
          properties.map((property) => [property, { type: "string" }]),
        ),
      },
    ]),
  );
  return {
    openapi: "3.0.0",
    definitions,
    paths: {
      "/tools": { get: {} },
      "/submitted_tools": { get: {} },
      "/admin_audit_logs": { get: {} },
      "/rpc/approve_submitted_tool": {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: { properties: { submission_id: { type: "string" } } },
              },
            },
          },
        },
      },
    },
  };
}

function parseProbeAst(probeSource) {
  return ts.createSourceFile(
    PROBE_PATH,
    probeSource,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
}

function astFacts(probeSource) {
  const root = parseProbeAst(probeSource);
  const imports = [];
  const stringLiterals = new Set();
  const numericLiterals = new Set();
  const calls = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      stringLiterals.add(node.text);
    }
    if (ts.isNumericLiteral(node)) numericLiterals.add(Number(node.text));
    if (ts.isCallExpression(node)) calls.push(node.expression.getText(root));
    ts.forEachChild(node, visit);
  };
  visit(root);
  return {
    calls,
    imports: imports.sort(),
    numericLiterals,
    stringLiterals,
  };
}

function exactSet(actual, expected) {
  return (
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index])
  );
}

function coreAssertions() {
  const assertions = [];
  const expectedExports = [
    "canonicalJson",
    "classifyEnvironmentReadiness",
    "deriveSupabaseTargetIdentity",
    "parseStrictEnvironmentText",
    "validateOpenApiContract",
    "validateStorageBucketContract",
    "validateTableProbeContract",
  ];
  assertions.push(exactSet(Object.keys(core), expectedExports));

  const parsed = core.parseStrictEnvironmentText(environmentText());
  assertions.push(Object.keys(parsed).length === 5);
  assertions.push(
    catches(() =>
      core.parseStrictEnvironmentText(
        `${environmentText()}NEXT_PUBLIC_SUPABASE_ANON_KEY=duplicate\n`,
      ),
    ),
  );
  assertions.push(
    catches(() =>
      core.parseStrictEnvironmentText(
        environmentText({ ADMIN_PASSWORD: "$(not-executed)" }),
      ),
    ),
  );
  assertions.push(
    catches(() =>
      core.parseStrictEnvironmentText(
        environmentText({ ADMIN_SESSION_SECRET: "continued\\" }),
      ),
    ),
  );
  assertions.push(
    catches(() =>
      core.parseStrictEnvironmentText(
        environmentText().replace(/^ADMIN_PASSWORD=.*\n/mu, ""),
      ),
    ),
  );

  const identity = core.deriveSupabaseTargetIdentity(
    "https://syntheticref.supabase.co",
  );
  assertions.push(
    identity.project_ref === "syntheticref" &&
      identity.normalized_origin === "https://syntheticref.supabase.co" &&
      /^[a-f0-9]{64}$/u.test(identity.project_ref_sha256) &&
      /^[a-f0-9]{64}$/u.test(identity.origin_sha256),
  );
  assertions.push(
    catches(() =>
      core.deriveSupabaseTargetIdentity(
        "http://syntheticref.supabase.co/?query=forbidden",
      ),
    ),
  );

  assertions.push(core.classifyEnvironmentReadiness(validEnvironment()).ready);
  assertions.push(
    !core.classifyEnvironmentReadiness(
      validEnvironment({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "short" }),
    ).ready,
  );
  assertions.push(
    !core.classifyEnvironmentReadiness(
      validEnvironment({
        SUPABASE_SERVICE_ROLE_KEY: "a".repeat(32),
      }),
    ).ready,
  );
  assertions.push(
    !core.classifyEnvironmentReadiness(
      validEnvironment({ ADMIN_PASSWORD: "password" }),
    ).ready,
  );
  assertions.push(
    !core.classifyEnvironmentReadiness(
      validEnvironment({ ADMIN_SESSION_SECRET: "Synthetic-Admin-Password-1" }),
    ).ready,
  );
  assertions.push(
    core.canonicalJson({ z: 1, a: { d: 2, b: [3, { y: 4, x: 5 }] } }) ===
      '{\n  "a": {\n    "b": [\n      3,\n      {\n        "x": 5,\n        "y": 4\n      }\n    ],\n    "d": 2\n  },\n  "z": 1\n}\n',
  );

  const openApi = validOpenApi();
  assertions.push(core.validateOpenApiContract(openApi).ready);
  const missingPath = structuredClone(openApi);
  delete missingPath.paths["/tools"];
  assertions.push(!core.validateOpenApiContract(missingPath).ready);
  const missingProperty = structuredClone(openApi);
  delete missingProperty.definitions.tools.properties.slug;
  assertions.push(!core.validateOpenApiContract(missingProperty).ready);
  const missingRpcInput = structuredClone(openApi);
  delete missingRpcInput.paths["/rpc/approve_submitted_tool"].post.requestBody
    .content["application/json"].schema.properties.submission_id;
  assertions.push(!core.validateOpenApiContract(missingRpcInput).ready);

  assertions.push(
    core.validateTableProbeContract(200, "[]").zero_rows &&
      core.validateTableProbeContract(204, "").zero_rows,
  );
  assertions.push(
    catches(() => core.validateTableProbeContract(200, '[{"id":"forbidden"}]')) &&
      catches(() => core.validateTableProbeContract(401, "[]")),
  );
  assertions.push(
    core.validateStorageBucketContract({
      id: "tool-logos",
      name: "tool-logos",
      public: true,
      file_size_limit: null,
      allowed_mime_types: null,
    }).ready &&
      !core.validateStorageBucketContract({
        id: "tool-logos",
        name: "tool-logos",
        public: false,
        file_size_limit: 2_097_152,
        allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
      }).ready,
  );
  return assertions;
}

function probeAssertions(probeSource) {
  const marker = probeSource.includes("const PROBE_CONTRACT_VERSION = 1;");
  const facts = astFacts(probeSource);
  const hasAllRequestPaths = EXPECTED_REQUEST_PATHS.every((requestPath) =>
    facts.stringLiterals.has(requestPath),
  );
  const bannedNetworkTokens = [
    'method: "POST"',
    'method: "PATCH"',
    'method: "PUT"',
    'method: "DELETE"',
    'method: "OPTIONS"',
    "/rpc/",
    "/object/list/",
    "api.vercel.com",
  ];
  return [
    marker && exactSet(facts.imports, EXPECTED_IMPORTS),
    marker &&
      ["--self-test", "--identify-target", "--probe"].every((mode) =>
        facts.stringLiterals.has(mode),
      ) &&
      probeSource.includes("AIFINDER_STAGING_TARGET_AUTHORIZATION"),
    marker &&
      facts.stringLiterals.has(".env.local") &&
      probeSource.includes("ENVIRONMENT_VARIABLE_NAMES") &&
      probeSource.includes("lstatSync") &&
      probeSource.includes("realpathSync") &&
      !probeSource.includes("dotenv") &&
      !probeSource.includes("source .env.local"),
    marker &&
      hasAllRequestPaths &&
      probeSource.includes('method: "GET"') &&
      probeSource.includes("REQUEST_SPECS.length === 5"),
    marker &&
      facts.numericLiterals.has(2) &&
      facts.numericLiterals.has(10_000) &&
      facts.numericLiterals.has(5 * 1024 * 1024) &&
      facts.numericLiterals.has(128 * 1024) &&
      probeSource.includes('redirect: "manual"') &&
      probeSource.includes("RETRYABLE_STATUSES"),
    marker &&
      probeSource.includes('"apikey"') &&
      probeSource.includes('"Authorization"') &&
      probeSource.includes('"Accept"') &&
      probeSource.includes("requestUrl.origin !== confirmedOrigin") &&
      bannedNetworkTokens.every((token) => !probeSource.includes(token)),
    marker &&
      facts.stringLiterals.has(
        "testing/admin-v1-staging-readiness-evidence.json",
      ) &&
      facts.calls.filter((call) => call.endsWith("writeFileSync")).length === 1 &&
      !probeSource.includes("appendFile") &&
      !probeSource.includes("renameSync"),
    marker &&
      probeSource.includes("raw_values: 0") &&
      probeSource.includes("rows_retained: 0") &&
      probeSource.includes("database_writes: 0") &&
      probeSource.includes("storage_writes: 0") &&
      probeSource.includes("rpc_calls: 0") &&
      !probeSource.includes("console.log(environment") &&
      !probeSource.includes("console.log(headers"),
  ];
}

function governanceAssertions() {
  const matrix = json(MATRIX_PATH);
  const registry = json(REGISTRY_PATH);
  const manifest = json(MANIFEST_PATH);
  const runner = source(RUNNER_PATH);
  const rows = matrix.entries ?? matrix.routes ?? [];
  const criticalRows = rows.filter((row) => CRITICAL_PATHS.includes(row.path));
  const deferredRows = rows.filter(
    (row) => row.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED",
  );
  const readinessEvidence = [
    "testing/admin-v1-staging-readiness-source-policy.test.mjs",
    "testing/admin-v1-staging-readiness-evidence.json",
    "testing/admin-v1-staging-readiness-evidence.test.mjs",
  ];
  const workstreams = registry.workstreams ?? registry.entries ?? [];
  const critical = workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  const deferred = workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_DEFERRED",
  );
  const manifestEntries = manifest.entries ?? [];
  const classificationReady = Object.entries(EXPECTED_CLASSIFICATIONS).every(
    ([entryPath, classification]) => {
      const entry = manifestEntries.find((candidate) => candidate.path === entryPath);
      return (
        entry?.role === classification[0] &&
        entry?.safety_class === classification[1] &&
        entry?.ci_disposition === classification[2]
      );
    },
  );
  const counts = {
    core: manifestEntries.filter((entry) => entry.ci_disposition === "RUN_CORE")
      .length,
    policy: manifestEntries.filter(
      (entry) => entry.ci_disposition === "RUN_POLICY",
    ).length,
    validate: manifestEntries.filter(
      (entry) => entry.ci_disposition === "VALIDATE_ONLY",
    ).length,
    deny: manifestEntries.filter((entry) => entry.ci_disposition === "DENY")
      .length,
  };

  return [
    criticalRows.length === 7 &&
      criticalRows.every(
        (row) =>
          row.coverage_state ===
            "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED" &&
          row.launch_blocking === true &&
          row.gap_code_or_null ===
            "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED",
      ),
    rows.length === 69 &&
      criticalRows.every((row) =>
        readinessEvidence.every((evidencePath) =>
          [...(row.static_evidence_paths ?? []), ...(row.partial_evidence_paths ?? [])].includes(
            evidencePath,
          ),
        ),
      ) &&
      deferredRows.length === 21 &&
      deferredRows.every(
        (row) => row.launch_blocking === false && row.gap_code_or_null === null,
      ),
    critical?.entry_count === 7 &&
      critical?.gap_code ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED" &&
      critical?.authority_class ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME" &&
      critical?.state ===
        "STAGING_ENV_DATABASE_STORAGE_READINESS_COMPLETE_DEPLOYED_RUNTIME_REQUIRED" &&
      critical?.execution_authorized === false &&
      critical?.next_gate ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION" &&
      deferred?.entry_count === 21 &&
      deferred?.state === "SAFELY_DISABLED_FOR_V1_LAUNCH",
    classificationReady &&
      manifestEntries.length === 138 &&
      counts.core === 5 &&
      counts.policy === 15 &&
      counts.validate === 31 &&
      counts.deny === 87,
    runner.includes('option === "--v1-staging-policy"') &&
      runner.includes("const V1_STAGING_CHILDREN = [") &&
      runner.includes(
        "PASS_STATIC_READINESS_LIST_COMPLETE_V1_STAGING core=5 c1=4 c2_1=2 c2_2=2 v1_admin=2 v1_staging=2 total=17",
      ) &&
      runner.includes(
        "PASS_STATIC_READINESS_V1_STAGING_POLICY children=2 pass=2 fail=0 authorized_scope_mutations=0 repository_mutations=0 source_identities=2 source_policy_gates=2",
      ) &&
      runner.includes(
        "PASS_STATIC_READINESS_V1_STAGING_COMPLETE core=5 c1=4 c2_1=2 c2_2=2 v1_admin=2 v1_staging=2 fail=0 repository_mutations=0",
      ) &&
      runner.includes(PROBE_PATH) &&
      !runner.includes(`path: "${PROBE_PATH}"`),
  ];
}

function mutationResults() {
  const openApi = validOpenApi();
  const privateBucket = {
    id: "tool-logos",
    name: "tool-logos",
    public: false,
    file_size_limit: 2_097_152,
    allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
  };
  return [
    catches(() =>
      core.parseStrictEnvironmentText(
        `${environmentText()}ADMIN_PASSWORD=duplicate\n`,
      ),
    ),
    catches(() => core.parseStrictEnvironmentText(environmentText().replaceAll("\n", "\r\n"))),
    catches(() => core.parseStrictEnvironmentText(`${environmentText()}\0`)),
    catches(() =>
      core.parseStrictEnvironmentText(environmentText({ ADMIN_PASSWORD: "$(id)" })),
    ),
    catches(() =>
      core.parseStrictEnvironmentText(environmentText({ ADMIN_PASSWORD: "`id`" })),
    ),
    catches(() => core.parseStrictEnvironmentText(`${environmentText()}not-an-assignment\n`)),
    catches(() =>
      core.parseStrictEnvironmentText(
        environmentText().replace(/^ADMIN_SESSION_SECRET=.*\n/mu, ""),
      ),
    ),
    catches(() =>
      core.parseStrictEnvironmentText(
        environmentText({ ADMIN_SESSION_SECRET: "continuation\\" }),
      ),
    ),
    catches(() => core.deriveSupabaseTargetIdentity("http://syntheticref.supabase.co")),
    catches(() =>
      core.deriveSupabaseTargetIdentity("https://syntheticref.supabase.co/?q=1"),
    ),
    catches(() => core.deriveSupabaseTargetIdentity("https://example.com")),
    !core.validateOpenApiContract({ ...openApi, paths: {} }).ready,
    (() => {
      const fixture = structuredClone(openApi);
      delete fixture.definitions.tools.properties.name;
      return !core.validateOpenApiContract(fixture).ready;
    })(),
    (() => {
      const fixture = structuredClone(openApi);
      delete fixture.paths["/rpc/approve_submitted_tool"];
      return !core.validateOpenApiContract(fixture).ready;
    })(),
    (() => {
      const fixture = structuredClone(openApi);
      delete fixture.paths["/rpc/approve_submitted_tool"].post.requestBody.content[
        "application/json"
      ].schema.properties.submission_id;
      return !core.validateOpenApiContract(fixture).ready;
    })(),
    catches(() => core.validateTableProbeContract(500, "[]")),
    catches(() => core.validateTableProbeContract(200, "not-json")),
    catches(() => core.validateTableProbeContract(200, '[{"id":1}]')),
    !core.validateStorageBucketContract(privateBucket).ready,
    !core.validateStorageBucketContract({
      ...privateBucket,
      public: true,
      allowed_mime_types: ["image/png", "image/jpeg"],
    }).ready,
  ];
}

try {
  const probeSource = source(PROBE_PATH);
  const results = [
    ...coreAssertions(),
    ...probeAssertions(probeSource),
    ...governanceAssertions(),
  ];
  assert.equal(results.length, 34);
  const pass = results.filter(Boolean).length;
  const fail = results.length - pass;
  if (pass === 21 && fail === 13) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_STAGING_READINESS_SOURCE_POLICY stage=PROBE_CONTRACT assertions=34 pass=21 fail=13 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (pass === 29 && fail === 5) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_STAGING_READINESS_SOURCE_POLICY stage=CURRENT_GOVERNANCE_RECONCILIATION assertions=34 pass=29 fail=5 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (fail !== 0) {
    process.stdout.write(
      `FAIL_ADMIN_V1_STAGING_READINESS_SOURCE_POLICY assertions=34 pass=${pass} fail=${fail} internal_failures=0\n`,
    );
    process.exit(1);
  }
  const mutations = mutationResults();
  assert.equal(mutations.length, 20);
  assert(mutations.every(Boolean));
  process.stdout.write(
    "PASS_ADMIN_V1_STAGING_READINESS_SOURCE_POLICY assertions=34 mutations=20 environment_variables=5 network_origins=1 methods=GET requests_per_attempt=5 maximum_attempts=2 maximum_requests=10 repository_write_paths=1 database_writes=0 storage_writes=0 rpc_calls=0 raw_values=0 failures=0 internal_failures=0\n",
  );
} catch {
  process.stdout.write(
    "FAIL_ADMIN_V1_STAGING_READINESS_SOURCE_POLICY assertions=34 pass=0 fail=34 internal_failures=1\n",
  );
  process.exit(1);
}
