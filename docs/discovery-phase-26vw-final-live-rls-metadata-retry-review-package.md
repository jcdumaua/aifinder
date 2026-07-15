# Phase 26VW — Final Live RLS Metadata Retry Review Package

## Review scope

Review Phases 26VT–26VV for one catalog-only RLS metadata retry after successful corrected-URL authentication.

## Immutable identity

- Baseline: `7f4e79fad59eae277d5520fb8696b6643f807745`
- SQL: `scripts/discovery-live-rls-metadata-catalog-query.sql`
- SQL SHA-256: `759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde`
- Wrapper: `scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh`
- Wrapper SHA-256: `b2785a5f75f1726d5c7d0a3fb7df4a0fca867d938479f0a199b6d0f66b3948d9`
- Wrapper mode: `100644`

## Required Gemini verification

Verify that:

1. the corrected connection diagnostic returned `CONNECTION_OK`;
2. the prior metadata execution token is consumed;
3. a new token is required;
4. only committed immutable SQL and wrapper files are used;
5. queries are limited to the approved catalog relations;
6. transaction posture is read-only with timeout and rollback;
7. no application row or count is accessed;
8. no connection value or credential is printed;
9. execution occurs exactly once without retry;
10. GAP-001, public launch, and operational reactivation remain blocked.

## Requested determination

Select exactly one:

- `AUTHORIZE_ONE_CORRECTED_CONNECTION_LIVE_RLS_METADATA_EXECUTION`
- `REVISE_CORRECTED_CONNECTION_LIVE_RLS_METADATA_EXECUTION`
- `BLOCK_CORRECTED_CONNECTION_LIVE_RLS_METADATA_EXECUTION`

## Current state

- Connection authentication: `CONFIRMED`
- Live RLS metadata retry: `NOT_AUTHORIZED`
- Database mutation: `PROHIBITED`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
