# AiFinder Discovery Engine — Phase 22S Candidate Decision Live Target Selection Plan

## Phase Status

Phase 22S is a documentation-only live target selection plan.

This phase defines how a future phase may safely identify one exact live candidate UUID for read-only verification and later non-mutating preflight work.

This phase does not select an actual live candidate.

This phase does not name a candidate.

This phase does not inspect the live database.

This phase does not run a live database query.

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

Phase 22R was completed and pushed to `main`.

```text
Latest pushed commit: 6a100db Document Phase 22R candidate decision live readiness gate
Expected repo status before Phase 22S docs step: ## main...origin/main
```

## Background

Phase 22R established the live-readiness boundary before any future candidate-target workflow.

It separated three concepts:

1. Local non-mutating preflight validation.
2. Future read-only live candidate lookup.
3. Future mutation-capable candidate decision execution.

Phase 22S continues that separation by planning only the live target selection process.

No live target is selected in this phase.

No live candidate data is accessed in this phase.

No mutation-capable workflow is authorized in this phase.

## Purpose

The purpose of Phase 22S is to define a safe, auditable method for selecting one exact live candidate UUID in a future phase.

The future selected candidate must be suitable for read-only verification before any non-mutating live preflight attempt.

The future selected candidate must not be chosen by fuzzy matching, recency, display name, queue position, or assumption.

The future selection process must be explicit enough that Gemini and James can review it before any live lookup happens.

## Key Principle

Candidate targeting must be exact.

A future live target must be identified by candidate UUID.

No operation should infer the candidate from ambiguous human-readable fields.

## Current Readiness Assessment

The project is ready to plan a future live candidate target selection workflow.

The project is not yet ready to perform a live database read in this phase.

The project is not yet ready to execute a live candidate-target preflight in this phase.

The project is not yet ready to execute any candidate decision mutation.

The project is not yet ready for public publishing.

The project is not yet ready for `approve_for_draft`.

The project is not yet ready for cleanup mutation.

## Target Selection Non-Goals

Phase 22S does not:

- choose a live candidate UUID
- confirm that a live candidate exists
- confirm candidate status
- confirm candidate metadata
- inspect candidate queue rows
- inspect audit rows
- inspect public tools rows
- inspect Supabase data
- run a live read query
- run a mutation
- stage a candidate
- approve a candidate
- reject a candidate
- approve for draft
- publish a candidate
- cleanup a candidate
- alter route behavior
- alter UI behavior

## Required Future Live Target Inputs

Before any future read-only live lookup phase, the target package must define:

- exact candidate UUID
- source of the candidate UUID
- reason the candidate is safe to inspect
- expected current candidate status
- intended future action label
- expected future next status label
- expected audit event name
- expected commit hash
- expected script path, if preflight is later run
- whether public publishing is allowed
- whether `approve_for_draft` is allowed
- whether cleanup is allowed
- exact James approval phrase required for the next phase
- Gemini review requirement for the next phase

The flags must remain locked unless explicitly unlocked by a separate reviewed phase:

```text
public publishing allowed: false
approve_for_draft allowed: false
cleanup allowed: false
```

## Acceptable Future Candidate UUID Sources

A future live target selection phase may use one of the following sources if separately reviewed and approved.

### Source A — James-provided exact UUID

James may provide an exact candidate UUID copied from an already trusted admin view or prior terminal output.

Requirements:

- James must provide the UUID explicitly.
- The source of the UUID must be stated.
- The phase must not infer the candidate from name, URL, queue order, or recency.
- The UUID must pass strict UUID validation.
- A future read-only lookup must still verify the candidate row before any preflight.

This is the safest target selection source if James already has a trusted candidate UUID.

### Source B — Future read-only lookup by exact UUID

A future phase may run a read-only query for one exact candidate UUID.

Requirements:

- The UUID must already be known before the query.
- The query must not list or scan candidates.
- The query must not update rows.
- The query must not write audit logs.
- The query must not call decision routes.
- The query must use an explicit opt-in variable.
- The query must emit a read-only pass/fail marker.

This source verifies a known candidate but does not discover one.

### Source C — Future read-only candidate listing gate

A future phase may design a read-only candidate listing if no exact UUID is available.

Requirements:

- It must be a separate reviewed phase.
- It must define the narrowest possible query.
- It must limit results.
- It must return only fields necessary for human target selection.
- It must not mutate rows.
- It must not write audit logs.
- It must not call decision routes.
- It must not choose the target automatically.
- James must manually choose one exact UUID after reviewing the output.

This source is more powerful and therefore requires more review than Source A or Source B.

## Disallowed Target Selection Methods

The following methods are prohibited:

- selecting the most recent candidate automatically
- selecting the first candidate in a queue automatically
- selecting by candidate name alone
- selecting by tool name alone
- selecting by domain alone
- selecting by URL alone
- selecting by category alone
- selecting by similarity score alone
- selecting by status alone
- selecting by UI row position
- selecting by copied partial UUID
- selecting by assumption from a previous phase
- selecting a candidate created by a live mutation in the same phase
- selecting a candidate and executing a decision in the same phase

## Candidate Eligibility Criteria for Future Verification

