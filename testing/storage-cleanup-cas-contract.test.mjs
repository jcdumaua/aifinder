import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const FORWARD_PATH =
  "supabase/migrations/_drafts/20260813_storage_cleanup_cas_forward_candidate.sql";
const ROLLBACK_PATH =
  "supabase/migrations/_drafts/20260813_storage_cleanup_cas_rollback_candidate.sql";
const CORE_PATH = "testing/admin-v1-staging-runtime-core.mjs";
const ORCHESTRATOR_PATH =
  "testing/admin-v1-staging-runtime-orchestrator.mjs";
const SOURCE_POLICY_PATH =
  "testing/admin-v1-staging-runtime-source-policy.test.mjs";
const EVIDENCE_SCHEMA_PATH =
  "testing/admin-v1-staging-runtime-evidence.schema.json";
const EVIDENCE_PATH = "testing/admin-v1-staging-runtime-evidence.json";

function absolute(relativePath) {
  const candidate = path.resolve(process.cwd(), relativePath);
  if (!candidate.startsWith(`${process.cwd()}${path.sep}`)) {
    throw new Error("STORAGE_CAS_TEST_PATH");
  }
  return candidate;
}

function source(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(absolute(relativePath)),
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function throwsCode(operation, code) {
  try {
    operation();
    return false;
  } catch (caught) {
    return caught?.code === code || caught?.message === code;
  }
}

function firstExecutableSql(sql) {
  return sql
    .replace(/^\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/\s*)*/u, "")
    .trimStart();
}

function sqlWithoutComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/--[^\n]*/gu, "");
}

const coreSource = source(CORE_PATH);
const orchestratorSource = source(ORCHESTRATOR_PATH);
const evidenceSchemaSource = source(EVIDENCE_SCHEMA_PATH);
const evidenceSource = source(EVIDENCE_PATH);
const core = await import(`./${path.basename(CORE_PATH)}`);
const sourcePolicy = spawnSync(
  process.execPath,
  [absolute(SOURCE_POLICY_PATH)],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  },
);

const requiredModelExports = [
  "authorizeStorageCleanupDeleteClientRole",
  "authorizeStorageCleanupDeleteModel",
  "classifyStorageCleanupDeleteOutcome",
  "createStorageCleanupCapabilityToken",
  "reconcileStorageCleanupGrantPreparation",
  "validateStorageCleanupGrantBinding",
];

let serviceRoleDeleteRejected = false;
if (typeof core.authorizeStorageCleanupDeleteClientRole === "function") {
  serviceRoleDeleteRejected = throwsCode(
    () => core.authorizeStorageCleanupDeleteClientRole("service_role"),
    "STORAGE_CLEANUP_DELETE_CLIENT_ROLE",
  );
}

const requiredEvidenceFields = [
  "storage_cleanup_mode",
  "grant_id_present",
  "expected_version_present",
  "token_hash_present",
  "raw_token_persisted",
  "delete_client_role",
  "service_role_delete_used",
  "request_method",
  "storage_operation",
  "CAS_outcome",
  "replacement_preserved",
  "grant_revoked",
  "post_delete_absence",
];

const readiness = [
  {
    name: "FORWARD_AND_ROLLBACK_DRAFTS_ABSENT",
    pass: existsSync(absolute(FORWARD_PATH)) &&
      existsSync(absolute(ROLLBACK_PATH)),
  },
  {
    name: "SOURCE_POLICY_REPORTS_RUNTIME_RECOVERY_AMBIGUOUS_LOGO_CLEANUP",
    pass: sourcePolicy.status === 0,
  },
  {
    name: "EXPECTED_VERSION_CAPABILITY_MODEL_ABSENT",
    pass: requiredModelExports.every(
      (name) => typeof core[name] === "function",
    ),
  },
  {
    name: "SERVICE_ROLE_PATHNAME_DELETE_NOT_REJECTED",
    pass: serviceRoleDeleteRejected,
  },
  {
    name: "REPLACEMENT_PRESERVATION_SCENARIOS_ABSENT",
    pass:
      typeof core.classifyStorageCleanupDeleteOutcome === "function" &&
      orchestratorSource.includes(
        "SELF_TEST_STORAGE_CAS_REPLACEMENT_VERSION_PRESERVED",
      ) &&
      orchestratorSource.includes(
        "SELF_TEST_STORAGE_CAS_LOST_DELETE_REPLACEMENT_PRESERVED",
      ) &&
      orchestratorSource.includes(
        "SELF_TEST_STORAGE_CAS_SAME_VERSION_CONTENT_REPLACEMENT_PRESERVED",
      ),
  },
  {
    name: "EVIDENCE_SCHEMA_LACKS_STORAGE_CAS_FIELDS",
    pass: requiredEvidenceFields.every(
      (field) =>
        evidenceSchemaSource.includes(`\"${field}\"`) &&
        evidenceSource.includes(`\"${field}\"`),
    ),
  },
];

