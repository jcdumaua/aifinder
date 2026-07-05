# AiFinder Discovery Engine — Phase 25V Read-Only Live Inspection Script Implementation Planning Gate

## Phase

Phase 25V — Read-Only Live Inspection Script Implementation Planning Gate

## Status

Planning artifact only.

This phase defines the exact implementation contract for the future read-only live inspection script. It does not implement the script and does not execute any live inspection.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25U.
- Baseline commit: `6f6b160`
- Baseline subject: `Document Phase 25U static admin surface execution plan`
- Phase 25U result: static admin Discovery surface inventory and execution-plan documentation was committed and pushed to `main`.

## Purpose

Phase 25U documented the hybrid static inventory and execution contract for a future read-only live inspection.

Phase 25V narrows that contract into an implementation plan for a future dedicated script. The script is still not created in this phase.

The purpose is to define exactly what the future script must do, what it must not do, how it must fail closed, and what output it may produce.

## Boundary

Phase 25V is docs-only.

Allowed:

- Create this implementation planning document.
- Define the future script filename.
- Define the future CLI arguments.
- Define the future environment variable name checks.
- Define aggregate-only query categories.
- Define fail-closed preflight sequence.
- Define result package format.
- Define Gemini implementation review questions.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No script implementation.
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

## Future script identity

Proposed future file:

```text
testing/discovery-read-only-live-inspection.mjs
```

Phase 25V does not create this file.

## Future execution phase

Proposed future implementation phase:

```text
Phase 25W — Read-Only Live Inspection Script Implementation Gate
```

Proposed future execution phase after implementation and review:

```text
Phase 25Y — Read-Only Live Inspection Execution Gate
```

The future script must be implemented in one gate, reviewed by Gemini, then committed and pushed using the approved commit-then-push workflow. Execution must remain a separate later gate after explicit James approval.

## Future approval phrase for execution

The future execution approval phrase should be:

```text
Approve run Phase 25Y read-only live inspection.
```

This phrase is documented for future use only. Phase 25V does not authorize execution.

## Future implementation constraints

The future script must be a standalone Node.js script that:

- Runs from the repository root.
- Uses only existing project dependencies.
- Does not require package installation.
- Does not modify package files.
- Does not import app route handlers.
- Does not start Next.js.
- Does not invoke HTTP endpoints.
- Does not call admin APIs.
- Does not run crawler or extraction code.
- Does not stage candidates.
- Does not execute candidate decisions.
- Does not write to public data.
- Does not import helpers that create mutation-capable side effects unless the import is proven safe and reviewed.

Preferred posture:

- Keep the future script self-contained.
- Use direct Supabase client creation only if necessary.
- Keep all queries hardcoded and aggregate-only.
- Avoid application helper imports unless they are purely configuration-safe.

## Future CLI contract

The future script should require explicit CLI flags:

```text
--expected-head <short-or-full-commit>
--expected-subject "<expected commit subject>"
--mode aggregate-only
```

Optional future flag:

```text
--max-output-lines <number>
```

The script must fail if:

- `--expected-head` is missing.
- `--expected-subject` is missing.
- `--mode aggregate-only` is missing or different.
- Unknown flags are provided.
- Expected git metadata does not match actual local state.

## Future preflight sequence

The future script must perform preflight checks before any live read.

Required order:

1. Print boundary statement.
2. Verify CLI arguments.
3. Verify current working directory is the AiFinder repo.
4. Verify remote origin is `https://github.com/jcdumaua/aifinder.git`.
5. Verify branch is `main`.
6. Verify actual HEAD matches `--expected-head`.
7. Verify actual HEAD subject matches `--expected-subject`.
8. Fetch or inspect `origin/main` safely.
9. Verify branch is ahead `0`, behind `0`.
10. Verify working tree is clean.
11. Verify no files are staged.
12. Verify no unrelated `AIFINDER_RUN_DISCOVERY_*` environment variables are set.
13. Verify required Supabase environment variable names are present without printing values.
14. Verify hardcoded table allowlist.
15. Verify hardcoded query list is aggregate-only.
16. Verify no query contains mutation keywords.
17. Verify no query requests broad row output.
18. Only then perform approved read-only aggregate checks.

If any preflight check fails, the script must halt before live reads.

## Future environment variable contract

Required rules:

- Print variable names only.
- Never print variable values.
- Never print secrets.
- Never print connection strings.
- Never print service-role keys.
- Never print derived credentials.
- Fail if required variable names are absent.
- Fail if unrelated `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Use one future dedicated guard only if Gemini approves it.

Candidate required variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Candidate dedicated guard name, if required:

```text
AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION
```

The future implementation plan must confirm exact names before coding.

## Future query allowlist

The future script may only perform aggregate read-only checks for approved tables.

Allowed tables:

```text
public.discovery_sources
public.discovery_runs
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

