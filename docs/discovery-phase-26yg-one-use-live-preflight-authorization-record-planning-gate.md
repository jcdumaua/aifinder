# AiFinder Phase 26YG — One-Use Live Preflight Authorization Record Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YF commit: `28f2a48a9f757c769ffb382fd9208b70580d3b06`
- Wrapper path: `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh`
- Wrapper SHA-256: `b2c8b881603d1fab6d6bac7c959f244fbc8a147a7afb81497b6b45bec9dce15f`
- Wrapper Git blob: `dc4eca28ca4f68ccb19b5ba459c7404477493141`
- Detached manifest path: `scripts/_drafts/discovery-phase-26ye-reviewed-wrapper-identity-manifest.txt`
- Detached manifest SHA-256: `32b61f42eb25dd68387e258bf1ff40d5a27cc3e9dd296fc6be554da6a4180c12`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Wrapper `exit 93`: active
- Detached manifest `LIVE_EXECUTION_AUTHORIZED`: `NO`

## Purpose

Define the exact non-secret, short-lived, one-use authorization-record format and issuance controls required before a later phase may consider a live read-only catalog preflight.

This planning gate does not create an authorization record, generate a nonce, access a credential, open a service descriptor, connect to PostgreSQL, execute the SQL candidate, or authorize migration execution.

## Proposed Record Path

A future issuance phase may create exactly one temporary record matching:

`/tmp/aifinder-phase-26yc-authorization-<timestamp>-<random-id>.txt`

The file must:

- Be created with mode `600`.
- Be owned by the invoking local user.
- Be created using exclusive creation semantics.
- Contain no credential, hostname, username, password, connection string, token, or database name.
- Be removed after successful consumption or expiration.
- Never be committed to Git.

## Proposed Record Schema

```text
AUTHORIZATION_VERSION=1
AUTHORIZATION_NONCE=<cryptographically-random-one-use-value>
ENVIRONMENT_CLASS=<local|preview|staging|production>
APPROVED_COMMIT=28f2a48a9f757c769ffb382fd9208b70580d3b06
SQL_SHA256=b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b
WRAPPER_SHA256=b2c8b881603d1fab6d6bac7c959f244fbc8a147a7afb81497b6b45bec9dce15f
MANIFEST_SHA256=32b61f42eb25dd68387e258bf1ff40d5a27cc3e9dd296fc6be554da6a4180c12
EXPECTED_REPLICA_STATE=<PRIMARY|REPLICA>
REQUIRE_READ_ONLY_SESSION=YES
ISSUED_EPOCH=<integer>
EXPIRES_EPOCH=<integer>
CONSUMED=NO
EXECUTION_SCOPE=READ_ONLY_CATALOG_PREFLIGHT_ONLY
MIGRATION_EXECUTION_AUTHORIZED=NO
```

## Issuance Requirements

A future issuance script must:

1. Verify the exact repository baseline, wrapper, SQL, and manifest identities.
2. Verify the wrapper still contains `exit 93`.
3. Verify the detached manifest still states `LIVE_EXECUTION_AUTHORIZED=NO`.
4. Accept the environment class only as an explicit argument.
5. Generate the nonce locally using a cryptographically secure operating-system source.
6. Set a narrowly bounded expiration.
7. Use exclusive file creation and mode `600`.
8. Print only the record path, expiration classification, and non-secret scope.
9. Never print the nonce in terminal output or logs.
10. Copy a redacted issuance review package rather than the raw record.
11. Preserve the original exit code and copy the raw failure log on failure.
12. Refuse issuance if any existing unexpired record matches the same baseline and environment class.

## Consumption Requirements

A later, separately authorized execution phase must:

- Receive the nonce through a channel that does not expose it in logs or process listings.
- Compare the record identities to the committed baseline.
- Mark or replace `CONSUMED=NO` atomically before any connection attempt.
- Refuse reused, expired, malformed, or mismatched records.
- Remove the record after terminal success or terminal failure unless retention is separately required for incident review.
- Never treat record validity as migration-execution authorization.

## Expiration Contract

The authorization lifetime must be short and explicitly reviewed. The default proposed maximum is five minutes from issuance.

No automatic renewal or retry is allowed. An expired record requires a new issuance phase and a new independent authorization.

## Environment Classification

The issuance phase may record one of:

- `local`
- `preview`
- `staging`
- `production`

Production classification must require a distinct explicit approval and must never be inferred from credentials, hostnames, environment files, or repository configuration.

## Mandatory Failure Conditions

Issuance must fail closed if:

- Repository identity or candidate hashes drift.
- The wrapper or manifest has uncommitted changes.
- `exit 93` is absent.
- The manifest authorizes live execution.
- The requested environment class is missing or invalid.
- Secure randomness is unavailable.
- Exclusive mode-`600` file creation cannot be guaranteed.
- The expiration exceeds the reviewed maximum.
- A conflicting valid record already exists.
- Any secret-bearing value could enter logs, clipboard output, Git, or process arguments.

## Gate Separation

- Phase 26YG planning artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Authorization-record implementation: `NOT_AUTHORIZED`
- Authorization-record issuance: `NOT_AUTHORIZED`
- Wrapper `exit 93` removal: `NOT_AUTHORIZED`
- Credential access or service-descriptor opening: `NOT_AUTHORIZED`
- Database connection or catalog execution: `NOT_AUTHORIZED`
- Forward or rollback migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YG_ONE_USE_AUTHORIZATION_RECORD_PLAN`
- `REQUEST_CHANGES_PHASE_26YG_ONE_USE_AUTHORIZATION_RECORD_PLAN`
- `REJECT_PHASE_26YG_ONE_USE_AUTHORIZATION_RECORD_PLAN`