if (readiness.some((entry) => !entry.pass)) {
  const failed = readiness.filter((entry) => !entry.pass);
  process.stdout.write(
    `EXPECTED_FAIL_STORAGE_CLEANUP_CAS_CONTRACT assertions=${readiness.length} pass=${readiness.length - failed.length} fail=${failed.length} missing=${failed.map((entry) => entry.name).join(",")} stderr_bytes=${Buffer.byteLength(sourcePolicy.stderr ?? "", "utf8")} internal_failures=0\n`,
  );
  process.exit(1);
}

const forward = source(FORWARD_PATH);
const rollback = source(ROLLBACK_PATH);
const forwardSql = sqlWithoutComments(forward);
const rollbackSql = sqlWithoutComments(rollback);
const exactDeletePolicySql =
  /CREATE\s+POLICY\s+"AiFinder exact-version cleanup"\s+ON\s+storage\.objects[\s\S]*?;/iu.exec(
    forwardSql,
  )?.[0] ?? "";
const schema = JSON.parse(evidenceSchemaSource);
const evidence = JSON.parse(evidenceSource);
const results = [];
const check = (name, pass) => results.push({ name, pass: Boolean(pass) });
const uuid = "123e4567-e89b-42d3-a456-426614174000";
const otherUuid = "123e4567-e89b-42d3-b456-426614174001";
const objectName = `admin/${uuid}.png`;
const rawToken = "ab".repeat(32);
const tokenHash = sha256(rawToken);
const futureIso = "2026-08-13T20:15:00.000Z";
const grant = {
  phase_id: "34IA-34IZ",
  runtime_session_id: uuid,
  bucket_id: "tool-logos",
  object_name: objectName,
  grant_id: otherUuid,
  expected_version: "storage-version-1",
  token_hash: tokenHash,
  expires_at: futureIso,
};

