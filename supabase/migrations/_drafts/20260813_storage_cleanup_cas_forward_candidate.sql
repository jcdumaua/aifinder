-- AiFinder Phase 34IA-34IZ Storage CAS v1 forward candidate.
-- DRAFT ONLY. This file is inert by construction and is not approved for execution.

DO $aifinder_draft_guard$
BEGIN
  RAISE EXCEPTION USING
    MESSAGE = 'AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required';
END
$aifinder_draft_guard$;

DO $aifinder_preconditions$
DECLARE
  v_anon_oid oid;
  v_authenticated_oid oid;
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: storage.objects absent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'storage'
      AND relation.relname = 'objects'
      AND relation.relkind IN ('r', 'p')
      AND relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: storage.objects RLS disabled';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_catalog.pg_attribute AS attribute
    WHERE attribute.attrelid = 'storage.objects'::regclass
      AND attribute.attname IN ('bucket_id', 'name', 'version', 'metadata')
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  ) <> 4 THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: storage.objects columns drifted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('bucket_id', 'text'),
        ('name', 'text'),
        ('version', 'text'),
        ('metadata', 'jsonb')
    ) AS expected(attname, formatted_type)
    LEFT JOIN pg_catalog.pg_attribute AS attribute
      ON attribute.attrelid = 'storage.objects'::regclass
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
      AND attribute.attname = expected.attname
    WHERE attribute.attname IS NULL
      OR pg_catalog.format_type(
        attribute.atttypid,
        attribute.atttypmod
      ) <> expected.formatted_type
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: storage.objects column types drifted';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
  THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: required roles absent';
  END IF;

  IF NOT pg_catalog.has_schema_privilege(
    'anon',
    'storage',
    'USAGE'
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: anon storage schema USAGE absent';
  END IF;

  IF NOT pg_catalog.has_table_privilege(
    'anon',
    'storage.objects',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: anon SELECT table privilege absent';
  END IF;

  IF NOT pg_catalog.has_table_privilege(
    'anon',
    'storage.objects',
    'DELETE'
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: anon DELETE table privilege absent';
  END IF;

  IF to_regprocedure('extensions.digest(bytea,text)') IS NULL THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: extensions.digest(bytea,text) absent';
  END IF;

  IF to_regnamespace('aifinder_storage_private') IS NOT NULL
    OR to_regclass('aifinder_storage_private.cleanup_grants') IS NOT NULL
    OR to_regprocedure(
      'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'
    ) IS NOT NULL
    OR to_regprocedure(
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'
    ) IS NOT NULL
    OR to_regprocedure(
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'
    ) IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS procedure
      JOIN pg_catalog.pg_namespace AS namespace
        ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = 'public'
        AND procedure.proname IN (
          'aifinder_prepare_storage_cleanup_grant',
          'aifinder_revoke_storage_cleanup_grant'
        )
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy AS policy
      WHERE policy.polrelid = 'storage.objects'::regclass
        AND policy.polname IN (
          'AiFinder exact-version cleanup',
          'AiFinder exact-version cleanup restriction',
          'AiFinder exact-version cleanup visibility'
        )
    )
  THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: proposed object already exists';
  END IF;

  SELECT role.oid
    INTO STRICT v_anon_oid
  FROM pg_catalog.pg_roles AS role
  WHERE role.rolname = 'anon';

  SELECT role.oid
    INTO STRICT v_authenticated_oid
  FROM pg_catalog.pg_roles AS role
  WHERE role.rolname = 'authenticated';

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS policy
    CROSS JOIN LATERAL pg_catalog.unnest(policy.polroles) AS policy_role(oid)
    WHERE policy.polrelid = 'storage.objects'::regclass
      AND policy.polcmd IN ('d', '*')
      AND policy.polpermissive
      AND CASE
        WHEN policy_role.oid = 0::oid THEN true
        ELSE pg_catalog.pg_has_role(
            v_anon_oid,
            policy_role.oid,
            'MEMBER'
          )
      END
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: broad permissive anon or PUBLIC DELETE policy exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS policy
    CROSS JOIN LATERAL pg_catalog.unnest(policy.polroles) AS policy_role(oid)
    WHERE policy.polrelid = 'storage.objects'::regclass
      AND policy.polcmd IN ('r', '*')
      AND NOT policy.polpermissive
      AND CASE
        WHEN policy_role.oid = 0::oid THEN true
        ELSE pg_catalog.pg_has_role(
            v_anon_oid,
            policy_role.oid,
            'MEMBER'
          )
      END
  ) THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: restrictive anon or PUBLIC SELECT policy exists';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_catalog.pg_policy AS policy
    CROSS JOIN LATERAL pg_catalog.unnest(policy.polroles) AS policy_role(oid)
    WHERE policy.polrelid = 'storage.objects'::regclass
      AND policy.polcmd IN ('d', '*')
      AND NOT policy.polpermissive
      AND CASE
        WHEN policy_role.oid = 0::oid THEN true
        ELSE pg_catalog.pg_has_role(
            v_anon_oid,
            policy_role.oid,
            'MEMBER'
          )
      END
  ) <> 1
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy AS policy
      WHERE policy.polrelid = 'storage.objects'::regclass
        AND policy.polname = 'Deny direct public logo deletes'
        AND policy.polcmd = 'd'
        AND NOT policy.polpermissive
        AND policy.polroles =
          ARRAY[v_anon_oid, v_authenticated_oid]::oid[]
        AND policy.polwithcheck IS NULL
        AND pg_catalog.pg_get_expr(
          policy.polqual,
          policy.polrelid
        ) = '(bucket_id <> ''tool-logos''::text)'
        AND pg_catalog.obj_description(
          policy.oid,
          'pg_policy'
        ) IS NULL
    )
  THEN
    RAISE EXCEPTION 'AIFINDER_STORAGE_CAS_PRECONDITION: restrictive logo DELETE policy drifted';
  END IF;
