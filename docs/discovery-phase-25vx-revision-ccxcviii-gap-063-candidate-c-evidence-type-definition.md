# AiFinder Phase 25VX — Revision CCXCVIII — GAP-063 Candidate C Evidence Type Definition

## Purpose

Define the exact Candidate C evidence type that a later separately approved process could acquire for `GAP-063 / SEC-LR-011`.

## Selected source category

- Category: `CANDIDATE_C_REDACTED_PLATFORM_GENERATED_EVIDENCE`
- Selection level: `CATEGORY_ONLY`
- Platform accessed: `NO`
- Evidence acquired: `NO`

## Required evidence type

The preferred evidence type is a timestamped, attributable, read-only platform-generated representation of the deployed `SEC-LR-011` control state that:

1. Identifies the relevant control without exposing secret values.
2. Identifies the AiFinder deployment boundary without exposing a project reference or credential.
3. Shows current deployed configuration or status.
4. Preserves provenance and observation time.
5. Can be independently reviewed.
6. Can be redacted before preservation.
7. Requires no production mutation.
8. Does not rely on runtime execution.

## Acceptable representation categories

A later acquisition plan may choose one of:

- A redacted platform settings export.
- A redacted platform-generated status view.
- A redacted screenshot produced through an approved read-only process.
- A platform-generated audit or configuration record that contains no secret values.

## Unacceptable representations

The evidence type must reject:

- Raw API responses containing identifiers or sensitive values.
- Environment-variable listings.
- Secret-store views.
- Credential-bearing screenshots.
- Database connection details.
- Unattributed copied text.
- Manually reconstructed evidence.
- Evidence lacking a timestamp or provenance.
- Evidence requiring a write, toggle, save, deploy, or mutation action.

## Result

The Candidate C evidence type is defined at a category level only. No platform target or acquisition method is authorized.
