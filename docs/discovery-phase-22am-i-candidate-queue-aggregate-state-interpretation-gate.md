# Phase 22AM-I — Candidate Queue Aggregate State Interpretation Gate

## Phase Type

Documentation-only interpretation gate.

## Purpose

Phase 22AM-I interprets the actual aggregate candidate queue state observed after
Phase 22AM-D executed exactly one `needs_more_evidence` candidate decision and
after Phase 22AM-G performed a read-only post-decision queue-state verification.

This phase does not execute candidate decisions, does not mutate database state,
does not perform cleanup, does not reset or reopen candidates, does not acquire
evidence, does not approve candidates, and does not publish tools.

## Current Repository Baseline

Latest pushed phase before this interpretation gate:

- Phase 22AM-H — Read-Only Post-needs_more_evidence Queue State Verification
  Result Documentation
- Latest pushed commit: `5b35724`
- Commit subject: `Document post needs_more_evidence queue verification result`
- Final pushed status: `## main...origin/main`

## Inputs Interpreted

Phase 22AM-I interprets the following already-documented Phase 22AM-G aggregate
diagnostic results:

```text
total_candidate_count=3
staged_candidate_count=0
active_cleanup_candidate_count=2
active_staged_candidate_count=0
decision_ready_candidate_count=0
any_decision_action_set_candidate_count=2
needs_more_evidence_any_status_candidate_count=2
needs_more_evidence_staged_any_cleanup_candidate_count=0
needs_more_evidence_active_any_status_candidate_count=1
needs_more_evidence_active_staged_candidate_count=0
public_tools_count_query_before=10
public_tools_count_query_after=10
discovered_tools_count_query_before=0
discovered_tools_count_query_after=0
```

Phase 22AM-G classification:

```text
READ-ONLY DIAGNOSTIC COMPLETE — ORIGINAL EXPECTED BUCKET DID NOT PASS
```

## Interpretation Summary

The original post-decision verification expectation was too narrow for the
actual queue lifecycle state.

The expected post-decision bucket assumed that a `needs_more_evidence` candidate
would remain both:

1. `staged`, and
2. active / non-cleanup.

The aggregate diagnostic showed that this assumption did not hold:

- `needs_more_evidence_active_staged_candidate_count=0`
- `needs_more_evidence_staged_any_cleanup_candidate_count=0`
- `needs_more_evidence_active_any_status_candidate_count=1`
- `needs_more_evidence_any_status_candidate_count=2`

This means the `needs_more_evidence` action was visible in aggregate state, but
not in the originally expected active staged bucket.

## Candidate Decision Smoke Objective Assessment

The candidate decision pipeline smoke objective for the `needs_more_evidence`
action is considered materially satisfied at the aggregate level, subject to the
boundary that no restricted identifiers were printed.

Reasoning:

- Phase 22AM-D executed exactly one candidate decision mutation.
- The action was `needs_more_evidence`.
- No `approve_for_draft` action was executed.
- No public `tools` write occurred.
- No `discovered_tools` write occurred.
- Phase 22AM-G showed `public_tools_count_query_before=10` and
  `public_tools_count_query_after=10`.
- Phase 22AM-G showed `discovered_tools_count_query_before=0` and
  `discovered_tools_count_query_after=0`.
- Phase 22AM-G showed `needs_more_evidence_any_status_candidate_count=2`.
- Phase 22AM-G showed `needs_more_evidence_active_any_status_candidate_count=1`.
- The queue no longer contained an active staged candidate matching the original
  expected post-decision bucket.

The smoke objective should therefore be treated as complete for the
`needs_more_evidence` decision path at the aggregate/non-identifying level, while
recognizing that the original verification predicate should be revised for
future post-decision checks.

## Updated Post-Decision Verification Criteria Recommendation

Future read-only post-decision verification should not require the candidate to
remain simultaneously `staged` and active unless the lifecycle contract
explicitly guarantees that condition.

Recommended future aggregate predicates for `needs_more_evidence` verification:

1. Public publishing counts remain unchanged.
2. `discovered_tools` counts remain unchanged.
3. `approve_for_draft` remains absent from the executed action path.
4. At least one candidate is visible in a non-identifying aggregate
   `needs_more_evidence` bucket.
5. If cleanup lifecycle is active, verification should separately report:
   - status bucket,
   - cleanup bucket,
   - active/non-cleanup bucket,
   - decision action bucket.
6. Verification must remain non-identifying unless a future phase explicitly
   approves safe internal-only identifier handling.

