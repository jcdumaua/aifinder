# Phase 22AM-K — Candidate Queue Aggregate Bucket Breakdown Script Planning Gate

## Phase Type

Documentation-only script planning gate.

## Purpose

Phase 22AM-K defines the exact future script plan for a read-only, aggregate-only
candidate queue bucket breakdown.

This phase does not create the runtime script, does not run database reads, does
not mutate database state, does not execute candidate decisions, does not perform
cleanup, does not reset or reopen candidates, does not acquire evidence, does
not approve candidates, and does not publish tools.

## Current Repository Baseline

Latest pushed phase before this script planning gate:

- Phase 22AM-J — Candidate Queue Aggregate Bucket Breakdown Planning Gate
- Latest pushed commit: `a4b62de`
- Commit subject: `Document candidate queue aggregate bucket planning gate`
- Final pushed status: `## main...origin/main`

## Prior Gate Input

Phase 22AM-J established the safe planning boundary for a future aggregate bucket
breakdown and confirmed:

1. The future check must be read-only.
2. The future check must be non-identifying.
3. The future check must output aggregate counts only.
4. No database read is authorized until a separately approved execution phase.
5. Cleanup, reset/reopen, evidence acquisition, approval, publishing, and all
   candidate decisions remain blocked.

## Future Runtime Script Path

The future runtime script path should be:

```text
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

Phase 22AM-K does not create this script.

A separate future implementation phase must add the script under the exact path
above, and a separate future execution phase must authorize running it.

## Future Runtime Command Shape

The future read-only execution command should require an explicit opt-in
environment variable:

```bash
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1 node testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

The future script must safely stop unless the explicit opt-in variable equals
`1`.

The future script must not be runnable accidentally through `npm run check`,
build hooks, lint hooks, or normal development commands.

## Future Environment Requirements

The future script may read only the minimum environment variables needed for a
read-only Supabase aggregate check.

Expected required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1
```

The script must fail closed if required environment variables are missing.

The service-role key must never be printed.

No environment variable values may be printed.

## Future Read-Only Data Scope

The future script may read aggregate counts only from:

```text
public.discovery_candidate_tools
public.tools
public.discovered_tools
```

The script must not read or output candidate rows.

The script must not join candidate rows to sources, runs, previews, audits,
tools, users, or external evidence tables.

The script must not read raw evidence, raw HTML, crawl artifacts, extraction
payloads, LLM outputs, prompt content, screenshots, or serialized records.

The script must not call RPCs, mutation helpers, route handlers, approval
helpers, cleanup helpers, reset/reopen helpers, crawler helpers, extraction
helpers, or evidence-acquisition helpers.

## Future Query Boundary

The future script should use count-only queries wherever possible.

Allowed query patterns:

- Exact total counts.
- Exact counts with equality filters.
- Exact counts with null / not-null filters.
- Exact counts with status filters.
- Exact counts with cleanup-state filters.
- Exact counts with decision-action filters.
- Exact counts for public `tools`.
- Exact counts for `discovered_tools`.

Forbidden query patterns:

- Selecting full rows.
- Selecting candidate UUIDs.
- Selecting candidate names.
- Selecting candidate URLs.
- Selecting source identifiers.
- Selecting run identifiers.
- Selecting preview identifiers.
- Selecting audit identifiers.
- Selecting user identifiers.
- Selecting raw evidence.
- Selecting raw HTML.
- Selecting external fetch results.
- Selecting extraction payloads.
- Selecting serialized JSON rows.
- Printing arrays of candidate records.
- Printing any candidate-level object.

If grouped bucket counts cannot be performed without returning row-like records,
the future script should use a fixed allowlist of aggregate count queries instead
of dynamic row selection.

## Future Output Labels

The future script may print only these aggregate labels:

```text
total_candidate_count
status_bucket_staged_candidate_count
status_bucket_needs_more_evidence_candidate_count
status_bucket_rejected_candidate_count
status_bucket_approved_for_draft_candidate_count
status_bucket_other_candidate_count
cleanup_bucket_active_candidate_count
cleanup_bucket_cleanup_candidate_count
cleanup_bucket_other_candidate_count
active_non_cleanup_candidate_count
active_staged_candidate_count
staged_candidate_count
decision_ready_candidate_count
any_decision_action_set_candidate_count
decision_action_needs_more_evidence_candidate_count
decision_action_reject_candidate_count
decision_action_approve_for_draft_candidate_count
decision_action_other_candidate_count
needs_more_evidence_any_status_candidate_count
needs_more_evidence_active_any_status_candidate_count
needs_more_evidence_staged_any_cleanup_candidate_count
needs_more_evidence_active_staged_candidate_count
public_tools_count_query_before
public_tools_count_query_after
discovered_tools_count_query_before
discovered_tools_count_query_after
```

If any label cannot be computed safely without selecting restricted values, the
future script must skip that label and print a safe skip marker:

```text
<output_label>=SKIPPED_SAFE_QUERY_NOT_AVAILABLE
```

The future script must never print candidate-specific values to explain a skipped
label.

## Future Expected Output Format

Each output line should use this format:

```text
label=value
```

Allowed examples:

```text
total_candidate_count=3
active_staged_candidate_count=0
public_tools_count_query_before=10
public_tools_count_query_after=10
```

Forbidden examples:

```text
candidate_uuid=<value>
candidate_name=<value>
candidate_url=<value>
source_id=<value>
run_id=<value>
audit_id=<value>
raw_html=<value>
```

## Future Leak Guard

The future script must include a leak guard before printing final output.

The leak guard should reject output containing:

- UUID-like patterns.
- HTTP or HTTPS URLs.
- Domain-like values.
- Email-like values.
- Long serialized JSON objects.
- Raw HTML tags.
- Candidate-specific keys.
- Source-specific keys.
- Run-specific keys.
- Preview-specific keys.
- Audit-specific keys.
- Tool-specific IDs.
- User-specific IDs.

If the leak guard detects unsafe output, the script must:

1. Print a generic failure classification.
2. Avoid printing the unsafe value.
3. Exit with non-zero status.
4. Preserve the raw terminal output via `tee`.
5. Still copy terminal output to clipboard.

Generic failure classification:

```text
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT
```

## Future Success Classification

If the future script completes safely, it should print:

```text
READ_ONLY_AGGREGATE_BUCKET_BREAKDOWN_COMPLETE
```

This success classification must mean:

- No mutation was attempted.
- No candidate decision was executed.
- No approval was executed.
- No cleanup was executed.
- No reset/reopen was executed.
- No evidence acquisition was executed.
- No restricted identifier was printed.
- Aggregate counts only were printed.

## Future Failure Classifications

The future script may use generic non-identifying failure classifications:

```text
AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_QUERY_ERROR
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

