# Phase 7E — Manual Metadata Fetch Results Review Implementation Plan

## 1. Purpose

Phase 7E converts the approved Phase 7D read-only results review design into a safe implementation checklist for a future Phase 7F.

Phase 7C gave AiFinder a safe manual metadata fetch executor.

Phase 7D designed a future admin-only, read-only review surface for manual metadata-fetch run results.

Phase 7E does not implement UI or API behavior. It defines the exact future implementation scope, expected files, data access rules, rendering rules, testing plan, and safety gates.

The goal is to prepare for a future admin review experience where admins can inspect metadata-fetch run results without extraction, candidate creation, approval, publishing, retry, or re-run actions.

## 2. Expected Phase 7F Implementation Scope

Future Phase 7F may add a read-only admin review surface for discovery run results.

Preferred implementation target:

- Reuse the existing admin discovery run detail page if available.
- Otherwise add a compact read-only section to the existing admin discovery area.

Phase 7F should avoid creating a new dedicated route unless the existing admin structure cannot safely support the view.

Expected possible files:

- `app/admin/discovery/tools/[id]/page.tsx` only if this is the existing run/detail surface
- existing admin discovery page/client files only if already used for run display
- optional shared read-only components under `components/admin/`
- optional admin-only API read route only if existing data is not already available safely

Files that should not change:

- No database migrations
- No schema files
- No public pages
- No homepage/category/tool public UI
- No submit flow
- No package dependency files
- No crawler/fetch executor logic unless needed only for type-safe display helpers

## 3. Data Access Rules

Future implementation must use existing data only:

- `discovery_runs.status`
- `discovery_runs.stats`
- `discovery_runs.created_at`
- `discovery_runs.started_at` if available
- `discovery_runs.completed_at` if available
- `discovery_runs.source_id`
- safe linked discovery source name/type if already accessible
- `discovery_audit_events`

No new tables.

No new columns.

No raw fetch storage.

No response body storage.

No candidate table dependency.

No public tools dependency.

## 4. Read-Only Behavior

The review surface must be strictly read-only.

It may display:

- Run summary
- Manual metadata fetch stats
- Safe per-URL metadata results
- Safety flags
- Audit timeline

It must not add:

- Retry button
- Re-run button
- Delete button
- Export button
- Download button
- Candidate creation button
- Approval button
- Publish button
- Edit source button inside the results view

Any future action button must be designed in a separate phase.

## 5. Safe Display Schema

The UI may render these summary fields:

- Run status
- Source name
- Source type
- Executor mode
- Total URLs
- Fetched URLs
- Failed URLs
- Skipped URLs
- Created time
- Started time
- Completed time
- Duration summary if safely derivable
- Safety label: `Metadata only — no extraction performed`

The UI may render these safety flags:

- `dry_run`
- `execution_enabled`
- `no_fetch_performed`
- `no_extraction_performed`
- `no_llm_analysis_performed`
- `no_candidates_inserted`
- `no_public_tools_inserted`

The UI may render these per-URL result fields:

- `hostname`
- `normalized_url`
- `status`
- `http_status`
- `content_type`
- `content_length_header`
- `resolved_ip_family`
- `bytes_read`
- `response_truncated`
- `duration_ms`
- `error_code`
- `failure_reason`

## 6. Forbidden Rendering

The future UI must never render:

- Raw HTML
- Response body
- Extracted text
- Page title guesses
- Page description guesses
- Candidate fields
- Tool name guesses
- Raw cookies
- Admin cookie
- CSRF token
- Environment variables
- API keys
- Auth tokens
- Secrets
- Full stack traces
- Raw request headers
- Raw response headers except content type and content length
- Approval controls
- Publishing controls

The UI must not imply that a fetched URL is a discovered tool.

The UI must clearly state that the displayed data is metadata-only.

## 7. Audit Timeline Rendering

Future implementation should render a safe audit timeline.

Allowed event families:

- `manual_metadata_fetch_started`
- `manual_metadata_fetch_url_completed`
- `manual_metadata_fetch_url_failed`
- `manual_metadata_fetch_completed`
- `manual_metadata_fetch_failed`
- `metadata_fetch_smoke_started`
- `metadata_fetch_smoke_completed`
- `metadata_fetch_smoke_failed`
- dry-run/preflight events

Allowed timeline fields:

- Event type
- Timestamp
- Safe message
- Safe status
- Safe hostname
- Safe normalized URL if already sanitized
- Safe error code
- Safe failure reason

Forbidden timeline fields:

- Cookies
- CSRF tokens
- Admin session data
- Environment values
- Raw bodies
- Raw HTML
- Raw headers except content type/content length
- Stack traces

## 8. Missing or Malformed Stats Handling

