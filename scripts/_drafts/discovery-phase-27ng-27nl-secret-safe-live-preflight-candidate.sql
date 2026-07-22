-- Inert review candidate; a reviewed wrapper supplies the three activation variables.
\set ON_ERROR_STOP on
\if :{?AIFINDER_REVIEWED_WRAPPER}
\else
\quit 3
\endif
\if :{?AIFINDER_SECRET_SAFE_LIVE_PREFLIGHT_ACTIVATED}
\else
\quit 3
\endif
\if :{?AIFINDER_TARGET_ENVIRONMENT_CLASSIFICATION}
\else
\quit 3
\endif

SELECT (
  :'AIFINDER_REVIEWED_WRAPPER' = 'PHASE_27NG_27NL_REVIEWED_WRAPPER'
  AND :'AIFINDER_SECRET_SAFE_LIVE_PREFLIGHT_ACTIVATED'
    = 'PHASE_27NG_27NL_ONE_USE_AUTHORIZATION_CONSUMED'
  AND :'AIFINDER_TARGET_ENVIRONMENT_CLASSIFICATION'
    IN ('LOCAL', 'PREVIEW', 'STAGING', 'PRODUCTION')
) AS aifinder_preflight_activation_valid \gset
\if :aifinder_preflight_activation_valid
\else
\quit 3
\endif

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '2s';
SET LOCAL idle_in_transaction_session_timeout = '10s';
SET LOCAL search_path = pg_catalog;

