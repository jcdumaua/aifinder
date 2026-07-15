# Phase 26XH — Admin Audit Grant Cleanup Target-State Plan

## Confirmed live grant posture

Both `admin_audit_logs` and `admin_audit_archives` have relation-level privileges granted to:

- `anon`
- `authenticated`
- `service_role`
- `postgres`

Zero-policy RLS currently blocks ordinary-role row access.

## Proposed least-privilege target

Subject to application dependency verification:

- retain owner privileges for `postgres`;
- retain only service-role privileges required by server-only audit workflows;
- revoke unnecessary direct relation privileges from `anon`;
- revoke unnecessary direct relation privileges from `authenticated`.

## Required dependency proof

Before grant mutation is authored:

1. verify all audit access occurs through server-only privileged clients;
2. verify no browser/client path calls the audit relations directly;
3. map required `service_role` operations per table;
4. determine whether sequence `USAGE` or `SELECT` is required by service-role inserts;
5. prepare exact rollback grants;
6. test in a non-production database.

## Forward design requirement

A future migration must:

- assert current grants exactly;
- fail closed on unexpected grant drift;
- revoke only reviewed privileges;
- preserve RLS and zero-policy posture;
- avoid table or data mutation.

## Rollback design requirement

Rollback must recreate each revoked grant exactly, including grantee, privilege, and grantable state.

## Current disposition

`GRANT_CLEANUP_TARGET_DEFINED_SEQUENCE_METADATA_AND_DEPENDENCY_REVIEW_PENDING`
