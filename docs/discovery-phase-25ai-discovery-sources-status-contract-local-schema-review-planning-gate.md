# AiFinder Discovery Engine — Phase 25AI Discovery Sources Status Contract Local Schema Review Planning Gate

## Phase

Phase 25AI — Discovery Sources Status Contract Local Schema Review Planning Gate

## Status

Documentation artifact only.

This phase plans a local repository schema review for the repeated `public.discovery_sources.status` aggregate status-count failure.

It does not perform the local schema review.

It does not execute any live read.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AH.
- Baseline commit: `e28bf0a`
- Baseline full commit: `e28bf0acabf6a375d6f49cdd81db7918a62398e2`
- Baseline subject: `Document Phase 25AH status contract analysis`
- Phase 25AH result: status-contract failure analysis planning was already committed and pushed to `main`.

## Problem being investigated

Phase 25AF confirmed that the updated read-only inspection retry failed closed:

```text
FAILED CLOSED AFTER APPROVED SINGLE RETRY EXECUTION
aggregate_result_count=15
aggregate_error_count=4
Node exit code=1
known_secret_detected_before_wrapper_redaction=false
```

The failing checks were all scoped to:

```text
public.discovery_sources.status
```

The corrected interpretation from Phase 25AH remains:

```text
The system has not proven that the live status values are different.
It has proven that the approved aggregate status-count query for the expected values did not succeed.
```

## Phase 25AI objective

Plan a local-only schema review that can answer:

1. Does the repository define a `status` column on `public.discovery_sources`?
2. If yes, what type or constraint is expected?
3. If yes, what expected values are documented locally?
4. If no, what field represents source activation or lifecycle state?
5. Does the inspection script's hardcoded source status list match local repository evidence?
6. Does the inspection script's query shape match the expected schema?
7. Should the next implementation phase update the script contract, query shape, or result interpretation?

## Phase 25AI boundary

Allowed:

- Create this documentation file.
- Plan a future local schema review.
- Define local files and grep terms to inspect.
- Define evidence collection format.
- Define classification rules for future findings.
- Define Gemini review questions.
- Run repository-local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No local schema review execution in this phase.
- No live DB reads.
- No Supabase dashboard SQL.
- No direct DB access.
- No script execution.
- No live inspection retry.
- No DB mutation.
- No schema migration.
- No type generation.
- No source app/API/UI/helper changes.
- No testing script changes.
- No verifier rerun.
- No verifier source changes.
- No package or lockfile changes.
- No row-level enumeration.
- No live status enumeration.
- No `select('*')`.
- No `select('status')`.
- No grouped live status counts.
- No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
- No application payload tables.
- No admin API invocation.
- No local server startup.
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

## Future Phase 25AJ proposal

Recommended next phase:

```text
Phase 25AJ — Discovery Sources Status Contract Local Schema Review Execution Gate
```

Phase 25AJ should be local-read-only.

It should inspect local repository files only.

It should not query the live database.

It should not modify source files.

It should not modify the inspection script.

It should produce a local review result document or copied report for Gemini review.

## Local files to inspect in Phase 25AJ

Phase 25AJ should inspect these local path groups if they exist:

```text
supabase/migrations/
supabase/seed.sql
supabase/schema.sql
supabase/types.ts
database.types.ts
types/supabase.ts
lib/
scripts/
testing/
docs/
app/api/admin/discovery/
app/admin/discovery/
```

The inspection should not assume all paths exist.

Missing paths should be reported as `missing`, not treated as failure unless they are required by the project.

## Suggested grep terms for Phase 25AJ

Use local-only searches for:

```text
discovery_sources
discovery sources
source_status
status
is_active
active
inactive
paused
blocked
enabled
disabled
discovery_runs
source_id
source_url
last_checked
created_at
updated_at
```

For SQL-specific files, include:

```text
create table public.discovery_sources
alter table public.discovery_sources
discovery_sources (
status text
status varchar
status public.
check (
constraint
enum
create type
```

