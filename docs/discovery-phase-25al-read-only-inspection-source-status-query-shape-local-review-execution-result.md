# AiFinder Discovery Engine — Phase 25AL Read-Only Inspection Source Status Query-Shape Local Review Execution Result

## Phase

Phase 25AL — Read-Only Inspection Source Status Query-Shape Local Review Execution Gate

## Status

Local query-shape review executed.

This phase executed the local-only query-shape review planned in Phase 25AK.

It inspected only local repository code.

It did not execute the inspection script.

It did not modify the inspection script.

It did not perform any live database read.

## Current baseline

- Latest pushed baseline before this execution gate: Phase 25AK.
- Baseline commit: `ed7a4c1`
- Baseline full commit: `ed7a4c148cd678f2697e80b44abb974c5b7e1ede`
- Baseline subject: `Document Phase 25AK query shape review plan`

## Boundary preserved

- Local code review only.
- Reviewed `testing/discovery-read-only-live-inspection.mjs` locally.
- No live DB read.
- No Supabase client instantiation.
- No inspection script execution.
- No live inspection retry.
- No DB mutation.
- No row-level enumeration.
- No live status enumeration.
- No grouped live status counts.
- No `.env` scanning.
- No application payload table access.
- No allowlist broadening.
- No testing script changes.
- No source app/API/UI/helper changes.
- No schema/migration/typegen/package/lockfile changes.
- No commit.
- No push.

## Automated query-shape classification summary

```text
select_status_column_count=0
select_id_count=1
select_star_count=0
eq_status_column_count=0
head_true_count=2
error_serialization_marker_count=10
classification=Classification Q5 — query-shape evidence inconclusive
recommended_next_phase=Phase 25AM — Query-Shape Local Review Result Documentation
```

## Interpretation limits

This review used local static code evidence only.

It did not prove the live database schema.

It did not prove live PostgREST behavior.

It did not execute any query.

It did not instantiate Supabase.

Gemini should review the local evidence before any planning decision is finalized.

## Local query-shape evidence

# Phase 25AL query-shape local evidence

Generated from local file only: `testing/discovery-read-only-live-inspection.mjs`.

No live DB read. No script execution. No file modification.

### status-count and serialization references
pattern=status_count|statusColumn|statusValue|legacy_check|actual_query_succeeded|actual_count_if_succeeded
```text
45:    statusColumn: 'status',
46:    statusValues: ['active', 'inactive', 'paused', 'blocked'],
53:    statusColumn: 'status',
54:    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
182:function failedAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, error }) {
187:    actual_query_succeeded: false,
188:    actual_count_if_succeeded: 'unavailable',
193:    result.legacy_check = legacyCheck;
195:  if (statusColumn) {
196:    result.status_column = statusColumn;
198:  if (statusValue) {
199:    result.status_value = statusValue;
205:function successfulAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, count }) {
210:    actual_query_succeeded: true,
211:    actual_count_if_succeeded: count,
216:    result.legacy_check = legacyCheck;
218:  if (statusColumn) {
219:    result.status_column = statusColumn;
221:  if (statusValue) {
222:    result.status_value = statusValue;
460:      actual_query_succeeded: false,
470:    actual_query_succeeded: true,
476:async function statusCount(client, item, statusValue) {
477:  if (!item.statusColumn) {
481:  const queryText = `${item.label}:status:${item.statusColumn}:${statusValue}`;
484:  const legacyCheck = `status_count:${item.statusColumn}:${statusValue}`;
487:    .select(item.statusColumn, { count: 'exact', head: true })
488:    .eq(item.statusColumn, statusValue);
493:      check: 'status_count',
495:      statusColumn: item.statusColumn,
496:      statusValue,
503:    check: 'status_count',
505:    statusColumn: item.statusColumn,
506:    statusValue,
522:    for (const statusValue of item.statusValues) {
523:      const result = await statusCount(client, item, statusValue);
```

#### Context windows for status-count and serialization references

file=testing/discovery-read-only-live-inspection.mjs
line_window=41-53
```text
    schema: 'public',
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=42-54
```text
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=49-61
```text
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
];

const DENIED_TABLES = [
  'public.discovery_candidate_tools',
  'public.discovered_tools',
  'public.tools',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=50-62
```text
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
];

const DENIED_TABLES = [
  'public.discovery_candidate_tools',
  'public.discovered_tools',
  'public.tools',
];
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=178-190
```text
    error_hint_summary: 'unavailable',
  };
}

function failedAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, error }) {
  const result = {
    table,
    check,
    ok: false,
    actual_query_succeeded: false,
    actual_count_if_succeeded: 'unavailable',
    ...serializeSupabaseError(error),
  };
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=183-195
```text
  const result = {
    table,
    check,
    ok: false,
    actual_query_succeeded: false,
    actual_count_if_succeeded: 'unavailable',
    ...serializeSupabaseError(error),
  };

  if (legacyCheck) {
    result.legacy_check = legacyCheck;
  }
  if (statusColumn) {
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=184-196
```text
    table,
    check,
    ok: false,
    actual_query_succeeded: false,
    actual_count_if_succeeded: 'unavailable',
    ...serializeSupabaseError(error),
  };

  if (legacyCheck) {
    result.legacy_check = legacyCheck;
  }
  if (statusColumn) {
    result.status_column = statusColumn;
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=189-201
```text
    ...serializeSupabaseError(error),
  };

  if (legacyCheck) {
    result.legacy_check = legacyCheck;
  }
  if (statusColumn) {
    result.status_column = statusColumn;
  }
  if (statusValue) {
    result.status_value = statusValue;
  }

