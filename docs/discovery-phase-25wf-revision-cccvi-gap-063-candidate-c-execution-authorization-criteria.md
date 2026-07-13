# AiFinder Phase 25WF — Revision CCCVI — GAP-063 Candidate C Execution Authorization Criteria

## Purpose

Define the criteria that a later governance gate must satisfy before any Candidate C evidence-acquisition execution can be authorized for `GAP-063 / SEC-LR-011`.

## Mandatory authorization criteria

Execution authorization may be considered only when all of the following are proven:

1. Repository identity, branch, baseline, synchronization, and clean-tree state are verified.
2. Candidate C remains the approved source category.
3. The exact platform surface is identified without preserving a project reference.
4. The access context is read-only or technically prevented from mutation.
5. The minimum required privilege is documented.
6. The exact evidence field is defined.
7. The evidence can be captured without exposing secret or environment values.
8. The redaction schema is approved.
9. The stop conditions are accepted.
10. A primary operator and independent reviewer are assigned.
11. Mutation count can be independently verified as zero.
12. The evidence package can preserve provenance and timestamp.
13. The acquisition can remain limited to `GAP-063 / SEC-LR-011`.
14. A separate explicit execution decision is recorded.

## Automatic denial conditions

Authorization must be denied if any criterion is unproven, ambiguous, stale, or dependent on:

- Secret disclosure.
- Environment-value access.
- Project-reference preservation.
- Database or SQL access.
- Runtime execution.
- Production mutation.
- Unbounded platform inspection.
- Browser automation not separately approved.
- API access not separately approved.
- An unavailable second reviewer.

## Current authorization state

- Platform access: `NOT_AUTHORIZED`
- Evidence acquisition: `NOT_AUTHORIZED`
- Execution decision: `NOT_MADE`
- Runtime/database authorization: `NONE`

## Result

Execution-authorization criteria are defined. No execution is authorized.
