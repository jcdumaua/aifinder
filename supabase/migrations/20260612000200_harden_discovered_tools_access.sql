-- Harden discovered_tools access after initial discovery queue migration.
--
-- Purpose:
-- - Keep discovery candidates admin/server-only.
-- - Remove default PUBLIC, anon, and authenticated table, sequence, and trigger-function grants.
-- - Keep service_role access for trusted server-side admin workflows.
--
-- Important:
-- This migration does not add public policies.
-- With RLS enabled and no permissive policies, anon/authenticated should not access rows.

create or replace function public.set_discovered_tools_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on table public.discovered_tools from public;
revoke all on table public.discovered_tools from anon;
revoke all on table public.discovered_tools from authenticated;

revoke all on sequence public.discovered_tools_id_seq from public;
revoke all on sequence public.discovered_tools_id_seq from anon;
revoke all on sequence public.discovered_tools_id_seq from authenticated;

revoke all on function public.set_discovered_tools_updated_at() from public;
revoke all on function public.set_discovered_tools_updated_at() from anon;
revoke all on function public.set_discovered_tools_updated_at() from authenticated;

grant all on table public.discovered_tools to service_role;
grant all on sequence public.discovered_tools_id_seq to service_role;
grant execute on function public.set_discovered_tools_updated_at() to service_role;
