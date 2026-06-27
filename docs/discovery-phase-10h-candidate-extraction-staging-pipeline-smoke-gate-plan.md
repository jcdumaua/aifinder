# Phase 10H — Candidate Extraction Staging Pipeline Smoke Gate Plan

## 1. Phase scope

Phase 10H is a docs-only planning and inspection phase for the Candidate Extraction Staging Pipeline mocked-boundary verification and future live-smoke gate.

This phase does not implement a live smoke harness, does not run live smoke, does not set any live-smoke opt-in environment variable, does not create database rows, does not run remote SQL, does not modify source code, tests, helpers, smoke scripts, generated types, package scripts, API routes, UI, crawler automation, LLM behavior, live executor integration, or production wiring.

The purpose of this document is to define how a future phase should safely verify the mapper-to-staging-helper bridge before any live execution, and how a separately approved live smoke should be constrained.

## 2. Current validated foundation

The current Candidate Extraction Staging Pipeline foundation is ready for a smoke-gate plan:

- Phase 10D implemented and pushed the pure/local candidate extraction mapper.
- Phase 10G implemented and pushed the staging pipeline integration bridge.
- `mapExtractionToStagingCandidate(...)` exists in `lib/discovery/discovery-candidate-extraction-mapper.ts`.
- `stageMappedExtractionCandidate(...)` and `stageMappedExtractionCandidateBatch(...)` exist in `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`.
- The mapper test passes.
- The integration test passes.
- The existing candidate staging helper mocked test passes.
- The integration module is a narrow mapper-to-staging-helper bridge.
- The integration module does not create Supabase clients, read environment variables, perform direct DB reads/writes, call network APIs, or write to `public.tools` / `discovered_tools`.
- The existing staging helper remains the only boundary that can write staged candidates.
- Phase 9S previously passed the live post-schema Candidate Staging RLS smoke for direct staging helper behavior, source lineage, anonymous/public denial, no payload leakage, and exact-ID cleanup.

## 3. Mocked boundary verification status

Phase 10G mocked/unit coverage verifies the current local boundary:

- mapper failure avoids the staging dependency;
- mapper failure returns a safe mapper failure summary;
- mapper success calls the injected staging dependency exactly once;
- staging input preserves `discoveryRunId`;
- staging input preserves `discoverySourceId`;
- staging input preserves `auditCorrelationId`;
- staging success returns a safe staged-candidate summary;
- staging failure returns a safe staging failure summary;
- thrown staging dependency errors are normalized safely;
- batch processing preserves result order;
- batch processing supports partial success and failure;
- batch counts total, processed, skipped, staged, mapper-failed, and staging-failed items;
- `maxItems` prevents unbounded batch execution;
- no raw input or full candidate payload appears in failure summaries;
- no direct DB/env/network/public/discovered write paths are present.

This mocked boundary is sufficient before planning a live smoke harness. It does not prove live database behavior for the integration bridge itself; that requires a future explicitly approved live smoke phase.

## 4. Future live smoke objective

A future live smoke should prove the complete staging-only bridge:

```text
bounded extraction input
  -> mapExtractionToStagingCandidate(...)
  -> stageMappedExtractionCandidate(...)
  -> stageNormalizedDiscoveryCandidate(...)
  -> public.discovery_candidate_tools
```

The future smoke objective is to verify that:

- `stageMappedExtractionCandidate(...)` can execute through mapper, integration, and staging helper;
- a controlled staged candidate row is created in `discovery_candidate_tools`;
- `discovery_source_id` persists and matches the controlled source fixture;
- `discovery_run_id` persists and matches the controlled run fixture;
- `audit_correlation_id` persists and matches the controlled audit correlation ID;
- candidate status remains `staged`;
- exact-ID cleanup removes only smoke-created fixtures;
- anonymous/public RLS denial remains intact if the smoke reuses existing RLS denial patterns;
- no candidate payload leaks through denial logs;
- no `public.tools` or `discovered_tools` writes occur;
- no audit event writes occur unless a separate reviewed audit phase explicitly authorizes them.

