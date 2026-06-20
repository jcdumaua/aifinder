# Phase 7B — Manual Metadata Fetch Executor Implementation Plan

## 1. Purpose

Phase 7B converts the approved Phase 7A manual metadata fetch executor design into a safe implementation checklist for Phase 7C.

Phase 6Z proved that AiFinder can perform one authenticated, admin-only, SSRF-protected, metadata-only fetch through the manual claim endpoint using `execution_mode: "metadata_fetch_smoke"`.

Phase 7A approved the next direction: a controlled manual metadata fetch executor mode that can process a tiny capped batch of curated manual URLs while still avoiding extraction, AI analysis, background work, and database candidate insertion.

Phase 7B does not implement runtime behavior. It defines the exact implementation boundaries, file scope, stats schema, audit events, smoke tests, and verification gates for Phase 7C.

## 2. Files Expected to Change in Phase 7C

Expected runtime implementation files:

- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `scripts/smoke-discovery-manual-metadata-fetch.mjs`
- `testing/discovery-fetch-adapter.test.mjs` only if existing helper coverage needs small additions
- Optional focused tests only if manual metadata fetch logic is extracted into helpers

Files that should not change in Phase 7C:

- No Supabase migrations
- No schema changes
- No package dependency changes
- No admin UI pages
- No public API routes
- No homepage/category/tool UI files
- No `discovered_tools` insertion logic
- No `public.tools` insertion logic

## 3. Execution Mode Behavior

The manual claim endpoint should support three explicit behavior paths.

### Missing execution_mode

When `execution_mode` is absent, the endpoint must preserve the existing dry-run/preflight behavior.

Expected behavior:

- Build request plans.
- Validate URLs using existing preflight checks.
- Do not fetch.
- Keep `dry_run: true`.
- Keep `no_fetch_performed: true`.
- Keep Phase 6V smoke behavior unchanged.

### execution_mode: "metadata_fetch_smoke"

This mode must preserve the Phase 6Z one-URL metadata fetch smoke path.

Expected behavior:

- Require exactly one URL/request plan.
- Perform one metadata-only fetch.
- Preserve Phase 6Z stats and audit behavior.
- Keep existing Phase 6Z smoke script passing.

### execution_mode: "manual_metadata_fetch"

This is the new Phase 7C executor mode.

Expected behavior:

- Require at least one URL/request plan.
- Allow a maximum of 3 URLs/request plans.
- Require all URLs to pass request-plan preflight before any fetch occurs.
- Fetch sequentially only.
- Store safe per-URL metadata only.
- Never store raw body content.
- Never extract candidate data.
- Never insert into `discovered_tools`.
- Never insert into `public.tools`.

### Unknown execution mode

Any unknown `execution_mode` must return HTTP 400 with a safe error.

The response must not expose stack traces, secrets, tokens, cookies, or environment values.

## 4. Batch Rules

Phase 7C should use intentionally conservative limits.

Required rules:

- `manual_metadata_fetch` must require at least 1 request plan.
- `manual_metadata_fetch` must reject more than 3 request plans.
- All request plans must pass preflight before any fetch starts.
- If any URL fails preflight, no fetch should occur.
- Fetches must be sequential.
- No parallel fetching in Phase 7C.
- No redirects.
- Timeout remains 10 seconds per fetch.
- Response size cap remains 1 MB.
- Accepted content types remain those defined by the existing fetch adapter.
- Existing HTTPS-only validation remains required.
- Existing SSRF, DNS, IP, and DNS-pinning protections must be reused.

Recommended constants:

- `MANUAL_METADATA_FETCH_EXECUTION_MODE = "manual_metadata_fetch"`
- `MANUAL_METADATA_FETCH_MAX_URLS = 3`

## 5. Run Status Behavior

Phase 7C should use simple and predictable run status rules.

### Preflight failure before fetch

If one or more URLs fail request-plan preflight before any fetch occurs:

- No fetch is performed.
- Run status should become `failed`.
- Safe failure reason should be `rejected_preflight`.
- Stats should keep `no_fetch_performed: true`.
- Audit should record a safe failure event.
- No raw URL secrets, cookies, headers, or environment values should be logged.

### At least one successful metadata fetch

If one or more fetches complete successfully:

- Run status should become `completed`.
- Partial adapter failures should be counted in stats.
- Successful and failed fetches should both have safe per-URL result records.
- No automatic retries should occur.

### Zero successful metadata fetches after adapter calls

If all URLs pass preflight but all adapter calls fail safely:

- Run status should become `failed`.
- Safe failure reason should indicate metadata fetch failure.
- Stats should include total and failed URL counts.
- Error codes and failure reasons must be sanitized.
- No response body or raw target content should be stored.

### Atomic claim behavior

The existing atomic pending-to-running claim behavior must remain unchanged.

The endpoint should claim the run before execution, then complete or fail the claimed run based on the rules above.

No automatic retry should be introduced in Phase 7C.

## 6. Stats Schema

Phase 7C should store a safe `discovery_runs.stats` object for `manual_metadata_fetch`.

Proposed shape:

    {
      "executor_mode": "manual_metadata_fetch",
      "dry_run": false,
      "execution_enabled": true,
      "no_fetch_performed": false,
      "no_extraction_performed": true,
      "no_llm_analysis_performed": true,
      "no_candidates_inserted": true,
      "no_public_tools_inserted": true,
      "total_urls": 3,
      "fetched_urls": 2,
      "failed_urls": 1,
      "skipped_urls": 0,
      "fetch_results": [
        {
          "normalized_url": "https://example.com/",
          "hostname": "example.com",
          "status": "fetch_completed_metadata_only",
          "http_status": 200,
          "content_type": "text/html",
          "content_length_header": null,
          "resolved_ip_family": 4,
          "bytes_read": 559,
          "response_truncated": false,
          "duration_ms": 44,
          "error_code": null,
          "failure_reason": null
        }
      ]
    }

Each `fetch_results` record may contain only:

- `normalized_url`
- `hostname`
- `status`
- `http_status`
- `content_type`
- `content_length_header`
- `resolved_ip_family`
- `bytes_read`
- `response_truncated`
- `duration_ms`
- `error_code`
- `failure_reason`

The following must never be stored in stats:

- Raw HTML
- Response body
- Title
- Description
- Extracted text
- Candidate fields
- Tool name guesses
- Raw headers except content type and content length
- Cookies
- Admin cookie
- CSRF token
- Environment variables
- API keys
- Secrets
- Auth tokens
- Full stack traces

## 7. Audit Events

Phase 7C should add safe audit events for the manual metadata fetch path.

Recommended event names:

- `manual_metadata_fetch_started`
- `manual_metadata_fetch_url_completed`
- `manual_metadata_fetch_url_failed`
- `manual_metadata_fetch_completed`
- `manual_metadata_fetch_failed`

Audit metadata must be safe and small.

Allowed audit metadata examples:

- `run_id`
- `source_id`
- `executor_mode`
- `total_urls`
- `fetched_urls`
- `failed_urls`
- `normalized_url`
- `hostname`
- `status`
- `http_status`
- `content_type`
- `resolved_ip_family`
- `duration_ms`
- `error_code`
- `failure_reason`

Audit metadata must not include:

- Raw response body
- Raw HTML
- Extracted text
- Cookies
- Admin cookie
- CSRF token
- Environment variables
- Secrets
- Raw request headers
- Raw response headers except content type/content length
- Stack traces

## 8. Smoke Script Plan

Phase 7C should add:

- `scripts/smoke-discovery-manual-metadata-fetch.mjs`

The smoke script should require:

- Local app running
- `AIFINDER_ADMIN_COOKIE` exported
- Supabase environment configured

The smoke script should:

1. Create a CSRF token.
2. Count existing `discovered_tools`.
3. Count existing `public.tools`.
4. Create an approved manual curated source with 1 to 3 safe URLs.
5. Create a pending discovery run.
6. Call the manual claim endpoint with `execution_mode: "manual_metadata_fetch"`.
7. Verify the run completes when at least one URL fetch succeeds.
8. Verify safe stats shape.
9. Verify every fetch result is metadata-only.
10. Verify no raw body, HTML, title, description, extracted text, or candidate fields are stored.
11. Verify required audit events exist.
12. Verify `discovered_tools` count is unchanged.
13. Verify `public.tools` count is unchanged.
14. Clean up all smoke data.

The script should include separate checks for:

- One valid URL
- Two to three safe URLs
- Over-cap rejection
- Unsafe/private IP URL rejection before fetch
- Adapter failure recorded as safe metadata only

If public URLs are unreliable, over-cap and unsafe preflight checks may be isolated from live fetch checks, but they must still verify no inserts and cleanup.

## 9. Test Plan

Phase 7C verification must include:

- Existing Phase 6V preflight validator smoke still passes.
- Existing Phase 6Z metadata fetch smoke still passes.
- New Phase 7C manual metadata fetch smoke passes.
- URL safety focused tests still pass.
- Request plan focused tests still pass.
- Fetch adapter focused tests still pass.
- `tsc --noEmit` passes.
- `npm run check` passes.
- `git diff --check` passes.
- Forbidden scan passes.

Suggested forbidden scan terms:

- `discovered_tools` insert
- `public.tools` insert
- `openai`
- `anthropic`
- `gemini`
- `generateText`
- `generateObject`
- `scheduler`
- `cron`
- `worker`
- `cheerio`
- `jsdom`
- `playwright`
- `puppeteer`

If Phase 7C extracts helper functions for stats or audit building, focused tests should cover:

- Manual metadata fetch stats success
- Partial failure stats
- All adapter failure stats
- Over-cap rejection
- Preflight rejection before fetch
- Safety flags always true

## 10. Implementation Slice Recommendation

Recommended Phase 7C order:

### A. Add constants and helper builders

Add constants for:

- Manual metadata fetch execution mode
- Maximum URL count
- Audit event names
- Safe failure reasons

Add helpers for:

- Safe per-URL fetch result mapping
- Manual metadata fetch stats
- Manual metadata fetch audit metadata
- Batch cap validation

### B. Add execution_mode branch

Extend the existing execution mode handling in the manual claim endpoint:

- Missing mode remains dry-run/preflight.
- Existing smoke mode remains unchanged.
- New manual mode enters capped batch logic.
- Unknown mode returns 400.

### C. Add capped sequential adapter loop

For `manual_metadata_fetch`:

- Validate count minimum and maximum.
- Run all preflight checks before fetching.
- Fetch sequentially.
- Record each safe result.
- Never store body content.

### D. Add safe stats and audit handling

Add manual metadata fetch run completion and failure paths.

Ensure stats and audit metadata are safe, small, and body-free.

### E. Add smoke script

Create:

- `scripts/smoke-discovery-manual-metadata-fetch.mjs`

The script should test success, cap rejection, unsafe preflight rejection, no inserts, and cleanup.

### F. Run full verification

Run all focused tests, TypeScript, full check, smoke tests, diff check, and forbidden scan.

### G. Gemini review before commit

Do not commit Phase 7C until Gemini approves the uncommitted implementation diff.

## 11. Non-Goals

Phase 7C must not include:

- Extraction
- HTML parsing
- Candidate creation
- Duplicate detection
- Ranking
- AI enrichment
- LLM calls
- Admin UI changes
- Scheduler
- Cron
- Worker
- Database migrations
- Public API changes
- Browser rendering
- Screenshots
- Recursive crawling
- Sitemap parsing
- Robots parsing
- Link following
- Raw HTML storage
- Response body storage

## 12. Gemini Gate

Phase 7B must be reviewed and approved by Gemini before Phase 7C implementation starts.

Phase 7C must also receive Gemini review before commit and push.

Implementation must not begin until Phase 7B is committed and pushed.
