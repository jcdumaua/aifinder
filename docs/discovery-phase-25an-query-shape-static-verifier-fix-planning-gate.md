# AiFinder Discovery Engine — Phase 25AN Query-Shape and Static Verifier Fix Planning Gate

## Phase

Phase 25AN — Query-Shape Static Verifier Fix Planning Gate

## Status

Planning documentation artifact only.

This phase outlines the architectural plan to address the false negative identified in Phase 25AM and correct the lightweight count projection query shape.

No inspection script modification in this phase.

The next step is not script execution.

The next step is not a live retry.

## Current baseline

- Baseline commit: `2725a4c`
- Baseline full commit: `2725a4c66b6d710961bece6a78de54e44e966e2a`
- Baseline subject: `Document Phase 25AM query shape anomaly result`

## Problem statement

As documented in Phase 25AM, the `eq_status_column_count=0 was a static-detector false negative`.

The exact local evidence block showed that the source-status count query actually did include the explicit filter:

```javascript
.select(item.statusColumn, { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

However, selecting the dynamic `item.statusColumn` while simultaneously applying `.eq(item.statusColumn, statusValue)` with `{ head: true }` may be triggering an edge case in PostgREST/Supabase, resulting in the live infrastructure check failures for the `ALLOWED_TABLES` (`public.discovery_sources` and `public.discovery_runs`).

## Implementation plan for Phase 25AO

The next phase (Phase 25AO) will be a tightly scoped implementation gate to modify only:

```text
testing/discovery-read-only-live-inspection.mjs
```

Phase 25AO must not execute the inspection script.

Phase 25AO must not perform a live retry.

Phase 25AO must not perform live DB reads.

## 1. Query Shape Projection Fix

Update the `statusCount` function.

Instead of projecting the dynamic status column, use a safer minimal stable projection (`id`) while preserving the explicit status filter.

The target query shape will change from:

```javascript
.select(item.statusColumn, { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

to:

```javascript
.select('id', { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

## 2. Static Verifier Awareness

Future static verification tooling must be updated to look for both the literal `statusColumn` and the object-property `.eq(item.statusColumn, statusValue)` patterns to avoid repeating this false negative.

Required static verifier patterns should include:

```text
.eq(statusColumn, statusValue)
.eq(item.statusColumn, statusValue)
.eq(<resolved status column variable>, <status value variable>)
```

At minimum, the future implementation gate should verify:

```text
.select('id', { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

The future implementation gate should also verify the absence of:

```text
.select('*'
.rpc(
.in(item.statusColumn
.filter(item.statusColumn
```

## Planned allowlist preservation

Phase 25AO must preserve `ALLOWED_TABLES` exactly:

```text
public.discovery_sources
public.discovery_runs
```

Phase 25AO must keep these application payload tables excluded:

```text
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

## Planned result/error semantics preservation

Phase 25AO must preserve safe structured result fields:

```text
actual_query_succeeded
actual_count_if_succeeded
error_present
error_name
error_code
error_message_summary
error_details_summary
error_hint_summary
legacy_check
```

Phase 25AO must not reintroduce raw error object printing.

Phase 25AO must not print secrets.

Phase 25AO must not print row payloads.

Phase 25AO must preserve fail-nonzero behavior when aggregate errors are present.

## Boundary for Phase 25AN

Allowed:

- Create this planning document.
- Plan a future implementation gate.
- Define the intended source-status query-shape update.
- Define the intended static-verifier update.
- Define safety checks for the future implementation.
- Run local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No inspection script modification in this phase.
- No static-verifier implementation in this phase.
- No query-shape implementation in this phase.
- No script execution.
- No live inspection retry.
- No live DB read.
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

1. Does Phase 25AN accurately document the corrected Phase 25AM finding?
2. Is it correct that `eq_status_column_count=0` should be treated as a static-detector false negative, not missing filter logic?
3. Is the planned query-shape update from selecting `item.statusColumn` to selecting `id` reasonable for aggregate-only count queries?
4. Is it correct to keep `.eq(item.statusColumn, statusValue)` as the explicit filter?
5. Are the proposed static-verifier markers sufficient and safe?
6. Is it correct that Phase 25AO should modify only `testing/discovery-read-only-live-inspection.mjs` and should not execute it?
7. Is it safe to proceed to Phase 25AO implementation after James approval?

## Phase 25AN conclusion

Phase 25AN plans a targeted query-shape and static-verifier fix.

The next step is not a live retry.

The next step is not script execution.

The recommended next step is a tightly scoped implementation gate that modifies only `testing/discovery-read-only-live-inspection.mjs` after Gemini and James approval.
