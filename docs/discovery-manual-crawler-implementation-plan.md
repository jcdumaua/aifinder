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

## Future API Design

A possible future endpoint:

`POST /api/admin/discovery/runs/manual`

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

A future manual run should:

1. Validate admin session.
2. Verify CSRF.
3. Apply rate limit.
4. Validate source ID.
5. Load source.
6. Confirm source is active and approved.
7. Confirm robots.txt/ToS review fields are present once implemented.
8. Create run record with status `running`.
9. Fetch source with strict limits.
10. Extract candidate metadata.
11. Validate candidates.
12. Apply max candidate limit.
13. Run duplicate checks.
14. Insert discovered tool candidates.
15. Insert evidence.
16. Insert duplicate candidate rows when needed.
17. Mark run completed or failed.
18. Write audit events.
19. Return safe summary.

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
- Admin UI behavior is approved.

## Scheduled Automation Lock

Scheduled crawler automation remains locked until the manual crawler prototype is implemented, tested, reviewed, and proven safe.

## Future Phases

- Phase 6H: Gemini review of manual crawler implementation plan.
- Future phase: Select first 1-3 approved crawler sources.
- Future phase: Manual crawler prototype implementation.
- Future phase: Manual crawler smoke test pack.
- Future phase: Scheduled crawler design only after manual prototype is proven safe.
