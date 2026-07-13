# AiFinder Phase 25VY — Revision CCXCIX — GAP-063 Candidate C Read-Only Access Boundary

## Purpose

Define the minimum read-only boundary that any future Candidate C acquisition plan must enforce.

## Required boundary

A future plan must require:

1. Read-only access only.
2. No configuration edits.
3. No toggles, saves, deployments, rotations, regenerations, or policy changes.
4. No database or SQL access.
5. No secret-store or environment-variable access.
6. No copying of credentials, tokens, cookies, connection strings, or project references.
7. No browser automation unless separately approved.
8. No API access unless separately approved.
9. No route invocation or application execution.
10. No production mutation.
11. Immediate stop if the evidence cannot be isolated from sensitive values.
12. Independent review before any captured output is accepted.

## Least-privilege requirement

The future operator must use the narrowest available read-only role. If the available role can modify settings, the plan must define how mutation risk is prevented and independently verified before access.

## Observation boundary

The permitted observation must be limited to the minimum platform surface needed to establish the exact Phase 25VP claim. Broader platform inspection is prohibited.

## Stop conditions

The future process must stop if:

- Authentication requires credential disclosure.
- The view exposes environment values or secrets.
- The evidence includes unredactable project identifiers.
- The operator must change state to reveal the evidence.
- The evidence cannot be timestamped or attributed.
- The platform surface is broader than the GAP-063 claim.
- Read-only status cannot be proven.

## Result

The read-only boundary is defined. Platform access remains `NOT_AUTHORIZED`.
