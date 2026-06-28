# Phase 12E — Candidate Extraction Admin UI Live Staging Implementation Plan

## 1. Status

Phase 12E is a docs-only implementation plan.

This phase does not implement Admin UI live staging.

This phase does not modify UI components, API routes, helpers, tests, package files, migrations, or generated types.

This phase does not run live staging, live smoke, database commands, remote SQL, Supabase commands, or POST requests.

This phase does not enable dry_run: false.

This phase converts the Phase 12D Admin UI live staging design gate into a future implementation plan while preserving the current fail-closed backend behavior introduced in Phase 12C.

## 2. Current Confirmed State

Latest pushed commit before Phase 12E:

6601377 Document admin UI live staging design gate

Current route foundation:

- POST /api/admin/discovery/candidate-extraction/invoke exists;
- production POST is exported as createCandidateExtractionInvokeHandler() with no live gate dependencies;
- admin session verification is required;
- CSRF verification is required;
- admin rate limiting is required;
- request body size is bounded;
- unsupported request fields are rejected;
- client-supplied admin identity is rejected;
- admin identity is derived server-side;
- route response uses no-store and nosniff headers;
- production dry_run: false remains fail-closed by default;
- client request bodies cannot pass liveStagingGate;
- client request bodies cannot pass stageCandidate;
- route has no direct public.tools write path;
- route has no direct discovered_tools write path;
- route has no direct audit write path.

Current helper foundation:

- manual_api_single_candidate_staging exists as a production-intended live gate mode;
- CandidateExtractionInvocationOptions remains server-created only;
- live staging requires exact server-scoped metadata;
- live staging requires max_candidates: 1;
- live staging requires source_scope: single_run;
- live staging requires server-created getLiveStagingCandidate;
- live staging requires server-created stageCandidate;
- no live gate is supplied by production route by default;
- helper does not import Supabase clients directly;
- helper does not read environment variables directly.

Current Admin UI foundation:

- DiscoveryCandidateExtractionDryRunPanel exists;
- the panel is dry-run-only;
- the panel sends dry_run: true only;
- the panel uses /api/admin/csrf;
- the panel sends same-origin credentials;
- the panel sends no invoked_by_admin_user_id;
- the panel uses a safe response normalizer;
- the panel source does not call public.tools;
- the panel source does not call discovered_tools;
- the panel source does not call audit_events;
- the panel source does not call stageMappedExtractionCandidate;
- the panel source does not call stageNormalizedDiscoveryCandidate;
- the panel source does not create a Supabase client.

## 3. Relationship To Prior Phases

Phase 12A designed the overall API/Admin UI live staging enablement gate.

Phase 12B planned the guarded backend implementation.

Phase 12C implemented the guarded backend foundation while keeping production fail-closed.

Phase 12D designed the high-friction future Admin UI live staging flow.

Phase 12E plans the future UI implementation path.

Phase 12E does not implement the UI.

Phase 12E does not activate the backend live gate.

## 4. Implementation Goal For A Future Phase

A future implementation phase should introduce a guarded Admin UI live staging scaffold without weakening the current dry-run-only behavior.

Recommended future phase name:

Phase 12F — Candidate Extraction Admin UI Live Staging Disabled Scaffold

Reasoning:

- the route has a guarded backend foundation;
- the UI design exists;
- however, the trusted candidate input source remains TBD;
- therefore, the first UI implementation should be a disabled scaffold or review-only affordance, not an executable live staging button;
- live execution should remain unavailable until a trusted candidate preview/source provider is designed and implemented.

The first implementation should prepare the UI safely without sending dry_run: false in production.

## 5. Recommended Future File Touchpoints

Preferred new UI files:

- components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
- components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts

Preferred test file:

- testing/discovery-candidate-extraction-live-staging-panel.test.mjs

Possible existing file touchpoints:

- components/admin/discovery/discovery-runs-table.tsx

Only if needed:

- components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx

The dry-run panel should remain unchanged unless a small shared utility extraction is clearly safer.

Future implementation should not modify:

- app/api/admin/discovery/candidate-extraction/invoke/route.ts;
- lib/discovery/discovery-candidate-extraction-invocation.ts;
- public homepage files;
- public category/tool pages;
- package.json;
- package-lock.json;
- migrations;
- generated Supabase types;
- crawler automation files;
- LLM extraction files;
- Supabase client helpers;
- audit write helpers.

## 6. Recommended Future Component Design

