# Phase 25DV — Candidate Preview Route Read-Only Auth Dependency Implementation Plan

## Purpose

Phase 25DV is a documentation-only implementation planning gate for the future source remediation approved in Phase 25DU.

Phase 25DU selected a narrow remediation design: extract a read-only admin session verification helper and update the candidate preview route so its production dependency graph no longer imports the broader `lib/admin-auth.ts` module that contains the active mutation-like marker.

This phase plans the exact future implementation shape. It does not modify source files.

## Current binding

```text
phase=25DV
previous_phase=25DU
previous_phase_commit=7ae9904fd9697871b252e3b885a245662d57019e
previous_phase_subject=Document Phase 25DU source remediation design
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
current_mutation_attributed_dependency=lib/admin-auth.ts
proposed_read_only_helper=lib/admin-auth-read-only.ts
phase_25du_preferred_option=Option A
operational_reactivation_status=blocked
```

## Boundary

```text
implementation_allowed=false
source_change_allowed=false
source_remediation_allowed=false
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
public_route_invocation_allowed=false
module_import_execution_allowed=false
browser_automation_allowed=false
crawler_execution_allowed=false
extraction_execution_allowed=false
llm_execution_allowed=false
candidate_staging_allowed=false
candidate_decision_execution_allowed=false
approve_for_draft_allowed=false
public_publishing_allowed=false
db_mutation_allowed=false
schema_migration_allowed=false
type_generation_allowed=false
package_change_allowed=false
lockfile_change_allowed=false
environment_value_printing_allowed=false
commit_allowed=false
push_allowed=false
```

## Implementation target

The future implementation phase should create a narrowly scoped helper:

```text
target_file=lib/admin-auth-read-only.ts
target_export=getReadOnlyAdminSession
target_consumer=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
current_dependency_to_remove_from_candidate_route=lib/admin-auth.ts
```

The helper should provide only the read-only admin session verification behavior needed by the candidate preview route.

## Proposed helper interface

The future helper should use a minimal interface that matches the candidate preview route's existing needs.

```text
export_name=getReadOnlyAdminSession
input=Request
output.isAdmin=boolean
output.actor=string|null
output.errors=string[]
```

Planned TypeScript shape:

```text
type ReadOnlyAdminSession = {
  isAdmin: boolean;
  actor: string | null;
  errors: string[];
};

async function getReadOnlyAdminSession(request: Request): Promise<ReadOnlyAdminSession>;
```

The implementation should reuse existing verification semantics where safe, but it must not import the broad mutating auth module if that import keeps the active mutation-like path in the candidate preview route dependency graph.

## Candidate preview route change plan

Future source remediation should update only the candidate preview route's default admin-session dependency.

Planned route-level change:

```text
before=import { getAdminSession } from "../../../../../../../lib/admin-auth";
after=import { getReadOnlyAdminSession } from "../../../../../../../lib/admin-auth-read-only";
```

Planned default dependency change:

```text
before=getAdminSession
after=getReadOnlyAdminSession
```

The route's existing dependency injection boundary should remain intact so tests can inject synthetic admin-session responses.

## Read-only helper implementation constraints

Allowed future behavior:

```text
may_parse_request_headers=true
may_parse_cookies=true
may_verify_existing_admin_session=true
may_compare_existing_session_signature=true
may_return_unauthorized_result=true
may_return_errors_without_throwing=true
may_return_actor_from_existing_session=true
may_use_crypto_verification_if_it_does_not_trigger_static_mutation_marker=true
```

Disallowed future behavior:

```text
must_not_create_session=true
must_not_refresh_session=true
must_not_delete_session=true
must_not_set_cookie=true
must_not_clear_cookie=true
must_not_write_audit_log=true
must_not_insert_update_upsert_delete_rpc_supabase=true
must_not_import_service_role_client=true
must_not_import_lib_admin_auth=true
must_not_export_sign_session=true
must_not_call_createHmac_update_digest_chain=true
must_not_call_mutating_database_methods=true
must_not_perform_live_db_read=true
must_not_perform_runtime_route_invocation=true
must_not_change_candidate_preview_response_contract=true
```

## Cryptographic verification note

The Phase 25DS marker came from an active mutation-like `.update(...)` call in cryptographic signing logic. If the read-only helper needs signature verification, the future implementation should avoid reintroducing the same static marker into the candidate preview route dependency graph.

Acceptable future options, subject to implementation review:

```text
option_1=use_existing_non_mutating_verification_primitive_if_available
option_2=use_Web_Crypto_subtle_verify_if_compatible_with_node_runtime
option_3=isolate_marker_to_non_route_imported_mutating_module_and_keep_preview_route_dependency_clean
```

Any implementation that reintroduces an active `.update(...)` marker into the candidate preview route's static dependency graph should be rejected unless a later attribution gate explicitly proves it is harmless and isolated.

## Test plan for future implementation phase

Future implementation should include source-level and synthetic tests only. Runtime route invocation remains blocked unless separately authorized later.

Recommended checks:

