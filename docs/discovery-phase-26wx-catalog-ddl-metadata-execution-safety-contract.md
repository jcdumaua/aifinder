# Phase 26WX — Catalog DDL Metadata Execution Safety Contract

## Required controls

- clean synchronized repository;
- approved package baseline remains an ancestor of HEAD;
- immutable SQL SHA-256;
- connection-variable presence only;
- `psql -w`;
- no password prompt;
- read-only transaction;
- statement and lock timeout;
- explicit rollback;
- one execution only;
- no automatic retry;
- secret-like output scan;
- temporary raw output deletion.

## Prohibited

- application-row reads;
- database mutation;
- migration execution;
- URL, password, host, or environment-value output;
- raw `/tmp` log commits;
- deployment;
- publishing;
- operational reactivation.
