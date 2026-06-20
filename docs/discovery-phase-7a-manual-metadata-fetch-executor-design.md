# Phase 7A — Manual Metadata Fetch Executor Design

## Status

Planning only. This document does not authorize implementation.

Phase 7A requires Gemini review and explicit approval before any application code,
tests, scripts, schema, migration, API behavior, or package files are changed.

## Purpose

Phase 6Z is complete at commit `b7ef773`. It added the authenticated,
metadata-only `metadata_fetch_smoke` mode to
`POST /api/admin/discovery/runs/manual/claim`. That mode proves the complete
safety path for exactly one approved manual curated URL.

Phase 7A is the next deliberately small step: allow an administrator to run a
controlled, manual batch of metadata-only fetches from one already-approved
manual curated source. It is an executor expansion, not a crawler expansion.

The purpose is to validate safe bounded batch behavior while preserving all
current protections and without extracting, interpreting, storing, or acting on
page content.

## Scope and Safety Boundary

The proposed executor remains subject to all of these non-negotiable rules:

- Admin-only endpoint access, using the existing verified admin-session path.
- Existing CSRF verification is required before any claim or execution.
- Existing `discoveryManualCrawlerExecutorRun` rate limiting remains required;
  it must run before the request is accepted for execution.
- One claimed run for one manual source only. The request must never accept or
  enumerate multiple source IDs.
- The source must pass the existing `validateManualCrawlerSource` rules:
  active `manual` source type, `manual_curated_urls` kind, approved status,
  low risk level, and per-URL policy review required before fetch.
- URLs remain HTTPS-only and must pass the existing URL safety and
  request-plan preflight protections before any adapter call.
- Reuse the existing SSRF, DNS resolution, private/reserved IP rejection,
  DNS-rebinding defense, connection pinning, timeout, redirect, response-size,
  and content-type protections. Phase 7A must not implement an alternate
  fetch path or weaker duplicate validation.
- Fetch metadata only. The executor must neither read page data into an
  application representation nor derive fields from it.

The following remain explicitly prohibited:

- extraction, HTML parsing, title/description parsing, or candidate-field
  derivation;
- LLM analysis, AI enrichment, ranking, or duplicate detection;
- scheduler, cron, worker, background queue, or automatic retry;
- `discovered_tools` insert, `public.tools` insert, or automatic approval;
- raw HTML, response-body, screenshot, browser-rendering, or cookie storage;
- recursive crawling, sitemap/robots fetching, link following, redirects, or
  multi-source execution.

Existing per-URL policy-review records may continue to be validated as manual
eligibility data. Phase 7A must not fetch or parse `robots.txt`, a sitemap, or
any linked resource.

## Proposed Execution Mode

Add one explicit opt-in mode:

```json
{ "execution_mode": "manual_metadata_fetch" }
```

It must remain distinct from both current modes:

| Mode | Purpose | Fetch cardinality | Fetch permitted |
| --- | --- | ---: | --- |
| omitted / `dry_run` | Existing preflight-only executor validation | 0 | No |
| `metadata_fetch_smoke` | Phase 6Z authenticated smoke path | exactly 1 | Yes |
| `manual_metadata_fetch` | Phase 7A controlled manual executor | 1–3 | Yes |

The separation is required so an existing request never begins fetching merely
because the endpoint gains a new capability. It also preserves Phase 6Z as a
single-URL smoke regression test rather than silently changing its scope.

An unrecognized `execution_mode` must return HTTP 400 with a generic safe
error. It must not claim the run, perform a preflight fetch, or expose internal
implementation details.

## Claim Endpoint Behavior

The only proposed execution surface is the existing endpoint:

`POST /api/admin/discovery/runs/manual/claim`

The endpoint behavior should be:

1. Verify the admin session, CSRF token, request format and size, and existing
   admin executor rate limit.
2. Parse `run_id` and `execution_mode`. An absent mode remains the existing
   `dry_run`/preflight behavior; `metadata_fetch_smoke` remains exactly one
   URL; `manual_metadata_fetch` enables only the Phase 7A bounded path.
