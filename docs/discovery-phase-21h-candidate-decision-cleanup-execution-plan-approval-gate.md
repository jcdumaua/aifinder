# Discovery Phase 21H — Candidate Decision Cleanup Execution Plan / Approval Gate

## Status

Planning / approval gate only.

This phase follows Phase 21G, which reviewed the candidate decision live smoke result and selected a cleanup direction.

Phase 21H does **not** execute cleanup. It documents the exact controlled cleanup plan, required preflight checks, required review, and required human approval before any future database mutation may occur.

## Previous Phase Reference

Latest completed phase:

- Phase: 21G — Candidate Decision Live Smoke Result Review / Cleanup Planning Gate
- Commit: `a9f48c4` — `Document candidate decision cleanup planning gate`
- Final repo status after push: `## main...origin/main`

Phase 21G selected Option C:

- Mark the controlled cleanup as resolved/closed while preserving the row.
- Do not delete the row.
- Do not rewrite historical smoke evidence.
- Preserve auditability and traceability.

## Phase 21H Purpose

Convert the Phase 21G cleanup recommendation into a precise, reviewable execution plan before any mutation is allowed.

The purpose is to make the next controlled cleanup phase safe, narrow, reversible in intent, and explicitly approved.

## Phase 21H Scope

Allowed in this phase:

- Documentation only.
- Planning only.
- Terminal verification only.
- Gemini review package preparation.
- Commit and push only after James explicitly approves.

Not allowed in this phase:

- No database mutation.
- No cleanup execution.
- No delete operation.
- No update operation.
- No candidate decision change.
- No public `tools` write.
- No public publishing.
- No `approve_for_draft`.
- No source/UI behavior changes.
- No schema changes.
- No migration changes.
- No type generation.
- No crawler, extraction, LLM, or automation wiring changes.

## Intended Future Cleanup Direction

The future cleanup execution phase may perform only the narrowly approved Option C action:

- Preserve the controlled candidate decision row.
- Mark cleanup/resolution state as closed/resolved if supported by the existing schema and current row state.
- Preserve evidence of the live smoke result.
- Preserve auditability.
- Avoid destructive cleanup.

The future execution phase must not broaden into unrelated cleanup or production behavior.

## Required Future Preflight Before Mutation

Before any future cleanup mutation, the terminal workflow must perform a read-only preflight that confirms:

1. Current branch is `main`.
2. Repo is clean and synced with `origin/main`.
3. Latest committed Phase 21H document is present.
4. The relevant controlled fixture/candidate row still exists.
5. The row matches the exact expected controlled smoke marker or unique identifier from prior phases.
6. The current row state still makes Option C valid.
7. The intended mutation targets exactly one controlled row.
8. The update statement is reviewed before execution.
9. The update is not a delete.
10. No public publishing fields are changed.
11. No unrelated candidate/source/run rows are changed.
12. No schema/migration/typegen/source/UI files are changed.

## Required Future Approval Phrase

No cleanup mutation may be executed until James provides an explicit approval phrase in the terminal workflow.

Required approval phrase:

```text
Approve Phase 21I controlled cleanup execution
```

Without that exact approval, the future cleanup phase must remain read-only.

## Future Phase Recommendation

Recommended next phase after Phase 21H:

```text
Phase 21I — Candidate Decision Cleanup Controlled Execution
```

Phase 21I may proceed only after:

1. Phase 21H is reviewed.
2. Gemini approves Phase 21H as safe.
3. Phase 21H is committed.
4. James explicitly approves the Phase 21H commit.
5. James explicitly approves the Phase 21H push.
6. The repo is clean and synced after push.
7. James later provides the required Phase 21I cleanup approval phrase.

## Safety Boundary Summary

Phase 21H is a planning gate.

It intentionally prevents accidental mutation by separating:

- cleanup planning,
- cleanup review,
- cleanup approval,
- cleanup execution.

No cleanup execution occurred in Phase 21H.
