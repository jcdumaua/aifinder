# Phase 22AM-F — Post-needs_more_evidence Candidate Queue State Review Gate

## Phase purpose

Phase 22AM-F is a documentation-only post-decision queue-state review gate.

It follows Phase 22AM-D, where exactly one internally resolved staged candidate received a `needs_more_evidence` decision, and Phase 22AM-E, where that execution result was documented, Gemini-approved, committed, and pushed.

Phase 22AM-F does not query Supabase.

Phase 22AM-F does not call an API route.

Phase 22AM-F does not list candidates.

Phase 22AM-F does not select, print, or expose a candidate UUID.

Phase 22AM-F does not select or print a candidate target.

Phase 22AM-F does not execute a candidate decision.

Phase 22AM-F does not execute `approve_for_draft`.

Phase 22AM-F does not publish to public `tools`.

Phase 22AM-F does not write to `discovered_tools`.

Phase 22AM-F does not perform cleanup mutation.

Phase 22AM-F decides the safest next queue-state strategy after the first non-publishing candidate decision mutation.

## Baseline

Phase 22AM-F starts after the pushed Phase 22AM-E result documentation commit:

```text
0eb1918 Document needs_more_evidence decision result
```

Expected repo state before this gate:

```text
## main...origin/main
```

## Prior Phase 22AM-D execution result

Phase 22AM-D executed exactly one candidate decision mutation:

```text
candidate_decision_mutation_executed=true
candidate_decision_mutation_count=1
candidate_decision_action=needs_more_evidence
```

The candidate UUID was resolved internally only:

```text
candidate_uuid_resolved_internally=true
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
```

The mutation was non-publishing:

```text
approve_for_draft_executed=false
approved_for_draft=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
```

The queue-state result changed from decision-ready to no longer decision-ready:

```text
active_staged_candidate_count=1
decision_ready_candidate_count=1
candidate_no_longer_decision_ready=true
post_decision_ready_candidate_count=0
```

The repo remained clean and `npm run check` passed after the execution.

## Current decision posture

The previously decision-ready candidate now has a `needs_more_evidence` decision.

It is no longer decision-ready under the prior Phase 22AM-D criteria.

Candidate approval remains blocked.

`approve_for_draft` remains blocked.

Public publishing remains blocked.

Cleanup remains blocked.

Duplicate marking, rejection, archive, reset, reopen, and evidence acquisition all remain blocked unless separately reviewed and approved.

No candidate identifier, candidate target, candidate name, candidate URL, source URL, source UUID, run UUID, preview UUID, audit UUID, raw evidence, or raw HTML should be printed in any next phase.

## Phase 22AM-F review questions

Phase 22AM-F answers these strategic questions without performing any live reads or writes:

1. Should the next step verify the post-decision queue state with a read-only aggregate check?
2. Should the candidate remain in `needs_more_evidence` until a future evidence-acquisition design exists?
3. Should new evidence acquisition be designed before any approval/rejection path?
4. Should cleanup remain blocked until a separate cleanup eligibility design exists?
5. Should reset/reopen remain blocked until a separate reset/reopen contract exists?
6. Does Phase 22AM-D complete the candidate decision pipeline smoke objective?
7. What is the safest next phase after this review gate?

## Recommended decision

The safest next phase is a read-only post-decision queue state verification.

Recommended next phase:

```text
Phase 22AM-G — Read-Only Post-needs_more_evidence Queue State Verification
```

This is recommended before any new mutation because Phase 22AM-D intentionally changed candidate decision state.

Phase 22AM-G should verify only non-sensitive aggregate and boolean state, without exposing identifiers.

## Future exact approval phrase for Phase 22AM-G

Phase 22AM-G must not run unless James provides the exact approval phrase:

```text
Approve Phase 22AM-G read-only post-needs_more_evidence queue state verification
```

Any typo, partial approval, alternate phase name, alternate action, or extra action must fail closed.

This phrase authorizes only read-only aggregate/boolean verification.

It does not authorize:

- candidate UUID printing,
- candidate target printing,
- candidate name/URL/evidence printing,
- source/run/preview/audit UUID printing,
- raw evidence printing,
- raw HTML printing,
- `approve_for_draft`,
- candidate approval,
- rejection,
- duplicate marking,
- archive,
- reset/reopen,
- cleanup mutation,
- source/run/crawler/extraction execution,
- fixture creation,
- candidate creation,
- public publishing,
- `discovered_tools` publishing,
- source/API/UI/schema/typegen/package changes,
- commit,
- push.

