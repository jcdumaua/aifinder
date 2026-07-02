# Discovery Phase 19N — Candidate Decision Mutation API Implementation Plan

## Status

Phase 19N is a docs-only implementation plan.

It translates the Phase 19M API design into a precise future implementation scope for an admin-only candidate decision mutation route.

Phase 19N does not implement the route, helper, validation module, tests, RPC, migration, or UI.

## Implementation Plan Decision

Phase 19N recommends a conservative two-step path:

```text
Phase 19O — Candidate Decision Mutation API Helper/Route Implementation
Phase 19P — Candidate Decision Mutation API Smoke / Transaction Follow-up
```

However, the transaction boundary remains a required review gate.

The implementation may start helper-first only if the implementation clearly documents the non-atomic update-plus-audit risk and includes a follow-up RPC gate.

Preferred safer long-term route:

```text
public.admin_apply_discovery_candidate_decision(...)
```

If Gemini or implementation review requires strict atomicity before any API route ships, Phase 19O should become:

```text
Phase 19O — Candidate Decision Mutation RPC Draft
```

Then the route implementation should follow only after the RPC is applied, typed, and smoke-tested.

## Target Future Route

Future route file:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
```

Future HTTP method:

```text
POST
```

Route:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

The route must mutate exactly one candidate row, identified by the path `[id]`.

## Target Future Helper

Recommended helper file:

```text
lib/discovery/discovery-candidate-decision-admin.ts
```

Recommended helper entrypoint:

```ts
export async function applyDiscoveryCandidateDecision(
  input: ApplyDiscoveryCandidateDecisionInput,
): Promise<ApplyDiscoveryCandidateDecisionResult>
```

Recommended input shape:

```ts
export type DiscoveryCandidateDecisionAction =
  | "approve_for_draft"
  | "reject"
  | "duplicate"
  | "needs_more_evidence"
  | "archive";

export type ApplyDiscoveryCandidateDecisionInput = {
  candidateId: string;
  action: DiscoveryCandidateDecisionAction;
  reason: string;
  notes?: string | null;
  duplicateOfCandidateId?: string | null;
  duplicateOfToolId?: number | null;
  actorLabel: string;
  requestCorrelationId?: string | null;
};
```

Recommended result shape:

```ts
export type ApplyDiscoveryCandidateDecisionResult =
  | {
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
    }
  | {
      ok: false;
      code:
        | "candidate_not_found"
        | "invalid_action"
        | "invalid_reason"
        | "invalid_notes"
        | "invalid_duplicate_target"
        | "decision_conflict"
        | "mutation_failed";
      message: string;
    };
```

## Optional Validation Module

A separate validation module is acceptable if it keeps the route and helper small:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

Recommended exported validation helpers:

```ts
export function isDiscoveryCandidateDecisionAction(value: unknown): value is DiscoveryCandidateDecisionAction

export function normalizeDecisionReason(value: unknown): string | null

export function normalizeDecisionNotes(value: unknown): string | null

