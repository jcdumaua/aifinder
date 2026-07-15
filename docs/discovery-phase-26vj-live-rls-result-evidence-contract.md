# Phase 26VJ — Live RLS Result Evidence Contract

## Required sanitized evidence

A successful execution result must record:

- exact baseline;
- SQL SHA-256;
- wrapper SHA-256;
- repository clean and synchronized state;
- connection-variable presence marker only;
- SQL preflight pass markers;
- approved metadata output;
- statement completion status;
- explicit rollback completion;
- no secret-like output;
- no application-row reads;
- no mutation;
- final repository state.

## Result classification

The result must be classified as one of:

- `CATALOG_ONLY_LIVE_RLS_METADATA_INSPECTION_PASSED`
- `CONNECTION_FAILED_NO_QUERY_EXECUTED`
- `SQL_PREFLIGHT_FAILED_NO_CONNECTION`
- `READ_ONLY_TRANSACTION_FAILED`
- `STATEMENT_TIMEOUT`
- `UNEXPECTED_METADATA_OUTPUT`
- `SECRET_LIKE_OUTPUT_DETECTED`
- `REPOSITORY_STATE_CHANGED`
- `FAIL_CLOSED_MANUAL_REVIEW_REQUIRED`

## Reconciliation requirement

A successful metadata result is not itself final RLS closure. It must be compared against the committed static RLS contract in one consolidated reconciliation batch.

## Prohibited follow-on automation

The result must not automatically trigger:

- policy changes;
- migrations;
- schema changes;
- database writes;
- deployment;
- publishing;
- operational reactivation.
