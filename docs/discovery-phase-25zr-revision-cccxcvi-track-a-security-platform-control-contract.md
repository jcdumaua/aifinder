# AiFinder Phase 25ZR — Revision CCCXCVI — Track A Security/Platform Control Contract

## Mandatory controls

1. **Exact target**
   - One explicitly named operation per later gate.
   - No wildcard or open-ended access.

2. **Minimum privilege**
   - Read-only by default.
   - The narrowest non-secret role or capability documented.
   - Mutation requires a separate reviewed gate.

3. **Secret protection**
   - No credential, token, cookie, connection string, environment value, or secret-store content may be printed.
   - Governance artifacts may record only non-secret metadata.

4. **Network boundary**
   - No external request before an approved execution gate.
   - Exact host or service category must be defined later without exposing private targets.

5. **Data boundary**
   - No row data, response bodies, screenshots, exports, or sensitive payloads unless separately approved.
   - Metadata-only output preferred.

6. **Auditability**
   - Record operation type, scope, count, status, and stop reason.
   - Preserve original exit status.
   - Fail closed on ambiguity.

7. **Stop conditions**
   - Unexpected target.
   - Unexpected privilege.
   - Secret-like output.
   - Mutation capability where read-only was expected.
   - Scope count mismatch.
   - Network or platform redirect.
   - Unreviewed dependency.

8. **Independent review**
   - Required before every live operation.
   - Required again before any mutation or production effect.

## Current authorization

- Credential use: `NOT_AUTHORIZED`
- Platform access: `NOT_AUTHORIZED`
- Runtime execution: `NOT_AUTHORIZED`
- Production action: `NOT_AUTHORIZED`
- Database access: `NOT_AUTHORIZED`
- Deployment: `NOT_AUTHORIZED`

## Result

`TRACK_A_CONTROL_CONTRACT_DEFINED`
