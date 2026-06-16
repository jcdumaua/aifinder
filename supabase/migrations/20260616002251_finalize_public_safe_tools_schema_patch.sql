-- Patch migration to finalize the public-safe tools schema logic.
-- Targets: Refined slugging, shared trigger utility, and correct view permissions.
-- This patch is safe to apply if 20260615002000_draft_public_safe_tools_schema.sql is already active.

-- 1. Refine slug function to handle all non-URL-safe characters via regex.
-- This ensures symbols like . ! @ are stripped and multiple spaces are collapsed.
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
        '[^a-z0-9\s-]', -- Remove all characters except alphanumeric, space, and hyphen
        '',
        'g'
      ),
      '\s+', -- Collapse one or more spaces/whitespace into a single hyphen
      '-',
      'g'
    ),
    ''
  );
$$;

-- 2. Sync the updated_at trigger to use the project-standard utility function.
-- We drop the specific function if it was created in the draft to maintain a clean schema.
drop function if exists public.set_tools_updated_at();

drop trigger if exists tools_set_updated_at on public.tools;
create trigger tools_set_updated_at
before update on public.tools
for each row
execute function public.set_updated_at();

-- 3. Ensure the public-safe view is accessible to both anonymous and logged-in users.
-- This is required for the public site, sitemaps, and Admin Room previews.
grant select on public.public_safe_tools to anon, authenticated;

-- 4. Update existing slugs to use the improved regex logic.
-- This only updates records where the slug would actually change.
-- Note: If this causes a collision, the unique index tools_active_slug_unique_idx
-- will correctly prevent the update, requiring manual cleanup.
update public.tools
set slug = public.aifinder_tool_slug(name)
where slug is distinct from public.aifinder_tool_slug(name);

-- Ensure the view still respects security invoker settings
comment on view public.public_safe_tools is 'Public-safe view for tools. Always use this instead of public.tools for client-side reads.';