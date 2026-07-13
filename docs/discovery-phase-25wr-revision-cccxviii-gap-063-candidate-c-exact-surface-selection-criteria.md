# AiFinder Phase 25WR — Revision CCCXVIII — GAP-063 Candidate C Exact Surface Selection Criteria

## Purpose

Define the criteria required to select an exact platform surface for future Candidate C evidence acquisition for `GAP-063 / SEC-LR-011`.

## Mandatory selection criteria

An exact surface may be selected only when it:

1. Directly displays the deployed state relevant to `SEC-LR-011`.
2. Is narrower than a general project-settings page.
3. Requires no write, toggle, save, deploy, rotate, regenerate, or test action.
4. Exposes no secret or environment values.
5. Does not require preserving a project reference.
6. Does not expose unrelated account, billing, user, deployment, or infrastructure data.
7. Supports a timestamped and attributable observation.
8. Supports minimal redacted capture.
9. Supports independent review.
10. Supports zero-mutation verification.
11. Can be described without exposing a URL, account identifier, or sensitive resource identifier.
12. Can be accessed using a proven read-only privilege context.

## Selection rejection criteria

Reject any candidate surface that:

- Requires broad administrative access.
- Mixes the control state with sensitive values.
- Requires database, SQL, runtime, or route access.
- Cannot isolate the exact `SEC-LR-011` field.
- Cannot be reviewed without revealing a project reference.
- Cannot prove that no mutation occurred.
- Depends on inferred rather than directly displayed state.

## Current selection state

- Platform product: `UNSELECTED`
- Exact surface: `UNSELECTED`
- Live resource: `UNSELECTED`
- Platform access: `NOT_AUTHORIZED`

## Result

Exact-surface selection criteria are defined. No exact platform surface is selected.
