# Phase 22AN-B — Needs-More-Evidence Workflow Design Gate

## Phase Type

Documentation-only workflow design gate.

## Purpose

Phase 22AN-B defines the Discovery Engine workflow meaning of
`needs_more_evidence`.

This phase defines evidence sufficiency criteria, blocked actions, future
transition rules, and approval gates before any future evidence acquisition,
candidate read, mutation, decision execution, or public publishing.

Phase 22AN-B does not perform live database reads.

Phase 22AN-B does not mutate database state.

Phase 22AN-B does not execute candidate decisions.

Phase 22AN-B does not execute `approve_for_draft`.

Phase 22AN-B does not publish public tools.

Phase 22AN-B does not write discovered tools.

Phase 22AN-B does not perform cleanup mutation.

Phase 22AN-B does not reset or reopen candidates.

Phase 22AN-B does not acquire evidence.

Phase 22AN-B does not inspect candidate identifiers.

Phase 22AN-B does not change source, API, UI, schema, type generation, packages,
or lockfiles.

Phase 22AN-B is design only.

## Baseline

Latest pushed baseline before this phase:

```text
4d3d7c5 Document post-aggregate roadmap selection
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source documents:

```text
docs/discovery-phase-22an-a-discovery-engine-post-aggregate-roadmap-selection-gate.md
docs/discovery-phase-22am-v-candidate-queue-aggregate-verification-closure-documentation.md
docs/discovery-phase-22am-t-candidate-queue-aggregate-bucket-breakdown-patched-execution-result.md
```

## Prior Roadmap Decision

Phase 22AN-A selected the next direction:

```text
Phase 22AN-A roadmap decision: SELECT NEEDS-MORE-EVIDENCE WORKFLOW DESIGN
Next recommended phase: Phase 22AN-B — Needs-More-Evidence Workflow Design Gate
```

The selected direction was based on the terminal aggregate queue facts:

```text
status_bucket_needs_more_evidence_candidate_count=2
decision_action_needs_more_evidence_candidate_count=2
needs_more_evidence_any_status_candidate_count=2
active_staged_candidate_count=0
decision_ready_candidate_count=0
decision_action_approve_for_draft_candidate_count=0
```

## Closed Aggregate Sequence Context

The Phase 22AM aggregate queue verification sequence is already closed.

```text
Phase 22AM aggregate queue verification sequence: CLOSED SUCCESSFULLY
Terminal verified result: READ_ONLY_AGGREGATE_BUCKET_BREAKDOWN_COMPLETE
```

Phase 22AN-B does not reopen the Phase 22AM sequence.

Phase 22AN-B does not recommend rerunning the aggregate bucket breakdown.

Phase 22AN-B does not convert any candidate into a decision-ready candidate.

## Operational Definition

`needs_more_evidence` means that a candidate cannot safely proceed to decision
execution because the available information is not sufficient to justify a
final disposition.

A candidate in `needs_more_evidence` is not decision-ready.

A candidate in `needs_more_evidence` is not approved for draft.

A candidate in `needs_more_evidence` is not rejected by default.

A candidate in `needs_more_evidence` is not ready for public publishing.

A candidate in `needs_more_evidence` is in a blocked evidence-insufficient state.

## What Needs-More-Evidence Does Not Mean

`needs_more_evidence` does not mean:

- the candidate is valid,
- the candidate is invalid,
- the candidate is duplicate,
- the candidate is safe to publish,
- the candidate is safe to reject,
- the candidate is safe to approve for draft,
- the candidate should be reset or reopened,
- evidence should be acquired immediately,
- candidate identifiers may be inspected immediately,
- direct SQL is authorized,
- manual database operation is authorized.

It is a fail-closed state.

## Evidence Sufficiency Standard

A future candidate should not leave `needs_more_evidence` unless enough evidence
exists to support the next state.

Evidence sufficiency should be based on the following categories.

### Identity Evidence

The candidate should have enough evidence to determine:

- tool or product name,
- canonical vendor or publisher identity,
- primary official presence,
- whether the candidate represents an actual AI tool or service.

### Source Evidence

The candidate should have enough evidence to determine:

- where the candidate came from,
- whether the source is credible enough for staging consideration,
- whether the source content is fresh enough for the intended workflow,
- whether the source content is specific to the candidate.

### URL / Availability Evidence

The candidate should have enough evidence to determine:

- whether an official destination exists,
- whether the destination is reachable through approved acquisition methods,
- whether the destination appears relevant to the candidate,
- whether platform links or web links are missing, ambiguous, or stale.

This phase does not fetch, inspect, validate, or open any URL.

### Category / Taxonomy Evidence

The candidate should have enough evidence to determine:

- likely AiFinder category,
- whether the category maps to the current approved category set,
- whether the candidate is an AI tool rather than a non-tool article, company,
  person, or generic resource.

### Duplicate / Existing Tool Evidence

The candidate should have enough evidence to determine whether it may already
exist in public tools, discovered tools, or candidate staging.

This phase does not perform duplicate lookup.

A future duplicate lookup requires a separate approved read-only gate.

### Safety / Policy Evidence

The candidate should have enough evidence to determine whether it is obviously
outside allowed scope, unsafe, spam-like, irrelevant, or otherwise unsuitable for
AiFinder.

This phase does not reject candidates.

A future rejection requires a separate approved decision or mutation gate.

## Evidence Sufficiency Outcomes

A future evidence review may produce one of the following design-level outcomes.

### Outcome A — Still Needs More Evidence

The candidate remains blocked because evidence is still insufficient.

Allowed future meaning:

```text
remain_needs_more_evidence
```

This outcome must not mutate anything unless a future mutation gate explicitly
authorizes it.

### Outcome B — Eligible To Return To Staged

The candidate has enough evidence to be considered staged again.

Allowed future meaning:

```text
eligible_for_staged_reconsideration
```

This is not an automatic state change.

A future state transition requires a separate mutation gate.

### Outcome C — Eligible For Rejection Review

The candidate has enough evidence to support rejection review.

Allowed future meaning:

```text
eligible_for_rejection_review
```

This is not an automatic rejection.

A future rejection requires a separate decision execution gate.

### Outcome D — Eligible For Draft Review

The candidate has enough evidence to support draft review.

Allowed future meaning:

```text
eligible_for_draft_review
```

This is not `approve_for_draft`.

A future approve-for-draft action requires a separate decision execution gate and
must remain blocked until explicitly approved.

## Blocked Actions While Evidence Is Insufficient

While a candidate is in `needs_more_evidence`, the following actions remain
blocked:

- candidate decision execution,
- `approve_for_draft`,
- public tools publishing,
- discovered tools writes,
- cleanup mutation,
- reset/reopen mutation,
- status mutation,
- candidate identifier inspection,
- evidence acquisition,
- direct SQL,
- manual database operation,
- schema changes,
- type generation,
- source/API/UI implementation changes.

## Required Future Gates

The following gates are required before any future operational work.

### Read-Only Candidate Selection Gate

Required before any candidate-specific read.

Purpose:

- define whether candidate-specific read is needed,
- define exact read-only query boundaries,
- define whether identifiers can be printed,
- define redaction and output safety rules,
- define abort conditions.

This phase does not authorize this gate.

### Evidence Acquisition Planning Gate

Required before any evidence acquisition.

Purpose:

- define acquisition adapter or method,
- define source allowlist and safety rules,
- define timeout and size limits,
- define storage or no-storage policy,
- define whether raw evidence may be retained,
- define output redaction rules,
- define approval phrase for any live acquisition.

This phase does not authorize acquisition.

### Evidence Sufficiency Review Gate

Required before evidence can affect workflow state.

Purpose:

- compare acquired evidence to the sufficiency criteria,
- decide whether the candidate remains blocked,
- decide whether the candidate may be considered for staged, rejection, or draft
  review,
- keep decision execution blocked until a later gate.

This phase does not perform review.

### Candidate Transition Mutation Gate

Required before any candidate status or action changes.

Purpose:

- define exact mutation scope,
- define candidate selection boundaries,
- define before/after verification,
- define rollback or stop conditions,
- define audit expectations.

This phase does not authorize mutation.

### Candidate Decision Execution Gate

Required before any candidate decision action.

Purpose:

- define exact action,
- confirm candidate is eligible,
- confirm evidence sufficiency,
- confirm no public publishing is bundled,
- confirm no cleanup mutation is bundled,
- confirm before/after verification.

This phase does not authorize decision execution.

### Public Publishing Gate

Required before public `tools` writes.

Purpose:

- define draft-to-public promotion rules,
- confirm content quality,
- confirm duplicate safety,
- confirm admin visibility,
- confirm rollback or correction plan.

This phase does not authorize public publishing.

## State Transition Design

Future transitions from `needs_more_evidence` must be explicit, reviewed, and
gated.

Allowed design-level transition candidates:

```text
needs_more_evidence -> needs_more_evidence
needs_more_evidence -> staged
needs_more_evidence -> rejected
needs_more_evidence -> approved_for_draft
```

Important restrictions:

- no transition is authorized by Phase 22AN-B,
- no transition may occur without a future mutation or decision gate,
- no transition may bundle public publishing,
- no transition may bundle cleanup mutation,
- no transition may bundle evidence acquisition,
- no transition may print identifiers unless separately approved.

## Recommended Future Order

The recommended future order is:

1. finish this docs-only needs-more-evidence workflow design,
2. plan the informational other bucket separately,
3. plan admin queue UX semantics separately,
4. only then consider bounded read-only candidate-specific planning,
5. only then consider evidence acquisition planning,
6. only then consider mutation or decision execution planning.

This order preserves fail-closed behavior.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AN-C — Other Bucket Interpretation Planning Gate
```