END
$aifinder_preconditions$;

CREATE SCHEMA aifinder_storage_private AUTHORIZATION postgres;
COMMENT ON SCHEMA aifinder_storage_private IS
  'AIFINDER_STORAGE_CAS_V1 exact-version cleanup capability boundary';
REVOKE ALL ON SCHEMA aifinder_storage_private
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE aifinder_storage_private.cleanup_grants (
  grant_id uuid PRIMARY KEY,
  phase_id text NOT NULL
    CHECK (phase_id = '34IA-34IZ'),
  runtime_session_id uuid NOT NULL,
  bucket_id text NOT NULL
    CHECK (bucket_id = 'tool-logos'),
  object_name text NOT NULL
    CHECK (
      object_name ~ '^admin/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](png|jpg|webp)$'
    ),
  token_hash text NOT NULL UNIQUE
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expected_version text NOT NULL
    CHECK (length(expected_version) BETWEEN 1 AND 1024),
  expected_etag text
    CHECK (
      expected_etag IS NULL
      OR length(expected_etag) BETWEEN 1 AND 1024
    ),
  expected_size bigint
    CHECK (expected_size IS NULL OR expected_size >= 0),
  expected_mime_type text
    CHECK (
      expected_mime_type IS NULL
      OR expected_mime_type IN ('image/png', 'image/jpeg', 'image/webp')
    ),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT cleanup_grants_exact_path_unique
    UNIQUE (bucket_id, object_name),
  CONSTRAINT cleanup_grants_ttl_bounded
    CHECK (
      expires_at >= created_at + interval '60 seconds'
      AND expires_at <= created_at + interval '900 seconds'
    )
);

ALTER TABLE aifinder_storage_private.cleanup_grants OWNER TO postgres;
ALTER TABLE aifinder_storage_private.cleanup_grants ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE aifinder_storage_private.cleanup_grants IS
  'AIFINDER_STORAGE_CAS_V1 token hashes and immutable exact-object grants only';
