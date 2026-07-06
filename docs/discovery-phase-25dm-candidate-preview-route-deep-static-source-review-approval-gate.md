# Discovery Phase 25DM — Candidate Preview Route Deep Static Source Review Approval Gate

## Status

Documentation-only approval gate.

Phase 25DM follows Phase 25DL, which designed a future deep static source review for:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Phase 25DM defines the exact approval phrase and execution constraints for a future Phase 25DN deep static source review execution.

Phase 25DM does not execute the deep static source review.

Phase 25DM does not invoke routes.

Phase 25DM does not start a local server.

Phase 25DM does not query the live database.

Phase 25DM does not reactivate Discovery Engine operations.

Phase 25DM does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define the exact future approval phrase for Phase 25DN.
- Bind future Phase 25DN generation to the committed Phase 25DM HEAD and subject.
- Preserve the Phase 25DL deep static source review design.
- Preserve the candidate route path.
- Define future execution constraints, classifications, stop conditions, and result package requirements.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No deep static source review execution.
- No runtime validation.
- No operational execution.
- No operational reactivation.
- No route invocation.
- No local server startup.
- No live database read.
- No deployed route call.
- No admin API invocation.
- No browser automation.
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

Phase 25DM starts after Phase 25DL was committed and pushed:

```text
HEAD=38204db Document Phase 25DL candidate preview source review design
HEAD full=38204db80cb1fe268b1785bb382d3aaf30115063
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DL designed:

```text
future_deep_static_source_review_target=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_deep_static_source_review_scope=candidate_preview_route_and_direct_static_import_dependencies
future_deep_static_source_review_execution_allowed=false_in_phase_25dl
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Candidate route approval-gate report

```text
Candidate preview route approval-gate report
values_printed=false
source_lines_printed=false
deep_source_review_executed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_route_present=true
candidate_route_tracked=true
future_approval_phrase=Approve Phase 25DN candidate preview route deep static source review execution exactly once
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

## Future Phase 25DN approval requirement

Phase 25DN must not run unless James provides this exact phrase:

```text
Approve Phase 25DN candidate preview route deep static source review execution exactly once
```

No shortened phrase, paraphrase, or implied approval is sufficient.

The approval must occur after Phase 25DM is reviewed, approved, committed, and pushed.

## Future Phase 25DN expected HEAD rule

The Phase 25DN execution gate must use the committed Phase 25DM HEAD as its expected HEAD.

Because Phase 25DM is not committed yet while this document is being drafted, the future Phase 25DN execution script must be generated only after Phase 25DM commit and push completes.

The future execution script must hardcode:

- Expected branch: `main`
- Expected remote: `https://github.com/jcdumaua/aifinder.git`
- Expected HEAD: the Phase 25DM commit SHA
- Expected subject: the Phase 25DM commit subject
- Required route path: `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- Required review scope: `candidate_preview_route_and_direct_static_import_dependencies`

## Future Phase 25DN allowed behavior

Phase 25DN may execute exactly one local static source review if and only if the exact approval phrase is provided.

Allowed future behavior:

- Validate expected branch, origin, HEAD, and subject.
- Validate the working tree is clean.
- Safely load only required environment names from local env files without printing values.
- Validate required environment names are present without printing values.
- Confirm no unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Inspect the candidate route source file locally.
- Inspect direct static import dependencies referenced by the route.
- Use local static commands only.
- Search for route shape, auth, database access, helper dependency, mutation, operational execution, and data minimization markers.
- Run `npm run check`.
- Verify no tracked or untracked file changes occurred during execution.
- Produce a non-secret result package.
- Copy only the non-secret result package to clipboard.

## Future Phase 25DN prohibited behavior

Phase 25DN must not:

- Run more than once.
- Invoke the route.
- Start a local server.
- Call deployed routes.
- Call admin APIs.
- Call public routes.
- Import route modules for execution.
- Instantiate route handlers.
- Instantiate Supabase clients.
- Execute browser automation.
- Execute crawler code.
- Execute extraction code.
- Execute LLM code.
- Execute candidate staging.
- Execute candidate decisions.
- Execute approve_for_draft.
- Write public tools.
- Write discovered_tools.
- Query the live database.
- Mutate the database.
- Run Supabase CLI.
- Run psql.
- Execute SQL directly.
- Print raw environment values.
- Print keys, tokens, credentials, database URLs, cookies, or session material.
- Print raw live row payloads.
- Reactivate operations.

## Future Phase 25DN required classifications

The future deep static source review must classify the candidate route as exactly one of:

```text
candidate_preview_deep_static_classification=source_review_read_only_candidate
candidate_preview_deep_static_classification=source_review_mutation_capable_excluded
candidate_preview_deep_static_classification=source_review_operational_execution_capable_excluded
candidate_preview_deep_static_classification=source_review_auth_boundary_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_data_minimization_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_dependency_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_blocked_pending_manual_review
```

A route may be classified as `source_review_read_only_candidate` only if the future source review finds:

- No mutation path.
- No operational execution path.
- Admin-only protection is evident.
- Dynamic route parameter handling is bounded.
- Direct helper dependencies do not introduce side effects.
- Query scope and selected fields appear bounded.
- Runtime validation could be designed without printing raw live row payloads.

Even a `source_review_read_only_candidate` classification does not approve runtime validation.

## Future Phase 25DN stop conditions

Phase 25DN must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Candidate route path differs.
- Candidate route is missing.
- Candidate route is not tracked.
- Any required helper/import file is missing.
- Import dependency review cannot be completed with local static commands.
- Any mutation marker appears and cannot be safely explained as non-executable or excluded.
- Any operational execution marker appears and cannot be safely excluded.
- Authentication or authorization boundary is ambiguous.
- Data minimization is ambiguous.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.
- The one-run marker already exists.

## Future Phase 25DN result package requirements

The future result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DM committed HEAD>
expected_subject=<Phase 25DM committed subject>
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_deep_static_source_review_scope=candidate_preview_route_and_direct_static_import_dependencies
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
candidate_preview_deep_static_classification=<classification>
admin_auth_boundary_status=clear|ambiguous|blocked
mutation_path_status=not_detected|detected_excluded|ambiguous
operational_execution_path_status=not_detected|detected_excluded|ambiguous
data_minimization_status=clear|ambiguous|blocked
dependency_review_status=complete|ambiguous|blocked
npm_check_status=passed|failed|not_run
values_printed=false
operational_reactivation_status=blocked
```

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, cookies, session material, or unnecessary source excerpts.

