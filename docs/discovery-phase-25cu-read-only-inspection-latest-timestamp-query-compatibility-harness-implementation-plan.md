# Discovery Phase 25CU — Read-Only Inspection Latest Timestamp Query Compatibility Harness Implementation Plan

## Status

Documentation-only implementation plan.

Phase 25CU plans the future bounded implementation needed to fix the latest timestamp query compatibility issue identified by Phase 25CR v8 and documented in Phase 25CS and Phase 25CT.

Phase 25CU does not implement the fix.

Phase 25CU does not modify the tracked inspection harness.

Phase 25CU does not rerun any live inspection.

Phase 25CU does not reactivate Discovery Engine operations.

## Scope

This phase is limited to implementation planning for the tracked read-only inspection harness:

```text
testing/discovery-read-only-live-inspection.mjs
```

Allowed in this phase:

- Document the target harness file for a future implementation phase.
- Define the exact bounded implementation objective.
- Define required preserved guardrails.
- Define implementation stop conditions.
- Define verification requirements for the future implementation phase.
- Define the future approval sequence before any corrected live rerun.

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

Phase 25CU starts after Phase 25CT was committed and pushed:

```text
HEAD=5f278e7 Document Phase 25CT timestamp query compatibility plan
HEAD full=5f278e7d8dcb0aac705c87800c5d1c2f4f3f27b7
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

## Problem statement

Phase 25CR v8 reached the tracked aggregate-only read-only infrastructure inspection harness.

The inspection succeeded for total count and status count checks against the two allowlisted infrastructure tables:

```text
public.discovery_sources
public.discovery_runs
```

The inspection failed for four latest timestamp checks:

```text
public.discovery_sources latest_created_at error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_sources latest_updated_at error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_runs latest_created_at error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
public.discovery_runs latest_updated_at error_code=PGRST125 error_message_summary="Invalid path specified in request URL"
```

The result was:

```text
aggregate_result_count=15
aggregate_error_count=4
Inspection exit code: 1
```

Operational reactivation remains blocked.

## Implementation objective for future Phase 25CV

The future Phase 25CV implementation should make the smallest safe harness-only change needed to make latest timestamp presence checks compatible with the current Supabase Data API request behavior.

The implementation target should be limited to:

```text
testing/discovery-read-only-live-inspection.mjs
```

The implementation should preserve the existing aggregate-only inspection boundary and avoid row payload disclosure.

## Required preserved behavior

The future implementation must preserve:

- Existing opt-in guard behavior.
- Existing expected HEAD validation.
- Existing expected subject validation.
- Existing `--mode aggregate-only` requirement.
- Existing repo sync preflight.
- Existing environment presence preflight without printing values.
- Existing allowlist of only:
  - `public.discovery_sources`
  - `public.discovery_runs`
- Existing denylist behavior for:
  - `public.discovery_candidate_tools`
  - `public.discovered_tools`
  - `public.tools`
- Existing structured safe error summaries.
- Existing no-mutation boundary.
- Existing no-admin-API boundary.
- Existing no-local-server-startup boundary.
- Existing no-crawler/extraction/LLM/candidate/publishing boundary.
- Existing no row-level status enumeration boundary.
- Existing nonzero exit when any required aggregate check fails.

## Planned timestamp query compatibility adjustment

Phase 25CV should inspect the current latest timestamp query construction and replace only the incompatible request shape.

The preferred future query pattern is:

```text
select <timestamp_column>
order by <timestamp_column> descending
limit 1
```

The future implementation should use this pattern only for the existing allowlisted infrastructure tables and only for these timestamp fields:

```text
created_at
updated_at
```

The result serialization should not print raw timestamp values.

The result should report only safe metadata such as:

```text
check=latest_created_at
ok=true
actual_query_succeeded=true
value_present=true|false
error_present=false
```

If an error occurs, it should preserve structured safe summaries such as:

```text
error_present=true
error_code=<safe code or unavailable>
error_message_summary=<safe summary or unavailable>
error_details_summary=unavailable
error_hint_summary=unavailable
```

## Row exposure control

A one-row timestamp lookup can still return a row-shaped response internally.

The future implementation must avoid printing row payloads.

The future implementation must not print raw timestamp values.

The implementation may internally inspect whether the selected timestamp field is present in the first returned row, but output must be reduced to `value_present`.

This preserves the intent of aggregate-only infrastructure readiness without exposing row-level details.

## Fallback option

If the implementation cannot guarantee that raw row values are never printed, Phase 25CV should not implement the one-row latest timestamp lookup.

Instead, Phase 25CV should either:

1. Remove latest timestamp checks from the required inspection pass criteria and document why they are not compatible with the aggregate-only boundary, or
2. Keep latest timestamp checks as intentionally skipped with a structured safe status, or
3. Stop and require a new planning phase.

The default recommendation remains to implement the bounded one-row presence-only pattern only if output can remain safe.

## Explicit non-goals

Phase 25CV must not:

- Add new allowlisted tables.
- Query application payload tables.
- Query `public.tools`.
- Query `public.discovered_tools`.
- Query `public.discovery_candidate_tools`.
- Enumerate rows.
- Print raw timestamps.
- Print any record payload.
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

## Future implementation verification requirements

Phase 25CV must verify:

- Only `testing/discovery-read-only-live-inspection.mjs` changed.
- No docs are changed unless the phase explicitly scopes a companion result note.
- No package or lockfile changes.
- No schema or migration changes.
- No generated type changes.
- The allowlist remains exactly limited to `public.discovery_sources` and `public.discovery_runs`.
- The denylist remains present for `public.discovery_candidate_tools`, `public.discovered_tools`, and `public.tools`.
- The latest timestamp implementation does not print raw timestamp values.
- The implementation reports only `value_present`.
- The script still requires explicit opt-in.
- The script still requires `--expected-head`.
- The script still requires `--mode aggregate-only`.
- `node --check testing/discovery-read-only-live-inspection.mjs` passes.
- `npm run check` passes.
- Secret-like pattern scans pass.
- Gemini reviews the implementation before commit.
- The implementation is committed only after James approval.

## Future corrected rerun requirements

Phase 25CU does not approve a corrected live inspection rerun.

After Phase 25CV implementation, a separate rerun approval gate must be created before any live rerun.

That future approval gate must define:

- The exact commit to run.
- The exact expected HEAD.
- The exact expected subject.
- The exact command shape.
- The exact opt-in guard.
- The exact approval phrase.
- The safe result package format.
- The stop conditions.
- The rule that operational reactivation remains blocked until a later result review phase.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25CR v8 exited non-zero.
- Latest timestamp checks failed.
- The harness compatibility fix has not been implemented.
- No corrected inspection rerun has been approved or completed.
- No corrected inspection result review has been approved.
- No operational reactivation gate has cleared reactivation.

## Recommended next phase

Next recommended phase:

```text
Phase 25CV — Read-Only Inspection Latest Timestamp Query Compatibility Harness Implementation
```

Phase 25CV may be an implementation phase only if Gemini approves this implementation plan and James approves proceeding.

If approved, Phase 25CV should modify only:

```text
testing/discovery-read-only-live-inspection.mjs
```

## Phase 25CU conclusion

Phase 25CU defines a bounded harness-only implementation plan for the latest timestamp query compatibility issue.

The plan preserves the aggregate-only read-only infrastructure boundary, avoids row payload disclosure, and keeps operational reactivation blocked.

No implementation occurs in this phase.

No live rerun occurs in this phase.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25CU and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25CU remains documentation-only.
- The plan safely scopes the future fix to `testing/discovery-read-only-live-inspection.mjs`.
- The allowlist and denylist boundaries are preserved.
- The one-row ordered lookup strategy is acceptable only if output is reduced to safe `value_present` metadata and raw timestamp values are not printed.
- The fallback options are safe if row-output safety cannot be guaranteed.
- No live inspection rerun or operational reactivation is introduced.
- Discovery Engine operational reactivation remains blocked.
- Phase 25CV is the correct next phase if James approves implementation.

Phase 25CU is ready for commit after James approval.
