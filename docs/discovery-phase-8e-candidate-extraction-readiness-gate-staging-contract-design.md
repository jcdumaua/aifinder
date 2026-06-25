# Phase 8E — Candidate Extraction Readiness Gate / Staging Contract Design

## 1. Purpose

Phase 8E defines the readiness gate and staging contract design for future candidate extraction from static-derived evidence.

This is a docs-only phase. It does not implement extraction, create candidates, write `discovered_tools`, write `public.tools`, change schema, add API behavior, add UI behavior, run duplicate detection, add ranking/recommendation, add approval/publish behavior, add LLM interpretation, add automation, or run a smoke test.

The purpose is to define what must be true before AiFinder can safely convert static-derived evidence into staged candidate tool records for human review.

## 2. Scope

This document covers:

- the current static evidence capability baseline;
- why candidate extraction remains blocked;
- the staging-only principle for any future extraction output;
- a conceptual staging record shape;
- allowed and disallowed candidate fields;
- field-level normalization rules;
- unsafe-data redaction rules;
- confidence and scoring boundaries;
- duplicate detection expectations;
- human review requirements;
- audit event requirements;
- the LLM / no-LLM decision boundary;
- API, UI, and database decision boundaries;
- required Gemini review gates before implementation.

This document does not choose a final database schema, table, API route, or UI implementation. Those decisions remain deferred to a separate schema and contract review phase.

## 3. Current capability baseline

The static evidence plus audit timeline track is closed for the current prototype scope.

Baseline facts:

- Current repository status after the Phase 8D push was `## main...origin/main`.
- Static evidence currently supports safe bounded acquisition.
- Static evidence currently supports static-derived evidence generation.
- Static evidence currently supports read-only admin review.
- Static evidence currently supports operational audit visibility.
- Candidate extraction is not implemented.
- Candidate extraction is not implementation-ready.
- No candidates are created by the static evidence track.
- No `discovered_tools` writes are performed by the static evidence track.
- No `public.tools` writes are performed by the static evidence track.
- No approval/publish behavior exists in the static evidence track.
- No LLM interpretation exists in the static evidence track.
- No automation, scheduler, cron, worker, or browser automation exists in this track.

The completed static evidence track provides reviewable evidence and operational visibility. It does not yet provide a safe contract for turning evidence into staged candidate records.

## 4. Why candidate extraction is not implementation-ready yet

Candidate extraction is not implementation-ready because the project has not yet approved:

- a staging-only candidate contract;
- a final staging storage design;
- a candidate payload allowlist;
- field-level normalization rules;
- duplicate safety requirements;
- confidence/scoring boundaries;
- human-review workflow boundaries;
- audit event requirements for extraction;
- unsafe-data redaction rules for candidate payloads;
- an LLM / no-LLM extraction decision;
- a smoke-test plan for extraction behavior.

Static-derived evidence remains tentative. It can be useful for admin review, but it must not be treated as verified product data or converted directly into public tool records.

The next safe step is contract and schema decision planning, not extraction implementation.

## 5. Staging-only principle

Future extraction output must be staging-only.

Required rules:

- Extraction output must go to a future staging layer only.
- Extraction output must not write directly to `public.tools`.
- Extraction output must not auto-approve tools.
- Extraction output must not auto-publish tools.
- Extraction output must not bypass human review.
- Extraction output must not be treated as verified product data.
- Extraction output must not be used as ranking, recommendation, or duplicate-resolution authority.
- Extraction output must remain clearly labeled as unverified candidate data until reviewed by an admin.

This principle applies whether extraction is deterministic, rule-based, assisted by static parsers, or assisted by an LLM in a separately reviewed future phase.

## 6. Candidate extraction contract overview

A future extraction contract should define how safe static-derived evidence becomes a bounded staging candidate object.

Contract responsibilities:

- accept only safe, normalized, static-derived evidence inputs;
- reject missing or unsafe required fields;
- produce only allowlisted staging fields;
- normalize candidate name, website, category hint, pricing hint, links, and evidence summary;
- attach safe confidence and risk metadata;
- record duplicate signals without resolving duplicates automatically;
- preserve human review as mandatory;
- emit safe extraction audit events;
- prevent raw data fallback behavior.

The extraction contract should be independent from public publishing. A staged candidate is only a review artifact. It is not a published tool and not an approved tool.

## 7. Proposed staging record shape

The following shape is conceptual only. It does not claim that a schema, table, API route, or UI exists.

Future conceptual staging object:

```text
{
  source_run_id,
  source_url,
  source_url_normalized,
  extraction_mode,
  candidate_name,
  candidate_website,
  candidate_description,
  candidate_category_hint,
  candidate_pricing_hint,
  candidate_platform_hints,
  candidate_social_links,
  candidate_app_links,
  evidence_summary,
  confidence,
  risk_flags,
  duplicate_signals,
  review_status,
  review_notes,
  created_at
}
```

Field intent:

- `source_run_id`: the Discovery run that produced the source evidence.
- `source_url`: the reviewed source URL, stored only if sanitized and bounded.
- `source_url_normalized`: the canonicalized source URL used for comparison and review.
- `extraction_mode`: a bounded enum such as deterministic static extraction, if approved later.
- `candidate_name`: a bounded candidate tool name.
- `candidate_website`: a sanitized candidate website URL.
- `candidate_description`: a bounded plain-language candidate description.
- `candidate_category_hint`: a hint from existing AiFinder categories only.
- `candidate_pricing_hint`: a hint from existing safe pricing options only.
- `candidate_platform_hints`: bounded platform labels, if safely derived.
- `candidate_social_links`: bounded safe social link hints after URL checks.
- `candidate_app_links`: bounded safe app-store or app link hints after URL checks.
- `evidence_summary`: bounded safe summary of why the candidate was staged.
- `confidence`: advisory confidence only.
- `risk_flags`: bounded safety, quality, or ambiguity flags.
- `duplicate_signals`: bounded duplicate indicators, not duplicate decisions.
- `review_status`: staging review status only, not public approval or publish status.
- `review_notes`: bounded admin notes, if a future UI supports them.
- `created_at`: staging record creation timestamp.

The final storage shape must be decided in a later phase. This document does not recommend direct insertion into `public.tools`.

## 8. Field-level allowlist

Allowed candidate fields should be limited to:

- bounded tool name candidate;
- sanitized website URL;
- normalized source URL reference;
- bounded plain-language description;
- category hint from the existing AiFinder category taxonomy only:
  - `Chatbots`
  - `Image AI`
  - `Video AI`
  - `Voice AI`
  - `Writing`
  - `Coding`
  - `Business`
  - `Productivity`
  - `Education AI`
  - `Marketing AI`
  - `SEO AI`
  - `Design AI`
  - `AI Agents`
- pricing hint from existing safe pricing options only:
  - `Free + Paid`
  - `Free`
  - `Paid`
- platform, app, and social link hints after URL safety checks;
- bounded evidence summary;
- bounded risk flags;
- advisory confidence category;
- bounded duplicate signals;
- staging-only review status;
- bounded admin review notes, if separately implemented.

Disallowed fields include:

- raw HTML;
- raw visible text;
- raw metadata;
- raw stats;
- raw audit rows;
- raw JSON dumps;
- headers;
- cookies;
- secrets;
- stack traces;
- transport payloads;
- LLM prompts or responses;
- user, session, or admin data;
- executable or script content;
- unbounded descriptions;
- direct approval status;
- direct publish status;
- arbitrary unknown fields.

Unknown fields must be dropped. They must not be preserved in a generic metadata blob unless a later phase separately approves a safe bounded artifact shape.

## 9. Field-level normalization rules

Future extraction normalization must:

- trim and bound all strings;
- reject empty required fields;
- reject unsafe URLs;
- strip query strings and fragments where appropriate;
- normalize domains using existing Project AiFinder domain-safety expectations;
- force HTTPS where appropriate;
- reject non-HTTP(S), JavaScript, data, blob, file, localhost, private-network, and credential-bearing URLs unless a future reviewed source policy explicitly allows them;
- enforce the existing category allowlist;
- enforce the existing pricing allowlist;
- strip HTML and script-like content;
- reject executable content;
- normalize arrays by trimming, deduplicating, bounding item length, and capping item count;
- normalize booleans and enums through explicit allowlists only;
- reject or drop unknown fields;
- avoid raw fallback output;
- avoid `JSON.stringify` fallback behavior;
- avoid exception message passthrough;
- avoid preserving unbounded parser or transport messages.

Normalization should fail closed. If a candidate cannot satisfy the contract safely, it should be rejected by the normalizer and recorded only through a safe audit event.

## 10. Unsafe-data redaction rules

Future extraction must never persist or render:

- raw HTML;
- HTML snippets;
- raw visible text;
- body text snippets;
- title or headline snippets unless separately normalized into approved bounded fields;
- meta description snippets unless separately normalized into approved bounded fields;
- raw metadata;
- raw stats;
- raw audit rows;
- raw JSON dumps;
- headers;
- cookies;
- authentication, session, or CSRF values;
- secrets or secret-like strings;
- stack traces;
- exception messages if unbounded;
- raw transport payloads;
- candidate payloads outside the allowlist;
- discovered-tool or public-tool payloads;
- LLM prompts or responses;
- user, session, or admin data.