## Required follow-up after Phase 25DN

After any Phase 25DN execution attempt, the next phase must be:

```text
Phase 25DO — Candidate Preview Route Deep Static Source Review Result Review Gate
```

Phase 25DO must document whether Phase 25DN ran exactly once, what classification was produced, whether `npm run check` passed, whether output stayed non-secret, whether the repo stayed clean, and whether operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DM is approval-planning only.
- Phase 25DN has not executed.
- No runtime validation is approved.
- No route invocation is approved.
- No local server startup is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.

## Recommended next phase

After Phase 25DM is reviewed, approved, committed, and pushed, the next phase may be:

```text
Phase 25DN — Candidate Preview Route Deep Static Source Review Execution Gate
```

Phase 25DN requires the exact approval phrase before execution:

```text
Approve Phase 25DN candidate preview route deep static source review execution exactly once
```

## Phase 25DM conclusion

Phase 25DM defines the future approval constraints for a route-specific deep static source review of:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

This phase does not execute the source review.

This phase does not authorize runtime validation.

This phase does not authorize operational reactivation.

This phase does not authorize route invocation.

This phase does not authorize live database reads.

This phase does not authorize admin API invocation.

This phase does not authorize local server startup.

This phase does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DM and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DM remains documentation-only.
- The exact future approval phrase is clearly mandated: `Approve Phase 25DN candidate preview route deep static source review execution exactly once`.
- Future Phase 25DN script generation must bind to the committed Phase 25DM HEAD and subject.
- Route invocation, server startup, live DB reads, mutations, candidate pipelines, and publishing remain prohibited.
- Stop conditions, one-run guard, non-secret output requirements, and classification result fields are sufficient.
- Operational reactivation remains blocked.
- Phase 25DN is the correct next step only after the exact approval phrase is supplied.

Phase 25DM is ready for commit after James approval.
