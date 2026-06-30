# Discovery Phase 19B — Candidate Staging Queue Decision Workflow Implementation Plan

## Status

Phase 19B is a docs-only implementation planning phase.

Current pushed baseline:

```text
858e79f Document candidate staging queue decision workflow design
```

Phase 19B converts the approved Phase 19A decision workflow design into a file-by-file implementation plan.

Phase 19B does not implement code.

Phase 19B does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19B does not run browser QA.

Phase 19B does not run live database queries.

Phase 19B does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19B implementation plan:

```text
Discovery Engine overall: ~87%
Phase 19B progress: 100%
Current milestone: Candidate Staging Queue decision workflow implementation plan complete
```

Current major milestone status:

```text
Candidate Staging Queue read-only API/UI/detail/cursor milestone: closed for created_at and updated_at.
Admin shell /admin/tools Supabase read hardening: complete and closed.
Remaining admin shell browser Supabase read audit: complete and closed.
Candidate Staging Queue decision workflow design: complete and pushed.
Candidate Staging Queue decision workflow implementation planning: in progress.
```

## Purpose

Phase 19A approved the decision workflow design.

Phase 19B defines the exact implementation boundaries for the first mutation-capable Candidate Staging Queue decision workflow.

Primary planning question:

```text
Which files should be added or changed to safely support approve_for_draft, reject, archive, duplicate, and needs_more_evidence decisions without publishing to public.tools?
```

Secondary planning question:

```text
How should helper logic, API route logic, validation, audit writing, and tests be sequenced before any UI decision buttons or live mutation smoke?
```

## Non-Goals

Phase 19B does not implement the decision helper.

Phase 19B does not implement the decision route.

Phase 19B does not implement UI buttons.

Phase 19B does not update database rows.

Phase 19B does not write audit rows.

Phase 19B does not write to `public.tools`.

Phase 19B does not write to `discovered_tools`.

Phase 19B does not run a live mutation smoke.

Phase 19B does not approve, reject, archive, duplicate, or promote any real candidate.

## Implementation Principle

The implementation must preserve this core Phase 19A rule:

```text
Approve for draft does not publish.
```

The implementation must preserve this boundary:

```text
public.tools write remains forbidden until a separate publish workflow phase is approved.
```

The implementation must preserve this live-mutation gate:

```text
No future decision implementation may run live database mutations without separate explicit approval.
```

Example future live mutation approval phrase:

```text
Approve Phase 19 live candidate decision mutation smoke
```

Normal phase approval must not imply live mutation approval.

## Recommended Implementation Sequence

Recommended next phase sequence:

```text
Phase 19C — Candidate Staging Queue Decision Helper Implementation
Phase 19D — Candidate Staging Queue Decision API Route Implementation
Phase 19E — Candidate Staging Queue Decision API Tests
Phase 19F — Candidate Staging Queue Decision UI Implementation Plan
Phase 19G — Candidate Staging Queue Decision UI Implementation
Phase 19H — Candidate Staging Queue Decision Browser QA
Phase 19I — Candidate Staging Queue Decision Readiness Gate
```

Important sequencing rule:

```text
No UI decision buttons before mutation API safety is designed, implemented, and tested.
```

## Future Files to Add or Change

### Phase 19C Helper Files

Recommended new helper file:

```text
lib/discovery/discovery-candidate-staging-queue-decision.ts
```

Purpose:

```text
Centralize decision action validation, reason validation, status transition enforcement, mutation execution, audit payload construction, and safe response shaping.
```

Recommended companion test file:

```text
testing/discovery-candidate-staging-queue-decision.test.mjs
```

Purpose:

```text
Validate helper contract, action enum handling, reason enum handling, status transition matrix, safe payload shaping, and no-public-write guard behavior using mocked Supabase clients only.
```

### Phase 19D API Route Files

