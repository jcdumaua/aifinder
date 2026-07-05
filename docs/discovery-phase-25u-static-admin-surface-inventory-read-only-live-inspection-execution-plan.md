# AiFinder Discovery Engine — Phase 25U Static Admin Surface Inventory and Read-Only Live Inspection Execution Plan

## Phase

Phase 25U — Static Admin Discovery Surface Inventory and Read-Only Live Inspection Execution Plan

## Status

Documentation artifact only.

This phase combines the Gemini-recommended hybrid approach after Phase 25T:

1. Static Admin Discovery surface inventory.
2. Read-only live inspection execution plan.

It does not implement a live probe script and does not execute any live inspection.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25T.
- Baseline commit: `9a3fd29`
- Baseline subject: `Document Phase 25T read-only live inspection scope plan`
- Phase 25T result: read-only live inspection scope planning document was pushed to `main`.

## Purpose

Phase 25T defined a possible future read-only live inspection scope. Gemini recommended that Phase 25U proceed as a documentation gate that also includes static admin Discovery surface inventory as an appendix.

Phase 25U therefore documents the exact execution contract for a future live-readiness read-only inspection while also recording the static repo surfaces that must remain blocked or explicitly classified before execution.

## Boundary

Phase 25U is docs-only.

Allowed:

- Create this documentation file.
- Include static inventory of repository-local route, script, helper, and opt-in marker names.
- Define the future read-only live inspection execution contract.
- Define the future approval phrase.
- Define exact non-mutation rules.
- Define future environment variable name checks without printing secret values.
- Define output limits and halt conditions.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No live inspection.
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

## Static Admin Discovery surface inventory

This inventory is repository-local static documentation only. It does not invoke routes, start the application, query the database, run tests, execute scripts, or inspect secrets.

### Admin Discovery API route files

```text
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
```

Inventory posture:

- Route files are static surface area only.
- No route is approved for invocation by Phase 25U.
- Any future route-level inspection requires a separate phase.
- Any route that can mutate, trigger extraction, trigger candidate decisions, or publish data remains blocked.

### Discovery testing and utility scripts

```text
testing/discovery-bounded-html-acquisition.test.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
testing/discovery-candidate-decision-execution-preflight.mjs
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-extraction-mapper.test.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-normalizer.test.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-preview-route.test.mjs
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
testing/discovery-candidate-queue-fail-closed-presentation-smoke.mjs
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
testing/discovery-fetch-adapter.test.mjs
testing/discovery-manual-metadata-fetch.test.mjs
testing/discovery-other-bucket-bounded-read-only-inspection.mjs
testing/discovery-read-only-runtime-verification.mjs
testing/discovery-request-plan.test.mjs
testing/discovery-run-results-review.test.mjs
testing/discovery-static-html-evidence-audit-review.test.mjs
testing/discovery-static-html-evidence-executor.test.mjs
testing/discovery-static-html-evidence-results-review.test.mjs
testing/discovery-static-html-evidence.test.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
testing/discovery-url-safety.test.mjs
```

Inventory posture:

- Existing scripts are static inventory only.
- No script is executed by Phase 25U except ordinary repository-local `npm run check`.
- Any future live-readiness inspection must use a newly reviewed, dedicated, read-only execution script.
- Any existing script with mutation, crawler, extraction, candidate staging, candidate decision, or publication capability remains blocked.

### Discovery helper files

```text
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-decision-validation.ts
lib/discovery/discovery-candidate-extraction-invocation.ts
lib/discovery/discovery-candidate-extraction-mapper.ts
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts
lib/discovery/discovery-candidate-preview-live-staging-resolver.ts
lib/discovery/discovery-candidate-preview-provider.ts
lib/discovery/discovery-candidate-queue-fail-closed-presentation.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
lib/discovery/discovery-supabase-admin.ts
```

Inventory posture:

