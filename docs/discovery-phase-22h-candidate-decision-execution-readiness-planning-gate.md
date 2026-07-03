# AiFinder Discovery Engine — Phase 22H Candidate Decision Execution Readiness Planning Gate

## Phase Status

Phase 22H is a documentation-only planning gate.

This phase does not execute candidate decisions.

This phase does not perform live database mutations.

This phase does not approve, reject, publish, or modify any candidate rows.

## Starting Checkpoint

Phase 22G was completed and pushed to `main`.

```text
Latest pushed commit: 3585bb0 Document Phase 22G readiness verification
Expected repo status before Phase 22H docs step: ## main...origin/main
```

## Purpose

The purpose of Phase 22H is to define the readiness boundary for any future candidate decision execution work.

This phase exists to prevent accidental transition from reviewed UI controls into live mutation behavior without a clearly documented gate.

The candidate decision controls may be visually present or reviewed, but execution must remain locked until a future phase explicitly authorizes a controlled candidate decision action.

## Allowed Scope

Phase 22H may document:

- candidate decision execution readiness requirements
- safety boundaries before live mutation
- required preflight checks
- required approval phrases
- required Gemini review before commit
- expected audit and rollback considerations
- future phase sequencing
- terminal workflow requirements

## Forbidden Scope

Phase 22H must not include:

- source code changes
- UI behavior changes
- API behavior changes
- Supabase schema changes
- migration changes
- generated type changes
- RLS policy changes
- live database reads beyond ordinary git/status verification
- live database writes
- candidate decision execution
- `approve_for_draft`
- public publishing
- cleanup mutation
- crawler execution
- extraction execution
- scheduler or automation enablement

## Candidate Decision Execution Remains Locked

Candidate decision execution remains locked after this phase.

No user-facing or admin-facing decision action should be treated as execution-ready solely because Phase 22G and Phase 22H are complete.

A future implementation or execution phase must independently define:

- exact candidate row target
- exact command or UI action
- expected mutation path
- expected audit row behavior
- pre-mutation state check
- post-mutation verification
- cleanup strategy, if any
- rollback or containment strategy
- explicit James approval phrase
- Gemini review requirement, if applicable

## Required Preflight Before Any Future Candidate Decision Execution

Before any future candidate decision execution phase, the workflow must verify:

1. Repository is clean and aligned with `origin/main`.
2. Latest commit matches the expected completed documentation gate.
3. No unreviewed source changes are present.
4. Candidate target is explicitly identified.
5. Mutation scope is exactly bounded.
6. Candidate status transition is documented.
7. Audit behavior is documented.
8. Public publishing remains locked unless separately approved.
9. `approve_for_draft` remains locked unless separately approved.
10. Cleanup behavior is either prohibited or separately approved.
11. Raw terminal output is saved with `tee`.
12. Raw terminal output is copied to clipboard with `pbcopy`.
13. Script exits with the original success/failure code.
14. No heredoc-based terminal workflow is used unless absolutely necessary.

## Approval Language Requirement

Any future live candidate decision execution must require an explicit approval phrase from James.

A general phrase such as “proceed” is not sufficient for live mutation.

Recommended future approval phrase format:

```text
Approve Phase XX live candidate decision execution for candidate <candidate_id> with action <action_name>
```

Until such a phrase is provided in a future phase, candidate decision execution remains locked.

## Future Phase Recommendation

Recommended next phase after this planning gate:

```text
Phase 22I — Candidate Decision Execution Preflight Design
```

Phase 22I should still be non-mutating unless James explicitly approves a live execution phase.

## Workflow Note

AiFinder terminal workflow should continue using no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must continue to save output with `tee`, copy raw output to clipboard with `pbcopy`, and preserve the original command status.

## Phase 22H Conclusion

Phase 22H defines a safe readiness planning gate.

It does not unlock live candidate decision execution.

It preserves the Discovery Engine safety boundary before any future mutation-capable phase.
