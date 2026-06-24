# Phase 7T — Static HTML Evidence Admin Review UI Plan

## 1. Purpose

Phase 7T defines a future read-only admin review surface for the bounded static HTML derived evidence produced by Phase 7S.

The objective is to let an authenticated admin inspect safe, tentative, per-URL evidence already present in a Discovery Run without treating it as a tool, candidate, approval, ranking, recommendation, or public data.

## 2. Relationship to Phase 7F / 7R / 7S

- Phase 7F added the existing read-only manual metadata-fetch review panel, its safe normalizer, and bounded audit lookup.
- Phase 7R designed the static-evidence executor wiring boundary, including in-memory HTML handling, allowlisted evidence, and no-candidate rules.
- Phase 7S added the manual_static_html_derived_evidence executor mode. Its run stats contain bounded counters, safe per-URL acquisition fields, tentative derived evidence, and explicit false safety flags for raw HTML persistence and candidate creation.

Phase 7T plans only the future presentation of this data. It does not extend the executor, change how evidence is acquired, or authorize a new data meaning.

## 3. Why This Phase Is Docs-Only

A UI implementation would require a new client-side normalizer and a new review panel inside the protected Discovery Runs area. It may also require an explicit safe audit-timeline decision because the current runs endpoint only maps manual metadata-fetch audit event types.

Those choices must be reviewed before code is changed. This phase adds no UI, route, helper, or schema behavior.

## 4. Future UI Objective

The future UI should add a read-only Review results toggle for runs whose stats.executor_mode is manual_static_html_derived_evidence.

It should:

- Stay inside the existing Discovery Runs history surface.
- Reuse the existing per-row expanded-panel pattern, button text, aria-expanded, aria-controls, pagination, and status filters.
- Display only normalized, allowlisted static-derived evidence from discovery_runs.stats.
- Clearly distinguish acquisition status from tentative evidence.
- Show a safe empty-state or unavailable message when data is missing or malformed.
- Provide no mutate, retry, re-run, export, approval, publish, ranking, or candidate controls.

The first UI slice should not add a public page, public endpoint, or admin form.

## 5. Current Data Source Assumptions

Current observed behavior:

- GET /api/admin/discovery/runs is admin-session protected and returns no-store responses.
- It returns current-page discovery_runs records, including their stats value, to the existing DiscoveryRunsTable client.
- Existing lib/discovery-run-results-review.ts accepts only executor_mode manual_metadata_fetch. A static-evidence run currently falls back to the legacy compact stats display and has no review button.
- Existing ManualMetadataFetchResultsReview is metadata-specific and should not be repurposed by accepting unknown static evidence keys.
- Current audit lookup has a small manual-metadata-fetch event mapper. The Phase 7S static audit event family is not currently normalized or returned as a useful static-evidence timeline.

Future UI code must treat stats and audit_events as untrusted unknown values. It must use a dedicated allowlist normalizer before rendering anything.

The recommended first display slice is stats-only. Static audit-timeline support should remain absent until a separately approved API and normalizer extension is designed. Audit unavailability must not break the run list or review panel.

## 6. Safe Derived Evidence Display Model

Future normalization should produce a dedicated ManualStaticHtmlEvidenceReview model, not reuse the metadata-fetch type or render raw JSON.

The model should contain only:

- Executor mode and execution status.
- Bounded summary counts.
- Explicit boolean safety flags.
- At most the backend URL cap of per-URL result records.
- Safe acquisition metadata.
- Tentative derived evidence fields that already exist in Phase 7S stats and pass UI normalization.

The normalizer must:

- Require the exact static executor mode.
- Ignore unknown top-level, per-URL, and derived-evidence keys.
- Validate URL protocol, hostname, status enums, content type, numbers, booleans, error codes, and fixed failure reasons.
- Strip URL query strings and fragments again before display.
- Apply a UI display cap to text, arrays, and results even when backend values are malformed.
- Return null or a safe empty review for malformed input.
- Never use object stringification or JSON rendering as a fallback.

## 7. Fields Allowed to Display

Safe run summary fields:

- Run status, source ID or Manual / unknown, executor mode, execution status.
- Total URLs, attempted URLs, acquired URLs, evidence-attempted URLs, evidence-produced URLs, failed URLs, skipped URLs, and all-failed status.
- Started time, finished time, and safely derived duration.
- no_fetch_performed, no_extraction_performed, no_llm_analysis_performed, no_candidates_inserted, no_public_tools_inserted, raw_html_persisted, candidates_created, dry_run, and execution_enabled.

Safe per-URL acquisition fields:

- normalized_url after UI sanitization.
- hostname.
- status and acquisition_status.
- http_status.
- content_type and content_length_header.
- resolved_ip_family.
- bytes_read, response_truncated, duration_ms.
- error_code and fixed failure_reason.
- extraction_status, extraction_version, and evidence_attempted.

Safe tentative evidence fields, when the normalizer accepts them:

- title, metaDescription, openGraphTitle, openGraphDescription.
- canonicalUrl.
- homepageHeadlineSnippet and visibleTextSnippet, within a strict display cap.
- appStoreLinks, pricingLinks, contactLinks, and docsLinks, within the backend/UI list cap.
- productNameHint, companyNameHint, categoryHints, aiToolRelevanceHints.
- confidenceLabel only when it is exactly tentative.
- truncated and safetyFlags from the helper allowlist.

Text must be presented as untrusted, tentative static-derived evidence. Link values should initially render as sanitized text, not action controls. A future decision to make them clickable requires a separate explicit URL-policy review.

## 8. Fields Forbidden to Display

The UI must never display or stringify:

- Raw HTML, full response body, arbitrary body text, scripts, styles, comments, hidden source text, or source markup.
- Raw request/response headers except the allowlisted content type and content-length values.
- Cookies, admin cookies, CSRF tokens, auth tokens, API keys, environment values, secrets, or private user data.
- Raw adapter result objects, response objects, request plans, exception objects, stack traces, or full transport messages.
- Unknown stats keys, arbitrary embedded JSON, raw audit metadata, or error_log fallback text for static review records.
- Candidate, discovered-tool, public-tool, duplicate, approval, publish, score, ranking, recommendation, trust, or vendor-verification fields.
- Browser-rendered content, screenshots, captured assets, or any LLM/AI interpretation.

HTTP success, a title, a canonical URL, or AI relevance hints must not be displayed as verified product evidence.

## 9. Per-URL Review Layout

Use a compact per-URL card layout because Phase 7S caps the run at three URLs. Avoid a wide all-fields table as the primary mobile layout.

Each card should include:

1. A compact header with hostname, sanitized URL text, outcome status, and acquisition status.
2. A small acquisition metadata definition list: HTTP, content type, bytes, duration, truncation, and safe failure label.
3. A tentative evidence section only when extraction_status is derived.
4. Optional bounded evidence groups for page metadata, snippets, sanitized link text, and tentative hints.
5. An explicit footer message: No candidate created. Raw HTML not stored.

For desktop, cards may use a two-column metadata/evidence grid. For narrow widths, each card must become a single column. Long URLs, statuses, hints, and error codes must wrap without expanding the page width.

If the future design uses a data table for acquisition fields, it must be inside a contained horizontal-scroll region with a practical minimum width. Evidence snippets must remain card content rather than narrow table columns.

## 10. Summary Card Layout

The expanded panel should begin with:

- A safety banner: Static-derived evidence — tentative. Raw HTML was not stored.
- A short read-only explanation: No candidate was created. Human review is required.
- A summary card grid matching the existing manual metadata review visual language.

Recommended summary groups:

- Run context: run status, source, executor mode, execution status, started, finished, duration.
- Processing: total, attempted, acquired, evidence attempted, evidence produced, failed, skipped.
- Safety: no fetch, no extraction, no LLM analysis, no candidate insert, no public-tool insert, raw HTML persisted, candidates created, dry run, execution enabled.

Invalid values must show an em dash or zero according to the existing normalizer convention. The panel must never dump stats JSON.

## 11. Failure/Status Display Rules

Use fixed, neutral labels only:

- Evidence derived
- Acquisition failed safely
- Evidence unavailable
- Evidence failed safely
- Completed with safe all-failed results
- Preflight rejected
- No per-URL evidence recorded

Show error_code and failure_reason only after allowlist validation. Do not interpolate raw upstream error messages.

An all-failed completed run is an operational result, not a successful tool discovery. It should show an informational neutral or amber status treatment, not a success claim.

A failed run caused by preflight or executor-level failure should show a concise safe label and must not reveal internal error details.

## 12. Safety Badges and Boundary Messaging

Every static-evidence review panel should include visible, concise boundary language:

- Static-derived evidence — tentative
- Raw HTML not stored
- No candidate created
- No public tool created
- No LLM/AI analysis performed
- Human review required

Avoid these phrases:

- Tool discovered
- Verified AI tool
- Candidate ready
- Approved
- Trusted
- Recommended
- Ranked
- Safe vendor
- Ready to publish

Badges must be descriptive status indicators only. They must not become buttons, filters that mutate data, or workflow actions.

## 13. No Action Workflow Rules

The review surface is read-only.

Allowed interaction:

- Expand or collapse a run result panel.
- Use existing refresh, status filter, and pagination controls.
- Copy or select visible plain text through normal browser behavior.

Forbidden controls:

- Create candidate
- Approve, reject, publish, or unpublish
- Retry, re-run, queue, schedule, or crawl
- Compare, merge, duplicate-link, rank, recommend, or enrich
- Export raw data or evidence
- Open a browser-rendered preview, screenshot, or external acquisition flow

Do not introduce a mutation request from this panel.

## 14. Responsive Design Requirements

Validate the future UI at these minimum sizes:

- Desktop: 1440 by 1000.
- Tablet/iPad portrait: 768 by 1024.
- Tablet/iPad landscape: 1024 by 768.
- Mobile: 390 by 844.
- Small mobile: 360 by 740.

Requirements:

