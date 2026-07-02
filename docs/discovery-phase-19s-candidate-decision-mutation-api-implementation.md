# Discovery Phase 19S — Candidate Decision Mutation API Implementation

## Status

Phase 19S implemented the RPC-backed Candidate Decision Mutation API.

Baseline commit:

```text
115b6a6 Generate candidate decision RPC types
```

Implemented route:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Route file:

```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
```

Helper file:

```text
lib/discovery/discovery-candidate-decision-admin.ts
```

Validation file:

```text
lib/discovery/discovery-candidate-decision-validation.ts
```

Rate-limit file:

```text
lib/admin-rate-limit.ts
```

Static assertion file:

```text
testing/discovery-candidate-decision-api-static-assertions.mjs
```

## Implemented Scope

Phase 19S implemented:

- admin-only mutation route
- CSRF requirement
- admin rate-limit action `discoveryCandidateDecisionMutation`
- request body size guard
- JSON-only request guard
- route-param candidate UUID validation
- action allow-list validation
- decision reason validation
- decision notes validation
- duplicate-of-candidate validation
- duplicate-of-tool rejection for initial implementation
- server-derived admin actor label
- RPC-backed service-role mutation helper
- safe RPC error mapping
- static source assertions

## Allowed Actions

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

## RPC Used

```text
public.admin_apply_discovery_candidate_decision(...)
```

## Expected Request Body

Supported body fields:

```text
action or decision_action
reason or decision_reason
notes or decision_notes
duplicate_of_candidate_id or duplicateOfCandidateId
request_correlation_id or requestCorrelationId
```

`duplicate_of_tool_id` / `duplicateOfToolId` is explicitly rejected in this implementation.

Client-supplied admin identity fields are rejected.

## Response Shape

Success response:

```json
{
  "ok": true,
  "candidate": {
    "candidateId": "uuid",
    "candidateStatus": "approved_for_draft",
    "decisionAction": "approve_for_draft",
    "decisionReason": "Reason text",
    "decisionNotes": null,
    "decidedAt": "timestamp",
    "decidedBy": "admin",
    "duplicateOfCandidateId": null,
    "duplicateOfToolId": null
  }
}
```

Error response:

```json
{
  "ok": false,
  "error": {
    "code": "decision_conflict",
    "message": "Candidate is no longer reviewable."
  }
}
```

## Verification Performed

Phase 19S verification ran:

```text
node testing/discovery-candidate-decision-api-static-assertions.mjs
npm run check
git diff --check
```

## Preserved Boundaries

Phase 19S did not:

- run `supabase db push`
- run schema apply
- run migration apply
- run type generation
- run live mutation smoke
- run API smoke
- mutate candidate rows
- mutate audit rows directly
- write to public tools
- write to discovered tools
- publish candidates
- implement UI decision buttons
- create a publish workflow
- commit
- push

Approve for draft does not publish.

Public tools write remains forbidden until a separate publish workflow phase is approved.

No UI decision buttons are implemented in this phase.

## Recommended Next Phase

Recommended next phase after Gemini review, commit, and push:

```text
Phase 19T — Candidate Decision Mutation API Static/Unit Verification
```

Alternative if Gemini approves moving directly to live API smoke:

```text
Phase 19T — Candidate Decision Mutation API Live Smoke Gate
```

## Gemini Review Questions

Gemini should review:

```text
Does the route follow existing admin route conventions?
Does the route enforce admin session, CSRF, and rate limiting?
Does the validation layer correctly enforce action/reason/notes/duplicate constraints?
Does the helper call only public.admin_apply_discovery_candidate_decision?
Are duplicate_of_tool_id and client-supplied admin identity correctly rejected?
Are no-publish/no-tools/no-discovered-tools boundaries preserved?
Is Phase 19S approved to commit?
Should the next phase be static/unit verification or live API smoke gate?
```

## Conclusion

Phase 19S implemented the Candidate Decision Mutation API using the already-applied and type-generated RPC.
