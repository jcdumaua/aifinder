# AiFinder Phase 26YY — Service Descriptor Interface Static Verification Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YX commit: `3790a328e7e51f6a83ee08d1c9a38bac9e9648db`
- Generator SHA-256: `179ca8b55cf88e4ba12b00a53ad9210d832d47b47151a6c4f6970350f8b73978`
- Wrapper SHA-256: `7fc1bc0d065d8f5ce4319b30b40288309a996cd2c39207150bb3e59a76c4ceb8`
- Wrapper Git blob: `c29e77be1ca272a60fca7c285b4f8b3367af2701`
- Detached manifest SHA-256: `629619288e0ee0ae7914a4aac6abf5aea2865334d036194ab94c329311833ee3`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`

## Purpose

Verify the committed wrapper's actual descriptor and invocation interface before any operator opens a credential-bearing service configuration.

Phase 26YX authorizes a live preflight only when the operator-controlled descriptor can be supplied through the exact interface implemented by the wrapper. This phase performs static source inspection only and does not open credentials, temporary authorization records, network connections, or PostgreSQL sessions.

## Static Interface Evidence

```text
SERVICE_FD_REFERENCES_COUNT=8
SERVICE_FD_REFERENCES_LINES=33,52,87,91,95,99,302,338
AUTH_FD_REFERENCES_COUNT=0
AUTH_FD_REFERENCES_LINES=NONE
PGSERVICEFILE_REFERENCES_COUNT=1
PGSERVICEFILE_REFERENCES_LINES=302
PSQL_REFERENCES_COUNT=3
PSQL_REFERENCES_LINES=293,300,302
ENV_FILE_REFERENCES_COUNT=0
ENV_FILE_REFERENCES_LINES=NONE
TRANSACTION_READ_ONLY_REFERENCES_COUNT=0
TRANSACTION_READ_ONLY_REFERENCES_LINES=NONE
STATEMENT_TIMEOUT_REFERENCES_COUNT=0
STATEMENT_TIMEOUT_REFERENCES_LINES=NONE
LOCK_TIMEOUT_REFERENCES_COUNT=0
LOCK_TIMEOUT_REFERENCES_LINES=NONE
POSITIONAL_ARG_REFERENCES_COUNT=25
POSITIONAL_ARG_REFERENCES_LINES=49,52,57,62,67,160,186,187,188,189,190,191,192,193,194,195,196,232,247,257,258,259,260,261,262
```

The evidence reports only reference counts and source line numbers. It does not print source lines, values, paths, credentials, environment data, or descriptor contents.

## Required Review Questions

Gemini must verify:

1. The exact variable or inherited descriptor contract expected by the wrapper.
2. Whether the authorization record is also accepted through a pre-opened descriptor.
3. Whether `PGSERVICEFILE` is derived from a descriptor-safe path such as `/dev/fd/N`, without exposing the underlying service-file path.
4. Whether positional arguments can carry sensitive material.
5. Whether any `.env` lookup remains reachable.
6. Whether read-only session and timeout checks occur before the SQL candidate.
7. The exact operator shell sequence needed to open the service descriptor without printing values.
8. Whether a wrapper revision is required before live execution.

## Fail-Closed Decision

No live execution script may be generated until the descriptor interface is confirmed from the committed wrapper source.

## Gate Separation

- Phase 26YY artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Operator service-file opening: `NOT_AUTHORIZED`
- Stale-record cleanup: `NOT_AUTHORIZED`
- Fresh token issuance: `NOT_AUTHORIZED`
- Token consumption: `NOT_AUTHORIZED`
- Wrapper invocation: `NOT_AUTHORIZED`
- Database connection or SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YY_DESCRIPTOR_INTERFACE_STATIC_VERIFICATION`
- `REQUEST_CHANGES_PHASE_26YY_DESCRIPTOR_INTERFACE_STATIC_VERIFICATION`
- `REJECT_PHASE_26YY_DESCRIPTOR_INTERFACE_STATIC_VERIFICATION`
