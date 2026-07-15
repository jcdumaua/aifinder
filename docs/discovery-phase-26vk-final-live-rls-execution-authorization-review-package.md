# Phase 26VK — Final Live RLS Execution Authorization Review Package

## Review scope

Review Phases 26VG–26VJ as the final authorization package for one catalog-only live RLS metadata inspection.

## Immutable package

- Baseline: `bcdc55495061592e1d60af6ed3f16ca0256db0ae`
- SQL SHA-256: `759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde`
- Wrapper SHA-256: `b2785a5f75f1726d5c7d0a3fb7df4a0fca867d938479f0a199b6d0f66b3948d9`
- Candidate modes: `100644`

## Required Gemini verification

Verify that:

1. the committed baseline and hashes are exact;
2. one execution through `bash` is safe without changing file mode;
3. the connection value cannot be printed or copied;
4. `psql -w` prevents password prompting;
5. SQL sources remain catalog-only;
6. transaction is read-only with a 5000ms timeout and rollback;
7. output columns are allowlisted;
8. raw failure output is not copied;
9. one approval permits only one execution;
10. no automatic retry occurs;
11. no DB mutation, schema change, migration, deployment, publishing, or reactivation is possible;
12. GAP-001 remains quarantined and launch-blocking.

## Requested determination

Select exactly one:

- `AUTHORIZE_ONE_LIVE_RLS_METADATA_EXECUTION`
- `REVISE_FINAL_LIVE_RLS_METADATA_EXECUTION_PACKAGE`
- `BLOCK_LIVE_RLS_METADATA_EXECUTION`

## Required reviewer output

Provide:

1. whether one live execution is authorized;
2. exact authorization token;
3. whether the connection environment-variable posture is approved;
4. whether wrapper invocation through `bash` is approved;
5. any final corrections;
6. confirmation that execution remains catalog-only and read-only.

## Current state

- Final execution package: `COMPLETE_PENDING_GEMINI_REVIEW`
- Database connection: `NOT_PERFORMED`
- SQL execution: `NOT_PERFORMED`
- Live execution: `NOT_AUTHORIZED`
- Database mutation: `PROHIBITED`
- GAP-001: `ACTIVE_QUARANTINE`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Correction requiring replacement authorization token

The wrapper baseline binding was corrected. The previous one-time token must not be reused. Gemini must review wrapper SHA-256 `b2785a5f75f1726d5c7d0a3fb7df4a0fca867d938479f0a199b6d0f66b3948d9` and issue a replacement token.
