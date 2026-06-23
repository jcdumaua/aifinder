# Phase 7H — Manual Metadata Fetch Interpretation Boundary Design

## 1. Purpose

Phase 7H defines the interpretation boundaries for manual metadata-fetch results before any extraction or candidate phase begins.

Manual metadata-fetch confirms only that a URL passed the safe request-plan boundary and was processed by the metadata-only fetch path. It does not establish what the URL represents beyond that operational outcome.

In particular, a metadata-fetch result does not confirm that the URL is an AI tool or that it has any particular quality, category, pricing, features, legitimacy, or relevance.

This boundary keeps the Discovery Engine’s current fetch layer separate from future extraction, evidence, candidate staging, review, and approval decisions.

## 2. Current Metadata-Fetch Output

Manual metadata-fetch exposes only safe per-URL operational metadata:

- `normalized_url`
- `hostname`
- `status`
- `http_status`
- `content_type`
- `content_length_header`
- `resolved_ip_family`
- `bytes_read`
- `response_truncated`
- `duration_ms`
- `error_code`
- `failure_reason`

Safe run-level metadata includes:

- `total_urls`
- `processed_urls`
- `fetched_urls`
- `failed_urls`
- `skipped_urls`
- `executor_mode`
- `execution_status`

The run also records safety flags that preserve the current boundary:

- `no_extraction_performed`
- `no_llm_analysis_performed`
- `no_candidates_inserted`
- `no_public_tools_inserted`

These fields are operational metadata. They record the request-plan and fetch outcome, not the contents, meaning, quality, or trustworthiness of a site.

## 3. Allowed Interpretations

Metadata-fetch results may be used to determine:

- Whether the safe request-plan/fetch boundary worked.
- Whether a URL was reachable enough for a metadata-only fetch.
- Whether the response used an accepted content type.
- Whether safe fetch protections triggered.
- Whether a URL failed safely.
- Whether future extraction may be technically eligible after separate approval.
- The operational health of the manual metadata-fetch executor.
- The fetch status and safety outcome available for admin review.

Use only careful operational language:

- “Metadata fetch succeeded.”
- “Metadata fetch failed safely.”
- “Future extraction may be technically eligible after approval.”
- “Safe request-plan/fetch boundary was preserved.”

None of these statements communicates a product, quality, trust, safety, or recommendation assessment.

## 4. Forbidden Interpretations

Metadata-fetch results must not be interpreted as any of the following:

- A discovered AI tool.
- A candidate tool.
- A validated tool.
- A trusted company.
- A safe vendor.
- A high-quality product.
- A relevant AI product.
- A category match.
- A pricing signal.
- A feature signal.
- A popularity or ranking signal.
- A duplicate match.
- An approval signal.
- A publishing signal.
- SEO or content-quality evidence.
- Tool-legitimacy evidence.
- User-recommendation evidence.

`HTTP 200`, `text/html`, a `hostname`, and a successful metadata fetch are not enough to create a candidate.

They show only that the bounded metadata-fetch operation received an accepted response under current protections. They do not establish what the page says, whether the page describes an AI tool, whether the site is legitimate, or whether any later action is appropriate.

## 5. Required Future Gates Before Candidate Creation

Before a future candidate-creation phase may begin, it must have a separately approved design covering:

- HTML or body acquisition policy.
- Extraction scope.
- Raw-content retention and storage policy.
- Evidence model.
- Candidate staging schema or approved reuse strategy.
- Duplicate-detection design.
- Human review gates.
- Security controls.
- Legal, robots, and terms-review policy.
- LLM or AI-analysis policy if AI is introduced.
- Audit requirements.
- Rollback and rejection path.
- Gemini review.

Metadata fetch may inform whether a later design considers a URL technically fetchable. It cannot replace any of these gates.

## 6. Future Extraction Boundary

A future extraction phase must decide and document the following before implementation:

- Whether to retain raw HTML or only derived, reviewed evidence.
- Whether screenshots are allowed.
- Whether extraction uses static HTML, reader APIs, browser rendering, or third-party services.
- Maximum content size.
- Timeout and rate-limit boundaries.
- Redaction and sanitization requirements.
- Evidence-retention duration.
- How secrets, cookies, authentication data, and unsafe headers are excluded.
- How prompt injection is prevented if LLMs are later introduced.

The future design must also preserve request-plan, DNS, IP, SSRF, redirect, and response-size protections appropriate to its chosen acquisition method.

Phase 7H does not approve extraction.

## 7. Future Candidate Boundary

Candidate creation requires a separate approved phase and must follow these rules:

- A candidate cannot be created from metadata alone.
- A candidate must have reviewed evidence.
- A candidate must be staged and must not be inserted into `public.tools`.
- A candidate must remain admin-review-only until a later approval workflow authorizes another status.
- A candidate must have duplicate checks before approval.
- A candidate must never bypass human or admin approval.
- Candidate creation requires a separate Gemini-approved implementation plan.

The manual metadata-fetch executor remains independent from candidate staging. No fetch result may silently create, update, approve, or publish a candidate.

## 8. Admin UI Language Guidance

Current and future UI language should make the boundary visible.

Recommended wording:

- “Metadata fetch completed”
- “Metadata only — no extraction performed”
- “No candidate created”
- “Eligible for future extraction review”
- “Fetch failed safely”

Avoid wording that implies discovery, validation, trust, or a workflow decision:

- “Tool discovered”
- “AI tool found”
- “Candidate ready”
- “Approved”
- “Recommended”
- “Ranked”
- “Verified”
- “Trusted”
- “Safe vendor”

## 9. Security and Trust Rationale

This interpretation boundary prevents a successful network operation from being mistaken for product evidence.

It prevents false positives, public or tool-list pollution, and the treatment of connectivity as product legitimacy. It also prevents premature automation from turning operational metadata into rankings, recommendations, candidate records, or public listings.

The boundary preserves admin trust by keeping a clear separation between:

1. Safe request planning and metadata fetch.
2. A separately approved extraction process.
3. Reviewed evidence.
4. Candidate staging.
5. Human/admin approval and any later public publication decision.

## 10. Safety Boundaries

Phase 7H makes no implementation change and authorizes none of the following:

- No extraction.
- No parsing.
- No AI or LLM analysis.
- No AI enrichment.
- No candidates.
- No duplicate detection.
- No ranking.
- No inserts into `discovered_tools`.
- No inserts into `public.tools`.
- No approval or publish controls.
- No migrations.
- No code changes in this phase.

It also makes no API, UI, test, index, or schema change.

## 11. Future Gemini Review Gates

Gemini review and approval are required before any future work begins on:

- Extraction design.
- Candidate-staging design.
- Duplicate-detection design.
- Evidence-storage design.
- LLM or AI-analysis design.
- Raw-content retention design.
- Any migration or schema change.
- Any implementation that creates candidates or public tools.

Future review must confirm that metadata-fetch outcomes are still not treated as discovery, validation, ranking, trust, or approval evidence.

## 12. Verification

After creating this documentation-only design, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
git diff --check
git status --short
```

No migration, index, API, UI, test, or application-code verification is required because Phase 7H changes only documentation.
