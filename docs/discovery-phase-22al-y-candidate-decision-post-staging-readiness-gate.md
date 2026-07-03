# Phase 22AL-Y — Candidate Decision Post-Staging Readiness Gate

## Phase purpose

Phase 22AL-Y is a documentation-only candidate decision post-staging readiness gate.

It follows the successful Phase 22AL-W natural live-staging repopulation retry and the Phase 22AL-X result documentation.

Phase 22AL-W successfully restored candidate staging availability through the natural discovery path by staging exactly one candidate into `public.discovery_candidate_tools` through the governed helper path.

Phase 22AL-Y does not list the staged candidate.

Phase 22AL-Y does not select a candidate UUID.

Phase 22AL-Y does not execute a candidate decision.

Phase 22AL-Y defines the safety boundary, required future phases, approval phrases, stop conditions, and result documentation requirements for any later candidate decision sequence.

## Baseline

Phase 22AL-Y starts after the pushed Phase 22AL-X result commit:

```text
7dd2b9b Document natural live-staging retry result
```

Expected repo state before this gate:

```text
## main...origin/main
```

## Prior result summary

Phase 22AL-X documented that Phase 22AL-W passed with these non-sensitive result markers:

```text
NATURAL_LIVE_STAGING_REPOPULATION_RETRY_PASS
phase=22AL-W
commit=355a4ec
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
no_candidate_target_printed=true
```

This confirms:

- exactly one candidate was staged,
- the staged candidate has `candidate_status = "staged"`,
- candidate UUID and target identifiers were not printed by default,
- no candidate decision was executed,
- no `approve_for_draft` action was executed,
- no public publishing occurred,
- no cleanup mutation occurred,
- repo files remained unchanged during the live-staging retry.

## Current safety posture

A staged candidate now exists in `public.discovery_candidate_tools`.

That staged candidate is not automatically approved for decision execution.

The existence of a staged candidate does not authorize:

- candidate decision execution,
- approval for draft,
- public `tools` writes,
- `discovered_tools` public publishing writes,
- cleanup mutation,
- candidate status transition,
- candidate UUID printing,
- candidate target selection,
- API route execution,
- schema or migration changes,
- type generation,
- source/API/UI changes.

Candidate decision execution remains blocked until a later explicit approval phase.

## Phase 22AL-Y boundary

Allowed in Phase 22AL-Y:

- Verify repo state.
- Verify latest pushed result commit.
- Verify prior Phase 22AL-V and Phase 22AL-X docs exist.
- Verify Phase 22AL-X recorded the non-sensitive Phase 22AL-W pass markers.
- Document the post-staging decision readiness boundary.
- Define the next read-only listing gate.
- Define future candidate decision approval requirements.
- Define future stop conditions.
- Define future result documentation requirements.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-Y:

- No live DB read.
- No Supabase query.
- No API route call.
- No candidate listing execution.
- No candidate UUID selection or printing.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No live-staging execution.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No raw insert fallback.
- No package changes.
- No source/API/UI/Supabase/schema/migration/typegen changes.
- No implementation changes.
- No commit until after Gemini approval.
- No push.

## Candidate identifier handling policy

Candidate identifiers remain restricted by default.

Future phases must not print candidate UUIDs unless a Gemini-reviewed phase explicitly approves the exact identifier subset needed and explains why it is necessary.

Default output should use only non-sensitive markers such as:

```text
staged_candidate_exists=true
staged_candidate_count=1
candidate_status_staged=true
candidate_decision_ready_candidate_count=1
candidate_uuid_printed=false
candidate_target_printed=false
```

Any future terminal output should avoid printing:

- candidate UUID,
- discovery run UUID,
- discovery source UUID,
- preview artifact UUID,
- audit correlation UUID,
- source URL,
- candidate website URL,
- candidate name,
- raw evidence,
- raw model output,
- raw HTML,
- service-role or environment values.

## Recommended next phase

The next recommended phase is:

```text
Phase 22AL-Z — Candidate Decision Read-Only Staged Candidate Listing Approval Gate
```

Phase 22AL-Z should be documentation-only.

It should define the future read-only listing command before that command runs.

It should answer:

1. How to confirm that exactly one staged, active candidate exists.
2. How to confirm the candidate is decision-eligible without printing restricted identifiers by default.
3. Which aggregate fields may be printed.
4. Which identifiers must remain hidden.
5. Whether any redacted/stable audit marker is allowed.
6. Whether Gemini approval is required before candidate decision execution.
7. What exact approval phrase would be required for the future read-only listing execution.
8. What exact approval phrase would be required for any later decision execution phase.
9. What stop conditions block candidate decision execution.

## Future read-only listing execution phase

After Phase 22AL-Z is reviewed, committed, and pushed, a separate read-only execution phase may be prepared.

Recommended future execution phase:

```text
Phase 22AM — Candidate Decision Read-Only Staged Candidate Listing Execution
```

Phase 22AM must be read-only.

Phase 22AM may query only the minimum fields necessary to confirm:

