# Discovery Phase 25DR — Candidate Preview Route Mutation Marker Attribution Approval Gate

## Status

Documentation-only approval gate.

Phase 25DR follows Phase 25DQ, which designed a future source-only attribution review for the mutation marker and data-minimization ambiguity found in Phase 25DN.

Phase 25DR defines the exact approval phrase and execution constraints for a future Phase 25DS attribution execution.

Phase 25DR does not execute attribution.

Phase 25DR does not inspect source lines.

Phase 25DR does not remediate source code.

Phase 25DR does not perform runtime validation.

Phase 25DR does not invoke routes.

Phase 25DR does not start a local server.

Phase 25DR does not query the live database.

Phase 25DR does not reactivate Discovery Engine operations.

Phase 25DR does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define the exact future approval phrase for Phase 25DS.
- Bind future Phase 25DS generation to the committed Phase 25DR HEAD and subject.
- Preserve the Phase 25DQ attribution design.
- Preserve the candidate route path.
- Preserve the Phase 25DN reviewed dependency path.
- Define future execution constraints, one-run rules, classifications, stop conditions, source excerpt rules, and result package requirements.
- Preserve runtime validation as blocked.
- Preserve source remediation as blocked.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No attribution execution.
- No source line inspection.
- No source remediation.
- No source code changes.
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

Phase 25DR starts after Phase 25DQ was committed and pushed:

```text
HEAD=5a0a94b Document Phase 25DQ attribution design
HEAD full=5a0a94bf7da1270c7d688539626c085eb498ef20
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DQ designed:

```text
future_attribution_target=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_attribution_scope=candidate_preview_route_and_phase_25dn_reviewed_static_dependency_paths_only
future_attribution_execution_allowed=false_in_phase_25dq
source_remediation_allowed=false
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

## Candidate route approval report

```text
Candidate preview route mutation-marker attribution approval report
values_printed=false
source_lines_printed=false
attribution_execution_allowed=false_in_phase_25dr
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
phase_25dn_reviewed_dependency_path=app/api/admin/discovery/runs/[id]/candidate-preview/../../../../../../../lib/admin-auth.ts
candidate_route_present=true
candidate_route_tracked=true
future_approval_phrase=Approve Phase 25DS candidate preview route mutation marker attribution execution exactly once
future_attribution_scope=candidate_preview_route_and_phase_25dn_reviewed_static_dependency_paths_only
source_remediation_allowed=false
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

## Future Phase 25DS approval requirement

Phase 25DS must not run unless James provides this exact phrase:

```text
Approve Phase 25DS candidate preview route mutation marker attribution execution exactly once
```

No shortened phrase, paraphrase, or implied approval is sufficient.

The approval must occur after Phase 25DR is reviewed, approved, committed, and pushed.

## Future Phase 25DS expected HEAD rule

The Phase 25DS execution gate must use the committed Phase 25DR HEAD as its expected HEAD.

Because Phase 25DR is not committed yet while this document is being drafted, the future Phase 25DS execution script must be generated only after Phase 25DR commit and push completes.

The future execution script must hardcode:

- Expected branch: `main`
- Expected remote: `https://github.com/jcdumaua/aifinder.git`
- Expected HEAD: the Phase 25DR commit SHA
- Expected subject: the Phase 25DR commit subject
- Required candidate route path: `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- Required Phase 25DN reviewed dependency path: `app/api/admin/discovery/runs/[id]/candidate-preview/../../../../../../../lib/admin-auth.ts`
- Required attribution scope: `candidate_preview_route_and_phase_25dn_reviewed_static_dependency_paths_only`

## Future Phase 25DS allowed behavior

Phase 25DS may execute exactly one local source-only attribution if and only if the exact approval phrase is provided.

Allowed future behavior:

- Validate expected branch, origin, HEAD, and subject.
- Validate working tree is clean.
- Safely load only required environment names from local env files without printing values.
- Validate required environment names are present without printing values.
- Confirm no unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Inspect only the candidate route and Phase 25DN reviewed local dependency path.
- Use `grep`, `awk`, and `sed` only for tightly bounded marker-neighborhood attribution.
- Attribute the mutation marker source file and status.
- Attribute the data-minimization ambiguity.
- Run `npm run check`.
- Verify no tracked or untracked file changes occurred.
- Produce a non-secret result package.
- Copy only the non-secret result package to clipboard.

## Future Phase 25DS prohibited behavior

Phase 25DS must not:

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
- Print live row payloads.
- Print broad source excerpts or full files.
- Modify source code.
- Modify schema, migrations, packages, lockfiles, generated types, or configuration.
- Reactivate operations.

## Future source excerpt policy

Phase 25DS may include source excerpts only if all conditions are met:

- Excerpt is necessary for attribution.
- Excerpt is from tracked local source only.
- Excerpt is bounded to the smallest marker neighborhood needed.
- Excerpt does not include secrets, keys, tokens, credentials, database URLs, cookies, session material, raw live row payloads, or environment values.
- Excerpt is not a broad file dump.
- Excerpt passes secret-pattern scanning before any result package is copied to clipboard.

The preferred output is marker metadata without raw source lines when sufficient.

## Future Phase 25DS required classifications

The future attribution result must classify the mutation marker as exactly one of:

```text
mutation_marker_attribution=route_active_mutation_path
mutation_marker_attribution=dependency_active_mutation_path
mutation_marker_attribution=route_false_positive_text
mutation_marker_attribution=dependency_false_positive_text
mutation_marker_attribution=type_or_schema_text_only
mutation_marker_attribution=dead_or_unreachable_code_pending_manual_review
mutation_marker_attribution=ambiguous_requires_manual_review
```

The future attribution result must classify data minimization as exactly one of:

```text
data_minimization_attribution=bounded_output_confirmed
data_minimization_attribution=unbounded_output_confirmed
data_minimization_attribution=analyzer_limitation_likely
data_minimization_attribution=ambiguous_requires_manual_review
```

The future attribution result must recommend exactly one next action:

```text
attribution_next_action=plan_source_remediation_design
attribution_next_action=plan_static_criteria_refinement_design
attribution_next_action=abandon_candidate_preview_route_runtime_validation_path
attribution_next_action=manual_security_review_required
attribution_next_action=continue_blocked_no_action
```

The next action recommendation must not authorize source remediation, criteria changes, runtime validation, route invocation, live DB reads, or operational reactivation.

## Future Phase 25DS stop conditions

Phase 25DS must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Candidate route path differs.
- Candidate route is missing.
- Candidate route is not tracked.
- Phase 25DN reviewed dependency path cannot be resolved.
- Attribution cannot be completed with local static commands.
- Required marker cannot be found.
- More than a bounded marker neighborhood would need to be printed.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.
- The one-run marker already exists.

## Future Phase 25DS result package requirements

The future result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DR committed HEAD>
expected_subject=<Phase 25DR committed subject>
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
phase_25dn_reviewed_dependency_path=app/api/admin/discovery/runs/[id]/candidate-preview/../../../../../../../lib/admin-auth.ts
future_attribution_scope=candidate_preview_route_and_phase_25dn_reviewed_static_dependency_paths_only
mutation_marker_attribution=<classification>
data_minimization_attribution=<classification>
attribution_next_action=<classification>
source_remediation_allowed=false
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
npm_check_status=passed|failed|not_run
values_printed=false
operational_reactivation_status=blocked
```

