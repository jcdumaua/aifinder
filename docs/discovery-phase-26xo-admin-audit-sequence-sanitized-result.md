# Phase 26XO — Admin Audit Sequence Sanitized Result

## Bound execution baseline

`267a86483ddcbbd58313f6f72d37ad8ca2c426a7`

## Execution result

`ADMIN_AUDIT_SEQUENCE_METADATA_INSPECTION_PASSED`

The approved catalog-only sequence query completed inside a read-only transaction and ended with `ROLLBACK`.

## Safety result

- Application rows read: `NONE`
- Database mutation: `NONE`
- Migration execution: `NONE`
- Grant mutation: `NONE`
- Policy mutation: `NONE`
- Environment values printed: `NO`
- Automatic retry: `NO`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Sequence identity

- Schema: `public`
- Name: `admin_audit_logs_id_seq`
- Owner: `postgres`
- Start value: `1`
- Increment: `1`
- Minimum: `1`
- Maximum: `9223372036854775807`
- Cache size: `1`
- Cycles: `false`

## Ownership dependency

- Owned-by relation: `public.admin_audit_logs`
- Owned-by column: `id`
- Dependency type: `a`

## Explicit sequence grants

- `anon`: `USAGE`, not grantable
- `authenticated`: `USAGE`, not grantable
- `service_role`: `USAGE`, not grantable
- `postgres`: `USAGE`, grantable

## Security interpretation

The sequence privileges align with the wider audit-table grant drift already observed.

Because ordinary client roles have direct sequence `USAGE`, a least-privilege remediation design should consider revoking:

- `anon` sequence `USAGE`;
- `authenticated` sequence `USAGE`;

only after proving that all legitimate inserts originate from server-only privileged code.

## Current disposition

`SANITIZED_SEQUENCE_BASELINE_ESTABLISHED_NO_MUTATION_AUTHORIZED`
