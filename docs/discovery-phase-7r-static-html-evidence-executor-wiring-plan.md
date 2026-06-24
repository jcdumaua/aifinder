# Phase 7R — Static HTML Evidence Executor Wiring Plan

## 1. Purpose

Phase 7R defines the future wiring plan for using the Phase 7Q bounded HTML acquisition adapter with the Phase 7M static HTML evidence helper inside the manual Discovery Engine executor.

It describes a future bounded, admin-only static-evidence mode. It does not implement wiring, authorize candidate creation, or change existing metadata-fetch behavior. Gemini approval is required before the future implementation phase begins.

## 2. Relationship to Phase 7M / 7N / 7O / 7P / 7Q

- Phase 7M added deriveStaticHtmlEvidence, an isolated helper that accepts a supplied HTML string and returns allowlisted, tentative evidence. It has no network, executor, database, audit, or UI behavior.
- Phase 7N inspected the manual claim route and found an executor foundation ready with conditions. Its key gap was that the metadata-only fetch adapter deliberately discards body data.
- Phase 7O designed the bounded in-memory acquisition contract: strict URL/DNS/IP/TLS/size/timeout safety, an HTML value only on success, and no body on failure.
- Phase 7P converted the contract into an implementation plan and required a standalone acquisition adapter rather than modifying the metadata-only adapter.
- Phase 7Q implemented lib/discovery-bounded-html-acquisition.ts and its injected-transport tests. It accepts text/html only, returns bounded HTML only on success, and never returns HTML on failure.

Phase 7R is planning only. Any future wiring must leave dry_run, metadata_fetch_smoke, and manual_metadata_fetch semantics unchanged.

## 3. Why This Phase Is Docs-Only

Wiring would modify the protected admin claim route, add an execution mode, and define new run-stat and audit-event shapes. Those decisions require explicit Gemini review before code is written.

This phase does not send requests, invoke the adapter, parse HTML, write data, or expose API/UI behavior.

## 4. Future Wiring Objective

The smallest future slice should add a distinct explicit mode, proposed as:

~~~text
manual_static_html_derived_evidence
~~~

It should reuse existing admin session, CSRF, rate-limit, manual-source, request-plan preflight, stale-run recovery, atomic claim, and terminal-update protections.

For every eligible request plan, it should:

1. Build a strict DiscoveryFetchHtmlPlan from the already preflighted plan.
2. Acquire bounded text/html with the Phase 7Q adapter.
3. Pass successful in-memory HTML directly to deriveStaticHtmlEvidence.
4. Drop the raw HTML reference immediately after helper completion or failure.
5. Persist and audit only bounded, allowlisted derived evidence and operational metadata.

The mode must not use manual_metadata_fetch as an extraction shortcut or modify the existing metadata-only adapter.

## 5. Proposed Executor Flow

1. Preserve the current POST /api/admin/discovery/runs/manual/claim admin-session, CSRF, request-body, and rate-limit gates.
2. Accept the new mode only through an exact constant; unknown modes remain a 400 response.
3. Preserve manual-source validation: active manual curated source, approved first-prototype setting, low risk, and per-URL policy review.
4. Build plans for every curated URL before any acquisition. A failed plan terminates as rejected_preflight with no network activity.
5. Enforce the approved static-evidence cap before acquisition. Initial recommendation: one to three URLs, subject to Gemini confirmation.
6. Preserve stale-running recovery and the conditional pending-to-running claim.
7. Write a safe start audit marker after claim and before acquisition.
8. Process plans sequentially. Do not add parallelism, retry, worker, scheduler, or queue behavior.
9. For each plan, call bounded acquisition. Only an ok result enters the helper handoff.
10. Normalize every URL into a small allowlisted result and write a small safe URL audit marker.
11. Conditionally update the run to its terminal state and write a safe terminal audit marker.
12. Return only the established run/execution response shape. Do not add a public endpoint or UI.

## 6. Acquisition-to-Evidence Handoff Contract

The future handoff is intentionally narrow:

~~~text
validated request plan
  -> strict bounded HTML acquisition plan
  -> acquisition result
  -> successful local HTML value only
  -> deriveStaticHtmlEvidence({ html, normalizedUrl, hostname, local bounds })
  -> allowlisted tentative evidence
  -> safe per-URL summary
~~~

Required rules:

- Build the acquisition plan only from the validated request-plan values: normalized URL, hostname, HTTPS, GET, timeout, redirect limit zero, byte cap, approved user agent, and strict HTML content type.
- The executor must not loosen URL, hostname, header, timeout, content-type, redirect, or byte-cap rules.
- The Phase 7Q adapter remains responsible for revalidation, DNS resolution, blocked-IP rejection, connection pinning, TLS verification, and streaming byte enforcement.
- A failed acquisition result must never be passed to the helper and has no html property.
- A successful result may be passed to the helper exactly once for that URL.
- confidenceLabel stays tentative. Category and AI-tool relevance values remain untrusted hints.
- empty and failed_closed helper outcomes are evidence outcomes, not candidates, approvals, trust signals, or product facts.

## 7. Raw HTML Lifetime Rules

Raw HTML may exist only as an ephemeral local value on the successful adapter-to-helper path.

- Keep the value inside the smallest per-URL block or function scope.
- Pass it directly to the evidence helper. Do not copy it into broader state, a closure, cache, retry state, or error object.
- Leave that scope after the helper returns or throws. JavaScript strings cannot be securely zeroized; the enforceable requirement is dropping references and never persisting the value.
- Do not retry a helper call with the same HTML in the first wiring slice.
- Do not return HTML from the claim endpoint or pass it to any helper beyond the approved evidence transformer.
- Do not place HTML in a database row, file, object storage, screenshot, browser state, queue payload, or captured live-source fixture.

## 8. Stats, Audit, and Log Restrictions

Raw HTML must never appear in:

- discovery_runs.stats
- discovery_audit_events messages or metadata
- error_log
- application logs, console output, or terminal output
- API responses
- database rows, files, caches, or object storage
- UI props, screenshots, browser-rendered output, thrown errors, or serialized exception objects

Stats may contain only the allowlisted summary in Section 12. Audit metadata must be smaller: IDs, URL index, sanitized normalized URL/hostname, acquisition/evidence statuses, safe error code/failure reason, bounded counters, and timestamps.

Do not write titles, descriptions, text snippets, links, hints, raw headers, cookies, request headers, response headers, secrets, tokens, stack traces, or full evidence objects to audit events. If a diagnostic log is necessary, log only a fixed code and run ID; never log the acquisition result, helper input/output, response object, or caught exception.

## 9. Failure Handling and Safe Executor Behavior

Failures should be recorded per URL where possible and must not broaden execution.

- Any request-plan failure rejects the run as rejected_preflight before acquisition. No URL is fetched.
- Acquisition failures produce a safe per-URL status, error code, and reason. The helper is not called.
- A helper exception is caught without serializing the exception and maps to a fixed evidence_failed_safely outcome.
- empty and failed_closed outcomes are safe bounded evidence outcomes, not inferred product facts.
- One URL failure does not abort remaining URLs in the approved cap. Continue sequentially with no retry.
- At least one derived result completes the run with partial-failure counts.
- No derived results after acquisition/helper calls fail the run with a fixed safe reason such as manual_static_html_derived_evidence_all_failed, aligned with the current manual metadata-fetch all-failed contract.
- Existing audit-persistence and conditional terminal-update failure behavior must remain fail-safe. It must not re-acquire or reprocess HTML.

## 10. Rate-Limit and Timeout Considerations

The future mode must preserve or explicitly re-approve the existing discoveryManualCrawlerExecutorRun admin rate-limit action. The current route observes 10 requests per 10-minute window; Gemini must confirm that it remains adequate for body acquisition.

The initial wiring must retain:

- Sequential execution.
- One to three URLs per run, subject to confirmation.
- The existing 10-second per-URL request-plan timeout cap.
- The existing 1 MB per-URL response-size cap.
- Zero redirects.
- Strict text/html acceptance from the Phase 7Q adapter.
- No retry, backoff, secondary fetch, or fallback transport.
- No worker, cron, scheduler, background job, or queue.

