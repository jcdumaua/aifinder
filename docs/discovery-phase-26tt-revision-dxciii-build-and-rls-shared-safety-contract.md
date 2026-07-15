# Phase 26TT — Build and RLS Shared Safety Contract

## Governing baseline

`b95d74f3e5596ed5efb1522d5563e07d98fdb089`

## Shared boundaries

Both verification tracks must:

- bind to an exact committed baseline;
- require a clean synchronized repository;
- use immutable scripts or commands reviewed in advance;
- print configuration presence only, never values;
- stop on unexpected output or scope drift;
- preserve complete logs;
- avoid source changes;
- avoid database mutation;
- avoid public deployment or publishing;
- keep operational reactivation blocked.

## Build-specific protections

- no development server;
- no route invocation;
- no client requests;
- no secret-value grep output;
- inspect generated file names and sanitized identifiers only;
- delete temporary build-analysis artifacts after evidence capture unless explicitly preserved.

## RLS-specific protections

- static migration review first;
- live metadata-only inspection only after separate authorization;
- no table-row reads;
- no SQL mutation;
- no policy mutation;
- no migration application;
- no credential or connection detail output.

## Stop conditions

Stop immediately when:

- baseline differs;
- repository is dirty;
- secret-like output appears;
- a command exceeds the approved scope;
- database metadata cannot be distinguished from row data;
- build artifacts cannot be separated into server and client outputs;
- any mutation possibility is detected.

## Authorization boundary

This planning package does not authorize build execution, database access, SQL, Supabase CLI, runtime validation, deployment, publishing, or operational reactivation.
