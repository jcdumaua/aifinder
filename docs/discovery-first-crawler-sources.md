# AiFinder First Manual Crawler Sources

## Status

Planning only. No crawler implementation or source activation is approved yet.

## Purpose

This document selects the first safest source candidates for the future manual-trigger crawler prototype.

## Selection Principle

AiFinder should start with the lowest-risk source possible. The first prototype should prioritize admin-controlled input over external directory crawling.

## Selected Initial Source

### AiFinder Manual Curated AI Tool URLs

Source name: `AiFinder Manual Curated AI Tool URLs`

Source type: `manual_curated_urls`

Approval status: `recommended_for_first_manual_prototype`

Risk level: `low`

Why selected:

- Admin-controlled.
- No open-web crawling.
- No directory scraping.
- No social media scraping.
- Low volume.
- Easy to verify.
- Easy to clean up.
- Good for testing candidate validation, domain normalization, duplicate checks, evidence creation, and admin review flow.

Expected data collected:

- Tool name.
- Website URL.
- Short description if manually provided or safely extracted later.
- Category/pricing only when confidently available.
- Evidence reference for how the candidate was created.

Prototype limits:

- 1 manual run at a time.
- 5-10 candidate URLs for the first test.
- Maximum 20 candidates while validating the prototype.
- No raw HTML or screenshots by default.
- No public publishing.
- All candidates must go to Discovery Queue.

Policy review:

- robots.txt/Terms review is not required for purely admin-entered metadata.
- If the future crawler fetches the provided websites, each website must still follow fetch safety rules and policy review where applicable.

## Proposed Future Candidate Sources

These future source candidates are not approved yet.

### A. Product Hunt API

Status: `proposed_not_approved`

Risk level: `medium`

Reason:

- Potentially useful because it has an official API path.
- Must use official API only if terms allow.
- Must not scrape Product Hunt pages directly.
- Requires API/terms review before approval.
- Requires rate limits and API credential handling review.

### B. Known AI Directory Public Pages

Status: `proposed_not_approved`

Risk level: `medium`

Reason:

- Useful for AI tool discovery, but more risky than manual input.
- Requires robots.txt review.
- Requires Terms of Service review.
- Requires crawl permission notes.
- Requires conservative fetch frequency.
- Should not be used for the first prototype.

### C. Official Vendor/Product Pages

Status: `proposed_not_approved`

Risk level: `low_to_medium`

Reason:

- Useful for enriching or verifying manually submitted candidates.
- Must be HTTPS.
- Must not require login.
- Must not collect personal data.
- Should only be fetched for specific admin-approved URLs.

## Explicitly Not Selected for MVP

- Open-web crawling.
- Search-result scraping.
- Social media scraping.
- Login-only pages.
- User comment scraping.
- Unknown bulk directories.
- Adult/gambling/illegal/malware/weapon/extremist/deceptive sources.

## First Prototype Recommendation

The first manual crawler prototype should use only `AiFinder Manual Curated AI Tool URLs`.

External sources should remain proposed until:

- Source policy review is completed.
- robots.txt/Terms review is recorded.
- Fetch limits are finalized.
- Gemini approves the source choice.
- Admin UI behavior is approved.

## Required Before Implementation

- Gemini review of first-source selection.
- Confirm manual curated source shape.
- Confirm first test should use 5-10 candidate URLs.
- Confirm no direct insert into `public.tools`.
- Confirm candidates go to Discovery Queue only.
- Confirm async execution requirement remains.
- Confirm smoke cleanup plan.

## Future Phases

- Phase 6K: Gemini review of first crawler source selection.
- Future phase: Manual crawler prototype implementation planning final gate.
- Future phase: Manual crawler prototype implementation.
- Future phase: Manual crawler smoke test pack.