## Cleanup Lifecycle Interpretation

The aggregate state suggests that cleanup lifecycle behavior or prior queue
transitions likely moved at least some candidates out of the original active
staged verification bucket.

The diagnostic supports this interpretation because:

- `staged_candidate_count=0`
- `active_cleanup_candidate_count=2`
- `active_staged_candidate_count=0`
- `any_decision_action_set_candidate_count=2`
- `needs_more_evidence_staged_any_cleanup_candidate_count=0`
- `needs_more_evidence_active_any_status_candidate_count=1`

This phase does not prove the exact cleanup transition path and does not inspect
restricted candidate-level identifiers. It only records that the aggregate queue
state is incompatible with the original staged + active expectation and that a
future read-only status/cleanup bucket breakdown may be useful.

## Future Read-Only Breakdown Recommendation

A future phase may add or run a read-only aggregate bucket breakdown, but only
under a separately approved phase.

Recommended future breakdown scope:

- status counts,
- cleanup-state counts,
- decision-action counts,
- active/non-cleanup counts,
- staged/non-staged counts,
- post-decision action distribution,
- no restricted identifiers,
- no candidate UUIDs,
- no candidate names,
- no target URLs,
- no source IDs,
- no run IDs,
- no preview IDs,
- no audit IDs,
- no raw evidence,
- no raw HTML.

This future breakdown should remain read-only and aggregate-only.

## Blocked Actions Reconfirmed

The following remain blocked after this interpretation gate:

- Candidate approval.
- `approve_for_draft`.
- Public publishing.
- Cleanup mutation.
- Reset/reopen mutation.
- Evidence acquisition.
- Additional candidate decision execution.
- Candidate UUID printing.
- Candidate target/name/URL printing.
- Source/run/preview/audit identifier printing.
- Raw evidence printing.
- Raw HTML printing.
- Database mutation.
- Source/API/UI/schema/typegen/package changes unless separately phased.
- Commit without Gemini approval and James approval.
- Push without explicit James approval.

## Evidence Acquisition Status

Evidence acquisition remains blocked.

Phase 22AM-I does not authorize evidence acquisition and does not change the
Discovery Engine evidence-acquisition boundary.

## Reset/Reopen Status

Reset/reopen remains blocked.

Phase 22AM-I does not authorize any reset, reopen, lifecycle repair, or queue
state mutation.

## Cleanup Status

Cleanup remains blocked.

Phase 22AM-I does not authorize cleanup and does not mutate cleanup lifecycle
state.

## Candidate Approval / Publishing Status

Candidate approval remains blocked.

`approve_for_draft` remains blocked.

Public publishing remains blocked.

No public `tools` write is authorized by this phase.

## Decision

Phase 22AM-I records the following interpretation decision:

1. The original Phase 22AM-G expected bucket did not pass because the queue
   lifecycle state no longer matched the active staged assumption.
2. The aggregate diagnostic safely showed that the `needs_more_evidence` action
   exists in non-identifying aggregate state.
3. Public publishing counts remained unchanged.
4. `discovered_tools` counts remained unchanged.
5. The `needs_more_evidence` candidate decision smoke objective is considered
   complete at the aggregate/non-identifying level.
6. Future post-decision verification should use aggregate decision-action,
   status, and cleanup buckets rather than requiring active staged state.
7. A future read-only aggregate status/cleanup bucket breakdown is recommended
   before any lifecycle cleanup, reset/reopen, evidence acquisition, or
   publishing-related phase.
8. All mutation, approval, publishing, cleanup, reset/reopen, evidence
   acquisition, and identifier-printing boundaries remain blocked.

## Recommended Next Phase

Recommended next phase:

Phase 22AM-J — Candidate Queue Aggregate Bucket Breakdown Planning Gate

Recommended scope:

- Documentation-only planning gate.
- Define a future read-only aggregate status/cleanup/decision-action breakdown.
- Preserve non-identifying output.
- Preserve all mutation and publishing blocks.
- Do not run database reads unless a later phase explicitly approves the exact
  read-only script/command.
- Do not execute cleanup, reset/reopen, evidence acquisition, approval, or
  candidate decisions.

## Final Phase 22AM-I State

Phase 22AM-I is complete when:

- This document is reviewed and approved by Gemini.
- The working tree contains only this documentation file as the intended change.
- `git diff --check` passes.
- `npm run check` passes.
- James explicitly approves commit after Gemini approval.
- No commit is made before Gemini approval and James approval.
- No push is made without explicit James push approval.
