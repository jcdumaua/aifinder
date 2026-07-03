# Phase 22AL-Z — Candidate Decision Read-Only Staged Candidate Listing Approval Gate

## Phase purpose

Phase 22AL-Z is a documentation-only approval gate for a future read-only staged candidate listing execution.

It follows:

- Phase 22AL-W — Natural Live-Staging Repopulation Retry Execution.
- Phase 22AL-X — Natural Live-Staging Repopulation Retry Result Documentation.
- Phase 22AL-Y — Candidate Decision Post-Staging Readiness Gate.

Phase 22AL-Z does not execute the listing.

Phase 22AL-Z does not query Supabase.

Phase 22AL-Z does not call any API route.

Phase 22AL-Z does not select or print a candidate UUID.

Phase 22AL-Z does not select a candidate target.

Phase 22AL-Z does not execute any candidate decision.

Phase 22AL-Z defines the safe future read-only listing execution contract, approval phrase, allowed aggregate outputs, restricted identifier policy, stop conditions, and result documentation requirement.

## Baseline

Phase 22AL-Z starts after the pushed Phase 22AL-Y readiness gate commit:

```text
bf1829b Document candidate decision post-staging readiness gate
```

Expected repo state before this gate:

```text
## main...origin/main
```

## Prior staged candidate context

Phase 22AL-X recorded that Phase 22AL-W passed with the following non-sensitive markers:

```text
NATURAL_LIVE_STAGING_REPOPULATION_RETRY_PASS
eligible_context_count=1
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

Phase 22AL-Y confirmed that the staged candidate exists but is not decision-authorized.

Candidate decision execution remains blocked.

## Current safety posture

The system has one staged candidate from the governed natural live-staging path.

The next safe step is not candidate decision execution.

The next safe step is a read-only listing execution that confirms the staged candidate state without printing restricted identifiers by default.

The listing execution should answer only whether there is exactly one active, staged, decision-eligible candidate available for a later approval gate.

## Phase 22AL-Z boundary

Allowed in Phase 22AL-Z:

- Verify repo state.
- Verify latest pushed readiness gate commit.
- Verify Phase 22AL-X and Phase 22AL-Y docs exist.
- Verify prior docs recorded the staged candidate and decision block markers.
- Document a future read-only staged candidate listing execution contract.
- Define future exact approval phrase for read-only listing execution.
- Define allowed aggregate output markers.
- Define restricted identifier policy.
- Define future stop conditions.
- Define result documentation requirements.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-Z:

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

## Future read-only listing execution phase

The recommended next execution phase is:

```text
Phase 22AM — Candidate Decision Read-Only Staged Candidate Listing Execution
```

Phase 22AM must be read-only.

Phase 22AM must not mutate the database.

Phase 22AM must not execute a candidate decision.

Phase 22AM must not call `approve_for_draft`.

Phase 22AM must not publish to public `tools`.

Phase 22AM must not write to `discovered_tools`.

Phase 22AM must not perform cleanup mutation.

Phase 22AM must not print candidate UUID or restricted target identifiers by default.

## Future exact approval phrase for Phase 22AM

Phase 22AM must not run unless James provides the exact approval phrase:

```text
Approve Phase 22AM read-only staged candidate listing execution
```

Any typo, partial approval, or alternate phrasing must fail closed.

This approval phrase authorizes only the read-only listing execution.

It does not authorize candidate decision execution.

It does not authorize `approve_for_draft`.

It does not authorize public publishing.

It does not authorize cleanup mutation.

It does not authorize candidate UUID printing by default.

## Future Phase 22AM allowed read-only scope

The future Phase 22AM listing script may perform read-only Supabase queries using service-role credentials only after all preflight checks pass.

Allowed read-only table scope:

- `public.discovery_candidate_tools`

Optional read-only count-only verification scope:

- `public.tools`
- `public.discovered_tools`

The future listing script may confirm:

- staged candidate exists,
- staged candidate count is exactly `1`,
- candidate status is `staged`,
- cleanup status is `active`,
- review state remains undecided,
- rejection fields remain unset,
- candidate is not already approved for draft,
- no public `tools` write occurs,
- no `discovered_tools` public publishing write occurs,
- no cleanup mutation occurs,
- candidate decision execution remains blocked.

## Future Phase 22AM allowed query shape

The future read-only listing execution should prefer aggregate/count checks first.

Allowed aggregate-only outputs:

```text
staged_candidate_exists=true
staged_candidate_count=1
candidate_status_staged=true
cleanup_status_active=true
candidate_decision_ready_candidate_count=1
review_state_unset=true
rejection_state_unset=true
approved_for_draft=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
candidate_decision_executed=false
candidate_uuid_printed=false
candidate_target_printed=false
read_only_listing=true
```

The script may internally query the minimum fields needed to compute these booleans, but must not print restricted values.

## Restricted identifier and target policy

Restricted values must remain hidden by default.

The future Phase 22AM listing script must not print:

- candidate UUID,
- discovery run UUID,
- discovery source UUID,
- preview artifact UUID,
- audit correlation UUID,
- source URL,
- candidate website URL,
- candidate name,
- company/tool name,
- raw evidence,
- raw model output,
- raw HTML,
- environment variable values,
- service-role key values.

The script may print boolean markers confirming whether identifiers were hidden:

```text
candidate_uuid_printed=false
candidate_target_printed=false
restricted_identifier_printed=false
```

Any future need to print or expose a candidate UUID must be separately reviewed and approved in a later Gemini-reviewed phase.

## Candidate decision remains blocked after Phase 22AM

Even if Phase 22AM confirms exactly one staged candidate exists, candidate decision execution remains blocked.

The following future phase remains required before any decision execution:

```text
Phase 22AM-A — Candidate Decision Execution Approval Gate
```

That future approval gate must define:

- exact decision action under consideration,
- exact candidate decision approval phrase,
- exact allowed helper/API path,
- candidate identifier handling,
- whether candidate UUID remains internal-only,
- how to prevent `approve_for_draft`,
- how to prevent public publishing,
- how to prevent cleanup mutation,
- stop conditions before mutation,
- result documentation requirements.

## Future Phase 22AM stop conditions

The future Phase 22AM read-only listing execution must stop with no mutation if:

- repo is not clean and synchronized,
- latest commit is not the approved Phase 22AL-Z commit,
- `.env.local` is missing,
- required Supabase env vars are missing after safe preload,
- service-role client cannot be initialized,
- listing query fails,
- staged candidate count is zero,
- staged candidate count is greater than one,
- candidate status is not `staged`,
- cleanup status is not `active`,
- review state is not undecided,
- rejection state is set,
- candidate appears already approved for draft,
- public table count checks fail,
- discovered table count checks fail,
- any mutation path is invoked,
- any candidate decision path is invoked,
- any restricted identifier would be printed,
- any unexpected repo file changes appear.

## Future Phase 22AM post-checks

After the future Phase 22AM read-only listing execution, the script must verify:

- repo status remains `## main...origin/main`,
- working tree remains clean,
- no staged files exist,
- no commit was created,
- no push occurred,
- `candidate_decision_executed=false`,
- `approve_for_draft_executed=false`,
- `public_tools_write=false`,
- `discovered_tools_write=false`,
- `cleanup_mutation_executed=false`,
- `candidate_uuid_printed=false`,
- `candidate_target_printed=false`.

