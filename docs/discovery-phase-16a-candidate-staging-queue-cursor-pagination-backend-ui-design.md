# Discovery Phase 16A — Candidate Staging Queue Cursor Pagination Backend/UI Design

## Status

Phase 16A is a docs-only backend/read-model/UI design phase for Candidate Staging Queue cursor pagination.

Current pushed baseline:

```text
9f4f07a Document detail drawer readiness gate
```

Phase 16A follows the completed read-only Candidate Staging Queue Detail Drawer milestone.

Phase 16A does not implement cursor pagination. It defines the future safe pagination contract before any backend or UI changes.

## Background

The Candidate Staging Queue admin UI is currently verified as a read-only admin surface on:

```text
/admin/discovery
```

It reads from:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Completed read-only milestones include:

- Candidate Staging Queue read route
- Candidate Staging Queue admin UI
- Candidate Staging Queue detail drawer
- browser QA for the queue panel
- browser QA for the detail drawer

Phase 15L closed the detail drawer milestone and recommended cursor pagination as the next design area.

## Current Constraint

The current backend/read-model intentionally rejects cursor input until a dedicated pagination phase.

This means cursor pagination is not implementation-ready from Phase 16A alone.

Phase 16A designs the contract required to make cursor pagination safe in a future implementation phase.

## Design Goals

Future cursor pagination should:

1. Preserve read-only behavior.
2. Preserve admin-only access.
3. Preserve active-status defaults.
4. Preserve `GET` request behavior.
5. Preserve `cache: "no-store"` client behavior.
6. Avoid direct browser Supabase access.
7. Avoid service-role exposure in browser code.
8. Avoid raw database errors.
9. Avoid unbounded list reads.
10. Support larger staging queues safely.
11. Keep cursor tokens opaque to the browser.
12. Maintain deterministic ordering.
13. Reset pagination when filters or sorting change.
14. Remain compatible with Desktop, Tablet/iPad, and Mobile.

## Non-Goals

Phase 16A does not design or approve:

- candidate approval
- candidate publishing
- candidate promotion
- candidate rejection
- candidate archiving
- candidate deletion
- insertion into `public.tools`
- writes to `discovered_tools`
- crawler execution
- candidate extraction execution
- live database mutation
- public-facing candidate browsing
- deep-linked candidate detail pages
- infinite scroll

## Recommended Pagination Model

Use forward-only cursor pagination first.

The initial UI should support:

- first page load
- next page load
- reset to first page when filters change
- reset to first page when sort changes
- disabled next button when no next cursor exists

The initial UI should not support previous-page navigation.

Previous-page navigation can be designed later if there is a strong admin workflow need.

## Cursor Token Contract

The browser should receive an opaque cursor token from the API response.

The browser must not construct cursor internals.

Recommended decoded cursor payload:

```json
{
  "version": 1,
  "sortKey": "created_at",
  "sortDirection": "desc",
  "lastValue": "2026-06-30T00:00:00.000Z",
  "lastCandidateId": "00000000-0000-0000-0000-000000000000",
  "filtersHash": "stable-filter-hash"
}
```

Recommended encoded form:

```text
base64url(jsonPayload).base64url(signature)
```

The signature should be generated server-side.

The cursor token must be treated as opaque by the UI.

## Cursor Signing Requirement

Future implementation should sign cursor tokens to prevent tampering.

Recommended signing approach:

- JSON payload serialized in a stable order
- HMAC-SHA256 signature
- server-only secret
- base64url encoding
- safe cursor decode errors

The signing secret must not be exposed to client components.

If no dedicated cursor signing secret exists, future implementation must design whether to use an existing server-only secret or introduce a new server-only environment variable.

No signing secret should be printed in logs.

## Filter Hash Contract

Cursor tokens should include a stable hash of the filters used to generate the page.

The filter hash should include:

- active status set
- search query
- duplicate check status filter
- confidence bucket filter
- discovery source ID filter
- discovery run ID filter
- audit correlation ID filter
- limit
- sort key
- sort direction

If the cursor filter hash does not match the current request filter hash, the API should reject the cursor safely.

## Sort Contract

Supported initial sort keys should remain limited to the currently approved queue sort options:

- `created_at`
- `updated_at`
- `confidence_bucket`

Supported sort directions:

- `desc`
- `asc`

The backend/read model must reject unsupported sort keys and unsupported sort directions.

## Deterministic Tie-Breaker

Every cursor sort must include a deterministic tie-breaker.

Recommended tie-breaker:

```text
candidate_id
```

For timestamp sorts, order by:

```text
sort value, candidate_id
```

For confidence bucket sorting, the read model must define a stable rank order and still use candidate ID as a tie-breaker.

This avoids duplicate or skipped candidates when multiple candidates share the same sort value.

## Request Contract

Future route request query parameters:

```text
limit
sortKey
sortDirection
cursor
search
duplicateCheckStatus
confidenceBucket
discoverySourceId
discoveryRunId
auditCorrelationId
```

Rules:

- `cursor` is optional
- if `cursor` is absent, return the first page
- if `cursor` is present, validate and decode it server-side
- reject malformed or mismatched cursors with a safe error code
- do not expose raw cursor decode errors
- do not expose raw database errors

## Response Contract

Future route response should include:

```json
{
  "items": [],
  "nextCursor": "opaque-token-or-null",
  "hasNextPage": false,
  "limit": 25,
  "sortKey": "created_at",
  "sortDirection": "desc"
}
```

