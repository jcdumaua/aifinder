# Phase 10C — Candidate Extraction Mapper Implementation Plan

## 1. Phase scope

Phase 10C is a docs-only implementation plan for the future Candidate Extraction mapper.

This phase translates the Phase 10B mapper contract into exact, bounded implementation steps for a later pure/local mapper module.

Phase 10C does not implement mapper code, TypeScript interfaces in source, tests, extraction execution, crawler automation, LLM behavior, API routes, UI integration, database writes, migrations, Supabase type generation, smoke script changes, helper changes, generated type changes, package script changes, or audit event writes.

## 2. Current validated foundation

The following foundation is complete:

- Phase 10A — Candidate Extraction Staging Pipeline Planning is complete and pushed.
- Phase 10B — Candidate Extraction Input Contract / Mapper Design is complete and pushed.
- Phase 9S live post-schema RLS smoke passed.
- `StageNormalizedDiscoveryCandidateInput` exists in `lib/discovery/discovery-candidate-staging-admin.ts`.
- `stageNormalizedDiscoveryCandidate(...)` is implemented as the admin/service-role staging boundary.
- Candidate staging helper persists `discoverySourceId` as `discovery_candidate_tools.discovery_source_id`.
- Candidate staging helper preserves `discoveryRunId`, `discoverySourceId`, and `audit_correlation_id` in safe results.
- Candidate staging helper rejects missing run/source IDs and missing audit correlation before unsafe DB behavior.
- Candidate normalizer exists at `lib/discovery-candidate-normalizer.ts`.
- Candidate normalizer returns safe `SafeDiscoveryCandidateToolInsert` output and structured rejection codes.
- Candidate staging remains staging-only, non-public, and admin/service-role only.

Mapper implementation remains deferred to a later phase.

## 3. Future implementation target

Recommended future source module:

```text
lib/discovery/discovery-candidate-extraction-mapper.ts
```

Recommended first exported function:

```ts
mapExtractionToStagingCandidate(...)
```

The mapper must be:

- pure;
- local;
- deterministic;
- DB-free;
- Supabase-client-free;
- staging-helper-call-free;
- API/UI/crawler/LLM-free.

The mapper should transform `CandidateExtractionMapperInput` into `StageNormalizedDiscoveryCandidateInput` using the existing candidate normalizer.

Recommended dependency direction:

```text
discovery-candidate-extraction-mapper.ts
  imports normalizeDiscoveryCandidate(...)
  imports type StageNormalizedDiscoveryCandidateInput
  does not import createDiscoverySupabaseAdminClient(...)
  does not import stageNormalizedDiscoveryCandidate(...)
```

The mapper should not own persistence. A later orchestration phase may call the staging helper with mapper output after separate review.

## 4. Proposed TypeScript interfaces

These interfaces are design-level only in Phase 10C. They must not be added to source until Phase 10D or a later approved implementation phase.

### CandidateExtractionMapperInput

```ts
export type CandidateExtractionMapperInput = {
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

### CandidateExtractionDuplicateAdvisory

```ts
export type CandidateExtractionDuplicateAdvisory = {
  duplicateCheckStatus?: "not_checked" | "pending" | "suspected" | "blocked" | "cleared";
  duplicateSignalTypes?: string[] | null;
  duplicateBlocking?: boolean | null;
  possibleDuplicateToolId?: number | null;
  possibleDuplicateDiscoveredToolId?: string | null;
  possibleDuplicateCandidateId?: string | null;
};
```

### CandidateExtractionMapperFailureCode

```ts
export type CandidateExtractionMapperFailureCode =
  | "missing_discovery_run_id"
  | "missing_discovery_source_id"
  | "missing_source_url"
  | "missing_candidate_name"
  | "missing_candidate_website_url"
  | "invalid_discovery_run_id"
  | "invalid_discovery_source_id"
  | "invalid_source_url"
  | "invalid_candidate_website_url"
  | "invalid_category"
  | "invalid_pricing"
  | "invalid_confidence_bucket"
  | "invalid_audit_correlation_id"
  | "audit_correlation_unavailable"
  | "unsafe_payload"
  | "field_too_long"
  | "normalization_failed"
  | "internal_mapping_error";
```

### CandidateExtractionMapperWarning

```ts
export type CandidateExtractionMapperWarning =
  | "tracking_parameters_removed"
  | "optional_value_dropped"
  | "duplicate_advisory_present"
  | "source_evidence_locator_absent"
  | "audit_correlation_generated";
