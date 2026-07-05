# AiFinder Discovery Engine — Phase 25X Read-Only Live Inspection Pre-Flight Approval Parameters Gate

## Phase

Phase 25X — Read-Only Live Inspection Pre-Flight Approval Parameters Gate

## Status

Documentation artifact only.

This phase defines the approval parameters for a future execution of the narrowed read-only live inspection script.

It does not execute the script.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25W.
- Baseline commit: `fc0ad21`
- Baseline subject: `Add narrowed read-only live inspection script`
- Phase 25W result: the narrowed infrastructure-only read-only live inspection script was committed and pushed to `main`.

## Implemented script

```text
testing/discovery-read-only-live-inspection.mjs
```

## Implemented first-probe allowlist

```text
public.discovery_sources
public.discovery_runs
```

## Explicitly excluded from first live probe

```text
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

## Purpose

Phase 25W implemented the narrowed read-only live inspection script without executing it.

Phase 25X documents the exact approval parameters that must exist before any future execution gate can run the script.

The purpose is to prevent accidental operational reactivation by separating:

1. Script implementation.
2. Pre-flight approval parameter documentation.
3. Explicit future execution approval.
4. Execution result documentation.

## Boundary

Phase 25X is docs-only.

Allowed:

- Create this documentation file.
- Define the future execution approval phrase.
- Define the future execution command shape.
- Define the required environment variable names without values.
- Define the required guard variable name and required guard value.
- Define the expected future baseline policy.
- Define result-package requirements.
- Define halt conditions.
- Run repository-local static checks such as `npm run check`.
- Prepare a Gemini review package.

Not allowed:

- No script execution.
- No live inspection.
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

## Future execution phase

Recommended future execution phase:

```text
Phase 25Y — Read-Only Live Infrastructure Inspection Execution Gate
```

Phase 25Y must remain separate from this documentation gate.

## Future execution approval phrase

The exact future approval phrase should be:

```text
Approve run Phase 25Y read-only live infrastructure inspection.
```

No other wording should authorize execution.

## Future execution command shape

The future execution wrapper should run the Node script exactly once with this shape:

```bash
AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1 \
node testing/discovery-read-only-live-inspection.mjs \
  --expected-head <approved-pushed-head> \
  --expected-subject "<approved-pushed-subject>" \
  --mode aggregate-only
```

The `<approved-pushed-head>` and `<approved-pushed-subject>` values must match the latest pushed execution baseline at the time Phase 25Y is approved.

If Phase 25X is committed before Phase 25Y, then Phase 25Y should use the pushed Phase 25X commit as its expected baseline unless another approved commit exists before execution.

## Future environment variable name requirements

The future execution may check the following variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION
```

Rules:

- Print variable names only.
- Never print variable values.
- Never print secrets.
- Never print connection strings.
- Never print service-role keys.
- Never print derived credentials.
- Fail if required variable names are absent.
- Fail if unrelated `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Require `AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1`.
- Do not reuse any crawler, extraction, staging, candidate decision, smoke, or verifier opt-in marker.

## Future execution wrapper requirements

The Phase 25Y wrapper script must:

- Use a `main` function.
- Tee logs to `/tmp/aifinder-phase-25y-read-only-live-infrastructure-inspection-<timestamp>.log`.
- Capture `PIPESTATUS[0]`.
- Copy the result package to clipboard on success.
- Copy the raw failure log to clipboard on failure.
- Preserve the original exit code.
- Print clear `PASSED` or `FAILED` lines.
- Print a Discovery Engine progress report on success.
- Run the Node script exactly once.
- Avoid retrying live reads.
- Avoid commit or push.

## Future execution preflight requirements

Before executing the Node script, the wrapper must verify:

1. Repo remote is `https://github.com/jcdumaua/aifinder.git`.
2. Branch is `main`.
3. HEAD equals the approved expected baseline.
4. HEAD subject equals the approved expected subject.
5. `origin/main` equals the approved expected baseline.
6. Branch is ahead `0`, behind `0`.
7. Working tree is clean.
8. No files are staged.
9. `testing/discovery-read-only-live-inspection.mjs` exists.
10. The script allowlist is exactly `public.discovery_sources` and `public.discovery_runs`.
11. `public.discovery_candidate_tools`, `public.discovered_tools`, and `public.tools` are absent from `ALLOWED_TABLES`.
12. No unrelated `AIFINDER_RUN_DISCOVERY_*` variables are set.
13. Required environment variable names are present without printing values.

