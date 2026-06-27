# Phase 10B — Candidate Extraction Input Contract / Mapper Design

## 1. Phase scope

Phase 10B is a docs-only design phase for the future Candidate Extraction input contract and mapper.

This phase does not implement candidate extraction, mapper code, crawler automation, LLM behavior, API routes, UI integration, database writes, migrations, Supabase type generation, smoke script changes, helper changes, or test changes.

The purpose is to define how a future mapper should transform approved bounded acquisition/extraction input into the exact `StageNormalizedDiscoveryCandidateInput` shape required by the existing candidate staging admin helper.

## 2. Current validated staging foundation

The future mapper can rely on the following validated foundation:

- Phase 10A completed the candidate extraction staging pipeline plan.
- Phase 9S live post-schema RLS smoke passed after explicit approval.
- `StageNormalizedDiscoveryCandidateInput` exists in `lib/discovery/discovery-candidate-staging-admin.ts`.
- `stageNormalizedDiscoveryCandidate(...)` writes only to `public.discovery_candidate_tools`.
- The helper maps `discoverySourceId` to `discovery_candidate_tools.discovery_source_id`.
- The helper preserves `discoveryRunId`, `discoverySourceId`, and `audit_correlation_id` in its safe result shape.
- The helper requires `candidate_status = "staged"`.
- The helper rejects blank `discoveryRunId` and `discoverySourceId` before client creation.
- The helper rejects normalized candidates without `audit_correlation_id`.
- Candidate staging remains admin/service-role only.
- Anonymous/public RLS denial remains verified for `discovery_candidate_tools`.

The mapper should be a pure local transformation boundary. It should not create a Supabase client, call the staging helper, or write application data directly.

## 3. Future extraction input contract design

Recommended future interface name:

```ts
type CandidateExtractionMapperInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  sourceUrl: string;
  sourceEvidenceLocator?: string | null;
  candidateName: string;
  candidateWebsiteUrl: string;
  candidateDescription?: string | null;
  candidateCategoryHint?: string | null;
  candidatePricingHint?: string | null;
  candidatePlatformHints?: string[] | null;
  candidateSocialLinks?: string[] | null;
  candidateAppLinks?: string[] | null;
  evidenceSummary?: string | null;
  confidenceBucket?: "low" | "medium" | "high" | null;
  riskFlags?: string[] | null;
  duplicateAdvisory?: CandidateExtractionDuplicateAdvisory | null;
  auditCorrelationId?: string | null;
};
```

Recommended duplicate advisory input:

```ts
type CandidateExtractionDuplicateAdvisory = {
  duplicateCheckStatus?: "not_checked" | "pending" | "suspected" | "blocked" | "cleared";
  duplicateSignalTypes?: string[];
  duplicateBlocking?: boolean;
  possibleDuplicateToolId?: number | null;
  possibleDuplicateDiscoveredToolId?: string | null;
  possibleDuplicateCandidateId?: string | null;
};
```

These names are design recommendations only. No source file is added in Phase 10B.

### Required input fields

The first mapper version should require:

- `discoveryRunId`;
- `discoverySourceId`;
- `sourceUrl`;
- `candidateName`;
- `candidateWebsiteUrl`.

`sourceUrl` is the approved bounded acquisition source URL or approved canonical source URL used as candidate evidence context.

`candidateWebsiteUrl` is the candidate tool website URL that will be normalized and used for duplicate comparison fields.

### Optional input fields

Optional fields should be accepted only when they map to current normalizer/staging fields:

- `sourceEvidenceLocator`;
- `candidateDescription`;
- `candidateCategoryHint`;
- `candidatePricingHint`;
- `candidatePlatformHints`;
- `candidateSocialLinks`;
- `candidateAppLinks`;
- `evidenceSummary`;
- `confidenceBucket`;
- `riskFlags`;
- duplicate advisory fields;
- `auditCorrelationId`.

The mapper should drop or reject unsupported fields rather than preserve arbitrary metadata.

### Raw evidence boundary

Raw evidence should be referenced, not embedded.

Allowed:

- bounded source URL;
- bounded evidence locator such as a URL index, evidence record key, or safe marker;
- safe acquisition status labels;
- safe confidence/risk labels.

Forbidden:

- raw HTML;
- screenshots;
- page body text;
- prompt text;
- model responses;
- cookies;
- headers;
- secrets;
- stack traces;
- raw source blobs;
- raw metadata dumps;
- raw public/discovered tool payloads.

## 4. Future normalized mapper output

The mapper output must be exactly compatible with:

```ts
type StageNormalizedDiscoveryCandidateInput = {
  discoveryRunId: string;
  discoverySourceId: string;
  normalizedCandidate: NormalizedDiscoveryCandidate;
  actorId?: string | null;
};
```

