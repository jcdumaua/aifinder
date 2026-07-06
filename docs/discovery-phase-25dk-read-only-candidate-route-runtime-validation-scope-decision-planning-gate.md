# Discovery Phase 25DK — Read-Only Candidate Route Runtime Validation Scope Decision Planning Gate

## Status

Documentation-only runtime-validation scope decision planning gate.

Phase 25DK follows Phase 25DJ, which documented a passing Phase 25DI admin-only no-write route static inspection.

Phase 25DI identified one static read-only candidate route:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Phase 25DK decides the next safest scope for this candidate route.

Phase 25DK does not execute runtime validation.

Phase 25DK does not invoke routes.

Phase 25DK does not start a local server.

Phase 25DK does not query the live database.

Phase 25DK does not reactivate Discovery Engine operations.

Phase 25DK does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Review the Phase 25DI and Phase 25DJ static inspection result.
- Decide whether runtime validation is appropriate now.
- Decide whether deeper route-specific static source review is required first.
- Define next planning gate.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

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

Phase 25DK starts after Phase 25DJ was committed and pushed:

```text
HEAD=8aa886e Document Phase 25DJ route static inspection result
HEAD full=8aa886ef3f3782aaaa4c2ad3b1057219c6ff89fe
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DJ documented:

```text
execution_status=PASSED
execution_count=1
routes_inspected_count=15
routes_read_only_candidate_count=1
routes_excluded_count=14
routes_ambiguous_count=0
npm_check_status=passed
static_read_only_candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
runtime_approved=false
operational_reactivation_status=blocked
```

## Candidate route planning report

The candidate route planning report for this phase is:

```text
Candidate preview route planning report
values_printed=false
source_lines_printed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_route_present=true
candidate_route_tracked=true
runtime_validation_allowed_in_phase_25dk=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

This report confirms the candidate route exists as a tracked local file for planning purposes.

It does not inspect source semantics.

It does not execute the route.

It does not approve runtime validation.

## Decision options considered

### Option A — Move directly to no-write runtime validation

This option is not selected.

Reasons:

- Phase 25DI was marker-based static inspection only.
- The route has not received route-specific deep static source review.
- Runtime validation would require local server startup or deployed route invocation.
- Runtime validation may require authentication/session handling.
- Runtime validation may read live database state.
- Runtime validation could expose runtime behavior before route-specific source assumptions are reviewed.
- Runtime validation is too large a jump from marker-only classification.

### Option B — Keep future work entirely static and stop reactivation-readiness planning

This option is safe but not selected as the next step.

Reasons:

- Phase 25DI produced useful narrowing evidence.
- One candidate route exists for a possible no-write readiness path.
- Further route-specific source review can still occur locally without runtime execution.

### Option C — Perform deeper route-specific static source review design before runtime validation

This option is selected.

It remains local-only and documentation-first.

It narrows the next step to route-specific source review of:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

It does not authorize route invocation.

It does not authorize local server startup.

It does not authorize live database reads.

It does not authorize admin API invocation.

It does not authorize DB mutation.

It does not authorize operational reactivation.

## Decision

Phase 25DK selects:

```text
next_scope_decision=advance_to_candidate_preview_route_deep_static_source_review_design
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

## Requirements for Phase 25DL

Phase 25DL should be:

```text
Phase 25DL — Candidate Preview Route Deep Static Source Review Design Gate
```

Phase 25DL must remain documentation-only unless explicitly scoped otherwise.

Phase 25DL should design a future route-specific deep static source review for:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Phase 25DL should define how a future static review would inspect:

- Route method exports.
- Authentication and authorization boundaries.
- Request parameter handling.
- Supabase client creation path.
- Database table access.
- Query methods.
- Selected fields.
- Error handling and status codes.
- Cache behavior.
- Dynamic route parameter handling.
- Any implicit mutation path.
- Any imported helper that may mutate or execute operations.
- Whether the route reads only the minimum data needed for candidate preview.
- Whether route output can be documented without printing live row payloads.
- Whether a future runtime validation design is even appropriate.

Phase 25DL must not invoke the route.

Phase 25DL must not import route modules for execution.

Phase 25DL must not start a server.

Phase 25DL must not query the live database.

## Future runtime validation prerequisites

Before any future runtime validation can be considered, later phases must still provide:

- Route-specific deep static source review.
- Gemini review of the route-specific source review result.
- A separate runtime validation design gate.
- A separate runtime validation approval gate.
- Exact approval phrase.
- Expected HEAD and subject.
- One-run guard.
- Bound route path.
- Allowed command list.
- Prohibited command list.
- Authentication/session handling plan.
- Non-secret output rules.
- Live data minimization rules.
- Stop conditions.
- Separate result review gate.

No phase may combine deep static review, runtime validation design, approval, execution, and result review.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DK is decision planning only.
- Phase 25DI was static marker inspection only.
- The candidate route is not runtime-approved.
- No route-specific deep static source review has been designed.
- No route-specific deep static source review has executed.
- No runtime validation design has been written.
- No runtime validation approval phrase exists.
- No local server startup is approved.
- No route invocation is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.

## Recommended next phase

The next recommended phase is:

```text
Phase 25DL — Candidate Preview Route Deep Static Source Review Design Gate
```

Phase 25DL should remain documentation-only and should not execute source review unless explicitly scoped otherwise.

## Phase 25DK conclusion

Phase 25DK rejects direct runtime validation.

Phase 25DK selects deeper route-specific static source review design as the next safe scope.

This is safer than moving directly from marker-based static inspection to runtime validation.

This does not authorize operational reactivation.

This does not authorize route invocation.

This does not authorize live database reads.

This does not authorize admin API invocation.

This does not authorize local server startup.

This does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DK and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DK remains documentation-only.
- Direct runtime validation is correctly rejected.
- Deeper route-specific static source review design is the safer next step.
- The distinction between static read-only candidate and runtime-approved route is preserved.
- Route invocation, local server startup, live DB reads, mutations, candidate pipelines, and publishing remain prohibited.
- Operational reactivation remains blocked.
- Phase 25DL is the correct next documentation-only design gate.

Phase 25DK is ready for commit after James approval.
