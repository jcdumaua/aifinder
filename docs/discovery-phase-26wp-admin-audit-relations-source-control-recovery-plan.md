# Phase 26WP — Admin Audit Relations Source-Control Recovery Plan

## Confirmed live state

- `admin_audit_logs`: RLS enabled, zero policies.
- `admin_audit_archives`: RLS enabled, zero policies.
- Current repository contains application references but no established creation migration.

## Recovery principle

Do not create replacement tables or guess their schema.

The source-control recovery must first obtain and review catalog-only metadata for:

- columns and ordinal positions;
- data types and nullability;
- defaults and identity behavior;
- primary, unique, and foreign-key constraints;
- indexes;
- ownership and grants;
- RLS flags;
- triggers;
- comments where relevant.

## Target artifact

A future migration should be a **schema-baseline reconciliation artifact**, not an unconditional table-creation operation.

It must use a design that:

- preserves existing live tables and data;
- fails closed on incompatible live schema;
- does not silently recreate or overwrite objects;
- documents privileged server access separately from ordinary-role RLS;
- provides a reversible source-control representation.

## Policy posture

Zero-policy RLS remains the current fail-closed posture. Explicit admin policies must not be invented merely for consistency unless application requirements and security review establish that they are necessary.

## Current disposition

`CATALOG_DDL_INVENTORY_REQUIRED_BEFORE_MIGRATION_AUTHORING`
