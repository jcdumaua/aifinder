# Phase 21A — Candidate Decision Live Smoke Plan / Approval Gate

Created: 2026-07-02 09:37:59

## Purpose

Define a safe planning-only gate for a future candidate decision live smoke. This phase does not run the live smoke and does not approve any mutating action.

The goal is to document the exact approval boundary, candidate-selection requirements, expected evidence, rollback/cleanup expectations, and stop conditions before any future live decision workflow can be considered.

## Baseline

- Baseline commit: `e3cd232`
- Baseline subject: `Document candidate decision track closure gate`
- Branch: `main`
- Remote status before Phase 21A: `main...origin/main`

## Prior readiness evidence

- Phase 20B recorded passing manual QA for Desktop, Tablet/iPad portrait, Tablet/iPad landscape, Mobile, accessibility, safety boundaries, and network boundaries.
- Phase 20C reviewed and committed the Phase 20B QA result gate.
- Phase 20D confirmed release readiness from a static verification and documented manual QA standpoint.
- Phase 20E formally closed the candidate decision admin UI track and recommended this planning-only live gate.

## Phase 21A verification rerun

The following safe checks were rerun:

- `node testing/discovery-candidate-decision-api-static-assertions.mjs`
- `node testing/discovery-candidate-decision-admin-ui.test.mjs`
- `npm run check`
- `git diff --check`

## Live smoke is not approved by this phase

Phase 21A is planning-only.

This phase does not approve:

- Creating a candidate row.
- Selecting a live candidate row for mutation.
- Sending a decision POST.
- Calling `POST /api/admin/discovery/candidate-staging-queue/[id]/decision`.
- Updating candidate status.
- Writing audit events.
- Running live API smoke.
- Running Supabase DB commands.
- Applying migrations.
- Generating types.
- Publishing anything to `public.tools`.
- Writing anything to `discovered_tools`.

## Required separate approval phrase for any future live smoke

Before any future live candidate decision smoke can run, the user must provide a separate explicit approval phrase similar to:

`Approve Phase 21B live candidate decision smoke execution`

That approval must be separate from approval to commit or push documentation.

## Proposed future Phase 21B scope

Recommended next execution phase, only if separately approved:

Phase 21B — Candidate Decision Live Smoke Execution

Proposed constraints for Phase 21B:

- Execute exactly one minimal live candidate decision smoke.
- Prefer a controlled fixture candidate if a safe fixture-creation strategy is separately approved.
- If fixture creation is not approved, use only an explicitly selected existing staged candidate approved by the user.
- Use one low-risk decision action only.
- Capture before/after evidence.
- Capture audit evidence.
- Verify no `public.tools` write.
- Verify no `discovered_tools` write.
- Stop immediately on unexpected status, unexpected audit behavior, or unexpected mutation scope.
- Document cleanup or reversal requirements before execution.

## Required Phase 21B preflight checklist

Phase 21B must not begin until all items are satisfied:

- User separately approves live smoke execution.
- Candidate target is explicitly identified and approved.
- Decision action is explicitly identified and approved.
- Expected candidate status transition is documented.
- Expected audit event shape is documented.
- Rollback/cleanup plan is documented.
- Stop conditions are documented.
- Network/API request count is bounded.
- No public publishing path is included.
- No `public.tools` or `discovered_tools` write is included.

## Safety boundary confirmation

Phase 21A is documentation-only.

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

Phase 21A is ready for Gemini review as a planning-only live smoke approval gate.

Do not commit until Gemini approves.

Do not push until the user explicitly approves after commit.
