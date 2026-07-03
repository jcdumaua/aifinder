# Phase 22AM-Q — Candidate Queue Aggregate Bucket Breakdown Safe-Stop Diagnostic Patch Planning Gate

## Phase Type

Documentation-only diagnostic patch planning gate.

## Purpose

Phase 22AM-Q defines the exact safety plan for a future bounded diagnostic patch
to the candidate queue aggregate bucket breakdown script.

This phase does not implement the patch.

This phase does not modify the runtime script.

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

This phase does not change API routes, UI, schema, generated types, packages, or
lockfiles.

## Baseline

Phase 22AM-Q starts after Phase 22AM-P was pushed.

Latest expected pushed commit:

```text
3316ca9 Document aggregate bucket breakdown recovery planning gate
```

Expected repository status:

```text
## main...origin/main
```

## Inputs Reviewed

Phase 22AM-Q reviews only tracked local source and documentation:

```text
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
docs/discovery-phase-22am-o-candidate-queue-aggregate-bucket-breakdown-execution-result.md
docs/discovery-phase-22am-p-candidate-queue-aggregate-bucket-breakdown-safe-stop-interpretation-recovery-planning-gate.md
```

No database query is performed in this phase.

No environment values are read or printed in this phase.

## Prior Result

Phase 22AM-N safe-stopped with:

```text
SAFE-STOPPED — AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

No aggregate bucket count values were produced in Phase 22AM-N.

The repository remained clean after Phase 22AM-N:

```text
repo_remained_clean=true
```

## Prior Interpretation

Phase 22AM-P intentionally did not confirm a runtime root cause.

It identified three source-level hypotheses:

1. the filter-expression guard may be too narrow,
2. exact-count header parsing may be too strict,
3. the script lacks non-secret diagnostic stage labels.

Phase 22AM-Q accepts these only as hypotheses.

Phase 22AM-Q does not convert them into confirmed causes.

## Patch Objective

The future patch should make the next failure mode more diagnosable without
weakening the fail-closed model.

The patch should answer only this safe question:

```text
Which static, non-secret execution stage was reached before the safe-stop?
```

The patch must not answer unsafe questions such as:

- which candidate row caused the issue,
- which source row caused the issue,
- which URL was queried,
- which filter value was sent dynamically,
- which response header was returned,
- which raw error occurred,
- which environment value was loaded,
- which candidate identifier exists,
- which candidate name or target exists.

## Future Patch Target

The only allowed future implementation target is:

```text
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

No other files should change in the implementation phase unless Gemini and James
approve a new scope.

## Required Future Patch Properties

A future diagnostic patch must preserve:

```text
read_only=true
aggregate_only=true
candidate_decision_executed=false
approve_for_draft_executed=false
public_tools_write=false
discovered_tools_write=false
cleanup_mutation_executed=false
reset_reopen_mutation_executed=false
evidence_acquisition_executed=false
restricted_identifier_printed=false
```

A future diagnostic patch must preserve the opt-in guard:

```text
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1
```

A future diagnostic patch must preserve the opt-out skip classification:

```text
AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED
```

## Diagnostic Stage Allowlist

A future implementation may add a strict static allowlist for diagnostic stage
labels.

Allowed stage output format:

```text
diagnostic_stage=<static_allowlisted_label>
```

Allowed stage labels:

```text
diagnostic_stage=script_start
diagnostic_stage=repo_guard
diagnostic_stage=env_guard
diagnostic_stage=build_count_request
diagnostic_stage=validate_filter_expression
diagnostic_stage=request_public_tools_before_count
diagnostic_stage=request_discovered_tools_before_count
diagnostic_stage=request_candidate_total_count
diagnostic_stage=request_candidate_status_bucket_count
diagnostic_stage=request_candidate_cleanup_bucket_count
diagnostic_stage=request_candidate_decision_action_bucket_count
diagnostic_stage=request_public_tools_after_count
diagnostic_stage=request_discovered_tools_after_count
diagnostic_stage=parse_exact_count
diagnostic_stage=aggregate_accumulation
diagnostic_stage=output_guard
diagnostic_stage=complete
```

The labels must be static string literals.

The labels must not include dynamic suffixes.

The labels must not include numeric counts.

The labels must not include candidate status values.

The labels must not include cleanup status values.

The labels must not include decision action values.

The labels must not include table rows.

The labels must not include URLs.

The labels must not include domains.

The labels must not include query strings.

The labels must not include response headers.

The labels must not include raw errors.

The labels must not include environment values.

The labels must not include secrets.

## Diagnostic Stage Output Guard

A future patch should validate diagnostic stage labels before printing them.

Recommended function shape:

```text
emitDiagnosticStage(stage)
```

Required behavior:

- accepts only values in the static allowlist,
- prints exactly `diagnostic_stage=<stage>`,
- rejects all non-allowlisted values,
- does not stringify objects,
- does not print arrays,
- does not print errors,
- does not print headers,
- does not print URLs,
- does not print filter expressions,
- does not print environment values.

