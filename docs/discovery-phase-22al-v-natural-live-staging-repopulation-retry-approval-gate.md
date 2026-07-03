# Phase 22AL-V — Natural Live-Staging Repopulation Retry Approval Gate

## Phase purpose

Phase 22AL-V is a documentation-only retry approval gate for the natural live-staging repopulation retry.

It follows the Phase 22AL failed-safe execution attempt and the recovery sequence that resolved terminal TypeScript runtime readiness:

- Phase 22AL-R documented the missing terminal TypeScript runner gap.
- Phase 22AL-S documented and approved the `tsx` tooling addition gate.
- Phase 22AL-T added `tsx` as local TypeScript runner tooling.
- Phase 22AL-U failed safely on the missing `server-only` marker package.
- Phase 22AL-U-R documented that failure as `FAILED SAFE` and approved the recovery path.
- Phase 22AL-U-S added `server-only` as a normal dependency.
- Phase 22AL-U-U corrected the helper import smoke harness and verified import readiness.

Phase 22AL-V does not perform live staging.

Phase 22AL-V does not read from Supabase, does not call API routes, does not run extraction or crawler logic, does not select a candidate target, and does not mutate the database.

It defines the final approval boundary for a future Phase 22AL-W retry.

## Current baseline

Phase 22AL-V starts from the synchronized Phase 22AL-U-S commit:

- `b415959 Add server-only dependency`

Expected repo state before this gate:

```text
## main...origin/main
```

## Prior eligibility context source

The Phase 22AL-V-R context locator recovery check found that there is no separate Phase 22AJ result document filename in `docs/`.

The authoritative recorded Phase 22AJ evidence is inside:

```text
docs/discovery-phase-22ak-natural-live-staging-repopulation-approval-gate.md
```

Phase 22AK explicitly records the valid Phase 22AJ v3 read-only discovery result.

For Phase 22AL-V, Phase 22AK is therefore the local documentation source for the recorded Phase 22AJ evidence.

## Prior eligibility context from Phase 22AJ as recorded in Phase 22AK

Phase 22AK records:

- Phase 22AJ successfully ran the approved bounded read-only target-context discovery.
- Phase 22AJ found exactly one eligible natural live-staging target context.
- Phase 22AJ produced no repo changes, no commit, and no push.
- Phase 22AJ v3 is the valid read-only discovery result.

Phase 22AK records this Phase 22AJ v3 result:

```text
phase=22AJ
eligible_context_exists=true
eligible_context_count=1
ambiguous_context=false
current_staged_candidate_count=0
has_reviewable_preview=true
source_run_matched=true
safe_source_evidence=true
source_url_snapshot_validated=true
source_candidate_url_distinct=true
staged_collision_count=0
would_stage_at_most_one_candidate=true
```

These facts are historical eligibility evidence only.

They do not authorize Phase 22AL-W by themselves.

Because live database state can change, Phase 22AL-W must re-run read-only eligibility discovery immediately before staging and must stop unless exactly one eligible context still exists.

## Prior approval context from Phase 22AK

Phase 22AK was the natural live-staging repopulation approval gate after Phase 22AJ.

It defined the original future approval phrase:

```text
Approve Phase 22AL natural live-staging repopulation
```

That approval led to the Phase 22AL attempt.

The Phase 22AL attempt failed safely before staging because the terminal runtime could not import the governed TypeScript helper path.

Phase 22AL-V therefore defines a new retry-specific approval phrase instead of reusing the old one.

## Phase 22AL-U-U corrected smoke result

Phase 22AL-U-U verified the terminal helper import path after adding `tsx` and `server-only`.

The corrected smoke used:

- local repo-installed `tsx`,
- `NODE_OPTIONS=--conditions=react-server`,
- a temporary `/tmp` `.mts` smoke file,
- network guards for `fetch`, `http`, and `https`,
- import-only execution,
- no helper function calls,
- corrected exit-code handling.

Phase 22AL-U-U imported:

- `lib/discovery/discovery-candidate-staging-admin.ts`
- `lib/discovery/discovery-candidate-preview-provider.ts`
- `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts`

