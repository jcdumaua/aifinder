# AiFinder Discovery Engine — Phase 25AK Local Schema Review Result and Query-Shape Planning Gate

## Phase

Phase 25AK — Local Schema Review Result Documentation and Query-Shape Review Planning Gate

## Status

Documentation artifact only.

This phase documents the committed Phase 25AJ local schema review result and plans the next query-shape review.

It does not execute query-shape review.

It does not modify the inspection script.

It does not perform any live database read.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AJ.
- Baseline commit: `803b94e`
- Baseline full commit: `803b94ebc85f2fe20a6c41ca9413a7f1868889b5`
- Baseline subject: `Document Phase 25AJ local schema review result`
- Phase 25AJ result: local repository schema review result was committed and pushed to `main`.

## Phase 25AJ committed result summary

Phase 25AJ committed a local-only schema review result.

The committed result preserved these boundaries:

```text
No live DB read occurred.
No Supabase client was instantiated.
No inspection script execution occurred.
No retry occurred.
No .env files or build/dependency artifacts were scanned.
```

Gemini approved the Phase 25AJ result and interpreted the local evidence as strongly confirming that the local repository expects:

```text
public.discovery_sources.status
active
inactive
paused
blocked
```

Gemini also identified the most likely next diagnostic directions:

```text
Query-shape mismatch
Environment or migration drift
```

## Diagnostic conclusion so far

The investigation has narrowed the problem:

1. The live infrastructure probe connected successfully.
2. `public.discovery_sources` count and timestamp checks succeeded.
3. `public.discovery_runs` count, timestamp, and status checks succeeded.
4. `public.discovery_sources.status` aggregate status-count checks failed.
5. Local repository evidence strongly supports the expected `status` contract and literals.
6. The next likely failure class is either:
   - query-shape mismatch in the Supabase/PostgREST aggregate count query, or
   - live environment drift from local schema/migration expectations.

## Phase 25AK boundary

Allowed:

- Create this documentation file.
- Document the Phase 25AJ result and Gemini interpretation.
- Plan a future local query-shape review.
- Define exact local inspection targets for the next phase.
- Define safe evidence format for query-shape review.
- Run repository-local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No query-shape review execution in this phase.
- No script modification.
- No inspection script execution.
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

## Future Phase 25AL proposal

Recommended next phase:

```text
Phase 25AL — Read-Only Inspection Source Status Query-Shape Local Review Execution Gate
```

Phase 25AL should be local-read-only.

It should inspect `testing/discovery-read-only-live-inspection.mjs` only, plus any directly referenced helper or type files if the script imports them.

It should not modify files.

It should not run the script.

It should not instantiate Supabase clients.

It should not perform live DB reads.

## Query-shape review targets for Phase 25AL

Phase 25AL should inspect and document:

1. The function that performs status-count checks.
2. The exact `.select(...)` expression used for status-count checks.
3. The exact `.eq(...)` filter used for status-count checks.
4. Whether the selected column is the same as the filtered column.
5. Whether `head: true` changes the meaning or safety of selected columns.
6. Whether `.select(statusColumn, { count: 'exact', head: true })` is necessary.
7. Whether `.select('id', { count: 'exact', head: true }).eq(statusColumn, statusValue)` would be a safer future query shape.
8. Whether `.select('*', ...)` is absent and should remain forbidden.
9. Whether row-level status enumeration remains absent.
10. Whether failure serialization should include which part of the query shape failed, without printing raw error objects.

## Evidence format for Phase 25AL

Use local-only evidence blocks:

```text
file=testing/discovery-read-only-live-inspection.mjs
line=<line or range>
symbol=<function or constant>
finding=<query-shape/status-count/error-serialization/allowlist>
snippet=<short local-only code snippet>
interpretation=<how this affects status-count query behavior>
```

Do not include secrets.

Do not include environment values.

Do not scan `.env` files.

Do not include full files when short snippets are enough.

## Possible future classifications after Phase 25AL

### Classification Q1 — query shape likely valid

Use if the current query shape appears locally valid and consistent.

Implication:

- Future work should plan environment or migration drift verification.
- No live retry yet.

### Classification Q2 — selected-column query shape likely risky

Use if selecting `statusColumn` while using `head: true` is unnecessary or potentially problematic.

Implication:

- Future work should plan a script query-shape update.
- No live retry until update is planned, reviewed, implemented, committed, and approved.

### Classification Q3 — filtered-column query shape likely risky

Use if `.eq(statusColumn, statusValue)` may fail because the filter column contract differs from local assumptions.

Implication:

- Future work should plan contract reconciliation or metadata-safe verification.
- No live retry.

### Classification Q4 — error serialization still insufficient for query-shape diagnosis

Use if the script cannot distinguish select/projection/filter/schema-cache/RLS error sources safely.

Implication:

- Future work should plan serializer enhancement or a safer dry query-shape diagnostic.
- No live retry.

### Classification Q5 — query-shape evidence inconclusive

Use if static evidence cannot determine the likely issue.

Implication:

- Future work should plan manual review or a separate metadata-only diagnostic.
- No live retry.

## Hard constraints for all next steps

Until a later phase explicitly approves otherwise:

- no live retry,
- no live DB read,
- no Supabase SQL execution,
- no row-level enumeration,
- no grouped live status values,
- no application payload tables,
- no allowlist broadening,
- no mutation,
- no source app/API/UI changes,
- no inspection script change,
- no schema/migration/typegen change.

## Required Gemini review questions

1. Does Phase 25AK accurately document the committed Phase 25AJ local schema review result?
2. Is the diagnostic conclusion fair: local repository evidence supports the source-status contract, so next review should focus on query shape or environment drift?
3. Is it correct to plan local query-shape review before any live retry?
4. Are the Phase 25AL query-shape review targets sufficient?
5. Are the proposed Phase 25AL classifications useful and complete enough?
6. Is it correct to keep Phase 25AL local-read-only with no script execution or file modification?
7. Is it safe to proceed to Phase 25AL query-shape local review execution after James approval?

## Phase 25AK conclusion

Phase 25AK documents the local review result and plans query-shape review.

The next step is not a live retry.

The next step is not a script change.

The recommended next step is a local query-shape review execution gate.
