# Phase 7L — Static HTML Derived Evidence Implementation Plan

## 1. Purpose

Phase 7L converts the Phase 7K static HTML derived-evidence design into a future implementation plan.

Phase 7L does not authorize implementation, parser code, extraction behavior, or candidate creation. It defines only what a future implementation pull request must do if separately approved.

## 2. Relationship to Prior Phases

Phase 7H established that metadata fetch is not discovery, candidate status, ranking, approval, trust, or publishing readiness.

Phase 7I defined the future evidence model and the separation between evidence, candidate staging, and public data.

Phase 7J defined the acquisition policy for future evidence and recommended bounded static HTML-derived evidence as the smallest future acquisition slice.

Phase 7K designed that bounded static HTML prototype, including allowlisted evidence, in-memory raw-content handling, abuse risks, and parser boundaries.

Phase 7L is the last planning layer before a possible later implementation phase.

## 3. Future Implementation Objective

If later approved, the implementation should add a bounded, admin-only static HTML derived-evidence executor mode that:

- Uses existing safe request-planning boundaries.
- Fetches only approved HTTPS URLs.
- Reads bounded static HTML in memory only.
- Extracts only allowlisted derived evidence.
- Discards raw HTML immediately.
- Stores only safe derived-evidence summaries.
- Writes safe audit events.
- Never creates candidates.
- Never inserts into `discovered_tools`.
- Never inserts into `public.tools`.
- Never ranks, recommends, approves, or publishes tools.

## 4. Proposed Future Scope

A future implementation may include:

- A static HTML evidence helper.
- A minimal allowlisted parser helper.
- An executor mode for static HTML derived evidence.
- Run-stats output using existing `discovery_runs.stats`.
- Safe audit events using existing `discovery_audit_events`.
- Unit tests for helper behavior.
- A smoke test for the admin executor path.
- No database migration unless a later Gemini review requires it.

Phase 7L does not implement any of these items.

## 5. Proposed Future Files

Possible future new files:

- `lib/discovery-static-html-evidence.ts`
- `testing/discovery-static-html-evidence.test.mjs`

Possible future modified files:

- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `lib/discovery-run-results-review.ts`, only if later UI/read support is approved.
- `components/admin/discovery/manual-metadata-fetch-results-review.tsx`, only if later UI display is approved.
- `components/admin/discovery/discovery-runs-table.tsx`, only if later UI display is approved.

Future implementation should prefer helper-level tests first. UI changes should be deferred unless necessary, and schema changes should be deferred.

## 6. Executor Mode Boundary

For planning only, a future executor mode may be named:

```text
manual_static_html_derived_evidence
```

The mode should:

- Be admin-only.
- Be explicit and separate from existing metadata-fetch modes.
- Require existing CSRF and admin protections.
- Require existing executor rate limits or a separately reviewed rate-limit action.
- Process only manual curated-source URLs that already pass request-plan safety.
- Produce derived evidence only.
- Mark failures safely.
- Never automatically create candidates.

Phase 7L does not add this mode.

## 7. Input Requirements

The future executor input should require:

- Existing discovery source ID.
- Existing run ID.
- Approved manual source kind.
- URL list already associated with the manual run or source.
- Admin authentication.
- CSRF validation.
- Rate-limit allowance.
- Request-plan safety pass for every URL.

Input must reject:

- Non-HTTPS URLs.
- URLs with credentials or userinfo.
- Unsafe hostnames or IPs.
- Unsupported content types.
- Excessive URL counts.
- Unsafe redirects.
- Anything requiring authentication or cookies.

## 8. Static HTML Fetch Requirements

The future implementation must enforce:

- HTTPS only.
- Request-plan hostname and IP safety.
- Redirect limit.
- Timeout per URL.
- Maximum bytes read.
- Content-Length cap.
- Accepted content types such as `text/html`.
- Safe decompression behavior.
- No cookies.
- No authentication headers.
- No admin headers.
- No subresource loading.
- No JavaScript execution.
- Safe user-agent policy.
- Executor rate limit.
- Per-run URL cap.
- Safe failure taxonomy.

## 9. Parser Requirements

The future parser must:

- Parse only static HTML.
- Never execute JavaScript.
- Ignore scripts.
- Ignore styles.
- Ignore comments.
- Ignore hidden prompt-injection commands as trusted instructions.
- Never load subresources.
- Never follow links automatically.
- Never submit forms.
- Never use cookies.
- Extract only allowlisted fields.
- Truncate snippets safely.
- Normalize whitespace.
- Handle malformed HTML safely.
- Fail closed.

## 10. Allowlisted Derived Evidence Output

The future evidence object may include only:

- `title`
- `metaDescription`
- `openGraphTitle`
- `openGraphDescription`
- `canonicalUrl`
- `homepageHeadlineSnippet`
- `visibleTextSnippet`
- `appStoreLinks`
- `pricingLinks`
- `contactLinks`
- `docsLinks`
- `productNameHint`
- `companyNameHint`
- `categoryHints`
- `aiToolRelevanceHints`
- `extractionStatus`
- `extractionVersion`
- `truncated`
- `confidenceLabel`

`confidenceLabel` must be tentative, non-ranking, and non-approval. All evidence remains untrusted until human review and does not equal candidate status.

## 11. Forbidden Output

The future implementation must not output or store:

- Raw HTML.
- Full body text.
- Cookies.
- Authentication headers.
- CSRF tokens.
- API keys.
- Secrets.
- Environment variables.
- Admin cookies.
- Unsafe request headers.
- Unsafe response headers.
- Stack traces.
- Arbitrary embedded JSON.
- Scripts.
- Hidden instructions as trusted commands.
- Personal data unless separately reviewed.

