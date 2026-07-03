# Discovery Phase 22C — Candidate Decision UI Controls Design Gate

## Status

Drafted for review.

Phase 22C is a documentation-only UI controls design gate.

It defines the future admin user experience for candidate decision controls before any implementation begins.

## Phase 22C Purpose

Phase 22C designs the operator-facing candidate decision controls that may later appear in the admin interface.

This phase exists because candidate decision actions are sensitive. The UI must not make it easy to accidentally publish, approve for draft, reject, promote, or mutate candidate records without clear boundaries, confirmations, and future implementation gates.

## Starting Context

Phase 22C follows the pushed backend closure summary:

- Previous phase: Phase 22B — Candidate Decision Backend Closure Summary
- Previous commit: `11e6561`
- Previous commit message: `Document candidate decision backend closure summary`
- Previous final status: `## main...origin/main`

Phase 22B recommended:

```text
Phase 22C — Candidate Decision UI Controls Design Gate
```

as the next documentation-first step.

## Phase 22C Scope

Allowed in Phase 22C:

- Documentation only.
- Design only.
- Future admin UI decision-control design.
- Operator copy and confirmation copy design.
- Disabled/blocked state design.
- QA expectation design.
- Gemini review package preparation.
- Commit and push only after James explicitly approves.

Not allowed in Phase 22C:

- No source changes.
- No UI implementation.
- No API changes.
- No helper changes.
- No test changes.
- No package changes.
- No database mutation.
- No cleanup execution.
- No candidate decision execution.
- No candidate promotion.
- No candidate rejection.
- No public publishing.
- No `approve_for_draft`.
- No `public.tools` write.
- No `discovered_tools` write.
- No schema changes.
- No migration changes.
- No type generation.
- No crawler execution.
- No extraction execution.
- No LLM execution or wiring.
- No automation wiring.
- No production behavior changes.

## Design Principle

The candidate decision UI should be conservative, explicit, and fail-closed.

Primary design principles:

1. Show state before action.
2. Separate review decisions from publishing decisions.
3. Keep `approve_for_draft` visibly blocked until a future explicit gate approves it.
4. Keep public publishing out of this UI controls phase.
5. Require confirmation for any future mutation-capable control.
6. Show audit context near actions.
7. Avoid destructive actions by default.
8. Avoid bulk actions until a separate future gate approves them.
9. Prefer disabled controls with explanatory copy over hidden risky controls.
10. Preserve the admin queue as review-first, not publishing-first.

## Proposed Placement

Future candidate decision controls should appear inside the Candidate Staging Queue admin detail drawer or equivalent detail panel, not as primary row-level quick actions.

Recommended placement:

```text
Candidate Staging Queue
  └── Candidate row
      └── View details
          └── Decision panel
              ├── Current decision state
              ├── Evidence summary
              ├── Safety warnings
              ├── Available safe decision actions
              ├── Blocked / locked sensitive actions
              └── Audit notes
```

Reason:

A detail drawer gives the operator more context before acting. Row-level quick actions are too easy to misclick for sensitive workflows.

## Decision Panel Layout

The future decision panel should include:

1. Candidate identity summary.
2. Current candidate status.
3. Current cleanup status.
4. Current decision action, if any.
5. Current decision reason, if any.
6. Audit correlation ID, if present.
7. Source evidence locator, if present.
8. Evidence summary.
9. Decision controls.
10. Blocked sensitive controls.
11. Confirmation modal trigger.
12. Recent audit/history summary, if available in a future phase.

## Candidate Identity Summary

The decision panel should show non-sensitive context before any controls:

- Candidate name.
- Candidate website/domain.
- Candidate category, if available.
- Candidate status.
- Cleanup status.
- Source evidence locator.
- Audit correlation ID.
- Created/updated timestamps, if available.

The UI should not expose service-role details, raw secrets, signed cursor internals, or backend-only debugging values.

## Proposed Decision Control Groups

Future controls should be grouped by risk.

### Group 1 — Review Classification Controls

These are decision-state controls that do not publish publicly.

Potential future controls:

- Mark as needs more evidence.
- Mark as duplicate candidate.
- Mark as not an AI tool.
- Mark as rejected.
- Mark as reviewed / no action.

These controls still require future backend/API readiness review and implementation approval before use.

### Group 2 — Draft Readiness Controls

These controls are sensitive and should remain blocked until a future explicit gate.

Potential future control:

- Approve for draft.

Phase 22C design decision:

```text
approve_for_draft must remain disabled / locked in the UI design until a future explicit approval gate authorizes its implementation and use.
```

