# Homepage Control Room SQL Migration Draft

## Purpose

This document contains a draft SQL migration for AiFinder’s future Homepage Control Room.

This is documentation only.

Do not run this SQL in Supabase yet. Do not place this in `supabase/migrations` yet. Do not apply database changes until James, ChatGPT, Gemini, and the final safety review approve it.

## Migration Safety Rules

- This draft must be reviewed before execution.
- This draft must not change production data yet.
- This draft must not expose draft/preview/admin-only data to the public.
- Public reads must only access the public-safe view.
- Admin writes must go through protected Admin API/server-side flow.
- Publish/revert must be atomic.
- Tool placements must store Tool UUID/ID references.
- Tool placement IDs must be validated before publish.

## Draft Migration SQL

```sql
-- Homepage Control Room SQL Migration Draft
-- Documentation-only draft.
-- Do not execute until separately approved.

create extension if not exists pgcrypto;

create table if not exists public.homepage_control_configs (
  id uuid primary key default gen_random_uuid(),

  status text not null check (status in ('draft', 'preview', 'published')),

  version integer not null check (version > 0),
  is_active_published boolean not null default false,

  content_config jsonb not null default '{}'::jsonb,
  layout_config jsonb not null default '{}'::jsonb,
  tool_placements jsonb not null default '[]'::jsonb,
  starter_chips jsonb not null default '[]'::jsonb,

  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,

  created_by uuid null,
  created_by_label text null,

  published_by uuid null,
  published_by_label text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,

  reverted_from_config_id uuid null references public.homepage_control_configs(id)
);

create unique index if not exists homepage_control_one_active_published
on public.homepage_control_configs (is_active_published)
where is_active_published = true;

create index if not exists homepage_control_configs_status_idx
on public.homepage_control_configs (status);

create index if not exists homepage_control_configs_published_idx
on public.homepage_control_configs (is_active_published, published_at desc);

create index if not exists homepage_control_configs_created_at_idx
on public.homepage_control_configs (created_at desc);
```

```sql
create table if not exists public.homepage_control_audit_events (
  id uuid primary key default gen_random_uuid(),

  config_id uuid null references public.homepage_control_configs(id),

  action text not null check (
    action in (
      'created-draft',
      'updated-draft',
      'previewed',
      'published',
      'reverted',
      'validation-failed'
    )
  ),

  message text not null,

  actor_id uuid null,
  actor_label text null,

  validation_errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists homepage_control_audit_config_id_idx
on public.homepage_control_audit_events (config_id);

create index if not exists homepage_control_audit_action_idx
on public.homepage_control_audit_events (action);

create index if not exists homepage_control_audit_created_at_idx
on public.homepage_control_audit_events (created_at desc);

create index if not exists homepage_control_audit_actor_id_idx
on public.homepage_control_audit_events (actor_id);

create table if not exists public.homepage_control_checklist_runs (
  id uuid primary key default gen_random_uuid(),

  config_id uuid not null references public.homepage_control_configs(id),

  checklist_items jsonb not null default '{}'::jsonb,
  all_required_complete boolean not null default false,

  completed_by uuid null,
  completed_by_label text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_control_checklist_config_id_idx
on public.homepage_control_checklist_runs (config_id);

create index if not exists homepage_control_checklist_complete_idx
on public.homepage_control_checklist_runs (all_required_complete);

create index if not exists homepage_control_checklist_created_at_idx
on public.homepage_control_checklist_runs (created_at desc);
```

Audit metadata must stay small. Do not store secrets, tokens, private
environment values, raw request/response payload dumps, or large debug blobs in
`metadata`. Avoid audit log bloat; large debug payloads should not be stored
permanently.

```sql
drop view if exists public.public_homepage_control_config;

create view public.public_homepage_control_config
with (security_invoker = true) as
select
  id,
  version,
  content_config,
  layout_config,
  tool_placements,
  starter_chips,
  published_at
from public.homepage_control_configs
where status = 'published'
  and is_active_published = true
limit 1;

alter table public.homepage_control_configs enable row level security;
alter table public.homepage_control_audit_events enable row level security;
alter table public.homepage_control_checklist_runs enable row level security;

grant usage on schema public to anon;
grant select on public.public_homepage_control_config to anon;

revoke all on public.homepage_control_configs from anon;
revoke all on public.homepage_control_audit_events from anon;
revoke all on public.homepage_control_checklist_runs from anon;
```

## Admin Identity / RLS Policy Notes

Before this draft becomes a real migration, the final Admin identity model must be confirmed.

Possible direction:

