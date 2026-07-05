# AiFinder Discovery Engine — Phase 25AH Discovery Sources Status Contract Failure Analysis Planning Gate

## Phase

Phase 25AH — Discovery Sources Status Contract Failure Analysis Planning Gate

## Status

Documentation artifact only.

This phase analyzes the repeated `public.discovery_sources.status` aggregate status-count failure and plans the next safe diagnostic direction.

It does not execute any live read.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AG.
- Baseline commit: `3997090`
- Baseline full commit: `3997090b960fad3194504d538eb3829948ca173f`
- Baseline subject: `Document Phase 25AG retry result`
- Phase 25AG result: Phase 25AF retry result documentation was committed and pushed to `main`.

## Confirmed Phase 25AF result

Phase 25AF was an approved single retry execution.

Result:

```text
FAILED CLOSED AFTER APPROVED SINGLE RETRY EXECUTION
aggregate_result_count=15
aggregate_error_count=4
Node exit code=1
known_secret_detected_before_wrapper_redaction=false
```

The corrected interpretation is:

```text
actual_query_succeeded=false means the public.discovery_sources.status aggregate queries did not succeed.
The result remains a failed-closed status-contract/query-shape diagnostic result, not a successful inspection.
```

## Confirmed passing checks

The retry confirmed:

```text
public.discovery_sources total_count ok=true actual_count_if_succeeded=1
public.discovery_sources latest_created_at ok=true value_present=true
public.discovery_sources latest_updated_at ok=true value_present=true

public.discovery_runs total_count ok=true actual_count_if_succeeded=2
public.discovery_runs latest_created_at ok=true value_present=true
public.discovery_runs latest_updated_at ok=true value_present=true
public.discovery_runs status_count queued ok=true actual_count_if_succeeded=0
public.discovery_runs status_count running ok=true actual_count_if_succeeded=0
public.discovery_runs status_count completed ok=true actual_count_if_succeeded=2
public.discovery_runs status_count failed ok=true actual_count_if_succeeded=0
public.discovery_runs status_count blocked ok=true actual_count_if_succeeded=0
```

## Confirmed failing checks

The retry confirmed:

```text
public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
```

For each failed check, safe serialized details remained unavailable:

```text
error_name=unavailable
error_code=unavailable
error_message_summary=unavailable
error_details_summary=unavailable
error_hint_summary=unavailable
```

## Phase 25AH boundary

Allowed:

- Create this documentation file.
- Analyze possible causes of the `public.discovery_sources.status` aggregate query failure.
- Plan the next safe diagnostic step.
- Compare known live aggregate behavior to the current script contract.
- Define possible future options without executing them.
- Run repository-local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No live inspection retry.
- No script execution.
- No direct DB access.
- No live DB reads.
- No DB mutation.
- No Supabase dashboard SQL.
- No schema query.
- No row-level enumeration.
- No `select('*')`.
- No `select('status')` row pull.
- No status-value listing from live rows.
- No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
- No application payload tables.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No verifier source changes.
- No crawler execution.
- No extraction execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No `approve_for_draft`.
- No public `tools` writes.
- No `discovered_tools` writes.
- No schema, migration, or type generation changes.
- No source app/API route/UI/helper changes.
- No testing script changes.
- No package or lockfile changes.
- No commit in this gate.
- No push in this gate.
- No automatic retry.

## Working hypotheses

The repeated failure is narrow. Count and timestamp probes on `public.discovery_sources` succeed, but status-value-filtered count probes fail.

Possible causes:

1. `public.discovery_sources.status` column does not exist.
2. `status` column exists but has a different name.
3. `status` column exists but has a type or enum behavior that rejects one or more expected literals.
4. One or more expected values are not valid for the live contract.
5. The current PostgREST/Supabase query shape `.select(statusColumn, { count: 'exact', head: true }).eq(statusColumn, statusValue)` is invalid for that table or column.
6. RLS or permissions permit count/timestamp checks but not status-filtered checks.
7. The service role connection reaches the table, but the status filter trips a schema-cache or column-resolution error.
8. The safe serializer correctly avoided raw error dumps, but the client error object did not expose safe code/message/details/hint fields.

This phase does not choose a cause.

It plans how to determine the cause safely.

## Important distinction

