# Discovery Phase 10M — Candidate Extraction Staging Pipeline Production Integration Readiness Gate

## Phase

Phase 10M — Candidate Extraction Staging Pipeline Post-Smoke Review / Production Integration Readiness Gate.

## Date

June 27, 2026.

## Status

Readiness gate documented.

## Scope

This phase is a docs-only readiness and integration-governance phase.

It does not implement production invocation, does not wire the Candidate Extraction Staging Pipeline into API, UI, crawler automation, LLM execution, live executor flow, or scheduled production work, and does not modify source code, tests, package scripts, generated types, migrations, or database state.

This phase also does not rerun the live smoke and does not set `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1`.

## Completed Foundation

The Candidate Extraction Staging Pipeline foundation is now validated through planning, local implementation, mocked tests, a guarded smoke harness, and a live smoke result:

- Phase 10D implemented the pure/local mapper `mapExtractionToStagingCandidate(...)`.
- The mapper is DB-free, network-free, environment-free, and does not call the staging helper.
- Mapper tests verify required field handling, URL validation, category/pricing validation, unsafe payload rejection, audit correlation handling, and staging-input compatibility.
- The existing staging helper `stageNormalizedDiscoveryCandidate(...)` is implemented and tested.
- The staging helper persists `discoverySourceId` into `discovery_candidate_tools.discovery_source_id`.
- The staging helper keeps `candidate_status = "staged"`.
- Phase 10G implemented `stageMappedExtractionCandidate(...)` and `stageMappedExtractionCandidateBatch(...)`.
- The integration bridge calls the mapper first and calls the staging helper only on mapper success.
- Integration tests verify mapper failure avoidance, staging dependency injection, run/source/audit ID preservation, safe summaries, batch partial success/failure, and no direct DB/env/network/public/discovered write paths.
- Phase 10I implemented a dedicated smoke harness with safe opt-out behavior.
- The smoke harness avoids environment loading, DB client creation, and DB operations unless `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1` is set.
- Phase 10K ran the live smoke once after explicit James approval.
- Phase 10L documented the live smoke result as passed.
- The live smoke verified mapper success, staging success, service-role readback, `discovery_source_id`, `discovery_run_id`, `audit_correlation_id`, staged status, public table isolation, anonymous denial, no payload leakage, and exact-ID cleanup.

## Readiness Decision

The Candidate Extraction Staging Pipeline is technically ready for a future controlled production integration planning phase.

It is not ready for immediate production wiring.

Before production invocation is implemented, the project needs a dedicated invocation contract and implementation plan that defines who may call the pipeline, how source/run context is approved, how batch execution is constrained, what observability is allowed, and how errors are surfaced without leaking raw payloads or secrets.

Readiness conclusion:

```text
The Candidate Extraction Staging Pipeline is ready for a future controlled production integration planning phase, but not for immediate production wiring without a dedicated invocation contract and implementation plan.
```

## Production Integration Prerequisites

Future production invocation must satisfy all of these prerequisites before implementation.

### Invocation boundary

- Invocation must be authenticated and admin-only, or must run inside a server-only trusted executor with an equivalent authorization boundary.
- No public or anonymous caller may invoke the pipeline.
- No browser/client-side bundle may receive service-role credentials or direct staging privileges.
- If exposed through an API route, the route must include admin session enforcement, CSRF protection where applicable, and rate limiting.
- If exposed through a worker or executor, the executor must have an explicit trusted job source and must not accept arbitrary public input.

### Service-role and database access

- Service-role usage must remain server-only.
- Service-role clients must not be created in UI/client code.
- The integration layer must continue to write only through the existing staging helper.
- The production invocation layer must not write directly to `public.tools`.
- The production invocation layer must not write to `discovered_tools`.
- The production invocation layer must not add audit event writes until a separate audit-write design is reviewed and approved.

### Source and run lifecycle

