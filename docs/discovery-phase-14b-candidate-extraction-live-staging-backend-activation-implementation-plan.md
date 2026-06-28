# Phase 14B — Candidate Extraction Live Staging Backend Activation Implementation Plan

## 1. Status

Phase 14B is docs-only.

This phase does not activate live staging.

This phase does not modify UI components, API routes, providers, helpers, tests, package files, migrations, generated types, Supabase schema, environment configuration, or deployment configuration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 14B:

- `e5cc93c Document live staging activation gate`

Phase 14A established the activation gate and required future backend preview revalidation before any live staging write can occur.

The current admin UI can fetch read-only candidate previews from:

- `GET /api/admin/discovery/runs/[id]/candidate-preview?source_id=:sourceId`

The current live staging scaffold remains disabled through:

- `isLiveStagingAvailable={false}`

The current candidate extraction invoke route exists at:

- `POST /api/admin/discovery/candidate-extraction/invoke`

The current invoke route already includes:

- admin session verification;
- CSRF verification;
- admin rate limiting;
- JSON content-type enforcement;
- bounded body size;
- request body allowlist;
- client-supplied admin identity rejection;
- server-derived admin actor ID;
- dependency-injected live staging option resolver;
- delegation to `invokeCandidateExtractionStagingPipeline(...)`.

The current invocation helper already includes a guarded live staging gate model:

- `CandidateExtractionLiveStagingGate`;
- `CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE`;
- `CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1`;
- `sourceScope = "single_run"`;
- server-created live gate validation;
- default rejection for live invocation when no server gate is provided.

The current preview provider already returns a safe accepted preview only when the artifact is reviewable, fresh, source/run matched, schema-supported, non-ambiguous, non-blocked, and sanitized.

## 3. Purpose

Phase 14B defines the backend activation implementation plan for a future guarded code phase.

It does not implement the plan.

The plan defines how a future backend implementation should create server-side live staging options only after revalidating the preview provider result immediately before staging.

The plan intentionally separates backend activation from UI activation.

A future backend implementation may make the POST route capable of live staging only when the server creates a valid live gate.

The UI must remain disabled until a later separate UI activation phase.

## 4. Recommended Future Phase Split

The safest split is:

1. Phase 14C — Backend Preview-Revalidated Live Gate Resolver Implementation
   - code-only backend route/helper/test phase;
   - no UI activation;
   - no live smoke;
   - no production manual staging execution;
   - default UI remains disabled.

2. Phase 14D — Backend Activation Dry/Mocked Verification
   - test-only and route-level verification;
   - no real candidate writes unless separately approved.

3. Phase 14E — Admin UI Live Staging Activation Implementation Plan
   - docs-only UI activation plan;
   - defines UI friction and POST wiring;
   - still no UI activation.

4. Phase 14F — Admin UI Live Staging Activation Implementation
   - only if 14E is approved;
   - adds UI friction and POST path;
   - no live smoke unless separately approved.

5. Phase 14G — Live Staging Smoke Execution Gate
   - exact phrase required;
   - exact fixture scope and cleanup required.

This split avoids enabling UI writes in the same phase that creates backend activation capability.

## 5. Future Backend Activation Design

A future backend implementation should add a server-owned live staging resolver to the invoke route.

The resolver should be created inside the backend route layer, not in the client.

The resolver should run only after:

- admin session verification passes;
- CSRF verification passes;
- rate limiting passes;
- request body parsing passes;
- unsupported body fields are rejected;
- client-supplied admin identity is rejected;
- server-derived admin actor ID is available;
- invocation input is assembled by the route.

The resolver must not trust the UI preview.

The resolver must call the preview provider directly on the server using the submitted run/source IDs and the server-derived admin actor ID.

The resolver must create `CandidateExtractionInvocationOptions` only if the preview provider returns an accepted reviewable result.

## 6. Future Route-Level Resolver Shape

A future implementation may introduce a route-local function similar to:

```ts
async function resolveManualApiLiveStagingOptions(input: {
  invocationInput: CandidateExtractionInvocationInput;
  invokedByAdminUserId: string;
}): Promise<CandidateExtractionInvocationOptions> {
  // Validate only server-derived and invocation-normalized values.
  // Revalidate preview provider.
  // If accepted, return server-created liveStagingGate and provider.
  // Otherwise, return empty options or fail closed.
}
```

The resolver must remain server-only.

The resolver must not be exported for client use.

The resolver must not accept a client-provided `liveStagingGate`.

The resolver must not accept a client-provided candidate payload.

The resolver must not accept a client-provided admin identity.

## 7. Required Future Backend Revalidation

The future resolver must revalidate all of the following immediately before live staging:

1. `discovery_source_id` is present and valid.
2. `discovery_run_id` is present and valid.
3. `audit_correlation_id` is present and valid.
4. `dry_run === false`.
5. `max_candidates === 1`.
6. `source_scope === "single_run"`.
7. `schema_version` is the expected invocation schema version.
8. Server-derived admin actor ID is present.
9. Preview provider returns `accepted: true`.
10. Preview provider returns `rejected: false`.
11. Preview status is `reviewable`.
12. Preview source ID matches invocation source ID.
13. Preview run ID matches invocation run ID.
14. Preview audit correlation ID is safe and either matches the request or becomes the canonical server value according to the future code plan.
15. Preview contains a safe candidate name.
16. Preview contains a safe HTTPS candidate website URL.
17. Preview contains a safe source evidence locator.
18. Preview confirms no public write.
19. Preview confirms no discovered-tools write.
20. Preview safety flags do not indicate stale, blocked, ambiguous, unsafe, raw HTML, or LLM output exposure.

If any condition fails, the resolver must fail closed and not create a live staging gate.

## 8. Audit Correlation ID Policy

A future implementation must choose one canonical audit correlation policy before coding.

Recommended policy:

- The POST body must include `audit_correlation_id`.
- The server revalidated preview must include the same `auditCorrelationId`.
- If they do not match, live staging is rejected.
- This avoids staging a candidate from a preview artifact that is not the one the admin reviewed.

Alternative policy:

- The server preview result becomes canonical.
- The route ignores client audit correlation ID for live staging.
- The invocation input is rebuilt with the server preview audit correlation ID.

The recommended policy is stricter and should be preferred unless Gemini recommends otherwise.

## 9. Future Server-Created Live Gate

If preview revalidation succeeds, the future resolver should create a gate with exact values:

```ts
const liveStagingGate = {
  enabled: true,
  mode: CANDIDATE_EXTRACTION_MANUAL_API_LIVE_STAGING_MODE,
  phase: "phase-14c-backend-preview-revalidated-live-gate",
  maxCandidates: CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  sourceScope: "single_run",
  createdByServer: true,
  approvedExecutionRequired: true,
  auditCorrelationId: invocationInput.audit_correlation_id,
  discoverySourceId: invocationInput.discovery_source_id,
  discoveryRunId: invocationInput.discovery_run_id,
  actorId: invokedByAdminUserId,
} as const;
```

The exact `phase` string may be adjusted in the implementation phase, but it must be non-empty and phase-specific.

The gate must be created only on the server.

The gate must not be serializable from the request body.

## 10. Future Candidate Provider For Live Staging

The future resolver must provide `getLiveStagingCandidate`.

That provider should convert the revalidated preview into the existing mapper input shape.

Minimum mapping requirements:

- candidate name comes from server-revalidated preview;
- candidate website URL comes from server-revalidated preview;
- category hint is mapped only if allowlisted;
- pricing hint is mapped only if allowlisted;
- source evidence locator is preserved;
- discovery source ID is preserved;
- discovery run ID is preserved;
- audit correlation ID is preserved;
- raw preview artifact row is not forwarded;
- raw HTML is not forwarded;
- raw LLM output is not forwarded;
- client-submitted candidate data is never used.

The implementation must verify that the existing mapper input type supports the required fields before coding.

If the mapper input shape cannot safely represent preview-derived candidate data, implementation must stop and add a separate design patch.

## 11. Future Staging Candidate Dependency

The future route resolver must pass the real staging candidate dependency only after the server gate and candidate provider are valid.

The existing invocation helper already supports:

- `stageCandidate?: CandidateExtractionStageCandidate`

The default route currently does not provide live staging dependencies.

A future backend activation implementation must explicitly decide whether to use the existing production staging helper through the existing staging pipeline abstraction.

It must not introduce a new direct DB insert path inside the route.

The route should continue delegating staging through the existing tested staging pipeline/helper path.

## 12. Failure Behavior

The future resolver should fail closed.

Preferred failure behavior:

- return empty `CandidateExtractionInvocationOptions`;
- allow the invocation helper to return `live_invocation_not_enabled` or `live_staging_not_configured`;
- avoid leaking preview provider rejection details that could expose internal state.

If the route needs more specific admin-facing failure reasons, it must map them to the existing safe rejection code model.

It must not return raw provider rows, SQL errors, stack traces, service-role details, or raw exception messages.

## 13. Default Safety Requirement

After future backend activation implementation, the following must remain true:

- `dry_run: false` without the server-created gate is rejected.
- client request bodies cannot activate live staging.
- client request bodies cannot provide `liveStagingGate`.
- client request bodies cannot provide candidate payloads.
- client request bodies cannot provide admin identity.
- UI remains disabled until a separate UI activation phase.
- No public catalog write occurs.
- No discovered-tools write occurs.
- No crawler execution occurs.
- No LLM execution occurs from the route.

## 14. Future Tests For Backend Activation

A future backend implementation must add or update tests proving:

### Route tests