Failure messages must not include restricted database values or identifiers.

## Future Script Terminal Behavior

The future script must follow the standing terminal workflow rules:

1. Run the main script work.
2. Save all output with `tee`.
3. Capture whether the script succeeded or failed.
4. Copy raw terminal output to clipboard even if the script fails.
5. Exit with the original success/failure code.
6. Provide an overall progress report after a successful phase upgrade.

## Future Verification Commands

The future script implementation phase should verify:

```bash
git status --short --branch
git log -1 --oneline
git diff --check
npm run check
```

If the future runtime script is added in a later implementation phase, that phase
must also verify that only the approved script path changed, unless that phase
explicitly approves additional documentation.

## Future Execution Gate Requirements

The future read-only execution phase must be separate from the script planning
and script implementation phases.

A future execution phase must document:

- Exact command to run.
- Exact opt-in variable.
- Expected output labels.
- Expected blocked actions.
- Expected leak guard behavior.
- Expected success and failure classifications.
- Whether public `tools` and `discovered_tools` counts should be compared before
  and after the read-only aggregate check.

No future execution may occur without explicit James approval.

## Candidate Decision Boundary

All candidate decisions remain blocked.

Phase 22AM-K does not authorize:

- `needs_more_evidence`.
- `reject`.
- `approve_for_draft`.
- Any new candidate decision action.
- Any retry of the Phase 22AM-D mutation.
- Any candidate decision smoke rerun.

The `needs_more_evidence` decision path is already treated as mechanically
validated at the aggregate / non-identifying level for the current smoke
objective.

## Approval And Publishing Boundary

Candidate approval remains blocked.

`approve_for_draft` remains blocked.

Public publishing remains blocked.

No public `tools` write is authorized.

No `discovered_tools` write is authorized.

No publishing-adjacent behavior is authorized.

## Cleanup Boundary

Cleanup remains blocked.

Phase 22AM-K does not authorize cleanup, cleanup lifecycle mutation, cleanup
repair, cleanup deletion, cleanup completion, cleanup reset, or cleanup closure.

## Reset/Reopen Boundary

Reset/reopen remains blocked.

Phase 22AM-K does not authorize reopening candidates, restoring staged status,
undoing decisions, or moving candidates between lifecycle buckets.

## Evidence Acquisition Boundary

Evidence acquisition remains blocked.

Phase 22AM-K does not authorize:

- HTML acquisition.
- Screenshot acquisition.
- External fetches.
- Crawler execution.
- Extraction execution.
- LLM analysis.
- Candidate enrichment.
- Evidence storage writes.

## Source / API / UI / Schema Boundary

Phase 22AM-K is documentation-only.

It does not authorize changes to:

- Source code.
- API routes.
- UI components.
- Supabase schema.
- Migrations.
- Generated types.
- Package files.
- Lockfiles.
- Test harnesses.
- Runtime scripts.

## Recommended Next Phase

Recommended next phase:

Phase 22AM-L — Candidate Queue Aggregate Bucket Breakdown Script Implementation

Recommended scope:

- Add only `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`.
- Implement the explicit opt-in guard.
- Implement read-only aggregate count queries only.
- Implement output allowlist.
- Implement leak guard.
- Do not run the database query yet.
- Preserve all mutation, approval, publishing, cleanup, reset/reopen, evidence
  acquisition, and identifier-printing blocks.

Alternative next phase:

Phase 22AM-L may instead close the current candidate decision smoke sequence if
James decides no further queue-state breakdown is needed before moving to the
next strategic Discovery Engine objective.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AM-K documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AM-K State

Phase 22AM-K is complete when:

- This script planning document is reviewed and approved by Gemini.
- The working tree contains only this documentation file as the intended change.
- Whitespace checks pass.
- `npm run check` passes.
- James explicitly approves commit after Gemini approval.
- No commit is made before Gemini approval and James approval.
- No push is made without explicit James push approval.
