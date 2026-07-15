# Phase 26XL — Sequence Metadata Stop and Rollback Contract

## Stop conditions

Stop before `psql` when:

- repository identity fails;
- HEAD and origin/main differ;
- working tree is not clean;
- query SHA-256 differs;
- static safety validation fails;
- connection variable is absent;
- `psql` is unavailable.

## Failure behavior

- no retry;
- delete temporary raw output;
- do not commit execution logs;
- consume the one-time token only if `psql` is invoked.

## Database rollback

The query terminates with explicit `ROLLBACK` inside a read-only transaction.
