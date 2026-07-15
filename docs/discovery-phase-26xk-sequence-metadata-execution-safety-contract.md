# Phase 26XK — Sequence Metadata Execution Safety Contract

## Required controls

- clean synchronized repository;
- approved baseline remains an ancestor of HEAD;
- immutable query SHA-256;
- connection-variable presence only;
- `psql -w`;
- no password prompt;
- catalog-only sources;
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
- grant or policy mutation;
- environment-value output;
- raw `/tmp` output commits;
- deployment or publishing.
