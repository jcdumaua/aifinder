# Phase 21G — Candidate Decision Live Smoke Result Review / Cleanup Planning Gate

## Status

Planning gate drafted.

## Purpose

Phase 21G reviews the completed Phase 21F live candidate decision smoke result and defines the next cleanup or closure path for the controlled Phase 21E fixture.

This phase is intentionally documentation-only and planning-only.

It does not execute any cleanup mutation.

It does not send a candidate decision request.

It does not publish anything.

It does not modify source code, UI behavior, schema, migrations, generated types, or production data beyond documentation in this repository.

## Background

Phase 21E created a controlled staged candidate fixture for candidate decision testing.

Phase 21F successfully executed one authenticated live HTTP candidate decision POST against that fixture using the safe decision action `needs_more_evidence`.

The live smoke validated the candidate decision route, admin session protection, CSRF protection, request validation, mutation helper path, and read-only post-mutation verification.

## Phase 21F Result Summary

Phase 21F passed.

Exactly one actual HTTP POST was sent to:

`POST /api/admin/discovery/candidate-staging-queue/c7c50401-fa5b-4b2e-bb43-d30bf05a144a/decision`

The selected action was:

`needs_more_evidence`

The reason was:

`phase_21f_live_smoke`

The notes were:

`Controlled Phase 21F live smoke against Phase 21E staged fixture. Do not publish.`

The HTTP response returned status `200` with `ok: true`.

## Controlled Fixture Current State

After Phase 21F, the controlled fixture is expected to remain in `public.discovery_candidate_tools` with the following state:

- Candidate ID: `c7c50401-fa5b-4b2e-bb43-d30bf05a144a`
- Phase 21E marker: `phase-21e-controlled-fixture-20260702171623-f3d66798`
- Audit correlation ID: `91e249ff-8b2b-4e7c-b04c-a3733dd02c18`
- Candidate status: `needs_more_evidence`
- Decision action: `needs_more_evidence`
- Decision reason: `phase_21f_live_smoke`
- Decision notes: `Controlled Phase 21F live smoke against Phase 21E staged fixture. Do not publish.`
- Decided at: `2026-07-02T17:44:00.852497+00:00`
- Decided by: `AiFinder Admin`
- Cleanup status: `active`

## Boundary Verification From Phase 21F

The Phase 21F live smoke preserved the important safety boundaries:

- `public.tools` count remained `10`
- `discovered_tools` count remained `0`
- No `approve_for_draft` action was used
- No public publishing behavior occurred
- No `public.tools` write occurred
- No `discovered_tools` write occurred
- No cleanup mutation occurred
- No schema or migration apply occurred
- No type generation occurred
- No source or UI behavior change occurred

## Cleanup Planning Requirement

The controlled fixture should not remain active forever.

However, cleanup must be planned separately from the successful live smoke result because cleanup is another live mutation.

Cleanup must require a separate explicit approval phrase before execution.

Phase 21G only plans the cleanup path.

## Cleanup Options Considered

### Option A — Leave the fixture as-is temporarily

This option keeps the candidate in `needs_more_evidence` with `cleanup_status = active`.

Benefits:

- Preserves the exact post-smoke evidence while Phase 21G is reviewed.
- Avoids additional mutation risk during the review gate.
- Keeps the candidate available for read-only verification.

Risks:

- Leaves a controlled test fixture in the candidate queue longer than necessary.
- Could confuse future admin review if not clearly documented.

This is acceptable only as a temporary state while cleanup planning is reviewed.

### Option B — Delete the fixture row by exact candidate ID

This option removes the controlled fixture from `public.discovery_candidate_tools` using the exact candidate ID.

Benefits:

- Fully removes the controlled test fixture from the active candidate table.
- Prevents future admin confusion.

Risks:

- Deletes row-level evidence from the primary candidate table.
- May be less desirable if audit/history retention is preferred.

This option should only be considered if the project intentionally allows deletion of controlled smoke fixtures.

