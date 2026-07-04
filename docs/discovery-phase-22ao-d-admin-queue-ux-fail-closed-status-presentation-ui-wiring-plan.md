# Phase 22AO-D — Admin Queue UX Fail-Closed Status Presentation UI Wiring Plan

## Phase Type

Documentation-only UI wiring plan.

## Purpose

Phase 22AO-D plans how the Phase 22AO-C fail-closed presentation helper may be
wired into the Admin Queue UI in a future implementation phase.

This phase does not wire the UI.

This phase does not edit UI source files.

This phase does not edit API routes.

This phase does not perform live database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute approve-for-draft.

This phase does not publish public tools.

This phase does not write discovered tools.

This phase does not acquire evidence.

This phase does not inspect or print candidate identifiers.

Phase 22AO-D is planning only.

## Baseline

Latest pushed baseline before this phase:

```text
5be3ab0 Add admin queue fail-closed presentation helper
```

Expected repository status before this phase:

```text
## main...origin/main
```

Primary source artifacts:

```text
docs/discovery-phase-22ao-c-admin-queue-ux-fail-closed-status-presentation-implementation-gate.md
lib/discovery/discovery-candidate-queue-fail-closed-presentation.ts
testing/discovery-candidate-queue-fail-closed-presentation-smoke.mjs
docs/discovery-phase-22ao-b-admin-queue-ux-fail-closed-status-presentation-implementation-plan.md
docs/discovery-phase-22ao-a-admin-queue-ux-fail-closed-status-presentation-planning-gate.md
docs/discovery-phase-22an-j-discovery-engine-stabilization-closure-next-lane-selection-gate.md
```

## Source Implementation Context

Phase 22AO-C established:

```text
ADMIN_QUEUE_UX_FAIL_CLOSED_PRESENTATION_HELPER_IMPLEMENTED
ADMIN_QUEUE_UX_PRESENTATION_ONLY_HELPER_ADDED
ADMIN_QUEUE_UX_NO_ACTION_WIRING_ADDED
ADMIN_QUEUE_UX_SMOKE_TEST_ADDED
```

The helper added in Phase 22AO-C is:

```text
getCandidateQueueFailClosedPresentation
```

The helper returns presentation-only fields:

```text
statusPresentationLabel
statusPresentationHelperText
statusPresentationSeverity
allActionsDisabled
disabledReason
operatorWarningText
```

Phase 22AO-D keeps the helper dormant from live UI behavior until a future
implementation gate is separately approved.

## Planning Decision

Phase 22AO-D establishes:

```text
ADMIN_QUEUE_UX_UI_WIRING_PLAN_ONLY
ADMIN_QUEUE_UX_HELPER_WIRING_REQUIRES_SEPARATE_IMPLEMENTATION_GATE
ADMIN_QUEUE_UX_NO_API_CHANGE_FOR_FIRST_UI_WIRING
ADMIN_QUEUE_UX_NO_ACTION_ENABLEMENT_FROM_HELPER
ADMIN_QUEUE_UX_DISABLED_STATE_MUST_REMAIN_PRIMARY
```

The future UI wiring should be presentation-only.

The future UI wiring should consume already available row state.

The future UI wiring should not require API changes for the first integration.

The future UI wiring should not add action handlers.

The future UI wiring should not enable existing action controls.

The future UI wiring should render blocked state information and disabled
reasons only.

## Current UI Surface Inspection Summary

Phase 22AO-D inspection should identify the current admin queue UI surface before
any implementation.

Candidate areas to inspect:

```text
app/admin/discovery
components/admin
components/admin/discovery
lib/discovery
```

Inspection is used only to plan future wiring.

Inspection does not authorize editing those files in this phase.

## Future Primary Wiring Target

The first future implementation should target the smallest UI surface that
already renders candidate queue rows or candidate status.

Expected target category:

```text
admin_discovery_candidate_queue_presentation_surface
```

The future implementation gate must identify exact files before editing.

No exact file is authorized by this planning document alone.

## Future Wiring Shape

A future UI implementation may follow this shape:

```text
read existing row state
derive fail-closed presentation through helper
render label
render helper text
render operator warning
render disabled reason
keep all action controls disabled
avoid new action handlers
avoid mutation-capable props
```

The UI wiring must not infer operational authorization from labels.

The UI wiring must not treat helper output as permission to act.

The helper output is presentation-only.

## Future Import Boundary

A future implementation may import the helper into a client or server component
only if the target file remains presentation-only.

Future import concept:

```text
getCandidateQueueFailClosedPresentation
```

The future import must not be paired with:

- mutation route calls,
- decision route calls,
- approve route calls,
- publish route calls,
- cleanup route calls,
- reset or reopen route calls,
- live database reads,
- service-role behavior,
- identifier printing.

## Future UI Rendering Contract

The future UI should render the following helper outputs:

```text
statusPresentationLabel
statusPresentationHelperText
operatorWarningText
disabledReason
```

