# Phase 26VR — Corrected URL Diagnostic Result Contract

## Allowed result categories

Exactly one:

- `CONNECTION_OK`
- `AUTHENTICATION_FAILED`
- `DNS_OR_HOST_FAILED`
- `NETWORK_TIMEOUT`
- `DATABASE_NOT_FOUND`
- `SSL_OR_TLS_FAILED`
- `MALFORMED_CONNECTION_URL`
- `PSQL_NOT_AVAILABLE`
- `UNKNOWN_CONNECTION_FAILURE`

## Success interpretation

`CONNECTION_OK` means only that:

- the corrected URI authenticated successfully;
- PostgreSQL accepted `select 1;`;
- no application or catalog data was read;
- no mutation occurred.

It does not authorize the live RLS metadata query.

## Failure interpretation

Any non-success category remains fail-closed and requires review before another attempt.

## Post-result state

- RLS metadata execution: `NOT_AUTHORIZED`
- Database mutation: `PROHIBITED`
- Operational reactivation: `BLOCKED`