Mapper output requirements:

- preserve trimmed `discoveryRunId`;
- preserve trimmed `discoverySourceId`;
- provide `normalizedCandidate.discovery_run_id` equal to the trimmed `discoveryRunId`;
- provide `normalizedCandidate.audit_correlation_id`;
- keep candidate status staged through the normalized candidate and staging helper;
- use the existing candidate normalizer output shape for `normalizedCandidate`;
- never return raw acquisition payloads or raw parser output.

The current normalizer accepts `audit_correlation_id` as optional, but the staging helper requires it. Therefore the mapper must ensure one is present before producing an `ok: true` staging input.

Preferred audit correlation strategy:

1. Use an approved upstream `auditCorrelationId` if supplied and valid.
2. Otherwise, generate a new UUID inside the mapper implementation.
3. Return a structured failure if UUID generation is unavailable or if a supplied value is invalid.

## 5. Field mapping table

| Extraction input field | Validation / normalization rule | Staging helper / normalizer field | Required | Failure behavior |
| --- | --- | --- | --- | --- |
| `discoveryRunId` | Trim; require valid non-empty UUID-like value; do not invent | `StageNormalizedDiscoveryCandidateInput.discoveryRunId`; `normalizedCandidate.discovery_run_id` | Required | Return `missing_discovery_run_id` or `invalid_discovery_run_id`; do not call staging helper |
| `discoverySourceId` | Trim; require valid non-empty UUID-like value; do not invent | `StageNormalizedDiscoveryCandidateInput.discoverySourceId`; persisted later as `discovery_source_id` | Required | Return `missing_discovery_source_id` or `invalid_discovery_source_id`; do not call staging helper |
| `sourceUrl` | Require safe HTTPS URL; no credentials; bounded length; canonicalized by normalizer | `normalizedCandidate.source_url`; `source_url_normalized`; `source_domain` | Required | Return `missing_source_url`, `invalid_url`, `non_https_url`, or `unsafe_domain` |
| `sourceEvidenceLocator` | Trim/collapse; bounded locator; no raw payload | `normalizedCandidate.source_evidence_locator` | Optional | Drop if absent; fail with bounded code if unsafe or too long |
| `candidateName` | Trim/collapse; require non-empty; max current normalizer name length; no HTML/script-like text | `normalizedCandidate.candidate_name` | Required | Return `missing_name`, `field_too_long`, or `unsafe_content` |
| `candidateWebsiteUrl` | Require safe HTTPS URL; no credentials; remove tracking parameters through normalizer | `candidate_website_url`; `candidate_canonical_url`; `candidate_normalized_domain` | Required | Return `missing_website_url`, `invalid_url`, `non_https_url`, or `unsafe_domain` |
| `candidateDescription` | Trim/collapse; bounded plain-language hint; no raw page text blob | `candidate_description` | Optional | Drop if absent; fail if unsafe or too long |
| `candidateCategoryHint` | Allow only `TOOL_CATEGORIES` values | `candidate_category_hint` | Optional | Recommended first version: fail with `unsupported_category_hint` for provided invalid value |
| `candidatePricingHint` | Allow only `Free + Paid`, `Free`, or `Paid` | `candidate_pricing_hint` | Optional | Recommended first version: fail with `unsupported_pricing_hint` for provided invalid value |
| `candidatePlatformHints` | Trim/dedupe strings; bounded item length and count | `candidate_platform_hints` | Optional | Drop absent; fail if unsafe/unbounded |
| `candidateSocialLinks` | Safe HTTPS URLs only; bounded list; no credentials | `candidate_social_links` | Optional | Drop absent; fail if unsafe URL |
| `candidateAppLinks` | Safe HTTPS URLs only; bounded list; no executable/deep-link protocols | `candidate_app_links` | Optional | Drop absent; fail if unsafe URL |
| `evidenceSummary` | Bounded summary of why candidate was staged; no snippets/raw HTML | `evidence_summary` | Optional | Drop absent; fail if unsafe or too long |
| `confidenceBucket` | Allow only `low`, `medium`, `high` | `confidence_bucket` | Optional | Fail with `unsupported_confidence_bucket` for provided invalid value |
| `riskFlags` | Bounded enum-like safe labels; no raw text | `risk_flags` | Optional | Drop absent; fail if unsafe/unbounded |
| `duplicateAdvisory.duplicateCheckStatus` | Allow current normalizer statuses only | `duplicate_check_status` | Optional | Default to `not_checked`; fail if invalid |
| `duplicateAdvisory.duplicateSignalTypes` | Bounded safe labels only | `duplicate_signal_types` | Optional | Default to empty; fail if unsafe/unbounded |
| `duplicateAdvisory.duplicateBlocking` | Boolean advisory only | `duplicate_blocking` | Optional | Default false |
| `duplicateAdvisory.possibleDuplicateToolId` | Positive integer or null | `possible_duplicate_tool_id` | Optional | Null if absent; fail if invalid provided value |
| `duplicateAdvisory.possibleDuplicateDiscoveredToolId` | UUID or null | `possible_duplicate_discovered_tool_id` | Optional | Null if absent; fail if invalid provided value |
| `duplicateAdvisory.possibleDuplicateCandidateId` | UUID or null | `possible_duplicate_candidate_id` | Optional | Null if absent; fail if invalid provided value |
| `auditCorrelationId` | Use provided valid UUID or generate one | `normalizedCandidate.audit_correlation_id` | Required by mapper output | Return `invalid_audit_correlation_id` if provided invalid; return `audit_correlation_unavailable` if generation fails |

