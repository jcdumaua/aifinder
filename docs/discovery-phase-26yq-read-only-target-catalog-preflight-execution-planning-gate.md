# AiFinder Phase 26YQ — Read-Only Target Catalog Preflight Execution Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Repository commit: `3ae4eaaa067ed3192aeebe2f3c972c81d750adf1`
- Generator SHA-256: `15dc3d177a648e2ed44d361cfa90f900b225a76627dfb3bffe638db461fe9350`
- Wrapper SHA-256: `b2c8b881603d1fab6d6bac7c959f244fbc8a147a7afb81497b6b45bec9dce15f`
- Detached manifest SHA-256: `32b61f42eb25dd68387e258bf1ff40d5a27cc3e9dd296fc6be554da6a4180c12`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Wrapper `exit 93`: active
- Manifest `LIVE_EXECUTION_AUTHORIZED`: `NO`
- Authorization-record paths currently present in `/tmp`: `0`
- Authorization-record contents inspected: no

## Phase 26YP Result

Phase 26YP successfully issued and redacted-validated one staging authorization record with a maximum lifetime of 300 seconds.

Because this planning gate occurs after that bounded issuance window, the Phase 26YP record must be treated as expired unless a later execution script proves validity using nonce-safe, non-logging checks. It must not be reused merely because its path still exists.

## Purpose

Define the exact future execution sequence for a live, read-only target catalog preflight while preserving credential isolation, one-use authorization, nonce secrecy, fail-closed consumption, and zero mutation.

This phase is documentation-only. It does not access the authorization record contents, credentials, environment values, a service descriptor, PostgreSQL, or the SQL candidate.

## Required Pre-Execution Sequence

A later execution package must perform these gates in order:

1. Confirm a clean, synchronized repository at the exact reviewed commit.
2. Verify generator, wrapper, manifest, and SQL identities and modes.
3. Classify every matching authorization record as absent, expired, consumed, malformed, or eligible without printing its nonce.
4. Remove only expired or malformed records under a separately reviewed cleanup authorization.
5. Issue exactly one fresh staging record with a narrowly reviewed TTL.
6. Open the fresh record through a pre-opened file descriptor with owner and mode checks.
7. Validate all non-secret fields and compare the nonce internally without placing it in process arguments, logs, clipboard data, or terminal output.
8. Atomically consume the record before any database connection attempt.
9. Open the libpq service descriptor through a separately supplied pre-opened file descriptor.
10. Verify the target session is read-only before running the catalog query.
11. Execute exactly the committed SQL candidate.
12. Emit only classified, redacted results.
13. Close all descriptors and stop before any migration or application operation.

## Authorization-Record Disposition Contract

The future workflow must not assume the Phase 26YP record is usable.

Allowed classifications:

- `ABSENT`
- `EXPIRED_UNCONSUMED`
- `CONSUMED`
- `MALFORMED_FAIL_CLOSED`
- `FRESH_ELIGIBLE_ONE_USE`

A stale record must never be refreshed, extended, or edited in place.

Cleanup of an expired record requires an explicit narrow phase. Cleanup must identify the exact path without printing record contents and must refuse symlinks, ownership mismatches, non-regular files, or mode drift.

## Wrapper Activation Requirements

Before a future live preflight, the wrapper requires a separately reviewed change package that:

- Removes only the remaining `exit 93` runtime guard.
- Preserves detached-manifest identity checks.
- Accepts the authorization record and libpq service configuration only through pre-opened file descriptors.
- Never accepts a nonce, password, service path, or connection string in process arguments.
- Never opens `.env` files or prints environment values.
- Marks the one-use record consumed atomically before connection.
- Refuses expired, reused, malformed, or mismatched records.
- Keeps the SQL candidate read-only and immutable.

## Credential and Service-Role Isolation

The future preflight must:

- Use no service-role key in shell arguments, logs, clipboard data, or repository files.
- Avoid reading application environment files.
- Use a pre-opened libpq service descriptor supplied by an explicitly authorized operator-controlled step.
- Restrict the database identity to the minimum role needed for catalog reads.
- Verify the session transaction is read-only before the target query.
- Refuse any role or target whose classification cannot be established without exposing values.

## Live Read-Only Session Contract

The future connection phase must establish and verify:

- The intended environment class is staging.
- The connection is to the reviewed target class.
- `transaction_read_only` is enabled.
- No transaction can perform writes.
- No DDL, DML, policy mutation, migration, function invocation, or application route call is reachable.
- Statement timeout and lock timeout are narrowly bounded.
- Exactly one SQL candidate is supplied through standard input or a pre-opened descriptor.
- Query output is classified and redacted before terminal or clipboard use.

## SQL Scope

The committed SQL candidate may inspect only its explicit, finite catalog targets.

It must not:

- Scan unrestricted sequence catalogs.
- Read application rows.
- Read secrets, credentials, environment values, session data, or response bodies.
- Modify schemas, roles, policies, grants, ownership, sequences, tables, views, functions, or data.
- Invoke the forward or rollback migration.

## Result Classes

- `READ_ONLY_PREFLIGHT_NOT_EXECUTED`
- `AUTHORIZATION_RECORD_EXPIRED`
- `AUTHORIZATION_RECORD_CONSUMPTION_FAILED`
- `CREDENTIAL_DESCRIPTOR_NOT_AUTHORIZED`
- `TARGET_CLASSIFICATION_FAILED`
- `READ_ONLY_SESSION_NOT_ESTABLISHED`
- `CATALOG_PREFLIGHT_PASSED`
- `CATALOG_PREFLIGHT_FAILED_CLOSED`

## Stop Boundary

A successful future preflight stops after the redacted target classification and catalog evidence package is prepared.

It does not authorize:

- Forward or rollback migration execution.
- RLS policy mutation.
- Service-role application access.
- Admin route execution.
- Application server startup.
- Deployment, publishing, operational reactivation, or public launch.

## Gate Separation

- Phase 26YQ artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Expired-record cleanup: `NOT_AUTHORIZED`
- Fresh authorization issuance: `NOT_AUTHORIZED`
- Wrapper `exit 93` removal: `NOT_AUTHORIZED`
- Credential or service-descriptor access: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YQ_READ_ONLY_TARGET_CATALOG_PREFLIGHT_EXECUTION_PLAN`
- `REQUEST_CHANGES_PHASE_26YQ_READ_ONLY_TARGET_CATALOG_PREFLIGHT_EXECUTION_PLAN`
- `REJECT_PHASE_26YQ_READ_ONLY_TARGET_CATALOG_PREFLIGHT_EXECUTION_PLAN`