Recommended new route file:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
```

Purpose:

```text
Expose a single admin-only decision endpoint with explicit action enum.
```

Recommended companion test file:

```text
testing/discovery-candidate-staging-queue-decision-api-route.test.mjs
```

Purpose:

```text
Statically and behaviorally verify admin security, CSRF boundary, route contract, safe error responses, no browser Supabase pattern, and no public.tools/discovered_tools writes.
```

### Phase 19F/19G UI Files

Future UI files likely to change after API safety is complete:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

Potential new UI support file:

```text
components/admin/discovery/candidate-staging-queue-decision-controls.tsx
```

Purpose:

```text
Contain approve_for_draft, reject, archive, duplicate, and needs_more_evidence controls after route safety is implemented and tested.
```

UI implementation remains deferred until after helper and route tests pass.

## Decision Route Contract

Required route-shape marker:

```text
Single decision route with explicit action enum.
```

Recommended future route:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Reason for single route:

```text
A single decision route centralizes requireAdminSecurity(request), CSRF validation, rate limiting, action validation, transition validation, audit writing, safe response projection, and error handling.
```

Rejected first implementation alternative:

```text
Separate approve/reject/archive/duplicate/needs-more-evidence routes.
```

Reason for rejecting separate first routes:

```text
Separate routes increase the chance of authorization, audit, validation, or response-handling drift.
```

## Request Contract

Suggested request shape:

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

Required fields:

```text
action
expected_current_status
```

Conditionally required fields:

```text
reason for reject
reason for archive
reason for duplicate
reason for needs_more_evidence
duplicate_of_candidate_id or duplicate_of_tool_id when marking duplicate and known
```

Optional fields:

```text
notes
duplicate_of_candidate_id
duplicate_of_tool_id
```

Notes cap:

```text
1000 characters
```

## Response Contract

Suggested success response:

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

Suggested failure response:

```json
{
  "ok": false,
  "error": "Unable to update candidate decision."
}
```

Safe response rules:

```text
Return only explicit safe fields.
Do not return service-role markers.
Do not return raw cookies.
Do not return full request headers.
Do not return unbounded evidence payloads.
Do not return raw HTML.
Do not return unbounded LLM output.
```

## Decision Action Enum

Recommended future action enum:

```text
approve_for_draft
reject
archive
duplicate
needs_more_evidence
```

Explicitly forbidden first-implementation actions:

```text
publish
promote_to_public_tool
write_public_tool
merge_duplicate
delete_candidate
hard_delete_candidate
```

## Reason Enum

Recommended reason enum by action:

```text
approve_for_draft:
- sufficient_evidence
- manually_verified
- trusted_source
- other

reject:
- not_ai_tool
- bad_url
- unsafe_url
- duplicate
- low_quality
- insufficient_evidence
- wrong_language_or_region
- spam
- other

archive:
- outdated
- not_relevant_now
- manual_cleanup
- superseded
- other

duplicate:
- same_canonical_url
- same_domain
- same_product
- same_vendor
- manual_match
- other

needs_more_evidence:
- missing_pricing
- missing_platform_links
- missing_description
- weak_source_evidence
- unclear_ai_relevance
- other
```

## Status Transition Matrix

Allowed first implementation transitions:

```text
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
```

Deferred transitions:

```text
approved_for_draft -> promoted_to_publish_draft
approved_for_draft -> archived
duplicate -> archived
rejected -> archived
```

Forbidden first-implementation transitions:

```text
staged -> published
approved_for_draft -> published
staged -> public_tools_inserted
approved_for_draft -> public_tools_inserted
rejected -> approved_for_draft
archived -> approved_for_draft
duplicate -> approved_for_draft
```

Implementation requirement:

```text
Transitions must use an explicit allow-list, not ad-hoc if/else acceptance.
```

## Database Schema Readiness Risk

Phase 19B does not inspect the live database.

Before implementation, Phase 19C or a dedicated schema-readiness phase must confirm whether existing database constraints allow the planned candidate_status values.

Potential planned values:

```text
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
under_review
```

If the database constraint does not allow these values, a separate migration planning phase is required before mutation implementation.

Important rule:

```text
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Recommended handling:

```text
Inspect current migration/schema files first.
If local schema is insufficient, draft a migration in a separate approved phase.
Do not run supabase db push without separate approval.
Do not run live schema changes without separate approval.
```

## Helper Contract

Recommended exported helper:

```ts
decideDiscoveryCandidateStagingQueueItem(input)
```

Suggested input shape:

