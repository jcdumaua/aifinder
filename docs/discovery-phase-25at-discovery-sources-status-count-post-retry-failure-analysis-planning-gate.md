# AiFinder Discovery Engine — Phase 25AT Discovery Sources Status Count Post-Retry Failure Analysis Planning Gate

## Phase

Phase 25AT — Discovery Sources Status Count Post-Retry Failure Analysis Planning Gate

## Status

Planning documentation artifact only.

This phase plans the next diagnostic direction after the Phase 25AR approved single live retry failed closed.

It does not execute the inspection script.

It does not perform live database reads.

It does not modify the inspection script.

It does not perform a live retry.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25AS.
- Baseline commit: `514afaa`
- Baseline full commit: `514afaa4b529992130ce1441ba60c153d4250272`
- Baseline subject: `Document Phase 25AS failed retry result`

## Prior failed retry result

Phase 25AR was executed exactly once after the approved Phase 25AQ phrase.

Phase 25AR result:

```text
outcome=FAILED_CLOSED_AFTER_APPROVED_SINGLE_RETRY
node_exit_code=1
aggregate_result_count=15
aggregate_error_count=4
known_env_value_detected_in_node_output=false
```

The remaining failed checks were exactly:

```text
public.discovery_sources status_count active
public.discovery_sources status_count inactive
public.discovery_sources status_count paused
public.discovery_sources status_count blocked
```

Each failed check reported:

```text
actual_query_succeeded=false
actual_count_if_succeeded=unavailable
error_present=true
```

## Important conclusion from Phase 25AR

The Phase 25AO query-shape fix was present during the retry:

```javascript
.select('id', { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

The retry still failed for `public.discovery_sources.status_count`.

Therefore, the Phase 25AO projection-shape hypothesis should be considered tested and not sufficient to explain the remaining failure.

The remaining failure must be treated as a narrower `public.discovery_sources.status` status-count query failure.

## Evidence that scope remains narrow

The following checks passed during Phase 25AR:

```text
public.discovery_sources total_count
public.discovery_sources latest_created_at
public.discovery_sources latest_updated_at
public.discovery_runs total_count
public.discovery_runs latest_created_at
public.discovery_runs latest_updated_at
public.discovery_runs status_count queued
public.discovery_runs status_count running
public.discovery_runs status_count completed
public.discovery_runs status_count failed
public.discovery_runs status_count blocked
```

This means:

```text
public.discovery_sources is reachable
public.discovery_runs is reachable
public.discovery_runs.status_count is healthy
public.discovery_sources.status_count is the remaining failure class
```

## Hypotheses to analyze next

Phase 25AT should evaluate the following diagnostic hypotheses without executing live reads:

1. Live PostgREST schema cache mismatch for `public.discovery_sources.status`.
2. Live database schema drift between repository expectations and deployed database.
3. Permission or policy issue specific to filtered count queries on `public.discovery_sources.status`.
4. Column type, enum, domain, or cast mismatch for `discovery_sources.status`.
5. Supabase client / PostgREST behavior specific to filtered head-only count queries on this table.
6. Stale generated type assumptions or repository schema assumptions.
7. Insufficient error visibility because Supabase returned empty structured error summaries.

## Recommended next diagnostic class

The next diagnostic should not be another live retry.

The next diagnostic should not modify the inspection script immediately.

The safest next step is a planning gate for local repository evidence review and non-mutating diagnostic design.

Recommended next phase:

```text
Phase 25AU — Discovery Sources Status Count Failure Diagnostic Planning Gate
```

Phase 25AU should decide whether the next safe diagnostic is:

```text
- local repository schema and migration evidence review
- local Supabase policy/RLS definition review from migrations only
- local generated type review if types are already present in the repository
- docs-only plan for a future read-only metadata inspection
- docs-only plan for an explicit Supabase schema-cache or migration-status check
```

## Explicitly blocked next actions

Do not immediately run another live retry.

Do not run grouped live status counts.

Do not enumerate live rows.

Do not query `public.tools`.

Do not query `public.discovered_tools`.

Do not query `public.discovery_candidate_tools`.

Do not mutate `public.discovery_sources`.

Do not mutate `public.discovery_runs`.

Do not refresh schema cache.

Do not apply migrations.

Do not run `supabase db push`.

Do not regenerate types.

Do not change RLS policies.

Do not change schema.

Do not change the inspection script in Phase 25AT.

Do not start crawler, extraction, evidence acquisition, candidate staging, candidate decision, or public publishing flows.

## Boundary for Phase 25AT

Allowed:

- Create this planning document.
- Analyze the Phase 25AR result at a planning level.
- Define hypotheses for the remaining failure.
- Define a safe next diagnostic phase.
- Run local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No inspection script modification.
- No inspection script execution.
- No live inspection retry.
- No live DB reads.
- No Supabase client instantiation.
- No Supabase dashboard SQL.
- No DB mutation.
- No row-level enumeration.
- No live status enumeration.
- No grouped live status counts.
- No `.env` scanning.
- No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
- No application payload tables.
- No source app/API/UI/helper changes.
- No schema/migration/typegen changes.
- No package or lockfile changes.
- No verifier rerun.
- No crawler execution.
- No extraction execution.
- No LLM execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No `approve_for_draft`.
- No public `tools` writes.
- No `discovered_tools` writes.
- No commit in this gate.
- No push in this gate.

## Required Gemini review questions

1. Does Phase 25AT accurately document the remaining Phase 25AR failure after the query-shape retry?
2. Is it correct that the Phase 25AO projection-shape hypothesis should be considered tested and insufficient?
3. Is the remaining failure correctly scoped to `public.discovery_sources.status_count` while `public.discovery_sources` reachability and `public.discovery_runs.status_count` remain healthy?
4. Are the proposed hypotheses complete and safe?
5. Is it correct to block another live retry, grouped live counts, row enumeration, schema changes, migrations, and type generation at this stage?
6. Is the recommended Phase 25AU diagnostic planning gate appropriate?
7. Is it safe to commit this Phase 25AT planning documentation after James approval?

## Phase 25AT conclusion

Phase 25AT plans the next analysis step after the failed-closed Phase 25AR retry.

The next step is not another live retry.

The next step is not script execution.

The recommended next step is a diagnostic planning gate focused on the remaining `public.discovery_sources.status_count` failure class.
