# Phase 9D — Candidate Staging RLS Smoke Planning

## 1. Phase title and status

Phase 9D is a docs-only RLS smoke planning phase.

This phase performs no database operations, runs no live smoke, runs no RLS smoke, and changes no source code, tests, smoke scripts, helpers, generated Supabase types, migrations, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 8X implemented the bounded staging method:

```ts
stageNormalizedDiscoveryCandidate(...)
```

Phase 8Z added the opt-in functional live smoke harness:

```text
testing/discovery-candidate-staging-live-smoke.mjs
```

Phase 9A executed the functional live smoke successfully. That smoke created a dedicated inactive manual discovery source fixture, a dedicated completed discovery run fixture, and one controlled staged candidate fixture. Minimal readback passed, and exact-ID cleanup was verified.

Phase 9B documented the successful live smoke result.

Phase 9C planned candidate staging smoke hardening and RLS/security checks. Phase 9C and Gemini recommended Option B: create a separate dedicated RLS smoke script in a future phase instead of expanding the existing functional staging smoke harness.

API/UI/extraction/crawler/LLM integration remains deferred. Candidate staging remains a server/admin staging capability and is not a public tool creation, approval, promotion, publishing, ranking, recommendation, or extraction system.

## 3. Purpose of Phase 9D

Phase 9D defines the future RLS smoke plan before implementation.

The future RLS smoke should prove that:

- service-role/admin server-side access can create, read, and clean up controlled fixtures;
- anon/public clients cannot read candidate staging rows;
- guessed exact candidate IDs do not expose candidate data;
- authenticated non-admin clients cannot read candidate staging rows, if such a safe test client path exists;
- denial results do not leak row payloads or secrets.

Phase 9D does not implement or run the RLS smoke.

## 4. Strict non-goals

Phase 9D does not:

- perform database operations;
- rerun the functional live smoke;
- execute an RLS smoke;
- execute SQL;
- run migrations;
- regenerate Supabase types;
- modify generated Supabase types;
- add source code;
- add tests;
- modify smoke scripts;
- modify helpers;
- add API routes;
- add UI integration;
- add extraction integration;
- add crawler automation;
- add LLM behavior;
- write to `public.tools`;
- write to `discovered_tools`;
- write audit events;
- approve, promote, publish, rank, or recommend candidates.

## 5. Recommended future RLS smoke architecture

Gemini recommended Option B from Phase 9C: create a separate dedicated RLS smoke script.

Recommended future path:

```text
testing/discovery-candidate-staging-rls-smoke.mjs
```

This script should not be added in Phase 9D.

A separate RLS smoke is safer because it:

- isolates security/identity checks from the functional staging smoke;
- avoids overloading the Phase 8Z functional smoke harness;
- allows specialized anon/authenticated client behavior;
- keeps future CI optional and clearly opt-in;
- makes failure interpretation clearer;
- preserves the already-passing functional staging smoke path.

The future RLS smoke should reuse the same core fixture discipline as the functional smoke: one source fixture, one run fixture, one candidate fixture, minimal readback, and exact-ID cleanup.

## 6. Future opt-in guard

