# AiFinder Phase 26YA — Read-Only Target Catalog Preflight Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26XZ commit: `1a82db5d7c1dbcb3d8529d0d713afb92a41c5cc3`
- Forward migration: `supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql`
- Forward SHA-256: `7ab6d4ee6ca08eee5a4ce5894bf6bdc4fa9dfcbcf1a688e1aa991a3413d8b2d3`
- Rollback migration: `supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql`
- Rollback SHA-256: `bbdaaf439a8203eba7e459f632d0b8a0d0bb60499ee6dade17139dbb247432f2`
- Branch synchronized with `origin/main`: yes

## Purpose

Define a read-only, catalog-only preflight package that can later verify whether a specifically authorized target database matches the assumptions embedded in the forward and rollback migrations before any migration execution is considered.

This planning gate does not connect to a database, load credentials, inspect environment values, execute SQL, run a migration tool, or authorize mutation.

## Separation of Concerns

The future preflight must report the two remediation domains independently:

1. **Primary exposure boundary:** RLS enablement and permissive policy state for `public.tools`.
2. **Secondary privilege boundary:** table and sequence grants for the audit-related objects named by the reviewed migrations.

A pass or failure in one domain must not implicitly determine the other.

## Proposed Read-Only Catalog Queries

The eventual preflight script may use only metadata and privilege-inspection functions. It must not select application-row contents.

### 1. Server and session safety classification

```sql
select
  current_database() as database_name,
  current_user as session_role,
  session_user as authenticated_role,
  pg_is_in_recovery() as is_replica,
  current_setting('transaction_read_only') as transaction_read_only;
```

The future runner must redact or omit database and role identifiers from any copied review package unless explicitly authorized. The values are for local pass/fail classification only.

### 2. Table identity and RLS flags

```sql
select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relkind,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('tools')
order by n.nspname, c.relname;
```

### 3. Policy inventory for the primary table

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual is not null as has_using_expression,
  with_check is not null as has_with_check_expression
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename = 'tools'
order by policyname, cmd;
```

The future result package must classify policy structure without printing policy expressions unless a later review explicitly authorizes expression disclosure.

### 4. Table privilege inventory

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'tools'
  )
order by table_name, grantee, privilege_type;
```

Before execution, the final preflight package must expand this object list only from exact identifiers present in the committed forward and rollback migrations. No guessed object may be added.

### 5. Sequence privilege inventory

```sql
select
  object_schema,
  object_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_usage_grants
where object_schema = 'public'
order by object_name, grantee, privilege_type;
```

The final runner must filter this query to the exact sequence identifiers extracted from the committed migrations and fail closed if extraction is ambiguous or returns no expected sequence.

## Required Static Preparation Before Any Live Preflight

A subsequent implementation phase must:

- Parse the committed migrations locally.
- Extract every referenced schema, table, policy, role category, and sequence identifier.
- Bind those identifiers to the exact migration SHA-256 values above.
- Generate parameter-free, read-only SQL with fixed identifier allowlists.
- Reject dynamic SQL, interpolated environment values, and unrestricted catalog scans.
- Wrap the catalog inspection in a read-only transaction where supported.
- Set conservative statement and lock timeouts before catalog inspection.
- Print classifications and counts only; do not print credentials, connection strings, environment values, row contents, policy expressions, session tokens, or response bodies.
- Preserve the original command exit status.
- Copy the review package on success or the raw failure log on failure.

## Mandatory Fail-Closed Conditions

The future preflight must fail without granting execution authorization if:

- The repository or migration hashes differ from the baseline above.
- The target cannot be positively classified as an explicitly authorized environment.
- The connection is writable when the preflight contract requires a read-only session.
- Required relations, policies, roles, or sequences are missing, duplicated, or structurally unexpected.
- Any unexpected permissive policy, RLS bypass condition, ownership state, or privilege grant is detected.
- A query times out or catalog access is incomplete.
- Any query would require reading application rows.
- Any secret, credential, connection string, environment value, or sensitive response body could be printed.
- Results from the primary and secondary remediation domains cannot be independently classified.

## Gate Separation

- Static preflight implementation: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Live target connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Forward migration execution: `PROHIBITED`
- Rollback execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YA_READ_ONLY_TARGET_CATALOG_PREFLIGHT_PLAN`
- `REQUEST_CHANGES_PHASE_26YA_READ_ONLY_TARGET_CATALOG_PREFLIGHT_PLAN`
- `REJECT_PHASE_26YA_READ_ONLY_TARGET_CATALOG_PREFLIGHT_PLAN`
