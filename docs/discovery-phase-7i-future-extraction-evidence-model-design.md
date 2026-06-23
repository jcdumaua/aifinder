# Phase 7I — Future Extraction Evidence Model Design

## 1. Purpose

Phase 7I defines a future evidence model for extraction and candidate staging without authorizing extraction or implementation.

Metadata fetch is not enough. A future extraction phase needs auditable evidence, and any later candidate-creation decision must be based on reviewed evidence rather than raw connectivity, an HTTP response, or fetch metadata alone.

This document establishes the boundaries for what a future approved phase would need to collect, retain, review, audit, reject, and eventually link to a staged candidate.

## 2. Relationship to Prior Phases

Phase 7F added the read-only admin surface for manual metadata-fetch results. It displays safe operational outcomes without presenting them as product evidence.

Phase 7G documented the scalability hardening path for that review surface, including bounded audit timeline loading and future audit-query considerations.

Phase 7H established the interpretation boundary: a metadata fetch is not a discovered tool, candidate, ranking, trust signal, approval, or publishing decision.

Phase 7I builds on Phase 7H by defining what future evidence might be required before a URL could become a staged candidate. It does not change the meaning of current metadata-fetch results and does not authorize the collection of any new evidence.

## 3. Evidence Model Goals

A future evidence model should:

- Separate raw acquisition from derived evidence.
- Separate evidence from candidate creation.
- Support admin review.
- Support auditability.
- Support rejection and rollback.
- Avoid storing unsafe or unnecessary raw data.
- Prevent prompt injection or unsafe LLM use if AI analysis is introduced later.
- Preserve privacy and security boundaries.
- Keep public-tool insertion separate and human-approved.

The model should allow a reviewer to understand why a future candidate was considered without making raw page content, credentials, or unreviewed machine inferences into public tool data.

## 4. Evidence Types

Phase 7I designs the following possible evidence categories. It does not authorize collecting, storing, or displaying them.

### A. Fetch Evidence

Future evidence may retain the existing safe operational metadata:

- Normalized URL.
- Hostname.
- Fetch status.
- HTTP status.
- Content type.
- Content length.
- Bytes read.
- Truncation flag.
- Duration.
- Safe failure reason.

Fetch evidence establishes operational context only. It does not establish a product claim.

### B. Extraction Evidence

If a later phase explicitly approves extraction, possible derived evidence could include:

- Extracted title, if allowed later.
- Extracted description, if allowed later.
- Visible page-text snippets, if allowed later.
- Structured metadata such as Open Graph or meta tags, if allowed later.
- Canonical URL, if allowed later.
- Outbound app-store links, if allowed later.
- Pricing or page indicators, if allowed later.

Any extracted field must have an explicit source, a sanitization rule, a retention rule, and a reviewer-visible confidence or limitation statement. It must not be treated as independently verified fact.

### C. Policy Evidence

Future policy evidence could include:

- Robots or terms-review status.
- Permission status.
- Source-risk level.
- Approved source kind.
- Reviewed-by and reviewed-at values.
- Legal or terms notes.

Policy evidence records whether future acquisition and review were permitted under approved rules. It does not itself prove the quality, legitimacy, or relevance of a product.

### D. Classification Evidence

Future classification evidence could include:

- Possible AI-tool relevance indicators.
- Possible category hints.
- Possible product or company boundary indicators.

Every classification signal must be explicitly marked tentative until reviewed. It must not create a candidate, rank a URL, or update a public tool automatically.

### E. Safety Evidence

Future safety evidence could include:

- Confirmation that no authentication, cookie, or header capture occurred.
- Confirmation that no secret capture occurred.
- Redaction status.
- Content-size-cap status.
- Prompt-injection risk notes if LLM analysis is later introduced.

Safety evidence should record boundary outcomes without retaining sensitive input, raw secrets, or unsafe headers.

## 5. Forbidden Evidence

Future extraction and candidate systems must not store or display:

- Raw cookies.
- Authentication headers.
- Admin cookies.
- CSRF tokens.
- API keys.
- Secrets.
- Environment variables.
- Private user data.
- Full stack traces.
- Unsafe request headers.
- Unsafe response headers.
- Unredacted sensitive content.
- Arbitrary raw HTML without a reviewed retention policy.
- Arbitrary raw body text without a reviewed retention policy.

Any future evidence design must use allowlisted fields and must hide unknown, malformed, or unsafe data rather than rendering it for review.

## 6. Raw Content Retention Options

