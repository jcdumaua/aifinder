# Phase 26WT — Catalog DDL Metadata Result Contract

## Permitted output

Only metadata required to reconstruct or reconcile source-controlled schema declarations:

- policy names, commands, roles, and expressions;
- relation ownership and RLS flags;
- column definitions;
- defaults;
- identity and generated flags;
- constraint definitions;
- index definitions;
- non-internal trigger definitions;
- explicit grants;
- comments.

## Sensitive-output handling

- no connection URL or password may be printed;
- no environment value may be printed;
- no raw `/tmp` output may be committed;
- evidence must be sanitized before documentation.

## Result use

The result may support migration design only. It does not authorize migration creation, execution, or database mutation.
