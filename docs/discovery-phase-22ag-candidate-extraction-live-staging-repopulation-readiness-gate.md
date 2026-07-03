# Phase 22AG — Candidate Extraction/Live-Staging Repopulation Readiness Gate

## Phase purpose

Phase 22AG is a documentation-only readiness gate to inspect whether the existing candidate extraction/live-staging route can safely repopulate staged candidate availability in a later phase.

Phase 22AG follows Phase 22AF, which recommended evaluating the natural extraction/live-staging path before falling back to an artificial controlled fixture.

Phase 22AG does not execute extraction, does not run a crawler, does not query Supabase, does not create a candidate, and does not mutate any database row.

## Current baseline

Phase 22AG starts from the pushed Phase 22AF commit:

- `1139802 Document candidate staging repopulation planning gate`

## Current operational state

From Phase 22AD / 22AE:

| Candidate status | Count |
| --- | ---: |
| `archived` | 1 |
| `needs_more_evidence` | 1 |
| `staged` | 0 |

Candidate decision execution remains blocked because no staged candidate exists.

The goal is not to bypass this block. The goal is to determine the safest governed path to create a future staged candidate through the intended extraction/live-staging flow.

## Boundary

Allowed in Phase 22AG:

- Verify repo state.
- Verify latest commit.
- Run static-only inspection of existing docs, routes, helpers, UI references, and tests.
- Run existing project checks.
- Document readiness findings.
- Define what must be true before natural live-staging repopulation can be attempted.
- Recommend the next gate.
- Prepare a Gemini review package.

Forbidden in Phase 22AG:

- No live DB read.
- No Supabase query.
- No API route call.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No candidate UUID selection.
- No candidate target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Static readiness findings

Static inspection shows that the project already has an extraction/live-staging architecture path, including:

- Candidate extraction invocation route:
  - `app/api/admin/discovery/candidate-extraction/invoke/route.ts`
