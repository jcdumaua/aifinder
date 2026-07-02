# Discovery Phase 20A — Candidate Decision Admin UI Manual QA Gate

## Status

Complete for manual QA gate documentation.

Phase 20A defines the manual browser QA gate for the Candidate Decision Admin UI delivered in Phase 19Y and reviewed in Phase 19Z.

Baseline:

```text
4784663 Document candidate decision UI post-implementation review
```

## Purpose

This phase does not execute live mutation QA.

It documents the exact manual QA checklist that must be completed before any future live decision-smoke or broader candidate decision rollout.

The gate exists to verify the admin experience across:

```text
Desktop
Tablet/iPad
Mobile
```

## Source phases linked by this gate

The Candidate Decision Admin UI track now includes:

```text
Phase 19W — Candidate Decision Admin UI Design
Phase 19X — Candidate Decision Admin UI Implementation Plan
Phase 19Y — Candidate Decision Admin UI Implementation
Phase 19Z — Candidate Decision Admin UI Post-Implementation Review
Phase 20A — Candidate Decision Admin UI Manual QA Gate
```

## Files under QA scope

Manual QA is focused on the admin discovery candidate staging queue UI:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
```

The static guard files remain in scope for automated regression protection:

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
```

## What manual QA must verify

Manual QA must verify that the queue and decision dialog are usable without widening project safety boundaries.

Required checks:

- the candidate staging queue loads in the admin Discovery view;
- staged rows show the `Review decision` action;
- non-staged active rows show `Decision unavailable for this status.`;
- the `Review decision` dialog opens only from staged rows;
- the dialog shows `Review candidate decision`;
- the dialog explains that approve for draft does not publish;
- all approved actions are visible: `approve_for_draft`, `reject`, `duplicate`, `needs_more_evidence`, and `archive`;
- reason validation copy remains visible;
- notes validation copy remains visible;
- duplicate action reveals only a duplicate candidate ID field;
- no duplicate-to-tool field is exposed;
- no client-supplied admin identity field is exposed;
- loading copy can distinguish `Initializing decision...` from `Applying decision...`;
- error space is visible and readable;
- success copy is visible and readable;
- queue pagination and refresh controls remain usable after the UI change;
- the existing read-only detail drawer remains usable.

## Manual QA matrix

### Desktop result

Status: pending manual execution.

Minimum viewport:

```text
1440 × 900
```

Required desktop checks:

- admin Discovery page loads without horizontal overflow;
- candidate row actions fit cleanly with `Open website`, `Open source`, `View details`, and `Review decision`;
- dialog is centered and does not exceed viewport height;
- dialog content scrolls when needed;
- footer buttons are visible and reachable;
- long candidate names, long source domains, and long candidate IDs do not break the layout.

### Tablet/iPad result

Status: pending manual execution.

Minimum viewport set:

```text
768 × 1024 portrait
1024 × 768 landscape
```

Required tablet/iPad checks:

- queue filters remain usable;
- row actions wrap cleanly;
- dialog width and scroll behavior remain usable;
- duplicate candidate ID input is readable;
- cancel and submit buttons remain reachable;
- no raw cursor value is rendered.

### Mobile result

Status: pending manual execution.

Minimum viewport:

```text
390 × 844
```

Required mobile checks:

- queue cards stack cleanly;
- row actions wrap without clipping;
- dialog uses available width safely;
- form fields remain full-width and readable;
- dialog footer buttons stack cleanly;
- long IDs wrap or scroll safely without causing page-wide horizontal overflow;
- status unavailable copy remains readable.

## Accessibility checks

Manual QA should verify:

- dialog opens with a visible title;
- dialog includes descriptive copy;
- keyboard users can reach action select, reason field, notes field, duplicate field, cancel, and submit;
- keyboard users can close the dialog;
- disabled/loading states are visually clear;
- alert text for errors is visible;
- success message is announced or visible through the existing `aria-live` region.

## Safety boundaries to re-check manually

Manual QA must confirm the UI still communicates and preserves these boundaries:

```text
Approve for draft is not publish
Archive is not delete
Reject is not delete
Duplicate targets candidate rows only
```

The UI must not display or request:

```text
duplicate_of_tool_id
duplicateOfToolId
admin_user_id
adminUserId
decided_by
decidedBy
actor_label
actorLabel
Publish
Promote
Delete
```

## Network safety boundary for this gate

Phase 20A must not click a final submit action that sends the decision `POST`.

The future manual QA execution may inspect the dialog visually, but any live mutation execution requires a separate approved phase and explicit live approval phrase.

Forbidden in Phase 20A:

```text
No live API smoke
No HTTP mutation request
No decision POST
No candidate decision submission
No DB mutation
No supabase db push
No schema apply
No migration apply
No type generation
No public.tools write
No discovered_tools write
```

## Allowed verification in Phase 20A

Phase 20A may safely run:

```text
node testing/discovery-candidate-decision-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-decision-api-static-assertions.mjs
npm run check
git diff --check
```

Phase 20A may safely document manual QA expectations.

Phase 20A may not execute live mutation behavior.

## Exit criteria for future manual QA execution

The Candidate Decision Admin UI manual QA gate should be considered ready for execution only when an admin reviewer can complete the Desktop, Tablet/iPad, and Mobile sections without:

- layout breakage;
- inaccessible dialog controls;
- unsafe labels;
- visible forbidden fields;
- accidental decision submission;
- direct browser-side database mutation logic.

## Phase 20A conclusion

Phase 20A establishes the required manual browser QA gate but does not execute it.

The Candidate Decision Admin UI remains implementation-complete, review-documented, and ready for a future manually observed QA execution phase.

## Recommended next phase

After Phase 20A is reviewed, committed, and pushed, the recommended next phase is:

```text
Phase 20B — Candidate Decision Admin UI Manual QA Execution
```

Phase 20B should be a no-mutation browser QA execution phase unless a separate live mutation approval phrase is explicitly provided.
