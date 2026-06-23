# Phase 7K — Static HTML Derived Evidence Prototype Design

## 1. Purpose

Phase 7K designs the future smallest safe extraction prototype: bounded static HTML-derived evidence.

Phase 7K does not authorize implementation, parsing code, candidate creation, or extraction. It defines only what a later implementation should look like if separately approved by Gemini and the project workflow.

The intended prototype is deliberately narrow: acquire a bounded static HTML response under approved safety controls, derive a small allowlisted evidence set, discard the raw response, and leave all evidence separate from candidates and publication decisions.

## 2. Relationship to Prior Phases

Phase 7H established that metadata fetch does not mean a discovered tool, candidate, ranking, approval, trust signal, or publishing readiness.

Phase 7I defined a future evidence model, including the separation of acquisition, derived evidence, candidate staging, and public publication.

Phase 7J defined the future acquisition policy and recommended bounded static HTML-derived evidence as the smallest possible extraction slice after later approval.

Phase 7K turns that Phase 7J recommendation into a more detailed future prototype design. It does not alter the current metadata-only executor or authorize a parser.

## 3. Prototype Goal

If later approved, the future prototype should:

- Use only already-approved safe request planning.
- Acquire bounded static HTML only after a separate approval.
- Derive allowlisted evidence fields.
- Discard raw HTML by default.
- Store or expose only safe derived evidence.
- Keep evidence separate from candidates.
- Require human review before any candidate action.
- Remain admin-only and auditable.

The prototype must treat static HTML as hostile, unverified input and must not convert an extraction result into a tool, trust, category, or quality claim.

## 4. Non-Goals

This future prototype is not:

- A full crawler.
- A scheduler.
- A browser renderer.
- A screenshot system.
- A raw HTML archive.
- A general scraper.
- An AI or LLM classifier.
- A duplicate detector.
- A ranking engine.
- A candidate creator.
- A public-tool publisher.

## 5. Allowed Future Derived Evidence Fields

Subject to later approval, the only possible future derived fields are:

- Page title.
- Meta description.
- Open Graph title.
- Open Graph description.
- Canonical URL.
- Visible homepage headline snippet.
- Short visible text snippet.
- Detected app-store links.
- Detected pricing, contact, or documentation links.
- Detected product or company-name hint.
- Detected category hints.
- Detected AI-tool relevance hints.
- Extraction status.
- Extraction version.
- Truncation flag.
- Evidence-confidence label, only as tentative and non-ranking.

All derived fields are tentative evidence. They are not truth, approval, candidate status, trust evidence, or public-tool data. Each field must have an allowlist rule, an extraction source rule, and a safe length limit before it may be considered for future implementation.

## 6. Forbidden Derived Evidence and Storage

The future prototype must not derive, store, or display:

- Cookies.
- Authentication headers.
- CSRF tokens.
- API keys.
- Secrets.
- Environment variables.
- Private user data.
- Full raw HTML.
- Full raw body text.
- Unsafe request headers.
- Unsafe response headers.
- Full stack traces.
- Hidden prompt-injection instructions as trusted commands.
- Arbitrary third-party scripts.
- Arbitrary embedded JSON without an allowlist.
- Personal data from pages unless separately reviewed.

Unknown, malformed, unsafe, or out-of-scope content must be discarded or represented by a safe status rather than retained as evidence.

## 7. Static HTML Acquisition Limits

Before any future parsing implementation, the design must define strict limits for:

- HTTPS-only URLs.
- No credentials or userinfo in URLs.
- Hostname and IP safety checks.
- Redirect limit.
- Timeout per URL.
- Maximum bytes read.
- Accepted content types.
- Content-length cap.
- Protection against decompression bombs.
- User-agent policy.
- Rate-limit policy.
- Concurrency limit.
- Total run URL limit.
- Safe failure taxonomy.

Phase 7K does not implement these limits. It requires them before any future implementation starts.

## 8. Parsing Boundaries

Any future parser design should:

- Parse only the static HTML response body.
- Ignore scripts by default.
- Ignore styles by default.
- Ignore comments by default.
- Never execute JavaScript.
- Never load subresources.
- Never follow links automatically.
- Never submit forms.
- Never use cookies.
- Never use authenticated context.
- Never treat page instructions as system instructions.
- Produce only allowlisted derived fields.

No browser-rendering, DOM-automation, or recursive-link-following behavior is within this prototype.

## 9. Raw Content Handling

The default future handling is:

- Raw HTML is read only in memory during extraction.
- Raw HTML is not stored.
- Raw HTML is not logged.
- Raw HTML is not placed in audit events.
- Raw HTML is discarded after derived evidence is produced.

