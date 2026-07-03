# Phase 22AN-A — Discovery Engine Post-Aggregate Roadmap Selection Gate

## Phase Type

Documentation-only roadmap selection gate.

## Purpose

Phase 22AN-A opens the post-aggregate sequence after the successful closure of
the Phase 22AM aggregate queue verification sequence.

This phase selects the next safe Discovery Engine direction.

This phase does not perform live database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute `approve_for_draft`.

This phase does not publish public tools.

This phase does not write discovered tools.

This phase does not perform cleanup mutation.

This phase does not reset or reopen candidates.

This phase does not acquire evidence.

This phase does not inspect candidate identifiers.

This phase does not change source, API, UI, schema, type generation, packages, or
lockfiles.

Phase 22AN-A is planning only.

## Baseline

Latest pushed baseline before this phase:

```text
0d302e5 Document aggregate verification closure
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source documents:

```text
docs/discovery-phase-22am-v-candidate-queue-aggregate-verification-closure-documentation.md
docs/discovery-phase-22am-u-candidate-queue-aggregate-bucket-breakdown-result-interpretation-closure-planning-gate.md
docs/discovery-phase-22am-t-candidate-queue-aggregate-bucket-breakdown-patched-execution-result.md
```

## Closed Prior Sequence

The prior aggregate verification sequence is closed.

```text
Phase 22AM aggregate queue verification sequence: CLOSED SUCCESSFULLY
Terminal verified result: READ_ONLY_AGGREGATE_BUCKET_BREAKDOWN_COMPLETE
Terminal execution phase: Phase 22AM-S
Terminal result documentation phase: Phase 22AM-T
Terminal interpretation phase: Phase 22AM-U
Final closure phase: Phase 22AM-V
```

Phase 22AN-A does not reopen the Phase 22AM sequence.

Phase 22AN-A does not recommend rerunning the aggregate bucket breakdown.

## Terminal Aggregate Facts

The terminal aggregate facts from Phase 22AM-S / Phase 22AM-T are:

```text
total_candidate_count=3
status_bucket_staged_candidate_count=0
status_bucket_needs_more_evidence_candidate_count=2
status_bucket_rejected_candidate_count=0
status_bucket_approved_for_draft_candidate_count=0
status_bucket_other_candidate_count=1
cleanup_bucket_active_candidate_count=2
cleanup_bucket_cleanup_candidate_count=0
cleanup_bucket_other_candidate_count=1
active_non_cleanup_candidate_count=2
active_staged_candidate_count=0
staged_candidate_count=0
decision_ready_candidate_count=0
any_decision_action_set_candidate_count=2
decision_action_needs_more_evidence_candidate_count=2
decision_action_reject_candidate_count=0
decision_action_approve_for_draft_candidate_count=0
decision_action_other_candidate_count=0
needs_more_evidence_any_status_candidate_count=2
needs_more_evidence_active_any_status_candidate_count=1
needs_more_evidence_staged_any_cleanup_candidate_count=0
needs_more_evidence_active_staged_candidate_count=0
public_tools_count_query_before=10
public_tools_count_query_after=10
discovered_tools_count_query_before=0
discovered_tools_count_query_after=0
before_after_count_integrity=true
```

## Current Operational Interpretation

The current post-aggregate interpretation is:

- there is no active staged candidate queue ready for decision execution,
- there is no decision-ready aggregate queue,
- there is no approve-for-draft pending action,
- the queue is primarily needs-more-evidence oriented,
- one candidate row was in an informational other bucket,
- public tools and discovered tools counts were unchanged,
- the prior aggregate verification path closed successfully.

The current operational locks remain:

- candidate decision execution should remain blocked,
- `approve_for_draft` should remain blocked,
- public publishing should remain blocked,
- discovered tools writes should remain blocked,
- cleanup mutation should remain blocked,
- reset/reopen mutation should remain blocked,
- evidence acquisition should remain blocked,
- identifier-level inspection should remain blocked,
- live database reads should remain blocked unless a future phase explicitly
  approves a bounded read-only gate.

## Roadmap Options Considered

Phase 22AN-A compares four candidate next directions.

### Option 1 — Needs-More-Evidence Workflow Design

Description:

Plan how Discovery Engine should handle candidates that require more evidence.

Why it is relevant:

```text
status_bucket_needs_more_evidence_candidate_count=2
decision_action_needs_more_evidence_candidate_count=2
needs_more_evidence_any_status_candidate_count=2
```

Advantages:

- directly addresses the dominant aggregate queue state,
- can remain docs-only at first,
- can define evidence requirements before any evidence acquisition,
- can define approval boundaries before any live read or mutation,
- can clarify when a candidate can return to staged or remain blocked,
- can preserve fail-closed behavior.

Risks if skipped:

- the queue may remain stuck in needs-more-evidence state,
- future candidate work may be tempted to jump straight into evidence acquisition,
- decision execution may be attempted without a clear evidence sufficiency standard.

Safety boundary:

Needs-more-evidence workflow design must not acquire evidence, read candidate
identifiers, mutate candidates, or execute decisions unless a later phase
explicitly authorizes those actions.

### Option 2 — Other Bucket Interpretation Planning

Description:

Plan whether and how to understand the informational other bucket from the
aggregate result.

Why it is relevant:

```text
status_bucket_other_candidate_count=1
cleanup_bucket_other_candidate_count=1
```

Advantages:

- may explain one nonstandard aggregate state,
- can help decide whether status normalization is needed later,
- can remain docs-only initially.

Risks if done too early:

- it may require additional read-only inspection planning,
- it could distract from the dominant needs-more-evidence path,
- it could tempt identifier-level investigation before the workflow policy is
  ready.

Safety boundary:

Other bucket interpretation must remain aggregate-only unless a separate
read-only phase explicitly approves bounded non-mutating inspection.

### Option 3 — Admin Queue UX Interpretation Planning

Description:

Plan what the admin queue UI should eventually communicate about staged,
needs-more-evidence, other, cleanup, and decision readiness states.

Advantages:

- improves operator clarity,
- can reduce accidental decision execution,
- can surface blocked states more clearly in the admin interface,
- can be designed before implementation.

Risks if done too early:

- UI planning may be premature before workflow semantics are finalized,
- it could lead to source/UI changes before policy boundaries are complete.

Safety boundary:

Admin queue UX planning must remain docs-only until a separate implementation
plan is reviewed and approved.

### Option 4 — Broader Stabilization / Handoff Summary

Description:

Create a broader Discovery Engine stabilization summary before selecting new
workflow work.

Advantages:

- gives a higher-level checkpoint,
- may help reset context after the long 22AM sequence,
- can summarize what is complete and what remains blocked.

Risks if done too early:

- it may delay resolving the needs-more-evidence queue state,
- it may duplicate the Phase 22AM-V closure document.

Safety boundary:

Stabilization summary must not authorize new live reads, mutations, evidence
acquisition, candidate decisions, or implementation changes.

## Selection Criteria

The next phase should:

1. address the most important aggregate signal,
2. remain documentation-only,
3. reduce future operational ambiguity,
4. preserve candidate decision blocking,
5. preserve public publishing blocking,
6. avoid live database reads,
7. avoid mutation,
8. avoid evidence acquisition,
9. avoid source/API/UI/schema/typegen changes,
10. create a clearer gate before any future read-only or mutating work.

## Roadmap Decision

The selected next direction is:

```text
Option 1 — Needs-More-Evidence Workflow Design
```

Reasoning:

The terminal aggregate result shows that the queue is primarily
needs-more-evidence oriented and not decision-ready.

```text
status_bucket_needs_more_evidence_candidate_count=2
decision_action_needs_more_evidence_candidate_count=2
active_staged_candidate_count=0
decision_ready_candidate_count=0
decision_action_approve_for_draft_candidate_count=0
```

The safest next step is to define the needs-more-evidence workflow before any
future evidence acquisition, candidate inspection, mutation, or decision
execution.

This keeps the Discovery Engine moving forward without crossing operational
boundaries.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AN-B — Needs-More-Evidence Workflow Design Gate
```

