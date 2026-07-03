# Phase 22AK — Natural Live-Staging Repopulation Approval Gate

## Phase purpose

Phase 22AK is a documentation-only approval gate for a future natural live-staging repopulation execution.

Phase 22AK follows Phase 22AJ, which successfully ran the approved bounded read-only target-context discovery and found exactly one eligible natural live-staging target context.

Phase 22AK records the Phase 22AJ result and defines the exact future approval phrase, command boundary, expected one-candidate staging result, stop conditions, verification assertions, and post-execution documentation requirements for Phase 22AL.

Phase 22AK does not run live staging and does not create any candidate.

## Current baseline

Phase 22AK starts from the pushed Phase 22AI commit:

- `015358a Document target context read-only discovery approval gate`

Phase 22AJ produced no repo changes, no commit, and no push.

## Phase 22AJ read-only discovery result

Phase 22AJ v3 is the valid read-only discovery result.

Earlier attempts:

- v1 failed before execution because the static guard matched safe assertion keys such as `no_public_publish` and `no_approve_for_draft`.
- v2 failed before execution because the temporary `/tmp` ESM script could not resolve `@supabase/supabase-js`; it also exposed wrapper exit-code handling that was corrected in v3.
- v3 fixed package resolution and preserved the Node process exit code.

Phase 22AJ v3 result:

```text
TARGET_CONTEXT_READ_ONLY_DISCOVERY_PASS
phase=22AJ
commit=015358a
eligible_context_exists=true
eligible_context_count=1
ambiguous_context=false
reviewable_artifact_count=1
reviewable_artifacts_scanned=1
current_staged_candidate_count=0
rejected_context_count=0
rejection_reason_count=0
has_reviewable_preview=true
source_run_matched=true
safe_source_evidence=true
source_url_snapshot_validated=true
source_candidate_url_distinct=true
staged_collision_count=0
would_stage_at_most_one_candidate=true
stop_condition=none
no_candidate_uuid_printed=true
no_candidate_decision=true
no_db_mutation=true
no_public_publish=true
no_approve_for_draft=true
```

Phase 22AJ v3 also verified:

- Node process exit code: `0`
- Repo status after execution: `## main...origin/main`
- Latest commit unchanged: `015358a Document target context read-only discovery approval gate`
- No repo files changed.
- No commit.
- No push.

## Current operational state

From Phase 22AD / 22AE and Phase 22AJ:

| Item | Result |
| --- | --- |
| Current staged candidates | `0` |
| Reviewable artifacts scanned | `1` |
| Eligible natural context count | `1` |
| Ambiguous context | `false` |
| Staged collision count | `0` |
| Future staging bound | at most `1` candidate |

Candidate decision execution remains blocked until a staged candidate exists and a separate candidate decision target package is reviewed and approved.

## Boundary

Allowed in Phase 22AK:

- Verify repo state.
- Verify latest commit.
- Run static-only inspection of existing docs, routes, helpers, tests, and live-staging surfaces.
- Run existing project checks.
- Record the Phase 22AJ valid result.
- Define the future Phase 22AL live-staging approval phrase.
- Define the future Phase 22AL command shape.
- Define the future Phase 22AL mutation boundary.
- Define the future Phase 22AL output contract.
- Define fail-closed stop conditions and verification assertions.
- Prepare a Gemini review package.

Forbidden in Phase 22AK:

- No live DB read.
- No Supabase query.
- No API route call.
- No live-staging execution.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No candidate UUID selection.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Future Phase 22AL approval phrase

Phase 22AL must not run unless James provides this exact phrase:

```text
Approve Phase 22AL natural live-staging repopulation
```

Any other wording, including casual approval, authorizes planning only and must not run live staging.

This phrase authorizes only the bounded natural live-staging repopulation command defined by Phase 22AK after Gemini approval.

It does not authorize:

- candidate decision execution,
- cleanup or archival mutation,
- `approve_for_draft`,
- public publishing,
- fixture creation,
- schema changes,
- type generation,
- source/API/UI implementation changes,
- unbounded extraction/crawler execution.

## Future Phase 22AL command shape

Phase 22AL should run as a guarded terminal script generated for the execution phase, not as a permanent source-code change.

Recommended command shape:

```bash
cd /Users/jamescarlodumaua/aifinder
AIFINDER_RUN_PHASE_22AL_NATURAL_LIVE_STAGING_REPOPULATION=1 \
node /tmp/aifinder-phase-22al-natural-live-staging-repopulation.mjs
```