- Every invocation must use an approved `discoveryRunId`.
- Every invocation must use an approved `discoverySourceId`.
- Source/run IDs must be supplied by trusted upstream discovery records.
- The invocation layer must not invent source IDs or run IDs.
- Source/run ID validation must occur before staging.
- If source/run existence checks are added, they must be server-only and separately reviewed because they introduce live DB reads.
- A staged candidate must preserve both source and run lineage.

### Input contract and validation

- Input must satisfy the existing mapper contract.
- The mapper must remain the first validation boundary before staging.
- `candidate_status` must remain `staged`.
- `auditCorrelationId` must be provided or generated according to the existing mapper/helper contract.
- Candidate URL, source URL, category, pricing, descriptions, tags, platforms, and evidence summaries must remain bounded and validated.
- Raw HTML, prompt text, model output, screenshots, source blobs, cookies, headers, secrets, and unbounded payloads must not be persisted in candidate rows.
- Batch size must be capped.
- Batch processing must retain partial success/failure semantics and safe summaries.

### Error handling and observability

- Errors must use structured safe codes and messages.
- Logs must not contain raw payloads, full candidate objects, full database rows, raw Supabase errors, stack traces, secrets, keys, tokens, cookies, or environment values.
- Success logs may include safe IDs, counts, status labels, and audit correlation IDs.
- Failure logs may include safe failure stage, failure code, field name, source/run/candidate IDs when safe, and correlation IDs.
- Production observability should track counts, duration, mapper failures, staging failures, batch caps, and skipped items.

### Test-path cleanup and rollback expectations

- Live smoke/test paths must use exact fixture IDs.
- Test cleanup must remove candidate, run, and source fixtures by exact ID.
- Cleanup verification must be mandatory for live smoke paths.
- Production invocation should not rely on broad cleanup queries.
- Rollback for production failures should be a separate operational design, not an implicit broad delete.

## Future Invocation Architecture Options

### Option 1 — Internal server helper invocation

An internal server-only helper can call `stageMappedExtractionCandidate(...)` from an approved admin/server context.

This is the lowest-risk first production integration shape because it avoids public routing, avoids UI exposure, and allows tight control of source/run context.

### Option 2 — Admin-only API endpoint

An admin-only API endpoint can invoke the pipeline for approved extraction items.

This option requires the strongest request-boundary work: admin session verification, CSRF handling, rate limiting, request-size limits, safe response summaries, and audit planning before use.

### Option 3 — Worker or executor invocation

A trusted worker or executor can invoke the pipeline from approved jobs.

This option is appropriate only after the job source, job claim semantics, retry behavior, idempotency strategy, batch caps, and operational logging are designed.

### Option 4 — Crawler or extraction pipeline invocation

Crawler or extraction automation can call the pipeline only after separate gates approve crawler automation, LLM/extraction behavior, source/run lifecycle, and production controls.

This should not be the first production integration path because it expands both input volume and failure modes.

## Recommended First Production Integration Path

The recommended first production integration path is a narrow internal/admin-only dry-run or controlled server-side executor invocation.

The first production-oriented implementation should:

- accept only approved bounded extraction input;
- require trusted `discoveryRunId` and `discoverySourceId`;
- call the existing mapper-to-staging pipeline;
- return safe summaries only;
- cap batch size;
- preserve `auditCorrelationId`;
- stage candidates only as `staged`;
- avoid public API exposure unless separately planned;
- avoid crawler automation, LLM execution, and live executor automation until later gates.

## Explicit Non-Goals

Phase 10M does not authorize:

- public publishing;
- direct writes to `public.tools`;
- writes to `discovered_tools`;
- autonomous LLM extraction;
- crawler auto-ingestion;
- API route implementation;
- UI approval-flow changes;
- admin dashboard integration;
- live executor integration;
- production scheduling;
- audit event writes;
- source/run schema changes;
- candidate staging schema changes;
- Supabase type regeneration;
- broad cleanup tooling;
- ranking, recommendation, approval, rejection, or promotion behavior.

