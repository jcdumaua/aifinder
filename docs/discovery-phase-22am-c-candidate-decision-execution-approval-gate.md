# Phase 22AM-C — Candidate Decision Execution Approval Gate

## Phase purpose

Phase 22AM-C is a documentation-only candidate decision execution approval gate.

It follows:

- Phase 22AL-Z — Candidate Decision Read-Only Staged Candidate Listing Approval Gate.
- Phase 22AM — Candidate Decision Read-Only Staged Candidate Listing Execution.
- Phase 22AM-B — Candidate Decision Read-Only Staged Candidate Listing Result Documentation.

Phase 22AM-C does not execute a candidate decision.

Phase 22AM-C does not query Supabase.

Phase 22AM-C does not call an API route.

Phase 22AM-C does not select, print, or expose a candidate UUID.

Phase 22AM-C does not select or print a candidate target.

Phase 22AM-C does not approve, reject, archive, duplicate, or publish a candidate.

Phase 22AM-C defines a future candidate decision execution contract for Gemini review.

## Baseline

Phase 22AM-C starts after the pushed Phase 22AM-B result documentation commit:

```text
d47f36a Document staged candidate listing result
```

Expected repo state before this gate:

```text
## main...origin/main
```

## Prior read-only listing result

Phase 22AM confirmed the following aggregate-only staged candidate state:

```text
CANDIDATE_DECISION_READ_ONLY_STAGED_CANDIDATE_LISTING_PASS
phase=22AM
read_only_listing=true
staged_candidate_exists=true
staged_candidate_count=1
candidate_status_staged=true
cleanup_status_active=true
candidate_decision_ready_candidate_count=1
review_state_unset=true
rejection_state_unset=true
approved_for_draft=false
candidate_decision_executed=false
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
```

Phase 22AM-B documented that:

- exactly one active staged decision-ready candidate exists,
- the candidate UUID was not printed,
- the candidate target was not printed,
- restricted identifiers were not printed,
- no mutation occurred,
- no candidate decision occurred,
- no `approve_for_draft` occurred,
- no public publishing occurred,
- no cleanup mutation occurred,
- repo remained clean,
- `npm run check` passed.

## Current decision posture

Candidate decision execution remains blocked.

The candidate identity remains hidden by default.

No candidate UUID, candidate name, source URL, candidate URL, raw evidence, raw HTML, source UUID, run UUID, preview UUID, or audit UUID has been exposed in the terminal output.

Because the candidate details remain hidden, Phase 22AM-C must not approve or reject the candidate based on content judgment.

The first candidate-decision mutation under consideration should be the safest non-publishing decision action:

```text
needs_more_evidence
```

This action is selected for the future execution contract because:

- it does not approve the candidate,
- it does not reject the candidate on hidden content,
- it does not publish to public `tools`,
- it does not write to `discovered_tools`,
- it does not perform cleanup,
- it preserves the strict separation between queue inspection and public publishing,
- it can validate the candidate decision path without approving a hidden candidate.

## Supported decision actions observed in validation code

The current candidate decision validation code supports these actions:

```text
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

Phase 22AM-C does not authorize all of them.

## Decision action chosen for the future execution contract

Only the following future decision action is under consideration:

```text
needs_more_evidence
```

The following actions remain forbidden unless separately reviewed and approved in a later phase:

```text
approve_for_draft
reject
duplicate
archive
```

`approve_for_draft` remains especially blocked because it is a separate higher-risk step toward public publishing.

`duplicate` remains blocked because it requires a duplicate candidate target and target identifiers remain hidden.

`reject` remains blocked because no candidate content or target has been exposed for content-based rejection.

`archive` remains blocked because cleanup and lifecycle mutation remain separately blocked.

## Future execution phase

The recommended future execution phase is:

```text
Phase 22AM-D — Candidate Decision needs_more_evidence Execution
```

Phase 22AM-D must not run until:

1. Phase 22AM-C is Gemini-approved.
2. Phase 22AM-C is committed.
3. Phase 22AM-C is pushed to `main`.
4. James provides the exact future approval phrase.
5. The execution script verifies all stop conditions immediately before mutation.

## Future exact approval phrase for Phase 22AM-D

Phase 22AM-D must not run unless James provides the exact approval phrase:

```text
Approve Phase 22AM-D needs_more_evidence candidate decision execution
```

Any typo, partial approval, alternate phase name, alternate action, or extra action must fail closed.

This approval phrase authorizes only a single `needs_more_evidence` candidate decision against the one internally resolved active staged decision-ready candidate.

It does not authorize:

- `approve_for_draft`,
- candidate approval,
- public publishing,
- `discovered_tools` publishing,
- duplicate marking,
- rejection,
- archiving,
- cleanup mutation,
- source/run/crawler/extraction execution,
- fixture creation,
- candidate creation,
- candidate UUID printing,
- candidate target printing,
- candidate name/URL/evidence printing,
- source/API/UI/schema/typegen/package changes,
- commit,
- push.

## Future Phase 22AM-D allowed scope

Allowed in future Phase 22AM-D only after exact approval:

- Verify repo state.
- Verify latest pushed Phase 22AM-C commit.
- Safely preload required environment variables without printing values.
- Perform a read-only preflight count of active staged decision-ready candidates.
- Internally resolve the single active staged candidate UUID without printing it.
- Verify the candidate remains:
  - `candidate_status = "staged"`,
  - `cleanup_status = "active"`,
  - `archived_at IS NULL`,
  - `eligible_for_cleanup_at IS NULL`,
  - review fields unset,
  - decision fields unset,
  - `rejection_reason_code IS NULL`,
  - not already approved for draft.
- Execute exactly one candidate decision mutation using action `needs_more_evidence`.
- Verify post-mutation state using non-sensitive booleans and aggregate markers only.
- Verify no public `tools` write occurred.
- Verify no `discovered_tools` write occurred.
- Verify no cleanup mutation occurred.
- Verify no restricted identifier was printed.
- Verify repo remained clean.
- Run `npm run check`.
- Produce a result log for a future docs-only result phase.

## Future Phase 22AM-D forbidden scope

Forbidden in future Phase 22AM-D:

- No candidate UUID printing.
- No candidate target printing.
- No candidate name printing.
- No candidate website URL printing.
- No source URL printing.
- No source/run/preview/audit UUID printing.
- No raw evidence printing.
- No raw HTML printing.
- No environment variable value printing.
- No `approve_for_draft`.
- No candidate approval.
- No rejection.
- No duplicate decision.
- No archive decision.
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

## Candidate identifier handling

Phase 22AM-D may internally resolve the single active staged candidate UUID only after:

- exact approval phrase is confirmed,
- repo state is clean and synchronized,
- latest commit is the approved pushed Phase 22AM-C commit,
- `.env.local` exists,
- required Supabase env vars are present after safe preload,
- active staged decision-ready candidate count is exactly `1`,
- no ambiguity exists.

The candidate UUID must never be printed.

The candidate UUID must not be written to docs.

The candidate UUID must not be copied to clipboard.

The candidate UUID must be used only in memory for the candidate decision mutation call.

The script may print only:

```text
candidate_uuid_resolved_internally=true
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
```

## Allowed decision request body

The future execution request body must be equivalent to:

```json
{
  "action": "needs_more_evidence",
  "reason": "needs_more_evidence_gate",
  "notes": "Phase 22AM-D controlled non-publishing candidate decision execution."
}
```

The request body must not include:

- `actor_label`,
- `actorLabel`,
- `admin_user_id`,
- `adminUserId`,
- `decided_by`,
- `decidedBy`,
- `duplicate_of_candidate_id`,
- `duplicateOfCandidateId`,
- `duplicate_of_tool_id`,
- `duplicateOfToolId`,
- `approve_for_draft`,
- any candidate target identifier.

The actor label must be controlled server-side or script-side, not client-supplied.

## Allowed execution path

Preferred future execution path:

```text
Internal helper/RPC path through applyDiscoveryCandidateDecision with service-role client
```

Allowed underlying mutation path:

```text
admin_apply_discovery_candidate_decision
```

The script may call this path only once.

The script must not call the admin API route.

The script must not call browser/UI paths.

The script must not issue raw SQL.

The script must not use raw insert/update fallback.

## Future Phase 22AM-D preflight stop conditions

Phase 22AM-D must stop with no mutation if:

- exact approval phrase is missing or altered,
- repo status is not `## main...origin/main`,
- working tree is not clean,
- latest commit is not the approved pushed Phase 22AM-C commit,
- `.env.local` is missing,
- required env vars are missing after safe preload,
- `server-only` import fails under `react-server` condition,
- service-role client cannot be initialized,
- candidate decision validation import fails,
- candidate decision admin import fails,
- candidate decision action list does not include `needs_more_evidence`,
- active staged candidate count is zero,
- active staged candidate count is greater than one,
- decision-ready candidate count is zero,
- decision-ready candidate count is greater than one,
- candidate status is not `staged`,
- cleanup status is not `active`,
- review fields are set,
- decision fields are already set,
- rejection fields are set,
- candidate is already approved for draft,
- public table count preflight is unavailable,
- discovered table count preflight is unavailable,
- any restricted identifier would be printed,
- any unexpected file changes appear before mutation.

## Future Phase 22AM-D post-mutation checks

After the single `needs_more_evidence` decision mutation, Phase 22AM-D must verify:

- decision mutation executed exactly once,
- decision action is `needs_more_evidence`,
- candidate status changed to the expected decided/non-reviewable state defined by current RPC behavior,
- candidate is not approved for draft,
- public `tools` count did not change,
- `discovered_tools` count did not change,
- cleanup state did not mutate,
- candidate UUID was not printed,
- candidate target was not printed,
- restricted identifiers were not printed,
- repo status remains `## main...origin/main`,
- working tree remains clean,
- no commit occurred,
- no push occurred,
- `npm run check` passed.

Post-mutation output must use non-sensitive aggregate and boolean markers only.

## Future Phase 22AM-D success markers

A successful future execution should print:

```text
CANDIDATE_DECISION_NEEDS_MORE_EVIDENCE_EXECUTION_PASS
phase=22AM-D
candidate_uuid_resolved_internally=true
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
candidate_decision_executed=true
candidate_decision_action=needs_more_evidence
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
repo_remained_clean=true
```

## Future Phase 22AM-D stop markers

A blocked future execution should print:

```text
CANDIDATE_DECISION_NEEDS_MORE_EVIDENCE_EXECUTION_STOP
phase=22AM-D
stop_condition=<non_sensitive_reason>
candidate_decision_executed=false
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
```

## Future result documentation

After Phase 22AM-D executes, a docs-only result documentation phase is required before any next step.

Recommended phase:

```text
Phase 22AM-E — Candidate Decision needs_more_evidence Execution Result Documentation
```

Phase 22AM-E should document:

- exact approval phrase used,
- preflight result,
- whether exactly one active staged decision-ready candidate was internally resolved,
- whether candidate UUID stayed hidden,
- whether restricted identifiers stayed hidden,
- mutation result markers,
- whether action was exactly `needs_more_evidence`,
- whether `approve_for_draft` remained false,
- whether public tables were unchanged,
- whether cleanup was unchanged,
- whether repo remained clean,
- whether `npm run check` passed,
- Gemini review result,
- recommended next gated phase.

## Phase 22AM-C boundary

Allowed in Phase 22AM-C:

- Verify repo state.
- Verify latest pushed Phase 22AM-B commit.
- Verify prior docs recorded the Phase 22AM pass markers.
- Verify validation code includes candidate decision actions.
- Document a future `needs_more_evidence` decision execution contract.
- Define future exact approval phrase.
- Define candidate identifier handling.
- Define allowed request body.
- Define allowed helper/RPC path.
- Define stop conditions.
- Define success/stop markers.
- Define result documentation requirements.
- Prepare a Gemini review package.

Forbidden in Phase 22AM-C:

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

1. Whether Phase 22AM-C correctly remains documentation-only.
2. Whether choosing only `needs_more_evidence` as the first candidate decision action is safer than approving, rejecting, duplicating, or archiving a hidden candidate.
3. Whether `approve_for_draft`, public publishing, duplicate, reject, archive, and cleanup remain separately blocked.
4. Whether the future Phase 22AM-D exact approval phrase is sufficiently narrow.
5. Whether internal candidate UUID resolution without printing is acceptable for the future execution phase.
6. Whether the allowed request body is safe and narrow.
7. Whether the allowed execution path through `applyDiscoveryCandidateDecision` / `admin_apply_discovery_candidate_decision` is appropriate.
8. Whether the stop conditions are sufficient before mutation.
9. Whether the post-mutation checks and result markers are adequate.
10. Whether Phase 22AM-C may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AM-C for docs-only commit.

Gemini review summary:

- Phase 22AM-C remains documentation-only.
- Choosing `needs_more_evidence` as the first candidate decision action is safer than approving, rejecting, duplicating, or archiving a hidden candidate.
- `approve_for_draft`, rejection, duplicate marking, archiving, public publishing, and cleanup remain separately blocked.
- The future Phase 22AM-D exact approval phrase is sufficiently narrow.
- In-memory candidate UUID resolution without printing is acceptable for the future execution phase because Phase 22AM confirmed exactly one active staged decision-ready candidate.
- The future execution payload is strictly bounded to `needs_more_evidence`.
- The execution path and payload are strictly bounded.
- Preflight stop conditions are sufficient before mutation.
- Post-mutation checks and result markers are adequate.
- Phase 22AM-C is safe to commit as documentation-only.

Gemini specifically confirmed that `needs_more_evidence` solves the hidden-candidate constraint by exercising the decision pipeline without making a content-based approval or rejection and without risking a public write.

Commit approval is limited to this documentation update. No live DB read, Supabase query, API route call, candidate listing execution, candidate UUID selection, candidate target selection, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, live-staging command, extraction run, fixture creation, status transition, source/API/UI/schema/typegen/package change, or implementation change may proceed from Phase 22AM-C.

## Next recommended phase after approval, commit, and push

Phase 22AM-D — Candidate Decision needs_more_evidence Execution.

Candidate decision execution remains blocked until James provides the exact Phase 22AM-D approval phrase.