REVOKE ALL ON TABLE aifinder_storage_private.cleanup_grants
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  p_phase_id text,
  p_runtime_session_id uuid,
  p_bucket_id text,
  p_object_name text,
  p_grant_id uuid,
  p_token_hash text,
  p_expected_version text,
  p_expected_etag text,
  p_expected_size bigint,
  p_expected_mime_type text,
  p_ttl_seconds integer
)
RETURNS TABLE (
  grant_id uuid,
  expected_version text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $aifinder_prepare_storage_cleanup_grant$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_current_version text;
  v_current_metadata jsonb;
  v_existing aifinder_storage_private.cleanup_grants%ROWTYPE;
BEGIN
  IF p_phase_id <> '34IA-34IZ'
    OR p_runtime_session_id IS NULL
    OR p_bucket_id <> 'tool-logos'
    OR p_object_name !~ '^admin/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](png|jpg|webp)$'
    OR p_grant_id IS NULL
    OR p_token_hash !~ '^[0-9a-f]{64}$'
    OR p_expected_version IS NULL
    OR length(p_expected_version) NOT BETWEEN 1 AND 1024
    OR p_ttl_seconds IS NULL
    OR p_ttl_seconds NOT BETWEEN 60 AND 900
    OR (
      p_expected_etag IS NOT NULL
      AND length(p_expected_etag) NOT BETWEEN 1 AND 1024
    )
    OR (p_expected_size IS NOT NULL AND p_expected_size < 0)
    OR (
      p_expected_mime_type IS NOT NULL
      AND p_expected_mime_type NOT IN (
        'image/png',
        'image/jpeg',
        'image/webp'
      )
    )
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_GRANT_INPUT_DENIED';
  END IF;

  SELECT
    object_row.version::text,
    object_row.metadata
    INTO v_current_version, v_current_metadata
  FROM storage.objects AS object_row
  WHERE object_row.bucket_id = p_bucket_id
    AND object_row.name = p_object_name
  FOR UPDATE;

  IF NOT FOUND
    OR v_current_version IS NULL
    OR length(v_current_version) = 0
    OR v_current_version <> p_expected_version
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_VERSION_MISMATCH';
  END IF;

  IF p_expected_etag IS NOT NULL
    AND COALESCE(v_current_metadata ->> 'eTag', '') <> p_expected_etag
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ETAG_MISMATCH';
  END IF;

  IF p_expected_size IS NOT NULL
    AND NOT (
      CASE
        WHEN COALESCE(v_current_metadata ->> 'size', '') ~ '^[0-9]+$'
          THEN (v_current_metadata ->> 'size')::numeric = p_expected_size
        ELSE false
      END
    )
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_SIZE_MISMATCH';
  END IF;

  IF p_expected_mime_type IS NOT NULL
    AND COALESCE(
      v_current_metadata ->> 'mimetype',
      v_current_metadata ->> 'mime_type',
      ''
    ) <> p_expected_mime_type
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_MIME_TYPE_MISMATCH';
  END IF;

  DELETE FROM aifinder_storage_private.cleanup_grants AS stale
  WHERE stale.bucket_id = p_bucket_id
    AND stale.object_name = p_object_name
    AND stale.expires_at <= v_now;

  SELECT existing.*
    INTO v_existing
  FROM aifinder_storage_private.cleanup_grants AS existing
  WHERE existing.bucket_id = p_bucket_id
    AND existing.object_name = p_object_name
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.grant_id = p_grant_id
      AND v_existing.phase_id = p_phase_id
      AND v_existing.runtime_session_id = p_runtime_session_id
      AND v_existing.token_hash = p_token_hash
      AND v_existing.expected_version = v_current_version
      AND v_existing.expected_etag IS NOT DISTINCT FROM p_expected_etag
      AND v_existing.expected_size IS NOT DISTINCT FROM p_expected_size
      AND v_existing.expected_mime_type IS NOT DISTINCT FROM p_expected_mime_type
      AND v_existing.expires_at = v_existing.created_at +
        pg_catalog.make_interval(secs => p_ttl_seconds)
      AND v_existing.expires_at > v_now
    THEN
      RETURN QUERY
      SELECT
        v_existing.grant_id,
        v_existing.expected_version,
        v_existing.expires_at;
      RETURN;
    END IF;
    RAISE EXCEPTION 'STORAGE_CLEANUP_DUPLICATE_ACTIVE_GRANT';
  END IF;

  INSERT INTO aifinder_storage_private.cleanup_grants (
    grant_id,
    phase_id,
    runtime_session_id,
    bucket_id,
    object_name,
    token_hash,
    expected_version,
    expected_etag,
    expected_size,
    expected_mime_type,
    created_at,
    expires_at
  ) VALUES (
    p_grant_id,
    p_phase_id,
    p_runtime_session_id,
    p_bucket_id,
    p_object_name,
    p_token_hash,
    v_current_version,
    p_expected_etag,
    p_expected_size,
    p_expected_mime_type,
    v_now,
    v_now + pg_catalog.make_interval(secs => p_ttl_seconds)
  );

  RETURN QUERY
  SELECT
    created.grant_id,
    created.expected_version,
    created.expires_at
  FROM aifinder_storage_private.cleanup_grants AS created
  WHERE created.grant_id = p_grant_id;
END
$aifinder_prepare_storage_cleanup_grant$;

ALTER FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
) OWNER TO postgres;
COMMENT ON FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
) IS 'AIFINDER_STORAGE_CAS_V1 exact service-role grant preparation';
REVOKE EXECUTE ON FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
) TO service_role;

