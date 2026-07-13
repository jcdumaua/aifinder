# Phase 25UB — Revision CCLI Next Strategic Dependency Reselection Criteria

## Status

SELECTION_CRITERIA_ONLY — NO CANDIDATE SELECTED

## Objective

Define the criteria for selecting the next blocker after GAP-057 returns to the authoritative unresolved blocker ledger.

## Required Selection Criteria

A candidate may be selected only if it:

1. remains present in the authoritative unresolved blocker set;
2. is not already accepted, resolved, waived, or superseded;
3. is not the subject of a just-closed chain requiring a new governance chain for reconsideration;
4. has a clearly identifiable control or dependency label;
5. has a bounded unresolved question;
6. can begin with documentation-only or repository-local static evidence;
7. does not require production mutation by default;
8. does not require secret disclosure;
9. has no overlapping active governance chain;
10. supports explicit human review and fail-closed outcomes.

## Immediate Reselection Exclusions

The immediate next-candidate set excludes:

- `GAP-024`, because it is accepted;
- `GAP-035`, because future reconsideration requires a new governance chain;
- `GAP-057`, because future runtime verification requires a new governance chain.

## Priority Factors

Preference should be given to blockers that:

- are `HIGH` and `BLOCKING`;
- affect multiple downstream readiness decisions;
- have repository-local static evidence potential;
- have a clear human decision point;
- do not duplicate a recently closed control chain.

## Selection State

`NO_NEXT_STRATEGIC_DEPENDENCY_SELECTED`