### Group 3 — Public Publishing Controls

These controls are highest risk and should not be part of the candidate decision UI controls milestone.

Potential future control:

- Publish to public tools.

Phase 22C design decision:

```text
Public publishing must remain separate from candidate decision controls.
```

Publishing requires a separate future production-readiness gate.

### Group 4 — Cleanup Controls

Cleanup controls are sensitive and should not be default operator controls.

Potential future controls:

- Mark cleanup eligible.
- Archive cleanup row.
- Delete row.

Phase 22C design decision:

```text
Cleanup mutation controls should not appear in the normal decision UI by default.
```

Cleanup should remain behind separate explicit cleanup gates unless a future design phase approves an admin history/maintenance area.

## Initial Visible Action Design

Recommended initial future visible actions for design only:

1. Needs More Evidence
2. Reject Candidate
3. Mark Duplicate
4. Not an AI Tool
5. Save Internal Note

Recommended blocked/locked visible actions:

1. Approve for Draft
2. Publish Public Tool
3. Delete Candidate
4. Cleanup / Archive

Important:

These are UI design targets only. They do not mean the backend route or source code should be changed in Phase 22C.

## Button Copy

Recommended future button labels:

- `Needs More Evidence`
- `Reject Candidate`
- `Mark Duplicate`
- `Not an AI Tool`
- `Save Internal Note`

Blocked button labels:

- `Approve for Draft — Locked`
- `Publish Public Tool — Separate Gate Required`
- `Delete Candidate — Not Available`
- `Cleanup / Archive — Separate Cleanup Gate Required`

## Disabled / Blocked State Copy

### Approve for Draft Disabled Copy

```text
Approve for Draft is locked. This action requires a future approval gate and is not available in this phase.
```

### Public Publishing Disabled Copy

```text
Public publishing is separate from candidate decisions and requires a future production-readiness gate.
```

### Delete Candidate Disabled Copy

```text
Delete is not available. Candidate records should be preserved for auditability unless a future destructive-action gate approves otherwise.
```

### Cleanup Disabled Copy

```text
Cleanup actions are handled by separate cleanup gates and are not available in the normal decision UI.
```

## Confirmation Modal Design

Any future mutation-capable decision action should open a confirmation modal before execution.

The confirmation modal should include:

- Action name.
- Candidate name/domain.
- Current candidate status.
- New intended decision action.
- Decision reason field.
- Optional internal note field.
- Explicit warning that the action changes candidate decision state.
- Confirmation button.
- Cancel button.
- Loading state.
- Success state.
- Failure state.

## Confirmation Modal Copy

### Needs More Evidence Confirmation

Title:

```text
Mark candidate as Needs More Evidence?
```

Body:

```text
This will record that the candidate needs more evidence before any future approval or publishing step. It will not publish the tool.
```

Confirm button:

```text
Confirm Needs More Evidence
```

### Reject Candidate Confirmation

Title:

```text
Reject this candidate?
```

Body:

```text
This will record a rejection decision for this candidate. It will not delete the row and will not change public tools.
```

Confirm button:

```text
Confirm Rejection
```

### Mark Duplicate Confirmation

Title:

```text
Mark candidate as duplicate?
```

Body:

```text
This will record that the candidate appears to duplicate an existing candidate or tool. It will not publish, delete, or merge records.
```

Confirm button:

```text
Confirm Duplicate
```

### Not an AI Tool Confirmation

Title:

```text
Mark candidate as Not an AI Tool?
```

Body:

```text
This will record that the submitted item does not appear to qualify as an AI tool. It will not publish or delete the row.
```

Confirm button:

```text
Confirm Not an AI Tool
```

## Required Fields Before Future Mutation

Future mutation-capable controls should require:

- selected action,
- decision reason,
- confirmation checkbox or confirmation click,
- audit correlation ID generated server-side or passed through safely,
- no public publishing side effect,
- no `approve_for_draft` side effect unless separately authorized,
- no cleanup side effect unless separately authorized.

## Status Badge Design

Recommended status badges:

- `Staged`
- `Needs More Evidence`
- `Rejected`
- `Duplicate`
- `Not an AI Tool`
- `Approved for Draft — Locked`
- `Cleanup Archived`
- `Published — Separate Workflow`

Blocked or sensitive badges should use clear copy. They should not imply that an action is available if it is not implemented.

## Audit and Evidence Display

The UI should show audit context near decision controls, but only safe values.

Safe to show:

- candidate ID,
- candidate status,
- cleanup status,
- decision action,
- decision reason,
- decision notes,
- audit correlation ID,
- source evidence locator,
- created/updated timestamps.

Do not show:

- service-role keys,
- Supabase secrets,
- raw signed cursor internals,
- internal token secrets,
- hidden admin credentials,
- private environment values.

## Public Publishing Separation

Phase 22C design decision:

```text
Candidate decision controls must not publish to public.tools.
```

Publishing should remain a separate future workflow with its own:

- design gate,
- implementation plan,
- security review,
- QA plan,
- production-readiness gate,
- explicit James approval.

## approve_for_draft Separation

Phase 22C design decision:

```text
approve_for_draft remains blocked.
```

A future `approve_for_draft` workflow must have its own:

- readiness gate,
- copy review,
- confirmation modal,
- backend route review,
- test plan,
- live smoke gate,
- Gemini review,
- explicit James approval.

## Queue Visibility Design Notes

The active Candidate Staging Queue should avoid confusing archived cleanup rows with active review work.

Future design questions for implementation planning:

1. Should archived cleanup rows be hidden by default?
2. Should there be a read-only audit/history tab?
3. Should cleanup archived rows show a badge but no action buttons?
4. Should decision history be searchable?
5. Should source evidence markers be visible in normal admin UI or only in expanded technical details?

Phase 22C does not answer these with implementation. It records them for the next planning gates.

## Responsive Design Expectations

Future UI controls should be usable on:

- Desktop: 1440px wide and above.
- Tablet/iPad: 768px to 1024px portrait and landscape.
- Mobile: 390px wide baseline.

Responsive expectations:

- No horizontal overflow.
- Confirmation modal remains readable.
- Buttons stack safely on mobile.
- Risk warnings remain visible before confirmation.
- Blocked/locked controls do not crowd active controls.
- Detail drawer remains scrollable.

## Accessibility Expectations

Future implementation should account for:

- keyboard navigation,
- visible focus states,
- screen-reader labels,
- modal focus trap,
- escape/cancel behavior,
- clear disabled-state explanation,
- non-color-only status indicators,
- sufficient contrast for badges and warnings.

## Browser QA Expectations

Future implementation phases should test:

1. Decision panel renders.
2. Active controls are visible only when safe.
3. Blocked controls show correct disabled copy.
4. Confirmation modal opens and closes.
5. Cancel performs no mutation.
6. Confirm performs exactly the intended future request.
7. No public publishing request is sent.
8. No `approve_for_draft` request is sent unless separately authorized.
9. No cleanup request is sent from normal decision UI.
10. No service-role or cursor secrets are exposed.
11. Desktop, tablet/iPad, and mobile all pass.
12. Detail drawer remains usable after decision interactions.

## Security Expectations

Future implementation should preserve:

- admin-only access,
- server-side authorization,
- route-level validation,
- exact action allowlists,
- no client-controlled privileged fields,
- no public write side effects,
- no service-role exposure,
- audit logging,
- rate limits where appropriate,
- explicit error handling,
- safe failure behavior.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22D — Candidate Decision UI Controls Implementation Plan
```

Recommended scope:

- Documentation only.
- Implementation plan only.
- No implementation.
- Map this design to exact files/components only after inspection.
- Define future component boundaries.
- Define future API contract expectations.
- Define future QA checklist.
- Define implementation safety boundaries.

## Proposed Phase 22D Forbidden Scope

Phase 22D should not include:

- source changes,
- UI implementation,
- API changes,
- helper changes,
- test changes,
- package changes,
- schema/migration/typegen changes,
- DB mutations,
- live smoke,
- cleanup execution,
- public publishing,
- `approve_for_draft`,
- crawler/extraction/LLM/automation wiring.

## Phase 22C Completion Criteria

Phase 22C is complete when:

1. This UI controls design gate is reviewed.
2. Gemini approves it as accurate and safe.
3. James approves the local docs-only commit.
4. The Phase 22C document is committed.
5. James approves the push.
6. The Phase 22C commit is pushed to `origin/main`.
7. Final repo status is clean and synced.

## Phase 22C Boundary Statement

Phase 22C is docs-only and design-only.

It does not execute, enable, or authorize any database mutation, cleanup execution, candidate decision operation, public publishing, `approve_for_draft`, schema/migration/typegen operation, source/UI behavior change, API/helper/test/package change, crawler/extraction/LLM operation, or automation wiring.

It only designs future admin UI decision controls and recommends Phase 22D as a documentation-first implementation planning gate.
