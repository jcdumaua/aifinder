# AiFinder Phase 26YM — One-Use Authorization Record Issuance Execution Authorization Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_RUNTIME_AUTHORIZATION`

## Baseline

- Phase 26YL commit: `4b3221d63f7c254e3b2f17c849399b5b469036b2`
- Generator path: `scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh`
- Generator SHA-256: `3942d6a85787639d2c2ed6997b61245ad5bbfe7b0347ff5cd5931ba475fd3b01`
- Generator mode: `644`
- Branch synchronized with `origin/main`: yes

## Purpose

Authorize, in a later separately approved execution turn, exactly one local invocation of the activated authorization-record generator for the staging environment.

This gate does not execute the generator, create a nonce, create an authorization record, access credentials, open a service descriptor, invoke the preflight wrapper, connect to PostgreSQL, or execute catalog SQL.

## Proposed Runtime Authorization

The requested future runtime authorization is narrowly limited to:

```text
bash scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh \
  --environment-class staging \
  --ttl-seconds 300
```

Execution count: exactly one.

Automatic retry: prohibited.

## Explicitly Authorized Effects

Only after Gemini approval and explicit runtime authorization:

- Generate one cryptographically random nonce in process memory.
- Create one temporary authorization record under:
  `/tmp/aifinder-phase-26yc-authorization-*.txt`
- Use exclusive creation semantics.
- Set and verify mode `600`.
- Write only the reviewed non-secret schema plus the one-use nonce.
- Return only redacted metadata: record path, expiration, and scope.

## Explicitly Prohibited Effects

The issuance turn must not:

- Print, log, copy, or expose the nonce.
- Read environment files or values.
- Access database credentials.
- Open a libpq service descriptor.
- Invoke the preflight wrapper.
- Connect to PostgreSQL.
- Execute the SQL candidate.
- Run a migration.
- Start an application server.
- Deploy, publish, or reactivate operations.

## Pre-Execution Requirements

Before invocation, the future execution script must verify:

1. Exact Phase 26YL commit and synchronization with `origin/main`.
2. Clean working tree.
3. Exact generator SHA-256 and mode.
4. Exact wrapper, manifest, and SQL identities.
5. Wrapper `exit 93` remains active.
6. Manifest `LIVE_EXECUTION_AUTHORIZED=NO`.
7. No existing authorization record exists.
8. No concurrent issuance lock exists.
9. Environment class is exactly `staging`.
10. TTL is exactly `300` seconds unless Gemini approves a narrower value.

## Post-Execution Validation

The future execution must validate without printing raw values:

- Exactly one record was created.
- Path matches the approved pattern.
- File is regular.
- Owner matches the invoking user.
- Mode is exactly `600`.
- Required schema keys appear exactly once.
- No unknown keys appear.
- Baseline and candidate hashes match.
- Environment class is `staging`.
- Scope is `READ_ONLY_CATALOG_PREFLIGHT_ONLY`.
- `MIGRATION_EXECUTION_AUTHORIZED=NO`.
- `CONSUMED=NO`.
- Expiration is positive and no greater than 300 seconds.
- Nonce is present but never emitted.

## Stop Boundary

The execution must stop immediately after producing a redacted issuance validation package for Gemini.

The created record does not authorize a database connection by itself. A separate later phase must govern credential access, wrapper activation, record consumption, and live read-only preflight execution.

## Failure Handling

On failure:

- Preserve the original generator exit code.
- Remove only a newly created invalid record whose path is positively identified.
- Do not retry.
- Copy the raw failure log to the clipboard only if it contains no nonce or raw record contents.
- Leave repository files unchanged.

## Gate Separation

- Phase 26YM artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Generator invocation: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Authorization record issuance: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Credential access: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection or catalog query: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YM_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_GATE`
- `REQUEST_CHANGES_PHASE_26YM_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_GATE`
- `REJECT_PHASE_26YM_ONE_USE_AUTHORIZATION_ISSUANCE_EXECUTION_GATE`
