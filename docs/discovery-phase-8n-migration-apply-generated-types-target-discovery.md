# Phase 8N — Migration Apply / Generated Types Target Discovery

## Status / Scope

Status: draft for Gemini review.

Scope: inspection and docs-only readiness plan for a future phase that may apply the committed `discovery_candidate_tools` migration and refresh Supabase generated types.

Phase 8N does not apply the migration, run `supabase db push`, run remote SQL mutations, generate or modify Supabase types, add source code, add tests, add UI/API behavior, implement extraction, create candidates, or write to `discovery_candidate_tools`, `discovered_tools`, or `public.tools`.

Candidate extraction remains not implementation-ready after Phase 8N.

## Background

Phase 8I created and pushed the migration file:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

Phase 8L implemented and pushed the pure normalizer helper:

```text
lib/discovery-candidate-normalizer.ts
testing/discovery-candidate-normalizer.test.mjs
```

Phase 8M documented the future migration apply and generated type refresh process, but found no committed generated Supabase `Database` type file. Phase 8N narrows the next decision to target discovery: where generated types should live and which exact future commands should be reviewed before execution.

## Non-goals

Phase 8N does not:

- apply the migration;
- run `supabase db push`;
- run remote SQL mutations;
- run `supabase db reset`;
- run `supabase migration repair`;
- run `supabase db pull`;
- run `supabase gen types`;
- modify generated Supabase types;
- add source code;
- add tests;
- add UI/API behavior;
- implement extraction;
- create candidate rows;
- write to `discovery_candidate_tools`;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- expose secrets, service role keys, access tokens, JWTs, connection strings, raw SQL credentials, or environment values.

## Current State Carried Forward

Current committed state:

- Branch is expected to be `main`.
- Phase 8M is committed and pushed as `c30bfb7 Document candidate staging migration apply plan`.
- Phase 8L is committed and pushed as `2fa4259 Add discovery candidate normalizer`.
- The candidate staging migration exists locally.
- The candidate staging migration has not been applied remotely.
- Generated Supabase types have not been refreshed.
- No API/UI/executor path writes candidate staging rows.
- The normalizer uses local safe insert-like types by design.
- Direct `public.tools` writes remain forbidden.
- Staged candidates are not approved tools.

Read-only linked migration inspection during Phase 8N showed:

- all migrations through `20260617005500` match local and remote;
- `20260625171333` is present locally and absent remotely;
- therefore the only observed pending migration is `20260625171333_create_discovery_candidate_tools.sql`.

## Repository Inspection Summary

Scripts from `package.json`:

- `npm run lint` runs ESLint.
- `npm run build` runs `next build`.
- `npm run check` runs `npm run lint -- --quiet && npm run build`.
- `smoke:discovery` exists, but Phase 8N does not run smoke scripts.

Supabase-related project files discovered:

- `lib/supabase.ts`
- `lib/supabase-admin.ts`
- `supabase/migrations/*`
- `supabase/.temp/*` local Supabase CLI metadata files

No `supabase/config.toml` was found during the repository inspection.

No committed generated Supabase `Database` type file was found. Project-only type-pattern search found:

- `lib/homepage-control-types.ts`
- `lib/supabase.ts`
- `lib/supabase-admin.ts`

Supabase client usage is currently untyped with generated table types:

- `lib/supabase.ts` creates the public client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase-admin.ts` creates the admin/server client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- no `createClient<Database>(...)` usage was found.

Environment variable names observed through code/docs references only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

`.env.local` was not printed or inspected.

## Generated Types Target Discovery

Because no generated Supabase `Database` type file currently exists, Phase 8N must choose a target path for future generated types without creating it.

Options considered:

| Path | Fit | Tradeoff |
| --- | --- | --- |
| `lib/supabase/database.types.ts` | Keeps Supabase-specific generated types close to existing `lib/supabase.ts` and `lib/supabase-admin.ts`. | Requires creating a new `lib/supabase/` directory in the future type-refresh phase. |
| `types/database.types.ts` | Conventional generated-type location. | No `types/` directory currently exists in the repo. |
| `types/supabase.ts` | Clear Supabase-specific naming. | No existing `types/` directory or project pattern. |
| `lib/database.types.ts` | Simple and close to application helpers. | Less clearly scoped to Supabase than a dedicated folder. |

## Recommended Generated Type Target Path

Recommended future generated type target:

```text
lib/supabase/database.types.ts
```

Reasoning:

- The repo already keeps Supabase clients under `lib/`.
- The new `lib/supabase/` directory would clearly distinguish generated Supabase schema types from hand-authored `lib/supabase.ts` and `lib/supabase-admin.ts`.
- The file name `database.types.ts` matches common Supabase generated type naming.
- Keeping the generated file out of root-level `types/` avoids introducing a broader type-directory convention before the project needs it.

Phase 8N does not create this path.

## Future Type Generation Command Plan

Supabase CLI help observed during Phase 8N:

- `supabase gen types` generates types from a Postgres schema.
- `--linked` generates from the linked project.
- `--schema, -s` accepts comma-separated schemas to include.
- `--lang` defaults to `typescript`.

Recommended future command discovery:

```bash
supabase gen types --help
```

Recommended future command, only after migration apply and Gemini approval:

```bash
mkdir -p lib/supabase
supabase gen types --linked --lang typescript --schema public > lib/supabase/database.types.ts
```

Execution rules for the future type-refresh phase:

- Do not run this command in Phase 8N.
- Do not expose access tokens or connection strings.
- Capture only safe command summaries.
- Review the generated diff before commit.
- Confirm `discovery_candidate_tools` appears in the generated `Database` type.
- Confirm no unexpected raw payload columns appear.
- Do not wire generated types into `createClient` or normalizer code until a separate integration phase is approved.

## Future Migration Apply Command Plan

Supabase CLI help observed during Phase 8N:

- `supabase migration list --linked` lists local and remote migrations.
- `supabase db push --linked` is the planned future apply command from Phase 8M, but it was not run in Phase 8N.

Recommended future pre-apply commands:

```bash
git status --short --branch
supabase migration list --linked
```

Expected pre-apply migration status:

- local and remote match through `20260617005500`;
- local-only pending migration is `20260625171333`;
- no unexpected remote-only migrations exist;
- no unexpected additional local-only migrations exist.

Recommended future apply command, only after Gemini and James approval:

```bash
supabase db push --linked
```

Apply-phase reporting rules:

- Do not paste secrets into logs.
- Do not print service role keys, access tokens, JWTs, connection strings, or raw environment values.
- Capture only safe summary output.
- Stop if the pending migration set is not exactly expected.
- Do not run extraction.
- Do not insert staging candidates.
- Do not write `public.tools`.
- Do not write `discovered_tools`.

## Pre-Apply Safety Checklist

Before a future apply/type-refresh execution phase:

- `git status --short --branch` is clean.
- Branch is `main`.
- Migration file `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` is committed and pushed.
- Gemini has approved Phase 8N target discovery.
- Gemini has reviewed the exact apply command plan.
- Supabase CLI help has been checked.
- Linked migration list confirms only `20260625171333` is pending.
- `.env.local` values are not printed.
- Required environment variables are present without exposing values.
- Generated type target path is approved as `lib/supabase/database.types.ts`.
- No extraction code is enabled.
- No API/UI staging insert path is enabled.
- No public tool write path is involved.
- No discovered tool write path is involved.
- Rollback/failure plan is reviewed before apply.

## Post-Apply Database Verification Plan

After a future approved migration apply, verify safely:

- `public.discovery_candidate_tools` table exists.
- expected columns exist.
- RLS is enabled.
- direct `anon` access is denied.
- direct `authenticated` access is denied.
- deny policies exist.
- expected indexes exist.
- expected constraints exist.
- `set_discovery_candidate_tools_updated_at` trigger exists.
- no public-safe view exists.
- no rows were inserted by the migration.
- no changes occurred to `public.tools`.
- no changes occurred to `discovered_tools`.

Safe SQL examples for a later approved verification phase:

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
select policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'discovery_candidate_tools'
order by policyname;
```

