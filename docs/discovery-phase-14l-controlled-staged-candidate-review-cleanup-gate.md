# Phase 14L — Controlled Staged Candidate Review / Cleanup Gate

## Status

Draft gate only.

This phase defines the safe review and cleanup gate for the controlled staged
candidate created by the Phase 14J / 14K-D live staging smoke.

This document does not review the candidate in the UI, does not clean up the
candidate row, does not publish the candidate, and does not run any database
command.

## Background

Phase 14J / 14K-D proved that one server-revalidated reviewable preview
artifact could be staged through the live route with strict boundaries intact.

Phase 14K-E documented the successful result in:

```text
docs/discovery-phase-14k-e-controlled-live-staging-smoke-result.md
```

The staged smoke candidate now exists as controlled evidence in the candidate
staging table and needs an explicit follow-up decision before any further
action.

## Controlled staged candidate

The controlled staged candidate created by the live smoke is:

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

This row is a smoke-test artifact. It is not a real AI tool listing and must
not be published to public tools.

## Goal

Define a safe decision gate for the staged smoke candidate.

Allowed future outcomes after separate explicit approval:

1. Read-only admin review evidence is recorded.
2. The staged candidate is retained temporarily as live smoke evidence.
3. The staged candidate is cleaned up through a bounded exact-ID cleanup path.

## Non-goals

This phase must not perform any of the following:

```text
No public `tools` insert/update/upsert/delete
No `discovered_tools` insert/update/upsert/delete
No public publishing action
No candidate approval action
No candidate promotion action
No broad candidate cleanup
No cleanup mutation in this phase
No schema migration
No type generation
No source, route, helper, package, or UI change
No crawler automation activation
No LLM extraction activation
```

## Required decision before mutation

Before any cleanup mutation is allowed, one of the following decisions must be
made explicitly:

```text
Keep the staged smoke candidate temporarily for audit evidence.
```

or:

```text
Clean up the staged smoke candidate through a bounded exact-ID cleanup.
```

No cleanup is allowed from implied approval, informal wording, or broad
phrases such as "continue" or "approved, proceed."

## Exact cleanup approval phrase

If cleanup is selected in a later phase, the required exact phrase is:

```text
Approve run Phase 14L controlled staged smoke candidate cleanup
```

That phrase authorizes only a cleanup attempt for the exact candidate row below:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f
audit_correlation_id=b5f334b2-b22a-4144-8655-6da1e34e3961
```

The phrase does not authorize:

```text
Publishing
Public `tools` writes
`discovered_tools` writes
Broad candidate deletion
Schema changes
Route/UI/source changes
Crawler or LLM activation
```

## Read-only review requirements

Before any cleanup, a read-only review should verify:

```text
The candidate row exists exactly once.
candidate_id matches eafa4925-4cd9-4361-a8d0-37c8c6bdf65f.
audit_correlation_id matches b5f334b2-b22a-4144-8655-6da1e34e3961.
candidate_status is staged.
candidate_name is Phase 14K Controlled Preview Artifact Smoke Tool.
candidate_website_url is https://example.com/phase-14k-controlled-preview-tool.
source_url is https://example.com/.
No public tools row exists for the smoke candidate.
No discovered_tools row exists for the smoke candidate.
No publishing action has occurred.
```

The read-only review may use SELECT-only inspection or admin UI review. It must
not change candidate status or trigger approval/publishing actions.

## Cleanup implementation requirements

If cleanup is later approved, the cleanup path must be bounded by all of the
following requirements:

```text
Require exact cleanup approval phrase.
Require service-role credentials only in local controlled execution.
Load environment without printing secrets.
Select candidate by exact candidate_id.
Verify audit_correlation_id before mutation.
Verify candidate_status is staged before mutation.
Verify smoke-test candidate name and URL before mutation.
Verify exactly one matching row before mutation.
Mutate exactly one matching row.
Verify zero public tools rows for the smoke candidate after cleanup.
Verify zero discovered_tools rows for the smoke candidate after cleanup.
Print before/after evidence.
Keep git status clean.
```

The cleanup must fail closed if any precondition does not match.

## Cleanup method selection

The cleanup method must be selected only after inspecting the current
`discovery_candidate_tools` schema and allowed status values.

Preferred order:

1. Use a reversible non-publishing status transition if the schema already
   supports an appropriate terminal cleanup/rejected/archived status.
2. If no appropriate safe status exists, use an exact-ID delete only for the
   smoke-test candidate row.
3. Do not add new schema values or columns solely for this cleanup unless a
   separate schema phase is approved.

Any chosen method must be documented before execution.

## Required post-cleanup verification

If cleanup is executed later, the result must verify:

```text
candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f no longer appears as an active staged candidate.
No public tools row exists for candidate_website_url=https://example.com/phase-14k-controlled-preview-tool.
No discovered_tools row exists for candidate_website_url=https://example.com/phase-14k-controlled-preview-tool.
No publishing action occurred.
No unrelated candidate rows were changed.
Repository status remains clean.
```

## Abort conditions

Cleanup must abort if any condition below is true:

```text
More than one candidate row matches the audit correlation.
The candidate ID does not match the approved smoke candidate.
The audit correlation ID does not match.
The candidate status is not staged.
The candidate name does not match the smoke fixture.
The candidate URL does not match the smoke fixture.
A public tools row already exists for the smoke candidate.
A discovered_tools row already exists for the smoke candidate.
The cleanup script detects uncommitted source changes.
The exact cleanup approval phrase is missing.
```

## Documentation requirement after cleanup

If cleanup is performed later, a follow-up result document must record:

```text
The exact cleanup approval phrase.
The selected cleanup method.
Before/after row counts.
Candidate ID.
Audit correlation ID.
Public tools absence verification.
Discovered tools absence verification.
Repo status before and after.
Any safe failures or recovery steps.
```

## Recommended next phase

Phase 14M — Controlled Staged Candidate Read-Only Review.

Phase 14M should inspect the staged smoke candidate without mutation and decide
whether to retain it temporarily as evidence or prepare an exact-ID cleanup
script for later approval.
