# Phase 13B — Candidate Preview Provider Implementation Plan

## 1. Status

Phase 13B is a docs-only implementation plan.

This phase does not implement a candidate preview provider.

This phase does not create a route.

This phase does not modify UI components, API routes, helpers, tests, package files, migrations, or generated types.

This phase does not run live staging, live smoke, database commands, remote SQL, Supabase commands, POST requests, or CSRF fetches.

This phase does not enable dry_run: false.

This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, preview rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 13B:

63cdb12 Document candidate preview source provider design

Current UI state:

- dry-run panel remains active and dry-run-only;
- disabled live staging scaffold exists;
- scaffold is wired with candidatePreview null;
- scaffold is wired with isLiveStagingAvailable false;
- scaffold performs no POST;
- scaffold fetches no CSRF token;
- scaffold calls no invocation route;
- scaffold has no dry_run false production request builder.

Current backend state:

- POST /api/admin/discovery/candidate-extraction/invoke exists;
- production dry_run false remains fail-closed;
- production route passes no live gate dependency by default;
- helper supports manual_api_single_candidate_staging only through server-created gate metadata;
- live staging remains max_candidates 1 and source_scope single_run.

## 3. Relationship To Phase 13A

Phase 13A selected the trusted preview source strategy.

The preferred long-term target is a server-derived, read-only Candidate Extraction Preview Artifact, likely backed later by:

public.discovery_candidate_preview_artifacts

Phase 13B does not create that table.

Phase 13B defines the future provider contract so schema, provider, route, and UI work stay bounded.

## 4. Future Implementation Goal

A future provider should answer one safe question:

For one exact discovery run and one exact discovery source, is there one trusted, sanitized, reviewable candidate preview that can be displayed to an admin?

The provider must return unavailable or blocked unless a trusted preview artifact exists.

The provider must not:

- create preview artifacts;
- stage candidates;
- publish candidates;
- write public.tools;
- write discovered_tools;
- call crawler code;
- call LLM code;
- mutate audit data unless a later audit design approves read-audit events.

## 5. Recommended Future File Touchpoints

Preferred future provider file:

- lib/discovery/discovery-candidate-preview-provider.ts

Preferred future route file if route is later implemented:

- app/api/admin/discovery/runs/[id]/candidate-preview/route.ts

Preferred future tests:

- testing/discovery-candidate-preview-provider.test.mjs
- testing/discovery-candidate-preview-route.test.mjs

Possible later UI files:

- components/admin/discovery/discovery-runs-table.tsx
- components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
- components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts

Phase 13B modifies none of these files.

## 6. Recommended Provider Function

Recommended future function name:

getCandidateExtractionPreviewForRun

Recommended input fields:

- discoveryRunId;
- discoverySourceId;
- requestingAdminActorId;
- expectedSchemaVersion.

Recommended result fields:

- accepted;
- rejected;
- rejectionCode;
- previewStatus;
- preview;
- safetyFlags;
- auditCorrelationId;
- noPublicWriteConfirmed;
- noDiscoveredWriteConfirmed.

The provider should use dependency injection so the core normalizer remains testable and does not directly couple to route code.

## 7. Recommended Provider Dependencies

Recommended dependencies:

- loadDiscoveryRun;
- loadPreviewArtifact.

The first implementation should keep the core provider dependency-injected.

A future thin server adapter may call Supabase, but the core provider should not import UI code, route code, crawler code, LLM code, or staging mutation helpers.

## 8. Preview Status Values

Recommended preview status values:

- unavailable;
- pending_review;
- reviewable;
- blocked;
- stale.

Rules:

- unavailable means no trusted artifact exists;
- pending_review means artifact exists but is not safe for UI display yet;
- reviewable means exactly one sanitized preview is safe to display;
- blocked means artifact exists but has blocking safety issues;
- stale means artifact no longer matches run/source/schema freshness rules.

The live staging scaffold must remain disabled unless previewStatus is reviewable and a later UI wiring phase explicitly allows preview display.

## 9. Rejection Codes

Recommended future rejection codes:

- missing_discovery_run_id;
- missing_discovery_source_id;
- missing_admin_actor;
- discovery_run_not_found;
- discovery_run_source_mismatch;
- preview_artifact_unavailable;
- preview_artifact_schema_unsupported;
- preview_artifact_stale;
- preview_artifact_blocked;
- preview_artifact_unsafe;
- preview_artifact_ambiguous;
- preview_candidate_missing_name;
- preview_candidate_missing_website;
- preview_candidate_unsafe_website.