check(
  "forward guard first",
  firstExecutableSql(forward).startsWith("DO $aifinder_draft_guard$") &&
    firstExecutableSql(forward).includes(
      "AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required",
    ),
);
check(
  "rollback guard first",
  firstExecutableSql(rollback).startsWith("DO $aifinder_draft_guard$") &&
    firstExecutableSql(rollback).includes(
      "AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required",
    ),
);
check(
  "exact schema and table",
  /CREATE\s+SCHEMA\s+aifinder_storage_private\s+AUTHORIZATION\s+postgres/iu.test(
    forwardSql,
  ) &&
    /CREATE\s+TABLE\s+aifinder_storage_private\.cleanup_grants/iu.test(
      forwardSql,
    ),
);
check(
  "exact functions",
  forwardSql.includes("public.aifinder_prepare_storage_cleanup_grant") &&
    forwardSql.includes("public.aifinder_revoke_storage_cleanup_grant") &&
    forwardSql.includes(
      "aifinder_storage_private.authorize_cleanup_delete",
    ),
);
check(
  "exact delete policy",
  /CREATE\s+POLICY\s+"AiFinder exact-version cleanup"\s+ON\s+storage\.objects\s+FOR\s+DELETE\s+TO\s+anon/iu.test(
    forwardSql,
  ),
);
check(
  "capability-bound delete visibility policy",
  /CREATE\s+POLICY\s+"AiFinder exact-version cleanup visibility"\s+ON\s+storage\.objects\s+FOR\s+SELECT\s+TO\s+anon\s+USING\s*\(\s*aifinder_storage_private\.authorize_cleanup_delete\(bucket_id,\s*name,\s*version\)\s*\)/iu.test(
    forwardSql,
  ) &&
    (forwardSql.match(/CREATE\s+POLICY\s+"AiFinder exact-version cleanup(?: restriction| visibility)?"/giu) ?? [])
      .length === 3,
);
check(
  "restrictive platform policy bridge",
  /CREATE\s+POLICY\s+"AiFinder exact-version cleanup restriction"\s+ON\s+storage\.objects\s+AS\s+RESTRICTIVE\s+FOR\s+DELETE\s+TO\s+anon\s+USING\s*\(\s*\(bucket_id\s*<>\s*'tool-logos'::text\)\s+OR\s+aifinder_storage_private\.authorize_cleanup_delete\(bucket_id,\s*name,\s*version\)\s*\)/iu.test(
    forwardSql,
  ) &&
    /ALTER\s+POLICY\s+"Deny direct public logo deletes"\s+ON\s+storage\.objects\s+TO\s+authenticated\s+USING\s*\(bucket_id\s*<>\s*'tool-logos'::text\)/iu.test(
      forwardSql,
    ) &&
    forwardSql.indexOf(
      'CREATE POLICY "AiFinder exact-version cleanup restriction"',
    ) <
      forwardSql.indexOf(
        'ALTER POLICY "Deny direct public logo deletes"',
      ) &&
    forwardSql.indexOf(
      'ALTER POLICY "Deny direct public logo deletes"',
    ) <
      forwardSql.indexOf('CREATE POLICY "AiFinder exact-version cleanup"'),
);
check(
  "platform preconditions",
  [
    "storage.objects",
    "relrowsecurity",
    "bucket_id",
    "name",
    "version",
    "metadata",
    "jsonb",
    "anon",
    "service_role",
    "has_schema_privilege",
    "has_table_privilege",
    "'SELECT'",
    "'DELETE'",
    "extensions.digest(bytea,text)",
    "polpermissive",
    "pg_has_role",
    "Deny direct public logo deletes",
    "ARRAY[v_anon_oid, v_authenticated_oid]::oid[]",
    "restrictive logo DELETE policy drifted",
    "restrictive anon or PUBLIC SELECT policy exists",
  ].every((value) => forwardSql.includes(value)),
);
check(
  "plpgsql size guard parse safe",
  /IF\s+p_expected_size\s+IS\s+NOT\s+NULL\s+AND\s+NOT\s*\(\s*CASE[\s\S]{0,400}?END\s*\)\s+THEN/iu.test(
    forwardSql,
  ) && !/AND\s+NOT\s+CASE/iu.test(forwardSql),
);
check(
  "catalog char values cast before concatenation",
  forwardSql.includes("'command=' || policy.polcmd::text") &&
    rollbackSql.includes("'command=' || policy.polcmd::text") &&
    rollbackSql.includes(
      "relation.relname || ':' || relation.relkind::text",
    ) &&
    rollbackSql.includes(
      "constraint_row.conname || ':' || constraint_row.contype::text",
    ),
);
check(
  "delete and all permissive policies rejected",
  (forwardSql.match(/policy\.polcmd\s+IN\s*\(\s*'d'\s*,\s*'\*'\s*\)/gu) ?? [])
    .length === 2 &&
    forwardSql.includes("AND policy.polpermissive") &&
    forwardSql.includes("AND NOT policy.polpermissive"),
);
check(
  "private privilege boundary",
  /REVOKE\s+ALL\s+ON\s+SCHEMA\s+aifinder_storage_private\s+FROM\s+PUBLIC,\s*anon,\s*authenticated/iu.test(
    forwardSql,
  ) &&
    /REVOKE\s+ALL\s+ON\s+TABLE\s+aifinder_storage_private\.cleanup_grants\s+FROM\s+PUBLIC,\s*anon,\s*authenticated/iu.test(
      forwardSql,
    ) &&
    !/GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|ALL)[\s\S]{0,120}cleanup_grants[\s\S]{0,80}anon/iu.test(
      forwardSql,
    ),
);
check(
  "service role rpc only",
  forwardSql.includes(
    "GRANT EXECUTE ON FUNCTION public.aifinder_prepare_storage_cleanup_grant",
  ) &&
    forwardSql.includes(
      "GRANT EXECUTE ON FUNCTION public.aifinder_revoke_storage_cleanup_grant",
    ) &&
    forwardSql.includes("TO service_role") &&
    forwardSql.includes("FROM PUBLIC, anon, authenticated"),
);
check(
  "validator exact request binding",
  forwardSql.includes("x-aifinder-storage-cleanup-token") &&
    forwardSql.includes("request.method") &&
    forwardSql.includes("storage.operation") &&
    forwardSql.includes("storage.object.delete_many") &&
    forwardSql.includes("extensions.digest") &&
    forwardSql.includes("p_object_version"),
);
check(
  "prepare exact mutation-time binding",
  forwardSql.includes("FOR UPDATE") &&
    forwardSql.includes("v_current_version") &&
    forwardSql.includes("tool-logos") &&
    forwardSql.includes("expected_etag") &&
    forwardSql.includes("expected_size") &&
    forwardSql.includes("expected_mime_type") &&
    /p_ttl_seconds\s+NOT\s+BETWEEN\s+60\s+AND\s+900/iu.test(
      forwardSql,
    ),
);
check(
  "one active exact path",
  forwardSql.includes("UNIQUE (bucket_id, object_name)") &&
    forwardSql.includes("STORAGE_CLEANUP_DUPLICATE_ACTIVE_GRANT") &&
    forwardSql.includes("v_existing.grant_id = p_grant_id") &&
    forwardSql.includes("v_existing.token_hash = p_token_hash") &&
    forwardSql.includes(
      "v_existing.expected_version = v_current_version",
    ) &&
    forwardSql.includes(
      "v_existing.expires_at = v_existing.created_at",
    ),
);
check(
  "forward prohibitions",
  !/DELETE\s+FROM\s+storage\.objects/iu.test(forwardSql) &&
    !/DROP\s+[\s\S]{0,80}\s+CASCADE/iu.test(forwardSql) &&
    !/GRANT\s+ALL/iu.test(forwardSql) &&
    !/\bOR\s+TRUE\b/iu.test(forwardSql),
);
check(
  "rollback nonempty rejection",
  rollbackSql.includes("STORAGE_CLEANUP_ROLLBACK_NONEMPTY_GRANT_TABLE") &&
    /EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+aifinder_storage_private\.cleanup_grants/iu.test(
      rollbackSql,
    ),
);
check(
  "rollback exact verification",
  rollbackSql.includes("pg_get_functiondef") &&
    rollbackSql.includes("pg_get_constraintdef") &&
    rollbackSql.includes("definition_sha256=") &&
    rollbackSql.includes("aclexplode") &&
    rollbackSql.includes("STORAGE_CLEANUP_ROLLBACK_ACL_DEFINITION_DRIFT") &&
    rollbackSql.includes("pg_get_expr") &&
    rollbackSql.includes("AiFinder exact-version cleanup") &&
    rollbackSql.includes("AiFinder exact-version cleanup restriction") &&
    rollbackSql.includes("AiFinder exact-version cleanup visibility") &&
    rollbackSql.includes("Deny direct public logo deletes") &&
    rollbackSql.includes(
      "STORAGE_CLEANUP_ROLLBACK_PLATFORM_RESTRICTION_POLICY_DRIFT",
    ) &&
    rollbackSql.includes("AIFINDER_STORAGE_CAS_V1"),
);
check(
  "rollback catalog compatibility",
  rollbackSql.includes("constraint_row.contype <> 'n'::\"char\"") &&
    rollbackSql.includes("pg_catalog.acldefault('r', v_postgres_oid)") &&
    !/cleanup_grants'::regclass\s*\)\s*<>\s*7/iu.test(rollbackSql),
);
check(
  "forward definition seals are rollback verified",
  forwardSql.includes("COMMENT ON CONSTRAINT") &&
    forwardSql.includes("pg_get_constraintdef") &&
    forwardSql.includes("pg_get_functiondef") &&
    forwardSql.includes("v_policy_signature") &&
    forwardSql.includes("definition_sha256=") &&
    rollbackSql.includes("STORAGE_CLEANUP_ROLLBACK_CONSTRAINT_SEAL_DRIFT") &&
    rollbackSql.includes("v_policy_signature"),
);
check(
  "rollback exact drops only",
  rollbackSql.includes(
    'DROP POLICY "AiFinder exact-version cleanup restriction" ON storage.objects',
  ) &&
    rollbackSql.includes(
    'DROP POLICY "AiFinder exact-version cleanup" ON storage.objects',
  ) &&
    rollbackSql.includes(
      'DROP POLICY "AiFinder exact-version cleanup visibility" ON storage.objects',
    ) &&
    rollbackSql.includes(
      "DROP FUNCTION public.aifinder_prepare_storage_cleanup_grant",
    ) &&
    rollbackSql.includes(
      "DROP FUNCTION public.aifinder_revoke_storage_cleanup_grant",
    ) &&
    rollbackSql.includes(
      "DROP FUNCTION aifinder_storage_private.authorize_cleanup_delete",
    ) &&
    rollbackSql.includes(
      "DROP TABLE aifinder_storage_private.cleanup_grants",
    ) &&
    rollbackSql.includes("DROP SCHEMA aifinder_storage_private") &&
    /ALTER\s+POLICY\s+"Deny direct public logo deletes"\s+ON\s+storage\.objects\s+TO\s+anon,\s*authenticated\s+USING\s*\(bucket_id\s*<>\s*'tool-logos'::text\)/iu.test(
      rollbackSql,
    ) &&
    rollbackSql.indexOf(
      'ALTER POLICY "Deny direct public logo deletes"',
    ) <
      rollbackSql.indexOf(
        'DROP POLICY "AiFinder exact-version cleanup restriction"',
      ) &&
    !/\bCASCADE\b/iu.test(rollbackSql),
);
check(
  "direct storage sql delete rejected",
  !/^\s*DELETE\s+FROM\s+storage\.objects\b/imu.test(forwardSql) &&
    !/^\s*DELETE\s+FROM\s+storage\.objects\b/imu.test(rollbackSql),
);
check(
  "broad anon policy rejected",
  exactDeletePolicySql.length > 0 &&
    !/\bOR\b/iu.test(exactDeletePolicySql) &&
    !/bucket_id\s*=\s*['"]?\*/iu.test(forwardSql) &&
    !/\bOR\s+TRUE\b/iu.test(forwardSql) &&
    forwardSql.includes(
      "aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)",
    ),
);

const capability = core.createStorageCleanupCapabilityToken(
  () => Buffer.alloc(32, 0xab),
);
check(
  "32 random bytes become raw hex plus hash",
  capability.raw_token === rawToken &&
    capability.raw_token.length === 64 &&
    capability.token_hash === tokenHash &&
    capability.token_hash !== capability.raw_token,
);
check(
  "wrong random byte length rejected",
  throwsCode(
    () =>
      core.createStorageCleanupCapabilityToken(() => Buffer.alloc(31, 0xab)),
    "STORAGE_CLEANUP_TOKEN_BYTES",
  ),
);
check(
  "grant binding accepted",
  JSON.stringify(core.validateStorageCleanupGrantBinding(grant)) ===
    JSON.stringify(grant),
);
check(
  "grant expiry normalized without widening identity",
  core.validateStorageCleanupGrantBinding({
    ...grant,
    expires_at: "2026-08-13T13:15:00-07:00",
  }).expires_at === futureIso,
);
check(
  "raw token persistence rejected",
  throwsCode(
    () =>
      core.validateStorageCleanupGrantBinding({
        ...grant,
        raw_token: rawToken,
      }),
    "STORAGE_CLEANUP_GRANT_BINDING_SHAPE",
  ),
);
check(
  "service role conditional delete rejected",
  throwsCode(
    () => core.authorizeStorageCleanupDeleteClientRole("service_role"),
    "STORAGE_CLEANUP_DELETE_CLIENT_ROLE",
  ) && core.authorizeStorageCleanupDeleteClientRole("anon") === "anon",
);

const deleteModel = (overrides = {}) =>
  core.authorizeStorageCleanupDeleteModel({
    active_grant_count: 1,
    bucket_id: "tool-logos",
    current_version: "storage-version-1",
    expected_version: "storage-version-1",
    expires_at_epoch_ms: 200_000,
    now_epoch_ms: 100_000,
    object_name: objectName,
    raw_token: rawToken,
    request_method: "DELETE",
    storage_operation: "storage.object.delete_many",
    token_hash: tokenHash,
    ...overrides,
  });
check("valid delete model authorized", deleteModel() === true);
check("wrong bucket denied", deleteModel({ bucket_id: "other" }) === false);
check("wrong path denied", deleteModel({ object_name: `public/${uuid}.png` }) === false);
check("malformed UUID path denied", deleteModel({ object_name: "admin/not-a-uuid.png" }) === false);
check("wrong token denied", deleteModel({ raw_token: "cd".repeat(32) }) === false);
check("expired grant denied", deleteModel({ now_epoch_ms: 200_000 }) === false);
check("wrong current version denied", deleteModel({ current_version: "storage-version-2" }) === false);
check("wrong request method denied", deleteModel({ request_method: "POST" }) === false);
check(
  "wrong storage operation denied",
  deleteModel({ storage_operation: "storage.object.delete" }) === false,
);
check(
  "duplicate active grant rejected",
  throwsCode(
    () =>
      core.reconcileStorageCleanupGrantPreparation({
        conflicting_active_grants: 1,
        grant,
        matching_active_grants: 0,
        response_state: "LOST",
      }),
    "STORAGE_CLEANUP_DUPLICATE_ACTIVE_GRANT",
  ),
);
const reconciledGrant = core.reconcileStorageCleanupGrantPreparation({
  conflicting_active_grants: 0,
  grant,
  matching_active_grants: 1,
  response_state: "LOST",
});
check(
  "lost grant create reconciled exactly",
  reconciledGrant.state === "RECONCILED_EXACT" &&
    reconciledGrant.grant.grant_id === otherUuid &&
    reconciledGrant.grant.expected_version === "storage-version-1",
);

const authorized = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "SUCCESS",
  expected_version: "storage-version-1",
  grant_revoked: true,
  observed_version: null,
  post_delete_absence: true,
});
check(
  "authorized absence classified",
  authorized.CAS_outcome === "AUTHORIZED" &&
    authorized.post_delete_absence === true &&
    authorized.grant_revoked === true &&
    authorized.retry_permitted === false,
);
const mismatch = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "FORBIDDEN",
  expected_version: "storage-version-1",
  grant_revoked: true,
  observed_version: "storage-version-2",
  post_delete_absence: false,
});
check(
  "replacement version preserved",
  mismatch.CAS_outcome === "VERSION_MISMATCH" &&
    mismatch.replacement_preserved === true &&
    mismatch.retry_permitted === false,
);
const expired = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "EXPIRED",
  expected_version: "storage-version-1",
  grant_revoked: true,
  observed_version: "storage-version-1",
  post_delete_absence: false,
});
check("expired outcome classified", expired.CAS_outcome === "EXPIRED");
const denied = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "FORBIDDEN",
  expected_version: "storage-version-1",
  grant_revoked: true,
  observed_version: "storage-version-1",
  post_delete_absence: false,
});
check("denied outcome classified", denied.CAS_outcome === "DENIED");
const lostReplacement = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "LOST",
  expected_version: "storage-version-1",
  grant_revoked: true,
  observed_version: "storage-version-2",
  post_delete_absence: false,
});
check(
  "lost delete preserves replacement",
  lostReplacement.CAS_outcome === "VERSION_MISMATCH" &&
    lostReplacement.replacement_preserved === true &&
    lostReplacement.retry_permitted === false,
);
const lostSameVersion = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "LOST",
  expected_version: "storage-version-1",
  grant_revoked: false,
  observed_version: "storage-version-1",
  post_delete_absence: false,
});
check(
  "lost delete retries only exact same version grant",
  lostSameVersion.CAS_outcome === "AMBIGUOUS" &&
    lostSameVersion.replacement_preserved === "not_applicable" &&
    lostSameVersion.retry_permitted === true,
);
const definiteErrorSameVersion = core.classifyStorageCleanupDeleteOutcome({
  delete_response: "ERROR",
  expected_version: "storage-version-1",
  grant_revoked: false,
  observed_version: "storage-version-1",
  post_delete_absence: false,
});
check(
  "definite client error never retries",
  definiteErrorSameVersion.CAS_outcome === "AMBIGUOUS" &&
    definiteErrorSameVersion.retry_permitted === false,
);
let recoveredAbsenceWithoutDeleteProof = null;
try {
  recoveredAbsenceWithoutDeleteProof =
    core.classifyStorageCleanupDeleteOutcome({
      delete_response: "NOT_OBSERVED",
      expected_version: "storage-version-1",
      grant_revoked: true,
      observed_version: null,
      post_delete_absence: true,
    });
} catch {
  recoveredAbsenceWithoutDeleteProof = null;
}
check(
  "grant only recovered absence remains ambiguous",
  recoveredAbsenceWithoutDeleteProof?.CAS_outcome === "AMBIGUOUS" &&
    recoveredAbsenceWithoutDeleteProof.post_delete_absence === true &&
    recoveredAbsenceWithoutDeleteProof.grant_revoked === true &&
    recoveredAbsenceWithoutDeleteProof.retry_permitted === false,
);
check(
  "contradictory absence and observed version rejected",
  throwsCode(
    () =>
      core.classifyStorageCleanupDeleteOutcome({
        delete_response: "LOST",
        expected_version: "storage-version-1",
        grant_revoked: true,
        observed_version: "storage-version-2",
        post_delete_absence: true,
      }),
    "STORAGE_CLEANUP_DELETE_OUTCOME_INPUT",
  ),
);

