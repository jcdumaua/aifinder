# AiFinder Manual Crawler Prototype Implementation Scope

## Phase 6M Status

This phase is planning-first.

Manual crawler implementation has not started yet.

Scheduled crawler automation is still locked.

This document defines the exact future implementation package for the manual crawler prototype. It does not approve crawler code, API routes, workers, Supabase migrations, scheduled automation, or production behavior changes.

## Existing Repo Findings

Relevant planning documents reviewed:

- `docs/discovery-manual-crawler-final-implementation-gate.md`
- `docs/discovery-manual-crawler-implementation-plan.md`
- `docs/discovery-manual-crawler-prototype-design.md`
- `docs/discovery-first-crawler-sources.md`
- `docs/discovery-source-allowlist.md`

Async execution note:

- `docs/discovery-async-manual-crawler-execution-design.md` is not present as a standalone file in this checkout.
- The async execution requirement is present in `docs/discovery-manual-crawler-implementation-plan.md`.

Relevant existing Discovery Engine API routes:

- `app/api/admin/discovery/intake/route.ts`
- `app/api/admin/discovery/runs/route.ts`
- `app/api/admin/discovery/sources/route.ts`
- `app/api/admin/discovery/sources/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`

Relevant existing helpers and UI files:

- `lib/admin-auth.ts`
- `lib/admin-rate-limit.ts`
- `lib/supabase-admin.ts`
- `lib/tool-validation.ts`
- `lib/discovered-tools.ts`
- `components/admin/admin-dashboard-client.tsx`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/discovery-sources-panel.tsx`
- `components/admin/discovery/discovery-queue-table.tsx`
- `components/admin/discovery/discovery-tool-detail.tsx`

Relevant existing schema/migration files:

- `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql`
- `supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql`
- `supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql`
- `supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql`

Reusable patterns already in place:

- Admin auth: `verifyAdminSession(request)` from `lib/admin-auth.ts`.
- CSRF: `verifyAdminCsrfRequest(request)` and `/api/admin/csrf`.
- Rate limiting: `checkAdminRateLimit()` and `getAdminRateLimitResponseData()` from `lib/admin-rate-limit.ts`.
- Service-role data access: `supabaseAdmin` from `lib/supabase-admin.ts`.
- Safe JSON responses: existing Discovery API routes use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Body-size and content-type checks: Discovery source/intake/bulk routes already enforce JSON and request size limits.
- URL safety: `validateHttpsUrl()` blocks non-HTTPS, credentials, localhost/private/internal hostnames, and risky downloadable file extensions.
- Domain normalization: `getNormalizedDomain()` from `lib/tool-validation.ts`.
- Category/pricing/text validation: `validateToolCategory()`, `validateToolPricing()`, and `validateTextField()`.
- Discovery Queue insert pattern: manual intake creates `discovered_tools`, `discovery_evidence`, duplicate candidates, and audit events.
- Duplicate pattern: manual intake checks existing discovered tools, live `tools`, and pending `submitted_tools` by normalized domain.
- Audit pattern: Discovery mutations insert into `discovery_audit_events` using safe metadata and existing actions such as `flag` and `mark-duplicate`.
- Approval guardrail: `approve_discovered_tool` RPC is the only reviewed path from Discovery Queue into `public.tools`.
- UI pattern: Admin Discovery already has sources, run history, queue, detail, and manual intake views.
- Smoke testing: `scripts/smoke-discovery-flow.mjs` covers source creation, manual intake, queue visibility, detail visibility, evidence, duplicates, audit, and cleanup.

Missing primitives or decisions needed before implementation:

- No `POST /api/admin/discovery/runs/manual` route exists yet.
- No crawler fetch/extract/validate/duplicate helper modules exist yet.
- No approved async/background execution primitive exists yet.
- No explicit manual crawler rate-limit action exists; future work should add a dedicated `discoveryManualCrawlerRun` action rather than overloading manual intake.
- Current `discovery_runs.status` allows `pending`, `running`, `completed`, and `failed`; it does not allow `queued`, `cancelled`, or `stuck`.
- Current `discovery_sources.source_type` allows `manual` but not `manual_curated_urls`.
- Current source approval, risk, robots.txt, Terms, and policy-review fields are not first-class columns.
- Current `discovery_audit_events.action` does not include crawler-run-specific actions; future implementation may need to use existing allowed actions with clear metadata or request a reviewed migration.
- No per-URL policy review storage shape is implemented yet.
- No SSRF-safe fetch helper is implemented yet.
- No crawler-specific unit tests exist yet.

## Proposed Implementation Slices

Implementation must happen only after this scope is approved.

### Slice 1: Shared Manual Crawler Validation and Policy Helpers

- Add focused helper modules for manual curated URL payload validation, candidate count limits, source eligibility, per-URL policy metadata validation, and admin-safe error formatting.
- Reuse `validateHttpsUrl()`, `getNormalizedDomain()`, `validateTextField()`, category validation, and pricing validation where possible.
- Add SSRF and fetch eligibility helpers before any fetch helper is allowed.

### Slice 2: Run Creation Trigger Endpoint

- Add `POST /api/admin/discovery/runs/manual` only after approval.
- Follow the existing admin mutation order: admin auth, CSRF, rate limit, body validation, source validation, then service-role writes.
- Create a `discovery_runs` row and return a safe run summary quickly.
- Do not fetch, extract, or insert candidates inline.

### Slice 3: Async/Manual Execution Handoff

- Define the smallest approved async handoff that works in the current runtime.
- The handoff must keep long-running fetch/extract/insert work outside the trigger request lifecycle.
- The handoff must update `discovery_runs` status and safe error metadata.
- Define stuck-run recovery before implementation.

### Slice 4: Candidate URL Normalization and Validation

- Accept only manual curated URLs for the first prototype.
- Enforce 5-10 URLs for the first test and a hard maximum of 20 URLs while validating.
- Normalize canonical URL, website URL, normalized domain, slug, and safe metadata.
- Reject malformed, unsafe, duplicate, non-HTTPS, credentialed, private-network, or policy-blocked URLs.

### Slice 5: Duplicate Detection Before Queue Insert

- Run duplicate checks before inserting each candidate into `discovered_tools`.
- Reuse the manual intake strategy for normalized domain checks against `discovered_tools`, live `tools`, and pending `submitted_tools`.
- Add canonical URL, slug, and exact-name checks in the future helper when feasible.
- Insert blocking duplicate candidates when needed and keep approval blocked by review rules.

### Slice 6: Audit Logging

- Audit manual run requested/queued/started/completed/failed.
- Audit candidate outcomes: inserted, rejected by validation, rejected by policy, duplicate recorded, and failed insert.
- Use safe metadata only: source ID/name, run ID, counts, normalized domains, candidate IDs, duplicate IDs, and safe failure codes.
- Do not log secrets, cookies, raw HTML, raw upstream bodies, credentials, stack traces, or private payloads.

### Slice 7: Admin UI Run Trigger/Status Display If Needed

- Add UI only if approved for the implementation package.
- Prefer integrating into the existing Discovery admin surface beside `DiscoveryRunsTable` and `DiscoverySourcesPanel`.
- Show source/risk/limit summary, confirmation before run, run ID, status, candidate count, and safe failure reason.
- Poll or refresh `discovery_runs`; do not rely on the trigger request remaining open.

### Slice 8: Tests and QA

- Add unit tests for URL validation, normalization, candidate count limits, source eligibility, SSRF rejection, and duplicate helper behavior.
- Add API route tests or manual API checks for admin auth, CSRF, rate limit, invalid source, valid trigger, and no inline long-running fetch.
- Extend or add smoke coverage for manual run creation, queue insert, evidence insert, duplicate insert, audit insert, and cleanup.
- Run responsive QA only if admin UI changes are included.

## Endpoint Implementation Scope

Future endpoint:

`POST /api/admin/discovery/runs/manual`

It should:

- Validate admin auth with `verifyAdminSession()`.
- Validate CSRF with `verifyAdminCsrfRequest()`.
- Apply a dedicated admin mutation rate limit.
- Enforce JSON content type and body-size limits.
- Validate source ID and source eligibility.
- Confirm source is active and approved for the first manual prototype.
- Confirm source represents `AiFinder Manual Curated AI Tool URLs`.
- Validate that requested URLs are within count limits.
- Confirm per-URL policy fields are present where fetching is expected.
- Prevent concurrent active runs for the same source.
- Create a `discovery_runs` row.
- Return a safe run ID and run summary quickly.
- Hand off execution to approved async logic.

It should not:

- Perform long-running fetch/extract/insert work inline.
- Insert directly into `public.tools`.
- Bypass duplicate detection.
- Bypass Discovery Queue review.
- Store raw HTML or screenshots by default.
- Fetch disallowed, private-network, non-HTTPS, or policy-blocked URLs.
- Add scheduled automation.
- Return raw database errors, secrets, stack traces, cookies, or private payloads.

## Data Model Assumptions

Current tables are mostly enough for a low-volume manual curated URL prototype if implementation maps carefully to existing fields:

- `discovery_sources` can represent the first source as `source_type = 'manual'` with `config` metadata indicating `manual_curated_urls`.
- `discovery_runs` can track manual run lifecycle using the existing status values for the first implementation.
- `discovered_tools` is the Discovery Queue and must remain the only candidate destination.
- `discovery_evidence` can store structured evidence without raw HTML or screenshots.
- `discovery_duplicate_candidates` can store blocking duplicate matches.
- `discovery_audit_events` can record run and candidate outcomes with safe metadata.

Potential migrations that may be needed later, but must not be created in this phase:

- Add `manual_curated_urls` to the `discovery_sources.source_type` constraint if the exact source type must be stored as a first-class value.
- Add `queued`, `cancelled`, or `stuck` to `discovery_runs.status` if the future implementation requires those exact statuses instead of mapping `queued` to `pending` and stuck recovery to `failed`.
- Add source approval/risk/policy-review fields to `discovery_sources` if `config` is not sufficient for reviewed MVP policy metadata.
- Add crawler-run-specific audit actions if existing actions plus metadata are not sufficient.
- Add first-class per-URL policy review records if storing policy metadata in run/candidate/evidence metadata is not sufficient.

No Supabase migration should be created until these choices are reviewed and explicitly approved.

## Security Checklist

Future implementation must preserve:

- Admin auth.
- CSRF.
- Rate limiting.
- SSRF protection.
- `https://` only.
- Block localhost/private/internal IP ranges.
- Timeout limits.
- Response size limits.
- Redirect limits.
- Content-type limits.
- Per-URL robots.txt / Terms / permission policy checks.
- Safe logging with no sensitive secret leakage.

