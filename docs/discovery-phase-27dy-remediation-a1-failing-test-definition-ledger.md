# AiFinder Phase 27DY — Remediation A1 Failing-Test Definition Ledger

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Existing Relevant Test Candidates
```text
testing/admin-rate-limit.test.mjs
testing/admin-shell-supabase-read-hardening.test.mjs
testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
```

## Planned Failing Tests
```text
A1-T01|logout unauthenticated request|must fail closed with 401 or 403|app/api/admin/logout/route.ts
A1-T02|logout invalid or expired session|must fail closed and must not clear unrelated cookies|app/api/admin/logout/route.ts
A1-T03|logout valid admin session|must clear only the approved admin session cookie with secure attributes|app/api/admin/logout/route.ts
A1-T04|logout logging safety|must not log cookie, token, session, or environment values|app/api/admin/logout/route.ts
A1-T05|session unauthenticated request|must fail closed with 401 or 403|app/api/admin/session/route.ts
A1-T06|session non-admin authenticated user|must fail closed with 403|app/api/admin/session/route.ts
A1-T07|session valid admin|must return only bounded non-sensitive session metadata|app/api/admin/session/route.ts
A1-T08|session cache behavior|must send private/no-store cache controls|app/api/admin/session/route.ts
A1-T09|auth helper invalid session|must return a fail-closed result without permissive fallback|lib/admin-auth.ts
A1-T10|auth helper role enforcement|must require the approved admin role before success|lib/admin-auth.ts
A1-T11|auth helper logging safety|must not emit session, token, cookie, or environment values|lib/admin-auth.ts
A1-T12|cross-route consistency|logout and session routes must use the same approved verification primitive|cross-file
```

Each row is `test-id|scenario|required outcome|target`.

## Test-First Rule
The later implementation phase must:
1. add or update only the approved focused tests;
2. demonstrate that the new tests fail against the approved pre-patch baseline;
3. apply the narrow patch;
4. demonstrate that the focused tests pass;
5. run only separately authorized static checks/tests;
6. avoid application startup, live database access, or external services.