The future RLS smoke should use a separate explicit opt-in guard:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```

Without this environment variable, the future script must exit before:

- loading environment values;
- importing Supabase helpers;
- creating clients;
- performing database operations.

The opt-out path should be safe to run locally and should report:

- the required opt-in variable name;
- that no environment values were loaded;
- that no clients were created;
- that no database operation was performed.

## 7. Future environment requirements

The future RLS smoke should check environment variable presence without printing values.

Likely required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key should be used only for controlled fixture setup, service-role control read, and exact-ID cleanup.

The anon key should be used only for anon/public read-denial checks.

Authenticated non-admin checks may require a separately approved safe test user/session strategy. The future script must not create users without approval and must not use personal/admin production credentials for non-admin tests.

If required environment variables are missing, the future script should fail closed before any database operation.

## 8. Future fixture strategy

The future RLS smoke should create a controlled fixture using service-role access only.

Planned fixture sequence:

1. Create one dedicated inactive test `discovery_sources` fixture.
2. Create one dedicated test `discovery_runs` fixture linked to the source.
3. Stage exactly one controlled candidate through `stageNormalizedDiscoveryCandidate(...)`.
4. Keep the candidate alive only long enough to test read-denial behavior.
5. Clean up by exact IDs in `finally`.

Fixture requirements:

- test-only marker;
- example/test domain;
- valid UUID `audit_correlation_id`;
- marker in a safe bounded field such as `source_evidence_locator`;
- no raw HTML;
- no screenshots;
- no prompts;
- no source blobs;
- no real vendor/tool branding;
- no `public.tools` writes;
- no `discovered_tools` writes.

The fixture should use the same normalizer/staging method path already validated by Phase 9A, not a raw table insert for the candidate.

## 9. Future RLS test cases

### Test 1 — Service-role control read

Purpose:

Confirm the service-role/admin server-side client can read the staged candidate by exact ID using minimal fields only.

Expected:

The service-role client can retrieve minimal safe fields for the controlled candidate.

Allowed fields:

```text
id
candidate_status
discovery_run_id
audit_correlation_id
source_evidence_locator
created_at
updated_at
```

The future script must not print a full row or payload dump.

### Test 2 — Anonymous exact-ID read denial

Purpose:

Confirm the anon/public client cannot read the controlled candidate by exact ID.

Expected acceptable outcomes:

- empty data / no row visible due to RLS; or
- permission-denied style error without row payload.

Unacceptable outcomes:

- raw candidate row returned;
- full payload printed;
- secrets printed;
- detailed internal schema/constraint leakage.

### Test 3 — Anonymous list denial

Purpose:

Confirm the anon/public client cannot list `discovery_candidate_tools`.

Expected acceptable outcomes:

- empty data; or
- permission-denied style error without row payload.

Unacceptable outcome:

- any staged candidate row is visible to anon/public.

### Test 4 — Guessed exact candidate ID denial

Purpose:

Confirm that even with the known candidate ID, anon/public cannot retrieve the candidate row.

This overlaps with Test 2 operationally, but it should be reported as an explicit security assertion because the primary threat model is direct-client access with a guessed or leaked candidate ID.

Expected:

- no candidate row is visible;
- denial result remains minimal.

### Test 5 — Authenticated non-admin exact-ID denial, if safely available

Purpose:

Confirm an authenticated non-admin client cannot read candidate staging rows.

Important:

Only implement this later if a safe non-admin test-user/session strategy exists and is Gemini-approved.

Do not use real personal/admin credentials. Do not create users unless a later phase explicitly approves that setup. If no safe non-admin path exists, this test should be reported as skipped/not applicable with a short reason.

### Test 6 — No payload leakage on denial

Purpose:

Verify denial output is minimal.

Expected logs:

- pass/fail;
- request type;
- safe status/error category;
- no row payload;
- no secret values.

Unacceptable logs:

- full candidate payload;
- source config dump;
- service-role key;
- anon key;
- user token;
- raw evidence;
- raw DB error object that includes sensitive details.

## 10. Denial-result interpretation

Supabase/RLS may return different safe denial forms depending on client/query shape.

Acceptable denial forms may include:

- empty array;
- `null` row;
- permission-denied error;
- 401/403-style failure depending on client context.

The key pass/fail criterion:

```text
No candidate row or sensitive payload is visible to unauthorized clients.
```

The future smoke should not require one exact HTTP status unless the project's client behavior is confirmed. It should classify denial outcomes into safe categories and avoid printing raw error objects.

## 11. Cleanup and rollback plan

Future RLS smoke cleanup must:

- run in `finally`;
- delete exact staged candidate ID;
- delete exact discovery run ID;
- delete exact discovery source ID;
- verify exact IDs are gone;
- never use broad cleanup;
- never delete by date/status/name/domain alone;
- never delete from `public.tools`;
- never delete from `discovered_tools`.

If cleanup fails:

- report exact candidate/run/source IDs;
- report the smoke marker;
- report `audit_correlation_id`;
- require manual cleanup.

The future RLS smoke should not add fallback delete-by-marker behavior unless a separate Gemini-approved cleanup phase designs it.

## 12. Orphan diagnostic relation

The RLS smoke is not an orphan cleanup tool.

Orphan diagnostics should remain read-only/report-only unless separately approved. A future orphan diagnostic may use exact smoke marker patterns such as:

- `source_evidence_locator`;
- smoke-specific source slug;
- smoke-specific source config marker;
- exact fixture IDs;
- exact `audit_correlation_id`.

Any cleanup must remain exact-ID and explicitly approved. Broad status/date/name/domain cleanup remains forbidden.

## 13. Security logging plan

Future RLS smoke logs may include:

- phase name;
- smoke marker;
- fixture IDs;
- pass/fail outcome;
- safe denial category;
- cleanup success/failure.

Logs must not include:

- service-role key;
- anon key;
- user tokens;
- full candidate row;
- raw DB error object if sensitive;
- raw HTML;
- raw evidence;
- source blobs.

## 14. Future implementation gates

Before implementing the RLS smoke harness:

1. Gemini must approve Phase 9D.
2. James must approve Phase 9E implementation.
3. Phase 9E must not run the live RLS smoke unless separately approved.
4. Commit and push remain separate approval steps.
5. Future execution requires explicit James approval.

The implementation phase should test only opt-out guard behavior and static/project checks unless the user explicitly approves live DB execution.

## 15. Future execution command boundary

Planned future command shape:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
```

