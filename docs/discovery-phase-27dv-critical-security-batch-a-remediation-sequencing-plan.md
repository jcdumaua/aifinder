# AiFinder Phase 27DV — Critical Security Batch A Remediation Sequencing Plan

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Recommended Sequence

### Remediation A1 — Admin Session Boundary
Targets:
- `app/api/admin/logout/route.ts`
- `app/api/admin/session/route.ts`
- supporting admin-auth tests only as explicitly authorized.

Reason: smallest high-impact code surface and shared security primitive.

### Remediation A2 — Privileged Supabase Client Boundary
Target:
- `lib/supabase-admin.ts`
- import-boundary tests.

Reason: establishes the server-only foundation used by downstream privileged services.

### Remediation A3 — Discovery Admin Mutation Services
Targets:
- `lib/discovery/discovery-candidate-decision-admin.ts`
- `lib/discovery/discovery-candidate-staging-admin.ts`
- focused authorization, validation, and negative tests.

Reason: privileged mutation services should be repaired only after the auth and client boundaries are locked.

### Remediation A4 — Corrective Database Migration Package
Targets:
- six approved migration findings;
- new corrective migration files only;
- static SQL review first;
- database execution later under separate authorization.

Reason: database policy changes have distinct rollback and deployment risks and must not be mixed with application-code patches.

## Batch Discipline
- A1, A2, and A3 should be separate narrow code-change phases.
- A4 should be a separate migration-planning and implementation track.
- Do not combine application code and SQL migration changes in one commit.
- Each phase requires tests first, exact scope, Gemini review, commit/push verification, and no live execution unless separately authorized.
