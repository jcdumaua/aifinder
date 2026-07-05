# AiFinder Discovery Engine — Phase 25AB Read-Only Live Infrastructure Inspection Failure Review / Error Serialization Planning Gate

## Phase

Phase 25AB — Read-Only Live Infrastructure Inspection Failure Review / Error Serialization Planning Gate

## Status

Documentation artifact only.

This phase reviews the Phase 25Z failed-closed read-only live infrastructure inspection and plans safer error serialization for a future script update.

It does not modify the inspection script.

It does not rerun the inspection.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AA.
- Baseline commit: `31b0138`
- Baseline full commit: `31b01380be1897ed50288d6241c3e1f5208650b4`
- Baseline subject: `Document Phase 25AA live inspection failed result`
- Phase 25AA result: the Phase 25Z failed-closed execution result was documented and pushed to `main`.

## Prior execution result being reviewed

Phase 25Z was approved with this exact phrase:

```text
Approve run Phase 25Z read-only live infrastructure inspection.
```

Phase 25Z result:

```text
FAILED CLOSED AFTER APPROVED AGGREGATE-ONLY READS
aggregate_result_count=15
aggregate_error_count=4
Node exit code=1
```

## Failure scope

The failure scope was narrow.

Successful checks:

```text
public.discovery_sources total_count ok=true count=1
public.discovery_sources latest_created_at ok=true value_present=true
public.discovery_sources latest_updated_at ok=true value_present=true
public.discovery_runs total_count ok=true count=2
public.discovery_runs latest_created_at ok=true value_present=true
public.discovery_runs latest_updated_at ok=true value_present=true
public.discovery_runs status_count:status:queued ok=true count=0
public.discovery_runs status_count:status:running ok=true count=0
public.discovery_runs status_count:status:completed ok=true count=2
public.discovery_runs status_count:status:failed ok=true count=0
public.discovery_runs status_count:status:blocked ok=true count=0
```

Failed checks:

```text
public.discovery_sources status_count:status:active ok=false error_class=""
public.discovery_sources status_count:status:inactive ok=false error_class=""
public.discovery_sources status_count:status:paused ok=false error_class=""
public.discovery_sources status_count:status:blocked ok=false error_class=""
```

## Boundary for Phase 25AB

Allowed:

- Create this documentation file.
- Analyze the Phase 25Z output already pasted by James.
- Define a future error-serialization implementation plan.
- Define a future diff-on-failure output contract.
- Define future safe redaction rules.
- Define future retry-readiness requirements.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No script execution.
- No live inspection rerun.
- No direct DB access.
- No live DB reads.
- No DB mutation.
- No Supabase dashboard or SQL execution.
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

## Review conclusion

The Phase 25Z failure should be treated as a healthy diagnostic failure.

It showed:

1. Repository and branch controls passed.
2. Environment variable name checks passed without value disclosure.
3. The narrowed two-table allowlist was enforced.
4. `public.discovery_sources` was reachable.
5. `public.discovery_runs` was reachable.
6. Aggregate count and timestamp checks worked for both tables.
7. `public.discovery_runs.status` matched the hardcoded status-count contract.
8. `public.discovery_sources.status` did not match the hardcoded status-count query contract or returned errors for the attempted values.
9. The script halted on aggregate errors instead of silently succeeding.
10. No mutation or operational reactivation occurred.

## Problem statement

The script currently reports the failed `public.discovery_sources` status-count checks with empty `error_class` values:

```text
error_class=""
```

That is insufficient for diagnosis.

The script should provide a safe, sanitized error serialization shape that identifies what failed without printing secrets, rows, raw payloads, or application data.

## Future implementation phase

Recommended future phase:

```text
Phase 25AC — Read-Only Live Inspection Error Serialization Script Update Planning Gate
```

Scope:

- Docs-only planning for a future script update.
- No script implementation.
- No script execution.
- No live DB reads.
- No DB mutation.

## Future script update phase

Recommended after Phase 25AC, if approved:

```text
Phase 25AD — Read-Only Live Inspection Error Serialization Script Update Implementation Gate
```

Scope:

- Modify only `testing/discovery-read-only-live-inspection.mjs`.
- Improve error serialization.
- Do not broaden the table allowlist.
- Do not add application payload tables.
- Do not execute the script.
- No commit until Gemini approval.

## Future retry phase

Recommended only after script update and result documentation:

```text
Phase 25AF — Read-Only Live Infrastructure Inspection Retry Execution Gate
```

A retry should not occur before the error serialization update is planned, implemented, reviewed, committed, and pushed.

## Error serialization requirements

Future error serialization should include safe fields only.

Allowed error fields:

```text
table
check
status_column
status_value
ok
error_present
error_name
error_code
error_message_summary
error_details_summary
error_hint_summary
```

