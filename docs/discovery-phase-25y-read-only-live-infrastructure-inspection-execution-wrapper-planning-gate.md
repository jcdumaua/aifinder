# AiFinder Discovery Engine — Phase 25Y Read-Only Live Infrastructure Inspection Execution Wrapper Planning Gate

## Phase

Phase 25Y — Read-Only Live Infrastructure Inspection Execution Wrapper Planning Gate

## Status

Documentation artifact only.

This phase plans the execution wrapper and logging parameters for the first read-only live infrastructure inspection.

It does not execute the inspection.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25X.
- Baseline commit: `d3c6d13`
- Baseline subject: `Document Phase 25X live inspection pre-flight approval`
- Phase 25X result: pre-flight approval parameters were committed and pushed to `main`.

## Implemented inspection script

```text
testing/discovery-read-only-live-inspection.mjs
```

## Confirmed infrastructure-only allowlist

```text
public.discovery_sources
public.discovery_runs
```

## Explicitly excluded application payload tables

```text
public.discovery_candidate_tools
public.discovered_tools
public.tools
```

## Purpose

Phase 25X documented the pre-flight approval parameters for a future live infrastructure read.

Gemini recommended that Phase 25Y remain an execution planning gate rather than the live run. Phase 25Y therefore documents the exact wrapper, logging, result package, and halt behavior for a future execution phase.

This phase intentionally supersedes the earlier Phase 25X execution naming plan. The actual live execution should move to Phase 25Z so that Phase 25Y can remain a documentation-only wrapper planning gate.

## Boundary

Phase 25Y is docs-only.

Allowed:

- Create this documentation file.
- Define the future execution wrapper behavior.
- Define the future result package format.
- Define the future log path pattern.
- Define the future command shape.
- Define future halt conditions.
- Define future post-execution result documentation requirements.
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

Recommended actual execution phase after this planning gate:

```text
Phase 25Z — Read-Only Live Infrastructure Inspection Execution Gate
```

This avoids using Phase 25Y for both wrapper planning and live execution.

## Future execution approval phrase

Recommended exact future approval phrase:

```text
Approve run Phase 25Z read-only live infrastructure inspection.
```

The previous Phase 25X phrase was:

```text
Approve run Phase 25Y read-only live infrastructure inspection.
```

Phase 25Y should clarify and supersede that phrase because Phase 25Y is now an execution-wrapper planning gate.

No live execution should occur until the new Phase 25Z approval phrase is explicitly provided.

## Future wrapper script identity

The future execution wrapper should be generated as a downloadable shell script, not committed by default:

```text
aifinder-phase-25z-read-only-live-infrastructure-inspection.sh
```

The wrapper should not create a commit and should not push.

## Future log path

The future wrapper should tee logs to:

```text
/tmp/aifinder-phase-25z-read-only-live-infrastructure-inspection-<timestamp>.log
```

Failure log path:

```text
/tmp/aifinder-phase-25z-read-only-live-infrastructure-inspection-failure-<timestamp>.log
```

Result package path:

```text
/tmp/aifinder-phase-25z-read-only-live-infrastructure-inspection-result-package-<timestamp>.md
```

## Future command shape

The future wrapper should run the Node script exactly once:

```bash
AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1 \
node testing/discovery-read-only-live-inspection.mjs \
  --expected-head <approved-pushed-head> \
  --expected-subject "<approved-pushed-subject>" \
  --mode aggregate-only
```

The future `<approved-pushed-head>` and `<approved-pushed-subject>` should match the latest pushed execution baseline at the time Phase 25Z is approved.

If this Phase 25Y document is committed and pushed before Phase 25Z, then Phase 25Z should use the Phase 25Y pushed commit as its expected baseline unless another approved commit exists before execution.

## Future wrapper preflight checks

Before setting the dedicated guard and running the Node script, the wrapper must verify:

1. Repo remote equals `https://github.com/jcdumaua/aifinder.git`.
2. Branch equals `main`.
3. HEAD equals the approved execution baseline.
4. HEAD subject equals the approved execution subject.
5. `origin/main` equals the approved execution baseline.
6. Branch is ahead `0`, behind `0`.
7. Working tree is clean.
8. No files are staged.
9. `testing/discovery-read-only-live-inspection.mjs` exists.
10. The script allowlist is exactly `public.discovery_sources` and `public.discovery_runs`.
11. `public.discovery_candidate_tools`, `public.discovered_tools`, and `public.tools` are absent from `ALLOWED_TABLES`.
12. No unrelated `AIFINDER_RUN_DISCOVERY_*` variables are set.
13. Required environment variable names are present.
14. Required environment variable values are never printed.
15. The wrapper is about to run the Node script exactly once.
16. No retry loop exists.

If any wrapper preflight fails, the Node script must not run.

## Future guard handling

The wrapper may set this variable only for the single Node invocation:

```text
AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION=1
```

Rules:

- Do not export it globally for the entire shell session.
- Do not set any other `AIFINDER_RUN_DISCOVERY_*` variable.
- Do not reuse crawler, extraction, staging, candidate decision, smoke, or verifier opt-in markers.
- Do not print secret values.
- Do not print Supabase key values.
- Do not print connection strings.