Recommended scope:

- docs-only,
- define what needs-more-evidence means operationally,
- define evidence sufficiency criteria,
- define blocked actions while evidence is insufficient,
- define possible future transitions from needs-more-evidence,
- define required approvals before evidence acquisition,
- define required approvals before any candidate read beyond aggregate level,
- define required approvals before any candidate mutation,
- define required approvals before candidate decision execution,
- preserve public publishing block,
- preserve discovered tools write block,
- no live database reads,
- no database mutation,
- no evidence acquisition,
- no candidate identifiers,
- no source/API/UI/schema/typegen/package changes,
- no package or lockfile changes.

## Deferred Directions

The following directions are deferred, not rejected:

```text
Phase 22AN-C — Other Bucket Interpretation Planning Gate
Phase 22AN-D — Admin Queue UX Interpretation Planning Gate
Phase 22AN-E — Discovery Engine Stabilization Handoff Gate
```

Deferred means:

- not selected as the immediate next phase,
- still valid for later planning,
- still blocked behind their own explicit gates,
- not authorized by Phase 22AN-A.

## Explicit Non-Authorization

Phase 22AN-A does not authorize:

- rerunning Phase 22AM-S,
- rerunning the aggregate bucket breakdown script,
- live database reads,
- database mutation,
- candidate decision execution,
- `approve_for_draft`,
- public tools writes,
- discovered tools writes,
- cleanup mutation,
- reset/reopen mutation,
- evidence acquisition,
- candidate identifier inspection,
- direct SQL,
- manual database operation,
- schema changes,
- type generation,
- source/API/UI implementation,
- package changes,
- lockfile changes.

## Final Roadmap Selection

Final selection:

```text
Phase 22AN-A roadmap decision: SELECT NEEDS-MORE-EVIDENCE WORKFLOW DESIGN
Next recommended phase: Phase 22AN-B — Needs-More-Evidence Workflow Design Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AN-A correctly starts after Phase 22AM-V closure,
2. the closed Phase 22AM terminal facts are preserved accurately,
3. the option comparison is fair and conservative,
4. the selected next direction follows logically from the aggregate result,
5. Phase 22AN-B is the right next docs-only gate,
6. the deferred directions remain safely blocked,
7. the document avoids authorizing reads, mutations, decisions, evidence work,
   publishing, or implementation changes,
8. this Phase 22AN-A docs-only roadmap selection gate is safe to commit after
   James approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AN-A documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AN-A State

Phase 22AN-A is complete when:

- this roadmap selection document is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- `npm run check` passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
