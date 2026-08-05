import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const SCHEMA_PATH = "testing/admin-v1-staging-readiness-evidence.schema.json";
const EVIDENCE_PATH = "testing/admin-v1-staging-readiness-evidence.json";
const CORE_PATH = "testing/admin-v1-staging-readiness-core.mjs";
const PROBE_PATH = "testing/admin-v1-staging-readiness-probe.mjs";
const SOURCE_POLICY_PATH =
  "testing/admin-v1-staging-readiness-source-policy.test.mjs";
const EVIDENCE_TEST_PATH =
  "testing/admin-v1-staging-readiness-evidence.test.mjs";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const BASELINE = "30b57b534c25a7d39d66a5dd29194bee8fe0690b";
const ENVIRONMENT_VARIABLE_NAMES = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
]);
const REQUEST_PATHS = Object.freeze([
  "/rest/v1/",
  "/rest/v1/tools?select=id&limit=0",
  "/rest/v1/submitted_tools?select=id&limit=0",
  "/rest/v1/admin_audit_logs?select=id&limit=0",
  "/storage/v1/bucket/tool-logos",
]);
const SOURCE_IDENTITY_PATHS = Object.freeze([
  CORE_PATH,
  PROBE_PATH,
  SOURCE_POLICY_PATH,
  SCHEMA_PATH,
  EVIDENCE_TEST_PATH,
]);
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

function absolute(relativePath) {
  const resolved = path.resolve(process.cwd(), relativePath);
  assert(resolved.startsWith(`${process.cwd()}${path.sep}`));
  return resolved;
}

function bytes(relativePath) {
  return readFileSync(absolute(relativePath));
}

