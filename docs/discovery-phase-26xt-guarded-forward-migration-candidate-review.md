# Phase 26XT — Guarded Forward Migration Candidate Review

## Candidate

- File: `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql`
- SHA-256: `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9`
- Mode: `100644`

## Draft behavior

The first statement raises an unconditional exception. Therefore the draft cannot perform remediation if accidentally executed.

After removal of the guard in a separately authorized phase, the intended logic would:

1. verify the exact approved-only and legacy tools policies;
2. fail closed on drift;
3. drop only `Public can read tools`;
4. preserve the approved-only policy;
5. assert audit relations, sequence and RLS existence;
6. perform no grant revocation;
7. perform no table recreation or row mutation.

## Current state

- Draft created: `YES`
- Executable migration: `NO`
- Migration execution: `PROHIBITED`