Recommended scope:

- docs-only,
- interpret the informational `other` bucket at planning level,
- decide whether a future read-only inspection is needed,
- keep live reads blocked unless explicitly approved in a later gate,
- keep mutations blocked,
- keep candidate decisions blocked,
- keep evidence acquisition blocked,
- keep public publishing blocked,
- no source/API/UI/schema/typegen/package changes,
- no package or lockfile changes.

## Deferred Needs-More-Evidence Operational Gates

The following needs-more-evidence operational gates are deferred, not rejected:

```text
Needs-More-Evidence Read-Only Candidate Selection Gate
Needs-More-Evidence Evidence Acquisition Planning Gate
Needs-More-Evidence Evidence Sufficiency Review Gate
Needs-More-Evidence Candidate Transition Mutation Gate
Needs-More-Evidence Candidate Decision Execution Gate
Needs-More-Evidence Public Publishing Gate
```

Deferred means:

- not authorized by Phase 22AN-B,
- still valid for later planning,
- still blocked behind explicit approval,
- not executable from this document.

## Explicit Non-Authorization

Phase 22AN-B does not authorize:

- live database reads,
- database mutation,
- candidate identifier inspection,
- evidence acquisition,
- candidate decision execution,
- `approve_for_draft`,
- public tools writes,
- discovered tools writes,
- cleanup mutation,
- reset/reopen mutation,
- direct SQL,
- manual database operation,
- schema changes,
- type generation,
- source/API/UI implementation,
- package changes,
- lockfile changes.

## Final Workflow Design Decision

Final Phase 22AN-B decision:

```text
NEEDS_MORE_EVIDENCE_IS_A_BLOCKED_EVIDENCE_INSUFFICIENT_STATE
```

Final next-phase recommendation:

```text
Phase 22AN-C — Other Bucket Interpretation Planning Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AN-B correctly follows Phase 22AN-A,
2. the needs-more-evidence definition is operationally safe,
3. the evidence sufficiency criteria are clear enough for future planning,
4. blocked actions remain properly blocked,
5. future transition candidates are described without authorizing mutation,
6. future gates are complete and conservative,
7. Phase 22AN-C is an appropriate next docs-only planning gate,
8. this Phase 22AN-B docs-only workflow design gate is safe to commit after
   James approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AN-B documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AN-B State

Phase 22AN-B is complete when:

- this workflow design document is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- `npm run check` passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
