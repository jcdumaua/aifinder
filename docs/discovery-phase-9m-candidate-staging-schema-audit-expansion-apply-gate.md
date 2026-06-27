# Phase 9M — Candidate Staging Schema & Audit Expansion Migration Review / Apply Gate

## 1. Phase title and status

Phase 9M is a migration review / apply-gate phase.

This phase performs local inspection and safe read-only remote schema inspection only. It does not apply the migration, run `supabase db push`, mutate the database, insert/update/delete rows, regenerate Supabase types, modify source code, modify tests, modify helpers, modify smoke scripts, modify package scripts, add API/UI/extraction/crawler/LLM integration, write to `public.tools`, write to `discovered_tools`, add audit event writes, run the live RLS smoke, or set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`.

## 2. Phase scope

Phase 9M reviews the draft migration created in Phase 9L:

```text
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
```

The gate verifies whether the migration is ready to proceed to a separately approved apply/type-generation phase.

## 3. Local migration review

The local migration draft adds nullable source accountability to staged candidates:

```sql
alter table public.discovery_candidate_tools
  add column if not exists discovery_source_id uuid null;
```

It adds a source foreign key using the Phase 9K decision:

```sql
alter table public.discovery_candidate_tools
  add constraint discovery_candidate_tools_discovery_source_id_fkey
  foreign key (discovery_source_id)
  references public.discovery_sources(id)
  on delete restrict;
```

It adds the planned source and run/source indexes:

```sql
create index if not exists discovery_candidate_tools_discovery_source_id_idx
  on public.discovery_candidate_tools (discovery_source_id);

create index if not exists discovery_candidate_tools_run_source_idx
  on public.discovery_candidate_tools (discovery_run_id, discovery_source_id);
```

It adds the planned column comment:

```sql
comment on column public.discovery_candidate_tools.discovery_source_id
  is 'Source row that produced or supplied the candidate evidence for staging.';
```

It expands the `public.discovery_audit_events.action` check constraint by preserving existing local actions and adding candidate-staging actions:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
candidate-staged
candidate-stage-failed
candidate-duplicate-hint-recorded
candidate-cleanup-performed
```

The draft does not add RLS policy changes, public grants, public-safe views, audit writes, API/UI behavior, extraction behavior, crawler automation, LLM behavior, approval, publishing, promotion, ranking, or recommendation behavior.

## 4. Local schema findings

Local migration inspection confirmed:

- `public.discovery_audit_events` was created in `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql`.
- The local `action` check currently allows:
  - `approve`
  - `reject`
  - `flag`
  - `ignore`
  - `batch-action`
  - `mark-duplicate`
- `public.discovery_candidate_tools` was created in `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql`.
- The local candidate table currently has `discovery_run_id` with `on delete restrict`.
- The local candidate table currently does not define `discovery_source_id`.
- Existing candidate-table RLS remains deny-all for anon/authenticated users.
- Generated Supabase types currently do not include `discovery_candidate_tools.discovery_source_id`, as expected before migration apply/type generation.

## 5. Remote schema inspection method

`psql` plus safe DB URL environment variables were not available in the shell environment:

```text
psql_available=no
DATABASE_URL_present=no
SUPABASE_DB_URL_present=no
```

The available safe remote inspection path was the linked Supabase CLI. Phase 9M used SELECT-only `supabase db query --linked --output table` commands. No connection strings, environment values, tokens, or secrets were printed.

No mutating SQL was run.

## 6. Remote findings

### `discovery_audit_events.action` constraint

Remote read-only inspection found the current constraint name:

```text
discovery_audit_events_action_check
```

Remote current constraint definition:

```text
CHECK ((action = ANY (ARRAY['approve'::text, 'reject'::text, 'flag'::text, 'ignore'::text, 'batch-action'::text, 'mark-duplicate'::text])))
```

Remote current allowed actions:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
```

This matches the Phase 9L migration draft and confirms the planned constraint name is correct.

### `discovery_source_id` column

Remote read-only inspection returned no row for:

```text
public.discovery_candidate_tools.discovery_source_id
```

Result:

```text
discovery_source_id currently absent
```

This matches the Phase 9L migration assumption.

### Planned FK

Remote read-only inspection returned no row for:

```text
discovery_candidate_tools_discovery_source_id_fkey
```

Result:

```text
planned FK currently absent
```

This matches the Phase 9L migration assumption.

### Planned indexes

Remote read-only inspection returned no rows for:

```text
discovery_candidate_tools_discovery_source_id_idx
discovery_candidate_tools_run_source_idx
```

Result:

```text
planned indexes currently absent
```

This matches the Phase 9L migration assumption.

### RLS status

Remote read-only inspection found:

```text
schema_name: public
table_name: discovery_candidate_tools
row_security_enabled: true
force_row_security: false
```

Result:

```text
RLS remains enabled on public.discovery_candidate_tools
```

### Anon/authenticated grants

Remote read-only inspection returned no rows for anon/authenticated grants on:

```text
public.discovery_candidate_tools
```

Result:

```text
No anon/authenticated table grants found for public.discovery_candidate_tools
```

## 7. Migration readiness assessment

The migration draft is consistent with:

- Phase 9J source-accountability and audit-compatibility planning;
- Phase 9K implementation plan;
- local migration history;
- generated type state before apply;
- remote schema state before apply.

No remote evidence was found that would require changing the migration draft before the next gate.

## 8. Apply-gate verdict

Apply gate verdict: Ready for Phase 9N apply/type generation.

Phase 9N must still require explicit James approval before running `supabase db push` or any migration apply command.

## 9. Required Phase 9N boundaries

Phase 9N should:

- apply only the reviewed Phase 9L migration after explicit approval;
- verify the migration result;
- regenerate Supabase types only after successful apply;
- confirm generated types include `discovery_candidate_tools.discovery_source_id`;
- confirm the new relationship to `discovery_sources`;
- confirm no unexpected unrelated generated type drift;
- run `npm run check`;
- keep API/UI/extraction/crawler/LLM integration deferred;
- avoid candidate/run/source creation unless separately approved;
- avoid audit event writes.

## 10. Safety boundaries preserved

Phase 9M preserved these boundaries:

- migration was not applied;
- `supabase db push` was not run;
- no mutating SQL was run;
- no DB writes were performed;
- no rows were inserted, updated, deleted, or upserted;
- no Supabase types were regenerated;
- no source/tests/helpers/package/generated types were modified;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` writes occurred;
- no `discovered_tools` writes occurred;
- no audit event writes occurred;
- live RLS smoke was not rerun;
- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.

## 11. Rollback

Phase 9M rollback is docs-only:

- remove this Phase 9M apply-gate document.

No DB rollback is required because Phase 9M performed no DB mutation.
