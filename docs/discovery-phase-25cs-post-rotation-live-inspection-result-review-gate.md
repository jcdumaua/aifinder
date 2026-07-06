# Discovery Phase 25CS — Post-Rotation Live Inspection Result Review Gate

## Status

Documentation-only result review gate.

Phase 25CS documents the Phase 25CR post-rotation read-only live inspection rerun outcome after the successful v8 wrapper reached the tracked inspection harness, validated required local environment presence without printing values, and executed the aggregate-only read-only infrastructure inspection.

Phase 25CS does not reactivate Discovery Engine operations.

## Scope

This phase is limited to documenting and reviewing the Phase 25CR read-only live inspection result.

Allowed in this phase:

- Document the Phase 25CR wrapper recovery sequence.
- Document that v8 reached the read-only inspection harness.
- Document the aggregate-only read-only infrastructure result.
- Document the controlled failure result.
- Preserve operational reactivation as blocked.
- Recommend the next planning phase.

Not allowed in this phase:

- No verifier execution.
- No additional live inspection rerun.
- No Supabase CLI.
- No psql.
- No SQL command.
- No environment scanning.
- No environment variable value disclosure.
- No source changes.
- No API changes.
- No UI changes.
- No schema changes.
- No migration changes.
- No package or lockfile changes.
- No generated type changes.
- No inspection harness changes.
- No DB mutation.
- No public tools writes.
- No discovered_tools writes.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.
- No operational reactivation.

## Baseline

Phase 25CR was run from the Phase 25CQ approval-gate baseline:

```text
HEAD=fa720e1 Document Phase 25CQ live inspection rerun approval gate
HEAD full=fa720e1efc217c207e58175b010a2c66f1db606d
ahead=0
behind=0
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

The tracked read-only inspection harness was:

```text
testing/discovery-read-only-live-inspection.mjs
```

## Approval and wrapper recovery sequence

The approved execution phrase was supplied exactly:

```text
Approve Phase 25CR read-only live inspection rerun exactly once
```

The initial Phase 25CR wrapper and recovery attempts failed closed before producing a final inspection result until v8:

1. Initial wrapper failed before inspection because the derived opt-in env name was empty.
2. Recovery v2 failed closed because opt-in inference found both an incomplete prefix candidate and the valid opt-in candidate.
3. Recovery v3 reached the harness but failed closed because `--expected-head` was required.
4. Recovery v4 reached the harness but failed closed because `--mode aggregate-only` was required.
5. Recovery v5 reached the harness and stopped at environment preflight because required environment variables were missing.
6. Recovery v6 stopped before execution because required env vars were not inherited into the script process.
7. Recovery v7 prompted for env values and reached aggregate read-only results, but failed because the supplied Supabase URL was not a valid HTTP/HTTPS URL.
8. Recovery v8 prompted internally, trimmed/normalized hidden input, validated the Supabase URL format without printing values, and reached aggregate-only read-only infrastructure results.

## Phase 25CR v8 execution evidence

The Phase 25CR v8 wrapper reported:

```text
Log: /tmp/aifinder-phase-25cr-post-rotation-read-only-live-inspection-rerun-execution-recovery-v8-validate-url-20260705-183940.log
Raw inspection log: /tmp/aifinder-phase-25cr-read-only-live-inspection-raw-recovery-v8-20260705-183940.log
Result package: /tmp/aifinder-phase-25cr-post-rotation-read-only-live-inspection-rerun-execution-recovery-v8-validate-url-result-package-20260705-183940.txt
```

The wrapper validated:

```text
NEXT_PUBLIC_SUPABASE_URL format check passed without printing value.
SUPABASE_SERVICE_ROLE_KEY presence check passed without printing value.
```

The harness preflight passed:

```text
terminal_workflow=read_only_live_inspection
operational_mode=aggregate_only
probe_scope=infrastructure_only
error_serialization=structured_safe_summaries
no_mutation=true
no_admin_api_invocation=true
no_local_server_startup=true
no_crawler_extraction_candidate_or_publishing_execution=true
```

The repo preflight passed:

```text
expected_head=fa720e1efc217c207e58175b010a2c66f1db606d
expected_subject=Document Phase 25CQ live inspection rerun approval gate
actual_head_short=fa720e1
actual_head_full=fa720e1efc217c207e58175b010a2c66f1db606d
actual_subject=Document Phase 25CQ live inspection rerun approval gate
ahead_count=0
behind_count=0
repo_state_check=passed
```

Environment preflight passed without printing values:

```text
allowed_guard_present=true :: AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION
env_name_present=true :: NEXT_PUBLIC_SUPABASE_URL
env_name_present=true :: SUPABASE_SERVICE_ROLE_KEY
```

Allowlist preflight passed:

```text
probe_scope=infrastructure_only
table_allowlist_count=2
table_allowlisted=true :: public.discovery_sources
table_allowlisted=true :: public.discovery_runs
table_denied=true :: public.discovery_candidate_tools
table_denied=true :: public.discovered_tools
table_denied=true :: public.tools
```

## Aggregate-only read-only result

The inspection produced 15 aggregate results and 4 aggregate errors:

```text
aggregate_result_count=15
aggregate_error_count=4
FAILED: one or more aggregate read-only infrastructure checks returned errors
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

