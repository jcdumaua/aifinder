# Phase 9O — Candidate Staging Helper Mapping Update Plan

## 1. Phase scope

Phase 9O is a docs-only planning phase.

This phase plans the next safe implementation step for candidate staging helper mapping after the Phase 9N schema/type-generation work. It does not modify source code, tests, helpers, smoke scripts, generated Supabase types, package scripts, API routes, UI components, extraction logic, crawler automation, LLM behavior, database rows, audit writes, `public.tools`, or `discovered_tools`.

Phase 9O does not run `supabase db push`, remote SQL, Supabase type generation, live RLS smoke, or any opt-in live smoke path.

## 2. Current schema and type readiness summary

Phase 9N applied the reviewed schema/audit expansion and regenerated Supabase TypeScript types.

Generated types now include `public.discovery_candidate_tools.discovery_source_id`:

```ts
discovery_source_id: string | null;
discovery_source_id?: string | null;
```

Generated types also include the new relationship:

```text
discovery_candidate_tools_discovery_source_id_fkey
```

The remote schema verification documented in Phase 9N confirmed:

- `discovery_source_id` exists on `public.discovery_candidate_tools`;
- the column is nullable;
- the FK references `public.discovery_sources(id)` with `on delete restrict`;
- source and run/source indexes exist;
- the audit action constraint was expanded;
- RLS remains enabled on `public.discovery_candidate_tools`;
- no anon/authenticated grants exist for `public.discovery_candidate_tools`.

## 3. Current helper behavior summary

The current helper is:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

Relevant current behavior:

- `StageNormalizedDiscoveryCandidateInput.discoverySourceId` is required as a string.
- Runtime validation rejects missing or empty `discoverySourceId` before creating a Supabase client.
- `stageNormalizedDiscoveryCandidate(...)` returns `discoverySourceId` from the input.
- `toDiscoveryCandidateToolInsert(...)` maps `discoveryRunId` to `discovery_run_id`.
- `toDiscoveryCandidateToolInsert(...)` currently does not map `discoverySourceId` to `discovery_source_id`.
- `INSERT_SELECT_COLUMNS` currently selects:

```text
id,candidate_status,discovery_run_id,audit_correlation_id
```

Current mocked tests in:

```text
testing/discovery-candidate-staging-admin.test.mjs
```

still assert:

```js
Object.hasOwn(calls.insertPayload, "discovery_source_id") === false
```

That assertion is now obsolete after Phase 9N and should be updated in the implementation phase.

## 4. Exact future implementation target

Future implementation should update only the candidate staging helper mapping and relevant mocked tests.

Primary target:

```ts
StageNormalizedDiscoveryCandidateInput.discoverySourceId
```

should map to:

```ts
insertPayload.discovery_source_id
```

Expected mapping:

```ts
discovery_source_id: input.discoverySourceId.trim()
```

The mapping should use the generated Supabase insert type:

```ts
Database["public"]["Tables"]["discovery_candidate_tools"]["Insert"]
```

The method should continue to require non-empty `discoverySourceId` at the method boundary. The database column is nullable for staged rollout and existing-row safety, not as permission to relax the helper contract.

## 5. Expected helper mapping behavior

Phase 9P should implement these behavior rules:

- Persist `input.discoverySourceId.trim()` as `discovery_source_id`.
- Preserve required `discoverySourceId` validation.
- Preserve current `invalid_input` behavior for omitted, null, non-string, or blank runtime values.
- Do not create a client or attempt an insert when `discoverySourceId` is missing/invalid.
- Do not intentionally insert `null` for invalid runtime input.
- Keep `candidate_status` forced to `"staged"`.
- Keep caller-provided candidate status overrides rejected.
- Keep `audit_correlation_id` pass-through unchanged.
- Keep duplicate fields advisory-only.
- Keep all database access through the existing typed Discovery admin helper path.
- Keep RLS/admin-only assumptions unchanged.
- Do not add audit event writes.
- Do not add API/UI/extraction/crawler/LLM integration.
- Do not write to `public.tools` or `discovered_tools`.

Optional select behavior:

- The helper result already returns `discoverySourceId` from input.
- Phase 9P does not need to change the result type.
- If implementation chooses to verify the returned DB row includes `discovery_source_id`, `INSERT_SELECT_COLUMNS` may be expanded to include it, but this is not required for the minimal mapping update.
- If selected, the returned value must match `input.discoverySourceId.trim()` and should be treated as internal service-role verification only.

