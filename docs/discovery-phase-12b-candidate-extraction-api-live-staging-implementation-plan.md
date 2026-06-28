# Phase 12B — Candidate Extraction API Live Staging Implementation Plan

## 1. Status

Phase 12B is a docs-only implementation plan.

This phase does not implement the API live staging gate.

This phase does not modify code, tests, API routes, helpers, UI, package files, migrations, or generated types.

This phase does not run live staging, live smoke, database commands, remote SQL, Supabase commands, or POST requests.

This phase does not enable dry_run: false.

This phase plans a future guarded backend implementation path for API-based live candidate staging while preserving the current fail-closed behavior until a later approved activation and verification phase.

## 2. Current Confirmed State

Latest pushed commit before Phase 12B:

96e07f7 Document API UI live staging enablement gate

Current candidate extraction route:

POST /api/admin/discovery/candidate-extraction/invoke

Current route safeguards:

- admin session verification is required;
- CSRF verification is required;
- admin rate limiting is required;
- request body size is bounded;
- unsupported request fields are rejected;
- client-supplied admin identity is rejected;
- admin identity is derived server-side;
- route response uses no-store and nosniff headers;
- the route currently passes no live staging gate to the helper;
- dry_run: false remains rejected at the route boundary.

Current helper safeguards:

- CandidateExtractionInvocationOptions is server-created only;
- client request bodies must never activate live staging;
- live_invocation_not_enabled remains the default dry_run: false rejection;
- CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES is 1;
- live staging requires source_scope: single_run;
- current live gate mode is test_only_mocked_staging only;
- live staging requires server-created getLiveStagingCandidate and stageCandidate dependencies;
- no direct public.tools persistence exists in the invocation helper;
- no direct discovered_tools persistence exists in the invocation helper;
- no direct database client creation exists in the invocation helper.

Current tests confirm:

- dry-run requests are accepted safely;
- missing CSRF is rejected;
- invalid CSRF is rejected;
- anonymous requests are rejected;
- client-supplied admin identity is rejected;
- dry_run: false is rejected with live_invocation_not_enabled;
- client body cannot activate liveStagingGate;
- unsupported raw payload fields are rejected without echoing payload;
- route source remains free of direct DB writes and audit writes;
- test-only mocked live gate stages one candidate only through injected server dependencies.

## 3. Relationship To Phase 12A

Phase 12A approved the design gate for future Admin UI and API live staging enablement.

Phase 12B narrows the next step to backend planning only.

Phase 12B does not include Admin UI implementation.

Phase 12B does not include public publishing.

Phase 12B does not include live verification execution.

Phase 12B prepares a future Phase 12C backend implementation plan that must remain guarded and inert unless a later execution gate explicitly approves live route testing.

## 4. Implementation Goal For Future Phase 12C

Future Phase 12C should implement a server-controlled API live staging gate that can be tested locally without performing uncontrolled production writes.

The implementation goal is:

- preserve existing dry-run behavior;
- preserve default dry_run: false rejection;
- introduce a production-intended live gate shape without enabling it by default;
- keep the gate server-created only;
- route must still reject client-supplied live gate fields;
- route must still reject client-supplied admin identity;
- route must still require admin session, CSRF, and rate limit;
- no UI live control;
- no public.tools writes;
- no discovered_tools writes;
- no live smoke execution;
- no database mutation unless a later separately approved live verification phase authorizes it.

## 5. Proposed Future Code Touchpoints

Future Phase 12C should be limited to backend implementation and tests.

Expected files to modify:

- lib/discovery/discovery-candidate-extraction-invocation.ts
- app/api/admin/discovery/candidate-extraction/invoke/route.ts
- testing/discovery-candidate-extraction-invocation.test.mjs
- testing/discovery-candidate-extraction-invocation-route.test.mjs

Optional future helper file, only if needed:

- lib/discovery/discovery-candidate-extraction-live-gate.ts

Phase 12C should not modify:

- components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
- components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
- public UI files;
- category/tool pages;
- package.json;
- package-lock.json;
- migrations;
- generated Supabase types;
- crawler files;
- LLM extraction files.

## 6. Proposed Live Gate Type Design

The current live gate type is:

CandidateExtractionLiveStagingGate

Current mode:

test_only_mocked_staging

Future Phase 12C should not reuse test_only_mocked_staging as a production-intended mode name.

Recommended future mode name:

manual_api_single_candidate_staging

The future type should clearly distinguish test-only and production-intended gate modes.

Recommended shape:

- enabled: boolean;
- mode: test_only_mocked_staging or manual_api_single_candidate_staging;
- phase: Phase 12C or later implementation identifier;
- maxCandidates: 1;
- sourceScope: single_run;
- createdByServer: true;
- approvedExecutionRequired: true;
- auditCorrelationId: exact UUID;
- discoverySourceId: exact UUID;
- discoveryRunId: exact UUID;
- actorId: server-derived admin actor ID.

