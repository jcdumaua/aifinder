# Phase 26XF — Admin Audit Sequence Static Origin Inventory

## Bound baseline

`3662fc2976837858584c5bab73a545b55033f653`

## Target

`public.admin_audit_logs_id_seq`

## Repository-wide hits

```text
docs/discovery-phase-26xb-catalog-ddl-metadata-sanitized-result.md:94:1. `id bigint NOT NULL DEFAULT nextval('admin_audit_logs_id_seq'::regclass)`
docs/discovery-phase-26xd-admin-audit-schema-source-control-recovery-design.md:39:The `admin_audit_logs_id_seq` sequence must be inventoried and represented because the `id` default depends on it.
docs/discovery-phase-26xe-ddl-reconciliation-review-package.md:22:8. a sequence inventory is required for `admin_audit_logs_id_seq`;
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:25:  AND c.relname = 'admin_audit_logs_id_seq'
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:49:  AND seq.relname = 'admin_audit_logs_id_seq'
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:65:  AND object_name = 'admin_audit_logs_id_seq'
```

## Static classification

The live column default references the sequence, but current repository evidence does not by itself establish:

- sequence creation source;
- ownership binding;
- numeric settings;
- cache and cycle behavior;
- privilege grants.

## Current disposition

`CATALOG_SEQUENCE_INVENTORY_REQUIRED_NO_MUTATION_AUTHORIZED`
