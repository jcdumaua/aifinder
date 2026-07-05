# AiFinder Discovery Engine — Phase 25R Live-Readiness Risk Review Planning Gate

## Phase

Phase 25R — Live-Readiness Risk Review Planning Gate

## Status

Planning artifact only.

This phase does not reactivate the Discovery Engine. It defines the review contract for a future live-readiness risk review after the configurable read-only runtime verifier was proven on a clean synced baseline.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25Q.
- Baseline commit: `730bfe1`
- Baseline subject: `Document Phase 25Q configurable verifier rerun result`
- Phase 25Q result: configurable verifier rerun result documentation was pushed to `main`.
- Phase 25P result documented by Phase 25Q: configurable verifier rerun passed with explicit CLI metadata checks.

## Why this phase exists

Phase 25P proved the read-only runtime verifier can run with explicit expected git metadata.

Phase 25Q documented that result.

Phase 25R now defines the next safe planning boundary before any movement toward operational reactivation. The purpose is to identify live-readiness risks without running live services, reading the live database, invoking admin APIs, executing crawler or extraction flows, staging candidates, or approving public publication.

## Boundary

Phase 25R is docs-only.

Allowed:

- Create this planning document.
- Inspect repository-local files through ordinary git/static checks.
- Run repository-local static validation such as `npm run check`.
- Prepare a Gemini review package for this planning document.
- Preserve all existing operational blocks.

Not allowed:

- No operational reactivation.
- No direct DB access.
- No live DB reads.
- No DB mutation.
- No Supabase dashboard or SQL execution.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No verifier source changes.
- No crawler execution.
- No extraction execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No `approve_for_draft`.
- No public `tools` writes.
- No `discovered_tools` writes.
- No schema, migration, or type generation changes.
- No source app/API route/UI/helper changes.
- No testing script changes.
- No package or lockfile changes.
- No commit in this gate.
- No push in this gate.

## Review objective for the next phase

The future live-readiness risk review should answer one question:

Can AiFinder safely move from repository-local static reentry verification toward a tightly bounded, read-only live-readiness inspection plan without enabling operational Discovery Engine execution?

The expected answer may still be “not yet.” A safe review is allowed to identify blockers and recommend additional documentation-only gates.

## Risk domains to review

### 1. Live database and RLS readiness

Review whether the current docs and code are sufficient to reason about live database access boundaries before any read-only live inspection.

Questions:

- Which tables would be relevant to any future live-readiness read-only inspection?
- Which tables must remain completely untouched?
- Which service-role paths exist in the repo?
- Which RLS assumptions are documented versus actually verified?
- What evidence would be required before allowing even a read-only live query?

Required posture:

- No live DB reads in Phase 25R.
- No live DB reads unless a future phase explicitly approves a narrowly scoped read-only preflight.
- No mutation under any Phase 25R follow-up.

### 2. Admin API readiness

Review admin Discovery API routes as static surface area only.

Questions:

- Which admin routes exist?
- Which routes are read-only versus mutation-capable?
- Which routes can trigger candidate decision, extraction, crawler, staging, or publication behavior?
- Which routes must remain out of scope for live-readiness until a later explicit approval phrase exists?

Required posture:

- No admin API invocation.
- No local server startup.
- No route behavior changes.

### 3. Candidate decision and publication safety

Review whether candidate decision paths remain blocked from accidental execution.

Questions:

- Which code paths can trigger candidate decision execution?
- Which paths can set or rely on `approve_for_draft`?
- Which paths could eventually write to public `tools` or `discovered_tools`?
- Which additional guard checks should be required before any live decision smoke is considered?

Required posture:

- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No public `tools` writes.
- No `discovered_tools` writes.

### 4. Crawler, extraction, LLM, and evidence acquisition safety

Review crawler and extraction execution risks as static inventory only.

Questions:

- Which commands, scripts, routes, or helpers can trigger crawler, extraction, LLM, or evidence acquisition work?
- Which opt-in environment variables currently exist?
- Which flows could cause external network calls, token usage, evidence storage, or staging writes?
- Which future approval phrases would be required before each class of operation?

Required posture:

- No crawler execution.
- No extraction execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.

### 5. Environment variable and secret safety

Review whether environment and secret handling remains fail-closed.

Questions:

- Which `AIFINDER_RUN_DISCOVERY_*` variables exist?
- Which variables act as opt-in gates?
- Which variables must remain unset during static planning gates?
- Are there any implicit execution paths that bypass opt-in guards?

Required posture:

- No `AIFINDER_RUN_DISCOVERY_*` variables set during Phase 25R.
- No secret inspection beyond local variable-name/static guard checks.
- No secret printing.

### 6. Verification tooling maturity

Review the configurable verifier’s role after Phase 25P and Phase 25Q.

Questions:

- Is the verifier now mature enough to remain a reusable static readiness gate?
- What does it prove?
- What does it explicitly not prove?
- When should it be rerun?
- Should any future rerun remain a separate execution gate?

Required posture:

- No verifier rerun in Phase 25R.
- No verifier changes in Phase 25R.
- Future verifier reruns stay separated from documentation, commit, and push gates.

### 7. Human approval and phase-gate discipline

Review the operational approval model.

Questions:

- Which future steps require James approval?
- Which future steps require Gemini review?
- Which future steps require a separate terminal script?
- Which future steps must never be bundled together?

Required posture:

- Planning, Gemini review, local commit, and push remain separate gates.
- Any future live read, smoke test, mutation, or public publishing action requires a separate explicit approval phrase.

## Proposed future phase options

### Preferred next phase

Phase 25S — Live-Readiness Risk Review Documentation Gate

Scope:

- Docs-only.
- Use this Phase 25R plan as the review checklist.
- Produce a risk register and readiness matrix.
- No live DB reads.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No operational execution.

### Optional alternate next phase

Phase 25S-alt — Additional Static Inventory Gate

Scope:

- Docs-only or repository-local static inspection only.
- Inventory route/script/helper surfaces that could trigger live work.
- No live execution.
- No mutation.
- No operational reactivation.

## Required Gemini review questions

1. Does Phase 25R correctly preserve the docs-only planning boundary after Phase 25Q?
2. Are the listed live-readiness risk domains complete enough before any future live-readiness inspection?
3. Does Phase 25R correctly keep operational reactivation blocked?
4. Is the preferred next phase, Phase 25S live-readiness risk review documentation, safe as a docs-only continuation?
5. Are any additional hard blockers or review domains missing before AiFinder considers a future read-only live inspection?

## Phase 25R conclusion

Phase 25R is a documentation-only planning gate.

It confirms that the Discovery Engine remains operationally blocked and that the next safe step is a risk review, not live execution.

The configurable verifier is now available as a reusable static readiness gate, but Phase 25R does not rerun or modify it.

Operational reactivation remains blocked until a later phase explicitly approves a narrowly scoped action with separate review, execution, commit, and push gates.
