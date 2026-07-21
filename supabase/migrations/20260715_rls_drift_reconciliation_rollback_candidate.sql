-- AIFINDER GUARDED ROLLBACK DRAFT — NOT AUTHORIZED FOR EXECUTION
-- This candidate deliberately aborts before any rollback statement.
DO $aifinder_guard$
BEGIN
  RAISE EXCEPTION
    'AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required';
END
$aifinder_guard$;

BEGIN;

DO $verify_rollback$
DECLARE
  legacy_count integer;
BEGIN
  SELECT count(*) INTO legacy_count
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'tools'
    AND p.polname = 'Public can read tools';

  IF legacy_count <> 0 THEN
    RAISE EXCEPTION 'Legacy tools policy already exists; rollback stopped';
  END IF;
END
$verify_rollback$;

CREATE POLICY "Public can read tools"
ON public.tools
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

-- No grant rollback is included because no grant revocation is included
-- in the forward draft.
COMMIT;