If any check fails, the wrapper must halt before script execution.

## Future output contract

Allowed output:

- repo identity result
- branch result
- expected HEAD result
- expected subject result
- branch sync result
- working tree result
- environment variable name presence result without values
- guard variable name presence result without value leakage
- table allowlist
- denied table list
- aggregate-only count or reachability summaries for `public.discovery_sources`
- aggregate-only count or reachability summaries for `public.discovery_runs`
- latest timestamp presence summary for approved timestamp columns
- status count summaries for approved status values
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- exit code
- result package path
- raw log path

Denied output:

- secrets
- raw credentials
- service keys
- connection strings
- full row dumps
- raw evidence
- raw HTML
- screenshots
- LLM prompts
- LLM completions
- candidate descriptions
- full public tool records
- raw tool descriptions
- full URLs unless separately approved
- candidate payloads
- application data table records

## Future success criteria

Phase 25Y can be considered successful only if:

- James gives the exact approval phrase.
- The wrapper uses the exact approved command shape.
- The Node script runs exactly once.
- The probe is limited to `public.discovery_sources` and `public.discovery_runs`.
- The output is aggregate-only.
- No secret value is printed.
- No DB mutation occurs.
- No admin API is invoked.
- No local server is started.
- No crawler, extraction, LLM, evidence acquisition, candidate staging, candidate decision, or publishing flow runs.
- No public `tools` or `discovered_tools` write occurs.
- The working tree remains clean.
- Branch sync remains unchanged.
- A result package is produced and copied to clipboard.
- A raw failure log is preserved and copied to clipboard on failure.

## Future failure handling

Phase 25Y must fail closed if:

- The repo or branch is unexpected.
- The execution baseline does not match.
- `origin/main` does not match.
- The branch is ahead or behind.
- The working tree is dirty.
- Files are staged.
- The script is missing.
- The allowlist is wider than the two approved infrastructure tables.
- Any application payload table appears in `ALLOWED_TABLES`.
- Any unrelated `AIFINDER_RUN_DISCOVERY_*` variable is set.
- Required environment variables are missing.
- The script exits non-zero.
- Any aggregate check returns an error.
- Any output risks exposing secret values or row payloads.

No automatic retry should occur.

## Post-execution documentation requirement

If Phase 25Y is executed, the next phase should be:

```text
Phase 25Z — Read-Only Live Infrastructure Inspection Result Documentation
```

Phase 25Z should document:

- exact approval phrase
- exact command
- exit code
- expected baseline
- script commit
- table allowlist
- denied table list
- aggregate output summary
- explicit no-secret-output confirmation
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- final repo status
- recommendation for next phase

## Readiness judgment

Phase 25X does not make the Discovery Engine operationally live.

It documents the final approval parameters for a first read-only infrastructure probe.

The Discovery Engine remains operationally blocked until a separate Phase 25Y execution approval is given and the execution gate is run.

## Recommended next phase

Preferred next phase:

Phase 25Y — Read-Only Live Infrastructure Inspection Execution Gate

Scope:

- Run the narrowed script exactly once.
- Require exact James approval phrase.
- Require the approved expected baseline.
- Require the dedicated read-only guard variable.
- Produce a result package.
- No commit.
- No push.
- No retry.

Alternative next phase:

Phase 25Y-alt — Execution Wrapper Planning Gate

Scope:

- Docs-only planning of the Phase 25Y wrapper.
- No execution.

Preferred recommendation: proceed to Phase 25Y only if James wants the first live infrastructure read. Otherwise use Phase 25Y-alt.

## Required Gemini review questions

1. Does Phase 25X correctly remain docs-only with no script execution and no live inspection?
2. Is the future execution approval phrase sufficiently explicit and narrow?
3. Is the future command shape safe, including the dedicated guard variable and expected HEAD/subject flags?
4. Is the future baseline policy correct, especially if Phase 25X is committed before Phase 25Y?
5. Are the environment variable rules strict enough to prevent secret-value disclosure?
6. Are the future preflight requirements sufficient to fail closed before execution?
7. Is it safe to proceed to Phase 25Y execution gate after James approval, or should a separate wrapper planning gate occur first?

## Phase 25X conclusion

Phase 25X documents the approval parameters for the first read-only live infrastructure inspection.

It does not execute the script and does not perform any live DB read.

The next safe step is either a separate execution gate with explicit James approval or an additional docs-only execution-wrapper planning gate.
