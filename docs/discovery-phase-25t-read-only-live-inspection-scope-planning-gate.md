# AiFinder Discovery Engine — Phase 25T Read-Only Live Inspection Scope Planning Gate

## Phase

Phase 25T — Read-Only Live Inspection Scope Planning Gate

## Status

Planning artifact only.

This phase defines the scope for a possible future read-only live inspection. It does not perform the live inspection and does not reactivate the Discovery Engine.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25S.
- Baseline commit: `6afc3eb`
- Baseline subject: `Document Phase 25S live-readiness risk review`
- Phase 25S result: live-readiness risk review documentation was pushed to `main`.

## Purpose

Phase 25S concluded that the Discovery Engine is stable for documentation-first reentry and repository-local static verification, but not ready for operational reactivation.

Phase 25T narrows the next question:

What would a safe, read-only live inspection be allowed to inspect, and what must remain blocked?

Phase 25T answers that question as a planning document only. It does not run live database queries, inspect Supabase directly, invoke admin APIs, start a local server, run the verifier, run crawler or extraction flows, stage candidates, execute candidate decisions, or write public data.

## Boundary

Phase 25T is docs-only.

Allowed:

- Create this scope planning document.
- Define future read-only inspection goals.
- Define proposed table allowlist and table denylist.
- Define proposed command shape and output limits for a later phase.
- Define explicit mutation and operational denylist.
- Define future success, failure, and halt conditions.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.
- Keep future execution, local commit, and push as separate gates.

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

## Proposed future inspection objective

A future execution phase may be considered only if it remains read-only and answers limited readiness questions:

1. Does the expected live Discovery Engine table set exist?
2. Are row counts and status distributions safe to inspect without exposing secrets or sensitive content?
3. Are candidate/publication tables in a safe state before any later operational planning?
4. Are there obvious blockers that require more documentation before any reactivation work?

The future inspection must not evaluate, mutate, approve, reject, stage, publish, crawl, extract, or acquire evidence.

## Proposed future table allowlist

The following table names are candidates for a later read-only inspection plan. They are proposed for planning only and are not approved for live access by this phase.

### Candidate allowlist for metadata and counts only

| Table | Proposed read-only purpose | Permitted future output shape |
| --- | --- | --- |
| `public.discovery_sources` | Confirm source inventory exists and count source statuses | Counts by status/type only |
| `public.discovery_runs` | Confirm run history exists and count recent run statuses | Counts by status and latest timestamps only |
| `public.discovery_candidate_tools` | Confirm candidate staging queue size and status distribution | Counts by candidate status only |
| `public.discovered_tools` | Confirm discovered-tool legacy/current staging surface size if table exists | Counts only |
| `public.tools` | Confirm public tool table count for before/after safety baseline | Count only |

### Restrictions on allowlisted tables

A future read-only inspection must not print full row contents by default.

A future read-only inspection must not print secrets, credentials, API keys, auth tokens, service-role values, private user identifiers, raw HTML evidence, LLM prompts, LLM completions, large descriptions, or full URLs unless separately justified and approved.

A future read-only inspection should prefer aggregate outputs such as:

- total count
- count by status
- latest created timestamp
- latest updated timestamp
- null/non-null count for key readiness fields
- limited schema metadata if available through safe local or read-only mechanisms

## Proposed future table denylist

The following are denied unless a later phase explicitly expands scope after Gemini review and James approval:

| Table or surface | Reason denied |
| --- | --- |
| Auth/user identity tables | Not needed for Discovery Engine readiness |
| Secret/config tables | Risk of credential exposure |
| Storage object contents | Could expose raw evidence or screenshots |
| Full candidate rows | Could expose unreviewed extracted content |
| Full public tool rows | Not needed for initial safety baseline |
| Audit log full payloads | Could expose operational details or sensitive metadata |
| Any table outside the explicit allowlist | Avoid scope creep |

## Proposed future command shape

A future read-only live inspection, if approved, should use one dedicated terminal script with an explicit opt-in approval phrase.

The command shape should be designed before execution and should include these properties:

- Runs from the AiFinder repo root.
- Verifies repo remote, branch, HEAD, origin sync, and clean working tree.
- Fails if unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Uses a read-only query mechanism only.
- Uses a table allowlist.
- Produces aggregate-only output.
- Writes a result package and raw log.
- Copies the result package to clipboard on success.
- Copies the raw failure log to clipboard on failure.
- Preserves the original exit code.
- Does not retry failed live reads.
- Does not stage files.
- Does not commit.
- Does not push.

## Explicitly forbidden future command shapes

A future read-only live inspection must not use commands that:

- run migrations
- push schema
- generate types
- install packages
- start a local server
- invoke app routes through HTTP
- invoke admin APIs
- run crawler scripts
- run extraction scripts
- run LLM flows
- acquire evidence
- stage candidates
- execute candidate decisions
- set `approve_for_draft`
- write to public `tools`
- write to `discovered_tools`
- update candidate rows
- delete rows
- upsert rows
- truncate rows
- call mutation RPCs
- print secrets
- perform broad `select *` output

