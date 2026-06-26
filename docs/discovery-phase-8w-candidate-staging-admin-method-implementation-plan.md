# Phase 8W — Candidate Staging Admin Method Implementation Plan

## Phase Title and Status

Status: docs-only implementation-plan phase.

Implementation status:

- `stageNormalizedDiscoveryCandidate(...)` is not implemented.
- No source code is added.
- No tests are added.
- No database writes are performed.
- No candidates are created.
- No API/UI/extraction/crawler/LLM integration is added.

Phase 8W defines the future method contract, mapping plan, error behavior, test strategy, and review gates for a later implementation phase.

## Current State Summary

Current Discovery Engine state:

- The candidate staging migration exists and has been applied.
- Generated Supabase types exist at `lib/supabase/database.types.ts`.
- The dedicated typed Discovery admin helper exists at `lib/discovery/discovery-supabase-admin.ts`.
- The typed helper is intentionally low-level: it creates a typed service-role Supabase client and performs no database operations.
- The typed helper no-op smoke test exists at `testing/discovery-supabase-admin-noop-smoke.test.mjs` and verifies import/factory construction without Supabase query/network calls.
- The pure candidate normalizer exists at `lib/discovery-candidate-normalizer.ts`.
- Candidate staging methods are not implemented.
- Candidate extraction is still not implementation-ready.
- No API/UI/extraction integration exists.

Current safety boundaries:

- No candidates are created.
- No `public.tools` writes are performed.
- No `discovered_tools` writes are performed.
- No approval, publish, promote, ranking, recommendation, crawler automation, or LLM behavior exists in the candidate staging track.

## Future File Path

The future method should live in:

```ts
lib/discovery/discovery-candidate-staging-admin.ts
```

This module should contain the higher-level candidate staging method layer. It should depend on the low-level typed admin client factory:

```ts
lib/discovery/discovery-supabase-admin.ts
```

The low-level client factory should remain low-level. Phase 8W does not move client construction logic and does not add staging methods to `discovery-supabase-admin.ts`.

## Future Method Signature

Planned future method signature:

```ts
export async function stageNormalizedDiscoveryCandidate(
  input: StageNormalizedDiscoveryCandidateInput,
): Promise<StageNormalizedDiscoveryCandidateResult>
```

This method should accept only a normalized candidate object and explicit run/source context. It must not accept raw crawler payloads, raw extraction payloads, raw HTML, screenshots, LLM prompts, LLM responses, raw metadata, raw stats, raw JSON dumps, snippets, transport payloads, or arbitrary source blobs.

## Exact Future Input Type

Planned future input type:

```ts
export type StageNormalizedDiscoveryCandidateInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  normalizedCandidate: NormalizedDiscoveryCandidate;
  actorId?: string | null;
};
```

Requirements:

- `discoveryRunId` is required.
- `discoverySourceId` is required even though the current staging table does not persist it.
- `normalizedCandidate` must be normalized output only.
- `actorId` remains optional until the future call site is defined.

Current repo type note:

- The repo does not currently export a type named `NormalizedDiscoveryCandidate`.
- The closest implemented contract is `SafeDiscoveryCandidateToolInsert` from `lib/discovery-candidate-normalizer.ts`.
- Future implementation should either:
  - introduce a type alias such as `type NormalizedDiscoveryCandidate = SafeDiscoveryCandidateToolInsert`, with an additional runtime requirement that `audit_correlation_id` is present; or
  - use `SafeDiscoveryCandidateToolInsert` directly and document it as the normalized candidate insert-like contract.

Recommended future type dependency:

```ts
import type { SafeDiscoveryCandidateToolInsert } from "@/lib/discovery-candidate-normalizer";

export type NormalizedDiscoveryCandidate = SafeDiscoveryCandidateToolInsert;
```

Because `SafeDiscoveryCandidateToolInsert.audit_correlation_id` is currently optional while the database column has a default, the future staging method must explicitly validate whether `audit_correlation_id` is present before insert. Phase 8W recommends treating a missing value as `missing_audit_correlation_id`, not silently relying on the database default, so audit correlation remains deliberate.

## Exact Future Result Type

Planned future result type:

```ts
export type StageNormalizedDiscoveryCandidateResult =
  | {
      ok: true;
      candidateId: string;
      candidateStatus: "staged";
      discoveryRunId: string;
      discoverySourceId: string;
      auditCorrelationId: string | null;
    }
  | {
      ok: false;
      error: {
        code:
          | "invalid_input"
          | "missing_audit_correlation_id"
          | "database_insert_failed"
          | "unexpected_error";
        message: string;
        details?: unknown;
      };
      discoveryRunId?: string;
      discoverySourceId?: string;
      auditCorrelationId?: string | null;
    };
```

