# Phase 22AN-E — Other Bucket Bounded Read-Only Inspection Planning Gate

## Phase Type

Documentation-only bounded read-only inspection planning gate.

## Purpose

Phase 22AN-E plans how a future bounded read-only inspection could safely
understand the Discovery Engine `other` / `unclassified` bucket.

This phase defines inspection boundaries only.

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

This phase does not implement source, API, UI, schema, type generation, package,
or lockfile changes.

Phase 22AN-E is planning only.

## Baseline

Latest pushed baseline before this phase:

```text
8e91b3a Document admin queue UX interpretation planning
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source documents:

```text
docs/discovery-phase-22an-d-admin-queue-ux-interpretation-planning-gate.md
docs/discovery-phase-22an-c-other-bucket-interpretation-planning-gate.md
docs/discovery-phase-22an-b-needs-more-evidence-workflow-design-gate.md
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

Phase 22AN-D established:

```text
QUEUE_UX_STATES_ARE_INTERPRETIVE_NOT_OPERATIONAL_AUTHORIZATION
STATUS_PRESENTATION_MUST_FAIL_CLOSED
```

Phase 22AN-E now plans the future read-only inspection strategy for the
unclassified / other bucket.

## Terminal Aggregate Facts Relevant To This Phase

The terminal aggregate result included:

```text
total_candidate_count=3
status_bucket_other_candidate_count=1
cleanup_bucket_other_candidate_count=1
status_bucket_needs_more_evidence_candidate_count=2
active_staged_candidate_count=0
decision_ready_candidate_count=0
decision_action_approve_for_draft_candidate_count=0
before_after_count_integrity=true
```

The `other` bucket remains informational.

The terminal aggregate result did not include row-level values.

The terminal aggregate result did not include candidate identifiers.

The terminal aggregate result did not authorize a read.

The terminal aggregate result did not authorize mutation.

## Core Planning Decision

Final Phase 22AN-E planning decision:

```text
OTHER_BUCKET_INSPECTION_SHOULD_BE_AGGREGATE_ONLY_FIRST
IDENTIFIER_PRINTING_REMAINS_BLOCKED_BY_DEFAULT
LIVE_READ_REMAINS_BLOCKED_UNTIL_EXPLICIT_FUTURE_APPROVAL
```

This phase plans how a future inspection may be made safe.

This phase does not run that inspection.

## Inspection Goal

The future bounded read-only inspection should answer only this planning
question:

```text
What aggregate shape explains the current other / unclassified bucket without
revealing candidate identifiers or enabling action?
```

The inspection should not attempt to decide candidate outcomes.

The inspection should not attempt to select a candidate for decision execution.

The inspection should not attempt to approve for draft.

The inspection should not attempt to reject.

The inspection should not attempt to publish.

The inspection should not attempt cleanup, reset, or reopen.

## Inspection Strategy

The future inspection should proceed in the following order.

### Step 1 — Aggregate-Only Status Shape

Count candidates by safe status grouping.

Allowed output type:

```text
count_by_status_group_only
```

Expected properties:

- count only,
- no identifiers,
- no names,
- no URLs,
- no source IDs,
- no run IDs,
- no timestamps unless later justified,
- no raw values unless safely normalized.

### Step 2 — Aggregate-Only Cleanup Shape

Count candidates by safe cleanup grouping.

Allowed output type:

```text
count_by_cleanup_group_only
```

Expected properties:

- count only,
- no identifiers,
- no names,
- no URLs,
- no source IDs,
- no run IDs,
- no timestamps unless later justified,
- no raw values unless safely normalized.

### Step 3 — Aggregate Cross-Bucket Shape

If needed, count by combined status group and cleanup group.

Allowed output type:

```text
count_by_status_group_and_cleanup_group_only
```

Expected properties:

- count only,
- no identifiers,
- no names,
- no URLs,
- no source IDs,
- no run IDs,
- no raw evidence,
- no action recommendation.

