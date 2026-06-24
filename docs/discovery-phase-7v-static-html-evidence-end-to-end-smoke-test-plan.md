# Phase 7V — Static HTML Evidence End-to-End Smoke Test Plan

## 1. Purpose

Define a safe, manual local/admin smoke-test procedure for the completed static HTML evidence workflow. A future human may create one pending manual run, claim it in `manual_static_html_derived_evidence` mode, inspect bounded evidence, and verify the absence of candidate/public-tool effects.

This is a plan only. Phase 7V does not execute a smoke test, contact a URL, create a run, or modify runtime behavior.

## 2. Relationship to Phase 7S / 7T / 7U

- Phase 7S implemented the bounded static HTML evidence executor mode, safe run stats, and audit events.
- Phase 7T defined the read-only admin-review UI contract and safety language.
- Phase 7U implemented the allowlisted review normalizer and read-only static-evidence panel.
- Phase 7V documents one minimal end-to-end check across those layers. It adds no automation and does not replace focused tests.

## 3. Why this phase is docs-only

A future smoke execution can create a test `discovery_runs` record and related `discovery_audit_events` records. This phase must not make those writes. It must not add a script, UI, route, executor change, helper, adapter, normalizer, migration, policy, generated type, dependency, browser automation, or fixture.

No external network request is made while writing or verifying this document. A future claim is separately reviewed because it causes the bounded executor to acquire the reviewed URL.

## 4. Smoke test objective

The future happy path proves that one controlled authenticated admin flow can:

1. Create one pending manual run from an existing approved low-risk source.
2. Claim that exact run with `execution_mode: "manual_static_html_derived_evidence"`.
3. Persist only bounded, tentative derived evidence and operational metadata.
4. Write only the expected run and audit records.
5. Render the existing read-only review panel without exposing unsafe source data.
6. Leave `discovered_tools` and `public.tools` unchanged.

Use exactly one reviewed URL, preferably `https://example.com/`. It is a low-risk HTML endpoint, not an AI-tool candidate, recommendation, trust signal, or publishing decision.

## 5. Preconditions

Before a human executes this plan:

- Obtain Gemini approval for the precise smoke execution, source, and URL.
- Run the application locally and make all admin API/UI requests only to `http://localhost:<approved-port>`.
- Sign in through the normal local admin flow. Do not manufacture, log, paste into shell history, or share session cookies.
- Find an existing source using authenticated `GET /api/admin/discovery/sources?source_type=manual&is_active=true`. Do not create or edit a source.
- Confirm that source is active, `manual_curated_urls`, `approved_for_first_manual_prototype`, low risk, and requires per-URL policy review before fetch.
- Record its UUID and verify it has no pending or running run.
- Obtain private, read-only before-counts for `discovered_tools` and `public.tools`; after-counts must be identical.
- Prepare a current human review for `https://example.com/` where robots.txt, terms, and permission are all `allowed`.
- Agree on the data-retention/cleanup owner. Only the exact smoke run and its audit events may be cleaned up.

Stop if source configuration, policy review, admin session, CSRF setup, or count baselines are unavailable or unexpected.

## 6. Safe local/admin route path

Use existing authenticated local admin routes only:

1. `GET /api/admin/discovery/sources?source_type=manual&is_active=true` to select an existing source.
2. `GET /api/admin/csrf` to establish or reuse the CSRF token.
3. `POST /api/admin/discovery/runs/manual` to create one pending run.
4. `POST /api/admin/discovery/runs/manual/claim` to claim that exact run.
5. Open the local Admin Discovery Runs UI and use its read-only **Review results** control.

The only non-local activity in a later execution is the executor's bounded HTTPS acquisition of the reviewed URL. The path must not add browser rendering, screenshots, subresource loading, link following, retries, queues, schedulers, workers, cron, or recursive crawl behavior.

## 7. CSRF and admin-session requirements

Both POST requests require the normal authenticated admin session and a valid CSRF pair:

