# Phase 9F — Candidate Staging RLS Smoke Execution Approval Gate

## 1. Phase title and status

Phase 9F is a docs-only execution planning and approval-gate phase for the future candidate staging RLS smoke run.

This phase does not run the live RLS smoke, does not set the RLS smoke opt-in environment variable, performs no database operations, creates no candidates, discovery runs, or discovery sources, and changes no source code, tests, helpers, generated Supabase types, package scripts, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 8X implemented the bounded staging method:

```ts
stageNormalizedDiscoveryCandidate(...)
```

Phase 8Z added the functional candidate staging live smoke harness:

```text
testing/discovery-candidate-staging-live-smoke.mjs
```

Phase 9A executed the functional live smoke successfully. Phase 9B documented that result. Phase 9C planned candidate staging smoke hardening and RLS/security checks. Phase 9D planned a separate dedicated RLS smoke harness. Phase 9E implemented the guarded dedicated RLS smoke harness:

```text
testing/discovery-candidate-staging-rls-smoke.mjs
```

Phase 9E also added the package script:

```bash
npm run smoke:discovery-candidate-staging:rls
```

Phase 9E verified the safe opt-out path only. The live RLS smoke has not been executed yet.

API/UI/extraction/crawler/LLM integration remains deferred. Candidate staging remains a server/admin staging capability and is not public tool creation, approval, promotion, publishing, ranking, recommendation, or extraction automation.

## 3. Purpose of Phase 9F

Phase 9F defines the final approval gate before live RLS smoke execution.

This document records:

- the exact future command boundary;
- environment safety checks;
- expected safe output;
- fixture creation expectations;
- RLS read-denial expectations;
- cleanup expectations;
- failure handling;
- result documentation requirements;
- explicit approval requirements.

## 4. Strict non-goals

Phase 9F does not:

- execute the live RLS smoke;
- set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`;
- perform database operations;
- create candidates, discovery runs, or discovery sources;
- run SQL, migrations, or Supabase type generation;
- modify source code, tests, smoke scripts, helpers, package scripts, or generated types;
- add API routes;
- add UI integration;
- add extraction integration;
- add crawler automation;
- add LLM behavior;
- write to `public.tools`;
- write to `discovered_tools`;
- write audit events;
- approve, promote, publish, rank, or recommend candidates.

## 5. Execution prerequisites for the future Phase 9G run

Before any future live RLS smoke execution:

1. Gemini must approve this Phase 9F approval-gate document.
2. Phase 9F must be committed and pushed.
3. James must explicitly approve the live RLS smoke run.
4. The repository must be clean and synced:

   ```text
   ## main...origin/main
   ```

5. The latest commit should be the Phase 9F result-document commit.
6. `.env.local` must exist locally.
7. Required environment names must be present without printing values:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

8. The opt-in environment variable must be set only for the single approved command:

   ```bash
   AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
   ```

9. The operator must not paste or print secret values.
10. CI/CD must not execute the live smoke automatically.
11. The command must not be rerun unless separately approved.

## 6. Safe preflight checks for future execution

Safe preflight commands before the future live execution:

```bash
git status --short --branch
git log --oneline -1
npm run check
npm run smoke:discovery-candidate-staging:rls
```

The final command is opt-out only unless `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` is explicitly set. In preflight it should confirm:

- RLS smoke skipped;
- no environment values loaded;
- no DB client created;
- no DB operation performed.

Environment presence checks must print only variable names and presence/missing status, never values. A future execution phase may use a short local shell check if needed, but it must not print `.env.local` or secret values.

## 7. Future live command boundary

Future live command shape:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
```

This command performs live database writes to create controlled smoke fixtures and must only be run after explicit James approval.

Approval to plan, implement, commit, or push supporting files is not approval to run this command.

## 8. Future live execution expected behavior

Expected future live sequence:

1. Guard passes.
2. Environment values are loaded but not printed.
3. Service-role client is created.
4. Anon client is created.
5. Dedicated smoke source fixture is created.
6. Dedicated smoke run fixture is created.
7. Exactly one staged candidate is created via `stageNormalizedDiscoveryCandidate(...)`.
8. Service-role minimal read succeeds.
9. Anonymous exact-ID read denial passes.
10. Anonymous list denial passes.
11. Guessed exact-ID denial assertion passes.
12. Authenticated non-admin check is skipped unless a safe approved strategy exists.
13. No-payload-leak assertion passes.
14. Exact-ID cleanup runs in `finally`.
15. Cleanup verification confirms the candidate, run, and source are removed.
16. The script exits zero only if checks and cleanup pass.

