# AiFinder Phase 27DR — Critical Security Batch A Cross-File Invariant Reconciliation

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Remediation Requirement Paths
```text
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
lib/supabase-admin.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-staging-admin.ts
supabase/migrations/20260612000300_publish_homepage_control_config.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
```

## Manual Context Required Paths
```text
NONE
```

## Cross-File Invariants Reviewed
- Admin login/session/logout routes must align with the approved admin-auth primitive.
- Login must show rate-limit and secure-cookie controls.
- Session-sensitive routes must fail closed when verification is absent or invalid.
- Service-role clients must remain server-bound and unimportable from client components.
- Privileged discovery mutations must evidence authorization and bounded-input checks before mutation.
- SQL audit candidates must remain read-only.
- Security-definer functions must constrain search path.
- Database mutation definitions require explicit privilege and policy reconciliation.
- Privileged logging must not expose environment values, credentials, sessions, or raw responses.
- Dormant runtime-chain artifacts remain outside this review and were not executed.

## Current Classification
```text
CRITICAL_SECURITY_REVIEW=COMPLETE_PENDING_GEMINI
CODE_MODIFICATION=NOT_AUTHORIZED
DATABASE_MUTATION=NOT_AUTHORIZED
RUNTIME_EXECUTION=NOT_PERFORMED
OPERATIONAL_REACTIVATION=BLOCKED
```
