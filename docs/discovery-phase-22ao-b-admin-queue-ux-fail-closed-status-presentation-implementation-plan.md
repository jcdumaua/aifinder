# Phase 22AO-B — Admin Queue UX Fail-Closed Status Presentation Implementation Plan

## Phase Type

Documentation-only implementation plan.

## Purpose

Phase 22AO-B plans a future implementation for admin queue fail-closed status
presentation.

This phase translates the Phase 22AO-A planning rules into a bounded future
implementation plan.

This phase does not implement UI.

This phase does not implement API routes.

This phase does not implement helpers.

This phase does not perform live database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute approve-for-draft.

This phase does not publish public tools.

This phase does not write discovered tools.

This phase does not acquire evidence.

This phase does not inspect or print candidate identifiers.

Phase 22AO-B is planning only.

## Recovery Note

A prior Phase 22AO-B generation attempt stopped safely because the documentation
safety scan detected a restricted literal value-pattern example in the draft
document.

This recovered document avoids exact restricted value-pattern examples while
preserving the same safety intent.

No source file was changed by the failed attempt.

No commit was created by the failed attempt.

No push was performed by the failed attempt.

## Baseline

Latest pushed baseline before this phase:

```text
b6c9cb7 Document admin queue fail-closed UX planning
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source artifacts:

```text
docs/discovery-phase-22ao-a-admin-queue-ux-fail-closed-status-presentation-planning-gate.md
docs/discovery-phase-22an-j-discovery-engine-stabilization-closure-next-lane-selection-gate.md
docs/discovery-phase-22an-i-discovery-engine-post-inspection-stabilization-handoff-gate.md
docs/discovery-phase-22an-h-other-bucket-bounded-read-only-inspection-result-documentation.md
docs/discovery-phase-22an-d-admin-queue-ux-interpretation-planning-gate.md
docs/discovery-phase-22an-b-needs-more-evidence-workflow-design-gate.md
```

## Source Planning Context

Phase 22AO-A established:

```text
ADMIN_QUEUE_UX_STATUS_PRESENTATION_MUST_FAIL_CLOSED
ADMIN_QUEUE_UX_ACTIONS_DISABLED_BY_DEFAULT
ADMIN_QUEUE_UX_LABELS_ARE_NOT_AUTHORIZATION
ADMIN_QUEUE_UX_WARNINGS_REQUIRED_FOR_BLOCKED_STATES
```

Phase 22AN-J selected the lane:

```text
SELECTED_NEXT_LANE_ADMIN_QUEUE_UX_FAIL_CLOSED_PRESENTATION_PLANNING
```

Phase 22AN-I established:

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

Phase 22AO-B preserves all of these constraints.

## Implementation Plan Decision

Phase 22AO-B establishes a future implementation plan only:

```text
ADMIN_QUEUE_UX_FAIL_CLOSED_IMPLEMENTATION_PLAN_ONLY
FUTURE_UI_CHANGES_MUST_BE_PRESENTATION_ONLY
NO_ACTION_ENABLEMENT_FROM_STATUS_LABELS
DISABLED_ACTION_MATRIX_MUST_BE_ENFORCED_BY_PRESENTATION
READ_ONLY_DATA_CONTRACT_MUST_REMAIN_NON_AUTHORIZING
```

The future implementation may add presentation-only logic.

The future implementation must not add or enable actions.

The future implementation must not introduce mutation-capable controls.

The future implementation must not rely on status labels as authorization.

The future implementation must fail closed for unknown or malformed data.

## Future Implementation Boundary

A future implementation phase may be allowed to change only presentation-level
files after separate approval.

Candidate future file areas to inspect in the next implementation gate:

```text
app/admin/discovery
components/admin
components/admin/discovery
lib/discovery
```

These are candidate inspection areas only.

Phase 22AO-B does not confirm exact implementation files.

Phase 22AO-B does not edit any source file.

Phase 22AO-B does not authorize source changes.

The future implementation gate must first inspect the current code and identify
the exact minimal file set before any edit.

## Future Allowed Change Type

A future implementation may be planned around these non-mutating change types:

```text
presentation_label_mapping
presentation_helper_text_mapping
disabled_action_reason_mapping
operator_warning_text_mapping
fail_closed_fallback_mapping
accessibility_description_mapping
responsive_display_checklist
```

These change types are presentation-only.

They must not:

- call mutation endpoints,
- call decision endpoints,
- call approve endpoints,
- call publish endpoints,
- call cleanup endpoints,
- call reset endpoints,
- call reopen endpoints,
- change database queries,
- add live database reads,
- add service-role behavior,
- add evidence acquisition,
- add identifier printing.

## Future Data Expectations

The future UI should consume already-available read-only queue data where possible.

If future implementation discovers that the required presentation data is not
available, the implementation must stop and return to planning.

Expected safe derived presentation fields may include:

```text
status_presentation_label
status_presentation_helper_text
status_presentation_severity
all_actions_disabled
disabled_reason
operator_warning_text
```

These are future derived UI concepts only.

They are not database columns.

They are not schema changes.

They are not API contract changes in this phase.

If an API response shape change is later needed, it must be planned in a separate
API read-contract phase before implementation.

## Presentation Mapping Plan

The future implementation should map known blocked states to safe labels.

### Needs More Evidence

Future display label:

```text
Needs more evidence
```

Future helper text:

```text
This candidate cannot be reviewed until more evidence is available.
```

Required derived state:

```text
all_actions_disabled=true
disabled_reason=evidence_insufficient
operator_warning_required=true
```

### Other / Unclassified

Future display label:

```text
Unclassified
```

Future helper text:

```text
This candidate is not classified enough for review or action.
```

Required derived state:

```text
all_actions_disabled=true
disabled_reason=unclassified_not_actionable
operator_warning_required=true
```

### Cleanup Group

Future display label:

```text
Cleanup flagged
```

Future helper text:

```text
Cleanup grouping is diagnostic only. Cleanup is not authorized from this view.
```

Required derived state:

```text
all_actions_disabled=true
disabled_reason=cleanup_not_authorized
operator_warning_required=true
```

### Missing Decision Action

Future display label:

```text
Action unavailable
```

Future helper text:

```text
No safe decision action is available.
```

Required derived state:

```text
all_actions_disabled=true
disabled_reason=no_safe_action
operator_warning_required=true
```

### Unknown Or Parse Error

Future display label:

```text
Review blocked
```

Future helper text:

```text
This queue state could not be safely interpreted. Actions are disabled.
```

Required derived state:

```text
all_actions_disabled=true
disabled_reason=fail_closed_parse_or_unknown_state
operator_warning_required=true
```

## Disabled Action Enforcement Plan

Future implementation must enforce:

```text
approve_for_draft_disabled=true
reject_disabled=true
publish_disabled=true
cleanup_execute_disabled=true
reset_disabled=true
reopen_disabled=true
transition_disabled=true
evidence_acquisition_disabled_until_planned=true
```

The UI must not display enabled controls for blocked states.

If existing controls exist, the future implementation must either:

- keep them disabled with explicit reasons, or
- hide them while preserving operator warning text.

The future implementation must not add new action buttons.

The future implementation must not wire any action click handlers.

## Fail-Closed Fallback Plan

Future implementation should define a deterministic mapping function.

Suggested future helper concept:

```text
getCandidateQueueFailClosedPresentation(...)
```

This helper concept should:

- accept a redacted queue row or already available queue summary,
- return only presentation fields,
- never mutate input,
- never call network,
- never call Supabase,
- never print identifiers,
- default to review blocked for unknown status,
- default to all actions disabled,
- include disabled reasons,
- include operator warnings.

This helper is a future concept only.

Phase 22AO-B does not implement it.

## Future Component Plan

A future implementation may use a dedicated presentation component.

Suggested future component concept:

```text
CandidateQueueFailClosedStatusPresentation
```

This component concept should:

- render status label,
- render helper text,
- render warning text when required,
- render disabled reason,
- avoid action wiring,
- avoid mutation-capable props,
- avoid exposing identifiers,
- preserve responsive layout.

This component is a future concept only.

Phase 22AO-B does not implement it.

## Future API Boundary

Future implementation should avoid API changes if existing read-only queue data is
sufficient.

If API changes become necessary, they must be limited to read-only presentation
fields and must require a separate API read-contract planning gate.

API changes remain blocked by this phase.

Mutation routes remain blocked.

Decision routes remain blocked.

Approve routes remain blocked.

Publish routes remain blocked.

Cleanup routes remain blocked.

Reset and reopen routes remain blocked.

## Future Verification Plan

A future implementation phase must verify:

```text
no_mutation_methods_added=true
no_decision_route_calls_added=true
no_approve_route_calls_added=true
no_publish_route_calls_added=true
no_cleanup_route_calls_added=true
no_reset_or_reopen_route_calls_added=true
no_supabase_service_role_added=true
no_live_db_read_added=true
no_identifier_printing_added=true
```

Future static checks should search for mutation method calls, action route calls,
service-role references, and identifier-value printing patterns.

The future static scan must include mutation method names and restricted route
segments, but future documentation should not include raw identifier assignment
examples.

## Future QA Checklist

A future implementation must include QA for:

```text
desktop_status_presentation_passed
tablet_portrait_status_presentation_passed
tablet_landscape_status_presentation_passed
mobile_status_presentation_passed
unknown_state_fail_closed_passed
missing_action_fail_closed_passed
needs_more_evidence_disabled_actions_passed
unclassified_disabled_actions_passed
cleanup_group_disabled_actions_passed
operator_warning_visible_passed
```

QA must confirm that blocked states do not expose enabled action controls.

QA must confirm that all warning and helper text is visible or accessible.

QA must confirm responsive layout does not hide the blocked-state meaning.

## Future Accessibility Checklist

A future implementation must include accessibility checks for:

```text
status_label_text_not_color_only
disabled_reason_screen_reader_accessible
operator_warning_screen_reader_accessible
keyboard_navigation_does_not_trigger_actions
focus_order_preserves_warning_context
badge_text_has_accessible_name
disabled_controls_have_explanation
```

Accessibility is part of the implementation acceptance criteria.

## Future Responsive Checklist

Future UI QA must include:

```text
desktop
tablet_portrait
tablet_landscape
mobile
```

Each viewport must verify:

- status label visible,
- helper text visible or accessible,
- operator warning visible or accessible,
- disabled reason visible or accessible,
- no enabled action controls,
- no layout overflow that hides blocked-state meaning.

## Future Commit Boundary

The future implementation phase must not commit until:

- exact source files are identified,
- implementation remains presentation-only,
- static safety checks pass,
- responsive QA passes,
- accessibility checklist passes,
- npm run check passes,
- Gemini approves,
- James explicitly approves commit.

## Explicit Non-Authorization

Phase 22AO-B does not authorize:

- source implementation,
- UI implementation,
- API implementation,
- helper implementation,
- live database reads,
- repeated read-only inspection,
- identifier-level inspection,
- database mutation,
- candidate status transition,
- candidate cleanup mutation,
- reset/reopen mutation,
- candidate decision execution,
- approve-for-draft,
- public tools writes,
- discovered tools writes,
- evidence acquisition,
- schema changes,
- type generation,
- package changes,
- lockfile changes,
- direct SQL,
- manual database operation.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AO-C — Admin Queue UX Fail-Closed Status Presentation Implementation Gate
```

