# Discovery Phase 25EC — Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Implementation Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only source-only harness implementation planning gate.

## Current binding

```text
phase=25EC
base_head=5a25d3ff10944e7aaf36f79a222da0f0570cbf57
base_subject=Document Phase 25EB harness design
phase_25eb_doc=docs/discovery-phase-25eb-candidate-preview-route-read-only-auth-dependency-runtime-validation-harness-design-gate.md
source_change_allowed=false
harness_implementation_allowed=false
harness_execution_allowed=false
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

Phase 25EC plans a future source-only harness implementation for the candidate preview route read-only auth dependency contract.

This phase does not implement the harness and does not execute it.

The future implementation target remains:

```text
future_harness_path=testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
future_harness_type=source_only_file_read_harness
package_change_required=false
lockfile_change_required=false
generated_type_change_required=false
runtime_execution_required=false
module_import_required=false
route_invocation_required=false
live_db_read_required=false
db_mutation_required=false
```

## Prior accepted design result

```text
phase_25eb_harness_design=approved_committed_and_pushed
selected_harness_direction=Option A Source-only route contract harness
harness_implementation_status=not_started
harness_execution_status=not_started
runtime_route_validation_status=not_started
operational_reactivation_status=blocked
```

## Implementation plan for future Phase 25ED

Phase 25ED may implement one source-only harness file if Gemini approves this planning gate.

Allowed future file addition:

```text
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
```

No other source, API, UI, schema, migration, package, lockfile, generated type, or configuration file should change in Phase 25ED.

## Future harness implementation requirements

The future harness should:

1. Use Node standard library only.
2. Read source files from disk using `fs.readFileSync` or equivalent.
3. Resolve paths from the repository root.
4. Avoid importing application modules.
5. Avoid route invocation.
6. Avoid local server startup.
7. Avoid browser automation.
8. Avoid live DB reads.
9. Avoid DB mutation.
10. Avoid environment value printing.
11. Avoid requiring secrets.
12. Exit non-zero on any failed assertion.
13. Print explicit PASS/FAIL markers.
14. Report `values_printed=false`.
15. Treat internal `Map.set(...)` cookie parsing as a known false positive and not as response mutation.
16. Still fail on actual cookie/header response mutation markers.

## Future source files to inspect

The future harness should inspect only:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
lib/admin-auth-read-only.ts
```

It may verify the presence of:

```text
lib/admin-auth.ts
```

only as a reference file that must not be imported by the route/helper.

## Future assertions

The future harness should assert:

```text
candidate_preview_route_imports_lib_admin_auth=false
candidate_preview_route_imports_lib_admin_auth_read_only=true
candidate_preview_route_uses_getReadOnlyAdminSession=true
candidate_preview_route_async_returntype_recovered=true
candidate_preview_route_awaits_verify_session=true
read_only_helper_imports_lib_admin_auth=false
read_only_helper_imports_supabase_or_service_role=false
read_only_helper_exports_getReadOnlyAdminSession=true
read_only_helper_actor_contract_object_shape=true
read_only_helper_actor_label_contract_present=true
read_only_helper_active_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
read_only_helper_generic_db_mutation_marker_count=0
candidate_preview_route_generic_db_mutation_marker_count=0
read_only_helper_live_db_read_marker_count=0
read_only_helper_network_or_response_mutation_marker_count=0
internal_Map_set_cookie_parse_false_positive_ignored=true
```

## Marker definitions

### Mutating admin auth route import

The route must fail if it imports `lib/admin-auth.ts`.

Recommended matching should catch direct import forms such as:

```text
from ".../lib/admin-auth"
from "@/lib/admin-auth"
```

It must not falsely fail on `lib/admin-auth-read-only`.

### Read-only helper import

The route must pass only if it imports `lib/admin-auth-read-only`.

### Supabase/service-role primitives

The helper must fail if it references markers such as:

```text
supabase
createClient
service_role
service-role
SUPABASE_SERVICE_ROLE_KEY
```

### Active mutation markers

The helper and route must fail on active database mutation markers such as:

```text
.update(
.insert(
.upsert(
.delete(
.rpc(
```

The helper must also fail on auth mutation markers such as:

```text
createHmac
.update(
.digest(
```

### Live DB read markers

The helper must fail on:

```text
.select(
```

### Network and response mutation markers

The helper must fail on:

```text
fetch(
cookies().set
.cookies.set
headers().set
.headers.set
Set-Cookie
set-cookie
NextResponse.redirect
Response.redirect
```

Generic `Map.set(...)` must not be treated as response mutation.

## Future harness output contract

The future harness should emit a concise output block similar to:

```text
phase=25ED
harness=discovery_candidate_preview_read_only_auth_contract_source_harness
mode=source_only_file_read
values_printed=false
route_invocation=false
module_import_execution=false
local_server_startup=false
live_db_read=false
db_mutation=false
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

## Future Phase 25ED implementation boundaries

If later approved, Phase 25ED should allow only:

```text
source_change_allowed=true
allowed_file=testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
harness_implementation_allowed=true
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
package_change_allowed=false
lockfile_change_allowed=false
generated_type_change_allowed=false
operational_reactivation_allowed=false
```

Phase 25ED should not run the harness after creating it unless that same phase is explicitly redefined and approved as an execution phase. The safer recommendation is to keep implementation and execution separate.

## Future Phase 25EE execution boundaries

Phase 25EE may execute the harness only after Gemini approval and explicit operator approval.

Suggested future approval phrase:

```text
Approve Phase 25EE source-only read-only auth harness execution exactly once
```

This phrase is inactive in Phase 25EC.

## Explicitly blocked in Phase 25EC

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
planning_result=source_only_harness_implementation_plan_ready_for_review
recommended_next_phase=Phase 25ED Candidate Preview Route Read-Only Auth Dependency Source-Only Harness Implementation Gate
harness_execution_status=not_started
runtime_validation_execution_status=not_started
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only implementation planning.
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

