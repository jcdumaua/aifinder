# AiFinder Discovery Engine — Phase 25AC Read-Only Live Inspection Error Serialization Script Update Planning Gate

## Phase

Phase 25AC — Read-Only Live Inspection Error Serialization Script Update Planning Gate

## Status

Documentation artifact only.

This phase plans the future implementation update for safe error serialization in `testing/discovery-read-only-live-inspection.mjs`.

It does not modify the script.

It does not rerun the inspection.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AB.
- Baseline commit: `2d8b8bc`
- Baseline full commit: `2d8b8bc4fa4130fa88b799f9922bfffc3e33a850`
- Baseline subject: `Document Phase 25AB error serialization planning`
- Phase 25AB result: failure review and error serialization planning was committed and pushed to `main`.

## Prior failure being addressed

Phase 25Z recovery execution reached the approved aggregate-only live read and failed closed:

```text
FAILED CLOSED AFTER APPROVED AGGREGATE-ONLY READS
aggregate_result_count=15
aggregate_error_count=4
Node exit code=1
```

Failed checks:

```text
public.discovery_sources status_count:status:active ok=false error_class=""
public.discovery_sources status_count:status:inactive ok=false error_class=""
public.discovery_sources status_count:status:paused ok=false error_class=""
public.discovery_sources status_count:status:blocked ok=false error_class=""
```

Phase 25AB concluded:

```text
Do not retry Phase 25Z yet.
Plan safe error serialization first.
Do not broaden the allowlist.
Do not add row-level status enumeration by default.
```

## Phase 25AC boundary

Allowed:

- Create this documentation file.
- Plan a future script update.
- Define the serializer function behavior.
- Define the safe error object shape.
- Define diff-on-failure output for attempted aggregate checks.
- Define static verification checks for the future implementation gate.
- Define Gemini review questions for the future implementation.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No script implementation.
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

## Future implementation phase

Recommended next implementation phase after Phase 25AC is approved and committed:

```text
Phase 25AD — Read-Only Live Inspection Error Serialization Script Update Implementation Gate
```

Phase 25AD should modify only:

```text
testing/discovery-read-only-live-inspection.mjs
```

Phase 25AD must not execute the script.

## Future implementation goal

Improve diagnostic clarity for failed aggregate checks without broadening the live inspection.

The script should preserve the current behavior:

- Fail non-zero if any aggregate check returns an error.
- Print aggregate result objects.
- Keep the allowlist infrastructure-only.
- Avoid application payload tables.
- Avoid row-level enumeration.

The script should improve only the error serialization shape.

## Current problem

The current status-count failure output can produce empty diagnostic data:

```json
{"table":"public.discovery_sources","check":"status_count:status:active","ok":false,"error_class":""}
```

This does not provide enough information to diagnose whether the failure is:

- missing `status` column,
- incompatible status column type,
- invalid enum/text comparison,
- RLS/policy issue,
- PostgREST query error,
- schema drift,
- Supabase client serialization issue,
- unexpected empty error object.

## Planned serializer functions

Future implementation should add or update helper functions with names similar to:

```text
safeOneLine(value)
sanitizeSummary(value, maxLength)
safeErrorField(error, fieldName)
serializeSupabaseError(error, context)
serializeStatusCountResult({ item, statusValue, count, error })
```

Exact names can differ if the implementation is clearer.

## `safeOneLine(value)` behavior

Input:

```text
unknown JavaScript value
```

Output:

```text
single-line string
```

Rules:

- Convert `undefined` to `unavailable`.
- Convert `null` to `unavailable`.
- Convert empty string to `unavailable`.
- Convert non-string primitives using `String(value)`.
- Convert objects only through explicitly selected fields, not raw JSON dumps.
- Replace newline, carriage return, tab, and repeated whitespace with a single space.
- Trim leading and trailing whitespace.
- If result is empty after trim, return `unavailable`.

## `sanitizeSummary(value, maxLength)` behavior

Input:

```text
unknown value
maximum length
```

Output:

```text
single-line redacted summary
```

Rules:

- Call `safeOneLine(value)` first.
- Redact known environment variable values.
- Redact `NEXT_PUBLIC_SUPABASE_URL` value if present.
- Redact `SUPABASE_SERVICE_ROLE_KEY` value if present.
- Redact `AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION` value if present.
- Redact bearer-like tokens if present.
- Redact service-role-like JWT fragments if present.
- Length-bound the final output.
- Append a truncation marker such as `[truncated]` if shortened.
- Never return raw stack traces.
- Never return request headers.
- Never return raw response bodies.

## `serializeSupabaseError(error, context)` output shape

Future failed aggregate checks should output this shape:

```json
{
  "table": "public.discovery_sources",
  "check": "status_count",
  "status_column": "status",
  "status_value": "active",
  "ok": false,
  "actual_query_succeeded": false,
  "actual_count_if_succeeded": "unavailable",
  "error_present": true,
  "error_name": "unavailable",
  "error_code": "unavailable",
  "error_message_summary": "unavailable",
  "error_details_summary": "unavailable",
  "error_hint_summary": "unavailable"
}
```

