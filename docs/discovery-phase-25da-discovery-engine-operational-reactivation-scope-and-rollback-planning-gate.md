# Discovery Phase 25DA — Discovery Engine Operational Reactivation Scope and Rollback Planning Gate

## Status

Documentation-only scope and rollback planning gate.

Phase 25DA follows Phase 25CZ, which concluded that operational reactivation readiness planning may begin while operational reactivation remains blocked.

Phase 25DA does not reactivate Discovery Engine operations.

Phase 25DA does not execute operational workflows.

Phase 25DA does not run live inspections.

Phase 25DA does not modify source code, schema, packages, generated types, or configuration.

## Scope

This phase defines the first possible operational reactivation scope and the rollback requirements that must exist before any operational execution can be considered.

Allowed in this phase:

- Define the smallest safe first operational reactivation target.
- Define explicit non-goals.
- Define rollback requirements.
- Define monitoring and stop-condition requirements.
- Define evidence requirements for a future preflight design.
- Define the next planning phase.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No operational execution.
- No operational reactivation.
- No live inspection rerun.
- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command.
- No environment scanning.
- No environment value printing.
- No source code changes.
- No inspection harness changes.
- No API changes.
- No UI changes.
- No schema changes.
- No migration changes.
- No package or lockfile changes.
- No generated type changes.
- No DB mutation.
- No public tools writes.
- No discovered_tools writes.
- No candidate extraction.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.

## Baseline

Phase 25DA starts after Phase 25CZ was committed and pushed:

```text
HEAD=f615722 Document Phase 25CZ reactivation readiness plan
HEAD full=f615722dbf6a0383bf7294e81445c1ecc4224546
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25CZ classified readiness as:

```text
reactivation_readiness_planning_may_begin=true
operational_reactivation_ready=false
operational_reactivation_status=blocked
```

## Planning principle

The first reactivation target must be the narrowest useful operational surface.

The first reactivation target must not include public publishing, candidate decision execution, candidate staging, candidate extraction, crawler execution, LLM execution, or database mutation.

A successful read-only infrastructure inspection proves infrastructure reachability and query compatibility for the inspection harness. It does not prove operational workflow safety.

## Proposed first reactivation target

Phase 25DA proposes the first operational reactivation target as:

```text
target=admin_only_no_write_operational_readiness_preflight
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

This target means a future phase may design a bounded preflight that validates whether existing admin-only Discovery Engine read surfaces can be safely observed without writes.

The first target is deliberately not:

- Candidate extraction.
- Candidate staging.
- Candidate decision execution.
- `approve_for_draft`.
- Public publishing.
- Public `tools` writes.
- `discovered_tools` writes.
- Runtime crawler execution.
- Runtime LLM execution.

## Target boundaries

The future no-write operational readiness preflight must preserve:

- Admin-only scope.
- Read-only behavior.
- No public visitor exposure.
- No DB mutation.
- No public writes.
- No candidate writes.
- No crawler, extraction, or LLM execution.
- No schema or migration changes.
- No environment value printing.
- No secret output.
- Non-secret result package only.

## Rollback model

Because the proposed first target is no-write, rollback must be defined as containment and halt behavior, not data reversal.

A future execution gate must define rollback as:

1. Stop immediately on any unexpected write attempt.
2. Stop immediately on any public-surface exposure.
3. Stop immediately on any candidate pipeline invocation.
4. Stop immediately on any admin API invocation outside the approved target.
5. Stop immediately on any secret-like output.
6. Preserve logs only if non-secret.
7. Copy only a safe result package to clipboard.
8. Do not retry without a new approval gate.
9. Preserve operational block after the run until result review is committed.

If a future phase proposes any write, the rollback model must become stricter and must include exact affected tables, reversal criteria, and recovery owners before execution approval.

## Monitoring requirements

A future preflight design must specify:

- What logs are captured.
- What logs are excluded.
- What non-secret output is expected.
- What constitutes pass, controlled non-pass, and unsafe failure.
- How unexpected routes, writes, public exposure, or secrets are detected.
- How result packages are reviewed before any next step.

## Stop conditions

A future execution gate must stop before or during execution if any of the following occur:

- Branch is not `main`.
- HEAD does not match the expected committed planning or approval gate.
- Working tree is not clean.
- Origin is not the expected repository.
- Required environment names are missing.
- Environment value validation fails.
- Any unapproved `AIFINDER_RUN_DISCOVERY_*` variable is present.
- Any DB mutation path is detected.
- Any public route or public publishing path is invoked.
- Any candidate extraction, staging, decision, or publishing path is invoked.
- Any secret-like output is detected.
- Any raw environment value is printed.
- Any raw row payload is printed when the phase requires aggregate-only output.
- Any unplanned file change appears.

## Required future approval controls

Before any future execution, the sequence must include:

1. A documentation-only preflight design gate.
2. Gemini review and approval.
3. A documentation-only execution approval gate.
4. An exact approval phrase from James.
5. A script bound to the committed approval-gate HEAD and subject.
6. A one-run guard.
7. A non-secret result package.
8. A documentation-only result review gate.

No phase may combine design, approval, execution, and result review.

## Phase 25DB design requirements

Phase 25DB should remain documentation-only.

It should design a no-write operational readiness preflight for the proposed target.

Phase 25DB must identify:

- Exact files, routes, helpers, or admin read surfaces to inspect.
- Exact commands to be used in a future execution gate, if any.
- Exact prohibited paths.
- Expected result shape.
- Secret-handling rules.
- Rollback and halt behavior.
- Required one-run guard behavior.
- Required post-execution review document.

If Phase 25DB cannot identify a safe no-write admin-only target, it must document that operational reactivation remains blocked and recommend additional prerequisites instead.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DA is planning-only.
- The proposed first target has not been designed in detail.
- No preflight design has been approved.
- No execution approval phrase has been defined.
- No execution script has been reviewed.
- No operational execution has been approved.
- No operational execution has occurred.
- No operational result review exists.

## Recommended next phase

Next recommended phase:

```text
Phase 25DB — Operational Reactivation Preflight Design Gate
```

Phase 25DB must remain documentation-only unless explicitly scoped otherwise.

## Phase 25DA conclusion

Phase 25DA defines the first proposed operational reactivation planning target as an admin-only, no-write operational readiness preflight.

This is not operational reactivation.

This is not candidate extraction, staging, decision execution, or public publishing.

No operational workflow is approved.

No database mutation is approved.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DA and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DA remains documentation-only.
- The proposed first target is appropriately limited to an admin-only, no-write operational readiness preflight.
- The target correctly excludes high-risk operations including candidate pipelines, public publishing, LLMs, crawlers, and DB mutation.
- The rollback model correctly treats rollback as containment and halt behavior for a no-write target.
- Stop conditions and rollback rules are robust for this stage.
- Operational reactivation remains blocked.
- Phase 25DB is the correct next no-write preflight design gate.

Phase 25DA is ready for commit after James approval.