Recommended minimal implementation:

- Add `discovery_source_id: input.discoverySourceId.trim()` to `toDiscoveryCandidateToolInsert(...)`.
- Keep `INSERT_SELECT_COLUMNS` unchanged unless Gemini requests DB readback verification in the helper itself.
- Keep result shape unchanged.

## 6. Expected mocked test updates

Future mocked tests should update:

```text
testing/discovery-candidate-staging-admin.test.mjs
```

Required mocked test changes:

- Replace the current absence assertion:

```js
assert.equal(Object.hasOwn(calls.insertPayload, "discovery_source_id"), false);
```

with:

```js
assert.equal(calls.insertPayload.discovery_source_id, SOURCE_ID);
```

- Add or update a test proving whitespace is trimmed if the implementation accepts padded runtime input:

```js
discoverySourceId: ` ${SOURCE_ID} `
```

should result in:

```js
calls.insertPayload.discovery_source_id === SOURCE_ID
```

- Preserve the existing missing-source validation test:

```js
discoverySourceId: ""
```

should return:

```text
invalid_input
```

and should not create a client.

- If a null/omitted runtime case is added, it should assert safe `invalid_input` behavior and no client creation. This may require a JavaScript runtime test object because the TypeScript input type remains required.
- Keep existing assertions for:
  - `candidate_status === "staged"`;
  - audit correlation pass-through;
  - duplicate fields advisory-only;
  - Supabase insert error normalization;
  - unexpected error normalization;
  - no raw error/payload leakage.

No live DB smoke should be added to Phase 9P.

## 7. Verification plan for future implementation phase

Future Phase 9P should run:

```bash
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-candidate-staging-admin.test.mjs
npm run check
npm run smoke:discovery-candidate-staging:rls
git diff --check
git status --short --branch
```

The RLS smoke command must be opt-out only. Do not set:

```text
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```

Suggested focused safety searches after implementation:

```bash
rg -n "discovery_source_id|discoverySourceId|stageNormalizedDiscoveryCandidate|insertPayload" lib/discovery testing --glob '!node_modules'
rg -n "public\\.tools|from\\(\"tools\"|from\\('tools'|discovered_tools|approve|publish|promote|rank|recommend" lib/discovery testing --glob '!node_modules'
```

Interpret documentation comments separately from source/test behavior.

## 8. Safety boundaries for future implementation

Phase 9P should be limited to:

- `lib/discovery/discovery-candidate-staging-admin.ts`;
- `testing/discovery-candidate-staging-admin.test.mjs`;
- optionally a docs result/update file if requested.

Phase 9P should not:

- modify generated Supabase types;
- regenerate Supabase types;
- run migrations;
- run `supabase db push`;
- run remote SQL;
- perform live DB operations;
- create candidates, runs, or sources;
- run live RLS smoke;
- add API/UI/extraction/crawler/LLM integration;
- add audit event writes;
- write to `public.tools`;
- write to `discovered_tools`;
- approve, publish, promote, rank, or recommend candidates.

## 9. Risks and mitigations

Risk: Relaxing `discoverySourceId` validation because the database column is nullable.

Mitigation: Keep the method boundary strict. Nullable DB storage is for migration safety, not looser helper input.

Risk: Helper mapping drifts from generated types.

Mitigation: Use `DiscoveryCandidateToolInsert` from generated types and run `npm run check`.

Risk: Tests continue asserting the old no-column behavior.

Mitigation: Replace the absence assertion with a positive `discovery_source_id` assertion.

Risk: Future live smoke fixtures still do not verify persisted source lineage.

Mitigation: Keep Phase 9P mocked-only, then plan post-mapping functional smoke or post-schema RLS smoke separately.

Risk: Source ID readback leaks into public contexts.

Mitigation: Keep all source ID readback service-role/admin-only and do not add API/UI paths.

## 10. Recommended next phase

Recommended next phase:

```text
Phase 9P — Candidate Staging Helper Mapping Implementation
```

Recommended Phase 9P scope:

- update `toDiscoveryCandidateToolInsert(...)` to include `discovery_source_id`;
- update mocked candidate staging tests to assert source ID persistence;
- keep live DB operations deferred;
- keep RLS smoke opt-out only;
- keep API/UI/extraction/crawler/LLM integration deferred.

After Phase 9P, the next likely safety gate should plan post-mapping/post-schema smoke verification before any extraction pipeline integration.
