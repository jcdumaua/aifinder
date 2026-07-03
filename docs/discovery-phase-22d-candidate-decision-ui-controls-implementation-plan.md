# Discovery Phase 22D — Candidate Decision UI Controls Implementation Plan

## Status

Drafted for review.

Phase 22D is a documentation-only implementation planning phase.

It maps the future implementation of candidate decision UI controls before any source, UI, API, helper, test, package, schema, migration, or type generation changes are made.

## Phase 22D Purpose

Phase 22D converts the Phase 22C UI controls design into an implementation plan.

This phase does not implement anything.

It defines:

1. likely future implementation files,
2. component boundaries,
3. API contract expectations,
4. disabled and blocked-state requirements,
5. confirmation modal behavior,
6. QA checklist,
7. security boundaries,
8. rollout gates before any implementation starts.

## Starting Context

Phase 22D follows the pushed UI controls design gate:

- Previous phase: Phase 22C — Candidate Decision UI Controls Design Gate
- Previous commit: `ad8ca43`
- Previous commit message: `Document candidate decision UI controls design gate`
- Previous final status: `## main...origin/main`

Phase 22C recommended:

```text
Phase 22D — Candidate Decision UI Controls Implementation Plan
```

as the next documentation-first step.

## Phase 22D Scope

Allowed in Phase 22D:

- Read-only inspection.
- Documentation only.
- Implementation planning only.
- Component boundary design.
- API contract expectation design.
- QA checklist design.
- Gemini review package preparation.
- Commit and push only after James explicitly approves.

Not allowed in Phase 22D:

- No source changes.
- No UI implementation.
- No API changes.
- No helper changes.
- No test changes.
- No package changes.
- No schema changes.
- No migration changes.
- No type generation.
- No database mutation.
- No cleanup execution.
- No candidate decision execution.
- No candidate promotion.
- No candidate rejection.
- No public publishing.
- No `approve_for_draft`.
- No `public.tools` write.
- No `discovered_tools` write.
- No crawler execution.
- No extraction execution.
- No LLM execution or wiring.
- No automation wiring.
- No production behavior changes.

## Read-Only Inspection Summary

Phase 22D performs read-only inspection before writing this plan.

The inspection is limited to:

- current Git status,
- recent documentation files,
- candidate staging / decision related source paths,
- existing candidate staging queue text matches,
- existing candidate decision field usage,
- existing package scripts.

No source file is modified by the inspection.

## Derived Future Implementation Targets

The following targets were derived by read-only inspection and should be treated as planning inputs, not implementation approval.

### Likely UI / Component Targets

```text
app/admin/discovery/page.tsx
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
```

### Likely API / Helper Targets

```text
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
lib/discovery-candidate-normalizer.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-decision-validation.ts
lib/discovery/discovery-candidate-extraction-invocation.ts
lib/discovery/discovery-candidate-extraction-mapper.ts
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts
lib/discovery/discovery-candidate-preview-live-staging-resolver.ts
lib/discovery/discovery-candidate-preview-provider.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

### Likely Test / QA Targets

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-extraction-mapper.test.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-normalizer.test.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
```

These file targets must be re-verified in the actual implementation phase before any code changes.

## Future Implementation Goal

The future implementation should add candidate decision controls to the admin Candidate Staging Queue detail experience.

The implementation should not add risky row-level quick actions.

The future implementation should keep the operator workflow:

```text
Candidate Staging Queue
  -> View details
  -> Review evidence
  -> Read current state
  -> Choose safe classification action
  -> Confirm in modal
  -> Execute exactly one intended decision request
  -> Show updated state / audit feedback
```

## Recommended Future Component Boundaries

A future implementation should prefer small component boundaries.

Recommended future UI components:

1. `CandidateDecisionPanel`
   - Renders decision state, warnings, action groups, and blocked controls.
   - Receives candidate data from the parent detail drawer.
   - Does not directly publish or approve for draft.

