# Phase 14W — Candidate Staging Queue API Read Route Design

## Status

Draft design only.

This phase designs the future admin-only candidate staging queue API read route
that will call the Phase 14V helper:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

This phase does not implement an API route, does not add route tests, does not
add UI, does not query the live database, does not mutate candidate rows, does
not write to public tools, does not write to discovered tools, and does not
publish anything.

## Background

Phase 14T designed the candidate staging queue read model.

Phase 14U planned the helper-only implementation.

Phase 14V implemented and pushed the helper-only read model to `main` with
commit:

```text
90707a9 Add candidate staging queue read model
```

Phase 14V added:

```text
lib/discovery/discovery-candidate-staging-queue-read-model.ts
testing/discovery-candidate-staging-queue-read-model.test.mjs
```

Phase 14W now designs the first API route that may expose this helper to an
admin UI in a later phase.

## Design objective

Create a future admin-only `GET` API route that:

```text
Uses listDiscoveryCandidateStagingQueueItems(...).
Reads active candidate staging queue rows only.
Defaults to active statuses only.
Excludes archived and rejected rows by default.
Returns safe projected fields only.
Requires an authenticated admin session.
Does not mutate any rows.
Does not write to public tools.
Does not write to discovered_tools.
Does not approve, publish, promote, archive, reject, or delete candidates.
```

## Recommended future route

Recommended route path:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Recommended route file:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

Recommended future test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

The route should be read-only and should reject all non-GET behavior by omission
or by the framework default.

## Route method

The first route implementation must be:

```text
GET only
```

The route must not implement:

```text
POST
PUT
PATCH
DELETE
```

The route must not perform:

```text
No insert.
No update.
No upsert.
No delete.
No rpc mutation.
No public tools write.
No discovered_tools write.
No publish action.
No approval action.
No promotion action.
```

## Admin authentication boundary

The route must be admin-only.

The first route implementation should reuse the existing admin auth/session
pattern already used by AiFinder admin API routes.

The design requirement is:

```text
Unauthenticated requests fail closed.
Non-admin requests fail closed.
Successful requests require an authenticated admin session.
The route is never public.
The route is never anonymous.
```

Recommended unauthenticated response:

```text
401 Unauthorized
```

Recommended forbidden response if a distinction is needed:

```text
403 Forbidden
```

The response body should remain safe and avoid exposing auth internals.

## Query parameters

The future route may accept these query parameters:

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

`statuses` may be comma-separated:

```text
statuses=staged,needs_review,duplicate_suspected
```

If `statuses` is omitted, the route should let the helper default to:

```text
staged
needs_review
duplicate_suspected
```

The route must not accept inactive statuses for the active queue route:

```text
archived
rejected
approved
published
promoted
live
public
```

Inactive statuses must fail with:

```text
invalid_status_filter
```

## Query parameter mapping

The route should map query parameters into the helper input:

```ts
{
  statuses,
  search,
  discoverySourceId,
  discoveryRunId,
  auditCorrelationId,
  duplicateCheckStatus,
  confidenceBucket,
  limit,
  cursor,
  sortKey,
  sortDirection,
}
```

The route should not duplicate all helper validation logic. It should perform
basic parsing and then rely on the helper as the source of truth for strict
validation.

The route must not build raw SQL.

The route must not use user input as raw column names.

The route must not pass inactive statuses as active queue statuses.

## Route response shape

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

Error messages should be safe, short, and not include secrets or raw stack
traces.

## Status code mapping

Recommended status mapping:

```text
200 ok
400 invalid_status_filter
400 invalid_limit
400 invalid_cursor
400 invalid_sort_key
400 invalid_sort_direction
400 invalid_uuid_filter
401 unauthorized
403 forbidden
500 candidate_queue_read_failed
```

The route must not leak:

```text
Service role keys
Supabase URLs with secrets
Connection strings
Raw database errors
Raw stack traces
Environment variables
Unsafe raw payloads
```

