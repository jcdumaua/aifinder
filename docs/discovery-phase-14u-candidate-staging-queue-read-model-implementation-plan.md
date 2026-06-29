# Phase 14U — Candidate Staging Queue Read Model Implementation Plan

## Status

Draft implementation plan only.

This phase maps the Phase 14T candidate staging queue read model design to exact
future implementation files, helper boundaries, tests, and verification steps.

This phase does not implement the helper, does not add tests, does not add an
API route, does not add UI, does not query the live database, does not mutate
candidate rows, does not write to public tools, does not write to discovered
tools, and does not publish anything.

## Background

Phase 14S established the post-cleanup candidate staging queue readiness rules.

Phase 14T designed the future candidate staging queue read model.

Phase 14T was pushed to `main` with commit:

```text
b5c76a5 Document candidate staging queue read model
```

Phase 14T selected the future helper:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

Phase 14T selected the future module:

```text
lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

Phase 14U plans the first implementation step without writing code.

## Implementation objective

The next implementation phase should add a helper-only candidate staging queue
read model.

The helper must:

```text
Read only from public.discovery_candidate_tools.
Default to active statuses only.
Exclude archived and rejected rows by default.
Reject inactive statuses when passed as active queue filters.
Project safe fields only.
Support bounded limit handling.
Use allowlisted sort keys and sort directions.
Avoid raw SQL strings built from user input.
Avoid any insert/update/upsert/delete mutation.
Avoid public tools writes.
Avoid discovered_tools writes.
Avoid publish/approval/promotion actions.
```

## Recommended next implementation phase

Recommended next phase:

```text
Phase 14V — Candidate Staging Queue Read Model Helper Implementation
```

Phase 14V should be helper-only.

Phase 14V should not add:

```text
No API route.
No admin UI.
No live smoke.
No live database query unless separately approved.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```

## Files to add in Phase 14V

Implementation file:

```text
lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

Test file:

```text
testing/discovery-candidate-staging-queue-read-model.test.mjs
```

No other files should be required for the first helper-only implementation.

If the implementation discovers a need for shared constants or utility
extraction, that should be paused and reviewed before expanding scope.

## Files not to change in Phase 14V

Phase 14V should not change:

```text
app/api/admin/discovery/*
components/admin/discovery/*
app/admin/discovery/*
supabase/migrations/*
lib/supabase/database.types.ts
package.json
package-lock.json
```

Exception:

```text
package.json may only change if a new script is explicitly approved later.
```

The preferred Phase 14V path is to run the test directly with `node` and avoid a
package change.

## Helper export plan

The implementation module should export:

```ts
export const DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
] as const;

export type CandidateStagingQueueStatusFilter =
  (typeof DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES)[number];

export type CandidateStagingQueueSortKey =
  | "created_at"
  | "updated_at"
  | "confidence_bucket";

export type CandidateStagingQueueSortDirection = "asc" | "desc";

export type ListDiscoveryCandidateStagingQueueItemsInput = {
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

export type DiscoveryCandidateStagingQueueItem = {
  candidateId: string;
  candidateName: string;
  candidateStatus: CandidateStagingQueueStatusFilter;
  candidateWebsiteUrl: string;
  candidateCategoryHint: string | null;
  candidatePricingHint: string | null;
  candidateDescription: string | null;
  confidenceBucket: string | null;
  duplicateCheckStatus: string | null;
  duplicateSignalTypes: string[];
  riskFlags: string[];
  discoverySourceId: string | null;
  discoveryRunId: string;
  auditCorrelationId: string;
  sourceUrl: string;
  sourceDomain: string | null;
  sourceEvidenceKind: string;
  sourceEvidenceLocator: string;
  createdAt: string;
  updatedAt: string;
};

export type ListDiscoveryCandidateStagingQueueItemsResult = {
  items: DiscoveryCandidateStagingQueueItem[];
  nextCursor: string | null;
  totalCount?: number;
  appliedStatuses: CandidateStagingQueueStatusFilter[];
};

export async function listDiscoveryCandidateStagingQueueItems(
  input?: ListDiscoveryCandidateStagingQueueItemsInput,
): Promise<ListDiscoveryCandidateStagingQueueItemsResult>;
```

If dependency injection is needed for testability, use a narrow internal client
interface rather than exposing a service-role client.

## Query projection plan

The helper should select only the Phase 14T safe projected columns:

```text
id
candidate_name
candidate_status
candidate_website_url
candidate_category_hint
candidate_pricing_hint
candidate_description
confidence_bucket
duplicate_check_status
duplicate_signal_types
risk_flags
discovery_source_id
discovery_run_id
audit_correlation_id
source_url
source_domain
source_evidence_kind
source_evidence_locator
created_at
updated_at
```

The helper must not select:

```text
Raw unsafe HTML
Raw unbounded extraction payloads
Secrets
Environment variables
Private credentials
Service role keys
Public publishing control fields
Approval mutation fields
Promotion mutation fields
Any field not needed by the queue UI
```

## Default status behavior

Default statuses:

```text
staged
needs_review
duplicate_suspected
```

The implementation must generate a query equivalent to:

```text
candidate_status in ('staged', 'needs_review', 'duplicate_suspected')
```

The helper must reject these inactive statuses if passed in `input.statuses`:

```text
archived
rejected
approved
published
promoted
live
public
```

Failure code:

```text
invalid_status_filter
```

## Archived smoke artifact behavior

The archived Phase 14 smoke artifact must not be returned by default:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status=archived
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

The implementation must not special-case this ID. It must be excluded because
`archived` is outside the active status allowlist.

## Limit behavior

Default limit:

```text
25
```

Maximum limit:

```text
50
```

Invalid limits should fail with:

```text
invalid_limit
```

Invalid examples:

```text
0
-1
51
999
NaN
Infinity
```

## Sorting behavior

Allowed sort keys:

```text
created_at
updated_at
confidence_bucket
```

Allowed sort directions:

```text
asc
desc
```

Defaults:

```text
sortKey=created_at
sortDirection=desc
```

Invalid sort keys should fail with:

```text
invalid_sort_key
```

Invalid sort directions should fail with:

```text
invalid_sort_direction
```

## Filter behavior

Optional filters:

```text
discoverySourceId
discoveryRunId
auditCorrelationId
duplicateCheckStatus
confidenceBucket
search
```

UUID filters must be validated:

```text
discoverySourceId
discoveryRunId
auditCorrelationId
```

Invalid UUID filters should fail with:

```text
invalid_uuid_filter
```

Search should be bounded and conservative.

Allowed search fields:

```text
candidate_name
candidate_website_url
source_domain
```

Search must not query raw payloads.

## Cursor behavior

Phase 14V may either:

```text
Implement no cursor yet and always return nextCursor=null.
```

or:

```text
Implement an opaque cursor based on created_at and candidate_id.
```

If cursor support is deferred, the helper must document that `nextCursor` is
reserved and currently returns `null`.

If cursor support is implemented, invalid cursors must fail with:

```text
invalid_cursor
```

Cursor implementation must not expose secrets and must not allow arbitrary SQL.

## Error handling plan

The helper should use safe error codes:

```text
invalid_status_filter
invalid_limit
invalid_cursor
invalid_sort_key
invalid_sort_direction
invalid_uuid_filter
candidate_queue_read_failed
```

Errors must not expose:

```text
Secrets
Connection strings
Service role keys
Raw database stack traces
Internal environment variables
Unsafe raw payloads
```

## Test implementation plan

The test file should verify the helper contract without live DB access.

Test file:

```text
testing/discovery-candidate-staging-queue-read-model.test.mjs
```

Recommended test categories:

```text
active status defaults
inactive status rejection
safe projection assertion
limit validation
sort validation
uuid validation
search bounding
no mutation calls
row mapping
archived smoke artifact exclusion by status behavior
error code safety
```

## Required tests for Phase 14V

Phase 14V should include tests proving:

```text
Default statuses are staged, needs_review, duplicate_suspected.
Archived is rejected as an input status.
Rejected is rejected as an input status.
Approved/published/promoted/live/public are rejected as input statuses.
Default limit is 25.
Limit maximum is 50.
Invalid limits fail closed.
Default sort is created_at desc.
Sort key is allowlisted.
Sort direction is allowlisted.
UUID filters are validated.
Safe projected columns are selected.
No raw unsafe fields are selected.
No insert/update/upsert/delete calls are made.
No public tools writes are present.
No discovered_tools writes are present.
Rows map snake_case database fields to camelCase output fields.
Archived smoke artifact shape is excluded by status allowlist behavior.
```

## Suggested test implementation approach

Use a mock Supabase query builder or narrow fake client.

The fake client should be able to record:

```text
table name requested
selected columns
status filters
limit value
sort key
sort direction
optional filters
whether insert/update/upsert/delete was called
```

The fake client must fail the test if any mutation-like method is invoked:

```text
insert
update
upsert
delete
rpc
```

The first helper implementation should not require a live Supabase connection.

## Verification commands for Phase 14V

Recommended verification:

```bash
node testing/discovery-candidate-staging-queue-read-model.test.mjs
npm run check
git diff --check
```

Additional static guard:

```bash
rg -n "insert\(|update\(|upsert\(|delete\(|rpc\(" lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

The static guard should either return no results or only documented false
positives that are reviewed before commit.

## Out-of-scope for Phase 14V

Phase 14V must not implement:

```text
No API route.
No admin UI.
No live database smoke.
No queue page.
No publish workflow.
No approval workflow.
No promotion workflow.
No archived/history view.
No public tools write.
No discovered_tools write.
No schema migration.
No type generation.
No package dependency change.
No crawler activation.
No LLM extraction activation.
```

## Future phases after Phase 14V

Possible later phases:

```text
Phase 14W — Candidate Staging Queue Read Model Helper Review / Commit
Phase 14X — Candidate Staging Queue API Read Route Design
Phase 14Y — Candidate Staging Queue API Read Route Implementation Plan
Phase 14Z — Candidate Staging Queue API Read Route Implementation
```

The exact phase sequence may be adjusted after Phase 14V results and Gemini
review.

## Commit and push gates

Phase 14U itself is docs-only and may be committed after Gemini approval.

Phase 14V implementation must be Gemini-reviewed before commit.

Push still requires explicit push approval.

Live database access remains prohibited unless a future phase provides a narrow
read-only inspection plan and the user explicitly approves it.

Any live database mutation requires a separate exact approval phrase.

## Non-goals

Phase 14U does not perform:

```text
No implementation.
No helper file creation.
No test file creation.
No API route creation.
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