- Candidate preview route:
  - `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- Candidate extraction invocation helper:
  - `lib/discovery/discovery-candidate-extraction-invocation.ts`
- Candidate preview live-staging resolver:
  - `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts`
- Candidate extraction staging pipeline helper:
  - `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`
- Candidate staging admin helper:
  - `lib/discovery/discovery-candidate-staging-admin.ts`
- Existing tests for route/helper/UI boundaries.

Static inspection also confirms key safety themes in the existing code/docs:

- Live staging must be server-created / server-gated.
- Client request bodies must not activate live staging by themselves.
- The live-staging path is intended to create `candidate_status = "staged"`.
- Existing tests include fail-closed cases.
- Prior docs define controlled live-staging smoke patterns and exact approval phrase requirements.

## Readiness conclusion

The natural extraction/live-staging route appears architecturally present, but Phase 22AG does not prove that a valid live target context currently exists.

A future live-staging repopulation attempt requires a specific, safe context, likely including:

- A discovery run.
- A discovery source.
- A trusted candidate preview artifact.
- An accepted/reviewable preview state.
- Source/run lineage validation.
- A staging gate that is server-created and fail-closed.
- A clear expected output of exactly one staged candidate.
- A cleanup or archival plan for any created staged candidate, reviewed separately if mutation is required.

Because Phase 22AG does not run live reads, it does not identify a run/source/preview target. Therefore, it must not proceed directly to live staging execution.

## Missing before live repopulation

Before any natural extraction/live-staging repopulation can run, the project needs a separate target-context gate.

That future gate should answer:

1. Is there an eligible discovery run?
2. Is there an eligible discovery source for that run?
3. Is there an accepted/reviewable preview artifact?
4. Does the preview include trusted source evidence?
5. Does the target context avoid known duplicates and existing candidate collisions?
6. Can the future execution be bounded to exactly one staged candidate?
7. Can the future execution prove no public tool insert, no candidate decision, no `approve_for_draft`, and no cleanup mutation?
8. What exact approval phrase will authorize only that bounded live-staging repopulation?

## Recommended next phase

Recommended next phase:

**Phase 22AH — Candidate Extraction/Live-Staging Target Context Readiness Gate**

Purpose:

- Define the exact read-only target-context discovery/selection process required before natural live-staging repopulation.
- Decide what information may be read and printed safely.
- Avoid printing candidate UUIDs or selecting a candidate decision target.
- Avoid running extraction or staging.
- Avoid mutation.

Phase 22AH should still be a planning/readiness gate. It should not execute a live DB read unless it explicitly becomes an approval gate with a separate exact phrase and Gemini review.

## Future candidate phases after Phase 22AH

A safe natural repopulation chain should look like this:

1. **Phase 22AH — Target Context Readiness Gate**
   - Plan how to find or confirm an eligible run/source/preview context.
   - No execution unless separately approved.

2. **Phase 22AI — Target Context Read-Only Discovery Approval Gate**
   - Define an exact read-only command and approval phrase.
   - No mutation.

3. **Phase 22AJ — Target Context Read-Only Discovery Live Execution**
   - Run a bounded read-only context discovery.
   - Print only safe identifiers and metadata explicitly approved for the staging operation.
   - No staging write.

4. **Phase 22AK — Natural Live-Staging Repopulation Approval Gate**
   - Define exact live staging command.
   - Require a known eligible context.
   - Require exact approval phrase.
   - No execution yet.

5. **Phase 22AL — Natural Live-Staging Repopulation Live Execution**
   - Stage at most one candidate.
   - No candidate decision.
   - No public publishing.
   - No cleanup unless separately approved.

6. **Phase 22AM — Natural Live-Staging Repopulation Result Documentation**
   - Document whether a staged candidate exists.
   - Only then can candidate-decision target packaging be considered.

## Fallback path

If Phase 22AH or later read-only target discovery shows there is no suitable natural target context, the fallback remains:

**Controlled staged candidate fixture path**

The fallback still requires:

- A separate fixture creation planning gate.
- A separate explicit mutation approval phrase.
- Fixture creation live execution.
- Fixture creation result documentation.
- A separate candidate decision target package after the staged fixture exists.

## Explicit non-goals

Phase 22AG does not approve:

- Running extraction.
- Running a crawler.
- Running a live DB read.
- Calling candidate preview API routes.
- Calling candidate extraction invocation routes.
- Creating or staging a candidate.
- Creating a fixture.
- Selecting a candidate UUID.
- Selecting a candidate target.
- Changing `needs_more_evidence` to `staged`.
- Changing `archived` to `staged`.
- Executing a candidate decision.
- Calling `approve_for_draft`.
- Publishing to public tools.
- Cleanup mutation.
- API/UI/Supabase/schema/migration/typegen changes.

## Review conclusion

Gemini approved Phase 22AG for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no extraction, crawler logic, live DB reads, Supabase queries, API calls, staging operations, or database mutations are authorized.
- Architectural clarity confirmed: the natural extraction/live-staging architecture exists, but a safe execution context has not yet been proven.
- No candidate UUID, candidate record, or candidate target is selected or recorded by this phase.
- Candidate decision execution remains blocked because `staged=0`.
- The proposed Phase 22AH through Phase 22AM sequence is confirmed as a disciplined readiness, discovery, execution, and result chain.
- Phase 22AH, Candidate Extraction/Live-Staging Target Context Readiness Gate, is confirmed as the correct next planning step.
- Safety locks remain active for mutations, cleanup, `approve_for_draft`, public publishing, and candidate decisions.
- Fallback controlled fixture creation remains separately gated and is not authorized by Phase 22AG.

Commit approval is limited to this documentation update. No target-context read, extraction run, staging write, fixture creation, status transition, or candidate decision may proceed from Phase 22AG.

## Next recommended phase after approval, commit, and push

Phase 22AH — Candidate Extraction/Live-Staging Target Context Readiness Gate.

Phase 22AH should define how to safely identify an eligible natural live-staging target context before any read-only discovery or live staging execution occurs.
