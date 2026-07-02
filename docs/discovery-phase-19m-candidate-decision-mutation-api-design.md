# Discovery Phase 19M — Candidate Decision Mutation API Design

## Status

Phase 19M is a docs-only API design phase.

It follows the successful Phase 19L live candidate decision mutation smoke, which proved the live database can safely:

- update candidate decision metadata
- approve a candidate for draft preparation without publishing
- mark a candidate as duplicate using `duplicate_of_candidate_id`
- write a `candidate_decision` audit event
- reject unsafe publish markers
- reject invalid decision actions
- reject decision notes longer than 1000 characters
- avoid writes to `public.tools`
- avoid writes to `discovered_tools`
- clean up exact-ID smoke rows

Phase 19M does not implement the route, helper, UI, or tests.

## Design Goal

Design a safe admin-only mutation API for candidate decisions.

The first implementation phase after this design should create an API boundary that lets an authenticated admin make one candidate decision at a time against `public.discovery_candidate_tools`.

The API should support these candidate decision actions only:

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

The API must not support:

```text
publish
published
promote_to_tools
promoted_to_publish_draft
insert_public_tool
insert_discovered_tool
```

## Proposed Route

Recommended future route:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Alternative acceptable route if Next.js route organization prefers an action endpoint:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision/apply
```

The route should be admin-only and should use the existing admin session and CSRF protection pattern already used by admin mutation routes.

The route must operate on exactly one candidate ID from the path.

## Request Shape

Proposed JSON body:

```ts
type CandidateDecisionAction =
  | "approve_for_draft"
  | "reject"
  | "duplicate"
  | "needs_more_evidence"
  | "archive";

type CandidateDecisionRequest = {
  action: CandidateDecisionAction;
  reason: string;
  notes?: string | null;
  duplicateOfCandidateId?: string | null;
  duplicateOfToolId?: number | null;
};
```

### Request Field Rules

`action` is required.

`reason` is required at the application layer.

`notes` is optional and must be at most 1000 characters after normalization.

`duplicateOfCandidateId` is allowed only when `action = "duplicate"`.

`duplicateOfToolId` is allowed only when `action = "duplicate"`.

For the first implementation, the recommended duplicate target scope is:

```text
duplicate_of_candidate_id only
```

`duplicate_of_tool_id` should remain designed but not wired unless separately approved, because a duplicate-to-public-tool decision crosses closer to the publishing boundary.

## Candidate Status Mapping

The API should map `action` to `candidate_status` as follows:

| action | candidate_status |
|---|---|
| `approve_for_draft` | `approved_for_draft` |
| `reject` | `rejected` |
| `duplicate` | `duplicate` |
| `needs_more_evidence` | `needs_more_evidence` |
| `archive` | `archived` |

The API must not write:

```text
candidate_status = published
```

The API must not create or imply a publish workflow.

## Candidate Row Mutation

For the selected candidate row, the route should update only candidate decision fields and the candidate status:

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
```

Recommended decision metadata mapping:

```text
decision_action = request.action
decision_reason = normalized request.reason
decision_notes = normalized request.notes or null
decided_at = current server timestamp
decided_by = authenticated admin actor label
```

For non-duplicate actions, duplicate references should be cleared:

```text
duplicate_of_candidate_id = null
duplicate_of_tool_id = null
```

For `duplicate`, the first implementation should require exactly one approved duplicate target mode.

Recommended Phase 19N implementation rule:

```text
action = duplicate requires duplicateOfCandidateId
duplicateOfToolId remains rejected until separately approved
```

## Duplicate Candidate Validation

For `duplicateOfCandidateId`, future implementation should verify:

- the target candidate exists
- the target candidate is not the same row as the decision candidate
- the target candidate belongs to `discovery_candidate_tools`
- the target candidate ID is a valid UUID
- the selected candidate and target candidate are both readable by the service/admin operation

The first implementation does not need fuzzy duplicate scoring or vector matching.

This route records the admin decision only.

## Reason Validation Boundary

`decision_reason` is required by Phase 19M design at the application layer.

Recommended initial validation:

```text
trimmed length >= 3
trimmed length <= 200
single-line preferred
no HTML required
```

This design intentionally keeps `decision_reason` validation in application code rather than adding a new DB constraint in this phase.

The API should return `400` when `reason` is missing, blank, or too long.

## Notes Validation Boundary

The database already rejects `decision_notes` longer than 1000 characters.

The API should also enforce this before mutation to return a clean `400`.

Recommended normalization:

```text
undefined -> null
blank string after trim -> null
trimmed string length <= 1000
```

## Audit Event

Every successful decision mutation must write one audit event:

```text
action = candidate_decision
```

Recommended audit metadata:

```ts
type CandidateDecisionAuditMetadata = {
  candidate_id: string;
  action: CandidateDecisionAction;
  previous_candidate_status: string | null;
  next_candidate_status: string;
  decision_reason: string;
  has_decision_notes: boolean;
  duplicate_of_candidate_id?: string | null;
  duplicate_of_tool_id?: number | null;
  request_correlation_id?: string | null;
};
```

Audit message examples:

```text
Candidate approved for draft.
Candidate rejected.
Candidate marked as duplicate.
Candidate marked as needing more evidence.
Candidate archived.
```

The audit event must not use:

```text
publish_candidate
promote_candidate
insert_public_tool
```

## Transaction Design

The future implementation should prefer a single transactional database function or RPC if the current Supabase server client flow cannot guarantee atomicity between candidate update and audit insert.

Recommended design order:

