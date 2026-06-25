# Phase 7Z — Static Evidence Audit Timeline UI Plan

## 1. Purpose

Phase 7Z defines a docs-only plan for safely displaying static HTML evidence audit events in the authenticated admin Discovery Runs review UI.

The future audit timeline should help admins understand the operational history of `manual_static_html_derived_evidence` runs without exposing raw acquisition data, raw database rows, candidate payloads, or approval-oriented evidence.

This phase does not implement API, UI, normalizer, executor, helper, schema, script, dependency, smoke-test, cleanup, candidate, duplicate, ranking, recommendation, approval, publish, or LLM behavior.

## 2. Background

The static HTML evidence capability is now available as an admin-only, manual, bounded, in-memory, raw-HTML-free prototype. It can acquire static HTML for reviewed HTTPS URLs, derive tentative evidence, store safe run stats, and render those stats in a read-only admin review panel.

The Phase 7W smoke run verified the end-to-end path with:

- Run ID: `5f9440bc-9a5d-4faa-9feb-3cabcc97761b`
- URL: `https://example.com/`
- Result: PASS
- Desktop/tablet/mobile responsive QA: PASS

The completed static evidence review panel intentionally displays safe stats-derived review data only. It does not currently expose a static evidence audit timeline.

## 3. Relationship to Phase 7F / 7U / 7Y

Phase 7F established the precedent for a read-only Discovery Runs review surface with bounded audit timeline normalization for the manual metadata-fetch path. Its important pattern is not the exact metadata fields; it is the discipline of mapping audit records into a small, UI-safe response instead of rendering raw audit metadata.

Phase 7U completed the static HTML evidence admin review UI for safe `discovery_runs.stats` data. It keeps static-derived evidence separate from candidate, duplicate, ranking, recommendation, approval, and publish workflows.

Phase 7Y closed the static HTML evidence prototype track and recommended audit visibility and operational hygiene before any candidate extraction planning. Phase 7Z is that next docs-only audit visibility step.

## 4. Current limitation

The current static evidence review surface can show safe run stats and per-URL static-derived evidence, but it does not show the static evidence audit history.

The existing `GET /api/admin/discovery/runs` route fetches `discovery_audit_events`, but its audit mapper is currently scoped to manual metadata-fetch event types. Static evidence audit events are written by the claim path, yet they are not normalized into a dedicated static evidence timeline response for the UI.

This limitation is acceptable for the completed prototype, but it leaves admins without a compact operational history for:

- static evidence executor start,
- per-URL safe completion or failure,
- terminal static evidence completion or failure,
- safety flags attached to the audit trail.

## 5. Audit timeline objective

The future audit timeline should display static-evidence audit events for `manual_static_html_derived_evidence` runs only.

The timeline must:

- remain admin-only, read-only, and review-only;
- use `discovery_audit_events` as the source of truth;
- display operational/safety audit records, not candidate evidence and not tool approval evidence;
- keep the existing static evidence results panel separate from the audit timeline section;
- use a strict allowlist normalizer before any audit value reaches the client UI;
- avoid raw JSON views, raw database-row rendering, object stringification, or debug dumps;
- preserve the current no-candidate, no-public-tool, no-approval, no-publish, no-duplicate, no-ranking, no-recommendation, and no-LLM boundaries.

## 6. Data source and route scope

The future implementation should use the existing admin route path:

- `GET /api/admin/discovery/runs`

The route is already admin-session protected, dynamic, and no-store. A future implementation may extend its audit normalization to include a dedicated static evidence audit event mapper.

Recommended route scope:

- Read from `discovery_runs` as it does today.
- Read bounded matching rows from `discovery_audit_events`.
- Select only fields needed for safe normalization, preferably `metadata` and `created_at`.
- Filter candidate audit rows by run IDs already visible on the current runs page.
- Normalize server-side before returning data to the client.
- Return no raw audit rows, no raw metadata, no raw stats, and no full database records.

This plan does not authorize new routes, route mutations, schema changes, migrations, RLS changes, indexes, generated type changes, or discovery execution behavior.

## 7. Static evidence audit event allowlist

The future audit mapper should accept only static evidence event types that belong to the `manual_static_html_derived_evidence` execution path:

- `manual_static_html_derived_evidence_started`
- `manual_static_html_derived_evidence_url_completed`
- `manual_static_html_derived_evidence_url_failed`
- `manual_static_html_derived_evidence_completed`
- `manual_static_html_derived_evidence_failed`

Allowed normalized fields should be limited to:

- event action/type;
- timestamp;
- fixed safe timeline message;
- safe status label;
- safe URL index or count, if already bounded;
- safe acquisition status;
- safe evidence derivation status;
- safe bounded failure category or code;
- safe bounded failure reason, only from a fixed allowlist;
- raw HTML persisted flag;
- candidates created flag;
- public tools inserted flag;
- LLM analysis performed flag.

