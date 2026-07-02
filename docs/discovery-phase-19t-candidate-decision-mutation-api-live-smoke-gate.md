# Discovery Phase 19T — Candidate Decision Mutation API Live Smoke Gate

## Status

Phase 19T defines the live API smoke gate for the Candidate Decision Mutation API.

Baseline commit:

```text
4961eb2 Implement candidate decision mutation API
```

Implemented route from Phase 19S:

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

Static assertions file:

```text
testing/discovery-candidate-decision-api-static-assertions.mjs
```

## Gate Purpose

This gate exists because the Phase 19S implementation has been statically verified, but the HTTP-to-RPC path has not yet been verified through a live admin API smoke.

The live smoke must verify that:

- admin session enforcement works
- CSRF enforcement works
- request validation works
- rate-limit action wiring does not break the route
- the route calls the RPC-backed helper
- the RPC applies a candidate decision through the API path
- the response shape is safe and expected
- cleanup removes exact smoke fixtures
- forbidden publish/tool/discovered-tools boundaries remain intact

## Required Approval Phrase Before Live Smoke Execution

The live API smoke may not run until James explicitly sends exactly:

```text
Approve Phase 19T live candidate decision API smoke
```

Without that phrase, no live API request that mutates candidate rows may be executed.

## Proposed Future Live Smoke Scope

The future live smoke should be a separate execution phase or explicitly approved continuation of this phase.

The future smoke should create exact-ID fixtures only, then clean them up by exact ID:

```text
discovery_sources
discovery_runs
discovery_candidate_tools
discovery_audit_events
```

The future smoke should not touch unrelated rows.

## Proposed Positive API Path

The future smoke should verify at least one positive API decision through HTTP:

```text
POST /api/admin/discovery/candidate-staging-queue/[candidateId]/decision
```

Recommended positive action:

```text
approve_for_draft
```

Expected post-decision status:

```text
approved_for_draft
```

Expected audit action:

```text
candidate_decision
```

The smoke should confirm that the route response includes:

```text
ok: true
candidate.candidateId
candidate.candidateStatus
candidate.decisionAction
candidate.decisionReason
candidate.decidedAt
candidate.decidedBy
```

## Proposed Negative API Paths

The future smoke should verify safe negative paths:

```text
unauthenticated request returns 401
missing/invalid CSRF returns 403
invalid candidate UUID returns 400
invalid decision action returns 400
missing reason returns 400
reason shorter than 3 characters returns 400
notes longer than 1000 characters returns 400
client-supplied admin identity returns 400
duplicate_of_tool_id returns 400
duplicate action without duplicate_of_candidate_id returns 400
already-decisioned candidate returns 409
```

## Proposed Forbidden Boundary Checks

The future live smoke must verify:

```text
no public.tools rows match the smoke marker
no discovered_tools rows match the smoke marker
no candidate_status = published is produced
no promoted_to_publish_draft status is produced
no UI decision button is required or created
```

Approve for draft remains not publish.

Public tools write remains forbidden until a separate publish workflow phase is approved.

## Required Pre-Smoke Verification

Before any future live smoke execution, the smoke execution script must verify:

```text
branch is main
working tree is clean
local main matches origin/main
latest commit is the pushed Phase 19T gate or later approved smoke script commit
npm run check passes
node testing/discovery-candidate-decision-api-static-assertions.mjs passes
git diff --check passes
required env vars are present
```

Expected env vars for an HTTP route smoke may include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SESSION_SECRET
```

If the smoke starts a local Next.js server, it must use a bounded local port and shut it down.

## Required Cleanup Rules

The future live smoke must:

- create unique smoke marker
- create exact-ID fixtures when possible
- delete only exact-ID fixture rows
- verify cleanup after success
- verify cleanup after failure
- print created IDs
- print cleanup result
- fail closed if cleanup cannot be verified

## Phase 19T Gate Verification Performed

This gate verified:

```text
repo clean and synced at Phase 19S baseline
Phase 19S route markers present
Phase 19S helper markers present
Phase 19S validation markers present
Phase 19S rate-limit markers present
Phase 19S static assertion script present
no publish/tools/discovered_tools forbidden markers in route/helper/validation
node testing/discovery-candidate-decision-api-static-assertions.mjs passes
npm run check passes
git diff --check passes
```

## Preserved Boundaries

Phase 19T gate did not:

- run the live API smoke
- send HTTP mutation requests
- run `supabase db push`
- run schema apply
- run migration apply
- run type generation
- mutate candidate rows
- mutate audit rows
- create discovery source fixtures
- create discovery run fixtures
- create candidate fixtures
- write to public tools
- write to discovered tools
- publish candidates
- implement UI decision buttons
- create a publish workflow
- commit
- push

## Recommended Next Phase

Recommended next phase after Gemini review, commit, and push:

```text
Phase 19U — Candidate Decision Mutation API Live Smoke Execution
```

This next phase still requires the exact live-smoke approval phrase before execution:

```text
Approve Phase 19T live candidate decision API smoke
```

## Gemini Review Questions

Gemini should review:

```text
Does this gate define a safe and sufficient live API smoke scope?
Are the positive and negative HTTP API cases sufficient?
Are the cleanup rules strict enough for live mutation testing?
Is the approval phrase clear enough to prevent accidental live data mutation?
Should Phase 19T be committed?
Should the next phase be Phase 19U live smoke execution after explicit approval?
```

## Conclusion

Phase 19T established the live API smoke gate and exact approval phrase for Candidate Decision Mutation API live smoke execution.
