# Discovery Phase 19W — Candidate Decision Admin UI Design

## Status

Phase 19W is a design-only phase for future Candidate Decision Admin UI controls.

This phase does not implement UI, does not create components, does not modify existing components, does not change API routes, does not run the live API smoke, does not send HTTP mutation requests, does not run `supabase db push`, does not run schema apply, does not run migration apply, does not run type generation, does not mutate candidate rows, does not write to `public.tools`, does not write to `discovered_tools`, and does not publish anything.

## Current Baseline

Baseline commit before this design:

```text
bc5848d Document candidate decision API live smoke result
```

The Candidate Decision Mutation API is already implemented and live-smoke verified.

Latest documented result:

```text
Phase 19V — Candidate Decision Mutation API Live Smoke Result
```

The successful live smoke marker was:

```text
phase-19u-candidate-decision-api-smoke:1f568c57
```

## Existing Admin UI Anchors

The current admin discovery page already renders `CandidateStagingQueuePanel`, the candidate staging queue panel:

```text
app/admin/discovery/page.tsx
```

Existing queue panel:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Existing read-only detail drawer:

```text
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

Existing read-only queue test:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

The current queue panel is intentionally read-only and fetches:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The current detail drawer is also read-only.

Phase 19W designs how to add decision controls later without weakening those earlier boundaries.

## Existing Mutation API Anchors

The future UI should call the already implemented admin API route:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Route file:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
```

Validation file:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

CSRF route:

```text
app/api/admin/csrf/route.ts
```

Static API assertion file:

```text
testing/discovery-candidate-decision-api-static-assertions.mjs
```

## Design Objective

Design a safe admin-only UI workflow that lets an authenticated admin apply a candidate decision from the candidate staging queue.

The UI should support the already approved decision mutation actions:

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

The UI must keep these boundaries clear:

```text
approve_for_draft is not publish
no public.tools write
no discovered_tools write
no publish workflow
no promotion workflow
no delete action
no direct browser Supabase access
no client-supplied admin identity
```

## Recommended Future Phase

Recommended next phase:

```text
Phase 19X — Candidate Decision Admin UI Implementation Plan
```

Phase 19X should map this design to exact future implementation files, component changes, test changes, and verification commands.

Phase 19W itself should be committed only after Gemini approval.

## Recommended UI Entry Point

Preferred entry point:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

The existing queue panel should remain the main list surface.

Preferred future behavior:

```text
Add a single non-publishing "Review decision" entry control per eligible candidate row.
Opening that control should launch a dedicated decision dialog.
Submitting the dialog should POST to the candidate decision API route.
After a successful decision, refresh the queue.
```

Recommended copy for row action:

```text
Review decision
```

Avoid row buttons labelled only:

```text
Approve
Reject
Archive
Publish
Promote
Delete
```

The row action should not look like one-click mutation. It should open a deliberate review dialog.

## Recommended Future Component Shape

Preferred new component:

```text
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
```

Recommended possible supporting utility file only if needed:

```text
components/admin/discovery/candidate-staging-queue-decision-utils.ts
```

Recommended future test:

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
```

Recommended files likely to change in the later implementation phase:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Optional file only if the decision dialog needs to be available from the drawer too:

```text
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

## Files Not To Change In The First UI Implementation