3. Load one pending run and its one associated source. Preserve the existing
   source eligibility, stale-run recovery, and atomic pending-to-running claim
   protections.
4. Build request plans from the existing approved manual curated URL records.
   Every URL must pass the existing preflight before any adapter invocation.
   A preflight failure rejects the complete batch before network activity; this
   includes the case where every requested URL is rejected.
5. For `manual_metadata_fetch`, require 1–3 preflighted plans. A plan count
   above the cap returns HTTP 422 with a fixed safe reason such as
   `manual_metadata_fetch_url_cap_exceeded`, records a safe audit failure, and
   performs no fetch. It must never execute only the first three URLs.
6. Atomically claim the run, write the start audit event, then execute the
   already-preflighted plans sequentially through the existing metadata-only
   fetch adapter. Sequential execution keeps concurrency, connection count,
   duration, and audit ordering bounded.
7. Record a safe result for each adapter outcome. Adapter exceptions and
   failures must be converted to a closed set of status/reason codes; do not
   return or persist a raw exception message, response body, or header set.
8. Finalize the run using the policy below and write the relevant completion
   or failure audit event. There is no retry, continuation, new source lookup,
   or follow-on execution.

## Conservative Batch Limits

Phase 7A starts with these fixed limits:

- Maximum 3 URLs per claimed run.
- Minimum 1 URL per `manual_metadata_fetch` run.
- Existing 10-second timeout per URL.
- Existing 1 MB response-size cap per URL.
- Redirect limit remains zero; redirects are failures and are never followed.
- Existing strict accepted content types remain unchanged.

The existing manual-run intake limit of 20 URLs does not authorize fetch
execution of 20 URLs. A Phase 7A executor claim against such a run must reject
it before fetching rather than truncate it.

## Proposed `discovery_runs.stats` Schema

For a claimed `manual_metadata_fetch` run that reaches adapter execution, the
stats must contain this safe shape in addition to existing run identifiers and
preflight state:

```json
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
      "resolved_ip_family": 4,
      "bytes_read": 1256,
      "response_truncated": false,
      "duration_ms": 143,
      "error_code": null,
      "failure_reason": null
    }
  ]
}
```

`fetched_urls + failed_urls + skipped_urls` must equal `total_urls`. The
executor must append exactly one safe result for each adapter-invoked URL.
`fetched_urls` counts successful metadata-only adapter results; `failed_urls`
counts adapter failures; and `skipped_urls` remains zero in the normal
all-preflighted sequential flow.

For an all-or-nothing preflight rejection, preserve the truthful exception:

- `status = failed` and `reason = rejected_preflight`;
- `no_fetch_performed = true`;
- `fetched_urls = 0`;
- no adapter result is represented as a successful fetch.

For a rejected over-cap request, keep `no_fetch_performed = true` and do not
write synthetic fetch results for URLs that were never passed to the adapter.

`error_code` is nullable and may contain only a short allowlisted/sanitized
adapter code, for example an uppercase code matching `^[A-Z0-9_]{1,80}$`.
`failure_reason` is nullable and must be a fixed application-owned enum (for
example `dns_resolution_failed`, `blocked_resolved_ip`, `request_timeout`,
`redirect_not_allowed`, `unsupported_content_type`, `response_too_large`,
`network_error`, or `adapter_failure`). It must never contain an exception
message, URL credentials, query-derived content, or body text.

The executor must not add any of the following to run stats or audit metadata:

- raw HTML or response body/text;
- extracted title, description, candidate, or tool fields;
- screenshots, browser-rendered content, cookies, authorization data, tokens,
  CSRF values, admin-cookie data, or environment values;
- request or response headers. At most, the normalized accepted
  `content_type` and a strictly numeric content length may be retained if a
  later review explicitly needs them; Phase 7A does not require the latter;
- raw resolved IP address (the IP family is sufficient).

## Audit Events

Phase 7A should add or use these safe event names:

- `manual_metadata_fetch_started`
- `manual_metadata_fetch_url_completed`
- `manual_metadata_fetch_url_failed`
- `manual_metadata_fetch_completed`
- `manual_metadata_fetch_failed`

