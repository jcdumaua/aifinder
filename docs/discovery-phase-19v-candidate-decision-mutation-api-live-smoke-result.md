# Discovery Phase 19V — Candidate Decision Mutation API Live Smoke Result

## Status

Phase 19V documents the successful Phase 19U live smoke execution for the Candidate Decision Mutation API.

Result:

```text
PASSED
```

Baseline commit at execution time:

```text
945b629 Document candidate decision API smoke gate
```

Live API route verified:

```text
POST /api/admin/discovery/candidate-staging-queue/[id]/decision
```

Required live approval phrase used before execution:

```text
Approve Phase 19T live candidate decision API smoke
```

Smoke marker:

```text
phase-19u-candidate-decision-api-smoke:1f568c57
```

## Phase Relationship

Phase 19T created and pushed the live smoke gate.

Phase 19U executed the live API smoke after explicit approval.

Phase 19V records the result and does not rerun the smoke.

## Pre-Smoke Verification Passed

Before the live API smoke executed, the script verified:

```text
exact live-smoke approval phrase accepted
AIFINDER_RUN_DISCOVERY_CANDIDATE_DECISION_API_SMOKE=1 accepted
branch was main
local HEAD was 945b629
origin/main was 945b629
working tree was clean
Phase 19S static assertions passed
npm run check passed
git diff --check passed
required environment variables were present
```

The Next.js production build included:

```text
/api/admin/discovery/candidate-staging-queue/[id]/decision
```

## Live Fixtures Created

The live smoke created exact-ID fixtures only.

```text
discovery_sources: 2cbc5296-d466-4f6d-957b-92e229cc8ea3
discovery_runs: 7b2feed6-2d67-47a2-a2c6-53c9cbc3873c
positive candidate: 7dc2e0a3-f3e0-4369-9f72-04c9356cf3ea
conflict candidate: 138d4dcd-b2b7-4e86-a103-a72c22016395
```

These fixture IDs were printed in the smoke output and then cleaned up by exact ID.

## Negative HTTP API Paths Verified

The smoke verified the expected safe failure responses:

```text
unauthenticated request returned 401
missing CSRF request returned 403
invalid candidate UUID returned 400
invalid decision action returned 400
missing reason returned 400
short reason returned 400
notes too long returned 400
client-supplied admin identity returned 400
duplicate_of_tool_id returned 400
duplicate action without duplicate_of_candidate_id returned 400
already-decisioned candidate returned 409
```

## Positive HTTP API Path Verified

The smoke verified the positive decision path:

```text
action: approve_for_draft
expected HTTP status: 200
expected candidate_status: approved_for_draft
expected decision_action: approve_for_draft
expected audit action: candidate_decision
```

The smoke verified database readback for:

```text
candidate_status
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
```

## Conflict Path Verified

The smoke decisioned a second candidate successfully, then attempted a second decision against that already-decisioned candidate.

Expected result:

```text
HTTP 409
decision_conflict
```

This confirmed that the API and RPC reject second decisions once a candidate has left the allowed decisionable status set.

## Audit Event Verified

The smoke verified the RPC-created audit event by request correlation ID.

Expected audit action:

```text
candidate_decision
```

Expected audit metadata included:

```text
candidate_id
action
previous_candidate_status
next_candidate_status
decision_reason
has_decision_notes
duplicate_of_candidate_id
duplicate_of_tool_id
request_correlation_id
```

## Forbidden Boundary Checks Passed

The smoke verified:

```text
no public.tools rows matched the smoke marker
no discovered_tools rows matched the smoke marker
no candidate_status = published was produced
no promoted_to_publish_draft status was produced
no UI decision button was required or created
```

Approve-for-draft remained not publish.

No public publishing workflow was executed.

## Cleanup Verified

The smoke performed exact cleanup after execution.

Cleanup result:

```text
Cleanup delete operations completed.
Exact cleanup verified.
```

Verified cleanup included:

```text
candidate fixtures removed
discovery run fixture removed
discovery source fixture removed
candidate_decision audit events for smoke request correlation IDs removed
```

## Final Repository Status After Smoke

After the live smoke completed:

```text
## main...origin/main
945b629 Document candidate decision API smoke gate
```

The smoke did not create source changes or commits.

## Preserved Boundaries

The live smoke did not:

- run `supabase db push`
- run schema apply
- run migration apply
- run type generation
- write to `public.tools`
- write to `discovered_tools`
- publish candidates
- implement UI decision buttons
- leave smoke fixtures behind
- commit
- push

## Result Summary

Phase 19U successfully verified the Candidate Decision Mutation API end-to-end through:

```text
admin HTTP route
admin session enforcement
CSRF enforcement
request validation
rate-limit route wiring
RPC helper
database candidate mutation
candidate_decision audit event
conflict handling
forbidden publish/tool/discovered-tools boundary checks
exact cleanup
```

## Recommendation

Phase 19V should be reviewed and committed as a docs-only result record.

Recommended next phase after commit and push:

```text
Phase 19W — Candidate Decision Admin UI Design
```

Phase 19W should design the admin UI controls for decisioning candidate staging queue rows.

It should remain design-only unless a later implementation phase is explicitly approved.
