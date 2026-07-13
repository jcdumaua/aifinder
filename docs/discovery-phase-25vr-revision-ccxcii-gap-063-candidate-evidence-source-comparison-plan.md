# AiFinder Phase 25VR — Revision CCXCII — GAP-063 Candidate Evidence-Source Comparison Plan

## Purpose

Define how the Phase 25VQ candidate source categories must be compared before any single-source selection gate.

## Comparison criteria

Each candidate must be scored or classified against:

- Claim directness.
- Ability to distinguish implementation from design intent.
- Ability to demonstrate deployed effectiveness.
- Provenance quality.
- Freshness.
- Independent reviewability.
- Secret exposure risk.
- Environment-value exposure risk.
- Production mutation risk.
- Required privileges.
- Scope containment.
- Reproducibility.
- Fail-closed stop conditions.

## Ranking principle

The preferred candidate is the safest source that can satisfy the exact claim. Higher-risk runtime or platform evidence must not be preferred merely because it is more direct when a safer source can satisfy the claim.

## Mandatory rejection rules

Reject a candidate if it:

- Requires printing or copying secret values.
- Requires production mutation.
- Cannot be attributed to AiFinder.
- Cannot prove freshness.
- Produces evidence broader than `GAP-063 / SEC-LR-011`.
- Cannot be independently reviewed.
- Conflates design intent with deployed effectiveness.
- Requires an undefined or unbounded runtime method.
- Depends on ambiguous platform state.

## Planned next gate

A successor single-source selection gate may choose at most one candidate category. That gate must still leave evidence acquisition unauthorized until an independently reviewed acquisition plan exists.

## Current state

- Candidate source selection: `NOT_PERFORMED`
- Evidence acquisition: `NOT_AUTHORIZED`
- Runtime verification: `NOT_AUTHORIZED`
- GAP-063 state: `UNRESOLVED`
- Remaining blockers: `62`
