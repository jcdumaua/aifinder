# Discovery Phase 16B — Candidate Staging Queue Cursor Pagination Implementation Plan

## Status

Phase 16B is a docs-only implementation plan for future Candidate Staging Queue cursor pagination.

Current pushed baseline:

```text
804599f Document candidate staging queue cursor pagination design
```

Phase 16B follows Phase 16A, which designed a forward-only, opaque, server-signed cursor pagination contract.

Phase 16B does not implement cursor pagination. It defines the exact future implementation path, expected files, helper functions, tests, verification commands, and safety boundaries.

## Objective

Plan a safe implementation of cursor pagination for:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The future implementation should allow admins to page through larger active candidate staging queues without unbounded reads and without adding any mutation workflow.

## Implementation Principles

Future implementation must:

1. Keep the Candidate Staging Queue read-only.
2. Keep the existing API route.
3. Use server-only cursor signing.
4. Keep cursor tokens opaque to the browser.
5. Use deterministic ordering with `candidate_id` tie-breaker.
6. Use `limit + 1` reads to detect next page.
7. Validate cursor/filter/sort consistency.
8. Reset pagination on filter/sort/limit changes.
9. Preserve existing loading, empty, error, and success states.
10. Add tests before browser QA.
11. Avoid package changes unless a blocker is proven.

## Expected Future File Scope

### Expected modified backend/read-model files

Expected:

```text
lib/discovery/discovery-candidate-staging-queue-read.ts
```

This file should receive the read-model cursor logic.

If the actual read-model filename differs, implementation must inspect and use the current file that powers:

```text
GET /api/admin/discovery/candidate-staging-queue
```

### Expected modified route file

Expected:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

The route should preserve the same path and admin-only behavior while adding safe cursor query parsing and response metadata.

### Expected new server-only cursor helper

Recommended new helper:

```text
lib/discovery/discovery-candidate-staging-queue-cursor.ts
```

This helper should be server-only and should not be imported by client components.

### Expected modified UI file

Expected:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

The UI should add forward-only pagination controls and cursor state.

### Expected modified or added tests

Expected test updates/additions:

```text
testing/discovery-candidate-staging-queue-read.test.mjs
testing/discovery-candidate-staging-queue-route.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-cursor.test.mjs
```

If current test filenames differ, implementation should inspect existing tests and update the closest existing route/read/UI tests while adding a focused cursor helper test.

### Files Not Expected to Change

The future implementation should not modify:

```text
supabase/migrations/**
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
app/admin/discovery/page.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

Any deviation must be explained in the CCR before commit.

## Cursor Helper Plan

Create a server-only helper responsible for cursor encoding, decoding, signing, and validation.

Recommended exported types:

```ts
export type CandidateStagingQueueCursorPayload = {
  version: 1;
  sortKey: "created_at" | "updated_at" | "confidence_bucket";
  sortDirection: "asc" | "desc";
  lastValue: string | number | null;
  lastCandidateId: string;
  filtersHash: string;
};

export type CandidateStagingQueueCursorDecodeResult =
  | { ok: true; payload: CandidateStagingQueueCursorPayload }
  | { ok: false; errorCode: "invalid_cursor" | "cursor_version_unsupported" };
```

Recommended exported functions:

```ts
export function createCandidateStagingQueueFiltersHash(input: CandidateStagingQueueFiltersHashInput): string;

export function encodeCandidateStagingQueueCursor(payload: CandidateStagingQueueCursorPayload): string;

export function decodeCandidateStagingQueueCursor(token: string): CandidateStagingQueueCursorDecodeResult;

