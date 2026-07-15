# Phase 26WO — Tools Legacy Read Policy Target-State Plan

## Confirmed live state

`public.tools` has two read policies:

- `Allow public read access to approved tools`
- `Public can read tools`

Only the approved-tools policy is established in current migrations.

## Proposed target state

Retain exactly the source-controlled approved-tools read policy and remove the untracked broad read policy only after all of the following are proven:

1. the exact live expression and role set of `Public can read tools`;
2. no current public, authenticated, admin, or server workflow depends on it;
3. the approved-tools policy fully supports intended public behavior;
4. a rollback can recreate the policy exactly;
5. staging or equivalent non-production verification succeeds.

## Future forward action

A future migration may contain an idempotent, explicitly named policy drop. The exact SQL is intentionally not authored in this planning phase.

## Future rollback requirement

The rollback package must preserve the exact original policy:

- policy name;
- command;
- role set;
- permissive/restrictive posture;
- `USING` expression;
- `WITH CHECK` expression.

## Current disposition

`TARGET_STATE_DEFINED_LIVE_POLICY_DDL_REQUIRED_NO_MUTATION_AUTHORIZED`