```ts
type DecideDiscoveryCandidateStagingQueueItemInput = {
  candidateId: string
  action: CandidateStagingQueueDecisionAction
  reason?: CandidateStagingQueueDecisionReason
  notes?: string
  duplicateOfCandidateId?: string | null
  duplicateOfToolId?: string | null
  expectedCurrentStatus: CandidateStagingQueueCandidateStatus
  adminUserIdentifier: string
  requestId: string
  auditCorrelationId: string
}
```

Suggested result shape:

```ts
type DecideDiscoveryCandidateStagingQueueItemResult =
  | {
      ok: true
      candidate: {
        id: string
        candidate_status: CandidateStagingQueueCandidateStatus
        decision_action: CandidateStagingQueueDecisionAction
        decided_at: string
      }
    }
  | {
      ok: false
      error: "invalid_input" | "invalid_transition" | "not_found" | "stale_status" | "mutation_failed" | "audit_failed"
    }
```

The public API route should not expose these internal error codes directly.

The API response should use safe generic messages.

## Mutation Strategy

Recommended first mutation strategy:

```text
Read candidate by id using server-side Supabase admin client.
Verify candidate exists.
Verify current status matches expected_current_status.
Validate action.
Validate reason.
Validate status transition.
Update only allowed decision fields.
Write audit event.
Return safe candidate projection.
```

Decision fields likely needed:

```text
candidate_status
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
updated_at
audit_correlation_id
```

If these fields do not exist in the current schema, implementation must stop and require a schema expansion planning phase.

Important:

```text
Do not overload unrelated fields.
Do not store decision state only in audit events.
Do not write to public.tools.
Do not write to discovered_tools.
```

## Audit Event Requirements

Every decision mutation must write an audit event.

Suggested event type mapping:

```text
approve_for_draft -> discovery_candidate_decision_approve_for_draft
reject -> discovery_candidate_decision_reject
archive -> discovery_candidate_decision_archive
duplicate -> discovery_candidate_decision_duplicate
needs_more_evidence -> discovery_candidate_decision_needs_more_evidence
```

Suggested audit metadata:

```text
candidate_id
previous_candidate_status
next_candidate_status
decision_action
decision_reason
decision_notes
duplicate_of_candidate_id
duplicate_of_tool_id
admin_user_identifier
request_id
audit_correlation_id
created_at
safe_metadata
```

Audit safety rules:

```text
Never store service-role secrets.
Never store raw cookies.
Never store full request headers.
Never store unbounded raw HTML.
Never store unbounded LLM output.
Never delete prior evidence as part of a decision action.
```

## API Route Requirements

The future route must enforce:

```text
requireAdminSecurity(request)
CSRF validation
same-origin credentials
admin decision rate limit
JSON body parsing with size limit
strict candidate id validation
strict action enum validation
strict reason enum validation
notes length cap
expected_current_status validation
status transition validation
safe generic error response
safe success projection
```

The route must not:

```text
import the browser Supabase client
return service-role markers
write to public.tools
write to discovered_tools
publish candidates
trigger crawler execution
trigger extraction execution
```

## Browser Pattern Requirements

Allowed browser pattern:

```text
Admin browser UI -> POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Forbidden browser patterns:

```text
Admin browser UI -> browser Supabase client -> direct /rest/v1 mutation
Admin browser UI -> direct public.tools mutation
Admin browser UI -> service-role key
```

## Test Plan

### Phase 19C Helper Tests

Required helper test cases:

```text
valid approve_for_draft input passes validation
valid reject input passes validation
valid archive input passes validation
valid duplicate input passes validation
valid needs_more_evidence input passes validation
invalid action rejected
invalid reason rejected
missing required reason rejected
notes over 1000 characters rejected
invalid transition rejected
stale expected_current_status rejected
not found candidate returns safe failure
mutation failure returns safe failure
audit failure returns safe failure or rolls back according to chosen transaction strategy
no public.tools write attempted
no discovered_tools write attempted
safe result projection returned
```

### Phase 19D/19E API Route Tests

Required API route test cases:

```text
missing admin session rejected
missing CSRF rejected
invalid candidate id rejected
invalid JSON rejected safely
invalid action rejected
invalid reason rejected
invalid transition rejected
stale expected_current_status rejected
approve_for_draft success
reject success
archive success
duplicate success
needs_more_evidence success
safe generic error message
safe success projection
audit event path invoked
no public.tools write
no discovered_tools write
no browser Supabase import
no direct /rest/v1 browser mutation
```

### Static Safety Tests

Recommended static test assertions:

```text
No browser Supabase import in Candidate Staging Queue decision UI files.
No /rest/v1 literal in Candidate Staging Queue decision UI files.
No public.tools mutation in decision helper or decision route.
No discovered_tools mutation in decision helper or decision route.
Route includes requireAdminSecurity(request).
Route includes CSRF validation.
Route includes safe generic error message.
```

## Transaction Strategy Decision

Phase 19B recommends a conservative transaction-like strategy.

Preferred behavior:

```text
Candidate status update and audit event should both succeed or the helper should return failure.
```

Potential implementation options:

```text
Use a database RPC in a later phase for true transaction semantics.
Use ordered server-side operations with compensating failure handling for first implementation if RPC is deferred.
```

Recommendation:

```text
Do not use a custom RPC until schema and mutation requirements are fully stable.
```

For first implementation, document any non-atomic limitation clearly.

If atomicity is required before launch, create a separate RPC/migration planning phase.

## Rate Limit Design

Recommended rate limit action:

```text
discoveryCandidateStagingQueueDecision
```

Route should use a dedicated decision-action rate limit separate from read-only queue routes.

Reason:

```text
Decision mutations are higher risk than reads and should have their own throttle.
```

## CSRF Design

All decision mutations must require CSRF validation.

Implementation must follow the existing admin CSRF pattern used by current admin mutation routes.

No decision mutation should be accepted based only on session cookies.

## UI Implementation Plan Boundary

UI implementation is not part of Phase 19B.

Future UI implementation must wait until:

```text
helper tests pass
route tests pass
static safety tests pass
Gemini approves UI implementation plan
```

UI copy must make this explicit:

```text
Approve for draft — does not publish publicly.
```

## Browser QA Boundary

Browser QA is not part of Phase 19B.

Future browser QA should verify:

```text
decision controls render only after API implementation is complete
approve_for_draft confirmation explains no public publish
reject requires reason
archive requires reason
duplicate requires reason or target
needs_more_evidence requires reason
successful decision removes or updates candidate in active queue
network calls use only project-owned admin API route
no direct /rest/v1 browser mutation
no service-role leakage
desktop/tablet/mobile layouts pass
```

## Live Mutation Smoke Boundary

A future live mutation smoke is not part of Phase 19B.

It must require exact approval.

Required future live smoke properties:

```text
use isolated fixture candidate
mutate only exact fixture candidate
verify candidate status transition
verify audit event
verify no public.tools write
verify no discovered_tools write
clean up exact fixture if safe and approved
```

Live mutation smoke must not run automatically during implementation.

## Candidate Staging Queue Boundary

Phase 19B does not change existing Candidate Staging Queue implementation.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Phase 19B Boundary Confirmation

Phase 19B is documentation-only.

Phase 19B does not:

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

## Recommended Next Phase

Recommended next phase:

```text
Phase 19C — Candidate Staging Queue Decision Helper Implementation
```

Suggested Phase 19C scope:

```text
Implement helper-level types, validation, transition matrix, safe result shape, and mocked tests only.
Do not add the API route yet unless separately approved.
Do not add UI buttons.
Do not run live database mutations.
```

Alternative safer next phase if schema uncertainty blocks implementation:

```text
Phase 19C — Candidate Staging Queue Decision Schema Readiness Inspection
```

Suggested alternative scope:

```text
Inspect local schema/migrations only to confirm candidate_status constraint and decision metadata fields before helper implementation.
No DB push, no live DB query, no migration apply.
```

## Gemini Review Questions

Gemini should review:

```text
Is the single decision route still the safest first implementation route?
Should Phase 19C implement helper logic first, or should schema readiness inspection come before helper implementation?
Is the proposed helper contract sufficient?
Are the proposed transition rules safe enough?
Is the test plan complete enough before any UI buttons?
Should decision metadata fields require schema migration planning before helper implementation?
Should audit event write failure block candidate status update?
```

## Conclusion

Phase 19B converts the approved Phase 19A design into a safe implementation plan.

The plan preserves:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No live mutation without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
```

Phase 19B is ready for Gemini review before commit.
