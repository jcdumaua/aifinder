# Phase 26XQ — Final RLS Drift Migration Authoring Gate

## Completed evidence

The following live metadata is now established without guesswork:

1. exact `tools` policy definitions;
2. exact audit-table columns and defaults;
3. primary keys and indexes;
4. ownership and RLS flags;
5. zero-policy audit posture;
6. relation grants;
7. sequence settings;
8. sequence ownership dependency;
9. sequence grants;
10. absence of non-internal audit-table triggers.

## Proposed migration package scope

A future migration-authoring phase may prepare, but not execute:

1. a forward migration candidate;
2. a rollback migration candidate;
3. a static verifier;
4. a non-production test plan;
5. a production execution gate.

## Forward candidate objectives

### `public.tools`

- verify the exact broad legacy policy;
- drop only `Public can read tools`;
- preserve `Allow public read access to approved tools`.

### Audit relations

- verify exact live schemas;
- document them in source control without recreating or altering matching live objects;
- preserve RLS enabled and zero-policy posture;
- reconcile grants only after dependency proof.

### Audit sequence

- verify exact settings and ownership;
- document them in source control;
- reconcile grants only after dependency proof.

## Authoring boundary

Migration authoring remains blocked until Gemini confirms:

1. sanitized sequence metadata is accurate;
2. all required live schema evidence is complete;
3. dependency proof requirements are sufficient;
4. forward and rollback scope is narrow and reversible;
5. no production execution is implied.

## Current state

- Migration file: `NOT_CREATED`
- Rollback file: `NOT_CREATED`
- Database mutation: `PROHIBITED`
- Production execution: `NOT_AUTHORIZED`