- Local login supplies `aifinder_admin_session`.
- `GET /api/admin/csrf` returns `csrfToken` and sets or reuses `aifinder_admin_csrf_token`.
- Send the exact returned value in the `x-csrf-token` request header.
- The header and `aifinder_admin_csrf_token` cookie must match and use the 64-character token format.
- Send `Content-Type: application/json` for both POST requests.

Never include session/CSRF values in documentation, screenshots, logs, fixtures, issue comments, commits, or source-controlled files. Missing, expired, malformed, or mismatched CSRF must return safe `403` and create no smoke run.

## 8. Manual run creation request shape

Send this body to `POST /api/admin/discovery/runs/manual`, substituting only an existing approved source ID and a current human policy review:

```json
{
  "source_id": "<existing-approved-manual-source-uuid>",
  "urls": [
    {
      "url": "https://example.com/",
      "policy_review": {
        "robots_txt_review": "allowed",
        "terms_review": "allowed",
        "permission_status": "allowed",
        "permission_notes": "Human-reviewed low-risk Phase 7V smoke URL.",
        "reviewed_at": "<current-ISO-8601-timestamp>",
        "reviewed_by": "<approved-admin-reviewer-label>"
      }
    }
  ]
}
```

Expected result: HTTP `201`, a new `data.run.id`, and `data.run.status: "pending"`. Retain only the returned run UUID for later assertions. Do not create another source, URL, or happy-path run.

## 9. Static evidence claim request shape

Send this body to `POST /api/admin/discovery/runs/manual/claim` with the same local session and CSRF header:

```json
{
  "run_id": "<run-id-returned-by-manual-run-creation>",
  "execution_mode": "manual_static_html_derived_evidence"
}
```

The expected happy-path response is HTTP `200`, `data.execution.enabled: true`, and `data.execution.mode: "manual_static_html_derived_evidence"`. It should return terminal completed state with `all_failed: false`. An all-failed or failed state is a safety failure-mode result, never a candidate or discovery outcome.

Do not send raw HTML, browser output, candidate/approval data, LLM prompts, extra execution parameters, or another mode.

## 10. Expected database writes

For the one-URL happy path, assert the only written tables are:

- `discovery_runs`: one insert with `pending`, one conditional transition to `running`, then one conditional terminal transition to `completed`.
- `discovery_audit_events`: the manual-run creation event plus bounded preflight, claim, static-evidence start, one per-URL, and terminal events linked to the returned run ID.

The selected source is read only. The smoke must not write any other table, storage object, file, cache, queue payload, screenshot, or artifact.

## 11. Explicit forbidden writes

The smoke must never insert, update, or delete:

- `discovered_tools` or any candidate record.
- `public.tools` or any public tool record.
- `discovery_sources`.
- Supabase schema, migrations, constraints, RLS, indexes, policies, functions, generated types, or storage.
- Approval, publish, duplicate, ranking, recommendation, enrichment, or LLM-related records.

It must never persist raw HTML/body data, raw JSON dumps, request/response headers, cookies, credentials, tokens, secrets, stack traces, browser output, screenshots, or source-body snippets outside the bounded allowlisted derived evidence fields.

## 12. Expected `discovery_runs.stats` assertions

Inspect the created run only through an approved read-only path. For the single-URL successful case, assert:

- `executor_mode` is exactly `manual_static_html_derived_evidence`.
- `dry_run` is `false`; `execution_enabled` is `true`; `execution_status` is `manual_static_html_derived_evidence_completed`.
- `total_urls`, `attempted_urls`, `acquired_urls`, `evidence_attempted_urls`, and `evidence_produced_urls` are each `1`.
- `failed_urls` and `skipped_urls` are `0`; `all_failed` is `false`.
- `no_fetch_performed` and `no_extraction_performed` are `false`.
- `no_llm_analysis_performed`, `no_candidates_inserted`, and `no_public_tools_inserted` are `true`.
- `raw_html_persisted` and `candidates_created` are `false`.
- `extracted_candidates`, `inserted_discovered_tools`, and `inserted_public_tools` are each `0`.
- `evidence_results` has one bounded result with a normalized HTTPS URL, safe hostname, `evidence_derived`, `fetch_completed_html_acquired`, `derived`, extraction version `1`, and `confidenceLabel: "tentative"`.

