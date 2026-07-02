# Discovery Phase 19X — Candidate Decision Admin UI Implementation Plan

## Status

Phase 19X is an implementation plan only.

This phase maps the approved Phase 19W Candidate Decision Admin UI Design to exact future files, component boundaries, status eligibility rules, CSRF strategy, state handling, tests, and verification commands.

Phase 19X does not implement UI, does not create components, does not modify components, does not change API routes, does not run the live API smoke, does not send HTTP mutation requests, does not run `supabase db push`, does not run schema apply, does not run migration apply, does not run type generation, does not mutate candidate rows, does not write to `public.tools`, does not write to `discovered_tools`, and does not publish anything.

## Current Baseline

Current pushed baseline before this plan:

```text
6b01468 Document candidate decision admin UI design
```

The approved design source is:

```text
docs/discovery-phase-19w-candidate-decision-admin-ui-design.md
```

Phase 19W was committed and pushed with:

```text
6b01468 Document candidate decision admin UI design
```

## Planning Objective

Plan the first safe UI implementation for applying candidate decisions from the existing admin Candidate Staging Queue surface.

The next implementation phase should add a deliberate dialog-first decision workflow, not one-click mutation buttons.

The UI must preserve the Phase 19W boundaries:

```text
approve_for_draft is not publish
Approve for draft is not publish
archive is not delete
reject is not delete
no publish workflow
no promotion workflow
no public.tools write
no discovered_tools write
no duplicate_of_tool_id UI
no client-supplied admin identity
no direct browser Supabase access
```

## Recommended Next Implementation Phase

Recommended next phase:

```text
Phase 19Y — Candidate Decision Admin UI Implementation
```

Phase 19Y should implement only the bounded UI integration described in this plan.

No live mutation smoke should be included in Phase 19Y unless a later separate gate defines an exact approval phrase.

## Existing UI/API Anchors

Existing admin discovery page:

```text
app/admin/discovery/page.tsx
```

Existing read-only queue panel:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Existing read-only detail drawer:

```text
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

Existing candidate decision mutation route:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
```

Existing validation helper:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

Existing CSRF route:

```text
app/api/admin/csrf/route.ts
```

Existing queue UI static test:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Existing candidate decision API static test:

```text
testing/discovery-candidate-decision-api-static-assertions.mjs
```

## Files To Change In Phase 19Y

Required implementation files:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Reasoning:

```text
The queue panel already owns the candidate list, filter state, pagination state, and reload function.
The new dialog should own only the decision form, CSRF fetch, mutation POST, validation, submit state, and safe error display.
A new UI static test should guard the approved mutation UI.
The existing read-only queue UI test must be updated so it allows the approved "Review decision" entry point while still blocking publish/promote/delete/tool-write/direct-Supabase behaviors.
```

## Files Not To Change In Phase 19Y

Phase 19Y should not change:

```text
app/admin/discovery/page.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-decision-validation.ts
app/api/admin/csrf/route.ts
supabase/migrations/*
lib/supabase/database.types.ts
package.json
package-lock.json
```

Exceptions:

```text
The detail drawer may be changed only if Gemini specifically requests decision entry from the drawer too.
package files may change only if the user explicitly approves a dependency or script change.
```

Preferred Phase 19Y implementation should avoid both exceptions.

## Component Boundary Plan

Create:

```text
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
```

The component should be a client component:

```text
"use client";
```

Suggested exported props:

```text
export type CandidateStagingQueueDecisionDialogProps = {
  candidate: CandidateStagingQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionApplied: () => void | Promise<void>;
};
```

The dialog may import the existing queue item type from:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Allowed import:

```text
import type { CandidateStagingQueueItem } from "./candidate-staging-queue-panel";
```

The dialog should not import server-only helpers.

Forbidden imports:

```text
supabaseAdmin
createClient from @supabase/supabase-js
server-only Supabase helpers
service-role credentials
```

## Queue Panel Integration Plan

Update:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Add local state:

```text
const [decisionCandidate, setDecisionCandidate] = useState<CandidateStagingQueueItem | null>(null);
```

Add helper:

```text
function openDecisionDialog(candidate: CandidateStagingQueueItem) {
  setDecisionCandidate(candidate);
}

function closeDecisionDialog() {
  setDecisionCandidate(null);
}
```

Render one deliberate action for eligible rows:

```text
Review decision
```

The "Review decision" control should open the dialog.

Do not render one-click decision controls in the row.

Do not render row controls labelled only:

```text
Approve
Reject
Archive
Publish
Promote
Delete
```

At the end of the panel, render:

```text
<CandidateStagingQueueDecisionDialog
  candidate={decisionCandidate}
  open={decisionCandidate !== null}
  onOpenChange={(open) => {
    if (!open) closeDecisionDialog();
  }}
  onDecisionApplied={handleDecisionApplied}
/>
```

## Status Eligibility Plan

Phase 19Y should implement the safe Phase 19W default:

```text
Only candidateStatus === "staged" receives an active Review decision control.
needs_review and duplicate_suspected do not receive active mutation controls yet.
```

For non-eligible rows, render safe text:

```text
Decision unavailable for this status.
```

Do not add backend status mappings in Phase 19Y.

Do not change the read model status filters in Phase 19Y.

Reasoning:

```text
The existing active queue UI includes staged, needs_review, and duplicate_suspected.
The mutation RPC may reject already-decisioned or unsupported states with decision_conflict.
Restricting the first UI to staged rows keeps the implementation fail-safe until a later status-alignment phase is approved.
```

## Decision Dialog Layout Plan

Dialog title:

```text
Review candidate decision
```

Dialog description:

```text
Apply a staging decision. Approve for draft does not publish or write to public tools.
```

Show candidate summary:

```text
Candidate name
Candidate website hostname
Current candidate status
Category hint
Confidence bucket
Duplicate check status
Source domain
```

Form controls:

```text
Decision action select
Decision reason textarea
Optional decision notes textarea
Duplicate candidate ID input shown only when action === "duplicate"
Cancel button
Submit decision button
```

Decision action values:

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

Decision labels:

```text
Approve for draft
Reject candidate
Mark duplicate
Request more evidence
Archive candidate
```

The label "Approve for draft" must never be shortened to "Approve".

Do not render "Publish".

## Client Validation Plan

Client-side validation should reduce obvious mistakes but not replace server validation.

Reason validation:

```text
required
trimmed
3-200 characters
```

Notes validation:

```text
optional
trimmed
1000 characters maximum
```

Duplicate candidate ID validation:

```text
required only when action === "duplicate"
UUID format
must not equal the current candidate ID
sent as duplicate_of_candidate_id
```

The UUID pattern may be local to the dialog or a small local utility in the same file.

Do not render or send:

```text
duplicate_of_tool_id
duplicateOfToolId
actor_label
actorLabel
admin_user_id
adminUserId
decided_by
decidedBy
```

## CSRF Strategy

Use the existing admin CSRF route:

```text
GET /api/admin/csrf
```

Expected safe response:

```json
{
  "success": true,
  "csrfToken": "<token>"
}
```

Submit flow:

```text
1. Validate form locally.
2. Fetch /api/admin/csrf with GET, credentials same-origin, cache no-store.
3. Read csrfToken from JSON.
4. POST to /api/admin/discovery/candidate-staging-queue/[candidateId]/decision.
5. Send x-csrf-token header.
6. Send content-type application/json.
7. Use credentials same-origin.
8. Use cache no-store.
```

Header requirements:

```text
accept: application/json
content-type: application/json
x-csrf-token: <csrfToken>
```

No CSRF token should be hard-coded.

No token should be logged.

## POST Body Plan

Approve-for-draft body:

```json
{
  "action": "approve_for_draft",
  "reason": "<trimmed reason>",
  "notes": "<optional trimmed notes>",
  "request_correlation_id": "candidate-decision-ui:<uuid>"
}
```

Duplicate body:

```json
{
  "action": "duplicate",
  "reason": "<trimmed reason>",
  "notes": "<optional trimmed notes>",
  "duplicate_of_candidate_id": "<uuid>",
  "request_correlation_id": "candidate-decision-ui:<uuid>"
}
```

For non-duplicate actions, do not send:

```text
duplicate_of_candidate_id
```

For all actions, never send:

```text
duplicate_of_tool_id
actor_label
actorLabel
admin_user_id
adminUserId
decided_by
decidedBy
```

## Request Correlation Plan

Phase 19Y may generate a request correlation ID.

Recommended helper behavior:

```text
Use crypto.randomUUID() when available.
Fallback to Date.now() plus a safe random string if crypto.randomUUID is unavailable.
Prefix with candidate-decision-ui:.
Do not include email, admin identity, candidate name, URL, or other sensitive data.
```

Example:

```text
candidate-decision-ui:2f3a7b89-1234-4cde-8f01-234567890abc
```

## Success State Plan

On HTTP 200 and `ok: true`:

```text
Show "Candidate decision applied."
Clear the form.
Close the dialog after success or after a short success state.
Call onDecisionApplied().
```

Panel callback:

```text
async function handleDecisionApplied() {
  closeDecisionDialog();
  resetPagination();
  await loadQueue();
}
```

Implementation detail:

```text
Because resetPagination() uses React state, Phase 19Y should ensure the reload uses first-page parameters.
If that is awkward with existing callback dependencies, split a loadFirstPageQueue helper or set currentCursor to null before load.
Do not keep a stale cursor after mutation.
```

## Error State Plan

Display safe UI errors only.

Known safe error codes:

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

Recommended user-facing messages:

```text
forbidden: Security token missing or expired. Please refresh and try again.
invalid_reason: Decision reason must be 3-200 characters.
invalid_notes: Decision notes must be 1000 characters or fewer.
invalid_duplicate_target: Check the duplicate candidate ID.
decision_conflict: This candidate can no longer be decisioned. Refresh the queue.
candidate_decision_rpc_failed: Candidate decision could not be applied.
```

Fallback copy:

```text
Candidate decision could not be applied.
```

Do not display:

```text
raw stack traces
raw Supabase errors
SQL messages
environment variables
service-role details
```

## Pending State Plan

During submit:

```text
Disable action select, reason, notes, duplicate target input, cancel if needed, and submit button.
Show submit label "Applying decision...".
Avoid duplicate submits.
```

Do not optimistically remove the row before the server returns success.

## Accessibility Plan

The dialog should use the existing shadcn Dialog primitives where possible.

Required accessibility behavior:

```text
Dialog title and description.
Labelled select and textareas.
Reason helper text with 3-200 character limit.
Notes helper text with 1000 character limit.
Duplicate target helper text shown only for duplicate.
Submit button text specific to the selected action.
Error region with role alert or aria-live.
No color-only status meaning.
Keyboard-accessible cancel and submit.
```

## Responsive Plan

Desktop:

```text
Row action appears near existing row links.
Decision dialog has comfortable width and summary section.
```

Tablet/iPad:

```text
Dialog scrolls internally if content exceeds viewport.
Controls wrap without horizontal overflow.
```

Mobile:

```text
Stack form controls vertically.
Buttons are full-width or wrap cleanly.
No horizontal overflow.
```

Manual QA report should include:

```text
Desktop result
Tablet/iPad result
Mobile result
```

## New Static Test Plan

Create:

```text
testing/discovery-candidate-decision-admin-ui.test.mjs
```

Suggested assertions:

```text
decision dialog file exists
dialog starts with "use client"
dialog uses Dialog primitives
dialog includes Review candidate decision copy
dialog includes Apply a staging decision copy
dialog includes /api/admin/csrf
dialog includes /api/admin/discovery/candidate-staging-queue/
dialog includes x-csrf-token
dialog uses method: "POST"
dialog uses credentials: "same-origin"
dialog uses cache: "no-store"
dialog includes approve_for_draft, reject, duplicate, needs_more_evidence, archive
dialog includes Approve for draft
dialog includes Reject candidate
dialog includes Mark duplicate
dialog includes Request more evidence
dialog includes Archive candidate
dialog includes reason 3-200 validation/copy
dialog includes notes 1000 validation/copy
dialog sends duplicate_of_candidate_id only for duplicate
dialog does not include duplicate_of_tool_id
dialog does not include actor_label, actorLabel, admin_user_id, adminUserId, decided_by, decidedBy
dialog handles decision_conflict
dialog handles candidate_decision_rpc_failed
dialog does not include Publish, Promote, Delete
dialog does not import Supabase or service-role code
dialog does not call insert(), update(), upsert(), delete(), or rpc()
queue panel imports/renders CandidateStagingQueueDecisionDialog
queue panel includes Review decision
queue panel includes Decision unavailable for this status.
queue panel gates active decision controls to staged
```

This test should be source/static-oriented like existing project tests and should not require new dependencies.