```

### Supabase select/count/head/filter query-shape references
pattern=\.select[[:space:]]*\(|count:[[:space:]]*['\"]exact['\"]|head:[[:space:]]*true|\.eq[[:space:]]*\(
```text
428:    .select('id', { count: 'exact', head: true });
451:    .select(column)
487:    .select(item.statusColumn, { count: 'exact', head: true })
488:    .eq(item.statusColumn, statusValue);
```

#### Context windows for Supabase select/count/head/filter query-shape references

file=testing/discovery-read-only-live-inspection.mjs
line_window=424-436
```text
  assertQueryTextSafe(queryText);

  const { count, error } = await client
    .from(item.table)
    .select('id', { count: 'exact', head: true });

  if (error) {
    return failedAggregateResult({
      table: item.label,
      check: 'total_count',
      error,
    });
  }
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=447-459
```text
  assertQueryTextSafe(queryText);

  const { data, error } = await client
    .from(item.table)
    .select(column)
    .order(column, { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    return {
      table: item.label,
      check: `latest_${column}`,
      ok: false,
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=483-495
```text

  const legacyCheck = `status_count:${item.statusColumn}:${statusValue}`;
  const { count, error } = await client
    .from(item.table)
    .select(item.statusColumn, { count: 'exact', head: true })
    .eq(item.statusColumn, statusValue);

  if (error) {
    return failedAggregateResult({
      table: item.label,
      check: 'status_count',
      legacyCheck,
      statusColumn: item.statusColumn,
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=484-496
```text
  const legacyCheck = `status_count:${item.statusColumn}:${statusValue}`;
  const { count, error } = await client
    .from(item.table)
    .select(item.statusColumn, { count: 'exact', head: true })
    .eq(item.statusColumn, statusValue);

  if (error) {
    return failedAggregateResult({
      table: item.label,
      check: 'status_count',
      legacyCheck,
      statusColumn: item.statusColumn,
      statusValue,
```

### function and loop references
pattern=async function|function |const [A-Za-z0-9_]+ = async|for \(const .*status|STATUSES|SOURCE.*STATUS|RUN.*STATUS
```text
79:function printSection(title) {
84:function fail(message) {
90:function runGit(args) {
97:function safeOneLine(value) {
120:function redactKnownSecrets(text) {
137:function sanitizeSummary(value, maxLength = SUMMARY_LIMIT) {
152:function safeErrorField(error, fieldName) {
160:function serializeSupabaseError(error) {
171:function noErrorFields() {
182:function failedAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, error }) {
205:function successfulAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, count }) {
228:function parseArgs(argv) {
284:function assertNoUnexpectedDiscoveryOptIns() {
301:function assertRequiredEnvNamesPresent() {
310:function assertRepoState(expectedHead, expectedSubject) {
359:function assertAllowlistIsSafe() {
388:function assertQueryTextSafe(text) {
401:async function loadSupabaseClient() {
422:async function countRows(client, item) {
445:async function latestTimestamp(client, item, column) {
476:async function statusCount(client, item, statusValue) {
511:async function runAggregateInspection() {
522:    for (const statusValue of item.statusValues) {
533:async function main() {
```

#### Context windows for function and loop references

file=testing/discovery-read-only-live-inspection.mjs
line_window=75-87
```text
  'revoke',
  'call',
];

function printSection(title) {
  console.log('');
  console.log(`=== ${title} ===`);
}

function fail(message) {
  console.error(`FAILED: ${sanitizeSummary(message, SUMMARY_LIMIT)}`);
  process.exitCode = 1;
  throw new Error(message);
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=80-92
```text
  console.log('');
  console.log(`=== ${title} ===`);
}

function fail(message) {
  console.error(`FAILED: ${sanitizeSummary(message, SUMMARY_LIMIT)}`);
  process.exitCode = 1;
  throw new Error(message);
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=86-98
```text
  process.exitCode = 1;
  throw new Error(message);
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function safeOneLine(value) {
  if (value === undefined || value === null) {
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=93-105
```text
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function safeOneLine(value) {
  if (value === undefined || value === null) {
    return 'unavailable';
  }

  let text = '';

  if (typeof value === 'string') {
    text = value;
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=116-128
```text
  const oneLine = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return oneLine.length > 0 ? oneLine : 'unavailable';
}

function redactKnownSecrets(text) {
  let sanitized = safeOneLine(text);

  for (const name of [...REQUIRED_ENV_NAMES, REQUIRED_GUARD]) {
    const value = process.env[name];
    if (value && value.length >= 8) {
      sanitized = sanitized.split(value).join(`[redacted:${name}]`);
    }
  }
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=133-145
```text

  return sanitized;
}

function sanitizeSummary(value, maxLength = SUMMARY_LIMIT) {
  const redacted = redactKnownSecrets(value);

  if (redacted === 'unavailable') {
    return redacted;
  }

  if (redacted.length <= maxLength) {
    return redacted;
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=148-160
```text
  const marker = ' [truncated]';
  return `${redacted.slice(0, Math.max(0, maxLength - marker.length))}${marker}`;
}

function safeErrorField(error, fieldName) {
  if (!error || typeof error !== 'object') {
    return 'unavailable';
  }

  return sanitizeSummary(error[fieldName], SUMMARY_LIMIT);
}

function serializeSupabaseError(error) {
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=156-168
```text

  return sanitizeSummary(error[fieldName], SUMMARY_LIMIT);
}

function serializeSupabaseError(error) {
  return {
    error_present: Boolean(error),
    error_name: safeErrorField(error, 'name'),
    error_code: safeErrorField(error, 'code'),
    error_message_summary: safeErrorField(error, 'message'),
    error_details_summary: safeErrorField(error, 'details'),
    error_hint_summary: safeErrorField(error, 'hint'),
  };
```

### allowlist and table references
pattern=ALLOWED_TABLES|discovery_sources|discovery_runs|public\.discovery_sources|public\.discovery_runs
```text
39:const ALLOWED_TABLES = [
42:    table: 'discovery_sources',
43:    label: 'public.discovery_sources',
50:    table: 'discovery_runs',
51:    label: 'public.discovery_runs',
362:  for (const item of ALLOWED_TABLES) {
379:  console.log(`table_allowlist_count=${ALLOWED_TABLES.length}`);
380:  for (const item of ALLOWED_TABLES) {
515:  for (const item of ALLOWED_TABLES) {
```

#### Context windows for allowlist and table references

file=testing/discovery-read-only-live-inspection.mjs
line_window=35-47
```text
];

const SUMMARY_LIMIT = 240;

const ALLOWED_TABLES = [
  {
    schema: 'public',
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=38-50
```text

const ALLOWED_TABLES = [
  {
    schema: 'public',
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=39-51
```text
const ALLOWED_TABLES = [
  {
    schema: 'public',
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=46-58
```text
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
];

const DENIED_TABLES = [
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=47-59
```text
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
];

const DENIED_TABLES = [
  'public.discovery_candidate_tools',
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=358-370
```text

function assertAllowlistIsSafe() {
  const seen = new Set();

  for (const item of ALLOWED_TABLES) {
    if (item.schema !== 'public') {
      fail(`table is outside public schema: ${item.label}`);
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(item.table)) {
      fail(`unsafe table name: ${item.label}`);
    }
    if (DENIED_TABLES.includes(item.label)) {
      fail(`denied application payload table is allowlisted: ${item.label}`);
```

file=testing/discovery-read-only-live-inspection.mjs
line_window=375-387
```text
    seen.add(item.label);
  }

  console.log('probe_scope=infrastructure_only');
  console.log(`table_allowlist_count=${ALLOWED_TABLES.length}`);
  for (const item of ALLOWED_TABLES) {
    console.log(`table_allowlisted=true :: ${item.label}`);
  }
  for (const table of DENIED_TABLES) {
    console.log(`table_denied=true :: ${table}`);
  }
}

```

file=testing/discovery-read-only-live-inspection.mjs
line_window=376-388
```text
  }

  console.log('probe_scope=infrastructure_only');
  console.log(`table_allowlist_count=${ALLOWED_TABLES.length}`);
  for (const item of ALLOWED_TABLES) {
    console.log(`table_allowlisted=true :: ${item.label}`);
  }
  for (const table of DENIED_TABLES) {
    console.log(`table_denied=true :: ${table}`);
  }
}

function assertQueryTextSafe(text) {
```

## Recommended next phase

```text
Phase 25AM — Query-Shape Local Review Result Documentation
```

The next phase should document this result and plan the next safe action.

No live retry should occur until a later reviewed and approved phase.

## Required Gemini review questions

1. Does Phase 25AL correctly execute only the local query-shape review planned in Phase 25AK?
2. Is the evidence collection safe, with no script execution, no live DB reads, and no file modification?
3. Does the evidence show the status-count query selects `statusColumn`, `id`, or something else when using `count: 'exact'` and `head: true`?
4. Does the evidence show `.eq(statusColumn, statusValue)` is used for filtering?
5. Is the automated classification fair, or should Gemini reclassify it?
6. Should the next phase plan a safer query-shape update, environment drift verification, or result documentation only?
7. Is it safe to commit this Phase 25AL execution result after James approval?

## Phase 25AL conclusion

Phase 25AL executed a local-only query-shape review.

The Discovery Engine remains operationally blocked.

The next step is not a live retry.

The next step is not a script change until a separate planning and implementation gate is approved.
