# Phase 26WY — Catalog DDL Metadata Stop and Rollback Contract

## Stop conditions

The execution must stop before `psql` when:

- repository identity fails;
- HEAD and origin/main differ;
- working tree is not clean;
- SQL SHA-256 differs;
- static safety verification fails;
- connection variable is absent;
- `psql` is unavailable.

## Failure behavior

- no retry;
- delete temporary raw output;
- do not commit execution logs;
- consume the one-time token only if `psql` is invoked;
- preserve database and launch blocks.

## Database rollback

The SQL candidate terminates with explicit `ROLLBACK` inside a read-only transaction.
