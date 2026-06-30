# Discovery Phase 19A — Candidate Staging Queue Decision Workflow Design

## Status

Phase 19A is a docs-only design phase.

Current pushed baseline:

```text
5818196 Close admin shell Supabase read audit gate
```

Phase 19A returns the Discovery Engine roadmap to Candidate Staging Queue work after the Phase 17/18 admin-shell browser Supabase read hardening and audit milestone was closed.

Phase 19A designs the future decision workflow for staged discovery candidates.

Phase 19A does not implement code.

Phase 19A does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19A does not run browser QA.

Phase 19A does not run live database queries.

Phase 19A does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19A design:

```text
Discovery Engine overall: ~85%
Phase 19A progress: 100%
Current milestone: Candidate Staging Queue decision workflow design complete
```

Current major milestone status:

```text
Candidate Staging Queue read-only API/UI/detail/cursor milestone: closed for created_at and updated_at.
Admin shell /admin/tools Supabase read hardening: complete and closed.
Remaining admin shell browser Supabase read audit: complete and closed.
Candidate Staging Queue decision workflow: design in progress.
```

## Purpose

The Candidate Staging Queue is currently a read-only admin review surface.

It supports:

```text
read-only queue list
read-only candidate detail drawer
created_at cursor pagination
updated_at cursor pagination
admin-only access
safe projections
no mutation actions
```

The next major Discovery Engine step is to design how an admin will make decisions on staged candidates.

Primary design question:

```text
How should an admin safely approve, reject, archive, or promote a staged candidate without bypassing audit, security, and data-quality gates?
```

Secondary design question:

```text
Which future mutations are allowed, which are explicitly out of scope, and which approval gates must exist before implementation?
```

## Non-Goals

Phase 19A does not implement any decision mutation.

Phase 19A does not create approval buttons.

Phase 19A does not create reject buttons.

Phase 19A does not create archive buttons.

Phase 19A does not create promote buttons.

Phase 19A does not write to `public.tools`.

Phase 19A does not write to `discovered_tools`.

Phase 19A does not update `discovery_candidate_tools`.

Phase 19A does not create candidate rows.

Phase 19A does not create source rows.

Phase 19A does not create run rows.

Phase 19A does not trigger crawler execution.

Phase 19A does not trigger candidate extraction execution.

Phase 19A does not run live database queries.

Phase 19A does not run database mutations.

## Existing Boundary to Preserve

The current Candidate Staging Queue milestone remains read-only.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

This phase does not reopen the deferred `confidence_bucket` cursor continuation.

This phase does not modify:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

## Decision Workflow Overview

The future decision workflow should be intentionally staged.

Recommended future decision actions:

```text
Approve for tool creation draft
Reject candidate
Archive candidate
Promote candidate to manual review / publish-ready draft
```

Important naming decision:

```text
Approve should not immediately publish to public.tools by default.
```

Recommended default behavior:

```text
Approve candidate -> create or mark a controlled publish draft / approved candidate state
Final publish -> separate future explicit action
```

This keeps discovery candidate review separate from public tool publishing.

## Candidate Decision States

Recommended future state model:

```text
staged
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
promoted_to_publish_draft
published
```

Initial implementation should not require all states.

Recommended first mutation-capable subset:

```text
staged
approved_for_draft
rejected
archived
needs_more_evidence
duplicate
```

States intentionally deferred:

```text
promoted_to_publish_draft
published
```

Reason for deferral:

```text
Publishing affects public tools and should require a separate design, implementation plan, security review, and live mutation approval.
```

## Action Semantics

### Approve for Draft

Recommended future action name:

```text
Approve for draft
```

Allowed future effect:

```text
Update candidate_status from staged to approved_for_draft.
Record admin decision metadata.
Record audit event.
Do not write to public.tools.
Do not publish.
Do not create public-facing tool card.
```

Required future preconditions:

```text
Candidate exists.
Candidate is currently staged or under_review.
Candidate has a canonical website URL.
Candidate has a normalized name.
Candidate has enough source evidence.
Candidate is not already rejected, archived, duplicate, or published.
Admin session passes requireAdminSecurity(request).
CSRF protection passes for mutation.
Rate limit passes for decision action.
```

Recommended confirmation copy:

```text
Approve this candidate for draft review? This will not publish it publicly.
```

### Reject Candidate

Allowed future effect:

```text
Update candidate_status to rejected.
Record rejection reason.
Record admin decision metadata.
Record audit event.
Do not delete candidate evidence.
Do not write to public.tools.
```

Required future rejection reason:

```text
not_ai_tool
bad_url
unsafe_url
duplicate
low_quality
insufficient_evidence
wrong_language_or_region
spam
other
```

Recommended confirmation copy:

```text
Reject this candidate? It will stay in the audit history and can be reviewed later.
```

### Archive Candidate

Allowed future effect:

```text
Update candidate_status to archived.
Record archive reason.
Record admin decision metadata.
Record audit event.
Do not delete candidate evidence.
Do not write to public.tools.
```

Recommended archive reasons:

```text
outdated
not_relevant_now
manual_cleanup
superseded
other
```

Recommended confirmation copy:

```text
Archive this candidate? It will be removed from the active queue but preserved for audit history.
```

### Mark Duplicate

Allowed future effect:

```text
Update candidate_status to duplicate.
Record duplicate target if known.
Record duplicate reason.
Record admin decision metadata.
Record audit event.
Do not merge automatically.
Do not write to public.tools.
```

Required future duplicate metadata:

```text
duplicate_of_candidate_id or duplicate_of_tool_id when known
duplicate_confidence
duplicate_reason
```

Recommended confirmation copy:

```text
Mark this candidate as duplicate? No tool data will be merged automatically.
```

### Needs More Evidence

Allowed future effect:

```text
Update candidate_status to needs_more_evidence.
Record reason and requested evidence fields.
Record admin decision metadata.
Record audit event.
Do not trigger crawler execution automatically.
```

Recommended confirmation copy:

```text
Mark this candidate as needing more evidence? This will not trigger crawling automatically.
```

## Future API Design