## Future expected environment variable names

The wrapper may verify presence of these names:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

The wrapper and Node script must never print their values.

## Future result package sections

The Phase 25Z execution wrapper result package should include:

1. Phase title.
2. Exact approval phrase.
3. Exact command shape.
4. Execution baseline commit.
5. Execution baseline subject.
6. Script path.
7. Script allowlist.
8. Explicitly denied application payload tables.
9. Exit code.
10. Aggregate result summary.
11. Error count summary.
12. Explicit no-secret-output confirmation.
13. Explicit no-mutation confirmation.
14. Explicit no-admin-API confirmation.
15. Explicit no-local-server confirmation.
16. Explicit no-crawler/extraction/candidate/publication confirmation.
17. Final git status.
18. Log path.
19. Recommendation for result documentation phase.

## Future output redaction rule

The wrapper must copy output into the result package only after ensuring no known secret values appear.

If the script output includes a value matching any known secret environment variable value, the wrapper must redact it before writing the result package.

If redaction cannot be guaranteed, the wrapper must fail and copy only a sanitized failure message.

## Future success criteria

Phase 25Z execution can be marked passed only if:

- James gives the exact Phase 25Z approval phrase.
- The wrapper uses the approved expected baseline.
- The wrapper verifies a clean synced repo.
- The wrapper verifies the narrowed allowlist.
- The Node script runs exactly once.
- The Node script exits `0`.
- The output is aggregate-only.
- No application payload table is queried.
- No secret value is printed.
- No DB mutation occurs.
- No admin API is invoked.
- No local server is started.
- No crawler, extraction, LLM, evidence acquisition, candidate staging, candidate decision, or publishing flow runs.
- No public `tools` or `discovered_tools` write occurs.
- Working tree remains clean.
- Branch sync remains unchanged.
- A result package is produced and copied to clipboard.

## Future failure handling

Phase 25Z must fail closed if:

- Approval phrase is absent or wrong.
- Repo or branch is unexpected.
- HEAD or subject mismatches the approved baseline.
- `origin/main` mismatches the approved baseline.
- Branch is ahead or behind.
- Working tree is dirty.
- Files are staged.
- Inspection script is missing.
- The allowlist is wider than the two approved infrastructure tables.
- Any application payload table appears in `ALLOWED_TABLES`.
- Any unrelated `AIFINDER_RUN_DISCOVERY_*` variable is set.
- Required environment variables are missing.
- The Node script exits non-zero.
- Aggregate checks return errors.
- Output redaction fails.
- Any output risks exposing secrets or row payloads.

No automatic retry should occur.

## Future result documentation phase

After Phase 25Z execution, the next phase should be:

```text
Phase 25AA — Read-Only Live Infrastructure Inspection Result Documentation
```

Phase 25AA should be docs-only and should document:

- exact approval phrase
- exact command shape
- exit code
- expected baseline
- script commit
- wrapper log path
- table allowlist
- denied table list
- aggregate result summary
- error count summary
- explicit no-secret-output confirmation
- explicit no-mutation confirmation
- explicit no-admin-API confirmation
- explicit no-crawler/extraction/candidate/publication confirmation
- final repo status
- recommendation for next phase

## Readiness judgment

Phase 25Y does not execute any live inspection.

It converts Phase 25X’s approval parameters into a safer wrapper planning contract and shifts actual execution to Phase 25Z.

The Discovery Engine remains operationally blocked.

## Recommended next phase

Preferred next phase:

Phase 25Z — Read-Only Live Infrastructure Inspection Execution Gate

Scope:

- Run the narrowed script exactly once.
- Require exact Phase 25Z approval phrase.
- Require the approved expected baseline.
- Require the dedicated read-only guard variable.
- Produce a redacted result package.
- No commit.
- No push.
- No retry.

Alternative next phase:

Phase 25Z-alt — Additional Wrapper Review Gate

Scope:

- Docs-only.
- Further refine output redaction and result package structure.
- No execution.

Preferred recommendation: proceed to Phase 25Z only if James explicitly wants the first live infrastructure read.

## Required Gemini review questions

1. Does Phase 25Y correctly remain docs-only with no script execution and no live inspection?
2. Is it correct to supersede the earlier Phase 25X execution phrase and move actual execution to Phase 25Z?
3. Is the proposed Phase 25Z approval phrase sufficiently explicit and narrow?
4. Are the wrapper preflight checks strict enough before the Node script can run?
5. Are the log, failure log, and result package paths appropriate?
6. Are the output redaction requirements strict enough to prevent secret-value disclosure?
7. Is it safe to proceed to Phase 25Z execution gate after James approval, or should an additional wrapper review gate occur first?

## Phase 25Y conclusion

Phase 25Y is a documentation-only execution-wrapper planning gate.

It does not execute the read-only live inspection script and does not perform any live DB read.

The next safe step is either a separate Phase 25Z execution gate with explicit James approval or another docs-only wrapper review gate.