The implementation must account for sequential worst-case duration. It must not raise timeout, byte cap, content-type scope, or concurrency without separate Gemini approval.

## 11. Run Status Behavior

The proposed behavior remains distinct from existing modes:

| Condition | Proposed run status | Safe terminal reason |
|---|---|---|
| Any request plan fails before acquisition | failed | rejected_preflight |
| Plan count is outside the approved cap | failed | fixed cap or minimum-count reason |
| At least one URL produces derived evidence | completed | none; include partial counts |
| All acquisition/helper attempts fail or produce no derived evidence | failed | manual_static_html_derived_evidence_all_failed |
| Atomic claim or terminal update fails | no new terminal mutation | current safe 409/500 behavior |

no_fetch_performed is true only when no acquisition attempt occurred. no_extraction_performed becomes false only for this proposed mode after the helper is called. no_llm_analysis_performed, no_candidates_inserted, and no_public_tools_inserted remain true in every outcome.

## 12. Evidence Result Shape for Future Stats Only

The final shape requires Gemini approval. The recommended first shape is capped to the approved URL count and allowlists operational metadata plus Phase 7M evidence only:

~~~json
{
  "executor_mode": "manual_static_html_derived_evidence",
  "dry_run": false,
  "execution_enabled": true,
  "execution_status": "manual_static_html_derived_evidence_completed",
  "total_urls": 0,
  "processed_urls": 0,
  "evidence_produced_urls": 0,
  "failed_urls": 0,
  "skipped_urls": 0,
  "no_fetch_performed": false,
  "no_extraction_performed": false,
  "no_llm_analysis_performed": true,
  "no_candidates_inserted": true,
  "no_public_tools_inserted": true,
  "evidence_results": [
    {
      "normalized_url": "https://example.com/",
      "hostname": "example.com",
      "acquisition_status": "fetch_completed_html_acquired",
      "http_status": 200,
      "content_type": "text/html",
      "content_length_header": "123",
      "resolved_ip_family": 4,
      "bytes_read": 123,
      "response_truncated": false,
      "duration_ms": 0,
      "error_code": null,
      "failure_reason": null,
      "extraction_status": "derived",
      "extraction_version": "1",
      "derived_evidence": {
        "title": "Short derived title",
        "metaDescription": "Short derived description",
        "openGraphTitle": null,
        "openGraphDescription": null,
        "canonicalUrl": "https://example.com/",
        "homepageHeadlineSnippet": "Short derived headline",
        "visibleTextSnippet": "Short derived text snippet",
        "appStoreLinks": [],
        "pricingLinks": [],
        "contactLinks": [],
        "docsLinks": [],
        "productNameHint": null,
        "companyNameHint": null,
        "categoryHints": [],
        "aiToolRelevanceHints": [],
        "confidenceLabel": "tentative",
        "truncated": false,
        "safetyFlags": []
      }
    }
  ]
}
~~~

This example is not authorization to create a stats schema. It must reuse only the Phase 7M allowlist, preserve the helper snippet/link bounds, cap results, and omit raw HTML, full body text, headers, cookies, request data, candidate fields, approval fields, scores, rankings, and unknown keys.

The derived_evidence object is for proposed bounded run stats only. Audit events must use the smaller Section 8 summary and must not duplicate text or link fields.

## 13. What Must Remain Out of Scope

The future wiring slice must not include:

- Any change to dry_run, metadata_fetch_smoke, or manual_metadata_fetch semantics.
- Candidate creation or writes to discovered_tools or public.tools.
- Duplicate detection, ranking, recommendations, trust decisions, approval, or publish controls.
- LLM/AI analysis, enrichment, classification, or automated interpretation.
- Browser rendering, script execution, screenshots, subresource loading, robots/sitemap handling, recursive crawling, or link following.
- Raw HTML/body/asset/screenshot retention.
- Public API, public UI, admin UI, migration, schema, RLS, index, policy, package, or dependency changes unless separately approved.

