# Phase 22AF — Candidate Staging Repopulation Path Planning Gate

## Phase purpose

Phase 22AF is a documentation-only planning gate to choose the safest governed path to restore staged candidate availability.

Phase 22AF follows Phase 22AE, which documented the Phase 22AD live read-only aggregate status-count result:

```text
CANDIDATE_STAGING_STATUS_COUNT_READ_ONLY_PASS
phase=22AD
commit=28c82b7
total_count=2
status_count.archived=1
status_count.needs_more_evidence=1
NO_CANDIDATE_UUID_SELECTED
NO_CANDIDATE_DECISION_EXECUTED
```

The important operational conclusion is:

```text
staged=0
```

Candidate decision execution remains blocked because there is no staged candidate target.

## Current baseline

Phase 22AF starts from the pushed Phase 22AE commit:

- `523b074 Document candidate staging status count result`

## Boundary

Allowed in Phase 22AF:

- Verify repo state.
- Verify latest commit.
- Run static-only inspection of existing docs and implementation references.
- Run existing project checks.
- Document safe repopulation path options.
- Recommend a governed next phase.
- Prepare a Gemini review package.

Forbidden in Phase 22AF:

- No live DB read.
- No Supabase query.
- No extraction execution.
- No crawler execution.
- No fixture creation.
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

## Current availability state

The candidate staging table is not empty, but it has no staged candidates.

Known aggregate state from Phase 22AD:

| Candidate status | Count |
| --- | ---: |
| `archived` | 1 |
| `needs_more_evidence` | 1 |
| `staged` | 0 |

Governance implications:

- The `archived` row is outside the active candidate decision path.
- The `needs_more_evidence` row is not a staged candidate and must not be treated as staged.
- No existing row should be automatically selected as a decision target.
- No candidate decision package can be prepared until a staged candidate exists.

## Repopulation principles

Any path to restore staged candidate availability must satisfy these principles:

1. **No silent status resurrection.** Existing `archived` or `needs_more_evidence` rows must not be converted to `staged` without a separate, reviewed, explicit status-transition plan.
2. **No fuzzy target selection.** Non-staged rows must not become decision targets through inference, name matching, or convenience.
3. **No mixed creation-and-decision phase.** A phase that creates or stages a candidate must not also execute a candidate decision.
4. **No public side effects.** Repopulation must not publish to `public.tools`, call `approve_for_draft`, or change public-facing state.
5. **Prefer real pipeline validation before artificial fixture reuse when possible.** If the existing extraction/staging path can safely produce a staged candidate, that is more representative than a purely synthetic fixture.
6. **Use controlled fixture only when the goal is narrow decision-path validation.** A fixture can be appropriate for controlled smoke testing, but it should be clearly labeled as artificial and cleaned up or archived according to a separate plan.

## Path options

### Option A — Natural extraction/live-staging repopulation path

Use the existing candidate extraction/live-staging workflow to produce a staged candidate from a governed source or preview artifact.

Potential value:

- Exercises the intended product path.
- Validates that the staging pipeline can repopulate naturally.
- Produces a candidate with real source/evidence context.
- Avoids over-reliance on artificial fixtures.

Risks / requirements:

- May require a source or preview artifact selection.
- May involve crawler, fetch, extraction, or staging logic.
- Any live execution must be separately planned, reviewed, and explicitly approved.
- The execution phase must not include candidate decision execution.

Required future gates:

1. Readiness/inspection gate for the chosen extraction/live-staging route.
2. Live execution approval gate with exact command and approval phrase.
3. Live execution result documentation.
4. Only after a staged candidate exists: a separate candidate decision target package.

### Option B — Controlled staged candidate fixture path

Create a controlled staged candidate fixture using a previously reviewed fixture/staging pattern.

Potential value:

- Fastest path to restore one staged candidate for candidate-decision smoke validation.
- Easier to bound, identify, and later archive/cleanup.
- Reduces uncertainty compared with a natural extraction run.

Risks / requirements:

