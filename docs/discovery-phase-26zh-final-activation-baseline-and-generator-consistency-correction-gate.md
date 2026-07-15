# AiFinder Phase 26ZH — Final Activation Baseline and Generator Consistency Correction Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Current synchronized commit: `4fc7cb4a8f5c095da4344efb66ac3580e46cd938`
- SQL SHA-256: `32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55`
- Activation-draft wrapper SHA-256: `38c19004ab7aca8dac718183b8ecfff9ef4ba3a4b8fc5b70d2c97a3697e9b6ae`
- Activation-draft wrapper Git blob: `2e8b8f3b0a4924503fa61733b42dd7312e735941`
- Activation-draft manifest SHA-256: `b26bb09f614b874bb5a5d015cc8b6968ee5c2b89deea1c161f5a768fb167ec7d`
- Activation-draft generator SHA-256: `12099e1a9eab2742212b8fd248b1773e9c3acc744cd58006db765bad95eb7f7c`

## Why the Approved Phase 26ZG Draft Must Not Yet Be Committed

A final cross-file consistency inspection found two runtime blockers that were outside the reviewed diff surface.

### Blocker 1 — Generator Still Enforces the Inert State

The generator still requires:

- The wrapper to contain `exit 93`.
- The manifest to contain `LIVE_EXECUTION_AUTHORIZED=NO`.

The Phase 26ZG activation draft intentionally removes the inert boundary and sets live authorization to `YES`.

Therefore, the approved activation draft and the generator's runtime preconditions are contradictory. If committed unchanged, the generator would refuse fresh token issuance.

### Blocker 2 — Wrapper Uses a Stale Exact Repository Baseline

The wrapper still binds:

- `approved_commit=b6c0c552844b2537b688f89fdd25892e25a4f4b0`

The wrapper requires both local `HEAD` and `origin/main` to equal that exact commit.

Any new commit containing the Phase 26ZG activation revision would necessarily produce a different commit identity, causing the activated wrapper to fail before the database connection.

The generator separately binds:

- `approved_commit=b67663f4502393912bb523b86e62ae04652f970c`

It writes that value into the authorization record, so the wrapper and generator must use the exact same final activation commit identity.

## Required Corrected Design

The activation revision cannot safely hard-code its own future Git commit SHA inside files that contribute to that commit, because this creates a circular identity dependency.

The corrected design must use a non-circular baseline contract.

### Recommended Contract

1. The detached manifest continues to bind exact wrapper, SQL, and activation fields.
2. The wrapper verifies:
   - Clean synchronized `main`.
   - Its own exact SHA-256 and Git blob against the committed manifest.
   - SQL identity against the committed manifest.
   - The manifest file is committed and unmodified.
3. The authorization record binds:
   - Wrapper SHA-256.
   - Manifest SHA-256.
   - SQL SHA-256.
   - Staging environment.
   - Expiry and one-use state.
4. The wrapper validates these identities from the authorization record.
5. The exact current Git commit may be recorded as evidence, but must not be a self-referential hard-coded equality requirement inside the same activation commit.

## Required Generator Revision

The generator must replace its inert-state guards with activation-state guards:

- Require zero active `exit 93` activation stops.
- Require `WRAPPER_EXIT_93_REQUIRED=NO`.
- Require `LIVE_EXECUTION_AUTHORIZED=YES`.
- Preserve exact wrapper, manifest, and SQL identity verification.
- Mint only for `staging` during the approved runtime turn.
- Write the wrapper, manifest, and SQL hashes into the authorization record.
- Avoid relying on a stale hard-coded activation commit.

## Required Wrapper Revision

The wrapper must:

- Remove the stale exact equality checks against `b6c0c552844b2537b688f89fdd25892e25a4f4b0`.
- Preserve clean synchronized-`main` validation.
- Preserve detached-manifest ancestry or committed-file validation without self-reference.
- Validate the authorization record's wrapper, manifest, and SQL hashes.
- Preserve the approved lock-and-consume implementation.
- Preserve the approved active read-only `psql` chain.
- Preserve redacted output handling.

## Required Final Review Package

The corrected revision must include:

- Wrapper diff.
- Manifest diff, if needed.
- Generator diff.
- Exact static proof that no stale `approved_commit` equality blocks runtime.
- Exact static proof that the generator expects the active manifest state.
- Exact static proof that the wrapper validates authorization-record wrapper and manifest identities.
- Exact static proof that SQL remains unchanged.
- Bash syntax checks.
- No execution, staging, commit, or push before approval.

## Current Boundary

- Existing Phase 26ZG draft: `UNCOMMITTED_AND_BLOCKED_PENDING_CORRECTION`
- Phase 26ZG commit: `NOT_AUTHORIZED_DUE_TO_CROSS_FILE_CONSISTENCY_BLOCKERS`
- Token cleanup or issuance: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection or SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZH_NON_CIRCULAR_BASELINE_AND_ACTIVE_GENERATOR_CORRECTION_PLAN`
- `REQUEST_CHANGES_PHASE_26ZH_NON_CIRCULAR_BASELINE_AND_ACTIVE_GENERATOR_CORRECTION_PLAN`
- `REJECT_PHASE_26ZH_NON_CIRCULAR_BASELINE_AND_ACTIVE_GENERATOR_CORRECTION_PLAN`
