# AiFinder Discovery Engine — Phase 25AQ Read-Only Live Inspection Retry Preflight Approval Gate

## Phase

Phase 25AQ — Read-Only Live Infrastructure Inspection Retry Preflight Approval Gate

## Status

Documentation and approval-preflight artifact only.

This phase prepares the approval boundary for a future single live retry after the Phase 25AO query-shape fix.

It does not execute the inspection script.

It does not perform any live database read.

It does not modify the inspection script.

## Current baseline

- Latest pushed baseline before this preflight gate: Phase 25AP.
- Baseline commit: `b6bcf0d`
- Baseline full commit: `b6bcf0d45c61040ea9f9ef361d9fb4ab19c676bd`
- Baseline subject: `Document Phase 25AP query shape implementation result`

## Prior implementation state

Phase 25AO was committed as:

```text
71c7476 Update read-only inspection status count projection
```

Phase 25AO modified only:

```text
testing/discovery-read-only-live-inspection.mjs
```

The source-status count query now uses:

```javascript
.select('id', { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

The old projection is absent:

```javascript
.select(item.statusColumn, { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

Phase 25AP documented that no live retry or inspection execution occurred after Phase 25AO.

## Purpose of this gate

This phase defines the safety envelope for a later live retry execution.

The retry should remain blocked until all of the following are true:

1. Phase 25AQ is reviewed and committed.
2. The repository remains clean and synchronized with `origin/main`.
3. The inspection script static state remains exactly scoped to infrastructure-only tables.
4. James provides the exact approval phrase in a later execution gate.
5. The later execution wrapper verifies the expected HEAD and subject before running.
6. The later execution wrapper executes the inspection script at most once.
7. The later execution wrapper performs no commit or push.

## Proposed future approval phrase

The exact approval phrase for the future Phase 25AR execution should be:

```text
Approve run Phase 25AR read-only live infrastructure inspection retry after query-shape fix.
```

No shorter, partial, paraphrased, or implied approval should be accepted.

## Proposed future Phase 25AR baseline

If Phase 25AQ is approved, committed, and pushed, the future Phase 25AR execution wrapper should use the Phase 25AQ commit as its expected HEAD.

The Phase 25AR wrapper must verify:

```text
branch=main
working_tree_clean=true
ahead_count=0
behind_count=0
expected_head=<Phase 25AQ commit>
expected_subject=<Phase 25AQ commit subject>
```

## Future Phase 25AR command shape

The future execution wrapper should run the inspection script exactly once with the existing guard variable:

```bash
env AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1 \
node testing/discovery-read-only-live-inspection.mjs \
  --expected-head <Phase 25AQ commit short> \
  --expected-subject "<Phase 25AQ commit subject>" \
  --mode aggregate-only
```

This command must remain blocked until the exact approval phrase is provided.

## Future Phase 25AR required preflight checks

A future Phase 25AR execution wrapper must verify all of the following before execution:

```text
- repo remote is https://github.com/jcdumaua/aifinder.git
- branch is main
- HEAD equals the expected Phase 25AQ commit
- HEAD subject equals the expected Phase 25AQ subject
- origin/main equals HEAD
- ahead count is 0
- behind count is 0
- working tree is clean
- no staged changes exist
- no untracked files exist
- no AIFINDER_RUN_DISCOVERY_* variables are already set
- NEXT_PUBLIC_SUPABASE_URL is present by name
- SUPABASE_SERVICE_ROLE_KEY is present by name
- testing/discovery-read-only-live-inspection.mjs passes node --check
- npm run check passes
- ALLOWED_TABLES contains exactly public.discovery_sources and public.discovery_runs
- app payload tables remain excluded
- source-status count query uses .select('id', { count: 'exact', head: true })
- source-status count query preserves .eq(item.statusColumn, statusValue)
- broad select('*') is absent
- .rpc( is absent
- .in(item.statusColumn is absent
- .filter(item.statusColumn is absent
```

## Future Phase 25AR execution limits

The future execution wrapper must enforce:

```text
single_execution_only=true
mode=aggregate-only
probe_scope=infrastructure_only
allowed_tables=public.discovery_sources, public.discovery_runs
denied_tables=public.discovery_candidate_tools, public.discovered_tools, public.tools
no_row_payloads=true
no_row_level_status_enumeration=true
no_grouped_live_status_counts=true
no_db_mutation=true
no_admin_api_call=true
no_local_server_start=true
no_crawler_execution=true
no_extraction_execution=true
no_candidate_decision_execution=true
no_public_tools_write=true
no_discovered_tools_write=true
no_commit=true
no_push=true
```

## Expected possible outcomes of Phase 25AR

The future live retry may pass or fail.

If it passes, the result still must be documented in a later result documentation phase before any operational reactivation.

If it fails, the result must fail closed and be documented in a later result documentation phase.

A failed live retry must not trigger an automatic second retry.

A passed live retry must not trigger public publishing, candidate staging, candidate decision execution, or operational reactivation.

## Boundary preserved in Phase 25AQ

- Documentation/preflight approval gate only.
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

1. Does Phase 25AQ accurately document the retry preflight approval boundary after Phase 25AO and Phase 25AP?
2. Is the proposed exact approval phrase sufficiently explicit and safe?
3. Are the future Phase 25AR preflight checks complete enough before a single live retry?
4. Are the future Phase 25AR execution limits strict enough?
5. Is it correct that Phase 25AQ does not execute the inspection script or perform live DB reads?
6. Is it correct that even a passing Phase 25AR result must be documented before any operational reactivation?
7. Is it safe to commit this Phase 25AQ documentation after James approval?

## Phase 25AQ conclusion

Phase 25AQ defines the retry preflight approval boundary.

The next step is not a live retry.

The next step is not script execution.

The recommended next step after Phase 25AQ commit is to wait for James to provide the exact Phase 25AR approval phrase in a separate execution gate.
