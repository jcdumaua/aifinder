# Phase 8Y — Candidate Staging Admin Live Smoke Test Planning

## Status

Phase 8Y is a docs-only live smoke planning phase.

This phase does not run the live smoke test, does not perform database operations, and does not create candidates. It adds no source code, tests, migrations, generated type changes, API routes, UI integration, extraction integration, crawler automation, LLM behavior, approval behavior, promotion behavior, ranking behavior, recommendation behavior, audit event writes, or `public.tools` writes.

## Current state summary

Phase 8X implemented the bounded candidate staging admin method:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

The implemented method is:

```ts
stageNormalizedDiscoveryCandidate(...)
```

Phase 8X also added mocked/mapping tests:

```text
testing/discovery-candidate-staging-admin.test.mjs
```

The Phase 8X verification state was:

- mocked/mapping test: 8/8 passed;
- `npm run check` passed;
- no live DB smoke was run;
- no real candidates were created;
- no migrations, type generation, or remote SQL were run;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` writes were added.

Candidate extraction remains not implementation-ready. The current implementation supports a bounded staging method and mocked verification only. No public/admin UI path, API path, extraction path, crawler path, audit write path, approval path, promotion path, publishing path, ranking path, recommendation path, or LLM path is authorized by this phase.

## Purpose of the future live smoke

The future live smoke test should verify only that the already implemented staging admin method can safely perform one controlled candidate-staging operation against the real Supabase project through the approved server/admin path.

The future smoke should verify:

- the real Supabase client can insert one controlled staged candidate into `public.discovery_candidate_tools`;
- the inserted record remains `candidate_status = "staged"`;
- `audit_correlation_id` is persisted;
- `discovery_run_id` is persisted;
- selected minimal return fields work;
- cleanup can remove only the test-created candidate;
- RLS/security expectations can be checked without exposing candidate data publicly.

The future smoke must remain a narrow staging-table smoke test. It must not become an extraction test, crawler test, UI test, approval test, publish test, ranking test, recommendation test, or LLM test.

## Strict non-goals

The future live smoke must not include:

- public tool creation;
- `public.tools` writes;
- `discovered_tools` writes, unless a future Gemini-approved plan needs read-only reference checks;
- candidate approval;
- candidate promotion;
- candidate publishing;
- ranking behavior;
- recommendation behavior;
- crawler automation;
- extraction trigger;
- LLM call;
- API route;
- UI integration;
- audit event write, unless a separate Gemini-approved audit compatibility phase exists;
- broad cleanup query;
- production candidate fixture;
- real vendor/tool branding;
- raw HTML storage;
- raw extraction payload storage;
- raw metadata storage;
- raw stats storage;
- raw JSON dump storage;
- snippets;
- stack traces;
- transport payloads;
- prompts/responses;
- service-role key logging;
- environment value logging.

## Required preconditions for the future smoke

Before any future live smoke can run, all of the following must be true:

1. Gemini explicitly approves the live smoke implementation/execution phase.
2. James explicitly approves any database operation before it is run.
3. The repo is clean and synced with `origin/main`.
4. The future smoke phase confirms the current latest expected commit.
5. Supabase environment variables are present locally without printing values.
6. The `public.discovery_candidate_tools` table exists in the target project.
7. The generated Supabase types still match the applied schema.
8. A valid `discovery_run_id` fixture strategy is defined and approved.
9. A safe `audit_correlation_id` strategy is defined and approved.
10. A precise cleanup strategy is defined and reviewed.
11. No production/public data will be affected.
12. Backup/rollback expectations are understood before execution.

## Fixture strategy

The future smoke should insert exactly one controlled staging candidate fixture.

The fixture should use a unique test marker in safe bounded fields, such as:

- `candidate_name`: `Phase 8Y Live Smoke Test Candidate`
- `candidate_website_url`: `https://phase-8y-live-smoke.example.com/`
- `candidate_canonical_url`: `https://phase-8y-live-smoke.example.com/`
- `candidate_normalized_domain`: `phase-8y-live-smoke.example.com`
- `source_url`: `https://phase-8y-live-smoke.example.com/`
- `source_url_normalized`: `https://phase-8y-live-smoke.example.com/`
- `source_domain`: `phase-8y-live-smoke.example.com`
- `source_evidence_locator`: a bounded marker such as `phase-8y-live-smoke:<short-token>`

The fixture must:

- use clearly non-production example/test-domain data;
- avoid real vendor/tool branding;
- expect `candidate_status = "staged"`;
- include only schema-compatible safe fields;
- use the existing normalizer/staging method contract rather than raw payloads;
- avoid raw crawler payloads, extraction payloads, HTML, screenshots, LLM prompts, or arbitrary source blobs.

Important schema observation: `audit_correlation_id` is a UUID column in the applied migration and generated types. The future smoke must not attempt to store a text prefix such as `phase-8y-live-smoke-` directly in `audit_correlation_id`. Instead, it should use a valid UUID for `audit_correlation_id` and pair that UUID with a separate safe test marker in fields such as `source_evidence_locator`, candidate name, and test logs. Cleanup should prefer the returned candidate `id`; the UUID and exact bounded marker are fallback identifiers only.

The planned fixture must be revalidated against:

```ts
Database["public"]["Tables"]["discovery_candidate_tools"]["Insert"]
```

before the future live smoke is implemented or executed.

## Discovery run ID strategy

The future live smoke requires a valid `discoveryRunId` because `public.discovery_candidate_tools.discovery_run_id` is a required foreign key to `public.discovery_runs(id)`.

The plan should not assume a valid run ID exists. Phase 8Y does not query the database and does not select a run ID.

Future options:

### Option A: Existing safe test/dry-run discovery run

Use an existing safe completed test or dry-run discovery run only if:

- Gemini approves the read-only lookup strategy;
- James approves the database read;
- the run is clearly safe to reference;
- the run is not production-sensitive;
- the smoke creates no extraction or crawler side effects.

This is the preferred option if a suitable run already exists and can be identified safely.

### Option B: Dedicated smoke discovery run setup

Create a dedicated discovery run fixture as part of a separately approved smoke setup/cleanup phase.

This may be required if no safe existing run is available. It must be separately reviewed because it adds an additional database write beyond the candidate insert.

### Option C: Synthetic or nullable run reference

This is not currently viable based on the inspected migration: `discovery_run_id` is non-null and references `public.discovery_runs(id)`. A synthetic UUID without a matching run row should be rejected by the foreign key. This option must not be used unless a future schema change is explicitly approved.

## Discovery source ID accountability

The future smoke must pass `discoverySourceId` to `stageNormalizedDiscoveryCandidate(...)` because the method boundary requires source accountability.

Current schema state:

- the staging method requires `discoverySourceId`;
- the method returns `discoverySourceId` in its result;
- `public.discovery_candidate_tools` does not currently persist a `discovery_source_id` column;
- Phase 8Y does not change schema.

The future smoke should verify the method accepts and returns `discoverySourceId`, but it should not expect `discoverySourceId` persistence in the candidate row.

Future accountability options may include:

- a separate schema extension to add `discovery_source_id`;
- a separate audit event compatibility phase;
- bounded metadata-based traceability only if Gemini approves a safe schema and UI plan.

No audit writes should be added in the future live smoke unless a separate Gemini-approved audit compatibility phase exists.

## Exact future smoke steps

The future live smoke phase should follow a bounded sequence similar to this:

1. Confirm repo status:

   ```bash
   git status --short --branch
   ```

2. Confirm latest expected commit.
3. Run mocked/mapping tests:

   ```bash
   node --import ./testing/register-typescript-test-loader.mjs testing/discovery-candidate-staging-admin.test.mjs
   ```

4. Run project verification:

   ```bash
   npm run check
   ```

5. Verify required environment variable names are present without printing values.
6. Confirm the approved `discoveryRunId` fixture strategy.
7. Construct exactly one controlled normalized candidate fixture.
8. Call `stageNormalizedDiscoveryCandidate(...)` exactly once.
9. Assert the result is `ok: true`.
10. Assert returned `candidateStatus` is `"staged"`.
11. Capture the returned candidate ID and safe audit correlation UUID without exposing secrets.
12. If separately approved, read back only minimal safe fields:

    - `id`;
    - `candidate_status`;
    - `discovery_run_id`;
    - `audit_correlation_id`;
    - `source_evidence_locator`;
    - `created_at`;
    - `updated_at`.

13. Verify:

    - `candidate_status = "staged"`;
    - `audit_correlation_id` persisted;
    - `discovery_run_id` persisted;
    - `updated_at`/trigger behavior is present if the smoke includes an approved update check.

14. Cleanup the exact candidate by returned candidate ID.
15. If exact-ID cleanup fails and Gemini approved a fallback, cleanup by exact `audit_correlation_id` plus exact smoke marker only.
16. Verify cleanup removed only the smoke candidate.
17. Confirm no `public.tools` rows were written.
18. Confirm no `discovered_tools` rows were written.
19. Confirm no extraction/crawler/LLM/API/UI behavior ran.
20. Finish with:

    ```bash
    git status --short --branch
    ```

