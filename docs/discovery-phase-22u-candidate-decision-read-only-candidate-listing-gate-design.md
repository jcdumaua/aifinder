# AiFinder Discovery Engine — Phase 22U Candidate Decision Read-Only Candidate Listing Gate Design

## Phase Status

Phase 22U is a documentation-only read-only candidate listing gate design phase.

This phase designs a future safe listing gate that may be used only if James does not already have an exact candidate UUID.

This phase does not run a live database query.

This phase does not inspect live candidate rows.

This phase does not select a live candidate.

This phase does not record a live candidate UUID.

This phase does not run the candidate decision execution preflight script.

This phase does not perform candidate decision execution.

This phase does not perform database mutation.

This phase does not publish public-facing tools.

This phase does not run `approve_for_draft`.

This phase does not perform cleanup mutation.

This phase does not modify source code.

This phase does not modify executable scripts.

This phase does not modify API routes.

This phase does not modify UI.

This phase does not modify Supabase schema, migrations, policies, or generated types.

## Starting Checkpoint

Phase 22T was completed and pushed to `main`.

```text
Latest pushed commit: d23b6fd Document Phase 22T candidate decision live target source design
Expected repo status before Phase 22U docs step: ## main...origin/main
```

## Background

Phase 22T selected the safest future target source strategy:

```text
Primary source: James-provided exact UUID
Fallback source: separately reviewed read-only candidate listing gate
Not recommended as the first next step: automated candidate discovery or automatic selection
```

Phase 22U follows the fallback path.

This does not mean that a live query is approved.

It only means the project is designing the future listing gate before any read-only query is run.

## Purpose

The purpose of Phase 22U is to define a strict, fail-closed design for a future read-only candidate listing gate.

The future listing gate may be useful if James does not already have an exact candidate UUID.

The future listing gate must help James manually choose one exact candidate UUID.

It must not automatically choose a target.

It must not execute a candidate decision.

It must not mutate data.

It must not publish anything.

It must not cleanup anything.

It must not approve for draft.

## Core Principle

A listing gate is not a target decision.

A listing gate may only produce a small, bounded, read-only candidate list for human review.

James must manually choose one exact UUID in a later phase.

No script, query, model, UI row, recency rule, or matching rule may choose the candidate automatically.

## Current Readiness Assessment

The project is ready to design a future read-only listing gate.

The project is not yet ready to run a live read-only listing query in this phase.

The project is not yet ready to select a live candidate in this phase.

The project is not yet ready to run a candidate-target preflight in this phase.

The project is not yet ready to execute any candidate decision mutation.

The project is not yet ready for public publishing.

The project is not yet ready for `approve_for_draft`.

The project is not yet ready for cleanup mutation.

## Phase 22U Non-Goals

Phase 22U does not:

- run a live query
- read live candidate rows
- list candidate rows
- select a candidate
- record a candidate UUID
- verify candidate status
- verify candidate metadata
- run preflight
- execute a decision
- approve a candidate
- reject a candidate
- approve for draft
- publish a tool
- cleanup a candidate
- write audit logs
- update candidate rows
- add source files
- add scripts
- add API routes
- change UI
- change Supabase schema
- generate types

## Future Listing Gate Scope

A future read-only listing gate should be narrow and bounded.

It should be used only to obtain enough information for James to manually select one exact candidate UUID.

It should not be used for general candidate exploration.

It should not be used for analytics.

It should not be used for discovery ranking.

It should not be used to infer candidate quality.

It should not be used to decide an action.

## Future Listing Gate Table Scope

The future listing gate should read from the candidate staging source only.

Expected candidate table:

```text
public.discovery_candidate_tools
```

The actual table and field names must be verified against the current schema before implementation.

If the table name or required fields differ, the future implementation phase must fail and return to documentation.

No future listing gate should read from public-facing `tools` as a target source unless separately reviewed.

No future listing gate should read broad audit payloads unless separately reviewed.

No future listing gate should write to any table.

## Future Listing Gate Result Limit

A future read-only listing gate must use a small fixed result limit.

Recommended default limit:

```text
5
```

Recommended maximum allowed limit:

```text
10
```

The future gate must fail locked if a requested limit is:

- missing
- non-numeric
- less than 1
- greater than the approved maximum
- not an integer

The future gate should not support unbounded listing.

## Future Listing Gate Filtering

A future listing gate should require an explicit status filter.

Recommended default status:

```text
staged
```

The exact allowed candidate statuses must be verified against the current schema and prior phase contracts before implementation.

The future gate must fail locked if the status filter is ambiguous or unsupported.

A future listing gate should not list all statuses by default.

A future listing gate should not include candidates that are already decisioned or cleanup-targeted unless a separate phase explicitly approves that scope.

## Future Listing Gate Ordering

A future listing gate may use deterministic ordering, but ordering must not imply automatic target selection.

Recommended ordering:

```text
created_at ascending
id ascending
```

Alternative ordering may be used only if documented and reviewed.

The future output must state that ordering is only for stable display.

The first row must not be treated as the selected target.

The newest row must not be treated as the selected target.

## Future Listing Gate Allowed Fields

A future listing gate should output only fields needed for human selection.

Recommended allowed fields:

- candidate UUID
- candidate status
- normalized candidate name or display label
- canonical URL or source URL, if available
- source label or source reference, if available
- created timestamp
- updated timestamp

Optional fields, only if necessary and schema-safe:

- candidate category
- candidate pricing label
- duplicate-detection summary
- short decision readiness label
- audit correlation id

The future implementation phase must verify exact schema field names before query execution.

## Future Listing Gate Prohibited Fields

A future listing gate must not print:

- service role key
- environment variables
- full raw extraction payload
- full HTML capture
- screenshot storage paths unless separately approved
- private storage URLs
- broad audit payloads
- unrelated metadata blobs
- personal data
- secrets
- full error stack traces containing environment data
- public publishing payloads
- cleanup mutation payloads

If the minimum useful listing cannot be produced without prohibited fields, the future gate must fail closed.

## Future Listing Gate Output Format

A future listing output should be clear and reviewable.

Recommended format:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_PASS
count=<n>
limit=<limit>
status_filter=<status>

candidate[1].id=<uuid>
candidate[1].status=<status>
candidate[1].name=<display label>
candidate[1].url=<canonical or source url>
candidate[1].created_at=<timestamp>
candidate[1].updated_at=<timestamp>
```

No row should be marked as selected.

The output should include an explicit reminder:

```text
No candidate selected by this listing.
James must manually choose one exact UUID in a later docs-only target package phase.
```

## Future Listing Gate Failure Markers

A future listing gate should use deterministic failure markers.

Recommended fail-locked marker:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_FAIL_LOCKED
```