### Option C — Mark the fixture as cleanup-resolved by exact candidate ID

This option updates the controlled fixture by exact candidate ID to mark its cleanup state as resolved or closed, while preserving the row for auditability.

Benefits:

- Preserves evidence and audit trail.
- Clearly removes the fixture from active cleanup state.
- Avoids public publishing and avoids deleting evidence.
- Keeps the operation bounded to the exact controlled fixture.

Risks:

- Requires confirming the allowed cleanup status values and exact table contract before mutation.
- Still requires a live mutation.

This is the preferred cleanup direction if the schema supports an appropriate resolved/cleaned/closed cleanup status.

## Recommended Cleanup Direction

The recommended next cleanup direction is Option C:

Mark the controlled fixture cleanup state as resolved or closed by exact candidate ID only, if the current schema supports such a value.

If the schema does not support a resolved or closed cleanup status, the cleanup plan should stop and document the constraint before any mutation.

The cleanup must not change the candidate into `approve_for_draft`.

The cleanup must not publish the candidate.

The cleanup must not write to `public.tools`.

The cleanup must not write to `discovered_tools`.

The cleanup must not alter schema, migrations, generated types, source behavior, or UI behavior.

## Required Pre-Cleanup Read-Only Verification

Before any cleanup mutation is approved or attempted, the next phase must perform read-only verification of:

1. Exact candidate exists by ID:
   - `c7c50401-fa5b-4b2e-bb43-d30bf05a144a`

2. Candidate still matches the Phase 21E marker:
   - `phase-21e-controlled-fixture-20260702171623-f3d66798`

3. Candidate still matches the Phase 21E audit correlation ID:
   - `91e249ff-8b2b-4e7c-b04c-a3733dd02c18`

4. Candidate status remains:
   - `needs_more_evidence`

5. Decision action remains:
   - `needs_more_evidence`

6. Cleanup status remains:
   - `active`

7. `public.tools` count remains:
   - `10`

8. `discovered_tools` count remains:
   - `0`

9. Repository remains clean and aligned with `origin/main`.

## Required Stop Conditions

A future cleanup phase must stop before mutation if any of these are true:

- Candidate ID is missing.
- More than one row matches the target.
- Candidate marker does not match the Phase 21E marker.
- Audit correlation ID does not match the Phase 21E audit correlation ID.
- Candidate status is not `needs_more_evidence`.
- Decision action is not `needs_more_evidence`.
- Cleanup status is not `active`.
- `public.tools` count is not `10`.
- `discovered_tools` count is not `0`.
- The cleanup status target is unsupported or ambiguous.
- The mutation would touch any row other than the exact candidate ID.
- The mutation would publish, approve for draft, or write to public tool tables.
- Repository state is dirty or not aligned with the expected pushed baseline.

## Required Approval Phrase For Future Cleanup

A future cleanup mutation must not run unless James explicitly approves with a phrase similar to:

`Approve Phase 21H controlled candidate fixture cleanup execution`

The exact phrase should be finalized in the Phase 21H cleanup execution plan.

## Recommended Next Phase

Phase 21H — Controlled Candidate Fixture Cleanup Plan / Approval Gate.

Phase 21H should remain docs-only until it has:

- confirmed the exact cleanup status contract,
- selected the exact cleanup mutation shape,
- defined rollback/recovery checks,
- defined post-cleanup verification,
- received Gemini review,
- and received separate explicit James approval before any live cleanup mutation.

## Phase 21G Boundary Statement

Phase 21G is complete only when this cleanup planning gate is reviewed, approved, committed, and pushed as documentation.

Phase 21G does not authorize cleanup execution.

Phase 21G does not authorize public publishing.

Phase 21G does not authorize `approve_for_draft`.

Phase 21G does not authorize schema, migration, type generation, source, UI, or behavior changes.

Phase 21G does not authorize writes to `public.tools` or `discovered_tools`.
