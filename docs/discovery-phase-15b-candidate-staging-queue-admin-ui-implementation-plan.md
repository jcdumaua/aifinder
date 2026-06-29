# Phase 15B — Candidate Staging Queue Admin UI Implementation Plan

## Status

Draft implementation plan only.

This phase maps the Phase 15A Candidate Staging Queue Admin UI design to exact
future UI implementation files, component boundaries, fetch behavior, tests,
responsive QA, and verification steps.

Phase 15B does not implement UI, does not create components, does not create
client hooks, does not change API routes, does not run a live database query,
does not mutate candidate rows, does not write to public tools, does not write
to discovered tools, and does not publish anything.

## Current repo anchor

Latest commit observed before this plan:

```text
df2f091 Document candidate staging queue admin UI design
```

Phase 15A was pushed with:

```text
df2f091 Document candidate staging queue admin UI design
```

The secure backend route available to future UI work is:

```text
GET /api/admin/discovery/candidate-staging-queue
```

Backend route file:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
```

Backend route test file:

```text
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
```

The backend route delegates strict validation to:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

## Local admin UI structure inspection

Phase 15B inspected the current admin UI structure without changing UI files.

Inspection targets:

- `app/admin/discovery/page.tsx` — exists
- `components/admin` — exists
- `components/admin/discovery` — exists
- `app/admin/discovered-tools/page.tsx` — exists
- `app/admin/discovery/tools/page.tsx` — exists
- `app/admin/discovery/tools/[id]/page.tsx` — exists
- `app/api/admin/discovery/candidate-staging-queue/route.ts` — exists
- `testing/discovery-candidate-staging-queue-api-read-route.test.mjs` — exists

Observed admin UI files:

- `app/admin/analytics/page.tsx`
- `app/admin/discovered-tools/page.tsx`
- `app/admin/discovery/page.tsx`
- `app/admin/discovery/tools/[id]/page.tsx`
- `app/admin/discovery/tools/page.tsx`
- `app/admin/homepage-control/[id]/edit/page.tsx`
- `app/admin/homepage-control/[id]/page.tsx`
- `app/admin/homepage-control/[id]/preview/page.tsx`
- `app/admin/homepage-control/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/moderation/page.tsx`
- `app/admin/notifications/page.tsx`
- `app/admin/page.tsx`
- `app/admin/security/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/tools/page.tsx`
- `components/admin/admin-dashboard-client.tsx`
- `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx`
- `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts`
- `components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx`
- `components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts`
- `components/admin/discovery/discovery-queue-table.tsx`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/discovery-sources-panel.tsx`
- `components/admin/discovery/discovery-tool-detail.tsx`
- `components/admin/discovery/manual-metadata-fetch-results-review.tsx`
- `components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx`
- `components/admin/discovery/manual-static-html-evidence-results-review.tsx`
- `components/admin/homepage-control-create-draft-button.tsx`
- `components/admin/homepage-control-draft-editor.tsx`
- `components/admin/homepage-control-mark-preview-button.tsx`
- `components/admin/homepage-control-preview-checklist.tsx`
- `components/admin/homepage-control-publish-button.tsx`
- `components/admin/homepage-preview-banner.tsx`

Observed key statuses:

```text
app/admin/discovery/page.tsx: exists
components/admin: exists
components/admin/discovery: exists
```

## Implementation objective for the next phase

Recommended next implementation phase:

```text
Phase 15C — Candidate Staging Queue Admin UI Implementation
```

Phase 15C should implement the smallest safe read-only UI integration that
consumes:

```text
GET /api/admin/discovery/candidate-staging-queue
```

The first UI must remain:

```text
Admin-only.
Read-only.
No mutation buttons.
No direct browser Supabase access.
No live DB smoke unless separately approved.
No public tools write.
No discovered_tools write.
No publish action.
```

## Recommended integration point

Preferred integration point:

```text
app/admin/discovery/page.tsx
```

If `app/admin/discovery/page.tsx` is a server component, Phase 15C should add a
small client child component rather than converting unrelated admin page logic.

Recommended component placement:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

Recommended static/fake test file:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

If `components/admin/discovery/` does not exist, Phase 15C may create that
folder.

## Files to change in Phase 15C

Expected implementation files:

```text
app/admin/discovery/page.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Optional future split files only if the panel becomes too large:

```text
components/admin/discovery/candidate-staging-queue-table.tsx
components/admin/discovery/candidate-staging-queue-filters.tsx
components/admin/discovery/candidate-staging-queue-empty-state.tsx
components/admin/discovery/candidate-staging-queue-error-state.tsx
```

Phase 15C should prefer one panel component first unless existing code style
strongly favors smaller subcomponents.

## Files not to change in Phase 15C

Phase 15C should not change:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
supabase/migrations/*
lib/supabase/database.types.ts
package.json
package-lock.json
```

Exception:

```text
package.json may only change if a new UI test command is explicitly approved later.
```

Preferred Phase 15C verification runs any new UI test directly with `node`.

## Component boundary

The future component should be a client component:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
```

It should include:

```text
"use client";
```

Responsibilities:

```text
Fetch the admin queue API route.
Render loading, empty, error, and success states.
Render safe filters.
Build query strings from safe filters.
Render candidate rows or cards.
Provide read-only row detail expansion if kept simple.
Provide a refresh button.
Avoid mutation actions.
```

The component must not import:

```text
supabaseAdmin
createClient from @supabase/supabase-js
server-only Supabase helpers
service-role credentials
```

The browser UI must fetch only the admin API route.

## Fetch contract

Future UI fetch target:

```text
/api/admin/discovery/candidate-staging-queue
```

Fetch method:

```text
GET
```

The UI should rely on same-origin admin cookies. It must not handle service-role
secrets.

Recommended fetch behavior:

```text
Set loading state before request.
Build URLSearchParams from selected filters.
Call fetch(url, { method: "GET", cache: "no-store" }).
Parse JSON safely.
If response.ok is false or payload.ok is false, render safe error state.
If payload.ok is true, render queue items.
Do not expose raw exception messages or stack traces.
```

## Response types to mirror in UI

The UI may define local narrow client-side types that mirror the route response:

```text
CandidateStagingQueueApiReadResponse
CandidateStagingQueueApiReadErrorResponse
```

The UI should not import server-only route internals unless that is already a
safe existing project pattern.

Recommended local item shape fields:

```text
candidateId
candidateName
candidateStatus
candidateWebsiteUrl
candidateCategoryHint
candidatePricingHint
candidateDescription
confidenceBucket
duplicateCheckStatus
duplicateSignalTypes
riskFlags
discoverySourceId
discoveryRunId
auditCorrelationId
sourceUrl
sourceDomain
sourceEvidenceKind
sourceEvidenceLocator
createdAt
updatedAt
```

## Filter implementation plan

Initial visible filters:

```text
Search input.
Status multi-select or checkbox group limited to active statuses.
Duplicate check status input/select.
Confidence bucket input/select.
Limit select: 10, 25, 50.
Sort key select: created_at, updated_at, confidence_bucket.
Sort direction select: desc, asc.
Refresh button.
```

Advanced filters may be placed behind a collapsed details/advanced panel:

```text
discoverySourceId
discoveryRunId
auditCorrelationId
```

Do not expose cursor input yet because the backend intentionally returns:

```text
400 invalid_cursor
```

until a later cursor implementation phase is approved.

## Status filter plan

Allowed active statuses in UI:

```text
staged
needs_review
duplicate_suspected
```

Forbidden statuses must not be offered in the UI:

```text
archived
rejected
approved
published
promoted
live
public
```

The UI should treat any API `invalid_status_filter` response as a safe error
state.

## Read-only action boundary

Phase 15C must not render mutation buttons.

Forbidden interactive labels/actions:

```text
Approve
Publish
Promote
Reject
Archive
Delete
Insert into public tools
Write to discovered_tools
Run extraction
Run crawler
```

Recommended static helper copy only:

```text
Review actions are intentionally unavailable in this read-only phase.
```

The copy may be rendered as plain text, not as a disabled button, to avoid
creating the impression that mutation actions exist.

## Success state layout

Desktop layout:

```text
Table or table-like layout.
Candidate name and website first.
Status, confidence, duplicate check, category/pricing hints.
Source domain and timestamps as secondary metadata.
Expandable/collapsible details for IDs and evidence metadata.
```

Tablet layout:

```text
Table may wrap or convert to stacked row cards.
Filters should wrap without horizontal overflow.
```

Mobile layout:

```text
Card list.
Primary fields first.
Advanced metadata collapsed.
No horizontal overflow.
```

## Loading state

Recommended copy:

```text
Loading candidate staging queue...
```

Skeleton rows are acceptable only if consistent with existing admin UI style.

## Empty state

Recommended copy:

```text
No active staged candidates found.
```

Optional helper copy:

```text
Archived and rejected smoke artifacts are excluded from this queue by default.
```

## Error state

Recommended copy:

```text
Candidate staging queue could not be loaded.
```

The UI may also display safe API error codes:

```text
invalid_status_filter
invalid_limit
invalid_cursor
invalid_sort_key
invalid_sort_direction
invalid_uuid_filter
candidate_queue_read_failed
unauthorized
forbidden
```

The UI must not display raw exception messages, stack traces, raw Supabase
errors, service-role credentials, environment variables, or unsafe raw payloads.

## Row detail plan

Allowed read-only detail fields:

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
Created at.
Updated at.
```

