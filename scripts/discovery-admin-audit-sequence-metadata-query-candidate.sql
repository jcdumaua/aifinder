\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '5000ms';
SET LOCAL lock_timeout = '1000ms';

-- Exact sequence identity and settings.
SELECT
  n.nspname AS schema_name,
  c.relname AS sequence_name,
  owner_role.rolname AS owner_role,
  s.seqstart AS start_value,
  s.seqincrement AS increment_by,
  s.seqmin AS minimum_value,
  s.seqmax AS maximum_value,
  s.seqcache AS cache_size,
  s.seqcycle AS cycles
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n
  ON n.oid = c.relnamespace
JOIN pg_catalog.pg_roles owner_role
  ON owner_role.oid = c.relowner
JOIN pg_catalog.pg_sequence s
  ON s.seqrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname = 'admin_audit_logs_id_seq'
  AND c.relkind = 'S';

-- Sequence ownership dependency.
SELECT
  seq_ns.nspname AS sequence_schema,
  seq.relname AS sequence_name,
  table_ns.nspname AS table_schema,
  table_rel.relname AS table_name,
  attr.attname AS owned_by_column,
  dep.deptype AS dependency_type
FROM pg_catalog.pg_depend dep
JOIN pg_catalog.pg_class seq
  ON seq.oid = dep.objid
JOIN pg_catalog.pg_namespace seq_ns
  ON seq_ns.oid = seq.relnamespace
JOIN pg_catalog.pg_class table_rel
  ON table_rel.oid = dep.refobjid
JOIN pg_catalog.pg_namespace table_ns
  ON table_ns.oid = table_rel.relnamespace
JOIN pg_catalog.pg_attribute attr
  ON attr.attrelid = table_rel.oid
 AND attr.attnum = dep.refobjsubid
WHERE seq_ns.nspname = 'public'
  AND seq.relname = 'admin_audit_logs_id_seq'
  AND seq.relkind = 'S'
  AND dep.classid = 'pg_class'::regclass
  AND dep.refclassid = 'pg_class'::regclass
ORDER BY table_schema, table_name, owned_by_column;

-- Explicit sequence grants.
SELECT
  object_schema AS sequence_schema,
  object_name AS sequence_name,
  grantor,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_usage_grants
WHERE object_schema = 'public'
  AND object_name = 'admin_audit_logs_id_seq'
ORDER BY grantee, privilege_type;

ROLLBACK;
