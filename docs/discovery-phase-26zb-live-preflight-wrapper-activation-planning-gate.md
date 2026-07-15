# AiFinder Phase 26ZB — Live Preflight Wrapper Activation Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26ZA commit: `7bcc10f62938df6d219bc97b52317f3f25e2e3fd`
- Wrapper SHA-256: `b68eefc8bd3d29bf46901570fb96d92e445fb11ed2d2d1525075e29b2cf73fdd`
- Wrapper Git blob: `0551f26cbf650f68c9d4d7aa0320baff20889fd0`
- Manifest SHA-256: `4d5563c3fc7c1c6f3fb387229dff2415e84d788d2893ef0eaa98975e11e20a44`
- Generator SHA-256: `1dc989e15a8e23fd269eb1af52dd060f1682c758fd0c0fadcd53e02eb875f474`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`

## Verified Activation Locks

The committed runtime chain is hardened but still intentionally inert:

- The wrapper's reviewed `psql` sequence remains commented.
- The detached manifest contains `WRAPPER_EXIT_93_REQUIRED=YES`.
- The detached manifest contains `LIVE_EXECUTION_AUTHORIZED=NO`.
- Therefore, Phase 26ZA approval alone cannot produce a live database connection.

## Purpose

Plan the minimum exact-scope activation revision required before any runtime execution.

The future activation revision may modify only:

1. The wrapper's inert exit-93 boundary and commented `psql` prototype.
2. The detached manifest's activation fields and wrapper identities.
3. The generator's wrapper and manifest identity bindings.

The SQL candidate must remain unchanged.

## Required Activation Revision

The future review-only revision must:

- Replace only the reviewed inert exit-93 boundary with the hardened `psql` invocation.
- Preserve descriptor-only inputs:
  - `--service-fd <N>`
  - `--authorization-fd <M>`
- Preserve staging-only environment enforcement.
- Preserve nonce redaction.
- Preserve the read-only session assertion.
- Preserve 10-second statement timeout.
- Preserve 5-second lock timeout.
- Preserve one SQL candidate execution.
- Update the manifest to:
  - `WRAPPER_EXIT_93_REQUIRED=NO`
  - `LIVE_EXECUTION_AUTHORIZED=YES`
- Recalculate wrapper SHA-256 and Git blob.
- Recalculate manifest SHA-256.
- Rebind generator identities.
- Remain unexecuted and uncommitted pending Gemini review.

## Additional Required Review

Before approval, Gemini must verify:

- The active `psql` block executes before any success evidence is written.
- Any nonzero `psql` status fails closed.
- No raw catalog rows, connection identifiers, credentials, or environment values reach logs.
- The authorization record is consumed atomically before the database connection.
- The descriptor-backed authorization payload is not reused.
- The wrapper still permits exactly one database connection and one SQL candidate execution.

## Current Boundary

- Wrapper activation revision: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Operator service descriptor opening: `NOT_AUTHORIZED`
- Temporary-record cleanup: `NOT_AUTHORIZED`
- Fresh token issuance: `NOT_AUTHORIZED`
- Authorization consumption: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZB_LIVE_PREFLIGHT_WRAPPER_ACTIVATION_PLAN`
- `REQUEST_CHANGES_PHASE_26ZB_LIVE_PREFLIGHT_WRAPPER_ACTIVATION_PLAN`
- `REJECT_PHASE_26ZB_LIVE_PREFLIGHT_WRAPPER_ACTIVATION_PLAN`