Error detail rule:

- `details?: unknown` may exist for future typed, bounded, non-sensitive diagnostic summaries only.
- It must not contain raw Supabase errors, raw SQL details, raw input values, crawler payloads, extraction payloads, raw HTML, metadata dumps, stack traces, secrets, service-role values, tokens, or environment values.
- If safe details cannot be guaranteed, future implementation should omit `details`.

## Mapping Plan

The generated Supabase insert type should be the source of truth:

```ts
Database["public"]["Tables"]["discovery_candidate_tools"]["Insert"]
```

The future method should build exactly one insert object from `normalizedCandidate`. It should not merge raw caller payloads into the insert object.

| Normalized source field | Target DB column | Transformation rule | Required / optional handling | Validation or rejection behavior |
| --- | --- | --- | --- | --- |
| `discoveryRunId` | `discovery_run_id` | Must equal `normalizedCandidate.discovery_run_id`. | Required. | Reject with `invalid_input` if missing or mismatched. |
| `discoverySourceId` | none in current table | Required at method boundary only. | Required by input, not inserted. | Reject with `invalid_input` if missing. Future schema/audit phase may persist it. |
| `normalizedCandidate.source_url` | `source_url` | Pass through normalized safe HTTPS value. | Required by normalizer. | Reject with `invalid_input` if absent. |
| `normalizedCandidate.source_url_normalized` | `source_url_normalized` | Pass through normalized safe HTTPS value. | Required by normalizer. | Reject with `invalid_input` if absent. |
| `normalizedCandidate.source_domain` | `source_domain` | Pass through normalized domain. | Optional in generated insert type; currently required by normalizer output. | Reject with `invalid_input` if unsafe or missing from normalized contract. |
| `normalizedCandidate.source_evidence_kind` | `source_evidence_kind` | Pass through only `static_html_derived_evidence`. | Optional in generated insert type, but should be explicit. | Reject with `invalid_input` if not `static_html_derived_evidence`. |
| `normalizedCandidate.source_evidence_locator` | `source_evidence_locator` | Pass through bounded non-raw locator or null. | Optional nullable. | Do not insert raw snippets or raw source text. |
| `normalizedCandidate.extraction_mode` | `extraction_mode` | Pass through only `deterministic_static_evidence`. | Required. | Reject with `invalid_input` if unexpected. |
| `normalizedCandidate.extraction_version` | `extraction_version` | Pass through bounded version string. | Required. | Reject with `invalid_input` if missing. |
| `normalizedCandidate.candidate_name` | `candidate_name` | Pass through bounded safe name. | Required. | Reject with `invalid_input` if missing. |
| `normalizedCandidate.candidate_website_url` | `candidate_website_url` | Pass through safe HTTPS URL. | Required. | Reject with `invalid_input` if missing. |
| `normalizedCandidate.candidate_canonical_url` | `candidate_canonical_url` | Pass through canonical HTTPS URL. | Required. | Reject with `invalid_input` if missing. |
| `normalizedCandidate.candidate_normalized_domain` | `candidate_normalized_domain` | Pass through normalized domain. | Required. | Reject with `invalid_input` if missing. |
| `normalizedCandidate.candidate_description` | `candidate_description` | Pass through bounded safe description or null. | Optional nullable. | Do not store raw page/body/title/meta snippets. |
| `normalizedCandidate.candidate_category_hint` | `candidate_category_hint` | Pass through existing AiFinder category hint or null. | Optional nullable. | Reject or omit only if normalizer contract is violated; do not invent categories. |
| `normalizedCandidate.candidate_pricing_hint` | `candidate_pricing_hint` | Pass through `Free + Paid`, `Free`, `Paid`, or null. | Optional nullable. | Reject or omit only if normalizer contract is violated. |
| `normalizedCandidate.candidate_platform_hints` | `candidate_platform_hints` | Pass through bounded string array. | Optional with DB default, but should be explicit. | Reject with `invalid_input` if not an array. |
| `normalizedCandidate.candidate_social_links` | `candidate_social_links` | Pass through bounded safe HTTPS URL array. | Optional with DB default, but should be explicit. | Reject with `invalid_input` if not an array. |
| `normalizedCandidate.candidate_app_links` | `candidate_app_links` | Pass through bounded safe HTTPS URL array. | Optional with DB default, but should be explicit. | Reject with `invalid_input` if not an array. |
| `normalizedCandidate.evidence_summary` | `evidence_summary` | Pass through bounded safe summary or null. | Optional nullable. | Do not store raw evidence, snippets, or extraction payloads. |
| `normalizedCandidate.confidence_bucket` | `confidence_bucket` | Pass through `low`, `medium`, `high`, or null. | Optional nullable. | Advisory only; never ranking or approval. |
| `normalizedCandidate.risk_flags` | `risk_flags` | Pass through bounded safe string array. | Optional with DB default, but should be explicit. | Advisory only. |
| `normalizedCandidate.duplicate_check_status` | `duplicate_check_status` | Pass through advisory duplicate status. | Optional with DB default, but should be explicit. | Advisory only; no auto-reject or promotion. |
| `normalizedCandidate.duplicate_signal_types` | `duplicate_signal_types` | Pass through bounded advisory signal names. | Optional with DB default, but should be explicit. | No raw matched payloads. |
| `normalizedCandidate.duplicate_blocking` | `duplicate_blocking` | Pass through advisory boolean. | Optional with DB default, but should be explicit. | Must not block by writing to public tools or auto-rejecting. |
| `normalizedCandidate.possible_duplicate_tool_id` | `possible_duplicate_tool_id` | Pass through nullable advisory FK. | Optional nullable. | Advisory only; no `public.tools` mutation. |
| `normalizedCandidate.possible_duplicate_discovered_tool_id` | `possible_duplicate_discovered_tool_id` | Pass through nullable advisory FK. | Optional nullable. | Advisory only; no `discovered_tools` mutation. |
| `normalizedCandidate.possible_duplicate_candidate_id` | `possible_duplicate_candidate_id` | Pass through nullable advisory FK. | Optional nullable. | Advisory only. |
| `normalizedCandidate.duplicate_checked_at` | `duplicate_checked_at` | Pass through null for first staging method. | Optional nullable. | Future duplicate-check phase may set this. |
| none from caller | `candidate_status` | Force to `"staged"` inside method. | Required by method policy. | Ignore/reject any caller-provided status. |
| `normalizedCandidate.reviewed_at` | `reviewed_at` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null. |
| `normalizedCandidate.reviewed_by` | `reviewed_by` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null. |
| `normalizedCandidate.review_notes` | `review_notes` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null. |
| `normalizedCandidate.rejection_reason_code` | `rejection_reason_code` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null. |
| `normalizedCandidate.audit_correlation_id` | `audit_correlation_id` | Pass through required UUID. | Generated insert type allows omission because DB default exists; method should require explicit value. | Reject with `missing_audit_correlation_id` if missing. |
| `normalizedCandidate.cleanup_status` | `cleanup_status` | Pass through `active`. | Optional with DB default, but should be explicit. | Reject with `invalid_input` if not `active`. |
| `normalizedCandidate.eligible_for_cleanup_at` | `eligible_for_cleanup_at` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null unless future retention phase approves. |
| `normalizedCandidate.archived_at` | `archived_at` | Must remain null. | Optional nullable. | Reject with `invalid_input` if non-null. |

