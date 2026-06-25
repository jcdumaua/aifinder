# Phase 8M — Candidate Staging Migration Apply / Generated Types Review Plan

## Status / Scope

Status: draft for Gemini review.

Scope: docs-only plan for a future approved phase that may apply the committed candidate staging migration and refresh Supabase generated types.

Phase 8M does not apply the migration, run remote SQL, refresh generated types, add code, add tests, add UI/API behavior, implement extraction, create candidates, or write to `discovery_candidate_tools`, `discovered_tools`, or `public.tools`.

Candidate extraction remains not implementation-ready after Phase 8M.

## Background

Phase 8I created the real migration file for the dedicated staging table:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

Phase 8L implemented the pure `DiscoveryCandidateNormalizer` helper and focused tests:

```text
lib/discovery-candidate-normalizer.ts
testing/discovery-candidate-normalizer.test.mjs
```

The migration file exists in the repository, but it has not been applied to Supabase. Generated Supabase types have not been refreshed. No API, UI, executor, or database insertion path uses the staging table.

## Non-goals

Phase 8M does not:

- apply the migration;
- run `supabase db push`;
- run remote SQL;
- modify generated Supabase types;
- add source code;
- add tests;
- add UI behavior;
- add API behavior;
- implement extraction;
- create candidate records;
- write to `discovery_candidate_tools`;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- expose or store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, raw candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

## Current State Carried Forward

Current committed state:

- Phase 8I migration file exists in `supabase/migrations`.
- The migration creates `public.discovery_candidate_tools`.
- The migration enables RLS, revokes direct `anon` and `authenticated` access, and creates a deny-all policy.
- The migration includes staging-only lifecycle statuses.
- The migration includes no public-safe view.
- The migration does not add extraction, API, UI, approval, publish, promotion, ranking, recommendation, LLM, automation, or scheduler behavior.
- Phase 8L normalizer uses local safe types because generated Supabase types have not been refreshed.
- The repo currently has no discovered committed generated Supabase `Database` type file. Future type refresh must first choose and review the target path.

## Migration File Under Future Apply

The only migration file in scope for a future apply phase is:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

No future phase should edit or replace this migration immediately before apply without a new Gemini review of the exact diff.

Expected table:

```text
public.discovery_candidate_tools
```

Expected direct database objects from this migration:

- staging table;
- check constraints;
- B-tree indexes;
- partial unique index for active same-run canonical URL duplicates;
- `public.set_updated_at()` trigger;
- RLS enabled;
- deny-all policy;
- safe table/column comments.

## Pre-Apply Safety Checklist

Before any future migration apply phase, confirm:

- `git status --short --branch` is clean.
- The branch is `main` unless James explicitly approves another branch.
- The migration file is committed and pushed.
- Gemini has approved the exact migration file.
- No unreviewed migration edits exist.
- Supabase project link is confirmed.
- Supabase CLI version and command help are checked with safe commands before execution.
- Environment variables are present but never printed.
- No connection strings, service role keys, access tokens, JWTs, or secrets are pasted into logs.
- Backup and rollback plan are reviewed.
- Generated type target path is identified and approved.
- No extraction/API/UI code is enabled.
- No staging insert path is enabled.
- No `public.tools` write path is involved.
- No `discovered_tools` write path is involved.

## Future Migration Apply Plan

The future apply phase should use the smallest safe command sequence.

Recommended future command discovery:

```bash
supabase --help
supabase db --help
supabase db push --help
```

Recommended future status check if supported by the installed CLI:

```bash
supabase migration list --linked
```

Recommended future apply command only after Gemini and James approval:

```bash
supabase db push --linked
```

Execution rules for the future apply phase:

- Capture only safe summary output.
- Do not print environment values.
- Do not print project connection strings.
- Do not print tokens, JWTs, service role keys, or secrets.
- Do not run extraction after apply.
- Do not insert candidate rows during the apply phase unless a later smoke plan explicitly approves a bounded transaction.
- Stop immediately if the migration status is ambiguous.