Recursively confirm stats are raw-HTML-free. They may contain only documented bounded operational fields and allowlisted derived evidence. Reject any `html`, `raw_html`, `body`, `response_body`, headers, cookies, credentials, token, secret, stack, exception, raw request/response, or arbitrary JSON-dump field. Do not print the complete stats object while checking it.

## 13. Expected `discovery_audit_events` assertions

Filter by the exact smoke run ID and source ID. A successful one-URL run must include these `metadata.event_type` values:

- `manual_crawler_run_trigger_created`
- `request_plan_preflight_started`
- `request_plan_preflight_passed`
- `manual_crawler_executor_claim_attempted`
- `manual_crawler_executor_claim_succeeded`
- `manual_static_html_derived_evidence_started`
- `manual_static_html_derived_evidence_url_completed`
- `manual_static_html_derived_evidence_completed`

Confirm the run/source link and fixed safety metadata. Static-evidence audit records must retain `raw_html_persisted: false`, `candidates_created: false`, `no_candidates_inserted: true`, `no_public_tools_inserted: true`, and `no_llm_analysis_performed: true`.

Audit metadata may contain only the designed operational allowlist: IDs, bounded counters, URL index, normalized URL/hostname, fixed status/failure values, and timestamps. It must not contain derived-evidence text/links, raw HTML, headers, cookies, tokens, secrets, raw JSON, stack traces, or upstream error text.

## 14. Expected admin UI assertions

In the local Admin Discovery Runs screen, locate the run and choose **Review results**. Confirm the rendered panel visibly states:

- **Static-derived evidence**
- **Tentative**
- **Raw HTML not stored**
- **No candidates created**

Also confirm the panel shows bounded run/per-URL status and read-only human-review language, including no public tool creation. It must not imply the URL is discovered, verified, approved, trusted, ranked, recommended, or publishable.

## 15. Raw HTML / unsafe data negative checks

Without copying source data to logs, inspect the claim response, allowed run/audit summaries, and rendered UI. None may expose:

- Raw HTML, `<html`/doctype source, raw response body, raw JSON dump, unbounded body snippets, or browser-rendered page content.
- Request/response headers, cookies, `Set-Cookie`, authorization/CSRF values, environment values, secrets, tokens, or credentials.
- Stack traces, caught exception messages, internal transport objects, DNS dumps, or arbitrary upstream error text.

The UI must render normalized fields and never a JSON `<pre>` or object-string fallback. Bounded allowlisted title, description, snippet, and link fields remain tentative evidence only, not raw-source display.

## 16. Candidate/public-tool negative checks

Compare private read-only before/after counts for `discovered_tools` and `public.tools`; both must be exactly unchanged. Ensure run stats and audit safety flags agree.

Confirm the review panel and row have no create-candidate, approval/rejection/publish, duplicate, merge, ranking, recommendation, score, trust, LLM, enrichment, browser-preview, screenshot, retry, re-run, queue, scheduler, worker, or cron control.

## 17. Desktop/tablet/mobile responsive QA checklist

After data assertions, review the existing panel at:

- Desktop: 1440x1000.
- iPad/tablet portrait: 768x1024.
- iPad/tablet landscape: 1024x768.
- iPad mini portrait: 744x1133.
- iPad mini landscape: 1133x744.
- Mobile: 390x844.
- Small mobile: 360x740.
- Foldable cover: 344x882.
- Foldable open: 768x884.

