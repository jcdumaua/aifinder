# Discovery Phase 25DC — Operational Reactivation Preflight Approval Gate

## Status

Documentation-only execution approval gate.

Phase 25DC follows Phase 25DB, which designed a no-write operational readiness preflight using local static and build checks only.

Phase 25DC defines the exact approval phrase and execution constraints for a future Phase 25DD preflight.

Phase 25DC does not execute the preflight.

Phase 25DC does not reactivate Discovery Engine operations.

Phase 25DC does not run live inspections.

Phase 25DC does not modify source code, schema, packages, generated types, or configuration.

## Scope

This phase is limited to approving the future execution conditions for Phase 25DD.

Allowed in this phase:

- Define the exact future approval phrase for Phase 25DD.
- Define the future execution boundaries.
- Define the future expected HEAD and subject binding rule.
- Define the one-run guard requirement.
- Define the non-secret result package requirements.
- Define required stop conditions.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No operational preflight execution.
- No operational reactivation.
- No live inspection rerun.
- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command.
- No broad environment scanning.
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
- No candidate extraction.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.

## Baseline

Phase 25DC starts after Phase 25DB was committed and pushed:

```text
HEAD=30318c2 Document Phase 25DB preflight design gate
HEAD full=30318c258d1fde00a8aac6edd85eae29cbf0732a
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DB designed the future preflight as:

```text
future_preflight_target=admin_only_no_write_operational_readiness_preflight
future_execution_mode=local_static_plus_build_preflight
live_db_read_allowed=false
admin_api_invocation_allowed=false
local_server_startup_allowed=false
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

## Future Phase 25DD approval requirement

Phase 25DD must not run unless James provides this exact phrase:

```text
Approve Phase 25DD bounded operational readiness preflight execution exactly once
```

No shortened phrase, paraphrase, or implied approval is sufficient.

The approval must occur after Phase 25DC is reviewed, approved, committed, and pushed.

## Future Phase 25DD expected HEAD rule

The Phase 25DD execution gate must use the committed Phase 25DC HEAD as its expected HEAD.

Because Phase 25DC is not committed yet while this document is being drafted, the future Phase 25DD execution script must be generated only after Phase 25DC commit and push completes.

The future execution script must hardcode:

- Expected branch: `main`
- Expected remote: `https://github.com/jcdumaua/aifinder.git`
- Expected HEAD: the Phase 25DC commit SHA
- Expected subject: the Phase 25DC commit subject
- Required future preflight target: `admin_only_no_write_operational_readiness_preflight`
- Required future execution mode: `local_static_plus_build_preflight`

## Future Phase 25DD allowed behavior

Phase 25DD may execute exactly one local static and build preflight if and only if the exact approval phrase is provided.

Allowed future behavior:

- Validate expected branch, origin, HEAD, and subject.
- Validate the working tree is clean.
- Safely load only required environment names from local env files without printing values.
- Validate required environment names are present without printing values.
- Confirm no unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Inspect tracked file inventory with `git ls-files`.
- Grep approved markers and prohibited markers in tracked local files.
- Run `npm run check`.
- Verify no tracked or untracked file changes occurred during execution.
- Produce a non-secret result package.
- Copy only the non-secret result package to clipboard.

## Future Phase 25DD prohibited behavior

Phase 25DD must not:

- Run more than once.
- Execute any verifier.
- Execute Supabase CLI.
- Execute psql.
- Execute SQL directly.
- Query the live database.
- Start a local server.
- Invoke admin APIs.
- Invoke public routes.
- Run browser automation.
- Run crawler execution.
- Run extraction execution.
- Run LLM execution.
- Acquire evidence from external services.
- Stage candidates.
- Execute candidate decisions.
- Execute approve_for_draft.
- Write public tools.
- Write discovered_tools.
- Mutate the database.
- Print raw environment values.
- Print keys, tokens, credentials, or database URLs.
- Print raw row payloads.
- Reactivate operations.

## Future Phase 25DD result package requirements

The future Phase 25DD result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DC committed HEAD>
expected_subject=<Phase 25DC committed subject>
future_preflight_target=admin_only_no_write_operational_readiness_preflight
future_execution_mode=local_static_plus_build_preflight
live_db_read_allowed=false
admin_api_invocation_allowed=false
local_server_startup_allowed=false
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
npm_check_status=passed|failed|not_run
final_git_status=<non-secret status>
values_printed=false
```

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, or live data.

## Future Phase 25DD one-run guard

The future execution wrapper must write a local run marker before execution.

If the run marker already exists for the bound Phase 25DC HEAD, the script must stop.

No retry is allowed without a new approval gate.

## Required follow-up after Phase 25DD

After any Phase 25DD execution attempt, the next phase must be:

```text
Phase 25DE — Operational Reactivation Preflight Result Review Gate
```

Phase 25DE must document:

- Whether Phase 25DD ran exactly once.
- The exact command wrapper used.
- The expected HEAD and subject.
- The future preflight target and execution mode.
- Whether `npm run check` passed.
- Whether the working tree remained unchanged.
- Whether any prohibited path was attempted.
- Whether any secret-like output was detected.
- Whether operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DC is approval-planning only.
- Phase 25DD has not executed.
- The preflight target is local-only and no-write.
- No live database read has been approved.
- No admin API invocation has been approved.
- No operational workflow has been approved.
- No candidate pipeline step has been approved.
- No public publishing step has been approved.
- No Phase 25DE result review exists.

## Recommended next phase

After Phase 25DC is reviewed, approved, committed, and pushed, the next phase may be:

```text
Phase 25DD — Bounded Operational Reactivation Preflight Execution Gate
```

Phase 25DD requires the exact approval phrase before execution:

```text
Approve Phase 25DD bounded operational readiness preflight execution exactly once
```

## Phase 25DC conclusion

Phase 25DC defines the future bounded local preflight execution approval gate.

This phase does not execute the preflight.

This phase does not run live checks.

This phase does not query the database.

This phase does not invoke admin APIs.

This phase does not start a local server.

This phase does not reactivate operations.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DC and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DC remains documentation-only.
- The exact future approval phrase is required: `Approve Phase 25DD bounded operational readiness preflight execution exactly once`.
- The future Phase 25DD execution must bind to the committed Phase 25DC HEAD and subject.
- The Phase 25DB `local_static_plus_build_preflight` boundaries are preserved.
- Live database reads, admin API invocation, local server startup, mutations, candidate pipeline activity, and publishing remain prohibited.
- The one-run guard, non-secret result package requirements, stop conditions, and Phase 25DE follow-up are sufficient.
- Operational reactivation remains blocked.

Phase 25DC is ready for commit after James approval.
