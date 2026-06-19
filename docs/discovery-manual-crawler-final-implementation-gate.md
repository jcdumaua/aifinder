# AiFinder Manual Crawler Final Implementation Gate

## Phase 6L Status

This phase is planning-only.

Manual crawler implementation is still not approved.

Scheduled crawler automation is still locked.

This document defines the final go/no-go checklist before the future manual crawler prototype can begin implementation.

## Approved First Prototype Source

- Source name: `AiFinder Manual Curated AI Tool URLs`
- Source type: `manual_curated_urls`
- Risk level: low
- Approval status: approved for first manual prototype planning
- Initial test limit: 5-10 URLs
- Validation max: 20 URLs

This approval is limited to planning the first manual prototype. It does not approve source activation, crawler implementation, scheduled automation, or public publishing.

## Hard Implementation Gates

The future manual crawler implementation may not begin until these gates are mandatory and explicitly preserved:

- Admin auth verification.
- CSRF protection.
- Admin mutation rate limiting.
- Source eligibility check.
- Per-URL robots.txt / Terms / permission policy check.
- No direct insert into `public.tools`.
- All valid candidates must go to Discovery Queue.
- Duplicate detection must run before queue insert.
- Audit logging must record run and candidate outcomes.
- Async execution required.
- Stuck running runs must have recovery behavior.
- No raw HTML/screenshots by default.
- Scheduled automation remains disabled.

## Future Endpoint Contract

The intended future trigger endpoint is:

`POST /api/admin/discovery/runs/manual`

This endpoint must:

- Validate admin auth.
- Validate CSRF.
- Apply rate limiting.
- Validate source eligibility.
- Create a `discovery_runs` row.
- Return a run ID quickly.
- Not perform long-running fetch work inline.
- Hand off execution to async logic.

This endpoint is a run trigger only. It must not be implemented as the full crawler executor inside a single long-running API request.

## Future Run Lifecycle

Expected future run statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`
- `stuck` or documented stuck-run recovery behavior

Run records should include clear timestamps for creation, queue/start time, completion/failure/cancellation, and last update. Error messages must be admin-safe and must not expose secrets, credentials, raw private payloads, stack traces, or unsafe upstream response bodies.

Retry behavior should be conservative. A retry should only happen when the source remains eligible, the previous failure is safe to retry, rate limits allow it, and duplicate/audit guardrails still run. Retried runs should keep enough run metadata to distinguish original attempts from retry attempts.

Stuck-run handling must be defined before implementation. A future implementation should either mark stale `running` runs as `failed` after an approved timeout threshold or expose an admin-safe recovery action. Recovery actions must be audited.

## Future Candidate Lifecycle

Future candidate handling should follow this sequence:

1. URL normalization.
2. Per-URL and per-domain robots.txt / Terms / permission policy check.
3. Fetch eligibility check.
4. Metadata extraction.
5. Validation.
6. Duplicate detection.
7. Insert into Discovery Queue only.
8. Audit event creation.

Candidate creation must never bypass duplicate detection, audit logging, or the admin review queue. Valid candidates may become `discovered_tools` records only; public publishing remains limited to the existing admin approval flow.

## Security Requirements

Future implementation must include:

- SSRF protection.
- URL scheme allowlist: `https://` only unless explicitly justified later.
- Block localhost/private/internal IP ranges.
- Timeout limits.
- Response size limits.
- Redirect limits.
- Content-type validation.
- Error-safe logging with no sensitive secret leakage.

Security checks must run before any external fetch attempt. Failures should be logged with safe metadata and returned to admins with safe summaries only.

## Legal / Crawler Policy Requirements

Future implementation must include:

- Per-URL robots.txt review.
- Terms/permission notes where applicable.
- Respect source allowlist policy.
- No aggressive crawl behavior.
- No scheduled crawling.
- Manual prototype only.

The first prototype must stay low-volume and admin-controlled. Any external source expansion requires separate source review and approval.

## QA / CCR Requirements Before Implementation Commit

Any future implementation CCR before commit must include:

- Files changed.
- Commands run.
- Typecheck result.
- Lint result.
- Unit/manual test result.
- Admin auth result.
- CSRF result.
- Rate limit result.
- Per-URL policy check result.
- Duplicate detection result.
- Discovery Queue insert result.
- Audit logging result.
- Desktop result.
- Tablet/iPad result.
- Mobile result.
- Risks and rollback notes.

## Explicit Final Gate

Manual crawler implementation may not begin until this Phase 6L planning document is reviewed and approved by ChatGPT and Gemini.