- unauthenticated request returns 401;
- missing CSRF returns 403;
- invalid CSRF returns 403;
- rate limited request returns safe rate limit response;
- unsupported field is rejected;
- client-supplied admin identity is rejected;
- client-supplied `liveStagingGate` is rejected as unsupported field;
- client-supplied candidate payload is rejected as unsupported field;
- malformed body is rejected;
- missing admin actor is rejected;
- dry-run path still works;
- `dry_run: false` without resolver remains rejected;
- `dry_run: false` with resolver but rejected preview remains rejected;
- `dry_run: false` with resolver but stale preview remains rejected;
- `dry_run: false` with resolver but blocked preview remains rejected;
- `dry_run: false` with resolver but ambiguous preview remains rejected;
- `dry_run: false` with resolver but source/run mismatch remains rejected;
- `dry_run: false` with resolver but audit correlation mismatch remains rejected;
- accepted preview creates server live gate only;
- accepted preview calls staging dependency exactly once;
- response is sanitized;
- no raw preview row is returned;
- no raw SQL or stack trace is returned.

### Invocation helper tests

- existing default live rejection still passes;
- manual API live gate still requires `createdByServer === true`;
- manual API live gate still requires actor/source/run/audit match;
- max candidates must be one;
- source scope must be `single_run`;
- staging result failure is safe;
- successful live staging reports one staged candidate;
- public/discovered write confirmations remain true.

### Provider integration tests

- route resolver calls preview provider with server-derived admin actor;
- route resolver does not call preview provider before auth/CSRF/rate-limit/body validation pass;
- route resolver rejects non-reviewable provider result;
- route resolver rejects provider exceptions safely.

### Source scan tests

- route source includes preview revalidation call;
- route source does not read client live gate;
- route source does not read client candidate payload;
- route source does not insert directly;
- route source does not upsert/update/delete directly;
- route source does not reference `public.tools`;
- route source does not reference `discovered_tools` for writes.

## 15. Future Verification Commands

A future backend implementation should run at minimum:

```bash
node testing/discovery-candidate-extraction-invocation.test.mjs
node testing/discovery-candidate-preview-provider.test.mjs
node testing/discovery-candidate-preview-route.test.mjs
node testing/discovery-candidate-extraction-live-staging-panel.test.mjs
npm run check
git diff --check
```

Additional route-specific tests must be added in the implementation phase and included in verification.

Forbidden live commands unless separately approved:

- `supabase db push`;
- `supabase gen types`;
- live smoke scripts;
- manual POST requests to invoke live staging;
- DB writes;
- cleanup scripts.

## 16. Future Boundary Scans

A future backend implementation must include boundary scans for the changed files.

Required scans:

```bash
rg -n "public\.tools|discovered_tools|\.insert\(|\.upsert\(|\.update\(|\.delete\(" app/api/admin/discovery/candidate-extraction/invoke lib/discovery
rg -n "liveStagingGate|client_admin_identity_not_allowed|unsupported_request_field|verifyAdminCsrfRequest|checkAdminRateLimit" app/api/admin/discovery/candidate-extraction/invoke/route.ts
rg -n "isLiveStagingAvailable=\{true\}|method: \"POST\"|/api/admin/csrf|candidate-extraction/invoke" components/admin/discovery
```

Expected result for UI scan in backend-only activation phase:

- no `isLiveStagingAvailable={true}`;
- no new UI POST wiring;
- no UI CSRF fetch;
- no UI invoke call.

## 17. Rollback Requirements

A future backend activation implementation must be easy to revert.

Rollback plan:

- revert the backend activation commit;
- default route behavior returns to rejecting `dry_run: false`;
- UI remains disabled;
- no migration rollback should be required;
- no type rollback should be required;
- no production data cleanup should be required unless an explicitly approved live smoke created fixture rows.

## 18. Stop Conditions

The future implementation must stop if it requires:

- UI activation in the backend phase;
- client-supplied live gate;
- client-supplied candidate payload;
- client-supplied admin identity;
- bypassing CSRF;
- bypassing rate limit;
- trusting client preview;
- skipping server preview revalidation;
- staging multiple candidates;
- source scope broader than `single_run`;
- writing `public.tools`;
- writing `discovered_tools`;
- publishing a candidate;
- mutating preview artifacts;
- mutating discovery sources;
- mutating discovery runs outside separately approved audit behavior;
- running crawler code;
- running LLM code;
- applying migrations without separate approval;
- regenerating types without separate approval;
- running live smoke without exact approval phrase.

## 19. Phase 14B Verification Plan

Run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed file:

- `docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no migration files;
- no generated type files.

## 20. Commit Readiness Criteria

Phase 14B is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only this Phase 14B docs file is staged;
- no UI is changed;
- no route is changed;
- no provider/helper is changed;
- no tests are changed;
- no migration is changed;
- no generated types are changed;
- no live commands are run;
- no DB commands are run;
- no POST requests are sent;
- no CSRF fetch occurs;
- no live staging occurs.
