-- AiFinder Phase 26YB read-only target catalog preflight candidate.
-- INERT STATIC REVIEW CANDIDATE: not authorized for execution.
-- Bound forward SHA-256: 7ab6d4ee6ca08eee5a4ce5894bf6bdc4fa9dfcbcf1a688e1aa991a3413d8b2d3
-- Bound rollback SHA-256: bbdaaf439a8203eba7e459f632d0b8a0d0bb60499ee6dade17139dbb247432f2
-- Sequence scope: ZERO_EXPLICIT_SEQUENCE_IDENTIFIERS
--
-- Output contract:
-- - classifications and counts only;
-- - no application-row reads;
-- - no policy expressions;
-- - no credentials, connection strings, environment values, tokens, or response bodies.

\set ON_ERROR_STOP on

begin transaction read only;

set local statement_timeout = '5s';
set local lock_timeout = '2s';
set local idle_in_transaction_session_timeout = '10s';

select
  pg_is_in_recovery() as is_replica,
  current_setting('transaction_read_only') = 'on' as transaction_is_read_only,
  current_user = session_user as role_identity_consistent;

with expected(relation_name) as (
  values
    ('tools')
),
actual as (
  select
    c.relname as relation_name,
    c.relkind,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  join expected e on e.relation_name = c.relname
  where n.nspname = 'public'
)
select
  (select count(*) from expected) as expected_relation_count,
  (select count(*) from actual) as actual_relation_count,
  count(*) filter (where relation_name = 'tools' and relrowsecurity) as tools_rls_enabled_count,
  count(*) filter (where relation_name = 'tools' and relforcerowsecurity) as tools_force_rls_count
from actual;

select
  count(*) as tools_policy_count,
  count(*) filter (where permissive = 'PERMISSIVE') as tools_permissive_policy_count,
  count(*) filter (where cmd = 'SELECT') as tools_select_policy_count,
  count(*) filter (where qual is not null) as tools_using_expression_count,
  count(*) filter (where with_check is not null) as tools_with_check_expression_count
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename = 'tools';

select
  table_name,
  grantee,
  privilege_type,
  is_grantable,
  count(*) as grant_row_count
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'tools'
  )
group by table_name, grantee, privilege_type, is_grantable
order by table_name, grantee, privilege_type;

-- No sequence query is present because the exact committed forward and rollback
-- migrations contain zero explicit public-schema sequence identifiers.
select
  0::integer as expected_sequence_count,
  0::integer as inspected_sequence_count,
  true as zero_sequence_scope_confirmed;

rollback;
