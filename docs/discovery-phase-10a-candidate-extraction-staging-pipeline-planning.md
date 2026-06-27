# Phase 10A — Candidate Extraction Staging Pipeline Planning

## 1. Phase scope

Phase 10A is a docs-only planning phase for the future Candidate Extraction Staging Pipeline.

This phase does not implement candidate extraction, crawler automation, LLM behavior, API routes, UI integration, database writes, migrations, Supabase type generation, smoke script changes, helper changes, or test changes.

The goal is to define the safest next pipeline boundary now that candidate staging has been validated across schema, generated types, helper mapping, RLS denial, direct `discovery_source_id` persistence, and exact-ID smoke cleanup.

## 2. Current staging readiness summary

Candidate staging is now ready for extraction-pipeline planning because the following prerequisites are complete:

- Phase 8X implemented `stageNormalizedDiscoveryCandidate(...)` and mocked staging behavior.
- Phase 9N applied the schema expansion and regenerated Supabase types.
- `public.discovery_candidate_tools.discovery_source_id` now exists as a nullable UUID column with a foreign key to `public.discovery_sources(id)`.
- Generated Supabase types include `discovery_source_id` and the `discovery_candidate_tools_discovery_source_id_fkey` relationship.
- Phase 9P updated the staging helper so `StageNormalizedDiscoveryCandidateInput.discoverySourceId` is persisted as `discovery_source_id`.
- Mocked candidate staging tests assert `discovery_source_id` persistence, `candidate_status = "staged"`, `discovery_run_id` mapping, and `audit_correlation_id` pass-through.
- Phase 9S executed the post-schema RLS smoke once with explicit approval.
- Phase 9S verified service-role readback of `discovery_source_id === sourceId`.
- Phase 9S verified anonymous/public RLS denial for exact-ID, list, and guessed exact-ID reads.
- Phase 9S verified no payload leakage and exact-ID cleanup for the smoke candidate, run, and source fixtures.

Extraction implementation remains deferred. Phase 10A only defines the planning boundary for how a future extraction pipeline should call the validated staging path.

## 3. Existing design context inspected

Phase 10A reviewed the existing staging and acquisition design work:

- Phase 8E established the candidate extraction readiness gate and the staging-only principle.
- Phase 8J defined the candidate lifecycle and normalization contract for safe staged candidates.
- Phase 7J defined future acquisition policy, including bounded acquisition, no raw-content retention by default, and no LLM approval.
- Phase 7O defined a bounded in-memory HTML acquisition contract with no raw HTML logging or storage.
- Phase 9N documented schema/type readiness after adding `discovery_source_id`.
- Phase 9O planned the helper mapping update.
- Phase 9S documented the successful post-schema RLS/source-lineage smoke.
- `lib/discovery-candidate-normalizer.ts` defines the current safe normalized candidate insert shape.
- `lib/discovery/discovery-candidate-staging-admin.ts` defines the admin-only staging helper boundary.
- `testing/discovery-candidate-staging-admin.test.mjs` verifies the mocked helper behavior.

The recurring design constraint is unchanged: extraction may produce reviewable staged candidates only. It must not approve, publish, rank, recommend, or write public tool records.

## 4. Candidate Extraction Staging Pipeline objective

The future Candidate Extraction Staging Pipeline should transform approved, bounded discovery inputs into normalized candidate staging inputs and call:

```ts
stageNormalizedDiscoveryCandidate(...)
```

The pipeline objective is:

- accept only approved discovery source/run context;
- consume bounded acquisition/evidence handoff output;
- normalize candidate fields into the existing safe normalized candidate contract;
- call the admin-only staging helper exactly at the staging boundary;
- write only to `public.discovery_candidate_tools`;
- preserve source lineage through `discovery_source_id`;
- preserve run lineage through `discovery_run_id`;
- keep `candidate_status = "staged"`;
- preserve `audit_correlation_id`;
- keep duplicate handling advisory only;
- leave all review, approval, publishing, and ranking decisions to later admin workflows.

## 5. Strict non-goals

The future pipeline planning must preserve these non-goals unless a later phase explicitly changes them:

- no public tool creation;
- no direct writes to `public.tools`;
- no writes to `discovered_tools`;
- no approval, promotion, publishing, ranking, or recommendation behavior;
- no admin UI integration yet;
- no public UI integration yet;
- no API route integration yet;
- no crawler automation yet;
- no scheduled/cron execution yet;
- no browser automation or screenshot capture yet;
- no LLM execution unless separately planned, reviewed, and approved;
- no audit event writes until audit write design is separately reviewed;
- no raw HTML, screenshot, prompt, response body, or source blob persistence in candidate rows.