```text
npm_run_check=required
candidate_preview_route_import_graph_check=required
read_only_helper_marker_check=required
candidate_preview_route_default_dependency_check=required
existing_candidate_preview_route_tests=preserve_or_update
admin_login_or_session_mutating_flow_tests=preserve_existing_behavior
```

Future source-only verification assertions:

```text
candidate_preview_route_imports_lib_admin_auth=false
candidate_preview_route_imports_lib_admin_auth_read_only=true
read_only_helper_imports_lib_admin_auth=false
read_only_helper_active_mutation_marker_count=0
read_only_helper_generic_db_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
candidate_preview_route_generic_db_mutation_marker_count=0
candidate_preview_route_response_contract_preserved=true
dependency_injection_boundary_preserved=true
operational_reactivation_status=blocked
```

## Implementation file scope for future source remediation

A future implementation phase should be limited to the smallest practical source/test set.

Expected source files:

```text
lib/admin-auth-read-only.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Possible test or verification files, only if required:

```text
testing/discovery-candidate-preview-read-only-auth-dependency-verifier.mjs
```

Files that should not change without a new explicit phase:

```text
lib/admin-auth.ts
supabase/migrations/*
package.json
package-lock.json
app/api/admin/discovery/runs/[id]/candidate-preview/provider files outside current route dependency
public tool publishing paths
candidate decision execution paths
```

If implementation analysis proves `lib/admin-auth.ts` must be edited, the implementation phase should stop and return to a design amendment gate before modifying it.

## Future implementation gate order

Recommended continuation:

```text
phase_25DW=Candidate Preview Route Read-Only Auth Dependency Source Implementation
phase_25DX=Candidate Preview Route Read-Only Auth Dependency Source-Only Verification
phase_25DY=Candidate Preview Route Read-Only Auth Dependency Result Review
```

Phase 25DW should be the first source-changing phase, and only after Gemini approves this implementation plan.

## Acceptance criteria for Phase 25DW

```text
source_remediation_scope_explicitly_approved=true
new_read_only_helper_created=true
candidate_preview_route_default_dependency_updated=true
candidate_preview_route_no_longer_imports_lib_admin_auth=true
candidate_preview_route_imports_read_only_helper=true
read_only_helper_does_not_import_lib_admin_auth=true
read_only_helper_active_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
route_response_contract_preserved=true
dependency_injection_boundary_preserved=true
npm_run_check_passes=true
runtime_validation_allowed=false
route_invocation_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_status=blocked
```

## Non-goals

Phase 25DV does not:

- Implement the read-only helper.
- Modify the candidate preview route.
- Modify `lib/admin-auth.ts`.
- Add or modify tests.
- Add a verifier.
- Start a local server.
- Invoke the route.
- Call admin APIs.
- Read the live database.
- Mutate the database.
- Run the candidate pipeline.
- Stage candidates.
- Execute candidate decisions.
- Approve draft candidates.
- Publish public tools.
- Change schema, migrations, generated types, packages, or lockfiles.
- Reactivate operations.

## Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Helper duplicates auth logic incorrectly | Admin authorization drift | Preserve existing session response shape and require synthetic tests |
| Helper imports `lib/admin-auth.ts` | Static dependency remains contaminated | Add import-graph verification assertion |
| Signature verification reintroduces `.update(...)` marker | Phase 25DS issue recurs | Prefer non-mutating verification primitive or stop for design amendment |
| Route response contract changes | Admin UI/API regression | Require contract preservation in tests and review |
| Runtime validation occurs too early | Safety boundary breach | Keep runtime validation blocked until separately authorized |

## Recommended next phase

```text
next_recommended_phase=Phase 25DW Candidate Preview Route Read-Only Auth Dependency Source Implementation
```

Phase 25DW should be a source-changing implementation gate only if Gemini approves Phase 25DV and James explicitly approves the implementation scope. Otherwise, continue with a design amendment gate.

## Gemini review confirmation

```text
review_status=APPROVED
reviewer=Gemini
review_scope=Phase 25DV Candidate Preview Route Read-Only Auth Dependency Implementation Plan
phase_25du_alignment=confirmed
helper_target_status=approved
helper_file=lib/admin-auth-read-only.ts
helper_export=getReadOnlyAdminSession
dependency_removal_status=confirmed
read_only_constraints_status=robust
cryptographic_verification_note_status=approved
phase_25dw_acceptance_criteria_status=rigorous
operational_reactivation_status=blocked
commit_push_clearance=cleared
next_phase=Phase 25DW Candidate Preview Route Read-Only Auth Dependency Source Implementation
```

Gemini confirmed the Phase 25DV implementation plan faithfully executes the approved Phase 25DU Option A direction. Gemini approved `lib/admin-auth-read-only.ts` and `getReadOnlyAdminSession` as the narrow source-remediation target, confirmed the candidate preview route import swap should sever the static dependency on `lib/admin-auth.ts`, and confirmed Phase 25DW is the correct next source-changing phase only after explicit approval.
