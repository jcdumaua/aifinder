# Discovery Phase 15G — Candidate Staging Queue Pagination / Detail Drawer Design

## Status

Phase 15G is a design-only phase for the next read-only Candidate Staging Queue admin UI enhancements.

Current pushed baseline:

```text
f7b4c57 Document candidate staging queue browser QA result
```

Phase 15G does not implement pagination or a detail drawer. It only designs the safe future direction.

## Current Verified Baseline

The Candidate Staging Queue admin UI is currently verified as a read-only panel on:

```text
/admin/discovery
```

The panel consumes:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Phase 15E verified Desktop, Tablet/iPad, and Mobile browser behavior, GET-only queue API behavior, no visible mutation labels, no candidate extraction POST, and a clean repository.

## Existing Functional Limits

The current UI is intentionally minimal and read-only.

Current limits include:

- no cursor pagination UI
- no next/previous page controls
- no row detail drawer
- no expanded evidence inspection experience beyond inline metadata
- no dedicated deep-linkable candidate detail route
- no mutation workflow
- no approval workflow
- no publishing workflow
- no archive/reject/delete workflow

The current backend read model explicitly rejects cursor input until cursor pagination is implemented in a later phase.

## Design Goals

Future pagination/detail work should improve admin review efficiency without changing the mutation posture.

Primary goals:

1. Keep the queue read-only.
2. Preserve active-status defaults.
3. Preserve safe GET-only read behavior.
4. Avoid direct browser Supabase access.
5. Avoid service-role exposure.
6. Avoid raw database errors or payloads in the UI.
7. Improve reviewability for larger candidate sets.
8. Improve metadata inspection without crowding the main queue cards.
9. Preserve Desktop, Tablet/iPad, and Mobile usability.
10. Maintain strict future gates before any mutation workflow.

## Non-Goals

Phase 15G does not design or approve:

- candidate approval
- candidate publishing
- candidate promotion
- candidate rejection
- candidate archiving
- candidate deletion
- insertion into `public.tools`
- writes to `discovered_tools`
- extraction execution
- crawler execution
- live database mutation
- background jobs
- automated candidate decisions

## Option A — Cursor Pagination

### Purpose

Cursor pagination would allow admins to move through larger active staging queues without increasing page load size or relying on unbounded fetches.

### Current Constraint

The current route and read model accept a cursor parameter shape at the API boundary, but the read model currently rejects cursor input until pagination is explicitly implemented.

This means cursor pagination cannot be safely added as UI-only work.

### Required Future Work

A future cursor pagination phase must include backend/read-model design before implementation.

Required design decisions:

- cursor format
- cursor encoding
- cursor signing or tamper resistance
- cursor sort coupling
- cursor stability across filters
- next cursor generation
- previous-page strategy, if any
- interaction between cursor and `limit`
- interaction between cursor and `sortKey`
- interaction between cursor and `sortDirection`
- behavior when filters change
- safe error handling for invalid cursor input
- route test expansion
- read model test expansion
- browser UI regression coverage

### Recommended Cursor Model

Recommended future cursor structure:

```json
{
  "sortKey": "created_at",
  "sortDirection": "desc",
  "lastValue": "2026-06-30T00:00:00.000Z",
  "lastCandidateId": "00000000-0000-0000-0000-000000000000",
  "filtersHash": "stable-filter-hash",
  "version": 1
}
```

The cursor should be opaque to the browser after encoding.

The browser should treat it as an API-provided token only.

### Cursor Safety Rules

Future cursor pagination must:

- reject malformed cursors safely
- reject cursors that do not match current filters
- reject cursors with unsupported sort keys
- reject cursors with unsupported sort directions
- avoid exposing raw database errors
- avoid allowing arbitrary SQL behavior
- avoid direct browser Supabase access
- preserve `GET` behavior
- preserve `cache: "no-store"`

### Cursor UI Requirements

Future cursor UI should include:

- Next page button
- disabled state while loading
- disabled state when no `nextCursor` exists
- visible current page count or loaded count
- reset-to-first-page behavior on filter changes
- no cursor text input
- no raw cursor display
- no previous-page feature unless explicitly designed

## Option B — Read-Only Detail Drawer

### Purpose

A read-only detail drawer would allow admins to inspect candidate metadata without leaving the queue or expanding every card.

This is the safest near-term enhancement because the current list response already includes the fields needed for a useful detail drawer.

### Recommended Drawer Scope

The future drawer should show:

- candidate name
- candidate status
- candidate website URL
- category hint
- pricing hint
- description
- confidence bucket
- duplicate check status
- duplicate signal types
- risk flags
- discovery source ID
- discovery run ID
- audit correlation ID
- source URL
- source domain
- source evidence kind
- source evidence locator
- created timestamp
- updated timestamp

### Drawer Non-Mutation Rules

The drawer must not include:

- approve button
- publish button
- promote button
- reject button
- archive button
- delete button
- extraction button
- crawler button
- public tool insertion action
- discovered tools write action

### Drawer Layout Requirements

Desktop:

- drawer or side panel can appear on the right
- queue remains visible or partially visible
- metadata sections should be grouped
- long IDs and URLs must wrap safely

Tablet/iPad:

- drawer can behave as a modal-width panel
- touch targets must remain accessible
- no horizontal overflow

Mobile:

- drawer should become a full-screen sheet or stacked modal
- close button must be easy to reach
- long strings must wrap
- no horizontal overflow

### Drawer Accessibility Requirements

The drawer should include:

- accessible dialog/sheet semantics
- visible title
- close button
- focus management
- Escape-key close behavior if supported by the chosen component
- no focus trap failures
- readable section headings

### Drawer Data Handling

The first drawer implementation should use the already-loaded queue item data.

It should not introduce a new detail API route unless a later phase proves list payload size is too large.

This keeps the first drawer implementation UI-only and avoids backend risk.

## Option C — Combined Cursor Pagination + Detail Drawer

A combined implementation would improve both scale and review depth in one phase.

However, this is not recommended as the next implementation step because cursor pagination requires backend/read-model changes while the detail drawer can be implemented safely using existing client data.

Combining both would increase review complexity and make safety boundaries harder to verify.

## Recommendation

Recommended path:

```text
Implement read-only detail drawer first.
Design cursor pagination separately after drawer QA passes.
```

Recommended future phase sequence:

1. `Phase 15H — Candidate Staging Queue Detail Drawer Implementation Plan`
2. `Phase 15I — Candidate Staging Queue Detail Drawer Implementation`
3. `Phase 15J — Candidate Staging Queue Detail Drawer Browser QA / Result Documentation`
4. `Phase 15K — Candidate Staging Queue Cursor Pagination Backend/UI Design`

This sequence preserves safety by keeping the next implementation UI-only and read-only.

## Proposed Phase 15H Scope

Phase 15H should be a planning-only phase.

It should specify:

- exact drawer component location
- exact state shape
- selected candidate ID handling
- selected candidate object handling
- safe URL display
- metadata grouping
- close behavior
- responsive behavior
- accessibility requirements
- static test requirements
- browser QA requirements
- no mutation labels
- no direct browser Supabase access
- no API route changes unless separately approved

Suggested future component path:

```text
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

Suggested test path:

```text
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

## Proposed Detail Drawer Sections

Recommended drawer sections:

### Candidate Summary

- candidate name
- status
- description
- category hint
- pricing hint
- confidence bucket

### URLs

- candidate website URL
- source URL
- source domain

### Duplicate/Risk Signals

- duplicate check status
- duplicate signal types
- risk flags

### Discovery Metadata

- candidate ID
- discovery source ID
- discovery run ID
- audit correlation ID
- source evidence kind
- source evidence locator

### Timestamps

- created at
- updated at

## Future Cursor Pagination Design Notes

Cursor pagination should be deferred until after the detail drawer is stable.

When revisited, the cursor design should include:

- read model SQL ordering contract
- deterministic tie-breaker by candidate ID
- cursor encoding helper
- cursor decoding helper
- filter hash strategy
- nextCursor response generation
- route tests
- read model tests
- UI static tests
- browser QA
- documentation of cursor limitations

## Security and Boundary Requirements

All future phases must preserve:

- admin-only access
- read-only default behavior
- active statuses only unless separately approved
- no public publishing
- no `public.tools` writes
- no `discovered_tools` writes
- no mutation buttons
- no direct browser Supabase access
- no service-role exposure
- no raw error rendering
- no raw HTML rendering
- no stack trace rendering
- no secret rendering

## Phase 15G Boundary Confirmation

Phase 15G is docs-only and design-only.

Phase 15G does not:

- change application source code
- change tests
- change API routes
- change backend helpers
- change Supabase migrations
- change package dependencies
- run browser QA
- run live database queries
- run database mutations
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- delete candidates

## Conclusion

Phase 15G recommends implementing a read-only detail drawer before cursor pagination.

This gives admins a better review experience with lower implementation risk because it can use the existing verified list response and avoid backend pagination changes.

Cursor pagination remains valuable, but should be designed and implemented separately because the current backend intentionally rejects cursor input until a dedicated pagination phase.
