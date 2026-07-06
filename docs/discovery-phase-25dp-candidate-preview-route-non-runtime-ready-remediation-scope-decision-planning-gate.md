# Discovery Phase 25DP — Candidate Preview Route Non-Runtime-Ready Remediation Scope Decision Planning Gate

## Status

Documentation-only remediation scope decision planning gate.

Phase 25DP follows Phase 25DO, which documented the Phase 25DN controlled non-passing deep static source review result for the candidate preview route.

Phase 25DP decides the next safe scope after the route failed source-review runtime-readiness criteria.

Phase 25DP does not inspect source lines.

Phase 25DP does not remediate source code.

Phase 25DP does not execute source review.

Phase 25DP does not perform runtime validation.

Phase 25DP does not invoke routes.

Phase 25DP does not start a local server.

Phase 25DP does not query the live database.

Phase 25DP does not reactivate Discovery Engine operations.

Phase 25DP does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Review the Phase 25DN and Phase 25DO result summary.
- Decide whether the candidate preview route path should be stopped, investigated, remediated, or refined.
- Select the next safe planning scope.
- Preserve runtime validation as blocked.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No source line inspection.
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

Phase 25DP starts after Phase 25DO was committed and pushed:

```text
HEAD=5874e6d Document Phase 25DO source review result
HEAD full=5874e6d03ff869c748fe1ceaf8d35e45893451cc
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DO documented the Phase 25DN result:

```text
execution_status=CONTROLLED_NON_PASSING
reason=candidate_preview_route_deep_static_source_review_completed_with_non_runtime_ready_classification
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_preview_deep_static_classification=source_review_mutation_capable_excluded
admin_auth_boundary_status=clear
mutation_path_status=detected_excluded
operational_execution_path_status=not_detected
data_minimization_status=ambiguous
dependency_review_status=complete
npm_check_status=passed
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
operational_reactivation_status=blocked
```

## Candidate route planning report

```text
Candidate preview route non-runtime-ready planning report
values_printed=false
source_lines_printed=false
source_review_executed=false
source_remediation_executed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_route_present=true
candidate_route_tracked=true
phase_25dn_execution_status=CONTROLLED_NON_PASSING
phase_25dn_classification=source_review_mutation_capable_excluded
phase_25dn_mutation_path_status=detected_excluded
phase_25dn_data_minimization_status=ambiguous
phase_25dn_npm_check_status=passed
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

## Phase 25DN result interpretation

The Phase 25DN result was controlled and useful.

It was not a wrapper failure.

It did not indicate repository instability.

It did not execute runtime behavior.

It indicated that the candidate preview route cannot continue toward runtime validation under the current criteria because:

```text
candidate_preview_deep_static_classification=source_review_mutation_capable_excluded
mutation_path_status=detected_excluded
data_minimization_status=ambiguous
```

The route must remain blocked from runtime validation until a later explicitly scoped path resolves or accepts the finding.

## Decision options considered

### Option A — Stop the candidate preview route runtime-validation path

This option is safe.

It would document the route as blocked and abandon this runtime-readiness track.

It is not selected yet because the Phase 25DN script intentionally did not print source lines, so the detected mutation marker has not been attributed to a specific harmless or harmful source location.

### Option B — Move directly to source remediation

This option is not selected.

Reasons:

- The exact mutation marker source location was not attributed in Phase 25DN output.
- Data minimization ambiguity has not been source-attributed.
- Source remediation without attribution may modify the wrong file or solve the wrong problem.
- A code change would require a separate design, approval, implementation, and review sequence.
- This phase is documentation-only.

### Option C — Refine the static review criteria immediately

This option is not selected.

Reasons:

- Criteria refinement could hide a real mutation coupling if done before marker attribution.
- A false positive must be proven in a separate source-only attribution phase.
- Runtime safety requires conservative handling.

### Option D — Perform route mutation-marker and data-minimization attribution design

This option is selected.

It remains documentation-only.

