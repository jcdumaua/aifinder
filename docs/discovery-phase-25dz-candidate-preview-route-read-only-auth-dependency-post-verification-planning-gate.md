# Discovery Phase 25DZ — Candidate Preview Route Read-Only Auth Dependency Post-Verification Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only post-verification planning gate.

## Current binding

```text
phase=25DZ
base_head=dfc5f3af6803b9639a3c35a426569e5e0b9b7d86
base_subject=Document Phase 25DY verification result review
phase_25dw_head=8400d0f324405cf3807b7b5b5028af0feeb2206a
phase_25dw_subject=Add Phase 25DW read-only auth dependency
phase_25dy_doc=docs/discovery-phase-25dy-candidate-preview-route-read-only-auth-dependency-verification-result-review-gate.md
source_change_allowed=false
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Purpose

Phase 25DZ plans the next safe layer after the Phase 25DW read-only auth dependency implementation and the Phase 25DX/25DY source-only verification result review.

This phase does not execute the next layer. It only records the permitted next-step options, required safeguards, and blocked operations.

## Confirmed prior results

```text
phase_25dw_source_implementation=committed_and_pushed
phase_25dw_head=8400d0f324405cf3807b7b5b5028af0feeb2206a
phase_25dx_source_only_verification=approved_after_rebound_v2
phase_25dy_verification_result_review=approved_committed_and_pushed
current_head=dfc5f3af6803b9639a3c35a426569e5e0b9b7d86
working_tree_required_clean=true
operational_reactivation_status=blocked
```

## Current accepted source-only state

The following source-only state is accepted from Phase 25DX and Phase 25DY:

```text
candidate_preview_route_imports_lib_admin_auth=false
candidate_preview_route_imports_lib_admin_auth_read_only=true
read_only_helper_imports_lib_admin_auth=false
read_only_helper_imports_supabase_or_service_role=false
read_only_helper_exports_getReadOnlyAdminSession=true
candidate_preview_route_uses_getReadOnlyAdminSession=true
candidate_preview_route_async_returntype_recovered=true
candidate_preview_route_awaits_verify_session=true
read_only_helper_actor_contract_object_shape=true
read_only_helper_actor_label_contract_present=true
read_only_helper_active_mutation_marker_count=0
read_only_helper_createHmac_update_digest_marker_count=0
read_only_helper_generic_db_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
candidate_preview_route_generic_db_mutation_marker_count=0
read_only_helper_live_db_read_marker_count=0
read_only_helper_network_or_response_mutation_marker_count=0
```

## Planning decision

The next safest layer should be planning before any runtime execution.

Recommended next phase:

```text
next_phase=Phase 25EA
next_phase_title=Candidate Preview Route Read-Only Auth Dependency Runtime Validation Planning Gate
next_phase_type=docs_only_planning
runtime_validation_execution_allowed=false
route_invocation_allowed=false
live_db_read_allowed=false
operational_reactivation_allowed=false
```

Phase 25EA should define the exact future runtime-validation contract without executing it.

## Required Phase 25EA planning topics

Phase 25EA should define:

1. What runtime validation would prove.
2. What runtime validation must not prove or imply.
3. Whether any local-only validation can be designed without live DB reads.
4. Whether any route invocation can be safely simulated without a real server.
5. Whether a future runtime check requires explicit operator approval.
6. What exact command, if any, would be permitted in a later phase.
7. What environment-presence checks are allowed without printing values.
8. What route/request fixtures would be safe.
9. What response assertions are safe.
10. What failure conditions should remain fail-closed.
11. Why operational reactivation remains blocked even if a later runtime check passes.

## Explicitly blocked in Phase 25DZ

```text
source_changes=false
runtime_validation=false
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

## Risk notes

The dependency split has only been accepted for static/source-only scope.

A future runtime validation phase must not be treated as operational reactivation. It must be narrowly authorized, reproducible, and bounded. Runtime validation should not perform candidate selection, candidate staging, candidate decision execution, approve-for-draft, publication, or live database mutation.

## Result

```text
planning_result=next_layer_should_be_docs_only_runtime_validation_planning
recommended_next_phase=Phase 25EA Candidate Preview Route Read-Only Auth Dependency Runtime Validation Planning Gate
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only planning.
- No source changes.
- No runtime validation.
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

