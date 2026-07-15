# Phase 26VL — Live RLS Connection Failure Classification Plan

## Bound baseline

`aff7af4904999687e71c2678acc61bb1a5a7b02d`

## Prior result

The approved authorization package was committed and pushed at:

`aff7af4904999687e71c2678acc61bb1a5a7b02d`

The live wrapper passed all local safety checks, then failed during the PostgreSQL connection/query step before metadata output was produced.

## Objective

Classify the connection failure without exposing:

- connection URL;
- host;
- username;
- password;
- token;
- raw PostgreSQL error;
- application rows;
- database metadata beyond connectivity.

## Allowed diagnostic result

Exactly one category:

- `CONNECTION_OK`
- `AUTHENTICATION_FAILED`
- `DNS_OR_HOST_FAILED`
- `NETWORK_TIMEOUT`
- `DATABASE_NOT_FOUND`
- `SSL_OR_TLS_FAILED`
- `MALFORMED_CONNECTION_URL`
- `PSQL_NOT_AVAILABLE`
- `UNKNOWN_CONNECTION_FAILURE`

## Current state

`CONNECTION_FAILURE_CLASSIFICATION_PLANNED_NOT_EXECUTED`