The UI should derive user-facing labels from the accepted event type and allowlisted flags. It should not display arbitrary `message` or `metadata` values unless those values are normalized through fixed enums, bounded booleans, or bounded numeric counts.

## 8. Explicitly forbidden audit fields

The future API and UI must not render, return for display, stringify, log for QA output, or expose:

- raw HTML;
- HTML snippets;
- visible text snippets;
- homepage title or headline snippets when sourced from page body;
- meta description snippets;
- hidden source text;
- scripts, styles, comments, or markup fragments;
- canonical or raw links with query strings or fragments;
- request headers;
- response headers except separately approved bounded content type/content length fields;
- cookies;
- admin cookies;
- auth/session values;
- CSRF values;
- API keys, environment values, tokens, credentials, or secrets;
- stack traces;
- unbounded exception messages;
- raw transport messages;
- raw request or response objects;
- full database rows;
- full metadata JSON;
- raw `stats`;
- raw `metadata`;
- candidate payloads;
- duplicate payloads;
- discovered-tool payloads;
- public-tool payloads;
- derived evidence snippets;
- body snippets;
- LLM prompts, completions, summaries, or interpretations.

If an audit metadata key is not explicitly allowlisted, it must be ignored.

## 9. Safe audit metadata normalizer design

The future implementation should add a dedicated static evidence audit normalizer. It should not reuse the metadata-fetch normalizer by expanding it with loosely typed branches.

Recommended normalizer behavior:

- Accept unknown input and return a safe typed array.
- Require exact static evidence event types.
- Require a string run ID that matches the visible run context.
- Accept timestamps only when they are strings that parse as valid dates.
- Convert event types to fixed UI labels.
- Validate status values through a static evidence status enum.
- Validate acquisition statuses through the existing static acquisition allowlist.
- Validate evidence derivation statuses through the existing static evidence status allowlist.
- Validate failure codes and reasons through fixed bounded allowlists.
- Accept URL index/count only as safe positive integers within the static evidence URL cap.
- Accept safety flags only as booleans.
- Default unsafe, unknown, malformed, or overlong values to `null` or omit them.
- Sort events by timestamp ascending after normalization.
- Cap events per run and cap total audit events per page.
- Never fallback to `JSON.stringify`.
- Never pass through raw audit metadata for client-side filtering.

The normalizer should be tested with intentionally hostile metadata containing raw HTML, body fields, headers, cookies, secrets, stacks, candidate objects, tool objects, and nested unknown JSON.

## 10. API response shape recommendation

The future `GET /api/admin/discovery/runs` response should keep the existing run shape stable and add a separate static audit property only when applicable.

Recommended additive shape:

```text
static_evidence_audit_events: [
  {
    event_type,
    label,
    created_at,
    status_label,
    url_index,
    url_count,
    acquisition_status,
    evidence_status,
    failure_code,
    failure_reason,
    raw_html_persisted,
    candidates_created,
    public_tools_inserted,
    llm_analysis_performed
  }
]
static_evidence_audit_warning: optional safe string
```

The response must not include raw audit rows, raw metadata, raw stats, raw executor results, raw HTML, derived snippets, headers, cookies, secrets, stack traces, transport payloads, or candidate/public-tool payloads.

If the route cannot fetch or normalize audit events, it should return the run data with a safe audit warning such as `Static evidence audit timeline is unavailable.` The warning must not include database error messages.

## 11. UI placement recommendation

The future UI should keep the current static evidence results panel intact and add a separate audit timeline section inside the expanded run review panel.

Recommended placement:

1. Static-derived evidence safety banner.
2. Static HTML evidence results summary.
3. Safety flags.
4. Per-URL evidence.
5. Static evidence audit timeline.

The audit timeline should be visually subordinate to the results summary. It should not replace the stats-derived review, and it should not be interleaved with tentative derived evidence in a way that implies audit records are candidate evidence.

The timeline section heading should be explicit:

- `Static evidence audit timeline`

Recommended helper text:

- `Operational audit records for this static evidence run. These records are not candidate evidence and do not approve or publish a tool.`

## 12. Timeline display design

The future timeline should use a compact ordered list or vertical timeline component.

Each item should display:

- fixed event label;
- timestamp;
- safe status badge;
- optional bounded URL position such as `URL 1 of 3`;
- optional safe acquisition/evidence status;
- optional fixed failure code or reason;
- safety flag chips for raw HTML, candidates, public tools, and LLM analysis.

Recommended labels:

- `Static evidence started`
- `URL evidence completed`
- `URL evidence failed safely`
- `Static evidence completed`
- `Static evidence failed safely`

Recommended safety flag wording:

- `Raw HTML not persisted`
- `No candidates created`
- `No public tools inserted`
- `No LLM/AI analysis performed`

The timeline must not include buttons for approval, publishing, candidate creation, duplicate actions, ranking, recommendations, retries, re-runs, exports, browser previews, screenshots, or LLM interpretation.

## 13. Empty / partial / failed audit states

The future UI must handle audit availability safely.

Required states:

- No static audit events available.
- Audit fetch failed.
- Audit normalization rejected all events.
- Partial audit timeline returned.
- Run completed but terminal audit event missing.
- Run failed safely.
- Run has stats review data but no static audit response.
- Run is not `manual_static_html_derived_evidence`.

Recommended safe messages:

- `No static evidence audit events are available for this run.`
- `Static evidence audit timeline is unavailable.`
- `Some static evidence audit records could not be displayed safely.`
- `This audit timeline is available only for static evidence runs.`

Do not display raw database, Supabase, transport, or exception details in any empty, partial, or failed state.

## 14. Security and privacy rules

The future timeline must preserve the static evidence capability boundaries:

- Admin-session protection remains required.
- GET response remains no-store.
- No CSRF-sensitive mutation is added because the timeline is read-only.
- The route returns only normalized, allowlisted timeline fields.
- The client renders only safe normalized values.
- The UI must not use `dangerouslySetInnerHTML`.
- The UI must not expose raw JSON.
- The UI must not expose raw HTML, headers, cookies, secrets, stack traces, body snippets, derived evidence snippets, or transport messages.
- Audit events must be labeled as operational/safety records.
- Audit events must not be described as tool validation, approval evidence, ranking evidence, recommendation evidence, or duplicate-resolution evidence.

If unsafe data appears in the future implementation during QA, implementation should stop and the issue should be treated as a blocker.

## 15. Accessibility requirements

The future timeline should preserve the accessibility behavior of the existing expanded run panel and add:

- a semantic section with `aria-labelledby`;
- a visible heading for the audit timeline;
- chronological list semantics with `ol` and `li`, or equivalent accessible structure;
- timestamp text that is readable without color;
- status labels that do not rely on color alone;
- focus-safe expand/collapse behavior inherited from the parent review panel;
- sufficient contrast for badges and warnings;
- screen-reader friendly labels for safety flags;
- no hover-only required information;
- no hidden critical status behind icons;
- long labels and failure codes that wrap safely.

The timeline should remain understandable when read linearly by a screen reader.

## 16. Desktop/tablet/mobile responsive requirements

The future implementation should be manually verified at minimum on:

- Desktop: 1440 by 1000.
- Tablet/iPad portrait: 768 by 1024.
- Tablet/iPad landscape: 1024 by 768.
- Mobile: 390 by 844.
- Small mobile: 360 by 740.

Requirements:

- No page-level horizontal scrolling.
- Timeline items stack cleanly on mobile.
- Long event labels, status labels, failure codes, and URL position text wrap within the panel.
- Safety flag chips wrap without clipping.
- The expanded panel remains inside the Discovery Runs row width.
- Pagination, filters, and the Review results / Hide results controls remain usable.
- No sticky or fixed element covers the timeline.
- The existing static evidence results panel remains readable when the timeline is present.

## 17. Testing plan

The future implementation should include focused tests for the API normalizer, route response, and client rendering.

Recommended tests:

- Static audit normalizer accepts the five allowed static evidence event types.
- Static audit normalizer rejects metadata-fetch, dry-run, request-plan, duplicate, candidate, approval, publish, ranking, recommendation, and unknown event types.
- Static audit normalizer strips unknown metadata keys.
- Static audit normalizer rejects raw HTML, HTML snippets, visible text snippets, body fields, headers, cookies, secrets, stack traces, raw transport messages, full metadata JSON, raw stats, candidate payloads, discovered-tool payloads, and public-tool payloads.
- Static audit normalizer accepts only bounded URL indexes/counts.
- Static audit normalizer accepts only fixed safe status, acquisition, evidence, failure-code, and failure-reason values.
- Static audit normalizer maps booleans into safe safety flags.
- Route returns static audit events only for visible static evidence runs.
- Route preserves existing manual metadata-fetch audit behavior.
- Route returns safe audit warnings without database error details.
- UI renders timeline labels and safety flags from normalized data.
- UI renders empty, partial, failed, and unavailable states without raw fallback.
- UI includes no approve, publish, candidate, duplicate, ranking, recommendation, retry, re-run, export, browser automation, screenshot, or LLM controls.
- Existing Discovery Runs pagination, status filtering, refresh, and results review toggles remain functional.