Recommended future route family:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Alternative route family:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/approve
POST /api/admin/discovery/candidate-staging-queue/[id]/reject
POST /api/admin/discovery/candidate-staging-queue/[id]/archive
POST /api/admin/discovery/candidate-staging-queue/[id]/duplicate
POST /api/admin/discovery/candidate-staging-queue/[id]/needs-more-evidence
```

Recommended first design preference:

```text
Single decision route with explicit action enum.
```

Reason:

```text
A single decision route makes it easier to centralize authorization, CSRF, rate limiting, status transition validation, audit writing, and safe response projection.
```

Suggested future request shape:

```json
{
  "action": "approve_for_draft",
  "reason": "sufficient_evidence",
  "notes": "Reviewed by admin.",
  "duplicate_of_candidate_id": null,
  "duplicate_of_tool_id": null,
  "expected_current_status": "staged"
}
```

Suggested future response shape:

```json
{
  "ok": true,
  "candidate": {
    "id": "candidate-id",
    "candidate_status": "approved_for_draft",
    "decision_action": "approve_for_draft",
    "decided_at": "timestamp"
  }
}
```

Failure response should remain generic and safe:

```json
{
  "ok": false,
  "error": "Unable to update candidate decision."
}
```

## Future Security Requirements

Every future decision mutation must require:

```text
requireAdminSecurity(request)
CSRF validation
same-origin credentials
server-side Supabase admin client only
strict action enum validation
strict reason enum validation
expected_current_status validation
status transition validation
rate limiting
safe generic error messages
no service-role leakage
no browser Supabase mutation
no direct browser /rest/v1 mutation
```

The browser must call only project-owned admin API routes.

Required browser pattern:

```text
Admin browser UI -> POST project-owned admin API route -> requireAdminSecurity(request) -> server-side mutation -> audit event -> safe response
```

Forbidden browser pattern:

```text
Admin browser UI -> browser Supabase client -> direct /rest/v1/* mutation
```

## Future Status Transition Rules

Recommended status transition rules:

```text
staged -> under_review
staged -> approved_for_draft
staged -> rejected
staged -> archived
staged -> duplicate
staged -> needs_more_evidence

under_review -> approved_for_draft
under_review -> rejected
under_review -> archived
under_review -> duplicate
under_review -> needs_more_evidence

needs_more_evidence -> staged
needs_more_evidence -> rejected
needs_more_evidence -> archived

approved_for_draft -> promoted_to_publish_draft
approved_for_draft -> archived

duplicate -> archived

rejected -> archived
```

Forbidden first-implementation transitions:

```text
staged -> published
approved_for_draft -> published
rejected -> approved_for_draft without explicit reopen design
archived -> approved_for_draft without explicit restore design
duplicate -> approved_for_draft without explicit unmark-duplicate design
```

## Future Audit Requirements

Every decision mutation must write an audit event.

Suggested audit event fields:

```text
event_type
candidate_id
previous_candidate_status
next_candidate_status
decision_action
decision_reason
decision_notes
admin_user_identifier
request_id
audit_correlation_id
created_at
safe_metadata
```

Suggested event types:

```text
discovery_candidate_decision_approve_for_draft
discovery_candidate_decision_reject
discovery_candidate_decision_archive
discovery_candidate_decision_duplicate
discovery_candidate_decision_needs_more_evidence
```

Audit requirements:

```text
Never store service-role secrets.
Never store raw cookies.
Never store full request headers.
Never store unbounded raw HTML.
Never store unbounded LLM output.
Never delete prior evidence as part of a decision action.
```

## Future UI Design

Future UI should add decision controls only after API and mutation safety are approved.

Recommended UI locations:

```text
Candidate detail drawer primary action area
Candidate row overflow menu
Filtered status views
Decision history section in detail drawer
```

Recommended first UI controls:

```text
Approve for draft
Reject
Archive
Mark duplicate
Needs more evidence
```

Recommended UI safety:

```text
Require confirmation dialogs for approve, reject, archive, and duplicate.
Require reason selection for reject, archive, duplicate, and needs more evidence.
Show clear copy that approve does not publish publicly.
Disable actions while request is pending.
Show safe success and error toasts.
Refresh queue after successful mutation.
Keep detail drawer state consistent after decision.
```

Recommended empty state after decision:

```text
Candidate moved out of the active staged queue.
```

## Future Filtering Requirements

Decision workflow should add or preserve filters for:

```text
candidate_status
source_type
confidence_bucket
created_at
updated_at
decision_action
decision_reason
```

Filtering should remain read-only until mutation implementation is approved.

## Duplicate Handling Design

Duplicate handling should not merge records automatically.

Recommended first duplicate behavior:

```text
Mark candidate as duplicate.
Optionally link duplicate_of_candidate_id or duplicate_of_tool_id.
Preserve original candidate evidence.
Record audit event.
Remove duplicate from default active staged queue.
```

Future duplicate merge or canonicalization should be a separate phase.

## Publishing Boundary

Publishing remains out of scope.

Phase 19A explicitly separates these concepts:

```text
candidate decision
candidate approval for draft
publish draft creation
public.tools publication
```

Only the first two are considered in the initial decision workflow design.

public.tools write remains forbidden until a separate publish workflow phase is approved.

## Data Validation Requirements

Future decision implementation should validate:

```text
candidate id format
candidate current status
decision action enum
decision reason enum
notes length
duplicate target id format
allowed transition
admin authorization
CSRF token
rate limit
```

Notes should have a strict length cap.

Suggested initial cap:

```text
1000 characters
```

## Future Test Requirements

A future implementation plan should require tests for:

```text
missing admin session rejection
missing CSRF rejection
invalid action rejection
invalid reason rejection
invalid transition rejection
stale expected_current_status rejection
approve_for_draft success
reject success
archive success
duplicate success
needs_more_evidence success
audit event write attempted
safe response projection
no public.tools write
no discovered_tools write
no direct browser Supabase usage
```

Browser QA should be separate from API/helper tests unless explicitly included in the implementation phase.

## Live Mutation Approval Gate

No future decision implementation may run live database mutations without separate explicit approval.

Required exact approval style should remain separate from normal phase approval.

Example future live mutation approval phrase:

```text
Approve Phase 19 live candidate decision mutation smoke
```

A normal implementation approval must not imply live mutation approval.

## Recommended Phase Sequence

Recommended next phases:

```text
Phase 19B — Candidate Staging Queue Decision Workflow Implementation Plan
Phase 19C — Candidate Staging Queue Decision API Helper Implementation
Phase 19D — Candidate Staging Queue Decision API Route Implementation
Phase 19E — Candidate Staging Queue Decision API Tests
Phase 19F — Candidate Staging Queue Decision UI Implementation Plan
Phase 19G — Candidate Staging Queue Decision UI Implementation
Phase 19H — Candidate Staging Queue Decision Browser QA
Phase 19I — Candidate Staging Queue Decision Readiness Gate
```

This sequence can be adjusted after Gemini review.

Important sequencing rule:

```text
No UI decision buttons before mutation API safety is designed and approved.
```

## Phase 19A Boundary Confirmation

Phase 19A is documentation-only.

Phase 19A does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- update candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- mark duplicates
- trigger crawler execution
- trigger candidate extraction execution

## Gemini Review Questions

Gemini should review:

```text
Is approve_for_draft the safest first approval state?
Should the first implementation use a single decision route or separate action routes?
Are the proposed status transition rules safe enough for first implementation?
Are any required audit fields missing?
Should duplicate handling be kept as mark-only in the first implementation?
Is Phase 19B the correct next phase?
```

## Conclusion

Phase 19A defines the design for moving the Candidate Staging Queue from read-only review toward controlled admin decisions.

The safest first principle is:

```text
Approve for draft does not publish.
```

The second principle is:

```text
Every decision mutation must be admin-secured, CSRF-protected, rate-limited, status-transition validated, audited, and separated from public.tools publishing.
```

The third principle is:

```text
No live mutation occurs until separately approved.
```

Phase 19A is ready for Gemini review before commit.
