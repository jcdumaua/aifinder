# Phase 22AO-A — Admin Queue UX Fail-Closed Status Presentation Planning Gate

## Phase Type

Documentation-only admin queue UX planning gate.

## Purpose

Phase 22AO-A defines fail-closed status presentation rules for a future Discovery
Engine admin queue.

This phase translates the stabilized Phase 22AN aggregate state into safe future
operator-facing language and disabled-action behavior.

This phase does not implement UI.

This phase does not implement API routes.

This phase does not implement source changes.

This phase does not perform live database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute approve-for-draft.

This phase does not publish public tools.

This phase does not write discovered tools.

This phase does not acquire evidence.

This phase does not inspect or print candidate identifiers.

Phase 22AO-A is planning only.

## Baseline

Latest pushed baseline before this phase:

```text
aa4dbb5 Close Discovery Engine stabilization sequence
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source artifacts:

```text
docs/discovery-phase-22an-j-discovery-engine-stabilization-closure-next-lane-selection-gate.md
docs/discovery-phase-22an-i-discovery-engine-post-inspection-stabilization-handoff-gate.md
docs/discovery-phase-22an-h-other-bucket-bounded-read-only-inspection-result-documentation.md
testing/discovery-other-bucket-bounded-read-only-inspection.mjs
docs/discovery-phase-22an-e-other-bucket-bounded-read-only-inspection-planning-gate.md
docs/discovery-phase-22an-d-admin-queue-ux-interpretation-planning-gate.md
docs/discovery-phase-22an-c-other-bucket-interpretation-planning-gate.md
docs/discovery-phase-22an-b-needs-more-evidence-workflow-design-gate.md
```

## Source Closure Context

Phase 22AN-J closed the stabilization sequence and selected this lane:

```text
DISCOVERY_ENGINE_22AN_STABILIZATION_SEQUENCE_CLOSED
SELECTED_NEXT_LANE_ADMIN_QUEUE_UX_FAIL_CLOSED_PRESENTATION_PLANNING
```

Phase 22AN-I stabilized the post-inspection state:

```text
DISCOVERY_ENGINE_POST_INSPECTION_STATE_STABILIZED
OTHER_BUCKET_REMAINS_UNCLASSIFIED_AND_ACTIVE
NEEDS_MORE_EVIDENCE_REMAINS_BLOCKED
NO_DECISION_READY_CANDIDATE_CONFIRMED
```

Phase 22AN-D established:

```text
QUEUE_UX_STATES_ARE_INTERPRETIVE_NOT_OPERATIONAL_AUTHORIZATION
STATUS_PRESENTATION_MUST_FAIL_CLOSED
```

Phase 22AO-A preserves these rules.

## Planning Decision

Phase 22AO-A establishes:

```text
ADMIN_QUEUE_UX_STATUS_PRESENTATION_MUST_FAIL_CLOSED
ADMIN_QUEUE_UX_ACTIONS_DISABLED_BY_DEFAULT
ADMIN_QUEUE_UX_LABELS_ARE_NOT_AUTHORIZATION
ADMIN_QUEUE_UX_WARNINGS_REQUIRED_FOR_BLOCKED_STATES
```

The future admin queue should communicate candidate status safely without
creating operational permission.

Labels are explanatory only.

Badges are explanatory only.

Warnings are explanatory only.

Counts are diagnostic only.

Disabled controls are required by default.

## Known Aggregate Inputs

The stabilized aggregate facts available for future presentation planning are:

```text
candidate_table_count_before=3
candidate_table_count_after=3
public_tools_count_before=10
public_tools_count_after=10
discovered_tools_count_before=0
discovered_tools_count_after=0
before_after_count_integrity=true
status_group_other_count=1
status_group_needs_more_evidence_count=2
cleanup_group_active_count=2
cleanup_group_cleanup_count=1
decision_action_group_missing_count=1
decision_action_group_needs_more_evidence_count=2
status_group_other__cleanup_group_active_count=1
status_group_needs_more_evidence__cleanup_group_cleanup_count=1
status_group_needs_more_evidence__cleanup_group_active_count=1
```

These are aggregate planning inputs only.

They do not authorize row-level display.

They do not authorize live reads.

They do not authorize candidate identity inspection.

## Future Status Presentation Concepts

The future admin queue may plan these status presentation concepts.

### Needs More Evidence

Safe label:

```text
Needs more evidence
```

Safe helper text:

```text
This candidate cannot be reviewed until more evidence is available.
```

Operator meaning:

- blocked,
- evidence insufficient,
- no decision-ready state,
- no approve-for-draft.

Required control behavior:

```text
approve_for_draft_disabled=true
reject_disabled=true
publish_disabled=true
cleanup_disabled_by_default=true
```

### Other / Unclassified

Safe label:

```text
Unclassified
```

Safe helper text:

```text
This candidate is not classified enough for review or action.
```

Operator meaning:

- active by aggregate cleanup grouping,
- still unclassified,
- not decision-ready,
- no transition authorized.

Required control behavior:

```text
approve_for_draft_disabled=true
reject_disabled=true
publish_disabled=true
transition_disabled=true
cleanup_disabled_by_default=true
```

### Cleanup Group

Safe label:

```text
Cleanup flagged
```

Safe helper text:

```text
This candidate is represented in a cleanup grouping, but cleanup is not authorized from this view.
```

Operator meaning:

- cleanup grouping is diagnostic,
- no cleanup mutation is authorized,
- no reset or reopen is authorized.

Required control behavior:

```text
cleanup_execute_disabled=true
reset_disabled=true
reopen_disabled=true
```

### Missing Decision Action

Safe label:

```text
Action unavailable
```

Safe helper text:

```text
No safe decision action is available for this candidate.
```

Operator meaning:

- missing action is not an invitation to choose one,
- missing action must fail closed,
- no default action should be inferred.

Required control behavior:

```text
approve_for_draft_disabled=true
reject_disabled=true
publish_disabled=true
manual_action_disabled=true
```

### Decision Action Needs More Evidence

Safe label:

```text
Evidence required
```

Safe helper text:

```text
The only safe next interpretation is that more evidence is required.
```

Operator meaning:

- needs-more-evidence is blocked,
- not decision-ready,
- not draft-ready.

Required control behavior:

```text
approve_for_draft_disabled=true
publish_disabled=true
evidence_acquisition_disabled_until_planned=true
```

## Disabled Action Matrix

The future admin queue should use a disabled-by-default action matrix.

```text
state=needs_more_evidence
approve_for_draft=disabled
reject=disabled
publish=disabled
cleanup=disabled
reset=disabled
reopen=disabled
transition=disabled
evidence_acquisition=disabled_until_separate_gate

