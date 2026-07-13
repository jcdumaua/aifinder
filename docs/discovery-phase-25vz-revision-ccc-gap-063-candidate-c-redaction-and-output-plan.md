# AiFinder Phase 25VZ — Revision CCC — GAP-063 Candidate C Redaction and Output Plan

## Purpose

Define the redaction rules and output schema for a future Candidate C evidence package.

## Mandatory redactions

A future evidence package must remove or mask:

- Credentials.
- Tokens.
- Cookies.
- Secret values.
- Connection strings.
- Project references.
- Account identifiers not required for attribution.
- Personal information.
- Internal URLs containing sensitive identifiers.
- Raw request or response bodies.
- Environment-variable names when they reveal sensitive architecture.
- Any unrelated platform configuration.

## Required preserved fields

The redacted package should preserve only:

- Evidence package identifier.
- Candidate: `GAP-063 / SEC-LR-011`.
- Evidence source category.
- Observation timestamp.
- Platform product or surface name at a non-sensitive level.
- Control-state field or status.
- Read-only access attestation.
- Mutation count: zero.
- Redaction review status.
- Provenance statement.
- Reviewer disposition.
- Limitations.

## Output classification

Every preserved field must be marked as one of:

- `SAFE_TO_PRESERVE`
- `REDACTED`
- `REJECTED_SENSITIVE`
- `OUT_OF_SCOPE`
- `PROVENANCE_UNVERIFIED`

## Acceptance rule

The evidence package is acceptable for review only if:

1. No secret-like values remain.
2. No project reference remains.
3. Provenance and timestamp are preserved.
4. The control-state claim remains understandable after redaction.
5. The output is limited to the exact GAP-063 claim.
6. Mutation count is zero.
7. A second reviewer confirms the redaction.

## Current authorization state

- Platform access: `NOT_AUTHORIZED`
- Evidence acquisition: `NOT_AUTHORIZED`
- Screenshot or export creation: `NOT_AUTHORIZED`
- Runtime execution: `NOT_AUTHORIZED`
- Database access: `NOT_AUTHORIZED`

## Result

The future output and redaction requirements are planned. No evidence package has been created.