const exactCleanupFunction = /async function cleanupDelta20ExactStorage\([\s\S]*?\n\}\n\nfunction finalizeDelta20ExactCleanupRuntime/u.exec(
  orchestratorSource,
)?.[0] ?? "";
const recoveryPersistenceFunction = /function persistDelta20RuntimePublicationRecovery\([\s\S]*?\n\}\n\nfunction readDelta20RuntimePublicationRecovery/u.exec(
  orchestratorSource,
)?.[0] ?? "";
const officialRuntimeFunction = /async function executeDelta18DurableProjectionFinalRuntime\([\s\S]*?\n\}\n\nasync function repairDelta20QualificationPublicationFromRetainedJournal/u.exec(
  orchestratorSource,
)?.[0] ?? "";
const runtimePublicationRepairFunction = /async function repairDelta20RuntimePublicationFromRetainedJournal\([\s\S]*?\n\}\n\nasync function executeDelta15FixtureQualifiedFinalRuntime/u.exec(
  orchestratorSource,
)?.[0] ?? "";
check(
  "harness prepares and revokes exact service rpc",
  orchestratorSource.includes(
    '.rpc("aifinder_prepare_storage_cleanup_grant"',
  ) &&
    orchestratorSource.includes(
      "reconcileStorageCleanupGrantPreparation({",
    ) &&
    orchestratorSource.includes(
      '.rpc("aifinder_revoke_storage_cleanup_grant"',
    ) &&
    orchestratorSource.includes(
      '!exactRpcPaths.has(requestUrl.pathname) || method !== "POST"',
    ) &&
    orchestratorSource.includes(
      'result && !result.error && result.data === true',
    ) &&
    forwardSql.includes("remaining.grant_id = p_grant_id") &&
    forwardSql.includes("remaining.token_hash = p_token_hash"),
);
check(
  "harness blocks grant only recovered absence",
  exactCleanupFunction.includes('delete_response: "NOT_OBSERVED"') &&
    orchestratorSource.includes(
      "SELF_TEST_STORAGE_CAS_RECOVERED_ABSENCE_AMBIGUOUS",
    ),
);
check(
  "harness anon delete custom header",
  orchestratorSource.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    orchestratorSource.includes("x-aifinder-storage-cleanup-token") &&
    orchestratorSource.includes("authorizeStorageCleanupDeleteClientRole(\"anon\")"),
);
check(
  "expected version comes from exact Storage info",
  orchestratorSource.includes("async function readExactStorageObjectInfo(") &&
    orchestratorSource.includes(".info(storagePath)") &&
    orchestratorSource.includes("info.bucketId !== LOGO_STORAGE_BUCKET") &&
    orchestratorSource.includes("expectedVersion: info.version") &&
    orchestratorSource.includes(
      'code: "DELTA20_POSTSTATE_STORAGE_INFO"',
    ) &&
    !orchestratorSource.includes("objectVersions.set(name, row.version)"),
);
check(
  "exact cleanup has no service role pathname remove",
    !exactCleanupFunction.includes("direct.client.storage") &&
    !exactCleanupFunction.includes("service_role") &&
    exactCleanupFunction.includes("direct.storageCleanup") &&
    orchestratorSource.includes(
      'requestUrl.pathname.startsWith("/storage/v1/object/")',
    ) &&
    orchestratorSource.includes(
      'if (storageDeleteRequest) {\n        fail("STORAGE_CLEANUP_DELETE_CLIENT_ROLE");',
    ),
);
check(
  "locator binds grant id expected version token hash",
  orchestratorSource.includes("grant_id: binding.grant_id") &&
    orchestratorSource.includes(
      "expected_version: binding.expected_version",
    ) &&
    orchestratorSource.includes("token_hash: binding.token_hash") &&
    !orchestratorSource.includes("raw_token: grantBinding.raw_token"),
);
check(
  "publication recovery permits one pending to final locator transition",
  recoveryPersistenceFunction.includes(
    "pending_locator_sha256: pendingLocatorSha256",
  ) &&
    recoveryPersistenceFunction.includes(
      "prior.external_cleanup_verified === false",
    ) &&
    recoveryPersistenceFunction.includes(
      "prior.locator_sha256 !== locatorSha256",
    ) &&
    recoveryPersistenceFunction.includes(
      "externalCleanupVerified || pendingLocatorSha256 !== locatorSha256",
    ),
);
check(
  "pending and complete receipts bind pre and post CAS locators",
  officialRuntimeFunction.includes(
    "pendingRecovery.pending_locator_sha256 !==\n        runtimePendingPublication.locator_sha256",
  ) &&
    officialRuntimeFunction.includes(
      '"DELTA20_RUNTIME_FINAL_STORAGE_CAS_LOCATOR"',
    ) &&
    officialRuntimeFunction.includes(
      "pendingLocatorSha256: pendingRecovery.pending_locator_sha256",
    ) &&
    runtimePublicationRepairFunction.includes(
      "const pendingPublication = pendingPublicationReceiptPresent",
    ) &&
    runtimePublicationRepairFunction.includes(
      "const cleanupPublication = cleanupPublicationReceiptPresent",
    ) &&
    runtimePublicationRepairFunction.includes(
      "pendingLocatorSha256: recovery.pending_locator_sha256",
    ),
);
check(
  "publication recovery fixture binds distinct pending CAS locator",
  orchestratorSource.includes(
    '"pending_evidence",\n    "pending_evidence_sha256",\n    "pending_locator_sha256",',
  ) &&
    orchestratorSource.includes("pending_locator_sha256: digestA,") &&
    orchestratorSource.includes("locator_sha256: digestB,"),
);
check(
  "source policy green",
  sourcePolicy.status === 0 &&
    /PASS_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY/u.test(
      sourcePolicy.stdout ?? "",
    ),
);
check(
  "evidence top level storage cleanup",
  schema.required.includes("storage_cleanup") &&
    Object.hasOwn(schema.properties, "storage_cleanup") &&
    Object.hasOwn(evidence, "storage_cleanup"),
);
check(
  "evidence exact CAS fields",
  requiredEvidenceFields.every(
    (field) =>
      schema.properties.storage_cleanup.required.includes(field) &&
      Object.hasOwn(evidence.storage_cleanup, field),
  ),
);
check(
  "evidence secret safety",
  evidence.storage_cleanup.raw_token_persisted === false &&
    evidence.storage_cleanup.delete_client_role === "anon" &&
    evidence.storage_cleanup.service_role_delete_used === false &&
    !Object.keys(evidence.storage_cleanup).some((key) =>
      /(?:raw_token|jwt|service_role_key|anon_key|hostname)/u.test(key) &&
      key !== "raw_token_persisted"
    ),
);

const failed = results.filter((entry) => !entry.pass);
if (failed.length !== 0) {
  process.stdout.write(
    `FAIL_STORAGE_CLEANUP_CAS_CONTRACT assertions=${results.length} pass=${results.length - failed.length} fail=${failed.length} failed=${failed.map((entry) => entry.name.replaceAll(" ", "_")).join(",")} internal_failures=0\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `PASS_STORAGE_CLEANUP_CAS_CONTRACT assertions=${results.length} negative_cases=34 sql_execution=0 network=0 database=0 runtime_requests=0 raw_token_persisted=0 service_role_delete_used=0 failures=0 internal_failures=0\n`,
);