state=other_unclassified
approve_for_draft=disabled
reject=disabled
publish=disabled
cleanup=disabled
reset=disabled
reopen=disabled
transition=disabled
evidence_acquisition=disabled_until_separate_gate

state=cleanup_group
approve_for_draft=disabled
reject=disabled
publish=disabled
cleanup=disabled_until_separate_gate
reset=disabled
reopen=disabled
transition=disabled
evidence_acquisition=disabled_until_separate_gate

state=missing_decision_action
approve_for_draft=disabled
reject=disabled
publish=disabled
cleanup=disabled
reset=disabled
reopen=disabled
transition=disabled
evidence_acquisition=disabled_until_separate_gate
```

## Operator Warning Requirements

The future admin queue should include operator warnings for blocked states.

Required warning concept:

```text
ADMIN_QUEUE_OPERATOR_WARNING_BLOCKED_STATE
```

Suggested warning text for blocked states:

```text
This queue state is informational only. Actions are disabled until a future approved gate authorizes the next operation.
```

Suggested warning text for unclassified states:

```text
This candidate is unclassified. No transition, cleanup, or decision action is authorized.
```

Suggested warning text for needs-more-evidence states:

```text
Evidence is insufficient. Candidate decisions remain blocked.
```

Suggested warning text for cleanup grouping:

```text
Cleanup grouping is diagnostic only. Cleanup execution is not authorized from this view.
```

## Fail-Closed Rendering Rules

The future admin queue should follow these rendering rules:

```text
FAIL_CLOSED_RULE_UNKNOWN_STATUS_SHOW_UNCLASSIFIED
FAIL_CLOSED_RULE_MISSING_ACTION_SHOW_ACTION_UNAVAILABLE
FAIL_CLOSED_RULE_UNRECOGNIZED_CLEANUP_SHOW_REVIEW_BLOCKED
FAIL_CLOSED_RULE_NO_EVIDENCE_MARKER_SHOW_EVIDENCE_REQUIRED
FAIL_CLOSED_RULE_NO_DRAFT_MARKER_SHOW_NOT_DRAFT_READY
FAIL_CLOSED_RULE_ANY_PARSE_ERROR_DISABLE_ALL_ACTIONS
```

Interpretation:

- unknown status must not become actionable,
- missing action must not become a default action,
- parse errors must disable all actions,
- missing evidence marker must not imply evidence is sufficient,
- missing draft marker must not imply draft readiness.

## Future Visual Treatment Planning

A future implementation may consider these presentation patterns:

- neutral badge for unclassified,
- warning badge for needs-more-evidence,
- muted badge for action unavailable,
- diagnostic badge for cleanup grouping,
- disabled action buttons with explicit reasons,
- row-level warning banner,
- queue-level aggregate warning summary,
- no primary destructive or publishing buttons for blocked states.

These are planning concepts only.

No UI component is implemented by this phase.

## Future Data Contract Planning

A future implementation plan may define a read-only presentation contract with
safe derived fields such as:

```text
status_presentation_label
status_presentation_helper_text
status_presentation_severity
all_actions_disabled
disabled_reason
operator_warning_text
```

This phase does not add such a contract.

This phase does not change API response shapes.

This phase does not add source code.

## Future Accessibility Planning

Future implementation planning should ensure:

- disabled controls include accessible explanations,
- warnings are available to screen readers,
- badge text is not color-only,
- row state is understandable without icons,
- action unavailability is explicit,
- keyboard users can access disabled reasons without triggering actions.

This phase does not implement accessibility behavior.

## Future QA Planning

A later implementation phase should require QA for:

- desktop,
- tablet portrait,
- tablet landscape,
- mobile,
- keyboard navigation,
- screen reader labels,
- disabled action explanations,
- blocked-state rendering,
- unknown-state fail-closed fallback.

This phase does not run UI QA.

## Implementation Boundary

Phase 22AO-A does not authorize:

- UI implementation,
- component changes,
- API route changes,
- helper changes,
- database reads,
- database mutations,
- live execution,
- evidence acquisition,
- candidate decisions,
- approve-for-draft,
- public publishing,
- cleanup mutation,
- reset or reopen,
- identifier-level inspection.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AO-B — Admin Queue UX Fail-Closed Status Presentation Implementation Plan
```

