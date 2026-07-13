# AiFinder Phase 25WT — Revision CCCXX — GAP-063 Candidate C Role Assignment Decision Plan

## Purpose

Define the fail-closed decision process for assigning the primary operator and independent reviewer roles.

## Allowed role decisions

A later gate may record exactly one operator decision:

- `PRIMARY_OPERATOR_ASSIGNED`
- `PRIMARY_OPERATOR_NOT_ASSIGNED`
- `PRIMARY_OPERATOR_CONFLICT`
- `PRIMARY_OPERATOR_PRIVILEGE_UNPROVEN`

A later gate may record exactly one reviewer decision:

- `INDEPENDENT_REVIEWER_ASSIGNED`
- `INDEPENDENT_REVIEWER_NOT_ASSIGNED`
- `INDEPENDENT_REVIEWER_CONFLICT`
- `INDEPENDENT_REVIEWER_UNAVAILABLE`

## Assignment prerequisites

A role may be marked assigned only when:

1. The role holder is identified in a non-secret governance record.
2. The operator and reviewer are distinct.
3. No conflict of interest is present.
4. The operator is bound to the approved read-only context.
5. The reviewer can review during the acquisition window.
6. Both accept the stop conditions.
7. Both understand that the authorization is single-use.
8. No credential or account detail is preserved in the repository.

## Execution effect

Execution authorization remains prohibited unless all are true:

- Exact surface selected.
- Read-only privilege proof accepted.
- Primary operator assigned.
- Independent reviewer assigned.
- Separation confirmed.
- Single-use expiration defined.
- A new explicit execution decision is approved.

## Current decision state

- Exact surface: `UNSELECTED`
- Read-only privilege proof: `NOT_PROVEN`
- Primary operator: `UNASSIGNED`
- Independent reviewer: `UNASSIGNED`
- Execution authorization: `NOT_AUTHORIZED`

## Result

The role-assignment decision process is defined. No role assignment or execution authorization is made.
