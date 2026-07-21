# Phase 27MW-27MZ Active Migration Guard Divergence Containment Gate

## Authorization and baseline

- Phase: `PHASE_27MW_27MZ_RECOVERY_V2_ACTIVE_MIGRATION_GUARD_CONTAINMENT`
- Authorization token: `APPROVE_PHASE_27MW_27MZ_RECOVERY_V2_ACTIVE_MIGRATION_GUARD_CONTAINMENT_AND_AUTHORIZE_ONE_EXACT_SCOPE_PATCH_RUN`
- Repository baseline: `f8e6a4c375acae7609b572b06376e5d0f14486b7`

## Exact containment

| Role | Path | Before SHA-256 | After SHA-256 |
|---|---|---|---|
| Active forward | `supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql` | `7ab6d4ee6ca08eee5a4ce5894bf6bdc4fa9dfcbcf1a688e1aa991a3413d8b2d3` | `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9` |
| Guarded forward draft | `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql` | `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9` | unchanged |
| Active rollback | `supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql` | `bbdaaf439a8203eba7e459f632d0b8a0d0bb60499ee6dade17139dbb247432f2` | `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f` |
| Guarded rollback draft | `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql` | `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f` | unchanged |

The pre-patch divergence consisted only of removing exactly one reviewed 159-byte unconditional abort guard from each guarded draft. After containment, each active file is byte-identical to its corresponding guarded draft.

## Guard and scope assertions

- Active forward guard count: `1`, before `BEGIN;`
- Draft forward guard count: `1`, before `BEGIN;`
- Active rollback guard count: `1`, before `BEGIN;`
- Draft rollback guard count: `1`, before `BEGIN;`
- Modified tracked path count: `2`
- Added untracked path count: `1`
- Draft modification count: `0`
- Other tracked modification count: `0`
- Index state: `EMPTY`

## Unresolved and blocked evidence

- Migration filename and placement: `UNRESOLVED_REQUIRES_TARGETED_INSPECTION`
- Migration-history status: `BLOCKED_PENDING_SEPARATE_AUTHORIZATION`
- Audit grant dependency status: `UNRESOLVED_REQUIRES_TARGETED_INSPECTION`
- Live schema, RLS, policy, grant, ownership, and migration-history evidence: `BLOCKED_PENDING_SEPARATE_AUTHORIZATION`

This static containment does not authorize guard removal, draft activation beyond exact fail-closed byte copying, SQL execution, database access, Supabase access, migration application or repair, policy/grant/sequence/function/trigger/row mutation, type generation, environment inspection, deployment, publishing, operational reactivation, public launch, staging, commit, or push.

## Next gate

`PROPOSE_PHASE_27MW_27MZ_RECOVERY_V2_ACTIVE_MIGRATION_GUARD_CONTAINMENT_GEMINI_FINAL_REVIEW`

Gemini must return the separately defined exact commit/push authorization before any staging, commit, or push.