export function validateDecisionRequestBody(value: unknown): CandidateDecisionValidationResult
```

## Route Responsibilities

The route should handle only HTTP and admin boundary responsibilities:

- enforce `POST`
- require admin session
- require CSRF validation
- apply rate limit action `discoveryCandidateDecisionMutation`
- validate the path candidate ID is a UUID
- parse JSON safely
- call the helper
- map helper result codes to HTTP statuses
- return JSON response
- avoid exposing service-role internals

The route must not directly contain complex candidate decision business logic if the helper exists.

## Helper Responsibilities

The helper should own candidate decision business logic:

- normalize action
- normalize reason
- normalize notes
- map action to candidate status
- validate duplicate target
- read existing candidate row
- enforce reviewable status conflict rules
- update candidate decision fields
- insert `candidate_decision` audit event
- return sanitized result

## Allowed Actions

The helper and route must allow only:

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

They must reject:

```text
publish
published
promote_to_tools
promoted_to_publish_draft
insert_public_tool
insert_discovered_tool
```

## Candidate Status Mapping

The helper should map actions to candidate status exactly:

| action | candidate_status |
|---|---|
| `approve_for_draft` | `approved_for_draft` |
| `reject` | `rejected` |
| `duplicate` | `duplicate` |
| `needs_more_evidence` | `needs_more_evidence` |
| `archive` | `archived` |

The helper must never write:

```text
candidate_status = published
```

## Mutable Fields

The helper may update only these fields on `public.discovery_candidate_tools`:

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

The helper must not update:

```text
candidate_name
candidate_website_url
candidate_canonical_url
candidate_description
source_url
source_evidence_locator
evidence_summary
discovery_run_id
discovery_source_id
candidate_publish_status
```

If `candidate_publish_status` exists in historical code or generated types, this route must not read or write it as a publish control.

## Duplicate Target Plan

Initial implementation should support:

```text
duplicate_of_candidate_id
```

Initial implementation should reject:

```text
duplicate_of_tool_id
```

Reason:

```text
duplicate_of_tool_id crosses closer to the public tools boundary and remains deferred until separately approved.
```

Validation rules for `duplicate_of_candidate_id`:

- required when action is `duplicate`
- must be a valid UUID
- must not equal the selected candidate ID
- must reference an existing `discovery_candidate_tools` row
- should be cleared for all non-duplicate actions

## Reviewable Status Rules

Recommended statuses that can be decisioned:

```text
staged
under_review
needs_more_evidence
```

Recommended statuses treated as already decisioned:

```text
approved_for_draft
rejected
archived
duplicate
```

If a candidate is already decisioned, return:

```text
409 decision_conflict
```

No repeated overwrites should be allowed in the first implementation.

## Reason Validation

`decision_reason` is required at the application layer.

Recommended implementation rules:

```text
trim string
minimum length: 3
maximum length: 200
blank rejected
HTML not needed
```

Invalid reason should return:

```text
400 invalid_reason
```

No DB migration should be added for reason validation in Phase 19O unless separately approved.

## Notes Validation

`decision_notes` is optional.

Recommended implementation rules:

```text
undefined -> null
null -> null
trim string
blank string -> null
maximum length: 1000
```

Invalid notes should return:

```text
400 invalid_notes
```

The DB already enforces the 1000-character maximum.

## Audit Event Plan

Every successful mutation must insert exactly one audit event:

```text
action = candidate_decision
```

Recommended metadata:

```ts
{
  candidate_id: string;
  action: DiscoveryCandidateDecisionAction;
  previous_candidate_status: string | null;
  next_candidate_status: string;
  decision_reason: string;
  has_decision_notes: boolean;
  duplicate_of_candidate_id: string | null;
  duplicate_of_tool_id: null;
  request_correlation_id: string | null;
}
```

The audit event must not use:

```text
publish_candidate
promote_candidate
insert_public_tool
```

## Transaction Boundary Requirement

This is the main implementation risk.

A helper-first Supabase implementation using sequential queries would likely perform:

1. read candidate
2. validate state
3. update candidate row
4. insert audit event

That sequence is not strictly atomic unless wrapped in a database transaction or RPC.

Phase 19N recommends documenting the chosen implementation strategy before code is written.

### Option A — Helper-first sequential implementation

Acceptable only if Gemini approves the known risk.

Required mitigations:

- update candidate with a status precondition in the update filter
- verify exactly one row was updated
- insert audit event immediately after update
- return success only if audit insert succeeds
- if audit insert fails, return `500 mutation_failed`
- include implementation review note that update/audit can become inconsistent in a mid-request failure
- add a required follow-up phase for RPC hardening

### Option B — RPC-backed implementation

Preferred if strict audit atomicity is required before route launch.

Recommended RPC name:

```text
public.admin_apply_discovery_candidate_decision(...)
```

RPC responsibilities:

- validate candidate exists
- validate current status
- update candidate decision fields
- insert candidate_decision audit event
- return updated candidate row
- execute update and audit insert atomically

RPC requires separate migration draft, review, apply gate, type generation, and live smoke.

### Phase 19N Recommendation

Phase 19N recommends Gemini choose one of these before implementation:

```text
Proceed helper-first in Phase 19O with documented non-atomic boundary and required RPC follow-up.
```

or

```text
Insert RPC design/draft phases before route implementation.
```

## Proposed Future Route Status Mapping

| helper code | HTTP status |
|---|---:|
| `candidate_not_found` | 404 |
| `invalid_action` | 400 |
| `invalid_reason` | 400 |
| `invalid_notes` | 400 |
| `invalid_duplicate_target` | 400 |
| `decision_conflict` | 409 |
| `mutation_failed` | 500 |

Admin and route errors:

| case | HTTP status |
|---|---:|
| unauthenticated | 401 |
| non-admin | 403 |
| invalid CSRF | 403 |
| rate limited | 429 |
| malformed JSON | 400 |
| invalid path candidate ID | 400 |

## Future API Smoke Plan

Future smoke file:

```text
testing/discovery-candidate-decision-api-smoke.mjs
```

The smoke should be opt-in only.

Recommended opt-in env var:

```text
AIFINDER_RUN_DISCOVERY_CANDIDATE_DECISION_API_SMOKE=1
```

The smoke should verify:

- missing CSRF rejected
- missing admin session rejected if test harness supports it
- invalid action rejected
- missing reason rejected
- notes over 1000 rejected
- duplicate without target rejected
- duplicate self-reference rejected
- approve_for_draft succeeds for exact-ID candidate
- reject succeeds for exact-ID candidate
- needs_more_evidence succeeds for exact-ID candidate
- archive succeeds for exact-ID candidate
- duplicate succeeds with exact-ID target candidate
- candidate_decision audit event inserted
- decision_conflict on already decisioned candidate
- no `public.tools` rows match smoke marker
- no `discovered_tools` rows match smoke marker
- exact-ID cleanup before and after

## Future Unit or Integration Checks

If existing test infrastructure supports direct helper testing, add tests for:

- action allow-list
- reason normalization
- notes normalization
- duplicate target validation
- candidate status mapping
- conflict rules
- forbidden publish markers

If no existing unit test setup exists, use a smoke-first approach with a clearly opt-in live harness.

## Rate Limit Plan

Add a future admin mutation rate-limit action key:

```text
discoveryCandidateDecisionMutation
```

The implementation should use existing rate-limit utilities and match existing admin mutation route behavior.

No package changes should be required.

## CSRF and Admin Auth Plan

The route should follow existing admin mutation patterns:

- read admin session using existing helper
- reject unauthenticated users
- reject non-admin users
- verify CSRF using existing admin CSRF helper
- avoid duplicating auth logic if shared helpers exist

Implementation should inspect nearby admin mutation routes before coding.

Recommended examples to inspect:

```text
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
```

## Generated Type Usage

Implementation must use generated database types from:

```text
lib/supabase/database.types.ts
```

It should not use untyped `any` for the database candidate row shape unless narrowly justified.

Required type-backed fields:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
candidate_status
```