## Security Checklist for Future Implementation

Future implementation must verify:

- admin-only or trusted-server-only invocation;
- no public/anonymous invocation path;
- no client-side service-role exposure;
- CSRF protection if an API route is introduced;
- rate limiting if an API route or executor trigger is introduced;
- request-size and batch-size limits;
- trusted source/run IDs only;
- no source/run ID invention;
- mapper validation before staging;
- no staging helper call on mapper failure;
- staging helper is the only candidate-row write path;
- no direct `public.tools` writes;
- no `discovered_tools` writes;
- no audit writes until separately approved;
- no raw payload or secret logging;
- safe structured error responses;
- RLS posture is not weakened;
- production logs avoid raw DB errors and stack traces.

## Scalability Checklist for Future Implementation

Future implementation must define:

- maximum batch size;
- item-level processing order;
- partial success/failure semantics;
- retry policy;
- idempotency or duplicate-advisory behavior;
- timeout behavior;
- backpressure or queue limits for executor use;
- metric names and safe labels;
- run/source-level aggregation;
- duplicate advisory handling without auto-approval;
- failure summarization for mapper and staging stages;
- safe handling of large extraction payloads before mapping;
- no unbounded crawler or LLM output ingestion.

## Test Requirements for Future Implementation

Future implementation must include mocked/local tests before any live execution:

- valid controlled single-item invocation stages through the pipeline;
- mapper failure does not call staging;
- staging failure returns a safe summary;
- run/source/audit IDs are preserved;
- candidate status remains `staged`;
- batch partial success/failure counts are correct;
- batch result order is preserved;
- batch cap is enforced;
- no raw payload appears in failure output;
- no direct `public.tools` write path exists;
- no `discovered_tools` write path exists;
- no audit event write path exists;
- no service-role client is created in client-side code;
- no environment values are logged;
- existing mapper tests still pass;
- existing staging helper mocked tests still pass;
- `npm run check` passes;
- safe opt-out smoke commands still avoid DB work.

Any future live smoke must be separately gated, explicitly approved by James, and documented after execution.

## Required Review Before Implementation

Before production invocation work begins, Gemini review should confirm:

- the invocation contract is narrow enough;
- the authorization boundary is adequate;
- source/run lifecycle requirements are explicit;
- service-role usage is server-only;
- batch limits and failure semantics are safe;
- public table isolation remains preserved;
- no `public.tools` / `discovered_tools` writes are introduced;
- audit writes remain deferred or are separately designed;
- API/UI/crawler/LLM/live executor scope is explicitly excluded or separately approved.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Production wiring exposes staging to public callers | Require admin-only or trusted-server-only invocation before implementation. |
| Service-role credentials leak to client code | Keep invocation server-only and prohibit client-side service-role usage. |
| Source/run IDs are spoofed or invented | Require approved upstream source/run records and validation before staging. |
| Batch execution becomes unbounded | Enforce conservative batch caps and partial success/failure summaries. |
| Raw extraction payloads leak through logs | Log only safe IDs, counts, codes, and correlation values. |
| Pipeline accidentally publishes tools | Keep writes limited to `discovery_candidate_tools` through the staging helper. |
| Duplicate hints are treated as decisions | Keep duplicate handling advisory and review-only. |
| Audit writes are added without design | Keep audit writes deferred to a separate reviewed phase. |
| Live smoke success is mistaken for production readiness | Treat live smoke as validation of the staging path, not authorization for immediate wiring. |

## Readiness Gate Outcome

The Phase 10M gate outcome is:

```text
Ready for future controlled production integration planning.
Not ready for immediate production wiring.
```

The validated pipeline can be used as the technical foundation for a future controlled invocation plan, but the production call boundary, source/run authorization, batch controls, observability, and security review must be completed first.

## Recommended Next Phase

Phase 10N — Candidate Extraction Production Invocation Contract / Implementation Plan.
