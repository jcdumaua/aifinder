# Phase 26WZ — Catalog DDL Metadata Result Evidence Contract

## Permitted evidence

- exact `tools` policy definitions;
- audit relation ownership and RLS flags;
- audit relation columns and defaults;
- constraints;
- indexes;
- non-internal triggers;
- explicit table grants;
- relation and column comments.

## Forbidden evidence

- application rows;
- application row counts;
- connection strings;
- credentials;
- environment values;
- unrelated server details.

## Evidence handling

Only sanitized metadata may be documented. Raw `/tmp` output must not be committed.