2. `CandidateDecisionActionGroup`
   - Renders safe classification buttons.
   - Separates active actions from locked actions.
   - Does not decide API contract internally.

3. `CandidateDecisionBlockedActions`
   - Renders locked `approve_for_draft`, public publishing, delete, and cleanup controls.
   - Shows explanatory disabled copy.

4. `CandidateDecisionConfirmDialog`
   - Shows confirmation modal for future mutation-capable actions.
   - Requires decision reason before confirming.
   - Supports loading, success, and failure states.

5. `CandidateDecisionStatusBadges`
   - Shows candidate status, cleanup status, decision action, and blocked sensitive statuses.

6. `CandidateDecisionAuditSummary`
   - Shows safe audit values such as candidate ID, audit correlation ID, source evidence locator, and timestamps.

These names are planning names. The actual implementation phase may adjust names after inspecting existing component conventions.

## Future API Contract Expectations

A future API contract should be narrow and allowlisted.

Expected future request shape:

```ts
type CandidateDecisionUiAction =
  | "needs_more_evidence"
  | "reject_candidate"
  | "mark_duplicate"
  | "not_ai_tool"
  | "save_internal_note";

type CandidateDecisionRequest = {
  candidateId: string;
  action: CandidateDecisionUiAction;
  decisionReason: string;
  decisionNotes?: string;
};
```

Expected future response shape:

```ts
type CandidateDecisionResponse = {
  ok: true;
  candidate: {
    id: string;
    candidate_status: string;
    cleanup_status: string | null;
    decision_action: string | null;
    decision_reason: string | null;
    decision_notes: string | null;
    audit_correlation_id: string | null;
    source_evidence_locator: string | null;
    updated_at: string;
  };
} | {
  ok: false;
  error: string;
};
```

This contract is a design target only. It does not authorize route implementation in Phase 22D.

## Explicitly Blocked API Behaviors

A future decision API must not perform these side effects:

- no public publishing,
- no `approve_for_draft`,
- no public `tools` write,
- no `discovered_tools` write,
- no cleanup mutation,
- no delete,
- no merge,
- no crawler execution,
- no extraction execution,
- no LLM execution,
- no automation wiring.

## Future Action Allowlist

Future active classification actions should be limited to:

```text
needs_more_evidence
reject_candidate
mark_duplicate
not_ai_tool
save_internal_note
```

Future locked actions should remain visible but disabled:

```text
approve_for_draft
publish_public_tool
delete_candidate
cleanup_archive
```

The locked actions must not send network requests.

## Future UI Behavior Requirements

The future UI implementation should:

1. Render decision controls only inside the details experience.
2. Show current candidate status and cleanup status before controls.
3. Show safe audit context near controls.
4. Keep `approve_for_draft` disabled.
5. Keep public publishing disabled and separated.
6. Keep cleanup/archive disabled in the normal decision UI.
7. Require confirmation modal before any mutation-capable classification action.
8. Require decision reason for mutation-capable actions.
9. Show loading state during request.
10. Show success state after exactly one intended action.
11. Show failure state without mutating UI optimistically unless response confirms success.
12. Preserve detail drawer state safely.

## Future Confirmation Modal Requirements

Each active classification action should use the confirmation modal pattern from Phase 22C.

The modal must include:

- action title,
- candidate identity,
- current state,
- target action,
- decision reason field,
- optional note field,
- explicit non-publishing statement,
- cancel button,
- confirm button,
- loading state,
- error state.

Confirm should be disabled until required fields are valid.

Cancel must perform no request.

## Future Disabled Copy Requirements

Locked controls should show copy from Phase 22C:

- `Approve for Draft is locked. This action requires a future approval gate and is not available in this phase.`
- `Public publishing is separate from candidate decisions and requires a future production-readiness gate.`
- `Delete is not available. Candidate records should be preserved for auditability unless a future destructive-action gate approves otherwise.`
- `Cleanup actions are handled by separate cleanup gates and are not available in the normal decision UI.`

## Future Network Safety Requirements

The browser implementation must not send requests for:

