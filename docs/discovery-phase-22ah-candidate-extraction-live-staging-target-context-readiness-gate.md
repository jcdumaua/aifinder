# Phase 22AH — Candidate Extraction/Live-Staging Target Context Readiness Gate

## Phase purpose

Phase 22AH is a documentation-only readiness gate to define how AiFinder may safely identify an eligible natural live-staging target context in a later phase.

Phase 22AH follows Phase 22AG, which confirmed that the extraction/live-staging architecture exists but is not execution-ready until a safe run/source/preview context is identified.

Phase 22AH does not identify a live target, does not query Supabase, does not call an API route, does not run extraction, and does not mutate any database row.

## Current baseline

Phase 22AH starts from the pushed Phase 22AG commit:

- `9c0f9ef Document live staging repopulation readiness gate`

## Current operational state

From Phase 22AD / 22AE:

| Candidate status | Count |
| --- | ---: |
| `archived` | 1 |
| `needs_more_evidence` | 1 |
| `staged` | 0 |

Candidate decision execution remains blocked because no staged candidate exists.

## Boundary

Allowed in Phase 22AH:

- Verify repo state.
- Verify latest commit.
- Run static-only inspection of existing docs, routes, helpers, read models, and tests.
- Run existing project checks.
- Define the future target-context discovery process.
- Define safe field-output rules for a later read-only discovery phase.
- Define stop conditions and safety assertions.
- Recommend the next gate.
- Prepare a Gemini review package.

Forbidden in Phase 22AH:

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
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Target context definition

For the natural live-staging path, an eligible target context means:

1. Exactly one discovery run is selected for future staging.
2. Exactly one discovery source is selected for that run.
3. Exactly one trusted preview artifact is selected for that run/source pair.
4. The preview is accepted and reviewable.
5. The preview has safe source evidence.
6. The preview source URL snapshot is not the same as the candidate website URL.
7. The future staging write can be bounded to at most one candidate.
8. The future staging result can prove no public `tools` write, no `discovered_tools` write, no candidate decision, and no `approve_for_draft`.

Phase 22AH defines this context only. It does not discover or select such a context.

## Future read-only discovery requirements

A future read-only target-context discovery phase must be separately approved before it runs.

That phase should be designed to answer only these questions:

1. Does at least one eligible discovery run/source/preview context exist?
2. If more than one eligible context exists, can the result be narrowed deterministically without unsafe inference?
3. Is the selected preview accepted and reviewable?
4. Does the selected preview include trusted source evidence?
5. Does the selected preview avoid source/tool URL drift?
6. Does the selected context have no existing staged candidate collision for the same audit correlation or equivalent safety marker?
7. Can the future live-staging execution be bounded to exactly one staged candidate?
8. Can all future output avoid raw payloads, raw HTML, secrets, service-role details, environment values, and unnecessary candidate content?

## Safe output rules for a future read-only phase

Phase 22AH recommends a staged output policy for a future read-only discovery phase.

### Always safe to print

- Phase marker.
- Commit hash.
- Aggregate counts.
- Whether an eligible context exists.
- Whether the result is ambiguous.
- Whether stop conditions were triggered.
- Safe boolean assertions such as:
  - `has_reviewable_preview=true`
  - `source_run_matched=true`
  - `safe_source_evidence=true`
  - `would_stage_at_most_one_candidate=true`
  - `no_public_publish=true`
  - `no_candidate_decision=true`

### Requires explicit approval to print

- `discovery_run_id`
- `discovery_source_id`
- Preview artifact ID
- Audit correlation ID
- Source URL snapshot
- Candidate website URL
- Candidate name
- Any evidence locator

These values may be operationally required for a later live-staging approval gate, but they must be printed only after a separate read-only approval gate specifies exactly which values are safe and necessary.

### Must not print

- Candidate UUIDs from `discovery_candidate_tools`.
- Raw preview payloads.
- Raw extracted JSON.
- Raw HTML.
- Secret values.
- Service-role keys or credential material.
- Environment variables.
- Stack traces.
- Full database rows.
- Unbounded candidate descriptions.
- Any field that is not needed to prepare the next approval gate.

## Stop conditions for future target-context discovery

A future read-only discovery command must stop without selecting a context if:

