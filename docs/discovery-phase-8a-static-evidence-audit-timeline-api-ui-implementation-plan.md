# Phase 8A — Static Evidence Audit Timeline API/UI Implementation Plan

## 1. Purpose

Phase 8A defines the future API/UI implementation plan for safely showing static evidence audit timeline events in the admin Discovery Runs review UI.

This is a docs-only phase. It does not implement the timeline. It prepares the exact future scope, file boundaries, normalization rules, response shape, UI placement, tests, QA, rollback, and review gates for a later implementation phase.

The implementation goal is to let authenticated admins review operational/safety audit events for `manual_static_html_derived_evidence` runs without exposing raw acquisition data, raw audit metadata, raw stats, candidate payloads, public-tool payloads, approval evidence, ranking/recommendation data, or LLM interpretation.

## 2. Relationship to Phase 7Z

Phase 7Z established the product and safety design for a static evidence audit timeline. Phase 8A converts that design into a concrete implementation plan for the next code phase.

Phase 7Z decisions carried forward:

- show static evidence audit events for `manual_static_html_derived_evidence` runs only;
- keep the timeline admin-only, read-only, and review-only;
- use `discovery_audit_events` as the source;
- use strict allowlist normalization;
- keep the static evidence results panel separate from the audit timeline;
- place the audit timeline below the existing static evidence results panel;
- avoid raw JSON, raw database rows, raw metadata, raw stats, raw HTML, snippets, headers, cookies, secrets, stacks, transport payloads, candidate/public-tool payloads, approval/publish controls, duplicate controls, ranking/recommendation controls, and LLM controls.

## 3. Implementation scope

The future implementation should be additive and minimal.

In scope for the future implementation phase:

- add a dedicated static evidence audit review normalizer;
- extend `GET /api/admin/discovery/runs` only if needed to include normalized static audit events;
- add a dedicated read-only static evidence audit timeline component;
- pass normalized timeline props into the existing static evidence results review panel;
- render the timeline below the existing static evidence results content;
- add focused normalizer tests;
- add route response shape tests if the route is changed;
- add UI rendering tests by safe props if practical;
- preserve manual metadata-fetch review behavior.

Preferred new files:

- `lib/discovery-static-html-evidence-audit-review.ts`
- `testing/discovery-static-html-evidence-audit-review.test.mjs`
- `components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx`

Likely modified files in the future implementation:

- `app/api/admin/discovery/runs/route.ts`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/manual-static-html-evidence-results-review.tsx`

## 4. Hard non-goals

The future implementation must not add:

- source-code behavior outside the approved API/UI audit display slice;
- Supabase schema changes, migrations, RLS changes, indexes, policies, or generated type changes;
- executor, helper, adapter, crawler, acquisition, or evidence derivation changes;
- new scripts or dependencies;
- a new smoke test;
- candidate creation;
- writes to `discovered_tools`;
- writes to `public.tools`;
- duplicate detection or duplicate actions;
- ranking or recommendation;
- approval or publish behavior;
- LLM/AI analysis or interpretation;
- browser rendering automation;
- screenshots;
- scheduler, worker, or cron behavior;
- public UI changes;
- raw audit JSON viewer;
- raw stats viewer;
- cleanup or retention tooling.

The timeline must not become a discovery, extraction, candidate, duplicate, approval, publish, ranking, recommendation, or LLM workflow.

## 5. Current code surface

Current relevant files:

- `app/api/admin/discovery/runs/route.ts`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/manual-static-html-evidence-results-review.tsx`
- `lib/discovery-static-html-evidence-results-review.ts`
- `app/api/admin/discovery/runs/manual/claim/route.ts`

Current behavior:

- `GET /api/admin/discovery/runs` is admin-session protected, dynamic, no-store, and returns paginated `discovery_runs`.
- The route already reads `discovery_audit_events` for visible run IDs and returns a normalized `audit_events` array for manual metadata-fetch events.
- The existing audit mapper is scoped to manual metadata-fetch event types.
- `DiscoveryRunsTable` already chooses between manual metadata-fetch review and static HTML evidence review based on normalized `run.stats`.
- `ManualStaticHtmlEvidenceResultsReview` renders safe stats-derived static evidence review data.
- `lib/discovery-static-html-evidence-results-review.ts` normalizes static evidence stats and already contains useful allowlists for executor mode, execution statuses, evidence statuses, acquisition statuses, failure reasons, extraction statuses, safe hostnames, safe error codes, counts, links, hints, and booleans.
- The static evidence claim route writes `discovery_audit_events` for `manual_static_html_derived_evidence_started`, per-URL completed/failed events, terminal completed events, and terminal failed events.

Current gap:

- Static evidence audit events are persisted but are not normalized into a dedicated static evidence timeline for the admin UI.

## 6. API implementation plan

Future implementation should extend `GET /api/admin/discovery/runs` only as needed.

Recommended route approach:

1. Keep existing run query, pagination, status filtering, admin-session protection, no-store headers, and `MAX_AUDIT_EVENTS_PER_PAGE`.
2. Continue fetching audit rows only for run IDs already present on the current page.
3. Continue selecting only `metadata` and `created_at` from `discovery_audit_events`.
4. Preserve existing manual metadata-fetch audit normalization and response behavior.
5. Add a second static evidence audit grouping map, separate from the existing manual metadata map.
6. For each audit row:
   - confirm `metadata` is an object;
   - confirm `metadata.run_id` is a string and belongs to the visible run IDs;
   - send only the allowed raw input fields into the static audit normalizer;
   - ignore non-static event types for the static map;
   - never attach raw audit rows or raw metadata to the response.
7. Add normalized static audit events to runs whose stats normalize as `manual_static_html_derived_evidence`.
8. Do not add static audit events to non-static runs.
9. Return a safe static audit warning if audit fetch fails.

The route should not expose Supabase errors. Existing server logs may record safe operational failures, but the client response must remain bounded and non-sensitive.

## 7. Static audit event normalizer plan

Preferred helper:

- `lib/discovery-static-html-evidence-audit-review.ts`

Recommended exported types:

- `ManualStaticHtmlEvidenceAuditEvent`
- `ManualStaticHtmlEvidenceAuditInput`
- `normalizeManualStaticHtmlEvidenceAuditEvents`

Allowed event types:

- `manual_static_html_derived_evidence_started`
- `manual_static_html_derived_evidence_url_completed`
- `manual_static_html_derived_evidence_url_failed`
- `manual_static_html_derived_evidence_completed`
- `manual_static_html_derived_evidence_failed`

Allowed normalized fields:

- `eventType`
- `label`
- `createdAt`
- `statusLabel`
- `urlIndex`
- `urlCount`
- `acquisitionStatus`
- `evidenceStatus`
- `failureCode`
- `failureReason`
- `rawHtmlPersisted`
- `candidatesCreated`
- `publicToolsInserted`
- `llmAnalysisPerformed`

Normalizer rules:

- Accept `unknown` input.
- Return an array of safe typed events.
- Reject non-record inputs.
- Reject non-static event types.
- Reject events with missing or invalid timestamps.
- Accept URL indexes and counts only as safe integers within the static URL cap.
- Accept acquisition status only from the static acquisition allowlist.
- Accept evidence status only from the static evidence status allowlist.
- Accept failure code only when it matches a short uppercase safe-code pattern.
- Accept failure reason only from the static bounded failure-reason allowlist.
- Accept safety flags only as booleans.
- Derive labels from event type, not from raw metadata messages.
- Derive status labels from known event/status values, not from raw strings.
- Sort normalized events by timestamp ascending.
- Cap events per run to a small bounded number.
- Ignore unknown keys.
- Never use object stringification, JSON dumps, or raw fallback rendering.

Explicitly forbidden normalizer output:

- raw HTML;
- HTML snippets;
- visible text snippets;
- title, headline, body, or meta description snippets;
- headers;
- cookies;
- auth/session/CSRF values;
- stack traces;
- unbounded exception messages;
- raw transport messages;
- full DB rows;
- raw `metadata`;
- raw `stats`;
- raw JSON dumps;
- candidate payloads;
- discovered/public tool payloads;
- LLM prompts or responses.

## 8. API response shape