Rules:

- `nextCursor` should be null when there are no more results
- `hasNextPage` should be false when there are no more results
- the UI should rely on `nextCursor` or `hasNextPage` to disable next-page controls
- response shape should remain safe and not leak internal SQL details

## Limit Contract

Approved initial limits should remain:

- 10
- 25
- 50

The backend must reject unsupported limits safely.

The UI should continue to offer only approved limit options.

Changing the limit should reset the cursor and reload the first page.

## Backend / Read-Model Design

Future implementation should update the existing candidate staging queue read model rather than adding a separate pagination endpoint.

The read model should:

- preserve current filters
- preserve active status defaults
- validate cursor tokens server-side
- compare current filter hash to cursor filter hash
- fetch `limit + 1` rows to determine whether a next page exists
- return only `limit` rows to the UI
- generate next cursor from the final returned item when more rows exist
- reject invalid cursor state safely

No mutation should be added.

## Route Design

The existing route should remain:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Future route behavior should:

- continue requiring admin authentication
- continue using the existing admin route safety patterns
- continue mapping errors to safe error codes
- continue returning JSON only
- continue rejecting invalid params safely
- continue not exposing raw database errors

No new route is recommended for cursor pagination.

## UI Design

The Candidate Staging Queue panel should add a simple next-page control.

Recommended UI labels:

- `Next page`
- `Back to first page`

The UI should not render raw cursor values.

The UI should not include a cursor text input.

The UI should not allow arbitrary cursor editing.

The UI should reset pagination when any filter changes.

The UI should reset pagination when sort key or sort direction changes.

## Client State Design

Recommended future client state:

```ts
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [cursorStack, setCursorStack] = useState<string[]>([]);
const [currentPageIndex, setCurrentPageIndex] = useState(0);
```

For the first implementation, `cursorStack` may be omitted if only forward pagination and reset are supported.

Recommended minimum state:

```ts
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [currentCursor, setCurrentCursor] = useState<string | null>(null);
```

Rules:

- first page uses `currentCursor = null`
- next page sets `currentCursor = nextCursor`
- any filter or sort change resets both cursors to null

## UI Loading and Error States

The existing loading, error, empty, and success states should be preserved.

Next-page loading should:

- disable pagination controls
- avoid double-click duplicate requests
- preserve current filters and sort state
- show safe loading text
- avoid layout shift where practical

Invalid cursor errors should show a safe message and allow reset to first page.

## Accessibility Requirements

Pagination controls should:

- be keyboard accessible
- have clear button labels
- expose disabled state correctly
- preserve focus behavior after page load
- avoid cursor-only visual indication
- remain usable on Desktop, Tablet/iPad, and Mobile

## Responsive Requirements

Desktop:

- pagination controls can appear below the queue list
- loaded count and next-page status can appear near controls

Tablet/iPad:

- controls should remain touch-friendly
- no horizontal overflow

Mobile:

- controls should stack if needed
- buttons should remain reachable
- no horizontal overflow

## Testing Plan

Future implementation should add or expand tests for:

### Read Model Tests

- first page without cursor
- valid next cursor
- malformed cursor rejection
- tampered cursor rejection
- filter hash mismatch rejection
- unsupported sort key rejection
- unsupported sort direction rejection
- unsupported limit rejection
- `limit + 1` next-page detection
- deterministic tie-breaker behavior
- safe error mapping

### Route Tests

- no cursor first page
- cursor next page
- invalid cursor safe error
- filter mismatch safe error
- admin-only access preserved
- GET-only behavior preserved
- no mutation behavior introduced

### UI Static Tests

- cursor state exists
- next-page control exists
- reset-to-first-page behavior exists
- raw cursor is not rendered
- no cursor text input exists
- Candidate Staging Queue API path unchanged
- no mutation labels introduced
- no mutation methods introduced
- no Supabase imports introduced
- no service-role references introduced

### Browser QA

Future browser QA should verify:

- first page renders
- next page loads
- filters reset pagination
- sort changes reset pagination
- no horizontal overflow
- no raw cursor visible
- Candidate Staging Queue API remains GET-only
- no POST/PATCH/PUT/DELETE requests are introduced
- Desktop, Tablet/iPad, and Mobile behavior

## Security Requirements

Future implementation must preserve:

- admin-only access
- server-only cursor signing
- no cursor secret exposure
- no direct browser Supabase access
- no service-role exposure
- no raw cursor internals rendered
- no raw database errors rendered
- no stack traces rendered
- no secrets rendered
- no raw HTML rendering
- no mutation workflows

## Boundary Confirmation

Phase 16A is documentation-only and design-only.

Phase 16A does not:

- change application source code
- change tests
- change API routes
- change backend helpers
- change Supabase migrations
- change package dependencies
- implement cursor pagination
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- delete candidates

## Recommended Next Phase

Recommended next phase:

```text
Phase 16B — Candidate Staging Queue Cursor Pagination Implementation Plan
```

Phase 16B should remain planning-only and specify exact source files, helper functions, tests, cursor signing implementation, route response shape, and UI state changes before any implementation begins.

## Conclusion

Phase 16A designs a safe cursor pagination contract for the Candidate Staging Queue.

The recommended approach is forward-only, opaque, server-signed cursor pagination on the existing admin read route. The design preserves read-only behavior, avoids direct browser database access, keeps cursor internals hidden from the UI, and requires backend/read-model tests before implementation.
