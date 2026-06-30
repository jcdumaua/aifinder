# Discovery Phase 15H — Candidate Staging Queue Detail Drawer Implementation Plan

## Status

Phase 15H is a planning-only phase for the future read-only Candidate Staging Queue Detail Drawer implementation.

Current pushed baseline:

```text
e0e7fad Document candidate staging queue pagination drawer design
```

Phase 15H follows Phase 15G, which recommended implementing a read-only detail drawer before cursor pagination.

Phase 15H does not implement the drawer. It defines the implementation plan for a later implementation phase.

## Objective

Design the safest implementation path for a read-only detail drawer inside the existing Candidate Staging Queue admin UI.

The future drawer should help admins inspect staged candidate metadata without leaving `/admin/discovery`, without adding backend risk, and without creating any candidate action workflow.

## Current Verified Baseline

The current Candidate Staging Queue admin UI is verified as a read-only panel on:

```text
/admin/discovery
```

It currently reads from:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Phase 15E browser QA confirmed:

- Desktop passed
- Tablet/iPad passed
- Mobile passed
- panel rendered successfully
- Refresh button rendered successfully
- empty state rendered successfully
- no horizontal overflow
- Candidate Staging Queue API calls were GET-only
- no forbidden mutation labels were visible
- no candidate extraction POST was sent

Phase 15F documented that browser QA result.

Phase 15G recommended implementing the read-only detail drawer before cursor pagination.

## Implementation Principle

The first detail drawer implementation should be UI-only and should use the already-loaded queue item data.

It should not add a new API route.

It should not change the Candidate Staging Queue API response shape unless a later implementation inspection proves that a required displayed field is unavailable.

It should not introduce backend helpers, migrations, or database changes.

## Files Expected to Change in Future Implementation

Future Phase 15I implementation is expected to modify or add only UI/static test files.

Expected new component:

```text
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
```

Expected modified component:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Expected new static test:

```text
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

Potentially modified package files:

```text
none expected
```

No API route, backend helper, migration, or package dependency changes should be needed for the first drawer implementation.

## Component Responsibility

### CandidateStagingQueueDetailDrawer

The future drawer component should be responsible for:

- rendering selected candidate metadata
- grouping fields into readable sections
- wrapping long IDs and URLs safely
- exposing a clear close control
- preserving read-only display
- avoiding mutation labels and action controls
- keeping responsive behavior safe across Desktop, Tablet/iPad, and Mobile

The component should accept props similar to:

```ts
type CandidateStagingQueueDetailDrawerProps = {
  candidate: CandidateStagingQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
```

The exact type name should match or reuse the existing queue item type from the panel when possible.

## State Plan

The existing Candidate Staging Queue panel should own drawer selection state.

Recommended state:

```ts
const [selectedCandidate, setSelectedCandidate] = useState<CandidateStagingQueueItem | null>(null);
```

Recommended derived open state:

```ts
const detailDrawerOpen = selectedCandidate !== null;
```

Recommended close behavior:

```ts
function closeDetailDrawer() {
  setSelectedCandidate(null);
}
```

Recommended open behavior:

```ts
function openDetailDrawer(candidate: CandidateStagingQueueItem) {
  setSelectedCandidate(candidate);
}
```

The drawer should reset selected candidate state to `null` when closed.

## Trigger Plan

Each candidate card should expose a read-only trigger such as:

```text
View details
```

The trigger should:

- open the drawer
- pass the selected candidate object
- not fetch additional data
- not mutate data
- not imply approval, publishing, promotion, rejection, archive, deletion, crawler execution, or extraction

Avoid trigger wording such as:

- Approve
- Publish
- Promote
- Reject
- Archive
- Delete
- Run extraction
- Run crawler
- Save to tools
- Insert into public tools
- Write to discovered_tools

## Drawer Sections

The drawer should group data into clear sections.

### Candidate Summary

Recommended fields:

- candidate name
- candidate status
- description
- category hint
- pricing hint
- confidence bucket

### URLs

Recommended fields:

- candidate website URL
- source URL
- source domain

URL display should preserve the existing safe HTTPS rendering approach from the queue panel.

Unsafe, malformed, credentialed, or non-HTTPS URLs should not become clickable links.

### Duplicate and Risk Signals

Recommended fields:

- duplicate check status
- duplicate signal types
- risk flags

Empty arrays should render as a safe empty state such as:

```text
None reported
```

### Discovery Metadata

Recommended fields:

- candidate ID
- discovery source ID
- discovery run ID
- audit correlation ID
- source evidence kind
- source evidence locator

Long IDs and evidence locators must wrap safely.

### Timestamps

Recommended fields:

- created at
- updated at

Timestamps should use the same safe formatting pattern already used by the queue panel, if available.

## Responsive Layout Plan

### Desktop

On Desktop:

- drawer may appear as a right-side sheet or modal drawer
- queue context should remain understandable
- sections should be vertically stacked
- long strings should wrap
- no horizontal overflow should appear

### Tablet/iPad

On Tablet/iPad:

- drawer may use a wider modal/sheet layout
- touch targets should remain accessible
- close control should be visible
- metadata should remain readable
- no horizontal overflow should appear

### Mobile

On Mobile:

- drawer should behave as a full-width or near-full-width sheet
- content should scroll vertically if needed
- close control should remain easy to reach
- long URLs and IDs must wrap
- no horizontal overflow should appear

## Accessibility Plan

The future drawer should preserve or improve accessibility.

Required behavior:

- accessible dialog or sheet semantics
- visible title
- visible close button
- keyboard close behavior where supported
- focus should move into the drawer when opened if supported by the component
- focus should return safely after close if supported by the component
- readable section headings
- no keyboard trap failures
- all controls should have clear accessible labels

If using an existing shadcn/Radix Dialog or Sheet component, prefer its built-in accessibility behavior.

If no Sheet component exists yet, use the existing Dialog pattern or add a Sheet component only if package/dependency changes are not required.

## Data Handling Plan

The first implementation should not introduce a new detail fetch.

The drawer should render only fields already available in the loaded candidate queue item.

If a field is missing or null, render a safe placeholder such as:

```text
Not provided
```

For arrays, render either a short list or a safe empty state.

For object-like metadata, avoid dumping raw JSON unless a later phase explicitly designs a safe formatted evidence viewer.

## Error Handling Plan

The drawer should not create new network errors because it should not fetch.

If no candidate is selected while open, it should either close or render a safe fallback.

The drawer should not render raw errors, stack traces, raw API payloads, or raw HTML.

## Security Boundary

The future implementation must not include:

- Supabase client imports
- no direct browser Supabase access
- no service-role exposure
- service-role access
- API route creation
- API route mutation
- database writes
- candidate approval
- candidate publishing
- candidate promotion
- candidate rejection
- candidate archiving
- candidate deletion
- crawler execution
- extraction execution
- insertion into `public.tools`
- writes to `discovered_tools`

The drawer must remain read-only.

## Static Test Plan

The future Phase 15I implementation should include a static test.

Suggested test path:

```text
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

Static tests should verify:

- drawer component file exists
- drawer component is client-safe if needed
- panel imports drawer component
- panel has selected candidate state
- panel renders a `View details` trigger
- drawer includes expected section labels
- drawer includes close behavior
- no forbidden mutation labels are introduced
- no mutation fetch methods are introduced
- no Supabase imports are introduced
- no service-role references are introduced
- no API route files are changed or required by the drawer
- safe URL handling remains present
- Desktop, Tablet/iPad, and Mobile QA markers are documented in future QA instructions

Forbidden visible labels should include:

- Approve
- Publish
- Promote
- Reject
- Archive
- Delete
- Insert into public tools
- Write to discovered_tools
- Run extraction
- Run crawler

Static mutation guards should include checks for:

- `method: "POST"`
- `method: "PATCH"`
- `method: "PUT"`
- `method: "DELETE"`
- `fetch("/api/admin/discovery/candidate-extraction/invoke"`
- `supabase`
- `service_role`
- `public.tools`
- `discovered_tools`

The existing `aria-live` pattern should not be treated as a mutation false positive.

## Browser QA Plan

After implementation and static verification, a later browser QA phase should validate:

### Desktop

- drawer opens from a candidate card
- drawer displays candidate metadata
- drawer closes successfully
- no horizontal overflow
- no forbidden mutation labels
- no mutation network requests

### Tablet/iPad

- drawer opens and closes
- metadata remains readable
- touch controls are usable
- no horizontal overflow
- no forbidden mutation labels
- no mutation network requests

### Mobile

- drawer opens as a mobile-safe sheet/dialog
- content scrolls vertically if needed
- close control is reachable
- long IDs and URLs wrap
- no horizontal overflow
- no forbidden mutation labels
- no mutation network requests

Browser QA should also confirm:

- Candidate Staging Queue API remains GET-only
- no POST is sent to candidate extraction invoke
- no writes are triggered
- final git status remains clean after QA

## Implementation Sequence for Phase 15I

Recommended future implementation order:

1. Inspect the existing Candidate Staging Queue panel type and data shape.
2. Create `candidate-staging-queue-detail-drawer.tsx`.
3. Add selected candidate state in the panel.
4. Add a `View details` trigger on each candidate card.
5. Render the drawer from the panel.
6. Use already-loaded candidate data only.
7. Add static tests.
8. Run existing Candidate Staging Queue tests.
9. Run `npm run check`.
10. Run `git diff --check`.
11. Stop for Gemini review before commit.

## Expected Future Verification Commands

Future Phase 15I should run:

```text
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
npm run check
git diff --check
git status --short
git status --branch --short
```

Browser QA should be deferred to a dedicated follow-up phase after implementation review.

## Phase 15H Boundary Confirmation

Phase 15H is docs-only and planning-only.

Phase 15H does not:

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

## Recommended Next Phase

Recommended next phase:

```text
Phase 15I — Candidate Staging Queue Detail Drawer Implementation
```

Phase 15I should implement only the read-only drawer described here, with static tests and no backend/API/migration/package changes unless implementation inspection proves an unavoidable blocker.
