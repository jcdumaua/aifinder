# Phase 21D — Controlled Candidate Fixture Creation Plan / Live Mutation Approval Gate

Created: 2026-07-02 09:55:26

## Purpose

Define the exact planning and approval gate for possible controlled staged candidate fixture creation after Phase 21B found no staged candidates and Phase 21C approved fixture planning.

This phase is documentation-only. It does not create a fixture, does not insert any row, does not mutate the database, and does not run live smoke.

## Baseline

- Baseline commit: `a86579f`
- Baseline subject: `Document controlled candidate fixture planning gate`
- Branch: `main`
- Remote status before Phase 21D: `main...origin/main`

## Prior phase evidence

- Phase 21B read-only preflight queried `discovery_candidate_tools` with `candidate_status=eq.staged` and returned `[]`.
- Phase 21B blocked live candidate decision smoke because no staged candidate target existed.
- Phase 21C created a planning-only controlled fixture approval gate.
- Phase 21C did not approve fixture creation.

## Phase 21D verification rerun

The following safe checks were rerun:

- `node testing/discovery-candidate-decision-api-static-assertions.mjs`
- `git diff --check`

## Proposed future execution phase

Recommended future execution phase, only after separate explicit live mutation approval:

Phase 21E — Controlled Staged Candidate Fixture Creation Execution

Phase 21E should create at most one controlled staged candidate fixture, verify it exists, and stop before any decision POST.

## Required separate approval phrase

Before fixture creation can run, the user must provide this separate explicit live mutation approval phrase:

`Approve Phase 21E controlled staged candidate fixture creation execution`

This approval must be separate from documentation commit approval and separate from push approval.

## Required fixture creation constraints

Any future fixture creation execution must follow these constraints:

- Create exactly one staged candidate fixture.
- Use table `discovery_candidate_tools` only if confirmed by the existing project schema and helper contracts.
- Use a unique fixture marker in the candidate name, URL, notes, metadata, or equivalent safe searchable field.
- Set candidate status to `staged` only.
- Avoid public publishing fields and publishing workflows.
- Do not write to `public.tools`.
- Do not write to `discovered_tools`.
- Do not send a decision POST during fixture creation.
- Do not run schema apply, migration apply, or type generation.
- Capture inserted candidate ID.
- Verify the inserted candidate can be selected by the read-only staged candidate query.
- Stop immediately after fixture verification.

## Required pre-execution evidence for Phase 21E

Before Phase 21E can execute, the exact live mutation plan must document:

- Target table.
- Exact insert method.
- Exact insert payload.
- Required non-null columns.
- Fixture marker.
- Expected inserted row shape.
- Expected read-only verification query.
- Cleanup/reversal plan.
- Stop conditions.
- Confirmation that no public publishing path is involved.

## Stop conditions

Future fixture creation must stop immediately if:

- The working tree is not clean.
- The branch is not `main`.
- The expected baseline commit does not match.
- Required environment variables are missing.
- Required table/column assumptions cannot be verified.
- The insert would touch more than one row.
- Any operation targets `public.tools` or `discovered_tools`.
- Any operation would send a decision POST.
- Any operation would run schema/migration/typegen commands.

## Fixture creation is not approved by this phase

Phase 21D does not approve:

- Creating a staged candidate fixture.
- Inserting any row.
- Updating any row.
- Deleting any row.
- Writing any audit event.
- Sending any decision POST.
- Running live candidate decision smoke.
- Running Supabase DB commands.
- Applying migrations.
- Generating types.
- Publishing anything to `public.tools`.
- Writing anything to `discovered_tools`.

## Safety boundary confirmation

Phase 21D is documentation-only.

Confirmed boundaries:

- No browser/manual QA execution.
- No UI/source behavior change.
- No live API smoke.
- No HTTP mutation request.
- No decision POST.
- No candidate decision submission.
- No Supabase DB push.
- No schema apply.
- No migration apply.
- No type generation.
- No live DB mutation.
- No candidate/audit/source/run row mutation.
- No `public.tools` writes.
- No `discovered_tools` writes.
- No public publishing behavior.
- No commit.
- No push.

## Gemini review status

Phase 21D is ready for Gemini review as a documentation-only live mutation approval gate.

Do not commit until Gemini approves.

Do not push until the user explicitly approves after commit.