## 6. Required validation rules

The future mapper should preserve or delegate to the current normalizer rules:

- `discoveryRunId` is required, trimmed, and must come from approved discovery run context.
- `discoverySourceId` is required, trimmed, and must come from approved discovery source context.
- `candidateName` is required, trimmed, collapsed, and bounded.
- `sourceUrl` is required and must be safe HTTPS.
- `candidateWebsiteUrl` is required and must be safe HTTPS.
- Category hints must use approved AiFinder categories from `TOOL_CATEGORIES`.
- Pricing hints must use `Free + Paid`, `Free`, or `Paid`.
- Description, evidence summary, platform hints, risk flags, and duplicate signal labels must be bounded.
- Social/app links must be safe HTTPS URLs and bounded.
- Raw HTML, prompt text, model output, cookies, headers, secrets, raw JSON dumps, and stack traces must be rejected or dropped according to an explicit allowlist rule.
- Logs and returned errors must not include raw payloads.

The mapper should treat unknown fields as unsupported. It should not copy unknown fields into a metadata blob.

## 7. Source accountability rules

Every successful mapper output must include both source and run accountability:

- `discoveryRunId` must be present.
- `discoverySourceId` must be present.
- The mapper must not invent source or run IDs.
- IDs must be supplied by an approved server-side discovery orchestration context.
- The mapper must not accept anonymous, public, browser, or untrusted client-supplied IDs as authoritative.
- The mapper must return failure before staging if either ID is missing or invalid.
- The future staging call must preserve `discoverySourceId` through `discovery_source_id`.

The database column is nullable for migration safety, but extraction mapper output should be stricter: successful extraction-originated staged candidates require source lineage.

## 8. Failure model

Recommended future result shape:

```ts
type CandidateExtractionMapperResult =
  | {
      ok: true;
      stagingInput: StageNormalizedDiscoveryCandidateInput;
      warnings: CandidateExtractionMapperWarning[];
    }
  | {
      ok: false;
      error: {
        code: CandidateExtractionMapperErrorCode;
        message: string;
      };
      discoveryRunId?: string;
      discoverySourceId?: string;
      auditCorrelationId?: string | null;
      warnings: CandidateExtractionMapperWarning[];
    };
```

The mapper should:

- return structured validation failures;
- avoid throwing unstructured errors for expected validation failures;
- avoid including raw payloads in error messages;
- avoid stack traces in user-facing or log-facing output;
- never call `stageNormalizedDiscoveryCandidate(...)` on invalid input;
- never create a Supabase client;
- never write database rows directly;
- never write `public.tools` or `discovered_tools`;
- never emit audit events directly.

Recommended error code families:

- `missing_discovery_run_id`;
- `missing_discovery_source_id`;
- `missing_source_url`;
- `missing_candidate_name`;
- `missing_candidate_website_url`;
- `invalid_url`;
- `non_https_url`;
- `unsafe_domain`;
- `field_too_long`;
- `unsafe_content`;
- `unsupported_category_hint`;
- `unsupported_pricing_hint`;
- `unsupported_confidence_bucket`;
- `invalid_audit_correlation_id`;
- `audit_correlation_unavailable`;
- `normalization_failed`.

Recommended warning families:

- `tracking_parameters_removed`;
- `optional_value_dropped`;
- `duplicate_advisory_present`;
- `source_evidence_locator_absent`;

## 9. Duplicate handling contract

The mapper must not decide whether a candidate is approved, rejected, published, or ranked.

Duplicate behavior should remain advisory:

- duplicate inputs may be mapped only into current duplicate advisory fields;
- duplicate hints must not create, update, or delete rows in `public.tools`;
- duplicate hints must not create, update, or delete rows in `discovered_tools`;
- duplicate hints must not auto-publish or auto-reject;
- duplicate hints must not bypass admin review;
- duplicate advisory expansion requires a separate reviewed duplicate workflow phase.

