# AiFinder Discovery Engine — Phase 22R Candidate Decision Execution Preflight Live Readiness Gate

## Phase Status

Phase 22R is a documentation-only live-readiness gate.

This phase evaluates readiness to move from synthetic local preflight validation toward a future live candidate-target preflight workflow.

This phase does not modify source code.

This phase does not modify executable scripts.

This phase does not run the candidate decision execution preflight script.

This phase does not perform live database reads.

This phase does not perform database writes.

This phase does not execute candidate decisions.

This phase does not run `approve_for_draft`.

This phase does not publish public-facing tools.

This phase does not perform cleanup mutation.

## Starting Checkpoint

Phase 22Q was completed and pushed to `main`.

```text
Latest pushed commit: e89572e Document Phase 22Q phase token validation review
Expected repo status before Phase 22R docs step: ## main...origin/main
```

## Background

The candidate decision execution preflight script now supports canonical AiFinder phase tokens.

The Phase 22P implementation added:

```text
validatePhaseToken(value)
```

with the pattern:

```text
^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$
```

The Phase 22Q review verified:

- `22Q` passes non-mutating preflight
- `22AA` passes non-mutating preflight
- `Phase22Q` passes non-mutating preflight
- generic approval language fails locked
- unsafe phase tokens fail locked
- `approve_for_draft` remains locked
- `npm run check` passes

The preflight script remains non-mutating.

It still performs local validation only.

It does not read from Supabase.

It does not write to Supabase.

It does not execute candidate decisions.

## Purpose

The purpose of Phase 22R is to establish a live-readiness gate before any future phase attempts to involve an actual live candidate target.

This gate separates three concepts:

1. Local non-mutating preflight validation.
2. Future read-only live candidate target selection or verification.
3. Future mutation-capable candidate decision execution.

Only the first concept is currently implemented.

The second and third concepts remain locked.

## Current Readiness Assessment

The local preflight script is ready for continued non-mutating use.

The system is not yet ready for live candidate decision execution.

The system is not yet approved for live database reads as part of this phase.

The system is not yet approved for any mutation-capable workflow.

The system is not yet approved for public publishing.

The system is not yet approved for `approve_for_draft`.

The system is not yet approved for cleanup mutation.

## What Phase 22R Confirms

Phase 22R confirms:

- the preflight script has passed local non-mutating review
- phase-token validation has been refined and reviewed
- canonical phase tokens are accepted
- generic approval language remains rejected
- explicit candidate id input remains required
- repository state guard remains required
- expected commit guard remains required
- public publishing remains locked
- `approve_for_draft` remains locked
- cleanup mutation remains locked
- candidate decision execution remains locked

## What Phase 22R Does Not Confirm

Phase 22R does not confirm:

- that a specific live candidate exists
- that a specific live candidate is safe to use
- that a live candidate has the expected current status
- that a live candidate has the expected metadata
- that a live candidate is ready for decision execution
- that any live database query should be run
- that any database mutation should be run
- that any candidate decision should be executed
- that public publishing should be enabled
- that `approve_for_draft` should be enabled
- that cleanup mutation should be enabled

## Required Future Separation

Future work should remain split into narrow phases.

Recommended separation:

1. Docs-only live target selection plan.
2. Optional read-only live candidate lookup gate.
3. Optional read-only live candidate lookup execution.
4. Documentation of read-only lookup result.
5. Non-mutating live candidate preflight execution.
6. Documentation of live candidate preflight result.
7. Separate candidate decision execution gate.
8. Separate mutation-capable execution implementation or invocation, only if explicitly approved.

No future phase should combine live read, preflight, mutation, cleanup, and public publishing.

## Future Live Candidate Target Requirements

Before any future live candidate-target preflight, the following must be explicit:

- candidate UUID
- intended action
- expected current candidate status
- expected next candidate status
- expected audit event name
- expected commit hash
- public publishing allowed flag
- `approve_for_draft` allowed flag
- cleanup allowed flag
- exact James approval phrase
- Gemini review status, if required

The candidate UUID must be exact.

No fuzzy candidate targeting is allowed.

No targeting by candidate name alone is allowed.

No targeting by tool name alone is allowed.

No targeting by queue position alone is allowed.

No targeting by most recent candidate is allowed.

