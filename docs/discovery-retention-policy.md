# AiFinder Discovery Engine Retention Policy

Status: Phase 5G planning baseline

## Principles

- Never auto-delete `new` or `pending_review` discovery candidates.
- Never auto-delete live approved tools from `public.tools`.
- Keep audit history longer than temporary crawler artifacts.
- Keep real source configuration records indefinitely.
- Delete smoke/test sources immediately after testing.
- Crawler automation must not start until retention rules are reviewed.

## Discovery Sources

- Active sources: keep indefinitely.
- Inactive sources: keep indefinitely, but mark inactive.
- Smoke/test sources: delete immediately after testing.
- Source create/update actions must be audited.

## Discovery Runs

- `pending` / `running`: never auto-delete while active.
- `completed`: keep 90 days.
- `failed`: keep 180 days.
- Manual smoke runs: clean immediately after test completion.

## Discovered Tools

- `new`: keep until reviewed.
- `pending_review`: keep until reviewed.
- `approved`: keep 1 year as approval history.
- `duplicate`: keep 180 days.
- `rejected`: keep 90 days.
- `ignored`: keep 90 days.

## Discovery Evidence

- Evidence for `new` / `pending_review`: keep while candidate is active.
- Evidence for `approved`: keep 180 days.
- Evidence for `duplicate`, `rejected`, or `ignored`: keep 90 days.
- Do not delete evidence before the related candidate is reviewed.

## Duplicate Candidates

- Keep while the discovered tool exists.
- Let cascade cleanup remove duplicate candidates when old reviewed candidates are deleted.

## Discovery Audit Events

- Keep at least 1 year during MVP.
- Prefer 2 years once crawler automation is active.
- Do not delete audit logs during normal candidate cleanup unless separately reviewed.

## Future Raw HTML and Screenshots

- Raw HTML: keep 30–90 days.
- Screenshots: keep 30–90 days.
- Store artifacts outside public buckets by default.
- Never expose raw crawler artifacts publicly without explicit review.
- Delete artifacts when corresponding evidence expires.

## Before Crawler Automation

Before enabling crawler automation:

- Admin auth verified.
- CSRF verified.
- Rate limiting enabled.
- RLS/grants live verification passed.
- Source audit logging enabled.
- Smoke data cleanup confirmed.
- Retention policy reviewed.
