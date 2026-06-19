# AiFinder Manual Discovery Crawler Implementation Plan

## Status

Planning only. Implementation is not approved yet.

## Purpose

This document prepares the future implementation plan for a safe, admin-triggered manual crawler prototype. It does not approve implementation, automation, scheduled crawling, or direct publishing.

The future crawler must create Discovery Engine candidates for admin review only. It must never publish directly to `public.tools`.

## Implementation Goal

The future manual crawler should:

- Let an admin manually run one approved source.
- Create a `discovery_runs` record.
- Fetch only the approved source with strict limits.
- Extract candidate metadata.
- Validate and normalize candidates.
- Run duplicate checks.
- Insert candidates into `discovered_tools`.
- Insert evidence into `discovery_evidence`.
- Insert duplicate candidates when needed.
- Never insert directly into `public.tools`.
- Require admin approval before public publishing.

## Required Existing Foundations

These foundations are already completed:

- Discovery queue/admin foundation.
- Manual intake flow.
- Source management.
- Source/run visibility.
- Approval guardrails.
- Audit trail UI.
- Admin auth.
- CSRF protection.
- Admin mutation rate limiting.
- Live RLS/grants verification.
- Retention policy.
- Source allowlist policy.
- Retention cleanup job design.
- Manual crawler prototype design.

## Proposed Future Files/Modules

Possible future implementation files include:

- `lib/discovery/crawler/fetch-source.ts`
- `lib/discovery/crawler/extract-candidates.ts`
- `lib/discovery/crawler/validate-candidate.ts`
- `lib/discovery/crawler/normalize-candidate.ts`
- `lib/discovery/crawler/duplicate-checks.ts`
- `app/api/admin/discovery/runs/manual/route.ts`
- Optional admin UI component for manual run button/status

Do not create these files until implementation is explicitly approved.

## Async Execution Requirement

Manual crawler implementation must not run the entire crawl inside one long-running synchronous API request.

The future manual run endpoint should:

- Validate admin auth.
- Verify CSRF.
- Apply rate limiting.
- Confirm source eligibility.
- Create a `discovery_runs` row.
- Return a run ID quickly after the run is safely queued or started.

The actual fetch, extract, validate, duplicate-check, and insert work should run asynchronously outside the request lifecycle.

The admin UI should poll or refresh run status from `discovery_runs`.

This prevents serverless timeout failures and reduces the risk of permanently stuck `running` runs.

## Future API Design

A possible future endpoint:

`POST /api/admin/discovery/runs/manual`

This endpoint should be a trigger endpoint, not the full crawler executor. It should return a safe run summary immediately after the run is created or queued. Long-running crawler work should happen outside the request lifecycle.

Requirements:

- Admin auth required.
- CSRF required.
- Rate limit required.
- Body size limit required.
- Source ID required.
- Source must be active.
- Source must be approved/allowlisted.
- Source must have policy review completed.
- Must prevent concurrent runs for the same source.
- Must create a discovery run record.
- Must return run summary safely.

## Future Manual Run Flow

A future manual run should be split into three phases.

### Trigger Phase

1. Validate admin session.
2. Verify CSRF.
3. Apply rate limit.
4. Validate source ID.
5. Load source.
6. Confirm source is active and approved.
7. Confirm robots.txt/ToS review fields are present once implemented.
8. Create `discovery_runs` row with status `running`.
9. Start or queue async execution.
10. Return run ID and safe run summary.

### Async Execution Phase

1. Fetch source with strict limits.
2. Extract candidate metadata.
3. Validate candidates.
4. Apply max candidate limit.
5. Run duplicate checks.
6. Insert discovered tool candidates.
7. Insert evidence.
8. Insert duplicate candidate rows when needed.
9. Mark run completed or failed.
10. Write audit events.

### UI Status Phase

1. Admin UI shows run status.
2. Admin UI can refresh or poll `discovery_runs`.
3. Admin UI shows candidate count safely.
4. Admin UI shows failure reason safely.

## Stuck-Run Recovery Requirement

Future implementation must define what happens if a run remains `running` too long.

Suggested rule:

- Mark stale `running` runs as `failed` after an approved timeout threshold, or expose an admin-safe recovery action.
- Audit stuck-run recovery actions.
- Never leave stale `running` runs indefinitely.

## Fetch Limits

- HTTPS only.
- No credentials.
- No cookies.
- No login/session crawling.
- Timeout limit.
- Max response size.
- Max redirects.
- User-agent identification.
- Conservative retry behavior.
- Backoff after errors.
- No recursive crawling in MVP.

## Candidate Limits

- Max 20-50 candidates per run.
- Required name and website.
- Description required or minimum fallback rule.
- Category/pricing optional when not confidently extracted.
- Validate website URL.
- Normalize domain.
- Generate safe slug candidate.
- Store extraction confidence when available.
- Reject malformed candidates.
- Require evidence for each candidate.

## Duplicate Checks

- Canonical URL.
- Normalized domain.
- Slug.
- Exact name.
- Fuzzy name later.
- Duplicate candidates should block approval when needed.
- Never bypass duplicate checks.

## Audit Requirements

- Manual run requested.
- Run started.
- Run completed.
- Run failed.
- Candidate count.
- Source ID/name.
- Safe error messages only.
- No sensitive raw payloads in audit metadata.

## Testing Plan

- Unit tests for URL normalization.
- Unit tests for candidate validation.
- Unit tests for duplicate check helpers.
- API route tests for auth/CSRF/rate limit.
- Manual run smoke test with one low-risk source.
- Verify no `public.tools` row is created without approval.
- Verify smoke data cleanup.

## Implementation Gates

Manual crawler implementation must not begin until:

- Gemini reviews this implementation plan.
- First 1-3 source candidates are selected.
- Source policy review process is accepted.
- Fetch limits are finalized.
- Cleanup/retention dependency is accepted.
- Async execution model is approved.
- Stuck-run recovery behavior is approved.
- UI status/polling behavior is approved.
- Admin UI behavior is approved.

## Scheduled Automation Lock

Scheduled crawler automation remains locked until the manual crawler prototype is implemented, tested, reviewed, and proven safe.

## Future Phases

- Phase 6H: Gemini review of manual crawler implementation plan.
- Future phase: Select first 1-3 approved crawler sources.
- Future phase: Manual crawler prototype implementation.
- Future phase: Manual crawler smoke test pack.
- Future phase: Scheduled crawler design only after manual prototype is proven safe.
