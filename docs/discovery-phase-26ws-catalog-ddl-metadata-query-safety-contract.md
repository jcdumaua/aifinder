# Phase 26WS — Catalog DDL Metadata Query Safety Contract

## Immutable query

`scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql`

SHA-256:

`b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589`

## Transaction controls

- `BEGIN READ ONLY`
- `statement_timeout = 5000ms`
- `lock_timeout = 1000ms`
- explicit `ROLLBACK`

## Allowed metadata sources

- `pg_catalog.pg_policy`
- `pg_catalog.pg_class`
- `pg_catalog.pg_namespace`
- `pg_catalog.pg_roles`
- `pg_catalog.pg_attribute`
- `pg_catalog.pg_attrdef`
- `pg_catalog.pg_constraint`
- `pg_catalog.pg_index`
- `pg_catalog.pg_trigger`
- `information_schema.role_table_grants`

## Prohibited

- application-row reads;
- application table counts;
- data sampling;
- database mutation;
- migration execution;
- environment-value output;
- connection-string output;
- automatic retry;
- deployment or publishing.
