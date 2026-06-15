-- Draft Migration A: public-safe tools schema/view support for Homepage Control Room.
--
-- REVIEW REQUIRED BEFORE EXECUTION.
-- Do not apply automatically. This migration draft is intended for James/Gemini
-- review before any Supabase execution.
--
-- Purpose:
-- - Add canonical tool slugs for stable public URLs and homepage placements.
-- - Add public-safety state to live tools before Homepage Control publish is used.
-- - Expose public tools through a narrow public-safe view instead of the base table.
--
-- Safety notes:
-- - This migration intentionally fails before mutating public.tools if generated
--   slugs would collide or be empty.
-- - This migration does not publish a Homepage Control Room config.
-- - This migration does not revoke anon select from public.tools. That hardening
--   belongs in Migration B after public app reads have cut over to
--   public.public_safe_tools and been verified.

create or replace function public.aifinder_tool_slug(name_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    replace(
      replace(
        replace(lower(btrim(coalesce(name_value, ''))), '.', ''),
        '·',
        ''
      ),
      ' ',
      '-'
    ),
    ''
  );
$$;

do $$
declare
  duplicate_slugs text;
  empty_slug_tool_ids text;
begin
  select string_agg(format('%s => tool ids [%s]', proposed_slug, tool_ids), '; ')
  into duplicate_slugs
  from (
    select
      public.aifinder_tool_slug(name) as proposed_slug,
      string_agg(id::text, ', ' order by id) as tool_ids,
      count(*) as tool_count
    from public.tools
    group by public.aifinder_tool_slug(name)
  ) proposed
  where proposed_slug is not null
    and tool_count > 1;

  if duplicate_slugs is not null then
    raise exception 'Cannot backfill tools.slug. Resolve duplicate generated slugs first: %',
      duplicate_slugs;
  end if;

  select string_agg(id::text, ', ' order by id)
  into empty_slug_tool_ids
  from public.tools
  where public.aifinder_tool_slug(name) is null;

  if empty_slug_tool_ids is not null then
    raise exception 'Cannot backfill tools.slug. These tool ids have empty generated slugs: %',
      empty_slug_tool_ids;
  end if;
end $$;

alter table public.tools
  add column if not exists slug text;

alter table public.tools
  add column if not exists status text;

alter table public.tools
  add column if not exists deleted_at timestamptz;

alter table public.tools
  add column if not exists updated_at timestamptz;

update public.tools
set slug = public.aifinder_tool_slug(name)
where slug is null
   or btrim(slug) = '';

update public.tools
set status = 'approved'
where status is null
   or btrim(status) = '';

-- Existing tools remain active; the newly added deleted_at column is null by
-- default and can be populated later by a soft-delete/archive workflow.

update public.tools
set updated_at = coalesce(updated_at, created_at, now());

alter table public.tools
  alter column slug set not null;

alter table public.tools
  alter column status set default 'approved';

alter table public.tools
  alter column status set not null;

alter table public.tools
  alter column updated_at set default now();

alter table public.tools
  alter column updated_at set not null;

alter table public.tools
  drop constraint if exists tools_slug_non_empty_check;

alter table public.tools
  add constraint tools_slug_non_empty_check
  check (btrim(slug) <> '');

alter table public.tools
  drop constraint if exists tools_status_check;

alter table public.tools
  add constraint tools_status_check
  check (status in ('approved', 'draft', 'archived'));

create unique index if not exists tools_active_slug_unique_idx
  on public.tools (slug)
  where deleted_at is null;

create index if not exists tools_status_idx
  on public.tools (status);

create index if not exists tools_deleted_at_idx
  on public.tools (deleted_at);

create index if not exists tools_status_deleted_at_slug_idx
  on public.tools (status, deleted_at, slug);

create or replace function public.set_tools_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tools_set_updated_at
  on public.tools;

create trigger tools_set_updated_at
before update on public.tools
for each row
execute function public.set_tools_updated_at();

drop view if exists public.public_safe_tools;

create view public.public_safe_tools
with (security_invoker = true) as
select
  id,
  slug,
  name,
  description,
  website,
  category,
  pricing,
  featured,
  logo_url,
  platforms,
  best_for,
  use_cases,
  ios,
  android,
  created_at,
  updated_at
from public.tools
where status = 'approved'
  and deleted_at is null;

alter table public.tools enable row level security;

drop policy if exists "Allow public read access to approved tools"
  on public.tools;

-- Migration A keeps direct anon reads working while restricting visible rows to
-- public-safe tools. Migration B should revoke direct base-table anon access
-- after every public read path has moved to public.public_safe_tools.
create policy "Allow public read access to approved tools"
  on public.tools
  for select
  to anon
  using (status = 'approved' and deleted_at is null);

grant usage on schema public to anon;
grant select on public.public_safe_tools to anon;

-- Migration B TODO:
-- After app/page.tsx, app/sitemap.ts, category/detail/compare pages, and
-- lib/homepage-control-public.ts are switched to public.public_safe_tools and
-- verified, create a separate hardening migration to revoke anon select from
-- the base public.tools table. Do not execute that revoke in Migration A.

-- Rollback notes:
-- - If app code has already switched to public.public_safe_tools, first deploy an
--   app rollback or replacement view before dropping this view.
-- - Migration A intentionally does not revoke anon select from public.tools. If
--   Migration B later adds that revoke, rollback/hardening order must account
--   for the app read path in production.
-- - Safe rollback SQL, subject to dependency review:
--     revoke select on public.public_safe_tools from anon;
--     drop view if exists public.public_safe_tools;
--     drop policy if exists "Allow public read access to approved tools" on public.tools;
--     drop trigger if exists tools_set_updated_at on public.tools;
--     drop function if exists public.set_tools_updated_at();
--     drop index if exists public.tools_status_deleted_at_slug_idx;
--     drop index if exists public.tools_deleted_at_idx;
--     drop index if exists public.tools_status_idx;
--     drop index if exists public.tools_active_slug_unique_idx;
--     alter table public.tools drop constraint if exists tools_status_check;
--     alter table public.tools drop constraint if exists tools_slug_non_empty_check;
--     alter table public.tools drop column if exists deleted_at;
--     alter table public.tools drop column if exists status;
--     alter table public.tools drop column if exists slug;
--     alter table public.tools drop column if exists updated_at;
--     drop function if exists public.aifinder_tool_slug(text);
-- - Prefer leaving added columns in place if any deployed code or audit workflow
--   has started depending on canonical slugs/status/deleted_at.