## Filter Expression Validation Plan

The future implementation should review the current filter-expression guard and
make it explicit that the following static PostgREST expression shapes are
permitted only when built from internal allowlisted constants:

```text
eq.<safe_token>
is.null
not.is.null
in.(<safe_token>,<safe_token>)
```

The future implementation should not allow arbitrary filter strings.

The future implementation should not allow URL-like strings.

The future implementation should not allow UUID-like strings.

The future implementation should not allow email-like strings.

The future implementation should not allow domain-like strings.

The future implementation should not allow whitespace.

The future implementation should not allow JSON-like strings.

The future implementation should not allow raw HTML-like strings.

The future implementation should not allow slash characters.

The future implementation should not allow user-provided strings.

The future implementation should validate all `in.(...)` members individually
against a safe token allowlist or a strict safe token pattern.

Recommended safe token pattern:

```text
^[a-z][a-z0-9_]*$
```

If Gemini prefers a stricter approach, the implementation should use explicit
arrays of allowed candidate status, cleanup status, and decision action values
instead of a token pattern.

## Exact Count Parsing Plan

The future implementation should review exact-count parsing for read-only
`HEAD` responses.

The parser may safely support these non-identifying `Content-Range` shapes:

```text
0-0/12
0-4/12
*/12
```

The parser must return only a non-negative integer count.

The parser must reject:

```text
*/*
0-0/*
missing header
negative counts
non-integer counts
very large unsafe counts
malformed values
```

The parser must not print the raw `Content-Range` header.

The parser must not print raw response headers.

The parser must not print raw errors.

The parser must not print query URLs.

The parser must not print request filters.

When parsing fails, the script should safe-stop using an existing generic
classification, while the diagnostic stage indicates that the failure was near:

```text
diagnostic_stage=parse_exact_count
```

## Error Handling Plan

The future implementation should not add raw error printing.

Allowed failure classifications remain:

```text
AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_QUERY_ERROR
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

The future patch may add diagnostic stage labels before these classifications,
but it must not add dynamic error messages.

## Output Allowlist Plan

A future patch must keep output allowlisted.

Allowed output categories:

- existing static header lines,
- existing boolean boundary flags,
- existing aggregate labels with non-negative integer values or
  `SKIPPED_SAFE_QUERY_NOT_AVAILABLE`,
- existing success/failure classifications,
- static `diagnostic_stage=<allowlisted_label>` lines,
- raw terminal output log path,
- exit code,
- clipboard copy status.

Disallowed output categories:

- UUIDs,
- candidate identifiers,
- candidate names,
- candidate target values,
- candidate URLs,
- source IDs,
- run IDs,
- preview IDs,
- audit IDs,
- public tool IDs,
- discovered tool IDs,
- user IDs,
- emails,
- domains,
- URLs,
- query strings,
- request URLs,
- raw filters,
- raw response headers,
- raw errors,
- JSON payloads,
- arrays,
- raw HTML,
- environment values,
- secrets.

## Future Implementation Phase

Recommended next phase:

Phase 22AM-R — Candidate Queue Aggregate Bucket Breakdown Safe Diagnostic Patch Implementation

Recommended Phase 22AM-R scope:

- modify only `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`,
- add static diagnostic stage allowlist,
- add safe diagnostic stage emitter,
- adjust filter-expression validation if needed,
- adjust exact-count parsing if needed,
- preserve opt-in guard,
- preserve read-only behavior,
- preserve aggregate-only output,
- preserve leak guard,
- run opt-out guard smoke only,
- do not run opt-in aggregate execution,
- do not perform database reads,
- run restricted operation scans,
- run whitespace checks,
- run `npm run check`,
- prepare Gemini review package before commit.

Phase 22AM-R must not execute the read-only aggregate command with opt-in.

## Future Re-Execution Phase

Recommended later phase after implementation, Gemini review, commit, and push:

Phase 22AM-S — Candidate Queue Aggregate Bucket Breakdown Patched Read-Only Re-Execution Gate

Phase 22AM-S must require a new explicit James approval phrase before execution.

Suggested future approval phrase:

```text
Approve Phase 22AM-S patched read-only aggregate bucket breakdown execution
```

Phase 22AM-S must run the opt-in command exactly once.

Phase 22AM-S must still print no identifiers.

## Verification Requirements For Phase 22AM-R

A future implementation phase should verify:

```text
git status --short --branch
git log -1 --oneline
script-only changed path
restricted mutation/RPC scan
diagnostic stage allowlist marker checks
filter-expression validation marker checks
exact-count parsing marker checks
opt-out guard smoke
git diff --check
npm run check
Gemini review package creation
```

The implementation phase should not run:

```text
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1 node testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AM-Q documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AM-Q State

Phase 22AM-Q is complete when:

- this diagnostic patch planning document is reviewed and approved by Gemini,
- the working tree contains only this documentation file as the intended change,
- whitespace checks pass,
- `npm run check` passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
