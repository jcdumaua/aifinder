# Discovery Phase 22A — Candidate Decision Workflow Roadmap Re-Entry Gate

## Status

Drafted for review.

Phase 22A is a documentation-only roadmap re-entry gate.

It follows the completed Phase 21 cleanup closure and determines the safest next Discovery Engine workstream before any new implementation begins.

## Phase 22A Purpose

Phase 22A re-enters the broader Discovery Engine roadmap after the controlled candidate decision cleanup track was formally closed.

This phase exists to prevent jumping directly from successful cleanup into UI or production behavior changes without a clean backend milestone summary and roadmap decision.

## Starting Context

The previous cleanup track is complete and pushed.

Latest completed phase:

- Phase 21K — Candidate Decision Cleanup Result Review / Roadmap Closure Gate
- Commit: `36f7149`
- Commit message: `Document candidate cleanup roadmap closure gate`
- Final status after push: `## main...origin/main`

Phase 21K closed the controlled cleanup track after:

1. Phase 21G selected cleanup Option C.
2. Phase 21H documented the cleanup execution approval gate.
3. Phase 21I executed the controlled cleanup update.
4. Phase 21J documented the cleanup execution result.
5. Phase 21K reviewed and closed the cleanup track.

## Phase 21 Closure State

The controlled candidate decision live-smoke fixture is no longer active for cleanup.

Controlled target:

- Table: `public.discovery_candidate_tools`
- Candidate ID: `c7c50401-fa5b-4b2e-bb43-d30bf05a144a`
- Phase 21E marker: `phase-21e-controlled-fixture-20260702171623-f3d66798`
- Audit correlation ID: `91e249ff-8b2b-4e7c-b04c-a3733dd02c18`

Final cleanup state:

- `cleanup_status = 'archived'`
- Row preserved for auditability: yes
- Public publishing performed: no
- `approve_for_draft` performed: no
- `public.tools` write performed: no
- `discovered_tools` write performed: no
- Delete performed: no

The cleanup milestone is closed.

## Phase 22A Scope

Allowed in Phase 22A:

- Documentation only.
- Roadmap re-entry review.
- Candidate decision backend milestone review.
- Workstream selection for the next phase.
- Gemini review package preparation.
- Commit and push only after James explicitly approves.

Not allowed in Phase 22A:

- No database mutation.
- No cleanup execution.
- No public publishing.
- No `approve_for_draft`.
- No `public.tools` write.
- No `discovered_tools` write.
- No schema changes.
- No migration changes.
- No type generation.
- No source or UI behavior changes.
- No crawler execution.
- No extraction execution.
- No LLM execution or wiring.
- No automation wiring.
- No candidate promotion or rejection.
- No production behavior changes.

## Candidate Decision Backend Milestone Snapshot

The candidate decision backend has reached a meaningful milestone.

Completed work includes:

- Candidate staging and decision planning phases.
- Schema and audit readiness documentation.
- Candidate decision helper/route implementation phases.
- Controlled fixture creation.
- Candidate decision live smoke.
- Result review.
- Cleanup planning.
- Controlled cleanup execution.
- Cleanup result documentation.
- Cleanup closure gate.

This means the backend has been tested through a controlled live path and the test fixture has been safely closed out.

However, this does not mean the full production workflow is ready.

## Known Remaining Gaps Before Production Workflow

The following areas still require future phases before production use:

- Final backend milestone summary.
- Admin UI decision-control design.
- Admin UI decision-control implementation plan.
- Confirmation modal copy and irreversible-action warnings.
- Queue visibility/read-model checks for archived cleanup rows.
- Clear separation between draft approval, public publishing, and cleanup operations.
- Additional QA around no accidental `approve_for_draft`.
- Possible audit-history/admin-history visibility for preserved rows.
- Production-readiness review before any live operational use.

## Roadmap Options Considered

### Option A — Move directly into Candidate Decision UI Controls Design

This would start designing admin UI controls for candidate decisions.

Potential benefits:

- Moves closer to admin usability.
- Defines the operator workflow.
- Helps James see the decision process in the dashboard.

Risk:

- UI design may move too fast without a consolidated backend closure checkpoint.
- `approve_for_draft` and publishing boundaries are sensitive.
- Decision controls need extra care to avoid accidental production behavior.

### Option B — Start Queue Visibility / Read Model Hardening

This would inspect how candidate rows appear in admin queues after cleanup status changes.

Potential benefits:

- Verifies `cleanup_status = 'archived'` is handled safely.
- Helps define active queue versus history/audit visibility.

Risk:

- May require source/API behavior changes if gaps are found.
- Better handled after the backend milestone is summarized.

### Option C — Candidate Decision Backend Closure Summary

This would document the completed backend/live-smoke/cleanup milestone before UI or source work resumes.

Potential benefits:

- Creates a clean checkpoint.
- Reduces roadmap ambiguity.
- Summarizes what is ready, what is not ready, and what remains blocked.
- Keeps the workflow documentation-first.
- Preserves strict safety gates before future UI controls.

Risk:

- Adds one documentation phase before implementation resumes.

## Phase 22A Decision

Recommended next workstream:

```text
Option C — Candidate Decision Backend Closure Summary
```

Recommended next phase:

```text
Phase 22B — Candidate Decision Backend Closure Summary
```

Reason:

The candidate decision backend has completed a long, sensitive chain involving controlled fixture creation, live smoke, cleanup execution, and closure.

Before moving into UI controls or queue behavior changes, the safest next step is to create a backend closure summary that clearly states:

- what was implemented,
- what was tested,
- what was intentionally not authorized,
- what safety boundaries remain,
- what gaps remain before production workflow,
- and what future phase should start UI work.

## Phase 22B Proposed Purpose

Phase 22B should be documentation-only.

Purpose:

- Summarize the candidate decision backend milestone.
- Confirm completed backend capabilities.
- Confirm live-smoke and cleanup evidence.
- Identify remaining production-readiness gaps.
- Recommend the first future UI decision-control design phase only after closure is complete.

## Phase 22B Proposed Forbidden Scope

Phase 22B should not include:

- source changes,
- UI implementation,
- API changes,
- helper changes,
- schema/migration/typegen changes,
- DB mutations,
- live smoke,
- cleanup execution,
- public publishing,
- `approve_for_draft`,
- crawler/extraction/LLM/automation wiring.

## Phase 22A Completion Criteria

Phase 22A is complete when:

1. This roadmap re-entry gate is reviewed.
2. Gemini approves it as accurate and safe.
3. James approves the local docs-only commit.
4. The Phase 22A document is committed.
5. James approves the push.
6. The Phase 22A commit is pushed to `origin/main`.
7. Final repo status is clean and synced.

## Phase 22A Boundary Statement

Phase 22A is docs-only.

It does not execute, enable, or authorize any database mutation, cleanup execution, candidate decision operation, public publishing, `approve_for_draft`, schema/migration/typegen operation, source/UI behavior change, crawler/extraction/LLM operation, or automation wiring.

It only re-enters the broader roadmap and recommends Phase 22B as a documentation-first backend closure summary.
