# Discovery Phase 25EL — Discovery Admin Route Read-Only Dependency Inventory Implementation Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only dependency inventory implementation planning gate.

## Current binding

```text
phase=25EL
base_head=b84c273d5418cd1ef42b4c4ba953636e7b7b0393
base_subject=Document Phase 25EK dependency inventory design
phase_25ek_doc=docs/discovery-phase-25ek-discovery-admin-route-read-only-dependency-inventory-design-gate.md
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

Phase 25EL plans the exact future implementation of a source-only dependency inventory harness for discovery admin route dependencies.

This phase does not implement the inventory harness. It does not execute dependency inventory, list routes for inventory output, import application modules, invoke routes, start a local server, read from a live database, mutate a database, execute any candidate pipeline, publish anything, or reactivate operations.

## Prior design carried forward

```text
phase_25ek_dependency_inventory_design=approved_committed_and_pushed
future_inventory_harness_path=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
future_inventory_harness_status=not_implemented
future_inventory_execution_status=not_started
dependency_inventory_status=designed_not_executed
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
operational_reactivation_status=blocked
```

## Future implementation target

```text
future_phase=Phase 25EM
future_phase_title=Discovery Admin Route Read-Only Dependency Inventory Harness Implementation Gate
future_file=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
future_scope=source_limited_static_inventory_harness_implementation
future_execution_allowed=false
future_route_invocation_allowed=false
future_module_import_execution_allowed=false
future_live_db_read_allowed=false
future_db_mutation_allowed=false
```

## Planned path constants

The future harness should define these path constants from repo root:

```text
repo_root=process.cwd()
route_root=app/api/admin/discovery
known_read_only_helper=lib/admin-auth-read-only.ts
known_existing_admin_auth_helper=lib/admin-auth.ts
```

The future harness should not recursively scan unrelated directories. It should inspect only the planned route root and explicitly referenced helper paths.

## Planned allowed imports

Future harness allowed imports:

```text
allowed_imports=node:fs,node:path,node:process
application_module_imports=false
dynamic_imports=false
```

No package dependency, lockfile, schema, migration, generated type, app source, or UI source changes are allowed.

## Planned marker categories

Future harness marker categories should include:

```text
read_only_auth_dependency_markers=lib/admin-auth-read-only,getReadOnlyAdminSession,verifySession
mutating_auth_dependency_markers=lib/admin-auth,createServerClient,updateSession
supabase_or_service_role_markers=createClient,SUPABASE_SERVICE_ROLE_KEY,service_role,service-role,@supabase
active_mutation_markers=.insert(,.update(,.upsert(,.delete(,.rpc(
generic_db_mutation_terms=insert,update,upsert,delete,rpc,mutation
read_only_method_markers=.select(,.eq(,.single(,.maybeSingle(,.limit(,.order(
network_or_runtime_markers=fetch(,createServer(,.listen(,next dev,chromium.launch,puppeteer.launch
environment_value_markers=process.env
```

Marker checks must be static text checks only. They must not execute imported modules or call application code.

## Planned output contract

Future harness output should include:

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
route_root_exists=true
route_file_count=<number>
route_files=<relative_path_list>
imports_lib_admin_auth_count=<number>
imports_lib_admin_auth_read_only_count=<number>
imports_supabase_or_service_role_count=<number>
active_mutation_marker_file_count=<number>
generic_db_mutation_marker_file_count=<number>
read_only_method_marker_file_count=<number>
candidate_read_only_dependency_files=<relative_path_list>
candidate_mutating_or_operational_dependency_files=<relative_path_list>
needs_follow_up_review_files=<relative_path_list>
result=passed
```

The output must not include environment values, tokens, DB URLs, full request bodies, cookies, or secret-like strings.

## Planned fail-closed cases

Future harness should exit nonzero if any of these occur:

```text
missing_route_root=true
missing_known_read_only_helper=true
missing_known_existing_admin_auth_helper=true
unexpected_non_node_import_in_harness=true
dynamic_import_detected_in_harness=true
process_env_read_detected_in_harness=true
network_call_detected_in_harness=true
route_invocation_marker_detected_in_harness=true
local_server_startup_marker_detected_in_harness=true
application_module_import_detected_in_harness=true
secret_like_output_detected=true
inventory_output_contract_missing=true
```

## Planned implementation verification

Phase 25EM should verify the implemented harness without executing it by checking:

1. File path is exactly `testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs`.
2. Imports are limited to `node:fs`, `node:path`, and `node:process`.
3. The harness uses static file reads and path traversal only.
4. The harness does not import app modules.
5. The harness does not use dynamic imports.
6. The harness does not read `process.env`.
7. The harness does not call network, server, browser, route, DB, or Supabase clients.
8. The harness contains the required output markers.
9. The harness contains fail-closed checks.
10. The harness execution remains not started.

## Future execution approval

Future Phase 25EN execution must require the exact approval phrase:

```text
Approve Phase 25EN discovery admin dependency inventory execution exactly once
```

This phrase is inactive in Phase 25EL.

## Recommended next phase

Recommended next phase:

```text
next_phase=Phase 25EM
next_phase_title=Discovery Admin Route Read-Only Dependency Inventory Harness Implementation Gate
next_phase_type=source_limited_harness_implementation
source_change_allowed=true
allowed_changed_file=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
dependency_inventory_execution_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
module_import_execution_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_allowed=false
```

Phase 25EM should implement only the future source-only inventory harness. It should not execute the harness or perform the inventory.

## Explicitly blocked in Phase 25EL

```text
source_changes=false
dependency_inventory_execution=false
inventory_harness_implementation=false
harness_execution=false
runtime_validation_execution=false
route_invocation=false
route_listing_execution=false
local_server_startup=false
live_db_read=false
admin_api_invocation=false
public_route_invocation=false
module_import_execution=false
browser_automation=false
network_call=false
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
planning_result=inventory_harness_implementation_plan_defined
future_inventory_harness_path=testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
future_inventory_harness_status=planned_not_implemented
future_inventory_execution_status=not_started
dependency_inventory_status=implementation_planned_not_executed
runtime_route_validation_status=deferred
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
recommended_next_phase=Phase 25EM Discovery Admin Route Read-Only Dependency Inventory Harness Implementation Gate
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only dependency inventory implementation planning.
- No dependency inventory execution.
- No route listing execution.
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
- No network call.
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

