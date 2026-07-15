# AiFinder Phase 26YJ — One-Use Authorization Record Issuance Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YI commit: `77efeb11dbf3f4c02dbd3abed2f7e2c8314f4d95`
- Generator path: `scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh`
- Generator SHA-256: `eea0204cc17df43242b10c38d0accf51254313308f909f42da74761b29890ec3`
- Generator mode: `644`
- Generator `exit 90`: present and active
- Branch synchronized with `origin/main`: yes

## Purpose

Define the exact, bounded issuance protocol for a future one-use read-only preflight authorization record.

This planning gate does not remove the generator guard, execute the generator, generate a nonce, create an authorization record, access credentials, open a service descriptor, connect to PostgreSQL, or run catalog queries.

## Required Inputs for a Future Issuance

The future issuance phase must receive only:

- Explicit environment class: `local`, `preview`, `staging`, or `production`.
- Explicit TTL from 1 to 300 seconds.
- A separate execution authorization token or reviewed invocation record.
- The exact committed repository baseline and generator SHA-256.

Production issuance must require distinct explicit authorization and must not be inferred.

## Authorized Future File Mutation

A later implementation phase may modify exactly one file:

`scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh`

The allowed source change is limited to removing the single active `exit 90` no-issuance block that currently precedes the reviewed secure creation engine.

No other generator logic may change unless separately reviewed.

## Issuance Execution Contract

A future live issuance phase must:

1. Verify the exact commit, branch, origin synchronization, generator path, mode, and SHA-256.
2. Verify the wrapper, SQL candidate, and detached identity manifest remain unchanged.
3. Confirm no existing authorization record is present without an explicit disposition.
4. Remove only the reviewed no-issuance guard in a local, reviewable change.
5. Obtain Gemini approval of the exact guard-removal diff.
6. Commit and push the activated generator only after review.
7. Invoke the generator exactly once with explicit environment class and TTL.
8. Capture only redacted output: record path, expiration classification, and scope.
9. Never print or copy the nonce.
10. Verify the resulting file is regular, owner-matched, mode `600`, schema-complete, and unexpired.
11. Keep the authorization record outside Git.
12. Stop before any database connection.

## Required Issuance Result Classes

- `AUTHORIZATION_RECORD_ISSUED_ONE_USE`
- `AUTHORIZATION_RECORD_CONFLICT_FAIL_CLOSED`
- `AUTHORIZATION_RECORD_CREATION_FAILED`
- `AUTHORIZATION_RECORD_VALIDATION_FAILED`

Issuance success does not authorize a database connection or catalog query.

## Post-Issuance Review Package

The review package may include:

- Repository commit and candidate hashes.
- Generator invocation exit status.
- Environment class.
- TTL classification.
- Record path.
- File mode and ownership classification.
- Schema-key presence checks.
- Expiration remaining classification.
- Confirmation that the nonce was not printed.
- Confirmation that no credentials or database connections were used.

It must not include the raw authorization record or nonce.

## Mandatory Failure Conditions

Issuance must fail closed if:

- The repository baseline or candidate identities drift.
- The generator guard-removal diff includes any unapproved change.
- The working tree contains unrelated modifications.
- The environment class or TTL is invalid.
- A conflicting authorization record exists.
- Secure exclusive file creation is unavailable.
- The record path, owner, mode, schema, or expiry validation fails.
- The nonce could enter logs, terminal output, clipboard, process arguments, or Git.
- Any credential access, database client, migration runner, deployment, or publishing path becomes reachable.

## Gate Separation

- Phase 26YJ planning artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Generator guard removal: `NOT_AUTHORIZED`
- Activated generator commit: `NOT_AUTHORIZED`
- Authorization record issuance: `NOT_AUTHORIZED`
- Credential access or service-descriptor opening: `NOT_AUTHORIZED`
- Database connection or catalog execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YJ_AUTHORIZATION_RECORD_ISSUANCE_PLAN`
- `REQUEST_CHANGES_PHASE_26YJ_AUTHORIZATION_RECORD_ISSUANCE_PLAN`
- `REJECT_PHASE_26YJ_AUTHORIZATION_RECORD_ISSUANCE_PLAN`
