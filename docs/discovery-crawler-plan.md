# AiFinder Discovery Crawler Plan

## Status

Planning only. Crawler automation is not approved yet.

## Goals

- Help AiFinder discover new AI tools.
- Create discovery candidates for admin review.
- Preserve human approval before public publishing.
- Keep the Discovery Engine secure, rate-limited, and auditable.

## Non-goals

- No automatic public publishing.
- No broad open-web crawling in MVP.
- No crawling behind login pages.
- No storing sensitive/private data.
- No crawler implementation in this phase.

## Proposed Data Flow

External source → crawler fetch/extract → discovery_runs → discovered_tools → discovery_evidence → duplicate candidates → admin queue → human approval → public.tools.

## Source Strategy

Start with:

- Curated source URLs.
- RSS feeds.
- Known AI launch directories.
- API-based sources only if allowed.

Avoid at first:

- Open-ended web crawling.
- Social media scraping.
- Login-only sources.
- User comment scraping.
- Unknown bulk directories.

## MVP Crawler Limits

- Manual trigger only.
- 1 source per run initially.
- Max 20–50 candidates per run.
- Strict fetch timeout.
- Strict max response size.
- Store only required metadata first.
- Raw HTML/screenshots disabled by default until storage policy is ready.

## Duplicate Safety

Use staged duplicate checks:

- Canonical URL.
- Normalized domain.
- Slug.
- Exact name.
- Fuzzy name later.

## Admin Review

Crawler-created tools must always land in the Discovery Queue.
Only admin approval can create live public tools.
Approval guardrails remain required.

## Security Requirements Before Crawler Implementation

- Admin auth confirmed.
- CSRF confirmed.
- Rate limiting confirmed.
- RLS/grants live verification passed.
- Source audit logging enabled.
- Retention policy documented.
- Cleanup job plan reviewed.
- Crawler source allowlist defined.
- Fetch limits defined.
- Storage safety reviewed.

## Future Phases

- Phase 6B: Crawler source allowlist design.
- Phase 6C: Retention cleanup job design.
- Phase 6D: Manual-trigger crawler prototype design.
- Phase 6E: Gemini review before implementation.