## Future File Scope

Phase 19O helper-first implementation file scope, if approved:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
lib/discovery/discovery-candidate-decision-admin.ts
testing/discovery-candidate-decision-api-smoke.mjs
```

Optional if needed:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

Possible existing file update:

```text
lib/rate-limit.ts
```

or whichever existing rate-limit registry file currently owns admin action keys.

Phase 19O should not modify:

```text
public tools writing helpers
discovered tools publishing helpers
homepage control
public submit route
crawler/extraction executors
Supabase migrations
generated database types
admin candidate queue UI
```

unless separately approved.

## Implementation Order

Recommended Phase 19O implementation order:

1. inspect existing admin auth, CSRF, Supabase admin client, and rate-limit patterns
2. add candidate decision validation types/helper
3. add candidate decision admin helper
4. add route
5. add opt-in smoke harness
6. run `npm run check`
7. run `git diff --check`
8. run smoke opt-out guard
9. do not run live smoke until exact approval phrase is supplied
10. produce CCR with Desktop/Tablet/Mobile marked not applicable for API-only phase

## Required Human Approval Gates

Separate approval required for:

```text
live API smoke execution
RPC migration draft
RPC migration apply
Supabase DB push
type generation
UI decision buttons
public tools publishing workflow
duplicate_of_tool_id wiring
```

## Non-Goals

Phase 19N does not:

- implement the mutation route
- implement helper code
- implement validation code
- implement tests or smoke harness
- add rate-limit key
- run live mutation smoke
- run API smoke
- run schema apply
- run Supabase DB push
- run type generation
- write to candidate rows
- write to audit events
- write to public.tools
- write to discovered_tools
- publish candidates
- introduce an RPC
- modify RLS
- modify migrations
- wire UI decision buttons

## Gemini Review Decision

Gemini approved Phase 19N for commit and selected the RPC-first path before route implementation.

Approved next path:

```text
Require Phase 19O — Candidate Decision Mutation RPC Draft before route implementation
```

Reason:

```text
Candidate decision mutation spans discovery_candidate_tools update plus discovery_audit_events insert.
An RPC is required to guarantee transactional atomicity and avoid orphaned candidate state changes if an audit insert fails.
```

Phase 19O must remain draft-only unless separately approved to apply a migration.

## Recommended Next Phase

If Gemini approves helper-first:

```text
Phase 19O — Candidate Decision Mutation API Helper/Route Implementation
```

If Gemini requires strict atomicity first:

```text
Phase 19O — Candidate Decision Mutation RPC Draft
```

## Gemini Review Questions

Gemini should review:

```text
Is this implementation plan specific enough for Codex/Cline?
Should Phase 19O proceed helper-first, or should RPC be designed/drafted first?
Are the route/helper file boundaries correct?
Are validation rules correct?
Are conflict rules conservative enough?
Is deferring duplicate_of_tool_id still correct?
Is the smoke plan sufficient?
Are no-publish/no-tools/no-discovered-tools boundaries preserved?
Should Phase 19N be committed?
What exact next phase should be authorized?
```

## Conclusion

Phase 19N provides a bounded implementation plan for the Candidate Decision Mutation API.

The only unresolved architecture choice is whether to proceed helper-first with explicit non-atomic audit risk or to introduce an RPC-backed transaction before route launch.

No implementation should begin until Gemini explicitly approves the next implementation path.