If the Supabase error contains safe fields, those fields should replace `unavailable` after sanitization.

Allowed fields:

```text
table
check
status_column
status_value
ok
actual_query_succeeded
actual_count_if_succeeded
error_present
error_name
error_code
error_message_summary
error_details_summary
error_hint_summary
```

Denied fields:

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

## Successful status-count result shape

Future successful status-count checks should output:

```json
{
  "table": "public.discovery_runs",
  "check": "status_count",
  "status_column": "status",
  "status_value": "completed",
  "ok": true,
  "actual_query_succeeded": true,
  "actual_count_if_succeeded": 2,
  "error_present": false,
  "error_name": "unavailable",
  "error_code": "unavailable",
  "error_message_summary": "unavailable",
  "error_details_summary": "unavailable",
  "error_hint_summary": "unavailable"
}
```

This creates a stable diff-on-failure format where success and failure objects have the same safe fields.

## Existing result compatibility

The future script may keep the current check names for compatibility:

```text
status_count:status:active
```

But it should add structured fields:

```text
check=status_count
status_column=status
status_value=active
```

Preferred result shape:

```json
{
  "table": "public.discovery_sources",
  "check": "status_count",
  "legacy_check": "status_count:status:active",
  "status_column": "status",
  "status_value": "active"
}
```

If adding `legacy_check` makes the output too noisy, the script may omit it, but result documentation should then note the change.

## Diff-on-failure meaning

For Phase 25AD, `actual` must mean:

```text
the result of the attempted aggregate query
```

It must not mean:

```text
enumeration of all live status values
```

Do not add row-level or distinct status discovery by default.

## No row-level enumeration rule

The future script update must not introduce:

```text
select('*')
select('status')
select raw rows
distinct status row list
group-by status requiring row return
row payload dumps
candidate payloads
tool payloads
```

The existing count and timestamp checks are acceptable because they already exist and stayed inside the approved infrastructure-only allowlist.

## No allowlist broadening rule

The future script update must keep `ALLOWED_TABLES` exactly:

```text
public.discovery_sources
public.discovery_runs
```

It must not add:

```text
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

## No operational broadening rule

The future script update must not add:

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
discovered_tools writes
Supabase RPC calls
Supabase insert/update/delete/upsert calls
SQL execution
```

## Future implementation static checks

Phase 25AD implementation gate should verify:

- Only `testing/discovery-read-only-live-inspection.mjs` changed.
- `ALLOWED_TABLES` contains exactly two labels.
- `public.discovery_sources` remains allowlisted.
- `public.discovery_runs` remains allowlisted.
- `public.discovery_candidate_tools` is absent from `ALLOWED_TABLES`.
- `public.discovered_tools` is absent from `ALLOWED_TABLES`.
- `public.tools` is absent from `ALLOWED_TABLES`.
- `select('*')` is absent.
- `select('status')` row enumeration is absent.
- `.insert(` is absent.
- `.update(` is absent.
- `.delete(` is absent.
- `.upsert(` is absent.
- `.rpc(` is absent.
- `fetch(` is absent.
- `createServer(` is absent.
- `next dev` is absent.
- `supabase db` is absent.
- `node --check testing/discovery-read-only-live-inspection.mjs` passes.
- `npm run check` passes.
- The script is not executed.

## Future implementation review questions

Gemini should review Phase 25AD for:

1. Whether only `testing/discovery-read-only-live-inspection.mjs` changed.
2. Whether the serializer improves diagnostics without leaking secrets.
3. Whether the serializer avoids raw error dumps and stack traces.
4. Whether the output remains aggregate-only.
5. Whether the allowlist remains exactly infrastructure-only.
6. Whether row-level status enumeration remains absent.
7. Whether mutation/API/server/crawler/extraction/candidate/publishing paths remain absent.
8. Whether it is safe to commit the script update after James approval.
9. Whether a future retry should keep or remove `discovery_sources.status` counts.

## Future retry planning

No retry should occur in Phase 25AD.

After Phase 25AD is reviewed, committed, and pushed, the next phase should be result documentation for implementation or a retry preflight gate.

Preferred sequence:

```text
Phase 25AD — Error Serialization Script Update Implementation Gate
Phase 25AE — Error Serialization Script Update Result Documentation
Phase 25AF — Read-Only Live Infrastructure Inspection Retry Approval / Execution Gate
Phase 25AG — Retry Result Documentation
```

## Future retry command policy

If Phase 25AF retry is later approved, it should:

- Use the latest pushed baseline at that time.
- Use the same exact two-table allowlist.
- Run the Node script exactly once.
- Use the dedicated guard variable.
- Produce a redacted result package.
- No commit.
- No push.
- No retry loop.
- Stop on non-zero exit.

## Phase 25AC conclusion

Phase 25AC defines a safe implementation plan for improving error serialization.

It keeps the system halted after Phase 25Z.

It does not relax the status contract.

It does not broaden the inspection.

It does not execute any live read.

The next safe step is Gemini review of this plan, then a separate Phase 25AD implementation gate only after James approval.