1. No reviewable preview exists.
2. More than one eligible context exists and the command cannot deterministically narrow it.
3. The run/source relationship is missing or mismatched.
4. The preview is not accepted.
5. The preview status is not `reviewable`.
6. Source URL drift is detected.
7. The source URL snapshot is missing.
8. The source URL snapshot equals the candidate website URL.
9. Required source evidence is missing.
10. Existing staged candidate collision is detected.
11. The command would need to print unsafe fields not explicitly approved.
12. The command would require mutation, extraction execution, crawler execution, or API POST execution.
13. The command would select a candidate decision target.

## Future approval phrase

A future read-only discovery approval gate should define an exact phrase similar to:

```text
Approve Phase 22AJ target context read-only discovery
```

This phrase should authorize only a bounded read-only discovery command.

It must not authorize:

- live staging,
- candidate creation,
- candidate decision execution,
- cleanup,
- public publishing,
- `approve_for_draft`,
- schema changes,
- type generation,
- source code changes.

## Recommended next phase

Recommended next phase:

**Phase 22AI — Candidate Extraction/Live-Staging Target Context Read-Only Discovery Approval Gate**

Purpose:

- Define the exact future read-only command.
- Define the exact approved output fields.
- Define the exact approval phrase.
- Define fail-closed conditions.
- Define verification assertions.
- Require Gemini review before any read-only discovery command runs.

Phase 22AI should still not run the read-only discovery. It should only prepare the approval gate.

## Future candidate phases after Phase 22AI

A safe chain remains:

1. **Phase 22AI — Target Context Read-Only Discovery Approval Gate**
   - Defines the exact read-only command and approval phrase.
   - No execution.

2. **Phase 22AJ — Target Context Read-Only Discovery Live Execution**
   - Runs the approved read-only discovery command.
   - No mutation.
   - No staging write.

3. **Phase 22AK — Natural Live-Staging Repopulation Approval Gate**
   - Uses the read-only discovery result to define the exact live-staging command.
   - Requires a separate exact approval phrase.
   - No execution.

4. **Phase 22AL — Natural Live-Staging Repopulation Live Execution**
   - Stages at most one candidate.
   - No candidate decision.
   - No public publishing.
   - No cleanup unless separately approved.

5. **Phase 22AM — Natural Live-Staging Repopulation Result Documentation**
   - Documents whether staged availability has been restored.
   - Only then can candidate-decision target packaging be considered.

## Fallback path

If read-only discovery later proves no eligible natural target context exists, the fallback remains:

**Controlled staged candidate fixture path**

The fallback must still use a separate fixture planning gate, exact mutation approval phrase, fixture creation execution, fixture result documentation, and a later separate candidate decision target package.

## Explicit non-goals

Phase 22AH does not approve:

- Running a live DB read.
- Running a Supabase query.
- Calling API routes.
- Running extraction.
- Running a crawler.
- Creating or staging a candidate.
- Creating a fixture.
- Selecting a discovery run/source/preview target.
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

Gemini approved Phase 22AH for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no live DB reads, Supabase queries, API calls, extraction, crawler logic, staging operations, candidate creation, status changes, or database mutations are authorized.
- Target-context criteria are confirmed as safe and governed, including discovery run, discovery source, trusted preview artifact, reviewable preview status, safe source evidence, and future one-candidate staging bounds.
- No candidate UUID, candidate decision target, discovery run target, discovery source target, or preview artifact target is selected or recorded by this phase.
- Future output rules are confirmed as appropriate: always-safe outputs, explicitly approved outputs, and forbidden outputs are separated.
- Stop conditions are confirmed as important fail-closed protections against ambiguity, unsafe fields, source drift, collisions, mutation, extraction, crawler execution, API POST execution, or candidate target selection.
- Phase 22AI, Candidate Extraction/Live-Staging Target Context Read-Only Discovery Approval Gate, is confirmed as the correct next planning step.
- Safety locks remain active for mutations, cleanup, `approve_for_draft`, public publishing, and candidate decisions.

Commit approval is limited to this documentation update. No read-only discovery command, target selection, extraction run, staging write, fixture creation, status transition, or candidate decision may proceed from Phase 22AH.

## Next recommended phase after approval, commit, and push

Phase 22AI — Candidate Extraction/Live-Staging Target Context Read-Only Discovery Approval Gate.

Phase 22AI should prepare the exact bounded read-only target-context discovery command and approval phrase, without running it.