WITH expected_relations(relname) AS (
  VALUES
    ('admin_audit_archives'), ('admin_audit_logs'), ('discovered_tools'),
    ('discovery_audit_events'), ('discovery_candidate_preview_artifacts'),
    ('discovery_candidate_tools'), ('discovery_duplicate_candidates'),
    ('discovery_evidence'), ('discovery_runs'), ('discovery_sources'),
    ('homepage_control_audit_events'), ('homepage_control_checklist_runs'),
    ('homepage_control_configs'), ('submitted_tools'), ('tools')
), expected_relation_rls(relname, expected_relrowsecurity, expected_relforcerowsecurity) AS (
  SELECT relname, true, false
  FROM expected_relations
), reviewed_policy_role_oids AS (
  SELECT
    ARRAY[0::oid] AS public_only_roles,
    ARRAY[(SELECT r.oid FROM pg_catalog.pg_roles AS r WHERE r.rolname = 'anon')]::oid[] AS anon_only_roles,
    EXISTS (SELECT 1 FROM pg_catalog.pg_roles AS r WHERE r.rolname = 'anon') AS anon_role_present
), expected_policies(relname, polname, polpermissive, polcmd, polroles, polqual, polwithcheck) AS (
  SELECT
    manifest.relname,
    manifest.polname,
    true,
    manifest.polcmd,
    CASE WHEN manifest.role_class = 'ANON_ONLY' THEN roles.anon_only_roles ELSE roles.public_only_roles END,
    manifest.polqual,
    manifest.polwithcheck
  FROM (
    VALUES
      ('discovery_candidate_tools', 'Deny all access to discovery_candidate_tools', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovery_sources', 'Deny all access to discovery_sources', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovery_runs', 'Deny all access to discovery_runs', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovered_tools', 'Deny all access to discovered_tools', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovery_evidence', 'Deny all access to discovery_evidence', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovery_duplicate_candidates', 'Deny all access to discovery_duplicate_candidates', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('discovery_audit_events', 'Deny all access to discovery_audit_events', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('homepage_control_configs', 'Admin can read homepage control configs', 'r', 'PUBLIC_ONLY', 'false', NULL),
      ('homepage_control_configs', 'Admin can write homepage control configs', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('homepage_control_audit_events', 'Admin can read homepage control audit events', 'r', 'PUBLIC_ONLY', 'false', NULL),
      ('homepage_control_audit_events', 'Admin can insert homepage control audit events', 'a', 'PUBLIC_ONLY', NULL, 'false'),
      ('homepage_control_checklist_runs', 'Admin can read homepage control checklist runs', 'r', 'PUBLIC_ONLY', 'false', NULL),
      ('homepage_control_checklist_runs', 'Admin can write homepage control checklist runs', '*', 'PUBLIC_ONLY', 'false', 'false'),
      ('tools', 'Allow public read access to approved tools', 'r', 'ANON_ONLY', '((status = ''approved''::text) AND (deleted_at IS NULL))', NULL),
      ('discovery_candidate_preview_artifacts', 'Deny all access to discovery_candidate_preview_artifacts', '*', 'PUBLIC_ONLY', 'false', 'false')
  ) AS manifest(relname, polname, polcmd, role_class, polqual, polwithcheck)
  CROSS JOIN reviewed_policy_role_oids AS roles
), expected_legacy_tools_policy(relname, polname, polpermissive, polcmd, polroles, polqual, polwithcheck) AS (
  SELECT 'tools', 'Public can read tools', true, 'r', public_only_roles, 'true', NULL
  FROM reviewed_policy_role_oids
), live_relations AS (
  SELECT
    c.oid,
    c.relname,
    c.relowner,
    c.relrowsecurity,
    c.relforcerowsecurity,
    e.expected_relrowsecurity,
    e.expected_relforcerowsecurity
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  JOIN expected_relation_rls AS e ON e.relname = c.relname
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
), audit_relations AS (
  SELECT oid, relname, relowner, relacl
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
), audit_sequence AS (
  SELECT c.oid, c.relowner, c.relacl
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'S'
    AND c.relname = 'admin_audit_logs_id_seq'
), live_policies AS (
  SELECT
    c.relname,
    p.polname,
    p.polpermissive,
    p.polcmd,
    p.polroles,
    pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS polqual,
    pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS polwithcheck
  FROM pg_catalog.pg_policy AS p
  JOIN pg_catalog.pg_class AS c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
), migration_metrics AS (
  -- Phase 27NA forbids treating a version/name match as exact content identity.
  -- The reviewed history surface has no trustworthy content digest or approved
  -- deployment-ledger identity, so this emits one deterministic fail-closed row
  -- and deliberately performs no live migration-history read.
  SELECT
    'UNAVAILABLE'::text AS expected_history_identity_count,
    'UNAVAILABLE'::text AS live_history_entry_count,
    'UNAVAILABLE'::text AS matched_history_identity_count,
    'UNAVAILABLE'::text AS missing_history_identity_count,
    'UNAVAILABLE'::text AS unexpected_history_identity_count,
    'UNAVAILABLE'::text AS duplicated_history_identity_count
), relation_metrics AS (
  SELECT
    (SELECT count(*)::integer FROM expected_relations) AS expected_relation_count,
    count(*)::integer AS present_relation_count,
    ((SELECT count(*) FROM expected_relations) - count(*))::integer AS missing_relation_count,
    count(*) FILTER (WHERE relrowsecurity)::integer AS rls_enabled_count,
    count(*) FILTER (WHERE relforcerowsecurity)::integer AS rls_forced_count,
    ((SELECT count(*) FROM expected_relations) - count(*)
      + count(*) FILTER (
        WHERE relrowsecurity IS DISTINCT FROM expected_relrowsecurity
           OR relforcerowsecurity IS DISTINCT FROM expected_relforcerowsecurity
      ))::integer AS rls_mismatch_count
  FROM live_relations
), policy_metrics AS (
  SELECT
    (SELECT count(*)::integer FROM expected_policies) AS expected_policy_count,
    (SELECT count(*)::integer FROM expected_policies AS e
      WHERE EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = e.relname
          AND l.polname = e.polname
          AND l.polpermissive = e.polpermissive
          AND l.polcmd = e.polcmd
          AND l.polroles IS NOT DISTINCT FROM e.polroles
          AND l.polqual IS NOT DISTINCT FROM e.polqual
          AND l.polwithcheck IS NOT DISTINCT FROM e.polwithcheck
      )) AS matched_policy_count,
    (SELECT count(*)::integer FROM expected_policies AS e
      WHERE NOT EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = e.relname AND l.polname = e.polname
      )) AS missing_policy_identity_count,
    (SELECT count(*)::integer FROM expected_policies AS e
      WHERE EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = e.relname AND l.polname = e.polname
      )
      AND NOT EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = e.relname
          AND l.polname = e.polname
          AND l.polpermissive = e.polpermissive
          AND l.polcmd = e.polcmd
          AND l.polroles IS NOT DISTINCT FROM e.polroles
          AND l.polqual IS NOT DISTINCT FROM e.polqual
          AND l.polwithcheck IS NOT DISTINCT FROM e.polwithcheck
      )) AS semantic_mismatch_policy_count,
    (SELECT count(*)::integer FROM live_policies AS l
      JOIN expected_legacy_tools_policy AS legacy
        ON l.relname = legacy.relname
       AND l.polname = legacy.polname
      ) AS legacy_policy_identity_count,
    (SELECT count(*)::integer FROM expected_legacy_tools_policy AS legacy
      WHERE EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = legacy.relname AND l.polname = legacy.polname
      )
      AND NOT EXISTS (
        SELECT 1 FROM live_policies AS l
        WHERE l.relname = legacy.relname
          AND l.polname = legacy.polname
          AND l.polpermissive = legacy.polpermissive
          AND l.polcmd = legacy.polcmd
          AND l.polroles IS NOT DISTINCT FROM legacy.polroles
          AND l.polqual IS NOT DISTINCT FROM legacy.polqual
          AND l.polwithcheck IS NOT DISTINCT FROM legacy.polwithcheck
      )) AS legacy_semantic_mismatch_policy_count,
    (SELECT count(*)::integer FROM live_policies AS l
      WHERE NOT EXISTS (
        SELECT 1 FROM expected_policies AS e
        WHERE e.relname = l.relname AND e.polname = l.polname
      )
      AND NOT EXISTS (
        SELECT 1 FROM expected_legacy_tools_policy AS legacy
        WHERE l.relname = legacy.relname
          AND l.polname = legacy.polname
      )) AS unexpected_policy_count,
    (SELECT count(*)::integer FROM live_policies AS l
      JOIN expected_legacy_tools_policy AS legacy
        ON l.relname = legacy.relname
       AND l.polname = legacy.polname
       AND l.polpermissive = legacy.polpermissive
       AND l.polcmd = legacy.polcmd
       AND l.polroles IS NOT DISTINCT FROM legacy.polroles
       AND l.polqual IS NOT DISTINCT FROM legacy.polqual
       AND l.polwithcheck IS NOT DISTINCT FROM legacy.polwithcheck
      ) AS tools_legacy_policy_count,
    (SELECT count(*)::integer FROM live_policies AS l
      JOIN expected_policies AS e
        ON l.relname = e.relname
       AND l.polname = e.polname
       AND l.polpermissive = e.polpermissive
       AND l.polcmd = e.polcmd
       AND l.polroles IS NOT DISTINCT FROM e.polroles
       AND l.polqual IS NOT DISTINCT FROM e.polqual
       AND l.polwithcheck IS NOT DISTINCT FROM e.polwithcheck
      WHERE e.relname = 'tools'
        AND e.polname = 'Allow public read access to approved tools'
      ) AS tools_approved_only_policy_count
), public_grant_metrics AS (
  SELECT
    NOT EXISTS (
      SELECT 1
      FROM (
        SELECT ar.relacl AS acl FROM audit_relations AS ar
        UNION ALL
        SELECT s.relacl AS acl FROM audit_sequence AS s
      ) AS objects
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(objects.acl, '{}'::aclitem[])) AS a
      WHERE a.grantee = 0
    ) AS no_public_access
), audit_object_availability AS (
  SELECT (
    (SELECT count(*) FROM audit_relations) = 2
    AND (SELECT count(*) FROM audit_sequence) = 1
  ) AS all_audit_objects_present
), grant_metrics AS (
  SELECT
    CASE
      WHEN NOT a.all_audit_objects_present THEN 'UNAVAILABLE'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND (SELECT no_public_access FROM public_grant_metrics) THEN 'EXPECTED_NONE'
      ELSE 'UNEXPECTED_PRESENT'
    END AS public_grant_classification,
    CASE
      WHEN NOT a.all_audit_objects_present THEN 'UNAVAILABLE'
      WHEN NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN 'UNAVAILABLE'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND NOT EXISTS (
        SELECT 1 FROM audit_relations AS ar
        WHERE pg_catalog.has_table_privilege('anon', ar.oid, 'SELECT')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'INSERT')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'UPDATE')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'DELETE')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'TRUNCATE')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'REFERENCES')
           OR pg_catalog.has_table_privilege('anon', ar.oid, 'TRIGGER')
      )
      AND NOT EXISTS (
        SELECT 1 FROM audit_sequence AS s
        WHERE pg_catalog.has_sequence_privilege('anon', s.oid, 'USAGE')
           OR pg_catalog.has_sequence_privilege('anon', s.oid, 'SELECT')
           OR pg_catalog.has_sequence_privilege('anon', s.oid, 'UPDATE')
      ) THEN 'EXPECTED_NONE'
      ELSE 'UNEXPECTED_PRESENT'
    END AS anon_grant_classification,
    CASE
      WHEN NOT a.all_audit_objects_present THEN 'UNAVAILABLE'
      WHEN NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN 'UNAVAILABLE'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND NOT EXISTS (
        SELECT 1 FROM audit_relations AS ar
        WHERE pg_catalog.has_table_privilege('authenticated', ar.oid, 'SELECT')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'INSERT')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'UPDATE')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'DELETE')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'TRUNCATE')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'REFERENCES')
           OR pg_catalog.has_table_privilege('authenticated', ar.oid, 'TRIGGER')
      )
      AND NOT EXISTS (
        SELECT 1 FROM audit_sequence AS s
        WHERE pg_catalog.has_sequence_privilege('authenticated', s.oid, 'USAGE')
           OR pg_catalog.has_sequence_privilege('authenticated', s.oid, 'SELECT')
           OR pg_catalog.has_sequence_privilege('authenticated', s.oid, 'UPDATE')
      ) THEN 'EXPECTED_NONE'
      ELSE 'UNEXPECTED_PRESENT'
    END AS authenticated_grant_classification,
    CASE
      WHEN NOT a.all_audit_objects_present THEN 'UNAVAILABLE'
      WHEN NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN 'UNAVAILABLE'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND (
        pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'UPDATE')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'TRUNCATE')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'REFERENCES')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'TRIGGER')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'UPDATE')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'DELETE')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'TRUNCATE')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'REFERENCES')
        OR pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'TRIGGER')
        OR pg_catalog.has_sequence_privilege('service_role', (SELECT oid FROM audit_sequence), 'SELECT')
        OR pg_catalog.has_sequence_privilege('service_role', (SELECT oid FROM audit_sequence), 'UPDATE')
       ) THEN 'UNEXPECTED'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND (
        NOT pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'SELECT')
        OR NOT pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'INSERT')
        OR NOT pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_logs'), 'DELETE')
        OR NOT pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'SELECT')
        OR NOT pg_catalog.has_table_privilege('service_role', (SELECT oid FROM audit_relations WHERE relname = 'admin_audit_archives'), 'INSERT')
        OR NOT pg_catalog.has_sequence_privilege('service_role', (SELECT oid FROM audit_sequence), 'USAGE')
       ) THEN 'INSUFFICIENT'
      WHEN (SELECT count(*) FROM audit_relations) = 2
       AND (SELECT count(*) FROM audit_sequence) = 1
       AND NOT EXISTS (
        SELECT 1 FROM audit_relations AS ar
        WHERE (ar.relname = 'admin_audit_logs'
          AND (NOT pg_catalog.has_table_privilege('service_role', ar.oid, 'SELECT')
            OR NOT pg_catalog.has_table_privilege('service_role', ar.oid, 'INSERT')
            OR NOT pg_catalog.has_table_privilege('service_role', ar.oid, 'DELETE')))
           OR (ar.relname = 'admin_audit_archives'
          AND (NOT pg_catalog.has_table_privilege('service_role', ar.oid, 'SELECT')
            OR NOT pg_catalog.has_table_privilege('service_role', ar.oid, 'INSERT')))
      )
       AND NOT EXISTS (
        SELECT 1 FROM audit_sequence AS s
        WHERE NOT pg_catalog.has_sequence_privilege('service_role', s.oid, 'USAGE')
      ) THEN 'SUFFICIENT'
      ELSE 'INSUFFICIENT'
    END AS service_role_grant_classification
  FROM audit_object_availability AS a
), ownership_metrics AS (
  -- Static evidence establishes no approved expected owner identity. Matching
  -- the three live owner OIDs to each other cannot prove EXPECTED_MATCH.
  SELECT 'UNAVAILABLE'::text AS ownership_classification
), dependency_metrics AS (
  -- Phase 27NA establishes only historical/generated context for the sequence
  -- default, default-reached functions, trigger enabled state, and linked
  -- function security. A partial catalog match cannot prove any exact class.
  SELECT
    'UNAVAILABLE'::text AS sequence_dependency_classification,
    'UNAVAILABLE'::text AS function_security_classification,
    'UNAVAILABLE'::text AS trigger_dependency_classification
), component_classifications AS (
  SELECT
    CASE
      WHEN m.expected_history_identity_count = 'UNAVAILABLE'
        OR m.live_history_entry_count = 'UNAVAILABLE'
        OR m.matched_history_identity_count = 'UNAVAILABLE'
        OR m.missing_history_identity_count = 'UNAVAILABLE'
        OR m.unexpected_history_identity_count = 'UNAVAILABLE'
        OR m.duplicated_history_identity_count = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      ELSE 'UNAVAILABLE'
    END AS migration_history_overall_classification,
    CASE
      WHEN p.semantic_mismatch_policy_count > 0
        OR p.legacy_semantic_mismatch_policy_count > 0 THEN 'SEMANTIC_MISMATCH'
      WHEN p.missing_policy_identity_count > 0
        OR p.legacy_policy_identity_count = 0 THEN 'MISSING'
      WHEN p.unexpected_policy_count > 0
        OR p.legacy_policy_identity_count > 1 THEN 'UNEXPECTED'
      WHEN p.matched_policy_count = p.expected_policy_count
        AND p.tools_approved_only_policy_count = 1
        AND p.legacy_policy_identity_count = 1
        AND p.legacy_semantic_mismatch_policy_count = 0
        AND p.tools_legacy_policy_count = 1 THEN 'EXACT_MATCH'
      ELSE 'UNAVAILABLE'
    END AS policy_classification
  FROM migration_metrics AS m
  CROSS JOIN policy_metrics AS p
), classifications AS (
  SELECT
    base.migration_history_overall_classification,
    base.policy_classification,
    CASE
      WHEN base.migration_history_overall_classification = 'UNAVAILABLE'
        OR base.policy_classification = 'UNAVAILABLE'
        OR g.public_grant_classification = 'UNAVAILABLE'
        OR g.anon_grant_classification = 'UNAVAILABLE'
        OR g.authenticated_grant_classification = 'UNAVAILABLE'
        OR g.service_role_grant_classification = 'UNAVAILABLE'
        OR o.ownership_classification = 'UNAVAILABLE'
        OR d.sequence_dependency_classification = 'UNAVAILABLE'
        OR d.function_security_classification = 'UNAVAILABLE'
        OR d.trigger_dependency_classification = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      WHEN (
        (r.missing_relation_count > 0 OR r.rls_mismatch_count > 0 OR o.ownership_classification <> 'EXPECTED_MATCH' OR d.sequence_dependency_classification <> 'EXPECTED_MATCH')::integer
        + (p.semantic_mismatch_policy_count > 0 OR p.legacy_semantic_mismatch_policy_count > 0 OR p.missing_policy_identity_count > 0 OR p.legacy_policy_identity_count = 0 OR p.legacy_policy_identity_count > 1 OR p.unexpected_policy_count > 0 OR p.tools_approved_only_policy_count <> 1)::integer
        + (g.public_grant_classification <> 'EXPECTED_NONE' OR g.anon_grant_classification <> 'EXPECTED_NONE' OR g.authenticated_grant_classification <> 'EXPECTED_NONE' OR g.service_role_grant_classification <> 'SUFFICIENT')::integer
        + (d.function_security_classification <> 'EXPECTED_MATCH' OR d.trigger_dependency_classification <> 'EXPECTED_MATCH')::integer
      ) > 1 THEN 'MULTIPLE'
      WHEN r.missing_relation_count > 0
        OR r.rls_mismatch_count > 0
        OR o.ownership_classification <> 'EXPECTED_MATCH'
        OR d.sequence_dependency_classification <> 'EXPECTED_MATCH' THEN 'SCHEMA'
      WHEN p.semantic_mismatch_policy_count > 0
        OR p.legacy_semantic_mismatch_policy_count > 0
        OR p.missing_policy_identity_count > 0
        OR p.legacy_policy_identity_count = 0
        OR p.legacy_policy_identity_count > 1
        OR p.unexpected_policy_count > 0
        OR p.tools_approved_only_policy_count <> 1 THEN 'POLICY'
      WHEN g.public_grant_classification <> 'EXPECTED_NONE'
        OR g.anon_grant_classification <> 'EXPECTED_NONE'
        OR g.authenticated_grant_classification <> 'EXPECTED_NONE'
        OR g.service_role_grant_classification <> 'SUFFICIENT' THEN 'GRANT'
      WHEN d.function_security_classification <> 'EXPECTED_MATCH'
        OR d.trigger_dependency_classification <> 'EXPECTED_MATCH' THEN 'FUNCTION_OR_TRIGGER'
      ELSE 'NONE'
    END AS out_of_band_drift_classification,
    CASE
      WHEN base.migration_history_overall_classification = 'UNAVAILABLE'
        OR base.policy_classification = 'UNAVAILABLE'
        OR g.public_grant_classification = 'UNAVAILABLE'
        OR g.anon_grant_classification = 'UNAVAILABLE'
        OR g.authenticated_grant_classification = 'UNAVAILABLE'
        OR g.service_role_grant_classification = 'UNAVAILABLE'
        OR o.ownership_classification = 'UNAVAILABLE'
        OR d.sequence_dependency_classification = 'UNAVAILABLE'
        OR d.function_security_classification = 'UNAVAILABLE'
        OR d.trigger_dependency_classification = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      WHEN r.missing_relation_count = 0
       AND r.rls_mismatch_count = 0
       AND p.matched_policy_count = p.expected_policy_count
       AND p.semantic_mismatch_policy_count = 0
       AND p.missing_policy_identity_count = 0
       AND p.unexpected_policy_count = 0
       AND p.legacy_policy_identity_count = 1
       AND p.legacy_semantic_mismatch_policy_count = 0
       AND p.tools_legacy_policy_count = 1
       AND p.tools_approved_only_policy_count = 1
       AND g.public_grant_classification = 'EXPECTED_NONE'
       AND g.anon_grant_classification = 'EXPECTED_NONE'
       AND g.authenticated_grant_classification = 'EXPECTED_NONE'
       AND g.service_role_grant_classification = 'SUFFICIENT'
       AND o.ownership_classification = 'EXPECTED_MATCH'
       AND d.sequence_dependency_classification = 'EXPECTED_MATCH'
       AND d.function_security_classification = 'EXPECTED_MATCH'
       AND d.trigger_dependency_classification = 'EXPECTED_MATCH'
      THEN 'PASS' ELSE 'FAIL'
    END AS forward_precondition_classification,
    CASE
      WHEN base.migration_history_overall_classification = 'UNAVAILABLE'
        OR base.policy_classification = 'UNAVAILABLE'
        OR g.public_grant_classification = 'UNAVAILABLE'
        OR g.anon_grant_classification = 'UNAVAILABLE'
        OR g.authenticated_grant_classification = 'UNAVAILABLE'
        OR g.service_role_grant_classification = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      WHEN p.tools_legacy_policy_count = 1
       AND p.legacy_policy_identity_count = 1
       AND p.legacy_semantic_mismatch_policy_count = 0
       AND p.tools_approved_only_policy_count = 1
      THEN 'PASS' ELSE 'FAIL'
    END AS rollback_precondition_classification
  FROM migration_metrics AS m
  CROSS JOIN relation_metrics AS r
  CROSS JOIN policy_metrics AS p
  CROSS JOIN grant_metrics AS g
  CROSS JOIN ownership_metrics AS o
  CROSS JOIN dependency_metrics AS d
  CROSS JOIN component_classifications AS base
), output_rows(sort_order, evidence_key, evidence_value) AS (
  SELECT rows.sort_order, rows.evidence_key, rows.evidence_value
  FROM migration_metrics AS m
  CROSS JOIN relation_metrics AS r
  CROSS JOIN policy_metrics AS p
  CROSS JOIN grant_metrics AS g
  CROSS JOIN ownership_metrics AS o
  CROSS JOIN dependency_metrics AS d
  CROSS JOIN classifications AS c
  CROSS JOIN LATERAL (VALUES
    (1,  'TARGET_ENVIRONMENT_CLASSIFICATION', :'AIFINDER_TARGET_ENVIRONMENT_CLASSIFICATION'),
    (2,  'EVIDENCE_TIMESTAMP_UTC', pg_catalog.to_char(pg_catalog.clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    (3,  'SNAPSHOT_IDENTITY_CLASSIFICATION', 'SINGLE_READ_ONLY_TRANSACTION'),
    (4,  'EXPECTED_REPOSITORY_MIGRATION_COUNT', '24'),
    (5,  'EXPECTED_HISTORY_IDENTITY_COUNT', m.expected_history_identity_count::text),
    (6,  'LIVE_HISTORY_ENTRY_COUNT', m.live_history_entry_count::text),
    (7,  'MATCHED_HISTORY_IDENTITY_COUNT', m.matched_history_identity_count::text),
    (8,  'MISSING_HISTORY_IDENTITY_COUNT', m.missing_history_identity_count::text),
    (9,  'UNEXPECTED_HISTORY_IDENTITY_COUNT', m.unexpected_history_identity_count::text),
    (10, 'DUPLICATED_HISTORY_IDENTITY_COUNT', m.duplicated_history_identity_count::text),
    (11, 'RENAMED_SAME_CONTENT_COUNT', 'UNAVAILABLE'),
    (12, 'DIFFERENT_CONTENT_COUNT', 'UNAVAILABLE'),
    (13, 'MIGRATION_HISTORY_OVERALL_CLASSIFICATION', c.migration_history_overall_classification),
    (14, 'EXPECTED_RELATION_COUNT', r.expected_relation_count::text),
    (15, 'PRESENT_RELATION_COUNT', r.present_relation_count::text),
    (16, 'MISSING_RELATION_COUNT', r.missing_relation_count::text),
    (17, 'RLS_ENABLED_COUNT', r.rls_enabled_count::text),
    (18, 'RLS_FORCED_COUNT', r.rls_forced_count::text),
    (19, 'EXPECTED_POLICY_COUNT', p.expected_policy_count::text),
    (20, 'MATCHED_POLICY_COUNT', p.matched_policy_count::text),
    (21, 'UNEXPECTED_POLICY_COUNT', p.unexpected_policy_count::text),
    (22, 'TOOLS_LEGACY_POLICY_COUNT', p.tools_legacy_policy_count::text),
    (23, 'TOOLS_APPROVED_ONLY_POLICY_COUNT', p.tools_approved_only_policy_count::text),
    (24, 'POLICY_CLASSIFICATION', c.policy_classification),
    (25, 'EXPECTED_GRANT_CLASS_COUNT', '4'),
    (26, 'MATCHED_GRANT_CLASS_COUNT', CASE
      WHEN g.public_grant_classification = 'UNAVAILABLE'
        OR g.anon_grant_classification = 'UNAVAILABLE'
        OR g.authenticated_grant_classification = 'UNAVAILABLE'
        OR g.service_role_grant_classification = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      ELSE ((g.public_grant_classification = 'EXPECTED_NONE')::integer + (g.anon_grant_classification = 'EXPECTED_NONE')::integer + (g.authenticated_grant_classification = 'EXPECTED_NONE')::integer + (g.service_role_grant_classification = 'SUFFICIENT')::integer)::text
    END),
    (27, 'UNEXPECTED_GRANT_CLASS_COUNT', CASE
      WHEN g.public_grant_classification = 'UNAVAILABLE'
        OR g.anon_grant_classification = 'UNAVAILABLE'
        OR g.authenticated_grant_classification = 'UNAVAILABLE'
        OR g.service_role_grant_classification = 'UNAVAILABLE' THEN 'UNAVAILABLE'
      ELSE (4 - ((g.public_grant_classification = 'EXPECTED_NONE')::integer + (g.anon_grant_classification = 'EXPECTED_NONE')::integer + (g.authenticated_grant_classification = 'EXPECTED_NONE')::integer + (g.service_role_grant_classification = 'SUFFICIENT')::integer))::text
    END),
    (28, 'PUBLIC_GRANT_CLASSIFICATION', g.public_grant_classification),
    (29, 'ANON_GRANT_CLASSIFICATION', g.anon_grant_classification),
    (30, 'AUTHENTICATED_GRANT_CLASSIFICATION', g.authenticated_grant_classification),
    (31, 'SERVICE_ROLE_GRANT_CLASSIFICATION', g.service_role_grant_classification),
    (32, 'OWNERSHIP_CLASSIFICATION', o.ownership_classification),
    (33, 'SEQUENCE_DEPENDENCY_CLASSIFICATION', d.sequence_dependency_classification),
    (34, 'FUNCTION_SECURITY_CLASSIFICATION', d.function_security_classification),
    (35, 'TRIGGER_DEPENDENCY_CLASSIFICATION', d.trigger_dependency_classification),
    (36, 'OUT_OF_BAND_DRIFT_CLASSIFICATION', c.out_of_band_drift_classification),
    (37, 'FORWARD_PRECONDITION_CLASSIFICATION', c.forward_precondition_classification),
    (38, 'ROLLBACK_PRECONDITION_CLASSIFICATION', c.rollback_precondition_classification),
    (39, 'TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION', 'BLOCKED'),
    (40, 'ROW_VALUES_PRINTED', 'false'),
    (41, 'RAW_CATALOG_ROWS_PRINTED', 'false'),
    (42, 'RAW_MIGRATION_HISTORY_ROWS_PRINTED', 'false'),
    (43, 'POLICY_EXPRESSIONS_PRINTED', 'false'),
    (44, 'GRANT_ROWS_PRINTED', 'false'),
    (45, 'OWNER_IDENTITIES_PRINTED', 'false'),
    (46, 'FUNCTION_BODIES_PRINTED', 'false'),
    (47, 'TRIGGER_DEFINITIONS_PRINTED', 'false'),
    (48, 'INDEX_DEFINITIONS_PRINTED', 'false'),
    (49, 'CONSTRAINT_DEFINITIONS_PRINTED', 'false'),
    (50, 'DATABASE_URL_PRINTED', 'false'),
    (51, 'HOSTNAMES_PRINTED', 'false'),
    (52, 'PROJECT_REFERENCE_PRINTED', 'false'),
    (53, 'CREDENTIALS_PRINTED', 'false'),
    (54, 'SECRETS_PRINTED', 'false'),
    (55, 'RAW_ERROR_TEXT_PRINTED', 'false'),
    (56, 'UNAPPROVED_DATABASE_IDENTIFIERS_PRINTED', 'false')
  ) AS rows(sort_order, evidence_key, evidence_value)
), normalized_evidence AS (
  SELECT sort_order, evidence_key, max(evidence_value) AS evidence_value
  FROM output_rows
  GROUP BY sort_order, evidence_key
)
SELECT evidence_key AS key, evidence_value AS value
FROM normalized_evidence
ORDER BY sort_order;

ROLLBACK;
