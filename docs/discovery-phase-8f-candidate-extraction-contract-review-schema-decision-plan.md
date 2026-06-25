# Phase 8F — Candidate Extraction Contract Review / Schema Decision Plan

## Status / Scope

Phase 8F is a docs-only planning phase for the AiFinder Discovery Engine.

This phase evaluates the safest future storage path for candidate extraction staging before any extraction code exists. It authorizes no source code, UI, API, schema, migration, generated type, RLS, index, policy, automation, duplicate detection, approval, publish, ranking, recommendation, LLM, scheduler, cron, crawler, browser automation, or data-write behavior.

Phase 8F decision:

- Preferred future storage direction: a new dedicated candidate staging table, subject to Gemini and James approval in a later implementation phase.
- Candidate extraction status after Phase 8F: not implementation-ready.
- Direct `public.tools` writes: still forbidden.
- Existing static evidence safety boundaries: preserved.

## Background

Phase 8D closed the static evidence plus audit timeline capability track for the current prototype scope. AiFinder now has bounded in-memory static HTML acquisition, static-derived evidence, admin review, and operational audit timeline visibility.

Phase 8E established the candidate extraction readiness gate and staging contract design. It confirmed that candidate extraction is not implemented and not implementation-ready. It also required Phase 8F to decide whether future staging should use:

- existing `discovered_tools`;
- a new dedicated staging table;
- a JSONB staging artifact attached to `discovery_runs`;
- another reviewed design.

The existing Discovery Engine schema already includes `discovery_runs`, `discovered_tools`, `discovery_evidence`, `discovery_duplicate_candidates`, and `discovery_audit_events`. Existing `discovered_tools` is documented as the Discovery Queue for tools awaiting admin triage and already has approval, rejection, duplicate, and public-tool linkage fields. That makes it useful for later reviewed queue workflows, but risky as the first storage layer for unverified extraction output.

## Non-goals

Phase 8F does not:

- implement extraction;
- add or modify source code;
- add UI or API behavior;
- add schema, migration, RLS, index, policy, or generated type changes;
- create candidates;
- write to `discovered_tools`;
- write to `public.tools`;
- run duplicate detection;
- add approval or publish behavior;
- add ranking or recommendation behavior;
- add LLM/AI interpretation;
- add automation, scheduler, cron, crawler, worker, or browser automation;
- expose or store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

## Current Constraints

Current constraints carried forward from Phases 8D and 8E:

- Static evidence plus audit timeline is closed for current prototype scope.
- Candidate extraction is not implemented.
- Candidate extraction is not implementation-ready.
- No candidates are created by the static evidence track.
- No `discovered_tools` writes are performed by the static evidence track.
- No `public.tools` writes are performed by the static evidence track.
- No approval/publish behavior exists in the static evidence track.
- No LLM interpretation exists in the static evidence track.
- No automation/scheduler/cron/browser automation exists in this track.
- Raw HTML is not persisted or rendered.
- Static-derived evidence is tentative and human-review-only.
- Audit timeline records are operational/safety records, not candidate evidence and not approval evidence.

Future candidate extraction storage must preserve:

- staging-only output;
- admin-only access;
- human review before any promotion;
- duplicate safety before any candidate becomes reviewable;
- safe audit events;
- no raw evidence or raw extraction payload storage;
- no direct public publishing path.

## Storage Options Compared

| Option | Summary | Strengths | Main risks | Phase 8F decision |
| --- | --- | --- | --- | --- |
| Existing `discovered_tools` | Reuse the current Discovery Queue table. | Existing queue semantics, indexes, duplicate linkage, approval linkage, admin workflow concepts. | Blurs raw extraction staging with review queue; existing approval/public-tool fields increase accidental promotion risk; `raw_payload` is a safety footgun; harder to enforce extraction-only staging. | Not preferred as first extraction staging layer. |
| Dedicated candidate staging table | Add a future table specifically for unverified extraction candidates. | Clearest separation; staging-only lifecycle; safer RLS; better audit linkage; easier cleanup; no public-tool semantics. | Requires reviewed migration, RLS, generated types, API/UI work, tests, and retention policy. | Preferred future direction, subject to Gemini/James approval. |
| JSONB staging artifact on `discovery_runs` | Store extracted candidate artifacts inside run-level JSONB. | Fewer tables; simple attachment to run record; useful for tiny prototypes. | Poor indexing/review; awkward for multiple candidates; weak duplicate workflow; bloats run stats; harder cleanup; higher raw payload leakage risk. | Not preferred. |
| Alternative reviewed design | Hybrid or phased design, such as dedicated staging plus later promotion to `discovered_tools`. | Can preserve separation while reusing existing queue later. | More moving parts; needs explicit lifecycle and migration review. | Acceptable only if separately reviewed and safer than direct table reuse. |