## 5. Live smoke hard gate requirements

Any future live smoke must remain gated and single-purpose.

Required gate rules:

- James must explicitly approve the live smoke execution phase.
- The smoke must use a new dedicated opt-in environment variable, for example:

```text
AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1
```

- The default path must be safe opt-out.
- The safe opt-out path must not load environment values.
- The safe opt-out path must not create a DB client.
- The safe opt-out path must not perform a DB operation.
- The opt-in variable must be set inline for one command only.
- The opt-in variable must not be exported or persisted.
- The smoke must log exact smoke fixture IDs or a marker.
- The smoke must clean up by exact ID.
- Cleanup verification must be mandatory.
- The smoke must not run arbitrary remote SQL.
- The smoke must not write to `public.tools`.
- The smoke must not write to `discovered_tools`.
- The smoke must not write audit events unless separately planned and approved.
- The smoke must not add API/UI/crawler/LLM/live executor integration.

## 6. Proposed future live smoke script

Recommended future script path:

```text
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
```

Recommended manual command for a future approved execution:

```bash
AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
```

The future smoke should not add a package script until the harness is reviewed. If a package script is later preferred for repo consistency, it should be added in a separate reviewed phase and must preserve the same safe opt-out guard.

## 7. Proposed future smoke fixture design

The future smoke should use controlled, exact-ID fixtures:

1. Generate a unique smoke marker.
2. Create one controlled `discovery_sources` fixture.
3. Create one controlled `discovery_runs` fixture linked to the source.
4. Build a safe bounded extraction input item.
5. Call `stageMappedExtractionCandidate(...)` exactly once for the single-item path.
6. Confirm mapper success and staging success.
7. Read back the staged candidate by exact candidate ID with service role.
8. Assert source/run/audit/status fields.
9. Optionally perform anonymous/public denial checks using the existing RLS smoke patterns if doing so does not expand risk.
10. Verify no `public.tools` or `discovered_tools` rows were written by the smoke.
11. Clean up in this exact order:
    - staged candidate;
    - discovery run;
    - discovery source.
12. Verify each exact ID was removed.

The smoke should not use broad cleanup queries, cleanup by status, cleanup by created date, cleanup by name, or cleanup by domain.

## 8. Proposed future smoke assertions

The future smoke should assert:

- opt-in guard is satisfied only for the approved command;
- controlled source fixture is created;
- controlled run fixture is created;
- mapper result succeeds;
- staging result succeeds;
- candidate ID is returned;
- `discovery_source_id === sourceId`;
- `discovery_run_id === runId`;
- `audit_correlation_id === expectedCorrelation`;
- `candidate_status === "staged"`;
- service-role readback uses minimal safe columns;
- anonymous exact-ID denial passes if included;
- anonymous list denial passes if included;
- guessed/nonexistent exact-ID denial passes if included;
- denial logs do not leak candidate payloads;
- exact-ID cleanup runs;
- candidate cleanup is verified;
- run cleanup is verified;
- source cleanup is verified.

If anonymous/public denial checks are included, the smoke should reuse the safe-denial categories from the existing candidate staging RLS smoke and must not print raw Supabase error objects.

## 9. Proposed future smoke failure handling

The future smoke must fail closed:

- cleanup must run in `finally`;
- safe logs only;
- no raw HTML;
- no prompt/model output;
- no secrets;
- no environment value printing;
- no service-role key or anon key printing;
- no full candidate payloads;
- no raw Supabase response dumps;
- no stack traces in log-safe summaries;
- stop on missing required environment variables after opt-in;
- stop on unexpected public/discovered tool writes;
- fail if exact-ID cleanup cannot be verified;
- do not rerun automatically after failure.

If cleanup fails, the output should identify only the exact fixture IDs requiring review and should not attempt ad-hoc cleanup unless James explicitly approves a separate cleanup plan.

## 10. Future mocked test strengthening plan

Current Phase 10G mocked tests are sufficient for the bridge boundary.