It plans a future source-only attribution design that can determine what the detected mutation marker was, where it came from, and whether the lack of select markers represents true data-minimization ambiguity or a limitation of the previous static scan.

This is safer than direct remediation or criteria relaxation.

## Decision

Phase 25DP selects:

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

## Requirements for Phase 25DQ

Phase 25DQ should be:

```text
Phase 25DQ — Candidate Preview Route Mutation Marker Attribution Design Gate
```

Phase 25DQ must remain documentation-only unless explicitly scoped otherwise.

Phase 25DQ should design a future source-only attribution review for:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Phase 25DQ should define how a future attribution review would identify:

- Which reviewed file contained the mutation marker.
- Whether the marker was in the route file or an imported helper.
- Whether the marker was an actual mutating code path, dead code, false positive text, helper implementation detail, or unrelated identifier.
- Whether the marker can be safely documented without printing sensitive source lines.
- Whether the missing select marker indicates true unbounded output or an analyzer limitation.
- Whether data minimization can be assessed through a narrower static method.
- Whether any remediation path should be planned.
- Whether the route path should simply be abandoned for runtime validation.

Phase 25DQ must not execute source review.

Phase 25DQ must not print source lines.

Phase 25DQ must not modify source.

Phase 25DQ must not invoke routes.

Phase 25DQ must not start a server.

Phase 25DQ must not query the live database.

## Future attribution review constraints

Before any future attribution review can execute, later phases must still provide:

- A documentation-only attribution design gate.
- Gemini review of the attribution design.
- A separate attribution approval gate.
- Exact approval phrase.
- Expected HEAD and subject.
- One-run guard.
- Bound route path.
- Bound reviewed file set.
- Allowed command list.
- Prohibited command list.
- Non-secret source excerpt rules.
- Stop conditions.
- Separate result review gate.

No phase may combine design, approval, execution, result review, source remediation, and commit.

## Runtime validation decision

Runtime validation remains blocked.

A route classified as `source_review_mutation_capable_excluded` cannot proceed to runtime validation.

The data-minimization ambiguity further blocks runtime validation.

Runtime validation cannot be reconsidered until a later scoped path resolves or accepts these findings and then passes through separate planning and approval phases.

## Source remediation decision

Source remediation is not approved.

A later remediation track would require:

- Attribution result review.
- Remediation scope decision.
- Remediation design.
- Gemini approval.
- Implementation approval.
- Implementation.
- Verification.
- Result review.
- Commit and push.

No code changes are approved by Phase 25DP.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DP is planning only.
- Phase 25DN produced a controlled non-passing result.
- The candidate route remains classified as `source_review_mutation_capable_excluded`.
- Mutation marker attribution has not been designed.
- Mutation marker attribution has not executed.
- Data minimization remains ambiguous.
- Runtime validation remains blocked.
- Source remediation is not approved.
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
Phase 25DQ — Candidate Preview Route Mutation Marker Attribution Design Gate
```

## Phase 25DP conclusion

Phase 25DP selects a future mutation-marker and data-minimization attribution design before any remediation, criteria refinement, or runtime validation.

This is safer than direct remediation.

This is safer than criteria relaxation.

This is safer than abandoning useful evidence without understanding it.

This does not authorize operational reactivation.

This does not authorize route invocation.

This does not authorize live database reads.

This does not authorize admin API invocation.

This does not authorize local server startup.

This does not authorize source remediation.

This does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DP and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DP remains documentation-only.
- No source lines were inspected and no code was altered.
- Selecting attribution design is the safest next step.
- Immediate remediation is correctly rejected because it would be blind without marker attribution.
- Static criteria relaxation is correctly rejected because it could mask a real security issue.
- The candidate route remains blocked from runtime validation.
- Route invocation, DB reads, server startup, mutations, candidate pipelines, and publishing remain prohibited.
- Operational reactivation remains blocked.
- Phase 25DQ is the correct next design gate.

Phase 25DP is ready for commit after James approval.