- public publishing,
- `approve_for_draft`,
- cleanup/archive,
- delete,
- public `tools` writes,
- `discovered_tools` writes,
- crawler execution,
- extraction execution.

Allowed future request, if implemented in a later phase, should be exactly one candidate decision classification endpoint.

The exact endpoint must be selected only after route inspection in the future implementation plan execution phase.

## Future QA Checklist

Future implementation phases should include browser QA for:

### Desktop

- 1440px wide baseline.
- Decision panel renders in detail drawer.
- Active classification controls visible.
- Locked controls disabled and explained.
- Confirmation modal opens and closes.
- Cancel sends no request.
- Confirm sends exactly one allowed request.
- No public publishing request.
- No `approve_for_draft` request.
- No cleanup/delete request.
- No horizontal overflow.

### Tablet / iPad

- 768px to 1024px portrait and landscape.
- Detail drawer remains readable.
- Buttons wrap or stack safely.
- Confirmation modal remains usable.
- Disabled copy remains visible.

### Mobile

- 390px wide baseline.
- Decision panel scrolls safely.
- Buttons stack vertically.
- Warnings remain visible.
- Modal remains readable.
- No horizontal overflow.

### Network and Console

- No service-role exposure.
- No raw signed cursor internals.
- No secret environment values.
- No fatal console errors.
- No unauthorized requests.
- No public write requests.

## Future Accessibility Checklist

Future implementation should verify:

- keyboard navigation,
- focus states,
- modal focus trap,
- escape key behavior,
- screen-reader labels,
- disabled-state explanation,
- non-color-only status badges,
- contrast for warnings and badges,
- form labels for decision reason and notes,
- error messages announced clearly.

## Future Security Checklist

Future implementation should verify:

- admin-only access,
- server-side authorization,
- exact action allowlist,
- no client-controlled privileged fields,
- request validation,
- rate limiting,
- audit logging,
- no service-role exposure,
- no public write side effect,
- no `approve_for_draft` side effect,
- no cleanup side effect,
- safe error handling,
- safe failure behavior.

## Recommended Future Phase Sequence

Recommended next phase:

```text
Phase 22E — Candidate Decision UI Controls Implementation
```

But Phase 22E should only start after Phase 22D is reviewed, committed, and pushed.

Phase 22E should be tightly bounded:

- implement only the UI controls approved by Phase 22C/22D,
- no public publishing,
- no `approve_for_draft`,
- no cleanup/archive/delete,
- no schema/migration/typegen,
- no DB mutation unless the future phase explicitly approves a specific candidate decision API call path,
- no live smoke unless a separate live smoke gate approves it.

## Implementation Risk Notes

Risks to avoid:

1. Accidentally enabling `approve_for_draft`.
2. Mixing public publishing into decision controls.
3. Adding row-level quick actions.
4. Triggering cleanup/archive from normal decision UI.
5. Sending unallowlisted action values.
6. Exposing cursor internals or service-role details.
7. Optimistically showing success before server confirmation.
8. Creating source changes before implementation approval.
9. Expanding scope into schema/API/helper changes without separate gate.
10. Skipping desktop/tablet/mobile QA.

## Phase 22D Completion Criteria

Phase 22D is complete when:

1. Read-only inspection is reviewed.
2. This implementation plan is reviewed.
3. Gemini approves it as accurate and safe.
4. James approves the local docs-only commit.
5. The Phase 22D document is committed.
6. James approves the push.
7. The Phase 22D commit is pushed to `origin/main`.
8. Final repo status is clean and synced.

## Phase 22D Boundary Statement

Phase 22D is docs-only and planning-only.

It does not execute, enable, or authorize any database mutation, cleanup execution, candidate decision operation, public publishing, `approve_for_draft`, schema/migration/typegen operation, source/UI behavior change, API/helper/test/package change, crawler/extraction/LLM operation, automation wiring, or production behavior change.

It only maps a future implementation plan and recommends Phase 22E as a separate, explicitly approved implementation phase.
