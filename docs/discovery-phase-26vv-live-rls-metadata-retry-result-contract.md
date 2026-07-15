# Phase 26VV — Live RLS Metadata Retry Result Contract

## Permitted evidence

The result may contain only catalog-derived RLS metadata required for reconciliation, including:

- schema and relation identifiers;
- RLS enabled or forced flags;
- policy names;
- policy command and role metadata;
- policy expression metadata already allowed by the committed query.

## Forbidden evidence

- application rows;
- application row counts;
- secrets;
- credentials;
- connection strings;
- environment values;
- raw response bodies unrelated to the catalog query.

## Result handling

- no raw `/tmp` log may be committed;
- evidence must be sanitized before documentation;
- any execution failure remains fail-closed;
- no retry without a new review and token.

## Post-result state

- database mutation: `PROHIBITED`
- public launch: `BLOCKED`
- operational reactivation: `BLOCKED`