CREATE FUNCTION public.aifinder_revoke_storage_cleanup_grant(
  p_grant_id uuid,
  p_token_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $aifinder_revoke_storage_cleanup_grant$
DECLARE
  v_deleted integer;
BEGIN
  IF p_grant_id IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  DELETE FROM aifinder_storage_private.cleanup_grants AS grant_row
  WHERE grant_row.grant_id = p_grant_id
    AND grant_row.token_hash = p_token_hash;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted = 1 OR (
    v_deleted = 0
    AND NOT EXISTS (
      SELECT 1
      FROM aifinder_storage_private.cleanup_grants AS remaining
      WHERE remaining.grant_id = p_grant_id
        OR remaining.token_hash = p_token_hash
    )
  );
END
$aifinder_revoke_storage_cleanup_grant$;

ALTER FUNCTION public.aifinder_revoke_storage_cleanup_grant(uuid, text)
  OWNER TO postgres;
COMMENT ON FUNCTION public.aifinder_revoke_storage_cleanup_grant(uuid, text) IS
  'AIFINDER_STORAGE_CAS_V1 exact service-role grant revocation';
REVOKE EXECUTE ON FUNCTION public.aifinder_revoke_storage_cleanup_grant(
  uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aifinder_revoke_storage_cleanup_grant(
  uuid, text
) TO service_role;

CREATE FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  p_bucket_id text,
  p_object_name text,
  p_object_version text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $aifinder_authorize_cleanup_delete$
DECLARE
  v_headers jsonb;
  v_raw_token text;
  v_token_hash text;
  v_match_count integer;
BEGIN
  BEGIN
    IF p_bucket_id <> 'tool-logos'
      OR p_object_name !~ '^admin/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](png|jpg|webp)$'
      OR p_object_version IS NULL
      OR length(p_object_version) = 0
      OR current_setting('request.method', true) <> 'DELETE'
      OR current_setting('storage.operation', true) <>
        'storage.object.delete_many'
    THEN
      RETURN false;
    END IF;

    v_headers := COALESCE(
      NULLIF(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
    v_raw_token :=
      v_headers ->> 'x-aifinder-storage-cleanup-token';
    IF v_raw_token IS NULL OR v_raw_token !~ '^[0-9a-f]{64}$' THEN
      RETURN false;
    END IF;

    v_token_hash := pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(v_raw_token, 'UTF8'),
        'sha256'
      ),
      'hex'
    );
    v_raw_token := NULL;

    SELECT count(*)
      INTO v_match_count
    FROM aifinder_storage_private.cleanup_grants AS grant_row
    WHERE grant_row.bucket_id = p_bucket_id
      AND grant_row.object_name = p_object_name
      AND grant_row.expected_version = p_object_version
      AND grant_row.token_hash = v_token_hash
      AND grant_row.created_at <= statement_timestamp()
      AND grant_row.expires_at > statement_timestamp();

    RETURN v_match_count = 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END
$aifinder_authorize_cleanup_delete$;

ALTER FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
) OWNER TO postgres;
COMMENT ON FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
) IS 'AIFINDER_STORAGE_CAS_V1 fail-closed exact-version DELETE validator';
REVOKE EXECUTE ON FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
) FROM PUBLIC, authenticated, service_role;
GRANT USAGE ON SCHEMA aifinder_storage_private TO anon;
GRANT EXECUTE ON FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
) TO anon;

