# Phase 9Q — Post-Schema RLS Smoke Planning / Execution Gate

## 1. Phase scope and non-execution boundary

Phase 9Q is a docs-only planning and execution-gate phase.

This phase decides how the live Candidate Staging RLS smoke should be rerun after the Phase 9N schema expansion and Phase 9P helper mapping update.

Phase 9Q does not run the live RLS smoke, does not set the RLS smoke opt-in environment variable, does not create candidate, discovery run, or discovery source rows, does not run remote SQL, does not mutate the database, does not regenerate Supabase types, and does not modify source code, tests, helpers, smoke scripts, generated types, package scripts, API routes, UI, extraction, crawler, LLM, or audit-write behavior.

## 2. Current readiness summary

Current repository state verified for Phase 9Q:

```text
## main...origin/main
```

Latest commit verified:

```text
f5cb261 Map candidate staging discovery source
```

Phase 9N applied the reviewed schema/audit expansion and regenerated Supabase TypeScript types.

Phase 9N confirmed:

- `public.discovery_candidate_tools.discovery_source_id` exists;
- `discovery_source_id` is nullable;
- the FK `discovery_candidate_tools_discovery_source_id_fkey` references `public.discovery_sources(id)` with `on delete restrict`;
- source and run/source indexes exist;
- candidate staging audit actions are allowed by the audit action constraint;
- RLS remains enabled on `public.discovery_candidate_tools`;
- no anon/authenticated grants exist on `public.discovery_candidate_tools`.

Phase 9P implemented the helper mapping:

```ts
discovery_source_id: input.discoverySourceId.trim()
```

Phase 9P also updated mocked tests to assert the insert payload persists `discovery_source_id` and trims padded `discoverySourceId` values. The targeted mocked candidate staging test passes with 9 tests passing.

## 3. Prior live RLS smoke context

The prior live RLS smoke was documented in:

```text
docs/discovery-phase-9h-candidate-staging-rls-smoke-result.md
```

Phase 9G executed the approved RLS smoke once and passed.

Documented Phase 9G result:

```text
Service-role control read: pass
Anonymous exact-ID read denial: pass (permission_denied)
Anonymous list denial: pass (permission_denied)
Guessed exact candidate ID denial: pass (permission_denied)
Authenticated non-admin denial: skipped (no approved non-admin test identity strategy)
No payload leakage: pass
Exact-ID cleanup: verified
```

Phase 9Q does not rerun that smoke.

## 4. Existing RLS smoke harness inspection summary

Current RLS smoke script:

```text
testing/discovery-candidate-staging-rls-smoke.mjs
```

Current package command:

```text
npm run smoke:discovery-candidate-staging:rls
```

Current opt-in environment variable:

```text
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```

Without the opt-in variable, the smoke exits before environment loading, helper imports, client creation, and database operations.

Current live behavior when opted in:

- creates a dedicated inactive discovery source fixture;
- creates a dedicated discovery run fixture;
- normalizes one controlled candidate fixture;
- calls `stageNormalizedDiscoveryCandidate(...)` exactly once;
- verifies returned `candidateStatus`, `discoveryRunId`, `discoverySourceId`, and `auditCorrelationId`;
- performs service-role minimal readback;
- verifies anonymous exact-ID read denial;
- verifies anonymous list denial;
- records guessed exact-ID denial;
- skips authenticated non-admin because no approved test identity strategy exists;
- verifies no-payload-leak logging;
- cleans up the exact candidate, run, and source IDs in `finally`;
- reports candidate/run/source IDs, marker, and audit correlation ID if manual cleanup is required.

Current selected service-role/anonymous readback fields:

```text
id
candidate_status
discovery_run_id
audit_correlation_id
source_evidence_locator
created_at
updated_at
```

Current script does not write audit events, does not write to `public.tools`, and does not write to `discovered_tools`.

## 5. Source ID readback gate caveat

Phase 9P now maps `discoverySourceId` into `discovery_candidate_tools.discovery_source_id`.

The current RLS smoke script verifies the returned helper result contains the expected `discoverySourceId`, but its service-role readback does not currently select or assert `discovery_source_id`.

For a post-schema RLS smoke to directly prove the persisted database row includes `discovery_source_id`, Phase 9R must either:

1. explicitly accept the current coverage as sufficient for an RLS-only rerun because the live insert now uses the updated helper and FK-backed insert payload; or
2. first receive approval for a minimal smoke-harness readback patch that adds `discovery_source_id` to the service-role selected fields and asserts it equals the dedicated discovery source fixture ID.

Recommended safe gate decision:

Phase 9R should not claim direct service-role readback verification of `discovery_source_id` unless the smoke harness is patched or Gemini explicitly accepts the current helper-result verification as sufficient for this rerun.

## 6. Future Phase 9R live command boundary

