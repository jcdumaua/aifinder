# Discovery Phase 25EJ — Discovery Admin Route Read-Only Dependency Inventory Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only dependency inventory planning gate.

## Current binding

```text
phase=25EJ
base_head=19836edd1b7b909c30250dabe6a0c3d67c82a66f
base_subject=Document Phase 25EI source-only validation closure
phase_25ei_doc=docs/discovery-phase-25ei-candidate-preview-route-read-only-auth-dependency-source-only-validation-closure-gate.md
source_change_allowed=false
dependency_inventory_execution_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
module_import_execution_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Purpose

Phase 25EJ plans a future non-runtime inventory of discovery admin route dependencies.

This phase does not execute the dependency inventory. It does not execute the harness, perform runtime validation, invoke routes, import application modules, start a local server, read from a live database, mutate a database, execute a candidate pipeline, publish anything, or reactivate operations.

## Prior closure carried forward

```text
phase_25ei_source_only_validation_closure=approved_committed_and_pushed
closed_area=candidate_preview_route_read_only_auth_dependency_source_only_validation_loop
source_only_contract_status=closed_accepted
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
operational_reactivation_status=blocked
```

## Inventory planning target

Future inventory target:

```text
inventory_target=discovery_admin_route_dependencies
target_route_directory=app/api/admin/discovery
known_read_only_helper=lib/admin-auth-read-only.ts
known_existing_admin_auth_helper=lib/admin-auth.ts
candidate_preview_read_only_harness=testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
inventory_execution_status=not_started
```

## Planned inventory questions

A future source-only inventory should answer:

1. Which discovery admin route files exist under `app/api/admin/discovery`?
2. Which route files import `lib/admin-auth.ts`?
3. Which route files import `lib/admin-auth-read-only.ts`?
4. Which route files import Supabase or service-role primitives directly?
5. Which helper modules are shared by discovery admin routes?
6. Which dependencies appear read-only by source-only inspection?
7. Which dependencies may be mutating or operational by source-only inspection?
8. Which route/helper areas should be left untouched because they are outside the read-only auth dependency closure?
9. Which future hardening candidates, if any, should be planned before any broader admin route test strategy?

## Recommended inventory method

A future inventory should be:

```text
method=source_only_static_file_read
node_standard_library_only=true
application_module_imports=false
route_invocation=false
local_server_startup=false
live_db_read=false
db_mutation=false
secret_value_printing=false
output=inventory_report_for_review
```

The future inventory may use static file reads, path listing, and text pattern checks. It must not import or execute application code.

## Recommended next phase

Recommended next phase:

```text
next_phase=Phase 25EK
next_phase_title=Discovery Admin Route Read-Only Dependency Inventory Design Gate
next_phase_type=docs_only_design
source_change_allowed=false
dependency_inventory_execution_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_allowed=false
```

Phase 25EK should design the future source-only inventory harness or report format. It should not implement or execute the inventory.

## Proposed future split

```text
phase_25ek=docs_only_inventory_design_gate
phase_25el=docs_only_inventory_implementation_planning_gate
phase_25em=source_limited_static_inventory_harness_implementation_gate
phase_25en=explicitly_approved_static_inventory_execution_gate
phase_25eo=docs_only_inventory_result_review_gate
```

This split preserves the same safety pattern used for the read-only auth dependency harness.

## Explicitly blocked in Phase 25EJ

```text
source_changes=false
dependency_inventory_execution=false
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
planning_result=dependency_inventory_design_gate_recommended
source_only_validation_loop_status=closed_accepted
dependency_inventory_status=not_started
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
recommended_next_phase=Phase 25EK Discovery Admin Route Read-Only Dependency Inventory Design Gate
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only dependency inventory planning.
- No dependency inventory execution.
- No source changes.
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