function source(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes(relativePath));
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(canonicalValue(value), null, 2)}\n`;
}

function exact(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function resolveReference(root, reference) {
  if (typeof reference !== "string" || !reference.startsWith("#/")) return null;
  let current = root;
  for (const encoded of reference.slice(2).split("/")) {
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || !Object.hasOwn(current, key)) {
      return null;
    }
    current = current[key];
  }
  return current;
}

function matchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "integer") return Number.isInteger(value);
  return typeof value === type;
}

function schemaValid(value, rule, root) {
  if (!rule || typeof rule !== "object") return false;
  if (rule.$ref) {
    const resolved = resolveReference(root, rule.$ref);
    return resolved !== null && schemaValid(value, resolved, root);
  }
  if (Object.hasOwn(rule, "const") && !exact(value, rule.const)) return false;
  if (rule.enum && !rule.enum.some((candidate) => exact(value, candidate))) {
    return false;
  }
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.some((type) => matchesType(value, type))) return false;
  }
  if (typeof value === "string" && rule.pattern) {
    if (!new RegExp(rule.pattern, "u").test(value)) return false;
  }
  if (typeof value === "number") {
    if (rule.minimum !== undefined && value < rule.minimum) return false;
    if (rule.maximum !== undefined && value > rule.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) return false;
    if (rule.maxItems !== undefined && value.length > rule.maxItems) return false;
    if (rule.items && !value.every((item) => schemaValid(item, rule.items, root))) {
      return false;
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const required = rule.required ?? [];
    if (!required.every((key) => Object.hasOwn(value, key))) return false;
    const properties = rule.properties ?? {};
    if (
      rule.additionalProperties === false &&
      Object.keys(value).some((key) => !Object.hasOwn(properties, key))
    ) return false;
    for (const [key, childRule] of Object.entries(properties)) {
      if (Object.hasOwn(value, key) && !schemaValid(value[key], childRule, root)) {
        return false;
      }
    }
  }
  return true;
}

function schemaObjectsAreClosed(node) {
  if (!node || typeof node !== "object") return true;
  if (node.type === "object" && node.additionalProperties !== false) return false;
  return Object.values(node).every(schemaObjectsAreClosed);
}

function importsFor(relativePath) {
  const text = source(relativePath);
  const root = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const imports = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return imports.sort();
}

function preEvidenceAssertions(schema) {
  const schemaText = source(SCHEMA_PATH);
  const coreText = source(CORE_PATH);
  const probeText = source(PROBE_PATH);
  const testImports = importsFor(EVIDENCE_TEST_PATH);
  const matrix = json(MATRIX_PATH);
  const registry = json(REGISTRY_PATH);
  const critical = matrix.entries.filter((entry) => CRITICAL_PATHS.includes(entry.path));
  const deferred = matrix.entries.filter(
    (entry) => entry.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED",
  );
  const criticalWorkstream = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  return [
    schema.$schema === "https://json-schema.org/draft/2020-12/schema" &&
      schema.type === "object" &&
      schema.additionalProperties === false,
    schemaObjectsAreClosed(schema),
    !/["'](?:value|raw_length|prefix|suffix|entropy_sample)["']\s*:/iu.test(
      schemaText,
    ),
    exact(importsFor(CORE_PATH), ["node:crypto"]) &&
      !/\b(?:process|console|fetch|readFile|writeFile|Date|setTimeout)\b/u.test(
        coreText,
      ),
    probeText.includes("const PROBE_CONTRACT_VERSION = 1;") &&
      probeText.includes('redirect: "manual"') &&
      probeText.includes("REQUEST_SPECS.length === 5") &&
      probeText.includes("MAXIMUM_REQUESTS") &&
      probeText.includes("writeFileSync(resolved, canonicalJson(evidence)"),
    !testImports.includes("./admin-v1-staging-readiness-core.mjs") &&
      !testImports.includes("./admin-v1-staging-readiness-probe.mjs"),
    SOURCE_IDENTITY_PATHS.every((identityPath) => probeText.includes(identityPath)) &&
      !SOURCE_IDENTITY_PATHS.includes(EVIDENCE_PATH),
    matrix.entries.length === 69 &&
      critical.length === 7 &&
      critical.every(
        (entry) =>
          entry.launch_blocking === true &&
          [
            "V1_ADMIN_HERMETIC_EVIDENCE_INTEGRATED_STAGING_REQUIRED",
            "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED",
          ].includes(entry.coverage_state),
      ) &&
      deferred.length === 21 &&
      criticalWorkstream?.entry_count === 7,
  ];
}

function evidenceAssertions(evidence, evidenceText, schema) {
  const matrix = json(MATRIX_PATH);
  const registry = json(REGISTRY_PATH);
  const requests = evidence.network?.attempts?.flatMap((attempt) => attempt.requests) ?? [];
  const completedAttempt = evidence.network?.attempts?.at(-1);
  const criticalRows = matrix.entries.filter((entry) => CRITICAL_PATHS.includes(entry.path));
  const deferredRows = matrix.entries.filter(
    (entry) => entry.coverage_state === "V1_ADMIN_DEFERRED_FAIL_CLOSED",
  );
  const critical = registry.workstreams.find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  const requiredDigests = Object.fromEntries(
    Object.entries(REQUIRED_PROPERTIES).map(([table, properties]) => [
      table,
      sha256([...properties].sort().join("\n")),
    ]),
  );
  const identityMap = new Map(
    (evidence.source_identities ?? []).map((identity) => [identity.path, identity.sha256]),
  );
  const evidenceNames = evidence.environment?.variables?.map((entry) => entry.name) ?? [];

  return [
    schemaValid(evidence, schema, schema),
    evidenceText === canonicalJson(evidence),
    evidence.phase === "33NA-33NZ" &&
      evidence.baseline === BASELINE &&
      evidence.result === "PASSED_READ_ONLY_STAGING_DEPENDENCY_READINESS" &&
      evidence.next_authority ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION",
    /^[a-f0-9]{64}$/u.test(evidence.target?.project_ref_sha256 ?? "") &&
      /^[a-f0-9]{64}$/u.test(evidence.target?.origin_sha256 ?? "") &&
      evidence.target?.human_confirmed === true &&
      evidence.target?.origin_count === 1,
    evidence.environment?.ready === true &&
      evidence.environment?.required_count === 5 &&
      evidence.environment?.present_count === 5,
    exact(evidenceNames, ENVIRONMENT_VARIABLE_NAMES) &&
      evidence.environment.variables.every(
        (entry) => entry.present === true && typeof entry.length_bucket === "string",
      ),
    evidence.environment?.service_role_distinct_from_anon === true &&
      evidence.environment?.session_secret_distinct_from_password === true,
    exact(evidence.network?.methods, ["GET"]) &&
      exact(evidence.network?.request_paths, REQUEST_PATHS) &&
      evidence.network?.requests_per_attempt === 5 &&
      evidence.network?.maximum_attempts === 2 &&
      evidence.network?.maximum_requests === 10,
    evidence.network?.attempts_used === evidence.network?.attempts?.length &&
      evidence.network?.requests_made === requests.length &&
      requests.every((request, index) => request.request_ordinal === index + 1) &&
      evidence.network.attempts.every(
        (attempt, index) =>
          attempt.attempt_ordinal === index + 1 &&
          exact(
            attempt.requests.map((request) => request.path),
            REQUEST_PATHS.slice(0, attempt.requests.length),
          ),
      ),
    completedAttempt?.completed === true &&
      completedAttempt?.retry_reason === null &&
      completedAttempt?.requests.length === 5 &&
      completedAttempt.requests.every(
        (request) =>
          request.status >= 200 &&
          request.status < 300 &&
          request.status_category === "SUCCESS_2XX",
      ),
    requests.every(
      (request) =>
        request.response_bytes >= 0 &&
        request.response_bytes <= request.response_cap_bytes &&
        request.response_cap_bytes ===
          (request.request_id === "openapi" ? 5242880 : 131072),
    ),
    evidence.network?.timeout_ms === 10000 &&
      evidence.network?.redirect_policy === "MANUAL_DENY" &&
      evidence.network?.openapi_response_cap_bytes === 5242880 &&
      evidence.network?.other_response_cap_bytes === 131072 &&
      !requests.some((request) => request.status_category === "REDIRECT_3XX") &&
      evidence.network.attempts
        .slice(0, -1)
        .every(
          (attempt) =>
            attempt.completed === false &&
            ["REQUEST_NETWORK", "REQUEST_RETRYABLE_STATUS"].includes(
              attempt.retry_reason,
            ),
        ),
    evidence.openapi?.ready === true && evidence.openapi?.document_present === true,
    Object.keys(evidence.openapi?.tables ?? {}).length === 3 &&
      Object.entries(REQUIRED_PROPERTIES).every(
        ([table, properties]) =>
          evidence.openapi.tables[table]?.path_present === true &&
          evidence.openapi.tables[table]?.required_present === true &&
          evidence.openapi.tables[table]?.required_count === properties.length,
      ),
    Object.entries(requiredDigests).every(
      ([table, digest]) =>
        evidence.openapi.tables[table]?.required_property_set_sha256 === digest,
    ),
    Object.values(evidence.openapi?.tables ?? {}).every(
      (table) =>
        table.observed_count >= table.required_count &&
        /^[a-f0-9]{64}$/u.test(table.observed_property_set_sha256),
    ),
    evidence.openapi?.rpc?.path_present === true &&
      evidence.openapi?.rpc?.submission_id_input_present === true,
    exact(Object.keys(evidence.zero_row_probes ?? {}).sort(), [
      "admin_audit_logs",
      "submitted_tools",
      "tools",
    ]) &&
      Object.values(evidence.zero_row_probes).every(
        (probe) =>
          probe.status >= 200 &&
          probe.status < 300 &&
          probe.status_category === "SUCCESS_2XX" &&
          probe.zero_rows === true,
      ),
    evidence.storage_bucket?.ready === true &&
      evidence.storage_bucket?.bucket_name === "tool-logos" &&
      evidence.storage_bucket?.identity_ready === true &&
      evidence.storage_bucket?.public_ready === true &&
      evidence.storage_bucket?.file_size_limit_ready === true &&
      evidence.storage_bucket?.mime_types_ready === true,
    evidence.privacy_and_mutation?.environment_file_reads === 1 &&
      evidence.privacy_and_mutation?.environment_file_writes === 0 &&
      exact(evidence.privacy_and_mutation?.repository_write_paths, [EVIDENCE_PATH]) &&
      evidence.privacy_and_mutation?.repository_writes === 1 &&
      [
        "database_writes",
        "storage_writes",
        "storage_object_reads",
        "rpc_calls",
        "rows_retained",
        "raw_values",
        "secret_hashes",
        "browser_requests",
        "live_route_requests",
        "vercel_requests",
      ].every((key) => evidence.privacy_and_mutation?.[key] === 0),
    identityMap.size === 5 &&
      SOURCE_IDENTITY_PATHS.every(
        (identityPath) => identityMap.get(identityPath) === sha256(bytes(identityPath)),
      ),
    evidence.governance?.current_blockers === 7 &&
      evidence.governance?.deferred_routes === 21 &&
      evidence.governance?.public_launch_decision ===
        "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      evidence.governance?.execution_authorized === false &&
      criticalRows.length === 7 &&
      criticalRows.every(
        (entry) =>
          entry.coverage_state ===
            "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED" &&
          entry.launch_blocking === true &&
          entry.gap_code_or_null ===
            "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED",
      ) &&
      deferredRows.length === 21 &&
      critical?.state ===
        "STAGING_ENV_DATABASE_STORAGE_READINESS_COMPLETE_DEPLOYED_RUNTIME_REQUIRED" &&
      registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      registry.execution_authorized === false,
  ];
}

function mutationCandidates(evidence) {
  const mutate = (operation) => {
    const candidate = structuredClone(evidence);
    operation(candidate);
    return candidate;
  };
  return [
    mutate((value) => { value.phase = "33MA-33MZ"; }),
    mutate((value) => { value.baseline = "0".repeat(40); }),
    mutate((value) => { value.result = "FAILED"; }),
    mutate((value) => { value.next_authority = "PUBLIC_LAUNCH"; }),
    mutate((value) => { value.target.project_ref_sha256 = "not-a-digest"; }),
    mutate((value) => { value.target.human_confirmed = false; }),
    mutate((value) => { value.environment.present_count = 4; }),
    mutate((value) => { value.environment.variables[0].name = "UNKNOWN"; }),
    mutate((value) => { value.environment.ready = false; }),
    mutate((value) => { value.network.methods = ["POST"]; }),
    mutate((value) => { value.network.request_paths[0] = "/forbidden"; }),
    mutate((value) => { value.network.maximum_attempts = 3; }),
    mutate((value) => { value.network.maximum_requests = 11; }),
    mutate((value) => { value.network.redirect_policy = "follow"; }),
    mutate((value) => { value.network.timeout_ms = 0; }),
    mutate((value) => { value.network.attempts.at(-1).requests[0].method = "DELETE"; }),
    mutate((value) => { value.openapi.ready = false; }),
    mutate((value) => { value.zero_row_probes.tools.zero_rows = false; }),
    mutate((value) => { value.storage_bucket.public_ready = false; }),
    mutate((value) => { value.privacy_and_mutation.raw_values = 1; }),
  ];
}

try {
  const schema = json(SCHEMA_PATH);
  const preEvidence = preEvidenceAssertions(schema);
  assert.equal(preEvidence.length, 8);
  assert(preEvidence.every(Boolean));
  if (!existsSync(absolute(EVIDENCE_PATH))) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_STAGING_READINESS_EVIDENCE stage=LIVE_METADATA_EVIDENCE_REQUIRED assertions=30 pass=8 fail=22 internal_failures=0\n",
    );
    process.exit(1);
  }
  const evidenceText = source(EVIDENCE_PATH);
  const evidence = JSON.parse(evidenceText);
  const results = evidenceAssertions(evidence, evidenceText, schema);
  assert.equal(results.length, 22);
  if (!results.every(Boolean)) {
    const pass = 8 + results.filter(Boolean).length;
    process.stdout.write(
      `FAIL_ADMIN_V1_STAGING_READINESS_EVIDENCE assertions=30 pass=${pass} fail=${30 - pass} internal_failures=0\n`,
    );
    process.exit(1);
  }
  const mutations = mutationCandidates(evidence);
  assert.equal(mutations.length, 20);
  assert(
    mutations.every((candidate) => {
      const candidateText = canonicalJson(candidate);
      return !evidenceAssertions(candidate, candidateText, schema).every(Boolean);
    }),
  );
  process.stdout.write(
    "PASS_ADMIN_V1_STAGING_READINESS_EVIDENCE assertions=30 mutations=20 result=PASSED_READ_ONLY_STAGING_DEPENDENCY_READINESS target_bound=true environment=5/5 openapi=1 tables=3/3 rpc=1/1 zero_row_probes=3/3 storage_bucket=1/1 requests_max=10 writes=0 rows_retained=0 raw_values=0 current_blockers=7 next_authority=ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION failures=0 internal_failures=0\n",
  );
} catch {
  process.stdout.write(
    "FAIL_ADMIN_V1_STAGING_READINESS_EVIDENCE assertions=30 pass=0 fail=30 internal_failures=1\n",
  );
  process.exit(1);
}