Recommended scope:

- inspect exact current admin queue files,
- implement the minimal presentation-only helper/component if safe,
- do not change APIs unless a separate API read-contract phase is first approved,
- do not add mutation or decision behavior,
- do not run live database reads,
- do not print identifiers,
- run static safety checks,
- run responsive QA if UI changes are made,
- run accessibility checks,
- run npm run check,
- require Gemini review before commit.

## Final Phase 22AO-B Decision

Final implementation plan decision:

```text
ADMIN_QUEUE_UX_FAIL_CLOSED_IMPLEMENTATION_PLAN_ONLY
FUTURE_UI_CHANGES_MUST_BE_PRESENTATION_ONLY
NO_ACTION_ENABLEMENT_FROM_STATUS_LABELS
DISABLED_ACTION_MATRIX_MUST_BE_ENFORCED_BY_PRESENTATION
READ_ONLY_DATA_CONTRACT_MUST_REMAIN_NON_AUTHORIZING
```

Final recommended next phase:

```text
Phase 22AO-C — Admin Queue UX Fail-Closed Status Presentation Implementation Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AO-B correctly converts Phase 22AO-A into a bounded future
   implementation plan,
2. the future implementation remains presentation-only,
3. no API, source, UI, or helper implementation is performed by this phase,
4. future file boundaries are cautious and require inspection before edit,
5. disabled action enforcement and fail-closed fallback are conservative enough,
6. future QA and accessibility checklists are sufficient,
7. all live-read, mutation, decision, evidence, publishing, identifier, schema,
   typegen, package, and lockfile boundaries remain preserved,
8. Phase 22AO-C is an appropriate next implementation gate only after this plan
   is committed and pushed,
9. this Phase 22AO-B docs-only implementation plan is safe to commit after James
   approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AO-B documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AO-B State

Phase 22AO-B is complete when:

- this implementation plan is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