- If AiFinder uses Supabase Auth/admin profiles, `created_by`, `published_by`, `actor_id`, and `completed_by` should reference the approved Admin identity table.
- If AiFinder continues using protected Admin API routes with server-side/service-role access, direct client-side Admin write policies should not be opened.
- RLS policies must never allow anonymous users to read or write base Control Room tables.
- Public users should only access the public-safe view or a server-side fetch that reads from it.

Required future RLS policy work:

- Define admin read policy for configs, audit events, and checklist runs.
- Define admin insert/update policy for draft/preview flows.
- Define protected publish/revert write path.
- Keep audit and checklist state admin-only.

## Draft Admin RLS Policy SQL Template

This section is documentation only. Do not execute until the final Admin identity
model is approved.

The `false` predicates below are intentional safe placeholders. They keep every
base Control Room table closed until AiFinder's final Admin model decides
whether writes are handled by Supabase Auth/admin profiles or by protected
Next.js Admin API routes using server-side credentials.

```sql
-- Documentation-only draft.
-- These policies intentionally deny access until final Admin identity is approved.

create policy homepage_control_configs_admin_select_placeholder
on public.homepage_control_configs
for select
using (false);

create policy homepage_control_configs_admin_insert_placeholder
on public.homepage_control_configs
for insert
with check (false);

create policy homepage_control_configs_admin_update_placeholder
on public.homepage_control_configs
for update
using (false)
with check (false);

create policy homepage_control_audit_events_admin_select_placeholder
on public.homepage_control_audit_events
for select
using (false);

create policy homepage_control_audit_events_admin_insert_placeholder
on public.homepage_control_audit_events
for insert
with check (false);

create policy homepage_control_checklist_runs_admin_select_placeholder
on public.homepage_control_checklist_runs
for select
using (false);

create policy homepage_control_checklist_runs_admin_insert_placeholder
on public.homepage_control_checklist_runs
for insert
with check (false);

create policy homepage_control_checklist_runs_admin_update_placeholder
on public.homepage_control_checklist_runs
for update
using (false)
with check (false);
```

## Important Security Notes

The public-safe view uses `security_invoker = true`.

The anonymous role should only read the public-safe view, not the base Control Room tables.

The public-safe view must not expose:

- Draft configs
- Preview configs
- Audit events
- Checklist runs
- Validation errors
- Validation warnings
- Created-by fields
- Published-by fields
- Admin notes
- Actor IDs
- Secrets
- Tokens
- Environment values

## Tool Placement Validation Notes

`tool_placements` stores Tool UUID/ID references inside JSONB.

Because PostgreSQL cannot enforce normal foreign keys inside JSONB arrays, publish validation must confirm every Tool UUID/ID:

- Exists in the tools table
- Is public-safe
- Is not deleted
- Is not archived unless archived tools are explicitly allowed later

The app layer should hydrate:

Tool ID → current tool record → current slug/name/logo/category/rating/pricing

The public view should not resolve Tool IDs into full tool objects.

Tool UUID/ID validation must happen inside the same protected transaction/RPC as
the publish operation. Do not validate tools in a separate earlier request and
then publish later, because a tool could be changed, archived, deleted, or made
unsafe between validation and publish.

## Publish Transaction Notes

The real implementation must publish atomically.

The deactivate-old and activate-new steps must not run as separate unprotected client-side queries.

Recommended future direction:

- protected server-side transaction block, or
- protected SQL RPC, or
- protected Admin API route that wraps all database changes safely

A future publish flow must:

1. Validate selected preview config.
2. Validate content/layout/tool placements/starter chips.
3. Confirm checklist completion.
4. Confirm Double-S Safety Check.
5. Confirm Discovery Search Quality QA.
6. Confirm all Tool UUID/ID references are valid.
7. Create audit event.
8. Deactivate current active published config.
9. Activate selected published config.
10. Set `published_by`, `published_by_label`, and `published_at`.
11. Trigger cache/revalidation only after database write succeeds.

## Draft Publish RPC SQL Skeleton

This section is documentation only. Do not execute until the final Admin identity
and RLS model are approved.

`security definer` functions are risky. If a SQL RPC is chosen, the final
function must be hardened before real execution, including a safe `search_path`,
least-privilege grants, explicit input validation, and review against privilege
escalation risks.

The final implementation may use a protected Next.js Admin API transaction
instead of a SQL RPC if that fits AiFinder's current session/CSRF model better.
Either direction must publish atomically.

