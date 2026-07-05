# AiFinder Discovery Engine — Phase 25S Live-Readiness Risk Review Documentation

## Phase

Phase 25S — Live-Readiness Risk Review Documentation Gate

## Status

Documentation artifact only.

This phase documents the live-readiness risk review planned in Phase 25R. It does not execute a live-readiness inspection and does not reactivate the Discovery Engine.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25R.
- Baseline commit: `289ca1f`
- Baseline subject: `Document Phase 25R live-readiness risk review plan`
- Phase 25R result: live-readiness risk review planning document was pushed to `main`.

## Purpose

Phase 25S converts the Phase 25R planning checklist into a structured risk register and readiness matrix.

The purpose is to decide what must be proven before any future live-readiness inspection can be considered. This phase intentionally stops short of live execution.

## Boundary

Phase 25S is docs-only.

Allowed:

- Create this risk review document.
- Record risk domains, blockers, readiness posture, and future evidence requirements.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.
- Preserve separate future gates for any verifier rerun, commit, push, or live-readiness inspection.

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

## Executive conclusion

The Discovery Engine is not live-ready for operational reactivation.

The repository has regained a stable documentation and static-verification footing, and the configurable verifier is now usable as a repository-local static readiness gate. However, this does not prove live database state, live Supabase permissions, production schema freshness, production route behavior, crawler safety, extraction safety, candidate decision safety, or publication safety.

Before any live-readiness inspection occurs, the project needs a separately approved and narrowly scoped read-only inspection plan. That future plan must define exact tables, exact queries or static commands, exact non-mutation guarantees, exact environment restrictions, and exact success/failure handling.

## Risk register

### Risk 1 — Live database state is unverified

Severity: High

Current posture: Blocked.

The current repository-local verifier does not prove live database state. It confirms static repository structure and guard boundaries, but it does not inspect live Supabase data, table contents, RLS policies, production roles, candidate queues, discovered tool rows, or public tool rows.

Potential impact:

- A future live inspection could rely on stale assumptions.
- Live data could contain legacy rows, inconsistent statuses, or migration-era artifacts.
- Candidate-related tables might not match documentation assumptions.

Required evidence before any future live inspection:

- A docs-only plan listing exact target tables.
- A read-only query inventory with expected row-shape assertions.
- Explicit exclusion of mutation-capable commands.
- Separate approval phrase for read-only live access.
- Failure behavior that halts without retrying or mutating.

Readiness judgment:

Not ready for live read execution.

### Risk 2 — RLS and permission behavior are not proven live

Severity: High

Current posture: Blocked.

Repository-local checks do not prove live Supabase RLS behavior or role-specific permissions. Prior RLS planning and smoke work are important, but they do not substitute for a current, explicitly approved read-only live inspection.

Potential impact:

- Admin/service-role paths could behave differently from assumptions.
- Read-only expectations might be incomplete.
- Mutation-capable paths could exist behind service-role usage if not bounded.

Required evidence before any future live inspection:

- Static inventory of service-role helper usage.
- Clear distinction between anon, authenticated, admin, and service-role behavior.
- Read-only live preflight plan that cannot mutate.
- No secret printing.
- No broad table scanning beyond explicitly approved scope.

Readiness judgment:

Not ready for live permission validation.

### Risk 3 — Admin Discovery API routes include operational surfaces

Severity: High

Current posture: Blocked for invocation.

The repository contains admin Discovery API routes that may include read paths and mutation-capable or operational paths. Phase 25S does not invoke these routes and does not start a local server.

Potential impact:

- A route invocation could trigger crawler, extraction, candidate preview, candidate staging, candidate decision, or publication behavior.
- Even read-like routes may depend on live credentials or live state.
- Local server startup could expose unintended runtime behavior.

Required evidence before any future route-level inspection:

- Static route inventory separating read-only routes from mutation-capable routes.
- Explicit route denylist for live-readiness inspection.
- Explicit no-server-start rule unless separately approved.
- Separate plan for route-level smoke testing, if ever needed.

Readiness judgment:

Not ready for admin API invocation.

### Risk 4 — Candidate decision and publication paths remain high risk

Severity: Critical

Current posture: Blocked.

Candidate decision execution and publication-related paths remain the most sensitive Discovery Engine operations because they can move candidate information toward public-facing tool records.

Potential impact:

- Candidate decisions could approve or reject live rows.
- `approve_for_draft` could affect publication readiness.
- Public `tools` or `discovered_tools` writes could alter production-visible data.

Required evidence before any future candidate/publication work:

- Static inventory of all candidate decision entry points.
- Static inventory of all publication write paths.
- Explicit proof that no live-readiness inspection touches decision endpoints.
- Separate human approval for any future candidate decision smoke.
- Separate mutation gate for any future write path.

Readiness judgment:

Not ready for candidate decision or publication execution.

### Risk 5 — Crawler, extraction, LLM, and evidence acquisition can have external effects

Severity: High

Current posture: Blocked.

Crawler, extraction, LLM, and evidence acquisition flows can create external network calls, token usage, storage artifacts, staging rows, logs, or rate-limit side effects.

Potential impact:

- Unapproved network activity.
- Unexpected token or provider costs.
- Evidence artifacts stored without review.
- Candidate staging from incomplete or unreviewed extraction.

Required evidence before any future operation:

- Static inventory of crawler and extraction entry points.
- Opt-in marker review.
- Explicit network and token usage policy.
- Separate approval phrase for any future external acquisition.
- No automatic retry without approval.

Readiness judgment:

Not ready for crawler, extraction, LLM, or evidence acquisition execution.

### Risk 6 — Environment variable gates must remain fail-closed

Severity: High

