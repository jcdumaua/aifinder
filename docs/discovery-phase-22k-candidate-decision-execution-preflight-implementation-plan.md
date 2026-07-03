# AiFinder Discovery Engine — Phase 22K Candidate Decision Execution Preflight Implementation Plan

## Phase Status

Phase 22K is a documentation-only implementation plan.

This phase plans a future candidate decision execution preflight implementation.

This phase does not implement executable preflight code.

This phase does not run a preflight.

This phase does not perform live database reads or writes.

This phase does not execute candidate decisions.

## Starting Checkpoint

Phase 22J was completed and pushed to `main`.

```text
Latest pushed commit: d5b2d10 Document Phase 22J candidate decision execution preflight review gate
Expected repo status before Phase 22K docs step: ## main...origin/main
```

## Purpose

The purpose of Phase 22K is to define the implementation plan for a future non-mutating candidate decision execution preflight.

Phase 22I designed the preflight requirements.

Phase 22J reviewed the preflight design and confirmed the fail-closed boundary.

Phase 22K converts that design into a future implementation plan without creating executable source code yet.

## Allowed Scope

Phase 22K may document:

- future preflight script/module location
- future preflight command shape
- future input contract
- future output contract
- future guard order
- future failure behavior
- future test strategy
- future review criteria
- future terminal workflow requirements
- future phase sequencing

## Forbidden Scope

Phase 22K must not include:

- source code changes
- executable script creation
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
- commit or push before Gemini review and explicit James approval

## Implementation Plan Boundary

The future preflight implementation should be read-only and non-mutating.

The future implementation must not be combined with candidate decision execution.

The future implementation must produce a clear terminal decision marker, but that marker must not authorize mutation.

Allowed future final markers:

```text
PREFLIGHT_PASS_NON_MUTATING
PREFLIGHT_FAIL_LOCKED
```

The future preflight implementation must not print markers that imply live execution approval.

Disallowed future markers:

```text
EXECUTION_APPROVED
MUTATION_READY
RUN_DECISION
APPROVE_FOR_DRAFT_READY
PUBLIC_PUBLISH_READY
CLEANUP_READY
```

## Proposed Future File Location

Recommended future executable preflight script location:

```text
testing/discovery-candidate-decision-execution-preflight.mjs
```

Reasoning:

- existing smoke/preflight harnesses live under `testing/`
- the script should remain operational tooling, not application runtime code
- keeping it outside API/UI paths reduces accidental production exposure
- `.mjs` is consistent with prior terminal smoke harnesses

This location is only a plan in Phase 22K.

No file is created in this phase.

## Proposed Future Command

Recommended future command shape:

```bash
AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT=1 \
AIFINDER_CANDIDATE_DECISION_PREFLIGHT_PHASE=22L \
AIFINDER_CANDIDATE_DECISION_ID="<candidate_id>" \
AIFINDER_CANDIDATE_DECISION_ACTION="<action_name>" \
AIFINDER_CANDIDATE_DECISION_EXPECTED_CURRENT_STATUS="<status>" \
AIFINDER_CANDIDATE_DECISION_EXPECTED_NEXT_STATUS="<status>" \
AIFINDER_CANDIDATE_DECISION_APPROVAL_PHRASE="<exact approval phrase>" \
node testing/discovery-candidate-decision-execution-preflight.mjs
```

The future script should refuse to run unless the opt-in environment variable is exactly set.

Recommended opt-in variable:

```text
AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT=1
```

## Proposed Future Input Contract

A future implementation should require the following inputs:

| Input | Required | Purpose |
|---|---:|---|
| `AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT` | Yes | Explicit opt-in guard |
| `AIFINDER_CANDIDATE_DECISION_PREFLIGHT_PHASE` | Yes | Expected phase identifier |
| `AIFINDER_CANDIDATE_DECISION_ID` | Yes | Exact candidate target |
| `AIFINDER_CANDIDATE_DECISION_ACTION` | Yes | Exact intended action |
| `AIFINDER_CANDIDATE_DECISION_EXPECTED_CURRENT_STATUS` | Yes | Expected pre-action status |
| `AIFINDER_CANDIDATE_DECISION_EXPECTED_NEXT_STATUS` | Yes | Expected post-action status |
| `AIFINDER_CANDIDATE_DECISION_APPROVAL_PHRASE` | Yes | Exact James approval phrase |
| `AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED` | Yes | Must be explicit, default false |
| `AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED` | Yes | Must be explicit, default false |
| `AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED` | Yes | Must be explicit, default false |
| `AIFINDER_CANDIDATE_DECISION_EXPECTED_AUDIT_EVENT` | Yes | Required audit expectation |

No input should default into mutation readiness.

## Proposed Approval Phrase Check

The future preflight should build the expected approval phrase from the supplied phase, candidate id, and action.

Recommended exact format:

```text
Approve Phase <phase> live candidate decision execution for candidate <candidate_id> with action <action_name>
```

The future preflight should compare this exact expected phrase against `AIFINDER_CANDIDATE_DECISION_APPROVAL_PHRASE`.

If it does not match exactly, the preflight must print:

```text
PREFLIGHT_FAIL_LOCKED
```

The future preflight must reject generic approvals, including:

```text
Proceed
Approved
Continue
Run it
Do the decision
Gemini approved
Commit it
Push it
```