## Option 1: Existing `discovered_tools`

Using existing `discovered_tools` would mean treating extracted candidates as Discovery Queue records immediately.

Benefits:

- Existing schema already represents discovered tool candidates.
- Existing fields cover name, description, website, canonical URL, normalized domain, category, pricing, platforms, status, duplicate links, review fields, and approved public-tool linkage.
- Existing duplicate candidate table references `discovered_tools`.
- Existing approval pathway is already oriented around promotion from `discovered_tools` to `public.tools`.
- Existing indexes support URL/domain/name/status review patterns.

Risks:

- It collapses extraction staging and Discovery Queue triage into one layer.
- Existing statuses include `approved`, `rejected`, `ignored`, and `duplicate`, which are more advanced than first-pass extraction staging.
- Existing `approved_tool_id`, `duplicate_of_tool_id`, and approval RPC semantics can make staged extraction records feel closer to public-tool promotion than they should be.
- Existing `raw_payload` creates a storage surface that future extraction could misuse for raw or semi-raw payloads unless tightly prohibited.
- It is harder to express that extracted candidates are unverified, pre-review, and not yet queue-ready.
- Rollback and cleanup could affect real Discovery Queue records if staging and reviewed queue records share one table.

Assessment:

`discovered_tools` should remain a later reviewed queue or promotion target, not the first landing zone for static-derived extraction output. A future workflow may promote a safe, reviewed staging record into `discovered_tools`, but only after a separate phase defines duplicate checks, audit requirements, and admin review behavior.

## Option 2: Dedicated Candidate Staging Table

A dedicated candidate staging table would be a future admin-only table for unverified extraction results.

Conceptual table role:

- store only safe, normalized, allowlisted candidate staging fields;
- link staged records to `discovery_runs`, source URLs, and extraction mode;
- preserve staging-only review status;
- record confidence and risk flags as advisory values only;
- support duplicate-signal review without resolving duplicates automatically;
- support cleanup/retention without touching public tools or reviewed Discovery Queue records.

Benefits:

- Cleanest separation between extraction staging, Discovery Queue triage, and public tools.
- Lower risk of accidental approval/publish behavior because the table has no public-tool insertion semantics.
- RLS can be admin-only and deny-by-default from the start.
- Schema can exclude unsafe catch-all raw payload columns.
- Review statuses can be staging-specific, such as `staged`, `needs_review`, `rejected_by_normalizer`, `duplicate_suspected`, `discarded`, or `promoted_to_discovery_queue` if approved later.
- Duplicate signals can be modeled without writing `discovery_duplicate_candidates` until a later duplicate phase approves that path.
- Audit events can distinguish extraction staging from Discovery Queue approval.
- Cleanup can remove or archive staging records without affecting `discovered_tools` or `public.tools`.

Risks:

- Requires a new reviewed migration.
- Requires RLS/policy design and verification.
- Requires generated type updates if the project uses generated Supabase types for the table.
- Requires future API and UI implementation.
- Requires future retention/cleanup design.
- Requires explicit promotion rules if records can later move to `discovered_tools`.
- Adds another lifecycle state that admins must understand.

Assessment:

This is the preferred future direction because candidate extraction needs reviewable, auditable, non-public, non-approved staging records. The separation is worth the migration cost because it reduces accidental public-tool promotion, raw-payload leakage, and lifecycle ambiguity.

Phase 8F does not create this table. It recommends this direction for a later Gemini-approved schema and implementation plan.

## Option 3: JSONB Staging Artifact on `discovery_runs`

This option would attach extracted candidate artifacts to `discovery_runs`, likely inside a new or existing JSONB field.

Benefits:

- Keeps extraction artifacts close to the run that produced them.
- Avoids a separate table in the smallest conceptual prototype.
- Can work for a single-run, single-artifact proof of concept if no review workflow is needed.

Risks:

- Poor fit for reviewable candidate records.
- Multiple candidates per run become awkward to index, filter, review, and clean up.
- Duplicate checks against JSONB artifacts are weaker and more complex.
- Retention becomes tied to run retention, which may not match candidate-review retention.
- Run stats can become bloated or semantically overloaded.
- JSONB artifacts increase risk of raw evidence, parser dumps, or unsafe unknown fields being retained.
- Admin UI and API would need additional normalization anyway, reducing the benefit of avoiding a table.
- Audit and lifecycle transitions become harder to model safely.

Assessment:

JSONB attached to `discovery_runs` is not preferred for candidate staging. It may remain useful for bounded operational run stats or summary safety flags, but not for future reviewable candidate records.

## Option 4: Alternative Reviewed Design

An alternative reviewed design could be considered if Gemini or James identifies a safer approach.

Possible alternatives:

- a two-layer design with a dedicated extraction artifact table plus a candidate staging table;
- a dedicated staging table plus a read-only admin view for review;
- a staging table that can later promote to `discovered_tools` only through an audited admin action;
- a temporary staging table with strict TTL and no promotion path until duplicate policy is implemented.

Requirements for any alternative:

- staging-only records;
- no direct `public.tools` writes;
- no auto-approval;
- no auto-publish;
- no raw payload storage;
- admin-only access;
- deny-by-default RLS;
- explicit audit event model;
- duplicate safety;
- human review;
- Gemini approval before implementation.

Assessment:

Alternative designs remain open, but they must preserve the same separation and safety properties as the dedicated staging table. An alternative that reintroduces direct public-tool writes, raw-payload storage, or auto-promotion should be rejected.

## Preferred Direction

Preferred future storage direction:

**A new dedicated candidate staging table.**

Rationale:

- Candidate extraction output is unverified and should not immediately become a Discovery Queue record.
- Staged candidates need a lifecycle distinct from `discovered_tools` and `public.tools`.
- Public-tool approval should remain a separate human-admin workflow.
- A dedicated table can be designed without approval fields, publish fields, or raw payload fields.
- A dedicated table gives duplicate detection, audit, review, and cleanup a safer boundary.
- A dedicated table supports future promotion to `discovered_tools` only if a later phase explicitly approves that transition.

Preferred lifecycle:

```text
static evidence -> extraction normalizer -> candidate staging table -> admin review -> duplicate-safe promotion decision -> discovered_tools or discard -> separate public-tool approval flow
```

This lifecycle is conceptual only. It is not implemented or authorized by Phase 8F.

## Security and RLS Implications

Future dedicated staging storage should follow the existing Discovery Engine hardening posture:

- RLS enabled.
- Access revoked from `anon` and `authenticated`.
- Deny-by-default policy.
- Server-side admin routes only.
- Admin session checks.
- CSRF protection for future mutations.
- No public read path.
- No client-side direct Supabase access.
- No raw HTML, raw metadata, raw stats, raw JSON dumps, snippets, headers, cookies, secrets, stacks, transport payloads, candidate payload dumps, public-tool payload dumps, or LLM prompt/response payloads.

RLS implications by option:

- Existing `discovered_tools`: inherits admin-only posture, but its approval-linked lifecycle increases semantic risk.
- Dedicated staging table: requires new RLS design, but can be minimal and staging-only from day one.
- JSONB on `discovery_runs`: inherits `discovery_runs` RLS, but makes field-level safety harder because candidate artifacts share run storage.
- Alternative design: must be reviewed against the same deny-by-default and admin-only requirements.

The preferred dedicated table should not include a generic unsafe `raw_payload` field. If a future metadata/artifact field is proposed, it must be bounded, allowlisted, and separately reviewed.

## Admin Review Implications

Future admin review should treat staged candidates as unverified extraction output.

Admin UI requirements for future implementation:

- show staged candidates separately from approved public tools;
- clearly label records as unverified and staging-only;
- show safe evidence summary, confidence, risk flags, duplicate signals, and audit status;
- hide raw HTML, raw metadata, raw stats, raw audit rows, raw JSON dumps, snippets, headers, cookies, secrets, stack traces, transport payloads, candidate payload dumps, public-tool payload dumps, and LLM prompts/responses;
- provide no public publish action in the extraction staging UI;
- provide no auto-approval behavior;
- preserve separate human approval flow for any later public-tool creation.

The current static evidence results panel and audit timeline should remain review context. They should not become candidate approval evidence without a future approved candidate review design.

## Audit Requirements

Future extraction staging should emit safe audit events for:

- extraction started;
- source evidence normalized;
- staging record created;
- staging record rejected by normalizer;
- duplicate suspected;
- staging review status changed;
- promotion to `discovered_tools` requested or completed, if a later phase approves promotion;
- staging record discarded;
- extraction completed;
- extraction failed safely.

Audit metadata must be fixed-shape and allowlisted.

Audit metadata must not include:

- raw HTML;
- raw visible text;
- snippets;
- raw metadata;
- raw stats;
- raw audit rows;
- raw JSON dumps;
- headers;
- cookies;
- secrets;
- stack traces;
- transport payloads;
- raw candidate payloads;
- discovered/public tool payload dumps;
- LLM prompts or responses.

Audit events should identify safe IDs, safe status labels, extraction mode, bounded failure categories, duplicate-signal categories, and safety flags only.

## Duplicate Detection Implications

A dedicated staging table supports duplicate safety better than JSONB and more safely than immediate `discovered_tools` insertion.

Required future duplicate checks before a staged candidate can be promoted or treated as reviewable:

- canonical URL/domain check;
- normalized candidate website check;
- normalized name check;
- existing `public.tools` check;
- existing `discovered_tools` check;
- candidate staging table duplicate check;
- duplicate signal recording for admin review.

Optional later checks:

- fuzzy name similarity;
- app-store link overlap;
- social link overlap;
- redirect-aware domain comparison;
- brand alias handling.

Duplicate detection must block auto-promotion. It may produce review context, but it must not automatically approve, publish, merge, rank, or recommend records.

Phase 8F does not implement duplicate detection.

## Rollback and Cleanup Strategy

Preferred dedicated staging table rollback posture:

- Because staged candidates would be separate from `public.tools`, rollback should not require public-tool cleanup.
- Because staged candidates would be separate from `discovered_tools`, rollback should not affect reviewed Discovery Queue records.
- Future cleanup can target exact staging records by ID, source run, extraction mode, or retention policy.
- Future cleanup must be dry-run/report-first before destructive behavior.
- Future cleanup must not remove unrelated `discovery_runs`, `discovery_audit_events`, `discovered_tools`, `discovery_duplicate_candidates`, or `public.tools`.

Rollback implications by option:

- Existing `discovered_tools`: cleanup risks overlapping real queue records and approval state.
- Dedicated staging table: clearest cleanup boundary.
- JSONB on `discovery_runs`: cleanup is tied to run mutation and may affect run history.
- Alternative design: must prove rollback isolation before implementation.

No cleanup tool or destructive operation is authorized by Phase 8F.

## Migration Risks

The preferred dedicated staging table requires a future migration if approved.

Migration risks:

- RLS or grants could be misconfigured.
- Generated types could drift if not updated.
- Indexes could be insufficient for duplicate checks.
- Constraints could be too permissive and allow unsafe payloads.
- Constraints could be too strict and block legitimate staging records.
- Foreign-key behavior could accidentally cascade-delete audit or review history.
- Review status values could imply approval or publication if named poorly.
- A generic JSONB payload column could reintroduce raw evidence risk.

Future migration planning should include:

- exact table name proposal;
- exact column allowlist;
- no generic raw payload column unless separately approved with strict constraints;
- status enum/check constraints with staging-only names;
- foreign keys to `discovery_runs` and possibly `discovery_sources`;
- indexes for source run, normalized domain, candidate website, candidate name, status, and created timestamp;
- deny-by-default RLS;
- grants revoked from public roles;
- rollback SQL;
- generated type update plan;
- migration dry review;
- Gemini approval before applying.

Phase 8F creates no migration and changes no schema.

## Direct `public.tools` Write Prohibition

Direct `public.tools` writes remain forbidden.

Reasons:

- `public.tools` is the public, human-approved tool catalog.
- Static-derived extraction evidence is tentative and unverified.
- Staged candidates may be duplicates, low confidence, malformed, irrelevant, unsafe, or incomplete.
- Public tool creation requires stronger validation, duplicate checks, admin approval, auditability, and rollback posture.
- Direct writes would bypass the existing Project AiFinder Security and admin approval model.

Required rule:

No future extraction workflow may insert, update, approve, publish, rank, recommend, or otherwise promote a record into `public.tools` without a separate reviewed human approval/publish phase.

## Required Gemini Gates Before Implementation

Gemini review is required before any implementation, migration, API, UI, or automation work.

Required Gemini gates:

- staging table vs alternative storage decision;
- exact schema proposal;
- RLS and grant design;
- migration and rollback SQL;
- generated type update plan;
- candidate field allowlist;
- normalization and rejection rules;
- unsafe-data redaction rules;
- duplicate detection expectations;
- audit event contract;
- human review workflow;
- direct `public.tools` write prohibition;
- LLM/no-LLM decision;
- API route plan;
- admin UI plan;
- smoke-test plan;
- cleanup/retention policy.

Gemini approval is also required before any future work writes to `discovered_tools`, creates duplicate candidates, adds approval/publish behavior, uses LLM extraction, or introduces automation.

## Final Phase 8F Decision Summary

Phase 8F recommends a **new dedicated candidate staging table** as the safest future storage direction for candidate extraction staging.

Decision summary:

- Existing `discovered_tools` is not preferred as the first extraction staging layer because it already carries Discovery Queue, duplicate, approval, and public-tool linkage semantics.
- JSONB staging on `discovery_runs` is not preferred because it is weak for review, indexing, duplicate checks, lifecycle management, cleanup, and raw-payload prevention.
- Alternative designs remain possible only if they preserve staging-only separation, admin-only access, safe auditability, duplicate safety, human review, and no public-tool write path.
- A dedicated candidate staging table best supports reviewable, auditable, non-public, non-approved extraction output.

Candidate extraction remains **not implementation-ready** after Phase 8F.

Phase 8F authorizes no code, schema, migration, API, UI, duplicate, approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, browser automation, candidate creation, `discovered_tools` write, or `public.tools` write.

The next safe step is Gemini review of this decision plan, followed by a separate implementation-plan phase only if James approves moving forward.
