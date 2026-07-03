# Phase 22AB — Candidate Staging Availability / Next Candidate Source Planning Gate

## Phase purpose

Phase 22AB is a planning/docs-only gate after Phase 22Z returned zero staged candidates.

Phase 22Z result:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS
phase=22Z
commit=e5b001a
status_filter=staged
limit=5
count=0
NO_CANDIDATE_SELECTED_BY_LISTING
```

Because the listing returned `count=0`, no candidate UUID exists for a candidate decision target package.

## Boundary

Allowed in Phase 22AB:

- Verify repo state.
- Verify latest commit.
- Syntax-check the existing read-only listing script without execution.
- Inspect relevant files with static filesystem and grep commands.
- Run existing project checks.
- Document safe next-path options.
- Prepare a Gemini review package.

Forbidden in Phase 22AB:

- No live DB read.
- No DB mutation.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Current state

The Discovery Engine candidate-decision path cannot proceed because:

- The approved live read-only listing returned zero staged candidates.
- No candidate UUID was selected.
- A future candidate decision requires a specific candidate UUID.
- A future candidate decision also requires a separately reviewed target package and explicit James approval.

## Planning question

The next safe planning question is:

**Why are there currently no staged candidates available for the decision path, and what is the safest route to create or locate one without bypassing governance?**

## Safe next-path options

### Option A — Read-only staging availability status-count gate

Create a future approval gate for a live read-only status-count check against candidate staging.

Purpose:

- Determine whether `public.discovery_candidate_tools` has any rows at all.
- Count rows by candidate status without selecting a decision target.
- Confirm whether `staged` is truly empty or whether candidates exist under another status.

Safety boundary:

- Read-only only.
- No candidate UUID selected for decision.
- No mutation.
- No cleanup.
- No public publishing.
- No `approve_for_draft`.

Recommended if the immediate question is database availability.

### Option B — Controlled fixture/staging flow planning gate

Create a future planning gate for a controlled, explicitly approved staging fixture or staging pipeline path.

Purpose:

- Safely create or stage a known candidate only after a separate implementation/review/approval chain.
- Preserve insert-only or approved mutation boundaries.
- Avoid directly jumping from zero candidates to candidate decision execution.

Safety boundary:

- No fixture creation without a dedicated approval phrase.
- No candidate decision in the same phase as candidate creation.
- Any staged candidate must later be documented and separately targeted.

Recommended if the system needs a known candidate for a future candidate-decision smoke path.

### Option C — Candidate intake/extraction source path planning gate

Create a future planning gate to identify whether candidate intake/extraction should produce staged candidates.

Purpose:

- Review whether candidate extraction or staging routes are currently configured to populate `discovery_candidate_tools`.
- Identify whether source availability, extraction gating, or staging boundaries explain the empty queue.
- Avoid manual fixture creation if the intended production-safe path is extraction or admin staging.

Safety boundary:

- Inspection/planning first.
- No crawler/extraction execution unless separately approved.
- No candidate staging mutation unless separately approved.
- No candidate decision.

Recommended if the goal is to validate the natural candidate pipeline rather than create a controlled fixture.

## Recommendation

Recommended next phase:

**Phase 22AC — Candidate Staging Availability Read-Only Status Count Approval Gate**

Purpose:

- Define the exact future live read-only status-count command.
- Require a fresh explicit James approval phrase before execution.
- Keep the next step diagnostic only.
- Avoid candidate decision execution while no candidate UUID exists.

Recommended future approval phrase:

```text
Approve Phase 22AD read-only candidate staging availability status count
```

Recommended future execution phase after approval gate:

**Phase 22AD — Candidate Staging Availability Read-Only Status Count Live Execution**

The future execution should only report aggregate counts by candidate status. It should not print a target candidate UUID for decision, and it should not select a candidate for approval or rejection.

## Explicit non-goals

Phase 22AB does not approve:

- Any live DB read.
- Any candidate staging insert.
- Any fixture creation.
- Any candidate decision.
- Any public publishing.
- Any cleanup mutation.
- Any source/API/UI/schema/migration/typegen change.

## Review conclusion

Gemini approved Phase 22AB for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no source code, executable scripts, or database configurations are modified.
- No live DB reads, DB mutations, or candidate decision executions are authorized.
- No candidate is selected or recorded by this phase.
- The next-path options are clearly designed: read-only status count diagnostics, controlled fixture/staging planning, or candidate intake/extraction source planning.
- Option A, the read-only status-count gate, is the safest recommended diagnostic next step.
- Fuzzy or automatic targeting remains prohibited.
- Public publishing, `approve_for_draft`, and cleanup mutation remain locked.
- Future diagnostic reads still require explicit approval phrases.

Commit approval is limited to this documentation update. No live DB read or candidate decision may proceed from Phase 22AB.

## Next recommended phase after approval, commit, and push

Phase 22AC — Candidate Staging Availability Read-Only Status Count Approval Gate.

Phase 22AC should define a future read-only aggregate status-count check and exact approval phrase, but should not run the live DB read itself.
