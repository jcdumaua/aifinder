-- AiFinder Phase 34IA-34IZ Storage CAS v1 rollback candidate.
-- DRAFT ONLY. This file is inert by construction and is not approved for execution.

DO $aifinder_draft_guard$
BEGIN
  RAISE EXCEPTION USING
    MESSAGE = 'AIFINDER_DRAFT_ONLY: independent review and explicit execution authorization required';
END
$aifinder_draft_guard$;

DO $aifinder_rollback_preconditions$
DECLARE
  v_policy_expression text;
  v_policy_with_check text;
  v_policy_comment text;
  v_policy_signature text;
  v_policy_roles oid[];
  v_anon_oid oid;
  v_authenticated_oid oid;
  v_service_role_oid oid;
  v_postgres_oid oid;
  v_prepare_definition text;
  v_revoke_definition text;
  v_validator_definition text;
BEGIN
  IF to_regnamespace('aifinder_storage_private') IS NULL
    OR to_regclass('aifinder_storage_private.cleanup_grants') IS NULL
    OR to_regprocedure(
      'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'
    ) IS NULL
    OR to_regprocedure(
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'
    ) IS NULL
    OR to_regprocedure(
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'
    ) IS NULL
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_policy AS policy
      WHERE policy.polrelid = 'storage.objects'::regclass
        AND policy.polname IN (
          'AiFinder exact-version cleanup',
          'AiFinder exact-version cleanup restriction',
          'AiFinder exact-version cleanup visibility'
        )
    ) <> 3
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_OBJECT_SET_DRIFT';
  END IF;

  SELECT role.oid INTO STRICT v_anon_oid
  FROM pg_catalog.pg_roles AS role WHERE role.rolname = 'anon';
  SELECT role.oid INTO STRICT v_authenticated_oid
  FROM pg_catalog.pg_roles AS role WHERE role.rolname = 'authenticated';
  SELECT role.oid INTO STRICT v_service_role_oid
  FROM pg_catalog.pg_roles AS role WHERE role.rolname = 'service_role';
  SELECT role.oid INTO STRICT v_postgres_oid
  FROM pg_catalog.pg_roles AS role WHERE role.rolname = 'postgres';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_namespace AS namespace
    WHERE namespace.oid = 'aifinder_storage_private'::regnamespace
      AND namespace.nspowner = v_postgres_oid
  )
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class AS relation
      WHERE relation.oid =
        'aifinder_storage_private.cleanup_grants'::regclass
        AND relation.relkind = 'r'
        AND relation.relowner = v_postgres_oid
        AND relation.relrowsecurity
        AND NOT relation.relforcerowsecurity
    )
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_proc AS procedure
      WHERE procedure.pronamespace =
        'aifinder_storage_private'::regnamespace
    ) <> 1
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_proc AS procedure
      JOIN pg_catalog.pg_namespace AS namespace
        ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = 'public'
        AND procedure.proname IN (
          'aifinder_prepare_storage_cleanup_grant',
          'aifinder_revoke_storage_cleanup_grant'
        )
    ) <> 2
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_class AS relation
      WHERE relation.relnamespace =
        'aifinder_storage_private'::regnamespace
        AND relation.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
    ) <> 1
    OR (
      SELECT pg_catalog.array_agg(
        relation.relname || ':' || relation.relkind::text
        ORDER BY relation.relname
      )
      FROM pg_catalog.pg_class AS relation
      WHERE relation.relnamespace =
        'aifinder_storage_private'::regnamespace
    ) <> ARRAY[
      'cleanup_grants:r',
      'cleanup_grants_exact_path_unique:i',
      'cleanup_grants_pkey:i',
      'cleanup_grants_token_hash_key:i'
    ]::text[]
    OR (
      SELECT pg_catalog.array_agg(
        type_row.typname::text
        ORDER BY type_row.typname
      )
      FROM pg_catalog.pg_type AS type_row
      WHERE type_row.typnamespace =
        'aifinder_storage_private'::regnamespace
    ) <> ARRAY['_cleanup_grants', 'cleanup_grants']::text[]
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy AS policy
      WHERE policy.polrelid =
        'aifinder_storage_private.cleanup_grants'::regclass
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_trigger AS trigger_row
      WHERE trigger_row.tgrelid =
        'aifinder_storage_private.cleanup_grants'::regclass
        AND NOT trigger_row.tgisinternal
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_rewrite AS rewrite_rule
      WHERE rewrite_rule.ev_class =
        'aifinder_storage_private.cleanup_grants'::regclass
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_inherits AS inheritance
      WHERE inheritance.inhrelid =
          'aifinder_storage_private.cleanup_grants'::regclass
        OR inheritance.inhparent =
          'aifinder_storage_private.cleanup_grants'::regclass
    )
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_PRIVATE_OBJECT_SET_DRIFT';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aifinder_storage_private.cleanup_grants
  ) THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_NONEMPTY_GRANT_TABLE';
  END IF;

  IF pg_catalog.obj_description(
    'aifinder_storage_private'::regnamespace,
    'pg_namespace'
  ) <> 'AIFINDER_STORAGE_CAS_V1 exact-version cleanup capability boundary'
    OR pg_catalog.obj_description(
      'aifinder_storage_private.cleanup_grants'::regclass,
      'pg_class'
    ) <> 'AIFINDER_STORAGE_CAS_V1 token hashes and immutable exact-object grants only'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_PRIVATE_OBJECT_DRIFT';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_catalog.pg_attribute AS attribute
    WHERE attribute.attrelid =
      'aifinder_storage_private.cleanup_grants'::regclass
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  ) <> 12 THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_TABLE_DEFINITION_DRIFT';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('grant_id', 'uuid', true),
        ('phase_id', 'text', true),
        ('runtime_session_id', 'uuid', true),
        ('bucket_id', 'text', true),
        ('object_name', 'text', true),
        ('token_hash', 'text', true),
        ('expected_version', 'text', true),
        ('expected_etag', 'text', false),
        ('expected_size', 'bigint', false),
        ('expected_mime_type', 'text', false),
        ('created_at', 'timestamp with time zone', true),
        ('expires_at', 'timestamp with time zone', true)
    ) AS expected(attname, formatted_type, attnotnull)
    LEFT JOIN pg_catalog.pg_attribute AS attribute
      ON attribute.attrelid =
        'aifinder_storage_private.cleanup_grants'::regclass
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
      AND attribute.attname = expected.attname
    WHERE attribute.attname IS NULL
      OR pg_catalog.format_type(
        attribute.atttypid,
        attribute.atttypmod
      ) <> expected.formatted_type
      OR attribute.attnotnull <> expected.attnotnull
      OR attribute.atthasdef
      OR attribute.attidentity <> ''
      OR attribute.attgenerated <> ''
  ) THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_COLUMN_DEFINITION_DRIFT';
  END IF;

  IF (
    SELECT pg_catalog.array_agg(
      constraint_row.conname || ':' || constraint_row.contype::text
      ORDER BY constraint_row.conname
    )
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid =
      'aifinder_storage_private.cleanup_grants'::regclass
      AND constraint_row.contype <> 'n'::"char"
  ) <> ARRAY[
    'cleanup_grants_bucket_id_check:c',
    'cleanup_grants_exact_path_unique:u',
    'cleanup_grants_expected_etag_check:c',
    'cleanup_grants_expected_mime_type_check:c',
    'cleanup_grants_expected_size_check:c',
    'cleanup_grants_expected_version_check:c',
    'cleanup_grants_object_name_check:c',
    'cleanup_grants_phase_id_check:c',
    'cleanup_grants_pkey:p',
    'cleanup_grants_token_hash_check:c',
    'cleanup_grants_token_hash_key:u',
    'cleanup_grants_ttl_bounded:c'
  ]::text[]
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_index AS index_row
      WHERE index_row.indrelid =
        'aifinder_storage_private.cleanup_grants'::regclass
    ) <> 3
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_CONSTRAINT_DEFINITION_DRIFT';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid =
      'aifinder_storage_private.cleanup_grants'::regclass
      AND pg_catalog.obj_description(
        constraint_row.oid,
        'pg_constraint'
      ) IS DISTINCT FROM
        ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
          pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(
                pg_catalog.pg_get_constraintdef(
                  constraint_row.oid,
                  false
                ),
                'UTF8'
              ),
              'sha256'
            ),
            'hex'
          ))
  ) THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_CONSTRAINT_SEAL_DRIFT';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
    'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'::regprocedure
  ) INTO STRICT v_prepare_definition;
  SELECT pg_catalog.pg_get_functiondef(
    'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'::regprocedure
  ) INTO STRICT v_revoke_definition;
  SELECT pg_catalog.pg_get_functiondef(
    'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'::regprocedure
  ) INTO STRICT v_validator_definition;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        (
          'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'::regprocedure,
          'v'::"char",
          'record'::regtype,
          true
        ),
        (
          'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'::regprocedure,
          'v'::"char",
          'boolean'::regtype,
          false
        ),
        (
          'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'::regprocedure,
          's'::"char",
          'boolean'::regtype,
          false
        )
    ) AS expected(procedure_oid, volatility, return_type, returns_set)
    JOIN pg_catalog.pg_proc AS procedure
      ON procedure.oid = expected.procedure_oid
    WHERE procedure.proowner <> v_postgres_oid
      OR NOT procedure.prosecdef
      OR procedure.prokind <> 'f'
      OR procedure.provolatile <> expected.volatility
      OR procedure.prorettype <> expected.return_type
      OR procedure.proretset <> expected.returns_set
      OR procedure.proleakproof
      OR procedure.proisstrict
      OR procedure.proparallel <> 'u'::"char"
      OR procedure.pronargdefaults <> 0
      OR procedure.provariadic <> 0
      OR procedure.proconfig IS DISTINCT FROM
        ARRAY['search_path=pg_catalog']::text[]
      OR procedure.prolang <> (
        SELECT language.oid
        FROM pg_catalog.pg_language AS language
        WHERE language.lanname = 'plpgsql'
      )
  ) THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_FUNCTION_CATALOG_DRIFT';
  END IF;

  IF pg_catalog.obj_description(
    'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'::regprocedure,
    'pg_proc'
  ) IS DISTINCT FROM
    ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
      pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(v_prepare_definition, 'UTF8'),
          'sha256'
        ),
        'hex'
      ))
    OR pg_catalog.obj_description(
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'::regprocedure,
      'pg_proc'
    ) IS DISTINCT FROM
      ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_revoke_definition, 'UTF8'),
            'sha256'
          ),
          'hex'
        ))
    OR pg_catalog.obj_description(
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'::regprocedure,
      'pg_proc'
    ) IS DISTINCT FROM
      ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_validator_definition, 'UTF8'),
            'sha256'
          ),
          'hex'
        ))
    OR v_prepare_definition NOT LIKE '%SECURITY DEFINER%'
    OR v_prepare_definition NOT LIKE '%FOR UPDATE%'
    OR v_prepare_definition NOT LIKE '%p_expected_version IS NULL%'
    OR v_prepare_definition NOT LIKE '%v_current_version <> p_expected_version%'
    OR v_prepare_definition NOT LIKE '%STORAGE_CLEANUP_DUPLICATE_ACTIVE_GRANT%'
    OR v_prepare_definition LIKE '%DELETE FROM storage.objects%'
    OR v_revoke_definition NOT LIKE '%SECURITY DEFINER%'
    OR v_revoke_definition NOT LIKE
      '%DELETE FROM aifinder_storage_private.cleanup_grants%'
    OR v_revoke_definition NOT LIKE '%grant_row.grant_id = p_grant_id%'
    OR v_revoke_definition NOT LIKE '%grant_row.token_hash = p_token_hash%'
    OR v_revoke_definition NOT LIKE '%remaining.grant_id = p_grant_id%'
    OR v_revoke_definition NOT LIKE '%remaining.token_hash = p_token_hash%'
    OR v_revoke_definition LIKE '%storage.objects%'
    OR v_validator_definition NOT LIKE '%SECURITY DEFINER%'
    OR v_validator_definition NOT LIKE '%storage.object.delete_many%'
    OR v_validator_definition NOT LIKE '%x-aifinder-storage-cleanup-token%'
    OR v_validator_definition NOT LIKE
      '%grant_row.expected_version = p_object_version%'
    OR v_validator_definition NOT LIKE '%v_match_count = 1%'
    OR v_validator_definition NOT LIKE '%EXCEPTION WHEN OTHERS%'
    OR v_validator_definition LIKE
      '%DELETE FROM aifinder_storage_private.cleanup_grants%'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_FUNCTION_DEFINITION_DRIFT';
  END IF;

  SELECT
    pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
    pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
    pg_catalog.obj_description(policy.oid, 'pg_policy'),
    policy.polroles,
    pg_catalog.concat_ws(
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
    )
  INTO STRICT
    v_policy_expression,
    v_policy_with_check,
    v_policy_comment,
    v_policy_roles,
    v_policy_signature
  FROM pg_catalog.pg_policy AS policy
  WHERE policy.polrelid = 'storage.objects'::regclass
    AND policy.polname = 'AiFinder exact-version cleanup'
    AND policy.polcmd = 'd'
    AND policy.polpermissive;

  IF v_policy_roles <> ARRAY[v_anon_oid]::oid[]
    OR v_policy_with_check IS NOT NULL
    OR v_policy_comment IS DISTINCT FROM
      ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_policy_signature, 'UTF8'),
            'sha256'
          ),
          'hex'
        ))
    OR v_policy_expression IS DISTINCT FROM
      'aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_POLICY_DEFINITION_DRIFT';
  END IF;

  SELECT
    pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
    pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
    pg_catalog.obj_description(policy.oid, 'pg_policy'),
    policy.polroles,
    pg_catalog.concat_ws(
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
    )
  INTO STRICT
    v_policy_expression,
    v_policy_with_check,
    v_policy_comment,
    v_policy_roles,
    v_policy_signature
  FROM pg_catalog.pg_policy AS policy
  WHERE policy.polrelid = 'storage.objects'::regclass
    AND policy.polname = 'AiFinder exact-version cleanup restriction'
    AND policy.polcmd = 'd'
    AND NOT policy.polpermissive;

  IF v_policy_roles <> ARRAY[v_anon_oid]::oid[]
    OR v_policy_with_check IS NOT NULL
    OR v_policy_comment IS DISTINCT FROM
      ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_policy_signature, 'UTF8'),
            'sha256'
          ),
          'hex'
        ))
    OR v_policy_expression IS DISTINCT FROM
      '((bucket_id <> ''tool-logos''::text) OR aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version))'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_RESTRICTION_POLICY_DEFINITION_DRIFT';
  END IF;

  SELECT
    pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
    pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
    pg_catalog.obj_description(policy.oid, 'pg_policy'),
    policy.polroles,
    pg_catalog.concat_ws(
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
    )
  INTO STRICT
    v_policy_expression,
    v_policy_with_check,
    v_policy_comment,
    v_policy_roles,
    v_policy_signature
  FROM pg_catalog.pg_policy AS policy
  WHERE policy.polrelid = 'storage.objects'::regclass
    AND policy.polname = 'AiFinder exact-version cleanup visibility'
    AND policy.polcmd = 'r'
    AND policy.polpermissive;

  IF v_policy_roles <> ARRAY[v_anon_oid]::oid[]
    OR v_policy_with_check IS NOT NULL
    OR v_policy_comment IS DISTINCT FROM
      ('AIFINDER_STORAGE_CAS_V1 definition_sha256=' ||
        pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(v_policy_signature, 'UTF8'),
            'sha256'
          ),
          'hex'
        ))
    OR v_policy_expression IS DISTINCT FROM
      'aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_VISIBILITY_POLICY_DEFINITION_DRIFT';
  END IF;

  SELECT
    pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
    pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
    pg_catalog.obj_description(policy.oid, 'pg_policy'),
    policy.polroles
  INTO STRICT
    v_policy_expression,
    v_policy_with_check,
    v_policy_comment,
    v_policy_roles
  FROM pg_catalog.pg_policy AS policy
  WHERE policy.polrelid = 'storage.objects'::regclass
    AND policy.polname = 'Deny direct public logo deletes'
    AND policy.polcmd = 'd'
    AND NOT policy.polpermissive;

  IF v_policy_roles <> ARRAY[v_authenticated_oid]::oid[]
    OR v_policy_with_check IS NOT NULL
    OR v_policy_comment IS NOT NULL
    OR v_policy_expression IS DISTINCT FROM
      '(bucket_id <> ''tool-logos''::text)'
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_PLATFORM_RESTRICTION_POLICY_DRIFT';
  END IF;

  IF NOT pg_catalog.has_schema_privilege(
    'anon',
    'aifinder_storage_private',
    'USAGE'
  )
    OR pg_catalog.has_schema_privilege(
      'authenticated',
      'aifinder_storage_private',
      'USAGE'
    )
    OR pg_catalog.has_schema_privilege(
      'service_role',
      'aifinder_storage_private',
      'USAGE'
    )
    OR EXISTS (
      SELECT 1
      FROM (
        VALUES ('anon'), ('authenticated'), ('service_role')
      ) AS checked_role(role_name)
      CROSS JOIN (
        VALUES
          ('SELECT'),
          ('INSERT'),
          ('UPDATE'),
          ('DELETE'),
          ('TRUNCATE'),
          ('REFERENCES'),
          ('TRIGGER')
      ) AS checked_privilege(privilege_name)
      WHERE pg_catalog.has_table_privilege(
        checked_role.role_name,
        'aifinder_storage_private.cleanup_grants',
        checked_privilege.privilege_name
      )
    )
    OR NOT pg_catalog.has_function_privilege(
      'anon',
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'authenticated',
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'service_role',
      'aifinder_storage_private.authorize_cleanup_delete(text,text,text)',
      'EXECUTE'
    )
    OR NOT pg_catalog.has_function_privilege(
      'service_role',
      'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'anon',
      'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'authenticated',
      'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)',
      'EXECUTE'
    )
    OR NOT pg_catalog.has_function_privilege(
      'service_role',
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'anon',
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)',
      'EXECUTE'
    )
    OR pg_catalog.has_function_privilege(
      'authenticated',
      'public.aifinder_revoke_storage_cleanup_grant(uuid,text)',
      'EXECUTE'
    )
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_PRIVILEGE_DRIFT';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_catalog.pg_namespace AS namespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(
        namespace.nspacl,
        pg_catalog.acldefault('n', namespace.nspowner)
      )
    ) AS acl
    WHERE namespace.oid = 'aifinder_storage_private'::regnamespace
  ) <> 3
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_namespace AS namespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(
        COALESCE(
          namespace.nspacl,
          pg_catalog.acldefault('n', namespace.nspowner)
        )
      ) AS acl
      WHERE namespace.oid = 'aifinder_storage_private'::regnamespace
        AND (
          acl.grantor <> v_postgres_oid
          OR acl.is_grantable
          OR NOT (
            (
              acl.grantee = v_postgres_oid
              AND acl.privilege_type IN ('CREATE', 'USAGE')
            )
            OR (
              acl.grantee = v_anon_oid
              AND acl.privilege_type = 'USAGE'
            )
          )
        )
    )
    OR (
      SELECT count(*)
      FROM pg_catalog.pg_class AS relation
      CROSS JOIN LATERAL pg_catalog.aclexplode(
        COALESCE(
          relation.relacl,
          pg_catalog.acldefault('r', relation.relowner)
        )
      ) AS acl
      WHERE relation.oid =
        'aifinder_storage_private.cleanup_grants'::regclass
    ) <> (
      SELECT count(*)
      FROM pg_catalog.aclexplode(
        pg_catalog.acldefault('r', v_postgres_oid)
      ) AS expected_acl
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class AS relation
      CROSS JOIN LATERAL pg_catalog.aclexplode(
        COALESCE(
          relation.relacl,
          pg_catalog.acldefault('r', relation.relowner)
        )
      ) AS acl
      WHERE relation.oid =
        'aifinder_storage_private.cleanup_grants'::regclass
        AND (
          acl.grantor <> v_postgres_oid
          OR acl.grantee <> v_postgres_oid
          OR acl.is_grantable
          OR NOT EXISTS (
            SELECT 1
            FROM pg_catalog.aclexplode(
              pg_catalog.acldefault('r', v_postgres_oid)
            ) AS expected_acl
            WHERE expected_acl.grantor = v_postgres_oid
              AND expected_acl.grantee = v_postgres_oid
              AND expected_acl.privilege_type = acl.privilege_type
              AND expected_acl.is_grantable = acl.is_grantable
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM (
        VALUES
          (
            'public.aifinder_prepare_storage_cleanup_grant(text,uuid,text,text,uuid,text,text,text,bigint,text,integer)'::regprocedure,
            v_service_role_oid
          ),
          (
            'public.aifinder_revoke_storage_cleanup_grant(uuid,text)'::regprocedure,
            v_service_role_oid
          ),
          (
            'aifinder_storage_private.authorize_cleanup_delete(text,text,text)'::regprocedure,
            v_anon_oid
          )
      ) AS expected(procedure_oid, caller_oid)
      JOIN pg_catalog.pg_proc AS procedure
        ON procedure.oid = expected.procedure_oid
      WHERE (
        SELECT count(*)
        FROM pg_catalog.aclexplode(
          COALESCE(
            procedure.proacl,
            pg_catalog.acldefault('f', procedure.proowner)
          )
        ) AS acl
      ) <> 2
        OR EXISTS (
          SELECT 1
          FROM pg_catalog.aclexplode(
            COALESCE(
              procedure.proacl,
              pg_catalog.acldefault('f', procedure.proowner)
            )
          ) AS acl
          WHERE acl.grantor <> v_postgres_oid
            OR acl.is_grantable
            OR acl.privilege_type <> 'EXECUTE'
            OR acl.grantee NOT IN (
              v_postgres_oid,
              expected.caller_oid
            )
        )
    )
  THEN
    RAISE EXCEPTION 'STORAGE_CLEANUP_ROLLBACK_ACL_DEFINITION_DRIFT';
  END IF;
END
$aifinder_rollback_preconditions$;

ALTER POLICY "Deny direct public logo deletes"
ON storage.objects
TO anon, authenticated
USING (bucket_id <> 'tool-logos'::text);

DROP POLICY "AiFinder exact-version cleanup restriction" ON storage.objects;
DROP POLICY "AiFinder exact-version cleanup" ON storage.objects;
DROP POLICY "AiFinder exact-version cleanup visibility" ON storage.objects;

REVOKE EXECUTE ON FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
) FROM anon;
REVOKE USAGE ON SCHEMA aifinder_storage_private FROM anon;
REVOKE EXECUTE ON FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.aifinder_revoke_storage_cleanup_grant(
  uuid, text
) FROM service_role;

DROP FUNCTION public.aifinder_prepare_storage_cleanup_grant(
  text, uuid, text, text, uuid, text, text, text, bigint, text, integer
);
DROP FUNCTION public.aifinder_revoke_storage_cleanup_grant(uuid, text);
DROP FUNCTION aifinder_storage_private.authorize_cleanup_delete(
  text, text, text
);
DROP TABLE aifinder_storage_private.cleanup_grants;
DROP SCHEMA aifinder_storage_private;
