# Phase 26WD — Wrapper Repair and Synthetic Test Implementation Plan

## Repair objective

Correct only the malformed secret-scanner construction in:

`scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh`

## Permitted implementation

A future implementation phase may:

1. replace the malformed multiline `grep -E` expression with one safely quoted pattern;
2. alternatively write patterns to a temporary pattern file and use `grep -E -f`;
3. preserve every database-query and transaction boundary unchanged;
4. keep the wrapper non-executable with mode `100644`;
5. add a repository-local synthetic test harness or temporary fixture generator;
6. test benign input and synthetic secret-like markers only;
7. verify expected scanner pass/fail behavior;
8. compute a new wrapper SHA-256.

## Required synthetic cases

At minimum:

- benign catalog-like text must pass;
- synthetic PostgreSQL URI must be detected;
- synthetic API-key marker must be detected;
- synthetic JWT-like marker must be detected;
- synthetic password assignment must be detected;
- patterns containing parentheses must not cause a regex parse error;
- no pattern fragment may be interpreted as a shell command.

## Prohibited

- database connection;
- SQL execution;
- environment-value inspection;
- real secrets or credentials;
- application-row access;
- migration execution;
- commit or push before Gemini reviews the repaired candidate.

## Reconciliation posture

Static migration reconciliation may proceed in parallel, but no database or migration change may be implemented in the wrapper-repair phase.
