import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OPT_IN_ENV = "AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN";
const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const CANDIDATE_TABLE = "discovery_candidate_tools";
const PUBLIC_TOOLS_TABLE = "tools";
const DISCOVERED_TOOLS_TABLE = "discovered_tools";

const SAFE_TABLES = new Set([
  CANDIDATE_TABLE,
  PUBLIC_TOOLS_TABLE,
  DISCOVERED_TOOLS_TABLE,
]);

const SAFE_CANDIDATE_FILTER_COLUMNS = new Set([
  "candidate_status",
  "cleanup_status",
  "decision_action",
]);

const ACTIVE_CANDIDATE_STATUSES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
];

const STATUS_BUCKETS = {
  status_bucket_staged_candidate_count: "staged",
  status_bucket_needs_more_evidence_candidate_count: "needs_more_evidence",
  status_bucket_rejected_candidate_count: "rejected",
  status_bucket_approved_for_draft_candidate_count: "approved_for_draft",
};

const CLEANUP_BUCKETS = {
  cleanup_bucket_active_candidate_count: "active",
  cleanup_bucket_cleanup_candidate_count: "cleanup",
};

const DECISION_ACTION_BUCKETS = {
  decision_action_needs_more_evidence_candidate_count: "needs_more_evidence",
  decision_action_reject_candidate_count: "reject",
  decision_action_approve_for_draft_candidate_count: "approve_for_draft",
};

const SAFE_SKIP_VALUE = "SKIPPED_SAFE_QUERY_NOT_AVAILABLE";

const AGGREGATE_LABELS = new Set([
  "total_candidate_count",
  "status_bucket_staged_candidate_count",
  "status_bucket_needs_more_evidence_candidate_count",
  "status_bucket_rejected_candidate_count",
  "status_bucket_approved_for_draft_candidate_count",
  "status_bucket_other_candidate_count",
  "cleanup_bucket_active_candidate_count",
  "cleanup_bucket_cleanup_candidate_count",
  "cleanup_bucket_other_candidate_count",
  "active_non_cleanup_candidate_count",
  "active_staged_candidate_count",
  "staged_candidate_count",
  "decision_ready_candidate_count",
  "any_decision_action_set_candidate_count",
  "decision_action_needs_more_evidence_candidate_count",
  "decision_action_reject_candidate_count",
  "decision_action_approve_for_draft_candidate_count",
  "decision_action_other_candidate_count",
  "needs_more_evidence_any_status_candidate_count",
  "needs_more_evidence_active_any_status_candidate_count",
  "needs_more_evidence_staged_any_cleanup_candidate_count",
  "needs_more_evidence_active_staged_candidate_count",
  "public_tools_count_query_before",
  "public_tools_count_query_after",
  "discovered_tools_count_query_before",
  "discovered_tools_count_query_after",
]);

const SUCCESS_CLASSIFICATION = "READ_ONLY_AGGREGATE_BUCKET_BREAKDOWN_COMPLETE";
const FAILURE_CLASSIFICATIONS = new Set([
  "AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED",
  "AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV",
  "AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_QUERY_ERROR",
  "AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT",
  "AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT",
]);

const DIAGNOSTIC_STAGES = new Set([
  "script_start",
  "repo_guard",
  "env_guard",
  "build_count_request",
  "validate_filter_expression",
  "request_public_tools_before_count",
  "request_discovered_tools_before_count",
  "request_candidate_total_count",
  "request_candidate_status_bucket_count",
  "request_candidate_cleanup_bucket_count",
  "request_candidate_decision_action_bucket_count",
  "request_public_tools_after_count",
  "request_discovered_tools_after_count",
  "parse_exact_count",
  "aggregate_accumulation",
  "output_guard",
  "complete",
]);

const SAFE_FILTER_TOKEN_PATTERN = /^[a-z][a-z0-9_]*$/;

const SAFE_CANDIDATE_FILTER_VALUES = new Map([
  [
    "candidate_status",
    new Set([
      ...ACTIVE_CANDIDATE_STATUSES,
      ...Object.values(STATUS_BUCKETS),
    ]),
  ],
  ["cleanup_status", new Set(Object.values(CLEANUP_BUCKETS))],
  ["decision_action", new Set(Object.values(DECISION_ACTION_BUCKETS))],
]);

