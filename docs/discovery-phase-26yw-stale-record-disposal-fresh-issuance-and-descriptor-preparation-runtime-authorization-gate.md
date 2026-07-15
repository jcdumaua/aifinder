# AiFinder Phase 26YW — Stale Record Disposal, Fresh Issuance, and Descriptor Preparation Runtime Authorization Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_RUNTIME_AUTHORIZATION`

## Baseline

- Phase 26YV commit: `d7a108d53e9634b6baa0bdd984412c295e24ad77`
- Generator SHA-256: `179ca8b55cf88e4ba12b00a53ad9210d832d47b47151a6c4f6970350f8b73978`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Matching temporary authorization-record paths present: `0`
- Authorization-record contents inspected: no

## Purpose

Authorize a later runtime turn limited to preparation for one live staging read-only catalog preflight.

The future turn may:

1. Classify and remove only eligible expired or consumed authorization records.
2. Issue exactly one fresh staging authorization record with a maximum TTL of 300 seconds.
3. Validate the record without exposing its nonce.
4. Confirm that an operator-controlled libpq service descriptor can be prepared through a pre-opened file descriptor.
5. Stop before wrapper invocation, database connection, or SQL execution.

This gate itself performs no runtime effect.

## Stage A — Temporary Record Classification

Allowed target pattern:

`/tmp/aifinder-phase-26yc-authorization-*.txt`

A future runner may inspect only:

- Path identity.
- Regular-file classification.
- Symlink classification.
- Owner-match classification.
- Mode classification.
- Schema completeness.
- Expiration and consumed-state classifications.

The nonce and raw record must never be printed, logged, copied, or passed through process arguments.

## Stage B — Safe Disposal

A record may be unlinked only when:

- It matches the approved path pattern.
- It is a regular non-symlink file.
- It is owned by the invoking user.
- Its mode is exactly `600`.
- Its schema is complete and contains no unknown keys.
- It is expired or already consumed.
- Its device and inode remain unchanged through validation and unlink.

A fresh unconsumed record causes a fail-closed stop.

## Stage C — Fresh Issuance

After eligible cleanup, the future runner may execute exactly once:

```text
bash scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh \
  --environment-class staging \
  --ttl-seconds 300
```

Automatic retry is prohibited.

The resulting record must be validated for:

- Regular file, non-symlink, owner match, and mode `600`.
- Exact reviewed wrapper, manifest, and SQL identities.
- Environment `staging`.
- Scope `READ_ONLY_CATALOG_PREFLIGHT_ONLY`.
- `CONSUMED=NO`.
- `MIGRATION_EXECUTION_AUTHORIZED=NO`.
- Positive TTL not exceeding 300 seconds.
- Nonce presence with complete redaction.

## Stage D — Credential Descriptor Preparation

A later runtime runner may verify descriptor readiness only under these conditions:

- The descriptor is opened by the operator outside the wrapper.
- Only the numeric descriptor is inherited.
- No service path, host, port, role, username, database name, password, URL, or connection string is passed in command arguments.
- No application `.env` file is opened.
- No descriptor contents are printed or copied.
- The service configuration is not persisted in the repository or a new temporary file.
- The role classification is confirmed as acceptable for the finite read-only catalog scope without exposing the role name.

This phase does not authorize a database connection.

## Mandatory Stop Boundary

The future Phase 26YW runtime turn must stop after:

- Eligible stale-record disposal.
- One fresh token issuance and redacted validation.
- Non-secret credential-descriptor readiness classification.

It must not:

- Consume the fresh record.
- Invoke the preflight wrapper.
- Connect to PostgreSQL.
- Execute the SQL candidate.
- Run migrations.
- Start application servers.
- Deploy, publish, or reactivate operations.

## Result Classes

- `NO_STALE_RECORD_PRESENT`
- `EXPIRED_RECORD_REMOVED`
- `CONSUMED_RECORD_REMOVED`
- `STALE_RECORD_DISPOSITION_FAILED_CLOSED`
- `FRESH_AUTHORIZATION_ISSUED_ONE_USE`
- `FRESH_AUTHORIZATION_FAILED`
- `CREDENTIAL_DESCRIPTOR_READY_REDACTED`
- `CREDENTIAL_DESCRIPTOR_NOT_READY`

## Gate Separation

- Phase 26YW artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Temporary-record classification and cleanup: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Fresh token issuance: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Credential descriptor preparation: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Authorization consumption: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YW_RUNTIME_PREPARATION_AUTHORIZATION_GATE`
- `REQUEST_CHANGES_PHASE_26YW_RUNTIME_PREPARATION_AUTHORIZATION_GATE`
- `REJECT_PHASE_26YW_RUNTIME_PREPARATION_AUTHORIZATION_GATE`
