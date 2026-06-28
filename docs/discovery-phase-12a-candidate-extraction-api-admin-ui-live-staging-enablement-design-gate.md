# Phase 12A — Candidate Extraction API & Admin UI Live Staging Enablement Design Gate

## 1. Status

Phase 12A is a docs-only design gate.

This phase does not implement live staging enablement.

This phase does not modify code, tests, API routes, helpers, UI, package files, migrations, or generated types.

This phase does not run live staging, live smoke, database commands, remote SQL, Supabase commands, or POST requests.

This phase does not enable dry_run: false.

Phase 12A exists to design how a future authenticated Admin UI live-staging flow could be safely authorized, routed, gated, verified, and audited after the successful Phase 11E single-row live verification.

## 2. Sources Reviewed

Phase 12A reviewed the current local project state after Phase 11E.

Key sources:

- docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md
- docs/discovery-phase-11e-candidate-extraction-manual-live-staging-verification-result.md
- app/api/admin/discovery/candidate-extraction/invoke/route.ts
- lib/discovery/discovery-candidate-extraction-invocation.ts
- components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
- components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
- testing/discovery-candidate-extraction-invocation.test.mjs
- testing/discovery-candidate-extraction-invocation-route.test.mjs
- testing/discovery-candidate-extraction-dry-run-panel.test.mjs
- testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs

## 3. Current Confirmed State

The current candidate extraction route is:

- POST /api/admin/discovery/candidate-extraction/invoke

Confirmed route safeguards:

- admin session verification is required;
- CSRF verification is required;
- admin rate limiting is required;
- request body size is bounded;
- unsupported request fields are rejected;
- client-supplied admin identity is rejected;
- admin identity is derived server-side;
- the route passes no live staging gate to the helper;
- dry_run: false remains rejected by default.

Confirmed helper safeguards:

- CandidateExtractionInvocationOptions is server-created only;
- client request bodies must never activate live staging;
- live_invocation_not_enabled remains the default dry_run: false rejection;
- CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES is 1;
- live staging requires source_scope: single_run;
- the only current live gate mode is test_only_mocked_staging;
- public.tools writes are not introduced;
- discovered_tools writes are not introduced.

Confirmed Admin UI state:

- the current admin candidate extraction panel is dry-run-only;
- the current UI sends dry_run: true only;
- Phase 11E did not use an Admin UI live control;
- Phase 11E did not send a POST request to the candidate extraction route.

## 4. Phase 11E Result Summary

Phase 11E successfully verified a single controlled live extraction-to-staging path.

The approved command was run once:

AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs

Result: PASSED

Exit code: 0

Smoke marker:

phase-10i-extraction-staging-pipeline-smoke:7498348e

Created and cleaned up by exact ID:

- discovery source: 21ddb97b-6792-44fb-91f2-f6352a261d3f
- discovery run: 957c6b06-e361-450e-85af-d209862a7719
- staged candidate: 3c3d9139-1984-4ef9-97b7-97447a6610a7

Phase 11E verified:

- service-role readback;
- candidate_status remained staged;
- anonymous exact-ID read denial;
- anonymous list denial;
- guessed candidate ID denial;
- no payload leakage;
- no public.tools writes;
- no discovered_tools writes;
- exact-ID cleanup;
- read-after-cleanup verification.

## 5. Design Goal

Phase 12A designs the future safe enablement path for live candidate staging from:

Admin UI
-> authenticated Next.js API route
-> server-controlled live staging gate
-> verified staging pipeline
-> public.discovery_candidate_tools

The design goal is not public publishing.

The design goal is not automated crawling or automated LLM staging.

The design goal is not bulk staging.

The design goal is a future narrowly approved manual Admin UI flow that can stage one bounded candidate into public.discovery_candidate_tools while preserving the safety model proven by Phase 11E.

## 6. Required Future Architecture

A future implementation must keep a hard separation between:

1. UI intent
2. API authorization
3. server-controlled live gate creation
4. candidate input resolution
5. staging execution
6. read-after-write verification
7. cleanup or retention policy
8. audit and review result capture

