# Phase 10F — Candidate Extraction Staging Pipeline Integration Plan

## 1. Phase scope

Phase 10F is a docs-only planning phase for the future Candidate Extraction Staging Pipeline integration layer.

This phase defines how a later orchestration module should glue together the pure mapper and the existing candidate staging helper:

```text
approved bounded extraction input
  -> mapExtractionToStagingCandidate(...)
  -> stageNormalizedDiscoveryCandidate(...)
  -> public.discovery_candidate_tools only
```

Phase 10F does not implement orchestration code, mapper changes, staging helper changes, tests, API routes, UI integration, crawler automation, LLM behavior, database writes, migrations, Supabase type generation, smoke script changes, audit writes, commits, or pushes.

## 2. Current validated foundation

The current foundation is ready for integration planning:

- Phase 10A — Candidate Extraction Staging Pipeline Planning is complete and pushed.
- Phase 10B — Candidate Extraction Input Contract / Mapper Design is complete and pushed.
- Phase 10C — Candidate Extraction Mapper Implementation Plan is complete and pushed.
- Phase 10D — Candidate Extraction Mapper Implementation is complete and pushed.
- `mapExtractionToStagingCandidate(...)` exists in `lib/discovery/discovery-candidate-extraction-mapper.ts`.
- The mapper is pure, local, DB-free, network-free, environment-free, and staging-helper-call-free.
- The mapper returns `stagingInput` compatible with `StageNormalizedDiscoveryCandidateInput`.
- Mapper mocked/unit tests pass.
- `stageNormalizedDiscoveryCandidate(...)` exists in `lib/discovery/discovery-candidate-staging-admin.ts`.
- The staging helper persists `discoverySourceId` as `discovery_candidate_tools.discovery_source_id`.
- The staging helper forces `candidate_status = "staged"`.
- The staging helper writes only through the candidate staging table boundary.
- Candidate staging helper mocked tests pass.
- Candidate staging has already passed live post-schema RLS smoke with exact-ID cleanup.

Existing manual crawler, metadata fetch, and static evidence executor code show the established pattern: accept approved bounded inputs, sanitize summaries, avoid raw payload persistence, keep candidates/public-tool writes out of acquisition-only paths, and defer broader orchestration until separately planned.

## 3. Integration objective

The future integration module should accept approved bounded extraction input items or batches, map each item into a staging-compatible object, and stage only successful mapped candidates.

The objective is to:

- accept trusted extraction input supplied by an approved server-side orchestration context;
- call `mapExtractionToStagingCandidate(...)`;
- call `stageNormalizedDiscoveryCandidate(...)` only when mapping succeeds;
- preserve `discoveryRunId`;
- preserve `discoverySourceId`;
- preserve `auditCorrelationId`;
- write only to `public.discovery_candidate_tools` through the existing staging helper;
- never write to `public.tools`;
- never write to `discovered_tools`;
- never approve, reject, publish, rank, recommend, or promote tools;
- return only safe structured summaries.

The integration layer should be a narrow staging-only bridge. It should not become a crawler, API handler, LLM extraction layer, duplicate resolution engine, audit writer, review UI, or cleanup worker.

## 4. Future module and function recommendations

Recommended future module:

```text
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts
```

Recommended exported functions:

```ts
stageMappedExtractionCandidate(...)
stageMappedExtractionCandidateBatch(...)
```

Recommended dependency direction:

```text
discovery-candidate-extraction-staging-pipeline.ts
  imports mapExtractionToStagingCandidate(...)
  imports stageNormalizedDiscoveryCandidate(...)
  accepts optional staging dependency for mocked tests
  does not import API route helpers
  does not import UI components
  does not import crawler automation
  does not import LLM clients
```

For testability, the implementation should allow the staging call to be injected in mocked tests. The production default may use `stageNormalizedDiscoveryCandidate(...)`, but tests should verify mapper failure paths without constructing clients or touching the database.

## 5. Input and output result shape design

### Single-item input

Recommended design:

```ts
type CandidateExtractionStagingPipelineInput = {
  item: CandidateExtractionMapperInput;
  actorId?: string | null;
};
```

The `item` must already contain trusted `discoveryRunId`, trusted `discoverySourceId`, bounded source context, candidate name, and candidate website URL.

The future integration function must not invent source/run IDs. If upstream validation has not established source/run context, integration must fail closed before mapping.

### Batch input

Recommended design:

```ts
type CandidateExtractionStagingPipelineBatchInput = {
  items: CandidateExtractionMapperInput[];
  actorId?: string | null;
  maxItems?: number;
};
```

Batch execution should use a small explicit max item cap. The first implementation should keep the cap conservative and should not process unbounded crawler output.

### Success result

Recommended success summary:

```ts
type CandidateExtractionStagingPipelineSuccess = {
  ok: true;
  status: "staged";
  candidateId: string;
  discoveryRunId: string;
  discoverySourceId: string;
  auditCorrelationId: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};
```

