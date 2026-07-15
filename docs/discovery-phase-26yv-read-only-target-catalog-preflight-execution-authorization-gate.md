# AiFinder Phase 26YV — Read-Only Target Catalog Preflight Execution Authorization Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_RUNTIME_AUTHORIZATION`

## Baseline

- Repository commit: `c4aac7341ef0ecae641c1078c19b3d3af823cb57`
- Generator SHA-256: `179ca8b55cf88e4ba12b00a53ad9210d832d47b47151a6c4f6970350f8b73978`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Matching authorization-record paths currently present: `0`
- Authorization-record contents inspected: no

## Phase 26YU Disposition

Phase 26YU successfully issued one fresh staging authorization record with a maximum TTL of 300 seconds.

Because this Phase 26YV gate is prepared after that bounded window, the Phase 26YU record must be treated as expired unless a future execution runner proves that it remains unexpired through secure, nonce-safe validation. A stale record must never be reused.

## Purpose

Authorize, in a later separately reviewed runtime turn, exactly one staging-only, read-only target catalog preflight using:

- One freshly issued one-use authorization record.
- One operator-controlled pre-opened libpq service descriptor.
- The exact committed wrapper.
- The exact committed SQL candidate.
- A verified read-only PostgreSQL session.
- Redacted output only.

This gate does not perform any live effect.

## Required Runtime Sequence

1. Verify the repository is clean and synchronized at the reviewed commit.
2. Verify exact generator, wrapper, manifest, and SQL identities.
3. Classify and safely dispose of any expired authorization record under a separately approved cleanup scope.
4. Issue exactly one fresh staging record with a maximum TTL of 300 seconds.
5. Open the authorization record through a no-follow, owner-matched, mode-`600` descriptor.
6. Open the libpq service configuration through an operator-controlled descriptor without revealing its path or contents.
7. Atomically mark the authorization record `CONSUMED=YES` before any network connection.
8. Establish one staging PostgreSQL connection.
9. Verify the session is read-only before executing the candidate.
10. Apply narrowly bounded statement and lock timeouts.
11. Execute exactly the committed SQL candidate once.
12. Emit only redacted classifications.
13. Close descriptors and stop immediately.

## Credential Descriptor Contract

The future execution must not:

- Read application `.env` files.
- Accept passwords, service paths, hostnames, usernames, database names, connection strings, or nonces in command arguments.
- Print or copy descriptor contents.
- Persist credentials or service configuration under the repository or `/tmp`.
- Use an application service-role key unless a separately reviewed minimum-privilege classification explicitly authorizes it.

The operator-controlled descriptor must be opened outside the wrapper and inherited by descriptor number only.

## Authorization Consumption Contract

Before connecting:

- Record path must match the approved temporary pattern.
- File must be regular, non-symlink, owner-matched, and mode `600`.
- Schema and identities must match the committed candidates.
- Environment must be `staging`.
- Scope must be `READ_ONLY_CATALOG_PREFLIGHT_ONLY`.
- Record must be unexpired and `CONSUMED=NO`.
- Nonce comparison must remain internal and never enter output or arguments.
- Consumption must be atomic and verified before the connection attempt.

A consumed record may not be retried even if the database connection fails.

## Read-Only Session Contract

The future runner must fail closed unless it verifies:

- Target environment classification is staging.
- Role classification permits only the finite catalog-read scope.
- `transaction_read_only` is enabled.
- Transaction state cannot perform writes.
- Statement timeout is narrowly bounded.
- Lock timeout is narrowly bounded.
- Exactly one committed SQL candidate is executed.
- No application tables, row data, secrets, sessions, credentials, DDL, DML, policy changes, grants, ownership changes, functions, migrations, or routes are reachable.

## Redacted Evidence Contract

Allowed output:

- Result class.
- Commit and file identities.
- Environment classification.
- Descriptor presence classifications.
- Authorization consumption status.
- Role classification without role name.
- Read-only session assertion.
- Timeout classifications.
- Finite catalog target classifications.
- Exit status and bounded row-count classification.

Forbidden output:

- Nonce or raw authorization record.
- Service descriptor contents or path.
- Host, port, role name, username, database name, password, URL, or connection string.
- Environment values.
- Raw catalog values beyond separately approved classifications.
- Application rows, sessions, tokens, or response bodies.

## Result Classes

- `AUTHORIZATION_RECORD_EXPIRED`
- `FRESH_AUTHORIZATION_REQUIRED`
- `CREDENTIAL_DESCRIPTOR_NOT_AUTHORIZED`
- `AUTHORIZATION_CONSUMPTION_FAILED`
- `DATABASE_CONNECTION_FAILED_CLOSED`
- `READ_ONLY_SESSION_NOT_ESTABLISHED`
- `CATALOG_PREFLIGHT_PASSED`
- `CATALOG_PREFLIGHT_FAILED_CLOSED`

## Mandatory Stop Boundary

The execution stops after the redacted catalog evidence package.

It does not authorize:

- Forward or rollback migrations.
- Database writes or policy changes.
- Admin routes or application server startup.
- Candidate staging, queue, or decisions.
- Publishing, deployment, operational reactivation, or public launch.

## Gate Separation

- Phase 26YV artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Expired-record cleanup: `NOT_AUTHORIZED`
- Fresh authorization issuance: `NOT_AUTHORIZED`
- Credential descriptor access: `NOT_AUTHORIZED`
- Authorization-record consumption: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YV_READ_ONLY_CATALOG_PREFLIGHT_EXECUTION_GATE`
- `REQUEST_CHANGES_PHASE_26YV_READ_ONLY_CATALOG_PREFLIGHT_EXECUTION_GATE`
- `REJECT_PHASE_26YV_READ_ONLY_CATALOG_PREFLIGHT_EXECUTION_GATE`
