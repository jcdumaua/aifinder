# Phase 14Z — Candidate Staging Queue API Read Route Post-Implementation Review

## Status

Post-implementation review only.

This phase reviews the Phase 14Y candidate staging queue API read route after it
was implemented, Gemini-approved, committed, and pushed to `main`.

Phase 14Z does not implement new behavior, does not create an API route, does
not create route tests, does not add UI, does not run a live database query,
does not mutate candidate rows, does not write to public tools, does not write
to discovered tools, and does not publish anything.

## Phase 14Y pushed commit

Phase 14Y was pushed to `main` with commit:

```text
67ed72d Add candidate staging queue API route
```

The pushed GitHub update was:

```text
17a7f1d..67ed72d main -> main
```

Final repo status after push was:

```text
## main...origin/main
```

## Files implemented by Phase 14Y

Route file:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

Route test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

Phase 14Y intentionally changed no UI files.

## Implemented route

The implemented route is:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The route is an admin-only, GET-only, read-only HTTP boundary for the existing
Phase 14V helper:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

## Route boundary review

Phase 14Y preserved the approved route boundary:

```text
Admin-only.
GET-only.
Read-only.
No POST route.
No PUT route.
No PATCH route.
No DELETE route.
No route-level insert.
No route-level update.
No route-level upsert.
No route-level delete.
No route-level rpc.
No public tools write.
No discovered_tools write.
No publish action.
```

The route exports only:

```text
GET
```

The route does not implement mutation methods.

## Auth boundary review

The route uses the existing admin session pattern:

```text
verifyAdminSession(...)
```

The unauthenticated request path returns:

```text
401 unauthorized
```

The fake/mock route test verifies that unauthenticated requests fail before
client creation.

This means the Supabase admin client is not created for unauthenticated
requests.

## Supabase client boundary review

The route creates the Supabase admin read client only after admin auth passes.

The route adapts the wider Supabase admin client to the helper's narrow read
client interface with:

```text
supabaseAdmin as unknown as CandidateStagingQueueReadClient
```

Gemini approved this double-cast as acceptable for adapting a wide backend
client to a narrow domain-specific read interface.

The route does not expose:

```text
Service-role credentials.
Environment variables.
Connection strings.
Raw Supabase errors.
Stack traces.
Unsafe raw payloads.
```

## Query parsing review

The route parses the approved query parameters:

```text
statuses
search
discoverySourceId
discoveryRunId
auditCorrelationId
duplicateCheckStatus
confidenceBucket
limit
cursor
sortKey
sortDirection
```

The route intentionally keeps parsing thin and delegates strict validation to:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

This preserves the Phase 14V helper as the single source of truth for active
status validation, bounded limits, cursor behavior, UUID validation, sorting,
search normalization, safe projection, and archived/rejected exclusion.

## Response shape review

The success response uses a safe discriminated shape:

```text
ok: true
items
nextCursor
appliedStatuses
totalCount
```

The error response uses a safe discriminated shape:

```text
ok: false
error.code
error.message
```

The route maps helper errors to safe HTTP responses:

```text
invalid_status_filter -> 400
invalid_limit -> 400
invalid_cursor -> 400
invalid_sort_key -> 400
invalid_sort_direction -> 400
invalid_uuid_filter -> 400
candidate_queue_read_failed -> 500
unknown error -> 500 candidate_queue_read_failed
```

The route does not pass raw error messages or raw stack traces to the browser.

## Active queue behavior review

The route preserves the Phase 14V active queue behavior through the helper:

```text
Default statuses: staged, needs_review, duplicate_suspected.
Archived rows excluded by default.
Rejected rows excluded by default.
Inactive statuses rejected when requested.
Safe projected fields only.
```

The archived Phase 14 smoke artifact remains excluded by default through the
helper status allowlist and is not special-cased by the route:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status=archived
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

## Phase 14Y verification review

Phase 14Y verification passed before commit:

```text
Phase 14Y candidate staging queue API route tests passed: 14/14
Phase 14V read model helper tests passed: 14/14
GET-only static guard: no matches
Route mutation guard: no matches
Helper mutation guard: no matches
npm run check: passed
git diff --check: passed
```

The Next.js build output included the new dynamic route:

```text
ƒ /api/admin/discovery/candidate-staging-queue
```

## Route tests reviewed

The Phase 14Y route test covers:

```text
GET unauthenticated request fails with 401 unauthorized before client creation.
GET admin request calls listDiscoveryCandidateStagingQueueItems with defaults.
GET comma-separated statuses are parsed for the helper.
GET optional filters are passed through to the helper.
GET archived status maps helper invalid_status_filter to 400.
GET rejected status maps helper invalid_status_filter to 400.
GET invalid limit maps helper invalid_limit to 400.
GET invalid sortKey maps helper invalid_sort_key to 400.
GET invalid sortDirection maps helper invalid_sort_direction to 400.
GET invalid UUID maps helper invalid_uuid_filter to 400.
GET cursor maps helper invalid_cursor to 400.
GET helper failure maps to 500 candidate_queue_read_failed safely.
GET unknown helper error maps to 500 candidate_queue_read_failed safely.
Route source keeps GET-only and mutation-free boundaries.
```

## Static guard review

The GET-only guard remains:

```bash
rg -n "export async function (POST|PUT|PATCH|DELETE)|export const (POST|PUT|PATCH|DELETE)" app/api/admin/discovery/candidate-staging-queue/route.ts
```

Expected result:

```text
No matches.
```

The route mutation guard remains:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" app/api/admin/discovery/candidate-staging-queue/route.ts
```

Expected result:

```text
No matches.
```

The helper mutation guard remains:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

Expected result:

```text
No matches.
```

## Risk review

Remaining risks are intentionally deferred:

```text
No live route smoke has been run.
No admin UI consumes the route yet.
No cursor pagination implementation exists yet.
No candidate mutation workflow exists yet.
```

These are acceptable because Phase 14Y was scoped to an admin-only read route and
fake/mock route tests only.

## Recommended next phase

Recommended next phase:

```text
Phase 15A — Candidate Staging Queue Admin UI Design
```

Phase 15A should be docs-only and should design the future admin UI consumer of
the secure route before any UI implementation.

The design should cover:

```text
Admin-only UI entry point.
Read-only queue table.
Safe empty/loading/error states.
Filters for active statuses and search.
No approval/publish/reject/archive mutation buttons yet.
No public tools write.
No discovered_tools write.
No publish action.
No live DB smoke unless separately approved.
```

## Commit and push gates

Phase 14Z itself is docs-only and may be committed after Gemini approval.

Push still requires explicit push approval.

Future live database access remains prohibited unless a future phase provides a
narrow read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 14Z does not perform:

```text
No implementation.
No API route creation.
No route test creation.
No helper changes.
No UI creation.
No live database query.
No DB mutation.
No candidate insert.
No candidate update.
No candidate delete.
No public tools write.
No discovered_tools write.
No publish action.
No approval action.
No promotion action.
No archive action.
No reject action.
No schema migration.
No type generation.
No package change.
No crawler activation.
No LLM extraction activation.
```
