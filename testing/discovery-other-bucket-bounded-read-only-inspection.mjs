#!/usr/bin/env node

/**
 * AiFinder Discovery Engine
 * Phase 22AN-F — Other Bucket Bounded Read-Only Inspection Script Implementation Gate
 *
 * Purpose:
 * - Implement a guarded, opt-out-by-default read-only inspection script for a
 *   future Phase 22AN-G live-read approval gate.
 * - Execute no live database reads unless the future Phase 22AN-G opt-in
 *   environment variable and exact approval phrase are both present.
 * - Produce aggregate-only output by default.
 * - Block identifier printing by default.
 * - Run an output safety scanner before printing live-read results.
 *
 * Phase 22AN-F boundaries:
 * - This script may be created and opt-out tested only.
 * - No live read is authorized in Phase 22AN-F.
 * - Live read remains blocked until Phase 22AN-G and explicit James approval.
 */

const PHASE = "22AN-F";
const SCRIPT_IMPLEMENTATION_RESULT = "PHASE_22AN_F_SCRIPT_IMPLEMENTED";
const OPT_OUT_MARKER = "OTHER_BUCKET_BOUNDED_READ_ONLY_INSPECTION_OPT_OUT_GUARD_ACTIVE";
const AGGREGATE_ONLY_MARKER = "OTHER_BUCKET_READ_ONLY_INSPECTION_AGGREGATE_ONLY_FIRST";
const IDENTIFIER_BLOCK_MARKER = "IDENTIFIER_PRINTING_BLOCKED_BY_DEFAULT";
const LIVE_READ_BLOCK_MARKER = "LIVE_READ_REMAINS_BLOCKED_UNTIL_PHASE_22AN_G_APPROVAL";

const RUN_ENV = "AIFINDER_RUN_DISCOVERY_OTHER_BUCKET_BOUNDED_READ_ONLY_INSPECTION";
const APPROVAL_ENV = "AIFINDER_DISCOVERY_OTHER_BUCKET_BOUNDED_READ_ONLY_APPROVAL";
const REQUIRED_APPROVAL_PHRASE =
  "Approve Phase 22AN-G other bucket bounded read-only inspection execution";

const CANDIDATE_TABLE = "discovery_candidate_tools";
const OPTIONAL_PUBLIC_TOOLS_TABLE = "tools";
const OPTIONAL_DISCOVERED_TOOLS_TABLE = "discovered_tools";

const MAX_ROWS_ENV = "AIFINDER_DISCOVERY_OTHER_BUCKET_READ_ONLY_MAX_ROWS";
const DEFAULT_MAX_ROWS = 50;
const MAX_ALLOWED_ROWS = 200;

const STATUS_COLUMN = "candidate_status";
const DECISION_ACTION_COLUMN = "decision_action";

const CLEANUP_COLUMN_CANDIDATES = [
  "cleanup_status",
  "cleanup_state",
  "cleanup_bucket",
];

const OPTIONAL_SAFE_COLUMN_CANDIDATES = [
  STATUS_COLUMN,
  DECISION_ACTION_COLUMN,
  ...CLEANUP_COLUMN_CANDIDATES,
  "evidence_status",
  "draft_status",
];