export function createCandidateStagingQueueNextCursor(input: CandidateStagingQueueNextCursorInput): string | null;
```

The helper should avoid exposing raw signing errors to callers.

## Cursor Signing Plan

Use HMAC-SHA256 signing.

Recommended token form:

```text
base64url(jsonPayload).base64url(signature)
```

Signing rules:

- JSON payload must serialize in stable key order.
- Signature must be generated server-side only.
- Signature secret must never be exposed to the browser.
- Signature secret must never be printed.
- Tampered cursors must return a safe `invalid_cursor` error.

Secret decision:

- Prefer an existing server-only admin/application secret if appropriate.
- If no existing secret is appropriate, future implementation may introduce a new server-only environment variable only after documenting that need.
- Do not add package dependencies for signing; use Node crypto where available.

## Filter Hash Plan

The filter hash should be stable and deterministic.

Include:

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

The read model should compare:

```text
cursor.filtersHash === currentRequestFiltersHash
```

If the values differ, reject the request with a safe cursor/filter mismatch error.

Recommended safe error code:

```text
candidate_queue_cursor_mismatch
```

## Query Parameter Plan

Extend existing query parsing to include:

```text
cursor
```

Existing parameters to preserve:

```text
limit
sortKey
sortDirection
search
duplicateCheckStatus
confidenceBucket
discoverySourceId
discoveryRunId
auditCorrelationId
```

Validation rules:

- `cursor` is optional.
- Missing cursor means first page.
- Malformed cursor returns safe cursor error.
- Tampered cursor returns safe cursor error.
- Unsupported cursor version returns safe cursor version error.
- Cursor with mismatched filters returns safe cursor mismatch error.
- Unsupported sort keys remain rejected.
- Unsupported sort directions remain rejected.
- Unsupported limits remain rejected.

## Response Shape Plan

Extend route/read response to include:

```ts
type CandidateStagingQueueResponse = {
  items: CandidateStagingQueueItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: 10 | 25 | 50;
  sortKey: "created_at" | "updated_at" | "confidence_bucket";
  sortDirection: "asc" | "desc";
};
```

Backwards compatibility note:

The existing UI should continue using `items`.

Future UI should use:

```text
nextCursor
hasNextPage
```

to enable or disable pagination controls.

## Read-Model Pagination Plan

The future read model should fetch:

```text
limit + 1
```

Rows.

Rules:

- Return only `limit` rows to the UI.
- If `limit + 1` row exists, set `hasNextPage = true`.
- Generate `nextCursor` from the last returned row.
- If no extra row exists, set `hasNextPage = false` and `nextCursor = null`.
- Do not expose the extra row to the UI.

## Ordering Plan

Every query must include deterministic ordering.

For timestamp sorts:

```text
ORDER BY sort_timestamp, candidate_id
```

For confidence bucket sort:

- map confidence bucket to stable rank
- order by rank and `candidate_id`

Supported sort keys:

```text
created_at
updated_at
confidence_bucket
```

Supported directions:

```text
asc
desc
```

Tie-breaker:

```text
candidate_id
```

## Cursor WHERE Clause Plan

For `desc` timestamp sorting, the next-page predicate should follow the pattern:

```text
(sort_value < lastValue)
OR (sort_value = lastValue AND candidate_id < lastCandidateId)
```

For `asc` timestamp sorting:

```text
(sort_value > lastValue)
OR (sort_value = lastValue AND candidate_id > lastCandidateId)
```

For confidence bucket sorting, use the stable confidence rank as `sort_value`.

Implementation must verify whether the underlying query builder supports this directly or requires a safe RPC-free query composition.

No unsafe raw SQL interpolation should be introduced.

## UI State Plan

Update the Candidate Staging Queue panel with minimum state:

```ts
const [currentCursor, setCurrentCursor] = useState<string | null>(null);
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [hasNextPage, setHasNextPage] = useState(false);
const [pageIndex, setPageIndex] = useState(0);
```

Rules:

- first page uses `currentCursor = null`
- clicking `Next page` sets `currentCursor` to `nextCursor`
- `pageIndex` increments after next-page navigation
- `Back to first page` resets `currentCursor`, `nextCursor`, `hasNextPage`, and `pageIndex`
- changing filters resets pagination to first page
- changing limit resets pagination to first page
- changing sort resets pagination to first page
- refresh should reload the current page or explicitly reset to first page; implementation plan recommends reset to first page for simplicity

## UI Control Plan

Add controls below the queue list:

```text
Next page
Back to first page
```

Rules:

- `Next page` disabled when `hasNextPage` is false or `nextCursor` is null
- both buttons disabled while loading
- no raw cursor text should render
- no cursor text input should exist
- controls should be keyboard accessible
- controls should be touch-friendly on Tablet/iPad and Mobile
- no horizontal overflow

Optional safe display:

```text
Page 1
Page 2
```

Do not display raw cursor values.

## Client Request Plan

When building the request URL:

- include `cursor` only when `currentCursor` is not null
- preserve existing filters
- preserve existing sort and limit values
- preserve `cache: "no-store"`
- preserve `method: "GET"`
- do not add POST/PATCH/PUT/DELETE behavior

## Error Handling Plan

Safe cursor error codes should map to user-safe messages.

Recommended codes:

```text
candidate_queue_invalid_cursor
candidate_queue_cursor_mismatch
candidate_queue_cursor_version_unsupported
candidate_queue_read_failed
```

Recommended UI message for cursor errors:

```text
This page token is no longer valid. Return to the first page and try again.
```

The UI should expose a `Back to first page` recovery control.

Do not render raw cursor decode errors.

Do not render stack traces.

## Test Implementation Plan

### Cursor Helper Test

Add:

```text
testing/discovery-candidate-staging-queue-cursor.test.mjs
```

Test:

- encode/decode round trip
- tampered payload rejected
- tampered signature rejected
- malformed token rejected
- unsupported version rejected
- filters hash stable for equivalent input
- filters hash changes when filters change
- cursor token does not contain obvious raw JSON if opaque encoding is used
- no secret is printed

### Read Model Test

Update or add tests for:

- first page without cursor
- valid cursor next page
- malformed cursor safe rejection
- tampered cursor safe rejection
- filter hash mismatch safe rejection
- unsupported sort key safe rejection
- unsupported sort direction safe rejection
- unsupported limit safe rejection
- `limit + 1` next-page detection
- deterministic tie-breaker behavior
- no duplicate row across first and next page
- no skipped row across first and next page
- safe error mapping

### Route Test

Update route tests for:

- GET first page
- GET next page with cursor
- invalid cursor response
- cursor mismatch response
- `nextCursor` response shape
- `hasNextPage` response shape
- admin-only behavior preserved
- no mutation methods allowed
- no raw error leakage

### UI Static Test

Update:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Test:

- cursor state exists
- next page control exists
- back to first page control exists
- cursor query param is included only conditionally
- raw cursor is not rendered
- no cursor text input exists
- API path unchanged
- GET-only behavior preserved
- no mutation labels introduced
- no mutation methods introduced
- no Supabase imports introduced
- no service-role references introduced
- no detail drawer regressions

## Browser QA Plan

After implementation and review, a separate browser QA phase should test:

Desktop:

- first page renders
- next page loads via mock API
- back to first page resets
- controls disabled correctly
- no raw cursor visible
- no horizontal overflow

Tablet/iPad:

- controls are touch-friendly
- next/back behavior works
- no horizontal overflow

Mobile:

- controls stack safely
- buttons remain reachable
- no horizontal overflow

Network:

- Candidate Staging Queue requests remain GET-only
- no POST/PATCH/PUT/DELETE requests observed
- no candidate extraction invoke request
- no crawler request
- no approval/publish/promote/reject/archive/delete requests

## Implementation Sequence for Future Phase 16C

Recommended implementation order:

1. Inspect current read-model, route, UI, and tests.
2. Add cursor helper with signing/verification.
3. Add cursor helper tests.
4. Extend read-model input/output types.
5. Add `limit + 1` pagination logic.
6. Add deterministic cursor predicates.
7. Extend route query parsing and response shape.
8. Update route tests.
9. Update UI state and request building.
10. Add next/back controls.
11. Update UI static tests.
12. Run all targeted tests.
13. Run `npm run check`.
14. Run `git diff --check`.
15. Stop for Gemini review before commit.

## Expected Verification Commands

Future implementation should run:

```text
node testing/discovery-candidate-staging-queue-cursor.test.mjs
node testing/discovery-candidate-staging-queue-read.test.mjs
node testing/discovery-candidate-staging-queue-route.test.mjs
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
npm run check
git diff --check
git status --short
git status --branch --short
```

If actual existing route/read test filenames differ, use the project’s current corresponding tests and document the exact commands in the CCR.

## Safety Boundary

Future implementation must not add:

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
- public-facing cursor access
- no direct browser Supabase access
- no service-role exposure in browser code
- raw cursor rendering
- raw SQL interpolation with untrusted input

## Phase 16B Boundary Confirmation

Phase 16B is documentation-only and planning-only.

Phase 16B does not:

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
Phase 16C — Candidate Staging Queue Cursor Pagination Implementation
```

Phase 16C should implement the exact plan from Phase 16B, with helper tests, read-model tests, route tests, UI static tests, and no browser QA until a separate follow-up phase.

## Conclusion

Phase 16B defines the implementation path for safe, forward-only Candidate Staging Queue cursor pagination.

The plan keeps pagination on the existing admin read route, uses server-signed opaque cursor tokens, validates filter and sort consistency, uses deterministic `candidate_id` tie-breaking, adds next/back UI controls, and preserves the no-mutation boundary.
