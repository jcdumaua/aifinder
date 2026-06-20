# Phase 7D — Manual Metadata Fetch Results Review Design

## 1. Purpose

Phase 7D designs a future read-only admin review experience for manual metadata-fetch run results.

Phase 7C added a safe manual metadata fetch executor with:

- Admin-only execution
- Explicit `execution_mode: "manual_metadata_fetch"`
- Capped 1–3 URL batches
- All-or-nothing preflight before fetch
- Sequential metadata-only fetching
- Safe per-URL stats and audit events
- No extraction
- No LLM analysis
- No candidate creation
- No `discovered_tools` inserts
- No `public.tools` inserts
- No raw HTML or response body storage

The next safe step is not extraction yet. Admins first need a safe way to inspect what happened during each metadata-fetch run.

Phase 7D remains read-only and non-extractive. It only designs how future admin UI/API work should display existing run results safely.

## 2. Review Surface Options

### Option A — Reuse existing admin discovery run detail page

If an admin discovery run detail page already exists, future implementation should add a read-only metadata fetch results section there.

Benefits:

- Smallest UI surface.
- Reuses existing admin route protection.
- Keeps run-specific data in one place.
- Avoids adding a new route too early.

Risks:

- Existing page structure may need small layout adjustments.
- The run detail page must handle missing or older stats safely.

### Option B — Add a future read-only run result section inside the discovery admin area

A compact results section could be added to an existing admin discovery page.

Benefits:

- Easier for admins to find recent run results.
- Can show a summary without opening a deep detail page.

Risks:

- Could clutter the discovery dashboard.
- More likely to mix action controls with read-only review unless carefully separated.

### Option C — Add a new dedicated admin run results page

A new page could be created only for metadata-fetch result review.

Benefits:

- Clean separation.
- Easy to grow later.

Risks:

- Larger implementation scope.
- More routing and QA work.
- Not needed yet.

### Recommendation

Use Option A if a run detail page already exists.

If the existing page is not ready, use Option B as a compact read-only section in the current admin discovery area.

Do not create a new dedicated page in the first implementation unless Gemini approves it separately.

## 3. Data Source

Future implementation should use existing data only:

- `discovery_runs.status`
- `discovery_runs.stats`
- `discovery_runs.created_at`
- `discovery_runs.started_at` if available
- `discovery_runs.completed_at` if available
- `discovery_runs.source_id`
- linked discovery source name/type if already available safely
- `discovery_audit_events`

Phase 7D should not require:

- New tables
- New columns
- Migrations
- Raw fetch storage
- Response body storage
- HTML storage
- Candidate tables
- Public tool tables

## 4. Displayed Information

The future review UI should display only safe metadata.

### Summary card

Recommended fields:

- Run status
- Source name
- Source type
- Executor mode
- Total URLs
- Fetched URLs
- Failed URLs
- Skipped URLs
- Started time
- Completed time
- Duration summary if derivable
- Clear safety label: `Metadata only — no extraction performed`

### Safety flags

Display safety flags from stats:

- `no_extraction_performed`
- `no_llm_analysis_performed`
- `no_candidates_inserted`
- `no_public_tools_inserted`
- `no_fetch_performed` when relevant
- `dry_run` when relevant
- `execution_enabled`

### Per-URL result rows

Recommended columns:

- Hostname
- Normalized URL
- Status
- HTTP status
- Content type
- Content length header
- Resolved IP family
- Bytes read
- Response truncated
- Duration in milliseconds
- Safe error code
- Safe failure reason

The table should support partial-success runs where some URLs succeeded and others failed.

## 5. Forbidden Display Fields

The future UI must never display:

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
- Approval buttons
- Public publishing controls

The review UI must not imply that a fetched URL has become a discovered tool.

## 6. Audit Timeline

The future review UI should include a read-only audit timeline.

Relevant manual metadata fetch events:

- `manual_metadata_fetch_started`
- `manual_metadata_fetch_url_completed`
- `manual_metadata_fetch_url_failed`
- `manual_metadata_fetch_completed`
- `manual_metadata_fetch_failed`

Related existing events may also be shown:

- `metadata_fetch_smoke_started`
- `metadata_fetch_smoke_completed`
- `metadata_fetch_smoke_failed`
- dry-run/preflight events

Audit timeline display should include:

- Event type
- Timestamp
- Safe message
- Safe status
- Safe URL hostname when available
- Safe error code/failure reason when available

Audit timeline must not expose:

- Cookies
- CSRF tokens
- Admin session data
- Environment values
- Raw response bodies
- Raw HTML
- Raw headers except allowed metadata
- Stack traces

## 7. Security and Access

Future implementation must be:

- Admin-only
- Protected by existing admin session checks
- Not accessible from public routes
- Not accessible without authentication
- Read-only
- Non-mutating

Future implementation must not add:

- Retry button
- Re-run button
- Delete button
- Export/download button
- Candidate creation button
- Approval button
- Public publish button

Any future retry or re-run action must be designed in a separate phase.

## 8. UX Guidance

Keep the review experience simple and calm.

Recommended layout:

1. Summary card at top
2. Safety label: `Metadata only — no extraction performed`
3. Counts row
4. URL results table
5. Safety flags section
6. Audit timeline

UX requirements:

- Make success, partial success, and failure states visually clear.
- Avoid scary or overly technical error displays.
- Use plain labels for admin readability.
- Keep raw JSON hidden by default.
- Do not show raw stats JSON unless explicitly approved in a future admin-debug phase.
- Handle empty or missing stats safely.
- Handle old dry-run stats safely.
- Handle older runs that do not have manual metadata fields.

Responsive requirements:

- Desktop must show the full results table clearly.
- Tablet/iPad must avoid clipped columns and horizontal layout breaks.
- Mobile must use stacked rows or horizontally scrollable safe tables without covering content.
- No sticky/fixed element should cover run data.

## 9. Testing Plan

Future implementation should verify:

- Admin-only route/API protection.
- Unauthenticated access is rejected.
- Safe rendering of manual metadata-fetch stats.
- Safe rendering of metadata_fetch_smoke stats.
- Safe rendering of dry-run/preflight stats.
- Missing stats handled gracefully.
- Malformed stats handled gracefully.
- Failed run display.
- Partial-success run display.
- No raw body fields rendered.
- No raw HTML fields rendered.
- No candidate/publish/approval controls present.
- Existing admin pages still build.
- `npm run check` passes.

If UI changes are made, QA should include:

- Desktop result
- Tablet/iPad result
- Mobile result
- Responsive issues found
- Basic accessibility smoke
- No horizontal scroll unless intentionally limited to data tables
- No clipped buttons or overlapping cards

## 10. Non-Goals

Phase 7D does not include:

- Runtime implementation
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
- Browser rendering
- Screenshots
- Recursive crawling
- Sitemap parsing
- Robots parsing
- Link following

## 11. Gemini Gate

This Phase 7D docs-only design must be reviewed and approved by Gemini before any UI or API implementation begins.

Any future implementation should also receive Gemini review before commit and push.
