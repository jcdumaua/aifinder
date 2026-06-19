# Phase 6U — Fetch-Disabled Request Builder / Preflight Validator Plan

## Status

Phase 6U implementation planning draft.

This phase may plan a fetch-disabled request builder and URL preflight validator.

This phase must still perform zero network requests.

## Goal

Build the smallest safe next crawler capability:

- Validate a manual curated URL source.
- Validate the target URL.
- Produce a safe request plan.
- Store request-plan evidence only in dry-run stats or audit metadata.
- Perform no HTTP fetch.
- Perform no extraction.
- Perform no LLM analysis.
- Insert nothing into discovered_tools.
- Insert nothing into public.tools.

## Approved Foundation

Phase 6T was reviewed by Gemini / Antigravity CLI and approved.

Gemini approved the next direction:

Phase 6U — Fetch-Disabled Request Builder / Preflight Validator

## Non-Goals

Phase 6U must not add:

- Real fetch
- axios
- fetch
- HTML parsing
- scraping
- LLM analysis
- scheduler / cron
- background worker
- discovered_tools insert
- public.tools insert
- automatic publishing
- public/non-admin crawler access

## Proposed Implementation Shape

Phase 6U should add deterministic validation helpers, likely under:

- lib/discovery-url-safety.ts
- lib/discovery-request-plan.ts

The existing endpoint may call the validator during the dry executor claim flow:

- app/api/admin/discovery/runs/manual/claim/route.ts

The endpoint should still complete as a dry run.

## URL Safety Rules

The validator should reject:

- Empty URLs
- Invalid URLs
- Non-HTTPS URLs
- localhost hostnames
- loopback addresses
- private IPv4 ranges
- private IPv6 ranges
- link-local addresses
- internal metadata addresses such as 169.254.169.254
- file URLs
- data URLs
- javascript URLs
- mailto URLs
- URLs with username/password credentials
- URLs with unsupported protocols

The validator should allow only:

- https:// URLs
- public hostnames
- public IPs only if not private/reserved
- normalized URL output

## Request Plan Output

The request plan may include safe metadata only:

- normalizedUrl
- hostname
- protocol
- method: GET
- fetchDisabled: true
- noNetworkRequestPerformed: true
- timeoutMs planned value
- redirectLimit planned value
- responseSizeLimitBytes planned value
- userAgent planned value
- createdAt timestamp

The request plan must not include:

- cookies
- credentials
- auth headers
- secrets
- raw environment variables
- response body
- fetched HTML
- extracted metadata

## Dry-Run Stats Requirements

Phase 6U should preserve existing dry-run safety fields and may add request-plan evidence.

Required safety fields:

- dry_run: true
- no_fetch_performed: true
- no_extraction_performed: true
- no_llm_analysis_performed: true
- no_candidates_inserted: true
- no_public_tools_inserted: true

## Audit Requirements

The implementation should add audit visibility for:

- request_plan_preflight_started
- request_plan_preflight_passed
- request_plan_preflight_rejected

Audit metadata must be safe and must not include secrets.

## Failure Behavior

If URL validation fails:

- Do not fetch.
- Do not extract.
- Do not insert candidates.
- Mark the dry run as failed or completed with rejected preflight, depending on existing run semantics.
- Record an audit event with rejection reason.
- Return a safe admin response.

## Test / Smoke Requirements

Phase 6U verification should include:

Valid cases:

- https://example.com
- https://www.example.com/path?query=1

Rejected cases:

- http://example.com
- ftp://example.com
- file:///etc/passwd
- data:text/html,test
- javascript:alert(1)
- mailto:test@example.com
- https://localhost
- https://127.0.0.1
- https://0.0.0.0
- https://10.0.0.1
- https://172.16.0.1
- https://192.168.1.1
- https://169.254.169.254
- https://[::1]
- URL containing username/password credentials

Smoke test must verify:

- admin-only access still works
- CSRF still works
- rate limit still exists
- dry run still completes safely
- invalid URL cannot trigger fetch
- no network request occurs
- no discovered_tools insert
- no public.tools insert
- npm run check passes

## Required Gemini Gate

Before implementation begins, Gemini should review this Phase 6U plan.

Gemini must confirm:

- URL safety rules are sufficient for a fetch-disabled validator.
- Request-plan output is safe.
- Audit metadata is safe.
- Failure behavior is acceptable.
- No real fetch is approved.

## Final Gate

Allowed after approval:

- Implement fetch-disabled preflight validator only.

Still not allowed:

- Real fetch
- Extraction
- LLM analysis
- Scheduler / worker
- discovered_tools insert
- public.tools insert
