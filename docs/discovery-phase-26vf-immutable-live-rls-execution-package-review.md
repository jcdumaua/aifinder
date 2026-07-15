# Phase 26VF — Immutable Live RLS Execution Package Review

## Review scope

Review:

- `scripts/discovery-live-rls-metadata-catalog-query.sql`
- `scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh`
- Phases 26VB–26VE.

## Required Gemini verification

Verify that:

1. baseline is exactly `d117f9fe24e7de85ffdf92c631b7547b64bbfac2`;
2. query SHA-256 is `759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde`;
3. wrapper SHA-256 is `3ee4e1e42e0a9a60ad9132b98cf1f2e5806ceb82287f31ca6841bfa773d94abc`;
4. both candidates are non-executable mode `100644`;
5. SQL sources are catalog-only;
6. read-only transaction, timeout, and rollback are correct;
7. parser rejects application sources and mutations;
8. connection value cannot be printed;
9. `psql` invocation is safe;
10. output scanner and cleanup are sufficient;
11. no connection or SQL execution occurred;
12. live execution remains separately gated;
13. GAP-001 remains quarantined and launch-blocking;
14. operational reactivation remains blocked.

## Requested determination

Select exactly one:

- `APPROVE_IMMUTABLE_LIVE_RLS_METADATA_EXECUTION_PACKAGE`
- `REVISE_IMMUTABLE_LIVE_RLS_METADATA_EXECUTION_PACKAGE`
- `BLOCK_IMMUTABLE_LIVE_RLS_METADATA_EXECUTION_PACKAGE`

## Required reviewer output

Provide:

1. approved or corrected connection environment-variable name;
2. approved or corrected `psql` invocation;
3. confirmation that `PGPASSWORD=''` was removed and `psql -w` was added;
4. approved output and error-handling behavior;
5. whether the package may be committed;
6. whether live execution is authorized or requires a subsequent explicit authorization.

## Current state

- Package preparation: `COMPLETE_PENDING_GEMINI_REVIEW`
- Database connection: `NOT_PERFORMED`
- SQL execution: `NOT_PERFORMED`
- Live execution: `NOT_AUTHORIZED`
- GAP-001: `ACTIVE_QUARANTINE`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
