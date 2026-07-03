# Phase 22AN-D — Admin Queue UX Interpretation Planning Gate

## Phase Type

Documentation-only Admin Queue UX interpretation planning gate.

## Purpose

Phase 22AN-D defines how the Discovery Engine admin queue should communicate
candidate queue states to an operator before any UI implementation, live read,
mutation, evidence acquisition, decision execution, or public publishing.

This phase is not a UI implementation phase.

This phase does not change source code.

This phase does not change API routes.

This phase does not change admin UI components.

This phase does not perform live database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute approve-for-draft.

This phase does not publish public tools.

This phase does not write discovered tools.

This phase does not perform cleanup mutation.

This phase does not reset or reopen candidates.

This phase does not acquire evidence.

This phase does not inspect or print candidate identifiers.

This phase does not change schema, type generation, packages, or lockfiles.

Phase 22AN-D is planning only.

## Baseline

Latest pushed baseline before this phase:

```text
ee487de Document other bucket interpretation planning
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source documents:

```text
docs/discovery-phase-22an-c-other-bucket-interpretation-planning-gate.md
docs/discovery-phase-22an-b-needs-more-evidence-workflow-design-gate.md
docs/discovery-phase-22an-a-discovery-engine-post-aggregate-roadmap-selection-gate.md
docs/discovery-phase-22am-t-candidate-queue-aggregate-bucket-breakdown-patched-execution-result.md
```

## Prior Planning Context

Phase 22AN-B established:

```text
NEEDS_MORE_EVIDENCE_IS_A_BLOCKED_EVIDENCE_INSUFFICIENT_STATE
```

Phase 22AN-C established:

```text
OTHER_BUCKET_IS_INFORMATIONAL_AND_NOT_DECISION_READY
FUTURE_BOUNDED_READ_ONLY_OTHER_BUCKET_INSPECTION_IS_USEFUL_BUT_NOT_YET_AUTHORIZED
```

Phase 22AN-D now defines how those planning conclusions should later be
communicated in the admin queue UX.

## Terminal Aggregate Facts Relevant To This Phase

The terminal aggregate result included:

```text
total_candidate_count=3
status_bucket_staged_candidate_count=0
status_bucket_needs_more_evidence_candidate_count=2
status_bucket_other_candidate_count=1
active_staged_candidate_count=0
decision_ready_candidate_count=0
decision_action_needs_more_evidence_candidate_count=2
decision_action_approve_for_draft_candidate_count=0
cleanup_bucket_active_candidate_count=2
cleanup_bucket_other_candidate_count=1
before_after_count_integrity=true
```

The admin queue UX should be planned around these facts without assuming
row-level candidate details.

This phase does not inspect candidate rows.

This phase does not print identifiers.

## Core UX Planning Decision

Final Phase 22AN-D UX planning decision:

```text
QUEUE_UX_STATES_ARE_INTERPRETIVE_NOT_OPERATIONAL_AUTHORIZATION
STATUS_PRESENTATION_MUST_FAIL_CLOSED
```

The admin queue UX may describe queue states, but it must not imply that a state
authorizes an action.

A label is not an approval.

A badge is not a transition.

A warning is not a mutation.

A disabled action is not a decision.

A count is not candidate-specific evidence.

## UX State Model

The future admin queue should distinguish at least the following concepts.

### Staged

Suggested label:

```text
Staged
```

Suggested meaning:

```text
Candidate is in the normal staged review lane, but still requires explicit
review before any decision action.
```

Important UX rule:

Staged does not mean automatically decision-ready.

If future logic determines that a staged candidate is decision-ready, the UI
should still require explicit operator action behind the approved decision gate.

### Needs More Evidence

Suggested label:

```text
Needs more evidence
```

Suggested meaning:

```text
Candidate is blocked because available evidence is insufficient for a final
decision.
```

Suggested UX treatment:

- show a blocked or paused state,
- explain that more evidence is required,
- disable approve-for-draft,
- disable reject unless a future rejection gate says otherwise,
- disable public publishing,
- avoid implying that evidence acquisition is already authorized.

### Other / Unclassified

Suggested label:

```text
Unclassified
```

Alternative label:

```text
Other bucket
```

Preferred operator-facing label:

```text
Unclassified
```

Suggested meaning:

```text
Candidate does not currently fit the tracked queue buckets used by the aggregate
diagnostic.
```

Suggested UX treatment:

- show as unresolved,
- do not merge automatically into needs-more-evidence,
- do not merge automatically into staged,
- do not show decision-ready actions,
- indicate that bounded read-only inspection is planned separately,
- avoid implying the row is invalid or safe to clean up.

### Cleanup State

Suggested label:

```text
Cleanup state
```

Suggested meaning:

```text
Cleanup-related classification is informational until a future cleanup mutation
gate explicitly authorizes action.
```

Suggested UX treatment:

- show cleanup as metadata or warning only,
- do not expose cleanup mutation controls by default,
- do not show reset or reopen controls by default,
- require future explicit cleanup gate before any destructive action.

### Decision-Ready

Suggested label:

```text
Decision-ready
```

Suggested meaning:

```text
Candidate has met separately approved decision-readiness criteria.
```

Important constraint:

The terminal aggregate result showed:

```text
decision_ready_candidate_count=0
```

Therefore this phase does not define any current candidate as decision-ready.

A future UI should only show decision-ready actions when a future approved gate
defines and verifies eligibility.

### Approve For Draft

Suggested label for action:

```text
Approve for draft
```

Important constraint:

The terminal aggregate result showed:

```text
decision_action_approve_for_draft_candidate_count=0
```

Therefore this action should not be presented as available for the current
aggregate state.

The action must remain disabled unless a future decision execution gate approves
it.

## Suggested Disabled Action Matrix

Future admin queue UX should fail closed.

```text
Queue state              Approve for draft   Reject   Publish   Cleanup   Reset/Reopen
Staged                   Disabled by default  Disabled Disabled  Disabled  Disabled
Needs more evidence      Disabled            Disabled Disabled  Disabled  Disabled
Unclassified             Disabled            Disabled Disabled  Disabled  Disabled
Cleanup informational    Disabled            Disabled Disabled  Disabled  Disabled
Decision-ready           Gate-dependent      Gate-dependent Disabled Disabled Disabled
```

Important notes:

- publish remains disabled even when a candidate is decision-ready,
- cleanup remains disabled unless a future cleanup gate authorizes it,
- reset/reopen remains disabled unless a future reset/reopen gate authorizes it,
- reject remains disabled unless a future decision gate authorizes it,
- approve-for-draft remains disabled unless a future decision gate authorizes it.

## Suggested Admin Warning Language

Potential warning for needs-more-evidence:

```text
This candidate is blocked because more evidence is required before a decision can
be made.
```

Potential warning for unclassified / other:

```text
This candidate is not classified by the current queue buckets. A bounded
read-only inspection must be approved before row-level interpretation.
```

Potential warning for cleanup-related state:

```text
Cleanup information is visible for planning only. No cleanup action is authorized
from this view.
```

Potential warning for decision actions:

```text
Decision actions require a separate approved decision execution gate.
```

Potential warning for public publishing:

```text
Publishing is not available from candidate queue review.
```

This phase does not add these warnings to the UI.

## UX Anti-Patterns To Avoid

A future UI implementation should avoid:

- showing approve-for-draft for needs-more-evidence candidates,
- showing publish controls inside candidate queue review,
- showing cleanup mutation controls by default,
- presenting unclassified rows as errors requiring immediate cleanup,
- presenting unclassified rows as needs-more-evidence without a transition gate,
- presenting aggregate counts as row-level facts,
- displaying identifiers unless explicitly approved,
- encouraging direct SQL or manual database operations,
- allowing action buttons to appear before gates exist,
- hiding blocked-state explanations from operators.

## Future UI Data Boundary

A future implementation must not assume it can read more data than currently
approved.

Before any UI implementation, a separate implementation plan must define:

- exact API route or data source,
- exact fields returned,
- whether identifiers are exposed,
- redaction rules,
- loading and empty states,
- disabled-state rules,
- action availability rules,
- audit expectations,
- test coverage,
- responsive QA coverage.

Phase 22AN-D does not authorize that implementation plan.

## Relationship To Other Bucket Inspection

Phase 22AN-C deferred:

```text
Phase 22AN-E — Other Bucket Bounded Read-Only Inspection Planning Gate
```

Phase 22AN-D agrees that the unclassified / other bucket should eventually be
understood through a bounded read-only planning gate.

However, Phase 22AN-D does not require row-level inspection before planning UX
labels and disabled-state semantics.

The future admin UX should be able to represent unclassified state safely even
before row-level details are known.

## Relationship To Needs-More-Evidence Workflow

Phase 22AN-B established needs-more-evidence as blocked.

The future admin queue UX should make this obvious to operators.

Suggested future UX semantics:

```text
needs_more_evidence = blocked
blocked = no decision actions
no decision actions = no approve_for_draft, no reject, no publish
```

This is interpretation only.

No UI code is changed by this phase.

## Future Implementation Gate Requirements

Before any admin queue UX implementation, create a separate implementation
planning gate.

That future gate should define:

- exact component or page scope,
- exact copy and labels,
- exact disabled action behavior,
- exact data source,
- exact authorization assumptions,
- exact responsive QA requirements,
- Desktop result expectations,
- Tablet/iPad result expectations,
- Mobile result expectations,
- accessibility expectations,
- no mutation unless separately approved,
- no decision execution unless separately approved.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AN-E — Other Bucket Bounded Read-Only Inspection Planning Gate
```