Explicit mapping rules:

- `candidate_status` must always be forced to `"staged"` by the method.
- Caller-provided candidate status must not be accepted.
- `audit_correlation_id` must pass through from the normalized candidate to the insert plan.
- Missing `audit_correlation_id` must return `missing_audit_correlation_id`.
- `discoveryRunId` maps to `discovery_run_id` after matching `normalizedCandidate.discovery_run_id`.
- `discoverySourceId` is required at the method boundary but is not inserted into the current table because no `discovery_source_id` column exists.
- The lack of persisted `discovery_source_id` is not a Phase 8W blocker, but it remains a future schema/audit compatibility concern.

## Discovery Source Accountability Handling

`discoverySourceId` should be required for accountability at the method boundary because future staging calls should always know which source context produced the normalized candidate.

Current limitation:

- `public.discovery_candidate_tools` does not include `discovery_source_id`.
- Phase 8W does not change schema.
- The first method implementation must not invent a storage location for `discoverySourceId`.

Future options:

- schema extension to add `discovery_source_id` to `public.discovery_candidate_tools`;
- audit event compatibility phase with safe allowlisted source ID metadata;
- metadata-based traceability only if Gemini approves exact metadata shape and audit action compatibility.

Phase 8W recommendation:

- Require `discoverySourceId` at the interface boundary.
- Do not persist it in the first method implementation.
- Do not add audit writes in the first method implementation.
- Create a separate Gemini-approved audit compatibility phase before any audit event writes.

## Duplicate / Advisory Fields Handling

Duplicate hints are advisory only.

Rules:

- duplicate hints must never auto-reject candidates;
- duplicate hints must never auto-approve candidates;
- duplicate hints must never auto-promote candidates;
- duplicate hints must never create public rankings or recommendations;
- duplicate hints must never write to `public.tools`;
- duplicate hints must never mutate `discovered_tools`;
- duplicate-related normalized fields should map only to existing candidate advisory/staging columns;
- if a future duplicate signal has no matching candidate column, leave it out and handle it in a future duplicate-review phase.

Currently supported candidate advisory fields:

- `duplicate_check_status`;
- `duplicate_signal_types`;
- `duplicate_blocking`;
- `possible_duplicate_tool_id`;
- `possible_duplicate_discovered_tool_id`;
- `possible_duplicate_candidate_id`;
- `duplicate_checked_at`.

Duplicate safety must remain human/admin-review oriented.

## Database Error Handling Plan

Future implementation should:

- validate input before any database insert attempt;
- validate `discoveryRunId` and `discoverySourceId`;
- validate `normalizedCandidate.discovery_run_id === discoveryRunId`;
- validate `candidate_status` is forced to `"staged"`;
- validate explicit `audit_correlation_id`;
- catch or normalize Supabase insert errors;
- return `ok: false` with a stable error code;
- avoid throwing raw Supabase errors across the boundary unless a future project convention explicitly requires throwing;
- preserve `discoveryRunId`, `discoverySourceId`, and `auditCorrelationId` in the failure result where safe;
- avoid leaking raw crawler payloads, extraction payloads, evidence bodies, SQL details, Supabase internals, stack traces, or secrets into `message` or `details`.

Recommended error mapping:

| Situation | Result code |
| --- | --- |
| malformed input object | `invalid_input` |
| missing `discoveryRunId` | `invalid_input` |
| missing `discoverySourceId` | `invalid_input` |
| mismatched `discoveryRunId` and `normalizedCandidate.discovery_run_id` | `invalid_input` |
| candidate status not staging-safe | `invalid_input` |
| missing `audit_correlation_id` | `missing_audit_correlation_id` |
| Supabase insert error | `database_insert_failed` |
| unexpected non-DB exception | `unexpected_error` |

Messages should be short, stable, and non-raw, for example:

- `Invalid normalized discovery candidate.`
- `Missing audit correlation ID.`
- `Candidate staging insert failed.`
- `Unexpected candidate staging error.`

## Idempotency / Duplicate-Safe Expectations

Phase 8W does not implement idempotency.

Future implementation should be duplicate-safe by design. The method should not use blind repeated inserts without a documented uniqueness/idempotency strategy.

Potential future strategies:

- rely on the existing active same-run canonical URL unique index;
- add a pre-insert lookup in a separate approved phase;
- use `audit_correlation_id` based idempotency only if schema support is explicitly reviewed;
- route duplicate conflicts into duplicate-review queue behavior;
- return a stable duplicate-safe result shape in a later method revision.

Constraints:

- Do not plan `upsert` unless Gemini approves it.
- Do not automatically merge candidates.
- Do not automatically approve candidates.
- Do not automatically promote candidates.
- Do not automatically publish public tools.

## Mocked / Mapping Test Plan Before Live DB Smoke

The first implementation phase should use mocked/mapping tests only.

Required future tests:

- pure mapping from `NormalizedDiscoveryCandidate` / `SafeDiscoveryCandidateToolInsert` to `Database["public"]["Tables"]["discovery_candidate_tools"]["Insert"]`;
- input validation test for missing `discoveryRunId`;
- input validation test for missing `discoverySourceId`;
- `discoveryRunId` mismatch test;
- status enforcement test proving `candidate_status` is forced to `"staged"`;
- test that caller-provided approval/publish/promotion state is rejected or impossible;
- `audit_correlation_id` pass-through test;
- missing audit correlation test returning `missing_audit_correlation_id`;
- duplicate hints advisory-only mapping test;
- human review fields remain null;
- cleanup fields remain active/null;
- DB error normalization test using a mocked Supabase response;
- unexpected error normalization test;
- no raw Supabase error passthrough;
- no live DB writes in unit/mapping tests;
- no `public.tools` mock write;
- no `discovered_tools` mock write.

Only after Gemini approves mapping tests should a later live DB smoke phase be considered.

## Future Live DB Smoke Plan, Not for This Phase

Future live DB smoke must be separate and explicitly approved.

It must include:

- an explicit test candidate fixture;
- an explicit cleanup/rollback plan;
- a confirmation that the fixture is safe and non-public;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no approval/promotion/publish behavior;
- no extraction/crawler/LLM trigger;
- verification that the inserted candidate remains `candidate_status = "staged"`;
- verification that duplicate/advisory fields do not promote or reject automatically;
- verification that cleanup deletes only the smoke candidate if cleanup is approved.

