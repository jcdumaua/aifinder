# Discovery Phase 19Z — Candidate Decision Admin UI Post-Implementation Review

## Status

Complete for documentation review.

Phase 19Z documents the post-implementation review for the Candidate Decision Admin UI delivered in Phase 19Y.

Baseline reviewed:

```text
34dc3f8 Add candidate decision admin UI
```

Phase 19Y was Gemini-approved, committed, and pushed to `main`.

## Reviewed Phase 19Y implementation files

Phase 19Y changed exactly these implementation and test files:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Phase 19Z does not change those files. It only records this post-implementation review.

## Implementation summary

Phase 19Y added the first bounded admin UI integration for candidate staging decisions.

The implemented UI adds:

- a staged-only `Review decision` entry point in the candidate staging queue panel;
- a dedicated `CandidateStagingQueueDecisionDialog` client component;
- a CSRF initialization request to `GET /api/admin/csrf`;
- a guarded decision mutation request to `POST /api/admin/discovery/candidate-staging-queue/[candidateId]/decision`;
- the `x-csrf-token` request header;
- `credentials: "same-origin"`;
- `cache: "no-store"`;
- safe action choices for `approve_for_draft`, `reject`, `duplicate`, `needs_more_evidence`, and `archive`;
- reason and notes validation copy;
- `duplicate_of_candidate_id` support only for the `duplicate` action;
- `request_correlation_id` generation with the `candidate-decision-ui:` prefix;
- safe error display for expected API/RPC failures;
- successful queue reset/reload after an applied decision.

## Staged-only decision control review

The active mutation entry point is intentionally available only when:

```text
candidate.candidateStatus === "staged"
```

For other currently visible active statuses, the panel shows:

```text
Decision unavailable for this status.
```

This preserves the conservative Phase 19X decision to avoid widening mutation eligibility to `needs_review` or `duplicate_suspected` before a later state-alignment design.

## Dialog review

`CandidateStagingQueueDecisionDialog` keeps mutation orchestration in a dedicated client component instead of spreading mutation behavior through the queue panel.

The dialog uses a deliberate two-step admin request pattern:

1. Fetch CSRF token from `GET /api/admin/csrf`.
2. Submit the selected decision to `POST /api/admin/discovery/candidate-staging-queue/[candidateId]/decision`.

The dialog includes differentiated loading copy:

```text
Initializing decision...
Applying decision...
```

This addresses the Phase 19Y Gemini tip to keep admin feedback clear during the CSRF-then-POST sequence.

## Safety boundary review

The implementation preserves these boundaries:

```text
Approve for draft is not publish.
Archive is not delete.
Reject is not delete.
Duplicate targets candidate rows, not public tool rows.
```

The browser UI does not send or expose client-supplied admin identity fields:

```text
admin_user_id
adminUserId
decided_by
decidedBy
actor_label
actorLabel
```

The browser UI does not send duplicate-to-tool fields:

```text
duplicate_of_tool_id
duplicateOfToolId
```

The browser UI does not import or reference server-side Supabase/service-role clients:

```text
supabaseAdmin
SERVICE_ROLE
createClient(
```

The browser UI does not call direct database mutation helpers:

```text
.insert(
.update(
.upsert(
.delete(
.rpc(
```

The queue panel remains free of HTTP mutation methods. The decision `POST` is isolated to `CandidateStagingQueueDecisionDialog`.

## Error handling review

The dialog displays safe user-facing messages and safe error codes for expected decision failures.

Reviewed important safe error cases include:

```text
invalid_reason
invalid_notes
invalid_duplicate_target
decision_conflict
candidate_decision_rpc_failed
forbidden
```

The UI avoids exposing internal details beyond safe error codes.

## Cursor and refresh review

Phase 19Y needed to reload the queue after a successful decision. The queue panel now supports a safe first-page reload path through a cursor override pattern:

```text
cursorOverride === undefined ? currentCursor : cursorOverride
```

This allows the decision-success flow to call:

```text
await loadQueue(true)
```

and refresh the first page after resetting pagination without rendering or exposing raw cursor values.

## Lint correction review

The first implementation attempt used synchronous state resets inside a `useEffect`. `npm run check` correctly flagged this through:

```text
react-hooks/set-state-in-effect
```

The final implementation defers dialog reset state updates with:

```text
const timeoutId = window.setTimeout(() => {
  ...
}, 0);

return () => window.clearTimeout(timeoutId);
```

The final verification passed after this correction.

## Static test review

Phase 19Y added:

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
```

The new test verifies the decision dialog exists, remains a client component, uses the expected admin API paths, sends CSRF-protected `POST` requests, includes all approved actions, excludes forbidden fields, excludes direct Supabase/service-role access, excludes direct table/RPC mutation calls, excludes unsafe workflow labels, and verifies staged-only queue panel gating.

Phase 19Y also updated:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

The existing queue test now accepts the approved `Review decision` UI while preserving unsafe workflow and mutation guards. It also verifies the new safe cursor override pattern.

## Accessibility and responsive review

Phase 19Y uses the existing shadcn Dialog primitives, including `DialogTitle` and `DialogDescription`, which gives the decision modal an accessible dialog structure.

Responsive behavior is structurally supported by:

- queue row actions using flex-wrap layouts;
- dialog content constrained with `max-h-[calc(100vh-2rem)]` and `overflow-y-auto`;
- dialog width capped with `sm:max-w-2xl`;
- form controls using full-width mobile-first layouts;
- dialog footer switching from stacked mobile layout to horizontal desktop layout.

Manual browser QA was not performed in Phase 19Y or Phase 19Z. Recommended manual QA for a future visual verification phase:

```text
Desktop result: verify staged rows show Review decision and dialog form is readable.
Tablet/iPad result: verify dialog scrolls cleanly and footer buttons remain reachable.
Mobile result: verify stacked controls, long candidate names, and duplicate UUID input remain usable.
```

## Verification completed

Phase 19Y final verification passed before commit:

```text
node testing/discovery-candidate-decision-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-decision-api-static-assertions.mjs
npm run check
git diff --check
```

Phase 19Z reruns the same safe verification commands after writing this review document.

## Explicitly not performed

Phase 19Z did not and must not perform:

```text
No live API smoke
No HTTP mutation request
No supabase db push
No schema apply
No migration apply
No type generation
No DB mutation
No candidate row mutation
No audit row mutation
No source row mutation
No run row mutation
No public.tools write
No discovered_tools write
No UI implementation change
No API route change
No helper change
No validation change
No database change
No package change
```

## Post-implementation conclusion

Phase 19Y successfully delivered the first bounded Candidate Decision Admin UI integration.

The implementation is intentionally conservative:

- only `staged` candidates can open the active decision dialog;
- approve remains draft-only and does not publish;
- archive/reject do not delete;
- duplicate targets candidate rows only;
- mutation identity remains server-derived;
- browser-side direct database mutation remains blocked by static tests.

Phase 19Z records the implementation as ready to archive after review and approval.

## Recommended next phase

After Phase 19Z is reviewed, committed, and pushed, the recommended next phase is:

```text
Phase 20A — Candidate Decision Admin UI Manual QA Gate
```

This next phase should be review-only and should focus on manual browser verification of the admin flow across desktop, tablet/iPad, and mobile layouts before any live mutation smoke is considered.
