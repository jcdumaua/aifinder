# Phase 21C — Controlled Candidate Fixture Planning / Approval Gate

Created: 2026-07-02 09:50:48

## Purpose

Define a planning-only gate for a possible controlled staged candidate fixture after Phase 21B read-only preflight found no staged candidates.

This phase does not create a fixture, does not mutate the database, does not send a decision POST, and does not approve live smoke execution.

## Baseline

- Baseline commit: `ae0f917`
- Baseline subject: `Document candidate decision live preflight result`
- Branch: `main`
- Remote status before Phase 21C: `main...origin/main`

## Prior phase evidence

- Phase 21A defined the live smoke approval boundary and required an explicit candidate target and decision action before mutation.
- Phase 21B performed a read-only staged candidate preflight.
- Phase 21B query result: `[]`.
- Phase 21B correctly blocked live smoke execution because no staged candidate target existed.

## Phase 21C verification rerun

The following safe checks were rerun:

- `node testing/discovery-candidate-decision-api-static-assertions.mjs`
- `git diff --check`

## Fixture planning objective

If the project needs to unblock candidate decision live smoke, the safest next path may be a controlled staged candidate fixture.

This document defines the planning requirements only. Fixture creation must not occur unless separately and explicitly approved by the user in a future phase.

## Proposed future Phase 21D

Recommended next phase, if approved later:

Phase 21D — Controlled Candidate Fixture Creation Plan / Live Mutation Approval Gate

Phase 21D should remain planning/approval-focused unless the user separately approves fixture creation. Any actual insert must be isolated, auditable, reversible, and explicitly bounded.

## Required fixture constraints

A future controlled fixture must satisfy all of the following before creation:

- Fixture target table is explicitly identified.
- Exact insert payload is documented before execution.
- Fixture marker is unique and searchable.
- Candidate status is explicitly `staged`.
- No `public.tools` write is included.
- No `discovered_tools` write is included.
- No public publishing path is included.
- Cleanup or reversal plan is documented before execution.
- Expected audit behavior is documented before execution.
- Exact verification queries are documented before execution.
- Stop conditions are documented before execution.

## Required separate approval phrase for future fixture creation

Before any future fixture creation can run, the user must provide a separate explicit live mutation approval phrase similar to:

`Approve Phase 21D controlled staged candidate fixture creation`

That approval must be separate from approval to commit or push documentation.

## Fixture creation is not approved by this phase

Phase 21C does not approve:

- Creating a staged candidate fixture.
- Inserting any row.
- Updating any candidate.
- Writing any audit event.
- Sending any decision POST.
- Running live API smoke.
- Running Supabase DB commands.
- Applying migrations.
- Generating types.
- Publishing anything to `public.tools`.
- Writing anything to `discovered_tools`.

## Safety boundary confirmation

Phase 21C is documentation-only.

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

Phase 21C is ready for Gemini review as a planning-only controlled fixture approval gate.

Do not commit until Gemini approves.

Do not push until the user explicitly approves after commit.