const OUTPUT_SAFETY_PATTERNS = [
  {
    label: "uuid",
    pattern:
      /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/,
  },
  { label: "url", pattern: /https?:\/\//i },
  {
    label: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  },
  { label: "authorization_header", pattern: /\bAuthorization:\s*/i },
  { label: "bearer_header", pattern: /\bBearer\s+[A-Za-z0-9._~+/\-]+=*/i },
  { label: "apikey_header", pattern: /\bapikey:\s*/i },
  { label: "service_role_assignment", pattern: /\bSUPABASE_SERVICE_ROLE_KEY\s*=/i },
  { label: "public_supabase_url_assignment", pattern: /\bNEXT_PUBLIC_SUPABASE_URL\s*=/i },
];

const OUTPUT_SAFETY_TERMS = [
  "candidate_uuid=",
  "candidate_name=",
  "candidate_url=",
  "source_id=",
  "run_id=",
  "preview_id=",
  "audit_id=",
  "raw_html=",
  "raw_asset_uri=",
];

function buildOptOutReport(reason) {
  return [
    `${SCRIPT_IMPLEMENTATION_RESULT}=true`,
    `${OPT_OUT_MARKER}=true`,
    `${AGGREGATE_ONLY_MARKER}=true`,
    `${IDENTIFIER_BLOCK_MARKER}=true`,
    `${LIVE_READ_BLOCK_MARKER}=true`,
    `phase=${PHASE}`,
    `live_read_executed=false`,
    `db_read_executed=false`,
    `mutation_executed=false`,
    `identifier_printing_executed=false`,
    `reason=${reason}`,
  ].join("\n");
}

function isLiveExecutionApproved() {
  return (
    process.env[RUN_ENV] === "1" &&
    process.env[APPROVAL_ENV] === REQUIRED_APPROVAL_PHRASE
  );
}

function parseMaxRows() {
  const rawValue = process.env[MAX_ROWS_ENV];

  if (!rawValue) {
    return DEFAULT_MAX_ROWS;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new Error(`${MAX_ROWS_ENV} must be a positive integer.`);
  }

  if (parsedValue > MAX_ALLOWED_ROWS) {
    throw new Error(`${MAX_ROWS_ENV} must be <= ${MAX_ALLOWED_ROWS}.`);
  }

  return parsedValue;
}

function normalizeToken(value) {
  if (value === null || value === undefined || value === "") {
    return "missing";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function statusGroup(value) {
  const normalized = normalizeToken(value);

  if (normalized === "missing") {
    return "status_group_missing";
  }

  if (normalized === "staged") {
    return "status_group_staged";
  }

  if (
    normalized === "needs_more_evidence" ||
    normalized === "more_evidence_needed" ||
    normalized === "needs_evidence"
  ) {
    return "status_group_needs_more_evidence";
  }

  if (
    normalized === "approved_for_draft" ||
    normalized === "approve_for_draft" ||
    normalized === "draft_approved"
  ) {
    return "status_group_approved_for_draft";
  }

  if (normalized === "rejected" || normalized === "rejected_duplicate") {
    return "status_group_rejected";
  }

  return "status_group_other";
}

function cleanupGroup(value, hasCleanupColumn) {
  if (!hasCleanupColumn) {
    return "cleanup_group_not_available";
  }

  const normalized = normalizeToken(value);

  if (normalized === "missing") {
    return "cleanup_group_missing";
  }

  if (
    normalized === "active" ||
    normalized === "open" ||
    normalized === "current" ||
    normalized === "none"
  ) {
    return "cleanup_group_active";
  }

  if (
    normalized === "cleanup" ||
    normalized === "closed" ||
    normalized === "resolved" ||
    normalized === "archived"
  ) {
    return "cleanup_group_cleanup";
  }

  return "cleanup_group_other";
}

function decisionActionGroup(value) {
  const normalized = normalizeToken(value);

  if (normalized === "missing") {
    return "decision_action_group_missing";
  }

  if (
    normalized === "needs_more_evidence" ||
    normalized === "more_evidence_needed" ||
    normalized === "needs_evidence"
  ) {
    return "decision_action_group_needs_more_evidence";
  }

  if (
    normalized === "approved_for_draft" ||
    normalized === "approve_for_draft" ||
    normalized === "draft_approved"
  ) {
    return "decision_action_group_approved_for_draft";
  }

  if (normalized === "reject" || normalized === "rejected") {
    return "decision_action_group_reject";
  }

  return "decision_action_group_other";
}

function incrementCount(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function assertSafeOutput(output) {
  for (const { label, pattern } of OUTPUT_SAFETY_PATTERNS) {
    if (pattern.test(output)) {
      throw new Error(`Output safety scanner blocked pattern: ${label}`);
    }
  }

  const loweredOutput = output.toLowerCase();

  for (const term of OUTPUT_SAFETY_TERMS) {
    if (loweredOutput.includes(term)) {
      throw new Error(`Output safety scanner blocked term: ${term}`);
    }
  }
}

function sanitizeProbeError(error) {
  if (!error) {
    return null;
  }

  return {
    code: typeof error.code === "string" ? error.code : "unknown",
    name: typeof error.name === "string" ? error.name : "unknown",
  };
}

async function safeExactCount(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (error) {
    return {
      available: false,
      count: null,
      error: sanitizeProbeError(error),
    };
  }

  return {
    available: true,
    count: count ?? 0,
    error: null,
  };
}

async function probeColumn(supabase, columnName) {
  const { error } = await supabase
    .from(CANDIDATE_TABLE)
    .select(columnName, { count: "exact", head: true })
    .limit(1);

  return {
    column: columnName,
    available: !error,
    error: sanitizeProbeError(error),
  };
}

async function getAvailableSafeColumns(supabase) {
  const probes = [];

  for (const columnName of OPTIONAL_SAFE_COLUMN_CANDIDATES) {
    probes.push(await probeColumn(supabase, columnName));
  }

  return {
    probes,
    availableColumns: probes
      .filter((probe) => probe.available)
      .map((probe) => probe.column),
  };
}

function summarizeRows(rows, cleanupColumn) {
  const statusCounts = {};
  const cleanupCounts = {};
  const decisionActionCounts = {};
  const combinedStatusCleanupCounts = {};
  const presenceCounts = {
    decision_action_present_count: 0,
    cleanup_marker_present_count: 0,
    evidence_marker_present_count: 0,
    draft_marker_present_count: 0,
  };

  const hasCleanupColumn = Boolean(cleanupColumn);

  for (const row of rows) {
    const status = statusGroup(row[STATUS_COLUMN]);
    const cleanup = cleanupGroup(
      hasCleanupColumn ? row[cleanupColumn] : null,
      hasCleanupColumn,
    );

    incrementCount(statusCounts, status);
    incrementCount(cleanupCounts, cleanup);
    incrementCount(combinedStatusCleanupCounts, `${status}__${cleanup}`);

    if (DECISION_ACTION_COLUMN in row) {
      incrementCount(decisionActionCounts, decisionActionGroup(row[DECISION_ACTION_COLUMN]));
      if (row[DECISION_ACTION_COLUMN] !== null && row[DECISION_ACTION_COLUMN] !== "") {
        presenceCounts.decision_action_present_count += 1;
      }
    }

    if (hasCleanupColumn && row[cleanupColumn] !== null && row[cleanupColumn] !== "") {
      presenceCounts.cleanup_marker_present_count += 1;
    }

    if ("evidence_status" in row && row.evidence_status !== null && row.evidence_status !== "") {
      presenceCounts.evidence_marker_present_count += 1;
    }

    if ("draft_status" in row && row.draft_status !== null && row.draft_status !== "") {
      presenceCounts.draft_marker_present_count += 1;
    }
  }

  return {
    count_by_status_group_only: statusCounts,
    count_by_cleanup_group_only: cleanupCounts,
    count_by_decision_action_group_only: decisionActionCounts,
    count_by_status_group_and_cleanup_group_only: combinedStatusCleanupCounts,
    redacted_row_shape_without_identifiers: {
      row_count: rows.length,
      cleanup_column_used: cleanupColumn ?? "none",
      presence_counts: presenceCounts,
    },
  };
}

async function runLiveReadOnlyInspection() {
  const requiredEnvNames = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  for (const envName of requiredEnvNames) {
    if (!process.env[envName]) {
      throw new Error(`Missing required environment variable name: ${envName}`);
    }
  }

  const maxRows = parseMaxRows();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const candidateCountBefore = await safeExactCount(supabase, CANDIDATE_TABLE);
  const publicToolsCountBefore = await safeExactCount(supabase, OPTIONAL_PUBLIC_TOOLS_TABLE);
  const discoveredToolsCountBefore = await safeExactCount(
    supabase,
    OPTIONAL_DISCOVERED_TOOLS_TABLE,
  );

  if (!candidateCountBefore.available) {
    throw new Error("Candidate table count is unavailable; aborting read-only inspection.");
  }

  if ((candidateCountBefore.count ?? 0) > maxRows) {
    throw new Error("Candidate count exceeds configured max rows; aborting read-only inspection.");
  }

  const { probes, availableColumns } = await getAvailableSafeColumns(supabase);

  if (!availableColumns.includes(STATUS_COLUMN)) {
    throw new Error("Required safe status column is unavailable; aborting inspection.");
  }

  const cleanupColumn = CLEANUP_COLUMN_CANDIDATES.find((columnName) =>
    availableColumns.includes(columnName),
  );

  const { data, count, error } = await supabase
    .from(CANDIDATE_TABLE)
    .select(availableColumns.join(","), { count: "exact" })
    .limit(maxRows);

  if (error) {
    throw new Error("Read-only candidate safe-column query failed.");
  }

  const rows = Array.isArray(data) ? data : [];

  if ((count ?? rows.length) !== rows.length) {
    throw new Error("Fetched row count does not match exact count; aborting.");
  }

  const candidateCountAfter = await safeExactCount(supabase, CANDIDATE_TABLE);
  const publicToolsCountAfter = await safeExactCount(supabase, OPTIONAL_PUBLIC_TOOLS_TABLE);
  const discoveredToolsCountAfter = await safeExactCount(
    supabase,
    OPTIONAL_DISCOVERED_TOOLS_TABLE,
  );

  if (candidateCountBefore.count !== candidateCountAfter.count) {
    throw new Error("Candidate count changed during read-only inspection; aborting.");
  }

  const aggregateSummary = summarizeRows(rows, cleanupColumn);

  const report = {
    phase: PHASE,
    result: "READ_ONLY_OTHER_BUCKET_BOUNDED_INSPECTION_COMPLETE",
    aggregate_only_first: true,
    identifier_printing_executed: false,
    mutation_executed: false,
    candidate_table_count_before: candidateCountBefore.count,
    candidate_table_count_after: candidateCountAfter.count,
    public_tools_count_before: publicToolsCountBefore.available
      ? publicToolsCountBefore.count
      : "unavailable",
    public_tools_count_after: publicToolsCountAfter.available
      ? publicToolsCountAfter.count
      : "unavailable",
    discovered_tools_count_before: discoveredToolsCountBefore.available
      ? discoveredToolsCountBefore.count
      : "unavailable",
    discovered_tools_count_after: discoveredToolsCountAfter.available
      ? discoveredToolsCountAfter.count
      : "unavailable",
    safe_column_probe_summary: probes.map((probe) => ({
      column: probe.column,
      available: probe.available,
      error: probe.available ? null : probe.error,
    })),
    available_safe_columns: availableColumns,
    ...aggregateSummary,
    before_after_count_integrity: true,
  };

  const output = JSON.stringify(report, null, 2);
  assertSafeOutput(output);
  console.log(output);
}

async function main() {
  if (!isLiveExecutionApproved()) {
    const reason =
      process.env[RUN_ENV] === "1"
        ? "approval_phrase_missing_or_incorrect"
        : "run_env_not_enabled";

    console.log(buildOptOutReport(reason));
    return;
  }

  await runLiveReadOnlyInspection();
}

main().catch((error) => {
  console.error("READ_ONLY_OTHER_BUCKET_INSPECTION_ABORTED");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