## 6. Proposed future pipeline stages

The future implementation should be split into small stages rather than one broad extraction feature.

### Stage 1 — Source and run selection

The pipeline should start with an approved `discovery_sources` row and an approved `discovery_runs` row.

Requirements:

- `discoverySourceId` must come from a trusted server-side source selection path.
- `discoveryRunId` must come from a trusted run context.
- IDs must be trimmed and validated before staging.
- The pipeline must not accept anonymous or user-supplied source/run IDs without server-side authorization.
- The selected run/source relationship should be validated or carried from a trusted orchestration layer.

### Stage 2 — Bounded input acquisition handoff

The extraction pipeline should consume bounded evidence from a separately approved acquisition path.

Initial recommended boundary:

- static metadata or static HTML-derived evidence only;
- bounded size and bounded field count;
- no raw HTML stored in candidate rows;
- no raw body, cookies, headers, secrets, screenshots, or prompt material in logs or persisted metadata;
- no LLM interpretation in the initial pipeline.

If bounded HTML acquisition is used later, it should follow the Phase 7O contract and remain in-memory for immediate derivation only unless a separate retention design is approved.

### Stage 3 — Normalization and validation

The pipeline should normalize acquisition output through the existing safe normalized candidate model.

The normalization step should:

- require a safe candidate name;
- require a valid HTTPS candidate website URL;
- canonicalize URL/domain fields within existing normalizer boundaries;
- enforce category hints against the approved category taxonomy;
- enforce pricing hints against supported values;
- bound descriptions, evidence summaries, arrays, flags, and locator fields;
- reject unsafe content such as HTML snippets, stack traces, secrets, raw JSON dumps, or prompt-injection text;
- assign or preserve a valid `audit_correlation_id`;
- keep `candidate_status = "staged"`.

### Stage 4 — Duplicate preflight and advisory handling

Duplicate handling should remain advisory.

The pipeline may carry existing duplicate advisory fields only if they are produced by separately approved duplicate checks:

- `duplicate_check_status`;
- `duplicate_signal_types`;
- `duplicate_blocking`;
- `possible_duplicate_tool_id`;
- `possible_duplicate_discovered_tool_id`;
- `possible_duplicate_candidate_id`.

Duplicate hints must not auto-approve, auto-reject, auto-publish, or block human review unless a later duplicate workflow phase explicitly approves that behavior.

### Stage 5 — Staging helper call

The pipeline should call `stageNormalizedDiscoveryCandidate(...)` with:

- `discoveryRunId`;
- `discoverySourceId`;
- `normalizedCandidate`;
- optional `actorId` only if a future orchestration path has an approved actor model.

The helper remains the single write boundary for `public.discovery_candidate_tools`.

The helper must continue to:

- validate non-empty `discoveryRunId`;
- validate non-empty `discoverySourceId`;
- validate the normalized candidate shape;
- require `audit_correlation_id`;
- insert `discovery_source_id: input.discoverySourceId.trim()`;
- force `candidate_status: "staged"`;
- avoid audit event writes;
- avoid `public.tools` and `discovered_tools`.

### Stage 6 — Result capture

The future pipeline should capture only safe staging results:

- staged candidate ID;
- staged status;
- run ID;
- source ID;
- audit correlation ID;
- safe error category if staging fails.

Logs must not include full candidate payloads, raw acquisition output, raw Supabase errors, secrets, source blobs, or raw HTML.

### Stage 7 — Cleanup and failure handling

Extraction pipeline cleanup must be deterministic and conservative.

For mocked/local implementation, cleanup is not needed because no DB rows are created.

For any future live smoke:

- create exact fixture source/run/candidate rows only if approved;
- clean up by exact IDs only;
- do not clean up by date, status, domain, marker, or broad filters;
- never clean up from `public.tools`;
- never clean up from `discovered_tools`;
- report exact IDs, marker, and `audit_correlation_id` if cleanup fails.

### Stage 8 — Audit compatibility placeholder

Audit action compatibility exists at the schema-constraint level, but audit writes remain deferred.

The expanded audit action values are:

- `candidate-staged`;
- `candidate-stage-failed`;
- `candidate-duplicate-hint-recorded`;
- `candidate-cleanup-performed`.

The extraction pipeline must not write audit events until a separate audit write design decides:

- whether the staging helper or outer orchestration writes audit events;
- whether audit writes are transactional with candidate insertion;
- what metadata is safe and bounded;
- how actor identity is represented;
- how audit failures affect staging outcomes.