- Helper files are static surface area only.
- No helper behavior is invoked by Phase 25U.
- Any future live inspection must not import application helpers if doing so could trigger side effects, runtime configuration loading, or mutation-capable clients.

### Discovery opt-in marker inventory

```text
AIFINDER_RUN_DISCOVERY_
AIFINDER_RUN_DISCOVERY_CANDIDATE_DECISION_API_SMOKE
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_LIVE_SMOKE
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE
AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE
AIFINDER_RUN_DISCOVERY_OTHER_BUCKET_BOUNDED_READ_ONLY_INSPECTION
```

Inventory posture:

- These markers identify sensitive discovery execution paths.
- Phase 25U requires all `AIFINDER_RUN_DISCOVERY_*` variables to remain unset.
- A future read-only live inspection should fail if any unrelated `AIFINDER_RUN_DISCOVERY_*` variable is set.
- A future read-only live inspection should avoid using existing operational opt-in markers and should instead use a new, narrowly named read-only approval marker only if needed.

## Future execution plan

### Proposed future phase

Phase 25V — Read-Only Live Inspection Script Implementation Planning Gate

Recommended scope:

- Docs-only or implementation-planning only, depending on Gemini review.
- Define the exact script filename.
- Define exact aggregate query list.
- Define exact output format.
- Define exact required environment variable names without printing values.
- Define exact failure handling.
- No live DB reads.
- No script implementation unless separately approved.
- No execution.

### Proposed future execution script name

```text
testing/discovery-read-only-live-inspection.mjs
```

This name is proposed only. Phase 25U does not create this script.

### Proposed future approval phrase

```text
Approve run Phase 25W read-only live inspection.
```

This phrase is proposed only. Phase 25U does not authorize execution.

### Proposed future command

```bash
node testing/discovery-read-only-live-inspection.mjs \
  --expected-head <approved-pushed-head> \
  --expected-subject "<approved-pushed-subject>" \
  --mode aggregate-only
```

This command is proposed only. Phase 25U does not run it.

## Future environment variable policy

A future read-only live inspection may need environment variables for Supabase connectivity, but must treat them as secrets.

### Required rules