```sql
-- Documentation-only skeleton.
-- Do not execute until final Admin identity, RLS, and tools schema details are approved.

create or replace function public.publish_homepage_control_config(
  target_config_id uuid,
  actor_id uuid,
  actor_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_config public.homepage_control_configs%rowtype;
  missing_tool_count integer := 0;
  unsafe_tool_count integer := 0;
  checklist_ready boolean := false;
begin
  select *
  into target_config
  from public.homepage_control_configs
  where id = target_config_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Homepage config not found.'
    );
  end if;

  if target_config.status <> 'preview' then
    return jsonb_build_object(
      'success', false,
      'error', 'Only preview configs can be published.'
    );
  end if;

  -- Validate Tool UUIDs stored in target_config.tool_placements.
  -- Final SQL must match the approved JSON shape and tools table columns.
  -- Direction:
  -- 1. Extract every referenced Tool UUID from tool_placements.
  -- 2. Confirm every Tool UUID exists in public.tools.
  -- 3. Confirm every referenced tool is public-safe, not deleted, and not archived.
  -- This validation must happen inside this same protected publish transaction
  -- to avoid a TOCTOU bug between validation and publish.
  -- Example placeholders:
  -- missing_tool_count := count of referenced Tool UUIDs not found in public.tools;
  -- unsafe_tool_count := count of referenced tools that are not public-safe.

  if missing_tool_count > 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'Tool placement references include missing tools.'
    );
  end if;

  if unsafe_tool_count > 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'Tool placement references include unsafe tools.'
    );
  end if;

  select exists (
    select 1
    from public.homepage_control_checklist_runs checklist
    where checklist.config_id = target_config_id
      and checklist.all_required_complete = true
  )
  into checklist_ready;

  if checklist_ready is not true then
    return jsonb_build_object(
      'success', false,
      'error', 'Pre-publish checklist is incomplete.'
    );
  end if;

  update public.homepage_control_configs
  set is_active_published = false
  where is_active_published = true;

  update public.homepage_control_configs
  set
    status = 'published',
    is_active_published = true,
    published_by = actor_id,
    published_by_label = actor_label,
    published_at = now(),
    updated_at = now()
  where id = target_config_id;

  insert into public.homepage_control_audit_events (
    config_id,
    action,
    message,
    actor_id,
    actor_label,
    metadata
  )
  values (
    target_config_id,
    'published',
    'Homepage config published.',
    actor_id,
    actor_label,
    jsonb_build_object('source', 'publish_homepage_control_config')
  );

  return jsonb_build_object(
    'success', true,
    'configId', target_config_id,
    'publishedAt', now()
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', 'Homepage publish failed.'
    );
end;
$$;
```

## Rollback/Revert Notes

A future revert flow must:

1. Select a previous validated published config.
2. Revalidate it.
3. Confirm tool placements are still valid.
4. Create audit event.
5. Deactivate current active published config.
6. Activate restored config or restored copy.
7. Trigger cache/revalidation only after database write succeeds.
8. Fall back to safe defaults if validation fails.

## Updated At Trigger Draft

Future real SQL should include an `updated_at` trigger for mutable Control Room tables.

Draft direction:

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger homepage_control_configs_set_updated_at
before update on public.homepage_control_configs
for each row execute function public.set_updated_at();

create trigger homepage_control_checklist_runs_set_updated_at
before update on public.homepage_control_checklist_runs
for each row execute function public.set_updated_at();
```

This must be reviewed before execution.

## Trigger Recommendations

Before real SQL is applied, consider these database-level helpers:

- `updated_at` trigger for config and checklist rows
- protected version assignment function or trigger
- database-generated audit timestamps

## Retention Notes

Recommended future retention direction:

- Published versions: keep last 10 published versions at minimum.
- Audit events: treat as permanent unless a future approved retention policy says otherwise.
- Abandoned drafts: may be pruned after 30 days only after a future approved policy.
- Checklist runs: keep enough history to prove publish readiness.
- Tool records used by homepage placements should prefer soft-delete/archive behavior over hard deletes.

## Open Questions Before Execution

Before this draft becomes a real migration, decide:

- Should `created_by`, `published_by`, `actor_id`, and `completed_by` reference `auth.users` or an Admin profiles table?
- Should direct anon view access be allowed, or should public reads go through a server-side fetch only?
- Should publish/revert use SQL RPC or protected Next.js API route transaction logic?
- Should `version` be manually assigned, sequence-based, or trigger-generated?
- Should reverted configs be activated directly or copied into a new row?
- Should validation errors be stored permanently or only for failed attempts?
- Should abandoned draft pruning be manual or scheduled later?

## Recommended Next Step

1. James reviews this SQL migration draft.
2. Gemini reviews this draft for security, RLS, scalability, and migration risk.
3. Revise the draft if needed.
4. Only after final approval, move SQL into a real migration file.
5. Do not apply SQL to Supabase until separately approved.