const outputLines = [];
const aggregateLines = [];
const logPath = join(
  tmpdir(),
  `aifinder-candidate-queue-aggregate-bucket-breakdown-${Date.now()}.log`,
);

function emit(line = "") {
  const text = String(line);
  outputLines.push(text);
  console.log(text);
}

function emitDiagnosticStage(stage) {
  if (!DIAGNOSTIC_STAGES.has(stage)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
  }

  emit(`diagnostic_stage=${stage}`);
}

function copyToClipboard(text) {
  const result = spawnSync("pbcopy", {
    input: text,
    encoding: "utf8",
    stdio: ["pipe", "ignore", "ignore"],
  });

  return result.status === 0;
}

function finalize(exitCode) {
  emit("");
  emit(`raw_terminal_output_log=${logPath}`);
  emit(`exit_code=${exitCode}`);

  let text = `${outputLines.join("\n")}\n`;
  writeFileSync(logPath, text, "utf8");

  if (copyToClipboard(text)) {
    emit("raw_terminal_output_copied_to_clipboard=true");
  } else {
    emit("raw_terminal_output_copied_to_clipboard=false");
  }

  text = `${outputLines.join("\n")}\n`;
  writeFileSync(logPath, text, "utf8");
  copyToClipboard(text);

  process.exit(exitCode);
}

