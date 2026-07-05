# AiFinder Discovery Engine — Phase 25AU Discovery Sources Status Count Failure Diagnostic Planning Gate

## Phase

Phase 25AU — Discovery Sources Status Count Failure Diagnostic Planning Gate

## Status

Planning documentation artifact only.

This phase plans the next safe diagnostic approach for the remaining `public.discovery_sources.status_count` failure class.

It does not execute the inspection script.

It does not perform live database reads.

It does not modify the inspection script.

It does not perform a live retry.

It does not inspect or mutate the live Supabase database.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25AT.
- Baseline commit: `6bb041d`
- Baseline full commit: `6bb041d90c29becd907700cf5e307db904d34c84`
- Baseline subject: `Document Phase 25AT failure analysis planning`

## Problem statement

Phase 25AR executed exactly once after explicit approval and failed closed.

Phase 25AS documented that failure.

Phase 25AT established that the Phase 25AO projection-shape hypothesis was tested and insufficient.

The remaining failure is isolated to:

```text
public.discovery_sources.status_count
status_values=active,inactive,paused,blocked
actual_query_succeeded=false
aggregate_error_count=4
```

Healthy related checks:

```text
public.discovery_sources total_count passed
public.discovery_sources latest_created_at passed
public.discovery_sources latest_updated_at passed
public.discovery_runs total_count passed
public.discovery_runs latest_created_at passed
public.discovery_runs latest_updated_at passed
public.discovery_runs.status_count passed for queued,running,completed,failed,blocked
```

## Diagnostic goal

The goal is to identify the safest next evidence-gathering step without creating operational risk.

The next evidence step should explain why a filtered head-only count against `public.discovery_sources.status` fails while other infrastructure aggregate checks succeed.

## Diagnostic principles

Phase 25AU uses these principles:

```text
diagnostic_scope=planning_only
live_db_reads=false
inspection_script_execution=false
inspection_script_modification=false
schema_change=false
migration_apply=false
type_generation=false
operational_reactivation=false
```

The next diagnostic must start with local repository evidence unless a later gate explicitly approves a separate read-only metadata inspection.

## Ranked diagnostic hypotheses

### Hypothesis 1 — Live schema or PostgREST schema-cache mismatch

The `public.discovery_sources.status` column may exist in repository expectations but may not be visible to PostgREST in the deployed schema cache.

Planning implication:

```text
Do not refresh schema cache in Phase 25AU.
Do not run live schema-cache checks in Phase 25AU.
Plan a separate metadata-safe inspection only if local evidence is insufficient.
```

### Hypothesis 2 — Live schema drift from repository migrations

The live deployed table may differ from the repository migration history.

Planning implication:

```text
Review local migration files first.
Do not apply migrations.
Do not run supabase db push.
Do not regenerate types.
```

### Hypothesis 3 — Permission, RLS, or policy behavior specific to filtered status count

The table may allow total count and timestamp aggregate reads but reject filtered count reads on `status`.

Planning implication:

```text
Review local policy and grant definitions from migrations first.
Do not alter RLS.
Do not alter grants.
Do not run policy changes.
```

### Hypothesis 4 — Status type, enum, domain, or cast mismatch

The `status` column may use a type or constraint that rejects the tested string values in PostgREST filters.

Planning implication:

```text
Review local migration definitions for status type and allowed values.
Do not enumerate live status values.
Do not run grouped live status counts.
```

### Hypothesis 5 — Query-builder or PostgREST behavior specific to this table/column pair

The query shape may be structurally safe but still fail on this table and column combination.

Planning implication:

```text
Do not modify the inspection script in Phase 25AU.
Plan any future script change only after local evidence review.
```

### Hypothesis 6 — Error serialization still lacks enough diagnostic detail

The Phase 25AR output still showed unavailable error fields for the failing checks.

Planning implication:

```text
Do not broaden error output with secrets or payload data.
Plan a safer error diagnostics design only after confirming what can be logged safely.
```

## Recommended next phase

Recommended next phase:

```text
Phase 25AV — Local Repository Evidence Review for Discovery Sources Status Contract
```

Phase 25AV should be local-only and read-only.

It should inspect repository files only, such as:

```text
supabase/migrations/
supabase/seed.sql if present
generated Supabase type files if already present
testing/discovery-read-only-live-inspection.mjs
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md
```

Phase 25AV should answer:

```text
- What does the repository say the discovery_sources.status column should be?
- Which migration introduced or modified discovery_sources.status?
- Are there local RLS/grant/policy definitions that could affect status-filtered counts?
- Are the tested status values active, inactive, paused, and blocked supported by local schema evidence?
- Does local evidence suggest live schema drift, policy behavior, type mismatch, or insufficient error detail as the next leading hypothesis?
```

## Explicitly blocked in Phase 25AU

Do not run another live retry.

Do not execute `testing/discovery-read-only-live-inspection.mjs`.

Do not run any Supabase client code.

Do not run Supabase dashboard SQL.

Do not run `supabase db push`.

Do not apply migrations.

Do not generate types.

Do not refresh schema cache.

Do not inspect live database metadata.

Do not enumerate live rows.

Do not run grouped live status counts.

Do not query application payload tables.

Do not query `public.tools`.

Do not query `public.discovered_tools`.

Do not query `public.discovery_candidate_tools`.

Do not mutate any table.

Do not change RLS policies.

Do not change grants.

Do not change schema.

Do not change the inspection script.

Do not start crawler, extraction, evidence acquisition, candidate staging, candidate decision, or public publishing flows.

## Allowed in Phase 25AU

Allowed:

```text
- Create this planning document.
- Verify prior documentation markers.
- Verify inspection script static state without executing it.
- Run node --check on the inspection script.
- Run npm run check.
- Prepare a Gemini review package.
```

## Boundary preserved in Phase 25AU

- Planning documentation gate only.
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

1. Does Phase 25AU correctly frame the remaining `public.discovery_sources.status_count` failure as a diagnostic planning problem?
2. Are the ranked hypotheses complete and safe?
3. Is it correct to start with local repository evidence review before any new live metadata inspection or retry?
4. Is it correct to block schema-cache refresh, migrations, type generation, RLS/grant changes, grouped live counts, row enumeration, and another live retry at this phase?
5. Is the recommended Phase 25AV local repository evidence review gate appropriate?
6. Does Phase 25AU preserve operational reactivation as blocked?
7. Is it safe to commit this Phase 25AU planning documentation after James approval?

## Phase 25AU conclusion

Phase 25AU plans the safest next diagnostic direction.

The next step is not another live retry.

The next step is not script execution.

The next step is not a live metadata inspection.

The recommended next step is a local repository evidence review gate.