Recommended scope:

- docs-only,
- map future files that might change,
- define non-mutating UI presentation changes,
- define read-only data expectations,
- define QA checklist,
- define accessibility checklist,
- keep implementation blocked until separately approved,
- no DB reads,
- no mutation,
- no source changes in the planning phase.

## Final Phase 22AO-A Decision

Final planning decision:

```text
ADMIN_QUEUE_UX_STATUS_PRESENTATION_MUST_FAIL_CLOSED
ADMIN_QUEUE_UX_ACTIONS_DISABLED_BY_DEFAULT
ADMIN_QUEUE_UX_LABELS_ARE_NOT_AUTHORIZATION
ADMIN_QUEUE_UX_WARNINGS_REQUIRED_FOR_BLOCKED_STATES
```

Final recommended next phase:

```text
Phase 22AO-B — Admin Queue UX Fail-Closed Status Presentation Implementation Plan
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AO-A correctly follows the selected Phase 22AN-J lane,
2. status presentation remains fail-closed,
3. labels and warnings are interpretive only and not operational authorization,
4. the disabled action matrix is conservative enough,
5. future data contract and UI concepts remain planning-only,
6. all live-read, mutation, decision, evidence, publishing, identifier, source,
   API, UI, schema, typegen, package, and lockfile boundaries remain preserved,
7. Phase 22AO-B is an appropriate next docs-only implementation plan,
8. this Phase 22AO-A docs-only planning gate is safe to commit after James
   approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AO-A documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AO-A State

Phase 22AO-A is complete when:

- this planning document is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