The client request body must never directly activate live staging.

The UI may request a live staging attempt only after future authorization design is implemented, but the server must independently decide whether a live gate is allowed.

## 7. Admin UI Enablement Design

A future Admin UI live-staging control must not be a simple dry_run toggle.

It should require a dedicated, high-friction flow such as:

- separate "Stage one candidate" action;
- explicit warning that the action writes one staging row;
- exact source/run/candidate summary display;
- confirmation checkbox;
- typed confirmation phrase;
- clear max_candidates: 1 display;
- clear source_scope: single_run display;
- no batch option;
- no public publishing option;
- no discovered_tools mutation option;
- no repeat-run button after success without refreshing/reloading context.

The current dry-run panel should remain dry-run-only until a separately approved implementation phase.

Any future UI live control must be reviewed by Gemini before implementation.

## 8. API Route Enablement Design

A future route implementation may accept a live-staging request only if all server-side requirements are satisfied.

Required route behavior:

- admin session required;
- CSRF required;
- rate limit required;
- body size bounded;
- unsupported fields rejected;
- client admin identity rejected;
- actor identity derived server-side;
- request must specify exact discovery_source_id;
- request must specify exact discovery_run_id;
- request must specify exact audit_correlation_id or server must create one;
- request must specify max_candidates: 1;
- request must specify source_scope: single_run;
- request must use the current schema version;
- request must not include liveStagingGate;
- request must not include stageCandidate;
- request must not include raw service-role behavior;
- response must be sanitized.

The route must not directly write to public.tools.

The route must not directly write to discovered_tools.

The route must not expose service-role details, environment values, CSRF tokens, raw payloads, raw HTML, stack traces, or database credentials.

## 9. Server-Controlled Live Gate Design

The server-controlled gate should be created only inside trusted server code after all checks pass.

Future live gate requirements:

- enabled only for a single request;
- scoped to one exact candidate;
- scoped to one exact source/run;
- max_candidates fixed to 1;
- source_scope fixed to single_run;
- includes approved phase/scope metadata;
- includes admin actor context;
- includes audit correlation ID;
- cannot be constructed from request JSON;
- cannot be passed through client payload;
- cannot be enabled by dry_run: false alone.

The current test_only_mocked_staging mode should not be reused as a production live mode name.

A future production live mode name is TBD / requires design approval.

## 10. Candidate Input Resolution Design

The future API live path must define a trusted candidate input source.

Possible safe sources:

- a previously reviewed dry-run extraction result tied to an exact discovery_run_id;
- a server-side selected candidate preview generated by the current dry-run helper;
- a persisted staging-intent record created by a prior dry-run review phase.

The route must not accept arbitrary candidate payloads from the client.

The route must not accept raw extracted HTML from the client.

The route must not accept LLM output from the client.

Exact candidate input source remains:

TBD / requires design approval

## 11. Audit Design

Future live staging enablement should include auditable events for:

- live staging requested;
- live staging rejected;
- live staging accepted;
- candidate row inserted;
- read-after-write verified;
- cleanup or retention decision;
- failure/stop condition.

Known limitation:

Candidate audit linkage remains TBD because discovery_audit_events does not currently have a confirmed direct discovery_candidate_tool_id column.

Any future audit implementation must avoid raw payloads, raw HTML, secrets, CSRF values, environment values, service-role details, and stack traces.

## 12. Cleanup vs Retention Decision

Phase 11E used exact-ID cleanup because it was a verification run.

A future Admin UI live staging flow may need a different policy:

Option A — cleanup after verification
- suitable for test-only live verification;
- keeps database pristine;
- not suitable if the admin expects to review the staged candidate later.

Option B — retain staged candidate for admin review
- suitable for real staging workflow;
- requires Admin UI candidate review surface;
- requires clear "staged only" status;
- requires no public publishing;
- requires later approve/reject/archive design.

Phase 12A does not choose final cleanup vs retention.

