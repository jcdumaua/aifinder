# AiFinder Phase 26ZA — Preflight Runtime Execution Operator Handoff Gate

## Status

`AWAITING_OPERATOR_CONTROLLED_SERVICE_DESCRIPTOR_AND_FINAL_RUNTIME_SCRIPT_REVIEW`

## Baseline

- Phase 26YZ reconciliation commit: `1bb025378d1f30a3df1fe9b78949bdb69b71eaf9`
- Wrapper SHA-256: `b68eefc8bd3d29bf46901570fb96d92e445fb11ed2d2d1525075e29b2cf73fdd`
- Wrapper Git blob: `0551f26cbf650f68c9d4d7aa0320baff20889fd0`
- Manifest SHA-256: `4d5563c3fc7c1c6f3fb387229dff2415e84d788d2893ef0eaa98975e11e20a44`
- Generator SHA-256: `1dc989e15a8e23fd269eb1af52dd060f1682c758fd0c0fadcd53e02eb875f474`

## Completed Security Remediation

- Authorization record path removed from command arguments.
- Authorization nonce removed from command arguments.
- Authorization delivery now uses `--authorization-fd <N>`.
- Credential delivery remains `--service-fd <N>`.
- Read-only session assertion is present.
- Statement timeout is 10 seconds.
- Lock timeout is 5 seconds.
- Phase 26YY rejection history is committed.
- Wrapper, manifest, and generator identities are synchronized.

## Operator Handoff Requirement

The live runtime turn cannot begin until the operator opens the approved staging libpq service configuration outside the runner.

The operator must provide only an inherited numeric descriptor.

The operator must not paste, print, log, or pass through arguments:

- Service-file path.
- Host or port.
- Role or username.
- Database name.
- Password.
- URL or connection string.
- Authorization nonce.
- Environment values.

## Required One-Turn Sequence

After the operator-controlled service descriptor is open, one separately reviewed runtime script must:

1. Verify this exact synchronized repository baseline.
2. Safely classify and remove only eligible expired or consumed temporary records.
3. Invoke the generator exactly once for `staging` with TTL 300.
4. Open the new authorization record as a numeric descriptor.
5. Validate descriptor ownership, mode, schema, identities, expiry, and unconsumed status.
6. Atomically mark the record consumed before opening the database connection.
7. Invoke the exact committed wrapper once with:
   - `--service-fd <N>`
   - `--authorization-fd <M>`
   - `--environment-class staging`
8. Permit one staging database connection.
9. Enforce the committed read-only session and timeout assertions.
10. Execute exactly the committed SQL candidate.
11. Emit redacted evidence only.
12. Close descriptors and stop.

## Fail-Closed Requirements

- No retry after fresh token issuance.
- No retry after token consumption.
- No token reuse.
- No production target.
- No application `.env` access.
- No second database connection.
- No second SQL execution.
- No migrations, DDL, DML, grants, policies, ownership changes, deployment, publishing, or operational reactivation.

## Current Authorization State

- Operator service descriptor opening: `NOT_PERFORMED`
- Temporary-record cleanup: `NOT_PERFORMED`
- Fresh token issuance: `NOT_PERFORMED`
- Authorization consumption: `NOT_PERFORMED`
- Wrapper invocation: `NOT_PERFORMED`
- Database connection: `NOT_PERFORMED`
- Catalog SQL execution: `NOT_PERFORMED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZA_OPERATOR_HANDOFF_AND_FINAL_RUNTIME_SCRIPT_PLANNING`
- `REQUEST_CHANGES_PHASE_26ZA_OPERATOR_HANDOFF_AND_FINAL_RUNTIME_SCRIPT_PLANNING`
- `REJECT_PHASE_26ZA_OPERATOR_HANDOFF_AND_FINAL_RUNTIME_SCRIPT_PLANNING`