This summary is intentionally narrower than the full candidate row. It must not expose full normalized candidates, raw extraction input, source blobs, raw HTML, prompt text, or database error objects.

### Mapper failure result

Recommended mapper failure summary:

```ts
type CandidateExtractionStagingPipelineMapperFailure = {
  ok: false;
  stage: "mapper";
  error: CandidateExtractionMapperFailure["error"];
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};
```

Mapper failures must not call the staging helper.

### Staging failure result

Recommended staging failure summary:

```ts
type CandidateExtractionStagingPipelineStageFailure = {
  ok: false;
  stage: "staging";
  error: {
    code:
      | "invalid_input"
      | "missing_audit_correlation_id"
      | "database_insert_failed"
      | "unexpected_error";
    message: string;
  };
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};
```

Staging failures should reuse the staging helper’s safe error code and message only. They should not include raw database errors, stack traces, full candidate payloads, or Supabase response objects.

### Partial batch result

Recommended batch summary:

```ts
type CandidateExtractionStagingPipelineBatchResult = {
  ok: boolean;
  totalItems: number;
  stagedCount: number;
  mapperFailureCount: number;
  stagingFailureCount: number;
  results: CandidateExtractionStagingPipelineItemResult[];
};
```

Batch mode may allow partial success if explicitly planned and tested. The result should clearly separate mapper failures from staging failures and should retain only safe per-item summaries.

## 6. Future integration algorithm

The future single-item algorithm should be:

1. Accept one bounded extraction item from an approved server-side context.
2. Confirm upstream context supplied trusted `discoveryRunId` and `discoverySourceId`.
3. Confirm the integration caller is not a public/anonymous client path.
4. Call `mapExtractionToStagingCandidate(item)`.
5. If mapper returns `ok: false`, return a safe mapper failure and do not stage.
6. If mapper returns `ok: true`, optionally attach approved `actorId` to `stagingInput`.
7. Call `stageNormalizedDiscoveryCandidate(stagingInput)`.
8. If staging helper returns `ok: false`, return a safe staging failure.
9. If staging helper returns `ok: true`, return candidate ID, staged status, run ID, source ID, audit correlation ID, and mapper warnings.
10. Never approve, publish, rank, recommend, or promote the staged candidate.
11. Never write to `public.tools` or `discovered_tools`.
12. Never log or return raw acquisition payloads.

The future batch algorithm should:

1. Enforce a small max item count.
2. Iterate deterministically.
3. Run mapper for each item.
4. Skip staging for mapper failures.
5. Stage only mapper successes.
6. Collect safe per-item summaries.
7. Return partial success/failure counts.
8. Avoid broad rollback or cleanup behavior in mocked/local implementation.
9. Defer live cleanup rules to a separately approved live smoke gate.

## 7. Error and logging safety

The future integration must return and log safe summaries only.

Forbidden output:

- raw HTML;
- screenshots;
- prompt text;
- model output;
- cookies;
- request/response headers;
- secrets;
- service-role keys;
- anon keys;
- user tokens;
- stack traces;
- raw source blobs;
- raw metadata dumps;
- full normalized candidate payloads;
- full candidate rows;
- raw Supabase errors;
- raw public/discovered tool payloads.

Allowed output:

- mapper failure code;
- staging failure code;
- safe message;
- run ID;
- source ID;
- candidate ID after staging success;
- audit correlation ID;
- mapper warnings;
- aggregate batch counts.

## 8. Source accountability

Every staged candidate produced through this future integration must preserve source and run lineage.

Requirements:

- `discoveryRunId` must be present and trusted.
- `discoverySourceId` must be present and trusted.
- `discoverySourceId` must pass through mapper output into staging helper input.
- The staging helper must persist `discovery_source_id`.
- The integration must not invent source IDs.
- The integration must not invent run IDs.
- The integration must not accept anonymous or public client-supplied source/run IDs as authoritative.
- Upstream source/run selection must remain admin-controlled or otherwise separately authorized.
- If a run/source relationship check is added later, it must be explicitly planned and mocked before any live DB check.

The database column is nullable for migration safety, but candidate extraction integration should treat source lineage as required for successful staging.

## 9. Duplicate handling

Duplicate behavior remains advisory only.

The future integration may carry duplicate advisory fields already supported by mapper and staging helper:

- `duplicate_check_status`;
- `duplicate_signal_types`;
- `duplicate_blocking`;
- `possible_duplicate_tool_id`;
- `possible_duplicate_discovered_tool_id`;
- `possible_duplicate_candidate_id`.

The integration must not:

- auto-approve candidates;
- auto-reject candidates;
- publish candidates;
- promote candidates;
- write to `public.tools`;
- write to `discovered_tools`;
- hide staged candidates from review solely because a duplicate hint exists.

Duplicate hints remain review-only until a separate duplicate workflow phase defines stronger behavior.

## 10. Audit plan

The future integration must preserve `auditCorrelationId` from mapper output and staging helper result.

Phase 10F does not authorize audit writes.

