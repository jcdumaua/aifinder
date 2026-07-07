# Discovery Phase 25EK — Discovery Admin Route Read-Only Dependency Inventory Design Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only dependency inventory design gate.

## Current binding

```text
phase=25EK
base_head=dc7d16ff147ea96ba30dc9354187cd55daf550a1
base_subject=Document Phase 25EJ dependency inventory planning
phase_25ej_doc=docs/discovery-phase-25ej-discovery-admin-route-read-only-dependency-inventory-planning-gate.md
source_change_allowed=false
dependency_inventory_execution_allowed=false
inventory_harness_implementation_allowed=false
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

Phase 25EK designs a future source-only dependency inventory harness/report for discovery admin route dependencies.

This phase does not implement the inventory harness. It does not execute dependency inventory, execute any prior harness, perform runtime validation, invoke routes, import application modules, start a local server, read from a live database, mutate a database, execute a candidate pipeline, publish anything, or reactivate operations.

## Prior planning carried forward

```text
phase_25ej_dependency_inventory_planning=approved_committed_and_pushed
source_only_validation_loop_status=closed_accepted
dependency_inventory_status=not_started
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
operational_reactivation_status=blocked
```

## Future inventory harness target

```text
future_inventory_harness_path=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
future_inventory_harness_status=not_implemented
future_inventory_execution_status=not_started
future_inventory_method=source_only_static_file_read
node_standard_library_only=true
application_module_imports=false
route_invocation=false
local_server_startup=false
live_db_read=false
db_mutation=false
secret_value_printing=false
```

## Designed inventory scope

The future inventory should inspect only repository source text and file paths relevant to discovery admin route dependencies.

Initial source-only roots:

```text
route_root=app/api/admin/discovery
known_read_only_helper=lib/admin-auth-read-only.ts
known_existing_admin_auth_helper=lib/admin-auth.ts
```

The inventory should not decide whether routes are operationally safe. It should only classify dependency references by static/source-only evidence.

## Designed report fields

The future inventory report should include these fields:

```text
phase=25EN
inventory=discovery_admin_route_read_only_dependency_inventory
mode=source_only_static_file_read
values_printed=false
route_invocation=false
module_import_execution=false
local_server_startup=false
live_db_read=false
db_mutation=false
route_root_exists=true_or_false
route_file_count=number
route_files=list_of_relative_paths
imports_lib_admin_auth_count=number
imports_lib_admin_auth_read_only_count=number
imports_supabase_or_service_role_count=number
candidate_read_only_dependency_files=list
candidate_mutating_or_operational_dependency_files=list
needs_follow_up_review_files=list
result=passed_or_failed
```

## Designed assertion categories

The future inventory harness should check:

1. The route root exists.
2. Route files are discovered by static path traversal only.
3. No application module imports occur.
4. No dynamic imports occur.
5. No route invocation occurs.
6. No local server startup occurs.
7. No live DB read occurs.
8. No DB mutation occurs.
9. No environment value is printed.
10. Each discovered route file is classified by dependency markers:
   - imports `lib/admin-auth.ts`
   - imports `lib/admin-auth-read-only.ts`
   - imports Supabase/client/service-role primitives
   - imports shared discovery helper modules
   - contains active mutation marker terms
   - contains read-only method marker terms
11. The output is a reviewable inventory report only.
12. The harness fails closed if route root or required known helpers are missing.

## Designed implementation constraints

Future implementation must satisfy:

```text
node_standard_library_only=true
allowed_imports=node:fs,node:path,node:process
application_module_imports=false
dynamic_imports=false
route_invocation=false
local_server_startup=false
browser_automation=false
network_calls=false
live_db_read=false
db_mutation=false
process_env_reads=false
secret_value_printing=false
package_changes=false
lockfile_changes=false
schema_or_migration_changes=false
generated_type_changes=false
```

## Designed execution approval

Future execution must require a new explicit operator phrase. Suggested inactive phrase:

```text
Approve Phase 25EN discovery admin dependency inventory execution exactly once
```

This phrase is inactive in Phase 25EK.

## Recommended next phase

Recommended next phase:

```text
next_phase=Phase 25EL
next_phase_title=Discovery Admin Route Read-Only Dependency Inventory Implementation Planning Gate
next_phase_type=docs_only_implementation_planning
source_change_allowed=false
dependency_inventory_execution_allowed=false
inventory_harness_implementation_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_allowed=false
```

Phase 25EL should plan the exact future harness implementation, including path constants, marker definitions, output contract, and fail-closed cases. It should not implement or execute the inventory.

## Explicitly blocked in Phase 25EK

```text
source_changes=false
dependency_inventory_execution=false
inventory_harness_implementation=false
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

## Design result

```text
design_result=inventory_harness_design_defined
future_inventory_harness_path=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
future_inventory_harness_status=not_implemented
future_inventory_execution_status=not_started
dependency_inventory_status=designed_not_executed
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
recommended_next_phase=Phase 25EL Discovery Admin Route Read-Only Dependency Inventory Implementation Planning Gate
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only dependency inventory design.
- No dependency inventory execution.
- No inventory harness implementation.
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