Derived evidence does not mean a discovered AI tool, candidate, verified vendor, category match, trusted product, recommendation, or publishing readiness.

## 14. Required Tests for the Future Implementation Phase

The future implementation must add focused route/helper tests and controlled smoke coverage for:

- Existing request-plan, metadata-only adapter, metadata-fetch smoke, and manual metadata-fetch contracts remain unchanged.
- The new explicit mode is admin-only, CSRF-protected, rate-limited, and rejects unknown modes.
- Only approved manual curated sources can execute it.
- All plans pass before any acquisition; unsafe, private, credential-bearing, and non-HTTPS URLs reject before adapter use.
- The approved minimum/maximum count is enforced and processing is sequential.
- Redirect, unsupported content type, timeout, oversized Content-Length, streamed byte cap, DNS/IP, TLS, transport, and empty-body failures remain safe.
- Successful acquisition calls deriveStaticHtmlEvidence with only the local in-memory string, normalized URL, hostname, and approved local bounds.
- Helper exceptions, empty, and failed_closed outcomes never serialize raw values and do not abort later URLs.
- No raw HTML/body marker appears in stats, audit metadata, logs, terminal output, endpoint responses, or errors.
- Stats and audits contain only allowlisted, bounded keys.
- At least one derived result completes the run with partial failures; no derived result fails safely; no retries occur.
- Claim and terminal updates remain conditional and atomic.
- No candidate, discovered_tools, or public.tools write occurs; source scans and database-count assertions prove this.
- No LLM SDK, renderer, screenshot, scheduler, worker, cron, crawler, UI, or public API behavior is added.
- Disabling the new mode preserves the three existing modes.

Unit coverage must use injected/local transports. A smoke test using a real endpoint requires separate approval and must not print or retain a raw body.

## 15. Gemini Review Gates

Gemini must review and approve before:

- Adding the new mode constant or claim-route branch.
- Importing either Phase 7M or Phase 7Q helper into the executor.
- Finalizing the URL cap, rate-limit action, timeout, byte cap, content types, or decompression behavior.
- Finalizing stats, audit event names/metadata, log policy, error taxonomy, and run-status behavior.
- Adding a smoke test that contacts a non-local endpoint.
- Adding any evidence read model or UI.
- Any schema, storage, candidate, duplicate, LLM, approval, publish, discovered_tools, or public.tools change.

Gemini must review the final implementation diff before commit. Human approval remains required before commit or push.

## 16. Rollback Plan

The future first wiring slice should be additive and reversible:

1. Disable or remove only the new static-evidence mode branch.
2. Leave the Phase 7Q adapter isolated and the Phase 7M helper local.
3. Preserve all existing mode contracts unchanged.
4. With no migration, storage, candidate, or public writes, require no schema, raw-asset, candidate, or public-data cleanup.
5. Keep only safe bounded terminal stats/audit summaries; never reconstruct or recover HTML.
6. Run regression tests for existing modes after rollback.

## 17. Safety Boundaries

Phase 7R changes only this document.

- No executor wiring or new mode is implemented.
- No API route, UI, helper, adapter, Supabase, database, schema, RLS, index, policy, package, or dependency change is made.
- No network request, parser execution, raw HTML retention, browser rendering, screenshot, scheduler, worker, cron, or LLM/AI analysis is added.
- No candidate, duplicate, ranking, recommendation, approval, publish, discovered_tools, or public.tools behavior changes.
- No commit or push is performed.

## 18. Verification Commands

For this Phase 7R docs-only change, run:

~~~bash
cd /Users/jamescarlodumaua/aifinder
git diff --check
npm run lint
npm run check
git status --short --branch
~~~

If npm run check encounters the known sandbox-only Turbopack port-binding restriction, rerun it in an approved elevated environment and report both results.

## 19. CCR Report Requirements

The Phase 7R completion report must include:

- Summary
- Files changed
- Boundary confirmation
- Design notes
- Verification results
- Risks and follow-ups
- Exact final git status --short --branch output
- Confirmation that no commit or push was performed