The schema currently supports candidate-staging audit action values, but that compatibility is not permission to write audit rows.

Future audit write design must be separately planned and reviewed before implementation. That design should decide:

- whether mapper, integration, staging helper, or a higher-level orchestration layer owns audit writes;
- whether audit writes are transactional with candidate staging;
- which metadata keys are allowed;
- whether `candidateId`, `discoveryRunId`, `discoverySourceId`, and `auditCorrelationId` are included;
- how actor identity is represented;
- how audit insert failures affect staging outcomes;
- how to avoid duplicate audit events in batch mode.

## 11. Strict non-goals

The future Phase 10G implementation must not add:

- API route integration;
- admin UI integration;
- public UI integration;
- crawler automation;
- scheduled/cron execution;
- LLM extraction or interpretation;
- public tool creation;
- writes to `public.tools`;
- writes to `discovered_tools`;
- approval/promotion/publishing/ranking/recommendation behavior;
- audit event writes;
- raw HTML persistence;
- raw prompt/model-output persistence;
- live DB smoke execution.

Phase 10F itself performs none of the above.

## 12. Future tests for implementation phase

Phase 10G should add a mocked/local integration test file. Recommended path:

```text
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
```

Required test coverage:

- mapper failure does not call staging helper;
- mapper success calls staging helper exactly once;
- successful result preserves run ID;
- successful result preserves source ID;
- successful result preserves audit correlation ID;
- mapper warnings are preserved in the integration result;
- staging helper failure is safely reported;
- staging helper thrown error is safely reported if dependency injection is used;
- batch mixed results produce partial success/failure summary;
- batch cap prevents unbounded item processing;
- no DB client is created in mocked tests;
- no `public.tools` or `discovered_tools` write path exists;
- no full normalized candidate payload is returned in public-safe result shape.

Tests should use dependency injection for the staging function so they can assert calls without touching the database.

## 13. Future verification workflow

The future Phase 10G implementation should run:

```bash
node testing/discovery-candidate-extraction-staging-pipeline.test.mjs
node testing/discovery-candidate-extraction-mapper.test.mjs
node testing/discovery-candidate-staging-admin.test.mjs
npm run check
npm run smoke:discovery-candidate-staging:rls
```

The RLS smoke command must be opt-out only during Phase 10G. Do not set:

```text
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```

No live DB smoke should run until a separately approved live smoke gate exists.

## 14. Future implementation boundary

Recommended next implementation phase:

```text
Phase 10G — Candidate Extraction Staging Pipeline Integration Implementation
```

Phase 10G should be limited to:

- add `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`;
- add `testing/discovery-candidate-extraction-staging-pipeline.test.mjs`;
- call mapper;
- call injected/default staging helper only after mapper success;
- keep tests mocked/local;
- avoid DB operations;
- avoid API/UI/crawler/LLM integration;
- avoid live smoke.

If implementation uncovers a need for source/run existence checks, stop and create a separate planning phase before adding DB reads.

## 15. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Integration becomes a broad extraction pipeline | Keep Phase 10G limited to mapper + staging-helper glue only. |
| Mapper failures still call staging | Add explicit mocked test that staging dependency is not called on mapper failure. |
| Full candidate payload leaks in result/logs | Return safe summaries only; test against raw payload exposure. |
| Source/run IDs are invented or untrusted | Require upstream trusted context and preserve mapper validation. |
| Duplicate hints are treated as approval/rejection | Keep duplicate behavior advisory and review-only. |
| Audit writes are added prematurely | Defer audit writes to a separate reviewed design. |
| Live DB rows are created during implementation | Keep Phase 10G mocked/local and do not run live smoke. |
| Batch mode processes unbounded items | Enforce a small explicit max item cap. |

## 16. Safety boundaries preserved in Phase 10F

Phase 10F preserved these boundaries:

- No staging pipeline integration was implemented.
- No orchestration code was added.
- No mapper code was modified.
- No staging helper code was modified.
- No tests were added or modified.
- No API routes were added.
- No UI integration was added.
- No crawler automation was added.
- No LLM behavior was added.
- No DB operations occurred.
- No candidate rows were created.
- No discovery run rows were created.
- No discovery source rows were created.
- No `public.tools` writes occurred.
- No `discovered_tools` writes occurred.
- No audit event writes occurred.
- No `supabase db push` was run.
- No migrations were run.
- No Supabase types were regenerated.
- No live RLS smoke was run.
- The RLS smoke opt-in environment variable was not set.

## 17. Recommended next phase

Recommended next phase:

```text
Phase 10G — Candidate Extraction Staging Pipeline Integration Implementation
```

Recommended Phase 10G scope:

- implement the narrow integration module;
- add mocked/local integration tests;
- verify mapper success invokes staging once;
- verify mapper failure does not stage;
- verify safe result summaries;
- run mapper tests, staging helper tests, `npm run check`, and safe RLS smoke opt-out only;
- do not add API/UI/crawler/LLM integration;
- do not run live DB smoke.
