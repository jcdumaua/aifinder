# Phase 26XU — Guarded Rollback Migration Candidate Review

## Candidate

- File: `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql`
- SHA-256: `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f`
- Mode: `100644`

## Draft behavior

The first statement raises an unconditional exception. Therefore the rollback cannot alter production if accidentally executed.

After removal of the guard in a separately authorized phase, the intended logic would recreate exactly:

- policy name: `Public can read tools`;
- permissive posture;
- command: `SELECT`;
- roles: `anon, authenticated`;
- expression: `USING (true)`;
- no `WITH CHECK`.

No grant rollback is included because the forward draft performs no grant revocation.

## Current state

- Draft created: `YES`
- Executable rollback: `NO`
- Rollback execution: `PROHIBITED`
