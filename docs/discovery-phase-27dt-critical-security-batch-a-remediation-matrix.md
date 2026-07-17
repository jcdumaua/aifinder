# AiFinder Phase 27DT — Critical Security Batch A Remediation Matrix

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Baseline
```text
Commit: 530ec4c7f0d19f7ee9be81127883f1741e2e3cf4
Approved remediation candidates: 11
Code modification: PROHIBITED
Test execution: PROHIBITED
Runtime posture: DORMANT
```

## Remediation Matrix
```text
app/api/admin/logout/route.ts|SESSION_GUARD_PATCH|AUTH_ROUTE|NARROW_CODE_CHANGE|UNIT_AND_STATIC
app/api/admin/session/route.ts|SESSION_GUARD_PATCH|AUTH_ROUTE|NARROW_CODE_CHANGE|UNIT_AND_STATIC
lib/supabase-admin.ts|SERVER_ONLY_CONFIGURATION_PATCH|PRIVILEGED_CLIENT|NARROW_CODE_CHANGE|STATIC_IMPORT_BOUNDARY
lib/discovery/discovery-candidate-decision-admin.ts|AUTHORIZATION_AND_INPUT_VALIDATION_PATCH|PRIVILEGED_MUTATION_SERVICE|NARROW_CODE_CHANGE|UNIT_STATIC_AND_NEGATIVE
lib/discovery/discovery-candidate-staging-admin.ts|AUTHORIZATION_AND_INPUT_VALIDATION_PATCH|PRIVILEGED_MUTATION_SERVICE|NARROW_CODE_CHANGE|UNIT_STATIC_AND_NEGATIVE
supabase/migrations/20260612000300_publish_homepage_control_config.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
supabase/migrations/20260615001110_updated-preview-checklist.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql|CORRECTIVE_MIGRATION_PLAN|DATABASE_POLICY_OR_RPC|NEW_MIGRATION_ONLY|STATIC_SQL_AND_LATER_AUTHORIZED_DB
```

Each row is:

`path|remediation-type|logical-role|implementation-method|verification-class`

## Remediation Types
- `SESSION_GUARD_PATCH`: align logout/session routes with the approved fail-closed admin verification path.
- `SERVER_ONLY_CONFIGURATION_PATCH`: enforce server-only privileged-client construction and import boundaries.
- `AUTHORIZATION_AND_INPUT_VALIDATION_PATCH`: require explicit authorization and bounded input before privileged mutation.
- `CORRECTIVE_MIGRATION_PLAN`: use a new corrective migration; never rewrite historical migrations in place.

This matrix plans work only. It does not authorize implementation.
