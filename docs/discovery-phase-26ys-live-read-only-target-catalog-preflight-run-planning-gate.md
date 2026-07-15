# AiFinder Phase 26YS — Live Read-Only Target Catalog Preflight Run Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_RUNTIME_AUTHORIZATION`

## Baseline

- Phase 26YR commit: `6a4cd4b48a6e63f05997427bd5b154c9960c0fcd`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Manifest `LIVE_EXECUTION_AUTHORIZED`: `NO`
- Matching temporary authorization-record paths present: `0`
- Authorization-record contents inspected: no

## Purpose

Define the exact phased execution package for a live staging-only, read-only target catalog preflight.

This planning gate does not remove temporary files, generate an authorization record, access credentials, open a service descriptor, invoke the wrapper, connect to PostgreSQL, or execute SQL.

## Required Phase Separation

The live preflight must not be performed as one uncontrolled command. It requires these independently reviewed stages:

1. **Temporary-record disposition**
   - Classify matching paths without printing record contents or nonces.
   - Remove only positively identified expired records that are regular, owner-matched, and mode `600`.
   - Refuse symlinks, ownership drift, mode drift, malformed paths, or ambiguous state.

2. **Fresh one-use staging authorization**
   - Issue exactly one fresh record.
   - Use an explicitly reviewed TTL.
   - Verify schema, ownership, mode, expiration, and scope without exposing the nonce.
   - Do not reuse the earlier Phase 26YP record.

3. **Credential descriptor preparation**
   - Use an operator-controlled, pre-opened descriptor.
   - Do not place service paths, passwords, usernames, hostnames, database names, or connection strings in shell arguments, logs, clipboard output, or Git.
   - Do not read application `.env` files.
   - Establish that the selected database identity is limited to the reviewed catalog-read scope.

4. **Authorization consumption**
   - Pass the fresh record through a pre-opened descriptor.
   - Validate the nonce internally.
   - Atomically mark the record consumed before any connection attempt.
   - Refuse expired, reused, malformed, mismatched, or already-consumed records.

5. **Live read-only preflight**
   - Invoke exactly the committed wrapper.
   - Verify the detached wrapper and SQL identities.
   - Establish a read-only transaction before the target query.
   - Apply narrowly bounded statement and lock timeouts.
   - Execute exactly the committed SQL candidate once.
   - Emit only redacted classification results.

6. **Immediate stop**
   - Close descriptors.
   - Remove or retain the consumed record only according to the reviewed retention contract.
   - Stop before migration execution, application routes, server startup, deployment, publishing, or operational reactivation.

## Runtime Authorization Required

A future phase must explicitly authorize each live effect:

- Cleanup of exact expired temporary record paths.
- Generation of one fresh staging authorization record.
- Opening of one operator-controlled libpq service descriptor.
- Opening and consuming one authorization-record descriptor.
- One staging database connection.
- One read-only execution of the exact SQL candidate.

Approval of this planning document alone does not authorize those effects.

## Wrapper and Manifest Contract

Before any invocation:

- Wrapper file must match SHA-256 `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`.
- Wrapper Git blob must match `c29e77be1ca272a60fca7c285b4f8b3367af2701`.
- Manifest must match SHA-256 `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`.
- SQL must match SHA-256 `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`.
- All three files must be committed, mode `644`, and locally unmodified.
- Local `HEAD` must equal `origin/main`.
- The wrapper must not open credentials or authorization records by path.
- Manifest `LIVE_EXECUTION_AUTHORIZED=NO` remains an at-rest lock and must not be edited merely to permit one invocation.

## Read-Only Database Contract

The future run must fail closed unless it can verify:

- Environment class is staging.
- Database role classification is acceptable for catalog-only reads.
- Transaction is read-only.
- Statement timeout is narrowly bounded.
- Lock timeout is narrowly bounded.
- Exactly one finite SQL candidate is executed.
- No DML, DDL, policy mutation, ownership change, grant change, function invocation, migration, or application data read is reachable.

## Redacted Evidence Contract

Allowed evidence:

- Result class.
- Commit and candidate hashes.
- Environment classification.
- Authorization state classification.
- File-descriptor classifications.
- Database role classification without role name.
- Read-only session assertion.
- Timeout classifications.
- Finite catalog target classifications.
- Query exit status and row-count classification.

Forbidden evidence:

- Nonce.
- Raw authorization record.
- Credentials.
- Service file contents or path.
- Hostname, username, database name, password, connection string, or environment values.
- Raw catalog values not explicitly approved.
- Application rows, sessions, tokens, or response bodies.

## Result Classes

- `STALE_RECORD_CLEANUP_REQUIRED`
- `FRESH_AUTHORIZATION_REQUIRED`
- `CREDENTIAL_DESCRIPTOR_NOT_AUTHORIZED`
- `AUTHORIZATION_CONSUMPTION_FAILED`
- `READ_ONLY_SESSION_NOT_ESTABLISHED`
- `CATALOG_PREFLIGHT_PASSED`
- `CATALOG_PREFLIGHT_FAILED_CLOSED`

## Gate Separation

- Phase 26YS artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Temporary-record cleanup: `NOT_AUTHORIZED`
- Fresh authorization issuance: `NOT_AUTHORIZED`
- Credential descriptor access: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YS_LIVE_READ_ONLY_PREFLIGHT_RUN_PLAN`
- `REQUEST_CHANGES_PHASE_26YS_LIVE_READ_ONLY_PREFLIGHT_RUN_PLAN`
- `REJECT_PHASE_26YS_LIVE_READ_ONLY_PREFLIGHT_RUN_PLAN`