The system has not proven that the live status values are different.

It has proven that the approved aggregate status-count query for the expected values did not succeed.

Therefore the next diagnostic step should not assume status drift. It should distinguish between:

```text
status-value contract drift
status-column existence/name mismatch
query-shape mismatch
permissions/RLS mismatch
Supabase/PostgREST error-surface limitation
```

## Recommended next safe direction

Recommended next phase:

```text
Phase 25AI — Discovery Sources Status Contract Local Schema Review Planning Gate
```

Initial recommended approach:

- Start with local repository evidence only.
- Review migrations, type files, and source references for `discovery_sources.status`.
- Do not query the live database.
- Do not modify the inspection script.
- Do not retry.
- Do not broaden the live allowlist.
- Determine whether the local repo expects a `status` column on `public.discovery_sources`.
- Determine whether expected values are documented locally.
- Compare local documented expectations with the probe's hardcoded values.

This keeps the next step lower risk than another live read.

## Alternative future diagnostic options

These are not approved by Phase 25AH.

They may be considered only after local schema review.

### Option A — Local schema review only

Review local files for:

```text
discovery_sources
status
source_status
enabled
is_active
active
blocked
paused
created_at
updated_at
```

This is safest and should happen first.

### Option B — Static script query-shape review

Review whether the existing query shape is the best aggregate-only way to check status values:

```text
select(statusColumn, { count: 'exact', head: true }).eq(statusColumn, statusValue)
```

Potential issue: status filtering may fail before counts are returned if the column is missing or incompatible.

This still does not require live execution.

### Option C — Future aggregate-only schema metadata check

A later phase could plan a live metadata check if a safe mechanism exists.

Constraints would be:

- aggregate or metadata-only,
- no row values,
- no application payload tables,
- no mutation,
- explicit approval phrase,
- separate execution gate.

### Option D — Future aggregate grouped status count

A later phase could plan a grouped aggregate status distribution such as:

```text
status, count
```

But this requires special care because it returns distinct live status values.

It should not be treated as the same safety class as the current status-value count checks.

It must require a separate approval gate if used.

### Option E — Remove `discovery_sources.status` from readiness contract

If local schema review shows `status` is not part of the actual source contract, a later phase could plan removing source-status checks from the inspection script.

This would preserve count/timestamp readiness for `discovery_sources` and keep `discovery_runs.status` checks.

No change is approved here.

## Hard constraints for next phase

The next phase should not:

- execute the inspection script,
- perform live DB reads,
- use Supabase dashboard SQL,
- query row data,
- enumerate live status values,
- broaden `ALLOWED_TABLES`,
- query application payload tables,
- modify the inspection script,
- modify source app/API/UI files,
- mutate the DB,
- retry Phase 25AF.

## Proposed next phase contract

Phase 25AI should be docs-only and local-review-only.

Possible scope:

```text
Phase 25AI — Discovery Sources Status Contract Local Schema Review Planning Gate
```

It should create a planning document that defines:

- local files to inspect,
- grep terms to use,
- expected evidence format,
- no-live-read boundary,
- no-script-change boundary,
- how to classify findings,
- whether to recommend:
  - a later script contract update,
  - a later query-shape update,
  - a later carefully scoped live metadata diagnostic,
  - or no further live probe until manual schema review is complete.

## Result documentation requirement

No matter which next option is selected, the next live action should be preceded by:

- a planning gate,
- Gemini review,
- James approval,
- static verification,
- commit/push if documentation or script changes occur,
- exact execution phrase if any live read is approved.

## Required Gemini review questions

1. Does Phase 25AH correctly avoid assuming that live status values drifted?
2. Is it correct to classify the result as a failed status-contract/query-shape diagnostic rather than a successful inspection?
3. Are the working hypotheses complete enough?
4. Is local schema review the safest next step before any further live read?
5. Should grouped live status counts be treated as a separate safety class because they return distinct live values?
6. Is it correct to avoid broadening the allowlist and avoid row-level enumeration?
7. Is it safe to proceed to Phase 25AI local schema review planning after James approval?

## Phase 25AH conclusion

Phase 25AH plans the next diagnostic direction without performing one.

The next step is not another retry.

The next step is not a script change.

The recommended next step is a local schema review planning gate.
