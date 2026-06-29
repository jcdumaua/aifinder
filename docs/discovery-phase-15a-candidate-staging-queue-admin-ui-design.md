# Phase 15A — Candidate Staging Queue Admin UI Design

## Status

Draft UI design only.

This phase designs the future admin UI surface for viewing the candidate staging
queue through the secure Phase 14Y API route.

Phase 15A does not implement UI, does not create components, does not create
client hooks, does not change API routes, does not run a live database query,
does not mutate candidate rows, does not write to public tools, does not write
to discovered tools, and does not publish anything.

## Background

Phase 14Y implemented and pushed the admin-only queue read route:

```text
67ed72d Add candidate staging queue API route
```

Phase 14Z documented the post-implementation review:

```text
b3ee185 Document candidate staging queue API route review
```

The backend route now available to future admin UI work is:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Implemented backend route file:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

Implemented backend route test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

The route is admin-only, GET-only, read-only, and delegates strict validation to:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

## Design objective

Design a safe admin-only read surface that lets an authenticated admin review
active candidate staging rows.

The UI should make candidate review easier while preserving the current
non-mutating backend boundary.

The first UI surface must be read-only.

## Recommended future UI phase

Recommended next implementation-planning phase:

```text
Phase 15B — Candidate Staging Queue Admin UI Implementation Plan
```

Phase 15B should map this design to exact files, component boundaries, fetch
behavior, tests, and verification before any UI code is written.

## Future admin UI entry point

The first candidate staging queue UI should live under the existing admin
Discovery area.

Preferred future entry point:

```text
/admin/discovery
```

Recommended future UI pattern:

```text
Add a read-only Candidate Staging Queue section, card, or tab to the existing
admin Discovery page.
```

Alternative future route only if the existing admin Discovery page becomes too
crowded:

```text
/admin/discovery/candidate-staging-queue
```

Phase 15B should inspect the existing admin Discovery page and choose the
smallest safe integration point.

## Future files to inspect before implementation

Phase 15B should inspect existing admin UI files before making changes.

Recommended inspection targets:

```text
app/admin/discovery/page.tsx
components/admin/*
components/admin/discovery/*
app/admin/discovered-tools/page.tsx
app/admin/discovery/tools/page.tsx
app/admin/discovery/tools/[id]/page.tsx
```

If any listed file does not exist, Phase 15B should document the actual file
structure and choose the closest existing admin Discovery integration point.

## Proposed future files

The exact future files should be confirmed in Phase 15B.