It recorded:

- `network_events_count=0`
- `tsx_smoke_exit_code=0`
- `PHASE_22AL_U_U_IMPORT_SMOKE_PASS`
- `PHASE_22AL_U_U_SHELL_CONFIRMED_PASS_AFTER_ZERO_EXIT`

Post-smoke checks confirmed:

- repo remained clean,
- no commit occurred,
- no push occurred,
- `npm run check` passed.

Gemini approved the Phase 22AL-U-U corrected helper import smoke as successful.

## Phase 22AL-V boundary

Allowed in Phase 22AL-V:

- Verify repo state.
- Verify latest commit.
- Inspect local prior phase docs.
- Inspect package dependency placement for `tsx` and `server-only`.
- Document prior Phase 22AJ eligibility context as recorded by Phase 22AK.
- Document prior Phase 22AK approval context.
- Document Phase 22AL-U-U corrected smoke success.
- Define the future Phase 22AL-W retry approval phrase.
- Define the future Phase 22AL-W execution boundary.
- Define future stop conditions and verification requirements.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-V:

- No package installation.
- No `npm install`.
- No package.json edit.
- No package-lock.json edit.
- No node_modules modification.
- No helper import retry.
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
- No raw insert fallback.
- No candidate UUID selection or printing.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen/source/package implementation changes.
- No commit until after Gemini approval.
- No push.

## Future Phase 22AL-W approval phrase

The future retry execution phase must not run unless James provides this exact phrase:

```text
Approve Phase 22AL-W natural live-staging repopulation retry
```

Any other wording authorizes planning only.

This phrase authorizes only the bounded retry execution defined in this gate.

It does not authorize:

- candidate decision execution,
- `approve_for_draft`,
- public `tools` writes,
- `discovered_tools` public publishing writes,
- cleanup mutation,
- extraction,
- crawler execution,
- fixture creation,
- schema changes,
- migration changes,
- type generation,
- UI/API/source changes,
- package changes,
- more than one staged candidate,
- raw insert fallback.

## Future Phase 22AL-W allowed execution shape

Future Phase 22AL-W may use the local `tsx` runner and governed helper path.

Allowed in Phase 22AL-W only after the exact approval phrase:

1. Verify repo state and latest commit.
2. Verify local `tsx` runner is available.
3. Verify `server-only` resolves under the `react-server` condition.
4. Re-run read-only eligibility discovery immediately before staging.
5. Stop unless exactly one eligible context exists.
6. Stop if the eligible context is ambiguous.
7. Stop if there is any existing staged candidate collision.
8. Stop if there is no reviewable preview.
9. Stop if source/run relationship is invalid.
10. Stop if source evidence is unsafe or untrusted.
11. Stop if source URL snapshot validation fails.
12. Stop if source candidate URL is not distinct from the source URL when required.
13. Use only the governed staging helper path.
14. Stage at most one candidate.
15. Print only non-sensitive summary markers by default.

## Future Phase 22AL-W forbidden execution

Phase 22AL-W must not:

- use raw SQL insert fallback,
- directly insert outside the governed staging helper,
- stage more than one candidate,
- print candidate UUIDs by default,
- print restricted target identifiers by default,
- execute candidate decisions,
- set or call `approve_for_draft`,
- write to public `tools`,
- write public publishing state,
- run cleanup mutation,
- run extraction,
- run crawler execution,
- create fixtures,
- change source/API/UI code,
- change package files,
- change schema/migrations/typegen,
- commit,
- push.

## Future Phase 22AL-W required stop conditions

Phase 22AL-W must stop with no mutation if any of the following are true:

- repo is not clean and synchronized,
- latest commit is not the approved Phase 22AL-V commit once Phase 22AL-V is pushed,
- `tsx` runner is unavailable,
- `server-only` cannot resolve,
- helper import readiness cannot be confirmed,
- read-only eligibility discovery returns zero eligible contexts,
- read-only eligibility discovery returns more than one eligible context,
- eligible context is ambiguous,
- staged candidate count is not zero,
- staged collision count is not zero,
- reviewable preview is missing,
- source/run match fails,
- source evidence is unsafe,
- URL snapshot validation fails,
- source candidate URL distinctness check fails,
- governed staging helper is unavailable,
- any network/DB error occurs before the governed staging call,
- any unexpected changed repo file appears.

