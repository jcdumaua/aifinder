# Phase 26WR — Catalog DDL Metadata Query Plan

## Bound baseline

`f0e7bd788a5e7fb17c8e8b26b820dc50324bc816`

## Candidate

- File: `scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql`
- SHA-256: `b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589`
- Mode: `100644`

## Objective

Collect exact catalog-only metadata for:

1. all live policies on `public.tools`;
2. relation identity and RLS posture for `admin_audit_logs` and `admin_audit_archives`;
3. columns, defaults, identity and generated behavior;
4. constraints;
5. indexes;
6. non-internal triggers;
7. explicit table grants;
8. relation and column comments.

## Execution state

- Query prepared: `YES`
- Database connection: `NOT_PERFORMED`
- SQL execution: `NOT_PERFORMED`
