# Phase 26XC — Tools Legacy Policy Remediation Design

## Confirmed issue

`public.tools` contains a permissive `SELECT` policy named `Public can read tools` assigned to `anon` and `authenticated` with `USING (true)`.

This policy is broader than the source-controlled approved-only policy and can permit rows that do not satisfy approved/non-deleted conditions.

## Proposed target state

Retain:

`Allow public read access to approved tools`

Remove:

`Public can read tools`

## Preconditions before migration authoring

1. Confirm no intended authenticated workflow requires unrestricted direct reads.
2. Confirm server-side privileged workflows use server-only clients.
3. Verify the public application continues to function using approved/non-deleted rows only.
4. Prepare exact forward and rollback SQL.
5. Verify the rollback recreates:
   - policy name;
   - permissive posture;
   - `SELECT` command;
   - roles `anon` and `authenticated`;
   - `USING (true)`;
   - no `WITH CHECK`.
6. Test against a non-production database or isolated local PostgreSQL environment.
7. Obtain separate Gemini review and explicit production authorization.

## Proposed migration behavior

A future migration may:

- assert the target table exists;
- verify the live legacy policy definition exactly;
- fail closed if the live policy differs;
- drop only the exact legacy policy;
- leave the approved-only policy unchanged.

## Prohibited in this phase

- migration file creation;
- policy drop;
- policy alteration;
- production execution;
- database mutation.

## Current disposition

`TARGET_STATE_CONFIRMED_MIGRATION_NOT_AUTHORED`
