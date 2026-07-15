# Phase 26XM — Sequence Metadata Result Evidence Contract

## Permitted evidence

- sequence owner;
- start, increment, minimum, maximum;
- cache and cycle behavior;
- owned-by relation and column;
- explicit sequence usage grants.

## Forbidden evidence

- application rows;
- connection strings;
- credentials;
- environment values;
- unrelated server details.

## Evidence handling

Only sanitized metadata may be documented. Raw temporary output must not be committed.
