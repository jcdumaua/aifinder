-- Patch migration to finalize the public-safe tools schema logic.
-- Targets: refined slugging, shared trigger utility, and correct view permissions.
-- Safe patch for already-applied migration:
-- 20260615002000_draft_public_safe_tools_schema.sql

-- 1. Refine slug function to handle non-URL-safe characters via regex.
create or replace function public.aifinder_tool_slug(name_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        lower(btrim(coalesce(name_value, ''))),
        '[^a-z0-9\s-]',
        '',
        'g'
      ),
      '\s+',
      '-',
      'g'
    ),
    ''
  );
$$;

-- 2. Safety gate: stop if the improved slug logic would create duplicate active slugs.
do $$
begin
  if exists (
    select 1
    from (
      select public.aifinder_tool_slug(name) as new_slug
      from public.tools
      where deleted_at is null
      group by public.aifinder_tool_slug(name)
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Improved slug function would create duplicate active slugs. Resolve duplicate tool names/slugs before applying this migration.';
  end if;
end $$;

-- 3. Update existing slugs to use the improved regex logic.
update public.tools
set slug = public.aifinder_tool_slug(name)
where slug is distinct from public.aifinder_tool_slug(name);

-- 4. Sync the updated_at trigger to use the project-standard utility function.
drop trigger if exists tools_set_updated_at on public.tools;
drop function if exists public.set_tools_updated_at();

create trigger tools_set_updated_at
before update on public.tools
for each row
execute function public.set_updated_at();

-- 5. Ensure the public-safe view is accessible to both anonymous and logged-in users.
grant select on public.public_safe_tools to anon, authenticated;

-- 6. Document intended client-side read path.
comment on view public.public_safe_tools is
'Public-safe view for tools. Always use this instead of public.tools for client-side reads.';