## Future Phase 22AM-G allowed scope

Allowed in future Phase 22AM-G only after exact approval:

- Verify repo state.
- Verify latest pushed Phase 22AM-F commit.
- Safely preload required environment variables without printing values.
- Initialize service-role read-only client access.
- Perform read-only aggregate/boolean verification.
- Verify the post-decision queue no longer contains decision-ready candidates matching the previous Phase 22AM-D criteria.
- Verify exactly one candidate state exists in the expected post-`needs_more_evidence` aggregate bucket, if expressible without exposing identifiers.
- Verify public `tools` count is queryable without writing.
- Verify `discovered_tools` count is queryable without writing.
- Verify no candidate UUID was printed.
- Verify no candidate target was printed.
- Verify no restricted identifier was printed.
- Verify repo remained clean.
- Run `npm run check`.
- Produce a result log for a future docs-only result phase.

## Future Phase 22AM-G forbidden scope

Forbidden in future Phase 22AM-G:

- No candidate UUID printing.
- No candidate target printing.
- No candidate name printing.
- No candidate website URL printing.
- No source URL printing.
- No source/run/preview/audit UUID printing.
- No raw evidence printing.
- No raw HTML printing.
- No environment variable value printing.
- No candidate decision execution.
- No `approve_for_draft`.
- No candidate approval.
- No rejection.
- No duplicate decision.
- No archive decision.
- No reset/reopen mutation.
- No public `tools` insert/update/delete.
- No `discovered_tools` insert/update/delete.
- No cleanup mutation.
- No live-staging execution.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No raw insert fallback.
- No package changes.
- No source/API/UI/Supabase/schema/migration/typegen changes.
- No implementation changes.
- No commit.
- No push.

## Future Phase 22AM-G proposed read-only markers

A successful future verification should print aggregate/boolean markers similar to:

```text
POST_NEEDS_MORE_EVIDENCE_QUEUE_STATE_READ_ONLY_PASS
phase=22AM-G
read_only_verification=true
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
decision_ready_candidate_count=0
needs_more_evidence_candidate_count=1
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
repo_remained_clean=true
```

A blocked future verification should print:

```text
POST_NEEDS_MORE_EVIDENCE_QUEUE_STATE_READ_ONLY_STOP
phase=22AM-G
stop_condition=<non_sensitive_reason>
read_only_verification=false
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
```

## Candidate evidence posture

The current candidate should remain in `needs_more_evidence` until a separate evidence-acquisition plan exists.

A future evidence-acquisition design may consider:

- whether evidence should be acquired from existing stored evidence only,
- whether fresh source acquisition is needed,
- whether any acquisition must stay read-only,
- whether raw evidence can be summarized without printing raw HTML,
- whether candidate identity can remain hidden,
- whether the candidate should be reopened for decision after evidence is added.

No evidence acquisition is authorized by Phase 22AM-F.

## Reset/reopen posture

Resetting or reopening the candidate should remain blocked.

A future reset/reopen design would require:

- a new phase,
- Gemini review,
- a committed approval gate,
- an exact James approval phrase,
- strict preflight checks,
- no identifier printing,
- a clear reason for reopening,
- a no-public-publishing guarantee.

No reset or reopen path is authorized by Phase 22AM-F.

## Cleanup posture

Cleanup remains blocked.

A future cleanup design would require:

- a new phase,
- Gemini review,
- a committed approval gate,
- an exact James approval phrase,
- proof that cleanup is safe,
- proof that cleanup does not erase required audit evidence,
- proof that cleanup does not create ambiguity for candidate decision pipeline verification.

No cleanup is authorized by Phase 22AM-F.

## Candidate decision pipeline smoke objective

Phase 22AM-D successfully exercised the candidate decision path with:

```text
needs_more_evidence
```

This validated the non-publishing candidate decision RPC path without content-blind approval and without public writes.

The candidate decision pipeline smoke objective may be considered validated for the `needs_more_evidence` action only.

It does not validate:

- approval,
- `approve_for_draft`,
- rejection,
- duplicate marking,
- archive,
- cleanup,
- public publishing,
- evidence acquisition,
- reset/reopen.