The first candidate decision UI implementation should not change:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-decision-validation.ts
supabase/migrations/*
lib/supabase/database.types.ts
package.json
package-lock.json
```

Exception:

```text
testing files may be added or updated without package changes.
```

Do not add dependencies unless explicitly approved later.

## Candidate Eligibility Design

The UI must avoid treating all queue rows as automatically decisionable.

Current route/RPC conflict behavior may reject already-decisioned or unsupported statuses with:

```text
decision_conflict
```

Initial safe UI rule:

```text
Render "Review decision" only for statuses explicitly approved as decisionable in Phase 19X.
For any status not yet confirmed as decisionable, render safe text:
Decision unavailable for this status.
```

Phase 19X must resolve the status vocabulary before implementation because the existing read-only queue UI has active queue statuses and the mutation RPC has its own allowed decisionable statuses.

Status compatibility decision to make in Phase 19X:

```text
Which queue statuses should show active decision controls?
Should initial UI allow only staged?
Should needs_review map to under_review, or should it remain non-decisionable until a backend alignment phase?
Should duplicate_suspected remain read-only until duplicate target selection is more mature?
Should needs_more_evidence be added to the queue view after it becomes a post-decision status?
```

Until that is resolved, the safest initial recommendation is:

```text
Enable decision controls only for staged rows.
Show safe disabled/read-only explanation for other rows.
```

## Decision Dialog Layout

The future dialog should be deliberate and admin-focused.

Recommended title:

```text
Review candidate decision
```

Recommended description:

```text
Apply a staging decision. Approve for draft does not publish or write to public tools.
```

Recommended candidate summary at top:

```text
Candidate name
Candidate website hostname
Current candidate status
Category hint
Confidence bucket
Duplicate check status
Source domain
```

Required form controls:

```text
Decision action select
Decision reason textarea or input
Optional decision notes textarea
Duplicate candidate ID input shown only for duplicate action
Submit decision button
Cancel button
```

Decision action labels:

```text
Approve for draft
Reject
Mark as duplicate
Needs more evidence
Archive candidate
```

The label "Approve for draft" must always include "for draft".

Do not use "Approve" alone.

Do not use "Publish".

## Decision Form Validation Design

Client-side validation should mirror server validation, but server validation remains authoritative.

Reason:

```text
required
trimmed
3-200 characters
```

Notes:

```text
optional
trimmed
1000 characters maximum
```

Duplicate candidate ID:

```text
required only when action = duplicate
must be UUID format
must not equal the current candidate ID
must be sent as duplicate_of_candidate_id
```

Unsupported duplicate tool target:

```text
do not render duplicate_of_tool_id
do not send duplicate_of_tool_id
```

Admin identity:

```text
do not render actor_label
do not send actor_label
do not send actorLabel
do not send admin_user_id
do not send adminUserId
do not send decided_by
do not send decidedBy
```

Request correlation:

```text
UI may generate a request_correlation_id internally for support/debugging.
UI may omit request_correlation_id if implementation wants a smaller first pass.
If generated, it must not contain sensitive data.
```

## CSRF And Fetch Design

Future UI submit flow:

```text
GET /api/admin/csrf
Read csrfToken from safe JSON response
POST /api/admin/discovery/candidate-staging-queue/[candidateId]/decision
Set x-csrf-token header
Use content-type application/json
Use credentials same-origin
Use cache no-store
```

Recommended POST body shape:

```json
{
  "action": "approve_for_draft",
  "reason": "Clear evidence and valid tool homepage.",
  "notes": "Optional admin note.",
  "request_correlation_id": "candidate-decision-ui:<uuid>"
}
```

Duplicate POST body shape:

```json
{
  "action": "duplicate",
  "reason": "Candidate duplicates an existing staged candidate.",
  "duplicate_of_candidate_id": "<uuid>",
  "notes": "Optional admin note.",
  "request_correlation_id": "candidate-decision-ui:<uuid>"
}
```

Do not include:

```text
duplicate_of_tool_id
actor_label
actorLabel
admin_user_id
adminUserId
decided_by
decidedBy
```

## Success Behavior

On HTTP 200 and `ok: true`:

```text
Show success message.
Close dialog or reset to success state.
Refresh the queue using the existing GET route.
Clear selected decision form state.
Clear selected candidate if the candidate leaves the active queue.
```

Recommended success copy:

```text
Candidate decision applied.
```

Do not optimistically publish, promote, or insert public tool rows.

## Error Behavior

The UI should display safe error codes/messages only.

Expected safe errors:

```text
unauthorized
forbidden
invalid_request_body
invalid_candidate_id
unsupported_request_field
client_admin_identity_not_allowed
ambiguous_request_field
invalid_action
invalid_reason
invalid_notes
invalid_duplicate_target
duplicate_tool_target_not_supported
invalid_request_correlation_id
candidate_not_found
decision_conflict
candidate_decision_rpc_failed
```

Recommended user-facing copy for common cases:

```text
forbidden: Security token missing or expired. Please refresh and try again.
invalid_reason: Decision reason must be 3-200 characters.
invalid_notes: Decision notes must be 1000 characters or fewer.
invalid_duplicate_target: Check the duplicate candidate ID.
decision_conflict: This candidate can no longer be decisioned. Refresh the queue.
candidate_decision_rpc_failed: Candidate decision could not be applied.
```

Do not display:

```text
raw stack traces
raw Supabase errors
service-role details
environment variables
SQL messages
```

## Confirmation And Destructive Action Design

Reject and archive are admin decisions that should require stronger confirmation.

Recommended behavior:

```text
For reject and archive, show explicit confirmation copy inside the dialog before submit.
Require reason.
Keep the submit button label specific.
```

Recommended submit labels:

```text
Approve for draft
Reject candidate
Mark duplicate
Request more evidence
Archive candidate
```

Again:

```text
Approve for draft is not publish.
Archive is not delete.
Reject is not delete.
```

## Duplicate Decision Design

The first duplicate UI should stay simple.

Recommended first version:

```text
Manual duplicate candidate ID input.
Helper text explaining it must be another candidate ID.
No public tools picker.
No discovered tools picker.
No duplicate_of_tool_id support.
```

Recommended duplicate helper copy:

```text
Enter another staged candidate ID. Duplicate-to-tool is intentionally unavailable in this phase.
```

A future phase may design a safer duplicate candidate picker after the queue UI can search/select candidates safely.

## Refresh And State Consistency

After any successful decision:

```text
call the existing queue reload function
preserve current filters where safe
return to first page if cursor paging might become stale
clear the decision dialog state
```

Recommended first implementation:

```text
Reset to first page after successful decision.
```

Rationale:

```text
A decision changes candidate status and may remove the row from the current active queue page.
Cursor state may no longer be valid after mutation.
```

## Accessibility Design

The future decision dialog must include:

```text
Dialog title and description.
Labelled action, reason, notes, and duplicate candidate ID controls.
Visible character count or helper text for reason and notes limits.
Keyboard-accessible cancel and submit buttons.
Disabled pending state with readable text.
No color-only status meaning.
Focus returned to the originating Review decision button after close when practical.
Error message with role alert or aria-live.
```

## Responsive Design

Desktop:

```text
Decision controls may appear as a right-side row action and open a centered dialog.
```

Tablet/iPad:

```text
Decision dialog should fit within viewport and scroll internally if needed.
```

Mobile:

```text
Decision dialog should use stacked form controls.
No horizontal overflow.
Buttons should be full-width or wrap cleanly.
```

Responsive QA should report:

```text
Desktop result
Tablet/iPad result
Mobile result
```

## Security Design

The UI must preserve:

```text
admin-only access through existing admin shell
same-origin cookie authentication
CSRF token requirement
no direct browser Supabase access
no service-role exposure
no public route exposure
no public.tools writes
no discovered_tools writes
no publish workflow
no client-supplied admin identity
safe error display only
```

The UI must not import:

```text
supabaseAdmin
createClient from @supabase/supabase-js
server-only Supabase helpers
service-role credentials
```

The UI must not call:

```text
insert()
update()
upsert()
delete()
rpc()
```

from browser code.

All mutation must go through:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

## Testing Design For Future Implementation

Recommended new static/source test:

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
```

Required assertions:

```text
Decision dialog component exists.
Queue panel imports/renders decision dialog or decision entry control.
Decision POST route path is present.
CSRF route path is present.
x-csrf-token header is present.
POST method is used only for candidate decision API route.
Decision actions are exactly approve_for_draft, reject, duplicate, needs_more_evidence, archive.
Reason 3-200 helper or validation exists.
Notes 1000 helper or validation exists.
duplicate_of_candidate_id is sent only for duplicate.
duplicate_of_tool_id is not rendered or sent.
actor_label and admin identity fields are not rendered or sent.
Success state triggers queue refresh.
decision_conflict safe error handling exists.
No publish/promote/delete/tool-write labels exist.
No direct Supabase imports exist.
No service-role references exist.
```

Existing read-only test impact:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

This existing test currently guards against mutation labels and mutation methods for the read-only panel.

Phase 19X must explicitly plan how to update this test so it permits the approved candidate decision UI while continuing to forbid:

```text
Publish
Promote
Delete
Insert into public tools
Write to discovered_tools
Run extraction
Run crawler
direct Supabase mutation calls
service-role references
```

The updated test should not accidentally block approved labels that belong only to the decision dialog, such as:

```text
Reject candidate
Archive candidate
```

because reject and archive are now approved candidate decision actions through the Phase 19S API route.

## Verification Commands For Future Implementation

Recommended verification for Phase 19Y or later implementation:

```bash
node testing/discovery-candidate-decision-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-decision-api-static-assertions.mjs
npm run check
git diff --check
```

If manual browser QA is performed, report:

```text
Desktop result
Tablet/iPad result
Mobile result
```

No live mutation smoke should be run from the UI implementation phase unless a separate exact live-smoke approval phrase is defined.

## Out Of Scope For Phase 19W

Phase 19W does not perform:

```text
No UI implementation.
No component creation.
No component modification.
No API route change.
No helper change.
No schema migration.
No type generation.
No package change.
No live API smoke.
No HTTP mutation request.
No live database query.
No DB mutation.
No candidate insert/update/delete.
No audit insert/delete.
No public.tools write.
No discovered_tools write.
No publish action.
No promotion action.
No commit.
No push.
```

## Commit And Push Gates

Phase 19W is docs-only and may be committed only after Gemini approval.

Push still requires explicit push approval.

Any future live data mutation requires a separate exact approval phrase.

## Recommended Next Phase

Recommended next phase:

```text
Phase 19X — Candidate Decision Admin UI Implementation Plan
```

Phase 19X should define exact implementation files, status eligibility rules, test updates, CSRF helper strategy, and verification commands before any UI code is changed.
