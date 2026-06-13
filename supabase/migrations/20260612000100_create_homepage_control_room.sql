-- Homepage Control Room SQL migration draft.
-- REVIEW REQUIRED BEFORE EXECUTION.
-- This migration has not been applied and must be reviewed before any Supabase execution.
-- Source planning document: docs/homepage-control-room-sql-migration-draft.md
-- Do not run automatically. Do not apply until the final Admin identity, RLS, and publish model are approved.

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

-- Audit metadata safety:
-- Keep metadata small, do not store secrets/tokens/raw payload dumps, and avoid log bloat.
-- Large debug payloads should not be stored permanently.

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

-- Draft Admin RLS placeholder policies:
-- These false predicates intentionally deny access until the final Admin identity model is approved.
-- Replace these predicates only in a separately reviewed future migration.

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

-- Draft Publish RPC skeleton:
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
