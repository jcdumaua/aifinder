# Phase 25CP — Post-Rotation Reactivation Readiness Planning Gate

## Status

Planning only.

## Purpose

Phase 25CP documents the readiness plan for moving from the closed credential-rotation dependency to any future operational reactivation work.

This phase does not reactivate operations. It defines the minimum safe sequence that must happen before reactivation can be considered.

## Inherited state

Phase 25CP inherits the following completed state:

- Phase 25CM documented post-typegen verification.
- Phase 25CN documented credential-rotation security closure / reactivation dependency planning.
- Phase 25CO documented credential-rotation completion confirmation using the operator-provided non-secret confirmation phrase.
- Phase 25CO closed the credential-rotation dependency for planning purposes only.
- Operational reactivation remains blocked.

## Boundary

Phase 25CP is documentation-only.

This phase does not perform operational reactivation.

This phase does not run live inspection.

This phase does not run the verifier.

This phase does not query the database.

This phase does not read live database metadata.

This phase does not run SQL.

This phase does not run psql.

This phase does not run Supabase CLI commands.

This phase does not inspect, print, request, store, log, or commit secret values.

This phase does not request or print database URLs.

This phase does not request or print project-ref values.

This phase does not scan `.env` files.

This phase does not modify source code, API routes, UI, schema, migrations, packages, lockfiles, generated types, or inspection scripts.

This phase does not mutate the database.

This phase does not write to `public.tools`.

This phase does not write to `discovered_tools`.

This phase does not approve candidate decisions.

## Why reactivation is still blocked

Credential rotation is a security dependency closure, not operational evidence.

The project still needs fresh post-rotation readiness evidence before any operational reactivation can be considered. The safe path must prove that the repository is clean, expected generated type targets are present, inspection tooling is unchanged, the reactivation scope is explicit, and any live access is separately approved before execution.

Phase 25CP therefore keeps operational reactivation blocked.

## Reactivation readiness principles

Any future reactivation path must satisfy all of the following principles:

1. Use separate phases for planning, approval, execution, review, local commit, and push.
2. Require explicit operator approval before any live read-only check.
3. Keep all credential handling outside the repository and outside ChatGPT-visible output.
4. Treat credential rotation completion as non-secret operator testimony, not as a reason to skip fresh verification.
5. Prefer read-only evidence before any operational decision.
6. Keep database mutation, public publishing, candidate decisions, and discovered tool writes prohibited unless a later phase explicitly scopes and approves them.
7. Preserve the existing inspection script unless a separate implementation-planning phase approves changes.
8. Fail closed if repository state, branch state, baseline, scope, or expected generated type targets are not exactly as expected.
9. Keep Gemini review as a separate gate before any commit.
10. Keep local commit and push as separate gates after review.

## Minimum future sequence before operational reactivation

### Phase 25CQ — Post-Rotation Read-Only Live Inspection Rerun Approval Gate

Recommended next phase.

Purpose:

- Prepare an approval gate for a future read-only live inspection rerun.
- Confirm exact command, expected baseline, allowed outputs, prohibited outputs, and stop conditions.
- Require explicit operator approval before any live execution.
- Keep the phase documentation-only.
- Do not run the live inspection.

Required boundary:

- No live DB reads.
- No Supabase CLI.
- No psql.
- No SQL.
- No environment scanning.
- No secret output.
- No inspection script modification.
- No inspection script execution.
- No source, package, schema, migration, or type changes.
- No operational reactivation.

### Phase 25CR — Post-Rotation Read-Only Live Inspection Rerun Execution Gate

Allowed only after Phase 25CQ is reviewed, committed, pushed, and the operator gives the exact approval phrase defined by Phase 25CQ.

Purpose:

- Run the previously approved read-only inspection exactly once.
- Capture non-secret evidence only.
- Preserve raw output for review.
- Confirm no database mutation and no operational reactivation.

Required boundary:

- Read-only inspection only.
- No mutation.
- No public publishing.
- No candidate decision execution.
- No source changes.
- No script changes.
- No generated type changes.
- No secrets.

### Phase 25CS — Post-Rotation Live Inspection Result Review Gate

Allowed only after Phase 25CR has produced fresh evidence.

Purpose:

- Document the result of the fresh post-rotation read-only inspection.
- Decide whether operational reactivation remains blocked or can move to a later narrowly scoped reactivation planning phase.
- Preserve the evidence trail without exposing secrets.

Required boundary:

- Documentation-only.
- No new live reads.
- No mutation.
- No operational reactivation.

### Later reactivation planning phase

A later phase may propose operational reactivation only if Phase 25CS supports it.

That later phase must still be planning-only unless explicitly approved otherwise.

## Readiness checklist for Phase 25CQ

Phase 25CQ should verify or document all of the following before any execution phase can exist:

- Current branch is `main`.
- Repository remote is `jcdumaua/aifinder`.
- Repository is clean before work begins.
- Expected baseline is Phase 25CP once Phase 25CP is committed and pushed.
- Phase 25CO credential-rotation completion confirmation remains documented.
- Phase 25CN credential-rotation planning remains documented.
- Phase 25CM post-typegen verification remains documented.
- Generated type target for `discovery_sources.status` remains present.
- Existing read-only inspection script remains unchanged.
- Any future command is exact, copy-pasteable, and fail-closed.
- Any future output excludes secrets, database URLs, project-ref values, tokens, and environment contents.
- Any future live read remains strictly read-only.
- Operational reactivation remains blocked until later explicit approval.

## Stop conditions

Future phases must stop immediately if any of the following occurs:

- Repository remote is not `jcdumaua/aifinder`.
- Branch is not `main`.
- Repository is dirty before phase work.
- Baseline does not match the expected prior phase.
- Unexpected source, API, UI, schema, migration, package, lockfile, generated type, or script changes exist.
- Any secret-like value appears in output.
- Any database URL appears in output.
- Any project-ref value appears in output.
- Any command would mutate the database.
- Any command would write to `public.tools`.
- Any command would write to `discovered_tools`.
- Any command would approve candidate decisions.
- Any command would publish tools publicly.
- Any command would reactivate operations without a separate approval gate.

## Gemini review request

Gemini should review Phase 25CP for the following:

1. Confirm Phase 25CP is documentation-only.
2. Confirm Phase 25CP does not operationally reactivate Discovery Engine.
3. Confirm the proposed Phase 25CQ to Phase 25CS sequence is safer than immediate reactivation.
4. Confirm credential rotation closure is treated as planning evidence only.
5. Confirm future live inspection rerun remains separately gated.
6. Confirm the boundaries prevent secret exposure.
7. Confirm the boundaries prevent database mutation.
8. Confirm the boundaries prevent public publishing and candidate decision execution.
9. Confirm no source, API, UI, schema, migration, package, lockfile, generated type, or inspection script changes are introduced.
10. Confirm Phase 25CQ is the correct next recommended phase.

## Commit readiness

Phase 25CP may be committed only after Gemini approval and operator approval.

Expected committed scope:

```text
docs/discovery-phase-25cp-post-rotation-reactivation-readiness-planning-gate.md
```

Expected commit subject:

```text
Document Phase 25CP reactivation readiness plan
```

## Discovery Engine progress report

- controlled_build_sequence_status=stable; Phase 25CO is committed and pushed to `main`.
- current_phase_reentry_progress=post-rotation reactivation readiness is being planned without execution.
- credential_rotation_dependency=closed for planning purposes only.
- operational_reactivation_progress=halted; operational reactivation remains blocked.
- next_recommended_phase=Phase 25CQ Post-Rotation Read-Only Live Inspection Rerun Approval Gate.
