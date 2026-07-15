# Phase 26UY — Catalog-Only Query Safety Contract

## Governing baseline

`229ad96763735fc38fd59af64fa805aee9bef195`

## Connection boundary

A future execution script may use an existing approved local connection mechanism, but it must:

- never print the connection string;
- never print host, password, token, service-role value, or credential fragments;
- never inspect `.env.local` values;
- print configuration presence only;
- avoid command tracing such as `set -x`;
- avoid shell history expansion of credentials.

## SQL parser boundary

Before execution, the immutable query file must be checked to ensure:

- statements begin only with `select`;
- sources are limited to:
  - `pg_catalog.pg_class`
  - `pg_catalog.pg_namespace`
  - `pg_catalog.pg_policy`;
- no application relation is used as a source;
- no mutation keyword is present;
- no dynamic SQL is present;
- no multiple unreviewed statements are appended.

## Output boundary

Permitted output fields:

- schema name;
- relation name;
- relation kind;
- RLS enabled/forced booleans;
- policy name;
- policy permissive flag;
- policy command;
- catalog role OIDs or reviewed role labels;
- policy expressions;
- policy counts.

Prohibited output:

- application rows;
- user data;
- tool records;
- request or response bodies;
- credentials;
- tokens;
- cookies;
- connection details;
- environment values.

## Stop conditions

Stop immediately if:

- baseline differs;
- repository is dirty or unsynchronized;
- query text differs from the reviewed immutable query file;
- an unapproved catalog source appears;
- application-row access is possible;
- any mutation keyword appears;
- credential-like output appears;
- metadata output cannot be distinguished from row data;
- connection mode is not demonstrably read-only.

## Authorization boundary

This planning batch does not authorize database connection or SQL execution.

A separate Gemini-approved execution package and explicit human authorization are required.