## Proposed Future Guard Order

The future preflight implementation should run guards in this order:

1. Print boundary.
2. Verify opt-in environment variable.
3. Verify no mutation mode.
4. Verify repo path.
5. Verify clean working tree.
6. Verify branch alignment with `origin/main`.
7. Verify expected latest commit.
8. Verify required inputs are present.
9. Verify candidate id format.
10. Verify intended action is phase-approved.
11. Verify expected current status is present.
12. Verify expected next status is present.
13. Verify public publishing lock.
14. Verify `approve_for_draft` lock.
15. Verify cleanup lock.
16. Verify audit expectation is present.
17. Verify approval phrase exact match.
18. Print final non-mutating decision marker.

The future implementation must fail closed at the first unsafe condition.

## Proposed Future Terminal Output Sections

The future preflight should print these sections:

```text
=== Boundary ===
=== Opt-In Guard ===
=== Repo State ===
=== Expected Commit Check ===
=== Input Contract ===
=== Candidate Target ===
=== Intended Action ===
=== Status Transition Expectation ===
=== Public Publishing Lock ===
=== approve_for_draft Lock ===
=== Cleanup Lock ===
=== Audit Expectation ===
=== Approval Phrase Verification ===
=== Final Preflight Decision ===
```

## Proposed Future Failure Behavior

The future implementation must fail closed if:

- opt-in variable is missing
- repo state is dirty
- branch is not aligned with `origin/main`
- latest commit is unexpected
- candidate id is missing
- candidate id format is invalid
- intended action is missing
- intended action is not phase-approved
- current status expectation is missing
- next status expectation is missing
- public publishing scope is ambiguous
- `approve_for_draft` scope is ambiguous
- cleanup scope is ambiguous
- audit event expectation is missing
- approval phrase is missing
- approval phrase does not exactly match
- any command exits non-zero

Failure must not trigger:

- alternate action
- fallback candidate selection
- automatic cleanup
- automatic retry
- live mutation
- public publishing
- `approve_for_draft`
- continued execution

## Proposed Future Non-Mutating Data Policy

The first executable preflight implementation should avoid live database reads unless a later phase explicitly approves read-only candidate inspection.

Initial future implementation can validate only:

- repo state
- env input contract
- approval phrase format
- lock states
- final marker behavior

A later phase may separately approve read-only candidate lookup if needed.

That later read-only phase must still prohibit mutation.

## Proposed Future Test Strategy

A future implementation should include tests or terminal checks for:

1. Missing opt-in fails locked.
2. Missing candidate id fails locked.
3. Invalid candidate id fails locked.
4. Missing intended action fails locked.
5. Generic approval phrase fails locked.
6. Mismatched approval phrase fails locked.
7. Public publishing ambiguity fails locked.
8. `approve_for_draft` ambiguity fails locked.
9. Cleanup ambiguity fails locked.
10. Valid non-mutating input produces `PREFLIGHT_PASS_NON_MUTATING`.
11. No mutation-capable marker appears.
12. Script exits with the correct status code.
13. Raw output is captured with `tee`.
14. Raw output is copied to clipboard with `pbcopy`.

## Proposed Future Review Criteria

Before implementing the future preflight script, Gemini should review:

1. Script location.
2. Input contract.
3. Guard order.
4. Failure behavior.
5. Final marker wording.
6. Approval phrase check.
7. Explicit lock behavior.
8. No live database read by default.
9. No mutation path.
10. Test strategy.

## Future Commit Boundary

A future implementation commit should include only the approved preflight script and any approved tests/docs.

A future implementation commit must not include:

- API route changes
- UI changes
- Supabase changes
- candidate decision execution code
- public publishing code
- cleanup mutation code
- scheduler or automation code

## Recommended Future Phase Sequence

Recommended next phase after Phase 22K:

```text
Phase 22L — Candidate Decision Execution Preflight Implementation Review Gate
```

Recommended boundary for Phase 22L:

```text
Review-only or docs-only.
No executable implementation unless explicitly approved.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
```

If Phase 22L approves implementation, the future implementation phase could be:

```text
Phase 22M — Candidate Decision Execution Preflight Script Implementation
```

Recommended boundary for Phase 22M:

```text
Implement non-mutating preflight script only.
No live DB reads unless separately approved.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
```

## Gemini Review Requirement

Phase 22K should be reviewed by Gemini before commit.

The Gemini review should confirm:

1. Phase 22K is documentation-only.
2. It does not implement executable preflight code.
3. It does not authorize live reads or mutations.
4. Candidate decision execution remains locked.
5. Public publishing remains locked.
6. `approve_for_draft` remains locked.
7. Cleanup mutation remains locked.
8. Future implementation plan remains fail-closed.
9. It is safe to commit this documentation gate.

## Workflow Note

AiFinder terminal workflow should continue in no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must save output with `tee`, copy raw terminal output with `pbcopy`, and preserve original command status.

## Phase 22K Conclusion

Phase 22K defines a future implementation plan for a non-mutating candidate decision execution preflight.

It does not create executable preflight code.

It does not run preflight logic.

It does not unlock candidate decision execution.

It does not unlock public publishing.

It does not unlock `approve_for_draft`.

It does not unlock cleanup mutation.

The Discovery Engine remains fail-closed before any future implementation or mutation-capable candidate decision phase.
