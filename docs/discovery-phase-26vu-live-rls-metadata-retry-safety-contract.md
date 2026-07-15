# Phase 26VU — Live RLS Metadata Retry Safety Contract

## Allowed operation

Exactly one catalog-only read-only inspection using the committed wrapper and SQL.

The query may access only:

- `pg_catalog.pg_class`
- `pg_catalog.pg_namespace`
- `pg_catalog.pg_policy`

## Required controls

- clean synchronized repository;
- immutable file hashes;
- connection-variable presence only;
- `psql -w`;
- read-only transaction;
- `statement_timeout=5000`;
- rollback;
- no automatic retry;
- sanitized retained evidence only.

## Prohibited

- application-row reads;
- application table counts;
- database mutation;
- schema or policy changes;
- migrations;
- Supabase push;
- raw connection URL output;
- username, host, password, or token disclosure;
- deployment;
- publishing;
- operational reactivation.

## Token rule

A new one-time execution token is required.