The result package must not include secret values, raw environment values, keys, tokens, database URLs, live row payloads, cookies, session material, or broad source excerpts.

## Required follow-up after Phase 25DS

After any Phase 25DS execution attempt, the next phase must be:

```text
Phase 25DT — Candidate Preview Route Mutation Marker Attribution Result Review Gate
```

Phase 25DT must document whether Phase 25DS ran exactly once, what attribution classifications were produced, whether `npm run check` passed, whether output stayed non-secret, whether the repo stayed clean, and whether operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DR is approval-planning only.
- Phase 25DS has not executed.
- No source remediation is approved.
- No runtime validation is approved.
- No route invocation is approved.
- No local server startup is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.

## Recommended next phase

After Phase 25DR is reviewed, approved, committed, and pushed, the next phase may be:

```text
Phase 25DS — Candidate Preview Route Mutation Marker Attribution Execution Gate
```

Phase 25DS requires the exact approval phrase before execution:

```text
Approve Phase 25DS candidate preview route mutation marker attribution execution exactly once
```

## Phase 25DR conclusion

Phase 25DR defines the future approval constraints for a source-only attribution review of:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

This phase does not execute attribution.

This phase does not authorize source remediation.

This phase does not authorize runtime validation.

This phase does not authorize operational reactivation.

This phase does not authorize route invocation.

This phase does not authorize live database reads.

This phase does not authorize admin API invocation.

This phase does not authorize local server startup.

This phase does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DR and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DR remains documentation-only.
- The exact approval phrase for Phase 25DS is correctly mandated.
- Future Phase 25DS execution is bound to the committed Phase 25DR HEAD and subject.
- The target is strictly limited to the candidate route and the specific dependency path identified in Phase 25DN.
- Route invocation, DB reads, server startup, mutations, remediation, candidate pipelines, publishing, and operational reactivation remain prohibited.
- The source excerpt policy is strict and limited to minimal non-secret marker-neighborhood snippets.
- Required classification outputs and stop conditions are sufficient for a controlled execution environment.
- Phase 25DS is the correct next step only after Phase 25DR is committed and pushed and the exact approval phrase is supplied.

Phase 25DR is ready for commit after James approval.