The future UI must handle old and incomplete runs safely.

Required states:

- Missing stats
- Null stats
- Unknown executor mode
- Dry-run stats
- Metadata smoke stats
- Manual metadata fetch stats
- Failed run stats
- Partial-success stats
- Malformed `fetch_results`
- Empty `fetch_results`

Malformed or unknown data should be hidden or shown as `Unavailable`, not rendered raw.

Do not add a raw JSON viewer in Phase 7F.

## 9. UX Layout Recommendation

Recommended layout:

1. Header with run status and source
2. Safety banner: `Metadata only — no extraction performed`
3. Summary cards
4. Safety flags section
5. Per-URL results table
6. Audit timeline

Status display should distinguish:

- Completed
- Failed
- Running
- Partial success
- Dry-run/preflight only

The UI should use calm admin language and avoid over-emphasizing technical errors.

## 10. Responsive Requirements

Phase 7F must test:

- Desktop
- Tablet/iPad portrait and landscape
- Mobile

Responsive requirements:

- No horizontal page overflow
- No clipped table actions
- No overlapping cards
- No sticky/fixed element covering results
- URL table may use controlled horizontal scroll if needed
- Mobile may stack per-URL result rows
- Long URLs must wrap or truncate safely

CCR reports for implementation must include:

- Desktop Result
- Tablet/iPad Result
- Mobile Result
- Responsive Issues Found

## 11. Accessibility Requirements

Future UI implementation should include basic accessibility checks:

- Proper headings
- Clear labels
- Tables with readable headers
- Sufficient color contrast
- Keyboard-readable content
- Error/failure states not relying only on color
- No hidden critical information behind hover-only UI

If Axe or Playwright accessibility checks are available, include them in implementation QA.

## 12. Testing Plan

Future Phase 7F implementation should verify:

- Admin-only access
- Unauthenticated access rejected
- Read-only behavior
- No mutation requests triggered
- Manual metadata fetch stats render safely
- Metadata fetch smoke stats render safely
- Dry-run/preflight stats render safely
- Missing stats handled safely
- Malformed stats handled safely
- Failed run display
- Partial-success run display
- Long URL display
- Empty audit timeline display
- Audit timeline with manual metadata fetch events
- No raw body fields rendered
- No raw HTML rendered
- No candidate/approval/publish controls present
- `npm run check` passes

If Playwright is used, test:

- Admin page loads
- Run detail/review area displays
- Desktop viewport
- Tablet viewport
- Mobile viewport

## 13. Forbidden Scan Plan

Future implementation should include a forbidden scan over changed UI/API files for:

- `dangerouslySetInnerHTML`
- raw `body`
- raw `html`
- `candidate`
- `approve`
- `publish`
- `retry`
- `rerun`
- `openai`
- `anthropic`
- `gemini`
- `generateText`
- `generateObject`
- `scheduler`
- `cron`
- `worker`
- `cheerio`
- `jsdom`
- `playwright`
- `puppeteer`

Some words may appear in documentation or comments, so any matches must be reviewed carefully rather than blindly accepted.

## 14. Implementation Slice Recommendation

Recommended future Phase 7F order:

### A. Inspect existing admin discovery routes

Find the smallest safe location to display run results.

### B. Add safe display helpers

Create helpers to normalize `discovery_runs.stats` for UI display.

Helpers should allowlist fields and hide unknown raw keys.

### C. Add read-only summary section

Display run status, executor mode, counts, and safety label.

### D. Add per-URL results table

Render only allowlisted per-URL metadata.

### E. Add safety flags section

Show whether extraction, LLM, candidates, and public tools were avoided.

### F. Add audit timeline

Render safe audit events only.

### G. Add responsive and accessibility QA

Test desktop, tablet/iPad, and mobile.

### H. Run full verification

Run `npm run check`, UI smoke tests if available, diff check, and forbidden scan.

### I. Gemini review before commit

Do not commit Phase 7F until Gemini approves the uncommitted implementation diff.

## 15. Non-Goals

Phase 7F must not include:

- Extraction
- HTML parsing
- Candidate creation
- Duplicate detection
- Ranking
- AI enrichment
- LLM calls
- Approval workflow
- Public publishing
- Retry/re-run controls
- Scheduler
- Cron
- Worker
- Database migrations
- Public API changes
- Export/download
- Raw JSON debug viewer
- Browser rendering for fetch
- Screenshots for fetch
- Recursive crawling
- Sitemap parsing
- Robots parsing
- Link following

## 16. Gemini Gate

Phase 7E must be reviewed and approved by Gemini before Phase 7F implementation starts.

Phase 7F must also receive Gemini review before commit and push.

Implementation must not begin until Phase 7E is committed and pushed.
