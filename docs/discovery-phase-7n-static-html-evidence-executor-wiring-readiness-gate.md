# Phase 7N — Static HTML Evidence Executor Wiring Readiness Gate

## 1. Purpose

Phase 7N is an inspection-only readiness gate before wiring the static HTML evidence helper into the manual executor. It does not implement executor wiring, add an execution mode, or change runtime behavior. It records readiness, risks, and required conditions for a future implementation phase.

## 2. Current Implemented Foundation

The current foundation includes:

- A manual metadata-fetch executor on POST /api/admin/discovery/runs/manual/claim.
- Admin session, CSRF, rate-limit, manual-source policy, request-plan, claim, stats, and audit handling.
- A metadata-only fetch adapter with DNS/IP/TLS/redirect/content-type/size/timeout controls.
- The isolated lib/discovery-static-html-evidence.ts helper and testing/discovery-static-html-evidence.test.mjs test suite.
- The read-only manual metadata-fetch review surface.
- The interpretation, evidence, acquisition, prototype, and implementation-plan documents from Phases 7H–7L.

Relevant commits:

- Phase 7L: e69d4f1 Document static HTML evidence implementation plan.
- Phase 7M: 36c58ab Add static HTML evidence helper.

The helper remains local-only: it has no executor, API, UI, database, audit, or network behavior.

## 3. Existing Executor Surface Inspection

The current manual claim route has three observed execution modes:

- dry_run when execution_mode is absent.
- metadata_fetch_smoke.
- manual_metadata_fetch.

Observed access and source gates:

- verifyAdminSession requires an admin actor.
- verifyAdminCsrfRequest is required before the claim is processed.
- checkAdminRateLimit uses discoveryManualCrawlerExecutorRun, currently 10 requests per 10-minute window.
- The run must be pending and have a source ID.
- The source must be active, manual, configured as manual_curated_urls, approved for the first manual prototype, low risk, and configured for per-URL policy review before fetch.
- The existing dry-run stats are validated before execution.

Observed claim and status behavior:

- All manual curated URLs are converted to request plans before a claim.
- A failed request plan sets the run to rejected_preflight before network activity.
- Preflight start, pass, and rejection audit events are written.
- Stale running runs are recovered; a source with an active running run rejects a new claim.
- The pending-to-running update is conditional on the run still being pending.
- Terminal updates are conditional on the run still being running.

Observed metadata-fetch behavior:

- metadata_fetch_smoke requires exactly one request plan.
- manual_metadata_fetch requires one to three request plans and processes them sequentially.
- At least one successful metadata fetch completes the run; no successful fetches fail it safely.
- Stats are stored in discovery_runs.stats with fixed zero candidate and public-tool insert counts.
- Audit events are written through discovery_audit_events with safe metadata helpers.

Observed fetch-adapter boundary:

- executeDiscoveryFetchMetadataOnly validates the plan again, validates DNS answers, pins the connection to a resolved safe IP, uses HTTPS with certificate verification, and does not follow redirects.
- It enforces timeout and response-size controls, rejects oversized Content-Length, and stops oversized streamed responses.
- It accepts text/html, text/plain, and application/xhtml+xml for the existing metadata-only mode.
- It receives chunks only to count bytes and deliberately does not return body or HTML data.

The last point is a gating condition. The current adapter cannot be passed directly to deriveStaticHtmlEvidence, because it intentionally discards the response body. A future phase must define a separately reviewed bounded, in-memory-only HTML acquisition contract. Whether that is a safe extension or a distinct adapter requires future verification and Gemini review.

## 4. Static HTML Helper Readiness

The helper is suitable as a local downstream evidence transformer, subject to the acquisition condition above.

Confirmed properties:

- Accepts an HTML string, normalized URL, hostname, and local bounds only.
- Makes no network request and uses no Supabase/database client.
- Produces no raw HTML or full-body output.
- Emits a fixed allowlisted result shape.
- Uses only a tentative confidence label; category and AI-tool relevance values are hints only.
- Bounds snippets and detected links.
- Removes scripts, styles, comments, and selected hidden content before visible-text extraction.
- Strips query strings/fragments from output URLs and redacts obvious credential-like text values.
- Handles empty/malformed HTML safely and has a fail-closed path.

The helper test suite covers title/metadata/canonical and Open Graph extraction, visible text, ignored markup, detected links, hints, truncation, URL sanitization, credential-like text redaction, malformed/empty input, no raw output, and no network call. It passed during this gate.

## 5. Wiring Preconditions

Before wiring begins, require:

- Gemini approval for implementation.
- An explicit new executor-mode name.
- Existing metadata-fetch modes remain unchanged.
- Existing admin-session and CSRF protections remain intact.
- Confirmation that the existing executor rate-limit action is sufficient, or approval of a new action.
- Request-plan safety before acquisition.
- A reviewed bounded in-memory HTML acquisition contract preserving DNS/IP/TLS/redirect safety.
- An explicit static-mode content-type policy; the current adapter accepts more than text/html.
- Confirmed timeout, byte-cap, Content-Length, decompression, redirect, and per-run URL-cap behavior.
- Immediate raw-HTML disposal after helper use.
- Finalized bounded stats and audit-metadata shapes.
- No candidate, discovered_tools, or public.tools writes.
- A confirmed rollback plan.

## 6. Proposed Future Wiring Slice

For planning only, the future mode may be manual_static_html_derived_evidence.

The smallest acceptable implementation would:

- Add an explicit mode branch in the manual claim executor.
- Reuse manual-source policy gates and request-plan safety.
- Acquire bounded static HTML only through the newly reviewed in-memory boundary.
- Pass the string to deriveStaticHtmlEvidence.
- Discard raw HTML immediately.
- Write bounded derived evidence only to discovery_runs.stats.
- Write safe audit markers only.
- Keep candidateCreated at 0.
- Make no UI change unless separately required.
- Make no migration, candidate, discovered-tool, or public-tool write.

## 7. Non-Negotiable Boundaries for Future Wiring

Future wiring must not:

- Modify existing metadata-fetch semantics.
- Create candidates or write discovered_tools or public.tools.
- Store raw HTML, full body text, cookies, headers, or secrets.
- Add screenshots, browser rendering, LLM/AI analysis, ranking, recommendation, approval, publishing, or public evidence display.

## 8. Required Future Tests

A future implementation must add or update tests for:

- Existing metadata-fetch behavior still passes.
- Unauthorized/invalid access and CSRF rejection.
- Rate-limit application.
- Unsafe URLs rejected before fetch.
- Unsupported content type and byte-cap/truncation failures.
- Helper invocation with an in-memory string only.
- No raw HTML in stats or audit metadata.
- candidateCreated remains 0.
- No discovered_tools or public.tools insert.
- Safe terminal statuses and rollback/no-mode behavior.

Relevant existing coverage includes request-plan, metadata-fetch adapter, manual metadata-result, review-normalizer, and static helper tests, plus metadata-fetch smoke scripts. No route-specific static evidence wiring test exists because the mode is not implemented.

## 9. Review Surface Readiness

The existing review path is metadata-fetch-specific:

- normalizeManualMetadataFetchStats accepts only executor_mode equal to manual_metadata_fetch.
- Its allowlist is limited to metadata-fetch fields.
- ManualMetadataFetchResultsReview is built around that stats shape and audit family.

It is not ready to display a static evidence stats shape without a separate future read-model and UI decision. UI changes should be deferred. A read-only backend stats shape can be implemented and tested first.

If future UI is approved, safe wording includes Static HTML evidence, Derived evidence, No candidate created, Raw HTML not stored, and Human review required. It must avoid Tool discovered, Verified, Approved, Trusted, and Ready to publish.

## 10. Rollback Readiness

A future stats-only slice can remain reversible by disabling or removing the new mode branch while leaving metadata-fetch modes untouched. With no schema change, raw storage, candidate write, or public write, it requires no schema, asset, candidate, or public-data cleanup. Regression tests must prove existing modes remain stable.

## 11. Readiness Decision

**Decision: Ready with conditions.**

The executor already provides admin, CSRF, rate-limit, policy, request-plan, status-transition, stats, audit, and rollback foundations. The helper is bounded, dependency-free, and tested.

Conditions before a future Gemini-reviewed implementation phase:

1. Approve a body-acquisition contract that supplies bounded static HTML in memory while preserving existing SSRF, DNS, IP, TLS, redirect, size, timeout, and failure protections.
2. Finalize static-mode content types, per-run cap, stats schema, audit event names, and audit allowlist.
3. Confirm reuse or addition of an HTML-acquisition rate-limit action.
4. Add focused executor and smoke tests proving no raw HTML, candidate, discovered-tool, or public-tool write.
5. Defer review-surface work until a dedicated safe read model is approved.

## 12. Safety Boundaries

Phase 7N makes no implementation change:

- No executor wiring or new mode.
- No API, network, parser, or helper change.
- No raw-content storage, Supabase Storage, AI/LLM analysis, candidate creation, duplicate detection, ranking, or enrichment.
- No audit behavior change or database write beyond existing behavior.
- No discovered_tools or public.tools insert.
- No approval/publish control, migration, index, schema, UI, or test change.
- No code changes except this document.

## 13. Verification

After creating this document, run:

    cd /Users/jamescarlodumaua/aifinder
    npm run lint -- --quiet
    npm run check
    git diff --check
    git status --short
    node testing/discovery-static-html-evidence.test.mjs

This phase requires no migration, API, UI, executor, or parser verification because it is documentation-only and inspection-only.

