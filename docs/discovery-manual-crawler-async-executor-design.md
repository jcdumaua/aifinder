# AiFinder Manual Crawler Async Executor Design

## Phase 6Q Status

Phase 6Q is a design/review phase only.

No async executor implementation, fetch/extract logic, scheduled crawler automation, `discovered_tools` insertion, or `public.tools` insertion is approved by this document.

## Current State

Phase 6O added the manual crawler trigger scaffold in `POST /api/admin/discovery/runs/manual`.

The trigger endpoint currently:

- Validates admin authentication.
- Requires a valid admin CSRF token.
- Applies the dedicated `discoveryManualCrawlerRun` admin rate limit.
- Validates the request body and source ID.
- Requires the source to use `source_type = 'manual'`.
- Requires source config `kind = 'manual_curated_urls'`.
- Requires source config `approval_status = 'approved_for_first_manual_prototype'`.
- Requires source config `risk_level = 'low'`.
- Requires per-URL policy review before fetch eligibility.
- Blocks concurrent `pending` or `running` runs for the same source.
- Creates one `discovery_runs` row with `status = 'pending'`.
- Stores run stats with `execution_enabled: false`.
- Records a safe audit event with `action = 'flag'` and run/source metadata.
- Returns a safe run summary quickly.

Execution remains disabled in the run stats:

```json
{
  "execution_enabled": false,
  "execution_status": "awaiting_approved_async_executor",
  "no_fetch_performed": true,
  "no_candidates_inserted": true,
  "no_public_tools_inserted": true
}
```

Phase 6P authenticated API smoke testing passed. Actual fetch/extract execution remains locked. Scheduled crawler automation remains locked. Direct `public.tools` insertion remains locked. `discovered_tools` insertion from crawler execution remains locked until executor and fetch design are separately approved.

## Design Goal

Define the smallest safe async executor primitive that can later claim pending manual crawler runs.

The first primitive should validate the durable handoff model only:

- Admin creates a pending run through the existing trigger endpoint.
- A separately approved admin-controlled executor claims exactly one eligible pending run.
- The executor transitions that run from `pending` to `running`.
- The executor records safe metadata and exits without crawling.

This first executor must stay admin-controlled and non-scheduled. It must not become a fully automated crawler, background fetcher, queue processor, or scheduled job.

## Executor Scope

The first executor may only:

- Find eligible pending manual crawler runs.
- Claim one run safely.
- Transition status from `pending` to `running`.
- Respect stuck-run protection.
- Record audit metadata.
- Exit safely on invalid, stale, or already-claimed run state.
- Complete the dry executor validation by marking the run with a safe dry-run outcome once claim behavior is proven.

The first executor must not:

- Fetch URLs.
- Parse pages.
- Extract tool metadata.
- Insert `discovered_tools`.
- Insert `public.tools`.
- Run on a schedule.
- Run as fire-and-forget work inside the trigger request.
- Use `setTimeout`, unawaited promises, or request-lifecycle background work as fake async behavior.

## Recommended Execution Model

### Option 1: Admin-Only Manual Executor API Endpoint

An admin-only API endpoint could claim one eligible pending manual crawler run per request. It would reuse the existing Next.js admin route model: admin session, CSRF, service-role Supabase access, no-store responses, and safe JSON error handling.

Benefits:

- Closest to existing project patterns.
- Can enforce admin session and CSRF.
- Can use a dedicated executor rate-limit action.
- Can be manually triggered and observed without scheduling.
- Keeps execution separate from the existing trigger request.

Risks:

- Requires a new API route in a future implementation phase.
- Needs careful database-safe claim logic to prevent double processing.
- Must avoid becoming a long-running crawler endpoint when fetch/extract is later designed.

### Option 2: Local Admin-Only Script

A local script could claim one pending run using service-role credentials from the admin development environment.

Benefits:

- Small implementation surface.
- Useful for local validation before any production-facing executor endpoint exists.
- Easy to keep non-scheduled.

Risks:

- Does not naturally enforce admin session or CSRF.
- Can drift from production route behavior.
- Requires careful environment handling to avoid exposing secrets.
- Is less useful for controlled admin verification in deployed environments.

### Option 3: Vercel Background/Cron

A Vercel background or cron model could process pending runs without manual admin clicks.

Benefits:

- Better fit for future automation after the crawler is proven safe.
- Can run outside the trigger request lifecycle.

Risks:

- Scheduled automation is explicitly locked.
- Too broad for the first executor validation step.
- Higher blast radius if claim logic, stale recovery, or fetch gates are wrong.

### Option 4: Supabase Edge Function

A Supabase Edge Function could claim and process runs near the database boundary.

Benefits:

- Could become a clean server-side execution primitive later.
- Can isolate crawler execution from the Next.js app.

Risks:

- Introduces another runtime and deployment path.
- Needs separate auth, secret handling, logging, and review.
- Too much infrastructure for a dry claim-only executor.

