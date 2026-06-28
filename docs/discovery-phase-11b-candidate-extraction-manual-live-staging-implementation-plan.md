# Discovery Phase 11B — Candidate Extraction Manual Live Staging Implementation Plan

## 1. Title and Phase Summary

Phase 11B is a docs-only implementation plan for a possible future manual admin-triggered live candidate staging implementation.

This phase does not implement code.

This phase does not enable `dry_run: false`.

This phase does not authorize live database writes.

This phase does not run live staging.

This phase only translates the Phase 11A contract into a precise future implementation plan for Phase 11C.

All live staging approval phrases remain inactive.

## 2. Current State Recap

Latest pushed commit:

```text
627c2eb Document extraction live staging contract
```

Phase 11A documented the manual live staging contract.

Confirmed future target table:

```text
public.discovery_candidate_tools
```

Confirmed mutation boundary:

- future initial mutation scope is insert-only unless later approved;
- no upsert by default;
- candidate status must remain:

```text
candidate_status = "staged"
```

Current live-staging boundary:

- `dry_run: false` remains blocked;
- no live staging write has been authorized;
- current internal invocation helper rejects `dry_run: false` with `live_invocation_not_enabled`;
- current admin API route is dry-run-only;
- current admin UI sends only `dry_run: true`;
- current admin UI live dry-run verification passed, but production writes remain blocked.

Placeholder approval phrase remains inactive:

```text
Approve run candidate extraction live staging write
```

## 3. Implementation Objective for Future Phase 11C

Future Phase 11C should add a guarded manual live-staging code path for candidate extraction.

The future implementation objective is:

- keep public publishing impossible;
- stage into `public.discovery_candidate_tools` only;
- keep initial scope capped to `max_candidates: 1`;
- require trusted `discovery_source_id` and `discovery_run_id`;
- preserve `audit_correlation_id`;
- keep all client identity server-derived;
- return safe summaries only;
- keep `public.tools` untouched;
- keep `discovered_tools` untouched;
- keep crawler, LLM, background, scheduled, and autonomous execution out of scope.

This is future implementation planning only. Phase 11B does not change runtime behavior.

## 4. Future Files Likely to Change

Likely future Phase 11C files:

```text
lib/discovery/discovery-candidate-extraction-invocation.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
```

Likely supporting test files if the implementation touches or wraps mapper/staging behavior:

```text
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-staging-admin.test.mjs
```

Likely existing implementation modules to reuse, but not necessarily modify:

```text
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-candidate-extraction-mapper.ts
lib/discovery-candidate-normalizer.ts
lib/discovery/discovery-supabase-admin.ts
```

Admin UI should remain dry-run-only in Phase 11C.

UI live mode should be deferred to a later separate UI live-staging phase after helper/route behavior is implemented and reviewed.

## 5. Future Files That Must Not Change in Phase 11C Unless Separately Approved

Future Phase 11C should avoid these files and areas unless a later gate explicitly expands scope:

- public homepage;
- public submit flow;
- crawler executor;
- LLM/extraction automation;
- scheduled jobs;
- background jobs;
- Supabase migrations;
- generated Supabase types;
- package/dependency files;
- broad admin UI redesign;
- public `tools` data model;
- `discovered_tools` write behavior;
- public tool publishing workflow;
- homepage control room;
- public category/search/compare pages.

## 6. Server-Side Live-Staging Gate Design

`dry_run: false` must continue to reject unless a server-controlled live staging gate is explicitly enabled.

Requirements:

- the gate must not be controlled by the client request body;
- the gate must not rely on user-provided text alone;
- the gate must be checked server-side only;
- default behavior must be fail-closed;
- tests must prove the gate rejects by default;
- the placeholder phrase remains inactive in Phase 11B;
- future exact approval must define exactly how the gate is enabled for a specific verification scope.

Gate mechanisms evaluated:

### Option A — Internal helper option only

The invocation helper accepts a second server-created options/dependencies argument, for example a narrowly typed live-staging gate object and mocked staging dependencies for tests.

Pros:

- cannot be enabled by request body alone;
- easy to unit test default rejection;
- route can keep production default disabled;
- avoids environment-variable dependence for ordinary code paths;
- supports dependency injection for mocked staging tests without live DB writes.

