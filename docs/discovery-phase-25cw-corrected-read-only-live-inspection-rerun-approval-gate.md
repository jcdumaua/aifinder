# Discovery Phase 25CW — Corrected Read-Only Live Inspection Rerun Approval Gate

## Status

Documentation-only approval gate.

Phase 25CW defines the approval conditions for a future corrected read-only live inspection rerun after the Phase 25CV harness compatibility fix.

Phase 25CW does not run the inspection.

Phase 25CW does not execute the verifier.

Phase 25CW does not reactivate Discovery Engine operations.

## Scope

This phase is limited to documenting the future approval gate for Phase 25CX.

Allowed in this phase:

- Document that Phase 25CV was committed and pushed.
- Define the exact future approval phrase for Phase 25CX.
- Define the future command boundary.
- Define the future expected HEAD/subject handling rule.
- Define required stop conditions.
- Define required result-review follow-up.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No live inspection rerun.
- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command.
- No environment scanning.
- No environment value printing.
- No source code changes.
- No inspection harness changes.
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

Phase 25CW starts after Phase 25CV was committed and pushed:

```text
HEAD=5e05447 Fix Phase 25CV timestamp presence inspection
HEAD full=5e05447f064d3ee063353bae4ade5640c9d98f75
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25CV modified only:

```text
testing/discovery-read-only-live-inspection.mjs
```

Phase 25CV implementation summary:

- Replaced the latest timestamp row-returning ordered lookup with a head-only exact count over non-null timestamp presence.
- Preserved `latest_created_at` and `latest_updated_at` check names.
- Preserved `value_present` output.
- Redacted count output as `redacted_presence_only`.
- Did not print raw timestamp values.
- Did not print row payloads.
- Preserved allowlist and denylist markers.
- Did not rerun the live inspection.
- Did not reactivate operations.

## Future Phase 25CX approval requirement

Phase 25CX must not run unless James provides this exact phrase:

```text
Approve Phase 25CX corrected read-only live inspection rerun exactly once
```

No shortened phrase, paraphrase, or implied approval is sufficient.

The approval must occur after Phase 25CW is committed and pushed.

## Future Phase 25CX expected HEAD rule

The Phase 25CX execution gate must use the committed Phase 25CW HEAD as its expected HEAD.

Because Phase 25CW is not committed yet while this document is being drafted, the future Phase 25CX execution script must be generated only after Phase 25CW commit and push completes.

The future execution script must hardcode:

- Expected branch: `main`
- Expected remote: `https://github.com/jcdumaua/aifinder.git`
- Expected HEAD: the Phase 25CW commit SHA
- Expected subject: the Phase 25CW commit subject
- Required mode: `aggregate-only`
- Required opt-in guard: `AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1`

## Future Phase 25CX command boundary

The future command must run the tracked inspection harness only:

```text
testing/discovery-read-only-live-inspection.mjs
```

The future command must include:

```text
--expected-head <Phase 25CW committed HEAD>
--expected-subject <Phase 25CW committed subject>
--mode aggregate-only
--max-output-lines 300
```

The future wrapper may prompt locally for required environment values only if missing.

The future wrapper must not print environment values.

## Future Phase 25CX allowed behavior

Phase 25CX may execute exactly one corrected read-only live infrastructure inspection if and only if the exact approval phrase is provided.

Allowed behavior:

- Set only the required opt-in guard for the inspection subprocess.
- Validate expected HEAD and expected subject.
- Validate branch and origin.
- Validate the working tree is clean.
- Validate no unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Validate required environment names are present without printing values.
- Run the tracked read-only inspection harness once.
- Capture a non-secret raw log and result package.
- Preserve the harness allowlist and denylist checks.
- Preserve aggregate-only output.

## Future Phase 25CX prohibited behavior

Phase 25CX must not:

- Run more than once.
- Execute any verifier.
- Execute Supabase CLI.
- Execute psql.
- Execute SQL directly.
- Start a local server.
- Invoke admin APIs.
- Run crawler execution.
- Run extraction execution.
- Run LLM execution.
- Acquire evidence.
- Stage candidates.
- Execute candidate decisions.
- Execute approve_for_draft.
- Write public tools.
- Write discovered_tools.
- Mutate the database.
- Print raw environment values.
- Print keys, tokens, credentials, or database URLs.
- Print raw row payloads.
- Print raw timestamp values.
- Reactivate operations.

## Expected successful corrected result shape

If the Phase 25CV compatibility fix works, the corrected inspection should preserve the same total result count unless the harness changes again:

```text
aggregate_result_count=15
aggregate_error_count=0
```

The latest timestamp checks should report safe metadata only:

```text
check=latest_created_at
ok=true
actual_query_succeeded=true
value_present=true|false
actual_count_if_succeeded=redacted_presence_only
```

```text
check=latest_updated_at
ok=true
actual_query_succeeded=true
value_present=true|false
actual_count_if_succeeded=redacted_presence_only
```

The result must not print raw timestamp values.

The result must not print row payloads.

## Acceptable non-passing corrected result

If the corrected rerun still fails, that is acceptable as a controlled result.

A non-passing Phase 25CX result must be documented in a later Phase 25CY result review gate.

No retry is allowed without a new approval gate.

No operational reactivation may be inferred from a partial or failed result.

## Required follow-up after Phase 25CX

After any Phase 25CX execution, the next phase must be:

```text
Phase 25CY — Corrected Read-Only Live Inspection Rerun Result Review Gate
```

Phase 25CY must document:

- Whether Phase 25CX ran exactly once.
- The exact command wrapper used.
- The expected HEAD and subject.
- The aggregate result count.
- The aggregate error count.
- Whether latest timestamp checks passed with `value_present` metadata only.
- Whether any safe error summaries were returned.
- Whether any secret-like output was detected.
- Whether operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25CX has not run.
- No corrected inspection result exists yet.
- No Phase 25CY result review exists yet.
- No reactivation review gate has cleared operational reactivation.

## Recommended next phase

After Phase 25CW is reviewed, approved, committed, and pushed, the next phase may be:

```text
Phase 25CX — Corrected Read-Only Live Inspection Rerun Execution Gate
```

Phase 25CX requires the exact approval phrase before execution:

```text
Approve Phase 25CX corrected read-only live inspection rerun exactly once
```

## Phase 25CW conclusion

Phase 25CW defines the future corrected read-only live inspection rerun approval gate.

This phase does not execute the rerun.

This phase does not modify the harness.

This phase does not reactivate operations.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25CW and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25CW remains documentation-only.
- The phase defines future execution conditions without performing the corrected inspection.
- The exact Phase 25CX approval phrase is required.
- Commit-SHA binding is required for the future execution gate.
- Aggregate-only and infrastructure-only constraints are preserved.
- Operational reactivation remains blocked.
- A Phase 25CY result review is required after any Phase 25CX execution.

Phase 25CW is ready for commit after James approval.