Additional security expectations:

- Do URL safety checks before every fetch.
- Re-check final redirected URLs before accepting fetched content.
- Use no credentials, cookies, admin session forwarding, or login/session crawling.
- Keep all Supabase writes service-role-only on the backend.
- Preserve RLS/grants boundaries.
- Return only admin-safe failure summaries to the client.

## Legal / Crawler Policy Checklist

The first prototype remains limited to:

- Manual curated URLs only.
- 5-10 URLs for the initial test.
- Maximum 20 URLs while validating.
- No scheduled crawling.
- No aggressive fetch behavior.
- External sources remain not approved.

Policy requirements:

- Each URL must have a policy review path before fetch behavior is enabled.
- robots.txt and Terms/permission notes must be captured where applicable.
- If automated access is disallowed, the URL must not be fetched.
- If access rules are unclear, treat the URL as blocked until reviewed.
- The prototype must stay admin-controlled and low-volume.

## QA / CCR Plan

Expected terminal commands for a future implementation CCR:

- `git status`
- `git diff`
- `npm run check`
- `node --test testing/admin-rate-limit.test.mjs`
- `AIFINDER_ADMIN_COOKIE="$(pbpaste)" npm run smoke:discovery`

Additional checks expected for implementation:

- Admin auth check.
- CSRF check.
- Rate limit check.
- Source eligibility check.
- Per-URL policy check.
- SSRF rejection check.
- URL normalization check.
- Duplicate detection check.
- Discovery Queue insert check.
- Evidence insert check.
- Duplicate candidate insert check.
- Audit logging check.
- Run status update check.
- Stuck-run recovery check.
- No direct `public.tools` insert check.
- Cleanup of smoke data.