- Check variable names only.
- Never print variable values.
- Never print derived credentials.
- Never print connection strings.
- Never print service role keys.
- Fail if required variable names are absent.
- Fail if unrelated `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Prefer a dedicated read-only inspection guard name if an opt-in guard is required.
- Do not reuse mutation-capable smoke-test opt-ins.

### Candidate future variable-name checks

The exact names must be confirmed in the future planning phase. Candidate names may include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or the project’s existing server-side Supabase key name
- a future dedicated read-only guard such as `AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION`

No value may be printed.

## Future aggregate-only query contract

A future execution script may only produce aggregate outputs.

Allowed output categories:

- table availability status
- total row counts
- counts by status
- latest created timestamp
- latest updated timestamp
- null/non-null readiness counts for explicitly approved fields
- error class without secret details

Denied output categories:

- full rows
- raw evidence
- raw HTML
- screenshots
- LLM prompts
- LLM completions
- full candidate descriptions
- full public tool records
- full URLs unless separately approved
- secrets
- tokens
- connection strings
- auth identifiers
- broad `select *` output

## Future table allowlist

The future execution plan should remain limited to metadata and aggregate counts for the following proposed tables:

| Table | Future purpose | Output limit |
| --- | --- | --- |
| `public.discovery_sources` | Source inventory status baseline | Counts only |
| `public.discovery_runs` | Run history status baseline | Counts and latest timestamps only |
| `public.discovery_candidate_tools` | Candidate queue status baseline | Counts by status only |
| `public.discovered_tools` | Legacy/current discovered-tool surface baseline | Counts only |
| `public.tools` | Public tools before/after safety baseline | Count only |

Any table not listed above is denied by default.

## Future operation denylist

The future read-only live inspection must not:

- insert rows
- update rows
- delete rows
- upsert rows
- truncate rows
- call mutation RPCs
- apply migrations
- generate types
- install packages
- start a local server
- invoke HTTP routes
- invoke admin APIs
- run crawler scripts
- run extraction scripts
- run LLM flows
- acquire evidence
- stage candidates
- execute candidate decisions
- set `approve_for_draft`
- publish tools
- write to `discovered_tools`
- print secrets
- retry after ambiguous live errors

## Future fail-closed behavior

The future script must halt before any live read if:

1. Repo remote does not match the expected AiFinder GitHub remote.
2. Branch is not `main`.
3. HEAD does not match the expected pushed execution baseline.
4. `origin/main` does not match the expected baseline.
5. Branch is ahead or behind.
6. Working tree is dirty.
7. Files are staged.
8. Unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
9. Required environment variable names are absent.
10. Any query is outside the allowlist.
11. Any query asks for full rows.
12. Any command path would mutate data.
13. Any command path would invoke API routes or start a local server.
14. Any secret value would be printed.
15. Any live read returns ambiguous permission, schema, or network behavior.

No automatic retry should occur.

## Future success criteria

The future live inspection execution can be considered successful only if:

- It is explicitly approved by James.
- It uses the exact approved command.
- It runs exactly once.
- It reads only approved aggregate metadata.
- It prints no secrets.
- It mutates nothing.
- It does not invoke admin APIs.
- It does not start a local server.
- It does not run crawler, extraction, LLM, evidence acquisition, staging, candidate decision, or publishing flows.
- It leaves the working tree clean.
- It leaves branch sync unchanged.
- It produces a result package.
- It copies the result package to clipboard.
- It preserves raw failure logs if it fails.

## Future result documentation requirements

A later result documentation phase must include:

- exact approval phrase
- exact command
- exit code
- repo baseline
- environment variable names checked, without values
- table allowlist used
- aggregate output summary
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- blockers found
- recommendation for next safe phase

## Readiness judgment

Phase 25U does not make the Discovery Engine live-ready.

It improves readiness by converting Phase 25T’s scope plan into a stricter execution contract and recording the static admin Discovery surface inventory.

The Discovery Engine remains operationally blocked.

## Recommended next phase

Preferred next phase:

Phase 25V — Read-Only Live Inspection Script Implementation Planning Gate

Scope:

- Docs-only planning gate.
- Define the exact future implementation of `testing/discovery-read-only-live-inspection.mjs`.
- Define query implementation details without writing the script.
- Define expected output fixture shape.
- Define all fail-closed checks.
- Define exact Gemini review questions for implementation approval.
- No live DB reads.
- No script implementation.
- No admin API invocation.
- No local server startup.
- No verifier rerun.
- No operational execution.

Alternative next phase:

Phase 25V-alt — Read-Only Live Inspection Script Implementation Gate

Scope:

- Implement only the dedicated read-only inspection script.
- Do not execute it.
- Do not commit without Gemini review.
- No live DB reads.
- No DB mutation.
- No app/source route changes.
- No package changes.

Preferred recommendation: use the planning gate first.

## Required Gemini review questions

1. Does Phase 25U correctly implement the hybrid recommendation by combining static admin Discovery surface inventory with execution-plan documentation?
2. Does Phase 25U remain docs-only with no live inspection, no script implementation, and no operational reactivation?
3. Is the static surface inventory useful and safely bounded as repository-local documentation only?
4. Are the future environment variable rules strict enough, especially around secret-value non-disclosure?
5. Is the proposed aggregate-only output contract narrow enough for a first live-readiness inspection?
6. Are the fail-closed conditions strict enough before any future live read?
7. Should Phase 25V proceed as a docs-only implementation planning gate before any script is written?

## Phase 25U conclusion

Phase 25U creates a static admin Discovery surface inventory and an execution-plan contract for a future read-only live inspection.

It does not approve, implement, or execute that inspection.

The next safe step is another documentation gate that plans the exact implementation of the future read-only live inspection script before any code is written.
