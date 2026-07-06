# Phase 25CQ — Post-Rotation Read-Only Live Inspection Rerun Approval Gate

## Status

Planning and approval gate only.

## Purpose

Phase 25CQ documents the approval boundary for a future post-rotation read-only live inspection rerun.

This phase does not run the inspection. It defines the approval phrase, allowed execution scope, prohibited operations, expected evidence, and stop conditions for a later execution phase.

## Inherited state

Phase 25CQ inherits the following completed state:

- Phase 25CM documented post-typegen verification.
- Phase 25CN documented credential-rotation security closure / reactivation dependency planning.
- Phase 25CO documented credential-rotation completion confirmation without exposing secrets.
- Phase 25CP documented post-rotation reactivation readiness planning.
- Credential rotation dependency is closed for planning purposes only.
- Operational reactivation remains blocked.

## Boundary

Phase 25CQ is documentation-only.

This phase does not run live inspection.

This phase does not run the verifier.

This phase does not run Supabase CLI commands.

This phase does not run psql.

This phase does not run SQL.

This phase does not query the database.

This phase does not read live database metadata.

This phase does not inspect, print, request, store, log, or commit secret values.

This phase does not request or print database URLs.

This phase does not request or print project-ref values.

This phase does not scan `.env` files.

This phase does not modify the read-only inspection script.

This phase does not modify source code, API routes, UI, schema, migrations, packages, lockfiles, generated types, or inspection scripts.

This phase does not mutate the database.

This phase does not write to `public.tools`.

This phase does not write to `discovered_tools`.

This phase does not approve candidate decisions.

This phase does not publish tools publicly.

This phase does not operationally reactivate Discovery Engine.

## Future execution phase

The next execution phase may be Phase 25CR — Post-Rotation Read-Only Live Inspection Rerun Execution Gate.

Phase 25CR may exist only after all of the following are true:

1. Phase 25CQ is Gemini-approved.
2. Phase 25CQ is committed and pushed to `main`.
3. The repository is clean and synced to the Phase 25CQ commit.
4. The operator provides the exact approval phrase below.
5. The execution script verifies that only the existing tracked read-only inspection script is used.
6. The execution script verifies that no source, schema, package, migration, generated type, or inspection script changes exist.
7. The execution script verifies that no secret-like values are printed in the generated result package.

## Required operator approval phrase for Phase 25CR

The required exact phrase is:

```text
Approve Phase 25CR read-only live inspection rerun exactly once
```

Any future Phase 25CR execution script must fail closed unless this exact phrase is supplied.

## Future command scope

Phase 25CQ approves only the concept of one future read-only live inspection rerun, not execution in this phase.

The future Phase 25CR execution script must use the existing tracked inspection harness:

```text
testing/discovery-read-only-live-inspection.mjs
```

Phase 25CR must verify the harness immediately before execution and must not modify it.

If the harness requires an opt-in environment variable or exact command wrapper, Phase 25CR must derive and verify that requirement from the tracked script before execution. The execution command must fail closed if the opt-in guard is absent, ambiguous, or changed unexpectedly.

Phase 25CR may not invent a different inspection path.

## Allowed evidence in Phase 25CR

Phase 25CR may capture non-secret evidence only, including:

- Repository identity.
- Branch identity.
- Current HEAD and subject.
- Working tree status.
- Inspection script path and tracked-state confirmation.
- Non-secret read-only inspection result summary.
- Non-secret pass/fail markers.
- Confirmation that operational reactivation remains blocked.
- Confirmation that no database mutation was attempted.
- Confirmation that no public publishing or candidate decision execution occurred.

## Prohibited evidence in Phase 25CR

Phase 25CR must not print, store, log, or commit:

- Database URLs.
- Passwords.
- Tokens.
- Supabase project-ref values.
- Environment file contents.
- Raw environment variable dumps.
- Secret-like connection strings.
- Any output containing credential material.

If any prohibited value appears, the phase must stop and treat the output as contaminated.

## Required stop conditions for Phase 25CR

Phase 25CR must stop immediately if any of the following occurs:

- Repository remote is not `jcdumaua/aifinder`.
- Branch is not `main`.
- Repository is dirty before execution.
- HEAD does not match the expected Phase 25CQ baseline.
- Branch is ahead of or behind `origin/main`.
- Inspection script is missing.
- Inspection script is untracked.
- Inspection script has staged or unstaged changes.
- The opt-in guard is absent or ambiguous.
- Any source, API, UI, schema, migration, package, lockfile, generated type, or inspection script change exists.
- Any database URL appears in output.
- Any project-ref value appears in output.
- Any password, token, or secret-like value appears in output.
- Any command would mutate the database.
- Any command would write to `public.tools`.
- Any command would write to `discovered_tools`.
- Any command would approve candidate decisions.
- Any command would publish tools publicly.
- Any command would operationally reactivate Discovery Engine.

## Required Phase 25CR result package

If Phase 25CR is later approved and executed, its result package should include:

```text
PASSED or FAILED marker
phase name
exact commit baseline
inspection harness path
confirmation that the harness was unchanged
confirmation that the operator approval phrase was supplied
non-secret inspection result summary
confirmation that operational reactivation remains blocked
confirmation that no mutation or public publishing occurred
raw log path
next recommended phase
```

## Phase after execution

If Phase 25CR executes successfully, the next recommended phase is:

```text
Phase 25CS — Post-Rotation Live Inspection Result Review Gate
```

Phase 25CS must be documentation-only unless a later phase explicitly approves otherwise.

## Gemini review request

Gemini should review Phase 25CQ for the following:

1. Confirm Phase 25CQ is documentation-only.
2. Confirm Phase 25CQ does not run live inspection.
3. Confirm Phase 25CQ does not run the verifier.
4. Confirm the required Phase 25CR approval phrase is sufficiently explicit.
5. Confirm the future Phase 25CR execution scope is constrained to one read-only rerun.
6. Confirm the future execution plan prevents credential exposure.
7. Confirm the future execution plan prevents DB mutation.
8. Confirm the future execution plan prevents public publishing and candidate decision execution.
9. Confirm the stop conditions are sufficient to fail closed.
10. Confirm Phase 25CS is the correct next phase after any Phase 25CR execution.

## Commit readiness

Phase 25CQ may be committed and pushed only after Gemini approval and operator approval.

Expected committed scope:

```text
docs/discovery-phase-25cq-post-rotation-read-only-live-inspection-rerun-approval-gate.md
```

Expected commit subject:

```text
Document Phase 25CQ live inspection rerun approval gate
```

## Discovery Engine progress report

- controlled_build_sequence_status=stable; Phase 25CP is committed and pushed to `main`.
- credential_rotation_dependency=closed for planning purposes only.
- current_phase_reentry_progress=post-rotation read-only live inspection rerun approval is planned but not executed.
- operational_reactivation_progress=halted; operational reactivation remains blocked.
- next_recommended_phase=Phase 25CR Post-Rotation Read-Only Live Inspection Rerun Execution Gate, only after Gemini approval, commit/push, and exact operator approval phrase.
