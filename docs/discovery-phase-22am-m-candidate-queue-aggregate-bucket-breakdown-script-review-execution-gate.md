# Phase 22AM-M — Candidate Queue Aggregate Bucket Breakdown Script Review / Execution Gate

## Phase Type

Documentation-only review / execution gate.

## Purpose

Phase 22AM-M reviews the pushed Phase 22AM-L aggregate bucket breakdown script and
defines the exact future read-only opt-in execution command.

This phase does not run the opt-in database read.

This phase does not mutate database state, does not execute candidate decisions,
does not perform cleanup, does not reset or reopen candidates, does not acquire
evidence, does not approve candidates, and does not publish tools.

## Current Repository Baseline

Latest pushed phase before this review / execution gate:

- Phase 22AM-L — Candidate Queue Aggregate Bucket Breakdown Script Implementation
- Latest pushed commit: `1aa281d`
- Commit subject: `Add candidate queue aggregate bucket breakdown script`
- Final pushed status: `## main...origin/main`

## Reviewed Script

The script under review is:

```text
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

This script was added in Phase 22AM-L.

Phase 22AM-M confirms only that the script is present, tracked, guarded, and
eligible for a future explicit read-only execution gate after Gemini review and
James approval.

## Phase 22AM-M Execution Decision

Phase 22AM-M does not execute the opt-in database read.

The future read-only aggregate execution remains blocked until a separate
approval phrase is provided by James after Gemini reviews this gate.

## Exact Future Opt-In Command

If Gemini approves this gate and James later explicitly authorizes execution,
the future command should be:

```bash
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1 node testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
```

This command must be run only from:

```text
/Users/jamescarlodumaua/aifinder
```

The expected repository state before execution must be:

```text
## main...origin/main
```

The expected HEAD before execution must be:

```text
1aa281d Add candidate queue aggregate bucket breakdown script
```

If the repository is not clean and synced, the script must fail locked.

## Environment Requirements

The future opt-in read-only execution requires:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AIFINDER_RUN_CANDIDATE_QUEUE_AGGREGATE_BUCKET_BREAKDOWN=1
```

The script must never print environment variable values.

The service-role key must never be printed.

## Future Read-Only Scope

The future execution may perform read-only aggregate count checks against only:

```text
public.discovery_candidate_tools
public.tools
public.discovered_tools
```

The script must not select or print rows.

The script must not call RPCs.

The script must not call API routes.

The script must not call approval, cleanup, reset/reopen, crawler, extraction, or
evidence-acquisition helpers.

The script must not run raw SQL.

The script must not run mutation requests.

## Future Allowed Output Labels

The future execution may print only non-identifying aggregate labels, including:

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

Allowed values are only:

- non-negative integers, or
- `SKIPPED_SAFE_QUERY_NOT_AVAILABLE`.

## Future Success Classification

The future read-only execution may be considered complete only if the script
prints:

```text
READ_ONLY_AGGREGATE_BUCKET_BREAKDOWN_COMPLETE
```

This classification must mean:

- no mutation was attempted,
- no candidate decision was executed,
- no `approve_for_draft` was executed,
- no public publishing was executed,
- no cleanup was executed,
- no reset/reopen was executed,
- no evidence acquisition was executed,
- no restricted identifier was printed,
- aggregate counts only were printed.

## Future Failure / Stop Classifications

Allowed non-identifying failure or stop classifications:

```text
AGGREGATE_BUCKET_BREAKDOWN_SKIPPED_OPT_IN_REQUIRED
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_MISSING_ENV
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_QUERY_ERROR
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNEXPECTED_RESULT
```

Failure messages must not include restricted values, environment values,
candidate identifiers, URLs, names, source IDs, run IDs, preview IDs, audit IDs,
raw evidence, raw HTML, or row payloads.

## Leak Guard Expectations

The script must block output that appears to contain:

- UUID-like patterns,
- HTTP or HTTPS URLs,
- domain-like values,
- email-like values,
- serialized JSON,
- raw HTML tags,
- candidate-specific values,
- source-specific values,
- run-specific values,
- preview-specific values,
- audit-specific values,
- tool-specific identifiers,
- user-specific identifiers.

If unsafe output is detected, the script must print:

```text
AGGREGATE_BUCKET_BREAKDOWN_BLOCKED_UNSAFE_OUTPUT
```

and must not print the unsafe value.

## Review Checks Completed In This Gate

Phase 22AM-M performs only non-mutating local checks:

- repository status verification,
- latest commit verification,
- script exists and is tracked,
- required marker inspection,
- restricted operation scan,
- restricted-value scan,
- opt-out guard smoke only,
- whitespace checks,
- `npm run check`.

The opt-out guard smoke runs the script without the opt-in environment variable
and must stop before reading Supabase configuration or running a database query.

## Blocked Actions Reconfirmed

The following remain blocked:

- opt-in execution until separate James approval,
- database reads until separate James approval,
- database mutation,
- candidate decision execution,
- `approve_for_draft`,
- candidate approval,
- public publishing,
- `discovered_tools` writes,
- cleanup mutation,
- reset/reopen mutation,
- evidence acquisition,
- crawler execution,
- extraction execution,
- LLM analysis,
- API route calls,
- raw SQL,
- candidate UUID printing,
- candidate target/name/URL/domain printing,
- source/run/preview/audit identifier printing,
- raw evidence printing,
- raw HTML printing,
- source/API/UI/schema/typegen/package changes,
- package or lockfile changes.

## Execution Authorization Boundary

Even if Gemini approves this Phase 22AM-M document, execution still requires
James to explicitly approve the exact opt-in command.

Recommended approval phrase for the future execution phase:

```text
Approve Phase 22AM-N read-only aggregate bucket breakdown execution
```

Without that explicit approval phrase, the opt-in command must not be run.

## Recommended Next Phase

Recommended next phase:

Phase 22AM-N — Candidate Queue Aggregate Bucket Breakdown Read-Only Execution

Recommended scope:

- Run exactly one opt-in read-only aggregate execution.
- Use the exact command documented in this Phase 22AM-M gate.
- Preserve non-identifying output only.
- Do not execute candidate decisions.
- Do not execute `approve_for_draft`.
- Do not publish tools.
- Do not write to `discovered_tools`.
- Do not perform cleanup.
- Do not reset/reopen candidates.
- Do not acquire evidence.
- Do not print restricted identifiers.
- Save output with `tee`.
- Copy raw terminal output to clipboard even if execution fails.
- Exit with the original success/failure code.

Alternative next phase:

Phase 22AM-N may instead close the current aggregate queue breakdown sequence if
James decides no execution is needed.

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 22AM-M documentation and
James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 22AM-M State

Phase 22AM-M is complete when:

- This review / execution gate document is reviewed and approved by Gemini.
- The working tree contains only this documentation file as the intended change.
- Whitespace checks pass.
- `npm run check` passes.
- James explicitly approves commit after Gemini approval.
- No commit is made before Gemini approval and James approval.
- No push is made without explicit James push approval.
