# Phase 13G — Read-Only Candidate Preview API Route Implementation Plan

## 1. Status

Phase 13G is docs-only.

This phase does not create an API route, modify UI, modify the candidate preview provider, modify tests, modify package files, modify migrations, regenerate types, run Supabase commands, run DB commands, run live staging, send POST requests, fetch CSRF, create preview artifacts, stage candidates, write public.tools, write discovered_tools, run crawler code, or run LLM code.

## 2. Current Confirmed State

Latest pushed commit before Phase 13G:

- b75b178 Add read-only candidate preview provider

Phase 13F added:

- lib/discovery/discovery-candidate-preview-provider.ts
- testing/discovery-candidate-preview-provider.test.mjs

The provider is server-only, dependency-injected, read-only, and returns sanitized candidate preview data only.

Existing admin API route style uses:

- verifyAdminSession(request)
- runtime = "nodejs"
- dynamic = "force-dynamic"
- Cache-Control: no-store
- X-Content-Type-Options: nosniff

## 3. Future Route Goal

Future route:

- GET /api/admin/discovery/runs/[id]/candidate-preview?source_id=:sourceId

The route should answer:

Can an authenticated admin retrieve one sanitized candidate preview for one exact discovery run and one exact discovery source?

The route must not mutate anything.

## 4. Recommended Future Route File

Future route file:

- app/api/admin/discovery/runs/[id]/candidate-preview/route.ts

Future method:

- GET only

No POST export should exist.

## 5. Authentication Contract

The route must call:

- verifyAdminSession(request)

If admin session is missing or invalid:

- return 401 Unauthorized

The route must derive admin actor server-side from the session.

The client must not provide admin identity.

If server-derived actor is unavailable:

- return 403

## 6. CSRF Contract

The route should not require CSRF if it remains:

- GET-only
- read-only
- no request body
- no audit write
- no mutation
- no staging
- no live action

If a later phase adds read-audit writes, the route must be redesigned and reviewed separately.

## 7. Request Parsing Contract

Parse:

- discoveryRunId from route params id
- discoverySourceId from query parameter source_id

Do not parse JSON body.

Do not accept candidate payloads.

Do not accept client-supplied admin identity.

## 8. Provider Invocation Contract

The route should call:

- getCandidateExtractionPreviewForRun({
    discoveryRunId,
    discoverySourceId,
    requestingAdminActorId
  })

The route should not call:

- staging helpers
- candidate extraction invocation helpers
- crawler helpers
- LLM helpers
- public tools helpers
- discovered tools mutation helpers
- Supabase mutations

## 9. Response Contract

The route should return provider output wrapped in a safe data object.

Accepted preview response should include:

- accepted
- rejected
- rejectionCode
- previewStatus
- preview
- safetyFlags
- auditCorrelationId
- noPublicWriteConfirmed
- noDiscoveredWriteConfirmed

Rejected provider results should still return safe structured data.

The route must never return:

- raw database rows
- preview artifact id
- created_at
- updated_at
- Supabase error details
- SQL errors
- stack traces
- raw HTML
- raw LLM output
- cookies
- CSRF tokens
- service-role details

## 10. Response Headers

Use the existing jsonResponse pattern:

- Cache-Control: no-store
- X-Content-Type-Options: nosniff

## 11. HTTP Status Mapping

Recommended first mapping:

- 401 for unauthenticated admin session
- 403 for missing server-derived admin actor
- 400 for clearly invalid route/query input if rejected before provider call
- 200 for accepted provider result
- 200 for safe unavailable, pending, blocked, stale, unsafe, or ambiguous provider result
- 500 for unexpected route exceptions

Rationale:

Provider-level rejection is an application state, not necessarily a transport failure.

## 12. Safe Rejection Codes

The route may pass through provider rejection codes because they are safe:

- missing_discovery_run_id
- missing_discovery_source_id
- missing_admin_actor
- discovery_run_not_found
- discovery_run_source_mismatch
- preview_artifact_unavailable
- preview_artifact_schema_unsupported
- preview_artifact_stale
- preview_artifact_blocked
- preview_artifact_unsafe
- preview_artifact_ambiguous
- preview_candidate_missing_name
- preview_candidate_missing_website
- preview_candidate_unsafe_website

Do not replace these with raw database errors.

## 13. Future Route Tests

Future route tests should prove:

- unauthenticated request returns 401
- missing source_id returns safe rejection or 400
- invalid run id returns safe rejection or 400
- admin actor is server-derived
- accepted provider result returns 200
- unavailable provider result returns 200
- blocked provider result returns 200
- stale provider result returns 200
- ambiguous provider result returns 200
- response uses no-store
- response uses nosniff
- route exports GET only
- route has no POST export
- route does not import CSRF verification
- route does not call staging helpers
- route does not call crawler or LLM helpers
- route does not call insert, upsert, update, or delete
- route does not return raw database fields

## 14. Future Implementation Touchpoints

Allowed in future route implementation phase:

- app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
- testing/discovery-candidate-preview-route.test.mjs

Optional only if separately approved:

- lib/admin-rate-limit.ts

Forbidden in first route implementation:

- UI components
- provider behavior changes
- migrations
- generated types
- package files
- live staging helpers
- candidate staging helpers
- crawler helpers
- LLM helpers

## 15. Future UI Contract

A later UI phase may fetch:

GET /api/admin/discovery/runs/${runId}/candidate-preview?source_id=${sourceId}

with:

- method GET
- cache no-store
- credentials same-origin

The UI must still avoid POST, CSRF fetch, dry_run false, live staging activation, and client-supplied candidate payloads.

Displaying a preview must not mean staging is enabled.

## 16. Stop Conditions

Future route implementation must stop if it requires:

- POST
- CSRF fetch
- request body parsing
- preview artifact creation
- preview artifact update
- candidate staging
- public tool publishing
- public.tools write
- discovered_tools write
- discovery_candidate_tools write
- audit write without separate audit design
- migration
- type generation
- DB push
- remote SQL
- UI wiring
- crawler execution
- LLM execution
- live staging
- dry_run false activation
- multi-candidate selection
- raw database row exposure

## 17. Recommended Future Phase Sequence

Recommended next phases:

1. Phase 13H — Read-Only Candidate Preview API Route Implementation
   - implement GET route only
   - add route tests only
   - no UI wiring
   - no live staging

2. Phase 13I — Candidate Preview API Route Result Documentation
   - docs-only result summary after route implementation

3. Phase 13J — Disabled Scaffold Read-Only Preview Wiring Plan
   - docs-only UI wiring plan
   - live staging remains disabled

## 18. Phase 13G Verification Plan

Run:

- git diff --check
- npm run check
- git diff --stat
- git diff --name-only
- git status --short --branch

Expected changed file:

- docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md

Expected forbidden changes:

- no app/api files
- no UI component files
- no provider files
- no test files
- no package files
- no migration files
- no generated type files

## 19. Commit Readiness Criteria

Phase 13G is safe to commit only if:

- Gemini approves the document
- verification passes
- only this Phase 13G docs file is staged
- no route is created
- no UI is changed
- no provider is changed
- no tests are changed
- no migration is changed
- no generated types are changed
- no live commands are run
- no DB commands are run
- no POST requests are sent
- no CSRF fetch occurs
- no live staging occurs