Redaction must happen before storage and before UI display. The system should not rely on UI hiding to protect unsafe data that has already been stored.

## 11. Confidence and scoring boundaries

Confidence is advisory only.

Rules:

- Confidence must not auto-approve.
- Confidence must not auto-publish.
- Confidence must not bypass duplicate review.
- Confidence must not bypass human review.
- Confidence must not become ranking or recommendation.
- Confidence should use coarse labels such as `low`, `medium`, and `high`, unless a bounded numeric score is separately approved.
- Any score must be explainable.
- Any score must be based only on allowlisted signals.
- Confidence explanations must be bounded and must not include raw evidence snippets or raw payloads.

Examples of allowlisted signals may include presence of a safe candidate website URL, presence of a bounded candidate name, category hint confidence, pricing hint confidence, app/social link availability, and duplicate ambiguity flags. Those signals must remain advisory and review-only.

## 12. Duplicate detection expectations

Future candidate extraction must not assume that a staged candidate is unique.

Required duplicate checks before any candidate becomes reviewable:

- canonical URL/domain check;
- normalized name check;
- existing `tools` check;
- existing `discovered_tools` check if that table is used by the future staging design;
- staging duplicate check;
- duplicate signal storage for admin review.

Later optional checks:

- fuzzy name similarity;
- brand alias handling;
- redirect-aware domain comparison;
- app-store and social-profile overlap checks.

Duplicate results must block auto-promotion. They may inform admin review, but they must not resolve or merge candidates automatically in this phase.

This document does not implement duplicate detection.

## 13. Human review requirements

All extracted candidates must require admin review.

Human review requirements:

- Admin review must be mandatory before any candidate can move forward.
- Admin review must be separate from public publishing.
- Admins should see safe evidence summary, confidence, risk flags, and duplicate signals.
- Admins must not see raw HTML, raw metadata, raw stats, raw audit rows, raw JSON dumps, headers, cookies, secrets, stack traces, transport payloads, or unsafe snippets.
- Admin UI must clearly label staged candidates as unverified.
- Approval and publishing must remain separate future phases.
- Review notes, if implemented, must be bounded and safe.

Admin review can decide whether a staged candidate deserves further handling. It must not itself publish to `public.tools` unless a later approval/publish workflow is explicitly designed and approved.

## 14. Audit event requirements

Future extraction should emit safe audit events for:

- extraction started;
- source evidence normalized;
- candidate staged;
- candidate rejected by normalizer;
- duplicate suspected;
- human review status changed;
- extraction completed;
- extraction failed safely.

Audit event requirements:

- Audit metadata must be fixed-shape and allowlisted.
- Audit metadata must not contain raw HTML.
- Audit metadata must not contain raw visible text or snippets.
- Audit metadata must not contain raw candidate payloads.
- Audit metadata must not contain raw parser output.
- Audit metadata must not contain headers, cookies, secrets, stacks, transport payloads, LLM prompts, or LLM responses.
- Audit events should include bounded run IDs, staging IDs, safe status labels, failure categories, and safety flags only.

Audit events are operational records. They are not candidate evidence, approval evidence, publish evidence, ranking evidence, or recommendation evidence.

## 15. LLM / no-LLM decision boundary

Phase 8E does not decide to use LLM extraction.

The first candidate extraction phase may be deterministic or rule-based. That decision should be made in a future reviewed phase.

Any LLM-assisted extraction requires a separate design covering:

- Gemini review before implementation;
- prompt and payload redaction rules;
- strict input minimization;
- no raw HTML persistence;
- output schema validation;
- hostile-output handling;
- hallucination and attribution risk;
- token and cost logging;
- failure handling;
- retry limits;
- audit events;
- human review;
- staging-only output.

LLM output must be treated as untrusted. It must never write directly to `public.tools`, auto-approve a tool, auto-publish a tool, bypass duplicate review, or bypass admin review.

## 16. API and UI boundaries

Future candidate extraction API/UI work must remain separate from the existing static evidence review and audit timeline unless a later implementation plan explicitly approves integration points.

API boundaries:

- Do not expose raw evidence, raw stats, raw metadata, raw audit rows, or raw JSON dumps.
- Do not expose candidate staging objects outside authenticated admin routes.
- Do not add public candidate APIs.
- Do not add approval or publish routes as part of extraction.
- Do not return unknown fields.
- Do not return raw parser output.
- Keep mutation routes CSRF/admin-session protected if a future phase adds them.

UI boundaries:

- Staged candidates must be labeled as unverified.
- UI must not render raw HTML, raw evidence, raw metadata, raw stats, raw audit rows, or raw JSON.
- UI must not use `dangerouslySetInnerHTML`.
- UI must not add public publishing controls.
- UI must not add ranking or recommendation controls.
- UI must not add duplicate-resolution controls unless a future duplicate phase approves them.
- UI must not add LLM action controls unless a future LLM phase approves them.
- UI must preserve safe evidence and audit visibility as review context only.

## 17. Database and schema considerations

Phase 8E does not choose a final storage design.

Future Phase 8F should decide whether candidate staging should use:

- existing `discovered_tools`;
- a new dedicated staging table;
- a JSONB staging artifact attached to `discovery_runs`;
- another reviewed design.

Schema decision considerations:

- staging-only records must not be public tool records;
- storage must preserve admin-only access boundaries;
- storage must support duplicate checks;
- storage must support auditability;
- storage must support rejection and review status without implying publication;
- storage must support retention/cleanup decisions;
- storage must not require raw HTML retention;
- storage must not preserve raw parser output or raw evidence dumps;
- schema changes, migrations, RLS, indexes, policies, and generated types require separate review and approval.

No Supabase schema, migration, RLS, index, policy, or generated type change is authorized by this document.

## 18. Smoke-test planning requirements

Candidate extraction must have a separate smoke-test plan before execution.

The smoke-test plan should define:

- an approved local/admin-only execution path;
- a low-risk reviewed URL;
- how to create or reuse source evidence safely;
- whether extraction is deterministic or otherwise separately approved;
- exact expected staging writes;
- exact forbidden writes to `public.tools`;
- exact forbidden auto-approval and auto-publish behavior;
- duplicate negative checks;
- unsafe-data scans for staged records, audit events, and UI;
- candidate/public-tool negative checks;
- admin UI assertions;
- desktop/tablet/mobile QA;
- cleanup or retention guidance;
- rollback guidance;
- CCR reporting requirements.

The smoke test must not be executed until a separate phase approves it.

## 19. Required Gemini review gates

Gemini review is required before candidate extraction implementation.

Review gates:

- staging-only principle;
- final staging storage decision;
- candidate field allowlist;
- normalization rules;
- unsafe-data redaction rules;
- duplicate detection expectations;
- confidence/scoring boundaries;
- human-review requirements;
- audit event contract;
- LLM / no-LLM decision boundary;
- API and UI boundaries;
- smoke-test plan;
- rollback plan;
- CCR reporting requirements.

Gemini review is also required before expanding the allowlist, adding LLM assistance, adding duplicate workflow behavior, adding approval/publish behavior, writing to `discovered_tools`, or creating any path toward `public.tools`.

## 20. Implementation blockers

Candidate extraction implementation remains blocked until:

- Phase 8F decides the staging storage approach;
- candidate field allowlist is approved;
- normalization and rejection behavior is approved;
- duplicate safety requirements are approved;
- confidence/scoring boundaries are approved;
- audit event contract is approved;
- human-review workflow boundary is approved;
- LLM/no-LLM decision is approved;
- API/UI implementation plan is approved;
- smoke-test plan is approved;
- Gemini review is complete;
- James approves moving from planning to implementation.

Until these blockers are cleared, extraction must not create candidates, write `discovered_tools`, write `public.tools`, approve tools, publish tools, or run duplicate/ranking/recommendation/LLM behavior.

## 21. Recommended next phase after this document

Recommended next phase:

**Phase 8F — Candidate Extraction Contract Review / Schema Decision Plan**

Reason:

Before implementation, the project should decide whether future staging should use:

- existing `discovered_tools`;
- a new dedicated staging table;
- a JSONB staging artifact attached to `discovery_runs`;
- another reviewed design.

Phase 8F should choose the storage direction, review the staging contract against the selected storage model, define migration/RLS implications if any, and determine whether a later implementation phase can proceed safely.

Phase 8E intentionally does not pick the final schema.

## 22. Final conclusion

Candidate extraction is not implementation-ready.

AiFinder now has the safe upstream capability needed to begin extraction planning: bounded static acquisition, static-derived evidence, admin review, and audit visibility. However, candidate extraction remains blocked until the project approves a staging-only contract, final storage design, field allowlist, normalization rules, redaction rules, duplicate expectations, confidence boundaries, human-review requirements, audit requirements, LLM/no-LLM boundary, Gemini review, and a separate smoke-test plan.

The safest next step is **Phase 8F — Candidate Extraction Contract Review / Schema Decision Plan**. No extraction implementation, candidate creation, `discovered_tools` writes, `public.tools` writes, approval/publish behavior, duplicate workflow, ranking/recommendation, LLM interpretation, automation, or schema change is authorized by Phase 8E.
