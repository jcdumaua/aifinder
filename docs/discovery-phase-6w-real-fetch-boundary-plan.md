# Phase 6W — Real Fetch Design Boundary Plan

## Status

Phase 6W planning draft.

This phase is documentation-only.

No real fetch implementation is approved in this phase.

## Current Approved Foundation

AiFinder Discovery Engine has completed these safety phases:

- Phase 6T — Real fetch/extract planning and safety design.
- Phase 6U — Fetch-disabled request builder / preflight validator.
- Phase 6V — Authenticated smoke test for the fetch-disabled preflight validator.

Phase 6V verified:

- A valid manual curated URL run can pass request-plan preflight.
- A reserved/private address can fail safely with `rejected_preflight`.
- `no_fetch_performed` remains true.
- `discovered_tools` count does not change.
- `public.tools` count does not change.
- Smoke cleanup completes.

## Phase 6W Goal

Define the boundary for the first future real-fetch phase before any implementation begins.

This phase must answer:

- What is the smallest safe real-fetch capability?
- What is explicitly still forbidden?
- What must be validated before a network request?
- What happens after a response is received?
- Where may evidence be stored?
- What must not be inserted or published?
- What smoke tests are required before extraction can be planned?

## Non-Goals

Phase 6W does not approve:

- Real HTTP fetch implementation.
- HTML parsing or metadata extraction.
- LLM analysis.
- Scheduler, cron, or background worker execution.
- Insert into `discovered_tools`.
- Insert into `public.tools`.
- Automatic candidate approval.
- Public or non-admin crawler access.
- Multi-source crawling.
- Recursive crawling.
- JavaScript rendering.
- Browser automation crawling.
- Login/authenticated crawling.
- Cookie forwarding.
- User credential forwarding.

## Recommended Next Capability After Planning

The next implementation phase, if approved later, should be:

Phase 6X — Single-URL Fetch Adapter Behind Existing Preflight

This future phase should fetch exactly one URL from one already-created manual curated run after the existing Phase 6U preflight passes.

It should not extract data.

It should not insert candidates.

It should not publish tools.

It should only prove that the system can perform a constrained fetch safely and record safe fetch evidence.

## Real Fetch Boundary

A future real-fetch phase may only run after all of these checks pass:

1. Admin session is valid.
2. CSRF token is valid.
3. Dedicated executor rate limit passes.
4. Discovery source is active.
5. Discovery source is `manual`.
6. Discovery source config kind is `manual_curated_urls`.
7. Source approval status is `approved_for_first_manual_prototype`.
8. Source risk level is `low`.
9. Per-URL policy review is present.
10. Robots review is `allowed`.
11. Terms review is `allowed`.
12. Permission status is `allowed`.
13. Existing request-plan preflight passes.
14. URL is HTTPS.
15. URL has no username/password credentials.
16. URL is not localhost.
17. URL is not loopback.
18. URL is not private/reserved/internal IP space.
19. URL is not link-local.
20. URL is not metadata service address.
21. URL is not file/data/javascript/mailto or any unsupported protocol.
22. The run is still claimable by the executor.
23. No active non-stale run exists for the same source.

## First Fetch Scope

The first future fetch implementation should be limited to:

- One manual curated URL per run.
- One request attempt.
- No redirects by default.
- HTTPS only.
- `GET` only.
- No cookies.
- No auth headers.
- No request body.
- No custom user-provided headers.
- No retries initially.
- Short timeout.
- Small response size limit.
- Static user agent.
- Strict allowlist response types only: `text/html`, `text/plain`, and `application/xhtml+xml`.
- No JavaScript execution.
- No browser rendering.
- No following links.
- No sitemap crawling.
- No robots fetching inside the executor unless separately planned and approved.

## Recommended Fetch Limits

Initial safe values:

- Timeout: 10 seconds maximum.
- Redirect limit: 0.
- Response size limit: 1 MB maximum.
- Method: GET only.
- User agent: `AiFinder Discovery Engine/1.0`.
- Accepted protocols: `https:` only.
- Accepted response status: record status, but do not treat non-2xx as extraction input.
- Accepted content types: must accept only `text/html`, `text/plain`, and `application/xhtml+xml`; all other content types must be rejected before any extraction or evidence-body handling.

These values should reuse or extend the existing request-plan constants where possible.

## Redirect Policy

Initial real fetch should use redirect limit `0`.

If the server returns a redirect:

- Do not follow it.
- Record redirect status code.
- Record the safe `Location` header only if present and non-secret.
- Do not fetch the redirected URL.
- Mark fetch result as `redirect_not_followed`.
- Keep `no_extraction_performed = true`.
- Keep `no_candidates_inserted = true`.
- Keep `no_public_tools_inserted = true`.

Redirect following must be a later separately reviewed phase.

## Response Handling Boundary

A future fetch-only phase may record safe response metadata:

- URL requested.
- Normalized URL.
- Hostname.
- HTTP status code.
- Content-Type header.
- Content-Length header if present.
- Final response byte count read.
- Fetch started timestamp.
- Fetch finished timestamp.
- Timeout or failure reason.
- Whether response was truncated.
- Whether redirect was blocked/not followed.

A future fetch-only phase must not store or process:

- Extracted tool names.
- Extracted descriptions.
- Extracted pricing.
- Extracted categories.
- Screenshot evidence.
- LLM summaries.
- Parsed structured metadata.
- Candidate records in `discovered_tools`.
- Public tool records in `public.tools`.

## Evidence Storage Boundary

For the first real-fetch phase, there are two possible safe options:

### Option A — Metadata-only evidence