No additional mocked tests are required before planning the live smoke harness. Optional future strengthening could include:

- asserting batch success does not expose full mapped `stagingInput`;
- asserting `maxItems` rejects or clamps non-integer values if future callers expose that option;
- adding a test for an empty batch result if future implementation semantics require it.

These are optional refinements and should not block the smoke harness planning sequence.

## 11. Non-goals

Phase 10H and the future smoke gate do not authorize:

- public tool creation;
- writes to `public.tools`;
- writes to `discovered_tools`;
- admin UI integration;
- public UI integration;
- API routes;
- crawler automation;
- LLM extraction;
- live executor integration;
- production scheduling;
- source/run DB existence checks outside the controlled smoke fixture path;
- audit event writes;
- approval, rejection, promotion, publishing, ranking, or recommendation behavior;
- broad cleanup tooling;
- schema changes;
- Supabase type generation.

## 12. Future phase sequencing

Recommended future sequence:

1. Phase 10I — Candidate Extraction Staging Pipeline Smoke Harness Implementation
2. Phase 10J — Candidate Extraction Staging Pipeline Smoke Harness Review / Commit
3. Phase 10K — Candidate Extraction Staging Pipeline Live Smoke Execution Gate
4. Phase 10L — Candidate Extraction Staging Pipeline Live Smoke Execution Result Documentation

Phase 10I should implement the smoke harness only. It should not run live smoke.

Phase 10K should be the explicit live execution gate. It should not run unless James approves execution.

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Future smoke accidentally runs by default | Require a dedicated opt-in env var and safe opt-out path with no env load, no DB client, and no DB operation. |
| Future smoke writes public or discovered tool rows | Assert no `public.tools` / `discovered_tools` writes and keep the harness staging-only. |
| Fixture cleanup leaves rows behind | Use exact IDs, cleanup in `finally`, and verify candidate → run → source deletion. |
| Logs expose raw extraction payloads or secrets | Log only safe IDs, markers, statuses, and safe error categories. |
| RLS coverage expands into unaudited auth scenarios | Keep authenticated non-admin coverage deferred unless a safe test identity strategy is approved. |
| Audit writes are added prematurely | Keep audit writes deferred to a separate reviewed phase. |
| Smoke harness becomes production integration | Keep the harness under `testing/`, manually gated, and separate from API/UI/crawler/LLM flows. |
| Batch behavior increases live fixture complexity | First live smoke should use one controlled candidate. Batch live smoke can be planned later if needed. |

## 14. Safety boundaries preserved in Phase 10H

Phase 10H preserved these boundaries:

- No live smoke was implemented.
- No live smoke was run.
- No live-smoke opt-in environment variable was set.
- No candidate rows were created.
- No discovery run rows were created.
- No discovery source rows were created.
- No live DB reads or writes occurred.
- No remote SQL was run.
- No `supabase db push` was run.
- No migrations were run.
- No Supabase types were regenerated.
- No source code was modified.
- No tests were modified.
- No helper behavior was modified.
- No smoke scripts were modified.
- No generated types were modified.
- No package scripts were modified.
- No API/UI/crawler/LLM/live executor integration was added.
- No production pipeline wiring was added.
- No `public.tools` writes occurred.
- No `discovered_tools` writes occurred.
- No audit event writes occurred.

## 15. Recommended next phase

Recommended next phase:

```text
Phase 10I — Candidate Extraction Staging Pipeline Smoke Harness Implementation
```

Recommended Phase 10I scope:

- create `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs`;
- add the dedicated opt-in guard;
- implement safe opt-out behavior;
- implement controlled fixture creation and exact-ID cleanup;
- call `stageMappedExtractionCandidate(...)` once in the opt-in path;
- verify source/run/audit/status readback;
- optionally include anonymous/public denial checks if reviewed;
- do not run live smoke;
- do not add API/UI/crawler/LLM/live executor integration;
- do not write to `public.tools` or `discovered_tools`;
- do not add audit writes.
