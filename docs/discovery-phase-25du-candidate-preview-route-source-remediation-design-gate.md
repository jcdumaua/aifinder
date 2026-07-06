# Phase 25DU — Candidate Preview Route Source Remediation Design Gate

## Purpose

Phase 25DU is a documentation-only source remediation design gate for the candidate preview route.

Phase 25DS attributed the active mutation-like marker to the route's reviewed static dependency rather than to the candidate preview route itself. Phase 25DT reviewed and documented that result. Phase 25DU now designs the future remediation path without implementing it.

The design goal is to decouple the read-only candidate preview route from the mutating dependency path while preserving admin authorization, response safety, and the operational reactivation block.

## Current binding

```text
phase=25DU
previous_phase=25DT
previous_phase_commit=feec1c6d2fae29d3ae7ccd0aa61aa5ca88db07df
previous_phase_subject=Document Phase 25DT attribution result review
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
mutation_attributed_dependency=lib/admin-auth.ts
phase_25ds_mutation_marker_attribution=dependency_active_mutation_path
phase_25ds_data_minimization_attribution=analyzer_limitation_likely
phase_25ds_attribution_next_action=plan_source_remediation_design
operational_reactivation_status=blocked
```

## Boundary

```text
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

## Phase 25DS and 25DT finding summary

```text
mutation_marker_attribution=dependency_active_mutation_path
route_active_mutation_count=0
dependency_active_mutation_count=1
data_minimization_attribution=analyzer_limitation_likely
attribution_next_action=plan_source_remediation_design
```

The candidate preview route itself did not contain the active mutation marker. The reviewed static dependency path did contain an active mutation-like pattern because the dependency includes signing logic that calls `createHmac(...).update(payload).digest("hex")`.

The design concern is not that the preview route writes data. The concern is that the preview route imports an admin authentication module that also contains mutating/session-writing or mutation-like code paths. Static review therefore cannot cleanly classify the route dependency graph as read-only.

## Remediation objective

Future remediation should make the candidate preview route's authentication dependency statically read-only.

The preferred design is to split admin authentication concerns so the candidate preview route imports only a read-only admin session verification helper, while any session creation, session refresh, cookie-setting, signing, token mutation, or audit-writing helpers remain outside the candidate preview route dependency graph.

## Proposed design

### Option A — Extract read-only admin session verifier

Create a dedicated read-only helper with a name similar to:

```text
lib/admin-auth-read-only.ts
```

or:

```text
lib/admin-session-verification.ts
```

This helper should expose only verification-oriented functions needed by read-only admin routes.

Possible future public interface:

```text
getReadOnlyAdminSession(request): Promise<{
  isAdmin: boolean;
  actor: string | null;
  errors: string[];
}>
```

The exact function name and type shape should be determined during the implementation phase by matching the current route expectations.

Allowed characteristics for the future helper:

```text
may_parse_request_headers=true
may_parse_cookies=true
may_verify_existing_session=true
may_return_is_admin_actor_errors=true
may_return_unauthorized_result=true
may_use_constant_time_comparison_if_needed=true
may_import_next_headers_only_if_current_runtime_allows=true
may_be_unit_tested_with_synthetic_request=true
```

Disallowed characteristics for the future helper:

```text
must_not_sign_session=true
must_not_create_hmac_update_digest_chain=true
must_not_set_cookie=true
must_not_refresh_session=true
must_not_create_session=true
must_not_delete_session=true
must_not_write_audit_log=true
must_not_call_supabase_insert_update_upsert_delete_rpc=true
must_not_import_service_role_client=true
must_not_depend_on_mutating_admin_auth_module=true
must_not_perform_route_invocation=true
must_not_perform_live_db_read=true
must_not_perform_db_mutation=true
```

### Option B — Split existing admin-auth module into read-only and mutating submodules

If extracting a new read-only helper would duplicate too much logic, the existing `lib/admin-auth.ts` module can be refactored into explicit submodules:

```text
lib/admin-auth/session-verify.ts
lib/admin-auth/session-signing.ts
lib/admin-auth/session-mutation.ts
lib/admin-auth/index.ts
```

The candidate preview route should import only the read-only verification submodule, not the index module if the index re-exports mutating helpers.

This option is broader and should be used only if the implementation phase confirms it is safer than a narrow helper extraction.

### Option C — Dependency injection boundary for candidate preview route tests

The candidate preview route already has a dependency-injection pattern. The future implementation may preserve this pattern while changing the default dependency from the broad admin auth helper to the read-only verification helper.

The route's production default dependencies should resolve to read-only verification only. Tests may continue injecting synthetic dependencies.

## Preferred path

```text
preferred_option=Option A
reason=narrowest_static_dependency_graph_change
implementation_scope=future_phase_only
source_remediation_allowed_in_phase_25du=false
```

Option A is preferred because it narrows the candidate preview route dependency graph without requiring a broad auth-module refactor. It directly addresses the Phase 25DS finding: the route should no longer statically import the dependency containing the active mutation-like path.

## Future implementation acceptance criteria

A future implementation phase may be considered complete only if all of the following are true:

```text
candidate_preview_route_imports_read_only_auth_helper=true
candidate_preview_route_no_longer_imports_lib_admin_auth=true
read_only_auth_helper_contains_no_active_mutation_marker=true
read_only_auth_helper_contains_no_generic_mutation_db_write_marker=true
read_only_auth_helper_does_not_export_session_signing_or_session_mutation=true
existing_admin_login_or_session_mutating_flows_remain_preserved=true
existing_candidate_preview_route_response_contract_remains_preserved=true
existing_dependency_injection_tests_remain_preserved_or_updated=true
npm_run_check_passes=true
operational_reactivation_status=blocked
```

## Future verification acceptance criteria

A future source-only verification gate should check:

```text
route_active_mutation_count=0
route_generic_mutation_count=0
new_read_only_auth_helper_active_mutation_count=0
new_read_only_auth_helper_generic_mutation_count=0
candidate_preview_route_imports_mutating_dependency=false
candidate_preview_route_imports_read_only_auth_dependency=true
broad_source_excerpts_included=false
values_printed=false
runtime_validation_allowed=false
route_invocation_allowed=false
live_db_read_allowed=false
mutation_allowed=false
```

Runtime validation should remain blocked unless a later explicit phase separately authorizes it.

## Non-goals

Phase 25DU does not:

- Modify source code.
- Create the read-only helper.
- Refactor `lib/admin-auth.ts`.
- Change candidate preview route imports.
- Start a local server.
- Invoke the candidate preview route.
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
| Read-only helper accidentally imports the mutating auth module | Static dependency graph remains contaminated | Require direct marker check on the helper and route import graph |
| Existing admin session behavior changes | Admin-only route access could break | Preserve the current route response contract and use synthetic tests before runtime validation |
| Broad refactor causes unrelated auth regressions | Higher implementation risk | Prefer narrow helper extraction over full auth module refactor |
| Static analyzer still flags harmless cryptographic update names | Continued false positive | Use bounded attribution and require marker location plus import-graph evidence |
| Runtime validation is attempted too early | Safety boundary breach | Keep runtime validation explicitly blocked until a later phase |

## Recommended next phase

```text
next_recommended_phase=Phase 25DV Candidate Preview Route Read-Only Auth Dependency Implementation Plan
```

Phase 25DV should remain a planning gate unless separately scoped otherwise. It should define the exact helper file, exact function interface, exact route import change, tests to update, and source-only verification strategy before any implementation.

## Gemini review confirmation

```text
review_status=APPROVED
reviewer=Gemini
review_scope=Phase 25DU Candidate Preview Route Source Remediation Design Gate
phase_sequence=confirmed_after_phase_25ds_and_phase_25dt
exact_finding_target=confirmed
preferred_option=Option A — Extract read-only admin session verification helper
preferred_option_status=strongly_agreed_safest
read_only_constraints_status=confirmed
implementation_criteria_status=rigorous
operational_reactivation_status=blocked
commit_push_clearance=cleared
next_phase=Phase 25DV Candidate Preview Route Read-Only Auth Dependency Implementation Plan
```

Gemini confirmed the Phase 25DU design correctly targets the static dependency issue: the candidate preview route itself is not mutating data, but it imports `lib/admin-auth.ts`, which contains an active mutation path. Gemini strongly agreed that extracting a read-only admin session verification helper is the safest narrow remediation direction and confirmed the next safe step is Phase 25DV.