Recommended additive response fields on each run:

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

Response rules:

- Include `static_evidence_audit_events` only for static evidence runs, or include it as an empty array only when the UI branch is static evidence.
- Do not reuse the existing `audit_events` property for static events unless the implementation explicitly preserves backward compatibility and makes the event family distinguishable.
- Keep manual metadata-fetch `audit_events` behavior unchanged.
- Use snake_case in API output to match the existing route style.
- Convert to camelCase only inside client-side TypeScript props or a client normalizer, if needed.
- Return no raw audit row fields beyond the normalized shape.
- Return no raw metadata, raw stats, raw JSON, raw HTML, snippets, headers, cookies, secrets, stacks, transport payloads, candidate payloads, discovered-tool payloads, public-tool payloads, or LLM payloads.

Safe warning examples:

- `Static evidence audit timeline is unavailable.`
- `Some static evidence audit records could not be displayed safely.`

Unsafe warning examples:

- raw Supabase error strings;
- SQL details;
- stack traces;
- serialized exception objects;
- raw metadata samples.

## 9. UI implementation plan

Future UI work should keep the static evidence results panel separate and place the timeline below the existing results content.

Recommended UI approach:

1. Extend the `DiscoveryRun` client type in `discovery-runs-table.tsx` with optional static audit fields.
2. Normalize or trust only the server-normalized static audit shape; do not parse raw metadata client-side.
3. Pass `staticEvidenceAuditEvents` and `staticEvidenceAuditWarning` props into `ManualStaticHtmlEvidenceResultsReview`.
4. Keep the existing summary, safety flags, and per-URL evidence sections unchanged.
5. Render `<ManualStaticHtmlEvidenceAuditTimeline />` after the per-URL evidence section.
6. Render the timeline only for `manual_static_html_derived_evidence` review panels.
7. Keep the timeline read-only.

The timeline should be visibly labeled as operational/safety audit context. It must not be presented as candidate evidence, tool approval evidence, ranking evidence, recommendation evidence, or duplicate-resolution evidence.

## 10. Component structure

Preferred new component:

- `components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx`

Recommended props:

```text
type ManualStaticHtmlEvidenceAuditTimelineProps = {
  events: ManualStaticHtmlEvidenceAuditEvent[];
  warning?: string | null;
};
```

Component responsibilities:

- render a heading: `Static evidence audit timeline`;
- render helper text explaining that events are operational/safety audit records;
- render empty, warning, partial, failed, and normal states;
- render a chronological list of normalized events;
- render fixed event labels;
- render safe timestamps;
- render safe status/acquisition/evidence/failure labels;
- render bounded URL position when available;
- render safety flag chips;
- avoid all mutation controls.

The existing `ManualStaticHtmlEvidenceResultsReview` should remain responsible for the static evidence stats review. It should import and place the timeline component below its existing per-URL evidence section.

The existing `DiscoveryRunsTable` should remain responsible for expanded row selection, `aria-expanded`, `aria-controls`, pagination, filtering, loading, and error states.

## 11. Empty/partial/failed states

The future UI must handle:

- no static audit events;
- audit fetch warning;
- some audit records rejected by normalization;
- completed run with missing terminal audit event;
- failed static evidence run;
- static evidence stats available but no static audit response;
- non-static run;
- malformed static audit response.

Recommended safe messages:

- `No static evidence audit events are available for this run.`
- `Static evidence audit timeline is unavailable.`
- `Some static evidence audit records could not be displayed safely.`
- `Static evidence run failed safely.`

Do not display raw database messages, raw Supabase errors, raw exception text, stack traces, raw metadata, raw stats, or raw JSON in any state.

## 12. Security and privacy rules

The future implementation must preserve:

- authenticated admin access only;
- read-only behavior;
- no mutation requests from the timeline;
- no CSRF-sensitive actions;
- no raw HTML persistence or rendering;
- no raw JSON rendering;
- no raw audit row exposure;
- no raw metadata exposure;
- no raw stats exposure;
- no candidate or public-tool payload exposure;
- no approval/publish/duplicate/ranking/recommendation/LLM controls.

Explicitly forbidden to render or return:

- raw HTML;
- HTML snippets;
- visible text snippets;
- title/headline/body snippets;
- meta description snippets;
- headers;
- cookies;
- auth/session/CSRF values;
- stack traces;
- unbounded exception messages;
- raw transport messages;
- full DB rows;
- raw `metadata`;
- raw `stats`;
- raw JSON dumps;
- candidate payloads;
- discovered/public tool payloads;
- LLM prompts/responses.

The UI must not use `dangerouslySetInnerHTML`.

## 13. Accessibility requirements

Future implementation should include:

- semantic `section` for the timeline with `aria-labelledby`;
- visible timeline heading;
- chronological list semantics with `ol` and `li`;
- status labels that do not rely on color alone;
- readable timestamps;
- accessible safety flag labels;
- keyboard-preserved expand/collapse behavior from the parent row;
- no hover-only information;
- visible focus states for existing interactive controls;
- sufficient color contrast for timeline badges and warnings;
- wrapping for long labels, failure codes, and status strings;
- no icon-only critical information.

The timeline should remain understandable when read top-to-bottom by a screen reader.

## 14. Desktop/tablet/mobile responsive requirements

Manual responsive QA should include:

- Desktop: 1440 by 1000.
- Tablet/iPad portrait: 768 by 1024.
- Tablet/iPad landscape: 1024 by 768.
- Mobile: 390 by 844.
- Small mobile: 360 by 740.

Requirements:

- No page-level horizontal scrolling.
- Timeline items stack cleanly on small screens.
- Event labels, status labels, failure codes, URL index/count text, and safety chips wrap.
- The timeline stays inside the expanded Discovery Runs row width.
- The existing static evidence results panel remains readable above the timeline.
- Review results / Hide results controls remain visible and usable.
- Pagination and filters remain usable.
- No sticky or fixed element covers timeline content.

## 15. Test plan

Future implementation should include focused tests.

Normalizer tests:

- accepts all five allowed static audit event types;
- rejects non-static event types;
- rejects metadata-fetch, dry-run, request-plan, duplicate, candidate, approval, publish, ranking, recommendation, and unknown event types;
- strips hostile metadata payloads containing raw HTML, snippets, body fields, headers, cookies, secrets, stack traces, raw transport messages, raw metadata, raw stats, candidate payloads, discovered-tool payloads, public-tool payloads, and LLM payloads;
- handles malformed events safely;
- rejects missing or invalid timestamps;
- accepts only bounded URL index/count values;
- accepts only allowlisted acquisition statuses;
- accepts only allowlisted evidence statuses;
- accepts only bounded failure codes and allowlisted failure reasons;
- maps booleans to safe safety flags;
- sorts accepted events chronologically.

Route tests, if the route is modified:

- returns static audit events only for `manual_static_html_derived_evidence` runs;
- does not return static audit events for non-static runs;
- does not include raw audit rows or raw metadata;
- preserves existing manual metadata-fetch audit output;
- returns safe audit warnings without database error details.

UI tests, if practical:

- renders safe timeline props;
- renders empty state;
- renders warning state;
- renders partial/rejected state;
- renders failed static run state;
- does not render raw JSON;
- does not render action controls;
- preserves existing static evidence results panel;
- preserves existing metadata-fetch review behavior.

Required verification commands:

- `git diff --check`
- `npm run lint`
- `npm run check`

## 16. Manual QA plan

Manual QA should use an existing completed static smoke run when available.

Minimum manual QA:

1. Open the authenticated admin Discovery page.
2. Locate a completed `manual_static_html_derived_evidence` run, such as the prior smoke run `5f9440bc-9a5d-4faa-9feb-3cabcc97761b` if available locally.
3. Expand Review results.
4. Confirm the static evidence results panel remains visible.
5. Confirm the audit timeline appears below the results panel.
6. Confirm audit events are labeled as operational/safety audit records.
7. Confirm no raw HTML, snippets, headers, cookies, secrets, stacks, raw JSON, raw metadata, raw stats, transport payloads, candidate payloads, or public-tool payloads are visible.
8. Confirm no approve, publish, candidate, duplicate, ranking, recommendation, retry, re-run, export, browser preview, screenshot, or LLM controls are visible.
9. Confirm manual metadata-fetch runs still display their existing review behavior.
10. Confirm desktop, tablet, and mobile layouts pass.

