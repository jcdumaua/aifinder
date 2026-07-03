# AiFinder Discovery Engine — Phase 22I Candidate Decision Execution Preflight Design

## Phase Status

Phase 22I is a documentation-only preflight design phase.

This phase does not execute candidate decisions.

This phase does not perform live database reads or writes.

This phase does not approve, reject, publish, clean up, or modify any candidate rows.

## Starting Checkpoint

Phase 22H was completed and pushed to `main`.

```text
Latest pushed commit: 189f3be Document Phase 22H candidate decision execution planning gate
Expected repo status before Phase 22I docs step: ## main...origin/main
```

## Purpose

The purpose of Phase 22I is to design the non-mutating preflight that must exist before any future candidate decision execution phase.

Phase 22H established that candidate decision execution remains locked.

Phase 22I defines what a future execution preflight must check before any live candidate decision action can be considered.

This phase is intentionally not an execution phase.

## Allowed Scope

Phase 22I may document:

- future preflight objectives
- future preflight inputs
- future preflight output format
- future preflight guardrails
- candidate targeting requirements
- mutation containment requirements
- audit verification expectations
- approval phrase requirements
- failure handling expectations
- future phase sequencing

## Forbidden Scope

Phase 22I must not include:

- source code changes
- UI behavior changes
- API behavior changes
- Supabase schema changes
- migration changes
- generated type changes
- RLS policy changes
- live database reads
- live database writes
- candidate decision execution
- `approve_for_draft`
- public publishing
- cleanup mutation
- crawler execution
- extraction execution
- scheduler or automation enablement
- commit or push before review and explicit approval

## Candidate Decision Execution Remains Locked

Candidate decision execution remains locked after Phase 22I.

Completing this design phase must not be interpreted as approval to perform a live candidate decision.

A future phase must separately authorize any live action with an explicit candidate id, exact action name, bounded mutation path, audit expectation, and James approval phrase.

## Future Preflight Objective

The future candidate decision execution preflight should answer one question:

```text
Is it safe to execute exactly one explicitly approved candidate decision action against exactly one explicitly identified candidate row?
```

The preflight should fail closed unless every required condition is satisfied.

## Future Preflight Inputs

A future preflight should require the following explicit inputs:

1. Phase identifier.
2. Candidate id.
3. Intended decision action.
4. Expected current candidate status.
5. Expected post-decision candidate status.
6. Whether public publishing is allowed.
7. Whether `approve_for_draft` is allowed.
8. Whether cleanup mutation is allowed.
9. Expected audit event name.
10. James approval phrase.
11. Gemini review status, if required by the phase.

No implicit defaults should unlock mutation behavior.

## Future Preflight Output

A future preflight should produce a terminal report with these sections:

```text
=== Boundary ===
=== Repo State ===
=== Expected Commit Check ===
=== Candidate Target ===
=== Intended Action ===
=== Mutation Scope ===
=== Public Publishing Lock ===
=== approve_for_draft Lock ===
=== Cleanup Lock ===
=== Audit Expectation ===
=== Approval Phrase Verification ===
=== Final Preflight Decision ===
```

The final preflight decision must be one of:

```text
PREFLIGHT_PASS_NON_MUTATING
PREFLIGHT_FAIL_LOCKED
```

A passing preflight must still be non-mutating unless it is part of a separately approved live execution phase.

## Required Future Guards

A future candidate decision preflight must verify:

1. Repository is clean.
2. Repository is aligned with `origin/main`.
3. Latest commit matches the expected completed gate.
4. No unreviewed source changes exist.
5. Candidate id is explicitly provided.
6. Candidate id format is valid.
7. Intended action is explicitly provided.
8. Intended action is one of the phase-approved actions.
9. Expected current status is explicitly documented.
10. Expected post-decision status is explicitly documented.
11. Mutation scope is limited to the intended candidate row.
12. Public publishing is locked unless separately approved.
13. `approve_for_draft` is locked unless separately approved.
14. Cleanup mutation is locked unless separately approved.
15. Audit expectation is documented.
16. Rollback or containment notes are documented.
17. James approval phrase exactly matches the future phase requirement.
18. Raw terminal output is saved with `tee`.
19. Raw terminal output is copied to clipboard with `pbcopy`.
20. Script exits with the original success/failure status.
21. No heredoc workflow is used unless absolutely necessary.

## Approval Phrase Design

A future live execution approval phrase should remain explicit and hard to trigger accidentally.

Recommended format:

```text
Approve Phase XX live candidate decision execution for candidate <candidate_id> with action <action_name>
```

The future phase should reject generic approvals such as:

```text
Proceed
Approved
Continue
Run it
Do the decision
```

These are not sufficient for live mutation authorization.

## Candidate Targeting Design

A future preflight should require an exact candidate id.

The target candidate must not be inferred from:

- newest row
- first row
- only visible row
- UI selection alone
- prior chat context alone
- partial terminal output
- Gemini assumptions

Candidate targeting must be explicit in the current phase instructions.

## Mutation Scope Design

A future live execution phase should be limited to one candidate row and one candidate decision action unless a separate phase approves a broader scope.

The expected mutation path should be documented before execution.

At minimum, it should define:

- table involved
- candidate id involved
- status before action
- status after action
- audit event expected
- forbidden side effects
- verification method

## Public Publishing Lock

Public publishing remains locked.

A future candidate decision preflight must explicitly confirm whether the intended action can create or modify public-facing tool records.

Default state:

```text
Public publishing: locked
```

Any change to this default requires a separate planning gate and explicit approval.

## approve_for_draft Lock

`approve_for_draft` remains locked.

A future candidate decision preflight must explicitly confirm whether `approve_for_draft` is in scope.

Default state:

```text
approve_for_draft: locked
```

Any execution involving `approve_for_draft` requires a separate approval phrase and must not be inferred from generic candidate decision approval.

## Cleanup Lock

Cleanup mutation remains locked unless separately approved.

A future candidate decision preflight must explicitly confirm whether cleanup is prohibited, allowed, or required.

Default state:

```text
Cleanup mutation: locked
```

## Audit Expectation Design

A future live execution phase should require an audit expectation before mutation.

The preflight should document:

- expected audit event name
- expected audit correlation id behavior
- expected actor/admin context handling
- expected candidate id reference
- expected before/after state representation, if applicable

If audit expectations are unclear, execution must remain locked.

## Failure Handling Design

The future preflight should fail closed when:

- repo state is dirty
- latest commit is unexpected
- candidate id is missing
- intended action is missing
- approval phrase is missing or does not exactly match
- public publishing scope is ambiguous
- `approve_for_draft` scope is ambiguous
- cleanup scope is ambiguous
- audit behavior is ambiguous
- any command exits non-zero
- terminal output is not captured

Failure must not trigger cleanup, retry mutation, alternate action, or automatic continuation.

## Future Phase Recommendation

Recommended next phase after this design phase:

```text
Phase 22J — Candidate Decision Execution Preflight Review Gate
```

Phase 22J should remain non-mutating unless James explicitly changes the phase purpose.

A later live execution phase, if approved, should use a stricter name such as:

```text
Phase 22K — Controlled Single Candidate Decision Execution
```

## Workflow Note

AiFinder terminal workflow should continue in no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must save output with `tee`, copy raw terminal output with `pbcopy`, and preserve original command status.

## Phase 22I Conclusion

Phase 22I defines the future candidate decision execution preflight design.

It does not unlock execution.

It preserves the fail-closed boundary before any mutation-capable candidate decision phase.
