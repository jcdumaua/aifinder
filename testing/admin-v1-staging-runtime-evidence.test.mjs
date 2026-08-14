import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  createRuntimePlan,
  validatePredecessorRatification,
} from "./admin-v1-staging-runtime-core.mjs";

const SCHEMA_PATH =
  "testing/admin-v1-staging-runtime-evidence.schema.json";
const EVIDENCE_PATH = "testing/admin-v1-staging-runtime-evidence.json";
const MATRIX_PATH = "testing/readiness-coverage-matrix.json";
const REGISTRY_PATH = "testing/public-launch-blocker-registry.json";
const SCHEMA_ONLY = process.argv.length === 3 && process.argv[2] === "--schema-only";
const PUBLICATION_ONLY =
  process.argv.length === 3 && process.argv[2] === "--publication-only";
const REVIEW_MODE = process.argv.length === 3
  ? process.argv[2]
  : null;
const REVIEW_MODES = Object.freeze([
  "--review-projection-safety",
  "--review-lifecycle-cleanup",
  "--review-governance-scope",
]);
const EXACT_ENVIRONMENT_NAMES = Object.freeze([
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const EXACT_AUDIT_ACTIONS = Object.freeze([
  "tool_added",
  "tool_updated",
  "tool_deleted",
  "submission_updated",
  "submission_rejected",
  "submission_approved",
  "logo_uploaded",
  "admin_logout",
]);
const V1_PRE_RUNTIME_STATE =
  "V1_ADMIN_STAGING_ENV_DATABASE_STORAGE_READINESS_INTEGRATED_DEPLOYED_RUNTIME_REQUIRED";
const V1_RUNTIME_COMPLETE_STATE =
  "V1_ADMIN_STAGING_AUTHENTICATED_RUNTIME_VALIDATED";
const V1_RUNTIME_GAP =
  "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_EVIDENCE_REQUIRED";

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
  if (rule === true) return true;
  if (rule === false) return false;
  if (!rule || typeof rule !== "object") return false;
  if (
    Array.isArray(rule.oneOf) &&
    rule.oneOf.filter((candidate) => schemaValid(value, candidate, root))
      .length !== 1
  ) {
    return false;
  }
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
    const prefixItems = Array.isArray(rule.prefixItems)
      ? rule.prefixItems
      : [];
    for (
      let index = 0;
      index < Math.min(value.length, prefixItems.length);
      index += 1
    ) {
      if (!schemaValid(value[index], prefixItems[index], root)) return false;
    }
    const remaining = value.slice(prefixItems.length);
    if (remaining.length > 0 && Object.hasOwn(rule, "items")) {
      if (rule.items === false) return false;
      if (!remaining.every((item) => schemaValid(item, rule.items, root))) {
        return false;
      }
    } else if (
      prefixItems.length === 0 &&
      Object.hasOwn(rule, "items") &&
      !value.every((item) => schemaValid(item, rule.items, root))
    ) {
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
    ) {
      return false;
    }
    for (const [key, childRule] of Object.entries(properties)) {
      if (Object.hasOwn(value, key) && !schemaValid(value[key], childRule, root)) {
        return false;
      }
    }
  }
  return true;
}

function schemaTupleKeywordSelfTest(schema, evidence) {
  const reordered = structuredClone(evidence);
  [reordered.environment.names[0], reordered.environment.names[1]] = [
    reordered.environment.names[1],
    reordered.environment.names[0],
  ];
  const extended = structuredClone(evidence);
  extended.environment.names.push("UNAUTHORIZED_ENVIRONMENT_NAME");
  return (
    schemaValid(evidence, schema, schema) &&
    !schemaValid(reordered, schema, schema) &&
    !schemaValid(extended, schema, schema) &&
    schemaValid([], { type: "array", items: false }, schema) &&
    !schemaValid(["unexpected"], { type: "array", items: false }, schema)
  );
}

function schemaObjectsAreClosed(node) {
  if (!node || typeof node !== "object") return true;
  if (node.type === "object" && node.additionalProperties !== false) return false;
  return Object.values(node).every(schemaObjectsAreClosed);
}

function catches(operation) {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
}

function exactArray(actual, expected) {
  return Array.isArray(actual) && exact(actual, expected);
}

