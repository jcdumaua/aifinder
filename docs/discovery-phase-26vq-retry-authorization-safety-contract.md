# Phase 26VQ — Retry Authorization Safety Contract

## Retry boundary

The retry may:

- verify a clean synchronized repository;
- check only connection-variable presence;
- invoke `psql -w`;
- execute exactly `select 1;`;
- suppress raw stderr;
- emit one sanitized category;
- delete temporary raw stderr;
- run exactly once.

## Prohibited

- printing or inspecting the connection URL;
- printing username, host, password, or database name;
- application-row reads;
- catalog metadata reads;
- database mutation;
- schema or policy changes;
- migrations;
- automatic retry;
- deployment;
- publishing;
- operational reactivation.

## Token rule

The prior token is consumed and invalid.

A new token is required for this corrected-URL retry.