Those remain future separately gated objectives.

## Recommended phase sequence

Recommended sequence from here:

1. Phase 22AM-F — Post-needs_more_evidence Candidate Queue State Review Gate.
2. Phase 22AM-G — Read-Only Post-needs_more_evidence Queue State Verification.
3. Phase 22AM-H — Read-Only Post-needs_more_evidence Queue State Verification Result Documentation.
4. Phase 22AM-I — Candidate Evidence Acquisition / Reopen Strategy Design Gate, only if needed.

No candidate approval, public publishing, cleanup, reset, reopen, or evidence acquisition should happen before those actions are separately gated.

## Candidate approval remains blocked

Future candidate approval must not run unless all of the following occur:

1. A new approval gate is created, Gemini-approved, committed, and pushed.
2. James provides an exact future approval phrase for that specific action.
3. The candidate identity and evidence posture are safe enough for content-based judgment.
4. The execution script verifies all stop conditions immediately before mutation.
5. Identifier restrictions remain explicit.
6. `approve_for_draft` and public publishing remain separately gated unless explicitly authorized.

## Phase 22AM-F boundary

Allowed in Phase 22AM-F:

- Verify repo state.
- Verify latest pushed Phase 22AM-E commit.
- Verify prior docs recorded the Phase 22AM-D pass markers.
- Document the post-`needs_more_evidence` queue-state review.
- Define the safest next read-only verification phase.
- Define the future exact approval phrase for Phase 22AM-G.
- Define future Phase 22AM-G allowed/forbidden scope.
- Define aggregate-only future success/stop markers.
- Document evidence, reset/reopen, cleanup, and approval postures.
- Prepare a Gemini review package.

Forbidden in Phase 22AM-F:

- No live DB read.
- No Supabase query.
- No API route call.
- No candidate listing execution.
- No candidate UUID selection or printing.
- No candidate target selection.
- No discovery run/source/preview/audit target selection.
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

## Gemini review questions

Gemini should review:

1. Whether Phase 22AM-F correctly remains documentation-only.
2. Whether Phase 22AM-F accurately carries forward the Phase 22AM-D/22AM-E result markers.
3. Whether the recommended Phase 22AM-G read-only post-decision queue state verification is the safest next step.
4. Whether the Phase 22AM-G exact approval phrase is sufficiently narrow.
5. Whether the Phase 22AM-G allowed/forbidden scope prevents identifier exposure and mutation.
6. Whether candidate evidence acquisition should remain blocked until a separate design gate.
7. Whether reset/reopen should remain blocked until a separate design gate.
8. Whether cleanup should remain blocked until a separate design gate.
9. Whether candidate approval and `approve_for_draft` remain properly blocked.
10. Whether Phase 22AM-F may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AM-F for docs-only commit.

Gemini review summary:

- Phase 22AM-F remains documentation-only.
- Prior Phase 22AM-D and Phase 22AM-E execution markers are accurately recorded.
- Phase 22AM-G read-only post-decision queue-state verification is the safest next step.
- The Phase 22AM-G exact approval phrase is appropriately narrow.
- The proposed Phase 22AM-G aggregate/boolean markers preserve the zero-leak policy for candidate identifiers.
- Evidence acquisition, reset/reopen, cleanup, candidate approval, rejection, `approve_for_draft`, and public publishing remain formally blocked until separately designed and approved.
- Phase 22AM-D fulfilled the immediate candidate decision RPC smoke objective for the non-publishing `needs_more_evidence` action only.
- Phase 22AM-F is safe to commit as documentation-only.

Gemini specifically confirmed that the correct next move is to mathematically verify the post-decision queue aggregate state before designing evidence acquisition, reset/reopen, cleanup, approval, or publishing paths.

Commit approval is limited to this documentation update. No live DB read, Supabase query, API route call, candidate listing execution, candidate UUID selection, candidate target selection, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, reset/reopen mutation, evidence acquisition, live-staging command, extraction run, fixture creation, status transition, source/API/UI/schema/typegen/package change, or implementation change may proceed from Phase 22AM-F.

## Next recommended phase after approval, commit, and push

Phase 22AM-G — Read-Only Post-needs_more_evidence Queue State Verification.

Candidate approval, `approve_for_draft`, public publishing, cleanup, reset/reopen, evidence acquisition, and all candidate decisions remain blocked.