### Step 4 — Redacted Row-Shape Diagnostics

Only if aggregate-only output cannot explain the other bucket, a later reviewed
plan may allow redacted row-shape diagnostics.

Allowed output type:

```text
redacted_row_shape_without_identifiers
```

Potential safe fields:

- normalized status group,
- normalized cleanup group,
- boolean presence of decision action,
- boolean presence of cleanup marker,
- boolean presence of evidence marker,
- boolean presence of draft marker.

Disallowed output:

- candidate identifiers,
- candidate names,
- candidate URLs,
- source IDs,
- run IDs,
- preview IDs,
- audit IDs,
- raw evidence,
- raw HTML,
- raw external content,
- public tool identifiers,
- discovered tool identifiers.

### Step 5 — Identifier-Level Inspection

Identifier-level inspection should remain blocked by default.

Identifier-level inspection may only be considered if all of the following are
true in a future phase:

- aggregate-only output is insufficient,
- redacted row-shape diagnostics are insufficient,
- Gemini approves identifier-level inspection as necessary,
- James explicitly approves identifier printing,
- the script includes an output safety scanner,
- the script includes abort conditions,
- the script prints only the minimum approved identifier format,
- no mutation or decision execution is possible.

Phase 22AN-E does not authorize identifier-level inspection.

## Future Read-Only Script Requirements

A future read-only inspection script should include:

- opt-out default behavior,
- explicit opt-in environment variable,
- exact approval phrase printed in the script comments,
- repository clean-state check,
- expected HEAD or phase baseline check,
- no package installation,
- no package or lockfile changes,
- no write-capable helper imports,
- no mutation methods,
- no candidate decision route calls,
- no approve-for-draft route calls,
- no public tools writes,
- no discovered tools writes,
- no cleanup mutation,
- no reset/reopen mutation,
- no evidence acquisition,
- no identifier printing by default,
- output safety scan,
- before/after public tools count check if already safe and aggregate-only,
- before/after discovered tools count check if already safe and aggregate-only,
- final no-mutation integrity statement.

Phase 22AN-E does not implement that script.

## Future Live-Read Approval Phrase

A future live-read execution phase must require a new explicit approval phrase.

Suggested future approval phrase:

```text
Approve Phase 22AN-G other bucket bounded read-only inspection execution
```

This phrase is inactive in Phase 22AN-E.

This phase does not authorize running any command with that phrase.

This phase does not authorize creating a live-read script execution.

This phase does not authorize database access.

## Future Phase Split

Recommended future sequence:

```text
Phase 22AN-F — Other Bucket Bounded Read-Only Inspection Script Implementation Gate
Phase 22AN-G — Other Bucket Bounded Read-Only Inspection Execution Approval Gate
Phase 22AN-H — Other Bucket Bounded Read-Only Inspection Result Documentation
Phase 22AN-I — Discovery Engine Post-Inspection Stabilization Handoff Gate
```

The split is required because planning, script implementation, live execution,
result documentation, and stabilization handoff are separate risk levels.

## Phase 22AN-F Script Implementation Gate

A future Phase 22AN-F should be implementation-only for a guarded read-only
script.

Allowed in Phase 22AN-F:

- create a script file,
- include opt-out guard,
- include exact output safety scanner,
- include aggregate-only-first query planning,
- include no-mutation guards,
- include no-identifier-default behavior.

Blocked in Phase 22AN-F:

- running the live read,
- printing identifiers,
- mutation,
- decision execution,
- evidence acquisition,
- public publishing,
- cleanup/reset/reopen,
- source/API/UI implementation.

## Phase 22AN-G Execution Approval Gate

A future Phase 22AN-G should require James approval before any live read.

Allowed only after approval:

- run the guarded read-only inspection script once,
- capture raw output,
- perform output safety validation,
- verify no-mutation integrity.

Blocked even in Phase 22AN-G:

- mutation,
- candidate decision execution,
- approve-for-draft,
- public publishing,
- discovered tools writes,
- cleanup/reset/reopen,
- evidence acquisition,
- UI/source/API implementation.

## Abort Conditions For Future Inspection

A future inspection must abort if:

- working tree is not clean,
- branch is not expected,
- HEAD is not expected,
- package or lockfile changes are present,
- required source docs are missing,
- required markers are missing,
- service credentials are unavailable,
- the query plan would print identifiers without approval,
- the query plan would print names or URLs,
- the query plan would include raw evidence,
- the query plan would mutate state,
- the output safety scanner detects restricted values,
- before/after integrity checks fail.

## Output Safety Scanner Requirements

A future output safety scanner should block or fail on:

- candidate identifiers,
- candidate names,
- candidate URLs,
- source IDs,
- run IDs,
- preview IDs,
- audit IDs,
- raw HTML,
- raw evidence,
- authorization headers,
- API keys,
- service role values,
- environment variable assignments,
- external URLs,
- email addresses,
- unexpected row-level values.

The default expected output should be aggregate labels and counts only.

## Allowed Future Output Labels

The future read-only inspection should prefer labels like:

```text
status_group_staged_count
status_group_needs_more_evidence_count
status_group_rejected_count
status_group_approved_for_draft_count
status_group_other_count
cleanup_group_active_count
cleanup_group_cleanup_count
cleanup_group_other_count
combined_status_cleanup_group_count
```

These labels are examples only.

The future script must define exact labels in its own implementation gate.

## Disallowed Future Output Content

The future inspection must not output:

- candidate identifiers,
- candidate names,
- candidate URLs,
- source identifiers,
- run identifiers,
- preview identifiers,
- audit identifiers,
- raw evidence,
- raw HTML,
- raw source content,
- request headers,
- environment values,
- secrets,
- action recommendations,
- mutation payloads,
- SQL statements intended for manual execution.

## Relationship To Admin Queue UX

Phase 22AN-D established that queue UX states are interpretive, not operational
authorization.

Phase 22AN-E preserves that rule.

Even after a future read-only inspection, the UI must not treat aggregate output
as permission to act.

A future UI implementation still requires a separate implementation planning
gate.

## Relationship To Needs-More-Evidence

Phase 22AN-B established that needs-more-evidence is blocked.

The other bucket must not be automatically converted to needs-more-evidence.

If a future read-only inspection suggests that the other bucket is semantically
related to needs-more-evidence, any transition would still require a separate
candidate transition mutation gate.

## Relationship To Candidate Decisions

The future inspection may explain queue shape.

It must not create decision eligibility.

It must not execute decisions.

It must not approve for draft.

It must not reject.

It must not publish.

It must not clean up.

## Explicit Non-Authorization

Phase 22AN-E does not authorize:

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
- lockfile changes,
- running any future approval phrase.

## Final Other Bucket Inspection Planning Decision

Final Phase 22AN-E decision:

```text
OTHER_BUCKET_INSPECTION_SHOULD_BE_AGGREGATE_ONLY_FIRST
IDENTIFIER_PRINTING_REMAINS_BLOCKED_BY_DEFAULT
LIVE_READ_REMAINS_BLOCKED_UNTIL_EXPLICIT_FUTURE_APPROVAL
```

Final next-phase recommendation:

```text
Phase 22AN-F — Other Bucket Bounded Read-Only Inspection Script Implementation Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AN-E correctly follows Phase 22AN-D,
2. the future inspection strategy is conservative and aggregate-only-first,
3. identifier printing remains blocked by default,
4. live reads remain blocked until a later explicit approval,
5. output safety scanner requirements are sufficient,
6. abort conditions are sufficient,
7. the future Phase 22AN-F / 22AN-G split is appropriate,
8. this Phase 22AN-E docs-only bounded read-only inspection planning gate is safe
   to commit after James approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AN-E documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AN-E State

Phase 22AN-E is complete when:

- this bounded read-only inspection planning document is reviewed and approved
  by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
