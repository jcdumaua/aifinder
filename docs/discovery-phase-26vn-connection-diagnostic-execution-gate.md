# Phase 26VN — Connection Diagnostic Execution Gate

## Entry requirements

Execution remains blocked until Gemini approves:

1. candidate SHA-256;
2. `select 1` as the only SQL statement;
3. no application relation access;
4. sanitized error-category mapping;
5. raw stderr suppression and cleanup;
6. one execution only;
7. no retry;
8. connection variable posture;
9. non-executable mode `100644`.

## Explicit prohibitions

- raw error printing;
- URL, host, username, or password output;
- application-row reads;
- catalog metadata reads;
- database mutation;
- schema or policy changes;
- migration execution;
- deployment;
- publishing;
- operational reactivation.

## Current state

- Diagnostic execution: `NOT_AUTHORIZED`
- Database mutation: `PROHIBITED`
