# Phase 26XG — Admin Audit Sequence Catalog Query Plan

## Candidate

- File: `scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql`
- SHA-256: `2b231fe90f7e0cfca150535cb2d90b7ab96514fa50d7efc567cdeecba4738d43`
- Mode: `100644`

## Objective

Collect only metadata for `public.admin_audit_logs_id_seq`:

- owner;
- start value;
- increment;
- minimum and maximum;
- cache;
- cycle setting;
- owned-by table and column;
- explicit usage grants.

## Safety controls

- catalog and information-schema sources only;
- `BEGIN READ ONLY`;
- statement timeout;
- lock timeout;
- explicit `ROLLBACK`;
- no application rows;
- no mutation;
- no execution authorization in this phase.

## Current state

- Query prepared: `YES`
- Query executed: `NO`
- Database connection: `NOT_PERFORMED`
