# Discovery Phase 25DQ — Candidate Preview Route Mutation Marker Attribution Design Gate

## Status

Documentation-only attribution design gate.

Phase 25DQ follows Phase 25DP, which selected mutation-marker and data-minimization attribution design as the safest next step after Phase 25DN produced a controlled non-passing result.

Phase 25DQ designs a future attribution review.

Phase 25DQ does not execute the attribution review.

Phase 25DQ does not inspect source lines.

Phase 25DQ does not remediate source code.

Phase 25DQ does not perform runtime validation.

Phase 25DQ does not invoke routes.

Phase 25DQ does not start a local server.

Phase 25DQ does not query the live database.

Phase 25DQ does not reactivate Discovery Engine operations.

Phase 25DQ does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define future attribution review target.
- Define future attribution objectives.
- Define future allowed source-only attribution methods.
- Define future source excerpt limitations.
- Define future attribution classifications.
- Define future stop conditions.
- Define future result package requirements.
- Preserve runtime validation as blocked.
- Preserve source remediation as blocked.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No source line inspection.
- No source attribution execution.
- No source remediation.
- No source code changes.
- No static source review execution.
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

Phase 25DQ starts after Phase 25DP was committed and pushed:

```text
HEAD=63aedeb Document Phase 25DP remediation scope decision
HEAD full=63aedeb639791607e974ad987d693e517b48b08e
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DP selected:

```text
next_scope_decision=advance_to_candidate_preview_route_mutation_marker_attribution_design
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
phase_25dn_classification=source_review_mutation_capable_excluded
phase_25dn_mutation_path_status=detected_excluded
phase_25dn_data_minimization_status=ambiguous
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

## Candidate route design report

```text
Candidate preview route attribution design report
values_printed=false
source_lines_printed=false
attribution_review_executed=false
source_remediation_executed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_route_present=true
candidate_route_tracked=true
phase_25dn_classification=source_review_mutation_capable_excluded
phase_25dn_mutation_path_status=detected_excluded
phase_25dn_data_minimization_status=ambiguous
phase_25dp_decision=advance_to_candidate_preview_route_mutation_marker_attribution_design
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

## Attribution design report

```text
Mutation marker and data-minimization attribution design constraints
values_printed=false
source_lines_printed=false
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

future_attribution_objectives:
- attribute mutation marker to reviewed file path
- determine active_code_vs_false_positive_status
- attribute missing select marker to route behavior or analyzer limitation
- decide whether remediation design, criteria refinement, or route abandonment should follow

