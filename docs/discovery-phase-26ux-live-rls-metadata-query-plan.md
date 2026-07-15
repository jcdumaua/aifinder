# Phase 26UX — Live RLS Metadata Query Plan

## Bound baseline

`229ad96763735fc38fd59af64fa805aee9bef195`

## Objective

Compare deployed PostgreSQL RLS metadata with the committed static RLS coverage contract without reading application rows or mutating the database.

## Permitted catalog relations

Only:

- `pg_catalog.pg_class`
- `pg_catalog.pg_namespace`
- `pg_catalog.pg_policy`

No application table, view, materialized view, sequence, or function may appear in a `FROM`, `JOIN`, subquery, CTE source, or dynamic SQL statement.

## Query 1 — RLS enablement state

```sql
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
```

Purpose:

- list public-schema tables and partitioned tables;
- report RLS enabled and forced flags;
- read catalog metadata only.

## Query 2 — Policy inventory

```sql
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
```

Purpose:

- list policy identity and command;
- report permissive/restrictive mode;
- report role OIDs as catalog metadata;
- reconstruct policy expressions from catalog expression trees;
- read no application rows.

## Query 3 — Tables without policies

```sql
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
```

Purpose:

- identify tables with no policy records;
- support fail-closed reconciliation;
- read catalog metadata only.

## Query 4 — Policy count by relation

```sql
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
```

Purpose:

- count catalog policy records by relation;
- count metadata records only;
- never count application rows.

## Explicit exclusions

The execution package must reject:

- `select *` from any application relation;
- `count(*)` against any application relation;
- joins to application tables or views;
- information retrieval from user records or tool records;
- `insert`, `update`, `delete`, `merge`, `truncate`;
- `create`, `alter`, `drop`, `grant`, `revoke`;
- procedure or function invocation outside catalog expression rendering;
- dynamic SQL;
- transaction statements that could mutate state;
- Supabase migration or push commands.

## Current state

`LIVE_RLS_METADATA_QUERIES_DRAFTED_NOT_EXECUTED`