The future component should be separate from the dry-run panel.

Recommended component:

DiscoveryCandidateExtractionLiveStagingPanel

Recommended props:

- discoveryRunId: string;
- discoverySourceId: string | null;
- candidatePreview?: CandidateExtractionLiveStagingPreview | null;
- isLiveStagingAvailable?: false;

Recommended initial behavior:

- render only as a disabled high-friction scaffold;
- explain live staging is not available until a trusted candidate preview/provider exists;
- show exact run/source context;
- show max_candidates: 1;
- show source_scope: single_run;
- show no public.tools write;
- show no discovered_tools write;
- show no public publishing;
- show that server authorization is still required;
- do not include an enabled submit button;
- do not send POST requests;
- do not fetch CSRF;
- do not call the candidate extraction invocation route.

This keeps the future UI visible for review while preserving the no-live-execution boundary.

## 7. Future Candidate Preview Type

A future UI scaffold may define a sanitized preview type.

Recommended type:

CandidateExtractionLiveStagingPreview

Fields:

- candidateName: string | null;
- candidateWebsiteUrl: string | null;
- categoryHint: string | null;
- pricingHint: string | null;
- confidenceBucket: string | null;
- evidenceSummary: string | null;
- sourceEvidenceLocator: string | null;
- discoverySourceId: string;
- discoveryRunId: string;
- auditCorrelationId: string | null;

All values must be sanitized for display.

The preview type must not include:

- raw HTML;
- raw extracted text;
- raw LLM output;
- prompt text;
- cookies;
- credentials;
- API keys;
- CSRF tokens;
- service-role details;
- database errors;
- stack traces;
- unbounded evidence payloads;
- normalized candidate objects;
- direct database row payloads.

## 8. Recommended Future Utils Design

A new live-staging utility file may be introduced for display-only scaffolding.

Recommended file:

components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts

Allowed exports for first implementation:

- CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE
- CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES
- CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE
- hasCandidateExtractionLiveStagingContext
- normalizeCandidateExtractionLiveStagingPreview
- normalizeCandidateExtractionLiveStagingResponseSummary

The first implementation should not export a live request-body builder unless the future phase explicitly approves sending dry_run: false.

If a request-body builder is introduced in a later phase, it must be separate from the dry-run builder and must be covered by tests proving it does not send client-trusted internal fields.

## 9. Disabled Scaffold Behavior

The future Phase 12F disabled scaffold should:

- show the section title "Stage one candidate";
- show a warning badge such as "Live staging unavailable";
- show exact source/run context;
- show max_candidates: 1;
- show source_scope: single_run;
- show "Requires trusted candidate preview";
- show "Requires future server live gate activation";
- show "Does not publish to public tools";
- show "Does not write discovered_tools";
- show "Does not run crawler or LLM";
- keep the final action disabled;
- include disabled-state explanation text.

The disabled scaffold should not:

- submit a form;
- fetch CSRF;
- send POST requests;
- set dry_run: false in runtime code;
- create audit events;
- create staging rows;
- create candidate/source/run rows;
- call Supabase;
- call route live gate dependencies;
- expose raw payloads.

## 10. Future Enabled Flow Preconditions

A later enabled UI phase must not happen until all of these exist:

1. Trusted candidate preview source is designed.
2. Trusted candidate preview source is implemented.
3. Server-side candidate provider is designed.
4. Server-side candidate provider is implemented.
5. Server-side live gate resolver is activated through an approved guarded phase.
6. API route tests prove production defaults are still safe.
7. UI tests prove no client live gate injection.
8. Gemini approves implementation.
9. A separate live verification gate defines an exact approval phrase.
10. The user gives the exact approval phrase for any live execution.

Until then, UI live staging remains disabled.

## 11. Future Enabled Request Body

If a later phase explicitly enables the UI to send a live-staging intent, the request body may only include:

- discovery_source_id;
- discovery_run_id;
- audit_correlation_id;
- invocation_reason;
- dry_run: false;
- max_candidates: 1;
- source_scope: single_run;
- schema_version.

The request body must never include:

- invoked_by_admin_user_id;
- liveStagingGate;
- stageCandidate;
- normalized candidate;
- candidate payload;
- raw HTML;
- raw extracted text;
- raw LLM output;
- service-role details;
- public publishing flag;
- discovered_tools mutation flag;
- batch flag;
- source-wide flag;
- run-wide batch flag;
- cleanup flag unless separately approved.

