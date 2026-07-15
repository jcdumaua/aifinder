# AiFinder Phase 26YL — One-Use Authorization Record Issuance Execution Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YK commit: `cb11de4c8108a64d8b97064d87540b9f9e9fe449`
- Generator path: `scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh`
- Generator SHA-256: `3942d6a85787639d2c2ed6997b61245ad5bbfe7b0347ff5cd5931ba475fd3b01`
- Generator mode: `644`
- Generator `exit 90`: absent
- Branch synchronized with `origin/main`: yes

## Purpose

Define the exact one-time invocation, validation, redaction, cleanup, and stop conditions for issuing the first local staging read-only preflight authorization record.

This planning gate does not execute the generator, generate a nonce, create an authorization record, access credentials, open a service descriptor, connect to PostgreSQL, or run catalog queries.

## Proposed First Issuance Scope

- Environment class: `staging`
- TTL: no more than 300 seconds
- Execution count: exactly one
- Scope: `READ_ONLY_CATALOG_PREFLIGHT_ONLY`
- Migration execution authorized: `NO`
- Database connection authorized by issuance alone: `NO`

## Required Pre-Invocation Checks

The future issuance script must verify:

1. Repository root, origin, branch, and exact Phase 26YK commit.
2. Clean synchronization with `origin/main`.
3. Exact generator path, SHA-256, mode, and committed status.
4. Exact wrapper, detached manifest, and SQL candidate identities.
5. Wrapper `exit 93` remains active.
6. Detached manifest states `LIVE_EXECUTION_AUTHORIZED=NO`.
7. No existing authorization record is present.
8. No unrelated process is concurrently issuing a record.
9. System clock is available and sane.
10. Python 3 secure randomness and exclusive file creation are available.

## Invocation Contract

The future issuance must invoke exactly:

```text
<generator> --environment-class staging --ttl-seconds <reviewed-value>
```

The command must run exactly once.

The future execution script must capture `PIPESTATUS[0]`, preserve the original exit code, and prohibit retries unless a new authorization is issued.

## Output Redaction Contract

Permitted output:

- Result class.
- Record path.
- Environment class.
- TTL classification.
- Expiration remaining classification.
- File mode and ownership classification.
- Schema-key presence classification.
- Execution scope.

Prohibited output:

- Raw nonce.
- Raw authorization-record contents.
- Credentials, connection strings, hostnames, usernames, or database names.
- Environment values.
- Session tokens or response bodies.

## Post-Issuance Validation

Without copying raw values, the future script must verify:

- The record path matches the approved temporary pattern.
- The file is regular and owned by the current user.
- Mode is exactly `600`.
- Every required key appears exactly once.
- No unknown keys are present.
- `AUTHORIZATION_VERSION=1`.
- `ENVIRONMENT_CLASS=staging`.
- Baseline and candidate hashes match.
- `EXPECTED_REPLICA_STATE=PRIMARY`.
- `REQUIRE_READ_ONLY_SESSION=YES`.
- `CONSUMED=NO`.
- `EXECUTION_SCOPE=READ_ONLY_CATALOG_PREFLIGHT_ONLY`.
- `MIGRATION_EXECUTION_AUTHORIZED=NO`.
- Expiration is positive and no greater than the approved TTL.
- The nonce is nonempty but is never printed or copied.

## Result Classes

- `AUTHORIZATION_RECORD_ISSUED_ONE_USE`
- `AUTHORIZATION_RECORD_CONFLICT_FAIL_CLOSED`
- `AUTHORIZATION_RECORD_CREATION_FAILED`
- `AUTHORIZATION_RECORD_VALIDATION_FAILED`

## Stop Boundary

A successful issuance must stop immediately after the redacted validation package is prepared.

It must not:

- Open a credential descriptor.
- Invoke the preflight wrapper.
- Connect to PostgreSQL.
- Execute the SQL candidate.
- Run a forward or rollback migration.
- Deploy or publish anything.

## Cleanup and Recovery

On validation failure:

- Remove the newly created invalid record if its identity is positively known.
- Preserve the generator exit code.
- Copy the raw local failure log to the clipboard.
- Do not retry automatically.
- Leave the repository unchanged.

On successful issuance, retain the record only until its reviewed expiry or consumption phase.

## Gate Separation

- Phase 26YL planning artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Generator invocation: `NOT_AUTHORIZED`
- Authorization record issuance: `NOT_AUTHORIZED`
- Credential access or service-descriptor opening: `NOT_AUTHORIZED`
- Preflight wrapper invocation: `NOT_AUTHORIZED`
- Database connection or catalog execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YL_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_PLAN`
- `REQUEST_CHANGES_PHASE_26YL_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_PLAN`
- `REJECT_PHASE_26YL_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_PLAN`