Recommended no-results marker:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS
```

A no-results outcome must not be treated as an error if the query safely ran and found no matching candidates.

However, no-results must not lead to guessing.

## Future Listing Gate Opt-In Requirements

A future live read-only listing phase must require explicit opt-in.

Recommended opt-in environment variable:

```text
AIFINDER_RUN_CANDIDATE_DECISION_READ_ONLY_LISTING_GATE=1
```

The future gate must fail locked if the opt-in is missing.

The future gate must also require:

- expected phase token
- expected commit hash
- expected status filter
- expected result limit
- explicit public publishing lock value
- explicit `approve_for_draft` lock value
- explicit cleanup lock value
- exact James approval phrase for the read-only listing phase

## Future Listing Gate Lock Values

The following values must remain false:

```text
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false
```

The future listing gate must fail locked if any of these values are not exactly `false`.

## Future Listing Gate Approval Phrase

A future live read-only listing phase must require a specific approval phrase.

Recommended structure:

```text
Approve Phase 22V read-only candidate listing gate status <status> limit <limit>
```

Generic phrases must remain insufficient.

Examples of insufficient phrases:

```text
Approved
Proceed
Run it
Looks good
Gemini approved
List candidates
Show candidates
Continue
```

## Future Listing Gate Repository Guard

A future listing gate should require a clean repository state.

Recommended expected status before a live read-only listing execution:

```text
## main...origin/main
```

The future gate should also verify the expected commit hash.

If a docs file is intentionally untracked during review, the live read must not run in that dirty state.

A future live read may use a temporary clean clone if needed, but that must be separately documented and reviewed.

## Future Listing Gate Database Boundary

The future gate must perform read-only operations only.

It must not:

- insert rows
- update rows
- delete rows
- upsert rows
- call RPCs that mutate data
- call candidate decision routes
- call public publishing routes
- call cleanup routines
- write audit logs
- change candidate status
- change candidate metadata
- change public tools
- change discovered tools
- change source rows
- change run rows

If read-only cannot be guaranteed, the future implementation must not proceed.

## Future Listing Gate Network Boundary

A future listing gate may connect to Supabase only in a separately approved live read-only execution phase.

This Phase 22U document does not authorize network access.

The future read-only phase must state which environment variables are required and must not print their values.

Any missing environment variable should produce a fail-locked output without attempting a query.

## Future Listing Gate Script Strategy

A future listing gate script, if implemented, should be a separate phase.

Recommended future script path:

```text
testing/discovery-candidate-decision-read-only-listing-gate.mjs
```

This file should not be created in Phase 22U.

The future script implementation phase should be narrow and reviewed before any live execution.

## Future Listing Gate Implementation Sequence

Recommended future sequence:

1. Phase 22V — Read-Only Candidate Listing Gate Implementation Plan.
2. Phase 22W — Read-Only Candidate Listing Gate Script Implementation.
3. Phase 22X — Read-Only Candidate Listing Gate Script Review.
4. Phase 22Y — Read-Only Candidate Listing Gate Live Execution Approval Gate.
5. Phase 22Z — Read-Only Candidate Listing Gate Live Execution.
6. Phase 22AA — Read-Only Candidate Listing Gate Result Documentation.
7. Phase 22AB — Exact UUID Target Package.

This sequence may be adjusted, but live execution must not occur before implementation and review.

## Future Human Selection Rule

After a future listing execution, James must manually select exactly one candidate UUID.

The selection must be recorded in a later docs-only exact UUID target package.

The target package must include:

- exact UUID
- source listing phase
- row number from the listing output, if applicable
- candidate display label
- candidate URL or source URL
- expected current status
- intended future action
- expected next status
- public publishing lock
- `approve_for_draft` lock
- cleanup lock
- Gemini review result

The listing phase itself must not select the target.

## Future Gemini Review Requirements

Before any future live read-only listing execution, Gemini should confirm:

1. The listing gate is read-only.
2. The result limit is small and bounded.
3. The status filter is explicit.
4. The allowed fields are minimal.
5. Prohibited fields are not printed.
6. No automatic target selection occurs.
7. Public publishing remains locked.
8. `approve_for_draft` remains locked.
9. Cleanup mutation remains locked.
10. Candidate decision execution remains locked.
11. The approval phrase is specific enough.
12. The live read is safe to run.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22V — Candidate Decision Read-Only Candidate Listing Gate Implementation Plan
```

Recommended Phase 22V boundary:

```text
Docs-only implementation plan.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No source/API/UI/Supabase changes.
```

Phase 22V should plan the future script only.

It should not create the script.

It should not run a query.

## Alternative Next Phase

If James obtains an exact candidate UUID before the listing gate is implemented, the workflow may skip the listing-gate implementation path and instead proceed to:

```text
Phase 22V — Candidate Decision Exact UUID Target Package
```

That alternative should remain docs-only.

It should not query Supabase.

It should record the UUID source and intended future verification path.

## Commit Readiness Criteria

Phase 22U is safe to commit only if Gemini confirms:

- this phase is documentation-only
- no live DB read is authorized
- no DB mutation is authorized
- no candidate decision execution is authorized
- no candidate is selected
- no candidate UUID is recorded
- future listing is bounded and read-only
- future listing output fields are minimal
- future listing cannot auto-select a target
- public publishing remains locked
- `approve_for_draft` remains locked
- cleanup mutation remains locked
- source/API/UI/Supabase changes are absent

## Phase 22U Conclusion

Phase 22U designs a future read-only candidate listing gate.

It does not run the listing.

It does not query the live database.

It does not select a candidate.

It does not record a candidate UUID.

It does not run preflight.

It does not execute a decision.

The Discovery Engine remains fail-closed before any live candidate interaction.