Phase 8W does not authorize this smoke.

## Future Safety Scans

Future implementation phase should run safety scans that verify:

- no `public.tools` writes;
- no `discovered_tools` writes;
- no API routes added;
- no UI integration added;
- no crawler trigger added;
- no extraction trigger added;
- no LLM call added;
- no approval/promotion/ranking/recommendation code added;
- only the planned staging admin module and tests changed;
- generated Supabase types unchanged unless explicitly approved;
- no migration changes unless explicitly approved.

Recommended future scan commands:

```bash
rg -n "public\\.tools|\\.from\\(\"tools\"|\\.from\\('tools'|from\\(\"tools\"|from\\('tools'" lib/discovery testing --glob '!node_modules' --glob '!*.map'

rg -n "discovered_tools|\\.from\\(\"discovered_tools\"|\\.from\\('discovered_tools'" lib/discovery testing --glob '!node_modules' --glob '!*.map'

rg -n "app/api|route\\.ts|components/|\"use client\"|use client" lib/discovery testing --glob '!node_modules' --glob '!*.map'

rg -n "crawler|extract|extraction|LLM|llm|openai|anthropic|scheduler|cron|automation" lib/discovery testing --glob '!node_modules' --glob '!*.map'

rg -n "approve|approved|publish|promote|rank|recommend|ranking|recommendation" lib/discovery testing --glob '!node_modules' --glob '!*.map'

rg -n "insert\\(|update\\(|delete\\(|upsert\\(|select\\(|rpc\\(|\\.auth|\\.storage|\\.functions|\\.channel" lib/discovery/discovery-candidate-staging-admin.ts testing/discovery-candidate-staging-admin.test.mjs

git diff --name-only
```

Expected future interpretation:

- The staging admin module may contain one reviewed `.insert(...)` into `discovery_candidate_tools` only if Gemini approves the implementation phase.
- It must not contain `.upsert(...)`.
- It must not contain `public.tools` writes.
- It must not contain API/UI/extraction/crawler/LLM integration.

## Rollback Plan

Phase 8W rollback:

- delete `docs/discovery-phase-8w-candidate-staging-admin-method-implementation-plan.md`.

Future implementation rollback:

- remove `lib/discovery/discovery-candidate-staging-admin.ts`;
- remove `testing/discovery-candidate-staging-admin.test.mjs`;
- do not modify the low-level typed helper as rollback unless it was changed by an approved future phase;
- do not modify generated types as rollback unless they were changed by an approved future phase;
- do not modify migrations as rollback unless they were changed by an approved future phase.

Future live DB smoke rollback:

- must be separately approved;
- must delete only the smoke candidate created by that smoke test;
- must not touch `public.tools`;
- must not touch approved/public data;
- must not touch unrelated `discovered_tools` records.

No rollback for `public.tools` should be needed because future implementation must never write there.

## Gemini Gates

Required Gemini gates:

- Gemini review of Phase 8W implementation plan before commit.
- Gemini approval before implementing `stageNormalizedDiscoveryCandidate(...)`.
- Gemini approval before adding mapping tests.
- Gemini approval before any live DB smoke.
- Separate Gemini-approved audit compatibility phase before any audit event writes.
- Separate Gemini-approved schema phase before adding `discovery_source_id` persistence.
- Separate Gemini-approved integration phase before API/UI/extraction/crawler integration.
- Separate Gemini-approved duplicate-review phase before duplicate detection affects candidate state.
- Separate Gemini-approved promotion/publish phase before any public-tool workflow exists.

## Non-goals

Phase 8W non-goals:

- no source code;
- no tests;
- no helper modifications;
- no generated type changes;
- no migrations;
- no migration apply;
- no type regeneration;
- no remote SQL;
- no database operations;
- no `.from(...)` calls;
- no candidates;
- no API route;
- no UI;
- no extraction integration;
- no crawler automation;
- no LLM call;
- no public tool publishing;
- no candidate approval;
- no candidate promotion;
- no ranking or recommendation behavior;
- no audit event writes in this phase.

## Final Phase 8W Decision Summary

Phase 8W recommends planning the first future staging method as:

```ts
stageNormalizedDiscoveryCandidate(input)
```

in:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

The method should accept only normalized candidate output, require explicit `discoveryRunId` and `discoverySourceId`, force `candidate_status` to `"staged"`, require explicit `audit_correlation_id`, preserve duplicate fields as advisory only, normalize DB failures into safe result codes, and avoid all API/UI/extraction/crawler/LLM integration.

The immediate next safe step is Gemini review of this plan. Implementation remains blocked until Gemini and James approve the future method phase.
