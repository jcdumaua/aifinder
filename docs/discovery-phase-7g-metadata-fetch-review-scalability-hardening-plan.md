# Phase 7G — Metadata Fetch Results Review Scalability Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement a future approved hardening slice task-by-task. This Phase 7G document is planning-only and does not authorize implementation.

**Goal:** Define the safe, measured future path for scaling the Phase 7F manual metadata-fetch audit timeline without changing current behavior.

**Architecture:** Phase 7F keeps the discovery-runs list and its review panel read-only. It retrieves safe normalized audit events for the current page of run IDs, bounded by a page-level event cap. Future work should first reduce initial-list audit work with on-demand per-run loading; only measured database performance needs should justify a reviewed schema or index change.

**Tech Stack:** Next.js admin route, React admin review UI, Supabase/Postgres, existing `discovery_runs` and `discovery_audit_events` tables.

---

## 1. Purpose

Phase 7G is a planning-only hardening phase for the Phase 7F metadata-fetch results review surface. It records the two scalability concerns identified in Gemini review, evaluates future options, and defines review gates before any code, API, UI, or database change is proposed.

Phase 7G does not change the Phase 7F behavior. The current implementation remains the appropriate low-volume, bounded, read-only solution while manual metadata-fetch usage is small.

## 2. Current Phase 7F Behavior

Phase 7F currently provides a safe admin review path with these properties:

- `GET /api/admin/discovery/runs` remains admin-only through the existing `verifyAdminSession` check.
- The route retrieves discovery runs for the current paginated page, then uses only those current-page run IDs for the audit lookup.
- Audit results are normalized into safe `audit_events` records before the UI receives them. The review surface renders only allowlisted, metadata-safe fields.
- The review panel is read-only. It does not create, update, delete, retry, re-run, approve, publish, export, or otherwise mutate anything.
- If the audit lookup fails, the run list remains available and receives a safe audit-timeline-unavailable warning rather than an API failure.
- The existing `MAX_AUDIT_EVENTS_PER_PAGE` limit is 100. It bounds audit-query work and payload size across all run IDs on the current page.
- The UI does not render raw audit metadata, raw JSON, raw request/response data, or any unknown metadata key.

These boundaries are intentionally retained unless a future reviewed phase changes them.

## 3. Risk A — Global Audit-Limit Starvation

### Risk

The current 100-event page-level cap is shared by every run displayed on that page. A single noisy run can consume the full audit-event allowance. Other runs on the same page can then have empty or incomplete timelines even though they have events in `discovery_audit_events`.

This is acceptable in the short term because it strictly bounds payload size and route work. It becomes more important when manual metadata-fetch runs, per-run URL counts, or audit-event volume increase.

### Future Options

- Apply a per-run audit-event cap after query normalization and grouping. This improves fairness in returned data but does not remove the cost of broad prefetching.
- Query audit events only for the expanded run. This avoids loading timeline data that the admin never opens.
- Add a dedicated, admin-only, read-only on-demand audit timeline endpoint for one run.
- Lazy-load the timeline in the review panel when `Review results` is opened.
- Add a bounded “show latest events” display or pagination for an individual timeline.

### Recommendation

When audit volume increases, prefer on-demand audit loading for expanded run details. Keep the initial run list lightweight and fetch a bounded per-run timeline only after an admin opens that run’s results. Do not continue loading all timeline data for every run shown on the list page.

## 4. Risk B — JSONB `run_id` Lookup Performance

### Risk

The current audit lookup filters `discovery_audit_events` through `metadata->>run_id`. This is functional and appropriate at low volume. At higher audit volume, filtering through a JSONB expression can become slow unless a supporting expression index exists.

Any future index decision must be driven by measured query volume and performance, not by anticipated scale alone.

### Future Options

- Add a reviewed Supabase migration for an expression index on `(metadata->>run_id)`.
- Add a generated column or a dedicated nullable `run_id` column if a future schema evolution is separately approved.
- Define a stronger run-level audit relationship if Discovery Engine audit volume becomes significant.

### Recommendation

Do not add an index in Phase 7G. A future migration may be proposed only after measuring query behavior and demonstrating that the lookup is a bottleneck. That migration must receive Gemini review before creation or application.

## 5. Risk C — Timeline Data-Model Clarity

`discovery_audit_events` currently supports discovered-tool-oriented audit history, while manual metadata-fetch run events are associated safely through metadata. This is acceptable for the present phased Discovery Engine work because it avoids premature schema expansion while preserving an auditable, read-only timeline.

Future high-volume Discovery Engine workflows may benefit from one of these clearer models:

- Explicit run-level audit columns.
- A separate run-event table.
- Formalized and documented metadata conventions with clear ownership and query patterns.

Continue using the existing audit table for now. Defer schema decisions until extraction and candidate phases have an approved architecture, expected volume, and audit-retention requirements.

## 6. Future Implementation Options

| Option | Benefits | Trade-offs | Recommendation |
| --- | --- | --- | --- |
| A — Keep page-level prefetch with better client grouping | Lowest implementation cost; preserves one endpoint | Still vulnerable to a shared global limit and carries timeline data for collapsed runs | Short-term fallback only |
| B — Add on-demand audit loading endpoint | Fetches only for the expanded run; keeps initial payload small; supports a clear per-run cap | Adds a protected read-only endpoint and modest UI/API complexity | Preferred first scalability change |
| C — Add DB index only | Improves JSONB lookup performance | Does not solve global-limit starvation; requires a reviewed migration | Consider only after measured need |
| D — Add dedicated run-level audit schema | Strong long-term model and clearer ownership | Highest schema, migration, and process cost | Not appropriate before extraction/candidate phases |

### Recommended Future Path

1. Keep the Phase 7F implementation unchanged while actual run and audit volume remains low.
2. If run/audit volume grows, implement bounded on-demand audit loading for an expanded run before changing the database structure.
3. Add a JSONB expression index only after measurement demonstrates need and a migration has been reviewed.
4. Revisit a dedicated run-level audit schema during a later Discovery Engine architecture phase, alongside extraction and candidate workflow design.

## 7. Safety Boundaries

Phase 7G makes none of the following changes:

- No code.
- No API changes.
- No UI changes.
- No migrations.
- No indexes.
- No schema changes.
- No extraction.
- No HTML parsing.
- No LLM or AI analysis.
- No candidate creation.
- No duplicate detection.
- No ranking.
- No approval or publish controls.
- No `public.tools` insert.
- No `discovered_tools` insert.

The current review remains admin-only, read-only, metadata-only, and limited to allowlisted audit information.

## 8. Future Gemini Review Gates

Gemini review and approval are required before any future implementation begins that introduces:

- A new audit endpoint.
- A change to audit query shape, query limits, grouping, or loading behavior.
- An index or migration.
- A schema or audit-data-model change.
- An on-demand timeline UI change.

Each future proposal must preserve admin-only access, read-only behavior, safe allowlisted response fields, bounded payloads, and safe fallback behavior when audit data is unavailable.

## 9. Verification

For this Phase 7G documentation-only change, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run check
git diff --check
git status --short
```

Expected result: the application check passes, the diff has no whitespace errors, and only this plan file is uncommitted. No migration, index, API, UI, or code verification is authorized or required in this phase.