## 9. Future expected output requirements

Allowed output:

- phase name;
- smoke marker;
- fixture IDs;
- audit correlation UUID;
- pass/fail result per check;
- safe denial categories;
- cleanup success/failure;
- final summary.

Forbidden output:

- Supabase service-role key;
- anon key;
- user tokens;
- `.env.local` values;
- full candidate row;
- raw Supabase error object;
- raw source config if sensitive;
- raw evidence/source blobs;
- stack traces containing payloads or secrets.

## 10. Future pass/fail criteria

Pass criteria:

- service-role control read returns only minimal allowed fields;
- anonymous exact-ID read returns no row or payload;
- anonymous list read returns no row or payload;
- guessed exact-ID assertion confirms no unauthorized visibility;
- authenticated non-admin is denied or explicitly skipped with a safe reason;
- denial logs are sanitized;
- cleanup by exact IDs succeeds;
- cleanup verification passes;
- no `public.tools` rows are touched;
- no `discovered_tools` rows are touched.

Fail criteria:

- unauthorized client sees any candidate row;
- full candidate payload is logged;
- raw secret or token is logged;
- cleanup fails;
- candidate, run, or source remains after cleanup verification;
- any unexpected table is touched;
- script exits non-zero.

## 11. Cleanup / failure handling

Future live execution must preserve the Phase 9E cleanup behavior:

- `finally` cleanup always runs after fixture creation begins;
- cleanup uses exact candidate, run, and source IDs only;
- no broad delete by marker, date, status, name, or domain;
- no automated fallback broad cleanup.

If cleanup fails, output must include:

- candidate ID;
- run ID;
- source ID;
- marker;
- audit correlation UUID;
- manual cleanup warning.

Manual cleanup requires separate approval and must remain exact-ID oriented.

## 12. Result documentation requirement

After future live execution, create a separate result document.

Recommended future result file:

```text
docs/discovery-phase-9h-candidate-staging-rls-smoke-result.md
```

The result document should record:

- exact command used;
- date/time;
- latest commit;
- smoke marker;
- fixture IDs;
- audit correlation UUID;
- service-role control read result;
- anonymous exact-ID denial result;
- anonymous list denial result;
- guessed-ID denial result;
- authenticated non-admin skipped/denied result;
- no-payload-leak result;
- cleanup result;
- final repo status;
- confirmation no secrets or payloads were printed;
- confirmation no `public.tools` or `discovered_tools` rows were touched.

## 13. Approval policy

Phase 9F is docs-only and requires Gemini approval before commit.

Future live RLS smoke execution requires explicit James approval after Phase 9F is pushed. The approval must clearly say that the live RLS smoke can run.

Do not treat approval to proceed with planning, documentation, implementation, commit, or push as approval to run live database operations.

Do not run the live RLS smoke command more than once unless separately approved.

## 14. Recommended next phase sequence

Recommended sequence:

1. `Phase 9G — Candidate Staging RLS Smoke Execution`
2. `Phase 9H — Candidate Staging RLS Smoke Result Documentation`

This split is safest because the execution phase can focus only on running one approved live command and verifying cleanup, while the result documentation phase can record the outcome without repeating the smoke or mixing execution with documentation edits.

Phase 9G should not change source code, tests, helpers, package scripts, generated types, migrations, API routes, UI, extraction, crawler, LLM behavior, audit writes, `public.tools`, or `discovered_tools`.

## 15. Rollback plan

Phase 9F rollback is docs-only:

- remove `docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md`;
- no database rollback is needed because Phase 9F performs no database operation.

## 16. CCR expectations for Phase 9F

The Phase 9F CCR must confirm:

- only docs changed;
- no live RLS smoke ran;
- the opt-in environment variable was not set;
- no database operations occurred;
- no candidates, discovery runs, or discovery sources were created;
- no migrations, Supabase type generation, or remote SQL ran;
- no source, test, helper, package, or generated type files changed;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` or `discovered_tools` writes occurred;
- no audit event writes occurred;
- the safe opt-out guard still works;
- final `git status --short --branch`.

## 17. Final Phase 9F decision summary

Phase 9F authorizes no live execution. It documents the approval boundary, expected behavior, output rules, cleanup requirements, pass/fail criteria, and result documentation path for a future live RLS smoke.

The next execution phase must receive explicit James approval before setting:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
```
