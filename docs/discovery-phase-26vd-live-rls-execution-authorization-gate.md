# Phase 26VD — Live RLS Execution Authorization Gate

## Entry requirements

Live execution remains blocked until Gemini approves:

1. exact query SHA-256;
2. exact wrapper SHA-256;
3. connection environment-variable name;
4. `psql` invocation and flags;
5. SQL preflight parser;
6. output secret scanner;
7. raw-output cleanup;
8. allowed output columns;
9. read-only transaction and timeout;
10. repository-state checks.

## Additional human authorization

After Gemini approval, explicit human authorization is still required for the database connection and catalog-query execution event.

## Prohibited actions

- application-row reads;
- application-row counts;
- database mutations;
- schema changes;
- migrations;
- policy changes;
- Supabase database push;
- credential printing;
- deployment;
- publishing;
- operational reactivation.

## Current state

- Immutable package: `PREPARED_PENDING_REVIEW`
- Live DB connection: `NOT_AUTHORIZED`
- SQL execution: `NOT_AUTHORIZED`
- Database mutation: `PROHIBITED`