At each size, verify no page-level horizontal scroll, clipped control, hidden safety/status text, overlapping card/panel, obscured filter/pagination, or fixed/sticky overlap. Long URLs, statuses, error codes, and hints must wrap within cards. **Review results**/**Hide results** must be keyboard reachable and visually separated.

## 18. Failure-mode smoke cases

These are separate human-approved checks. Do not batch them with the happy path, generate them by script, or use public endpoints merely to force errors.

- Missing/invalid admin session: expect `401`, no run/audit/acquisition.
- Missing, expired, malformed, or mismatched `x-csrf-token`: expect `403`, no run/audit/acquisition.
- Invalid run-create payload/policy review: expect `400`, no run/audit/acquisition.
- Unknown claim mode or malformed `run_id`: expect `400`, no claim/acquisition/evidence.
- Already-claimed/non-pending run: expect `409`, no second acquisition or candidate/public-tool effect.
- More than three reviewed URLs: expect safe `422` with `manual_static_html_derived_evidence_url_cap_exceeded`, `no_fetch_performed: true`, and no per-URL acquisition.
- Request-plan rejection: expect `422` with `rejected_preflight`, safe audit data, and no external acquisition.
- Separately approved acquisition/evidence failure: expect fixed safe status/reason only, no raw diagnostics, no retry, and no candidate/public-tool effect.
- Audit persistence failure or terminal conflict: stop; do not re-claim or re-acquire.

Every failure UI must remain neutral and expose neither raw data nor approval, publish, candidate, duplicate, ranking/recommendation, or LLM controls.

## 19. Cleanup guidance

Phase 7V documentation creates nothing.

For later manual execution, retain the run/source IDs. After Gemini reviews the results, use the project-approved retention procedure to remove only the exact smoke run and its linked audit events if cleanup is required. Do not change the pre-existing source, unrelated runs/events, `discovered_tools`, `public.tools`, or schema data.

Do not add a cleanup script. If audit retention requires keeping the records, mark them as smoke evidence in the human execution record. Raw HTML cannot be recovered or cleaned up because it must never have been stored.

## 20. Future automation option

Automation remains deferred. A separate proposal could define a tightly controlled smoke harness that authenticates through approved mechanisms, uses a reviewed source, validates stats/audits/UI/counts, and never exposes secrets or bodies.

It requires separate Gemini and James approval before adding a script, fixture, browser automation, external request, CI job, scheduler, worker, or dependency. This document does not authorize automation.

## 21. Gemini review gates

Gemini must approve:

- The selected source, policy review, URL, and timing before any actual claim/acquisition.
- The stats/audit assertions, especially raw-data exclusions and terminal-state handling.
- The count-comparison method for candidates/public tools.
- The responsive UI result and safety wording.
- Any failure, unexpected write, unsafe data, control, or audit deviation.
- Any future script, source creation, cleanup method, route/UI/executor/schema change, or external endpoint change.

Gemini reviews final smoke evidence before James approves any follow-on work or commit. This plan authorizes neither execution nor commit/push.

## 22. Rollback plan

For this docs-only phase, rollback is only removal of this Markdown document in a separately approved change; it has no runtime effect.

For a future smoke, there is no code/config/schema/source change to roll back. Stop on an unsafe or unexpected result, do not retry/acquire again, preserve safe IDs for review, and clean only the exact smoke run/audit records if the approved retention process allows it. Candidate/public-tool rollback must never be needed because those writes are forbidden.

## 23. Safety boundaries

Phase 7V changes only this document.

- No smoke script is implemented or executed.
- No UI, API route, executor, helper, adapter, normalizer, Supabase code, migration, schema, RLS, index, policy, generated type, package, or dependency changes.
- No external request, candidate creation, database mutation, browser rendering automation, screenshot, scheduler, worker, cron, duplicate detection, ranking, recommendation, approval/publish behavior, or LLM/AI analysis.
- No `discovered_tools` or `public.tools` insert, update, or delete.
- No commit or push.

## 24. Verification commands

For this docs-only Phase 7V change, run:

```bash
cd /Users/jamescarlodumaua/aifinder
git diff --check
npm run lint
npm run check
git status --short --branch
```

Do not execute smoke HTTP requests, run an existing smoke script, contact `example.com`, create a candidate, or use browser automation during Phase 7V documentation verification. If sandboxed Turbopack alone cannot bind its local port, rerun the same check in an approved elevated environment and report both outcomes.

## 25. CCR report requirements

The Phase 7V completion report must include:

- Summary.
- Files changed.
- Boundary confirmation.
- Design notes.
- Verification results.
- Risks / follow-ups.
- Exact final `git status --short --branch` output.
- Confirmation that no commit or push was performed.