## Helper integration

The route should call:

```ts
listDiscoveryCandidateStagingQueueItems(parsedInput, { client })
```

The `client` must be an admin/server Supabase client created only inside the
server route boundary.

The client must not be returned to the caller.

The route must not expose service-role credentials.

The route must not import client-side Supabase helpers.

The route must not run in a public/client component.

## Active queue behavior

The route must preserve the Phase 14T/14U/14V active queue contract:

```text
Default active statuses: staged, needs_review, duplicate_suspected.
Archived rows excluded by default.
Rejected rows excluded by default.
Inactive statuses rejected if requested through the active queue route.
Safe projected fields only.
```

The archived Phase 14 smoke artifact must not be returned by this active queue
route by default:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status=archived
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

The route must not special-case this ID. The helper status allowlist must exclude
it naturally.

## Cursor behavior

The Phase 14V helper currently rejects non-empty cursors with:

```text
invalid_cursor
```

The first API route should preserve that behavior.

If a `cursor` query parameter is provided before cursor pagination is
implemented, the route should return:

```text
400 invalid_cursor
```

`nextCursor` should be returned as:

```text
null
```

until a later cursor implementation phase is approved.

## Search behavior

Search should be passed to the helper as a bounded string.

The route should not search raw payloads, raw HTML, or unsafe evidence content.

Allowed route-level search target remains helper-defined:

```text
candidate_name
candidate_website_url
source_domain
```

The route should not add any new search target in the API layer.

## Static safety guards for future implementation

The future implementation should include static guards proving that the route
does not contain mutation calls.

Recommended guard:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" app/api/admin/discovery/candidate-staging-queue/route.ts
```

The guard should return no results or only reviewed false positives.

The helper static mutation guard from Phase 14V should also continue to pass:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

## Future route test plan

The future route test should verify:

```text
GET requires admin authentication.
GET calls listDiscoveryCandidateStagingQueueItems with parsed input.
Omitted statuses preserve helper defaults.
Comma-separated statuses parse correctly.
Inactive statuses return invalid_status_filter.
Invalid limit returns invalid_limit.
Invalid sort key returns invalid_sort_key.
Invalid sort direction returns invalid_sort_direction.
Invalid UUID returns invalid_uuid_filter.
Cursor returns invalid_cursor until cursor implementation is approved.
Successful response returns ok=true and safe fields.
Error response returns ok=false and safe error code.
No service-role credentials are exposed.
No raw stack trace is exposed.
No mutation calls are present.
No public tools write is present.
No discovered_tools write is present.
No publish/approve/promote action is present.
```

The tests should use mocks/fakes and must not require a live database.

## Future implementation files

Expected files for the future implementation phase:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

The implementation should not require changes to:

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

Preferred first implementation uses direct `node` test execution.

## Out-of-scope for Phase 14X implementation

When the future route implementation happens, it should still exclude:

```text
No admin UI.
No candidate approval route.
No candidate publish route.
No candidate promotion route.
No archive/reject mutation route.
No public tools write.
No discovered_tools write.
No live database smoke unless separately approved.
No schema migration.
No type generation.
No crawler activation.
No LLM extraction activation.
```

## Recommended next phase

Recommended next phase:

```text
Phase 14X — Candidate Staging Queue API Read Route Implementation Plan
```

Recommended scope:

```text
Docs-only implementation plan.
Map this route design to exact code and tests.
Confirm admin auth helper to reuse.
Confirm Supabase admin client creation pattern.
Confirm route parsing and error response helpers.
No implementation yet.
No live DB query.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```

## Commit and push gates

Phase 14W itself is docs-only and may be committed after Gemini approval.

The future API route implementation must be Gemini-reviewed before commit.

Push still requires explicit push approval.

Live database access remains prohibited unless a future phase provides a narrow
read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 14W does not perform:

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
