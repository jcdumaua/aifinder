# AiFinder Discovery Engine — Phase 25AE Read-Only Live Inspection Retry Approval / Preflight Gate

## Phase

Phase 25AE — Read-Only Live Inspection Retry Approval / Preflight Gate

## Status

Documentation artifact only.

This phase prepares the approval and preflight requirements for a future retry of the read-only live infrastructure inspection after the Phase 25AD error serialization update.

It does not run the inspection.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AD.
- Baseline commit: `4cffd2e`
- Baseline full commit: `4cffd2e05e723861ba36745b8d02404ea5bfeb49`
- Baseline subject: `Update read-only inspection error serialization`
- Phase 25AD result: structured safe error serialization was implemented and pushed to `main`.

## Prior live-read result

Phase 25Z was the first approved read-only live infrastructure inspection.

Result:

```text
FAILED CLOSED AFTER APPROVED AGGREGATE-ONLY READS
aggregate_result_count=15
aggregate_error_count=4
Node exit code=1
```

The failure was limited to `public.discovery_sources.status` aggregate status-count probes.

## Phase 25AD update now available

The inspection script now includes structured safe error serialization fields such as:

```text
actual_query_succeeded
actual_count_if_succeeded
error_present
error_name
error_code
error_message_summary
error_details_summary
error_hint_summary
```

The script still preserves:

```text
infrastructure-only allowlist
aggregate-only inspection
fail-nonzero on aggregate errors
no row-level status enumeration
no application payload tables
no mutation
no admin API
no local server
no crawler/extraction/candidate/public-tools operations
```

## Phase 25AE boundary

Allowed:

- Create this documentation file.
- Define retry approval requirements.
- Define retry command shape.
- Define retry preflight checks.
- Define result package requirements.
- Verify the current script static state without executing it.
- Run repository-local static checks such as `node --check` and `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No script execution.
- No live inspection retry.
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

## Future execution phase

Actual retry execution should be a separate phase:

```text
Phase 25AF — Read-Only Live Infrastructure Inspection Retry Execution Gate
```

Phase 25AF must not happen unless James provides this exact approval phrase:

```text
Approve run Phase 25AF read-only live infrastructure inspection retry.
```

## Future Phase 25AF command shape

The future execution wrapper should run the Node script exactly once with:

```bash
env AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1 \
node testing/discovery-read-only-live-inspection.mjs \
  --expected-head 4cffd2e \
  --expected-subject "Update read-only inspection error serialization" \
  --mode aggregate-only
```

If any approved commit happens before Phase 25AF execution, the expected head and subject must be updated to the latest pushed approved baseline.

## Future Phase 25AF preflight requirements

The execution wrapper must verify:

- Repo origin is `https://github.com/jcdumaua/aifinder.git`.
- Branch is `main`.
- HEAD matches the expected pushed baseline.
- HEAD subject matches the expected pushed subject.
- `origin/main` matches the expected pushed baseline.
- Ahead count is `0`.
- Behind count is `0`.
- Working tree is clean.
- No staged files exist.
- No `AIFINDER_RUN_DISCOVERY_*` variables are pre-set.
- Required environment variable names are present:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Environment variable values are never printed.
- `ALLOWED_TABLES` contains exactly:
  - `public.discovery_sources`
  - `public.discovery_runs`
- `ALLOWED_TABLES` excludes:
  - `public.discovery_candidate_tools`
  - `public.discovered_tools`
  - `public.tools`
- Structured error serialization markers are present.
- No row-level status enumeration patterns are present.
- No mutation/API/server/crawler/extraction/candidate/publishing patterns are present.
- The script passes `node --check`.
- The repository passes `npm run check`.

## Future Phase 25AF output requirements

The retry result package must include:

- exact approval phrase
- exact command
- exit code
- expected baseline
- actual HEAD
- script commit
- allowlist
- denied table list
- aggregate result count
- aggregate error count
- structured serialized error summaries
- no-secret-output confirmation
- no-row-output confirmation
- no-mutation confirmation
- no-admin-API confirmation
- no-crawler/extraction/candidate/publication confirmation
- final repo status
- recommendation for next phase

## Success criteria for Phase 25AF

Phase 25AF may pass if:

- all preflight checks pass,
- the script runs exactly once,
- aggregate result count is present,
- aggregate error count is `0`,
- PASS marker is present,
- final repo remains clean and synced,
- no secrets or row-level data appear in output.

## Expected controlled-failure criteria for Phase 25AF

Phase 25AF may fail closed if:

- preflight fails,
- the script exits non-zero,
- aggregate error count is greater than `0`,
- structured serialized error summaries are present,
- no secrets or row-level data appear in output,
- final repo remains clean and synced.

A failed closed retry should be documented in the next result documentation phase rather than retried automatically.

## No automatic retry rule

The future Phase 25AF wrapper must run the script exactly once.

No retry loop is allowed.

No second execution is allowed unless James explicitly approves a new future execution phase.

## Result documentation after Phase 25AF

Recommended next result documentation phase:

```text
Phase 25AG — Read-Only Live Infrastructure Inspection Retry Result Documentation
```

Phase 25AG should document either:

- successful retry result, or
- failed-closed retry result with structured error serialization.

## Required Gemini review questions

1. Does Phase 25AE correctly remain docs-only with no live inspection retry?
2. Is the future approval phrase strict enough?
3. Is the future Phase 25AF command shape correct?
4. Are the future Phase 25AF preflight checks sufficient?
5. Are the output and result package requirements sufficient?
6. Is the no-automatic-retry rule strong enough?
7. Is it safe to proceed to Phase 25AF execution only after James provides the exact approval phrase?

## Phase 25AE conclusion

Phase 25AE prepares retry approval and preflight requirements only.

The Discovery Engine remains halted after Phase 25Z until a separate exact approval phrase authorizes Phase 25AF.

No live read occurs in Phase 25AE.