Client intent must still be insufficient by itself.

The server must independently construct and validate the live gate.

## 12. Future Enabled Confirmation Requirements

A later enabled implementation must require:

- trusted source/run context;
- trusted candidate preview;
- explicit warning copy;
- confirmation checkbox;
- exact typed phrase;
- disabled final button until all conditions pass;
- clear display of max_candidates: 1;
- clear display of source_scope: single_run;
- clear display of "staging only";
- clear display of "not public publishing";
- clear display of "no discovered_tools write";
- clear display of "server may still reject this request."

Recommended typed phrase:

Stage one candidate

The typed phrase must be compared client-side only for UI friction.

It must not be treated as a backend authorization token.

## 13. Future CSRF And Fetch Requirements

If a later phase enables a request, the UI must:

- fetch CSRF from /api/admin/csrf immediately before POST;
- send credentials: "same-origin";
- send cache: "no-store";
- send Content-Type: application/json;
- send x-csrf-token header;
- avoid storing CSRF in localStorage;
- avoid logging CSRF;
- avoid displaying CSRF;
- handle 401 safely;
- handle 403 safely;
- handle 429 safely.

The first disabled scaffold should not fetch CSRF because it should not send a request.

## 14. Future Response Normalization

If a later phase enables a request, the UI must use a sanitizer equivalent to or stricter than the current dry-run response normalizer.

Allowed response display fields:

- accepted;
- rejected;
- dryRun;
- discoverySourceId;
- discoveryRunId;
- candidatesConsideredCount;
- candidatesStagedCount;
- candidatesSkippedCount;
- auditCorrelationId;
- safetyFlags;
- validationFailures;
- duplicateOrEligibilityRejections;
- noPublicWriteConfirmed;
- noDiscoveredWriteConfirmed;
- rejectionCode;
- errorSummary.

Forbidden response display values:

- raw payload;
- raw HTML;
- normalized candidate payload;
- database row payload;
- service-role details;
- stack traces;
- CSRF tokens;
- environment values;
- credentials;
- SQL errors;
- secret-like values;
- Supabase details.

## 15. Future Placement Plan

Recommended Phase 12F placement:

- inside DiscoveryRunsTable expanded run area;
- near the existing dry-run panel;
- below the dry-run panel;
- rendered only when a run row is expanded;
- disabled if source_id is missing;
- disabled if candidatePreview is missing.

This placement keeps the live-staging scaffold tied to exact run/source context and avoids a global live action.

The existing dry-run panel should remain the primary active control.

## 16. Future DiscoveryRunsTable Wiring

A future implementation may import:

DiscoveryCandidateExtractionLiveStagingPanel

into:

components/admin/discovery/discovery-runs-table.tsx

The table may render it under the existing dry-run panel.

Required props:

- discoveryRunId={run.id}
- discoverySourceId={run.source_id}
- candidatePreview={null}
- isLiveStagingAvailable={false}

The explicit null/false values make the first scaffold intentionally inert.

The first implementation should not derive candidate preview from run.stats unless a safe preview normalizer is designed and tested.

## 17. Future Tests For Disabled Scaffold

Future Phase 12F tests should prove:

- live-staging scaffold renders separately from dry-run panel;
- scaffold displays "Stage one candidate" or equivalent;
- scaffold displays disabled/unavailable state;
- scaffold displays max_candidates: 1;
- scaffold displays source_scope: single_run;
- scaffold displays no public publishing;
- scaffold displays no discovered_tools write;
- scaffold requires trusted source/run context;
- scaffold requires candidate preview before enabling;
- scaffold has no fetch call to the invocation route;
- scaffold has no fetch call to /api/admin/csrf;
- scaffold does not build a dry_run: false request body;
- scaffold does not include invoked_by_admin_user_id;
- scaffold does not include liveStagingGate;
- scaffold does not include stageCandidate;
- scaffold does not include raw HTML;
- scaffold does not include raw candidate payload;
- scaffold does not include public.tools;
- scaffold does not include discovered_tools;
- scaffold does not include audit_events;
- scaffold does not include stageMappedExtractionCandidate;
- scaffold does not include stageNormalizedDiscoveryCandidate;
- scaffold does not include createClient.

## 18. Future Tests For Later Enabled Flow

A later enabled UI phase, after trusted candidate provider design, must add tests proving:

- request body is separate from dry-run builder;
- request body is bounded to approved intent fields;
- dry_run is false only in the live builder;
- max_candidates is 1;
- source_scope is single_run;
- client admin identity is absent;
- liveStagingGate is absent;
- stageCandidate is absent;
- raw candidate payload is absent;
- raw HTML is absent;
- CSRF is fetched before POST;
- same-origin credentials are used;
- response is normalized safely;
- success disables repeat submission;
- failure displays only safe copy;
- no automatic retry exists;
- no public publishing path exists.

These tests must not run live staging.

## 19. Future Route Work Not Included In UI Scaffold

The disabled scaffold must not modify route behavior.

The route should continue to reject dry_run: false in production by default.

Future route activation remains a separate phase.

Any future route activation must define:

- trusted candidate provider;
- server-side live gate resolver;
- audit strategy;
- exact live verification gate;
- exact approval phrase;
- rollback/cleanup/retention policy.

## 20. Future Audit Work Not Included In UI Scaffold

The disabled scaffold should not create audit events.

Future audit planning remains separate.

If UI view/cancel/request audit events are added later, they must:

- avoid raw payloads;
- avoid raw HTML;
- avoid secrets;
- avoid CSRF tokens;
- avoid service-role details;
- avoid stack traces;
- avoid unredacted client body.

Direct candidate-audit linkage remains TBD.

## 21. Responsive Implementation Requirements

Future UI implementation must be verified on:

Desktop:

- clear two-column or multi-column context layout;
- warning and disabled action visually separated from dry-run;
- no horizontal overflow.

Tablet:

- stacked layout if needed;
- readable source/run IDs;
- warning and disabled-state explanation visible;
- tap targets large enough.

Mobile:

- fully vertical layout;
- no sticky destructive action;
- disabled action cannot be accidentally tapped;
- warning copy remains concise;
- source/run IDs wrap safely.

Future CCR must include Desktop / Tablet / Mobile results.

## 22. Accessibility Implementation Requirements

Future UI implementation must include:

- semantic section heading;
- visible labels;
- disabled state explanation;
- aria-describedby for disabled final action if appropriate;
- keyboard reachable non-disabled controls;
- clear focus behavior;
- no color-only warnings;
- sufficient contrast;
- safe status messaging;
- no auto-submit on Enter for destructive action.

## 23. Stop Conditions

Future implementation must stop if it requires:

- enabling dry_run: false;
- sending a POST request;
- adding live gate resolver activation;
- accepting candidate payload from client;
- accepting raw HTML from client;
- accepting LLM output from client;
- adding public.tools writes;
- adding discovered_tools writes;
- adding audit writes without approved design;
- adding Supabase client creation in UI;
- modifying migrations;
- regenerating types;
- changing package files;
- adding crawler/LLM automation;
- combining staging with public publishing;
- adding batch staging;
- hiding max_candidates or source_scope;
- bypassing CSRF;
- bypassing admin auth;
- bypassing Gemini review.

## 24. Recommended Future Phase Sequence

Recommended next phases:

1. Phase 12F — Candidate Extraction Admin UI Live Staging Disabled Scaffold
   - guarded UI scaffold only;
   - no POST;
   - no CSRF fetch;
   - no dry_run: false body;
   - no backend changes;
   - tests for inert UI boundaries.

2. Phase 12G — Trusted Candidate Preview Source Design Gate
   - docs-only;
   - selects where the candidate preview comes from;
   - defines evidence summary and sanitization;
   - still no live staging.

3. Phase 12H — Trusted Candidate Preview Provider Implementation Plan
   - docs/planning;
   - designs server/read path;
   - no mutation.

4. Phase 12I or later — Preview Provider Implementation
   - read-only provider only;
   - no staging writes.

5. Later phase — UI Live Staging Activation Gate
   - only after preview/provider/audit plan exists;
   - exact approval phrase required for any live verification.

## 25. Phase 12E Verification Plan

After this document is created, run:

- git diff --check
- npm run check
- git diff --stat
- git diff --name-only
- git status --short --branch

Expected changed file:

- docs/discovery-phase-12e-candidate-extraction-admin-ui-live-staging-implementation-plan.md

Expected forbidden changes:

- no UI component changes;
- no API route changes;
- no helper changes;
- no test changes;
- no package changes;
- no migration changes;
- no generated type changes.

## 26. Commit Readiness Criteria

Phase 12E is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only the Phase 12E docs file is staged;
- no code files are changed;
- no live commands were run;
- no DB commands were run;
- no POST requests were sent;
- no dry_run: false activation occurred.