Forbidden detail fields:

```text
Raw HTML.
Raw extraction payload.
Service-role credentials.
Environment variables.
Private logs.
Raw stack traces.
Mutation buttons.
```

## Accessibility requirements

Phase 15C should include:

```text
Labelled filter controls.
Keyboard-accessible refresh button.
Semantic table headers if table layout is used.
Clear loading text.
Clear empty state text.
Clear error state text.
Visible focus states consistent with existing admin UI.
No color-only status meaning.
Status badges with readable text labels.
```

## Testing plan for Phase 15C

Recommended new test:

```text
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

The test can be static/source-oriented if no React test tooling is available.

Required test assertions:

```text
Panel uses the admin API route path.
Panel uses GET fetch behavior.
Panel includes only active statuses.
Panel does not include forbidden statuses as selectable options.
Panel does not include mutation button labels.
Panel renders loading copy.
Panel renders empty copy.
Panel renders safe error copy.
Panel includes refresh behavior.
Panel avoids direct Supabase imports.
Panel avoids service-role references.
Integration page imports/renders the panel.
```

If future React test tooling is already available, Phase 15C may use it. Do not
add new test dependencies without explicit approval.

## Static guards for Phase 15C

Use narrowed guard paths to avoid unrelated legacy matches.

Suggested guard paths:

```text
components/admin/discovery/candidate-staging-queue-panel.tsx
app/admin/discovery/page.tsx
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
```

Mutation label guard:

```bash
rg -n "Approve|Publish|Promote|Reject|Archive|Delete|Insert into public tools|Write to discovered_tools|Run extraction|Run crawler" components/admin/discovery/candidate-staging-queue-panel.tsx app/admin/discovery/page.tsx
```

Expected result:

```text
No interactive mutation controls.
```

Direct mutation call guard:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" components/admin/discovery/candidate-staging-queue-panel.tsx app/admin/discovery/page.tsx
```

Expected result:

```text
No matches.
```

Direct Supabase/browser secret guard:

```bash
rg -n "supabaseAdmin|SUPABASE_SERVICE_ROLE_KEY|createClient\(" components/admin/discovery/candidate-staging-queue-panel.tsx app/admin/discovery/page.tsx
```

Expected result:

```text
No matches.
```

Backend route should remain unchanged:

```bash
git diff --name-only | rg "app/api/admin/discovery/candidate-staging-queue/route.ts|lib/discovery/discovery-candidate-staging-queue-read-model.ts"
```

Expected result:

```text
No matches.
```

## Verification commands for Phase 15C

Recommended verification:

```bash
node testing/discovery-candidate-staging-queue-admin-ui.test.mjs
node testing/discovery-candidate-staging-queue-api-read-route.test.mjs
node testing/discovery-candidate-staging-queue-read-model.test.mjs
npm run check
git diff --check
```

If Playwright or manual responsive QA is performed, report:

```text
Desktop result.
Tablet/iPad result.
Mobile result.
```

## Out-of-scope for Phase 15C

Phase 15C must not implement:

```text
No mutation buttons.
No approval action.
No publish action.
No promotion action.
No reject action.
No archive action.
No delete action.
No public tools write.
No discovered_tools write.
No API route changes.
No helper changes.
No schema migration.
No type generation.
No package dependency change.
No live database query unless separately approved.
No DB mutation.
No crawler activation.
No LLM extraction activation.
```

## Recommended next phase

Recommended next phase:

```text
Phase 15C — Candidate Staging Queue Admin UI Implementation
```

Phase 15C should implement only the read-only admin UI integration and its
static/fake test.

## Commit and push gates

Phase 15B itself is docs-only and may be committed after Gemini approval.

Phase 15C implementation must be Gemini-reviewed before commit.

Push still requires explicit push approval.

Future live database access remains prohibited unless a future phase provides a
narrow read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 15B does not perform:

```text
No implementation.
No UI creation.
No component creation.
No client hook creation.
No API route creation.
No API route change.
No route test creation.
No helper changes.
No live database query.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```