1. Keep Phase 19M docs-only.
2. In Phase 19N, implement a small server-side helper boundary.
3. If helper cannot safely guarantee both update and audit insert together, introduce an RPC design phase before implementation.

Minimum acceptable first implementation, if no RPC is used:

- update candidate row
- verify exactly one row was updated
- insert audit event
- return success only after audit insert succeeds
- include a compensating warning in the implementation review if atomicity remains non-transactional

Preferred long-term design:

```text
public.admin_apply_discovery_candidate_decision(...)
```

The RPC should be SECURITY DEFINER only if strictly needed and should be reviewed separately before creation.

## Response Shape

Proposed success response:

```ts
type CandidateDecisionResponse = {
  ok: true;
  candidate: {
    id: string;
    candidate_status: string;
    decision_action: string;
    decision_reason: string;
    decision_notes: string | null;
    decided_at: string;
    decided_by: string;
    duplicate_of_candidate_id: string | null;
    duplicate_of_tool_id: number | null;
  };
  audit: {
    action: "candidate_decision";
  };
};
```

Proposed error response:

```ts
type CandidateDecisionErrorResponse = {
  ok: false;
  error: string;
  code:
    | "unauthorized"
    | "forbidden"
    | "csrf_invalid"
    | "candidate_not_found"
    | "invalid_action"
    | "invalid_reason"
    | "invalid_notes"
    | "invalid_duplicate_target"
    | "decision_conflict"
    | "mutation_failed";
};
```

## HTTP Status Mapping

Recommended status mapping:

| Case | Status |
|---|---:|
| unauthenticated | 401 |
| non-admin | 403 |
| invalid/missing CSRF | 403 |
| candidate not found | 404 |
| invalid action | 400 |
| invalid reason | 400 |
| invalid notes | 400 |
| invalid duplicate target | 400 |
| decision conflict | 409 |
| mutation failure | 500 |

## Idempotency and Conflicts

The first implementation should be conservative.

Recommended conflict rules:

- If candidate already has the same `decision_action` and same decision target, return success or `409` by explicit implementation choice.
- If candidate already has a different final decision, return `409`.
- If candidate is already archived, require a new explicit decision phase before changing it again.
- If candidate status is not one of the reviewable statuses, return `409`.

Recommended reviewable statuses:

```text
staged
under_review
needs_more_evidence
```

Recommended already-decisioned statuses:

```text
approved_for_draft
rejected
archived
duplicate
```

The first implementation should not allow repeated admin decision overwrites unless explicitly designed and reviewed.

## Security Requirements

The route must require:

- admin authentication
- CSRF validation
- service-role database access only on the server
- no client-side service role key exposure
- strict JSON parsing
- explicit allow-list validation for `action`
- strict candidate ID validation
- rate limit using an admin mutation action key
- no public route exposure
- no public tools writes
- no discovered_tools writes
- no publish lifecycle writes

## Rate Limit

Recommended future rate-limit action key:

```text
discoveryCandidateDecisionMutation
```

The first implementation should follow existing admin mutation rate-limit style.

## Files Recommended for Future Implementation

Potential future implementation files:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
lib/discovery/discovery-candidate-decision-admin.ts
testing/discovery-candidate-decision-api-smoke.mjs
```

Optional shared validation file if it keeps the route small:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

Phase 19M does not create these files.

## Tests Recommended for Future Implementation

Future Phase 19N or equivalent should include tests for:

- unauthorized request rejected
- missing CSRF rejected
- invalid candidate ID rejected
- unsupported action rejected
- missing reason rejected
- notes over 1000 characters rejected
- approve_for_draft updates candidate safely
- reject updates candidate safely
- needs_more_evidence updates candidate safely
- archive updates candidate safely
- duplicate requires candidate target
- duplicate self-reference rejected
- duplicate with valid candidate target succeeds
- audit event inserted on success
- no public.tools write
- no discovered_tools write
- publish markers rejected
- conflict on already decisioned candidate
- exact-ID cleanup after live smoke

## UI Boundary

Phase 19M does not approve UI decision buttons.

The admin candidate staging queue UI should remain read-only until after:

1. mutation API implementation plan is approved
2. mutation API implementation is completed
3. mutation API smoke passes
4. separate UI wiring design is approved

## Non-Goals

Phase 19M does not:

- implement the mutation route
- implement helper code
- implement UI buttons
- run live mutation smoke
- run schema apply
- run Supabase DB push
- run type generation
- write to candidate rows
- write to audit events
- write to `public.tools`
- write to `discovered_tools`
- publish candidates
- introduce an RPC
- modify RLS
- modify migrations

## Recommended Next Phase

Recommended next phase:

```text
Phase 19N — Candidate Decision Mutation API Implementation Plan
```

Alternative if Gemini requests transaction hardening first:

```text
Phase 19M-R — Candidate Decision Mutation Transaction Boundary Review
```

## Gemini Review Questions

Gemini should review:

```text
Is the proposed route shape safe?
Is the action allow-list correct?
Is the candidate_status mapping correct?
Should duplicate_of_tool_id remain deferred?
Is the application-level decision_reason validation boundary adequate?
Should Phase 19N use a helper-first server route or design an RPC first?
Are conflict/idempotency rules conservative enough?
Are no-publish/no-tools/no-discovered-tools boundaries preserved?
Should Phase 19M be committed?
Is the project ready for Phase 19N implementation planning?
```

## Conclusion

Phase 19M defines a conservative admin-only candidate decision mutation API boundary.

The API design supports decisioning staged candidates without publishing and without writing to public tool tables.

The safest next step is a separate implementation plan that converts this design into a small route/helper/test scope while preserving all existing Discovery Engine safety boundaries.