If admin UI changes are included, the CCR must also include:

- Desktop result.
- Tablet/iPad result.
- Mobile result.
- Confirmation that text and controls do not overlap or clip.
- Confirmation that the run trigger returns quickly and status refresh/polling works.

## Risks and Rollback Notes

Stability risks:

- Long-running fetches can hit serverless timeouts if async handoff is not real.
- Stale `running` runs can confuse admins if recovery is not implemented.
- Partial failures can leave orphaned run/evidence/duplicate rows if cleanup paths are incomplete.

Security risks:

- SSRF protection must be stronger than simple string checks.
- Redirects can turn safe-looking URLs into private/internal targets if final URLs are not revalidated.
- Raw error logs can leak secrets or internal implementation details.

Legal/crawler-policy risks:

- Fetching URLs without robots.txt/Terms/permission review can violate source rules.
- External directory/API sources remain unapproved and must not be included in the first prototype.
- Scheduled automation must stay disabled.

UX/admin risks:

- Admins need clear feedback when a run is queued, running, failed, or recovered.
- Duplicate candidates must be visible and approval-blocking where needed.
- Failure reasons must be actionable but safe.

Rollback notes:

- Keep implementation slices small enough to revert independently.
- If a manual run creates bad smoke data, cleanup should delete child rows before parent rows: duplicate candidates, evidence, audit rows, discovered tools, then runs.
- Do not delete audit logs casually outside smoke cleanup.
- If UI behavior is unclear, keep the manual run trigger out of the UI and test through API-only checks until reviewed.