function evidenceContainsSecretMaterial(evidence) {
  const serialized = JSON.stringify(evidence);
  return (
    /https?:\/\/[^" ]+\.vercel\.app/iu.test(serialized) ||
    /(?:authorization|set-cookie)\s*:/iu.test(serialized) ||
    /(?:bearer\s+|eyJ[A-Za-z0-9_-]{12,}|admin_session=|admin_csrf=)/u.test(
      serialized,
    ) ||
    /"(?:password_value|cookie_value|csrf_token|raw_body|raw_headers|deployment_url|deployment_hostname)"/u.test(
      serialized,
    )
  );
}

function storageCleanupMatchesLifecycle(evidence) {
  const cleanup = evidence.storage_cleanup;
  if (!cleanup || typeof cleanup !== "object" || Array.isArray(cleanup)) {
    return false;
  }
  const common =
    cleanup.storage_cleanup_mode ===
      "RLS_EXPECTED_VERSION_CAPABILITY" &&
    cleanup.raw_token_persisted === false &&
    cleanup.delete_client_role === "anon" &&
    cleanup.service_role_delete_used === false &&
    cleanup.request_method === "DELETE" &&
    cleanup.storage_operation === "storage.object.delete_many" &&
    cleanup.grant_id_present === cleanup.token_hash_present;
  if (!common) return false;
  if (
    [
      "PRE_RUNTIME",
      "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
      "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
    ].includes(evidence.lifecycle)
  ) {
    return (
      cleanup.grant_id_present === false &&
      cleanup.expected_version_present === false &&
      cleanup.token_hash_present === false &&
      cleanup.CAS_outcome === "AMBIGUOUS" &&
      cleanup.replacement_preserved === "not_applicable" &&
      cleanup.grant_revoked === false &&
      cleanup.post_delete_absence === false
    );
  }
  if (
    [
      "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING",
    ].includes(evidence.lifecycle)
  ) {
    return (
      cleanup.expected_version_present === true &&
      cleanup.grant_id_present === false &&
      cleanup.token_hash_present === false &&
      cleanup.CAS_outcome === "AMBIGUOUS" &&
      cleanup.replacement_preserved === "not_applicable" &&
      cleanup.grant_revoked === false &&
      cleanup.post_delete_absence === false
    );
  }
  return (
    evidence.lifecycle === "RUNTIME_COMPLETE" &&
    cleanup.grant_id_present === true &&
    cleanup.expected_version_present === true &&
    cleanup.token_hash_present === true &&
    cleanup.CAS_outcome === "AUTHORIZED" &&
    cleanup.replacement_preserved === false &&
    cleanup.grant_revoked === true &&
    cleanup.post_delete_absence === true
  );
}

function governanceMatchesLifecycle(evidence) {
  const plan = createRuntimePlan();
  const matrix = json(MATRIX_PATH);
  const registry = json(REGISTRY_PATH);
  const paths = [...new Set(
    plan.requests
      .filter(
        (request) =>
          !new Set([
            "METHOD_GATE_ALLOW_HEADER",
            "DEFERRED_ROUTE_FAIL_CLOSED",
            "EXTENSION_SUFFIX_FAIL_CLOSED",
          ]).has(request.contract),
      )
      .map((request) => `app${request.path}/route.ts`),
  )].sort();
  const entries = (matrix.entries ?? []).filter((entry) =>
    paths.includes(entry.path),
  );
  const post = evidence.lifecycle === "RUNTIME_COMPLETE";
  const matrixMatches =
    entries.length === 7 &&
    entries.map((entry) => entry.path).sort().every(
      (entryPath, index) => entryPath === paths[index],
    ) &&
    entries.every((entry) =>
      post
        ? entry.coverage_state === V1_RUNTIME_COMPLETE_STATE &&
          entry.launch_blocking === false &&
          entry.gap_code_or_null === null &&
          entry.static_evidence_paths.includes(EVIDENCE_PATH)
        : entry.coverage_state === V1_PRE_RUNTIME_STATE &&
          entry.launch_blocking === true &&
          entry.gap_code_or_null === V1_RUNTIME_GAP &&
          !entry.static_evidence_paths.includes(EVIDENCE_PATH),
    );
  const workstream = (registry.workstreams ?? []).find(
    (entry) => entry.id === "AUTHENTICATED_ADMIN_V1_LAUNCH_CRITICAL",
  );
  const registryMatches = post
    ? registry.source_matrix?.launch_blocking_count === 0 &&
      registry.overall_decision ===
        "NO_GO_PENDING_LEGAL_COMPLIANCE_AND_FINAL_LAUNCH_AUTHORITY" &&
      workstream?.gap_code === null &&
      workstream?.authority_class === "ADMIN_V1_STAGING_RUNTIME_COMPLETE" &&
      workstream?.state === "STAGING_AUTHENTICATED_RUNTIME_EVIDENCE_COMPLETE" &&
      workstream?.next_gate === "LEGAL_COMPLIANCE_POLICY_DESIGN"
    : registry.source_matrix?.launch_blocking_count === 7 &&
      registry.overall_decision === "NO_GO_PENDING_SEPARATE_AUTHORITIES" &&
      workstream?.gap_code === V1_RUNTIME_GAP &&
      workstream?.authority_class ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME" &&
      workstream?.state ===
        "STAGING_ENV_DATABASE_STORAGE_READINESS_COMPLETE_DEPLOYED_RUNTIME_REQUIRED" &&
      workstream?.next_gate ===
        "ADMIN_V1_STAGING_DEPLOYMENT_AND_AUTHENTICATED_RUNTIME_VALIDATION";
  return (
    matrixMatches &&
    registryMatches &&
    evidence.governance.state === (post ? "RUNTIME_COMPLETE" : "PRE_RUNTIME") &&
    evidence.governance.blockers_after === (post ? 0 : 7) &&
    evidence.governance.runtime_validated_rows === (post ? 7 : 0)
  );
}

function protectedAccessMatchesLifecycle(evidence) {
  const access = evidence.protected_access;
  if (!access || typeof access !== "object" || Array.isArray(access)) {
    return false;
  }
  if (evidence.lifecycle === "PRE_RUNTIME") {
    return (
      access.state === "PENDING" &&
      access.access_mode === "PENDING" &&
      access.credential_lifecycle_contract === "PENDING" &&
      access.credential_active_after_cleanup === false &&
      access.credential_cleanup_complete === false &&
      access.project_bypass_prestate === null &&
      access.project_bypass_restored === false &&
      access.project_oidc_token_generations === 0 &&
      access.protection_access_handshake_gets === 0 &&
      access.temporary_bypass_cycles === 0 &&
      access.header_qualification_application_requests === 0 &&
      access.official_application_requests === 0 &&
      access.raw_credential_material_persisted === 0
    );
  }
  const lifecycleByMode = new Map([
    ["SELF_PROJECT_OIDC", "DELTA12_OIDC_EPHEMERAL_V1"],
    [
      "TEMPORARY_AUTOMATION_BYPASS",
      "DELTA12_TEMPORARY_AUTOMATION_BYPASS_V1",
    ],
  ]);
  const qualification = [
    "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
    "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
  ].includes(evidence.lifecycle);
  const runtime = [
    "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING",
    "RUNTIME_COMPLETE",
  ].includes(evidence.lifecycle);
  const credentialActiveAtPublication =
    qualification ||
    evidence.lifecycle === "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING";
  return (
    (qualification || runtime) &&
    access.state === "PASS" &&
    lifecycleByMode.get(access.access_mode) ===
      access.credential_lifecycle_contract &&
    access.credential_active_after_cleanup ===
      credentialActiveAtPublication &&
    access.credential_cleanup_complete ===
      !credentialActiveAtPublication &&
    access.project_bypass_restored === !credentialActiveAtPublication &&
    Number.isInteger(access.project_oidc_token_generations) &&
    access.project_oidc_token_generations >=
      (access.access_mode === "SELF_PROJECT_OIDC"
        ? qualification ? 1 : 2
        : 1) &&
    access.project_oidc_token_generations <= 4 &&
    Number.isInteger(access.protection_access_handshake_gets) &&
    access.protection_access_handshake_gets >= 0 &&
    access.protection_access_handshake_gets <= 6 &&
    Number.isInteger(access.header_qualification_application_requests) &&
      access.header_qualification_application_requests >= 1 &&
    access.header_qualification_application_requests <= 20 &&
    access.official_application_requests === (runtime ? 20 : 0) &&
    access.raw_credential_material_persisted === 0 &&
    (access.access_mode === "SELF_PROJECT_OIDC"
      ? access.project_bypass_prestate === null &&
        access.temporary_bypass_cycles >= 0 &&
        access.temporary_bypass_cycles <= 3
      : access.project_bypass_prestate !== null &&
        access.temporary_bypass_cycles >= 1 &&
        access.temporary_bypass_cycles <= 3)
  );
}

function branchJournalFixtureEntry(state, attempt, clientExitClass) {
  const observed = clientExitClass ?? "ZERO_UNCERTAIN";
  const definitions = {
    INITIAL_REF_ABSENT: ["CREATE", 0, "NOT_SENT", "ABSENT", false, false, true],
    CREATE_REQUESTED: ["CREATE", 1, "NOT_SENT", "NOT_READ", true, false, false],
    CREATE_RESULT_OBSERVED: ["CREATE", 1, observed, "NOT_READ", true, false, false],
    CREATE_REF_ABSENT: ["CREATE", 1, observed, "ABSENT", true, false, false],
    CREATE_REF_OURS: ["CREATE", 1, observed, "OURS", true, false, false],
    CREATE_CONFIRMED: ["CREATE", 1, observed, "OURS", true, false, true],
    DELETE_REQUESTED: ["DELETE", attempt, "NOT_SENT", "NOT_READ", true, false, false],
    DELETE_RESULT_OBSERVED: ["DELETE", attempt, observed, "NOT_READ", true, false, false],
    DELETE_REF_ABSENT: ["DELETE", attempt, observed, "ABSENT", false, false, false],
    DELETE_REF_OURS: ["DELETE", attempt, observed, "OURS", true, attempt === 1, false],
    DELETE_RETRY_REQUESTED: ["DELETE", 1, observed, "OURS", true, true, false],
    DELETE_CONFIRMED: ["DELETE", attempt, "NOT_OBSERVED", "ABSENT", false, false, false],
  };
  const [
    operation,
    exactAttempt,
    exactClientExitClass,
    exactRefState,
    externalMutationPossible,
    retryPermitted,
    liveMayContinue,
  ] = definitions[state] ?? [];
  assert(operation);
  return {
    attempt: exactAttempt,
    client_exit_class: exactClientExitClass,
    exact_ref_state: exactRefState,
    external_mutation_possible: externalMutationPossible,
    live_may_continue: liveMayContinue,
    operation,
    retry_permitted: retryPermitted,
    sequence: 0,
    state,
  };
}

function successfulBranchJournal({
  createAbsent = false,
  retry = false,
  deleteAbsentBeforeRetry = false,
} = {}) {
  const createClient = "NONZERO_UNCERTAIN";
  const firstDeleteClient = "ZERO_UNCERTAIN";
  const secondDeleteClient = "SPAWN_ERROR";
  const entries = [
    branchJournalFixtureEntry("INITIAL_REF_ABSENT", 0),
    branchJournalFixtureEntry("CREATE_REQUESTED", 1),
    branchJournalFixtureEntry("CREATE_RESULT_OBSERVED", 1, createClient),
  ];
  if (createAbsent) {
    entries.push(
      branchJournalFixtureEntry("CREATE_REF_ABSENT", 1, createClient),
    );
  }
  entries.push(
    branchJournalFixtureEntry("CREATE_REF_OURS", 1, createClient),
    branchJournalFixtureEntry("CREATE_CONFIRMED", 1, createClient),
    branchJournalFixtureEntry("DELETE_REQUESTED", 1),
    branchJournalFixtureEntry(
      "DELETE_RESULT_OBSERVED",
      1,
      firstDeleteClient,
    ),
  );
  let finalAttempt = 1;
  let finalClient = firstDeleteClient;
  if (retry) {
    if (deleteAbsentBeforeRetry) {
      entries.push(
        branchJournalFixtureEntry(
          "DELETE_REF_ABSENT",
          1,
          firstDeleteClient,
        ),
      );
    }
    entries.push(
      branchJournalFixtureEntry("DELETE_REF_OURS", 1, firstDeleteClient),
      branchJournalFixtureEntry(
        "DELETE_RETRY_REQUESTED",
        1,
        firstDeleteClient,
      ),
      branchJournalFixtureEntry("DELETE_REQUESTED", 2),
      branchJournalFixtureEntry(
        "DELETE_RESULT_OBSERVED",
        2,
        secondDeleteClient,
      ),
    );
    finalAttempt = 2;
    finalClient = secondDeleteClient;
  }
  entries.push(
    branchJournalFixtureEntry("DELETE_REF_ABSENT", finalAttempt, finalClient),
    branchJournalFixtureEntry("DELETE_REF_ABSENT", finalAttempt, finalClient),
  );
  for (let finalRead = 0; finalRead < 2; finalRead += 1) {
    entries.push({
      ...branchJournalFixtureEntry(
        "DELETE_REF_ABSENT",
        finalAttempt,
        "NOT_OBSERVED",
      ),
      client_exit_class: "NOT_OBSERVED",
    });
  }
  entries.push(branchJournalFixtureEntry("DELETE_CONFIRMED", finalAttempt));
  return entries.map((entry, index) => ({ ...entry, sequence: index + 1 }));
}

function branchTransactionJournalValidatorSelfTest() {
  const shapes = [
    { options: {}, length: 12, pushes: 1 },
    { options: { createAbsent: true }, length: 13, pushes: 1 },
    { options: { retry: true }, length: 16, pushes: 2 },
    {
      options: { retry: true, deleteAbsentBeforeRetry: true },
      length: 17,
      pushes: 2,
    },
    {
      options: {
        createAbsent: true,
        retry: true,
        deleteAbsentBeforeRetry: true,
      },
      length: 18,
      pushes: 2,
    },
  ];
  const valid = shapes.every(({ options, length, pushes }) => {
    const branch_transaction_journal = successfulBranchJournal(options);
    return (
      branch_transaction_journal.length === length &&
      branchTransactionJournalValid({
        lifecycle: "RUNTIME_COMPLETE",
        preview: {
          branch_absence_checks: 0,
          branch_transaction_journal,
          branch_transaction_mode: "LIVE_TRANSACTION",
          resume_state: null,
          temporary_branch_delete_pushes: pushes,
        },
      })
    );
  });
  const inconsistentRef = successfulBranchJournal();
  inconsistentRef.find((entry) => entry.state === "CREATE_REF_OURS")
    .exact_ref_state = "OTHER";
  const invalidTransition = successfulBranchJournal();
  invalidTransition.find((entry) => entry.state === "CREATE_CONFIRMED").state =
    "CREATE_REF_OURS";
  const inconsistentField = successfulBranchJournal();
  inconsistentField.at(-1).live_may_continue = true;
  const invalid = [inconsistentRef, invalidTransition, inconsistentField].every(
    (branch_transaction_journal) =>
      !branchTransactionJournalValid({
        lifecycle: "RUNTIME_COMPLETE",
        preview: {
          branch_absence_checks: 0,
          branch_transaction_journal,
          branch_transaction_mode: "LIVE_TRANSACTION",
          resume_state: null,
          temporary_branch_delete_pushes: 1,
        },
      }),
  );
  const resumed = branchTransactionJournalValid({
    lifecycle: "RUNTIME_COMPLETE",
    preview: {
      branch_absence_checks: 2,
      branch_transaction_journal: [],
      branch_transaction_mode: "EXISTING_PREVIEW_RESUME",
      resume_state: "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME",
      temporary_branch_delete_pushes: 0,
    },
  });
  const invalidResume = [
    { branch_absence_checks: 1 },
    { branch_transaction_journal: successfulBranchJournal() },
    { resume_state: null },
    { temporary_branch_delete_pushes: 1 },
  ].every(
    (mutation) =>
      !branchTransactionJournalValid({
        lifecycle: "RUNTIME_COMPLETE",
        preview: {
          branch_absence_checks: 2,
          branch_transaction_journal: [],
          branch_transaction_mode: "EXISTING_PREVIEW_RESUME",
          resume_state: "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME",
          temporary_branch_delete_pushes: 0,
          ...mutation,
        },
      }),
  );
  return valid && invalid && resumed && invalidResume;
}

const BRANCH_TRANSACTION_JOURNAL_KEYS = Object.freeze([
  "attempt",
  "client_exit_class",
  "exact_ref_state",
  "external_mutation_possible",
  "live_may_continue",
  "operation",
  "retry_permitted",
  "sequence",
  "state",
]);
const OBSERVED_BRANCH_CLIENT_EXIT_CLASSES = new Set([
  "ZERO_EXACT",
  "ZERO_UNCERTAIN",
  "NONZERO_UNCERTAIN",
  "SPAWN_ERROR",
]);
const BRANCH_TRANSACTION_TRANSITIONS = Object.freeze({
  INITIAL_REF_ABSENT: Object.freeze(["CREATE_REQUESTED"]),
  CREATE_REQUESTED: Object.freeze(["CREATE_RESULT_OBSERVED"]),
  CREATE_RESULT_OBSERVED: Object.freeze([
    "CREATE_REF_ABSENT",
    "CREATE_REF_OURS",
    "CREATE_REF_OTHER",
    "CLEANUP_FAILED",
  ]),
  CREATE_REF_ABSENT: Object.freeze([
    "CREATE_REF_ABSENT",
    "CREATE_REF_OURS",
    "CREATE_REF_OTHER",
    "CLEANUP_FAILED",
  ]),
  CREATE_REF_OURS: Object.freeze(["CREATE_CONFIRMED"]),
  CREATE_REF_OTHER: Object.freeze(["CONFLICT_STOP"]),
  CREATE_CONFIRMED: Object.freeze(["DELETE_REQUESTED"]),
  DELETE_REQUESTED: Object.freeze(["DELETE_RESULT_OBSERVED"]),
  DELETE_RESULT_OBSERVED: Object.freeze([
    "DELETE_REF_ABSENT",
    "DELETE_REF_OURS",
    "DELETE_REF_OTHER",
    "CLEANUP_FAILED",
  ]),
  DELETE_REF_ABSENT: Object.freeze([
    "DELETE_REF_ABSENT",
    "DELETE_REF_OURS",
    "DELETE_REF_OTHER",
    "DELETE_CONFIRMED",
    "CLEANUP_FAILED",
  ]),
  DELETE_REF_OURS: Object.freeze([
    "DELETE_RETRY_REQUESTED",
    "CLEANUP_FAILED",
  ]),
  DELETE_REF_OTHER: Object.freeze(["CONFLICT_STOP"]),
  DELETE_RETRY_REQUESTED: Object.freeze(["DELETE_REQUESTED"]),
  DELETE_CONFIRMED: Object.freeze([]),
  CONFLICT_STOP: Object.freeze([]),
  CLEANUP_FAILED: Object.freeze([]),
});

function branchJournalEntryMatches(entry, expected) {
  return (
    entry &&
    typeof entry === "object" &&
    !Array.isArray(entry) &&
    exact(
      Object.keys(entry).sort(),
      [...BRANCH_TRANSACTION_JOURNAL_KEYS].sort(),
    ) &&
    Object.entries(expected).every(([key, value]) => entry[key] === value)
  );
}

function branchTransactionJournalValid(evidence) {
  const journal = evidence.preview.branch_transaction_journal;
  if (evidence.lifecycle === "PRE_RUNTIME") return exact(journal, []);
  if (
    evidence.lifecycle === "RUNTIME_COMPLETE" &&
    evidence.preview.branch_transaction_mode ===
      "EXISTING_PREVIEW_RESUME"
  ) {
    return (
      exact(journal, []) &&
      evidence.preview.branch_absence_checks === 2 &&
      evidence.preview.resume_state ===
        "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME" &&
      evidence.preview.temporary_branch_delete_pushes === 0
    );
  }
  if (
    evidence.lifecycle !== "RUNTIME_COMPLETE" ||
    evidence.preview.branch_transaction_mode !== "LIVE_TRANSACTION" ||
    !Array.isArray(journal) ||
    journal.length < 12 ||
    journal.length > 18 ||
    journal.some((entry, index) => {
      const previousState = journal[index - 1]?.state ?? null;
      return (
        entry.sequence !== index + 1 ||
        ["CONFLICT_STOP", "CLEANUP_FAILED"].includes(entry.state) ||
        (previousState === null
          ? entry.state !== "INITIAL_REF_ABSENT"
          : !BRANCH_TRANSACTION_TRANSITIONS[previousState]?.includes(
              entry.state,
            ))
      );
    })
  ) {
    return false;
  }
  let index = 0;
  const take = (state, expected) => {
    const entry = journal[index];
    if (!branchJournalEntryMatches(entry, { ...expected, state })) return null;
    index += 1;
    return entry;
  };
  if (
    !take("INITIAL_REF_ABSENT", {
      attempt: 0,
      client_exit_class: "NOT_SENT",
      exact_ref_state: "ABSENT",
      external_mutation_possible: false,
      live_may_continue: true,
      operation: "CREATE",
      retry_permitted: false,
    }) ||
    !take("CREATE_REQUESTED", {
      attempt: 1,
      client_exit_class: "NOT_SENT",
      exact_ref_state: "NOT_READ",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "CREATE",
      retry_permitted: false,
    })
  ) {
    return false;
  }
  const createResult = journal[index];
  if (
    !OBSERVED_BRANCH_CLIENT_EXIT_CLASSES.has(
      createResult?.client_exit_class,
    ) ||
    !take("CREATE_RESULT_OBSERVED", {
      attempt: 1,
      client_exit_class: createResult.client_exit_class,
      exact_ref_state: "NOT_READ",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "CREATE",
      retry_permitted: false,
    })
  ) {
    return false;
  }
  const createClientExitClass = createResult.client_exit_class;
  if (
    journal[index]?.state === "CREATE_REF_ABSENT" &&
    !take("CREATE_REF_ABSENT", {
      attempt: 1,
      client_exit_class: createClientExitClass,
      exact_ref_state: "ABSENT",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "CREATE",
      retry_permitted: false,
    })
  ) {
    return false;
  }
  if (
    !take("CREATE_REF_OURS", {
      attempt: 1,
      client_exit_class: createClientExitClass,
      exact_ref_state: "OURS",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "CREATE",
      retry_permitted: false,
    }) ||
    !take("CREATE_CONFIRMED", {
      attempt: 1,
      client_exit_class: createClientExitClass,
      exact_ref_state: "OURS",
      external_mutation_possible: true,
      live_may_continue: true,
      operation: "CREATE",
      retry_permitted: false,
    }) ||
    !take("DELETE_REQUESTED", {
      attempt: 1,
      client_exit_class: "NOT_SENT",
      exact_ref_state: "NOT_READ",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "DELETE",
      retry_permitted: false,
    })
  ) {
    return false;
  }
  const firstDeleteResult = journal[index];
  if (
    !OBSERVED_BRANCH_CLIENT_EXIT_CLASSES.has(
      firstDeleteResult?.client_exit_class,
    ) ||
    !take("DELETE_RESULT_OBSERVED", {
      attempt: 1,
      client_exit_class: firstDeleteResult.client_exit_class,
      exact_ref_state: "NOT_READ",
      external_mutation_possible: true,
      live_may_continue: false,
      operation: "DELETE",
      retry_permitted: false,
    })
  ) {
    return false;
  }
  const firstDeleteClientExitClass = firstDeleteResult.client_exit_class;
  let retry = false;
  if (journal[index]?.state === "DELETE_REF_ABSENT") {
    if (
      !take("DELETE_REF_ABSENT", {
        attempt: 1,
        client_exit_class: firstDeleteClientExitClass,
        exact_ref_state: "ABSENT",
        external_mutation_possible: false,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: false,
      })
    ) {
      return false;
    }
    retry = journal[index]?.state === "DELETE_REF_OURS";
    if (
      !retry &&
      !take("DELETE_REF_ABSENT", {
        attempt: 1,
        client_exit_class: firstDeleteClientExitClass,
        exact_ref_state: "ABSENT",
        external_mutation_possible: false,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: false,
      })
    ) {
      return false;
    }
  } else {
    retry = journal[index]?.state === "DELETE_REF_OURS";
  }
  let finalAttempt = 1;
  let finalObservedClientExitClass = firstDeleteClientExitClass;
  if (retry) {
    if (
      !take("DELETE_REF_OURS", {
        attempt: 1,
        client_exit_class: firstDeleteClientExitClass,
        exact_ref_state: "OURS",
        external_mutation_possible: true,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: true,
      }) ||
      !take("DELETE_RETRY_REQUESTED", {
        attempt: 1,
        client_exit_class: firstDeleteClientExitClass,
        exact_ref_state: "OURS",
        external_mutation_possible: true,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: true,
      }) ||
      !take("DELETE_REQUESTED", {
        attempt: 2,
        client_exit_class: "NOT_SENT",
        exact_ref_state: "NOT_READ",
        external_mutation_possible: true,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: false,
      })
    ) {
      return false;
    }
    const secondDeleteResult = journal[index];
    if (
      !OBSERVED_BRANCH_CLIENT_EXIT_CLASSES.has(
        secondDeleteResult?.client_exit_class,
      ) ||
      !take("DELETE_RESULT_OBSERVED", {
        attempt: 2,
        client_exit_class: secondDeleteResult.client_exit_class,
        exact_ref_state: "NOT_READ",
        external_mutation_possible: true,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: false,
      })
    ) {
      return false;
    }
    finalAttempt = 2;
    finalObservedClientExitClass = secondDeleteResult.client_exit_class;
    for (let absenceRead = 0; absenceRead < 2; absenceRead += 1) {
      if (
        !take("DELETE_REF_ABSENT", {
          attempt: 2,
          client_exit_class: finalObservedClientExitClass,
          exact_ref_state: "ABSENT",
          external_mutation_possible: false,
          live_may_continue: false,
          operation: "DELETE",
          retry_permitted: false,
        })
      ) {
        return false;
      }
    }
  }
  for (let finalRead = 0; finalRead < 2; finalRead += 1) {
    if (
      !take("DELETE_REF_ABSENT", {
        attempt: finalAttempt,
        client_exit_class: "NOT_OBSERVED",
        exact_ref_state: "ABSENT",
        external_mutation_possible: false,
        live_may_continue: false,
        operation: "DELETE",
        retry_permitted: false,
      })
    ) {
      return false;
    }
  }
  return Boolean(
    take("DELETE_CONFIRMED", {
      attempt: finalAttempt,
      client_exit_class: "NOT_OBSERVED",
      exact_ref_state: "ABSENT",
      external_mutation_possible: false,
      live_may_continue: false,
      operation: "DELETE",
      retry_permitted: false,
    }) &&
      index === journal.length &&
      evidence.preview.temporary_branch_delete_pushes === finalAttempt,
  );
}

function publicationLifecycleValid(evidence) {
  const publication = evidence.publication;
  if (!publication || typeof publication !== "object") return false;
  const empty = (lane) =>
    lane.request_count === 0 &&
    lane.projection_complete === false &&
    lane.cleanup_complete === false &&
    lane.journal_retained === false &&
    lane.cleanup_locators_retained === false;
  const pending = (lane, requestCount) =>
    lane.request_count === requestCount &&
    lane.projection_complete === true &&
    lane.cleanup_complete === false &&
    lane.journal_retained === true &&
    lane.cleanup_locators_retained === true;
  const complete = (lane, requestCount) =>
    lane.request_count === requestCount &&
    lane.projection_complete === true &&
    lane.cleanup_complete === true &&
    lane.journal_retained === true &&
    lane.cleanup_locators_retained === true;
  if (publication.lifecycle === "PRE_RUNTIME") {
    return empty(publication.qualification) && empty(publication.runtime);
  }
  if (
    publication.lifecycle ===
    "QUALIFICATION_COMPLETE_CLEANUP_PENDING"
  ) {
    return pending(publication.qualification, 6) && empty(publication.runtime);
  }
  if (
    publication.lifecycle ===
    "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE"
  ) {
    return complete(publication.qualification, 6) && empty(publication.runtime);
  }
  if (
    publication.lifecycle ===
    "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING"
  ) {
    return complete(publication.qualification, 6) &&
      pending(publication.runtime, 20);
  }
  return publication.lifecycle === "RUNTIME_COMPLETE" &&
    complete(publication.qualification, 6) &&
    complete(publication.runtime, 20);
}

function staticAssertions(schema, evidence, evidenceText) {
  const plan = createRuntimePlan();
  return [
    schema.$schema === "https://json-schema.org/draft/2020-12/schema" &&
      schema.$id ===
        "https://aifinder.local/schemas/admin-v1-staging-runtime-evidence.schema.json" &&
      schema.properties.preview.properties.deployments_created.maximum === 8 &&
      schema.properties.preview.properties.deployments_remaining.maximum === 8,
    schemaObjectsAreClosed(schema) &&
      branchTransactionJournalValidatorSelfTest() &&
      schemaTupleKeywordSelfTest(schema, evidence),
    schemaValid(evidence, schema, schema),
    evidenceText === canonicalJson(evidence),
    evidence.schema_version === 1 && evidence.phase === "34IA-34IZ",
      evidence.authorization.gemini_exact_approval_confirmed === true &&
      evidence.authorization.approval_token_persisted === false &&
      evidence.authorization.confirmation_count ===
        (evidence.authorization.dynamic_target_confirmation ? 2 : 1),
    !catches(() => validatePredecessorRatification(evidence.predecessor)),
    ([
      "PRE_RUNTIME",
      "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
      "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
    ].includes(evidence.lifecycle)
      ? evidence.target.deployment_target_sha256 === plan.target_sha256
      : /^[a-f0-9]{64}$/u.test(
          evidence.target.deployment_target_sha256 ?? "",
        ) && evidence.target.deployment_target_sha256 !== plan.target_sha256) &&
      evidence.target.baseline_commit === plan.baseline &&
      evidence.target.branch === plan.branch &&
      evidence.target.marker_path === plan.marker_path &&
      evidence.target.marker_sha256 === plan.marker.sha256 &&
      evidence.target.marker_bytes === plan.marker.bytes &&
      evidence.target.marker_lf === plan.marker.lf &&
      evidence.target.marker_cr === 0 &&
      evidence.target.marker_trailing_lf === true,
    evidence.runtime.runtime_routes === 7 &&
      evidence.runtime.runtime_methods === 13 &&
      ([
        "PRE_RUNTIME",
        "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
        "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
      ].includes(evidence.lifecycle)
        ? evidence.runtime.persisted_state_oracle_sha256 === null &&
          evidence.runtime.poststate_projection_sha256 === null &&
          evidence.runtime.projection_sufficiency === "PENDING" &&
          evidence.runtime.projection_sufficiency_matrix_sha256 === null &&
          evidence.runtime.durable_projection_complete === false &&
          evidence.runtime.durable_projection_journal_sha256 === null &&
          evidence.runtime.durable_projection_validated_requests === 0
        : evidence.runtime.projection_sufficiency === "COMPLETE" &&
          evidence.runtime.durable_projection_complete === true &&
          /^[a-f0-9]{64}$/u.test(
            evidence.runtime.durable_projection_journal_sha256 ?? "",
          ) &&
          evidence.runtime.durable_projection_validated_requests === 20) &&
      plan.requests.length === 20 &&
      exactArray(evidence.environment.names, EXACT_ENVIRONMENT_NAMES) &&
      evidence.environment.pulls === 0 &&
      evidence.environment.environment_value_reads === 0 &&
      (evidence.lifecycle === "PRE_RUNTIME"
        ? evidence.environment.temporary_branch_overrides_created === 0 &&
          evidence.environment.temporary_branch_overrides_remaining === 0 &&
          evidence.environment.temporary_branch_override_absence_checks === 0 &&
          evidence.environment.global_preview_metadata_restored === false
        : [
            "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
            "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
          ].includes(evidence.lifecycle)
          ? evidence.environment.temporary_branch_overrides_created === 2 &&
            evidence.environment.temporary_branch_overrides_remaining === 2 &&
            evidence.environment.temporary_branch_override_absence_checks === 0 &&
            evidence.environment.global_preview_metadata_restored === false
        : evidence.environment.temporary_branch_overrides_created === 2 &&
          evidence.environment.temporary_branch_overrides_remaining === 0 &&
          evidence.environment.temporary_branch_override_absence_checks === 2 &&
          evidence.environment.global_preview_metadata_restored === true),
    evidence.governance.manifest === "165/5/20/49/91" &&
      evidence.governance.runner_children === 22 &&
      evidence.governance.compiler_children === 3 &&
      evidence.governance.matrix_entries === 69 &&
      evidence.governance.deferred_rows === 21 &&
      governanceMatchesLifecycle(evidence),
    evidence.repository.create_paths === 6 &&
      Number.isInteger(evidence.repository.modify_paths) &&
      evidence.repository.modify_paths >= 12 &&
      evidence.repository.modify_paths <= 18 &&
      evidence.repository.application_source_changed === false &&
      evidence.repository.phase_compiler_modified === false &&
      publicationLifecycleValid(evidence) &&
      evidence.next.public_launch === "NO_GO" &&
      evidence.next.next_authority ===
        "LEGAL_COMPLIANCE_POLICY_DESIGN_AND_FINAL_LAUNCH_READINESS_CONSOLIDATION" &&
      Object.values(evidence.safety).every((value) => value === 0) &&
      !evidenceContainsSecretMaterial(evidence) &&
      protectedAccessMatchesLifecycle(evidence) &&
      storageCleanupMatchesLifecycle(evidence),
  ];
}

function schemaOnlyAssertions(schema, evidence, evidenceText) {
  const plan = createRuntimePlan();
  return [
    schema.$schema === "https://json-schema.org/draft/2020-12/schema",
    schema.$id ===
      "https://aifinder.local/schemas/admin-v1-staging-runtime-evidence.schema.json",
    schemaObjectsAreClosed(schema) &&
      schemaTupleKeywordSelfTest(schema, evidence),
    schemaValid(evidence, schema, schema),
    evidenceText === canonicalJson(evidence),
    evidence.schema_version === 1 && evidence.phase === "34IA-34IZ",
    evidence.target.baseline_commit === plan.baseline &&
      evidence.target.branch === plan.branch &&
      evidence.target.marker_sha256 === plan.marker.sha256,
    evidence.authorization.gemini_exact_approval_confirmed === true &&
      evidence.authorization.approval_token_persisted === false,
    publicationLifecycleValid(evidence),
    Object.values(evidence.safety).every((value) => value === 0),
    !evidenceContainsSecretMaterial(evidence) &&
      storageCleanupMatchesLifecycle(evidence),
  ];
}

function liveAssertions(evidence) {
  const post = evidence.lifecycle === "RUNTIME_COMPLETE";
  const resumed =
    evidence.preview.branch_transaction_mode ===
    "EXISTING_PREVIEW_RESUME";
  const plan = createRuntimePlan();
  const ledger = evidence.runtime.request_ledger;
  const exactLedger =
    ledger.length === plan.requests.length &&
    ledger.every((record, index) => {
      const expected = plan.requests[index];
      return (
        record.ordinal === expected.ordinal &&
        record.method === expected.method &&
        record.path === expected.path &&
        record.status === expected.status &&
        record.contract === expected.contract
      );
    });
  const ledgerSafe = ledger.every(
    (record) =>
      record.security_headers === "PASS" &&
      record.raw_body_persisted === false &&
      record.raw_headers_persisted === false &&
      record.raw_url_persisted === false,
  );
  return [
    post && protectedAccessMatchesLifecycle(evidence),
    post && evidence.result === "PASSED_ADMIN_V1_STAGING_AUTHENTICATED_RUNTIME_CLOSURE",
    post && evidence.authorization.dynamic_target_confirmation === true && evidence.authorization.confirmation_count === 2,
    post &&
      evidence.preview.state === "COMPLETE" &&
      evidence.preview.marker_preworktree_proof === true &&
      branchTransactionJournalValid(evidence),
    post && evidence.preview.temporary_worktrees_created === 0,
    post && evidence.preview.temporary_commits_created === 2,
    post && evidence.preview.temporary_marker_files_created === 1,
    post &&
      evidence.preview.temporary_branch_create_pushes === 2 &&
      evidence.preview.temporary_branch_create_pushes ===
        evidence.preview.temporary_commits_created,
    post &&
      evidence.preview.deployments_created === 8 &&
      evidence.preview.temporary_commits_created === 2,
    post && evidence.preview.rest_v13_identity === "PASS",
    post && /^dpl_[A-Za-z0-9]+$/u.test(evidence.preview.deployment_id ?? ""),
    post && evidence.preview.deployment_state_file_mode_0600 === true,
    post && evidence.environment.state === "PASS" && evidence.environment.pulls === 0,
    post && exactArray(evidence.environment.names, EXACT_ENVIRONMENT_NAMES),
    post && evidence.environment.metadata_names_present === 5 && evidence.environment.local_names_present === 4,
    post && evidence.environment.sensitive_nonreadable_names === 5 && evidence.environment.metadata_requests === 2,
    post && ["ABSENT", "EFFECTIVE"].includes(
      evidence.environment.optional_supabase_url_state,
    ),
    post && evidence.environment.admin_password_runtime_proof === "PASS" && evidence.environment.admin_session_secret_runtime_proof === "PASS",
    post &&
      evidence.environment.raw_values_persisted === 0 &&
      evidence.environment.secret_hashes_persisted === 0 &&
      evidence.environment.temporary_branch_overrides_created === 2 &&
      evidence.environment.temporary_branch_overrides_remaining === 0 &&
      evidence.environment.temporary_branch_override_absence_checks === 2 &&
      evidence.environment.global_preview_metadata_restored === true,
    post && evidence.runtime.state === "PASS" && evidence.runtime.runtime_sessions === 1,
    post &&
      evidence.runtime.application_requests === 20 &&
      /^[a-f0-9]{64}$/u.test(
        evidence.runtime.request8_input_sha256 ?? "",
      ) &&
      evidence.runtime.request8_has_terminal_slash === false &&
      evidence.runtime.request8_is_invalid_tld === true &&
      /^[a-f0-9]{64}$/u.test(
        evidence.runtime.request9_expected_stored_sha256 ?? "",
      ) &&
      evidence.runtime.request9_expected_has_terminal_slash === true &&
      evidence.runtime.request9_unique_match_count === 1 &&
      evidence.runtime.request9_positive_tool_id === true &&
      evidence.runtime.canonical_relationship ===
        "APPLICATION_URL_TOSTRING_ROOT" &&
      evidence.runtime.input_and_stored_hashes_differ === true &&
      evidence.runtime.request8_input_sha256 !==
        evidence.runtime.request9_expected_stored_sha256 &&
      /^[a-f0-9]{64}$/u.test(
        evidence.runtime.persisted_state_oracle_sha256 ?? "",
      ) &&
      /^[a-f0-9]{64}$/u.test(
        evidence.runtime.poststate_projection_sha256 ?? "",
      ) &&
      evidence.runtime.projection_sufficiency === "COMPLETE" &&
      /^[a-f0-9]{64}$/u.test(
        evidence.runtime.projection_sufficiency_matrix_sha256 ?? "",
      ) &&
      Array.isArray(
        evidence.runtime.sanitized_projection_revalidation_events,
      ) &&
      evidence.runtime.sanitized_projection_revalidation_events.length <= 1,
    post && ledger.length === 20,
    post && ledger.every((record, index) => record.ordinal === index + 1),
    post && exactLedger,
    post && evidence.runtime.security_headers_passed === 20 && ledgerSafe,
    post && evidence.runtime.session_cookie_contract === "PASS",
    post && evidence.runtime.csrf_contract === "PASS",
    post && evidence.runtime.fixture_binding === "3_OF_3",
    post && evidence.runtime.logout_contract === "PASS",
    post && evidence.fixture.state === "PASS" && /^[a-f0-9]{64}$/u.test(evidence.fixture.run_marker_sha256 ?? ""),
    post && evidence.fixture.route_created_tools === 1,
    post && evidence.fixture.approved_submission_tools === 1,
    post && evidence.fixture.submitted_tool_fixtures === 3,
    post && exactArray(evidence.fixture.audit_actions, EXACT_AUDIT_ACTIONS),
    post && evidence.fixture.logo_objects === 1,
    post && /^[a-f0-9]{64}$/u.test(evidence.fixture.logo_payload_sha256 ?? ""),
    post && Number.isInteger(evidence.fixture.logo_payload_bytes) && evidence.fixture.logo_payload_bytes > 0 && evidence.fixture.logo_payload_bytes <= 5242880,
    post && evidence.fixture.direct_rpc_executions === 0 && evidence.fixture.route_rpc_executions === 1,
    post && evidence.fixture.direct_data_success_requests === 14,
    post &&
      evidence.fixture.direct_data_total_requests >= 13 &&
      evidence.fixture.direct_data_total_requests <= 26 &&
      evidence.fixture.fixture_setup_retries >= 0 &&
      evidence.fixture.fixture_setup_retries <= 2,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.synthetic_tools_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.synthetic_submissions_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.synthetic_audit_rows_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.synthetic_storage_objects_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.preview_deployments_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.temporary_branches_remaining === 0,
    post && evidence.cleanup.state === "COMPLETE" && evidence.cleanup.temporary_worktrees_remaining === 0 && evidence.cleanup.temporary_secret_files_remaining === 0,
    post &&
      evidence.preview.owner_cleanup_fallbacks === 0 &&
      (resumed
        ? evidence.preview.delete_contract ===
            ([3, 4, 5].includes(evidence.preview.deployments_created)
              ? "REST_V13_DELETE_BY_ID_POSTSTATE_PASS"
              : "VERCEL_CLI_REMOVE_EXACT_POSTSTATE_PASS") &&
          evidence.preview.branch_absence_checks === 2 &&
          evidence.preview.resume_state ===
            "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME" &&
          evidence.preview.temporary_branch_delete_pushes === 0
        : evidence.preview.delete_contract ===
            (evidence.preview.deployments_created === 8
              ? "VERCEL_CLI_REMOVE_EXACT_POSTSTATE_PASS"
              : "REST_V13_DELETE_BY_ID_POSTSTATE_PASS") &&
          evidence.preview.branch_absence_checks === 0 &&
          evidence.preview.resume_state === null &&
          [1, 2].includes(
            evidence.preview.temporary_branch_delete_pushes,
          )) &&
      evidence.preview.absence_checks === 2 &&
      evidence.preview.deployments_remaining === 0 &&
      evidence.preview.temporary_worktrees_removed === 0,
    post && evidence.cleanup.evidence_generated_after_cleanup === true && evidence.governance.state === "RUNTIME_COMPLETE" && evidence.governance.blockers_before === 7 && evidence.governance.blockers_after === 0 && evidence.governance.runtime_validated_rows === 7 && storageCleanupMatchesLifecycle(evidence),
  ];
}

function allSemanticAssertions(schema, evidence, evidenceText = canonicalJson(evidence)) {
  return [
    ...staticAssertions(schema, evidence, evidenceText),
    ...liveAssertions(evidence),
  ];
}

function projectionSafetyReview(schema, evidence, evidenceText) {
  const runtimePublished = [
    "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING",
    "RUNTIME_COMPLETE",
  ].includes(evidence.lifecycle);
  return [
    schemaValid(evidence, schema, schema),
    evidenceText === canonicalJson(evidence),
    !evidenceContainsSecretMaterial(evidence),
    Object.values(evidence.safety).every((value) => value === 0),
    protectedAccessMatchesLifecycle(evidence),
    publicationLifecycleValid(evidence),
    runtimePublished
      ? evidence.runtime.durable_projection_complete === true &&
        evidence.runtime.durable_projection_validated_requests === 20 &&
        /^[a-f0-9]{64}$/u.test(
          evidence.runtime.durable_projection_journal_sha256 ?? "",
        )
      : evidence.runtime.durable_projection_complete === false &&
        evidence.runtime.durable_projection_validated_requests === 0 &&
        evidence.runtime.durable_projection_journal_sha256 === null,
    runtimePublished
      ? evidence.runtime.request_ledger.length === 20 &&
        evidence.runtime.request_ledger.every(
          (entry, index) => entry.ordinal === index + 1,
        )
      : evidence.runtime.request_ledger.length === 0,
    evidence.protected_access.raw_credential_material_persisted === 0 &&
      evidence.environment.raw_values_persisted === 0 &&
      evidence.environment.secret_hashes_persisted === 0,
    evidence.target.marker_bytes === 475 &&
      evidence.target.marker_lf === 10 &&
      evidence.target.marker_trailing_lf === true,
  ];
}

function lifecycleCleanupReview(evidence) {
  const qualification = [
    "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
    "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
  ].includes(evidence.lifecycle);
  const runtimePending =
    evidence.lifecycle === "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING";
  const runtimeComplete = evidence.lifecycle === "RUNTIME_COMPLETE";
  const qualificationCleanupComplete =
    evidence.lifecycle === "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE";
  return [
    qualification || runtimePending || runtimeComplete,
    evidence.authorization.confirmation_count ===
      (qualification ? 1 : 2),
    publicationLifecycleValid(evidence),
    qualification
      ? evidence.cleanup.synthetic_audit_rows_remaining ===
          (qualificationCleanupComplete ? 0 : 1)
      : runtimePending
        ? evidence.cleanup.synthetic_audit_rows_remaining === 8
        : evidence.cleanup.synthetic_audit_rows_remaining === 0,
    evidence.preview.deployments_remaining === (runtimeComplete ? 0 : 1),
    evidence.environment.temporary_branch_overrides_remaining ===
      (qualification ? 2 : 0),
    evidence.protected_access.credential_active_after_cleanup ===
      (qualification || runtimePending),
    evidence.protected_access.credential_cleanup_complete ===
      runtimeComplete,
    evidence.runtime.application_requests ===
      (qualification ? 0 : 20),
    runtimeComplete
      ? evidence.result ===
          "PASSED_ADMIN_V1_STAGING_AUTHENTICATED_RUNTIME_CLOSURE" &&
        storageCleanupMatchesLifecycle(evidence)
      : evidence.result === "PRE_RUNTIME_PENDING_AUTHENTICATED_RUNTIME" &&
        storageCleanupMatchesLifecycle(evidence),
  ];
}

function governanceScopeReview(evidence) {
  const runtimeComplete = evidence.lifecycle === "RUNTIME_COMPLETE";
  return [
    governanceMatchesLifecycle(evidence),
    evidence.governance.blockers_before === 7 &&
      evidence.governance.blockers_after === (runtimeComplete ? 0 : 7),
    evidence.repository.application_source_changed === false,
    evidence.repository.dependency_modified === false,
    evidence.repository.schema_or_rls_modified === false,
    evidence.repository.workflow_modified === false,
    evidence.repository.create_paths === 6 &&
      evidence.repository.modify_paths === 18,
    evidence.target.baseline_commit === createRuntimePlan().baseline &&
      evidence.target.branch === createRuntimePlan().branch,
    evidence.preview.deployments_created === 8 &&
      evidence.preview.temporary_commits_created === 2 &&
      evidence.preview.temporary_worktrees_created === 0,
    evidence.next.public_launch === "NO_GO" &&
      evidence.next.next_authority ===
        "LEGAL_COMPLIANCE_POLICY_DESIGN_AND_FINAL_LAUNCH_READINESS_CONSOLIDATION",
  ];
}

function setPath(root, dottedPath, value) {
  const keys = dottedPath.split(".");
  let current = root;
  for (const key of keys.slice(0, -1)) current = current[key];
  current[keys.at(-1)] = value;
}

function mutationResults(schema, evidence) {
  const mutations = [
    ["schema_version", 2],
    ["phase", "34FA"],
    ["lifecycle", "PRE_RUNTIME"],
    ["result", "PRE_RUNTIME_PENDING_AUTHENTICATED_RUNTIME"],
    ["authorization.gemini_exact_approval_confirmed", false],
    ["authorization.dynamic_target_confirmation", false],
    ["authorization.confirmation_count", 0],
    ["authorization.approval_token_persisted", true],
    ["publication.lifecycle", "RUNTIME_COMPLETE"],
    ["publication.qualification.journal_retained", false],
    ["predecessor.phase_33na_passed", true],
    ["predecessor.phase_33na_final_dependency_evidence_ratified", false],
    ["predecessor.phase_33qa_unique_preview_trigger_validated", false],
    ["predecessor.phase_33ra_residual_preview_cleanup_passed", false],
    ["predecessor.phase_33sa_rolled_back_schema_incompatibility", false],
    ["predecessor.phase_33ta_failed_cleanup_resolver_exhaustion", false],
    ["predecessor.phase_33ua_residual_cleanup_passed", false],
    ["predecessor.phase_33va_marker_mismatch_rolled_back", false],
    ["target.deployment_target_sha256", "0".repeat(64)],
    ["target.baseline_commit", "0".repeat(40)],
    ["target.branch", "main"],
    ["target.marker_path", "testing/other.txt"],
    ["target.marker_sha256", "0".repeat(64)],
    ["target.marker_bytes", 279],
    ["target.marker_lf", 5],
    ["target.marker_trailing_lf", false],
    ["preview.marker_preworktree_proof", false],
    ["preview.deployments_created", 0],
    ["preview.rest_v13_identity", "PENDING"],
    ["preview.delete_contract", "REST_V13_DELETE_BY_ID_POSTSTATE_PASS"],
    ["protected_access.access_mode", "PENDING"],
    ["protected_access.credential_active_after_cleanup", true],
    ["protected_access.official_application_requests", 19],
    ["environment.state", "PENDING"],
    ["environment.metadata_names_present", 4],
    ["environment.sensitive_nonreadable_names", 4],
    ["environment.metadata_requests", 1],
    ["environment.admin_session_secret_runtime_proof", "PENDING"],
    ["runtime.runtime_sessions", 0],
    ["runtime.application_requests", 19],
    ["runtime.security_headers_passed", 19],
    ["runtime.logout_contract", "PENDING"],
    ["runtime.durable_projection_complete", false],
    ["runtime.durable_projection_journal_sha256", null],
    ["runtime.durable_projection_validated_requests", 19],
    ["fixture.submitted_tool_fixtures", 2],
    ["fixture.logo_payload_sha256", "g".repeat(64)],
    ["fixture.logo_payload_bytes", 0],
    ["fixture.direct_data_success_requests", 13],
    ["fixture.direct_data_total_requests", 27],
    ["cleanup.state", "NOT_EXECUTED"],
    ["governance.blockers_after", 7],
    ["storage_cleanup.storage_cleanup_mode", "PATHNAME_ONLY"],
    ["storage_cleanup.grant_id_present", false],
    ["storage_cleanup.expected_version_present", false],
    ["storage_cleanup.token_hash_present", false],
    ["storage_cleanup.raw_token_persisted", true],
    ["storage_cleanup.delete_client_role", "service_role"],
    ["storage_cleanup.service_role_delete_used", true],
    ["storage_cleanup.request_method", "POST"],
    ["storage_cleanup.storage_operation", "storage.object.delete"],
    ["storage_cleanup.CAS_outcome", "VERSION_MISMATCH"],
    ["storage_cleanup.replacement_preserved", true],
    ["storage_cleanup.grant_revoked", false],
    ["storage_cleanup.post_delete_absence", false]
  ];
  const results = mutations.map(([dottedPath, value]) => {
    const candidate = structuredClone(evidence);
    setPath(candidate, dottedPath, value);
    return (
      !schemaValid(candidate, schema, schema) ||
      !allSemanticAssertions(schema, candidate).every(Boolean)
    );
  });
  const missingJournal = structuredClone(evidence);
  delete missingJournal.preview.branch_transaction_journal;
  results.push(!schemaValid(missingJournal, schema, schema));
  const reorderedJournal = structuredClone(evidence);
  [
    reorderedJournal.preview.branch_transaction_journal[0],
    reorderedJournal.preview.branch_transaction_journal[1],
  ] = [
    reorderedJournal.preview.branch_transaction_journal[1],
    reorderedJournal.preview.branch_transaction_journal[0],
  ];
  results.push(
    !allSemanticAssertions(schema, reorderedJournal).every(Boolean),
  );
  return results;
}

function preRuntimeStorageCleanupMutationResults(schema, evidence) {
  const mutations = [
    ["storage_cleanup.storage_cleanup_mode", "PATHNAME_ONLY"],
    ["storage_cleanup.grant_id_present", true],
    ["storage_cleanup.expected_version_present", true],
    ["storage_cleanup.token_hash_present", true],
    ["storage_cleanup.raw_token_persisted", true],
    ["storage_cleanup.delete_client_role", "service_role"],
    ["storage_cleanup.service_role_delete_used", true],
    ["storage_cleanup.request_method", "POST"],
    ["storage_cleanup.storage_operation", "storage.object.delete"],
    ["storage_cleanup.CAS_outcome", "AUTHORIZED"],
    ["storage_cleanup.replacement_preserved", false],
    ["storage_cleanup.grant_revoked", true],
    ["storage_cleanup.post_delete_absence", true],
  ];
  const results = mutations.map(([dottedPath, value]) => {
    const candidate = structuredClone(evidence);
    setPath(candidate, dottedPath, value);
    return (
      !schemaValid(candidate, schema, schema) ||
      !storageCleanupMatchesLifecycle(candidate)
    );
  });
  const missing = structuredClone(evidence);
  delete missing.storage_cleanup;
  results.push(!schemaValid(missing, schema, schema));
  return results;
}

try {
  if (
    process.argv.length > 3 ||
    (process.argv.length === 3 &&
      ![
        "--schema-only",
        "--publication-only",
        ...REVIEW_MODES,
      ].includes(process.argv[2]))
  ) {
    throw new Error("MODE");
  }
  const schema = json(SCHEMA_PATH);
  const evidenceText = source(EVIDENCE_PATH);
  const evidence = JSON.parse(evidenceText);
  const staticResults = staticAssertions(schema, evidence, evidenceText);
  const schemaResults = schemaOnlyAssertions(schema, evidence, evidenceText);
  assert.equal(staticResults.length, 11);
  assert.equal(schemaResults.length, 11);
  if (REVIEW_MODES.includes(REVIEW_MODE)) {
    const reviewByMode = new Map([
      [
        "--review-projection-safety",
        [
          "PROJECTION_SAFETY",
          projectionSafetyReview(schema, evidence, evidenceText),
        ],
      ],
      [
        "--review-lifecycle-cleanup",
        ["LIFECYCLE_CLEANUP", lifecycleCleanupReview(evidence)],
      ],
      [
        "--review-governance-scope",
        ["GOVERNANCE_SCOPE", governanceScopeReview(evidence)],
      ],
    ]);
    const [reviewName, reviewResults] = reviewByMode.get(REVIEW_MODE);
    assert.equal(reviewResults.length, 10);
    assert(reviewResults.every(Boolean));
    process.stdout.write(
      `PASS_ADMIN_V1_STAGING_RUNTIME_${reviewName}_REVIEW assertions=10 lifecycle=${evidence.lifecycle} critical=0 important=0 minor=0 failures=0 internal_failures=0\n`,
    );
  } else if (SCHEMA_ONLY || PUBLICATION_ONLY) {
    assert(schemaResults.every(Boolean));
    if (PUBLICATION_ONLY) {
      assert.notEqual(evidence.lifecycle, "PRE_RUNTIME");
      process.stdout.write(
        `PASS_ADMIN_V1_STAGING_RUNTIME_EVIDENCE_PUBLICATION assertions=11 lifecycle=${evidence.lifecycle} projection_safe=true journal_retained_at_publication=true secret_fields=0 failures=0 internal_failures=0\n`,
      );
    } else {
      process.stdout.write(
        `PASS_ADMIN_V1_STAGING_RUNTIME_EVIDENCE_SCHEMA_ONLY assertions=11 schema=draft-2020-12 closed_objects=true lifecycle=${evidence.lifecycle} secret_fields=0 failures=0 internal_failures=0\n`,
      );
    }
  } else {
    if (evidence.lifecycle === "PRE_RUNTIME") {
      assert(staticResults.every(Boolean));
      assert(schemaResults.every(Boolean));
      const storageMutations = preRuntimeStorageCleanupMutationResults(
        schema,
        evidence,
      );
      assert.equal(storageMutations.length, 14);
      assert(storageMutations.every(Boolean));
      process.stdout.write(
        "PASS_STORAGE_CLEANUP_CAS_LOCAL_EVIDENCE_MODEL assertions=36 mutations=14 lifecycle=PRE_RUNTIME runtime_claimed=false raw_token_persisted=false service_role_delete_used=false failures=0 internal_failures=0\n",
      );
      process.exit(0);
    }
    const results = [...staticResults, ...liveAssertions(evidence)];
    assert.equal(results.length, 60);
    const pass = results.filter(Boolean).length;
    const fail = results.length - pass;
    if (pass === 11 && fail === 49) {
      process.stdout.write(
        "EXPECTED_FAIL_ADMIN_V1_STAGING_RUNTIME_EVIDENCE stage=RATIFICATION_PREVIEW_RUNTIME_AND_CLEANUP_REQUIRED assertions=60 pass=11 fail=49 internal_failures=0\n",
      );
      process.exit(1);
    }
    if (fail !== 0) {
      process.stdout.write(
        `FAIL_ADMIN_V1_STAGING_RUNTIME_EVIDENCE assertions=60 pass=${pass} fail=${fail} internal_failures=0\n`,
      );
      process.exit(1);
    }
    const mutations = mutationResults(schema, evidence);
    assert.equal(mutations.length, 67);
    assert(mutations.every(Boolean));
    process.stdout.write(
      "PASS_ADMIN_V1_STAGING_RUNTIME_EVIDENCE assertions=60 mutations=67 predecessor_phase_failed=true retained_dependency_evidence_ratified=true unique_preview_trigger_validated=true marker_identity=BYTE_EXACT_10_LF branch_transaction_journal=PASS vercel_rest_v13_identity=PASS protected_access=PASS storage_cleanup=RLS_EXPECTED_VERSION_CAPABILITY runtime_environment_readiness=5_of_5 metadata_requests=2 environment_pulls=0 metadata_reprobes=0 preview_deployments=8 runtime_sessions=1 requests=20 routes=7 methods=13 durable_projection=20_of_20 poststate_oracle=COMPLETE projection_revalidation_replay=0 direct_data_requests_max=26 cleanup=6_of_6 blockers_before=7 blockers_after=0 public_launch=NO_GO next_authority=LEGAL_COMPLIANCE_POLICY_DESIGN_AND_FINAL_LAUNCH_READINESS_CONSOLIDATION failures=0 internal_failures=0\n",
    );
  }
} catch {
  process.stdout.write(
    "FAIL_ADMIN_V1_STAGING_RUNTIME_EVIDENCE assertions=60 pass=0 fail=60 internal_failures=1\n",
  );
  process.exit(1);
}