Current posture: Mostly controlled, still blocked for live work.

The current workflow relies on explicit opt-in environment variables for potentially operational discovery scripts. Phase 25S keeps all `AIFINDER_RUN_DISCOVERY_*` variables unset.

Potential impact:

- A stale shell environment could accidentally opt into an operational path.
- A script could bypass expected opt-in guards.
- Secrets could be printed in logs if a future inspection is careless.

Required evidence before any future live-readiness inspection:

- Explicit preflight that fails if any `AIFINDER_RUN_DISCOVERY_*` variable is unexpectedly set.
- Explicit instruction not to print secret values.
- Static grep inventory of opt-in markers.
- Separate future approval for setting any operational opt-in variable.

Readiness judgment:

Static guard posture is improving, but live work remains blocked.

### Risk 7 — Configurable verifier proves static readiness only

Severity: Medium

Current posture: Stable for static repository-local verification.

Phase 25P and Phase 25Q proved the verifier can run with explicit expected HEAD and subject metadata. This makes the verifier useful as a reusable static readiness gate.

Potential impact:

- Over-trusting the verifier could create false confidence.
- Passing static checks does not prove live permissions, live data, route behavior, or operational safety.

Required evidence before broader reliance:

- Document exactly what the verifier proves and does not prove.
- Keep future verifier reruns separate from documentation, commit, and push gates.
- Require explicit expected HEAD and subject flags for reruns.
- Treat verifier output as a prerequisite, not as live-readiness proof.

Readiness judgment:

Ready for static gate reuse only.

### Risk 8 — Phase bundling could weaken governance

Severity: Medium

Current posture: Controlled.

The recent sequence preserved separate planning, execution, review, local commit, and push gates. Tooling failures were recovered without bundling unsafe work.

Potential impact:

- Combining documentation, execution, commit, and push could hide boundary violations.
- Recoveries could accidentally skip scope checks.
- Operational steps could happen without a clear human approval phrase.

Required evidence before future phases:

- Continue separate scripts for phase work, Gemini review, local commit, and push.
- Use exact approval phrases for operational or push actions.
- Preserve clipboard result packages.
- Preserve failure logs.
- Preserve original exit codes.

Readiness judgment:

Governance is stable and should continue unchanged.

## Readiness matrix

| Domain | Current status | Live-ready? | Required next evidence |
| --- | --- | --- | --- |
| Repository-local static verification | Stable after Phase 25P and Phase 25Q | Partially | Reuse verifier only as static prerequisite |
| Documentation continuity | Stable through Phase 25R | Yes for planning | Continue docs-only review |
| Live DB state | Unverified | No | Separate read-only live inspection plan |
| RLS and permissions | Not currently proven live | No | Static service-role inventory, then approved read-only preflight |
| Admin API route behavior | Static risk only | No | Route inventory and denylist |
| Candidate decision | Blocked | No | Separate candidate decision safety plan |
| Public publishing | Blocked | No | Separate publication safety plan |
| Crawler/extraction/LLM/evidence | Blocked | No | Separate external-effect risk plan |
| Environment opt-in guards | Improving | No for live execution | Explicit fail-closed preflight |
| Commit/push discipline | Stable | Yes for governance | Continue separate gates |

## Hard blockers before any live-readiness inspection

A future live-readiness inspection must not proceed until all of the following exist:

1. A docs-only plan naming the exact live-read scope.
2. A table allowlist and table denylist.
3. A command allowlist.
4. A mutation denylist.
5. A no-server-start rule, unless server startup is explicitly approved in a separate phase.
6. A no-admin-API-invocation rule, unless a specific route is explicitly approved in a separate phase.
7. A no-crawler, no-extraction, no-LLM, no-evidence-acquisition rule.
8. A no-candidate-decision and no-publication rule.
9. A preflight proving no `AIFINDER_RUN_DISCOVERY_*` variables are set unless deliberately required by that future phase.
10. A no-secret-printing rule.
11. A failure plan that halts on ambiguity.
12. A Gemini review package before execution.
13. Explicit James approval before execution.
14. A separate execution script.
15. Separate local commit and push gates for any resulting documentation.

## Safe next phase recommendation

Preferred next phase:

Phase 25T — Read-Only Live Inspection Scope Planning Gate

Scope:

- Docs-only.
- Define whether a future read-only live inspection is appropriate.
- If appropriate, define exact allowed tables, exact denied tables, exact allowed command shape, and exact forbidden operations.
- No live DB reads.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No source changes.
- No migration/typegen/package changes.
- No operational execution.

Alternative next phase:

Phase 25T-alt — Static Admin Discovery Surface Inventory Gate

Scope:

- Repository-local static inventory only.
- Inventory admin Discovery API routes, scripts, helpers, and opt-in markers.
- No live execution.
- No commit bundled with inspection.
- No operational reactivation.

## Required Gemini review questions

1. Does Phase 25S accurately convert the Phase 25R planning checklist into a live-readiness risk register?
2. Are the severity judgments and blocked/readiness conclusions appropriate?
3. Does Phase 25S correctly avoid claiming live readiness from the static verifier?
4. Does Phase 25S keep all DB/API/crawler/extraction/candidate/publication operations blocked?
5. Is the recommended Phase 25T read-only live inspection scope planning gate safe as a docs-only continuation?
6. Are any hard blockers missing before AiFinder considers a future read-only live inspection?

## Phase 25S conclusion

Phase 25S confirms that AiFinder Discovery Engine is stable for documentation-first reentry and static repository-local verification, but not ready for operational reactivation.

The next safe step is not a live read. The next safe step is a docs-only scope plan for whether a future live-readiness inspection should exist, and what exact limits it would need.

Operational reactivation remains blocked.
