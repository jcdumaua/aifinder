# Discovery Phase 25CT — Read-Only Inspection Latest Timestamp Query Compatibility Planning Gate

## Status

Documentation-only planning gate.

Phase 25CT responds to the Phase 25CR v8 read-only live inspection result documented in Phase 25CS.

The Phase 25CR v8 inspection successfully reached the aggregate-only read-only infrastructure harness and completed several allowlisted aggregate checks, but exited non-zero because four latest timestamp checks returned `PGRST125` with the safe summary `Invalid path specified in request URL`.

Phase 25CT does not modify the inspection harness.

Phase 25CT does not rerun any live inspection.

Phase 25CT does not reactivate Discovery Engine operations.

## Scope

This phase is limited to planning how to address the latest timestamp query compatibility issue.

Allowed in this phase:

- Review the Phase 25CS documented Phase 25CR v8 result.
- Preserve the non-passing inspection result.
- Identify the likely compatibility class of the failed latest timestamp checks.
- Define a future bounded implementation plan.
- Define future verification and approval gates.
- Keep operational reactivation blocked.

Not allowed in this phase:

- No source code changes.
- No inspection harness changes.
- No live inspection rerun.
- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command.
- No environment scanning.
- No environment value printing.
- No API changes.
- No UI changes.
- No schema changes.
- No migration changes.
- No package or lockfile changes.
- No generated type changes.
- No DB mutation.
- No public tools writes.
- No discovered_tools writes.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.
- No operational reactivation.

## Baseline

Phase 25CT starts after Phase 25CS was committed and pushed:

```text
HEAD=c489a81 Document Phase 25CS live inspection result review
HEAD full=c489a813d5d4b15e88e7481ff40d73004b22427d
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

## Input result from Phase 25CR v8

Phase 25CR v8 executed the tracked read-only inspection harness:

```text
testing/discovery-read-only-live-inspection.mjs
```

The inspection mode and boundary were:

```text
terminal_workflow=read_only_live_inspection
operational_mode=aggregate_only
probe_scope=infrastructure_only
no_mutation=true
no_admin_api_invocation=true
no_local_server_startup=true
no_crawler_extraction_candidate_or_publishing_execution=true
```

The allowlist was limited to infrastructure tables:

```text
table_allowlisted=true :: public.discovery_sources
table_allowlisted=true :: public.discovery_runs
table_denied=true :: public.discovery_candidate_tools
table_denied=true :: public.discovered_tools
table_denied=true :: public.tools
```

The aggregate result summary was:

```text
aggregate_result_count=15
aggregate_error_count=4
Inspection exit code: 1
```

Successful checks:

```text
public.discovery_sources total_count ok=true
public.discovery_sources status_count status=active ok=true
public.discovery_sources status_count status=inactive ok=true
public.discovery_sources status_count status=paused ok=true
public.discovery_sources status_count status=blocked ok=true