| Option | Benefits | Risks and requirements |
| --- | --- | --- |
| A — No raw HTML/body storage | Safest option; retains only derived, allowlisted evidence | Extraction-quality debugging is harder because the original content is unavailable |
| B — Short-lived raw content storage | Better extraction debugging and incident investigation | Higher security, privacy, and compliance risk; requires strict TTL, access control, redaction, and storage policy |
| C — Store screenshots only | Useful visual evidence | Still requires privacy and security review; can be heavy and difficult to search |
| D — Store raw asset URI in private storage | Supports reproducibility | Requires Supabase Storage, RLS, retention policy, and a separately reviewed design |

### Recommendation

Start any future extraction design with derived, allowlisted evidence only unless Gemini approves a stronger retention model. Do not store raw HTML or body content by default.

## 7. Candidate Creation Evidence Threshold

Before a staged candidate can be created in a future approved phase, it should require at least:

- A successful, approved extraction phase.
- Normalized URL and hostname.
- Reviewed source and policy status.
- Extracted evidence indicating that the URL is likely an AI tool.
- No blocking safety flags.
- Duplicate pre-check completed or queued, according to the separately approved duplicate-detection design.
- Human-review-only candidate status.
- An audit trail linking evidence to its run and source.

No candidate can be created from metadata-fetch results alone.

This threshold is a design requirement, not an authorization to implement candidate creation, evidence collection, duplicate detection, or extraction.

## 8. Evidence-to-Candidate Separation

Evidence records, if introduced later, must not automatically become candidates. Candidate staging must be a separate, explicitly controlled step.

Public-tool insertion must remain a later, separate approval step. Admin review remains the boundary between collected evidence, tentative classification, staged candidate data, and public data.

No evidence workflow may silently create, update, approve, rank, recommend, or publish a tool.

## 9. Future Schema Considerations

Future phases may evaluate, without committing to, these schema directions:

- Reuse `discovery_runs.stats` for short-term derived-evidence summaries.
- Add a future `discovery_evidence` table.
- Add a future `discovery_extraction_runs` table.
- Add a future `discovery_candidate_evidence_links` table.
- Use Supabase Storage for raw assets only if separately approved.

Any future evidence record should account for actor, source, run, URL, timestamps, evidence version, and safety flags.

Phase 7I does not choose a schema. A later Gemini-approved implementation plan is required before any migration or schema change is proposed.

## 10. Prompt Injection and LLM Safety

If future AI or LLM analysis is introduced, the design must require:

- A prompt-injection threat model.
- Content sanitization.
- Strict tool and function boundaries.
- No direct execution of page instructions.
- No secrets in prompts.
- No credentials or admin context in prompts.
- Model output treated as tentative.
- Human review before candidate approval.
- Audit of model usage and token or cost metadata, if such metadata is separately allowed.

No model output may override the extraction, policy, duplicate, safety, or human-review boundaries.

Phase 7I does not approve LLM or AI analysis.

## 11. Admin UI Guidance

Future UI must distinguish these states:

- Fetch result.
- Extraction evidence.
- Tentative classification.
- Staged candidate.
- Approved public tool.

Use safe wording:

- “Evidence collected”
- “Extraction evidence pending review”
- “Tentative AI-tool signal”
- “Candidate not yet created”
- “Human review required”

Avoid wording that overstates confidence or status:

- “Verified AI tool”
- “Ready to publish”
- “Trusted”
- “Recommended”
- “Approved”
- “Ranked”
- “Duplicate confirmed” unless a duplicate workflow exists

## 12. Audit Requirements

Future evidence workflows should audit:

- Source ID.
- Run ID.
- Normalized URL.
- Extraction version.
- Evidence version.
- Policy status.
- Actor or admin action.
- Timestamps.
- Safety flags.
- Rejection reasons.
- Candidate-creation decision, if later approved.

Audit records must remain safe, bounded, allowlisted, and free of credentials, raw sensitive content, and secrets.

## 13. Safety Boundaries

Phase 7I approves none of the following:

- No extraction.
- No HTML parsing.
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

## 14. Future Gemini Review Gates

Gemini review and approval are required before any future work begins on:

- Extraction implementation.
- Evidence-schema design.
- Raw-content retention.
- Screenshot capture.
- Supabase Storage use.
- LLM or AI analysis.
- Candidate staging.
- Duplicate detection.
- Approval or publish workflow.
- Migrations or schema changes.
- Any implementation that inserts into candidate, discovered, or public tool tables.

## 15. Verification

After creating this documentation-only design, run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
git diff --check
git status --short
```

No migration, index, API, UI, test, or application-code verification is required because Phase 7I changes only documentation.