Allowed query categories:

```text
table availability
total count
count by status
latest created timestamp
latest updated timestamp
null/non-null readiness count for explicitly approved fields
```

Denied by default:

```text
select *
full rows
raw evidence
raw HTML
screenshots
LLM prompts
LLM completions
candidate descriptions
full URLs
secrets
tokens
connection strings
auth identifiers
mutation RPCs
```

## Future mutation denylist

The future script must reject or avoid any operation containing or implying:

```text
insert
update
delete
upsert
truncate
merge
alter
drop
create
grant
revoke
rpc mutation
schema push
migration apply
type generation
storage write
candidate staging
candidate decision
approve_for_draft
public tools write
discovered_tools write
crawler execution
extraction execution
LLM execution
evidence acquisition
admin API invocation
local server startup
```

## Future output contract

The future output must include:

- tool identity
- operational mode
- repo identity result
- branch result
- expected HEAD result
- expected subject result
- branch sync result
- working tree result
- environment variable name presence result without values
- table allowlist
- query category list
- aggregate-only result summary
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- exit code
- result package path
- raw log path

The future output must not include:

- secrets
- raw credentials
- service keys
- connection strings
- full row dumps
- raw evidence
- unreviewed candidate content
- raw tool descriptions
- full URLs unless separately approved

## Future wrapper script requirements

The eventual execution wrapper should be generated as a downloadable `.sh` file and must:

- Use a `main` function.
- Tee logs to `/tmp/aifinder-phase-25y-read-only-live-inspection-<timestamp>.log`.
- Capture `PIPESTATUS[0]`.
- Copy the result package to clipboard on success.
- Copy the raw failure log to clipboard on failure.
- Preserve the original exit code.
- Print clear `PASSED` or `FAILED` lines.
- Print a Discovery Engine progress report on success.
- Run the Node script exactly once.
- Avoid retrying live reads.
- Avoid commit or push.

## Future implementation review checklist

Before the future script can be committed, Gemini must review:

1. Script file scope is exactly `testing/discovery-read-only-live-inspection.mjs`.
2. Script is read-only by construction.
3. Script does not import mutation-capable app route handlers.
4. Script does not start a local server.
5. Script does not invoke admin APIs.
6. Script does not run crawler, extraction, LLM, evidence, staging, candidate decision, or publishing flows.
7. Script uses aggregate-only queries.
8. Script has a hardcoded table allowlist.
9. Script blocks broad row dumps.
10. Script never prints secret values.
11. Script fails closed before live reads if preflight fails.
12. Script has no retry loop.
13. Script has no package or lockfile changes.
14. Script has no schema, migration, or typegen changes.
15. Script has clear `PASSED` and `FAILED` output.

## Future implementation phase recommendation

Preferred next phase:

Phase 25W — Read-Only Live Inspection Script Implementation Gate

Scope:

- Implement only `testing/discovery-read-only-live-inspection.mjs`.
- Do not execute the script.
- Do not perform live DB reads.
- Do not modify source app/API/UI/helper files.
- Do not modify schema/migrations/typegen/package/lockfile files.
- Run syntax/static checks only.
- Prepare Gemini review package.
- Commit and push only after Gemini approval using the combined commit-then-push workflow.

Alternative next phase:

Phase 25W-alt — Additional Implementation Planning Review

Scope:

- Docs-only.
- Further refine exact Supabase environment variable names and aggregate query syntax.
- No code.
- No live reads.

Preferred recommendation: proceed to Phase 25W implementation only if Gemini approves this Phase 25V plan.

## Required Gemini review questions

1. Does Phase 25V correctly remain docs-only with no script implementation and no live inspection?
2. Is the proposed future script identity and CLI contract strict enough?
3. Is the preflight sequence complete enough to fail closed before any live read?
4. Are the environment variable secrecy rules sufficient?
5. Is the aggregate-only query contract narrow enough for a first implementation?
6. Are the implementation constraints strong enough to avoid admin API invocation, server startup, crawler, extraction, candidate decision, and publication activity?
7. Is it safe to proceed to Phase 25W script implementation after James approval, with no execution?

## Phase 25V conclusion

Phase 25V defines the future implementation contract for the read-only live inspection script.

It does not implement that script and does not execute any live inspection.

The Discovery Engine remains operationally blocked.

The next safe step, if Gemini approves, is a narrow implementation-only gate that creates the future read-only inspection script without running it.
