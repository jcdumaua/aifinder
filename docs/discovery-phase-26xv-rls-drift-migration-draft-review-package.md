# Phase 26XV — RLS Drift Migration Draft Review Package

## Review scope

Review:

- Phase 26XS dependency inventory;
- `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql`;
- Phase 26XT;
- `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql`;
- Phase 26XU.

## Immutable identities

- Baseline: `5f1c33367bbaff973fd07fa93a7a9aba1f71392e`
- Forward SHA-256: `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9`
- Rollback SHA-256: `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f`

## Required Gemini verification

Verify that:

1. Phase 26XO–26XR was committed and pushed;
2. both SQL drafts abort unconditionally before mutation;
3. the forward draft verifies exact policy state;
4. only the broad legacy tools policy is targeted;
5. the approved-only tools policy is preserved;
6. audit schema handling is assertion-only;
7. grant revocations are correctly excluded pending dependency proof;
8. rollback recreates the exact legacy policy;
9. no database connection or SQL execution occurred;
10. public launch and operational reactivation remain blocked.

## Requested determination

Select exactly one:

- `APPROVE_GUARDED_RLS_DRIFT_MIGRATION_DRAFTS`
- `REVISE_GUARDED_RLS_DRIFT_MIGRATION_DRAFTS`
- `BLOCK_GUARDED_RLS_DRIFT_MIGRATION_DRAFTS`

## Current state

- Forward draft: `COMPLETE_PENDING_GEMINI_REVIEW`
- Rollback draft: `COMPLETE_PENDING_GEMINI_REVIEW`
- Guard removal: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Grant mutation: `NOT_INCLUDED`
- Database mutation: `PROHIBITED`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