## 7. Proposed normalized candidate input contract

The future extraction mapper should produce the existing `StageNormalizedDiscoveryCandidateInput` shape:

```ts
type StageNormalizedDiscoveryCandidateInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  normalizedCandidate: NormalizedDiscoveryCandidate;
  actorId?: string | null;
};
```

### Required pipeline-level inputs

The pipeline must provide:

- `discoveryRunId`: trusted discovery run UUID;
- `discoverySourceId`: trusted discovery source UUID;
- `normalizedCandidate.discovery_run_id`: same trimmed run UUID;
- `normalizedCandidate.audit_correlation_id`: valid audit correlation UUID;
- `normalizedCandidate.candidate_status`: `"staged"`;
- `normalizedCandidate.source_evidence_kind`: `"static_html_derived_evidence"`;
- `normalizedCandidate.extraction_mode`: `"deterministic_static_evidence"`.

### Required normalized candidate fields

Based on the current normalizer/staging helper, a staged candidate should include:

- `source_url`;
- `source_url_normalized`;
- `source_domain`;
- `source_evidence_kind`;
- `extraction_mode`;
- `extraction_version`;
- `candidate_name`;
- `candidate_website_url`;
- `candidate_canonical_url`;
- `candidate_normalized_domain`;
- `candidate_status`;
- `cleanup_status`;
- `audit_correlation_id`.

### Optional normalized candidate fields already supported

The mapper may populate these when safely derived and bounded:

- `source_evidence_locator`;
- `candidate_description`;
- `candidate_category_hint`;
- `candidate_pricing_hint`;
- `candidate_platform_hints`;
- `candidate_social_links`;
- `candidate_app_links`;
- `evidence_summary`;
- `confidence_bucket`;
- `risk_flags`;
- duplicate advisory fields.

### Fields that must remain controlled by staging rules

The pipeline should not let extraction output directly control review or cleanup state.

These should remain fixed by normalizer/helper behavior:

- `reviewed_at: null`;
- `reviewed_by: null`;
- `review_notes: null`;
- `rejection_reason_code: null`;
- `cleanup_status: "active"`;
- `eligible_for_cleanup_at: null`;
- `archived_at: null`;
- `duplicate_checked_at: null` unless a later duplicate-check phase owns this value.

### Unsupported payloads

The mapper must not pass through or persist:

- raw HTML;
- screenshots;
- prompt text;
- model responses;
- full source blobs;
- cookies;
- headers;
- API keys;
- stack traces;
- raw DB errors;
- arbitrary JSON dumps;
- public/discovered tool payloads.

## 8. Source accountability requirements

Every future staged candidate created by extraction must have source lineage.

Requirements:

- `StageNormalizedDiscoveryCandidateInput.discoverySourceId` is required.
- `discovery_candidate_tools.discovery_source_id` must be populated through the helper.
- `discoveryRunId` and `discoverySourceId` must come from approved discovery records.
- The pipeline must not trust anonymous, public, or client-supplied source IDs.
- IDs must be trimmed before staging.
- Missing or blank IDs must fail closed before any DB client or write operation.
- Logs and result records should include safe IDs only when useful for operational traceability.

The current database column is nullable for migration safety, but the helper boundary remains stricter: extraction-originated staged candidates should always provide a source ID.

## 9. Safety and validation requirements

Future extraction implementation must preserve the existing normalizer boundaries:

- require HTTPS candidate URLs;
- canonicalize URLs and remove tracking parameters within the existing normalizer policy;
- enforce max URL/domain/name/text/array limits;
- validate categories against the project taxonomy;
- validate pricing hints against supported values;
- reject unsafe text and prompt-injection patterns;
- reject stack traces, secrets, raw JSON objects, cookies, authorization headers, and API-key-like strings;
- keep evidence summary bounded and human-review oriented;
- log safe categories and IDs only;
- produce deterministic failure codes;
- avoid raw payload leaks in thrown errors, logs, audit metadata, docs, and test output.

The initial extraction pipeline should remain deterministic and no-LLM. Any LLM-assisted extraction requires a separate threat model, prompt-injection strategy, payload-retention policy, and Gemini-approved implementation plan.

## 10. Duplicate handling plan

Duplicate handling should be advisory at the candidate staging boundary.

Future implementation should:

- use only existing duplicate advisory fields unless a later duplicate workflow expands behavior;
- mark duplicate status as `not_checked`, `pending`, `suspected`, `blocked`, or `cleared` only when supported by the existing normalizer contract;
- never write directly to `public.tools` or `discovered_tools` as duplicate resolution;
- never auto-approve, auto-promote, auto-publish, rank, or recommend;
- preserve staged candidates for human review even when duplicate hints are present;
- keep duplicate evidence bounded and safe.

