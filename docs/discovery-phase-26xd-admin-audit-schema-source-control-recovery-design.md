# Phase 26XD — Admin Audit Schema Source-Control Recovery Design

## Objective

Represent the existing live audit-table schema in source control without recreating, replacing, or modifying live objects.

## Required source-controlled baseline

The future reconciliation migration must cover:

- both existing relations;
- exact columns and defaults;
- primary keys;
- supporting indexes;
- ownership expectations;
- RLS enabled and not forced;
- zero-policy posture;
- current grant posture;
- absence of non-internal triggers.

## Safe implementation model

The migration must not use unconditional `CREATE TABLE` statements against production.

It should instead use a fail-closed reconciliation pattern:

1. verify each relation exists;
2. verify every column and type;
3. verify nullability and defaults;
4. verify primary keys and indexes;
5. verify RLS flags;
6. verify zero-policy posture;
7. verify grants;
8. fail on any mismatch;
9. make no change when the live schema already matches.

## Sequence requirement

The `admin_audit_logs_id_seq` sequence must be inventoried and represented because the `id` default depends on it.

A separate static or catalog-only inventory may be required for:

- sequence ownership;
- start, increment, minimum, maximum, cache and cycle settings;
- sequence privileges.

## Grant review

The live tables expose relation-level grants to `anon` and `authenticated`, but zero-policy RLS blocks ordinary row access.

The future design must decide whether to:

- preserve grants exactly for live-state fidelity; or
- revoke unnecessary grants in a separately reviewed hardening migration.

No grant change is authorized by this recovery design.

## Current disposition

`SCHEMA_BASELINE_DESIGN_COMPLETE_SEQUENCE_AND_GRANT_REVIEW_PENDING`