Recommended future decision:

Use cleanup for smoke/verification phases.
Use retention only after an admin review queue design is approved.

## 13. Admin Review Queue Requirement

Before Admin UI live staging is used for real workflow, AiFinder should have a review surface for public.discovery_candidate_tools rows.

The review surface should show:

- candidate_status;
- candidate name;
- website/canonical URL;
- source URL;
- source/run context;
- audit correlation ID;
- extraction_version;
- duplicate signals;
- quality flags;
- created_at;
- cleanup/review status.

The review surface must remain staging-only until a separate public publishing workflow is designed.

## 14. Public Publishing Boundary

Phase 12A does not authorize public publishing.

A future live staging flow must not:

- insert into public.tools;
- update public.tools;
- insert into discovered_tools;
- update discovered_tools;
- promote a candidate to public catalog;
- automatically approve a staged candidate;
- automatically publish a staged candidate.

Public publishing requires a separate design gate.

## 15. Testing Requirements For Future Implementation

A future implementation phase must include tests proving:

- UI remains dry-run-only until live UI control is explicitly implemented;
- live UI control cannot send unsupported fields;
- client body cannot include liveStagingGate;
- client body cannot include stageCandidate;
- client body cannot include invoked_by_admin_user_id;
- route rejects dry_run: false without server gate;
- route accepts dry_run: false only when server gate is created internally;
- max_candidates over 1 is rejected;
- source_scope other than single_run is rejected for live mode;
- missing CSRF is rejected;
- invalid CSRF is rejected;
- non-admin request is rejected;
- route response is sanitized;
- no public.tools write path exists;
- no discovered_tools write path exists;
- no direct audit write leakage exists;
- service-role use remains server-only.

## 16. Future Live Verification Requirements

Any future implementation that enables route-based or UI-based live staging must include another approved live verification gate before real execution.

The gate must define:

- exact approval phrase;
- exact source/run/candidate scope;
- exact max_candidates value;
- exact route or UI action;
- exact expected inserted row;
- exact read-after-write checks;
- cleanup or retention policy;
- exact read-after-cleanup or review-queue verification;
- exact failure stop conditions.

Vague approval remains invalid for live execution.

## 17. Proposed Future Phases

Recommended future phases:

Phase 12B — Candidate Extraction API Live Gate Implementation Plan

Docs-only plan for the server-side route/live-gate implementation.

Phase 12C — Candidate Extraction API Live Gate Guarded Implementation

Backend implementation and tests only. No UI live control and no live execution.

Phase 12D — Candidate Extraction Admin UI Live Staging Design

Docs-only UI/UX and safety design for a future live staging control.

Phase 12E — Candidate Extraction Admin UI Live Staging Guarded Implementation

UI implementation only after design approval. No live execution unless separately approved.

Phase 12F — Route/UI Live Staging Verification Gate

Docs-only execution gate before any route/UI live staging test.

## 18. Phase 12A Non-Goals

Phase 12A does not:

- implement code;
- modify tests;
- modify API routes;
- modify helpers;
- modify UI;
- modify package files;
- modify migrations;
- regenerate types;
- add dependencies;
- run live staging;
- run live smoke;
- run database commands;
- run remote SQL;
- run Supabase commands;
- send POST requests;
- enable dry_run: false;
- create candidate/source/run rows;
- write audit events;
- write to public.tools;
- write to discovered_tools;
- add public publishing;
- add crawler automation;
- add LLM automation;
- commit;
- push.

## 19. Current Hard Stops

Do not proceed directly from Phase 12A to UI live staging.

Do not add a live toggle to the existing dry-run panel without a separate UI design phase.

Do not enable dry_run: false from client body alone.

Do not reuse the Phase 11E approval phrase for future route/UI live staging.

Do not treat staged candidates as public tools.

Do not skip Gemini review before implementation.

## 20. Verification Performed

To be completed after this document is created.

Expected safe verification:

- git diff --check
- npm run check
- git status --short --branch
- git diff --stat
- git diff --name-only