## Interpretation

Phase 25CR v8 confirms that the wrapper could reach the post-rotation Supabase project with valid local environment values and execute the tracked read-only inspection harness in aggregate-only mode.

The result is not a pass.

The result is a controlled failure caused by the latest timestamp aggregate checks returning `PGRST125` with the safe summary `Invalid path specified in request URL`.

The total count and status count checks succeeded for both allowlisted infrastructure tables:

- `public.discovery_sources`
- `public.discovery_runs`

This suggests that basic allowlisted read-only aggregate access was available for the count/status checks, but the latest timestamp query shape or request path used by the harness is not compatible with the current Data API request behavior.

This phase does not conclude that operational reactivation is safe.

Operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked because:

- The Phase 25CR aggregate-only inspection exited non-zero.
- Four allowlisted infrastructure checks failed.
- The latest timestamp evidence was not captured successfully.
- No result review has been approved yet.
- No follow-up planning has reviewed the `PGRST125` latest timestamp failure path.
- No corrected inspection rerun has been approved.

## Security and safety observations

The Phase 25CR v8 wrapper preserved the intended boundaries:

- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command by wrapper.
- No environment scanning.
- No environment variable values printed.
- No source/schema/package/script/type changes by wrapper.
- No DB mutation requested by wrapper.
- No public publishing.
- No candidate decision execution.
- No operational reactivation.

The tracked harness also preserved its declared boundary:

- Aggregate read-only infrastructure inspection only.
- No application payload tables.
- No DB mutation.
- No admin API invocation.
- No local server startup.
- No crawler execution.
- No extraction execution.
- No LLM execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public tools writes.
- No discovered_tools writes.
- No row-level status enumeration.

## Required follow-up

The next phase should be a documentation-only planning gate:

```text
Phase 25CT — Read-Only Inspection Latest Timestamp Query Compatibility Planning Gate
```

Phase 25CT should:

- Review the tracked harness latest timestamp query shape.
- Determine why the latest timestamp checks produce `PGRST125 Invalid path specified in request URL`.
- Plan a minimal, bounded future harness adjustment if needed.
- Keep all live reruns blocked until a separate approval gate.
- Avoid any DB mutation or operational reactivation.
- Avoid any source/API/UI/schema/migration/package/lockfile/generated type changes unless explicitly scoped in a later implementation phase.

## Phase 25CS conclusion

Phase 25CS documents a safe, controlled, non-passing Phase 25CR live inspection result.

Credential rotation remains closed for planning purposes only.

Read-only infrastructure access partially succeeded for aggregate count/status checks.

The latest timestamp checks failed with safe structured error summaries.

Discovery Engine operational reactivation remains blocked.

Next recommended phase:

```text
Phase 25CT — Read-Only Inspection Latest Timestamp Query Compatibility Planning Gate
```

## Gemini approval

Gemini reviewed Phase 25CS and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25CS remains documentation-only.
- The Phase 25CR v8 inspection result is accurately captured as a controlled failure.
- The `PGRST125` latest-timestamp failures are correctly distinguished from successful aggregate count/status checks.
- No operational reactivation readiness is claimed.
- Discovery Engine operational reactivation remains blocked.
- No secrets, environment values, or restricted operational details are exposed.
- Phase 25CT is the correct next planning phase for the latest timestamp query compatibility issue.

Phase 25CS is ready for commit after James approval.