function failLocked(classification, exitCode = 1) {
  if (!FAILURE_CLASSIFICATIONS.has(classification)) {
    emit("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
    finalize(1);
  }

  emit(classification);
  finalize(exitCode);
}

function assertCleanRepository() {
  let status = "";

  try {
    status = execFileSync("git", ["status", "--short", "--branch"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }

  if (status !== "## main...origin/main") {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }
}

function getSupabaseConfig() {
  const missingEnv = REQUIRED_ENV.some((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missingEnv) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV");
  }

  return {
    url: parsedUrl.origin,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function assertSafeTable(table) {
  if (!SAFE_TABLES.has(table)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }
}

function assertSafeFilterToken(token) {
  return SAFE_FILTER_TOKEN_PATTERN.test(token);
}

function assertAllowedCandidateFilterValue(column, value) {
  const allowedValues = SAFE_CANDIDATE_FILTER_VALUES.get(column);

  if (!allowedValues || !allowedValues.has(value)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }
}

function assertSafeCandidateFilter(filter) {
  if (filter.table !== CANDIDATE_TABLE) {
    return;
  }

  emitDiagnosticStage("validate_filter_expression");

  if (!SAFE_CANDIDATE_FILTER_COLUMNS.has(filter.column)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }

  if (filter.expression === "is.null" || filter.expression === "not.is.null") {
    return;
  }

  const eqMatch = filter.expression.match(/^eq\.([a-z][a-z0-9_]*)$/);
  if (eqMatch) {
    assertAllowedCandidateFilterValue(filter.column, eqMatch[1]);
    return;
  }

  const inMatch = filter.expression.match(/^in\.\(([a-z][a-z0-9_]*(?:,[a-z][a-z0-9_]*)*)\)$/);
  if (inMatch) {
    const values = inMatch[1].split(",");

    if (values.length === 0) {
      failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
    }

    for (const value of values) {
      if (!assertSafeFilterToken(value)) {
        failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
      }

      assertAllowedCandidateFilterValue(filter.column, value);
    }

    return;
  }

  failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
}

function eq(column, value) {
  return {
    column,
    expression: `eq.${value}`,
  };
}

function neq(column, value) {
  return {
    column,
    expression: `neq.${value}`,
  };
}

function notNull(column) {
  return {
    column,
    expression: "not.is.null",
  };
}

function inList(column, values) {
  return {
    column,
    expression: `in.(${values.join(",")})`,
  };
}

function buildCountUrl({ supabaseUrl, table, filters }) {
  assertSafeTable(table);

  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set("select", "*");

  for (const filter of filters) {
    assertSafeCandidateFilter({ ...filter, table });
    url.searchParams.set(filter.column, filter.expression);
  }

  return url;
}

function parseExactCount(contentRange) {
  if (typeof contentRange !== "string") {
    return null;
  }

  const match = contentRange.match(/^(?:\d+-\d+|\*)\/(\d+)$/);
  if (!match) {
    return null;
  }

  const count = Number(match[1]);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

async function readOnlyExactCount({
  config,
  table,
  filters = [],
  diagnosticStage = "request_candidate_total_count",
}) {
  emitDiagnosticStage("build_count_request");

  const url = buildCountUrl({
    supabaseUrl: config.url,
    table,
    filters,
  });

  emitDiagnosticStage(diagnosticStage);

  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "count=exact",
    },
  });

  if (!response.ok) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_QUERY_ERROR");
  }

  emitDiagnosticStage("parse_exact_count");

  const count = parseExactCount(response.headers.get("content-range"));

  if (count === null) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }

  return count;
}

function safeSubtract(base, ...parts) {
  if (![base, ...parts].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    return SAFE_SKIP_VALUE;
  }

  const total = parts.reduce((sum, value) => sum + value, 0);
  return Math.max(base - total, 0);
}

function addAggregateLine(label, value) {
  if (!AGGREGATE_LABELS.has(label)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
  }

  const safeValue =
    Number.isSafeInteger(value) && value >= 0 ? String(value) : String(value);

  if (!/^(?:0|[1-9][0-9]*|SKIPPED_SAFE_QUERY_NOT_AVAILABLE)$/.test(safeValue)) {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
  }

  aggregateLines.push(`${label}=${safeValue}`);
}

function assertSafeAggregateOutput(lines) {
  const unsafeValuePatterns = [
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    /https?:\/\//i,
    /\b[a-z0-9.-]+\.[a-z]{2,}\b/i,
    /\S+@\S+/i,
    /<[^>]+>/,
    /[{[\]}]/,
  ];

  for (const line of lines) {
    const [label, value, extra] = line.split("=");

    if (extra !== undefined || !AGGREGATE_LABELS.has(label)) {
      failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
    }

    if (!/^(?:0|[1-9][0-9]*|SKIPPED_SAFE_QUERY_NOT_AVAILABLE)$/.test(value)) {
      failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
    }

    if (unsafeValuePatterns.some((pattern) => pattern.test(value))) {
      failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT");
    }
  }
}

function printAggregateOutput() {
  assertSafeAggregateOutput(aggregateLines);

  for (const line of aggregateLines) {
    emit(line);
  }
}

async function runAggregateBreakdown() {
  emitDiagnosticStage("script_start");

  if (process.env[OPT_IN_ENV] !== "1") {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED", 0);
  }

  emitDiagnosticStage("repo_guard");
  assertCleanRepository();

  if (typeof fetch !== "function") {
    failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
  }

  emitDiagnosticStage("env_guard");
  const config = getSupabaseConfig();

  const countCandidates = (
    filters = [],
    diagnosticStage = "request_candidate_total_count",
  ) =>
    readOnlyExactCount({
      config,
      table: CANDIDATE_TABLE,
      filters,
      diagnosticStage,
    });

  const publicToolsBefore = await readOnlyExactCount({
    config,
    table: PUBLIC_TOOLS_TABLE,
    diagnosticStage: "request_public_tools_before_count",
  });
  const discoveredToolsBefore = await readOnlyExactCount({
    config,
    table: DISCOVERED_TOOLS_TABLE,
    diagnosticStage: "request_discovered_tools_before_count",
  });

  const totalCandidateCount = await countCandidates();

  addAggregateLine("total_candidate_count", totalCandidateCount);

  const statusCounts = {};
  for (const [label, status] of Object.entries(STATUS_BUCKETS)) {
    statusCounts[label] = await countCandidates(
      [eq("candidate_status", status)],
      "request_candidate_status_bucket_count",
    );
    addAggregateLine(label, statusCounts[label]);
  }

  addAggregateLine(
    "status_bucket_other_candidate_count",
    safeSubtract(totalCandidateCount, ...Object.values(statusCounts)),
  );

  const cleanupCounts = {};
  for (const [label, cleanupStatus] of Object.entries(CLEANUP_BUCKETS)) {
    cleanupCounts[label] = await countCandidates(
      [eq("cleanup_status", cleanupStatus)],
      "request_candidate_cleanup_bucket_count",
    );
    addAggregateLine(label, cleanupCounts[label]);
  }

  addAggregateLine(
    "cleanup_bucket_other_candidate_count",
    safeSubtract(totalCandidateCount, ...Object.values(cleanupCounts)),
  );

  addAggregateLine(
    "active_non_cleanup_candidate_count",
    await countCandidates(
      [eq("cleanup_status", "active")],
      "request_candidate_cleanup_bucket_count",
    ),
  );

  addAggregateLine(
    "active_staged_candidate_count",
    await countCandidates(
      [
        eq("candidate_status", "staged"),
        eq("cleanup_status", "active"),
      ],
      "request_candidate_status_bucket_count",
    ),
  );

  addAggregateLine(
    "staged_candidate_count",
    await countCandidates(
      [eq("candidate_status", "staged")],
      "request_candidate_status_bucket_count",
    ),
  );

  addAggregateLine(
    "decision_ready_candidate_count",
    await countCandidates(
      [
        inList("candidate_status", ACTIVE_CANDIDATE_STATUSES),
        eq("cleanup_status", "active"),
      ],
      "request_candidate_status_bucket_count",
    ),
  );

  const anyDecisionActionSetCount = await countCandidates(
    [notNull("decision_action")],
    "request_candidate_decision_action_bucket_count",
  );

  addAggregateLine(
    "any_decision_action_set_candidate_count",
    anyDecisionActionSetCount,
  );

  const decisionActionCounts = {};
  for (const [label, action] of Object.entries(DECISION_ACTION_BUCKETS)) {
    decisionActionCounts[label] = await countCandidates(
      [eq("decision_action", action)],
      "request_candidate_decision_action_bucket_count",
    );
    addAggregateLine(label, decisionActionCounts[label]);
  }

  addAggregateLine(
    "decision_action_other_candidate_count",
    safeSubtract(anyDecisionActionSetCount, ...Object.values(decisionActionCounts)),
  );

  addAggregateLine(
    "needs_more_evidence_any_status_candidate_count",
    await countCandidates(
      [eq("decision_action", "needs_more_evidence")],
      "request_candidate_decision_action_bucket_count",
    ),
  );

  addAggregateLine(
    "needs_more_evidence_active_any_status_candidate_count",
    await countCandidates(
      [
        eq("decision_action", "needs_more_evidence"),
        eq("cleanup_status", "active"),
      ],
      "request_candidate_decision_action_bucket_count",
    ),
  );

  addAggregateLine(
    "needs_more_evidence_staged_any_cleanup_candidate_count",
    await countCandidates(
      [
        eq("decision_action", "needs_more_evidence"),
        eq("candidate_status", "staged"),
      ],
      "request_candidate_decision_action_bucket_count",
    ),
  );

  addAggregateLine(
    "needs_more_evidence_active_staged_candidate_count",
    await countCandidates(
      [
        eq("decision_action", "needs_more_evidence"),
        eq("candidate_status", "staged"),
        eq("cleanup_status", "active"),
      ],
      "request_candidate_decision_action_bucket_count",
    ),
  );

  addAggregateLine("public_tools_count_query_before", publicToolsBefore);
  addAggregateLine(
    "public_tools_count_query_after",
    await readOnlyExactCount({
      config,
      table: PUBLIC_TOOLS_TABLE,
      diagnosticStage: "request_public_tools_after_count",
    }),
  );

  addAggregateLine("discovered_tools_count_query_before", discoveredToolsBefore);
  addAggregateLine(
    "discovered_tools_count_query_after",
    await readOnlyExactCount({
      config,
      table: DISCOVERED_TOOLS_TABLE,
      diagnosticStage: "request_discovered_tools_after_count",
    }),
  );

  emitDiagnosticStage("aggregate_accumulation");
  emitDiagnosticStage("output_guard");
  printAggregateOutput();
  emitDiagnosticStage("complete");
  emit(SUCCESS_CLASSIFICATION);
  finalize(0);
}

emit("=== AiFinder Discovery Engine — Candidate Queue Aggregate Bucket Breakdown ===");
emit("read_only=true");
emit("aggregate_only=true");
emit("candidate_decision_executed=false");
emit("approve_for_draft_executed=false");
emit("public_tools_write=false");
emit("discovered_tools_write=false");
emit("cleanup_mutation_executed=false");
emit("reset_reopen_mutation_executed=false");
emit("evidence_acquisition_executed=false");
emit("restricted_identifier_printed=false");

runAggregateBreakdown().catch(() => {
  failLocked("AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT");
});
