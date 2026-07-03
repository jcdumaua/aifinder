# Phase 22Y — Candidate Decision Read-Only Candidate Listing Gate Live Execution Approval Gate

## Phase purpose

Phase 22Y is a documentation-only approval gate for a future live read-only execution of:

`testing/discovery-candidate-decision-read-only-listing-gate.mjs`

This phase does **not** run the live listing command. It prepares the exact safety boundary, approval phrase, environment flags, command template, and reviewer expectations for the future execution phase.

## Current baseline

Phase 22Y starts from the pushed Phase 22X commit:

- `11b5693 Document candidate listing gate post-review`

The future live read-only listing command should not be run until Phase 22Y is reviewed, committed, and pushed.

## Boundary

Allowed in Phase 22Y:

- Verify clean synchronized repo state.
- Verify the latest Phase 22X commit.
- Syntax-check the existing read-only listing script.
- Run static safety greps.
- Run `npm run check`.
- Document the future live read-only execution boundary.
- Prepare a Gemini review package.

Forbidden in Phase 22Y:

- No live DB execution.
- No DB mutation.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Future execution phase

The future live read-only listing should be a separate phase:

- **Phase 22Z — Candidate Decision Read-Only Candidate Listing Gate Live Execution**

Phase 22Z should be execution-only and should run the listing script at most once after James explicitly approves the exact command.

## Future execution scope

The future execution may only:

- Read from `public.discovery_candidate_tools` through the existing read-only listing script.
- Filter candidates with `candidate_status = "staged"`.
- Use a bounded limit of `5`.
- Print safe candidate row identifiers and timestamps.
- Confirm that no candidate is selected for approval/rejection by the listing step.

The future execution must not:

- Select a candidate for approval.
- Reject a candidate.
- Execute a candidate decision route.
- Call `approve_for_draft`.
- Insert into `public.tools`.
- Publish anything publicly.
- Mutate candidate rows.
- Run cleanup.
- Run migrations.
- Regenerate Supabase types.
- Change source/API/UI behavior.

## Required future approval phrase

James must provide this exact phrase before Phase 22Z may run:

```text
Approve Phase 22Z read-only candidate listing gate status staged limit 5
```

## Required future environment values

The future Phase 22Z command must use these safety values:

```text
AIFINDER_RUN_CANDIDATE_DECISION_READ_ONLY_LISTING_GATE=1
AIFINDER_CANDIDATE_DECISION_LISTING_PHASE=22Z
AIFINDER_CANDIDATE_DECISION_LISTING_EXPECTED_COMMIT=<PHASE_22Y_PUSHED_COMMIT>
AIFINDER_CANDIDATE_DECISION_LISTING_STATUS=staged
AIFINDER_CANDIDATE_DECISION_LISTING_LIMIT=5
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_LISTING_APPROVAL_PHRASE=Approve Phase 22Z read-only candidate listing gate status staged limit 5
```

The expected commit placeholder must be replaced only after Phase 22Y has been committed and pushed. It should equal the pushed Phase 22Y commit SHA.

## Future command template

This is a template only. Do not run it during Phase 22Y.

```bash
cd /Users/jamescarlodumaua/aifinder

AIFINDER_RUN_CANDIDATE_DECISION_READ_ONLY_LISTING_GATE=1 \
AIFINDER_CANDIDATE_DECISION_LISTING_PHASE=22Z \
AIFINDER_CANDIDATE_DECISION_LISTING_EXPECTED_COMMIT=<PHASE_22Y_PUSHED_COMMIT> \
AIFINDER_CANDIDATE_DECISION_LISTING_STATUS=staged \
AIFINDER_CANDIDATE_DECISION_LISTING_LIMIT=5 \
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_LISTING_APPROVAL_PHRASE="Approve Phase 22Z read-only candidate listing gate status staged limit 5" \
node testing/discovery-candidate-decision-read-only-listing-gate.mjs
```

## Expected safe output

The future execution should produce one of the existing script markers:

- `LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS`
- `LIVE_CANDIDATE_LISTING_READ_ONLY_PASS`
- `LIVE_CANDIDATE_LISTING_READ_ONLY_FAIL_LOCKED`

For a successful read with rows, the script must also print:

- `NO_CANDIDATE_SELECTED_BY_LISTING`

This marker is required because the listing phase is not a decision phase.

## Review conclusion

Gemini approved Phase 22Y for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: Phase 22Y creates the governance framework for a future live execution phase without source changes or live operations.
- No live DB reads or mutations are authorized in Phase 22Y.
- No candidate decision execution is authorized.
- No candidate UUID is recorded by this phase.
- Future execution remains isolated behind explicit opt-in environment variables, strict commit verification, and safety flags set to `false`.
- The required future approval phrase is exact and phase-specific: `Approve Phase 22Z read-only candidate listing gate status staged limit 5`.
- Fail-closed markers and lock enforcement remain defined.

Commit approval is limited to this documentation update. The future live read-only listing remains forbidden until James separately approves Phase 22Z with the exact approval phrase.

## Next recommended phase after approval, commit, and push

Phase 22Z — Candidate Decision Read-Only Candidate Listing Gate Live Execution.

Phase 22Z should run the approved read-only listing command once, capture all output with `tee`, copy raw terminal output to clipboard, preserve the original exit code, and document whether the script succeeded or failed.