## Future Phase 22AL-W result documentation

If Phase 22AL-W runs, its result must be documented in a later docs-only phase before any candidate decision, public publishing, or cleanup phase.

Recommended next result documentation phase:

```text
Phase 22AL-X — Natural Live-Staging Repopulation Retry Result Documentation
```

That result documentation should record:

- whether Phase 22AL-W stopped safely or staged one candidate,
- whether exactly one eligible context existed at retry time,
- whether a staged row was created,
- non-sensitive outcome markers,
- boundaries preserved,
- any follow-up gate needed before candidate decision execution.

## Live staging remains blocked from this phase

Phase 22AL-V does not authorize live staging by itself.

Live staging remains blocked until:

1. Phase 22AL-V receives Gemini approval.
2. Phase 22AL-V is committed and pushed.
3. James provides the exact Phase 22AL-W approval phrase.
4. The future Phase 22AL-W execution script verifies all stop conditions immediately before staging.

## Gemini review questions

Gemini should review:

1. Whether Phase 22AL-V correctly uses Phase 22AK as the local documentation source for the recorded Phase 22AJ v3 evidence.
2. Whether Phase 22AL-V correctly treats Phase 22AJ eligibility as historical evidence only.
3. Whether Phase 22AL-W correctly requires fresh read-only eligibility discovery immediately before staging.
4. Whether the new retry-specific approval phrase is appropriate.
5. Whether the allowed Phase 22AL-W execution shape is sufficiently bounded.
6. Whether all critical stop conditions are present.
7. Whether raw insert fallback, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, extraction, crawler execution, fixture creation, schema/migration/typegen changes, source/API/UI changes, package changes, commit, and push remain blocked.
8. Whether Phase 22AL-V may be committed as docs-only.
9. Whether Phase 22AL-W may be prepared only after Phase 22AL-V is approved, committed, pushed, and the exact approval phrase is provided.

## Review conclusion

Gemini approved Phase 22AL-V for docs-only commit.

Gemini review summary:

- Phase 22AL-V is confirmed as documentation-only and does not run live staging.
- Using Phase 22AK as the local documentation source for the recorded Phase 22AJ v3 result is acceptable.
- Phase 22AJ eligibility is correctly treated as historical evidence only, not current authorization.
- Future Phase 22AL-W must re-run read-only eligibility discovery immediately before staging and stop unless exactly one eligible context still exists.
- Phase 22AL-U-U corrected helper import smoke success is sufficient runtime readiness evidence for preparing the retry gate.
- The retry-specific approval phrase is confirmed: `Approve Phase 22AL-W natural live-staging repopulation retry`.
- Phase 22AL-W allowed execution remains bounded to at most one staged candidate through the governed helper path.
- Fail-closed stop conditions are sufficiently defined.
- Safety locks remain active for raw insert fallback, candidate decision execution, `approve_for_draft`, public `tools` writes, `discovered_tools` public publishing writes, cleanup mutation, extraction, crawler execution, fixture creation, schema/migration/typegen changes, source/API/UI changes, package changes, commit, and push.
- Phase 22AL-W may be prepared only after Phase 22AL-V is approved, committed, pushed, and James provides the exact retry approval phrase.

Commit approval is limited to this documentation update. No live-staging command, Supabase query, target selection, extraction run, staging write, fixture creation, status transition, cleanup mutation, public publishing, `approve_for_draft`, or candidate decision may proceed from Phase 22AL-V.

## Next recommended phase after approval, commit, and push

Phase 22AL-W — Natural Live-Staging Repopulation Retry Execution.

Phase 22AL-W must not run until James gives the exact approval phrase after Phase 22AL-V has been reviewed, committed, and pushed.
