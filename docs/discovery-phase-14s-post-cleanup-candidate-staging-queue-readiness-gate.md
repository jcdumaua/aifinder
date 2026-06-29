# Phase 14S — Post-Cleanup Candidate Staging Queue Readiness Gate

## Status

Draft readiness gate only.

This phase defines the post-cleanup readiness rules for future candidate staging
queue work after the controlled smoke artifact was archived in Phase 14Q and
documented in Phase 14R.

This phase does not implement a queue UI, does not query the live database, does
not update candidate rows, does not create candidates, does not delete
candidates, does not publish candidates, and does not write to public tools or
discovered tools.

## Background

Phase 14Q safely retired the controlled smoke-test candidate through an exact-ID
archive transition.

Phase 14R documented the result:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_status_before=staged
candidate_status_after=archived
updated_rows=1
public_tools_rows_for_candidate_website=0
discovered_tools_rows_for_candidate_website=0
no_public_write_confirmed=true
no_discovered_write_confirmed=true
no_publish_action_confirmed=true
```

The smoke artifact remains valuable as audit evidence, but it must not appear in
future active staging queue workflows.

## Controlled smoke artifact

The archived smoke artifact is:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_name=Phase 14K Controlled Preview Artifact Smoke Tool
candidate_status=archived
discovery_source_id=bc98e7db-ccdf-46dd-900f-dd538ade41bd
discovery_run_id=5f9440bc-9a5d-4faa-9feb-3cabcc97761b
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
source_url=https://example.com/
```

This row is not a real AI tool candidate. It is a smoke-test artifact.

## Queue readiness decision

Future active candidate staging queue workflows must exclude archived rows by default.

Default active queue statuses:

```text
candidate_status='staged'
candidate_status='needs_review'
candidate_status='duplicate_suspected'
```

Default inactive / terminal queue statuses:

```text
candidate_status='archived'
candidate_status='rejected'
```

The active candidate staging queue must not include:

```text
candidate_status='archived'
candidate_status='rejected'
candidate_status='approved'
candidate_status='published'
candidate_status='promoted'
candidate_status='live'
candidate_status='public'
```

`approved`, `published`, `promoted`, `live`, and `public` are already forbidden
by the staging schema safety model and must not become queue states.

## Smoke artifact exclusion rule

Any future staging queue read model, helper, API route, admin UI, or test must
exclude the Phase 14 smoke artifact from the default active queue.

At minimum, future active queue reads must satisfy:

```text
candidate_status in ('staged', 'needs_review', 'duplicate_suspected')
```

They must not show archived candidates unless an explicit archived/history view
is designed and approved later.

The exact smoke artifact must not be special-cased as an active row.

## Archived/history view boundary

A future archived/history view may be useful for auditability, but it must be
separate from the active staging queue.

If designed later, an archived/history view must:

```text
Be admin-only.
Be read-only by default.
Label archived smoke artifacts clearly as test artifacts.
Avoid publishing actions.
Avoid approval actions.
Avoid promotion actions.
Avoid public tools writes.
Avoid discovered_tools writes.
Require a separate phase before implementation.
```

## Active queue UI readiness requirements

Before a candidate staging queue UI is implemented, the design must define:

```text
Which statuses are shown in the active queue.
Which statuses are hidden by default.
How archived candidates are excluded.
How rejected candidates are excluded.
How duplicate_suspected candidates are displayed.
How source/run/audit evidence is shown safely.
How the UI avoids publish/approve actions until separately approved.
How the UI prevents public tools writes.
How the UI prevents discovered_tools writes.
How the UI prevents bulk mutation.
How pagination, sorting, and filters behave.
How mobile/tablet/desktop layouts behave.
```

## Active queue API readiness requirements

Before any active queue API route is implemented, the design must define:

```text
Admin-only access.
CSRF/session requirements if the route is mutating.
Read-only route behavior for first implementation.
Status filter allowlist.
Default exclusion of archived and rejected rows.
No public tools writes.
No discovered_tools writes.
No publishing.
No approval.
No promotion.
No crawler activation.
No LLM extraction activation.
Pagination limits.
Safe field projection.
No raw unsafe metadata exposure.
No secrets in responses.
```

## Active queue data projection requirements

A future active queue read model should expose only safe fields such as:

```text
candidate_id
candidate_name
candidate_status
candidate_website_url
candidate_category_hint
candidate_pricing_hint
confidence_bucket
duplicate_check_status
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

It must not expose:

```text
Service role keys
Admin secrets
Raw unsafe HTML
Unreviewed long raw extraction payloads
Private credentials
Internal environment variables
Any field that enables publishing without a separate approved route
```

## Publish and approval boundary

Phase 14S does not authorize candidate publishing, candidate approval, or public
catalog insertion.

Any future publish or approval workflow requires a separate design gate,
implementation plan, Gemini review, explicit implementation approval, and exact
execution approval if live mutation is involved.

Until then:

```text
No candidate approval.
No candidate promotion.
No public tools insert.
No public tools update.
No discovered_tools insert.
No discovered_tools update.
No public catalog mutation.
```

## Future verification expectations

A future Phase 14T or later active queue readiness inspection should confirm:

```text
Archived smoke artifact remains archived.
Archived smoke artifact is not returned by active queue filters.
Active queue filter uses only active statuses.
Public tools row count for smoke candidate website remains zero.
Discovered tools row count for smoke candidate website remains zero.
No publish action occurred.
Repo remains clean after any read-only inspection.
```

## Non-goals

This phase does not perform:

```text
No live database query.
No DB mutation.
No candidate row update.
No candidate row delete.
No candidate staging insert.
No public tools write.
No discovered_tools write.
No publish action.
No approval action.
No promotion action.
No queue UI implementation.
No API route implementation.
No helper implementation.
No schema migration.
No type generation.
No package change.
No crawler activation.
No LLM extraction activation.
```

## Recommended next phase

Phase 14T — Candidate Staging Queue Read Model Design.

Recommended scope:

```text
Docs-only design.
Define the read model and safe field projection for active candidate staging rows.
Default filter to active statuses only.
Exclude archived and rejected rows by default.
Preserve admin-only boundary.
No implementation.
No DB mutation.
No public tools write.
No discovered_tools write.
No publish action.
```