A future read-only verification phase should check only the minimum fields needed.

The future candidate should be eligible only if:

- the candidate UUID exactly matches the approved UUID
- the candidate row exists
- the candidate current status matches the expected status
- the candidate is not already decisioned in a conflicting way
- the candidate is not already publicly published by the intended decision path
- the candidate is not marked for cleanup
- the candidate has enough metadata to understand what would be decisioned
- the candidate action is compatible with the expected status transition
- the candidate does not require `approve_for_draft` unless a separate phase has approved it
- the candidate does not require public publishing unless a separate phase has approved it
- the candidate does not require cleanup mutation unless a separate phase has approved it

The future verification phase should fail locked if any eligibility condition is unclear.

## Minimum Future Read-Only Fields

If a future read-only lookup is approved, the query should return the minimum necessary fields.

Recommended minimum fields:

- candidate id
- candidate status
- normalized tool name or equivalent display label
- canonical URL or equivalent source URL, if available
- candidate source reference, if available
- created timestamp
- updated timestamp
- last decision-related timestamp, if available
- decision-related audit correlation id, if available
- metadata needed to confirm that the candidate matches James's intended target

The exact field list must be verified against the current schema before any query is run.

No sensitive or unnecessary fields should be printed.

No full raw extraction payload should be printed unless separately approved.

## Future Read-Only Lookup Script Requirements

A future read-only lookup script should:

- be added only in a separate implementation phase, if needed
- default to locked
- require explicit opt-in
- require exact candidate UUID
- require expected commit hash
- require clean repository status, unless the phase explicitly runs in a temporary clean clone
- perform only a single read-only lookup for the exact UUID
- avoid broad candidate listing unless the phase is specifically a listing gate
- emit deterministic markers
- copy raw output to clipboard
- save terminal output to `/tmp`
- preserve original success/failure exit status
- avoid heredocs by default

Recommended marker for exact UUID lookup pass:

```text
LIVE_CANDIDATE_EXACT_LOOKUP_READ_ONLY_PASS
```

Recommended marker for exact UUID lookup fail-locked:

```text
LIVE_CANDIDATE_EXACT_LOOKUP_READ_ONLY_FAIL_LOCKED
```

## Future Human Review Requirements

Before any live target proceeds to non-mutating preflight, James should review:

- the exact candidate UUID
- displayed candidate label
- source URL or canonical URL
- current status
- intended action
- expected next status
- whether public publishing remains false
- whether `approve_for_draft` remains false
- whether cleanup remains false

Gemini should review the package before any candidate-target preflight if the phase includes live candidate data.

## Future Gemini Review Requirements

Gemini should confirm:

1. The target is identified by exact UUID.
2. No fuzzy targeting is used.
3. The future live lookup, if any, is read-only.
4. No mutation is bundled into target selection.
5. Candidate decision execution remains locked.
6. Public publishing remains locked.
7. `approve_for_draft` remains locked.
8. Cleanup mutation remains locked.
9. The expected current and next statuses are explicit.
10. The exact James approval phrase is sufficiently specific.
11. It is safe to proceed to the next phase.

## Future Approval Phrase Requirements

A future target selection approval phrase must be phase-specific.

It must include the phase id and the exact operation.

For a future read-only lookup, acceptable structure:

```text
Approve Phase 22T read-only lookup for candidate UUID <uuid>
```

For a future non-mutating preflight, acceptable structure:

```text
Approve Phase 22U non-mutating preflight for candidate UUID <uuid> action <action>
```

Generic phrases must remain insufficient.

Examples of insufficient phrases:

```text
Approved
Proceed
Looks good
Run it
Do it
Gemini approved
Use this candidate
Continue
```

## Recommended Next Phase

Recommended next phase:

```text
Phase 22T — Candidate Decision Live Target Source Design
```

Recommended Phase 22T boundary:

```text
Docs-only target source design.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No source/API/UI/Supabase changes.
```

The purpose of Phase 22T should be to choose which acceptable candidate UUID source to use:

- James-provided exact UUID
- future read-only exact UUID lookup
- future read-only candidate listing gate

Phase 22T should not run a query.

## Alternative Next Phase

If James already has an exact candidate UUID from a trusted admin view, an alternative next phase may be:

```text
Phase 22T — Candidate Decision Exact UUID Target Package
```

That alternative should remain docs-only and should record the UUID, source, intended action, expected status transition, and lock flags.

It should not run a live database read.

## Commit Readiness Criteria

Phase 22S is safe to commit only if Gemini confirms:

- this phase is documentation-only
- no live DB reads are authorized
- no mutation is authorized
- no candidate target is actually selected
- exact UUID targeting is required for future work
- fuzzy targeting is prohibited
- live lookup and mutation remain separated
- public publishing remains locked
- `approve_for_draft` remains locked
- cleanup remains locked
- future approval phrase requirements are strict enough

## Phase 22S Conclusion

Phase 22S establishes the target selection plan for future live candidate work.

It does not choose a candidate.

It does not query the live database.

It does not run preflight.

It does not execute a decision.

It preserves the fail-closed Discovery Engine workflow before any live candidate interaction.
