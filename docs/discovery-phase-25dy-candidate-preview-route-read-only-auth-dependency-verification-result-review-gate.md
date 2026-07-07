# Discovery Phase 25DY — Candidate Preview Route Read-Only Auth Dependency Verification Result Review Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only verification result review gate.

## Current binding

```text
phase=25DY
base_head=124d3883a82a69ea660b3a19bd884c120f4254b3
base_subject=Document Codex CLI cycle safe phase
phase_25dw_head=8400d0f324405cf3807b7b5b5028af0feeb2206a
phase_25dw_subject=Add Phase 25DW read-only auth dependency
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

## Reviewed verification result

Phase 25DX was approved as a rebound source-only verification gate.

The original Phase 25DX gate failed safely because it was bound to the Phase 25DW commit `8400d0f324405cf3807b7b5b5028af0feeb2206a`, while `main` had later advanced to `124d3883a82a69ea660b3a19bd884c120f4254b3` with subject `Document Codex CLI cycle safe phase`.

The rebound verification was accepted because the Phase 25DW commit remained an ancestor of the verified current HEAD and the repository was clean and synced.

A verifier false positive was also identified and corrected: generic internal `Map.set(...)` usage in cookie parsing is not cookie/header response mutation. The corrected v2 verifier ignored generic `Map.set(...)` while still checking actual response mutation markers such as `cookies().set`, `.cookies.set`, `headers().set`, `.headers.set`, and Set-Cookie markers.

## Approved Phase 25DX findings

```text
repo_clean_and_synced=true
phase_25dw_is_ancestor_of_verified_head=true
source_change_allowed=false
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
read_only_helper_generic_db_mutation_marker_count=0
candidate_preview_route_active_mutation_marker_count=0
candidate_preview_route_generic_db_mutation_marker_count=0
read_only_helper_live_db_read_marker_count=0
read_only_helper_network_invocation_marker_count=0
read_only_helper_cookie_or_header_response_mutation_marker_count=0
npm_check_status=passed
values_printed=false
operational_reactivation_status=blocked
```

## Result review conclusion

Phase 25DX successfully verified the Phase 25DW source implementation at the current synced `main` state without source changes, runtime validation, route invocation, live database reads, database mutation, candidate pipeline execution, or public publishing.

The read-only auth dependency split is accepted for source-only verification purposes:

1. The candidate preview route is decoupled from the mutating `lib/admin-auth.ts` dependency.
2. The candidate preview route imports and uses `lib/admin-auth-read-only.ts`.
3. The new helper remains isolated from the mutating auth module.
4. The helper does not import Supabase or service-role primitives.
5. The helper does not perform live database reads.
6. The helper does not mutate cookies or headers.
7. The helper does not perform network invocation.
8. The helper and route remain free of active and generic database mutation markers.
9. The async verifier contract is represented with `Awaited<ReturnType<typeof getReadOnlyAdminSession>>`.
10. The route awaits `verifySession(request)`.
11. The actor contract remains object-shaped and includes `label`.

## Operational decision

```text
verification_result=accepted
source_remediation_status=completed_for_static_dependency_scope
runtime_validation_status=not_started
route_invocation_status=not_started
live_db_read_status=not_started
operational_reactivation_status=blocked
```

This phase does not reactivate operations.

Operational reactivation remains blocked until a later explicitly approved phase decides the next safe verification layer.

## Boundaries preserved

- Documentation-only result review.
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

## Next recommended phase

Phase 25DZ — Candidate Preview Route Read-Only Auth Dependency Post-Verification Planning Gate.

Recommended intent: plan the next safe layer after static/source-only verification, without immediately running runtime validation or operational reactivation.

