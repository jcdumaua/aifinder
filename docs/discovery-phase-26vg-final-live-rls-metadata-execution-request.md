# Phase 26VG — Final Live RLS Metadata Execution Request

## Bound baseline

`bcdc55495061592e1d60af6ed3f16ca0256db0ae`

## Immutable identities

- SQL: `scripts/discovery-live-rls-metadata-catalog-query.sql`
  - SHA-256: `759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde`
  - mode: `100644`
- Wrapper: `scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh`
  - SHA-256: `b2785a5f75f1726d5c7d0a3fb7df4a0fca867d938479f0a199b6d0f66b3948d9`
  - mode: `100644`

## Requested authorization

Authorize one controlled local execution of the committed wrapper candidate for catalog-only live RLS metadata inspection.

## Requested scope

The execution may:

- verify repository identity and cleanliness;
- verify SQL and wrapper identities;
- verify presence of `AIFINDER_RLS_METADATA_DATABASE_URL` without printing its value;
- invoke `psql -w`;
- run the immutable catalog-only SQL file;
- read only PostgreSQL catalog metadata;
- write temporary local output under `/tmp`;
- scan output for secret-like values;
- print only approved metadata columns;
- delete raw temporary output;
- preserve a sanitized result log for Gemini review.

## Explicitly prohibited

- application-row reads;
- application-row counts;
- application table or view sources;
- database writes or mutations;
- schema or policy changes;
- migrations;
- Supabase database push;
- server startup;
- route invocation;
- deployment;
- publishing;
- operational reactivation.

## Current state

`FINAL_LIVE_RLS_METADATA_EXECUTION_AUTHORIZATION_REQUESTED_NOT_GRANTED`