future_attribution_output_limits:
- no secret values
- no raw environment values
- no live row payloads
- no cookies or session material
- no broad source excerpts
- source snippets allowed only as minimal non-secret marker-neighborhood excerpts if separately approved
```

## Future attribution target

The future attribution review target is:

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

The future attribution review must be source-only.

It must not execute source code.

It must not invoke the route.

It must not start a server.

It must not query a database.

It must not remediate code.

## Phase 25DN facts to attribute

The future attribution review should explain these Phase 25DN findings:

```text
candidate_preview_deep_static_classification=source_review_mutation_capable_excluded
mutation_path_status=detected_excluded
data_minimization_status=ambiguous
mutation_marker_count=1
select_marker_count=0
wildcard_select_marker_count=0
source_files_reviewed_count=2
dependency_review_status=complete
```

The future attribution review must determine whether:

- The mutation marker came from the route file.
- The mutation marker came from the imported admin-auth helper.
- The mutation marker is in active executable code.
- The mutation marker is in dead code.
- The mutation marker is in comments, strings, type-only text, or unrelated identifier text.
- The mutation marker represents true mutation capability.
- The mutation marker is a false positive under the original Phase 25DN scan.
- The missing select marker means the route has ambiguous data minimization.
- The missing select marker means the analyzer failed to recognize a bounded response shape.
- The route should remain blocked, be remediated, have criteria refined, or be abandoned for runtime validation.

## Future allowed attribution methods

A future attribution execution may use local static commands only.

Allowed methods may include:

```text
git fetch origin main --quiet
git status --short --branch --untracked-files=all
git rev-parse HEAD
git log -1 --pretty=%s
git ls-files
grep with line numbers and tightly scoped patterns
awk for bounded marker-neighborhood extraction
sed for bounded marker-neighborhood extraction
wc for line counts only
npm run check
```

Allowed source inspection must be limited to:

- The candidate route path.
- The Phase 25DN resolved local dependency path.
- Pattern neighborhoods around the exact detected marker.
- Pattern neighborhoods around data-minimization response construction.
- Import statements needed to confirm reviewed files.
- No broad source dump.

## Future source excerpt policy

A future attribution execution may include source excerpts only if all conditions are met:

- Excerpt is necessary to attribute the marker.
- Excerpt is local source only.
- Excerpt is not from an environment file.
- Excerpt does not include secrets, keys, tokens, database URLs, cookies, session material, or live row payloads.
- Excerpt is bounded to the minimum line neighborhood needed.
- Excerpt is not a broad file dump.
- Excerpt is included only in a non-secret result package after secret-pattern scanning.

The preferred result format is still marker metadata without raw source lines when sufficient.

## Future prohibited behavior

A future attribution execution must prohibit:

```text
npm run dev
npm run start
next dev
next start
curl
wget
playwright
browser automation
supabase
psql
SQL command execution
node scripts that invoke routes
node scripts that query the database
route invocation
admin API invocation
public route invocation
module import execution
candidate extraction
candidate staging
candidate decision execution
approve_for_draft
public publishing
DB mutation
source remediation
source code edits
package edits
schema edits
migration edits
type generation
```

## Future attribution classifications

The future attribution result should classify the mutation marker as exactly one of:

```text
mutation_marker_attribution=route_active_mutation_path
mutation_marker_attribution=dependency_active_mutation_path
mutation_marker_attribution=route_false_positive_text
mutation_marker_attribution=dependency_false_positive_text
mutation_marker_attribution=type_or_schema_text_only
mutation_marker_attribution=dead_or_unreachable_code_pending_manual_review
mutation_marker_attribution=ambiguous_requires_manual_review
```

The future attribution result should classify data minimization as exactly one of:

```text
data_minimization_attribution=bounded_output_confirmed
data_minimization_attribution=unbounded_output_confirmed
data_minimization_attribution=analyzer_limitation_likely
data_minimization_attribution=ambiguous_requires_manual_review
```

## Future next-action classifications

The future attribution review should recommend exactly one next action:

```text
attribution_next_action=plan_source_remediation_design
attribution_next_action=plan_static_criteria_refinement_design
attribution_next_action=abandon_candidate_preview_route_runtime_validation_path
attribution_next_action=manual_security_review_required
attribution_next_action=continue_blocked_no_action
```

A future recommendation must not itself authorize source remediation, criteria changes, runtime validation, or operational reactivation.

## Future stop conditions

A future attribution execution must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Candidate route path differs.
- Candidate route is missing.
- Candidate route is not tracked.
- Phase 25DN reviewed dependency path cannot be resolved.
- Attribution cannot be done with local static commands.
- Required marker cannot be found.
- More than the bounded marker neighborhood would need to be printed.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.
- The one-run marker already exists.

## Future result package requirements

A future attribution result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DR committed HEAD>
expected_subject=<Phase 25DR committed subject>
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
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

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, cookies, session material, or broad source excerpts.

## Future phase sequence

Phase 25DQ only designs attribution.

The required next sequence is:

```text
Phase 25DR — Candidate Preview Route Mutation Marker Attribution Approval Gate
Phase 25DS — Candidate Preview Route Mutation Marker Attribution Execution Gate
Phase 25DT — Candidate Preview Route Mutation Marker Attribution Result Review Gate
```

No phase may combine design, approval, execution, result review, source remediation, criteria refinement, runtime validation, or commit.

## Runtime validation decision

Runtime validation remains blocked.

A route classified as `source_review_mutation_capable_excluded` cannot proceed to runtime validation.

The mutation marker and data-minimization ambiguity must be attributed first.

Even if a future attribution result finds a false positive, runtime validation would still require separate planning, approval, execution, and result review phases.

## Source remediation decision

Source remediation remains blocked.

A future attribution result may recommend remediation design, but it cannot authorize code changes.

No code changes are approved by Phase 25DQ.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DQ is design-only.
- No attribution review has executed.
- No source remediation is approved.
- Runtime validation remains blocked.
- The candidate route remains blocked after Phase 25DN and Phase 25DO.
- The Phase 25DN mutation marker is not attributed yet.
- The Phase 25DN data-minimization ambiguity is not resolved yet.
- No route invocation is approved.
- No local server startup is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.

## Recommended next phase

The next recommended phase is:

```text
Phase 25DR — Candidate Preview Route Mutation Marker Attribution Approval Gate
```

## Phase 25DQ conclusion

Phase 25DQ designs a future source-only attribution review for the mutation marker and data-minimization ambiguity found in Phase 25DN.

This is safer than blind remediation.

This is safer than static criteria relaxation.

This does not authorize operational reactivation.

This does not authorize route invocation.

This does not authorize live database reads.

This does not authorize admin API invocation.

This does not authorize local server startup.

This does not authorize source remediation.

This does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DQ and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DQ remains documentation-only.
- The future attribution scope is properly limited to the candidate route and already-resolved static dependency.
- Route invocation, source remediation, runtime validation, live DB reads, server startup, mutations, candidate pipelines, publishing, and operational reactivation remain prohibited.
- The bounded marker-neighborhood source excerpt policy is appropriate.
- Attribution classifications and `attribution_next_action` outputs are deterministic and actionable.
- Operational reactivation remains blocked.
- Phase 25DR is the correct next approval gate.

Phase 25DQ is ready for commit after James approval.