A project check may be run after listing if no repository files changed.

## Future Phase 22AM result markers

A successful future listing execution should print:

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

A failed or blocked future listing execution should print:

```text
CANDIDATE_DECISION_READ_ONLY_STAGED_CANDIDATE_LISTING_STOP
phase=22AM
read_only_listing=true
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

## Future Phase 22AM result documentation

After Phase 22AM executes, a docs-only result documentation phase is required before any next step.

Recommended phase:

```text
Phase 22AM-B — Candidate Decision Read-Only Staged Candidate Listing Result Documentation
```

Phase 22AM-B should document:

- exact approval phrase used,
- read-only boundary,
- pass/stop markers,
- staged candidate count,
- decision-ready count,
- whether restricted identifiers were printed,
- whether any mutation occurred,
- whether candidate decision remains blocked,
- whether `npm run check` passed,
- whether repo remained clean,
- Gemini review result,
- whether a future candidate decision execution approval gate may be drafted.

## Gemini review questions

Gemini should review:

1. Whether Phase 22AL-Z correctly remains documentation-only.
2. Whether Phase 22AL-Z correctly defines Phase 22AM as read-only listing execution only.
3. Whether the exact Phase 22AM approval phrase is sufficiently narrow.
4. Whether allowed output markers are non-sensitive and adequate.
5. Whether restricted identifiers and targets remain hidden by default.
6. Whether the allowed query scope is sufficiently narrow.
7. Whether the Phase 22AM stop conditions are sufficient.
8. Whether candidate decision execution remains blocked after Phase 22AM.
9. Whether `approve_for_draft`, public publishing, and cleanup remain separately blocked.
10. Whether Phase 22AL-Z may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AL-Z for docs-only commit.

Gemini review summary:

- Phase 22AL-Z remains documentation-only.
- Phase 22AM is defined as strictly read-only staged candidate listing execution.
- The Phase 22AM approval phrase is sufficiently narrow.
- Output markers are non-sensitive, boolean, and aggregate-only.
- Restricted identifiers, including UUIDs, URLs, and names, remain hidden by default.
- The allowed query scope is limited to `public.discovery_candidate_tools` plus optional count-only verification on public tables.
- Candidate decision execution remains blocked after Phase 22AM.
- `approve_for_draft`, public publishing, and cleanup remain separately blocked.
- Phase 22AL-Z is safe to commit as documentation-only.

Gemini also noted that the earlier fail-safe rerun stop caused by the untracked Phase 22AL-Z doc confirmed the environment guards are working as intended.

Commit approval is limited to this documentation update. No live DB read, Supabase query, API route call, candidate listing execution, candidate UUID selection, candidate target selection, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, live-staging command, extraction run, fixture creation, status transition, source/API/UI/schema/typegen/package change, or implementation change may proceed from Phase 22AL-Z.

## Next recommended phase after approval, commit, and push

Phase 22AM — Candidate Decision Read-Only Staged Candidate Listing Execution.

Candidate decision execution remains blocked.