`npm run lint` and `npm run check` should pass before any future implementation is marked ready for review.

## 18. Manual QA plan

Future manual QA should use existing authenticated admin access only.

Recommended QA steps:

1. Open the admin Discovery page as an authenticated admin.
2. Locate a completed `manual_static_html_derived_evidence` run.
3. Expand Review results.
4. Confirm the static evidence results panel still shows the existing safe stats review.
5. Confirm the separate audit timeline section appears below the results content.
6. Confirm the timeline shows only fixed operational/safety labels.
7. Confirm raw HTML, snippets, headers, cookies, secrets, stacks, raw JSON, raw stats, raw metadata, candidate payloads, and public-tool payloads are not visible.
8. Confirm no approve, publish, candidate, duplicate, ranking, recommendation, retry, re-run, export, browser preview, screenshot, or LLM controls appear.
9. Confirm non-static runs do not show the static evidence timeline.
10. Confirm desktop, tablet, and mobile layouts have no horizontal page overflow or clipped controls.

Do not run a new smoke test unless a separately approved phase requests it.

## 19. Gemini review gates

Gemini review is required before any future implementation changes:

- `GET /api/admin/discovery/runs` audit normalization or response shape;
- static evidence audit normalizer logic;
- Discovery Runs table expanded-panel selection logic;
- static evidence audit timeline component;
- event type allowlist;
- failure code/reason allowlist;
- safety flag wording;
- any decision to display URL-like values;
- any decision to make links clickable;
- any commit containing API/UI audit timeline changes.

Gemini should specifically review for raw-data exposure, overbroad metadata passthrough, accidental candidate/approval semantics, and responsive/accessibility regressions.

## 20. Rollback plan

The future implementation should be additive and easy to disable.

Rollback steps:

1. Remove the static audit timeline render branch from the static evidence review panel.
2. Remove the static audit response property from the runs API mapping.
3. Remove the static audit normalizer and its tests.
4. Preserve existing static evidence stats review behavior.
5. Preserve existing manual metadata-fetch audit timeline behavior.
6. Do not modify or delete `discovery_runs` or `discovery_audit_events`.
7. Re-run lint/check and focused review tests after rollback.

Because the timeline should be read-only, rollback should not require data cleanup.

## 21. Non-goals

This phase and the future timeline implementation do not authorize:

- automated discovery;
- crawler scheduling;
- workers or cron;
- browser rendering automation;
- screenshots;
- candidate extraction;
- candidate creation;
- `discovered_tools` writes;
- `public.tools` writes;
- duplicate detection or duplicate actions;
- ranking or recommendation;
- approval or publish behavior;
- LLM/AI analysis or interpretation;
- public UI changes;
- schema, migration, RLS, index, policy, or generated type changes;
- raw audit JSON viewer;
- raw stats viewer;
- cleanup or retention tooling.

## 22. Implementation boundaries

Future implementation should be limited to the smallest API/UI slice needed for safe audit visibility.

Likely future files:

- `app/api/admin/discovery/runs/route.ts`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/manual-static-html-evidence-results-review.tsx`
- a dedicated static audit normalizer under `lib/`
- focused tests under `testing/`

Files that should remain out of scope:

- executor code;
- bounded HTML acquisition adapter;
- static evidence derivation helper;
- normalizers unrelated to static audit display;
- API mutation routes;
- Supabase schema, migrations, RLS, indexes, policies, generated types;
- dependency manifests;
- public pages and public API routes.

The implementation should not alter how static evidence runs execute. It should only display already-persisted safe audit metadata through a strict allowlist.

## 23. Recommended next implementation phase

Recommended next phase:

**Phase 8A — Static Evidence Audit Timeline API/UI Implementation Plan**

If the project continues Phase 7 naming, the equivalent name is:

**Phase 7AA — Static Evidence Audit Timeline API/UI Implementation Plan**

The next phase should still be docs-only. It should define exact files, types, tests, fixtures, route response shape, UI component changes, rollback steps, and Gemini review criteria before any code is changed.

Candidate extraction implementation should not start until audit visibility and retention/cleanup decisions are documented and approved.

## 24. Final conclusion

Static HTML evidence has reached a safe prototype closure state, but audit visibility should be improved before candidate extraction planning.

Phase 7Z recommends a future admin-only, read-only static evidence audit timeline that uses `discovery_audit_events`, strict static-event allowlists, server-side safe normalization, and a separate UI section below the existing static evidence results panel.

The timeline must remain operational/safety context only. It must not expose raw acquisition data, raw JSON, snippets, candidate payloads, public-tool payloads, approval evidence, ranking/recommendation controls, or LLM interpretation.
