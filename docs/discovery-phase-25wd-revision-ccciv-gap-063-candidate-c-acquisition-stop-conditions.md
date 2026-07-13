# AiFinder Phase 25WD — Revision CCCIV — GAP-063 Candidate C Acquisition Stop Conditions

## Purpose

Define mandatory fail-closed stop conditions for any future Candidate C acquisition attempt.

## Immediate stop conditions

The future process must stop before capture if:

1. The platform or project identity cannot be verified safely.
2. Read-only access cannot be proven.
3. The operator can modify settings and no technical mutation barrier exists.
4. A secret, token, cookie, connection string, environment value, or project reference is visible.
5. The required evidence is mixed with unrelated sensitive configuration.
6. The evidence requires a toggle, save, deploy, rotation, regeneration, test, or runtime action.
7. The evidence requires database or SQL access.
8. The observation surface is broader than `GAP-063 / SEC-LR-011`.
9. Provenance or timestamp cannot be preserved.
10. Redaction would remove the meaning of the control-state evidence.
11. A second reviewer is unavailable.
12. Any unexpected platform state or permission boundary appears.

## Post-capture rejection conditions

Any captured evidence must be rejected if:

- Secret-like values remain.
- A project reference remains.
- The timestamp is missing.
- Provenance is ambiguous.
- Mutation count is not proven zero.
- The evidence does not directly address `SEC-LR-011`.
- The evidence is stale or from another environment.
- The evidence cannot be independently reviewed.
- The capture includes unrelated platform configuration.
- The control state is inferred rather than directly shown.

## Fail-closed disposition

A stopped or rejected attempt must:

- Preserve `GAP-063` as `UNRESOLVED`.
- Preserve blocker count at `62`.
- Produce no control-effectiveness claim.
- Produce no blocker reduction.
- Authorize no retry without a new reviewed gate.

## Result

The stop conditions are defined. No platform access or evidence acquisition is authorized.