```sql
select count(*) as staged_candidate_count
from public.discovery_candidate_tools;
```

The future report should summarize counts and object presence only. It must not dump full rows.

## Post-Type-Refresh Verification Plan

After a future approved type generation:

- confirm `lib/supabase/database.types.ts` exists;
- confirm the generated `Database` type includes `public.Tables.discovery_candidate_tools`;
- confirm `Row`, `Insert`, and `Update` shapes exist for `discovery_candidate_tools`;
- confirm no unrelated generated type drift if possible;
- confirm no raw payload columns exist in the generated staging table type;
- run `./node_modules/.bin/tsc --noEmit`;
- run `node testing/discovery-candidate-normalizer.test.mjs`;
- run `npm run lint`;
- run `npm run check`;
- compare local `SafeDiscoveryCandidateToolInsert` against the generated insert type in a separate reviewed implementation phase;
- do not add API/UI/DB insert integration yet.

## Generated Type Diff Review Expectations

Gemini should review:

- the full generated type file if newly added;
- whether the generated target path is correct;
- whether `discovery_candidate_tools` appears with expected columns;
- whether relationships are generated as expected;
- whether enum-like check constraints are represented only as strings, requiring application validation to remain in place;
- whether any unrelated table/type drift appeared;
- whether any generated type suggests unexpected schema changes;
- whether the normalizer’s local safe output type remains compatible enough for the next integration planning phase.

Generated types should not be manually edited to hide drift or force compatibility.

## Rollback / Failure Handling

If a future migration apply fails:

- stop immediately;
- do not run type generation;
- do not attempt ad hoc remote SQL fixes;
- capture safe error summary only;
- do not expose secrets or connection strings;
- send the command sequence and safe failure summary to Gemini;
- do not run extraction;
- do not insert candidates.

If future type generation fails:

- stop immediately;
- do not hand-edit generated types as a substitute;
- do not commit partial generated files without review;
- capture safe error summary only;
- send the failure state to Gemini.

Rollback boundaries:

- rollback requires separate approval after any remote apply;
- rollback may only affect `public.discovery_candidate_tools`;
- rollback must not touch `public.tools`;
- rollback must not touch `discovered_tools`;
- rollback must not delete approved/public tools;
- rollback must not delete unrelated Discovery Engine records.

## Required Gemini Gates

Gemini must approve:

- Phase 8N target discovery before apply/type-generation execution;
- the exact generated type target path;
- the exact migration apply command plan;
- the exact type-refresh command plan;
- pre-apply linked migration status;
- generated type diff before commit;
- post-apply verification;
- post-type-refresh verification;
- any future DB insert/API/UI/extraction integration;
- any future promotion or publish workflow.

## Final Phase 8N Recommendation

Recommended target path:

```text
lib/supabase/database.types.ts
```

Recommended future apply command:

```bash
supabase db push --linked
```

Recommended future type generation command:

```bash
mkdir -p lib/supabase
supabase gen types --linked --lang typescript --schema public > lib/supabase/database.types.ts
```

Phase 8N authorizes no migration apply, no generated type update, no database writes, and no API/UI/extraction integration.

Candidate extraction remains not implementation-ready after Phase 8N. Direct `public.tools` writes remain forbidden. Staged candidates are not approved tools. Human review remains mandatory. Duplicate detection remains advisory until separately approved. Promotion and publish workflows are out of scope.