The UI should display only safe mapped messages.

The route must not expose database errors, stack traces, SQL details, or raw artifact payloads.

## 10. Preview Shape

The future provider should return only UI-safe fields:

- candidateName;
- candidateWebsiteUrl;
- categoryHint;
- pricingHint;
- confidenceBucket;
- evidenceSummary;
- sourceEvidenceLocator;
- discoverySourceId;
- discoveryRunId;
- auditCorrelationId.

Server-side sanitization is primary.

The existing UI normalizer remains a second line of defense.

## 11. Artifact Lookup Contract

A future artifact lookup should return an internal record only to the provider core.

Recommended artifact fields:

- id;
- discoverySourceId;
- discoveryRunId;
- auditCorrelationId;
- previewSchemaVersion;
- previewStatus;
- candidateName;
- candidateWebsiteUrl;
- categoryHint;
- pricingHint;
- confidenceBucket;
- evidenceSummary;
- sourceEvidenceLocator;
- safetyFlags;
- previewGeneratedAt;
- createdAt;
- updatedAt.

Raw database rows must not be sent to the UI.

## 12. Run Lookup Contract

The provider must verify that the preview artifact belongs to the requested run/source pair.

Recommended run fields:

- id;
- sourceId;
- status;
- updatedAt.

Required checks:

- run exists;
- run ID matches input;
- source ID exists;
- source ID matches input;
- run status is compatible with preview use;
- run update time does not make artifact stale.

The first implementation should be strict and return unavailable unless all checks pass.

## 13. Sanitization Requirements

The provider must sanitize or reject:

- candidate name;
- candidate website URL;
- category hint;
- pricing hint;
- confidence bucket;
- evidence summary;
- source evidence locator;
- discovery source ID;
- discovery run ID;
- audit correlation ID;
- timestamps;
- safety flags.

The provider must reject or null out unsafe text containing:

- angle brackets;
- script markers;
- raw payload markers;
- HTML markers;
- secret markers;
- token markers;
- password markers;
- service-role markers;
- stack trace markers;
- credential markers;
- cookie markers;
- CSRF markers;
- Supabase secret markers.

Website URL rules:

- must parse as a URL;
- protocol should be https;
- host must be present;
- length must be bounded;
- javascript, data, file, localhost, and private-host URLs must be rejected unless a later test-only design explicitly permits them.

## 14. Freshness Rules

A preview must be stale or rejected if:

- artifact discoveryRunId does not match input discoveryRunId;
- artifact discoverySourceId does not match input discoverySourceId;
- artifact schema version is unsupported;
- previewGeneratedAt is missing;
- sourceEvidenceLocator is missing;
- candidateWebsiteUrl is missing or unsafe;
- candidateName is missing;
- previewStatus is not reviewable;
- blocking safety flags exist;
- run source ID does not match input source ID;
- run updatedAt invalidates the artifact under a later schema rule.

## 15. Multi-Candidate Rule

The first provider must not solve multi-candidate selection.

If multiple candidate preview artifacts exist for one run/source, the provider should return:

- rejected true;
- previewStatus blocked;
- rejectionCode preview_artifact_ambiguous;
- preview null.

A later candidate-selection phase may design safe admin selection.

Phase 13B does not authorize multi-candidate UI.

## 16. Future Read-Only API Route Contract

A future route may be:

GET /api/admin/discovery/runs/[id]/candidate-preview

Recommended behavior:

- require admin session;
- derive admin actor server-side;
- parse run ID from route params;
- verify source ID through query or server-loaded run;
- call getCandidateExtractionPreviewForRun;
- return no-store and nosniff headers;
- return sanitized provider result only;
- perform no writes;
- perform no live staging;
- perform no public publishing;
- perform no public.tools writes;
- perform no discovered_tools writes;
- perform no audit writes unless later explicitly approved.

GET should not require CSRF if kept strictly read-only.

If write-side read-audit is added later, the route must be redesigned and reviewed separately.

## 17. Future UI Wiring Contract

A later UI phase may:

- fetch candidate preview with GET only;
- use same-origin credentials;
- use cache no-store;
- display loading, unavailable, blocked, and stale states;
- pass sanitized preview to the disabled scaffold;
- keep isLiveStagingAvailable false until a later live activation phase;
- avoid POST;
- avoid CSRF fetch;
- avoid dry_run false;
- avoid candidate payload submission.

Even after preview is displayed, the scaffold must remain non-staging until a separate live activation gate.

## 18. Future Provider Tests

Future provider tests should prove:

- missing run ID is rejected;
- missing source ID is rejected;
- missing admin actor is rejected;
- run not found is rejected;
- run/source mismatch is rejected;
- missing artifact returns unavailable;
- stale artifact returns stale;
- unsupported schema returns rejected;
- unsafe candidate name is omitted or rejected;
- unsafe candidate URL is rejected;
- raw HTML markers are rejected;
- token and secret markers are rejected;
- multiple artifacts return ambiguous or blocked;
- reviewable artifact returns sanitized preview;
- no raw database row is returned;
- no public write flag is false;
- no discovered write flag is false.

## 19. Future Route Tests

Future route tests should prove:

- unauthenticated request returns 401;
- invalid route params return 400 or safe rejection;
- route uses no-store and nosniff;
- route calls provider with server-derived admin actor;
- route returns sanitized response only;
- route has no POST export;
- route has no CSRF fetch;
- route performs no staging;
- route performs no public.tools write;
- route performs no discovered_tools write;
- route performs no audit_events write unless separately approved.

## 20. Future Schema Decision

Phase 13A recommended the long-term target:

public.discovery_candidate_preview_artifacts

Phase 13B keeps that as the preferred future direction but does not draft a migration.

Recommended next schema phase:

Phase 13C — Candidate Preview Artifact Schema Design Gate

Phase 13C should decide:

- exact table name;
- exact columns;
- exact constraints;
- indexes;
- RLS policy shape;
- admin-only read policy;
- service-role write boundary;
- retention policy;
- stale artifact policy;
- audit linkage metadata;
- migration draft prerequisites.

No migration should be drafted until Phase 13C is approved.

## 21. Stop Conditions

Future implementation must stop if it requires:

- live staging;
- dry_run false activation;
- POST request from scaffold;
- CSRF fetch from scaffold before enabled-flow design;
- raw candidate payload from client;
- raw HTML exposure;
- raw LLM output exposure;
- public.tools write;
- discovered_tools write;
- audit write without approved audit design;
- Supabase client creation in UI;
- route live gate activation;
- crawler execution;
- LLM execution;
- migration apply without approval;
- DB push without approval;
- type regeneration without approval;
- batch candidate selection;
- source-wide staging;
- run-wide staging;
- public publishing.

## 22. Recommended Future Phase Sequence

Recommended next phases:

1. Phase 13C — Candidate Preview Artifact Schema Design Gate
   - docs-only;
   - decide table, constraints, RLS, and retention;
   - no migration draft yet.

2. Phase 13D — Candidate Preview Artifact Migration Draft
   - migration draft only;
   - no db push;
   - no remote SQL apply;
   - no type generation.

3. Phase 13E — Candidate Preview Provider Implementation Plan Patch
   - optional if Phase 13C or 13D changes the contract.

4. Phase 13F — Read-Only Candidate Preview Provider Implementation
   - server provider only;
   - dependency-injected;
   - returns unavailable unless trusted artifact exists;
   - no route, UI, or live staging.

5. Later phase — Candidate Preview Read-Only Route
   - GET-only;
   - admin-only;
   - no mutation.

6. Later phase — Scaffold Wiring To Read-Only Provider
   - GET-only UI wiring;
   - still no live staging.

7. Later phase — Live Staging Activation Gate
   - only after preview, provider, and audit path are verified;
   - exact live approval phrase required.

## 23. Phase 13B Verification Plan

After this document is created, run:

- git diff --check;
- npm run check;
- git diff --stat;
- git diff --name-only;
- git status --short --branch.

Expected changed file:

- docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md

Expected forbidden changes:

- no UI component changes;
- no API route changes;
- no helper changes;
- no test changes;
- no package changes;
- no migration changes;
- no generated type changes.

## 24. Commit Readiness Criteria

Phase 13B is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only the Phase 13B docs file is staged;
- no code files are changed;
- no live commands were run;
- no DB commands were run;
- no POST requests were sent;
- no CSRF fetch occurred;
- no dry_run false activation occurred.