### Option 5: External Queue/Worker

An external queue or worker could eventually provide durable processing, retries, and observability.

Benefits:

- Best long-term fit for robust crawler execution.
- Supports queue semantics and worker isolation.

Risks:

- Too much infrastructure for the first prototype.
- Adds dependency and operational complexity before fetch/extract is approved.
- Could prematurely normalize automated crawling.

### Recommendation

The safest minimal first step is an admin-only manual executor API endpoint that claims exactly one pending manual crawler run and performs only dry executor validation.

A local admin-only script is acceptable as a temporary local validation alternative if the team wants to prove the database claim sequence before exposing an admin API route. The script should not replace the reviewed admin endpoint model for deployed validation because it cannot naturally enforce admin session and CSRF.

The first executor should be treated as a controlled handoff validation step. It must not fetch, extract, insert candidates, publish tools, or schedule itself.

## Claiming Rules

The executor may claim a run only when all of these are true:

- The run has `status = 'pending'`.
- The run belongs to a source with `source_type = 'manual'`.
- The source config has `kind = 'manual_curated_urls'`.
- The source config has `approval_status = 'approved_for_first_manual_prototype'`.
- The source config has `risk_level = 'low'`.
- The source requires per-URL policy review before fetch.
- The run stats have `execution_enabled = false` for dry executor validation, unless a later phase explicitly enables execution.
- The run stats show `no_fetch_performed = true`, `no_candidates_inserted = true`, and `no_public_tools_inserted = true`.
- No non-stale `running` run exists for the same source.
- No unexpected duplicate active run state exists for the same source when applicable.

The executor should reject or safely exit when:

- The run does not exist.
- The run is not `pending`.
- The source is missing, inactive, or no longer eligible.
- The source config changed after trigger creation and is no longer approved low risk.
- The run stats indicate execution is already enabled without a separately approved phase.
- Another executor already claimed the run.
- The run is stale, malformed, or missing required safe metadata.

Claiming must be database-safe to avoid double processing. The preferred claim operation is an atomic conditional update:

```sql
update discovery_runs
set
  status = 'running',
  started_at = now(),
  updated_at = now()
where id = :run_id
  and status = 'pending'
returning id, source_id, status, stats, error_log, started_at, finished_at, created_at, updated_at;
```

If the update returns no row, the executor must treat the claim as rejected because the run was missing, stale, or already claimed. It must not retry blindly.

For a "claim next eligible run" flow, the executor should first select a small ordered candidate set, validate source eligibility, then claim exactly one run with the atomic `id` and `status = 'pending'` update. If two executors race, only the update that returns a row may continue.

## Stuck-Run Recovery

`running` manual crawler runs older than 30 minutes should be treated as stale.

Recovery should be admin-controlled and performed only as part of an explicit executor action or reviewed recovery action. It is not scheduled crawler automation unless a later phase explicitly approves scheduling.

Before claiming a new run for a source, the executor should check for stale `running` runs for that source. A stale run should transition to `failed` with safe metadata:

- `status = 'failed'`
- `finished_at = now()`
- `updated_at = now()`
- `error_log = 'Manual crawler run exceeded timeout threshold.'`
- `stats.recovered_from_stale_running = true`
- `stats.recovery_reason = 'timeout'`
- `stats.timeout_minutes = 30`
- `stats.recovered_at = <ISO timestamp>`
- `stats.no_fetch_performed` preserved when true
- `stats.no_candidates_inserted` preserved when true
- `stats.no_public_tools_inserted` preserved when true

Recovery must be audited. Recovery must not delete runs, delete candidates casually, retry automatically, or bypass admin review.

## Audit Requirements

Use the existing `discovery_audit_events` schema safely:

- `discovered_tool_id` may be `null`.
- `action` should use an existing compatible value such as `flag` unless a schema change is separately approved.
- `actor_id` and `actor_label` should come from the verified admin actor when an admin API endpoint is used.
- `metadata` must include `run_id`, `source_id`, and `event_type`.
- Metadata must not include secrets, cookies, raw HTML, screenshots, upstream bodies, stack traces, or private payloads.

Required audit event types:

- `manual_crawler_executor_claim_attempted`
- `manual_crawler_executor_claim_succeeded`
- `manual_crawler_executor_claim_rejected`
- `manual_crawler_stale_run_recovered`
- `manual_crawler_executor_dry_run_completed`
- `manual_crawler_executor_failed`

Example audit metadata:

```json
{
  "event_type": "manual_crawler_executor_claim_succeeded",
  "run_id": "00000000-0000-4000-8000-000000000000",
  "source_id": "00000000-0000-4000-8000-000000000000",
  "source_kind": "manual_curated_urls",
  "executor_mode": "dry_run",
  "execution_enabled": false,
  "no_fetch_performed": true,
  "no_candidates_inserted": true,
  "no_public_tools_inserted": true
}
```

## Rate Limiting / Admin Protection

An admin API executor must require:

- Verified admin session.
- Valid admin CSRF token.
- No public access.
- Service-role database access only on the backend.
- `Cache-Control: no-store` responses.
- Safe JSON errors with no raw database or secret leakage.

A dedicated admin rate-limit action may be needed for executor claim/run actions. It should not reuse manual intake rate limiting. It should also stay separate from the existing manual crawler trigger limit if the team wants independent control over run creation and executor claim attempts.

Suggested future action name:

- `discoveryManualCrawlerExecutorRun`

The first limit should be conservative because each request can mutate run state. A future implementation can tune this after smoke testing.

## Data Safety

The first executor validation phase must preserve these data safety guarantees:

- No raw HTML storage.
- No screenshots.
- No external fetch.
- No URL parsing beyond already stored/validated run metadata.
- No extraction.
- No `discovered_tools` insert.
- No `public.tools` insert.
- No `discovery_evidence` insert.
- No duplicate candidate insert.
- No source expansion.
- No scheduled automation.

Run stats must clearly show dry executor mode:

```json
{
  "executor_mode": "dry_run",
  "execution_enabled": false,
  "execution_status": "dry_executor_validation_completed",
  "no_fetch_performed": true,
  "no_candidates_inserted": true,
  "no_public_tools_inserted": true
}
```

If the dry executor marks a claimed run as completed, it must be clear that completion means executor validation completed, not crawler execution completed. If this distinction is too easy to misread in the Admin run history, the future implementation should either use `failed` with a safe dry-run reason or add an admin-visible stats label before use. No status migration is approved in this phase.

## Future Fetch/Extraction Gate

Fetch/extract implementation may not begin until all of these are true:

- Async executor claim/dry-run behavior is implemented and tested.
- Double-claim prevention is tested.
- Stuck-run recovery is tested.
- Audit events are verified.
- No-fetch, no-`discovered_tools`, and no-`public.tools` guarantees are verified.
- Gemini reviews the executor design.
- ChatGPT explicitly approves the fetch/extract implementation phase.

Until that gate is cleared, fetch/extract remains locked.

## Test Plan

Expected tests for the future implementation:

- Unauthorized executor request is rejected.
- Missing or invalid CSRF token is rejected.
- Invalid run ID is rejected.
- Missing run is rejected.
- Non-`pending` run is rejected.
- Ineligible source is rejected.
- Pending eligible manual run claim succeeds.
- Double claim is prevented by atomic conditional update.
- Non-stale active run for same source prevents unsafe claim.
- Running stale recovery transitions stale run to `failed`.
- Stale recovery writes safe `error_log` and stats recovery metadata.
- Claim attempt audit event is created.
- Claim success audit event is created.
- Claim rejection audit event is created.
- Stale recovery audit event is created.
- Dry executor completion audit event is created.
- No external fetch is performed.
- No `discovered_tools` rows are inserted.
- No `public.tools` rows are inserted.
- No raw HTML or screenshots are stored.
- `npm run check` passes.

Manual verification should also inspect `discovery_runs.stats` for clear dry executor metadata and inspect `discovery_audit_events.metadata` for safe run/source event data.

## Final Approval Gate

Phase 6Q is a design/review phase only. No async executor implementation, fetch/extract logic, scheduled crawler automation, `discovered_tools` insertion, or `public.tools` insertion may begin until this document is reviewed by ChatGPT and sent to Gemini if required.

## Gemini Review Addendum: Dry Executor Stats Schema

Gemini reviewed Phase 6Q and returned: Approved.

Required cleanup:
Dry executor success must be defined in `discovery_runs.stats`. AiFinder must not add temporary run statuses, overload `error_log`, or depend on an unapproved metadata column.

For Phase 6R, a successful dry executor may mark the run as `completed`, but only when the stats clearly identify it as dry executor validation, not real crawler execution.

Required dry-run success fields:

- `executor_mode: "dry_run"`
- `dry_run: true`
- `execution_enabled: false`
- `execution_status: "dry_executor_validation_completed"`
- `processed_urls: 0`
- `fetched_urls: 0`
- `extracted_candidates: 0`
- `inserted_discovered_tools: 0`
- `inserted_public_tools: 0`
- `no_fetch_performed: true`
- `no_candidates_inserted: true`
- `no_public_tools_inserted: true`
- `completed_at: <ISO timestamp>`
- `completed_by: <admin actor label or id>`

Dry executor success should not be marked as `failed`, because that would pollute failure metrics and create false dashboard alerts. No run status migration is approved in Phase 6Q.

Additional Gemini warnings to carry forward:

- Vercel function duration limits will matter before real fetch/extract work begins.
- Real crawler execution will likely need batching.
- Stale-run recovery must not be treated as approved scheduled automation yet.
- Network fetch, DOM parsing, LLM metadata analysis, scheduled triggers, `discovered_tools` insertion, and `public.tools` insertion remain locked.

Phase 6R may implement the dry executor claim endpoint after ChatGPT approval.
