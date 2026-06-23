# Phase 7J — Future Extraction Acquisition Policy Design

## 1. Purpose

Phase 7J defines the future acquisition policy for extraction evidence before any extraction implementation begins.

Phase 7I defined what future evidence might be required. Phase 7J defines how that evidence may be safely acquired in a later, separately approved phase.

Phase 7J does not authorize extraction, HTML parsing, browser rendering, screenshots, raw-content storage, candidates, AI analysis, or any implementation work.

## 2. Relationship to Prior Phases

Phase 7F added the read-only manual metadata-fetch review surface. It displays bounded, allowlisted fetch outcomes without treating them as product evidence.

Phase 7G documented the future scalability path for safe review and audit-timeline loading.

Phase 7H defined the interpretation boundary: metadata fetch does not mean a discovered tool, candidate, ranking, approval, trust signal, or publishing readiness.

Phase 7I defined a future evidence model and the distinction between raw acquisition, derived evidence, candidate staging, and public publication.

Phase 7J is the acquisition-policy layer between current metadata fetch and any future extraction implementation. It defines preconditions and boundaries for safely acquiring potential evidence without changing the current metadata-only executor.

## 3. Acquisition Policy Goals

Any future acquisition system must:

- Preserve admin trust.
- Respect robots, terms, legal, and permission-review boundaries.
- Avoid collecting secrets, cookies, credentials, or private user data.
- Minimize raw-content retention.
- Prefer derived, allowlisted evidence over raw content.
- Be rate-limited and bounded.
- Be auditable.
- Be reversible and rejectable.
- Avoid public-tool pollution.
- Avoid treating connectivity as legitimacy.
- Avoid prompt-injection risks if LLMs are introduced later.

Acquisition is a controlled technical step, not a product-validation, trust, candidate, ranking, or publication decision.

## 4. Possible Future Acquisition Methods

Phase 7J compares possible methods without approving any of them.

### A. Static HTML Fetch

- Lower complexity.
- Easier to bound by URL count, timeout, bytes, and accepted content type.
- May miss content that requires client-side rendering.
- Still requires content-size limits, sanitization, and a reviewed retention policy.

### B. Reader API or Text-Extraction Service

- Can simplify derived-text acquisition.
- Introduces a third-party dependency and data-sharing concerns.
- Requires vendor, privacy, legal, security, and retention review before use.

### C. Browser Rendering

- Can capture dynamic sites more completely.
- Has higher cost, attack surface, timeout, and resource-consumption risk.
- Requires stronger isolation, sandboxing, and operational controls than static acquisition.

### D. Screenshot Capture

- Can provide visual evidence.
- Is storage-heavy and privacy/security sensitive.
- Requires a separate screenshot, retention, access, and redaction policy.

### E. App-Store or Link-Only Acquisition

- Can provide narrow iOS or Android evidence.
- May avoid full-page parsing in some cases.
- Does not establish product legitimacy, trust, category, or candidate eligibility by itself.

### Recommendation

The first future extraction prototype should use the smallest safe method, likely static HTML or reader-style derived evidence, only after Gemini approves extraction planning. Do not start with browser rendering or screenshots unless a later design separately justifies and approves them.

## 5. Pre-Acquisition Gates

Before a future extraction acquisition attempt, the system must require:

- Approved source kind.
- Reviewed source-risk level.
- Completed policy review.
- Recorded robots, terms, or permission status.
- A URL that passes request-plan safety.
- HTTPS-only URL.
- No credentials or userinfo in the URL.
- Hostname and IP safety checks.
- Eligible content type.
- Rate-limit eligibility.
- An admin-triggered or reviewed execution mode.
- An audit event before acquisition starts.

Failure at any mandatory gate must reject the acquisition safely before content acquisition begins.

## 6. Fetch and Content Boundaries

Any future acquisition design must define:

- Maximum URL count per run.
- Timeout per URL.
- Total run timeout.
- Maximum bytes read.
- Maximum content length.
- Accepted content types.
- Redirect policy.
- DNS and IP safety policy.
- Response-truncation behavior.
- Error-code and failure-reason taxonomy.
- Retry policy, if any.
- Rate-limit policy.
- User-agent policy.
- Concurrency policy.

These controls must preserve the existing safe request-plan, SSRF, DNS, IP, redirect, response-size, and failure-sanitization principles.

No retry, scheduler, or worker behavior is approved by Phase 7J.

## 7. Raw Content Retention Policy