## Existing Queue UI Test Update Plan

Update:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Current test forbids mutation methods and direct Supabase access. Keep those protections.

Change the old forbidden-label strategy so it permits approved candidate decision UI while still forbidding unsafe workflows.

Panel/page should continue forbidding:

```text
Publish
Promote
Delete
Insert into public tools
Write to discovered_tools
Run extraction
Run crawler
public.tools
discovered_tools
supabaseAdmin
SUPABASE_SERVICE_ROLE_KEY
createClient(
.insert(
.update(
.upsert(
.delete(
.rpc(
```

The queue panel may include:

```text
Review decision
Decision unavailable for this status.
CandidateStagingQueueDecisionDialog
```

The queue panel should not include one-click labels:

```text
Approve
Reject
Archive
```

If static matching makes this difficult because of imports or comments, put the decision action labels only in the dialog component and test them in the new decision UI test.

## Existing API Static Test Plan

Continue running unchanged:

```text
testing/discovery-candidate-decision-api-static-assertions.mjs
```

Phase 19Y should not change API route, helper, validation, RPC, generated types, or migrations.

## Verification Commands For Phase 19Y

Run:

```bash
node testing/discovery-candidate-decision-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-decision-api-static-assertions.mjs
npm run check
git diff --check
```

Recommended optional source guards:

```bash
rg -n "Publish|Promote|Delete|Insert into public tools|Write to discovered_tools|public\.tools|discovered_tools" components/admin/discovery/candidate-staging-queue-panel.tsx components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
rg -n "supabaseAdmin|SUPABASE_SERVICE_ROLE_KEY|createClient\(" components/admin/discovery/candidate-staging-queue-panel.tsx components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
rg -n "\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(" components/admin/discovery/candidate-staging-queue-panel.tsx components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
```

Expected guard result:

```text
No unsafe matches, except allowed literal documentation in tests if any.
```

## Phase 19Y Implementation Order

Recommended order:

```text
1. Add testing/discovery-candidate-decision-admin-ui.test.mjs with expected future assertions.
2. Update testing/discovery-candidate-staging-queue-admin-ui.test.mjs to allow the Review decision entry point while preserving unsafe workflow guards.
3. Add components/admin/discovery/candidate-staging-queue-decision-dialog.tsx.
4. Update components/admin/discovery/candidate-staging-queue-panel.tsx to render the dialog and staged-only Review decision entry point.
5. Run the exact verification commands.
6. Produce CCR with changed files, tests, Desktop/Tablet/Mobile notes if manual QA is performed, and preserved boundaries.
```

If step 1 cannot pass before implementation because the target file does not exist, Phase 19Y may add the test after the dialog file is created, but the final commit must include the test.

## Out Of Scope For Phase 19Y

Phase 19Y should not include:

```text
No API route change.
No validation helper change.
No admin RPC helper change.
No database migration.
No generated type update.
No package dependency change.
No direct Supabase browser access.
No public.tools write.
No discovered_tools write.
No publish workflow.
No promotion workflow.
No delete workflow.
No duplicate_of_tool_id UI.
No duplicate-to-public-tool picker.
No discovered-tools picker.
No live API smoke.
No HTTP mutation request outside normal local UI code definition.
No live database query.
No DB mutation by scripts.
No crawler activation.
No LLM extraction activation.
```

## Future Follow-Up Phases

Potential later phases after Phase 19Y:

```text
Phase 19Z — Candidate Decision Admin UI Post-Implementation Review
Phase 20A — Candidate Decision Admin UI Manual QA / Browser Smoke Gate
Phase 20B — Candidate Decision Admin UI Live Smoke Gate, only if needed and separately approved
```

Potential later design if needed:

```text
Candidate duplicate picker design
Candidate status alignment design
Promote approved draft to public tools design
```

Those remain out of scope for Phase 19X and Phase 19Y.

## Commit And Push Gates

Phase 19X is docs-only and may be committed only after Gemini approval.

Push still requires explicit push approval.

Phase 19Y implementation must be Gemini-reviewed before commit.

Any future live data mutation requires a separate exact approval phrase.

## Recommended Next Phase

Recommended next phase:

```text
Phase 19Y — Candidate Decision Admin UI Implementation
```

Phase 19Y should implement only the bounded UI changes and tests described in this plan.