- No page-level horizontal scroll.
- Summary cards use one column on small mobile, two columns on tablet where readable, and a bounded multi-column grid on desktop.
- Per-URL cards remain readable with break-words and min-w-0 for long URL, source, status, and hint values.
- Buttons remain full-width or clearly separated on small viewports; Review results and Hide results must never overlap adjacent content.
- Any acquisition table uses contained horizontal scrolling only.
- Evidence link lists wrap as block text and are capped; they do not create overly narrow columns.
- The expanded panel remains within the list row width and does not obscure pagination or filters.

## 15. Accessibility Requirements

Future implementation must preserve and add:

- The existing accessible Review results and Hide results button labels.
- aria-expanded and aria-controls connected to the expanded panel.
- A panel section with an aria-labelledby heading.
- Hierarchical headings: run results, safety flags, per-URL evidence, and audit status if later approved.
- Semantic dl elements for summary cards and safety flags.
- Semantic article or list structure for each URL result; semantic table markup only for tabular acquisition fields.
- Keyboard access to expand/collapse controls, existing filter, refresh, and pagination.
- Visible focus states with sufficient contrast.
- Status text that does not rely on color alone.
- Screen-reader labels for abbreviated values, boolean flags, truncated text, and all-failed state.
- Safe text wrapping; no hover-only information or tooltips required to understand a status.

## 16. Future Implementation Files

Likely modified files:

- components/admin/discovery/discovery-runs-table.tsx
- lib/discovery-run-results-review.ts
- testing/discovery-run-results-review.test.mjs

Likely new file:

- components/admin/discovery/manual-static-html-evidence-results-review.tsx

Optional future API file only if static audit timeline support is separately approved:

- app/api/admin/discovery/runs/route.ts

The first UI implementation should prefer stats-only display and avoid changing the API route. If audit support is approved later, the API must remain admin-only, GET-only, no-store, bounded, and must return only a second dedicated static audit allowlist.

No executor, adapter, static evidence helper, schema, migration, or package file should be modified for UI display.

## 17. Required Future Tests

Future implementation must add or update tests for:

- The static normalizer accepts only manual_static_html_derived_evidence and ignores all unknown executor modes.
- Unknown raw_html, html, body, header, cookie, secret, token, stack, candidate, and arbitrary JSON keys are excluded.
- URLs are HTTPS-only, sanitized, and query/fragment-free before display.
- Counts, booleans, statuses, error codes, failure reasons, text lengths, result count, and link-list count are bounded.
- Derived evidence is accepted only through the Phase 7S/Phase 7M allowlist and confidenceLabel is exactly tentative.
- Malformed static stats render no raw fallback or JSON.
- Static runs receive the read-only review toggle while manual metadata runs preserve their existing panel behavior.
- Audit absence does not break the static stats review.
- No action/mutation controls are introduced.
- Existing review normalizer tests remain green.
- Keyboard navigation, aria-expanded, aria-controls, headings, and screen-reader labels work.
- Responsive visual QA passes at desktop, tablet/iPad, mobile, small mobile, and contained-table scroll widths.
- No raw evidence appears in rendered DOM, API fixtures, console output, or error fallbacks.

## 18. Gemini Review Gates

Gemini review is required before:

- Any static evidence review normalizer or component is implemented.
- The existing Discovery Runs table selection logic is changed.
- Any API audit-event mapping or response shape is extended.
- Any derived-evidence field is added to the display allowlist.
- Any link is made clickable.
- Any UI wording could imply candidate status, approval, trust, ranking, recommendation, or publishing.
- Any commit containing the UI implementation.

Human approval remains required before commit or push.

## 19. Rollback Plan

The first UI slice should be additive and reversible:

1. Remove the static-mode branch from DiscoveryRunsTable.
2. Remove the dedicated static review component and normalizer branch.
3. Preserve existing manual metadata review behavior and existing run-list pagination/filter behavior.
4. Leave Phase 7S run stats unchanged; no data migration or cleanup is needed.
5. Do not remove or modify audit records.
6. Re-run existing Discovery Runs and metadata-review tests after rollback.

## 20. Safety Boundaries

Phase 7T changes only this plan document.

- No UI, API, executor, helper, adapter, database, schema, RLS, index, policy, package, or dependency change is made.
- No external network call, raw HTML storage, browser rendering, screenshot, scheduler, worker, cron, or LLM/AI analysis is added.
- No candidate, duplicate, ranking, recommendation, approval, publish, discovered_tools, or public.tools behavior changes.
- No commit or push is performed.

## 21. Verification Commands

For this Phase 7T docs-only change, run:

~~~bash
cd /Users/jamescarlodumaua/aifinder
git diff --check
npm run lint
npm run check
git status --short --branch
~~~

If npm run check encounters the known sandbox-only Turbopack port-binding restriction, rerun it in an approved elevated environment and report both outcomes.

## 22. CCR Report Requirements

The Phase 7T completion report must include:

- Summary
- Files changed
- Boundary confirmation
- Design notes
- Verification results
- Risks and follow-ups
- Exact final git status --short --branch output
- Confirmation that no commit or push was performed