## 11. Audit compatibility plan

The schema now permits candidate-staging audit action names, but Phase 10A does not add audit writes.

Future audit planning should decide:

- the action taxonomy used by extraction orchestration;
- whether audit writes are emitted by the staging helper or by an outer pipeline layer;
- whether candidate insert and audit insert must be transactional;
- what metadata keys are allowed;
- how `discovery_run_id`, `discovery_source_id`, `candidate_tool_id`, and `audit_correlation_id` are represented;
- how failures are handled if candidate staging succeeds but audit writing fails.

Until that design is approved, extraction implementation should persist `audit_correlation_id` on the candidate and avoid writing `discovery_audit_events`.

## 12. Future testing and verification plan

Future implementation phases should verify behavior incrementally.

Mocked/local verification should include:

- mapper tests for required source/run IDs;
- mapper tests for normalized candidate field selection;
- unsafe payload rejection tests;
- category/pricing validation tests;
- duplicate advisory field tests;
- staging-helper call tests that assert `discoverySourceId` and `discovery_source_id` behavior;
- failure-path tests that assert safe error categories and no raw payload leaks.

Standard local checks:

- targeted candidate normalizer tests;
- targeted candidate staging admin tests;
- `npm run check`;
- safe RLS smoke opt-out only.

Live DB checks must remain explicitly gated:

- no live DB tests during implementation unless James explicitly approves;
- no live RLS smoke rerun without explicit approval;
- any future live extraction smoke must create only exact test fixtures;
- live smoke cleanup must be exact-ID only;
- result documentation should be a separate phase.

## 13. Proposed future phase breakdown

Recommended sequence:

1. Phase 10B — Candidate Extraction Input Contract / Mapper Design
2. Phase 10C — Candidate Extraction Normalization Implementation Plan
3. Phase 10D — Candidate Extraction Staging Pipeline Implementation
4. Phase 10E — Candidate Extraction Mocked Verification
5. Phase 10F — Candidate Extraction Live Smoke Gate
6. Phase 10G — Candidate Extraction Live Smoke Execution
7. Phase 10H — Candidate Extraction Live Smoke Result Documentation
8. Phase 10I — Candidate Extraction Security / Audit Closure

This sequence keeps design, implementation, live execution, and result documentation separated. It also prevents extraction pipeline implementation from silently becoming crawler automation, UI integration, LLM behavior, or public-tool publishing.

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Extraction output accidentally stores raw HTML or source blobs | Use bounded mapper allowlists and reject unsupported payload keys. |
| Source lineage is lost | Require `discoverySourceId` at the pipeline boundary and assert helper persistence in mocked tests. |
| Extraction writes to the wrong table | Keep `stageNormalizedDiscoveryCandidate(...)` as the only write boundary and scan for `public.tools` / `discovered_tools` writes. |
| Duplicate hints become automatic decisions | Keep duplicate fields advisory and require separate approval for duplicate workflow behavior. |
| Audit action compatibility is mistaken for audit implementation | Treat audit writes as deferred until a dedicated audit design phase. |
| RLS posture changes after pipeline implementation | Run safe opt-out checks locally and require a separately approved live smoke before trusting live behavior. |
| LLM extraction introduces prompt-injection risk | Keep Phase 10 pipeline no-LLM unless a later LLM-specific safety phase approves it. |
| Logs leak payloads or secrets | Log only IDs, safe categories, and bounded status summaries. |

## 15. Safety boundaries preserved in Phase 10A

Phase 10A preserves these boundaries:

- no source code changes;
- no test changes;
- no helper changes;
- no smoke script changes;
- no generated type changes;
- no package script changes;
- no API/UI/extraction/crawler/LLM integration;
- no DB operations;
- no candidate/run/source row creation;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no `supabase db push`;
- no migrations;
- no Supabase type regeneration;
- no live RLS smoke execution;
- no RLS smoke opt-in environment variable.

## 16. Recommended next phase

Recommended next phase:

```text
Phase 10B — Candidate Extraction Input Contract / Mapper Design
```

Phase 10B should define the exact mapper inputs and outputs before implementation. It should decide how approved bounded acquisition evidence maps into the existing normalizer/staging contract, which fields are required, which fields are optional, which fields are forbidden, and which failure codes/logging categories are allowed.

Phase 10B should remain docs/design-only unless James explicitly approves implementation work.
