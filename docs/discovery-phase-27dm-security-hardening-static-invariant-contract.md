# AiFinder Phase 27DM — Security Hardening Static Invariant Contract

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Global Invariants

Every reviewed surface must satisfy applicable invariants:

1. **Fail-closed authorization**
   - absent, invalid, expired, or insufficient authorization denies access;
   - no permissive fallback.

2. **Server-only privilege**
   - service-role credentials and privileged clients remain server-only;
   - no client-component import path or serialized exposure.

3. **Admin session integrity**
   - admin routes and actions rely on a single approved verification path;
   - role checks occur before privileged reads or mutations.

4. **Mutation discipline**
   - mutations are explicit, bounded, authenticated, authorized, and auditable;
   - no hidden write in read-only or preview flows.

5. **Secret-safe logging**
   - no token, cookie, session, credential, environment value, database URL, row payload, or raw privileged response is logged.

6. **Middleware and proxy safety**
   - routing boundaries deny by default;
   - redirects and forwarded headers do not weaken authorization.

7. **Dormant harness isolation**
   - no production path imports or invokes draft runtime-chain artifacts;
   - harness activation requires a new explicit governance phase.

8. **Testing safety**
   - tests and smoke scripts do not mutate production systems;
   - live execution requires separate authorization and bounded fixtures.

## Tier-Specific Acceptance

### Critical Hardening
- manual source review required;
- explicit authorization and mutation-flow trace;
- service-role boundary verification;
- logging and error-path verification;
- separate remediation authorization before code changes.

### Standard Hardening
- static guard and import-boundary review;
- UI actions mapped to authorized server actions/routes;
- no client-side privilege assumptions.

### Testing Hardening
- target environment and mutation behavior documented;
- production/live defaults fail closed;
- secrets and raw outputs remain suppressed.
