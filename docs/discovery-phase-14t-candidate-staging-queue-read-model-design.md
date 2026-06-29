# Phase 14T — Candidate Staging Queue Read Model Design

## Status

Draft design only.

This phase designs the future safe read model for candidate staging queue rows
after the Phase 14 cleanup/review track and Phase 14S queue readiness gate.

This phase does not implement a read model, does not add a helper, does not add
an API route, does not add UI, does not query the live database, does not mutate
candidate rows, does not write to public tools, does not write to discovered
tools, and does not publish anything.

## Background

Phase 14Q safely archived the controlled smoke-test artifact.

Phase 14R documented the cleanup result.

Phase 14S established the queue readiness policy:

```text
Archived smoke artifacts are excluded from active queue workflows by default.
Active statuses: staged, needs_review, duplicate_suspected.
Inactive statuses: archived, rejected.
No public tools write.
No discovered_tools write.
No publish action.
```

Phase 14T now designs the read model that a later implementation may use for
admin-only candidate staging queue views.

## Design objective

Create a future admin-only read model for active candidate staging rows that:

```text
Reads only from public.discovery_candidate_tools.
Defaults to active statuses only.
Excludes archived and rejected rows by default.
Exposes only safe projected fields.
Supports bounded pagination and sorting.
Supports controlled filters.
Does not expose unsafe raw payloads.
Does not mutate any row.
Does not approve, publish, promote, or write to public tools.
Does not write to discovered_tools.
```

## Active queue filter

The default active queue filter must be:

```text
candidate_status in ('staged', 'needs_review', 'duplicate_suspected')
```

Rows with these statuses must be excluded by default:

```text
candidate_status='archived'
candidate_status='rejected'
candidate_status='approved'
candidate_status='published'
candidate_status='promoted'
candidate_status='live'
candidate_status='public'
```

`approved`, `published`, `promoted`, `live`, and `public` remain forbidden by
the staging safety model and must not become active queue states.

## Smoke artifact exclusion

The archived Phase 14 smoke artifact must not appear in the default active
queue read model:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status=archived
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

The read model should not special-case this ID. It should exclude the row
because `candidate_status='archived'` is outside the active status allowlist.

## Read model name

Recommended future helper name:

```text
listDiscoveryCandidateStagingQueueItems(...)
```

Recommended future module:

```text
lib/discovery/discovery-candidate-staging-queue-read-model.ts
```

The helper should be server-only/admin-only and must use the existing controlled
Supabase admin client pattern already used for Discovery Engine admin helpers.

## Input contract

Recommended input type:

```ts
type CandidateStagingQueueStatusFilter =
  | "staged"
  | "needs_review"
  | "duplicate_suspected";

type CandidateStagingQueueSortKey =
  | "created_at"
  | "updated_at"
  | "confidence_bucket";

type CandidateStagingQueueSortDirection = "asc" | "desc";

type ListDiscoveryCandidateStagingQueueItemsInput = {
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

Input rules:

```text
statuses defaults to ['staged', 'needs_review', 'duplicate_suspected'].
statuses must be a subset of the active status allowlist.
archived and rejected must be rejected as active queue status inputs.
limit defaults to 25.
limit maximum is 50.
sortKey defaults to created_at.
sortDirection defaults to desc.
search is optional and bounded.
search must not enable raw SQL injection.
IDs must be valid UUIDs when provided.
cursor must be opaque and validated.
```

## Output contract

Recommended output type:

```ts
type DiscoveryCandidateStagingQueueItem = {
  candidateId: string;
  candidateName: string;
  candidateStatus: "staged" | "needs_review" | "duplicate_suspected";
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

type ListDiscoveryCandidateStagingQueueItemsResult = {
  items: DiscoveryCandidateStagingQueueItem[];
  nextCursor: string | null;
  totalCount?: number;
  appliedStatuses: CandidateStagingQueueStatusFilter[];
};
```

Output rules:

```text
Do not return archived rows in default active queue output.
Do not return rejected rows in default active queue output.
Do not return raw unsafe HTML.
Do not return raw full extraction payloads.
Do not return service role keys.
Do not return environment variables.
Do not return private credentials.
Do not return fields that can directly publish or approve a candidate.
Do not include public tools mutation affordances.
Do not include discovered_tools mutation affordances.
```

## Safe SQL / Supabase query shape

The first implementation should use an allowlisted query shape equivalent to:

```text
from public.discovery_candidate_tools
select safe projected columns only
where candidate_status in ('staged', 'needs_review', 'duplicate_suspected')
order by created_at desc
limit bounded_limit
```

Optional filters may add:

```text
discovery_source_id equals a validated UUID
discovery_run_id equals a validated UUID
audit_correlation_id equals a validated UUID
duplicate_check_status equals an allowlisted value
confidence_bucket equals an allowlisted value
candidate_name ilike a bounded safe search term
candidate_website_url ilike a bounded safe search term
```

The implementation must not use raw SQL strings built from user input.

## Safe field projection

The read model may project:

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

The read model must not project:

```text
Service role keys
Secrets
Environment variables
Raw unsafe HTML
Raw unbounded extraction payloads
Private credentials
Public publishing control fields
Approval mutation fields
Promotion mutation fields
Any field not needed by the queue UI
```

## Pagination design

The first read model should support bounded pagination.

Recommended initial approach:

```text
limit default: 25
limit maximum: 50
sort: created_at desc
cursor: opaque encoded tuple of created_at and candidate_id
```

Cursor rules:

```text
Cursor must be optional.
Invalid cursor must fail closed with a safe error.
Cursor must not expose secrets.
Cursor must not allow arbitrary SQL.
Cursor should be stable across repeated reads.
```

Offset pagination may be used only for an initial internal admin prototype if
Gemini approves that simplification. Cursor pagination is preferred for long
queues.

## Search and filtering design

Search should be optional and conservative.

Allowed search fields:

```text
candidate_name
candidate_website_url
source_domain
```

Search rules:

```text
Trim whitespace.
Reject very short high-noise input if needed.
Limit maximum search length.
Escape wildcard-sensitive characters where required.
Do not search raw payloads.
Do not expose full-text ranking to public routes.
Do not include public catalog writes.
```

## Sorting design

Allowed sort keys:

```text
created_at
updated_at
confidence_bucket
```

Default sort:

```text
created_at desc
```

Sorting must not accept arbitrary column names.

## Admin boundary

The future read model must be reachable only from admin/server code.

If exposed through a route later, the route must require:

```text
Admin session.
Existing admin auth boundary.
No anonymous access.
No public access.
Safe JSON response.
No mutation method for initial read route.
```

The first API route should be `GET` read-only if implemented later.

## UI boundary

A future UI may display the read model, but Phase 14T does not implement UI.

A future UI must:

```text
Clearly label rows as staged candidates, not public tools.
Hide archived and rejected rows from the active queue by default.
Avoid approve/publish/promote buttons until separately approved.
Avoid public catalog writes.
Avoid discovered_tools writes.
Display source/run/audit identifiers safely.
Provide desktop, tablet, and mobile responsive layouts.
```

## Error handling

The read model should return safe errors such as:

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

## Test plan for future implementation

A future implementation phase should include tests proving:

```text
Default status filter includes staged, needs_review, duplicate_suspected.
Default status filter excludes archived.
Default status filter excludes rejected.
Archived Phase 14 smoke artifact is not returned by default active queue filter.
Rejected rows are not returned by default.
Invalid statuses are rejected.
Limit defaults to 25.
Limit cannot exceed 50.
Sort key is allowlisted.
Sort direction is allowlisted.
Safe projected columns are used.
No public tools writes are present.
No discovered_tools writes are present.
No insert/update/upsert/delete is present in the read model.
```

## Non-goals

Phase 14T does not perform:

```text
No implementation.
No helper file creation.
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

## Recommended next phase

Phase 14U — Candidate Staging Queue Read Model Implementation Plan.

Recommended scope:

```text
Docs-only implementation plan.
Map the Phase 14T read model to exact files and tests.
Decide helper file location.
Decide whether implementation starts helper-only or route+helper.
Preserve active status allowlist.
Exclude archived/rejected by default.
No implementation yet.
No live DB query.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```
