# AiFinder Discovery Source Allowlist

## Status

Planning only. Crawler automation is not approved yet.

## Purpose

The AiFinder discovery crawler must only use approved, reviewed sources. During the MVP, AiFinder must avoid open-ended crawling and limit discovery work to sources that have been intentionally selected, risk-reviewed, and approved for crawler use.

This allowlist is intended to keep crawler inputs narrow, auditable, and safe before any crawler implementation is approved.

## Allowed Source Types

- Manual curated URLs
- RSS feeds
- Known AI launch/product directories
- Official vendor/product pages
- Public APIs only when terms allow use
- Admin-submitted source records

## Disallowed Source Types

- Login-only pages
- Private communities
- User comment scraping
- Social media scraping in MVP
- Broad search-result scraping
- Unknown bulk directories
- Adult, gambling, illegal, malware, weapon, extremist, or deceptive content sources
- Any source that blocks scraping or disallows automated access

## Source Approval Rules

Each proposed source should have:

- Source name
- Source type
- Base URL
- Reason for inclusion
- Expected data collected
- Crawl frequency recommendation
- Risk level: low, medium, high
- Approval status: proposed, approved, paused, rejected
- Last reviewed date

## MVP Allowlist Recommendation

Start with only 1-3 low-risk sources.

Recommended initial source categories:

- Manually curated AI tool URLs
- RSS/product update pages from known AI directories
- Official launch/product listing pages with public access

## Crawler Safety Rules

- No open-web crawling.
- No recursive crawling by default.
- No crawling behind login.
- No collecting personal data.
- No auto-publishing.
- No source can create live tools directly.
- Every candidate must go through Discovery Queue.
- Admin must approve before `public.tools` insert.

## Source Risk Levels

- Low risk: stable public pages, low volume, clear tool listings.
- Medium risk: directories with mixed quality or unclear structure.
- High risk: pages with user-generated content, scraping restrictions, unstable markup, or high spam risk.

## Required Before Implementation

- Source allowlist reviewed.
- Retention cleanup job designed.
- Fetch timeout and response size limits defined.
- Storage safety reviewed.
- Gemini review completed before crawler implementation.

## Future Admin UI Idea

Later, AiFinder can add source approval fields to `discovery_sources` so admins can track source approval status, risk level, review dates, and crawl recommendations in the Admin UI. Do not implement schema changes in this phase.