public.discovery_runs total_count ok=true
public.discovery_runs status_count status=queued ok=true
public.discovery_runs status_count status=running ok=true
public.discovery_runs status_count status=completed ok=true
public.discovery_runs status_count status=failed ok=true
public.discovery_runs status_count status=blocked ok=true
```

Failed checks:

```text
public.discovery_sources latest_created_at ok=false error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_sources latest_updated_at ok=false error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_runs latest_created_at ok=false error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_runs latest_updated_at ok=false error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
```

## Planning interpretation

The result suggests the following:

1. The post-rotation environment values were sufficient to reach the Supabase Data API.
2. The tracked harness successfully executed count/status aggregate checks against the two allowlisted infrastructure tables.
3. The latest timestamp checks likely use a request path or query shape that is incompatible with the current Supabase Data API request behavior.
4. The failure is not evidence that DB mutation occurred.
5. The failure is not evidence that operational reactivation is safe.
6. The failure blocks operational reactivation because the latest timestamp evidence was not captured successfully.

## Compatibility issue class

The failed checks share these properties:

- They target allowlisted infrastructure tables.
- They query latest timestamp information.
- They fail with the same PostgREST error code: `PGRST125`.
- They report the same safe summary: `Invalid path specified in request URL`.
- They are distinct from total count and status count checks, which succeeded.

This points to a query-construction compatibility issue rather than a broad connectivity or credential issue.

Phase 25CT does not decide the exact code change.

The future implementation phase should inspect the current harness query construction and choose the smallest safe adjustment.

## Future implementation constraints

Any future implementation phase must remain narrow.

A future harness adjustment may only modify:

```text
testing/discovery-read-only-live-inspection.mjs
```

Only the latest timestamp query construction should be in scope.

The future adjustment must not:

- Add new tables to the allowlist.
- Query application payload tables.
- Enumerate row-level data.
- Print project URL values.
- Print keys, tokens, credentials, or environment values.
- Add DB mutation paths.
- Add admin API invocation.
- Add local server startup.
- Add crawler execution.
- Add extraction execution.
- Add LLM execution.
- Add evidence acquisition.
- Add candidate staging.
- Add candidate decision execution.
- Add approve_for_draft.
- Add public tools writes.
- Add discovered_tools writes.
- Reactivate operations.

## Future implementation options to evaluate

The future implementation phase should inspect the current latest timestamp query shape and choose the minimal compatible pattern.

Possible safe directions include:

1. Use a standard ordered select pattern for one row:

```text
select <timestamp_column>
order by <timestamp_column> descending
limit 1
```

2. Avoid aggregate or path syntax that produces invalid PostgREST request paths.

3. Preserve structured safe error summaries.

4. Preserve `value_present` rather than raw timestamp values if timestamp value disclosure is intentionally minimized.

5. Preserve aggregate-only semantics by avoiding row payload exposure and reporting only whether a latest timestamp value exists.

6. If a one-row latest timestamp check is considered too close to row-level inspection, replace it with a safe aggregate-compatible alternative such as count-only recency feasibility or omit latest timestamp checks until a later approval gate.

Phase 25CT recommends Option 1 only if the implementation can avoid printing raw timestamp values and report only presence/success metadata.

If that cannot be guaranteed, Phase 25CT recommends planning a safer alternative or removing the latest timestamp checks from the reactivation prerequisite.

## Future verification requirements

A future implementation phase must verify:

- Only the tracked inspection harness changed.
- The allowlist remains limited to:
  - `public.discovery_sources`
  - `public.discovery_runs`
- Denied tables remain denied:
  - `public.discovery_candidate_tools`
  - `public.discovered_tools`
  - `public.tools`
- No secrets or environment values are printed.
- No raw project URL is written to docs or logs by the wrapper.
- No row-level payloads are printed.
- No DB mutation is possible from the wrapper.
- No admin API invocation is introduced.
- No local server startup is introduced.
- No crawler/extraction/LLM/candidate/publishing path is introduced.
- `npm run check` passes.
- Gemini reviews the implementation plan or implementation result before commit.

## Future live rerun requirements

A corrected inspection rerun must not happen in Phase 25CT.

Before any corrected live rerun, a separate approval gate must define:

- The exact script version or commit to run.
- The exact expected HEAD.
- The exact expected subject.
- The exact command shape.
- The exact opt-in guard.
- The exact approval phrase.
- The expected non-secret result package contents.
- The stop conditions.
- The rule that operational reactivation remains blocked unless a later result review explicitly clears it.

The corrected live rerun should be a later phase after the planning and implementation phases are reviewed.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25CR v8 exited non-zero.
- Four latest timestamp checks failed.
- No corrected harness change has been planned, implemented, reviewed, committed, or rerun.
- No corrected read-only inspection result has passed.
- No operational reactivation review gate has been approved.

## Recommended next phase

Next recommended phase:

```text
Phase 25CU — Read-Only Inspection Latest Timestamp Query Compatibility Harness Implementation Plan
```

Phase 25CU should remain documentation-only unless explicitly scoped otherwise.

The likely sequence after Phase 25CT should be:

1. Phase 25CU — harness implementation plan.
2. Phase 25CV — bounded harness implementation, if Gemini approves.
3. Phase 25CW — corrected read-only live inspection rerun approval gate.
4. Phase 25CX — corrected read-only live inspection rerun execution gate, only after exact approval.
5. Phase 25CY — corrected read-only live inspection result review gate.
6. Reactivation planning only if corrected inspection results support it.

## Phase 25CT conclusion

Phase 25CT confirms that the Phase 25CR v8 failure is isolated to latest timestamp query compatibility, while count/status aggregate access partially succeeded.

This phase does not fix the harness.

This phase does not rerun inspection.

This phase does not reactivate operations.

Discovery Engine operational reactivation remains blocked.

The next safe step is a documentation-only implementation plan for the timestamp query compatibility adjustment.

## Gemini approval

Gemini reviewed Phase 25CT and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25CT remains documentation-only.
- The `PGRST125` errors are correctly interpreted as a query-construction compatibility issue rather than a broad connectivity or credential failure.
- Future implementation is appropriately constrained to the tracked inspection harness.
- The strict allowlist and denylist boundaries are preserved.
- No live inspection rerun or operational reactivation is introduced.
- Discovery Engine operational reactivation remains blocked.
- Phase 25CU is the correct next implementation-planning phase.

Phase 25CT is ready for commit after James approval.
