# AiFinder Phase 25VT — Revision CCXCIV — GAP-063 Single-Source Selection Criteria

## Purpose

Define the criteria for selecting at most one evidence-source category for `GAP-063 / SEC-LR-011`.

## Selection criteria

A candidate source category must be evaluated against:

1. Directness to the exact unresolved claim.
2. Ability to demonstrate deployed implementation.
3. Ability to demonstrate control effectiveness.
4. Provenance quality.
5. Freshness.
6. Independent reviewability.
7. Secret and credential exposure risk.
8. Environment-value exposure risk.
9. Required privilege.
10. Production mutation risk.
11. Scope containment.
12. Reproducibility.
13. Fail-closed stop conditions.

## Mandatory rejection rules

Reject any category that:

- Requires secret or environment-value disclosure.
- Requires production mutation.
- Cannot be attributed to AiFinder.
- Cannot establish freshness.
- Is broader than `GAP-063 / SEC-LR-011`.
- Cannot be independently reviewed.
- Depends on an undefined runtime method.
- Conflates design intent with deployed effectiveness.
- Requires uncontrolled platform or database access.

## Selection rule

Select at most one category. If no category is both safe and capable of satisfying the exact claim, select `NONE` and preserve `GAP-063` as unresolved.

## Boundary

Selection of a category does not authorize evidence acquisition, commands, credentials, endpoints, queries, platform resources, project references, environment inspection, or production action.

## Result

The single-source selection criteria are defined. No source is accessed.