## Pre-Implementation Decision Gates

Before manual crawler prototype implementation begins, the team must explicitly resolve and approve these decisions:

1. Schema compatibility decision
   - Decide whether the first prototype will map `manual_curated_urls` to `source_type = 'manual'` plus `config.kind = 'manual_curated_urls'`, or whether a reviewed Supabase migration is required.
   - Decide whether run states will use existing statuses only (`pending`, `running`, `completed`, `failed`) or require a reviewed migration for `queued`, `cancelled`, or `stuck`.

2. Async handoff decision
   - Choose the exact approved async/background execution primitive before coding the trigger endpoint.
   - The trigger endpoint must not pretend to be async while doing long-running fetch/extract/insert work inline.

3. Stuck-run recovery decision
   - Prefer automated timeout recovery for stale `running` runs.
   - Define the timeout threshold and safe failure metadata before implementation.

4. Per-URL policy storage decision
   - Decide where robots.txt / Terms / permission review metadata will live for the first prototype.
   - If `config`, run metadata, or evidence metadata is used, define the exact shape before implementation.

5. UI scope decision
   - Decide whether Phase 6N includes Admin UI changes.
   - If UI is included, Desktop/Tablet/Mobile QA is required.
   - If UI is not included, API-only manual testing is acceptable for the first slice.

## Final Approval Gate

Manual crawler prototype implementation may not begin until this Phase 6M scope document is reviewed and approved by ChatGPT, sent to Gemini if required, and all pre-implementation decision gates are explicitly resolved.
