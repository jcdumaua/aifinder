# Phase 14X — Candidate Staging Queue API Read Route Implementation Plan

## Status

Draft implementation plan only.

This phase maps the Phase 14W candidate staging queue API read route design to
exact future implementation files, route behavior, tests, and verification
steps.

This phase does not implement an API route, does not add route tests, does not
add UI, does not query the live database, does not mutate candidate rows, does
not write to public tools, does not write to discovered tools, and does not
publish anything.

## Background

Phase 14V implemented and pushed the helper-only candidate staging queue read
model to `main` with commit:

```text
90707a9 Add candidate staging queue read model
```

Phase 14W designed the future admin-only API read route and was pushed to
`main` with commit:

```text
3b9b09f Document candidate staging queue API route design
```

Phase 14X now plans the exact implementation of the route without writing code.

## Implementation objective

Planned future route:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The next implementation phase should add an admin-only `GET` route that uses the
existing Phase 14V helper:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

The route must:

```text
Be GET-only.
Be admin-only.
Be read-only.
Use the existing admin auth/session boundary.
Create the Supabase admin/server client only inside the server route boundary.
Call listDiscoveryCandidateStagingQueueItems(parsedInput, { client }).
Return safe success and error response shapes.
Map helper validation errors to safe HTTP status codes.
Avoid raw SQL.
Avoid route-level mutation.
Avoid public tools writes.
Avoid discovered_tools writes.
Avoid publish/approval/promotion actions.
```

## Recommended next implementation phase

Recommended next phase:

```text
Phase 14Y — Candidate Staging Queue API Read Route Implementation
```

Phase 14Y should implement only:

```text
The admin-only GET route.
The route fake/mock tests.
Static mutation guards.
No admin UI.
No live database smoke unless separately approved.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```

## Files to add in Phase 14Y

Route file:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

Route test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

No other files should be required for the first route implementation.

If the implementation discovers a need for shared route parsing helpers, shared
test utilities, or package changes, pause and request review before expanding
scope.

## Files not to change in Phase 14Y

Phase 14Y should not change:

```text
components/admin/discovery/*
app/admin/discovery/*
supabase/migrations/*
lib/supabase/database.types.ts
package.json
package-lock.json
```

Exception:

```text
package.json may only change if a new test script is explicitly approved later.
```

Preferred Phase 14Y verification runs the route test directly with `node`.

## Pre-implementation inspection requirement

Before writing the route, Phase 14Y should inspect existing admin API route
patterns and reuse the established project conventions.

Recommended local inspection targets:

```text
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/csrf/route.ts
app/api/admin/session/route.ts
```

The implementation should identify:

```text
Existing admin session/auth helper.
Existing Supabase admin/server client creation pattern.
Existing safe JSON response pattern.
Existing error response pattern.
Existing route test style.
```

The implementation must not introduce a new auth system unless separately
approved.

## Route method plan

The route should export only:

```ts
export async function GET(request: Request) {
  // parse query params
  // verify admin session
  // create server/admin Supabase client
  // call listDiscoveryCandidateStagingQueueItems(parsedInput, { client })
  // return safe JSON
}
```

The route must not export:

```text
POST
PUT
PATCH
DELETE
```

The route must not include:

```text
insert(
update(
upsert(
delete(
rpc(
```

## Query parameter parsing plan

The route should parse these query parameters:

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

`statuses` parsing:

```text
If omitted: pass undefined to helper and allow helper default.
If present: split comma-separated values.
Trim each status.
Drop empty values only if caused by surrounding commas; otherwise let helper reject invalid status input.
Pass parsed statuses to helper.
```

`limit` parsing:

```text
If omitted: pass undefined to helper and allow helper default.
If present: parse as number.
Pass parsed number to helper.
Let helper return invalid_limit for unsafe values.
```

`cursor` parsing:

```text
If omitted: pass undefined.
If present and non-empty: pass to helper.
Current helper returns invalid_cursor.
Route maps invalid_cursor to HTTP 400.
```

The route should not duplicate the helper's strict validation.

## Helper input mapping

Route query parameters should map to:

```ts
type ParsedCandidateStagingQueueRouteInput = {
  statuses?: CandidateStagingQueueStatusFilter[];
  search?: string;
  discoverySourceId?: string;
  discoveryRunId?: string;
  auditCorrelationId?: string;
  duplicateCheckStatus?: string;
  confidenceBucket?: string;
  limit?: number;
  cursor?: string;
  sortKey?: CandidateStagingQueueSortKey;
  sortDirection?: CandidateStagingQueueSortDirection;
};
```

Then call:

```ts
const result = await listDiscoveryCandidateStagingQueueItems(parsedInput, {
  client,
});
```

The route must not directly query `discovery_candidate_tools`.

The route must not build raw SQL.

The route must not select columns directly.

The helper remains the source of truth for filtering and projection.

## Admin auth plan

The route must fail closed before creating or using a read client if the request
is not authenticated as admin.

Required behavior:

```text
Unauthenticated request -> 401 unauthorized.
Non-admin request -> 403 forbidden, if the existing auth pattern distinguishes it.
Admin request -> proceed.
```

The implementation should reuse the existing admin API auth/session guard. If
multiple patterns exist, choose the one already used by Discovery Engine admin
routes.

The route must not expose:

```text
Admin session internals.
Cookies.
JWTs.
Service role keys.
Auth stack traces.
Environment variables.
```

