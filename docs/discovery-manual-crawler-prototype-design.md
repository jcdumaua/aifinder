# AiFinder Manual-Trigger Discovery Crawler Prototype Design

## Status

Planning only. Manual crawler prototype implementation is not approved yet.

## Purpose

The first Discovery crawler prototype should be manually triggered by an admin, limited to approved allowlisted sources, and must only create discovery candidates for human review. It must never publish directly to `public.tools`.

This design defines the intended safety boundaries for a future manual prototype. It does not approve crawler implementation, workers, cron jobs, external fetching, API changes, schema changes, delete scripts, or scheduled automation.

## Prototype Goals

- Validate crawler flow safely.
- Test source fetching and extraction with low volume.
- Create discovery candidates only.
- Preserve admin approval.
- Measure duplicate detection quality.
- Confirm retention and audit needs before scheduled automation.

## Non-goals

- No scheduled crawling.
- No open-web crawling.
- No recursive crawling.
- No auto-publishing.
- No scraping behind login.
- No high-volume ingestion.
- No raw artifact storage by default.

## Proposed Manual Flow

Admin selects approved source -> clicks manual run -> system creates `discovery_runs` row -> crawler fetches source with strict limits -> extracts candidate metadata -> validates candidates -> checks duplicates -> writes `discovered_tools`, `discovery_evidence`, and duplicate candidates -> marks run completed/failed -> admin reviews queue.

## Source Requirements

- Source must be approved in allowlist.
- Source must be active.
- Source must have low or medium risk.
- Source must have a base URL.
- Source must define expected data collected.
- Source must have crawl frequency guidance even if scheduling is not enabled yet.

## Fetch Safety Requirements

- HTTPS only.
- Timeout limit.
- Max response size.
- Max redirects.
- User-agent identification.
- No credentialed requests.
- No cookies.
- No login/session crawling.
- Respect disallowed/blocked sources.
- Stop on repeated failures.

## Candidate Safety Requirements

- Max 20-50 candidates per manual run.
- Required fields: name, website, description, category/pricing if available.
- Validate URLs.
- Normalize domains.
- Reject malformed candidates.
- Store extraction confidence if available.
- Require evidence for every candidate.
- Never bypass duplicate checks.

## Duplicate Strategy

- Canonical URL.
- Normalized domain.
- Slug.
- Exact name.
- Fuzzy name later.
- Duplicate candidates should block approval when needed.

## Admin Controls

- Manual run button only for admins.
- Confirmation before run starts.
- Show expected source/risk/limit summary.
- Show run status.
- Show candidate count created.
- Show failure reason.
- No background scheduling in first version.

## Audit Requirements

- Audit manual run start.
- Audit run completion/failure.
- Audit source used.
- Audit candidate counts.
- Audit errors safely without leaking sensitive data.

## Rate Limit Requirements

- Limit manual crawler run creation.
- Prevent multiple concurrent runs for the same source.
- Prevent accidental repeated clicks.
- Keep existing admin mutation rate limits.

## Retention/Cleanup Dependency

Manual crawler prototype design can proceed now, but implementation should wait until the cleanup strategy is reviewed or scheduled. High-volume automation must wait until cleanup job implementation is ready.

## Testing Plan for Future Implementation

- Unit tests for extraction validation.
- Unit tests for URL/domain normalization.
- Integration test for manual run creation.
- Smoke test for one low-risk source.
- Confirm cleanup of smoke data.
- Confirm no public tool is created without approval.

## Required Before Implementation

- Gemini review of this design.
- Confirm first 1-3 allowed sources.
- Confirm fetch limits.
- Confirm run status model.
- Confirm duplicate blocking behavior.
- Confirm audit event format.
- Confirm no public publishing path.
- Confirm cleanup/retention dependency.

## Future Phases

- Phase 6E: Gemini crawler design review.
- Future phase: Manual-trigger crawler prototype implementation.
- Future phase: Manual crawler smoke test pack.
- Future phase: Scheduled crawler design only after manual prototype is proven safe.
