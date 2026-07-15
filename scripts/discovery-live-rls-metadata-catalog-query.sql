-- AiFinder live RLS metadata inspection
-- Catalog-only, read-only, 5-second statement timeout.
-- Approved sources:
--   pg_catalog.pg_class
--   pg_catalog.pg_namespace
--   pg_catalog.pg_policy

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = 5000;

select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relkind as relation_kind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by n.nspname, c.relname;

select
  n.nspname as schema_name,
  c.relname as relation_name,
  p.polname as policy_name,
  p.polpermissive as policy_is_permissive,
  p.polcmd as policy_command,
  p.polroles::text as policy_roles,
  pg_catalog.pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression
from pg_catalog.pg_policy as p
join pg_catalog.pg_class as c
  on c.oid = p.polrelid
join pg_catalog.pg_namespace as n
  on n.oid = c.relnamespace
where n.nspname = 'public'
order by n.nspname, c.relname, p.polname;

select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and not exists (
    select 1
    from pg_catalog.pg_policy as p
    where p.polrelid = c.oid
  )
order by n.nspname, c.relname;

select
  n.nspname as schema_name,
  c.relname as relation_name,
  count(p.oid) as policy_count
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n
  on n.oid = c.relnamespace
left join pg_catalog.pg_policy as p
  on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
group by n.nspname, c.relname
order by n.nspname, c.relname;

ROLLBACK;
