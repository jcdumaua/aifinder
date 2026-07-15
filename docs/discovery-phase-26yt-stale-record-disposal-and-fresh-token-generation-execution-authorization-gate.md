# AiFinder Phase 26YT — Stale Record Disposal and Fresh Token Generation Execution Authorization Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_RUNTIME_AUTHORIZATION`

## Baseline

- Phase 26YS commit: `df4a72d756e45ab7745116c580b0a4faf8dd6e19`
- Generator SHA-256: `15dc3d177a648e2ed44d361cfa90f900b225a76627dfb3bffe638db461fe9350`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Matching temporary authorization-record paths currently present: `0`
- Authorization-record contents inspected: no

## Purpose

Authorize, in a later separately approved runtime turn, only these effects:

1. Classify matching temporary authorization-record paths without printing their contents.
2. Remove only positively identified expired records that are regular, owner-matched, and mode `600`.
3. Execute the committed generator exactly once for `staging`.
4. Issue one fresh authorization record with a maximum TTL of 300 seconds.
5. Validate and report only redacted non-secret metadata.
6. Stop before credential access, wrapper invocation, database connection, or SQL execution.

This gate does not perform any of those effects.

## Proposed Runtime Scope

### Stage A — Path Classification

The future execution script may inspect only filesystem metadata for paths matching:

`/tmp/aifinder-phase-26yc-authorization-*.txt`

Permitted metadata:

- Exact path.
- Regular-file classification.
- Owner-match classification.
- Mode classification.
- Modification-time classification.
- Record count.

The path may be opened only through a secure no-follow descriptor for internal schema and expiry validation. Raw values and the nonce must never be printed or copied.

### Stage B — Expired-Record Disposal

Removal is authorized only if all conditions are verified:

- Path matches the approved pattern.
- File is regular.
- File is not a symbolic link.
- Owner matches the invoking user.
- Mode is exactly `600`.
- Schema is complete and contains no unknown keys.
- Record is expired or already consumed.
- Exact path identity remains stable between validation and unlink.
- The nonce is never emitted.

Malformed, owner-mismatched, mode-drifted, non-regular, or ambiguous files must fail closed and remain untouched.

### Stage C — Fresh One-Use Issuance

After stale-state clearance, the future execution may invoke exactly:

```text
bash scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh \
  --environment-class staging \
  --ttl-seconds 300
```

Execution count: exactly one.

Automatic retry: prohibited.

### Stage D — Redacted Validation

The future execution must validate:

- Exactly one fresh record exists.
- Path matches the approved pattern.
- File is regular and owner-matched.
- Mode is exactly `600`.
- Required keys appear exactly once.
- No unknown keys appear.
- Environment class is `staging`.
- Scope is `READ_ONLY_CATALOG_PREFLIGHT_ONLY`.
- `CONSUMED=NO`.
- `MIGRATION_EXECUTION_AUTHORIZED=NO`.
- TTL is positive and no greater than 300 seconds.
- Nonce is present but never printed, logged, copied, or passed as an argument.

## Mandatory Stop Boundary

The future execution must stop immediately after the redacted fresh-record validation package is prepared.

It must not:

- Open a libpq service descriptor.
- Read application environment files.
- Access database credentials.
- Invoke the preflight wrapper.
- Connect to PostgreSQL.
- Execute the SQL candidate.
- Run any migration.
- Start an application server.
- Deploy, publish, or reactivate operations.

## Result Classes

- `NO_STALE_RECORD_PRESENT`
- `EXPIRED_RECORD_REMOVED`
- `CONSUMED_RECORD_REMOVED`
- `STALE_RECORD_DISPOSITION_FAILED_CLOSED`
- `FRESH_AUTHORIZATION_ISSUED_ONE_USE`
- `FRESH_AUTHORIZATION_CREATION_FAILED`
- `FRESH_AUTHORIZATION_VALIDATION_FAILED`

## Failure Handling

On failure:

- Preserve the original command exit code.
- Do not retry.
- Remove only a newly created invalid record whose exact identity is positively known.
- Never copy a log that might contain the nonce or raw record.
- Leave repository files unchanged.
- Do not proceed to credentials or database activity.

## Gate Separation

- Phase 26YT artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Temporary-record classification: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Expired-record removal: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Fresh generator invocation: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Fresh token generation: `NOT_AUTHORIZED_PENDING_EXPLICIT_RUNTIME_AUTHORIZATION`
- Credential access: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YT_STALE_RECORD_DISPOSAL_AND_FRESH_TOKEN_EXECUTION_GATE`
- `REQUEST_CHANGES_PHASE_26YT_STALE_RECORD_DISPOSAL_AND_FRESH_TOKEN_EXECUTION_GATE`
- `REJECT_PHASE_26YT_STALE_RECORD_DISPOSAL_AND_FRESH_TOKEN_EXECUTION_GATE`