Cons:

- route implementation must be careful never to pass an enabled gate except in a future approved verification mode;
- requires adding new types and tests around the helper boundary.

### Option B — Server-only environment variable

A server-only environment variable enables live staging for controlled local verification.

Pros:

- simple operational switch;
- familiar pattern from existing opt-in smoke harnesses.

Cons:

- easier to misconfigure in a deployed environment;
- environment state can be harder to prove from unit tests;
- risks broad enablement if the variable is not scoped to one verification run;
- must not be used before a later live staging gate approves exact scope.

### Option C — Route-level constant defaulting disabled

The route contains a server-only constant that defaults to disabled.

Pros:

- simple fail-closed behavior;
- no runtime config needed.

Cons:

- enabling it requires code modification;
- not suitable for a one-time live verification without another commit;
- can be awkward for testing route acceptance with the gate enabled.

### Option D — Explicit test-only injection

Tests import internal functions with mocked gate/dependency objects while production route always remains disabled.

Pros:

- safest for unit tests;
- prevents accidental live writes during implementation.

Cons:

- does not by itself implement an operational live staging path.

Recommended Phase 11C approach:

- use Option A for the helper: a second server-created options/dependencies argument with a default disabled live-staging gate;
- use Option D in tests: test-only injected gate and mocked staging dependency;
- keep the route default disabled;
- do not use a live environment variable in Phase 11C unless a later Phase 11D verification gate explicitly approves an opt-in mechanism.

This lets Phase 11C implement and test the contract while still avoiding live DB writes.

## 7. Invocation Helper Implementation Plan

Future Phase 11C should modify:

```text
lib/discovery/discovery-candidate-extraction-invocation.ts
```

Current confirmed behavior:

- `CANDIDATE_EXTRACTION_INVOCATION_SCHEMA_VERSION = "candidate_extraction_invocation.v1"`;
- `CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES = 25`;
- `CandidateExtractionInvocationInput` requires `invoked_by_admin_user_id`;
- `validateInvocationInput(...)` rejects `dry_run: false` with `live_invocation_not_enabled`;
- `invokeCandidateExtractionStagingPipeline(...)` returns accepted safe dry-run summaries only;
- current helper does not import Supabase, read environment values, create clients, call mapper/staging, or write DB rows.

Future helper plan:

- keep existing dry-run behavior unchanged;
- preserve `live_invocation_not_enabled` by default;
- add a live-staging branch that can execute only when a server-created gate is enabled;
- enforce `max_candidates: 1` for live staging, even though dry-run currently allows up to `CANDIDATE_EXTRACTION_INVOCATION_MAX_CANDIDATES`;
- enforce `source_scope: "single_run"` for live staging;
- require valid `discovery_source_id`, `discovery_run_id`, and `audit_correlation_id`;
- require non-empty `invocation_reason`;
- require server-derived `invoked_by_admin_user_id`;
- reject client-supplied identity at the route before calling the helper;
- keep safe `CandidateExtractionInvocationResult` response shape or a reviewed extension of it;
- report validation failures and duplicate/eligibility skips safely;
- keep `no_public_write_confirmed: true`;
- keep `no_discovered_write_confirmed: true`;
- never echo raw extraction payloads;
- never expose raw HTML;
- never expose service-role details, secrets, stack traces, credentials, cookies, tokens, CSRF values, or environment values.

Important implementation gap:

The current request contract does not include extraction payload fields, and the current live staging pipeline requires `CandidateExtractionMapperInput` values such as `sourceUrl`, `candidateName`, and `candidateWebsiteUrl`.

Phase 11C must not invent client-supplied extraction payload behavior. It must either:

- use a server-side, trusted source of exactly one extraction candidate input, if already available and confirmed; or
- keep the live-staging branch implemented behind mocked/test-only dependencies only; or
- document the missing trusted extraction-input source as a blocker for real live staging execution.

If no trusted source of `CandidateExtractionMapperInput` exists, Phase 11C must not run or expose live staging beyond unit-tested, mocked behavior.

## 8. API Route Implementation Plan

Future Phase 11C should modify:

```text
app/api/admin/discovery/candidate-extraction/invoke/route.ts
```

