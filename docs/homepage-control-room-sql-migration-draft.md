# Homepage Control Room SQL Migration Draft

## Purpose

This document contains a draft SQL migration for AiFinder’s future Homepage Control Room.

This is documentation only and is mirrored by the draft migration file
`supabase/migrations/20260612000100_create_homepage_control_room.sql`.

Do not run this SQL in Supabase yet. Do not apply database changes until James,
ChatGPT, Gemini, and the final safety review approve it.

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
  status text not null check (status in ('draft', 'preview', 'published', 'archived')),
  version integer not null check (version > 0),
  is_active boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  tool_placements jsonb not null default '[]'::jsonb,
  pre_publish_checklist jsonb not null default '[]'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  created_by uuid,
  updated_by uuid,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists homepage_control_one_active_published_idx
  on public.homepage_control_configs (is_active)
  where is_active = true and status = 'published';

create index if not exists homepage_control_configs_status_idx
  on public.homepage_control_configs (status);

create index if not exists homepage_control_configs_created_at_idx
  on public.homepage_control_configs (created_at desc);

create index if not exists homepage_control_configs_published_at_idx
  on public.homepage_control_configs (published_at desc);
```

Naming notes:

- `is_active` marks the active homepage row and is constrained by the partial unique index to published rows only.
- `config` and `content` keep the first schema broad but small.
- Starter/discovery chip controls are intentionally omitted as top-level columns for now; they can live inside `config` until a future approved phase needs a dedicated column.

```sql
create table if not exists public.homepage_control_audit_events (
  id uuid primary key default gen_random_uuid(),
  config_id uuid references public.homepage_control_configs (id) on delete set null,
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
  actor_id uuid,
  actor_label text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists homepage_control_audit_events_config_id_idx
  on public.homepage_control_audit_events (config_id);

create index if not exists homepage_control_audit_events_action_idx
  on public.homepage_control_audit_events (action);

create index if not exists homepage_control_audit_events_created_at_idx
  on public.homepage_control_audit_events (created_at desc);

create table if not exists public.homepage_control_checklist_runs (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.homepage_control_configs (id) on delete cascade,
  checklist jsonb not null default '[]'::jsonb,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_control_checklist_runs_config_id_idx
  on public.homepage_control_checklist_runs (config_id);

create index if not exists homepage_control_checklist_runs_created_at_idx
  on public.homepage_control_checklist_runs (created_at desc);

create index if not exists homepage_control_checklist_runs_completed_at_idx
  on public.homepage_control_checklist_runs (completed_at desc);
```

Checklist notes:

- `checklist` keeps the JSON shape flexible until final Admin UI requirements are approved.
- Completion readiness should be validated from checklist JSON and/or future approved workflow logic before publish. A separate derived completion column is intentionally omitted for now to avoid storing derived state before the final publish model is approved.

Audit metadata must stay small. Do not store secrets, tokens, private
environment values, raw request/response payload dumps, or large debug blobs in
`metadata`. Avoid audit log bloat; large debug payloads should not be stored
permanently.

```sql
drop view if exists public.public_homepage_control_config;

-- Public view safety:
-- Supabase-test this security_invoker view with RLS and permissions before applying.
-- Public reads must work without exposing base table admin data.

create view public.public_homepage_control_config
with (security_invoker = true) as
select
  id,
  version,
  config,
  content,
  tool_placements,
  published_at,
  updated_at
from public.homepage_control_configs
where status = 'published'
  and is_active = true
limit 1;

alter table public.homepage_control_configs enable row level security;
alter table public.homepage_control_audit_events enable row level security;
alter table public.homepage_control_checklist_runs enable row level security;

revoke all on public.homepage_control_configs from anon;
revoke all on public.homepage_control_audit_events from anon;
revoke all on public.homepage_control_checklist_runs from anon;
grant select on public.public_homepage_control_config to anon;
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

drop policy if exists "Admin can read homepage control configs"
  on public.homepage_control_configs;

create policy "Admin can read homepage control configs"
on public.homepage_control_configs
for select
using (false);

drop policy if exists "Admin can write homepage control configs"
  on public.homepage_control_configs;

create policy "Admin can write homepage control configs"
on public.homepage_control_configs
for all
using (false)
with check (false);

drop policy if exists "Admin can read homepage control audit events"
  on public.homepage_control_audit_events;

create policy "Admin can read homepage control audit events"
on public.homepage_control_audit_events
for select
using (false);

drop policy if exists "Admin can insert homepage control audit events"
  on public.homepage_control_audit_events;

create policy "Admin can insert homepage control audit events"
on public.homepage_control_audit_events
for insert
with check (false);

drop policy if exists "Admin can read homepage control checklist runs"
  on public.homepage_control_checklist_runs;

create policy "Admin can read homepage control checklist runs"
on public.homepage_control_checklist_runs
for select
using (false);

drop policy if exists "Admin can write homepage control checklist runs"
  on public.homepage_control_checklist_runs;

create policy "Admin can write homepage control checklist runs"
on public.homepage_control_checklist_runs
for all
using (false)
with check (false);
```

## Important Security Notes

The public-safe view uses `security_invoker = true`.

The anonymous role should only read the public-safe view, not the base Control Room tables.

The `security_invoker = true` public view, RLS policies, and grants must be
Supabase-tested before this draft is applied. Public reads must work without
exposing base table admin data.

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
2. Validate config/content/tool placements.
3. Confirm checklist completion.
4. Confirm Double-S Safety Check.
5. Confirm Discovery Search Quality QA.
6. Confirm all Tool UUID/ID references are valid.
7. Create audit event.
8. Deactivate current active published config.
9. Activate selected published config.
10. Set `published_by` and `published_at`.
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
-- SECURITY DEFINER FUNCTIONS ARE RISKY and must be hardened before real execution.
-- This skeleton is intentionally disabled and exists only to document the future publish contract.
-- Final implementation may instead use a protected Next.js Admin API transaction if that better fits
-- AiFinder's current session and CSRF model.
-- Tool UUID/ID validation must happen inside the same protected transaction/RPC as publish to prevent
-- TOCTOU bugs where a tool changes, is deleted, or is archived between validation and activation.
-- Future publish logic must validate public-safe tools, checklist completion, workflow state, audit
-- readiness, deactivate the previous active config, activate the target config, set publish metadata,
-- insert a publish audit event, and return JSON success/failure.

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
begin
  return jsonb_build_object(
    'success', false,
    'error', 'Draft publish RPC skeleton is disabled pending final approval.'
  );
end;
$$;

revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from public;
revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from anon;
revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from authenticated;
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
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_homepage_control_configs_updated_at
  on public.homepage_control_configs;

create trigger set_homepage_control_configs_updated_at
before update on public.homepage_control_configs
for each row
execute function public.set_updated_at();

drop trigger if exists set_homepage_control_checklist_runs_updated_at
  on public.homepage_control_checklist_runs;

create trigger set_homepage_control_checklist_runs_updated_at
before update on public.homepage_control_checklist_runs
for each row
execute function public.set_updated_at();
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
4. Only after final approval, revise the draft migration file if needed.
5. Do not apply SQL to Supabase until separately approved.