The future UI may use severity only for visual emphasis.

The future UI must not rely on color alone.

The future UI must include text that explains why actions are disabled.

The future UI must preserve fail-closed meaning on desktop, tablet, and mobile.

## Future Disabled Action Contract

The future UI must keep all action controls disabled for helper-derived states:

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

If the target UI currently has no action controls, the future implementation must
not add them.

If the target UI already has action controls, the future implementation must keep
them disabled or hidden with accessible explanation.

## Future Unknown-State Behavior

Future UI wiring must preserve this fail-closed behavior:

```text
UNKNOWN_STATE_RENDERS_REVIEW_BLOCKED
MALFORMED_STATE_RENDERS_REVIEW_BLOCKED
MISSING_ACTION_RENDERS_ACTION_UNAVAILABLE
UNCLASSIFIED_STATE_RENDERS_UNCLASSIFIED
NEEDS_MORE_EVIDENCE_RENDERS_NEEDS_MORE_EVIDENCE
CLEANUP_GROUP_RENDERS_CLEANUP_FLAGGED
```

Unknown and malformed states must never render as actionable.

## Future Accessibility Requirements

Future UI wiring must verify:

```text
status_label_text_not_color_only
disabled_reason_screen_reader_accessible
operator_warning_screen_reader_accessible
keyboard_navigation_does_not_trigger_actions
focus_order_preserves_warning_context
badge_text_has_accessible_name
disabled_controls_have_explanation
```

Accessibility must be part of the future implementation acceptance criteria.

## Future Responsive QA Requirements

Future UI wiring must verify:

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

QA must explicitly include Desktop, Tablet, and Mobile results.

## Future Static Safety Requirements

Future UI wiring implementation must verify:

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
no_package_change=true
no_lockfile_change=true
```

The future implementation must fail if source diffs add mutation behavior,
decision behavior, approve behavior, publish behavior, cleanup behavior, reset or
reopen behavior, service-role behavior, live reads, identifier printing, package
changes, or lockfile changes.

## Future Implementation Sequence

The future implementation gate should proceed in this order:

1. Verify repo status is clean.
2. Verify Phase 22AO-C helper is at HEAD.
3. Inspect exact current admin queue UI file.
4. Select the smallest safe target.
5. Add helper import only if presentation-only.
6. Render label, helper text, warning text, and disabled reason.
7. Keep actions disabled or absent.
8. Run helper smoke test.
9. Run static safety scan.
10. Run npm run check.
11. Run responsive QA if UI changed.
12. Run accessibility checklist.
13. Prepare Gemini review package.
14. Block commit until Gemini approval and James approval.

## Future Files To Avoid Unless Separately Planned

The future implementation should avoid changing:

- API routes,
- database helpers,
- mutation helpers,
- decision route handlers,
- approve route handlers,
- publish route handlers,
- cleanup route handlers,
- schema files,
- migrations,
- generated types,
- package files,
- lockfiles.

If any of those files appear necessary, the implementation must stop and return
to a separate planning gate.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22AO-E — Admin Queue UX Fail-Closed Status Presentation UI Wiring Implementation Gate
```

Recommended scope:

- inspect exact current admin queue UI file,
- implement smallest presentation-only UI wiring,
- do not change APIs,
- do not add mutation or decision behavior,
- keep action controls disabled or absent,
- run helper smoke test,
- run static safety scan,
- run npm run check,
- run responsive QA,
- run accessibility checks,
- require Gemini review before commit.

## Final Phase 22AO-D Decision

Final UI wiring planning decision:

```text
ADMIN_QUEUE_UX_UI_WIRING_PLAN_ONLY
ADMIN_QUEUE_UX_HELPER_WIRING_REQUIRES_SEPARATE_IMPLEMENTATION_GATE
ADMIN_QUEUE_UX_NO_API_CHANGE_FOR_FIRST_UI_WIRING
ADMIN_QUEUE_UX_NO_ACTION_ENABLEMENT_FROM_HELPER
ADMIN_QUEUE_UX_DISABLED_STATE_MUST_REMAIN_PRIMARY
```

Final recommended next phase:

```text
Phase 22AO-E — Admin Queue UX Fail-Closed Status Presentation UI Wiring Implementation Gate
```

## Gemini Review Questions

Gemini should review whether:

1. Phase 22AO-D correctly follows Phase 22AO-C,
2. the helper remains presentation-only and non-authorizing,
3. future UI wiring is scoped to the smallest presentation-only change,
4. no API changes are authorized for first UI wiring,
5. action controls remain disabled or absent,
6. unknown and malformed states remain fail-closed,
7. future static safety checks are sufficient,
8. future responsive QA and accessibility checks are sufficient,
9. Phase 22AO-E is an appropriate next implementation gate,
10. this Phase 22AO-D docs-only UI wiring plan is safe to commit after James
    approval.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AO-D documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AO-D State

Phase 22AO-D is complete when:

- this UI wiring plan is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