Possible files:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-table.tsx
components/admin/discovery/candidate-staging-queue-filters.tsx
components/admin/discovery/candidate-staging-queue-empty-state.tsx
components/admin/discovery/candidate-staging-queue-error-state.tsx
```

Possible integration file:

```text
app/admin/discovery/page.tsx
```

If the existing admin Discovery page is a server component that renders a client
component, Phase 15B may recommend adding only one client-side child component.

## UI scope

The first UI should display active candidate staging rows returned by:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The UI should include:

```text
Read-only queue table or card list.
Candidate name.
Candidate website URL.
Candidate status.
Confidence bucket.
Duplicate check status.
Category hint.
Pricing hint.
Short description preview.
Source domain.
Source URL.
Discovery source ID.
Discovery run ID.
Audit correlation ID.
Created at.
Updated at.
Safe loading state.
Safe empty state.
Safe error state.
Refresh button.
Filter controls.
Responsive desktop/tablet/mobile layout.
```

The UI should not expose raw payload fields, service-role data, environment
variables, raw database errors, stack traces, or unsafe internal details.

## Filters and query controls

The first UI may expose these read filters:

```text
statuses
search
discoverySourceId
discoveryRunId
auditCorrelationId
duplicateCheckStatus
confidenceBucket
limit
sortKey
sortDirection
```

Recommended initial visible controls:

```text
Search input.
Status multi-select limited to active statuses.
Duplicate check status text/select filter.
Confidence bucket text/select filter.
Limit select: 10, 25, 50.
Sort key select: created_at, updated_at, confidence_bucket.
Sort direction select: desc, asc.
Refresh button.
```

Advanced filters may be collapsed behind an "Advanced filters" section:

```text
discoverySourceId
discoveryRunId
auditCorrelationId
```

Cursor input must not be exposed yet because cursor pagination intentionally
returns:

```text
400 invalid_cursor
```

until a later cursor implementation phase is approved.

## Active statuses

The UI should only offer active candidate statuses:

```text
staged
needs_review
duplicate_suspected
```

The UI must not offer inactive or forbidden statuses:

```text
archived
rejected
approved
published
promoted
live
public
```

If a future admin enters a forbidden status manually through query state, the UI
must show the safe API error and must not attempt to recover by calling mutation
routes.

## Read-only action boundary

The first UI must not include mutation actions.

Do not add buttons for:

```text
Approve.
Publish.
Promote.
Reject.
Archive.
Delete.
Insert into public tools.
Write to discovered_tools.
Run extraction.
Run crawler.
```

Placeholders may mention that actions are intentionally deferred, but they must
not be interactive mutation controls.

Recommended placeholder copy:

```text
Review actions are intentionally unavailable in this read-only phase.
```

## Row detail behavior

The first UI may support a local, read-only expanded row or detail drawer.

Allowed detail content:

```text
Candidate description.
Website URL.
Source URL.
Source domain.
Evidence kind.
Evidence locator.
Duplicate signal types.
Risk flags.
Discovery source ID.
Discovery run ID.
Audit correlation ID.
Timestamps.
```

Not allowed:

```text
Raw HTML.
Raw extraction payload.
Service-role credentials.
Environment variables.
Private logs.
Raw stack traces.
Mutation buttons.
```

## Loading state

The loading state should be simple and non-blocking.

Recommended loading copy:

```text
Loading candidate staging queue...
```

Skeleton rows are acceptable if consistent with existing admin UI patterns.

## Empty state

The empty state should clearly indicate that no active staged candidates are
currently available.

Recommended empty copy:

```text
No active staged candidates found.
```

Optional helper copy:

```text
Archived and rejected smoke artifacts are excluded from this queue by default.
```

## Error state

The UI should show safe API errors only.

Recommended error shape handling:

```text
ok: false
error.code
error.message
```

The UI should not display raw exception messages or stack traces.

Recommended generic error copy:

```text
Candidate staging queue could not be loaded.
```

The UI may display the safe `error.code` for admin troubleshooting.

## Refresh behavior

The UI may include a refresh button that re-fetches the GET route.

The refresh button must not mutate data.

The refresh button should preserve the current filters.

## Fetch behavior

Future UI code should fetch:

```text
/api/admin/discovery/candidate-staging-queue
```

with query parameters derived from the selected filters.

The fetch should:

```text
Use GET.
Use same-origin credentials by browser default.
Use no client-side service-role credentials.
Avoid exposing admin secrets.
Parse JSON response.
Handle non-2xx responses safely.
```

The UI should not call Supabase directly from the browser.

## Responsive layout

Desktop:

```text
Table layout with primary candidate fields and compact metadata.
```

Tablet:

```text
Responsive table or stacked row cards with filter controls wrapping cleanly.
```

Mobile:

```text
Card list layout with important fields first and advanced metadata collapsed.
```

The UI should avoid horizontal overflow on mobile.

## Accessibility design

The future UI should include:

```text
Labelled search and filter controls.
Keyboard-accessible refresh button.
Semantic table headers if using a table.
Clear loading text.
Clear empty state text.
Clear error state text.
Visible focus states consistent with existing admin UI.
No color-only status meaning.
```

Status badges should include readable text labels.

## Security and privacy design

The UI must preserve:

```text
Admin-only access.
Read-only access.
No public route exposure.
No service-role secret exposure.
No raw database error exposure.
No stack trace exposure.
No raw payload exposure.
No mutation actions.
```

The UI must rely on the Phase 14Y API route for data access instead of direct
database calls.

## Testing design

Phase 15B should plan tests before implementation.

Recommended future tests:

```text
Renders loading state.
Renders empty state.
Renders error state from ok=false response.
Renders candidate rows from ok=true response.
Builds query string from filters.
Does not include inactive statuses in the status filter UI.
Does not render mutation buttons.
Refresh re-fetches without mutation.
Mobile/tablet layout does not overflow in smoke testing.
```

Recommended static guards:

```bash
rg -n "Approve|Publish|Promote|Reject|Archive|Delete" components/admin app/admin
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" components/admin app/admin
```

The exact guard paths should be narrowed in Phase 15B to avoid unrelated legacy
matches.

## Verification plan for future implementation

Future implementation should run:

```bash
npm run check
git diff --check
```

If UI tests are added, run the new UI test directly.

If Playwright smoke is used, include:

```text
Desktop result.
Tablet/iPad result.
Mobile result.
```

This matches the AiFinder responsive QA reporting preference.

## Out-of-scope for Phase 15A

Phase 15A does not implement:

```text
No UI code.
No component creation.
No route creation.
No route test creation.
No helper changes.
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

## Recommended next phase

Recommended next phase:

```text
Phase 15B — Candidate Staging Queue Admin UI Implementation Plan
```

Phase 15B should inspect the actual admin UI file structure, choose the smallest
safe integration point, and define exact implementation/test files before UI
code is written.

## Commit and push gates

Phase 15A itself is docs-only and may be committed after Gemini approval.

Push still requires explicit push approval.

Future live database access remains prohibited unless a future phase provides a
narrow read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 15A does not perform:

```text
No implementation.
No UI creation.
No API route creation.
No route test creation.
No helper changes.
No live database query.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```