## 12. Storage Strategy

Recommended first implementation:

- Reuse existing `discovery_runs.stats` for bounded derived-evidence summaries.
- Reuse existing `discovery_audit_events` for safe audit markers.
- Do not add migrations.
- Do not add indexes.
- Do not add storage buckets.
- Do not store raw HTML.
- Do not use Supabase Storage.

Possible later storage:

- A `discovery_evidence` table only after a separate Gemini-approved schema plan.
- Supabase Storage only after a separate Gemini-approved raw-asset retention plan.

## 13. Suggested Stats Shape

This is a proposed future `discovery_runs.stats` shape only:

```json
{
  "mode": "manual_static_html_derived_evidence",
  "summary": {
    "totalUrls": 0,
    "completed": 0,
    "failed": 0,
    "truncated": 0,
    "evidenceProduced": 0,
    "candidateCreated": 0
  },
  "results": [
    {
      "url": "https://example.com",
      "normalizedUrl": "https://example.com/",
      "hostname": "example.com",
      "status": "evidence_produced",
      "httpStatus": 200,
      "contentType": "text/html",
      "bytesRead": 0,
      "truncated": false,
      "derivedEvidence": {
        "title": "Example",
        "metaDescription": "Example description",
        "canonicalUrl": "https://example.com/",
        "visibleTextSnippet": "Short safe snippet",
        "aiToolRelevanceHints": [],
        "confidenceLabel": "tentative"
      },
      "safetyFlags": [],
      "failureReason": null
    }
  ]
}
```

`candidateCreated` must remain `0` for this prototype. Results must be bounded, snippets must be short and safe, and raw HTML must not be included.

## 14. Audit Event Plan

The future implementation should audit:

- Run started.
- URL acquisition started.
- URL evidence produced.
- URL failed safely.
- Run completed.
- Run failed safely.

Audit metadata may include:

- Run ID.
- Source ID.
- Normalized URL.
- Hostname.
- Acquisition method.
- Extraction version.
- Status.
- Failure reason.
- Safety flags.
- Retention mode: `none`.
- `rawHtmlStored: false`.

Audit metadata must not include raw HTML, full text, cookies, secrets, headers, stack traces, or unsafe body content.

## 15. Admin Review/UI Plan

For the first implementation, recommend:

- No public UI changes.
- Optionally extend the existing admin review surface only after implementation evidence is stable.
- Any UI wording must remain safe.

Safe wording:

- “Static HTML evidence”
- “Derived evidence”
- “Evidence pending review”
- “No candidate created”
- “Raw HTML not stored”

Avoid:

- “Tool discovered”
- “Verified”
- “Trusted”
- “Recommended”
- “Ready to publish”
- “Approved”
- “Candidate created”

## 16. Testing Plan

A future implementation must include tests for:

- Safe URL accepted.
- Unsafe URL rejected.
- Non-HTTPS rejected.
- Credentials or userinfo rejected.
- Unsafe hostname or IP rejected.
- Redirect limit enforced.
- Timeout behavior.
- Byte cap and truncation.
- Unsupported content type rejected.
- Title, metadata, and canonical extraction.
- Scripts, styles, and comments ignored.
- Malformed HTML handled safely.
- No raw HTML in stats.
- No raw HTML in audit events.
- No candidate insert.
- No `discovered_tools` insert.
- No `public.tools` insert.
- Safe failure reasons.
- Tentative confidence only.
- Evidence output bounded.

Phase 7L does not add tests.

## 17. Rollback Plan

The future implementation should be reversible by:

- Disabling the executor mode.
- Removing or ignoring stats-mode output.
- Leaving existing metadata-fetch behavior unchanged.
- Keeping no schema changes in the first implementation.
- Keeping no public-data writes.
- Keeping no candidate writes.
- Keeping no raw-asset storage to clean up.

## 18. Security Review Checklist

Before future implementation, verify:

- SSRF defenses still pass.
- Redirect policy is safe.
- Decompression risk is bounded.
- Content-size cap is enforced.
- No cookies, authentication, or admin headers are sent.
- No secrets are logged.
- Raw HTML is not stored.
- Parser cannot execute scripts.
- Evidence cannot create candidates.
- Public tables are untouched.
- Admin-only and CSRF protections remain intact.
- Rate limits exist and are tested.

## 19. Future Gemini Review Gates

Gemini review and approval are required before:

- Implementation of this plan.
- Parser or helper creation.
- Executor-mode creation.
- Stats-shape finalization.
- Audit-event-shape finalization.
- Admin UI changes.
- Evidence-schema design.
- Raw-content retention.
- Supabase Storage use.
- Browser rendering.
- Screenshots.
- LLM or AI analysis.
- Candidate staging.
- Duplicate detection.
- Approval or publish workflow.
- Migrations or schema changes.
- Any implementation that inserts into candidate, discovered, or public tool tables.

## 20. Safety Boundaries

Phase 7L approves none of the following:

- No extraction.
- No parser.
- No executor mode.
- No browser rendering.
- No screenshots.
- No raw-content storage.
- No AI or LLM analysis.
- No AI enrichment.
- No candidate creation.
- No duplicate detection.
- No ranking.
- No inserts into `discovered_tools`.
- No inserts into `public.tools`.
- No approval or publish controls.
- No migrations.
- No indexes.
- No schema changes.
- No code changes in this phase.

It also makes no API, UI, or test change.

## 21. Verification

After creating this documentation-only implementation plan, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
git diff --check
git status --short
```

No migration, index, API, UI, test, or application-code verification is required because Phase 7L changes only documentation.