Recommended scope:

- docs-only,
- plan whether and how to inspect the other / unclassified bucket safely,
- define exact read-only boundaries,
- define aggregate-only-first strategy,
- define whether identifiers remain redacted,
- define output safety scan,
- define live-read approval phrase,
- keep live reads blocked until a later explicit approval,
- keep mutations blocked,
- keep decision execution blocked,
- keep evidence acquisition blocked,
- keep public publishing blocked,
- no source/API/UI implementation,
- no schema/typegen/package changes.

## Deferred Admin UI Implementation

Deferred future phase:

```text
Admin Queue UX Implementation Plan
```

Deferred means:

- not authorized by Phase 22AN-D,
- not executable from this document,
- must be planned separately,
- must be reviewed before implementation,
- must keep action execution separately gated.

## Explicit Non-Authorization

Phase 22AN-D does not authorize:

- live database reads,
- database mutation,
- candidate identifier inspection,
- evidence acquisition,
- candidate decision execution,
- approve-for-draft,
- public tools writes,
- discovered tools writes,
- cleanup mutation,
- reset/reopen mutation,
- status mutation,
- direct SQL,
- manual database operation,
- source implementation,
- API implementation,
- UI implementation,
- schema changes,
- type generation,
- package changes,
- lockfile changes.

## Final Admin Queue UX Planning Decision

Final Phase 22AN-D decision:

```text
QUEUE_UX_STATES_ARE_INTERPRETIVE_NOT_OPERATIONAL_AUTHORIZATION
STATUS_PRESENTATION_MUST_FAIL_CLOSED
```

Final next-phase recommendation:

```text
Phase 22AN-E — Other Bucket Bounded Read-Only Inspection Planning Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AN-D correctly follows Phase 22AN-C,
2. the admin queue UX state model is conservative and operator-safe,
3. labels for staged, needs-more-evidence, unclassified / other, cleanup, and
   decision-ready states are clear enough for future implementation planning,
4. disabled action behavior preserves fail-closed safety,
5. the document avoids authorizing UI/source/API implementation,
6. the document avoids authorizing reads, mutations, decisions, evidence
   acquisition, cleanup, or publishing,
7. Phase 22AN-E is an appropriate next docs-only planning gate,
8. this Phase 22AN-D docs-only UX interpretation planning gate is safe to commit
   after James approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AN-D documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AN-D State

Phase 22AN-D is complete when:

- this Admin Queue UX interpretation planning document is reviewed and approved
  by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