```

### CandidateExtractionMapperSuccess

```ts
export type CandidateExtractionMapperSuccess = {
  ok: true;
  stagingInput: StageNormalizedDiscoveryCandidateInput;
  warnings: CandidateExtractionMapperWarning[];
};
```

### CandidateExtractionMapperFailure

```ts
export type CandidateExtractionMapperFailure = {
  ok: false;
  error: {
    code: CandidateExtractionMapperFailureCode;
    message: string;
  };
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  warnings: CandidateExtractionMapperWarning[];
};
```

### CandidateExtractionMapperResult

```ts
export type CandidateExtractionMapperResult =
  | CandidateExtractionMapperSuccess
  | CandidateExtractionMapperFailure;
```

## 5. Exact required input fields

The future mapper must require these fields:

- `discoveryRunId`
- `discoverySourceId`
- `sourceUrl`
- `candidateName`
- `candidateWebsiteUrl`

Required-field behavior:

- trim scalar strings before validation;
- reject empty strings after trim;
- do not invent `discoveryRunId`;
- do not invent `discoverySourceId`;
- do not call the staging helper when any required field is missing;
- do not create a Supabase client when any required field is missing.

## 6. Optional input fields

Optional fields must be limited to existing normalizer/staging support:

- `sourceEvidenceLocator`
- `candidateDescription`
- `candidateCategoryHint`
- `candidatePricingHint`
- `candidatePlatformHints`
- `candidateSocialLinks`
- `candidateAppLinks`
- `evidenceSummary`
- `confidenceBucket`
- `riskFlags`
- duplicate advisory fields
- `auditCorrelationId`

Optional-field behavior:

- absent optional strings should map to `null` or the normalizer default;
- absent optional arrays should map to empty arrays through the normalizer;
- unknown fields should not be preserved in metadata;
- invalid provided optional values should fail closed when the normalizer would reject them;
- optional fields must not carry raw HTML, raw metadata, prompt text, model output, secrets, stack traces, or raw payload blobs.

## 7. Future implementation algorithm

The future `mapExtractionToStagingCandidate(...)` implementation should follow this sequence.

### Step 1 — Accept unknown input defensively

Implementation should accept a typed `CandidateExtractionMapperInput` at the public TypeScript boundary, but still treat runtime values defensively because tests and future orchestration may pass unknown values.

If the input is missing or not object-like, return:

```text
internal_mapping_error
```

or:

```text
normalization_failed
```

No raw payload should be echoed.

### Step 2 — Trim required scalar fields

Trim:

- `discoveryRunId`
- `discoverySourceId`
- `sourceUrl`
- `candidateName`
- `candidateWebsiteUrl`

Return missing-field codes before deeper normalization:

- empty `discoveryRunId` -> `missing_discovery_run_id`
- empty `discoverySourceId` -> `missing_discovery_source_id`
- empty `sourceUrl` -> `missing_source_url`
- empty `candidateName` -> `missing_candidate_name`
- empty `candidateWebsiteUrl` -> `missing_candidate_website_url`

### Step 3 — Validate IDs

Use the same UUID expectation as the current normalizer and tests.

Recommended behavior:

- `discoveryRunId` must be a valid UUID-like string;
- `discoverySourceId` must be a valid UUID-like string;
- normalize accepted UUIDs to trimmed lower-case form if the normalizer convention does so;
- do not generate either ID.

Failure codes:

- invalid run ID -> `invalid_discovery_run_id`
- invalid source ID -> `invalid_discovery_source_id`

### Step 4 — Validate source and candidate URLs

Validate the source URL and candidate website URL before constructing the normalizer input.

Recommended implementation options:

1. Use `validateDiscoveryUrlSafety(...)` for pre-validation and then pass the values to `normalizeDiscoveryCandidate(...)`.
2. Or rely on `normalizeDiscoveryCandidate(...)`, while preserving enough field context to map URL failures to source-vs-candidate failure codes.

Preferred first implementation:

- pre-validate both URLs with existing URL safety helpers where possible;
- require HTTPS;
- reject credentials;
- reject blocked hostnames/IPs;
- preserve safe normalized URLs.

Failure codes:

- invalid/unsafe source URL -> `invalid_source_url`
- invalid/unsafe candidate website URL -> `invalid_candidate_website_url`

### Step 5 — Validate category and pricing hints

Use existing project constants where possible:

- categories must match `TOOL_CATEGORIES`;
- pricing must match current candidate normalizer pricing values:
  - `Free + Paid`
  - `Free`
  - `Paid`

Implementation should not use `normalizeToolCategory(...)` with a fallback for this mapper because fallback could silently change extraction evidence. Candidate extraction should fail or explicitly omit invalid optional hints rather than convert them into an unrelated category.

Recommended first implementation:

- provided invalid category -> `invalid_category`
- provided invalid pricing -> `invalid_pricing`
- omitted category/pricing -> pass `null`/undefined to the normalizer.

### Step 6 — Bound text and arrays through the normalizer

The mapper should delegate final length/content enforcement to `normalizeDiscoveryCandidate(...)`.

Current normalizer limits include:

- URL length: 2048
- domain length: 255
- candidate name length: 160
- short text length: 80
- evidence locator length: 160
- long text length: 1000
- general array cap: 12
- risk/duplicate flag cap: 16

The mapper may pre-check obvious raw payloads for clearer failure codes, but it should not duplicate all normalizer logic unless needed.

Normalizer rejection mapping:

- `field_too_long` -> `field_too_long`
- `unsafe_content` -> `unsafe_payload`
- `unsupported_category_hint` -> `invalid_category`
- `unsupported_pricing_hint` -> `invalid_pricing`
- `unsupported_confidence_bucket` -> `invalid_confidence_bucket`
- `invalid_audit_correlation_id` -> `invalid_audit_correlation_id`
- unrecognized rejection -> `normalization_failed`

### Step 7 — Reject raw or unsafe payloads

The future implementation should reject obvious unsafe content before returning success.

Payloads that must not pass:

- raw HTML;
- script-like text;
- stack traces;
- secrets;
- cookies;
- authorization headers;
- service-role/admin tokens;
- raw JSON dumps;
- LLM prompts;
- LLM responses;
- full public/discovered tool payloads;
- raw source blobs.

Failure code:

```text
unsafe_payload
```

### Step 8 — Build the normalizer input

Construct `DiscoveryCandidateNormalizerInput` using snake_case fields:

```ts
const normalizerInput = {
  discovery_run_id: trimmedDiscoveryRunId,
  source_url: trimmedSourceUrl,
  source_evidence_locator: input.sourceEvidenceLocator,
  candidate_name: trimmedCandidateName,
  candidate_website_url: trimmedCandidateWebsiteUrl,
  candidate_description: input.candidateDescription,
  candidate_category_hint: input.candidateCategoryHint,
  candidate_pricing_hint: input.candidatePricingHint,
  candidate_platform_hints: input.candidatePlatformHints,
  candidate_social_links: input.candidateSocialLinks,
  candidate_app_links: input.candidateAppLinks,
  evidence_summary: input.evidenceSummary,
  confidence_bucket: input.confidenceBucket,
  risk_flags: input.riskFlags,
  duplicate_check_status: input.duplicateAdvisory?.duplicateCheckStatus,
  duplicate_signal_types: input.duplicateAdvisory?.duplicateSignalTypes,
  duplicate_blocking: input.duplicateAdvisory?.duplicateBlocking,
  possible_duplicate_tool_id: input.duplicateAdvisory?.possibleDuplicateToolId,
  possible_duplicate_discovered_tool_id:
    input.duplicateAdvisory?.possibleDuplicateDiscoveredToolId,
  possible_duplicate_candidate_id:
    input.duplicateAdvisory?.possibleDuplicateCandidateId,
  audit_correlation_id: resolvedAuditCorrelationId,
};
```

The implementation should pass only allowlisted keys.

### Step 9 — Preserve or generate audit correlation

The staging helper requires `normalizedCandidate.audit_correlation_id`.

Recommended implementation:

- if `auditCorrelationId` is provided, validate it before calling the normalizer;
- if absent, generate a UUID with `crypto.randomUUID()`;
- include `audit_correlation_id` in the normalizer input;
- add warning `audit_correlation_generated` when generated;
- return `invalid_audit_correlation_id` for invalid provided UUID;
- return `audit_correlation_unavailable` if UUID generation unexpectedly fails.

No audit event should be written.

### Step 10 — Call the current normalizer

Call:

```ts
normalizeDiscoveryCandidate(normalizerInput)
```

If it returns `ok: false`, map its `rejection_code` to the mapper failure code plan.

If it returns `ok: true`, ensure:

- candidate exists;
- candidate has `candidate_status === "staged"`;
- candidate has `discovery_run_id === trimmedDiscoveryRunId`;
- candidate has `audit_correlation_id`;
- candidate has static evidence mode values expected by the staging helper.

Unexpected shape mismatch should return `internal_mapping_error`.

### Step 11 — Construct StageNormalizedDiscoveryCandidateInput

Return:

```ts
{
  ok: true,
  stagingInput: {
    discoveryRunId: trimmedDiscoveryRunId,
    discoverySourceId: trimmedDiscoverySourceId,
    normalizedCandidate: normalized.candidate,
  },
  warnings,
}
```

The mapper should not set `actorId` in the first implementation unless a future orchestration phase defines actor behavior.

### Step 12 — Never stage from the mapper

The mapper must not call:

```ts
stageNormalizedDiscoveryCandidate(...)
```

or:

```ts
stageNormalizedDiscoveryCandidateWithClientFactory(...)
```

The mapper must not import/create Supabase clients.

## 8. Exact mapping table

| Future input field | Normalization rule | Output `StageNormalizedDiscoveryCandidateInput` field | Failure code | Notes |
| --- | --- | --- | --- | --- |
| `discoveryRunId` | Trim, require UUID-like value | `discoveryRunId`; `normalizedCandidate.discovery_run_id` | `missing_discovery_run_id`, `invalid_discovery_run_id` | Must come from approved run context |
| `discoverySourceId` | Trim, require UUID-like value | `discoverySourceId` | `missing_discovery_source_id`, `invalid_discovery_source_id` | Later persisted by staging helper as `discovery_source_id` |
| `sourceUrl` | Trim, require safe HTTPS URL | `normalizedCandidate.source_url`, `source_url_normalized`, `source_domain` | `missing_source_url`, `invalid_source_url` | Use normalizer URL canonicalization/tracking stripping |
| `sourceEvidenceLocator` | Bounded optional text | `normalizedCandidate.source_evidence_locator` | `field_too_long`, `unsafe_payload` | Reference only; never raw HTML |
| `candidateName` | Trim/collapse, required, bounded, no unsafe content | `normalizedCandidate.candidate_name` | `missing_candidate_name`, `field_too_long`, `unsafe_payload` | Must not be raw title dump |
| `candidateWebsiteUrl` | Trim, require safe HTTPS URL | `candidate_website_url`, `candidate_canonical_url`, `candidate_normalized_domain` | `missing_candidate_website_url`, `invalid_candidate_website_url` | Candidate URL for duplicate comparison |
| `candidateDescription` | Bounded optional text | `candidate_description` | `field_too_long`, `unsafe_payload` | No raw body/snippets |
| `candidateCategoryHint` | Must match `TOOL_CATEGORIES` if provided | `candidate_category_hint` | `invalid_category` | Do not fallback to a different category |
| `candidatePricingHint` | Must be `Free + Paid`, `Free`, or `Paid` if provided | `candidate_pricing_hint` | `invalid_pricing` | No arbitrary pricing text |
| `candidatePlatformHints` | Bounded string array | `candidate_platform_hints` | `field_too_long`, `unsafe_payload` | Normalizer dedupes |
| `candidateSocialLinks` | Bounded safe HTTPS URL array | `candidate_social_links` | `invalid_candidate_website_url`, `field_too_long` | Consider a later link-specific code only if needed |
| `candidateAppLinks` | Bounded safe HTTPS URL array | `candidate_app_links` | `invalid_candidate_website_url`, `field_too_long` | No deep-link/executable protocols |
| `evidenceSummary` | Bounded optional text | `evidence_summary` | `field_too_long`, `unsafe_payload` | Summary only, not raw evidence |
| `confidenceBucket` | `low`, `medium`, `high`, or null | `confidence_bucket` | `invalid_confidence_bucket` | Advisory only |
| `riskFlags` | Bounded safe labels | `risk_flags` | `field_too_long`, `unsafe_payload` | Advisory only |
| `duplicateAdvisory.duplicateCheckStatus` | Current normalizer statuses | `duplicate_check_status` | `normalization_failed` or future duplicate-specific code | Advisory only |
| `duplicateAdvisory.duplicateSignalTypes` | Bounded safe labels | `duplicate_signal_types` | `field_too_long`, `unsafe_payload` | Advisory only |
| `duplicateAdvisory.duplicateBlocking` | Boolean | `duplicate_blocking` | none expected | Advisory only |
| `duplicateAdvisory.possibleDuplicateToolId` | Positive integer or null | `possible_duplicate_tool_id` | `normalization_failed` if strict validation added | Does not write `public.tools` |
| `duplicateAdvisory.possibleDuplicateDiscoveredToolId` | UUID or null | `possible_duplicate_discovered_tool_id` | `normalization_failed` if strict validation added | Does not write `discovered_tools` |
| `duplicateAdvisory.possibleDuplicateCandidateId` | UUID or null | `possible_duplicate_candidate_id` | `normalization_failed` if strict validation added | Advisory staging link only |
| `auditCorrelationId` | Provided valid UUID or generated UUID | `normalizedCandidate.audit_correlation_id`; result metadata | `invalid_audit_correlation_id`, `audit_correlation_unavailable` | No audit event write |

## 9. Failure code plan

Recommended stable mapper failure codes:

- `missing_discovery_run_id`
- `missing_discovery_source_id`
- `missing_source_url`
- `missing_candidate_name`
- `missing_candidate_website_url`
- `invalid_discovery_run_id`
- `invalid_discovery_source_id`
- `invalid_source_url`
- `invalid_candidate_website_url`
- `invalid_category`
- `invalid_pricing`
- `invalid_confidence_bucket`
- `invalid_audit_correlation_id`
- `audit_correlation_unavailable`
- `unsafe_payload`
- `field_too_long`
- `normalization_failed`
- `internal_mapping_error`

Recommended mapping from current normalizer rejections:

| Normalizer rejection | Mapper failure |
| --- | --- |
| `missing_discovery_run_id` | `missing_discovery_run_id` |
| `missing_source_url` | `missing_source_url` |
| `missing_name` | `missing_candidate_name` |
| `missing_website_url` | `missing_candidate_website_url` |
| `invalid_url` from source pre-validation | `invalid_source_url` |
| `invalid_url` from candidate pre-validation | `invalid_candidate_website_url` |
| `non_https_url` from source pre-validation | `invalid_source_url` |
| `non_https_url` from candidate pre-validation | `invalid_candidate_website_url` |
| `unsafe_domain` from source pre-validation | `invalid_source_url` |
| `unsafe_domain` from candidate pre-validation | `invalid_candidate_website_url` |
| `field_too_long` | `field_too_long` |
| `unsafe_content` | `unsafe_payload` |
| `unsupported_category_hint` | `invalid_category` |
| `unsupported_pricing_hint` | `invalid_pricing` |
| `unsupported_confidence_bucket` | `invalid_confidence_bucket` |
| `invalid_audit_correlation_id` | `invalid_audit_correlation_id` |
| `normalization_failed` | `normalization_failed` |

The implementation should keep returned messages generic, for example:

```text
Candidate extraction mapper input is invalid.
```

or field-specific but safe:

```text
Candidate website URL is invalid.
```

Messages must not echo the raw invalid value.

## 10. Logging and error safety plan

The future mapper should not log by default.

If future orchestration logs mapper results, logs may include:

- safe failure code;
- safe warning code;
- trimmed `discoveryRunId`;
- trimmed `discoverySourceId`;
- `auditCorrelationId`;
- no full candidate payload.

Logs must not include:

- raw extraction input;
- raw HTML;
- raw evidence;
- source blobs;
- screenshots;
- prompts;
- model responses;
- cookies;
- headers;
- secrets;
- service-role keys;
- raw DB errors;
- stack traces;
- public/discovered tool payload dumps.

The mapper should use structured codes, not raw thrown error text, for expected failure paths.

## 11. Future test implementation plan

Recommended future test file:

```text
testing/discovery-candidate-extraction-mapper.test.mjs
```

The test should use `testing/register-typescript-test-loader.mjs` like existing TypeScript-backed `.mjs` tests.

### Required tests

1. Valid minimal mapping returns `ok: true`.
2. Valid minimal mapping returns a `StageNormalizedDiscoveryCandidateInput`-compatible object.
3. Valid mapping preserves trimmed `discoveryRunId`.
4. Valid mapping preserves trimmed `discoverySourceId`.
5. Valid mapping sets `normalizedCandidate.discovery_run_id` equal to the trimmed run ID.
6. Valid mapping includes `normalizedCandidate.audit_correlation_id`.
7. Valid mapping preserves provided `auditCorrelationId`.
8. Valid mapping generates an audit correlation ID when omitted.
9. Valid mapping returns `audit_correlation_generated` warning when generated.
10. Missing `discoveryRunId` fails.
11. Missing `discoverySourceId` fails.
12. Missing `sourceUrl` fails.
13. Missing `candidateName` fails.
14. Missing `candidateWebsiteUrl` fails.
15. Invalid source URL fails with `invalid_source_url`.
16. Invalid candidate website URL fails with `invalid_candidate_website_url`.
17. Invalid category fails with `invalid_category`.
18. Invalid pricing fails with `invalid_pricing`.
19. Invalid confidence bucket fails with `invalid_confidence_bucket`.
20. Unsafe raw HTML content fails with `unsafe_payload`.
21. Secret-like content fails with `unsafe_payload`.
22. Prompt-like content fails with `unsafe_payload`.
23. Field too long fails with `field_too_long`.
24. Duplicate advisory fields map into normalized candidate advisory fields.
25. Duplicate advisory returns `duplicate_advisory_present` warning.
26. Output never has `candidate_status` other than `"staged"`.
27. Output never includes raw HTML, raw payload, or unsupported metadata blob.
28. Mapper does not call `stageNormalizedDiscoveryCandidate(...)`.
29. Mapper does not import/create Supabase clients.
30. Mapper performs no DB operations.

### Regression tests to keep green

Future mapper implementation should also run:

```bash
node testing/discovery-candidate-normalizer.test.mjs
node testing/discovery-candidate-staging-admin.test.mjs
```

## 12. Future verification workflow

Future implementation phase should run:

```bash
node testing/discovery-candidate-extraction-mapper.test.mjs
node testing/discovery-candidate-normalizer.test.mjs
node testing/discovery-candidate-staging-admin.test.mjs
npm run check
npm run smoke:discovery-candidate-staging:rls
git diff --check
git status --short --branch
git diff --stat
```

The RLS smoke command must remain opt-out only in the mapper implementation phase. Do not set:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```