CREATE POLICY "AiFinder exact-version cleanup restriction"
ON storage.objects
AS RESTRICTIVE
FOR DELETE
TO anon
USING (
  (bucket_id <> 'tool-logos'::text)
  OR aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)
);
COMMENT ON POLICY "AiFinder exact-version cleanup restriction"
ON storage.objects IS
  'AIFINDER_STORAGE_CAS_V1 preserves the direct-delete deny except for an exact capability';

ALTER POLICY "Deny direct public logo deletes"
ON storage.objects
TO authenticated
USING (bucket_id <> 'tool-logos'::text);

CREATE POLICY "AiFinder exact-version cleanup"
ON storage.objects
FOR DELETE
TO anon
USING (
  aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)
);
COMMENT ON POLICY "AiFinder exact-version cleanup" ON storage.objects IS
  'AIFINDER_STORAGE_CAS_V1 anon exact-version capability DELETE only';

CREATE POLICY "AiFinder exact-version cleanup visibility"
ON storage.objects
FOR SELECT
TO anon
USING (
  aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)
);
COMMENT ON POLICY "AiFinder exact-version cleanup visibility"
ON storage.objects IS
  'AIFINDER_STORAGE_CAS_V1 DELETE RETURNING visibility under the same exact capability only';

DO $aifinder_catalog_seals$
DECLARE
  v_constraint record;
  v_definition text;
  v_policy record;
  v_policy_signature text;
BEGIN
  FOR v_constraint IN
    SELECT constraint_row.oid, constraint_row.conname
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid =
      'aifinder_storage_private.cleanup_grants'::regclass
    ORDER BY constraint_row.conname
  LOOP
    v_definition := pg_catalog.pg_get_constraintdef(
      v_constraint.oid,
      false
    );
    EXECUTE pg_catalog.format(
      'COMMENT ON CONSTRAINT %I ON aifinder_storage_private.cleanup_grants IS %L',
      v_constraint.conname,
      'AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_definition, 'UTF8'),
            'sha256'
          ),
          'hex'
        )
    );
  END LOOP;

  SELECT pg_catalog.pg_get_functiondef(
    'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'::regprocedure
  ) INTO STRICT v_definition;
  EXECUTE pg_catalog.format(
    'COMMENT ON FUNCTION public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer) IS %L',
    'AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
      pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(v_definition, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
  );

  SELECT pg_catalog.pg_get_functiondef(
    'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'::regprocedure
  ) INTO STRICT v_definition;
  EXECUTE pg_catalog.format(
    'COMMENT ON FUNCTION public.aifinder_revoke_storage_cleanup_grant(uuid,text) IS %L',
    'AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
      pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(v_definition, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
  );

  SELECT pg_catalog.pg_get_functiondef(
    'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'::regprocedure
  ) INTO STRICT v_definition;
  EXECUTE pg_catalog.format(
    'COMMENT ON FUNCTION aifinder_storage_private.authorize_cleanup_delete(text,text,text) IS %L',
    'AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
      pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(v_definition, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
  );

  FOR v_policy IN
    SELECT policy.oid, policy.polname
    FROM pg_catalog.pg_policy AS policy
    WHERE policy.polrelid = 'storage.objects'::regclass
      AND policy.polname IN (
        'AiFinder exact-version cleanup',
        'AiFinder exact-version cleanup restriction',
        'AiFinder exact-version cleanup visibility'
      )
    ORDER BY policy.polname
  LOOP
    SELECT pg_catalog.concat_ws(
      E'\n',
      'command=' || policy.polcmd::text,
      'permissive=' || policy.polpermissive::text,
      'roles=' || policy.polroles::text,
      'using=' || pg_catalog.pg_get_expr(
        policy.polqual,
        policy.polrelid
      ),
      'with_check=' || COALESCE(
        pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
        '<null>'
      )
    ) INTO STRICT v_policy_signature
    FROM pg_catalog.pg_policy AS policy
    WHERE policy.oid = v_policy.oid;
    EXECUTE pg_catalog.format(
      'COMMENT ON POLICY %I ON storage.objects IS %L',
      v_policy.polname,
      'AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_policy_signature, 'UTF8'),
            'sha256'
          ),
          'hex'
        )
    );
  END LOOP;
END
$aifinder_catalog_seals$;
