# AiFinder Manual Crawler Pre-Implementation Decisions

## Phase 6N Status

This phase is documentation/planning only.

Manual crawler implementation has not started.

Scheduled crawler automation remains locked.

This decision record resolves the Phase 6M pre-implementation decision gates for the future manual crawler prototype. It does not approve crawler code, API routes, workers, Supabase migrations, scheduled automation, or production behavior changes.

## Decision 1 - Schema Compatibility

Decision:

- Use existing `discovery_sources.source_type = 'manual'`.
- Represent the first prototype variant using `config.kind = 'manual_curated_urls'`.
- Use existing `discovery_runs.status = 'pending'` as the queued-equivalent state.
- Use existing `running`, `completed`, and `failed` statuses.
- Do not add `queued`, `cancelled`, or `stuck` status yet.
- Do not create a Supabase migration for the first prototype.
- Any future first-class enum/status migration requires separate review.

Rationale:

- The current Discovery Engine schema already supports low-volume manual source records, run tracking, queue candidates, evidence, duplicate candidates, and audit events.
- Mapping `manual_curated_urls` into `discovery_sources.config.kind` preserves the first prototype source decision without changing the `source_type` constraint.
- Mapping queued behavior to `pending` preserves the existing `discovery_runs.status` constraint and existing Admin run-history UI.
- Stuck-run recovery can mark stale `running` runs as `failed` with safe metadata instead of adding a `stuck` status for the first prototype.

Recommended source config shape:

```json
{
  "kind": "manual_curated_urls",
  "approval_status": "approved_for_first_manual_prototype",
  "risk_level": "low",
  "initial_test_limit": 10,
  "validation_max": 20,
  "policy_review_required_before_fetch": true
}
```

## Decision 2 - Async Handoff

Decision:

- The trigger endpoint remains `POST /api/admin/discovery/runs/manual`.
- The trigger endpoint creates the run row and returns quickly.
- Long-running fetch/extract/validate/insert work must not happen inline inside the request.
- No fake async behavior is allowed.
- If no approved background primitive exists, implementation must first introduce the smallest safe approved handoff and receive review before fetch execution is enabled.

Proposed first async handoff approach:

- Use a durable database-backed handoff: the trigger endpoint creates a `discovery_runs` row with `status = 'pending'`, stores an admin-safe run request snapshot in `stats`, and returns the run ID immediately.
- A separately approved executor primitive must claim a `pending` run, transition it to `running`, perform the fetch/extract/validate/insert work, then transition it to `completed` or `failed`.
- The executor must use service-role-only backend execution and must not depend on the original HTTP request staying open.
- The executor must claim runs defensively so the same run is not executed twice.
- The executor must write audit events for run start, completion, failure, candidate outcomes, and stuck-run recovery.

Current repo/runtime constraint:

- The repo currently has Next.js admin API routes and service-role helpers, but no approved worker, queue, cron job, or background job primitive.
- Therefore, the first coding slice may create the trigger and validation pieces only after approval, but fetch execution must stay disabled until the async handoff primitive is explicitly reviewed and approved.

Not approved:

- `setTimeout`, unawaited promises, or fire-and-forget work inside the API route.
- Doing the full crawl before returning the trigger response.
- Scheduled crawler automation.

## Decision 3 - Stuck-Run Recovery

Decision:

- Prefer automated timeout recovery.
- Use a conservative timeout threshold of 30 minutes for the first prototype unless later implementation review chooses a stricter value in the 15-30 minute range.
- Stale `running` runs should transition safely to `failed` with a timeout/recovery reason using admin-safe metadata.
- Recovery action must be audited.
- Scheduled crawler automation remains locked; stuck-run recovery is not crawler scheduling.

Recommended first recovery behavior:

- Before claiming or starting a manual crawler run, the approved executor should check for manual crawler runs with `status = 'running'` and `updated_at` or `started_at` older than the approved timeout threshold.
- Eligible stale runs should be updated to `status = 'failed'`.
- `error_log` should use a safe message such as `Manual crawler run exceeded timeout threshold.`
- `stats` should record safe recovery metadata such as `recovered_from_stale_running: true`, `recovery_reason: "timeout"`, and `timeout_minutes: 30`.
- Insert a `discovery_audit_events` row using the existing audit schema. If `discovered_tool_id` is required, attach the audit event to the safest related discovered tool/candidate when available, or require a reviewed migration/design update before run-level audit events are implemented. Use existing action `flag` only if compatible with the current action constraint, and include metadata such as `event_type = "manual_crawler_run_timeout_recovered"`.

