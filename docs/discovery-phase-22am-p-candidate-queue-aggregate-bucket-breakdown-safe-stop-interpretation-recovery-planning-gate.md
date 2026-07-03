# Phase 22AM-P — Candidate Queue Aggregate Bucket Breakdown Safe-Stop Interpretation / Recovery Planning Gate

## Phase Type

Documentation-only interpretation / recovery planning gate.

## Purpose

Phase 22AM-P interprets the Phase 22AM-N safe-stop at a planning level and
defines the safest recovery path.

This phase does not rerun Phase 22AM-N.

This phase does not opt in to aggregate execution.

This phase does not perform database reads.

This phase does not mutate database state.

This phase does not execute candidate decisions.

This phase does not execute `approve_for_draft`.

This phase does not publish to public `tools`.

This phase does not write to `discovered_tools`.

This phase does not perform cleanup mutation.

This phase does not reset or reopen candidates.

This phase does not acquire evidence.

This phase does not print candidate identifiers.

This phase does not change source code, API routes, UI, schema, generated types,
packages, or lockfiles.

## Baseline

Phase 22AM-P starts after Phase 22AM-O was pushed.

Latest expected pushed commit:

```text
7641646 Document aggregate bucket breakdown safe-stop result
```

Expected repository status:

```text
## main...origin/main
```

## Inputs Reviewed

Phase 22AM-P reviews only tracked local source and documentation:

```text
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
docs/discovery-phase-22am-o-candidate-queue-aggregate-bucket-breakdown-execution-result.md
```

No database query is performed in this phase.

No environment values are read or printed in this phase.

## Phase 22AM-N Confirmed Result

Phase 22AM-N was correctly documented by Phase 22AM-O as:

```text
SAFE-STOPPED — AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

The execution returned:

```text
phase_22am_n_read_only_execution_exit_code=1
```

The repository remained clean:

```text
repo_remained_clean=true
```

No aggregate bucket count values were produced in Phase 22AM-N.

The following did not occur:

```text
candidate_decision_executed=false
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
reset_reopen_mutation_executed=false
evidence_acquisition_executed=false
restricted_identifier_printed=false
```

## Interpretation Boundary

Phase 22AM-P does not confirm the runtime root cause of the safe-stop.

The Phase 22AM-N script intentionally failed closed with a generic
classification:

```text
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

This protected against leaking internal values, query details, identifiers,
environment values, URLs, raw evidence, or row payloads.

Because the failure classification is intentionally generic, root-cause
confirmation requires a later gated diagnostic or patch phase.

## Static Source-Level Observations

Phase 22AM-P performs source-level planning observations only.

These observations are hypotheses, not confirmed runtime causes.

### Candidate Hypothesis A — Filter Expression Guard Too Narrow

The script has a filter-expression safety guard around candidate-table filters.

The script also constructs PostgREST-style filter expressions including:

```text
not.is.null
in.(staged,needs_review,duplicate_suspected)
```

A likely source-level risk is that the guard may reject one or more valid
PostgREST filter expression shapes before aggregate output is printed.

This could cause:

```text
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

without printing aggregate count labels.

This hypothesis is plausible because Phase 22AM-N stopped before any aggregate
count labels were printed.

This is not confirmed as the runtime root cause.

### Candidate Hypothesis B — Exact Count Header Parsing Too Strict

The script uses read-only `HEAD` requests and parses the exact count from the
`Content-Range` header.

A possible source-level risk is that the response shape or header behavior may
not match the strict parser expectations in all PostgREST/Supabase cases.

This could produce an unexpected-result safe-stop before aggregate output.

This is not confirmed as the runtime root cause.

### Candidate Hypothesis C — Internal Stage Lacks Non-Secret Diagnostic Codes

The current script intentionally emits only coarse failure classifications.

That is safe, but it makes recovery slower because the failure stage is not
visible.

A future patch should preserve non-identifying output while adding bounded,
non-secret diagnostic stage labels such as:

```text
diagnostic_stage=validate_filter_expression
diagnostic_stage=parse_exact_count
diagnostic_stage=build_count_url
```

These labels must not include URLs, UUIDs, domains, environment values, query
payloads, raw response headers, row data, candidate values, or source values.

## Recovery Principle

Recovery must prefer a source-level correction before any further live read.

The next step should not be a blind rerun.

The next step should not print raw errors.

The next step should not loosen the leak guard globally.

The next step should not expose query URLs, domains, environment values,
candidate identifiers, candidate names, candidate URLs, raw evidence, raw HTML,
or row payloads.

## Recommended Recovery Path

Recommended next phase:

Phase 22AM-Q — Candidate Queue Aggregate Bucket Breakdown Safe-Stop Diagnostic Patch Planning Gate

Recommended Phase 22AM-Q scope:

- docs-only,
- plan a bounded diagnostic patch,
- preserve opt-in requirement,
- preserve read-only aggregate-only execution,
- preserve no identifier output,
- preserve no raw query output,
- preserve no environment value output,
- preserve no source/API/UI/schema/typegen/package changes except a later
  approved script-only implementation phase,
- define safe diagnostic stage labels,
- define safe correction for filter expression validation if needed,
- define safe exact-count parsing fallback if needed,
- define verification commands,
- define Gemini review requirements before implementation.

Potential later implementation phase:

Phase 22AM-R — Candidate Queue Aggregate Bucket Breakdown Safe Diagnostic Patch Implementation

Potential later execution phase:

Phase 22AM-S — Candidate Queue Aggregate Bucket Breakdown Patched Read-Only Re-Execution Gate

These later phases must remain separately approved.

## Guardrails For Any Future Patch

A future patch may be considered only if it:

- changes only `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`,
- keeps the opt-in environment variable mandatory,
- keeps all queries read-only,
- keeps aggregate output non-identifying,
- does not select rows,
- does not print candidate identifiers,
- does not print candidate names,
- does not print candidate URLs,
- does not print source/run/preview/audit identifiers,
- does not print query URLs,
- does not print domains,
- does not print environment values,
- does not print secrets,
- does not print raw response headers,
- does not print raw errors,
- does not print JSON payloads,
- does not call RPCs,
- does not call API routes,
- does not perform database mutations,
- does not execute candidate decisions,
- does not execute `approve_for_draft`,
- does not publish to public `tools`,
- does not write to `discovered_tools`,
- does not perform cleanup,
- does not reset or reopen candidates,
- does not acquire evidence,
- does not change schema or generated types,
- does not change package files or lockfiles.

## Diagnostic Output Allowlist Proposal

A future diagnostic patch may add only non-identifying stage labels from a strict
allowlist, for example:

```text
diagnostic_stage=script_start
diagnostic_stage=repo_guard
diagnostic_stage=env_guard
diagnostic_stage=build_count_url
diagnostic_stage=validate_filter_expression
diagnostic_stage=request_count_head
diagnostic_stage=parse_exact_count
diagnostic_stage=aggregate_accumulation
diagnostic_stage=output_guard
diagnostic_stage=complete
```

These labels must be static strings.

These labels must not include dynamic values.

These labels must not include table names if Gemini considers table names too
revealing in execution output.

These labels must not include filter values if Gemini considers filter values too
revealing in execution output.

## Patch Planning Decision

Phase 22AM-P recommends planning a bounded diagnostic patch before any further
read-only aggregate execution.

Phase 22AM-P does not authorize implementation.

Phase 22AM-P does not authorize re-execution.

Phase 22AM-P does not authorize database reads.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AM-P documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AM-P State

Phase 22AM-P is complete when:

- this interpretation / recovery planning document is reviewed and approved by
  Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- `npm run check` passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
