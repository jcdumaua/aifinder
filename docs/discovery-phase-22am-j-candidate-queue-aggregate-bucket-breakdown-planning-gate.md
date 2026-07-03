# Phase 22AM-J — Candidate Queue Aggregate Bucket Breakdown Planning Gate

## Phase Type

Documentation-only planning gate.

## Purpose

Phase 22AM-J defines the next safe, non-identifying read-only aggregate bucket
breakdown that may be used to understand the candidate queue after the
`needs_more_evidence` decision path was validated.

This phase does not run database reads, does not mutate database state, does not
execute candidate decisions, does not perform cleanup, does not reset or reopen
candidates, does not acquire evidence, does not approve candidates, and does not
publish tools.

## Current Repository Baseline

Latest pushed phase before this planning gate:

- Phase 22AM-I — Candidate Queue Aggregate State Interpretation Gate
- Latest pushed commit: `603db09`
- Commit subject: `Document candidate queue aggregate interpretation gate`
- Final pushed status: `## main...origin/main`

## Prior Interpretation Input

Phase 22AM-I interpreted the Phase 22AM-G aggregate diagnostic and recorded that
the original post-decision active staged bucket was too narrow for the observed
candidate lifecycle state.

Key Phase 22AM-G aggregate diagnostic values:

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

Phase 22AM-I concluded:

1. The `needs_more_evidence` decision path was materially satisfied at the
   aggregate / non-identifying level.
2. Public `tools` counts remained unchanged.
3. `discovered_tools` counts remained unchanged.
4. The candidate moved out of the original active staged expectation bucket.
5. Future verification should distinguish status, cleanup, active/non-cleanup,
   and decision-action buckets instead of requiring active staged state.

## Planning Decision

Phase 22AM-J plans a future read-only aggregate bucket breakdown before any
cleanup, reset/reopen, evidence acquisition, approval, publishing, or additional
candidate decision phase.

The future breakdown should answer only aggregate lifecycle questions:

- How many candidates exist overall?
- How many candidates are in each candidate status bucket?
- How many candidates are active / non-cleanup?
- How many candidates are in cleanup-related buckets?
- How many candidates have any decision action recorded?
- How many candidates are associated with `needs_more_evidence` at an aggregate
  level?
- Whether public `tools` and `discovered_tools` counts remain unchanged before
  and after the read-only check.

The future breakdown must not identify individual candidates.

## Future Read-Only Breakdown Output Contract

A future read-only script or command may output only aggregate counts.

Allowed output categories:

```text
total_candidate_count
status_bucket_counts
cleanup_bucket_counts
active_non_cleanup_candidate_count
active_staged_candidate_count
staged_candidate_count
decision_ready_candidate_count
any_decision_action_set_candidate_count
decision_action_bucket_counts
needs_more_evidence_any_status_candidate_count
needs_more_evidence_active_any_status_candidate_count
needs_more_evidence_staged_any_cleanup_candidate_count
needs_more_evidence_active_staged_candidate_count
public_tools_count_query_before
public_tools_count_query_after
discovered_tools_count_query_before
discovered_tools_count_query_after
```

The exact internal query implementation must be separately reviewed before any
read-only execution phase.

## Non-Identifying Output Requirements

The future breakdown must not print:

- Candidate UUIDs.
- Candidate names.
- Candidate target URLs.
- Candidate domains.
- Source IDs.
- Run IDs.
- Preview IDs.
- Audit IDs.
- User IDs.
- Tool IDs.
- Raw evidence.
- Raw HTML.
- Prompt text.
- LLM output.
- Extraction payloads.
- Serialized row data.
- JSON arrays of candidate rows.
- Any value that can identify a candidate, source, run, target, or audit event.

Only aggregate counts are allowed.

## Read-Only Execution Requirements For A Future Phase

A future execution phase, if approved, must satisfy all of the following before
running:

1. The exact read-only script or terminal command must be documented first.
2. The script must be non-mutating by construction.
3. The script must not call candidate decision RPCs.
4. The script must not call cleanup RPCs or cleanup helpers.
5. The script must not call reset/reopen functions.
6. The script must not call evidence acquisition functions.
7. The script must not call crawler, fetch, extraction, or LLM paths.
8. The script must not call public publishing or approval paths.
9. The script must output aggregate counts only.
10. The script must include an identifier leak guard.
11. The script must save output with `tee`.
12. The script must copy raw terminal output to clipboard even if it fails.
13. The script must exit with the original success/failure code.

## Candidate Decision Boundary

All candidate decisions remain blocked.

Phase 22AM-J does not authorize:

- `needs_more_evidence`.
- `reject`.
- `approve_for_draft`.
- Any new candidate decision action.
- Any retry of the Phase 22AM-D mutation.
- Any candidate decision smoke rerun.

The `needs_more_evidence` decision path is treated as mechanically validated at
the aggregate / non-identifying level and does not need another decision mutation
for the current smoke objective.

## Approval And Publishing Boundary

Candidate approval remains blocked.

`approve_for_draft` remains blocked.

Public publishing remains blocked.

No public `tools` write is authorized.

No `discovered_tools` write is authorized.

No publishing-adjacent behavior is authorized.

## Cleanup Boundary

Cleanup remains blocked.

Phase 22AM-J does not authorize cleanup, cleanup lifecycle mutation, cleanup
repair, cleanup deletion, cleanup completion, cleanup reset, or cleanup closure.

Any cleanup lifecycle design must be handled by a separate future gate after the
read-only aggregate bucket state is better understood.

## Reset/Reopen Boundary

Reset/reopen remains blocked.

Phase 22AM-J does not authorize reopening candidates, restoring staged status,
undoing decisions, or moving candidates between lifecycle buckets.

## Evidence Acquisition Boundary

Evidence acquisition remains blocked.

Phase 22AM-J does not authorize:

- HTML acquisition.
- Screenshot acquisition.
- External fetches.
- Crawler execution.
- Extraction execution.
- LLM analysis.
- Candidate enrichment.
- Evidence storage writes.

Evidence acquisition may be considered only after a separate gate confirms the
candidate queue lifecycle state is safe and the intended target set can remain
non-identifying or otherwise explicitly governed.

## Source / API / UI / Schema Boundary

Phase 22AM-J is documentation-only.

It does not authorize changes to:

- Source code.
- API routes.
- UI components.
- Supabase schema.
- Migrations.
- Generated types.
- Package files.
- Lockfiles.
- Test harnesses.
- Runtime scripts.

A future script implementation phase may be proposed, but only after this
planning gate is reviewed.

## Recommended Next Phase

Recommended next phase:

Phase 22AM-K — Candidate Queue Aggregate Bucket Breakdown Script Planning Gate

Recommended scope:

- Documentation-only script planning.
- Define the exact future read-only script path, environment requirements, query
  boundaries, output labels, and leak guard.
- Do not run the read-only database query yet.
- Preserve all mutation, approval, publishing, cleanup, reset/reopen, evidence
  acquisition, and identifier-printing blocks.

Alternative next phase:

Phase 22AM-K may instead close the current candidate decision smoke sequence if
James decides no further queue-state breakdown is needed before moving to the
next strategic Discovery Engine objective.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AM-J documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AM-J State

Phase 22AM-J is complete when:

- This planning document is reviewed and approved by Gemini.
- The working tree contains only this documentation file as the intended change.
- Whitespace checks pass.
- `npm run check` passes.
- James explicitly approves commit after Gemini approval.
- No commit is made before Gemini approval and James approval.
- No push is made without explicit James push approval.