## Supabase client boundary

The route should create the Supabase admin/server client only after admin auth
passes.

The route should pass the client to:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

The route must not return the client or credentials.

The route must not import browser/client-side Supabase helpers.

The route must not expose service-role credentials.

## Success response plan

Recommended success response:

```ts
type CandidateStagingQueueApiReadResponse = {
  ok: true;
  items: DiscoveryCandidateStagingQueueItem[];
  nextCursor: string | null;
  totalCount?: number;
  appliedStatuses: CandidateStagingQueueStatusFilter[];
};
```

Recommended HTTP status:

```text
200
```

The route must return safe fields only as provided by the helper.

## Error response plan

Recommended error response:

```ts
type CandidateStagingQueueApiReadErrorResponse = {
  ok: false;
  error: {
    code:
      | "unauthorized"
      | "forbidden"
      | "invalid_status_filter"
      | "invalid_limit"
      | "invalid_cursor"
      | "invalid_sort_key"
      | "invalid_sort_direction"
      | "invalid_uuid_filter"
      | "candidate_queue_read_failed";
    message: string;
  };
};
```

The error response must not include:

```text
Raw stack trace.
Raw Supabase error.
Service role key.
Connection string.
Environment variable.
Unsafe raw payload.
```

## Error-to-status mapping

The route should map:

```text
unauthorized -> 401
forbidden -> 403
invalid_status_filter -> 400
invalid_limit -> 400
invalid_cursor -> 400
invalid_sort_key -> 400
invalid_sort_direction -> 400
invalid_uuid_filter -> 400
candidate_queue_read_failed -> 500
unknown error -> 500 candidate_queue_read_failed
```

Unknown errors should be normalized into a safe response.

## Active queue behavior

The route must preserve the helper contract:

```text
Default active statuses: staged, needs_review, duplicate_suspected.
Archived rows excluded by default.
Rejected rows excluded by default.
Inactive statuses rejected if requested.
Safe projected fields only.
```

The archived Phase 14 smoke artifact must not be returned by default:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status=archived
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

The route must not special-case this ID.

## Route test plan

The route test should be fake/mock based and must not require live database
access.

Test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

Required tests:

```text
GET unauthenticated request fails with 401 unauthorized.
GET admin request calls listDiscoveryCandidateStagingQueueItems.
GET omitted statuses preserves helper defaults.
GET comma-separated statuses parses staged,needs_review,duplicate_suspected.
GET archived status returns 400 invalid_status_filter.
GET rejected status returns 400 invalid_status_filter.
GET invalid limit returns 400 invalid_limit.
GET invalid sortKey returns 400 invalid_sort_key.
GET invalid sortDirection returns 400 invalid_sort_direction.
GET invalid UUID returns 400 invalid_uuid_filter.
GET cursor returns 400 invalid_cursor until cursor implementation is approved.
GET helper failure returns 500 candidate_queue_read_failed.
GET success returns ok=true and safe item fields.
GET error returns ok=false and a safe error code.
Route does not expose service-role credentials.
Route does not expose raw stack traces.
Route does not contain mutation call sites.
```

## Test implementation strategy

Preferred test approach:

```text
Use dependency seams or module mocks to fake admin auth.
Use dependency seams or module mocks to fake Supabase admin client creation.
Use dependency seams or module mocks to fake listDiscoveryCandidateStagingQueueItems.
Import or evaluate the route module under test.
Call GET with Request objects containing query strings.
Assert Response status and JSON body.
```

The route test should fail if mutation-like route methods are introduced.

## Static mutation guards

Phase 14Y should run:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" app/api/admin/discovery/candidate-staging-queue/route.ts
```

Expected result:

```text
No matches
```

Phase 14Y should also keep the helper guard passing:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

Expected result:

```text
No matches
```

## Verification commands for Phase 14Y

Recommended verification:

```bash
node testing/discovery-candidate-staging-queue-api-read-route.test.mjs
node testing/discovery-candidate-staging-queue-read-model.test.mjs
npm run check
git diff --check
```

Additional static guards:

```bash
rg -n "export async function (POST|PUT|PATCH|DELETE)" app/api/admin/discovery/candidate-staging-queue/route.ts
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" app/api/admin/discovery/candidate-staging-queue/route.ts
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

Expected result:

```text
No mutation routes and no mutation call sites.
```

## Out-of-scope for Phase 14Y

Phase 14Y must not implement:

```text
No admin UI.
No candidate approval route.
No candidate publish route.
No candidate promotion route.
No archive route.
No reject route.
No mutation route.
No public tools write.
No discovered_tools write.
No live database smoke unless separately approved.
No schema migration.
No type generation.
No package dependency change.
No crawler activation.
No LLM extraction activation.
```

## Recommended next phase

Recommended next phase:

```text
Phase 14Y — Candidate Staging Queue API Read Route Implementation
```

After Phase 14Y implementation and Gemini review, a later phase may design an
admin UI surface for viewing the active candidate staging queue.

## Commit and push gates

Phase 14X itself is docs-only and may be committed after Gemini approval.

Phase 14Y implementation must be Gemini-reviewed before commit.

Push still requires explicit push approval.

Live database access remains prohibited unless a future phase provides a narrow
read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 14X does not perform:

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
No schema migration.
No type generation.
No package change.
No crawler activation.
No LLM extraction activation.
```