## Required future preflight checks

A future read-only live inspection script must verify all of the following before any live read:

1. Repo remote is `https://github.com/jcdumaua/aifinder.git`.
2. Branch is `main`.
3. HEAD and subject match the expected pushed planning baseline.
4. `origin/main` matches the expected baseline.
5. Branch is ahead `0`, behind `0`.
6. Working tree is clean.
7. No files are staged.
8. No `AIFINDER_RUN_DISCOVERY_*` variables are unexpectedly set.
9. Required local environment variables are present by name only, without printing values.
10. The query list is hardcoded, bounded, and aggregate-only.
11. The table allowlist is hardcoded.
12. The mutation denylist is hardcoded.
13. Failure mode is halt-only.
14. No retry loop exists.
15. No output includes full row dumps.

## Proposed future query categories

The exact query implementation is not approved by Phase 25T, but a later planning phase may propose aggregate-only checks such as:

### Category A — Table availability

Purpose:

Confirm that the expected Discovery Engine tables are reachable with the selected read-only mechanism.

Allowed output:

- table name
- availability status
- error class if unavailable

Denied output:

- full rows
- secrets
- credentials
- connection strings

### Category B — Row counts

Purpose:

Establish a live baseline without modifying data.

Allowed output:

- table name
- total row count

Denied output:

- row contents
- raw evidence
- full URLs
- prompts/completions

### Category C — Status distributions

Purpose:

Identify whether candidate/run/source statuses look plausible.

Allowed output:

- status value
- count

Denied output:

- candidate names
- descriptions
- raw payloads
- full records

### Category D — Timestamp recency

Purpose:

Understand whether the live Discovery Engine has stale or recent activity.

Allowed output:

- latest created timestamp
- latest updated timestamp
- latest run timestamp

Denied output:

- full run payload
- logs
- evidence content

## Success criteria for a future execution phase

A future read-only live inspection execution can be considered successful only if:

- The approved script runs exactly once.
- It performs only the approved aggregate read-only checks.
- It produces no mutation.
- It does not invoke admin APIs.
- It does not start a local server.
- It does not execute crawler, extraction, LLM, evidence acquisition, staging, candidate decision, or publication paths.
- It does not print secrets.
- It leaves the working tree clean.
- It leaves branch sync unchanged.
- It produces a clear result package.
- It identifies blockers instead of trying to fix them.

## Failure criteria for a future execution phase

A future read-only live inspection must fail closed if:

- The repo, branch, HEAD, or origin state does not match.
- The working tree is dirty.
- Unexpected opt-in environment variables are set.
- Required environment variable names are missing.
- A query attempts to read outside the allowlist.
- A query attempts mutation.
- A query requests full rows or broad `select *` output.
- A command would start a server or invoke an API route.
- Any secret value would be printed.
- Any live read returns an ambiguous error.
- Any result suggests schema or permission mismatch.

No automatic retry should occur.

## Required future result documentation

If a future read-only live inspection is eventually approved and executed, the result must be documented in a separate phase.

That result documentation must include:

- exact approval phrase
- exact command executed
- exit code
- repo baseline
- table allowlist used
- query categories used
- aggregate output summary
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- blockers found
- recommendation for next safe phase

## Recommended next phase

Preferred next phase:

Phase 25U — Read-Only Live Inspection Execution Plan

Scope:

- Docs-only.
- Convert this scope plan into one exact future execution contract.
- Define the exact future script name.
- Define the exact future approval phrase.
- Define exact environment variable name checks without printing secret values.
- Define exact aggregate query list.
- Define exact output format.
- Define exact halt conditions.
- No live DB reads.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No source changes.
- No migration/typegen/package changes.
- No operational execution.

Alternative next phase:

Phase 25U-alt — Static Admin Discovery Surface Inventory

Scope:

- Repository-local static inspection only.
- Inventory admin Discovery API routes, scripts, helpers, and opt-in markers.
- No live execution.
- No DB/API/crawler/extraction/candidate/publication operations.

## Required Gemini review questions

1. Does Phase 25T correctly remain a docs-only scope planning gate with no live inspection?
2. Is the proposed future table allowlist narrow enough for an initial read-only live inspection?
3. Is the proposed denylist complete enough to prevent scope creep?
4. Are the proposed future command-shape restrictions sufficient to prevent mutation, API invocation, server startup, crawler, extraction, candidate decision, and publication activity?
5. Are the success and failure criteria strict enough for a future read-only live inspection?
6. Is the recommended Phase 25U execution plan safe as a docs-only continuation?
7. Should Phase 25U proceed as execution-plan documentation, or should AiFinder first run a static admin Discovery surface inventory?

## Phase 25T conclusion

Phase 25T defines a narrow scope for a possible future read-only live inspection, but does not approve or execute that inspection.

The Discovery Engine remains operationally blocked.

The next safe step is another docs-only phase that either converts this scope into an exact execution plan or inventories static admin Discovery surfaces before any live read is considered.