The `/tmp` script should be generated only during Phase 22AL after the exact approval phrase is received.

The Phase 22AL script must:

- require `AIFINDER_RUN_PHASE_22AL_NATURAL_LIVE_STAGING_REPOPULATION=1`;
- verify repo root and latest commit;
- print a clear live-staging boundary;
- internally re-run the Phase 22AJ read-only eligibility discovery;
- stop unless exactly one eligible context still exists;
- use the existing live-staging path for the accepted/reviewable preview;
- stage at most one candidate with `candidate_status = "staged"`;
- confirm `candidates_staged_count = 1`;
- confirm no public `tools` write;
- confirm no `discovered_tools` write;
- confirm no candidate decision execution;
- confirm no `approve_for_draft`;
- confirm no cleanup mutation;
- use `tee` to capture output;
- copy raw terminal output to clipboard with `pbcopy`;
- preserve the original exit code.

## Future Phase 22AL mutation boundary

Phase 22AL may authorize exactly one mutation category:

- Insert one row into `public.discovery_candidate_tools` through the existing governed staging path, producing `candidate_status = "staged"`.

Phase 22AL must not authorize:

- `public.tools` insert/update/delete.
- `public.discovered_tools` insert/update/delete.
- Candidate decision route execution.
- Candidate approval.
- `approve_for_draft`.
- Public publishing.
- Cleanup or archival mutation.
- Status transition for existing `archived` or `needs_more_evidence` rows.
- Fixture creation.
- Schema or migration changes.
- Type generation.
- Source/API/UI implementation changes.

## Future Phase 22AL target-context handling

Phase 22AL may use the single eligible context from Phase 22AJ internally.

Because Phase 22AI/22AJ intentionally did not print restricted fields, Phase 22AL should derive the context again inside the guarded script and should avoid printing restricted identifiers by default.

Allowed internal-only values:

- `discovery_run_id`
- `discovery_source_id`
- Preview artifact ID
- Audit correlation ID
- Source URL snapshot
- Candidate website URL
- Candidate name
- Evidence locator

Default output should not print these values unless Gemini explicitly approves a subset for result documentation.

Phase 22AL may print only:

- aggregate and boolean eligibility checks;
- whether exactly one candidate was staged;
- whether the staged candidate status is `staged`;
- whether public publishing was avoided;
- whether candidate decision execution was avoided;
- whether cleanup was avoided;
- if needed, a redacted/stable audit marker that is not a candidate UUID.

## Future Phase 22AL output contract

Required summary lines should include:

```text
NATURAL_LIVE_STAGING_REPOPULATION_PASS
phase=22AL
commit=<commit>
eligible_context_exists=true
eligible_context_count=1
ambiguous_context=false
reviewable_artifact_count=1
current_staged_candidate_count_before=0
staged_collision_count_before=0
candidates_staged_count=1
candidate_status_staged=true
current_staged_candidate_count_after=1
public_tools_write=false
discovered_tools_write=false
candidate_decision_executed=false
approve_for_draft_executed=false
cleanup_mutation_executed=false
no_candidate_uuid_printed=true
```

If the command fails closed, it should print:

```text
NATURAL_LIVE_STAGING_REPOPULATION_STOP
phase=22AL
stop_condition=<reason>
candidates_staged_count=0
candidate_decision_executed=false
public_tools_write=false
approve_for_draft_executed=false
cleanup_mutation_executed=false
no_candidate_uuid_printed=true
```

## Future Phase 22AL stop conditions

The Phase 22AL command must fail closed before staging if:

1. The exact opt-in environment variable is missing.
2. Repo root or latest commit does not match the expected baseline.
3. Required environment variables are missing.
4. The Phase 22AJ eligibility discovery no longer returns exactly one eligible context.
5. `eligible_context_count` is `0`.
6. `eligible_context_count` is greater than `1`.
7. The context is ambiguous.
8. The reviewable artifact count is not exactly `1`.
9. Source/run lineage is missing or mismatched.
10. Preview status is not `reviewable`.
11. Preview schema version is unsupported.
12. Source URL snapshot is missing or unsafe.
13. Source URL snapshot equals candidate website URL.
14. Source URL drift is detected.
15. Source evidence locator is missing or unsafe.
16. A staged candidate collision already exists before staging.
17. The command cannot prove the stage is bounded to at most one candidate.
18. Any attempted result would need to print forbidden fields.
19. Any helper path would execute extraction/crawler logic outside the accepted/reviewable preview staging flow.
20. Any helper path would call public publishing, candidate decision, `approve_for_draft`, cleanup, fixture creation, or schema/typegen logic.