Phase 8Y does not execute any of these database steps.

## RLS/security verification plan

The future smoke should verify security posture without broad exposure.

Allowed future checks, if separately approved:

- service-role/admin path can insert the controlled staged candidate;
- anon/public path cannot read candidate data;
- authenticated non-admin direct access is denied if relevant to the configured test environment;
- RLS remains enabled on `public.discovery_candidate_tools`;
- deny-all policy remains present for direct anon/authenticated table access;
- no public-safe candidate view exists;
- no secrets, tokens, connection strings, or environment values are printed;
- no raw candidate payloads or unsafe evidence are logged.

The future smoke should report only minimal expected results or errors. It should not print full candidate rows, raw JSON dumps, Supabase client internals, service-role keys, JWTs, connection strings, or environment values.

## Cleanup and rollback plan

Cleanup must be exact and bounded.

Cleanup should:

- target the exact candidate ID returned by the smoke insert;
- use exact `audit_correlation_id` plus exact smoke marker only as a fallback if explicitly approved;
- avoid broad deletes by date, status, name, or domain alone;
- never delete from `public.tools`;
- never delete from `discovered_tools`;
- never delete approved/public tool records;
- verify only the smoke-created candidate was removed.

If cleanup fails:

1. Stop immediately.
2. Do not run broad cleanup.
3. Report the candidate ID, audit correlation UUID, and safe marker for manual admin cleanup.
4. Do not continue to any integration, extraction, crawler, API, UI, audit-write, approval, or publishing work.

Phase 8Y rollback is docs-only: remove this Phase 8Y document. No database rollback is needed because Phase 8Y performs no database operation.

## Safety scans for the future smoke phase

Before any future live DB smoke, run scans that prove the smoke remains narrow.

Planned scans:

```bash
rg -n "public\\.tools|\\.from\\(\"tools\"|\\.from\\('tools'|from\\(\"tools\"|from\\('tools'" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'
rg -n "approve|approved|publish|promote|rank|ranking|recommend|recommendation" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'
rg -n "crawler|extraction|LLM|llm|openai|anthropic|gemini|generateText|chat\\.completions" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'
rg -n "app/api|components/|\"use client\"|use client" testing lib/discovery docs --glob '!node_modules' --glob '!*.map'
rg -n "delete\\(|insert\\(|update\\(|upsert\\(|select\\(|rpc\\(|from\\(" testing lib/discovery --glob '!node_modules' --glob '!*.map'
```

Docs may mention forbidden terms as non-goals or safety boundaries. Future implementation files should show only the planned staging-table operation and exact cleanup behavior.

## Required future Gemini gates

Required gates:

1. Gemini review of this Phase 8Y plan before commit.
2. Gemini approval before writing a live smoke script.
3. Gemini approval before running any database operation.
4. Explicit James approval before any live database operation.
5. Separate Gemini-approved audit compatibility phase before audit event writes.
6. Separate Gemini-approved schema phase before `discovery_source_id` persistence.
7. Separate Gemini-approved integration phase before API/UI/extraction/crawler usage.

## Future CCR requirements

The future live smoke CCR must include:

- exact fixture used, excluding secrets;
- candidate ID created;
- audit correlation UUID;
- smoke marker;
- insert result;
- minimal readback verification result, if approved;
- RLS/security check result, if approved;
- cleanup result;
- confirmation the candidate was removed;
- confirmation no `public.tools` rows were touched;
- confirmation no `discovered_tools` rows were touched;
- confirmation no extraction/crawler/LLM/API/UI integration ran;
- confirmation no approval/promotion/publish/ranking/recommendation behavior ran;
- final `git status --short --branch`.

## Final Phase 8Y decision summary

Phase 8Y plans a future live smoke only. It does not run the smoke.

The safest future live smoke should:

- insert exactly one controlled staging candidate;
- use a valid existing or separately approved `discovery_run_id`;
- preserve `candidate_status = "staged"`;
- use a valid UUID `audit_correlation_id`;
- use safe bounded marker fields for test identification;
- cleanup by exact returned candidate ID;
- verify no public data path is affected;
- remain separate from extraction, crawler, API, UI, audit writes, approval, publishing, ranking, recommendation, and LLM work.

Candidate extraction remains not implementation-ready after Phase 8Y.