## Future Generated Supabase Type Refresh Plan

Current observation: no committed generated Supabase `Database` type file was found during Phase 8M review.

Before refreshing types, the future phase must decide and document the target file path. Candidate target paths may include:

- `lib/database.types.ts`
- `types/supabase.ts`
- another existing project-approved type location if added before the future phase

The future phase should discover the correct type generation command from the installed Supabase CLI:

```bash
supabase gen types --help
```

Typical future command shape, subject to CLI help and project configuration:

```bash
supabase gen types typescript --linked > <approved-generated-type-path>
```

Type refresh rules:

- Do not expose project refs, tokens, or secrets in logs.
- Do not include command output containing credentials.
- Review the generated diff before any commit.
- Gemini must review the generated type diff.
- Do not accept unrelated generated type drift without explanation.
- Do not modify hand-authored normalizer types until the generated table type exists and has been reviewed.

## Expected Generated Type Changes

After the migration is applied and types are refreshed, the generated `Database` type should add `public.Tables.discovery_candidate_tools`.

Expected table type coverage:

- `Row` type for `discovery_candidate_tools`;
- `Insert` type for `discovery_candidate_tools`;
- `Update` type for `discovery_candidate_tools`;
- relationship metadata for:
  - `discovery_run_id` to `discovery_runs`;
  - `possible_duplicate_tool_id` to `tools`;
  - `possible_duplicate_discovered_tool_id` to `discovered_tools`;
  - `possible_duplicate_candidate_id` to `discovery_candidate_tools`.

Expected field families:

- safe source/evidence locator fields;
- safe candidate name, URL, domain, category, pricing, and description fields;
- bounded array fields for hints and advisory signals;
- staging-only lifecycle fields;
- coarse confidence bucket;
- advisory duplicate fields;
- human-review fields;
- audit correlation field;
- cleanup/retention fields;
- timestamps.

Unexpected generated type changes should be treated as review blockers until explained.

## Post-Apply Database Verification Plan

Future safe database verification should confirm:

- `public.discovery_candidate_tools` exists.
- Expected columns exist.
- Expected data types exist.
- Expected defaults exist.
- Expected constraints exist.
- Expected indexes exist.
- Expected trigger exists.
- RLS is enabled.
- Deny-all policy exists.
- No public-safe view was created.
- Migration inserted zero rows.
- `public.tools` row count did not change because of migration apply.
- `public.discovered_tools` row count did not change because of migration apply.

Safe verification SQL examples for a later approved phase:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'discovery_candidate_tools';
```

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discovery_candidate_tools'
order by ordinal_position;
```

```sql
select count(*) as staged_candidate_count
from public.discovery_candidate_tools;
```

The future report should summarize results only. It must not dump full rows.

## Post-Apply RLS Verification Plan

Future RLS verification should confirm:

- RLS is enabled for `public.discovery_candidate_tools`.
- Direct `anon` access is denied.
- Direct `authenticated` access is denied.
- No public read path exists.
- No public insert path exists.
- No public update path exists.
- No public delete path exists.
- No client-side direct access is introduced.
- Service-role or admin-route access remains unused unless separately approved.