Rules:

- Each summary field must be sanitized.
- Each summary field must be length-bounded.
- Each summary field must be single-line.
- Each summary field must redact known environment variable values.
- Empty error strings should be normalized to `unavailable`.
- Undefined error fields should be normalized to `unavailable`.
- The serializer should avoid dumping raw error objects.
- The serializer should avoid stack traces.
- The serializer should avoid request headers.
- The serializer should avoid URLs that could contain tokens.
- The serializer should avoid row payloads.

Denied error fields:

```text
raw_error
stack
headers
request
response
body
raw_body
config
apikey
authorization
service_role_key
connection_string
```

## Diff-on-failure requirements

Future diff-on-failure output should compare the expected query contract to the actual aggregate result shape.

For each attempted status-count check, output:

```text
table
check
expected_status_column
expected_status_value
actual_query_succeeded
actual_count_if_succeeded
safe_error_if_failed
```

Important constraint:

The script should not claim to discover all actual live status values unless a separately approved safe aggregate method exists.

For the immediate next script update, the phrase `actual` should mean the result of the attempted aggregate query, not a row-level enumeration of all live statuses.

## Actual-value discovery constraint

The script must not add row-level status enumeration by default.

Avoid:

```text
select(status)
select(*)
select raw rows
distinct status row list
group-by status requiring row return
```

Unless a later phase explicitly approves a safe aggregate-only status discovery method.

For now, the safest update is improved serialization of why each attempted status-count query failed.

## First retry recommendation

The first retry after error serialization should keep the same allowlist:

```text
public.discovery_sources
public.discovery_runs
```

The first retry should keep the same table-level aggregate checks.

The first retry may either:

1. Keep the current `public.discovery_sources.status` attempted values and produce better serialized errors, or
2. Temporarily disable `public.discovery_sources.status` count checks only after Gemini approves that the first infrastructure probe should be count/timestamp-only for discovery sources.

Preferred recommendation:

```text
Improve error serialization first, then retry once to capture diagnostic error details.
```

## No broadening rule

The future script update must not broaden the inspection.

Do not add:

```text
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

Do not add:

```text
admin API calls
server startup
crawler execution
extraction execution
LLM execution
evidence acquisition
candidate staging
candidate decision execution
approve_for_draft
public writes
```

## Future implementation guardrails

A future implementation gate should verify:

- Only `testing/discovery-read-only-live-inspection.mjs` changed.
- `ALLOWED_TABLES` remains exactly `public.discovery_sources` and `public.discovery_runs`.
- Application payload tables remain absent from `ALLOWED_TABLES`.
- No mutation patterns are introduced.
- No admin API or local server patterns are introduced.
- No row-dump patterns are introduced.
- No `select('*')` usage is introduced.
- No broad `select(status)` enumeration is introduced.
- `node --check testing/discovery-read-only-live-inspection.mjs` passes.
- `npm run check` passes.
- No execution occurs in the implementation gate.

## Future result documentation requirement

After the future error-serialization implementation is committed and a retry is separately approved and executed, the next result documentation phase should document:

- exact approval phrase
- exact command
- exit code
- expected baseline
- script commit
- allowlist
- denied table list
- aggregate result count
- aggregate error count
- serialized error summaries
- no-secret-output confirmation
- no-row-output confirmation
- no-mutation confirmation
- no-admin-API confirmation
- no-crawler/extraction/candidate/publication confirmation
- final repo status
- recommendation for next phase

## Recommended next phase

Preferred next phase:

```text
Phase 25AC — Read-Only Live Inspection Error Serialization Script Update Planning Gate
```

Scope:

- Docs-only.
- Plan exact serializer function and result shape.
- Plan exact static checks.
- Plan exact Gemini review questions.
- No source changes.
- No testing script changes.
- No execution.
- No live read.
- No commit or push in the planning gate.

## Required Gemini review questions

1. Does Phase 25AB accurately classify Phase 25Z as a healthy failed-closed diagnostic result?
2. Is the conclusion correct that the immediate problem is insufficient error serialization for `public.discovery_sources.status` failures?
3. Are the allowed and denied error serialization fields safe enough?
4. Is the diff-on-failure contract safe if `actual` means attempted aggregate result rather than row-level live status enumeration?
5. Is it correct to avoid row-level status enumeration for now?
6. Should the next phase improve error serialization before modifying the `discovery_sources.status` contract?
7. Is it safe to proceed to Phase 25AC planning after James approval?

## Phase 25AB conclusion

Phase 25AB keeps the system halted after a controlled failed live-readiness probe.

The next step is not another retry.

The next step is an error-serialization planning phase so that the next approved retry can reveal safe diagnostic details without broadening the inspection or exposing sensitive data.