| Retention mode | Benefits | Required controls and risks |
| --- | --- | --- |
| A — No raw content retained | Safest default; only derived evidence is stored | Less source material for extraction debugging |
| B — Short-lived raw content retained | May support debugging or review | Requires TTL, private storage, access controls, redaction policy, audit trail, and verified cleanup |
| C — Raw asset URI only | Stores a pointer to a private asset rather than embedding content in records | Still sensitive; requires Supabase Storage, RLS, access controls, and retention plan |
| D — Screenshot retention | May support visual review | Requires a separate screenshot policy and may expose private or sensitive data |

### Recommendation

The default future design should retain no raw content. Any raw HTML, body, or screenshot storage requires a separate Gemini-approved retention design.

## 8. Redaction and Sanitization Requirements

Future acquisition must prevent the storage or display of:

- Cookies.
- Authentication headers.
- Admin cookies.
- CSRF tokens.
- API keys.
- Secrets.
- Environment variables.
- Private user data.
- Unsafe request headers.
- Unsafe response headers.
- Full stack traces.
- Unredacted sensitive content.
- Arbitrary raw HTML or body content without approved retention.

Future designs must require:

- Allowlisted derived fields only.
- Redaction before storage.
- Safe truncation.
- No secrets in logs.
- No raw content in audit events.

Unknown, malformed, or unsafe fields must be discarded or represented through a safe failure status rather than stored or rendered.

## 9. Prompt Injection and AI Safety

If AI or LLM analysis is introduced later, the future design must require:

- A prompt-injection threat model.
- Page content treated as hostile input.
- No execution of page instructions.
- No credentials, secrets, or admin context in prompts.
- Model outputs marked tentative.
- Human review before candidate creation or approval.
- Audit of model usage if separately allowed.
- Token and cost limits.
- Defined fallback behavior when AI processing fails.

Phase 7J does not approve LLM or AI analysis.

## 10. Evidence Output Boundary

Future acquisition may produce evidence only if a later phase approves it. That evidence should be:

- Allowlisted.
- Versioned.
- Linked to source, run, and URL.
- Timestamped.
- Safe for admin review.
- Separated from candidates.
- Auditable.
- Rejectable.

Evidence must not automatically:

- Create a candidate.
- Approve a tool.
- Insert into `discovered_tools`.
- Insert into `public.tools`.
- Rank or recommend a tool.
- Confirm duplicate status.

## 11. Admin UI Language Guidance

Use safe future wording:

- “Extraction acquisition pending”
- “Evidence acquisition completed”
- “Derived evidence available for review”
- “No candidate created”
- “Human review required”
- “Acquisition failed safely”

Avoid wording that implies discovery, trust, or approval:

- “Tool discovered”
- “Candidate approved”
- “Verified”
- “Trusted”
- “Recommended”
- “Ready to publish”
- “Duplicate confirmed”

## 12. Audit Requirements

Future acquisition workflows should audit:

- Source ID.
- Run ID.
- Normalized URL.
- Acquisition method.
- Acquisition version.
- Policy-review status.
- Content-boundary settings.
- Safety flags.
- Started and finished timestamps.
- Actor or admin identity when applicable.
- Failure reason.
- Redaction status.
- Retention mode.
- Evidence-output status.

Audit events must not contain raw page content, secrets, cookies, or unsafe headers.

## 13. Future Implementation Options

| Option | Benefits | Trade-offs | Direction |
| --- | --- | --- | --- |
| A — Static HTML derived-evidence prototype | Smallest first acquisition slice; lower operational complexity | May miss dynamic evidence | Likely first step after Gemini approves extraction planning |
| B — Reader API derived-evidence prototype | Can provide clean text | Adds vendor and privacy dependency | Requires third-party review |
| C — Browser-rendered acquisition | Can handle dynamic pages | High cost and risk | Defer until static or reader methods are insufficient |
| D — Screenshot evidence | May help visual review | Sensitive retention and access requirements | Defer until a separate policy exists |

### Recommendation

Begin future implementation planning with Option A only if Gemini approves extraction planning. Defer browser rendering and screenshots.

## 14. Safety Boundaries

Phase 7J approves none of the following:

- No extraction.
- No HTML parsing.
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

## 15. Future Gemini Review Gates

Gemini review and approval are required before any future work begins on:

- Extraction implementation.
- Acquisition-method selection.
- Static HTML parsing.
- Reader API or vendor use.
- Browser rendering.
- Screenshot capture.
- Raw-content retention.
- Supabase Storage use.
- Evidence-schema design.
- LLM or AI analysis.
- Candidate staging.
- Duplicate detection.
- Approval or publish workflow.
- Migrations or schema changes.
- Any implementation that inserts into candidate, discovered, or public tool tables.

## 16. Verification

After creating this documentation-only design, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
git diff --check
git status --short
```

No migration, index, API, UI, test, or application-code verification is required because Phase 7J changes only documentation.
