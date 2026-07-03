# AiFinder Discovery Engine — Phase 22L Candidate Decision Execution Preflight Implementation Review Gate

## Phase Status

Phase 22L is a documentation-only implementation review gate.

This phase reviews the Phase 22K candidate decision execution preflight implementation plan.

This phase does not create executable preflight code.

This phase does not run a preflight.

This phase does not perform live database reads or writes.

This phase does not execute candidate decisions.

## Starting Checkpoint

Phase 22K was completed and pushed to `main`.

```text
Latest pushed commit: 1824cc2 Document Phase 22K candidate decision preflight implementation plan
Expected repo status before Phase 22L docs step: ## main...origin/main
```

## Purpose

The purpose of Phase 22L is to review the Phase 22K implementation plan before any future executable preflight script is created.

Phase 22I defined the future candidate decision execution preflight design.

Phase 22J reviewed the design and preserved the fail-closed boundary.

Phase 22K converted the design into an implementation plan.

Phase 22L confirms whether that implementation plan is safe enough to proceed to a later non-mutating script implementation phase.

## Allowed Scope

Phase 22L may document:

- review of the Phase 22K implementation plan
- confirmation that future implementation remains non-mutating
- confirmation that candidate decision execution remains locked
- confirmation that live database reads remain locked by default
- confirmation that public publishing remains locked
- confirmation that `approve_for_draft` remains locked
- confirmation that cleanup mutation remains locked
- future implementation acceptance criteria
- future implementation rejection criteria
- Gemini review requirements
- future phase sequencing

## Forbidden Scope

Phase 22L must not include:

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

## Review Summary

Phase 22K proposed a future non-mutating preflight script at:

```text
testing/discovery-candidate-decision-execution-preflight.mjs
```

Phase 22L confirms that this proposed location is directionally safe because:

- it keeps operational tooling under `testing/`
- it avoids API and UI runtime paths
- it reduces accidental production exposure
- it matches prior smoke/preflight harness conventions
- it can remain explicitly opt-in

No file is created at that location during Phase 22L.

## Candidate Decision Execution Remains Locked

Candidate decision execution remains locked after Phase 22L.

This phase is not approval to execute a candidate decision.

This phase is not approval to create mutation-capable behavior.

This phase is not approval to publish a tool.

This phase is not approval to run `approve_for_draft`.

This phase is not approval to perform cleanup mutation.

A future implementation phase must separately define and receive approval for any executable preflight script.

A future live execution phase must separately define and receive approval for any mutation-capable action.

## Future Implementation Review Criteria

A future non-mutating preflight implementation should be accepted only if it satisfies all of the following:

1. It is explicitly opt-in.
2. It is non-mutating.
3. It performs no live database reads unless separately approved.
4. It performs no database writes.
5. It does not execute candidate decisions.
6. It does not call `approve_for_draft`.
7. It does not publish public-facing tools.
8. It does not perform cleanup mutation.
9. It requires an exact candidate id.
10. It requires an exact intended action.
11. It requires expected current and next statuses.
12. It requires explicit lock values for public publishing, `approve_for_draft`, and cleanup.
13. It requires an expected audit event.
14. It validates the exact James approval phrase.
15. It rejects generic approval phrases.
16. It prints a final non-mutating decision marker.
17. It exits non-zero on locked/failure states.
18. It produces output suitable for `tee` and `pbcopy`.

## Future Implementation Rejection Criteria

A future preflight implementation should be rejected if it:

- infers a candidate id
- selects the newest row automatically
- selects the first visible row automatically
- treats Gemini approval as live mutation approval
- treats “proceed” or “approved” as live mutation approval
- includes mutation-capable code
- includes public publishing behavior
- includes `approve_for_draft` behavior
- includes cleanup mutation behavior
- performs live database reads without a separate read-only approval gate
- prints a marker that implies execution approval
- continues after a failed guard
- uses heredoc-based workflow by default

## Future Command Review

Phase 22K proposed the following future command shape:

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

Phase 22L notes that a future command should include all required lock-state variables from the Phase 22K input contract.

A future implementation phase should not omit:

```text
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED
AIFINDER_CANDIDATE_DECISION_EXPECTED_AUDIT_EVENT
```

The future command must remain explicit and non-interactive.

## Future Opt-In Guard Review

The future opt-in variable remains appropriate:

```text
AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT=1
```

The future script must refuse to run without that exact value.

Missing opt-in should produce:

```text
PREFLIGHT_FAIL_LOCKED
```

The script must not prompt interactively for missing values.

## Future Final Marker Review

Allowed future final markers remain:

```text
PREFLIGHT_PASS_NON_MUTATING
PREFLIGHT_FAIL_LOCKED
```

Disallowed future markers remain:

```text
EXECUTION_APPROVED
MUTATION_READY
RUN_DECISION
APPROVE_FOR_DRAFT_READY
PUBLIC_PUBLISH_READY
CLEANUP_READY
```

A future non-mutating preflight may indicate that inputs are internally consistent, but it must not imply authorization to mutate.

## Approval Phrase Review

The future approval phrase requirement remains:

```text
Approve Phase <phase> live candidate decision execution for candidate <candidate_id> with action <action_name>
```

A future preflight implementation may verify the phrase string, but that verification alone must not execute mutation.

The following remain insufficient:

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

## Live Database Read Lock

Live database reads remain locked by default.

A future first implementation should validate only:

- repository state
- expected commit
- environment input contract
- candidate id format
- approval phrase format
- lock-state values
- final non-mutating marker behavior

A later phase may separately approve read-only candidate lookup if needed.

That later phase must remain non-mutating unless explicitly changed and approved.

## Public Publishing Lock

Public publishing remains locked.

Default state:

```text
Public publishing: locked
```

Any future phase involving public publishing must be separately documented, reviewed, and explicitly approved.

## approve_for_draft Lock

`approve_for_draft` remains locked.

Default state:

```text
approve_for_draft: locked
```

Any future phase involving `approve_for_draft` must be separately documented, reviewed, and explicitly approved.

## Cleanup Mutation Lock

Cleanup mutation remains locked.

Default state:

```text
Cleanup mutation: locked
```

Any future cleanup behavior must be separately documented, reviewed, and explicitly approved.

## Future Implementation Acceptance Checklist

Before a future Phase 22M implementation can be committed, it should pass:

```text
- git status guard
- expected commit guard
- created file list guard
- no API/UI/Supabase file changes
- no live DB read guard
- no mutation code review
- no approve_for_draft code path
- no public publishing code path
- no cleanup mutation code path
- opt-in missing failure check
- generic approval phrase failure check
- exact approval phrase non-mutating pass check
- final marker check
- npm run check, if source/test code is introduced
```

## Recommended Future Phase Sequence

Recommended next phase after Phase 22L:

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

After Phase 22M, recommended follow-up:

```text
Phase 22N — Candidate Decision Execution Preflight Script Review
```

Phase 22N should verify implementation behavior before any future candidate-specific live execution planning.

## Gemini Review Requirement

Phase 22L should be reviewed by Gemini before commit.

The Gemini review should confirm:

1. Phase 22L is documentation-only.
2. It does not create executable preflight code.
3. It does not run a preflight.
4. It does not authorize live DB reads.
5. It does not authorize live DB mutations.
6. Candidate decision execution remains locked.
7. Public publishing remains locked.
8. `approve_for_draft` remains locked.
9. Cleanup mutation remains locked.
10. Future implementation acceptance/rejection criteria are safe.
11. It is safe to commit this documentation gate.

## Workflow Note

AiFinder terminal workflow should continue in no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must save output with `tee`, copy raw terminal output with `pbcopy`, and preserve original command status.

## Phase 22L Conclusion

Phase 22L reviews the future implementation plan for the candidate decision execution preflight.

It does not create executable code.

It does not run a preflight.

It does not unlock live database reads.

It does not unlock candidate decision execution.

It does not unlock public publishing.

It does not unlock `approve_for_draft`.

It does not unlock cleanup mutation.

The Discovery Engine remains fail-closed before any future executable preflight implementation or mutation-capable candidate decision phase.
