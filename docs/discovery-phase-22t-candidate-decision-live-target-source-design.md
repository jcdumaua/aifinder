# AiFinder Discovery Engine — Phase 22T Candidate Decision Live Target Source Design

## Phase Status

Phase 22T is a documentation-only target source design phase.

This phase chooses the safest source strategy for a future exact candidate UUID package.

This phase does not select an actual live candidate.

This phase does not record an actual candidate UUID.

This phase does not inspect the live database.

This phase does not run a live database query.

This phase does not run the candidate decision execution preflight script.

This phase does not perform candidate decision execution.

This phase does not perform database mutation.

This phase does not publish public-facing tools.

This phase does not run `approve_for_draft`.

This phase does not perform cleanup mutation.

This phase does not modify source code.

This phase does not modify executable scripts.

This phase does not modify API routes.

This phase does not modify UI.

This phase does not modify Supabase schema, migrations, policies, or generated types.

## Starting Checkpoint

Phase 22S was completed and pushed to `main`.

```text
Latest pushed commit: b209776 Document Phase 22S candidate decision live target selection plan
Expected repo status before Phase 22T docs step: ## main...origin/main
```

## Background

Phase 22S established the future live target selection plan.

It defined acceptable candidate UUID sources:

1. James-provided exact UUID.
2. Future read-only lookup by exact UUID.
3. Future read-only candidate listing gate.

It also prohibited fuzzy targeting methods such as:

- most recent candidate
- first queue row
- candidate name only
- tool name only
- domain only
- URL only
- category only
- similarity score only
- status only
- UI row position
- copied partial UUID
- assumption from previous phase

Phase 22T now decides the safest source strategy for the next phase.

## Purpose

The purpose of Phase 22T is to choose the recommended candidate UUID source path for future work while preserving all locks.

This phase does not provide the UUID.

This phase only defines how the UUID should be sourced.

## Source Strategy Decision

Recommended source strategy:

```text
Primary source: James-provided exact UUID
Fallback source: separately reviewed read-only candidate listing gate
Not recommended as the first next step: automated candidate discovery or automatic selection
```

The safest next step is for James to provide one exact candidate UUID from a trusted admin interface or prior trusted terminal output, if available.

This avoids broad live database reads.

This avoids automatic candidate selection.

This keeps the next phase documentation-only.

If James does not have a trusted exact UUID, the workflow should not guess.

Instead, the project should create a separate docs-only design for a narrow read-only candidate listing gate before any live query is run.

## Source A — James-Provided Exact UUID

### Recommendation

Source A is the preferred path for the next phase if James can provide an exact UUID.

### Why Source A Is Preferred

Source A is preferred because:

- it avoids live database reads in the next phase
- it avoids broad candidate listing
- it avoids automated selection
- it keeps the human in control of target choice
- it keeps the next phase documentation-only
- it supports exact candidate targeting
- it allows Gemini to review the target package before any live lookup

### Source A Requirements

If James provides an exact UUID, the next phase must document:

- exact UUID
- where James copied the UUID from
- whether the source was an admin UI, prior terminal output, or another trusted source
- intended candidate decision action label
- expected current candidate status
- expected next candidate status
- expected audit event name
- expected commit hash
- public publishing allowed flag
- `approve_for_draft` allowed flag
- cleanup allowed flag
- exact approval phrase for any later read-only lookup
- Gemini review requirement

The next phase must not run a live lookup.

The next phase must not run preflight.

The next phase must not execute any decision.

### Source A Limitation

A James-provided UUID does not prove that the candidate currently exists or remains in the expected status.

It only establishes the target identifier.

A later read-only exact UUID lookup would still be required to verify the live candidate state.

## Source B — Read-Only Lookup by Exact UUID

### Recommendation

Source B should come after Source A.

It is not the immediate recommended next step unless the next phase already has an exact UUID and James separately approves a read-only live lookup phase.

### Why Source B Is Useful

Source B verifies a known UUID without listing or scanning candidates.

It is narrower than a candidate listing gate.

It can confirm that the candidate row exists and has the expected state before non-mutating preflight.

### Source B Requirements

A future Source B phase must:

- be separately reviewed
- be separately approved by James
- require explicit read-only opt-in
- require exact candidate UUID
- require expected current status
- require expected commit hash
- perform only a single read-only lookup
- avoid broad candidate lists
- avoid mutation
- avoid audit writes
- avoid decision route calls
- avoid public publishing routes
- avoid cleanup routes
- avoid `approve_for_draft`

Recommended future pass marker:

```text
LIVE_CANDIDATE_EXACT_LOOKUP_READ_ONLY_PASS
```

Recommended future fail-locked marker:

```text
LIVE_CANDIDATE_EXACT_LOOKUP_READ_ONLY_FAIL_LOCKED
```

## Source C — Read-Only Candidate Listing Gate

### Recommendation

Source C should be used only if James cannot provide an exact UUID.

It must be designed in a separate phase before any live query.

### Why Source C Requires Extra Caution

Source C is more powerful because it can expose multiple candidates.

It risks accidental target selection based on recency, order, status, or incomplete context.

It therefore requires stricter controls than Source A or Source B.

### Source C Requirements

A future Source C design must define:

- exact table or read source
- exact read-only query scope
- result limit
- allowed fields
- prohibited fields
- ordering rules
- whether status filtering is allowed
- whether created date filtering is allowed
- marker names
- explicit opt-in variable
- no automatic target selection
- manual James selection requirement
- Gemini review requirement

### Source C Output Rules

A future read-only listing should output only enough information for James to manually choose one candidate UUID.

Recommended maximum output fields:

- candidate UUID
- candidate status
- normalized candidate name or display label
- canonical URL or source URL, if available
- created timestamp
- updated timestamp
- minimal source reference, if available

A future listing should not output:

- full raw extraction payloads
- unnecessary metadata
- service role secrets
- private environment values
- unrelated candidate rows beyond the result limit
- audit payloads unless separately approved
- public publishing payloads

## Disallowed Source Strategy

The workflow must not use an automatic source strategy.

Disallowed strategies:

- automatically choose newest candidate
- automatically choose oldest candidate
- automatically choose first queue row
- automatically choose candidate with a matching name
- automatically choose candidate with a matching URL
- automatically choose candidate with a matching domain
- automatically choose candidate by confidence score
- automatically choose candidate by category
- automatically choose candidate from a broad search
- automatically choose candidate from a prior phase assumption
- combine candidate listing and decision execution
- combine candidate selection and mutation
- combine read-only lookup and mutation
- combine target selection and cleanup
- combine target selection and public publishing

## Recommended Next Phase

Recommended next phase:

```text
Phase 22U — Candidate Decision Exact UUID Target Package
```

Recommended Phase 22U boundary:

```text
Docs-only exact UUID target package.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No source/API/UI/Supabase changes.
```

Phase 22U should be used only if James can provide an exact candidate UUID from a trusted source.

Phase 22U should record the UUID and target metadata as documentation only.

It should not query Supabase.

It should not run preflight.

It should not execute decisions.

## Alternative Next Phase

If James does not have an exact UUID, the alternative next phase should be:

```text
Phase 22U — Candidate Decision Read-Only Candidate Listing Gate Design
```

Recommended alternative Phase 22U boundary:

```text
Docs-only read-only listing gate design.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No source/API/UI/Supabase changes.
```

This alternative should design a narrow candidate listing gate but must not run it.

## Decision Tree

The next phase should follow this decision tree:

```text
Does James already have an exact candidate UUID from a trusted source?

Yes:
  Proceed to Phase 22U — Candidate Decision Exact UUID Target Package.
  Keep docs-only.
  Record UUID source and expected future checks.
  Do not query live DB.

No:
  Proceed to Phase 22U — Candidate Decision Read-Only Candidate Listing Gate Design.
  Keep docs-only.
  Design the narrowest safe future listing query.
  Do not query live DB.
```

## Required Future Human Input

Before Phase 22U exact UUID target package can proceed, James must provide:

- exact candidate UUID
- source of the UUID
- intended future action label
- expected current status, if known
- expected next status, if known

If James does not know expected statuses, Phase 22U may mark them as unknown and require a later read-only lookup to resolve them.

Unknown values must not be guessed.

## Approval Phrase Requirements

For Phase 22U exact UUID target package, the approval phrase should remain simple because it is documentation-only.

Example:

```text
Approve Phase 22U exact UUID target package
```

For any future live read-only lookup, the approval phrase must include the UUID.

Example:

```text
Approve Phase 22V read-only lookup for candidate UUID <uuid>
```

For any future non-mutating preflight, the approval phrase must include the UUID and action.

Example:

```text
Approve Phase 22W non-mutating preflight for candidate UUID <uuid> action <action>
```

For any future mutation-capable execution, the approval phrase must include UUID, action, current status, next status, and explicit mutation intent.

Generic phrases must remain insufficient.

## Lock Flags

All lock flags remain false through Phase 22T.

```text
public publishing allowed: false
approve_for_draft allowed: false
cleanup allowed: false
candidate decision execution allowed: false
live DB read allowed in this phase: false
```

Any future phase that changes one of these values must be separate, reviewed, and explicitly approved.

## Gemini Review Requirement

Phase 22T should be reviewed by Gemini before commit.

Gemini should confirm:

1. Phase 22T is documentation-only.
2. No live DB reads are authorized.
3. No DB mutations are authorized.
4. No candidate decision execution is authorized.
5. No candidate UUID is selected in this phase.
6. Source A is correctly recommended as the safest next path if James has an exact UUID.
7. Source C is correctly reserved for a separately reviewed listing gate if no UUID exists.
8. Fuzzy and automatic targeting remain prohibited.
9. Public publishing remains locked.
10. `approve_for_draft` remains locked.
11. Cleanup mutation remains locked.
12. It is safe to commit this target source design document.

## Commit Readiness Criteria

Phase 22T is safe to commit only if:

- the repo contains only the Phase 22T documentation file as an untracked change
- no executable files changed
- no source files changed
- no live reads were run
- no database mutations were run
- no candidate decision was executed
- Gemini approves the documentation
- James explicitly approves commit

## Phase 22T Conclusion

Phase 22T selects the safest source strategy for future candidate targeting.

The recommended strategy is:

```text
Use a James-provided exact UUID if available.
Otherwise, design a separate read-only candidate listing gate before any live query.
```

This phase does not select a live candidate.

This phase does not query the database.

This phase does not run preflight.

This phase does not execute a decision.

The Discovery Engine remains fail-closed before any live candidate interaction.
