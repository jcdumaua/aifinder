# AiFinder Phase 25VM — Revision CCLXXXVII — GAP-063 Remediation Evidence Source Criteria

## Purpose

Define the criteria that any future evidence source must satisfy before it can be considered for `GAP-063 / SEC-LR-011`.

## Required criteria

A future evidence source must:

1. Address the exact unresolved control claim.
2. Be attributable to a specific artifact, system boundary, or reviewed observation.
3. Have verifiable provenance.
4. Have a documented freshness or observation date.
5. Avoid exposing secrets, credentials, tokens, cookies, connection strings, project references, or environment values.
6. Avoid production mutation.
7. Distinguish design intent from deployed effectiveness.
8. Be narrow enough for independent review.
9. Have explicit stop conditions.
10. Preserve fail-closed behavior when ambiguous.

## Preferred source order

Future planning should prefer:

1. Existing committed repository-static evidence.
2. Inert local configuration or source inspection that does not execute code.
3. Redacted, non-secret platform evidence already produced through an approved process.
4. A separately governed runtime observation only when no safer source can satisfy the claim.

## Rejected source categories

Reject any source that is:

- Unattributed.
- Stale without a freshness record.
- Generated without provenance.
- Dependent on hidden environment values.
- Dependent on secret retrieval.
- Broader than the `GAP-063 / SEC-LR-011` claim.
- Capable of mutating production or user data.
- Ambiguous about current deployed state.
- Unable to be independently reviewed.

## Decision rule

No source category becomes authorized merely by appearing in this document. A later reviewed phase must select and approve one bounded source before any evidence acquisition occurs.

## Result

Evidence-source criteria are defined. No evidence source has been selected or accessed.