Do not run a new smoke test unless a separately approved phase requests it.

## 17. Rollback plan

Future rollback should be additive and non-destructive:

1. Remove the static audit timeline component import and render call from `manual-static-html-evidence-results-review.tsx`.
2. Remove static audit props from `ManualStaticHtmlEvidenceResultsReview`.
3. Remove static audit response fields from `DiscoveryRunsTable` typing and prop passing.
4. Remove static audit mapping from `GET /api/admin/discovery/runs`.
5. Remove `lib/discovery-static-html-evidence-audit-review.ts`.
6. Remove its focused test file.
7. Preserve existing static evidence stats review behavior.
8. Preserve existing manual metadata-fetch audit behavior.
9. Do not delete or mutate `discovery_runs` or `discovery_audit_events`.
10. Re-run `git diff --check`, `npm run lint`, and `npm run check`.

Rollback should not require database cleanup because the timeline is read-only.

## 18. Gemini review gate

Gemini review is required before Phase 8B implementation starts and again before any implementation commit.

Gemini should review:

- event allowlist;
- normalizer input/output types;
- hostile metadata stripping tests;
- API response shape;
- route compatibility with manual metadata-fetch audit behavior;
- UI placement and wording;
- absence of action controls;
- accessibility and responsive requirements;
- raw-data exposure risks;
- rollback path.

Gemini approval is required before expanding the display allowlist, making links clickable, changing audit retention behavior, or starting candidate extraction planning.

## 19. Step-by-step implementation sequence

Recommended Phase 8B sequence:

1. Confirm starting git status is clean and run `npm run check`.
2. Inspect current Phase 8A plan, route, static evidence review component, static stats normalizer, and claim route audit event writes.
3. Add failing tests for `normalizeManualStaticHtmlEvidenceAuditEvents`.
4. Create `lib/discovery-static-html-evidence-audit-review.ts` with the dedicated static audit event normalizer.
5. Run the focused normalizer tests and confirm they pass.
6. Extend `GET /api/admin/discovery/runs` to build a separate static audit event map using only normalized values.
7. Add or update route response tests if practical in the existing test setup.
8. Extend `DiscoveryRun` typing in `discovery-runs-table.tsx` for safe static audit fields.
9. Pass static audit events and warning props only into the static evidence review branch.
10. Create `components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx`.
11. Render the new timeline below the existing static evidence results panel.
12. Add UI rendering tests by safe props if practical.
13. Run forbidden-string/unsafe-rendering checks over changed files.
14. Run `git diff --check`.
15. Run `npm run lint`.
16. Run `npm run check`.
17. Perform manual desktop/tablet/mobile QA on the admin Discovery page.
18. Prepare CCR report and request Gemini review.
19. Do not commit or push until James approves.

## 20. CCR requirements

The future implementation CCR must include:

- summary;
- files changed;
- boundary confirmation;
- implementation notes;
- exact API response-shape summary;
- normalizer safety summary;
- UI placement summary;
- tests added or updated;
- `git diff --check` result;
- `npm run lint` result;
- `npm run check` result;
- manual QA result for desktop/tablet/mobile;
- confirmation no raw unsafe data was visible;
- confirmation no action controls were added;
- risks and follow-ups;
- exact final `git status --short --branch`;
- confirmation no commit or push was performed unless James explicitly approved.

## 21. Final implementation recommendation

Proceed to **Phase 8B — Static Evidence Audit Timeline API/UI Implementation** only after Gemini approves this implementation plan.

The future implementation should be a small additive API/UI slice:

- dedicated static audit normalizer;
- optional additive extension to `GET /api/admin/discovery/runs`;
- dedicated timeline component;
- static-only prop passing;
- no raw metadata;
- no raw stats;
- no action controls;
- no candidate/public-tool writes;
- no approval/publish/duplicate/ranking/recommendation/LLM behavior.

Candidate extraction planning should remain deferred until static audit visibility and cleanup/retention decisions are reviewed and approved.
