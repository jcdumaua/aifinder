# AiFinder Phase 26YX — Operator-Controlled Service Descriptor Supply and Live Preflight Execution Authorization Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW_AND_EXPLICIT_OPERATOR_DESCRIPTOR_SUPPLY`

## Baseline

- Phase 26YW commit: `217254a786549d8b7c23f815d6a56dc96ac52b4b`
- Generator SHA-256: `179ca8b55cf88e4ba12b00a53ad9210d832d47b47151a6c4f6970350f8b73978`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`

## Fail-Closed Disposition

No fresh 300-second authorization record was issued in this turn.

Issuing the token before an operator-controlled libpq service descriptor is available would create a record that expires before the final wrapper execution can be reviewed and authorized. That would add stale state without advancing live confidence.

## Purpose

Authorize a later single execution turn in which the operator supplies an already-open libpq service descriptor and the runner performs the complete bounded sequence without pausing:

1. Safely dispose of eligible expired or consumed records.
2. Issue exactly one fresh staging authorization record.
3. Validate the fresh record without exposing its nonce.
4. Accept the operator-controlled service descriptor by inherited numeric file descriptor only.
5. Atomically consume the fresh record.
6. Establish one staging PostgreSQL connection.
7. Verify a read-only session and bounded timeouts.
8. Execute exactly the committed SQL candidate once.
9. Emit only redacted evidence.
10. Stop immediately.

## Operator Descriptor Requirement

The operator must open the approved libpq service configuration outside the runner and expose only a numeric inherited descriptor.

The runner must not receive or print:

- Service file path.
- Host or port.
- Role or username.
- Database name.
- Password.
- URL or connection string.
- Environment values.
- Descriptor contents.

No application `.env` file may be opened.

## One-Turn Freshness Contract

The stale sweep, fresh issuance, descriptor validation, token consumption, connection, and SQL execution must occur in one uninterrupted authorized turn.

The runner must not:

- Pause for another review after token issuance.
- Reuse a token from an earlier phase.
- Retry a consumed token.
- Issue more than one token.
- Open more than one database connection.
- Execute more than one SQL candidate.

## Required Runtime Inputs

A future execution script may require only:

- The inherited service descriptor number.
- The exact reviewed repository and candidate identities.
- The explicitly authorized environment class `staging`.

It must reject credential paths, connection strings, passwords, nonces, and database identifiers supplied through command arguments.

## Read-Only Session Requirements

Before the catalog query:

- Confirm environment classification is staging.
- Confirm the database role is acceptable for the finite catalog-read scope without printing its name.
- Enable and verify `transaction_read_only`.
- Apply narrow statement and lock timeouts.
- Refuse any session that cannot prove read-only state.
- Execute exactly the committed SQL candidate.

## Evidence Contract

Allowed evidence:

- Result class.
- Candidate identities.
- Token disposition and consumption classifications.
- Descriptor readiness classification.
- Read-only session assertion.
- Timeout classifications.
- Catalog outcome classification.
- Bounded row-count classification.
- Exit status.

Forbidden evidence:

- Credentials or descriptor contents.
- Nonce or raw authorization record.
- Host, role, database, URL, or connection values.
- Raw application or catalog data.
- Environment values.

## Gate Separation

- Phase 26YX artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Operator descriptor supply: `NOT_AUTHORIZED_PENDING_EXPLICIT_OPERATOR_ACTION`
- Stale-record cleanup: `NOT_AUTHORIZED`
- Fresh token issuance: `NOT_AUTHORIZED`
- Token consumption: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YX_DESCRIPTOR_SUPPLY_AND_LIVE_PREFLIGHT_EXECUTION_GATE`
- `REQUEST_CHANGES_PHASE_26YX_DESCRIPTOR_SUPPLY_AND_LIVE_PREFLIGHT_EXECUTION_GATE`
- `REJECT_PHASE_26YX_DESCRIPTOR_SUPPLY_AND_LIVE_PREFLIGHT_EXECUTION_GATE`