- Artificial; does not prove natural discovery/extraction can repopulate staging.
- Requires an explicit mutation approval gate.
- Must include exact fixture identity, expected row values, and cleanup/archival plan.
- Must not be mixed with candidate decision execution.

Required future gates:

1. Controlled fixture creation plan / approval gate.
2. Controlled fixture creation live execution.
3. Fixture creation result documentation.
4. Separate candidate decision target package only after the staged fixture exists.

### Option C — Existing `needs_more_evidence` row evidence-gathering path

Treat the `needs_more_evidence` state as a signal that a previous candidate may require more evidence before it can return to an active review path.

Potential value:

- May preserve continuity with an already-created candidate.
- Avoids creating unnecessary additional rows.
- Could clarify whether missing evidence, validation, or review notes explain the blocked state.

Risks / requirements:

- Must not print or select a candidate UUID without a separate approval gate.
- Must not convert `needs_more_evidence` to `staged` automatically.
- Must not treat the row as an active decision target.
- Any evidence-gathering read must be separately approved and carefully bounded.

Required future gates:

1. Read-only non-staged candidate triage approval gate.
2. Bounded read-only triage execution that avoids public/secret/sensitive fields unless explicitly approved.
3. Triage result documentation.
4. Separate status-transition or evidence-collection plan if warranted.

### Option D — Admin/manual staging path

Use an admin/manual staging mechanism, if already available and safe, to create a staged candidate under operator control.

Potential value:

- Could support real operator workflow.
- May be useful if a human-curated source candidate is known.
- Can preserve auditability if implemented through existing admin staging helpers.

Risks / requirements:

- It is still a staging mutation.
- Requires separate approval, exact inputs, and result documentation.
- Must not create public tool records.
- Must not execute candidate decision in the same phase.

Required future gates:

1. Admin/manual staging readiness gate.
2. Exact input planning gate.
3. Live staging execution approval gate.
4. Live result documentation.

## Recommendation

Recommended next phase:

**Phase 22AG — Candidate Extraction/Live-Staging Repopulation Readiness Gate**

Reason:

- Phase 22AD proved there are no staged candidates.
- The safest product-representative path is to first determine whether the natural extraction/live-staging workflow can repopulate staging.
- A natural repopulation path better validates the Discovery Engine than immediately creating another artificial fixture.
- This remains a readiness/planning gate only; it should not run extraction, crawler logic, live DB reads, or mutations.
- If the natural route is not ready, a later controlled fixture path can still be used as a fallback for candidate-decision smoke validation.

## Fallback recommendation

If Phase 22AG finds that natural extraction/live staging is not ready or too broad for the current milestone, the fallback should be:

**Controlled staged candidate fixture path**

The fallback must still use a separate mutation approval gate and must not be combined with candidate decision execution.

## Explicit non-goals

Phase 22AF does not approve:

- Running extraction.
- Running a crawler.
- Running a live DB read.
- Creating a candidate.
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

Gemini approved Phase 22AF for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no live DB reads, mutations, or staging operations are authorized.
- No candidate UUID or candidate target is selected or recorded by this phase.
- No candidate decision execution is authorized.
- The repopulation principles are confirmed as safe: no silent status resurrection, no fuzzy target selection, no mixed creation-and-decision phase, and no public side effects.
- Existing `archived` and `needs_more_evidence` rows remain locked out of the staged candidate decision path unless a separate reviewed transition or triage phase approves otherwise.
- Phase 22AG, Candidate Extraction/Live-Staging Repopulation Readiness Gate, is confirmed as the correct next planning step.
- Fallback paths such as controlled fixture creation or admin/manual staging remain separately gated.
- Safety locks remain active for mutations, cleanup, `approve_for_draft`, public publishing, and candidate decisions.

Commit approval is limited to this documentation update. No repopulation action, extraction run, fixture creation, status transition, or candidate decision may proceed from Phase 22AF.

## Next recommended phase after approval, commit, and push

Phase 22AG — Candidate Extraction/Live-Staging Repopulation Readiness Gate.

Phase 22AG should inspect whether the existing extraction/live-staging route can safely produce a staged candidate under a later explicit live approval phrase. It should not run extraction or mutate the database.