This command must not exist or run in Phase 9D except as documentation. If the package script is added in a future implementation phase, it must remain opt-in and must not perform live work without the required environment variable.

## 16. Future CCR requirements

Future RLS smoke execution CCR must include:

- exact command used;
- fixture IDs;
- smoke marker;
- audit correlation UUID;
- service-role control read result;
- anon exact-ID denial result;
- anon list denial result;
- guessed-ID denial result;
- authenticated non-admin result or skipped reason;
- no-payload-leak confirmation;
- cleanup verification;
- confirmation no `public.tools` rows were touched;
- confirmation no `discovered_tools` rows were touched;
- confirmation no API/UI/extraction/crawler/LLM behavior ran;
- final `git status --short --branch`.

## 17. Recommended next phase

Recommended next phase:

```text
Phase 9E — Candidate Staging RLS Smoke Harness Implementation
```

Scope:

- implement the dedicated opt-in RLS smoke script;
- add a clearly named package script if appropriate;
- do not run the live RLS smoke in the implementation phase;
- test only the opt-out guard and static/project checks;
- return for Gemini review before commit.

This is the safest next step because Phase 9D already defines the test cases, fixture strategy, denial interpretation, cleanup rules, and execution gates. Adding another planning patch would slow progress without materially reducing risk, as long as Phase 9E remains implementation-only and does not execute live DB checks.

If Phase 9E uncovers ambiguity around authenticated non-admin testing, that specific test should be skipped/deferred rather than blocking the anon/public RLS smoke harness.

## 18. Rollback plan

Phase 9D rollback is docs-only:

- remove `docs/discovery-phase-9d-candidate-staging-rls-smoke-planning.md`;
- no database rollback is needed because Phase 9D performs no database operation.

## 19. Final Phase 9D decision summary

Phase 9D plans a separate dedicated RLS smoke harness and does not implement or run it.

The future RLS smoke should prove that direct anon/public access cannot read staged candidate rows, even by exact candidate ID, while preserving the established service-role fixture setup and exact-ID cleanup discipline.

API/UI/extraction/crawler/LLM integration remains blocked until separately planned, reviewed, and approved.