No live DB smoke should run until a separate approved live smoke gate.

## 13. Implementation sequencing

Recommended sequence:

1. Phase 10D — Candidate Extraction Mapper Implementation
   - add `lib/discovery/discovery-candidate-extraction-mapper.ts`;
   - add `testing/discovery-candidate-extraction-mapper.test.mjs`;
   - implement pure mapper only;
   - run mocked/local tests only;
   - do not call staging helper from mapper;
   - do not run live DB smoke.
2. Phase 10E — Candidate Extraction Mapper Review / Commit
   - Gemini review;
   - commit approved mapper/test files only.
3. Phase 10F — Candidate Extraction Staging Pipeline Integration Plan
   - plan how an approved orchestration layer calls mapper then staging helper.
4. Phase 10G — Candidate Extraction Staging Pipeline Implementation
   - implement orchestration only after review.
5. Phase 10H — Candidate Extraction Live Smoke Gate
   - plan exact fixtures, command, and cleanup before any live DB execution.

No staging pipeline integration should be added in Phase 10D.

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Mapper accidentally writes data | Keep mapper pure and forbid Supabase/staging helper imports. Test that no client/helper call occurs. |
| Mapper silently changes invalid category through fallback | Do not use fallback category normalization for extraction evidence. Reject invalid provided category. |
| Mapper loses source lineage | Require `discoverySourceId`; preserve it in `StageNormalizedDiscoveryCandidateInput`. |
| Mapper returns candidate without audit correlation | Generate or validate `auditCorrelationId` before normalizer success. Assert success output has it. |
| Mapper leaks raw evidence in errors | Use structured codes and generic messages; tests should scan failure serialization. |
| Duplicate advisory becomes duplicate decision | Map duplicate fields only; no approval/rejection/publish behavior. |
| LLM/crawler behavior creeps into mapper | Keep mapper input-only and deterministic. LLM/crawler phases remain separate. |
| Future live smoke runs too early | Phase 10D should run only mocked/local tests and safe opt-out RLS smoke. |

## 15. Safety boundaries for Phase 10C

Phase 10C preserves these boundaries:

- no mapper implementation;
- no TypeScript source interfaces added;
- no tests added;
- no source code changes;
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

## 16. Recommended next phase

Recommended next phase:

```text
Phase 10D — Candidate Extraction Mapper Implementation
```

Phase 10D should implement only the pure mapper module and mocked/local mapper tests. It should not integrate with staging orchestration, API routes, UI, crawler automation, LLM behavior, audit writes, or live DB smoke.