## Evidence format for Phase 25AJ

The local review should produce evidence blocks like:

```text
file=<path>
line=<line number or range>
term=<matched term>
finding=<schema/status/query/reference>
snippet=<short safe local-only snippet>
interpretation=<what this implies for discovery_sources.status contract>
```

No secrets should be printed.

No `.env*` files should be searched.

No dependency cache or build output should be searched.

## Suggested excluded paths for Phase 25AJ

Avoid scanning:

```text
.env
.env.local
.env.production
node_modules/
.next/
.vercel/
.git/
coverage/
playwright-report/
test-results/
tmp/
```

## Classification rules for Phase 25AJ

The local review should classify the result as one of:

### Classification A — status column confirmed with matching values

Use if local schema confirms:

```text
public.discovery_sources.status
active
inactive
paused
blocked
```

Implication:

- The live failure may be query-shape, permissions, schema-cache, or live drift.
- Next phase should plan query-shape review or metadata-safe diagnostic.

### Classification B — status column confirmed but expected values differ

Use if local schema confirms `status`, but values differ from:

```text
active
inactive
paused
blocked
```

Implication:

- The inspection script contract likely needs update planning.
- No live retry until script contract update is reviewed and committed.

### Classification C — status column absent

Use if local schema does not define `public.discovery_sources.status`.

Implication:

- The inspection script should likely remove or replace `discovery_sources.status` checks.
- Next phase should plan script contract update.
- No live retry.

### Classification D — alternative lifecycle field found

Use if local schema indicates an alternative such as:

```text
is_active
enabled
source_status
state
lifecycle_status
```

Implication:

- Next phase should plan whether to update the probe to use the alternative field or count/timestamp-only readiness.

### Classification E — local schema evidence inconclusive

Use if local evidence is incomplete or conflicting.

Implication:

- Next phase should plan either manual schema review or a separate strictly approved metadata-only diagnostic.
- No automatic live retry.

## Query-shape review questions for Phase 25AJ

If a `status` column exists, review the current script query shape:

```text
select(statusColumn, { count: 'exact', head: true }).eq(statusColumn, statusValue)
```

Questions:

1. Is selecting the status column necessary when using `head: true` count?
2. Would selecting `id` with `.eq(statusColumn, statusValue)` be safer?
3. Would selecting a guaranteed column avoid column projection issues?
4. Is the failure likely from the filter column or selected column?
5. Should the script produce a more explicit local comment explaining this query shape?

No query-shape change is approved by Phase 25AI.

## Future decision paths after Phase 25AJ

Depending on the local review result, future phases may be:

```text
Phase 25AK — Discovery Sources Status Contract Local Review Result Documentation
Phase 25AL — Read-Only Inspection Source Status Contract Update Planning Gate
Phase 25AM — Read-Only Inspection Query Shape Update Planning Gate
Phase 25AN — Local Schema Inconclusive / Metadata Diagnostic Planning Gate
```

Do not skip review/result documentation.

## Hard constraints for all next steps

Until a later phase explicitly approves otherwise:

- no live retry,
- no live DB read,
- no row-level enumeration,
- no grouped live status values,
- no application payload tables,
- no allowlist broadening,
- no mutation,
- no source app/API/UI changes,
- no script change,
- no schema/migration/typegen change.

## Required Gemini review questions

1. Does Phase 25AI correctly remain planning-only and local-only?
2. Are the proposed local path groups and grep terms safe and sufficient?
3. Are the excluded paths sufficient to avoid secrets and build artifacts?
4. Is the evidence format safe and useful?
5. Are the classification rules complete enough?
6. Is it correct that Phase 25AJ should execute local schema review without live DB reads or script changes?
7. Is it safe to proceed to Phase 25AJ local schema review execution after James approval?

## Phase 25AI conclusion

Phase 25AI plans a local-only schema review.

The next step is not a live retry.

The next step is not a script change.

The next step is a controlled local schema review execution gate.