- staged candidate exists,
- staged candidate count is exactly `1`,
- candidate status is `staged`,
- cleanup status is `active`,
- reviewed fields remain unset,
- rejection fields remain unset,
- candidate is not already approved or rejected,
- no public write has occurred,
- no cleanup mutation has occurred,
- candidate decision execution remains blocked.

Phase 22AM must not:

- mutate the database,
- execute candidate decision route,
- call `approve_for_draft`,
- publish publicly,
- cleanup or archive,
- select a candidate for mutation by default,
- print candidate UUID by default,
- print restricted target identifiers by default,
- change source/API/UI/schema/typegen/package files,
- commit,
- push.

## Future candidate decision approval gate

Candidate decision execution must remain blocked until after a separate Gemini-reviewed approval gate.

Recommended future approval gate after read-only listing:

```text
Phase 22AM-A — Candidate Decision Execution Approval Gate
```

Phase 22AM-A should define:

- the exact candidate decision action being considered,
- whether the action is approve, reject, or needs-more-evidence,
- the exact future approval phrase,
- which API route or governed helper path may be used,
- which candidate identifier handling is allowed,
- whether candidate UUID may be printed or must be passed only internally,
- how to prevent `approve_for_draft` unless separately approved,
- how to prevent public publishing unless separately approved,
- how to prevent cleanup mutation unless separately approved,
- how to verify exactly one candidate decision was executed if approved,
- how to document the result afterward.

## Candidate decision execution remains blocked

Phase 22AL-Y does not authorize any candidate decision execution.

Future candidate decision execution must not run unless all of the following occur:

1. Phase 22AL-Y is Gemini-approved, committed, and pushed.
2. Phase 22AL-Z is Gemini-approved, committed, and pushed.
3. The future read-only listing execution phase confirms exactly one eligible staged candidate.
4. A separate candidate decision execution approval gate is Gemini-approved, committed, and pushed.
5. James provides the exact future candidate decision execution approval phrase.
6. The execution script verifies all stop conditions immediately before mutation.

## Future candidate decision stop conditions

Any future candidate decision execution must stop with no mutation if:

- repo is not clean and synchronized,
- latest commit is not the approved execution gate commit,
- required environment variables are missing,
- candidate listing returns zero staged candidates,
- candidate listing returns more than one staged candidate,
- candidate status is not `staged`,
- cleanup status is not `active`,
- candidate is already reviewed,
- candidate has rejection fields set,
- candidate has already been approved for draft,
- public `tools` write would occur without explicit approval,
- `discovered_tools` public publishing write would occur without explicit approval,
- cleanup mutation would occur without explicit approval,
- candidate UUID handling is not explicitly approved,
- candidate target is ambiguous,
- any API/helper path would execute extra mutations,
- any command would print restricted identifiers without approval,
- any unexpected repo file changes appear.

## Result documentation requirement

Every future candidate decision execution or read-only listing execution must be followed by a docs-only result documentation phase before moving forward.

Recommended examples:

```text
Phase 22AM-B — Candidate Decision Read-Only Listing Result Documentation
Phase 22AM-D — Candidate Decision Execution Result Documentation
```

Result documentation should record:

- exact approval phrase used,
- command boundary,
- pass/stop markers,
- whether any mutation occurred,
- whether candidate UUID was printed,
- whether candidate decision executed,
- whether `approve_for_draft` executed,
- whether public publishing executed,
- whether cleanup mutation executed,
- whether repo remained clean,
- whether further action remains blocked.

## Gemini review questions

Gemini should review:

1. Whether Phase 22AL-Y correctly treats the staged candidate as existing but not decision-authorized.
2. Whether candidate decision execution remains fully blocked.
3. Whether the recommended Phase 22AL-Z read-only listing approval gate is the right next step.
4. Whether the recommended Phase 22AM read-only listing execution should remain read-only and non-mutating.
5. Whether the recommended later candidate decision execution approval gate is sufficiently separate from listing.
6. Whether candidate UUID and target identifiers remain hidden by default.
7. Whether the stop conditions are sufficient before any candidate decision execution.
8. Whether `approve_for_draft`, public publishing, and cleanup mutation remain separately blocked.
9. Whether Phase 22AL-Y may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AL-Y for docs-only commit.

Gemini review summary:

- Candidate decision execution is strictly blocked.
- The output contract is confirmed, with candidate UUIDs and restricted target identifiers hidden by default.
- Phase 22AL-Z is confirmed as the next read-only staged candidate listing approval gate.
- Future read-only listing execution remains non-mutating.
- Candidate decision execution approval remains a later separate gate.
- Safety locks remain active for `approve_for_draft`, public publishing, and cleanup mutation.
- Future stop conditions are sufficient before any candidate decision execution.
- Phase 22AL-Y is safe to commit as documentation-only.

Commit approval is limited to this documentation update. No live DB read, Supabase query, API route call, candidate listing execution, candidate UUID selection, candidate target selection, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, live-staging command, extraction run, fixture creation, status transition, source/API/UI/schema/typegen/package change, or implementation change may proceed from Phase 22AL-Y.

## Next recommended phase after approval, commit, and push

Phase 22AL-Z — Candidate Decision Read-Only Staged Candidate Listing Approval Gate.

Candidate decision execution remains blocked.
