# AiFinder Phase 25WG — Revision CCCVII — GAP-063 Candidate C Operator and Reviewer Separation Plan

## Purpose

Define the separation of duties required for any future Candidate C evidence acquisition.

## Required roles

### Primary operator

The primary operator may, only after explicit authorization:

- Perform the approved read-only observation.
- Capture only the minimum approved evidence.
- Apply first-pass redaction.
- Record timestamp, provenance, and mutation count.
- Stop immediately when a stop condition appears.

The primary operator may not:

- Approve their own evidence.
- Change platform state.
- Access unrelated settings.
- Reveal credentials or secret values.
- Expand scope beyond `GAP-063 / SEC-LR-011`.

### Independent reviewer

The independent reviewer must:

- Verify the approved baseline and evidence package identity.
- Confirm no secret-like values remain.
- Confirm no project reference remains.
- Confirm mutation count is zero.
- Confirm the evidence directly addresses `SEC-LR-011`.
- Confirm provenance and timestamp.
- Reject ambiguous or over-broad evidence.
- Record an independent disposition.

## Separation rule

The same person or automated step must not both acquire and independently approve the final evidence package unless a later explicit governance exception is documented and reviewed.

## Handoff package

The operator-to-reviewer handoff must contain only:

- Redacted evidence.
- Evidence package identifier.
- Timestamp.
- Provenance statement.
- Mutation-count attestation.
- Scope statement.
- Limitations.
- No secret, credential, token, cookie, connection string, project reference, or environment value.

## Current authorization state

- Operator assigned: `NO`
- Independent reviewer assigned: `NO`
- Platform access: `NOT_AUTHORIZED`
- Evidence acquisition: `NOT_AUTHORIZED`

## Result

The separation-of-duties plan is defined. No operator or reviewer assignment authorizes execution.
