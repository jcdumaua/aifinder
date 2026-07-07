# Discovery Phase 25EB — Candidate Preview Route Read-Only Auth Dependency Runtime Validation Harness Design Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only runtime validation harness design gate.

## Current binding

```text
phase=25EB
base_head=97cd9bf2d2fe92f0233f3c5fc2ba55738ad36c30
base_subject=Document Phase 25EA runtime validation planning
phase_25ea_doc=docs/discovery-phase-25ea-candidate-preview-route-read-only-auth-dependency-runtime-validation-planning-gate.md
source_change_allowed=false
harness_implementation_allowed=false
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

Phase 25EB designs the safest future validation harness after Phase 25EA planned the runtime-validation contract.

This phase does not implement the harness. It does not execute runtime validation. It does not start a server, invoke the candidate preview route, import application modules, read from a live database, mutate a database, run browser automation, stage candidates, approve candidates, or reactivate operations.

## Prior accepted planning result

```text
phase_25ea_runtime_validation_planning=approved_committed_and_pushed
runtime_validation_execution_status=not_ready
recommended_next_phase_from_25ea=Phase 25EB Candidate Preview Route Read-Only Auth Dependency Runtime Validation Harness Design Gate
operational_reactivation_status=blocked
```

## Selected harness design direction

The recommended future harness direction is **Option A: Source-only route contract harness**.

This design is selected because it provides the safest next validation layer without runtime execution.

```text
selected_option=source_only_route_contract_harness
runtime_execution=false
module_import_execution=false
route_invocation=false
local_server_startup=false
live_db_read=false
db_mutation=false
risk=lowest
coverage=static_route_and_helper_contract
```

## Future harness purpose

A future source-only harness should verify the candidate preview route and helper contract using file reads only.

The harness should check:

1. Candidate preview route does not import `lib/admin-auth.ts`.
2. Candidate preview route imports `lib/admin-auth-read-only.ts`.
3. Candidate preview route uses `getReadOnlyAdminSession`.
4. Candidate preview route represents async helper typing using `Awaited<ReturnType<typeof getReadOnlyAdminSession>>`.
5. Candidate preview route awaits `verifySession(request)`.
6. Read-only helper exports `getReadOnlyAdminSession`.
7. Read-only helper does not import `lib/admin-auth.ts`.
8. Read-only helper does not import Supabase or service-role primitives.
9. Read-only helper actor contract is object-shaped and includes `label`.
10. Helper and route do not contain database mutation markers.
11. Helper does not contain live DB read markers.
12. Helper does not contain response cookie/header mutation or network invocation markers.
13. Internal `Map.set(...)` used for cookie parsing is not treated as response mutation.

## Proposed future harness file

The future implementation phase may create one script only:

```text
future_harness_path=testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
future_harness_type=source_only_file_read_harness
package_change_required=false
lockfile_change_required=false
generated_type_change_required=false
```

This file must not be created in Phase 25EB.

## Future harness execution model

The future harness should run with Node only and read files from disk.

Expected future command shape:

```text
node testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
```

The command above is inactive in Phase 25EB and must not be run unless a later implementation/execution phase explicitly permits it.

## Future harness output requirements

The future harness should print:

```text
phase=25EC_or_later
harness=discovery_candidate_preview_read_only_auth_contract_source_harness
values_printed=false
candidate_preview_route_imports_lib_admin_auth=false
candidate_preview_route_imports_lib_admin_auth_read_only=true
read_only_helper_imports_lib_admin_auth=false
read_only_helper_imports_supabase_or_service_role=false
read_only_helper_exports_getReadOnlyAdminSession=true
candidate_preview_route_async_returntype_recovered=true
candidate_preview_route_awaits_verify_session=true
read_only_helper_actor_contract_object_shape=true
read_only_helper_actor_label_contract_present=true
read_only_helper_active_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
read_only_helper_generic_db_mutation_marker_count=0
candidate_preview_route_generic_db_mutation_marker_count=0
read_only_helper_live_db_read_marker_count=0
read_only_helper_network_or_response_mutation_marker_count=0
internal_Map_set_cookie_parse_false_positive_ignored=true
result=passed
```

## Future harness fail-closed conditions

A future harness implementation must fail closed if:

1. The repo root is not the expected AiFinder repo.
2. The current branch is not `main`.
3. The expected source files are missing.
4. The candidate preview route imports `lib/admin-auth.ts`.
5. The route does not import `lib/admin-auth-read-only.ts`.
6. The route does not use `getReadOnlyAdminSession`.
7. The route does not await `verifySession(request)`.
8. The route does not use the awaited return type contract.
9. The helper imports `lib/admin-auth.ts`.
10. The helper imports Supabase or service-role primitives.
11. The helper lacks an object-shaped actor contract with `label`.
12. The helper or route contains active or generic database mutation markers.
13. The helper contains live DB read markers.
14. The helper contains network invocation or response cookie/header mutation markers.
15. The harness would need environment values, route invocation, module imports, local server startup, or live database access.
16. Any value that could be a secret would be printed.

## Future phase split

Recommended next phases:

```text
phase_25ec=Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Implementation Planning Gate
phase_25ec_type=docs_only_planning
phase_25ed=Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Implementation Gate
phase_25ed_type=source_limited_implementation_after_approval
phase_25ee=Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Execution Gate
phase_25ee_type=execution_only_after_explicit_approval
runtime_route_validation=not_started
operational_reactivation=blocked
```

## Explicitly blocked in Phase 25EB

```text
source_changes=false
harness_implementation=false
harness_execution=false
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
planning_result=source_only_harness_design_selected
selected_harness_direction=Option A Source-only route contract harness
recommended_next_phase=Phase 25EC Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Implementation Planning Gate
runtime_validation_execution_status=not_started
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only harness design.
- No source changes.
- No harness implementation.
- No harness execution.
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

