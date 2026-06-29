# Phase 14O — Controlled Staged Candidate Cleanup Method Decision Gate

## Status

Draft decision gate only.

This phase records the selected cleanup method for the controlled staged smoke
candidate created by the Phase 14J / 14K-D live staging smoke.

This document does not execute cleanup, does not update the candidate row, does
not delete the candidate row, does not publish anything, and does not run any
database command.

## Background

Phase 14L defined the controlled staged candidate review / cleanup gate.

Phase 14M performed a read-only review and confirmed the controlled smoke
candidate still existed exactly once, remained staged, and had not been
published.

Phase 14N performed cleanup method inspection / preparation. It confirmed the
candidate was still exactly bounded by exact ID, audit correlation ID, and
candidate website, and that no public `tools` or `discovered_tools` row existed
for the smoke candidate website.

## Controlled staged candidate

The cleanup target remains exactly:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
candidate_name=Phase 14K Controlled Preview Artifact Smoke Tool
candidate_status=staged
discovery_source_id=bc98e7db-ccdf-46dd-900f-dd538ade41bd
discovery_run_id=5f9440bc-9a5d-4faa-9feb-3cabcc97761b
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
candidate_website_url=https://example.com/phase-14k-controlled-preview-tool
source_url=https://example.com/
```

The row is a smoke-test artifact and must not be published to public tools.

## Phase 14N inspection result summary

Phase 14N confirmed the live database state through SELECT-only inspection:

```text
candidate_row_by_exact_id=1
candidate_rows_for_audit_correlation=1
candidate_rows_for_candidate_website=1
candidate_status=staged
public_tools_rows_for_candidate_website=0
discovered_tools_rows_for_candidate_website=0
no_public_write_confirmed=true
no_discovered_write_confirmed=true
no_publish_action_confirmed=true
```

Phase 14N local schema/migration inspection detected these candidate status
values:

```text
staged
needs_review
duplicate_suspected
rejected
archived
```

The same inspection detected `archived` and `rejected` as terminal cleanup
status candidates.

## Cleanup method decision

Selected future cleanup method:

```text
Exact-ID status transition from candidate_status='staged' to candidate_status='archived'
```

This is preferred over hard delete because it preserves an auditable row while
removing the smoke candidate from the active staging queue.

This is preferred over `candidate_status='rejected'` because the smoke candidate
is not being rejected for content, quality, eligibility, or duplicate reasons.
It is being retired as a controlled smoke-test artifact after successful
verification.

This phase does not perform that transition. It only records the method choice
for Gemini review and a later separately approved execution phase.

## Rejected cleanup methods

### Hard delete

Hard delete is not selected as the first cleanup method because it destroys the
candidate-row evidence created by the live staging smoke.

A hard delete may be considered only if the archive transition fails because of
schema drift or an unexpected live database constraint, and only after a new
review gate.

### Status transition to rejected

`candidate_status='rejected'` is not selected because rejection implies an
admin content-review outcome. The smoke artifact is not a real candidate tool
and does not need a content-review rejection reason.

### Any publishing or promotion path

Publishing, promotion, approval, or public tool insertion is categorically
forbidden for this smoke-test artifact.

## Future cleanup approval phrase

The exact cleanup approval phrase remains:

```text
Approve run Phase 14L controlled staged smoke candidate cleanup
```

That phrase may authorize only the selected exact-ID archive transition after
the cleanup implementation has been reviewed and committed:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
from candidate_status='staged'
to candidate_status='archived'
```

The phrase does not authorize:

```text
Public tools write
Discovered tools write
Publishing
Promotion
Approval
Bulk updates
Hard delete
Schema changes
Route/UI/source/package changes
Crawler activation
LLM extraction activation
```

## Future cleanup implementation requirements

A future cleanup script must:

```text
Require the exact cleanup approval phrase.
Load environment without printing secrets.
Use service-role credentials only in local controlled execution.
Check git status before execution and abort on uncommitted source changes.
SELECT the candidate by exact candidate_id before mutation.
Verify exactly one row by exact candidate_id.
Verify exactly one row by audit_correlation_id.
Verify exactly one row by candidate_website_url.
Verify candidate_status is staged before mutation.
Verify candidate_name matches the smoke fixture.
Verify discovery_source_id matches the smoke source.
Verify discovery_run_id matches the smoke run.
Verify audit_correlation_id matches the smoke audit correlation.
Verify candidate_website_url matches the smoke fixture.
Verify source_url matches the smoke fixture.
Verify zero public tools rows for the candidate website before mutation.
Verify zero discovered_tools rows for the candidate website before mutation.
Update exactly one row by exact candidate_id.
Set only candidate_status to archived unless a later reviewed script explicitly justifies additional fields.
Verify the candidate row still exists after mutation.
Verify candidate_status is archived after mutation.
Verify zero public tools rows for the candidate website after mutation.
Verify zero discovered_tools rows for the candidate website after mutation.
Verify no publish action occurred.
Print before/after evidence.
Keep git status clean after execution.
```

## Mutation boundary for future execution

The future cleanup mutation must be equivalent to:

```text
update public.discovery_candidate_tools
set candidate_status = 'archived'
where id = 'eafa4925-4cd9-4361-a8d0-37c8c6bdf65f'
  and audit_correlation_id = 'b5f334b2-b22a-4144-8655-6da1e34e3961'
  and candidate_status = 'staged'
  and candidate_website_url = 'https://example.com/phase-14k-controlled-preview-tool';
```

The future cleanup implementation must not use a broad update condition and
must not update any unrelated row.

## Abort conditions

Future cleanup execution must abort if any condition below is true:

```text
The exact cleanup approval phrase is missing.
Git status is not clean before execution.
The candidate row is missing.
More than one row matches the exact candidate ID.
More than one row matches the audit correlation ID.
More than one row matches the candidate website URL.
The candidate status is not staged.
The candidate name does not match the smoke fixture.
The discovery source ID does not match.
The discovery run ID does not match.
The audit correlation ID does not match.
The candidate website URL does not match.
The source URL does not match.
A public tools row exists for the candidate website.
A discovered_tools row exists for the candidate website.
The update affects zero rows.
The update affects more than one row.
The post-update candidate status is not archived.
The repo is not clean after execution.
```

## Non-goals

This phase and the selected future cleanup path must not perform:

```text
No public `tools` insert/update/upsert/delete
No `discovered_tools` insert/update/upsert/delete
No public publishing action
No candidate approval action
No candidate promotion action
No broad candidate cleanup
No hard delete in the selected path
No schema migration
No type generation
No source, route, helper, package, or UI change in this phase
No crawler automation activation
No LLM extraction activation
```

## Required review before execution

Before any cleanup script is written or executed, Gemini should review this
method decision and confirm whether exact-ID `candidate_status='archived'` is
the correct cleanup method.

## Recommended next phase

Phase 14P — Controlled Exact-ID Archive Cleanup Script Implementation.

Phase 14P should implement a local controlled cleanup runner for the selected
archive transition only. It should include tests and boundary assertions, but
it must not execute cleanup until the exact cleanup approval phrase is provided
again after review.
