# Phase 21E — Controlled Staged Candidate Fixture Creation Execution Preflight Plan

Created: 2026-07-02 10:01:56

## Purpose

Document the exact pre-execution plan for creating one controlled staged candidate fixture after Phase 21E read-only schema/payload preflight.

This document is still planning-only. It does not create the fixture and does not mutate the database.

## Baseline

- Baseline commit: `6797947`
- Baseline subject: `Document controlled fixture mutation gate`
- Branch: `main`
- Remote status before this preflight plan: `main...origin/main`

## User approval context

The user explicitly approved:

`Approve Phase 21E controlled staged candidate fixture creation execution`

Even with that approval, Phase 21D requires exact payload planning, verification, rollback, and stop conditions before any insert runs.

## Read-only verification performed

- `node testing/discovery-candidate-decision-api-static-assertions.mjs` passed.
- `git diff --check` passed.
- Local table DDL was inspected.
- Generated database type shape was inspected.
- Existing staging helper behavior was inspected.
- Prior controlled staging smoke fixture pattern was inspected.

## Proposed controlled fixture marker

- Fixture marker: `phase-21e-controlled-fixture-20260702100156`
- Fixture name: `AiFinder Phase 21E Controlled Fixture phase-21e-controlled-fixture-20260702100156`
- Fixture URL: `https://example.com/aifinder-phase-21e-controlled-fixture-phase-21e-controlled-fixture-20260702100156`

## Proposed target

- Target table: `public.discovery_candidate_tools`
- Intended status: `staged`
- Intended count: exactly one fixture row
- Public publishing: not included
- `public.tools` writes: not included
- `discovered_tools` writes: not included
- Decision POST: not included during fixture creation

## Required execution approach

The future execution should prefer the existing server-side staging helper path rather than handwritten raw SQL, if the helper can satisfy required fields safely.

If direct REST insertion is used instead, the exact payload must be shown to the user before execution and must include only staging-safe fields.

## Required post-insert verification

After creation, the execution must verify:

- Exactly one fixture row exists for the unique marker.
- The returned candidate ID is captured.
- `candidate_status` is `staged`.
- The fixture appears in the read-only staged candidate query.
- No `public.tools` row was created.
- No `discovered_tools` row was created.
- Working tree remains clean.

## Cleanup / reversal plan

Cleanup must be planned before execution.

Preferred cleanup path for a fixture candidate:

- Use exact candidate ID only.
- Prefer archive/update-to-cleanup status only if allowed by the existing safe cleanup pattern.
- Do not delete broadly.
- Do not update rows by fuzzy name or broad URL pattern.
- Verify cleanup by exact ID.

## Stop conditions

Stop immediately if:

- Working tree is not clean.
- Branch is not `main`.
- HEAD is not `6797947`.
- Required environment variables are missing.
- Required table/type/helper assumptions are not confirmed.
- The planned insert would create more than one row.
- The planned insert touches `public.tools` or `discovered_tools`.
- The planned execution would send a decision POST.
- The planned execution would run schema/migration/typegen commands.
- The inserted row cannot be verified by exact marker and exact ID.

## Fixture creation remains paused

This document does not execute fixture creation.

Before fixture creation runs, ChatGPT must present the exact execution script and receive final confirmation that the script matches this plan.

## Safety boundary confirmation

- No fixture creation was performed.
- No insert/update/delete was performed.
- No decision POST was sent.
- No live smoke was executed.
- No schema/migration/typegen was performed.
- No `public.tools` write was performed.
- No `discovered_tools` write was performed.
- No commit was performed.
- No push was performed.

## Gemini review status

This Phase 21E pre-execution plan is ready for Gemini review before any fixture creation script is provided.

Do not create the fixture until this plan is reviewed and the exact execution script is confirmed.