Store only safe fetch metadata in `discovery_runs.stats` and audit metadata.

Do not store raw HTML.

This is the lowest-risk first fetch option.

### Option B — Raw response evidence in Supabase Storage

Store raw response body only if a separate evidence storage policy is approved first.

Requirements before storing raw HTML:

- Dedicated private storage bucket.
- Service-role-only writes.
- No public bucket access.
- Retention policy.
- Size limit.
- Content-type allowlist.
- No rendering in admin UI without sanitization.
- Evidence URI stored in run stats or future evidence table.
- Clear cleanup path.
- Gemini review before implementation.

Recommended first real-fetch phase: Option A only.

## Run Status Model

Future fetch-only implementation should keep the executor state machine simple:

- `pending` — run is created and awaiting claim.
- `running` — executor has claimed the run.
- `completed` — fetch-only phase completed safely.
- `failed` — preflight or fetch failed safely.

Suggested fetch-only execution statuses in stats:

- `fetch_preflight_passed`
- `fetch_attempt_started`
- `fetch_completed_metadata_only`
- `fetch_failed_timeout`
- `fetch_failed_response_too_large`
- `fetch_failed_network_error`
- `fetch_failed_unsupported_content_type`
- `fetch_redirect_not_followed`

All statuses must preserve:

- `no_extraction_performed: true`
- `no_llm_analysis_performed: true`
- `no_candidates_inserted: true`
- `no_public_tools_inserted: true`

For fetch-only phases, `no_fetch_performed` may become false only after Gemini explicitly approves real fetch implementation.

## Audit Requirements

Future fetch-only implementation should audit:

- `fetch_preflight_started`
- `fetch_preflight_passed`
- `fetch_attempt_started`
- `fetch_attempt_completed`
- `fetch_attempt_failed`
- `fetch_response_metadata_recorded`

Audit metadata must not include:

- Secrets.
- Cookies.
- Auth headers.
- Raw HTML.
- Full response body.
- Environment variables.
- Admin session tokens.
- CSRF tokens.

## Data Safety Guarantees

The first real-fetch phase must guarantee:

- No insert into `discovered_tools`.
- No insert into `public.tools`.
- No automatic approval path.
- No public publishing path.
- No LLM call.
- No extraction.
- No scheduler.
- No background worker.
- Admin-only execution.
- Manual-only source.
- One approved URL only.

## SSRF Protection Requirements

The current Phase 6U URL preflight is necessary but not sufficient alone for future real fetch.

Before real fetch implementation, the design should also require:

- Re-check URL safety immediately before fetch.
- Resolve DNS inside the fetch adapter before making the network request.
- Validate every resolved IP against the same private/reserved/link-local/internal blocklist before connecting.
- Reject the fetch if any resolved IP is private, reserved, loopback, link-local, multicast, metadata/internal, or otherwise blocked.
- Pin the outbound connection to a validated resolved IP to prevent time-of-check/time-of-use DNS rebinding.
- Preserve the original hostname for TLS SNI and Host header handling without trusting a second DNS lookup.
- Treat DNS rebinding protection as a hard requirement, not a best-effort control.
- Use no proxy unless explicitly approved.
- Do not use environment proxy settings for crawler requests unless explicitly reviewed.
- Do not send cookies or credentials.
- Keep redirect limit at 0 for the first real-fetch phase.

## Required Smoke Tests for Future Fetch-Only Phase

Future Phase 6X smoke tests should verify:

Valid case:

- One approved `https://example.com/...` manual curated URL can be fetched safely.
- Run completes.
- Safe fetch metadata is recorded.
- `no_extraction_performed = true`.
- `no_llm_analysis_performed = true`.
- `no_candidates_inserted = true`.
- `no_public_tools_inserted = true`.

Rejected cases:

- Private/reserved IP URL is rejected before fetch.
- Non-HTTPS URL is rejected before fetch.
- URL with credentials is rejected before fetch.
- Redirect response is not followed.
- Unsupported content type is rejected.
- Custom domain resolving to a private/reserved IP is rejected as a DNS rebinding simulation.
- Oversized response is aborted or rejected.
- Timeout is handled safely.

Data safety checks:

- `discovered_tools` count unchanged.
- `public.tools` count unchanged.
- No evidence body rendered publicly.
- Audit events exist.
- Cleanup succeeds.

## Required Gemini Gate Before Real Fetch Code

Before any real fetch code is written, Gemini must review and approve:

- This Phase 6W boundary plan.
- Exact fetch adapter API shape.
- Timeout policy.
- Response size policy.
- Redirect policy.
- Content-type policy.
- SSRF policy.
- Audit event schema.
- Run stats schema.
- Smoke test plan.
- Explicit no-extraction/no-insert guarantee.

## Proposed Future Phase Sequence

Recommended next phases:

1. Phase 6W — Real fetch design boundary plan.
2. Gemini review of Phase 6W.
3. Phase 6X — Fetch-only adapter implementation plan.
4. Gemini review of Phase 6X plan.
5. Phase 6Y — Implement metadata-only fetch adapter, if approved.
6. Phase 6Z — Authenticated fetch-only smoke test.
7. Separate later phase — Evidence storage design.
8. Separate later phase — Deterministic extraction design.
9. Separate later phase — Candidate insertion design.

## Phase 6W Decision

Phase 6W is planning only.

Allowed after this document:

- Ask Gemini to review the real fetch boundary plan.

Still not allowed:

- Real fetch implementation.
- Extraction.
- LLM analysis.
- Scheduler or worker.
- Insert into `discovered_tools`.
- Insert into `public.tools`.
