# AiFinder Phase 25WB — Revision CCCII — GAP-063 Candidate C Acquisition Preconditions

## Purpose

Define the mandatory preconditions that must be satisfied before any future Candidate C evidence acquisition for `GAP-063 / SEC-LR-011`.

## Repository preconditions

A future acquisition phase must verify:

1. Repository path is `/Users/jamescarlodumaua/aifinder`.
2. Origin is the approved `jcdumaua/aifinder` repository.
3. Branch is `main`.
4. `HEAD` and `origin/main` match the approved acquisition-phase baseline.
5. Ahead and behind counts are both zero.
6. The working tree is clean.
7. No unrelated files are modified or staged.

## Governance preconditions

The future phase must also verify:

1. Candidate C remains the approved source category.
2. The evidence type remains platform-generated, attributable, timestamped, and redacted.
3. Platform access has received a separate explicit approval.
4. The exact platform surface has been independently reviewed.
5. The operator role is read-only or otherwise technically constrained from mutation.
6. The output schema and redaction rules are approved.
7. A second reviewer is available for redaction confirmation.
8. The stop conditions are accepted before access begins.

## Security preconditions

The future phase must prove that:

- No secret values are required.
- No environment values are required.
- No project reference needs to be preserved.
- No credential, token, cookie, connection string, or raw response body will be copied.
- No database, SQL, or production mutation is needed.
- No route or runtime execution is needed.
- The evidence can be captured without exposing unrelated platform configuration.

## Authorization state

- Platform access: `NOT_AUTHORIZED`
- Evidence acquisition: `NOT_AUTHORIZED`
- Screenshot or export creation: `NOT_AUTHORIZED`
- Runtime/database access: `NONE`

## Result

The preconditions are defined. No acquisition action is authorized.