## Future Phase 22AL verification assertions

Phase 22AL should assert:

- The command was opt-in gated.
- The exact James approval phrase was provided before script generation.
- The command re-ran read-only eligibility discovery.
- Exactly one eligible context existed immediately before staging.
- Staged collision count before staging was `0`.
- Exactly one candidate was staged.
- The staged candidate has `candidate_status = "staged"`.
- No candidate UUID was printed by default.
- No candidate decision target was selected.
- No candidate decision was executed.
- No `approve_for_draft` flow was called.
- No public tools write occurred.
- No discovered tools write occurred.
- No cleanup mutation occurred.
- No fixture was created.
- No API/UI/Supabase/schema/migration/typegen/source files were changed.
- Repo files remained unchanged.
- No commit was performed.
- No push was performed.

## Expected Phase 22AL result handling

If Phase 22AL stages exactly one candidate:

- Stop immediately after verification.
- Do not run candidate decision execution.
- Do not approve for draft.
- Do not publish.
- Do not cleanup or archive.
- Prepare Phase 22AM to document the live-staging result.

If Phase 22AL cannot stage exactly one candidate:

- Stop.
- Print the safe stop condition.
- Do not attempt fallback mutation.
- Prepare a result documentation or revised approval gate.

## Recommended next phase

Recommended next phase:

**Phase 22AL — Natural Live-Staging Repopulation Live Execution**

Only after:

1. Gemini approves Phase 22AK.
2. Phase 22AK is committed and pushed.
3. James provides the exact approval phrase:

```text
Approve Phase 22AL natural live-staging repopulation
```

## Explicit non-goals

Phase 22AK does not approve:

- Running live staging.
- Running a live DB read.
- Running a Supabase query.
- Calling API routes.
- Running extraction.
- Running a crawler.
- Creating or staging a candidate.
- Creating a fixture.
- Selecting or printing restricted target context fields.
- Selecting a candidate UUID.
- Selecting a candidate decision target.
- Changing `needs_more_evidence` to `staged`.
- Changing `archived` to `staged`.
- Executing a candidate decision.
- Calling `approve_for_draft`.
- Publishing to public tools.
- Cleanup mutation.
- API/UI/Supabase/schema/migration/typegen changes.

## Review conclusion

Gemini approved Phase 22AK for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no staging operations, database mutations, live DB reads, Supabase queries, API calls, extraction, crawler logic, fixture creation, candidate creation, status changes, or candidate decisions are authorized.
- The successful Phase 22AJ read-only discovery result is accurately incorporated, including `eligible_context_exists=true`, `eligible_context_count=1`, `ambiguous_context=false`, `current_staged_candidate_count=0`, `staged_collision_count=0`, and `would_stage_at_most_one_candidate=true`.
- The Phase 22AL execution plan is confirmed as fail-closed and defense-in-depth because it must internally re-run eligibility discovery before staging.
- Future Phase 22AL remains bounded to exactly one staged candidate through the governed natural live-staging path.
- The 20 Phase 22AL stop conditions are confirmed as rigorous enough for environment validation, context drift, source/run/preview safety, collision checks, unauthorized field printing, and forbidden helper paths.
- The output contract is confirmed as sound and continues to prohibit printing sensitive identifiers such as `discovery_run_id`, `discovery_source_id`, preview artifact ID, audit correlation ID, source URL snapshot, candidate website URL, candidate name, evidence locator, and candidate UUID by default.
- Safety locks remain active for candidate decision execution, cleanup or archival mutation, `approve_for_draft`, public publishing, fixture creation, schema changes, type generation, and source/API/UI implementation changes.
- The exact future approval phrase is confirmed: `Approve Phase 22AL natural live-staging repopulation`.

Commit approval is limited to this documentation update. No live-staging command, target selection, extraction run, staging write, fixture creation, status transition, cleanup mutation, public publishing, `approve_for_draft`, or candidate decision may proceed from Phase 22AK.

## Next recommended phase after approval, commit, and push

Phase 22AL — Natural Live-Staging Repopulation Live Execution.

Phase 22AL must not run until James gives the exact approval phrase after Phase 22AK has been reviewed, committed, and pushed.