Safe catalog checks for a later approved phase:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'discovery_candidate_tools';
```

```sql
select policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'discovery_candidate_tools'
order by policyname;
```

The future implementation phase may also use bounded anon/authenticated access probes if it can do so without exposing keys or session values.

## Constraint / Index / Trigger Verification Plan

Future constraint verification should confirm:

- unsafe candidate statuses are rejected;
- production-state semantics such as approval, publishing, promotion, live/public status are rejected;
- non-HTTPS candidate URLs are rejected;
- non-HTTPS source URLs are rejected;
- overlong names, URLs, domains, descriptions, evidence summaries, review notes, locators, and rejection codes are rejected;
- category hints are limited to the existing AiFinder category allowlist;
- pricing hints are limited to `Free + Paid`, `Free`, or `Paid`;
- confidence is limited to `low`, `medium`, or `high`;
- duplicate check status is limited to the reviewed advisory values;
- lifecycle remains staging-only;
- the active same-run canonical URL partial unique index exists;
- the `set_discovery_candidate_tools_updated_at` trigger exists.

Safe catalog checks for a later approved phase:

```sql
select conname, contype
from pg_constraint
where conrelid = 'public.discovery_candidate_tools'::regclass
order by conname;
```

```sql
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'discovery_candidate_tools'
order by indexname;
```

```sql
select tgname
from pg_trigger
where tgrelid = 'public.discovery_candidate_tools'::regclass
  and not tgisinternal
order by tgname;
```

Partial unique index behavior should only be tested in a future approved safe transaction or disposable environment. It must not leave rows behind.

## Normalizer Compatibility Verification Plan

After generated types are refreshed in a future approved phase:

- run `node testing/discovery-candidate-normalizer.test.mjs`;
- run `./node_modules/.bin/tsc --noEmit`;
- run `npm run lint`;
- run `npm run check`;
- compare `SafeDiscoveryCandidateToolInsert` in `lib/discovery-candidate-normalizer.ts` against the generated `discovery_candidate_tools.Insert` type;
- confirm no generated type contains unexpected raw payload columns;
- confirm no helper output field is missing from the generated insert type unless the database has a safe default;
- keep the helper unwired from DB/API/UI until a separate integration phase is approved.

The compatibility review should remain type-level and test-level only. It must not insert rows.

## Rollback Boundaries

Rollback is out of scope for Phase 8M. If a future remote migration apply succeeds and rollback is later required, rollback must be separately approved.

Rollback principles:

- rollback affects only `public.discovery_candidate_tools`;
- rollback drops policies before dropping the table if needed;
- rollback must not touch `public.tools`;
- rollback must not touch `discovered_tools`;
- rollback must not delete approved or public tools;
- rollback must not remove unrelated Discovery Engine records;
- rollback logs must not expose secrets or raw payloads.

Rollback SQL from the Phase 8H review package should be re-reviewed before use. Do not run ad hoc rollback SQL in production.

## Failure Handling

If future migration apply fails:

- stop immediately;
- do not attempt ad hoc production fixes;
- capture a safe error summary only;
- do not paste secrets or connection details;
- do not continue to generated type refresh until migration state is clear;
- do not run extraction;
- do not insert candidates;
- prepare the failed state, safe logs, and exact command sequence for Gemini review.

If future generated type refresh fails:

- stop immediately;
- do not hand-edit generated types as a substitute for a clean generation;
- capture a safe error summary only;
- do not commit partial generated files without review;
- prepare Gemini review of the type generation failure.

## Required Gemini Gates

Gemini must approve:

- this Phase 8M plan before any apply/type-refresh phase;
- pre-apply repo and migration status;
- the exact apply command sequence;
- any migration status ambiguity before proceeding;
- generated type target path before generation if no project standard exists;
- generated type diff before commit;
- post-apply database verification results;
- post-apply RLS verification results;
- post-apply constraint/index/trigger verification results;
- any future API/helper/database insert integration;
- any future admin UI changes;
- any future promotion or publish workflow.

## Final Phase 8M Decision Summary

Phase 8M is a review plan only.

It authorizes no migration apply, no generated type update, no database writes, no API/UI/extraction integration, no candidates, no `discovered_tools` writes, and no `public.tools` writes.

The next safe step after Gemini approval is a separate implementation phase for migration apply and generated type refresh, using the exact boundaries in this document.

Candidate extraction remains not implementation-ready after Phase 8M. Staged candidates are not approved tools. Human review remains mandatory. Duplicate detection remains advisory until separately approved. Promotion and publish workflows remain out of scope.
