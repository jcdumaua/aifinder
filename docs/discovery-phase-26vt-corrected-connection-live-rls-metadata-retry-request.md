# Phase 26VT — Corrected Connection Live RLS Metadata Retry Request

## Bound baseline

`7f4e79fad59eae277d5520fb8696b6643f807745`

## Connection diagnostic result

The corrected PostgreSQL URI completed the approved sanitized diagnostic with:

`CONNECTION_OK`

This establishes only that PostgreSQL authentication and `select 1;` succeeded.

## Prior live metadata attempt

The prior catalog-only metadata attempt failed before producing a metadata result because the URI contained an unresolved password placeholder.

The prior execution token is consumed and invalid.

## Requested retry

Authorize exactly one new execution of:

`scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh`

using immutable SQL:

`scripts/discovery-live-rls-metadata-catalog-query.sql`

## Immutable hashes

- SQL SHA-256: `759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde`
- Wrapper SHA-256: `b2785a5f75f1726d5c7d0a3fb7df4a0fca867d938479f0a199b6d0f66b3948d9`
- Wrapper mode: `100644`

## Current state

`LIVE_RLS_METADATA_RETRY_REQUESTED_NOT_AUTHORIZED`