If no duplicate advisory is present, the mapper should default to the current normalizer behavior:

- `duplicate_check_status = "not_checked"`;
- `duplicate_signal_types = []`;
- `duplicate_blocking = false`;
- possible duplicate pointers are `null`.

## 10. Audit compatibility

The mapper must preserve or generate `auditCorrelationId` for the normalized candidate.

The mapper must not write audit events in Phase 10B or the first mapper implementation unless a separate phase explicitly approves audit writes.

The current schema allows candidate-staging audit actions, but that compatibility does not authorize audit insertion behavior.

Future audit design remains separate and should decide:

- whether the mapper, staging helper, or orchestration layer owns audit writes;
- whether audit writes are transactional with staging inserts;
- which fixed metadata keys are allowed;
- how actor identity is represented;
- how failures are reported without leaving staging ambiguous.

## 11. Non-goals

Phase 10B and the first mapper implementation should not add:

- candidate extraction execution;
- crawler automation;
- LLM execution;
- API routes;
- UI integration;
- admin review actions;
- direct `public.tools` writes;
- direct `discovered_tools` writes;
- approval, promotion, publishing, ranking, or recommendation behavior;
- audit event writes;
- migrations or Supabase type generation;
- live DB smoke execution.

## 12. Future implementation target

Recommended future module path:

```text
lib/discovery/discovery-candidate-extraction-mapper.ts
```

Recommended first exported function:

```ts
mapExtractionToStagingCandidate(...)
```

Recommended responsibility:

- accept `CandidateExtractionMapperInput`;
- validate and normalize extraction input;
- call `normalizeDiscoveryCandidate(...)` internally;
- ensure `audit_correlation_id` exists before returning success;
- return `StageNormalizedDiscoveryCandidateInput` on success;
- return structured failure on invalid input;
- perform no DB operations.

Recommended implementation boundary:

```text
CandidateExtractionMapperInput
  -> mapExtractionToStagingCandidate(...)
  -> normalizeDiscoveryCandidate(...)
  -> StageNormalizedDiscoveryCandidateInput
  -> later phase may call stageNormalizedDiscoveryCandidate(...)
```

The mapper should not import Supabase clients or staging admin client factories.

## 13. Future tests

Future mapper tests should be mocked/local only.

Required test cases:

1. Valid minimal mapping returns `StageNormalizedDiscoveryCandidateInput`.
2. Valid mapping preserves trimmed `discoveryRunId`.
3. Valid mapping preserves trimmed `discoverySourceId`.
4. Valid mapping includes `normalizedCandidate.discovery_run_id`.
5. Valid mapping includes `normalizedCandidate.audit_correlation_id`.
6. Missing `discoveryRunId` fails before normalization/staging.
7. Missing `discoverySourceId` fails before normalization/staging.
8. Missing candidate name fails.
9. Missing candidate website URL fails.
10. Invalid/non-HTTPS source URL fails.
11. Invalid/non-HTTPS candidate website URL fails.
12. Invalid category hint fails or is handled according to the explicitly chosen policy.
13. Invalid pricing hint fails.
14. Unsafe content such as raw HTML, stack traces, secrets, or prompt-like text fails.
15. Optional bounded fields map correctly.
16. Duplicate advisory fields remain advisory-only.
17. Mapper does not call `stageNormalizedDiscoveryCandidate(...)` on failure.
18. Mapper performs no DB operations.
19. Mapper does not import or create a Supabase client.
20. Mapper never writes or references write paths for `public.tools` or `discovered_tools`.

Verification commands for the future implementation phase should include:

- targeted mapper test;
- targeted candidate normalizer test;
- targeted candidate staging admin test;
- `npm run check`;
- safe RLS smoke opt-out only.

No live DB smoke should run during mapper implementation unless James explicitly approves a separate live phase.

## 14. Recommended next phase

Recommended next phase:

```text
Phase 10C — Candidate Extraction Mapper Implementation Plan
```

Phase 10C should translate this design into a precise implementation plan, including exact file path, function signatures, result types, failure codes, test cases, and verification commands.

Phase 10C should remain implementation-planning only unless James explicitly authorizes code changes.

## 15. Safety boundaries preserved in Phase 10B

Phase 10B preserves these boundaries:

- no source code changes;
- no test changes;
- no helper changes;
- no smoke script changes;
- no generated type changes;
- no package script changes;
- no API/UI/extraction/crawler/LLM integration;
- no DB operations;
- no candidate/run/source rows created;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no `supabase db push`;
- no migrations;
- no Supabase type regeneration;
- no live RLS smoke execution;
- no RLS smoke opt-in environment variable.