Recovery must not:

- Delete run history.
- Delete candidates casually.
- Retry automatically without approval.
- Run on a schedule as crawler automation.

## Decision 4 - Per-URL Policy Storage

Decision:

- Use existing JSON fields for the first prototype.
- Store source-level policy defaults in `discovery_sources.config`.
- Store a per-run policy snapshot in `discovery_runs.stats`.
- Store per-candidate policy snapshots in `discovered_tools.raw_payload` and `discovery_evidence.extracted_json`.
- Preserve per-URL and per-domain policy checks.
- Unknown or unclear policy means blocked until reviewed.
- No raw HTML/screenshots by default.

Recommended source-level config shape:

```json
{
  "kind": "manual_curated_urls",
  "policy": {
    "review_mode": "per_url_required_before_fetch",
    "unknown_policy_behavior": "blocked",
    "raw_html_enabled": false,
    "screenshots_enabled": false
  }
}
```

Recommended per-URL policy review shape:

```json
{
  "url": "https://example.com",
  "normalized_domain": "example.com",
  "robots_txt_review": "allowed",
  "terms_review": "allowed",
  "permission_status": "allowed",
  "permission_notes": "Reviewed public product page for low-volume manual prototype.",
  "reviewed_at": "2026-06-19T00:00:00.000Z",
  "reviewed_by": "AiFinder Admin"
}
```

Allowed policy values:

- `allowed`
- `blocked`
- `unknown`
- `not_applicable`

Behavior:

- `allowed`: URL may proceed to fetch eligibility checks.
- `blocked`: URL must not be fetched.
- `unknown`: URL must not be fetched until reviewed.
- `not_applicable`: allowed only for purely admin-entered metadata where no fetch occurs.

Where metadata should be copied:

- `discovery_runs.stats.policy_reviews`: run-level snapshot of reviewed URLs.
- `discovered_tools.raw_payload.policy_review`: candidate-level snapshot.
- `discovery_evidence.extracted_json.policy_review`: evidence-level snapshot.

This keeps the first prototype migration-free while preserving review traceability.

## Decision 5 - UI Scope

Decision:

- The first implementation slice should be API-only.
- Admin UI changes should be deferred until the trigger, validation, async handoff, duplicate handling, audit logging, and smoke checks are proven safe.
- Existing Discovery admin UI can already display runs, queue candidates, sources, details, evidence, duplicate candidates, and audit events when data exists.

Rationale:

- API-only first is safer and keeps the implementation surface small.
- The existing Admin Discovery views are sufficient for initial verification of run history and queue results.
- Deferring UI avoids mixing crawler execution risk with responsive/admin UX risk.

Future UI condition:

- If Admin UI is included later, responsive QA must cover Desktop, Tablet/iPad, and Mobile.
- UI must show a source/risk/limit summary, confirmation before run, run ID, status, candidate count, and safe failure reason.
- UI must poll or refresh `discovery_runs`; it must not wait on a long-running trigger request.

## Dedicated Rate-Limit Action

Decision:

- Add a dedicated admin rate-limit action for manual crawler run creation in the future implementation.
- Recommended action name: `discoveryManualCrawlerRun`.
- Do not reuse unrelated manual intake limits.

Rationale:

- Manual intake creates one admin-entered candidate.
- Manual crawler run creation can enqueue or execute multiple reviewed URLs.
- A dedicated action keeps limits auditable and avoids accidental weakening or over-tightening of existing intake behavior.

Recommended initial policy:

- 10 manual crawler run trigger attempts per 10 minutes per admin actor label or fallback IP.
- Keep this separate from candidate count limits of 5-10 URLs initially and 20 URLs maximum while validating.

## Final Implementation Readiness Checklist

Before Phase 6O coding begins, all of the following must be true:

- Schema compatibility decision documented.
- Async handoff decision documented.
- Stuck-run recovery decision documented.
- Per-URL policy storage decision documented.
- UI scope decision documented.
- Dedicated rate-limit action required.
- Scheduled automation remains locked.
- All candidates still go to Discovery Queue.
- No direct insert into `public.tools`.

## Final Approval Gate

Manual crawler prototype implementation may not begin until this Phase 6N decision record is reviewed and approved by ChatGPT and Gemini.
