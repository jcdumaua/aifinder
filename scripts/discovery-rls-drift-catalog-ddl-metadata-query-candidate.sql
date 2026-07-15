\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '5000ms';
SET LOCAL lock_timeout = '1000ms';

-- 1. Exact live tools policy metadata.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  p.polname AS policy_name,
  p.polpermissive AS policy_is_permissive,
  p.polcmd AS policy_command,
  ARRAY(
    SELECT r.rolname
    FROM pg_catalog.pg_roles r
    WHERE r.oid = ANY (p.polroles)
    ORDER BY r.rolname
  ) AS policy_roles,
  pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS using_expression,
  pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'tools'
ORDER BY p.polname;

-- 2. Relation identity, ownership, RLS posture, and comments.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  owner_role.rolname AS owner_role,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  pg_catalog.obj_description(c.oid, 'pg_class') AS relation_comment
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = c.relowner
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
ORDER BY c.relname;

-- 3. Column metadata.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS not_null,
  a.attidentity AS identity_kind,
  a.attgenerated AS generated_kind,
  pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS default_expression,
  pg_catalog.col_description(c.oid, a.attnum) AS column_comment
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef ad
  ON ad.adrelid = a.attrelid
 AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 4. Constraints and definitions.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
ORDER BY c.relname, con.conname;

-- 5. Index definitions.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  i.relname AS index_name,
  ix.indisprimary AS is_primary,
  ix.indisunique AS is_unique,
  pg_catalog.pg_get_indexdef(i.oid) AS index_definition
FROM pg_catalog.pg_index ix
JOIN pg_catalog.pg_class c ON c.oid = ix.indrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
ORDER BY c.relname, i.relname;

-- 6. Non-internal trigger metadata.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  t.tgname AS trigger_name,
  t.tgenabled AS trigger_enabled_state,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 7. Explicit relation grants.
SELECT
  table_schema,
  table_name,
  grantor,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('admin_audit_logs', 'admin_audit_archives')
ORDER BY table_name, grantee, privilege_type;

ROLLBACK;