All events retain the existing run ID, source ID, admin actor, and common
safety flags. URL-level event metadata must be limited to a URL ordinal,
hostname, adapter status, nullable HTTP status, accepted content type, IP
family, byte count, duration, and sanitized error code/reason. Do not add raw
content, body-derived fields, raw headers, cookies, credentials, tokens, or
environment data.

The terminal `manual_metadata_fetch_completed` event is used when one or more
URLs succeed, even if the result has failures. The terminal
`manual_metadata_fetch_failed` event is used when no URLs succeed after
adapter execution or when the mode-specific cap is rejected. Existing
`request_plan_preflight_*` events continue to describe a rejection that occurs
before the manual metadata fetch executor starts.

## Run Completion and Failure Policy

- If request-plan preflight rejects the batch before an adapter call, mark the
  run `failed` with the safe reason `rejected_preflight`; no network fetch is
  performed.
- If one or more adapter fetches succeed, mark the run `completed`, preserve
  the exact `fetched_urls`, `failed_urls`, and `skipped_urls` counts, and
  record partial failures safely per URL.
- If no adapter fetch succeeds because every adapter result fails, mark the run
  `failed` with a fixed safe terminal reason such as
  `manual_metadata_fetch_all_failed`. Preserve only the sanitized per-URL
  result fields described above.
- Never retry automatically. A later operator action must create or explicitly
  claim a new eligible run after investigating the safe recorded outcome.
- Never execute beyond the validated three-URL cap, never continue to a second
  source, and never follow a redirect or discovered link.

## Testing Plan

Future implementation must add focused unit coverage for the mode parsing,
three-URL cap, result sanitization/counting, and terminal status selection. It
must retain and pass the existing request-plan, URL-safety, fetch-adapter, and
admin rate-limit coverage.

Authenticated smoke coverage must run against the existing admin, CSRF, and
rate-limited flow and include all of the following:

1. Existing Phase 6V dry-run smoke still passes:
   `node scripts/smoke-discovery-preflight-validator.mjs`.
2. Existing Phase 6Z single-URL metadata-fetch smoke still passes:
   `node scripts/smoke-discovery-metadata-fetch.mjs`.
3. `manual_metadata_fetch` succeeds with one approved, public HTTPS URL.
4. `manual_metadata_fetch` succeeds with a two-URL batch and with a
   three-URL batch, recording one safe result per URL.
5. A run above the three-URL cap is rejected with no adapter invocation,
   no partial execution, and a safe audit failure.
6. An unsafe/private-IP URL is rejected by preflight before adapter fetch or
   network activity.
7. An injected or controlled adapter failure records only the allowed safe
   result fields and no raw content, headers, error message, or secrets.
8. For every success, partial failure, and all-failure case, verify that the
   `discovered_tools` and `public.tools` counts are unchanged.

The implementation verification set should also include TypeScript checking,
`npm run check`, `git diff --check`, and a forbidden-pattern scan confirming
that the new mode adds no extraction, LLM, scheduler/cron/worker, candidate
insert, or public-tool insert behavior.

## Gemini Review Gate

Gemini must review and approve this docs-only Phase 7A plan before
implementation starts. Approval must specifically cover:

- the distinct `manual_metadata_fetch` execution mode;
- the all-or-nothing preflight policy and three-URL cap;
- reuse of existing authentication, CSRF, rate-limit, SSRF/DNS/IP, and fetch
  adapter protections;
- the run stats schema, sanitized error vocabulary, audit event names, and
  completion policy;
- the proposed unit and authenticated smoke coverage; and
- confirmation that no extraction, storage, candidate creation, or automation
  is introduced.

## Non-Goals

Phase 7A does not include:

- extraction;
- candidate creation;
- duplicate detection;
- ranking;
- AI enrichment;
- admin UI changes unless separately approved;
- scheduler or worker execution.

It also does not change the Supabase schema, database constraints, API routes
other than a future approved extension of the existing claim endpoint,
authentication, security logic, or public discovery behavior.
