# Discovery Phase 25EA — Candidate Preview Route Read-Only Auth Dependency Runtime Validation Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only runtime validation planning gate.

## Current binding

```text
phase=25EA
base_head=0ef1835d72512c3ea62f9342f76e603690edb627
base_subject=Document Phase 25DZ post-verification planning
phase_25dw_head=8400d0f324405cf3807b7b5b5028af0feeb2206a
phase_25dz_doc=docs/discovery-phase-25dz-candidate-preview-route-read-only-auth-dependency-post-verification-planning-gate.md
source_change_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Purpose

Phase 25EA defines the future runtime-validation contract for the candidate preview route read-only auth dependency change.

This phase does not execute runtime validation. It does not start a server, invoke the route, import modules, read from a live database, mutate a database, run a browser, or reactivate operations.

## Prior accepted state

```text
phase_25dw_source_implementation=committed_and_pushed
phase_25dx_source_only_verification=approved_after_rebound_v2
phase_25dy_verification_result_review=approved_committed_and_pushed
phase_25dz_post_verification_planning=approved_committed_and_pushed
current_static_scope_status=accepted_for_source_only_verification
runtime_scope_status=not_started
operational_reactivation_status=blocked
```

## Runtime validation objective

A later runtime validation phase, if explicitly approved, should prove only the narrow behavior below:

1. The candidate preview route can use the read-only admin session dependency without importing the mutating auth module.
2. The async `getReadOnlyAdminSession` contract is handled correctly by the route.
3. Unauthorized request handling remains fail-closed.
4. The route does not gain database mutation behavior through the auth dependency.
5. The validation remains separate from operational reactivation.

The future runtime validation must not prove, imply, or authorize:

1. Production readiness.
2. Operational reactivation.
3. Public publishing.
4. Candidate approval or approve-for-draft.
5. Candidate staging or decision execution.
6. Live database mutation.
7. Broad admin route safety beyond the scoped candidate preview auth dependency.

## Runtime validation design constraints

Any future runtime validation must be approved in a separate phase before execution.

The preferred future design should be staged:

```text
phase_25eb=runtime_validation_harness_design_gate_docs_only
phase_25ec=runtime_validation_harness_implementation_plan_docs_only_or_source_limited_after_approval
phase_25ed=runtime_validation_execution_gate_only_after_explicit_operator_approval
```

No runtime execution is allowed in Phase 25EA.

## Future validation shape under consideration

A future runtime validation may be designed around one of these options, subject to Gemini approval:

### Option A — Source-only route contract harness

A static or semi-static harness could inspect the route source and helper source without importing modules.

```text
runtime_execution=false
module_import_execution=false
route_invocation=false
live_db_read=false
db_mutation=false
risk=lowest
coverage=limited_to_static_contract
```

### Option B — Isolated helper-level validation

A future harness could validate helper behavior only if it can avoid live database access, server startup, route invocation, cookie/header mutation, and secret-value printing.

```text
runtime_execution=possible_in_future_only_after_approval
route_invocation=false
live_db_read=false
db_mutation=false
requires_explicit_operator_approval=true
risk=medium
coverage=helper_contract_only
```

### Option C — Local route invocation validation

A future route invocation check would require the strictest approval and must not be bundled with operational reactivation.

```text
runtime_execution=possible_in_future_only_after_approval
route_invocation=true
local_server_startup=possibly_required
live_db_read=must_remain_false_unless_separately_approved
db_mutation=false
requires_explicit_operator_approval=true
risk=highest_of_options
coverage=route_runtime_contract
```

## Recommended next step

The safest next phase is not execution.

Recommended next phase:

```text
next_phase=Phase 25EB
next_phase_title=Candidate Preview Route Read-Only Auth Dependency Runtime Validation Harness Design Gate
next_phase_type=docs_only_design
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_allowed=false
```

Phase 25EB should select and design the safest future validation harness before any implementation or execution.

## Future execution approval phrase requirement

A later runtime execution phase, if reached, must require an explicit operator approval phrase before execution.

Suggested future approval phrase format:

```text
Approve Phase 25ED candidate preview read-only auth runtime validation exactly once
```

This phrase is inactive in Phase 25EA.

## Fail-closed requirements for any future runtime validation

Any future runtime validation must fail closed if:

1. The repo is not clean and synced.
2. The expected HEAD or ancestor binding does not match.
3. The candidate preview route imports `lib/admin-auth.ts`.
4. The read-only helper imports `lib/admin-auth.ts`.
5. The helper imports Supabase or service-role primitives.
6. The helper or route contains database mutation markers.
7. The helper contains live database read markers, unless a later phase explicitly changes the allowed scope.
8. Environment values would be printed.
9. The route invocation would require candidate pipeline execution.
10. The validation implies operational reactivation.

## Explicitly blocked in Phase 25EA

```text
source_changes=false
runtime_validation_execution=false
route_invocation=false
local_server_startup=false
live_db_read=false
admin_api_invocation=false
public_route_invocation=false
module_import_execution=false
browser_automation=false
crawler_execution=false
extraction_execution=false
llm_execution=false
candidate_staging=false
candidate_decision_execution=false
approve_for_draft=false
public_publishing=false
db_mutation=false
schema_or_migration_change=false
generated_type_change=false
package_or_lockfile_change=false
environment_value_printing=false
operational_reactivation=false
```

## Planning result

```text
planning_result=runtime_validation_execution_not_ready
recommended_next_phase=Phase 25EB Candidate Preview Route Read-Only Auth Dependency Runtime Validation Harness Design Gate
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only runtime validation planning.
- No source changes.
- No runtime validation execution.
- No route invocation.
- No local server startup.
- No live database read.
- No admin API invocation.
- No public route invocation.
- No module import execution.
- No browser automation.
- No crawler execution.
- No extraction execution.
- No LLM execution.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.
- No DB mutation.
- No schema, migration, generated type, package, or lockfile changes.
- No environment values printed.