Current confirmed route behavior:

- `POST` only;
- `runtime = "nodejs"`;
- `dynamic = "force-dynamic"`;
- verifies admin session with `verifyAdminSession(request)`;
- verifies CSRF with `verifyAdminCsrfRequest(request)`;
- rate limits with `ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateExtractionInvocation`;
- rejects `invoked_by_admin_user_id` from client body with `client_admin_identity_not_allowed`;
- rejects unsupported fields with `unsupported_request_field`;
- derives admin actor using `getServerDerivedAdminActorId(adminSession.actor)`;
- passes server-derived `invoked_by_admin_user_id` to the helper;
- returns safe JSON with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`;
- currently returns helper rejection for `dry_run: false`.

Future route plan:

- admin session verification stays required;
- CSRF stays required;
- rate limit stays required;
- request validation stays strict;
- route derives admin identity server-side;
- route must never accept `invoked_by_admin_user_id`;
- route passes only safe server-derived identity to the helper;
- route keeps `dry_run: false` blocked unless a server-side gate permits it;
- route returns sanitized responses only;
- route must not expose service-role details;
- route must not leak stack traces;
- route must preserve existing dry-run behavior.

Recommended route change for Phase 11C:

- add a server-created helper options object that defaults to live staging disabled;
- do not add new allowed request fields for live extraction payloads;
- keep `ALLOWED_BODY_FIELDS` unchanged unless a later approved contract adds fields;
- do not create Supabase clients inside the route;
- if the route ever passes an enabled live gate, that must be explicitly controlled by a future Phase 11D verification gate.

## 9. Supabase Service-Role Usage Plan

Confirmed existing service-role pattern:

```text
lib/discovery/discovery-supabase-admin.ts
```

Confirmed exports:

- `createDiscoverySupabaseAdminClient()`;
- `DiscoverySupabaseAdminClient`.

Confirmed behavior:

- module is `server-only`;
- uses `@supabase/supabase-js`;
- reads `NEXT_PUBLIC_SUPABASE_URL`;
- reads `SUPABASE_SERVICE_ROLE_KEY`;
- throws `Missing Discovery Engine Supabase environment variables` if required values are missing;
- does not perform database operations by itself.

Confirmed staging helper pattern:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

- module is `server-only`;
- default staging path lazily imports `createDiscoverySupabaseAdminClient`;
- `stageNormalizedDiscoveryCandidateWithClientFactory(...)` supports injecting a mocked client factory for tests;
- current write scope is `.from("discovery_candidate_tools").insert(insertPayload)`.

Future Phase 11C requirements:

- service-role access must remain server-side only;
- use the existing `createDiscoverySupabaseAdminClient()` pattern only through server-only helper code;
- no service-role values in the client bundle;
- no logging service-role values;
- no returning service-role details;
- no raw environment leakage;
- fail closed when required environment values are missing;
- use typed/safe insert payloads;
- minimal write scope: `public.discovery_candidate_tools`;
- no public `tools` writes;
- no `discovered_tools` writes;
- no migrations in Phase 11C unless separately approved.

Recommended implementation:

- keep route free of Supabase client creation;
- let the helper/live branch call existing `stageMappedExtractionCandidate(...)` or an injected equivalent;
- use dependency injection in tests to avoid live DB credentials and live DB writes;
- do not import `lib/discovery/discovery-supabase-admin.ts` from client components or route tests.

## 10. Candidate Staging Mutation Plan

Future mutation behavior:

- insert-only for first implementation unless later approved;
- target table:

```text
public.discovery_candidate_tools
```

- candidate status:

```text
staged
```

- exactly one trusted source/run context;
- initial cap `max_candidates: 1`;
- no upsert unless a later gate approves.

Confirmed source/run linkage fields:

- `discovery_run_id`;
- `discovery_source_id`.

Confirmed audit correlation field:

- `audit_correlation_id`.

Schema version field:

- request field is `schema_version`;
- staging table uses `extraction_version`;
- no confirmed `schema_version` column exists on `public.discovery_candidate_tools`;
- separate staging row schema-version field is `TBD / requires schema confirmation`.

Confirmed normalized candidate fields:

- `candidate_name`;
- `candidate_website_url`;
- `candidate_canonical_url`;
- `candidate_normalized_domain`;
- `candidate_description`;
- `candidate_category_hint`;
- `candidate_pricing_hint`;
- `candidate_platform_hints`;
- `candidate_social_links`;
- `candidate_app_links`.

Confirmed evidence/provenance fields:

- `source_url`;
- `source_url_normalized`;
- `source_domain`;
- `source_evidence_kind`;
- `source_evidence_locator`;
- `evidence_summary`;
- `extraction_mode`;
- `extraction_version`.

Confirmed duplicate/eligibility fields:

- `duplicate_check_status`;
- `duplicate_signal_types`;
- `duplicate_blocking`;
- `possible_duplicate_tool_id`;
- `possible_duplicate_discovered_tool_id`;
- `possible_duplicate_candidate_id`;
- `duplicate_checked_at`;
- `confidence_bucket`;
- `risk_flags`.

Confirmed lifecycle/review/cleanup fields:

- `candidate_status`;
- `reviewed_at`;
- `reviewed_by`;
- `review_notes`;
- `rejection_reason_code`;
- `cleanup_status`;
- `eligible_for_cleanup_at`;
- `archived_at`;
- `created_at`;
- `updated_at`.

Fields never accepted from the client:

- `id`;
- `candidate_status`;
- `reviewed_at`;
- `reviewed_by`;
- `review_notes`;
- `rejection_reason_code`;
- `cleanup_status`;
- `eligible_for_cleanup_at`;
- `archived_at`;
- `created_at`;
- `updated_at`;
- duplicate system fields unless produced by server-side duplicate checks;
- admin identity;
- service-role or environment values.

## 11. Normalized Candidate Mapping Plan

Future mapping should reuse:

```text
mapExtractionToStagingCandidate(...)
stageMappedExtractionCandidate(...)
stageNormalizedDiscoveryCandidate(...)
```

Confirmed `CandidateExtractionMapperInput` source fields:

- `discoveryRunId`;
- `discoverySourceId`;
- `sourceUrl`;
- `sourceEvidenceLocator`;
- `candidateName`;
- `candidateWebsiteUrl`;
- `candidateDescription`;
- `candidateCategoryHint`;
- `candidatePricingHint`;
- `candidatePlatformHints`;
- `candidateSocialLinks`;
- `candidateAppLinks`;
- `evidenceSummary`;
- `confidenceBucket`;
- `riskFlags`;
- `duplicateAdvisory`;
- `auditCorrelationId`.

Confirmed mapping:

- candidate/tool name maps to `candidate_name`;
- website maps to `candidate_website_url`;
- canonical website URL maps to `candidate_canonical_url`;
- normalized website domain maps to `candidate_normalized_domain`;
- description/summary maps to `candidate_description`;
- category/taxonomy maps to `candidate_category_hint`;
- pricing maps to `candidate_pricing_hint`;
- platform links map to `candidate_platform_hints`;
- social links map to `candidate_social_links`;
- app links map to `candidate_app_links`;
- source URL maps to `source_url`;
- normalized source URL maps to `source_url_normalized`;
- source domain maps to `source_domain`;
- source evidence locator maps to `source_evidence_locator`;
- evidence references/summary map to `evidence_summary`;
- confidence maps to `confidence_bucket`;
- risk flags map to `risk_flags`;
- duplicate indicators map through `duplicateAdvisory` into duplicate fields;
- discovery source/run linkage maps to `discovery_source_id` and `discovery_run_id`;
- audit correlation ID maps to `audit_correlation_id`;
- candidate status remains `staged`;
- extraction version maps to `extraction_version`.

Unknown or deferred mapping:

- persisted row field for invocation `schema_version`: `TBD / requires schema confirmation`;
- source of real extraction candidates for live staging request: `TBD / requires implementation confirmation`;
- whether skipped/rejected candidates produce separate persistence records: `TBD / requires future contract`.

## 12. Duplicate and Quality Guard Implementation Plan

Future pre-mutation checks:

- canonical URL duplicate check;
- normalized domain duplicate check;
- normalized name duplicate check;
- existing staging duplicate check;
- existing public `tools` duplicate check;
- existing `discovered_tools` duplicate check;
- required field validation;
- minimum quality threshold;
- provenance/evidence required;
- safe skipped result;
- no mutation if candidate fails required guard;
- duplicate/validation rejection counts in safe response.

Confirmed existing guard coverage:

- normalizer validates required run ID, source URL, candidate website URL, candidate name, HTTPS URLs, category hint, pricing hint, confidence bucket, safe text, array bounds, UUID audit correlation, and unsafe payload patterns;
- mapper validates source/run IDs, source URL, candidate website URL, candidate name, category, pricing, confidence, audit correlation, and unsafe/normalization failures;
- staging table has unique index `discovery_candidate_tools_run_canonical_active_uidx` on `(discovery_run_id, candidate_canonical_url)` for active statuses.

Likely new helper functions required:

- existing public `tools` duplicate check;
- existing `discovered_tools` duplicate check;
- staging duplicate read/check by `discovery_run_id` and `candidate_canonical_url`;
- optional normalized-domain/name advisory checks;
- safe duplicate summary builder.

These checks should be server-side only and should not expose raw rows or raw payloads in responses.

## 13. Audit Implementation Plan

Future audit behavior should record:

- action name;
- server-derived admin identity;
- source/run IDs;
- `dry_run` value;
- max candidate cap;
- audit correlation ID;
- candidate count attempted;
- candidate count staged;
- candidate count skipped;
- duplicate rejection count;
- validation rejection count;
- safety flags;
- sanitized failure details;
- cleanup/rollback details if applicable.

Confirmed audit table:

```text
public.discovery_audit_events
```

Confirmed fields:

- `id`;
- `discovered_tool_id`;
- `action`;
- `actor_id`;
- `actor_label`;
- `message`;
- `metadata`;
- `created_at`.

Confirmed candidate-staging action values:

- `candidate-staged`;
- `candidate-stage-failed`;
- `candidate-duplicate-hint-recorded`;
- `candidate-cleanup-performed`.

Audit helper status:

- exact candidate-extraction audit write helper is not confirmed;
- future implementation location is `TBD / requires code confirmation`;
- no `discovery_candidate_tool_id` column is confirmed on `public.discovery_audit_events`;
- staged candidate references may need sanitized `metadata`, or a future schema change must be separately designed.

Audit must never log:

- raw HTML;
- raw extracted payloads;
- secrets;
- service-role details;
- credentials;
- cookies, tokens, or CSRF values;
- environment values;
- stack traces;
- unredacted unexpected errors.

Phase 11C should not add audit writes unless the future implementation prompt explicitly includes them. If audit writes are added, they must be sanitized, unit tested, and reviewed separately.

## 14. Rollback and Cleanup Implementation Plan

Future implementation must support or document before any live write verification:

- exact-ID cleanup helper or documented query;
- cleanup limited to test-created candidate staging rows;
- cleanup by exact candidate IDs and/or audit correlation ID;
- orphan-row detection;
- partial failure behavior;
- duplicate conflict behavior;
- validation failure behavior;
- audit preservation by default unless a future gate approves cleanup;
- cleanup verification output;
- result documentation requirement.

Recommended Phase 11C behavior:

- implement cleanup only as test/mocked helper behavior unless the implementation prompt explicitly authorizes a live cleanup path;
- never run cleanup against a live database in Phase 11C;
- no cleanup or DB write runs in Phase 11B.

If a future live verification creates test candidate rows, cleanup must be exact-ID only and must stop/report if verification fails.

## 15. Read-After-Write Verification Implementation Plan

Future verification must check:

- exact row count;
- correct candidate ID(s);
- correct `discovery_source_id`;
- correct `discovery_run_id`;
- correct `audit_correlation_id` if schema supports it;
- correct `candidate_status`;
- correct `extraction_version`;
- correct `schema_version` only if a schema field exists or route/helper result explicitly reports it;
- no public `tools` rows;
- no `discovered_tools` rows;
- no unexpected row count changes;
- no raw payload leakage;
- safe UI/route summary matches DB state if UI is used;
- cleanup verified if live verification creates test rows.

Read-after-write checks must not use remote SQL, Supabase CLI DB queries, or database reads unless a future verification gate explicitly approves those actions.

## 16. Test Implementation Plan

Future Phase 11C tests should cover:

- helper rejects `dry_run: false` by default;
- route rejects `dry_run: false` by default;
- helper accepts `dry_run: false` only with future server-side gate in test context;
- route accepts `dry_run: false` only with future server-side gate in controlled test context;
- client-supplied admin identity rejected;
- server-derived admin identity path;
- `max_candidates: 1` enforced for live staging;
- `source_scope: "single_run"` enforced for live staging;
- staging insert payload maps fields correctly;
- no public `tools` write attempted;
- no `discovered_tools` write attempted;
- duplicate guard skip behavior;
- validation guard skip behavior;
- audit metadata sanitized, if audit writes are implemented;
- errors sanitized;
- rollback/cleanup helper behavior, if implemented;
- safe response shape;
- existing dry-run behavior unchanged.

Existing tests to preserve and extend:

```text
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-staging-admin.test.mjs
```

Phase 11C tests should prefer mocked/stubbed Supabase clients and injected staging dependencies. They must not require live DB credentials.

## 17. UI Implementation Decision

Recommendation: keep admin UI dry-run-only in Phase 11C unless a separate UI live-staging phase is explicitly approved.

Reasons:

- reduces accidental live write risk;
- lets helper/route contract be tested first;
- preserves the current verified dry-run UX;
- live UI needs separate warnings, prepare step, final confirmation, and double-submit protections;
- live UI should not be hidden inside the existing dry-run panel.

Any future UI live-staging phase should occur only after helper/route implementation, verification planning, and Gemini review.

## 18. Future Live Verification Gate

Phase 11D must define before any live write:

- exact command or UI action;
- exact server-side gate setting if used;
- exact source/run IDs;
- exact row cap;
- exact expected mutation count;
- exact cleanup plan;
- exact read-after-write queries/checks;
- exact no-public-write checks;
- exact rollback/cleanup verification;
- exact approval phrase activation, if appropriate.

The phrase remains inactive now:

```text
Approve run candidate extraction live staging write
```

Phase 11B does not activate this phrase.

## 19. Phase 11C Proposed Scope

Recommended bounded Phase 11C implementation scope:

- helper live-staging branch behind fail-closed server-side gate;
- route pass-through of server-derived admin identity;
- strict route/helper tests;
- mocked/stubbed Supabase writes for unit tests where possible;
- mapper/staging integration through existing helpers where possible;
- no actual live DB write;
- no UI live mode;
- no migrations;
- no generated type changes;
- no package/dependency changes;
- no public `tools` writes;
- no `discovered_tools` writes;
- no audit writes unless explicitly approved in the Phase 11C implementation prompt;
- no live smoke.

Phase 11C must still not run a live staging write unless a later exact verification gate authorizes it.

## 20. Current Hard Stops

Current hard stops:

- no `dry_run: false` active path today;
- no live candidate staging write;
- no public `tools` write;
- no `discovered_tools` write;
- no public publishing;
- no automatic candidate approval;
- no crawler automation;
- no LLM automation;
- no scheduled or background discovery;
- no autonomous discovery;
- no repeated UI live invocation;
- no batch widening;
- no active live staging approval phrase.

## 21. Non-Goals

Phase 11B explicitly forbids:

- source code changes;
- test changes;
- API route changes;
- helper changes;
- UI changes;
- package changes;
- migrations;
- generated type changes;
- dependency changes;
- rerunning the live UI dry-run;
- clicking the UI;
- sending another POST to `/api/admin/discovery/candidate-extraction/invoke`;
- live smoke;
- opt-in smoke environment variables;
- database commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- crawler automation;
- LLM automation;
- live executor wiring;
- production write wiring;
- public UI changes;
- homepage changes;
- public submit flow changes;
- enabling `dry_run: false`;
- commits;
- pushes.

## 22. Recommended Next Step

Recommended next step: Gemini review of Phase 11B.

If Phase 11B is approved and committed/pushed, recommended next phase:

```text
Phase 11C — Candidate Extraction Manual Live Staging Implementation
```

Phase 11C should remain carefully bounded and must not run live staging unless a later exact verification gate authorizes it.