## Future Live Read Boundary

Any future live database read must be separately approved.

A future live read phase should be read-only.

It should only inspect the minimum data needed to validate the candidate target.

It should not modify rows.

It should not write audit logs.

It should not update candidate status.

It should not call a candidate decision route.

It should not call public publishing routes.

It should not call cleanup routines.

It should not call `approve_for_draft`.

A future read-only query should be guarded by an explicit opt-in variable.

It should print a clear read-only marker.

Recommended future read-only marker:

```text
LIVE_CANDIDATE_LOOKUP_READ_ONLY_PASS
```

Recommended future fail marker:

```text
LIVE_CANDIDATE_LOOKUP_READ_ONLY_FAIL_LOCKED
```

## Future Non-Mutating Live Candidate Preflight Boundary

A future non-mutating live candidate preflight may use an actual candidate UUID only after live target readiness is documented.

That future phase should still not read or write the database unless separately approved.

The preflight script should remain a local guard that validates:

- environment input contract
- exact candidate UUID syntax
- exact approval phrase
- expected status transition labels
- lock flags
- expected audit event label
- repo state
- expected commit

Passing preflight should not be treated as approval to execute a mutation.

It should only mean the local guard accepted the provided inputs.

## Future Mutation Boundary

Candidate decision execution remains locked.

Any future mutation-capable candidate decision phase must require a new explicit approval phrase.

The future mutation approval phrase must include:

- phase id
- candidate UUID
- action name
- expected current status
- expected next status
- confirmation that mutation is intended

Generic approval phrases must remain insufficient.

Examples of insufficient phrases:

```text
Proceed
Approved
Looks good
Run it
Gemini approved
Do the decision
Commit it
Push it
```

## Public Publishing Boundary

Public publishing remains locked.

A future candidate decision phase must not publish to public-facing `tools` unless a separate public publishing phase explicitly authorizes that behavior.

A candidate decision approval must not imply public publishing approval.

## approve_for_draft Boundary

`approve_for_draft` remains locked.

No future phase should infer `approve_for_draft` permission from candidate decision preflight approval.

`approve_for_draft` should remain blocked until a separate reviewed phase explicitly authorizes it.

## Cleanup Boundary

Cleanup mutation remains locked.

Cleanup must not be bundled with candidate decision execution.

Cleanup must require a separate plan, review, approval, execution, and documentation phase.

## Audit Boundary

Future candidate decision execution must define the expected audit event before mutation.

A future live read-only phase must not write audit logs.

A future local preflight phase must not write audit logs.

Only a future mutation-capable execution phase may produce mutation audit writes, and only after explicit approval.

## Recommended Next Phase

Recommended next phase:

```text
Phase 22S — Candidate Decision Live Target Selection Plan
```

Recommended Phase 22S boundary:

```text
Docs-only live target selection plan.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No source/API/UI/Supabase changes.
```

The purpose of Phase 22S should be to define the safest method to identify one exact live candidate UUID for future read-only verification.

## Alternative Next Phase

If the team wants one more gate before selecting a live target, an alternative next phase is:

```text
Phase 22S — Candidate Decision Live Read-Only Lookup Design
```

That alternative should remain docs-only and should not run a live query.

## Gemini Review Requirement

Phase 22R should be reviewed by Gemini before commit.

Gemini should confirm:

1. Phase 22R is documentation-only.
2. No live database reads are authorized.
3. No database mutations are authorized.
4. No candidate decision execution is authorized.
5. Public publishing remains locked.
6. `approve_for_draft` remains locked.
7. Cleanup mutation remains locked.
8. Future live read and future mutation phases remain separated.
9. Exact candidate UUID targeting is required.
10. Generic approval phrases remain insufficient.
11. It is safe to commit this live-readiness gate.

## Workflow Note

AiFinder terminal workflow should continue in no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must save output with `tee`, copy raw terminal output with `pbcopy`, and preserve original command status.

## Phase 22R Conclusion

Phase 22R establishes that the project is ready to plan a future live candidate target selection workflow.

It does not authorize live database reads.

It does not authorize candidate decision execution.

It does not authorize public publishing.

It does not authorize `approve_for_draft`.

It does not authorize cleanup mutation.

The Discovery Engine remains fail-closed before any future mutation-capable candidate decision work.