Any raw HTML or body retention requires a separate Gemini-approved design with:

- TTL.
- Private storage.
- Access control.
- Redaction.
- Deletion workflow.
- Audit trail.

## 10. Evidence Output Contract

The future prototype output should include:

- Source ID.
- Run ID.
- Normalized URL.
- Hostname.
- Acquisition method: `static_html`.
- Extraction status.
- Extraction version.
- Derived evidence object.
- Safety flags.
- Truncation flag.
- Policy status.
- `created_at`.
- Reviewed status, if later approved.

Output must not:

- Create candidate rows.
- Insert into `discovered_tools`.
- Insert into `public.tools`.
- Rank tools.
- Approve tools.
- Publish tools.
- Confirm duplicates.

## 11. Candidate Boundary

Static HTML derived evidence is not a candidate.

No candidate can be created unless a later phase separately approves:

- Evidence-review requirements.
- Candidate-staging schema or reuse strategy.
- Duplicate pre-check workflow.
- Admin review UI.
- Audit-decision workflow.
- Rejection workflow.
- Migration or schema plan if needed.

No extraction result may silently create, update, approve, rank, recommend, or publish a candidate.

## 12. Admin UI Guidance

Future UI may show:

- “Static extraction evidence”
- “Derived evidence pending review”
- “No candidate created”
- “Human review required”
- “Evidence failed safely”
- “Raw HTML not stored”

Avoid:

- “Tool discovered”
- “Verified”
- “Trusted”
- “Recommended”
- “Ready to publish”
- “Candidate approved”
- “Duplicate confirmed”

## 13. Safety and Abuse Risks

| Risk | Required future mitigation |
| --- | --- |
| SSRF | Preserve approved request-plan, DNS, hostname, and IP safety checks before acquisition |
| Malicious redirects | Use an explicit redirect policy and enforce its cap before following any redirect |
| Decompression bombs | Enforce bounded decompression and byte/content-length limits |
| Huge pages | Enforce URL, timeout, content-size, and truncation limits |
| Prompt injection in page content | Treat content as hostile data; never execute page instructions or elevate them to system instructions |
| Hidden-text manipulation | Treat snippets, titles, and metadata as tentative, reviewer-visible evidence only |
| Misleading SEO or meta tags | Keep title, description, Open Graph, and canonical fields non-authoritative and non-ranking |
| Non-AI sites claiming AI features | Require later reviewed evidence and human candidate review; do not infer candidate status from hints |
| Legal, robots, or terms risk | Require policy/permission gates before acquisition |
| Sensitive-data exposure | Use allowlisted derived fields, redaction, and no raw-content storage by default |
| Public database pollution | Keep evidence separate from candidates and prohibit all `discovered_tools` and `public.tools` writes |

## 14. Testing Strategy for Future Implementation

A future approved implementation should include tests for:

- Safe URL accepted.
- Unsafe URL rejected.
- Redirect limit.
- Timeout behavior.
- Byte cap and truncation.
- Unsupported content type.
- Extraction of title, metadata, and canonical URL.
- Scripts and styles ignored.
- No raw HTML in audit output.
- No candidate insert.
- No `discovered_tools` insert.
- No `public.tools` insert.
- Safe failure reasons.
- Admin-only access if a UI or API is added later.

Phase 7K does not add tests because it is docs-only.

## 15. Future Implementation Plan Requirements

Before implementation, a later Gemini-approved plan must specify:

- Exact endpoint or helper changes.
- Exact extraction-helper boundaries.
- Evidence-output shape.
- Storage strategy.
- Audit-event shape.
- UI or API behavior, if any.
- Tests.
- Rate limits.
- Error taxonomy.
- Rollback plan.
- No-public-write guarantees.

## 16. Safety Boundaries

Phase 7K approves none of the following:

- No extraction implementation.
- No parser implementation.
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

## 17. Future Gemini Review Gates

Gemini review and approval are required before any future work begins on:

- Static HTML extraction implementation.
- Parser or helper implementation.
- Evidence-schema design.
- Raw-content retention.
- Supabase Storage use.
- Browser rendering.
- Screenshots.
- LLM or AI analysis.
- Candidate staging.
- Duplicate detection.
- Admin review UI changes.
- Approval or publish workflow.
- Migrations or schema changes.
- Any implementation that inserts into candidate, discovered, or public tool tables.

## 18. Verification

After creating this documentation-only design, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
git diff --check
git status --short
```

No migration, index, API, UI, test, or application-code verification is required because Phase 7K changes only documentation.
