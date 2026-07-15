-- AIFINDER GUARDED DRAFT — NOT AUTHORIZED FOR EXECUTION
-- This candidate deliberately aborts before any remediation statement.
DO $aifinder_guard$
BEGIN
  RAISE EXCEPTION
    'AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required';
END
$aifinder_guard$;

BEGIN;

-- 1. Fail closed unless both expected tools policies exist exactly.
DO $verify_tools$
DECLARE
  approved_count integer;
  legacy_count integer;
BEGIN
  SELECT count(*) INTO approved_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'tools'
    AND p.polname = 'Allow public read access to approved tools'
    AND p.polpermissive
    AND p.polcmd = 'r'
    AND pg_catalog.pg_get_expr(p.polqual, p.polrelid)
      = '((status = ''approved''::text) AND (deleted_at IS NULL))';

  SELECT count(*) INTO legacy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'tools'
    AND p.polname = 'Public can read tools'
    AND p.polpermissive
    AND p.polcmd = 'r'
    AND pg_catalog.pg_get_expr(p.polqual, p.polrelid) = 'true';

  IF approved_count <> 1 OR legacy_count <> 1 THEN
    RAISE EXCEPTION 'Unexpected public.tools policy baseline';
  END IF;
END
$verify_tools$;

-- 2. Narrow policy remediation.
DROP POLICY "Public can read tools" ON public.tools;

-- 3. Audit schema assertions only; no table recreation and no data mutation.
DO $verify_audit$
BEGIN
  IF to_regclass('public.admin_audit_logs') IS NULL
     OR to_regclass('public.admin_audit_archives') IS NULL
     OR to_regclass('public.admin_audit_logs_id_seq') IS NULL THEN
    RAISE EXCEPTION 'Expected audit relations or sequence are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Expected audit RLS baseline is missing';
  END IF;
END
$verify_audit$;

-- Grant cleanup intentionally excluded pending final dependency-proof review.
COMMIT;
