# Phase 26XB — Catalog DDL Metadata Sanitized Result

## Bound execution baseline

`02515beb8480c97749f31e9b75fd431e0d33f8e7`

## Execution result

`CATALOG_DDL_METADATA_INSPECTION_PASSED`

The approved catalog-only query completed inside a read-only transaction and ended with `ROLLBACK`.

## Safety result

- Application rows read: `NONE`
- Database mutation: `NONE`
- Migration execution: `NONE`
- Environment values printed: `NO`
- Automatic retry: `NO`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`

## `public.tools` live policy definitions

### Source-controlled approved-only policy

- Name: `Allow public read access to approved tools`
- Command: `SELECT`
- Roles: `anon`
- Permissive: `true`
- `USING`: status is approved and `deleted_at` is null
- `WITH CHECK`: none

### Legacy broad-read policy

- Name: `Public can read tools`
- Command: `SELECT`
- Roles: `anon`, `authenticated`
- Permissive: `true`
- `USING`: `true`
- `WITH CHECK`: none

## Security interpretation

Because PostgreSQL permissive policies are combined with logical OR, the broad `USING (true)` policy can supersede the approved-only restriction for its assigned roles.

Disposition:

`LIVE_BROAD_READ_POLICY_REQUIRES_SEPARATE_REMEDIATION_REVIEW`

No policy mutation is authorized in this phase.

## `admin_audit_archives` live schema summary

- Owner: `postgres`
- RLS enabled: `true`
- RLS forced: `false`
- Policies: `0`
- Columns: `9`
- Primary key: `id`
- Additional indexes:
  - `created_at DESC`
  - `storage_path`
- Non-internal triggers: `0`

Columns:

1. `id uuid NOT NULL DEFAULT gen_random_uuid()`
2. `file_name text NOT NULL`
3. `storage_bucket text NOT NULL DEFAULT 'admin-audit-archives'`
4. `storage_path text NOT NULL`
5. `log_count integer NOT NULL DEFAULT 0`
6. `compressed_size_bytes integer NOT NULL DEFAULT 0`
7. `first_log_at timestamptz NULL`
8. `last_log_at timestamptz NULL`
9. `created_at timestamptz NOT NULL DEFAULT now()`

## `admin_audit_logs` live schema summary

- Owner: `postgres`
- RLS enabled: `true`
- RLS forced: `false`
- Policies: `0`
- Columns: `9`
- Primary key: `id`
- Additional indexes:
  - `action`
  - `created_at DESC`
  - `(target_type, target_id)`
- Non-internal triggers: `0`

Columns:

1. `id bigint NOT NULL DEFAULT nextval('admin_audit_logs_id_seq'::regclass)`
2. `action text NOT NULL`
3. `target_type text NULL`
4. `target_id text NULL`
5. `target_name text NULL`
6. `details jsonb NOT NULL DEFAULT '{}'::jsonb`
7. `ip_address text NULL`
8. `user_agent text NULL`
9. `created_at timestamptz NOT NULL DEFAULT now()`

## Grant posture

Both audit relations have explicit table privileges granted to:

- `anon`
- `authenticated`
- `service_role`
- `postgres`

RLS with zero policies continues to block ordinary-role row access, but the grants are part of the live schema and must be explicitly reconciled in source-control design.

## Current disposition

`SANITIZED_LIVE_DDL_BASELINE_ESTABLISHED_NO_MUTATION_AUTHORIZED`