The route must never read this gate from JSON request body.

The gate must only be constructed in trusted server code.

The gate must remain disabled by default.

## 7. Inert Activation Requirement

Future Phase 12C must not make every dry_run: false request live.

Instead, Phase 12C should keep one of the following fail-closed activation controls:

Option A — environment opt-in disabled by default

- introduce a server-only environment variable;
- missing value means live route staging is disabled;
- value must not be exposed to client;
- tests must prove disabled default rejects dry_run: false.

Option B — internal function flag disabled by default

- route has a server-only function that returns false;
- future activation phase patches it or passes approved server-only config;
- tests must prove disabled default rejects dry_run: false.

Option C — separate internal route dependency for tests only

- route can be tested with injected server dependencies;
- production route still passes no live gate unless future activation is approved.

Recommended for Phase 12C:

Option C for tests plus a fail-closed server-only activation function.

No live environment opt-in should be used in Phase 12C unless Gemini approves it.

## 8. Candidate Input Provider Design

Future API live staging cannot accept arbitrary candidate data from the client.

The route must not accept:

- raw candidate payload;
- raw HTML;
- raw LLM output;
- raw extracted text;
- direct normalized candidate object;
- stageCandidate function;
- service-role behavior;
- liveStagingGate object.

Future Phase 12C should define a server-created getLiveStagingCandidate provider.

Allowed provider behavior for Phase 12C:

- test-only provider for unit tests;
- production provider stub that fails closed with live_staging_input_unavailable or live_staging_not_configured;
- no broad source/run scan;
- no batch candidate selection;
- no LLM call;
- no crawler execution.

A real production provider should remain TBD until a later design phase selects a trusted candidate source.

## 9. Stage Candidate Dependency Design

The invocation helper already supports a stageCandidate dependency.

Future Phase 12C may wire this dependency from trusted server code only if the route remains inactive by default.

Allowed in Phase 12C:

- mocked stageCandidate in tests;
- server-created stageCandidate dependency behind an inactive gate;
- tests proving no client payload can affect the dependency.

Not allowed in Phase 12C:

- executing live staging through route in production;
- calling stageMappedExtractionCandidate from route directly;
- writing public.tools;
- writing discovered_tools;
- adding UI route controls;
- adding public catalog publishing.

## 10. Route Implementation Plan

Future Phase 12C route changes should follow this order:

1. Keep existing authentication, CSRF, rate limit, body parsing, unsupported field rejection, and client-admin-identity rejection unchanged.

2. Keep existing allowed body fields unchanged unless Gemini approves a new field.

3. Add internal server-only live gate resolver.

4. Gate resolver receives normalized trusted context only after route-level checks pass.

5. Gate resolver rejects by default.

6. If gate resolver rejects or is disabled, route behavior remains the current live_invocation_not_enabled response for dry_run: false.

7. If gate resolver is enabled in a future test-only path, route passes server-created CandidateExtractionInvocationOptions to invokeCandidateExtractionStagingPipeline.

8. The route never forwards client-supplied live gate data.

9. The route never exposes service-role details.

10. The route returns sanitized invocation result only.

## 11. Helper Implementation Plan

Future Phase 12C helper changes should be minimal.

Recommended helper changes:

- extend CandidateExtractionLiveStagingGate mode union to include manual_api_single_candidate_staging;
- add validation that production-intended gate mode requires exact maxCandidates 1;
- add validation that production-intended gate mode requires sourceScope single_run;
- keep live_invocation_not_enabled as default when no gate is present;
- keep live_staging_not_configured when dependencies are missing;
- keep live_staging_input_unavailable when provider returns null;
- keep live_staging_failed when staging pipeline rejects;
- keep sanitized results;
- keep no_public_write_confirmed true;
- keep no_discovered_write_confirmed true.

The helper should remain dependency-injected.

The helper should not import Supabase clients.

The helper should not read environment variables.

The helper should not perform direct database writes.

## 12. Audit Plan

Phase 12C should not add real audit writes unless a separate audit implementation is approved.

If audit planning is included in code comments or types, it should remain non-mutating.

Future audit implementation remains TBD because direct candidate-audit linkage is not yet confirmed.

Any future audit event must avoid:

- raw HTML;
- raw payload;
- secrets;
- CSRF values;
- environment values;
- service-role details;
- stack traces;
- unredacted client body.

## 13. Response Contract Plan

Future route and helper responses should continue using the existing safe result shape.

Required result properties remain:

- accepted;
- rejected;
- rejection_code;
- dry_run;
- discovery_source_id;
- discovery_run_id;
- candidates_considered_count;
- candidates_staged_count;
- candidates_skipped_count;
- validation_failures;
- duplicate_or_eligibility_rejections;
- audit_correlation_id;
- safety_flags;
- no_public_write_confirmed;
- no_discovered_write_confirmed;
- error_summary.

For future live route staging, successful response must show:

- dry_run false;
- candidates_considered_count 1;
- candidates_staged_count 1;
- candidates_skipped_count 0;
- bounded_max_candidates safety flag;
- candidate_status_staged safety flag;
- no_public_write safety flag;
- no_discovered_write safety flag.

The response must not include:

- raw candidate;
- raw input;
- raw HTML;
- service-role details;
- database credentials;
- CSRF token;
- stack trace;
- table row payload unless explicitly reviewed later.

## 14. Test Plan For Future Phase 12C

Future Phase 12C must include tests for helper behavior:

- dry_run true still accepted safely;
- dry_run false without gate still rejected;
- placeholder approval phrases remain inactive;
- production-intended gate mode cannot exceed max_candidates 1;
- production-intended gate mode rejects source_scope other than single_run;
- gate without candidate provider fails closed;
- gate without stageCandidate fails closed;
- candidate provider returning null fails closed;
- staging failure returns sanitized live_staging_failed;
- successful mocked production-intended gate stages exactly one candidate;
- result does not leak raw payloads or secrets;
- helper source remains free of Supabase client creation and direct DB hooks.

Future Phase 12C must include tests for route behavior:

- anonymous request rejected;
- missing CSRF rejected;
- invalid CSRF rejected;
- rate limit rejection remains safe;
- valid dry-run request still accepted;
- dry_run false still rejected when route live gate resolver is disabled;
- client-supplied invoked_by_admin_user_id rejected;
- client-supplied liveStagingGate rejected;
- client-supplied stageCandidate rejected;
- client-supplied raw payload rejected;
- unsupported fields rejected;
- invalid source/run/audit IDs rejected;
- invalid schema version rejected;
- max_candidates greater than 1 rejected for live route gate path;
- source_scope other than single_run rejected for live route gate path;
- test-only route dependency can stage one mocked candidate only when server-created gate is injected;
- route source remains free of direct public.tools and discovered_tools writes;
- route source remains free of direct audit writes unless a later approved audit phase changes this.

## 15. Failure Stop Conditions

Future Phase 12C must stop if:

- route accepts dry_run false without server gate;
- client can send liveStagingGate;
- client can send stageCandidate;
- client can spoof admin identity;
- missing or invalid CSRF is accepted;
- anonymous request is accepted;
- max_candidates above 1 is accepted for live mode;
- source_scope other than single_run is accepted for live mode;
- helper imports Supabase client directly;
- route writes public.tools;
- route writes discovered_tools;
- route writes audit events without a separate audit plan;
- response leaks raw payloads, HTML, tokens, secrets, stack traces, or service-role details;
- npm run check fails;
- git diff --check fails.

## 16. Manual Verification Requirements For Future Phase 12C

Future Phase 12C should run only safe local verification:

- npm run check;
- relevant Node test scripts for invocation helper and route;
- git diff --check;
- source-token inspections confirming forbidden direct write paths are absent.

Phase 12C must not run:

- live smoke;
- staging pipeline smoke with opt-in env var;
- Supabase commands;
- remote SQL;
- route POST requests against local or production app;
- database mutations;
- dry_run false production execution.

## 17. Future Live Route Verification

A later phase after Phase 12C may design a live route verification gate.

That future gate must define:

- exact approval phrase;
- exact route request;
- exact admin session strategy;
- exact CSRF strategy;
- exact source/run/candidate scope;
- exact max_candidates 1;
- exact source_scope single_run;
- exact expected candidate row;
- read-after-write verification;
- no public.tools writes;
- no discovered_tools writes;
- cleanup or retention policy;
- read-after-cleanup or review-queue verification;
- failure stop conditions.

The Phase 11E approval phrase must not be reused.

Vague approval remains invalid.

## 18. Proposed Future Phase 12C Scope

Recommended next phase after Phase 12B:

Phase 12C — Candidate Extraction API Live Gate Guarded Implementation

Allowed scope:

- backend helper and route implementation only;
- tests only;
- no UI live control;
- no live execution;
- no DB commands;
- no POST route call;
- no Supabase live smoke;
- no migrations;
- no generated types;
- no package changes.

Expected outcome:

- a guarded backend path exists;
- production/default route remains inert;
- tests prove dry_run false is still blocked unless server-created test gate is injected;
- route remains safe for future Phase 12F verification gate design.

## 19. Non-Goals

Phase 12B does not authorize:

- implementation;
- route changes;
- helper changes;
- UI changes;
- package changes;
- migrations;
- type regeneration;
- live staging;
- live smoke;
- DB commands;
- Supabase commands;
- remote SQL;
- POST requests;
- dry_run false enablement;
- candidate row creation;
- source row creation;
- run row creation;
- audit event writes;
- public.tools writes;
- discovered_tools writes;
- public publishing;
- crawler automation;
- LLM automation;
- commit;
- push.

## 20. Verification Performed

To be completed after this document is created.

Expected safe verification:

- git diff --check
- npm run check
- git status --short --branch
- git diff --stat
- git diff --name-only