Future Phase 9R command only:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
```

This command performs live database writes to create controlled smoke fixtures. It must not be run in Phase 9Q.

The opt-in environment variable must be set only for the single explicitly approved command.

## 7. Required preconditions before Phase 9R execution

Before any future live execution:

- Gemini must approve this Phase 9Q gate document.
- James must explicitly approve the live Phase 9R RLS smoke execution.
- The Phase 9Q gate document should be committed and pushed.
- Repository status must be clean and synced:

```text
## main...origin/main
```

- Latest commit must be the approved Phase 9Q commit, unless James explicitly approves otherwise.
- `npm run check` must pass.
- The targeted mocked candidate staging test must pass.
- The RLS smoke opt-out path must still prove no environment values loaded, no DB client created, and no DB operation performed.
- Required env names must be present without printing values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- No secrets, service-role keys, anon keys, JWTs, tokens, connection strings, or `.env.local` values may be printed.
- Cleanup behavior must remain exact-ID only.
- Manual cleanup reporting must include exact candidate/run/source IDs, marker, and audit correlation ID if cleanup fails.
- No repeated live runs may occur without separate approval.

## 8. Expected future live smoke assertions

Future Phase 9R should verify:

- the helper inserts exactly one controlled staged candidate;
- `candidate_status` remains `"staged"`;
- returned `discoveryRunId` matches the dedicated run fixture;
- returned `discoverySourceId` matches the dedicated source fixture;
- returned `auditCorrelationId` matches the generated smoke UUID;
- the persisted row includes `discovery_source_id`, if direct readback is approved or the harness is patched to select it;
- anonymous/public exact-ID read remains denied;
- anonymous/public list read remains denied;
- guessed exact candidate ID does not expose the row;
- authenticated non-admin remains skipped unless a safe approved identity strategy exists;
- denial logs use safe categories only;
- no full candidate payload is printed;
- no raw Supabase error object is printed;
- exact-ID cleanup removes only the smoke-created candidate, run, and source rows;
- cleanup verification confirms the exact IDs are gone;
- no `public.tools` writes occur;
- no `discovered_tools` writes occur.

## 9. Expected audit action behavior

Phase 9N expanded the audit action constraint to allow future candidate staging actions.

The current RLS smoke script does not write audit events and does not check audit event rows.

Future Phase 9R should not add audit event writes unless a separate Gemini-approved audit-write implementation phase exists. The post-schema RLS smoke should remain focused on candidate staging RLS posture and exact cleanup.

## 10. Safety boundaries for future Phase 9R

Future Phase 9R must not:

- modify source code, tests, helpers, smoke scripts, generated types, package scripts, migrations, API routes, UI, extraction, crawler, or LLM behavior during execution;
- run `supabase db push`;
- run remote SQL outside the approved smoke command;
- regenerate Supabase types;
- create more than one controlled candidate fixture;
- create production-like source or candidate fixtures;
- write to `public.tools`;
- write to `discovered_tools`;
- approve, promote, publish, rank, or recommend candidates;
- add audit event writes;
- perform broad cleanup by marker, date, status, name, or domain;
- print secrets, environment values, full candidate payloads, or raw database errors.

Future Phase 9R may create only the controlled smoke source, run, and staged candidate required by the opt-in smoke harness, and must clean them up by exact IDs in `finally`.

## 11. Risks and mitigations

Risk: The current RLS smoke script does not directly read back `discovery_source_id`.

Mitigation: Treat direct persisted-source readback as a Phase 9R gate decision. Either patch the smoke harness in a separate approved implementation step or explicitly scope Phase 9R as an RLS posture rerun that relies on helper result verification plus successful FK-backed insert behavior.

Risk: The live smoke leaves orphan fixtures if cleanup fails.

Mitigation: Keep exact-ID cleanup in `finally`, verify exact IDs are gone, and report candidate/run/source IDs, marker, and audit correlation ID for manual cleanup.

Risk: RLS denial logging leaks row payloads or raw errors.

Mitigation: Preserve safe denial categorization and masked error output.

Risk: The nullable `discovery_source_id` column is interpreted as optional at the helper boundary.

Mitigation: Preserve Phase 9P strict `discoverySourceId` validation; the nullable DB column exists for migration safety only.

Risk: Audit constraint expansion is mistaken for permission to write audit events.

Mitigation: Keep audit event writes out of Phase 9R unless separately planned, implemented, reviewed, and approved.

## 12. Phase 9Q verification results

Phase 9Q safe checks:

- targeted mocked candidate staging test passed with 9 tests passing;
- `npm run check` passed after rerunning outside the sandbox due to the known Turbopack port-binding restriction;
- RLS smoke opt-out passed and confirmed no environment values loaded, no DB client created, and no DB operation performed.

Known non-blocking warnings:

- `MODULE_TYPELESS_PACKAGE_JSON` during the mocked Node test;
- `Using edge runtime on a page currently disables static generation for that page` during Next build.

## 13. Phase 9Q boundaries preserved

Phase 9Q preserves these boundaries:

- no live RLS smoke run;
- RLS opt-in environment variable not set;
- no database mutation;
- no remote SQL;
- no candidate/run/source rows created;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no `supabase db push`;
- no Supabase type regeneration;
- no source/test/helper/smoke/generated type/package script changes;
- no API/UI/extraction/crawler/LLM integration.

## 14. Recommended next phase

Recommended next phase:

```text
Phase 9R — Post-Schema Candidate Staging RLS Smoke Execution
```

Recommended Phase 9R scope:

- execute one explicitly approved live RLS smoke command;
- verify anonymous/public RLS denial still holds after schema expansion and helper mapping;
- verify exact-ID cleanup;
- keep API/UI/extraction/crawler/LLM integration deferred;
- keep audit writes deferred.

Before Phase 9R execution, Gemini should decide whether the current smoke harness is sufficient or whether a minimal pre-execution harness readback patch is required to directly assert persisted `discovery_source_id`.

## 15. Rollback plan

Phase 9Q rollback is docs-only:

- remove `docs/discovery-phase-9q-post-schema-rls-smoke-planning-execution-gate.md`;
- no database rollback is needed because Phase 9Q performs no database operations.
