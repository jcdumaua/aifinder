# Phase 26XP — Admin Audit Grant and Sequence Remediation Design

## Confirmed live privilege surface

### Audit relations

Both `admin_audit_logs` and `admin_audit_archives` expose relation privileges to:

- `anon`
- `authenticated`
- `service_role`
- `postgres`

### Audit sequence

`admin_audit_logs_id_seq` exposes `USAGE` to:

- `anon`
- `authenticated`
- `service_role`
- `postgres`

## Proposed least-privilege target

Subject to dependency proof:

### Preserve

- owner privileges for `postgres`;
- service-role privileges required by server-only audit workflows;
- sequence ownership by `admin_audit_logs.id`;
- current sequence numeric settings;
- RLS enabled;
- zero-policy fail-closed posture.

### Remove

- unnecessary audit-table privileges from `anon`;
- unnecessary audit-table privileges from `authenticated`;
- unnecessary sequence `USAGE` from `anon`;
- unnecessary sequence `USAGE` from `authenticated`.

## Required dependency proof

Before migration authoring:

1. confirm every audit read and write path uses server-only privileged clients;
2. confirm no client-side route, component, or browser request accesses audit relations directly;
3. confirm inserts requiring sequence advancement execute as `service_role` or owner;
4. map exact relation privileges required by `service_role`;
5. map exact sequence privileges required by `service_role`;
6. prepare exact rollback grants;
7. test in an isolated non-production database.

## Forward migration requirements

A future migration must:

- verify current table grants exactly;
- verify current sequence grants exactly;
- verify sequence settings and ownership exactly;
- fail closed on any unexpected drift;
- revoke only approved privileges;
- preserve tables, rows, sequence values, indexes, RLS flags and policies;
- avoid data reads or rewrites.

## Rollback requirements

Rollback must restore:

- every revoked relation privilege;
- every revoked sequence privilege;
- original grantable state;
- original grantee;
- no additional privileges.

## Current disposition

`GRANT_AND_SEQUENCE_TARGET_STATE_COMPLETE_DEPENDENCY_PROOF_PENDING`
